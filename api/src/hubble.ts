/*
 * Copyright 2026 The KubeLB Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

// Hubble Relay only speaks gRPC. The client is built lazily from the vendored
// observer/flow protos. Relay commonly disables server TLS (serving plaintext
// to clients); mTLS certs, when required, are supplied via config.
//
// TLS material comes from one of two places: file paths (ca/cert/key) when set
// via env vars, or in-memory PEM buffers (caData/certData/keyData) when read
// from a Secret during auto-discovery. When both are present, buffers win.
export interface HubbleTLS {
  ca?: string;
  cert?: string;
  key?: string;
  caData?: Buffer;
  certData?: Buffer;
  keyData?: Buffer;
  serverNameOverride?: string;
}

export interface HubbleOptions {
  address: string;
  tls?: HubbleTLS;
}

interface FlowEndpoint {
  name: string;
  namespace: string;
  kind: string;
}

export interface L7Http {
  method: string;
  path: string;
  status?: number;
}

export interface Flow {
  source: FlowEndpoint;
  destination: FlowEndpoint;
  protocol: string;
  port: number;
  verdict: string;
  l7?: string;
  l7http?: L7Http;
  time: string;
}

export interface GraphNode {
  id: string;
  name: string;
  namespace: string;
  kind: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  connections: number;
  verdict: string;
}

export interface FlowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface RawEndpoint {
  namespace?: string;
  pod_name?: string;
  labels?: string[];
  workloads?: { name?: string; kind?: string }[];
  identity?: number;
}

interface RawFlow {
  time?: { seconds?: string };
  verdict?: string;
  l4?: {
    protocol?: string;
    TCP?: { destination_port?: number; source_port?: number };
    UDP?: { destination_port?: number; source_port?: number };
  };
  l7?: { type?: string; http?: { method?: string; url?: string; code?: number } };
  source?: RawEndpoint;
  destination?: RawEndpoint;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let cachedClient: any;
let cachedKey = "";

function loadObserver() {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "hubble/proto");
  const def = protoLoader.loadSync("observer/observer.proto", {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
    includeDirs: [dir],
  });
  return grpc.loadPackageDefinition(def) as any;
}

function getClient(opts: HubbleOptions): any {
  const key = JSON.stringify(opts);
  if (cachedClient && cachedKey === key) return cachedClient;
  const pkg = loadObserver();
  let creds: grpc.ChannelCredentials;
  const channelOpts: Record<string, string> = {};
  if (opts.tls) {
    const ca = opts.tls.caData ?? (opts.tls.ca ? readFileSync(opts.tls.ca) : null);
    const key = opts.tls.keyData ?? (opts.tls.key ? readFileSync(opts.tls.key) : null);
    const cert = opts.tls.certData ?? (opts.tls.cert ? readFileSync(opts.tls.cert) : null);
    creds = grpc.credentials.createSsl(ca, key, cert);
    if (opts.tls.serverNameOverride) {
      channelOpts["grpc.ssl_target_name_override"] = opts.tls.serverNameOverride;
      channelOpts["grpc.default_authority"] = opts.tls.serverNameOverride;
    }
  } else {
    creds = grpc.credentials.createInsecure();
  }
  cachedClient = new pkg.observer.Observer(opts.address, creds, channelOpts);
  cachedKey = key;
  return cachedClient;
}

// Drop the cached channel so the next call reconnects — the relay may have
// restarted or the connection gone stale.
function resetClient(): void {
  if (cachedClient?.close) cachedClient.close();
  cachedClient = undefined;
  cachedKey = "";
}

function endpoint(ep: RawEndpoint | undefined): FlowEndpoint {
  if (!ep) return { name: "unknown", namespace: "", kind: "unknown" };
  const workload = ep.workloads?.[0];
  const reserved = ep.labels?.find((l) => l.startsWith("reserved:"))?.slice("reserved:".length);
  const name = workload?.name || ep.pod_name || reserved || `identity-${String(ep.identity ?? 0)}`;
  const kind = workload?.kind || (ep.pod_name ? "Pod" : reserved ? "reserved" : "unknown");
  return { name, namespace: ep.namespace ?? "", kind };
}

function httpPath(url: string | undefined): string {
  if (!url) return "";
  const m = /^[a-z]+:\/\/[^/]+(\/.*)?$/i.exec(url);
  return m ? (m[1] ?? "/") : url;
}

function mapFlow(raw: RawFlow): Flow {
  const l4 = raw.l4?.TCP ?? raw.l4?.UDP;
  const http = raw.l7?.http;
  return {
    source: endpoint(raw.source),
    destination: endpoint(raw.destination),
    protocol: raw.l4?.protocol ?? "",
    port: l4?.destination_port ?? 0,
    verdict: raw.verdict ?? "",
    l7: raw.l7?.type,
    l7http: http?.method
      ? { method: http.method, path: httpPath(http.url), status: http.code || undefined }
      : undefined,
    time: raw.time?.seconds ? new Date(Number(raw.time.seconds) * 1000).toISOString() : "",
  };
}

export interface FlowQuery {
  /** Time window in seconds. When set, flows are fetched for [now - windowSeconds, now]. */
  windowSeconds?: number;
  /** Hard cap on returned flows — bounds memory and, in windowed mode, stream length. */
  limit?: number;
  timeoutMs?: number;
}

// `since` and `number` are mutually exclusive in the Observer API: a windowed query
// streams the whole interval, so `limit` is enforced client-side as a ceiling.
export function buildFlowRequest(
  windowSeconds: number | undefined,
  limit: number,
  nowSeconds: number,
): { since: { seconds: number } } | { number: number } {
  return windowSeconds && windowSeconds > 0
    ? { since: { seconds: nowSeconds - windowSeconds } }
    : { number: limit };
}

export function getFlows(opts: HubbleOptions, query: FlowQuery = {}): Promise<Flow[]> {
  const { windowSeconds, limit = 500, timeoutMs = 8000 } = query;
  return new Promise((resolve, reject) => {
    const client = getClient(opts);
    const flows: Flow[] = [];
    const request = buildFlowRequest(windowSeconds, limit, Math.floor(Date.now() / 1000));
    const call = client.GetFlows(request);
    const timer = setTimeout(() => {
      call.cancel();
      resolve(flows);
    }, timeoutMs);
    call.on("data", (res: { flow?: RawFlow }) => {
      if (res.flow) flows.push(mapFlow(res.flow));
      if (flows.length >= limit) {
        clearTimeout(timer);
        call.cancel();
        resolve(flows);
      }
    });
    call.on("end", () => {
      clearTimeout(timer);
      resolve(flows);
    });
    call.on("error", (err: Error) => {
      clearTimeout(timer);
      resetClient();
      reject(err);
    });
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const TRAFFIC_WINDOWS = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
} as const;

export type TrafficWindow = keyof typeof TRAFFIC_WINDOWS;

export function resolveWindowSeconds(window: string | undefined): number | undefined {
  return window && window in TRAFFIC_WINDOWS ? TRAFFIC_WINDOWS[window as TrafficWindow] : undefined;
}

/** Keep only flows that touch the given namespace on either end. */
export function filterFlowsByNamespace(flows: Flow[], namespace: string): Flow[] {
  return flows.filter(
    (f) => f.source.namespace === namespace || f.destination.namespace === namespace,
  );
}

function nodeId(e: FlowEndpoint): string {
  return `${e.namespace}/${e.name}`;
}

export function buildFlowGraph(flows: Flow[]): FlowGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  for (const f of flows) {
    const from = nodeId(f.source);
    const to = nodeId(f.destination);
    if (!nodes.has(from)) nodes.set(from, { id: from, ...f.source });
    if (!nodes.has(to)) nodes.set(to, { id: to, ...f.destination });
    const key = `${from}|${to}`;
    const edge = edges.get(key);
    if (edge) {
      edge.connections += 1;
      edge.verdict = f.verdict;
    } else {
      edges.set(key, { from, to, connections: 1, verdict: f.verdict });
    }
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export async function detectHubble(opts: HubbleOptions | null): Promise<boolean> {
  if (!opts?.address) return false;
  try {
    await getFlows(opts, { limit: 1, timeoutMs: 4000 });
    return true;
  } catch {
    return false;
  }
}

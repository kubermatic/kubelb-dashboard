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

import { http, HttpResponse } from "msw";

const NODES = [
  { id: "/world", name: "world", namespace: "", kind: "reserved" },
  {
    id: "tenant-primary/web-frontend",
    name: "web-frontend",
    namespace: "tenant-primary",
    kind: "Deployment",
  },
  {
    id: "tenant-primary/api-gateway",
    name: "api-gateway",
    namespace: "tenant-primary",
    kind: "Deployment",
  },
  {
    id: "tenant-secondary/staging-web",
    name: "staging-web",
    namespace: "tenant-secondary",
    kind: "Deployment",
  },
  { id: "kube-system/coredns", name: "coredns", namespace: "kube-system", kind: "Deployment" },
  { id: "/kube-apiserver", name: "kube-apiserver", namespace: "", kind: "reserved" },
];

const EDGES = [
  { from: "/world", to: "tenant-primary/web-frontend", connections: 128, verdict: "FORWARDED" },
  { from: "/world", to: "tenant-primary/api-gateway", connections: 74, verdict: "FORWARDED" },
  {
    from: "tenant-primary/web-frontend",
    to: "tenant-primary/api-gateway",
    connections: 53,
    verdict: "FORWARDED",
  },
  {
    from: "tenant-primary/api-gateway",
    to: "kube-system/coredns",
    connections: 22,
    verdict: "FORWARDED",
  },
  { from: "/world", to: "tenant-secondary/staging-web", connections: 19, verdict: "FORWARDED" },
  {
    from: "tenant-secondary/staging-web",
    to: "/kube-apiserver",
    connections: 6,
    verdict: "DROPPED",
  },
];

function ep(id: string) {
  const n = NODES.find((x) => x.id === id)!;
  return { name: n.name, namespace: n.namespace, kind: n.kind };
}

const HTTP = [
  { method: "GET", path: "/api/v1/users", status: 200 },
  { method: "POST", path: "/api/v1/login", status: 401 },
  { method: "GET", path: "/healthz", status: 200 },
];

export const trafficHandlers = [
  http.get("/api/traffic/sources", () =>
    HttpResponse.json({ hubble: { available: true, source: "hubble" } }),
  ),
  http.get("/api/traffic/graph", ({ request }) => {
    const ns = new URL(request.url).searchParams.get("namespace");
    if (!ns) return HttpResponse.json({ nodes: NODES, edges: EDGES });
    const edges = EDGES.filter((e) => ep(e.from).namespace === ns || ep(e.to).namespace === ns);
    const ids = new Set(edges.flatMap((e) => [e.from, e.to]));
    return HttpResponse.json({ nodes: NODES.filter((n) => ids.has(n.id)), edges });
  }),
  http.get("/api/traffic/flows", () => {
    const now = Date.now();
    const flows = EDGES.flatMap((e, i) =>
      Array.from({ length: Math.min(3, Math.ceil(e.connections / 40)) }, (_, j) => {
        const port = [80, 443, 8080, 6443][(i + j) % 4];
        const http7 = port !== 6443 ? HTTP[(i + j) % HTTP.length] : undefined;
        return {
          source: ep(e.from),
          destination: ep(e.to),
          protocol: "TCP",
          port,
          verdict: e.verdict,
          l7: http7 ? "http" : undefined,
          l7http: http7,
          time: new Date(now - (i * 3 + j) * 1500).toISOString(),
        };
      }),
    );
    return HttpResponse.json({ flows });
  }),
];

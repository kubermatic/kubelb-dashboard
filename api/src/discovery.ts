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

// Auto-discovery of observability backends. When the operator hasn't set an
// explicit address, the dashboard finds the in-cluster Hubble Relay / Prometheus
// itself so traffic and metrics work with zero config. Discovery goes through
// Services (never Pods) so it needs no RBAC beyond what the dashboard already has
// (services/secrets/namespaces, cluster-wide read). Every path fails closed.

import type { CoreV1Api, V1Service } from "@kubernetes/client-node";
import { detectPrometheus } from "./metrics.js";
import type { HubbleOptions } from "./hubble.js";

const HUBBLE_RELAY_LABEL = "k8s-app=hubble-relay";
const HUBBLE_RELAY_NAME = "hubble-relay";
const HUBBLE_CERT_SECRET = "hubble-relay-client-certs";
// Fallback namespaces to probe by name when the relay Service carries no label.
const HUBBLE_FALLBACK_NAMESPACES = ["kube-system", "cilium"];

async function findHubbleService(core: CoreV1Api): Promise<V1Service | null> {
  const list = await core.listServiceForAllNamespaces({ labelSelector: HUBBLE_RELAY_LABEL });
  if (list.items.length > 0) return list.items[0];
  for (const namespace of HUBBLE_FALLBACK_NAMESPACES) {
    try {
      return await core.readNamespacedService({ name: HUBBLE_RELAY_NAME, namespace });
    } catch {
      // not in this namespace — keep looking
    }
  }
  return null;
}

async function loadHubbleTLS(
  core: CoreV1Api,
  namespace: string,
  serviceName: string,
): Promise<NonNullable<HubbleOptions["tls"]> | null> {
  try {
    const secret = await core.readNamespacedSecret({ name: HUBBLE_CERT_SECRET, namespace });
    const data = secret.data ?? {};
    const ca = data["ca.crt"];
    const cert = data["tls.crt"];
    const key = data["tls.key"];
    if (!ca || !cert || !key) return null;
    return {
      caData: Buffer.from(ca, "base64"),
      certData: Buffer.from(cert, "base64"),
      keyData: Buffer.from(key, "base64"),
      serverNameOverride: `${serviceName}.${namespace}.svc.cluster.local`,
    };
  } catch {
    return null;
  }
}

// Discover the Hubble Relay Service and return connection options, or null if
// none is found (or TLS is required but its certs are unreadable). A service
// port of 443 is treated as mTLS; anything else as plaintext.
export async function discoverHubble(core: CoreV1Api): Promise<HubbleOptions | null> {
  try {
    const svc = await findHubbleService(core);
    const namespace = svc?.metadata?.namespace;
    const name = svc?.metadata?.name;
    if (!svc || !namespace || !name) return null;

    // Prefer the gRPC port by name/targetPort — a relay may also expose a metrics
    // port, and ports[0] isn't guaranteed to be the gRPC one. TLS is inferred from
    // the port (443 → mTLS): the relay's server-TLS setting lives in a ConfigMap,
    // which discovery deliberately doesn't read (would need extra RBAC). A relay
    // serving TLS on a non-443 port needs an explicit HUBBLE_RELAY_ADDRESS.
    const ports = svc.spec?.ports ?? [];
    const grpcPort = ports.find((p) => p.name === "grpc" || p.targetPort === "grpc");
    const servicePort = (grpcPort ?? ports[0])?.port ?? 80;
    const address = `${name}.${namespace}.svc:${servicePort}`;

    if (servicePort === 443) {
      const tls = await loadHubbleTLS(core, namespace, name);
      if (!tls) return null;
      return { address, tls };
    }
    return { address };
  } catch {
    return null;
  }
}

interface PromCandidate {
  namespace: string;
  service: string;
  // 0 → use the Service's first declared port.
  port: number;
  // Sub-path for the Prometheus HTTP API (e.g. VictoriaMetrics vmselect).
  basePath: string;
}

// Ordered list of where Prometheus-compatible services commonly live. The first
// candidate that both exists and exposes the Envoy series the UI needs wins.
export const WELL_KNOWN_PROMETHEUS: PromCandidate[] = [
  {
    namespace: "monitoring",
    service: "kube-prometheus-stack-prometheus",
    port: 9090,
    basePath: "",
  },
  {
    namespace: "monitoring",
    service: "prometheus-kube-prometheus-prometheus",
    port: 9090,
    basePath: "",
  },
  { namespace: "monitoring", service: "prometheus-operated", port: 9090, basePath: "" },
  { namespace: "monitoring", service: "prometheus", port: 9090, basePath: "" },
  { namespace: "monitoring", service: "prometheus-server", port: 0, basePath: "" },
  { namespace: "prometheus", service: "prometheus-server", port: 0, basePath: "" },
  { namespace: "observability", service: "prometheus-server", port: 0, basePath: "" },
  { namespace: "monitoring", service: "vmselect", port: 8481, basePath: "/select/0/prometheus" },
  {
    namespace: "victoria-metrics",
    service: "vmselect",
    port: 8481,
    basePath: "/select/0/prometheus",
  },
  { namespace: "kube-system", service: "prometheus", port: 9090, basePath: "" },
];

// Probe well-known Prometheus locations and return the first URL that responds
// with the Envoy series the metrics UI queries, or null. detectPrometheus fails
// closed, so unreachable or irrelevant candidates are skipped.
export async function discoverPrometheus(core: CoreV1Api): Promise<string | null> {
  for (const candidate of WELL_KNOWN_PROMETHEUS) {
    let svc: V1Service;
    try {
      svc = await core.readNamespacedService({
        name: candidate.service,
        namespace: candidate.namespace,
      });
    } catch {
      continue;
    }
    const port = candidate.port || svc.spec?.ports?.[0]?.port;
    if (!port) continue;
    const url = `http://${candidate.service}.${candidate.namespace}.svc:${port}${candidate.basePath}`;
    if (await detectPrometheus(url)) return url;
  }
  return null;
}

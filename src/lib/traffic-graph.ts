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

import type { Addresses, LoadBalancer } from "@/types/kubelb";

// Tenant-distinct palette, readable on light and dark.
const TENANT_COLORS = [
  "#3db8e5",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
];

export function tenantColor(namespace: string, namespaces: string[]): string {
  const i = namespaces.indexOf(namespace);
  return TENANT_COLORS[(i < 0 ? 0 : i) % TENANT_COLORS.length];
}

export type TrafficNodeKind = "internet" | "loadbalancer" | "backend";

export interface TrafficNode {
  id: string;
  kind: TrafficNodeKind;
  label: string;
  sub?: string;
  /** Tenant namespace, for grouping/coloring. Absent on the internet node. */
  namespace?: string;
}

export interface TrafficEdge {
  from: string;
  to: string;
}

export interface TrafficGraph {
  nodes: TrafficNode[];
  edges: TrafficEdge[];
  /** Tenant namespaces present, in stable order — for the legend and colors. */
  namespaces: string[];
}

const INTERNET_ID = "internet";

/**
 * Derive a traffic-flow graph from KubeLB LoadBalancers:
 * Internet → LoadBalancer (per tenant) → backend endpoints.
 * Structure comes purely from the KubeLB resource model — no metrics or eBPF.
 */
export function buildTrafficGraph(
  loadBalancers: LoadBalancer[],
  addresses: Addresses[] = [],
  tenantFilter?: string,
): TrafficGraph {
  const lbs = tenantFilter
    ? loadBalancers.filter((lb) => lb.metadata.namespace === tenantFilter)
    : loadBalancers;

  // Resolve endpoint `addressesReference` (name in the LB's namespace) to IPs.
  const addressPool = new Map<string, string[]>();
  for (const a of addresses) {
    const ips = (a.spec.addresses ?? []).map((x) => x.ip).filter(Boolean);
    addressPool.set(`${a.metadata.namespace ?? ""}/${a.metadata.name}`, ips);
  }

  const nodes: TrafficNode[] = [];
  const edges: TrafficEdge[] = [];
  const namespaces = new Set<string>();

  for (const lb of lbs) {
    const ns = lb.metadata.namespace ?? "";
    const lbId = `lb/${ns}/${lb.metadata.name}`;
    namespaces.add(ns);

    nodes.push({
      id: lbId,
      kind: "loadbalancer",
      label: lb.metadata.name,
      sub: lb.spec.type ?? "LoadBalancer",
      namespace: ns,
    });
    edges.push({ from: INTERNET_ID, to: lbId });

    const seen = new Set<string>();
    for (const ep of lb.spec.endpoints ?? []) {
      const portLabel = (ep.ports ?? [])
        .map((p) => `${String(p.port)}/${p.protocol ?? "TCP"}`)
        .join(", ");
      const inline = (ep.addresses ?? []).map((a) => a.ip || a.hostname || "").filter(Boolean);
      const referenced = ep.addressesReference
        ? (addressPool.get(`${ns}/${ep.addressesReference.name}`) ?? [])
        : [];
      for (const target of [...inline, ...referenced]) {
        const beId = `be/${ns}/${lb.metadata.name}/${target}`;
        if (seen.has(beId)) continue;
        seen.add(beId);
        nodes.push({
          id: beId,
          kind: "backend",
          label: target,
          sub: portLabel || undefined,
          namespace: ns,
        });
        edges.push({ from: lbId, to: beId });
      }
    }
  }

  if (nodes.length > 0) {
    nodes.unshift({ id: INTERNET_ID, kind: "internet", label: "Internet" });
  }

  return { nodes, edges, namespaces: [...namespaces].sort() };
}

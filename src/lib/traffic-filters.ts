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

import type { TrafficEndpoint, TrafficFlow, TrafficGraphData, TrafficNode } from "@/api/traffic";

export type VerdictFilter = "all" | "forwarded" | "dropped";
export type TrafficScope = "all" | "kubelb";

export interface TrafficFilters {
  minConnections: number;
  hideSystem: boolean;
  hideExternal: boolean;
  aggregateExternal: boolean;
  hiddenNamespaces: string[];
  verdict: VerdictFilter;
  scope: TrafficScope;
  maxNodes: number;
}

export const DEFAULT_MAX_NODES = 60;

export const DEFAULT_FILTERS: TrafficFilters = {
  minConnections: 0,
  hideSystem: true,
  hideExternal: false,
  aggregateExternal: true,
  hiddenNamespaces: [],
  verdict: "all",
  scope: "all",
  maxNodes: DEFAULT_MAX_NODES,
};

/** A KubeLB data-plane endpoint: a tenant namespace or a managed Envoy workload. */
export function isKubeLB(namespace: string, name: string): boolean {
  return namespace.startsWith("tenant-") || name.startsWith("envoy-");
}

function matchesVerdict(verdict: string, filter: VerdictFilter): boolean {
  if (filter === "all") return true;
  if (filter === "dropped") return /DROPPED|ERROR/i.test(verdict);
  return !/DROPPED|ERROR/i.test(verdict);
}

const SYSTEM_NAMESPACES = new Set([
  "kube-system",
  "kube-public",
  "kube-node-lease",
  "cilium",
  "gmp-system",
  "gke-managed-system",
  "gke-managed-cim",
]);

const SYSTEM_RESERVED = new Set(["host", "remote-node", "health", "init", "kube-apiserver"]);
const EXTERNAL_NAMES = new Set(["world", "unknown"]);
const WORLD_ID = "/world";

function isSystem(ns: string, name: string): boolean {
  return SYSTEM_NAMESPACES.has(ns) || (ns === "" && SYSTEM_RESERVED.has(name));
}

function isExternal(ns: string, name: string): boolean {
  return ns === "" && EXTERNAL_NAMES.has(name);
}

/** True if the endpoint is hidden by the current filters (system/external/namespace). */
export function isEndpointHidden(e: TrafficEndpoint, f: TrafficFilters): boolean {
  if (f.hideSystem && isSystem(e.namespace, e.name)) return true;
  if (f.hideExternal && isExternal(e.namespace, e.name)) return true;
  if (f.hiddenNamespaces.includes(e.namespace)) return true;
  return false;
}

function endpointOf(n: TrafficNode): TrafficEndpoint {
  return { name: n.name, namespace: n.namespace, kind: n.kind };
}

export interface FilteredGraph extends TrafficGraphData {
  /** Node count before the top-N cap, so the UI can report "showing top N of M". */
  totalNodes: number;
}

export function applyGraphFilters(graph: TrafficGraphData, f: TrafficFilters): FilteredGraph {
  const remap = (id: string): string => {
    if (!f.aggregateExternal) return id;
    const node = graph.nodes.find((n) => n.id === id);
    return node && isExternal(node.namespace, node.name) ? WORLD_ID : id;
  };

  const kept = new Map<string, TrafficNode>();
  for (const n of graph.nodes) {
    if (isEndpointHidden(endpointOf(n), f)) continue;
    const id = remap(n.id);
    if (id === WORLD_ID && !kept.has(WORLD_ID)) {
      kept.set(WORLD_ID, { id: WORLD_ID, name: "world", namespace: "", kind: "reserved" });
    } else if (!kept.has(id)) {
      kept.set(id, n);
    }
  }

  const isKubeLBNode = (id: string): boolean => {
    const n = kept.get(id);
    return n ? isKubeLB(n.namespace, n.name) : false;
  };

  const edgeAgg = new Map<
    string,
    { from: string; to: string; connections: number; verdict: string }
  >();
  for (const e of graph.edges) {
    const from = remap(e.from);
    const to = remap(e.to);
    if (from === to || !kept.has(from) || !kept.has(to)) continue;
    if (f.scope === "kubelb" && !isKubeLBNode(from) && !isKubeLBNode(to)) continue;
    const key = `${from}|${to}`;
    const prev = edgeAgg.get(key);
    if (prev) prev.connections += e.connections;
    else edgeAgg.set(key, { from, to, connections: e.connections, verdict: e.verdict });
  }

  let edges = [...edgeAgg.values()].filter((e) => e.connections >= f.minConnections);
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  let nodes = [...kept.values()].filter((n) => connected.has(n.id));
  const totalNodes = nodes.length;

  if (nodes.length > f.maxNodes) {
    const weight = new Map<string, number>();
    for (const e of edges) {
      weight.set(e.from, (weight.get(e.from) ?? 0) + e.connections);
      weight.set(e.to, (weight.get(e.to) ?? 0) + e.connections);
    }
    const top = new Set(
      [...nodes]
        .sort((a, b) => (weight.get(b.id) ?? 0) - (weight.get(a.id) ?? 0))
        .slice(0, f.maxNodes)
        .map((n) => n.id),
    );
    nodes = nodes.filter((n) => top.has(n.id));
    edges = edges.filter((e) => top.has(e.from) && top.has(e.to));
  }

  return { nodes, edges, totalNodes };
}

export function applyFlowFilters(
  flows: TrafficFlow[],
  f: TrafficFilters,
  search: string,
): TrafficFlow[] {
  const q = search.trim().toLowerCase();
  return flows.filter((fl) => {
    if (isEndpointHidden(fl.source, f) || isEndpointHidden(fl.destination, f)) return false;
    if (
      f.scope === "kubelb" &&
      !isKubeLB(fl.source.namespace, fl.source.name) &&
      !isKubeLB(fl.destination.namespace, fl.destination.name)
    )
      return false;
    if (!matchesVerdict(fl.verdict, f.verdict)) return false;
    if (!q) return true;
    const hay =
      `${fl.source.namespace}/${fl.source.name} ${fl.destination.namespace}/${fl.destination.name} ${fl.verdict} ${fl.protocol} ${fl.l7 ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

/** Namespaces present in the graph, for the namespace toggle list. */
export function graphNamespaces(graph: TrafficGraphData): string[] {
  return [...new Set(graph.nodes.map((n) => n.namespace).filter(Boolean))].sort();
}

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

import { describe, expect, it } from "vitest";
import {
  applyFlowFilters,
  applyGraphFilters,
  DEFAULT_FILTERS,
  type TrafficFilters,
} from "@/lib/traffic-filters";
import type { TrafficFlow, TrafficGraphData } from "@/api/traffic";

const graph: TrafficGraphData = {
  nodes: [
    { id: "/world", name: "world", namespace: "", kind: "reserved" },
    { id: "/1.2.3.4", name: "unknown", namespace: "", kind: "reserved" },
    { id: "app/web", name: "web", namespace: "app", kind: "Deployment" },
    { id: "app/api", name: "api", namespace: "app", kind: "Deployment" },
    { id: "kube-system/coredns", name: "coredns", namespace: "kube-system", kind: "Deployment" },
  ],
  edges: [
    { from: "/world", to: "app/web", connections: 200, verdict: "FORWARDED" },
    { from: "/1.2.3.4", to: "app/web", connections: 50, verdict: "FORWARDED" },
    { from: "app/web", to: "app/api", connections: 30, verdict: "FORWARDED" },
    { from: "app/api", to: "kube-system/coredns", connections: 12, verdict: "FORWARDED" },
  ],
};

function filters(patch: Partial<TrafficFilters>): TrafficFilters {
  return { ...DEFAULT_FILTERS, hideSystem: false, aggregateExternal: false, ...patch };
}

describe("applyGraphFilters", () => {
  it("hides system namespaces when hideSystem is on", () => {
    const g = applyGraphFilters(graph, filters({ hideSystem: true }));
    expect(g.nodes.some((n) => n.namespace === "kube-system")).toBe(false);
  });

  it("drops edges below the connection threshold and orphaned nodes", () => {
    const g = applyGraphFilters(graph, filters({ minConnections: 100 }));
    // only /world → app/web (200) survives; coredns/api/unknown drop out
    expect(g.edges).toHaveLength(1);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["/world", "app/web"]);
  });

  it("aggregates external endpoints into a single world node", () => {
    const g = applyGraphFilters(graph, filters({ aggregateExternal: true }));
    const externals = g.nodes.filter((n) => n.namespace === "");
    expect(externals).toHaveLength(1);
    expect(externals[0].id).toBe("/world");
    // world→web edge merges the two external sources (200 + 50)
    const worldWeb = g.edges.find((e) => e.from === "/world" && e.to === "app/web");
    expect(worldWeb?.connections).toBe(250);
  });

  it("hides toggled-off namespaces", () => {
    const g = applyGraphFilters(graph, filters({ hiddenNamespaces: ["app"] }));
    expect(g.nodes.some((n) => n.namespace === "app")).toBe(false);
  });
});

describe("applyFlowFilters", () => {
  const flow = (verdict: string): TrafficFlow => ({
    source: { name: "web", namespace: "app", kind: "Deployment" },
    destination: { name: "api", namespace: "app", kind: "Deployment" },
    protocol: "TCP",
    port: 80,
    verdict,
    time: "2026-07-09T00:00:00.000Z",
  });

  it("filters by verdict", () => {
    const flows = [flow("FORWARDED"), flow("DROPPED"), flow("TRACED")];
    expect(applyFlowFilters(flows, filters({ verdict: "dropped" }), "")).toHaveLength(1);
    expect(applyFlowFilters(flows, filters({ verdict: "forwarded" }), "")).toHaveLength(2);
    expect(applyFlowFilters(flows, filters({ verdict: "all" }), "")).toHaveLength(3);
  });

  it("matches the search query against endpoints and verdict", () => {
    const flows = [flow("FORWARDED")];
    expect(applyFlowFilters(flows, filters({}), "api")).toHaveLength(1);
    expect(applyFlowFilters(flows, filters({}), "nomatch")).toHaveLength(0);
  });
});

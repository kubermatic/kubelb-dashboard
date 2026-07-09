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
import { buildTrafficGraph } from "@/lib/traffic-graph";
import type { Addresses, LoadBalancer } from "@/types/kubelb";

function lb(name: string, namespace: string, ips: string[]): LoadBalancer {
  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: { name, namespace },
    spec: {
      type: "LoadBalancer",
      endpoints: [{ addresses: ips.map((ip) => ({ ip })), ports: [{ port: 80, protocol: "TCP" }] }],
    },
  };
}

function lbRef(name: string, namespace: string, refName: string): LoadBalancer {
  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: { name, namespace },
    spec: {
      type: "LoadBalancer",
      endpoints: [
        { addressesReference: { name: refName }, ports: [{ port: 80, protocol: "TCP" }] },
      ],
    },
  };
}

function addresses(name: string, namespace: string, ips: string[]): Addresses {
  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Addresses",
    metadata: { name, namespace },
    spec: { addresses: ips.map((ip) => ({ ip })) },
  };
}

describe("buildTrafficGraph", () => {
  it("returns an empty graph for no load balancers", () => {
    const g = buildTrafficGraph([]);
    expect(g.nodes).toHaveLength(0);
    expect(g.edges).toHaveLength(0);
  });

  it("builds internet → lb → backend with one internet node", () => {
    const g = buildTrafficGraph([lb("web", "tenant-a", ["1.1.1.1", "2.2.2.2"])]);
    expect(g.nodes.filter((n) => n.kind === "internet")).toHaveLength(1);
    expect(g.nodes.filter((n) => n.kind === "loadbalancer")).toHaveLength(1);
    expect(g.nodes.filter((n) => n.kind === "backend")).toHaveLength(2);
    // internet → lb, lb → each backend
    expect(g.edges).toHaveLength(3);
    expect(g.edges.some((e) => e.from === "internet")).toBe(true);
  });

  it("dedupes repeated backend addresses within a load balancer", () => {
    const g = buildTrafficGraph([lb("web", "tenant-a", ["1.1.1.1", "1.1.1.1"])]);
    expect(g.nodes.filter((n) => n.kind === "backend")).toHaveLength(1);
  });

  it("resolves addressesReference to the referenced Addresses' IPs", () => {
    const g = buildTrafficGraph(
      [lbRef("web", "tenant-a", "default")],
      [addresses("default", "tenant-a", ["10.0.0.5"])],
    );
    const backends = g.nodes.filter((n) => n.kind === "backend");
    expect(backends).toHaveLength(1);
    expect(backends[0].label).toBe("10.0.0.5");
  });

  it("yields no backend when the referenced Addresses is missing", () => {
    const g = buildTrafficGraph([lbRef("web", "tenant-a", "default")], []);
    expect(g.nodes.filter((n) => n.kind === "backend")).toHaveLength(0);
  });

  it("collects tenant namespaces and filters by tenant", () => {
    const all = buildTrafficGraph([
      lb("web", "tenant-a", ["1.1.1.1"]),
      lb("api", "tenant-b", ["2.2.2.2"]),
    ]);
    expect(all.namespaces).toEqual(["tenant-a", "tenant-b"]);

    const filtered = buildTrafficGraph(
      [lb("web", "tenant-a", ["1.1.1.1"]), lb("api", "tenant-b", ["2.2.2.2"])],
      [],
      "tenant-a",
    );
    expect(filtered.namespaces).toEqual(["tenant-a"]);
    expect(filtered.nodes.filter((n) => n.kind === "loadbalancer")).toHaveLength(1);
  });
});

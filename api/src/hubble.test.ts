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
import { buildFlowGraph, detectHubble, type Flow } from "./hubble.js";

function flow(srcNs: string, src: string, dstNs: string, dst: string, verdict = "FORWARDED"): Flow {
  return {
    source: { name: src, namespace: srcNs, kind: "Deployment" },
    destination: { name: dst, namespace: dstNs, kind: "Deployment" },
    protocol: "TCP",
    port: 80,
    verdict,
    time: "2026-07-09T00:00:00.000Z",
  };
}

describe("buildFlowGraph", () => {
  it("returns empty for no flows", () => {
    expect(buildFlowGraph([])).toEqual({ nodes: [], edges: [] });
  });

  it("dedupes nodes and counts connections per edge", () => {
    const g = buildFlowGraph([
      flow("a", "web", "b", "api"),
      flow("a", "web", "b", "api"),
      flow("a", "web", "c", "db"),
    ]);
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["a/web", "b/api", "c/db"]);
    const webApi = g.edges.find((e) => e.from === "a/web" && e.to === "b/api");
    expect(webApi?.connections).toBe(2);
    const webDb = g.edges.find((e) => e.from === "a/web" && e.to === "c/db");
    expect(webDb?.connections).toBe(1);
  });

  it("keeps the latest verdict on an edge", () => {
    const g = buildFlowGraph([
      flow("a", "web", "b", "api", "FORWARDED"),
      flow("a", "web", "b", "api", "DROPPED"),
    ]);
    expect(g.edges[0].verdict).toBe("DROPPED");
  });
});

describe("detectHubble", () => {
  it("returns false when no options/address", async () => {
    expect(await detectHubble(null)).toBe(false);
    expect(await detectHubble({ address: "" })).toBe(false);
  });
});

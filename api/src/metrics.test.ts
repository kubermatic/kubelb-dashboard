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

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectPrometheus,
  isMetricKey,
  isValidNamespace,
  queryRange,
  METRIC_QUERIES,
} from "./metrics.js";

afterEach(() => vi.restoreAllMocks());

function mockFetch(impl: (url: string) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((u: string | URL) => Promise.resolve(impl(String(u)))),
  );
}

describe("metric key + namespace validation", () => {
  it("accepts known metrics, rejects unknown", () => {
    expect(isMetricKey("request_rate")).toBe(true);
    expect(isMetricKey("p99_latency")).toBe(true);
    expect(isMetricKey("node_cpu")).toBe(false);
    expect(isMetricKey("__proto__")).toBe(false);
  });

  it("accepts valid k8s namespaces, rejects injection", () => {
    expect(isValidNamespace("tenant-default")).toBe(true);
    expect(isValidNamespace('x"} or up{')).toBe(false);
    expect(isValidNamespace("UPPER")).toBe(false);
    expect(isValidNamespace("a".repeat(64))).toBe(false);
  });

  it("every template scopes to the namespace and only envoy_ metrics", () => {
    for (const build of Object.values(METRIC_QUERIES)) {
      const q = build("tenant-x");
      expect(q).toContain('namespace="tenant-x"');
      expect(q).toContain("envoy_");
      expect(q).not.toMatch(/\b(node_|kube_|apiserver_|container_)/);
    }
  });
});

describe("detectPrometheus", () => {
  it("false when no url", async () => {
    expect(await detectPrometheus(undefined)).toBe(false);
  });

  it("true when the envoy series exists", async () => {
    mockFetch(() => Response.json({ status: "success", data: { result: [{ value: [0, "52"] }] } }));
    expect(await detectPrometheus("http://prom:9090")).toBe(true);
  });

  it("false when the series is empty (present but useless)", async () => {
    mockFetch(() => Response.json({ status: "success", data: { result: [] } }));
    expect(await detectPrometheus("http://prom:9090")).toBe(false);
  });

  it("false on error (fail closed)", async () => {
    mockFetch(() => new Response("boom", { status: 500 }));
    expect(await detectPrometheus("http://prom:9090")).toBe(false);
  });
});

describe("queryRange", () => {
  const base = { namespace: "tenant-default", windowSeconds: 1800, step: 60, now: 1_000_000 };

  it("rejects unknown metric", async () => {
    await expect(queryRange("http://prom", { ...base, metric: "evil" })).rejects.toThrow(
      "unknown metric",
    );
  });

  it("rejects invalid namespace", async () => {
    await expect(
      queryRange("http://prom", { ...base, metric: "request_rate", namespace: 'x"}' }),
    ).rejects.toThrow("invalid namespace");
  });

  it("forwards a templated query and returns the body", async () => {
    let calledUrl = "";
    mockFetch((u) => {
      calledUrl = u;
      return Response.json({ status: "success", data: { result: [] } });
    });
    await queryRange("http://prom", { ...base, metric: "request_rate" });
    expect(calledUrl).toContain("/api/v1/query_range?");
    expect(decodeURIComponent(calledUrl)).toContain(
      'envoy_http_downstream_rq_total{namespace="tenant-default"}',
    );
    expect(calledUrl).toContain("start=998200");
    expect(calledUrl).toContain("end=1000000");
  });
});

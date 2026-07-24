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
  buildAIQueries,
  isAIMetric,
  isAIWindow,
  isValidLabelValue,
  queryAISpend,
  validateAIParams,
} from "./ai-metrics.js";

afterEach(() => vi.restoreAllMocks());

function mockFetch(impl: (url: string) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((u: string | URL) => Promise.resolve(impl(String(u)))),
  );
}

describe("validation", () => {
  it("accepts known metrics and windows", () => {
    expect(isAIMetric("tokens")).toBe(true);
    expect(isAIMetric("tokens_by_model")).toBe(true);
    expect(isAIMetric("evil")).toBe(false);
    expect(isAIWindow("1h")).toBe(true);
    expect(isAIWindow("7d")).toBe(false);
  });

  it("rejects label values that could break out of the selector", () => {
    expect(isValidLabelValue("primary")).toBe(true);
    expect(isValidLabelValue("team-alpha")).toBe(true);
    expect(isValidLabelValue('x"} or up{')).toBe(false);
    expect(isValidLabelValue("a".repeat(254))).toBe(false);
  });

  it("validateAIParams throws on bad input", () => {
    expect(() => validateAIParams({ metric: "nope", window: "1h" })).toThrow("unknown metric");
    expect(() => validateAIParams({ metric: "tokens", window: "5h" })).toThrow("invalid window");
    expect(() => validateAIParams({ metric: "tokens", window: "1h", tenant: 'a"}' })).toThrow(
      "invalid tenant",
    );
  });
});

describe("buildAIQueries", () => {
  it("prefers the recording rule then raw fallback for 1h", () => {
    const [rule, raw] = buildAIQueries({ metric: "tokens", window: "1h" });
    expect(rule).toContain("kubelb:ai_tokens:increase1h");
    expect(rule).toContain("sum by (tenant_id, key_id, gen_ai_token_type)");
    expect(raw).toContain("increase(agentgateway_gen_ai_client_token_usage_sum");
    expect(raw).toContain("[1h]");
  });

  it("uses only the raw increase for 24h (no shipped rule)", () => {
    const queries = buildAIQueries({ metric: "requests", window: "24h" });
    expect(queries).toHaveLength(1);
    expect(queries[0]).toContain("increase(agentgateway_gen_ai_client_token_usage_count");
    expect(queries[0]).toContain("[24h]");
  });

  it("injects tenant and key selectors", () => {
    const [rule] = buildAIQueries({ metric: "tokens", window: "1h", tenant: "primary", key: "k1" });
    expect(rule).toContain('tenant_id="primary"');
    expect(rule).toContain('key_id="k1"');
  });
});

describe("queryAISpend", () => {
  it("returns the recording-rule result when it has data", async () => {
    const calls: string[] = [];
    mockFetch((u) => {
      calls.push(u);
      return Response.json({ status: "success", data: { result: [{ value: [0, "5"] }] } });
    });
    const out = (await queryAISpend("http://prom", { metric: "tokens", window: "1h" })) as {
      data: { result: unknown[] };
    };
    expect(out.data.result).toHaveLength(1);
    // Only the rule query ran; raw fallback was not needed.
    expect(calls).toHaveLength(1);
    expect(decodeURIComponent(calls[0])).toContain("kubelb:ai_tokens:increase1h");
  });

  it("falls back to the raw series when the rule is empty", async () => {
    const calls: string[] = [];
    mockFetch((u) => {
      calls.push(decodeURIComponent(u));
      const empty = calls.length === 1;
      return Response.json({
        status: "success",
        data: { result: empty ? [] : [{ value: [0, "9"] }] },
      });
    });
    const out = (await queryAISpend("http://prom", { metric: "tokens", window: "1h" })) as {
      data: { result: unknown[] };
    };
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("kubelb:ai_tokens:increase1h");
    expect(calls[1]).toContain("agentgateway_gen_ai_client_token_usage_sum");
    expect(out.data.result).toHaveLength(1);
  });

  it("returns an empty vector when nothing matches", async () => {
    mockFetch(() => Response.json({ status: "success", data: { result: [] } }));
    const out = (await queryAISpend("http://prom", { metric: "tokens", window: "24h" })) as {
      data: { result: unknown[] };
    };
    expect(out.data.result).toEqual([]);
  });
});

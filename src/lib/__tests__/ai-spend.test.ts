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
  aggregateKeySpend,
  aggregateModelSpend,
  aggregateTenantSpend,
  budgetStatus,
  groupModelsByTenant,
  parseVector,
  spendForWindow,
  tokenBudgetForWindow,
  topModels,
  utilizationPercent,
  type AISpendSample,
} from "@/lib/ai-spend";
import type { AIBudget, VirtualKeySpend } from "@/types/ai";

function vec(samples: { metric: Record<string, string>; value: number }[]) {
  return {
    status: "success",
    data: {
      resultType: "vector",
      result: samples.map((s) => ({ metric: s.metric, value: [1700000000, String(s.value)] })),
    },
  };
}

describe("parseVector", () => {
  it("flattens a Prometheus vector to labels + numeric values", () => {
    const out = parseVector(vec([{ metric: { tenant_id: "a" }, value: 42 }]));
    expect(out).toEqual([{ labels: { tenant_id: "a" }, value: 42 }]);
  });

  it("drops non-finite and malformed samples", () => {
    const resp = {
      data: {
        result: [
          { metric: { tenant_id: "a" }, value: [1, "NaN"] },
          { metric: { tenant_id: "b" }, value: [1, "12"] },
          { metric: { tenant_id: "c" } },
        ],
      },
    };
    expect(parseVector(resp)).toEqual([{ labels: { tenant_id: "b" }, value: 12 }]);
  });

  it("returns [] for junk input", () => {
    expect(parseVector(null)).toEqual([]);
    expect(parseVector({})).toEqual([]);
    expect(parseVector({ data: { result: "nope" } })).toEqual([]);
  });
});

describe("aggregateTenantSpend", () => {
  const tokens1h: AISpendSample[] = [
    { labels: { tenant_id: "a", gen_ai_token_type: "input" }, value: 100 },
    { labels: { tenant_id: "a", gen_ai_token_type: "output" }, value: 50 },
  ];
  const tokens24h: AISpendSample[] = [
    { labels: { tenant_id: "a", gen_ai_token_type: "input" }, value: 2000 },
    { labels: { tenant_id: "a", gen_ai_token_type: "output" }, value: 800 },
    { labels: { tenant_id: "b", gen_ai_token_type: "input" }, value: 500 },
  ];
  const requests24h: AISpendSample[] = [
    { labels: { tenant_id: "a" }, value: 30 },
    { labels: { tenant_id: "b" }, value: 5 },
  ];

  it("sums tokens and splits input/output, sorted by 24h tokens desc", () => {
    const rows = aggregateTenantSpend(tokens1h, tokens24h, requests24h);
    expect(rows.map((r) => r.tenantId)).toEqual(["a", "b"]);
    const a = rows[0];
    expect(a).toMatchObject({
      tokens1h: 150,
      tokens24h: 2800,
      inputTokens24h: 2000,
      outputTokens24h: 800,
      requests24h: 30,
    });
  });

  it("ignores samples with a missing tenant_id label", () => {
    const rows = aggregateTenantSpend([], [{ labels: {}, value: 999 }], []);
    expect(rows).toEqual([]);
  });
});

describe("aggregateKeySpend / aggregateModelSpend / groupModelsByTenant", () => {
  it("aggregates per key", () => {
    const rows = aggregateKeySpend(
      [
        { labels: { key_id: "k1", gen_ai_token_type: "input" }, value: 100 },
        { labels: { key_id: "k1", gen_ai_token_type: "output" }, value: 40 },
      ],
      [{ labels: { key_id: "k1" }, value: 12 }],
    );
    expect(rows[0]).toMatchObject({ keyId: "k1", tokens24h: 140, requests24h: 12 });
  });

  it("aggregates and sorts models by tokens", () => {
    const rows = aggregateModelSpend([
      { labels: { gen_ai_system: "openai", gen_ai_response_model: "gpt-4o" }, value: 100 },
      { labels: { gen_ai_system: "openai", gen_ai_response_model: "gpt-4o" }, value: 50 },
      { labels: { gen_ai_system: "anthropic", gen_ai_response_model: "claude" }, value: 200 },
    ]);
    expect(rows).toEqual([
      { system: "anthropic", model: "claude", tokens: 200 },
      { system: "openai", model: "gpt-4o", tokens: 150 },
    ]);
    expect(topModels(rows, 1)).toHaveLength(1);
  });

  it("groups model rows by tenant", () => {
    const grouped = groupModelsByTenant([
      {
        labels: { tenant_id: "a", gen_ai_system: "openai", gen_ai_response_model: "gpt-4o" },
        value: 10,
      },
      {
        labels: { tenant_id: "b", gen_ai_system: "openai", gen_ai_response_model: "gpt-4o" },
        value: 20,
      },
    ]);
    expect(grouped.get("a")?.[0].tokens).toBe(10);
    expect(grouped.get("b")?.[0].tokens).toBe(20);
  });
});

describe("budgets", () => {
  const budgets: AIBudget[] = [
    { window: "Day", tokens: 1000, usd: 5, onExceed: "Block", alertThresholdPercent: 70 },
    { window: "Month", tokens: 50000, onExceed: "Notify" },
  ];

  it("selects the token budget for a window", () => {
    expect(tokenBudgetForWindow(budgets, "Day")).toBe(1000);
    expect(tokenBudgetForWindow(budgets, "Week")).toBeUndefined();
    expect(tokenBudgetForWindow(undefined, "Day")).toBeUndefined();
  });

  it("computes utilization, returning null without a budget", () => {
    expect(utilizationPercent(500, 1000)).toBe(50);
    expect(utilizationPercent(500, undefined)).toBeNull();
    expect(utilizationPercent(500, 0)).toBeNull();
  });

  it("maps utilization to a status with a custom alert threshold", () => {
    expect(budgetStatus(null)).toBe("ok");
    expect(budgetStatus(50)).toBe("ok");
    expect(budgetStatus(75, 70)).toBe("warn");
    expect(budgetStatus(85)).toBe("warn");
    expect(budgetStatus(120)).toBe("over");
  });

  it("picks the most recent spend window", () => {
    const spend: VirtualKeySpend[] = [
      { window: "Day", windowStart: "2026-07-23T00:00:00Z", tokens: 100 },
      { window: "Day", windowStart: "2026-07-24T00:00:00Z", tokens: 250 },
      { window: "Month", windowStart: "2026-07-01T00:00:00Z", tokens: 9000 },
    ];
    expect(spendForWindow(spend, "Day")?.tokens).toBe(250);
    expect(spendForWindow(spend, "Week")).toBeUndefined();
    expect(spendForWindow(undefined, "Day")).toBeUndefined();
  });
});

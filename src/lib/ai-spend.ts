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

import type { AIBudget, AIBudgetWindow, VirtualKeySpend } from "@/types/ai";

// A single Prometheus instant-vector sample, flattened to labels + numeric value.
export interface AISpendSample {
  labels: Record<string, string>;
  value: number;
}

interface PromVector {
  data?: { result?: { metric?: Record<string, string>; value?: [number, string] }[] };
}

export function parseVector(resp: unknown): AISpendSample[] {
  const result = (resp as PromVector | null | undefined)?.data?.result;
  if (!Array.isArray(result)) return [];
  const out: AISpendSample[] = [];
  for (const r of result) {
    const raw = r.value?.[1];
    const value = raw === undefined ? NaN : Number(raw);
    if (Number.isFinite(value)) out.push({ labels: r.metric ?? {}, value });
  }
  return out;
}

export interface TenantSpendRow {
  tenantId: string;
  tokens1h: number;
  tokens24h: number;
  inputTokens24h: number;
  outputTokens24h: number;
  requests24h: number;
}

function tokenType(sample: AISpendSample): string {
  return sample.labels.gen_ai_token_type ?? "";
}

export function aggregateTenantSpend(
  tokens1h: AISpendSample[],
  tokens24h: AISpendSample[],
  requests24h: AISpendSample[],
): TenantSpendRow[] {
  const rows = new Map<string, TenantSpendRow>();
  const row = (id: string): TenantSpendRow => {
    let r = rows.get(id);
    if (!r) {
      r = {
        tenantId: id,
        tokens1h: 0,
        tokens24h: 0,
        inputTokens24h: 0,
        outputTokens24h: 0,
        requests24h: 0,
      };
      rows.set(id, r);
    }
    return r;
  };

  for (const s of tokens1h) row(s.labels.tenant_id ?? "").tokens1h += s.value;
  for (const s of tokens24h) {
    const r = row(s.labels.tenant_id ?? "");
    r.tokens24h += s.value;
    if (tokenType(s) === "input") r.inputTokens24h += s.value;
    if (tokenType(s) === "output") r.outputTokens24h += s.value;
  }
  for (const s of requests24h) row(s.labels.tenant_id ?? "").requests24h += s.value;

  rows.delete("");
  return [...rows.values()].sort((a, b) => b.tokens24h - a.tokens24h);
}

export interface KeySpendRow {
  keyId: string;
  tokens24h: number;
  inputTokens24h: number;
  outputTokens24h: number;
  requests24h: number;
}

export function aggregateKeySpend(
  tokens24h: AISpendSample[],
  requests24h: AISpendSample[],
): KeySpendRow[] {
  const rows = new Map<string, KeySpendRow>();
  const row = (id: string): KeySpendRow => {
    let r = rows.get(id);
    if (!r) {
      r = { keyId: id, tokens24h: 0, inputTokens24h: 0, outputTokens24h: 0, requests24h: 0 };
      rows.set(id, r);
    }
    return r;
  };

  for (const s of tokens24h) {
    const r = row(s.labels.key_id ?? "");
    r.tokens24h += s.value;
    if (tokenType(s) === "input") r.inputTokens24h += s.value;
    if (tokenType(s) === "output") r.outputTokens24h += s.value;
  }
  for (const s of requests24h) row(s.labels.key_id ?? "").requests24h += s.value;

  rows.delete("");
  return [...rows.values()].sort((a, b) => b.tokens24h - a.tokens24h);
}

export interface ModelSpendRow {
  system: string;
  model: string;
  tokens: number;
}

export function aggregateModelSpend(byModel: AISpendSample[]): ModelSpendRow[] {
  const rows = new Map<string, ModelSpendRow>();
  for (const s of byModel) {
    const system = s.labels.gen_ai_system ?? "unknown";
    const model = s.labels.gen_ai_response_model ?? "unknown";
    const id = `${system}/${model}`;
    const r = rows.get(id) ?? { system, model, tokens: 0 };
    r.tokens += s.value;
    rows.set(id, r);
  }
  return [...rows.values()].sort((a, b) => b.tokens - a.tokens);
}

export function topModels(rows: ModelSpendRow[], n: number): ModelSpendRow[] {
  return rows.slice(0, n);
}

export function groupModelsByTenant(byModel: AISpendSample[]): Map<string, ModelSpendRow[]> {
  const perTenant = new Map<string, AISpendSample[]>();
  for (const s of byModel) {
    const id = s.labels.tenant_id ?? "";
    if (!id) continue;
    const list = perTenant.get(id) ?? [];
    list.push(s);
    perTenant.set(id, list);
  }
  const out = new Map<string, ModelSpendRow[]>();
  for (const [id, samples] of perTenant) out.set(id, aggregateModelSpend(samples));
  return out;
}

export function tokenBudgetForWindow(
  budgets: AIBudget[] | undefined,
  window: AIBudgetWindow,
): number | undefined {
  return budgets?.find((b) => b.window === window && b.tokens !== undefined)?.tokens;
}

export function usdBudgetForWindow(
  budgets: AIBudget[] | undefined,
  window: AIBudgetWindow,
): number | undefined {
  return budgets?.find((b) => b.window === window && b.usd !== undefined)?.usd;
}

// Percentage of a budget consumed; null when no budget is configured (so the UI
// can render an em dash rather than an inflated or NaN utilization).
export function utilizationPercent(consumed: number, budget: number | undefined): number | null {
  if (budget === undefined || budget <= 0) return null;
  return (consumed / budget) * 100;
}

export type BudgetStatus = "ok" | "warn" | "over";

export function budgetStatus(percent: number | null, alertThresholdPercent?: number): BudgetStatus {
  if (percent === null) return "ok";
  if (percent >= 100) return "over";
  if (percent >= (alertThresholdPercent ?? 80)) return "warn";
  return "ok";
}

export function spendForWindow(
  spend: VirtualKeySpend[] | undefined,
  window: AIBudgetWindow,
): VirtualKeySpend | undefined {
  const matching = spend?.filter((s) => s.window === window) ?? [];
  if (matching.length === 0) return undefined;
  // Most recent window wins when multiple are reported.
  return matching.reduce((a, b) => (a.windowStart >= b.windowStart ? a : b));
}

export function hasUsdSignal(budgets: (AIBudget | undefined)[], spend: VirtualKeySpend[]): boolean {
  const budgetUsd = budgets.some((b) => (b?.usd ?? 0) > 0);
  const spendUsd = spend.some((s) => (s.usd ?? 0) > 0);
  return budgetUsd || spendUsd;
}

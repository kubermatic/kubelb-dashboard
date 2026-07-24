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

// AI spend showback metrics. Like the per-proxy metrics proxy, the client asks
// for a named AI metric (never raw PromQL) and the server templates the query,
// so the dashboard can't be used as an open Prometheus proxy.
//
// Recording rules (kubelb-ee #483) are off by default, so each 1h query prefers
// the pre-aggregated rule and falls back to the raw agentgateway histogram when
// the rule returns nothing. 24h has no shipped rule, so it always uses raw.

const LABEL_VALUE_RE = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;

export const AI_METRICS = ["tokens", "requests", "tokens_by_model"] as const;
export type AIMetric = (typeof AI_METRICS)[number];

export const AI_WINDOWS = ["1h", "24h"] as const;
export type AIWindow = (typeof AI_WINDOWS)[number];

export function isAIMetric(v: string): v is AIMetric {
  return (AI_METRICS as readonly string[]).includes(v);
}

export function isAIWindow(v: string): v is AIWindow {
  return (AI_WINDOWS as readonly string[]).includes(v);
}

export function isValidLabelValue(v: string): boolean {
  return v.length <= 253 && LABEL_VALUE_RE.test(v);
}

const GROUP_BY: Record<AIMetric, string[]> = {
  tokens: ["tenant_id", "key_id", "gen_ai_token_type"],
  requests: ["tenant_id", "key_id"],
  tokens_by_model: ["tenant_id", "gen_ai_system", "gen_ai_response_model"],
};

// Recording-rule series per metric (1h increase only).
const RULE_SERIES: Record<AIMetric, string> = {
  tokens: "kubelb:ai_tokens:increase1h",
  requests: "kubelb:ai_requests:increase1h",
  tokens_by_model: "kubelb:ai_tokens_by_model:increase1h",
};

// Raw agentgateway histogram the metering controller also reads.
const RAW_SERIES: Record<AIMetric, string> = {
  tokens: "agentgateway_gen_ai_client_token_usage_sum",
  requests: "agentgateway_gen_ai_client_token_usage_count",
  tokens_by_model: "agentgateway_gen_ai_client_token_usage_sum",
};

export interface AIQueryParams {
  metric: AIMetric;
  window: AIWindow;
  tenant?: string;
  key?: string;
}

function selector(tenant?: string, key?: string): string {
  const parts: string[] = [];
  if (tenant) parts.push(`tenant_id="${tenant}"`);
  if (key) parts.push(`key_id="${key}"`);
  return parts.length ? `{${parts.join(",")}}` : "";
}

// Ordered list of PromQL queries to try; the first non-empty result wins.
export function buildAIQueries({ metric, window, tenant, key }: AIQueryParams): string[] {
  const by = `sum by (${GROUP_BY[metric].join(", ")})`;
  const sel = selector(tenant, key);
  const raw = `${by} (increase(${RAW_SERIES[metric]}${sel}[${window}]))`;
  if (window === "1h") {
    return [`${by} (${RULE_SERIES[metric]}${sel})`, raw];
  }
  return [raw];
}

async function promFetch(baseUrl: string, path: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${baseUrl}${path}`, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface PromVectorResponse {
  status?: string;
  data?: { resultType?: string; result?: unknown[] };
}

async function instantQuery(baseUrl: string, query: string): Promise<PromVectorResponse> {
  const res = await promFetch(baseUrl, `/api/v1/query?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`prometheus ${String(res.status)}`);
  return (await res.json()) as PromVectorResponse;
}

export function validateAIParams(q: Record<string, string | undefined>): AIQueryParams {
  const metric = q.metric ?? "";
  const window = q.window ?? "1h";
  if (!isAIMetric(metric)) throw new Error("unknown metric");
  if (!isAIWindow(window)) throw new Error("invalid window");
  const tenant = q.tenant;
  const key = q.key;
  if (tenant !== undefined && !isValidLabelValue(tenant)) throw new Error("invalid tenant");
  if (key !== undefined && !isValidLabelValue(key)) throw new Error("invalid key");
  return { metric, window, tenant, key };
}

export async function queryAISpend(baseUrl: string, params: AIQueryParams): Promise<unknown> {
  const queries = buildAIQueries(params);
  let last: PromVectorResponse | undefined;
  for (const query of queries) {
    const body = await instantQuery(baseUrl, query);
    last = body;
    if ((body.data?.result?.length ?? 0) > 0) return body;
  }
  // No series matched (rule absent AND no raw data): return the last shape so the
  // client sees a valid empty vector rather than an error.
  return last ?? { status: "success", data: { resultType: "vector", result: [] } };
}

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

// Metrics live behind the server: the client asks for a named metric + a
// namespace, and the server templates the PromQL. The client never sends raw
// PromQL, so the dashboard cannot be used as an open Prometheus proxy.

const NAMESPACE_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// Named per-proxy metrics. Templates filter to a tenant namespace; internal
// listeners (admin/health_check/stats_*) are excluded where relevant so the
// numbers reflect real data-plane traffic. See docs/adr/001-traffic-metrics.md.
export const METRIC_QUERIES: Record<string, (ns: string) => string> = {
  request_rate: (ns) => `sum(rate(envoy_http_downstream_rq_total{namespace="${ns}"}[5m]))`,
  error_rate: (ns) =>
    `sum(rate(envoy_http_downstream_rq_xx{namespace="${ns}",envoy_response_code_class="5"}[5m]))`,
  p99_latency: (ns) =>
    `histogram_quantile(0.99, sum(rate(envoy_http_downstream_rq_time_bucket{namespace="${ns}"}[5m])) by (le))`,
  active_connections: (ns) => `sum(envoy_http_downstream_cx_active{namespace="${ns}"})`,
};

export type MetricKey = keyof typeof METRIC_QUERIES;

export function isMetricKey(v: string): v is MetricKey {
  return Object.prototype.hasOwnProperty.call(METRIC_QUERIES, v);
}

export function isValidNamespace(ns: string): boolean {
  return ns.length <= 63 && NAMESPACE_RE.test(ns);
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

// Detection confirms usefulness, not just reachability: the target must expose
// the Envoy series the UI needs. Returns false on any error (fail closed).
export async function detectPrometheus(baseUrl: string | undefined): Promise<boolean> {
  if (!baseUrl) return false;
  try {
    const res = await promFetch(
      baseUrl,
      `/api/v1/query?query=${encodeURIComponent("count(envoy_http_downstream_rq_total)")}`,
    );
    if (!res.ok) return false;
    const body = (await res.json()) as { status?: string; data?: { result?: unknown[] } };
    return body.status === "success" && (body.data?.result?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export interface RangeParams {
  metric: string;
  namespace: string;
  windowSeconds: number;
  step: number;
  now: number;
}

export async function queryRange(
  baseUrl: string,
  { metric, namespace, windowSeconds, step, now }: RangeParams,
): Promise<unknown> {
  if (!isMetricKey(metric)) throw new Error("unknown metric");
  if (!isValidNamespace(namespace)) throw new Error("invalid namespace");
  const query = METRIC_QUERIES[metric](namespace);
  const end = now;
  const start = end - windowSeconds;
  const qs = new URLSearchParams({
    query,
    start: String(start),
    end: String(end),
    step: String(step),
  });
  const res = await promFetch(baseUrl, `/api/v1/query_range?${qs.toString()}`);
  if (!res.ok) throw new Error(`prometheus ${String(res.status)}`);
  return res.json();
}

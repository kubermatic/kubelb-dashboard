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

import { http, HttpResponse } from "msw";

const BASE: Record<string, number> = {
  request_rate: 1.4,
  error_rate: 0.05,
  p99_latency: 32,
  active_connections: 6,
};

// Deterministic synthetic series so dev:mock and e2e render stable charts.
function series(metric: string, windowSeconds: number, step: number, end: number) {
  const base = BASE[metric] ?? 1;
  const n = Math.floor(windowSeconds / step);
  const values: [number, string][] = [];
  for (let i = 0; i <= n; i++) {
    const t = end - (n - i) * step;
    const wobble = 1 + 0.25 * Math.sin(i / 3);
    values.push([t, (base * wobble).toFixed(4)]);
  }
  return values;
}

export const observabilityHandlers = [
  http.get("/api/observability/sources", () =>
    HttpResponse.json({
      metrics: { available: true, source: "prometheus" },
      traffic: { available: false, source: null },
      tracing: { available: false, source: null },
    }),
  ),

  http.get("/api/metrics/query_range", ({ request }) => {
    const url = new URL(request.url);
    const metric = url.searchParams.get("metric") ?? "request_rate";
    const windowSeconds = Number(url.searchParams.get("window")) || 1800;
    const step = Number(url.searchParams.get("step")) || 60;
    const end = Math.floor(Date.now() / 1000);
    return HttpResponse.json({
      status: "success",
      data: {
        resultType: "matrix",
        result: [{ metric: {}, values: series(metric, windowSeconds, step, end) }],
      },
    });
  }),
];

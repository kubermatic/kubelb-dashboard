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

import { aiUsage, WINDOW_RATIO } from "../fixtures/ai-spend";

interface Sample {
  metric: Record<string, string>;
  value: [number, string];
}

function vector(samples: Sample[]) {
  return HttpResponse.json({
    status: "success",
    data: { resultType: "vector", result: samples },
  });
}

// Mirrors the server-side templated queries: named metric + window, optional
// tenant/key filters, grouped labels, deterministic values scaled by window.
export const aiSpendHandlers = [
  http.get("/api/metrics/ai", ({ request }) => {
    const url = new URL(request.url);
    const metric = url.searchParams.get("metric") ?? "tokens";
    const window = url.searchParams.get("window") ?? "1h";
    const tenantFilter = url.searchParams.get("tenant") ?? undefined;
    const keyFilter = url.searchParams.get("key") ?? undefined;
    const ratio = WINDOW_RATIO[window] ?? 1;
    const ts = Math.floor(Date.now() / 1000);
    const scale = (n: number) => [ts, String(Math.round(n * ratio))] as [number, string];

    const samples: Sample[] = [];

    for (const tenant of aiUsage) {
      if (tenantFilter && tenant.tenantId !== tenantFilter) continue;
      for (const key of tenant.keys) {
        if (keyFilter && key.keyId !== keyFilter) continue;

        if (metric === "requests") {
          samples.push({
            metric: { tenant_id: tenant.tenantId, key_id: key.keyId },
            value: scale(key.requests),
          });
          continue;
        }

        if (metric === "tokens") {
          const input = key.models.reduce((s, m) => s + m.inputTokens, 0);
          const output = key.models.reduce((s, m) => s + m.outputTokens, 0);
          samples.push({
            metric: { tenant_id: tenant.tenantId, key_id: key.keyId, gen_ai_token_type: "input" },
            value: scale(input),
          });
          samples.push({
            metric: { tenant_id: tenant.tenantId, key_id: key.keyId, gen_ai_token_type: "output" },
            value: scale(output),
          });
          continue;
        }

        if (metric === "tokens_by_model") {
          for (const m of key.models) {
            samples.push({
              metric: {
                tenant_id: tenant.tenantId,
                gen_ai_system: m.system,
                gen_ai_response_model: m.model,
              },
              value: scale(m.inputTokens + m.outputTokens),
            });
          }
        }
      }
    }

    // tokens_by_model groups across keys, so merge duplicate model rows per tenant.
    if (metric === "tokens_by_model") {
      const merged = new Map<string, Sample>();
      for (const s of samples) {
        const id = `${s.metric.tenant_id}/${s.metric.gen_ai_system}/${s.metric.gen_ai_response_model}`;
        const existing = merged.get(id);
        if (existing) {
          existing.value = [
            existing.value[0],
            String(Number(existing.value[1]) + Number(s.value[1])),
          ];
        } else {
          merged.set(id, { metric: s.metric, value: [...s.value] });
        }
      }
      return vector([...merged.values()]);
    }

    return vector(samples);
  }),
];

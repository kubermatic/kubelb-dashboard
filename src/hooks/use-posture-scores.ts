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

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import { useMetricsAvailable } from "@/hooks/use-observability";

interface PromVectorResponse {
  data?: { result?: Array<{ metric?: Record<string, string>; value?: [number, string] }> };
}

// Overall posture score per tenant (0..1). The engine exports the tenant's
// overall score with an empty category label; per-category series are ignored
// here. Posture is a Prometheus metric, so this is gated on metrics being
// available and callers must handle the map being absent.
export function usePostureScores() {
  const available = useMetricsAvailable();
  return useQuery<Map<string, number>>({
    queryKey: queryKeys.posture.scores(),
    enabled: available,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch("/api/metrics/posture", { credentials: "include" });
      if (!res.ok) throw new Error(`posture ${String(res.status)}`);
      const body = (await res.json()) as PromVectorResponse;
      const scores = new Map<string, number>();
      for (const series of body.data?.result ?? []) {
        const tenant = series.metric?.tenant;
        const category = series.metric?.category ?? "";
        const value = Number(series.value?.[1]);
        if (tenant && category === "" && Number.isFinite(value)) {
          scores.set(tenant, value);
        }
      }
      return scores;
    },
  });
}

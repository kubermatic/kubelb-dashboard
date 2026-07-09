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
import { useMetricsAvailable } from "@/hooks/use-observability";

export type MetricKey = "request_rate" | "error_rate" | "p99_latency" | "active_connections";

export interface RangePoint {
  t: number;
  v: number;
}

interface PromRangeResponse {
  data?: { result?: Array<{ values?: [number, string][] }> };
}

export function useMetricsRange(
  metric: MetricKey,
  namespace: string,
  windowSeconds = 1800,
  step = 60,
) {
  const available = useMetricsAvailable();
  return useQuery<RangePoint[]>({
    queryKey: ["metrics-range", metric, namespace, windowSeconds, step],
    enabled: available && !!namespace,
    refetchInterval: 30_000,
    queryFn: async () => {
      const url = new URL("/api/metrics/query_range", window.location.origin);
      url.searchParams.set("metric", metric);
      url.searchParams.set("namespace", namespace);
      url.searchParams.set("window", String(windowSeconds));
      url.searchParams.set("step", String(step));
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error(`metrics ${String(res.status)}`);
      const body = (await res.json()) as PromRangeResponse;
      const values = body.data?.result?.[0]?.values ?? [];
      return values.map(([t, v]) => ({ t, v: Number(v) }));
    },
  });
}

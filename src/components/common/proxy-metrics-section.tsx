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

import { Card, CardContent } from "@/components/ui/card";
import { MetricSparkline } from "@/components/common/metric-sparkline";
import { useMetricsRange } from "@/hooks/use-metrics-range";

export function ProxyMetricsSection({ namespace }: { namespace: string }) {
  const rps = useMetricsRange("request_rate", namespace);
  const errs = useMetricsRange("error_rate", namespace);
  const p99 = useMetricsRange("p99_latency", namespace);
  const cx = useMetricsRange("active_connections", namespace);

  return (
    <Card>
      <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricSparkline
          label="Request rate"
          unit="req/s"
          points={rps.data ?? []}
          isLoading={rps.isLoading}
        />
        <MetricSparkline
          label="5xx errors"
          unit="req/s"
          points={errs.data ?? []}
          isLoading={errs.isLoading}
          intent="destructive"
        />
        <MetricSparkline
          label="p99 latency"
          unit="ms"
          points={p99.data ?? []}
          isLoading={p99.isLoading}
          format={(v) => v.toFixed(1)}
        />
        <MetricSparkline
          label="Active connections"
          unit="conns"
          points={cx.data ?? []}
          isLoading={cx.isLoading}
          format={(v) => v.toFixed(0)}
        />
      </CardContent>
    </Card>
  );
}

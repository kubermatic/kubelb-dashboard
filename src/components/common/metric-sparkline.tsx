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

import { cn } from "@/lib/utils";
import type { RangePoint } from "@/hooks/use-metrics-range";

interface MetricSparklineProps {
  label: string;
  unit: string;
  points: RangePoint[];
  isLoading?: boolean;
  format?: (v: number) => string;
  intent?: "default" | "destructive";
}

const W = 240;
const H = 64;

export function MetricSparkline({
  label,
  unit,
  points,
  isLoading,
  format = (v) => v.toFixed(2),
  intent = "default",
}: MetricSparklineProps) {
  const color = intent === "destructive" ? "text-destructive" : "text-primary";
  const last = points.length ? points[points.length - 1].v : undefined;

  let body;
  if (isLoading) {
    body = <div className="h-16 animate-pulse rounded bg-muted" />;
  } else if (points.length < 2) {
    body = <div className="flex h-16 items-center text-sm text-muted-foreground">No data</div>;
  } else {
    const vs = points.map((p) => p.v);
    const min = Math.min(...vs);
    const max = Math.max(...vs);
    const span = max - min || 1;
    const d = points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * W;
        const y = H - ((p.v - min) / span) * (H - 6) - 3;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    body = (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={cn("h-16 w-full", color)}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label} sparkline, peak ${format(max)} ${unit}`}
      >
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">
        {last === undefined ? "—" : format(last)}{" "}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </div>
      {body}
    </div>
  );
}

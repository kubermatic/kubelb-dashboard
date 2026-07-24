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

import type { BudgetStatus } from "@/lib/ai-spend";
import { cn } from "@/lib/utils";

const trackStyles: Record<BudgetStatus, string> = {
  ok: "bg-primary",
  warn: "bg-warning",
  over: "bg-destructive",
};

const labelStyles: Record<BudgetStatus, string> = {
  ok: "text-foreground",
  warn: "text-warning",
  over: "text-destructive",
};

interface BudgetMeterProps {
  percent: number | null;
  status: BudgetStatus;
  className?: string;
}

// Horizontal utilization bar. A null percent means no budget is configured, so
// we render a quiet placeholder rather than an empty or misleading track.
export function BudgetMeter({ percent, status, className }: BudgetMeterProps) {
  if (percent === null) {
    return <span className="text-sm text-muted-foreground">No budget</span>;
  }
  const width = Math.min(percent, 100);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", trackStyles[status])}
          style={{ width: `${String(width)}%` }}
        />
      </div>
      <span className={cn("text-sm font-medium tabular-nums", labelStyles[status])}>
        {percent >= 999 ? ">999" : Math.round(percent)}%
      </span>
    </div>
  );
}

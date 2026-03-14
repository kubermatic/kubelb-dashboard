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

import type { Condition } from "@/types/kubernetes";
import { conditionStyles } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

type StatusVariant = "success" | "warning" | "destructive";

function conditionToVariant(status: Condition["status"]): StatusVariant {
  switch (status) {
    case "True":
      return "success";
    case "Unknown":
      return "warning";
    case "False":
      return "destructive";
  }
}

interface StatusBadgeProps {
  label: string;
  status: Condition["status"];
  className?: string;
}

export function StatusBadge({ label, status, className }: StatusBadgeProps) {
  const variant = conditionToVariant(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        conditionStyles[status],
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-success": variant === "success",
          "bg-warning": variant === "warning",
          "bg-destructive": variant === "destructive",
        })}
      />
      {label}
    </span>
  );
}

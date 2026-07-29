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

import type { HealthState } from "@/lib/status-mapper";
import type { Condition } from "@/types/kubernetes";
import type { InsightSeverity, InsightState } from "@/types/kubelb";

export const statusStyles: Record<HealthState, string> = {
  Ready: "bg-success/10 text-success hover:bg-success/20",
  Degraded: "bg-warning/10 text-warning hover:bg-warning/20",
  Pending: "bg-warning/10 text-warning hover:bg-warning/20",
  Error: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  Terminating: "bg-destructive/10 text-destructive hover:bg-destructive/20",
};

export const conditionStyles: Record<Condition["status"], string> = {
  True: "bg-success/10 text-success",
  False: "bg-destructive/10 text-destructive",
  Unknown: "bg-warning/10 text-warning",
};

export const booleanStyles = {
  enabled: "bg-success/10 text-success",
  disabled: "bg-muted text-muted-foreground",
} as const;

export const severityStyles: Record<InsightSeverity, string> = {
  critical: "bg-destructive text-white",
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
  info: "bg-primary/10 text-primary",
};

export const insightStateStyles: Record<InsightState, string> = {
  Open: "bg-destructive/10 text-destructive",
  Acknowledged: "bg-warning/10 text-warning",
  Snoozed: "bg-muted text-muted-foreground",
  Dismissed: "bg-muted text-muted-foreground",
  Fixed: "bg-success/10 text-success",
};

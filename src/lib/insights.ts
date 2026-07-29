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

import { namespaceToTenant, isTenantNamespace } from "@/lib/format";
import type {
  Insight,
  InsightDismissalReason,
  InsightSeverity,
  InsightState,
} from "@/types/kubelb";

export const SEVERITIES: InsightSeverity[] = ["critical", "high", "medium", "low", "info"];

export const CATEGORIES = ["security", "reliability", "cost", "hygiene", "migration"] as const;

export const INSIGHT_STATES: InsightState[] = [
  "Open",
  "Acknowledged",
  "Snoozed",
  "Dismissed",
  "Fixed",
];

export const DISMISSAL_REASONS: { value: InsightDismissalReason; label: string }[] = [
  { value: "working_as_intended", label: "Working as intended" },
  { value: "accepted_risk", label: "Accepted risk" },
  { value: "false_positive", label: "False positive" },
  { value: "low_priority", label: "Low priority" },
  { value: "other", label: "Other" },
];

export function severityRank(severity: InsightSeverity): number {
  return SEVERITIES.indexOf(severity);
}

export function dismissalReasonLabel(reason: InsightDismissalReason): string {
  return DISMISSAL_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

// Effective state as the engine computes it. status.state lags a triage write
// by one sweep, so an unset status falls back to Open.
export function insightState(insight: Insight): InsightState {
  return insight.status?.state ?? "Open";
}

// Open and acknowledged findings count as active, matching what the
// kubelb_manager_insights metric exports.
export function isActive(insight: Insight): boolean {
  const state = insightState(insight);
  return state === "Open" || state === "Acknowledged";
}

export function insightTenant(insight: Insight): string | null {
  const ns = insight.metadata.namespace ?? "";
  return isTenantNamespace(ns) ? namespaceToTenant(ns) : null;
}

export type TriageAction =
  | { type: "acknowledge" }
  | { type: "snooze"; snoozeUntil: string }
  | { type: "dismiss"; reason: InsightDismissalReason }
  | { type: "reopen" };

// The CRD enforces that reason is set iff state is Dismissed and snoozeUntil
// iff state is Snoozed. Every patch replaces all three triage fields (null
// deletes under JSON merge patch), so a state change can never leave a stale
// reason or snoozeUntil behind.
export function buildTriagePatch(action: TriageAction): Record<string, unknown> {
  switch (action.type) {
    case "acknowledge":
      return {
        spec: { triage: { state: "Acknowledged", reason: null, snoozeUntil: null } },
      };
    case "snooze":
      return {
        spec: { triage: { state: "Snoozed", reason: null, snoozeUntil: action.snoozeUntil } },
      };
    case "dismiss":
      return {
        spec: { triage: { state: "Dismissed", reason: action.reason, snoozeUntil: null } },
      };
    case "reopen":
      return { spec: { triage: null } };
  }
}

export type TriageDecision = "acknowledge" | "snooze" | "dismiss" | "reopen";

// Maps the triage form's state to an action, returning null while a required
// field (snooze date, dismissal reason) is missing so submission stays blocked.
export function buildTriageAction(
  decision: TriageDecision,
  reason: InsightDismissalReason | "",
  snoozeUntil: string,
): TriageAction | null {
  switch (decision) {
    case "acknowledge":
      return { type: "acknowledge" };
    case "reopen":
      return { type: "reopen" };
    case "snooze":
      return snoozeUntil
        ? { type: "snooze", snoozeUntil: new Date(snoozeUntil).toISOString() }
        : null;
    case "dismiss":
      return reason ? { type: "dismiss", reason } : null;
  }
}

export interface TenantInsightSummary {
  tenant: string;
  score?: number;
  counts: Record<InsightSeverity, number>;
  total: number;
}

// One row per tenant with active findings (cluster-wide findings roll up under
// "Cluster"), sorted worst first: posture score ascending when known, then by
// severity-weighted finding count.
export function summarizeByTenant(
  insights: Insight[],
  scores?: Map<string, number>,
): TenantInsightSummary[] {
  const byTenant = new Map<string, TenantInsightSummary>();

  for (const insight of insights) {
    if (!isActive(insight)) continue;
    const tenant = insightTenant(insight) ?? "Cluster";
    let row = byTenant.get(tenant);
    if (!row) {
      row = {
        tenant,
        score: scores?.get(tenant),
        counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        total: 0,
      };
      byTenant.set(tenant, row);
    }
    row.counts[insight.spec.severity] += 1;
    row.total += 1;
  }

  if (scores) {
    for (const [tenant, score] of scores) {
      if (!byTenant.has(tenant)) {
        byTenant.set(tenant, {
          tenant,
          score,
          counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          total: 0,
        });
      }
    }
  }

  const weight = (row: TenantInsightSummary) =>
    row.counts.critical * 8 + row.counts.high * 4 + row.counts.medium * 2 + row.counts.low;

  return Array.from(byTenant.values()).sort((a, b) => {
    if (a.score !== undefined && b.score !== undefined && a.score !== b.score) {
      return a.score - b.score;
    }
    if ((a.score === undefined) !== (b.score === undefined)) {
      return a.score === undefined ? 1 : -1;
    }
    return weight(b) - weight(a);
  });
}

export interface CheckInsightSummary {
  check: string;
  slug: string;
  severity: InsightSeverity;
  category: string;
  count: number;
  docsURL?: string;
}

// One row per check, ordered by how many active findings it accounts for, so
// the top row is the single fix with the widest effect.
export function summarizeByCheck(insights: Insight[]): CheckInsightSummary[] {
  const byCheck = new Map<string, CheckInsightSummary>();

  for (const insight of insights) {
    if (!isActive(insight)) continue;
    const { check, slug, severity, category, docsURL } = insight.spec;
    const row = byCheck.get(check);
    if (row) {
      row.count += 1;
    } else {
      byCheck.set(check, { check, slug, severity, category, count: 1, docsURL });
    }
  }

  return Array.from(byCheck.values()).sort(
    (a, b) => b.count - a.count || severityRank(a.severity) - severityRank(b.severity),
  );
}

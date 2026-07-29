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

import { describe, expect, it } from "vitest";

import {
  buildTriageAction,
  buildTriagePatch,
  insightTenant,
  isActive,
  summarizeByCheck,
  summarizeByTenant,
} from "@/lib/insights";
import type { Insight, InsightSeverity, InsightState } from "@/types/kubelb";

function insight(overrides: {
  name?: string;
  namespace?: string;
  check?: string;
  severity?: InsightSeverity;
  state?: InsightState;
}): Insight {
  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: overrides.name ?? "klb001-abc",
      namespace: overrides.namespace ?? "tenant-acme",
    },
    spec: {
      check: overrides.check ?? "KLB001",
      slug: "waf-detection-only",
      category: "security",
      severity: overrides.severity ?? "medium",
      message: "msg",
      targetRefs: [{ apiVersion: "kubelb.k8c.io/v1alpha1", kind: "Tenant", name: "acme" }],
    },
    status: overrides.state ? { state: overrides.state } : undefined,
  };
}

describe("buildTriagePatch", () => {
  // The CRD requires reason iff Dismissed and snoozeUntil iff Snoozed, so
  // every state change must clear the fields the new state forbids.
  it("acknowledge clears reason and snoozeUntil", () => {
    expect(buildTriagePatch({ type: "acknowledge" })).toEqual({
      spec: { triage: { state: "Acknowledged", reason: null, snoozeUntil: null } },
    });
  });

  it("snooze sets snoozeUntil and clears reason", () => {
    expect(buildTriagePatch({ type: "snooze", snoozeUntil: "2026-08-15T00:00:00Z" })).toEqual({
      spec: { triage: { state: "Snoozed", reason: null, snoozeUntil: "2026-08-15T00:00:00Z" } },
    });
  });

  it("dismiss sets reason and clears snoozeUntil", () => {
    expect(buildTriagePatch({ type: "dismiss", reason: "accepted_risk" })).toEqual({
      spec: { triage: { state: "Dismissed", reason: "accepted_risk", snoozeUntil: null } },
    });
  });

  it("reopen removes the triage object entirely", () => {
    expect(buildTriagePatch({ type: "reopen" })).toEqual({ spec: { triage: null } });
  });
});

describe("buildTriageAction", () => {
  it("blocks dismiss until a reason is chosen", () => {
    expect(buildTriageAction("dismiss", "", "")).toBeNull();
    expect(buildTriageAction("dismiss", "false_positive", "")).toEqual({
      type: "dismiss",
      reason: "false_positive",
    });
  });

  it("blocks snooze until a date is chosen", () => {
    expect(buildTriageAction("snooze", "", "")).toBeNull();
    expect(buildTriageAction("snooze", "", "2026-08-15T10:00")).toEqual({
      type: "snooze",
      snoozeUntil: new Date("2026-08-15T10:00").toISOString(),
    });
  });

  it("acknowledge and reopen need no extra fields", () => {
    expect(buildTriageAction("acknowledge", "", "")).toEqual({ type: "acknowledge" });
    expect(buildTriageAction("reopen", "", "")).toEqual({ type: "reopen" });
  });
});

describe("isActive", () => {
  it("counts open, acknowledged, and status-less findings as active", () => {
    expect(isActive(insight({ state: "Open" }))).toBe(true);
    expect(isActive(insight({ state: "Acknowledged" }))).toBe(true);
    expect(isActive(insight({}))).toBe(true);
  });

  it("excludes snoozed, dismissed, and fixed findings", () => {
    expect(isActive(insight({ state: "Snoozed" }))).toBe(false);
    expect(isActive(insight({ state: "Dismissed" }))).toBe(false);
    expect(isActive(insight({ state: "Fixed" }))).toBe(false);
  });
});

describe("insightTenant", () => {
  it("derives the tenant from a tenant namespace", () => {
    expect(insightTenant(insight({ namespace: "tenant-acme" }))).toBe("acme");
  });

  it("returns null for cluster-wide findings", () => {
    expect(insightTenant(insight({ namespace: "kubelb" }))).toBeNull();
  });
});

describe("summarizeByTenant", () => {
  const items = [
    insight({ name: "a", namespace: "tenant-acme", severity: "critical", state: "Open" }),
    insight({ name: "b", namespace: "tenant-acme", severity: "low", state: "Open" }),
    insight({ name: "c", namespace: "tenant-globex", severity: "high", state: "Open" }),
    insight({ name: "d", namespace: "tenant-globex", severity: "high", state: "Dismissed" }),
    insight({ name: "e", namespace: "kubelb", severity: "high", state: "Open" }),
  ];

  it("groups active findings per tenant with cluster-wide under Cluster", () => {
    const rows = summarizeByTenant(items);
    expect(rows[0].tenant).toBe("acme");
    expect(rows.map((r) => r.tenant).sort()).toEqual(["Cluster", "acme", "globex"]);
    const acme = rows.find((r) => r.tenant === "acme");
    expect(acme?.counts.critical).toBe(1);
    expect(acme?.total).toBe(2);
    const globex = rows.find((r) => r.tenant === "globex");
    expect(globex?.total).toBe(1);
  });

  it("sorts by posture score ascending when scores exist", () => {
    const scores = new Map([
      ["acme", 0.9],
      ["globex", 0.4],
    ]);
    const rows = summarizeByTenant(items, scores);
    expect(rows[0].tenant).toBe("globex");
  });

  it("includes tenants that only have a score", () => {
    const scores = new Map([["quiet", 0.5]]);
    const rows = summarizeByTenant(items, scores);
    expect(rows.some((r) => r.tenant === "quiet")).toBe(true);
  });
});

describe("summarizeByCheck", () => {
  it("ranks checks by active finding count", () => {
    const items = [
      insight({ name: "a", check: "KLB014", severity: "high" }),
      insight({ name: "b", check: "KLB014", severity: "high" }),
      insight({ name: "c", check: "KLB002", severity: "high" }),
      insight({ name: "d", check: "KLB010", severity: "info", state: "Dismissed" }),
    ];
    const rows = summarizeByCheck(items);
    expect(rows.map((r) => r.check)).toEqual(["KLB014", "KLB002"]);
    expect(rows[0].count).toBe(2);
  });
});

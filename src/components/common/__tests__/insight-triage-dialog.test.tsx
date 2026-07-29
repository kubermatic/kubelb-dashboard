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

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { InsightTriageDialog } from "../insight-triage-dialog";
import type { Insight } from "@/types/kubelb";

function makeInsight(triage?: Insight["spec"]["triage"]): Insight {
  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: { name: "klb014-3fa2c81b", namespace: "tenant-acme" },
    spec: {
      check: "KLB014",
      slug: "hostname-collision",
      category: "reliability",
      severity: "high",
      message: "Ingress shop claims api.example.com, also claimed by globex.",
      targetRefs: [{ apiVersion: "kubelb.k8c.io/v1alpha1", kind: "Route", name: "r1" }],
      triage,
    },
    status: { state: "Open" },
  };
}

describe("InsightTriageDialog", () => {
  it("submits acknowledge without extra fields", () => {
    const onSubmit = vi.fn();
    render(
      <InsightTriageDialog
        open
        onOpenChange={vi.fn()}
        insight={makeInsight()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "acknowledge" });
  });

  // Switching the decision select is a real-browser interaction (Base UI
  // selects don't commit under jsdom); the dismiss and snooze flows are
  // covered by buildTriageAction unit tests and the Playwright triage spec.

  it("offers reopen only for triaged findings and defaults to it when dismissed", () => {
    const onSubmit = vi.fn();
    render(
      <InsightTriageDialog
        open
        onOpenChange={vi.fn()}
        insight={makeInsight({ state: "Dismissed", reason: "accepted_risk" })}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onSubmit).toHaveBeenCalledWith({ type: "reopen" });
  });

  it("does not offer reopen for untriaged findings", () => {
    render(
      <InsightTriageDialog
        open
        onOpenChange={vi.fn()}
        insight={makeInsight()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Decision"));
    expect(screen.queryByRole("option", { name: "Reopen" })).toBeNull();
  });
});

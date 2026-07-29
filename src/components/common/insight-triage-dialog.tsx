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

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  DISMISSAL_REASONS,
  buildTriageAction,
  type TriageAction,
  type TriageDecision,
} from "@/lib/insights";
import type { Insight, InsightDismissalReason } from "@/types/kubelb";

const DECISIONS: { value: TriageDecision; label: string; hint: string }[] = [
  {
    value: "acknowledge",
    label: "Acknowledge",
    hint: "Seen and accepted as work to do. The finding stays visible and keeps counting.",
  },
  {
    value: "snooze",
    label: "Snooze",
    hint: "Hidden until the chosen date, then it reopens by itself.",
  },
  {
    value: "dismiss",
    label: "Dismiss",
    hint: "Closed for good. A dismissed finding that is detected again stays dismissed.",
  },
  {
    value: "reopen",
    label: "Reopen",
    hint: "Clears the triage decision so the finding is open again.",
  },
];

// Local datetime-local value for "in a week", the snooze default.
function defaultSnoozeUntil(): string {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

interface InsightTriageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insight: Insight;
  isPending?: boolean;
  onSubmit: (action: TriageAction) => void;
}

export function InsightTriageDialog({ open, onOpenChange, ...props }: InsightTriageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <TriageDialogContent onOpenChange={onOpenChange} {...props} />}
    </Dialog>
  );
}

function TriageDialogContent({
  onOpenChange,
  insight,
  isPending,
  onSubmit,
}: Omit<InsightTriageDialogProps, "open">) {
  const triaged = !!insight.spec.triage;
  const [decision, setDecision] = useState<TriageDecision>(() =>
    insight.spec.triage?.state === "Dismissed" ? "reopen" : "acknowledge",
  );
  const [reason, setReason] = useState<InsightDismissalReason | "">("");
  const [snoozeUntil, setSnoozeUntil] = useState(defaultSnoozeUntil);

  const decisions = DECISIONS.filter((d) => d.value !== "reopen" || triaged);
  const selected = decisions.find((d) => d.value === decision);
  const action = buildTriageAction(decision, reason, snoozeUntil);

  return (
    <DialogContent className="sm:max-w-md" data-testid="triage-dialog">
      <DialogHeader>
        <DialogTitle>Triage {insight.spec.check}</DialogTitle>
        <DialogDescription className="line-clamp-3">{insight.spec.message}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="triage-decision">Decision</FieldLabel>
          <Select value={decision} onValueChange={(v) => setDecision(v as TriageDecision)}>
            <SelectTrigger id="triage-decision" aria-label="Decision">
              <span>{selected?.label}</span>
            </SelectTrigger>
            <SelectContent>
              {decisions.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && <FieldDescription>{selected.hint}</FieldDescription>}
        </Field>

        {decision === "snooze" && (
          <Field>
            <FieldLabel htmlFor="triage-snooze-until">Snooze until</FieldLabel>
            <Input
              id="triage-snooze-until"
              type="datetime-local"
              value={snoozeUntil}
              onChange={(e) => setSnoozeUntil(e.target.value)}
            />
          </Field>
        )}

        {decision === "dismiss" && (
          <Field>
            <FieldLabel htmlFor="triage-reason">Reason</FieldLabel>
            <Select
              value={reason || undefined}
              onValueChange={(v) => setReason(v as InsightDismissalReason)}
            >
              <SelectTrigger id="triage-reason" aria-label="Reason">
                <span className={reason ? undefined : "text-muted-foreground"}>
                  {reason
                    ? DISMISSAL_REASONS.find((r) => r.value === reason)?.label
                    : "Select a reason"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {DISMISSAL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>A reason is required to dismiss a finding.</FieldDescription>
          </Field>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button disabled={!action || isPending} onClick={() => action && onSubmit(action)}>
          {isPending ? "Applying..." : "Apply"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

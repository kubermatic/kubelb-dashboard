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

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrafficEndpoint, TrafficFlow } from "@/api/traffic";
import type { TrafficSelection } from "@/components/common/traffic-graph";

function epId(e: TrafficEndpoint): string {
  return `${e.namespace}/${e.name}`;
}

function epLabel(e: TrafficEndpoint): string {
  return e.namespace ? `${e.namespace}/${e.name}` : e.name;
}

function verdictClass(v: string): string {
  if (/DROPPED|ERROR/i.test(v)) return "text-destructive";
  if (/FORWARDED|TRACED|REDIRECTED/i.test(v)) return "text-emerald-600 dark:text-emerald-400";
  return "text-muted-foreground";
}

function tally<T>(items: T[], key: (t: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Row({ label, count, className }: { label: string; count: number; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className={`truncate ${className ?? ""}`}>{label}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

export function TrafficDetailPanel({
  selection,
  flows,
  onClose,
}: {
  selection: TrafficSelection;
  flows: TrafficFlow[];
  onClose: () => void;
}) {
  const related =
    selection.type === "node"
      ? flows.filter((f) => epId(f.source) === selection.id || epId(f.destination) === selection.id)
      : flows.filter(
          (f) => epId(f.source) === selection.from && epId(f.destination) === selection.to,
        );

  const verdicts = tally(related, (f) => f.verdict);

  return (
    <div className="w-72 shrink-0 space-y-4 rounded-lg border bg-card/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {selection.type === "node" ? "Service" : "Connection"}
          </div>
          <div className="truncate text-sm font-semibold">
            {selection.type === "node" ? selection.id : `${selection.from} → ${selection.to}`}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="-mr-1 -mt-1 h-7 w-7 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {related.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No flow details in the current window (endpoint may be aggregated).
        </p>
      ) : (
        <>
          <Group title={`Flows (${String(related.length)})`}>
            {verdicts.map(([v, n]) => (
              <Row key={v} label={v} count={n} className={verdictClass(v)} />
            ))}
          </Group>

          {selection.type === "node" && (
            <>
              <Group title="Inbound from">
                {tally(
                  related.filter((f) => epId(f.destination) === selection.id),
                  (f) => epLabel(f.source),
                )
                  .slice(0, 8)
                  .map(([peer, n]) => (
                    <Row key={peer} label={peer} count={n} />
                  ))}
              </Group>
              <Group title="Outbound to">
                {tally(
                  related.filter((f) => epId(f.source) === selection.id),
                  (f) => epLabel(f.destination),
                )
                  .slice(0, 8)
                  .map(([peer, n]) => (
                    <Row key={peer} label={peer} count={n} />
                  ))}
              </Group>
            </>
          )}

          {selection.type === "edge" && (
            <Group title="Ports">
              {tally(
                related.filter((f) => f.port > 0),
                (f) => `${f.protocol}:${String(f.port)}`,
              ).map(([p, n]) => (
                <Row key={p} label={p} count={n} />
              ))}
            </Group>
          )}
        </>
      )}
    </div>
  );
}

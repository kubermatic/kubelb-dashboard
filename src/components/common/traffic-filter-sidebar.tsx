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

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { namespaceColor } from "@/lib/traffic-colors";
import type { TrafficFilters, VerdictFilter } from "@/lib/traffic-filters";

const CONNECTION_BUCKETS = [
  { value: "0", label: "All traffic" },
  { value: "100", label: "100+ connections" },
  { value: "1000", label: "1K+ connections" },
  { value: "10000", label: "10K+ connections" },
];

const VERDICT_OPTIONS: { value: VerdictFilter; label: string }[] = [
  { value: "all", label: "Any verdict" },
  { value: "forwarded", label: "Forwarded" },
  { value: "dropped", label: "Dropped" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="cursor-pointer text-sm font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function TrafficFilterSidebar({
  filters,
  namespaces,
  onChange,
}: {
  filters: TrafficFilters;
  namespaces: string[];
  onChange: (next: TrafficFilters) => void;
}) {
  const set = (patch: Partial<TrafficFilters>) => onChange({ ...filters, ...patch });
  const hidden = new Set(filters.hiddenNamespaces);

  return (
    <div className="w-56 shrink-0 space-y-5 rounded-lg border bg-card/40 p-4">
      <div className="text-sm font-semibold">Traffic filters</div>
      <Section title="Scope">
        <ToggleRow
          label="KubeLB only"
          checked={filters.scope === "kubelb"}
          onChange={(v) => set({ scope: v ? "kubelb" : "all" })}
        />
      </Section>

      <Section title="Connections">
        <Select
          value={String(filters.minConnections)}
          onValueChange={(v) => set({ minConnections: Number(v) })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONNECTION_BUCKETS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Verdict">
        <Select value={filters.verdict} onValueChange={(v) => set({ verdict: v as VerdictFilter })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VERDICT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Filtering">
        <ToggleRow
          label="Hide system"
          checked={filters.hideSystem}
          onChange={(v) => set({ hideSystem: v })}
        />
        <ToggleRow
          label="Hide external"
          checked={filters.hideExternal}
          onChange={(v) => set({ hideExternal: v })}
        />
        <ToggleRow
          label="Aggregate external"
          checked={filters.aggregateExternal}
          onChange={(v) => set({ aggregateExternal: v })}
        />
      </Section>

      {namespaces.length > 0 && (
        <Section title="Namespaces">
          <div className="flex items-center justify-between text-xs">
            <button
              className="text-primary hover:underline"
              onClick={() => set({ hiddenNamespaces: [] })}
            >
              All
            </button>
            <button
              className="text-muted-foreground hover:underline"
              onClick={() => set({ hiddenNamespaces: [...namespaces] })}
            >
              None
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-auto">
            {namespaces.map((ns) => {
              const on = !hidden.has(ns);
              return (
                <button
                  key={ns}
                  onClick={() =>
                    set({
                      hiddenNamespaces: on
                        ? [...filters.hiddenNamespaces, ns]
                        : filters.hiddenNamespaces.filter((n) => n !== ns),
                    })
                  }
                  className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-muted"
                  style={{ opacity: on ? 1 : 0.4 }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: namespaceColor(ns, namespaces) }}
                  />
                  <span className="truncate">{ns}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

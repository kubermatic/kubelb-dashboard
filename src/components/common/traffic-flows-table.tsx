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

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TrafficEndpoint, TrafficFlow } from "@/api/traffic";

type SortField = "time" | "source" | "destination" | "verdict";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;
const COLS = "150px 1fr 1fr 130px 110px";

function label(e: TrafficEndpoint): string {
  return e.namespace ? `${e.namespace}/${e.name}` : e.name;
}

function verdictClass(v: string): string {
  if (/DROPPED|ERROR/i.test(v)) return "text-destructive";
  if (/FORWARDED|TRACED|REDIRECTED/i.test(v)) return "text-emerald-600 dark:text-emerald-400";
  return "text-muted-foreground";
}

function requestLabel(f: TrafficFlow): string {
  if (f.l7http) {
    const status = f.l7http.status ? ` · ${String(f.l7http.status)}` : "";
    return `${f.l7http.method} ${f.l7http.path}${status}`;
  }
  if (f.l7) return f.l7.toUpperCase();
  return `${f.protocol}${f.port ? `:${String(f.port)}` : ""}`;
}

function HeaderCell({
  field,
  label: text,
  sort,
  dir,
  onSort,
}: {
  field: SortField;
  label: string;
  sort: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 px-3 py-2 text-left font-medium hover:text-foreground"
    >
      {text}
      {sort === field &&
        (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  );
}

export function TrafficFlowsTable({ flows }: { flows: TrafficFlow[] }) {
  const [sort, setSort] = useState<SortField>("time");
  const [dir, setDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const key = (f: TrafficFlow): string =>
      sort === "time" ? f.time : sort === "verdict" ? f.verdict : label(f[sort]);
    const arr = [...flows].sort((a, b) => key(a).localeCompare(key(b)));
    return dir === "desc" ? arr.reverse() : arr;
  }, [flows, sort, dir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const effPage = Math.min(page, pageCount - 1);
  const start = effPage * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  const onSort = (f: SortField) => {
    if (f === sort) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(f);
      setDir("asc");
    }
    setPage(0);
  };

  return (
    <div className="rounded-md border">
      <div
        className="grid border-b bg-muted/40 text-xs text-muted-foreground"
        style={{ gridTemplateColumns: COLS }}
      >
        <HeaderCell field="time" label="Time" sort={sort} dir={dir} onSort={onSort} />
        <HeaderCell field="source" label="Source" sort={sort} dir={dir} onSort={onSort} />
        <HeaderCell field="destination" label="Destination" sort={sort} dir={dir} onSort={onSort} />
        <div className="px-3 py-2 font-medium">Request</div>
        <HeaderCell field="verdict" label="Verdict" sort={sort} dir={dir} onSort={onSort} />
      </div>

      {rows.length === 0 ? (
        <div className="px-3 py-10 text-center text-sm text-muted-foreground">No flows match.</div>
      ) : (
        rows.map((f, i) => (
          <div
            key={start + i}
            className="grid items-center border-b text-sm last:border-0 hover:bg-muted/30"
            style={{ gridTemplateColumns: COLS, height: 34 }}
          >
            <div className="truncate px-3 tabular-nums text-muted-foreground">
              {f.time ? new Date(f.time).toLocaleTimeString() : "—"}
            </div>
            <div className="truncate px-3">{label(f.source)}</div>
            <div className="truncate px-3">{label(f.destination)}</div>
            <div className="truncate px-3 text-muted-foreground">{requestLabel(f)}</div>
            <div className={cn("truncate px-3 font-medium", verdictClass(f.verdict))}>
              {f.verdict}
            </div>
          </div>
        ))
      )}

      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>
          {sorted.length === 0
            ? "0 flows"
            : `${String(start + 1)}–${String(Math.min(start + PAGE_SIZE, sorted.length))} of ${String(sorted.length)}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={effPage === 0}
            onClick={() => setPage(effPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="tabular-nums">
            {effPage + 1} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled={effPage >= pageCount - 1}
            onClick={() => setPage(effPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

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

import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface ResourceCounter {
  icon: LucideIcon;
  label: string;
  count: number;
  href: string;
  isLoading?: boolean;
  isError?: boolean;
}

export function ResourceCounterRow({ counters }: { counters: ResourceCounter[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-5 py-3.5">
      {counters.map((c, i) => (
        <div key={c.label} className="flex items-center gap-x-6">
          {i > 0 && <div className="hidden h-8 w-px bg-border sm:block" />}
          <CounterItem {...c} />
        </div>
      ))}
    </div>
  );
}

function CounterItem({ icon: Icon, label, count, href, isLoading, isError }: ResourceCounter) {
  return (
    <Link
      to={href}
      className="group flex items-center gap-2.5 rounded-md px-1 py-1 transition-colors hover:bg-surface-hover"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {isLoading ? (
        <Skeleton className="h-6 w-8" />
      ) : isError ? (
        <span className="text-sm text-destructive">err</span>
      ) : (
        <span className="text-xl font-semibold tabular-nums">{count}</span>
      )}
      <span className="text-sm text-muted-foreground">{label}</span>
    </Link>
  );
}

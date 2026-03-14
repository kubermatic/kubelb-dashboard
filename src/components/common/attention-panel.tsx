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
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useAge } from "@/hooks/use-age";
import type { AttentionItem } from "@/hooks/use-attention-items";

function AttentionRow({ item }: { item: AttentionItem }) {
  const age = useAge(item.timestamp);

  return (
    <Link
      to={item.href}
      className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover"
    >
      {item.severity === "error" ? (
        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">
            {item.kind}
            <span className="font-normal text-muted-foreground">
              {" "}
              {item.namespace ? `${item.namespace}/` : ""}
              {item.name}
            </span>
          </span>
          {age && <span className="shrink-0 text-xs text-muted-foreground">{age}</span>}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
      </div>
    </Link>
  );
}

export function AttentionPanel({
  items,
  isLoading,
}: {
  items: AttentionItem[];
  isLoading: boolean;
}) {
  if (isLoading) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="mb-2 size-8 text-success opacity-50" />
        <p className="text-sm font-medium text-muted-foreground">All systems operational</p>
        <p className="mt-0.5 text-xs text-muted-foreground">No resources need attention</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <AttentionRow key={`${item.kind}-${item.namespace ?? ""}-${item.name}`} item={item} />
      ))}
    </div>
  );
}

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
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatAge } from "@/lib/format";

interface ResourceHeaderProps {
  name: string;
  namespace?: string;
  kind: string;
  createdAt?: string;
  backHref: string;
  backLabel: string;
}

export function ResourceHeader({
  name,
  namespace,
  kind,
  createdAt,
  backHref,
  backLabel,
}: ResourceHeaderProps) {
  return (
    <div className="space-y-3">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>
      <div className="flex items-center gap-3">
        <Badge variant="outline">{kind}</Badge>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {namespace && <Badge variant="secondary">{namespace}</Badge>}
        {createdAt && (
          <span className="text-sm text-muted-foreground">Created {formatAge(createdAt)} ago</span>
        )}
      </div>
    </div>
  );
}

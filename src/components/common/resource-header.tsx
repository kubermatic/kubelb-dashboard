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
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAge } from "@/hooks/use-age";

interface ResourceHeaderProps {
  name: string;
  namespace?: string;
  kind: string;
  createdAt?: string;
  backHref: string;
  backLabel: string;
}

function CreatedAge({ timestamp }: { timestamp: string }) {
  const age = useAge(timestamp);
  return <span className="text-sm text-muted-foreground">Created {age} ago</span>;
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
    <div className="space-y-3" data-testid="page-header">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        <Link to={backHref} className="text-muted-foreground hover:text-foreground">
          {backLabel}
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="text-foreground">{name}</span>
      </nav>
      <div className="flex items-center gap-3">
        <Badge variant="outline">{kind}</Badge>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {namespace && <Badge variant="secondary">{namespace}</Badge>}
        {createdAt && <CreatedAge timestamp={createdAt} />}
      </div>
    </div>
  );
}

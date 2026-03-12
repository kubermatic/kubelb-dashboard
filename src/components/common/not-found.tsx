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
import { FileQuestion } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <FileQuestion className="size-16 text-muted-foreground/40" />
        <h1 className="text-4xl font-bold text-muted-foreground/60">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Link to="/" className="mt-2 text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}

interface ResourceNotFoundProps {
  resourceKind: string;
  backHref: string;
  backLabel: string;
}

export function ResourceNotFound({ resourceKind, backHref, backLabel }: ResourceNotFoundProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <FileQuestion className="size-12 text-muted-foreground/40" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-muted-foreground">{resourceKind} not found</h2>
          <p className="text-sm text-muted-foreground/80">
            The requested {resourceKind.toLowerCase()} does not exist or has been deleted.
          </p>
        </div>
        <Link to={backHref} className="mt-2 text-sm text-primary hover:underline">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

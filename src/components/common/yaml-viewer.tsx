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

import { useMemo } from "react";
import { dump } from "js-yaml";

import { CopyButton } from "@/components/common/copy-button";
import { YamlEditor } from "@/components/common/yaml-editor";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { sanitizeForView } from "@/lib/kube-sanitize";

interface YamlViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: unknown;
  title?: string;
  apiVersion?: string;
  kind?: string;
}

export function YamlViewer({
  open,
  onOpenChange,
  resource,
  title,
  apiVersion,
  kind,
}: YamlViewerProps) {
  const yaml = useMemo(() => {
    const sanitized = sanitizeForView(resource) as Record<string, unknown> | null;
    if (sanitized && typeof sanitized === "object") {
      if (apiVersion && !sanitized.apiVersion) sanitized.apiVersion = apiVersion;
      if (kind && !sanitized.kind) sanitized.kind = kind;
    }
    return dump(sanitized, { noRefs: true, lineWidth: -1 });
  }, [resource, apiVersion, kind]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[600px] data-[side=right]:sm:max-w-[600px]"
        data-testid="yaml-viewer"
      >
        <SheetHeader className="flex-row items-center justify-between pr-10">
          <SheetTitle>{title ?? "Resource YAML"}</SheetTitle>
          <CopyButton value={yaml} />
        </SheetHeader>
        <div className="flex-1 overflow-hidden rounded-md border">
          <YamlEditor value={yaml} readOnly height="100%" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

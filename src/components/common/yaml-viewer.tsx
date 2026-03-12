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

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CopyButton } from "@/components/common/copy-button";

interface YamlViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: unknown;
  title?: string;
}

export function YamlViewer({ open, onOpenChange, resource, title }: YamlViewerProps) {
  const yaml = useMemo(() => dump(resource, { noRefs: true, lineWidth: -1 }), [resource]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader className="flex-row items-center justify-between pr-10">
          <SheetTitle>{title ?? "Resource YAML"}</SheetTitle>
          <CopyButton value={yaml} />
        </SheetHeader>
        <div className="flex-1 overflow-auto rounded-md bg-muted p-4">
          <pre className="font-mono text-sm text-foreground">{yaml}</pre>
        </div>
      </SheetContent>
    </Sheet>
  );
}

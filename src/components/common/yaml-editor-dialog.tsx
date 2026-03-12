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

import { useCallback, useState } from "react";
import yaml from "js-yaml";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogClose } from "@/components/ui/dialog";

interface LockedFields {
  name?: boolean;
  namespace?: boolean;
  kind?: boolean;
  apiVersion?: boolean;
}

interface YamlEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: string;
  resourceKind: string;
  apiVersion: string;
  initialYaml?: string;
  onSubmit: (parsed: unknown) => void;
  isPending?: boolean;
  lockedFields?: LockedFields;
}

interface KubeResource {
  kind?: string;
  apiVersion?: string;
  metadata?: {
    name?: string;
    namespace?: string;
  };
}

function validateLockedFields(
  parsed: KubeResource,
  initial: KubeResource,
  resourceKind: string,
  apiVersion: string,
  lockedFields: LockedFields,
): string | null {
  if (parsed.kind !== resourceKind) {
    return `Expected kind: ${resourceKind}`;
  }

  if (parsed.apiVersion !== apiVersion) {
    return `Expected apiVersion: ${apiVersion}`;
  }

  if (lockedFields.name && parsed.metadata?.name !== initial.metadata?.name) {
    return "Resource name cannot be changed";
  }

  if (lockedFields.namespace && parsed.metadata?.namespace !== initial.metadata?.namespace) {
    return "Resource namespace cannot be changed";
  }

  return null;
}

export function YamlEditorDialog({
  open,
  onOpenChange,
  mode,
  title,
  resourceKind,
  apiVersion,
  initialYaml = "",
  onSubmit,
  isPending,
  lockedFields = {},
}: YamlEditorDialogProps) {
  const [value, setValue] = useState(initialYaml);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setValue(initialYaml);
    setError(null);
    onOpenChange(next);
  };

  const handleSubmit = useCallback(() => {
    let parsed: KubeResource;
    try {
      parsed = yaml.load(value) as KubeResource;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid YAML");
      return;
    }

    if (!parsed || typeof parsed !== "object") {
      setError("YAML must be a valid object");
      return;
    }

    const effectiveLocked: LockedFields = {
      ...lockedFields,
      kind: true,
      apiVersion: true,
    };

    let initialParsed: KubeResource = {};
    if (mode === "edit" && initialYaml) {
      try {
        initialParsed = yaml.load(initialYaml) as KubeResource;
      } catch {
        // noop
      }
    }

    const validationError = validateLockedFields(
      parsed,
      initialParsed,
      resourceKind,
      apiVersion,
      effectiveLocked,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSubmit(parsed);
  }, [value, lockedFields, mode, initialYaml, resourceKind, apiVersion, onSubmit]);

  const isCreate = mode === "create";
  const submitLabel = isPending
    ? isCreate
      ? "Creating..."
      : "Saving..."
    : isCreate
      ? "Create"
      : "Save";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Textarea
          className="min-h-[200px] flex-1 resize-y font-mono text-sm"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          spellCheck={false}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

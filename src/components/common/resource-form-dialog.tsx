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
import { withTheme } from "@rjsf/core";
import type { IChangeEvent } from "@rjsf/core";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import yaml from "js-yaml";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { shadcnTheme } from "@/lib/rjsf/theme";

const Form = withTheme(shadcnTheme);

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: string;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData?: Record<string, unknown>;
  onSubmit: (data: unknown) => void;
  isPending?: boolean;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  mode,
  title,
  schema,
  uiSchema,
  formData,
  onSubmit,
  isPending,
}: ResourceFormDialogProps) {
  const [tab, setTab] = useState<string>("form");
  const [localFormData, setLocalFormData] = useState<Record<string, unknown>>(formData ?? {});
  const [yamlValue, setYamlValue] = useState("");
  const [yamlError, setYamlError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setLocalFormData(formData ?? {});
    setYamlValue("");
    setYamlError(null);
    setTab("form");
    onOpenChange(next);
  };

  const handleTabChange = (nextTab: string) => {
    if (nextTab === "yaml" && tab === "form") {
      setYamlValue(yaml.dump(localFormData, { noRefs: true, lineWidth: -1 }));
      setYamlError(null);
    } else if (nextTab === "form" && tab === "yaml") {
      try {
        const parsed = yaml.load(yamlValue) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") {
          setYamlError("YAML must be a valid object");
          return;
        }
        setLocalFormData(parsed);
        setYamlError(null);
      } catch (e) {
        setYamlError(e instanceof Error ? e.message : "Invalid YAML");
        return;
      }
    }
    setTab(nextTab);
  };

  const handleFormChange = (e: IChangeEvent) => {
    setLocalFormData((e.formData as Record<string, unknown>) ?? {});
  };

  const handleSubmit = useCallback(() => {
    if (tab === "form") {
      onSubmit(localFormData);
    } else {
      try {
        const parsed = yaml.load(yamlValue) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") {
          setYamlError("YAML must be a valid object");
          return;
        }
        setYamlError(null);
        onSubmit(parsed);
      } catch (e) {
        setYamlError(e instanceof Error ? e.message : "Invalid YAML");
      }
    }
  }, [tab, localFormData, yamlValue, onSubmit]);

  const isCreate = mode === "create";
  const submitLabel = isPending
    ? isCreate
      ? "Creating..."
      : "Saving..."
    : isCreate
      ? "Create"
      : "Save";

  const formUiSchema: UiSchema = {
    ...uiSchema,
    "ui:submitButtonOptions": { norender: true },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="yaml">YAML</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="flex-1 overflow-y-auto mt-0 pt-4">
            <Form
              schema={schema}
              uiSchema={formUiSchema}
              formData={localFormData}
              validator={validator}
              onChange={handleFormChange}
              onError={() => {}}
            />
          </TabsContent>

          <TabsContent value="yaml" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
            <Textarea
              className="min-h-[200px] flex-1 resize-y font-mono text-sm"
              value={yamlValue}
              onChange={(e) => {
                setYamlValue(e.target.value);
                setYamlError(null);
              }}
              spellCheck={false}
            />
            {yamlError && <p className="mt-2 text-sm text-destructive">{yamlError}</p>}
          </TabsContent>
        </Tabs>

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

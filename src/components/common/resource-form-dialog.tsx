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
import { Loader2 } from "lucide-react";

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
import { YamlEditor } from "@/components/common/yaml-editor";
import { FORM_EDITOR_ENABLED, YAML_EDITOR_ENABLED } from "@/lib/feature-flags";
import { shadcnTheme } from "@/lib/rjsf/theme";

const Form = withTheme(shadcnTheme);

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: string;
  schema?: RJSFSchema;
  uiSchema: UiSchema;
  isSchemaLoading?: boolean;
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
  isSchemaLoading,
  formData,
  onSubmit,
  isPending,
}: ResourceFormDialogProps) {
  const defaultTab = FORM_EDITOR_ENABLED ? "form" : "yaml";
  const [tab, setTab] = useState<string>(defaultTab);
  const [localFormData, setLocalFormData] = useState<Record<string, unknown>>(formData ?? {});
  const [yamlValue, setYamlValue] = useState("");
  const [yamlError, setYamlError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setLocalFormData(formData ?? {});
    setYamlValue("");
    setYamlError(null);
    setTab(defaultTab);
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

        {isSchemaLoading || !schema ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs
            value={tab}
            onValueChange={handleTabChange}
            className="flex-1 flex flex-col min-h-0"
          >
            {FORM_EDITOR_ENABLED && YAML_EDITOR_ENABLED && (
              <TabsList>
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="yaml">YAML</TabsTrigger>
              </TabsList>
            )}

            {FORM_EDITOR_ENABLED && (
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
            )}

            {YAML_EDITOR_ENABLED && (
              <TabsContent value="yaml" className="flex-1 flex flex-col min-h-0 mt-0 pt-4">
                <YamlEditor
                  value={yamlValue}
                  onChange={(v) => {
                    setYamlValue(v);
                    setYamlError(null);
                  }}
                  schema={schema}
                  height="400px"
                />
                {yamlError && <p className="mt-2 text-sm text-destructive">{yamlError}</p>}
              </TabsContent>
            )}
          </Tabs>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending || !schema}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

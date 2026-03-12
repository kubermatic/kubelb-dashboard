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

/* eslint-disable react-refresh/only-export-components */
import type {
  ArrayFieldTemplateProps,
  DescriptionFieldProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  SubmitButtonProps,
  TemplatesType,
  TitleFieldProps,
} from "@rjsf/utils";
import { getSubmitButtonOptions } from "@rjsf/utils";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function FieldTemplate({
  id,
  label,
  required,
  description,
  errors,
  children,
  hidden,
  displayLabel,
}: FieldTemplateProps) {
  if (hidden) return <div className="hidden">{children}</div>;

  return (
    <div className="flex flex-col gap-1.5">
      {displayLabel && label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {displayLabel && description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errors}
    </div>
  );
}

function ObjectFieldTemplate({
  title,
  description,
  properties,
  uiSchema,
}: ObjectFieldTemplateProps) {
  const isRoot = !title || uiSchema?.["ui:field"] === "root";

  return (
    <div className="flex flex-col gap-4">
      {!isRoot && title && (
        <>
          <div>
            <h4 className="text-sm font-medium">{title}</h4>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <Separator />
        </>
      )}
      {properties.map((prop) => (
        <div key={prop.name}>{prop.content}</div>
      ))}
    </div>
  );
}

function ArrayFieldTemplate({ title, items, canAdd, onAddClick }: ArrayFieldTemplateProps) {
  return (
    <div className="flex flex-col gap-3">
      {title && <h4 className="text-sm font-medium">{title}</h4>}
      {items}
      {canAdd && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onAddClick}>
          <Plus />
          Add Item
        </Button>
      )}
    </div>
  );
}

function TitleFieldTemplate({ title }: TitleFieldProps) {
  if (!title) return null;
  return <h3 className="text-base font-semibold">{title}</h3>;
}

function DescriptionFieldTemplate({ description }: DescriptionFieldProps) {
  if (!description) return null;
  return <p className="text-sm text-muted-foreground">{description}</p>;
}

function SubmitButton(props: SubmitButtonProps) {
  const { norender } = getSubmitButtonOptions(props.uiSchema);
  if (norender) return null;
  return <Button type="submit">Submit</Button>;
}

export const templates: Partial<TemplatesType> = {
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
  TitleFieldTemplate,
  DescriptionFieldTemplate,
  ButtonTemplates: { SubmitButton } as TemplatesType["ButtonTemplates"],
};

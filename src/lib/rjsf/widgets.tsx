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
import type { RegistryWidgetsType, WidgetProps } from "@rjsf/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

function TextWidget({
  id,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  options,
}: WidgetProps) {
  return (
    <Input
      id={id}
      value={(value as string) ?? ""}
      required={required}
      disabled={disabled || readonly}
      placeholder={placeholder}
      type={(options.inputType as string) ?? "text"}
      onChange={(e) => onChange(e.target.value === "" ? options.emptyValue : e.target.value)}
      onBlur={() => onBlur(id, value)}
      onFocus={() => onFocus(id, value)}
    />
  );
}

function TextareaWidget({
  id,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  placeholder,
}: WidgetProps) {
  return (
    <Textarea
      id={id}
      value={(value as string) ?? ""}
      required={required}
      disabled={disabled || readonly}
      placeholder={placeholder}
      className="min-h-[80px]"
      onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
      onBlur={() => onBlur(id, value)}
      onFocus={() => onFocus(id, value)}
    />
  );
}

function CheckboxWidget({ id, value, disabled, readonly, onChange, label }: WidgetProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={!!value}
        disabled={disabled || readonly}
        onCheckedChange={(checked) => onChange(checked)}
      />
      {label && (
        <label htmlFor={id} className="text-sm leading-none font-medium select-none">
          {label}
        </label>
      )}
    </div>
  );
}

function SwitchWidget({ id, value, disabled, readonly, onChange }: WidgetProps) {
  return (
    <Switch
      id={id}
      checked={!!value}
      disabled={disabled || readonly}
      onCheckedChange={(checked) => onChange(checked)}
    />
  );
}

function SelectWidget({
  id,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  options,
}: WidgetProps) {
  const enumOptions = options.enumOptions ?? [];

  return (
    <Select
      value={value as string}
      disabled={disabled || readonly}
      required={required}
      onValueChange={(v) => onChange(v)}
      onOpenChange={(open) => {
        if (open) onFocus(id, value);
        else onBlur(id, value);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {enumOptions.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export const widgets: RegistryWidgetsType = {
  TextWidget,
  TextareaWidget,
  CheckboxWidget,
  SelectWidget,
  switch: SwitchWidget,
};

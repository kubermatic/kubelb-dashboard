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

import React, { useCallback, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { YamlEditor } from "@/components/common/yaml-editor";
import {
  validateRFC1123Name,
  validateOptionalRFC1123Name,
  validateLabelKey,
  validateLabelValue,
} from "@/lib/validators";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import type { WAFPolicy, WAFPolicySpec, WAFFailureMode, WAFTargetRef } from "@/types/kubelb";
import type { ObjectMeta } from "@/types/kubernetes";

const API_VERSION = "kubelb.k8c.io/v1alpha1";
const RESOURCE_KIND = "WAFPolicy";

type TargetingMode = "none" | "global" | "targetRef" | "targetSelector";

interface LabelEntry {
  key: string;
  value: string;
}

interface FormState {
  name: string;
  failureMode: WAFFailureMode;
  targetingMode: TargetingMode;
  refKind: "HTTPRoute" | "GRPCRoute";
  refName: string;
  refNamespace: string;
  labels: LabelEntry[];
  directives: string;
}

type BlurredFields = Partial<Record<string, boolean>>;

const EMPTY_FORM: FormState = {
  name: "",
  failureMode: "Closed",
  targetingMode: "none",
  refKind: "HTTPRoute",
  refName: "",
  refNamespace: "",
  labels: [{ key: "", value: "" }],
  directives: "",
};

function formToPolicy(form: FormState, baseMetadata?: ObjectMeta): WAFPolicy {
  const spec: WAFPolicySpec = {
    failureMode: form.failureMode,
  };

  if (form.targetingMode === "global") {
    spec.global = true;
  } else if (form.targetingMode === "targetRef") {
    const ref: WAFTargetRef = {
      group: "gateway.networking.k8s.io",
      kind: form.refKind,
      name: form.refName.trim(),
    };
    if (form.refNamespace.trim()) ref.namespace = form.refNamespace.trim();
    spec.targetRef = ref;
  } else if (form.targetingMode === "targetSelector") {
    const matchLabels = form.labels.reduce<Record<string, string>>((acc, { key, value }) => {
      if (key.trim()) acc[key.trim()] = value.trim();
      return acc;
    }, {});
    if (Object.keys(matchLabels).length > 0) {
      spec.targetSelector = { matchLabels };
    }
  }

  const lines = form.directives
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 0) {
    spec.directives = lines;
  }

  const metadata: ObjectMeta = baseMetadata
    ? { ...baseMetadata, name: form.name }
    : { name: form.name };

  return {
    apiVersion: API_VERSION,
    kind: RESOURCE_KIND,
    metadata,
    spec,
  };
}

function policyToForm(policy: WAFPolicy): FormState {
  const { spec, metadata } = policy;

  let targetingMode: TargetingMode = "none";
  if (spec.global) targetingMode = "global";
  else if (spec.targetRef) targetingMode = "targetRef";
  else if (spec.targetSelector) targetingMode = "targetSelector";

  const matchLabels =
    (spec.targetSelector as { matchLabels?: Record<string, string> } | undefined)?.matchLabels ??
    {};
  const entries = Object.entries(matchLabels).map(([key, value]) => ({ key, value }));

  return {
    name: metadata.name,
    failureMode: spec.failureMode ?? "Closed",
    targetingMode,
    refKind: (spec.targetRef?.kind as "HTTPRoute" | "GRPCRoute") ?? "HTTPRoute",
    refName: spec.targetRef?.name ?? "",
    refNamespace: spec.targetRef?.namespace ?? "",
    labels: entries.length > 0 ? [...entries, { key: "", value: "" }] : [{ key: "", value: "" }],
    directives: spec.directives?.join("\n") ?? "",
  };
}

function shouldShowError(field: string, blurred: BlurredFields, submitted: boolean): boolean {
  return submitted || !!blurred[field];
}

interface WAFPolicyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: string;
  isPending: boolean;
  policy?: WAFPolicy | null;
  onSubmit: (policy: WAFPolicy) => void;
}

export function WAFPolicyFormDialog({
  open,
  onOpenChange,
  mode,
  title,
  isPending,
  policy,
  onSubmit,
}: WAFPolicyFormDialogProps) {
  const [tab, setTab] = useState<"form" | "yaml">("form");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [yamlValue, setYamlValue] = useState("");
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [blurred, setBlurred] = useState<BlurredFields>({});
  const [submitted, setSubmitted] = useState(false);

  const [prevPolicy, setPrevPolicy] = useState<WAFPolicy | null | undefined>(undefined);
  if (open && policy && policy !== prevPolicy) {
    setPrevPolicy(policy);
    const next = policyToForm(policy);
    setForm(next);
    if (tab === "yaml") {
      setYamlValue(yaml.dump(sanitizeForEdit(policy), { noRefs: true, lineWidth: -1 }));
    }
  }

  const editMetadata = useMemo((): ObjectMeta | undefined => {
    if (mode !== "edit" || !policy) return undefined;
    const { name, namespace, resourceVersion, labels, annotations } = policy.metadata;
    return { name, namespace, resourceVersion, labels, annotations };
  }, [mode, policy]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const markBlurred = useCallback((field: string) => {
    setBlurred((prev) => ({ ...prev, [field]: true }));
  }, []);

  const nameError = useMemo(() => validateRFC1123Name(form.name), [form.name]);
  const refNameError = useMemo(() => {
    if (form.targetingMode !== "targetRef") return null;
    if (!form.refName.trim()) return "Target name is required";
    return validateOptionalRFC1123Name(form.refName.trim());
  }, [form.targetingMode, form.refName]);
  const refNamespaceError = useMemo(
    () =>
      form.targetingMode === "targetRef"
        ? validateOptionalRFC1123Name(form.refNamespace.trim())
        : null,
    [form.targetingMode, form.refNamespace],
  );

  const labelErrors = useMemo(() => {
    if (form.targetingMode !== "targetSelector") return [];
    return form.labels.map((entry) => ({
      key: entry.key.trim() ? validateLabelKey(entry.key.trim()) : null,
      value: entry.value.trim() ? validateLabelValue(entry.value.trim()) : null,
    }));
  }, [form.targetingMode, form.labels]);

  const currentYaml = useMemo(() => {
    const p = formToPolicy(form, editMetadata);
    return yaml.dump(p, { noRefs: true, lineWidth: -1 });
  }, [form, editMetadata]);

  const handleTabChange = (next: string) => {
    if (next === "yaml") {
      setYamlValue(currentYaml);
      setYamlError(null);
    }
    setTab(next as "form" | "yaml");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(EMPTY_FORM);
      setYamlError(null);
      setYamlValue("");
      setBlurred({});
      setSubmitted(false);
      setTab("form");
      setPrevPolicy(undefined);
    }
    onOpenChange(next);
  };

  const updateLabel = (index: number, field: "key" | "value", val: string) => {
    setForm((prev) => {
      const next = [...prev.labels];
      next[index] = { ...next[index], [field]: val };
      const allFilled = next.every((e) => e.key.trim() !== "");
      if (allFilled) next.push({ key: "", value: "" });
      return { ...prev, labels: next };
    });
  };

  const removeLabel = (index: number) => {
    setForm((prev) => {
      const next = prev.labels.filter((_, i) => i !== index);
      if (next.length === 0) next.push({ key: "", value: "" });
      return { ...prev, labels: next };
    });
  };

  const duplicateKeys = useMemo(() => {
    const keys = form.labels.map((e) => e.key.trim()).filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const k of keys) {
      if (seen.has(k)) dupes.add(k);
      seen.add(k);
    }
    return dupes;
  }, [form.labels]);

  const handleSubmit = () => {
    if (tab === "yaml") {
      try {
        const parsed = yaml.load(yamlValue) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") {
          setYamlError("YAML must be a valid object");
          return;
        }
        setYamlError(null);
        onSubmit(parsed as unknown as WAFPolicy);
      } catch (e) {
        setYamlError(e instanceof Error ? e.message : "Invalid YAML");
      }
      return;
    }

    setSubmitted(true);
    if (mode === "create" && nameError) return;
    if (refNameError) return;
    if (refNamespaceError) return;
    if (form.targetingMode === "targetSelector" && duplicateKeys.size > 0) return;
    if (labelErrors.some((e) => e.key || e.value)) return;
    onSubmit(formToPolicy(form, editMetadata));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[80vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="yaml">YAML</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-6 py-2">
              <FieldSection title="General">
                <FieldGroup
                  label="Name"
                  error={shouldShowError("name", blurred, submitted) ? nameError : null}
                  required={mode === "create"}
                >
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value.toLowerCase())}
                    onBlur={() => markBlurred("name")}
                    placeholder="my-waf-policy"
                    disabled={mode === "edit"}
                    autoFocus={mode === "create"}
                  />
                </FieldGroup>

                <FieldGroup label="Failure Mode">
                  <Select
                    value={form.failureMode}
                    onValueChange={(v) => set("failureMode", v as WAFFailureMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {form.failureMode === "Closed"
                      ? "Block traffic if WAF filter cannot be applied"
                      : "Allow traffic through without WAF protection if filter fails"}
                  </p>
                </FieldGroup>
              </FieldSection>

              <FieldSection title="Targeting">
                <p className="text-xs text-muted-foreground">
                  Choose how this policy selects its target. Only one method can be active.
                </p>
                <FieldGroup label="Mode">
                  <Select
                    value={form.targetingMode}
                    onValueChange={(v) => set("targetingMode", v as TargetingMode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="targetRef">Target Ref</SelectItem>
                      <SelectItem value="targetSelector">Label Selector</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {
                      {
                        none: "Policy will be ignored without a targeting method",
                        global: "Applies to all routes across all tenants",
                        targetRef: "Targets a specific route by name",
                        targetSelector: "Matches routes by label selector",
                      }[form.targetingMode]
                    }
                  </p>
                </FieldGroup>

                {form.targetingMode === "targetRef" && (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FieldGroup label="Kind" required>
                        <Select
                          value={form.refKind}
                          onValueChange={(v) => set("refKind", v as "HTTPRoute" | "GRPCRoute")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HTTPRoute">HTTPRoute</SelectItem>
                            <SelectItem value="GRPCRoute">GRPCRoute</SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldGroup>
                      <FieldGroup
                        label="Name"
                        required
                        error={shouldShowError("refName", blurred, submitted) ? refNameError : null}
                      >
                        <Input
                          value={form.refName}
                          onChange={(e) => set("refName", e.target.value)}
                          onBlur={() => markBlurred("refName")}
                          placeholder="my-route"
                        />
                      </FieldGroup>
                    </div>
                    <FieldGroup
                      label="Namespace"
                      description="Leave empty to match across all namespaces"
                      error={
                        shouldShowError("refNamespace", blurred, submitted)
                          ? refNamespaceError
                          : null
                      }
                    >
                      <Input
                        value={form.refNamespace}
                        onChange={(e) => set("refNamespace", e.target.value)}
                        onBlur={() => markBlurred("refNamespace")}
                        placeholder="tenant-primary"
                      />
                    </FieldGroup>
                  </div>
                )}

                {form.targetingMode === "targetSelector" && (
                  <div className="space-y-2 rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground">Match Labels</p>
                    {form.labels.map((entry, i) => {
                      const isDupe = entry.key.trim() !== "" && duplicateKeys.has(entry.key.trim());
                      const keyErr = labelErrors[i]?.key;
                      const valErr = labelErrors[i]?.value;
                      const showKeyErr =
                        isDupe || (shouldShowError(`label-key-${i}`, blurred, submitted) && keyErr);
                      const showValErr =
                        shouldShowError(`label-val-${i}`, blurred, submitted) && valErr;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <div className="flex-1 space-y-1">
                            <Input
                              value={entry.key}
                              onChange={(e) => updateLabel(i, "key", e.target.value)}
                              onBlur={() => markBlurred(`label-key-${i}`)}
                              placeholder="key"
                              aria-label={`Label key ${i + 1}`}
                              aria-invalid={!!showKeyErr || undefined}
                              className={showKeyErr ? "border-destructive" : ""}
                            />
                            {isDupe && (
                              <p className="text-xs text-destructive" role="alert">
                                Duplicate key
                              </p>
                            )}
                            {!isDupe && showKeyErr && keyErr && (
                              <p className="text-xs text-destructive" role="alert">
                                {keyErr}
                              </p>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <Input
                              value={entry.value}
                              onChange={(e) => updateLabel(i, "value", e.target.value)}
                              onBlur={() => markBlurred(`label-val-${i}`)}
                              placeholder="value"
                              aria-label={`Label value ${i + 1}`}
                              aria-invalid={!!showValErr || undefined}
                              className={showValErr ? "border-destructive" : ""}
                            />
                            {showValErr && valErr && (
                              <p className="text-xs text-destructive" role="alert">
                                {valErr}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-0.5 shrink-0"
                            onClick={() => removeLabel(i)}
                            disabled={form.labels.length === 1 && !entry.key && !entry.value}
                            aria-label={`Remove label ${entry.key || i + 1}`}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          labels: [...prev.labels, { key: "", value: "" }],
                        }))
                      }
                    >
                      <Plus className="size-3.5" />
                      Add Label
                    </Button>
                  </div>
                )}
              </FieldSection>

              <FieldSection title="Directives">
                <FieldGroup
                  label="WAF Directives"
                  description="One directive per line. Leave empty for default OWASP CRS."
                >
                  <Textarea
                    value={form.directives}
                    onChange={(e) => set("directives", e.target.value)}
                    placeholder={'SecRuleEngine On\nSecRule ARGS "@rx <script>" ...'}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </FieldGroup>
              </FieldSection>
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <YamlEditor
                value={yamlValue}
                onChange={(v) => {
                  setYamlValue(v);
                  setYamlError(null);
                }}
                height="100%"
              />
            </div>
            {yamlError && <p className="mt-2 text-sm text-destructive">{yamlError}</p>}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create"
                : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <Separator className="mt-2" />
      </div>
      {children}
    </div>
  );
}

let wafFieldCounter = 0;

function FieldGroup({
  label,
  description,
  error,
  required,
  children,
}: {
  label: string;
  description?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  const [id] = useState(() => `waf-field-${++wafFieldCounter}`);
  const descId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descId, errorId].filter(Boolean).join(" ") || undefined;

  let cloned = false;
  const enhanced = React.Children.map(children, (child) => {
    if (!cloned && React.isValidElement(child)) {
      cloned = true;
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": !!error || undefined,
        "aria-required": required || undefined,
      });
    }
    return child;
  });

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {enhanced}
      {description && (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

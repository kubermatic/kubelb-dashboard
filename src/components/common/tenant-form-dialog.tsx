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

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { YamlEditor } from "@/components/common/yaml-editor";
import type { Tenant, TenantSpec } from "@/types/kubelb";

const RFC1123_LABEL_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

const optionalRFC1123 = z
  .string()
  .refine((v) => !v || RFC1123_LABEL_REGEX.test(v), {
    message: "Lowercase alphanumeric and hyphens only, must start/end with alphanumeric",
  })
  .refine((v) => !v || v.length <= 63, { message: "Max 63 characters" });

const optionalNonNegativeInt = z.string().refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0), {
  message: "Must be a non-negative integer",
});

const tenantSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(243, "Max 243 characters")
    .regex(
      RFC1123_LABEL_REGEX,
      "Lowercase alphanumeric and hyphens only, must start/end with alphanumeric",
    ),
  propagateAllAnnotations: z.boolean(),
  lbEnabled: z.boolean(),
  lbClass: z.string(),
  lbLimit: optionalNonNegativeInt,
  ingressEnabled: z.boolean(),
  ingressClass: z.string(),
  gwEnabled: z.boolean(),
  gwClass: z.string(),
  gwDefaultName: optionalRFC1123,
  gwDefaultNamespace: optionalRFC1123,
  gwLimit: optionalNonNegativeInt,
  wildcardDomain: z.string(),
  allowExplicitHostnames: z.boolean(),
  useDNSAnnotations: z.boolean(),
  useCertificateAnnotations: z.boolean(),
  defaultClusterIssuer: z.string(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

const DEFAULT_VALUES: TenantFormValues = {
  name: "",
  propagateAllAnnotations: false,
  lbEnabled: true,
  lbClass: "",
  lbLimit: "",
  ingressEnabled: true,
  ingressClass: "",
  gwEnabled: true,
  gwClass: "",
  gwDefaultName: "",
  gwDefaultNamespace: "",
  gwLimit: "",
  wildcardDomain: "",
  allowExplicitHostnames: false,
  useDNSAnnotations: false,
  useCertificateAnnotations: false,
  defaultClusterIssuer: "",
};

function buildTenant(values: TenantFormValues): Tenant {
  const spec: TenantSpec = {};

  if (values.propagateAllAnnotations) spec.propagateAllAnnotations = true;

  spec.loadBalancer = {
    ...(values.lbClass && { class: values.lbClass }),
    ...(values.lbEnabled === false && { disable: true }),
    ...(values.lbLimit && { limit: Number(values.lbLimit) }),
  };

  spec.ingress = {
    ...(values.ingressClass && { class: values.ingressClass }),
    ...(values.ingressEnabled === false && { disable: true }),
  };

  spec.gatewayAPI = {
    ...(values.gwClass && { class: values.gwClass }),
    ...(values.gwEnabled === false && { disable: true }),
    ...(values.gwDefaultName && {
      defaultGateway: {
        name: values.gwDefaultName,
        namespace: values.gwDefaultNamespace || undefined,
      },
    }),
    ...(values.gwLimit && {
      gatewaySettings: { limit: Number(values.gwLimit) },
    }),
  };

  const dns: TenantSpec["dns"] = {};
  if (values.wildcardDomain) dns.wildcardDomain = values.wildcardDomain;
  if (values.allowExplicitHostnames) dns.allowExplicitHostnames = true;
  if (values.useDNSAnnotations) dns.useDNSAnnotations = true;
  if (values.useCertificateAnnotations) dns.useCertificateAnnotations = true;
  if (Object.keys(dns).length > 0) spec.dns = dns;

  if (values.defaultClusterIssuer) {
    spec.certificates = { defaultClusterIssuer: values.defaultClusterIssuer };
  }

  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Tenant",
    metadata: { name: values.name },
    spec,
  };
}

function valuesToYaml(values: TenantFormValues): string {
  return yaml.dump(buildTenant(values), { noRefs: true, lineWidth: -1 });
}

interface TenantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  isEE: boolean;
  onSubmit: (tenant: Tenant) => void;
}

export function TenantFormDialog({
  open,
  onOpenChange,
  isPending,
  isEE,
  onSubmit,
}: TenantFormDialogProps) {
  const [mode, setMode] = useState<"form" | "yaml">("form");
  const [yamlValue, setYamlValue] = useState("");
  const [yamlError, setYamlError] = useState<string | null>(null);

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  const watchedValues = form.watch();
  const currentYaml = useMemo(() => valuesToYaml(watchedValues), [watchedValues]);

  const handleModeChange = (next: string) => {
    if (next === "yaml") {
      setYamlValue(currentYaml);
      setYamlError(null);
    }
    setMode(next as "form" | "yaml");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(DEFAULT_VALUES);
      setYamlError(null);
      setYamlValue("");
      setMode("form");
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (mode === "yaml") {
      try {
        const parsed = yaml.load(yamlValue) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object") {
          setYamlError("YAML must be a valid object");
          return;
        }
        setYamlError(null);
        onSubmit(parsed as unknown as Tenant);
      } catch (e) {
        setYamlError(e instanceof Error ? e.message : "Invalid YAML");
      }
      return;
    }

    void form.handleSubmit((values) => onSubmit(buildTenant(values)))();
  };

  const lbEnabled = form.watch("lbEnabled");
  const ingressEnabled = form.watch("ingressEnabled");
  const gwEnabled = form.watch("gwEnabled");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[80vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={handleModeChange}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="w-fit">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="yaml">YAML</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-6 py-2">
              <FormSection title="General">
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="tenant-name">
                          Name
                          <span className="text-destructive" aria-hidden>
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id="tenant-name"
                          onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                          placeholder="my-tenant"
                          autoFocus
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <SwitchField
                    control={form.control}
                    name="propagateAllAnnotations"
                    label="Propagate All Annotations"
                    description="Forward all annotations to downstream resources"
                  />
                </FieldGroup>
              </FormSection>

              <FormSection title="Layer 4 (Load Balancer)">
                <FieldGroup>
                  <SwitchField control={form.control} name="lbEnabled" label="Enabled" />
                  {lbEnabled && (
                    <>
                      <Controller
                        control={form.control}
                        name="lbClass"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel htmlFor="lb-class">Class</FieldLabel>
                            <Input {...field} id="lb-class" placeholder="e.g. metallb" />
                          </Field>
                        )}
                      />
                      {isEE && (
                        <Controller
                          control={form.control}
                          name="lbLimit"
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="lb-limit">Limit</FieldLabel>
                              <Input
                                {...field}
                                id="lb-limit"
                                type="number"
                                min={0}
                                placeholder="0"
                                aria-invalid={fieldState.invalid}
                              />
                              <FieldDescription>
                                Max load balancers (0 = unlimited)
                              </FieldDescription>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      )}
                    </>
                  )}
                </FieldGroup>
              </FormSection>

              <FormSection title="Ingress">
                <FieldGroup>
                  <SwitchField control={form.control} name="ingressEnabled" label="Enabled" />
                  {ingressEnabled && (
                    <Controller
                      control={form.control}
                      name="ingressClass"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor="ingress-class">Class</FieldLabel>
                          <Input {...field} id="ingress-class" placeholder="e.g. nginx" />
                        </Field>
                      )}
                    />
                  )}
                </FieldGroup>
              </FormSection>

              <FormSection title="Gateway API">
                <FieldGroup>
                  <SwitchField control={form.control} name="gwEnabled" label="Enabled" />
                  {gwEnabled && (
                    <>
                      <Controller
                        control={form.control}
                        name="gwClass"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel htmlFor="gw-class">Class</FieldLabel>
                            <Input {...field} id="gw-class" placeholder="e.g. eg" />
                          </Field>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Controller
                          control={form.control}
                          name="gwDefaultName"
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="gw-default-name">
                                Default Gateway Name
                              </FieldLabel>
                              <Input
                                {...field}
                                id="gw-default-name"
                                placeholder="default"
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                        <Controller
                          control={form.control}
                          name="gwDefaultNamespace"
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="gw-default-ns">
                                Default Gateway Namespace
                              </FieldLabel>
                              <Input
                                {...field}
                                id="gw-default-ns"
                                placeholder="kubelb"
                                aria-invalid={fieldState.invalid}
                              />
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      </div>
                      {isEE && (
                        <Controller
                          control={form.control}
                          name="gwLimit"
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor="gw-limit">Gateway Limit</FieldLabel>
                              <Input
                                {...field}
                                id="gw-limit"
                                type="number"
                                min={0}
                                placeholder="0"
                                aria-invalid={fieldState.invalid}
                              />
                              <FieldDescription>Max gateways (0 = unlimited)</FieldDescription>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      )}
                    </>
                  )}
                </FieldGroup>
              </FormSection>

              <FormSection title="DNS">
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="wildcardDomain"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="wildcard-domain">Wildcard Domain</FieldLabel>
                        <Input {...field} id="wildcard-domain" placeholder="**.apps.example.com" />
                      </Field>
                    )}
                  />
                  <SwitchField
                    control={form.control}
                    name="allowExplicitHostnames"
                    label="Allow Explicit Hostnames"
                  />
                  <SwitchField
                    control={form.control}
                    name="useDNSAnnotations"
                    label="Use DNS Annotations"
                  />
                  <SwitchField
                    control={form.control}
                    name="useCertificateAnnotations"
                    label="Use Certificate Annotations"
                  />
                </FieldGroup>
              </FormSection>

              <FormSection title="Certificates">
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="defaultClusterIssuer"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="cluster-issuer">Default Cluster Issuer</FieldLabel>
                        <Input
                          {...field}
                          id="cluster-issuer"
                          placeholder="e.g. letsencrypt-staging-dns"
                        />
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FormSection>
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
            {isPending ? "Creating..." : "Create Tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
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

function SwitchField({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useForm<TenantFormValues>>["control"];
  name: keyof TenantFormValues;
  label: string;
  description?: string;
}) {
  return (
    <Controller
      control={control}
      name={name as never}
      render={({ field }) => (
        <Field orientation="horizontal">
          <div className="space-y-0.5">
            <FieldLabel htmlFor={`switch-${name}`}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
          </div>
          <Switch
            id={`switch-${name}`}
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
        </Field>
      )}
    />
  );
}

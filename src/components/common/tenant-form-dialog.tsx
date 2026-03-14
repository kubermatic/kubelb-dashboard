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

import { useCallback, useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YamlEditor } from "@/components/common/yaml-editor";
import type { Tenant, TenantSpec } from "@/types/kubelb";

const K8S_NAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MAX_NAME_LENGTH = 243;

function validateName(name: string): string | null {
  if (!name) return "Name is required";
  if (name.length > MAX_NAME_LENGTH) return `Max ${MAX_NAME_LENGTH} characters`;
  if (!K8S_NAME_REGEX.test(name))
    return "Lowercase alphanumeric and hyphens only, must start/end with alphanumeric";
  return null;
}

interface FormState {
  name: string;
  propagateAllAnnotations: boolean;
  lbEnabled: boolean;
  lbClass: string;
  lbLimit: string;
  ingressEnabled: boolean;
  ingressClass: string;
  gwEnabled: boolean;
  gwClass: string;
  gwDefaultName: string;
  gwDefaultNamespace: string;
  gwLimit: string;
  wildcardDomain: string;
  allowExplicitHostnames: boolean;
  useDNSAnnotations: boolean;
  useCertificateAnnotations: boolean;
  defaultClusterIssuer: string;
}

const INITIAL_STATE: FormState = {
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

function buildTenant(form: FormState): Tenant {
  const spec: TenantSpec = {};

  if (form.propagateAllAnnotations) spec.propagateAllAnnotations = true;

  spec.loadBalancer = {
    ...(form.lbClass && { class: form.lbClass }),
    ...(form.lbEnabled === false && { disable: true }),
    ...(form.lbLimit && { limit: Number(form.lbLimit) }),
  };

  spec.ingress = {
    ...(form.ingressClass && { class: form.ingressClass }),
    ...(form.ingressEnabled === false && { disable: true }),
  };

  spec.gatewayAPI = {
    ...(form.gwClass && { class: form.gwClass }),
    ...(form.gwEnabled === false && { disable: true }),
    ...(form.gwDefaultName && {
      defaultGateway: { name: form.gwDefaultName, namespace: form.gwDefaultNamespace || undefined },
    }),
    ...(form.gwLimit && { gatewaySettings: { limit: Number(form.gwLimit) } }),
  };

  const dns: TenantSpec["dns"] = {};
  if (form.wildcardDomain) dns.wildcardDomain = form.wildcardDomain;
  if (form.allowExplicitHostnames) dns.allowExplicitHostnames = true;
  if (form.useDNSAnnotations) dns.useDNSAnnotations = true;
  if (form.useCertificateAnnotations) dns.useCertificateAnnotations = true;
  if (Object.keys(dns).length > 0) spec.dns = dns;

  if (form.defaultClusterIssuer) {
    spec.certificates = { defaultClusterIssuer: form.defaultClusterIssuer };
  }

  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Tenant",
    metadata: { name: form.name },
    spec,
  };
}

function tenantToYaml(form: FormState): string {
  const tenant = buildTenant(form);
  return yaml.dump(tenant, { noRefs: true, lineWidth: -1 });
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
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [yamlValue, setYamlValue] = useState("");
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [nameBlurred, setNameBlurred] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nameError = useMemo(() => validateName(form.name), [form.name]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const currentYaml = useMemo(() => tenantToYaml(form), [form]);

  const handleModeChange = (next: string) => {
    if (next === "yaml") {
      setYamlValue(currentYaml);
      setYamlError(null);
    }
    setMode(next as "form" | "yaml");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(INITIAL_STATE);
      setYamlError(null);
      setYamlValue("");
      setNameBlurred(false);
      setSubmitted(false);
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

    setSubmitted(true);
    if (nameError) return;
    onSubmit(buildTenant(form));
  };

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
                <FormField
                  label="Name"
                  error={nameBlurred || submitted ? nameError : null}
                  required
                >
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value.toLowerCase())}
                    onBlur={() => setNameBlurred(true)}
                    placeholder="my-tenant"
                    autoFocus
                  />
                </FormField>
                <SwitchField
                  label="Propagate All Annotations"
                  description="Forward all annotations to downstream resources"
                  checked={form.propagateAllAnnotations}
                  onCheckedChange={(v) => set("propagateAllAnnotations", v)}
                />
              </FormSection>

              <FormSection title="Layer 4 (Load Balancer)">
                <SwitchField
                  label="Enabled"
                  checked={form.lbEnabled}
                  onCheckedChange={(v) => set("lbEnabled", v)}
                />
                {form.lbEnabled && (
                  <>
                    <FormField label="Class">
                      <Input
                        value={form.lbClass}
                        onChange={(e) => set("lbClass", e.target.value)}
                        placeholder="e.g. metallb"
                      />
                    </FormField>
                    {isEE && (
                      <FormField label="Limit" description="Max load balancers (0 = unlimited)">
                        <Input
                          type="number"
                          min={0}
                          value={form.lbLimit}
                          onChange={(e) => set("lbLimit", e.target.value)}
                          placeholder="0"
                        />
                      </FormField>
                    )}
                  </>
                )}
              </FormSection>

              <FormSection title="Ingress">
                <SwitchField
                  label="Enabled"
                  checked={form.ingressEnabled}
                  onCheckedChange={(v) => set("ingressEnabled", v)}
                />
                {form.ingressEnabled && (
                  <FormField label="Class">
                    <Input
                      value={form.ingressClass}
                      onChange={(e) => set("ingressClass", e.target.value)}
                      placeholder="e.g. nginx"
                    />
                  </FormField>
                )}
              </FormSection>

              <FormSection title="Gateway API">
                <SwitchField
                  label="Enabled"
                  checked={form.gwEnabled}
                  onCheckedChange={(v) => set("gwEnabled", v)}
                />
                {form.gwEnabled && (
                  <>
                    <FormField label="Class">
                      <Input
                        value={form.gwClass}
                        onChange={(e) => set("gwClass", e.target.value)}
                        placeholder="e.g. eg"
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Default Gateway Name">
                        <Input
                          value={form.gwDefaultName}
                          onChange={(e) => set("gwDefaultName", e.target.value)}
                          placeholder="default"
                        />
                      </FormField>
                      <FormField label="Default Gateway Namespace">
                        <Input
                          value={form.gwDefaultNamespace}
                          onChange={(e) => set("gwDefaultNamespace", e.target.value)}
                          placeholder="kubelb"
                        />
                      </FormField>
                    </div>
                    {isEE && (
                      <FormField label="Gateway Limit" description="Max gateways (0 = unlimited)">
                        <Input
                          type="number"
                          min={0}
                          value={form.gwLimit}
                          onChange={(e) => set("gwLimit", e.target.value)}
                          placeholder="0"
                        />
                      </FormField>
                    )}
                  </>
                )}
              </FormSection>

              <FormSection title="DNS">
                <FormField label="Wildcard Domain">
                  <Input
                    value={form.wildcardDomain}
                    onChange={(e) => set("wildcardDomain", e.target.value)}
                    placeholder="**.apps.example.com"
                  />
                </FormField>
                <SwitchField
                  label="Allow Explicit Hostnames"
                  checked={form.allowExplicitHostnames}
                  onCheckedChange={(v) => set("allowExplicitHostnames", v)}
                />
                <SwitchField
                  label="Use DNS Annotations"
                  checked={form.useDNSAnnotations}
                  onCheckedChange={(v) => set("useDNSAnnotations", v)}
                />
                <SwitchField
                  label="Use Certificate Annotations"
                  checked={form.useCertificateAnnotations}
                  onCheckedChange={(v) => set("useCertificateAnnotations", v)}
                />
              </FormSection>

              <FormSection title="Certificates">
                <FormField label="Default Cluster Issuer">
                  <Input
                    value={form.defaultClusterIssuer}
                    onChange={(e) => set("defaultClusterIssuer", e.target.value)}
                    placeholder="e.g. letsencrypt-staging-dns"
                  />
                </FormField>
              </FormSection>
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="min-h-0 flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
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

function FormField({
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
  return (
    <div className="grid gap-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

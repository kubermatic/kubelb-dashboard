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
import { createFileRoute } from "@tanstack/react-router";
import { FileCode } from "lucide-react";
import yaml from "js-yaml";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { EDITING_ENABLED, YAML_EDITOR_ENABLED } from "@/lib/feature-flags";
import { useConfigs } from "@/hooks/use-config";
import { useEdition } from "@/hooks/use-edition";
import { useUpdateConfig } from "@/hooks/use-config-mutations";
import { useCRDSchema } from "@/hooks/use-crd-schema";
import { buildUiSchema } from "@/lib/kube-ui-schema";
import type { Config, EnvoyProxy, ConfigSpec } from "@/types/kubelb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyValuePairs } from "@/components/common/key-value-pairs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ResourceFormDialog } from "@/components/common/resource-form-dialog";
import { YamlEditorDialog } from "@/components/common/yaml-editor-dialog";
import { YamlViewer } from "@/components/common/yaml-viewer";

const RESOURCE_KIND = "Config";
const API_VERSION = "kubelb.k8c.io/v1alpha1";
const CRD_NAME = "configs.kubelb.k8c.io";

export const Route = createFileRoute("/configuration/")({
  component: Configuration,
});

function ConfigField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const display =
    value === undefined || value === null
      ? "\u2014"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);

  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}</span>
      <p>{display}</p>
    </div>
  );
}

function EnabledBadge({ enabled }: { enabled?: boolean }) {
  if (enabled === undefined)
    return <span className="text-sm text-muted-foreground">{"\u2014"}</span>;
  return (
    <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Enabled" : "Disabled"}</Badge>
  );
}

function EnvoyProxySection({ envoy }: { envoy?: EnvoyProxy }) {
  if (!envoy) {
    return <p className="text-sm text-muted-foreground">Not configured</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ConfigField label="Topology" value={envoy.topology} />
        <ConfigField label="Replicas" value={envoy.replicas} />
        <ConfigField label="DaemonSet Mode" value={envoy.useDaemonset} />
        <ConfigField label="Single Pod Per Node" value={envoy.singlePodPerNode} />
        <ConfigField label="Image" value={envoy.image} />
      </div>

      {envoy.gracefulShutdown && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Graceful Shutdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigField label="Disabled" value={envoy.gracefulShutdown.disabled} />
            <ConfigField label="Drain Timeout" value={envoy.gracefulShutdown.drainTimeout} />
            <ConfigField
              label="Min Drain Duration"
              value={envoy.gracefulShutdown.minDrainDuration}
            />
            <ConfigField
              label="Termination Grace Period (s)"
              value={envoy.gracefulShutdown.terminationGracePeriodSeconds}
            />
            <ConfigField
              label="Shutdown Manager Image"
              value={envoy.gracefulShutdown.shutdownManagerImage}
            />
          </div>
        </div>
      )}

      {envoy.overloadManager && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Overload Manager</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Status</span>
              <div className="mt-1">
                <EnabledBadge enabled={envoy.overloadManager.enabled} />
              </div>
            </div>
            <ConfigField
              label="Max Active Downstream Connections"
              value={envoy.overloadManager.maxActiveDownstreamConnections}
            />
            <ConfigField
              label="Max Heap Size (bytes)"
              value={envoy.overloadManager.maxHeapSizeBytes}
            />
          </div>
        </div>
      )}

      <div className="text-sm">
        <span className="text-muted-foreground">Pod Monitor</span>
        <div className="mt-1">
          <EnabledBadge enabled={envoy.podMonitor?.enabled} />
        </div>
      </div>
    </div>
  );
}

function ResourceClassSection({
  title,
  settings,
}: {
  title: string;
  settings?: { class?: string; disable?: boolean };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {settings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigField label="Class" value={settings.class} />
            <div className="text-sm">
              <span className="text-muted-foreground">Status</span>
              <div className="mt-1">
                <EnabledBadge
                  enabled={settings.disable !== undefined ? !settings.disable : undefined}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not configured</p>
        )}
      </CardContent>
    </Card>
  );
}

function GatewayAPISection({ settings }: { settings?: ConfigSpec["gatewayAPI"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway API</CardTitle>
      </CardHeader>
      <CardContent>
        {settings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigField label="Class" value={settings.class} />
            <div className="text-sm">
              <span className="text-muted-foreground">Status</span>
              <div className="mt-1">
                <EnabledBadge
                  enabled={settings.disable !== undefined ? !settings.disable : undefined}
                />
              </div>
            </div>
            <ConfigField
              label="Default Gateway"
              value={
                settings.defaultGateway
                  ? `${settings.defaultGateway.namespace ?? ""}/${settings.defaultGateway.name ?? ""}`
                  : undefined
              }
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not configured</p>
        )}
      </CardContent>
    </Card>
  );
}

function ConfigView({ config }: { config: Config }) {
  const { spec } = config;
  const { isEE } = useEdition();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Envoy Proxy</CardTitle>
        </CardHeader>
        <CardContent>
          <EnvoyProxySection envoy={spec.envoyProxy} />
        </CardContent>
      </Card>

      <ResourceClassSection title="Load Balancer" settings={spec.loadBalancer} />
      <ResourceClassSection title="Ingress" settings={spec.ingress} />
      <GatewayAPISection settings={spec.gatewayAPI} />

      <Card>
        <CardHeader>
          <CardTitle>DNS</CardTitle>
        </CardHeader>
        <CardContent>
          {spec.dns ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConfigField label="Wildcard Domain" value={spec.dns.wildcardDomain} />
              <ConfigField
                label="Allow Explicit Hostnames"
                value={spec.dns.allowExplicitHostnames}
              />
              <ConfigField label="Use DNS Annotations" value={spec.dns.useDNSAnnotations} />
              <ConfigField
                label="Use Certificate Annotations"
                value={spec.dns.useCertificateAnnotations}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfigField
            label="Default Cluster Issuer"
            value={spec.certificates?.defaultClusterIssuer}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Annotations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConfigField label="Propagate All Annotations" value={spec.propagateAllAnnotations} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Propagated Annotations</h4>
            <KeyValuePairs data={spec.propagatedAnnotations} emptyMessage="None" />
          </div>

          {spec.defaultAnnotations && Object.keys(spec.defaultAnnotations).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Default Annotations</h4>
              {Object.entries(spec.defaultAnnotations).map(([group, annotations]) => (
                <div key={group}>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{group}</p>
                  <KeyValuePairs data={annotations} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isEE && (
        <Card>
          <CardHeader>
            <CardTitle>Tunnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConfigField
                label="Connection Manager URL"
                value={spec.tunnel?.connectionManagerURL}
              />
              <ConfigField label="Limit" value={spec.tunnel?.limit} />
              <div className="text-sm">
                <span className="text-muted-foreground">Status</span>
                <div className="mt-1">
                  <EnabledBadge
                    enabled={spec.tunnel?.disable !== undefined ? !spec.tunnel.disable : undefined}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isEE && (
        <Card>
          <CardHeader>
            <CardTitle>WAF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConfigField
                label="WASM Init Container Image"
                value={spec.waf?.wasmInitContainerImage}
              />
              <ConfigField label="Skip Validation" value={spec.waf?.skipValidation} />
            </div>
          </CardContent>
        </Card>
      )}

      {isEE && spec.circuitBreaker && (
        <Card>
          <CardHeader>
            <CardTitle>Circuit Breaker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConfigField label="Max Connections" value={spec.circuitBreaker.maxConnections} />
              <ConfigField
                label="Max Pending Requests"
                value={spec.circuitBreaker.maxPendingRequests}
              />
              <ConfigField
                label="Max Parallel Requests"
                value={spec.circuitBreaker.maxParallelRequests}
              />
              <ConfigField
                label="Max Parallel Retries"
                value={spec.circuitBreaker.maxParallelRetries}
              />
              <ConfigField
                label="Max Requests Per Connection"
                value={spec.circuitBreaker.maxRequestsPerConnection}
              />
              {spec.circuitBreaker.perEndpoint && (
                <ConfigField
                  label="Per Endpoint Max Connections"
                  value={spec.circuitBreaker.perEndpoint.maxConnections}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isEE && spec.loadBalancerPolicy && (
        <Card>
          <CardHeader>
            <CardTitle>Load Balancer Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfigField label="Policy" value={spec.loadBalancerPolicy} />
          </CardContent>
        </Card>
      )}

      {isEE && (
        <Card>
          <CardHeader>
            <CardTitle>Network Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Status</span>
                <div className="mt-1">
                  <EnabledBadge enabled={spec.networkPolicy?.enable} />
                </div>
              </div>
              <ConfigField
                label="Disabled Policies"
                value={
                  spec.networkPolicy?.disabledPolicies?.length
                    ? spec.networkPolicy.disabledPolicies.join(", ")
                    : undefined
                }
              />
              <ConfigField
                label="Additional Policies"
                value={spec.networkPolicy?.additionalPolicies?.length ?? 0}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Configuration() {
  const { data, isLoading, isError, error, refetch } = useConfigs();
  const { data: crdSchema } = useCRDSchema(CRD_NAME, "v1alpha1");
  const updateConfig = useUpdateConfig();
  const editUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "edit"), []);

  const [yamlOpen, setYamlOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Configuration</h1>
          <p className="mt-1 text-muted-foreground">
            Global KubeLB settings and cluster configuration.
          </p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Configuration</h1>
          <p className="mt-1 text-muted-foreground">
            Global KubeLB settings and cluster configuration.
          </p>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error?.message ?? "Failed to load configuration"}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const config = data?.items?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configuration</h1>
          <p className="mt-1 text-muted-foreground">
            Global KubeLB settings and cluster configuration.
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setYamlOpen(true)}>
              <FileCode />
              View YAML
            </Button>
            {EDITING_ENABLED && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {config ? (
        <ConfigView config={config} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No configuration found</p>
          </CardContent>
        </Card>
      )}

      <YamlViewer
        open={yamlOpen}
        onOpenChange={setYamlOpen}
        resource={config ?? null}
        title={`Config: ${config?.metadata?.name ?? ""}`}
      />

      {EDITING_ENABLED &&
        (crdSchema ? (
          <ResourceFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            title={config ? `Edit Config: ${config.metadata.name}` : "Edit Config"}
            schema={crdSchema}
            uiSchema={editUiSchema}
            formData={config ? (sanitizeForEdit(config) as Record<string, unknown>) : undefined}
            isPending={updateConfig.isPending}
            onSubmit={(parsed) => {
              void updateConfig.mutateAsync(parsed as Config).then(() => setEditOpen(false));
            }}
          />
        ) : YAML_EDITOR_ENABLED ? (
          <YamlEditorDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            title={config ? `Edit Config: ${config.metadata.name}` : "Edit Config"}
            resourceKind={RESOURCE_KIND}
            apiVersion={API_VERSION}
            initialYaml={
              config ? yaml.dump(sanitizeForEdit(config), { noRefs: true, lineWidth: -1 }) : ""
            }
            lockedFields={{ name: true }}
            isPending={updateConfig.isPending}
            onSubmit={(parsed) => {
              void updateConfig.mutateAsync(parsed as Config).then(() => setEditOpen(false));
            }}
          />
        ) : null)}
    </div>
  );
}

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

import { Fragment, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import yaml from "js-yaml";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { EDITING_ENABLED, YAML_EDITOR_ENABLED } from "@/lib/feature-flags";
import {
  ArrowRight,
  Download,
  FileCode,
  KeyRound,
  Network,
  Pencil,
  Route as RouteIcon,
  Trash2,
} from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { KeyValuePairs } from "@/components/common/key-value-pairs";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlEditorDialog } from "@/components/common/yaml-editor-dialog";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEdition } from "@/hooks/use-edition";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useRoutes } from "@/hooks/use-routes";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import { useDeleteTenant, useUpdateTenant } from "@/hooks/use-tenant-mutations";
import { useTenant } from "@/hooks/use-tenants";
import { downloadKubeconfig } from "@/lib/download-kubeconfig";
import { tenantToNamespace } from "@/lib/format";
import { useUIStore } from "@/stores/ui";
import type { Tenant } from "@/types/kubelb";

export const Route = createFileRoute("/tenants/$name")({
  component: TenantDetail,
});

function FeatureBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      className={enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
      variant="outline"
    >
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}

function TenantDetail() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const { data: tenant, isLoading, error, refetch } = useTenant(name);
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const [yamlViewerOpen, setYamlViewerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    if (error instanceof KubeApiError && error.code === 404) {
      return <ResourceNotFound resourceKind="Tenant" backHref="/tenants" backLabel="Tenants" />;
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!tenant) return null;

  const editYaml = yaml.dump(sanitizeForEdit(tenant), { noRefs: true, lineWidth: -1 });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={tenant.metadata.name}
          namespace={tenant.metadata.namespace}
          kind="Tenant"
          createdAt={tenant.metadata.creationTimestamp}
          backHref="/tenants"
          backLabel="Tenants"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYamlViewerOpen(true)}>
            <FileCode />
            View YAML
          </Button>
          <Button variant="outline" size="sm" onClick={() => void downloadKubeconfig(name)}>
            <Download />
            Kubeconfig
          </Button>
          {EDITING_ENABLED && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourcesTab tenantName={name} />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <ConfigurationTab tenant={tenant} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={tenant.metadata} />
        </TabsContent>
      </Tabs>

      <YamlViewer
        open={yamlViewerOpen}
        onOpenChange={setYamlViewerOpen}
        resource={tenant}
        title={`Tenant: ${name}`}
      />

      {EDITING_ENABLED && YAML_EDITOR_ENABLED && (
        <YamlEditorDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          title="Edit Tenant"
          resourceKind="Tenant"
          apiVersion="kubelb.k8c.io/v1alpha1"
          initialYaml={editYaml}
          lockedFields={{ name: true }}
          isPending={updateTenant.isPending}
          onSubmit={(parsed) => {
            void updateTenant.mutateAsync(parsed as Tenant).then(() => setEditOpen(false));
          }}
        />
      )}

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        resourceName={name}
        resourceKind="Tenant"
        isPending={deleteTenant.isPending}
        onConfirm={() => {
          void deleteTenant
            .mutateAsync(name)
            .then(() =>
              navigate({ to: "/tenants", search: { search: "", page: 0, pageSize: 10 } }),
            );
        }}
      >
        <p className="text-sm text-destructive">
          Deleting this tenant will also delete its namespace and all resources within it.
        </p>
      </DeleteDialog>
    </div>
  );
}

const RESOURCE_CARDS = [
  { label: "Load Balancers", icon: Network, href: "/load-balancers" as const },
  { label: "Routes", icon: RouteIcon, href: "/routes" as const },
  { label: "Sync Secrets", icon: KeyRound, href: "/sync-secrets" as const },
] as const;

function ResourcesTab({ tenantName }: { tenantName: string }) {
  const namespace = tenantToNamespace(tenantName);
  const setSelectedTenant = useUIStore((s) => s.setSelectedTenant);

  const queries = [useLoadBalancers(namespace), useRoutes(namespace), useSyncSecrets(namespace)];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {RESOURCE_CARDS.map((card, i) => {
        const { data, isLoading } = queries[i];
        const count = data?.items?.length ?? 0;

        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <card.icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className="text-3xl font-bold">{count}</span>
              )}
              <Link
                to={card.href}
                search={{ search: "", page: 0, pageSize: 10 }}
                onClick={() => setSelectedTenant(tenantName)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OverviewTab({ tenant }: { tenant: Tenant }) {
  const { spec } = tenant;
  const { isEE } = useEdition();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Layer 4</span>
            <FeatureBadge enabled={!spec.loadBalancer?.disable} />
            {isEE && spec.loadBalancer?.limit != null && (
              <>
                <span className="text-muted-foreground">LB Limit</span>
                <span>{spec.loadBalancer.limit}</span>
              </>
            )}
            <span className="text-muted-foreground">Ingress</span>
            <FeatureBadge enabled={!spec.ingress?.disable} />
            <span className="text-muted-foreground">Gateway API</span>
            <FeatureBadge enabled={!spec.gatewayAPI?.disable} />
            {isEE && spec.gatewayAPI?.gatewaySettings?.limit != null && (
              <>
                <span className="text-muted-foreground">Gateway Limit</span>
                <span>{spec.gatewayAPI.gatewaySettings.limit}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isEE &&
        spec.gatewayAPI &&
        (() => {
          const routeFlags = [
            { label: "HTTP Route", disabled: spec.gatewayAPI.disableHTTPRoute },
            { label: "gRPC Route", disabled: spec.gatewayAPI.disableGRPCRoute },
            { label: "TCP Route", disabled: spec.gatewayAPI.disableTCPRoute },
            { label: "UDP Route", disabled: spec.gatewayAPI.disableUDPRoute },
            { label: "TLS Route", disabled: spec.gatewayAPI.disableTLSRoute },
            {
              label: "Backend Traffic Policy",
              disabled: spec.gatewayAPI.disableBackendTrafficPolicy,
            },
            {
              label: "Client Traffic Policy",
              disabled: spec.gatewayAPI.disableClientTrafficPolicy,
            },
          ].filter((f) => f.disabled);
          return routeFlags.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Gateway API Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[200px_1fr] gap-y-2 text-sm">
                  {routeFlags.map((f) => (
                    <Fragment key={f.label}>
                      <span className="text-muted-foreground">{f.label}</span>
                      <FeatureBadge enabled={false} />
                    </Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

      <Card>
        <CardHeader>
          <CardTitle>DNS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            {isEE && (
              <>
                <span className="text-muted-foreground">Status</span>
                <FeatureBadge enabled={!spec.dns?.disable} />
              </>
            )}
            <span className="text-muted-foreground">Wildcard Domain</span>
            <span>{spec.dns?.wildcardDomain ?? "—"}</span>
            <span className="text-muted-foreground">Explicit Hostnames</span>
            <FeatureBadge enabled={!!spec.dns?.allowExplicitHostnames} />
            <span className="text-muted-foreground">DNS Annotations</span>
            <FeatureBadge enabled={!!spec.dns?.useDNSAnnotations} />
            <span className="text-muted-foreground">Cert Annotations</span>
            <FeatureBadge enabled={!!spec.dns?.useCertificateAnnotations} />
            {isEE && spec.dns?.allowedDomains && spec.dns.allowedDomains.length > 0 && (
              <>
                <span className="text-muted-foreground">Allowed Domains</span>
                <div className="flex flex-wrap gap-1">
                  {spec.dns.allowedDomains.map((d) => (
                    <Badge key={d} variant="outline">
                      {d}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            {isEE && (
              <>
                <span className="text-muted-foreground">Status</span>
                <FeatureBadge enabled={!spec.certificates?.disable} />
              </>
            )}
            <span className="text-muted-foreground">Default Cluster Issuer</span>
            <span>{spec.certificates?.defaultClusterIssuer ?? "—"}</span>
            {isEE &&
              spec.certificates?.allowedDomains &&
              spec.certificates.allowedDomains.length > 0 && (
                <>
                  <span className="text-muted-foreground">Allowed Domains</span>
                  <div className="flex flex-wrap gap-1">
                    {spec.certificates.allowedDomains.map((d) => (
                      <Badge key={d} variant="outline">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
          </div>
        </CardContent>
      </Card>

      {isEE && (
        <Card>
          <CardHeader>
            <CardTitle>Tunnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Status</span>
              <FeatureBadge enabled={!spec.tunnel?.disable} />
              <span className="text-muted-foreground">Limit</span>
              <span>{spec.tunnel?.limit ?? "—"}</span>
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
            <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Max Connections</span>
              <span>{spec.circuitBreaker.maxConnections ?? "—"}</span>
              <span className="text-muted-foreground">Max Pending Requests</span>
              <span>{spec.circuitBreaker.maxPendingRequests ?? "—"}</span>
              <span className="text-muted-foreground">Max Parallel Requests</span>
              <span>{spec.circuitBreaker.maxParallelRequests ?? "—"}</span>
              <span className="text-muted-foreground">Max Parallel Retries</span>
              <span>{spec.circuitBreaker.maxParallelRetries ?? "—"}</span>
              <span className="text-muted-foreground">Max Req / Connection</span>
              <span>{spec.circuitBreaker.maxRequestsPerConnection ?? "—"}</span>
              {spec.circuitBreaker.perEndpoint && (
                <>
                  <span className="text-muted-foreground">Per-Endpoint Max Conn</span>
                  <span>{spec.circuitBreaker.perEndpoint.maxConnections ?? "—"}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isEE && spec.networkPolicy && (
        <Card>
          <CardHeader>
            <CardTitle>Network Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Status</span>
              <FeatureBadge enabled={!!spec.networkPolicy.enable} />
              <span className="text-muted-foreground">Disabled Policies</span>
              <span>
                {spec.networkPolicy.disabledPolicies?.length
                  ? spec.networkPolicy.disabledPolicies.join(", ")
                  : "—"}
              </span>
              <span className="text-muted-foreground">Additional Policies</span>
              <span>{spec.networkPolicy.additionalPolicies?.length ?? 0}</span>
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
            <Badge variant="outline">{spec.loadBalancerPolicy}</Badge>
          </CardContent>
        </Card>
      )}

      {isEE && spec.allowedDomains && spec.allowedDomains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Allowed Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {spec.allowedDomains.map((domain: string) => (
                <Badge key={domain} variant="outline">
                  {domain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ConfigurationTab({ tenant }: { tenant: Tenant }) {
  const { spec } = tenant;
  const defaultAnnotations = spec.defaultAnnotations ?? {};
  const annotationGroups = Object.entries(defaultAnnotations);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Propagated Annotations</CardTitle>
        </CardHeader>
        <CardContent>
          {spec.propagateAllAnnotations ? (
            <Badge className="bg-success/10 text-success" variant="outline">
              All annotations propagated
            </Badge>
          ) : (
            <KeyValuePairs
              data={spec.propagatedAnnotations ?? {}}
              emptyMessage="No propagated annotations."
            />
          )}
        </CardContent>
      </Card>

      {annotationGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Default Annotations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {annotationGroups.map(([group, annotations]) => (
              <div key={group} className="space-y-2">
                <p className="text-sm font-medium">{group}</p>
                <KeyValuePairs data={annotations} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resource Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Layer 4 Class</span>
            <span>{spec.loadBalancer?.class ?? "—"}</span>
            <span className="text-muted-foreground">Ingress Class</span>
            <span>{spec.ingress?.class ?? "—"}</span>
            <span className="text-muted-foreground">Gateway API Class</span>
            <span>{spec.gatewayAPI?.class ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

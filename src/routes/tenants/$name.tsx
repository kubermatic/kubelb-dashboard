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

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import yaml from "js-yaml";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { Download, FileCode, Pencil, Trash2 } from "lucide-react";

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
import { useDeleteTenant, useUpdateTenant } from "@/hooks/use-tenant-mutations";
import { useTenant } from "@/hooks/use-tenants";
import { downloadKubeconfig } from "@/lib/download-kubeconfig";
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
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab tenant={tenant} />
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

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        resourceName={name}
        resourceKind="Tenant"
        isPending={deleteTenant.isPending}
        onConfirm={() => {
          void deleteTenant.mutateAsync(name).then(() => navigate({ to: "/tenants" }));
        }}
      >
        <p className="text-sm text-destructive">
          Deleting this tenant will also delete its namespace and all resources within it.
        </p>
      </DeleteDialog>
    </div>
  );
}

function OverviewTab({ tenant }: { tenant: Tenant }) {
  const { spec } = tenant;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">L4</span>
            <FeatureBadge enabled={!spec.loadBalancer?.disable} />
            <span className="text-muted-foreground">Ingress</span>
            <FeatureBadge enabled={!spec.ingress?.disable} />
            <span className="text-muted-foreground">Gateway</span>
            <FeatureBadge enabled={!spec.gatewayAPI?.disable} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DNS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Wildcard Domain</span>
            <span>{spec.dns?.wildcardDomain ?? "—"}</span>
            <span className="text-muted-foreground">Explicit Hostnames</span>
            <FeatureBadge enabled={!!spec.dns?.allowExplicitHostnames} />
            <span className="text-muted-foreground">DNS Annotations</span>
            <FeatureBadge enabled={!!spec.dns?.useDNSAnnotations} />
            <span className="text-muted-foreground">Cert Annotations</span>
            <FeatureBadge enabled={!!spec.dns?.useCertificateAnnotations} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Default Cluster Issuer</span>
            <span>{spec.certificates?.defaultClusterIssuer ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
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
            <span className="text-muted-foreground">LB Class</span>
            <span>{spec.loadBalancer?.class ?? "—"}</span>
            <span className="text-muted-foreground">Ingress Class</span>
            <span>{spec.ingress?.class ?? "—"}</span>
            <span className="text-muted-foreground">Gateway Class</span>
            <span>{spec.gatewayAPI?.class ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

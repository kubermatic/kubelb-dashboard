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

import { createFileRoute } from "@tanstack/react-router";

import { KeyValuePairs } from "@/components/common/key-value-pairs";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceHeader } from "@/components/common/resource-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/hooks/use-tenants";
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
  const { data: tenant, isLoading, error, refetch } = useTenant(name);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Failed to load Tenant.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResourceHeader
        name={tenant.metadata.name}
        namespace={tenant.metadata.namespace}
        kind="Tenant"
        createdAt={tenant.metadata.creationTimestamp}
        backHref="/tenants"
        backLabel="Tenants"
      />
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

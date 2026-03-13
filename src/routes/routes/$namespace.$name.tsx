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
import { createFileRoute } from "@tanstack/react-router";
import { FileCode } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { ConditionsTable } from "@/components/common/conditions-table";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute as useRouteResource } from "@/hooks/use-routes";
import type { Route as RouteResource } from "@/types/kubelb";

export const Route = createFileRoute("/routes/$namespace/$name")({
  component: RouteDetail,
});

function RouteDetail() {
  const { namespace, name } = Route.useParams();
  const { data: route, isLoading, error, refetch } = useRouteResource(namespace, name);
  const [yamlOpen, setYamlOpen] = useState(false);

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
      return <ResourceNotFound resourceKind="Route" backHref="/routes" backLabel="Routes" />;
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!route) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={route.metadata.name}
          namespace={route.metadata.namespace}
          kind="Route"
          createdAt={route.metadata.creationTimestamp}
          backHref="/routes"
          backLabel="Routes"
        />
        <Button variant="outline" size="sm" onClick={() => setYamlOpen(true)}>
          <FileCode />
          View YAML
        </Button>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab route={route} />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <StatusTab route={route} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={route.metadata} />
        </TabsContent>
      </Tabs>

      <YamlViewer
        open={yamlOpen}
        onOpenChange={setYamlOpen}
        resource={route}
        title={`Route: ${namespace}/${name}`}
      />
    </div>
  );
}

function OverviewTab({ route }: { route: RouteResource }) {
  const resource = route.spec.source?.kubernetes?.resource;
  const routeKind = (resource?.kind as string) ?? "Unknown";
  const meta = resource?.metadata as Record<string, unknown> | undefined;
  const sourceName = (meta?.name as string) ?? (resource?.name as string | undefined);
  const sourceNs = (meta?.namespace as string) ?? (resource?.namespace as string | undefined);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Type</span>
            <Badge variant="outline">{routeKind}</Badge>
            {sourceName && (
              <>
                <span className="text-muted-foreground">Name</span>
                <span>{sourceName}</span>
              </>
            )}
            {sourceNs && (
              <>
                <span className="text-muted-foreground">Namespace</span>
                <span>{sourceNs}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {route.spec.endpoints?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {route.spec.endpoints.map((ep, i) => (
              <div key={i} className="space-y-1">
                {ep.name && <p className="text-sm font-medium">{ep.name}</p>}
                {ep.addressesReference && (
                  <Badge variant="outline" className="mr-1 text-xs">
                    ref: {ep.addressesReference.name}
                  </Badge>
                )}
                {ep.addresses?.map((addr, j) => (
                  <span key={j} className="mr-2 font-mono text-xs">
                    {addr.ip}
                    {addr.hostname ? ` (${addr.hostname})` : ""}
                  </span>
                ))}
                {ep.ports?.map((port, j) => (
                  <Badge key={j} variant="outline" className="mr-1 text-xs">
                    {port.name ? `${port.name}:` : ""}
                    {port.port}/{port.protocol ?? "TCP"}
                  </Badge>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function StatusTab({ route }: { route: RouteResource }) {
  const resources = route.status?.resources;
  const routeConditions = resources?.route?.conditions ?? [];
  const services = resources?.services ?? {};
  const serviceEntries = Object.entries(services);

  return (
    <>
      {resources?.source && (
        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm">{resources.source}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Route Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionsTable conditions={routeConditions} />
        </CardContent>
      </Card>

      {serviceEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceEntries.map(([svcName, svc]) => (
              <div key={svcName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{svcName}</span>
                  {svc.generatedName && (
                    <Badge variant="secondary" className="text-xs">
                      {svc.generatedName}
                    </Badge>
                  )}
                </div>
                {svc.conditions && <ConditionsTable conditions={svc.conditions} />}
                {svc.ports?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {svc.ports.map((p, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-xs">
                        {p.name ? `${p.name}:` : ""}
                        {p.port}
                        {p.targetPort ? ` -> ${p.targetPort}` : ""}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!routeConditions.length && !serviceEntries.length && !resources?.source && (
        <p className="text-sm text-muted-foreground">No status information available.</p>
      )}
    </>
  );
}

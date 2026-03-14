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
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCode, Globe, Lock, Network, Server } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { ConditionsTable } from "@/components/common/conditions-table";
import { EndpointsSection } from "@/components/common/endpoints-section";
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
import { KUBELB_ANNOTATIONS } from "@/lib/constants";
import { type HealthState, getRouteHealthStatus } from "@/lib/status-mapper";
import { statusStyles } from "@/lib/status-styles";
import { useRoute as useRouteResource } from "@/hooks/use-routes";
import type { Route as RouteResource, RouteServiceStatus } from "@/types/kubelb";

export const Route = createLazyFileRoute("/routes/$namespace/$name")({
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
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ResourcesSection route={route} />
          <EndpointsSection
            endpoints={route.spec.endpoints}
            namespace={route.metadata.namespace ?? "default"}
          />
          <OverviewTab route={route} />
          <StatusSection route={route} />
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

function getServiceHealth(svc: RouteServiceStatus): HealthState {
  if (!svc.conditions?.length) return "Pending";
  const ready = svc.conditions.find(
    (c) =>
      c.type === "Ready" ||
      c.type === "Available" ||
      c.type === "Programmed" ||
      c.type === "ResourceAppliedSuccessfully",
  );
  if (ready?.status === "True") return "Ready";
  if (ready?.status === "False") return "Error";
  return "Pending";
}

function ResourcesSection({ route }: { route: RouteResource }) {
  const routeResource = route.status?.resources?.route;
  const services = route.status?.resources?.services ?? {};
  const serviceEntries = Object.entries(services);
  const serviceCount = serviceEntries.length;
  const health = getRouteHealthStatus(route);
  const routeKind = routeResource?.kind ?? "Unknown";
  const generatedName = routeResource?.generatedName;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Resources</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-2 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <Network className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Downstream (1)</CardTitle>
            </div>
            {generatedName && (
              <Link
                to="/routes/downstream"
                search={{ search: generatedName, page: 0, pageSize: 10 }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {generatedName ? (
              <Link
                to="/routes/downstream"
                search={{ search: generatedName, page: 0, pageSize: 10 }}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate font-medium">{generatedName}</span>
                  <Badge variant="outline">{routeKind}</Badge>
                </div>
                <Badge variant="outline" className={statusStyles[health.state]}>
                  {health.state}
                </Badge>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No downstream resource</span>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-2 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Services ({serviceCount})</CardTitle>
            </div>
            {serviceCount > 0 && (
              <Link
                to="/load-balancers/services"
                search={{ search: generatedName ?? "", page: 0, pageSize: 10 }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {serviceCount === 0 ? (
              <span className="text-sm text-muted-foreground">No services</span>
            ) : (
              <div className="space-y-2">
                {serviceEntries.map(([svcName, svc]) => {
                  const svcHealth = getServiceHealth(svc);
                  return (
                    <Link
                      key={svcName}
                      to="/load-balancers/services"
                      search={{ search: svc.generatedName ?? svcName, page: 0, pageSize: 10 }}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">{svcName}</span>
                      <Badge variant="outline" className={statusStyles[svcHealth]}>
                        {svcHealth}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewTab({ route }: { route: RouteResource }) {
  const resource = route.spec.source?.kubernetes?.resource;
  const routeKind = (resource?.kind as string) ?? "Unknown";
  const meta = resource?.metadata as Record<string, unknown> | undefined;
  const sourceName = (meta?.name as string) ?? (resource?.name as string | undefined);
  const sourceNs = (meta?.namespace as string) ?? (resource?.namespace as string | undefined);
  const annotations = (meta?.annotations as Record<string, string>) ?? {};

  const manageDns = annotations[KUBELB_ANNOTATIONS.MANAGE_DNS] === "true";
  const hostname = annotations[KUBELB_ANNOTATIONS.EXTERNAL_DNS_HOSTNAME];
  const manageCerts = annotations[KUBELB_ANNOTATIONS.MANAGE_CERTIFICATES] === "true";
  const issuer = annotations[KUBELB_ANNOTATIONS.CERTMANAGER_ISSUER];
  const hasDnsCertAnnotations = manageDns || hostname || manageCerts || issuer;

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

      {hasDnsCertAnnotations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-4" />
              DNS & Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">DNS Management</span>
              <div className="flex items-center gap-2">
                {manageDns ? (
                  <Badge className="bg-success/10 text-success">Managed</Badge>
                ) : (
                  <Badge variant="secondary">Not configured</Badge>
                )}
                {hostname && <span className="font-mono text-xs">{hostname}</span>}
              </div>
              <span className="text-muted-foreground">Certificate Management</span>
              <div className="flex items-center gap-2">
                {manageCerts ? (
                  <Badge className="bg-success/10 text-success">Managed</Badge>
                ) : (
                  <Badge variant="secondary">Not configured</Badge>
                )}
                {issuer && (
                  <span className="flex items-center gap-1 font-mono text-xs">
                    <Lock className="size-3" />
                    {issuer}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function StatusSection({ route }: { route: RouteResource }) {
  const resources = route.status?.resources;
  const routeConditions = resources?.route?.conditions ?? [];
  const services = resources?.services ?? {};
  const serviceEntries = Object.entries(services);

  if (!routeConditions.length && !serviceEntries.length && !resources?.source) return null;

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

      {routeConditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ConditionsTable conditions={routeConditions} />
          </CardContent>
        </Card>
      )}

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
    </>
  );
}

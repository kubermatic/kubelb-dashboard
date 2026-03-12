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

import { KubeApiError } from "@/api/kube";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoadBalancer } from "@/hooks/use-load-balancers";
import type { LoadBalancer } from "@/types/kubelb";

export const Route = createFileRoute("/load-balancers/$namespace/$name")({
  component: LoadBalancerDetail,
});

function LoadBalancerDetail() {
  const { namespace, name } = Route.useParams();
  const { data: lb, isLoading, error, refetch } = useLoadBalancer(namespace, name);

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
      return (
        <ResourceNotFound
          resourceKind="Load Balancer"
          backHref="/load-balancers"
          backLabel="Load Balancers"
        />
      );
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!lb) return null;

  return (
    <div className="space-y-6">
      <ResourceHeader
        name={lb.metadata.name}
        namespace={lb.metadata.namespace}
        kind="LoadBalancer"
        createdAt={lb.metadata.creationTimestamp}
        backHref="/load-balancers"
        backLabel="Load Balancers"
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab lb={lb} />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <StatusTab lb={lb} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={lb.metadata} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ lb }: { lb: LoadBalancer }) {
  const externalIPs =
    lb.status?.loadBalancer?.ingress?.map((i) => i.ip || i.hostname).filter(Boolean) ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Spec</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Type</span>
            <span>{lb.spec.type ?? "ClusterIP"}</span>
            <span className="text-muted-foreground">Hostname</span>
            <span>{lb.spec.hostname ?? "—"}</span>
            <span className="text-muted-foreground">Traffic Policy</span>
            <span>{lb.spec.externalTrafficPolicy ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {lb.spec.ports?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Port</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lb.spec.ports.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.name ?? "—"}</TableCell>
                      <TableCell>{p.protocol ?? "TCP"}</TableCell>
                      <TableCell>{p.port}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {externalIPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>External IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {externalIPs.map((ip) => (
                <Badge key={ip} variant="outline" className="font-mono text-xs">
                  {ip}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {lb.spec.endpoints?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lb.spec.endpoints.map((ep, i) => (
              <div key={i} className="space-y-1">
                {ep.name && <p className="text-sm font-medium">{ep.name}</p>}
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

function StatusTab({ lb }: { lb: LoadBalancer }) {
  const servicePorts = lb.status?.service?.ports ?? [];
  const hostname = lb.status?.hostname;
  const ingress = lb.status?.loadBalancer?.ingress ?? [];

  return (
    <>
      {servicePorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Target Port</TableHead>
                    <TableHead>Node Port</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicePorts.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.name ?? "—"}</TableCell>
                      <TableCell>{p.protocol ?? "TCP"}</TableCell>
                      <TableCell>{p.port ?? "—"}</TableCell>
                      <TableCell>{p.targetPort ?? "—"}</TableCell>
                      <TableCell>{p.nodePort ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {hostname && (
        <Card>
          <CardHeader>
            <CardTitle>Hostname Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Hostname</span>
              <span>{hostname.hostname ?? "—"}</span>
              <span className="text-muted-foreground">TLS</span>
              <Badge
                variant="outline"
                className={
                  hostname.tlsEnabled
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }
              >
                {hostname.tlsEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <span className="text-muted-foreground">DNS Record</span>
              <Badge
                variant="outline"
                className={
                  hostname.dnsRecordCreated
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }
              >
                {hostname.dnsRecordCreated ? "Created" : "Pending"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {ingress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {ingress.map((ing, i) => (
                <Badge key={i} variant="outline" className="font-mono text-xs">
                  {ing.ip || ing.hostname}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!servicePorts.length && !hostname && !ingress.length && (
        <p className="text-sm text-muted-foreground">No status information available.</p>
      )}
    </>
  );
}

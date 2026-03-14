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

import React, { useState } from "react";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCode, Server } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { KUBELB_ANNOTATIONS as KUBELB_ANNOTATION_KEYS } from "@/lib/constants";
import { CopyButton } from "@/components/common/copy-button";
import { EndpointsSection } from "@/components/common/endpoints-section";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DetailSkeleton } from "@/components/common/detail-skeleton";
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
import { getLoadBalancerHealthStatus } from "@/lib/status-mapper";
import { statusStyles } from "@/lib/status-styles";
import type { LoadBalancer } from "@/types/kubelb";

export const Route = createLazyFileRoute("/load-balancers/$namespace/$name")({
  component: LoadBalancerDetail,
});

function LoadBalancerDetail() {
  const { namespace, name } = Route.useParams();
  const { data: lb, isLoading, error, refetch } = useLoadBalancer(namespace, name);
  const [yamlOpen, setYamlOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
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
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={lb.metadata.name}
          namespace={lb.metadata.namespace}
          kind="LoadBalancer"
          createdAt={lb.metadata.creationTimestamp}
          backHref="/load-balancers"
          backLabel="Load Balancers"
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
          <ResourcesSection lb={lb} />
          <EndpointsSection
            endpoints={lb.spec.endpoints}
            namespace={lb.metadata.namespace ?? "default"}
          />
          <OverviewTab lb={lb} />
          <StatusSection lb={lb} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={lb.metadata} />
        </TabsContent>
      </Tabs>

      <YamlViewer
        open={yamlOpen}
        onOpenChange={setYamlOpen}
        resource={lb}
        title={`LoadBalancer: ${namespace}/${name}`}
      />
    </div>
  );
}

function ResourcesSection({ lb }: { lb: LoadBalancer }) {
  const health = getLoadBalancerHealthStatus(lb);
  const portCount = lb.spec.ports?.length ?? 0;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Resources</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-2 border-l-primary">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Services</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{portCount}</span>
              <span className="text-sm text-muted-foreground">
                port{portCount !== 1 ? "s" : ""}
              </span>
              <Badge variant="outline" className={statusStyles[health.state]}>
                {health.state}
              </Badge>
            </div>
            <Link
              to="/load-balancers/services"
              search={{ search: lb.metadata.name, page: 0, pageSize: 10 }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const KUBELB_ANNOTATIONS: Record<string, string> = {
  [KUBELB_ANNOTATION_KEYS.PROXY_PROTOCOL]: "Proxy Protocol",
  [KUBELB_ANNOTATION_KEYS.LB_POLICY]: "LB Policy",
  [KUBELB_ANNOTATION_KEYS.WILDCARD_DOMAIN]: "Wildcard Domain",
  [KUBELB_ANNOTATION_KEYS.MANAGE_DNS]: "Managed DNS",
  [KUBELB_ANNOTATION_KEYS.MANAGE_CERTIFICATES]: "Managed Certificates",
  [KUBELB_ANNOTATION_KEYS.PROPAGATE_ANNOTATION]: "Propagate Annotations",
};

function OverviewTab({ lb }: { lb: LoadBalancer }) {
  const externalIPs =
    lb.status?.loadBalancer?.ingress?.map((i) => i.ip || i.hostname).filter(Boolean) ?? [];

  const kubelbAnnotations = Object.entries(lb.metadata.annotations ?? {}).filter(
    ([key]) => key in KUBELB_ANNOTATIONS,
  );

  return (
    <>
      <div>
        <h3 className="mb-3 text-[15px] font-semibold text-foreground">Spec</h3>
        <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
          <span className="text-muted-foreground">Type</span>
          <span>{lb.spec.type ?? "ClusterIP"}</span>
          <span className="text-muted-foreground">Hostname</span>
          <span>{lb.spec.hostname ?? "—"}</span>
          <span className="text-muted-foreground">Traffic Policy</span>
          <span>{lb.spec.externalTrafficPolicy ?? "—"}</span>
        </div>
      </div>

      {kubelbAnnotations.length > 0 && (
        <>
          <Separator className="my-2" />
          <div>
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">KubeLB Configuration</h3>
            <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
              {kubelbAnnotations.map(([key, value]) => (
                <React.Fragment key={key}>
                  <span className="text-muted-foreground">{KUBELB_ANNOTATIONS[key]}</span>
                  <span className="font-mono text-xs">{value}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      {lb.spec.ports?.length ? (
        <>
          <Separator className="my-2" />
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
        </>
      ) : null}

      {externalIPs.length > 0 && (
        <>
          <Separator className="my-2" />
          <div>
            <h3 className="mb-3 text-[15px] font-semibold text-foreground">External IPs</h3>
            <div className="flex flex-wrap gap-1.5">
              {externalIPs.map((ip) => (
                <Badge
                  key={ip}
                  variant="outline"
                  className="inline-flex items-center gap-1 font-mono text-xs"
                >
                  {ip}
                  <CopyButton value={ip!} />
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatusSection({ lb }: { lb: LoadBalancer }) {
  const servicePorts = lb.status?.service?.ports ?? [];
  const hostname = lb.status?.hostname;
  const ingress = lb.status?.loadBalancer?.ingress ?? [];

  if (!servicePorts.length && !hostname && !ingress.length) return null;

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
        <div>
          <h3 className="mb-3 text-[15px] font-semibold text-foreground">Ingress</h3>
          <div className="flex flex-wrap gap-1.5">
            {ingress.map((ing, i) => (
              <Badge key={i} variant="outline" className="font-mono text-xs">
                {ing.ip || ing.hostname}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

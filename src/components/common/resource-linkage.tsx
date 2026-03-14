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

import { CopyButton } from "@/components/common/copy-button";
import { ConditionsTable } from "@/components/common/conditions-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLoadBalancerHealthStatus, getRouteHealthStatus } from "@/lib/status-mapper";
import type { HealthState } from "@/lib/status-mapper";
import { statusStyles } from "@/lib/status-styles";
import type { LoadBalancer, Route } from "@/types/kubelb";

function HealthBadge({ state }: { state: HealthState }) {
  return (
    <Badge variant="outline" className={statusStyles[state]}>
      {state}
    </Badge>
  );
}

function SearchLink({
  to,
  search,
  children,
}: {
  to: string;
  search: string;
  children: React.ReactNode;
}) {
  const href = `${to}?search=${encodeURIComponent(search)}`;
  return (
    <a href={href} className="text-primary hover:underline">
      {children}
    </a>
  );
}

export function RouteResourceLinkage({ route }: { route: Route }) {
  const routeResource = route.status?.resources?.route;

  if (!routeResource) {
    return <p className="text-sm text-muted-foreground">No downstream resources yet.</p>;
  }

  const health = getRouteHealthStatus(route);
  const services = route.status?.resources?.services ?? {};
  const serviceEntries = Object.entries(services);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Downstream Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Kind</span>
            <Badge variant="outline">{routeResource.kind ?? "Unknown"}</Badge>
            <span className="text-muted-foreground">Name</span>
            <span>{routeResource.name ?? "—"}</span>
            <span className="text-muted-foreground">Namespace</span>
            <span>{routeResource.namespace ?? "—"}</span>
            <span className="text-muted-foreground">Generated Name</span>
            <span>
              {routeResource.generatedName ? (
                <SearchLink to="/routes/downstream" search={routeResource.generatedName}>
                  {routeResource.generatedName}
                </SearchLink>
              ) : (
                "—"
              )}
            </span>
            <span className="text-muted-foreground">Health</span>
            <div className="flex items-center gap-2">
              <HealthBadge state={health.state} />
              {health.reason && (
                <span className="text-xs text-muted-foreground">{health.reason}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {routeResource.conditions?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>KubeLB Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ConditionsTable conditions={routeResource.conditions} />
          </CardContent>
        </Card>
      ) : null}

      {serviceEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Downstream Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Generated Name</TableHead>
                    <TableHead>Ports</TableHead>
                    <TableHead>Conditions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceEntries.map(([key, svc]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>
                        {svc.generatedName ? (
                          <SearchLink to="/load-balancers/services" search={svc.generatedName}>
                            {svc.generatedName}
                          </SearchLink>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {svc.ports?.map((p, i) => (
                            <Badge key={i} variant="outline" className="font-mono text-xs">
                              {p.name ? `${p.name}:` : ""}
                              {p.port}
                              {p.targetPort ? ` -> ${p.targetPort}` : ""}
                            </Badge>
                          )) ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {svc.conditions?.length ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                            title={svc.conditions.map((c) => `${c.type}: ${c.status}`).join(", ")}
                          >
                            {svc.conditions.length} condition{svc.conditions.length > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function LoadBalancerResourceLinkage({ lb }: { lb: LoadBalancer }) {
  const health = getLoadBalancerHealthStatus(lb);
  const ingress = lb.status?.loadBalancer?.ingress ?? [];
  const ports = lb.spec.ports ?? [];
  const hasData = ingress.length > 0 || ports.length > 0;

  if (!hasData && health.state === "Pending") {
    return <p className="text-sm text-muted-foreground">No resource data available.</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <HealthBadge state={health.state} />
            {health.reason && (
              <span className="text-xs text-muted-foreground">{health.reason}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {ingress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>External IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {ingress.map((ing, i) => {
                const value = ing.ip || ing.hostname || "";
                return (
                  <Badge
                    key={i}
                    variant="outline"
                    className="inline-flex items-center gap-1 font-mono text-xs"
                  >
                    {value}
                    {value && <CopyButton value={value} />}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {ports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Ports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Protocol</TableHead>
                    <TableHead>Port</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ports.map((p, i) => (
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
      )}
    </div>
  );
}

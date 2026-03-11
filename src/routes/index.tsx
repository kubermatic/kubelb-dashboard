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
import { AlertCircle, Network, Route as RouteIcon, Shield, Users } from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeployments } from "@/hooks/use-deployments";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useRoutes } from "@/hooks/use-routes";
import { useTenants } from "@/hooks/use-tenants";
import type { Condition } from "@/types/kubernetes";

export const Route = createFileRoute("/")({
  component: Overview,
});

interface ResourceQueryResult {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

function QueryError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{error?.message ?? "Failed to fetch data"}</span>
      <button
        onClick={onRetry}
        className="shrink-0 rounded-md bg-destructive/10 px-3 py-1 text-xs font-medium hover:bg-destructive/20"
      >
        Retry
      </button>
    </div>
  );
}

function StatCardWithQuery({
  query,
  ...cardProps
}: Omit<React.ComponentProps<typeof StatCard>, "count"> & {
  query: ResourceQueryResult & { data?: { items: unknown[] } };
}) {
  if (query.isLoading) return <StatCardSkeleton />;
  if (query.isError) {
    return <QueryError error={query.error} onRetry={query.refetch} />;
  }
  return <StatCard {...cardProps} count={query.data?.items.length ?? 0} />;
}

interface ConditionOwner {
  status?: { conditions?: Condition[] };
}

function countByConditionStatus<T extends ConditionOwner>(
  items: T[],
  conditionType: string,
): { ready: number; pending: number; error: number } {
  let ready = 0;
  let pending = 0;
  let error = 0;

  for (const item of items) {
    const condition = item.status?.conditions?.find((c) => c.type === conditionType);
    if (!condition || condition.status === "Unknown") {
      pending++;
    } else if (condition.status === "True") {
      ready++;
    } else {
      error++;
    }
  }

  return { ready, pending, error };
}

function ResourceStatusRow({
  label,
  counts,
}: {
  label: string;
  counts: { ready: number; pending: number; error: number };
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-2">
        <StatusBadge label={`${String(counts.ready)} Ready`} status="True" />
        {counts.pending > 0 && (
          <StatusBadge label={`${String(counts.pending)} Pending`} status="Unknown" />
        )}
        {counts.error > 0 && <StatusBadge label={`${String(counts.error)} Error`} status="False" />}
      </div>
    </div>
  );
}

function Overview() {
  const lbQuery = useLoadBalancers();
  const routeQuery = useRoutes();
  const tenantQuery = useTenants();
  const deploymentQuery = useDeployments("kubelb");

  const lbItems = lbQuery.data?.items ?? [];
  const routeItems = routeQuery.data?.items ?? [];

  const hasStatusData =
    !lbQuery.isLoading && !routeQuery.isLoading && lbItems.length + routeItems.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-muted-foreground">KubeLB cluster overview and health summary.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCardWithQuery icon={Network} label="Load Balancers" accent="primary" query={lbQuery} />
        <StatCardWithQuery icon={RouteIcon} label="Routes" accent="secondary" query={routeQuery} />
        <StatCardWithQuery icon={Users} label="Tenants" accent="primary" query={tenantQuery} />
        <StatCardWithQuery
          icon={Shield}
          label="Envoy Proxies"
          accent="primary"
          query={deploymentQuery}
        />
      </div>

      {hasStatusData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Resource Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lbItems.length > 0 && (
              <ResourceStatusRow
                label="Load Balancers"
                counts={countByConditionStatus(
                  lbItems.map((lb) => ({
                    status: {
                      conditions: lb.status?.loadBalancer?.ingress
                        ? [
                            {
                              type: "Ready",
                              status: "True" as const,
                              lastTransitionTime: "",
                              reason: "",
                              message: "",
                            },
                          ]
                        : undefined,
                    },
                  })),
                  "Ready",
                )}
              />
            )}
            {routeItems.length > 0 && (
              <ResourceStatusRow
                label="Routes"
                counts={countByConditionStatus(
                  routeItems.map((r) => ({
                    status: { conditions: r.status?.resources?.route?.conditions },
                  })),
                  "Ready",
                )}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

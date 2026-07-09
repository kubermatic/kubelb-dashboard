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

import { useMemo } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Waypoints } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { TenantSelector } from "@/components/common/tenant-selector";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { TrafficGraphView } from "@/components/common/traffic-graph";
import { buildTrafficGraph, tenantColor } from "@/lib/traffic-graph";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useAllAddresses } from "@/hooks/use-addresses";
import { useUIStore } from "@/stores/ui";
import { namespaceToTenant, tenantToNamespace } from "@/lib/format";

export const Route = createLazyFileRoute("/traffic/")({
  component: Traffic,
});

function Traffic() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const { data, isLoading, isError, error, refetch } = useLoadBalancers();
  const { data: addresses } = useAllAddresses();

  const graph = useMemo(() => {
    const lbs = data?.items ?? [];
    const nsFilter = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
    return buildTrafficGraph(lbs, addresses?.items ?? [], nsFilter);
  }, [data, addresses, selectedTenant]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Traffic"
          description="Live-balancer topology across tenants — Internet to load balancers to backends."
        />
        <TenantSelector />
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : graph.nodes.length === 0 ? (
        <EmptyState
          icon={Waypoints}
          title="No traffic to show"
          description="No load balancers were found for the selected tenant."
        />
      ) : (
        <>
          {graph.namespaces.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {graph.namespaces.map((ns) => (
                <div key={ns} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tenantColor(ns, graph.namespaces) }}
                  />
                  {namespaceToTenant(ns)}
                </div>
              ))}
            </div>
          )}
          <TrafficGraphView graph={graph} />
        </>
      )}
    </div>
  );
}

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

import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Clock, Search, Waypoints } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_TRAFFIC_WINDOW, TRAFFIC_WINDOWS, type TrafficWindow } from "@/api/traffic";
import { TrafficGraphView } from "@/components/common/traffic-graph";
import { TrafficFlowsTable } from "@/components/common/traffic-flows-table";
import { TrafficFilterSidebar } from "@/components/common/traffic-filter-sidebar";
import {
  applyFlowFilters,
  applyGraphFilters,
  DEFAULT_FILTERS,
  graphNamespaces,
  type TrafficFilters,
} from "@/lib/traffic-filters";
import {
  useTrafficAvailable,
  useTrafficFlows,
  useTrafficGraph,
  useTrafficSources,
} from "@/hooks/use-traffic";

export const Route = createLazyFileRoute("/traffic/")({
  component: Traffic,
});

function Traffic() {
  const { isLoading: sourcesLoading } = useTrafficSources();
  const available = useTrafficAvailable();

  const [window, setWindow] = useState<TrafficWindow>(DEFAULT_TRAFFIC_WINDOW);
  const [filters, setFilters] = useState<TrafficFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");

  const graph = useTrafficGraph(available, window);
  const flows = useTrafficFlows(available, window);

  const namespaces = useMemo(() => (graph.data ? graphNamespaces(graph.data) : []), [graph.data]);
  const filteredGraph = useMemo(
    () => (graph.data ? applyGraphFilters(graph.data, filters) : null),
    [graph.data, filters],
  );
  const filteredFlows = useMemo(
    () => (flows.data ? applyFlowFilters(flows.data, filters, search) : []),
    [flows.data, filters, search],
  );

  if (sourcesLoading) return <Skeleton className="h-[600px] w-full" />;

  if (!available) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Traffic"
          description="Live service-to-service traffic observed by Hubble."
        />
        <EmptyState
          icon={Waypoints}
          title="No traffic source detected"
          description="Traffic requires a Hubble relay (Cilium). Configure HUBBLE_RELAY_ADDRESS to enable this view."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Traffic"
        description="Live service-to-service traffic observed by Hubble."
      />
      <div className="flex gap-6">
        <TrafficFilterSidebar filters={filters} namespaces={namespaces} onChange={setFilters} />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live via Hubble
                {filteredGraph && (
                  <span>
                    · {filteredGraph.nodes.length} services, {filteredGraph.edges.length}{" "}
                    connections
                  </span>
                )}
              </div>
              <Select value={window} onValueChange={(v) => setWindow(v as TrafficWindow)}>
                <SelectTrigger size="sm" className="w-28 text-xs" aria-label="Time window">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRAFFIC_WINDOWS.map((w) => (
                    <SelectItem key={w} value={w}>
                      Last {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {graph.isError && graph.error ? (
              <QueryError error={graph.error} onRetry={() => void graph.refetch()} />
            ) : filteredGraph ? (
              <TrafficGraphView graph={filteredGraph} namespaces={namespaces} />
            ) : (
              <Skeleton className="h-[560px] w-full" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium">
                Flows <span className="text-muted-foreground">({filteredFlows.length})</span>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter flows…"
                  className="pl-8"
                />
              </div>
            </div>
            {flows.isError && flows.error ? (
              <QueryError error={flows.error} onRetry={() => void flows.refetch()} />
            ) : flows.data ? (
              <TrafficFlowsTable flows={filteredFlows} />
            ) : (
              <Skeleton className="h-80 w-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

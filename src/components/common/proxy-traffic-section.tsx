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

import { Waypoints } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { TrafficGraphView } from "@/components/common/traffic-graph";
import { Skeleton } from "@/components/ui/skeleton";
import { useProxyTrafficGraph } from "@/hooks/use-traffic";
import { graphNamespaces } from "@/lib/traffic-filters";

export function ProxyTrafficSection({ namespace }: { namespace: string }) {
  const graph = useProxyTrafficGraph(namespace, true);

  if (graph.isLoading) return <Skeleton className="h-[560px] w-full" />;
  if (graph.isError && graph.error) {
    return <QueryError error={graph.error} onRetry={() => void graph.refetch()} />;
  }
  if (!graph.data || graph.data.nodes.length === 0) {
    return (
      <EmptyState
        icon={Waypoints}
        title="No traffic observed"
        description="Hubble has not reported any flows touching this proxy's namespace recently."
      />
    );
  }

  const namespaces = graphNamespaces(graph.data);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live via Hubble · {graph.data.nodes.length} services, {graph.data.edges.length} connections
      </div>
      <TrafficGraphView graph={graph.data} namespaces={namespaces} />
    </div>
  );
}

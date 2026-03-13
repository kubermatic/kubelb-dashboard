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
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { AgeCell } from "@/components/common/age-cell";
import { getOriginSource, namespaceToTenant, tenantToNamespace } from "@/lib/format";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import { useUIStore } from "@/stores/ui";
import {
  createFileRoute,
  Link,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Network } from "lucide-react";
import { useState } from "react";

import type { LoadBalancer } from "@/types/kubelb";

export const Route = createFileRoute("/load-balancers/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: LoadBalancers,
});

function formatPorts(lb: LoadBalancer): string {
  return lb.spec.ports?.map((p) => `${String(p.port)}/${p.protocol ?? "TCP"}`).join(", ") ?? "";
}

function getExternalIPs(lb: LoadBalancer): string[] {
  return (
    (lb.status?.loadBalancer?.ingress
      ?.map((i) => i.ip || i.hostname)
      .filter(Boolean) as string[]) ?? []
  );
}

function getEndpointsSummary(lb: LoadBalancer): string {
  if (!lb.spec.endpoints?.length) return "\u2014";
  const parts: string[] = [];
  for (const ep of lb.spec.endpoints) {
    if (ep.addressesReference) {
      parts.push(ep.addressesReference.name ?? "ref");
    } else if (ep.addresses?.length) {
      const ports = ep.ports?.map((p) => p.port) ?? [];
      for (const addr of ep.addresses) {
        if (ports.length) {
          parts.push(...ports.map((port) => `${addr.ip}:${String(port)}`));
        } else {
          parts.push(addr.ip);
        }
      }
    }
  }
  return parts.length ? parts.join(", ") : "\u2014";
}

function isReady(lb: LoadBalancer): boolean {
  return (lb.status?.loadBalancer?.ingress?.length ?? 0) > 0;
}

function LoadBalancers() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } =
    useLoadBalancers(namespace);
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/load-balancers/" });
  const items = data?.items ?? [];
  const [yamlResource, setYamlResource] = useState<LoadBalancer | null>(null);

  const columns: ColumnDef<LoadBalancer>[] = [
    {
      accessorFn: (row) => row.metadata.name,
      id: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const { name, namespace } = row.original.metadata;
        return (
          <Link
            to="/load-balancers/$namespace/$name"
            params={{ namespace: namespace ?? "default", name }}
            className="font-medium text-primary hover:underline"
          >
            {name}
          </Link>
        );
      },
    },
    {
      accessorFn: (row) => namespaceToTenant(row.metadata.namespace ?? ""),
      id: "tenant",
      meta: { hideBelow: "md" },
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
    },
    {
      id: "source",
      accessorFn: (row) => getOriginSource(row.metadata.labels),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{getOriginSource(row.original.metadata.labels)}</span>
      ),
    },
    {
      id: "ports",
      accessorFn: formatPorts,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ports" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{formatPorts(row.original) || "\u2014"}</span>
      ),
    },
    {
      id: "externalIP",
      accessorFn: (row) => getExternalIPs(row).join(", "),
      header: ({ column }) => <DataTableColumnHeader column={column} title="External IP" />,
      cell: ({ row }) => {
        const ips = getExternalIPs(row.original);
        if (!ips.length) return <span className="text-sm text-muted-foreground">{"\u2014"}</span>;
        return (
          <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {ips.map((ip) => (
              <span key={ip} className="inline-flex items-center gap-0.5 font-mono text-xs">
                {ip}
                <CopyButton value={ip} />
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "endpoints",
      meta: { hideBelow: "md" },
      accessorFn: (row) => getEndpointsSummary(row),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Endpoints" />,
      cell: ({ row }) => (
        <span className="max-w-48 truncate font-mono text-xs">
          {getEndpointsSummary(row.original)}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => (isReady(row) ? "Ready" : "Pending"),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const ready = isReady(row.original);
        return (
          <Badge
            className={
              ready
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-warning/10 text-warning hover:bg-warning/20"
            }
          >
            {ready ? "Ready" : "Pending"}
          </Badge>
        );
      },
    },
    {
      id: "age",
      accessorFn: (row) => row.metadata.creationTimestamp,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
      cell: ({ row }) => <AgeCell timestamp={row.original.metadata.creationTimestamp} />,
      sortingFn: "datetime",
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: "View YAML", icon: FileText, onClick: () => setYamlResource(row.original) },
          ]}
        />
      ),
    },
  ];

  const updateSearch = (params: Partial<ListSearchParams>) =>
    void navigate({
      from: "/load-balancers/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Load Balancer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage load balancer services across tenants.
        </p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState
          icon={Network}
          title={
            selectedTenant ? `No load balancers in ${selectedTenant}` : "No load balancers found"
          }
          description="Load balancers will appear here once created."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search load balancers..."
          onRefresh={() => void refetch()}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          toolbarLeading={<TenantSelector />}
          initialSearch={search}
          initialPage={page}
          initialPageSize={pageSize}
          onSearchChange={(v) => updateSearch({ search: v, page: 0 })}
          onPageChange={(p) => updateSearch({ page: p })}
          onPageSizeChange={(s) => updateSearch({ pageSize: s, page: 0 })}
          onRowClick={(row) => {
            const { name, namespace } = row.original.metadata;
            void navigate({
              to: "/load-balancers/$namespace/$name",
              params: { namespace: namespace ?? "default", name },
            });
          }}
        />
      )}

      <YamlViewer
        open={!!yamlResource}
        onOpenChange={(open) => !open && setYamlResource(null)}
        resource={yamlResource}
        title={
          yamlResource
            ? `LoadBalancer: ${yamlResource.metadata.namespace}/${yamlResource.metadata.name}`
            : undefined
        }
      />
    </div>
  );
}

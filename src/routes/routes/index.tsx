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
import {
  createFileRoute,
  Link,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { QueryError } from "@/components/common/query-error";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { useRoutes } from "@/hooks/use-routes";
import { AgeCell } from "@/components/common/age-cell";
import { namespaceToTenant, tenantToNamespace } from "@/lib/format";
import { getRouteHealthStatus } from "@/lib/status-mapper";
import { statusStyles } from "@/lib/status-styles";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import { KUBELB_ANNOTATIONS } from "@/lib/constants";
import { useUIStore } from "@/stores/ui";
import type { Route as RouteType } from "@/types/kubelb";

export const Route = createFileRoute("/routes/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: Routes,
});

function deriveRouteType(route: RouteType): string {
  const resource = route.spec.source?.kubernetes?.resource;
  if (!resource) return "Unknown";
  const kind = resource["kind"] as string | undefined;
  if (kind === "Ingress" || kind === "HTTPRoute" || kind === "GRPCRoute") return kind;
  return kind ?? "Unknown";
}

function getSourceName(route: RouteType): string {
  const resource = route.spec.source?.kubernetes?.resource;
  if (!resource) return "\u2014";
  const meta = resource["metadata"] as Record<string, unknown> | undefined;
  const name = (meta?.["name"] as string) ?? (resource["name"] as string | undefined);
  const ns = (meta?.["namespace"] as string) ?? (resource["namespace"] as string | undefined);
  if (ns && name) return `${ns}/${name}`;
  return name ?? "\u2014";
}

function getEndpointsSummary(route: RouteType): string {
  if (!route.spec.endpoints?.length) return "\u2014";
  const parts: string[] = [];
  for (const ep of route.spec.endpoints) {
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

function getSourceAnnotations(route: RouteType): Record<string, string> {
  const resource = route.spec.source?.kubernetes?.resource;
  if (!resource) return {};
  const meta = resource["metadata"] as Record<string, unknown> | undefined;
  return (meta?.["annotations"] as Record<string, string>) ?? {};
}

function Routes() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } =
    useRoutes(namespace);
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/routes/" });
  const items = data?.items ?? [];
  const [yamlResource, setYamlResource] = useState<RouteType | null>(null);

  const columns: ColumnDef<RouteType>[] = [
    {
      accessorFn: (row) => row.metadata.name,
      id: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const { name, namespace } = row.original.metadata;
        return (
          <Link
            to="/routes/$namespace/$name"
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
      id: "type",
      meta: { hideBelow: "md" },
      accessorFn: deriveRouteType,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
      id: "source",
      accessorFn: getSourceName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => {
        const source = getSourceName(row.original);
        return (
          <span className="block max-w-48 truncate font-mono text-xs" title={source}>
            {source}
          </span>
        );
      },
    },
    {
      id: "endpoints",
      accessorFn: (row) => getEndpointsSummary(row),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Endpoints" />,
      cell: ({ row }) => (
        <span
          className="block max-w-48 truncate font-mono text-xs"
          title={getEndpointsSummary(row.original)}
        >
          {getEndpointsSummary(row.original)}
        </span>
      ),
    },
    {
      id: "dns",
      meta: { hideBelow: "lg" },
      accessorFn: (row) => getSourceAnnotations(row)[KUBELB_ANNOTATIONS.MANAGE_DNS] === "true",
      header: ({ column }) => <DataTableColumnHeader column={column} title="DNS" />,
      cell: ({ row }) => {
        const annotations = getSourceAnnotations(row.original);
        const managed = annotations[KUBELB_ANNOTATIONS.MANAGE_DNS] === "true";
        if (!managed) return <span className="text-muted-foreground">{"\u2014"}</span>;
        const hostname = annotations[KUBELB_ANNOTATIONS.EXTERNAL_DNS_HOSTNAME];
        const badge = <Badge className="bg-success/10 text-success">Managed</Badge>;
        if (!hostname) return badge;
        return (
          <Tooltip>
            <TooltipTrigger render={badge} />
            <TooltipContent>{hostname}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "tls",
      meta: { hideBelow: "lg" },
      accessorFn: (row) =>
        getSourceAnnotations(row)[KUBELB_ANNOTATIONS.MANAGE_CERTIFICATES] === "true",
      header: ({ column }) => <DataTableColumnHeader column={column} title="TLS" />,
      cell: ({ row }) => {
        const annotations = getSourceAnnotations(row.original);
        const managed = annotations[KUBELB_ANNOTATIONS.MANAGE_CERTIFICATES] === "true";
        if (!managed) return <span className="text-muted-foreground">{"\u2014"}</span>;
        const issuer = annotations[KUBELB_ANNOTATIONS.CERTMANAGER_ISSUER];
        const badge = <Badge className="bg-success/10 text-success">Managed</Badge>;
        if (!issuer) return badge;
        return (
          <Tooltip>
            <TooltipTrigger render={badge} />
            <TooltipContent>{issuer}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "status",
      accessorFn: (row) => getRouteHealthStatus(row).state,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const { state, reason } = getRouteHealthStatus(row.original);
        return (
          <Badge className={statusStyles[state]} title={reason}>
            {state}
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
      from: "/routes/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Routes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage HTTP and gRPC route configurations.
        </p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage={
            selectedTenant ? `No routes available for tenant ${selectedTenant}` : "No routes found."
          }
          searchColumn="name"
          searchPlaceholder="Search routes..."
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
              to: "/routes/$namespace/$name",
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
            ? `Route: ${yamlResource.metadata.namespace}/${yamlResource.metadata.name}`
            : undefined
        }
      />
    </div>
  );
}

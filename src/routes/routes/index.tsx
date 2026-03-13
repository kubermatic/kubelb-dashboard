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
import { FileText, Route as RouteIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { QueryError } from "@/components/common/query-error";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { useDeleteRoute } from "@/hooks/use-route-mutations";
import { useRoutes } from "@/hooks/use-routes";
import { formatAge, tenantToNamespace } from "@/lib/format";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
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

type RouteConditionStatus = "Ready" | "Error" | "Pending";

function getRouteStatus(route: RouteType): RouteConditionStatus {
  const conditions = route.status?.resources?.route?.conditions;
  if (!conditions?.length) return "Pending";
  const ready = conditions.find((c) => c.type === "Ready");
  if (!ready) return "Pending";
  if (ready.status === "True") return "Ready";
  if (ready.status === "False") return "Error";
  return "Pending";
}

const statusStyles: Record<RouteConditionStatus, string> = {
  Ready: "bg-success/10 text-success hover:bg-success/20",
  Error: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  Pending: "bg-warning/10 text-warning hover:bg-warning/20",
};

function Routes() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isError, error, refetch } = useRoutes(namespace);
  const deleteRoute = useDeleteRoute();
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/routes/" });
  const items = data?.items ?? [];
  const [yamlResource, setYamlResource] = useState<RouteType | null>(null);
  const [deleteResource, setDeleteResource] = useState<RouteType | null>(null);

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
      accessorFn: (row) => row.metadata.namespace,
      id: "namespace",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Namespace" />,
    },
    {
      id: "type",
      accessorFn: deriveRouteType,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
      id: "source",
      accessorFn: getSourceName,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => <span className="font-mono text-xs">{getSourceName(row.original)}</span>,
    },
    {
      id: "endpoints",
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
      accessorFn: getRouteStatus,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = getRouteStatus(row.original);
        return <Badge className={statusStyles[status]}>{status}</Badge>;
      },
    },
    {
      id: "age",
      accessorFn: (row) => row.metadata.creationTimestamp,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
      cell: ({ row }) => {
        const ts = row.original.metadata.creationTimestamp;
        return ts ? formatAge(ts) : "\u2014";
      },
      sortingFn: "datetime",
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <RowActions
            actions={[
              { label: "View YAML", icon: FileText, onClick: () => setYamlResource(row.original) },
              {
                label: "Delete",
                icon: Trash2,
                variant: "destructive",
                separator: true,
                onClick: () => setDeleteResource(row.original),
              },
            ]}
          />
        </div>
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
      ) : !isLoading && items.length === 0 ? (
        <EmptyState icon={RouteIcon} title="No routes found" />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search routes..."
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

      {deleteResource && (
        <DeleteDialog
          open={!!deleteResource}
          onOpenChange={(open) => !open && setDeleteResource(null)}
          resourceName={deleteResource.metadata.name}
          resourceKind="Route"
          isPending={deleteRoute.isPending}
          onConfirm={() => {
            void deleteRoute
              .mutateAsync({
                namespace: deleteResource.metadata.namespace ?? "",
                name: deleteResource.metadata.name,
              })
              .then(() => setDeleteResource(null));
          }}
        />
      )}
    </div>
  );
}

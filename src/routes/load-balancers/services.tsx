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

import { AgeCell } from "@/components/common/age-cell";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { EmptyState } from "@/components/common/empty-state";
import { ManagedToggle } from "@/components/common/managed-toggle";
import { QueryError } from "@/components/common/query-error";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { useServices } from "@/hooks/use-services";
import { namespaceToTenant, tenantToNamespace } from "@/lib/format";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import { useUIStore } from "@/stores/ui";
import type { GenericResource } from "@/mocks/fixtures/types";
import { createFileRoute, stripSearchParams, useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Server } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/load-balancers/services")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: Services,
});

const MANAGED_LABEL = "kubelb.k8c.io/managed-by=kubelb";

function getServiceType(svc: GenericResource): string {
  return (svc.spec?.["type"] as string) ?? "ClusterIP";
}

function getClusterIP(svc: GenericResource): string {
  return (svc.spec?.["clusterIP"] as string) ?? "\u2014";
}

function getServicePorts(svc: GenericResource): string {
  const ports = svc.spec?.["ports"] as Array<{ port: number; protocol?: string }> | undefined;
  if (!ports?.length) return "\u2014";
  return ports.map((p) => `${String(p.port)}/${p.protocol ?? "TCP"}`).join(", ");
}

function Services() {
  const [managed, setManaged] = useState(true);
  const selectedTenant = useUIStore((s) => s.selectedTenant);

  const namespace = managed && selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const labelSelector = managed ? MANAGED_LABEL : undefined;

  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } = useServices(
    namespace,
    labelSelector,
  );
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/load-balancers/services" });
  const items = data?.items ?? [];
  const [yamlResource, setYamlResource] = useState<GenericResource | null>(null);

  const columns: ColumnDef<GenericResource>[] = [
    {
      accessorFn: (row) => row.metadata.name,
      id: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <span className="font-medium">{row.original.metadata.name}</span>,
    },
    {
      accessorFn: (row) => row.metadata.namespace,
      id: "namespace",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Namespace" />,
    },
    ...(managed
      ? ([
          {
            accessorFn: (row) => namespaceToTenant(row.metadata.namespace ?? ""),
            id: "tenant",
            meta: { hideBelow: "md" },
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
          },
        ] as ColumnDef<GenericResource>[])
      : []),
    {
      accessorFn: getServiceType,
      id: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
      accessorFn: getClusterIP,
      id: "clusterIP",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cluster IP" />,
      cell: ({ row }) => <span className="font-mono text-xs">{getClusterIP(row.original)}</span>,
    },
    {
      accessorFn: getServicePorts,
      id: "ports",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ports" />,
      cell: ({ row }) => <span className="font-mono text-xs">{getServicePorts(row.original)}</span>,
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
      from: "/load-balancers/services",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View Kubernetes services across tenants.
        </p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState
          icon={Server}
          title={selectedTenant ? `No services in ${selectedTenant}` : "No services found"}
          description="Services will appear here once created."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search services..."
          onRefresh={() => void refetch()}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          toolbarLeading={
            <>
              <ManagedToggle checked={managed} onCheckedChange={setManaged} />
              {managed && <TenantSelector />}
            </>
          }
          initialSearch={search}
          initialPage={page}
          initialPageSize={pageSize}
          onSearchChange={(v) => updateSearch({ search: v, page: 0 })}
          onPageChange={(p) => updateSearch({ page: p })}
          onPageSizeChange={(s) => updateSearch({ pageSize: s, page: 0 })}
        />
      )}

      <YamlViewer
        open={!!yamlResource}
        onOpenChange={(open) => !open && setYamlResource(null)}
        resource={yamlResource}
        title={
          yamlResource
            ? `Service: ${yamlResource.metadata.namespace}/${yamlResource.metadata.name}`
            : undefined
        }
      />
    </div>
  );
}

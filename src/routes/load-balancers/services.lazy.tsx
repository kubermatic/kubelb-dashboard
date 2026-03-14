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

import { Badge } from "@/components/ui/badge";
import { AgeCell } from "@/components/common/age-cell";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { ManagedToggle } from "@/components/common/managed-toggle";
import { NamespaceSelector } from "@/components/common/namespace-selector";
import { QueryError } from "@/components/common/query-error";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { useServices } from "@/hooks/use-services";
import { KUBELB_LABELS } from "@/lib/constants";
import { namespaceToTenant, tenantToNamespace } from "@/lib/format";
import type { ListSearchParams } from "@/lib/search-params";
import { useUIStore } from "@/stores/ui";
import type { GenericResource } from "@/mocks/fixtures/types";
import { createLazyFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";

export const Route = createLazyFileRoute("/load-balancers/services")({
  component: Services,
});

const MANAGED_LABEL = KUBELB_LABELS.ORIGIN_NS;

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
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);

  const namespace = managed
    ? selectedTenant
      ? tenantToNamespace(selectedTenant)
      : undefined
    : (selectedNamespace ?? undefined);
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
      cell: ({ row }) => {
        const name = row.original.metadata.name;
        return (
          <span className="block max-w-xs truncate font-medium font-mono text-sm" title={name}>
            {name}
          </span>
        );
      },
    },
    {
      accessorFn: (row) => row.metadata.namespace,
      id: "namespace",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Namespace" />,
      cell: ({ row }) => {
        const ns = row.original.metadata.namespace ?? "";
        return (
          <span className="block max-w-40 truncate" title={ns}>
            {ns}
          </span>
        );
      },
    },
    ...(managed
      ? [
          {
            accessorFn: (row: GenericResource) => namespaceToTenant(row.metadata.namespace ?? ""),
            id: "tenant",
            meta: { hideBelow: "md" },
            header: ({
              column,
            }: {
              column: import("@tanstack/react-table").Column<GenericResource>;
            }) => <DataTableColumnHeader column={column} title="Tenant" />,
          } satisfies ColumnDef<GenericResource>,
        ]
      : [
          {
            id: "managed",
            meta: { hideBelow: "md" },
            header: ({
              column,
            }: {
              column: import("@tanstack/react-table").Column<GenericResource>;
            }) => <DataTableColumnHeader column={column} title="Managed" />,
            cell: ({ row }) => {
              const labels = row.original.metadata.labels ?? {};
              const isManaged = !!labels[KUBELB_LABELS.ORIGIN_NS];
              if (!isManaged) return <Badge variant="outline">External</Badge>;
              return <Badge className="bg-success/10 text-success">Managed</Badge>;
            },
          } satisfies ColumnDef<GenericResource>,
        ]),
    {
      accessorFn: getServiceType,
      id: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    },
    {
      accessorFn: getClusterIP,
      id: "clusterIP",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cluster IP" />,
      cell: ({ row }) => {
        const ip = getClusterIP(row.original);
        return (
          <span className="block max-w-40 truncate font-mono text-xs" title={ip}>
            {ip}
          </span>
        );
      },
    },
    {
      accessorFn: getServicePorts,
      id: "ports",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ports" />,
      cell: ({ row }) => {
        const ports = getServicePorts(row.original);
        return (
          <span className="block max-w-40 truncate font-mono text-xs" title={ports}>
            {ports}
          </span>
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
      from: "/load-balancers/services",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/load-balancers"
          search={{ search: "", page: 0, pageSize: 10 }}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Load Balancers
        </Link>
        <h1 className="font-condensed text-2xl font-bold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View Kubernetes services across tenants.
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
            managed
              ? selectedTenant
                ? `No services available for tenant ${selectedTenant}`
                : "No services found."
              : selectedNamespace
                ? `No services available in namespace ${selectedNamespace}`
                : "No services found."
          }
          searchColumn="name"
          searchPlaceholder="Search services..."
          onRefresh={() => void refetch()}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          toolbarLeading={
            <>
              <ManagedToggle checked={managed} onCheckedChange={setManaged} />
              {managed ? <TenantSelector /> : <NamespaceSelector />}
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

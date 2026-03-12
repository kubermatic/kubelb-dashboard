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
import { FileText, Shield } from "lucide-react";
import { useDeployments } from "@/hooks/use-deployments";
import type { Deployment } from "@/types/kubernetes";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { EmptyState } from "@/components/common/empty-state";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { QueryError } from "@/components/common/query-error";
import { StatusBadge } from "@/components/common/status-badge";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { formatAge, tenantToNamespace } from "@/lib/format";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import { useUIStore } from "@/stores/ui";

export const Route = createFileRoute("/envoy-proxy/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: EnvoyProxy,
});

function getDeploymentStatus(deployment: Deployment) {
  const available = deployment.status?.conditions?.find((c) => c.type === "Available");
  if (available?.status === "True") return { label: "Available", status: "True" as const };

  const progressing = deployment.status?.conditions?.find((c) => c.type === "Progressing");
  if (progressing?.status === "True") return { label: "Progressing", status: "Unknown" as const };

  return { label: "Unavailable", status: "False" as const };
}

function EnvoyProxy() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isError, error, refetch } = useDeployments(
    namespace,
    "app.kubernetes.io/name=kubelb-envoy-proxy",
  );
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/envoy-proxy/" });
  const items = data?.items ?? [];
  const [yamlResource, setYamlResource] = useState<Deployment | null>(null);

  const columns: ColumnDef<Deployment>[] = [
    {
      accessorFn: (row) => row.metadata.name,
      id: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <Link
          to="/envoy-proxy/$namespace/$name"
          params={{
            namespace: row.original.metadata.namespace ?? "default",
            name: row.original.metadata.name,
          }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.metadata.name}
        </Link>
      ),
    },
    {
      accessorFn: (row) => row.metadata.namespace,
      id: "namespace",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Namespace" />,
    },
    {
      id: "replicas",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Replicas" />,
      cell: ({ row }) => {
        const ready = row.original.status?.readyReplicas ?? 0;
        const desired = row.original.spec.replicas ?? 0;
        return `${ready}/${desired}`;
      },
    },
    {
      id: "available",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Available" />,
      cell: ({ row }) => row.original.status?.availableReplicas ?? 0,
    },
    {
      id: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const { label, status } = getDeploymentStatus(row.original);
        return <StatusBadge label={label} status={status} />;
      },
    },
    {
      accessorFn: (row) => row.metadata.creationTimestamp,
      id: "age",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
      cell: ({ row }) => {
        const ts = row.original.metadata.creationTimestamp;
        return ts ? formatAge(ts) : "\u2014";
      },
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
            ]}
          />
        </div>
      ),
    },
  ];

  const updateSearch = (params: Partial<ListSearchParams>) =>
    void navigate({
      from: "/envoy-proxy/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Envoy Proxy</h1>
        <p className="mt-1 text-muted-foreground">Inspect and configure Envoy proxy instances.</p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState icon={Shield} title="No envoy proxies found" />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Filter by name..."
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
              to: "/envoy-proxy/$namespace/$name",
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
            ? `Deployment: ${yamlResource.metadata.namespace}/${yamlResource.metadata.name}`
            : undefined
        }
      />
    </div>
  );
}

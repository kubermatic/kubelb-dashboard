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

import {
  createFileRoute,
  Link,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound } from "lucide-react";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { EmptyState } from "@/components/common/empty-state";
import { TenantSelector } from "@/components/common/tenant-selector";
import { QueryError } from "@/components/common/query-error";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import { useUIStore } from "@/stores/ui";
import { formatAge, tenantToNamespace } from "@/lib/format";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import type { SyncSecret } from "@/types/kubelb";

export const Route = createFileRoute("/sync-secrets/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: SyncSecrets,
});

function getSourceSecret(s: SyncSecret): string {
  const annotations = s.metadata.annotations;
  if (!annotations) return "\u2014";
  const ns = annotations["kubelb.k8c.io/origin-namespace"] ?? "";
  const name = annotations["kubelb.k8c.io/origin-name"] ?? "";
  if (ns && name) return `${ns}/${name}`;
  if (name) return name;
  return "\u2014";
}

const columns: ColumnDef<SyncSecret>[] = [
  {
    accessorFn: (row) => row.metadata.name,
    id: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const { name, namespace } = row.original.metadata;
      return (
        <Link
          to="/sync-secrets/$namespace/$name"
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
    id: "sourceSecret",
    accessorFn: getSourceSecret,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source Secret" />,
    cell: ({ row }) => <span className="font-mono text-xs">{getSourceSecret(row.original)}</span>,
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
];

function SyncSecrets() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isError, error, refetch } = useSyncSecrets(namespace);
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/sync-secrets/" });
  const items = data?.items ?? [];

  const updateSearch = (params: Partial<ListSearchParams>) =>
    void navigate({
      from: "/sync-secrets/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sync Secrets</h1>
        <p className="mt-1 text-sm text-muted-foreground">View synced secrets across tenants.</p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState icon={KeyRound} title="No sync secrets found" />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search sync secrets..."
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
              to: "/sync-secrets/$namespace/$name",
              params: { namespace: namespace ?? "default", name },
            });
          }}
        />
      )}
    </div>
  );
}

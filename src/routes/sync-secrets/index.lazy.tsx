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

import { useCallback, useState } from "react";
import { createLazyFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import yaml from "js-yaml";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { PageHeader } from "@/components/common/page-header";
import { BulkDeleteDialog } from "@/components/common/bulk-delete-dialog";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { TenantSelector } from "@/components/common/tenant-selector";
import { QueryError } from "@/components/common/query-error";
import { YamlEditorDialog } from "@/components/common/yaml-editor-dialog";
import { RowActions } from "@/components/common/row-actions";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Button } from "@/components/ui/button";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import {
  useCreateSyncSecret,
  useUpdateSyncSecret,
  useDeleteSyncSecret,
} from "@/hooks/use-sync-secret-mutations";
import { useUIStore } from "@/stores/ui";
import { AgeCell } from "@/components/common/age-cell";
import { MonoCell } from "@/components/common/mono-cell";
import { StatusBadge } from "@/components/common/status-badge";
import { getSyncSecretHealthStatus, healthToConditionStatus } from "@/lib/status-mapper";
import { getOriginSource, namespaceToTenant, tenantToNamespace } from "@/lib/format";
import type { ListSearchParams } from "@/lib/search-params";
import type { SyncSecret } from "@/types/kubelb";

const RESOURCE_KIND = "SyncSecret";
const API_VERSION = "kubelb.k8c.io/v1alpha1";

const CREATE_TEMPLATE = `apiVersion: kubelb.k8c.io/v1alpha1
kind: SyncSecret
metadata:
  name: ""
  namespace: ""
type: Opaque
data: {}
`;

export const Route = createLazyFileRoute("/sync-secrets/")({
  component: SyncSecrets,
});

function SyncSecrets() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } =
    useSyncSecrets(namespace);
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/sync-secrets/" });
  const items = data?.items ?? [];

  const createSyncSecret = useCreateSyncSecret();
  const updateSyncSecret = useUpdateSyncSecret();
  const deleteSyncSecret = useDeleteSyncSecret();

  const [createOpen, setCreateOpen] = useState(false);
  const [yamlViewerResource, setYamlViewerResource] = useState<SyncSecret | null>(null);
  const [editResource, setEditResource] = useState<SyncSecret | null>(null);
  const [deleteResource, setDeleteResource] = useState<SyncSecret | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<SyncSecret[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = useCallback(() => {
    setIsBulkDeleting(true);
    void Promise.all(
      bulkDeleteItems.map((s) =>
        deleteSyncSecret.mutateAsync({
          namespace: s.metadata.namespace ?? "",
          name: s.metadata.name,
        }),
      ),
    )
      .then(() => setBulkDeleteItems([]))
      .finally(() => setIsBulkDeleting(false));
  }, [bulkDeleteItems, deleteSyncSecret]);

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
      accessorFn: (row) => namespaceToTenant(row.metadata.namespace ?? ""),
      id: "tenant",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
    },
    {
      id: "source",
      meta: { hideBelow: "md" },
      accessorFn: (row) => getOriginSource(row.metadata.labels),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => {
        const source = getOriginSource(row.original.metadata.labels);
        return <MonoCell value={source} />;
      },
    },
    {
      id: "status",
      accessorFn: (row) => getSyncSecretHealthStatus(row).state,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const { state } = getSyncSecretHealthStatus(row.original);
        return <StatusBadge label={state} status={healthToConditionStatus(state)} />;
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
            {
              label: "View YAML",
              icon: FileText,
              onClick: () => setYamlViewerResource(row.original),
            },
            {
              label: "Edit",
              icon: Pencil,
              onClick: () => setEditResource(row.original),
            },
            {
              label: "Delete",
              icon: Trash2,
              variant: "destructive" as const,
              separator: true,
              onClick: () => setDeleteResource(row.original),
            },
          ]}
        />
      ),
    },
  ];

  const updateSearch = (params: Partial<ListSearchParams>) =>
    void navigate({
      from: "/sync-secrets/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <PageHeader title="Sync Secrets" description="View synced secrets across tenants." />
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage={
            selectedTenant
              ? `No sync secrets available for tenant ${selectedTenant}`
              : "No sync secrets found."
          }
          searchColumn="name"
          searchPlaceholder="Search sync secrets..."
          toolbarLeading={
            <>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus />
                Create Sync Secret
              </Button>
              <TenantSelector />
            </>
          }
          initialSearch={search}
          initialPage={page}
          initialPageSize={pageSize}
          onSearchChange={(v) => updateSearch({ search: v, page: 0 })}
          onPageChange={(p) => updateSearch({ page: p })}
          onPageSizeChange={(s) => updateSearch({ pageSize: s, page: 0 })}
          onRefresh={() => void refetch()}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          onRowClick={(row) => {
            const { name, namespace } = row.original.metadata;
            void navigate({
              to: "/sync-secrets/$namespace/$name",
              params: { namespace: namespace ?? "default", name },
            });
          }}
          enableRowSelection
          onDeleteSelected={setBulkDeleteItems}
          isDeletePending={isBulkDeleting}
        />
      )}

      <YamlEditorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        title="Create Sync Secret"
        resourceKind={RESOURCE_KIND}
        apiVersion={API_VERSION}
        initialYaml={CREATE_TEMPLATE}
        isPending={createSyncSecret.isPending}
        onSubmit={(parsed) => {
          void createSyncSecret.mutateAsync(parsed as SyncSecret).then(() => setCreateOpen(false));
        }}
      />

      <YamlViewer
        open={!!yamlViewerResource}
        onOpenChange={(open) => !open && setYamlViewerResource(null)}
        resource={yamlViewerResource}
        title={yamlViewerResource ? `SyncSecret: ${yamlViewerResource.metadata.name}` : undefined}
      />

      {editResource && (
        <YamlEditorDialog
          open={!!editResource}
          onOpenChange={(open) => !open && setEditResource(null)}
          mode="edit"
          title={`Edit Sync Secret: ${editResource.metadata.name}`}
          resourceKind={RESOURCE_KIND}
          apiVersion={API_VERSION}
          initialYaml={yaml.dump(sanitizeForEdit(editResource), { noRefs: true, lineWidth: -1 })}
          lockedFields={{ name: true, namespace: true }}
          isPending={updateSyncSecret.isPending}
          onSubmit={(parsed) => {
            void updateSyncSecret
              .mutateAsync(parsed as SyncSecret)
              .then(() => setEditResource(null));
          }}
        />
      )}

      {deleteResource && (
        <DeleteDialog
          open={!!deleteResource}
          onOpenChange={(open) => !open && setDeleteResource(null)}
          resourceName={deleteResource.metadata.name}
          resourceKind={RESOURCE_KIND}
          isPending={deleteSyncSecret.isPending}
          onConfirm={() => {
            void deleteSyncSecret
              .mutateAsync({
                namespace: deleteResource.metadata.namespace ?? "",
                name: deleteResource.metadata.name,
              })
              .then(() => setDeleteResource(null));
          }}
        />
      )}

      <BulkDeleteDialog
        open={bulkDeleteItems.length > 0}
        onOpenChange={(open) => !open && setBulkDeleteItems([])}
        count={bulkDeleteItems.length}
        resourceKind={RESOURCE_KIND}
        isPending={isBulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}

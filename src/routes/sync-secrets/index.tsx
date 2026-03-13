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
import {
  createFileRoute,
  Link,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { EDITING_ENABLED } from "@/lib/feature-flags";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { TenantSelector } from "@/components/common/tenant-selector";
import { QueryError } from "@/components/common/query-error";
import { ResourceFormDialog } from "@/components/common/resource-form-dialog";
import { RowActions } from "@/components/common/row-actions";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Button } from "@/components/ui/button";
import { useCRDSchema } from "@/hooks/use-crd-schema";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import {
  useCreateSyncSecret,
  useUpdateSyncSecret,
  useDeleteSyncSecret,
} from "@/hooks/use-sync-secret-mutations";
import { useUIStore } from "@/stores/ui";
import { AgeCell } from "@/components/common/age-cell";
import { getOriginSource, namespaceToTenant, tenantToNamespace } from "@/lib/format";
import { buildUiSchema } from "@/lib/kube-ui-schema";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import type { SyncSecret } from "@/types/kubelb";

const RESOURCE_KIND = "SyncSecret";
const API_VERSION = "kubelb.k8c.io/v1alpha1";
const CRD_NAME = "syncsecrets.kubelb.k8c.io";

const SYNCSECRET_TEMPLATE = {
  apiVersion: API_VERSION,
  kind: RESOURCE_KIND,
  metadata: { name: "", namespace: "" },
  spec: {},
};

export const Route = createFileRoute("/sync-secrets/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
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

  const { data: crdSchema, isLoading: isSchemaLoading } = useCRDSchema(CRD_NAME, "v1alpha1");
  const createSyncSecret = useCreateSyncSecret();
  const updateSyncSecret = useUpdateSyncSecret();
  const deleteSyncSecret = useDeleteSyncSecret();

  const createUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "create"), []);
  const editUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "edit"), []);

  const [createOpen, setCreateOpen] = useState(false);
  const [yamlViewerResource, setYamlViewerResource] = useState<SyncSecret | null>(null);
  const [editResource, setEditResource] = useState<SyncSecret | null>(null);
  const [deleteResource, setDeleteResource] = useState<SyncSecret | null>(null);

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
      accessorFn: (row) => getOriginSource(row.metadata.labels),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{getOriginSource(row.original.metadata.labels)}</span>
      ),
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
            ...(EDITING_ENABLED
              ? [
                  {
                    label: "Edit",
                    icon: Pencil,
                    onClick: () => setEditResource(row.original),
                  },
                ]
              : []),
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
          toolbarLeading={
            <>
              <TenantSelector />
              {EDITING_ENABLED && (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Create
                </Button>
              )}
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
        />
      )}

      {EDITING_ENABLED && (
        <ResourceFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          title="Create Sync Secret"
          schema={crdSchema}
          isSchemaLoading={isSchemaLoading}
          uiSchema={createUiSchema}
          formData={SYNCSECRET_TEMPLATE}
          isPending={createSyncSecret.isPending}
          onSubmit={(parsed) => {
            void createSyncSecret
              .mutateAsync(parsed as SyncSecret)
              .then(() => setCreateOpen(false));
          }}
        />
      )}

      <YamlViewer
        open={!!yamlViewerResource}
        onOpenChange={(open) => !open && setYamlViewerResource(null)}
        resource={yamlViewerResource}
        title={yamlViewerResource ? `SyncSecret: ${yamlViewerResource.metadata.name}` : undefined}
      />

      {EDITING_ENABLED && (
        <ResourceFormDialog
          open={!!editResource}
          onOpenChange={(open) => !open && setEditResource(null)}
          mode="edit"
          title={
            editResource ? `Edit Sync Secret: ${editResource.metadata.name}` : "Edit Sync Secret"
          }
          schema={crdSchema}
          isSchemaLoading={isSchemaLoading}
          uiSchema={editUiSchema}
          formData={
            editResource ? (sanitizeForEdit(editResource) as Record<string, unknown>) : undefined
          }
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
    </div>
  );
}

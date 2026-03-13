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

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  createFileRoute,
  Link,
  stripSearchParams,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { ArrowUpDown, Download, FileText, Pencil, Plus, Trash2, Users } from "lucide-react";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { EDITING_ENABLED } from "@/lib/feature-flags";

import { BulkDeleteDialog } from "@/components/common/bulk-delete-dialog";
import { DataTable } from "@/components/common/data-table";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { ResourceFormDialog } from "@/components/common/resource-form-dialog";
import { RowActions, type RowAction } from "@/components/common/row-actions";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCRDSchema } from "@/hooks/use-crd-schema";
import { useTenants } from "@/hooks/use-tenants";
import { useCreateTenant, useDeleteTenant, useUpdateTenant } from "@/hooks/use-tenant-mutations";
import { downloadKubeconfig } from "@/lib/download-kubeconfig";
import { AgeCell } from "@/components/common/age-cell";
import { buildUiSchema } from "@/lib/kube-ui-schema";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import type { Tenant } from "@/types/kubelb";

const RESOURCE_KIND = "Tenant";
const API_VERSION = "kubelb.k8c.io/v1alpha1";

const CRD_NAME = "tenants.kubelb.k8c.io";

const TENANT_TEMPLATE = {
  apiVersion: API_VERSION,
  kind: RESOURCE_KIND,
  metadata: { name: "" },
  spec: {},
};

export const Route = createFileRoute("/tenants/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: Tenants,
});

function FeatureBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      className={enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}
      variant="outline"
    >
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}

function Tenants() {
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } = useTenants();
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/tenants/" });
  const items = data?.items ?? [];

  const { data: crdSchema, isLoading: isSchemaLoading } = useCRDSchema(CRD_NAME, "v1alpha1");
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const createUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "create"), []);
  const editUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "edit"), []);

  const [createOpen, setCreateOpen] = useState(false);
  const [yamlViewerResource, setYamlViewerResource] = useState<Tenant | null>(null);
  const [editResource, setEditResource] = useState<Tenant | null>(null);
  const [deleteResource, setDeleteResource] = useState<Tenant | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<Tenant[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = useCallback(() => {
    setIsBulkDeleting(true);
    void Promise.all(bulkDeleteItems.map((t) => deleteTenant.mutateAsync(t.metadata.name)))
      .then(() => setBulkDeleteItems([]))
      .finally(() => setIsBulkDeleting(false));
  }, [bulkDeleteItems, deleteTenant]);

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "metadata.name",
      id: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          to="/tenants/$name"
          params={{ name: row.original.metadata.name }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.metadata.name}
        </Link>
      ),
    },
    {
      id: "l4",
      header: "Layer 4",
      cell: ({ row }) => <FeatureBadge enabled={!row.original.spec.loadBalancer?.disable} />,
    },
    {
      id: "ingress",
      header: "Ingress",
      cell: ({ row }) => <FeatureBadge enabled={!row.original.spec.ingress?.disable} />,
    },
    {
      id: "gateway",
      header: "Gateway API",
      cell: ({ row }) => <FeatureBadge enabled={!row.original.spec.gatewayAPI?.disable} />,
    },
    {
      id: "dnsDomain",
      meta: { hideBelow: "md" },
      header: "DNS Domain",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.spec.dns?.wildcardDomain ?? "\u2014"}</span>
      ),
    },
    {
      accessorKey: "metadata.creationTimestamp",
      id: "age",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Age
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => <AgeCell timestamp={row.original.metadata.creationTimestamp} />,
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions
          actions={
            [
              {
                label: "View YAML",
                icon: FileText,
                onClick: () => setYamlViewerResource(row.original),
              },
              {
                label: "Download Kubeconfig",
                icon: Download,
                onClick: () => void downloadKubeconfig(row.original.metadata.name),
              },
              EDITING_ENABLED && {
                label: "Edit",
                icon: Pencil,
                onClick: () => setEditResource(row.original),
              },
              {
                label: "Delete",
                icon: Trash2,
                variant: "destructive",
                separator: true,
                onClick: () => setDeleteResource(row.original),
              },
            ].filter(Boolean) as RowAction[]
          }
        />
      ),
    },
  ];

  const updateSearch = (params: Partial<ListSearchParams>) =>
    void navigate({
      from: "/tenants/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <p className="mt-1 text-muted-foreground">
          Manage tenant namespaces and their resource allocations.
        </p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants found"
          description="Get started by creating your first tenant."
          action={
            EDITING_ENABLED ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create Tenant
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Filter tenants..."
          toolbarLeading={
            EDITING_ENABLED ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create Tenant
              </Button>
            ) : undefined
          }
          onRefresh={() => void refetch()}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          initialSearch={search}
          initialPage={page}
          initialPageSize={pageSize}
          onSearchChange={(v) => updateSearch({ search: v, page: 0 })}
          onPageChange={(p) => updateSearch({ page: p })}
          onPageSizeChange={(s) => updateSearch({ pageSize: s, page: 0 })}
          onRowClick={(row) => {
            void navigate({
              to: "/tenants/$name",
              params: { name: row.original.metadata.name },
            });
          }}
          enableRowSelection={EDITING_ENABLED}
          onDeleteSelected={setBulkDeleteItems}
          isDeletePending={isBulkDeleting}
        />
      )}

      {EDITING_ENABLED && (
        <ResourceFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          title="Create Tenant"
          schema={crdSchema}
          isSchemaLoading={isSchemaLoading}
          uiSchema={createUiSchema}
          formData={TENANT_TEMPLATE}
          isPending={createTenant.isPending}
          onSubmit={(parsed) => {
            void createTenant.mutateAsync(parsed as Tenant).then(() => setCreateOpen(false));
          }}
        />
      )}

      <YamlViewer
        open={!!yamlViewerResource}
        onOpenChange={(open) => !open && setYamlViewerResource(null)}
        resource={yamlViewerResource}
        title={yamlViewerResource ? `Tenant: ${yamlViewerResource.metadata.name}` : undefined}
      />

      {EDITING_ENABLED && (
        <ResourceFormDialog
          open={!!editResource}
          onOpenChange={(open) => !open && setEditResource(null)}
          mode="edit"
          title={editResource ? `Edit Tenant: ${editResource.metadata.name}` : "Edit Tenant"}
          schema={crdSchema}
          isSchemaLoading={isSchemaLoading}
          uiSchema={editUiSchema}
          formData={
            editResource ? (sanitizeForEdit(editResource) as Record<string, unknown>) : undefined
          }
          isPending={updateTenant.isPending}
          onSubmit={(parsed) => {
            void updateTenant.mutateAsync(parsed as Tenant).then(() => setEditResource(null));
          }}
        />
      )}

      {deleteResource && (
        <DeleteDialog
          open={!!deleteResource}
          onOpenChange={(open) => !open && setDeleteResource(null)}
          resourceName={deleteResource.metadata.name}
          resourceKind={RESOURCE_KIND}
          isPending={deleteTenant.isPending}
          onConfirm={() => {
            void deleteTenant
              .mutateAsync(deleteResource.metadata.name)
              .then(() => setDeleteResource(null));
          }}
        >
          <p className="text-sm text-muted-foreground">
            This will permanently delete namespace{" "}
            <strong>tenant-{deleteResource.metadata.name}</strong> and all associated resources
            including load balancers, routes, and secrets.
          </p>
        </DeleteDialog>
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

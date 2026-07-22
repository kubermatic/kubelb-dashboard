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
import { createLazyFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Download, FileText, Pencil, Plus, Trash2, Users } from "lucide-react";
import * as yaml from "js-yaml";
import { sanitizeForEdit } from "@/lib/kube-sanitize";

import { PageHeader } from "@/components/common/page-header";
import { BulkDeleteDialog } from "@/components/common/bulk-delete-dialog";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { RowActions } from "@/components/common/row-actions";
import { StatusBadge } from "@/components/common/status-badge";
import { TenantFormDialog } from "@/components/common/tenant-form-dialog";
import { TenantResourceCounts } from "@/components/common/tenant-resource-counts";
import { YamlEditorDialog } from "@/components/common/yaml-editor-dialog";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { AgeCell } from "@/components/common/age-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEdition } from "@/hooks/use-edition";
import { useReadOnly } from "@/hooks/use-read-only";
import { useNamespaces } from "@/hooks/use-namespaces";
import { useTenants } from "@/hooks/use-tenants";
import { useCreateTenant, useDeleteTenant, useUpdateTenant } from "@/hooks/use-tenant-mutations";
import { downloadKubeconfig } from "@/lib/download-kubeconfig";
import { tenantToNamespace } from "@/lib/format";
import type { ListSearchParams } from "@/lib/search-params";
import { booleanStyles } from "@/lib/status-styles";
import type { Tenant } from "@/types/kubelb";

const RESOURCE_KIND = "Tenant";

export const Route = createLazyFileRoute("/tenants/")({
  component: Tenants,
});

function FeatureBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge className={enabled ? booleanStyles.enabled : booleanStyles.disabled} variant="outline">
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}

function Tenants() {
  const { isEE } = useEdition();
  const readOnly = useReadOnly();
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } = useTenants();
  const { data: namespacesData } = useNamespaces();
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/tenants/" });
  const items = data?.items ?? [];

  const namespaceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ns of namespacesData?.items ?? []) {
      map.set(ns.metadata.name, ns.status?.phase ?? "Unknown");
    }
    return map;
  }, [namespacesData]);

  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
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
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const tenant = row.original;
        if (tenant.metadata.deletionTimestamp) {
          return <StatusBadge label="Terminating" status="False" />;
        }
        const nsName = tenantToNamespace(tenant.metadata.name);
        const phase = namespaceMap.get(nsName);
        if (!phase) return <StatusBadge label="Provisioning" status="Unknown" />;
        if (phase === "Active") return <StatusBadge label="Active" status="True" />;
        if (phase === "Terminating") return <StatusBadge label="Terminating" status="False" />;
        return <StatusBadge label={phase} status="Unknown" />;
      },
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
    ...(isEE
      ? [
          {
            id: "lbLimit",
            meta: { hideBelow: "lg" as const },
            header: "LB Limit",
            cell: ({ row }: { row: { original: Tenant } }) => {
              const limit = row.original.spec.loadBalancer?.limit;
              return <span className="text-sm">{limit ?? "\u221E"}</span>;
            },
          },
          {
            id: "gwLimit",
            meta: { hideBelow: "lg" as const },
            header: "GW Limit",
            cell: ({ row }: { row: { original: Tenant } }) => {
              const limit = row.original.spec.gatewayAPI?.gatewaySettings?.limit;
              return <span className="text-sm">{limit ?? "\u221E"}</span>;
            },
          },
          {
            id: "tunnel",
            meta: { hideBelow: "lg" as const },
            header: "Tunnel",
            cell: ({ row }: { row: { original: Tenant } }) => (
              <FeatureBadge enabled={!row.original.spec.tunnel?.disable} />
            ),
          },
          {
            id: "allowedDomains",
            meta: { hideBelow: "lg" as const },
            header: "Allowed Domains",
            cell: ({ row }: { row: { original: Tenant } }) => {
              const count = row.original.spec.allowedDomains?.length;
              return <span className="text-sm">{count ? String(count) : "\u2014"}</span>;
            },
          },
        ]
      : []),
    {
      accessorKey: "metadata.creationTimestamp",
      id: "age",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
      cell: ({ row }) => <AgeCell timestamp={row.original.metadata.creationTimestamp} />,
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
              label: "Download Kubeconfig",
              icon: Download,
              onClick: () => void downloadKubeconfig(row.original.metadata.name),
            },
            {
              label: "Edit",
              icon: Pencil,
              mutating: true,
              onClick: () => setEditResource(row.original),
            },
            {
              label: "Delete",
              icon: Trash2,
              variant: "destructive",
              separator: true,
              mutating: true,
              onClick: () => setDeleteResource(row.original),
            },
          ]}
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
      <PageHeader
        title="Tenants"
        description="Manage tenant namespaces and their resource allocations."
      />
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants found"
          description="Get started by creating your first tenant."
          action={
            readOnly ? undefined : (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create Tenant
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search tenants..."
          toolbarLeading={
            readOnly ? undefined : (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create Tenant
              </Button>
            )
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
          enableRowSelection={!readOnly}
          onDeleteSelected={readOnly ? undefined : setBulkDeleteItems}
          isDeletePending={isBulkDeleting}
        />
      )}

      <TenantFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isPending={createTenant.isPending}
        isEE={isEE}
        onSubmit={(tenant) => {
          void createTenant.mutateAsync(tenant).then(() => setCreateOpen(false));
        }}
      />

      <YamlViewer
        open={!!yamlViewerResource}
        onOpenChange={(open) => !open && setYamlViewerResource(null)}
        resource={yamlViewerResource}
        title={yamlViewerResource ? `Tenant: ${yamlViewerResource.metadata.name}` : undefined}
      />

      {editResource && (
        <YamlEditorDialog
          open={!!editResource}
          onOpenChange={(open) => !open && setEditResource(null)}
          mode="edit"
          title={`Edit Tenant: ${editResource.metadata.name}`}
          resourceKind={RESOURCE_KIND}
          apiVersion="kubelb.k8c.io/v1alpha1"
          initialYaml={yaml.dump(sanitizeForEdit(editResource), { noRefs: true, lineWidth: -1 })}
          lockedFields={{ name: true }}
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
            <strong>tenant-{deleteResource.metadata.name}</strong> and all associated resources.
          </p>
          <TenantResourceCounts tenantName={deleteResource.metadata.name} />
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

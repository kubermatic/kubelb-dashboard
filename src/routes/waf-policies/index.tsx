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
import { ArrowUpDown, FileText, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { sanitizeForEdit } from "@/lib/kube-sanitize";

import { BulkDeleteDialog } from "@/components/common/bulk-delete-dialog";
import { DataTable } from "@/components/common/data-table";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { ResourceFormDialog } from "@/components/common/resource-form-dialog";
import { RowActions } from "@/components/common/row-actions";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCRDSchema } from "@/hooks/use-crd-schema";
import { useWAFPolicies } from "@/hooks/use-waf-policies";
import {
  useCreateWAFPolicy,
  useDeleteWAFPolicy,
  useUpdateWAFPolicy,
} from "@/hooks/use-waf-policy-mutations";
import { AgeCell } from "@/components/common/age-cell";
import { buildUiSchema } from "@/lib/kube-ui-schema";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import type { WAFPolicy } from "@/types/kubelb";

const RESOURCE_KIND = "WAFPolicy";
const API_VERSION = "kubelb.k8c.io/v1alpha1";

const CRD_NAME = "wafpolicies.kubelb.k8c.io";

const WAF_POLICY_TEMPLATE = {
  apiVersion: API_VERSION,
  kind: RESOURCE_KIND,
  metadata: { name: "" },
  spec: {},
};

export const Route = createFileRoute("/waf-policies/")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: WAFPolicies,
});

function targetDisplay(spec: WAFPolicy["spec"]): string {
  if (spec.global) return "Global";
  if (spec.targetRef) return spec.targetRef.name;
  if (spec.targetSelector) return "Selector";
  return "\u2014";
}

function validConditionBadge(policy: WAFPolicy) {
  const condition = policy.status?.conditions?.find((c) => c.type === "Valid");
  if (!condition) return <span className="text-sm text-muted-foreground">{"\u2014"}</span>;

  const colorMap = {
    True: "bg-success/10 text-success",
    False: "bg-destructive/10 text-destructive",
    Unknown: "bg-warning/10 text-warning",
  } as const;

  return (
    <Badge className={colorMap[condition.status]} variant="outline">
      {condition.status}
    </Badge>
  );
}

function WAFPolicies() {
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } =
    useWAFPolicies();
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/waf-policies/" });
  const items = data?.items ?? [];

  const { data: crdSchema, isLoading: isSchemaLoading } = useCRDSchema(CRD_NAME, "v1alpha1");
  const createWAFPolicy = useCreateWAFPolicy();
  const updateWAFPolicy = useUpdateWAFPolicy();
  const deleteWAFPolicy = useDeleteWAFPolicy();

  const createUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "create"), []);
  const editUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "edit"), []);

  const [createOpen, setCreateOpen] = useState(false);
  const [yamlViewerResource, setYamlViewerResource] = useState<WAFPolicy | null>(null);
  const [editResource, setEditResource] = useState<WAFPolicy | null>(null);
  const [deleteResource, setDeleteResource] = useState<WAFPolicy | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<WAFPolicy[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = useCallback(() => {
    setIsBulkDeleting(true);
    void Promise.all(bulkDeleteItems.map((p) => deleteWAFPolicy.mutateAsync(p.metadata.name)))
      .then(() => setBulkDeleteItems([]))
      .finally(() => setIsBulkDeleting(false));
  }, [bulkDeleteItems, deleteWAFPolicy]);

  const columns: ColumnDef<WAFPolicy>[] = [
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
          to="/waf-policies/$name"
          params={{ name: row.original.metadata.name }}
          className="font-medium text-primary hover:underline"
        >
          {row.original.metadata.name}
        </Link>
      ),
    },
    {
      id: "target",
      header: "Target",
      cell: ({ row }) => <span className="text-sm">{targetDisplay(row.original.spec)}</span>,
    },
    {
      id: "failureMode",
      meta: { hideBelow: "md" },
      header: "Failure Mode",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.spec.failureMode ?? "Closed"}</Badge>
      ),
    },
    {
      id: "valid",
      header: "Valid",
      cell: ({ row }) => validConditionBadge(row.original),
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
              variant: "destructive",
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
      from: "/waf-policies/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">WAF Policies</h1>
        <p className="mt-1 text-muted-foreground">Manage Web Application Firewall policies.</p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No WAF policies found"
          description="Get started by creating your first WAF policy."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create WAF Policy
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Filter WAF policies..."
          toolbarLeading={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create WAF Policy
            </Button>
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
            void navigate({
              to: "/waf-policies/$name",
              params: { name: row.original.metadata.name },
            });
          }}
          enableRowSelection
          onDeleteSelected={setBulkDeleteItems}
          isDeletePending={isBulkDeleting}
        />
      )}

      <ResourceFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        title="Create WAF Policy"
        schema={crdSchema}
        isSchemaLoading={isSchemaLoading}
        uiSchema={createUiSchema}
        formData={WAF_POLICY_TEMPLATE}
        isPending={createWAFPolicy.isPending}
        onSubmit={(parsed) => {
          void createWAFPolicy.mutateAsync(parsed as WAFPolicy).then(() => setCreateOpen(false));
        }}
      />

      <YamlViewer
        open={!!yamlViewerResource}
        onOpenChange={(open) => !open && setYamlViewerResource(null)}
        resource={yamlViewerResource}
        title={yamlViewerResource ? `WAF Policy: ${yamlViewerResource.metadata.name}` : undefined}
      />

      <ResourceFormDialog
        open={!!editResource}
        onOpenChange={(open) => !open && setEditResource(null)}
        mode="edit"
        title={editResource ? `Edit WAF Policy: ${editResource.metadata.name}` : "Edit WAF Policy"}
        schema={crdSchema}
        isSchemaLoading={isSchemaLoading}
        uiSchema={editUiSchema}
        formData={
          editResource ? (sanitizeForEdit(editResource) as Record<string, unknown>) : undefined
        }
        isPending={updateWAFPolicy.isPending}
        onSubmit={(parsed) => {
          void updateWAFPolicy.mutateAsync(parsed as WAFPolicy).then(() => setEditResource(null));
        }}
      />

      <BulkDeleteDialog
        open={bulkDeleteItems.length > 0}
        onOpenChange={(open) => !open && setBulkDeleteItems([])}
        count={bulkDeleteItems.length}
        resourceKind={RESOURCE_KIND}
        isPending={isBulkDeleting}
        onConfirm={handleBulkDelete}
      />

      {deleteResource && (
        <DeleteDialog
          open={!!deleteResource}
          onOpenChange={(open) => !open && setDeleteResource(null)}
          resourceName={deleteResource.metadata.name}
          resourceKind={RESOURCE_KIND}
          isPending={deleteWAFPolicy.isPending}
          onConfirm={() => {
            void deleteWAFPolicy
              .mutateAsync(deleteResource.metadata.name)
              .then(() => setDeleteResource(null));
          }}
        />
      )}
    </div>
  );
}

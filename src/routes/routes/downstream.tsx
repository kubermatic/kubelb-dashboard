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
import { createFileRoute, stripSearchParams, useNavigate, useSearch } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { FileText, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgeCell } from "@/components/common/age-cell";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { EmptyState } from "@/components/common/empty-state";
import { ManagedToggle } from "@/components/common/managed-toggle";
import { QueryError } from "@/components/common/query-error";
import { RowActions } from "@/components/common/row-actions";
import { TenantSelector } from "@/components/common/tenant-selector";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { useGateways } from "@/hooks/use-gateways";
import { useHTTPRoutes } from "@/hooks/use-httproutes";
import { useGRPCRoutes } from "@/hooks/use-grpcroutes";
import { useTCPRoutes } from "@/hooks/use-tcproutes";
import { useUDPRoutes } from "@/hooks/use-udproutes";
import { useTLSRoutes } from "@/hooks/use-tlsroutes";
import { useIngresses } from "@/hooks/use-ingresses";
import { useBackendTrafficPolicies } from "@/hooks/use-backend-traffic-policies";
import { useClientTrafficPolicies } from "@/hooks/use-client-traffic-policies";
import { resolveHealthByKind, type HealthState } from "@/lib/status-mapper";
import { namespaceToTenant, tenantToNamespace } from "@/lib/format";
import { type ListSearchParams, listSearchDefaults, validateListSearch } from "@/lib/search-params";
import { useUIStore } from "@/stores/ui";
import type { GenericResource } from "@/mocks/fixtures/types";

export const Route = createFileRoute("/routes/downstream")({
  validateSearch: validateListSearch,
  search: { middlewares: [stripSearchParams(listSearchDefaults)] },
  component: DownstreamResources,
});

const MANAGED_LABEL = "kubelb.k8c.io/managed-by=kubelb";

const KIND_OPTIONS = [
  { value: "", label: "All Kinds" },
  { value: "Gateway", label: "Gateway" },
  { value: "HTTPRoute", label: "HTTPRoute" },
  { value: "GRPCRoute", label: "GRPCRoute" },
  { value: "TCPRoute", label: "TCPRoute" },
  { value: "UDPRoute", label: "UDPRoute" },
  { value: "TLSRoute", label: "TLSRoute" },
  { value: "Ingress", label: "Ingress" },
  { value: "BackendTrafficPolicy", label: "BTP" },
  { value: "ClientTrafficPolicy", label: "CTP" },
];

const statusStyles: Record<HealthState, string> = {
  Ready: "bg-success/10 text-success hover:bg-success/20",
  Degraded: "bg-warning/10 text-warning hover:bg-warning/20",
  Pending: "bg-warning/10 text-warning hover:bg-warning/20",
  Error: "bg-destructive/10 text-destructive hover:bg-destructive/20",
};

function DownstreamResources() {
  const [managedOnly, setManagedOnly] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>("");
  const selectedTenant = useUIStore((s) => s.selectedTenant);

  const namespace = managedOnly && selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const labelSelector = managedOnly ? MANAGED_LABEL : undefined;

  const gatewayQ = useGateways(namespace, labelSelector);
  const httpRouteQ = useHTTPRoutes(namespace, labelSelector);
  const grpcRouteQ = useGRPCRoutes(namespace, labelSelector);
  const tcpRouteQ = useTCPRoutes(namespace, labelSelector);
  const udpRouteQ = useUDPRoutes(namespace, labelSelector);
  const tlsRouteQ = useTLSRoutes(namespace, labelSelector);
  const ingressQ = useIngresses(namespace, labelSelector);
  const btpQ = useBackendTrafficPolicies(namespace, labelSelector);
  const ctpQ = useClientTrafficPolicies(namespace, labelSelector);

  const queries = [
    gatewayQ,
    httpRouteQ,
    grpcRouteQ,
    tcpRouteQ,
    udpRouteQ,
    tlsRouteQ,
    ingressQ,
    btpQ,
    ctpQ,
  ];
  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const error = queries.find((q) => q.isError)?.error;
  const isRefetching = queries.some((q) => q.isRefetching);
  const dataUpdatedAt = Math.max(...queries.map((q) => q.dataUpdatedAt));
  const refetch = () => queries.forEach((q) => void q.refetch());

  const allItems: GenericResource[] = queries.flatMap((q) => q.data?.items ?? []);
  const items = kindFilter ? allItems.filter((r) => r.kind === kindFilter) : allItems;

  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/routes/downstream" });
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
    {
      id: "kind",
      accessorFn: (row) => row.kind,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
      cell: ({ row }) => <Badge variant="outline">{row.original.kind}</Badge>,
    },
    ...(managedOnly
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
      id: "status",
      accessorFn: (row) => resolveHealthByKind(row.kind, row.status ?? {}).state,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const { state, reason } = resolveHealthByKind(row.original.kind, row.original.status ?? {});
        return (
          <Badge className={statusStyles[state]} title={reason}>
            {state}
          </Badge>
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
      from: "/routes/downstream",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Downstream Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View Gateway API and Ingress resources across tenants.
        </p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : !isLoading && items.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title={
            selectedTenant
              ? `No downstream resources in ${selectedTenant}`
              : "No downstream resources found"
          }
          description="Downstream resources will appear here once created."
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search resources..."
          onRefresh={refetch}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          toolbarLeading={
            <>
              <ManagedToggle checked={managedOnly} onCheckedChange={setManagedOnly} />
              {managedOnly && <TenantSelector />}
              <Select value={kindFilter} onValueChange={(v) => setKindFilter(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="All Kinds" />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            ? `${yamlResource.kind}: ${yamlResource.metadata.namespace}/${yamlResource.metadata.name}`
            : undefined
        }
      />
    </div>
  );
}

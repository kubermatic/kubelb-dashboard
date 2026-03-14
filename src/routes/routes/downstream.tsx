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
import { ArrowLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { AgeCell } from "@/components/common/age-cell";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { ManagedToggle } from "@/components/common/managed-toggle";
import { NamespaceSelector } from "@/components/common/namespace-selector";
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
import { resolveHealthByKind } from "@/lib/status-mapper";
import { statusStyles } from "@/lib/status-styles";
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
  { value: "__all__", label: "All Kinds" },
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

function DownstreamResources() {
  const [managedOnly, setManagedOnly] = useState(true);
  const [kindFilter, setKindFilter] = useState<string>("__all__");
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);

  const namespace = managedOnly
    ? selectedTenant
      ? tenantToNamespace(selectedTenant)
      : undefined
    : (selectedNamespace ?? undefined);
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

  const tagKind = (items: GenericResource[], kind: string): GenericResource[] =>
    items.map((item) => (item.kind ? item : { ...item, kind }));

  const allItems = useMemo(
    () => [
      ...tagKind(gatewayQ.data?.items ?? [], "Gateway"),
      ...tagKind(httpRouteQ.data?.items ?? [], "HTTPRoute"),
      ...tagKind(grpcRouteQ.data?.items ?? [], "GRPCRoute"),
      ...tagKind(tcpRouteQ.data?.items ?? [], "TCPRoute"),
      ...tagKind(udpRouteQ.data?.items ?? [], "UDPRoute"),
      ...tagKind(tlsRouteQ.data?.items ?? [], "TLSRoute"),
      ...tagKind(ingressQ.data?.items ?? [], "Ingress"),
      ...tagKind(btpQ.data?.items ?? [], "BackendTrafficPolicy"),
      ...tagKind(ctpQ.data?.items ?? [], "ClientTrafficPolicy"),
    ],

    [
      gatewayQ.data,
      httpRouteQ.data,
      grpcRouteQ.data,
      tcpRouteQ.data,
      udpRouteQ.data,
      tlsRouteQ.data,
      ingressQ.data,
      btpQ.data,
      ctpQ.data,
    ],
  );
  const items =
    kindFilter && kindFilter !== "__all__"
      ? allItems.filter((r) => r.kind === kindFilter)
      : allItems;

  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/routes/downstream" });
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
    {
      id: "kind",
      accessorFn: (row) => row.kind,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
      cell: ({ row }) => <Badge variant="outline">{row.original.kind}</Badge>,
    },
    ...(managedOnly
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
              const isManaged = !!labels["kubelb.k8c.io/managed-by"];
              if (!isManaged) return <Badge variant="outline">External</Badge>;
              return <Badge className="bg-success/10 text-success">Managed</Badge>;
            },
          } satisfies ColumnDef<GenericResource>,
        ]),
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
        <Link
          to="/routes"
          search={{ search: "", page: 0, pageSize: 10 }}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Routes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Downstream Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View Gateway API and Ingress resources across tenants.
        </p>
      </div>
      {isError && error ? (
        <QueryError error={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="No downstream resources found."
          searchColumn="name"
          searchPlaceholder="Search resources..."
          onRefresh={refetch}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          toolbarLeading={
            <>
              <ManagedToggle checked={managedOnly} onCheckedChange={setManagedOnly} />
              {managedOnly ? <TenantSelector /> : <NamespaceSelector />}
              <Select value={kindFilter} onValueChange={(v) => setKindFilter(v ?? "__all__")}>
                <SelectTrigger>
                  <span>
                    {KIND_OPTIONS.find((o) => o.value === kindFilter)?.label ?? "All Kinds"}
                  </span>
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

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

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield } from "lucide-react";
import { useDeployments } from "@/hooks/use-deployments";
import type { Deployment } from "@/types/kubernetes";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { NamespaceSelector } from "@/components/common/namespace-selector";
import { QueryError } from "@/components/common/query-error";
import { StatusBadge } from "@/components/common/status-badge";
import { formatAge } from "@/lib/format";
import { useUIStore } from "@/stores/ui";

export const Route = createFileRoute("/envoy-proxy/")({
  component: EnvoyProxy,
});

function getDeploymentStatus(deployment: Deployment) {
  const available = deployment.status?.conditions?.find((c) => c.type === "Available");
  if (available?.status === "True") return { label: "Available", status: "True" as const };

  const progressing = deployment.status?.conditions?.find((c) => c.type === "Progressing");
  if (progressing?.status === "True") return { label: "Progressing", status: "Unknown" as const };

  return { label: "Unavailable", status: "False" as const };
}

const columns: ColumnDef<Deployment>[] = [
  {
    accessorFn: (row) => row.metadata.name,
    id: "name",
    header: "Name",
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
    header: "Namespace",
  },
  {
    id: "replicas",
    header: "Replicas",
    cell: ({ row }) => {
      const ready = row.original.status?.readyReplicas ?? 0;
      const desired = row.original.spec.replicas ?? 0;
      return `${ready}/${desired}`;
    },
  },
  {
    id: "available",
    header: "Available",
    cell: ({ row }) => row.original.status?.availableReplicas ?? 0,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { label, status } = getDeploymentStatus(row.original);
      return <StatusBadge label={label} status={status} />;
    },
  },
  {
    accessorFn: (row) => row.metadata.creationTimestamp,
    id: "age",
    header: "Age",
    cell: ({ row }) => {
      const ts = row.original.metadata.creationTimestamp;
      return ts ? formatAge(ts) : "\u2014";
    },
  },
];

function EnvoyProxy() {
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);
  const { data, isLoading, isError, error, refetch } = useDeployments(
    selectedNamespace ?? undefined,
    "app.kubernetes.io/name=kubelb-envoy-proxy",
  );
  const navigate = useNavigate();
  const items = data?.items ?? [];

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
          toolbarLeading={<NamespaceSelector />}
          onRowClick={(row) => {
            const { name, namespace } = row.original.metadata;
            void navigate({
              to: "/envoy-proxy/$namespace/$name",
              params: { namespace: namespace ?? "default", name },
            });
          }}
        />
      )}
    </div>
  );
}

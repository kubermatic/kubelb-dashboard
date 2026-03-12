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

import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown } from "lucide-react";

import { DataTable } from "@/components/common/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTenants } from "@/hooks/use-tenants";
import { formatAge } from "@/lib/format";
import type { Tenant } from "@/types/kubelb";

export const Route = createFileRoute("/tenants/")({
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

const columns: ColumnDef<Tenant>[] = [
  {
    accessorKey: "metadata.name",
    id: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
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
    header: "L4",
    cell: ({ row }) => <FeatureBadge enabled={!row.original.spec.loadBalancer?.disable} />,
  },
  {
    id: "ingress",
    header: "Ingress",
    cell: ({ row }) => <FeatureBadge enabled={!row.original.spec.ingress?.disable} />,
  },
  {
    id: "gateway",
    header: "Gateway",
    cell: ({ row }) => <FeatureBadge enabled={!row.original.spec.gatewayAPI?.disable} />,
  },
  {
    id: "dnsDomain",
    header: "DNS Domain",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.spec.dns?.wildcardDomain ?? "—"}</span>
    ),
  },
  {
    accessorKey: "metadata.creationTimestamp",
    id: "age",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Age
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const ts = row.original.metadata.creationTimestamp;
      return <span className="text-sm text-muted-foreground">{ts ? formatAge(ts) : "—"}</span>;
    },
  },
];

function Tenants() {
  const { data, isLoading } = useTenants();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <p className="mt-1 text-muted-foreground">
          Manage tenant namespaces and their resource allocations.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No tenants found."
        searchColumn="name"
        searchPlaceholder="Filter tenants..."
      />
    </div>
  );
}

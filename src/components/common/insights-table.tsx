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

import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "@tanstack/react-router";
import { ClipboardCheck, FileText, Lightbulb } from "lucide-react";

import { AgeCell } from "@/components/common/age-cell";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { InsightTriageDialog } from "@/components/common/insight-triage-dialog";
import { RowActions } from "@/components/common/row-actions";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { useTriageInsight } from "@/hooks/use-insight-mutations";
import {
  CATEGORIES,
  INSIGHT_STATES,
  SEVERITIES,
  insightState,
  insightTenant,
  severityRank,
} from "@/lib/insights";
import { insightStateStyles, severityStyles } from "@/lib/status-styles";
import type { Insight } from "@/types/kubelb";

export function SeverityBadge({ severity }: { severity: Insight["spec"]["severity"] }) {
  return (
    <Badge className={severityStyles[severity]} variant="outline">
      {severity}
    </Badge>
  );
}

export function InsightStateBadge({ insight }: { insight: Insight }) {
  const state = insightState(insight);
  return (
    <Badge className={insightStateStyles[state]} variant="outline">
      {state}
    </Badge>
  );
}

interface InsightsTableProps {
  items: Insight[];
  isLoading?: boolean;
  showTenant?: boolean;
  toolbarLeading?: ReactNode;
  initialSearch?: string;
  initialPage?: number;
  initialPageSize?: number;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  isRefetching?: boolean;
  dataUpdatedAt?: number;
}

export function InsightsTable({
  items,
  isLoading,
  showTenant = true,
  ...tableProps
}: InsightsTableProps) {
  const navigate = useNavigate();
  const triageInsight = useTriageInsight();
  const [triageResource, setTriageResource] = useState<Insight | null>(null);
  const [yamlResource, setYamlResource] = useState<Insight | null>(null);

  const columns = useMemo<ColumnDef<Insight>[]>(() => {
    const cols: ColumnDef<Insight>[] = [
      {
        accessorFn: (row) => row.spec.check,
        id: "check",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Check" />,
        cell: ({ row }) => (
          <Link
            to="/insights/$namespace/$name"
            params={{
              namespace: row.original.metadata.namespace ?? "default",
              name: row.original.metadata.name,
            }}
            className="font-medium text-primary hover:underline"
          >
            <span className="font-mono">{row.original.spec.check}</span>
            <span className="ml-2 hidden text-xs text-muted-foreground lg:inline">
              {row.original.spec.slug}
            </span>
          </Link>
        ),
      },
      {
        accessorFn: (row) => row.spec.severity,
        id: "severity",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Severity" />,
        sortingFn: (a, b) =>
          severityRank(b.original.spec.severity) - severityRank(a.original.spec.severity),
        cell: ({ row }) => <SeverityBadge severity={row.original.spec.severity} />,
      },
      {
        accessorFn: (row) => row.spec.category,
        id: "category",
        meta: { hideBelow: "md" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) => <Badge variant="outline">{row.original.spec.category}</Badge>,
      },
      {
        accessorFn: (row) => row.spec.message,
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <span
            className="block max-w-md truncate text-sm text-muted-foreground"
            title={row.original.spec.message}
          >
            {row.original.spec.message}
          </span>
        ),
      },
      {
        accessorFn: (row) => insightTenant(row) ?? "Cluster",
        id: "tenant",
        meta: { hideBelow: "md" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
      },
      {
        accessorFn: (row) => insightState(row),
        id: "state",
        header: ({ column }) => <DataTableColumnHeader column={column} title="State" />,
        cell: ({ row }) => <InsightStateBadge insight={row.original} />,
      },
      {
        accessorFn: (row) => row.status?.firstSeen,
        id: "firstSeen",
        meta: { hideBelow: "lg" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="First Seen" />,
        cell: ({ row }) => <AgeCell timestamp={row.original.status?.firstSeen} />,
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                label: "Triage",
                icon: ClipboardCheck,
                mutating: true,
                onClick: () => setTriageResource(row.original),
              },
              {
                label: "View YAML",
                icon: FileText,
                onClick: () => setYamlResource(row.original),
              },
            ]}
          />
        ),
      },
    ];
    return showTenant ? cols : cols.filter((c) => c.id !== "tenant");
  }, [showTenant]);

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyIcon={Lightbulb}
        emptyMessage="No findings"
        emptyDescription="Every check that ran came back clean."
        searchColumn="message"
        searchPlaceholder="Search findings..."
        filterColumns={[
          {
            column: "severity",
            title: "Severity",
            options: SEVERITIES.map((s) => ({ label: s, value: s })),
          },
          {
            column: "category",
            title: "Category",
            options: CATEGORIES.map((c) => ({ label: c, value: c })),
          },
          {
            column: "state",
            title: "State",
            options: INSIGHT_STATES.map((s) => ({ label: s, value: s })),
          },
        ]}
        onRowClick={(row) => {
          void navigate({
            to: "/insights/$namespace/$name",
            params: {
              namespace: row.original.metadata.namespace ?? "default",
              name: row.original.metadata.name,
            },
          });
        }}
        {...tableProps}
      />

      {triageResource && (
        <InsightTriageDialog
          open={!!triageResource}
          onOpenChange={(open) => !open && setTriageResource(null)}
          insight={triageResource}
          isPending={triageInsight.isPending}
          onSubmit={(action) => {
            void triageInsight
              .mutateAsync({
                namespace: triageResource.metadata.namespace ?? "default",
                name: triageResource.metadata.name,
                action,
              })
              .then(() => setTriageResource(null));
          }}
        />
      )}

      <YamlViewer
        open={!!yamlResource}
        onOpenChange={(open) => !open && setYamlResource(null)}
        resource={yamlResource}
        title={yamlResource ? `Insight: ${yamlResource.metadata.name}` : undefined}
      />
    </>
  );
}

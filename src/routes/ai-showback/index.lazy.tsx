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

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, AlertTriangle, Bot, Coins, Cpu } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { QueryError } from "@/components/common/query-error";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { StatCard } from "@/components/common/stat-card";
import { BudgetMeter } from "@/components/common/budget-meter";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetricsAvailable, useObservabilitySources } from "@/hooks/use-observability";
import { useTenants } from "@/hooks/use-tenants";
import { useTenantModels, useTenantSpend } from "@/hooks/use-ai-spend";
import {
  budgetStatus,
  tokenBudgetForWindow,
  utilizationPercent,
  type BudgetStatus,
  type ModelSpendRow,
} from "@/lib/ai-spend";
import { formatCompactNumber, formatTokens } from "@/lib/format";
import type { AIBudget } from "@/types/ai";

export const Route = createLazyFileRoute("/ai-showback/")({
  component: AIShowback,
});

interface OverviewRow {
  tenantId: string;
  tokens1h: number;
  tokens24h: number;
  requests24h: number;
  topModel?: ModelSpendRow;
  dayTokenBudget?: number;
  utilPercent: number | null;
  status: BudgetStatus;
}

function tokensCell(value: number) {
  return <span className="tabular-nums">{formatTokens(value)}</span>;
}

function AIShowback() {
  const { isLoading: sourcesLoading } = useObservabilitySources();
  const available = useMetricsAvailable();

  const tenants = useTenants();
  const spend = useTenantSpend();
  const models = useTenantModels();
  const navigate = useNavigate();

  const budgetsByTenant = useMemo(() => {
    const map = new Map<string, AIBudget[]>();
    for (const t of tenants.data?.items ?? []) {
      if (t.spec.ai?.budgets) map.set(t.metadata.name, t.spec.ai.budgets);
    }
    return map;
  }, [tenants.data]);

  const rows = useMemo<OverviewRow[]>(() => {
    const ids = new Set<string>([...spend.data.map((r) => r.tenantId), ...budgetsByTenant.keys()]);
    const spendById = new Map(spend.data.map((r) => [r.tenantId, r]));
    return [...ids]
      .map((tenantId) => {
        const s = spendById.get(tenantId);
        const budgets = budgetsByTenant.get(tenantId);
        const dayTokenBudget = tokenBudgetForWindow(budgets, "Day");
        const tokens24h = s?.tokens24h ?? 0;
        const utilPercent = utilizationPercent(tokens24h, dayTokenBudget);
        const alert = budgets?.find((b) => b.window === "Day")?.alertThresholdPercent;
        return {
          tenantId,
          tokens1h: s?.tokens1h ?? 0,
          tokens24h,
          requests24h: s?.requests24h ?? 0,
          topModel: models.data.get(tenantId)?.[0],
          dayTokenBudget,
          utilPercent,
          status: budgetStatus(utilPercent, alert),
        };
      })
      .sort((a, b) => b.tokens24h - a.tokens24h);
  }, [spend.data, budgetsByTenant, models.data]);

  const totals = useMemo(
    () => ({
      tokens24h: rows.reduce((sum, r) => sum + r.tokens24h, 0),
      requests24h: rows.reduce((sum, r) => sum + r.requests24h, 0),
      overBudget: rows.filter((r) => r.status === "over").length,
    }),
    [rows],
  );

  const columns = useMemo<ColumnDef<OverviewRow, unknown>[]>(
    () => [
      {
        accessorKey: "tenantId",
        id: "tenant",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
        cell: ({ row }) => (
          <Link
            to="/ai-showback/$tenant"
            params={{ tenant: row.original.tenantId }}
            className="font-medium text-primary hover:underline"
          >
            {row.original.tenantId}
          </Link>
        ),
      },
      {
        accessorKey: "tokens1h",
        id: "tokens1h",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tokens (1h)" />,
        cell: ({ row }) => tokensCell(row.original.tokens1h),
      },
      {
        accessorKey: "tokens24h",
        id: "tokens24h",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tokens (24h)" />,
        cell: ({ row }) => tokensCell(row.original.tokens24h),
      },
      {
        accessorKey: "requests24h",
        id: "requests24h",
        meta: { hideBelow: "md" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Requests (24h)" />,
        cell: ({ row }) => tokensCell(row.original.requests24h),
      },
      {
        id: "topModel",
        meta: { hideBelow: "lg" },
        header: "Top model",
        cell: ({ row }) => {
          const m = row.original.topModel;
          if (!m) return <span className="text-sm text-muted-foreground">{"—"}</span>;
          return (
            <span className="text-sm">
              <span className="text-muted-foreground">{m.system}/</span>
              {m.model}
            </span>
          );
        },
      },
      {
        id: "budget",
        header: "Budget (Day)",
        cell: ({ row }) => (
          <BudgetMeter percent={row.original.utilPercent} status={row.original.status} />
        ),
      },
    ],
    [],
  );

  if (sourcesLoading) return <Skeleton className="h-[600px] w-full" />;

  if (!available) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="AI Spend"
          description="Per-tenant AI token consumption against configured budgets."
        />
        <EmptyState
          icon={Cpu}
          title="Prometheus required"
          description="AI spend showback reads token metrics from Prometheus. Configure PROMETHEUS_URL (or install Prometheus in-cluster) to enable this view."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Spend"
        description="Per-tenant AI token consumption against configured budgets. Tokens are the primary metric; USD is shown when a cost catalog is configured."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Coins}
          label="Tokens (24h)"
          count={totals.tokens24h}
          accent="primary"
          format={formatCompactNumber}
        />
        <StatCard
          icon={Activity}
          label="Requests (24h)"
          count={totals.requests24h}
          accent="secondary"
          format={formatCompactNumber}
        />
        <StatCard
          icon={AlertTriangle}
          label="Tenants over budget"
          count={totals.overBudget}
          accent={totals.overBudget > 0 ? "destructive" : "success"}
        />
      </div>

      {spend.isError && spend.error ? (
        <QueryError error={spend.error} onRetry={() => spend.refetch()} />
      ) : !spend.isLoading && rows.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No AI spend recorded"
          description="No tenant has produced AI gateway traffic in the last 24 hours."
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={spend.isLoading}
          searchColumn="tenant"
          searchPlaceholder="Search tenants..."
          onRefresh={() => spend.refetch()}
          isRefetching={spend.isLoading}
          onRowClick={(row) =>
            void navigate({
              to: "/ai-showback/$tenant",
              params: { tenant: row.original.tenantId },
            })
          }
        />
      )}
    </div>
  );
}

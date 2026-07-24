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
import { createLazyFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Cpu } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { BudgetMeter } from "@/components/common/budget-meter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetricsAvailable, useObservabilitySources } from "@/hooks/use-observability";
import { useTenant } from "@/hooks/use-tenants";
import { useVirtualKeys } from "@/hooks/use-virtual-keys";
import { useKeySpend, useModelSpend } from "@/hooks/use-ai-spend";
import {
  budgetStatus,
  spendForWindow,
  tokenBudgetForWindow,
  utilizationPercent,
  type BudgetStatus,
} from "@/lib/ai-spend";
import { formatTokens, formatUsd, namespaceToTenant } from "@/lib/format";
import type { AIBudget, VirtualKey } from "@/types/ai";

export const Route = createLazyFileRoute("/ai-showback/$tenant")({
  component: TenantShowback,
});

interface KeyDetailRow {
  keyId: string;
  displayName: string;
  tokens24h: number;
  requests24h: number;
  dayBudget?: number;
  daySpendTokens?: number;
  utilPercent: number | null;
  status: BudgetStatus;
}

function BudgetCard({ budget }: { budget: AIBudget }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{budget.window}</span>
          <Badge variant="outline">{budget.onExceed}</Badge>
        </div>
        <div className="text-lg font-semibold tabular-nums">
          {budget.tokens !== undefined ? `${formatTokens(budget.tokens)} tokens` : "—"}
        </div>
        {budget.usd !== undefined && budget.usd > 0 && (
          <div className="text-sm text-muted-foreground">{formatUsd(budget.usd)} cap</div>
        )}
        {budget.alertThresholdPercent !== undefined && (
          <div className="text-xs text-muted-foreground">
            Alerts at {budget.alertThresholdPercent}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TenantShowback() {
  const { tenant } = useParams({ from: "/ai-showback/$tenant" });
  const { isLoading: sourcesLoading } = useObservabilitySources();
  const available = useMetricsAvailable();

  const tenantQuery = useTenant(tenant);
  const keySpend = useKeySpend(tenant);
  const modelSpend = useModelSpend(tenant);
  const virtualKeys = useVirtualKeys();

  const budgets = tenantQuery.data?.spec.ai?.budgets ?? [];

  // The management-cluster VirtualKey lives in namespace `tenant-<tenantName>`;
  // derive the tenant from the namespace (there is no spec.tenant field).
  const keysForTenant = useMemo(
    () =>
      (virtualKeys.data?.items ?? []).filter(
        (k) => namespaceToTenant(k.metadata.namespace ?? "") === tenant,
      ),
    [virtualKeys.data, tenant],
  );

  const keyRows = useMemo<KeyDetailRow[]>(() => {
    // Join per-key Prometheus series to VirtualKeys on status.keyID (== the
    // `key_id` label), NOT metadata.name.
    const vkByKeyID = new Map<string, VirtualKey>();
    for (const k of keysForTenant) {
      if (k.status?.keyID) vkByKeyID.set(k.status.keyID, k);
    }
    const ids = new Set<string>([...keySpend.data.map((r) => r.keyId), ...vkByKeyID.keys()]);
    const spendById = new Map(keySpend.data.map((r) => [r.keyId, r]));
    return [...ids]
      .map((keyId) => {
        const observed = spendById.get(keyId);
        const vk = vkByKeyID.get(keyId);
        const dayBudget = tokenBudgetForWindow(vk?.spec.budgets, "Day");
        const daySpend = spendForWindow(vk?.status?.spend, "Day");
        const consumed = daySpend?.tokens ?? observed?.tokens24h ?? 0;
        const utilPercent = utilizationPercent(consumed, dayBudget);
        const alert = vk?.spec.budgets?.find((b) => b.window === "Day")?.alertThresholdPercent;
        return {
          keyId,
          displayName: vk?.metadata.name ?? keyId,
          tokens24h: observed?.tokens24h ?? 0,
          requests24h: observed?.requests24h ?? 0,
          dayBudget,
          daySpendTokens: daySpend?.tokens,
          utilPercent,
          status: budgetStatus(utilPercent, alert),
        };
      })
      .sort((a, b) => b.tokens24h - a.tokens24h);
  }, [keySpend.data, keysForTenant]);

  const maxModelTokens = modelSpend.data[0]?.tokens ?? 0;

  const keyColumns = useMemo<ColumnDef<KeyDetailRow, unknown>[]>(
    () => [
      {
        accessorKey: "displayName",
        id: "key",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Key" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.displayName}</span>
            {row.original.displayName !== row.original.keyId && (
              <span className="font-mono text-xs text-muted-foreground">{row.original.keyId}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "tokens24h",
        id: "tokens24h",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tokens (24h)" />,
        cell: ({ row }) => (
          <span className="tabular-nums">{formatTokens(row.original.tokens24h)}</span>
        ),
      },
      {
        accessorKey: "requests24h",
        id: "requests24h",
        meta: { hideBelow: "md" },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Requests (24h)" />,
        cell: ({ row }) => (
          <span className="tabular-nums">{formatTokens(row.original.requests24h)}</span>
        ),
      },
      {
        id: "consumed",
        meta: { hideBelow: "lg" },
        header: "Day budget",
        cell: ({ row }) => {
          const { dayBudget, daySpendTokens } = row.original;
          if (dayBudget === undefined) {
            return <span className="text-sm text-muted-foreground">No budget</span>;
          }
          return (
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatTokens(daySpendTokens ?? 0)} / {formatTokens(dayBudget)}
            </span>
          );
        },
      },
      {
        id: "utilization",
        header: "Utilization",
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
        <BackLink />
        <PageHeader title={tenant} description="AI spend for this tenant." />
        <EmptyState
          icon={Cpu}
          title="Prometheus required"
          description="AI spend showback reads token metrics from Prometheus. Configure PROMETHEUS_URL (or install Prometheus in-cluster) to enable this view."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={tenant}
        description="Per-key and per-model AI token consumption over the last 24 hours."
      />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Configured budgets</h2>
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI budgets configured on this tenant.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => (
              <BudgetCard key={b.window} budget={b} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Keys</h2>
        {!keySpend.isLoading && keyRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No key activity in the last 24 hours.</p>
        ) : (
          <DataTable
            columns={keyColumns}
            data={keyRows}
            isLoading={keySpend.isLoading}
            searchColumn="key"
            searchPlaceholder="Search keys..."
            onRefresh={() => keySpend.refetch()}
            isRefetching={keySpend.isLoading}
          />
        )}
      </section>

      <section className="space-y-2">
        <Card>
          <CardHeader>
            <CardTitle>Top models (24h)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {modelSpend.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : modelSpend.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No model usage recorded.</p>
            ) : (
              modelSpend.data.slice(0, 8).map((m) => (
                <div key={`${m.system}/${m.model}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      <span className="text-muted-foreground">{m.system}/</span>
                      {m.model}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatTokens(m.tokens)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{
                        width: `${String(maxModelTokens > 0 ? (m.tokens / maxModelTokens) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/ai-showback"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      AI Spend
    </Link>
  );
}

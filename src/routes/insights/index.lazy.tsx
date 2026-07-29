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

import { createLazyFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { InsightsTable, SeverityBadge } from "@/components/common/insights-table";
import { QueryError } from "@/components/common/query-error";
import { TenantSelector } from "@/components/common/tenant-selector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInsights } from "@/hooks/use-insights";
import { usePostureScores } from "@/hooks/use-posture-scores";
import { tenantToNamespace } from "@/lib/format";
import {
  summarizeByCheck,
  summarizeByTenant,
  type CheckInsightSummary,
  type TenantInsightSummary,
} from "@/lib/insights";
import type { ListSearchParams } from "@/lib/search-params";
import { useUIStore } from "@/stores/ui";
import type { Insight } from "@/types/kubelb";

export const Route = createLazyFileRoute("/insights/")({
  component: Insights,
});

function Insights() {
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const namespace = selectedTenant ? tenantToNamespace(selectedTenant) : undefined;
  const { data, isLoading, isRefetching, isError, error, refetch, dataUpdatedAt } =
    useInsights(namespace);
  const navigate = useNavigate();
  const { search, page, pageSize } = useSearch({ from: "/insights/" });
  const items = data?.items ?? [];

  const updateSearch = (params: Partial<ListSearchParams>) =>
    void navigate({
      from: "/insights/",
      search: (prev) => ({ ...prev, ...params }),
      replace: true,
    });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Insights"
        description="Findings from the KubeLB insights engine, fleet-wide and per tenant."
      />
      {isError && error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : (
        <>
          {!selectedTenant && <FleetPanels items={items} isLoading={isLoading} />}
          <InsightsTable
            items={items}
            isLoading={isLoading}
            toolbarLeading={<TenantSelector />}
            initialSearch={search}
            initialPage={page}
            initialPageSize={pageSize}
            onSearchChange={(v) => updateSearch({ search: v, page: 0 })}
            onPageChange={(p) => updateSearch({ page: p })}
            onPageSizeChange={(s) => updateSearch({ pageSize: s, page: 0 })}
            onRefresh={() => void refetch()}
            isRefetching={isRefetching}
            dataUpdatedAt={dataUpdatedAt}
          />
        </>
      )}
    </div>
  );
}

function FleetPanels({ items, isLoading }: { items: Insight[]; isLoading?: boolean }) {
  const { data: scores } = usePostureScores();

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const tenants = summarizeByTenant(items, scores);
  const checks = summarizeByCheck(items);

  if (tenants.length === 0 && checks.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TenantLeagueCard tenants={tenants} hasScores={!!scores && scores.size > 0} />
      <CheckRankingCard checks={checks} />
    </div>
  );
}

function scoreTone(score: number): string {
  if (score < 0.6) return "text-destructive";
  if (score < 0.85) return "text-warning";
  return "text-success";
}

// Worst tenant first: the fleet's answer to "who needs attention".
function TenantLeagueCard({
  tenants,
  hasScores,
}: {
  tenants: TenantInsightSummary[];
  hasScores: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants, worst first</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              {hasScores && <TableHead className="text-right">Posture</TableHead>}
              <TableHead className="text-right">Critical / High</TableHead>
              <TableHead className="text-right">Other</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.slice(0, 6).map((row) => (
              <TableRow key={row.tenant}>
                <TableCell>
                  {row.tenant === "Cluster" ? (
                    <span className="text-sm font-medium">Cluster</span>
                  ) : (
                    <Link
                      to="/tenants/$name"
                      params={{ name: row.tenant }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {row.tenant}
                    </Link>
                  )}
                </TableCell>
                {hasScores && (
                  <TableCell className="text-right">
                    {row.score !== undefined ? (
                      <span className={`font-mono text-sm font-medium ${scoreTone(row.score)}`}>
                        {(row.score * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{"—"}</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right font-mono text-sm">
                  {row.counts.critical + row.counts.high}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {row.counts.medium + row.counts.low + row.counts.info}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Checks ranked by how many findings they account for: the top row is the one
// fix that helps most.
function CheckRankingCard({ checks }: { checks: CheckInsightSummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix this first</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Findings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checks.slice(0, 6).map((row) => (
              <TableRow key={row.check}>
                <TableCell>
                  <span className="font-mono text-sm font-medium">{row.check}</span>
                  <span className="ml-2 hidden text-xs text-muted-foreground xl:inline">
                    {row.slug}
                  </span>
                  {row.docsURL && (
                    <a
                      href={row.docsURL}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1.5 inline-flex align-middle text-muted-foreground hover:text-foreground"
                      aria-label={`Documentation for ${row.check}`}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={row.severity} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

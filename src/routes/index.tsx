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

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Network,
  Route as RouteIcon,
  Shield,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeployments } from "@/hooks/use-deployments";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useRoutes } from "@/hooks/use-routes";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import { useTenants } from "@/hooks/use-tenants";
import { useWAFPolicies } from "@/hooks/use-waf-policies";
import { useEdition } from "@/hooks/use-edition";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Condition, Deployment } from "@/types/kubernetes";

export const Route = createFileRoute("/")({
  component: Overview,
});

interface ResourceQueryResult {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  data?: { items: unknown[] };
}

type AccentColor = "primary" | "secondary" | "success" | "warning" | "destructive";

const accentConfig: Record<AccentColor, { border: string; bg: string; icon: string }> = {
  primary: {
    border: "border-l-primary",
    bg: "bg-primary/5",
    icon: "text-primary",
  },
  secondary: {
    border: "border-l-secondary",
    bg: "bg-secondary/5",
    icon: "text-secondary",
  },
  success: {
    border: "border-l-success",
    bg: "bg-success/5",
    icon: "text-success",
  },
  warning: {
    border: "border-l-warning",
    bg: "bg-warning/5",
    icon: "text-warning",
  },
  destructive: {
    border: "border-l-destructive",
    bg: "bg-destructive/5",
    icon: "text-destructive",
  },
};

function MetricCard({
  icon: Icon,
  label,
  query,
  accent = "primary",
  href,
  healthSummary,
}: {
  icon: LucideIcon;
  label: string;
  query: ResourceQueryResult;
  accent?: AccentColor;
  href?: string;
  healthSummary?: string;
}) {
  const config = accentConfig[accent];

  if (query.isLoading) {
    return (
      <Card className="border-l-4 border-l-muted">
        <CardContent className="flex items-center justify-between py-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card className="border-l-4 border-l-destructive">
        <CardContent className="flex items-center gap-3 py-5">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-destructive">
              {query.error?.message ?? "Failed to fetch"}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <button
            onClick={() => query.refetch()}
            className="shrink-0 text-xs font-medium text-primary hover:text-primary-hover"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const count = query.data?.items.length ?? 0;
  const inner = (
    <Card
      className={cn(
        "border-l-4 transition-shadow duration-200",
        config.border,
        href && "cursor-pointer hover:shadow-md",
      )}
    >
      <CardContent className="flex items-center justify-between py-5">
        <div>
          <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">{count}</p>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {healthSummary && <p className="mt-1 text-xs text-muted-foreground">{healthSummary}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", config.bg)}>
          <Icon className={cn("h-5 w-5", config.icon)} />
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{inner}</Link>;
  }
  return inner;
}

interface ConditionOwner {
  status?: { conditions?: Condition[] };
}

function countByConditionStatus<T extends ConditionOwner>(
  items: T[],
  conditionType: string,
): { ready: number; pending: number; error: number } {
  let ready = 0;
  let pending = 0;
  let error = 0;

  for (const item of items) {
    const condition = item.status?.conditions?.find((c) => c.type === conditionType);
    if (!condition || condition.status === "Unknown") {
      pending++;
    } else if (condition.status === "True") {
      ready++;
    } else {
      error++;
    }
  }

  return { ready, pending, error };
}

function countDeploymentReadiness(items: Deployment[]): {
  ready: number;
  pending: number;
  error: number;
} {
  let ready = 0;
  let pending = 0;
  let error = 0;

  for (const d of items) {
    const desired = d.spec.replicas ?? 1;
    const available = d.status?.readyReplicas ?? 0;
    if (available >= desired) {
      ready++;
    } else if (available > 0) {
      pending++;
    } else {
      error++;
    }
  }

  return { ready, pending, error };
}

function HealthBar({
  counts,
  total,
}: {
  counts: { ready: number; pending: number; error: number };
  total: number;
}) {
  if (total === 0) return null;
  const readyPct = (counts.ready / total) * 100;
  const pendingPct = (counts.pending / total) * 100;
  const errorPct = (counts.error / total) * 100;

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {readyPct > 0 && (
        <div
          className="bg-success transition-all duration-500"
          style={{ width: `${String(readyPct)}%` }}
        />
      )}
      {pendingPct > 0 && (
        <div
          className="bg-warning transition-all duration-500"
          style={{ width: `${String(pendingPct)}%` }}
        />
      )}
      {errorPct > 0 && (
        <div
          className="bg-destructive transition-all duration-500"
          style={{ width: `${String(errorPct)}%` }}
        />
      )}
    </div>
  );
}

function ResourceHealthRow({
  icon: Icon,
  label,
  counts,
  total,
  href,
}: {
  icon: LucideIcon;
  label: string;
  counts: { ready: number; pending: number; error: number };
  total: number;
  href?: string;
}) {
  const className = cn(
    "group flex items-center gap-4 rounded-lg px-4 py-3 transition-colors",
    href && "cursor-pointer hover:bg-surface-hover",
  );

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-3 text-xs">
            {counts.ready > 0 && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3 w-3" />
                {counts.ready}
              </span>
            )}
            {counts.pending > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <Clock className="h-3 w-3" />
                {counts.pending}
              </span>
            )}
            {counts.error > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3 w-3" />
                {counts.error}
              </span>
            )}
          </div>
        </div>
        <HealthBar counts={counts} total={total} />
      </div>
      {href && (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function ClusterStatus({ isHealthy }: { isHealthy: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("relative flex h-2.5 w-2.5")}>
        {isHealthy && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            isHealthy ? "bg-success" : "bg-destructive",
          )}
        />
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {isHealthy ? "Cluster Healthy" : "Cluster Degraded"}
      </span>
    </div>
  );
}

function Overview() {
  const { isEE } = useEdition();
  const tenantQuery = useTenants();
  const lbQuery = useLoadBalancers();
  const routeQuery = useRoutes();
  const deploymentQuery = useDeployments(
    undefined,
    "app.kubernetes.io/managed-by=kubelb,app.kubernetes.io/name=kubelb-envoy-proxy",
  );
  const syncSecretQuery = useSyncSecrets();
  const wafQuery = useWAFPolicies();

  const tenantItems = tenantQuery.data?.items ?? [];
  const lbItems = lbQuery.data?.items ?? [];
  const routeItems = routeQuery.data?.items ?? [];
  const deploymentItems = deploymentQuery.data?.items ?? [];
  const syncSecretItems = syncSecretQuery.data?.items ?? [];
  const wafItems = wafQuery.data?.items ?? [];

  const allLoaded =
    !tenantQuery.isLoading &&
    !lbQuery.isLoading &&
    !routeQuery.isLoading &&
    !deploymentQuery.isLoading &&
    !syncSecretQuery.isLoading &&
    (!isEE || !wafQuery.isLoading);

  const anyError =
    tenantQuery.isError ||
    lbQuery.isError ||
    routeQuery.isError ||
    deploymentQuery.isError ||
    syncSecretQuery.isError ||
    (isEE && wafQuery.isError);

  const lbCounts = countByConditionStatus(
    lbItems.map((lb) => ({
      status: {
        conditions: lb.status?.loadBalancer?.ingress
          ? [
              {
                type: "Ready",
                status: "True" as const,
                lastTransitionTime: "",
                reason: "",
                message: "",
              },
            ]
          : undefined,
      },
    })),
    "Ready",
  );

  const routeCounts = countByConditionStatus(
    routeItems.map((r) => ({
      status: { conditions: r.status?.resources?.route?.conditions },
    })),
    "Ready",
  );

  const tenantCounts = { ready: tenantItems.length, pending: 0, error: 0 };
  const syncSecretCounts = { ready: syncSecretItems.length, pending: 0, error: 0 };
  const envoyProxyCounts = countDeploymentReadiness(deploymentItems);
  const wafCounts = countByConditionStatus(wafItems, "Valid");

  function formatHealthSummary(counts: {
    ready: number;
    pending: number;
    error: number;
  }): string | undefined {
    const total = counts.ready + counts.pending + counts.error;
    if (total === 0) return undefined;
    const parts: string[] = [];
    if (counts.ready > 0) parts.push(`${String(counts.ready)} ready`);
    if (counts.pending > 0) parts.push(`${String(counts.pending)} pending`);
    if (counts.error > 0) parts.push(`${String(counts.error)} unhealthy`);
    return parts.join(" / ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            KubeLB cluster overview and health summary.
          </p>
        </div>
        {allLoaded && <ClusterStatus isHealthy={!anyError} />}
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
          isEE ? "xl:grid-cols-6" : "xl:grid-cols-5",
        )}
      >
        <MetricCard
          icon={Users}
          label="Tenants"
          accent="primary"
          query={tenantQuery}
          href="/tenants"
          healthSummary={formatHealthSummary(tenantCounts)}
        />
        <MetricCard
          icon={Network}
          label="Load Balancers"
          accent="primary"
          query={lbQuery}
          href="/load-balancers"
          healthSummary={formatHealthSummary(lbCounts)}
        />
        <MetricCard
          icon={RouteIcon}
          label="Routes"
          accent="secondary"
          query={routeQuery}
          href="/routes"
          healthSummary={formatHealthSummary(routeCounts)}
        />
        <MetricCard
          icon={Shield}
          label="Envoy Proxies"
          accent="success"
          query={deploymentQuery}
          href="/envoy-proxy"
          healthSummary={formatHealthSummary(envoyProxyCounts)}
        />
        <MetricCard
          icon={KeyRound}
          label="Sync Secrets"
          accent="warning"
          query={syncSecretQuery}
          href="/sync-secrets"
          healthSummary={formatHealthSummary(syncSecretCounts)}
        />
        {isEE && (
          <MetricCard
            icon={ShieldAlert}
            label="WAF Policies"
            accent="warning"
            query={wafQuery}
            href="/waf-policies"
            healthSummary={formatHealthSummary(wafCounts)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Resource Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {lbQuery.isLoading ||
            routeQuery.isLoading ||
            deploymentQuery.isLoading ||
            syncSecretQuery.isLoading ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : tenantItems.length +
                lbItems.length +
                routeItems.length +
                deploymentItems.length +
                syncSecretItems.length ===
              0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">No resources to monitor yet.</p>
              </div>
            ) : (
              <>
                {tenantItems.length > 0 && (
                  <ResourceHealthRow
                    icon={Users}
                    label="Tenants"
                    counts={tenantCounts}
                    total={tenantItems.length}
                    href="/tenants"
                  />
                )}
                {lbItems.length > 0 && (
                  <ResourceHealthRow
                    icon={Network}
                    label="Load Balancers"
                    counts={lbCounts}
                    total={lbItems.length}
                    href="/load-balancers"
                  />
                )}
                {routeItems.length > 0 && (
                  <ResourceHealthRow
                    icon={RouteIcon}
                    label="Routes"
                    counts={routeCounts}
                    total={routeItems.length}
                    href="/routes"
                  />
                )}
                {deploymentItems.length > 0 && (
                  <ResourceHealthRow
                    icon={Shield}
                    label="Envoy Proxies"
                    counts={envoyProxyCounts}
                    total={deploymentItems.length}
                    href="/envoy-proxy"
                  />
                )}
                {syncSecretItems.length > 0 && (
                  <ResourceHealthRow
                    icon={KeyRound}
                    label="Sync Secrets"
                    counts={{ ready: syncSecretItems.length, pending: 0, error: 0 }}
                    total={syncSecretItems.length}
                    href="/sync-secrets"
                  />
                )}
                {isEE && wafItems.length > 0 && (
                  <ResourceHealthRow
                    icon={ShieldAlert}
                    label="WAF Policies"
                    counts={wafCounts}
                    total={wafItems.length}
                    href="/waf-policies"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {[
              {
                label: "Tenants",
                desc: "Manage tenant configurations",
                icon: Users,
                href: "/tenants",
              },
              {
                label: "Load Balancers",
                desc: "View L4 load balancers",
                icon: Network,
                href: "/load-balancers",
              },
              { label: "Routes", desc: "View L7 routes", icon: RouteIcon, href: "/routes" },
              {
                label: "Configuration",
                desc: "Global cluster settings",
                icon: Shield,
                href: "/configuration",
              },
              ...(isEE
                ? [
                    {
                      label: "WAF Policies",
                      desc: "Web Application Firewall policies",
                      icon: ShieldAlert,
                      href: "/waf-policies",
                    },
                  ]
                : []),
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-surface-hover"
              >
                <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

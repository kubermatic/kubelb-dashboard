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
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  KeyRound,
  Network,
  Plus,
  Route as RouteIcon,
  Shield,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AttentionPanel } from "@/components/common/attention-panel";
import { ClusterHealthBanner } from "@/components/common/cluster-health-banner";
import { ResourceCounterRow } from "@/components/common/resource-counter-row";
import { TenantFormDialog } from "@/components/common/tenant-form-dialog";
import { WAFPolicyFormDialog } from "@/components/common/waf-policy-form-dialog";
import { YamlEditorDialog } from "@/components/common/yaml-editor-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttentionItems } from "@/hooks/use-attention-items";
import { useCreateSyncSecret } from "@/hooks/use-sync-secret-mutations";
import { useCreateTenant } from "@/hooks/use-tenant-mutations";
import { useCreateWAFPolicy } from "@/hooks/use-waf-policy-mutations";
import { useDeployments } from "@/hooks/use-deployments";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useRoutes } from "@/hooks/use-routes";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import { useTenants } from "@/hooks/use-tenants";
import { useWAFPolicies } from "@/hooks/use-waf-policies";
import { useEdition } from "@/hooks/use-edition";
import { useReadOnly } from "@/hooks/use-read-only";
import { getLoadBalancerHealthStatus, getRouteHealthStatus } from "@/lib/status-mapper";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Condition, Deployment } from "@/types/kubernetes";
import type { SyncSecret } from "@/types/kubelb";

export const Route = createLazyFileRoute("/")({
  component: Overview,
});

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
    <div
      role="img"
      aria-label={`${String(counts.ready)} ready, ${String(counts.pending)} pending, ${String(counts.error)} error`}
      className="flex h-1.5 w-full overflow-hidden rounded-sm bg-muted"
    >
      {readyPct > 0 && (
        <div
          className="bg-success transition-[width] duration-500"
          style={{ width: `${String(readyPct)}%` }}
        />
      )}
      {pendingPct > 0 && (
        <div
          className="bg-warning transition-[width] duration-500"
          style={{ width: `${String(pendingPct)}%` }}
        />
      )}
      {errorPct > 0 && (
        <div
          className="bg-destructive transition-[width] duration-500"
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

type ClusterHealth = "healthy" | "degraded" | "critical";

function deriveClusterHealth(counts: { error: number; pending: number }): {
  health: ClusterHealth;
  summary?: string;
} {
  if (counts.error > 0) {
    const parts: string[] = [];
    if (counts.error > 0) parts.push(`${String(counts.error)} failing`);
    if (counts.pending > 0) parts.push(`${String(counts.pending)} pending`);
    return { health: "critical", summary: parts.join(", ") };
  }
  if (counts.pending > 0) {
    return { health: "degraded", summary: `${String(counts.pending)} pending` };
  }
  return { health: "healthy" };
}

const SYNCSECRET_TEMPLATE = `apiVersion: kubelb.k8c.io/v1alpha1
kind: SyncSecret
metadata:
  name: ""
  namespace: ""
type: Opaque
data: {}
`;

function Overview() {
  const { isEE } = useEdition();
  const readOnly = useReadOnly();
  const tenantQuery = useTenants();
  const lbQuery = useLoadBalancers();
  const routeQuery = useRoutes();
  const deploymentQuery = useDeployments(
    undefined,
    "app.kubernetes.io/managed-by=kubelb,app.kubernetes.io/name=kubelb-envoy-proxy",
  );
  const syncSecretQuery = useSyncSecrets();
  const wafQuery = useWAFPolicies();

  const [createTenantOpen, setCreateTenantOpen] = useState(false);
  const [createSyncSecretOpen, setCreateSyncSecretOpen] = useState(false);
  const [createWafOpen, setCreateWafOpen] = useState(false);

  const createTenant = useCreateTenant();
  const createSyncSecret = useCreateSyncSecret();
  const createWafPolicy = useCreateWAFPolicy();

  const emptyItems: never[] = [];
  const tenantItems = tenantQuery.data?.items ?? emptyItems;
  const lbItems = lbQuery.data?.items ?? emptyItems;
  const routeItems = routeQuery.data?.items ?? emptyItems;
  const deploymentItems = deploymentQuery.data?.items ?? emptyItems;
  const syncSecretItems = syncSecretQuery.data?.items ?? emptyItems;
  const wafItems = wafQuery.data?.items ?? emptyItems;

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

  const lbCounts = useMemo(() => {
    const counts = { ready: 0, pending: 0, error: 0 };
    for (const lb of lbItems) {
      const { state } = getLoadBalancerHealthStatus(lb);
      if (state === "Ready") counts.ready++;
      else if (state === "Error") counts.error++;
      else counts.pending++;
    }
    return counts;
  }, [lbItems]);

  const routeCounts = useMemo(() => {
    const counts = { ready: 0, pending: 0, error: 0 };
    for (const r of routeItems) {
      const { state } = getRouteHealthStatus(r);
      if (state === "Ready") counts.ready++;
      else if (state === "Error") counts.error++;
      else counts.pending++;
    }
    return counts;
  }, [routeItems]);

  const tenantCounts = useMemo(
    () => ({ ready: tenantItems.length, pending: 0, error: 0 }),
    [tenantItems.length],
  );

  const envoyProxyCounts = useMemo(
    () => countDeploymentReadiness(deploymentItems),
    [deploymentItems],
  );
  const wafCounts = useMemo(() => countByConditionStatus(wafItems, "Valid"), [wafItems]);

  const totalErrors =
    lbCounts.error + routeCounts.error + envoyProxyCounts.error + (isEE ? wafCounts.error : 0);
  const totalPending =
    lbCounts.pending +
    routeCounts.pending +
    envoyProxyCounts.pending +
    (isEE ? wafCounts.pending : 0);
  const clusterHealth = deriveClusterHealth({ error: totalErrors, pending: totalPending });

  const counters = [
    {
      icon: Users,
      label: "Tenants",
      count: tenantItems.length,
      href: "/tenants",
      isLoading: tenantQuery.isLoading,
      isError: tenantQuery.isError,
    },
    {
      icon: Network,
      label: "Load Balancers",
      count: lbItems.length,
      href: "/load-balancers",
      isLoading: lbQuery.isLoading,
      isError: lbQuery.isError,
    },
    {
      icon: RouteIcon,
      label: "Routes",
      count: routeItems.length,
      href: "/routes",
      isLoading: routeQuery.isLoading,
      isError: routeQuery.isError,
    },
    {
      icon: Shield,
      label: "Envoy Proxies",
      count: deploymentItems.length,
      href: "/envoy-proxy",
      isLoading: deploymentQuery.isLoading,
      isError: deploymentQuery.isError,
    },
    {
      icon: KeyRound,
      label: "Sync Secrets",
      count: syncSecretItems.length,
      href: "/sync-secrets",
      isLoading: syncSecretQuery.isLoading,
      isError: syncSecretQuery.isError,
    },
    ...(isEE
      ? [
          {
            icon: ShieldAlert,
            label: "WAF Policies",
            count: wafItems.length,
            href: "/waf-policies",
            isLoading: wafQuery.isLoading,
            isError: wafQuery.isError,
          },
        ]
      : []),
  ];

  const attentionItems = useAttentionItems({
    lbs: lbItems,
    routes: routeItems,
    deployments: deploymentItems,
    syncSecrets: syncSecretItems,
    wafPolicies: wafItems,
    isEE,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader title="Overview" description="KubeLB cluster overview and health summary." />
        {(allLoaded || anyError) && (
          <ClusterHealthBanner health={clusterHealth.health} summary={clusterHealth.summary} />
        )}
      </div>

      <ResourceCounterRow counters={counters} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col">
          <h2 className="mb-3 font-condensed text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Resource Health
          </h2>
          <div className="flex-1 rounded border border-border bg-card p-2">
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
          </div>
        </div>

        <div className="flex flex-col">
          <h2 className="mb-3 font-condensed text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Needs Attention
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto rounded border border-border bg-card p-2">
            <AttentionPanel items={attentionItems} isLoading={!allLoaded} />
          </div>
        </div>
      </div>

      {!readOnly && (
        <div>
          <h2 className="mb-3 font-condensed text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateTenantOpen(true)}>
              <Plus className="size-4" /> Create Tenant
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCreateSyncSecretOpen(true)}>
              <Plus className="size-4" /> Create Sync Secret
            </Button>
            {isEE && (
              <Button size="sm" variant="outline" onClick={() => setCreateWafOpen(true)}>
                <Plus className="size-4" /> Create WAF Policy
              </Button>
            )}
          </div>
        </div>
      )}

      <TenantFormDialog
        open={createTenantOpen}
        onOpenChange={setCreateTenantOpen}
        isPending={createTenant.isPending}
        isEE={isEE}
        onSubmit={(tenant) => {
          void createTenant.mutateAsync(tenant).then(() => setCreateTenantOpen(false));
        }}
      />

      <YamlEditorDialog
        open={createSyncSecretOpen}
        onOpenChange={setCreateSyncSecretOpen}
        mode="create"
        title="Create Sync Secret"
        resourceKind="SyncSecret"
        apiVersion="kubelb.k8c.io/v1alpha1"
        initialYaml={SYNCSECRET_TEMPLATE}
        isPending={createSyncSecret.isPending}
        onSubmit={(parsed) => {
          void createSyncSecret
            .mutateAsync(parsed as SyncSecret)
            .then(() => setCreateSyncSecretOpen(false));
        }}
      />

      {isEE && (
        <WAFPolicyFormDialog
          open={createWafOpen}
          onOpenChange={setCreateWafOpen}
          mode="create"
          title="Create WAF Policy"
          isPending={createWafPolicy.isPending}
          onSubmit={(parsed) => {
            void createWafPolicy.mutateAsync(parsed).then(() => setCreateWafOpen(false));
          }}
        />
      )}
    </div>
  );
}

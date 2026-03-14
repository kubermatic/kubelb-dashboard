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
import type { Deployment } from "@/types/kubernetes";
import type { LoadBalancer, Route, WAFPolicy, SyncSecret } from "@/types/kubelb";
import {
  getLoadBalancerHealthStatus,
  getRouteHealthStatus,
  getSyncSecretHealthStatus,
} from "@/lib/status-mapper";

export interface AttentionItem {
  severity: "error" | "warning";
  kind: string;
  name: string;
  namespace?: string;
  message: string;
  href: string;
  timestamp?: string;
}

function lbAttentionItems(items: LoadBalancer[]): AttentionItem[] {
  const result: AttentionItem[] = [];
  for (const lb of items) {
    const { state, reason } = getLoadBalancerHealthStatus(lb);
    if (state === "Ready") continue;
    result.push({
      severity: state === "Error" || state === "Terminating" ? "error" : "warning",
      kind: "LoadBalancer",
      name: lb.metadata.name,
      namespace: lb.metadata.namespace,
      message: state === "Terminating" ? "Terminating" : (reason ?? "No external IP assigned"),
      href: `/load-balancers/${lb.metadata.namespace ?? "default"}/${lb.metadata.name}`,
      timestamp: lb.metadata.creationTimestamp,
    });
  }
  return result;
}

function routeAttentionItems(items: Route[]): AttentionItem[] {
  const result: AttentionItem[] = [];
  for (const route of items) {
    const { state, reason } = getRouteHealthStatus(route);
    if (state === "Ready") continue;
    const kind =
      route.metadata.labels?.["kubelb.k8c.io/origin-resource-kind"]?.split(".")[0] ?? "Route";
    result.push({
      severity: state === "Error" || state === "Terminating" ? "error" : "warning",
      kind,
      name: route.metadata.name,
      namespace: route.metadata.namespace,
      message:
        state === "Terminating"
          ? "Terminating"
          : (reason ?? (state === "Degraded" ? "Accepted but not programmed" : "Pending")),
      href: `/routes/${route.metadata.namespace ?? "default"}/${route.metadata.name}`,
      timestamp: route.metadata.creationTimestamp,
    });
  }
  return result;
}

function deploymentAttentionItems(items: Deployment[]): AttentionItem[] {
  const result: AttentionItem[] = [];
  for (const d of items) {
    const desired = d.spec.replicas ?? 1;
    const ready = d.status?.readyReplicas ?? 0;
    if (ready >= desired) continue;
    result.push({
      severity: ready === 0 ? "error" : "warning",
      kind: "EnvoyProxy",
      name: d.metadata.name,
      namespace: d.metadata.namespace,
      message: `${String(ready)}/${String(desired)} replicas ready`,
      href: "/envoy-proxy",
      timestamp: d.metadata.creationTimestamp,
    });
  }
  return result;
}

function syncSecretAttentionItems(items: SyncSecret[]): AttentionItem[] {
  const result: AttentionItem[] = [];
  for (const s of items) {
    const { state } = getSyncSecretHealthStatus(s);
    if (state === "Ready") continue;
    result.push({
      severity: state === "Terminating" ? "error" : "warning",
      kind: "SyncSecret",
      name: s.metadata.name,
      namespace: s.metadata.namespace,
      message: state === "Terminating" ? "Terminating" : "Pending synchronization",
      href: "/sync-secrets",
      timestamp: s.metadata.creationTimestamp,
    });
  }
  return result;
}

function wafAttentionItems(items: WAFPolicy[]): AttentionItem[] {
  const result: AttentionItem[] = [];
  for (const w of items) {
    const valid = w.status?.conditions?.find((c) => c.type === "Valid");
    if (valid?.status === "True") continue;
    result.push({
      severity: valid?.status === "False" ? "error" : "warning",
      kind: "WAFPolicy",
      name: w.metadata.name,
      namespace: w.metadata.namespace,
      message: valid?.message ?? "Validation pending",
      href: "/waf-policies",
      timestamp: valid?.lastTransitionTime ?? w.metadata.creationTimestamp,
    });
  }
  return result;
}

const MAX_ITEMS = 6;

export function useAttentionItems({
  lbs,
  routes,
  deployments,
  syncSecrets,
  wafPolicies,
  isEE,
}: {
  lbs: LoadBalancer[];
  routes: Route[];
  deployments: Deployment[];
  syncSecrets: SyncSecret[];
  wafPolicies: WAFPolicy[];
  isEE: boolean;
}): AttentionItem[] {
  return useMemo(() => {
    const all = [
      ...lbAttentionItems(lbs),
      ...routeAttentionItems(routes),
      ...deploymentAttentionItems(deployments),
      ...syncSecretAttentionItems(syncSecrets),
      ...(isEE ? wafAttentionItems(wafPolicies) : []),
    ];
    all.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
      return (b.timestamp ?? "").localeCompare(a.timestamp ?? "");
    });
    return all.slice(0, MAX_ITEMS);
  }, [lbs, routes, deployments, syncSecrets, wafPolicies, isEE]);
}

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

import type { Route } from "@/types/kubelb";

export type HealthState = "Ready" | "Degraded" | "Pending" | "Error";

export interface HealthStatus {
  state: HealthState;
  reason?: string;
}

interface UpstreamCondition {
  type: string;
  status: "True" | "False" | "Unknown";
  reason?: string;
  message?: string;
}

function findCondition(
  conditions: unknown[] | undefined,
  type: string,
): UpstreamCondition | undefined {
  if (!Array.isArray(conditions)) return undefined;
  return conditions.find(
    (c): c is UpstreamCondition =>
      typeof c === "object" && c !== null && (c as Record<string, unknown>)["type"] === type,
  );
}

function resolveGatewayHealth(status: Record<string, unknown>): HealthStatus {
  const conditions = status["conditions"] as unknown[] | undefined;
  const accepted = findCondition(conditions, "Accepted");
  const programmed = findCondition(conditions, "Programmed");

  if (!accepted && !programmed) return { state: "Pending" };
  if (accepted?.status === "False") return { state: "Error", reason: accepted.reason };
  if (accepted?.status === "True" && programmed?.status === "True")
    return { state: "Ready", reason: programmed.reason ?? "Programmed" };
  if (accepted?.status === "True" && programmed?.status === "False")
    return { state: "Degraded", reason: programmed.reason };
  return { state: "Pending" };
}

interface ParentStatus {
  conditions?: unknown[];
}

function resolveGatewayRouteHealth(status: Record<string, unknown>): HealthStatus {
  const parents = status["parents"] as ParentStatus[] | undefined;
  if (!parents?.length) return { state: "Pending" };

  for (const parent of parents) {
    const accepted = findCondition(parent.conditions, "Accepted");
    if (accepted?.status === "False") return { state: "Error", reason: accepted.reason };

    const resolvedRefs = findCondition(parent.conditions, "ResolvedRefs");
    if (resolvedRefs?.status === "False") return { state: "Error", reason: resolvedRefs.reason };

    const backends = findCondition(parent.conditions, "BackendsAvailable");
    if (backends?.status === "False") return { state: "Degraded", reason: backends.reason };
  }

  return { state: "Ready" };
}

export function getRouteHealthStatus(route: Route): HealthStatus {
  const routeResource = route.status?.resources?.route;
  if (!routeResource) return { state: "Pending" };

  const kind = routeResource.kind;
  const upstreamStatus = routeResource.status ?? {};

  switch (kind) {
    case "Gateway":
      return resolveGatewayHealth(upstreamStatus);
    case "HTTPRoute":
    case "GRPCRoute":
    case "TCPRoute":
    case "UDPRoute":
    case "TLSRoute":
      return resolveGatewayRouteHealth(upstreamStatus);
    default:
      return { state: "Pending" };
  }
}

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

import { AGENTGATEWAY_API_GROUP } from "@/lib/constants";
import type { GenericResource } from "@/mocks/fixtures/types";
import type { AgentgatewayBackend } from "@/types/agentgateway";
import type { Condition } from "@/types/kubernetes";

export const AGENTGATEWAY_GATEWAY_CLASS = "agentgateway";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  mistral: "Mistral",
  ollama: "Ollama",
  vertexai: "Vertex AI",
  bedrock: "AWS Bedrock",
};

export type BackendKind = "ai" | "mcp" | "unknown";

export function backendKind(backend: AgentgatewayBackend): BackendKind {
  if (backend.spec.ai) return "ai";
  if (backend.spec.mcp) return "mcp";
  return "unknown";
}

export function aiProviderKey(backend: AgentgatewayBackend): string | undefined {
  const provider = backend.spec.ai?.provider;
  if (!provider) return undefined;
  return Object.keys(provider)[0];
}

export function aiProviderLabel(backend: AgentgatewayBackend): string | undefined {
  const key = aiProviderKey(backend);
  if (!key) return undefined;
  return PROVIDER_LABELS[key] ?? key;
}

export function aiModel(backend: AgentgatewayBackend): string | undefined {
  const key = aiProviderKey(backend);
  if (!key) return undefined;
  return backend.spec.ai?.provider?.[key]?.model;
}

export function mcpTargetCount(backend: AgentgatewayBackend): number {
  return backend.spec.mcp?.targets?.length ?? 0;
}

export function validCondition(backend: AgentgatewayBackend): Condition | undefined {
  const conditions = backend.status?.conditions;
  if (!conditions) return undefined;
  return (
    conditions.find((c) => c.type === "Accepted") ??
    conditions.find((c) => c.type === "Ready") ??
    conditions[0]
  );
}

interface GatewayAddress {
  type?: string;
  value?: string;
}

interface GatewayListener {
  name?: string;
  port?: number;
  protocol?: string;
}

export function gatewayClassName(gateway: GenericResource): string | undefined {
  const spec = gateway.spec as { gatewayClassName?: string } | undefined;
  return spec?.gatewayClassName;
}

export function isAgentgateway(gateway: GenericResource): boolean {
  return gatewayClassName(gateway) === AGENTGATEWAY_GATEWAY_CLASS;
}

export function gatewayAddress(gateway: GenericResource): string | undefined {
  const status = gateway.status as { addresses?: GatewayAddress[] } | undefined;
  return status?.addresses?.find((a) => a.value)?.value;
}

export function gatewayListeners(gateway: GenericResource): GatewayListener[] {
  const spec = gateway.spec as { listeners?: GatewayListener[] } | undefined;
  return spec?.listeners ?? [];
}

export function gatewayEndpoint(gateway: GenericResource): string | undefined {
  const address = gatewayAddress(gateway);
  if (!address) return undefined;
  const port = gatewayListeners(gateway)[0]?.port;
  return port ? `${address}:${String(port)}` : address;
}

export function gatewayProgrammedCondition(gateway: GenericResource): Condition | undefined {
  const status = gateway.status as { conditions?: Condition[] } | undefined;
  const conditions = status?.conditions;
  if (!conditions) return undefined;
  return (
    conditions.find((c) => c.type === "Programmed") ??
    conditions.find((c) => c.type === "Accepted") ??
    conditions[0]
  );
}

export function gatewayScheme(gateway?: GenericResource): "https" | "http" {
  if (!gateway) return "https";
  const secure = gatewayListeners(gateway).some((l) => {
    const proto = (l.protocol ?? "").toUpperCase();
    return proto === "HTTPS" || proto === "TLS";
  });
  return secure ? "https" : "http";
}

interface HTTPRouteSpec {
  hostnames?: string[];
  parentRefs?: { name?: string; namespace?: string }[];
  rules?: {
    matches?: { path?: { type?: string; value?: string } }[];
    backendRefs?: { group?: string; kind?: string; name?: string }[];
  }[];
}

export interface BackendEndpoint {
  url: string;
  host: string;
  path: string;
  scheme: "https" | "http";
  routeName: string;
  routeNamespace?: string;
}

export function resolveBackendEndpoint(
  backend: AgentgatewayBackend,
  httpRoutes: GenericResource[],
  gateways: GenericResource[],
): BackendEndpoint | undefined {
  const name = backend.metadata.name;
  for (const route of httpRoutes) {
    const spec = route.spec as HTTPRouteSpec | undefined;
    if (!spec?.rules) continue;
    for (const rule of spec.rules) {
      const ref = rule.backendRefs?.find(
        (b) => b.group === AGENTGATEWAY_API_GROUP && b.name === name,
      );
      if (!ref) continue;
      const path = rule.matches?.[0]?.path?.value ?? "/";
      const gateway = gateways.find((g) => g.metadata.name === spec.parentRefs?.[0]?.name);
      const scheme = gatewayScheme(gateway);
      const host = spec.hostnames?.[0] ?? (gateway ? gatewayAddress(gateway) : undefined);
      if (!host) return undefined;
      return {
        url: `${scheme}://${host}${path}`,
        host,
        path,
        scheme,
        routeName: route.metadata.name,
        routeNamespace: route.metadata.namespace,
      };
    }
  }
  return undefined;
}

export function backendUsageExample(
  backend: AgentgatewayBackend,
  endpoint: BackendEndpoint,
): string {
  const base = endpoint.url.replace(/\/$/, "");
  if (backendKind(backend) === "ai") {
    const model = aiModel(backend) ?? "<model>";
    return [
      `curl -s ${base}/v1/chat/completions \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '{"model":"${model}","messages":[{"role":"user","content":"What is Kubernetes in one sentence?"}]}' | jq`,
    ].join("\n");
  }
  return [
    `curl -s ${base} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Accept: application/json, text/event-stream" \\`,
    `  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
  ].join("\n");
}

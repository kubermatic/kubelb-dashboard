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

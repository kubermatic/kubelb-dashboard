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

import type { Condition, ObjectMeta } from "@/types/kubernetes";

export interface AgentgatewayProviderConfig {
  model?: string;
  [key: string]: unknown;
}

export interface AgentgatewayAISpec {
  provider?: Record<string, AgentgatewayProviderConfig>;
}

export interface AgentgatewayMCPTarget {
  name: string;
  backendRef?: { name: string; group?: string; kind?: string };
  static?: { host?: string; port?: number; protocol?: string };
  port?: number;
  protocol?: string;
}

export interface AgentgatewayMCPSpec {
  targets?: AgentgatewayMCPTarget[];
}

export interface AgentgatewayPolicies {
  auth?: { secretRef?: { name: string } };
}

export interface AgentgatewayBackendSpec {
  ai?: AgentgatewayAISpec;
  mcp?: AgentgatewayMCPSpec;
  policies?: AgentgatewayPolicies;
}

export interface AgentgatewayBackendStatus {
  conditions?: Condition[];
}

export interface AgentgatewayBackend {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: AgentgatewayBackendSpec;
  status?: AgentgatewayBackendStatus;
}

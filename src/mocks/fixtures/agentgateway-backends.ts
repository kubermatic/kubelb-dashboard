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

import type { AgentgatewayBackend } from "@/types/agentgateway";

const accepted = {
  lastTransitionTime: "2026-04-10T09:00:50Z",
  message: "Backend has been accepted by agentgateway",
  observedGeneration: 1,
  reason: "Accepted",
  status: "True" as const,
  type: "Accepted",
};

export const agentgatewayBackends: AgentgatewayBackend[] = [
  {
    apiVersion: "agentgateway.dev/v1alpha1",
    kind: "AgentgatewayBackend",
    metadata: {
      name: "openai",
      namespace: "kubelb",
      creationTimestamp: "2026-04-10T08:55:10Z",
      generation: 1,
      resourceVersion: "401120",
      uid: "0b9d8a11-3c2e-4d8a-9f01-9b3a2c1d4e5f",
    },
    spec: {
      ai: {
        provider: {
          openai: { model: "gpt-4o-mini" },
        },
      },
      policies: {
        auth: { secretRef: { name: "openai-secret" } },
      },
    },
    status: { conditions: [accepted] },
  },
  {
    apiVersion: "agentgateway.dev/v1alpha1",
    kind: "AgentgatewayBackend",
    metadata: {
      name: "anthropic",
      namespace: "kubelb",
      creationTimestamp: "2026-04-11T10:12:00Z",
      generation: 1,
      resourceVersion: "402330",
      uid: "1c2d3e4f-5061-7283-94a5-b6c7d8e9f001",
    },
    spec: {
      ai: {
        provider: {
          anthropic: { model: "claude-opus-4-8" },
        },
      },
      policies: {
        auth: { secretRef: { name: "anthropic-secret" } },
      },
    },
    status: { conditions: [accepted] },
  },
  {
    apiVersion: "agentgateway.dev/v1alpha1",
    kind: "AgentgatewayBackend",
    metadata: {
      name: "mcp-backend",
      namespace: "kubelb",
      creationTimestamp: "2026-04-12T14:30:00Z",
      generation: 1,
      resourceVersion: "403440",
      uid: "2d3e4f50-6172-8394-a5b6-c7d8e9f00112",
    },
    spec: {
      mcp: {
        targets: [
          {
            name: "website-fetcher",
            backendRef: { name: "mcp-website-fetcher" },
            port: 80,
            protocol: "SSE",
          },
          {
            name: "github-tools",
            backendRef: { name: "mcp-github" },
            port: 8080,
            protocol: "SSE",
          },
        ],
      },
    },
    status: { conditions: [accepted] },
  },
];

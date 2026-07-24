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

// Deterministic AI spend dataset backing the mock /api/metrics/ai handler.
// Numbers are chosen to exercise the UI: one tenant over its Day budget, one
// comfortably under, multiple keys and models per tenant.
//
// keyId values are the Prometheus `key_id` label = VirtualKey status.keyID
// (format `<originName>-<6hex>`), deliberately distinct from the VirtualKey
// metadata.name so the mock exercises the real status.keyID -> key_id join.

export interface ModelUsage {
  system: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface KeyUsage {
  keyId: string;
  requests: number;
  models: ModelUsage[];
}

export interface TenantUsage {
  tenantId: string;
  keys: KeyUsage[];
}

export const aiUsage: TenantUsage[] = [
  {
    tenantId: "primary",
    keys: [
      {
        keyId: "team-alpha-a1b2c3",
        requests: 5200,
        models: [
          { system: "openai", model: "gpt-4o", inputTokens: 1_200_000, outputTokens: 380_000 },
          {
            system: "anthropic",
            model: "claude-3-5-sonnet",
            inputTokens: 640_000,
            outputTokens: 210_000,
          },
        ],
      },
      {
        keyId: "team-beta-d4e5f6",
        requests: 8100,
        models: [
          { system: "openai", model: "gpt-4o-mini", inputTokens: 900_000, outputTokens: 150_000 },
        ],
      },
    ],
  },
  {
    tenantId: "secondary",
    keys: [
      {
        keyId: "prod-gateway-9a8b7c",
        requests: 2400,
        models: [
          {
            system: "anthropic",
            model: "claude-3-5-haiku",
            inputTokens: 320_000,
            outputTokens: 90_000,
          },
        ],
      },
    ],
  },
];

// Fraction of the 24h totals attributed to the trailing hour, so 1h and 24h
// queries return internally consistent, stable numbers.
export const WINDOW_RATIO: Record<string, number> = {
  "1h": 0.055,
  "24h": 1,
};

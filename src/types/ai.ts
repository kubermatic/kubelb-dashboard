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

import type { ObjectMeta } from "@/types/kubernetes";

export type AIBudgetWindow = "Day" | "Week" | "Month";
export type AIBudgetAction = "Block" | "Throttle" | "Notify";

// Mirrors Tenant.spec.ai.budgets[] / VirtualKey.spec.budgets[] from kubelb-ee.
// USD is optional: the cost catalog is not wired yet, so it may be absent/zero.
export interface AIBudget {
  tokens?: number;
  usd?: number;
  window: AIBudgetWindow;
  onExceed: AIBudgetAction;
  throttleRequestsPerMinute?: number;
  alertThresholdPercent?: number;
}

export interface TenantAISettings {
  budgets?: AIBudget[];
}

// VirtualKey.status.spend[] — per-window consumption, tenant-visible.
export interface VirtualKeySpend {
  window: AIBudgetWindow;
  windowStart: string;
  tokens: number;
  usd?: number;
}

export interface VirtualKeySpec {
  budgets?: AIBudget[];
  rateLimit?: Record<string, unknown>;
  expiresAfter?: string;
  disabled?: boolean;
}

export interface VirtualKeyStatus {
  // Stable identifier surfaced on the Prometheus `key_id` label, format
  // `<originName>-<6hex(sha256(uid))>`. Join per-key spend on this, not on name.
  keyID?: string;
  spend?: VirtualKeySpend[];
}

export interface VirtualKey {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: VirtualKeySpec;
  status?: VirtualKeyStatus;
}

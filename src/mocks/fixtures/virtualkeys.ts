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

import type { VirtualKey } from "@/types/ai";

// windowStart is a fixed recent hour so mock output stays deterministic.
const WINDOW_START = "2026-07-24T00:00:00Z";

export const virtualKeys: VirtualKey[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "VirtualKey",
    metadata: {
      name: "team-alpha",
      namespace: "tenant-primary",
      creationTimestamp: "2026-05-02T10:12:00Z",
      uid: "5f2a1c00-0001-4a00-9000-000000000001",
    },
    spec: {
      budgets: [
        { window: "Day", tokens: 2_000_000, onExceed: "Throttle", alertThresholdPercent: 80 },
        { window: "Month", tokens: 50_000_000, onExceed: "Block" },
      ],
    },
    status: {
      keyID: "team-alpha-a1b2c3",
      spend: [{ window: "Day", windowStart: WINDOW_START, tokens: 2_430_000 }],
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "VirtualKey",
    metadata: {
      name: "team-beta",
      namespace: "tenant-primary",
      creationTimestamp: "2026-06-14T08:30:00Z",
      uid: "5f2a1c00-0002-4a00-9000-000000000002",
    },
    spec: {
      budgets: [
        { window: "Day", tokens: 1_500_000, onExceed: "Notify", alertThresholdPercent: 75 },
      ],
    },
    status: {
      keyID: "team-beta-d4e5f6",
      spend: [{ window: "Day", windowStart: WINDOW_START, tokens: 1_050_000 }],
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "VirtualKey",
    metadata: {
      name: "prod-gateway",
      namespace: "tenant-secondary",
      creationTimestamp: "2026-04-21T14:05:00Z",
      uid: "5f2a1c00-0003-4a00-9000-000000000003",
    },
    spec: {
      budgets: [{ window: "Day", tokens: 800_000, onExceed: "Block", alertThresholdPercent: 90 }],
    },
    status: {
      keyID: "prod-gateway-9a8b7c",
      spend: [{ window: "Day", windowStart: WINDOW_START, tokens: 410_000 }],
    },
  },
];

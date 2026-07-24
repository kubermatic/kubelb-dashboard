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

import { parseVector, type AISpendSample } from "@/lib/ai-spend";

export type AIMetric = "tokens" | "requests" | "tokens_by_model";
export type AISpendWindow = "1h" | "24h";

export interface AISpendQuery {
  metric: AIMetric;
  window: AISpendWindow;
  tenant?: string;
  key?: string;
}

export async function fetchAISpend(query: AISpendQuery): Promise<AISpendSample[]> {
  const url = new URL("/api/metrics/ai", window.location.origin);
  url.searchParams.set("metric", query.metric);
  url.searchParams.set("window", query.window);
  if (query.tenant) url.searchParams.set("tenant", query.tenant);
  if (query.key) url.searchParams.set("key", query.key);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) throw new Error(`ai spend ${String(res.status)}`);
  return parseVector(await res.json());
}

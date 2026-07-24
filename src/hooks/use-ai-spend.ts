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

import { useQueries } from "@tanstack/react-query";

import { fetchAISpend } from "@/api/ai-spend";
import { queryKeys } from "@/api/query-keys";
import { useMetricsAvailable } from "@/hooks/use-observability";
import {
  aggregateKeySpend,
  aggregateModelSpend,
  aggregateTenantSpend,
  groupModelsByTenant,
  type KeySpendRow,
  type ModelSpendRow,
  type TenantSpendRow,
} from "@/lib/ai-spend";

const REFETCH_MS = 30_000;

interface AISpendResult<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

// Per-tenant overview: tokens over the last hour and last day plus request
// counts, aggregated from the AI recording-rule (raw-fallback) series.
export function useTenantSpend(): AISpendResult<TenantSpendRow[]> {
  const available = useMetricsAvailable();
  const results = useQueries({
    queries: [
      {
        queryKey: [...queryKeys.aiSpend.tenant("1h"), "tokens"],
        queryFn: () => fetchAISpend({ metric: "tokens", window: "1h" }),
        enabled: available,
        refetchInterval: REFETCH_MS,
      },
      {
        queryKey: [...queryKeys.aiSpend.tenant("24h"), "tokens"],
        queryFn: () => fetchAISpend({ metric: "tokens", window: "24h" }),
        enabled: available,
        refetchInterval: REFETCH_MS,
      },
      {
        queryKey: [...queryKeys.aiSpend.tenant("24h"), "requests"],
        queryFn: () => fetchAISpend({ metric: "requests", window: "24h" }),
        enabled: available,
        refetchInterval: REFETCH_MS,
      },
    ],
  });
  const [tokens1h, tokens24h, requests24h] = results;
  return {
    data: aggregateTenantSpend(tokens1h.data ?? [], tokens24h.data ?? [], requests24h.data ?? []),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    error: results.find((r) => r.error)?.error ?? null,
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

export function useKeySpend(tenant: string): AISpendResult<KeySpendRow[]> {
  const available = useMetricsAvailable();
  const results = useQueries({
    queries: [
      {
        queryKey: [...queryKeys.aiSpend.key(tenant, "24h"), "tokens"],
        queryFn: () => fetchAISpend({ metric: "tokens", window: "24h", tenant }),
        enabled: available && !!tenant,
        refetchInterval: REFETCH_MS,
      },
      {
        queryKey: [...queryKeys.aiSpend.key(tenant, "24h"), "requests"],
        queryFn: () => fetchAISpend({ metric: "requests", window: "24h", tenant }),
        enabled: available && !!tenant,
        refetchInterval: REFETCH_MS,
      },
    ],
  });
  const [tokens24h, requests24h] = results;
  return {
    data: aggregateKeySpend(tokens24h.data ?? [], requests24h.data ?? []),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    error: results.find((r) => r.error)?.error ?? null,
    refetch: () => results.forEach((r) => void r.refetch()),
  };
}

// Top models per tenant for the overview, fetched in one unscoped query and
// grouped client-side so the table doesn't fan out one request per tenant.
export function useTenantModels(): AISpendResult<Map<string, ModelSpendRow[]>> {
  const available = useMetricsAvailable();
  const results = useQueries({
    queries: [
      {
        queryKey: [...queryKeys.aiSpend.model("all", "24h")],
        queryFn: () => fetchAISpend({ metric: "tokens_by_model", window: "24h" }),
        enabled: available,
        refetchInterval: REFETCH_MS,
      },
    ],
  });
  const [byModel] = results;
  return {
    data: groupModelsByTenant(byModel.data ?? []),
    isLoading: byModel.isLoading,
    isError: byModel.isError,
    error: byModel.error,
    refetch: () => void byModel.refetch(),
  };
}

export function useModelSpend(tenant: string): AISpendResult<ModelSpendRow[]> {
  const available = useMetricsAvailable();
  const results = useQueries({
    queries: [
      {
        queryKey: [...queryKeys.aiSpend.model(tenant, "24h")],
        queryFn: () => fetchAISpend({ metric: "tokens_by_model", window: "24h", tenant }),
        enabled: available && !!tenant,
        refetchInterval: REFETCH_MS,
      },
    ],
  });
  const [byModel] = results;
  return {
    data: aggregateModelSpend(byModel.data ?? []),
    isLoading: byModel.isLoading,
    isError: byModel.isError,
    error: byModel.error,
    refetch: () => void byModel.refetch(),
  };
}

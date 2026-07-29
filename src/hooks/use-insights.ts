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

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import { useKubeGet } from "@/hooks/use-kube-get";
import { useKubeList } from "@/hooks/use-kube-list";
import { API_PATHS } from "@/lib/constants";
import type { Insight } from "@/types/kubelb";

const STORAGE_KEY = "kubelb-insights-available";
const KUBE_PREFIX = "/api/kube";

function getCachedAvailability(): boolean | undefined {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached === "true") return true;
  if (cached === "false") return false;
  return undefined;
}

// The Insight CRD ships with the insights engine, so its presence is the
// feature probe — same pattern as the agentgateway addon.
async function detectAvailability(): Promise<boolean> {
  const res = await fetch(`${KUBE_PREFIX}${API_PATHS.insightsAll}?limit=1`, {
    credentials: "include",
  });
  if (res.ok) {
    localStorage.setItem(STORAGE_KEY, "true");
    return true;
  }
  if (res.status === 404 || res.status === 403) {
    localStorage.setItem(STORAGE_KEY, "false");
    return false;
  }
  throw new Error(`insights probe failed: ${String(res.status)}`);
}

export function useInsightsAvailable() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insights.available(),
    queryFn: detectAvailability,
    initialData: getCachedAvailability,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    available: data === true,
    loading: isLoading,
  };
}

export function useInsights(namespace?: string, options?: { enabled?: boolean }) {
  return useKubeList<Insight>(
    queryKeys.insights.list(namespace),
    namespace ? API_PATHS.insights(namespace) : API_PATHS.insightsAll,
    options,
  );
}

export function useInsight(namespace: string, name: string) {
  return useKubeGet<Insight>(
    queryKeys.insights.detail(namespace, name),
    `${API_PATHS.insights(namespace)}/${name}`,
  );
}

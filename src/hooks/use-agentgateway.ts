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
import type { AgentgatewayBackend } from "@/types/agentgateway";

const STORAGE_KEY = "kubelb-agentgateway-available";
const KUBE_PREFIX = "/api/kube";

function getCachedAvailability(): boolean | undefined {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached === "true") return true;
  if (cached === "false") return false;
  return undefined;
}

async function detectAvailability(): Promise<boolean> {
  const res = await fetch(`${KUBE_PREFIX}${API_PATHS.agentgatewayBackends}?limit=1`, {
    credentials: "include",
  });
  const available = res.ok;
  localStorage.setItem(STORAGE_KEY, String(available));
  return available;
}

export function useAgentgatewayAvailable() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.agentgateway.available(),
    queryFn: detectAvailability,
    initialData: getCachedAvailability,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  return {
    available: data === true,
    loading: isLoading,
  };
}

export function useAgentgatewayBackends(options?: { enabled?: boolean }) {
  return useKubeList<AgentgatewayBackend>(
    queryKeys.agentgateway.backends.list(),
    API_PATHS.agentgatewayBackends,
    options,
  );
}

export function useAgentgatewayBackend(namespace: string, name: string) {
  return useKubeGet<AgentgatewayBackend>(
    queryKeys.agentgateway.backends.detail(namespace, name),
    `${API_PATHS.agentgatewayBackend(namespace)}/${name}`,
  );
}

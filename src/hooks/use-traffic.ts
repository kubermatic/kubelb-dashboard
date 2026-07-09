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
import {
  fetchTrafficFlows,
  fetchTrafficGraph,
  fetchTrafficSources,
  type TrafficSources,
  type TrafficWindow,
} from "@/api/traffic";

// Whether Hubble is present is fixed for the pod lifetime — cache it.
export function useTrafficSources() {
  return useQuery<TrafficSources>({
    queryKey: ["traffic", "sources"],
    queryFn: fetchTrafficSources,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useTrafficAvailable(): boolean {
  const { data } = useTrafficSources();
  return data?.hubble.available ?? false;
}

export function useTrafficGraph(enabled: boolean, window: TrafficWindow) {
  return useQuery({
    queryKey: ["traffic", "graph", window],
    queryFn: () => fetchTrafficGraph(window),
    enabled,
    refetchInterval: 10_000,
  });
}

export function useTrafficFlows(enabled: boolean, window: TrafficWindow) {
  return useQuery({
    queryKey: ["traffic", "flows", window],
    queryFn: () => fetchTrafficFlows(window),
    enabled,
    refetchInterval: 10_000,
  });
}

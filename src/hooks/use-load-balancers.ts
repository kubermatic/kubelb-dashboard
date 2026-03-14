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

import { queryKeys } from "@/api/query-keys";
import { useKubeGet } from "@/hooks/use-kube-get";
import { useKubeList } from "@/hooks/use-kube-list";
import type { LoadBalancer } from "@/types/kubelb";

const BASE = "/apis/kubelb.k8c.io/v1alpha1";

export function useLoadBalancers(namespace?: string, options?: { enabled?: boolean }) {
  const path = namespace
    ? `${BASE}/namespaces/${namespace}/loadbalancers`
    : `${BASE}/loadbalancers`;
  return useKubeList<LoadBalancer>(queryKeys.loadBalancers.list(namespace), path, options);
}

export function useLoadBalancer(namespace: string, name: string) {
  return useKubeGet<LoadBalancer>(
    queryKeys.loadBalancers.detail(namespace, name),
    `${BASE}/namespaces/${namespace}/loadbalancers/${name}`,
  );
}

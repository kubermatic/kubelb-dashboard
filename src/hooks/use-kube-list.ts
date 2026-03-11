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
import { kubeList } from "@/api/kube";
import type { KubeList } from "@/types/kubernetes";

export function useKubeList<T>(
  queryKey: readonly unknown[],
  path: string,
  options?: { labelSelector?: string; enabled?: boolean },
) {
  return useQuery<KubeList<T>>({
    queryKey,
    queryFn: () => kubeList<T>(path, { labelSelector: options?.labelSelector }),
    enabled: options?.enabled,
  });
}

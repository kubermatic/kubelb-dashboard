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
import type { SyncSecret } from "@/types/kubelb";
import { API_BASE, API_PATHS } from "@/lib/constants";

export function useSyncSecrets(namespace?: string, options?: { enabled?: boolean }) {
  const path = namespace ? API_PATHS.syncSecrets(namespace) : `${API_BASE}/syncsecrets`;
  return useKubeList<SyncSecret>(queryKeys.syncSecrets.list(namespace), path, options);
}

export function useSyncSecret(namespace: string, name: string) {
  return useKubeGet<SyncSecret>(
    queryKeys.syncSecrets.detail(namespace, name),
    `${API_PATHS.syncSecrets(namespace)}/${name}`,
  );
}

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
import { useKubeList } from "@/hooks/use-kube-list";
import type { GenericResource } from "@/mocks/fixtures/types";

const BASE = "/api/v1";

export function useServices(namespace?: string, labelSelector?: string) {
  const path = namespace ? `${BASE}/namespaces/${namespace}/services` : `${BASE}/services`;
  return useKubeList<GenericResource>(queryKeys.services.list(namespace, labelSelector), path, {
    labelSelector,
  });
}

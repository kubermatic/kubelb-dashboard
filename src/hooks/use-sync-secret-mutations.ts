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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { kubeCreate, kubeDelete, kubeUpdate, type KubeApiError } from "@/api/kube";
import { queryKeys } from "@/api/query-keys";
import type { SyncSecret } from "@/types/kubelb";
import { API_PATHS } from "@/lib/constants";

export function useCreateSyncSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (syncSecret: SyncSecret) =>
      kubeCreate<SyncSecret>(
        `${API_PATHS.syncSecrets(syncSecret.metadata.namespace!)}`,
        syncSecret,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.syncSecrets.all });
      toast.success("Sync secret created");
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSyncSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (syncSecret: SyncSecret) =>
      kubeUpdate<SyncSecret>(
        `${API_PATHS.syncSecrets(syncSecret.metadata.namespace!)}/${syncSecret.metadata.name}`,
        syncSecret,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.syncSecrets.all });
      toast.success("Sync secret updated");
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSyncSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      kubeDelete(`${API_PATHS.syncSecrets(namespace)}/${name}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.syncSecrets.all });
      toast.success("Sync secret deleted");
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

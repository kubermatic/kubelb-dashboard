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

import { kubeDelete, type KubeApiError } from "@/api/kube";
import { queryKeys } from "@/api/query-keys";

const BASE = "/apis/kubelb.k8c.io/v1alpha1/namespaces";

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ namespace, name }: { namespace: string; name: string }) =>
      kubeDelete(`${BASE}/${namespace}/routes/${name}`),
    onSuccess: (_data, { name }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.routes.all });
      toast.success(`Route "${name}" deleted`);
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

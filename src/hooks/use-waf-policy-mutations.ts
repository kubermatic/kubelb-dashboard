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
import type { WAFPolicy } from "@/types/kubelb";

const BASE = "/apis/kubelb.k8c.io/v1alpha1/wafpolicies";

export function useCreateWAFPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policy: WAFPolicy) => kubeCreate<WAFPolicy>(BASE, policy),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wafPolicies.all });
      toast.success("WAF Policy created");
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateWAFPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policy: WAFPolicy) =>
      kubeUpdate<WAFPolicy>(`${BASE}/${policy.metadata.name}`, policy),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wafPolicies.all });
      toast.success("WAF Policy updated");
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteWAFPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => kubeDelete(`${BASE}/${name}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wafPolicies.all });
      toast.success("WAF Policy deleted");
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

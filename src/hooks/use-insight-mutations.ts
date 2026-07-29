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

import { kubePatch, type KubeApiError } from "@/api/kube";
import { queryKeys } from "@/api/query-keys";
import { API_PATHS } from "@/lib/constants";
import { buildTriagePatch, type TriageAction } from "@/lib/insights";
import type { Insight } from "@/types/kubelb";

// The engine reacts to a triage write by recomputing status.state on its next
// sweep, about a second later. Rather than modelling that loop optimistically,
// invalidate once on success and once more after the engine has had its turn.
const ENGINE_SETTLE_MS = 1500;

export interface TriageInput {
  namespace: string;
  name: string;
  action: TriageAction;
}

const ACTION_TOAST: Record<TriageAction["type"], string> = {
  acknowledge: "acknowledged",
  snooze: "snoozed",
  dismiss: "dismissed",
  reopen: "reopened",
};

export function useTriageInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ namespace, name, action }: TriageInput) =>
      kubePatch<Insight>(`${API_PATHS.insights(namespace)}/${name}`, buildTriagePatch(action)),
    onSuccess: (_data, { name, action }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
      }, ENGINE_SETTLE_MS);
      toast.success(`Insight "${name}" ${ACTION_TOAST[action.type]}`);
    },
    onError: (error: KubeApiError) => {
      toast.error(error.message);
    },
  });
}

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

import { toast } from "sonner";
import { kubeGet } from "@/api/kube";
import { tenantToNamespace } from "@/lib/format";

interface KubeSecret {
  data?: Record<string, string>;
}

export async function downloadKubeconfig(tenantName: string): Promise<void> {
  const ns = tenantToNamespace(tenantName);
  const secretPath = `/api/v1/namespaces/${ns}/secrets/kubelb-ccm-kubeconfig`;

  try {
    const secret = await kubeGet<KubeSecret>(secretPath);
    const encoded = secret.data?.kubelb;
    if (!encoded) {
      toast.error("Kubeconfig data not found in secret");
      return;
    }

    const decoded = atob(encoded);
    const blob = new Blob([decoded], { type: "application/x-yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kubelb-${tenantName}.kubeconfig`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kubeconfig downloaded");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to download kubeconfig");
  }
}

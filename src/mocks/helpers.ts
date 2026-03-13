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

import type { KubeList, KubeStatus } from "@/types/kubernetes";

let resourceVersionCounter = 1000;

export function nextResourceVersion(): string {
  return String(++resourceVersionCounter);
}

export function kubeListEnvelope<T>(
  apiVersion: string,
  kind: string,
  items: T[],
): KubeList<T> {
  return {
    apiVersion,
    kind,
    metadata: { resourceVersion: nextResourceVersion() },
    items,
  };
}

export function kubeStatus(
  code: number,
  reason: string,
  message: string,
): KubeStatus {
  return {
    kind: "Status",
    apiVersion: "v1",
    status: code >= 400 ? "Failure" : "Success",
    message,
    reason,
    code,
  };
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  patch: Record<string, unknown>,
): T {
  const result = { ...target };

  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const targetVal = (target as Record<string, unknown>)[key];

    if (
      patchVal !== null &&
      typeof patchVal === "object" &&
      !Array.isArray(patchVal) &&
      targetVal !== null &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetVal as Record<string, unknown>,
        patchVal as Record<string, unknown>,
      );
    } else {
      (result as Record<string, unknown>)[key] = patchVal;
    }
  }

  return result;
}

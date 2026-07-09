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

import type { KubeList, KubeStatus, WatchEvent } from "@/types/kubernetes";
import { getCachedAppConfig } from "@/api/config";

const KUBE_PREFIX = "/api/kube";

export class KubeApiError extends Error {
  status: KubeStatus;
  code: number;

  constructor(status: KubeStatus) {
    super(status.message);
    this.name = "KubeApiError";
    this.status = status;
    this.code = status.code;
  }
}

function assertWritable(): void {
  if (getCachedAppConfig()?.readOnly) {
    throw new KubeApiError({
      kind: "Status",
      apiVersion: "v1",
      status: "Failure",
      message: "Dashboard is running in read-only mode",
      reason: "Forbidden",
      code: 403,
    });
  }
}

async function toKubeError(response: Response): Promise<KubeApiError> {
  if (response.status === 401) {
    window.location.href = "/login";
    throw new KubeApiError({
      kind: "Status",
      apiVersion: "v1",
      status: "Failure",
      message: "Unauthorized",
      reason: "Unauthorized",
      code: 401,
    });
  }
  try {
    const body = (await response.json()) as KubeStatus;
    return new KubeApiError(body);
  } catch {
    return new KubeApiError({
      kind: "Status",
      apiVersion: "v1",
      status: "Failure",
      message: `${String(response.status)} ${response.statusText}`,
      reason: response.statusText,
      code: response.status,
    });
  }
}

export async function kubeGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${KUBE_PREFIX}${path}`, { credentials: "include", signal });
  if (!response.ok) {
    throw await toKubeError(response);
  }
  return response.json() as Promise<T>;
}

export async function kubeList<T>(
  path: string,
  params?: {
    labelSelector?: string;
    fieldSelector?: string;
    limit?: number;
    continue?: string;
  },
  signal?: AbortSignal,
): Promise<KubeList<T>> {
  const url = new URL(`${KUBE_PREFIX}${path}`, window.location.origin);
  if (params?.labelSelector) url.searchParams.set("labelSelector", params.labelSelector);
  if (params?.fieldSelector) url.searchParams.set("fieldSelector", params.fieldSelector);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.continue) url.searchParams.set("continue", params.continue);

  const response = await fetch(url.toString(), { credentials: "include", signal });
  if (!response.ok) {
    throw await toKubeError(response);
  }
  return response.json() as Promise<KubeList<T>>;
}

export async function kubeCreate<T>(path: string, body: T): Promise<T> {
  assertWritable();
  const response = await fetch(`${KUBE_PREFIX}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await toKubeError(response);
  }
  return response.json() as Promise<T>;
}

export async function kubeUpdate<T>(path: string, body: T): Promise<T> {
  assertWritable();
  const response = await fetch(`${KUBE_PREFIX}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await toKubeError(response);
  }
  return response.json() as Promise<T>;
}

export async function kubeDelete(path: string): Promise<void> {
  assertWritable();
  const response = await fetch(`${KUBE_PREFIX}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw await toKubeError(response);
  }
}

export async function kubePatch<T>(path: string, patch: unknown): Promise<T> {
  assertWritable();
  const response = await fetch(`${KUBE_PREFIX}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/strategic-merge-patch+json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await toKubeError(response);
  }
  return response.json() as Promise<T>;
}

export function kubeWatch<T>(
  path: string,
  resourceVersion: string,
  onEvent: (event: WatchEvent<T>) => void,
  onError: (error: Error) => void,
  onOpen?: () => void,
): () => void {
  const abortController = new AbortController();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${KUBE_PREFIX}${path}${separator}watch=true&resourceVersion=${encodeURIComponent(resourceVersion)}`;

  void (async () => {
    try {
      const response = await fetch(url, { signal: abortController.signal, credentials: "include" });
      if (!response.ok) {
        throw await toKubeError(response);
      }
      onOpen?.();
      if (!response.body) {
        throw new Error("Watch response has no body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.trim()) {
            onEvent(JSON.parse(line) as WatchEvent<T>);
          }
        }
      }

      onError(new Error("watch stream ended"));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => abortController.abort();
}

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

import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { kubeList, kubeWatch } from "@/api/kube";
import type { KubeList, ObjectMeta, WatchEvent } from "@/types/kubernetes";

const MAX_BACKOFF = 30_000;

export function useKubeWatch<T extends { metadata: ObjectMeta }>(
  queryKey: readonly unknown[],
  path: string,
  options?: { labelSelector?: string; enabled?: boolean },
) {
  const queryClient = useQueryClient();
  const backoffRef = useRef(1_000);
  const cleanupRef = useRef<(() => void) | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);

  const query = useQuery<KubeList<T>>({
    queryKey,
    queryFn: () => kubeList<T>(path, { labelSelector: options?.labelSelector }),
    enabled: options?.enabled,
  });

  const resourceVersion = query.data?.metadata.resourceVersion;
  const enabled = options?.enabled !== false && !!resourceVersion;

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (!mounted) return;

      const data = queryClient.getQueryData<KubeList<T>>(stableQueryKey);
      const rv = data?.metadata.resourceVersion;
      if (!rv) return;

      const watchPath = options?.labelSelector
        ? `${path}?labelSelector=${encodeURIComponent(options.labelSelector)}`
        : path;

      cleanupRef.current?.();
      cleanupRef.current = kubeWatch<T>(
        watchPath,
        rv,
        (event: WatchEvent<T>) => {
          backoffRef.current = 1_000;
          handleEvent(queryClient, stableQueryKey, event);
        },
        () => {
          if (!mounted) return;
          const delay = backoffRef.current;
          backoffRef.current = Math.min(delay * 2, MAX_BACKOFF);
          reconnectTimer = setTimeout(connect, delay);
        },
      );
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimer);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // resourceVersion intentionally excluded — watch events update RV in cache,
    // and connect() reads the latest RV on each reconnect
  }, [enabled, path, options?.labelSelector, stableQueryKey, queryClient]);

  return query;
}

function handleEvent<T extends { metadata: ObjectMeta }>(
  queryClient: ReturnType<typeof useQueryClient>,
  key: readonly unknown[],
  event: WatchEvent<T>,
) {
  if (event.type === "ERROR") {
    void queryClient.invalidateQueries({ queryKey: key });
    return;
  }

  queryClient.setQueryData<KubeList<T>>(key, (old) => {
    if (!old) return old;

    const uid = event.object.metadata.uid;

    let items: T[];
    switch (event.type) {
      case "ADDED":
        items =
          uid && old.items.some((item) => item.metadata.uid === uid)
            ? old.items.map((item) => (item.metadata.uid === uid ? event.object : item))
            : [...old.items, event.object];
        break;
      case "MODIFIED":
        items = old.items.map((item) => (item.metadata.uid === uid ? event.object : item));
        break;
      case "DELETED":
        items = old.items.filter((item) => item.metadata.uid !== uid);
        break;
      default:
        items = old.items;
    }

    return {
      ...old,
      metadata: {
        ...old.metadata,
        resourceVersion: event.object.metadata.resourceVersion ?? old.metadata.resourceVersion,
      },
      items,
    };
  });
}

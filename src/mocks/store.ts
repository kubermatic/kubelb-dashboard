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

import type { ObjectMeta } from "@/types/kubernetes";

import { deepMerge, nextResourceVersion } from "./helpers";

interface HasMeta {
  metadata: ObjectMeta;
}

function storeKey(name: string, namespace?: string): string {
  return namespace ? `${namespace}/${name}` : name;
}

export class MockStore<T extends HasMeta> {
  private items: Map<string, T>;

  constructor(seed: T[] = []) {
    this.items = new Map();
    for (const item of seed) {
      const key = storeKey(item.metadata.name, item.metadata.namespace);
      this.items.set(key, item);
    }
  }

  list(namespace?: string): T[] {
    const all = Array.from(this.items.values());
    if (namespace === undefined) return all;
    return all.filter((item) => item.metadata.namespace === namespace);
  }

  get(name: string, namespace?: string): T | undefined {
    return this.items.get(storeKey(name, namespace));
  }

  create(resource: T): T {
    const created = {
      ...resource,
      metadata: {
        ...resource.metadata,
        uid: crypto.randomUUID(),
        resourceVersion: nextResourceVersion(),
        creationTimestamp: new Date().toISOString(),
      },
    };
    const key = storeKey(created.metadata.name, created.metadata.namespace);
    this.items.set(key, created);
    return created;
  }

  update(resource: T): T | undefined {
    const key = storeKey(resource.metadata.name, resource.metadata.namespace);
    if (!this.items.has(key)) return undefined;

    const updated = {
      ...resource,
      metadata: {
        ...resource.metadata,
        resourceVersion: nextResourceVersion(),
      },
    };
    this.items.set(key, updated);
    return updated;
  }

  patch(name: string, patch: Record<string, unknown>, namespace?: string): T | undefined {
    const key = storeKey(name, namespace);
    const existing = this.items.get(key);
    if (!existing) return undefined;

    const patched = deepMerge(existing as unknown as Record<string, unknown>, patch) as T;
    patched.metadata.resourceVersion = nextResourceVersion();
    this.items.set(key, patched);
    return patched;
  }

  delete(name: string, namespace?: string): boolean {
    return this.items.delete(storeKey(name, namespace));
  }
}

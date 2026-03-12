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

interface KubeResource {
  metadata?: Record<string, unknown>;
  status?: unknown;
  [key: string]: unknown;
}

const EDIT_STRIP_METADATA = [
  "managedFields",
  "uid",
  "creationTimestamp",
  "generation",
  "deletionTimestamp",
  "ownerReferences",
  "selfLink",
];

const VIEW_STRIP_METADATA = ["managedFields"];

function stripMetadataFields(resource: unknown, fields: string[]): unknown {
  if (!resource || typeof resource !== "object") return resource;
  const obj = structuredClone(resource) as KubeResource;
  if (obj.metadata && typeof obj.metadata === "object") {
    for (const field of fields) {
      delete obj.metadata[field];
    }
  }
  return obj;
}

export function sanitizeForEdit(resource: unknown): unknown {
  const obj = stripMetadataFields(resource, EDIT_STRIP_METADATA) as KubeResource;
  delete obj.status;
  return obj;
}

export function sanitizeForView(resource: unknown): unknown {
  return stripMetadataFields(resource, VIEW_STRIP_METADATA);
}

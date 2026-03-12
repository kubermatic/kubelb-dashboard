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

import type { UiSchema } from "@rjsf/utils";

const DEFAULT_HIDDEN_METADATA: UiSchema = {
  managedFields: { "ui:widget": "hidden" },
  uid: { "ui:widget": "hidden" },
  resourceVersion: { "ui:widget": "hidden" },
  creationTimestamp: { "ui:widget": "hidden" },
  generation: { "ui:widget": "hidden" },
  deletionTimestamp: { "ui:widget": "hidden" },
  ownerReferences: { "ui:widget": "hidden" },
  selfLink: { "ui:widget": "hidden" },
};

const DEFAULT_HIDDEN: UiSchema = {
  apiVersion: { "ui:widget": "hidden" },
  kind: { "ui:widget": "hidden" },
  metadata: { ...DEFAULT_HIDDEN_METADATA },
  status: { "ui:widget": "hidden" },
};

type ResourceUiConfig = {
  create?: UiSchema;
  edit?: UiSchema;
};

const RESOURCE_OVERRIDES: Record<string, ResourceUiConfig> = {
  Tenant: {
    edit: {
      metadata: {
        name: { "ui:disabled": true },
      },
    },
  },
  SyncSecret: {
    edit: {
      metadata: {
        name: { "ui:disabled": true },
        namespace: { "ui:disabled": true },
      },
    },
  },
  Config: {
    edit: {
      metadata: {
        name: { "ui:disabled": true },
      },
    },
  },
};

function deepMerge(base: UiSchema, override: UiSchema): UiSchema {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      result[key] &&
      typeof result[key] === "object" &&
      typeof override[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key] as UiSchema, override[key] as UiSchema);
    } else {
      result[key] = override[key] as UiSchema;
    }
  }
  return result;
}

export function buildUiSchema(resourceKind: string, mode: "create" | "edit"): UiSchema {
  const overrides = RESOURCE_OVERRIDES[resourceKind]?.[mode];
  if (!overrides) return { ...DEFAULT_HIDDEN };
  return deepMerge(DEFAULT_HIDDEN, overrides);
}

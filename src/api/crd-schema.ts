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

import { kubeGet } from "@/api/kube";
import type { RJSFSchema } from "@rjsf/utils";

interface CRDVersion {
  name: string;
  schema?: {
    openAPIV3Schema?: RJSFSchema;
  };
}

interface CRD {
  spec: {
    versions: CRDVersion[];
  };
}

function stripKubeExtensions(schema: RJSFSchema): RJSFSchema {
  if (Array.isArray(schema)) {
    return (schema as RJSFSchema[]).map((item: RJSFSchema) =>
      typeof item === "object" && item !== null ? stripKubeExtensions(item) : item,
    ) as unknown as RJSFSchema;
  }

  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key.startsWith("x-kubernetes-")) continue;
    result[key] =
      typeof value === "object" && value !== null
        ? stripKubeExtensions(value as RJSFSchema)
        : value;
  }
  return result as RJSFSchema;
}

export async function fetchCRDSchema(crdName: string, version?: string): Promise<RJSFSchema> {
  const crd = await kubeGet<CRD>(
    `/apis/apiextensions.k8s.io/v1/customresourcedefinitions/${crdName}`,
  );

  const versions = crd.spec.versions;
  const ver = version ? versions.find((v) => v.name === version) : versions[0];

  if (!ver?.schema?.openAPIV3Schema) {
    throw new Error(`No schema found for CRD ${crdName}`);
  }

  return stripKubeExtensions(ver.schema.openAPIV3Schema);
}

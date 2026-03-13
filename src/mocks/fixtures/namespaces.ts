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

import type { Namespace } from "@/types/kubernetes";

export const namespaces: Namespace[] = [
  {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      creationTimestamp: "2026-03-13T07:48:44Z",
      labels: {
        "kubernetes.io/metadata.name": "kubelb",
        name: "kubelb",
      },
      name: "kubelb",
      resourceVersion: "684",
      uid: "68ded334-1d95-4dcf-a8c8-989e4552c77f",
    },
    spec: {
      finalizers: ["kubernetes"],
    },
    status: {
      phase: "Active",
    },
  },
  {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      creationTimestamp: "2026-03-13T07:49:51Z",
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubernetes.io/metadata.name": "tenant-primary",
      },
      name: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Tenant",
          name: "primary",
          uid: "9de6902f-7506-44d3-bb64-ea81e9cfe513",
        },
      ],
      resourceVersion: "1338",
      uid: "39d3d9f7-23ac-4724-a474-6521830aadd1",
    },
    spec: {
      finalizers: ["kubernetes"],
    },
    status: {
      phase: "Active",
    },
  },
  {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      creationTimestamp: "2026-03-13T07:49:50Z",
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubernetes.io/metadata.name": "tenant-secondary",
      },
      name: "tenant-secondary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Tenant",
          name: "secondary",
          uid: "b3ccca5d-1e0b-456c-a2cf-58f0ab18ecd8",
        },
      ],
      resourceVersion: "1312",
      uid: "b6ddaa81-76ed-4acb-bc02-6f40b6cf09f9",
    },
    spec: {
      finalizers: ["kubernetes"],
    },
    status: {
      phase: "Active",
    },
  },
];

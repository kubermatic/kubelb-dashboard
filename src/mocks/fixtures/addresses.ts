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

import type { Addresses } from "@/types/kubelb";

export const addresses: Addresses[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Addresses",
    metadata: {
      name: "default",
      namespace: "tenant-primary",
      uid: "2afe4942-cc91-441b-8d41-821b672ea4fe",
      resourceVersion: "1439",
      creationTimestamp: "2026-03-14T09:54:18Z",
      generation: 1,
    },
    spec: {
      addresses: [{ ip: "172.18.0.2" }, { ip: "172.18.0.4" }, { ip: "172.18.0.7" }],
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Addresses",
    metadata: {
      name: "default",
      namespace: "tenant-secondary",
      uid: "5f112a18-43de-4c7e-9f0c-75b3f546247c",
      resourceVersion: "1441",
      creationTimestamp: "2026-03-14T09:54:18Z",
      generation: 1,
    },
    spec: {
      addresses: [{ ip: "172.18.0.3" }],
    },
  },
];

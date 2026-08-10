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

import type { Tenant } from "@/types/kubelb";

export const tenants: Tenant[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Tenant",
    metadata: {
      creationTimestamp: "2026-03-13T07:49:50Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 2,
      name: "primary",
      resourceVersion: "1337",
      uid: "9de6902f-7506-44d3-bb64-ea81e9cfe513",
    },
    spec: {
      allowedDomains: ["**.nip.io", "**.test.local"],
      certificates: {
        allowedDomains: ["**.nip.io", "**.test.local"],
        defaultClusterIssuer: "issuer-self-signed",
      },
      dns: {
        allowedDomains: ["**.nip.io", "**.test.local"],
      },
      gatewayAPI: {
        gatewaySettings: {},
      },
      ingress: {},
      loadBalancer: {},
      propagateAllAnnotations: true,
      tunnel: {},
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Tenant",
    metadata: {
      creationTimestamp: "2026-03-13T07:49:49Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 2,
      name: "secondary",
      resourceVersion: "1310",
      uid: "b3ccca5d-1e0b-456c-a2cf-58f0ab18ecd8",
    },
    spec: {
      allowedDomains: ["**"],
      certificates: {},
      dns: {},
      gatewayAPI: {
        gatewaySettings: {},
      },
      ingress: {},
      loadBalancer: {},
      propagateAllAnnotations: true,
      tunnel: {},
    },
  },
];

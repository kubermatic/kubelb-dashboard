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

import type { Config } from "@/types/kubelb";

export const configs: Config[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Config",
    metadata: {
      creationTimestamp: "2026-03-13T07:49:19Z",
      generation: 1,
      name: "default",
      namespace: "kubelb",
      resourceVersion: "1164",
      uid: "be5e0333-be8e-4e01-b572-b0fea3a186f2",
    },
    spec: {
      certificates: {
        defaultClusterIssuer: "issuer-self-signed",
      },
      defaultAnnotations: {
        service: {
          "load-balancer.hetzner.cloud/location": "fsn1",
        },
      },
      envoyProxy: {
        replicas: 1,
        topology: "shared",
      },
      gatewayAPI: {
        class: "eg",
      },
      ingress: {
        class: "nginx",
      },
      networkPolicy: {
        enable: true,
      },
    },
  },
];

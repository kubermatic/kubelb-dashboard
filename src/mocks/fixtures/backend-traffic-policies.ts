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

import type { GenericResource } from "./types";

export const backendTrafficPolicies: GenericResource[] = [
  {
    apiVersion: "gateway.envoyproxy.io/v1alpha1",
    kind: "BackendTrafficPolicy",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:29Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "grpc-btp",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-grpc-btp",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "65101abb-5ef5-4008-88ab-36d1397b68ae",
          uid: "195f56f9-1c86-473d-9f82-ceac97328743",
        },
      ],
      resourceVersion: "2322",
      uid: "66bab78b-f548-432d-99db-e2e128643f9f",
    },
    spec: {
      circuitBreaker: {
        maxConnections: 200,
        maxParallelRequests: 1024,
        maxParallelRetries: 1024,
        maxPendingRequests: 1024,
      },
      targetRefs: [
        {
          group: "gateway.networking.k8s.io",
          kind: "GRPCRoute",
          name: "default-grpc-streaming",
        },
      ],
    },
    status: {
      ancestors: [
        {
          ancestorRef: {
            group: "gateway.networking.k8s.io",
            kind: "Gateway",
            name: "default-grpc-gw",
            namespace: "tenant-primary",
          },
          conditions: [
            {
              lastTransitionTime: "2026-03-13T07:53:29Z",
              message: "Policy has been accepted.",
              observedGeneration: 1,
              reason: "Accepted",
              status: "True",
              type: "Accepted",
            },
          ],
          controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
        },
      ],
    },
  },
];

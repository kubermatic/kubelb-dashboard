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

import type { Deployment } from "@/types/kubernetes";

export const deployments: Deployment[] = [
  {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      annotations: {
        "deployment.kubernetes.io/revision": "1",
      },
      creationTimestamp: "2026-03-13T07:53:12Z",
      generation: 1,
      labels: {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-grpc-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary",
      },
      name: "envoy-tenant-primary-default-grpc-gw-dd1e96ff",
      namespace: "kubelb",
      ownerReferences: [
        {
          apiVersion: "gateway.networking.k8s.io/v1",
          kind: "GatewayClass",
          name: "eg",
          uid: "3846d2e8-2867-4f22-8aa2-f613041cb7ed",
        },
      ],
      resourceVersion: "2280",
      uid: "9417d534-58a0-46cc-b91e-f47d0fb36621",
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name": "default-grpc-gw",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary",
        },
      },
    },
    status: {
      availableReplicas: 1,
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:53:26Z",
          message: "Deployment has minimum availability.",
          reason: "MinimumReplicasAvailable",
          status: "True",
          type: "Available",
        },
        {
          lastTransitionTime: "2026-03-13T07:53:12Z",
          message:
            'ReplicaSet "envoy-tenant-primary-default-grpc-gw-dd1e96ff-5d866d457b" has successfully progressed.',
          reason: "NewReplicaSetAvailable",
          status: "True",
          type: "Progressing",
        },
      ],
      readyReplicas: 1,
      replicas: 1,
    },
  },
  {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      annotations: {
        "deployment.kubernetes.io/revision": "1",
      },
      creationTimestamp: "2026-03-13T07:53:33Z",
      generation: 1,
      labels: {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name":
          "default-kubelb-int-conv",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-secondary",
      },
      name: "envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766",
      namespace: "kubelb",
      ownerReferences: [
        {
          apiVersion: "gateway.networking.k8s.io/v1",
          kind: "GatewayClass",
          name: "eg",
          uid: "3846d2e8-2867-4f22-8aa2-f613041cb7ed",
        },
      ],
      resourceVersion: "3307",
      uid: "2d5baf17-d339-4ebc-9b90-083fcdd483fb",
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name":
            "default-kubelb-int-conv",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-secondary",
        },
      },
    },
    status: {
      availableReplicas: 1,
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:53:45Z",
          message: "Deployment has minimum availability.",
          reason: "MinimumReplicasAvailable",
          status: "True",
          type: "Available",
        },
        {
          lastTransitionTime: "2026-03-13T07:53:33Z",
          message:
            'ReplicaSet "envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766-7ffc9ffffb" has successfully progressed.',
          reason: "NewReplicaSetAvailable",
          status: "True",
          type: "Progressing",
        },
      ],
      readyReplicas: 1,
      replicas: 1,
    },
  },
];

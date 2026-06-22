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

export const gateways: GenericResource[] = [
  {
    apiVersion: "gateway.networking.k8s.io/v1",
    kind: "Gateway",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:10Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "grpc-gw",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-grpc-gw",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "e86392b0-a310-49f3-acc5-4f9fcdd4462d",
          uid: "87d67570-61e9-4c98-acb2-a3ac0faccc9f",
        },
      ],
      resourceVersion: "288550",
      uid: "4b285a43-f92f-4b8c-b467-891238e57dcb",
    },
    spec: {
      gatewayClassName: "eg",
      listeners: [
        {
          allowedRoutes: {
            kinds: [
              {
                group: "gateway.networking.k8s.io",
                kind: "GRPCRoute",
              },
            ],
            namespaces: {
              from: "Same",
            },
          },
          name: "grpc",
          port: 80,
          protocol: "HTTP",
        },
      ],
    },
    status: {
      addresses: [
        {
          type: "IPAddress",
          value: "172.18.255.205",
        },
      ],
      conditions: [
        {
          lastTransitionTime: "2026-03-13T09:00:50Z",
          message: "The Gateway has been scheduled by Envoy Gateway",
          observedGeneration: 1,
          reason: "Accepted",
          status: "True",
          type: "Accepted",
        },
        {
          lastTransitionTime: "2026-03-13T09:00:50Z",
          message: "Address assigned to the Gateway, 1/1 envoy replicas available",
          observedGeneration: 1,
          reason: "Programmed",
          status: "True",
          type: "Programmed",
        },
      ],
      listeners: [
        {
          attachedRoutes: 1,
          conditions: [
            {
              lastTransitionTime: "2026-03-13T09:00:50Z",
              message: "Sending translated listener configuration to the data plane",
              observedGeneration: 1,
              reason: "Programmed",
              status: "True",
              type: "Programmed",
            },
            {
              lastTransitionTime: "2026-03-13T09:00:50Z",
              message: "Listener has been successfully translated",
              observedGeneration: 1,
              reason: "Accepted",
              status: "True",
              type: "Accepted",
            },
            {
              lastTransitionTime: "2026-03-13T09:00:50Z",
              message: "Listener references have been resolved",
              observedGeneration: 1,
              reason: "ResolvedRefs",
              status: "True",
              type: "ResolvedRefs",
            },
          ],
          name: "grpc",
          supportedKinds: [
            {
              group: "gateway.networking.k8s.io",
              kind: "GRPCRoute",
            },
          ],
        },
      ],
    },
  },
  {
    apiVersion: "gateway.networking.k8s.io/v1",
    kind: "Gateway",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:11Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tcp-gw",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-tcp-gw",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "8f245252-d423-4150-856a-7e5b77398871",
          uid: "f7c9a5e0-1abf-4160-ba7e-54e33efdeba8",
        },
      ],
      resourceVersion: "2439",
      uid: "e5d5843b-ac2d-4cff-8927-b2970b90e69b",
    },
    spec: {
      gatewayClassName: "eg",
      listeners: [
        {
          allowedRoutes: {
            kinds: [
              {
                group: "gateway.networking.k8s.io",
                kind: "TCPRoute",
              },
            ],
            namespaces: {
              from: "Same",
            },
          },
          name: "tcp",
          port: 8088,
          protocol: "TCP",
        },
      ],
    },
    status: {
      addresses: [
        {
          type: "IPAddress",
          value: "172.18.255.207",
        },
      ],
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:53:32Z",
          message: "The Gateway has been scheduled by Envoy Gateway",
          observedGeneration: 1,
          reason: "Accepted",
          status: "True",
          type: "Accepted",
        },
        {
          lastTransitionTime: "2026-03-13T07:53:32Z",
          message: "Address assigned to the Gateway, 1/1 envoy replicas available",
          observedGeneration: 1,
          reason: "Programmed",
          status: "True",
          type: "Programmed",
        },
      ],
      listeners: [
        {
          attachedRoutes: 1,
          conditions: [
            {
              lastTransitionTime: "2026-03-13T07:53:32Z",
              message: "Sending translated listener configuration to the data plane",
              observedGeneration: 1,
              reason: "Programmed",
              status: "True",
              type: "Programmed",
            },
            {
              lastTransitionTime: "2026-03-13T07:53:32Z",
              message: "Listener has been successfully translated",
              observedGeneration: 1,
              reason: "Accepted",
              status: "True",
              type: "Accepted",
            },
            {
              lastTransitionTime: "2026-03-13T07:53:32Z",
              message: "Listener references have been resolved",
              observedGeneration: 1,
              reason: "ResolvedRefs",
              status: "True",
              type: "ResolvedRefs",
            },
          ],
          name: "tcp",
          supportedKinds: [
            {
              group: "gateway.networking.k8s.io",
              kind: "TCPRoute",
            },
          ],
        },
      ],
    },
  },
  {
    apiVersion: "gateway.networking.k8s.io/v1",
    kind: "Gateway",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:27Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tls-gw",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-tls-gw",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "be447368-c6c6-4513-832f-dc3074f13161",
          uid: "817baba2-07a7-46d5-8668-5f96dfe35c62",
        },
      ],
      resourceVersion: "280227",
      uid: "c363408a-2861-4a73-85c6-097590d4df8b",
    },
    spec: {
      gatewayClassName: "eg",
      listeners: [
        {
          allowedRoutes: {
            kinds: [
              {
                group: "gateway.networking.k8s.io",
                kind: "TLSRoute",
              },
            ],
            namespaces: {
              from: "Same",
            },
          },
          name: "tls",
          port: 6443,
          protocol: "TLS",
          tls: {
            mode: "Passthrough",
          },
        },
      ],
    },
    status: {
      addresses: [
        {
          type: "IPAddress",
          value: "172.18.255.210",
        },
      ],
      conditions: [
        {
          lastTransitionTime: "2026-03-13T08:57:26Z",
          message: "The Gateway has been scheduled by Envoy Gateway",
          observedGeneration: 1,
          reason: "Accepted",
          status: "True",
          type: "Accepted",
        },
        {
          lastTransitionTime: "2026-03-13T08:57:26Z",
          message: "Address assigned to the Gateway, 1/1 envoy replicas available",
          observedGeneration: 1,
          reason: "Programmed",
          status: "True",
          type: "Programmed",
        },
      ],
      listeners: [
        {
          attachedRoutes: 1,
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:57:26Z",
              message: "Sending translated listener configuration to the data plane",
              observedGeneration: 1,
              reason: "Programmed",
              status: "True",
              type: "Programmed",
            },
            {
              lastTransitionTime: "2026-03-13T08:57:26Z",
              message: "Listener has been successfully translated",
              observedGeneration: 1,
              reason: "Accepted",
              status: "True",
              type: "Accepted",
            },
            {
              lastTransitionTime: "2026-03-13T08:57:26Z",
              message: "Listener references have been resolved",
              observedGeneration: 1,
              reason: "ResolvedRefs",
              status: "True",
              type: "ResolvedRefs",
            },
          ],
          name: "tls",
          supportedKinds: [
            {
              group: "gateway.networking.k8s.io",
              kind: "TLSRoute",
            },
          ],
        },
      ],
    },
  },
  {
    apiVersion: "gateway.networking.k8s.io/v1",
    kind: "Gateway",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:20Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "udp-gw",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-udp-gw",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "780021bd-e1e1-41e5-8849-ded7f6423481",
          uid: "4dcad595-816e-406e-bf18-ba1fd395ca16",
        },
      ],
      resourceVersion: "254572",
      uid: "1e5d3e0c-69cc-4968-8cfd-d64062f035bd",
    },
    spec: {
      gatewayClassName: "eg",
      listeners: [
        {
          allowedRoutes: {
            kinds: [
              {
                group: "gateway.networking.k8s.io",
                kind: "UDPRoute",
              },
            ],
            namespaces: {
              from: "Same",
            },
          },
          name: "udp",
          port: 5300,
          protocol: "UDP",
        },
      ],
    },
    status: {
      addresses: [
        {
          type: "IPAddress",
          value: "172.18.255.208",
        },
      ],
      conditions: [
        {
          lastTransitionTime: "2026-03-13T08:52:17Z",
          message: "The Gateway has been scheduled by Envoy Gateway",
          observedGeneration: 1,
          reason: "Accepted",
          status: "True",
          type: "Accepted",
        },
        {
          lastTransitionTime: "2026-03-13T08:52:17Z",
          message: "Address assigned to the Gateway, 1/1 envoy replicas available",
          observedGeneration: 1,
          reason: "Programmed",
          status: "True",
          type: "Programmed",
        },
      ],
      listeners: [
        {
          attachedRoutes: 1,
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:52:17Z",
              message: "Sending translated listener configuration to the data plane",
              observedGeneration: 1,
              reason: "Programmed",
              status: "True",
              type: "Programmed",
            },
            {
              lastTransitionTime: "2026-03-13T08:52:17Z",
              message: "Listener has been successfully translated",
              observedGeneration: 1,
              reason: "Accepted",
              status: "True",
              type: "Accepted",
            },
            {
              lastTransitionTime: "2026-03-13T08:52:17Z",
              message: "Listener references have been resolved",
              observedGeneration: 1,
              reason: "ResolvedRefs",
              status: "True",
              type: "ResolvedRefs",
            },
          ],
          name: "udp",
          supportedKinds: [
            {
              group: "gateway.networking.k8s.io",
              kind: "UDPRoute",
            },
          ],
        },
      ],
    },
  },
  {
    apiVersion: "gateway.networking.k8s.io/v1",
    kind: "Gateway",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:29Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "kubelb-int-conv",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-kubelb-int-conv",
      namespace: "tenant-secondary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "713ba961-60b6-4d91-b93c-210fadd4be27",
          uid: "c03de5cb-47a7-4c8b-b8aa-96dac5c41f28",
        },
      ],
      resourceVersion: "280269",
      uid: "2f539063-e596-4311-80d0-fe0bcb1a15be",
    },
    spec: {
      gatewayClassName: "eg",
      listeners: [
        {
          allowedRoutes: {
            namespaces: {
              from: "All",
            },
          },
          name: "http",
          port: 80,
          protocol: "HTTP",
        },
      ],
    },
    status: {
      addresses: [
        {
          type: "IPAddress",
          value: "172.18.255.211",
        },
      ],
      conditions: [
        {
          lastTransitionTime: "2026-03-13T08:57:32Z",
          message: "The Gateway has been scheduled by Envoy Gateway",
          observedGeneration: 1,
          reason: "Accepted",
          status: "True",
          type: "Accepted",
        },
        {
          lastTransitionTime: "2026-03-13T08:57:32Z",
          message: "Address assigned to the Gateway, 1/1 envoy replicas available",
          observedGeneration: 1,
          reason: "Programmed",
          status: "True",
          type: "Programmed",
        },
      ],
      listeners: [
        {
          attachedRoutes: 1,
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:57:32Z",
              message: "Sending translated listener configuration to the data plane",
              observedGeneration: 1,
              reason: "Programmed",
              status: "True",
              type: "Programmed",
            },
            {
              lastTransitionTime: "2026-03-13T08:57:32Z",
              message: "Listener has been successfully translated",
              observedGeneration: 1,
              reason: "Accepted",
              status: "True",
              type: "Accepted",
            },
            {
              lastTransitionTime: "2026-03-13T08:57:32Z",
              message: "Listener references have been resolved",
              observedGeneration: 1,
              reason: "ResolvedRefs",
              status: "True",
              type: "ResolvedRefs",
            },
          ],
          name: "http",
          supportedKinds: [
            {
              group: "gateway.networking.k8s.io",
              kind: "HTTPRoute",
            },
            {
              group: "gateway.networking.k8s.io",
              kind: "GRPCRoute",
            },
          ],
        },
      ],
    },
  },
  {
    apiVersion: "gateway.networking.k8s.io/v1",
    kind: "Gateway",
    metadata: {
      creationTimestamp: "2026-04-10T08:50:00Z",
      generation: 1,
      name: "agentgateway-proxy",
      namespace: "kubelb",
      resourceVersion: "401050",
      uid: "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
    },
    spec: {
      gatewayClassName: "agentgateway",
      listeners: [
        {
          allowedRoutes: { namespaces: { from: "All" } },
          name: "https",
          port: 443,
          protocol: "HTTPS",
        },
        {
          allowedRoutes: { namespaces: { from: "All" } },
          name: "http",
          port: 80,
          protocol: "HTTP",
        },
      ],
    },
    status: {
      addresses: [
        {
          type: "IPAddress",
          value: "172.18.255.210",
        },
      ],
      conditions: [
        {
          lastTransitionTime: "2026-04-10T09:00:50Z",
          message: "The Gateway has been scheduled by agentgateway",
          observedGeneration: 1,
          reason: "Accepted",
          status: "True",
          type: "Accepted",
        },
        {
          lastTransitionTime: "2026-04-10T09:00:50Z",
          message: "The Gateway has been programmed",
          observedGeneration: 1,
          reason: "Programmed",
          status: "True",
          type: "Programmed",
        },
      ],
      listeners: [
        {
          attachedRoutes: 2,
          conditions: [
            {
              lastTransitionTime: "2026-04-10T09:00:50Z",
              message: "Listener has been successfully translated",
              observedGeneration: 1,
              reason: "Programmed",
              status: "True",
              type: "Programmed",
            },
          ],
          name: "http",
          supportedKinds: [
            {
              group: "gateway.networking.k8s.io",
              kind: "HTTPRoute",
            },
          ],
        },
      ],
    },
  },
];

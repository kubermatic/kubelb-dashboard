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

import type { LoadBalancer } from "@/types/kubelb";

export const loadBalancers: LoadBalancer[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:07Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/origin-name": "web-frontend",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "3b511c1a-6b5b-410b-af3e-6d028148a969",
      namespace: "tenant-primary",
      resourceVersion: "1994",
      uid: "8e0788f7-3d3f-4e00-b5cf-8a3cb5f98fc6",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          ports: [
            {
              name: "http",
              port: 30659,
              protocol: "TCP",
            },
          ],
        },
      ],
      externalTrafficPolicy: "Cluster",
      ports: [
        {
          name: "http",
          port: 80,
          protocol: "TCP",
        },
      ],
      type: "LoadBalancer",
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.203",
            ipMode: "VIP",
          },
        ],
      },
      service: {
        ports: [
          {
            name: "http",
            nodePort: 31533,
            port: 80,
            protocol: "TCP",
            targetPort: 57924,
            upstreamTargetPort: 30659,
          },
        ],
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:07Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/origin-name": "api-gateway",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "ab888762-02d4-415d-bf50-766100b4ba73",
      namespace: "tenant-primary",
      resourceVersion: "251482",
      uid: "68f27480-ce7f-4455-a2c7-187a1525f77b",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          ports: [
            {
              name: "http",
              port: 30555,
              protocol: "TCP",
            },
            {
              name: "grpc",
              port: 30341,
              protocol: "TCP",
            },
          ],
        },
      ],
      externalTrafficPolicy: "Cluster",
      ports: [
        {
          name: "http",
          port: 80,
          protocol: "TCP",
        },
        {
          name: "grpc",
          port: 9090,
          protocol: "TCP",
        },
      ],
      type: "LoadBalancer",
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.204",
            ipMode: "VIP",
          },
        ],
      },
      service: {
        ports: [
          {
            name: "grpc",
            nodePort: 31496,
            port: 9090,
            protocol: "TCP",
            targetPort: 63220,
            upstreamTargetPort: 30555,
          },
          {
            name: "http",
            nodePort: 30502,
            port: 80,
            protocol: "TCP",
            targetPort: 63647,
            upstreamTargetPort: 30341,
          },
        ],
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: {
      creationTimestamp: "2026-03-13T07:50:13Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/origin-name": "echo-shared-lb",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "e243fc78-a94c-489f-8c95-389dbfd03c43",
      namespace: "tenant-primary",
      resourceVersion: "1470",
      uid: "4d60da86-b4ce-4975-ba39-957828ac235d",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          ports: [
            {
              name: "80-tcp",
              port: 30601,
              protocol: "TCP",
            },
          ],
        },
      ],
      externalTrafficPolicy: "Cluster",
      ports: [
        {
          name: "80-tcp",
          port: 80,
          protocol: "TCP",
        },
      ],
      type: "LoadBalancer",
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.201",
            ipMode: "VIP",
          },
        ],
      },
      service: {
        ports: [
          {
            name: "80-tcp",
            nodePort: 30494,
            port: 80,
            protocol: "TCP",
            targetPort: 57743,
            upstreamTargetPort: 30601,
          },
        ],
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:12Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/origin-name": "staging-web",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/tenant": "tenant-secondary",
      },
      name: "02c9ab0a-005c-4746-b2d3-276f3e4a2280",
      namespace: "tenant-secondary",
      resourceVersion: "2129",
      uid: "b96f7f1c-dad3-4fff-9700-3bc50d1a6ef7",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          ports: [
            {
              name: "http",
              port: 31082,
              protocol: "TCP",
            },
          ],
        },
      ],
      externalTrafficPolicy: "Cluster",
      ports: [
        {
          name: "http",
          port: 80,
          protocol: "TCP",
        },
      ],
      type: "LoadBalancer",
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.206",
            ipMode: "VIP",
          },
        ],
      },
      service: {
        ports: [
          {
            name: "http",
            nodePort: 30242,
            port: 80,
            protocol: "TCP",
            targetPort: 32897,
            upstreamTargetPort: 31082,
          },
        ],
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "LoadBalancer",
    metadata: {
      creationTimestamp: "2026-03-13T07:50:14Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/origin-name": "echo-shared-lb",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/tenant": "tenant-secondary",
      },
      name: "91c9946e-7828-48c4-86f9-6ca4ac3be70f",
      namespace: "tenant-secondary",
      resourceVersion: "1497",
      uid: "a4132d60-8e7d-4070-8092-72cd9a10b3af",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          ports: [
            {
              name: "80-tcp",
              port: 31069,
              protocol: "TCP",
            },
          ],
        },
      ],
      externalTrafficPolicy: "Cluster",
      ports: [
        {
          name: "80-tcp",
          port: 80,
          protocol: "TCP",
        },
      ],
      type: "LoadBalancer",
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.202",
            ipMode: "VIP",
          },
        ],
      },
      service: {
        ports: [
          {
            name: "80-tcp",
            nodePort: 32188,
            port: 80,
            protocol: "TCP",
            targetPort: 61524,
            upstreamTargetPort: 31069,
          },
        ],
      },
    },
  },
];

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

export const ingresses: GenericResource[] = [
  {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:17Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "api-ingress",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-api-ingress",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "adcdbcca-205b-4d43-84f8-c26d166be6ed",
          uid: "3b0cf518-0d99-4667-96af-5ed5e0d33f6b",
        },
      ],
      resourceVersion: "5732",
      uid: "a560b659-0f7e-468f-a02c-02e4401c15cd",
    },
    spec: {
      ingressClassName: "nginx",
      rules: [
        {
          host: "api.example.nip.io",
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: "default-api-ingress-api-v1",
                    port: {
                      number: 80,
                    },
                  },
                },
                path: "/v1",
                pathType: "Prefix",
              },
              {
                backend: {
                  service: {
                    name: "default-api-ingress-api-health",
                    port: {
                      number: 80,
                    },
                  },
                },
                path: "/health",
                pathType: "Exact",
              },
            ],
          },
        },
        {
          host: "api-v2.example.nip.io",
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: "default-api-ingress-api-v2",
                    port: {
                      number: 80,
                    },
                  },
                },
                path: "/",
                pathType: "Prefix",
              },
            ],
          },
        },
      ],
      tls: [
        {
          hosts: ["api.example.nip.io", "api-v2.example.nip.io"],
          secretName: "66984d5c-a680-4c8e-9789-81656a7e1511",
        },
      ],
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.200",
          },
        ],
      },
    },
  },
  {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:09Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "docs-site",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-docs-site",
      namespace: "tenant-primary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "997c74aa-ea4b-4cc7-9c6d-b7273fa3945f",
          uid: "31ddd265-581e-4954-a790-142d6b658b0a",
        },
      ],
      resourceVersion: "5727",
      uid: "e5ce62cd-8f43-4aff-94f9-5a25f4bc072c",
    },
    spec: {
      ingressClassName: "nginx",
      rules: [
        {
          host: "docs.example.nip.io",
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: "default-docs-site-docs-site",
                    port: {
                      number: 80,
                    },
                  },
                },
                path: "/",
                pathType: "Prefix",
              },
            ],
          },
        },
      ],
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.200",
          },
        ],
      },
    },
  },
  {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      annotations: {
        "kubelb.k8c.io/conversion-status": "pending",
        "kubelb.k8c.io/converted-httproute": "default/staging-app",
      },
      creationTimestamp: "2026-03-13T07:53:28Z",
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "staging-app",
        "kubelb.k8c.io/origin-ns": "default",
      },
      name: "default-staging-app",
      namespace: "tenant-secondary",
      ownerReferences: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          controller: true,
          kind: "Route",
          name: "8c9bf335-e13a-4bcd-bf31-4e02428d33cb",
          uid: "22efd3fa-8626-4ccd-aafc-d4675bded03b",
        },
      ],
      resourceVersion: "5735",
      uid: "80db70f2-8611-43a5-9c4e-d3facde213f0",
    },
    spec: {
      ingressClassName: "nginx",
      rules: [
        {
          host: "staging.example.nip.io",
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: "default-staging-app-staging-web",
                    port: {
                      number: 80,
                    },
                  },
                },
                path: "/",
                pathType: "Prefix",
              },
            ],
          },
        },
      ],
    },
    status: {
      loadBalancer: {
        ingress: [
          {
            ip: "172.18.255.200",
          },
        ],
      },
    },
  },
];

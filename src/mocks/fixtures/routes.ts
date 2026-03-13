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

import type { Route } from "@/types/kubelb";

export const routes: Route[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:09Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "api-ingress",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Ingress.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "adcdbcca-205b-4d43-84f8-c26d166be6ed",
      namespace: "tenant-primary",
      resourceVersion: "5779",
      uid: "3b0cf518-0d99-4667-96af-5ed5e0d33f6b",
    },
    spec: {
      endpoints: [
        {
          addressesReference: { name: "default" },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "networking.k8s.io/v1",
            kind: "Ingress",
            metadata: {
              name: "api-ingress",
              namespace: "default",
              uid: "adcdbcca-205b-4d43-84f8-c26d166be6ed",
            },
            spec: {
              ingressClassName: "kubelb",
              rules: [
                {
                  host: "api.example.nip.io",
                  http: {
                    paths: [
                      {
                        backend: {
                          service: { name: "api-v1", port: { number: 80 } },
                        },
                        path: "/v1",
                        pathType: "Prefix",
                      },
                      {
                        backend: {
                          service: {
                            name: "api-health",
                            port: { number: 80 },
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
                          service: { name: "api-v2", port: { number: 80 } },
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
                  secretName: "api-tls",
                },
              ],
            },
          },
          services: [
            {
              apiVersion: "v1",
              kind: "Service",
              metadata: {
                labels: {
                  "kubelb.k8c.io/managed-by": "kubelb",
                  "kubelb.k8c.io/origin-name": "api-v1",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "api-v1-nodeport",
                namespace: "default",
                uid: "83b2e10c-d1d2-4967-a86f-6052987817b6",
              },
              spec: {
                ports: [
                  {
                    nodePort: 30563,
                    port: 80,
                    protocol: "TCP",
                    targetPort: 8080,
                  },
                ],
                selector: { app: "api-v1" },
                type: "NodePort",
              },
              status: { loadBalancer: {} },
            },
            {
              apiVersion: "v1",
              kind: "Service",
              metadata: {
                labels: {
                  "kubelb.k8c.io/managed-by": "kubelb",
                  "kubelb.k8c.io/origin-name": "api-health",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "api-health-nodeport",
                namespace: "default",
                uid: "342c2484-06a1-4865-ae36-b801e7c5ebce",
              },
              spec: {
                ports: [
                  {
                    nodePort: 30566,
                    port: 80,
                    protocol: "TCP",
                    targetPort: 8080,
                  },
                ],
                selector: { app: "api-health" },
                type: "NodePort",
              },
              status: { loadBalancer: {} },
            },
            {
              apiVersion: "v1",
              kind: "Service",
              metadata: {
                labels: {
                  "kubelb.k8c.io/managed-by": "kubelb",
                  "kubelb.k8c.io/origin-name": "api-v2",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "api-v2-nodeport",
                namespace: "default",
                uid: "3eae1c66-7168-4f72-a832-6dcb2d405fa1",
              },
              spec: {
                ports: [
                  {
                    nodePort: 32260,
                    port: 80,
                    protocol: "TCP",
                    targetPort: 8080,
                  },
                ],
                selector: { app: "api-v2" },
                type: "NodePort",
              },
              status: { loadBalancer: {} },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "networking.k8s.io/v1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T07:53:58Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-api-ingress",
          kind: "Ingress",
          name: "api-ingress",
          namespace: "default",
          status: {
            loadBalancer: {
              ingress: [{ ip: "172.18.255.200" }],
            },
          },
        },
        services: {
          "default/api-health": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T07:53:58Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-api-ingress-api-health",
            name: "api-health",
            namespace: "default",
            ports: [{ port: 80, protocol: "TCP", targetPort: 57619 }],
            status: { loadBalancer: {} },
          },
          "default/api-v1": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T07:53:58Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-api-ingress-api-v1",
            name: "api-v1",
            namespace: "default",
            ports: [{ port: 80, protocol: "TCP", targetPort: 54967 }],
            status: { loadBalancer: {} },
          },
          "default/api-v2": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T07:53:58Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-api-ingress-api-v2",
            name: "api-v2",
            namespace: "default",
            ports: [{ port: 80, protocol: "TCP", targetPort: 12526 }],
            status: { loadBalancer: {} },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:08Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "docs-site",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Ingress.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "997c74aa-ea4b-4cc7-9c6d-b7273fa3945f",
      namespace: "tenant-primary",
      resourceVersion: "5777",
      uid: "31ddd265-581e-4954-a790-142d6b658b0a",
    },
    spec: {
      endpoints: [
        {
          addressesReference: { name: "default" },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "networking.k8s.io/v1",
            kind: "Ingress",
            metadata: {
              name: "docs-site",
              namespace: "default",
              uid: "997c74aa-ea4b-4cc7-9c6d-b7273fa3945f",
            },
            spec: {
              ingressClassName: "kubelb",
              rules: [
                {
                  host: "docs.example.nip.io",
                  http: {
                    paths: [
                      {
                        backend: {
                          service: {
                            name: "docs-site",
                            port: { number: 80 },
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
          },
          services: [
            {
              apiVersion: "v1",
              kind: "Service",
              metadata: {
                labels: {
                  "kubelb.k8c.io/managed-by": "kubelb",
                  "kubelb.k8c.io/origin-name": "docs-site",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "docs-site-nodeport",
                namespace: "default",
                uid: "0044e2da-0523-4f62-bb09-02db563269a5",
              },
              spec: {
                ports: [
                  {
                    nodePort: 32659,
                    port: 80,
                    protocol: "TCP",
                    targetPort: 8080,
                  },
                ],
                selector: { app: "docs-site" },
                type: "NodePort",
              },
              status: { loadBalancer: {} },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "networking.k8s.io/v1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T07:53:58Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-docs-site",
          kind: "Ingress",
          name: "docs-site",
          namespace: "default",
          status: {
            loadBalancer: {
              ingress: [{ ip: "172.18.255.200" }],
            },
          },
        },
        services: {
          "default/docs-site": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T07:53:58Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-docs-site-docs-site",
            name: "docs-site",
            namespace: "default",
            ports: [{ port: 80, protocol: "TCP", targetPort: 62889 }],
            status: { loadBalancer: {} },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:13Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 2,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "staging-app",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Ingress.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-secondary",
      },
      name: "8c9bf335-e13a-4bcd-bf31-4e02428d33cb",
      namespace: "tenant-secondary",
      resourceVersion: "5797",
      uid: "22efd3fa-8626-4ccd-aafc-d4675bded03b",
    },
    spec: {
      endpoints: [
        {
          addressesReference: { name: "default" },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "networking.k8s.io/v1",
            kind: "Ingress",
            metadata: {
              annotations: {
                "kubelb.k8c.io/conversion-status": "pending",
                "kubelb.k8c.io/converted-httproute":
                  "default/staging-app",
              },
              name: "staging-app",
              namespace: "default",
              uid: "8c9bf335-e13a-4bcd-bf31-4e02428d33cb",
            },
            spec: {
              ingressClassName: "kubelb",
              rules: [
                {
                  host: "staging.example.nip.io",
                  http: {
                    paths: [
                      {
                        backend: {
                          service: {
                            name: "staging-web",
                            port: { number: 80 },
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
          },
          services: [
            {
              apiVersion: "v1",
              kind: "Service",
              metadata: {
                name: "staging-web",
                namespace: "default",
                uid: "02c9ab0a-005c-4746-b2d3-276f3e4a2280",
              },
              spec: {
                allocateLoadBalancerNodePorts: true,
                ports: [
                  {
                    name: "http",
                    nodePort: 31082,
                    port: 80,
                    protocol: "TCP",
                    targetPort: 8080,
                  },
                ],
                selector: { app: "staging-web" },
                type: "LoadBalancer",
              },
              status: { loadBalancer: {} },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "networking.k8s.io/v1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T07:53:58Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-staging-app",
          kind: "Ingress",
          name: "staging-app",
          namespace: "default",
          status: {
            loadBalancer: {
              ingress: [{ ip: "172.18.255.200" }],
            },
          },
        },
        services: {
          "tenant-secondary/default-staging-app-staging-web": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T07:53:58Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-staging-app-staging-web",
            name: "default-staging-app-staging-web",
            namespace: "tenant-secondary",
            ports: [
              {
                name: "http",
                nodePort: 32420,
                port: 80,
                protocol: "TCP",
                targetPort: 24194,
              },
            ],
            status: { loadBalancer: {} },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:14Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "kubelb-int-conv",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind":
          "Gateway.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-secondary",
      },
      name: "713ba961-60b6-4d91-b93c-210fadd4be27",
      namespace: "tenant-secondary",
      resourceVersion: "3340",
      uid: "c03de5cb-47a7-4c8b-b8aa-96dac5c41f28",
    },
    spec: {
      endpoints: [
        {
          addressesReference: { name: "default" },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "Gateway",
            metadata: {
              labels: {
                "kubelb.k8c.io/managed-by": "ingress-conversion-controller",
              },
              name: "kubelb-int-conv",
              namespace: "default",
              uid: "713ba961-60b6-4d91-b93c-210fadd4be27",
            },
            spec: {
              gatewayClassName: "kubelb",
              listeners: [
                {
                  allowedRoutes: { namespaces: { from: "All" } },
                  name: "http",
                  port: 80,
                  protocol: "HTTP",
                },
              ],
            },
          },
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.networking.k8s.io/v1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T07:53:45Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-kubelb-int-conv",
          kind: "Gateway",
          name: "kubelb-int-conv",
          namespace: "default",
          status: {
            addresses: [{ type: "IPAddress", value: "172.18.255.211" }],
            conditions: [
              {
                lastTransitionTime: "2026-03-13T07:53:45Z",
                message:
                  "The Gateway has been scheduled by Envoy Gateway",
                observedGeneration: 1,
                reason: "Accepted",
                status: "True",
                type: "Accepted",
              },
              {
                lastTransitionTime: "2026-03-13T07:53:45Z",
                message:
                  "Address assigned to the Gateway, 1/1 envoy replicas available",
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
                    lastTransitionTime: "2026-03-13T07:53:45Z",
                    message:
                      "Sending translated listener configuration to the data plane",
                    observedGeneration: 1,
                    reason: "Programmed",
                    status: "True",
                    type: "Programmed",
                  },
                  {
                    lastTransitionTime: "2026-03-13T07:53:45Z",
                    message:
                      "Listener has been successfully translated",
                    observedGeneration: 1,
                    reason: "Accepted",
                    status: "True",
                    type: "Accepted",
                  },
                  {
                    lastTransitionTime: "2026-03-13T07:53:45Z",
                    message: "Listener references have been resolved",
                    observedGeneration: 1,
                    reason: "ResolvedRefs",
                    status: "True",
                    type: "ResolvedRefs",
                  },
                ],
                name: "http",
                supportedKinds: [
                  { group: "gateway.networking.k8s.io", kind: "HTTPRoute" },
                  { group: "gateway.networking.k8s.io", kind: "GRPCRoute" },
                ],
              },
            ],
          },
        },
      },
    },
  },
];

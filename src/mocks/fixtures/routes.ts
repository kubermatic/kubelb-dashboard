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
      creationTimestamp: "2026-03-13T07:53:12Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "product-btp",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "BackendTrafficPolicy.gateway.envoyproxy.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "24691b93-49f1-44cb-9a08-1124c514db72",
      namespace: "tenant-primary",
      resourceVersion: "2290",
      uid: "86e1e5b1-a169-4000-be0a-f23f1a3221da",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.envoyproxy.io/v1alpha1",
            kind: "BackendTrafficPolicy",
            metadata: {
              name: "product-btp",
              namespace: "default",
              uid: "24691b93-49f1-44cb-9a08-1124c514db72",
            },
            spec: {
              circuitBreaker: {
                maxConnections: 100,
                maxParallelRequests: 1024,
                maxParallelRetries: 1024,
                maxPendingRequests: 50,
              },
              targetRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "HTTPRoute",
                  name: "product-service",
                },
              ],
            },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:10Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "udp-dns-route",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "UDPRoute.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "4fa7ccdf-c444-4567-8845-65fab022683c",
      namespace: "tenant-primary",
      resourceVersion: "251517",
      uid: "d3b9ab1a-0ac1-4fde-a12c-1692a67425f7",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1alpha2",
            kind: "UDPRoute",
            metadata: {
              name: "udp-dns-route",
              namespace: "default",
              uid: "4fa7ccdf-c444-4567-8845-65fab022683c",
            },
            spec: {
              parentRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "udp-gw",
                  sectionName: "udp",
                },
              ],
              rules: [
                {
                  backendRefs: [
                    {
                      group: "",
                      kind: "Service",
                      name: "udp-coredns",
                      port: 53,
                      weight: 1,
                    },
                  ],
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
                  "kubelb.k8c.io/origin-name": "udp-coredns",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "udp-coredns-nodeport",
                namespace: "default",
                uid: "702317c4-3226-497c-9cdd-6cc18290f575",
              },
              spec: {
                ports: [
                  {
                    nodePort: 32122,
                    port: 53,
                    protocol: "UDP",
                    targetPort: 53,
                  },
                ],
                selector: {
                  app: "udp-coredns",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.networking.k8s.io/v1alpha2",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:51:01Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-udp-dns-route",
          kind: "UDPRoute",
          name: "udp-dns-route",
          namespace: "default",
          status: {
            parents: [
              {
                conditions: [
                  {
                    lastTransitionTime: "2026-03-13T07:53:23Z",
                    message: "Route is accepted",
                    observedGeneration: 1,
                    reason: "Accepted",
                    status: "True",
                    type: "Accepted",
                  },
                  {
                    lastTransitionTime: "2026-03-13T07:53:23Z",
                    message: "Resolved all the Object references for the Route",
                    observedGeneration: 1,
                    reason: "ResolvedRefs",
                    status: "True",
                    type: "ResolvedRefs",
                  },
                ],
                controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
                parentRef: {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "default-udp-gw",
                  sectionName: "udp",
                },
              },
            ],
          },
        },
        services: {
          "default/udp-coredns": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-udp-dns-route-udp-coredns",
            name: "udp-coredns",
            namespace: "default",
            ports: [
              {
                port: 53,
                protocol: "UDP",
                targetPort: 58459,
              },
            ],
            status: {
              loadBalancer: {},
            },
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
        "kubelb.k8c.io/origin-name": "grpc-btp",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "BackendTrafficPolicy.gateway.envoyproxy.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "65101abb-5ef5-4008-88ab-36d1397b68ae",
      namespace: "tenant-primary",
      resourceVersion: "251475",
      uid: "195f56f9-1c86-473d-9f82-ceac97328743",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.envoyproxy.io/v1alpha1",
            kind: "BackendTrafficPolicy",
            metadata: {
              name: "grpc-btp",
              namespace: "default",
              uid: "65101abb-5ef5-4008-88ab-36d1397b68ae",
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
                  name: "grpc-streaming",
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
          apiVersion: "gateway.envoyproxy.io/v1alpha1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:51:00Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-grpc-btp",
          kind: "BackendTrafficPolicy",
          name: "grpc-btp",
          namespace: "default",
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
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:10Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "udp-gw",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Gateway.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "780021bd-e1e1-41e5-8849-ded7f6423481",
      namespace: "tenant-primary",
      resourceVersion: "254601",
      uid: "4dcad595-816e-406e-bf18-ba1fd395ca16",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "Gateway",
            metadata: {
              name: "udp-gw",
              namespace: "default",
              uid: "780021bd-e1e1-41e5-8849-ded7f6423481",
            },
            spec: {
              gatewayClassName: "kubelb",
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
              lastTransitionTime: "2026-03-13T08:52:18Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-udp-gw",
          kind: "Gateway",
          name: "udp-gw",
          namespace: "default",
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
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:09Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "grpc-streaming",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "GRPCRoute.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "84e07908-2882-42ee-aac9-40e363f6fde0",
      namespace: "tenant-primary",
      resourceVersion: "251484",
      uid: "a8a24a3b-8024-4e33-9afe-7ce2578ba534",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "GRPCRoute",
            metadata: {
              name: "grpc-streaming",
              namespace: "default",
              uid: "84e07908-2882-42ee-aac9-40e363f6fde0",
            },
            spec: {
              hostnames: ["grpc.example.nip.io"],
              parentRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "grpc-gw",
                },
              ],
              rules: [
                {
                  backendRefs: [
                    {
                      group: "",
                      kind: "Service",
                      name: "grpc-yages",
                      port: 9000,
                      weight: 1,
                    },
                  ],
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
                  "kubelb.k8c.io/origin-name": "grpc-yages",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "grpc-yages-nodeport",
                namespace: "default",
                uid: "7f2468d6-9409-41f2-96b9-1d7ee46a3130",
              },
              spec: {
                ports: [
                  {
                    nodePort: 30535,
                    port: 9000,
                    protocol: "TCP",
                    targetPort: 9000,
                  },
                ],
                selector: {
                  app: "grpc-yages",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.networking.k8s.io/v1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:51:00Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-grpc-streaming",
          kind: "GRPCRoute",
          name: "grpc-streaming",
          namespace: "default",
          status: {
            parents: [
              {
                conditions: [
                  {
                    lastTransitionTime: "2026-03-13T07:53:11Z",
                    message: "Route is accepted",
                    observedGeneration: 1,
                    reason: "Accepted",
                    status: "True",
                    type: "Accepted",
                  },
                  {
                    lastTransitionTime: "2026-03-13T07:53:11Z",
                    message: "Resolved all the Object references for the Route",
                    observedGeneration: 1,
                    reason: "ResolvedRefs",
                    status: "True",
                    type: "ResolvedRefs",
                  },
                ],
                controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
                parentRef: {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "default-grpc-gw",
                },
              },
            ],
          },
        },
        services: {
          "default/grpc-yages": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:00Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-grpc-streaming-grpc-yages",
            name: "grpc-yages",
            namespace: "default",
            ports: [
              {
                port: 9000,
                protocol: "TCP",
                targetPort: 13486,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:11Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "product-ctp",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "ClientTrafficPolicy.gateway.envoyproxy.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "85edfd4f-97cb-4c51-97ef-c7fa3cf61fcb",
      namespace: "tenant-primary",
      resourceVersion: "2237",
      uid: "01798a79-3dad-4bce-8f8a-234964301041",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.envoyproxy.io/v1alpha1",
            kind: "ClientTrafficPolicy",
            metadata: {
              name: "product-ctp",
              namespace: "default",
              uid: "85edfd4f-97cb-4c51-97ef-c7fa3cf61fcb",
            },
            spec: {
              targetRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "kubelb",
                },
              ],
              timeout: {
                http: {
                  requestReceivedTimeout: "30s",
                },
              },
            },
          },
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.envoyproxy.io/v1alpha1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T16:45:19Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-product-ctp",
          kind: "ClientTrafficPolicy",
          name: "product-ctp",
          namespace: "default",
          status: {
            ancestors: [
              {
                ancestorRef: {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "kubelb",
                  namespace: "tenant-primary",
                },
                conditions: [
                  {
                    lastTransitionTime: "2026-03-13T16:45:16Z",
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
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:09Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tcp-gw",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Gateway.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "8f245252-d423-4150-856a-7e5b77398871",
      namespace: "tenant-primary",
      resourceVersion: "251542",
      uid: "f7c9a5e0-1abf-4160-ba7e-54e33efdeba8",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "Gateway",
            metadata: {
              name: "tcp-gw",
              namespace: "default",
              uid: "8f245252-d423-4150-856a-7e5b77398871",
            },
            spec: {
              gatewayClassName: "kubelb",
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
              lastTransitionTime: "2026-03-13T08:51:01Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-tcp-gw",
          kind: "Gateway",
          name: "tcp-gw",
          namespace: "default",
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
      resourceVersion: "251513",
      uid: "31ddd265-581e-4954-a790-142d6b658b0a",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
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
                "kubelb.k8c.io/manage-dns": "true",
                "kubelb.k8c.io/manage-certificates": "true",
                "external-dns.alpha.kubernetes.io/hostname": "docs.example.com",
                "cert-manager.io/cluster-issuer": "letsencrypt-prod",
              },
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
                selector: {
                  app: "docs-site",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
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
              lastTransitionTime: "2026-03-13T08:51:01Z",
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
              ingress: [
                {
                  ip: "172.18.255.200",
                },
              ],
            },
          },
        },
        services: {
          "default/docs-site": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-docs-site-docs-site",
            name: "docs-site",
            namespace: "default",
            ports: [
              {
                port: 80,
                protocol: "TCP",
                targetPort: 62889,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:11Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tls-passthrough",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "TLSRoute.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "a390f3fc-31cf-4de9-a85e-165776cfdbed",
      namespace: "tenant-primary",
      resourceVersion: "251544",
      uid: "9a95b42b-f84a-4a05-a8a4-03ebbb7e6a7b",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1alpha2",
            kind: "TLSRoute",
            metadata: {
              name: "tls-passthrough",
              namespace: "default",
              uid: "a390f3fc-31cf-4de9-a85e-165776cfdbed",
            },
            spec: {
              hostnames: ["tls-app.example.nip.io"],
              parentRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "tls-gw",
                  sectionName: "tls",
                },
              ],
              rules: [
                {
                  backendRefs: [
                    {
                      group: "",
                      kind: "Service",
                      name: "tls-nginx",
                      port: 443,
                      weight: 1,
                    },
                  ],
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
                  "kubelb.k8c.io/origin-name": "tls-nginx",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "tls-nginx-nodeport",
                namespace: "default",
                uid: "5f95588b-0b46-424b-8237-c246360321d1",
              },
              spec: {
                ports: [
                  {
                    nodePort: 31413,
                    port: 443,
                    protocol: "TCP",
                    targetPort: 443,
                  },
                ],
                selector: {
                  app: "tls-nginx",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.networking.k8s.io/v1alpha2",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:51:01Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-tls-passthrough",
          kind: "TLSRoute",
          name: "tls-passthrough",
          namespace: "default",
          status: {
            parents: [
              {
                conditions: [
                  {
                    lastTransitionTime: "2026-03-13T07:53:32Z",
                    message: "Route is accepted",
                    observedGeneration: 2,
                    reason: "Accepted",
                    status: "True",
                    type: "Accepted",
                  },
                  {
                    lastTransitionTime: "2026-03-13T07:53:32Z",
                    message: "Resolved all the Object references for the Route",
                    observedGeneration: 2,
                    reason: "ResolvedRefs",
                    status: "True",
                    type: "ResolvedRefs",
                  },
                ],
                controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
                parentRef: {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "default-tls-gw",
                  sectionName: "tls",
                },
              },
            ],
          },
        },
        services: {
          "default/tls-nginx": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-tls-passthrough-tls-nginx",
            name: "tls-nginx",
            namespace: "default",
            ports: [
              {
                port: 443,
                protocol: "TCP",
                targetPort: 41555,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
        },
      },
    },
  },
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
      resourceVersion: "251511",
      uid: "3b0cf518-0d99-4667-96af-5ed5e0d33f6b",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
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
                          service: {
                            name: "api-v1",
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
                            name: "api-health",
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
                            name: "api-v2",
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
                selector: {
                  app: "api-v1",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
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
                selector: {
                  app: "api-health",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
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
                selector: {
                  app: "api-v2",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
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
              lastTransitionTime: "2026-03-13T08:51:01Z",
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
              ingress: [
                {
                  ip: "172.18.255.200",
                },
              ],
            },
          },
        },
        services: {
          "default/api-health": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-api-ingress-api-health",
            name: "api-health",
            namespace: "default",
            ports: [
              {
                port: 80,
                protocol: "TCP",
                targetPort: 57619,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
          "default/api-v1": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-api-ingress-api-v1",
            name: "api-v1",
            namespace: "default",
            ports: [
              {
                port: 80,
                protocol: "TCP",
                targetPort: 54967,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
          "default/api-v2": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-api-ingress-api-v2",
            name: "api-v2",
            namespace: "default",
            ports: [
              {
                port: 80,
                protocol: "TCP",
                targetPort: 12526,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
        },
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:12Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tls-gw",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Gateway.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "be447368-c6c6-4513-832f-dc3074f13161",
      namespace: "tenant-primary",
      resourceVersion: "280288",
      uid: "817baba2-07a7-46d5-8668-5f96dfe35c62",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "Gateway",
            metadata: {
              name: "tls-gw",
              namespace: "default",
              uid: "be447368-c6c6-4513-832f-dc3074f13161",
            },
            spec: {
              gatewayClassName: "kubelb",
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
              lastTransitionTime: "2026-03-13T08:57:33Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-tls-gw",
          kind: "Gateway",
          name: "tls-gw",
          namespace: "default",
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
        "kubelb.k8c.io/origin-name": "grpc-gw",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "Gateway.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "e86392b0-a310-49f3-acc5-4f9fcdd4462d",
      namespace: "tenant-primary",
      resourceVersion: "288560",
      uid: "87d67570-61e9-4c98-acb2-a3ac0faccc9f",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "Gateway",
            metadata: {
              name: "grpc-gw",
              namespace: "default",
              uid: "e86392b0-a310-49f3-acc5-4f9fcdd4462d",
            },
            spec: {
              gatewayClassName: "kubelb",
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
              lastTransitionTime: "2026-03-13T09:00:51Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-grpc-gw",
          kind: "Gateway",
          name: "grpc-gw",
          namespace: "default",
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
      },
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:10Z",
      finalizers: ["kubelb.k8c.io/cleanup"],
      generation: 1,
      labels: {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tcp-echo-route",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "TCPRoute.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-primary",
      },
      name: "ef106272-41d1-481e-922b-e17381f5096e",
      namespace: "tenant-primary",
      resourceVersion: "251509",
      uid: "7d72c149-97ff-4388-a465-f4718c0bb799",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1alpha2",
            kind: "TCPRoute",
            metadata: {
              name: "tcp-echo-route",
              namespace: "default",
              uid: "ef106272-41d1-481e-922b-e17381f5096e",
            },
            spec: {
              parentRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "tcp-gw",
                  sectionName: "tcp",
                },
              ],
              rules: [
                {
                  backendRefs: [
                    {
                      group: "",
                      kind: "Service",
                      name: "tcp-echo",
                      port: 3000,
                      weight: 1,
                    },
                  ],
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
                  "kubelb.k8c.io/origin-name": "tcp-echo",
                  "kubelb.k8c.io/origin-ns": "default",
                },
                name: "tcp-echo-nodeport",
                namespace: "default",
                uid: "7ffbcb9b-f5ac-4781-81e6-173a7971ad00",
              },
              spec: {
                ports: [
                  {
                    nodePort: 32059,
                    port: 3000,
                    protocol: "TCP",
                    targetPort: 3000,
                  },
                ],
                selector: {
                  app: "tcp-echo",
                },
                type: "NodePort",
              },
              status: {
                loadBalancer: {},
              },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.networking.k8s.io/v1alpha2",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T08:51:01Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-tcp-echo-route",
          kind: "TCPRoute",
          name: "tcp-echo-route",
          namespace: "default",
          status: {
            parents: [
              {
                conditions: [
                  {
                    lastTransitionTime: "2026-03-13T07:53:18Z",
                    message: "Route is accepted",
                    observedGeneration: 1,
                    reason: "Accepted",
                    status: "True",
                    type: "Accepted",
                  },
                  {
                    lastTransitionTime: "2026-03-13T07:53:18Z",
                    message: "Resolved all the Object references for the Route",
                    observedGeneration: 1,
                    reason: "ResolvedRefs",
                    status: "True",
                    type: "ResolvedRefs",
                  },
                ],
                controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
                parentRef: {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "default-tcp-gw",
                  sectionName: "tcp",
                },
              },
            ],
          },
        },
        services: {
          "default/tcp-echo": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:01Z",
                message: "Success",
                reason: "InstallationSuccessful",
                status: "True",
                type: "ResourceAppliedSuccessfully",
              },
            ],
            generatedName: "default-tcp-echo-route-tcp-echo",
            name: "tcp-echo",
            namespace: "default",
            ports: [
              {
                port: 3000,
                protocol: "TCP",
                targetPort: 50247,
              },
            ],
            status: {
              loadBalancer: {},
            },
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
        "kubelb.k8c.io/origin-resource-kind": "Gateway.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-secondary",
      },
      name: "713ba961-60b6-4d91-b93c-210fadd4be27",
      namespace: "tenant-secondary",
      resourceVersion: "280311",
      uid: "c03de5cb-47a7-4c8b-b8aa-96dac5c41f28",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
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
              lastTransitionTime: "2026-03-13T08:57:34Z",
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
      resourceVersion: "251500",
      uid: "22efd3fa-8626-4ccd-aafc-d4675bded03b",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
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
                "kubelb.k8c.io/converted-httproute": "default/staging-app",
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
                selector: {
                  app: "staging-web",
                },
                type: "LoadBalancer",
              },
              status: {
                loadBalancer: {},
              },
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
              lastTransitionTime: "2026-03-13T08:51:00Z",
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
              ingress: [
                {
                  ip: "172.18.255.200",
                },
              ],
            },
          },
        },
        services: {
          "tenant-secondary/default-staging-app-staging-web": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T08:51:00Z",
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
                nodePort: 31277,
                port: 80,
                protocol: "TCP",
                targetPort: 59394,
              },
            ],
            status: {
              loadBalancer: {},
            },
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
        "kubelb.k8c.io/origin-name": "staging-app",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/origin-resource-kind": "HTTPRoute.gateway.networking.k8s.io",
        "kubelb.k8c.io/tenant": "tenant-secondary",
      },
      name: "f8acc75b-b2b5-43c7-9b17-23bc4227526d",
      namespace: "tenant-secondary",
      resourceVersion: "313001",
      uid: "6c3d3d88-4bfd-48f8-ab92-51834e54069f",
    },
    spec: {
      endpoints: [
        {
          addressesReference: {
            name: "default",
          },
          name: "default",
        },
      ],
      source: {
        kubernetes: {
          resource: {
            apiVersion: "gateway.networking.k8s.io/v1",
            kind: "HTTPRoute",
            metadata: {
              annotations: {
                "kubelb.k8c.io/manage-dns": "true",
                "external-dns.alpha.kubernetes.io/hostname": "staging.example.com",
              },
              labels: {
                "kubelb.k8c.io/source-ingress": "staging-app.default",
              },
              name: "staging-app",
              namespace: "default",
              uid: "f8acc75b-b2b5-43c7-9b17-23bc4227526d",
            },
            spec: {
              hostnames: ["staging.example.nip.io"],
              parentRefs: [
                {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "kubelb-int-conv",
                },
              ],
              rules: [
                {
                  backendRefs: [
                    {
                      group: "",
                      kind: "Service",
                      name: "staging-web",
                      port: 80,
                      weight: 1,
                    },
                  ],
                  matches: [
                    {
                      path: {
                        type: "PathPrefix",
                        value: "/",
                      },
                    },
                  ],
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
                selector: {
                  app: "staging-web",
                },
                type: "LoadBalancer",
              },
              status: {
                loadBalancer: {},
              },
            },
          ],
        },
      },
    },
    status: {
      resources: {
        route: {
          apiVersion: "gateway.networking.k8s.io/v1",
          conditions: [
            {
              lastTransitionTime: "2026-03-13T09:06:58Z",
              message: "Success",
              reason: "InstallationSuccessful",
              status: "True",
              type: "ResourceAppliedSuccessfully",
            },
          ],
          generatedName: "default-staging-app",
          kind: "HTTPRoute",
          name: "staging-app",
          namespace: "default",
          status: {
            parents: [
              {
                conditions: [
                  {
                    lastTransitionTime: "2026-03-13T09:06:58Z",
                    message: "Route is accepted",
                    observedGeneration: 1,
                    reason: "Accepted",
                    status: "True",
                    type: "Accepted",
                  },
                  {
                    lastTransitionTime: "2026-03-13T09:06:58Z",
                    message:
                      "Failed to find endpoints: no ready endpoints for the related Service tenant-secondary/default-staging-app-staging-web.",
                    observedGeneration: 1,
                    reason: "EndpointsNotFound",
                    status: "False",
                    type: "BackendsAvailable",
                  },
                  {
                    lastTransitionTime: "2026-03-13T09:06:58Z",
                    message: "Resolved all the Object references for the Route",
                    observedGeneration: 1,
                    reason: "ResolvedRefs",
                    status: "True",
                    type: "ResolvedRefs",
                  },
                ],
                controllerName: "gateway.envoyproxy.io/gatewayclass-controller",
                parentRef: {
                  group: "gateway.networking.k8s.io",
                  kind: "Gateway",
                  name: "default-kubelb-int-conv",
                },
              },
            ],
          },
        },
        services: {
          "tenant-secondary/default-staging-app-staging-web": {
            conditions: [
              {
                lastTransitionTime: "2026-03-13T09:06:59Z",
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
                nodePort: 31424,
                port: 80,
                protocol: "TCP",
                targetPort: 59394,
              },
            ],
            status: {
              loadBalancer: {},
            },
          },
        },
      },
    },
  },
];

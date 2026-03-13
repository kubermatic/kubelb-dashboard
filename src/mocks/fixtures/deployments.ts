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
      creationTimestamp: "2026-03-13T07:50:14Z",
      generation: 1,
      labels: {
        "app.kubernetes.io/instance": "tenant-primary",
        "app.kubernetes.io/managed-by": "kubelb",
        "app.kubernetes.io/name": "kubelb-envoy-proxy",
      },
      name: "envoy-tenant-primary",
      namespace: "tenant-primary",
      resourceVersion: "254540",
      uid: "96937ec4-6412-42f2-9ff1-7cbd66b2bf1d",
    },
    spec: {
      progressDeadlineSeconds: 600,
      replicas: 1,
      revisionHistoryLimit: 10,
      selector: {
        matchLabels: {
          "app.kubernetes.io/name": "tenant-primary",
        },
      },
      strategy: {
        rollingUpdate: {
          maxSurge: "25%",
          maxUnavailable: "25%",
        },
        type: "RollingUpdate",
      },
      template: {
        metadata: {
          annotations: {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true",
          },
          labels: {
            "app.kubernetes.io/managed-by": "kubelb",
            "app.kubernetes.io/name": "tenant-primary",
          },
          name: "tenant-primary",
          namespace: "tenant-primary",
        },
        spec: {
          containers: [
            {
              args: [
                "--config-yaml",
                "{}",
                "--service-node",
                "tenant-primary",
                "--service-cluster",
                "tenant-primary",
              ],
              image: "envoyproxy/envoy:distroless-v1.36.4",
              imagePullPolicy: "IfNotPresent",
              lifecycle: {
                preStop: {
                  httpGet: {
                    path: "/shutdown/ready",
                    port: 19002,
                    scheme: "HTTP",
                  },
                },
              },
              livenessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: "/ready",
                  port: 19003,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 5,
              },
              name: "envoy-proxy",
              ports: [
                {
                  containerPort: 19003,
                  name: "readiness",
                  protocol: "TCP",
                },
                {
                  containerPort: 19001,
                  name: "metrics",
                  protocol: "TCP",
                },
              ],
              readinessProbe: {
                failureThreshold: 2,
                httpGet: {
                  path: "/ready",
                  port: 19003,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 5,
              },
              resources: {},
              startupProbe: {
                failureThreshold: 30,
                httpGet: {
                  path: "/ready",
                  port: 19003,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 5,
              },
              terminationMessagePath: "/dev/termination-log",
              terminationMessagePolicy: "File",
              volumeMounts: [
                {
                  mountPath: "/etc/envoy/wasm",
                  name: "wasm-plugins",
                  readOnly: true,
                },
              ],
            },
            {
              args: ["envoy", "shutdown-manager", "--ready-timeout=70s"],
              command: ["envoy-gateway"],
              image: "docker.io/envoyproxy/gateway:v1.3.0",
              imagePullPolicy: "IfNotPresent",
              livenessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: "/healthz",
                  port: 19002,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              name: "shutdown-manager",
              ports: [
                {
                  containerPort: 19002,
                  name: "shutdown",
                  protocol: "TCP",
                },
              ],
              readinessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: "/healthz",
                  port: 19002,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              resources: {
                requests: {
                  cpu: "10m",
                  memory: "32Mi",
                },
              },
              startupProbe: {
                failureThreshold: 30,
                httpGet: {
                  path: "/healthz",
                  port: 19002,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              terminationMessagePath: "/dev/termination-log",
              terminationMessagePolicy: "File",
            },
          ],
          dnsPolicy: "ClusterFirst",
          initContainers: [
            {
              command: [
                "/cp",
                "/wasm/coraza-proxy-wasm.wasm",
                "/wasm-plugins/coraza-proxy-wasm.wasm",
              ],
              image: "kubelb:e2e",
              imagePullPolicy: "IfNotPresent",
              name: "copy-wasm",
              resources: {},
              terminationMessagePath: "/dev/termination-log",
              terminationMessagePolicy: "File",
              volumeMounts: [
                {
                  mountPath: "/wasm-plugins",
                  name: "wasm-plugins",
                },
              ],
            },
          ],
          restartPolicy: "Always",
          schedulerName: "default-scheduler",
          securityContext: {},
          terminationGracePeriodSeconds: 300,
          volumes: [
            {
              emptyDir: {},
              name: "wasm-plugins",
            },
          ],
        },
      },
    },
    status: {
      availableReplicas: 1,
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:50:14Z",
          lastUpdateTime: "2026-03-13T07:50:46Z",
          message: 'ReplicaSet "envoy-tenant-primary-564747c6d5" has successfully progressed.',
          reason: "NewReplicaSetAvailable",
          status: "True",
          type: "Progressing",
        },
        {
          lastTransitionTime: "2026-03-13T08:52:17Z",
          lastUpdateTime: "2026-03-13T08:52:17Z",
          message: "Deployment has minimum availability.",
          reason: "MinimumReplicasAvailable",
          status: "True",
          type: "Available",
        },
      ],
      observedGeneration: 1,
      readyReplicas: 1,
      replicas: 1,
      updatedReplicas: 1,
    },
  },
  {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      annotations: {
        "deployment.kubernetes.io/revision": "1",
      },
      creationTimestamp: "2026-03-13T07:50:15Z",
      generation: 1,
      labels: {
        "app.kubernetes.io/instance": "tenant-secondary",
        "app.kubernetes.io/managed-by": "kubelb",
        "app.kubernetes.io/name": "kubelb-envoy-proxy",
      },
      name: "envoy-tenant-secondary",
      namespace: "tenant-secondary",
      resourceVersion: "2749",
      uid: "fdfda4a8-43c0-45d7-93f6-701a654cddb5",
    },
    spec: {
      progressDeadlineSeconds: 600,
      replicas: 1,
      revisionHistoryLimit: 10,
      selector: {
        matchLabels: {
          "app.kubernetes.io/name": "tenant-secondary",
        },
      },
      strategy: {
        rollingUpdate: {
          maxSurge: "25%",
          maxUnavailable: "25%",
        },
        type: "RollingUpdate",
      },
      template: {
        metadata: {
          annotations: {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true",
          },
          labels: {
            "app.kubernetes.io/managed-by": "kubelb",
            "app.kubernetes.io/name": "tenant-secondary",
          },
          name: "tenant-secondary",
          namespace: "tenant-secondary",
        },
        spec: {
          containers: [
            {
              args: [
                "--config-yaml",
                "{}",
                "--service-node",
                "tenant-secondary",
                "--service-cluster",
                "tenant-secondary",
              ],
              image: "envoyproxy/envoy:distroless-v1.36.4",
              imagePullPolicy: "IfNotPresent",
              lifecycle: {
                preStop: {
                  httpGet: {
                    path: "/shutdown/ready",
                    port: 19002,
                    scheme: "HTTP",
                  },
                },
              },
              livenessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: "/ready",
                  port: 19003,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 5,
              },
              name: "envoy-proxy",
              ports: [
                {
                  containerPort: 19003,
                  name: "readiness",
                  protocol: "TCP",
                },
                {
                  containerPort: 19001,
                  name: "metrics",
                  protocol: "TCP",
                },
              ],
              readinessProbe: {
                failureThreshold: 2,
                httpGet: {
                  path: "/ready",
                  port: 19003,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 5,
              },
              resources: {},
              startupProbe: {
                failureThreshold: 30,
                httpGet: {
                  path: "/ready",
                  port: 19003,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 5,
              },
              terminationMessagePath: "/dev/termination-log",
              terminationMessagePolicy: "File",
              volumeMounts: [
                {
                  mountPath: "/etc/envoy/wasm",
                  name: "wasm-plugins",
                  readOnly: true,
                },
              ],
            },
            {
              args: ["envoy", "shutdown-manager", "--ready-timeout=70s"],
              command: ["envoy-gateway"],
              image: "docker.io/envoyproxy/gateway:v1.3.0",
              imagePullPolicy: "IfNotPresent",
              livenessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: "/healthz",
                  port: 19002,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              name: "shutdown-manager",
              ports: [
                {
                  containerPort: 19002,
                  name: "shutdown",
                  protocol: "TCP",
                },
              ],
              readinessProbe: {
                failureThreshold: 3,
                httpGet: {
                  path: "/healthz",
                  port: 19002,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              resources: {
                requests: {
                  cpu: "10m",
                  memory: "32Mi",
                },
              },
              startupProbe: {
                failureThreshold: 30,
                httpGet: {
                  path: "/healthz",
                  port: 19002,
                  scheme: "HTTP",
                },
                periodSeconds: 10,
                successThreshold: 1,
                timeoutSeconds: 1,
              },
              terminationMessagePath: "/dev/termination-log",
              terminationMessagePolicy: "File",
            },
          ],
          dnsPolicy: "ClusterFirst",
          initContainers: [
            {
              command: [
                "/cp",
                "/wasm/coraza-proxy-wasm.wasm",
                "/wasm-plugins/coraza-proxy-wasm.wasm",
              ],
              image: "kubelb:e2e",
              imagePullPolicy: "IfNotPresent",
              name: "copy-wasm",
              resources: {},
              terminationMessagePath: "/dev/termination-log",
              terminationMessagePolicy: "File",
              volumeMounts: [
                {
                  mountPath: "/wasm-plugins",
                  name: "wasm-plugins",
                },
              ],
            },
          ],
          restartPolicy: "Always",
          schedulerName: "default-scheduler",
          securityContext: {},
          terminationGracePeriodSeconds: 300,
          volumes: [
            {
              emptyDir: {},
              name: "wasm-plugins",
            },
          ],
        },
      },
    },
    status: {
      availableReplicas: 1,
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:50:15Z",
          lastUpdateTime: "2026-03-13T07:50:46Z",
          message: 'ReplicaSet "envoy-tenant-secondary-777f4c68b9" has successfully progressed.',
          reason: "NewReplicaSetAvailable",
          status: "True",
          type: "Progressing",
        },
        {
          lastTransitionTime: "2026-03-13T07:53:42Z",
          lastUpdateTime: "2026-03-13T07:53:42Z",
          message: "Deployment has minimum availability.",
          reason: "MinimumReplicasAvailable",
          status: "True",
          type: "Available",
        },
      ],
      observedGeneration: 1,
      readyReplicas: 1,
      replicas: 1,
      updatedReplicas: 1,
    },
  },
];

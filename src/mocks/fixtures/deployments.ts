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
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "annotations": {
        "deployment.kubernetes.io/revision": "1"
      },
      "creationTimestamp": "2026-03-13T07:53:12Z",
      "generation": 1,
      "labels": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-grpc-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "name": "envoy-tenant-primary-default-grpc-gw-dd1e96ff",
      "namespace": "kubelb",
      "ownerReferences": [
        {
          "apiVersion": "gateway.networking.k8s.io/v1",
          "kind": "GatewayClass",
          "name": "eg",
          "uid": "3846d2e8-2867-4f22-8aa2-f613041cb7ed"
        }
      ],
      "resourceVersion": "228408",
      "uid": "9417d534-58a0-46cc-b91e-f47d0fb36621"
    },
    "spec": {
      "progressDeadlineSeconds": 600,
      "replicas": 1,
      "revisionHistoryLimit": 10,
      "selector": {
        "matchLabels": {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name": "default-grpc-gw",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
        }
      },
      "strategy": {
        "rollingUpdate": {
          "maxSurge": "25%",
          "maxUnavailable": "25%"
        },
        "type": "RollingUpdate"
      },
      "template": {
        "metadata": {
          "annotations": {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true"
          },
          "labels": {
            "app.kubernetes.io/component": "proxy",
            "app.kubernetes.io/managed-by": "envoy-gateway",
            "app.kubernetes.io/name": "envoy",
            "gateway.envoyproxy.io/owning-gateway-name": "default-grpc-gw",
            "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
          }
        },
        "spec": {
          "automountServiceAccountToken": false,
          "containers": [
            {
              "args": [
                "--service-cluster",
                "tenant-primary/default-grpc-gw",
                "--service-node",
                "$(ENVOY_POD_NAME)",
                "--config-yaml",
                "admin:\n  access_log:\n  - name: envoy.access_loggers.file\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog\n      path: /dev/null\n  address:\n    socket_address:\n      address: 127.0.0.1\n      port_value: 19000\ncluster_manager:\n  local_cluster_name: tenant-primary/default-grpc-gw\nnode:\n  locality:\n    zone: $(ENVOY_SERVICE_ZONE)\nlayered_runtime:\n  layers:\n  - name: global_config\n    static_layer:\n      envoy.restart_features.use_eds_cache_for_ads: true\n      re2.max_program_size.error_level: 4294967295\n      re2.max_program_size.warn_level: 1000\ndynamic_resources:\n  ads_config:\n    api_type: DELTA_GRPC\n    transport_api_version: V3\n    grpc_services:\n    - envoy_grpc:\n        cluster_name: xds_cluster\n    set_node_on_first_message_only: true\n  lds_config:\n    ads: {}\n    resource_api_version: V3\n  cds_config:\n    ads: {}\n    resource_api_version: V3\nstatic_resources:\n  listeners:\n  - name: envoy-gateway-proxy-stats-0.0.0.0-19001\n    address:\n      socket_address:\n        address: '0.0.0.0'\n        port_value: 19001\n        protocol: TCP\n    bypass_overload_manager: true\n    filter_chains:\n    - filters:\n      - name: envoy.filters.network.http_connection_manager\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          stat_prefix: eg-stats-http\n          normalize_path: true\n          route_config:\n            name: local_route\n            virtual_hosts:\n            - name: prometheus_stats\n              domains:\n              - \"*\"\n              routes:\n              - match:\n                  path: /stats/prometheus\n                  headers:\n                  - name: \":method\"\n                    string_match:\n                      exact: GET\n                route:\n                  cluster: prometheus_stats\n          http_filters:\n          - name: envoy.filters.http.router\n            typed_config:\n              \"@type\": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router\n  clusters:\n  - name: prometheus_stats\n    connect_timeout: 0.250s\n    type: STATIC\n    lb_policy: ROUND_ROBIN\n    load_assignment:\n      cluster_name: prometheus_stats\n      endpoints:\n      - lb_endpoints:\n        - endpoint:\n            address:\n              socket_address:\n                address: 127.0.0.1\n                port_value: 19000\n  - connect_timeout: 10s\n    eds_cluster_config:\n      eds_config:\n        ads: {}\n        resource_api_version: 'V3'\n      service_name: tenant-primary/default-grpc-gw\n    load_balancing_policy:\n      policies:\n      - typed_extension_config:\n          name: 'envoy.load_balancing_policies.least_request'\n          typed_config:\n            '@type': 'type.googleapis.com/envoy.extensions.load_balancing_policies.least_request.v3.LeastRequest'\n            locality_lb_config:\n              zone_aware_lb_config:\n                min_cluster_size: '1'\n    name: tenant-primary/default-grpc-gw\n    type: EDS\n  - connect_timeout: 10s\n    load_assignment:\n      cluster_name: xds_cluster\n      endpoints:\n      - load_balancing_weight: 1\n        lb_endpoints:\n        - load_balancing_weight: 1\n          endpoint:\n            address:\n              socket_address:\n                address: envoy-gateway.kubelb.svc.cluster.local.\n                port_value: 18000\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": \"type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\"\n        explicit_http_config:\n          http2_protocol_options:\n            connection_keepalive:\n              interval: 30s\n              timeout: 5s\n    name: xds_cluster\n    type: STRICT_DNS\n    transport_socket:\n      name: envoy.transport_sockets.tls\n      typed_config:\n        \"@type\": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext\n        common_tls_context:\n          tls_params:\n            tls_maximum_protocol_version: TLSv1_3\n          tls_certificate_sds_secret_configs:\n          - name: xds_certificate\n            sds_config:\n              path_config_source:\n                path: /sds/xds-certificate.json\n              resource_api_version: V3\n          validation_context_sds_secret_config:\n            name: xds_trusted_ca\n            sds_config:\n              path_config_source:\n                path: /sds/xds-trusted-ca.json\n              resource_api_version: V3\noverload_manager:\n  refresh_interval: 0.25s\n  resource_monitors:\n  - name: \"envoy.resource_monitors.global_downstream_max_connections\"\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.resource_monitors.downstream_connections.v3.DownstreamConnectionsConfig\n      max_active_downstream_connections: 50000\n",
                "--log-level",
                "warn",
                "--cpuset-threads",
                "--drain-strategy",
                "immediate",
                "--component-log-level",
                "misc:error",
                "--drain-time-s",
                "60"
              ],
              "command": [
                "envoy"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/envoy:distroless-v1.36.4",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "httpGet": {
                    "path": "/shutdown/ready",
                    "port": 19002,
                    "scheme": "HTTP"
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "envoy",
              "ports": [
                {
                  "containerPort": 19001,
                  "name": "metrics",
                  "protocol": "TCP"
                },
                {
                  "containerPort": 19003,
                  "name": "readiness",
                  "protocol": "TCP"
                }
              ],
              "readinessProbe": {
                "failureThreshold": 1,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 5,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "100m",
                  "memory": "512Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File",
              "volumeMounts": [
                {
                  "mountPath": "/certs",
                  "name": "certs",
                  "readOnly": true
                },
                {
                  "mountPath": "/sds",
                  "name": "sds"
                }
              ]
            },
            {
              "args": [
                "envoy",
                "shutdown-manager"
              ],
              "command": [
                "envoy-gateway"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/gateway:v1.6.3",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "exec": {
                    "command": [
                      "envoy-gateway",
                      "envoy",
                      "shutdown"
                    ]
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "shutdown-manager",
              "readinessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "10m",
                  "memory": "32Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File"
            }
          ],
          "dnsPolicy": "ClusterFirst",
          "restartPolicy": "Always",
          "schedulerName": "default-scheduler",
          "securityContext": {},
          "serviceAccount": "envoy-tenant-primary-default-grpc-gw-dd1e96ff",
          "serviceAccountName": "envoy-tenant-primary-default-grpc-gw-dd1e96ff",
          "terminationGracePeriodSeconds": 360,
          "volumes": [
            {
              "name": "certs",
              "secret": {
                "defaultMode": 420,
                "secretName": "envoy"
              }
            },
            {
              "configMap": {
                "defaultMode": 420,
                "items": [
                  {
                    "key": "xds-trusted-ca.json",
                    "path": "xds-trusted-ca.json"
                  },
                  {
                    "key": "xds-certificate.json",
                    "path": "xds-certificate.json"
                  }
                ],
                "name": "envoy-tenant-primary-default-grpc-gw-dd1e96ff",
                "optional": false
              },
              "name": "sds"
            }
          ]
        }
      }
    },
    "status": {
      "availableReplicas": 1,
      "conditions": [
        {
          "lastTransitionTime": "2026-03-13T07:53:12Z",
          "lastUpdateTime": "2026-03-13T07:53:26Z",
          "message": "ReplicaSet \"envoy-tenant-primary-default-grpc-gw-dd1e96ff-5d866d457b\" has successfully progressed.",
          "reason": "NewReplicaSetAvailable",
          "status": "True",
          "type": "Progressing"
        },
        {
          "lastTransitionTime": "2026-03-13T08:46:09Z",
          "lastUpdateTime": "2026-03-13T08:46:09Z",
          "message": "Deployment has minimum availability.",
          "reason": "MinimumReplicasAvailable",
          "status": "True",
          "type": "Available"
        }
      ],
      "observedGeneration": 1,
      "readyReplicas": 1,
      "replicas": 1,
      "terminatingReplicas": 0,
      "updatedReplicas": 1
    }
  },
  {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "annotations": {
        "deployment.kubernetes.io/revision": "1"
      },
      "creationTimestamp": "2026-03-13T07:53:19Z",
      "generation": 1,
      "labels": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-tcp-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "name": "envoy-tenant-primary-default-tcp-gw-235977ec",
      "namespace": "kubelb",
      "ownerReferences": [
        {
          "apiVersion": "gateway.networking.k8s.io/v1",
          "kind": "GatewayClass",
          "name": "eg",
          "uid": "3846d2e8-2867-4f22-8aa2-f613041cb7ed"
        }
      ],
      "resourceVersion": "2433",
      "uid": "d5ca6148-68f7-44e1-b18a-e14758e48e23"
    },
    "spec": {
      "progressDeadlineSeconds": 600,
      "replicas": 1,
      "revisionHistoryLimit": 10,
      "selector": {
        "matchLabels": {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name": "default-tcp-gw",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
        }
      },
      "strategy": {
        "rollingUpdate": {
          "maxSurge": "25%",
          "maxUnavailable": "25%"
        },
        "type": "RollingUpdate"
      },
      "template": {
        "metadata": {
          "annotations": {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true"
          },
          "labels": {
            "app.kubernetes.io/component": "proxy",
            "app.kubernetes.io/managed-by": "envoy-gateway",
            "app.kubernetes.io/name": "envoy",
            "gateway.envoyproxy.io/owning-gateway-name": "default-tcp-gw",
            "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
          }
        },
        "spec": {
          "automountServiceAccountToken": false,
          "containers": [
            {
              "args": [
                "--service-cluster",
                "tenant-primary/default-tcp-gw",
                "--service-node",
                "$(ENVOY_POD_NAME)",
                "--config-yaml",
                "admin:\n  access_log:\n  - name: envoy.access_loggers.file\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog\n      path: /dev/null\n  address:\n    socket_address:\n      address: 127.0.0.1\n      port_value: 19000\ncluster_manager:\n  local_cluster_name: tenant-primary/default-tcp-gw\nnode:\n  locality:\n    zone: $(ENVOY_SERVICE_ZONE)\nlayered_runtime:\n  layers:\n  - name: global_config\n    static_layer:\n      envoy.restart_features.use_eds_cache_for_ads: true\n      re2.max_program_size.error_level: 4294967295\n      re2.max_program_size.warn_level: 1000\ndynamic_resources:\n  ads_config:\n    api_type: DELTA_GRPC\n    transport_api_version: V3\n    grpc_services:\n    - envoy_grpc:\n        cluster_name: xds_cluster\n    set_node_on_first_message_only: true\n  lds_config:\n    ads: {}\n    resource_api_version: V3\n  cds_config:\n    ads: {}\n    resource_api_version: V3\nstatic_resources:\n  listeners:\n  - name: envoy-gateway-proxy-stats-0.0.0.0-19001\n    address:\n      socket_address:\n        address: '0.0.0.0'\n        port_value: 19001\n        protocol: TCP\n    bypass_overload_manager: true\n    filter_chains:\n    - filters:\n      - name: envoy.filters.network.http_connection_manager\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          stat_prefix: eg-stats-http\n          normalize_path: true\n          route_config:\n            name: local_route\n            virtual_hosts:\n            - name: prometheus_stats\n              domains:\n              - \"*\"\n              routes:\n              - match:\n                  path: /stats/prometheus\n                  headers:\n                  - name: \":method\"\n                    string_match:\n                      exact: GET\n                route:\n                  cluster: prometheus_stats\n          http_filters:\n          - name: envoy.filters.http.router\n            typed_config:\n              \"@type\": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router\n  clusters:\n  - name: prometheus_stats\n    connect_timeout: 0.250s\n    type: STATIC\n    lb_policy: ROUND_ROBIN\n    load_assignment:\n      cluster_name: prometheus_stats\n      endpoints:\n      - lb_endpoints:\n        - endpoint:\n            address:\n              socket_address:\n                address: 127.0.0.1\n                port_value: 19000\n  - connect_timeout: 10s\n    eds_cluster_config:\n      eds_config:\n        ads: {}\n        resource_api_version: 'V3'\n      service_name: tenant-primary/default-tcp-gw\n    load_balancing_policy:\n      policies:\n      - typed_extension_config:\n          name: 'envoy.load_balancing_policies.least_request'\n          typed_config:\n            '@type': 'type.googleapis.com/envoy.extensions.load_balancing_policies.least_request.v3.LeastRequest'\n            locality_lb_config:\n              zone_aware_lb_config:\n                min_cluster_size: '1'\n    name: tenant-primary/default-tcp-gw\n    type: EDS\n  - connect_timeout: 10s\n    load_assignment:\n      cluster_name: xds_cluster\n      endpoints:\n      - load_balancing_weight: 1\n        lb_endpoints:\n        - load_balancing_weight: 1\n          endpoint:\n            address:\n              socket_address:\n                address: envoy-gateway.kubelb.svc.cluster.local.\n                port_value: 18000\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": \"type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\"\n        explicit_http_config:\n          http2_protocol_options:\n            connection_keepalive:\n              interval: 30s\n              timeout: 5s\n    name: xds_cluster\n    type: STRICT_DNS\n    transport_socket:\n      name: envoy.transport_sockets.tls\n      typed_config:\n        \"@type\": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext\n        common_tls_context:\n          tls_params:\n            tls_maximum_protocol_version: TLSv1_3\n          tls_certificate_sds_secret_configs:\n          - name: xds_certificate\n            sds_config:\n              path_config_source:\n                path: /sds/xds-certificate.json\n              resource_api_version: V3\n          validation_context_sds_secret_config:\n            name: xds_trusted_ca\n            sds_config:\n              path_config_source:\n                path: /sds/xds-trusted-ca.json\n              resource_api_version: V3\noverload_manager:\n  refresh_interval: 0.25s\n  resource_monitors:\n  - name: \"envoy.resource_monitors.global_downstream_max_connections\"\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.resource_monitors.downstream_connections.v3.DownstreamConnectionsConfig\n      max_active_downstream_connections: 50000\n",
                "--log-level",
                "warn",
                "--cpuset-threads",
                "--drain-strategy",
                "immediate",
                "--component-log-level",
                "misc:error",
                "--drain-time-s",
                "60"
              ],
              "command": [
                "envoy"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/envoy:distroless-v1.36.4",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "httpGet": {
                    "path": "/shutdown/ready",
                    "port": 19002,
                    "scheme": "HTTP"
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "envoy",
              "ports": [
                {
                  "containerPort": 19001,
                  "name": "metrics",
                  "protocol": "TCP"
                },
                {
                  "containerPort": 19003,
                  "name": "readiness",
                  "protocol": "TCP"
                }
              ],
              "readinessProbe": {
                "failureThreshold": 1,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 5,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "100m",
                  "memory": "512Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File",
              "volumeMounts": [
                {
                  "mountPath": "/certs",
                  "name": "certs",
                  "readOnly": true
                },
                {
                  "mountPath": "/sds",
                  "name": "sds"
                }
              ]
            },
            {
              "args": [
                "envoy",
                "shutdown-manager"
              ],
              "command": [
                "envoy-gateway"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/gateway:v1.6.3",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "exec": {
                    "command": [
                      "envoy-gateway",
                      "envoy",
                      "shutdown"
                    ]
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "shutdown-manager",
              "readinessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "10m",
                  "memory": "32Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File"
            }
          ],
          "dnsPolicy": "ClusterFirst",
          "restartPolicy": "Always",
          "schedulerName": "default-scheduler",
          "securityContext": {},
          "serviceAccount": "envoy-tenant-primary-default-tcp-gw-235977ec",
          "serviceAccountName": "envoy-tenant-primary-default-tcp-gw-235977ec",
          "terminationGracePeriodSeconds": 360,
          "volumes": [
            {
              "name": "certs",
              "secret": {
                "defaultMode": 420,
                "secretName": "envoy"
              }
            },
            {
              "configMap": {
                "defaultMode": 420,
                "items": [
                  {
                    "key": "xds-trusted-ca.json",
                    "path": "xds-trusted-ca.json"
                  },
                  {
                    "key": "xds-certificate.json",
                    "path": "xds-certificate.json"
                  }
                ],
                "name": "envoy-tenant-primary-default-tcp-gw-235977ec",
                "optional": false
              },
              "name": "sds"
            }
          ]
        }
      }
    },
    "status": {
      "availableReplicas": 1,
      "conditions": [
        {
          "lastTransitionTime": "2026-03-13T07:53:32Z",
          "lastUpdateTime": "2026-03-13T07:53:32Z",
          "message": "Deployment has minimum availability.",
          "reason": "MinimumReplicasAvailable",
          "status": "True",
          "type": "Available"
        },
        {
          "lastTransitionTime": "2026-03-13T07:53:20Z",
          "lastUpdateTime": "2026-03-13T07:53:32Z",
          "message": "ReplicaSet \"envoy-tenant-primary-default-tcp-gw-235977ec-6c46976856\" has successfully progressed.",
          "reason": "NewReplicaSetAvailable",
          "status": "True",
          "type": "Progressing"
        }
      ],
      "observedGeneration": 1,
      "readyReplicas": 1,
      "replicas": 1,
      "terminatingReplicas": 0,
      "updatedReplicas": 1
    }
  },
  {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "annotations": {
        "deployment.kubernetes.io/revision": "1"
      },
      "creationTimestamp": "2026-03-13T07:53:30Z",
      "generation": 1,
      "labels": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-tls-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "name": "envoy-tenant-primary-default-tls-gw-17898c29",
      "namespace": "kubelb",
      "ownerReferences": [
        {
          "apiVersion": "gateway.networking.k8s.io/v1",
          "kind": "GatewayClass",
          "name": "eg",
          "uid": "3846d2e8-2867-4f22-8aa2-f613041cb7ed"
        }
      ],
      "resourceVersion": "280222",
      "uid": "aa408186-5709-4610-9c49-ea10db3f1daf"
    },
    "spec": {
      "progressDeadlineSeconds": 600,
      "replicas": 1,
      "revisionHistoryLimit": 10,
      "selector": {
        "matchLabels": {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name": "default-tls-gw",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
        }
      },
      "strategy": {
        "rollingUpdate": {
          "maxSurge": "25%",
          "maxUnavailable": "25%"
        },
        "type": "RollingUpdate"
      },
      "template": {
        "metadata": {
          "annotations": {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true"
          },
          "labels": {
            "app.kubernetes.io/component": "proxy",
            "app.kubernetes.io/managed-by": "envoy-gateway",
            "app.kubernetes.io/name": "envoy",
            "gateway.envoyproxy.io/owning-gateway-name": "default-tls-gw",
            "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
          }
        },
        "spec": {
          "automountServiceAccountToken": false,
          "containers": [
            {
              "args": [
                "--service-cluster",
                "tenant-primary/default-tls-gw",
                "--service-node",
                "$(ENVOY_POD_NAME)",
                "--config-yaml",
                "admin:\n  access_log:\n  - name: envoy.access_loggers.file\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog\n      path: /dev/null\n  address:\n    socket_address:\n      address: 127.0.0.1\n      port_value: 19000\ncluster_manager:\n  local_cluster_name: tenant-primary/default-tls-gw\nnode:\n  locality:\n    zone: $(ENVOY_SERVICE_ZONE)\nlayered_runtime:\n  layers:\n  - name: global_config\n    static_layer:\n      envoy.restart_features.use_eds_cache_for_ads: true\n      re2.max_program_size.error_level: 4294967295\n      re2.max_program_size.warn_level: 1000\ndynamic_resources:\n  ads_config:\n    api_type: DELTA_GRPC\n    transport_api_version: V3\n    grpc_services:\n    - envoy_grpc:\n        cluster_name: xds_cluster\n    set_node_on_first_message_only: true\n  lds_config:\n    ads: {}\n    resource_api_version: V3\n  cds_config:\n    ads: {}\n    resource_api_version: V3\nstatic_resources:\n  listeners:\n  - name: envoy-gateway-proxy-stats-0.0.0.0-19001\n    address:\n      socket_address:\n        address: '0.0.0.0'\n        port_value: 19001\n        protocol: TCP\n    bypass_overload_manager: true\n    filter_chains:\n    - filters:\n      - name: envoy.filters.network.http_connection_manager\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          stat_prefix: eg-stats-http\n          normalize_path: true\n          route_config:\n            name: local_route\n            virtual_hosts:\n            - name: prometheus_stats\n              domains:\n              - \"*\"\n              routes:\n              - match:\n                  path: /stats/prometheus\n                  headers:\n                  - name: \":method\"\n                    string_match:\n                      exact: GET\n                route:\n                  cluster: prometheus_stats\n          http_filters:\n          - name: envoy.filters.http.router\n            typed_config:\n              \"@type\": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router\n  clusters:\n  - name: prometheus_stats\n    connect_timeout: 0.250s\n    type: STATIC\n    lb_policy: ROUND_ROBIN\n    load_assignment:\n      cluster_name: prometheus_stats\n      endpoints:\n      - lb_endpoints:\n        - endpoint:\n            address:\n              socket_address:\n                address: 127.0.0.1\n                port_value: 19000\n  - connect_timeout: 10s\n    eds_cluster_config:\n      eds_config:\n        ads: {}\n        resource_api_version: 'V3'\n      service_name: tenant-primary/default-tls-gw\n    load_balancing_policy:\n      policies:\n      - typed_extension_config:\n          name: 'envoy.load_balancing_policies.least_request'\n          typed_config:\n            '@type': 'type.googleapis.com/envoy.extensions.load_balancing_policies.least_request.v3.LeastRequest'\n            locality_lb_config:\n              zone_aware_lb_config:\n                min_cluster_size: '1'\n    name: tenant-primary/default-tls-gw\n    type: EDS\n  - connect_timeout: 10s\n    load_assignment:\n      cluster_name: xds_cluster\n      endpoints:\n      - load_balancing_weight: 1\n        lb_endpoints:\n        - load_balancing_weight: 1\n          endpoint:\n            address:\n              socket_address:\n                address: envoy-gateway.kubelb.svc.cluster.local.\n                port_value: 18000\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": \"type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\"\n        explicit_http_config:\n          http2_protocol_options:\n            connection_keepalive:\n              interval: 30s\n              timeout: 5s\n    name: xds_cluster\n    type: STRICT_DNS\n    transport_socket:\n      name: envoy.transport_sockets.tls\n      typed_config:\n        \"@type\": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext\n        common_tls_context:\n          tls_params:\n            tls_maximum_protocol_version: TLSv1_3\n          tls_certificate_sds_secret_configs:\n          - name: xds_certificate\n            sds_config:\n              path_config_source:\n                path: /sds/xds-certificate.json\n              resource_api_version: V3\n          validation_context_sds_secret_config:\n            name: xds_trusted_ca\n            sds_config:\n              path_config_source:\n                path: /sds/xds-trusted-ca.json\n              resource_api_version: V3\noverload_manager:\n  refresh_interval: 0.25s\n  resource_monitors:\n  - name: \"envoy.resource_monitors.global_downstream_max_connections\"\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.resource_monitors.downstream_connections.v3.DownstreamConnectionsConfig\n      max_active_downstream_connections: 50000\n",
                "--log-level",
                "warn",
                "--cpuset-threads",
                "--drain-strategy",
                "immediate",
                "--component-log-level",
                "misc:error",
                "--drain-time-s",
                "60"
              ],
              "command": [
                "envoy"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/envoy:distroless-v1.36.4",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "httpGet": {
                    "path": "/shutdown/ready",
                    "port": 19002,
                    "scheme": "HTTP"
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "envoy",
              "ports": [
                {
                  "containerPort": 19001,
                  "name": "metrics",
                  "protocol": "TCP"
                },
                {
                  "containerPort": 19003,
                  "name": "readiness",
                  "protocol": "TCP"
                }
              ],
              "readinessProbe": {
                "failureThreshold": 1,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 5,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "100m",
                  "memory": "512Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File",
              "volumeMounts": [
                {
                  "mountPath": "/certs",
                  "name": "certs",
                  "readOnly": true
                },
                {
                  "mountPath": "/sds",
                  "name": "sds"
                }
              ]
            },
            {
              "args": [
                "envoy",
                "shutdown-manager"
              ],
              "command": [
                "envoy-gateway"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/gateway:v1.6.3",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "exec": {
                    "command": [
                      "envoy-gateway",
                      "envoy",
                      "shutdown"
                    ]
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "shutdown-manager",
              "readinessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "10m",
                  "memory": "32Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File"
            }
          ],
          "dnsPolicy": "ClusterFirst",
          "restartPolicy": "Always",
          "schedulerName": "default-scheduler",
          "securityContext": {},
          "serviceAccount": "envoy-tenant-primary-default-tls-gw-17898c29",
          "serviceAccountName": "envoy-tenant-primary-default-tls-gw-17898c29",
          "terminationGracePeriodSeconds": 360,
          "volumes": [
            {
              "name": "certs",
              "secret": {
                "defaultMode": 420,
                "secretName": "envoy"
              }
            },
            {
              "configMap": {
                "defaultMode": 420,
                "items": [
                  {
                    "key": "xds-trusted-ca.json",
                    "path": "xds-trusted-ca.json"
                  },
                  {
                    "key": "xds-certificate.json",
                    "path": "xds-certificate.json"
                  }
                ],
                "name": "envoy-tenant-primary-default-tls-gw-17898c29",
                "optional": false
              },
              "name": "sds"
            }
          ]
        }
      }
    },
    "status": {
      "availableReplicas": 1,
      "conditions": [
        {
          "lastTransitionTime": "2026-03-13T07:53:30Z",
          "lastUpdateTime": "2026-03-13T07:53:42Z",
          "message": "ReplicaSet \"envoy-tenant-primary-default-tls-gw-17898c29-556ddd5864\" has successfully progressed.",
          "reason": "NewReplicaSetAvailable",
          "status": "True",
          "type": "Progressing"
        },
        {
          "lastTransitionTime": "2026-03-13T08:57:25Z",
          "lastUpdateTime": "2026-03-13T08:57:25Z",
          "message": "Deployment has minimum availability.",
          "reason": "MinimumReplicasAvailable",
          "status": "True",
          "type": "Available"
        }
      ],
      "observedGeneration": 1,
      "readyReplicas": 1,
      "replicas": 1,
      "terminatingReplicas": 0,
      "updatedReplicas": 1
    }
  },
  {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "annotations": {
        "deployment.kubernetes.io/revision": "1"
      },
      "creationTimestamp": "2026-03-13T07:53:25Z",
      "generation": 1,
      "labels": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-udp-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "name": "envoy-tenant-primary-default-udp-gw-296515a9",
      "namespace": "kubelb",
      "ownerReferences": [
        {
          "apiVersion": "gateway.networking.k8s.io/v1",
          "kind": "GatewayClass",
          "name": "eg",
          "uid": "3846d2e8-2867-4f22-8aa2-f613041cb7ed"
        }
      ],
      "resourceVersion": "254550",
      "uid": "c855f0ae-677e-45b8-9a37-636ea2863319"
    },
    "spec": {
      "progressDeadlineSeconds": 600,
      "replicas": 1,
      "revisionHistoryLimit": 10,
      "selector": {
        "matchLabels": {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name": "default-udp-gw",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
        }
      },
      "strategy": {
        "rollingUpdate": {
          "maxSurge": "25%",
          "maxUnavailable": "25%"
        },
        "type": "RollingUpdate"
      },
      "template": {
        "metadata": {
          "annotations": {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true"
          },
          "labels": {
            "app.kubernetes.io/component": "proxy",
            "app.kubernetes.io/managed-by": "envoy-gateway",
            "app.kubernetes.io/name": "envoy",
            "gateway.envoyproxy.io/owning-gateway-name": "default-udp-gw",
            "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
          }
        },
        "spec": {
          "automountServiceAccountToken": false,
          "containers": [
            {
              "args": [
                "--service-cluster",
                "tenant-primary/default-udp-gw",
                "--service-node",
                "$(ENVOY_POD_NAME)",
                "--config-yaml",
                "admin:\n  access_log:\n  - name: envoy.access_loggers.file\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog\n      path: /dev/null\n  address:\n    socket_address:\n      address: 127.0.0.1\n      port_value: 19000\ncluster_manager:\n  local_cluster_name: tenant-primary/default-udp-gw\nnode:\n  locality:\n    zone: $(ENVOY_SERVICE_ZONE)\nlayered_runtime:\n  layers:\n  - name: global_config\n    static_layer:\n      envoy.restart_features.use_eds_cache_for_ads: true\n      re2.max_program_size.error_level: 4294967295\n      re2.max_program_size.warn_level: 1000\ndynamic_resources:\n  ads_config:\n    api_type: DELTA_GRPC\n    transport_api_version: V3\n    grpc_services:\n    - envoy_grpc:\n        cluster_name: xds_cluster\n    set_node_on_first_message_only: true\n  lds_config:\n    ads: {}\n    resource_api_version: V3\n  cds_config:\n    ads: {}\n    resource_api_version: V3\nstatic_resources:\n  listeners:\n  - name: envoy-gateway-proxy-stats-0.0.0.0-19001\n    address:\n      socket_address:\n        address: '0.0.0.0'\n        port_value: 19001\n        protocol: TCP\n    bypass_overload_manager: true\n    filter_chains:\n    - filters:\n      - name: envoy.filters.network.http_connection_manager\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          stat_prefix: eg-stats-http\n          normalize_path: true\n          route_config:\n            name: local_route\n            virtual_hosts:\n            - name: prometheus_stats\n              domains:\n              - \"*\"\n              routes:\n              - match:\n                  path: /stats/prometheus\n                  headers:\n                  - name: \":method\"\n                    string_match:\n                      exact: GET\n                route:\n                  cluster: prometheus_stats\n          http_filters:\n          - name: envoy.filters.http.router\n            typed_config:\n              \"@type\": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router\n  clusters:\n  - name: prometheus_stats\n    connect_timeout: 0.250s\n    type: STATIC\n    lb_policy: ROUND_ROBIN\n    load_assignment:\n      cluster_name: prometheus_stats\n      endpoints:\n      - lb_endpoints:\n        - endpoint:\n            address:\n              socket_address:\n                address: 127.0.0.1\n                port_value: 19000\n  - connect_timeout: 10s\n    eds_cluster_config:\n      eds_config:\n        ads: {}\n        resource_api_version: 'V3'\n      service_name: tenant-primary/default-udp-gw\n    load_balancing_policy:\n      policies:\n      - typed_extension_config:\n          name: 'envoy.load_balancing_policies.least_request'\n          typed_config:\n            '@type': 'type.googleapis.com/envoy.extensions.load_balancing_policies.least_request.v3.LeastRequest'\n            locality_lb_config:\n              zone_aware_lb_config:\n                min_cluster_size: '1'\n    name: tenant-primary/default-udp-gw\n    type: EDS\n  - connect_timeout: 10s\n    load_assignment:\n      cluster_name: xds_cluster\n      endpoints:\n      - load_balancing_weight: 1\n        lb_endpoints:\n        - load_balancing_weight: 1\n          endpoint:\n            address:\n              socket_address:\n                address: envoy-gateway.kubelb.svc.cluster.local.\n                port_value: 18000\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": \"type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\"\n        explicit_http_config:\n          http2_protocol_options:\n            connection_keepalive:\n              interval: 30s\n              timeout: 5s\n    name: xds_cluster\n    type: STRICT_DNS\n    transport_socket:\n      name: envoy.transport_sockets.tls\n      typed_config:\n        \"@type\": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext\n        common_tls_context:\n          tls_params:\n            tls_maximum_protocol_version: TLSv1_3\n          tls_certificate_sds_secret_configs:\n          - name: xds_certificate\n            sds_config:\n              path_config_source:\n                path: /sds/xds-certificate.json\n              resource_api_version: V3\n          validation_context_sds_secret_config:\n            name: xds_trusted_ca\n            sds_config:\n              path_config_source:\n                path: /sds/xds-trusted-ca.json\n              resource_api_version: V3\noverload_manager:\n  refresh_interval: 0.25s\n  resource_monitors:\n  - name: \"envoy.resource_monitors.global_downstream_max_connections\"\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.resource_monitors.downstream_connections.v3.DownstreamConnectionsConfig\n      max_active_downstream_connections: 50000\n",
                "--log-level",
                "warn",
                "--cpuset-threads",
                "--drain-strategy",
                "immediate",
                "--component-log-level",
                "misc:error",
                "--drain-time-s",
                "60"
              ],
              "command": [
                "envoy"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/envoy:distroless-v1.36.4",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "httpGet": {
                    "path": "/shutdown/ready",
                    "port": 19002,
                    "scheme": "HTTP"
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "envoy",
              "ports": [
                {
                  "containerPort": 19001,
                  "name": "metrics",
                  "protocol": "TCP"
                },
                {
                  "containerPort": 19003,
                  "name": "readiness",
                  "protocol": "TCP"
                }
              ],
              "readinessProbe": {
                "failureThreshold": 1,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 5,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "100m",
                  "memory": "512Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File",
              "volumeMounts": [
                {
                  "mountPath": "/certs",
                  "name": "certs",
                  "readOnly": true
                },
                {
                  "mountPath": "/sds",
                  "name": "sds"
                }
              ]
            },
            {
              "args": [
                "envoy",
                "shutdown-manager"
              ],
              "command": [
                "envoy-gateway"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/gateway:v1.6.3",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "exec": {
                    "command": [
                      "envoy-gateway",
                      "envoy",
                      "shutdown"
                    ]
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "shutdown-manager",
              "readinessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "10m",
                  "memory": "32Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File"
            }
          ],
          "dnsPolicy": "ClusterFirst",
          "restartPolicy": "Always",
          "schedulerName": "default-scheduler",
          "securityContext": {},
          "serviceAccount": "envoy-tenant-primary-default-udp-gw-296515a9",
          "serviceAccountName": "envoy-tenant-primary-default-udp-gw-296515a9",
          "terminationGracePeriodSeconds": 360,
          "volumes": [
            {
              "name": "certs",
              "secret": {
                "defaultMode": 420,
                "secretName": "envoy"
              }
            },
            {
              "configMap": {
                "defaultMode": 420,
                "items": [
                  {
                    "key": "xds-trusted-ca.json",
                    "path": "xds-trusted-ca.json"
                  },
                  {
                    "key": "xds-certificate.json",
                    "path": "xds-certificate.json"
                  }
                ],
                "name": "envoy-tenant-primary-default-udp-gw-296515a9",
                "optional": false
              },
              "name": "sds"
            }
          ]
        }
      }
    },
    "status": {
      "availableReplicas": 1,
      "conditions": [
        {
          "lastTransitionTime": "2026-03-13T07:53:25Z",
          "lastUpdateTime": "2026-03-13T07:53:38Z",
          "message": "ReplicaSet \"envoy-tenant-primary-default-udp-gw-296515a9-6459468747\" has successfully progressed.",
          "reason": "NewReplicaSetAvailable",
          "status": "True",
          "type": "Progressing"
        },
        {
          "lastTransitionTime": "2026-03-13T08:52:17Z",
          "lastUpdateTime": "2026-03-13T08:52:17Z",
          "message": "Deployment has minimum availability.",
          "reason": "MinimumReplicasAvailable",
          "status": "True",
          "type": "Available"
        }
      ],
      "observedGeneration": 1,
      "readyReplicas": 1,
      "replicas": 1,
      "terminatingReplicas": 0,
      "updatedReplicas": 1
    }
  },
  {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "annotations": {
        "deployment.kubernetes.io/revision": "1"
      },
      "creationTimestamp": "2026-03-13T07:53:33Z",
      "generation": 1,
      "labels": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-kubelb-int-conv",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-secondary"
      },
      "name": "envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766",
      "namespace": "kubelb",
      "ownerReferences": [
        {
          "apiVersion": "gateway.networking.k8s.io/v1",
          "kind": "GatewayClass",
          "name": "eg",
          "uid": "3846d2e8-2867-4f22-8aa2-f613041cb7ed"
        }
      ],
      "resourceVersion": "280264",
      "uid": "2d5baf17-d339-4ebc-9b90-083fcdd483fb"
    },
    "spec": {
      "progressDeadlineSeconds": 600,
      "replicas": 1,
      "revisionHistoryLimit": 10,
      "selector": {
        "matchLabels": {
          "app.kubernetes.io/component": "proxy",
          "app.kubernetes.io/managed-by": "envoy-gateway",
          "app.kubernetes.io/name": "envoy",
          "gateway.envoyproxy.io/owning-gateway-name": "default-kubelb-int-conv",
          "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-secondary"
        }
      },
      "strategy": {
        "rollingUpdate": {
          "maxSurge": "25%",
          "maxUnavailable": "25%"
        },
        "type": "RollingUpdate"
      },
      "template": {
        "metadata": {
          "annotations": {
            "prometheus.io/path": "/stats/prometheus",
            "prometheus.io/port": "19001",
            "prometheus.io/scrape": "true"
          },
          "labels": {
            "app.kubernetes.io/component": "proxy",
            "app.kubernetes.io/managed-by": "envoy-gateway",
            "app.kubernetes.io/name": "envoy",
            "gateway.envoyproxy.io/owning-gateway-name": "default-kubelb-int-conv",
            "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-secondary"
          }
        },
        "spec": {
          "automountServiceAccountToken": false,
          "containers": [
            {
              "args": [
                "--service-cluster",
                "tenant-secondary/default-kubelb-int-conv",
                "--service-node",
                "$(ENVOY_POD_NAME)",
                "--config-yaml",
                "admin:\n  access_log:\n  - name: envoy.access_loggers.file\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.access_loggers.file.v3.FileAccessLog\n      path: /dev/null\n  address:\n    socket_address:\n      address: 127.0.0.1\n      port_value: 19000\ncluster_manager:\n  local_cluster_name: tenant-secondary/default-kubelb-int-conv\nnode:\n  locality:\n    zone: $(ENVOY_SERVICE_ZONE)\nlayered_runtime:\n  layers:\n  - name: global_config\n    static_layer:\n      envoy.restart_features.use_eds_cache_for_ads: true\n      re2.max_program_size.error_level: 4294967295\n      re2.max_program_size.warn_level: 1000\ndynamic_resources:\n  ads_config:\n    api_type: DELTA_GRPC\n    transport_api_version: V3\n    grpc_services:\n    - envoy_grpc:\n        cluster_name: xds_cluster\n    set_node_on_first_message_only: true\n  lds_config:\n    ads: {}\n    resource_api_version: V3\n  cds_config:\n    ads: {}\n    resource_api_version: V3\nstatic_resources:\n  listeners:\n  - name: envoy-gateway-proxy-stats-0.0.0.0-19001\n    address:\n      socket_address:\n        address: '0.0.0.0'\n        port_value: 19001\n        protocol: TCP\n    bypass_overload_manager: true\n    filter_chains:\n    - filters:\n      - name: envoy.filters.network.http_connection_manager\n        typed_config:\n          \"@type\": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n          stat_prefix: eg-stats-http\n          normalize_path: true\n          route_config:\n            name: local_route\n            virtual_hosts:\n            - name: prometheus_stats\n              domains:\n              - \"*\"\n              routes:\n              - match:\n                  path: /stats/prometheus\n                  headers:\n                  - name: \":method\"\n                    string_match:\n                      exact: GET\n                route:\n                  cluster: prometheus_stats\n          http_filters:\n          - name: envoy.filters.http.router\n            typed_config:\n              \"@type\": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router\n  clusters:\n  - name: prometheus_stats\n    connect_timeout: 0.250s\n    type: STATIC\n    lb_policy: ROUND_ROBIN\n    load_assignment:\n      cluster_name: prometheus_stats\n      endpoints:\n      - lb_endpoints:\n        - endpoint:\n            address:\n              socket_address:\n                address: 127.0.0.1\n                port_value: 19000\n  - connect_timeout: 10s\n    eds_cluster_config:\n      eds_config:\n        ads: {}\n        resource_api_version: 'V3'\n      service_name: tenant-secondary/default-kubelb-int-conv\n    load_balancing_policy:\n      policies:\n      - typed_extension_config:\n          name: 'envoy.load_balancing_policies.least_request'\n          typed_config:\n            '@type': 'type.googleapis.com/envoy.extensions.load_balancing_policies.least_request.v3.LeastRequest'\n            locality_lb_config:\n              zone_aware_lb_config:\n                min_cluster_size: '1'\n    name: tenant-secondary/default-kubelb-int-conv\n    type: EDS\n  - connect_timeout: 10s\n    load_assignment:\n      cluster_name: xds_cluster\n      endpoints:\n      - load_balancing_weight: 1\n        lb_endpoints:\n        - load_balancing_weight: 1\n          endpoint:\n            address:\n              socket_address:\n                address: envoy-gateway.kubelb.svc.cluster.local.\n                port_value: 18000\n    typed_extension_protocol_options:\n      envoy.extensions.upstreams.http.v3.HttpProtocolOptions:\n        \"@type\": \"type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions\"\n        explicit_http_config:\n          http2_protocol_options:\n            connection_keepalive:\n              interval: 30s\n              timeout: 5s\n    name: xds_cluster\n    type: STRICT_DNS\n    transport_socket:\n      name: envoy.transport_sockets.tls\n      typed_config:\n        \"@type\": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext\n        common_tls_context:\n          tls_params:\n            tls_maximum_protocol_version: TLSv1_3\n          tls_certificate_sds_secret_configs:\n          - name: xds_certificate\n            sds_config:\n              path_config_source:\n                path: /sds/xds-certificate.json\n              resource_api_version: V3\n          validation_context_sds_secret_config:\n            name: xds_trusted_ca\n            sds_config:\n              path_config_source:\n                path: /sds/xds-trusted-ca.json\n              resource_api_version: V3\noverload_manager:\n  refresh_interval: 0.25s\n  resource_monitors:\n  - name: \"envoy.resource_monitors.global_downstream_max_connections\"\n    typed_config:\n      \"@type\": type.googleapis.com/envoy.extensions.resource_monitors.downstream_connections.v3.DownstreamConnectionsConfig\n      max_active_downstream_connections: 50000\n",
                "--log-level",
                "warn",
                "--cpuset-threads",
                "--drain-strategy",
                "immediate",
                "--component-log-level",
                "misc:error",
                "--drain-time-s",
                "60"
              ],
              "command": [
                "envoy"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/envoy:distroless-v1.36.4",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "httpGet": {
                    "path": "/shutdown/ready",
                    "port": 19002,
                    "scheme": "HTTP"
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "envoy",
              "ports": [
                {
                  "containerPort": 19001,
                  "name": "metrics",
                  "protocol": "TCP"
                },
                {
                  "containerPort": 19003,
                  "name": "readiness",
                  "protocol": "TCP"
                }
              ],
              "readinessProbe": {
                "failureThreshold": 1,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 5,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "100m",
                  "memory": "512Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/ready",
                  "port": 19003,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File",
              "volumeMounts": [
                {
                  "mountPath": "/certs",
                  "name": "certs",
                  "readOnly": true
                },
                {
                  "mountPath": "/sds",
                  "name": "sds"
                }
              ]
            },
            {
              "args": [
                "envoy",
                "shutdown-manager"
              ],
              "command": [
                "envoy-gateway"
              ],
              "env": [
                {
                  "name": "ENVOY_POD_NAMESPACE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.namespace"
                    }
                  }
                },
                {
                  "name": "ENVOY_POD_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.name"
                    }
                  }
                },
                {
                  "name": "ENVOY_SERVICE_ZONE",
                  "valueFrom": {
                    "fieldRef": {
                      "apiVersion": "v1",
                      "fieldPath": "metadata.annotations['topology.kubernetes.io/zone']"
                    }
                  }
                }
              ],
              "image": "docker.io/envoyproxy/gateway:v1.6.3",
              "imagePullPolicy": "IfNotPresent",
              "lifecycle": {
                "preStop": {
                  "exec": {
                    "command": [
                      "envoy-gateway",
                      "envoy",
                      "shutdown"
                    ]
                  }
                }
              },
              "livenessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "name": "shutdown-manager",
              "readinessProbe": {
                "failureThreshold": 3,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "resources": {
                "requests": {
                  "cpu": "10m",
                  "memory": "32Mi"
                }
              },
              "securityContext": {
                "allowPrivilegeEscalation": false,
                "capabilities": {
                  "drop": [
                    "ALL"
                  ]
                },
                "privileged": false,
                "runAsGroup": 65532,
                "runAsNonRoot": true,
                "runAsUser": 65532,
                "seccompProfile": {
                  "type": "RuntimeDefault"
                }
              },
              "startupProbe": {
                "failureThreshold": 30,
                "httpGet": {
                  "path": "/healthz",
                  "port": 19002,
                  "scheme": "HTTP"
                },
                "periodSeconds": 10,
                "successThreshold": 1,
                "timeoutSeconds": 1
              },
              "terminationMessagePath": "/dev/termination-log",
              "terminationMessagePolicy": "File"
            }
          ],
          "dnsPolicy": "ClusterFirst",
          "restartPolicy": "Always",
          "schedulerName": "default-scheduler",
          "securityContext": {},
          "serviceAccount": "envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766",
          "serviceAccountName": "envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766",
          "terminationGracePeriodSeconds": 360,
          "volumes": [
            {
              "name": "certs",
              "secret": {
                "defaultMode": 420,
                "secretName": "envoy"
              }
            },
            {
              "configMap": {
                "defaultMode": 420,
                "items": [
                  {
                    "key": "xds-trusted-ca.json",
                    "path": "xds-trusted-ca.json"
                  },
                  {
                    "key": "xds-certificate.json",
                    "path": "xds-certificate.json"
                  }
                ],
                "name": "envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766",
                "optional": false
              },
              "name": "sds"
            }
          ]
        }
      }
    },
    "status": {
      "availableReplicas": 1,
      "conditions": [
        {
          "lastTransitionTime": "2026-03-13T07:53:33Z",
          "lastUpdateTime": "2026-03-13T07:53:45Z",
          "message": "ReplicaSet \"envoy-tenant-secondary-default-kubelb-int-conv-ce1a2766-7ffc9ffffb\" has successfully progressed.",
          "reason": "NewReplicaSetAvailable",
          "status": "True",
          "type": "Progressing"
        },
        {
          "lastTransitionTime": "2026-03-13T08:57:32Z",
          "lastUpdateTime": "2026-03-13T08:57:32Z",
          "message": "Deployment has minimum availability.",
          "reason": "MinimumReplicasAvailable",
          "status": "True",
          "type": "Available"
        }
      ],
      "observedGeneration": 1,
      "readyReplicas": 1,
      "replicas": 1,
      "terminatingReplicas": 0,
      "updatedReplicas": 1
    }
  }
];

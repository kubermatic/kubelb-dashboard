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

export const services: GenericResource[] = [
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:47:20Z",
      "labels": {
        "component": "apiserver",
        "provider": "kubernetes"
      },
      "name": "kubernetes",
      "namespace": "default",
      "resourceVersion": "239",
      "uid": "f0a137d7-ff38-4932-a818-c915e4daea80"
    },
    "spec": {
      "clusterIP": "10.96.0.1",
      "clusterIPs": [
        "10.96.0.1"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "https",
          "port": 443,
          "protocol": "TCP",
          "targetPort": 6443
        }
      ],
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "prometheus.io/port": "9153",
        "prometheus.io/scrape": "true"
      },
      "creationTimestamp": "2026-03-13T07:47:21Z",
      "labels": {
        "k8s-app": "kube-dns",
        "kubernetes.io/cluster-service": "true",
        "kubernetes.io/name": "CoreDNS"
      },
      "name": "kube-dns",
      "namespace": "kube-system",
      "resourceVersion": "274",
      "uid": "5c90a7d7-973f-42cb-a064-68cd7771f572"
    },
    "spec": {
      "clusterIP": "10.96.0.10",
      "clusterIPs": [
        "10.96.0.10"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "dns",
          "port": 53,
          "protocol": "UDP",
          "targetPort": 53
        },
        {
          "name": "dns-tcp",
          "port": 53,
          "protocol": "TCP",
          "targetPort": 53
        },
        {
          "name": "metrics",
          "port": 9153,
          "protocol": "TCP",
          "targetPort": 9153
        }
      ],
      "selector": {
        "k8s-app": "kube-dns"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "envoy-gateway",
        "app.kubernetes.io/version": "v1.6.3",
        "control-plane": "envoy-gateway",
        "helm.sh/chart": "envoy-gateway-1.6.3"
      },
      "name": "envoy-gateway",
      "namespace": "kubelb",
      "resourceVersion": "956",
      "uid": "18b168e7-9080-48b8-ae66-de4bb163b07a"
    },
    "spec": {
      "clusterIP": "10.96.199.145",
      "clusterIPs": [
        "10.96.199.145"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "grpc",
          "port": 18000,
          "protocol": "TCP",
          "targetPort": 18000
        },
        {
          "name": "ratelimit",
          "port": 18001,
          "protocol": "TCP",
          "targetPort": 18001
        },
        {
          "name": "wasm",
          "port": 18002,
          "protocol": "TCP",
          "targetPort": 18002
        },
        {
          "name": "metrics",
          "port": 19001,
          "protocol": "TCP",
          "targetPort": 19001
        },
        {
          "name": "webhook",
          "port": 9443,
          "protocol": "TCP",
          "targetPort": 9443
        }
      ],
      "selector": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "envoy-gateway",
        "control-plane": "envoy-gateway"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:12Z",
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
      "resourceVersion": "2089",
      "uid": "43c50dbc-8b92-4494-9035-48974c529814"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.234.211",
      "clusterIPs": [
        "10.96.234.211"
      ],
      "externalTrafficPolicy": "Local",
      "healthCheckNodePort": 32751,
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http-80",
          "nodePort": 30391,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 10080
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-grpc-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.205",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:20Z",
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
      "resourceVersion": "2178",
      "uid": "dc4b60ef-ee96-4a75-983e-0448c46ec435"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.217.211",
      "clusterIPs": [
        "10.96.217.211"
      ],
      "externalTrafficPolicy": "Local",
      "healthCheckNodePort": 30722,
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "tcp-8088",
          "nodePort": 31729,
          "port": 8088,
          "protocol": "TCP",
          "targetPort": 8088
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-tcp-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.207",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:30Z",
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
      "resourceVersion": "2375",
      "uid": "31fe8dd6-3660-4e61-9d04-eef423f0e3a7"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.152.13",
      "clusterIPs": [
        "10.96.152.13"
      ],
      "externalTrafficPolicy": "Local",
      "healthCheckNodePort": 31199,
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "tls-6443",
          "nodePort": 31337,
          "port": 6443,
          "protocol": "TCP",
          "targetPort": 6443
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-tls-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.210",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:25Z",
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
      "resourceVersion": "2251",
      "uid": "d53300f3-0884-4515-acf5-d0461f7f7e77"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.91.35",
      "clusterIPs": [
        "10.96.91.35"
      ],
      "externalTrafficPolicy": "Local",
      "healthCheckNodePort": 31739,
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "udp-5300",
          "nodePort": 30519,
          "port": 5300,
          "protocol": "UDP",
          "targetPort": 5300
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-udp-gw",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.208",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:33Z",
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
      "resourceVersion": "2486",
      "uid": "e9abd619-1236-45ac-b8a6-add5d486e412"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.129.151",
      "clusterIPs": [
        "10.96.129.151"
      ],
      "externalTrafficPolicy": "Local",
      "healthCheckNodePort": 30475,
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http-80",
          "nodePort": 31461,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 10080
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "proxy",
        "app.kubernetes.io/managed-by": "envoy-gateway",
        "app.kubernetes.io/name": "envoy",
        "gateway.envoyproxy.io/owning-gateway-name": "default-kubelb-int-conv",
        "gateway.envoyproxy.io/owning-gateway-namespace": "tenant-secondary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.211",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "kubelb-manager-ee",
        "app.kubernetes.io/version": "v1.3.5",
        "helm.sh/chart": "kubelb-manager-ee-v1.3.5"
      },
      "name": "envoycp",
      "namespace": "kubelb",
      "resourceVersion": "980",
      "uid": "6fee94c3-a00e-4b4b-b34b-da1f218d081a"
    },
    "spec": {
      "clusterIP": "10.96.166.13",
      "clusterIPs": [
        "10.96.166.13"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http",
          "port": 8001,
          "protocol": "TCP",
          "targetPort": 8001
        }
      ],
      "selector": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "kubelb-manager-ee"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app": "cert-manager",
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "cert-manager",
        "app.kubernetes.io/version": "v1.19.3",
        "helm.sh/chart": "cert-manager-v1.19.3"
      },
      "name": "kubelb-cert-manager",
      "namespace": "kubelb",
      "resourceVersion": "965",
      "uid": "ba69928a-e669-4554-a66b-547048ebe386"
    },
    "spec": {
      "clusterIP": "10.96.185.153",
      "clusterIPs": [
        "10.96.185.153"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "tcp-prometheus-servicemonitor",
          "port": 9402,
          "protocol": "TCP",
          "targetPort": "http-metrics"
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "cert-manager"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app": "cainjector",
        "app.kubernetes.io/component": "cainjector",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "cainjector",
        "app.kubernetes.io/version": "v1.19.3",
        "helm.sh/chart": "cert-manager-v1.19.3"
      },
      "name": "kubelb-cert-manager-cainjector",
      "namespace": "kubelb",
      "resourceVersion": "973",
      "uid": "a4915258-cf37-498c-b870-5be8edf6fb6a"
    },
    "spec": {
      "clusterIP": "10.96.163.70",
      "clusterIPs": [
        "10.96.163.70"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http-metrics",
          "port": 9402,
          "protocol": "TCP",
          "targetPort": 9402
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "cainjector",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "cainjector"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app": "webhook",
        "app.kubernetes.io/component": "webhook",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "webhook",
        "app.kubernetes.io/version": "v1.19.3",
        "helm.sh/chart": "cert-manager-v1.19.3"
      },
      "name": "kubelb-cert-manager-webhook",
      "namespace": "kubelb",
      "resourceVersion": "943",
      "uid": "d5369218-d9de-4fb8-a94c-374bf45f4d1b"
    },
    "spec": {
      "clusterIP": "10.96.57.164",
      "clusterIPs": [
        "10.96.57.164"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "https",
          "port": 443,
          "protocol": "TCP",
          "targetPort": "https"
        },
        {
          "name": "metrics",
          "port": 9402,
          "protocol": "TCP",
          "targetPort": "http-metrics"
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "webhook",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "webhook"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "ingress-nginx",
        "app.kubernetes.io/part-of": "ingress-nginx",
        "app.kubernetes.io/version": "1.15.0",
        "helm.sh/chart": "ingress-nginx-4.15.0"
      },
      "name": "kubelb-ingress-nginx-controller",
      "namespace": "kubelb",
      "resourceVersion": "1440",
      "uid": "ac690c01-2921-4fd7-b4e2-9051b7ad6e01"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.157.68",
      "clusterIPs": [
        "10.96.157.68"
      ],
      "externalTrafficPolicy": "Local",
      "healthCheckNodePort": 30594,
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "appProtocol": "http",
          "name": "http",
          "nodePort": 31540,
          "port": 80,
          "protocol": "TCP",
          "targetPort": "http"
        },
        {
          "appProtocol": "https",
          "name": "https",
          "nodePort": 32746,
          "port": 443,
          "protocol": "TCP",
          "targetPort": "https"
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "ingress-nginx"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.200",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "ingress-nginx",
        "app.kubernetes.io/part-of": "ingress-nginx",
        "app.kubernetes.io/version": "1.15.0",
        "helm.sh/chart": "ingress-nginx-4.15.0"
      },
      "name": "kubelb-ingress-nginx-controller-admission",
      "namespace": "kubelb",
      "resourceVersion": "957",
      "uid": "547f69d7-4d74-47a5-aec4-0f9e28190cb9"
    },
    "spec": {
      "clusterIP": "10.96.134.98",
      "clusterIPs": [
        "10.96.134.98"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "appProtocol": "https",
          "name": "https-webhook",
          "port": 443,
          "protocol": "TCP",
          "targetPort": "webhook"
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "ingress-nginx"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "kubelb-manager-ee",
        "app.kubernetes.io/version": "v1.3.5",
        "helm.sh/chart": "kubelb-manager-ee-v1.3.5"
      },
      "name": "kubelb-metrics-service",
      "namespace": "kubelb",
      "resourceVersion": "940",
      "uid": "02440911-e82d-4513-9996-22536550e0bb"
    },
    "spec": {
      "clusterIP": "10.96.201.242",
      "clusterIPs": [
        "10.96.201.242"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "metrics",
          "port": 8443,
          "protocol": "TCP",
          "targetPort": "metrics"
        }
      ],
      "selector": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "kubelb-manager-ee"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "meta.helm.sh/release-name": "kubelb",
        "meta.helm.sh/release-namespace": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:49:12Z",
      "labels": {
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/managed-by": "Helm",
        "app.kubernetes.io/name": "metallb",
        "app.kubernetes.io/version": "v0.15.3",
        "helm.sh/chart": "metallb-0.15.3"
      },
      "name": "metallb-webhook-service",
      "namespace": "kubelb",
      "resourceVersion": "944",
      "uid": "934eb2fb-4c78-442b-8c36-0ce03112c7ae"
    },
    "spec": {
      "clusterIP": "10.96.183.11",
      "clusterIPs": [
        "10.96.183.11"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 443,
          "protocol": "TCP",
          "targetPort": 9443
        }
      ],
      "selector": {
        "app.kubernetes.io/component": "controller",
        "app.kubernetes.io/instance": "kubelb",
        "app.kubernetes.io/name": "metallb"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:15Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "api-health",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-api-ingress-api-health",
      "namespace": "tenant-primary",
      "resourceVersion": "2114",
      "uid": "623bab3f-6419-4ae2-b7cd-1b2c8a648700"
    },
    "spec": {
      "clusterIP": "10.96.228.222",
      "clusterIPs": [
        "10.96.228.222"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 80,
          "protocol": "TCP",
          "targetPort": 57619
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:13Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "api-v1",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-api-ingress-api-v1",
      "namespace": "tenant-primary",
      "resourceVersion": "2100",
      "uid": "53e33462-c15f-4caa-99cb-66aaf2045bcc"
    },
    "spec": {
      "clusterIP": "10.96.21.124",
      "clusterIPs": [
        "10.96.21.124"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 80,
          "protocol": "TCP",
          "targetPort": 54967
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:16Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "api-v2",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-api-ingress-api-v2",
      "namespace": "tenant-primary",
      "resourceVersion": "2118",
      "uid": "d7451670-f469-4400-97d5-792f9530ea66"
    },
    "spec": {
      "clusterIP": "10.96.207.195",
      "clusterIPs": [
        "10.96.207.195"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 80,
          "protocol": "TCP",
          "targetPort": 12526
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:09Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "docs-site",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-docs-site-docs-site",
      "namespace": "tenant-primary",
      "resourceVersion": "2004",
      "uid": "1cfa80c8-bb98-488d-8d6f-15b8a617bd5b"
    },
    "spec": {
      "clusterIP": "10.96.67.218",
      "clusterIPs": [
        "10.96.67.218"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 80,
          "protocol": "TCP",
          "targetPort": 62889
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:10Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "grpc-yages",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-grpc-streaming-grpc-yages",
      "namespace": "tenant-primary",
      "resourceVersion": "2023",
      "uid": "c79799cf-1b19-418c-860f-a2a2f747c75a"
    },
    "spec": {
      "clusterIP": "10.96.59.25",
      "clusterIPs": [
        "10.96.59.25"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 9000,
          "protocol": "TCP",
          "targetPort": 13486
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:18Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tcp-echo",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-tcp-echo-route-tcp-echo",
      "namespace": "tenant-primary",
      "resourceVersion": "2143",
      "uid": "602c7103-b537-449c-8074-12119f8098de"
    },
    "spec": {
      "clusterIP": "10.96.83.182",
      "clusterIPs": [
        "10.96.83.182"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 3000,
          "protocol": "TCP",
          "targetPort": 50247
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:26Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tls-nginx",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-tls-passthrough-tls-nginx",
      "namespace": "tenant-primary",
      "resourceVersion": "2260",
      "uid": "763df0e6-f447-4d3d-bb0b-c9eb2454c060"
    },
    "spec": {
      "clusterIP": "10.96.225.29",
      "clusterIPs": [
        "10.96.225.29"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 443,
          "protocol": "TCP",
          "targetPort": 41555
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1"
      },
      "creationTimestamp": "2026-03-13T07:53:21Z",
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "udp-coredns",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-udp-dns-route-udp-coredns",
      "namespace": "tenant-primary",
      "resourceVersion": "2199",
      "uid": "4be1b137-8bfe-4570-a5e4-6c69c0b3ee73"
    },
    "spec": {
      "clusterIP": "10.96.93.243",
      "clusterIPs": [
        "10.96.93.243"
      ],
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "port": 53,
          "protocol": "UDP",
          "targetPort": 58459
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "ClusterIP"
    },
    "status": {
      "loadBalancer": {}
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:07Z",
      "labels": {
        "app.kubernetes.io/name": "tenant-primary",
        "kubelb.k8c.io/lb-name": "3b511c1a-6b5b-410b-af3e-6d028148a969",
        "kubelb.k8c.io/lb-namespace": "tenant-primary",
        "kubelb.k8c.io/origin-name": "web-frontend",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "envoy-3b511c1a-6b5b-410b-af3e-6d028148a969",
      "namespace": "tenant-primary",
      "resourceVersion": "1978",
      "uid": "8181784f-8e42-4311-adbc-9c5e30b37d38"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.128.215",
      "clusterIPs": [
        "10.96.128.215"
      ],
      "externalTrafficPolicy": "Cluster",
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http",
          "nodePort": 31533,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 57924
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.203",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:08Z",
      "labels": {
        "app.kubernetes.io/name": "tenant-primary",
        "kubelb.k8c.io/lb-name": "ab888762-02d4-415d-bf50-766100b4ba73",
        "kubelb.k8c.io/lb-namespace": "tenant-primary",
        "kubelb.k8c.io/origin-name": "api-gateway",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "envoy-ab888762-02d4-415d-bf50-766100b4ba73",
      "namespace": "tenant-primary",
      "resourceVersion": "57478",
      "uid": "d8d7cdc0-b3b5-4075-a54b-9e7b926dfe09"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.154.32",
      "clusterIPs": [
        "10.96.154.32"
      ],
      "externalTrafficPolicy": "Cluster",
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "grpc",
          "nodePort": 31496,
          "port": 9090,
          "protocol": "TCP",
          "targetPort": 25582
        },
        {
          "name": "http",
          "nodePort": 30502,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 61567
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.204",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:50:14Z",
      "labels": {
        "app.kubernetes.io/name": "tenant-primary",
        "kubelb.k8c.io/lb-name": "e243fc78-a94c-489f-8c95-389dbfd03c43",
        "kubelb.k8c.io/lb-namespace": "tenant-primary",
        "kubelb.k8c.io/origin-name": "echo-shared-lb",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "envoy-e243fc78-a94c-489f-8c95-389dbfd03c43",
      "namespace": "tenant-primary",
      "resourceVersion": "1465",
      "uid": "0e9e8268-ee10-49fa-a82c-64769c688270"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.202.65",
      "clusterIPs": [
        "10.96.202.65"
      ],
      "externalTrafficPolicy": "Cluster",
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "80-tcp",
          "nodePort": 30494,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 57743
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-primary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.201",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T08:50:04Z",
      "name": "default-staging-app-staging-web",
      "namespace": "tenant-secondary",
      "resourceVersion": "251264",
      "uid": "831aeb75-4112-40cf-9eef-1d35f811bf0c"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.91.216",
      "clusterIPs": [
        "10.96.91.216"
      ],
      "externalTrafficPolicy": "Cluster",
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http",
          "nodePort": 30204,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 24460
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-secondary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.209",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:53:13Z",
      "labels": {
        "app.kubernetes.io/name": "tenant-secondary",
        "kubelb.k8c.io/lb-name": "02c9ab0a-005c-4746-b2d3-276f3e4a2280",
        "kubelb.k8c.io/lb-namespace": "tenant-secondary",
        "kubelb.k8c.io/origin-name": "staging-web",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "envoy-02c9ab0a-005c-4746-b2d3-276f3e4a2280",
      "namespace": "tenant-secondary",
      "resourceVersion": "2125",
      "uid": "e2337d48-05e0-4c66-863c-d5ad7a22ebf3"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.49.121",
      "clusterIPs": [
        "10.96.49.121"
      ],
      "externalTrafficPolicy": "Cluster",
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "http",
          "nodePort": 30242,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 32897
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-secondary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.206",
            "ipMode": "VIP"
          }
        ]
      }
    }
  },
  {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "annotations": {
        "load-balancer.hetzner.cloud/location": "fsn1",
        "metallb.io/ip-allocated-from-pool": "kubelb"
      },
      "creationTimestamp": "2026-03-13T07:50:15Z",
      "labels": {
        "app.kubernetes.io/name": "tenant-secondary",
        "kubelb.k8c.io/lb-name": "91c9946e-7828-48c4-86f9-6ca4ac3be70f",
        "kubelb.k8c.io/lb-namespace": "tenant-secondary",
        "kubelb.k8c.io/origin-name": "echo-shared-lb",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "envoy-91c9946e-7828-48c4-86f9-6ca4ac3be70f",
      "namespace": "tenant-secondary",
      "resourceVersion": "1493",
      "uid": "b9dca4a3-76a9-44e1-b9d8-d967fe4eb1f0"
    },
    "spec": {
      "allocateLoadBalancerNodePorts": true,
      "clusterIP": "10.96.135.136",
      "clusterIPs": [
        "10.96.135.136"
      ],
      "externalTrafficPolicy": "Cluster",
      "internalTrafficPolicy": "Cluster",
      "ipFamilies": [
        "IPv4"
      ],
      "ipFamilyPolicy": "SingleStack",
      "ports": [
        {
          "name": "80-tcp",
          "nodePort": 32188,
          "port": 80,
          "protocol": "TCP",
          "targetPort": 61524
        }
      ],
      "selector": {
        "app.kubernetes.io/name": "tenant-secondary"
      },
      "sessionAffinity": "None",
      "type": "LoadBalancer"
    },
    "status": {
      "loadBalancer": {
        "ingress": [
          {
            "ip": "172.18.255.202",
            "ipMode": "VIP"
          }
        ]
      }
    }
  }
];

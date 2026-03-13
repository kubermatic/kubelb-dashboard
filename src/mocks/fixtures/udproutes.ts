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

export const udpRoutes: GenericResource[] = [
  {
    "apiVersion": "gateway.networking.k8s.io/v1alpha2",
    "kind": "UDPRoute",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:23Z",
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "udp-dns-route",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-udp-dns-route",
      "namespace": "tenant-primary",
      "ownerReferences": [
        {
          "apiVersion": "kubelb.k8c.io/v1alpha1",
          "controller": true,
          "kind": "Route",
          "name": "4fa7ccdf-c444-4567-8845-65fab022683c",
          "uid": "d3b9ab1a-0ac1-4fde-a12c-1692a67425f7"
        }
      ],
      "resourceVersion": "2215",
      "uid": "7c87421c-829e-4319-bc33-9cf53fd28724"
    },
    "spec": {
      "parentRefs": [
        {
          "group": "gateway.networking.k8s.io",
          "kind": "Gateway",
          "name": "default-udp-gw",
          "sectionName": "udp"
        }
      ],
      "rules": [
        {
          "backendRefs": [
            {
              "group": "",
              "kind": "Service",
              "name": "default-udp-dns-route-udp-coredns",
              "port": 53,
              "weight": 1
            }
          ]
        }
      ]
    },
    "status": {
      "parents": [
        {
          "conditions": [
            {
              "lastTransitionTime": "2026-03-13T07:53:23Z",
              "message": "Route is accepted",
              "observedGeneration": 1,
              "reason": "Accepted",
              "status": "True",
              "type": "Accepted"
            },
            {
              "lastTransitionTime": "2026-03-13T07:53:23Z",
              "message": "Resolved all the Object references for the Route",
              "observedGeneration": 1,
              "reason": "ResolvedRefs",
              "status": "True",
              "type": "ResolvedRefs"
            }
          ],
          "controllerName": "gateway.envoyproxy.io/gatewayclass-controller",
          "parentRef": {
            "group": "gateway.networking.k8s.io",
            "kind": "Gateway",
            "name": "default-udp-gw",
            "sectionName": "udp"
          }
        }
      ]
    }
  }
];

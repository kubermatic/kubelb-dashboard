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

export const tcpRoutes: GenericResource[] = [
  {
    "apiVersion": "gateway.networking.k8s.io/v1alpha2",
    "kind": "TCPRoute",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:18Z",
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tcp-echo-route",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-tcp-echo-route",
      "namespace": "tenant-primary",
      "ownerReferences": [
        {
          "apiVersion": "kubelb.k8c.io/v1alpha1",
          "controller": true,
          "kind": "Route",
          "name": "ef106272-41d1-481e-922b-e17381f5096e",
          "uid": "7d72c149-97ff-4388-a465-f4718c0bb799"
        }
      ],
      "resourceVersion": "2151",
      "uid": "7628c0b9-e8e3-43fb-a126-73d02fc7bb7f"
    },
    "spec": {
      "parentRefs": [
        {
          "group": "gateway.networking.k8s.io",
          "kind": "Gateway",
          "name": "default-tcp-gw",
          "sectionName": "tcp"
        }
      ],
      "rules": [
        {
          "backendRefs": [
            {
              "group": "",
              "kind": "Service",
              "name": "default-tcp-echo-route-tcp-echo",
              "port": 3000,
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
              "lastTransitionTime": "2026-03-13T07:53:18Z",
              "message": "Route is accepted",
              "observedGeneration": 1,
              "reason": "Accepted",
              "status": "True",
              "type": "Accepted"
            },
            {
              "lastTransitionTime": "2026-03-13T07:53:18Z",
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
            "name": "default-tcp-gw",
            "sectionName": "tcp"
          }
        }
      ]
    }
  }
];

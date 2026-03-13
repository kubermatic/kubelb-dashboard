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

export const grpcRoutes: GenericResource[] = [
  {
    "apiVersion": "gateway.networking.k8s.io/v1",
    "kind": "GRPCRoute",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:10Z",
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "grpc-streaming",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-grpc-streaming",
      "namespace": "tenant-primary",
      "ownerReferences": [
        {
          "apiVersion": "kubelb.k8c.io/v1alpha1",
          "controller": true,
          "kind": "Route",
          "name": "84e07908-2882-42ee-aac9-40e363f6fde0",
          "uid": "a8a24a3b-8024-4e33-9afe-7ce2578ba534"
        }
      ],
      "resourceVersion": "2037",
      "uid": "e2616890-793b-47f8-af65-d51e1437086e"
    },
    "spec": {
      "hostnames": [
        "grpc.example.nip.io"
      ],
      "parentRefs": [
        {
          "group": "gateway.networking.k8s.io",
          "kind": "Gateway",
          "name": "default-grpc-gw"
        }
      ],
      "rules": [
        {
          "backendRefs": [
            {
              "group": "",
              "kind": "Service",
              "name": "default-grpc-streaming-grpc-yages",
              "port": 9000,
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
              "lastTransitionTime": "2026-03-13T07:53:11Z",
              "message": "Route is accepted",
              "observedGeneration": 1,
              "reason": "Accepted",
              "status": "True",
              "type": "Accepted"
            },
            {
              "lastTransitionTime": "2026-03-13T07:53:11Z",
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
            "name": "default-grpc-gw"
          }
        }
      ]
    }
  }
];

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

export const httpRoutes: GenericResource[] = [
  {
    "apiVersion": "gateway.networking.k8s.io/v1",
    "kind": "HTTPRoute",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:30Z",
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "staging-app",
        "kubelb.k8c.io/origin-ns": "default",
        "kubelb.k8c.io/source-ingress": "staging-app.default"
      },
      "name": "default-staging-app",
      "namespace": "tenant-secondary",
      "ownerReferences": [
        {
          "apiVersion": "kubelb.k8c.io/v1alpha1",
          "controller": true,
          "kind": "Route",
          "name": "f8acc75b-b2b5-43c7-9b17-23bc4227526d",
          "uid": "6c3d3d88-4bfd-48f8-ab92-51834e54069f"
        }
      ],
      "resourceVersion": "251247",
      "uid": "6eb4cf2a-0cdb-4724-9e20-72ee93e2f67b"
    },
    "spec": {
      "hostnames": [
        "staging.example.nip.io"
      ],
      "parentRefs": [
        {
          "group": "gateway.networking.k8s.io",
          "kind": "Gateway",
          "name": "default-kubelb-int-conv"
        }
      ],
      "rules": [
        {
          "backendRefs": [
            {
              "group": "",
              "kind": "Service",
              "name": "default-staging-app-staging-web",
              "port": 80,
              "weight": 1
            }
          ],
          "matches": [
            {
              "path": {
                "type": "PathPrefix",
                "value": "/"
              }
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
              "lastTransitionTime": "2026-03-13T08:50:04Z",
              "message": "Route is accepted",
              "observedGeneration": 1,
              "reason": "Accepted",
              "status": "True",
              "type": "Accepted"
            },
            {
              "lastTransitionTime": "2026-03-13T08:50:04Z",
              "message": "Failed to process route rule 0 backendRef 0: service tenant-secondary/default-staging-app-staging-web not found.",
              "observedGeneration": 1,
              "reason": "BackendNotFound",
              "status": "False",
              "type": "ResolvedRefs"
            }
          ],
          "controllerName": "gateway.envoyproxy.io/gatewayclass-controller",
          "parentRef": {
            "group": "gateway.networking.k8s.io",
            "kind": "Gateway",
            "name": "default-kubelb-int-conv"
          }
        }
      ]
    }
  }
];

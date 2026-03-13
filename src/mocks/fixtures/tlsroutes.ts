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

export const tlsRoutes: GenericResource[] = [
  {
    "apiVersion": "gateway.networking.k8s.io/v1alpha3",
    "kind": "TLSRoute",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:26Z",
      "generation": 2,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "tls-passthrough",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "default-tls-passthrough",
      "namespace": "tenant-primary",
      "ownerReferences": [
        {
          "apiVersion": "kubelb.k8c.io/v1alpha1",
          "controller": true,
          "kind": "Route",
          "name": "a390f3fc-31cf-4de9-a85e-165776cfdbed",
          "uid": "9a95b42b-f84a-4a05-a8a4-03ebbb7e6a7b"
        }
      ],
      "resourceVersion": "2514",
      "uid": "613ca70c-5766-4fea-b2cd-ce76466f7f15"
    },
    "spec": {
      "hostnames": [
        "tls-app.example.nip.io"
      ],
      "parentRefs": [
        {
          "group": "gateway.networking.k8s.io",
          "kind": "Gateway",
          "name": "default-tls-gw",
          "sectionName": "tls"
        }
      ],
      "rules": [
        {
          "backendRefs": [
            {
              "group": "",
              "kind": "Service",
              "name": "default-tls-passthrough-tls-nginx",
              "port": 443,
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
              "lastTransitionTime": "2026-03-13T07:53:32Z",
              "message": "Route is accepted",
              "observedGeneration": 2,
              "reason": "Accepted",
              "status": "True",
              "type": "Accepted"
            },
            {
              "lastTransitionTime": "2026-03-13T07:53:32Z",
              "message": "Resolved all the Object references for the Route",
              "observedGeneration": 2,
              "reason": "ResolvedRefs",
              "status": "True",
              "type": "ResolvedRefs"
            }
          ],
          "controllerName": "gateway.envoyproxy.io/gatewayclass-controller",
          "parentRef": {
            "group": "gateway.networking.k8s.io",
            "kind": "Gateway",
            "name": "default-tls-gw",
            "sectionName": "tls"
          }
        }
      ]
    }
  }
];

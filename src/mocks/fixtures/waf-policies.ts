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

import type { WAFPolicy } from "@/types/kubelb";

export const wafPolicies: WAFPolicy[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "WAFPolicy",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:07Z",
      generation: 1,
      name: "api-rate-limit",
      resourceVersion: "1962",
      uid: "adade176-b499-43b8-971a-1df849e99b6c",
    },
    spec: {
      directives: [
        "SecRuleEngine On",
        "SecRequestBodyAccess On",
        "SecRequestBodyLimit 5242880",
      ],
      failureMode: "Open",
      targetSelector: {
        matchLabels: {
          "kubelb.k8c.io/origin-name": "product-service",
        },
      },
    },
    status: {
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:53:07Z",
          message: "Directives validated successfully",
          observedGeneration: 1,
          reason: "Valid",
          status: "True",
          type: "Valid",
        },
      ],
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "WAFPolicy",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:07Z",
      generation: 1,
      name: "global-owasp-crs",
      resourceVersion: "1961",
      uid: "02dcddaf-0846-4a61-ac1a-4f3624461914",
    },
    spec: {
      failureMode: "Closed",
      global: true,
    },
    status: {
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:53:07Z",
          message: "Directives validated successfully",
          observedGeneration: 1,
          reason: "Valid",
          status: "True",
          type: "Valid",
        },
      ],
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "WAFPolicy",
    metadata: {
      creationTimestamp: "2026-03-13T07:53:07Z",
      generation: 1,
      name: "staging-protection",
      resourceVersion: "1963",
      uid: "ab05635c-b4be-4bee-977d-94bcccd281a8",
    },
    spec: {
      directives: [
        "SecRuleEngine On",
        "SecRequestBodyAccess On",
        "SecRequestBodyLimit 13107200",
        "Include @crs-setup-conf",
        "Include @owasp_crs/*.conf",
      ],
      failureMode: "Closed",
      targetSelector: {
        matchLabels: {
          "kubelb.k8c.io/origin-resource-kind": "Ingress.networking.k8s.io",
        },
      },
    },
    status: {
      conditions: [
        {
          lastTransitionTime: "2026-03-13T07:53:07Z",
          message: "Directives validated successfully",
          observedGeneration: 1,
          reason: "Valid",
          status: "True",
          type: "Valid",
        },
      ],
    },
  },
];

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

import type { SyncSecret } from "@/types/kubelb";

export const syncSecrets: SyncSecret[] = [
  {
    "apiVersion": "kubelb.k8c.io/v1alpha1",
    "data": {
      "tls.crt": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNwRENDQVl3Q0NRRFUrcFE0cEhnU3BEQU5CZ2txaGtpRzl3MEJBUXNGQURBVU1SSXdFQVlEVlFRRERBbHMKYjJOaGJHaHZjM1F3SGhjTk1qTXdNVEF4TURBd01EQXdXaGNOTWpRd01UQXhNREF3TURBd1dqQVVNUkl3RUFZRApWUVFEREFsc2IyTmhiR2h2YzNRd2dnRWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUJEd0F3Z2dFS0FvSUJBUUM3CmR1bW15LWNlcnQtZGF0YS1mb3ItYXBpLXRscwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
      "tls.key": "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQzc3YTVhK0xrOWdSTXoKZHVtbXkta2V5LWRhdGEtZm9yLWFwaS10bHMKLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQo="
    },
    "kind": "SyncSecret",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:12Z",
      "finalizers": [
        "kubelb.k8c.io/cleanup"
      ],
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "api-tls",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "24548b4d-6fec-4d6d-85bd-8cadb3d4e149",
      "namespace": "tenant-primary",
      "resourceVersion": "2051",
      "uid": "66984d5c-a680-4c8e-9789-81656a7e1511"
    },
    "type": "kubernetes.io/tls"
  },
  {
    "apiVersion": "kubelb.k8c.io/v1alpha1",
    "data": {
      "password": "ZGFzaGJvYXJkLXRlc3QtcGFzc3dvcmQ=",
      "username": "YWRtaW4="
    },
    "kind": "SyncSecret",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:12Z",
      "finalizers": [
        "kubelb.k8c.io/cleanup"
      ],
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "app-credentials",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "8109f3dd-157e-424c-9af3-b5151b44593f",
      "namespace": "tenant-primary",
      "resourceVersion": "2057",
      "uid": "d07869f1-c0c5-4937-8198-eb8a1aefca55"
    },
    "type": "Opaque"
  },
  {
    "apiVersion": "kubelb.k8c.io/v1alpha1",
    "data": {
      "tls.crt": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNwRENDQVl3Q0NRRFUrcFE0cEhnU3BEQU5CZ2txaGtpRzl3MEJBUXNGQURBVU1SSXdFQVlEVlFRRERBbHMKZHVtbXktY2VydC1kYXRhLWZvci1zdGFnaW5nLXRscwotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
      "tls.key": "LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQzc3YTVhK0xrOWdSTXoKZHVtbXkta2V5LWRhdGEtZm9yLXN0YWdpbmctdGxzCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K"
    },
    "kind": "SyncSecret",
    "metadata": {
      "creationTimestamp": "2026-03-13T07:53:15Z",
      "finalizers": [
        "kubelb.k8c.io/cleanup"
      ],
      "generation": 1,
      "labels": {
        "kubelb.k8c.io/managed-by": "kubelb",
        "kubelb.k8c.io/origin-name": "staging-tls",
        "kubelb.k8c.io/origin-ns": "default"
      },
      "name": "5116d962-2aa6-4c94-9483-0f9b0a8370d9",
      "namespace": "tenant-secondary",
      "resourceVersion": "2110",
      "uid": "a8a469e8-2fa0-43eb-bfe5-e7d8e39a56f6"
    },
    "type": "kubernetes.io/tls"
  }
];

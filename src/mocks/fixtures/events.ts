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

import type { KubeEvent } from "@/types/kubernetes";

export const events: KubeEvent[] = [
  {
    metadata: {
      name: "3b511c1a-6b5b-410b-af3e-6d028148a969.17f8a5b1c9e0",
      namespace: "tenant-primary",
      uid: "1a8b6c2d-1111-4a1a-9a1a-000000000001",
      creationTimestamp: "2026-03-13T07:53:08Z",
      resourceVersion: "2001",
    },
    type: "Normal",
    reason: "ResourceSynced",
    message: "Successfully synced LoadBalancer resources to downstream cluster",
    count: 3,
    firstTimestamp: "2026-03-13T07:53:07Z",
    lastTimestamp: "2026-03-13T07:53:08Z",
    involvedObject: {
      kind: "LoadBalancer",
      name: "3b511c1a-6b5b-410b-af3e-6d028148a969",
      namespace: "tenant-primary",
      uid: "8e0788f7-3d3f-4e00-b5cf-8a3cb5f98fc6",
    },
    source: { component: "kubelb-manager" },
  },
  {
    metadata: {
      name: "3b511c1a-6b5b-410b-af3e-6d028148a969.17f8a5b1c9e1",
      namespace: "tenant-primary",
      uid: "1a8b6c2d-1111-4a1a-9a1a-000000000002",
      creationTimestamp: "2026-03-13T07:53:20Z",
      resourceVersion: "2002",
    },
    type: "Warning",
    reason: "EndpointNotReady",
    message: "Endpoint address 172.18.255.203 is not yet reachable",
    count: 1,
    firstTimestamp: "2026-03-13T07:53:20Z",
    lastTimestamp: "2026-03-13T07:53:20Z",
    involvedObject: {
      kind: "LoadBalancer",
      name: "3b511c1a-6b5b-410b-af3e-6d028148a969",
      namespace: "tenant-primary",
      uid: "8e0788f7-3d3f-4e00-b5cf-8a3cb5f98fc6",
    },
    source: { component: "kubelb-manager" },
  },
  {
    metadata: {
      name: "24691b93-49f1-44cb-9a08-1124c514db72.17f8a5b1c9e2",
      namespace: "tenant-primary",
      uid: "1a8b6c2d-1111-4a1a-9a1a-000000000003",
      creationTimestamp: "2026-03-13T07:53:12Z",
      resourceVersion: "2003",
    },
    type: "Normal",
    reason: "ResourceSynced",
    message: "Successfully reconciled Route",
    count: 1,
    firstTimestamp: "2026-03-13T07:53:12Z",
    lastTimestamp: "2026-03-13T07:53:12Z",
    involvedObject: {
      kind: "Route",
      name: "24691b93-49f1-44cb-9a08-1124c514db72",
      namespace: "tenant-primary",
      uid: "86e1e5b1-a169-4000-be0a-f23f1a3221da",
    },
    source: { component: "kubelb-manager" },
  },
  {
    metadata: {
      name: "24691b93-49f1-44cb-9a08-1124c514db72.17f8a5b1c9e3",
      namespace: "tenant-primary",
      uid: "1a8b6c2d-1111-4a1a-9a1a-000000000004",
      creationTimestamp: "2026-03-13T08:10:00Z",
      resourceVersion: "2004",
    },
    type: "Warning",
    reason: "BackendTrafficPolicyConflict",
    message: "Multiple BackendTrafficPolicies target the same Route; using the oldest one",
    count: 2,
    firstTimestamp: "2026-03-13T08:05:00Z",
    lastTimestamp: "2026-03-13T08:10:00Z",
    involvedObject: {
      kind: "Route",
      name: "24691b93-49f1-44cb-9a08-1124c514db72",
      namespace: "tenant-primary",
      uid: "86e1e5b1-a169-4000-be0a-f23f1a3221da",
    },
    source: { component: "kubelb-manager" },
  },
  {
    metadata: {
      name: "ab888762-02d4-415d-bf50-766100b4ba73.17f8a5b1c9e4",
      namespace: "tenant-primary",
      uid: "1a8b6c2d-1111-4a1a-9a1a-000000000005",
      creationTimestamp: "2026-03-13T07:53:09Z",
      resourceVersion: "2005",
    },
    type: "Normal",
    reason: "Created",
    message: "Created downstream Service envoy-ab888762-02d4-415d-bf50-766100b4ba73",
    count: 1,
    firstTimestamp: "2026-03-13T07:53:09Z",
    lastTimestamp: "2026-03-13T07:53:09Z",
    involvedObject: {
      kind: "LoadBalancer",
      name: "ab888762-02d4-415d-bf50-766100b4ba73",
      namespace: "tenant-primary",
      uid: "d8d7cdc0-b3b5-4075-a54b-9e7b926dfe09",
    },
    source: { component: "kubelb-manager" },
  },
];

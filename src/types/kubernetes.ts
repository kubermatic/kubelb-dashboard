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

export interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller?: boolean;
}

export interface ObjectMeta {
  name: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  creationTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  deletionTimestamp?: string;
  generation?: number;
  ownerReferences?: OwnerReference[];
}

export interface ListMeta {
  resourceVersion?: string;
  continue?: string;
  remainingItemCount?: number;
}

export interface KubeList<T> {
  apiVersion: string;
  kind: string;
  metadata: ListMeta;
  items: T[];
}

export interface Condition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastTransitionTime: string;
  reason: string;
  message: string;
  observedGeneration?: number;
}

export interface KubeStatus {
  kind: "Status";
  apiVersion: "v1";
  status: "Failure" | "Success";
  message: string;
  reason: string;
  code: number;
}

export interface ObjectReference {
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  uid?: string;
}

export interface WatchEvent<T> {
  type: "ADDED" | "MODIFIED" | "DELETED" | "ERROR";
  object: T;
}

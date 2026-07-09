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

const CORE_RESOURCES = "namespaces|services|secrets|pods";
const NAMESPACED_CORE_RESOURCES = "services|secrets|pods";

const ALLOWED_API_GROUPS =
  "kubelb\\.k8c\\.io|apps|networking\\.k8s\\.io|gateway\\.networking\\.k8s\\.io|gateway\\.envoyproxy\\.io|agentgateway\\.dev";

const PODS_SUBRESOURCE_RE = new RegExp(
  "^/api/v1/namespaces/[^/]+/pods/[^/]+/(exec|attach|portforward|proxy)(/|$)",
);
const CLUSTER_SCOPED_CORE_RE = new RegExp(`^/api/v1/(${CORE_RESOURCES})(/[^/]+)?$`);
const NAMESPACED_CORE_RE = new RegExp(
  `^/api/v1/namespaces/[^/]+/(${NAMESPACED_CORE_RESOURCES})(/.*)?$`,
);
const ALLOWED_GROUP_RE = new RegExp(`^/apis/(${ALLOWED_API_GROUPS})(/.*)?$`);
const CRD_RE = /^\/apis\/apiextensions\.k8s\.io\/v1\/customresourcedefinitions(\/|$)/;

export function isAllowedKubePath(path: string): boolean {
  if (path.includes("..") || path.includes("%")) {
    return false;
  }

  if (PODS_SUBRESOURCE_RE.test(path)) {
    return false;
  }

  if (path === "/api" || path === "/apis" || path === "/api/v1" || path === "/version") {
    return true;
  }

  if (path.startsWith("/openapi/")) {
    return true;
  }

  if (CLUSTER_SCOPED_CORE_RE.test(path) || NAMESPACED_CORE_RE.test(path)) {
    return true;
  }

  if (ALLOWED_GROUP_RE.test(path) || CRD_RE.test(path)) {
    return true;
  }

  return false;
}

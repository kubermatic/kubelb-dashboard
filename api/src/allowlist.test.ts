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

import { describe, expect, it } from "vitest";
import { isAllowedKubePath } from "./allowlist.js";

describe("isAllowedKubePath", () => {
  it.each([
    "/apis/kubelb.k8c.io/v1alpha1/tenants",
    "/apis/kubelb.k8c.io/v1alpha1/namespaces/foo/routes/bar",
    "/api/v1/namespaces",
    "/api/v1/namespaces/x/secrets/y",
    "/apis/apps/v1/namespaces/x/deployments",
    "/apis/gateway.networking.k8s.io/v1/httproutes",
    "/apis/apiextensions.k8s.io/v1/customresourcedefinitions/routes.kubelb.k8c.io",
    "/apis/kubelb.k8c.io/v1alpha1/wafpolicies",
    "/apis/agentgateway.dev/v1alpha1",
  ])("allows %s", (path) => {
    expect(isAllowedKubePath(path)).toBe(true);
  });

  it.each([
    "/api/v1/nodes",
    "/api/v1/configmaps",
    "/apis/rbac.authorization.k8s.io/v1/clusterroles",
    "/apis/kubelb.k8c.io/../rbac.authorization.k8s.io/v1/clusterroles",
    "/api/v1/namespaces/x/pods/y/exec",
    "/api/v1/namespaces/x/pods/y/proxy",
    "/api/v1/namespaces/x/secrets%2Fy",
  ])("denies %s", (path) => {
    expect(isAllowedKubePath(path)).toBe(false);
  });
});

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

export const queryKeys = {
  loadBalancers: {
    all: ["loadbalancers"] as const,
    list: (ns?: string) =>
      ns ? (["loadbalancers", "list", ns] as const) : (["loadbalancers", "list"] as const),
    detail: (ns: string, name: string) => ["loadbalancers", "detail", ns, name] as const,
  },
  routes: {
    all: ["routes"] as const,
    list: (ns?: string) => (ns ? (["routes", "list", ns] as const) : (["routes", "list"] as const)),
    detail: (ns: string, name: string) => ["routes", "detail", ns, name] as const,
  },
  tenants: {
    all: ["tenants"] as const,
    list: () => ["tenants", "list"] as const,
    detail: (name: string) => ["tenants", "detail", name] as const,
  },
  syncSecrets: {
    all: ["syncsecrets"] as const,
    list: (ns?: string) =>
      ns ? (["syncsecrets", "list", ns] as const) : (["syncsecrets", "list"] as const),
  },
  config: {
    all: ["config"] as const,
    list: () => ["config", "list"] as const,
  },
  pods: {
    list: (ns?: string) => (ns ? (["pods", "list", ns] as const) : (["pods", "list"] as const)),
  },
  deployments: {
    list: (ns?: string, labels?: string) =>
      ns
        ? (["deployments", "list", ns, labels] as const)
        : (["deployments", "list", labels] as const),
  },
  namespaces: {
    list: () => ["namespaces", "list"] as const,
  },
} as const;

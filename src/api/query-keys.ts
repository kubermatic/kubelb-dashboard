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
    detail: (ns: string, name: string) => ["syncsecrets", "detail", ns, name] as const,
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
    detail: (ns: string, name: string) => ["deployments", "detail", ns, name] as const,
  },
  wafPolicies: {
    all: ["wafpolicies"] as const,
    list: () => ["wafpolicies", "list"] as const,
    detail: (name: string) => ["wafpolicies", "detail", name] as const,
  },
  edition: {
    detect: () => ["edition", "detect"] as const,
  },
  auth: {
    session: () => ["auth", "session"] as const,
  },
  gateways: {
    all: ["gateways"] as const,
    list: (ns?: string, labels?: string) =>
      ns ? (["gateways", "list", ns, labels] as const) : (["gateways", "list", labels] as const),
  },
  httpRoutes: {
    all: ["httproutes"] as const,
    list: (ns?: string, labels?: string) =>
      ns
        ? (["httproutes", "list", ns, labels] as const)
        : (["httproutes", "list", labels] as const),
  },
  grpcRoutes: {
    all: ["grpcroutes"] as const,
    list: (ns?: string, labels?: string) =>
      ns
        ? (["grpcroutes", "list", ns, labels] as const)
        : (["grpcroutes", "list", labels] as const),
  },
  tcpRoutes: {
    all: ["tcproutes"] as const,
    list: (ns?: string, labels?: string) =>
      ns ? (["tcproutes", "list", ns, labels] as const) : (["tcproutes", "list", labels] as const),
  },
  udpRoutes: {
    all: ["udproutes"] as const,
    list: (ns?: string, labels?: string) =>
      ns ? (["udproutes", "list", ns, labels] as const) : (["udproutes", "list", labels] as const),
  },
  tlsRoutes: {
    all: ["tlsroutes"] as const,
    list: (ns?: string, labels?: string) =>
      ns ? (["tlsroutes", "list", ns, labels] as const) : (["tlsroutes", "list", labels] as const),
  },
  ingresses: {
    all: ["ingresses"] as const,
    list: (ns?: string, labels?: string) =>
      ns ? (["ingresses", "list", ns, labels] as const) : (["ingresses", "list", labels] as const),
  },
  backendTrafficPolicies: {
    all: ["backendtrafficpolicies"] as const,
    list: (ns?: string, labels?: string) =>
      ns
        ? (["backendtrafficpolicies", "list", ns, labels] as const)
        : (["backendtrafficpolicies", "list", labels] as const),
  },
  clientTrafficPolicies: {
    all: ["clienttrafficpolicies"] as const,
    list: (ns?: string, labels?: string) =>
      ns
        ? (["clienttrafficpolicies", "list", ns, labels] as const)
        : (["clienttrafficpolicies", "list", labels] as const),
  },
  services: {
    all: ["services"] as const,
    list: (ns?: string, labels?: string) =>
      ns ? (["services", "list", ns, labels] as const) : (["services", "list", labels] as const),
  },
} as const;

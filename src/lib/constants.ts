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

export const POLL_INTERVAL = 15_000;

export const API_GROUP = "kubelb.k8c.io";
export const API_VERSION = `${API_GROUP}/v1alpha1`;

export const API_BASE = `/apis/${API_VERSION}`;

export const AGENTGATEWAY_API_GROUP = "agentgateway.dev";
export const AGENTGATEWAY_API_BASE = `/apis/${AGENTGATEWAY_API_GROUP}/v1alpha1`;

export const API_PATHS = {
  tenants: `${API_BASE}/tenants`,
  configs: (ns: string) => `${API_BASE}/namespaces/${ns}/configs`,
  routes: (ns: string) => `${API_BASE}/namespaces/${ns}/routes`,
  syncSecrets: (ns: string) => `${API_BASE}/namespaces/${ns}/syncsecrets`,
  loadBalancers: (ns: string) => `${API_BASE}/namespaces/${ns}/loadbalancers`,
  addresses: (ns: string) => `${API_BASE}/namespaces/${ns}/addresses`,
  wafPolicies: `${API_BASE}/wafpolicies`,
  namespaces: `${API_BASE}/namespaces`,
  agentgatewayBackends: `${AGENTGATEWAY_API_BASE}/agentgatewaybackends`,
  agentgatewayBackend: (ns: string) =>
    `${AGENTGATEWAY_API_BASE}/namespaces/${ns}/agentgatewaybackends`,
} as const;

export const KUBELB_LABELS = {
  ORIGIN_NAME: `${API_GROUP}/origin-name`,
  ORIGIN_NS: `${API_GROUP}/origin-ns`,
  MANAGED_BY: `${API_GROUP}/managed-by`,
  TENANT: `${API_GROUP}/tenant`,
} as const;

export const KUBELB_ANNOTATIONS = {
  PROXY_PROTOCOL: `${API_GROUP}/proxy-protocol`,
  LB_POLICY: `${API_GROUP}/lb-policy`,
  WILDCARD_DOMAIN: `${API_GROUP}/request-wildcard-domain`,
  MANAGE_DNS: `${API_GROUP}/manage-dns`,
  MANAGE_CERTIFICATES: `${API_GROUP}/manage-certificates`,
  PROPAGATE_ANNOTATION: `${API_GROUP}/propagate-annotation`,
  EXTERNAL_DNS_HOSTNAME: "external-dns.alpha.kubernetes.io/hostname",
  CERTMANAGER_ISSUER: "cert-manager.io/cluster-issuer",
} as const;

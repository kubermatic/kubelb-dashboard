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

export type { GenericResource } from "./types";
export { addresses } from "./addresses";
export { agentgatewayBackends } from "./agentgateway-backends";
export { backendTrafficPolicies } from "./backend-traffic-policies";
export { clientTrafficPolicies } from "./client-traffic-policies";
export { configs } from "./configs";
export { deployments } from "./deployments";
export { gateways } from "./gateways";
export { grpcRoutes } from "./grpcroutes";
export { httpRoutes } from "./httproutes";
export { ingresses } from "./ingresses";
export { loadBalancers } from "./load-balancers";
export { namespaces } from "./namespaces";
export { routes } from "./routes";
export { services } from "./services";
export { syncSecrets } from "./sync-secrets";
export { tcpRoutes } from "./tcproutes";
export { tenants } from "./tenants";
export { tlsRoutes } from "./tlsroutes";
export { udpRoutes } from "./udproutes";
export { wafPolicies } from "./waf-policies";

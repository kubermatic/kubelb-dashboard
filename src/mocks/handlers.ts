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

import { http, HttpResponse } from "msw";
import { backendTrafficPolicyHandlers } from "./handlers/backend-traffic-policies";
import { clientTrafficPolicyHandlers } from "./handlers/client-traffic-policies";
import { configHandlers } from "./handlers/configs";
import { deploymentHandlers } from "./handlers/deployments";
import { gatewayHandlers } from "./handlers/gateways";
import { grpcRouteHandlers } from "./handlers/grpcroutes";
import { httpRouteHandlers } from "./handlers/httproutes";
import { ingressHandlers } from "./handlers/ingresses";
import { loadBalancerHandlers } from "./handlers/load-balancers";
import { namespaceHandlers } from "./handlers/namespaces";
import { routeHandlers } from "./handlers/routes";
import { serviceHandlers } from "./handlers/services";
import { syncSecretHandlers } from "./handlers/sync-secrets";
import { tcpRouteHandlers } from "./handlers/tcproutes";
import { tenantHandlers } from "./handlers/tenants";
import { tlsRouteHandlers } from "./handlers/tlsroutes";
import { udpRouteHandlers } from "./handlers/udproutes";
import { wafPolicyHandlers } from "./handlers/waf-policies";

export const handlers = [
  http.get("/api/config", () => HttpResponse.json({ authEnabled: false })),
  ...tenantHandlers,
  ...configHandlers,
  ...loadBalancerHandlers,
  ...routeHandlers,
  ...syncSecretHandlers,
  ...deploymentHandlers,
  ...namespaceHandlers,
  ...wafPolicyHandlers,
  ...gatewayHandlers,
  ...httpRouteHandlers,
  ...tcpRouteHandlers,
  ...grpcRouteHandlers,
  ...tlsRouteHandlers,
  ...udpRouteHandlers,
  ...ingressHandlers,
  ...serviceHandlers,
  ...backendTrafficPolicyHandlers,
  ...clientTrafficPolicyHandlers,
];

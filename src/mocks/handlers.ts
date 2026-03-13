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

import { configHandlers } from "./handlers/configs";
import { deploymentHandlers } from "./handlers/deployments";
import { loadBalancerHandlers } from "./handlers/load-balancers";
import { namespaceHandlers } from "./handlers/namespaces";
import { routeHandlers } from "./handlers/routes";
import { syncSecretHandlers } from "./handlers/sync-secrets";
import { tenantHandlers } from "./handlers/tenants";
import { wafPolicyHandlers } from "./handlers/waf-policies";

export const handlers = [
  ...tenantHandlers,
  ...configHandlers,
  ...loadBalancerHandlers,
  ...routeHandlers,
  ...syncSecretHandlers,
  ...deploymentHandlers,
  ...namespaceHandlers,
  ...wafPolicyHandlers,
];

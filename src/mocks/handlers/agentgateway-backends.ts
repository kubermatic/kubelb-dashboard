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

import type { AgentgatewayBackend } from "@/types/agentgateway";

import { agentgatewayBackends as seed } from "../fixtures/agentgateway-backends";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<AgentgatewayBackend>(seed);
const API = "/api/kube/apis/agentgateway.dev/v1alpha1";

export const agentgatewayBackendHandlers = [
  http.get(`${API}/agentgatewaybackends`, () => {
    return HttpResponse.json(
      kubeListEnvelope("agentgateway.dev/v1alpha1", "AgentgatewayBackendList", store.list()),
    );
  }),

  http.get(`${API}/namespaces/:ns/agentgatewaybackends/:name`, ({ params }) => {
    const ns = params.ns as string;
    const name = params.name as string;
    const item = store.get(name, ns);
    if (!item) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `agentgatewaybackends "${name}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),
];

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

import type { GenericResource } from "../fixtures/types";
import { grpcRoutes as seed } from "../fixtures";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<GenericResource>(seed);
const API = "/api/kube/apis/gateway.networking.k8s.io/v1";

export const grpcRouteHandlers = [
  http.get(`${API}/grpcroutes`, () => {
    return HttpResponse.json(
      kubeListEnvelope("gateway.networking.k8s.io/v1", "GRPCRouteList", store.list()),
    );
  }),

  http.get(`${API}/namespaces/:namespace/grpcroutes`, ({ params }) => {
    return HttpResponse.json(
      kubeListEnvelope(
        "gateway.networking.k8s.io/v1",
        "GRPCRouteList",
        store.list(params.namespace as string),
      ),
    );
  }),

  http.get(`${API}/namespaces/:namespace/grpcroutes/:name`, ({ params }) => {
    const item = store.get(params.name as string, params.namespace as string);
    if (!item) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `grpcroutes "${params.name as string}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),
];

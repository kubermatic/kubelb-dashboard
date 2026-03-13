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

import type { Tenant } from "@/types/kubelb";

import { tenants as seed } from "../fixtures";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<Tenant>(seed);
const API = "/api/kube/apis/kubelb.k8c.io/v1alpha1";

export const tenantHandlers = [
  http.get(`${API}/tenants`, () => {
    return HttpResponse.json(
      kubeListEnvelope("kubelb.k8c.io/v1alpha1", "TenantList", store.list()),
    );
  }),

  http.get(`${API}/tenants/:name`, ({ params }) => {
    const name = params.name as string;
    const item = store.get(name);
    if (!item) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `tenants "${name}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),

  http.post(`${API}/tenants`, async ({ request }) => {
    const body = (await request.json()) as Tenant;
    const created = store.create(body);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(`${API}/tenants/:name`, async ({ request }) => {
    const body = (await request.json()) as Tenant;
    const updated = store.update(body);
    if (!updated) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `tenants "${body.metadata.name}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(updated);
  }),

  http.delete(`${API}/tenants/:name`, ({ params }) => {
    const name = params.name as string;
    const deleted = store.delete(name);
    if (!deleted) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `tenants "${name}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(
      kubeStatus(200, "OK", `tenant "${name}" deleted`),
    );
  }),
];

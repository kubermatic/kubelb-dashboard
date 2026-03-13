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

import type { Config } from "@/types/kubelb";

import { configs as seed } from "../fixtures";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<Config>(seed);
const API = "/api/kube/apis/kubelb.k8c.io/v1alpha1";

export const configHandlers = [
  http.get(`${API}/configs`, () => {
    return HttpResponse.json(
      kubeListEnvelope("kubelb.k8c.io/v1alpha1", "ConfigList", store.list()),
    );
  }),

  http.put(`${API}/namespaces/:namespace/configs/:name`, async ({ request }) => {
    const body = (await request.json()) as Config;
    const updated = store.update(body);
    if (!updated) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `configs "${body.metadata.name}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(updated);
  }),
];

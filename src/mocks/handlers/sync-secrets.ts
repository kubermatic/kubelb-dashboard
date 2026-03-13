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

import type { SyncSecret } from "@/types/kubelb";

import { syncSecrets as seed } from "../fixtures";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<SyncSecret>(seed);
const API = "/api/kube/apis/kubelb.k8c.io/v1alpha1";

export const syncSecretHandlers = [
  http.get(`${API}/syncsecrets`, () => {
    return HttpResponse.json(
      kubeListEnvelope(
        "kubelb.k8c.io/v1alpha1",
        "SyncSecretList",
        store.list(),
      ),
    );
  }),

  http.get(`${API}/namespaces/:namespace/syncsecrets`, ({ params }) => {
    return HttpResponse.json(
      kubeListEnvelope(
        "kubelb.k8c.io/v1alpha1",
        "SyncSecretList",
        store.list(params.namespace as string),
      ),
    );
  }),

  http.get(
    `${API}/namespaces/:namespace/syncsecrets/:name`,
    ({ params }) => {
      const item = store.get(
        params.name as string,
        params.namespace as string,
      );
      if (!item) {
        return HttpResponse.json(
          kubeStatus(
            404,
            "NotFound",
            `syncsecrets "${params.name as string}" not found`,
          ),
          { status: 404 },
        );
      }
      return HttpResponse.json(item);
    },
  ),

  http.post(
    `${API}/namespaces/:namespace/syncsecrets`,
    async ({ request }) => {
      const body = (await request.json()) as SyncSecret;
      const created = store.create(body);
      return HttpResponse.json(created, { status: 201 });
    },
  ),

  http.put(
    `${API}/namespaces/:namespace/syncsecrets/:name`,
    async ({ request }) => {
      const body = (await request.json()) as SyncSecret;
      const updated = store.update(body);
      if (!updated) {
        return HttpResponse.json(
          kubeStatus(
            404,
            "NotFound",
            `syncsecrets "${body.metadata.name}" not found`,
          ),
          { status: 404 },
        );
      }
      return HttpResponse.json(updated);
    },
  ),

  http.delete(
    `${API}/namespaces/:namespace/syncsecrets/:name`,
    ({ params }) => {
      const name = params.name as string;
      const ns = params.namespace as string;
      const deleted = store.delete(name, ns);
      if (!deleted) {
        return HttpResponse.json(
          kubeStatus(404, "NotFound", `syncsecrets "${name}" not found`),
          { status: 404 },
        );
      }
      return HttpResponse.json(
        kubeStatus(200, "OK", `syncsecret "${name}" deleted`),
      );
    },
  ),
];

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

import type { Deployment } from "@/types/kubernetes";

import { deployments as seed } from "../fixtures";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<Deployment>(seed);
const API = "/api/kube/apis/apps/v1";

function filterByLabelSelector(
  items: Deployment[],
  request: Request,
): Deployment[] {
  const url = new URL(request.url);
  const labelSelector = url.searchParams.get("labelSelector");
  if (!labelSelector) return items;

  const parts = labelSelector.split(",");
  return items.filter((d) =>
    parts.every((part) => {
      const [key, value] = part.split("=");
      return d.metadata.labels?.[key] === value;
    }),
  );
}

export const deploymentHandlers = [
  http.get(`${API}/deployments`, ({ request }) => {
    const items = filterByLabelSelector(store.list(), request);
    return HttpResponse.json(
      kubeListEnvelope("apps/v1", "DeploymentList", items),
    );
  }),

  http.get(`${API}/namespaces/:namespace/deployments`, ({ params, request }) => {
    const items = filterByLabelSelector(
      store.list(params.namespace as string),
      request,
    );
    return HttpResponse.json(
      kubeListEnvelope("apps/v1", "DeploymentList", items),
    );
  }),

  http.get(
    `${API}/namespaces/:namespace/deployments/:name`,
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
            `deployments "${params.name as string}" not found`,
          ),
          { status: 404 },
        );
      }
      return HttpResponse.json(item);
    },
  ),
];

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

import { events as seed } from "../fixtures";
import { kubeListEnvelope } from "../helpers";

const API = "/api/kube/api/v1";

function parseFieldSelector(fieldSelector: string | null): Record<string, string> {
  if (!fieldSelector) return {};
  const fields: Record<string, string> = {};
  for (const pair of fieldSelector.split(",")) {
    const [key, value] = pair.split("=");
    if (key && value !== undefined) fields[key] = value;
  }
  return fields;
}

export const eventHandlers = [
  http.get(`${API}/namespaces/:namespace/events`, ({ params, request }) => {
    const namespace = params.namespace as string;
    const url = new URL(request.url);
    const fields = parseFieldSelector(url.searchParams.get("fieldSelector"));

    const items = seed.filter((event) => {
      if (event.involvedObject.namespace !== namespace) return false;
      if (
        fields["involvedObject.name"] &&
        event.involvedObject.name !== fields["involvedObject.name"]
      ) {
        return false;
      }
      if (
        fields["involvedObject.uid"] &&
        event.involvedObject.uid !== fields["involvedObject.uid"]
      ) {
        return false;
      }
      return true;
    });

    return HttpResponse.json(kubeListEnvelope("v1", "EventList", items));
  }),
];

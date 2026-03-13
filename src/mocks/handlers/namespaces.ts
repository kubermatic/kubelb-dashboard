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

import type { Namespace } from "@/types/kubernetes";
import { namespaces as seed } from "../fixtures";
import { kubeListEnvelope } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<Namespace>(seed);

export const namespaceHandlers = [
  http.get("/api/kube/api/v1/namespaces", () => {
    return HttpResponse.json(
      kubeListEnvelope("v1", "NamespaceList", store.list()),
    );
  }),
];

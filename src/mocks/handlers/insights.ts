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

import type { Insight, InsightState } from "@/types/kubelb";

import { insights as seed } from "../fixtures";
import { kubeListEnvelope, kubeStatus } from "../helpers";
import { MockStore } from "../store";

const store = new MockStore<Insight>(seed);
const API = "/api/kube/apis/kubelb.k8c.io/v1alpha1";

// Equality-only label selector, enough for the engine-set insight labels.
function matchesSelector(item: Insight, selector: string | null): boolean {
  if (!selector) return true;
  return selector.split(",").every((pair) => {
    const [key, value] = pair.split("=");
    return item.metadata.labels?.[key] === value;
  });
}

// RFC 7386 JSON merge patch: objects merge recursively, null deletes, anything
// else replaces. The real API server applies exactly this to CRD patches.
function jsonMergePatch(target: unknown, patch: unknown): unknown {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    return patch;
  }
  const base =
    target !== null && typeof target === "object" && !Array.isArray(target)
      ? { ...(target as Record<string, unknown>) }
      : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete base[key];
    } else {
      base[key] = jsonMergePatch(base[key], value);
    }
  }
  return base;
}

// The CRD's CEL rules, verbatim: a naive patch that leaves a stale reason or
// snoozeUntil behind is rejected exactly like the real API server would.
function validateTriage(insight: Insight): string | null {
  const triage = insight.spec.triage;
  if (!triage) return null;
  if ((triage.state === "Dismissed") !== (triage.reason !== undefined)) {
    return "reason is required if and only if state is Dismissed";
  }
  if ((triage.state === "Snoozed") !== (triage.snoozeUntil !== undefined)) {
    return "snoozeUntil is required if and only if state is Snoozed";
  }
  return null;
}

// The engine reacts to a triage edit on its next sweep and recomputes
// status.state; emulate that with a short delay so the UI's refetch story is
// exercised in mock mode too.
function scheduleEngineSweep(name: string, namespace: string) {
  setTimeout(() => {
    const current = store.get(name, namespace);
    if (!current) return;
    const state: InsightState = current.spec.triage?.state ?? "Open";
    store.update({ ...current, status: { ...current.status, state } });
  }, 1000);
}

export const insightHandlers = [
  http.get(`${API}/insights`, ({ request }) => {
    const selector = new URL(request.url).searchParams.get("labelSelector");
    const items = store.list().filter((item) => matchesSelector(item, selector));
    return HttpResponse.json(kubeListEnvelope("kubelb.k8c.io/v1alpha1", "InsightList", items));
  }),

  http.get(`${API}/namespaces/:namespace/insights`, ({ params, request }) => {
    const selector = new URL(request.url).searchParams.get("labelSelector");
    const items = store
      .list(params.namespace as string)
      .filter((item) => matchesSelector(item, selector));
    return HttpResponse.json(kubeListEnvelope("kubelb.k8c.io/v1alpha1", "InsightList", items));
  }),

  http.get(`${API}/namespaces/:namespace/insights/:name`, ({ params }) => {
    const item = store.get(params.name as string, params.namespace as string);
    if (!item) {
      return HttpResponse.json(
        kubeStatus(404, "NotFound", `insights "${params.name as string}" not found`),
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),

  http.patch(`${API}/namespaces/:namespace/insights/:name`, async ({ params, request }) => {
    const name = params.name as string;
    const namespace = params.namespace as string;
    const existing = store.get(name, namespace);
    if (!existing) {
      return HttpResponse.json(kubeStatus(404, "NotFound", `insights "${name}" not found`), {
        status: 404,
      });
    }

    const patch = (await request.json()) as Record<string, unknown>;
    const patched = jsonMergePatch(existing, patch) as Insight;

    if (patched.spec.check !== existing.spec.check) {
      return HttpResponse.json(
        kubeStatus(422, "Invalid", `Insight "${name}" is invalid: spec.check: check is immutable`),
        { status: 422 },
      );
    }
    const triageError = validateTriage(patched);
    if (triageError) {
      return HttpResponse.json(
        kubeStatus(422, "Invalid", `Insight "${name}" is invalid: spec.triage: ${triageError}`),
        { status: 422 },
      );
    }

    const updated = store.update(patched);
    scheduleEngineSweep(name, namespace);
    return HttpResponse.json(updated);
  }),
];

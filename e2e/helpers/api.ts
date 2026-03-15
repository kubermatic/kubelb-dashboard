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

import type { APIRequestContext } from "@playwright/test";

const KUBE = "/api/kube";
const KUBELB_API = "/apis/kubelb.k8c.io/v1alpha1";

export class ApiHelper {
  constructor(private request: APIRequestContext) {}

  async createTenant(name: string, spec: Record<string, unknown> = {}) {
    const body = {
      apiVersion: "kubelb.k8c.io/v1alpha1",
      kind: "Tenant",
      metadata: { name },
      spec: {
        ingress: { class: "" },
        ...spec,
      },
    };
    const res = await this.request.post(`${KUBE}${KUBELB_API}/tenants`, {
      data: body,
    });
    if (!res.ok()) throw new Error(`Failed to create tenant ${name}: ${res.status()}`);
    return res.json() as Promise<unknown>;
  }

  async deleteTenant(name: string) {
    const res = await this.request.delete(`${KUBE}${KUBELB_API}/tenants/${name}`);
    if (res.status() !== 404 && !res.ok()) {
      throw new Error(`Failed to delete tenant ${name}: ${res.status()}`);
    }
  }

  async createWAFPolicy(name: string, spec: Record<string, unknown> = {}) {
    const body = {
      apiVersion: "kubelb.k8c.io/v1alpha1",
      kind: "WAFPolicy",
      metadata: { name },
      spec: {
        failureMode: "deny",
        ...spec,
      },
    };
    const res = await this.request.post(`${KUBE}${KUBELB_API}/wafpolicies`, {
      data: body,
    });
    if (!res.ok()) throw new Error(`Failed to create WAF policy ${name}: ${res.status()}`);
    return res.json() as Promise<unknown>;
  }

  async deleteWAFPolicy(name: string) {
    const res = await this.request.delete(`${KUBE}${KUBELB_API}/wafpolicies/${name}`);
    if (res.status() !== 404 && !res.ok()) {
      throw new Error(`Failed to delete WAF policy ${name}: ${res.status()}`);
    }
  }

  async createSyncSecret(namespace: string, name: string, spec: Record<string, unknown> = {}) {
    const body = {
      apiVersion: "kubelb.k8c.io/v1alpha1",
      kind: "SyncSecret",
      metadata: { name, namespace },
      spec: {
        ...spec,
      },
    };
    const res = await this.request.post(
      `${KUBE}${KUBELB_API}/namespaces/${namespace}/syncsecrets`,
      { data: body },
    );
    if (!res.ok()) throw new Error(`Failed to create sync secret ${name}: ${res.status()}`);
    return res.json() as Promise<unknown>;
  }

  async deleteSyncSecret(namespace: string, name: string) {
    const res = await this.request.delete(
      `${KUBE}${KUBELB_API}/namespaces/${namespace}/syncsecrets/${name}`,
    );
    if (res.status() !== 404 && !res.ok()) {
      throw new Error(`Failed to delete sync secret ${name}: ${res.status()}`);
    }
  }
}

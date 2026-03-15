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

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const KUBE = `${BASE_URL}/api/kube`;
const KUBELB_API = "/apis/kubelb.k8c.io/v1alpha1";

interface KubeItem {
  metadata: { name: string; namespace?: string };
}

async function listNames(path: string): Promise<KubeItem[]> {
  const res = await fetch(`${KUBE}${path}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: KubeItem[] };
  return (data.items ?? []).filter((i) => i.metadata.name.startsWith("e2e-"));
}

async function deleteResource(path: string) {
  await fetch(`${KUBE}${path}`, { method: "DELETE" }).catch(() => {});
}

export default async function globalTeardown() {
  const tenants = await listNames(`${KUBELB_API}/tenants`);
  const wafPolicies = await listNames(`${KUBELB_API}/wafpolicies`);

  const syncSecretsByNs: KubeItem[] = [];
  for (const tenant of tenants) {
    const ns = `tenant-${tenant.metadata.name}`;
    const secrets = await listNames(`${KUBELB_API}/namespaces/${ns}/syncsecrets`);
    syncSecretsByNs.push(...secrets);
  }

  for (const s of syncSecretsByNs) {
    await deleteResource(
      `${KUBELB_API}/namespaces/${s.metadata.namespace}/syncsecrets/${s.metadata.name}`,
    );
  }
  for (const w of wafPolicies) {
    await deleteResource(`${KUBELB_API}/wafpolicies/${w.metadata.name}`);
  }
  for (const t of tenants) {
    await deleteResource(`${KUBELB_API}/tenants/${t.metadata.name}`);
  }

  const total = tenants.length + wafPolicies.length + syncSecretsByNs.length;
  if (total > 0) {
    console.log(`[e2e teardown] cleaned ${String(total)} leftover e2e- resources`);
  }
}

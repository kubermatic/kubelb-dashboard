#!/usr/bin/env npx tsx
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const FIXTURES_DIR = resolve(import.meta.dirname, "../src/mocks/fixtures");

const LICENSE_HEADER = `/*
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
 */`;

interface ResourceConfig {
  kubectl: string;
  file: string;
  exportName: string;
  typeName: string;
  typeImport: string;
}

const RESOURCES: ResourceConfig[] = [
  {
    kubectl: "get tenants -o json",
    file: "tenants.ts",
    exportName: "tenants",
    typeName: "Tenant",
    typeImport: "@/types/kubelb",
  },
  {
    kubectl: "get configs -A -o json",
    file: "configs.ts",
    exportName: "configs",
    typeName: "Config",
    typeImport: "@/types/kubelb",
  },
  {
    kubectl: "get loadbalancers -A -o json",
    file: "load-balancers.ts",
    exportName: "loadBalancers",
    typeName: "LoadBalancer",
    typeImport: "@/types/kubelb",
  },
  {
    kubectl: "get routes -A -o json",
    file: "routes.ts",
    exportName: "routes",
    typeName: "Route",
    typeImport: "@/types/kubelb",
  },
  {
    kubectl: "get syncsecrets -A -o json",
    file: "sync-secrets.ts",
    exportName: "syncSecrets",
    typeName: "SyncSecret",
    typeImport: "@/types/kubelb",
  },
  {
    kubectl: "get wafpolicies -o json",
    file: "waf-policies.ts",
    exportName: "wafPolicies",
    typeName: "WAFPolicy",
    typeImport: "@/types/kubelb",
  },
  {
    kubectl: "get deployments -n kubelb -l app.kubernetes.io/name=envoy -o json",
    file: "deployments.ts",
    exportName: "deployments",
    typeName: "Deployment",
    typeImport: "@/types/kubernetes",
  },
  {
    kubectl: "__namespaces__",
    file: "namespaces.ts",
    exportName: "namespaces",
    typeName: "Namespace",
    typeImport: "@/types/kubernetes",
  },
  {
    kubectl: "get gateways -A -o json",
    file: "gateways.ts",
    exportName: "gateways",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get httproutes -A -o json",
    file: "httproutes.ts",
    exportName: "httpRoutes",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get tcproutes -A -o json",
    file: "tcproutes.ts",
    exportName: "tcpRoutes",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get grpcroutes -A -o json",
    file: "grpcroutes.ts",
    exportName: "grpcRoutes",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get tlsroutes -A -o json",
    file: "tlsroutes.ts",
    exportName: "tlsRoutes",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get udproutes -A -o json",
    file: "udproutes.ts",
    exportName: "udpRoutes",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get ingresses -A -o json",
    file: "ingresses.ts",
    exportName: "ingresses",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get services -A -o json",
    file: "services.ts",
    exportName: "services",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get backendtrafficpolicies -A -o json",
    file: "backend-traffic-policies.ts",
    exportName: "backendTrafficPolicies",
    typeName: "GenericResource",
    typeImport: "./types",
  },
  {
    kubectl: "get clienttrafficpolicies -A -o json",
    file: "client-traffic-policies.ts",
    exportName: "clientTrafficPolicies",
    typeName: "GenericResource",
    typeImport: "./types",
  },
];

function kubectl(cmd: string): string {
  return execSync(`kubectl ${cmd}`, { encoding: "utf-8" });
}

function cleanItem(item: Record<string, unknown>): Record<string, unknown> {
  const metadata = item.metadata as Record<string, unknown> | undefined;
  if (!metadata) return item;

  delete metadata.managedFields;

  const annotations = metadata.annotations as Record<string, string> | undefined;
  if (annotations) {
    delete annotations["kubectl.kubernetes.io/last-applied-configuration"];
    if (Object.keys(annotations).length === 0) {
      delete metadata.annotations;
    }
  }

  return item;
}

function fetchNamespaces(): unknown[] {
  const managedJson = kubectl("get namespaces -l kubelb.k8c.io/managed-by=kubelb -o json");
  const managedList = JSON.parse(managedJson);
  const items: Record<string, unknown>[] = managedList.items ?? [];

  try {
    const kubelbJson = kubectl("get namespace kubelb -o json");
    const kubelbNs = JSON.parse(kubelbJson);
    const alreadyIncluded = items.some(
      (ns) => (ns.metadata as Record<string, unknown>)?.name === "kubelb",
    );
    if (!alreadyIncluded) {
      items.push(kubelbNs);
    }
  } catch {
    console.warn("  Warning: could not fetch 'kubelb' namespace");
  }

  return items;
}

function generateFile(config: ResourceConfig, items: unknown[]): string {
  const importLine = `import type { ${config.typeName} } from "${config.typeImport}";`;
  const data = JSON.stringify(items, null, 2);
  // Unwrap the outer array brackets to place items inline
  const inner = data.slice(2, -2);
  const itemsStr = items.length > 0 ? `[\n${inner}\n]` : "[]";

  return `${LICENSE_HEADER}

${importLine}

export const ${config.exportName}: ${config.typeName}[] = ${itemsStr};
`;
}

function countItems(content: string): number | null {
  const match = content.match(/\]: \w+\[] = \[/);
  if (!match) return null;
  const arrayStart = content.indexOf(match[0]) + match[0].length - 1;
  try {
    const arrayStr = content.slice(arrayStart);
    const parsed = JSON.parse(arrayStr.replace(/;?\s*$/, ""));
    return Array.isArray(parsed) ? parsed.length : null;
  } catch {
    // Fall back to counting top-level objects by apiVersion occurrences
    const matches = content.match(/"?apiVersion"?\s*:/g);
    return matches ? matches.length : null;
  }
}

// Main
console.log("Checking cluster access...");
try {
  kubectl("cluster-info --request-timeout=5s 2>&1");
} catch {
  console.error("Cannot reach cluster. Set KUBECONFIG.");
  process.exit(1);
}
console.log("Cluster accessible.\n");

if (!existsSync(FIXTURES_DIR)) {
  mkdirSync(FIXTURES_DIR, { recursive: true });
}

let captured = 0;
let skipped = 0;
let updated = 0;
let unchanged = 0;

for (const config of RESOURCES) {
  process.stdout.write(`${config.file}: `);

  let items: unknown[];
  try {
    if (config.kubectl === "__namespaces__") {
      items = fetchNamespaces().map((i) => cleanItem(i as Record<string, unknown>));
    } else {
      const json = kubectl(config.kubectl);
      const list = JSON.parse(json);
      items = (list.items ?? []).map((i: Record<string, unknown>) => cleanItem(i));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`SKIPPED (${msg.split("\n")[0]})`);
    skipped++;
    continue;
  }

  const content = generateFile(config, items);
  const filePath = resolve(FIXTURES_DIR, config.file);

  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, "utf-8");
    if (existing === content) {
      console.log(`${items.length} items (unchanged)`);
      unchanged++;
      continue;
    }
    const oldCount = countItems(existing);
    if (oldCount !== null) {
      console.log(`${oldCount}→${items.length} items (updated)`);
    } else {
      console.log(`${items.length} items (updated)`);
    }
    updated++;
  } else {
    console.log(`${items.length} items (new)`);
    captured++;
  }

  writeFileSync(filePath, content, "utf-8");
}

console.log(
  `\nDone: ${captured} new, ${updated} updated, ${unchanged} unchanged, ${skipped} skipped`,
);

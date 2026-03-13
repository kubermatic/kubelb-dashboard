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

import { KUBELB_LABELS } from "./constants";

export function formatAge(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

const TENANT_NS_PREFIX = "tenant-";

export function tenantToNamespace(tenant: string): string {
  return `${TENANT_NS_PREFIX}${tenant}`;
}

export function namespaceToTenant(namespace: string): string {
  return namespace.startsWith(TENANT_NS_PREFIX)
    ? namespace.slice(TENANT_NS_PREFIX.length)
    : namespace;
}

export function isTenantNamespace(namespace: string): boolean {
  return namespace.startsWith(TENANT_NS_PREFIX);
}

export function getOriginSource(labels: Record<string, string> | undefined): string {
  if (!labels) return "\u2014";
  const ns = labels[KUBELB_LABELS.ORIGIN_NS] ?? "";
  const name = labels[KUBELB_LABELS.ORIGIN_NAME] ?? "";
  if (ns && name) return `${ns}/${name}`;
  if (name) return name;
  return "\u2014";
}

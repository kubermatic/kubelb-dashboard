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

const NS_COLORS = [
  "#3db8e5",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

/** Stable, tenant-distinct color for a namespace. Empty namespace → slate. */
export function namespaceColor(namespace: string, namespaces: string[]): string {
  if (!namespace) return "#94a3b8";
  const i = namespaces.indexOf(namespace);
  return NS_COLORS[(i < 0 ? 0 : i) % NS_COLORS.length];
}

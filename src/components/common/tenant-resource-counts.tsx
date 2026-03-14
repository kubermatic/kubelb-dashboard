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

import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useRoutes } from "@/hooks/use-routes";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import { tenantToNamespace } from "@/lib/format";

export function TenantResourceCounts({ tenantName }: { tenantName: string }) {
  const namespace = tenantToNamespace(tenantName);
  const { data: lbs } = useLoadBalancers(namespace);
  const { data: routes } = useRoutes(namespace);
  const { data: secrets } = useSyncSecrets(namespace);

  const counts = [
    { label: "Load Balancers", count: lbs?.items?.length ?? 0 },
    { label: "Routes", count: routes?.items?.length ?? 0 },
    { label: "Sync Secrets", count: secrets?.items?.length ?? 0 },
  ].filter((c) => c.count > 0);

  if (counts.length === 0) return null;

  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
      <p className="mb-2 text-sm font-medium text-destructive">Resources that will be deleted:</p>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {counts.map((c) => (
          <li key={c.label}>
            {c.count} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

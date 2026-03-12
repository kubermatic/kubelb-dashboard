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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenants } from "@/hooks/use-tenants";
import { useUIStore } from "@/stores/ui";

export function TenantSelector() {
  const { data } = useTenants();
  const selectedTenant = useUIStore((s) => s.selectedTenant);
  const setSelectedTenant = useUIStore((s) => s.setSelectedTenant);

  const tenants = data?.items.map((t) => t.metadata.name).sort() ?? [];

  return (
    <Select value={selectedTenant ?? ""} onValueChange={(val) => setSelectedTenant(val || null)}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All Tenants" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Tenants</SelectItem>
        {tenants.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

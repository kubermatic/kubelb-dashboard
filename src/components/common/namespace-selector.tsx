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

import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNamespaces } from "@/hooks/use-namespaces";
import { useUIStore } from "@/stores/ui";

const ALL_VALUE = "__all__";

export function NamespaceSelector() {
  const { data, isLoading } = useNamespaces();
  const selectedNamespace = useUIStore((s) => s.selectedNamespace);
  const setSelectedNamespace = useUIStore((s) => s.setSelectedNamespace);

  const namespaces = data?.items.map((ns) => ns.metadata.name).sort() ?? [];

  return (
    <Select
      value={selectedNamespace ?? ALL_VALUE}
      onValueChange={(val) => setSelectedNamespace(val === ALL_VALUE ? null : val)}
    >
      <SelectTrigger className="w-48">
        {isLoading ? (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading...
          </span>
        ) : (
          <SelectValue placeholder="All Namespaces" />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All Namespaces</SelectItem>
        {namespaces.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

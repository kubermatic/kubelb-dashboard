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

import type { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface FilterColumn {
  column: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableToolbarProps<T> {
  table: Table<T>;
  searchColumn?: string;
  searchPlaceholder?: string;
  filterColumns?: FilterColumn[];
}

export function DataTableToolbar<T>({
  table,
  searchColumn,
  searchPlaceholder = "Search...",
  filterColumns,
}: DataTableToolbarProps<T>) {
  const searchCol = searchColumn
    ? table.getColumn(searchColumn)
    : undefined;

  return (
    <div className="flex items-center gap-2">
      {searchCol && (
        <Input
          placeholder={searchPlaceholder}
          value={(searchCol.getFilterValue() as string) ?? ""}
          onChange={(e) => searchCol.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      )}
      {filterColumns?.map(({ column, title, options }) => {
        const col = table.getColumn(column);
        if (!col) return null;
        return (
          <Select
            key={column}
            value={((col.getFilterValue() as string) ?? "")}
            onValueChange={(val) =>
              col.setFilterValue(val || undefined)
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder={title} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}

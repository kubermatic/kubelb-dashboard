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
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

const PAGE_SIZE_KEY = "kubelb-page-size";
const DEFAULT_PAGE_SIZE = 10;

function getStoredPageSize(): number {
  try {
    const val = localStorage.getItem(PAGE_SIZE_KEY);
    if (val) return Number(val);
  } catch {
    /* noop */
  }
  return DEFAULT_PAGE_SIZE;
}

interface FilterColumn {
  column: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchColumn?: string;
  filterColumns?: FilterColumn[];
  toolbarLeading?: ReactNode;
  onRowClick?: (row: Row<T>) => void;
  initialSearch?: string;
  initialPage?: number;
  initialPageSize?: number;
  onSearchChange?: (value: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRefresh?: () => void;
  isRefetching?: boolean;
  dataUpdatedAt?: number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = "No results.",
  searchPlaceholder,
  searchColumn,
  filterColumns,
  toolbarLeading,
  onRowClick,
  initialSearch,
  initialPage,
  initialPageSize,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  isRefetching,
  dataUpdatedAt,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialSearch && searchColumn ? [{ id: searchColumn, value: initialSearch }] : [],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: initialPage ?? 0,
    pageSize: initialPageSize ?? getStoredPageSize(),
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      const next = typeof updater === "function" ? updater(columnFilters) : updater;
      if (searchColumn) {
        const filter = next.find((f) => f.id === searchColumn);
        onSearchChange?.((filter?.value as string) ?? "");
      }
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      onPageChange?.(0);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      setPagination((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (next.pageIndex !== prev.pageIndex) onPageChange?.(next.pageIndex);
        if (next.pageSize !== prev.pageSize) {
          onPageSizeChange?.(next.pageSize);
          try {
            localStorage.setItem(PAGE_SIZE_KEY, String(next.pageSize));
          } catch {
            /* noop */
          }
        }
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handlePageSizeChange = (_size: number) => {};

  return (
    <div className="space-y-4">
      {(searchPlaceholder || filterColumns || toolbarLeading) && (
        <DataTableToolbar
          table={table}
          searchColumn={searchColumn}
          searchPlaceholder={searchPlaceholder}
          filterColumns={filterColumns}
          leading={toolbarLeading}
          onRefresh={onRefresh}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Settings2 className="mr-1.5 size-4" />
                  Columns
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(val) => col.toggleVisibility(!!val)}
                    >
                      {typeof col.columnDef.header === "string"
                        ? col.columnDef.header
                        : col.id
                            .replace(/([a-z])([A-Z])/g, "$1 $2")
                            .replace(/^./, (c) => c.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </DataTableToolbar>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-[600px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} onPageSizeChange={handlePageSizeChange} />
    </div>
  );
}

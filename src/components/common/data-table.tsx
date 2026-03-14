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
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Settings2, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import "@/types/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WatchConnectionStatus } from "@/hooks/use-kube-watch";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

const BREAKPOINTS = { sm: 640, md: 768, lg: 1024 } as const;

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
  enableRowSelection?: boolean;
  onDeleteSelected?: (rows: T[]) => void;
  isDeletePending?: boolean;
  connectionStatus?: WatchConnectionStatus;
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
  enableRowSelection,
  onDeleteSelected,
  isDeletePending,
  connectionStatus,
}: DataTableProps<T>) {
  const isSm = useMediaQuery(`(min-width: ${String(BREAKPOINTS.sm)}px)`);
  const isMd = useMediaQuery(`(min-width: ${String(BREAKPOINTS.md)}px)`);
  const isLg = useMediaQuery(`(min-width: ${String(BREAKPOINTS.lg)}px)`);

  const responsiveHidden = useMemo(() => {
    const hidden: VisibilityState = {};
    for (const col of columns) {
      const id = "id" in col ? col.id : undefined;
      const breakpoint = col.meta?.hideBelow;
      if (!id || !breakpoint) continue;
      const visible =
        breakpoint === "sm" ? isSm : breakpoint === "md" ? isMd : breakpoint === "lg" ? isLg : true;
      if (!visible) hidden[id] = false;
    }
    return hidden;
  }, [columns, isSm, isMd, isLg]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialSearch && searchColumn ? [{ id: searchColumn, value: initialSearch }] : [],
  );
  const [userVisibility, setUserVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [data]);

  const columnVisibility = useMemo(
    () => ({ ...userVisibility, ...responsiveHidden }),
    [userVisibility, responsiveHidden],
  );

  const hasSelection = Object.keys(rowSelection).length > 0;

  const [pagination, setPagination] = useState({
    pageIndex: initialPage ?? 0,
    pageSize: initialPageSize ?? getStoredPageSize(),
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination, rowSelection },
    onSortingChange: setSorting,
    enableRowSelection,
    onRowSelectionChange: setRowSelection,
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
    onColumnVisibilityChange: setUserVisibility,
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
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {(searchPlaceholder || filterColumns || toolbarLeading || enableRowSelection) && (
        <DataTableToolbar
          table={table}
          searchColumn={searchColumn}
          searchPlaceholder={searchPlaceholder}
          filterColumns={filterColumns}
          leading={
            <>
              {toolbarLeading}
              {table.getSelectedRowModel().rows.length > 0 && onDeleteSelected && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeletePending}
                  onClick={() =>
                    onDeleteSelected(table.getSelectedRowModel().rows.map((r) => r.original))
                  }
                >
                  <Trash2 className="size-4" />
                  {isDeletePending
                    ? "Deleting..."
                    : `Delete ${String(table.getSelectedRowModel().rows.length)} selected`}
                </Button>
              )}
            </>
          }
          onRefresh={onRefresh}
          isRefetching={isRefetching}
          dataUpdatedAt={dataUpdatedAt}
          connectionStatus={connectionStatus}
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
        <Table className="min-w-0">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header, headerIndex) => (
                  <TableHead key={header.id} className={cn(headerIndex === 0 && "relative pl-8")}>
                    {headerIndex === 0 && enableRowSelection && (
                      <div
                        className={cn(
                          "absolute left-2 top-1/2 -translate-y-1/2 transition-opacity",
                          hasSelection ? "opacity-100" : "opacity-0 group-hover/row:opacity-100",
                        )}
                      >
                        <Checkbox
                          checked={table.getIsAllPageRowsSelected()}
                          indeterminate={table.getIsSomePageRowsSelected()}
                          onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
                          aria-label="Select all"
                        />
                      </div>
                    )}
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
                <TableRow key={i} style={{ animationDelay: `${i * 75}ms` }}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-3/4" style={{ animationDelay: `${i * 75}ms` }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn("group/row", onRowClick && "cursor-pointer")}
                  onClick={
                    onRowClick
                      ? (e: React.MouseEvent) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('[data-slot^="dropdown-menu"]')) return;
                          if (target.closest("a")) return;
                          onRowClick(row);
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell key={cell.id} className={cn(cellIndex === 0 && "relative pl-8")}>
                      {cellIndex === 0 && enableRowSelection && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2 transition-opacity",
                            row.getIsSelected() || hasSelection
                              ? "opacity-100"
                              : "opacity-0 group-hover/row:opacity-100",
                          )}
                        >
                          <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(val) => row.toggleSelected(!!val)}
                            aria-label="Select row"
                          />
                        </div>
                      )}
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
      <DataTablePagination table={table} />
    </div>
  );
}

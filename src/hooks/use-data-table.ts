"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { ExtendedColumnSort } from "@/types/data-table";
import { useRouter, useSearchParams } from "next/navigation";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface UseDataTableProps<TData>
  extends Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
      | "onSortingChange"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  debounceMs?: number;
  throttleMs?: number;
  enableAdvancedFilter?: boolean;
  onSortingChange?: (sorting: ExtendedColumnSort<TData>[]) => void;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    enableAdvancedFilter = false,
    onSortingChange: customOnSortingChange,
    ...tableProps
  } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {},
  );

  const [page, setPage] = useState<number>(() => {
    const pageParam = searchParams?.get("page");
    if (pageParam) return parseInt(pageParam, 10);
    return initialState?.pagination?.pageIndex !== undefined
      ? initialState.pagination.pageIndex + 1
      : 1;
  });
  const [perPage, setPerPage] = useState<number>(() => {
    const limitParam = searchParams?.get("limit");
    if (limitParam) return parseInt(limitParam, 10);
    return initialState?.pagination?.pageSize ?? 10;
  });

  const pagination: PaginationState = useMemo(() => {
    return {
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue(pagination);
        setPage(newPagination.pageIndex + 1);
        setPerPage(newPagination.pageSize);
        params.set("page", String(newPagination.pageIndex + 1));
        params.set("limit", String(newPagination.pageSize));

        router.push(`?${params.toString()}`);
      } else {
        setPage(updaterOrValue.pageIndex + 1);
        setPerPage(updaterOrValue.pageSize);
        params.set("page", String(updaterOrValue.pageIndex + 1));
        params.set("limit", String(updaterOrValue.pageSize));
        router.push(`?${params.toString()}`);
      }
    },
    [pagination, searchParams, router],
  );

  const [sorting, setSorting] = useState<ExtendedColumnSort<TData>[]>(
    initialState?.sorting ?? [],
  );

  const onSortingChange = useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const newSorting = updaterOrValue(sorting);
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting],
  );

  // Call custom callback when sorting changes
  const customOnSortingChangeRef = useRef(customOnSortingChange);
  useEffect(() => {
    customOnSortingChangeRef.current = customOnSortingChange;
  }, [customOnSortingChange]);

  useEffect(() => {
    if (customOnSortingChangeRef.current) {
      customOnSortingChangeRef.current(sorting);
    }
  }, [sorting]);

  const filterableColumns = useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useState<
    Record<string, string | string[] | null>
  >({});

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: Record<string, string | string[] | null>) => {
      setPage(1);
      setFilterValues(values);
    },
    debounceMs,
  );

  const initialColumnFilters: ColumnFiltersState = useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          const processedValue = Array.isArray(value)
            ? value
            : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
              ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
              : [value];

          filters.push({
            id: key,
            value: processedValue,
          });
        }
        return filters;
      },
      [],
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            acc[filter.id] = filter.value as string | string[];
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    ...tableProps,
    columns,
    ...(initialState && { initialState }),
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  return { table, debounceMs, throttleMs };
}

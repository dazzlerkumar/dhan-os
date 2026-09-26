"use client";

import { useMemo } from "react";
import { DataTable, DataTableViewOptions } from "@/components/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import type { PaginationMeta, TransactionItem } from "@/types/transactions";
import { getTransactionColumns } from "./transaction-columns";
import TransactionFilters from "./transaction-filters";

interface CategoryInfo {
  id: number;
  name: string;
  color: string | null;
}

interface PaymentMethodInfo {
  id: number;
  name: string;
  kind: string;
}

interface TransactionTableProps {
  transactions: TransactionItem[];
  pagination: PaginationMeta;
  isLoading: boolean;
  categories: CategoryInfo[];
  paymentMethods: PaymentMethodInfo[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFlow: "all" | "income" | "expense";
  onSelectFlow: (flow: "all" | "income" | "expense") => void;
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  selectedMethod: number | null;
  onSelectMethod: (id: number | null) => void;
  selectedType: "all" | "fixed" | "variable";
  onSelectType: (type: "all" | "fixed" | "variable") => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
  page: number;
  onPageChange: (newPage: number) => void;
  limit: number;
  onLimitChange: (newLimit: number) => void;
  onEditTransaction: (tx: TransactionItem) => void;
  onDeleteTransaction: (id: number) => void;
}

export default function TransactionTable({
  transactions,
  pagination,
  isLoading,
  categories,
  paymentMethods,
  searchQuery,
  onSearchChange,
  selectedFlow,
  onSelectFlow,
  selectedCategory,
  onSelectCategory,
  selectedMethod,
  onSelectMethod,
  selectedType,
  onSelectType,
  onResetFilters,
  activeFiltersCount,
  page,
  limit,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionTableProps) {
  const columns = useMemo(
    () =>
      getTransactionColumns({
        categories,
        paymentMethods,
        onEdit: onEditTransaction,
        onDelete: onDeleteTransaction,
      }),
    [categories, paymentMethods, onEditTransaction, onDeleteTransaction],
  );

  const { table } = useDataTable({
    data: transactions,
    columns,
    pageCount: pagination.totalPages || 1,
    initialState: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
  });

  const emptyState = (
    <div className="mx-auto flex max-w-sm flex-col items-center py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">
        No transactions recorded
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {searchQuery || activeFiltersCount > 0
          ? "No matching records found. Try adjusting search or filters."
          : "No entries logged for this month yet."}
      </p>
      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          Reset filters
        </button>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
      {/* Table Header Controls */}
      <div className="mb-4 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Transaction Activity
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:w-60 sm:flex-initial">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search transaction"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Popover */}
          <TransactionFilters
            categories={categories}
            paymentMethods={paymentMethods}
            selectedFlow={selectedFlow}
            onSelectFlow={onSelectFlow}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            selectedMethod={selectedMethod}
            onSelectMethod={onSelectMethod}
            selectedType={selectedType}
            onSelectType={onSelectType}
            onResetFilters={onResetFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Column Visibility Options */}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable table={table} isLoading={isLoading} emptyState={emptyState} />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Calendar, Plus } from "lucide-react";
import { DataTable, DataTableViewOptions } from "@/components/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import type { CardListItem, CardStatementSummary } from "@/types/cards";
import type { PaginationMeta } from "@/types/transactions";
import { getStatementColumns } from "./statement-columns";

interface StatementHistoryTableProps {
  card: CardListItem | null;
  statements: CardStatementSummary[];
  pagination: PaginationMeta;
  isLoading: boolean;
  page: number;
  limit: number;
  onEditStatement: (stmt: CardStatementSummary) => void;
  onDeleteStatement: (stmt: CardStatementSummary) => void;
  onLogStatement: () => void;
}

export default function StatementHistoryTable({
  card,
  statements,
  pagination,
  isLoading,
  page,
  limit,
  onEditStatement,
  onDeleteStatement,
  onLogStatement,
}: StatementHistoryTableProps) {
  const columns = useMemo(
    () =>
      getStatementColumns({
        onEdit: onEditStatement,
        onDelete: onDeleteStatement,
      }),
    [onEditStatement, onDeleteStatement],
  );

  const { table } = useDataTable({
    data: statements,
    columns,
    pageCount: pagination.totalPages || 1,
    initialState: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
  });

  if (!card) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center shadow-2xs">
        <p className="text-sm font-semibold text-foreground">
          No card selected
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a credit card from the list above to view its statement
          history.
        </p>
      </div>
    );
  }

  const emptyState = (
    <div className="mx-auto flex max-w-xs flex-col items-center py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Calendar className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">
        No statements logged
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        No billing cycle statements have been entered for this card yet.
      </p>
      <button
        type="button"
        onClick={onLogStatement}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Log first statement
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Statement History
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {card.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Past billing cycles, settlement records, and cashback earnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />

          <button
            type="button"
            onClick={onLogStatement}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-2xs transition-all hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log Statement</span>
          </button>
        </div>
      </div>

      <DataTable table={table} isLoading={isLoading} emptyState={emptyState} />
    </div>
  );
}

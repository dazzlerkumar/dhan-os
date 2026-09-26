"use client";

import MonthSelector from "./month-selector";

interface TransactionsHeaderProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onOpenAddModal: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export default function TransactionsHeader({
  selectedMonth,
  onSelectMonth,
  onOpenAddModal,
  onExport,
  isExporting = false,
}: TransactionsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all your income and expenses in one place
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <MonthSelector
          selectedMonth={selectedMonth}
          onSelectMonth={onSelectMonth}
        />

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        >
          <svg
            className="h-3.5 w-3.5 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{isExporting ? "Exporting..." : "Export"}</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98]"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Transaction</span>
        </button>
      </div>
    </div>
  );
}

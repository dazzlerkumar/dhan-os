"use client";

import { formatCurrency } from "@/lib/formatters";
import type { TransactionSummary } from "@/types/transactions";

interface TransactionMetricsProps {
  summary: TransactionSummary | null;
  isLoading: boolean;
}

export default function TransactionMetrics({
  summary,
  isLoading,
}: TransactionMetricsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-border/70 bg-card p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded-md bg-muted" />
              <div className="h-6 w-6 rounded-full bg-muted" />
            </div>
            <div className="mt-4 h-8 w-36 rounded-md bg-muted" />
            <div className="mt-3 flex items-center gap-2">
              <div className="h-4 w-16 rounded-full bg-muted" />
              <div className="h-3 w-24 rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const income = Number.parseFloat(summary.income) || 0;
  const fixedExpenses = Number.parseFloat(summary.fixedExpenses) || 0;
  const variableExpenses = Number.parseFloat(summary.variableExpenses) || 0;
  const totalExpenses = fixedExpenses + variableExpenses;
  const savings = Number.parseFloat(summary.savings) || 0;
  const cashbacks = Number.parseFloat(summary.cashbacks) || 0;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const creditSpend = Number.parseFloat(summary.creditSpend) || 0;
  const debitSpend = Number.parseFloat(summary.debitSpend) || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total / Net Savings Card */}
      <div className="group relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span>Net Savings</span>
          </div>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Options"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="mt-3.5 flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
              savings >= 0
                ? "text-foreground"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatCurrency(savings)}
          </span>
          {income > 0 && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                savings >= 0
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              <svg
                className={`h-3 w-3 ${savings < 0 ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
              <span>{savingsRate}%</span>
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {cashbacks > 0
            ? `+${formatCurrency(cashbacks)} cashback rewards included`
            : "Surplus after fixed and variable spends"}
        </p>
      </div>

      {/* Incomes Card */}
      <div className="group relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M12 15v3" />
              </svg>
            </span>
            <span>Total Inflow</span>
          </div>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Options"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="mt-3.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {formatCurrency(income)}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
            <span>Inflow</span>
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Salary, dividends and incoming ledger credits
        </p>
      </div>

      {/* Expenses Card */}
      <div className="group relative rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-border hover:shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </span>
            <span>Total Outflow</span>
          </div>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Options"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>

        <div className="mt-3.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            <span>
              Fixed {formatCurrency(fixedExpenses, { showDecimals: false })}
            </span>
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground truncate">
          CC: {formatCurrency(creditSpend, { showDecimals: false })} •
          Debit/UPI: {formatCurrency(debitSpend, { showDecimals: false })}
        </p>
      </div>
    </div>
  );
}

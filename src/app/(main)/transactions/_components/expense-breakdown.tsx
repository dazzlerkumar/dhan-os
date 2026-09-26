"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import type { CategoryBreakdownItem } from "@/types/transactions";

interface ExpenseBreakdownProps {
  selectedMonth: string;
}

const DEFAULT_CHART_COLORS = [
  "#713CE9", // Primary Violet
  "#E9713C", // Accent Orange
  "#10B981", // Emerald
  "#0EA5E9", // Sky
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#64748B", // Slate
];

export default function ExpenseBreakdown({
  selectedMonth,
}: ExpenseBreakdownProps) {
  const [data, setData] = useState<CategoryBreakdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadBreakdown() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/transactions/category-breakdown?month=${selectedMonth}`,
        );
        if (res.ok) {
          const json = await res.json();
          setData(json || []);
        }
      } catch {
        // Retain empty
      } finally {
        setIsLoading(false);
      }
    }
    loadBreakdown();
  }, [selectedMonth]);

  const totalExpense = data.reduce(
    (acc, curr) => acc + (Number.parseFloat(curr.total) || 0),
    0,
  );

  const displayItems = showAll ? data : data.slice(0, 5);

  // Compute SVG Donut segments
  let cumulativePercent = 0;
  const donutSegments = data.map((item, index) => {
    const val = Number.parseFloat(item.total) || 0;
    const percent = totalExpense > 0 ? (val / totalExpense) * 100 : 0;
    const strokeDasharray = `${percent} ${100 - percent}`;
    const strokeDashoffset = -cumulativePercent;
    cumulativePercent += percent;
    const color =
      item.color || DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];

    return {
      name: item.name,
      val,
      percent,
      color,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Expense Breakdown
        </h3>
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

      {isLoading ? (
        <div className="flex flex-col items-center py-8">
          <div className="h-36 w-36 animate-pulse rounded-full bg-muted/70" />
          <div className="mt-6 w-full space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
            <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
          </div>
        </div>
      ) : data.length === 0 || totalExpense === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <p className="mt-3 text-xs font-semibold text-foreground">
            No expenses this month
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Log an expense transaction to view category distribution
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {/* Donut Chart */}
          <div className="relative flex items-center justify-center py-2">
            <svg
              className="h-40 w-40 -rotate-90 transform"
              viewBox="0 0 36 36"
              aria-hidden="true"
            >
              {/* Background ring */}
              <circle
                cx="18"
                cy="18"
                r="15.91549430918954"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="3.2"
                className="text-muted/30"
              />
              {/* Colored Segments */}
              {donutSegments.map((seg, idx) => (
                <circle
                  // biome-ignore lint/suspicious/noArrayIndexKey: donut segments
                  key={`seg-${idx}`}
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="3.2"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total
              </span>
              <span className="text-sm font-bold tracking-tight text-foreground tabular-nums">
                {formatCurrency(totalExpense, { showDecimals: false })}
              </span>
            </div>
          </div>

          {/* Top 3 Percentage Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {donutSegments.slice(0, 3).map((seg, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: top pills
                key={`pill-${idx}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-foreground">{seg.name}</span>
                <span className="font-semibold text-muted-foreground tabular-nums">
                  {Math.round(seg.percent)}%
                </span>
              </div>
            ))}
          </div>

          {/* Other Categories List */}
          <div className="space-y-2.5 border-t border-border/60 pt-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </span>
            <div className="space-y-2">
              {displayItems.map((item, idx) => {
                const val = Number.parseFloat(item.total) || 0;
                const percent =
                  totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
                const color =
                  item.color ||
                  DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];

                return (
                  <div
                    key={item.categoryId ?? `uncat-${idx}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate font-medium text-foreground">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right tabular-nums">
                      <span className="font-medium text-foreground">
                        {formatCurrency(val, { showDecimals: false })}
                      </span>
                      <span className="w-8 text-[11px] text-muted-foreground">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.length > 5 && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <span>{showAll ? "Show Less" : "See All"}</span>
                  <svg
                    className={`h-3 w-3 transition-transform ${
                      showAll ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

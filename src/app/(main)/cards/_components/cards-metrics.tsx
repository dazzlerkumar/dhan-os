"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Gift,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { CardListItem } from "@/types/cards";

interface CardsMetricsProps {
  cards: CardListItem[];
  isLoading: boolean;
}

const SKELETON_METRICS = ["metric-1", "metric-2", "metric-3", "metric-4"];

export default function CardsMetrics({ cards, isLoading }: CardsMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKELETON_METRICS.map((key) => (
          <div
            key={key}
            className="h-24 animate-pulse rounded-2xl bg-card border border-border/70 p-4"
          />
        ))}
      </div>
    );
  }

  const activeCards = cards.filter((c) => c.active);
  const pendingCount = activeCards.filter((c) => c.pendingStatement).length;

  let totalOpenSpend = 0;
  for (const card of activeCards) {
    if (card.currentCycleSpend) {
      totalOpenSpend += Number.parseFloat(card.currentCycleSpend) || 0;
    }
  }

  let totalRewards = 0;
  for (const card of cards) {
    if (card.lastStatement?.rewards) {
      totalRewards += Number.parseFloat(card.lastStatement.rewards) || 0;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Open Spend */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Open Cycle Spend
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(totalOpenSpend)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Accumulating across {activeCards.length} active card
          {activeCards.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Statements Pending */}
      <div
        className={`rounded-2xl border p-4 shadow-2xs transition-colors ${
          pendingCount > 0
            ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
            : "border-border/80 bg-card"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Pending Statements
          </span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              pendingCount > 0
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {pendingCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {pendingCount}
          </span>
          <span className="text-xs text-muted-foreground">
            {pendingCount === 1 ? "card due" : "cards due"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {pendingCount > 0
            ? "Statement dates reached — ready to log"
            : "All generated statements logged"}
        </p>
      </div>

      {/* Latest Rewards / Cashback */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Recent Rewards
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
            <Gift className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(totalRewards)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          From most recent logged statements
        </p>
      </div>

      {/* Cards Portfolio */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Credit Instruments
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-foreground">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {activeCards.length}
          </span>
          <span className="text-xs text-muted-foreground">
            / {cards.length} total
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Managed in Dhan OS</p>
      </div>
    </div>
  );
}

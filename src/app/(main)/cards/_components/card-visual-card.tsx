"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Sliders,
} from "lucide-react";
import {
  formatCurrency,
  formatDateDisplay,
  formatMonthDisplay,
} from "@/lib/formatters";
import type { CardListItem } from "@/types/cards";

interface CardVisualCardProps {
  card: CardListItem;
  isSelected: boolean;
  onSelect: () => void;
  onLogStatement: (card: CardListItem) => void;
  onConfigureCycle: (card: CardListItem) => void;
}

export default function CardVisualCard({
  card,
  isSelected,
  onSelect,
  onLogStatement,
  onConfigureCycle,
}: CardVisualCardProps) {
  const cardColor = card.color || "var(--primary)";

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border text-left transition-all ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-card shadow-sm"
          : "border-border/80 bg-card/90 hover:border-border hover:bg-card shadow-2xs hover:shadow-xs"
      } ${!card.active ? "opacity-70" : ""}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-5 space-y-4 focus:outline-none"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs shadow-2xs"
              style={{ backgroundColor: cardColor }}
            >
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {card.name}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {card.issuer || "Credit Card"}
                {!card.active && " (Retired)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {card.pendingStatement && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3" />
                Stmt Due
              </span>
            )}
            {!card.cyclesConfigured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                Not Configured
              </span>
            )}
            {card.cyclesConfigured && !card.pendingStatement && card.active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Up to date
              </span>
            )}
          </div>
        </div>

        {/* Live Open Spend & Cycle Window */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Current Open Spend
            </span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {card.cyclesConfigured && card.currentCycleSpend !== undefined
                ? formatCurrency(card.currentCycleSpend)
                : "—"}
            </span>
          </div>

          {card.cyclesConfigured && card.currentCycleWindow && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground/80" />
                Cycle:
              </span>
              <span className="font-medium text-foreground/90">
                {formatDateDisplay(card.currentCycleWindow.start)} –{" "}
                {formatDateDisplay(card.currentCycleWindow.end)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Billing Schedule:</span>
            <span className="font-medium text-foreground/90">
              {card.statementDay ? `Day ${card.statementDay}` : "Unset"} (Stmt)
              • {card.dueDay ? `Day ${card.dueDay}` : "Unset"} (Due)
            </span>
          </div>
        </div>

        {/* Last Statement Highlight */}
        {card.lastStatement ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-medium text-[11px]">Last Statement</span>
              <span className="text-[11px] font-semibold text-foreground">
                {formatMonthDisplay(card.lastStatement.cycleMonth)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] rounded-lg bg-card/60 p-2 border border-border/50">
              <div>
                <span className="text-muted-foreground">Billed: </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(card.lastStatement.generatedAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Rewards: </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(card.lastStatement.rewards)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-muted-foreground">
            No statement logged yet
          </div>
        )}
      </button>

      {/* Card Action Footer */}
      <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConfigureCycle(card);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sliders className="h-3 w-3" />
          <span>{card.cyclesConfigured ? "Edit Cycle" : "Set Cycle Days"}</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLogStatement(card);
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs"
        >
          <Plus className="h-3 w-3" />
          <span>Log Statement</span>
        </button>
      </div>
    </div>
  );
}

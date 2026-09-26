"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCurrentMonth } from "@/lib/formatters";
import type { CardListItem, CardStatementSummary } from "@/types/cards";

interface StatementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardListItem[];
  initialCard: CardListItem | null;
  editingStatement: CardStatementSummary | null;
  onSuccess: () => void;
}

export default function StatementDialog({
  isOpen,
  onClose,
  cards,
  initialCard,
  editingStatement,
  onSuccess,
}: StatementDialogProps) {
  const isEdit = Boolean(editingStatement);

  const [selectedCardId, setSelectedCardId] = useState<number>(
    initialCard?.id || (cards[0]?.id ?? 0),
  );
  const [cycleMonth, setCycleMonth] = useState<string>(getCurrentMonth());
  const [generatedAmount, setGeneratedAmount] = useState<string>("");
  const [paidDate, setPaidDate] = useState<string>("");
  const [rewards, setRewards] = useState<string>("0");
  const [customSpend, setCustomSpend] = useState<string>("");
  const [overrideSpend, setOverrideSpend] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingStatement) {
      if (initialCard) setSelectedCardId(initialCard.id);
      setCycleMonth(editingStatement.cycleMonth.slice(0, 7));
      setGeneratedAmount(editingStatement.generatedAmount || "");
      setPaidDate(editingStatement.paidDate || "");
      setRewards(editingStatement.rewards || "0");
      setCustomSpend(editingStatement.spend || "");
      setOverrideSpend(Boolean(editingStatement.spend));
    } else {
      if (initialCard) {
        setSelectedCardId(initialCard.id);
      } else if (cards[0]) {
        setSelectedCardId(cards[0].id);
      }
      setCycleMonth(getCurrentMonth());
      setGeneratedAmount("");
      setPaidDate("");
      setRewards("0");
      setCustomSpend("");
      setOverrideSpend(false);
    }
    setErrorMessage(null);
  }, [editingStatement, initialCard, cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numGenerated = Number.parseFloat(generatedAmount);
    if (Number.isNaN(numGenerated) || numGenerated < 0) {
      setErrorMessage("Generated amount must be a valid positive number or 0");
      return;
    }

    const numRewards = Number.parseFloat(rewards || "0");
    if (Number.isNaN(numRewards) || numRewards < 0) {
      setErrorMessage("Rewards must be 0 or a positive number");
      return;
    }

    if (!selectedCardId) {
      setErrorMessage("Please select a credit card");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && editingStatement) {
        const payload: {
          generatedAmount: string;
          paidDate: string | null;
          rewards: string;
          spend?: string;
        } = {
          generatedAmount: numGenerated.toFixed(2),
          paidDate: paidDate.trim() ? paidDate.trim() : null,
          rewards: numRewards.toFixed(2),
        };

        if (overrideSpend && customSpend.trim()) {
          const numSpend = Number.parseFloat(customSpend);
          if (!Number.isNaN(numSpend) && numSpend >= 0) {
            payload.spend = numSpend.toFixed(2);
          }
        }

        const res = await fetch(
          `/api/cards/${selectedCardId}/statements/${editingStatement.cycleMonth}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || "Failed to update statement");
        }
      } else {
        const payload: {
          cycleMonth: string;
          generatedAmount: string;
          paidDate: string | null;
          rewards: string;
          spend?: string;
        } = {
          cycleMonth: `${cycleMonth}-01`,
          generatedAmount: numGenerated.toFixed(2),
          paidDate: paidDate.trim() ? paidDate.trim() : null,
          rewards: numRewards.toFixed(2),
        };

        if (overrideSpend && customSpend.trim()) {
          const numSpend = Number.parseFloat(customSpend);
          if (!Number.isNaN(numSpend) && numSpend >= 0) {
            payload.spend = numSpend.toFixed(2);
          }
        }

        const res = await fetch(`/api/cards/${selectedCardId}/statements`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          throw new Error(json?.error || "Failed to create statement");
        }
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save statement",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Statement" : "Log Credit Card Statement"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update statement details, settlement date, or rewards."
              : "Record the billed statement amount and rewards for a billing cycle."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Selection */}
          <div>
            <label
              htmlFor="stmt-card"
              className="block text-xs font-medium text-foreground mb-1"
            >
              Credit Card <span className="text-destructive">*</span>
            </label>
            <select
              id="stmt-card"
              disabled={isEdit}
              value={selectedCardId}
              onChange={(e) =>
                setSelectedCardId(Number.parseInt(e.target.value, 10))
              }
              className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.issuer || "Card"})
                </option>
              ))}
            </select>
          </div>

          {/* Cycle Month & Generated Bill Amount */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="stmt-month"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Statement Month <span className="text-destructive">*</span>
              </label>
              <input
                id="stmt-month"
                type="month"
                disabled={isEdit}
                required
                value={cycleMonth}
                onChange={(e) => setCycleMonth(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="stmt-amount"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Billed Amount (₹) <span className="text-destructive">*</span>
              </label>
              <input
                id="stmt-amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={generatedAmount}
                onChange={(e) => setGeneratedAmount(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Paid Date & Rewards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="stmt-paid-date"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Paid Date (optional)
              </label>
              <input
                id="stmt-paid-date"
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="stmt-rewards"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Rewards / Cashback (₹)
              </label>
              <input
                id="stmt-rewards"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={rewards}
                onChange={(e) => setRewards(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Spend Override Option */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="override-spend-toggle"
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                Override Cycle Spend manually
              </label>
              <input
                id="override-spend-toggle"
                type="checkbox"
                checked={overrideSpend}
                onChange={(e) => setOverrideSpend(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary/20 cursor-pointer"
              />
            </div>
            {overrideSpend ? (
              <div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Custom spend amount"
                  value={customSpend}
                  onChange={(e) => setCustomSpend(e.target.value)}
                  className="h-8 w-full rounded-lg border border-border/80 bg-background px-3 text-xs tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Cycle spend is automatically calculated from transactions in
                this billing cycle window and frozen at creation.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-xl border border-border/80 bg-card px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !generatedAmount}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-95 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Statement"
                  : "Save Statement"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

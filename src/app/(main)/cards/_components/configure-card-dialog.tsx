"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CardListItem } from "@/types/cards";

interface ConfigureCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardListItem | null;
  onSuccess: () => void;
}

export default function ConfigureCardDialog({
  isOpen,
  onClose,
  card,
  onSuccess,
}: ConfigureCardDialogProps) {
  const [statementDay, setStatementDay] = useState<string>("");
  const [dueDay, setDueDay] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      setStatementDay(
        card.statementDay !== null ? String(card.statementDay) : "",
      );
      setDueDay(card.dueDay !== null ? String(card.dueDay) : "");
    } else {
      setStatementDay("");
      setDueDay("");
    }
    setErrorMessage(null);
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setErrorMessage(null);

    const sDay = statementDay ? Number.parseInt(statementDay, 10) : null;
    const dDay = dueDay ? Number.parseInt(dueDay, 10) : null;

    if (sDay !== null && (sDay < 1 || sDay > 31)) {
      setErrorMessage("Statement day must be between 1 and 31");
      return;
    }

    if (dDay !== null && (dDay < 1 || dDay > 31)) {
      setErrorMessage("Due day must be between 1 and 31");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/payment-methods/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementDay: sDay,
          dueDay: dDay,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(
          json?.error || "Failed to update card cycle configuration",
        );
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to update card cycle configuration",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Configure Billing Cycle</DialogTitle>
          <DialogDescription>
            Set statement generation day and payment due day for {card?.name}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="cfg-stmt-day"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Statement Day
              </label>
              <input
                id="cfg-stmt-day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 1"
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                1st – 31st of month
              </span>
            </div>

            <div>
              <label
                htmlFor="cfg-due-day"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Payment Due Day
              </label>
              <input
                id="cfg-due-day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 21"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                1st – 31st of month
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-xl p-2.5">
            Both statement day and due day are required for automatic billing
            cycle window and live spend computation.
          </p>

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
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-95 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TransactionItem } from "@/types/transactions";

interface CategoryMeta {
  id: number;
  name: string;
  defaultType?: "fixed" | "variable";
  color: string | null;
}

interface PaymentMethodMeta {
  id: number;
  name: string;
  kind: string;
}

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
  categories: CategoryMeta[];
  paymentMethods: PaymentMethodMeta[];
  onSuccess: () => void;
}

export default function TransactionDialog({
  isOpen,
  onClose,
  transaction,
  categories,
  paymentMethods,
  onSuccess,
}: TransactionDialogProps) {
  const isEdit = Boolean(transaction);
  const todayStr = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(todayStr);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [flow, setFlow] = useState<"income" | "expense" | "invest">("expense");
  const [isFixed, setIsFixed] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setFlow(transaction.flow);
      setIsFixed(transaction.isFixed);
      setCategoryId(transaction.categoryId);
      setPaymentMethodId(transaction.paymentMethodId);
      setNote(transaction.note || "");
    } else {
      setDate(todayStr);
      setDescription("");
      setAmount("");
      setFlow("expense");
      setIsFixed(false);
      setCategoryId(null);
      setPaymentMethodId(null);
      setNote("");
    }
    setErrorMessage(null);
  }, [transaction, todayStr]);

  const handleCategoryChange = (newCatId: number | null) => {
    setCategoryId(newCatId);
    if (!isEdit && newCatId) {
      const cat = categories.find((c) => c.id === newCatId);
      if (cat && cat.defaultType) {
        setIsFixed(cat.defaultType === "fixed");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = Number.parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("amount must be greater than 0");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date,
        description: description.trim(),
        amount: numAmount.toFixed(2),
        flow,
        isFixed,
        categoryId: categoryId || null,
        paymentMethodId: paymentMethodId || null,
        note: note.trim() || null,
      };

      const url = isEdit
        ? `/api/transactions/${transaction?.id}`
        : "/api/transactions";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to save transaction");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save transaction",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update transaction details in the continuous ledger."
              : "Record an income or expense entry to your ledger."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Flow Selector */}
          <div>
            <span className="block text-xs font-medium text-foreground mb-1.5">
              Flow Direction
            </span>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
              {(["expense", "income", "invest"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setFlow(dir)}
                  className={`rounded-lg py-1.5 text-center text-xs font-semibold capitalize transition-all ${
                    flow === dir
                      ? dir === "income"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : dir === "invest"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tx-description"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Description <span className="text-destructive">*</span>
              </label>
              <input
                id="tx-description"
                type="text"
                required
                placeholder="e.g. Swiggy, Salary, SIP..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Amount (₹) <span className="text-destructive">*</span>
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Date & Type (Fixed / Variable) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Date <span className="text-destructive">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-foreground mb-1">
                Expense Type
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setIsFixed(false)}
                  className={`rounded-lg py-1.5 text-center text-xs font-medium transition-all ${
                    !isFixed
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Variable
                </button>
                <button
                  type="button"
                  onClick={() => setIsFixed(true)}
                  className={`rounded-lg py-1.5 text-center text-xs font-medium transition-all ${
                    isFixed
                      ? "bg-card text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Fixed
                </button>
              </div>
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Category
              </label>
              <select
                id="tx-category"
                value={categoryId ?? ""}
                onChange={(e) =>
                  handleCategoryChange(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="tx-method"
                className="block text-xs font-medium text-foreground mb-1"
              >
                Payment Method
              </label>
              <select
                id="tx-method"
                value={paymentMethodId ?? ""}
                onChange={(e) =>
                  setPaymentMethodId(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No Instrument</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.kind.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-foreground mb-1"
            >
              Note (optional)
            </label>
            <textarea
              id="tx-note"
              rows={2}
              placeholder="Additional details, itemized tags..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
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
              disabled={isSubmitting || !description.trim() || !amount}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-95 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Transaction"
                  : "Save Transaction"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

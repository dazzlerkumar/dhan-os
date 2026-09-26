"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";

interface RecurringTemplateItem {
  id: number;
  description: string;
  amount: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  paymentMethodId: number | null;
  paymentMethodName: string | null;
  isFixed: boolean;
  dayOfMonth: number | null;
  active: boolean;
}

interface RecurringSpendsCardProps {
  onTransactionLogged: () => void;
  categories: Array<{ id: number; name: string }>;
  paymentMethods: Array<{ id: number; name: string }>;
}

export default function RecurringSpendsCard({
  onTransactionLogged,
  categories,
  paymentMethods,
}: RecurringSpendsCardProps) {
  const [templates, setTemplates] = useState<RecurringTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newPaymentMethodId, setNewPaymentMethodId] = useState<number | null>(
    null,
  );
  const [newDay, setNewDay] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recurring-templates");
      if (res.ok) {
        const json = await res.json();
        setTemplates(json || []);
      }
    } catch {
      // Retain
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleLog = async (template: RecurringTemplateItem) => {
    setLoggingId(template.id);
    try {
      const res = await fetch(`/api/recurring-templates/${template.id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        onTransactionLogged();
      }
    } catch {
      // Fail silently
    } finally {
      setLoggingId(null);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/recurring-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newDescription.trim(),
          amount: newAmount ? Number.parseFloat(newAmount) : null,
          categoryId: newCategoryId,
          paymentMethodId: newPaymentMethodId,
          dayOfMonth: newDay,
          isFixed: true,
        }),
      });

      if (res.ok) {
        setNewDescription("");
        setNewAmount("");
        setNewCategoryId(null);
        setNewPaymentMethodId(null);
        setNewDay(null);
        setIsAdding(false);
        fetchTemplates();
      }
    } catch {
      // Failed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Subscriptions & Recurring
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Pre-configured templates for quick monthly logging
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding((prev) => !prev)}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{isAdding ? "Cancel" : "Add"}</span>
        </button>
      </div>

      {/* Add New Template Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTemplate}
          className="mt-3.5 space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3.5"
        >
          <p className="text-xs font-semibold text-foreground">
            New Recurring Spend
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="template-description"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                Description
              </label>
              <input
                id="template-description"
                type="text"
                placeholder="Spotify, Wifi, SIP..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
                className="mt-1 h-8 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="template-amount"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                Amount (optional)
              </label>
              <input
                id="template-amount"
                type="number"
                step="0.01"
                placeholder="e.g. 500"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="mt-1 h-8 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div>
              <label
                htmlFor="template-category"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                Category
              </label>
              <select
                id="template-category"
                value={newCategoryId ?? ""}
                onChange={(e) =>
                  setNewCategoryId(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="mt-1 h-8 w-full rounded-lg border border-border/80 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="template-method"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                Payment Method
              </label>
              <select
                id="template-method"
                value={newPaymentMethodId ?? ""}
                onChange={(e) =>
                  setNewPaymentMethodId(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="mt-1 h-8 w-full rounded-lg border border-border/80 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">None</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="template-day"
                className="block text-[11px] font-medium text-muted-foreground"
              >
                Day of Month
              </label>
              <input
                id="template-day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 5"
                value={newDay ?? ""}
                onChange={(e) =>
                  setNewDay(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="mt-1 h-8 w-full rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !newDescription.trim()}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Template"}
            </button>
          </div>
        </form>
      )}

      {/* Templates List */}
      <div className="mt-3.5 space-y-2.5">
        {isLoading ? (
          ["tpl-skel-1", "tpl-skel-2", "tpl-skel-3"].map((skelKey) => (
            <div
              key={skelKey}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <div className="space-y-1">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-6 w-14 animate-pulse rounded bg-muted" />
            </div>
          ))
        ) : templates.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            <p>No recurring templates configured.</p>
            <p className="mt-1 text-[11px]">
              Click &quot;Add&quot; above to create templates for quick 1-tap
              logging.
            </p>
          </div>
        ) : (
          templates.map((tpl) => {
            const isLogging = loggingId === tpl.id;
            const amt = tpl.amount ? Number.parseFloat(tpl.amount) : null;

            return (
              <div
                key={tpl.id}
                className="group flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-2.5 transition-colors hover:border-border hover:bg-muted/40"
              >
                <div className="flex items-center gap-2.5 truncate pr-2">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: tpl.categoryColor
                        ? `${tpl.categoryColor}25`
                        : "rgba(113, 60, 233, 0.15)",
                      color: tpl.categoryColor || "#713CE9",
                    }}
                  >
                    {tpl.description.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {tpl.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {tpl.dayOfMonth ? `Due day ${tpl.dayOfMonth}` : "Fixed"}
                      {tpl.categoryName && ` • ${tpl.categoryName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {amt !== null ? formatCurrency(amt) : "Varies"}
                  </span>
                  <button
                    type="button"
                    disabled={isLogging}
                    onClick={() => handleLog(tpl)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2 text-[11px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground focus:outline-none disabled:opacity-50"
                    title="Log occurrence for this month"
                  >
                    {isLogging ? (
                      <span className="inline-block animate-spin text-[10px]">
                        ⏳
                      </span>
                    ) : (
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>Log</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ColorPickerPopover from "./color-picker-popover";
import {
  CATEGORY_PALETTE,
  PAYMENT_KINDS,
  type PaymentKind,
  type PaymentMethodItem,
} from "./constants";
import PaymentMethodRow from "./payment-method-row";

export default function PaymentMethodsManager() {
  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // New payment method state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIssuer, setNewIssuer] = useState("");
  const [newKind, setNewKind] = useState<PaymentKind>("upi");
  const [newColor, setNewColor] = useState<string>(CATEGORY_PALETTE[3].hex);
  const [newStatementDay, setNewStatementDay] = useState("");
  const [newDueDay, setNewDueDay] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newRowError, setNewRowError] = useState<string | null>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);

  const fetchMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Failed to load payment methods");
      const data: PaymentMethodItem[] = await res.json();
      setMethods(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load payment methods",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  useEffect(() => {
    if (isAdding) {
      newNameInputRef.current?.focus();
    }
  }, [isAdding]);

  const handleUpdate = async (
    id: number,
    data: Partial<PaymentMethodItem>,
  ): Promise<boolean> => {
    const previous = [...methods];
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m)),
    );

    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update payment method");
      }

      const updated = await res.json();
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updated } : m)),
      );
      return true;
    } catch (err: unknown) {
      setMethods(previous);
      setError(
        err instanceof Error ? err.message : "Failed to update payment method",
      );
      setTimeout(() => setError(null), 4000);
      return false;
    }
  };

  const handleToggleActive = async (
    id: number,
    active?: boolean,
  ): Promise<boolean> => {
    const previous = [...methods];
    setMethods((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, active: active ?? !m.active } : m,
      ),
    );

    try {
      const res = await fetch(`/api/payment-methods/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: active !== undefined ? JSON.stringify({ active }) : undefined,
      });

      if (!res.ok) {
        throw new Error("Failed to toggle status");
      }

      const data = await res.json();
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: data.active } : m)),
      );
      return true;
    } catch {
      setMethods(previous);
      setError("Failed to update active state");
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        return {
          success: false,
          error: errJson?.error || "Cannot delete method in use",
        };
      }

      if (!res.ok) {
        return { success: false, error: "Failed to delete payment method" };
      }

      setMethods((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    } catch {
      return { success: false, error: "Network error while deleting" };
    }
  };

  const handleDragStart = (_e: React.DragEvent<HTMLElement>, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDrop = async (
    _e: React.DragEvent<HTMLElement>,
    targetIndex: number,
  ) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const updated = [...methods];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));

    const previous = [...methods];
    setMethods(reordered);
    handleDragEnd();

    try {
      const order = reordered.map((item) => item.id);
      const res = await fetch("/api/payment-methods/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });

      if (!res.ok) throw new Error("Failed to save reorder");
    } catch {
      setMethods(previous);
      setError("Failed to persist order. Reverted back.");
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateMethod = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewRowError("Payment method name is required");
      return;
    }

    setIsSubmittingNew(true);
    setNewRowError(null);

    const sDay = newStatementDay ? Number.parseInt(newStatementDay, 10) : null;
    const dDay = newDueDay ? Number.parseInt(newDueDay, 10) : null;

    try {
      const res = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          issuer: newIssuer.trim() || null,
          kind: newKind,
          color: newColor,
          statementDay: sDay && sDay >= 1 && sDay <= 31 ? sDay : null,
          dueDay: dDay && dDay >= 1 && dDay <= 31 ? dDay : null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to create payment method");
      }

      const created: PaymentMethodItem = await res.json();
      setMethods((prev) => [...prev, created]);
      setNewName("");
      setNewIssuer("");
      setNewKind("upi");
      setNewStatementDay("");
      setNewDueDay("");
      setIsAdding(false);

      const nextIndex =
        (CATEGORY_PALETTE.findIndex((c) => c.hex === newColor) + 1) %
        CATEGORY_PALETTE.length;
      setNewColor(CATEGORY_PALETTE[nextIndex].hex);
    } catch (err: unknown) {
      setNewRowError(
        err instanceof Error ? err.message : "Failed to create payment method",
      );
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const activeCount = methods.filter((m) => m.active).length;
  const retiredCount = methods.length - activeCount;
  const creditCount = methods.filter((m) => m.kind === "credit").length;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-md">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Payment Instruments
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage debit, credit, UPI, and cash accounts tagged to transactions
            and statements.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-foreground">
            {methods.length} total
          </span>
          <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-muted-foreground">
            {activeCount} active
          </span>
          {retiredCount > 0 && (
            <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-muted-foreground">
              {retiredCount} retired
            </span>
          )}
          <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-muted-foreground">
            {creditCount} credit
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchMethods}
            className="underline underline-offset-2 hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main List Container */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        {isLoading ? (
          <div className="space-y-2.5 py-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-xl border border-border/40 bg-muted/40"
              />
            ))}
          </div>
        ) : methods.length === 0 && !isAdding ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-secondary/50 text-muted-foreground">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No payment methods yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Add your accounts, cards, or UPI handles to log transactions and
              track billing cycles.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-xs transition-opacity hover:opacity-90"
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
                + Add payment method
              </button>
            </div>
          </div>
        ) : (
          /* List of Methods */
          <div className="space-y-2">
            <ul className="space-y-2">
              {methods.map((method, idx) => (
                <PaymentMethodRow
                  key={method.id}
                  method={method}
                  index={idx}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === idx}
                  isDropTarget={dropTargetIndex === idx}
                />
              ))}
            </ul>

            {/* Inline Add Method Form Row */}
            {isAdding ? (
              <div className="relative mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-card p-3 shadow-sm ring-2 ring-primary/10 animate-in fade-in">
                <ColorPickerPopover
                  value={newColor}
                  onChange={(color) => setNewColor(color)}
                />

                <div className="relative min-w-[150px] flex-1">
                  <input
                    ref={newNameInputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (newRowError) setNewRowError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateMethod();
                      else if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewName("");
                      }
                    }}
                    placeholder="Method name (e.g. HDFC Swiggy CC)..."
                    className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                  {newRowError && (
                    <span className="absolute -bottom-4 left-2 text-[11px] font-medium text-destructive">
                      {newRowError}
                    </span>
                  )}
                </div>

                <div className="w-24 sm:w-28">
                  <input
                    type="text"
                    value={newIssuer}
                    onChange={(e) => setNewIssuer(e.target.value)}
                    placeholder="Issuer (e.g. HDFC)"
                    className="w-full rounded-md bg-transparent px-2 py-1 text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus:text-foreground focus:outline-none"
                  />
                </div>

                <div className="flex items-center rounded-lg border border-border/80 bg-secondary/50 p-0.5 text-xs">
                  {PAYMENT_KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setNewKind(k.value)}
                      className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                        newKind === k.value
                          ? "bg-foreground text-background shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>

                {newKind === "credit" && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground/80">
                        Stmt:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newStatementDay}
                        onChange={(e) => setNewStatementDay(e.target.value)}
                        placeholder="1"
                        className="w-8 rounded bg-background px-1 py-0.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <span className="text-border">|</span>
                    <label className="flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground/80">
                        Due:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newDueDay}
                        onChange={(e) => setNewDueDay(e.target.value)}
                        placeholder="21"
                        className="w-8 rounded bg-background px-1 py-0.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isSubmittingNew}
                    onClick={handleCreateMethod}
                    className="flex h-8 items-center justify-center rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingNew ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewName("");
                      setNewIssuer("");
                      setNewRowError(null);
                    }}
                    className="flex h-8 items-center justify-center rounded-lg border border-border/80 px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Pinned Add Method Trigger Button */}
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/40 hover:bg-secondary/40 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                + Add payment method
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

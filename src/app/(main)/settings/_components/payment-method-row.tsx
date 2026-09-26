"use client";

import { useEffect, useRef, useState } from "react";
import ColorPickerPopover from "./color-picker-popover";
import {
  PAYMENT_KINDS,
  type PaymentKind,
  type PaymentMethodItem,
} from "./constants";

interface PaymentMethodRowProps {
  method: PaymentMethodItem;
  index: number;
  onUpdate: (id: number, data: Partial<PaymentMethodItem>) => Promise<boolean>;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
  onToggleActive: (id: number, active?: boolean) => Promise<boolean>;
  onDragStart: (e: React.DragEvent<HTMLElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLElement>, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

export default function PaymentMethodRow({
  method,
  index,
  onUpdate,
  onDelete,
  onToggleActive,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
}: PaymentMethodRowProps) {
  const [name, setName] = useState(method.name);
  const [issuer, setIssuer] = useState(method.issuer || "");
  const [statementDay, setStatementDay] = useState(
    method.statementDay?.toString() || "",
  );
  const [dueDay, setDueDay] = useState(method.dueDay?.toString() || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [retirePrompt, setRetirePrompt] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(method.name);
  }, [method.name]);

  useEffect(() => {
    setIssuer(method.issuer || "");
  }, [method.issuer]);

  useEffect(() => {
    setStatementDay(method.statementDay?.toString() || "");
  }, [method.statementDay]);

  useEffect(() => {
    setDueDay(method.dueDay?.toString() || "");
  }, [method.dueDay]);

  const handleCommitName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(method.name);
      setNameError("Name cannot be empty");
      setTimeout(() => setNameError(null), 3000);
      return;
    }

    if (trimmed === method.name) return;

    setIsSaving(true);
    setNameError(null);
    const ok = await onUpdate(method.id, { name: trimmed });
    setIsSaving(false);
    if (!ok) {
      setName(method.name);
    }
  };

  const handleCommitIssuer = async () => {
    const trimmed = issuer.trim();
    const finalVal = trimmed ? trimmed : null;
    if (finalVal === method.issuer) return;

    setIsSaving(true);
    await onUpdate(method.id, { issuer: finalVal });
    setIsSaving(false);
  };

  const handleCommitDays = async () => {
    const sNum = statementDay ? Number.parseInt(statementDay, 10) : null;
    const dNum = dueDay ? Number.parseInt(dueDay, 10) : null;

    if (sNum === method.statementDay && dNum === method.dueDay) return;

    setIsSaving(true);
    await onUpdate(method.id, {
      statementDay: sNum && sNum >= 1 && sNum <= 31 ? sNum : null,
      dueDay: dNum && dNum >= 1 && dNum <= 31 ? dNum : null,
    });
    setIsSaving(false);
  };

  const handleKindChange = async (newKind: PaymentKind) => {
    if (newKind === method.kind || isSaving) return;
    setIsSaving(true);
    const ok = await onUpdate(method.id, { kind: newKind });
    setIsSaving(false);
    if (!ok) {
      // Revert if blocked due to history
    }
  };

  const handleColorChange = async (newColor: string) => {
    if (newColor === method.color || isSaving) return;
    await onUpdate(method.id, { color: newColor });
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setRetirePrompt(null);

    const result = await onDelete(method.id);
    setIsDeleting(false);

    if (!result.success && result.error) {
      setRetirePrompt(result.error);
    }
  };

  const handleRetireClick = async () => {
    setIsSaving(true);
    await onToggleActive(method.id, false);
    setIsSaving(false);
    setRetirePrompt(null);
  };

  const isCredit = method.kind === "credit";
  const isInactive = !method.active;

  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
        isDragging
          ? "border-primary/50 bg-secondary/30 opacity-40 shadow-xs"
          : isDropTarget
            ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
            : isInactive
              ? "border-dashed border-border/60 bg-muted/20 opacity-60 hover:opacity-100"
              : "border-border/70 bg-card hover:border-border hover:shadow-xs"
      }`}
    >
      {/* Drag handle */}
      <div
        className="flex cursor-grab items-center text-muted-foreground/60 transition-colors hover:text-foreground active:cursor-grabbing"
        title="Drag to reorder"
      >
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
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      {/* Color Swatch */}
      <ColorPickerPopover
        value={method.color}
        onChange={handleColorChange}
        disabled={isSaving || isDeleting}
      />

      {/* Name Input */}
      <div className="relative min-w-[150px] flex-1">
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          disabled={isSaving || isDeleting}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          onBlur={handleCommitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") nameInputRef.current?.blur();
            else if (e.key === "Escape") {
              setName(method.name);
              nameInputRef.current?.blur();
            }
          }}
          className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors placeholder:text-muted-foreground/50 hover:bg-muted/40 focus:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Method name..."
        />
        {nameError && (
          <span className="absolute -bottom-4 left-2 text-[11px] font-medium text-destructive">
            {nameError}
          </span>
        )}
      </div>

      {/* Issuer Input */}
      <div className="w-24 sm:w-28">
        <input
          type="text"
          value={issuer}
          disabled={isSaving || isDeleting}
          onChange={(e) => setIssuer(e.target.value)}
          onBlur={handleCommitIssuer}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              e.currentTarget.blur();
            }
          }}
          className="w-full rounded-md bg-transparent px-2 py-1 text-xs text-muted-foreground transition-colors placeholder:text-muted-foreground/40 hover:bg-muted/40 focus:bg-muted/50 focus:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Issuer (e.g. HDFC)"
        />
      </div>

      {/* Kind Pill Selector */}
      <div className="flex items-center rounded-lg border border-border/80 bg-secondary/50 p-0.5 text-xs">
        {PAYMENT_KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            disabled={isSaving || isDeleting}
            onClick={() => handleKindChange(k.value)}
            className={`rounded-md px-2 py-1 font-medium transition-all ${
              method.kind === k.value
                ? "bg-foreground text-background shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Credit Card Specific Inline Fields */}
      {isCredit && (
        <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
          <label className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground/80">Stmt:</span>
            <input
              type="number"
              min={1}
              max={31}
              value={statementDay}
              onChange={(e) => setStatementDay(e.target.value)}
              onBlur={handleCommitDays}
              placeholder="1"
              className="w-8 rounded bg-background px-1 py-0.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <span className="text-border">|</span>
          <label className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground/80">Due:</span>
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              onBlur={handleCommitDays}
              placeholder="21"
              className="w-8 rounded bg-background px-1 py-0.5 text-center text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
        </div>
      )}

      {/* Actions: Delete or Reactivate or 409 Retire Notice */}
      <div className="flex min-w-[32px] items-center justify-end">
        {retirePrompt ? (
          <div className="flex items-center gap-1.5 animate-in fade-in">
            <output className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-500">
              In use — retire instead?
            </output>
            <button
              type="button"
              onClick={handleRetireClick}
              disabled={isSaving}
              className="rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-black transition-opacity hover:opacity-90"
            >
              Retire
            </button>
            <button
              type="button"
              onClick={() => setRetirePrompt(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        ) : isInactive ? (
          <button
            type="button"
            onClick={() => onToggleActive(method.id, true)}
            disabled={isSaving}
            className="rounded-lg border border-border/80 bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/30 disabled:opacity-50"
            title="Delete payment method"
            aria-label={`Delete ${method.name}`}
          >
            {isDeleting ? (
              <svg
                className="h-4 w-4 animate-spin text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  strokeDasharray="32"
                  strokeDashoffset="12"
                />
              </svg>
            ) : (
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
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </button>
        )}
      </div>
    </li>
  );
}

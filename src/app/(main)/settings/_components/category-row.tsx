"use client";

import { useEffect, useRef, useState } from "react";
import ColorPickerPopover from "./color-picker-popover";
import type { CategoryItem } from "./constants";

interface CategoryRowProps {
  category: CategoryItem;
  index: number;
  onUpdate: (id: number, data: Partial<CategoryItem>) => Promise<boolean>;
  onDelete: (id: number) => Promise<{ success: boolean; error?: string }>;
  onDragStart: (e: React.DragEvent<HTMLElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLElement>, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

export default function CategoryRow({
  category,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDropTarget,
}: CategoryRowProps) {
  const [name, setName] = useState(category.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(category.name);
  }, [category.name]);

  useEffect(() => {
    if (!conflictNotice) return;
    const timer = setTimeout(() => {
      setConflictNotice(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [conflictNotice]);

  const handleCommitName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(category.name);
      setNameError("Name cannot be empty");
      setTimeout(() => setNameError(null), 3000);
      return;
    }

    if (trimmed === category.name) {
      return;
    }

    setIsSaving(true);
    setNameError(null);
    const ok = await onUpdate(category.id, { name: trimmed });
    setIsSaving(false);
    if (!ok) {
      setName(category.name);
      setNameError("Name already taken or invalid");
      setTimeout(() => setNameError(null), 3500);
    }
  };

  const handleToggleType = async (newType: "fixed" | "variable") => {
    if (newType === category.defaultType || isSaving) return;
    await onUpdate(category.id, { defaultType: newType });
  };

  const handleColorChange = async (newColor: string) => {
    if (newColor === category.color || isSaving) return;
    await onUpdate(category.id, { color: newColor });
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setConflictNotice(null);

    const result = await onDelete(category.id);
    setIsDeleting(false);

    if (!result.success && result.error) {
      setConflictNotice(result.error);
    }
  };

  return (
    <li
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
        isDragging
          ? "border-primary/50 bg-secondary/30 opacity-40 shadow-xs"
          : isDropTarget
            ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
            : "border-border/70 bg-card hover:border-border hover:shadow-xs"
      }`}
    >
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

      <ColorPickerPopover
        value={category.color}
        onChange={handleColorChange}
        disabled={isSaving || isDeleting}
      />

      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={name}
          disabled={isSaving || isDeleting}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          onBlur={handleCommitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              inputRef.current?.blur();
            } else if (e.key === "Escape") {
              setName(category.name);
              inputRef.current?.blur();
            }
          }}
          className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-medium text-foreground transition-colors placeholder:text-muted-foreground/50 hover:bg-muted/40 focus:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Category name..."
        />
        {nameError && (
          <span className="absolute -bottom-4 left-2 text-[11px] font-medium text-destructive animate-in fade-in">
            {nameError}
          </span>
        )}
      </div>

      <div className="flex items-center rounded-lg border border-border/80 bg-secondary/50 p-0.5 text-xs">
        <button
          type="button"
          disabled={isSaving || isDeleting}
          onClick={() => handleToggleType("fixed")}
          className={`rounded-md px-2.5 py-1 font-medium transition-all ${
            category.defaultType === "fixed"
              ? "bg-foreground text-background shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fixed
        </button>
        <button
          type="button"
          disabled={isSaving || isDeleting}
          onClick={() => handleToggleType("variable")}
          className={`rounded-md px-2.5 py-1 font-medium transition-all ${
            category.defaultType === "variable"
              ? "bg-foreground text-background shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Variable
        </button>
      </div>

      <div className="flex min-w-[32px] items-center justify-end">
        {conflictNotice ? (
          <output className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive transition-all">
            {conflictNotice}
          </output>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/30 disabled:opacity-50"
            title="Delete category"
            aria-label={`Delete ${category.name}`}
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

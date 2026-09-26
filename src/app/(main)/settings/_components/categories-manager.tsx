"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CategoryRow from "./category-row";
import ColorPickerPopover from "./color-picker-popover";
import {
  type CategoryItem,
  CATEGORY_PALETTE,
  STARTER_CATEGORIES,
} from "./constants";

export default function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // New category creation state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDefaultType, setNewDefaultType] = useState<"fixed" | "variable">(
    "variable",
  );
  const [newColor, setNewColor] = useState<string>(CATEGORY_PALETTE[0].hex);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newRowError, setNewRowError] = useState<string | null>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data: CategoryItem[] = await res.json();
      setCategories(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isAdding) {
      newNameInputRef.current?.focus();
    }
  }, [isAdding]);

  const handleUpdate = async (id: number, data: Partial<CategoryItem>) => {
    const previous = [...categories];
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
    );

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update category");
      }

      const updatedRow = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedRow } : c)),
      );
      return true;
    } catch (_err) {
      setCategories(previous);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (res.status === 409) {
        const errJson = await res.json().catch(() => null);
        return {
          success: false,
          error: errJson?.error || "Cannot delete category in use",
        };
      }

      if (!res.ok) {
        return { success: false, error: "Failed to delete category" };
      }

      // Optimistic delete success
      setCategories((prev) => prev.filter((c) => c.id !== id));
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

    const updated = [...categories];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));

    const previous = [...categories];
    setCategories(reordered);
    handleDragEnd();

    try {
      const order = reordered.map((item) => item.id);
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });

      if (!res.ok) {
        throw new Error("Failed to persist reorder");
      }
    } catch {
      setCategories(previous);
      setError("Failed to save reordered order. Reverted back.");
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNewRowError("Category name is required");
      return;
    }

    setIsSubmittingNew(true);
    setNewRowError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          defaultType: newDefaultType,
          color: newColor,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to create category");
      }

      const created: CategoryItem = await res.json();
      setCategories((prev) => [...prev, created]);
      setNewName("");
      setIsAdding(false);
      // Pick next color in palette
      const nextIndex =
        (CATEGORY_PALETTE.findIndex((c) => c.hex === newColor) + 1) %
        CATEGORY_PALETTE.length;
      setNewColor(CATEGORY_PALETTE[nextIndex].hex);
    } catch (err: unknown) {
      setNewRowError(
        err instanceof Error ? err.message : "Failed to create category",
      );
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleBatchStarters = async () => {
    setIsSubmittingNew(true);
    setError(null);
    try {
      const createdItems: CategoryItem[] = [];
      for (const starter of STARTER_CATEGORIES) {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(starter),
        });
        if (res.ok) {
          const item: CategoryItem = await res.json();
          createdItems.push(item);
        }
      }
      setCategories((prev) => [...prev, ...createdItems]);
    } catch {
      setError("Failed to create starter categories");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const fixedCount = categories.filter((c) => c.defaultType === "fixed").length;
  const variableCount = categories.length - fixedCount;

  return (
    <div className="space-y-6">
      {/* Overview Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-md">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Category Definitions
          </h2>
          <p className="text-xs text-muted-foreground">
            Classify transactions, chart distribution, and prefill fixed vs
            variable expenses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-foreground">
            {categories.length} total
          </span>
          <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-muted-foreground">
            {fixedCount} fixed
          </span>
          <span className="rounded-full border border-border/80 bg-secondary/60 px-3 py-1 font-medium text-muted-foreground">
            {variableCount} variable
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchCategories}
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
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded-xl border border-border/40 bg-muted/40"
              />
            ))}
          </div>
        ) : categories.length === 0 && !isAdding ? (
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
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No categories yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Categories group your spendings for budget tracking and dashboard
              charts.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
                + Add category
              </button>
              <button
                type="button"
                onClick={handleBatchStarters}
                disabled={isSubmittingNew}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/50 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {isSubmittingNew
                  ? "Creating..."
                  : "Start with common categories"}
              </button>
            </div>
          </div>
        ) : (
          /* List of Categories */
          <div className="space-y-2">
            <ul className="space-y-2">
              {categories.map((cat, idx) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  index={idx}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === idx}
                  isDropTarget={dropTargetIndex === idx}
                />
              ))}
            </ul>

            {/* Inline Add Category Form Row */}
            {isAdding ? (
              <div className="relative mt-3 flex items-center gap-3 rounded-xl border border-primary/40 bg-card p-3 shadow-sm ring-2 ring-primary/10 animate-in fade-in">
                <ColorPickerPopover
                  value={newColor}
                  onChange={(color) => setNewColor(color)}
                />

                <div className="relative min-w-0 flex-1">
                  <input
                    ref={newNameInputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (newRowError) setNewRowError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateCategory();
                      else if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewName("");
                      }
                    }}
                    placeholder="Enter category name..."
                    className="w-full rounded-md bg-transparent px-2 py-1 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                  {newRowError && (
                    <span className="absolute -bottom-4 left-2 text-[11px] font-medium text-destructive">
                      {newRowError}
                    </span>
                  )}
                </div>

                <div className="flex items-center rounded-lg border border-border/80 bg-secondary/50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewDefaultType("fixed")}
                    className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                      newDefaultType === "fixed"
                        ? "bg-foreground text-background shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDefaultType("variable")}
                    className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                      newDefaultType === "variable"
                        ? "bg-foreground text-background shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Variable
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isSubmittingNew}
                    onClick={handleCreateCategory}
                    className="flex h-8 items-center justify-center rounded-lg bg-foreground px-3 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingNew ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewName("");
                      setNewRowError(null);
                    }}
                    className="flex h-8 items-center justify-center rounded-lg border border-border/80 px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Pinned Add Category Trigger Button */}
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
                + Add category
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

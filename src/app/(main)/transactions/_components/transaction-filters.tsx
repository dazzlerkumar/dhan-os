"use client";

import { useEffect, useRef, useState } from "react";

interface CategoryOption {
  id: number;
  name: string;
  color: string | null;
}

interface PaymentMethodOption {
  id: number;
  name: string;
  kind: string;
}

interface TransactionFiltersProps {
  categories: CategoryOption[];
  paymentMethods: PaymentMethodOption[];
  selectedFlow: "all" | "income" | "expense";
  onSelectFlow: (flow: "all" | "income" | "expense") => void;
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  selectedMethod: number | null;
  onSelectMethod: (id: number | null) => void;
  selectedType: "all" | "fixed" | "variable";
  onSelectType: (type: "all" | "fixed" | "variable") => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export default function TransactionFilters({
  categories,
  paymentMethods,
  selectedFlow,
  onSelectFlow,
  selectedCategory,
  onSelectCategory,
  selectedMethod,
  onSelectMethod,
  selectedType,
  onSelectType,
  onResetFilters,
  activeFiltersCount,
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          activeFiltersCount > 0
            ? "border-primary bg-primary/10 text-primary font-semibold"
            : "border-border/80 bg-card text-foreground hover:bg-muted/60"
        }`}
        aria-expanded={isOpen}
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>Filter</span>
        {activeFiltersCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border/80 bg-popover p-4 text-popover-foreground shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Filter Transactions
            </span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-medium text-primary hover:underline"
              >
                Reset all
              </button>
            )}
          </div>

          <div className="mt-3.5 space-y-4">
            {/* Flow Filter */}
            <div>
              <span className="block text-xs font-medium text-foreground mb-1.5">
                Flow
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
                {(["all", "income", "expense"] as const).map((flow) => (
                  <button
                    key={flow}
                    type="button"
                    onClick={() => onSelectFlow(flow)}
                    className={`rounded-lg py-1 text-center text-xs font-medium capitalize transition-all ${
                      selectedFlow === flow
                        ? "bg-card text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {flow}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed vs Variable Filter */}
            <div>
              <span className="block text-xs font-medium text-foreground mb-1.5">
                Expense Type
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
                {(["all", "fixed", "variable"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onSelectType(type)}
                    className={`rounded-lg py-1 text-center text-xs font-medium capitalize transition-all ${
                      selectedType === type
                        ? "bg-card text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="filter-category-select"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Category
              </label>
              <select
                id="filter-category-select"
                value={selectedCategory ?? ""}
                onChange={(e) =>
                  onSelectCategory(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label
                htmlFor="filter-payment-method-select"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Payment Method
              </label>
              <select
                id="filter-payment-method-select"
                value={selectedMethod ?? ""}
                onChange={(e) =>
                  onSelectMethod(
                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                  )
                }
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Payment Methods</option>
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.kind.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

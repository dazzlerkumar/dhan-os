"use client";

import { useEffect, useRef, useState } from "react";
import { formatMonthDisplay, getCurrentMonth } from "@/lib/formatters";

interface MonthSelectorProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export default function MonthSelector({
  selectedMonth,
  onSelectMonth,
}: MonthSelectorProps) {
  const [months, setMonths] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentMonth = getCurrentMonth();

  useEffect(() => {
    async function loadMonths() {
      try {
        const res = await fetch("/api/transactions/months");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.months) && data.months.length > 0) {
            setMonths(data.months);
            return;
          }
        }
      } catch {
        // Fallback to current month if fetch fails
      }
      setMonths([currentMonth]);
    }
    loadMonths();
  }, [currentMonth]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isCurrent = selectedMonth === currentMonth;
  const label = isCurrent
    ? `This Month (${formatMonthDisplay(selectedMonth)})`
    : formatMonthDisplay(selectedMonth);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="h-3.5 w-3.5 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{label}</span>
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 max-h-60 w-56 overflow-y-auto rounded-xl border border-border/80 bg-popover p-1 text-popover-foreground shadow-lg backdrop-blur-md focus:outline-none">
          {months.map((m) => {
            const isSelected = m === selectedMonth;
            const isThisMonth = m === currentMonth;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onSelectMonth(m);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted/70"
                }`}
              >
                <span>{formatMonthDisplay(m)}</span>
                {isThisMonth && (
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

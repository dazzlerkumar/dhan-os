"use client";

import Link from "next/link";
import { Plus, Search, Settings2, X } from "lucide-react";
import pathsConfig from "@/app/config/route-paths";

interface CardsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: "all" | "active" | "inactive";
  onStatusFilterChange: (status: "all" | "active" | "inactive") => void;
  onOpenLogStatement: () => void;
}

export default function CardsHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenLogStatement,
}: CardsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Credit Cards
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track billing cycles, current open spend, statements, and rewards
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[180px] flex-1 sm:w-56 sm:flex-initial">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-border/80 bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="inline-flex items-center rounded-xl border border-border/80 bg-card p-0.5 shadow-2xs">
          {(["active", "all", "inactive"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-all ${
                statusFilter === filter
                  ? "bg-foreground text-background shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <Link
          href={pathsConfig.main.settings}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Settings</span>
        </Link>

        <button
          type="button"
          onClick={onOpenLogStatement}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Statement</span>
        </button>
      </div>
    </div>
  );
}

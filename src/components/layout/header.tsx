"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import pathsConfig from "@/app/config/route-paths";

const navigationItems = [
  { label: "Dashboard", href: pathsConfig.main.dashboard },
  { label: "Transactions", href: pathsConfig.main.transactions },
  { label: "Cards", href: pathsConfig.main.cards },
  { label: "Goals", href: pathsConfig.main.goals },
  { label: "Reports", href: pathsConfig.main.reports },
  { label: "Settings", href: pathsConfig.main.settings },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md max-w-screen-4xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href={pathsConfig.main.dashboard}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary via-primary/70 to-foreground shadow-sm">
              <span className="h-3 w-3 rounded-full bg-background" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Dhan OS
            </span>
          </Link>
        </div>

        <nav aria-label="Main Navigation" className="hidden md:flex">
          <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/90 p-1 shadow-sm">
            {navigationItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${isActive
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          <Link
            href={pathsConfig.main.notifications}
            aria-label="Notifications"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-secondary/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </Link>

          <div
            role="img"
            aria-label="User Avatar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-gradient-to-br from-primary/30 to-secondary text-xs font-semibold text-foreground"
          >
            D
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto px-4 py-2 border-t border-border/30 md:hidden">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/90 p-1">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all ${isActive
                  ? "bg-foreground text-background shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

"use client";

import type { ReactNode } from "react";
import Header from "@/components/layout/header";

export default function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}

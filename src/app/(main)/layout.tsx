"use client";

import { ReactNode } from "react";
export default function Layout({
    children,
}: Readonly<{ children: ReactNode }>) {
    return (
        <div>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                header
            </header>
            <div className="h-[calc(100vh-3rem)] min-w-0 overflow-x-hidden overflow-y-auto p-6">
                {children}
            </div>
        </div>
    );
}

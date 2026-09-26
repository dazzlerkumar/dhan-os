"use client";

import { useState } from "react";
import CategoriesManager from "./_components/categories-manager";
import PageWrapper from "@/components/layout/page-wrapper";

type SettingsTab = "categories" | "payment-methods";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("categories");

    return (
        <PageWrapper>
            {/* Tabs Navigation */}
            <div className="mb-6 flex items-center border-b border-border/80">
                <div className="inline-flex gap-4">
                    <button
                        type="button"
                        onClick={() => setActiveTab("categories")}
                        className={`relative pb-3 text-sm font-semibold transition-colors ${activeTab === "categories"
                            ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Categories
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("payment-methods")}
                        className={`relative flex items-center gap-1.5 pb-3 text-sm font-semibold transition-colors ${activeTab === "payment-methods"
                            ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <span>Payment Methods</span>
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Soon
                        </span>
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "categories" ? (
                <CategoriesManager />
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                        Payment methods configuration is coming soon.
                    </p>
                </div>
            )}
        </PageWrapper>

    );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import PageWrapper from "@/components/layout/page-wrapper";
import { getCurrentMonth } from "@/lib/formatters";
import type { TransactionSummary } from "@/types/transactions";
import TransactionMetrics from "./_components/transaction-metrics";
import TransactionsHeader from "./_components/transactions-header";

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

  const fetchSummary = useCallback(async (month: string) => {
    setIsSummaryLoading(true);
    try {
      const res = await fetch(`/api/transactions/summary?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Retain previous or null state on network error
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [selectedMonth, fetchSummary]);

  const handleOpenAddModal = () => {
    // Will be wired up in modal phase
  };

  const handleExport = async () => {
    // Will be wired up to export CSV
  };

  return (
    <PageWrapper className="space-y-6">
      <TransactionsHeader
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        onOpenAddModal={handleOpenAddModal}
        onExport={handleExport}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-8">
          <TransactionMetrics summary={summary} isLoading={isSummaryLoading} />
        </div>

        {/* Side Rail */}
        <div className="space-y-6 lg:col-span-4">
          {/* Will contain Expense Breakdown and Subscriptions */}
        </div>
      </div>
    </PageWrapper>
  );
}

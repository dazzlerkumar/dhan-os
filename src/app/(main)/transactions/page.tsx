"use client";

import { useState } from "react";
import PageWrapper from "@/components/layout/page-wrapper";
import { getCurrentMonth } from "@/lib/formatters";
import TransactionsHeader from "./_components/transactions-header";

export default function TransactionsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

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
    </PageWrapper>
  );
}

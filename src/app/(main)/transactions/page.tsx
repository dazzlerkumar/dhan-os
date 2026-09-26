"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/layout/page-wrapper";
import { getCurrentMonth } from "@/lib/formatters";
import type {
  PaginationMeta,
  TransactionItem,
  TransactionSummary,
} from "@/types/transactions";
import TransactionMetrics from "./_components/transaction-metrics";
import TransactionTable from "./_components/transaction-table";
import TransactionsHeader from "./_components/transactions-header";

interface CategoryItem {
  id: number;
  name: string;
  color: string | null;
}

interface PaymentMethodItem {
  id: number;
  name: string;
  kind: string;
}

function TransactionsContent() {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

  // Reference data
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);

  // Transactions list & pagination
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isTableLoading, setIsTableLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFlow, setSelectedFlow] = useState<
    "all" | "income" | "expense"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<
    "all" | "fixed" | "variable"
  >("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  // Load categories and payment methods
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, pmRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/payment-methods"),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
        if (pmRes.ok) {
          const pmData = await pmRes.json();
          setPaymentMethods(pmData);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadMeta();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedFlow !== "all") count++;
    if (selectedCategory !== null) count++;
    if (selectedMethod !== null) count++;
    if (selectedType !== "all") count++;
    return count;
  }, [selectedFlow, selectedCategory, selectedMethod, selectedType]);

  const resetFilters = useCallback(() => {
    setSelectedFlow("all");
    setSelectedCategory(null);
    setSelectedMethod(null);
    setSelectedType("all");
    setPage(1);
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async (month: string) => {
    setIsSummaryLoading(true);
    try {
      const res = await fetch(`/api/transactions/summary?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {
      // Retain previous state
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  // Fetch transactions table
  const fetchTransactions = useCallback(async () => {
    setIsTableLoading(true);
    const params = new URLSearchParams({
      month: selectedMonth,
      page: String(page),
      limit: String(limit),
    });

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedFlow !== "all") params.set("flow", selectedFlow);
    if (selectedCategory !== null)
      params.set("categoryId", String(selectedCategory));
    if (selectedMethod !== null)
      params.set("paymentMethodId", String(selectedMethod));
    if (selectedType === "fixed") params.set("isFixed", "true");
    if (selectedType === "variable") params.set("isFixed", "false");

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch {
      // Retain existing list on network issue
    } finally {
      setIsTableLoading(false);
    }
  }, [
    selectedMonth,
    page,
    limit,
    debouncedSearch,
    selectedFlow,
    selectedCategory,
    selectedMethod,
    selectedType,
  ]);

  // Sync on month or filter changes
  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [selectedMonth, fetchSummary]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setPage(1);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions();
        fetchSummary(selectedMonth);
      }
    } catch {
      // Handled silently
    }
  };

  const handleEditTransaction = (_tx: TransactionItem) => {
    // Will be wired up in modal phase
  };

  const handleOpenAddModal = () => {
    // Will be wired up in modal phase
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(
        `/api/transactions?month=${selectedMonth}&page=1&limit=1000`,
      );
      if (!res.ok) return;
      const json = await res.json();
      const rows: TransactionItem[] = json.data || [];

      const catMap = new Map(categories.map((c) => [c.id, c.name]));
      const pmMap = new Map(paymentMethods.map((m) => [m.id, m.name]));

      const csvRows = [
        [
          "Date",
          "Description",
          "Amount",
          "Flow",
          "Type",
          "Category",
          "Payment Method",
          "Note",
        ].join(","),
        ...rows.map((r) =>
          [
            `"${r.date}"`,
            `"${(r.description || "").replace(/"/g, '""')}"`,
            r.amount,
            r.flow,
            r.isFixed ? "Fixed" : "Variable",
            `"${(r.categoryId ? catMap.get(r.categoryId) || "" : "").replace(/"/g, '""')}"`,
            `"${(r.paymentMethodId ? pmMap.get(r.paymentMethodId) || "" : "").replace(/"/g, '""')}"`,
            `"${(r.note || "").replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `dhan-transactions-${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Export failure
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageWrapper className="space-y-6">
      <TransactionsHeader
        selectedMonth={selectedMonth}
        onSelectMonth={handleMonthChange}
        onOpenAddModal={handleOpenAddModal}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-8">
          <TransactionMetrics summary={summary} isLoading={isSummaryLoading} />

          <TransactionTable
            transactions={transactions}
            pagination={pagination}
            isLoading={isTableLoading}
            categories={categories}
            paymentMethods={paymentMethods}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedFlow={selectedFlow}
            onSelectFlow={(f) => {
              setSelectedFlow(f);
              setPage(1);
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={(c) => {
              setSelectedCategory(c);
              setPage(1);
            }}
            selectedMethod={selectedMethod}
            onSelectMethod={(m) => {
              setSelectedMethod(m);
              setPage(1);
            }}
            selectedType={selectedType}
            onSelectType={(t) => {
              setSelectedType(t);
              setPage(1);
            }}
            onResetFilters={resetFilters}
            activeFiltersCount={activeFiltersCount}
            page={page}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>

        {/* Side Rail */}
        <div className="space-y-6 lg:col-span-4">
          {/* Will contain Expense Breakdown and Subscriptions */}
        </div>
      </div>
    </PageWrapper>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="h-32 animate-pulse rounded-2xl bg-muted" />
                <div className="h-32 animate-pulse rounded-2xl bg-muted" />
                <div className="h-32 animate-pulse rounded-2xl bg-muted" />
              </div>
              <div className="h-96 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </PageWrapper>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}

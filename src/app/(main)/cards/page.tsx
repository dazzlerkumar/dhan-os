"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Settings2 } from "lucide-react";
import pathsConfig from "@/app/config/route-paths";
import PageWrapper from "@/components/layout/page-wrapper";
import type { CardListItem, CardStatementSummary } from "@/types/cards";
import type { PaginationMeta } from "@/types/transactions";
import CardsHeader from "./_components/cards-header";
import CardsMetrics from "./_components/cards-metrics";
import CardVisualCard from "./_components/card-visual-card";
import StatementHistoryTable from "./_components/statement-history-table";
import StatementDialog from "./_components/statement-dialog";
import ConfigureCardDialog from "./_components/configure-card-dialog";

const SKELETON_CARDS = ["skel-card-1", "skel-card-2", "skel-card-3"];
const SKELETON_FALLBACK = ["skel-fb-1", "skel-fb-2", "skel-fb-3", "skel-fb-4"];

function CardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<CardListItem[]>([]);
  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");

  // Statements for selected card
  const [statements, setStatements] = useState<CardStatementSummary[]>([]);
  const [isStatementsLoading, setIsStatementsLoading] = useState(false);
  const statementPage =
    Number.parseInt(searchParams?.get("page") ?? "1", 10) || 1;
  const statementLimit =
    Number.parseInt(searchParams?.get("limit") ?? "10", 10) || 10;
  const [statementPagination, setStatementPagination] =
    useState<PaginationMeta>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });

  // Dialogs
  const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
  const [dialogCard, setDialogCard] = useState<CardListItem | null>(null);
  const [editingStatement, setEditingStatement] =
    useState<CardStatementSummary | null>(null);

  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [configuringCard, setConfiguringCard] = useState<CardListItem | null>(
    null,
  );

  const fetchCards = useCallback(async () => {
    setIsCardsLoading(true);
    try {
      const res = await fetch("/api/cards?all=true");
      if (res.ok) {
        const data: CardListItem[] = await res.json();
        setCards(data);

        // Keep or set default selected card
        setSelectedCardId((prev) => {
          if (prev && data.some((c) => c.id === prev)) return prev;
          const firstActive = data.find((c) => c.active) || data[0];
          return firstActive ? firstActive.id : null;
        });
      }
    } catch {
      // Retain state
    } finally {
      setIsCardsLoading(false);
    }
  }, []);

  const fetchStatements = useCallback(
    async (cardId: number, page: number, limit: number) => {
      setIsStatementsLoading(true);
      try {
        const res = await fetch(
          `/api/cards/${cardId}/statements?page=${page}&limit=${limit}`,
        );
        if (res.ok) {
          const json = await res.json();
          setStatements(json.data || []);
          if (json.pagination) {
            setStatementPagination(json.pagination);
          }
        }
      } catch {
        // Retain state
      } finally {
        setIsStatementsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    if (selectedCardId) {
      fetchStatements(selectedCardId, statementPage, statementLimit);
    } else {
      setStatements([]);
      setStatementPagination({
        page: 1,
        limit: statementLimit,
        total: 0,
        totalPages: 1,
      });
    }
  }, [selectedCardId, statementPage, statementLimit, fetchStatements]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (statusFilter === "active" && !card.active) return false;
      if (statusFilter === "inactive" && card.active) return false;
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim();
        const matchesName = card.name.toLowerCase().includes(term);
        const matchesIssuer = (card.issuer || "").toLowerCase().includes(term);
        return matchesName || matchesIssuer;
      }
      return true;
    });
  }, [cards, statusFilter, searchQuery]);

  const selectedCard = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  const handleOpenLogStatement = (card?: CardListItem) => {
    setDialogCard(card || selectedCard || cards[0] || null);
    setEditingStatement(null);
    setIsStatementDialogOpen(true);
  };

  const handleEditStatement = (stmt: CardStatementSummary) => {
    setDialogCard(selectedCard);
    setEditingStatement(stmt);
    setIsStatementDialogOpen(true);
  };

  const handleDeleteStatement = async (stmt: CardStatementSummary) => {
    if (!selectedCard) return;
    if (
      !window.confirm(
        `Are you sure you want to delete the statement for ${stmt.cycleMonth}?`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/cards/${selectedCard.id}/statements/${stmt.cycleMonth}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        fetchCards();
        fetchStatements(selectedCard.id, statementPage, statementLimit);
      }
    } catch {
      // Handled silently
    }
  };

  const handleOpenConfigure = (card: CardListItem) => {
    setConfiguringCard(card);
    setIsConfigureDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchCards();
    if (selectedCardId) {
      fetchStatements(selectedCardId, statementPage, statementLimit);
    }
  };

  return (
    <PageWrapper className="space-y-6">
      <CardsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onOpenLogStatement={() => handleOpenLogStatement()}
      />

      <CardsMetrics cards={cards} isLoading={isCardsLoading} />

      {/* Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Your Cards ({filteredCards.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Select a card to view statement history
          </span>
        </div>

        {isCardsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKELETON_CARDS.map((key) => (
              <div
                key={key}
                className="h-64 animate-pulse rounded-2xl bg-card border border-border/70 p-5"
              />
            ))}
          </div>
        ) : filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCards.map((card) => (
              <CardVisualCard
                key={card.id}
                card={card}
                isSelected={card.id === selectedCardId}
                onSelect={() => {
                  setSelectedCardId(card.id);
                  const params = new URLSearchParams(
                    searchParams?.toString() ?? "",
                  );
                  params.set("page", "1");
                  router.push(`?${params.toString()}`);
                }}
                onLogStatement={handleOpenLogStatement}
                onConfigureCycle={handleOpenConfigure}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 bg-card p-10 text-center shadow-2xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              No credit cards found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery || statusFilter !== "active"
                ? "No cards match your filter criteria."
                : "No payment methods with kind 'credit' have been created yet."}
            </p>
            <Link
              href={pathsConfig.main.settings}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-95"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Configure in Settings</span>
            </Link>
          </div>
        )}
      </div>

      {/* Selected Card Statement History Table */}
      <StatementHistoryTable
        card={selectedCard}
        statements={statements}
        pagination={statementPagination}
        isLoading={isStatementsLoading}
        page={statementPage}
        limit={statementLimit}
        onEditStatement={handleEditStatement}
        onDeleteStatement={handleDeleteStatement}
        onLogStatement={() => handleOpenLogStatement(selectedCard || undefined)}
      />

      {/* Modals */}
      <StatementDialog
        isOpen={isStatementDialogOpen}
        onClose={() => {
          setIsStatementDialogOpen(false);
          setEditingStatement(null);
        }}
        cards={cards}
        initialCard={dialogCard}
        editingStatement={editingStatement}
        onSuccess={handleRefresh}
      />

      <ConfigureCardDialog
        isOpen={isConfigureDialogOpen}
        onClose={() => {
          setIsConfigureDialogOpen(false);
          setConfiguringCard(null);
        }}
        card={configuringCard}
        onSuccess={handleRefresh}
      />
    </PageWrapper>
  );
}

export default function CardsPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKELETON_FALLBACK.map((key) => (
              <div
                key={key}
                className="h-24 animate-pulse rounded-2xl bg-card border border-border/70"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-card border border-border/70" />
        </PageWrapper>
      }
    >
      <CardsContent />
    </Suspense>
  );
}

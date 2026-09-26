import type { PaginationMeta } from "./transactions";

export interface CardStatementSummary {
  id: number;
  cycleMonth: string;
  spend: string | null;
  generatedAmount: string | null;
  paidDate: string | null;
  rewards: string | null;
}

export interface CardListItem {
  id: number;
  name: string;
  issuer: string | null;
  active: boolean;
  color: string | null;
  statementDay: number | null;
  dueDay: number | null;
  cyclesConfigured: boolean;
  currentCycleSpend?: string;
  currentCycleWindow?: {
    start: string;
    end: string;
  };
  lastStatement: CardStatementSummary | null;
  pendingStatement: boolean;
}

export interface CardsListResponse {
  data: CardListItem[];
  pagination: PaginationMeta;
}

export interface CardDetailResponse {
  id: number;
  name: string;
  issuer: string | null;
  active: boolean;
  color: string | null;
  statementDay: number | null;
  dueDay: number | null;
  cyclesConfigured: boolean;
  statements: CardStatementSummary[];
  pagination: PaginationMeta;
}

export interface CardStatementsResponse {
  data: CardStatementSummary[];
  pagination: PaginationMeta;
}

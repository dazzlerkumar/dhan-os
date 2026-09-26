export interface TransactionItem {
  id: number;
  date: string;
  description: string;
  amount: string;
  flow: "income" | "expense" | "invest";
  isFixed: boolean;
  categoryId: number | null;
  paymentMethodId: number | null;
  recurringTemplateId: number | null;
  note: string | null;
  source: "web" | "shortcut";
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  data: TransactionItem[];
  pagination: PaginationMeta;
}

export interface TransactionSummary {
  income: string;
  fixedExpenses: string;
  variableExpenses: string;
  creditSpend: string;
  debitSpend: string;
  cashbacks: string;
  savings: string;
}

export interface CategoryBreakdownItem {
  categoryId: number | null;
  name: string;
  color: string | null;
  total: string;
}

export interface TransactionFilters {
  month: string;
  categoryId?: number | null;
  paymentMethodId?: number | null;
  flow?: "income" | "expense" | "invest" | "all";
  isFixed?: boolean | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface MonthsResponse {
  months: string[];
}

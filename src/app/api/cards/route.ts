import { NextResponse } from "next/server";
import { and, asc, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db";
import {
  creditCardStatements,
  paymentMethods,
  transactions,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { getCurrentCycleInfo } from "@/lib/cards";
import type { CardListItem, CardStatementSummary } from "@/types/cards";

export async function GET(request: Request) {
  let session: unknown;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const conditions = [eq(paymentMethods.kind, "credit")];

  const activeParam = searchParams.get("active");
  if (activeParam === "true" || activeParam === "false") {
    conditions.push(eq(paymentMethods.active, activeParam === "true"));
  }

  const searchParam = searchParams.get("search");
  if (searchParam?.trim()) {
    const term = `%${searchParam.trim()}%`;
    const searchFilter = or(
      ilike(paymentMethods.name, term),
      ilike(paymentMethods.issuer, term),
    );
    if (searchFilter) {
      conditions.push(searchFilter);
    }
  }

  const whereClause = and(...conditions);

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(paymentMethods)
    .where(whereClause);

  const total = Number(totalCount);

  const isAll =
    searchParams.get("all") === "true" ||
    searchParams.get("paginate") === "false";

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );
  const offset = (page - 1) * limit;

  const baseQuery = db
    .select()
    .from(paymentMethods)
    .where(whereClause)
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id));

  const cards = isAll
    ? await baseQuery
    : await baseQuery.limit(limit).offset(offset);

  const data: CardListItem[] = await Promise.all(
    cards.map(async (card) => {
      const cyclesConfigured =
        card.statementDay !== null && card.dueDay !== null;

      const [recentStatement] = await db
        .select({
          id: creditCardStatements.id,
          cycleMonth: creditCardStatements.cycleMonth,
          spend: creditCardStatements.spend,
          generatedAmount: creditCardStatements.generatedAmount,
          paidDate: creditCardStatements.paidDate,
          rewards: creditCardStatements.rewards,
        })
        .from(creditCardStatements)
        .where(eq(creditCardStatements.paymentMethodId, card.id))
        .orderBy(desc(creditCardStatements.cycleMonth))
        .limit(1);

      const lastStatement: CardStatementSummary | null = recentStatement
        ? {
            id: recentStatement.id,
            cycleMonth: recentStatement.cycleMonth,
            spend: recentStatement.spend,
            generatedAmount: recentStatement.generatedAmount,
            paidDate: recentStatement.paidDate,
            rewards: recentStatement.rewards,
          }
        : null;

      if (!cyclesConfigured || card.statementDay === null) {
        return {
          id: card.id,
          name: card.name,
          issuer: card.issuer,
          active: card.active,
          color: card.color,
          statementDay: card.statementDay,
          dueDay: card.dueDay,
          cyclesConfigured: false,
          lastStatement,
          pendingStatement: false,
        };
      }

      const cycleInfo = getCurrentCycleInfo(card.statementDay);

      const txSpendRows = await db
        .select({ amount: transactions.amount })
        .from(transactions)
        .where(
          and(
            eq(transactions.paymentMethodId, card.id),
            eq(transactions.flow, "expense"),
            gte(transactions.date, cycleInfo.currentCycleWindow.start),
            lte(transactions.date, cycleInfo.currentCycleWindow.end),
          ),
        );

      let spendSum = 0;
      for (const row of txSpendRows) {
        spendSum += Number(row.amount) || 0;
      }
      const currentCycleSpend = spendSum.toFixed(2);

      let pendingStatement = false;
      if (card.active) {
        const [statementForRecentCycle] = await db
          .select({ id: creditCardStatements.id })
          .from(creditCardStatements)
          .where(
            and(
              eq(creditCardStatements.paymentMethodId, card.id),
              eq(
                creditCardStatements.cycleMonth,
                cycleInfo.mostRecentCycleMonth,
              ),
            ),
          )
          .limit(1);

        pendingStatement = !statementForRecentCycle;
      }

      return {
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        active: card.active,
        color: card.color,
        statementDay: card.statementDay,
        dueDay: card.dueDay,
        cyclesConfigured: true,
        currentCycleSpend,
        currentCycleWindow: cycleInfo.currentCycleWindow,
        lastStatement,
        pendingStatement,
      };
    }),
  );

  if (isAll) {
    return NextResponse.json(data, { status: 200 });
  }

  return NextResponse.json(
    {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    { status: 200 },
  );
}

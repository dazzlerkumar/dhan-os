import { NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditCardStatements, paymentMethods } from "@/db/schema";
import { getSession } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  let session: unknown;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const cardId = Number.parseInt(id, 10);
  if (Number.isNaN(cardId) || cardId <= 0) {
    return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
  }

  const [card] = await db
    .select()
    .from(paymentMethods)
    .where(
      and(eq(paymentMethods.id, cardId), eq(paymentMethods.kind, "credit")),
    )
    .limit(1);

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
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

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(creditCardStatements)
    .where(eq(creditCardStatements.paymentMethodId, cardId));

  const total = Number(totalCount);

  const baseStmtQuery = db
    .select({
      id: creditCardStatements.id,
      cycleMonth: creditCardStatements.cycleMonth,
      spend: creditCardStatements.spend,
      generatedAmount: creditCardStatements.generatedAmount,
      paidDate: creditCardStatements.paidDate,
      rewards: creditCardStatements.rewards,
    })
    .from(creditCardStatements)
    .where(eq(creditCardStatements.paymentMethodId, cardId))
    .orderBy(desc(creditCardStatements.cycleMonth));

  const statements = isAll
    ? await baseStmtQuery
    : await baseStmtQuery.limit(limit).offset(offset);

  const cyclesConfigured = card.statementDay !== null && card.dueDay !== null;

  return NextResponse.json(
    {
      id: card.id,
      name: card.name,
      issuer: card.issuer,
      active: card.active,
      color: card.color,
      statementDay: card.statementDay,
      dueDay: card.dueDay,
      cyclesConfigured,
      statements,
      pagination: {
        page: isAll ? 1 : page,
        limit: isAll ? total : limit,
        total,
        totalPages: isAll ? 1 : Math.ceil(total / limit),
      },
    },
    { status: 200 },
  );
}

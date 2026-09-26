import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  creditCardStatements,
  paymentMethods,
  transactions,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { formatMonthNameYear, getCycleWindowForCycleMonth } from "@/lib/cards";
import { createStatementSchema } from "@/lib/validations/card";

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
    .select({ id: paymentMethods.id })
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

  const baseQuery = db
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
    ? await baseQuery
    : await baseQuery.limit(limit).offset(offset);

  if (isAll) {
    return NextResponse.json(statements, { status: 200 });
  }

  return NextResponse.json(
    {
      data: statements,
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

export async function POST(request: Request, context: RouteContext) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createStatementSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const data = parseResult.data;

  const [existing] = await db
    .select({ id: creditCardStatements.id })
    .from(creditCardStatements)
    .where(
      and(
        eq(creditCardStatements.paymentMethodId, cardId),
        eq(creditCardStatements.cycleMonth, data.cycleMonth),
      ),
    )
    .limit(1);

  if (existing) {
    const formattedMonth = formatMonthNameYear(data.cycleMonth);
    return NextResponse.json(
      {
        error: `A statement for ${formattedMonth} already exists on this card.`,
      },
      { status: 409 },
    );
  }

  let finalSpend: string;
  if (data.spend !== undefined) {
    finalSpend = data.spend;
  } else {
    if (card.statementDay === null) {
      return NextResponse.json(
        {
          error:
            "Card has no statementDay configured. Provide spend manually or configure statementDay first.",
        },
        { status: 400 },
      );
    }

    const window = getCycleWindowForCycleMonth(
      data.cycleMonth,
      card.statementDay,
    );

    const txRows = await db
      .select({ amount: transactions.amount })
      .from(transactions)
      .where(
        and(
          eq(transactions.paymentMethodId, cardId),
          eq(transactions.flow, "expense"),
          gte(transactions.date, window.start),
          lte(transactions.date, window.end),
        ),
      );

    let sum = 0;
    for (const row of txRows) {
      sum += Number(row.amount) || 0;
    }
    finalSpend = sum.toFixed(2);
  }

  try {
    const [newStatement] = await db
      .insert(creditCardStatements)
      .values({
        paymentMethodId: cardId,
        cycleMonth: data.cycleMonth,
        spend: finalSpend,
        generatedAmount: data.generatedAmount,
        paidDate: data.paidDate ?? null,
        rewards: data.rewards,
      })
      .returning();

    return NextResponse.json(newStatement, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      const formattedMonth = formatMonthNameYear(data.cycleMonth);
      return NextResponse.json(
        {
          error: `A statement for ${formattedMonth} already exists on this card.`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create statement" },
      { status: 500 },
    );
  }
}

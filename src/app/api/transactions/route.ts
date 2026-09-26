import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, ilike, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  paymentMethods,
  recurringTemplates,
  transactions,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  createTransactionSchema,
  parseMonthRange,
} from "@/lib/validations/transaction";

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
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json(
      { error: "Month parameter is required (format: YYYY-MM)" },
      { status: 400 },
    );
  }

  const range = parseMonthRange(month);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid month format. Expected YYYY-MM" },
      { status: 400 },
    );
  }

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );
  const offset = (page - 1) * limit;

  const conditions = [
    gte(transactions.date, range.startDate),
    lt(transactions.date, range.endDate),
  ];

  const categoryIdParam = searchParams.get("categoryId");
  if (categoryIdParam) {
    const categoryId = Number.parseInt(categoryIdParam, 10);
    if (!Number.isNaN(categoryId)) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }
  }

  const paymentMethodIdParam = searchParams.get("paymentMethodId");
  if (paymentMethodIdParam) {
    const paymentMethodId = Number.parseInt(paymentMethodIdParam, 10);
    if (!Number.isNaN(paymentMethodId)) {
      conditions.push(eq(transactions.paymentMethodId, paymentMethodId));
    }
  }

  const flowParam = searchParams.get("flow");
  if (
    flowParam === "income" ||
    flowParam === "expense" ||
    flowParam === "invest"
  ) {
    conditions.push(eq(transactions.flow, flowParam));
  }

  const isFixedParam = searchParams.get("isFixed");
  if (isFixedParam === "true" || isFixedParam === "false") {
    conditions.push(eq(transactions.isFixed, isFixedParam === "true"));
  }

  const searchParam = searchParams.get("search");
  if (searchParam && searchParam.trim()) {
    conditions.push(ilike(transactions.description, `%${searchParam.trim()}%`));
  }

  const whereClause = and(...conditions);

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(transactions)
    .where(whereClause);

  const total = Number(totalCount);

  const rows = await db
    .select()
    .from(transactions)
    .where(whereClause)
    .orderBy(desc(transactions.date), desc(transactions.id))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(
    {
      data: rows,
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

export async function POST(request: Request) {
  let session: unknown;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = createTransactionSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const data = parseResult.data;

  if (data.categoryId) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 400 },
      );
    }
  }

  if (data.paymentMethodId) {
    const [method] = await db
      .select({ id: paymentMethods.id })
      .from(paymentMethods)
      .where(eq(paymentMethods.id, data.paymentMethodId))
      .limit(1);

    if (!method) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 400 },
      );
    }
  }

  if (data.recurringTemplateId) {
    const [template] = await db
      .select({ id: recurringTemplates.id })
      .from(recurringTemplates)
      .where(eq(recurringTemplates.id, data.recurringTemplateId))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { error: "Recurring template not found" },
        { status: 400 },
      );
    }
  }

  try {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        date: data.date,
        description: data.description,
        amount: data.amount,
        flow: data.flow,
        isFixed: data.isFixed,
        categoryId: data.categoryId ?? null,
        paymentMethodId: data.paymentMethodId ?? null,
        recurringTemplateId: data.recurringTemplateId ?? null,
        note: data.note ?? null,
        source: data.source,
      })
      .returning();

    return NextResponse.json(newTransaction, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}

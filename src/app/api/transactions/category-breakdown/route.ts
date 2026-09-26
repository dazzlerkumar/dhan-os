import { NextResponse } from "next/server";
import { and, desc, eq, gte, lt, sum } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { parseMonthRange } from "@/lib/validations/transaction";

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

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      name: categories.name,
      color: categories.color,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.flow, "expense"),
        gte(transactions.date, range.startDate),
        lt(transactions.date, range.endDate),
      ),
    )
    .groupBy(transactions.categoryId, categories.name, categories.color)
    .orderBy(desc(sum(transactions.amount)));

  const result = rows.map((row) => ({
    categoryId: row.categoryId,
    name: row.name ?? "Uncategorized",
    color: row.color ?? null,
    total: Number(row.total || 0).toFixed(2),
  }));

  return NextResponse.json(result, { status: 200 });
}

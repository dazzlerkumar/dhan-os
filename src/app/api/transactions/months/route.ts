import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  let session: unknown;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .selectDistinct({
      month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
    })
    .from(transactions);

  const monthSet = new Set<string>();

  for (const row of rows) {
    if (row.month) {
      monthSet.add(row.month);
    }
  }

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  monthSet.add(currentMonth);

  const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

  return NextResponse.json({ months: sortedMonths }, { status: 200 });
}

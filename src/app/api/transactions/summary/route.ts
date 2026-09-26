import { NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  creditCardStatements,
  paymentMethods,
  transactions,
} from "@/db/schema";
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

  const txRows = await db
    .select({
      amount: transactions.amount,
      flow: transactions.flow,
      isFixed: transactions.isFixed,
      paymentKind: paymentMethods.kind,
    })
    .from(transactions)
    .leftJoin(
      paymentMethods,
      eq(transactions.paymentMethodId, paymentMethods.id),
    )
    .where(
      and(
        gte(transactions.date, range.startDate),
        lt(transactions.date, range.endDate),
      ),
    );

  let income = 0;
  let fixedExpenses = 0;
  let variableExpenses = 0;
  let creditSpend = 0;
  let debitSpend = 0;

  for (const row of txRows) {
    const amt = Number(row.amount) || 0;
    if (row.flow === "income") {
      income += amt;
    } else if (row.flow === "expense") {
      if (row.isFixed) {
        fixedExpenses += amt;
      } else {
        variableExpenses += amt;
      }

      if (row.paymentKind === "credit") {
        creditSpend += amt;
      } else {
        debitSpend += amt;
      }
    }
  }

  const statementRows = await db
    .select({
      rewards: creditCardStatements.rewards,
    })
    .from(creditCardStatements)
    .where(
      and(
        gte(creditCardStatements.cycleMonth, range.startDate),
        lt(creditCardStatements.cycleMonth, range.endDate),
      ),
    );

  let cashbacks = 0;
  for (const row of statementRows) {
    cashbacks += Number(row.rewards) || 0;
  }

  const savings = income - fixedExpenses - variableExpenses + cashbacks;

  return NextResponse.json(
    {
      income: income.toFixed(2),
      fixedExpenses: fixedExpenses.toFixed(2),
      variableExpenses: variableExpenses.toFixed(2),
      creditSpend: creditSpend.toFixed(2),
      debitSpend: debitSpend.toFixed(2),
      cashbacks: cashbacks.toFixed(2),
      savings: savings.toFixed(2),
    },
    { status: 200 },
  );
}

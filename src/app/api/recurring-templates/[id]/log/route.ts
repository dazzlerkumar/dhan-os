import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recurringTemplates, transactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { logRecurringTemplateSchema } from "@/lib/validations/transaction";

interface RouteContext {
  params: Promise<{ id: string }>;
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
  const templateId = Number.parseInt(id, 10);
  if (Number.isNaN(templateId) || templateId <= 0) {
    return NextResponse.json(
      { error: "Invalid recurring template ID" },
      { status: 400 },
    );
  }

  const [template] = await db
    .select()
    .from(recurringTemplates)
    .where(eq(recurringTemplates.id, templateId))
    .limit(1);

  if (!template) {
    return NextResponse.json(
      { error: "Recurring template not found" },
      { status: 404 },
    );
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = logRecurringTemplateSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const dateToUse = parseResult.data.date ?? todayStr;

  const rawAmount = parseResult.data.amount ?? template.amount;
  if (!rawAmount) {
    return NextResponse.json(
      { error: "amount must be greater than 0" },
      { status: 400 },
    );
  }

  const numericAmount = Number(rawAmount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return NextResponse.json(
      { error: "amount must be greater than 0" },
      { status: 400 },
    );
  }

  try {
    const [newTx] = await db
      .insert(transactions)
      .values({
        date: dateToUse,
        description: template.description,
        amount: numericAmount.toFixed(2),
        flow: "expense",
        isFixed: template.isFixed,
        categoryId: template.categoryId,
        paymentMethodId: template.paymentMethodId,
        recurringTemplateId: template.id,
        note: null,
        source: "web",
      })
      .returning();

    return NextResponse.json(newTx, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to log transaction from template" },
      { status: 500 },
    );
  }
}

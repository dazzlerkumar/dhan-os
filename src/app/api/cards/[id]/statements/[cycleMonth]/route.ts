import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditCardStatements, paymentMethods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { normalizeCycleMonth } from "@/lib/cards";
import { updateStatementSchema } from "@/lib/validations/card";

interface RouteContext {
  params: Promise<{ id: string; cycleMonth: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  let session: unknown;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, cycleMonth } = await context.params;
  const cardId = Number.parseInt(id, 10);
  if (Number.isNaN(cardId) || cardId <= 0) {
    return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
  }

  const normalizedMonth = normalizeCycleMonth(cycleMonth);
  if (!normalizedMonth) {
    return NextResponse.json(
      {
        error: "Invalid cycleMonth format. Expected YYYY-MM or YYYY-MM-01",
      },
      { status: 400 },
    );
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

  const [existing] = await db
    .select()
    .from(creditCardStatements)
    .where(
      and(
        eq(creditCardStatements.paymentMethodId, cardId),
        eq(creditCardStatements.cycleMonth, normalizedMonth),
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateStatementSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updateFields: {
    spend?: string;
    generatedAmount?: string;
    paidDate?: string | null;
    rewards?: string;
  } = {};

  if (parseResult.data.spend !== undefined) {
    updateFields.spend = parseResult.data.spend;
  }
  if (parseResult.data.generatedAmount !== undefined) {
    updateFields.generatedAmount = parseResult.data.generatedAmount;
  }
  if (parseResult.data.paidDate !== undefined) {
    updateFields.paidDate = parseResult.data.paidDate;
  }
  if (parseResult.data.rewards !== undefined) {
    updateFields.rewards = parseResult.data.rewards;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "At least one field is required for update" },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(creditCardStatements)
      .set(updateFields)
      .where(eq(creditCardStatements.id, existing.id))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update statement" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  let session: unknown;
  try {
    session = await getSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, cycleMonth } = await context.params;
  const cardId = Number.parseInt(id, 10);
  if (Number.isNaN(cardId) || cardId <= 0) {
    return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
  }

  const normalizedMonth = normalizeCycleMonth(cycleMonth);
  if (!normalizedMonth) {
    return NextResponse.json(
      {
        error: "Invalid cycleMonth format. Expected YYYY-MM or YYYY-MM-01",
      },
      { status: 400 },
    );
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

  const [existing] = await db
    .select({ id: creditCardStatements.id })
    .from(creditCardStatements)
    .where(
      and(
        eq(creditCardStatements.paymentMethodId, cardId),
        eq(creditCardStatements.cycleMonth, normalizedMonth),
      ),
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });
  }

  try {
    await db
      .delete(creditCardStatements)
      .where(eq(creditCardStatements.id, existing.id));

    return NextResponse.json(
      { message: "Statement deleted successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to delete statement" },
      { status: 500 },
    );
  }
}

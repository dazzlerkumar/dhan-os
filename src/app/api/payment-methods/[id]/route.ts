import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  creditCardStatements,
  paymentMethods,
  recurringTemplates,
  transactions,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { updatePaymentMethodSchema } from "@/lib/validations/payment-method";

interface RouteContext {
  params: Promise<{ id: string }>;
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

  const { id } = await context.params;
  const paymentMethodId = Number.parseInt(id, 10);
  if (Number.isNaN(paymentMethodId) || paymentMethodId <= 0) {
    return NextResponse.json(
      { error: "Invalid payment method ID" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updatePaymentMethodSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (Object.keys(parseResult.data).length === 0) {
    return NextResponse.json(
      { error: "At least one field is required for update" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(eq(paymentMethods.id, paymentMethodId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Payment method not found" },
      { status: 404 },
    );
  }

  try {
    const [updated] = await db
      .update(paymentMethods)
      .set(parseResult.data)
      .where(eq(paymentMethods.id, paymentMethodId))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update payment method" },
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

  const { id } = await context.params;
  const paymentMethodId = Number.parseInt(id, 10);
  if (Number.isNaN(paymentMethodId) || paymentMethodId <= 0) {
    return NextResponse.json(
      { error: "Invalid payment method ID" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(eq(paymentMethods.id, paymentMethodId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Payment method not found" },
      { status: 404 },
    );
  }

  const [referencingTx] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.paymentMethodId, paymentMethodId))
    .limit(1);

  if (referencingTx) {
    return NextResponse.json(
      {
        error:
          "Cannot delete payment method referenced by existing transactions",
      },
      { status: 409 },
    );
  }

  const [referencingStatement] = await db
    .select({ id: creditCardStatements.id })
    .from(creditCardStatements)
    .where(eq(creditCardStatements.paymentMethodId, paymentMethodId))
    .limit(1);

  if (referencingStatement) {
    return NextResponse.json(
      {
        error:
          "Cannot delete payment method referenced by credit card statements",
      },
      { status: 409 },
    );
  }

  const [referencingTemplate] = await db
    .select({ id: recurringTemplates.id })
    .from(recurringTemplates)
    .where(eq(recurringTemplates.paymentMethodId, paymentMethodId))
    .limit(1);

  if (referencingTemplate) {
    return NextResponse.json(
      {
        error: "Cannot delete payment method referenced by recurring templates",
      },
      { status: 409 },
    );
  }

  await db.delete(paymentMethods).where(eq(paymentMethods.id, paymentMethodId));

  return NextResponse.json(
    { message: "Payment method deleted successfully" },
    { status: 200 },
  );
}

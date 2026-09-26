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
  const methodId = Number.parseInt(id, 10);
  if (Number.isNaN(methodId) || methodId <= 0) {
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
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, methodId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Payment method not found" },
      { status: 404 },
    );
  }

  if (parseResult.data.kind && parseResult.data.kind !== existing.kind) {
    const [referencingTx] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.paymentMethodId, methodId))
      .limit(1);

    const [referencingStmt] = await db
      .select({ id: creditCardStatements.id })
      .from(creditCardStatements)
      .where(eq(creditCardStatements.paymentMethodId, methodId))
      .limit(1);

    if (referencingTx || referencingStmt) {
      return NextResponse.json(
        {
          error:
            "Can't change kind on a payment method with existing transactions.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const [updated] = await db
      .update(paymentMethods)
      .set(parseResult.data)
      .where(eq(paymentMethods.id, methodId))
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
  const methodId = Number.parseInt(id, 10);
  if (Number.isNaN(methodId) || methodId <= 0) {
    return NextResponse.json(
      { error: "Invalid payment method ID" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(eq(paymentMethods.id, methodId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Payment method not found" },
      { status: 404 },
    );
  }

  const referencingTxs = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.paymentMethodId, methodId));

  const referencingStmts = await db
    .select({ id: creditCardStatements.id })
    .from(creditCardStatements)
    .where(eq(creditCardStatements.paymentMethodId, methodId));

  const txCount = referencingTxs.length;
  const stmtCount = referencingStmts.length;

  if (txCount > 0 || stmtCount > 0) {
    let detail = "";
    if (txCount > 0 && stmtCount > 0) {
      detail = `${txCount} transaction${txCount > 1 ? "s" : ""} and ${stmtCount} statement${stmtCount > 1 ? "s" : ""}`;
    } else if (txCount > 0) {
      detail = `${txCount} transaction${txCount > 1 ? "s" : ""}`;
    } else {
      detail = `${stmtCount} statement${stmtCount > 1 ? "s" : ""}`;
    }

    return NextResponse.json(
      {
        error: `Cannot delete — ${detail} use this payment method.`,
        txCount,
        stmtCount,
      },
      { status: 409 },
    );
  }

  const referencingTemplates = await db
    .select({ id: recurringTemplates.id })
    .from(recurringTemplates)
    .where(eq(recurringTemplates.paymentMethodId, methodId));

  if (referencingTemplates.length > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${referencingTemplates.length} recurring template${referencingTemplates.length > 1 ? "s" : ""} use this payment method.`,
      },
      { status: 409 },
    );
  }

  await db.delete(paymentMethods).where(eq(paymentMethods.id, methodId));

  return NextResponse.json(
    { message: "Payment method deleted successfully" },
    { status: 200 },
  );
}

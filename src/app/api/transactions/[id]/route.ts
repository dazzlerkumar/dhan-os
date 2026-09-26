import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paymentMethods, transactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { updateTransactionSchema } from "@/lib/validations/transaction";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
  const transactionId = Number.parseInt(id, 10);
  if (Number.isNaN(transactionId) || transactionId <= 0) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 },
    );
  }

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(transaction, { status: 200 });
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
  const transactionId = Number.parseInt(id, 10);
  if (Number.isNaN(transactionId) || transactionId <= 0) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateTransactionSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  const data = parseResult.data;

  if (data.categoryId !== undefined && data.categoryId !== null) {
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

  if (data.paymentMethodId !== undefined && data.paymentMethodId !== null) {
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

  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.date !== undefined) updatePayload.date = data.date;
  if (data.description !== undefined)
    updatePayload.description = data.description;
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.flow !== undefined) updatePayload.flow = data.flow;
  if (data.isFixed !== undefined) updatePayload.isFixed = data.isFixed;
  if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
  if (data.paymentMethodId !== undefined) {
    updatePayload.paymentMethodId = data.paymentMethodId;
  }
  if (data.note !== undefined) updatePayload.note = data.note;

  try {
    const [updated] = await db
      .update(transactions)
      .set(updatePayload)
      .where(eq(transactions.id, transactionId))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update transaction" },
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
  const transactionId = Number.parseInt(id, 10);
  if (Number.isNaN(transactionId) || transactionId <= 0) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  await db.delete(transactions).where(eq(transactions.id, transactionId));

  return NextResponse.json(
    { message: "Transaction deleted successfully" },
    { status: 200 },
  );
}

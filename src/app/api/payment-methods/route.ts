import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createPaymentMethodSchema } from "@/lib/validations/payment-method";

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
  const activeOnly = searchParams.get("active") === "true";

  const query = db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id));

  const allMethods = activeOnly
    ? await query.where(eq(paymentMethods.active, true))
    : await query;

  return NextResponse.json(allMethods, { status: 200 });
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

  const parseResult = createPaymentMethodSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, issuer, kind, color, statementDay, dueDay } = parseResult.data;

  let sortOrder = parseResult.data.sortOrder;
  if (sortOrder === undefined) {
    const [maxRow] = await db
      .select({ maxOrder: paymentMethods.sortOrder })
      .from(paymentMethods)
      .orderBy(desc(paymentMethods.sortOrder))
      .limit(1);
    sortOrder = maxRow ? maxRow.maxOrder + 1 : 0;
  }

  try {
    const [newMethod] = await db
      .insert(paymentMethods)
      .values({
        name,
        issuer: issuer ?? null,
        kind,
        color: color ?? null,
        statementDay: statementDay ?? null,
        dueDay: dueDay ?? null,
        sortOrder,
        active: true,
      })
      .returning();

    return NextResponse.json(newMethod, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 },
    );
  }
}

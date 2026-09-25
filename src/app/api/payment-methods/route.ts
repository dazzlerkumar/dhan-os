import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createPaymentMethodSchema } from "@/lib/validations/payment-method";

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

  const allPaymentMethods = await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.name));

  return NextResponse.json(allPaymentMethods, { status: 200 });
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

  const { name, issuer, kind, color, statementDay, dueDay, active } =
    parseResult.data;

  try {
    const [newPaymentMethod] = await db
      .insert(paymentMethods)
      .values({
        name,
        issuer: issuer ?? null,
        kind,
        color: color ?? null,
        statementDay: statementDay ?? null,
        dueDay: dueDay ?? null,
        active: active ?? true,
      })
      .returning();

    return NextResponse.json(newPaymentMethod, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 },
    );
  }
}

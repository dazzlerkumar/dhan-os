import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { toggleActiveSchema } from "@/lib/validations/payment-method";

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

  let nextActive = !existing.active;

  try {
    const text = await request.text();
    if (text) {
      const body = JSON.parse(text);
      const parseResult = toggleActiveSchema.safeParse(body);
      if (parseResult.success && parseResult.data.active !== undefined) {
        nextActive = parseResult.data.active;
      }
    }
  } catch {
    // If empty or non-JSON body, toggle existing.active
  }

  try {
    const [updated] = await db
      .update(paymentMethods)
      .set({ active: nextActive })
      .where(eq(paymentMethods.id, methodId))
      .returning({ id: paymentMethods.id, active: paymentMethods.active });

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to toggle payment method active status" },
      { status: 500 },
    );
  }
}

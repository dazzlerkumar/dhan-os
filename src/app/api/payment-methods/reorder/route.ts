import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { reorderPaymentMethodsSchema } from "@/lib/validations/payment-method";

export async function PATCH(request: Request) {
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

  const parseResult = reorderPaymentMethodsSchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { order } = parseResult.data;

  const uniqueIds = Array.from(new Set(order));
  if (uniqueIds.length !== order.length) {
    return NextResponse.json(
      { error: "Order list contains duplicate IDs" },
      { status: 400 },
    );
  }

  const existingRows = await db
    .select({ id: paymentMethods.id })
    .from(paymentMethods)
    .where(inArray(paymentMethods.id, order));

  if (existingRows.length !== order.length) {
    return NextResponse.json(
      { error: "One or more payment method IDs do not exist" },
      { status: 400 },
    );
  }

  try {
    await Promise.all(
      order.map((id, index) =>
        db
          .update(paymentMethods)
          .set({ sortOrder: index })
          .where(eq(paymentMethods.id, id)),
      ),
    );

    return NextResponse.json({ updated: order.length }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to reorder payment methods" },
      { status: 500 },
    );
  }
}

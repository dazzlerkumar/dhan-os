import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { reorderCategoriesSchema } from "@/lib/validations/category";

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

  const parseResult = reorderCategoriesSchema.safeParse(body);
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
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.id, order));

  if (existingRows.length !== order.length) {
    return NextResponse.json(
      { error: "One or more category IDs do not exist" },
      { status: 400 },
    );
  }

  try {
    await Promise.all(
      order.map((id, index) =>
        db
          .update(categories)
          .set({ sortOrder: index })
          .where(eq(categories.id, id)),
      ),
    );

    return NextResponse.json({ updated: order.length }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 },
    );
  }
}

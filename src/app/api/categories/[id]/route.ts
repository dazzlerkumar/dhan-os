import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories, recurringTemplates, transactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { updateCategorySchema } from "@/lib/validations/category";

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
  const categoryId = Number.parseInt(id, 10);
  if (Number.isNaN(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = updateCategorySchema.safeParse(body);
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
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (parseResult.data.name && parseResult.data.name !== existing.name) {
    const [duplicate] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.name, parseResult.data.name),
          ne(categories.id, categoryId),
        ),
      )
      .limit(1);

    if (duplicate) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 },
      );
    }
  }

  try {
    const [updated] = await db
      .update(categories)
      .set(parseResult.data)
      .where(eq(categories.id, categoryId))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update category" },
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
  const categoryId = Number.parseInt(id, 10);
  if (Number.isNaN(categoryId) || categoryId <= 0) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const [referencingTx] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId))
    .limit(1);

  if (referencingTx) {
    return NextResponse.json(
      { error: "Cannot delete category referenced by existing transactions" },
      { status: 409 },
    );
  }

  const [referencingTemplate] = await db
    .select({ id: recurringTemplates.id })
    .from(recurringTemplates)
    .where(eq(recurringTemplates.categoryId, categoryId))
    .limit(1);

  if (referencingTemplate) {
    return NextResponse.json(
      { error: "Cannot delete category referenced by recurring templates" },
      { status: 409 },
    );
  }

  await db.delete(categories).where(eq(categories.id, categoryId));

  return NextResponse.json(
    { message: "Category deleted successfully" },
    { status: 200 },
  );
}

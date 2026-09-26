import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createCategorySchema } from "@/lib/validations/category";

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

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  return NextResponse.json(allCategories, { status: 200 });
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

  const parseResult = createCategorySchema.safeParse(body);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, defaultType, color } = parseResult.data;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: `A category named "${name}" already exists.` },
      { status: 409 },
    );
  }

  let sortOrder = parseResult.data.sortOrder;
  if (sortOrder === undefined) {
    const [maxRow] = await db
      .select({ maxOrder: categories.sortOrder })
      .from(categories)
      .orderBy(desc(categories.sortOrder))
      .limit(1);
    sortOrder = maxRow ? maxRow.maxOrder + 1 : 0;
  }

  try {
    const [newCategory] = await db
      .insert(categories)
      .values({
        name,
        defaultType,
        color: color ?? null,
        sortOrder,
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
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
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}

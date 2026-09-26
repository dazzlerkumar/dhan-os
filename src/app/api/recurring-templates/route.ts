import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paymentMethods, recurringTemplates } from "@/db/schema";
import { getSession } from "@/lib/auth";

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

  const templates = await db
    .select({
      id: recurringTemplates.id,
      description: recurringTemplates.description,
      amount: recurringTemplates.amount,
      categoryId: recurringTemplates.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      paymentMethodId: recurringTemplates.paymentMethodId,
      paymentMethodName: paymentMethods.name,
      isFixed: recurringTemplates.isFixed,
      dayOfMonth: recurringTemplates.dayOfMonth,
      active: recurringTemplates.active,
    })
    .from(recurringTemplates)
    .leftJoin(categories, eq(recurringTemplates.categoryId, categories.id))
    .leftJoin(
      paymentMethods,
      eq(recurringTemplates.paymentMethodId, paymentMethods.id),
    )
    .where(eq(recurringTemplates.active, true))
    .orderBy(asc(recurringTemplates.dayOfMonth), asc(recurringTemplates.id));

  return NextResponse.json(templates, { status: 200 });
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

  let body: {
    description?: string;
    amount?: number | string | null;
    categoryId?: number | null;
    paymentMethodId?: number | null;
    isFixed?: boolean;
    dayOfMonth?: number | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.description || !body.description.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 },
    );
  }

  try {
    const [template] = await db
      .insert(recurringTemplates)
      .values({
        description: body.description.trim(),
        amount: body.amount ? String(body.amount) : null,
        categoryId: body.categoryId ?? null,
        paymentMethodId: body.paymentMethodId ?? null,
        isFixed: body.isFixed ?? true,
        dayOfMonth: body.dayOfMonth ?? null,
        active: true,
      })
      .returning();

    return NextResponse.json(template, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create recurring template" },
      { status: 500 },
    );
  }
}

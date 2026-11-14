import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** GET /api/admin/categories */
export async function GET() {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, user.restaurantId))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return NextResponse.json({ categories: rows });
  });
}

/** POST /api/admin/categories — create a category. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await req.json().catch(() => null)) as {
      name?: string;
      sortOrder?: number;
    } | null;
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    const id = newId();
    await db.insert(categories).values({
      id,
      restaurantId: user.restaurantId,
      name: body.name.trim(),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}

/** PATCH /api/admin/categories/:id */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<Record<string, string>> },
) {
  const id = (await params).id;
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await request.json().catch(() => null)) as {
      name?: string;
      sortOrder?: number;
      isActive?: boolean;
    } | null;
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    const allowed: Record<string, unknown> = {};
    if (typeof body.name === "string") allowed.name = body.name.trim();
    if (typeof body.sortOrder === "number") allowed.sortOrder = body.sortOrder;
    if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
    if (Object.keys(allowed).length === 0)
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    await db
      .update(categories)
      .set(allowed)
      .where(eq(categories.id, id));
    return NextResponse.json({ ok: true });
  });
}

/** DELETE /api/admin/categories/:id */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<Record<string, string>> },
) {
  const id = (await params).id;
  return handle(async () => {
    await requireUser(["owner", "manager"]);
    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ ok: true });
  });
}
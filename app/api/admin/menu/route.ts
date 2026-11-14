import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodItems, optionGroups, options } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/menu/:id — partial update (name, price, veg flag, badges, image, category) */
export async function PATCH(request: Request, { params }: { params: Promise<Record<string, string>> }) {
  const id = (await params).id;
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // Build allowed fields: must belong to this restaurant
    const allowed: Record<string, unknown> = {};
    if (typeof body.name === "string") allowed.name = body.name.trim();
    if (typeof body.description === "string" || body.description === null) allowed.description = body.description;
    if (typeof body.price === "number") allowed.price = body.price;
    if (typeof body.imageId === "string" || body.imageId === null) allowed.imageId = body.imageId;
    if (typeof body.isVeg === "boolean") allowed.isVeg = body.isVeg;
    if (typeof body.isBestseller === "boolean") allowed.isBestseller = body.isBestseller;
    if (typeof body.isChefSpecial === "boolean") allowed.isChefSpecial = body.isChefSpecial;
    if (typeof body.isAvailable === "boolean") allowed.isAvailable = body.isAvailable;
    if (typeof body.categoryId === "string") allowed.categoryId = body.categoryId;
    if (typeof body.sortOrder === "number") allowed.sortOrder = body.sortOrder;
    if (Object.keys(allowed).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });
    allowed.updatedAt = new Date().toISOString();

    await db.update(foodItems).set(allowed).where(eq(foodItems.id, id));
    return NextResponse.json({ ok: true });
  });
}

/** PUT /api/admin/menu/:id/options — replace the full option groups set (delete + insert) */
export async function PUT(request: Request, { params }: { params: Promise<Record<string, string>> }) {
  const id = (await params).id;
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await request.json().catch(() => null)) as {
      optionGroups: Array<{
        id?: string;
        label: string;
        selectionType: "single" | "multi";
        isRequired: boolean;
        minSelect: number;
        maxSelect: number;
        options: { id?: string; label: string; priceDelta: number; isAvailable: boolean }[];
      }>;
    } | null;
    if (!body || !Array.isArray(body.optionGroups)) {
      return NextResponse.json({ error: "optionGroups array is required" }, { status: 400 });
    }

    // 1) Delete existing groups (cascade deletes options via foreign key)
    await db.delete(optionGroups).where(eq(optionGroups.foodItemId, id));

    // 2) Insert new groups + options in one pass
    for (const g of body.optionGroups) {
      const gid = g.id ?? newId();
      await db.insert(optionGroups).values({
        id: gid,
        foodItemId: id,
        label: g.label.trim(),
        selectionType: g.selectionType,
        isRequired: g.isRequired,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        sortOrder: 0,
      });
      for (const o of g.options) {
        await db.insert(options).values({
          id: o.id ?? newId(),
          groupId: gid,
          label: o.label.trim(),
          priceDelta: o.priceDelta,
          isAvailable: o.isAvailable,
          sortOrder: 0,
        });
      }
    }

    return NextResponse.json({ ok: true });
  });
}

/** DELETE /api/admin/menu/:id — remove a food item and its option graph */
export async function DELETE(request: Request, { params }: { params: Promise<Record<string, string>> }) {
  const id = (await params).id;
  return handle(async () => {
    await requireUser(["owner", "manager"]);
    await db.delete(foodItems).where(eq(foodItems.id, id));
    return NextResponse.json({ ok: true });
  });
}
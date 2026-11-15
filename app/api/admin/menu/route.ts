import { NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, foodItems, optionGroups, options } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/menu — full menu for the admin editor: categories,
 * food items with nested option groups, and images.
 */
export async function GET(_req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const cats = await db.select().from(categories).where(eq(categories.restaurantId, user.restaurantId));
    const items = await db
      .select()
      .from(foodItems)
      .where(eq(foodItems.restaurantId, user.restaurantId))
      .orderBy(asc(foodItems.sortOrder), asc(foodItems.name));
    const itemIds = items.map((i) => i.id);
    const groups = itemIds.length
      ? await db
          .select()
          .from(optionGroups)
          .where(inArray(optionGroups.foodItemId, itemIds))
          .orderBy(asc(optionGroups.sortOrder))
      : [];
    const groupIds = groups.map((g) => g.id);
    const opts = groupIds.length
      ? await db
          .select()
          .from(options)
          .where(inArray(options.groupId, groupIds))
          .orderBy(asc(options.sortOrder))
      : [];
    const optsByGroup = new Map<string, typeof opts>();
    for (const o of opts) {
      const list = optsByGroup.get(o.groupId) ?? [];
      list.push(o);
      optsByGroup.set(o.groupId, list);
    }
    return NextResponse.json({
      categories: cats.map((c) => ({ id: c.id, name: c.name })),
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        imageId: i.imageId,
        isVeg: i.isVeg,
        isBestseller: i.isBestseller,
        isChefSpecial: i.isChefSpecial,
        isAvailable: i.isAvailable,
        categoryId: i.categoryId,
        optionGroups: groups
          .filter((g) => g.foodItemId === i.id)
          .map((g) => ({
            id: g.id,
            label: g.label,
            selectionType: g.selectionType as "single" | "multi",
            isRequired: g.isRequired,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            options: (optsByGroup.get(g.id) ?? []).map((o) => ({
              id: o.id,
              label: o.label,
              priceDelta: o.priceDelta,
              isAvailable: o.isAvailable,
            })),
          })),
      })),
    });
  });
}

/** POST /api/admin/menu — create a food item (option groups saved separately). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await req.json().catch(() => null)) as {
      name?: string;
      description?: string | null;
      price?: number;
      imageId?: string | null;
      isVeg?: boolean;
      isBestseller?: boolean;
      isChefSpecial?: boolean;
      isAvailable?: boolean;
      categoryId?: string;
      sortOrder?: number;
      optionGroups?: unknown[];
    } | null;
    if (!body?.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!body.categoryId) return NextResponse.json({ error: "Category is required" }, { status: 400 });
    if (typeof body.price !== "number" || body.price < 0)
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    const id = newId();
    await db.insert(foodItems).values({
      id,
      restaurantId: user.restaurantId,
      categoryId: body.categoryId,
      name: body.name.trim(),
      description: body.description ?? null,
      price: body.price,
      imageId: body.imageId ?? null,
      isVeg: body.isVeg ?? true,
      isBestseller: body.isBestseller ?? false,
      isChefSpecial: body.isChefSpecial ?? false,
      isAvailable: body.isAvailable ?? true,
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ id }, { status: 201 });
  });
}

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
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { restaurants } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/admin/restaurant */
export async function GET() {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const rows = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, user.restaurantId))
      .limit(1);
    return NextResponse.json({ restaurant: rows[0] ?? null });
  });
}

/** PATCH /api/admin/restaurant — update restaurant details, tax/charge config. */
export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const allowed: Record<string, unknown> = {};
    if (typeof body.name === "string") allowed.name = body.name.trim();
    if (typeof body.tagline === "string" || body.tagline === null)
      allowed.tagline = body.tagline;
    if (typeof body.description === "string" || body.description === null)
      allowed.description = body.description;
    if (typeof body.phone === "string" || body.phone === null) allowed.phone = body.phone;
    if (typeof body.address === "string" || body.address === null)
      allowed.address = body.address;
    if (typeof body.currency === "string") allowed.currency = body.currency;
    if (typeof body.currencySymbol === "string")
      allowed.currencySymbol = body.currencySymbol;
    if (typeof body.logoImageId === "string" || body.logoImageId === null)
      allowed.logoImageId = body.logoImageId;
    if (typeof body.coverImageId === "string" || body.coverImageId === null)
      allowed.coverImageId = body.coverImageId;
    if (Array.isArray(body.taxConfig)) allowed.taxConfig = body.taxConfig;
    if (Array.isArray(body.chargeConfig)) allowed.chargeConfig = body.chargeConfig;
    if (typeof body.acceptOrders === "boolean") allowed.acceptOrders = body.acceptOrders;
    if (body.openingHours === null || typeof body.openingHours === "object")
      allowed.openingHours = body.openingHours;

    if (Object.keys(allowed).length === 0)
      return NextResponse.json({ error: "No changes" }, { status: 400 });
    allowed.updatedAt = new Date().toISOString();

    await db
      .update(restaurants)
      .set(allowed)
      .where(eq(restaurants.id, user.restaurantId));

    return NextResponse.json({ ok: true });
  });
}
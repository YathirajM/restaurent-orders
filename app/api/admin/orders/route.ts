import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/admin/orders?days=7 — order history with items. */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const url = new URL(req.url);
    const days = Math.min(Number(url.searchParams.get("days") ?? 7) || 7, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.restaurantId, user.restaurantId), gte(orders.createdAt, since)))
      .orderBy(desc(orders.createdAt))
      .limit(500);

    const ids = rows.map((r) => r.id);
    const items = ids.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
      : [];

    const byOrder = new Map<string, typeof items>();
    for (const it of items) {
      const list = byOrder.get(it.orderId) ?? [];
      list.push(it);
      byOrder.set(it.orderId, list);
    }

    return NextResponse.json({
      orders: rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })),
    });
  });
}
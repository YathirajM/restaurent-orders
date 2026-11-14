import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["placed", "accepted", "preparing", "ready"] as const;

/** GET /api/kitchen/orders — live board data for the KDS (auth required). */
export async function GET() {
  return handle(async () => {
    const user = await requireUser(["owner", "manager", "kitchen"]);

    const rows = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, user.restaurantId),
          inArray(orders.status, [...ACTIVE_STATUSES]),
        ),
      )
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const orderIds = rows.map((r) => r.id);
    const items = orderIds.length
      ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
      : [];

    const itemsByOrder = new Map<string, typeof items>();
    for (const it of items) {
      const list = itemsByOrder.get(it.orderId) ?? [];
      list.push(it);
      itemsByOrder.set(it.orderId, list);
    }

    return NextResponse.json({
      orders: rows.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        tableLabel: o.tableLabel,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        total: o.total,
        currency: o.currency,
        specialInstructions: o.specialInstructions,
        createdAt: o.createdAt,
        acceptedAt: o.acceptedAt,
        preparingAt: o.preparingAt,
        readyAt: o.readyAt,
        items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          selections: i.selections,
          quantity: i.quantity,
          notes: i.notes,
        })),
      })),
    });
  });
}

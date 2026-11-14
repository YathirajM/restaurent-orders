import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import {
  canTransition,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/order-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

/**
 * POST /api/kitchen/orders/:id/status
 * Body: { status } — transitions validated against the workflow graph.
 * Each transition stamps the corresponding timestamp column.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handle(async () => {
    const user = await requireUser(["owner", "manager", "kitchen"]);

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const next = parsed.data.status;

    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, user.restaurantId)))
      .limit(1);
    const order = rows[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const current = order.status as OrderStatus;
    if (!canTransition(current, next)) {
      return NextResponse.json(
        { error: `Cannot move an order from ${current} to ${next}` },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const stamps: Partial<typeof orders.$inferInsert> = {};
    if (next === "accepted") stamps.acceptedAt = now;
    if (next === "preparing") stamps.preparingAt = now;
    if (next === "ready") stamps.readyAt = now;
    if (next === "completed") stamps.completedAt = now;
    if (next === "cancelled") stamps.cancelledAt = now;

    await db
      .update(orders)
      .set({ status: next, ...stamps, updatedAt: now })
      .where(eq(orders.id, id));

    return NextResponse.json({ ok: true, status: next });
  });
}

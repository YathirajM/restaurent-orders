import { NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — today's dashboard numbers. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayIso = startOfDay.toISOString();

    const rows = await db
      .select({
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(and(eq(orders.restaurantId, user.restaurantId), gte(orders.createdAt, todayIso)));

    const paidRows = rows.filter((r) => r.paymentStatus === "paid");
    const todaySales = paidRows.reduce((s, r) => s + r.total, 0);
    const totalOrders = rows.length;
    const pending = rows.filter((r) =>
      ["placed", "accepted", "preparing"].includes(r.status),
    ).length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const avgOrder = paidRows.length ? todaySales / paidRows.length : 0;

    return NextResponse.json({
      todaySales: Math.round(todaySales * 100) / 100,
      totalOrders,
      pendingOrders: pending,
      completedOrders: completed,
      avgOrderValue: Math.round(avgOrder * 100) / 100,
    });
  });
}
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents } from "@/lib/db/schema";
import { getRazorpayConfig } from "@/lib/razorpay";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/simulate
 * Body: { orderId, outcome: "success" | "failure" }
 *
 * ONLY available when Razorpay keys are NOT configured (or
 * RAZORPAY_TEST_MODE=1). Marks the order paid/failed locally so the
 * complete pipeline (kitchen, tracking, admin) can be tested without
 * real credentials. Simulated payments are recorded with
 * paymentMethod='simulated' and a payment event noting simulation.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const cfg = getRazorpayConfig();
    const liveReady =
      cfg.keyId.startsWith("rzp_") && cfg.keySecret.length > 10 &&
      process.env.RAZORPAY_TEST_MODE !== "1";

    if (liveReady) {
      return NextResponse.json(
        { error: "Simulation is disabled when Razorpay is configured" },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      orderId?: string;
      outcome?: string;
    } | null;

    if (!body?.orderId || !body.outcome) {
      return NextResponse.json({ error: "orderId and outcome are required" }, { status: 400 });
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.id, body.orderId))
      .limit(1);
    const order = orderRows[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 });
    }

    if (body.outcome === "success") {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          paymentMethod: "simulated",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order.id));
      await db.insert(paymentEvents).values({
        id: newId(),
        orderId: order.id,
        eventType: "payment_captured",
        payload: { simulated: true, note: "Simulated payment (no gateway configured)" },
      });
      return NextResponse.json({ simulated: true, paymentStatus: "paid" });
    }

    await db
      .update(orders)
      .set({ paymentStatus: "failed", updatedAt: new Date().toISOString() })
      .where(eq(orders.id, order.id));
    await db.insert(paymentEvents).values({
      id: newId(),
      orderId: order.id,
      eventType: "payment_failed",
      payload: { simulated: true },
    });
    return NextResponse.json({ simulated: true, paymentStatus: "failed" });
  });
}

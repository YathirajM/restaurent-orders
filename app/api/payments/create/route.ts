import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents } from "@/lib/db/schema";
import {
  createRazorpayOrder,
  getRazorpayConfig,
  isRazorpayConfigured,
} from "@/lib/razorpay";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create
 * Body: { orderId }
 *
 * Creates a Razorpay order for the DB total (never the client's number)
 * and stores the razorpayOrderId on our order. Returns the checkout
 * payload the frontend needs.
 *
 * If Razorpay credentials are not configured, returns mode:"simulated"
 * so the local pipeline can be exercised end-to-end. Simulated payments
 * are marked paymentMethod='simulated' and clearly labelled in the UI.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json().catch(() => null)) as { orderId?: string } | null;
    if (!body?.orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
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

    const configured = isRazorpayConfigured();
    const cfg = getRazorpayConfig();

    if (!configured) {
      return NextResponse.json({
        mode: "simulated" as const,
        reason: "Razorpay keys not configured",
        amount: order.total,
        currency: order.currency,
      });
    }

    const amountInPaise = Math.round(order.total * 100);
    const rpOrder = await createRazorpayOrder({
      amountInPaise,
      receipt: order.orderNumber,
      currency: order.currency,
    });

    await db
      .update(orders)
      .set({ razorpayOrderId: rpOrder.id, updatedAt: new Date().toISOString() })
      .where(eq(orders.id, order.id));

    await db.insert(paymentEvents).values({
      id: newId(),
      orderId: order.id,
      eventType: "razorpay_order_created",
      payload: { razorpayOrderId: rpOrder.id, amountInPaise },
    });

    return NextResponse.json({
      mode: "razorpay" as const,
      keyId: cfg.keyId,
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      customerName: order.customerName,
      prefill: {
        name: order.customerName,
        contact: order.customerPhone ?? "",
      },
    });
  });
}

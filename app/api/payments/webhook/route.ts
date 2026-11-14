import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents } from "@/lib/db/schema";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/webhook — Razorpay server-to-server webhook.
 *
 * Configure in the Razorpay dashboard with event "payment.captured" and
 * the secret in RAZORPAY_WEBHOOK_SECRET. The raw body must be read as
 * text for signature verification — Next's req.json() would re-serialize.
 *
 * This is the source of truth if the customer's browser dies between
 * payment and the verify call.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(raw) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
          };
        };
      };
    };

    const payment = event.payload?.payment?.entity;
    if (!payment?.order_id) {
      return NextResponse.json({ received: true });
    }

    const orderRows = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayOrderId, payment.order_id))
      .limit(1);
    const order = orderRows[0];
    if (!order) {
      // Unknown order id — ack to prevent webhook retries.
      return NextResponse.json({ received: true });
    }

    await db.insert(paymentEvents).values({
      id: newId(),
      orderId: order.id,
      eventType: `webhook:${event.event ?? "unknown"}`,
      payload: { paymentId: payment.id, status: payment.status },
    });

    if (
      event.event === "payment.captured" &&
      payment.status === "captured" &&
      order.paymentStatus !== "paid"
    ) {
      await db
        .update(orders)
        .set({
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          razorpayPaymentId: payment.id ?? order.razorpayPaymentId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, order.id));
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] parse error:", err);
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
}

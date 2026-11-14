import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders, paymentEvents } from "@/lib/db/schema";
import {
  getRazorpayConfig,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/verify
 * Body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Verifies the checkout signature server-side. Only then is the order
 * marked paid. A duplicated verification is idempotent: if the same
 * payment id was already verified, we return success without double-marking.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json().catch(() => null)) as {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    } | null;

    if (
      !body?.orderId ||
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 },
      );
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

    // The razorpay_order_id must match the one we created for this order.
    if (order.razorpayOrderId && order.razorpayOrderId !== body.razorpay_order_id) {
      return NextResponse.json(
        { error: "Payment does not match this order" },
        { status: 400 },
      );
    }

    const valid = verifyPaymentSignature({
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!valid) {
      await db.insert(paymentEvents).values({
        id: newId(),
        orderId: order.id,
        eventType: "payment_verification_failed",
        payload: { razorpayPaymentId: body.razorpay_payment_id },
      });
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    // Idempotent update: if already paid with same payment id, no-op.
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ verified: true, alreadyVerified: true });
    }

    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        razorpayPaymentId: body.razorpay_payment_id,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    await db.insert(paymentEvents).values({
      id: newId(),
      orderId: order.id,
      eventType: "payment_captured",
      payload: {
        razorpayOrderId: body.razorpay_order_id,
        razorpayPaymentId: body.razorpay_payment_id,
      },
    });

    return NextResponse.json({ verified: true });
  });
}

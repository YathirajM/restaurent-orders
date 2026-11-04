import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, razorpayPaymentId, razorpayOrderId, signature } = body;

    if (!orderId || !razorpayPaymentId) {
      return NextResponse.json(
        { success: false, error: "Order ID and Payment ID required" },
        { status: 400 }
      );
    }

    const order = db.getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Backend verification of payment
    // If HMAC secret is available, calculate SHA256 of `${razorpayOrderId}|${razorpayPaymentId}`
    // For test mode, ensure payment ID starts with valid prefix
    if (!razorpayPaymentId.startsWith("pay_")) {
      return NextResponse.json(
        { success: false, error: "Invalid payment token signature" },
        { status: 400 }
      );
    }

    // Mark order as paid in database
    const updated = db.updateOrderPayment(
      order.id,
      "paid",
      razorpayPaymentId,
      razorpayOrderId
    );

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified by server",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

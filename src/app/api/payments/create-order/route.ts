import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID required" },
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

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_urban_plate_demo";
    const amountInPaise = Math.round(order.totalAmount * 100);

    // If Razorpay credentials are present in env, we could call Razorpay SDK
    // In demo / test sandbox mode:
    const razorpayOrderId = `order_rzp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    // Store razorpayOrderId on the order
    order.razorpayOrderId = razorpayOrderId;

    return NextResponse.json({
      success: true,
      data: {
        keyId,
        orderId: razorpayOrderId,
        amount: amountInPaise,
        currency: "INR",
        restaurantName: "The Urban Plate",
        description: `Order ${order.orderNumber} (Table ${order.tableNumber})`,
        prefill: {
          name: order.customerName,
          contact: order.customerPhone || "9876543210",
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { OrderStatus, PaymentStatus } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = db.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();

    if (body.status) {
      const updated = db.updateOrderStatus(
        orderId,
        body.status as OrderStatus,
        body.rejectionReason
      );
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }

    if (body.paymentStatus) {
      const updated = db.updateOrderPayment(
        orderId,
        body.paymentStatus as PaymentStatus,
        body.paymentId,
        body.razorpayOrderId
      );
      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: "No valid update fields provided" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, razorpayOrderId } = body;

    // In production, verify the payment signature with Razorpay
    // For demo, we just mark the order as paid
    const order = store.updateOrder(orderId, {
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
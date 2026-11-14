import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    const order = store.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // In production, this would create a Razorpay order
    // For demo, we return a mock order
    const razorpayOrder = {
      id: `razorpay_${Date.now()}`,
      orderId: order.id,
      amount: Math.round(order.totalAmount * 100), // Razorpay uses paise
      currency: 'INR',
      status: 'created',
    };

    return NextResponse.json({ success: true, data: razorpayOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
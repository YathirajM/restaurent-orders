import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import type { Order } from '@/lib/types';

export async function GET() {
  try {
    const orders = store.getOrders().map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      tableNumber: o.tableNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      customerName: o.customerName,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, customerName, customerPhone, items, paymentMethod, specialInstructions } = body;

    // Validate required fields
    if (!tableNumber || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create order
    const order = store.createOrder({
      tableNumber,
      customerName: customerName || 'Guest',
      customerPhone,
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        addonIds: item.addonIds || [],
        spiceLevel: item.spiceLevel || 0,
        specialInstructions: item.specialInstructions,
      })),
      paymentMethod: paymentMethod || 'pay_at_counter',
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
      specialInstructions,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
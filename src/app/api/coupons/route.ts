import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const coupons = store.getAllCoupons().map(c => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderValue: c.minOrderValue,
      maxDiscountAmount: c.maxDiscountAmount,
      isActive: c.isActive,
      expiryDate: c.expiryDate,
    }));

    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;
    const coupon = store.getCoupon(code);

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired coupon code' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
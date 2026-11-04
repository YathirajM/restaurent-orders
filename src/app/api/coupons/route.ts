import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  try {
    const coupons = db.getCoupons();
    return NextResponse.json({ success: true, data: coupons });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json(
        { success: false, error: "Coupon code and subtotal are required" },
        { status: 400 }
      );
    }

    const result = db.validateCoupon(code, subtotal);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: result.coupon,
        discount: result.discount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get("table");
    const status = searchParams.get("status");

    let orders = db.getOrders();

    if (tableNumber) {
      orders = orders.filter((o) => o.tableNumber === tableNumber);
    }

    if (status && status !== "all") {
      orders = orders.filter((o) => o.status === status);
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.tableNumber || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Table number and ordered items are required" },
        { status: 400 }
      );
    }

    const order = db.createOrder({
      tableNumber: body.tableNumber,
      customerName: body.customerName || "Dine-in Guest",
      customerPhone: body.customerPhone,
      items: body.items,
      couponCode: body.couponCode,
      paymentMethod: body.paymentMethod || "pay_at_counter",
      specialInstructions: body.specialInstructions,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create order" },
      { status: 400 }
    );
  }
}

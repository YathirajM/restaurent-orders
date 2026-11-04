import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "simulate-order") {
      // Create a realistic sample incoming live order for Table 03
      const sampleDishes = [
        { productId: "prod_butter_chicken", quantity: 1 },
        { productId: "prod_cold_coffee", quantity: 2 },
        { productId: "prod_bruschetta", quantity: 1 },
      ];

      const newOrder = db.createOrder({
        tableNumber: "03",
        customerName: "Vikram Malhotra",
        customerPhone: "9811223344",
        items: sampleDishes,
        paymentMethod: "pay_at_counter",
        specialInstructions: "Make coffee less sweet please",
      });

      return NextResponse.json({
        success: true,
        message: "Live order simulated successfully",
        data: newOrder,
      });
    }

    // Default: Reset entire database to pristine demo state
    db.resetToDemo();
    return NextResponse.json({
      success: true,
      message: "Database successfully reset to demo state",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

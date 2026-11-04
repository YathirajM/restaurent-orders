import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  try {
    const restaurant = db.getRestaurant();
    return NextResponse.json({ success: true, data: restaurant });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = db.updateRestaurant(body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

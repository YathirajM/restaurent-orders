import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  try {
    const analytics = db.getAnalytics();
    return NextResponse.json({ success: true, data: analytics });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

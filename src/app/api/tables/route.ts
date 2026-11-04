import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  try {
    const tables = db.getTables();
    return NextResponse.json({ success: true, data: tables });
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
    if (!body.tableNumber) {
      return NextResponse.json(
        { success: false, error: "tableNumber is required" },
        { status: 400 }
      );
    }
    const table = db.createTable(body.tableNumber, body.capacity || 4);
    return NextResponse.json({ success: true, data: table }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

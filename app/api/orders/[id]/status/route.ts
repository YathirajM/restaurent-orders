import { NextResponse } from "next/server";
import { getOrderStatus } from "@/lib/order-service";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/orders/:id/status — polling endpoint for live tracking. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handle(async () => {
    const status = await getOrderStatus(id);
    if (!status) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(status);
  });
}

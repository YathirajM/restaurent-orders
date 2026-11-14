import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validation";
import { placeOrder } from "@/lib/order-service";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders — place an order from the customer site.
 * Body validated with zod; prices recomputed server-side.
 */
export async function POST(req: Request) {
  return handle(async () => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Please check the entered details";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const result = await placeOrder(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(
      {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
      },
      { status: 201 },
    );
  });
}

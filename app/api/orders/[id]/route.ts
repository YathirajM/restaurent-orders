import { NextResponse } from "next/server";
import { getOrderFull, getOrderStatus } from "@/lib/order-service";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:id — public order details for the confirmation/tracking
 * page. Returns only non-sensitive fields (no payment internals).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return handle(async () => {
    const full = await getOrderFull(id);
    if (!full) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const { order, items, restaurant } = full;
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.customerName,
        tableLabel: order.tableLabel,
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        chargeTotal: order.chargeTotal,
        total: order.total,
        currency: order.currency,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt,
        readyAt: order.readyAt,
        razorpayOrderId: order.razorpayOrderId,
      },
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        selections: i.selections,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
        notes: i.notes,
      })),
      restaurant: restaurant
        ? {
            name: restaurant.name,
            currencySymbol: restaurant.currencySymbol,
            phone: restaurant.phone,
            address: restaurant.address,
          }
        : null,
    });
  });
}

/** Lightweight status poll for the tracking page. */
export async function HEAD(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const status = await getOrderStatus(id);
  return new NextResponse(null, {
    status: status ? 200 : 404,
    headers: {
      "X-Order-Status": status?.status ?? "",
      "X-Payment-Status": status?.paymentStatus ?? "",
    },
  });
}

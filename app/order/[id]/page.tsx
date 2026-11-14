import { notFound } from "next/navigation";
import { getOrderFull } from "@/lib/order-service";
import { OrderTracking } from "./tracking";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const full = await getOrderFull(id);
  if (!full) notFound();

  const { order, items, restaurant } = full;

  return (
    <OrderTracking
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        tableLabel: order.tableLabel,
        subtotal: order.subtotal,
        taxTotal: order.taxTotal,
        chargeTotal: order.chargeTotal,
        total: order.total,
        currency: order.currency,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt,
        razorpayOrderId: order.razorpayOrderId,
      }}
      items={items.map((i) => ({
        id: i.id,
        name: i.name,
        selections: i.selections,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
        notes: i.notes,
      }))}
      restaurantName={restaurant?.name ?? ""}
      currencySymbol={restaurant?.currencySymbol ?? "₹"}
    />
  );
}

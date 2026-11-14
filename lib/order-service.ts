import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  categories,
  diningTables,
  foodItems,
  optionGroups,
  options,
  orders,
  orderItems,
  paymentEvents,
  restaurants,
  type ChargeLine,
  type OrderItemSelection,
  type TaxLine,
} from "./db/schema";
import { computeTotals } from "./money";
import { newId, newOrderNumber } from "./ids";
import type { CreateOrderInput } from "./validation";

/**
 * Order placement — the most security-critical path in the app.
 *
 * Guarantees:
 *  - Prices/availability come from the DB, never the client.
 *  - Option rules (required, min/max) enforced server-side.
 *  - Idempotency: one order per idempotencyKey (unique index + pre-check).
 *  - Table token must resolve to an active table of the restaurant.
 *  - Availability: restaurant.acceptOrders, item.isAvailable, option.isAvailable.
 */

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: string; total: number }
  | { ok: false; error: string; status: number };

export async function placeOrder(
  input: CreateOrderInput,
): Promise<PlaceOrderResult> {
  // 1. Resolve table → restaurant.
  const tableRows = await db
    .select()
    .from(diningTables)
    .where(eq(diningTables.qrToken, input.tableToken))
    .limit(1);
  const table = tableRows[0];
  if (!table || !table.isActive) {
    return { ok: false, error: "Invalid or expired table code", status: 400 };
  }

  const restaurantRows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, table.restaurantId))
    .limit(1);
  const restaurant = restaurantRows[0];
  if (!restaurant) {
    return { ok: false, error: "Restaurant not found", status: 400 };
  }
  if (!restaurant.acceptOrders) {
    return {
      ok: false,
      error: "The restaurant is not accepting orders right now",
      status: 503,
    };
  }

  // 2. Idempotency pre-check (unique index is the real guard).
  const existing = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total })
    .from(orders)
    .where(eq(orders.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing[0]) {
    return {
      ok: true,
      orderId: existing[0].id,
      orderNumber: existing[0].orderNumber,
      total: existing[0].total,
    };
  }

  // 3. Load all referenced food items + their option groups in bulk.
  const foodIds = [...new Set(input.items.map((i) => i.foodItemId))];
  const foodRows = await db
    .select()
    .from(foodItems)
    .where(
      and(
        inArray(foodItems.id, foodIds),
        eq(foodItems.restaurantId, restaurant.id),
      ),
    );
  const foodById = new Map(foodRows.map((f) => [f.id, f]));

  const groupRows = await db
    .select()
    .from(optionGroups)
    .where(inArray(optionGroups.foodItemId, foodIds));
  const groupsByFood = new Map<string, typeof groupRows>();
  for (const g of groupRows) {
    const list = groupsByFood.get(g.foodItemId) ?? [];
    list.push(g);
    groupsByFood.set(g.foodItemId, list);
  }

  const allGroupIds = groupRows.map((g) => g.id);
  const optionRows = allGroupIds.length
    ? await db.select().from(options).where(inArray(options.groupId, allGroupIds))
    : [];
  const optionsById = new Map(optionRows.map((o) => [o.id, o]));
  const optionsByGroup = new Map<string, typeof optionRows>();
  for (const o of optionRows) {
    const list = optionsByGroup.get(o.groupId) ?? [];
    list.push(o);
    optionsByGroup.set(o.groupId, list);
  }

  // 4. Validate + price each cart line server-side.
  const orderedLines: {
    foodItemId: string;
    name: string;
    selections: OrderItemSelection[];
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    notes?: string;
  }[] = [];

  for (const line of input.items) {
    const food = foodById.get(line.foodItemId);
    if (!food) {
      return { ok: false, error: `Item not found: ${line.foodItemId}`, status: 400 };
    }
    if (!food.isAvailable) {
      return { ok: false, error: `${food.name} is currently unavailable`, status: 409 };
    }

    const groups = groupsByFood.get(food.id) ?? [];

    // Group the client's option ids by their parent group.
    const selectedByGroup = new Map<string, string[]>();
    for (const optId of line.optionIds) {
      const opt = optionsById.get(optId);
      if (!opt) {
        return { ok: false, error: "Invalid option selected", status: 400 };
      }
      if (!opt.isAvailable) {
        return { ok: false, error: `${opt.label} is currently unavailable`, status: 409 };
      }
      // The option must belong to a group of THIS food item.
      const parent = groupRows.find((g) => g.id === opt.groupId);
      if (!parent || parent.foodItemId !== food.id) {
        return { ok: false, error: "Invalid option for this item", status: 400 };
      }
      const list = selectedByGroup.get(opt.groupId) ?? [];
      list.push(opt.id);
      selectedByGroup.set(opt.groupId, list);
    }

    // Enforce per-group rules.
    for (const g of groups) {
      const count = selectedByGroup.get(g.id)?.length ?? 0;
      if (g.isRequired && count === 0) {
        return { ok: false, error: `Please choose ${g.label.toLowerCase()}`, status: 400 };
      }
      if (count < g.minSelect) {
        return {
          ok: false,
          error: `Select at least ${g.minSelect} in ${g.label}`,
          status: 400,
        };
      }
      if (g.selectionType === "single" && count > 1) {
        return { ok: false, error: `Choose only one ${g.label.toLowerCase()}`, status: 400 };
      }
      if (g.maxSelect && count > g.maxSelect) {
        return {
          ok: false,
          error: `Choose at most ${g.maxSelect} in ${g.label}`,
          status: 400,
        };
      }
    }

    let unitPrice = food.price;
    const selections: OrderItemSelection[] = [];
    for (const g of groups) {
      const ids = selectedByGroup.get(g.id) ?? [];
      for (const id of ids) {
        const opt = optionsById.get(id)!;
        unitPrice += opt.priceDelta;
        selections.push({
          groupLabel: g.label,
          optionLabel: opt.label,
          priceDelta: opt.priceDelta,
        });
      }
    }
    unitPrice = Math.round(unitPrice * 100) / 100;

    orderedLines.push({
      foodItemId: food.id,
      name: food.name,
      selections,
      unitPrice,
      quantity: line.quantity,
      lineTotal: Math.round(unitPrice * line.quantity * 100) / 100,
      notes: line.notes || undefined,
    });
  }

  if (orderedLines.length === 0) {
    return { ok: false, error: "Cart is empty", status: 400 };
  }

  // 5. Totals from restaurant tax/charge config.
  const subtotal = orderedLines.reduce((s, l) => s + l.lineTotal, 0);
  const taxes = (restaurant.taxConfig ?? []) as TaxLine[];
  const charges = (restaurant.chargeConfig ?? []) as ChargeLine[];
  const breakdown = computeTotals(subtotal, taxes, charges);

  // 6. Insert order + items + payment event in one logical unit.
  const orderId = newId();
  const orderNumber = newOrderNumber();

  await db.insert(orders).values({
    id: orderId,
    orderNumber,
    restaurantId: restaurant.id,
    tableId: table.id,
    tableLabel: table.label,
    customerName: input.customerName,
    customerPhone: input.customerPhone || null,
    status: "placed",
    paymentStatus: "pending",
    subtotal: breakdown.subtotal,
    taxTotal: breakdown.taxTotal,
    chargeTotal: breakdown.chargeTotal,
    total: breakdown.total,
    currency: restaurant.currency,
    specialInstructions: input.specialInstructions || null,
    idempotencyKey: input.idempotencyKey,
  });

  await db.insert(orderItems).values(
    orderedLines.map((l) => ({
      id: newId(),
      orderId,
      foodItemId: l.foodItemId,
      name: l.name,
      selections: l.selections,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
      notes: l.notes ?? null,
    })),
  );

  await db.insert(paymentEvents).values({
    id: newId(),
    orderId,
    eventType: "order_created",
    payload: { total: breakdown.total, currency: restaurant.currency },
  });

  return {
    ok: true,
    orderId,
    orderNumber,
    total: breakdown.total,
  };
}

/** Fetches a full order (items + restaurant) for confirmation/tracking pages. */
export async function getOrderFull(orderId: string) {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = orderRows[0];
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const restaurantRows = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      currencySymbol: restaurants.currencySymbol,
      phone: restaurants.phone,
      address: restaurants.address,
    })
    .from(restaurants)
    .where(eq(restaurants.id, order.restaurantId))
    .limit(1);

  return { order, items, restaurant: restaurantRows[0] ?? null };
}

export async function getOrderByRazorpayOrderId(rpOrderId: string) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.razorpayOrderId, rpOrderId))
    .limit(1);
  return rows[0] ?? null;
}

/** Public status projection for polling clients. */
export async function getOrderStatus(orderId: string) {
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      orderNumber: orders.orderNumber,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return rows[0] ?? null;
}

export const ORDER_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Order Placed",
  accepted: "Accepted by Kitchen",
  preparing: "Preparing",
  ready: "Ready for Collection",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Valid kitchen workflow transitions. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

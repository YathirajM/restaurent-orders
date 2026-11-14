import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ */
/* Shared column helpers                                               */
/* ------------------------------------------------------------------ */

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);

const updatedAt = () =>
  text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);

/* ------------------------------------------------------------------ */
/* Restaurant + auth                                                   */
/* ------------------------------------------------------------------ */

export const restaurants = sqliteTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  logoImageId: text("logo_image_id"),
  coverImageId: text("cover_image_id"),
  phone: text("phone"),
  address: text("address"),
  // JSON: { open: "09:00", close: "23:00", days: [0..6] } or null = always open
  openingHours: text("opening_hours", { mode: "json" }).$type<{
    open: string;
    close: string;
    days: number[];
  } | null>(),
  currency: text("currency").notNull().default("INR"),
  currencySymbol: text("currency_symbol").notNull().default("₹"),
  // JSON: [{ id, label, rate (percent), isInclusiveOfMenuPrice }]
  taxConfig: text("tax_config", { mode: "json" })
    .notNull()
    .default(sql`'[]'`)
    .$type<TaxLine[]>(),
  // Flat charges, e.g. packaging — JSON: [{ id, label, amount (flat, currency units) }]
  chargeConfig: text("charge_config", { mode: "json" })
    .notNull()
    .default(sql`'[]'`)
    .$type<ChargeLine[]>(),
  acceptOrders: integer("accept_orders", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    // 'owner' | 'manager' | 'kitchen'
    role: text("role").notNull().default("owner"),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("admin_users_email_idx").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id),
    expiresAt: text("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("categories_restaurant_idx").on(t.restaurantId, t.sortOrder)],
);

export const foodItems = sqliteTable(
  "food_items",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    description: text("description"),
    price: real("price").notNull(),
    imageId: text("image_id"),
    isVeg: integer("is_veg", { mode: "boolean" }).notNull().default(true),
    isBestseller: integer("is_bestseller", { mode: "boolean" })
      .notNull()
      .default(false),
    isChefSpecial: integer("is_chef_special", { mode: "boolean" })
      .notNull()
      .default(false),
    isAvailable: integer("is_available", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("food_items_restaurant_idx").on(t.restaurantId, t.categoryId),
    index("food_items_category_idx").on(t.categoryId, t.sortOrder),
  ],
);

/** Option groups: size / variant / add-on groups attached to a food item. */
export const optionGroups = sqliteTable(
  "option_groups",
  {
    id: text("id").primaryKey(),
    foodItemId: text("food_item_id")
      .notNull()
      .references(() => foodItems.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // e.g. "Size", "Extras"
    // 'single' (radio) | 'multi' (checkbox)
    selectionType: text("selection_type").notNull().default("single"),
    isRequired: integer("is_required", { mode: "boolean" })
      .notNull()
      .default(false),
    minSelect: integer("min_select").notNull().default(0),
    maxSelect: integer("max_select").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("option_groups_food_idx").on(t.foodItemId, t.sortOrder)],
);

export const options = sqliteTable(
  "options",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id")
      .notNull()
      .references(() => optionGroups.id, { onDelete: "cascade" }),
    label: text("label").notNull(), // e.g. "Full", "Extra cheese"
    priceDelta: real("price_delta").notNull().default(0),
    isAvailable: integer("is_available", { mode: "boolean" })
      .notNull()
      .default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("options_group_idx").on(t.groupId, t.sortOrder)],
);

/* ------------------------------------------------------------------ */
/* Tables + QR                                                         */
/* ------------------------------------------------------------------ */

export const diningTables = sqliteTable(
  "dining_tables",
  {
    id: text("id").primaryKey(),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    label: text("label").notNull(), // "T1", "Terrace 2" …
    qrToken: text("qr_token").notNull(), // secret in QR URL, rotatable
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("dining_tables_qr_token_idx").on(t.qrToken),
    index("dining_tables_restaurant_idx").on(t.restaurantId),
  ],
);

/* ------------------------------------------------------------------ */
/* Images (uploaded to DB as blobs — portable, no external storage)    */
/* ------------------------------------------------------------------ */

export const images = sqliteTable("images", {
  id: text("id").primaryKey(),
  mimeType: text("mime_type").notNull(),
  // Stored as a base64 string (SQLite TEXT). Portable, no external blob deps.
  data: text("data").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(), // uuid
    orderNumber: text("order_number").notNull(), // human readable: e.g. "A1B2-07"
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    tableId: text("table_id").references(() => diningTables.id),
    tableLabel: text("table_label"), // denormalized snapshot
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    // placed | accepted | preparing | ready | completed | cancelled
    status: text("status").notNull().default("placed"),
    // pending | paid | failed | refunded
    paymentStatus: text("payment_status").notNull().default("pending"),
    paymentMethod: text("payment_method"), // razorpay | cash (future)
    subtotal: real("subtotal").notNull(),
    taxTotal: real("tax_total").notNull(),
    chargeTotal: real("charge_total").notNull(),
    total: real("total").notNull(),
    currency: text("currency").notNull().default("INR"),
    specialInstructions: text("special_instructions"),
    // idempotency: client-generated key, one order per key
    idempotencyKey: text("idempotency_key"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    acceptedAt: text("accepted_at"),
    preparingAt: text("preparing_at"),
    readyAt: text("ready_at"),
    completedAt: text("completed_at"),
    cancelledAt: text("cancelled_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_idempotency_idx").on(t.idempotencyKey),
    index("orders_restaurant_status_idx").on(t.restaurantId, t.status),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    foodItemId: text("food_item_id").references(() => foodItems.id),
    name: text("name").notNull(), // snapshot
    // JSON: [{ groupLabel, optionLabel, priceDelta }]
    selections: text("selections", { mode: "json" })
      .$type<OrderItemSelection[]>()
      .notNull()
      .default(sql`'[]'`),
    unitPrice: real("unit_price").notNull(), // base + deltas, per unit
    quantity: integer("quantity").notNull(),
    lineTotal: real("line_total").notNull(),
    notes: text("notes"), // per-item special instruction
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // order_created | payment_captured | payment_failed | webhook | refund
    eventType: text("event_type").notNull(),
    payload: text("payload", { mode: "json" }),
    createdAt: createdAt(),
  },
  (t) => [index("payment_events_order_idx").on(t.orderId)],
);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type TaxLine = {
  id: string;
  label: string;
  rate: number; // percent
  isInclusiveOfMenuPrice: boolean;
};

export type ChargeLine = {
  id: string;
  label: string;
  amount: number; // flat currency units
};

export type OrderItemSelection = {
  groupLabel: string;
  optionLabel: string;
  priceDelta: number;
};

export type Restaurant = typeof restaurants.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type FoodItem = typeof foodItems.$inferSelect;
export type OptionGroup = typeof optionGroups.$inferSelect;
export type Option = typeof options.$inferSelect;
export type DiningTable = typeof diningTables.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

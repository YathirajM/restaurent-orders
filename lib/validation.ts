import { z } from "zod";

/**
 * Shared request validation. The backend never trusts the client —
 * prices, availability and option rules are recomputed server-side
 * from the database on every order.
 */

export const selectionSchema = z.object({
  optionId: z.string().min(1).max(64),
});

export const cartItemSchema = z.object({
  foodItemId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(50),
  optionIds: z.array(z.string().min(1).max(64)).max(30).default([]),
  notes: z.string().max(280).optional(),
});

export const createOrderSchema = z.object({
  idempotencyKey: z.string().min(8).max(64),
  tableToken: z.string().min(8).max(128),
  customerName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{5,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  items: z.array(cartItemSchema).min(1, "Cart is empty").max(50),
  specialInstructions: z.string().max(280).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const foodItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.number().min(0).max(1_000_000),
  categoryId: z.string().min(1),
  isVeg: z.boolean(),
  isBestseller: z.boolean().default(false),
  isChefSpecial: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  imageId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export type FoodItemInput = z.infer<typeof foodItemSchema>;

export const optionGroupSchema = z.object({
  label: z.string().trim().min(1).max(80),
  selectionType: z.enum(["single", "multi"]),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).max(20).default(0),
  maxSelect: z.number().int().min(1).max(20).default(1),
  options: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        priceDelta: z.number().min(-1_000_000).max(1_000_000).default(0),
        isAvailable: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(30),
});

export type OptionGroupInput = z.infer<typeof optionGroupSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const tableSchema = z.object({
  label: z.string().trim().min(1).max(60),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

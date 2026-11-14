import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  categories,
  diningTables,
  foodItems,
  optionGroups,
  options,
  restaurants,
  type Category,
  type Option,
  type OptionGroup,
} from "./db/schema";

export type PublicFoodItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageId: string | null;
  isVeg: boolean;
  isBestseller: boolean;
  isChefSpecial: boolean;
  isAvailable: boolean;
  categoryId: string;
  optionGroups: PublicOptionGroup[];
};

export type PublicOptionGroup = {
  id: string;
  label: string;
  selectionType: "single" | "multi";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: PublicOption[];
};

export type PublicOption = {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
};

export type PublicMenu = {
  restaurant: {
    id: string;
    name: string;
    tagline: string | null;
    description: string | null;
    logoImageId: string | null;
    phone: string | null;
    address: string | null;
    currencySymbol: string;
    acceptOrders: boolean;
    taxConfig: unknown;
    chargeConfig: unknown;
  };
  table: { id: string; label: string } | null;
  categories: (Pick<Category, "id" | "name"> & { sortOrder: number })[];
  items: PublicFoodItem[];
};

/**
 * Loads the full public menu for a table QR token. Only active categories
 * and items are exposed; option data is nested for the customization sheet.
 */
export async function getPublicMenuByTableToken(
  token: string,
): Promise<PublicMenu | null> {
  const tableRows = await db
    .select()
    .from(diningTables)
    .where(eq(diningTables.qrToken, token))
    .limit(1);
  const table = tableRows[0];
  if (!table || !table.isActive) return null;

  const restaurantRows = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, table.restaurantId))
    .limit(1);
  const restaurant = restaurantRows[0];
  if (!restaurant) return null;

  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(
      and(
        eq(categories.restaurantId, restaurant.id),
        eq(categories.isActive, true),
      ),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const catIds = cats.map((c) => c.id);
  const items = catIds.length
    ? await db
        .select()
        .from(foodItems)
        .where(inArray(foodItems.categoryId, catIds))
        .orderBy(asc(foodItems.sortOrder), asc(foodItems.name))
    : [];

  const itemIds = items.map((i) => i.id);
  const groupRows = itemIds.length
    ? await db
        .select()
        .from(optionGroups)
        .where(inArray(optionGroups.foodItemId, itemIds))
        .orderBy(asc(optionGroups.sortOrder))
    : [];

  const groupIds = groupRows.map((g) => g.id);
  const optionRows = groupIds.length
    ? await db
        .select()
        .from(options)
        .where(inArray(options.groupId, groupIds))
        .orderBy(asc(options.sortOrder))
    : [];

  const optionsByGroup = new Map<string, PublicOption[]>();
  for (const o of optionRows) {
    const list = optionsByGroup.get(o.groupId) ?? [];
    list.push({
      id: o.id,
      label: o.label,
      priceDelta: o.priceDelta,
      isAvailable: o.isAvailable,
    });
    optionsByGroup.set(o.groupId, list);
  }

  const groupsByItem = new Map<string, PublicOptionGroup[]>();
  for (const g of groupRows) {
    const list = groupsByItem.get(g.foodItemId) ?? [];
    list.push({
      id: g.id,
      label: g.label,
      selectionType: g.selectionType as "single" | "multi",
      isRequired: g.isRequired,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: optionsByGroup.get(g.id) ?? [],
    });
    groupsByItem.set(g.foodItemId, list);
  }

  return {
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      tagline: restaurant.tagline,
      description: restaurant.description,
      logoImageId: restaurant.logoImageId,
      phone: restaurant.phone,
      address: restaurant.address,
      currencySymbol: restaurant.currencySymbol,
      acceptOrders: restaurant.acceptOrders,
      taxConfig: restaurant.taxConfig,
      chargeConfig: restaurant.chargeConfig,
    },
    table: { id: table.id, label: table.label },
    categories: cats,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      imageId: i.imageId,
      isVeg: i.isVeg,
      isBestseller: i.isBestseller,
      isChefSpecial: i.isChefSpecial,
      isAvailable: i.isAvailable,
      categoryId: i.categoryId,
      optionGroups: groupsByItem.get(i.id) ?? [],
    })),
  };
}

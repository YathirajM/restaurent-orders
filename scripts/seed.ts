"use strict";
import { db } from "../lib/db";
import {
  restaurants,
  adminUsers,
  categories,
  foodItems,
  optionGroups,
  options,
  diningTables,
  images,
} from "../lib/db/schema";
import bcrypt from "bcryptjs";
import { newId, newTableToken } from "../lib/ids";

/**
 * Seed script — creates a demo restaurant, an owner, categories,
 * a few food items with option groups, two tables, and uploads demo images.
 *
 * Run with:  npx tsx scripts/seed.ts
 *
 * Passwords for all seeded users: "password123"
 */

async function main() {
  console.log("🌱 Starting seed…");

  // 1) Restaurant (ID matches default demo expectations)
  const restaurantId = newId();
  const restaurant = {
    id: restaurantId,
    name: "Saffron Heritage",
    tagline: "Exquisite Indian cuisine for modern moments",
    description: "At Saffron, we blend authentic Indian flavors with a modern touch. From traditional butter chicken to innovative vegetarian delights, every dish is prepared with passion and premium ingredients.",
    logoImageId: "",
    coverImageId: "",
    phone: "+91-98765 43210",
    address: "123 Culinary Street, Food District, Mumbai – 400001",
    openingHours: { open: "11:00", close: "23:00", days: [1, 2, 3, 4, 5, 6, 0] },
    currency: "INR",
    currencySymbol: "₹",
    acceptOrders: true,
    taxConfig: [
      { id: "tax1", label: "GST 18%", rate: 18, isInclusiveOfMenuPrice: false },
    ],
    chargeConfig: [
      { id: "charge1", label: "Packaging", amount: 20 },
    ],
  };

  await db.insert(restaurants).values(restaurant);

  // 2) Admin user (owner)
  const adminId = newId();
  const passwordHash = await bcrypt.hash("password123", 12);
  await db.insert(adminUsers).values({
    id: adminId,
    email: "owner@saffron.com",
    passwordHash,
    name: "Rajesh Kumar",
    role: "owner",
    restaurantId,
  });

  // 3) Upload demo images (base64 PNG placeholders — 1x1 squares with colors)
  const imgBase64 = (mime: string, width: number, height: number, bg: string) => {
    const canvas = `data:${mime};base64,`;
    // 1×1 pixel base64 for each color
    const map: Record<string, string> = {
      saffron: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      sage: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
      chili: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8%2F5+hHgAHggGAWjI0TzkAAAABJRU5ErkJggg==",
      cream: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkZgZGBgYMAAFeAf9pNQgAAAABJRU5ErkJggg==",
      default: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk/M+/HgAFhAJngLx4JQRAAAABJRU5ErkJggg==",
    };
    return map[bg] ?? map.default;
  };

  const imageInserts = [
    { id: newId(), mimeType: "image/png", data: imgBase64("image/png", 1, 1, "saffron"), sizeBytes: 100 },
    { id: newId(), mimeType: "image/png", data: imgBase64("image/png", 1, 1, "sage"), sizeBytes: 100 },
    { id: newId(), mimeType: "image/png", data: imgBase64("image/png", 1, 1, "chili"), sizeBytes: 100 },
    { id: newId(), mimeType: "image/png", data: imgBase64("image/png", 1, 1, "cream"), sizeBytes: 100 },
    { id: newId(), mimeType: "image/png", data: imgBase64("image/png", 1, 1, "default"), sizeBytes: 100 },
  ];
  await db.insert(images).values(imageInserts);

  // 4) Categories
  const catIdVegetarian = newId();
  const catIdNonVeg = newId();
  const catIdBreads = newId();
  const catIdDesserts = newId();
  await db.insert(categories).values([
    { id: catIdVegetarian, restaurantId, name: "Vegetarian", sortOrder: 0 },
    { id: catIdNonVeg, restaurantId, name: "Non‑Veg", sortOrder: 1 },
    { id: catIdBreads, restaurantId, name: "Breads & Rice", sortOrder: 2 },
    { id: catIdDesserts, restaurantId, name: "Desserts", sortOrder: 3 },
  ]);

  // 5) Option groups: Size, Extras, Qunty
  const groupSizeId = newId();
  const groupExtrasId = newId();

  // 6) Food items
  const biryaniId = newId();
  const paneerTikkaId = newId();
  const garlicNaanId = newId();
  const gulabJamunId = newId();

  await db.insert(foodItems).values([
    {
      id: biryaniId,
      restaurantId,
      categoryId: catIdNonVeg,
      name: "Classic Chicken Biryani",
      description: "Fragrant basmati rice with tender chicken, saffron, and spices. Served hot.",
      price: 299,
      imageId: imageInserts[0].id,
      isVeg: false,
      isBestseller: true,
      isChefSpecial: false,
      isAvailable: true,
      sortOrder: 0,
    },
    {
      id: paneerTikkaId,
      restaurantId,
      categoryId: catIdVegetarian,
      name: "Paneer Tikka",
      description: "Marinated paneer chunks grilled to perfection, smoky and spicy.",
      price: 199,
      imageId: imageInserts[1].id,
      isVeg: true,
      isBestseller: false,
      isChefSpecial: true,
      isAvailable: true,
      sortOrder: 1,
    },
    {
      id: garlicNaanId,
      restaurantId,
      categoryId: catIdBreads,
      name: "Garlic Naan",
      description: "Soft flatbread infused with garlic and butter.",
      price: 80,
      imageId: imageInserts[2].id,
      isVeg: true,
      isBestseller: true,
      isChefSpecial: false,
      isAvailable: true,
      sortOrder: 2,
    },
    {
      id: gulabJamunId,
      restaurantId,
      categoryId: catIdDesserts,
      name: "Gulab Jamun",
      description: "Sweet milk dumplings soaked in rose-scented sugar syrup.",
      price: 120,
      imageId: imageInserts[3].id,
      isVeg: true,
      isBestseller: false,
      isChefSpecial: false,
      isAvailable: true,
      sortOrder: 3,
    },
  ]);

  // 7) Insert option groups linked to food items
  const spiceGroupId = newId();
  await db.insert(optionGroups).values([
    // Biryani: Size group (single)
    {
      id: groupSizeId,
      foodItemId: biryaniId,
      label: "Size",
      selectionType: "single",
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 0,
    },
    // Biryani: Extras group (multi)
    {
      id: groupExtrasId,
      foodItemId: biryaniId,
      label: "Extras",
      selectionType: "multi",
      isRequired: false,
      minSelect: 0,
      maxSelect: 5,
      sortOrder: 1,
    },
    // Paneer Tikka: Spice Level (single)
    {
      id: spiceGroupId,
      foodItemId: paneerTikkaId,
      label: "Spice Level",
      selectionType: "single",
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      sortOrder: 0,
    },
  ]);

  // 8) Insert options
  const sizeOptions = [
    { id: newId(), groupId: groupSizeId, label: "Regular", priceDelta: 0, isAvailable: true },
    { id: newId(), groupId: groupSizeId, label: "Large", priceDelta: 100, isAvailable: true },
  ];
  const extraOptions = [
    { id: newId(), groupId: groupExtrasId, label: "Extra Chicken", priceDelta: 80, isAvailable: true },
    { id: newId(), groupId: groupExtrasId, label: "Extra Masala", priceDelta: 60, isAvailable: true },
  ];
  const spiceOptions = [
    { id: newId(), groupId: spiceGroupId, label: "Mild", priceDelta: 0, isAvailable: true },
    { id: newId(), groupId: spiceGroupId, label: "Spicy", priceDelta: 20, isAvailable: true },
    { id: newId(), groupId: spiceGroupId, label: "Extra Spicy", priceDelta: 40, isAvailable: true },
  ];

  await db.insert(options).values([...sizeOptions, ...extraOptions, ...spiceOptions]);

  // 9) Dining tables + QR tokens
  const table1Id = newId();
  const table2Id = newId();
  await db.insert(diningTables).values([
    { id: table1Id, restaurantId, label: "Table 1", qrToken: newTableToken(), isActive: true },
    { id: table2Id, restaurantId, label: "Table 2", qrToken: newTableToken(), isActive: true },
  ]);

  console.log("✅ Seed completed successfully");
}

// Run the seed script when invoked directly.
if (require.main === module) {
  main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
}

export default main;
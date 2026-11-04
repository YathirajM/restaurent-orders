import {
  Category,
  Coupon,
  DashboardAnalytics,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  RestaurantSettings,
  Table,
} from "./types";
import {
  CATEGORIES,
  COUPONS,
  PRODUCTS,
  RESTAURANT,
  SAMPLE_ORDERS,
  TABLES,
} from "./data";
import { calculateOrderPricing } from "./utils";
import { generateTableToken } from "./qr";

// In-Memory Database Store for Node.js runtime environment (persists during server lifetime)
class RestaurantDatabase {
  private restaurant: RestaurantSettings;
  private categories: Category[];
  private products: Product[];
  private tables: Table[];
  private orders: Order[];
  private coupons: Coupon[];
  private orderCounter: number = 1045;

  constructor() {
    this.restaurant = { ...RESTAURANT };
    this.categories = JSON.parse(JSON.stringify(CATEGORIES));
    this.products = JSON.parse(JSON.stringify(PRODUCTS));
    this.tables = JSON.parse(JSON.stringify(TABLES));
    this.orders = JSON.parse(JSON.stringify(SAMPLE_ORDERS));
    this.coupons = JSON.parse(JSON.stringify(COUPONS));

    // Update table occupancy based on sample orders
    this.syncTableOccupancy();
  }

  private syncTableOccupancy() {
    // Reset all tables
    this.tables.forEach((t) => {
      t.status = "available";
      t.activeOrderId = undefined;
      t.currentBill = 0;
    });

    // Mark occupied based on active orders
    this.orders.forEach((ord) => {
      if (
        ord.status === "placed" ||
        ord.status === "accepted" ||
        ord.status === "preparing" ||
        ord.status === "ready" ||
        ord.status === "served"
      ) {
        const tbl = this.tables.find(
          (t) => t.id === ord.tableId || t.tableNumber === ord.tableNumber
        );
        if (tbl) {
          tbl.status = ord.status === "served" ? "billing" : "occupied";
          tbl.activeOrderId = ord.id;
          tbl.currentBill = ord.totalAmount;
        }
      }
    });
  }

  // ─── Restaurant Settings ──────────────────────────────────────
  public getRestaurant(): RestaurantSettings {
    return this.restaurant;
  }

  public updateRestaurant(data: Partial<RestaurantSettings>): RestaurantSettings {
    this.restaurant = { ...this.restaurant, ...data };
    return this.restaurant;
  }

  // ─── Categories ───────────────────────────────────────────────
  public getCategories(): Category[] {
    return this.categories
      .map((c) => ({
        ...c,
        itemCount: this.products.filter((p) => p.categoryId === c.id).length,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getCategory(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  public createCategory(data: Omit<Category, "id">): Category {
    const id = `cat_${Date.now()}`;
    const newCategory: Category = { id, ...data };
    this.categories.push(newCategory);
    return newCategory;
  }

  public updateCategory(id: string, data: Partial<Category>): Category | null {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...data };
    return this.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.categories.length;
    this.categories = this.categories.filter((c) => c.id !== id);
    return this.categories.length < initialLen;
  }

  // ─── Products ─────────────────────────────────────────────────
  public getProducts(categoryId?: string): Product[] {
    let list = this.products;
    if (categoryId && categoryId !== "all") {
      list = list.filter((p) => p.categoryId === categoryId);
    }
    return list;
  }

  public getProduct(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public createProduct(data: Omit<Product, "id">): Product {
    const id = `prod_${Date.now()}`;
    const category = this.categories.find((c) => c.id === data.categoryId);
    const newProd: Product = {
      id,
      ...data,
      categoryName: category ? category.name : "Specials",
    };
    this.products.push(newProd);
    return newProd;
  }

  public updateProduct(id: string, data: Partial<Product>): Product | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.products[idx] = { ...this.products[idx], ...data };
    return this.products[idx];
  }

  public toggleProductAvailability(id: string): Product | null {
    const prod = this.products.find((p) => p.id === id);
    if (!prod) return null;
    prod.isAvailable = !prod.isAvailable;
    return prod;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    return this.products.length < initialLen;
  }

  // ─── Tables ───────────────────────────────────────────────────
  public getTables(): Table[] {
    this.syncTableOccupancy();
    return this.tables;
  }

  public getTable(idOrNumber: string): Table | undefined {
    return this.tables.find(
      (t) =>
        t.id === idOrNumber ||
        t.tableNumber === idOrNumber ||
        t.qrToken === idOrNumber
    );
  }

  public createTable(tableNumber: string, capacity: number = 4): Table {
    const id = `table_${tableNumber}`;
    const newTable: Table = {
      id,
      tableNumber,
      name: `Table ${tableNumber}`,
      capacity,
      qrToken: generateTableToken(tableNumber),
      status: "available",
    };
    this.tables.push(newTable);
    return newTable;
  }

  public deleteTable(id: string): boolean {
    const initial = this.tables.length;
    this.tables = this.tables.filter((t) => t.id !== id);
    return this.tables.length < initial;
  }

  // ─── Coupons ──────────────────────────────────────────────────
  public getCoupons(): Coupon[] {
    return this.coupons;
  }

  public validateCoupon(code: string, subtotal: number) {
    const normalized = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === normalized);

    if (!coupon || !coupon.isActive) {
      return { valid: false, error: "Invalid coupon code" };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        error: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      };
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return {
      valid: true,
      coupon,
      discount,
    };
  }

  // ─── Orders ───────────────────────────────────────────────────
  public getOrders(): Order[] {
    return [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrder(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public getOrdersForTable(tableNumber: string): Order[] {
    return this.orders.filter((o) => o.tableNumber === tableNumber);
  }

  /**
   * Secure Server-side price recalculation & order creation
   */
  public createOrder(input: {
    tableNumber: string;
    customerName: string;
    customerPhone?: string;
    items: {
      productId: string;
      quantity: number;
      variantId?: string;
      addonIds?: string[];
      spiceLevel?: 0 | 1 | 2 | 3;
      specialInstructions?: string;
    }[];
    couponCode?: string;
    paymentMethod: "razorpay" | "pay_at_counter" | "upi";
    specialInstructions?: string;
  }): Order {
    const table = this.tables.find((t) => t.tableNumber === input.tableNumber);
    if (!table) {
      throw new Error(`Table ${input.tableNumber} does not exist`);
    }

    // Server-verified items calculation
    const orderItems: OrderItem[] = [];
    let calculatedSubtotal = 0;
    let maxPrepTime = 15;

    for (const reqItem of input.items) {
      const product = this.products.find((p) => p.id === reqItem.productId);
      if (!product) {
        throw new Error(`Product ${reqItem.productId} not found`);
      }
      if (!product.isAvailable) {
        throw new Error(`Dish "${product.name}" is currently sold out`);
      }

      let unitPrice = product.price;
      const selectedVariant = product.variants?.find((v) => v.id === reqItem.variantId);
      if (selectedVariant) {
        unitPrice = selectedVariant.price;
      }

      const selectedAddons =
        product.addons?.filter((a) => reqItem.addonIds?.includes(a.id)) || [];
      const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
      unitPrice += addonsPrice;

      const itemSubtotal = unitPrice * reqItem.quantity;
      calculatedSubtotal += itemSubtotal;

      if (product.preparationTimeMinutes > maxPrepTime) {
        maxPrepTime = product.preparationTimeMinutes;
      }

      orderItems.push({
        id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        isVeg: product.isVeg,
        unitPrice,
        quantity: reqItem.quantity,
        subtotal: itemSubtotal,
        customization: {
          selectedVariant,
          selectedAddons,
          spiceLevel: reqItem.spiceLevel,
          specialInstructions: reqItem.specialInstructions,
        },
      });
    }

    // Coupon validation
    let coupon: Coupon | null = null;
    if (input.couponCode) {
      const validation = this.validateCoupon(input.couponCode, calculatedSubtotal);
      if (validation.valid && validation.coupon) {
        coupon = validation.coupon;
      }
    }

    const pricing = calculateOrderPricing(
      orderItems.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
      coupon,
      this.restaurant.taxRatePercent,
      this.restaurant.serviceChargePercent,
      this.restaurant.isServiceChargeEnabled
    );

    const now = new Date();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const orderNumber = `UP-${this.orderCounter++}`;
    const estimatedReadyTime = new Date(now.getTime() + maxPrepTime * 60000).toISOString();

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      restaurantId: this.restaurant.id,
      tableId: table.id,
      tableNumber: table.tableNumber,
      customerName: input.customerName.trim() || "Guest",
      customerPhone: input.customerPhone,
      items: orderItems,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      couponCode: coupon?.code,
      taxAmount: pricing.taxAmount,
      serviceChargeAmount: pricing.serviceChargeAmount,
      totalAmount: pricing.totalAmount,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "razorpay" ? "pending" : "pending",
      status: "placed",
      specialInstructions: input.specialInstructions,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      estimatedPrepMinutes: maxPrepTime,
      estimatedReadyTime,
    };

    this.orders.unshift(newOrder);

    // Update table
    table.status = "occupied";
    table.activeOrderId = newOrder.id;
    table.currentBill = newOrder.totalAmount;

    return newOrder;
  }

  public updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    rejectionReason?: string
  ): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (rejectionReason) {
      order.rejectionReason = rejectionReason;
    }

    if (status === "completed" || status === "cancelled" || status === "rejected") {
      const table = this.tables.find((t) => t.id === order.tableId);
      if (table && table.activeOrderId === order.id) {
        table.status = "available";
        table.activeOrderId = undefined;
        table.currentBill = 0;
      }
    } else if (status === "served") {
      const table = this.tables.find((t) => t.id === order.tableId);
      if (table) {
        table.status = "billing";
      }
    }

    return order;
  }

  public updateOrderPayment(
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentId?: string,
    razorpayOrderId?: string
  ): Order | null {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.paymentStatus = paymentStatus;
    if (paymentId) order.razorpayPaymentId = paymentId;
    if (razorpayOrderId) order.razorpayOrderId = razorpayOrderId;
    order.updatedAt = new Date().toISOString();

    return order;
  }

  // ─── Analytics ────────────────────────────────────────────────
  public getAnalytics(): DashboardAnalytics {
    const completedOrActive = this.orders.filter(
      (o) => o.status !== "rejected" && o.status !== "cancelled"
    );

    const todaySales = completedOrActive.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayOrdersCount = this.orders.length;
    const activeOrdersCount = this.orders.filter((o) =>
      ["placed", "accepted", "preparing", "ready"].includes(o.status)
    ).length;
    const completedOrdersCount = this.orders.filter((o) =>
      ["served", "completed"].includes(o.status)
    ).length;
    const pendingOrdersCount = this.orders.filter((o) => o.status === "placed").length;
    const averageOrderValue =
      completedOrActive.length > 0 ? Math.round(todaySales / completedOrActive.length) : 0;

    // Item popularity count
    const itemMap = new Map<string, { count: number; revenue: number }>();
    this.orders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = itemMap.get(item.productId) || { count: 0, revenue: 0 };
        itemMap.set(item.productId, {
          count: existing.count + item.quantity,
          revenue: existing.revenue + item.subtotal,
        });
      });
    });

    const bestsellers = Array.from(itemMap.entries())
      .map(([prodId, stats]) => {
        const prod = this.products.find((p) => p.id === prodId);
        return {
          productId: prodId,
          productName: prod ? prod.name : "Special Dish",
          category: prod ? prod.categoryName || "Main" : "Main",
          count: stats.count,
          revenue: stats.revenue,
          image: prod ? prod.image : "",
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Realistic hourly distribution for Indian lunch & dinner peak hours
    const hourlySales = [
      { hour: "12 PM", sales: 2450, orders: 3 },
      { hour: "1 PM", sales: 4890, orders: 5 },
      { hour: "2 PM", sales: 6120, orders: 7 },
      { hour: "3 PM", sales: 1840, orders: 2 },
      { hour: "4 PM", sales: 1250, orders: 2 },
      { hour: "5 PM", sales: 1980, orders: 3 },
      { hour: "6 PM", sales: 3450, orders: 4 },
      { hour: "7 PM", sales: 7890, orders: 9 },
      { hour: "8 PM", sales: 11240, orders: 13 },
      { hour: "9 PM", sales: 13650, orders: 16 },
      { hour: "10 PM", sales: 8450, orders: 9 },
    ];

    const categoryBreakdown = [
      { category: "Indian Classics", sales: 18450, percentage: 38 },
      { category: "Main Course", sales: 12600, percentage: 26 },
      { category: "Pizzas & Burgers", sales: 8900, percentage: 18 },
      { category: "Starters", sales: 5400, percentage: 11 },
      { category: "Beverages & Desserts", sales: 3400, percentage: 7 },
    ];

    return {
      todaySales,
      todayOrdersCount,
      activeOrdersCount,
      completedOrdersCount,
      pendingOrdersCount,
      averageOrderValue,
      salesGrowthPercent: 18.4,
      ordersGrowthPercent: 12.5,
      bestsellers,
      hourlySales,
      recentOrders: this.getOrders().slice(0, 8),
      categoryBreakdown,
    };
  }

  // ─── Reset / Seed Demo ────────────────────────────────────────
  public resetToDemo() {
    this.restaurant = { ...RESTAURANT };
    this.categories = JSON.parse(JSON.stringify(CATEGORIES));
    this.products = JSON.parse(JSON.stringify(PRODUCTS));
    this.tables = JSON.parse(JSON.stringify(TABLES));
    this.orders = JSON.parse(JSON.stringify(SAMPLE_ORDERS));
    this.coupons = JSON.parse(JSON.stringify(COUPONS));
    this.syncTableOccupancy();
  }
}

// Global singleton across hot reloads in development
const globalForDb = global as unknown as { restaurantDb: RestaurantDatabase };

export const db = globalForDb.restaurantDb || new RestaurantDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.restaurantDb = db;
}

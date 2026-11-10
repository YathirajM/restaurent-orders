// In-memory Database Store with Supabase-like interface
import type {
  Order,
  Product,
  Category,
  Table,
  Coupon,
  RestaurantSettings,
  DashboardAnalytics,
  OrderStatus,
} from './types';
import { generateOrderNumber } from './utils';

class Database {
  private orders: Map<string, Order> = new Map();
  private products: Map<string, Product> = new Map();
  private categories: Map<string, Category> = new Map();
  private tables: Map<string, Table> = new Map();
  private coupons: Map<string, Coupon> = new Map();
  private restaurant: RestaurantSettings | null = null;
  private subscribers: Set<(event: string, data: any) => void> = new Set();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Restaurant Settings
    this.restaurant = {
      id: 'rest_001',
      name: 'The Urban Plate',
      tagline: 'Where Culinary Art Meets Modern Dining',
      description: 'Experience a symphony of flavors crafted by award-winning chefs.',
      logo: '/logo.svg',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80',
      address: '42 MG Road, Connaught Place',
      city: 'New Delhi',
      phone: '+91 98765 43210',
      email: 'hello@theurbanplate.in',
      gstNumber: '07AABCT1234C1ZP',
      fssaiNumber: '12345678901234',
      openingHours: '11:00 AM – 11:00 PM',
      isRestaurantOpen: true,
      currency: 'INR',
      currencySymbol: '₹',
      taxRatePercent: 5,
      serviceChargePercent: 5,
      isServiceChargeEnabled: true,
      allowPayAtCounter: true,
      allowOnlinePayment: true,
      soundAlertsEnabled: true,
      estimatedPrepTimeMinutes: 20,
      themeColor: '#c28e34',
    };

    // Categories
    const categoriesData: Category[] = [
      { id: 'cat_1', name: 'Starters', slug: 'starters', description: 'Crispy, crunchy, and delicious appetizers', image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=500&q=80', displayOrder: 1, isActive: true, itemCount: 6 },
      { id: 'cat_2', name: 'Main Course', slug: 'main-course', description: 'Hearty, flavorful entrées', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', displayOrder: 2, isActive: true, itemCount: 6 },
      { id: 'cat_3', name: 'Indian Classics', slug: 'indian', description: 'Timeless recipes from across the subcontinent', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80', displayOrder: 3, isActive: true, itemCount: 5 },
      { id: 'cat_4', name: 'Pizzas', slug: 'pizzas', description: 'Hand-tossed, stone-fired, impossibly cheesy', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80', displayOrder: 4, isActive: true, itemCount: 4 },
      { id: 'cat_5', name: 'Burgers', slug: 'burgers', description: 'Towering, juicy, built to impress', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80', displayOrder: 5, isActive: true, itemCount: 4 },
      { id: 'cat_6', name: 'Desserts', slug: 'desserts', description: 'Indulgent sweets to end your meal', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=80', displayOrder: 6, isActive: true, itemCount: 4 },
      { id: 'cat_7', name: 'Beverages', slug: 'beverages', description: 'Refreshing sips and artisan coffees', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80', displayOrder: 7, isActive: true, itemCount: 5 },
    ];
    categoriesData.forEach(c => this.categories.set(c.id, c));

    // Products
    const productsData: Product[] = [
      // Starters
      { id: 'prod_1', categoryId: 'cat_1', categoryName: 'Starters', name: 'Smoky Paneer Tikka', description: 'Tandoor-grilled cottage cheese with aromatic spices, served with mint chutney.', price: 329, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', isVeg: true, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 15, spiceLevel: 2, portionSize: '8 pieces', ingredients: ['Paneer', 'Yogurt', 'Bell Peppers', 'Spices'], variants: [{ id: 'v1', name: 'Half (4 pcs)', price: 199 }, { id: 'v2', name: 'Full (8 pcs)', price: 329 }], addons: [{ id: 'a1', name: 'Extra Mint Chutney', price: 29, isVeg: true }] },
      { id: 'prod_2', categoryId: 'cat_1', categoryName: 'Starters', name: 'Buffalo Chicken Wings', description: 'Crispy double-fried wings tossed in signature buffalo sauce.', price: 399, image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80', isVeg: false, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 18, spiceLevel: 3, portionSize: '8 wings', ingredients: ['Chicken Wings', 'Hot Sauce', 'Butter'], addons: [{ id: 'a2', name: 'Extra Ranch Dip', price: 39, isVeg: true }] },
      { id: 'prod_3', categoryId: 'cat_1', categoryName: 'Starters', name: 'Crispy Spring Rolls', description: 'Golden hand-rolled rolls with mixed vegetables and glass noodles.', price: 249, image: 'https://images.unsplash.com/photo-1606525437679-2211fd4a5c93?w=600&q=80', isVeg: true, isBestseller: false, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 12, spiceLevel: 1, portionSize: '6 rolls', ingredients: ['Spring Roll Wrappers', 'Cabbage', 'Carrots', 'Glass Noodles'] },
      { id: 'prod_4', categoryId: 'cat_1', categoryName: 'Starters', name: 'Loaded Nachos Supreme', description: 'Crispy tortilla chips with cheese, jalapeños, salsa, sour cream.', price: 349, image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80', isVeg: true, isBestseller: false, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 10, spiceLevel: 2, portionSize: 'Serves 2', ingredients: ['Tortilla Chips', 'Cheddar', 'Jalapeños', 'Salsa'], addons: [{ id: 'a3', name: 'Add Chicken', price: 89, isVeg: false }] },
      // Main Course
      { id: 'prod_5', categoryId: 'cat_2', categoryName: 'Main Course', name: 'Butter Chicken', description: 'Tender tandoori chicken in velvety tomato-butter-cream gravy.', price: 399, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', isVeg: false, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 20, spiceLevel: 1, portionSize: 'Serves 2', ingredients: ['Chicken', 'Tomato', 'Butter', 'Cream'], addons: [{ id: 'a4', name: 'Butter Naan (2)', price: 69, isVeg: true }, { id: 'a5', name: 'Basmati Rice', price: 99, isVeg: true }] },
      { id: 'prod_6', categoryId: 'cat_2', categoryName: 'Main Course', name: 'Truffle Alfredo Pasta', description: 'Silky fettuccine in creamy truffle-infused Parmesan sauce.', price: 449, image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80', isVeg: true, isBestseller: true, isChefSpecial: true, isAvailable: true, preparationTimeMinutes: 20, spiceLevel: 0, portionSize: 'Serves 1', ingredients: ['Fettuccine', 'Truffle Oil', 'Parmesan', 'Mushrooms'], variants: [{ id: 'v3', name: 'Regular', price: 449 }, { id: 'v4', name: 'Large', price: 599 }] },
      { id: 'prod_7', categoryId: 'cat_2', categoryName: 'Main Course', name: 'Hyderabadi Dum Biryani', description: 'Fragrant basmati rice with tender meat, saffron, caramelized onions.', price: 449, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', isVeg: false, isBestseller: true, isChefSpecial: true, isAvailable: true, preparationTimeMinutes: 30, spiceLevel: 2, portionSize: 'Serves 1-2', ingredients: ['Basmati Rice', 'Chicken/Lamb', 'Saffron', 'Onions'], variants: [{ id: 'v5', name: 'Chicken', price: 449 }, { id: 'v6', name: 'Lamb', price: 549 }], addons: [{ id: 'a6', name: 'Raita', price: 49, isVeg: true }] },
      { id: 'prod_8', categoryId: 'cat_2', categoryName: 'Main Course', name: 'Dal Makhani', description: 'Black lentils slow-cooked with tomato, butter, and cream.', price: 299, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80', isVeg: true, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 18, spiceLevel: 1, portionSize: 'Serves 2', ingredients: ['Black Lentils', 'Kidney Beans', 'Tomato', 'Butter', 'Cream'], addons: [{ id: 'a7', name: 'Jeera Rice', price: 119, isVeg: true }] },
      // Pizzas
      { id: 'prod_9', categoryId: 'cat_4', categoryName: 'Pizzas', name: 'Classic Margherita', description: 'San Marzano tomatoes, fresh mozzarella, basil, olive oil.', price: 349, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80', isVeg: true, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 15, spiceLevel: 0, portionSize: '10 inch', ingredients: ['Pizza Dough', 'San Marzano Tomatoes', 'Mozzarella', 'Basil'], variants: [{ id: 'v7', name: 'Regular (10")', price: 349 }, { id: 'v8', name: 'Large (14")', price: 499 }], addons: [{ id: 'a8', name: 'Extra Cheese', price: 69, isVeg: true }] },
      { id: 'prod_10', categoryId: 'cat_4', categoryName: 'Pizzas', name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce, shredded chicken, caramelized onions.', price: 499, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', isVeg: false, isBestseller: false, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 18, spiceLevel: 1, portionSize: '10 inch', ingredients: ['Pizza Dough', 'BBQ Sauce', 'Chicken', 'Onions', 'Mozzarella'], variants: [{ id: 'v9', name: 'Regular (10")', price: 499 }, { id: 'v10', name: 'Large (14")', price: 699 }] },
      // Burgers
      { id: 'prod_11', categoryId: 'cat_5', categoryName: 'Burgers', name: 'Classic Smash Burger', description: 'Double smashed patties, American cheese, caramelized onions, special sauce.', price: 399, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', isVeg: false, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 15, spiceLevel: 1, portionSize: 'Serves 1', ingredients: ['Beef Patties', 'American Cheese', 'Onions', 'Pickles', 'Brioche Bun'], addons: [{ id: 'a9', name: 'Truffle Fries', price: 99, isVeg: true }] },
      { id: 'prod_12', categoryId: 'cat_5', categoryName: 'Burgers', name: 'Truffle Veggie Burger', description: 'Crispy chickpea-quinoa patty, truffle aioli, arugula.', price: 349, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80', isVeg: true, isBestseller: false, isChefSpecial: true, isAvailable: true, preparationTimeMinutes: 15, spiceLevel: 1, portionSize: 'Serves 1', ingredients: ['Chickpea Patty', 'Quinoa', 'Truffle Aioli', 'Arugula', 'Tomato'] },
      // Desserts
      { id: 'prod_13', categoryId: 'cat_6', categoryName: 'Desserts', name: 'Classic Tiramisu', description: 'Layers of espresso-soaked ladyfingers and mascarpone cream.', price: 349, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', isVeg: true, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 5, spiceLevel: 0, portionSize: '1 slice', ingredients: ['Ladyfingers', 'Mascarpone', 'Espresso', 'Cocoa'] },
      { id: 'prod_14', categoryId: 'cat_6', categoryName: 'Desserts', name: 'Molten Chocolate Lava', description: 'Warm chocolate cake with flowing centre, vanilla ice cream.', price: 329, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80', isVeg: true, isBestseller: false, isChefSpecial: true, isAvailable: true, preparationTimeMinutes: 12, spiceLevel: 0, portionSize: '1 cake + scoop', ingredients: ['Dark Chocolate', 'Butter', 'Eggs', 'Vanilla Ice Cream'] },
      // Beverages
      { id: 'prod_15', categoryId: 'cat_7', categoryName: 'Beverages', name: 'Iced Hazelnut Latte', description: 'Double-shot espresso, hazelnut syrup, cold milk, ice.', price: 249, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', isVeg: true, isBestseller: true, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 5, spiceLevel: 0, portionSize: '350 ml', ingredients: ['Espresso', 'Hazelnut Syrup', 'Milk', 'Ice'], variants: [{ id: 'v11', name: 'Regular', price: 249 }, { id: 'v12', name: 'Large', price: 329 }] },
      { id: 'prod_16', categoryId: 'cat_7', categoryName: 'Beverages', name: 'Mango Lassi', description: 'Thick Alphonso mango purée with yogurt, cardamom.', price: 199, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&q=80', isVeg: true, isBestseller: false, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 5, spiceLevel: 0, portionSize: '300 ml', ingredients: ['Yogurt', 'Alphonso Mango', 'Sugar', 'Cardamom'] },
      { id: 'prod_17', categoryId: 'cat_7', categoryName: 'Beverages', name: 'Virgin Mojito', description: 'Fresh mint, lime, sugar, soda.', price: 179, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&q=80', isVeg: true, isBestseller: false, isChefSpecial: false, isAvailable: true, preparationTimeMinutes: 5, spiceLevel: 0, portionSize: '350 ml', ingredients: ['Fresh Mint', 'Lime', 'Sugar', 'Soda'], variants: [{ id: 'v13', name: 'Classic', price: 179 }, { id: 'v14', name: 'Watermelon', price: 209 }] },
    ];
    productsData.forEach(p => this.products.set(p.id, p));

    // Tables
    for (let i = 1; i <= 12; i++) {
      const num = i.toString().padStart(2, '0');
      this.tables.set(`table_${num}`, {
        id: `table_${num}`,
        tableNumber: num,
        name: `Table ${num}`,
        capacity: i <= 3 ? 2 : i <= 6 ? 4 : i <= 9 ? 6 : 8,
        status: 'available',
        qrCode: '', // Will be generated on demand
      });
    }

    // Coupons
    const couponsData: Coupon[] = [
      { id: 'coupon_1', code: 'WELCOME20', description: '20% off on first order', discountType: 'percentage', discountValue: 20, minOrderValue: 500, maxDiscountAmount: 200, isActive: true, expiryDate: '2027-12-31' },
      { id: 'coupon_2', code: 'FLAT100', description: '₹100 off on orders above ₹799', discountType: 'fixed', discountValue: 100, minOrderValue: 799, isActive: true, expiryDate: '2027-12-31' },
      { id: 'coupon_3', code: 'URBAN30', description: '30% off (max ₹300) on orders above ₹1000', discountType: 'percentage', discountValue: 30, minOrderValue: 1000, maxDiscountAmount: 300, isActive: true, expiryDate: '2027-12-31' },
    ];
    couponsData.forEach(c => this.coupons.set(c.code, c));

    // Sample Orders
    const sampleOrders: Order[] = [
      {
        id: 'order_demo_1',
        orderNumber: 'ORD-L4A7X2K9',
        restaurantId: 'rest_001',
        tableId: 'table_02',
        tableNumber: '02',
        customerName: 'Arjun Mehta',
        items: [{ id: 'oi_1', productId: 'prod_5', productName: 'Butter Chicken', productImage: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', isVeg: false, unitPrice: 399, quantity: 1, subtotal: 399 }],
        subtotal: 399,
        discountAmount: 0,
        taxAmount: 20,
        serviceChargeAmount: 20,
        totalAmount: 439,
        paymentMethod: 'pay_at_counter',
        paymentStatus: 'pending',
        status: 'preparing',
        createdAt: Date.now() - 15 * 60000,
        updatedAt: Date.now() - 10 * 60000,
        estimatedPrepMinutes: 25,
      },
      {
        id: 'order_demo_2',
        orderNumber: 'ORD-M8B2P5Q1',
        restaurantId: 'rest_001',
        tableId: 'table_04',
        tableNumber: '04',
        customerName: 'Priya Sharma',
        items: [{ id: 'oi_2', productId: 'prod_6', productName: 'Truffle Alfredo Pasta', productImage: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80', isVeg: true, unitPrice: 449, quantity: 2, subtotal: 898 }],
        subtotal: 898,
        discountAmount: 90,
        couponCode: 'WELCOME20',
        taxAmount: 40,
        serviceChargeAmount: 40,
        totalAmount: 888,
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        status: 'ready',
        createdAt: Date.now() - 35 * 60000,
        updatedAt: Date.now() - 5 * 60000,
        estimatedPrepMinutes: 20,
        readyAt: Date.now() - 5 * 60000,
      },
    ];
    sampleOrders.forEach(o => this.orders.set(o.id, o));
  }

  // Subscription for real-time updates
  subscribe(eventName: string | null, callback: (event: string, data: any) => void): () => void {
    const wrappedCallback = (event: string, data: any) => {
      if (eventName === null || eventName === event) {
        callback(event, data);
      }
    };
    this.subscribers.add(wrappedCallback);
    return () => this.subscribers.delete(wrappedCallback);
  }

  private emit(event: string, data: any) {
    this.subscribers.forEach(cb => cb(event, data));
  }

  // Restaurant
  getRestaurant(): RestaurantSettings | null {
    return this.restaurant;
  }

  updateRestaurant(updates: Partial<RestaurantSettings>): RestaurantSettings | null {
    if (this.restaurant) {
      this.restaurant = { ...this.restaurant, ...updates };
      return this.restaurant;
    }
    return null;
  }

  // Categories
  getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCategory(id: string): Category | undefined {
    return this.categories.get(id);
  }

  // Products
  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  getProductsByCategory(categoryId: string): Product[] {
    return Array.from(this.products.values()).filter(p => p.categoryId === categoryId);
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const product = this.products.get(id);
    if (product) {
      const updated = { ...product, ...updates };
      this.products.set(id, updated);
      this.emit('PRODUCT_UPDATED', updated);
      return updated;
    }
    return null;
  }

  // Tables
  getTables(): Table[] {
    return Array.from(this.tables.values());
  }

  getTable(id: string): Table | undefined {
    return this.tables.get(id);
  }

  getTableByNumber(tableNumber: string): Table | undefined {
    return Array.from(this.tables.values()).find(t => t.tableNumber === tableNumber);
  }

  updateTableStatus(tableId: string, status: Table['status'], orderId?: string): Table | null {
    const table = this.tables.get(tableId);
    if (table) {
      const updated = { ...table, status, activeOrderId: orderId };
      this.tables.set(tableId, updated);
      this.emit('TABLE_UPDATED', updated);
      return updated;
    }
    return null;
  }

  // Coupons
  getCoupon(code: string): Coupon | undefined {
    return this.coupons.get(code.toUpperCase());
  }

  getAllCoupons(): Coupon[] {
    return Array.from(this.coupons.values());
  }

  // Orders
  getOrders(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return Array.from(this.orders.values()).find(o => o.orderNumber === orderNumber);
  }

  getActiveOrders(): Order[] {
    return Array.from(this.orders.values()).filter(o =>
      !['completed', 'cancelled', 'served'].includes(o.status)
    ).sort((a, b) => a.createdAt - b.createdAt);
  }

  updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated = { ...order, ...updates, updatedAt: Date.now() };
    this.orders.set(orderId, updated);
    this.emit('ORDER_UPDATED', updated);
    return updated;
  }

  createOrder(data: {
    tableNumber: string;
    customerName: string;
    customerPhone?: string;
    items: any[];
    couponCode?: string;
    paymentMethod: string;
    paymentStatus?: any;
    specialInstructions?: string;
  }): Order {
    const table = this.getTableByNumber(data.tableNumber);
    const restaurant = this.getRestaurant();
    const taxRate = restaurant?.taxRatePercent || 5;
    const serviceRate = restaurant?.isServiceChargeEnabled ? (restaurant.serviceChargePercent || 5) : 0;

    // Calculate prices
    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = this.products.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      let unitPrice = product.price;
      if (item.variantId && product.variants) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (variant) unitPrice = variant.price;
      }
      if (item.addonIds && item.addonIds.length > 0 && product.addons) {
        product.addons.forEach(addon => {
          if (item.addonIds.includes(addon.id)) unitPrice += addon.price;
        });
      }

      subtotal += unitPrice * item.quantity;

      return {
        id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        isVeg: product.isVeg,
        unitPrice,
        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
        customization: item.customization,
      };
    });

    // Apply coupon
    let discountAmount = 0;
    if (data.couponCode) {
      const coupon = this.getCoupon(data.couponCode);
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.min(
            (subtotal * coupon.discountValue) / 100,
            coupon.maxDiscountAmount || Infinity
          );
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const serviceChargeAmount = (afterDiscount * serviceRate) / 100;
    const totalAmount = afterDiscount + taxAmount + serviceChargeAmount;

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: generateOrderNumber(),
      restaurantId: 'rest_001',
      tableId: table?.id || '',
      tableNumber: data.tableNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      items: orderItems,
      subtotal,
      discountAmount,
      couponCode: data.couponCode,
      taxAmount,
      serviceChargeAmount,
      totalAmount,
      paymentMethod: data.paymentMethod as any,
      paymentStatus: data.paymentMethod === 'pay_at_counter' ? 'pending' : 'pending',
      status: 'placed',
      specialInstructions: data.specialInstructions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedPrepMinutes: restaurant?.estimatedPrepTimeMinutes || 20,
    };

    this.orders.set(order.id, order);

    // Update table status
    if (table) {
      this.updateTableStatus(table.id, 'occupied', order.id);
    }

    this.emit('ORDER_CREATED', order);
    return order;
  }

  updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated: Order = {
      ...order,
      status,
      updatedAt: Date.now(),
      ...(rejectionReason && { rejectionReason }),
      ...(status === 'ready' && { readyAt: Date.now() }),
      ...(status === 'completed' && { completedAt: Date.now() }),
    };

    // Handle table status updates
    const table = this.tables.get(order.tableId);
    if (table) {
      if (['completed', 'cancelled'].includes(status)) {
        this.updateTableStatus(table.id, 'available');
      } else if (status === 'served') {
        this.updateTableStatus(table.id, 'billing');
      }
    }

    this.orders.set(orderId, updated);
    this.emit('ORDER_STATUS_UPDATED', updated);
    return updated;
  }

  updatePaymentStatus(orderId: string, paymentStatus: Order['paymentStatus'], razorpayOrderId?: string, razorpayPaymentId?: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const updated: Order = {
      ...order,
      paymentStatus,
      updatedAt: Date.now(),
      ...(razorpayOrderId && { razorpayOrderId }),
      ...(razorpayPaymentId && { razorpayPaymentId }),
    };

    this.orders.set(orderId, updated);
    this.emit('PAYMENT_UPDATED', updated);
    return updated;
  }

  // Analytics
  getAnalytics(): DashboardAnalytics {
    const orders = this.getOrders();
    const tables = this.getTables();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const completedOrders = todayOrders.filter(o => o.status === 'completed' || o.status === 'served');
    const activeOrders = todayOrders.filter(o => !['completed', 'cancelled', 'served'].includes(o.status));

    const todaySales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? todaySales / completedOrders.length : 0;

    // Calculate hourly sales
    const hourlyData: { [key: string]: { sales: number; orders: number } } = {};
    for (let i = 11; i <= 23; i++) {
      hourlyData[`${i}:00`] = { sales: 0, orders: 0 };
    }
    todayOrders.forEach(o => {
      const hour = new Date(o.createdAt).getHours();
      if (hour >= 11 && hour <= 23) {
        const key = `${hour}:00`;
        if (hourlyData[key]) {
          hourlyData[key].sales += o.totalAmount;
          hourlyData[key].orders += 1;
        }
      }
    });

    // Calculate category breakdown
    const categorySales: { [key: string]: number } = {};
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const product = this.products.get(item.productId);
        if (product) {
          categorySales[product.categoryName || 'Other'] = (categorySales[product.categoryName || 'Other'] || 0) + item.subtotal;
        }
      });
    });

    const totalCategorySales = Object.values(categorySales).reduce((a, b) => a + b, 0);
    const categoryBreakdown = Object.entries(categorySales).map(([category, sales]) => ({
      category,
      sales,
      percentage: totalCategorySales > 0 ? Math.round((sales / totalCategorySales) * 100) : 0,
    }));

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: todayOrders.filter(o => o.paymentStatus === 'pending').length,
      averageOrderValue,
      salesGrowthPercent: 12.5,
      ordersGrowthPercent: 8.3,
      hourlySales: Object.entries(hourlyData).map(([hour, data]) => ({ hour, ...data })),
      categoryBreakdown,
    };
  }
}

// Singleton instance
export const store = new Database();
export type VegStatus = 'veg' | 'non-veg';

export interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  qrToken: string;
  qrCodeUrl?: string;
  status: 'available' | 'occupied' | 'billing';
  activeOrderId?: string;
  currentBill?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
  itemCount?: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Regular", "Medium", "Large"
  price: number;
}

export interface ProductAddon {
  id: string;
  name: string; // e.g. "Extra Truffle Cheese", "Avocado Dip"
  price: number;
  isVeg: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  price: number; // Base price in INR
  originalPrice?: number;
  image: string;
  isVeg: boolean;
  isBestseller: boolean;
  isChefSpecial: boolean;
  isAvailable: boolean; // Out of stock toggle
  preparationTimeMinutes: number;
  spiceLevel: 0 | 1 | 2 | 3; // 0=None, 1=Mild, 2=Medium, 3=Fiery
  portionSize: string; // e.g. "Serves 1-2", "350g", "4 pcs"
  ingredients: string[];
  variants?: ProductVariant[];
  addons?: ProductAddon[];
}

export interface CartCustomization {
  selectedVariant?: ProductVariant;
  selectedAddons: ProductAddon[];
  spiceLevel?: 0 | 1 | 2 | 3;
  specialInstructions?: string;
}

export interface CartItem {
  id: string; // generated unique cart item id (considers customizations)
  productId: string;
  product: Product;
  quantity: number;
  customization: CartCustomization;
  itemUnitPrice: number; // base + variant + addons
  totalPrice: number;
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'razorpay' | 'pay_at_counter' | 'upi';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  isVeg: boolean;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  customization?: CartCustomization;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "UP-1042"
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number; // 5% GST
  serviceChargeAmount: number; // 5% Service Charge
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  rejectionReason?: string;
  specialInstructions?: string;
  createdAt: string; // ISO string
  updatedAt: string;
  estimatedPrepMinutes: number;
  estimatedReadyTime: string; // ISO string
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 15 for 15% or 150 for ₹150
  minOrderValue: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  expiryDate?: string;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  gstNumber: string;
  fssaiNumber: string;
  openingHours: string;
  isRestaurantOpen: boolean;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number; // e.g. 5
  serviceChargePercent: number; // e.g. 5
  isServiceChargeEnabled: boolean;
  allowPayAtCounter: boolean;
  allowOnlinePayment: boolean;
  soundAlertsEnabled: boolean;
  estimatedPrepTimeMinutes: number;
  themeColor: string;
}

export interface DashboardAnalytics {
  todaySales: number;
  todayOrdersCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  averageOrderValue: number;
  salesGrowthPercent: number;
  ordersGrowthPercent: number;
  bestsellers: {
    productId: string;
    productName: string;
    category: string;
    count: number;
    revenue: number;
    image: string;
  }[];
  hourlySales: {
    hour: string;
    sales: number;
    orders: number;
  }[];
  recentOrders: Order[];
  categoryBreakdown: {
    category: string;
    sales: number;
    percentage: number;
  }[];
}

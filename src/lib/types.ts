// Core Types for Restaurant QR Ordering System

export type OrderStatus =
  | 'placed'      // Order just placed by customer
  | 'accepted'    // Kitchen accepted the order
  | 'preparing'   // Currently being prepared
  | 'ready'       // Ready for collection
  | 'served'      // Customer collected
  | 'completed'   // Order fully finished
  | 'cancelled';  // Order cancelled

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'razorpay' | 'upi' | 'card' | 'pay_at_counter';

export type VegStatus = 'veg' | 'non-veg';

export interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'billing';
  qrCode: string;
  activeOrderId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export interface ProductAddon {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isVeg: boolean;
  isBestseller: boolean;
  isChefSpecial: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  spiceLevel: 0 | 1 | 2 | 3;
  portionSize: string;
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
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  customization: CartCustomization;
  itemUnitPrice: number;
  totalPrice: number;
}

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
  orderNumber: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  taxAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  rejectionReason?: string;
  specialInstructions?: string;
  createdAt: number;
  updatedAt: number;
  estimatedPrepMinutes: number;
  estimatedReadyTime?: number;
  readyAt?: number;
  completedAt?: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
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
  taxRatePercent: number;
  serviceChargePercent: number;
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
  hourlySales: { hour: string; sales: number; orders: number }[];
  categoryBreakdown: { category: string; sales: number; percentage: number }[];
}
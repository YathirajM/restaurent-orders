import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem, Coupon } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function getElapsedMinutes(dateString: string): number {
  try {
    const past = new Date(dateString).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - past) / 60000));
  } catch {
    return 0;
  }
}

export function formatRelativeTime(dateString: string): string {
  const mins = getElapsedMinutes(dateString);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hr${hours > 1 ? "s" : ""} ago`;
}

export interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number; // 5% GST
  serviceChargeAmount: number; // 5% Service Charge
  totalAmount: number;
}

export function calculateOrderPricing(
  items: { unitPrice: number; quantity: number }[],
  coupon: Coupon | null,
  taxRatePercent = 5,
  serviceChargePercent = 5,
  isServiceChargeEnabled = true
): PricingBreakdown {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let discountAmount = 0;
  if (coupon && coupon.isActive && subtotal >= coupon.minOrderValue) {
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxRatePercent) / 100);
  const serviceChargeAmount = isServiceChargeEnabled
    ? Math.round((taxableAmount * serviceChargePercent) / 100)
    : 0;
  const totalAmount = taxableAmount + taxAmount + serviceChargeAmount;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    serviceChargeAmount,
    totalAmount,
  };
}

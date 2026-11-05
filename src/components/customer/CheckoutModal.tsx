"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { realtime } from "@/lib/realtime";
import { playNewOrderSound, playStatusUpdateSound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  X,
  CreditCard,
  Banknote,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { items, tableNumber, coupon, pricing, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "pay_at_counter">(
    "pay_at_counter"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTable = tableNumber || "04";

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#d97706", "#10b981", "#3b82f6"],
      });
    } catch {
      // ignore
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Submit order to server
      const payload = {
        tableNumber: currentTable,
        customerName: customerName.trim() || "Guest",
        customerPhone: customerPhone.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.customization.selectedVariant?.id,
          addonIds: item.customization.selectedAddons.map((a) => a.id),
          spiceLevel: item.customization.spiceLevel,
          specialInstructions: item.customization.specialInstructions,
        })),
        couponCode: coupon?.code,
        paymentMethod: paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to place order");
      }

      const createdOrder = data.data;

      // 2. Handle Payment
      if (paymentMethod === "razorpay") {
        // Initiate Razorpay checkout order
        const rzpRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrder.id }),
        });
        const rzpData = await rzpRes.json();

        // In test/demo mode: simulate payment verification
        const mockPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
        await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrder.id,
            razorpayPaymentId: mockPaymentId,
            razorpayOrderId: rzpData.data?.orderId,
          }),
        });

        createdOrder.paymentStatus = "paid";
        createdOrder.razorpayPaymentId = mockPaymentId;
      }

      // 3. Emit real-time event to Admin Dashboard and Kitchen Display
      realtime.emit("ORDER_CREATED", createdOrder);
      playNewOrderSound();

      // 4. Clear cart & show confetti
      clearCart();
      triggerCelebration();

      // 5. Navigate to live tracking screen
      onClose();
      router.push(`/order/${createdOrder.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong while placing your order.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-background border border-border shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                Confirm Dine-in Order
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Table {currentTable} • {items.length} items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handlePlaceOrder} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {errorMessage && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Table locked notification */}
          <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Lock className="h-4 w-4 text-amber-600" />
              <span>Ordering for Table {currentTable}</span>
            </div>
            <span className="text-[11px] font-bold text-amber-600 bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded-md">
              QR Verified
            </span>
          </div>

          {/* Ordered Dishes Preview with Photos */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Your Selection ({items.length} dishes)</span>
              <span className="text-amber-600">{formatCurrency(pricing.totalAmount)}</span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-xl bg-card p-2 border border-border/50 shadow-2xs"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={item.product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75"}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {item.product.name}
                      </p>
                      <span className="text-xs font-bold text-foreground">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-amber-600">{item.quantity}x</span>
                      {item.customization.selectedVariant && (
                        <span>• {item.customization.selectedVariant.name}</span>
                      )}
                      {item.customization.selectedAddons && item.customization.selectedAddons.length > 0 && (
                        <span className="truncate">• +{item.customization.selectedAddons.length} add-ons</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-input bg-muted/30 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Phone Number (for digital bill)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 98765 43210"
                className="w-full rounded-xl border border-input bg-muted/30 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Special Kitchen Notes */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              General Kitchen Request
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Bring food together, serve beverages first..."
              className="w-full rounded-xl border border-input bg-muted/30 px-3.5 py-2 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground tracking-wider uppercase mb-2">
              Select Payment Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Pay at Counter */}
              <button
                type="button"
                onClick={() => setPaymentMethod("pay_at_counter")}
                className={`flex flex-col rounded-2xl p-3.5 border text-left transition-all ${
                  paymentMethod === "pay_at_counter"
                    ? "border-amber-500 bg-amber-500/10 text-foreground font-semibold shadow-xs"
                    : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-foreground">
                      Pay After Meal
                    </span>
                  </div>
                  {paymentMethod === "pay_at_counter" && (
                    <CheckCircle2 className="h-4 w-4 text-amber-500 fill-amber-500 text-white" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Settle bill at table or counter via Cash, UPI, or Card
                </p>
              </button>

              {/* Pay Online (Razorpay Test Mode) */}
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`flex flex-col rounded-2xl p-3.5 border text-left transition-all ${
                  paymentMethod === "razorpay"
                    ? "border-amber-500 bg-amber-500/10 text-foreground font-semibold shadow-xs"
                    : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-foreground">
                      Pay Online Now
                    </span>
                  </div>
                  {paymentMethod === "razorpay" && (
                    <CheckCircle2 className="h-4 w-4 text-amber-500 fill-amber-500 text-white" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Instant UPI, Cards & NetBanking via Razorpay
                </p>
              </button>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-xs space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Items Total ({items.length} items)</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </div>
            {pricing.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Savings ({coupon?.code})</span>
                <span>-{formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Taxes & Charges (GST + Service)</span>
              <span>{formatCurrency(pricing.taxAmount + pricing.serviceChargeAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border/60 font-black text-sm text-foreground">
              <span>Total Payable</span>
              <span className="font-display text-base text-amber-600">
                {formatCurrency(pricing.totalAmount)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-white font-bold shadow-lg shadow-amber-500/25 hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Ticket to Kitchen...</span>
                </>
              ) : (
                <>
                  <span>Place Order • {formatCurrency(pricing.totalAmount)}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Your ticket will immediately appear on the kitchen display & admin console
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

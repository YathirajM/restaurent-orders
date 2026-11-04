"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Ticket,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  onProceedToCheckout,
}: CartDrawerProps) {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    tableNumber,
    coupon,
    applyCoupon,
    removeCoupon,
    pricing,
    itemCount,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(
    null
  );
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) return;
    setIsApplying(true);
    setCouponMsg(null);
    const res = await applyCoupon(code);
    setIsApplying(false);
    if (res.success) {
      setCouponMsg({ text: res.message, error: false });
      setCouponInput("");
    } else {
      setCouponMsg({ text: res.message, error: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="relative w-screen max-w-md bg-background border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  Your Table Order
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {tableNumber ? `Table ${tableNumber} • Dine-in` : "Select Table"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Content */}
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-500 mb-4">
                <ShoppingBag className="h-10 w-10 opacity-60" />
              </div>
              <h4 className="font-display text-lg font-bold text-foreground">
                Your cart is empty
              </h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Explore our chef-curated menu and add your favorite dishes to begin your dine-in experience.
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 no-scrollbar">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-xs hover:border-border transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1">
                            {item.product.name}
                          </h4>
                          {/* Customization Details */}
                          <div className="mt-0.5 space-y-0.5 text-[10px] text-muted-foreground">
                            {item.customization.selectedVariant && (
                              <p className="font-medium text-amber-600">
                                Size: {item.customization.selectedVariant.name}
                              </p>
                            )}
                            {item.customization.selectedAddons &&
                              item.customization.selectedAddons.length > 0 && (
                                <p>
                                  Add-ons:{" "}
                                  {item.customization.selectedAddons
                                    .map((a) => a.name)
                                    .join(", ")}
                                </p>
                              )}
                            {item.customization.specialInstructions && (
                              <p className="italic text-neutral-400">
                                &ldquo;{item.customization.specialInstructions}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Remove item */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground/60 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Bottom Row: Unit Price & Quantity */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-display text-xs sm:text-sm font-bold text-foreground">
                          {formatCurrency(item.totalPrice)}
                        </span>

                        <div className="flex items-center rounded-xl bg-muted p-0.5 border border-border/60">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-background transition-colors text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-background transition-colors text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Coupon Code Section */}
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">
                      Apply Promo Coupon
                    </span>
                  </div>

                  {coupon ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{coupon.code} Applied</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          (-{formatCurrency(pricing.discountAmount)})
                        </span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="e.g. WELCOME20"
                          className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground uppercase font-bold focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleApplyCoupon()}
                          disabled={isApplying || !couponInput.trim()}
                          className="rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 disabled:opacity-50 transition-all"
                        >
                          {isApplying ? "..." : "Apply"}
                        </button>
                      </div>

                      {/* Quick Offer Chips */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleApplyCoupon("WELCOME20")}
                          className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 hover:bg-amber-500/20"
                        >
                          WELCOME20 (20% Off)
                        </button>
                        <button
                          onClick={() => handleApplyCoupon("FLAT100")}
                          className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 hover:bg-amber-500/20"
                        >
                          FLAT100 (₹100 Off)
                        </button>
                      </div>

                      {couponMsg && (
                        <p
                          className={`mt-1.5 text-[11px] font-medium ${
                            couponMsg.error ? "text-red-500" : "text-emerald-600"
                          }`}
                        >
                          {couponMsg.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Clear Cart link */}
                <div className="text-right">
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    Clear Order
                  </button>
                </div>
              </div>

              {/* Bottom Bill Breakdown & Checkout Bar */}
              <div className="border-t border-border bg-background p-4 sm:p-5 space-y-3">
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Item Subtotal ({itemCount} items)</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(pricing.subtotal)}
                    </span>
                  </div>

                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Promo Discount ({coupon?.code})</span>
                      <span>-{formatCurrency(pricing.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>GST (5% Restaurant Tax)</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(pricing.taxAmount)}
                    </span>
                  </div>

                  {pricing.serviceChargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Staff Service Charge (5%)</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(pricing.serviceChargeAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-extrabold text-foreground">
                    <span>Grand Total</span>
                    <span className="font-display text-base text-amber-600">
                      {formatCurrency(pricing.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => {
                    onClose();
                    onProceedToCheckout();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl bg-amber-500 p-3.5 text-white font-bold shadow-lg shadow-amber-500/25 hover:bg-amber-600 active:scale-98 transition-all"
                >
                  <span className="text-xs sm:text-sm">Proceed to Checkout</span>
                  <div className="flex items-center gap-1.5 font-display text-sm sm:text-base font-black">
                    <span>{formatCurrency(pricing.totalAmount)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

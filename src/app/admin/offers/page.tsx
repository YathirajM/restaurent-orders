"use client";

import React, { useState, useEffect } from "react";
import { Coupon } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Percent, Ticket, Sparkles, CheckCircle2, Clock, X } from "lucide-react";

export default function AdminOffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New coupon modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("20");
  const [minOrder, setMinOrder] = useState("500");
  const [maxDiscount, setMaxDiscount] = useState("200");

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error("Coupons fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const newCoupon: Coupon = {
      id: `coupon_${Date.now()}`,
      code: code.trim().toUpperCase(),
      description,
      discountType,
      discountValue: parseFloat(discountValue) || 10,
      minOrderValue: parseFloat(minOrder) || 0,
      maxDiscountAmount: parseFloat(maxDiscount) || undefined,
      isActive: true,
      expiryDate: "2027-12-31",
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    setIsModalOpen(false);
    setCode("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Promotions & Discount Offers
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure coupons for bill discounts and minimum spend incentives.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600 self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((cp) => (
          <div
            key={cp.id}
            className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-black text-foreground tracking-wider uppercase">
                      {cp.code}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {cp.discountType === "percentage"
                        ? `${cp.discountValue}% Discount`
                        : `Flat ₹${cp.discountValue} Off`}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Active
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {cp.description}
              </p>

              <div className="mt-4 space-y-1 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Min Order Value:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(cp.minOrderValue)}
                  </span>
                </div>
                {cp.maxDiscountAmount && (
                  <div className="flex justify-between">
                    <span>Max Discount Cap:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(cp.maxDiscountAmount)}
                    </span>
                  </div>
                )}
                {cp.expiryDate && (
                  <div className="flex justify-between">
                    <span>Valid Until:</span>
                    <span className="text-foreground">{cp.expiryDate}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
              <span className="text-[10px] text-muted-foreground">Applied at checkout</span>
              <button
                onClick={() => setCoupons((prev) => prev.filter((c) => c.id !== cp.id))}
                className="text-xs text-red-500 hover:underline"
              >
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-background border border-border p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-display font-bold text-base text-foreground">
                New Promotion Coupon
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE25"
                  className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs uppercase font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Offer Description
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 25% off on orders above ₹800"
                  className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="20"
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="250"
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
                >
                  Launch Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

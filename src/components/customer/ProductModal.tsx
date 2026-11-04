"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, ProductAddon, ProductVariant } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { playStatusUpdateSound } from "@/lib/sound";
import { X, Plus, Minus, Clock, Flame, Check, Sparkles } from "lucide-react";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants?.[0]
  );
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<0 | 1 | 2 | 3>(
    product?.spiceLevel ?? 1
  );
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants?.[0]);
      setSelectedAddons([]);
      setSpiceLevel(product.spiceLevel ?? 1);
      setSpecialInstructions("");
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  // Calculate dynamic unit price
  let basePrice = product.price;
  if (selectedVariant) {
    basePrice = selectedVariant.price;
  }
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const grandTotal = unitPrice * quantity;

  const toggleAddon = (addon: ProductAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    addItem(product, quantity, {
      selectedVariant,
      selectedAddons,
      spiceLevel,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    playStatusUpdateSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl flex flex-col no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Hero Image */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30" />

          {/* Veg badge on photo */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-lg bg-background/90 px-2.5 py-1 text-xs font-bold backdrop-blur-md">
            {product.isVeg ? (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Veg
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-600" />
                Non-Veg
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Header Info */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-foreground">
                  {product.name}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                Portion: {product.portionSize}
              </span>
              <span className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                <Clock className="h-3 w-3 text-amber-500" />
                {product.preparationTimeMinutes} mins prep
              </span>
              {product.isBestseller && (
                <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2.5 py-1 font-bold text-amber-600">
                  <Flame className="h-3 w-3 fill-amber-500" />
                  Bestseller
                </span>
              )}
            </div>
          </div>

          {/* Ingredients list */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground tracking-wider uppercase mb-2">
                Ingredients & Fresh Produce
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground border border-border/40"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variants Selector (e.g. Regular / Large / Half / Full) */}
          {product.variants && product.variants.length > 0 && (
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-foreground tracking-wider uppercase">
                  Select Size / Portion
                </h4>
                <span className="text-[11px] font-semibold text-amber-600">
                  Required
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {product.variants.map((v) => {
                  const isChecked = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between rounded-2xl p-3 border text-left transition-all ${
                        isChecked
                          ? "border-amber-500 bg-amber-500/10 text-foreground font-semibold shadow-xs"
                          : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            isChecked
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-3" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{v.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {formatCurrency(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons and Extras */}
          {product.addons && product.addons.length > 0 && (
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-foreground tracking-wider uppercase">
                  Custom Add-ons & Dips
                </h4>
                <span className="text-[11px] text-muted-foreground">Optional</span>
              </div>
              <div className="space-y-2">
                {product.addons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`flex w-full items-center justify-between rounded-2xl p-3 border text-left transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-foreground shadow-xs font-medium"
                          : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                            isSelected
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-3" />}
                        </div>
                        <span className="text-xs sm:text-sm">{addon.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-amber-600">
                        +{formatCurrency(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level Selector */}
          <div className="border-t border-border/40 pt-4">
            <h4 className="text-xs font-bold text-foreground tracking-wider uppercase mb-2">
              Spice Level
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { lvl: 0, label: "Mild", icon: "🌱" },
                { lvl: 1, label: "Regular", icon: "🌶️" },
                { lvl: 2, label: "Spicy", icon: "🌶️🌶️" },
                { lvl: 3, label: "Extra Hot", icon: "🔥" },
              ].map((s) => (
                <button
                  key={s.lvl}
                  type="button"
                  onClick={() => setSpiceLevel(s.lvl as any)}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 text-center border transition-all ${
                    spiceLevel === s.lvl
                      ? "border-amber-500 bg-amber-500/10 text-foreground font-bold shadow-xs"
                      : "border-border/60 bg-card hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-[11px] mt-0.5">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Special Instructions Input */}
          <div className="border-t border-border/40 pt-4">
            <h4 className="text-xs font-bold text-foreground tracking-wider uppercase mb-1.5">
              Kitchen Instructions
            </h4>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less oil, extra crispy, no onion/garlic, dietary allergies..."
              rows={2}
              className="w-full rounded-2xl border border-input bg-muted/40 p-3 text-xs placeholder:text-muted-foreground focus:border-amber-500 focus:bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Modal Bottom Sticky Action Bar */}
        <div className="sticky bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-md flex items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center rounded-2xl bg-muted p-1 border border-border">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-background disabled:opacity-30 transition-colors text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-foreground">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-background transition-colors text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="flex flex-1 items-center justify-between rounded-2xl bg-amber-500 px-5 py-3 text-white font-bold shadow-lg shadow-amber-500/25 hover:bg-amber-600 active:scale-98 transition-all"
          >
            <span className="text-xs sm:text-sm">Add to Order</span>
            <span className="font-display text-sm sm:text-base font-extrabold">
              {formatCurrency(grandTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

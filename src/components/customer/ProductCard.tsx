"use client";

import React from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Flame, Award, Clock, Plus, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
}

export function ProductCard({ product, onOpenDetail }: ProductCardProps) {
  const { addItem, items } = useCart();

  const hasCustomizations =
    (product.variants && product.variants.length > 0) ||
    (product.addons && product.addons.length > 0) ||
    product.spiceLevel > 0;

  // Check how many of this product are in cart
  const cartQuantity = items
    .filter((i) => i.productId === product.id)
    .reduce((sum, i) => sum + i.quantity, 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;

    if (hasCustomizations) {
      onOpenDetail(product);
    } else {
      addItem(product, 1);
    }
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-amber-500/30 hover:-translate-y-1 cursor-pointer ${
        !product.isAvailable ? "opacity-60 grayscale-[40%]" : ""
      }`}
    >
      <div>
        {/* Top Image Container */}
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-108"
          />

          {/* Sold Out Overlay */}
          {!product.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-xs">
              <span className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-black tracking-wider text-white uppercase shadow-lg">
                Sold Out
              </span>
            </div>
          )}

          {/* Badges on Image */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {/* Veg / Non-Veg Icon */}
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/95 p-0.5 shadow-sm backdrop-blur-xs">
              {product.isVeg ? (
                <div className="flex h-4 w-4 items-center justify-center rounded-xs border-2 border-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                </div>
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded-xs border-2 border-red-600">
                  <div className="h-0 w-0 border-x-2 border-x-transparent border-b-3 border-b-red-600" />
                </div>
              )}
            </div>

            {/* Bestseller Badge */}
            {product.isBestseller && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Flame className="h-2.5 w-2.5 fill-white" />
                <span>Bestseller</span>
              </span>
            )}

            {/* Chef's Special Badge */}
            {product.isChefSpecial && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Award className="h-2.5 w-2.5 fill-white" />
                <span>Chef&apos;s Pick</span>
              </span>
            )}
          </div>

          {/* Prep Time pill */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>{product.preparationTimeMinutes}m</span>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </div>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Portion Size info */}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-0.5 font-medium">
              {product.portionSize}
            </span>
            {product.variants && product.variants.length > 0 && (
              <span className="text-amber-600 font-medium">
                {product.variants.length} Sizes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing & Add to Cart Action */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40">
        <div>
          <span className="text-xs text-muted-foreground">Price</span>
          <div className="font-display text-lg font-black text-foreground">
            {formatCurrency(product.price)}
          </div>
        </div>

        <div>
          {product.isAvailable ? (
            <button
              onClick={handleAddClick}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95 shadow-sm ${
                cartQuantity > 0
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25"
              }`}
            >
              {hasCustomizations ? (
                <>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Customize</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </>
              )}
              {cartQuantity > 0 && (
                <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.2 text-[10px] font-black">
                  {cartQuantity}
                </span>
              )}
            </button>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

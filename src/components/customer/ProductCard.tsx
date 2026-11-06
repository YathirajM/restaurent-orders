"use client";

import React from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";
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
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
        !product.isAvailable ? "opacity-60 grayscale-[40%]" : ""
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-108"
        />

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-2 left-2">
          {product.isVeg ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 border border-emerald-500">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 border border-red-500">
              <div className="h-0 w-0 border-x-2 border-x-transparent border-b-3 border-b-red-600" />
            </div>
          )}
        </div>

        {/* Bestseller Badge */}
        {product.isBestseller && (
          <div className="absolute top-2 right-2">
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Bestseller
            </span>
          </div>
        )}

        {/* Sold Out Overlay */}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Product Info - Clean like reference */}
      <div className="flex flex-col p-3">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          {product.name}
        </h3>

        {/* Price with clean styling */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* ADD Button - Clean and prominent */}
          <button
            onClick={handleAddClick}
            disabled={!product.isAvailable}
            className={`flex items-center justify-center rounded-lg px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              cartQuantity > 0
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white hover:bg-amber-600"
            } ${!product.isAvailable ? "bg-gray-300 cursor-not-allowed" : ""}`}
          >
            {cartQuantity > 0 ? (
              <span className="flex items-center gap-1">
                <span>{cartQuantity}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                ADD
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { items, addItem } = useCart();

  const cartQuantity = useMemo(() => {
    return items
      .filter(i => i.productId === product.id)
      .reduce((sum, i) => sum + i.quantity, 0);
  }, [items, product.id]);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;

    const hasVariants = product.variants && product.variants.length > 0;
    const hasAddons = product.addons && product.addons.length > 0;

    if (hasVariants || hasAddons) {
      onClick(product);
    } else {
      addItem(product, 1);
    }
  };

  if (!product.isAvailable) {
    return (
      <div className="relative rounded-2xl bg-gray-100 overflow-hidden opacity-60 grayscale">
        <div className="aspect-square relative">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-700 text-sm">{product.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
            SOLD OUT
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(product)}
      className="group rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className="aspect-square relative">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-2 left-2">
          {product.isVeg ? (
            <div className="w-5 h-5 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-600" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-100 border-2 border-red-600 flex items-center justify-center">
              <div className="w-0 h-0 border-x-2 border-x-transparent border-b-3 border-b-red-600" />
            </div>
          )}
        </div>

        {/* Bestseller Badge */}
        {product.isBestseller && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              Bestseller
            </span>
          </div>
        )}

        {/* Add Button Overlay */}
        <button
          onClick={handleAdd}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-amber-600 hover:bg-amber-500 hover:text-white transition-all active:scale-90"
        >
          {cartQuantity > 0 ? (
            <span className="font-bold text-lg">{cartQuantity}</span>
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
          {(product.variants?.length || 0) > 0 && (
            <span className="text-xs text-gray-500">Customizable</span>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface NavbarProps {
  tableNumber?: string | null;
  onSearchClick?: () => void;
  onCartClick?: () => void;
}

export function Navbar({ tableNumber, onSearchClick, onCartClick }: NavbarProps) {
  const { itemCount, subtotal } = useCart();
  const displayAmount = subtotal > 0 ? `₹${subtotal}` : 'Cart';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="font-bold text-gray-900">The Urban Plate</span>
            {tableNumber && (
              <span className="block text-xs text-amber-600 font-medium">
                Table {tableNumber}
              </span>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSearchClick}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={onCartClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-sm">{displayAmount}</span>
            {itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-amber-600 text-xs flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Search,
  Sparkles,
  QrCode,
  ChefHat,
  LayoutDashboard,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface NavbarProps {
  onSearchChange?: (query: string) => void;
  onOpenCart?: () => void;
  searchQuery?: string;
}

export function Navbar({ onSearchChange, onOpenCart, searchQuery = "" }: NavbarProps) {
  const { itemCount, pricing, tableNumber } = useCart();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href="/menu" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                The Urban Plate
              </span>
              <span className="hidden rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-500/20 sm:inline-block">
                Dine-in
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              Fine-Casual Gastro-Bistro
            </p>
          </div>
        </Link>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Table Indicator Badge */}
          {tableNumber ? (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20 shadow-sm animate-pulse-subtle">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Table {tableNumber}</span>
            </div>
          ) : (
            <Link
              href="/menu?table=04&token=demo"
              className="hidden md:flex items-center gap-1.5 rounded-full bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors border border-border"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Table 04 (Demo)</span>
            </Link>
          )}

          {/* Quick Demo Links (Admin & Kitchen) */}
          <div className="hidden lg:flex items-center gap-1 border-l border-r border-border/60 px-2 mx-1">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Open Admin Dashboard"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-blue-500" />
              <span>Admin SaaS</span>
            </Link>
            <Link
              href="/kds"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Open Kitchen Display System"
            >
              <ChefHat className="h-3.5 w-3.5 text-orange-500" />
              <span>Kitchen KDS</span>
            </Link>
          </div>

          {/* Search Toggle Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            aria-label="Search food items"
          >
            {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-white font-medium shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all active:scale-95"
            aria-label="View Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline-block text-xs font-bold">
              {itemCount > 0 ? formatCurrency(pricing.totalAmount) : "Cart"}
            </span>
            {itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-extrabold text-amber-600 shadow-sm">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-md animate-slide-up sm:px-6">
          <div className="mx-auto max-w-2xl relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search dishes (e.g. Butter Chicken, Truffle Pasta, Burger, Cold Coffee)..."
              className="w-full rounded-xl border border-input bg-muted/40 py-2.5 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-amber-500 focus:bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange && onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

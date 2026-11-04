"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartCustomization, CartItem, Coupon, Product } from "@/lib/types";
import { calculateOrderPricing, PricingBreakdown } from "@/lib/utils";

interface CartContextType {
  items: CartItem[];
  tableNumber: string | null;
  tableToken: string | null;
  setTableSession: (tableNumber: string, tableToken: string) => void;
  addItem: (product: Product, quantity?: number, customization?: CartCustomization) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  coupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  pricing: PricingBreakdown;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem("urban_plate_cart");
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
      const savedTable = localStorage.getItem("urban_plate_table");
      const savedToken = localStorage.getItem("urban_plate_token");
      if (savedTable) setTableNumber(savedTable);
      if (savedToken) setTableToken(savedToken);

      const savedCoupon = localStorage.getItem("urban_plate_coupon");
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
    } catch (e) {
      console.warn("Could not load cart from storage", e);
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("urban_plate_cart", JSON.stringify(items));
    } catch (e) {
      console.warn("Could not save cart to storage", e);
    }
  }, [items, isInitialized]);

  // Save table session
  const setTableSession = (tbl: string, token: string) => {
    setTableNumber(tbl);
    setTableToken(token);
    try {
      localStorage.setItem("urban_plate_table", tbl);
      localStorage.setItem("urban_plate_token", token);
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const addItem = (
    product: Product,
    quantity = 1,
    customization: CartCustomization = { selectedAddons: [] }
  ) => {
    // Calculate unit price based on variant and add-ons
    let unitPrice = product.price;
    if (customization.selectedVariant) {
      unitPrice = customization.selectedVariant.price;
    }
    if (customization.selectedAddons && customization.selectedAddons.length > 0) {
      unitPrice += customization.selectedAddons.reduce((s, a) => s + a.price, 0);
    }

    // Generate unique ID that distinguishes items with different customizations
    const customizationKey = `${customization.selectedVariant?.id || ""}_${(customization.selectedAddons || [])
      .map((a) => a.id)
      .sort()
      .join("_")}_${customization.spiceLevel ?? ""}_${customization.specialInstructions || ""}`;
    const cartItemId = `${product.id}__${customizationKey}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === cartItemId);
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + quantity;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return next;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          product,
          quantity,
          customization,
          itemUnitPrice: unitPrice,
          totalPrice: quantity * unitPrice,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...item,
              quantity: nextQty,
              totalPrice: nextQty * item.itemUnitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    try {
      localStorage.removeItem("urban_plate_cart");
      localStorage.removeItem("urban_plate_coupon");
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const applyCoupon = async (code: string) => {
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (data.success && data.data?.coupon) {
        setCoupon(data.data.coupon);
        localStorage.setItem("urban_plate_coupon", JSON.stringify(data.data.coupon));
        return { success: true, message: `Coupon applied: -₹${data.data.discount}` };
      } else {
        return { success: false, message: data.error || "Invalid coupon" };
      }
    } catch {
      return { success: false, message: "Network error validating coupon" };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    try {
      localStorage.removeItem("urban_plate_coupon");
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const pricing = calculateOrderPricing(
    items.map((i) => ({ unitPrice: i.itemUnitPrice, quantity: i.quantity })),
    coupon
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        tableNumber,
        tableToken,
        setTableSession,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        coupon,
        applyCoupon,
        removeCoupon,
        pricing,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

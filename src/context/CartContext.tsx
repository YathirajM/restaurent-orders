"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { CartItem, Product, CartCustomization } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, customization?: CartCustomization) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('urban_plate_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load cart:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('urban_plate_cart', JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = useCallback((product: Product, quantity = 1, customization: CartCustomization = { selectedAddons: [] }) => {
    let unitPrice = product.price;
    if (customization.selectedVariant) {
      unitPrice = customization.selectedVariant.price;
    }
    if (customization.selectedAddons?.length) {
      unitPrice += customization.selectedAddons.reduce((sum, a) => sum + a.price, 0);
    }

    const customizationKey = `${customization.selectedVariant?.id || ''}_${(customization.selectedAddons || []).map(a => a.id).sort().join('_')}_${customization.spiceLevel ?? ''}_${customization.specialInstructions || ''}`;
    const itemId = `${product.id}__${customizationKey}`;

    setItems(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + quantity, totalPrice: (i.quantity + quantity) * unitPrice }
            : i
        );
      }
      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        product,
        quantity,
        customization,
        itemUnitPrice: unitPrice,
        totalPrice: quantity * unitPrice,
      };
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setItems(prev => {
      return prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty, totalPrice: newQty * item.itemUnitPrice };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.totalPrice, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
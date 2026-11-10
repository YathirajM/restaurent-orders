"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { CategoryBar } from '@/components/CategoryBar';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { useCart } from '@/context/CartContext';
import { store } from '@/lib/store';
import type { Product } from '@/lib/types';

export default function MenuPage() {
  const searchParams = useSearchParams();
  const tableToken = searchParams.get('table') || 'T1';
  const { selectedProduct, openProduct, closeProduct, cartOpen, openCart, closeCart } = useCart();

  const [categories, setCategories] = useState(store.getCategories());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Update categories on store change
  useEffect(() => {
    const unsubscribe = store.subscribe(null, () => {
      setCategories([...store.getCategories()]);
    });
    return () => unsubscribe();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let products = [...store.getProducts()];

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(p => p.categoryId === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Only show available
    products = products.filter(p => p.isAvailable);

    return products;
  }, [selectedCategory, searchQuery]);

  const handleProductClick = (product: Product) => {
    openProduct(product);
  };

  const handleCheckoutClose = () => {
    setCheckoutOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onCartClick={openCart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tableToken={tableToken}
      />

      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Categories */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 mb-2">
          {categories.slice(0, 5).map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleProductClick}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No products found</p>
          </div>
        )}
      </main>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={closeProduct}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={closeCart}
        onCheckout={() => {
          closeCart();
          setCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={handleCheckoutClose}
        tableNumber={tableToken}
      />
    </div>
  );
}
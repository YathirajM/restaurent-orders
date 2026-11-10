"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { X, Minus, Plus, Clock } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0]);
  const [selectedAddons, setSelectedAddons] = useState<typeof product.addons>([]);
  const [spiceLevel, setSpiceLevel] = useState<0 | 1 | 2 | 3>(product?.spiceLevel || 0);
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!product) return null;

  const basePrice = selectedVariant?.price || product.price;
  const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (basePrice + addonsPrice) * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity, {
      selectedVariant,
      selectedAddons,
      spiceLevel,
      specialInstructions: specialInstructions || undefined,
    });
    onClose();
  };

  const toggleAddon = (addon: typeof product.addons[0]) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up sm:animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="relative h-56 sm:h-64">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Veg/Non-Veg Badge */}
          <div className="absolute bottom-4 left-4">
            {product.isVeg ? (
              <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-600 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-600 flex items-center justify-center">
                <div className="w-0 h-0 border-x-3 border-x-transparent border-b-4 border-b-red-600" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-224px)]">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          </div>

          {/* Prep Time & Spice Level */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{product.preparationTimeMinutes} mins</span>
            </div>
            {product.spiceLevel > 0 && (
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(level => (
                  <span
                    key={level}
                    className={`w-2 h-2 rounded-full ${
                      level <= product.spiceLevel ? 'bg-red-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-600 ml-1">
                  {product.spiceLevel === 1 ? 'Mild' : product.spiceLevel === 2 ? 'Medium' : 'Hot'}
                </span>
              </div>
            )}
          </div>

          {/* Size Options */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-5">
              <h3 className="font-semibold text-gray-900 mb-2">Choose Size</h3>
              <div className="flex gap-2">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {variant.name}
                    <span className="block text-xs opacity-70">₹{variant.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra Toppings */}
          {product.addons && product.addons.length > 0 && (
            <div className="mb-5">
              <h3 className="font-semibold text-gray-900 mb-2">Extra Toppings</h3>
              <div className="space-y-2">
                {product.addons.map(addon => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {addon.isVeg ? (
                          <div className="w-4 h-4 rounded-full bg-green-100 border border-green-600 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-red-100 border border-red-600 flex items-center justify-center">
                            <div className="w-0 h-0 border-x-1.5 border-x-transparent border-b-2 border-b-red-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900">{addon.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">+₹{addon.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level */}
          {product.spiceLevel > 0 && (
            <div className="mb-5">
              <h3 className="font-semibold text-gray-900 mb-2">Spice Level</h3>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map(level => (
                  <button
                    key={level}
                    onClick={() => setSpiceLevel(level as 0 | 1 | 2 | 3)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      spiceLevel === level
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === 0 ? 'None' : level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any allergies or special requests?"
              className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-amber-500"
              rows={2}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold text-gray-900">₹{totalPrice}</div>
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
          >
            Add to Cart - ₹{totalPrice}
          </button>
        </div>
      </div>
    </div>
  );
}
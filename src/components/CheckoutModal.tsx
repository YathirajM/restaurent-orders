"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CreditCard, Banknote, User, Phone, Loader2, CheckCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { realtime } from '@/lib/realtime';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
}

export function CheckoutModal({ isOpen, onClose, tableNumber }: CheckoutModalProps) {
  const router = useRouter();
  const { items, clearCart, subtotal } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'pay_at_counter'>('pay_at_counter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const discountAmount = 0;
  const taxAmount = subtotal * 0.05;
  const serviceCharge = subtotal * 0.05;
  const total = subtotal - discountAmount + taxAmount + serviceCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        tableNumber,
        customerName: customerName.trim() || 'Guest',
        customerPhone: customerPhone.trim() || undefined,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.customization.selectedVariant?.id,
          addonIds: item.customization.selectedAddons.map(a => a.id),
          spiceLevel: item.customization.spiceLevel,
          specialInstructions: item.customization.specialInstructions,
        })),
        paymentMethod,
        specialInstructions: specialInstructions.trim() || undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to place order');
      }

      const order = data.data;

      // If Razorpay, initiate payment
      if (paymentMethod === 'razorpay') {
        const payRes = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id }),
        });
        const payData = await payRes.json();

        if (payData.success) {
          // In test mode, simulate payment
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              paymentId: `pay_${Date.now()}`,
              orderId: payData.data.orderId,
            }),
          });
        }
      }

      // Emit real-time event and clear cart
      realtime.emit('ORDER_CREATED', order);
      clearCart();
      onClose();
      router.push(`/order/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Checkout</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Table Info */}
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
            <span className="font-semibold">Table {tableNumber}</span>
            <span className="text-amber-600">• {items.length} items</span>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="For order updates"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Special instructions for the kitchen..."
                rows={2}
                className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pay_at_counter')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === 'pay_at_counter'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm">Pay at Counter</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Cash, UPI, or Card</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm">Pay Online</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">UPI, Cards, NetBanking</p>
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-3 rounded-xl bg-gray-50 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST + Service (10%)</span>
              <span>₹{taxAmount + serviceCharge}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>Place Order • ₹{total}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
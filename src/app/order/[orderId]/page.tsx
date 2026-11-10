"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Clock, Utensils, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { store } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils';
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types';

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

const statusSteps: { status: OrderStatus; label: string; icon: typeof Clock }[] = [
  { status: 'confirmed', label: 'Order Confirmed', icon: Clock },
  { status: 'preparing', label: 'Preparing', icon: Utensils },
  { status: 'ready', label: 'Ready', icon: CheckCircle },
  { status: 'completed', label: 'Completed', icon: CheckCircle },
];

export default function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Fetch order from store
    const fetchOrder = () => {
      const foundOrder = store.getOrderById(resolvedParams.orderId);
      if (foundOrder) {
        setOrder(foundOrder);

        // Determine current step
        const statusIndex = statusSteps.findIndex(s => s.status === foundOrder.status);
        setCurrentStep(statusIndex >= 0 ? statusIndex : 0);
      }
    };

    fetchOrder();

    // Subscribe to updates
    const unsubscribe = store.subscribe('orders', fetchOrder);

    return () => unsubscribe();
  }, [resolvedParams.orderId]);

  // Poll for updates
  useEffect(() => {
    if (!order) return;

    const interval = setInterval(() => {
      const updatedOrder = store.getOrderById(resolvedParams.orderId);
      if (updatedOrder) {
        setOrder(updatedOrder);
        const statusIndex = statusSteps.findIndex(s => s.status === updatedOrder.status);
        setCurrentStep(statusIndex >= 0 ? statusIndex : 0);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order, resolvedParams.orderId]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-gray-600 mt-2">Loading order...</p>
        </div>
      </div>
    );
  }

  const statusIndex = statusSteps.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/menu?table=${order.tableNumber}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Menu</span>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Order Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 ${
              order.status === 'ready' ? 'bg-green-100' :
              order.status === 'preparing' ? 'bg-amber-100' :
              'bg-blue-100'
            }`}>
              {order.status === 'ready' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : order.status === 'preparing' ? (
                <Utensils className="w-8 h-8 text-amber-600" />
              ) : (
                <Clock className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {order.status === 'ready' ? 'Your Order is Ready!' :
               order.status === 'preparing' ? 'Preparing Your Food' :
               order.status === 'completed' ? 'Order Completed' :
               'Order Confirmed'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Order #{order.orderNumber}
            </p>
          </div>

          {/* Status Timeline */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= statusIndex;
                const isCurrent = index === statusIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.status} className="relative flex items-start gap-4">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? step.status === 'ready' ? 'bg-green-500' :
                          step.status === 'preparing' ? 'bg-amber-500' :
                          'bg-blue-500'
                        : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <StepIcon className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <div className={isCompleted ? 'opacity-100' : 'opacity-50'}>
                      <p className="font-medium text-gray-900">{step.label}</p>
                      {isCurrent && (
                        <p className="text-sm text-gray-600 mt-0.5">In progress...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">Order Details</h2>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.quantity}x {item.productName}
                  </p>
                  {(item.variantName || item.addonNames.length > 0) && (
                    <p className="text-sm text-gray-500">
                      {[item.variantName, ...item.addonNames].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax & Service</span>
              <span>{formatCurrency(order.taxAmount + order.serviceCharge)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                order.paymentStatus === 'paid' ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                <CreditCard className={`w-5 h-5 ${
                  order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Payment</p>
                <p className="text-sm text-gray-600">
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Pay at Counter'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.paymentStatus === 'paid'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>

          {order.paymentMethod === 'pay_at_counter' && (
            <p className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded-xl">
              Please pay at the counter when collecting your order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
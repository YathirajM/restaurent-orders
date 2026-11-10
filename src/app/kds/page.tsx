"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { store } from '@/lib/store';
import { formatTime } from '@/lib/utils';
import type { Order, OrderStatus } from '@/lib/types';

export default function KDSPage() {
  const searchParams = useSearchParams();
  const secret = searchParams.get('secret');

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Simple auth check (in production, use proper auth)
  if (secret !== 'kds123') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Kitchen Display System</h1>
          <p className="text-gray-400">Access Restricted</p>
          <p className="text-sm text-gray-500 mt-2">Add ?secret=kds123 to URL</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadOrders = () => {
      const allOrders = store.getOrders();
      // Show placed, accepted, preparing orders
      const activeOrders = allOrders.filter(o =>
        ['placed', 'accepted', 'preparing'].includes(o.status)
      ).sort((a, b) => a.createdAt - b.createdAt);
      setOrders(activeOrders);
    };

    loadOrders();
    const unsubscribe = store.subscribe(null, loadOrders);

    // Refresh every 30 seconds even without updates
    const interval = setInterval(loadOrders, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    store.updateOrder(orderId, { status });
  };

  const getTimeSinceOrder = (createdAt: number) => {
    const mins = Math.floor((Date.now() - createdAt) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min';
    return `${mins} mins`;
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return ['placed', 'accepted', 'preparing'].includes(o.status);
    if (filter === 'completed') return o.status === 'completed';
    return true;
  });

  // Group by status
  const placedOrders = filteredOrders.filter(o => o.status === 'placed' || o.status === 'accepted');
  const preparingOrders = filteredOrders.filter(o => o.status === 'preparing');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Kitchen Display</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {orders.length} active orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === 'active' ? 'bg-amber-500 text-white' : 'bg-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  filter === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-700'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filter === 'active' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New/Placed Orders */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                New Orders
                <span className="text-sm font-normal text-gray-400">({placedOrders.length})</span>
              </h2>

              <div className="space-y-4">
                {placedOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateOrderStatus}
                    getTimeSinceOrder={getTimeSinceOrder}
                  />
                ))}
                {placedOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No new orders
                  </div>
                )}
              </div>
            </div>

            {/* Preparing Orders */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                Preparing
                <span className="text-sm font-normal text-gray-400">({preparingOrders.length})</span>
              </h2>

              <div className="space-y-4">
                {preparingOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={updateOrderStatus}
                    getTimeSinceOrder={getTimeSinceOrder}
                  />
                ))}
                {preparingOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No orders being prepared
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Completed Orders */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-gray-800 rounded-xl p-4 border border-green-500/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">#{order.orderNumber}</span>
                  <span className="text-green-500 text-sm">Done</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  Table {order.tableNumber}
                </div>
                <div className="text-gray-400 text-sm">
                  {order.items.length} items • {getTimeSinceOrder(order.createdAt)}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No completed orders
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  getTimeSinceOrder: (createdAt: number) => string;
}

function OrderCard({ order, onStatusChange, getTimeSinceOrder }: OrderCardProps) {
  const isUrgent = (Date.now() - order.createdAt) > 15 * 60 * 1000; // 15 mins

  return (
    <div className={`rounded-xl overflow-hidden ${
      isUrgent ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-800'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isUrgent ? 'bg-red-600' :
        order.status === 'placed' ? 'bg-blue-600' :
        order.status === 'accepted' ? 'bg-blue-600' :
        order.status === 'preparing' ? 'bg-amber-600' : 'bg-green-600'
      }`}>
        <div>
          <span className="font-bold text-lg">#{order.orderNumber}</span>
          <span className="ml-3 text-sm opacity-90">Table {order.tableNumber}</span>
        </div>
        <div className="text-right">
          <div className="font-bold">{getTimeSinceOrder(order.createdAt)}</div>
          <div className="text-xs opacity-75">{formatTime(order.createdAt)}</div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4">
        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-bold text-amber-500 min-w-[24px]">
                {item.quantity}x
              </span>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                {item.customization?.selectedVariant && (
                  <p className="text-sm text-gray-400">
                    {item.customization.selectedVariant.name}
                  </p>
                )}
                {item.customization?.selectedAddons && item.customization.selectedAddons.length > 0 && (
                  <p className="text-sm text-gray-400">
                    Add-ons: {item.customization.selectedAddons.map(a => a.name).join(', ')}
                  </p>
                )}
                {item.customization?.spiceLevel && item.customization.spiceLevel > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    Spice: {'🌶️'.repeat(item.customization.spiceLevel)}
                  </p>
                )}
                {item.customization?.specialInstructions && (
                  <p className="text-xs text-yellow-400 mt-1 italic">
                    Note: {item.customization.specialInstructions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Customer Instructions */}
        {order.specialInstructions && (
          <div className="text-sm text-yellow-400 italic p-2 bg-yellow-400/10 rounded-lg mb-4">
            Customer: {order.specialInstructions}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {order.status === 'placed' && (
            <button
              onClick={() => onStatusChange(order.id, 'accepted')}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Accept
            </button>
          )}
          {order.status === 'accepted' && (
            <button
              onClick={() => onStatusChange(order.id, 'preparing')}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-medium transition-colors"
            >
              Start Preparing
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => onStatusChange(order.id, 'ready')}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              Mark Ready
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={() => onStatusChange(order.id, 'completed')}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
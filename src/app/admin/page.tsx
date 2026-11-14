"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Utensils, Users, ClipboardList,
  Settings, CreditCard, BarChart3, TrendingUp,
  Clock, DollarSign, ShoppingBag, AlertCircle
} from 'lucide-react';
import { store } from '@/lib/store';
import { formatCurrency, formatTime } from '@/lib/utils';
import type { Order } from '@/lib/types';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState(store.getRestaurant());

  useEffect(() => {
    const loadData = () => {
      const orders = store.getOrders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = orders.filter(o => new Date(o.createdAt).getTime() >= today.getTime());
      const paidOrders = orders.filter(o => o.paymentStatus === 'paid');

      setRecentOrders(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10));
      setPendingOrders(orders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.status)));

      // Calculate stats
      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: paidOrders.filter(o => new Date(o.createdAt).getTime() >= today.getTime()).reduce((sum, o) => sum + o.totalAmount, 0),
        totalRevenue: paidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        pendingOrders: pendingOrders.length,
        activeOrders: orders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.status)).length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
      });

      setSettings(store.getRestaurant());
    };

    loadData();
    const unsubscribe = store.subscribe(null, loadData);
    return () => unsubscribe();
  }, []);

  const updateOrderStatus = (orderId: string, status: any) => {
    store.updateOrderStatus(orderId, status);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-amber-500">Admin Panel</h1>
            <p className="text-sm text-gray-500">Restaurant Management</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ClipboardList },
              { id: 'menu', label: 'Menu', icon: Utensils },
              { id: 'tables', label: 'Tables', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <a
              href="/kds?secret=kds123"
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"
            >
              <Utensils className="w-4 h-4" />
              Open KDS
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Today's Orders"
                  value={stats?.todayOrders || 0}
                  icon={ShoppingBag}
                  color="blue"
                />
                <StatCard
                  title="Today's Revenue"
                  value={formatCurrency(stats?.todayRevenue || 0)}
                  icon={DollarSign}
                  color="green"
                />
                <StatCard
                  title="Active Orders"
                  value={stats?.activeOrders || 0}
                  icon={Clock}
                  color="amber"
                />
                <StatCard
                  title="Pending Payment"
                  value={pendingOrders.filter(o => o.paymentStatus === 'pending').length}
                  icon={AlertCircle}
                  color="red"
                />
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Active Orders</h3>
                  <span className="text-sm text-gray-500">{pendingOrders.length} orders</span>
                </div>

                {pendingOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active orders
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">#{order.orderNumber} - Table {order.tableNumber}</div>
                          <div className="text-sm text-gray-500">{order.items.length} items • {order.customerName}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                          >
                            <option value="placed">Placed</option>
                            <option value="accepted">Accepted</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="served">Served</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Orders</h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Order</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Table</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Items</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{order.orderNumber}</td>
                        <td className="px-4 py-3">Table {order.tableNumber}</td>
                        <td className="px-4 py-3">{order.customerName}</td>
                        <td className="px-4 py-3">{order.items.length} items</td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatTime(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu Management</h2>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600">Products: {store.getProducts().length}</p>
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    Add Product
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {store.getProducts().map(product => (
                    <div key={product.id} className="p-4 border rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.isAvailable ? 'Active' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Table Management</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {store.getTables().map(table => (
                  <div key={table.id} className={`p-4 rounded-xl border-2 ${
                    table.status === 'occupied'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        table.status === 'occupied' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="font-bold">{table.tableNumber}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">Table {table.tableNumber}</p>
                      <p className="text-xs text-gray-400">Capacity: {table.capacity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold">{store.getOrders().length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed Orders</p>
                      <p className="text-2xl font-bold">{stats?.completedOrders || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
              <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                <h3 className="font-semibold text-gray-900 mb-4">Restaurant Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      defaultValue={settings?.name || ''}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Rate (%)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings?.taxRatePercent || 0}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Charge (%)
                    </label>
                    <input
                      type="number"
                      defaultValue={settings?.serviceChargePercent || 0}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                  </div>
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'amber' | 'red';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}
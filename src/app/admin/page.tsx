"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { DashboardAnalytics, Order, Table } from "@/lib/types";
import { formatCurrency, formatTime, formatRelativeTime } from "@/lib/utils";
import { realtime } from "@/lib/realtime";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  DollarSign,
  Users,
  Flame,
  ArrowRight,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [anRes, tblRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/tables"),
      ]);
      const anData = await anRes.json();
      const tblData = await tblRes.json();

      if (anData.success) setAnalytics(anData.data);
      if (tblData.success) setTables(tblData.data);
    } catch (err) {
      console.error("Dashboard data load error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time events to refresh KPIs
    const unsubOrder = realtime.subscribe("ORDER_CREATED", () => {
      fetchDashboardData();
    });
    const unsubStatus = realtime.subscribe("ORDER_STATUS_UPDATED", () => {
      fetchDashboardData();
    });

    const interval = setInterval(fetchDashboardData, 5000);

    return () => {
      unsubOrder();
      unsubStatus();
      clearInterval(interval);
    };
  }, []);

  if (isLoading || !analytics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-muted-foreground">
            Loading SaaS Analytics...
          </p>
        </div>
      </div>
    );
  }

  const occupiedTablesCount = tables.filter((t) => t.status !== "available").length;
  const occupancyPercent = Math.round((occupiedTablesCount / (tables.length || 12)) * 100);

  return (
    <div className="space-y-6">
      {/* Page Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Restaurant Operations Overview
          </h1>
          <p className="text-xs text-muted-foreground">
            Real-time business performance, kitchen metrics, and table sales.
          </p>
        </div>

        {/* Date Filter Badges */}
        <div className="flex items-center rounded-xl bg-card border border-border p-1 text-xs">
          <button className="rounded-lg bg-amber-500 px-3 py-1 font-bold text-white shadow-xs">
            Today
          </button>
          <button className="rounded-lg px-3 py-1 font-medium text-muted-foreground hover:text-foreground">
            Yesterday
          </button>
          <button className="rounded-lg px-3 py-1 font-medium text-muted-foreground hover:text-foreground">
            7 Days
          </button>
          <button className="rounded-lg px-3 py-1 font-medium text-muted-foreground hover:text-foreground">
            30 Days
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Today&apos;s Gross Sales
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-foreground">
            {formatCurrency(analytics.todaySales)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{analytics.salesGrowthPercent}% vs yesterday</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-foreground">
            {analytics.todayOrdersCount}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+{analytics.ordersGrowthPercent}% order volume</span>
          </div>
        </div>

        {/* Active Kitchen Orders */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Kitchen Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-foreground">
            {analytics.activeOrdersCount}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span>{analytics.pendingOrdersCount} unacknowledged tickets</span>
          </div>
        </div>

        {/* Table Occupancy & AOV */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Table Occupancy
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-display text-2xl font-black text-foreground">
            {occupancyPercent}%
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            {occupiedTablesCount} of {tables.length} tables currently seated (AOV: {formatCurrency(analytics.averageOrderValue)})
          </div>
        </div>
      </div>

      {/* Charts & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Bar Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-base text-foreground">
                Hourly Peak Revenue Trends
              </h3>
              <p className="text-xs text-muted-foreground">
                Dine-in lunch and dinner rush activity throughout the day
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">
              Peak: 8:00 PM – 10:00 PM
            </span>
          </div>

          {/* Simple Clean Responsive Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-2 pt-4">
            {analytics.hourlySales.map((item, idx) => {
              const maxVal = 15000;
              const heightPercent = Math.min(100, Math.round((item.sales / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{item.sales}
                  </div>
                  <div className="w-full bg-muted rounded-t-xl overflow-hidden h-40 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-amber-500 group-hover:bg-amber-400 rounded-t-xl transition-all duration-300 shadow-sm"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share & Top Dishes */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-foreground mb-1">
              Category Distribution
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Share of total sales across menu sections
            </p>

            <div className="space-y-3.5">
              {analytics.categoryBreakdown.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground">{cat.category}</span>
                    <span className="text-muted-foreground">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className={`h-full rounded-full ${
                        i === 0
                          ? "bg-amber-500"
                          : i === 1
                          ? "bg-orange-500"
                          : i === 2
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4">
            <Link
              href="/admin/menu"
              className="flex items-center justify-between text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors"
            >
              <span>Manage Dish Catalog & Stock</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Selling Dishes + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestselling Dishes */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
              <h3 className="font-display font-bold text-base text-foreground">
                Top Bestselling Dishes
              </h3>
            </div>
            <Link
              href="/admin/menu"
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {analytics.bestsellers.map((dish, i) => (
              <div
                key={dish.productId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 p-2.5 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    #{i + 1}
                  </span>
                  <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-muted">
                    {dish.image && (
                      <Image
                        src={dish.image}
                        alt={dish.productName}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {dish.productName}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {dish.category} • {dish.count} orders
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display text-xs font-black text-foreground">
                    {formatCurrency(dish.revenue)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Popular
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-foreground">
              Live Order Stream
            </h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
            >
              <span>Manage Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {analytics.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-black text-xs">
                    T{order.tableNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {order.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {order.items.length} items • {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display text-xs font-bold text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      order.status === "placed"
                        ? "bg-red-500/10 text-red-600"
                        : order.status === "accepted"
                        ? "bg-amber-500/10 text-amber-600"
                        : order.status === "preparing"
                        ? "bg-blue-500/10 text-blue-600"
                        : order.status === "ready"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

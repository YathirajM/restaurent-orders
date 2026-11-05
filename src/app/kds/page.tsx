"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/lib/types";
import { formatTime, getElapsedMinutes } from "@/lib/utils";
import { realtime } from "@/lib/realtime";
import { playNewOrderSound, playStatusUpdateSound } from "@/lib/sound";
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  LayoutDashboard,
  Utensils,
  Layers,
} from "lucide-react";

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "veg" | "urgent">("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("KDS failed to fetch orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen for new orders and status updates
    const unsubNew = realtime.subscribe("ORDER_CREATED", (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      if (soundEnabled) {
        playNewOrderSound();
      }
    });

    const unsubUpdate = realtime.subscribe("ORDER_STATUS_UPDATED", (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    // Auto polling interval every 3 seconds to guarantee sync
    const interval = setInterval(fetchOrders, 3000);

    return () => {
      unsubNew();
      unsubUpdate();
      clearInterval(interval);
    };
  }, [soundEnabled]);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.data : o))
        );
        realtime.emit("ORDER_STATUS_UPDATED", data.data);
        playStatusUpdateSound();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Filter orders by column
  const newOrders = orders.filter((o) => o.status === "placed");
  const acceptedOrders = orders.filter((o) => o.status === "accepted");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  const totalActiveTickets =
    newOrders.length + acceptedOrders.length + preparingOrders.length + readyOrders.length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* KDS Header Bar */}
      <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-black tracking-tight text-white">
                  The Urban Plate • KDS
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 animate-pulse">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Kitchen Display System • {totalActiveTickets} Active Tickets
              </p>
            </div>
          </div>

          {/* Quick Filters & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all ${
                soundEnabled
                  ? "bg-neutral-800 text-neutral-200 border-neutral-700 hover:bg-neutral-700"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                  <span className="hidden sm:inline">Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={fetchOrders}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title="Refresh Tickets"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Switch to Admin Dashboard */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Admin SaaS</span>
            </Link>

            {/* Customer Menu Link */}
            <Link
              href="/menu"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              <Utensils className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Menu View</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 4 Kanban Columns */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 min-w-[320px]">
          {/* Column 1: New Orders */}
          <div className="flex flex-col rounded-3xl bg-neutral-900/80 border border-neutral-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-white">
                  New Incoming
                </h2>
              </div>
              <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-xs font-black text-red-400">
                {newOrders.length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-170px)]">
              {newOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
                  <CheckCircle2 className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-xs">No pending new orders</p>
                </div>
              ) : (
                newOrders.map((ord) => (
                  <KDSTicketCard
                    key={ord.id}
                    order={ord}
                    nextActionLabel="Accept Order"
                    nextStatus="accepted"
                    onAdvance={() => updateStatus(ord.id, "accepted")}
                    accentColor="red"
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: Accepted Orders */}
          <div className="flex flex-col rounded-3xl bg-neutral-900/80 border border-neutral-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-white">
                  Acknowledged
                </h2>
              </div>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-black text-amber-400">
                {acceptedOrders.length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-170px)]">
              {acceptedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
                  <p className="text-xs">Queue clear</p>
                </div>
              ) : (
                acceptedOrders.map((ord) => (
                  <KDSTicketCard
                    key={ord.id}
                    order={ord}
                    nextActionLabel="Start Preparing"
                    nextStatus="preparing"
                    onAdvance={() => updateStatus(ord.id, "preparing")}
                    accentColor="amber"
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: In Preparation */}
          <div className="flex flex-col rounded-3xl bg-neutral-900/80 border border-neutral-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-white">
                  On The Stove / Prep
                </h2>
              </div>
              <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2.5 py-0.5 text-xs font-black text-blue-400">
                {preparingOrders.length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-170px)]">
              {preparingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
                  <p className="text-xs">Nothing cooking right now</p>
                </div>
              ) : (
                preparingOrders.map((ord) => (
                  <KDSTicketCard
                    key={ord.id}
                    order={ord}
                    nextActionLabel="Mark Dish Ready"
                    nextStatus="ready"
                    onAdvance={() => updateStatus(ord.id, "ready")}
                    accentColor="blue"
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 4: Ready to Serve */}
          <div className="flex flex-col rounded-3xl bg-neutral-900/80 border border-neutral-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <h2 className="font-display font-bold text-sm tracking-wide uppercase text-white">
                  Ready for Pickup
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black text-emerald-400">
                {readyOrders.length}
              </span>
            </div>

            <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar max-h-[calc(100vh-170px)]">
              {readyOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
                  <p className="text-xs">No pending pickups</p>
                </div>
              ) : (
                readyOrders.map((ord) => (
                  <KDSTicketCard
                    key={ord.id}
                    order={ord}
                    nextActionLabel="Delivered / Served"
                    nextStatus="served"
                    onAdvance={() => updateStatus(ord.id, "served")}
                    accentColor="emerald"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * High contrast ticket card designed for chef readability
 */
function KDSTicketCard({
  order,
  nextActionLabel,
  nextStatus,
  onAdvance,
  accentColor,
}: {
  order: Order;
  nextActionLabel: string;
  nextStatus: OrderStatus;
  onAdvance: () => void;
  accentColor: "red" | "amber" | "blue" | "emerald";
}) {
  const elapsedMins = getElapsedMinutes(order.createdAt);
  const isUrgent = elapsedMins >= 15;
  const isCritical = elapsedMins >= 25;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-lg transition-all ${
        isCritical
          ? "border-red-500 bg-red-950/30 animate-pulse"
          : isUrgent
          ? "border-amber-500/80 bg-neutral-800/90"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      {/* Top Card Info Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          {/* Prominent Table Number Callout */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-neutral-950 font-black text-sm shadow-md">
            {order.tableNumber}
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">
              Table {order.tableNumber}
            </h3>
            <span className="text-[11px] font-mono text-neutral-400">
              #{order.orderNumber}
            </span>
          </div>
        </div>

        {/* Elapsed Timer */}
        <div
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${
            isCritical
              ? "bg-red-500 text-white"
              : isUrgent
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-neutral-800 text-neutral-300"
          }`}
        >
          <Clock className="h-3 w-3" />
          <span>{elapsedMins}m</span>
        </div>
      </div>

      {/* Customer / Note Callout */}
      {order.specialInstructions && (
        <div className="mt-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-xs text-amber-300 font-semibold">
          Note: &ldquo;{order.specialInstructions}&rdquo;
        </div>
      )}

      {/* Items List */}
      <div className="my-3 space-y-2 text-xs">
        {order.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-2 border-b border-neutral-800/60 pb-2 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-2.5">
              {item.productImage && (
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800 border border-neutral-700/80 shadow-xs">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-neutral-800 text-amber-400 font-black text-xs">
                {item.quantity}
              </span>
              <div>
                <p className="font-bold text-white text-xs sm:text-sm leading-snug">
                  {item.productName}
                </p>

                {/* Customizations tags */}
                {item.customization && (
                  <div className="mt-0.5 space-y-0.5 text-[11px]">
                    {item.customization.selectedVariant && (
                      <span className="inline-block rounded-md bg-neutral-800 px-1.5 py-0.2 text-neutral-300 mr-1 font-semibold">
                        {item.customization.selectedVariant.name}
                      </span>
                    )}
                    {item.customization.selectedAddons &&
                      item.customization.selectedAddons.map((add, aIdx) => (
                        <span
                          key={aIdx}
                          className="inline-block rounded-md bg-orange-950/60 text-orange-300 border border-orange-500/30 px-1.5 py-0.2 mr-1 font-bold"
                        >
                          +{add.name}
                        </span>
                      ))}
                    {item.customization.spiceLevel !== undefined && (
                      <span className="inline-block rounded-md bg-red-950/50 text-red-300 px-1.5 py-0.2 mr-1 font-bold">
                        Spice Lvl: {item.customization.spiceLevel}
                      </span>
                    )}
                    {item.customization.specialInstructions && (
                      <p className="text-amber-400 italic">
                        &ldquo;{item.customization.specialInstructions}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <span className="text-[10px] text-neutral-500 font-medium">
              {item.isVeg ? "VEG" : "NON-VEG"}
            </span>
          </div>
        ))}
      </div>

      {/* Big Action Button for Touch Screens */}
      <button
        onClick={onAdvance}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all active:scale-98 shadow-md ${
          accentColor === "red"
            ? "bg-red-600 hover:bg-red-500 text-white"
            : accentColor === "amber"
            ? "bg-amber-500 hover:bg-amber-400 text-neutral-950"
            : accentColor === "blue"
            ? "bg-blue-600 hover:bg-blue-500 text-white"
            : "bg-emerald-600 hover:bg-emerald-500 text-white"
        }`}
      >
        <span>{nextActionLabel}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

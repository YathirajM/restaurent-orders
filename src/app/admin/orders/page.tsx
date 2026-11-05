"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatTime, formatRelativeTime } from "@/lib/utils";
import { realtime } from "@/lib/realtime";
import { playNewOrderSound, playStatusUpdateSound } from "@/lib/sound";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ChefHat,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
} from "lucide-react";

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "placed", label: "New (Unaccepted)" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready to Serve" },
  { key: "served", label: "Served / Billed" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Reject modal state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Orders fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const unsubNew = realtime.subscribe("ORDER_CREATED", (newOrd: Order) => {
      setOrders((prev) => [newOrd, ...prev.filter((o) => o.id !== newOrd.id)]);
      playNewOrderSound();
    });

    const unsubUpdate = realtime.subscribe("ORDER_STATUS_UPDATED", (upOrd: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === upOrd.id ? upOrd : o)));
    });

    const interval = setInterval(fetchOrders, 4000);

    return () => {
      unsubNew();
      unsubUpdate();
      clearInterval(interval);
    };
  }, []);

  const handleUpdateStatus = async (
    orderId: string,
    status: OrderStatus,
    reason?: string
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.data : o)));
        realtime.emit("ORDER_STATUS_UPDATED", data.data);
        playStatusUpdateSound();
        if (rejectOrderId) {
          setRejectOrderId(null);
          setRejectReason("");
        }
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter !== "all" && o.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchTable = o.tableNumber.toLowerCase().includes(q);
      const matchCustomer = o.customerName.toLowerCase().includes(q);
      const matchDish = o.items.some((i) => i.productName.toLowerCase().includes(q));
      if (!matchNum && !matchTable && !matchCustomer && !matchDish) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Live Order Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Synchronized directly with the kitchen and guest dining tables.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted self-start transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Horizontal Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.key === "all"
                ? orders.length
                : orders.filter((o) => o.status === tab.key).length;
            const isSelected = activeFilter === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-1.5 flex-shrink-0 rounded-xl px-3 py-1.5 font-bold transition-all ${
                  isSelected
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/25 text-white" : "bg-muted text-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, table, customer..."
            className="w-full rounded-xl border border-input bg-card py-1.5 pl-9 pr-3 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border p-12 text-center bg-card">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-2" />
          <h3 className="font-display font-bold text-base text-foreground">
            No matching orders
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            New orders placed by guests will instantly appear here with audio notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`rounded-3xl border bg-card p-5 shadow-xs transition-all hover:shadow-md ${
                order.status === "placed"
                  ? "border-red-500/40 bg-red-500/5 ring-1 ring-red-500/20"
                  : "border-border/80"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left: Table & Order Info */}
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white font-display text-lg font-black shadow-md shadow-amber-500/20">
                    {order.tableNumber}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        Table {order.tableNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-semibold text-foreground">
                        {order.customerName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatRelativeTime(order.createdAt)})
                      </span>
                    </div>

                    {/* Items chips with dish photos */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 rounded-xl bg-muted/80 pl-1.5 pr-2.5 py-1 text-xs font-medium text-foreground border border-border/50 shadow-2xs"
                        >
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="h-6 w-6 rounded-md object-cover flex-shrink-0 border border-border/40"
                            />
                          )}
                          <div>
                            <strong className="text-amber-600 font-bold">{item.quantity}x</strong>{" "}
                            <span className="font-semibold">{item.productName}</span>
                            {item.customization?.selectedVariant && (
                              <span className="text-muted-foreground text-[10px] ml-1">
                                ({item.customization.selectedVariant.name})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.specialInstructions && (
                      <p className="mt-2 text-xs italic text-amber-600 font-medium">
                        &ldquo;{order.specialInstructions}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Financials & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                  {/* Total & Payment Badge */}
                  <div className="text-left lg:text-right">
                    <div className="font-display text-base font-black text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {order.paymentStatus === "paid" ? "Paid Online" : "Pay at Counter"}
                    </span>
                  </div>

                  {/* Order Status Action Buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === "placed" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, "accepted")}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => setRejectOrderId(order.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-500/20 transition-all"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {order.status === "accepted" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "preparing")}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition-all"
                      >
                        <ChefHat className="h-3.5 w-3.5" />
                        <span>Send to Prep</span>
                      </button>
                    )}

                    {order.status === "preparing" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "ready")}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {order.status === "ready" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "served")}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Mark Served</span>
                      </button>
                    )}

                    {order.status === "served" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "completed")}
                        className="flex items-center gap-1.5 rounded-xl bg-neutral-800 px-3.5 py-2 text-xs font-bold text-neutral-100 hover:bg-neutral-700 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Settle & Complete</span>
                      </button>
                    )}

                    {order.status === "completed" && (
                      <span className="rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
                        Order Completed
                      </span>
                    )}

                    {order.status === "rejected" && (
                      <span className="rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600">
                        Rejected: {order.rejectionReason || "Out of ingredients"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Order Reason Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-background border border-border p-6 shadow-2xl">
            <h3 className="font-display font-bold text-base text-foreground mb-2">
              Reject Order
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Please specify a reason so the customer understands why their ticket cannot be fulfilled.
            </p>
            <input
              type="text"
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Kitchen overloaded, ingredients out of stock..."
              className="w-full rounded-xl border border-input bg-muted/40 p-3 text-xs mb-4 focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectOrderId(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateStatus(
                    rejectOrderId,
                    "rejected",
                    rejectReason.trim() || "Item unavailable"
                  )
                }
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

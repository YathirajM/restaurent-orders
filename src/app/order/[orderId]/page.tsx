"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatTime } from "@/lib/utils";
import { realtime } from "@/lib/realtime";
import { playStatusUpdateSound } from "@/lib/sound";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  UtensilsCrossed,
  Printer,
  PlusCircle,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "placed", label: "Order Placed", desc: "Sent to captain & kitchen" },
  { key: "accepted", label: "Accepted", desc: "Kitchen acknowledged ticket" },
  { key: "preparing", label: "Preparing", desc: "Chef is crafting your dishes" },
  { key: "ready", label: "Ready to Serve", desc: "Plated & waiting for pickup" },
  { key: "served", label: "Served", desc: "Delivered to your table" },
  { key: "completed", label: "Completed", desc: "Bill settled. Thank you!" },
];

function getStageIndex(status: OrderStatus): number {
  switch (status) {
    case "placed":
      return 0;
    case "accepted":
      return 1;
    case "preparing":
      return 2;
    case "ready":
      return 3;
    case "served":
      return 4;
    case "completed":
      return 5;
    default:
      return 0;
  }
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch order data
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch order", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Listen for real-time status changes
    const unsub = realtime.subscribe("ORDER_STATUS_UPDATED", (updatedOrder: Order) => {
      if (updatedOrder.id === orderId) {
        setOrder(updatedOrder);
        playStatusUpdateSound();
      }
    });

    // Fallback polling every 4 seconds
    const interval = setInterval(fetchOrder, 4000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-sm font-semibold">Retrieving your live order status...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background text-foreground">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="font-display text-xl font-bold">Order Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          We could not find an order matching #{orderId}. It may have expired or was placed in another session.
        </p>
        <Link
          href="/menu"
          className="mt-5 rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStageIndex = getStageIndex(order.status);
  const isRejected = order.status === "rejected" || order.status === "cancelled";

  return (
    <div className="min-h-screen bg-background pb-16 text-foreground selection:bg-amber-500/20 selection:text-amber-600">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/menu"
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Digital Menu</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600">Live Ticket</span>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors no-print"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Receipt</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Order Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-extrabold text-amber-600 border border-amber-500/20">
                  {order.orderNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(order.createdAt)}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground mt-1">
                Table {order.tableNumber}
              </h1>
              <p className="text-xs text-muted-foreground">
                Guest: <span className="font-semibold text-foreground">{order.customerName}</span>
              </p>
            </div>

            {/* Estimated Prep Box */}
            <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Prep Window
                </p>
                <p className="font-display text-lg font-black text-foreground">
                  ~{order.estimatedPrepMinutes} Mins
                </p>
              </div>
            </div>
          </div>

          {/* Rejection notice if any */}
          {isRejected && (
            <div className="mt-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-600">
              <p className="font-bold">Order was declined by the restaurant.</p>
              {order.rejectionReason && <p className="mt-0.5">Reason: {order.rejectionReason}</p>}
            </div>
          )}
        </div>

        {/* Live Progression Timeline */}
        {!isRejected && (
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
            <h3 className="font-display text-base font-bold text-foreground mb-6">
              Live Preparation Stages
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-muted-foreground/20">
              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={stage.key} className="relative flex items-start gap-4">
                    {/* Stage Dot / Icon */}
                    <div
                      className={`absolute -left-6 sm:-left-8 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-amber-500 text-white ring-4 ring-amber-500/25 scale-110 shadow-md"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4 stroke-3" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Stage Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs sm:text-sm font-bold ${
                            isCurrent
                              ? "text-amber-600 font-black"
                              : isPassed
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {stage.label}
                        </h4>
                        {isCurrent && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ordered Dishes Summary */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="font-display text-base font-bold text-foreground">
              Order Details ({order.items.length} items)
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                order.paymentStatus === "paid"
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              }`}
            >
              {order.paymentStatus === "paid" ? "Paid Online" : "Pay at Counter"}
            </span>
          </div>

          <div className="divide-y divide-border/40 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground mt-0.5">
                    {item.quantity}x
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      {item.productName}
                    </h4>
                    {item.customization?.selectedVariant && (
                      <p className="text-[11px] text-amber-600">
                        Size: {item.customization.selectedVariant.name}
                      </p>
                    )}
                    {item.customization?.selectedAddons &&
                      item.customization.selectedAddons.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Add-ons: {item.customization.selectedAddons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                    {item.customization?.specialInstructions && (
                      <p className="text-[11px] text-muted-foreground italic">
                        &ldquo;{item.customization.specialInstructions}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-display text-xs sm:text-sm font-bold text-foreground">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          <div className="border-t border-border/60 pt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(order.subtotal)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({order.couponCode})</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(order.taxAmount)}
              </span>
            </div>
            {order.serviceChargeAmount > 0 && (
              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.serviceChargeAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-black text-foreground">
              <span>Total Bill</span>
              <span className="font-display text-base text-amber-600">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Add more dishes / Table Actions */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <Link
            href={`/menu?table=${order.tableNumber}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add More Dishes to Table {order.tableNumber}</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 px-6 text-xs sm:text-sm font-bold text-foreground hover:bg-muted transition-all"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span>Print Tax Invoice</span>
          </button>
        </div>

        {/* Server Call Button Note */}
        <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center text-xs text-muted-foreground">
          <p>Need anything else? Simply let your table captain know.</p>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            The Urban Plate • 42 MG Road, Connaught Place • GSTIN: 07AABCT1234C1ZP
          </p>
        </div>
      </main>
    </div>
  );
}

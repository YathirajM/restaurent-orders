"use client";

import { useEffect, useState } from "react";
import { Check, ChefHat, BellRing, PackageCheck, ReceiptText, Loader2, CreditCard } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { OrderItemSelection } from "@/lib/db/schema";

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  customerName: string;
  tableLabel: string | null;
  subtotal: number;
  taxTotal: number;
  chargeTotal: number;
  total: number;
  currency: string;
  specialInstructions: string | null;
  createdAt: string;
  razorpayOrderId: string | null;
};

type ItemData = {
  id: string;
  name: string;
  selections: OrderItemSelection[];
  quantity: number;
  lineTotal: number;
  notes: string | null;
};

const STEPS = [
  { id: "placed", label: "Order Placed", icon: ReceiptText },
  { id: "accepted", label: "Accepted by Kitchen", icon: Check },
  { id: "preparing", label: "Preparing", icon: ChefHat },
  { id: "ready", label: "Ready for Collection", icon: BellRing },
  { id: "completed", label: "Completed", icon: PackageCheck },
] as const;

/**
 * Live order tracking. Polls /api/orders/:id/status every 5s — no manual
 * refresh needed. When the kitchen marks READY the page celebrates.
 */
export function OrderTracking({
  order,
  items,
  restaurantName,
  currencySymbol,
}: {
  order: OrderData;
  items: ItemData[];
  restaurantName: string;
  currencySymbol: string;
}) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [unpaidCountdown, setUnpaidCountdown] = useState(0);

  useEffect(() => {
    if (["completed", "cancelled"].includes(status)) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: string; paymentStatus: string };
        setStatus(data.status);
        setPaymentStatus(data.paymentStatus);
      } catch {
        /* transient network error — retry on next tick */
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [order.id, status]);

  const isPaid = paymentStatus === "paid";
  const isFailed = paymentStatus === "failed";
  const stepIndex = STEPS.findIndex((s) => s.id === status);
  const cancelled = status === "cancelled";
  const paymentMethod = order.paymentMethod;

  const retryPayment = async () => {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const pay = (await res.json()) as { mode: string };
    if (pay.mode === "simulated") {
      await fetch("/api/payments/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, outcome: "success" }),
      });
      setPaymentStatus("paid");
    } else {
      window.location.reload();
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 pb-16">
      {/* Hero */}
      <div
        className={`mt-6 rounded-3xl p-6 text-center shadow-lift ${
          cancelled
            ? "bg-ink-200"
            : status === "ready"
              ? "bg-sage-500"
              : "bg-ink-900"
        }`}
      >
        {cancelled ? (
          <>
            <p className="text-3xl">🚫</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink-800">
              Order cancelled
            </h1>
          </>
        ) : status === "ready" ? (
          <>
            <p className="animate-pop-in text-4xl">🎉</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-white">
              YOUR ORDER IS READY!
            </h1>
            <p className="mt-1 text-sm text-sage-100">
              Please collect your order at the counter.
            </p>
            <p className="mt-3 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-bold text-white">
              {order.customerName} · #{order.orderNumber}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-ink-300">
              {isPaid ? "Payment received" : "Order placed"}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">
              Thank you, {order.customerName.split(" ")[0]}!
            </h1>
            <p className="mt-2 inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-bold text-white">
              Order #{order.orderNumber} · Table {order.tableLabel}
            </p>
          </>
        )}
      </div>

      {/* Payment banner */}
      {!isPaid && !cancelled && (
        <div className={`mt-4 rounded-2xl p-4 ${isFailed ? "bg-chili-50" : "bg-saffron-50"}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard size={16} />
            {isFailed
              ? "Payment failed — please retry to confirm your order"
              : paymentMethod === "simulated"
                ? "Simulated payment (test mode — no real charge)"
                : "Payment pending"}
          </div>
          {!isFailed && paymentMethod === "simulated" && (
            <p className="mt-1 text-xs text-ink-500">
              Razorpay keys are not configured, so this payment was simulated
              locally. Configure keys for live payments.
            </p>
          )}
          <button onClick={retryPayment} className="btn-primary mt-3 w-full !py-3">
            {isFailed ? "Retry payment" : "Complete payment"}
          </button>
        </div>
      )}

      {/* Progress tracker */}
      {!cancelled && (
        <section className="card mt-4 p-5">
          <h2 className="mb-4 font-display text-base font-bold">Order status</h2>
          <ol className="relative space-y-0">
            {STEPS.map((step, i) => {
              const done = stepIndex > i || (stepIndex === -1 && i === 0);
              const current = stepIndex === i;
              const Icon = step.icon;
              return (
                <li key={step.id} className="relative flex gap-3.5 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span
                      className={`absolute left-[15px] top-8 h-[calc(100%-32px)] w-0.5 ${
                        done ? "bg-sage-500" : "bg-ink-150 bg-ink-100"
                      }`}
                    />
                  )}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      current
                        ? "bg-ember-500 text-white animate-pulse"
                        : done
                          ? "bg-sage-500 text-white"
                          : "bg-ink-100 text-ink-400"
                    }`}
                  >
                    <Icon size={15} />
                  </span>
                  <div className="pt-1">
                    <p
                      className={`text-sm font-semibold ${
                        current ? "text-ember-600" : done ? "text-ink-900" : "text-ink-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {current && (
                      <p className="text-xs text-ink-500">In progress…</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {!["completed", "cancelled"].includes(status) && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-400">
              <Loader2 size={11} className="animate-spin" /> Updates automatically
            </p>
          )}
        </section>
      )}

      {/* Items */}
      <section className="card mt-4 p-5">
        <h2 className="mb-3 font-display text-base font-bold">Your items</h2>
        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {item.quantity} × {item.name}
                </p>
                {item.selections.length > 0 && (
                  <p className="text-xs text-ink-500">
                    {item.selections.map((s) => s.optionLabel).join(" · ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs italic text-ink-400">“{item.notes}”</p>
                )}
              </div>
              <span className="text-sm font-semibold text-ink-900">
                {formatMoney(item.lineTotal, currencySymbol)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-dashed border-ink-200 pt-3 text-[13px] text-ink-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, currencySymbol)}</span>
          </div>
          {order.taxTotal > 0 && (
            <div className="flex justify-between">
              <span>Taxes</span>
              <span>{formatMoney(order.taxTotal, currencySymbol)}</span>
            </div>
          )}
          {order.chargeTotal > 0 && (
            <div className="flex justify-between">
              <span>Charges</span>
              <span>{formatMoney(order.chargeTotal, currencySymbol)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-bold text-ink-900">
            <span>Total</span>
            <span>{formatMoney(order.total, currencySymbol)}</span>
          </div>
        </div>
        {order.specialInstructions && (
          <p className="mt-3 rounded-xl bg-cream-dark p-3 text-xs text-ink-600">
            <span className="font-semibold">Note for kitchen: </span>
            {order.specialInstructions}
          </p>
        )}
      </section>

      <p className="mt-4 text-center text-xs text-ink-400">
        {restaurantName} · Show this page at the counter if asked
      </p>
    </main>
  );
}

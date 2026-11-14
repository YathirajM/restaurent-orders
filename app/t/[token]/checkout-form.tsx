"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useCart } from "./cart-context";
import { formatMoney, type PriceBreakdown } from "@/lib/money";
import { useRouter } from "next/navigation";

type PaymentCreateResponse =
  | {
      mode: "razorpay";
      keyId: string;
      razorpayOrderId: string;
      amount: number;
      currency: string;
      customerName: string;
      prefill: { name: string; contact: string };
    }
  | { mode: "simulated"; reason: string; amount: number; currency: string };

/**
 * Checkout: collects only the essentials (name; phone optional), places
 * the order with an idempotency key, then runs payment:
 *  - Razorpay Checkout when configured (signature verified server-side)
 *  - Clearly-labelled simulation otherwise, so the pipeline is testable
 *
 * The Pay button is disabled while submitting; the order is created
 * exactly once per idempotency key, so double-taps can't double-charge.
 */
export function CheckoutForm({
  breakdown,
  currencySymbol,
  tableLabel,
  onBack,
  onClose,
}: {
  breakdown: PriceBreakdown;
  currencySymbol: string;
  tableLabel: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const { lines, subtotal, clear } = useCart();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idempotencyKey = useRefIfNeeded();

  const placeOrderAndPay = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the order (server recomputes all prices).
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          tableToken: tableToken(),
          customerName: name.trim(),
          customerPhone: phone.trim() || undefined,
          specialInstructions: instructions.trim() || undefined,
          items: lines.map((l) => ({
            foodItemId: l.foodItemId,
            quantity: l.quantity,
            optionIds: l.selections.map((s) => s.optionId),
            notes: l.notes || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not place your order");
      }
      const { orderId } = (await res.json()) as { orderId: string };

      // 2. Payment.
      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const pay = (await payRes.json()) as PaymentCreateResponse;

      if (pay.mode === "razorpay") {
        await openRazorpayCheckout(orderId, pay);
      } else {
        // Simulated payment path (no gateway keys configured).
        const simRes = await fetch("/api/payments/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, outcome: "success" }),
        });
        if (!simRes.ok) throw new Error("Payment failed. Please try again.");
        clear();
        router.push(`/order/${orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const openRazorpayCheckout = async (
    orderId: string,
    pay: Extract<PaymentCreateResponse, { mode: "razorpay" }>,
  ) => {
    await loadRazorpayScript();
    const Razorpay = (window as unknown as { Razorpay?: new (options: RazorpayOptions) => { open: () => void } }).Razorpay;
    if (!Razorpay) throw new Error("Payment SDK failed to load. Check your connection.");

    return new Promise<void>((resolve, reject) => {
      const rzp = new Razorpay({
        key: pay.keyId,
        amount: pay.amount,
        currency: pay.currency,
        name: "Saffron Order",
        description: `Table ${tableLabel}`,
        order_id: pay.razorpayOrderId,
        prefill: pay.prefill,
        theme: { color: "#d94f28" },
        handler: async (response: RazorpaySuccess) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, ...response }),
            });
            if (!verifyRes.ok) {
              const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
              throw new Error(data.error ?? "Payment verification failed");
            }
            clear();
            router.push(`/order/${orderId}`);
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            reject(new Error("Payment cancelled. Your order is saved — you can retry from the order page."));
          },
        },
      });
      rzp.open();
    });
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft size={16} /> Back to cart
        </button>

        <h3 className="font-display text-lg font-semibold">Almost there</h3>
        <p className="mt-0.5 text-sm text-ink-500">
          Table {tableLabel} · {lines.reduce((s, l) => s + l.quantity, 0)} items
        </p>

        <div className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="ck-name" className="label">Your name</label>
            <input
              id="ck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="input"
              autoComplete="name"
              maxLength={80}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="ck-phone" className="label">
              Mobile number <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              id="ck-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="For order updates"
              className="input"
              inputMode="tel"
              autoComplete="tel"
              maxLength={20}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="ck-notes" className="label">
              Order notes <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              id="ck-notes"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Anything the kitchen should know?"
              className="input"
              maxLength={280}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-card">
          <div className="space-y-1.5 text-[13px] text-ink-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-ink-900">{formatMoney(breakdown.subtotal, currencySymbol)}</span>
            </div>
            {breakdown.taxLines.map((t) => (
              <div key={t.label} className="flex justify-between text-ink-500">
                <span>{t.label}</span>
                <span>{t.amount === 0 ? "Included" : formatMoney(t.amount, currencySymbol)}</span>
              </div>
            ))}
            {breakdown.chargeLines.map((c) => (
              <div key={c.label} className="flex justify-between text-ink-500">
                <span>{c.label}</span>
                <span>{formatMoney(c.amount, currencySymbol)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-dashed border-ink-200 pt-2 text-base font-bold text-ink-900">
              <span>To pay</span>
              <span>{formatMoney(breakdown.total, currencySymbol)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-chili-50 p-3 text-[13px] text-chili-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-ink-100 bg-white px-5 pt-3 pb-safe">
        <button
          onClick={placeOrderAndPay}
          disabled={submitting || lines.length === 0}
          className="btn-primary w-full !py-4 !text-base"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" /> Processing…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} />
              Pay {formatMoney(breakdown.total, currencySymbol)}
            </span>
          )}
        </button>
        <p className="mt-2 pb-1 text-center text-[11px] text-ink-400">
          UPI · Cards · NetBanking — secured by Razorpay
        </p>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function useIdempotencyKey(): string {
  // One key per checkout attempt lifecycle; regenerated after success/cancel.
  const [key] = useState(() => crypto.randomUUID());
  return key;
}

function useRefIfNeeded(): string {
  return useIdempotencyKey();
}

function tableToken(): string {
  const m = window.location.pathname.match(/^\/t\/([A-Za-z0-9_-]+)/);
  if (!m) throw new Error("Missing table token");
  return m[1];
}

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load payment gateway"));
    document.body.appendChild(script);
  });
}

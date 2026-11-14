"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, ArrowRight } from "lucide-react";
import { useCart, lineUnitPrice } from "./cart-context";
import { formatMoney, computeTotals } from "@/lib/money";
import type { TaxLine, ChargeLine } from "@/lib/db/schema";
import { CheckoutForm } from "./checkout-form";

/**
 * Slide-up cart with quantity controls, totals breakdown and the
 * checkout step. Taxes/charges are computed with the same function the
 * server uses, so the customer always sees the true payable amount.
 */
export function CartSheet({
  open,
  onClose,
  currencySymbol,
  taxes,
  charges,
  tableLabel,
}: {
  open: boolean;
  onClose: () => void;
  currencySymbol: string;
  taxes: TaxLine[];
  charges: ChargeLine[];
  tableLabel: string;
}) {
  const { lines, subtotal, setQuantity, removeLine, clear } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!open) return null;

  const breakdown = computeTotals(subtotal, taxes, charges);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Cart">
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl bg-cream shadow-sheet animate-sheet-up">
        <div className="flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4 rounded-t-3xl">
          <h2 className="font-display text-lg font-semibold">Your Order</h2>
          <div className="flex items-center gap-2">
            {lines.length > 0 && (
              <button
                onClick={clear}
                className="text-xs font-semibold text-chili-600 hover:text-chili-700"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <span className="text-4xl">🛒</span>
            <p className="font-semibold text-ink-700">Your cart is empty</p>
            <p className="text-sm text-ink-400">
              Browse the menu and add some delicious items.
            </p>
            <button onClick={onClose} className="btn-secondary mt-2">
              Back to menu
            </button>
          </div>
        ) : checkoutOpen ? (
          <CheckoutForm
            breakdown={breakdown}
            currencySymbol={currencySymbol}
            tableLabel={tableLabel}
            onBack={() => setCheckoutOpen(false)}
            onClose={onClose}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="flex gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                    {line.imageId ? (
                      <Image
                        src={`/api/images/${line.imageId}`}
                        alt={line.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">🍛</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`veg-indicator ${line.isVeg ? "veg" : "nonveg"}`} />
                        <h3 className="text-sm font-semibold text-ink-900">{line.name}</h3>
                      </div>
                      <button
                        onClick={() => removeLine(line.key)}
                        className="text-ink-300 transition-colors hover:text-chili-500"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {line.selections.length > 0 && (
                      <p className="mt-0.5 text-xs text-ink-500">
                        {line.selections
                          .map((s) => s.optionLabel)
                          .join(" · ")}
                      </p>
                    )}
                    {line.notes && (
                      <p className="mt-0.5 text-xs italic text-ink-400">“{line.notes}”</p>
                    )}
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden rounded-lg border border-ink-200">
                        <button
                          onClick={() => setQuantity(line.key, line.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center font-bold text-ink-600 hover:bg-ink-50"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[26px] text-center text-[13px] font-bold">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(line.key, line.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center font-bold text-ink-600 hover:bg-ink-50"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold text-ink-900">
                        {formatMoney(lineUnitPrice(line) * line.quantity, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-100 bg-white px-5 pt-4 pb-safe rounded-t-2xl">
              <div className="space-y-1.5 text-[13px] text-ink-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink-900">
                    {formatMoney(breakdown.subtotal, currencySymbol)}
                  </span>
                </div>
                {breakdown.taxLines.map((t) => (
                  <div key={t.label} className="flex justify-between text-ink-500">
                    <span>{t.label}</span>
                    <span>
                      {t.amount === 0
                        ? "Included"
                        : formatMoney(t.amount, currencySymbol)}
                    </span>
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
              <button
                onClick={() => setCheckoutOpen(true)}
                className="btn-primary mt-3 w-full !py-3.5"
              >
                <span className="flex items-center justify-center gap-2">
                  Proceed to pay {formatMoney(breakdown.total, currencySymbol)}
                  <ArrowRight size={16} />
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

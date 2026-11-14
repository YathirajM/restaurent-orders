"use client";

import { useMemo, useState } from "react";
import { X, StickyNote } from "lucide-react";
import type { MenuItem } from "./menu-types";
import type { CartSelection } from "./cart-context";
import { formatMoney } from "@/lib/money";

/**
 * Mobile bottom sheet for item customization. Shows only the option
 * groups configured for this item. Live price updates as options are
 * toggled. Required groups must be satisfied before Add enables.
 */
export function CustomizeSheet({
  item,
  currencySymbol,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  currencySymbol: string;
  onClose: () => void;
  onConfirm: (selections: CartSelection[], quantity: number, notes?: string) => void;
}) {
  const groups = item.optionGroups.filter((g) => g.options.length > 0);
  // state: groupId -> Set of option labels (labels are unique per group; ids kept in lookup)
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of groups) {
      if (g.isRequired && g.selectionType === "single") {
        const firstAvailable = g.options.find((o) => o.isAvailable);
        if (firstAvailable) init[g.id] = [firstAvailable.id];
      }
    }
    return init;
  });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const optionById = useMemo(() => {
    const m = new Map<string, (typeof groups)[number]["options"][number]>();
    for (const g of groups) for (const o of g.options) m.set(o.id, o);
    return m;
  }, [groups]);

  const unitPrice =
    Math.round(
      (item.price +
        Object.values(selected)
          .flat()
          .reduce((s, id) => s + (optionById.get(id)?.priceDelta ?? 0), 0)) *
        100,
    ) / 100;

  const unmetRequired = groups.filter((g) => {
    if (!g.isRequired) return false;
    const count = selected[g.id]?.length ?? 0;
    return count < Math.max(1, g.minSelect);
  });

  const toggle = (groupId: string, optionId: string, mode: "single" | "multi", max: number) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (mode === "single") {
        return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= max) {
        // Replace oldest selection beyond max (friendly behaviour).
        return { ...prev, [groupId]: [...current.slice(1), optionId] };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const handleAdd = () => {
    const selections: CartSelection[] = [];
    for (const g of groups) {
      for (const id of selected[g.id] ?? []) {
        const opt = optionById.get(id);
        if (opt) {
          selections.push({
            optionId: id,
            groupLabel: g.label,
            optionLabel: opt.label,
            priceDelta: opt.priceDelta,
          });
        }
      }
    }
    onConfirm(selections, quantity, notes.trim() || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Customise ${item.name}`}
    >
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-sheet animate-sheet-up">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-ink-100 px-5 pb-4 pt-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`veg-indicator ${item.isVeg ? "veg" : "nonveg"}`}
              />
              <h2 className="truncate font-display text-lg font-semibold text-ink-900">
                {item.name}
              </h2>
            </div>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-500">
                {item.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition-colors hover:bg-ink-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {groups.length === 0 && (
            <p className="py-4 text-center text-sm text-ink-400">
              No customisations for this item.
            </p>
          )}

          {groups.map((g) => {
            const chosen = selected[g.id] ?? [];
            return (
              <section key={g.id} className="mb-5 last:mb-0">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink-800">
                    {g.label}
                    {g.isRequired && (
                      <span className="ml-1.5 text-[11px] font-semibold text-chili-500">
                        Required
                      </span>
                    )}
                  </h3>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                    {g.selectionType === "single" ? "Choose 1" : `Up to ${g.maxSelect}`}
                  </span>
                </div>
                <div className="space-y-2">
                  {g.options.map((o) => {
                    const isSel = chosen.includes(o.id);
                    const disabled = !o.isAvailable;
                    return (
                      <button
                        key={o.id}
                        disabled={disabled}
                        onClick={() => toggle(g.id, o.id, g.selectionType, g.maxSelect)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                          disabled
                            ? "cursor-not-allowed border-ink-100 bg-ink-50 opacity-50"
                            : isSel
                              ? "border-ember-500 bg-ember-50 ring-1 ring-ember-500"
                              : "border-ink-200 bg-white hover:border-ink-300"
                        }`}
                        aria-pressed={isSel}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center border-2 ${
                              g.selectionType === "single" ? "rounded-full" : "rounded-[5px]"
                            } ${
                              isSel
                                ? "border-ember-500 bg-ember-500"
                                : "border-ink-300 bg-white"
                            }`}
                          >
                            {isSel && (
                              <span
                                className={
                                  g.selectionType === "single"
                                    ? "h-1.5 w-1.5 rounded-full bg-white"
                                    : "text-[10px] font-black leading-none text-white"
                                }
                              >
                                {g.selectionType === "multi" ? "✓" : ""}
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              disabled ? "text-ink-400" : "text-ink-900"
                            }`}
                          >
                            {o.label}
                            {disabled && (
                              <span className="ml-2 text-xs text-ink-400">Unavailable</span>
                            )}
                          </span>
                        </span>
                        {o.priceDelta !== 0 && (
                          <span className="text-sm font-semibold text-ink-700">
                            {o.priceDelta > 0 ? "+" : "−"}
                            {formatMoney(Math.abs(o.priceDelta), currencySymbol)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Special instructions */}
          <section className="mb-2 mt-5">
            <label className="label flex items-center gap-1.5">
              <StickyNote size={14} className="text-ink-400" />
              Special instructions
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={280}
              placeholder="e.g. less spicy, no onions"
              className="input !py-2.5 !text-sm"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-ink-100 px-5 pb-safe pt-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-xl border border-ink-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-9 items-center justify-center text-lg font-bold text-ink-600 hover:bg-ink-50"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[28px] text-center text-sm font-bold" aria-live="polite">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                  className="flex h-10 w-9 items-center justify-center text-lg font-bold text-ink-600 hover:bg-ink-50"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-ink-500">{unmetRequired.length === 0 ? "" :
                `Choose ${unmetRequired.map((g) => g.label.toLowerCase()).join(", ")}`}</span>
            </div>
            <span className="font-display text-lg font-bold text-ink-900">
              {formatMoney(unitPrice * quantity, currencySymbol)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={unmetRequired.length > 0}
            className="btn-primary w-full !py-3.5"
          >
            Add {quantity} to cart · {formatMoney(unitPrice * quantity, currencySymbol)}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, ChevronRight } from "lucide-react";
import type { MenuItem } from "./menu-types";
import { useCart, type CartSelection } from "./cart-context";
import { formatMoney } from "@/lib/money";
import { CustomizeSheet } from "./customize-sheet";

export function FoodCard({
  item,
  currencySymbol,
}: {
  item: MenuItem;
  currencySymbol: string;
}) {
  const { addLine, lines, setQuantity } = useCart();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Existing simple-line quantity for this item (no options/notes).
  const simpleLine = lines.find(
    (l) =>
      l.foodItemId === item.id &&
      l.selections.length === 0 &&
      !l.notes,
  );
  const hasOptions = item.optionGroups.some((g) => g.options.length > 0);
  const requiresChoice = item.optionGroups.some((g) => g.isRequired);

  const handleAdd = () => {
    if (hasOptions) {
      setSheetOpen(true);
      return;
    }
    addLine({
      foodItemId: item.id,
      name: item.name,
      basePrice: item.price,
      imageId: item.imageId,
      isVeg: item.isVeg,
      selections: [],
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  const onCustomizeConfirm = (
    selections: CartSelection[],
    quantity: number,
    notes?: string,
  ) => {
    addLine({
      foodItemId: item.id,
      name: item.name,
      basePrice: item.price,
      imageId: item.imageId,
      isVeg: item.isVeg,
      selections,
      quantity,
      notes,
    });
    setSheetOpen(false);
  };

  return (
    <>
      <article
        className={`flex gap-3.5 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-card transition-opacity ${
          item.isAvailable ? "" : "opacity-55"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`veg-indicator ${item.isVeg ? "veg" : "nonveg"}`}
              aria-label={item.isVeg ? "Vegetarian" : "Non-vegetarian"}
            />
            {item.isBestseller && (
              <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[11px] font-bold text-saffron-800">
                ★ Bestseller
              </span>
            )}
            {item.isChefSpecial && (
              <span className="rounded-full bg-ember-50 px-2 py-0.5 text-[11px] font-bold text-ember-700">
                Chef&apos;s Special
              </span>
            )}
          </div>

          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink-900">
            {item.name}
          </h3>

          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-500">
              {item.description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2.5">
            <span className="text-[15px] font-bold text-ink-900">
              {formatMoney(item.price, currencySymbol)}
            </span>

            {!item.isAvailable ? (
              <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-400">
                Sold out
              </span>
            ) : simpleLine ? (
              <QuantityStepper
                quantity={simpleLine.quantity}
                onDec={() => setQuantity(simpleLine.key, simpleLine.quantity - 1)}
                onInc={() => setQuantity(simpleLine.key, simpleLine.quantity + 1)}
              />
            ) : (
              <button
                onClick={handleAdd}
                className={`btn-primary !rounded-xl !px-4 !py-2 !text-[13px] ${
                  justAdded ? "!bg-sage-600" : ""
                }`}
                aria-label={`Add ${item.name} to cart`}
              >
                {justAdded ? (
                  "Added ✓"
                ) : hasOptions ? (
                  <span className="flex items-center gap-1">
                    ADD <ChevronRight size={14} />
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Plus size={15} strokeWidth={2.5} /> ADD
                  </span>
                )}
              </button>
            )}
          </div>

          {hasOptions && !requiresChoice && item.isAvailable && !simpleLine && (
            <button
              onClick={() => setSheetOpen(true)}
              className="mt-1 self-start text-[12px] font-semibold text-ember-600"
            >
              Customise
            </button>
          )}
        </div>

        <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-ink-100">
          {item.imageId ? (
            <Image
              src={`/api/images/${item.imageId}`}
              alt={item.name}
              fill
              sizes="92px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-dark to-ink-100 text-2xl">
              🍛
            </div>
          )}
        </div>
      </article>

      {sheetOpen && (
        <CustomizeSheet
          item={item}
          currencySymbol={currencySymbol}
          onClose={() => setSheetOpen(false)}
          onConfirm={onCustomizeConfirm}
        />
      )}
    </>
  );
}

export function QuantityStepper({
  quantity,
  onDec,
  onInc,
  small,
}: {
  quantity: number;
  onDec: () => void;
  onInc: () => void;
  small?: boolean;
}) {
  return (
    <div
      className={`flex items-center overflow-hidden rounded-xl bg-ember-500 font-bold text-white shadow-btn ${
        small ? "text-[13px]" : ""
      }`}
    >
      <button
        onClick={onDec}
        className="flex h-9 w-8 items-center justify-center transition-colors hover:bg-ember-600 active:bg-ember-700"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[24px] text-center text-[13px]" aria-live="polite">
        {quantity}
      </span>
      <button
        onClick={onInc}
        className="flex h-9 w-8 items-center justify-center transition-colors hover:bg-ember-600 active:bg-ember-700"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

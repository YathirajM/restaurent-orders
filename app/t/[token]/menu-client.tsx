"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Search, ShoppingCart, Info, X } from "lucide-react";
import type { MenuData } from "./menu-types";
import { CartProvider, useCart } from "./cart-context";
import { FoodCard } from "./food-card";
import { CartSheet } from "./cart-sheet";
import { formatMoney, computeTotals } from "@/lib/money";
import type { TaxLine, ChargeLine } from "@/lib/db/schema";

type Filter = "all" | "veg" | "nonveg" | "bestseller" | "special";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "veg", label: "Veg" },
  { id: "nonveg", label: "Non-Veg" },
  { id: "bestseller", label: "Bestsellers" },
  { id: "special", label: "Chef's Specials" },
];

export function MenuClient({ menu, token }: { menu: MenuData; token: string }) {
  return (
    <CartProvider token={token}>
      <MenuView menu={menu} />
    </CartProvider>
  );
}

function MenuView({ menu }: { menu: MenuData }) {
  const { restaurant, table, categories, items } = menu;
  const { count, subtotal } = useCart();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const catRailRef = useRef<HTMLDivElement>(null);

  const taxes = (restaurant.taxConfig ?? []) as TaxLine[];
  const charges = (restaurant.chargeConfig ?? []) as ChargeLine[];
  const breakdown = computeTotals(subtotal, taxes, charges);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(q))
        return false;
      if (activeCat !== "all" && item.categoryId !== activeCat) return false;
      if (filter === "veg" && !item.isVeg) return false;
      if (filter === "nonveg" && item.isVeg) return false;
      if (filter === "bestseller" && !item.isBestseller) return false;
      if (filter === "special" && !item.isChefSpecial) return false;
      return true;
    });
  }, [items, query, activeCat, filter]);

  const grouped = useMemo(() => {
    const byCat = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = byCat.get(item.categoryId) ?? [];
      list.push(item);
      byCat.set(item.categoryId, list);
    }
    // Preserve DB category order.
    return categories
      .filter((c) => byCat.has(c.id))
      .map((c) => ({ category: c, items: byCat.get(c.id)! }));
  }, [filtered, categories]);

  const popular = useMemo(
    () =>
      items
        .filter((i) => i.isBestseller || i.isChefSpecial)
        .slice(0, 8),
    [items],
  );

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-card">
            {restaurant.logoImageId ? (
              <Image
                src={`/api/images/${restaurant.logoImageId}`}
                alt={restaurant.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-ember-500 font-display text-xl font-bold text-white">
                {restaurant.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold leading-tight text-ink-900">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-2 text-[12px] text-ink-500">
              <span className="rounded-md bg-saffron-100 px-1.5 py-0.5 font-bold text-saffron-800">
                Table {table?.label}
              </span>
              {restaurant.tagline && (
                <span className="truncate">{restaurant.tagline}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setInfoOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100"
            aria-label="Restaurant info"
          >
            <Info size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2.5 pt-3">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu…"
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-9 text-[15px] outline-none transition-all placeholder:text-ink-400 focus:border-ember-400 focus:ring-4 focus:ring-ember-500/10"
              aria-label="Search menu"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-ink-100"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Category rail */}
        <div
          ref={catRailRef}
          className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2.5"
          role="tablist"
          aria-label="Menu categories"
        >
          <CategoryChip
            active={activeCat === "all"}
            label="All"
            onClick={() => setActiveCat("all")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              active={activeCat === c.id}
              label={c.name}
              onClick={() => setActiveCat(c.id)}
            />
          ))}
        </div>

        {/* Dietary filters */}
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-ink-100/70 px-4 py-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                filter === f.id
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="px-4">
        {!restaurant.acceptOrders && (
          <div className="mt-4 rounded-xl bg-saffron-100 p-3 text-sm font-semibold text-saffron-800">
            The kitchen is not accepting orders right now — you can still
            browse the menu.
          </div>
        )}

        {query === "" && filter === "all" && activeCat === "all" && popular.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2.5 font-display text-base font-bold text-ink-900">
              Popular at {restaurant.name}
            </h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {popular.map((item) => (
                <div key={item.id} className="w-[240px] shrink-0">
                  <FoodCard item={item} currencySymbol={restaurant.currencySymbol} />
                </div>
              ))}
            </div>
          </section>
        )}

        {grouped.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 font-semibold text-ink-700">Nothing found</p>
            <p className="mt-1 text-sm text-ink-400">
              Try a different search or filter.
            </p>
          </div>
        ) : (
          grouped.map(({ category, items: catItems }) => (
            <section key={category.id} className="mt-6">
              <h2 className="mb-2.5 font-display text-base font-bold text-ink-900">
                {category.name}
                <span className="ml-2 text-xs font-medium text-ink-400">
                  {catItems.length} items
                </span>
              </h2>
              <div className="space-y-3">
                {catItems.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    currencySymbol={restaurant.currencySymbol}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Sticky cart bar */}
      {count > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-4 pt-3 pb-safe backdrop-blur animate-fade-in">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setCartOpen(true)}
              className="btn-primary w-full !justify-between !py-3.5"
              aria-label={`View cart, ${count} items`}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                  {count}
                </span>
                {count} item{count > 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-2 font-bold">
                {formatMoney(breakdown.total, restaurant.currencySymbol)}
                <span className="text-sm opacity-80">View Cart →</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Floating cart icon (when cart closed & empty bar hidden) */}
      {count > 0 && cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ember-500 text-white shadow-lift"
          aria-label="Open cart"
        >
          <ShoppingCart size={22} />
        </button>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        currencySymbol={restaurant.currencySymbol}
        taxes={taxes}
        charges={charges}
        tableLabel={table?.label ?? "—"}
      />

      {/* Restaurant info sheet */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink-950/55" onClick={() => setInfoOpen(false)} />
          <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-6 pb-safe shadow-sheet animate-sheet-up">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200" />
            <h2 className="font-display text-xl font-bold">{restaurant.name}</h2>
            {restaurant.description && (
              <p className="mt-2 text-sm text-ink-600">{restaurant.description}</p>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              {restaurant.address && (
                <div>
                  <dt className="font-semibold text-ink-800">Address</dt>
                  <dd className="text-ink-600">{restaurant.address}</dd>
                </div>
              )}
              {restaurant.phone && (
                <div>
                  <dt className="font-semibold text-ink-800">Phone</dt>
                  <dd className="text-ink-600">{restaurant.phone}</dd>
                </div>
              )}
            </dl>
            <button
              onClick={() => setInfoOpen(false)}
              className="btn-secondary mt-5 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
        active
          ? "bg-ember-500 text-white shadow-btn"
          : "bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-300"
      }`}
    >
      {label}
    </button>
  );
}

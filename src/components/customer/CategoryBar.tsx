"use client";

import React from "react";
import Image from "next/image";
import { Category } from "@/lib/types";
import { Flame, Sparkles, Award } from "lucide-react";

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  vegFilter: "all" | "veg" | "non-veg";
  onVegFilterChange: (val: "all" | "veg" | "non-veg") => void;
  onlyBestsellers: boolean;
  onToggleBestsellers: () => void;
  onlyChefSpecial: boolean;
  onToggleChefSpecial: () => void;
}

export function CategoryBar({
  categories,
  selectedCategory,
  onSelectCategory,
  vegFilter,
  onVegFilterChange,
  onlyBestsellers,
  onToggleBestsellers,
  onlyChefSpecial,
  onToggleChefSpecial,
}: CategoryBarProps) {
  return (
    <div className="sticky top-16 z-30 w-full border-b border-border/50 bg-background/95 backdrop-blur-md pt-3 pb-2 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Horizontal Category Cards / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {/* "All Menu" Option */}
          <button
            onClick={() => onSelectCategory("all")}
            className={`flex items-center gap-2 flex-shrink-0 rounded-2xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-102"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Full Menu</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 flex-shrink-0 rounded-2xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-amber-500 text-white font-semibold shadow-md shadow-amber-500/25 scale-102"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                }`}
              >
                <div className="relative h-6 w-6 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
                <span>{cat.name}</span>
                {cat.itemCount !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {cat.itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dietary and High-Value Quick Filter Toggles */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar text-xs">
          {/* Dietary Filter Segment */}
          <div className="flex items-center rounded-xl bg-muted/80 p-0.5 border border-border/50">
            <button
              onClick={() => onVegFilterChange("all")}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                vegFilter === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onVegFilterChange("veg")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
                vegFilter === "veg"
                  ? "bg-emerald-600 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-emerald-600"
              }`}
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-xs border border-emerald-600 p-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>Veg</span>
            </button>
            <button
              onClick={() => onVegFilterChange("non-veg")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all ${
                vegFilter === "non-veg"
                  ? "bg-red-600 text-white shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-red-600"
              }`}
            >
              <span className="flex h-3 w-3 items-center justify-center rounded-xs border border-red-600 p-0.5">
                <span className="h-0 w-0 border-x-2 border-x-transparent border-b-3 border-b-red-600" />
              </span>
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Bestseller Toggle */}
          <button
            onClick={onToggleBestsellers}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all border ${
              onlyBestsellers
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Bestsellers</span>
          </button>

          {/* Chef's Special Toggle */}
          <button
            onClick={onToggleChefSpecial}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all border ${
              onlyChefSpecial
                ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-semibold"
                : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted"
            }`}
          >
            <Award className="h-3.5 w-3.5 text-indigo-500" />
            <span>Chef&apos;s Specials</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Clock, Star, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { RestaurantSettings } from "@/lib/types";

interface BannerProps {
  restaurant: RestaurantSettings;
  tableNumber: string | null;
}

export function Banner({ restaurant, tableNumber }: BannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white shadow-xl">
      {/* Background Cover Image with Gradient */}
      <div className="relative h-64 sm:h-72 md:h-80 w-full">
        <Image
          src={restaurant.coverImage}
          alt={restaurant.name}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover opacity-45 transform scale-105 transition-transform duration-700 hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent to-neutral-950/80" />
      </div>

      {/* Floating Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Live Open Status */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Open Now</span>
          </span>

          {/* Dine-in Only Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-200 border border-white/15 backdrop-blur-md">
            <UtensilsCrossed className="h-3 w-3 text-amber-400" />
            <span>Table Ordering</span>
          </span>

          {/* Rating */}
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30 backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>4.9 (1.4k+ reviews)</span>
          </span>
        </div>

        <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
          {restaurant.name}
        </h1>

        <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-300 line-clamp-2 drop-shadow">
          {restaurant.tagline}
        </p>

        {/* Info Grid */}
        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-neutral-300">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>{restaurant.address}, {restaurant.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>{restaurant.openingHours}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>FSSAI Lic: {restaurant.fssaiNumber}</span>
          </div>
        </div>

        {/* Table Confirmation Strip */}
        {tableNumber && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/15">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-neutral-950 font-black text-xs">
                {tableNumber}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ordering for Table {tableNumber}</p>
                <p className="text-[11px] text-neutral-300">Dishes will be delivered directly to your table</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
              Verified Session
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

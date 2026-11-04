"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  ChefHat,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Smartphone,
  Layers,
  UtensilsCrossed,
  Volume2,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function PresentationLandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-amber-500 selection:text-neutral-950">
      {/* Top Floating Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-black tracking-tight text-white">
                The Urban Plate
              </span>
              <p className="text-[11px] text-neutral-400 font-medium">
                Next-Gen Dine-In QR Ordering Ecosystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/menu?table=04&token=tbl_04_demo"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95"
            >
              <span>Launch Live Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>Commercial-Grade Restaurant SaaS Platform</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Turn Every Table Into An <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              Instant Ordering Machine
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
            A unified, real-time dining platform engineered for modern restaurants, cafes, and gastro-pubs.
            Customers scan table QR codes to browse, customize, and order — orders flash immediately on kitchen displays and admin consoles.
          </p>

          {/* Quick Launch Cards for Demonstrating All 3 Interfaces */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
            {/* 1. Customer Ordering App */}
            <Link
              href="/menu?table=04&token=tbl_04_demo"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl transition-all duration-300 hover:border-amber-500/50 hover:bg-neutral-900 hover:-translate-y-1.5"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                  <Smartphone className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Interface 01
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  Customer Ordering Menu
                </h3>
                <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                  Stunning food cards, dietary filters (Veg/Non-Veg), variant sizes, add-ons, table locking, coupons, and live order tracking.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                <span>Scan Table 04 View</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Restaurant Admin Dashboard */}
            <Link
              href="/admin"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl transition-all duration-300 hover:border-blue-500/50 hover:bg-neutral-900 hover:-translate-y-1.5"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                  Interface 02
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  Restaurant Admin SaaS
                </h3>
                <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                  Executive analytics, peak hour trends, live order approvals, instant out-of-stock toggles, table occupancy floor plan, and QR standee printing.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4 text-xs font-bold text-blue-400 group-hover:text-blue-300">
                <span>Open Admin Portal</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Kitchen Display System */}
            <Link
              href="/kds"
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-xl transition-all duration-300 hover:border-orange-500/50 hover:bg-neutral-900 hover:-translate-y-1.5"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <ChefHat className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest">
                  Interface 03
                </span>
                <h3 className="font-display text-xl font-bold text-white mt-1">
                  Kitchen Display (KDS)
                </h3>
                <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                  Tablet-optimized 4-column kanban for chefs. Prominent table indicators, elapsed cooking timers, customizations, and tactile action buttons.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-4 text-xs font-bold text-orange-400 group-hover:text-orange-300">
                <span>Open Kitchen Screen</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Live Loop Showcase */}
      <section className="border-t border-neutral-900 bg-neutral-900/40 py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
              The Real-Time Dine-In Lifecycle
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400">
              Watch how changes propagate instantaneously between guest tables, chefs, and restaurant managers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black mb-3">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Table Scan</h4>
              <p className="mt-1 text-neutral-400">
                Guest scans the unique table QR standee. Cryptographic tokens automatically lock the order to Table 04.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black mb-3">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Instant Kitchen Chime</h4>
              <p className="mt-1 text-neutral-400">
                Order lands immediately on KDS and Admin consoles with a high-fidelity synthesized chime.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black mb-3">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Live Order Tracking</h4>
              <p className="mt-1 text-neutral-400">
                As the chef taps &ldquo;Start Cooking&rdquo; or &ldquo;Mark Ready&rdquo;, the customer screen progresses without page refresh.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black mb-3">
                4
              </div>
              <h4 className="font-bold text-white text-sm">GST Digital Bill</h4>
              <p className="mt-1 text-neutral-400">
                Guests settle via Razorpay UPI or Pay at Counter, and download official 5% GST tax receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Matrix / Client Presentation Talking Points */}
      <section className="py-16 px-4 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white">
              Built Specifically for Restaurant Owners
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Commercial features that reduce staff overhead and increase table turnover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">Out-of-Stock Protection</h4>
                <p className="text-neutral-400 mt-0.5">
                  When a kitchen runs out of paneer or chicken, admin toggles the switch and dishes are immediately greyed out on all phones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">No App Download Required</h4>
                <p className="text-neutral-400 mt-0.5">
                  Customers scan with standard iPhone/Android camera app or Google Lens. Fast zero-install web application.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">Server-Side Price Security</h4>
                <p className="text-neutral-400 mt-0.5">
                  Customer-submitted totals are never trusted. All subtotals, variant add-ons, coupons, and 5% GST taxes are calculated securely on the server.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-sm">Printable Table Standees</h4>
                <p className="text-neutral-400 mt-0.5">
                  One-click printable A4 PDF/sheet formatted with brand typography, ready for table acrylic standees.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Footer Banner */}
          <div className="mt-12 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 p-8 text-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <h3 className="font-display text-2xl font-black">
                Ready to Experience the Demo?
              </h3>
              <p className="text-xs sm:text-sm font-medium text-neutral-900/90 mt-1">
                Open the customer ordering website, admin console, and kitchen display simultaneously in split tabs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/menu?table=04&token=tbl_04_demo"
                className="rounded-2xl bg-neutral-950 px-6 py-3.5 text-xs font-bold text-white hover:bg-neutral-900 transition-all shadow-lg active:scale-95"
              >
                Launch Live System
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 px-4 sm:px-8 text-center text-xs text-neutral-500">
        <p>The Urban Plate • Premium Restaurant SaaS Platform</p>
        <p className="mt-1 text-[11px]">Designed for high-volume dine-in restaurants, cafes, and gastro-bistros.</p>
      </footer>
    </div>
  );
}

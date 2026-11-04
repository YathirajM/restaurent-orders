"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Tags,
  QrCode,
  CreditCard,
  Percent,
  Settings,
  ChefHat,
  ExternalLink,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Live Orders", icon: ShoppingBag, badge: "Live" },
  { href: "/admin/menu", label: "Menu & Dishes", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/tables", label: "Tables & QR Codes", icon: QrCode },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/offers", label: "Offers & Coupons", icon: Percent },
  { href: "/admin/settings", label: "Restaurant Settings", icon: Settings },
];

export function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/80 bg-card transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sm tracking-tight text-foreground">
                The Urban Plate
              </h2>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Management SaaS
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-emerald-500/15 text-emerald-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Quick Switchers */}
        <div className="border-t border-border/60 p-3 space-y-2">
          <Link
            href="/kds"
            target="_blank"
            className="flex items-center justify-between rounded-xl bg-orange-500/10 border border-orange-500/20 p-2.5 text-xs font-bold text-orange-600 hover:bg-orange-500/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span>Kitchen Display</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </Link>

          <Link
            href="/menu"
            target="_blank"
            className="flex items-center justify-between rounded-xl bg-muted/60 border border-border p-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-amber-500" />
              <span>Customer Menu</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      </aside>
    </>
  );
}

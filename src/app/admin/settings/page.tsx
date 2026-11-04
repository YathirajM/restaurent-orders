"use client";

import React, { useState, useEffect } from "react";
import { RestaurantSettings } from "@/lib/types";
import {
  Save,
  Building,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Percent,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/restaurant")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch("/api/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Settings save error", err);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Restaurant Configuration
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage your legal entity, GSTIN, staff service charges, and kitchen operations.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Brand Info */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Building className="h-4 w-4 text-amber-500" />
            <h3 className="font-display font-bold text-sm text-foreground">
              Restaurant Profile & Branding
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Restaurant Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Support Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Physical Address & Location
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Legal & Taxation Settings */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="font-display font-bold text-sm text-foreground">
              Taxes, GST & Legal Compliance
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                GSTIN Number (Govt of India)
              </label>
              <input
                type="text"
                value={settings.gstNumber}
                onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs font-mono uppercase focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                FSSAI License Number
              </label>
              <input
                type="text"
                value={settings.fssaiNumber}
                onChange={(e) => setSettings({ ...settings, fssaiNumber: e.target.value })}
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                GST Tax Rate Percentage (%)
              </label>
              <input
                type="number"
                value={settings.taxRatePercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    taxRatePercent: parseFloat(e.target.value) || 5,
                  })
                }
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground">
                Standard restaurant tax is 5% (CGST 2.5% + SGST 2.5%)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Staff Service Charge (%)
              </label>
              <input
                type="number"
                value={settings.serviceChargePercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    serviceChargePercent: parseFloat(e.target.value) || 5,
                  })
                }
                className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Operating Toggles */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Clock className="h-4 w-4 text-blue-500" />
            <h3 className="font-display font-bold text-sm text-foreground">
              Operations & Dining Policies
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Restaurant Open for Orders
                </span>
                <span className="text-[11px] text-muted-foreground">
                  If toggled off, customers cannot place new orders
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.isRestaurantOpen}
                onChange={(e) =>
                  setSettings({ ...settings, isRestaurantOpen: e.target.checked })
                }
                className="h-4 w-4 text-amber-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Enable Pay at Counter
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Allow guests to pay via Cash/Card after their meal
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowPayAtCounter}
                onChange={(e) =>
                  setSettings({ ...settings, allowPayAtCounter: e.target.checked })
                }
                className="h-4 w-4 text-amber-500"
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Enable Staff Service Charge (5%)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Added to bill breakdown for staff welfare
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.isServiceChargeEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    isServiceChargeEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 text-amber-500"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save All Configurations</span>
          </button>
        </div>
      </form>
    </div>
  );
}

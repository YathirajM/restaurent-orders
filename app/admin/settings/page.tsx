"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

type Restaurant = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  openingHours: { open: string; close: string; days: number[] } | null;
  currency: string;
  currencySymbol: string;
  acceptOrders: boolean;
  taxConfig: Array<{ id: string; label: string; rate: number; isInclusiveOfMenuPrice: boolean }>;
  chargeConfig: Array<{ id: string; label: string; amount: number }>;
};

export default function SettingsPage() {
  const [form, setForm] = useState<Restaurant | null>(null);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/restaurant", { cache: "no-store" });
    const data = await res.json();
    setForm(data.restaurant);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field: string, value: unknown) =>
    setForm((f) => (f ? { ...f, [field]: value } : f));

  const save = async () => {
    if (!form) return;
    const res = await fetch("/api/admin/restaurant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      alert("Failed to save");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!form) return <div className="card p-8 text-center text-ink-500">Loading…</div>;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-sm text-ink-500">Restaurant branding &amp; configuration</p>
        </div>
        <button onClick={save} className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Save size={16} /> {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Restaurant Details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Restaurant Name</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input
              value={form.tagline ?? ""}
              onChange={(e) => update("tagline", e.target.value)}
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              className="input min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Address</label>
            <input
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Currency</label>
            <input value={form.currency} onChange={(e) => update("currency", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Currency Symbol</label>
            <input
              value={form.currencySymbol}
              onChange={(e) => update("currencySymbol", e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.acceptOrders}
              onChange={(e) => update("acceptOrders", e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm font-semibold text-ink-700">Accept orders</label>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Opening Hours</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Open</label>
            <input
              value={form.openingHours?.open ?? ""}
              onChange={(e) =>
                update("openingHours", { ...form.openingHours, open: e.target.value })
              }
              className="input"
              placeholder="11:00"
            />
          </div>
          <div>
            <label className="label">Close</label>
            <input
              value={form.openingHours?.close ?? ""}
              onChange={(e) =>
                update("openingHours", { ...form.openingHours, close: e.target.value })
              }
              className="input"
              placeholder="23:00"
            />
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Taxes &amp; Charges</h2>
        <p className="mb-3 text-sm text-ink-500">
          These are read from the seeded configuration. Edit the seed script to change them.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {form.taxConfig.map((t) => (
            <div key={t.id} className="rounded-xl bg-cream-dark p-3">
              <p className="text-sm font-semibold text-ink-800">{t.label}</p>
              <p className="text-xs text-ink-500">{t.rate}%</p>
            </div>
          ))}
          {form.chargeConfig.map((c) => (
            <div key={c.id} className="rounded-xl bg-cream-dark p-3">
              <p className="text-sm font-semibold text-ink-800">{c.label}</p>
              <p className="text-xs text-ink-500">₹{c.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
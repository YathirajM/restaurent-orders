"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IndianRupee, ClipboardList, Hourglass, CheckCircle2, TrendingUp } from "lucide-react";

type Stats = {
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  avgOrderValue: number;
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load stats");
        setStats((await res.json()) as Stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, []);

  const cards = stats
    ? [
        { label: "Today's Sales", value: `₹${stats.todaySales.toLocaleString("en-IN")}`, icon: IndianRupee, tint: "bg-sage-50 text-sage-700" },
        { label: "Orders Today", value: stats.totalOrders, icon: ClipboardList, tint: "bg-ember-50 text-ember-700" },
        { label: "In Progress", value: stats.pendingOrders, icon: Hourglass, tint: "bg-saffron-50 text-saffron-700" },
        { label: "Completed", value: stats.completedOrders, icon: CheckCircle2, tint: "bg-ink-100 text-ink-700" },
      ]
    : [];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Overview</h1>
          <p className="text-sm text-ink-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link href="/kitchen" className="btn-secondary !py-2 !text-[13px]">
          Open Kitchen Display
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-chili-50 p-4 text-sm text-chili-700">{error}</div>
      )}

      {!stats && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, tint }) => (
              <div key={label} className="card p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
                  <Icon size={18} />
                </div>
                <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
                <p className="text-sm text-ink-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="card mt-4 flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-700">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="font-display text-xl font-bold">
                ₹{stats.avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-ink-500">Average order value today</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

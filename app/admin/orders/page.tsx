"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  lineTotal: number;
  selections: Array<{ groupLabel: string; optionLabel: string; priceDelta: number }>;
  notes: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  customerName: string;
  tableLabel: string | null;
  subtotal: number;
  taxTotal: number;
  chargeTotal: number;
  total: number;
  currency: string;
  currencySymbol: string;
  specialInstructions: string | null;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_COLORS: Record<string, string> = {
  placed: "badge-saffron",
  accepted: "badge-ember",
  preparing: "badge-ember",
  ready: "badge-sage",
  completed: "badge-sage",
  cancelled: "bg-ink-100 text-ink-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const url =
      filter === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${filter}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    setOrders(data.orders ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-sm text-ink-500">{orders.length} orders</p>
      </div>

      <div className="card mb-4 flex flex-wrap gap-2 p-3">
        {["all", "placed", "accepted", "preparing", "ready", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === s ? "bg-ember-500 text-white" : "bg-cream-dark text-ink-600 hover:bg-ink-100"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink-900">#{o.orderNumber}</span>
                    <span className={`badge ${STATUS_COLORS[o.status] ?? "badge-saffron"}`}>{o.status}</span>
                    <span className="badge badge-ink">{o.paymentStatus}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-600">
                    {o.customerName} · {o.tableLabel ?? "No table"} ·{" "}
                    {new Date(o.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-ink-900">
                    {formatMoney(o.total, o.currencySymbol)}
                  </p>
                  <p className="text-xs text-ink-500">
                    {o.paymentMethod ?? "cash"} · {o.currency}
                  </p>
                </div>
              </div>

              {o.items.length > 0 && (
                <ul className="mt-3 divide-y divide-ink-100 border-t border-dashed border-ink-200 pt-3">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex items-start justify-between gap-3 py-1.5 text-sm">
                      <div>
                        <p className="text-ink-800">
                          {i.quantity} × {i.name}
                        </p>
                        {i.selections.length > 0 && (
                          <p className="text-xs text-ink-500">
                            {i.selections.map((s) => s.optionLabel).join(" · ")}
                          </p>
                        )}
                        {i.notes && <p className="text-xs italic text-ink-400">“{i.notes}”</p>}
                      </div>
                      <span className="font-semibold text-ink-900">
                        {formatMoney(i.lineTotal, o.currencySymbol)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {o.specialInstructions && (
                <p className="mt-3 rounded-xl bg-cream-dark p-3 text-xs text-ink-600">
                  <span className="font-semibold">Note: </span>
                  {o.specialInstructions}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
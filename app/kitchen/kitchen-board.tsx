"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

type KOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  tableLabel: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: number;
  currency: string;
  specialInstructions: string | null;
  createdAt: string;
  items: {
    id: string;
    name: string;
    selections: { groupLabel: string; optionLabel: string; priceDelta: number }[];
    quantity: number;
    notes: string | null;
  }[];
};

const COLUMNS = [
  { id: "placed", title: "New Orders", next: "accepted", nextLabel: "ACCEPT" },
  { id: "accepted", title: "Accepted", next: "preparing", nextLabel: "START PREPARING" },
  { id: "preparing", title: "Preparing", next: "ready", nextLabel: "MARK AS READY" },
  { id: "ready", title: "Ready", next: "completed", nextLabel: "COMPLETED" },
] as const;

function elapsedSince(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function KitchenBoard({ userName }: { userName: string }) {
  const [orders, setOrders] = useState<KOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login?next=/kitchen");
        return;
      }
      if (!res.ok) throw new Error("Failed to load orders");
      const data = (await res.json()) as { orders: KOrder[] };
      setOrders(data.orders);
      setOnline(true);
      setError(null);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load + polling every 5s + clock tick for elapsed times.
  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    const clock = setInterval(() => setTick((t) => t + 1), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  const transition = async (orderId: string, status: string) => {
    setBusyId(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const active = orders.filter((o) => o.status !== "completed");

  return (
    <div className="min-h-dvh bg-ink-950 text-ink-100">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-ink-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-500 font-bold">
            🍳
          </span>
          <div>
            <h1 className="font-display text-lg font-bold">Kitchen Display</h1>
            <p className="text-xs text-ink-400">{userName} · live board</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              online ? "bg-sage-900/60 text-sage-300" : "bg-chili-900/60 text-chili-300"
            }`}
          >
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            {online ? "Live" : "Offline"}
          </span>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold hover:bg-ink-700"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-semibold hover:bg-ink-700"
          >
            <LogOut size={13} /> Exit
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-5 mt-3 rounded-xl bg-chili-900/50 p-3 text-sm text-chili-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-[70vh] items-center justify-center text-ink-400">
          Loading orders…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.id);
            return (
              <section key={col.id} className="flex min-w-0 flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-ink-300">
                    {col.title}
                  </h2>
                  <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs font-bold text-ink-300">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colOrders.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-ink-800 p-6 text-center text-xs text-ink-500">
                      No orders
                    </div>
                  )}
                  {colOrders.map((order) => {
                    const isLate =
                      order.status === "placed" &&
                      Date.now() - new Date(order.createdAt).getTime() > 10 * 60 * 1000;
                    const busy = busyId === order.id;
                    return (
                      <article
                        key={order.id}
                        className={`rounded-2xl border p-4 shadow-lift transition-colors ${
                          isLate
                            ? "border-chili-500 bg-chili-950/60"
                            : "border-ink-800 bg-ink-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-bold text-white">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isLate ? "text-chili-400" : "text-ink-400"
                            }`}
                            data-tick={tick}
                          >
                            {elapsedSince(order.createdAt)} ago
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {order.customerName} · Table {order.tableLabel} ·{" "}
                          <span
                            className={
                              order.paymentStatus === "paid"
                                ? "text-sage-400"
                                : order.paymentStatus === "failed"
                                  ? "text-chili-400"
                                  : "text-saffron-400"
                            }
                          >
                            {order.paymentStatus}
                            {order.paymentMethod === "simulated" ? " (sim)" : ""}
                          </span>
                        </p>

                        <ul className="mt-3 space-y-1.5 border-t border-ink-800 pt-3">
                          {order.items.map((item) => (
                            <li key={item.id} className="text-sm">
                              <span className="font-bold text-saffron-300">
                                {item.quantity}×
                              </span>{" "}
                              <span className="text-ink-100">{item.name}</span>
                              {item.selections.length > 0 && (
                                <p className="pl-6 text-xs text-ink-400">
                                  {item.selections
                                    .map((s) => s.optionLabel)
                                    .join(" · ")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="pl-6 text-xs font-semibold text-saffron-300">
                                  ↳ {item.notes}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>

                        {order.specialInstructions && (
                          <p className="mt-2 rounded-lg bg-ink-800 p-2 text-xs text-ink-300">
                            <span className="font-bold text-ink-200">Note: </span>
                            {order.specialInstructions}
                          </p>
                        )}

                        <button
                          onClick={() => transition(order.id, col.next)}
                          disabled={busy}
                          className={`mt-3 w-full rounded-xl py-2.5 text-xs font-black tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 ${
                            col.id === "ready"
                              ? "bg-sage-500 text-white hover:bg-sage-600"
                              : col.id === "placed"
                                ? "bg-ember-500 text-white hover:bg-ember-600"
                                : "bg-ink-700 text-ink-100 hover:bg-ink-600"
                          }`}
                        >
                          {busy ? "…" : col.nextLabel}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Completed count footnote */}
      <footer className="border-t border-ink-800 px-5 py-3 text-center text-xs text-ink-500">
        {active.length} active order{active.length === 1 ? "" : "s"} · board
        refreshes every 5 seconds
      </footer>
    </div>
  );
}

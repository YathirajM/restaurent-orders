"use client";

import React, { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Receipt,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Payments load error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const totalCollected = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCollection = orders
    .filter((o) => o.paymentStatus === "pending")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const onlineRazorpayTotal = orders
    .filter((o) => o.paymentMethod === "razorpay" && o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const counterSettledTotal = orders
    .filter((o) => o.paymentMethod === "pay_at_counter" && o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const filteredOrders = orders.filter((o) => {
    if (methodFilter !== "all" && o.paymentMethod !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchTable = o.tableNumber.toLowerCase().includes(q);
      const matchCust = o.customerName.toLowerCase().includes(q);
      const matchRzp = o.razorpayPaymentId?.toLowerCase().includes(q);
      if (!matchNum && !matchTable && !matchCust && !matchRzp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">
          Payments & Settlement Ledger
        </h1>
        <p className="text-xs text-muted-foreground">
          Audit online Razorpay UPI/Card transactions and table counter settlements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Settled Revenue
          </span>
          <div className="mt-3 font-display text-2xl font-black text-emerald-600">
            {formatCurrency(totalCollected)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {orders.filter((o) => o.paymentStatus === "paid").length} paid tickets
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Pending Counter Collection
          </span>
          <div className="mt-3 font-display text-2xl font-black text-amber-600">
            {formatCurrency(pendingCollection)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting guest table settlement
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Razorpay Online (UPI/Cards)
          </span>
          <div className="mt-3 font-display text-2xl font-black text-blue-600">
            {formatCurrency(onlineRazorpayTotal)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Direct instant digital settlement
          </p>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Counter Settlements
          </span>
          <div className="mt-3 font-display text-2xl font-black text-purple-600">
            {formatCurrency(counterSettledTotal)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Collected via cash or POS machine
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setMethodFilter("all")}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
              methodFilter === "all"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All Methods
          </button>
          <button
            onClick={() => setMethodFilter("razorpay")}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
              methodFilter === "razorpay"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Razorpay Online
          </button>
          <button
            onClick={() => setMethodFilter("pay_at_counter")}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
              methodFilter === "pay_at_counter"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Pay at Counter
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payment ID, order #, table..."
            className="w-full rounded-xl border border-input bg-card py-1.5 pl-9 pr-3 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/60 bg-muted/40 text-muted-foreground uppercase font-bold tracking-wider">
              <tr>
                <th className="p-4">Order & Table</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Transaction / Ref ID</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-bold text-foreground">
                    <div>#{ord.orderNumber}</div>
                    <div className="text-[11px] text-amber-600">Table {ord.tableNumber}</div>
                  </td>
                  <td className="p-4 text-foreground font-medium">
                    {ord.customerName}
                    {ord.customerPhone && (
                      <div className="text-[10px] text-muted-foreground">{ord.customerPhone}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      {ord.paymentMethod === "razorpay" ? (
                        <>
                          <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                          <span>Razorpay Online</span>
                        </>
                      ) : (
                        <>
                          <Banknote className="h-3.5 w-3.5 text-purple-500" />
                          <span>Pay at Counter</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-muted-foreground">
                    {ord.razorpayPaymentId || "COUNTER_CASH_POS"}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatDate(ord.createdAt)}, {formatTime(ord.createdAt)}
                  </td>
                  <td className="p-4 font-display font-black text-foreground">
                    {formatCurrency(ord.totalAmount)}
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        ord.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

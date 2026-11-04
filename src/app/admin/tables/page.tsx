"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Table } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { generateQrDataUrl } from "@/lib/qr";
import {
  QrCode,
  Printer,
  Plus,
  Download,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // New Table Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");

  // Print Mode Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      if (data.success && data.data) {
        setTables(data.data);
        generateAllQrs(data.data);
      }
    } catch (err) {
      console.error("Tables fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAllQrs = async (tableList: Table[]) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const map: Record<string, string> = {};

    for (const t of tableList) {
      const tableUrl = `${origin}/menu?table=${t.tableNumber}&token=${t.qrToken}`;
      const dataUrl = await generateQrDataUrl(tableUrl);
      map[t.id] = dataUrl;
    }
    setQrMap(map);
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: newTableNum.trim().padStart(2, "0"),
          capacity: parseInt(newCapacity) || 4,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewTableNum("");
        fetchTables();
      }
    } catch (err) {
      console.error("Create table error", err);
    }
  };

  const downloadQr = (table: Table) => {
    const dataUrl = qrMap[table.id];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `TheUrbanPlate_Table_${table.tableNumber}_QR.png`;
    a.click();
  };

  const occupiedCount = tables.filter((t) => t.status !== "available").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Table Floor Plan & QR Codes
          </h1>
          <p className="text-xs text-muted-foreground">
            Unique cryptographic QR tokens for each table standee. {occupiedCount} of{" "}
            {tables.length} tables occupied.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print All QR Cards Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4 text-amber-500" />
            <span>Print All QR Standees</span>
          </button>

          {/* Add Table Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {tables.map((table) => {
          const isOccupied = table.status === "occupied" || table.status === "billing";
          const qrData = qrMap[table.id];

          return (
            <div
              key={table.id}
              className={`rounded-3xl border bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                isOccupied
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-border/80"
              }`}
            >
              <div>
                {/* Table Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl font-display text-base font-black shadow-xs ${
                        isOccupied
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {table.tableNumber}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-foreground">
                        Table {table.tableNumber}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{table.capacity} Seater</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      table.status === "available"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : table.status === "billing"
                        ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="my-4 flex flex-col items-center justify-center rounded-2xl bg-white p-3 border border-border/60 shadow-xs">
                  {qrData ? (
                    <div className="relative h-32 w-32">
                      <Image
                        src={qrData}
                        alt={`QR code for Table ${table.tableNumber}`}
                        fill
                        sizes="128px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-32 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-spin" />
                    </div>
                  )}
                  <span className="mt-1 font-mono text-[9px] text-neutral-500 font-semibold truncate max-w-[140px]">
                    {table.qrToken}
                  </span>
                </div>

                {/* Occupancy Info */}
                {isOccupied && table.currentBill ? (
                  <div className="mb-3 rounded-xl bg-amber-500/15 border border-amber-500/30 p-2 text-center text-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                      Current Table Bill
                    </span>
                    <div className="font-display font-black text-amber-600 text-sm">
                      {formatCurrency(table.currentBill)}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Bottom Quick Actions */}
              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                {/* Test Customer View */}
                <Link
                  href={`/menu?table=${table.tableNumber}&token=${table.qrToken}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-500 transition-colors"
                >
                  <span>Test Scan</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>

                {/* Download PNG */}
                <button
                  onClick={() => downloadQr(table)}
                  className="flex items-center gap-1 rounded-lg hover:bg-muted p-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Download Standee QR PNG"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold">PNG</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-background border border-border p-6 shadow-2xl">
            <h3 className="font-display font-bold text-base text-foreground mb-3">
              Add New Dining Table
            </h3>
            <form onSubmit={handleCreateTable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  placeholder="e.g. 13"
                  className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  placeholder="4"
                  className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-600"
                >
                  Generate & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable All QR Cards Sheet Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-4 sm:p-8 flex justify-center">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 sm:p-10 shadow-2xl text-black">
            {/* Control bar */}
            <div className="flex items-center justify-between border-b pb-4 mb-6 no-print">
              <div>
                <h3 className="font-display font-bold text-lg text-black">
                  Print Table Standees (Ready to Print)
                </h3>
                <p className="text-xs text-neutral-600">
                  Formatted in A4 grid for acrylic table standee displays.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Standee Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="qr-print-card flex flex-col items-center justify-between rounded-2xl border-2 border-neutral-900 p-6 text-center shadow-xs bg-white"
                >
                  {/* Restaurant Brand */}
                  <div>
                    <h4 className="font-display text-sm font-black tracking-wider uppercase text-neutral-900">
                      The Urban Plate
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      Scan to Order & Pay
                    </p>
                  </div>

                  {/* QR Image */}
                  <div className="my-4">
                    {qrMap[table.id] && (
                      <div className="relative h-36 w-36">
                        <Image
                          src={qrMap[table.id]}
                          alt={`QR ${table.tableNumber}`}
                          fill
                          sizes="144px"
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Table Badge */}
                  <div className="w-full rounded-xl bg-neutral-900 py-1.5 text-white">
                    <span className="font-display text-base font-black tracking-widest uppercase">
                      Table {table.tableNumber}
                    </span>
                  </div>

                  <p className="mt-2 text-[9px] text-neutral-400">
                    Camera &bull; UPI &bull; No App Required
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

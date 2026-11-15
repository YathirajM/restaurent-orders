"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, QrCode } from "lucide-react";

type Table = {
  id: string;
  label: string;
  qrToken: string;
  isActive: boolean;
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [newLabel, setNewLabel] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/tables", { cache: "no-store" });
    const data = await res.json();
    setTables(data.tables ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const addTable = async () => {
    if (!newLabel.trim()) return;
    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    if (!res.ok) {
      alert("Failed to create table");
      return;
    }
    setNewLabel("");
    await load();
  };

  const regenerate = async (id: string) => {
    const label = tables.find((t) => t.id === id)?.label ?? "Table";
    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: true, tableId: id, label }),
    });
    if (!res.ok) {
      alert("Failed to regenerate");
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this table?")) return;
    await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    await load();
  };

  const qrUrl = (token: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/t/${token}`;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Tables &amp; QR</h1>
          <p className="text-sm text-ink-500">{tables.length} tables</p>
        </div>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New table label (e.g., Table 5)"
            className="input"
            onKeyDown={(e) => e.key === "Enter" && addTable()}
          />
          <button onClick={addTable} className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
            <Plus size={16} /> Add Table
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">No tables yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-900">{t.label}</h3>
                  <p className="mt-1 font-mono text-xs text-ink-400">{t.qrToken}</p>
                </div>
                <span className={`badge ${t.isActive ? "badge-sage" : "bg-ink-100 text-ink-500"}`}>
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={qrUrl(t.qrToken)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-xs"
                >
                  <QrCode size={14} /> Open menu
                </a>
                <button
                  onClick={() => regenerate(t.id)}
                  className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-xs"
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
                <button
                  onClick={() => remove(t.id)}
                  className="btn-secondary flex items-center gap-2 !py-2 !px-3 text-xs text-chili-600 hover:bg-chili-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
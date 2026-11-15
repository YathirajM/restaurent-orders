"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { FoodEditor } from "./food-editor";

type Category = { id: string; name: string };
type FoodItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageId: string | null;
  isVeg: boolean;
  isBestseller: boolean;
  isChefSpecial: boolean;
  isAvailable: boolean;
  categoryId: string;
  optionGroups: Array<{
    id: string;
    label: string;
    selectionType: "single" | "multi";
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    options: Array<{ id: string; label: string; priceDelta: number; isAvailable: boolean }>;
  }>;
};

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [editing, setEditing] = useState<FoodItem | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/menu", { cache: "no-store" });
    const data = await res.json();
    setCategories(data.categories ?? []);
    setItems(data.items ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const createItem = async () => {
    const name = prompt("Food name:", "New Dish");
    if (!name?.trim()) return;
    const catId = categories[0]?.id ?? "";
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: "",
        price: 0,
        categoryId: catId,
        isVeg: true,
        isAvailable: true,
        optionGroups: [],
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Failed to create");
      return;
    }
    await load();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Menu</h1>
          <p className="text-sm text-ink-500">{items.length} items</p>
        </div>
        <button onClick={createItem} className="btn-primary flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">
          No food items yet. Click “Add Item” to create one.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-dark text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Badges</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-cream-dark/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          item.isVeg ? "bg-sage-50 text-sage-700" : "bg-chili-50 text-chili-700"
                        }`}
                      >
                        {item.isVeg ? "V" : "NV"}
                      </span>
                      <div>
                        <p className="font-semibold text-ink-900">{item.name}</p>
                        <p className="text-xs text-ink-500">{item.optionGroups.length} option group(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink-900">₹{item.price}</td>
                  <td className="px-5 py-3 text-ink-600">
                    {categories.find((c) => c.id === item.categoryId)?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.isBestseller && <span className="badge badge-ember">Bestseller</span>}
                      {item.isChefSpecial && <span className="badge badge-saffron">Chef Special</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`badge ${
                        item.isAvailable ? "badge-sage" : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setEditing(item)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ember-600 hover:bg-ember-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <FoodEditor
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
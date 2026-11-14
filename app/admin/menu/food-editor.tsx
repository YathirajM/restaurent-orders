"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Plus, Trash2, ArrowDown, ArrowUp, Settings, Save, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";

type OptionRow = {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
};

type GroupRow = {
  id: string;
  label: string;
  selectionType: "single" | "multi";
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: OptionRow[];
};

type FoodItemRow = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageId?: string | null;
  isVeg: boolean;
  isBestseller: boolean;
  isChefSpecial: boolean;
  isAvailable: boolean;
  categoryId: string;
  optionGroups: GroupRow[];
};

/**
 * Food editor — inline, supports:
 *  - name, price, description, veg toggle, badges, image
 *  - categories (static prop)
 *  - option groups: label, selectionType, required, min/max, and options with priceDelta
 *  - reorder groups and options
 *  - manual image upload -> /api/admin/upload (returns id)
 */

export function FoodEditor({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: FoodItemRow;
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    imageId: item.imageId ?? "",
    isVeg: item.isVeg,
    isBestseller: item.isBestseller,
    isChefSpecial: item.isChefSpecial,
    isAvailable: item.isAvailable,
    categoryId: item.categoryId,
    optionGroups: item.optionGroups.map((g) => ({
      id: g.id,
      label: g.label,
      selectionType: g.selectionType,
      isRequired: g.isRequired,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({ id: o.id, label: o.label, priceDelta: o.priceDelta, isAvailable: o.isAvailable })),
    })),
  });

  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const addOptionGroup = () => {
    const id = crypto.randomUUID();
    update("optionGroups", [
      ...form.optionGroups,
      {
        id,
        label: `New Group ${form.optionGroups.length + 1}`,
        selectionType: "single" as const,
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        options: [],
      },
    ]);
  };

  const updateGroup = (groupId: string, patch: Partial<typeof form.optionGroups[number]>) => {
    update("optionGroups", form.optionGroups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  };

  const removeGroup = (groupId: string) => update("optionGroups", form.optionGroups.filter((g) => g.id !== groupId));

  const addOption = (groupId: string) => {
    const group = form.optionGroups.find((g) => g.id === groupId);
    if (!group) return;
    const id = crypto.randomUUID();
    update("optionGroups", form.optionGroups.map((g) => (g.id === groupId ? { ...g, options: [...g.options, { id, label: `New Option`, priceDelta: 0, isAvailable: true }] } : g)));
  };

  const updateOption = (groupId: string, optionId: string, patch: Partial<(typeof form.optionGroups)[number]["options"][number]>) => {
    update("optionGroups", form.optionGroups.map((g) => (g.id === groupId ? { ...g, options: g.options.map((o: (typeof form.optionGroups)[number]["options"][number]) => (o.id === optionId ? { ...o, ...patch } : o)) } : g)));
  };

  const removeOption = (groupId: string, optionId: string) => update("optionGroups", form.optionGroups.map((g) => (g.id === groupId ? { ...g, options: g.options.filter((o: (typeof form.optionGroups)[number]["options"][number]) => o.id !== optionId) } : g)));

  const moveGroup = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= form.optionGroups.length) return;
    const copy = [...form.optionGroups];
    const [item] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, item);
    update("optionGroups", copy);
  };

  const moveOption = (groupId: string, fromIdx: number, toIdx: number) => {
    const group = form.optionGroups.find((g) => g.id === groupId);
    if (!group) return;
    const copy = [...group.options];
    if (toIdx < 0 || toIdx >= copy.length) return;
    const [item] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, item);
    updateGroup(groupId, { options: copy });
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { id } = await res.json();
      update("imageId", id);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed – try again");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
        onSaved();
      }, 1200);
    } catch (err) {
      console.error("Save error:", err);
      alert(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
      setSaveStatus("idle");
    }
  };

  const replaceGroups = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/menu/${item.id}/options`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionGroups: form.optionGroups }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to replace groups");
      }
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
        onSaved();
      }, 1200);
    } catch (err) {
      console.error("Replace groups error:", err);
      alert(`Failed to replace groups: ${err instanceof Error ? err.message : "Unknown error"}`);
      setSaveStatus("idle");
    }
  };

  const deleteItem = async () => {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      onClose();
      onSaved();
    } else {
      alert("Failed to delete");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-lift">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200"
        >
          <X size={18} />
        </button>

        <h2 className="font-display text-xl font-bold text-ink-900">Edit Food Item</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Basic */}
          <section className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="input"
                placeholder="e.g., Butter Chicken"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="input min-h-[80px] resize-none"
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="label">Price</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update("price", Number(e.target.value) || 0)}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className="input">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isVeg} onChange={(e) => update("isVeg", e.target.checked)} className="h-4 w-4" />
                Veg
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => update("isAvailable", e.target.checked)} className="h-4 w-4" />
                Available
              </label>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isBestseller} onChange={(e) => update("isBestseller", e.target.checked)} className="h-4 w-4" />
                Bestseller
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isChefSpecial} onChange={(e) => update("isChefSpecial", e.target.checked)} className="h-4 w-4" />
                Chef Special
              </label>
            </div>
            <div>
              <label className="label">Image</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary flex items-center gap-2 !px-4 !py-2"
                >
                  <Upload size={16} /> Upload
                </button>
                <input type="file" ref={fileRef} onChange={uploadImage} accept="image/*" className="hidden" />
                {form.imageId && <span className="text-xs text-ink-500">ID: {form.imageId}</span>}
              </div>
            </div>
          </section>

          {/* Option groups */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink-800">Option Groups</h3>
              <button onClick={addOptionGroup} className="btn-secondary flex items-center gap-2 !px-3 !py-1.5">
                <Plus size={14} /> Add Group
              </button>
            </div>

            {form.optionGroups.map((group, gi) => (
              <div key={group.id} className="card p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <input
                    value={group.label}
                    onChange={(e) => updateGroup(group.id, { label: e.target.value })}
                    placeholder="Group label (e.g., Size)"
                    className="font-semibold text-ink-900 input !py-2"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => moveGroup(gi, gi - 1)} className="p-1 text-ink-500 hover:text-ink-800">
                      <ArrowUp size={15} />
                    </button>
                    <button onClick={() => moveGroup(gi, gi + 1)} className="p-1 text-ink-500 hover:text-ink-800">
                      <ArrowDown size={15} />
                    </button>
                    <button onClick={() => removeGroup(group.id)} className="p-1 text-chili-500 hover:text-chili-700">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1">
                      <input type="radio" name={`${group.id}-type`} checked={group.selectionType === "single"} onChange={() => updateGroup(group.id, { selectionType: "single" })} className="h-3.5 w-3.5" />
                      Single
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="radio" name={`${group.id}-type`} checked={group.selectionType === "multi"} onChange={() => updateGroup(group.id, { selectionType: "multi" })} className="h-3.5 w-3.5" />
                      Multi
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={group.isRequired} onChange={(e) => updateGroup(group.id, { isRequired: e.target.checked })} className="h-3.5 w-3.5" />
                      Required
                    </label>
                    <input
                      type="number"
                      value={group.minSelect}
                      onChange={(e) => updateGroup(group.id, { minSelect: Number(e.target.value) || 0 })}
                      className="input !w-16 !py-1.5 !text-xs"
                      min={0}
                    />
                    <span className="text-ink-500">to</span>
                    <input
                      type="number"
                      value={group.maxSelect}
                      onChange={(e) => updateGroup(group.id, { maxSelect: Number(e.target.value) || 1 })}
                      className="input !w-16 !py-1.5 !text-xs"
                      min={1}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-ink-600">OPTIONS</h4>
                    <button onClick={() => addOption(group.id)} className="text-xs font-semibold text-ember-600 hover:text-ember-700">
                      + Add Option
                    </button>
                  </div>
                  {group.options.map((opt, oi) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        value={opt.label}
                        onChange={(e) => updateOption(group.id, opt.id, { label: e.target.value })}
                        placeholder="Option label"
                        className="input !py-1.5 !text-xs"
                      />
                      <input
                        type="number"
                        value={opt.priceDelta}
                        onChange={(e) => updateOption(group.id, opt.id, { priceDelta: Number(e.target.value) || 0 })}
                        className="input !w-20 !py-1.5 !text-xs"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={opt.isAvailable} onChange={(e) => updateOption(group.id, opt.id, { isAvailable: e.target.checked })} className="h-3.5 w-3.5" />
                        Available
                      </label>
                      <button onClick={() => moveOption(group.id, oi, oi - 1)} className="p-1 text-ink-400 hover:text-ink-700">
                        <ArrowUp size={13} />
                      </button>
                      <button onClick={() => moveOption(group.id, oi, oi + 1)} className="p-1 text-ink-400 hover:text-ink-700">
                        <ArrowDown size={13} />
                      </button>
                      <button onClick={() => removeOption(group.id, opt.id)} className="p-1 text-chili-500 hover:text-chili-700">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className="mt-8 flex justify-between gap-4 border-t pt-4">
          <button
            onClick={deleteItem}
            className="btn-secondary flex items-center gap-2 text-sm text-chili-600 hover:bg-chili-50"
          >
            <XCircle size={16} /> Delete Item
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost text-sm">
              Cancel
            </button>
            <button onClick={save} disabled={saveStatus === "saving"} className="btn-primary flex items-center gap-2 text-sm">
              {saveStatus === "saving" ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : saveStatus === "saved" ? (
                "Saved ✓"
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
            <button onClick={replaceGroups} className="btn-primary flex items-center gap-2 text-sm">
              <Settings size={16} /> Replace Option Groups
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

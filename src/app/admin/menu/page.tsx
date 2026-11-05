"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Product, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { realtime } from "@/lib/realtime";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Flame,
  Award,
  Trash2,
  Edit,
  X,
  Check,
  CheckCircle2,
  Utensils,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Camera,
} from "lucide-react";

const PRESET_DISH_PHOTOS = [
  { label: "Starters / Appetizer", url: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&q=80" },
  { label: "Paneer / Tikka", url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&q=80" },
  { label: "Biryani / Rice", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80" },
  { label: "Chicken / Curry", url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&q=80" },
  { label: "Wood-Fired Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80" },
  { label: "Gourmet Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80" },
  { label: "Italian Pasta", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80" },
  { label: "Asian / Noodles", url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80" },
  { label: "Dessert / Cake", url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80" },
  { label: "Cocktail / Beverage", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80" },
];

export default function AdminMenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [prepTime, setPrepTime] = useState("15");
  const [isVeg, setIsVeg] = useState(true);
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [isBestseller, setIsBestseller] = useState(false);
  const [isChefSpecial, setIsChefSpecial] = useState(false);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) setProducts(prodData.data);
      if (catData.success) {
        setCategories(catData.data);
        if (catData.data.length > 0 && !categoryId) {
          setCategoryId(catData.data[0].id);
        }
      }
    } catch (err) {
      console.error("Menu fetch error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setPortionSize("Serves 1-2");
    setPrepTime("15");
    setIsVeg(true);
    setImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=75");
    setDescription("");
    setIsBestseller(false);
    setIsChefSpecial(false);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategoryId(prod.categoryId);
    setPrice(prod.price.toString());
    setPortionSize(prod.portionSize);
    setPrepTime(prod.preparationTimeMinutes.toString());
    setIsVeg(prod.isVeg);
    setImage(prod.image);
    setDescription(prod.description);
    setIsBestseller(prod.isBestseller);
    setIsChefSpecial(prod.isChefSpecial);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Image must be smaller than 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      categoryId,
      price: parseFloat(price) || 299,
      portionSize,
      preparationTimeMinutes: parseInt(prepTime) || 15,
      isVeg,
      image: image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=75",
      description,
      isBestseller,
      isChefSpecial,
      isAvailable: editingProduct ? editingProduct.isAvailable : true,
      spiceLevel: 1,
      ingredients: ["Fresh produce", "Chef secret blend"],
    };

    try {
      if (editingProduct) {
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? data.data : p))
          );
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data) {
          setProducts((prev) => [data.data, ...prev]);
        }
      }
      realtime.emit("MENU_UPDATED", {});
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save product error", err);
    }
  };

  // Instant Stock Availability Toggle
  const handleToggleStock = async (prodId: string) => {
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prodId, action: "toggle-availability" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prodId ? data.data : p))
        );
        realtime.emit("PRODUCT_AVAILABILITY_CHANGED", data.data);
      }
    } catch (err) {
      console.error("Stock toggle error", err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm("Are you sure you want to remove this dish from the digital menu?")) return;
    try {
      const res = await fetch(`/api/products?id=${prodId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        realtime.emit("MENU_UPDATED", {});
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.categoryId !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.categoryName?.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground">
            Menu & Dish Catalog
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage dish pricing, ingredients, photos, and instant out-of-stock toggles.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
              categoryFilter === "all"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`flex-shrink-0 rounded-xl px-3 py-1.5 font-bold transition-all ${
                categoryFilter === cat.id
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish name..."
            className="w-full rounded-xl border border-input bg-card py-1.5 pl-9 pr-3 text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className={`flex flex-col justify-between rounded-3xl border bg-card p-4 shadow-xs transition-all hover:shadow-md ${
              !prod.isAvailable ? "opacity-60 bg-muted/30" : "border-border/80"
            }`}
          >
            <div>
              {/* Image & Quick Badges */}
              <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-muted">
                <Image
                  src={prod.image}
                  alt={prod.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/95 p-0.5 shadow-sm">
                    {prod.isVeg ? (
                      <div className="flex h-4 w-4 items-center justify-center rounded-xs border-2 border-emerald-600">
                        <div className="h-2 w-2 rounded-full bg-emerald-600" />
                      </div>
                    ) : (
                      <div className="flex h-4 w-4 items-center justify-center rounded-xs border-2 border-red-600">
                        <div className="h-0 w-0 border-x-2 border-x-transparent border-b-3 border-b-red-600" />
                      </div>
                    )}
                  </div>
                  {prod.isBestseller && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      Bestseller
                    </span>
                  )}
                </div>

                {!prod.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                    <span className="rounded-xl bg-red-600 px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="mt-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-foreground line-clamp-1">
                    {prod.name}
                  </h3>
                  <span className="font-display text-sm font-black text-foreground">
                    {formatCurrency(prod.price)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {prod.description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                  <span className="rounded-md bg-muted px-2 py-0.5">
                    {prod.categoryName || "General"}
                  </span>
                  <span>{prod.portionSize}</span>
                  <span>• {prod.preparationTimeMinutes}m prep</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
              {/* Instant Stock Switch */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prod.isAvailable}
                  onChange={() => handleToggleStock(prod.id)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="text-xs font-semibold text-foreground">
                  {prod.isAvailable ? "In Stock" : "Sold Out"}
                </span>
              </label>

              {/* Edit & Delete Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(prod)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit dish"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  title="Delete dish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-border p-6 shadow-2xl flex flex-col no-scrollbar">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">
                {editingProduct ? "Edit Dish Details" : "Create New Menu Item"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Dish Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Dish Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Truffle Infused Risotto"
                  className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Price in INR (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="449"
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Portion & Prep time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Portion Size
                  </label>
                  <input
                    type="text"
                    value={portionSize}
                    onChange={(e) => setPortionSize(e.target.value)}
                    placeholder="e.g. Serves 1-2, 350g, 8 pcs"
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Kitchen Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="15"
                    className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Veg / Non-Veg Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Dietary Classification
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="radio"
                      name="diet"
                      checked={isVeg}
                      onChange={() => setIsVeg(true)}
                    />
                    <span className="text-emerald-600 font-bold">Vegetarian (Veg)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                    <input
                      type="radio"
                      name="diet"
                      checked={!isVeg}
                      onChange={() => setIsVeg(false)}
                    />
                    <span className="text-red-600 font-bold">Non-Vegetarian</span>
                  </label>
                </div>
              </div>

              {/* Dish Photo Uploader & Selector */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Dish Photo
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Upload file, pick preset, or paste URL
                  </span>
                </div>

                {/* Photo Preview & Upload Controls */}
                <div className="flex items-center gap-3.5">
                  <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-border/70 bg-muted shadow-xs">
                    {image ? (
                      <img
                        src={image}
                        alt="Dish Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6 opacity-40" />
                        <span className="text-[9px] mt-1">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* File Upload Button */}
                    <label className="flex items-center justify-center gap-2 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-600 cursor-pointer transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Image URL Input */}
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full rounded-xl border border-input bg-card p-2 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Preset Photos */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                    Or select a sample photo:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {PRESET_DISH_PHOTOS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setImage(preset.url)}
                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg border p-1 text-[11px] transition-all ${
                          image === preset.url
                            ? "border-amber-500 bg-amber-500/15 font-bold text-amber-600 ring-2 ring-amber-500/30"
                            : "border-border/60 bg-card hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="h-7 w-7 rounded-md object-cover"
                        />
                        <span className="pr-1">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the flavors, preparation style, and signature notes..."
                  className="w-full rounded-xl border border-input bg-muted/40 p-2.5 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Badges Toggles */}
              <div className="flex gap-6 border-t border-border/40 pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                  />
                  <span>Mark as Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={isChefSpecial}
                    onChange={(e) => setIsChefSpecial(e.target.checked)}
                  />
                  <span>Chef&apos;s Special Pick</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600"
                >
                  {editingProduct ? "Save Changes" : "Add Dish to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

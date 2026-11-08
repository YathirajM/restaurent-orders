"use client";

import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Category, Product, RestaurantSettings } from "@/lib/types";
import { Navbar } from "@/components/customer/Navbar";
import { Banner } from "@/components/customer/Banner";
import { CategoryBar } from "@/components/customer/CategoryBar";
import { ProductCard } from "@/components/customer/ProductCard";
import { ProductModal } from "@/components/customer/ProductModal";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { CheckoutModal } from "@/components/customer/CheckoutModal";
import { realtime } from "@/lib/realtime";
import { generateTableToken } from "@/lib/qr";
import { Sparkles, Utensils } from "lucide-react";

// Dynamic imports for better code splitting
const DynamicProductModal = dynamic(
  () => import("@/components/customer/ProductModal").then((mod) => mod.ProductModal),
  { ssr: false }
);

const DynamicCartDrawer = dynamic(
  () => import("@/components/customer/CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);

const DynamicCheckoutModal = dynamic(
  () => import("@/components/customer/CheckoutModal").then((mod) => mod.CheckoutModal),
  { ssr: false }
);

function MenuContent() {
  const searchParams = useSearchParams();
  const { tableNumber, setTableSession } = useCart();

  const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [onlyBestsellers, setOnlyBestsellers] = useState(false);
  const [onlyChefSpecial, setOnlyChefSpecial] = useState(false);

  // Modals state
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Handle table URL parameters
  useEffect(() => {
    const tableParam = searchParams.get("table");
    const tokenParam = searchParams.get("token");

    if (tableParam) {
      const validToken = tokenParam || generateTableToken(tableParam);
      setTableSession(tableParam, validToken);
    } else if (!tableNumber) {
      setTableSession("04", generateTableToken("04"));
    }
  }, [searchParams, tableNumber, setTableSession]);

  // Fetch initial restaurant, categories, and products
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [restRes, catRes, prodRes] = await Promise.all([
          fetch("/api/restaurant"),
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);

        if (!mounted) return;

        const restData = await restRes.json();
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (restData.success) setRestaurant(restData.data);
        if (catData.success) setCategories(catData.data);
        if (prodData.success) setProducts(prodData.data);
      } catch (err) {
        console.error("Failed to load restaurant data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen for real-time product updates
  useEffect(() => {
    const unsubProduct = realtime.subscribe(
      "PRODUCT_AVAILABILITY_CHANGED",
      (updatedProduct: Product) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        );
      }
    );

    const unsubMenu = realtime.subscribe("MENU_UPDATED", () => {
      fetch("/api/products")
        .then((r) => r.json())
        .then((d) => d.success && setProducts(d.data));
    });

    return () => {
      unsubProduct();
      unsubMenu();
    };
  }, []);

  // Memoized filtered products to avoid recalculation on every render
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCat = p.categoryName?.toLowerCase().includes(q);
        const matchIngredients = p.ingredients?.some((ing) =>
          ing.toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchCat && !matchIngredients) {
          return false;
        }
      }
      // Veg/Non-Veg filter
      if (vegFilter === "veg" && !p.isVeg) return false;
      if (vegFilter === "non-veg" && p.isVeg) return false;
      // Bestseller filter
      if (onlyBestsellers && !p.isBestseller) return false;
      // Chef's special filter
      if (onlyChefSpecial && !p.isChefSpecial) return false;

      return true;
    });
  }, [products, selectedCategory, searchQuery, vegFilter, onlyBestsellers, onlyChefSpecial]);

  // Memoized handlers
  const handleOpenDetail = useCallback((product: Product) => {
    setActiveProduct(product);
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveProduct(null);
  }, []);

  const handleOpenCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const handleCloseCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const handleProceedToCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);

  const handleCloseCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground selection:bg-amber-500/20 selection:text-amber-600">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCart={handleOpenCart}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* Banner Section */}
        {restaurant && (
          <Banner restaurant={restaurant} tableNumber={tableNumber || "04"} />
        )}

        {/* Categories Bar & Filters */}
        <CategoryBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          vegFilter={vegFilter}
          onVegFilterChange={setVegFilter}
          onlyBestsellers={onlyBestsellers}
          onToggleBestsellers={() => setOnlyBestsellers(!onlyBestsellers)}
          onlyChefSpecial={onlyChefSpecial}
          onToggleChefSpecial={() => setOnlyChefSpecial(!onlyChefSpecial)}
        />

        {/* Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {selectedCategory === "all"
                ? searchQuery
                  ? `Search results for "${searchQuery}"`
                  : "All Dishes"
                : categories.find((c) => c.id === selectedCategory)?.name || "Menu"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {filteredProducts.length} delicious creations crafted fresh
            </p>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 p-12 text-center bg-white">
            <Utensils className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-700">
              No matching dishes found
            </h3>
            <p className="mt-1 text-sm text-gray-400 max-w-sm">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setVegFilter("all");
                setOnlyBestsellers(false);
                setOnlyChefSpecial(false);
              }}
              className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <DynamicProductModal
        product={activeProduct}
        onClose={handleCloseModal}
      />

      {/* Cart Drawer */}
      <DynamicCartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Checkout Modal */}
      <DynamicCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCloseCheckout}
      />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center gap-3">
            <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold">Loading The Urban Plate Menu...</p>
          </div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}

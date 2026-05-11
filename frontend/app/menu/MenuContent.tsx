"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DishCard from "@/components/menu/DishCard";
import api from "@/lib/api";
import { Category, Dish } from "@/lib/types";
import { Search, ShoppingCart, ArrowRight, UtensilsCrossed, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import PageHero from "@/components/layout/PageHero";

type DietaryFilter = "all" | "veg" | "nonveg" | "jain" | "vegan" | "gluten_free";

const CATEGORY_META: Record<string, { img: string; emoji: string }> = {
  "Starters":       { img: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=200&q=75", emoji: "🥗" },
  "Main Course":    { img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=75", emoji: "🍛" },
  "Breads":         { img: "https://images.unsplash.com/photo-1548865771-0a90db7e7dab?w=200&q=75",  emoji: "🫓" },
  "Rice & Biryani": { img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=75", emoji: "🍚" },
  "Desserts":       { img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=75", emoji: "🍮" },
  "Beverages":      { img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=75", emoji: "🥤" },
};

const DIETARY_OPTIONS: { key: DietaryFilter; label: string; color: string }[] = [
  { key: "all",         label: "All",          color: "" },
  { key: "veg",         label: "🌿 Veg",       color: "green" },
  { key: "nonveg",      label: "🍗 Non-Veg",   color: "red" },
  { key: "jain",        label: "🕉️ Jain",      color: "purple" },
  { key: "vegan",       label: "🌱 Vegan",     color: "emerald" },
  { key: "gluten_free", label: "🌾 Gluten-Free", color: "amber" },
];

export default function MenuContent() {
  const [dishes, setDishes]           = useState<Dish[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dietary, setDietary]         = useState<DietaryFilter>("all");
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const { items, guestCount, totalDishCost } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  // Batch initial load — categories + dishes in parallel
  useEffect(() => {
    Promise.all([
      api.get("/menu/categories"),
      api.get("/menu/dishes"),
    ]).then(([catRes, dishRes]) => {
      setCategories(catRes.data);
      setDishes(dishRes.data);
      setLoading(false);
    });
  }, []);

  // Re-fetch dishes only when filter changes (not on mount)
  useEffect(() => {
    if (selectedCategory === null && dietary === "all") return; // handled by initial batch
    setLoading(true);
    const p: Record<string, string> = {};
    if (selectedCategory)           p.category_id   = String(selectedCategory);
    if (dietary === "veg")          p.is_veg         = "true";
    if (dietary === "nonveg")       p.is_veg         = "false";
    if (dietary === "jain")         p.is_jain        = "true";
    if (dietary === "vegan")        p.is_vegan       = "true";
    if (dietary === "gluten_free")  p.is_gluten_free = "true";
    api.get("/menu/dishes", { params: p }).then((r) => { setDishes(r.data); setLoading(false); });
  }, [selectedCategory, dietary]);

  const filtered = dishes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHero
        title="Our Menu"
        subtitle={`Handpicked dishes for ${guestCount} guests — mix, match & customise`}
        icon={<UtensilsCrossed className="w-5 h-5" />}
      />

      <main className="container-app py-8">

        {/* Search + filter header */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {filtered.length} dish{filtered.length !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Dietary pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {DIETARY_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDietary(key)}
              className={`px-3.5 py-1.5 rounded-2xl text-sm font-semibold border transition-all shadow-sm ${
                dietary === key
                  ? "bg-brand-500 text-white border-brand-500 shadow-brand-500/20"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category scroll */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-1 px-1">
          {/* All */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200 ${
              !selectedCategory ? "opacity-100" : "opacity-60 hover:opacity-90"
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${
              !selectedCategory
                ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/20 scale-105"
                : "border-gray-200 bg-gray-50"
            }`}>
              🍽️
            </div>
            <span className={`text-[11px] font-semibold ${!selectedCategory ? "text-brand-600" : "text-gray-500"}`}>All</span>
          </button>

          {categories.map((c) => {
            const meta = CATEGORY_META[c.name];
            const isActive = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all duration-200 ${
                  isActive ? "opacity-100" : "opacity-60 hover:opacity-90"
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all relative ${
                  isActive
                    ? "border-brand-500 shadow-md shadow-brand-500/20 scale-105"
                    : "border-gray-200"
                }`}>
                  {meta?.img ? (
                    <Image
                      src={meta.img}
                      alt={c.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100">
                      {meta?.emoji ?? "🍴"}
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-brand-500/20" />
                  )}
                </div>
                <span className={`text-[11px] font-semibold leading-tight text-center max-w-[64px] ${
                  isActive ? "text-brand-600" : "text-gray-500"
                }`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dish grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🍽️</div>
            <p className="text-gray-500 font-medium">No dishes found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-28">
            {filtered.map((d) => <DishCard key={d.id} dish={d} />)}
          </div>
        )}

        {/* Sticky cart bar */}
        {cartCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <Link
                href="/cart"
                className="flex items-center justify-between bg-brand-500 hover:bg-brand-600 text-white px-5 py-3.5 rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/30 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-xl p-1.5">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm">{cartCount} dish{cartCount !== 1 ? "es" : ""} selected</span>
                    <span className="text-orange-200 text-xs ml-2">for {guestCount} guests</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black">{formatCurrency(totalDishCost())}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

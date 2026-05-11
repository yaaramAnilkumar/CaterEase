"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DishCard from "@/components/menu/DishCard";
import api from "@/lib/api";
import { Category, Dish } from "@/lib/types";
import { Search, ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";

type DietaryFilter = "all" | "veg" | "nonveg" | "jain" | "vegan" | "gluten_free";

const DIETARY_OPTIONS: { key: DietaryFilter; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "veg",         label: "🌿 Veg" },
  { key: "nonveg",      label: "🍗 Non-Veg" },
  { key: "jain",        label: "🕉️ Jain" },
  { key: "vegan",       label: "🌱 Vegan" },
  { key: "gluten_free", label: "🌾 Gluten-Free" },
];

export default function MenuContent() {
  const params = useSearchParams();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [dietary, setDietary] = useState<DietaryFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { items, guestCount, totalDishCost } = useCartStore();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    api.get("/menu/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (selectedCategory) p.category_id = String(selectedCategory);
    if (dietary === "veg")         p.is_veg = "true";
    if (dietary === "nonveg")      p.is_veg = "false";
    if (dietary === "jain")        p.is_jain = "true";
    if (dietary === "vegan")       p.is_vegan = "true";
    if (dietary === "gluten_free") p.is_gluten_free = "true";
    api.get("/menu/dishes", { params: p }).then((r) => { setDishes(r.data); setLoading(false); });
  }, [selectedCategory, dietary]);

  const filtered = dishes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="container-app py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Our Menu</h1>
          <p className="text-gray-500 text-sm mt-1">Choose dishes for {guestCount} guests</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search dishes..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
      </div>

      {/* Dietary filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {DIETARY_OPTIONS.map(({ key, label }) => (
          <button key={key} onClick={() => setDietary(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${dietary === key
              ? "bg-brand-500 text-white border-brand-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setSelectedCategory(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border ${!selectedCategory ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${selectedCategory === c.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No dishes found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-28">
          {filtered.map((d) => <DishCard key={d.id} dish={d} />)}
        </div>
      )}

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <Link href="/cart"
              className="flex items-center justify-between bg-brand-500 hover:bg-brand-600 text-white px-5 py-3.5 rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/30 active:scale-95">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-1.5">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span>{cartCount} {cartCount === 1 ? "dish" : "dishes"} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{formatCurrency(totalDishCost())}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

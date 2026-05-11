"use client";
import { Dish } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Star } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";

function StarRating({ avg, count }: { avg: number | null; count: number }) {
  if (!avg || count === 0) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-gray-700">{avg.toFixed(1)}</span>
      <span>({count})</span>
    </span>
  );
}

export default function DishCard({ dish }: { dish: Dish }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.dish.id === dish.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {dish.image_url ? (
          <Image src={dish.image_url} alt={dish.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍛</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${dish.is_veg ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {dish.is_veg ? "VEG" : "NON-VEG"}
        </span>
        {dish.is_popular && (
          <span className="absolute top-2 right-2 text-xs font-bold bg-brand-500 text-white px-2 py-0.5 rounded-full">Popular</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900">{dish.name}</h3>
          <StarRating avg={dish.avg_rating} count={dish.review_count} />
        </div>
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{dish.description}</p>
        {/* Dietary badges */}
        <div className="flex gap-1 flex-wrap mb-3">
          {dish.is_jain        && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-medium">Jain</span>}
          {dish.is_vegan       && <span className="text-xs bg-green-50  text-green-600  px-1.5 py-0.5 rounded-md font-medium">Vegan</span>}
          {dish.is_gluten_free && <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-md font-medium">Gluten-Free</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-brand-600">{formatCurrency(dish.price_per_head)}<span className="text-xs text-gray-400 font-normal">/head</span></span>
          {qty === 0 ? (
            <button onClick={() => addItem(dish)} className="bg-brand-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(dish.id, qty - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-sm w-4 text-center">{qty}</span>
              <button onClick={() => addItem(dish)} className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

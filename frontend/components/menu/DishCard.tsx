"use client";
import { Dish } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, Star } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";

function StarRating({ avg, count }: { avg: number | null; count: number }) {
  if (!avg || count === 0) return null;
  return (
    <span className="flex items-center gap-1 text-xs">
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold text-gray-700">{avg.toFixed(1)}</span>
      <span className="text-gray-400">({count})</span>
    </span>
  );
}

export default function DishCard({ dish }: { dish: Dish }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.dish.id === dish.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col">

      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🍛</div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Veg/Non-Veg badge */}
        <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
          dish.is_veg ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {dish.is_veg ? "VEG" : "NON-VEG"}
        </span>

        {dish.is_popular && (
          <span className="absolute top-3 right-3 text-[11px] font-bold bg-brand-500 text-white px-2.5 py-1 rounded-full shadow-sm">
            🔥 Popular
          </span>
        )}

        {/* Dietary mini-badges on image bottom */}
        <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
          {dish.is_jain        && <span className="text-[10px] bg-white/90 text-purple-700 px-1.5 py-0.5 rounded-md font-semibold">Jain</span>}
          {dish.is_vegan       && <span className="text-[10px] bg-white/90 text-green-700  px-1.5 py-0.5 rounded-md font-semibold">Vegan</span>}
          {dish.is_gluten_free && <span className="text-[10px] bg-white/90 text-yellow-700 px-1.5 py-0.5 rounded-md font-semibold">GF</span>}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{dish.name}</h3>
          <StarRating avg={dish.avg_rating} count={dish.review_count} />
        </div>
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed flex-1 mb-4">{dish.description}</p>

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            <span className="font-black text-brand-600 text-lg">{formatCurrency(dish.price_per_head)}</span>
            <span className="text-xs text-gray-400 font-normal ml-0.5">/head</span>
          </div>

          {qty === 0 ? (
            <button
              onClick={() => addItem(dish)}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/30 active:scale-95">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
              <button
                onClick={() => updateQuantity(dish.id, qty - 1)}
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm">
                <Minus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <span className="font-black text-sm w-5 text-center text-gray-900">{qty}</span>
              <button
                onClick={() => addItem(dish)}
                className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 shadow-sm">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

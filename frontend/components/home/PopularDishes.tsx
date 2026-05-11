"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Dish } from "@/lib/types";
import DishCard from "@/components/menu/DishCard";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

export default function PopularDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);

  useEffect(() => {
    api.get("/menu/dishes?is_popular=true").then((r) => setDishes(r.data.slice(0, 6)));
  }, []);

  if (!dishes.length) return null;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-app">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> Customer Favourites
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Popular{" "}
              <span className="bg-gradient-to-r from-brand-500 to-orange-500 bg-clip-text text-transparent">Dishes</span>
            </h2>
            <p className="text-gray-500 mt-2">Dishes our customers order again and again</p>
          </div>
          <Link href="/menu"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-brand-600 hover:border-brand-200 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:shadow-md self-start sm:self-auto">
            View Full Menu <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dishes.map((d) => <DishCard key={d.id} dish={d} />)}
        </div>
      </div>
    </section>
  );
}

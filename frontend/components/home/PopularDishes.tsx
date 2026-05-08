"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Dish } from "@/lib/types";
import DishCard from "@/components/menu/DishCard";
import Link from "next/link";

export default function PopularDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);

  useEffect(() => {
    api.get("/menu/dishes?is_popular=true").then((r) => setDishes(r.data.slice(0, 6)));
  }, []);

  if (!dishes.length) return null;

  return (
    <section className="bg-gray-50 py-16">
      <div className="container-app">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Popular Dishes</h2>
            <p className="text-gray-500">What our customers love most</p>
          </div>
          <Link href="/menu" className="text-brand-600 text-sm font-medium hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {dishes.map((d) => <DishCard key={d.id} dish={d} />)}
        </div>
      </div>
    </section>
  );
}

"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/layout/PageHero";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { items, guestCount, setGuestCount, updateQuantity, removeItem, totalDishCost, grandTotal } = useCartStore();
  const subtotal = totalDishCost();
  const discount = guestCount >= 50 ? subtotal * 0.05 : 0;
  const total = grandTotal();

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <ShoppingCart className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-7 text-sm">Browse our menu and add dishes to get started.</p>
          <Link href="/menu" className="bg-brand-500 text-white px-7 py-3 rounded-2xl font-semibold hover:bg-brand-600 transition-all hover:shadow-lg hover:shadow-brand-500/30">
            Browse Menu
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <PageHero
        title="Your Cart"
        subtitle={`${items.length} dish${items.length !== 1 ? "es" : ""} selected for ${guestCount} guests`}
        icon={<ShoppingCart className="w-5 h-5" />}
      />

      <main className="container-app py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left col */}
          <div className="lg:col-span-2 space-y-4">

            {/* Guest count */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-gray-900">Number of Guests</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGuestCount(Math.max(10, guestCount - 5))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-300 hover:bg-brand-50 transition-all">
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <div className="text-center">
                  <span className="text-4xl font-black text-gray-900 tabular-nums">{guestCount}</span>
                  <p className="text-xs text-gray-400 mt-0.5">guests</p>
                </div>
                <button
                  onClick={() => setGuestCount(guestCount + 5)}
                  className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-400 ml-2">Adjust in steps of 5</p>
              </div>
              {guestCount >= 50 ? (
                <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <Tag className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-green-700 text-sm font-medium">5% discount applied for 50+ guests!</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-3">
                  Add {50 - guestCount} more guests to unlock a <span className="text-brand-600 font-semibold">5% discount</span>
                </p>
              )}
            </div>

            {/* Dish items */}
            <div className="space-y-3">
              {items.map(({ dish, quantity }) => (
                <div key={dish.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {dish.image_url
                      ? <Image src={dish.image_url} alt={dish.name} fill className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🍛</div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{dish.name}</h3>
                        <span className={`text-[11px] font-semibold ${dish.is_veg ? "text-green-600" : "text-red-500"}`}>
                          {dish.is_veg ? "● Veg" : "● Non-Veg"}
                        </span>
                      </div>
                      <button onClick={() => removeItem(dish.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty controls */}
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1">
                        <button onClick={() => updateQuantity(dish.id, quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm transition-colors">
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="font-black text-sm w-5 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(dish.id, quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 shadow-sm transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="font-black text-brand-600">{formatCurrency(dish.price_per_head * quantity * guestCount)}</div>
                        <div className="text-[10px] text-gray-400">{formatCurrency(dish.price_per_head)}/head × {quantity} × {guestCount}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping */}
            <Link href="/menu"
              className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 hover:border-brand-300 rounded-3xl py-4 text-sm text-gray-400 hover:text-brand-600 transition-all">
              <Plus className="w-4 h-4" /> Add more dishes
            </Link>
          </div>

          {/* Right col — Order Summary */}
          <div className="h-fit sticky top-20">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-gray-950 to-gray-900 px-6 py-5">
                <h2 className="font-black text-white text-lg">Order Summary</h2>
                <p className="text-gray-400 text-xs mt-0.5">{items.length} dish{items.length !== 1 ? "es" : ""} · {guestCount} guests</p>
              </div>

              <div className="p-6 space-y-3">
                {/* Line items */}
                {items.map(({ dish, quantity }) => (
                  <div key={dish.id} className="flex justify-between text-sm text-gray-600">
                    <span className="truncate max-w-[60%]">{dish.name} × {quantity}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(dish.price_per_head * quantity * guestCount)}</span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Discount (5% bulk)</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900 text-base">
                    <span>Total</span>
                    <span className="text-brand-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Link href="/checkout"
                  className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold transition-all hover:shadow-xl hover:shadow-brand-500/30 active:scale-95 mt-2">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-center text-xs text-gray-400 mt-2">
                  Secure checkout · No hidden charges
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

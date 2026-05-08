"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
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
        <div className="container-app py-24 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Browse our menu and add dishes to get started.</p>
          <Link href="/menu" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors">Browse Menu</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Number of Guests</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setGuestCount(Math.max(10, guestCount - 5))} className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
                <span className="text-2xl font-bold w-12 text-center">{guestCount}</span>
                <button onClick={() => setGuestCount(guestCount + 5)} className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                <span className="text-sm text-gray-500 ml-2">guests</span>
              </div>
              {guestCount >= 50 && <p className="text-green-600 text-sm mt-2 font-medium">🎉 5% discount applied for 50+ guests!</p>}
            </div>

            {items.map(({ dish, quantity }) => (
              <div key={dish.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 items-start">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {dish.image_url ? <Image src={dish.image_url} alt={dish.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍛</div>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                      <span className={`text-xs ${dish.is_veg ? "text-green-600" : "text-red-500"}`}>{dish.is_veg ? "Veg" : "Non-Veg"}</span>
                    </div>
                    <button onClick={() => removeItem(dish.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(dish.id, quantity - 1)} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-sm">{quantity}</span>
                      <button onClick={() => updateQuantity(dish.id, quantity + 1)} className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="font-bold text-brand-600">{formatCurrency(dish.price_per_head * quantity * guestCount)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatCurrency(dish.price_per_head)}/head × {quantity} × {guestCount} guests</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-20">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount (5%)</span><span>-{formatCurrency(discount)}</span></div>}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            <Link href="/checkout" className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold text-center block hover:bg-brand-600 transition-colors">
              Proceed to Checkout
            </Link>
            <Link href="/menu" className="w-full text-center text-sm text-brand-600 block mt-3 hover:underline">+ Add more dishes</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

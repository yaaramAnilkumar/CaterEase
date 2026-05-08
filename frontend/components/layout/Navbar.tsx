"use client";
import Link from "next/link";
import { ShoppingCart, User, Menu, X, ChefHat } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin } = useAuthStore();
  const { items } = useCartStore();
  const router = useRouter();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-app flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-600">
          <ChefHat className="w-7 h-7" />
          CaterEase
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/menu" className="hover:text-brand-600 transition-colors">Menu</Link>
          <Link href="/#services" className="hover:text-brand-600 transition-colors">Services</Link>
          <Link href="/get-quote" className="hover:text-brand-600 transition-colors">Get a Quote</Link>
          {isAdmin() && <Link href="/admin/dashboard" className="hover:text-brand-600 transition-colors">Admin</Link>}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative p-2 rounded-full hover:bg-brand-50 transition-colors">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600">
                <User className="w-4 h-4" /> {user.name.split(" ")[0]}
              </Link>
              <Link href="/orders" className="text-sm text-gray-500 hover:text-brand-600">Orders</Link>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500">Logout</button>
            </div>
          ) : (
            <Link href="/login" className="hidden md:block bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
              Login
            </Link>
          )}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-700">
          <Link href="/menu" onClick={() => setMobileOpen(false)}>Menu</Link>
          <Link href="/#services" onClick={() => setMobileOpen(false)}>Services</Link>
          <Link href="/get-quote" onClick={() => setMobileOpen(false)}>Get a Quote</Link>
          {isAdmin() && <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}>Admin</Link>}
          {user ? (
            <>
              <Link href="/profile" onClick={() => setMobileOpen(false)}>My Profile</Link>
              <Link href="/orders" onClick={() => setMobileOpen(false)}>My Orders</Link>
              <button onClick={handleLogout} className="text-left text-red-500">Logout</button>
            </>
          ) : (
            <Link href="/login" className="bg-brand-500 text-white px-4 py-2 rounded-lg text-center" onClick={() => setMobileOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}

import { ChefHat, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 mt-16">
      <div className="container-app grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <ChefHat className="w-6 h-6 text-brand-400" />
            CaterEase
          </div>
          <p className="text-sm leading-relaxed">Premium catering for every occasion in Bangalore and Tirupati.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Services</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/menu?service=meal-box" className="hover:text-brand-400">Meal Box</Link></li>
            <li><Link href="/menu?service=delivery-box" className="hover:text-brand-400">Delivery Box</Link></li>
            <li><Link href="/menu?service=catering" className="hover:text-brand-400">Full Catering</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/menu" className="hover:text-brand-400">Browse Menu</Link></li>
            <li><Link href="/orders" className="hover:text-brand-400">Track Order</Link></li>
            <li><Link href="/login" className="hover:text-brand-400">Login / Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-400" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-400" /> hello@caterease.in</li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-400 mt-0.5" /> Bangalore & Tirupati</li>
          </ul>
        </div>
      </div>
      <div className="container-app border-t border-gray-700 pt-4 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} CaterEase. All rights reserved.
      </div>
    </footer>
  );
}

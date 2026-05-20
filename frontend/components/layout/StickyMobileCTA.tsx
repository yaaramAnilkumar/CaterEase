"use client";
import Link from "next/link";
import { FileText, UtensilsCrossed } from "lucide-react";

export default function StickyMobileCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl px-4 py-3 flex gap-3">
      <Link
        href="/menu"
        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all"
      >
        <UtensilsCrossed className="w-4 h-4" /> Browse Menu
      </Link>
      <Link
        href="/get-quote"
        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-gold-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all"
      >
        <FileText className="w-4 h-4" /> Get a Quote
      </Link>
    </div>
  );
}

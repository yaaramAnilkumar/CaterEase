import Link from "next/link";
import { ChefHat } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-6">
          <ChefHat className="w-9 h-9 text-brand-400" />
        </div>
        <div className="text-8xl font-black text-white/10 mb-2 leading-none">404</div>
        <h1 className="text-2xl font-black text-white mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
          Looks like this page took the day off. Let's get you back to something delicious.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-2xl font-semibold transition-colors shadow-lg shadow-brand-500/30">
            Go Home
          </Link>
          <Link href="/menu" className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-6 py-3 rounded-2xl font-semibold transition-colors">
            View Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

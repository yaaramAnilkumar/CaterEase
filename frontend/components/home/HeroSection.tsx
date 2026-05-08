import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 overflow-hidden">
      <div className="container-app py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full mb-4">
            <MapPin className="w-3.5 h-3.5" /> Serving Bangalore & Tirupati
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4">
            Catering that <span className="text-brand-500">Crafts</span> Memories
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl">
            Customize your menu, pick your service type, and let us handle the food for your next event — from 10 to 500+ guests.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link href="/menu" className="bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-brand-600 transition-colors">
              Explore Menu <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/customize" className="bg-white text-brand-600 border border-brand-200 px-6 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors">
              Build Your Package
            </Link>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 max-w-sm">
          {[
            { label: "10+ Guests", icon: "👥", desc: "Minimum order" },
            { label: "3 Service Types", icon: "🍱", desc: "Meal Box to Full Catering" },
            { label: "50+ Dishes", icon: "🍛", desc: "Veg & Non-veg" },
            { label: "5% Off", icon: "🎉", desc: "For 50+ guest orders" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100">
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{card.label}</div>
              <div className="text-xs text-gray-500">{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const services = [
  {
    name: "Meal Box",
    icon: "🍱",
    desc: "Compact compartmentalized servings in 3, 5, or 8 compartments. Perfect for corporate lunches and intimate gatherings.",
    guests: "10+ guests",
    href: "/menu?service=Meal+Box",
    color: "bg-orange-50 border-orange-200",
  },
  {
    name: "Delivery Box",
    icon: "📦",
    desc: "Affordable bulk delivery in sealed boxes. Great for parties up to 120 guests.",
    guests: "10–120 guests",
    href: "/menu?service=Delivery+Box",
    color: "bg-amber-50 border-amber-200",
  },
  {
    name: "Full Catering",
    icon: "🍽️",
    desc: "Premium service with chafing dishes, live counters, and dedicated staff for your biggest events.",
    guests: "50+ guests",
    href: "/menu?service=Catering",
    color: "bg-yellow-50 border-yellow-200",
  },
];

export default function ServiceTypes() {
  return (
    <section id="services" className="container-app py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Service</h2>
        <p className="text-gray-500">Three ways to cater — pick what fits your event</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.name} className={`rounded-2xl border p-6 ${s.color} flex flex-col`}>
            <div className="text-4xl mb-3">{s.icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{s.name}</h3>
            <p className="text-sm text-gray-600 flex-1 mb-4">{s.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full text-gray-600">{s.guests}</span>
              <Link href={s.href} className="flex items-center gap-1 text-brand-600 text-sm font-medium hover:underline">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

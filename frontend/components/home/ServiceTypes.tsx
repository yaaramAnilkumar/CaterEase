import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const services = [
  {
    name: "Meal Box",
    icon: "🍱",
    tag: "Great for Corporate",
    desc: "Compact compartmentalized servings in 3, 5, or 8 compartments. Hygienic, portion-controlled, and easy to distribute.",
    guests: "10+ guests",
    perks: ["3/5/8 compartments", "Sealed & hygienic packaging", "Portion-controlled servings"],
    href: "/menu?service=Meal+Box",
    gradient: "from-orange-500 to-amber-500",
    border: "border-orange-100",
    ring: "",
  },
  {
    name: "Delivery Box",
    icon: "📦",
    tag: "Most Popular",
    desc: "Bulk delivery in sealed boxes at the best value. Perfect for parties, family gatherings, and budget-conscious events.",
    guests: "10–120 guests",
    perks: ["Bulk sealed packaging", "Best price per head", "Same-day delivery available"],
    href: "/menu?service=Delivery+Box",
    gradient: "from-brand-500 to-orange-500",
    border: "border-brand-200",
    ring: "ring-2 ring-brand-200 shadow-lg",
    featured: true,
  },
  {
    name: "Full Catering",
    icon: "🍽️",
    tag: "Premium Experience",
    desc: "End-to-end catering with chafing dishes, live counters, and dedicated staff — for your most special occasions.",
    guests: "50+ guests",
    perks: ["Live counters & chafing dishes", "Dedicated service staff", "Full setup & teardown"],
    href: "/menu?service=Catering",
    gradient: "from-rose-500 to-pink-500",
    border: "border-rose-100",
    ring: "",
  },
];

export default function ServiceTypes() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container-app">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-500 bg-clip-text text-transparent">Service Style</span>
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">Three flexible catering formats — pick the one that fits your event size and style.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.name}
              className={`relative rounded-3xl border-2 ${s.border} ${s.ring ?? ""} bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group shadow-sm`}>

              {/* Gradient top band */}
              <div className={`bg-gradient-to-br ${s.gradient} p-6 pb-10`}>
                <span className="inline-block bg-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                  {s.tag}
                </span>
                <div className="text-5xl mb-3 drop-shadow-sm">{s.icon}</div>
                <h3 className="text-2xl font-black text-white">{s.name}</h3>
              </div>

              {/* Guest pill overlapping */}
              <div className="px-6 -mt-5">
                <span className="inline-block bg-white shadow-md text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-100">
                  👥 {s.guests}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">{s.desc}</p>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {s.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>

                <Link href={s.href}
                  className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all bg-gradient-to-r ${s.gradient} text-white hover:opacity-90 hover:shadow-lg`}>
                  Explore Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

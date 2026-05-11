"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Calculator, Users, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";

const SERVICES = [
  { key: "delivery",  label: "Delivery Box", emoji: "📦", multiplier: 1.0,  desc: "Sealed bulk boxes" },
  { key: "mealbox",   label: "Meal Box",     emoji: "🍱", multiplier: 1.15, desc: "Individual portions" },
  { key: "catering",  label: "Full Catering", emoji: "🍽️", multiplier: 1.4,  desc: "Live counters + staff" },
] as const;

const COURSES = [
  { key: "starter",   label: "Starters",     emoji: "🥗", min: 25, max: 55  },
  { key: "main",      label: "Main Course",   emoji: "🍛", min: 40, max: 80  },
  { key: "bread",     label: "Breads",        emoji: "🫓", min: 15, max: 25  },
  { key: "rice",      label: "Rice / Biryani",emoji: "🍚", min: 35, max: 65  },
  { key: "dessert",   label: "Desserts",      emoji: "🍮", min: 25, max: 45  },
  { key: "beverage",  label: "Beverages",     emoji: "🥤", min: 25, max: 30  },
] as const;

type ServiceKey = typeof SERVICES[number]["key"];
type CourseKey  = typeof COURSES[number]["key"];

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CostEstimator() {
  const [guests, setGuests]   = useState(50);
  const [service, setService] = useState<ServiceKey>("delivery");
  const [selected, setSelected] = useState<Set<CourseKey>>(new Set(["main", "bread"] as CourseKey[]));

  const toggle = (k: CourseKey) =>
    setSelected((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const { minTotal, maxTotal, perHeadMin, perHeadMax } = useMemo(() => {
    const svc = SERVICES.find((s) => s.key === service)!;
    const courses = COURSES.filter((c) => selected.has(c.key));
    if (courses.length === 0) return { minTotal: 0, maxTotal: 0, perHeadMin: 0, perHeadMax: 0 };
    const rawMin = courses.reduce((s, c) => s + c.min, 0);
    const rawMax = courses.reduce((s, c) => s + c.max, 0);
    const perHeadMin = Math.round(rawMin * svc.multiplier);
    const perHeadMax = Math.round(rawMax * svc.multiplier);
    const discount   = guests >= 50 ? 0.95 : 1;
    return {
      perHeadMin,
      perHeadMax,
      minTotal: Math.round(perHeadMin * guests * discount),
      maxTotal: Math.round(perHeadMax * guests * discount),
    };
  }, [guests, service, selected]);

  const hasSelection = selected.size > 0;

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-app">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            <Calculator className="w-3.5 h-3.5 text-brand-500" /> Cost Estimator
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            How Much Will It{" "}
            <span className="bg-gradient-to-r from-brand-500 to-orange-500 bg-clip-text text-transparent">Cost?</span>
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
            Get an instant estimate — no sign-up needed. Adjust guests, service type, and courses.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Controls */}
          <div className="lg:col-span-3 space-y-5">

            {/* Guest count */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-gray-900">Number of Guests</span>
                {guests >= 50 && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">5% bulk discount!</span>}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setGuests(Math.max(10, guests - 10))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-300 transition-colors">
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex-1">
                  <input type="range" min={10} max={500} step={10} value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full accent-brand-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10</span><span className="font-bold text-brand-600 text-sm">{guests} guests</span><span>500</span>
                  </div>
                </div>
                <button onClick={() => setGuests(Math.min(500, guests + 10))}
                  className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-brand-300 transition-colors">
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Service type */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <span className="font-bold text-gray-900 block mb-4">Service Type</span>
              <div className="grid grid-cols-3 gap-3">
                {SERVICES.map((s) => (
                  <button key={s.key} onClick={() => setService(s.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center ${
                      service === s.key
                        ? "border-brand-500 bg-brand-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <span className="text-2xl">{s.emoji}</span>
                    <span className={`text-xs font-bold ${service === s.key ? "text-brand-700" : "text-gray-700"}`}>{s.label}</span>
                    <span className="text-[10px] text-gray-400">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Courses */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <span className="font-bold text-gray-900 block mb-4">Menu Courses <span className="text-gray-400 font-normal text-sm">(pick what you'd serve)</span></span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COURSES.map((c) => {
                  const on = selected.has(c.key);
                  return (
                    <button key={c.key} onClick={() => toggle(c.key)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all text-left ${
                        on ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                      <span className="text-xl">{c.emoji}</span>
                      <div>
                        <div className={`text-xs font-bold ${on ? "text-brand-700" : "text-gray-700"}`}>{c.label}</div>
                        <div className="text-[10px] text-gray-400">₹{c.min}–{c.max}/head</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 rounded-3xl p-7 text-white sticky top-24">
              <div className="absolute inset-0 opacity-[0.04] rounded-3xl"
                style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

              <div className="relative z-10">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-5">Estimated Cost</p>

                {hasSelection ? (
                  <>
                    <div className="mb-6">
                      <div className="text-4xl md:text-5xl font-black text-white leading-none">
                        {formatINR(minTotal)}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">to {formatINR(maxTotal)}</div>
                    </div>

                    <div className="space-y-2.5 text-sm mb-6">
                      <div className="flex justify-between text-gray-400">
                        <span>Guests</span><span className="text-white font-semibold">{guests}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Service</span>
                        <span className="text-white font-semibold">{SERVICES.find(s=>s.key===service)?.label}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Per head</span>
                        <span className="text-white font-semibold">₹{perHeadMin}–₹{perHeadMax}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Courses</span>
                        <span className="text-white font-semibold">{selected.size} selected</span>
                      </div>
                      {guests >= 50 && (
                        <div className="flex justify-between text-green-400 text-xs pt-1 border-t border-white/10">
                          <span>Bulk discount (5%)</span><span>applied ✓</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-500 text-xs mb-5">
                      * Estimate based on typical menu prices. Final quote depends on exact dish selection.
                    </p>
                  </>
                ) : (
                  <div className="mb-6 py-8 text-center text-gray-500 text-sm">
                    Select at least one course to see your estimate
                  </div>
                )}

                <Link href="/get-quote"
                  className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-brand-500/30 active:scale-95">
                  Get Exact Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/menu"
                  className="flex items-center justify-center gap-2 w-full mt-2 text-gray-400 hover:text-white text-sm py-2 transition-colors">
                  Or browse the menu →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

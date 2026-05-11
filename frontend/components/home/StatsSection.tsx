"use client";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 80;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (current >= steps) { setCount(target); clearInterval(timer); }
    }, interval);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

const STATS = [
  {
    target: 500,
    suffix: "+",
    label: "Events Catered",
    sublabel: "Weddings, corporates & more",
    emoji: "🎉",
    gradient: "from-orange-500 to-rose-500",
    glow: "shadow-orange-500/30",
  },
  {
    target: 50,
    suffix: "+",
    label: "Menu Items",
    sublabel: "Veg, Non-veg, Jain & Vegan",
    emoji: "🍽️",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/30",
  },
  {
    target: 300,
    suffix: "+",
    label: "Happy Families",
    sublabel: "Who keep coming back",
    emoji: "👨‍👩‍👧‍👦",
    gradient: "from-yellow-400 to-amber-500",
    glow: "shadow-yellow-500/30",
  },
  {
    target: 4.8,
    suffix: "★",
    label: "Average Rating",
    sublabel: "Based on customer reviews",
    emoji: "⭐",
    gradient: "from-rose-500 to-pink-500",
    glow: "shadow-rose-500/30",
    decimal: true,
  },
];

function StatCard({ stat }: { stat: typeof STATS[0] }) {
  const { count, ref } = useCountUp(stat.decimal ? 48 : stat.target, 2200);
  const display = stat.decimal ? (count / 10).toFixed(1) : count;

  return (
    <div ref={ref}
      className="relative group bg-white/[0.06] hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-6 md:p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:border-white/20 cursor-default overflow-hidden">

      {/* Glow blob */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`} />

      {/* Emoji badge */}
      <div className="text-4xl mb-4 select-none">{stat.emoji}</div>

      {/* Number */}
      <div className={`text-5xl md:text-6xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent leading-none mb-1`}>
        {display}{stat.suffix}
      </div>

      {/* Divider */}
      <div className={`w-10 h-0.5 bg-gradient-to-r ${stat.gradient} mx-auto mt-3 mb-3 rounded-full`} />

      {/* Label */}
      <div className="text-white font-semibold text-base mb-1">{stat.label}</div>
      <div className="text-gray-500 text-xs">{stat.sublabel}</div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-gray-950 py-20 md:py-28">

      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="container-app relative z-10">

        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Our Track Record
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Numbers That
            <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent"> Speak</span>
          </h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm md:text-base">
            Trusted by hundreds of families across Bangalore & Tirupati for every occasion that matters.
          </p>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((s) => <StatCard key={s.label} stat={s} />)}
        </div>

        {/* Bottom trust strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-gray-600 text-xs">
          {["Bangalore", "Tirupati", "Hyderabad"].map((city) => (
            <span key={city} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              Serving {city}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

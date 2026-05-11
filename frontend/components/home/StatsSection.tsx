"use client";
import { useEffect, useRef, useState } from "react";
import { UtensilsCrossed, Users, Star, CalendarCheck } from "lucide-react";

function Counter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (current >= steps) { setCount(target); clearInterval(timer); }
    }, interval);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-black text-white">
      {count}{suffix}
    </div>
  );
}

const STATS = [
  { icon: CalendarCheck, label: "Events Catered",  target: 500, suffix: "+", color: "from-orange-500 to-red-500" },
  { icon: UtensilsCrossed, label: "Menu Items",    target: 50,  suffix: "+", color: "from-amber-500 to-orange-500" },
  { icon: Users,           label: "Happy Families", target: 300, suffix: "+", color: "from-yellow-500 to-amber-500" },
  { icon: Star,            label: "Avg Rating",    target: 48,  suffix: "",  color: "from-orange-400 to-yellow-400", decimal: true },
];

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-16">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #f97316 0, #f97316 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

      <div className="container-app relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Trusted Across Bangalore & Tirupati</h2>
          <p className="text-gray-400">Numbers that speak for themselves</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label}
              className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-4`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-end justify-center gap-0.5">
                {s.decimal ? (
                  <div className="text-4xl md:text-5xl font-black text-white">4.8</div>
                ) : (
                  <Counter target={s.target} suffix={s.suffix} duration={2000} />
                )}
              </div>
              <div className="text-gray-400 text-sm mt-2 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

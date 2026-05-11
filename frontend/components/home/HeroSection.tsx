"use client";
import Link from "next/link";
import { ArrowRight, MapPin, Star, ChefHat, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(target / 50);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(start);
      }, 30);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80",
  "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80",
  "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80",
  "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80",
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 25% 50%, #f97316 0%, transparent 50%), radial-gradient(circle at 75% 20%, #ea580c 0%, transparent 40%)" }} />

      <div className="container-app py-16 md:py-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-brand-500/20 text-brand-400 text-sm font-medium px-3 py-1 rounded-full mb-6 border border-brand-500/30">
              <MapPin className="w-3.5 h-3.5" /> Serving Bangalore & Tirupati
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              Catering that{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-orange-300">
                Crafts Memories
              </span>
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0">
              Customise your menu, pick your service type, and let us handle the food for your next event — from 10 to 500+ guests.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
              <Link href="/menu"
                className="bg-brand-500 text-white px-7 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-600 transition-all hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5">
                Explore Menu <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/get-quote"
                className="bg-white/10 text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold hover:bg-white/20 transition-all backdrop-blur-sm">
                Get a Quote
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-400"><Counter target={500} suffix="+" /></div>
                <div className="text-xs text-gray-500 mt-0.5">Events Catered</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-400"><Counter target={50} suffix="+" /></div>
                <div className="text-xs text-gray-500 mt-0.5">Dishes</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold text-brand-400">
                  <Counter target={4} suffix="." /><span>8</span>
                  <Star className="w-4 h-4 fill-brand-400 text-brand-400" />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Avg Rating</div>
              </div>
            </div>
          </div>

          {/* Right — food image grid */}
          <div className="flex-1 w-full max-w-md lg:max-w-none">
            <div className="grid grid-cols-2 gap-3">
              {FOOD_IMAGES.map((src, i) => (
                <div key={i}
                  className={`relative overflow-hidden rounded-2xl shadow-xl ${i === 0 ? "row-span-1 h-44" : "h-44"}`}
                  style={{ transform: i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)" }}>
                  <img src={src} alt="food" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ))}
            </div>

            {/* Floating badge */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Trusted by</div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1">
                    <Users className="w-3 h-3" /> 500+ families
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center">
                <div className="text-xs text-gray-400">Guest discount</div>
                <div className="text-sm font-semibold text-brand-400">5% off 50+ guests</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

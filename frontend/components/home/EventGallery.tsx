"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GALLERY = [
  { src: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=85", label: "Wedding Feast",    span: "col-span-2 row-span-2" },
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=85", label: "Live Counters",   span: "" },
  { src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=85", label: "Buffet Spread",   span: "" },
  { src: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=85", label: "Plated Service",  span: "" },
  { src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=85", label: "Corporate Event", span: "" },
  { src: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=85", label: "Dessert Station", span: "" },
];

export default function EventGallery() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-gold-600 text-xs font-bold tracking-widest uppercase mb-3 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
            Our Portfolio
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Events We've <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-gold-500">Brought to Life</span>
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            From intimate gatherings to grand celebrations — every event is crafted with care.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[420px] md:h-[500px]">
          {GALLERY.map((item, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl group ${item.span}`}
            >
              <Image
                src={item.src}
                alt={item.label}
                fill
                sizes={i === 0 ? "(max-width: 768px) 66vw, 50vw" : "(max-width: 768px) 33vw, 25vw"}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/get-quote"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-gold-500 text-white px-7 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 transition-all"
          >
            Book Your Event <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

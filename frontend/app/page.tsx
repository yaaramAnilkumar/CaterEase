import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileCTA from "@/components/layout/StickyMobileCTA";
import HeroSection from "@/components/home/HeroSection";
import ServiceTypes from "@/components/home/ServiceTypes";

const HowItWorks    = dynamic(() => import("@/components/home/HowItWorks"),    { ssr: false });
const StatsSection  = dynamic(() => import("@/components/home/StatsSection"),   { ssr: false });
const EventTypes    = dynamic(() => import("@/components/home/EventTypes"),     { ssr: false });
const CostEstimator = dynamic(() => import("@/components/home/CostEstimator"), { ssr: false });
const PopularDishes = dynamic(() => import("@/components/home/PopularDishes"),  { ssr: false });
const EventGallery  = dynamic(() => import("@/components/home/EventGallery"),   { ssr: false });
const Testimonials  = dynamic(() => import("@/components/home/Testimonials"),   { ssr: false });

export const metadata: Metadata = {
  title: "CaterEase — Premium Catering for Bangalore & Tirupati",
  description:
    "Book premium catering for weddings, corporate events, birthdays and more. Customise your menu and get it delivered across Bangalore and Tirupati.",
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "CaterEase",
  description: "Premium catering service for all events in Bangalore and Tirupati.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  telephone: "+91-9999999999",
  servesCuisine: ["Indian", "South Indian", "North Indian", "Jain"],
  areaServed: [
    { "@type": "City", name: "Bangalore" },
    { "@type": "City", name: "Tirupati" },
  ],
  priceRange: "₹₹",
  openingHours: "Mo-Su 08:00-22:00",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Navbar />
      <main className="pb-16 md:pb-0">  {/* padding for sticky mobile CTA */}
        {/* Dark hero */}
        <HeroSection />

        {/* White */}
        <div className="bg-white">
          <ServiceTypes />
        </div>

        {/* Warm beige divider */}
        <div className="bg-amber-50/60 border-y border-amber-100/60">
          <HowItWorks />
        </div>

        {/* Dark stats */}
        <div className="bg-gray-950">
          <StatsSection />
        </div>

        {/* White */}
        <div className="bg-white">
          <EventTypes />
        </div>

        {/* Soft gray */}
        <div className="bg-gray-50">
          <CostEstimator />
        </div>

        {/* White */}
        <div className="bg-white">
          <PopularDishes />
        </div>

        {/* Gallery — white with inner padding */}
        <EventGallery />

        {/* Warm beige */}
        <div className="bg-amber-50/60 border-t border-amber-100/60">
          <Testimonials />
        </div>
      </main>
      <Footer />
      <StickyMobileCTA />
    </>
  );
}

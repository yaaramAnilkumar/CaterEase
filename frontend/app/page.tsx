import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ServiceTypes from "@/components/home/ServiceTypes";

const HowItWorks   = dynamic(() => import("@/components/home/HowItWorks"),   { ssr: false });
const StatsSection = dynamic(() => import("@/components/home/StatsSection"),  { ssr: false });
const EventTypes   = dynamic(() => import("@/components/home/EventTypes"),    { ssr: false });
const CostEstimator= dynamic(() => import("@/components/home/CostEstimator"),{ ssr: false });
const PopularDishes= dynamic(() => import("@/components/home/PopularDishes"), { ssr: false });
const Testimonials = dynamic(() => import("@/components/home/Testimonials"),  { ssr: false });

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
      <main>
        <HeroSection />
        <ServiceTypes />
        <HowItWorks />
        <StatsSection />
        <EventTypes />
        <CostEstimator />
        <PopularDishes />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ServiceTypes from "@/components/home/ServiceTypes";
import HowItWorks from "@/components/home/HowItWorks";
import EventTypes from "@/components/home/EventTypes";
import PopularDishes from "@/components/home/PopularDishes";

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
        <EventTypes />
        <PopularDishes />
      </main>
      <Footer />
    </>
  );
}

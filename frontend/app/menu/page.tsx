import type { Metadata } from "next";
import { Suspense } from "react";
import MenuContent from "./MenuContent";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Browse our full catering menu — starters, mains, desserts and more. Filter by Veg, Jain, Vegan, or Gluten-Free. Order online for delivery across Bangalore and Tirupati.",
  openGraph: {
    title: "CaterEase Menu — Catering Dishes for Every Event",
    description: "Browse and customise your catering menu online.",
  },
};

export default function MenuPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <main className="container-app py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      }>
        <MenuContent />
      </Suspense>
      <Footer />
    </>
  );
}

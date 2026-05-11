import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ChatWidgetLoader from "@/components/ChatWidgetLoader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "CaterEase — Premium Catering for Bangalore & Tirupati",
    template: "%s | CaterEase",
  },
  description:
    "Book premium catering for weddings, corporate events, birthdays and more. Customise your menu, choose your service package, and get it delivered across Bangalore and Tirupati.",
  keywords: [
    "catering Bangalore", "catering Tirupati", "wedding catering", "corporate catering",
    "event catering", "food delivery", "catering service", "CaterEase",
  ],
  manifest: "/manifest.json",
  authors: [{ name: "CaterEase" }],
  creator: "CaterEase",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: APP_URL,
    siteName: "CaterEase",
    title: "CaterEase — Premium Catering for Bangalore & Tirupati",
    description:
      "Customise your menu, choose your service type, and get premium catering delivered for any event.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "CaterEase Catering" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CaterEase — Premium Catering",
    description: "Premium catering for any event in Bangalore & Tirupati.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CaterEase",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body>
        {children}
        <Toaster />
        <ServiceWorkerRegistrar />
        <ChatWidgetLoader />
      </body>
    </html>
  );
}

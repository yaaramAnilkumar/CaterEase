import { ChefHat, Phone, Mail, MapPin, Instagram, Twitter, Facebook } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16">
      {/* Top CTA strip */}
      <div className="bg-gradient-to-r from-brand-600 to-orange-500 py-10">
        <div className="container-app flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h3 className="text-white text-2xl font-black mb-1">Ready to make your event unforgettable?</h3>
            <p className="text-orange-100 text-sm">Get a free quote in minutes. We respond within 2–4 hours.</p>
          </div>
          <Link href="/get-quote"
            className="flex-shrink-0 bg-white text-brand-600 font-bold px-7 py-3 rounded-2xl hover:bg-orange-50 transition-colors shadow-lg text-sm whitespace-nowrap">
            Get Free Quote →
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-app pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-white font-black text-xl mb-3">
              <ChefHat className="w-6 h-6 text-brand-400" />
              CaterEase
            </div>
            <p className="text-sm leading-relaxed text-gray-500 mb-5">
              Premium catering for every occasion in Bangalore and Tirupati. Trusted by 300+ families.
            </p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <div key={i} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-brand-500/20 flex items-center justify-center transition-colors cursor-pointer">
                  <Icon className="w-4 h-4 text-gray-500 hover:text-brand-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wide">Services</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Meal Box", href: "/menu?service=Meal+Box" },
                { label: "Delivery Box", href: "/menu?service=Delivery+Box" },
                { label: "Full Catering", href: "/menu?service=Catering" },
                { label: "Get a Quote", href: "/get-quote" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Browse Menu", href: "/menu" },
                { label: "Track Order", href: "/orders" },
                { label: "My Profile", href: "/profile" },
                { label: "Login / Register", href: "/login" },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm tracking-wide">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-brand-400" />
                </div>
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-brand-400" />
                </div>
                hello@caterease.in
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <span>Bangalore &amp; Tirupati<br /><span className="text-gray-600 text-xs">Mon–Sun, 8 AM – 10 PM</span></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} CaterEase. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

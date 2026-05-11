"use client";
// Metadata exported from a separate server component file would be cleaner,
// but since this page is client-only we rely on the layout's default metadata.
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import { CheckCircle, Phone, Mail, Users, CalendarDays, MessageSquare, FileText } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

const EVENT_TYPES = ["Birthday", "Wedding", "Corporate", "Sangeet", "Farmhouse Party", "Tea Party", "Family Reunion", "Other"];

export default function GetQuotePage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    event_type: "",
    guest_count: "",
    event_date: "",
    message: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast("Name and phone are required", "error"); return; }
    if (!form.event_type) { toast("Please select an event type", "error"); return; }
    if (!form.guest_count || Number(form.guest_count) < 1) { toast("Please enter guest count", "error"); return; }
    setLoading(true);
    try {
      await api.post("/enquiries/", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        event_type: form.event_type,
        guest_count: Number(form.guest_count),
        event_date: form.event_date || null,
        message: form.message.trim() || null,
      });
      setSubmitted(true);
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to submit. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <Toaster />
        <main className="container-app py-24 max-w-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">We'll be in touch!</h1>
          <p className="text-gray-500 mb-2">
            Thank you, <strong>{form.name.split(" ")[0]}</strong>. Your enquiry has been received.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Our team will call you at <strong>{form.phone}</strong> within 24 hours to discuss your event.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/" className="bg-brand-500 text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-brand-600 transition-colors">
              Back to Home
            </a>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ name: "", phone: "", email: "", event_type: "", guest_count: "", event_date: "", message: "" });
              }}
              className="border border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-colors">
              Submit Another Enquiry
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Toaster />
      <PageHero title="Get a Quote" subtitle="Tell us about your event and we'll get back to you shortly" icon={<FileText className="w-5 h-5" />} />
      <main className="container-app py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Get a Free Quote</h1>
          <p className="text-gray-500">Tell us about your event and we'll craft a custom catering proposal for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Name *</label>
              <input value={form.name} onChange={set("name")} placeholder="Ravi Kumar"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                <Phone className="w-3.5 h-3.5 inline mr-1" />Phone Number *
              </label>
              <input value={form.phone} onChange={set("phone")} type="tel" placeholder="9876543210"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" />Email (optional)
              </label>
              <input value={form.email} onChange={set("email")} type="email" placeholder="ravi@example.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Event Type *</label>
              <select value={form.event_type} onChange={set("event_type")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                <option value="">Select event type...</option>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1" />Expected Guests *
              </label>
              <input value={form.guest_count} onChange={set("guest_count")} type="number" min="1" placeholder="100"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                <CalendarDays className="w-3.5 h-3.5 inline mr-1" />Event Date (optional)
              </label>
              <input value={form.event_date} onChange={set("event_date")} type="date"
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Additional Requirements
            </label>
            <textarea value={form.message} onChange={set("message")} rows={4}
              placeholder="Jain food, live counter, specific cuisines, budget range, venue address..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? "Submitting..." : "Request Quote — We'll Call You Back"}
          </button>

          <p className="text-center text-xs text-gray-400">We typically respond within 2–4 hours during business hours.</p>
        </form>
      </main>
      <Footer />
    </>
  );
}

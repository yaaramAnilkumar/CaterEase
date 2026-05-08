"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Phone, Mail, Users, CalendarDays, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";

interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  event_type: string;
  guest_count: number;
  event_date: string | null;
  message: string | null;
  status: "New" | "Contacted" | "Closed";
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function AdminEnquiriesPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "New" | "Contacted" | "Closed">("All");

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    api.get("/enquiries/admin").then((r) => { setEnquiries(r.data); setLoading(false); });
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const { data } = await api.patch(`/enquiries/admin/${id}/status`, { status });
      setEnquiries((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch {
      toast("Failed to update status", "error");
    }
  };

  const filtered = enquiries.filter((e) => filter === "All" || e.status === filter);

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="container-app py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enquiries</h1>
            <p className="text-sm text-gray-500 mt-1">Customer catering consultation requests</p>
          </div>
          <div className="flex gap-2">
            {(["All", "New", "Contacted", "Closed"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${filter === s ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"}`}>
                {s}
                {s !== "All" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {enquiries.filter((e) => e.status === s).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{filter === "All" ? "No enquiries yet." : `No ${filter.toLowerCase()} enquiries.`}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((e) => (
              <div key={e.id} className={`bg-white rounded-2xl border border-gray-100 p-5 transition-opacity ${e.status === "Closed" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-semibold text-gray-900 text-lg">{e.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{e.event_type}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{e.phone}</span>
                      {e.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{e.email}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{e.guest_count} guests</span>
                      {e.event_date && <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(e.event_date)}</span>}
                    </div>
                    {e.message && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 italic">"{e.message}"</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">Received {formatDate(e.created_at)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <select value={e.status} onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

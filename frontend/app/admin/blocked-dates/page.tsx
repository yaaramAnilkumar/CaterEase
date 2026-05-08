"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { CalendarOff, Trash2, Plus } from "lucide-react";

interface BlockedEntry {
  id: number;
  date: string;
  reason?: string;
}

export default function BlockedDatesPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [entries, setEntries] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    api.get("/blocked-dates/").then((r) => { setEntries(r.data); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!newDate) { toast("Select a date first", "error"); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/blocked-dates/admin", { blocked_date: newDate, reason: newReason || null });
      setEntries((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewDate("");
      setNewReason("");
      toast("Date blocked", "success");
    } catch (e: any) {
      toast(e.response?.data?.detail ?? "Failed to block date", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Unblock this date?")) return;
    try {
      await api.delete(`/blocked-dates/admin/${id}`);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast("Date unblocked", "success");
    } catch {
      toast("Failed to unblock date", "error");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <div className="flex items-center gap-3 mb-8">
          <CalendarOff className="w-7 h-7 text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Blocked Dates</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">Customers cannot place orders for blocked dates. Use this for public holidays or fully-booked days.</p>

        {/* Add form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Date to block</label>
            <input type="date" value={newDate} min={today} onChange={(e) => setNewDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-48">
            <label className="text-xs text-gray-500 font-medium">Reason (optional)</label>
            <input type="text" value={newReason} onChange={(e) => setNewReason(e.target.value)}
              placeholder="e.g. Public holiday, Fully booked"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Block Date
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No dates blocked yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {entries.map((e, i) => (
              <div key={e.id} className={`flex items-center justify-between px-5 py-4 ${i < entries.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div>
                  <div className="font-semibold text-gray-900">
                    {new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                  {e.reason && <div className="text-sm text-gray-400 mt-0.5">{e.reason}</div>}
                </div>
                <button onClick={() => handleRemove(e.id)}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { RecurringOrder } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { RefreshCw, Pause, Play, Trash2, CalendarClock } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";

const FREQ_COLORS: Record<string, string> = {
  Weekly: "bg-blue-50 text-blue-700",
  Biweekly: "bg-purple-50 text-purple-700",
  Monthly: "bg-orange-50 text-orange-700",
};

export default function RecurringOrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<RecurringOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/recurring/").then((r) => { setOrders(r.data); setLoading(false); });
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const { data } = await api.patch(`/recurring/${id}/toggle`);
      setOrders((prev) => prev.map((o) => (o.id === id ? data : o)));
    } catch {
      toast("Failed to update", "error");
    }
  };

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Cancel recurring order "${label}"?`)) return;
    try {
      await api.delete(`/recurring/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast("Recurring order cancelled", "success");
    } catch {
      toast("Failed to cancel", "error");
    }
  };

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="container-app py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recurring Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Your saved catering schedules</p>
          </div>
          <Link href="/checkout"
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors">
            <CalendarClock className="w-4 h-4" /> New Schedule
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium mb-1">No recurring schedules yet</p>
            <p className="text-sm mb-6">Set up repeating catering orders from the checkout page.</p>
            <Link href="/checkout" className="text-brand-600 hover:underline text-sm font-medium">Go to Checkout →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const dishes = JSON.parse(o.dishes_json) as { dish_id: number; quantity: number }[];
              return (
                <div key={o.id} className={`bg-white rounded-2xl border border-gray-100 p-5 transition-opacity ${!o.is_active ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1.5">
                        <span className="font-semibold text-gray-900 text-base">{o.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLORS[o.frequency] ?? "bg-gray-100 text-gray-600"}`}>{o.frequency}</span>
                        {!o.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Paused</span>}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>{o.event_type} · {o.guest_count} guests</span>
                        <span>{dishes.length} dish(es)</span>
                        <span className="flex items-center gap-1 text-brand-600 font-medium">
                          <CalendarClock className="w-3.5 h-3.5" /> Next: {formatDate(o.next_date)}
                        </span>
                      </div>
                      {o.special_instructions && (
                        <p className="text-xs text-gray-400 mt-1.5 italic">"{o.special_instructions}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleToggle(o.id)} title={o.is_active ? "Pause" : "Resume"}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-colors">
                        {o.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(o.id, o.label)} title="Cancel"
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

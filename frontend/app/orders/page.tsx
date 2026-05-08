"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Star, RefreshCw, Download } from "lucide-react";
import PushNotificationBanner from "@/components/PushNotificationBanner";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Preparing: "bg-orange-100 text-orange-700",
  "Out for Delivery": "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/orders/").then((r) => { setOrders(r.data); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const headers = ["Order ID", "Event", "Guests", "Event Date", "Amount", "Status", "Placed On"];
    const rows = orders.map((o) => [
      `#${o.id}`, o.event_type, o.guest_count, formatDate(o.event_date),
      o.total_amount, o.status, formatDate(o.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "my-orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <PushNotificationBanner />
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <div className="flex items-center gap-3">
            {orders.length > 0 && (
              <button onClick={exportCSV} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
            )}
            {(user?.loyalty_points ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-xl text-sm font-medium">
                <Star className="w-4 h-4 fill-brand-400 text-brand-400" />
                {user?.loyalty_points} loyalty points
              </div>
            )}
            <Link href="/recurring" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors">
              <RefreshCw className="w-4 h-4" /> Recurring
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">No orders yet</p>
            <Link href="/menu" className="text-brand-600 hover:underline">Browse Menu →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="block bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">Order #{o.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-700"}`}>{o.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">{o.event_type} · {o.guest_count} guests · {formatDate(o.event_date)}</p>
                    <p className="text-xs text-gray-400 mt-1">{o.dishes.length} dish(es) selected</p>
                    {(o.points_earned ?? 0) > 0 && (
                      <p className="text-xs text-brand-600 mt-0.5 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-brand-400 text-brand-400" />+{o.points_earned} points earned
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-600 text-lg">{formatCurrency(o.total_amount)}</div>
                    <div className="text-xs text-gray-400">{formatDate(o.created_at)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

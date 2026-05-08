"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, IndianRupee, Clock, TrendingUp } from "lucide-react";

interface RevenuePoint { date: string; revenue: number }
interface EventRevenue { event_type: string; orders: number; revenue: number }

interface Stats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
  popular_dishes: { name: string; total_orders: number }[];
  orders_by_status: Record<string, number>;
}

export default function AdminDashboard() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chart, setChart] = useState<RevenuePoint[]>([]);
  const [eventRevenue, setEventRevenue] = useState<EventRevenue[]>([]);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    api.get("/admin/dashboard").then((r) => setStats(r.data));
    api.get("/admin/revenue-chart").then((r) => setChart(r.data));
    api.get("/admin/revenue-by-event-type").then((r) => setEventRevenue(r.data));
  }, []);

  const cards = stats ? [
    { label: "Total Orders", value: stats.total_orders, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Today's Orders", value: stats.today_orders, icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
    { label: "Pending", value: stats.pending_orders, icon: Clock, color: "bg-yellow-50 text-yellow-600" },
    { label: "Total Revenue", value: formatCurrency(stats.total_revenue), icon: IndianRupee, color: "bg-green-50 text-green-600" },
  ] : [];

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {!stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{c.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
              <div className="space-y-3">
                {Object.entries(stats.orders_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{status}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(count / stats.total_orders) * 100}%` }} />
                      </div>
                      <span className="font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Popular Dishes</h2>
              <div className="space-y-3">
                {stats.popular_dishes.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 w-5">{i + 1}.</span>
                    <span className="flex-1 text-gray-700">{d.name}</span>
                    <span className="font-medium text-gray-900">{d.total_orders} orders</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Revenue chart */}
        {chart.length > 0 && (() => {
          const max = Math.max(...chart.map((d) => d.revenue), 1);
          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
              <h2 className="font-semibold text-gray-900 mb-1">Revenue — Last 30 Days</h2>
              <p className="text-xs text-gray-400 mb-4">Excludes cancelled orders</p>
              <div className="flex items-end gap-0.5 h-32">
                {chart.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {d.revenue > 0 && <><br />{formatCurrency(d.revenue)}</>}
                      </div>
                    </div>
                    <div
                      className={`w-full rounded-sm transition-all ${d.revenue > 0 ? "bg-brand-400 hover:bg-brand-500" : "bg-gray-100"}`}
                      style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{new Date(chart[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <span>{new Date(chart[chart.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
            </div>
          );
        })()}

        {/* Revenue by event type */}
        {eventRevenue.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6">
            <h2 className="font-semibold text-gray-900 mb-4">Revenue by Event Type</h2>
            <div className="space-y-3">
              {eventRevenue.map((r) => {
                const maxRev = Math.max(...eventRevenue.map((x) => x.revenue), 1);
                return (
                  <div key={r.event_type} className="flex items-center gap-3 text-sm">
                    <span className="w-36 text-gray-600 truncate">{r.event_type}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(r.revenue / maxRev) * 100}%` }} />
                    </div>
                    <span className="font-medium text-gray-900 w-24 text-right">{formatCurrency(r.revenue)}</span>
                    <span className="text-gray-400 w-16 text-right">{r.orders} orders</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 flex-wrap">
          <a href="/admin/orders" className="bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-600">Manage Orders</a>
          <a href="/admin/menus" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Manage Menus</a>
          <a href="/admin/promos" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Promo Codes</a>
          <a href="/admin/enquiries" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Enquiries</a>
          <a href="/admin/users" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Users</a>
          <a href="/admin/reviews" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Reviews</a>
          <a href="/admin/blocked-dates" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Blocked Dates</a>
          <a href="/admin/audit" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50">Audit Log</a>
        </div>
      </main>
    </>
  );
}

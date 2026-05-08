"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";
import { Download, Filter, Search } from "lucide-react";

const STATUSES = ["", "Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Preparing: "bg-orange-100 text-orange-700",
  "Out for Delivery": "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

interface AdminOrder extends Order {
  customer_name?: string;
  customer_phone?: string;
}

export default function AdminOrdersPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (search.trim()) params.set("search", search.trim());
    api.get(`/orders/admin/all?${params.toString()}`).then((r) => {
      setOrders(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      toast(`Order #${orderId} updated to ${status}`, "success");
    } catch {
      toast("Failed to update status", "error");
    }
  };

  const exportCSV = () => {
    const headers = ["Order ID", "Customer", "Phone", "Event", "Guests", "Event Date", "Amount", "Status", "Created"];
    const rows = orders.map((o) => [
      `#${o.id}`,
      o.customer_name ?? "",
      o.customer_phone ?? "",
      o.event_type,
      o.guest_count,
      formatDate(o.event_date),
      o.total_amount,
      o.status,
      formatDate(o.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
          <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end">
          <Filter className="w-4 h-4 text-gray-400 self-center" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or #ID"
                className="pl-8 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300 w-40" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300">
              {STATUSES.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Event Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Event Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300" />
          </div>
          <button onClick={fetchOrders} className="bg-brand-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-600">
            Apply
          </button>
          <button onClick={() => { setFilterStatus(""); setDateFrom(""); setDateTo(""); setSearch(""); }} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Clear
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No orders found</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Order", "Customer", "Event", "Guests", "Amount", "Event Date", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">#{o.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{o.customer_name ?? "—"}</div>
                        {o.customer_phone && <div className="text-xs text-gray-400">{o.customer_phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{o.event_type}</td>
                      <td className="px-4 py-3">{o.guest_count}</td>
                      <td className="px-4 py-3 font-semibold text-brand-600">{formatCurrency(o.total_amount)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(o.event_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300">
                          {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
              {orders.length} order{orders.length !== 1 ? "s" : ""} shown
            </div>
          </div>
        )}
      </main>
    </>
  );
}

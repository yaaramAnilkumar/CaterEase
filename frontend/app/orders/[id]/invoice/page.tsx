"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Order, Dish } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, ArrowLeft } from "lucide-react";

export default function InvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [dishMap, setDishMap] = useState<Record<number, Dish>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      api.get(`/orders/${id}`),
      api.get("/menu/dishes"),
    ]).then(([orderRes, dishRes]) => {
      setOrder(orderRes.data);
      const map: Record<number, Dish> = {};
      dishRes.data.forEach((d: Dish) => { map[d.id] = d; });
      setDishMap(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading invoice…</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-400">Order not found.</div>;

  const invoiceNo = `CE-${String(order.id).padStart(5, "0")}`;
  const issuedOn = new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden bg-gray-100 px-6 py-3 flex items-center gap-4 sticky top-0 z-10 border-b border-gray-200">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-gray-300">|</span>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* Invoice — full width for printing */}
      <div className="min-h-screen bg-white p-10 max-w-2xl mx-auto print:max-w-none print:p-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-brand-500">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CaterEase</span>
            </div>
            <p className="text-xs text-gray-400">Premium Catering for Every Event</p>
            <p className="text-xs text-gray-400">Bangalore · Tirupati</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 tracking-tight">INVOICE</div>
            <div className="text-sm text-gray-500 mt-1">{invoiceNo}</div>
            <div className="text-xs text-gray-400 mt-0.5">Issued: {issuedOn}</div>
          </div>
        </div>

        {/* Customer + Event side by side */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Billed To</p>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            {user?.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
            {user?.email && !user.email.includes("@caterease.local") && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Event Details</p>
            <table className="text-sm w-full">
              <tbody>
                {[
                  ["Type", order.event_type],
                  ["Date", formatDate(order.event_date)],
                  ["Time", order.event_time?.slice(0, 5)],
                  ["Guests", String(order.guest_count)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="text-gray-400 pr-3 py-0.5">{k}</td>
                    <td className="text-gray-800 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dishes table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-100">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dish</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate/head</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.dishes.map((d) => {
              const dish = dishMap[d.dish_id];
              const lineTotal = d.unit_price * d.quantity * order.guest_count;
              return (
                <tr key={d.dish_id} className="border-b border-gray-50">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-gray-800">{dish?.name ?? `Dish #${d.dish_id}`}</span>
                    {d.quantity > 1 && <span className="ml-2 text-xs text-gray-400">× {d.quantity} serving(s)</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{order.guest_count}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(d.unit_price)}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-gray-800">{formatCurrency(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Guest discount</span><span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {(order.promo_discount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Promo code</span><span>-{formatCurrency(order.promo_discount!)}</span>
                </div>
              )}
              {(order.points_discount ?? 0) > 0 && (
                <div className="flex justify-between text-brand-600">
                  <span>Points redeemed</span><span>-{formatCurrency(order.points_discount!)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
                <span>Total Paid</span><span className="text-brand-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment Status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            ["Confirmed", "Preparing", "Out for Delivery", "Delivered"].includes(order.status)
              ? "bg-green-100 text-green-700"
              : order.status === "Cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {["Confirmed", "Preparing", "Out for Delivery", "Delivered"].includes(order.status) ? "Paid" : order.status}
          </span>
          <span className="text-xs text-gray-400">· Order {invoiceNo}</span>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-500">Thank you for choosing CaterEase! We look forward to making your event memorable.</p>
          <p className="text-xs text-gray-400 mt-1">Questions? Contact us at admin@caterease.in</p>
        </div>
      </div>
    </>
  );
}

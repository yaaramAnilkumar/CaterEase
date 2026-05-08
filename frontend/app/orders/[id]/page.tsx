"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import api from "@/lib/api";
import { Order, Dish, Review, PromoCode } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, Clock, Package, Truck, Star, RotateCcw, FileText } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";

const steps = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];
const stepIcons = [Clock, CheckCircle, Package, Truck, Star];

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110">
          <Star className={`w-7 h-7 ${(hover || value) >= n ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { items, addItem, setServiceType, setGuestCount, clearCart } = useCartStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [dishMap, setDishMap] = useState<Record<number, Dish>>({});
  const [review, setReview] = useState<Review | null | "none">("none");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);

  const FINAL_STATUSES = ["Delivered", "Cancelled"];

  const fetchOrder = async (isInitial = false) => {
    try {
      const r = await api.get(`/orders/${id}`);
      const o: Order = r.data;
      setOrder(o);
      if (isInitial) {
        const dishes = await api.get("/menu/dishes");
        const map: Record<number, Dish> = {};
        dishes.data.forEach((d: Dish) => { map[d.id] = d; });
        setDishMap(map);
        if (o.status === "Delivered") {
          try {
            const rv = await api.get(`/orders/${id}/review`);
            setReview(rv.data);
          } catch {
            setReview(null);
          }
        }
        setLoading(false);
      }
      return o.status;
    } catch {
      if (isInitial) setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    fetchOrder(true);
  }, [id]);

  useEffect(() => {
    if (!order || FINAL_STATUSES.includes(order.status)) return;
    const interval = setInterval(async () => {
      const status = await fetchOrder(false);
      if (status && FINAL_STATUSES.includes(status)) clearInterval(interval);
    }, 15000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const handleReorder = () => {
    if (!order) return;
    clearCart();
    order.dishes.forEach((d) => {
      const dish = dishMap[d.dish_id];
      if (dish) {
        for (let i = 0; i < d.quantity; i++) addItem(dish);
      }
    });
    setServiceType(order.service_type_id);
    setGuestCount(order.guest_count);
    toast("Items added to cart!", "success");
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast("Please select a rating", "error"); return; }
    if (!order) return;
    const firstDishId = order.dishes[0]?.dish_id;
    if (!firstDishId) return;
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/orders/${id}/review`, { dish_id: firstDishId, rating, comment });
      setReview(data);
      toast("Review submitted! Thank you.", "success");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <><Navbar /><div className="container-app py-20 text-center text-gray-400">Loading...</div><Footer /></>;
  if (!order) return <><Navbar /><div className="container-app py-20 text-center text-gray-400">Order not found.</div><Footer /></>;

  const currentStep = steps.indexOf(order.status);

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="container-app py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
            <Link href={`/orders/${order.id}/invoice`}
              className="flex items-center gap-1.5 text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Invoice
            </Link>
            <button onClick={handleReorder}
              className="flex items-center gap-1.5 text-sm bg-brand-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-brand-600 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reorder
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-semibold text-gray-900">Order Status</h2>
            {!["Delivered", "Cancelled"].includes(order.status) && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
            <div className="absolute top-5 left-5 h-0.5 bg-brand-500 transition-all duration-500"
              style={{ width: currentStep >= 0 ? `${(currentStep / (steps.length - 1)) * 100}%` : "0%" }} />
            <div className="relative flex justify-between">
              {steps.map((step, i) => {
                const Icon = stepIcons[i];
                const done = i <= currentStep;
                return (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${done ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-medium text-center max-w-[60px] ${done ? "text-brand-600" : "text-gray-400"}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event + Payment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Event Details</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{order.event_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Guests</span><span className="font-medium">{order.guest_count}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{formatDate(order.event_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{order.event_time?.slice(0, 5)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Payment</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Guest discount</span><span>-{formatCurrency(order.discount)}</span></div>
              )}
              {(order.promo_discount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600"><span>Promo code</span><span>-{formatCurrency(order.promo_discount!)}</span></div>
              )}
              {(order.points_discount ?? 0) > 0 && (
                <div className="flex justify-between text-brand-600"><span>Points redeemed ({order.points_redeemed} pts)</span><span>-{formatCurrency(order.points_discount!)}</span></div>
              )}
              {(order.points_earned ?? 0) > 0 && (
                <div className="flex justify-between text-brand-500 text-xs mt-1"><span>Points earned on this order</span><span>+{order.points_earned} pts</span></div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t pt-1.5 mt-1">
                <span>Total</span><span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Dishes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Selected Dishes ({order.dishes.length})</h3>
          <div className="space-y-2">
            {order.dishes.map((d) => {
              const dish = dishMap[d.dish_id];
              return (
                <div key={d.dish_id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dish?.is_veg ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-gray-800 font-medium">{dish?.name ?? `Dish #${d.dish_id}`}</span>
                    {d.quantity > 1 && <span className="text-gray-400 text-xs">× {d.quantity}</span>}
                  </div>
                  <span className="text-gray-600">{formatCurrency(d.unit_price * d.quantity * order.guest_count)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Review section — only for delivered orders */}
        {order.status === "Delivered" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Your Review</h3>
            {review && review !== "none" ? (
              <div>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`w-5 h-5 ${n <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-gray-600 italic">"{review.comment}"</p>}
              </div>
            ) : review === null ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <p className="text-sm text-gray-500">How was your experience? Leave a rating for this order.</p>
                <StarPicker value={rating} onChange={setRating} />
                <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience (optional)..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
                <button type="submit" disabled={submittingReview || rating === 0}
                  className="bg-brand-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : null}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

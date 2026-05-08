"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Star, CheckCircle, Trash2 } from "lucide-react";

interface AdminReview {
  id: number;
  order_id: number;
  user_id: number;
  dish_id: number;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
  customer_name?: string;
  dish_name?: string;
}

const TABS = ["All", "Pending", "Approved"] as const;
type Tab = typeof TABS[number];

export default function AdminReviewsPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    api.get("/reviews/admin").then((r) => { setReviews(r.data); setLoading(false); });
  }, []);

  const toggleApprove = async (id: number) => {
    try {
      const { data } = await api.patch(`/reviews/admin/${id}/approve`);
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, is_approved: data.is_approved } : r));
      toast(data.is_approved ? "Review approved" : "Review unapproved", "success");
    } catch {
      toast("Failed to update review", "error");
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast("Review deleted", "success");
    } catch {
      toast("Failed to delete review", "error");
    }
  };

  const filtered = reviews.filter((r) => {
    if (tab === "Pending") return !r.is_approved;
    if (tab === "Approved") return r.is_approved;
    return true;
  });

  const counts = {
    All: reviews.length,
    Pending: reviews.filter((r) => !r.is_approved).length,
    Approved: reviews.filter((r) => r.is_approved).length,
  };

  return (
    <>
      <Navbar />
      <main className="container-app py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Review Moderation</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t} <span className="ml-1 text-xs text-gray-400">({counts[t]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No reviews in this category</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className={`bg-white border rounded-2xl p-5 flex gap-4 items-start ${r.is_approved ? "border-green-100" : "border-gray-100"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900">{r.customer_name ?? `User #${r.user_id}`}</span>
                    <span className="text-xs text-gray-400">Order #{r.order_id}</span>
                    {r.is_approved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Approved</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {r.dish_name && <span className="font-medium text-gray-700">{r.dish_name} · </span>}
                    <span className="text-xs">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleApprove(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${r.is_approved ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-500 text-white hover:bg-green-600"}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {r.is_approved ? "Unapprove" : "Approve"}
                  </button>
                  <button onClick={() => deleteReview(r.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Tag, Plus, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";

interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "flat",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  expires_at: "",
};

export default function AdminPromosPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const { data } = await api.get("/promo/admin");
      setPromos(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast("Code is required", "error"); return; }
    if (!form.discount_value || Number(form.discount_value) <= 0) { toast("Discount value must be positive", "error"); return; }
    if (form.discount_type === "percent" && Number(form.discount_value) > 100) { toast("Percentage cannot exceed 100", "error"); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        code: form.code.trim().toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
      };
      const { data } = await api.post("/promo/admin", payload);
      setPromos((prev) => [data, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast("Promo code created!", "success");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to create promo", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const { data } = await api.patch(`/promo/admin/${id}/toggle`);
      setPromos((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch {
      toast("Failed to update", "error");
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/promo/admin/${id}`);
      setPromos((prev) => prev.filter((p) => p.id !== id));
      toast("Deleted", "success");
    } catch {
      toast("Failed to delete", "error");
    }
  };

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="container-app py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage discount codes</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors">
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Code</>}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-900">New Promo Code</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Code *</label>
                <input
                  value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE20" maxLength={20}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
                <input
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="20% off for new customers"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Discount Type *</label>
                <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as any }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Discount Value * {form.discount_type === "percent" ? "(%)" : "(₹)"}
                </label>
                <input type="number" min="1" max={form.discount_type === "percent" ? 100 : undefined}
                  value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  placeholder={form.discount_type === "percent" ? "20" : "500"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Min Order Amount (₹)</label>
                <input type="number" min="0"
                  value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                  placeholder="0 = no minimum"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Max Uses</label>
                <input type="number" min="1"
                  value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                  placeholder="Leave blank for unlimited"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 block mb-1">Expires At</label>
                <input type="datetime-local"
                  value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-brand-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors">
                {saving ? "Creating..." : "Create Code"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                className="border border-gray-200 px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Promo list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No promo codes yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl border p-5 transition-all ${p.is_active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="font-mono font-bold text-gray-900 text-lg tracking-wide">{p.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        {p.discount_type === "percent" ? `${p.discount_value}% off` : formatCurrency(p.discount_value) + " off"}
                      </span>
                    </div>
                    {p.description && <p className="text-sm text-gray-500 mb-1">{p.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      {p.min_order_amount > 0 && <span>Min order: {formatCurrency(p.min_order_amount)}</span>}
                      <span>Used: {p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</span>
                      {p.expires_at && <span>Expires: {formatDate(p.expires_at)}</span>}
                      <span>Created: {formatDate(p.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleToggle(p.id)} title={p.is_active ? "Deactivate" : "Activate"}
                      className="text-gray-400 hover:text-brand-500 transition-colors p-1">
                      {p.is_active ? <ToggleRight className="w-6 h-6 text-brand-500" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button onClick={() => handleDelete(p.id, p.code)} title="Delete"
                      className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { User } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Building2, Star } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";

export default function AdminUsersPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [corpForm, setCorpForm] = useState({ is_corporate: false, corporate_discount: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    api.get("/users/admin").then((r) => { setUsers(r.data); setLoading(false); });
  }, []);

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setCorpForm({ is_corporate: u.is_corporate, corporate_discount: u.corporate_discount });
  };

  const handleSave = async (userId: number) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/users/admin/${userId}/corporate`, corpForm);
      setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
      setEditingId(null);
      toast("Corporate status updated", "success");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  const customers = users.filter((u) => u.role === "customer");

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="container-app py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage corporate accounts and view loyalty points</p>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Name", "Phone", "Email", "Points", "Corporate", "Joined", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{u.email.startsWith("otp_") ? "—" : u.email}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-brand-600 font-medium">
                        <Star className="w-3 h-3 fill-brand-400 text-brand-400" />{u.loyalty_points}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs">
                            <input type="checkbox" checked={corpForm.is_corporate}
                              onChange={(e) => setCorpForm((f) => ({ ...f, is_corporate: e.target.checked }))} />
                            Corporate
                          </label>
                          {corpForm.is_corporate && (
                            <input type="number" min="0" max="50" value={corpForm.corporate_discount}
                              onChange={(e) => setCorpForm((f) => ({ ...f, corporate_discount: Number(e.target.value) }))}
                              className="w-14 border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300"
                              placeholder="%" />
                          )}
                        </div>
                      ) : (
                        u.is_corporate ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-purple-700">
                            <Building2 className="w-3.5 h-3.5" /> Corporate {u.corporate_discount > 0 && `(${u.corporate_discount}% off)`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSave(u.id)} disabled={saving}
                            className="text-xs bg-brand-500 text-white px-2.5 py-1 rounded-lg hover:bg-brand-600 disabled:opacity-50">
                            {saving ? "..." : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="text-xs border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(u)}
                          className="text-xs text-brand-600 hover:underline font-medium">Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

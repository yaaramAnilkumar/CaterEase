"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { Dish, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, ToggleLeft, ToggleRight, ImagePlus, X } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import Image from "next/image";

const emptyForm = {
  name: "", description: "", price_per_head: "", category_id: "",
  is_veg: true, is_popular: false, is_jain: false, is_vegan: false, is_gluten_free: false,
  image_url: "",
};

export default function AdminMenusPage() {
  const { isAdmin } = useAuthStore();
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin()) { router.push("/"); return; }
    Promise.all([api.get("/menu/dishes"), api.get("/menu/categories")]).then(([d, c]) => {
      setDishes(d.data); setCategories(c.data); setLoading(false);
    });
  }, []);

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const openEdit = (d: Dish) => {
    setEditing(d);
    setForm({
      name: d.name, description: d.description ?? "", price_per_head: String(d.price_per_head),
      category_id: String(d.category.id), is_veg: d.is_veg, is_popular: d.is_popular,
      is_jain: d.is_jain, is_vegan: d.is_vegan, is_gluten_free: d.is_gluten_free,
      image_url: d.image_url ?? "",
    });
    setShowForm(true);
    setTimeout(() => document.getElementById("dish-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("image_url", data.url);
      toast("Image uploaded", "success");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Upload failed — paste a URL instead", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price_per_head || !form.category_id) {
      toast("Name, price, and category are required", "error"); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), description: form.description.trim(),
        price_per_head: parseFloat(form.price_per_head), category_id: parseInt(form.category_id),
        is_veg: form.is_veg, is_popular: form.is_popular, is_jain: form.is_jain,
        is_vegan: form.is_vegan, is_gluten_free: form.is_gluten_free,
        image_url: form.image_url.trim() || null,
      };
      if (editing) {
        const { data } = await api.put(`/menu/dishes/${editing.id}`, payload);
        setDishes((prev) => prev.map((d) => d.id === editing.id ? data : d));
        toast("Dish updated", "success");
      } else {
        const { data } = await api.post("/menu/dishes", payload);
        setDishes((prev) => [data, ...prev]);
        toast("Dish added", "success");
      }
      resetForm();
    } catch (e: any) {
      toast(e.response?.data?.detail || "Error saving dish", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    try {
      const { data } = await api.put(`/menu/dishes/${dish.id}`, {
        name: dish.name, description: dish.description, price_per_head: dish.price_per_head,
        category_id: dish.category.id, is_veg: dish.is_veg, is_popular: dish.is_popular,
        is_jain: dish.is_jain, is_vegan: dish.is_vegan, is_gluten_free: dish.is_gluten_free,
        image_url: dish.image_url, is_available: !dish.is_available,
      });
      setDishes((prev) => prev.map((d) => d.id === dish.id ? data : d));
    } catch { toast("Failed to toggle", "error"); }
  };

  return (
    <>
      <Navbar />
      <Toaster />
      <main className="container-app py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Menu</h1>
          <Button onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Dish
          </Button>
        </div>

        {showForm && (
          <div id="dish-form" className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">{editing ? "Edit Dish" : "New Dish"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Price / Head (₹) *</label>
                <input type="number" value={form.price_per_head} onChange={(e) => set("price_per_head", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Category *</label>
                <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                  <option value="">Select...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <input value={form.description} onChange={(e) => set("description", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>

              {/* Image upload */}
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600 block mb-1">Dish Image</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)}
                      placeholder="https://... (paste URL or upload below)"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-colors whitespace-nowrap disabled:opacity-50">
                      <ImagePlus className="w-4 h-4" />{uploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                  {form.image_url && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image src={form.image_url} alt="preview" fill className="object-cover" />
                      <button onClick={() => set("image_url", "")}
                        className="absolute top-0 right-0 bg-black/50 text-white w-4 h-4 flex items-center justify-center rounded-bl">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Flags */}
              <div className="sm:col-span-2 flex flex-wrap gap-5">
                {[
                  { key: "is_veg", label: "Veg" },
                  { key: "is_popular", label: "Popular" },
                  { key: "is_jain", label: "Jain" },
                  { key: "is_vegan", label: "Vegan" },
                  { key: "is_gluten_free", label: "Gluten-Free" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={(form as any)[key]} onChange={(e) => set(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={handleSave} loading={saving}>{editing ? "Update Dish" : "Add Dish"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["", "Dish", "Category", "Price/Head", "Tags", "Available", ""].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dishes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 w-10">
                      {d.image_url ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                          <Image src={d.image_url} alt={d.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">🍛</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.category.name}</td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{formatCurrency(d.price_per_head)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${d.is_veg ? "text-green-600" : "text-red-500"}`}>{d.is_veg ? "VEG" : "NON-VEG"}</span>
                        {d.is_popular && <span className="text-xs bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-medium">Popular</span>}
                        {d.is_jain && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">Jain</span>}
                        {d.is_vegan && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Vegan</span>}
                        {d.is_gluten_free && <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-medium">GF</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleAvailability(d)} className="text-gray-400 hover:text-brand-500">
                        {d.is_available ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(d)} className="text-gray-400 hover:text-brand-500"><Pencil className="w-4 h-4" /></button>
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

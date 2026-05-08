"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast("Account created! Welcome to CaterEase.", "success");
      router.push("/");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 flex items-center justify-center p-4">
      <Toaster />
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center gap-2 justify-center mb-6">
          <ChefHat className="w-8 h-8 text-brand-500" />
          <span className="text-2xl font-bold text-gray-900">CaterEase</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-6">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(["name", "email", "phone", "password"] as const).map((field) => (
            <div key={field}>
              <label className="text-sm font-medium text-gray-700 block mb-1 capitalize">{field === "phone" ? "Phone Number" : field}</label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required value={form[field]} onChange={set(field)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder={field === "phone" ? "+91 98765 43210" : field === "email" ? "you@example.com" : ""}
              />
            </div>
          ))}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Create Account</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-brand-600 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, User, Mail, Phone, Lock, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

const FIELDS = [
  { key: "name",     label: "Full Name",     type: "text",     icon: User,  placeholder: "Ravi Kumar" },
  { key: "email",    label: "Email",         type: "email",    icon: Mail,  placeholder: "ravi@example.com" },
  { key: "phone",    label: "Phone Number",  type: "text",     icon: Phone, placeholder: "+91 98765 43210" },
  { key: "password", label: "Password",      type: "password", icon: Lock,  placeholder: "At least 6 characters" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast("Account created! Welcome to CaterEase.", "success");
      router.push("/");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Registration failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black">CaterEase</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Start Your<br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Catering Journey</span>
          </h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            Join hundreds of families who trust CaterEase for their most special occasions.
          </p>
          <ul className="space-y-3">
            {["Free account — no credit card needed", "Exclusive deals for registered users", "Track orders in real-time"].map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-gray-300">
                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-gray-600 text-xs relative z-10">© {new Date().getFullYear()} CaterEase</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <ChefHat className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">CaterEase</span>
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-black text-gray-900 mb-1">Create your account</h1>
              <p className="text-gray-500 text-sm">Get started in under 2 minutes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {FIELDS.map(({ key, label, type, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={type}
                      required
                      value={form[key]}
                      onChange={set(key)}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                  </div>
                </div>
              ))}
              <Button type="submit" className="w-full" size="lg" loading={loading}>Create Account</Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-600 font-bold hover:underline">Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

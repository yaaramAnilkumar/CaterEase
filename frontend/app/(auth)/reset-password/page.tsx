"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import Button from "@/components/ui/button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) router.replace("/forgot-password");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err: any) {
      toast(err.response?.data?.detail || "Reset failed. The link may have expired.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Password reset!</h2>
        <p className="text-sm text-gray-500 mb-6">Your password has been updated. You can now log in with your new password.</p>
        <Link href="/login">
          <Button size="lg" className="w-full">Go to login</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Set new password</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            placeholder="Min 6 characters"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
          <input
            type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 ${confirm && password !== confirm ? "border-red-300 bg-red-50" : "border-gray-200"}`}
            placeholder="Re-enter password"
          />
          {confirm && password !== confirm && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Reset password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 flex items-center justify-center p-4">
      <Toaster />
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center gap-2 justify-center mb-6">
          <ChefHat className="w-8 h-8 text-brand-500" />
          <span className="text-2xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_APP_NAME}</span>
        </div>
        <Suspense fallback={<div className="text-center text-gray-400 py-8">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

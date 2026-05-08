"use client";
import { useState } from "react";
import Link from "next/link";
import { ChefHat, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import Button from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast("Something went wrong. Please try again.", "error");
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
          <span className="text-2xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_APP_NAME}</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              If <span className="font-medium text-gray-700">{email}</span> is registered, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <Link href="/login" className="text-brand-600 font-medium hover:underline text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Forgot password?</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Send reset link
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              <Link href="/login" className="inline-flex items-center gap-1 text-brand-600 font-medium hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import api from "@/lib/api";

type Tab = "phone" | "email";
type OTPStep = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { login, setAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>("phone");

  // ── Phone OTP state ────────────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpStep, setOtpStep] = useState<OTPStep>("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ── Email / password state ─────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length < 10) { toast("Enter a valid 10-digit phone number", "error"); return; }
    setSending(true);
    try {
      const { data } = await api.post("/auth/send-otp", { phone: phone.trim() });
      setIsNewUser(data.is_new_user);
      setOtpStep("otp");
      toast(`OTP sent to ${phone}`, "success");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to send OTP", "error");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast("Enter the 6-digit OTP", "error"); return; }
    if (isNewUser && !name.trim()) { toast("Please enter your name", "error"); return; }
    setVerifying(true);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        phone: phone.trim(),
        otp,
        name: name.trim() || undefined,
      });
      setAuth(data.user, data.access_token);
      toast(`Welcome${isNewUser ? "" : " back"}, ${data.user.name}!`, "success");
      router.push("/");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Invalid OTP", "error");
    } finally {
      setVerifying(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await login(email, password);
      toast("Welcome back!", "success");
      router.push("/");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Login failed", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 flex items-center justify-center p-4">
      <Toaster />
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-6">
          <ChefHat className="w-8 h-8 text-brand-500" />
          <span className="text-2xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_APP_NAME}</span>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button onClick={() => { setTab("phone"); setOtpStep("phone"); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            📱 Phone OTP
          </button>
          <button onClick={() => setTab("email")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
            ✉️ Email
          </button>
        </div>

        {/* ── Phone OTP tab ── */}
        {tab === "phone" && otpStep === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl">+91</span>
                <input type="tel" required maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 border border-gray-200 rounded-r-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="9876543210" />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={sending}>Send OTP</Button>
          </form>
        )}

        {tab === "phone" && otpStep === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-sm text-gray-500">OTP sent to <span className="font-medium text-gray-800">+91 {phone}</span></p>
              <button type="button" onClick={() => setOtpStep("phone")} className="text-xs text-brand-600 hover:underline mt-0.5">Change number</button>
            </div>

            {isNewUser && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Your Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="Enter your full name" />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Enter OTP</label>
              <input type="tel" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="······" autoFocus />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={verifying}>
              {isNewUser ? "Create Account & Login" : "Verify & Login"}
            </Button>

            <p className="text-center text-xs text-gray-400">
              Didn't receive it?{" "}
              <button type="button" onClick={handleSendOTP} className="text-brand-600 font-medium hover:underline" disabled={sending}>
                Resend OTP
              </button>
            </p>
          </form>
        )}

        {/* ── Email tab ── */}
        {tab === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
              </div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={emailLoading}>Login</Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          New here?{" "}
          <Link href="/register" className="text-brand-600 font-medium hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}

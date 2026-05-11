"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChefHat, Phone, Mail, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import api from "@/lib/api";

type Tab = "phone" | "email";
type OTPStep = "phone" | "otp";

const TRUST_POINTS = [
  "500+ events catered across Bangalore & Tirupati",
  "Customise your menu for any occasion",
  "Real-time order tracking & updates",
];

export default function LoginPage() {
  const router = useRouter();
  const { login, setAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpStep, setOtpStep] = useState<OTPStep>("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

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
    } finally { setSending(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast("Enter the 6-digit OTP", "error"); return; }
    if (isNewUser && !name.trim()) { toast("Please enter your name", "error"); return; }
    setVerifying(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { phone: phone.trim(), otp, name: name.trim() || undefined });
      setAuth(data.user, data.access_token);
      toast(`Welcome${isNewUser ? "" : " back"}, ${data.user.name}!`, "success");
      router.push("/");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Invalid OTP", "error");
    } finally { setVerifying(false); }
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
    } finally { setEmailLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster />

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background dots */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Glow */}
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-black">CaterEase</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Premium Catering,<br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Delivered With Love</span>
          </h2>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            From intimate family gatherings to grand weddings — we handle the food so you can enjoy every moment.
          </p>
          <ul className="space-y-3">
            {TRUST_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-gray-300">
                <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-gray-600 text-xs relative z-10">© {new Date().getFullYear()} CaterEase</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <ChefHat className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-900">CaterEase</span>
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
              <p className="text-gray-500 text-sm">Sign in to manage your orders and catering events.</p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
              <button onClick={() => { setTab("phone"); setOtpStep("phone"); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Phone className="w-3.5 h-3.5" /> Phone OTP
              </button>
              <button onClick={() => setTab("email")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
            </div>

            {/* Phone OTP — enter phone */}
            {tab === "phone" && otpStep === "phone" && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl font-medium">+91</span>
                    <input type="tel" required maxLength={10} value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      placeholder="9876543210" autoFocus />
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" loading={sending}>Send OTP</Button>
              </form>
            )}

            {/* Phone OTP — enter OTP */}
            {tab === "phone" && otpStep === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="text-center bg-brand-50 rounded-2xl px-4 py-3">
                  <p className="text-sm text-gray-600">OTP sent to <span className="font-bold text-gray-900">+91 {phone}</span></p>
                  <button type="button" onClick={() => setOtpStep("phone")} className="text-xs text-brand-600 hover:underline mt-0.5">Change number</button>
                </div>
                {isNewUser && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Your Name *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                      placeholder="Enter your full name" />
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Enter 6-digit OTP</label>
                  <input type="tel" maxLength={6} value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full border-2 border-gray-200 focus:border-brand-400 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] font-black focus:outline-none transition-colors"
                    placeholder="······" autoFocus />
                </div>
                <Button type="submit" className="w-full" size="lg" loading={verifying}>
                  {isNewUser ? "Create Account & Login" : "Verify & Login"}
                </Button>
                <p className="text-center text-xs text-gray-400">
                  Didn't receive it?{" "}
                  <button type="button" onClick={handleSendOTP} className="text-brand-600 font-semibold hover:underline" disabled={sending}>
                    Resend OTP
                  </button>
                </p>
              </form>
            )}

            {/* Email login */}
            {tab === "email" && (
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
                  </div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" size="lg" loading={emailLoading}>Login</Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              New here?{" "}
              <Link href="/register" className="text-brand-600 font-bold hover:underline">Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

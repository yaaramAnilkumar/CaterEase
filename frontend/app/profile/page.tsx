"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import { Address } from "@/lib/types";
import { User, Lock, MapPin, Gift, Trash2, Copy, Check } from "lucide-react";

type Tab = "profile" | "password" | "addresses" | "referral";

interface ReferralInfo {
  referral_code: string;
  referred_count: number;
  points_per_referral: number;
  share_text: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddrs, setLoadingAddrs] = useState(false);

  // Referral
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    setName(user.name);
    setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (tab === "addresses" && addresses.length === 0) {
      setLoadingAddrs(true);
      api.get("/users/me/addresses").then((r) => { setAddresses(r.data); setLoadingAddrs(false); });
    }
    if (tab === "referral" && !referral) {
      api.get("/users/me/referral").then((r) => setReferral(r.data));
    }
  }, [tab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.patch("/users/me", { name: name.trim(), phone: phone.trim() });
      setUser(data);
      toast("Profile updated", "success");
    } catch (err: any) {
      toast(err.response?.data?.detail ?? "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast("Passwords do not match", "error"); return; }
    if (newPw.length < 6) { toast("Password must be at least 6 characters", "error"); return; }
    setSavingPw(true);
    try {
      await api.post("/users/me/change-password", { current_password: currentPw, new_password: newPw });
      toast("Password changed successfully", "success");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast(err.response?.data?.detail ?? "Failed to change password", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    try {
      await api.delete(`/users/me/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast("Address deleted", "success");
    } catch {
      toast("Failed to delete address", "error");
    }
  };

  const handleCopy = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "referral", label: "Referral", icon: Gift },
  ];

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="container-app py-10 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input value={user.email.includes("@caterease.local") ? "—" : user.email} disabled
                  className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-gray-400">
                  {(user.loyalty_points ?? 0) > 0 && <span>⭐ {user.loyalty_points} loyalty points</span>}
                </div>
                <button type="submit" disabled={savingProfile}
                  className="bg-brand-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
                  {savingProfile ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password */}
        {tab === "password" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: "Current Password", value: currentPw, set: setCurrentPw },
                { label: "New Password", value: newPw, set: setNewPw },
                { label: "Confirm New Password", value: confirmPw, set: setConfirmPw },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                  <input type="password" value={value} onChange={(e) => set(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingPw}
                  className="bg-brand-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
                  {savingPw ? "Changing…" : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses */}
        {tab === "addresses" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Saved Addresses</h2>
            {loadingAddrs ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : addresses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No saved addresses yet. Add one at checkout.</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((a) => (
                  <div key={a.id} className="flex items-start justify-between border border-gray-100 rounded-xl p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{a.label}</span>
                        {a.is_default && <span className="text-xs text-brand-600 font-medium">Default</span>}
                      </div>
                      <p className="text-sm text-gray-700">{a.line1}, {a.area}</p>
                      <p className="text-sm text-gray-500">{a.city} — {a.pincode}</p>
                    </div>
                    <button onClick={() => handleDeleteAddress(a.id)}
                      className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Referral */}
        {tab === "referral" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-brand-500 to-orange-600 rounded-2xl p-6 text-white">
              <Gift className="w-8 h-8 mb-3 opacity-80" />
              <h2 className="text-xl font-bold mb-1">Refer & Earn</h2>
              <p className="text-sm text-orange-100 mb-4">Share your code. Your friend gets 50 points, you get 100 points when they join.</p>
              {referral ? (
                <div className="flex items-center gap-3 bg-white/20 rounded-xl px-4 py-3">
                  <span className="text-2xl font-bold tracking-widest flex-1">{referral.referral_code}</span>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-sm font-medium bg-white text-brand-600 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              ) : (
                <div className="h-12 bg-white/20 rounded-xl animate-pulse" />
              )}
            </div>
            {referral && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-brand-600">{referral.referred_count}</div>
                    <div className="text-sm text-gray-500 mt-1">Friends referred</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-600">{referral.referred_count * referral.points_per_referral}</div>
                    <div className="text-sm text-gray-500 mt-1">Points earned</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "@/components/ui/toaster";
import Button from "@/components/ui/button";
import { Address, ServiceType, AppConfig } from "@/lib/types";
import { Plus, Minus, MapPin, X, Tag, ChevronRight, ShoppingBag } from "lucide-react";
import PageHero from "@/components/layout/PageHero";

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, guestCount: storedGuests, serviceTypeId, packageId, eventType, setEventType, clearCart } = useCartStore();
  const [guests, setGuests] = useState(storedGuests || 10);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(serviceTypeId);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(packageId);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("12:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoResult, setPromoResult] = useState<{ code: string; discountAmount: number; message: string } | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  // Recurring order
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringLabel, setRecurringLabel] = useState("");
  const [recurringFreq, setRecurringFreq] = useState("Weekly");
  const [recurringNextDate, setRecurringNextDate] = useState("");

  // Inline address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: "Home", line1: "", area: "", city: "", pincode: "", is_default: false });

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/blocked-dates/").then((r) => setBlockedDates(new Set(r.data.map((d: { date: string }) => d.date))));
    api.get("/config").then((r) => {
      const cfg: AppConfig = r.data;
      setAppConfig(cfg);
      setAddrForm((f) => ({ ...f, city: cfg.default_city }));
    });
    api.get("/users/me/addresses").then((r) => {
      setAddresses(r.data);
      if (r.data.length) setSelectedAddress(r.data.find((a: Address) => a.is_default)?.id ?? r.data[0].id);
    });
    api.get("/menu/service-types").then((r) => {
      setServiceTypes(r.data);
      if (!selectedService && r.data.length) setSelectedService(r.data[0].id);
    });
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.body.appendChild(script);
  }, []);

  const handleServiceChange = (s: ServiceType) => {
    setSelectedService(s.id);
    setSelectedPackage(null);
    if (guests < s.min_guests) setGuests(s.min_guests);
  };

  const changeGuests = (delta: number) => {
    const currentService = serviceTypes.find((s) => s.id === selectedService);
    const min = currentService?.min_guests ?? 10;
    setGuests((prev) => Math.max(min, prev + delta));
  };

  const handleSaveAddress = async () => {
    if (!addrForm.line1 || !addrForm.area || !addrForm.pincode) {
      toast("Please fill all address fields", "error");
      return;
    }
    setSavingAddress(true);
    try {
      const { data } = await api.post("/users/me/addresses", addrForm);
      setAddresses((prev) => [...prev, data]);
      setSelectedAddress(data.id);
      setShowAddressForm(false);
      setAddrForm({ label: "Home", line1: "", area: "", city: "Bangalore", pincode: "", is_default: false });
      toast("Address saved", "success");
    } catch {
      toast("Failed to save address", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoApplying(true);
    try {
      const { data } = await api.post("/promo/validate", {
        code: promoInput.trim().toUpperCase(),
        order_amount: subtotal,
      });
      if (data.valid) {
        setPromoResult({ code: promoInput.trim().toUpperCase(), discountAmount: data.discount_amount, message: data.message });
        toast(data.message, "success");
      } else {
        setPromoResult(null);
        toast(data.message, "error");
      }
    } catch {
      toast("Failed to validate promo code", "error");
    } finally {
      setPromoApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoResult(null);
    setPromoInput("");
  };

  const handlePlaceOrder = async () => {
    if (!selectedService) {
      toast("Please select a service type", "error");
      document.getElementById("section-service")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!eventDate) {
      toast("Please select an event date", "error");
      document.getElementById("section-event")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!selectedAddress) {
      toast("Please add or select a delivery address", "error");
      document.getElementById("section-address")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(true);
    try {
      const orderPayload = {
        service_type_id: selectedService,
        package_id: selectedPackage,
        event_type: eventType,
        guest_count: guests,
        event_date: eventDate,
        event_time: eventTime + ":00",
        delivery_address_id: selectedAddress,
        special_instructions: notes,
        dishes: items.map((i) => ({ dish_id: i.dish.id, quantity: i.quantity })),
        promo_code: promoResult?.code ?? null,
        redeem_points: usePoints && userPoints > 0,
      };
      const { data: order } = await api.post("/orders/", orderPayload);
      const { data: payment } = await api.post("/payments/create", { order_id: order.id });

      // Dev mode: no Razorpay keys configured — auto-confirm order
      if (payment.is_mock) {
        await api.post("/payments/verify", {
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        if (makeRecurring && recurringLabel.trim() && recurringNextDate && selectedAddress && selectedService) {
          try {
            await api.post("/recurring/", {
              label: recurringLabel.trim(),
              service_type_id: selectedService,
              event_type: eventType,
              guest_count: guests,
              delivery_address_id: selectedAddress,
              special_instructions: notes || null,
              dishes: items.map((i) => ({ dish_id: i.dish.id, quantity: i.quantity })),
              frequency: recurringFreq,
              next_date: recurringNextDate,
            });
          } catch { /* non-fatal */ }
        }
        clearCart();
        toast("Order confirmed successfully!", "success");
        router.push(`/orders/${order.id}`);
        return;
      }

      // Production: open Razorpay checkout popup
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: payment.amount * 100,
        currency: appConfig?.currency ?? payment.currency,
        name: process.env.NEXT_PUBLIC_APP_NAME,
        description: `Order #${order.id}`,
        order_id: payment.razorpay_order_id,
        handler: async (response: any) => {
          await api.post("/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          clearCart();
          toast("Payment successful! Order confirmed.", "success");
          router.push(`/orders/${order.id}`);
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: process.env.NEXT_PUBLIC_BRAND_COLOR ?? "#f97316" },
      };
      new window.Razorpay(options).open();
    } catch (e: any) {
      toast(e.response?.data?.detail || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentService = serviceTypes.find((s) => s.id === selectedService);
  const currentPackage = currentService?.packages.find((p) => p.id === selectedPackage);

  const threshold = appConfig?.discount_threshold_guests ?? 50;
  const discountPct = appConfig?.discount_percent ?? 5;
  const dishesTotal = items.reduce((sum, i) => sum + i.dish.price_per_head * i.quantity * guests, 0);
  const pkgTotal = (currentPackage?.base_price_per_head ?? 0) * guests;
  const subtotal = dishesTotal + pkgTotal;
  const guestDiscount = guests >= threshold ? subtotal * (discountPct / 100) : 0;
  const corpDiscount = user?.is_corporate && user.corporate_discount > 0 ? subtotal * (user.corporate_discount / 100) : 0;
  const promoDiscount = promoResult?.discountAmount ?? 0;
  const pointsValue = appConfig?.points_rupee_value ?? 0.1;
  const userPoints = user?.loyalty_points ?? 0;
  const maxPointsDiscount = Math.max(0, subtotal - guestDiscount - corpDiscount - promoDiscount);
  const pointsDiscount = usePoints ? Math.min(Math.round(userPoints * pointsValue * 100) / 100, maxPointsDiscount) : 0;
  const total = Math.max(0, subtotal - guestDiscount - corpDiscount - promoDiscount - pointsDiscount);

  return (
    <>
      <Navbar />
      <PageHero title="Checkout" subtitle="Review your order and confirm booking" icon={<ShoppingBag className="w-5 h-5" />} />
      <main className="container-app py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Service Type */}
            <div id="section-service" className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">1</span>
                <h2 className="font-bold text-gray-900">Service Type</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {serviceTypes.map((s) => (
                  <button key={s.id} onClick={() => handleServiceChange(s)}
                    className={`border rounded-xl p-3 text-left text-sm transition-all ${selectedService === s.id ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300"}`}>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.min_guests}+ guests</div>
                  </button>
                ))}
              </div>
              {currentService && currentService.packages.length > 0 && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Package</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentService.packages.map((p) => (
                      <button key={p.id} onClick={() => setSelectedPackage(p.id)}
                        className={`border rounded-xl p-3 text-left text-sm transition-all ${selectedPackage === p.id ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300"}`}>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(p.base_price_per_head)}/head</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Guest Count */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">2</span>
                  <h2 className="font-bold text-gray-900">Number of Guests</h2>
                </div>
                {currentService && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                    Min {currentService.min_guests} for {currentService.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => changeGuests(-5)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-4xl font-bold w-16 text-center tabular-nums">{guests}</span>
                <button onClick={() => changeGuests(5)}
                  className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600">
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">guests</span>
              </div>
              {guests >= threshold && (
                <p className="text-green-600 text-sm mt-3 font-medium">{discountPct}% discount applied for {threshold}+ guests!</p>
              )}
            </div>

            {/* Event Details */}
            <div id="section-event" className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">3</span>
                <h2 className="font-bold text-gray-900">Event Details</h2>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">Event Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(appConfig?.event_types ?? []).map((et) => (
                    <button key={et} onClick={() => setEventType(et)}
                      className={`border rounded-xl px-3 py-2 text-sm font-medium transition-all ${eventType === et ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-brand-300"}`}>
                      {et}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Event Date *</label>
                  <input type="date" value={eventDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (blockedDates.has(val)) { toast("This date is unavailable for bookings", "error"); return; }
                      setEventDate(val);
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 ${!eventDate ? "border-red-300 bg-red-50" : "border-gray-200"}`} />
                  {blockedDates.size > 0 && <p className="text-xs text-gray-400 mt-1">Some dates may be unavailable.</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Event Time *</label>
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">Special Instructions</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, serving instructions..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
              </div>
            </div>

            {/* Delivery Address */}
            <div id="section-address" className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">4</span>
                  <h2 className="font-bold text-gray-900">Delivery Address</h2>
                </div>
                <button onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline">
                  {showAddressForm ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><MapPin className="w-3.5 h-3.5" /> Add New</>}
                </button>
              </div>

              {showAddressForm && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Label</label>
                      <select value={addrForm.label} onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                        {["Home", "Office", "Venue", "Other"].map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">City</label>
                      <select value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                        {(appConfig?.cities ?? []).map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Address Line *</label>
                    <input value={addrForm.line1} onChange={(e) => setAddrForm((f) => ({ ...f, line1: e.target.value }))}
                      placeholder="House/Flat no, Street, Building"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Area *</label>
                      <input value={addrForm.area} onChange={(e) => setAddrForm((f) => ({ ...f, area: e.target.value }))}
                        placeholder="Koramangala, Indiranagar..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Pincode *</label>
                      <input value={addrForm.pincode} onChange={(e) => setAddrForm((f) => ({ ...f, pincode: e.target.value }))}
                        placeholder="560001"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={addrForm.is_default} onChange={(e) => setAddrForm((f) => ({ ...f, is_default: e.target.checked }))} />
                    Set as default address
                  </label>
                  <Button onClick={handleSaveAddress} loading={savingAddress} size="sm">Save Address</Button>
                </div>
              )}

              {addresses.length === 0 && !showAddressForm ? (
                <p className="text-sm text-gray-500">No addresses saved. Click <span className="text-brand-600 font-medium">Add New</span> above.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <button key={a.id} onClick={() => setSelectedAddress(a.id)}
                      className={`w-full border rounded-xl p-4 text-left text-sm transition-all ${selectedAddress === a.id ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300"}`}>
                      <div className="font-semibold">{a.label}</div>
                      <div className="text-gray-500">{a.line1}, {a.area}, {a.city} – {a.pincode}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-20">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Summary</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between"><span>Dishes</span><span>{items.length} selected</span></div>
              <div className="flex justify-between"><span>Guests</span><span>{guests}</span></div>
              {currentService && <div className="flex justify-between"><span>Service</span><span>{currentService.name}</span></div>}
              {currentPackage && <div className="flex justify-between"><span>Package</span><span>{currentPackage.name}</span></div>}
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              {guestDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Guest discount ({discountPct}%)</span><span>-{formatCurrency(guestDiscount)}</span>
                </div>
              )}
              {corpDiscount > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>Corporate discount ({user?.corporate_discount}%)</span><span>-{formatCurrency(corpDiscount)}</span>
                </div>
              )}
              {promoResult && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />{promoResult.code}
                    <button onClick={handleRemovePromo} className="text-gray-400 hover:text-red-400 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                  <span>-{formatCurrency(promoResult.discountAmount)}</span>
                </div>
              )}
              {usePoints && pointsDiscount > 0 && (
                <div className="flex justify-between text-brand-600">
                  <span>Points redeemed</span><span>-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Loyalty points toggle */}
            {userPoints > 0 && (
              <label className="flex items-center justify-between gap-2 text-sm cursor-pointer mb-3 bg-brand-50 rounded-lg px-3 py-2.5">
                <span className="text-brand-700 font-medium">
                  Use {userPoints} points (= {formatCurrency(Math.round(userPoints * pointsValue * 100) / 100)} off)
                </span>
                <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="accent-brand-500" />
              </label>
            )}

            {/* Promo code input */}
            {!promoResult && (
              <div className="flex gap-2 mb-4">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  placeholder="Promo code"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-300 uppercase placeholder:normal-case"
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={promoApplying || !promoInput.trim()}
                  className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap">
                  {promoApplying ? "..." : "Apply"}
                </button>
              </div>
            )}

            {/* Recurring order toggle */}
            <div className="border-t pt-4 mb-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                <input type="checkbox" checked={makeRecurring} onChange={(e) => setMakeRecurring(e.target.checked)} className="accent-brand-500" />
                <span className="font-medium text-gray-700">Save as recurring order</span>
              </label>
              {makeRecurring && (
                <div className="space-y-2">
                  <input value={recurringLabel} onChange={(e) => setRecurringLabel(e.target.value)}
                    placeholder="e.g. Weekly office lunch"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={recurringFreq} onChange={(e) => setRecurringFreq(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                      <option value="Weekly">Weekly</option>
                      <option value="Biweekly">Biweekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                    <input type="date" value={recurringNextDate} onChange={(e) => setRecurringNextDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handlePlaceOrder} loading={loading} className="w-full" size="lg">
              Pay {formatCurrency(total)}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

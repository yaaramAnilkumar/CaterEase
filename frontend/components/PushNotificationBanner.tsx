"use client";
import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export default function PushNotificationBanner() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<"idle" | "prompt" | "subscribed" | "denied" | "unsupported">("idle");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported"); return;
    }
    if (Notification.permission === "granted") { setStatus("subscribed"); return; }
    if (Notification.permission === "denied") { setStatus("denied"); return; }
    setStatus("prompt");
  }, [user]);

  const handleEnable = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setStatus("denied"); return; }

    try {
      const { data } = await api.get("/push/vapid-public-key");
      if (!data.public_key) { setStatus("subscribed"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key),
      });
      const json = sub.toJSON();
      await api.post("/push/subscribe", {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      });
      setStatus("subscribed");
    } catch {
      setStatus("subscribed"); // still show as done even if backend send fails
    }
  };

  if (!user || dismissed || status === "idle" || status === "subscribed" || status === "unsupported") return null;
  if (status === "denied") return null;

  return (
    <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-4 h-4 text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Get order updates</p>
          <p className="text-xs text-gray-500">Enable notifications to know when your order status changes.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={handleEnable}
          className="bg-brand-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors">
          Enable
        </button>
        <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

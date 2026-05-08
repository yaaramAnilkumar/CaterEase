"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export default function ServiceWorkerRegistrar() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      if (!user) return;

      // Only subscribe if notification permission already granted or not yet asked
      if (Notification.permission === "denied") return;

      // Fetch VAPID public key
      let vapidKey = "";
      try {
        const { data } = await api.get("/push/vapid-public-key");
        vapidKey = data.public_key;
      } catch { return; }
      if (!vapidKey) return; // push not configured on backend

      // Subscribe
      try {
        const existing = await reg.pushManager.getSubscription();
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const json = sub.toJSON();
        await api.post("/push/subscribe", {
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        });
      } catch { /* permission not granted or subscribe failed */ }
    }).catch(() => {});
  }, [user]);

  return null;
}

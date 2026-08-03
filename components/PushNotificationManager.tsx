"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Check, X, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const pathname = usePathname();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register Service Worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setIsSubscribed(true);
            } else if (Notification.permission === "default") {
              const timer = setTimeout(() => setShowPromptBanner(true), 500);
              return () => clearTimeout(timer);
            }
          });
        })
        .catch((err) => console.warn("Service Worker registration failed:", err));
    }
  }, []);

  // Do not render floating prompt/badge on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubscribe = async () => {
    if (!isSupported) {
      alert("Browser Anda belum mendukung Web Push Notifications.");
      return;
    }

    setLoading(true);
    setStatusMsg("");

    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        setStatusMsg("Izin notifikasi ditolak. Anda dapat mengaktifkannya di setelan browser.");
        setLoading(false);
        return;
      }

      // Ambil VAPID public key dari server
      const settingsRes = await fetch("/api/admin/settings");
      const settingsData = await settingsRes.json();
      const vapidPublicKey = settingsData.notificationSettings?.vapidPublicKey;

      if (!vapidPublicKey) {
        setStatusMsg("VAPID Key belum dikonfigurasi oleh admin.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Kirim subscription ke backend API
      const subRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          userName: "Pengguna IMO 2026",
        }),
      });

      if (subRes.ok) {
        setIsSubscribed(true);
        setShowPromptBanner(false);
        setStatusMsg("Notifikasi berhasil diaktifkan untuk perangkat ini!");
      } else {
        const errData = await subRes.json();
        setStatusMsg("Gagal menyimpan langganan: " + errData.error);
      }
    } catch (err: any) {
      console.error("Failed to subscribe:", err);
      setStatusMsg("Terjadi kesalahan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      setStatusMsg("Notifikasi perangkat telah dinonaktifkan.");
    } catch (err: any) {
      console.error("Failed to unsubscribe:", err);
      setStatusMsg("Gagal membatalkan notifikasi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Floating Prompt Banner (Jika belum subscribe) */}
      <AnimatePresence>
        {showPromptBanner && !isSubscribed && permission === "default" && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-5 right-5 left-5 md:left-auto md:max-w-md z-50 p-4 rounded-2xl bg-slate-950/95 border border-accent-cyan/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(125,249,255,0.25)] flex flex-col space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 animate-pulse">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center space-x-1.5">
                    <span>Aktifkan Push Notification</span>
                    <Sparkles className="h-3 w-3 text-accent-cyan" />
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    Dapatkan peringatan tenggat waktu tugas H-1 & pengumuman baru langsung di perangkat Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromptBanner(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setShowPromptBanner(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-accent-cyan text-black font-mono font-extrabold text-xs hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(125,249,255,0.4)] flex items-center space-x-1.5 cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{loading ? "Mengaktifkan..." : "Aktifkan Sekarang"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mini Toggle Button (Always Available) */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={loading}
          className={`p-3 rounded-full border backdrop-blur-xl transition duration-300 shadow-xl flex items-center space-x-2 text-xs font-mono font-bold cursor-pointer ${
            isSubscribed
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "bg-slate-900/90 border-white/10 text-slate-300 hover:text-accent-cyan hover:border-accent-cyan/40"
          }`}
          title={isSubscribed ? "Push Notification Aktif (Klik untuk matikan)" : "Aktifkan Push Notification"}
        >
          {isSubscribed ? (
            <>
              <Bell className="h-4 w-4 text-emerald-400 animate-bounce" />
              <span className="hidden sm:inline">Push Notif Active</span>
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">{loading ? "Loading..." : "Notifikasi Device"}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { saveFcmTokenToServer } from "@/hooks/useFcmNotification";

export default function PushNotificationManager() {
  const pathname = usePathname();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register FCM Service Worker
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .then(() => {
          if (Notification.permission === "granted") {
            setIsSubscribed(true);
          } else if (Notification.permission === "default") {
            const timer = setTimeout(() => setShowPromptBanner(true), 1000);
            return () => clearTimeout(timer);
          }
        })
        .catch((err) => console.warn("FCM Service Worker registration failed:", err));
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

    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        setLoading(false);
        return;
      }

      // Ambil token FCM
      const { requestFcmToken } = await import("@/lib/firebase");
      const token = await requestFcmToken();

      if (token) {
        await saveFcmTokenToServer(token, { userAgent: navigator.userAgent });
      }

      setIsSubscribed(true);
      setShowPromptBanner(false);
    } catch (err: any) {
      console.error("Failed to subscribe FCM:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      // Hapus token lokal jika ada
      const { requestFcmToken } = await import("@/lib/firebase");
      const token = await requestFcmToken();
      if (token) {
        await fetch("/api/push/fcm-token", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error("Failed to unsubscribe:", err);
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
            className="fixed bottom-5 right-5 left-5 md:left-auto md:max-w-md z-50 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] flex flex-col space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-white flex items-center space-x-1.5">
                    <span>Aktifkan Notifikasi Portal</span>
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    Dapatkan pengingat deadline tugas & pengumuman mendadak langsung di perangkat Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromptBanner(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setShowPromptBanner(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 text-black font-mono font-extrabold text-xs hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center space-x-1.5 cursor-pointer"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>{loading ? "Mengaktifkan..." : "Aktifkan Sekarang"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mini Toggle Button */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={loading}
          className={`p-3 rounded-full border backdrop-blur-xl transition duration-300 shadow-xl flex items-center space-x-2 text-xs font-mono font-bold cursor-pointer ${
            isSubscribed
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "bg-slate-900/90 border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
          }`}
          title={isSubscribed ? "Notifikasi FCM Aktif (Klik untuk nonaktifkan)" : "Aktifkan Notifikasi Portal"}
        >
          {isSubscribed ? (
            <>
              <Bell className="h-4 w-4 text-emerald-400 animate-bounce" />
              <span className="hidden sm:inline">Notif Aktif</span>
            </>
          ) : (
            <>
              <BellOff className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">{loading ? "Loading..." : "Aktifkan Notif"}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

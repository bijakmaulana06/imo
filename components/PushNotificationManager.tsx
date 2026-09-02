"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, X, Sparkles, CheckCircle2 } from "lucide-react";
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
  const [successToast, setSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator && "Notification" in window) {
      setIsSupported(true);
      const currentPerm = Notification.permission;
      setPermission(currentPerm);

      // Register FCM Service Worker
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .then(() => {
          if (currentPerm === "granted") {
            setIsSubscribed(true);
            setupForegroundListener();
          } else if (currentPerm === "default") {
            // Check if dismissed previously
            const dismissedAt = localStorage.getItem("imo_notif_prompt_dismissed_at");
            const isDismissedRecently =
              dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 3 * 24 * 60 * 60 * 1000; // 3 days

            if (!isDismissedRecently) {
              const timer = setTimeout(() => setShowPromptBanner(true), 1800);
              return () => clearTimeout(timer);
            }
          }
        })
        .catch((err) => console.warn("FCM Service Worker registration failed:", err));
    }
  }, []);

  const setupForegroundListener = () => {
    import("@/lib/firebase")
      .then(({ onForegroundMessage, requestFcmToken }) => {
        requestFcmToken().then((token) => {
          if (token) {
            saveFcmTokenToServer(token, { userAgent: navigator.userAgent });
          }
        });

        onForegroundMessage((payload) => {
          console.log("[FCM] Foreground message received:", payload);
          const title = payload.notification?.title || payload.data?.title || "Notifikasi IMO 2026";
          const body =
            payload.notification?.body ||
            payload.data?.body ||
            payload.data?.message ||
            "Ada pemberitahuan baru.";
          const icon = payload.notification?.icon || "/favicon.ico";
          const url = payload.data?.url || "/info";

          if (Notification.permission === "granted") {
            navigator.serviceWorker.ready
              .then((reg) => {
                reg.showNotification(title, {
                  body,
                  icon,
                  badge: "/favicon.ico",
                  tag: payload.data?.tag || "imo-foreground-notif",
                  renotify: true,
                  data: { url },
                } as NotificationOptions);
              })
              .catch(() => {
                new Notification(title, { body, icon, data: { url } });
              });
          }
        });
      })
      .catch((err) => console.warn("[FCM] Failed to setup listener:", err));
  };

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
        setShowPromptBanner(false);
        setLoading(false);
        return;
      }

      // Ambil token FCM & daftarkan
      const { requestFcmToken } = await import("@/lib/firebase");
      const token = await requestFcmToken();

      if (token) {
        await saveFcmTokenToServer(token, { userAgent: navigator.userAgent });
      }

      setIsSubscribed(true);
      setShowPromptBanner(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3500);
      setupForegroundListener();
    } catch (err: any) {
      console.error("Failed to subscribe FCM:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("imo_notif_prompt_dismissed_at", Date.now().toString());
    }
  };

  // Do not render prompt on admin routes
  if (pathname?.startsWith("/admin") || !isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating Prompt Banner (Opsional, Non-blocking) */}
      <AnimatePresence>
        {showPromptBanner && !isSubscribed && permission === "default" && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-[999] pointer-events-auto"
          >
            <div className="relative p-5 rounded-3xl border border-cyan-500/30 bg-slate-950/90 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.2)] overflow-hidden font-sans">
              {/* Specular sheen */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] via-transparent to-black/[0.2] pointer-events-none rounded-[inherit]" />

              <button
                onClick={handleDismiss}
                className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition z-20 cursor-pointer"
                title="Tutup (Nanti Saja)"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Bell className="w-5 h-5 text-accent-cyan animate-pulse" />
                </div>

                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-cyan">
                      Pemberitahuan Resmi
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Aktifkan Notifikasi Portal?
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Dapatkan pengingat deadline tugas kelompok & pengumuman penting IMO 2026 secara langsung.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 flex items-center justify-end space-x-2.5 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={handleDismiss}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Nanti Saja
                </button>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold text-xs hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-[0.98] transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-60"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{loading ? "Mengaktifkan..." : "Aktifkan Notifikasi"}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Sukses Aktifkan Notifikasi */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[999] pointer-events-auto"
          >
            <div className="flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-xl text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Notifikasi portal berhasil diaktifkan!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

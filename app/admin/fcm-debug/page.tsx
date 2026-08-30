"use client";

import React, { useState, useEffect } from "react";
import { Bell, ShieldCheck, RefreshCw, Send, CheckCircle2, AlertTriangle, Terminal, Monitor } from "lucide-react";
import { saveFcmTokenToServer } from "@/hooks/useFcmNotification";

export default function FcmDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [swStatus, setSwStatus] = useState<string>("Checking...");
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPermission(Notification.permission);
      addLog(`Status Izin Notifikasi Browser: ${Notification.permission}`);

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          const list = regs.map((r) => r.active?.scriptURL || "Unknown").join(", ");
          setSwStatus(list || "Tidak ada service worker aktif.");
          addLog(`Service Worker Terdaftar: ${list || "Kosong"}`);
        });
      }
    }
  }, []);

  // 1. Test Notifikasi Lokal Langsung (Bypass FCM untuk cek OS Windows)
  const testLocalNotification = async () => {
    addLog("Memicu Test Notifikasi Lokal Browser...");
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        addLog("❌ Izin notifikasi ditolak oleh browser!");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("🎉 Test Notifikasi Lokal IMO 2026", {
        body: "Jika Anda melihat banner ini, berarti Windows & Browser Anda BERHASIL menerima notifikasi!",
        icon: "/Brighton.svg",
        badge: "/Brighton.svg",
        requireInteraction: true,
        tag: "test-local",
      });
      addLog("✅ Notifikasi lokal dikirim ke OS. Cek pojok kanan bawah layar laptop Anda!");
    } catch (err: any) {
      addLog(`❌ Error notifikasi lokal: ${err.message}`);
    }
  };

  // 2. Ambil Fresh FCM Token
  const getFreshFcmToken = async () => {
    setLoading(true);
    addLog("Meminta Token FCM Baru dari Firebase...");
    try {
      // Unregister SW lama dulu jika ada konflik
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          if (!reg.active?.scriptURL.includes("firebase-messaging-sw.js")) {
            await reg.unregister();
            addLog(`Unregistered SW lama: ${reg.active?.scriptURL}`);
          }
        }
      }

      const { requestFcmToken } = await import("@/lib/firebase");
      const token = await requestFcmToken();

      if (token) {
        setFcmToken(token);
        addLog(`✅ Token FCM Berhasil Didapat: ${token.slice(0, 30)}...`);
        
        // Simpan ke Supabase
        const saved = await saveFcmTokenToServer(token, { userAgent: navigator.userAgent });
        if (saved) {
          addLog("✅ Token berhasil disimpan/diperbarui di Database Supabase!");
        } else {
          addLog("⚠️ Gagal menyimpan token ke database.");
        }
      } else {
        addLog("❌ Gagal mendapatkan token FCM. Periksa konfigurasi di console.");
      }
    } catch (err: any) {
      addLog(`❌ Error saat mengambil token: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Kirim Test Push Notif ke Token Ini via Server API
  const sendTestPush = async () => {
    if (!fcmToken) {
      addLog("⚠️ Belum ada token FCM. Klik 'Ambil Token FCM Baru' terlebih dahulu.");
      return;
    }

    setLoading(true);
    addLog("Mengirim request push FCM ke server...");
    try {
      const res = await fetch("/api/push/send-fcm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: fcmToken,
          title: "🔔 Push FCM dari Server!",
          message: "Halo! Ini notifikasi yang dikirim langsung melalui Firebase Cloud Messaging ke laptop ini.",
          url: "/admin/fcm-debug",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addLog(`✅ Server berhasil mengirim! Message ID: ${data.messageId || "OK"}`);
        addLog("👉 Periksa pojok kanan bawah layar laptop Anda atau minimize tab ini!");
      } else {
        addLog(`❌ Server gagal mengirim: ${data.error || JSON.stringify(data)}`);
      }
    } catch (err: any) {
      addLog(`❌ Error fetch API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020510] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
            <Monitor className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <span>FCM & Notification Diagnostics</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                Laptop Testing
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Halaman ini mendiagnosa koneksi notifikasi langsung di laptop Anda langkah demi langkah.
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-500 font-mono">IZIN NOTIFIKASI BROWSER</span>
            <div className="mt-1 flex items-center space-x-2">
              {permission === "granted" ? (
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" /> <span>GRANTED (Diizinkan)</span>
                </span>
              ) : permission === "denied" ? (
                <span className="text-rose-400 font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" /> <span>DENIED (Diblokir)</span>
                </span>
              ) : (
                <span className="text-amber-400 font-bold">DEFAULT (Belum diminta)</span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-500 font-mono">ACTIVE SERVICE WORKER</span>
            <p className="mt-1 text-xs font-mono text-slate-300 truncate" title={swStatus}>
              {swStatus}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-500 font-mono">FCM REGISTRATION TOKEN</span>
            <p className="mt-1 text-xs font-mono text-cyan-300 truncate" title={fcmToken || "Belum ada"}>
              {fcmToken ? `${fcmToken.slice(0, 20)}...` : "Belum di-generate"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <button
            onClick={testLocalNotification}
            className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 transition duration-200 flex flex-col items-start text-left space-y-3 cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">1. Test Notifikasi Lokal</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Uji apakah OS Windows & browser Anda bisa memunculkan popup notifikasi secara native.
              </p>
            </div>
          </button>

          {/* Step 2 */}
          <button
            onClick={getFreshFcmToken}
            disabled={loading}
            className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 transition duration-200 flex flex-col items-start text-left space-y-3 cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">2. Ambil Token FCM Baru</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Daftarkan service worker terbaru & dapatkan token FCM baru langsung dari Google.
              </p>
            </div>
          </button>

          {/* Step 3 */}
          <button
            onClick={sendTestPush}
            disabled={loading}
            className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/40 transition duration-200 flex flex-col items-start text-left space-y-3 cursor-pointer group shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-cyan-300 text-sm">3. Kirim FCM ke Laptop Ini</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Kirim pesan push melalui server ke token laptop Anda saat ini.
              </p>
            </div>
          </button>
        </div>

        {/* Live Logs Terminal */}
        <div className="bg-black/80 border border-slate-800 rounded-2xl p-5 font-mono text-xs shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-slate-400">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">Live Diagnostics Logs</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Belum ada aktivitas. Silakan klik salah satu tombol di atas.</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes("❌")
                      ? "text-rose-400"
                      : log.includes("✅")
                      ? "text-emerald-400"
                      : log.includes("⚠️")
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

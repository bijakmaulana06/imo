"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, ShieldAlert, Radio, TriangleAlert, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { saveFcmTokenToServer } from "@/hooks/useFcmNotification";



export default function MandatoryNotificationBlocker({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [isClient, setIsClient] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [securityLevel, setSecurityLevel] = useState(99.9);
  const [fakeHex, setFakeHex] = useState("0x000000");

  // Eerie countdown & hex randomizer for 403 panic mode
  useEffect(() => {
    const timer = setInterval(() => {
      setSecurityLevel((prev) => (prev > 10 ? prev - Math.random() * 1.5 : 99.9));
      setFakeHex("0x" + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0'));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Listen for manual permission changes
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'notifications' as PermissionName }).then((status) => {
          status.onchange = () => {
            setPermission(Notification.permission);
            if (Notification.permission === 'granted') {
              window.location.reload();
            }
          };
        }).catch(() => {});
      }

      // Register FCM Service Worker
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .then(() => {
          if (Notification.permission === "granted") {
            setIsSubscribed(true);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.warn("FCM Service Worker registration failed:", err);
          setLoading(false);
        });

      // ── Pasang Foreground FCM Message Listener ───────────────────
      // Jika tab website sedang dibuka, FCM mengabaikan Service Worker
      // dan mengirim pesan ke onMessage client. Kita tangani di sini
      // agar popup notifikasi tetap muncul di layar!
      if (Notification.permission === "granted") {
        import("@/lib/firebase").then(({ onForegroundMessage, requestFcmToken }) => {
          // Ambil / refresh token & pastikan tersimpan
          requestFcmToken().then((token) => {
            if (token) {
              saveFcmTokenToServer(token, { userAgent: navigator.userAgent });
            }
          });

          // Listener notifikasi saat tab aktif
          onForegroundMessage((payload) => {
            console.log("[FCM Client] Foreground message received:", payload);
            const title = payload.notification?.title || payload.data?.title || "Notifikasi IMO 2026";
            const body = payload.notification?.body || payload.data?.body || payload.data?.message || "Ada pemberitahuan baru.";
            const icon = payload.notification?.icon || "/favicon.ico";
            const url = payload.data?.url || "/info";

            if (Notification.permission === "granted") {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(title, {
                  body,
                  icon,
                  badge: "/favicon.ico",
                  tag: payload.data?.tag || "imo-foreground-notif",
                  renotify: true,
                  requireInteraction: true,
                  data: { url },
                } as NotificationOptions);
              }).catch(() => {
                new Notification(title, { body, icon, data: { url } });
              });
            }
          });
        }).catch((err) => console.warn("[FCM] Failed to setup foreground listener:", err));
      }
    } else {
      setIsSupported(false);
      setLoading(false);
    }
  }, []);

  // Canvas for Eerie Yellow/Amber Lockdown Singularity (Hazard/Panic Vibe)
  useEffect(() => {
    // Only render canvas if we are in the DENIED state (403 Panic Mode)
    if (loading || isSubscribed || !isSupported || pathname?.startsWith("/admin") || permission !== "denied") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Chaotic dust particles (Radiation/Hazard Yellow)
    const numParticles = 250;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      dist: number;
      speed: number;
      color: string;
    }> = [];

    const colors = ["#78350f", "#92400e", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#ef4444"];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 0.5,
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * (Math.max(width, height) * 0.7),
        speed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1), // Faster speed
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    let angleOffset = 0;
    let pulse = 0;

    function render() {
      if (!ctx || !canvas) return;

      // Dark Void Background
      ctx.fillStyle = "#030100"; 
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Lockdown Singularity (Aggressive Pulsating Glow)
      angleOffset -= 0.008; // Fast rotation
      pulse += 0.3; // Fast pulse for panic vibe
      const pulseFactor = Math.sin(pulse) * 25;
      
      const glitchX = (Math.random() > 0.8) ? (Math.random() - 0.5) * 40 : 0;
      const glitchY = (Math.random() > 0.8) ? (Math.random() - 0.5) * 40 : 0;

      // Outer Yellow/Amber Radiation Distortion
      const outerGlow = ctx.createRadialGradient(
        centerX + glitchX, centerY + glitchY, 40, 
        centerX + glitchX, centerY + glitchY, 450 + pulseFactor
      );
      outerGlow.addColorStop(0, "rgba(0, 0, 0, 1)");
      outerGlow.addColorStop(0.2, "rgba(217, 119, 6, 0.4)"); 
      outerGlow.addColorStop(0.5, "rgba(180, 83, 9, 0.15)");  
      outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX + glitchX, centerY + glitchY, 450 + pulseFactor, 0, Math.PI * 2);
      ctx.fill();

      // Accretion Ring Distortion
      ctx.save();
      ctx.translate(centerX + glitchX, centerY + glitchY);
      ctx.rotate(angleOffset);
      ctx.scale(1, 0.15); // Very flat elliptical tilt

      // Inner ring
      ctx.beginPath();
      ctx.arc(0, 0, 220, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.8)"; 
      ctx.lineWidth = 25;
      ctx.shadowBlur = 50;
      ctx.shadowColor = "#f59e0b";
      ctx.stroke();

      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, 280, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180, 83, 9, 0.6)"; 
      ctx.lineWidth = 15;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#b45309";
      ctx.stroke();

      ctx.restore();

      // Black Hole Void Event Horizon Center
      ctx.beginPath();
      ctx.arc(centerX + glitchX, centerY + glitchY, 85 + pulseFactor * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.shadowBlur = 60;
      ctx.shadowColor = "#000000";
      ctx.fill();

      // Event Horizon Edge Glow
      ctx.beginPath();
      ctx.arc(centerX + glitchX, centerY + glitchY, 87 + pulseFactor * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = Math.random() > 0.8 ? "rgba(255, 255, 255, 0.9)" : "rgba(251, 191, 36, 0.9)";
      ctx.lineWidth = 5;
      ctx.stroke();

      // Cosmic Dust particles (Hazard Sparks)
      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        p.angle += p.speed;

        // Spiral inward movement
        const px = centerX + Math.cos(p.angle) * p.dist;
        const py = centerY + Math.sin(p.angle) * (p.dist * 0.3); 

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Add glow to bright amber particles
        if (p.color === "#fbbf24" || p.color === "#f59e0b" || p.color === "#ef4444") {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fill();
      }

      // Add intense random hazard scanlines (CRT glitch)
      if (Math.random() > 0.5) {
        ctx.fillStyle = "rgba(245, 158, 11, 0.05)";
        ctx.fillRect(0, Math.random() * height, width, Math.random() * 30 + 10);
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, isSubscribed, isSupported, pathname, permission]);

  // Admin routes and preview/dev bypass routes bypass the blocker
  const isDevBypassed = typeof window !== "undefined" && sessionStorage.getItem("imo_lockdown_bypass") === "1";
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/preview") || isDevBypassed) {
    return <>{children}</>;
  }

  // Avoid hydration mismatch by waiting for client side
  if (!isClient || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020510]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-cyan"></div>
      </div>
    );
  }

  if (!isSupported) {
    // If browser doesn't support it, we let them in to avoid bricking on old devices like iOS <16.4
    return <>{children}</>;
  }

  // If subscribed, render the app normally
  if (isSubscribed) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    setLoading(true);
    setStatusMsg("");

    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        setStatusMsg("Izin ditolak. Silakan ikuti instruksi di layar.");
        setLoading(false);
        return;
      }

      // Ambil FCM Token dari Google Firebase
      const { requestFcmToken } = await import("@/lib/firebase");
      const fcmToken = await requestFcmToken();

      if (fcmToken) {
        await saveFcmTokenToServer(fcmToken, {
          userAgent: navigator.userAgent,
        });
        setIsSubscribed(true);
      } else {
        // Jika token belum terbuat tapi permission granted, tetap izinkan masuk
        setIsSubscribed(true);
      }
    } catch (err: any) {
      console.error("Failed to subscribe FCM:", err);
      // Jika permission sudah granted, jangan blokir user
      if (Notification.permission === "granted") {
        setIsSubscribed(true);
      } else {
        setStatusMsg("Terjadi kesalahan: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // If permission is DENIED, show the panic-inducing yellow 403 page
  // 1-page full screen strictly non-scrollable
  if (permission === "denied") {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] flex flex-col justify-between items-center bg-[#030100] text-amber-500 overflow-hidden font-mono select-none z-[99999]">
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes text-glitch-severe {
            0%, 85% { transform: translate(0) skew(0deg); filter: drop-shadow(0 0 30px rgba(245,158,11,1)); }
            87% { transform: translate(4px, -2px) skew(-15deg); filter: drop-shadow(-4px 0 #ef4444) drop-shadow(4px 0 #3b82f6); }
            89% { transform: translate(-4px, 2px) skew(15deg); filter: drop-shadow(4px 0 #ef4444) drop-shadow(-4px 0 #3b82f6); }
            91% { transform: translate(2px, 2px) skew(-5deg); filter: drop-shadow(-2px 0 #ef4444) drop-shadow(2px 0 #3b82f6); }
            93% { transform: translate(-2px, -2px) skew(5deg); filter: drop-shadow(2px 0 #ef4444) drop-shadow(-2px 0 #3b82f6); }
            95% { transform: translate(0) skew(0deg); filter: drop-shadow(0 0 30px rgba(245,158,11,1)); }
            97% { transform: translate(5px, 0) skew(-20deg); filter: drop-shadow(-5px 0 #ef4444) drop-shadow(5px 0 #3b82f6); }
            100% { transform: translate(0) skew(0deg); filter: drop-shadow(0 0 30px rgba(245,158,11,1)); }
          }
          .glitch-severe {
            animation: text-glitch-severe 4s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          @keyframes text-glitch-mild {
            0%, 90% { transform: translate(0); }
            92% { transform: translate(2px, -1px); opacity: 0.8; }
            94% { transform: translate(-2px, 1px); opacity: 1; }
            96% { transform: translate(1px, 1px); opacity: 0.9; }
            98% { transform: translate(-1px, -1px); opacity: 1; }
            100% { transform: translate(0); }
          }
          .glitch-mild {
            animation: text-glitch-mild 2.5s infinite linear;
          }
        `}} />

        {/* Background Eerie Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none block w-full h-full opacity-70" />

        {/* Top Telemetry */}
        <header className="relative z-20 w-full px-4 py-2 sm:py-3 flex justify-between items-center text-[9px] sm:text-xs tracking-widest border-b-4 border-amber-500 bg-black/90 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
          <div className="flex items-center space-x-2 text-red-500 font-black">
            <TriangleAlert className="h-4 w-4 sm:h-5 sm:w-5" />
            <motion.span className="glitch-mild" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.4 }}>HAZARD CONTAINMENT BREACH</motion.span>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6 text-amber-600 font-bold">
            <span className="hidden sm:inline glitch-mild">ERR_CODE: {fakeHex}</span>
            <span className="text-amber-500 glitch-mild">FAIL: {securityLevel.toFixed(3)}%</span>
          </div>
        </header>

        {/* Center Panic Content - Strictly constrained to avoid scroll */}
        <main className="relative z-20 flex-1 w-full max-w-lg px-4 flex flex-col items-center justify-center text-center">
          
          <motion.div
            animate={{ x: [-4, 4, -3, 3, 0], y: [-2, 2, -1, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-none border-4 border-amber-500 bg-black flex items-center justify-center mb-2 shadow-[0_0_60px_rgba(245,158,11,0.9)] relative"
          >
            <TriangleAlert className="h-8 w-8 sm:h-12 sm:w-12 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,1)] glitch-severe" />
          </motion.div>

          <h1 
            className="glitch-severe font-display font-black text-6xl sm:text-8xl tracking-tighter text-amber-500 mb-1 uppercase leading-none"
          >
            403
          </h1>

          <h2 className="glitch-severe font-display font-extrabold text-sm sm:text-xl tracking-[0.2em] text-black bg-amber-500 px-4 py-1 mb-4 uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            AKSES DITOLAK
          </h2>

          <div className="glitch-mild text-[10px] sm:text-xs text-amber-200/90 leading-tight font-sans max-w-sm mb-4 p-3 sm:p-4 border border-amber-500 bg-black/80 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-justify backdrop-blur-md">
            Sensor telemetri mendeteksi pemblokiran notifikasi manual. <strong>Simulasi terhenti otomatis.</strong> Segera lakukan intervensi sistem melalui pengaturan situs pada antarmuka browser Anda.
          </div>

          <div className="glitch-mild w-full max-w-sm bg-black/95 border-2 border-amber-500 p-3 sm:p-4 text-[10px] sm:text-xs text-left font-mono leading-tight shadow-[0_0_30px_rgba(245,158,11,0.5)] relative">
            <div className="text-amber-500 font-bold mb-2 flex items-center space-x-2 border-b border-amber-500/30 pb-2">
              <span className="w-2 h-2 bg-red-500 animate-ping rounded-full"></span>
              <span className="tracking-widest">TINDAKAN DARURAT</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-amber-100">
              <li>Buka Pengaturan Situs (Ikon gembok di URL bar).</li>
              <li>Temukan opsi <span className="font-bold text-amber-400">Notifications</span> (Notifikasi).</li>
              <li>Ubah status izin menjadi <span className="font-bold text-amber-400">Allow</span> (Izinkan).</li>
            </ol>
            <div className="mt-3 pt-2 border-t border-amber-500/30 text-[9px] sm:text-[10px] text-amber-500 animate-pulse">
              Halaman ini akan otomatis mereset dan mencabut lockdown.
            </div>
          </div>

        </main>

        {/* Bottom Footer */}
        <footer className="relative z-20 w-full p-2 sm:p-3 text-center text-[9px] sm:text-[10px] text-amber-600 tracking-widest uppercase bg-black/90 border-t-4 border-amber-500 shadow-[0_-4px_20px_rgba(245,158,11,0.3)]">
          <motion.div className="glitch-mild" animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            FATAL ERROR: NOTIFICATION_DENIED // RECOVERY INITIATED // PLEASE COMPLY
          </motion.div>
        </footer>

      </div>
    );
  }

  // Initial State: Polite but firm prompt (Clean cosmic UI, not scary yet)
  return (
    <div className="fixed inset-0 z-[9999] bg-[#020510] flex items-center justify-center p-6 text-center font-sans">
      
      {/* Calm Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-md w-full bg-slate-900/40 backdrop-blur-2xl border border-slate-700/50 rounded-[2rem] p-10 shadow-2xl flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <Bell className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-display font-bold text-white mb-4">
          Selamat Datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">IMO 2026</span>
        </h1>
        
        <p className="text-slate-300 text-sm leading-relaxed mb-8">
          Untuk memastikan Anda tidak tertinggal informasi penting, tugas baru, dan pengumuman mendadak, <strong className="text-cyan-400">Anda wajib mengaktifkan Notifikasi</strong> untuk melanjutkan ke dalam portal.
        </p>

        {statusMsg && (
          <div className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs text-left mb-6 font-mono leading-relaxed">
            {statusMsg}
          </div>
        )}

        <div className="w-full flex flex-col space-y-4">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full relative overflow-hidden group py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm tracking-wide transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="relative flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? "Menyiapkan..." : "Izinkan Notifikasi"}</span>
            </span>
          </button>
          
          <p className="text-xs text-slate-500">
            Klik <strong className="text-slate-300">Allow / Izinkan</strong> pada pop-up browser yang muncul di sudut atas layar.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

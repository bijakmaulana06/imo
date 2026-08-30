/**
 * hooks/useFcmNotification.ts
 * Reusable React Hook untuk Firebase Cloud Messaging (FCM)
 *
 * Mengurus:
 * - Pengambilan FCM token dengan request permission
 * - Listener notifikasi foreground (browser toast)
 * - Penyimpanan token ke backend API
 * - SSR-safe
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MessagePayload } from "firebase/messaging";

export interface FcmNotificationState {
  /** FCM registration token untuk perangkat ini */
  fcmToken: string | null;
  /** Status izin notifikasi browser */
  permission: NotificationPermission | null;
  /** Sedang dalam proses request token */
  isLoading: boolean;
  /** Pesan error jika ada */
  error: string | null;
  /** Payload pesan foreground terakhir yang diterima */
  lastForegroundMessage: MessagePayload | null;
  /** Fungsi untuk meminta izin & mendapatkan FCM token */
  requestPermission: () => Promise<string | null>;
}

interface UseFcmNotificationOptions {
  /**
   * Callback ketika FCM token berhasil didapat.
   * Gunakan ini untuk menyimpan token ke database Anda.
   */
  onToken?: (token: string) => void;
  /**
   * Callback ketika pesan foreground diterima.
   * Default: menampilkan browser Notification API.
   */
  onForegroundMessage?: (payload: MessagePayload) => void;
  /**
   * Apakah otomatis request permission saat hook mount?
   * Default: false (manual trigger via requestPermission())
   */
  autoRequest?: boolean;
}

export function useFcmNotification(
  options: UseFcmNotificationOptions = {}
): FcmNotificationState {
  const { onToken, onForegroundMessage: onFgMessage, autoRequest = false } = options;

  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastForegroundMessage, setLastForegroundMessage] =
    useState<MessagePayload | null>(null);

  // Ref untuk menyimpan fungsi unsubscribe foreground listener
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ─── Init: baca permission saat ini ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  // ─── Cleanup foreground listener saat unmount ───────────────────────────────
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // ─── Request Permission & Ambil FCM Token ───────────────────────────────────
  const requestPermission = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Minta izin notifikasi browser
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== "granted") {
        setError("Izin notifikasi tidak diberikan.");
        setIsLoading(false);
        return null;
      }

      // 2. Import & jalankan FCM logic (dynamic import = SSR-safe)
      const { requestFcmToken, onForegroundMessage } = await import(
        "@/lib/firebase"
      );

      // 3. Ambil FCM token
      const token = await requestFcmToken();

      if (!token) {
        setError("Gagal mendapatkan FCM token. Pastikan API Key & App ID sudah diisi.");
        setIsLoading(false);
        return null;
      }

      setFcmToken(token);

      // 4. Panggil callback onToken (untuk simpan ke DB)
      if (onToken) {
        onToken(token);
      }

      // 5. Setup foreground message listener
      // Bersihkan listener lama jika ada
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribe = await onForegroundMessage((payload) => {
        console.log("[FCM] Foreground message diterima:", payload);
        setLastForegroundMessage(payload);

        if (onFgMessage) {
          // Custom handler dari caller
          onFgMessage(payload);
        } else {
          // Default: tampilkan Notification API (browser toast)
          const title = payload.notification?.title || "Notifikasi IMO 2026";
          const body =
            payload.notification?.body || "Ada pesan baru dari portal IMO 2026.";
          const icon = payload.notification?.icon || "/favicon.ico";

          if (Notification.permission === "granted") {
            navigator.serviceWorker.ready.then((sw) => {
              sw.showNotification(title, {
                body,
                icon,
                badge: "/favicon.ico",
                tag: "imo-fcm-foreground",
                data: payload.data,
              });
            });
          }
        }
      });

      if (unsubscribe) {
        unsubscribeRef.current = unsubscribe;
      }

      return token;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan FCM.";
      console.error("[FCM] requestPermission error:", err);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onToken, onFgMessage]);

  // ─── Auto-request jika diaktifkan ──────────────────────────────────────────
  useEffect(() => {
    if (autoRequest && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        // Langsung ambil token tanpa re-request permission
        requestPermission();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]);

  return {
    fcmToken,
    permission,
    isLoading,
    error,
    lastForegroundMessage,
    requestPermission,
  };
}

// ─── Utility: Simpan FCM Token ke Backend ────────────────────────────────────
/**
 * Mengirim FCM token ke API endpoint untuk disimpan ke database.
 * Panggil ini dari callback onToken pada useFcmNotification.
 */
export async function saveFcmTokenToServer(
  token: string,
  metadata?: Record<string, string>
): Promise<boolean> {
  try {
    const res = await fetch("/api/push/fcm-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...metadata }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("[FCM] Gagal menyimpan token:", data);
      return false;
    }

    console.log("[FCM] Token berhasil disimpan ke server.");
    return true;
  } catch (err) {
    console.error("[FCM] saveFcmTokenToServer error:", err);
    return false;
  }
}

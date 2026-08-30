/**
 * lib/firebase.ts
 * Firebase Client SDK — Inisialisasi, FCM Token Request, dan Foreground Message Listener
 * SSR-safe: semua Firebase Messaging logic hanya berjalan di browser
 */

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── Singleton Firebase App ───────────────────────────────────────────────────
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// ─── Request FCM Token ────────────────────────────────────────────────────────
/**
 * Meminta izin notifikasi browser dan mengambil FCM registration token.
 * Mendaftarkan firebase-messaging-sw.js sebagai service worker untuk FCM.
 *
 * @returns FCM token string, atau null jika gagal/ditolak
 */
export async function requestFcmToken(): Promise<string | null> {
  // Guard: hanya jalan di browser
  if (typeof window === "undefined") return null;

  try {
    // Dynamic import agar tidak di-bundle saat SSR
    const { getMessaging, getToken, isSupported } = await import(
      "firebase/messaging"
    );

    // Cek dukungan browser (Safari iOS < 16.4, dll tidak support)
    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Browser tidak mendukung Firebase Messaging.");
      return null;
    }

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // Daftarkan service worker FCM
    const swRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" }
    );

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY belum dikonfigurasi.");
      return null;
    }

    // Ambil FCM token
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("[FCM] Token berhasil didapat:", token);
      return token;
    } else {
      console.warn("[FCM] Tidak ada token — pastikan izin notifikasi granted.");
      return null;
    }
  } catch (error) {
    console.error("[FCM] requestFcmToken error:", error);
    return null;
  }
}

// ─── Foreground Message Listener ─────────────────────────────────────────────
/**
 * Listen pesan FCM saat tab/halaman aktif (foreground).
 * Firebase tidak otomatis menampilkan notifikasi saat foreground,
 * sehingga harus di-handle manual di sini.
 *
 * @param callback - Fungsi yang dipanggil ketika pesan diterima
 * @returns Fungsi unsubscribe
 */
export async function onForegroundMessage(
  callback: (payload: import("firebase/messaging").MessagePayload) => void
): Promise<(() => void) | null> {
  if (typeof window === "undefined") return null;

  try {
    const { getMessaging, onMessage, isSupported } = await import(
      "firebase/messaging"
    );

    const supported = await isSupported();
    if (!supported) return null;

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, callback);
    return unsubscribe;
  } catch (error) {
    console.error("[FCM] onForegroundMessage error:", error);
    return null;
  }
}

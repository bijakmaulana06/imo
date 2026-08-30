// public/firebase-messaging-sw.js
// ─────────────────────────────────────────────────────────────────────────────
// 100% PURE FIREBASE CLOUD MESSAGING (FCM) SERVICE WORKER
// ─────────────────────────────────────────────────────────────────────────────

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC4QMoF4gIXCq0NRT32a8f-rEr_KkmiFYw",
  authDomain: "imo-info.firebaseapp.com",
  projectId: "imo-info",
  storageBucket: "imo-info.firebasestorage.app",
  messagingSenderId: "1061088435535",
  appId: "1:1061088435535:web:a748eff7e939f036ba793a",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

// ─── FCM Background Message Handler ──────────────────────────────────────────
messaging.onBackgroundMessage(function (payload) {
  console.log("[FCM-SW] Background Push Received:", payload);

  const title = payload.notification?.title || payload.data?.title || "Notifikasi IMO 2026";
  const options = {
    body: payload.notification?.body || payload.data?.body || payload.data?.message || "Ada pengumuman baru dari portal IMO 2026.",
    icon: "/Brighton.svg",
    badge: "/Brighton.svg",
    tag: payload.data?.tag || "imo-fcm-notification",
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || "/info",
    },
  };

  return self.registration.showNotification(title, options);
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/info";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

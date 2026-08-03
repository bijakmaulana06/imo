// Service Worker untuk Push Notification IMO 2026

self.addEventListener('push', function (event) {
  let title = 'Notifikasi IMO 2026';
  let options = {
    body: 'Pemberitahuan baru dari sistem IMO 2026.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: '/info' },
    tag: 'imo-notification',
    renotify: true,
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      options.icon = data.icon || options.icon;
      options.badge = data.badge || options.badge;
      if (data.url) options.data.url = data.url;
      if (data.tag) options.tag = data.tag;
    } catch (err) {
      console.error('Error parsing push data:', err);
      // Fallback text will be used
      options.body = event.data.text() || options.body;
    }
  }

  const notificationPromise = self.registration.showNotification(title, options);
  event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/info';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client && client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

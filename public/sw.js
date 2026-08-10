// Service Worker for SoalCar Web Push Notifications
const CACHE_NAME = 'soalcar-v1';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push Notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);

  let data = {
    title: 'اعلان جدید سوالکار',
    body: 'شما یک پیام جدید در سوالکار دارید.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/',
    tag: 'soalcar-notification',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type || 'system',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'مشاهده' },
      { action: 'close', title: 'بستن' }
    ],
    tag: data.tag || 'soalcar-general'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle direct client postMessage triggers for local testing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, notificationType } = event.data;
    self.registration.showNotification(title || 'سوالکار', {
      body: body || 'اعلان جدید دریافت شد',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: { url: url || '/', type: notificationType || 'system' },
      tag: 'soalcar-local'
    });
  }
});

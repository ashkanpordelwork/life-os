// Life OS service worker: shows push reminders and opens the app when tapped.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'Life OS', body: 'Your patches are waiting.', url: self.registration.scope + '#/today' };
  try { data = { ...data, ...event.data.json() }; } catch { /* plain text or empty */ }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: self.registration.scope + 'icon-192.png',
      badge: self.registration.scope + 'icon-192.png',
      data: { url: data.url },
      // Each kind has its own tag (daily, patch-SL01, high-five), so one doesn't replace another.
      tag: data.tag || 'daily-reminder',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) { c.navigate(url); return c.focus(); }
      return self.clients.openWindow(url);
    }),
  );
});

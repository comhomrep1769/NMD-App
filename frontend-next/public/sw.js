/* NMD Pressure Washing service worker.
 *
 * Two jobs:
 *   1. Receive web push and show the notification. Push is delivered to a
 *      service worker, so without this file no push can ever arrive.
 *   2. Give the app an offline fallback page instead of the browser's
 *      dinosaur when a crew member loses signal in a van.
 *
 * Deliberately conservative about caching: this is a live CRUD app, so
 * stale job data is worse than a slow load. Only the offline page and
 * icons are precached. API calls are never cached.
 */

const VERSION = 'nmd-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/badge-96.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('nmd-') && !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only page navigations get the offline fallback. Everything else —
  // API calls, images, scripts — passes straight through to the network
  // so the app never serves stale business data.
  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).catch(() =>
      caches.match(OFFLINE_URL).then((cached) => cached || Response.error())
    )
  );
});

self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: 'NMD Pressure Washing', body: event.data.text() };
    }
  }

  const title = data.title || 'NMD Pressure Washing';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || undefined,
    // A replacing notification should not buzz the phone again.
    renotify: Boolean(data.tag && data.renotify),
    requireInteraction: Boolean(data.requireInteraction),
    timestamp: Date.now(),
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Reuse an already-open NMD tab rather than piling up new ones.
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) {
              return client.focus().then(() => client.navigate(target));
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
        return undefined;
      })
  );
});

// Fired when the browser rotates a subscription. The page re-subscribes on
// next load; this keeps the old endpoint from lingering server-side.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' }));
    })
  );
});
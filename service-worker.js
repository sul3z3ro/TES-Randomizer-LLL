
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate worker immediately
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Become available to all pages
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

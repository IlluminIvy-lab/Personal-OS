// Service Worker for Personal OS Hub PWA
const CACHE_NAME = 'personal-os-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle API routes and live Google calls
  if (event.request.url.includes('/api/') || event.request.url.includes('googleapis.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

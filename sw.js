// sw.js
const CACHE_NAME = 'gabaofind-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/app.js',
  '/style.css',
  '/firebase-config.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Firebase/API calls (handled by SDK)
  if (request.url.includes('firestore.googleapis.com')) return;
  
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request)) // Fallback to cache
  );
});

// Optional: Background sync for offline form submissions
// self.addEventListener('sync', (event) => { ... });
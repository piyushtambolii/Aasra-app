// service-worker.js (replace whole file)
const CACHE_NAME = "aasra-app-cache-v2";
const FILES_TO_CACHE = [
  "/", "/index.html", "/manifest.json", "/script.js"
];

// Install - attempt to cache files, skip missing ones
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const file of FILES_TO_CACHE) {
      try {
        const res = await fetch(file, { cache: "no-store" });
        if (res && res.ok) {
          await cache.put(file, res.clone());
        } else {
          console.warn(`Service Worker: skipped caching ${file} (${res ? res.status : 'no response'})`);
        }
      } catch (err) {
        console.warn(`Service Worker: fetch failed for ${file}: ${err.message}`);
      }
    }
    self.skipWaiting();
  })());
});

// Activate - clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// Fetch - try network, fallback to cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (err) {
      const cached = await caches.match(event.request);
      return cached || Response.error();
    }
  })());
});

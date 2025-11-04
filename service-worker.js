// service-worker.js
// =============================================================
// Aasra App Service Worker
// Handles caching, offline fallback, and push notifications.
// =============================================================

const CACHE_NAME = "aasra-cache-v3";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/script.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// =============================================================
// INSTALL — cache essential files
// =============================================================
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const file of FILES_TO_CACHE) {
        try {
          const res = await fetch(file, { cache: "no-store" });
          if (res.ok) {
            await cache.put(file, res.clone());
            console.log(`[SW] Cached: ${file}`);
          } else {
            console.warn(`[SW] Skipped caching ${file}: ${res.status}`);
          }
        } catch (err) {
          console.warn(`[SW] Failed to fetch ${file}:`, err.message);
        }
      }
      self.skipWaiting();
    })()
  );
});

// =============================================================
// ACTIVATE — cleanup old caches
// =============================================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// =============================================================
// FETCH — network-first strategy with cache fallback
// =============================================================
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return; // only cache GET requests

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(event.request);
        if (cached) {
          console.log("[SW] Serving from cache:", event.request.url);
          return cached;
        }
        return new Response("Offline mode: resource not found", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});

// =============================================================
// PUSH — handle push notifications from backend
// =============================================================
self.addEventListener("push", (event) => {
  console.log("[SW] Push received.");

  let data = {
    title: "Aasra Alert",
    body: "You have a new notification.",
    actions: [],
  };

  try {
    if (event.data) data = event.data.json();
  } catch (err) {
    console.warn("[SW] Push data parse failed:", err);
  }

  const title = data.title || "Aasra Alert";
  const options = {
    body: data.body || "You have a new message.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "aasra-notification",
    renotify: true,
    requireInteraction: !!data.requireInteraction,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// =============================================================
// NOTIFICATION CLICK — handle user interaction
// =============================================================
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event.notification.tag, event.action);
  const tag = event.notification.tag;
  event.notification.close();

  // Medication notification actions
  if (tag && tag.startsWith("med-")) {
    const medId = parseInt(tag.replace("med-", ""));

    if (event.action === "taken") {
      // Inform all open clients
      event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            client.postMessage({ type: "MARK_MED_TAKEN", medId });
          }
          if (clientList.length === 0 && clients.openWindow) {
            return clients.openWindow(`/?action=markMedTaken&medId=${medId}`);
          }
        })
      );
      return;
    }

    if (event.action === "snooze") {
      console.log("[SW] Snooze clicked (10 min)");
      // Real snooze scheduling would require a backend or periodic background sync
      return;
    }
  }

  // Default: focus existing app tab or open new
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});

// =============================================================
// MESSAGE — receive messages from pages (optional debugging)
// =============================================================
self.addEventListener("message", (event) => {
  console.log("[SW] Message received from page:", event.data);
  // future: handle "forceRefreshCache", "clearCache", etc.
});

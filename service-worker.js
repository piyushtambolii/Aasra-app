const CACHE_NAME = "aasra-app-cache-v2";
const FILES_TO_CACHE = [
  "/", // homepage
  "/index.html",
  "/manifest.json",
  "/script.js"
];

// On install
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const file of FILES_TO_CACHE) {
        try {
          const response = await fetch(file, { cache: "no-store" });
          if (response.ok) {
            await cache.put(file, response.clone());
          } else {
            console.warn(`⚠️ Skipped caching ${file} (${response.status})`);
          }
        } catch (err) {
          console.warn(`⚠️ Could not fetch ${file}:`, err.message);
        }
      }
      self.skipWaiting();
    })()
  );
});

// On activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
      await self.clients.claim();
    })()
  );
});

// On fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (event.request.method === "GET" && networkResponse.ok) {
          const clone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, clone);
        }
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      }
    })()
  );
});

// --- FIX: ADDED PUSH EVENT LISTENER ---
// This code listens for a push notification from the server
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  
  // Default title and body if parsing fails
  let data = { title: "Aasra Alert", body: "You have a new notification." };
  
  try {
    // Try to parse the notification data
    data = event.data.json();
  } catch (e) {
    console.error("[Service Worker] Push event data parse failed:", e);
  }

  const title = data.title || "Aasra Alert";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "/icons/icon-192.png", // Icon from your manifest
    badge: "/icons/icon-192.png", // Icon for the notification tray
    vibrate: [200, 100, 200], // Vibrate pattern
    tag: "aasra-notification", // Groups notifications
    renotify: true, // Re-notify if a new notification with the same tag arrives
  };

  // Show the notification
  event.waitUntil(self.registration.showNotification(title, options));
});

// Optional: Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click Received.");
  
  event.notification.close(); // Close the notification

  // Focus the client (browser tab) if it's open, otherwise open a new one
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

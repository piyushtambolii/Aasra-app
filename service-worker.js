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

// Push event listener for server-sent notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  
  // Default title and body if parsing fails
  let data = { title: "Aasra Alert", body: "You have a new notification.", actions: [] };
  
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
    tag: data.tag || "aasra-notification", // Groups notifications
    renotify: true, // Re-notify if a new notification with the same tag arrives
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [], // Action buttons (e.g., Mark as Taken, Snooze)
    data: data.data || {} // Pass through custom data
  };

  // Show the notification
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click and actions
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click Received.");
  console.log("Action:", event.action);
  console.log("Tag:", event.notification.tag);
  
  event.notification.close(); // Close the notification

  // Handle medication notification actions
  if (event.notification.tag && event.notification.tag.startsWith("med-")) {
    const medId = parseInt(event.notification.tag.replace("med-", ""));
    
    if (event.action === "taken") {
      // Mark medication as taken
      event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
          // Send message to all clients to mark medication as taken
          for (const client of clientList) {
            client.postMessage({
              type: "MARK_MED_TAKEN",
              medId: medId
            });
          }
          
          // If no clients are open, open the app
          if (clientList.length === 0 && clients.openWindow) {
            return clients.openWindow("/?action=markMedTaken&medId=" + medId);
          }
        })
      );
      return;
    }
    
    if (event.action === "snooze") {
      // Snooze for 10 minutes
      console.log("Snoozing medication reminder for 10 minutes");
      // In a real app, you would schedule a new notification
      return;
    }
  }

  // Default behavior: Focus the app or open it
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// SafetyHub Service Worker — Push Notifications + Offline Support

const CACHE_NAME = "safetyhub-v1";
const OFFLINE_URLS = ["/", "/alerts", "/settings"];

// Install — cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push notification received
self.addEventListener("push", (event) => {
  let data = {
    title: "SafetyHub Alert",
    body: "New safety alert detected",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "safetyhub-alert",
    data: { url: "/alerts" },
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error("Failed to parse push data:", e);
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    tag: data.tag,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: "view", title: "View Dashboard" },
      { action: "dismiss", title: "Dismiss" },
    ],
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  if (event.action === "dismiss") return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return self.clients.openWindow(url);
    })
  );
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

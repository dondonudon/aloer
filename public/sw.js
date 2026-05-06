// Aloer service worker.
// Lightweight: handles push delivery + notification clicks. No precaching —
// add a Workbox setup here if/when you need offline support.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No-op fetch handler. Some Chrome versions on Android refuse to fire
// `beforeinstallprompt` (i.e. mark the site installable) unless the active
// service worker has a fetch handler. We don't cache anything — letting the
// event fall through to the network — but the listener has to exist.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Aloer", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Aloer";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.png",
    badge: data.badge || "/icon.png",
    tag: data.tag,
    data: { url: data.url || "/dashboard", ...(data.data || {}) },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin && "focus" in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

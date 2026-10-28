// RomiOrg service worker:
// - keeps a copy of the app so it opens without internet
// - shows Web Push reminders sent by the server (even with the app closed)

const CACHE = "romiorg-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add("/"))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// On the very first visit the page loads before this worker controls it, so the
// page sends us the files it already loaded and we cache them here.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "romiorg:cache" || !Array.isArray(data.urls)) return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(
        data.urls
          .filter((u) => typeof u === "string" && new URL(u, self.location.origin).origin === self.location.origin)
          .map((u) => cache.match(u).then((hit) => hit || cache.add(u))),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Pages: network first so updates arrive; the cached app when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/").then((hit) => hit || Response.error())),
    );
    return;
  }

  // Build files have unique names, so a cached copy is always right.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Icons, manifest, etc.: answer from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => hit || Response.error());
      return hit || network;
    }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "RomiOrg", {
      body: data.body || "Tenés algo pendiente",
      tag: data.tag,
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/96",
      data: { url: data.url || "/", reminder: data.reminder },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url = "/", reminder } = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          // App already open: let it play the in-app animation for this reminder.
          if (reminder) client.postMessage({ type: "romiorg:reminder", reminder });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

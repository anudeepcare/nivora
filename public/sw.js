/* AURYN: network-first navigation, no account/API/market-response caching. */
const OFFLINE_CACHE = "auryn-offline-v9";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(["/offline.html", "/icon.svg"])),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("auryn-offline-") && key !== OFFLINE_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;
  if (url.pathname === "/icon.svg" && !url.search) {
    event.respondWith(
      caches
        .match("/icon.svg", { cacheName: OFFLINE_CACHE })
        .then((cached) => cached || fetch(event.request)),
    );
    return;
  }
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      async () =>
        (await caches.match("/offline.html", { cacheName: OFFLINE_CACHE })) ||
        new Response("You are offline. Reconnect to load AURYN.", {
          headers: { "Content-Type": "text/plain" },
        }),
    ),
  );
});

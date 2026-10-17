/* AURYN: network-first navigation, no account/API/market-response caching. */
const OFFLINE_CACHE = "auryn-offline-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(["/offline.html", "/icon.svg"]))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate")
    return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/"))
    return;
  event.respondWith(
    fetch(event.request).catch(
      async () =>
        (await caches.match("/offline.html")) ||
        new Response("You are offline. Reconnect to load AURYN.", {
          headers: { "Content-Type": "text/plain" },
        }),
    ),
  );
});

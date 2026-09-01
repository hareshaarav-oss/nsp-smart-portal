const CACHE = "nsp-static-v1";
const PRECACHE = [
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-180.png",
  "/images/nss-logo.png",
  "/images/college-logo.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (!PRECACHE.includes(url.pathname)) return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request)),
  );
});

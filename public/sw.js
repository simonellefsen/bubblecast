/* Bubblecast offline app shell
 * - Precache offline fallback + icons
 * - Cache-first for /_next/static (hashed assets)
 * - Network-first for navigations; fall back to cache then /offline
 * - Never cache /api/*
 */
const VERSION = "bubblecast-shell-v2";
const PRECACHE = `${VERSION}-precache`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE_URLS = [
  "/offline",
  "/favicon.svg",
  "/manifest.webmanifest",
];

const SHELL_PATHS = [
  "/",
  "/play",
  "/journal",
  "/cast",
  "/settings",
  "/offline",
  "/play/mission/cafe-breakfast",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("bubblecast-shell-") && !k.startsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webmanifest")
  );
}

function isNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isApi(url)) return; // always network for AI/sync APIs

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isNavigation(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Same-origin GET (RSC/data, etc.): network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return caches.match("/offline");
  }
}

async function networkFirstNavigation(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, res.clone());
      // Also stash under pathname for softer matches
      const url = new URL(request.url);
      if (SHELL_PATHS.includes(url.pathname)) {
        cache.put(url.pathname, res.clone());
      }
    }
    return res;
  } catch {
    const cached =
      (await caches.match(request)) ||
      (await caches.match(new URL(request.url).pathname)) ||
      (await caches.match("/offline"));
    return (
      cached ||
      new Response("Offline", {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

async function networkWithCacheFallback(request) {
  try {
    const res = await fetch(request);
    if (res.ok && res.type === "basic") {
      const cache = await caches.open(RUNTIME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error("network failed");
  }
}

// Optional: client can postMessage { type: 'WARM_SHELL' }
self.addEventListener("message", (event) => {
  if (event.data?.type === "WARM_SHELL") {
    event.waitUntil(warmShell());
  }
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function warmShell() {
  const cache = await caches.open(RUNTIME);
  await Promise.all(
    SHELL_PATHS.map((path) =>
      fetch(path)
        .then((res) => {
          if (res.ok) return cache.put(path, res);
        })
        .catch(() => undefined),
    ),
  );
}

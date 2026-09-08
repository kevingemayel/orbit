/* ===========================================================================
 * Orbit service worker.
 *
 * Purpose: a till and a kitchen screen must keep working when the connection
 * drops, which in Lebanon is not an edge case. This caches the app shell so
 * Orbit LOADS with no network at all. Keeping the data usable offline is the
 * outbox's job, in app.js; this only guarantees there is an app to run.
 *
 * Strategy per resource:
 *   shell (html/css/js)  network first, fall back to cache. A deploy is picked
 *                        up immediately when online, and the last known-good
 *                        copy is used when not.
 *   fonts / cdn          cache first. They change rarely and are big.
 *   supabase / api       never touched. Data goes through the outbox, and a
 *                        stale cached API response would be worse than an
 *                        honest failure.
 * ======================================================================== */
var VERSION = "orbit-v1";
var SHELL = [
  "/", "/index.html", "/css/app.css", "/js/app.js", "/config.js",
  "/portal.html", "/approve.html"
];

self.addEventListener("install", function (e) {
  // Pre-cache what we can; a missing optional file must not fail the install.
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () { });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isShell(url) {
  return url.origin === self.location.origin &&
    !/\/api\//.test(url.pathname) &&
    !/\/functions\//.test(url.pathname);
}
function isStatic(url) {
  return /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host);
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;                 // writes are the outbox's job
  var url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (/supabase\.co/.test(url.host)) return;        // never cache data

  if (isStatic(url)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
          return res;
        }).catch(function () { return hit; });
      })
    );
    return;
  }

  if (!isShell(url)) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match("/index.html") || Response.error();
      });
    })
  );
});

// The app asks for a fresh shell after a deploy without a hard reload.
self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});

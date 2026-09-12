// Orbit's service worker. Two jobs, deliberately small:
//   1. Let the phone install Orbit as an app (a manifest needs a worker).
//   2. Open with no signal: the shell (page, script, stylesheet, config, the
//      one library) is kept in a cache and served when the network fails.
// The network wins whenever it is there, so nobody ever runs a stale build.
// Nothing from Supabase is ever cached: data, auth and files always go live.
var CACHE = "orbit-shell-v1";
var SHELL = ["/", "/index.html", "/css/app.css", "/js/app.js", "/config.js", "/manifest.json", "/portal.html", "/approve.html", "/icons/orbit-192.png", "/icons/orbit-512.png"];
var LIB_HOSTS = ["cdn.jsdelivr.net", "js.hcaptcha.com", "fonts.googleapis.com", "fonts.gstatic.com"];

function key(req) {
  // app.js and app.css carry a cache-buster (?t=...) on every load; the cache
  // keeps one copy per path, not one per second
  var u = new URL(req.url); u.searchParams.delete("t");
  return new Request(u.toString(), { mode: "cors", credentials: "omit" });
}

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () { }); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url;
  try { url = new URL(req.url); } catch (x) { return; }
  var mine = url.origin === self.location.origin;
  if (mine && url.pathname.indexOf("/api/") === 0) return;          // the edge functions are live only
  if (!mine && LIB_HOSTS.indexOf(url.hostname) < 0) return;          // Supabase and everything else: never touched
  e.respondWith(fetch(req).then(function (res) {
    if (res && (res.ok || res.type === "opaque")) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(mine ? key(req) : req, copy); }).catch(function () { });
    }
    return res;
  }).catch(function () {
    return caches.match(mine ? key(req) : req, { ignoreSearch: mine }).then(function (hit) {
      if (hit) return hit;
      if (req.mode === "navigate") return caches.match("/index.html");
      return new Response("", { status: 504, statusText: "offline" });
    });
  }));
});

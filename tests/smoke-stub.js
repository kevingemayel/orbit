/* Orbit screen smoke test: the fake backend and the error recorder.
 *
 * Loaded by tests/smoke-frame.html BEFORE js/app.js. It stands in for the
 * Supabase client, answers every other network call with a local fake, and
 * records every exception, unhandled promise rejection and console.error into
 * window.__smoke, which tests/smoke.html reads.
 *
 * Nothing here talks to a database or to any server other than this one.
 * ES5 on purpose, like the app. */
(function () {
  "use strict";
  var W = window;
  var SMOKE = W.__smoke = { errors: [], activity: 0, blocked: [], missing: [] };

  // ---- what went wrong ----------------------------------------------------
  function text(v) {
    if (v instanceof Error) return v.message;
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function record(kind, message, stack) {
    SMOKE.errors.push({ kind: kind, message: String(message || "(no message)"), stack: String(stack || ""), at: Date.now() });
  }
  W.addEventListener("error", function (e) {
    var t = e.target;
    // an image or script that did not load is a missing file, not a crash
    if (t && t !== W && t.nodeType === 1) { SMOKE.missing.push(t.src || t.href || t.tagName); return; }
    record("exception", e.message || (e.error && e.error.message), e.error && e.error.stack);
  }, true);
  W.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    record("unhandled rejection", r && r.message ? r.message : text(r), r && r.stack);
  });
  var realError = console.error;
  console.error = function () {
    var args = [].slice.call(arguments), err = args.filter(function (a) { return a instanceof Error; })[0];
    var here = String((new Error()).stack || "").split("\n").slice(2).join("\n");
    record("console.error", args.map(text).join(" "), err && err.stack ? err.stack : here);
    return realError.apply(console, arguments);
  };
  // the harness waits until nothing has changed for a moment before moving on
  new MutationObserver(function () { SMOKE.activity++; }).observe(document, { childList: true, subtree: true, characterData: true });

  // ---- nothing may block the run or leave this page ------------------------
  W.alert = function () { };
  W.confirm = function () { return true; };
  W.prompt = function (m, d) { return d == null ? "" : String(d); };
  W.print = function () { };
  W.open = function () {
    // print previews write into the window they open; give them a detached document
    var doc = document.implementation.createHTMLDocument("print");
    return { document: doc, print: function () { }, close: function () { }, focus: function () { }, addEventListener: function () { }, closed: false, location: { href: "" } };
  };
  var realFetch = W.fetch ? W.fetch.bind(W) : null;
  W.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || String(input), u = null;
    try { u = new URL(url, document.baseURI); } catch (e) { }
    // files on this server load for real; everything else gets an empty JSON answer
    if (realFetch && u && u.origin === location.origin && u.pathname.indexOf("/__supabase__") !== 0) return realFetch(input, init);
    SMOKE.blocked.push(String(url).slice(0, 160));
    return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  try { navigator.sendBeacon = function (url) { SMOKE.blocked.push(String(url)); return true; }; } catch (e) { }
  try {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition = function (okFn, noFn) { if (noFn) Promise.resolve().then(function () { noFn({ code: 1, message: "smoke test: no location" }); }); };
      navigator.geolocation.watchPosition = function () { return 0; };
    }
  } catch (e) { }
  try { if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = function () { return Promise.reject(new DOMException("smoke test: no camera", "NotAllowedError")); }; } catch (e) { }
  try { if (W.Notification) W.Notification.requestPermission = function () { return Promise.resolve("denied"); }; } catch (e) { }
  try { localStorage.setItem("orbit_welcomed", "1"); localStorage.removeItem("orbit_lang"); } catch (e) { }

  // ---- the signed-in user, their organisation and company -----------------
  var ORG_ID = "00000000-0000-4000-8000-00000000000a";
  var CO_ID = "00000000-0000-4000-8000-00000000000c";
  var USER_ID = "00000000-0000-4000-8000-000000000001";
  var USER = { id: USER_ID, email: "smoke@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: { full_name: "Smoke Test" }, created_at: "2026-01-01T00:00:00Z" };
  var SESSION = { access_token: "smoke", refresh_token: "smoke", token_type: "bearer", expires_in: 3600, expires_at: 4102444800, user: USER };
  var ORG = { id: ORG_ID, name: "Smoke Test Org", status: "active" };
  var COMPANY = { id: CO_ID, org_id: ORG_ID, name: "Smoke Test Company", currency_code: "USD", country: "Lebanon", is_active: true, profile: {} };
  var ROLE = { id: "00000000-0000-4000-8000-0000000000r1", slug: "owner", name: "Owner", org_id: null, full_access: true, can_manage_roles: true, can_see_money: true, rank: 100, permissions: { "*": { v: true, m: true } } };
  // Rows a table returns. Anything not listed is an empty company: [] for a
  // list, null for single()/maybeSingle().
  var TABLES = {
    profiles: [{ id: USER_ID, email: USER.email, full_name: "Smoke Test", active_company_id: CO_ID }],
    companies: [COMPANY],
    orgs: [ORG],
    org_members: [{ org_id: ORG_ID, user_id: USER_ID, role: "owner", company_ids: null }],
    roles: [ROLE]
  };
  // What an rpc returns when an empty company would not return []. The user is
  // a platform operator in their own organisation, so the platform screens open.
  var RPC = { is_platform_admin: true, my_home_orgs: [ORG_ID], my_pending_invites: [] };
  SMOKE.fixtures = { tables: TABLES, rpc: RPC, user: USER, company: COMPANY, org: ORG };

  var seq = 0;
  function answer(st) {
    SMOKE.activity++;
    var out;
    if (st.written) {
      // an insert or upsert comes back as the rows written, with ids, as the database returns them
      var made = (Array.isArray(st.written) ? st.written : [st.written]).map(function (r) {
        var id = "00000000-0000-4000-9000-" + ("000000000000" + (++seq)).slice(-12), at = new Date().toISOString();
        var row = { id: id, created_at: at, updated_at: at };
        Object.keys(r || {}).forEach(function (k) { row[k] = r[k]; });
        return row;
      });
      out = st.single ? { data: made[0] || null, error: null } : { data: made, error: null, count: made.length };
    } else if (st.rpc) {
      var v = Object.prototype.hasOwnProperty.call(RPC, st.rpc) ? RPC[st.rpc] : [];
      out = st.single ? { data: Array.isArray(v) ? (v.length ? v[0] : null) : v, error: null }
                      : { data: v, error: null, count: Array.isArray(v) ? v.length : 0 };
    } else {
      var rows = TABLES[st.table] || [];
      out = st.single ? { data: rows.length ? rows[0] : null, error: null } : { data: rows, error: null, count: rows.length };
    }
    // a copy, so a screen that edits what it got back cannot change the fixtures
    return Promise.resolve(JSON.parse(JSON.stringify(out)));
  }
  // A chainable query: every method returns the same builder, and awaiting it
  // (or calling then/catch/finally) gives the answer.
  function builder(st) {
    var p = new Proxy(function () { }, {
      get: function (t, k) {
        if (typeof k === "symbol") return undefined;
        if (k === "then") return function (okFn, noFn) { return answer(st).then(okFn, noFn); };
        if (k === "catch") return function (noFn) { return answer(st).catch(noFn); };
        if (k === "finally") return function (f) { return answer(st).finally(f); };
        if (k === "single" || k === "maybeSingle") return function () { st.single = true; return p; };
        if (k === "insert" || k === "upsert") return function (payload) { st.written = payload; return p; };
        return function () { return p; };
      },
      apply: function () { return p; }
    });
    return p;
  }
  function resolved(v) { return Promise.resolve(v); }
  function lenient(known, fallback) {
    return new Proxy(known, { get: function (t, k) { if (typeof k === "symbol") return undefined; return k in t ? t[k] : fallback; } });
  }
  var auth = lenient({
    getSession: function () { return resolved({ data: { session: SESSION }, error: null }); },
    getUser: function () { return resolved({ data: { user: USER }, error: null }); },
    onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () { } } } }; },
    signInWithPassword: function () { return resolved({ data: { session: SESSION, user: USER }, error: null }); },
    signUp: function () { return resolved({ data: { session: SESSION, user: USER }, error: null }); },
    updateUser: function () { return resolved({ data: { user: USER }, error: null }); },
    refreshSession: function () { return resolved({ data: { session: SESSION, user: USER }, error: null }); },
    signOut: function () { return resolved({ error: null }); }
  }, function () { return resolved({ data: {}, error: null }); });
  var storage = {
    from: function () {
      return lenient({
        getPublicUrl: function (path) { return { data: { publicUrl: location.origin + "/__supabase__/storage/" + path } }; },
        createSignedUrls: function (paths) { return resolved({ data: (paths || []).map(function (p) { return { path: p, signedUrl: "", error: null }; }), error: null }); },
        list: function () { return resolved({ data: [], error: null }); }
      }, function () { return resolved({ data: null, error: null }); });
    }
  };
  function channel() {
    var c = lenient({
      subscribe: function () { return c; },
      unsubscribe: function () { return resolved("ok"); },
      send: function () { return resolved("ok"); }
    }, function () { return c; });
    return c;
  }
  var client = {
    from: function (table) { return builder({ table: table }); },
    rpc: function (fn) { return builder({ rpc: fn }); },
    auth: auth,
    storage: storage,
    functions: { invoke: function () { return resolved({ data: null, error: null }); } },
    channel: channel,
    removeChannel: function () { return resolved("ok"); },
    removeAllChannels: function () { return resolved([]); },
    getChannels: function () { return []; }
  };
  client.schema = function () { return client; };
  W.APP_CONFIG = W.APP_CONFIG || { SUPABASE_URL: location.origin + "/__supabase__", SUPABASE_ANON_KEY: "smoke" };
  W.supabase = { createClient: function () { return client; } };
})();

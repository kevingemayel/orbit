// Cloudflare Pages Function - custom-domain lifecycle for the Website module.
// The app calls this with the signed-in user's Supabase JWT; we (a) verify the user
// owns the site_hostnames row (RLS, via their JWT - no service role), then (b) use a
// server-side Cloudflare API token to register / check / remove the custom hostname on
// Cloudflare for SaaS, which auto-issues and renews the SSL cert for the customer domain.
//
// Set as encrypted Pages env vars:  CF_API_TOKEN  (SSL for SaaS: Edit)  and  CF_ZONE_ID.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const FALLBACK_ORIGIN = "sites.spacework.ai";   // what customers CNAME to

const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: { "Content-Type": "application/json" } });

async function ownedHost(jwt, hid) {
  const r = await fetch(SUPA + "/rest/v1/site_hostnames?id=eq." + encodeURIComponent(hid) + "&select=id,hostname,site_id,company_id,cf_hostname_id,status", {
    headers: { "apikey": ANON, "Authorization": "Bearer " + jwt }
  });
  if (!r.ok) return null;
  const a = await r.json();
  return (Array.isArray(a) && a.length === 1) ? a[0] : null;   // RLS only returns rows the user may see
}
async function patchHost(jwt, hid, patch) {
  await fetch(SUPA + "/rest/v1/site_hostnames?id=eq." + encodeURIComponent(hid), {
    method: "PATCH",
    headers: { "apikey": ANON, "Authorization": "Bearer " + jwt, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify(patch)
  });
}
function cf(env, path, method, body) {
  return fetch("https://api.cloudflare.com/client/v4/zones/" + env.CF_ZONE_ID + "/custom_hostnames" + path, {
    method: method || "GET",
    headers: { "Authorization": "Bearer " + env.CF_API_TOKEN, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  }).then((r) => r.json());
}
function summarise(res, host) {
  const r = (res && res.result) || {};
  const active = r.status === "active" && (!r.ssl || r.ssl.status === "active");
  return {
    ok: !!(res && res.success),
    cf_id: r.id || null,
    status: active ? "active" : "pending",
    ssl_status: r.ssl ? r.ssl.status : null,
    host: host,
    cname_target: FALLBACK_ORIGIN,
    ownership: r.ownership_verification || null,          // set when Cloudflare needs a TXT record
    errors: (res && res.errors) || r.verification_errors || null
  };
}

export async function onRequest(context) {
  const { request, params, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  const jwt = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return J({ error: "Sign in required." }, 401);
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) return J({ error: "Custom domains are not configured yet (CF_API_TOKEN / CF_ZONE_ID not set).", not_configured: true }, 501);
  const seg = params && params.path ? (Array.isArray(params.path) ? params.path : [params.path]) : [];
  const action = seg[0] || "";
  let body = {};
  try { if (request.method === "POST") body = await request.json(); } catch (e) { }
  const hid = body.hostname_id || new URL(request.url).searchParams.get("id");
  if (!hid) return J({ error: "hostname_id required." }, 400);

  const row = await ownedHost(jwt, hid);
  if (!row) return J({ error: "Domain not found or not yours." }, 404);

  if (action === "register") {
    const res = await cf(env, "", "POST", { hostname: row.hostname, ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } } });
    const s = summarise(res, row.hostname);
    if (s.cf_id) await patchHost(jwt, hid, { cf_hostname_id: s.cf_id, status: s.status });
    return J(s);
  }
  if (action === "status") {
    if (!row.cf_hostname_id) return J({ status: "pending", host: row.hostname, cname_target: FALLBACK_ORIGIN, note: "Not registered yet." });
    const res = await cf(env, "/" + row.cf_hostname_id, "GET");
    const s = summarise(res, row.hostname);
    if (s.status !== row.status) await patchHost(jwt, hid, { status: s.status });
    return J(s);
  }
  if (action === "remove") {
    if (row.cf_hostname_id) await cf(env, "/" + row.cf_hostname_id, "DELETE");
    return J({ ok: true });
  }
  return J({ error: "Unknown action. Use register / status / remove." }, 400);
}

// Cloudflare Pages Function -> Orbit public API gateway at /api/v1/*
// Auth: Authorization: Bearer orbit_live_...  (a company's API key)
// The key never unlocks anything directly - it is passed to SECURITY DEFINER Postgres
// functions (api_query / api_write) that validate it, resolve its company, and force
// company scoping. No Supabase service-role key is used here. Always returns JSON.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "v1";
const READ = ["contacts", "products", "projects", "invoices", "purchase_orders", "payments"];
const WRITE = ["contacts", "products", "projects"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400"
};

export async function onRequest(context) {
  const { request, env, params } = context;
  const H = Object.assign({ "Content-Type": "application/json" }, CORS);
  const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: H });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: H });

  const supaUrl = env.SUPABASE_URL || SUPA;
  const anon = env.SUPABASE_ANON_KEY || ANON;
  const seg = (params && params.path) ? (Array.isArray(params.path) ? params.path : [params.path]) : [];

  // GET /api/v1  -> discovery
  if (!seg.length) return json({ orbit_api: VERSION, docs: "https://orbit.spacework.ai/developers", read: READ, write: WRITE });

  const key = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!key || key.indexOf("orbit_") !== 0) return json({ error: "Missing or malformed API key. Send 'Authorization: Bearer orbit_live_...'." }, 401);

  const resource = seg[0];
  const id = seg[1] || null;

  async function rpc(fn, body) {
    const r = await fetch(supaUrl + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    return { ok: r.ok, status: r.status, data };
  }
  function mapErr(res) {
    const msg = (res.data && (res.data.message || res.data.error || res.data.hint)) || "Request failed";
    if (/unauthorized/i.test(msg)) return json({ error: "Invalid or revoked API key." }, 401);
    if (/read-only/i.test(msg)) return json({ error: "This API key is read-only." }, 403);
    if (/unknown resource|not allowed on this resource/i.test(msg)) return json({ error: "Unknown or non-writable resource '" + resource + "'." }, 404);
    return json({ error: msg }, res.status >= 400 && res.status < 600 ? res.status : 400);
  }

  try {
    if (request.method === "GET") {
      if (READ.indexOf(resource) < 0) return json({ error: "Unknown resource '" + resource + "'. Available: " + READ.join(", ") }, 404);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);
      const res = await rpc("api_query", { p_key: key, p_resource: resource, p_id: id, p_limit: limit, p_offset: offset });
      if (!res.ok) return mapErr(res);
      const rows = Array.isArray(res.data) ? res.data : (res.data || []);
      if (id) return rows.length ? json({ data: rows[0] }) : json({ error: "Not found." }, 404);
      return json({ data: rows, count: rows.length, limit, offset });
    }
    if (request.method === "POST" || request.method === "PATCH") {
      if (WRITE.indexOf(resource) < 0) return json({ error: "Writes are not enabled for '" + resource + "'. Writable: " + WRITE.join(", ") + ". (Financial documents are read-only pending a security review.)" }, 403);
      const bodyIn = await request.json().catch(() => null);
      if (!bodyIn || typeof bodyIn !== "object") return json({ error: "Send a JSON object body." }, 400);
      const op = request.method === "POST" ? "create" : "update";
      if (op === "update" && !id) return json({ error: "PATCH needs an id: /api/v1/" + resource + "/{id}" }, 400);
      const res = await rpc("api_write", { p_key: key, p_resource: resource, p_op: op, p_id: id, p_data: bodyIn });
      if (!res.ok) return mapErr(res);
      const rows = Array.isArray(res.data) ? res.data : (res.data || []);
      return json({ data: rows[0] || null }, op === "create" ? 201 : 200);
    }
    return json({ error: "Method not allowed." }, 405);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 200);
  }
}

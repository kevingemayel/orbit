// Cloudflare Pages Function  ->  POST /api/send-sign
// Emails one signer their own link to sign a document.
//
// Security: the same shape as send-approval. It needs a valid Supabase session
// (Bearer token); the link token is minted server-side by mint_sign_token, which
// runs as the caller, so a person who cannot write in that company cannot send
// anything; and the recipient address comes from the signature row, never from
// the request body, so this endpoint cannot be pointed at an arbitrary mailbox.
// Always returns JSON, never throws at the browser.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "send-sign-v1";

export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({ ok: true, version: VERSION, hasResendKey: !!env.RESEND_API_KEY }),
    { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const H = { "Content-Type": "application/json" };
  const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: H });
  let stage = "start";
  async function tfetch(url, opts, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 9000);
    try { return await fetch(url, Object.assign({}, opts, { signal: c.signal })); }
    finally { clearTimeout(t); }
  }
  try {
    const jwt = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "Not signed in." }, 401);
    const supaUrl = env.SUPABASE_URL || SUPA;
    const anon = env.SUPABASE_ANON_KEY || ANON;
    const authHdr = { apikey: anon, Authorization: "Bearer " + jwt, "Content-Type": "application/json" };

    stage = "auth";
    const who = await tfetch(supaUrl + "/auth/v1/user", { headers: authHdr }, 9000);
    if (!who.ok) return json({ error: "Session expired, sign in again." }, 401);

    stage = "parse";
    const body = await request.json().catch(() => ({}));
    const sigId = body.signature_id;
    if (!sigId) return json({ error: "Missing signer id." }, 400);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(sigId))) {
      return json({ error: "That signer id is not valid." }, 400);
    }
    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured: RESEND_API_KEY is not set on the site." }, 200);

    stage = "mint";
    const mRes = await tfetch(supaUrl + "/rest/v1/rpc/mint_sign_token",
      { method: "POST", headers: authHdr, body: JSON.stringify({ p_signature: sigId }) }, 9000);
    const minted = await mRes.json().catch(() => null);
    if (!mRes.ok || !minted || !minted.token) {
      return json({ error: (minted && minted.error) || "Could not prepare this signature request.", stage, detail: minted }, 200);
    }

    const to = String(minted.signer_email || "").trim();
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return json({ error: "That signer has no email address. Add one on the request and try again." }, 200);
    }

    stage = "send";
    const from = (env.INVITE_FROM || "Space Work Orbit <invites@spacework.ai>").trim();
    const origin = new URL(request.url).origin;
    const link = origin + "/sign?t=" + encodeURIComponent(minted.token);
    const send = await tfetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: subjectFor(minted), html: buildHtml(minted, link) })
    }, 12000);
    const sj = await send.json().catch(() => ({}));
    if (!send.ok) return json({ error: (sj && (sj.message || (sj.error && sj.error.message))) || ("Resend returned " + send.status) }, 200);

    return json({ ok: true, to });
  } catch (e) {
    return json({ error: String((e && e.message) || e), stage }, 200);
  }
}

function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function subjectFor(m) {
  return (m.company ? m.company + ": " : "") + "please sign " + (m.title || m.number || "a document");
}
function buildHtml(m, link) {
  const title = esc(m.title || m.number || "a document");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f4ef;font-family:Segoe UI,Arial,sans-serif;color:#181a1f">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e2d9;border-radius:16px;padding:28px">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#2f6bff;font-weight:700">Signature requested</div>
    <h1 style="font-size:22px;margin:8px 0 4px">${title}</h1>
    <div style="color:#6b6b6b;font-size:14px;margin-bottom:18px">${esc(m.company || "")}${m.number ? " &middot; " + esc(m.number) : ""}</div>
    <p style="font-size:15px;line-height:1.5">Hello ${esc(m.signer_name || "")}, you have been asked to sign this. Opening the link shows you what is being signed, any notes that came with it, and a box to sign in; it works on a phone.</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#2f6bff;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;display:inline-block">Read and sign</a></p>
    <p style="font-size:12.5px;color:#6b6b6b">The link is yours alone and works once. It stops working after 30 days.</p>
  </div></body></html>`;
}

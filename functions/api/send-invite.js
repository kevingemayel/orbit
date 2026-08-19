// Cloudflare Pages Function  ->  POST /api/send-invite
// Emails a team invitation via Resend. Security: requires a valid Supabase session
// (Bearer token); the invite is read with that same token, so RLS limits the caller to
// invites they're allowed to see (org admins, per policy oi_r). Always returns JSON
// (never a 5xx that Cloudflare would replace with a Bad Gateway page).
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const APP_URL = "https://orbit.spacework.ai/";
const VERSION = "invite-v1";

export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({ ok: true, version: VERSION, hasResendKey: !!env.RESEND_API_KEY }), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const H = { "Content-Type": "application/json" };
  const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: H });
  let stage = "start";
  async function tfetch(url, opts, ms) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms || 8000);
    try { return await fetch(url, Object.assign({}, opts, { signal: c.signal })); }
    finally { clearTimeout(t); }
  }
  try {
    const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not signed in." }, 401);
    const supaUrl = env.SUPABASE_URL || SUPA;
    const anon = env.SUPABASE_ANON_KEY || ANON;
    const authHdr = { apikey: anon, Authorization: "Bearer " + token };

    stage = "auth";
    const who = await tfetch(supaUrl + "/auth/v1/user", { headers: authHdr }, 8000);
    if (!who.ok) return json({ error: "Session expired, sign in again." }, 401);
    const me = await who.json().catch(() => ({}));

    stage = "parse";
    const reqBody = await request.json().catch(() => ({}));
    const inviteId = reqBody.invite_id;
    if (!inviteId) return json({ error: "Missing invite id." }, 400);
    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured: RESEND_API_KEY is not set on the site." }, 200);

    stage = "fetch-invite";
    const iRes = await tfetch(supaUrl + "/rest/v1/org_invites?id=eq." + inviteId + "&select=id,email,role,status,orgs(name)", { headers: authHdr }, 8000);
    const iBody = await iRes.json().catch(() => null);
    if (!Array.isArray(iBody)) return json({ error: "Could not load the invitation.", stage, detail: iBody }, 200);
    const inv = iBody[0];
    if (!inv) return json({ error: "Invitation not found (or you can't access it)." }, 404);
    if (inv.status !== "pending") return json({ error: "That invitation is no longer pending." }, 200);

    const recipient = (inv.email || "").trim();
    if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return json({ error: "The invitation has no valid email." }, 400);

    const orgName = (inv.orgs && inv.orgs.name) || "a team";
    const roleLabel = prettyRole(inv.role);
    const inviter = (me && me.email) || "a teammate";
    const from = (env.INVITE_FROM || "Space Work Orbit <invites@spacework.ai>").trim();
    const subject = "You're invited to join " + orgName + " on Orbit";

    if (reqBody.dry_run) return json({ ok: true, dry: true, version: VERSION, recipient, from, orgName, roleLabel });

    stage = "resend";
    let send, sj;
    try {
      send = await tfetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [recipient], subject, html: buildHtml(orgName, roleLabel, inviter, recipient) })
      }, 12000);
    } catch (e) {
      return json({ error: "Could not reach the email service (" + String(e && e.name || e) + ").", stage }, 200);
    }
    sj = await send.json().catch(() => ({}));
    if (!send.ok) return json({ error: (sj && (sj.message || (sj.error && sj.error.message))) || ("Email service rejected the message (HTTP " + send.status + ")."), detail: sj, from }, 200);
    return json({ ok: true, id: sj.id, to: recipient });
  } catch (e) {
    return json({ error: String(e && e.message || e), stage }, 200);
  }
}

function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function prettyRole(slug) { return String(slug || "member").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
function buildHtml(orgName, roleLabel, inviter, recipient) {
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#16171c">
    <div style="border-bottom:2px solid #16171c;padding-bottom:12px;margin-bottom:20px">
      <span style="font-size:20px;font-weight:800">Orbit</span><span style="color:#8a8f98;font-size:13px"> &middot; by Space Work</span>
    </div>
    <p style="font-size:15px;line-height:1.55">You've been invited to join <b>${esc(orgName)}</b> on Orbit as <b>${esc(roleLabel)}</b>.</p>
    <p style="font-size:14px;line-height:1.55;color:#444">Orbit is where the team runs quotes, invoices, purchases, projects and reports together.</p>
    <div style="margin:24px 0">
      <a href="${APP_URL}" style="display:inline-block;background:#2f6bff;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:9px">Open Orbit and join</a>
    </div>
    <p style="font-size:13px;line-height:1.55;color:#555">Sign in (or sign up) with <b>${esc(recipient)}</b> - this exact email address - and you'll join <b>${esc(orgName)}</b> automatically. No code to enter.</p>
    <div style="margin-top:26px;border-top:1px solid #e4e0d8;padding-top:12px;color:#8a8f98;font-size:12px">If you weren't expecting this, you can ignore this email. Invitation sent via Orbit.</div>
  </div>`;
}

// Cloudflare Pages Function  ->  /api/run-reminders
// Called once a day by the database scheduler (pg_cron -> pg_net) with the shared
// x-cron-secret header. It asks Supabase for the reminders that are due today,
// emails the people involved in each event via Resend, then marks them sent.
// The secret is verified inside the Postgres RPC (it never lives in this file);
// the Resend key lives only in the Cloudflare environment. Always returns JSON.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "reminders-v1";

export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({ ok: true, version: VERSION, hasResendKey: !!env.RESEND_API_KEY }),
    { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const H = { "Content-Type": "application/json" };
  const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: H });
  async function tfetch(url, opts, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 12000);
    try { return await fetch(url, Object.assign({}, opts, { signal: c.signal })); }
    finally { clearTimeout(t); }
  }
  try {
    const secret = (request.headers.get("x-cron-secret") || "").trim();
    if (!secret) return json({ error: "missing secret" }, 401);
    const supaUrl = env.SUPABASE_URL || SUPA;
    const anon = env.SUPABASE_ANON_KEY || ANON;
    const rpcHdr = { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" };

    // 1) which reminders are due today?
    const dRes = await tfetch(supaUrl + "/rest/v1/rpc/due_reminders_for_send",
      { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret }) }, 12000);
    const due = await dRes.json().catch(() => null);
    if (!dRes.ok) return json({ error: "could not load reminders", detail: due }, 200);
    if (!Array.isArray(due) || !due.length) return json({ ok: true, due: 0, sent: 0 });

    if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY not set", due: due.length }, 200);
    const from = (env.INVITE_FROM || "Space Work Orbit <invites@spacework.ai>").trim();

    // 2) email each due reminder, collect processed ids (email OK or no-recipients)
    const processed = []; let emailed = 0; const errors = [];
    for (const r of due) {
      const to = (Array.isArray(r.recipients) ? r.recipients : []).filter(Boolean);
      if (!to.length) { processed.push(r.id); continue; }   // nobody to email -> still mark done
      try {
        const send = await tfetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, subject: subjectFor(r), html: buildHtml(r) })
        }, 12000);
        const sj = await send.json().catch(() => ({}));
        if (send.ok) { processed.push(r.id); emailed++; }
        else errors.push({ id: r.id, err: (sj && (sj.message || (sj.error && sj.error.message))) || send.status });
      } catch (e) { errors.push({ id: r.id, err: String(e && e.name || e) }); }
    }

    // 3) mark processed reminders as sent
    if (processed.length) {
      await tfetch(supaUrl + "/rest/v1/rpc/mark_reminders_sent",
        { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret, p_ids: processed, p_recipients: "" }) }, 12000);
    }
    return json({ ok: true, due: due.length, emailed, marked: processed.length, errors });
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 200);
  }
}

function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function money(a, cur) {
  const n = Number(a || 0);
  return (cur || "USD") + " " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function whenLabel(r) {
  if (r.offset_days === 0) return "due today";
  if (r.offset_days === 7) return "due in 1 week";
  if (r.offset_days === 14) return "due in 2 weeks";
  return "due in " + r.offset_days + " days";
}
function subjectFor(r) {
  const who = r.supplier ? (" - " + r.supplier) : "";
  return "Payment " + whenLabel(r) + ": " + money(r.amount, r.currency) + who + " (" + (r.event_name || "event") + ")";
}
function buildHtml(r) {
  const due = r.due_date ? new Date(r.due_date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "";
  const evd = r.event_date ? new Date(r.event_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const rows = [
    ["Payment", esc(r.payment_label || "Payment")],
    r.supplier ? ["Supplier", esc(r.supplier)] : null,
    ["Amount", "<b>" + esc(money(r.amount, r.currency)) + "</b>"],
    ["Due", esc(due) + " (" + esc(whenLabel(r)) + ")"],
    ["Event", esc(r.event_name || "") + (evd ? " - " + esc(evd) : "")],
    r.venue ? ["Venue", esc(r.venue)] : null
  ].filter(Boolean).map(function (kv) {
    return '<tr><td style="padding:6px 14px 6px 0;color:#8a8f98;font-size:13px;vertical-align:top">' + kv[0] +
      '</td><td style="padding:6px 0;font-size:14px;color:#16171c">' + kv[1] + "</td></tr>";
  }).join("");
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#16171c">
    <div style="border-bottom:2px solid #16171c;padding-bottom:12px;margin-bottom:20px">
      <span style="font-size:20px;font-weight:800">Orbit</span><span style="color:#8a8f98;font-size:13px"> &middot; Payment reminder</span>
    </div>
    <p style="font-size:15px;line-height:1.55">This is a reminder that a payment for <b>${esc(r.event_name || "your event")}</b> is <b>${esc(whenLabel(r))}</b>.</p>
    <table style="border-collapse:collapse;margin:16px 0">${rows}</table>
    <div style="margin:22px 0">
      <a href="https://orbit.spacework.ai/" style="display:inline-block;background:#db2777;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:9px">Open the event in Orbit</a>
    </div>
    <div style="margin-top:24px;border-top:1px solid #e4e0d8;padding-top:12px;color:#8a8f98;font-size:12px">Automatic reminder from Orbit for people involved in this event. Reminders are sent 2 weeks before, 1 week before, and on the due date.</div>
  </div>`;
}

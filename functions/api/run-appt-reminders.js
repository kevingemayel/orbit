// Cloudflare Pages Function  ->  /api/run-appt-reminders
// Called hourly by the database scheduler (pg_cron -> pg_net) with the shared
// x-cron-secret header. It asks Supabase for appointments coming up inside each
// company's reminder window that haven't been reminded yet, emails the client via
// Resend, then stamps reminder_sent_at so nobody is emailed twice.
// The secret is verified inside the Postgres RPC (never in this file); the Resend
// key lives only in the Cloudflare environment. Always returns JSON.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "appt-reminders-v1";

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

    // 1) which appointment reminders are due now?
    const dRes = await tfetch(supaUrl + "/rest/v1/rpc/due_appt_reminders",
      { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret }) }, 12000);
    const due = await dRes.json().catch(() => null);
    if (!dRes.ok) return json({ error: "could not load reminders", detail: due }, 200);
    if (!Array.isArray(due) || !due.length) return json({ ok: true, due: 0, sent: 0 });

    if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY not set", due: due.length }, 200);
    const from = (env.APPT_FROM || env.INVITE_FROM || "Space Work <appointments@spacework.ai>").trim();

    // 2) email each due reminder, collect processed ids
    const processed = []; let emailed = 0; const errors = [];
    for (const r of due) {
      const to = (r.to || "").trim();
      if (!to) { processed.push(r.id); continue; }   // no email -> still mark done so it doesn't retry forever
      try {
        const send = await tfetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [to], subject: subjectFor(r), html: buildHtml(r) })
        }, 12000);
        const sj = await send.json().catch(() => ({}));
        if (send.ok) { processed.push(r.id); emailed++; }
        else errors.push({ id: r.id, err: (sj && (sj.message || (sj.error && sj.error.message))) || send.status });
      } catch (e) { errors.push({ id: r.id, err: String(e && e.name || e) }); }
    }

    // 3) stamp reminder_sent_at on the processed appointments
    if (processed.length) {
      await tfetch(supaUrl + "/rest/v1/rpc/mark_appt_reminders_sent",
        { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret, p_ids: processed }) }, 12000);
    }
    return json({ ok: true, due: due.length, emailed, marked: processed.length, errors });
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 200);
  }
}

function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function whenParts(iso) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
    return { date, time };
  } catch (_) { return { date: "", time: "" }; }
}
function locLabel(l) { return l === "online" ? "Online" : l === "phone" ? "Phone" : "In person"; }
function subjectFor(r) {
  const w = whenParts(r.starts_at);
  return "Reminder: your " + (r.term_appt || "appointment").toLowerCase() + " " + w.date + " at " + w.time;
}
function buildHtml(r) {
  const w = whenParts(r.starts_at);
  const term = (r.term_appt || "appointment");
  const rows = [
    ["When", "<b>" + esc(w.date) + " &middot; " + esc(w.time) + "</b>"],
    r.service ? ["Service", esc(r.service)] : null,
    ["With", esc(r.business || "")],
    ["Where", esc(locLabel(r.location))]
  ].filter(Boolean).map(function (kv) {
    return '<tr><td style="padding:6px 14px 6px 0;color:#8a8f98;font-size:13px;vertical-align:top">' + kv[0] +
      '</td><td style="padding:6px 0;font-size:14px;color:#16171c">' + kv[1] + "</td></tr>";
  }).join("");
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#16171c">
    <div style="border-bottom:2px solid #16171c;padding-bottom:12px;margin-bottom:20px">
      <span style="font-size:20px;font-weight:800">${esc(r.business || "Appointment")}</span><span style="color:#8a8f98;font-size:13px"> &middot; ${esc(term)} reminder</span>
    </div>
    <p style="font-size:15px;line-height:1.55">Hi ${esc((r.client_name || "").split(" ")[0] || "there")}, this is a friendly reminder about your upcoming ${esc(term.toLowerCase())}.</p>
    <table style="border-collapse:collapse;margin:16px 0">${rows}</table>
    <p style="font-size:13.5px;color:#54565e;line-height:1.5">Need to change it? Just reply to this email and we'll help.</p>
    <div style="margin-top:24px;border-top:1px solid #e4e0d8;padding-top:12px;color:#8a8f98;font-size:12px">Automatic reminder from ${esc(r.business || "your provider")}, powered by Space Work &middot; Orbit.</div>
  </div>`;
}

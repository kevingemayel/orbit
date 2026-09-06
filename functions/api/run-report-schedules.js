// Cloudflare Pages Function  ->  /api/run-report-schedules
// Called hourly by the database scheduler (pg_cron -> pg_net) with the shared
// x-cron-secret header. Asks Supabase which scheduled reports are due this hour,
// gets each one's figures computed server-side, emails them via Resend, marks sent.
// The secret is verified inside the Postgres RPCs (never in this file); the Resend
// key lives only in the Cloudflare environment. Always returns JSON.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "report-schedules-v1";

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

    // 1) which scheduled reports are due this hour?
    const dRes = await tfetch(supaUrl + "/rest/v1/rpc/due_report_schedules",
      { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret }) }, 12000);
    const due = await dRes.json().catch(() => null);
    if (!dRes.ok) return json({ error: "could not load schedules", detail: due }, 200);
    if (!Array.isArray(due) || !due.length) return json({ ok: true, due: 0, sent: 0 });

    if (!env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY not set", due: due.length }, 200);
    const from = (env.INVITE_FROM || "Space Work Orbit <invites@spacework.ai>").trim();

    const marked = []; let emailed = 0; const errors = [];
    for (const s of due) {
      const to = String(s.recipients || "").split(",").map(x => x.trim()).filter(Boolean);
      if (!to.length) { marked.push(s.id); continue; }
      try {
        // 2) compute this report's figures server-side
        const pRes = await tfetch(supaUrl + "/rest/v1/rpc/report_schedule_payload",
          { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret, p_id: s.id }) }, 12000);
        const payload = await pRes.json().catch(() => null);
        if (!pRes.ok || !payload) { errors.push({ id: s.id, err: "payload failed" }); continue; }

        const send = await tfetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, subject: subjectFor(s, payload), html: buildHtml(s, payload) })
        }, 12000);
        const sj = await send.json().catch(() => ({}));
        if (send.ok) { marked.push(s.id); emailed++; }
        else errors.push({ id: s.id, err: (sj && (sj.message || (sj.error && sj.error.message))) || send.status });
      } catch (e) { errors.push({ id: s.id, err: String((e && e.name) || e) }); }
    }

    // 3) mark the ones we handled so they don't resend this hour
    for (const id of marked) {
      await tfetch(supaUrl + "/rest/v1/rpc/mark_report_schedule_sent",
        { method: "POST", headers: rpcHdr, body: JSON.stringify({ p_secret: secret, p_id: id }) }, 12000);
    }
    return json({ ok: true, due: due.length, emailed, marked: marked.length, errors });
  } catch (e) {
    return json({ error: String((e && e.message) || e) }, 200);
  }
}

function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function fmt(v, p) {
  const n = Number(v || 0);
  const s = n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return p && p.money ? ((p.currency || "") + " " + s) : s;
}
function subjectFor(s, p) {
  const base = p && p.report ? p.report : (s.name || "Report");
  if (p && p.single) return base + ": " + fmt(p.total, p);
  return base + " - " + (s.cadence === "daily" ? "daily" : s.cadence === "monthly" ? "monthly" : "weekly") + " summary";
}
function buildHtml(s, p) {
  if (p && p.error) {
    return wrap(s, '<p style="font-size:15px">This scheduled report could not be built: ' + esc(p.error) + '.</p>');
  }
  let inner = "";
  if (p.single) {
    inner = '<div style="font-size:34px;font-weight:800;margin:6px 0 2px">' + esc(fmt(p.total, p)) + '</div>' +
      '<div style="color:#8a8f98;font-size:13px">' + esc(p.report || "") + '</div>';
  } else {
    const rows = Array.isArray(p.rows) ? p.rows : [];
    inner = rows.length
      ? '<table style="border-collapse:collapse;margin:10px 0;width:100%">' + rows.map(r =>
        '<tr><td style="padding:7px 12px 7px 0;font-size:14px;color:#16171c;border-bottom:1px solid #eee">' + esc(r.label) +
        '</td><td style="padding:7px 0;font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid #eee">' + esc(fmt(r.value, p)) + "</td></tr>").join("") + "</table>"
      : '<p style="color:#8a8f98;font-size:14px">No data for this period.</p>';
  }
  return wrap(s, inner);
}
function wrap(s, inner) {
  const when = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#16171c">
    <div style="border-bottom:2px solid #16171c;padding-bottom:12px;margin-bottom:20px">
      <span style="font-size:20px;font-weight:800">Orbit</span><span style="color:#8a8f98;font-size:13px"> &middot; Scheduled report</span>
    </div>
    <div style="font-size:16px;font-weight:700;margin-bottom:2px">${esc(s.name || "Report")}</div>
    <div style="color:#8a8f98;font-size:12px;margin-bottom:14px">${esc(when)}</div>
    ${inner}
    <div style="margin:22px 0">
      <a href="https://orbit.spacework.ai/" style="display:inline-block;background:#2f5bff;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:9px">Open the dashboard</a>
    </div>
    <div style="margin-top:24px;border-top:1px solid #e4e0d8;padding-top:12px;color:#8a8f98;font-size:12px">Automatic report from Orbit. Change or stop it in Insights &rsaquo; Scheduled reports.</div>
  </div>`;
}

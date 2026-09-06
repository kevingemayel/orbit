// Cloudflare Pages Function  ->  POST /api/send-approval
// Emails an approver a one-click Approve / Reject link for a pending approval.
//
// Security: requires a valid Supabase session (Bearer token). The approval row is
// read with that same token, so RLS limits the caller to approvals in a company
// they belong to. The one-time decision token is minted server-side by the
// mint_approval_token RPC (never sent up by the browser) and the recipient is
// taken from the approval row, never from the request body - so this endpoint
// cannot be used to mail an arbitrary address. Always returns JSON.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "send-approval-v1";

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
    const apprId = body.approval_id;
    if (!apprId) return json({ error: "Missing approval id." }, 400);
    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured: RESEND_API_KEY is not set on the site." }, 200);

    // 1) Mint (or reuse) the decision token. The RPC runs as the caller, so RLS
    //    still decides whether they may touch this approval.
    stage = "mint";
    const mRes = await tfetch(supaUrl + "/rest/v1/rpc/mint_approval_token",
      { method: "POST", headers: authHdr, body: JSON.stringify({ p_id: apprId }) }, 9000);
    const minted = await mRes.json().catch(() => null);
    if (!mRes.ok || !minted || !minted.token) {
      return json({ error: (minted && minted.error) || "Could not prepare this approval.", stage, detail: minted }, 200);
    }
    if (minted.status && minted.status !== "pending") return json({ error: "That request has already been decided." }, 200);

    const to = String(minted.approver_email || "").trim();
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return json({ error: "This approval has no approver email. Set an approver on the rule in Settings, or add a work email to that employee." }, 200);
    }

    stage = "send";
    const from = (env.INVITE_FROM || "Space Work Orbit <invites@spacework.ai>").trim();
    const origin = new URL(request.url).origin;
    // Extensionless: Cloudflare Pages 308s /approve.html to /approve, and a
    // redirect hop is one more thing for a mail scanner to mangle.
    const link = origin + "/approve?t=" + encodeURIComponent(minted.token);
    const send = await tfetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: subjectFor(minted), html: buildHtml(minted, link) })
    }, 12000);
    const sj = await send.json().catch(() => ({}));
    if (!send.ok) return json({ error: (sj && (sj.message || (sj.error && sj.error.message))) || ("Resend returned " + send.status) }, 200);

    stage = "mark";
    await tfetch(supaUrl + "/rest/v1/approvals?id=eq." + apprId,
      { method: "PATCH", headers: Object.assign({ Prefer: "return=minimal" }, authHdr), body: JSON.stringify({ notified_at: new Date().toISOString() }) }, 9000);

    return json({ ok: true, to });
  } catch (e) {
    return json({ error: String((e && e.message) || e), stage }, 200);
  }
}

// Must match APPR_DOC_LABEL in js/app.js
const DOC = {
  purchase_order: "Purchase order", sales_order: "Sales order", vendor_bill: "Vendor bill",
  customer_invoice: "Customer invoice", subcontract: "Subcontract", variation: "Variation",
  expense: "Expense", journal_entry: "Journal entry", payroll: "Payroll run"
};
function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function docLabel(a) { return (DOC[a.doc_type] || a.doc_type || "Document") + (a.doc_number ? " " + a.doc_number : ""); }
function money(v, cur) {
  if (v == null) return "";
  return (cur ? cur + " " : "") + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function subjectFor(a) {
  const amt = a.doc_amount != null ? " (" + money(a.doc_amount, a.currency_code) + ")" : "";
  return "Approval needed: " + docLabel(a) + amt;
}
function buildHtml(a, link) {
  const rows = [
    ["Document", docLabel(a)],
    ["Amount", a.doc_amount != null ? money(a.doc_amount, a.currency_code) : "-"],
    ["Requested by", a.requested_by || "-"],
    ["Company", a.company_name || "-"],
    ["Rule", a.rule_name || "-"]
  ];
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#16171c">
    <div style="border-bottom:2px solid #16171c;padding-bottom:12px;margin-bottom:20px">
      <span style="font-size:20px;font-weight:800">Orbit</span><span style="color:#8a8f98;font-size:13px"> &middot; Approval needed</span>
    </div>
    <div style="font-size:17px;font-weight:700;margin-bottom:4px">${esc(docLabel(a))}</div>
    ${a.doc_amount != null ? `<div style="font-size:30px;font-weight:800;margin:4px 0 14px">${esc(money(a.doc_amount, a.currency_code))}</div>` : '<div style="height:10px"></div>'}
    <table style="border-collapse:collapse;margin:6px 0 20px;width:100%">
      ${rows.map(r => `<tr><td style="padding:7px 12px 7px 0;font-size:14px;color:#8a8f98;border-bottom:1px solid #eee">${esc(r[0])}</td><td style="padding:7px 0;font-size:14px;text-align:right;font-weight:600;border-bottom:1px solid #eee">${esc(r[1])}</td></tr>`).join("")}
    </table>
    <div style="margin:22px 0">
      <a href="${esc(link)}&d=approved" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 26px;border-radius:9px;margin-right:8px">Approve</a>
      <a href="${esc(link)}&d=rejected" style="display:inline-block;background:#fff;color:#dc2626;border:2px solid #dc2626;text-decoration:none;font-weight:700;font-size:15px;padding:10px 24px;border-radius:9px">Reject</a>
    </div>
    <div style="color:#8a8f98;font-size:12.5px">Both buttons open a page where you confirm and can add a note, so nothing is decided by clicking alone. Approving releases the document for the requester to post; it does not post it for them. The link works once and expires in 14 days.</div>
    <div style="margin-top:24px;border-top:1px solid #e4e0d8;padding-top:12px;color:#8a8f98;font-size:12px">You are named as the approver for this rule in Orbit. Prefer to work in the app? Open <a href="https://orbit.spacework.ai/" style="color:#2f5bff">orbit.spacework.ai</a> and go to Approvals.</div>
  </div>`;
}

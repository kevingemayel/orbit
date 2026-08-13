// Cloudflare Pages Function  ->  POST /api/send-invoice
// Emails an invoice/credit note as HTML via Resend.
// Security: requires a valid Supabase session (Bearer token); the invoice is
// fetched with that same token so RLS limits the caller to invoices they can
// read; the email body is built server-side. Every step is time-boxed and
// wrapped so the function always returns JSON (never hangs into a 502).
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "send-v3";

export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({ ok: true, version: VERSION, hasResendKey: !!env.RESEND_API_KEY, hasFrom: !!env.INVOICE_FROM }), { headers: { "Content-Type": "application/json" } });
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

    stage = "parse";
    const body = await request.json().catch(() => ({}));
    const invId = body.invoice_id;
    if (!invId) return json({ error: "Missing invoice id." }, 400);
    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured: RESEND_API_KEY is not set on the site." }, 200);

    stage = "fetch-invoice";
    const iRes = await tfetch(supaUrl + "/rest/v1/invoices?id=eq." + invId + "&select=*,partners(name,email),companies(name,legal_name,country,currency_code)", { headers: authHdr }, 8000);
    const iBody = await iRes.json().catch(() => null);
    if (!Array.isArray(iBody)) return json({ error: "Could not load the invoice.", stage, detail: iBody }, 200);
    const inv = iBody[0];
    if (!inv) return json({ error: "Invoice not found." }, 404);

    stage = "fetch-lines";
    const lRes = await tfetch(supaUrl + "/rest/v1/invoice_lines?invoice_id=eq." + invId + "&select=name,quantity,unit_price,price_subtotal&order=sequence", { headers: authHdr }, 8000);
    const lines = await lRes.json().catch(() => []);

    const recipient = (body.to || (inv.partners && inv.partners.email) || "").trim();
    if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return json({ error: "No valid recipient email. Add one on the customer, or type one in the box." }, 400);

    const isRefund = (inv.move_type || "").indexOf("refund") >= 0;
    const isSale = (inv.move_type || "").indexOf("out_") === 0;
    const docName = isSale ? (isRefund ? "Credit Note" : "Invoice") : (isRefund ? "Vendor Credit Note" : "Bill");
    const co = inv.companies || {};
    const from = (env.INVOICE_FROM || "invoices@spacework.ai").trim();

    if (body.dry_run) return json({ ok: true, dry: true, version: VERSION, recipient, from, lineCount: (Array.isArray(lines) ? lines.length : 0), keyPresent: !!env.RESEND_API_KEY, number: inv.number });

    stage = "resend";
    let send, sj;
    try {
      send = await tfetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [recipient], subject: docName + " " + (inv.number || "") + " from " + (co.name || "Space Work"), html: buildHtml(inv, Array.isArray(lines) ? lines : [], docName, co) })
      }, 12000);
    } catch (e) {
      return json({ error: "Could not reach the email service (" + String(e && e.name || e) + "). Check the from address is on a verified domain.", stage }, 200);
    }
    sj = await send.json().catch(() => ({}));
    if (!send.ok) return json({ error: (sj && (sj.message || (sj.error && sj.error.message))) || ("Email service rejected the message (HTTP " + send.status + ")."), detail: sj, from }, 200);
    return json({ ok: true, id: sj.id, to: recipient, from });
  } catch (e) {
    return json({ error: String(e && e.message || e), stage }, 200);
  }
}

function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function money(n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function buildHtml(inv, lines, docName, co) {
  const cc = inv.currency_code || co.currency_code || "USD";
  let sub = 0;
  const rows = (lines || []).map(l => {
    const ls = Number(l.quantity) * Number(l.unit_price); sub += ls;
    return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(l.name)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(l.quantity)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(l.unit_price)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(ls)}</td></tr>`;
  }).join("");
  const total = Number(inv.amount_total != null ? inv.amount_total : sub);
  const due = Number(inv.amount_residual != null ? inv.amount_residual : total);
  const partner = inv.partners ? inv.partners.name : "";
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;color:#152030">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #152030;padding-bottom:14px">
      <div><div style="font-size:20px;font-weight:800">${esc(co.name || "Space Work")}</div><div style="color:#666;font-size:12px">${esc(co.legal_name || "")}${co.country ? "<br>" + esc(co.country) : ""}</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:800;text-transform:uppercase;color:#333">${esc(docName)}</div><div style="color:#666">${esc(inv.number || "")}</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin:18px 0;font-size:13px">
      <div><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700">Bill to</div><div style="font-weight:600">${esc(partner)}</div></div>
      <div style="text-align:right"><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700">Date</div><div>${esc(inv.invoice_date || "")}</div><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700;margin-top:6px">Due</div><div>${esc(inv.due_date || "-")}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Description</th><th style="text-align:right;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Qty</th><th style="text-align:right;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Unit Price</th><th style="text-align:right;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-left:auto;width:260px;margin-top:14px;font-size:13px">
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Total</span><span style="font-weight:800">${cc} ${money(total)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #ddd"><span>Amount Due</span><span>${cc} ${money(due)}</span></div>
    </div>
    <div style="margin-top:28px;border-top:1px solid #ddd;padding-top:10px;color:#888;font-size:11px;text-align:center">${esc(co.name || "Space Work")} &middot; sent via Orbit</div>
  </div>`;
}

// Cloudflare Pages Function  ->  POST /api/send-invoice
// Emails an invoice/credit note as HTML via Resend.
// Security: requires a valid Supabase session (Bearer token); the invoice is
// fetched with that same token so RLS limits the caller to invoices they can
// read; the email body is built server-side. Every step is time-boxed and
// wrapped so the function always returns JSON (never hangs into a 502).
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "send-v4";

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
    // an id goes into a query string, so it is checked and encoded rather than trusted
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(invId))) return json({ error: "That invoice id is not valid." }, 400);
    const invQ = encodeURIComponent(String(invId));
    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured: RESEND_API_KEY is not set on the site." }, 200);

    stage = "fetch-invoice";
    const iRes = await tfetch(supaUrl + "/rest/v1/invoices?id=eq." + invQ + "&select=*,partners(name,email),companies(name,legal_name,country,currency_code)", { headers: authHdr }, 8000);
    const iBody = await iRes.json().catch(() => null);
    if (!Array.isArray(iBody)) return json({ error: "Could not load the invoice.", stage, detail: iBody }, 200);
    const inv = iBody[0];
    if (!inv) return json({ error: "Invoice not found." }, 404);

    stage = "fetch-lines";
    const lRes = await tfetch(supaUrl + "/rest/v1/invoice_lines?invoice_id=eq." + invQ + "&select=name,line_type,discount,quantity,unit_price,price_subtotal&order=sequence", { headers: authHdr }, 8000);
    const lines = await lRes.json().catch(() => []);

    const recipient = (body.to || (inv.partners && inv.partners.email) || "").trim();
    if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return json({ error: "No valid recipient email. Add one on the customer, or type one in the box." }, 400);

    const isRefund = (inv.move_type || "").indexOf("refund") >= 0;
    const isSale = (inv.move_type || "").indexOf("out_") === 0;
    const docName = isSale ? (isRefund ? "Credit Note" : "Invoice") : (isRefund ? "Vendor Credit Note" : "Bill");
    const co = inv.companies || {};
    const from = (env.INVOICE_FROM || "invoices@spacework.ai").trim();
    const note = typeof body.note === "string" ? body.note.slice(0, 2000) : "";
    const subject = (body.subject ? String(body.subject).replace(/[\r\n]+/g, " ").trim().slice(0, 200) : "") || (docName + " " + (inv.number || "") + " from " + (co.name || "Space Work"));

    // The database decides whether this may be sent at all: the company must be the
    // caller's, the address must be one the company already holds, and there are hourly
    // limits per company and per person. It writes every attempt down either way.
    stage = "check-send";
    let sendOk = { ok: false, reason: "The send could not be checked." };
    try {
      const ck = await tfetch(supaUrl + "/rest/v1/rpc/email_send_check", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, authHdr),
        body: JSON.stringify({ p_company: inv.company_id, p_kind: isSale ? "invoice" : "bill", p_to: recipient, p_doc: invId, p_subject: subject })
      }, 8000);
      const cj = await ck.json().catch(function () { return null; });
      if (cj && typeof cj.ok === "boolean") sendOk = cj;
    } catch (e) { sendOk = { ok: false, reason: "The send could not be checked. Try again." }; }
    if (!sendOk.ok) return json({ error: sendOk.reason || "That email may not be sent." }, 403);

    if (body.dry_run) return json({ ok: true, dry: true, version: VERSION, recipient, from, lineCount: (Array.isArray(lines) ? lines.length : 0), keyPresent: !!env.RESEND_API_KEY, number: inv.number });

    stage = "resend";
    let send, sj;
    try {
      send = await tfetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [recipient], subject, html: buildHtml(inv, Array.isArray(lines) ? lines : [], docName, co, note) })
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
function buildHtml(inv, lines, docName, co, note) {
  const cc = inv.currency_code || co.currency_code || "USD";
  const noteBlock = (note && String(note).trim()) ? `<div style="margin:18px 0;padding:13px 15px;background:#f4f6f9;border-left:3px solid #152030;border-radius:6px;font-size:13.5px;white-space:pre-wrap;color:#333">${esc(note)}</div>` : "";
  let sub = 0;
  const cell = "padding:8px;border-bottom:1px solid #eee";
  const rows = (lines || []).map(l => {
    // a heading or a note prints across the table: no figures, no part in the
    // total. The printed page and the in-app preview both show them, so the
    // copy the customer opens has to show them too or it is a different document.
    if (l.line_type === "section" || l.line_type === "note") {
      const how = l.line_type === "section" ? "font-weight:700;padding-top:12px" : "font-style:italic;color:#555";
      return `<tr><td colspan="4" style="${cell};${how}">${esc(l.name || "")}</td></tr>`;
    }
    const disc = Number(l.discount) || 0;
    const ls = Number(l.quantity) * Number(l.unit_price) * (1 - disc / 100); sub += ls;
    const price = money(l.unit_price) + (disc ? ` <span style="color:#888">less ${Math.round(disc * 100) / 100}%</span>` : "");
    return `<tr><td style="${cell}">${esc(l.name)}</td><td style="${cell};text-align:right">${Number(l.quantity)}</td><td style="${cell};text-align:right">${price}</td><td style="${cell};text-align:right">${money(ls)}</td></tr>`;
  }).join("");
  const total = Number(inv.amount_total != null ? inv.amount_total : sub);
  const due = Number(inv.amount_residual != null ? inv.amount_residual : total);
  const partner = inv.partners ? inv.partners.name : "";
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;color:#152030">
    <div style="display:flex;justify-content:space-between;border-bottom:2px solid #152030;padding-bottom:14px">
      <div><div style="font-size:20px;font-weight:800">${esc(co.name || "Space Work")}</div><div style="color:#666;font-size:12px">${esc(co.legal_name || "")}${co.country ? "<br>" + esc(co.country) : ""}</div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:800;text-transform:uppercase;color:#333">${esc(docName)}</div><div style="color:#666">${esc(inv.number || "")}</div></div>
    </div>
    ${noteBlock}
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
    ${termsHtml(inv.narration)}
    <div style="margin-top:28px;border-top:1px solid #ddd;padding-top:10px;color:#888;font-size:11px;text-align:center">${esc(co.name || "Space Work")} &middot; sent via Orbit</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// The terms: the half of an invoice that is words rather than figures. The scope,
// the payment terms, the milestone being claimed, and on a facade quotation a
// four column payment schedule. They are held as a small fixed subset of HTML so
// that schedule stays a table and a defined term stays bold.
//
// This body is sent from the company's own verified domain, so the subset is
// rebuilt here from an allowlist before it goes. The app does the same with a
// real parser when the terms are saved; this is the second pass, in a worker with
// no DOM, and it keeps NO attribute at all except a link's href (http, https or
// mailto) and a cell's colspan and rowspan. Everything dangerous is removed with
// its contents, every other unknown tag is dropped and its words kept, and an
// email client throws style sheets away so each kept tag carries its own style.
const TERM_OK = { p: 1, br: 1, hr: 1, strong: 1, b: 1, em: 1, i: 1, u: 1, s: 1, sup: 1, sub: 1, h2: 1, h3: 1, h4: 1, ul: 1, ol: 1, li: 1, table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, th: 1, td: 1, a: 1, blockquote: 1 };
const TERM_IN = { p: 1, h2: 1, h3: 1, h4: 1, li: 1 };
const TERM_RENAME = { h1: "h2", h5: "h4", h6: "h4", strike: "s", del: "s", ins: "u" };
const TERM_WHOLE = /<(script|style|svg|math|iframe|object|embed|applet|noscript|template|form|select|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const TERM_STYLE = {
  p: "margin:0 0 7px", h2: "font-size:13px;font-weight:700;margin:15px 0 5px", h3: "font-size:12px;font-weight:700;margin:12px 0 4px",
  h4: "font-size:11.5px;font-weight:700;margin:10px 0 3px", ul: "margin:5px 0 8px 20px;padding:0", ol: "margin:5px 0 8px 20px;padding:0",
  li: "margin:0 0 3px", table: "border-collapse:collapse;width:100%;margin:8px 0 11px;font-size:11px",
  th: "border:1px solid #c9c9c9;padding:4px 6px;text-align:left;vertical-align:top;background:#f2f2f2;font-weight:700",
  td: "border:1px solid #c9c9c9;padding:4px 6px;text-align:left;vertical-align:top",
  blockquote: "margin:7px 0;padding-left:10px;border-left:2px solid #ddd;color:#555", a: "color:#152030"
};
// Plain text, the way every note was held before the terms became rich text, and
// the way the printed page has always read it: a row of a table is a line with
// " | " between the cells, and an indented line is a sub-heading.
function termsFromText(t) {
  const out = [];
  let tbl = null;
  const flush = () => {
    if (!tbl) return;
    out.push("<table>" + tbl.map((cells, i) => {
      const tg = i === 0 ? "th" : "td";
      return "<tr>" + cells.map(c => "<" + tg + ">" + esc(c) + "</" + tg + ">").join("") + "</tr>";
    }).join("") + "</table>");
    tbl = null;
  };
  String(t).split(/\r?\n/).forEach(ln => {
    if (ln.indexOf(" | ") >= 0) { (tbl = tbl || []).push(ln.trim().split(" | ").map(c => c.trim())); return; }
    flush();
    if (!ln.trim()) return;
    const tabs = /^\t{1,3}/.exec(ln);
    out.push(tabs ? '<p class="rt-in' + tabs[0].length + '">' + esc(ln.replace(/^\t+/, "")) + "</p>"
                  : "<p>" + esc(ln) + "</p>");
  });
  flush();
  return out.join("");
}
function termsClean(html) {
  let s = String(html).replace(/<!--[\s\S]*?-->/g, "").replace(TERM_WHOLE, "");
  // A link that is not a link is just its words, closing tag and all, so the
  // whole anchor is unwrapped here rather than leaving a stray </a> behind.
  s = s.replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, (m, attrs, inner) => {
    const h = /\bhref\s*=\s*(?:"([^"]*)"|\x27([^\x27]*)\x27|([^\s>]+))/i.exec(attrs) || [];
    const href = String(h[1] || h[2] || h[3] || "").replace(/[\u0000-\u0020]/g, "");
    return /^(?:https?:\/\/|mailto:)/i.test(href) ? m : inner;
  });
  s = s.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (m, slash, name, attrs) => {
    let tag = name.toLowerCase();
    if (TERM_RENAME[tag]) tag = TERM_RENAME[tag];
    if (!TERM_OK[tag]) return "";
    if (slash) return "</" + tag + ">";
    let at = "";
    if (tag === "a") {
      const h = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs) || [];
      const href = String(h[1] || h[2] || h[3] || "").replace(/[\u0000-\u0020]/g, "");
      if (!/^(?:https?:\/\/|mailto:)/i.test(href)) return "";
      at = ' href="' + esc(href) + '" target="_blank" rel="noopener noreferrer"';
    }
    if (tag === "th" || tag === "td") {
      const cs = parseInt((/\bcolspan\s*=\s*"?(\d+)/i.exec(attrs) || [])[1], 10);
      const rs = parseInt((/\browspan\s*=\s*"?(\d+)/i.exec(attrs) || [])[1], 10);
      if (cs > 1 && cs < 40) at += ' colspan="' + cs + '"';
      if (rs > 1 && rs < 200) at += ' rowspan="' + rs + '"';
    }
    // the one class the sanitiser writes, turned into the padding an email can read
    const lv = TERM_IN[tag] ? Number((/\brt-in([1-3])\b/.exec(attrs) || [])[1] || 0) : 0;
    const bits = [];
    if (TERM_STYLE[tag]) bits.push(TERM_STYLE[tag]);
    if (lv) bits.push("padding-left:" + (lv * 26) + "px");
    if (bits.length) at += ' style="' + bits.join(";") + '"';
    return "<" + tag + at + ">";
  });
  return s.replace(/<(?![/a-zA-Z])/g, "&lt;").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();
}
function termsHtml(narration) {
  const raw = String(narration == null ? "" : narration);
  if (!raw.trim()) return "";
  const isHtml = /<(?:p|div|br|table|tr|t[dh]|ul|ol|li|h[1-6]|strong|b|em|i|u|s|span|font|blockquote|a)\b[^>]*>/i.test(raw);
  const body = termsClean(isHtml ? raw : termsFromText(raw));
  if (!body) return "";
  return '<div style="margin:22px 0 0;border-top:1px solid #ddd;padding-top:12px">' +
    '<div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700;margin-bottom:6px">Terms and notes</div>' +
    '<div style="font-size:11.5px;color:#444;line-height:1.5">' + body + '</div></div>';
}

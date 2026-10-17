// Cloudflare Pages Function  ->  POST /api/send-document
// Emails the two documents a customer asks for after an invoice: the receipt for
// a payment, and the statement of account.
//
// Security, the same shape as send-invoice: a valid Supabase session is required;
// every figure is fetched with that same token, so RLS decides what the caller may
// read; the email body is built here, server-side, so a caller can never post
// arbitrary HTML and have it sent from the company's verified domain; and the
// database has the final say on whether the send is allowed at all
// (email_send_check: the company must be the caller's, the address must be one the
// company already holds, with hourly caps, and every attempt is written down).
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "senddoc-v1";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({ ok: true, version: VERSION, kinds: ["receipt", "statement"], hasResendKey: !!env.RESEND_API_KEY, hasFrom: !!env.INVOICE_FROM }), { headers: { "Content-Type": "application/json" } });
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
    const jsonHdr = Object.assign({ "Content-Type": "application/json" }, authHdr);
    const rpc = (fn, args, ms) => tfetch(supaUrl + "/rest/v1/rpc/" + fn, { method: "POST", headers: jsonHdr, body: JSON.stringify(args) }, ms || 8000);

    stage = "auth";
    const who = await tfetch(supaUrl + "/auth/v1/user", { headers: authHdr }, 8000);
    if (!who.ok) return json({ error: "Session expired, sign in again." }, 401);

    stage = "parse";
    const body = await request.json().catch(() => ({}));
    const kind = String(body.kind || "").toLowerCase();
    if (kind !== "receipt" && kind !== "statement") return json({ error: "Ask for a receipt or a statement." }, 400);
    if (!env.RESEND_API_KEY) return json({ error: "Email is not configured: RESEND_API_KEY is not set on the site." }, 200);

    // ---------------------------------------------------------------- gather
    let doc = null, partnerId = null, companyId = null, who2 = "", docLabel = "", docRef = "";
    if (kind === "receipt") {
      stage = "receipt";
      const payId = String(body.payment_id || "");
      if (!UUID.test(payId)) return json({ error: "That payment id is not valid." }, 400);
      // a receipt that goes out has a number, and asking twice gives the same one
      const iss = await rpc("payment_receipt_issue", { p_payment: payId });
      if (!iss.ok) {
        const ij = await iss.json().catch(() => null);
        return json({ error: (ij && (ij.message || ij.hint)) || "Could not issue a receipt number for that payment." }, 200);
      }
      const rr = await rpc("payment_receipt", { p_payment: payId });
      doc = await rr.json().catch(() => null);
      if (!doc || !doc.payment) return json({ error: "That payment was not found, or you may not read it." }, 404);
      companyId = doc.company && doc.company.id;
      who2 = (doc.partner && doc.partner.name) || "";
      docLabel = "Receipt";
      docRef = (doc.payment && doc.payment.receipt_no) || "";
    } else {
      stage = "statement";
      partnerId = String(body.partner_id || "");
      if (!UUID.test(partnerId)) return json({ error: "That contact id is not valid." }, 400);
      const pRes = await tfetch(supaUrl + "/rest/v1/partners?id=eq." + encodeURIComponent(partnerId) + "&select=name,email,company_id,companies(id,name,currency_code,profile)", { headers: authHdr }, 8000);
      const pArr = await pRes.json().catch(() => null);
      const pt = Array.isArray(pArr) ? pArr[0] : null;
      if (!pt) return json({ error: "That contact was not found, or you may not read it." }, 404);
      companyId = pt.company_id;
      who2 = pt.name || "";
      const from = body.from && /^\d{4}-\d{2}-\d{2}$/.test(String(body.from)) ? String(body.from) : null;
      const upto = body.to_date && /^\d{4}-\d{2}-\d{2}$/.test(String(body.to_date)) ? String(body.to_date) : null;
      const sRes = await rpc("partner_statement", { p_company: companyId, p_partner: partnerId, p_from: from, p_to: upto });
      const rows = await sRes.json().catch(() => null);
      if (!Array.isArray(rows)) return json({ error: "Could not build the statement.", detail: rows }, 200);
      const co = pt.companies || {};
      doc = { rows, partner: { name: pt.name, email: pt.email }, from, to: upto, company: { id: co.id, name: co.name, currency_code: co.currency_code, legal_name: (co.profile || {}).legal_name, country: (co.profile || {}).country, email: (co.profile || {}).email, phone: (co.profile || {}).phone } };
      docLabel = "Statement of Account";
      docRef = "";
    }
    if (!companyId) return json({ error: "That document has no company on it." }, 400);

    // ---------------------------------------------------------------- recipient
    let recipient = String(body.to || "").trim();
    if (!recipient) recipient = ((kind === "receipt" ? (doc.partner || {}).email : (doc.partner || {}).email) || "").trim();
    if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) return json({ error: "No valid recipient email. Add one on the contact, or type one in the box." }, 400);

    // Orbit only sends to an address the company already holds. When the sender asked
    // for this address to be kept on the contact, it is saved first, with the database
    // making the same permission check an edit of that contact would make. That turns
    // a refusal the user could not act on into one step they chose.
    if (body.save_email && !body.dry_run) {
      stage = "save-email";
      const pid = kind === "receipt" ? (body.partner_id || null) : partnerId;
      if (UUID.test(String(pid || ""))) {
        const se = await rpc("partner_email_set", { p_partner: pid, p_email: recipient });
        if (!se.ok) {
          const sj = await se.json().catch(() => null);
          return json({ error: (sj && (sj.message || sj.hint)) || "Could not save that address on the contact." }, 200);
        }
      }
    }

    const co = doc.company || {};
    const from = (env.INVOICE_FROM || "invoices@spacework.ai").trim();
    const note = typeof body.note === "string" ? body.note.slice(0, 2000) : "";
    const subject = (body.subject ? String(body.subject).replace(/[\r\n]+/g, " ").trim().slice(0, 200) : "")
      || (docLabel + (docRef ? " " + docRef : "") + " from " + (co.name || "Space Work"));

    const html = kind === "receipt" ? receiptHtml(doc, note) : statementHtml(doc, note);

    // The preview in the app is this very HTML, fetched from here, so "what your
    // customer receives" is the bytes that would be sent rather than a second
    // renderer in the browser that can drift from this one. A preview is not a send:
    // it stops short of the gate, so it neither logs an attempt nor spends the
    // hourly allowance.
    if (body.dry_run) return json({ ok: true, dry: true, version: VERSION, recipient, from, subject, kind, ref: docRef, who: who2, html });

    stage = "check-send";
    let sendOk = { ok: false, reason: "The send could not be checked." };
    try {
      const ck = await rpc("email_send_check", { p_company: companyId, p_kind: kind, p_to: recipient, p_doc: kind === "receipt" ? body.payment_id : partnerId, p_subject: subject });
      const cj = await ck.json().catch(() => null);
      if (cj && typeof cj.ok === "boolean") sendOk = cj;
    } catch (e) { sendOk = { ok: false, reason: "The send could not be checked. Try again." }; }
    if (!sendOk.ok) return json({ error: sendOk.reason || "That email may not be sent." }, 403);

    stage = "resend";
    let send, sj;
    try {
      send = await tfetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + String(env.RESEND_API_KEY).trim(), "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [recipient], subject, html })
      }, 12000);
    } catch (e) {
      return json({ error: "Could not reach the email service (" + String((e && e.name) || e) + "). Check the from address is on a verified domain.", stage }, 200);
    }
    sj = await send.json().catch(() => ({}));
    if (!send.ok) return json({ error: (sj && (sj.message || (sj.error && sj.error.message))) || ("Email service rejected the message (HTTP " + send.status + ")."), detail: sj, from }, 200);
    return json({ ok: true, id: sj.id, to: recipient, from, kind, ref: docRef });
  } catch (e) {
    return json({ error: String((e && e.message) || e), stage }, 200);
  }
}

// ---------------------------------------------------------------- rendering
function esc(s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function money(n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function noteBlock(note) {
  return (note && String(note).trim())
    ? `<div style="margin:18px 0;padding:13px 15px;background:#f4f6f9;border-left:3px solid #152030;border-radius:6px;font-size:13.5px;white-space:pre-wrap;color:#333">${esc(note)}</div>`
    : "";
}
function head(co, title, ref) {
  return `<div style="display:flex;justify-content:space-between;border-bottom:2px solid #152030;padding-bottom:14px">
    <div><div style="font-size:20px;font-weight:800">${esc(co.name || "Space Work")}</div><div style="color:#666;font-size:12px">${esc(co.legal_name || "")}${co.country ? "<br>" + esc(co.country) : ""}</div></div>
    <div style="text-align:right"><div style="font-size:22px;font-weight:800;text-transform:uppercase;color:#333">${esc(title)}</div><div style="color:#666">${esc(ref || "")}</div></div>
  </div>`;
}
function foot(co) {
  return `<div style="margin-top:28px;border-top:1px solid #ddd;padding-top:10px;color:#888;font-size:11px;text-align:center">${esc(co.name || "Space Work")}${co.email ? " &middot; " + esc(co.email) : ""}${co.phone ? " &middot; " + esc(co.phone) : ""} &middot; sent via Orbit</div>`;
}
function wrap(inner) {
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:0 auto;color:#152030">${inner}</div>`;
}

function receiptHtml(d, note) {
  const co = d.company || {}, p = d.payment || {}, pt = d.partner || {}, inv = d.invoice;
  const cc = p.currency_code || co.currency_code || "USD";
  // A receipt says one thing loudly: we have your money. Everything else is detail.
  const paid = `<div style="margin:20px 0;padding:18px 20px;background:#f1f6f2;border:1px solid #cfe3d4;border-radius:8px;text-align:center">
    <div style="text-transform:uppercase;font-size:10.5px;letter-spacing:.06em;color:#4a6b53;font-weight:700">Received with thanks</div>
    <div style="font-size:30px;font-weight:800;margin-top:4px;color:#1d4b2a">${cc} ${money(p.amount)}</div></div>`;
  const rows = [
    ["Received from", pt.name || p.payer_name || ""],
    ["Date", p.date || ""],
    ["Method", p.method || "-"],
    ["Reference", p.reference || p.memo || "-"],
    ["Receipt no.", p.receipt_no || "-"]
  ].filter(r => r[1] !== "").map(r => `<tr><td style="padding:6px 16px 6px 0;color:#666;white-space:nowrap">${esc(r[0])}</td><td style="padding:6px 0;font-weight:600">${esc(String(r[1]))}</td></tr>`).join("");
  const against = inv
    ? `<div style="margin:18px 0 0;border-top:1px solid #ddd;padding-top:12px;font-size:13px">
         <div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700;margin-bottom:6px">What this was for</div>
         <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Invoice ${esc(inv.number || "")} of ${esc(inv.invoice_date || "")}</span><span>${esc(inv.currency_code || cc)} ${money(inv.amount_total)}</span></div>
         <div style="display:flex;justify-content:space-between;padding:3px 0"><span>Paid by this receipt</span><span>${cc} ${money(p.amount)}</span></div>
         <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #eee;font-weight:700"><span>Still outstanding on that invoice</span><span>${esc(inv.currency_code || cc)} ${money(inv.amount_residual)}</span></div>
       </div>`
    : `<div style="margin:18px 0 0;border-top:1px solid #ddd;padding-top:12px;font-size:13px;color:#666">This payment is not matched to a single invoice; it is credited to the account.</div>`;
  const bal = Number(d.account_balance || 0);
  const standing = `<div style="margin-top:14px;font-size:13px;color:#444">${Math.abs(bal) < 0.005
    ? "The account is now settled in full."
    : bal > 0 ? "The account stands at " + (co.currency_code || cc) + " " + money(bal) + " outstanding."
              : "The account is in credit by " + (co.currency_code || cc) + " " + money(-bal) + "."}</div>`;
  return wrap(head(co, "Receipt", p.receipt_no) + noteBlock(note) + paid +
    `<table style="font-size:13px;border-collapse:collapse">${rows}</table>` + against + standing + foot(co));
}

function statementHtml(d, note) {
  const co = d.company || {}, pt = d.partner || {}, rows = d.rows || [];
  const cc = co.currency_code || "USD";
  const cell = "padding:7px 8px;border-bottom:1px solid #eee";
  const num = cell + ";text-align:right;white-space:nowrap";
  const body = rows.map(r => {
    const strong = r.row_kind !== "movement";
    const tint = r.row_kind === "opening" ? "background:#fafbfc" : r.row_kind === "closing" ? "background:#f1f6f2" : r.row_kind === "total" ? "background:#fafbfc" : "";
    const label = r.row_kind === "movement"
      ? `<b>${esc(r.doc_no || "")}</b>${r.doc_type ? `<div style="font-size:11px;color:#888">${esc(r.doc_type)}</div>` : ""}`
      : "";
    const desc = esc(r.description || "");
    return `<tr style="${tint}${strong ? ";font-weight:700" : ""}">
      <td style="${cell}">${esc(r.doc_date || "")}</td>
      <td style="${cell}">${label}</td>
      <td style="${cell}">${desc}</td>
      <td style="${num}">${r.debit == null ? "" : money(r.debit)}</td>
      <td style="${num}">${r.credit == null ? "" : money(r.credit)}</td>
      <td style="${num}">${money(r.balance)}</td></tr>`;
  }).join("");
  const closing = rows.filter(r => r.row_kind === "closing")[0];
  const bal = Number((closing && closing.balance) || 0);
  const verdict = Math.abs(bal) < 0.005
    ? "Nothing is owed either way."
    : bal > 0 ? `${esc(pt.name || "This account")} owes ${cc} ${money(bal)}.`
              : `This account is in credit by ${cc} ${money(-bal)}.`;
  const period = (d.from ? "From " + esc(d.from) : "All movements") + (d.to ? " to " + esc(d.to) : "");
  const th = "text-align:left;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666";
  const thn = th + ";text-align:right";
  return wrap(head(co, "Statement of Account", "") + noteBlock(note) +
    `<div style="display:flex;justify-content:space-between;margin:18px 0;font-size:13px">
       <div><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700">Account</div><div style="font-weight:600">${esc(pt.name || "")}</div></div>
       <div style="text-align:right"><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700">Period</div><div>${period}</div></div>
     </div>
     <table style="width:100%;border-collapse:collapse;font-size:12.5px">
       <thead><tr><th style="${th}">Date</th><th style="${th}">Document</th><th style="${th}">Description</th><th style="${thn}">Debit</th><th style="${thn}">Credit</th><th style="${thn}">Balance</th></tr></thead>
       <tbody>${body}</tbody>
     </table>
     <div style="margin-top:16px;padding:13px 15px;background:#f4f6f9;border-radius:6px;font-size:14px;font-weight:700">${verdict}</div>` +
    foot(co));
}

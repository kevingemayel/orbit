// Cloudflare Pages Function - the multi-tenant WEBSITE renderer.
// Resolves the incoming hostname (Host header, or ?host= for preview) + path to a
// published page via the site_render() SECURITY DEFINER RPC, then renders the page's
// block tree to HTML. One function serves every customer site. In production a
// dedicated Worker bound to *.sites.spacework.ai + custom hostnames runs this same
// logic at each site's root; here it also answers /site/* on orbit for preview/testing.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// richtext / embed blocks are the site owner's own authored HTML (like a Webflow embed) - passed through.
const raw = (s) => String(s == null ? "" : s);

function btn(text, href, kind) {
  if (!text) return "";
  const cls = kind === "ghost" ? "b-btn ghost" : "b-btn";
  return `<a class="${cls}" href="${esc(href || "#")}">${esc(text)}</a>`;
}

function renderBlock(b) {
  const p = (b && b.props) || {};
  switch (b && b.type) {
    case "hero":
      return `<section class="b-hero${p.image ? " has-img" : ""}"${p.image ? ` style="background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url('${esc(p.image)}')"` : ""}><div class="b-wrap b-hero-in b-align-${esc(p.align || "center")}">${p.eyebrow ? `<div class="b-eyebrow">${esc(p.eyebrow)}</div>` : ""}<h1>${esc(p.title || "")}</h1>${p.subtitle ? `<p class="b-lede">${esc(p.subtitle)}</p>` : ""}${p.buttonText ? `<div class="b-btns">${btn(p.buttonText, p.buttonHref)}${p.button2Text ? btn(p.button2Text, p.button2Href, "ghost") : ""}</div>` : ""}</div></section>`;
    case "heading":
      return `<section class="b-sec"><div class="b-wrap b-align-${esc(p.align || "left")}"><h2 class="b-h2">${esc(p.text || "")}</h2>${p.subtitle ? `<p class="b-lede">${esc(p.subtitle)}</p>` : ""}</div></section>`;
    case "richtext":
      return `<section class="b-sec"><div class="b-wrap b-rich">${raw(p.html || "")}</div></section>`;
    case "text":
      return `<section class="b-sec"><div class="b-wrap b-rich"><p>${esc(p.text || "").replace(/\n/g, "<br>")}</p></div></section>`;
    case "image":
      return `<section class="b-sec"><div class="b-wrap"><figure class="b-fig">${p.src ? `<img src="${esc(p.src)}" alt="${esc(p.alt || "")}" loading="lazy">` : ""}${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}</figure></div></section>`;
    case "features":
    case "columns": {
      const items = Array.isArray(p.items) ? p.items : [];
      const n = Math.max(1, Math.min(4, Number(p.columns) || (items.length >= 3 ? 3 : items.length || 3)));
      const cards = items.map((it) => `<div class="b-card">${it.icon ? `<div class="b-card-ic">${esc(it.icon)}</div>` : ""}${it.title ? `<h3>${esc(it.title)}</h3>` : ""}${it.text ? `<p>${esc(it.text)}</p>` : ""}</div>`).join("");
      return `<section class="b-sec"><div class="b-wrap">${p.title ? `<h2 class="b-h2 b-align-center">${esc(p.title)}</h2>` : ""}<div class="b-grid" style="--cols:${n}">${cards}</div></div></section>`;
    }
    case "cta":
      return `<section class="b-sec b-cta"><div class="b-wrap b-align-center"><h2 class="b-h2">${esc(p.title || "")}</h2>${p.text ? `<p class="b-lede">${esc(p.text)}</p>` : ""}${p.buttonText ? `<div class="b-btns">${btn(p.buttonText, p.buttonHref)}</div>` : ""}</div></section>`;
    case "button":
      return `<section class="b-sec"><div class="b-wrap b-align-${esc(p.align || "left")}">${btn(p.text, p.href)}</div></section>`;
    case "form": {
      const fields = Array.isArray(p.fields) && p.fields.length ? p.fields : [{ name: "name", label: "Name", type: "text" }, { name: "email", label: "Email", type: "email" }, { name: "message", label: "Message", type: "textarea" }];
      const rows = fields.map((f) => {
        const nm = esc(f.name || "field"), lb = esc(f.label || f.name || "");
        const input = (f.type === "textarea") ? `<textarea name="${nm}" rows="4"${f.required ? " required" : ""}></textarea>` : `<input name="${nm}" type="${esc(f.type || "text")}"${f.required ? " required" : ""}>`;
        return `<label class="b-fld"><span>${lb}${f.required ? " *" : ""}</span>${input}</label>`;
      }).join("");
      return `<section class="b-sec"><div class="b-wrap b-formwrap">${p.title ? `<h2 class="b-h2 b-align-center">${esc(p.title)}</h2>` : ""}<form class="b-form" data-form="${esc(p.formKey || "contact")}">${rows}<button type="submit" class="b-btn">${esc(p.submitText || "Send")}</button><p class="b-form-msg" hidden></p></form></div></section>`;
    }
    case "spacer":
      return `<div style="height:${Math.max(0, Math.min(240, Number(p.size) || 48))}px"></div>`;
    case "embed":
    case "html":
      return `<section class="b-sec"><div class="b-wrap">${raw(p.html || "")}</div></section>`;
    default:
      return "";
  }
}

function pageHTML(data, host) {
  const site = data.site || {}, page = data.page || {}, nav = Array.isArray(data.nav) ? data.nav : [];
  const meta = page.meta || {}, theme = site.theme || {};
  const primary = theme.primary || "#2f6bff", bg = theme.bg || "#ffffff", ink = theme.ink || "#16171c";
  const font = theme.font || "Inter", radius = theme.radius != null ? theme.radius : 12;
  const fontLink = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800&display=swap`;
  const blocks = (Array.isArray(page.content) ? page.content : []).map(renderBlock).join("");
  const navHtml = nav.map((n) => `<a href="${esc(n.path === "/" ? "/" : n.path)}"${n.path === page.path ? ' class="on"' : ""}>${esc(n.title || n.path)}</a>`).join("");
  const title = esc(page.title || site.name || "");
  const desc = esc(meta.description || "");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>${desc ? `<meta name="description" content="${desc}">` : ""}
<meta property="og:title" content="${title}">${desc ? `<meta property="og:description" content="${desc}">` : ""}${meta.ogImage ? `<meta property="og:image" content="${esc(meta.ogImage)}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${fontLink}">
<style>
:root{--pri:${esc(primary)};--bg:${esc(bg)};--ink:${esc(ink)};--rad:${Number(radius)}px;--muted:color-mix(in srgb,var(--ink) 60%,var(--bg))}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font-family:'${esc(font)}',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:var(--pri)}
.b-wrap{max-width:1080px;margin:0 auto;padding:0 22px}
.b-nav{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:saturate(1.4) blur(8px);border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,var(--bg))}
.b-nav-in{display:flex;align-items:center;gap:20px;height:62px}
.b-nav .b-brand{font-weight:800;font-size:19px;letter-spacing:-.02em;margin-right:auto;color:var(--ink);text-decoration:none}
.b-nav a{color:var(--ink);text-decoration:none;font-weight:500;font-size:15px;opacity:.8}.b-nav a:hover,.b-nav a.on{opacity:1;color:var(--pri)}
.b-sec{padding:52px 0}.b-hero{padding:96px 0;color:var(--ink)}.b-hero.has-img{color:#fff}
.b-hero-in h1{font-size:clamp(34px,6vw,60px);line-height:1.05;letter-spacing:-.03em;margin:0 0 14px;font-weight:800;text-wrap:balance}
.b-lede{font-size:clamp(16px,2.2vw,20px);color:var(--muted);max-width:60ch;margin:0 auto 8px}.b-hero.has-img .b-lede{color:rgba(255,255,255,.9)}
.b-align-center{text-align:center;margin-left:auto;margin-right:auto}.b-align-center .b-lede{margin-left:auto;margin-right:auto}.b-align-right{text-align:right}
.b-eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pri);margin-bottom:12px}
.b-btns{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}.b-align-center .b-btns{justify-content:center}
.b-btn{display:inline-block;background:var(--pri);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:var(--rad);border:1px solid var(--pri)}
.b-btn.ghost{background:transparent;color:var(--ink)}.b-hero.has-img .b-btn.ghost{color:#fff;border-color:#fff}
.b-h2{font-size:clamp(26px,4vw,40px);letter-spacing:-.02em;margin:0 0 10px;font-weight:700;text-wrap:balance}
.b-grid{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:18px;margin-top:26px}
@media(max-width:760px){.b-grid{grid-template-columns:1fr}}
.b-card{background:color-mix(in srgb,var(--ink) 3%,var(--bg));border:1px solid color-mix(in srgb,var(--ink) 10%,var(--bg));border-radius:var(--rad);padding:22px}
.b-card-ic{font-size:26px;margin-bottom:10px}.b-card h3{margin:0 0 6px;font-size:18px}.b-card p{margin:0;color:var(--muted)}
.b-cta{background:color-mix(in srgb,var(--pri) 8%,var(--bg))}
.b-rich{max-width:72ch;margin:0 auto}.b-fig{margin:0}.b-fig figcaption{color:var(--muted);font-size:13px;margin-top:8px;text-align:center}
.b-formwrap{max-width:560px;margin:0 auto}.b-form{display:grid;gap:14px}.b-fld{display:grid;gap:6px;font-size:14px;font-weight:500}
.b-fld input,.b-fld textarea{font:inherit;padding:11px 13px;border:1px solid color-mix(in srgb,var(--ink) 20%,var(--bg));border-radius:var(--rad);background:var(--bg);color:var(--ink)}
.b-form-msg{margin:0;font-size:14px;color:var(--pri)}
.b-foot{padding:40px 0;border-top:1px solid color-mix(in srgb,var(--ink) 10%,var(--bg));color:var(--muted);font-size:13px}
</style></head><body>
<nav class="b-nav"><div class="b-wrap b-nav-in"><a class="b-brand" href="/">${esc(site.name || "")}</a>${navHtml}</div></nav>
<main>${blocks || `<section class="b-sec"><div class="b-wrap"><p class="b-lede">This page has no content yet.</p></div></section>`}</main>
<footer class="b-foot"><div class="b-wrap">&copy; ${new Date().getFullYear()} ${esc(site.name || "")}</div></footer>
<script>(function(){var SUPA=${JSON.stringify(SUPA)},ANON=${JSON.stringify(ANON)},HOST=${JSON.stringify(host)};
document.querySelectorAll('form.b-form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=v;});var msg=f.querySelector('.b-form-msg');
fetch(SUPA+'/rest/v1/rpc/site_form_submit',{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+ANON},body:JSON.stringify({p_host:HOST,p_form:f.getAttribute('data-form'),p_data:d})}).then(function(r){return r.json();}).then(function(){f.reset();if(msg){msg.hidden=false;msg.textContent='Thanks - your message was sent.';}}).catch(function(){if(msg){msg.hidden=false;msg.textContent='Sorry, that did not send. Please try again.';}});});});})();</script>
</body></html>`;
}

function notFound(host) {
  return `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Not found</title><body style="font-family:system-ui;display:grid;place-items:center;height:90vh;margin:0;color:#444;text-align:center"><div><h1 style="font-size:60px;margin:0">404</h1><p>No published page here${host ? " for <b>" + esc(host) + "</b>" : ""}.</p></div></body>`;
}

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const host = (url.searchParams.get("host") || request.headers.get("host") || "").toLowerCase();
  // path: ?path= override for preview; else the segments after /site/
  let path = url.searchParams.get("path");
  if (!path) { const seg = params && params.path ? (Array.isArray(params.path) ? params.path : [params.path]) : []; path = "/" + seg.join("/"); }
  if (!path || path === "/index.html") path = "/";

  const H404 = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };
  try {
    const r = await fetch(SUPA + "/rest/v1/rpc/site_render", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": ANON, "Authorization": "Bearer " + ANON },
      body: JSON.stringify({ p_host: host, p_path: path })
    });
    if (!r.ok) return new Response(notFound(host), { status: 404, headers: H404 });
    const data = await r.json();
    if (!data || !data.page) return new Response(notFound(host), { status: 404, headers: H404 });
    return new Response(pageHTML(data, host), { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60, s-maxage=300" } });
  } catch (e) {
    return new Response(notFound(host), { status: 404, headers: H404 });
  }
}

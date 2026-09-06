// AUTO-DERIVED single-source render engine (from functions/site/render-core.js). Consumed by
// the Pages Functions, the site Worker, AND the in-app visual builder. Sets globalThis.SiteEngine.
// Regenerate this file whenever render-core.js changes.
(function(){
// Shared website render engine - imported by BOTH the Pages preview function
// (functions/site/[[path]].js) and the dedicated site Worker (worker/index.js).
// Resolves a hostname+path to a published page via site_render() and renders the
// block tree to a themed, responsive Bootstrap 5 page. Pure + dependency-free.
//
// SCALABILITY: sections live in the BLOCKS registry (type -> function). Adding a new
// section = one entry here + one field set in the app editor. No schema change ever
// (pages are a jsonb block tree). One Worker serves every tenant; Bootstrap + fonts
// come from a CDN so nothing per-site is stored.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const BOOTSTRAP_CSS = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
const BOOTSTRAP_JS = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js";
const BOOTSTRAP_ICONS = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const raw = (s) => String(s == null ? "" : s);   // owner-authored HTML (richtext/embed), passed through like a Webflow embed
const arr = (x) => (Array.isArray(x) ? x : []);
function hexRgb(h) { h = String(h || "").replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(/^[0-9a-f]{6}$/i.test(h) ? h : "2f6bff", 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

// An icon token is either a Bootstrap Icons name ("bi-lightning") or a literal emoji/char.
function icon(tok, cls) {
  tok = String(tok || "").trim(); if (!tok) return "";
  if (/^bi[-\s]/i.test(tok) || /^bi$/i.test(tok)) return '<i class="bi ' + esc(tok.replace(/\s+/, "-")) + ' ' + (cls || "") + '"></i>';
  return '<span class="' + (cls || "") + '">' + esc(tok) + '</span>';
}
function btn(b, variant, size) {
  if (!b || !b.text) return "";
  const v = variant || "primary", sz = size ? " btn-" + size : "";
  return '<a class="btn btn-' + v + sz + '" href="' + esc(b.href || "#") + '"' + (/^https?:/i.test(b.href || "") ? ' rel="noopener"' : "") + '>' + esc(b.text) + '</a>';
}
function heroBtns(p, onImg) {
  const a = p.buttonText ? btn({ text: p.buttonText, href: p.buttonHref }, "primary", "lg") : "";
  const b = p.button2Text ? btn({ text: p.button2Text, href: p.button2Href }, onImg ? "light" : "outline-primary", "lg") : "";
  return (a || b) ? '<div class="d-flex flex-wrap gap-2 mt-4 ' + (p.align === "center" ? "justify-content-center" : p.align === "right" ? "justify-content-end" : "") + '">' + a + b + "</div>" : "";
}
function alignClass(a) { return a === "center" ? "text-center" : a === "right" ? "text-end" : ""; }
function sectionPad(p) { return p.pad === "sm" ? "py-4" : p.pad === "lg" ? "py-6" : "py-5"; }
function bgStyle(p) { return p.bg === "light" ? ' style="background:var(--sw-soft)"' : p.bg === "dark" ? ' class="text-bg-dark"' : ""; }

// -------- section renderers (the template library) --------
const BLOCKS = {
  hero(p) {
    const onImg = !!p.image, split = !onImg && !!p.sideImage;
    const inner =
      (p.eyebrow ? '<div class="text-uppercase fw-semibold small mb-2" style="letter-spacing:.12em;color:var(--sw-pri)">' + esc(p.eyebrow) + "</div>" : "") +
      '<h1 class="display-4 fw-bold lh-1 mb-3">' + esc(p.title || "") + "</h1>" +
      (p.subtitle ? '<p class="fs-5 ' + (onImg ? "text-white-50" : "text-body-secondary") + ' mb-0" style="max-width:44ch">' + esc(p.subtitle) + "</p>" : "") +
      heroBtns(p, onImg);
    if (split) {
      return '<section class="py-5 py-lg-6"><div class="container"><div class="row align-items-center g-5"><div class="col-lg-6">' + inner +
        '</div><div class="col-lg-6"><img src="' + esc(p.sideImage) + '" alt="" class="img-fluid rounded-4 shadow-sm"></div></div></div></section>';
    }
    const style = onImg ? ' style="background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),url(\'' + esc(p.image).replace(/'/g, "%27") + "') center/cover\"" : "";
    return '<section class="py-6' + (onImg ? " text-white" : "") + '"' + style + '><div class="container"><div class="' + (p.align === "center" ? "mx-auto text-center" : alignClass(p.align)) + '" style="max-width:' + (p.align === "center" ? "760px" : "640px") + '">' + inner + "</div></div></section>";
  },
  heading(p) {
    const a = p.align || "center";
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container ' + alignClass(a) + '"><h2 class="fw-bold mb-2">' + esc(p.text || "") + "</h2>" +
      (p.subtitle ? '<p class="fs-5 text-body-secondary ' + (a === "center" ? "mx-auto" : "") + ' mb-0" style="max-width:60ch">' + esc(p.subtitle) + "</p>" : "") + "</div></section>";
  },
  richtext(p) { return '<section class="' + sectionPad(p) + '"><div class="container"><div class="mx-auto" style="max-width:760px">' + raw(p.html || "") + "</div></div></section>"; },
  text(p) { return '<section class="' + sectionPad(p) + '"><div class="container"><div class="mx-auto fs-5" style="max-width:720px">' + esc(p.text || "").split("\n").map((l) => "<p>" + esc(l) + "</p>").join("") + "</div></div></section>"; },
  image(p) {
    return '<section class="' + sectionPad(p) + '"><div class="container text-center"><figure class="figure">' +
      (p.src ? '<img src="' + esc(p.src) + '" alt="' + esc(p.alt || "") + '" class="figure-img img-fluid rounded-4" loading="lazy">' : "") +
      (p.caption ? '<figcaption class="figure-caption">' + esc(p.caption) + "</figcaption>" : "") + "</figure></div></section>";
  },
  features(p) {
    const items = arr(p.items), n = Math.max(1, Math.min(4, Number(p.columns) || (items.length % 4 === 0 ? 4 : 3)));
    const col = "col-sm-6 col-lg-" + (12 / n);
    const cards = items.map((it) => '<div class="' + col + '"><div class="h-100 p-4 rounded-4 border bg-body-tertiary">' +
      (it.icon ? '<div class="fs-2 mb-2" style="color:var(--sw-pri)">' + icon(it.icon) + "</div>" : "") +
      (it.title ? '<h3 class="h5 fw-semibold">' + esc(it.title) + "</h3>" : "") +
      (it.text ? '<p class="text-body-secondary mb-0">' + esc(it.text) + "</p>" : "") + "</div></div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="row g-4">' + cards + "</div></div></section>";
  },
  mediaText(p) {
    const media = '<div class="col-lg-6">' + (p.image ? '<img src="' + esc(p.image) + '" alt="" class="img-fluid rounded-4 shadow-sm">' : "") + "</div>";
    const text = '<div class="col-lg-6">' +
      (p.eyebrow ? '<div class="text-uppercase fw-semibold small mb-2" style="letter-spacing:.12em;color:var(--sw-pri)">' + esc(p.eyebrow) + "</div>" : "") +
      (p.title ? '<h2 class="fw-bold mb-3">' + esc(p.title) + "</h2>" : "") +
      (p.text ? '<div class="fs-5 text-body-secondary">' + esc(p.text).split("\n").map((l) => "<p>" + esc(l) + "</p>").join("") + "</div>" : "") +
      (p.buttonText ? btn({ text: p.buttonText, href: p.buttonHref }, "primary") : "") + "</div>";
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container"><div class="row g-5 align-items-center">' + (p.imageRight ? text + media : media + text) + "</div></div></section>";
  },
  stats(p) {
    const items = arr(p.items);
    const cells = items.map((it) => '<div class="col"><div class="display-5 fw-bold" style="color:var(--sw-pri)">' + esc(it.value || "") + '</div><div class="text-body-secondary">' + esc(it.label || "") + "</div></div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container"><div class="row row-cols-2 row-cols-md-' + Math.min(4, items.length || 1) + ' g-4 text-center">' + cells + "</div></div></section>";
  },
  pricing(p) {
    const items = arr(p.items), n = Math.max(1, Math.min(4, items.length || 3));
    const cards = items.map((pl) => '<div class="col-lg-' + (12 / n) + '"><div class="h-100 p-4 rounded-4 border ' + (pl.featured ? "border-2 shadow" : "") + '" ' + (pl.featured ? 'style="border-color:var(--sw-pri)!important"' : "") + ">" +
      (pl.featured ? '<span class="badge mb-2" style="background:var(--sw-pri)">' + esc(pl.badge || "Popular") + "</span>" : "") +
      '<h3 class="h5 fw-semibold">' + esc(pl.name || "") + "</h3>" +
      '<div class="my-2"><span class="display-6 fw-bold">' + esc(pl.price || "") + '</span> <span class="text-body-secondary">' + esc(pl.period || "") + "</span></div>" +
      '<ul class="list-unstyled small mb-3">' + arr(pl.features).map((f) => '<li class="mb-1"><i class="bi bi-check2 me-1" style="color:var(--sw-pri)"></i>' + esc(f) + "</li>").join("") + "</ul>" +
      (pl.buttonText ? btn({ text: pl.buttonText, href: pl.buttonHref }, pl.featured ? "primary" : "outline-primary") + "" : "") + "</div></div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="row g-4 justify-content-center">' + cards + "</div></div></section>";
  },
  team(p) {
    const items = arr(p.items), n = Math.max(2, Math.min(4, Number(p.columns) || 4));
    const cards = items.map((m) => '<div class="col-6 col-lg-' + (12 / n) + ' text-center">' +
      (m.image ? '<img src="' + esc(m.image) + '" alt="" class="rounded-circle mb-2" width="112" height="112" style="object-fit:cover">' : '<div class="rounded-circle bg-body-tertiary mx-auto mb-2 d-flex align-items-center justify-content-center" style="width:112px;height:112px;font-size:2rem;color:var(--sw-pri)"><i class="bi bi-person"></i></div>') +
      '<div class="fw-semibold">' + esc(m.name || "") + "</div>" + (m.role ? '<div class="small text-body-secondary">' + esc(m.role) + "</div>" : "") + "</div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="row g-4">' + cards + "</div></div></section>";
  },
  testimonials(p) {
    const items = arr(p.items), n = Math.max(1, Math.min(3, items.length >= 3 ? 3 : items.length || 1));
    const cards = items.map((q) => '<div class="col-lg-' + (12 / n) + '"><figure class="h-100 p-4 rounded-4 border bg-body-tertiary mb-0">' +
      '<blockquote class="blockquote fs-6">' + '<i class="bi bi-quote fs-3" style="color:var(--sw-pri)"></i><p>' + esc(q.text || "") + "</p></blockquote>" +
      '<figcaption class="blockquote-footer mb-0">' + esc(q.name || "") + (q.role ? ' <cite>' + esc(q.role) + "</cite>" : "") + "</figcaption></figure></div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="row g-4">' + cards + "</div></div></section>";
  },
  gallery(p) {
    const items = arr(p.items), n = Math.max(2, Math.min(4, Number(p.columns) || 3));
    const cells = items.map((g) => '<div class="col-6 col-md-' + (12 / n) + '"><img src="' + esc(g.src || g) + '" alt="' + esc(g.alt || "") + '" class="img-fluid rounded-3 w-100" style="aspect-ratio:4/3;object-fit:cover" loading="lazy"></div>').join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="row g-3">' + cells + "</div></div></section>";
  },
  logos(p) {
    const items = arr(p.items);
    const cells = items.map((g) => '<div class="col"><img src="' + esc(g.src || g) + '" alt="' + esc(g.alt || "") + '" style="height:34px;max-width:130px;object-fit:contain;filter:grayscale(1);opacity:.7"></div>').join("");
    return '<section class="py-4"' + bgStyle(p) + '><div class="container">' + (p.title ? '<p class="text-center text-body-secondary small text-uppercase mb-3" style="letter-spacing:.1em">' + esc(p.title) + "</p>" : "") + '<div class="row row-cols-2 row-cols-md-' + Math.min(6, items.length || 1) + ' g-4 align-items-center justify-content-center text-center">' + cells + "</div></div></section>";
  },
  faq(p) {
    const items = arr(p.items), id = "faq" + Math.random().toString(36).slice(2, 7);
    const rows = items.map((f, i) => '<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#' + id + i + '">' + esc(f.q || "") + '</button></h3><div id="' + id + i + '" class="accordion-collapse collapse" data-bs-parent="#' + id + '"><div class="accordion-body text-body-secondary">' + esc(f.a || "") + "</div></div></div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="mx-auto" style="max-width:760px"><div class="accordion" id="' + id + '">' + rows + "</div></div></div></section>";
  },
  steps(p) {
    const items = arr(p.items), n = Math.max(2, Math.min(4, items.length || 3));
    const cells = items.map((s, i) => '<div class="col-md-' + (12 / n) + '"><div class="d-inline-flex align-items-center justify-content-center rounded-circle fw-bold mb-2 text-white" style="width:44px;height:44px;background:var(--sw-pri)">' + (i + 1) + "</div>" +
      '<h3 class="h6 fw-semibold">' + esc(s.title || "") + "</h3><p class=\"text-body-secondary small\">" + esc(s.text || "") + "</p></div>").join("");
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) + '<div class="row g-4 text-center">' + cells + "</div></div></section>";
  },
  cta(p) {
    return '<section class="py-6" style="background:var(--sw-soft)"><div class="container text-center"><h2 class="fw-bold mb-2">' + esc(p.title || "") + "</h2>" +
      (p.text ? '<p class="fs-5 text-body-secondary mx-auto mb-4" style="max-width:56ch">' + esc(p.text) + "</p>" : "") +
      '<div class="d-flex justify-content-center gap-2 flex-wrap">' + (p.buttonText ? btn({ text: p.buttonText, href: p.buttonHref }, "primary", "lg") : "") + (p.button2Text ? btn({ text: p.button2Text, href: p.button2Href }, "outline-primary", "lg") : "") + "</div></div></section>";
  },
  button(p) { return '<section class="' + sectionPad(p) + '"><div class="container ' + alignClass(p.align) + '">' + btn({ text: p.text, href: p.href }, "primary", "lg") + "</div></section>"; },
  contact(p) {
    const info = '<div class="col-lg-5">' + (p.title ? '<h2 class="fw-bold mb-3">' + esc(p.title) + "</h2>" : "") + (p.text ? '<p class="text-body-secondary">' + esc(p.text) + "</p>" : "") +
      '<ul class="list-unstyled">' +
      (p.email ? '<li class="mb-2"><i class="bi bi-envelope me-2" style="color:var(--sw-pri)"></i>' + esc(p.email) + "</li>" : "") +
      (p.phone ? '<li class="mb-2"><i class="bi bi-telephone me-2" style="color:var(--sw-pri)"></i>' + esc(p.phone) + "</li>" : "") +
      (p.address ? '<li class="mb-2"><i class="bi bi-geo-alt me-2" style="color:var(--sw-pri)"></i>' + esc(p.address) + "</li>" : "") + "</ul></div>";
    return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container"><div class="row g-5">' + info + '<div class="col-lg-7">' + formInner(p) + "</div></div></div></section>";
  },
  form(p) { return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container"><div class="mx-auto" style="max-width:560px">' + secHead(p) + formInner(p) + "</div></div></section>"; },
  embed(p) { return '<section class="' + sectionPad(p) + '"><div class="container">' + raw(p.html || "") + "</div></section>"; },
  html(p) { return BLOCKS.embed(p); },
  columns(p) { return BLOCKS.features(p); },   // legacy alias
  spacer(p) { return '<div style="height:' + Math.max(0, Math.min(240, Number(p.size) || 48)) + 'px"></div>'; },
  // ERP-backed sections resolve on the client from a published, read-only endpoint (see embed.js).
  careers(p) { return erpWidget("careers", p); },
  jobs(p) { return erpWidget("careers", p); },
};
function secHead(p) {
  if (!p.title && !p.subtitle) return "";
  return '<div class="text-center mb-5"><h2 class="fw-bold mb-2">' + esc(p.title || "") + "</h2>" + (p.subtitle ? '<p class="fs-5 text-body-secondary mx-auto mb-0" style="max-width:60ch">' + esc(p.subtitle) + "</p>" : "") + "</div>";
}
function formInner(p) {
  const fields = arr(p.fields).length ? p.fields : [{ name: "name", label: "Name", type: "text", required: true }, { name: "email", label: "Email", type: "email", required: true }, { name: "message", label: "Message", type: "textarea" }];
  const rows = fields.map((f) => {
    const nm = esc(f.name || "field"), lb = esc(f.label || f.name || "");
    const ctl = f.type === "textarea"
      ? '<textarea class="form-control" name="' + nm + '" rows="4"' + (f.required ? " required" : "") + "></textarea>"
      : '<input class="form-control" name="' + nm + '" type="' + esc(f.type || "text") + '"' + (f.required ? " required" : "") + ">";
    return '<div class="mb-3"><label class="form-label">' + lb + (f.required ? " *" : "") + "</label>" + ctl + "</div>";
  }).join("");
  return '<form class="sw-form" data-form="' + esc(p.formKey || "contact") + '">' + rows + '<button type="submit" class="btn btn-primary">' + esc(p.submitText || "Send") + '</button><div class="sw-form-msg small mt-2" hidden></div></form>';
}
// Placeholder rendered server-side; embed.js fills it in-browser from the public ERP endpoint.
function erpWidget(kind, p) {
  return '<section class="' + sectionPad(p) + '"' + bgStyle(p) + '><div class="container">' + secHead(p) +
    '<div class="sw-erp" data-widget="' + esc(kind) + '"' + (p.company ? ' data-company="' + esc(p.company) + '"' : "") + (p.limit ? ' data-limit="' + esc(p.limit) + '"' : "") + ' data-origin="https://orbit.spacework.ai"><div class="text-center text-body-secondary py-4"><span class="spinner-border spinner-border-sm me-2"></span>Loadingâ€¦</div></div></div></section>';
}

function renderBlock(b) {
  const fn = b && BLOCKS[b.type];
  return fn ? fn(b.props || {}) : "";
}

function themeCss(theme) {
  const primary = theme.primary || "#2f6bff", bg = theme.bg || "#ffffff", ink = theme.ink || "#1b1f24";
  const font = theme.font || "Inter", radius = theme.radius != null ? theme.radius : 12;
  const [r, g, bl] = hexRgb(primary);
  return ":root{--sw-pri:" + primary + ";--sw-pri-rgb:" + r + "," + g + "," + bl + ";--bs-primary:" + primary + ";--bs-primary-rgb:" + r + "," + g + "," + bl + ";--bs-body-bg:" + bg + ";--bs-body-color:" + ink + ";--bs-border-radius:" + Number(radius) + "px;--bs-link-color:" + primary + ";--bs-link-hover-color:color-mix(in srgb," + primary + " 80%,#000);--sw-soft:color-mix(in srgb," + primary + " 6%," + bg + ")}"
    + "body{font-family:'" + font + "',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}"
    + ".py-6{padding-top:6rem;padding-bottom:6rem}"
    + "a{color:var(--sw-pri)}"
    + ".btn-primary{--bs-btn-bg:var(--sw-pri);--bs-btn-border-color:var(--sw-pri);--bs-btn-hover-bg:color-mix(in srgb,var(--sw-pri) 85%,#000);--bs-btn-hover-border-color:color-mix(in srgb,var(--sw-pri) 85%,#000);--bs-btn-active-bg:color-mix(in srgb,var(--sw-pri) 75%,#000);--bs-btn-disabled-bg:var(--sw-pri);--bs-btn-disabled-border-color:var(--sw-pri)}"
    + ".btn-outline-primary{--bs-btn-color:var(--sw-pri);--bs-btn-border-color:var(--sw-pri);--bs-btn-hover-bg:var(--sw-pri);--bs-btn-hover-border-color:var(--sw-pri);--bs-btn-active-bg:var(--sw-pri);--bs-btn-active-border-color:var(--sw-pri)}"
    + ".accordion{--bs-accordion-active-bg:var(--sw-soft);--bs-accordion-active-color:var(--sw-pri);--bs-accordion-btn-focus-box-shadow:none}"
    + ".navbar{--bs-navbar-active-color:var(--sw-pri)}";
}

function navHTML(site, page, nav) {
  const dark = (site.theme || {}).navbar === "dark";
  const brand = site.logo ? '<img src="' + esc(site.logo) + '" alt="' + esc(site.name || "") + '" height="30">' : esc(site.name || "");
  const links = nav.map((n) => '<li class="nav-item"><a class="nav-link' + (n.path === page.path ? " active" : "") + '" href="' + esc(n.path === "/" ? "/" : n.path) + '">' + esc(n.title || n.path) + "</a></li>").join("");
  const cta = site.nav_cta_text ? '<a class="btn btn-primary ms-lg-3" href="' + esc(site.nav_cta_href || "#") + '">' + esc(site.nav_cta_text) + "</a>" : "";
  return '<nav class="navbar navbar-expand-lg sticky-top border-bottom ' + (dark ? "navbar-dark text-bg-dark" : "navbar-light") + '" style="' + (dark ? "" : "background:var(--bs-body-bg)") + '"><div class="container">' +
    '<a class="navbar-brand fw-bold" href="/">' + brand + "</a>" +
    '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#swnav" aria-label="Menu"><span class="navbar-toggler-icon"></span></button>' +
    '<div class="collapse navbar-collapse" id="swnav"><ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">' + links + "</ul>" + cta + "</div></div></nav>";
}
function footerHTML(site, nav) {
  const links = nav.map((n) => '<a class="link-secondary text-decoration-none me-3" href="' + esc(n.path === "/" ? "/" : n.path) + '">' + esc(n.title || n.path) + "</a>").join("");
  return '<footer class="py-5 border-top mt-0"><div class="container d-md-flex justify-content-between align-items-center"><div class="fw-semibold mb-2 mb-md-0">' + esc(site.name || "") + "</div><div>" + links + '</div><div class="text-body-secondary small mt-2 mt-md-0">&copy; ' + new Date().getFullYear() + " " + esc(site.name || "") + "</div></div></footer>";
}

function pageHTML(data, host) {
  const site = data.site || {}, page = data.page || {}, nav = arr(data.nav);
  const theme = site.theme || {}, meta = page.meta || {};
  const font = theme.font || "Inter";
  const fontLink = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(font) + ":wght@400;500;600;700;800&display=swap";
  const blocks = arr(page.content).map(renderBlock).join("");
  const title = esc(page.title || site.name || ""), desc = esc(meta.description || "");
  const hideChrome = page.chrome === false || meta.chrome === false;
  return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>" + title + "</title>" + (desc ? '<meta name="description" content="' + desc + '">' : "") +
    '<meta property="og:title" content="' + title + '">' + (desc ? '<meta property="og:description" content="' + desc + '">' : "") + (meta.ogImage ? '<meta property="og:image" content="' + esc(meta.ogImage) + '">' : "") +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="' + fontLink + '"><link rel="stylesheet" href="' + BOOTSTRAP_CSS + '"><link rel="stylesheet" href="' + BOOTSTRAP_ICONS + '">' +
    "<style>" + themeCss(theme) + "</style></head><body>" +
    (hideChrome ? "" : navHTML(site, page, nav)) +
    "<main>" + (blocks || '<section class="py-6"><div class="container text-center text-body-secondary">This page has no content yet.</div></section>') + "</main>" +
    (hideChrome ? "" : footerHTML(site, nav)) +
    '<script src="' + BOOTSTRAP_JS + '"></script>' +
    "<script>(function(){var SUPA=" + JSON.stringify(SUPA) + ",ANON=" + JSON.stringify(ANON) + ",HOST=" + JSON.stringify(host) + ";" +
    "document.querySelectorAll('form.sw-form').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var d={};new FormData(f).forEach(function(v,k){d[k]=v;});var m=f.querySelector('.sw-form-msg');var btn=f.querySelector('button[type=submit]');if(btn)btn.disabled=true;" +
    "fetch(SUPA+'/rest/v1/rpc/site_form_submit',{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+ANON},body:JSON.stringify({p_host:HOST,p_form:f.getAttribute('data-form'),p_data:d})}).then(function(r){return r.json();}).then(function(){f.reset();if(m){m.hidden=false;m.className='sw-form-msg small mt-2 text-success';m.textContent='Thanks - your message was sent.';}}).catch(function(){if(m){m.hidden=false;m.className='sw-form-msg small mt-2 text-danger';m.textContent='Sorry, that did not send. Please try again.';}}).finally(function(){if(btn)btn.disabled=false;});});});" +
    "})();</script>" +
    // ERP widgets (careers etc.) hydrate from the public read endpoint on the same origin.
    (blocks.indexOf('class="sw-erp"') >= 0 ? '<script src="https://orbit.spacework.ai/embed/erp.js"></script>' : "") +
    "</body></html>";
}

function notFound(host) {
  return '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Not found</title><body style="font-family:system-ui;display:grid;place-items:center;height:90vh;margin:0;color:#444;text-align:center"><div><h1 style="font-size:60px;margin:0">404</h1><p>No published page here' + (host ? " for <b>" + esc(host) + "</b>" : "") + ".</p></div></body>";
}

// The one entry point: resolve host+path and return a ready Response.
async function serveSite(host, path, opts) {
  opts = opts || {};
  const supaUrl = opts.supaUrl || SUPA, anon = opts.anon || ANON;
  host = (host || "").toLowerCase();
  if (!path || path === "/index.html") path = "/";
  const H404 = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };
  try {
    const r = await fetch(supaUrl + "/rest/v1/rpc/site_render", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": anon, "Authorization": "Bearer " + anon },
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

globalThis.SiteEngine = { serveSite: serveSite, pageHTML: pageHTML, renderBlock: renderBlock, themeCss: themeCss, navHTML: navHTML, footerHTML: footerHTML, BOOTSTRAP_CSS: BOOTSTRAP_CSS, BOOTSTRAP_JS: BOOTSTRAP_JS, BOOTSTRAP_ICONS: BOOTSTRAP_ICONS, SUPA: SUPA, ANON: ANON };
})();


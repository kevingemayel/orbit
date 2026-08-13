// ============================================================================
//  Orbit - Spacework ERP  (front end)
//  UI/UX architecture modelled on Odoo (app switcher -> colored app navbar with
//  dropdown menus -> breadcrumbs -> control panel with faceted search + view
//  switcher + pager -> list / kanban / form / report views with a status bar,
//  smart buttons and notebook tabs). Original code; wired to Supabase.
// ============================================================================
(function () {
  var cfg = window.APP_CONFIG || {};
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var root = document.getElementById("root");
  var S = { user: null, profile: null, org: null, companies: [], company: null, app: null, action: null, types: [] };
  var L = null; // current list state

  var esc = function (s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var money = function (n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var today = function () { return new Date().toISOString().slice(0, 10); };
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add("on"); }); setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 250); }, 2400); }
  var SEARCH_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

  // ======================= APP / MENU CONFIG =======================
  var APPS = {
    accounting: {
      name: "Accounting", icon: "€", color: "#7c3aed", color2: "#5b21b6", home: "dashboard",
      menus: [
        { label: "Dashboard", action: "dashboard" },
        { label: "Customers", items: [["Invoices", "inv.out"], ["Credit Notes", "inv.outr"], ["Payments", "pay.in"], ["Customers", "cust"]] },
        { label: "Vendors", items: [["Bills", "inv.in"], ["Refunds", "inv.inr"], ["Payments", "pay.out"], ["Vendors", "vend"]] },
        { label: "Accounting", items: [["Journal Entries", "moves"], ["Bank Statements", "bank"], ["Chart of Accounts", "accounts"]] },
        { label: "Reporting", items: [["Profit and Loss", "rep.pl"], ["Balance Sheet", "rep.bs"], ["Trial Balance", "rep.tb"], ["Consolidation", "rep.cons"]] },
        { label: "Configuration", items: [["Companies", "companies"], ["Taxes", "taxes"], ["Products", "products"], ["Exchange Rates", "rates"]] }
      ]
    },
    sales: {
      name: "Sales", icon: "$", color: "#0891b2", color2: "#0e7490", home: "so.list",
      menus: [
        { label: "Orders", items: [["Quotations", "so.list"], ["Invoices", "inv.out"]] },
        { label: "Customers", action: "cust" },
        { label: "Products", action: "products" }
      ]
    },
    purchase: {
      name: "Purchase", icon: "⛁", color: "#b45309", color2: "#92400e", home: "po.list",
      menus: [
        { label: "Orders", items: [["Purchase Orders", "po.list"], ["Bills", "inv.in"]] },
        { label: "Vendors", action: "vend" },
        { label: "Products", action: "products" }
      ]
    },
    settings: {
      name: "Settings", icon: "⚙", color: "#475569", color2: "#334155", home: "companies",
      menus: [
        { label: "Companies", action: "companies" },
        { label: "Taxes", action: "taxes" },
        { label: "Exchange Rates", action: "rates" },
        { label: "Chart of Accounts", action: "accounts" }
      ]
    }
  };
  // which app owns an action (for breadcrumb when navigated directly)
  var ACTION_APP = {
    dashboard: "accounting", "inv.out": "accounting", "inv.in": "accounting", "pay.in": "accounting",
    "pay.out": "accounting", cust: "accounting", vend: "accounting", moves: "accounting",
    accounts: "accounting", "rep.pl": "accounting", "rep.bs": "accounting", "rep.tb": "accounting",
    companies: "settings", taxes: "settings", products: "sales", "so.list": "sales", "po.list": "purchase",
    "inv.outr": "accounting", "inv.inr": "accounting", rates: "settings", "rep.cons": "accounting", bank: "accounting"
  };
  var SOON = [["CRM", "◎", "#e11d48"], ["Inventory", "⬚", "#16a34a"], ["Project", "◈", "#db2777"],
    ["Employees", "☺", "#dc2626"], ["Manufacturing", "⚒", "#0d9488"], ["Website", "◐", "#2563eb"], ["Point of Sale", "▤", "#7c3aed"]];

  // ============================ AUTH ============================
  function renderLogin(mode) {
    mode = mode || "in";
    root.innerHTML =
      '<div class="login"><div class="card">' +
      '<div class="logo">O</div>' +
      '<h1>' + (mode === "in" ? "Sign in to Orbit" : "Create your account") + "</h1>" +
      '<p class="sub">Spacework ERP</p>' +
      '<label>Email</label><input id="email" type="email" autocomplete="username" placeholder="you@company.com">' +
      '<label>Password</label><input id="pw" type="password" autocomplete="current-password" placeholder="........">' +
      '<div class="err" id="err"></div>' +
      '<button class="btn pri" id="go" style="width:100%;margin-top:14px;background:var(--accent);border-color:var(--accent)">' + (mode === "in" ? "Sign in" : "Sign up") + "</button>" +
      '<div class="switch">' + (mode === "in" ? 'No account yet? <a id="sw">Create one</a>' : 'Already have an account? <a id="sw">Sign in</a>') + "</div>" +
      "</div></div>";
    document.getElementById("sw").onclick = function () { renderLogin(mode === "in" ? "up" : "in"); };
    document.getElementById("go").onclick = doAuth.bind(null, mode);
    document.getElementById("pw").onkeydown = function (e) { if (e.key === "Enter") doAuth(mode); };
  }
  async function doAuth(mode) {
    var email = document.getElementById("email").value.trim();
    var pw = document.getElementById("pw").value;
    var err = document.getElementById("err"); err.textContent = "";
    if (!email || !pw) { err.textContent = "Enter your email and password."; return; }
    var res = mode === "in" ? await sb.auth.signInWithPassword({ email: email, password: pw }) : await sb.auth.signUp({ email: email, password: pw });
    if (res.error) { err.textContent = res.error.message; return; }
    if (mode === "up" && !res.data.session) { err.textContent = "Check your email to confirm, then sign in."; return; }
    boot();
  }
  async function signOut() { await sb.auth.signOut(); renderLogin("in"); }

  // ============================ BOOT ============================
  async function boot() {
    var sess = (await sb.auth.getSession()).data.session;
    if (!sess) { renderLogin("in"); return; }
    S.user = sess.user;
    S.profile = (await sb.from("profiles").select("*").eq("id", S.user.id).maybeSingle()).data || {};
    S.companies = (await sb.from("companies").select("*").order("name")).data || [];
    if (!S.companies.length) { renderNoCompany(); return; }
    S.company = S.companies.filter(function (c) { return c.id === S.profile.active_company_id; })[0] || S.companies[0];
    if (S.company.org_id) S.org = (await sb.from("orgs").select("*").eq("id", S.company.org_id).maybeSingle()).data;
    S.types = (await sb.from("account_types").select("*")).data || [];
    renderHome();
  }
  function renderNoCompany() {
    root.innerHTML = '<div class="login"><div class="card"><div class="logo">O</div><h1>Welcome to Orbit</h1>' +
      '<p class="sub">You are signed in as ' + esc(S.user.email) + ', but you are not attached to a company yet.</p>' +
      '<button class="btn" id="out" style="margin-top:12px">Sign out</button></div></div>';
    document.getElementById("out").onclick = signOut;
  }

  // ======================= APP SWITCHER (HOME) =======================
  function renderHome() {
    S.app = null; S.action = null;
    var tiles = Object.keys(APPS).map(function (k) {
      var a = APPS[k];
      return '<div class="o-tile" data-app="' + k + '"><div class="ic" style="background:linear-gradient(135deg,' + a.color + ',' + a.color2 + ')">' + a.icon + '</div><div class="nm">' + esc(a.name) + '</div></div>';
    }).join("");
    var soon = SOON.map(function (s) {
      return '<div class="o-tile soon"><div class="ic" style="background:linear-gradient(135deg,' + s[2] + ',' + s[2] + ')">' + s[1] + '</div><div class="nm">' + esc(s[0]) + '</div></div>';
    }).join("");
    var initials = (S.user.email || "?").slice(0, 2).toUpperCase();
    root.innerHTML =
      '<div class="o-home">' +
      '<div class="o-home-top"><div class="logo">O</div><b>Orbit</b><span class="muted" style="font-size:12.5px">&nbsp; ' + esc(S.org ? S.org.name : "") + '</span>' +
      '<div style="margin-left:auto;display:flex;align-items:center;gap:8px">' + companySelectHTML("home") + '<div class="o-ava" id="ava" style="background:var(--accent-soft);color:var(--accent)">' + initials + '</div></div></div>' +
      '<div class="o-grid">' + tiles + soon + '</div></div>';
    root.querySelectorAll(".o-tile[data-app]").forEach(function (t) { t.onclick = function () { openApp(t.dataset.app); }; });
    wireCompanySelect("home");
    document.getElementById("ava").onclick = function (e) { openAvatarMenu(e.currentTarget); };
  }

  function openApp(key) {
    S.app = key;
    var a = APPS[key];
    document.documentElement.style.setProperty("--app", a.color);
    document.documentElement.style.setProperty("--app2", a.color2);
    go(a.home);
  }

  // ============================ SHELL ============================
  function renderShell() {
    var a = APPS[S.app];
    var initials = (S.user.email || "?").slice(0, 2).toUpperCase();
    var menu = a.menus.map(function (m, i) {
      return '<button class="mi" data-mi="' + i + '">' + esc(m.label) + (m.items ? ' <span class="car">&#9660;</span>' : '') + '</button>';
    }).join("");
    root.innerHTML =
      '<div class="o-app">' +
      '<div class="o-navbar">' +
      '<button class="o-waffle" id="waffle" title="Apps">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="6" height="6" rx="1.4"/><rect x="9.5" y="2" width="6" height="6" rx="1.4"/><rect x="17" y="2" width="6" height="6" rx="1.4"/><rect x="2" y="9.5" width="6" height="6" rx="1.4"/><rect x="9.5" y="9.5" width="6" height="6" rx="1.4"/><rect x="17" y="9.5" width="6" height="6" rx="1.4"/><rect x="2" y="17" width="6" height="6" rx="1.4"/><rect x="9.5" y="17" width="6" height="6" rx="1.4"/><rect x="17" y="17" width="6" height="6" rx="1.4"/></svg>' +
      '</button>' +
      '<span class="o-appname">' + esc(a.name) + '</span>' +
      '<nav class="o-menu" id="omenu">' + menu + '</nav>' +
      '<div class="o-systray">' + companySelectHTML("bar") + '<div class="o-ava" id="ava">' + initials + '</div></div>' +
      '</div>' +
      '<div id="o-main" style="overflow:hidden"></div>' +
      '</div>';
    document.getElementById("waffle").onclick = renderHome;
    document.getElementById("ava").onclick = function (e) { openAvatarMenu(e.currentTarget); };
    wireCompanySelect("bar");
    document.querySelectorAll(".o-menu .mi").forEach(function (mi) {
      mi.onclick = function (e) { onMenuClick(mi, a.menus[+mi.dataset.mi]); };
    });
  }
  function companySelectHTML(scope) {
    var opts = S.companies.map(function (c) { return '<option value="' + c.id + '"' + (c.id === S.company.id ? " selected" : "") + ">" + esc(c.name) + " (" + esc(c.currency_code) + ")</option>"; }).join("");
    return '<select class="o-cosel" id="cosel-' + scope + '" title="Active company">' + opts + '</select>';
  }
  function wireCompanySelect(scope) {
    var el = document.getElementById("cosel-" + scope);
    if (!el) return;
    el.onchange = async function () {
      S.company = S.companies.filter(function (c) { return c.id === this.value; }.bind(this))[0];
      await sb.from("profiles").update({ active_company_id: S.company.id }).eq("id", S.user.id);
      if (S.app) go(S.action || APPS[S.app].home); else renderHome();
    };
  }
  function onMenuClick(mi, menu) {
    closeDropdowns();
    if (menu.action) { go(menu.action); return; }
    var r = mi.getBoundingClientRect();
    var dd = document.createElement("div"); dd.className = "o-dd"; dd.dataset.dd = "1";
    dd.style.left = r.left + "px";
    dd.innerHTML = menu.items.map(function (it) { return '<button class="it" data-go="' + it[1] + '">' + esc(it[0]) + '</button>'; }).join("");
    document.body.appendChild(dd);
    dd.querySelectorAll("[data-go]").forEach(function (b) { b.onclick = function () { closeDropdowns(); go(b.dataset.go); }; });
  }
  function openAvatarMenu(anchor) {
    closeDropdowns();
    var r = anchor.getBoundingClientRect();
    var dd = document.createElement("div"); dd.className = "o-dd"; dd.dataset.dd = "1";
    dd.style.right = (window.innerWidth - r.right) + "px"; dd.style.left = "auto";
    dd.innerHTML = '<div class="sec">' + esc(S.user.email) + '</div>' +
      '<button class="it dis">Preferences</button>' +
      (S.app ? '<button class="it" id="dd-home">Apps</button>' : '') +
      '<div class="sep"></div><button class="it" id="dd-out">Log out</button>';
    document.body.appendChild(dd);
    var h = document.getElementById("dd-home"); if (h) h.onclick = function () { closeDropdowns(); renderHome(); };
    document.getElementById("dd-out").onclick = signOut;
  }
  function closeDropdowns() { document.querySelectorAll("[data-dd]").forEach(function (d) { d.remove(); }); }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-dd]") || e.target.closest(".mi") || e.target.closest("#ava") || e.target.closest(".o-filtbtn")) return;
    closeDropdowns();
  });

  // ============================ ROUTER ============================
  function go(action) {
    S.action = action;
    if (!S.app) { S.app = ACTION_APP[action] || "accounting"; var a0 = APPS[S.app]; document.documentElement.style.setProperty("--app", a0.color); document.documentElement.style.setProperty("--app2", a0.color2); }
    if (!document.getElementById("o-main")) renderShell();
    else { /* keep shell, but ensure menu highlights current app */ }
    routeAction(action);
  }
  function routeAction(action) {
    switch (action) {
      case "dashboard": return renderDashboard();
      case "inv.out": return renderList(cfgInvoices("out_invoice"));
      case "inv.in": return renderList(cfgInvoices("in_invoice"));
      case "inv.outr": return renderList(cfgInvoices("out_refund"));
      case "inv.inr": return renderList(cfgInvoices("in_refund"));
      case "pay.in": return renderList(cfgPayments("inbound"));
      case "pay.out": return renderList(cfgPayments("outbound"));
      case "cust": return renderList(cfgPartners("customer"));
      case "vend": return renderList(cfgPartners("vendor"));
      case "accounts": return renderList(cfgAccounts());
      case "moves": return renderList(cfgMoves());
      case "companies": return renderList(cfgCompanies());
      case "taxes": return renderList(cfgTaxes());
      case "products": return renderList(cfgProducts());
      case "so.list": return renderList(cfgOrders("sale"));
      case "po.list": return renderList(cfgOrders("purchase"));
      case "rep.pl": return renderReport("pl");
      case "rep.bs": return renderReport("bs");
      case "rep.tb": return renderReport("tb");
      case "rep.cons": return renderConsolidation();
      case "rates": return renderList(cfgRates());
      case "bank": return renderList(cfgBankStatements());
      default: return renderDashboard();
    }
  }
  function bcHTML(title, parent) {
    var app = APPS[S.app];
    var up = '<span class="up" id="bc-home">' + esc(app.name) + '</span><span class="sepc">/</span>';
    if (parent) up += '<span class="up" data-go="' + parent.action + '">' + esc(parent.title) + '</span><span class="sepc">/</span>';
    return '<div class="o-bc">' + up + '<span>' + esc(title) + '</span></div>';
  }
  function wireBc() {
    var h = document.getElementById("bc-home"); if (h) h.onclick = function () { go(APPS[S.app].home); };
    document.querySelectorAll(".o-bc [data-go]").forEach(function (e) { e.onclick = function () { go(e.dataset.go); }; });
  }

  // ============================ LIST ENGINE ============================
  function renderList(cfg) {
    var main = document.getElementById("o-main");
    main.innerHTML =
      '<div class="o-view">' +
      '<div class="o-cp">' + bcHTML(cfg.title) +
      (cfg.onNew ? '<button class="o-new" id="o-new">New</button>' : '') +
      '<div class="o-search"><span style="display:flex">' + SEARCH_SVG + '</span><span id="o-facets"></span><input id="o-q" placeholder="Search..."></div>' +
      (cfg.filters ? '<button class="o-filtbtn" id="o-fbtn">Filters &#9660;</button>' : '') +
      (cfg.groupBy ? '<button class="o-filtbtn" id="o-gbtn">Group By &#9660;</button>' : '') +
      '<div class="gap"></div>' +
      '<span class="o-pager" id="o-pager"></span>' +
      '<div class="o-vs" id="o-vs"><button data-v="list" class="on" title="List">&#9776;</button>' +
      (cfg.kanbanCard ? '<button data-v="kanban" title="Kanban">&#9638;</button>' : '') + '</div>' +
      '</div>' +
      '<div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div>' +
      '</div>';
    wireBc();
    L = { cfg: cfg, all: [], view: "list", page: 0, size: cfg.pageSize || 80, query: "", filters: {}, group: null };
    if (cfg.onNew) document.getElementById("o-new").onclick = cfg.onNew;
    document.getElementById("o-q").addEventListener("input", function () { L.query = this.value.toLowerCase(); L.page = 0; paintBody(); });
    document.getElementById("o-vs").querySelectorAll("[data-v]").forEach(function (b) {
      b.onclick = function () { L.view = b.dataset.v; document.querySelectorAll("#o-vs [data-v]").forEach(function (x) { x.classList.toggle("on", x === b); }); paintBody(); };
    });
    if (cfg.filters) document.getElementById("o-fbtn").onclick = function () { openListDropdown(this, "filters"); };
    if (cfg.groupBy) document.getElementById("o-gbtn").onclick = function () { openListDropdown(this, "group"); };
    cfg.fetch().then(function (rows) { L.all = rows || []; paintBody(); });
  }
  function openListDropdown(btn, kind) {
    closeDropdowns();
    var r = btn.getBoundingClientRect();
    var dd = document.createElement("div"); dd.className = "o-dd"; dd.dataset.dd = "1"; dd.style.left = r.left + "px";
    if (kind === "filters") {
      dd.innerHTML = '<div class="sec">Filters</div>' + L.cfg.filters.map(function (f, i) {
        return '<button class="it" data-i="' + i + '">' + (L.filters[i] ? "&#10003; " : "") + esc(f.label) + '</button>';
      }).join("");
      dd.querySelectorAll("[data-i]").forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; L.filters[i] = !L.filters[i]; L.page = 0; refreshFacets(); paintBody(); closeDropdowns(); }; });
    } else {
      dd.innerHTML = '<div class="sec">Group By</div>' + L.cfg.groupBy.map(function (g, i) {
        return '<button class="it" data-i="' + i + '">' + (L.group === i ? "&#10003; " : "") + esc(g.label) + '</button>';
      }).join("");
      dd.querySelectorAll("[data-i]").forEach(function (b) { b.onclick = function () { var i = +b.dataset.i; L.group = (L.group === i ? null : i); refreshFacets(); paintBody(); closeDropdowns(); }; });
    }
    document.body.appendChild(dd);
  }
  function refreshFacets() {
    var f = document.getElementById("o-facets"); if (!f) return;
    var chips = "";
    Object.keys(L.filters).forEach(function (i) { if (L.filters[i]) chips += '<span class="o-facet">' + esc(L.cfg.filters[i].label) + ' <span class="x" data-fx="' + i + '">&times;</span></span>'; });
    if (L.group != null) chips += '<span class="o-facet">' + esc(L.cfg.groupBy[L.group].label) + ' <span class="x" data-gx="1">&times;</span></span>';
    f.innerHTML = chips;
    f.querySelectorAll("[data-fx]").forEach(function (x) { x.onclick = function () { L.filters[x.dataset.fx] = false; refreshFacets(); paintBody(); }; });
    f.querySelectorAll("[data-gx]").forEach(function (x) { x.onclick = function () { L.group = null; refreshFacets(); paintBody(); }; });
  }
  function applyRows() {
    var cfg = L.cfg, rows = L.all.slice();
    var active = Object.keys(L.filters).filter(function (i) { return L.filters[i]; });
    if (active.length) rows = rows.filter(function (r) { return active.some(function (i) { return cfg.filters[i].test(r); }); });
    if (L.query) rows = rows.filter(function (r) { return cfg.searchText(r).toLowerCase().indexOf(L.query) >= 0; });
    return rows;
  }
  function paintBody() {
    var cfg = L.cfg, rows = applyRows(), body = document.getElementById("o-body");
    var total = rows.length;
    // pager
    var pager = document.getElementById("o-pager");
    if (L.group != null || L.view === "kanban") { pager.innerHTML = total + (total === 1 ? " record" : " records"); }
    else {
      var from = total ? L.page * L.size + 1 : 0, to = Math.min((L.page + 1) * L.size, total);
      pager.innerHTML = '<span>' + from + '-' + to + ' / ' + total + '</span>' +
        '<button id="pgp">&#8249;</button><button id="pgn">&#8250;</button>';
      var pgp = document.getElementById("pgp"), pgn = document.getElementById("pgn");
      pgp.disabled = L.page === 0; pgn.disabled = to >= total;
      pgp.onclick = function () { if (L.page > 0) { L.page--; paintBody(); } };
      pgn.onclick = function () { if (to < total) { L.page++; paintBody(); } };
    }
    if (!total) { body.innerHTML = '<div class="o-empty">Nothing here yet.' + (cfg.onNew ? ' Click <b>New</b> to create the first one.' : '') + '</div>'; return; }
    if (L.view === "kanban" && cfg.kanbanCard) { body.innerHTML = '<div class="o-kan">' + rows.map(function (r) { return '<div class="o-card" data-id="' + r.id + '">' + cfg.kanbanCard(r) + '</div>'; }).join("") + '</div>'; }
    else if (L.group != null) {
      var g = cfg.groupBy[L.group], groups = {};
      rows.forEach(function (r) { var k = g.get(r) || "None"; (groups[k] = groups[k] || []).push(r); });
      var html = '<table class="o-list"><thead>' + headRow(cfg) + '</thead><tbody>';
      Object.keys(groups).sort().forEach(function (k) {
        html += '<tr class="o-grp"><td colspan="' + cfg.columns.length + '">' + esc(k) + ' <span class="cnt">(' + groups[k].length + ')</span></td></tr>';
        groups[k].forEach(function (r) { html += rowHTML(cfg, r); });
      });
      body.innerHTML = html + "</tbody></table>";
    } else {
      var page = rows.slice(L.page * L.size, (L.page + 1) * L.size);
      body.innerHTML = '<table class="o-list"><thead>' + headRow(cfg) + '</thead><tbody>' + page.map(function (r) { return rowHTML(cfg, r); }).join("") + '</tbody></table>';
    }
    body.querySelectorAll("[data-id]").forEach(function (el) { el.onclick = function () { var r = rows.filter(function (x) { return x.id === el.dataset.id; })[0]; if (cfg.onOpen) cfg.onOpen(r); }; });
  }
  function headRow(cfg) { return '<tr>' + cfg.columns.map(function (c) { return '<th class="' + (c.num ? "num" : "") + '">' + esc(c.label) + '</th>'; }).join("") + '</tr>'; }
  function rowHTML(cfg, r) { return '<tr data-id="' + r.id + '">' + cfg.columns.map(function (c) { return '<td class="' + (c.num ? "num" : "") + (c.cls ? " " + c.cls : "") + '">' + c.get(r) + '</td>'; }).join("") + '</tr>'; }

  // ============================ LIST CONFIGS ============================
  function stBadge(i) {
    if (i.state === "draft") return '<span class="badge draft">Draft</span>';
    var ps = i.payment_state;
    var cls = ps === "paid" ? "paid" : ps === "partial" ? "partial" : "unpaid";
    var lbl = ps === "paid" ? "Paid" : ps === "partial" ? "Partial" : "Not Paid";
    return '<span class="badge ' + cls + '">' + lbl + '</span>';
  }
  function cfgInvoices(moveType) {
    var isSale = moveType.indexOf("out_") === 0, isRefund = moveType.indexOf("refund") >= 0;
    var ttl = isRefund ? (isSale ? "Credit Notes" : "Vendor Credit Notes") : (isSale ? "Invoices" : "Vendor Bills");
    return {
      title: ttl, pageSize: 80,
      fetch: function () { return sb.from("invoices").select("*, partners(name)").eq("company_id", S.company.id).eq("move_type", moveType).order("invoice_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (i) { return (i.number || "") + " " + (i.partners ? i.partners.name : ""); },
      columns: [
        { label: "Number", get: function (i) { return '<b>' + esc(i.number || "Draft") + '</b>'; } },
        { label: isSale ? "Customer" : "Vendor", get: function (i) { return esc(i.partners ? i.partners.name : ""); } },
        { label: "Invoice Date", get: function (i) { return '<span class="muted">' + esc(i.invoice_date || "") + '</span>'; } },
        { label: "Due Date", get: function (i) { return '<span class="muted">' + esc(i.due_date || "") + '</span>'; } },
        { label: "Total", num: true, get: function (i) { return money(i.amount_total); } },
        { label: "Amount Due", num: true, get: function (i) { return money(i.amount_residual); } },
        { label: "Status", get: function (i) { return stBadge(i); } }
      ],
      filters: [
        { label: "Draft", test: function (i) { return i.state === "draft"; } },
        { label: "Posted", test: function (i) { return i.state === "posted"; } },
        { label: "Not Paid", test: function (i) { return i.state === "posted" && i.payment_state !== "paid"; } },
        { label: "Paid", test: function (i) { return i.payment_state === "paid"; } }
      ],
      groupBy: [
        { label: isSale ? "Customer" : "Vendor", get: function (i) { return i.partners ? i.partners.name : "None"; } },
        { label: "Status", get: function (i) { return i.state === "draft" ? "Draft" : (i.payment_state === "paid" ? "Paid" : "Open"); } },
        { label: "Invoice Month", get: function (i) { return (i.invoice_date || "").slice(0, 7); } }
      ],
      kanbanCard: function (i) {
        return '<div class="t">' + esc(i.number || "Draft") + '</div><div class="muted">' + esc(i.partners ? i.partners.name : "") + '</div>' +
          '<div class="r"><span>' + esc(i.invoice_date || "") + '</span>' + stBadge(i) + '</div>' +
          '<div class="r"><span class="k">Total</span><b>' + S.company.currency_code + " " + money(i.amount_total) + '</b></div>';
      },
      onOpen: function (i) { renderInvoiceForm(i.id, moveType); },
      onNew: function () { renderInvoiceForm("new", moveType); }
    };
  }
  function cfgPartners(kind) {
    var isCust = kind === "customer";
    var flag = isCust ? "is_customer" : "is_vendor";
    return {
      title: isCust ? "Customers" : "Vendors", pageSize: 80,
      fetch: function () { return sb.from("partners").select("*").eq(flag, true).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.name || "") + " " + (p.email || "") + " " + (p.city || ""); },
      columns: [
        { label: "Name", get: function (p) { return '<b>' + esc(p.name) + '</b>'; } },
        { label: "Email", get: function (p) { return '<span class="muted">' + esc(p.email || "") + '</span>'; } },
        { label: "Phone", get: function (p) { return '<span class="muted">' + esc(p.phone || "") + '</span>'; } },
        { label: "City", get: function (p) { return '<span class="muted">' + esc(p.city || "") + '</span>'; } },
        { label: "Country", get: function (p) { return '<span class="muted">' + esc(p.country || "") + '</span>'; } }
      ],
      groupBy: [{ label: "City", get: function (p) { return p.city || "None"; } }, { label: "Country", get: function (p) { return p.country || "None"; } }],
      kanbanCard: function (p) { return '<div class="t">' + esc(p.name) + '</div><div class="muted">' + esc(p.email || "") + '</div><div class="r"><span>' + esc(p.city || "") + '</span><span>' + esc(p.country || "") + '</span></div>'; },
      onOpen: function (p) { renderPartnerForm(p.id, kind); },
      onNew: function () { renderPartnerForm("new", kind); }
    };
  }
  function cfgPayments(dir) {
    return {
      title: dir === "inbound" ? "Customer Payments" : "Vendor Payments", pageSize: 80,
      fetch: function () { return sb.from("payments").select("*, partners(name)").eq("company_id", S.company.id).eq("payment_type", dir).order("date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.reference || "") + " " + (p.memo || "") + " " + (p.partners ? p.partners.name : ""); },
      columns: [
        { label: "Date", get: function (p) { return '<span class="muted">' + esc(p.date || "") + '</span>'; } },
        { label: "Partner", get: function (p) { return '<b>' + esc(p.partners ? p.partners.name : "") + '</b>'; } },
        { label: "Reference", get: function (p) { return esc(p.reference || p.memo || ""); } },
        { label: "Amount", num: true, get: function (p) { return money(p.amount); } }
      ],
      groupBy: [{ label: "Partner", get: function (p) { return p.partners ? p.partners.name : "None"; } }, { label: "Month", get: function (p) { return (p.date || "").slice(0, 7); } }]
    };
  }
  function cfgAccounts() {
    var tName = {}; S.types.forEach(function (t) { tName[t.code] = t.name; });
    return {
      title: "Chart of Accounts", pageSize: 200,
      fetch: function () { return sb.from("accounts").select("*").eq("company_id", S.company.id).order("code").then(function (r) { return r.data || []; }); },
      searchText: function (a) { return (a.code || "") + " " + (a.name || ""); },
      columns: [
        { label: "Code", get: function (a) { return '<span class="num" style="text-align:left">' + esc(a.code) + '</span>'; } },
        { label: "Name", get: function (a) { return '<b>' + esc(a.name) + '</b>'; } },
        { label: "Type", get: function (a) { return '<span class="muted">' + esc(tName[a.type_code] || a.type_code) + '</span>'; } },
        { label: "Status", get: function (a) { return a.is_active ? '<span class="badge">Active</span>' : '<span class="badge unpaid">Archived</span>'; } }
      ],
      filters: [{ label: "Active", test: function (a) { return a.is_active; } }, { label: "Archived", test: function (a) { return !a.is_active; } }],
      groupBy: [{ label: "Type", get: function (a) { return tName[a.type_code] || a.type_code; } }, { label: "Class", get: function (a) { return TYPE_LABEL((a.type_code || "").split("_")[0]); } }],
      onOpen: function (a) { renderAccountForm(a.id); },
      onNew: function () { renderAccountForm("new"); }
    };
  }
  function cfgMoves() {
    return {
      title: "Journal Entries", pageSize: 80,
      fetch: function () { return sb.from("journal_entries").select("*, journals(code,name)").eq("company_id", S.company.id).order("date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (m) { return (m.number || "") + " " + (m.ref || "") + " " + (m.narration || ""); },
      columns: [
        { label: "Date", get: function (m) { return '<span class="muted">' + esc(m.date || "") + '</span>'; } },
        { label: "Number", get: function (m) { return '<b>' + esc(m.number || m.ref || "/") + '</b>'; } },
        { label: "Journal", get: function (m) { return esc(m.journals ? m.journals.name : ""); } },
        { label: "Reference", get: function (m) { return '<span class="muted">' + esc(m.narration || m.ref || "") + '</span>'; } },
        { label: "Status", get: function (m) { return m.state === "posted" ? '<span class="badge paid">Posted</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      groupBy: [{ label: "Journal", get: function (m) { return m.journals ? m.journals.name : "None"; } }, { label: "Month", get: function (m) { return (m.date || "").slice(0, 7); } }]
    };
  }
  function cfgCompanies() {
    return {
      title: "Companies", pageSize: 50,
      fetch: function () { return sb.from("companies").select("*").order("name").then(function (r) { return r.data || []; }); },
      searchText: function (c) { return (c.name || "") + " " + (c.legal_name || ""); },
      columns: [
        { label: "Name", get: function (c) { return '<b>' + esc(c.name) + '</b>'; } },
        { label: "Legal name", get: function (c) { return '<span class="muted">' + esc(c.legal_name || "") + '</span>'; } },
        { label: "Currency", get: function (c) { return esc(c.currency_code); } },
        { label: "Country", get: function (c) { return '<span class="muted">' + esc(c.country || "") + '</span>'; } },
        { label: "Role", get: function (c) { return '<span class="muted">' + (c.parent_company_id ? "Subsidiary" : "Parent / standalone") + '</span>'; } }
      ]
    };
  }
  function cfgTaxes() {
    return {
      title: "Taxes", pageSize: 50,
      fetch: function () { return sb.from("taxes").select("*").eq("company_id", S.company.id).order("amount", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (t) { return (t.name || "") + " " + (t.code || ""); },
      columns: [
        { label: "Name", get: function (t) { return '<b>' + esc(t.name) + '</b>'; } },
        { label: "Rate", num: true, get: function (t) { return Number(t.amount) + "%"; } },
        { label: "Scope", get: function (t) { return '<span class="muted">' + esc(t.scope || "") + '</span>'; } }
      ],
      groupBy: [{ label: "Scope", get: function (t) { return t.scope || "None"; } }]
    };
  }
  function cfgRates() {
    var ref = (S.org && S.org.ref_currency) || "USD";
    return {
      title: "Exchange Rates", pageSize: 100,
      fetch: function () { return sb.from("currency_rates").select("*").eq("org_id", S.org.id).order("rate_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return (r.code || "") + " " + (r.rate_type || ""); },
      columns: [
        { label: "Currency", get: function (r) { return '<b>' + esc(r.code) + '</b>'; } },
        { label: "Date", get: function (r) { return '<span class="muted">' + esc(r.rate_date || "") + '</span>'; } },
        { label: "Type", get: function (r) { return '<span class="muted">' + esc(r.rate_type || "") + '</span>'; } },
        { label: "Rate (1 " + "= ? " + esc(ref) + ")", num: true, get: function (r) { return Number(r.rate).toLocaleString("en-US", { maximumFractionDigits: 6 }); } }
      ],
      groupBy: [{ label: "Currency", get: function (r) { return r.code; } }, { label: "Type", get: function (r) { return r.rate_type; } }],
      onNew: function () { openRateModal(); }
    };
  }
  function openRateModal() {
    var ref = (S.org && S.org.ref_currency) || "USD";
    var m = document.createElement("div"); m.className = "modal on"; m.id = "ratemodal";
    m.innerHTML = '<div class="sheet"><h3>New exchange rate</h3><div class="form" style="padding:16px 18px;display:grid;gap:12px">' +
      '<div><label>Currency code</label><input id="r-code" placeholder="e.g. EUR" style="text-transform:uppercase"></div>' +
      '<div class="row2"><div><label>Date</label><input id="r-date" type="date" value="' + today() + '"></div><div><label>Type</label><select id="r-type"><option value="spot">Spot</option><option value="closing">Closing</option><option value="average">Average</option></select></div></div>' +
      '<div><label>Rate &mdash; value of 1 unit in ' + esc(ref) + '</label><input id="r-rate" type="number" step="0.0000001" placeholder="e.g. 1.09"></div>' +
      '</div><div class="foot"><button class="btn" id="r-cancel">Cancel</button><button class="btn pri" id="r-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("r-cancel").onclick = function () { m.remove(); };
    document.getElementById("r-save").onclick = async function () {
      var code = (document.getElementById("r-code").value || "").trim().toUpperCase();
      var rate = parseFloat(document.getElementById("r-rate").value);
      if (!code || !(rate > 0)) { toast("Enter a currency and a positive rate"); return; }
      var row = { org_id: S.org.id, code: code, rate_date: document.getElementById("r-date").value, rate: rate, rate_type: document.getElementById("r-type").value };
      var r = await sb.from("currency_rates").insert(row);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Rate saved"); renderView();
    };
  }
  var PTYPE = { service: "Service", consumable: "Consumable", storable: "Storable Product" };
  function cfgProducts() {
    return {
      title: "Products", pageSize: 80,
      fetch: function () { return sb.from("products").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.name || "") + " " + (p.default_code || ""); },
      columns: [
        { label: "Reference", get: function (p) { return '<span class="muted">' + esc(p.default_code || "") + '</span>'; } },
        { label: "Name", get: function (p) { return '<b>' + esc(p.name) + '</b>'; } },
        { label: "Type", get: function (p) { return '<span class="muted">' + esc(PTYPE[p.type] || p.type) + '</span>'; } },
        { label: "Sales Price", num: true, get: function (p) { return money(p.list_price); } },
        { label: "Cost", num: true, get: function (p) { return money(p.cost_price); } },
        { label: "Status", get: function (p) { return p.is_active ? '<span class="badge">Active</span>' : '<span class="badge unpaid">Archived</span>'; } }
      ],
      filters: [{ label: "Active", test: function (p) { return p.is_active; } }, { label: "Archived", test: function (p) { return !p.is_active; } }],
      groupBy: [{ label: "Type", get: function (p) { return PTYPE[p.type] || p.type; } }],
      kanbanCard: function (p) { return '<div class="t">' + esc(p.name) + '</div><div class="muted">' + esc(p.default_code || "") + '</div><div class="r"><span class="k">Price</span><b>' + S.company.currency_code + " " + money(p.list_price) + '</b></div>'; },
      onOpen: function (p) { renderProductForm(p.id); },
      onNew: function () { renderProductForm("new"); }
    };
  }
  function soBadge(o, isSale) {
    var s = o.state;
    if (s === "draft") return '<span class="badge draft">Quotation</span>';
    if (s === "sent") return '<span class="badge partial">Sent</span>';
    if (s === "sale" || s === "purchase") return '<span class="badge paid">' + (isSale ? "Sales Order" : "Purchase Order") + '</span>';
    if (s === "done") return '<span class="badge">Done</span>';
    if (s === "cancel") return '<span class="badge unpaid">Cancelled</span>';
    return '<span class="badge">' + esc(s) + '</span>';
  }
  function cfgOrders(kind) {
    var isSale = kind === "sale", tbl = isSale ? "sale_orders" : "purchase_orders";
    return {
      title: isSale ? "Quotations" : "Purchase Orders", pageSize: 80,
      fetch: function () { return sb.from(tbl).select("*, partners(name)").eq("company_id", S.company.id).order("date_order", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (o) { return (o.number || "") + " " + (o.partners ? o.partners.name : ""); },
      columns: [
        { label: "Number", get: function (o) { return '<b>' + esc(o.number || "Draft") + '</b>'; } },
        { label: isSale ? "Customer" : "Vendor", get: function (o) { return esc(o.partners ? o.partners.name : ""); } },
        { label: "Order Date", get: function (o) { return '<span class="muted">' + esc(o.date_order || "") + '</span>'; } },
        { label: "Total", num: true, get: function (o) { return money(o.amount_total); } },
        { label: "Status", get: function (o) { return soBadge(o, isSale); } }
      ],
      filters: [
        { label: "Quotations", test: function (o) { return o.state === "draft" || o.state === "sent"; } },
        { label: isSale ? "Sales Orders" : "Purchase Orders", test: function (o) { return o.state === "sale" || o.state === "purchase"; } }
      ],
      groupBy: [{ label: isSale ? "Customer" : "Vendor", get: function (o) { return o.partners ? o.partners.name : "None"; } }, { label: "Status", get: function (o) { return o.state; } }],
      kanbanCard: function (o) { return '<div class="t">' + esc(o.number || "Draft") + '</div><div class="muted">' + esc(o.partners ? o.partners.name : "") + '</div><div class="r"><span>' + esc(o.date_order || "") + '</span>' + soBadge(o, isSale) + '</div><div class="r"><span class="k">Total</span><b>' + S.company.currency_code + " " + money(o.amount_total) + '</b></div>'; },
      onOpen: function (o) { renderOrderForm(o.id, kind); },
      onNew: function () { renderOrderForm("new", kind); }
    };
  }
  function TYPE_LABEL(g) { return ({ asset: "Assets", liability: "Liabilities", equity: "Equity", income: "Income", expense: "Expenses", off: "Off-Balance" })[g] || g; }

  // ============================ INVOICE / BILL FORM ============================
  async function renderInvoiceForm(id, moveType) {
    var isSale = moveType.indexOf("out_") === 0, isRefund = moveType.indexOf("refund") >= 0;
    var parent = { action: isRefund ? (isSale ? "inv.outr" : "inv.inr") : (isSale ? "inv.out" : "inv.in"), title: isRefund ? (isSale ? "Credit Notes" : "Vendor Credit Notes") : (isSale ? "Invoices" : "Vendor Bills") };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();

    var inv = null, lines = [];
    if (id !== "new") {
      inv = (await sb.from("invoices").select("*, partners(name,email)").eq("id", id).maybeSingle()).data;
      lines = (await sb.from("invoice_lines").select("*").eq("invoice_id", id).order("sequence")).data || [];
    }
    var editable = !inv || inv.state === "draft";
    var partners = (await sb.from("partners").select("id,name").eq(isSale ? "is_customer" : "is_vendor", true).order("name")).data || [];
    var accounts = ((await sb.from("accounts").select("id,code,name,type_code").eq("company_id", S.company.id).eq("is_active", true).order("code")).data || [])
      .filter(function (a) { return (a.type_code || "").indexOf(isSale ? "income" : "expense") === 0; });
    var taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id).order("amount", { ascending: false })).data || [])
      .filter(function (t) { var s = (t.scope || "").toLowerCase(); return !s || s === "both" || s === (isSale ? "sale" : "purchase"); });
    if (!taxes.length) taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id)).data) || [];
    var products = ((await sb.from("products").select("id,name,default_code,list_price,cost_price,income_account_id,expense_account_id,sale_tax_id,purchase_tax_id").eq("company_id", S.company.id).eq("is_active", true).order("name")).data) || [];
    var glLines = [];
    if (inv && inv.state === "posted" && inv.journal_entry_id) glLines = (await sb.from("journal_lines").select("*, accounts(code,name)").eq("entry_id", inv.journal_entry_id)).data || [];

    // breadcrumb title
    document.querySelector(".o-bc span:last-child").textContent = inv ? (inv.number || "Draft") : "New";

    // status bar buttons
    var btns = "";
    if (editable) btns += '<button class="pri" id="f-confirm">Confirm</button><button id="f-save">Save</button><button id="f-discard">Discard</button>';
    else if (inv.state === "posted" && !isRefund && Number(inv.amount_residual) > 0.005) btns += '<button class="pri" id="f-pay">Register Payment</button>';
    if (inv && inv.state === "posted" && !isRefund) btns += '<button id="f-refund">' + (isSale ? "Add Credit Note" : "Add Refund") + '</button>';
    if (inv) btns += '<button id="f-print">Print</button>';
    if (inv && isSale) btns += '<button id="f-email">Email</button>';
    var curState = inv ? inv.state : "draft";
    var stages = '<div class="o-stages"><span class="st ' + (curState === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (curState === "posted" ? "on" : "") + '">Posted</span></div>';

    // ribbon
    var ribbon = "";
    if (inv && inv.state === "posted") {
      if (inv.payment_state === "paid") ribbon = '<div class="o-ribbon">Paid</div>';
      else if (inv.payment_state === "partial") ribbon = '<div class="o-ribbon due">Partial</div>';
    }
    // smart buttons
    var smart = "";
    if (inv && inv.state === "posted") smart = '<div class="o-smart"><button class="sb" id="sm-gl"><span class="v">' + glLines.length + '</span><span class="k">Journal Items</span></button></div>';

    // groups
    function opt(list, sel, valf, labf) { return list.map(function (x) { return '<option value="' + valf(x) + '"' + (sel === valf(x) ? " selected" : "") + '>' + esc(labf(x)) + '</option>'; }).join(""); }
    var partnerField = editable
      ? '<select id="f-partner">' + opt(partners, inv ? inv.partner_id : null, function (p) { return p.id; }, function (p) { return p.name; }) + '</select>'
      : '<span class="v">' + esc(inv && inv.partners ? inv.partners.name : "") + '</span>';
    var groups =
      '<div class="o-groups"><div>' +
      fld(isSale ? "Customer" : "Vendor", partnerField) +
      fld("Reference", editable ? '<input id="f-ref" value="' + esc(inv ? inv.ref || "" : "") + '" placeholder="optional">' : '<span class="v">' + esc(inv ? inv.ref || "" : "") + '</span>') +
      '</div><div>' +
      fld(isSale ? "Invoice Date" : "Bill Date", editable ? '<input id="f-date" type="date" value="' + (inv ? inv.invoice_date || today() : today()) + '">' : '<span class="v">' + esc(inv.invoice_date || "") + '</span>') +
      fld("Due Date", editable ? '<input id="f-due" type="date" value="' + (inv ? inv.due_date || "" : new Date(Date.now() + 2592e6).toISOString().slice(0, 10)) + '">' : '<span class="v">' + esc(inv.due_date || "") + '</span>') +
      fld("Journal", '<input readonly value="' + (isRefund ? (isSale ? "Credit Notes" : "Vendor Credit Notes") : (isSale ? "Customer Invoices" : "Vendor Bills")) + '">') +
      fld("Currency", '<input readonly value="' + esc(S.company.currency_code) + '">') +
      '</div></div>';

    // notebook
    var tabs = ['<div class="tb on" data-t="lines">' + (isSale ? "Invoice Lines" : "Bill Lines") + '</div>'];
    if (inv && inv.state === "posted") tabs.push('<div class="tb" data-t="gl">Journal Items</div>');
    tabs.push('<div class="tb" data-t="other">Other Info</div>');

    var title = inv ? (inv.number || "Draft " + (isRefund ? "Credit Note" : (isSale ? "Invoice" : "Bill"))) : "New";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet">' + smart + ribbon + '<div class="o-title">' + esc(title) + '</div>' + groups +
      '<div class="o-nb"><div class="o-nb-tabs">' + tabs.join("") + '</div><div class="o-nb-pg" id="nbpg"></div></div></div>';

    // ---- notebook rendering ----
    var linesState = lines.map(function (l) { return { name: l.name, account_id: l.account_id, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, product_id: l.product_id }; });
    function renderTab(t) {
      var pg = document.getElementById("nbpg");
      document.querySelectorAll(".o-nb-tabs .tb").forEach(function (x) { x.classList.toggle("on", x.dataset.t === t); });
      if (t === "lines") renderLines(pg);
      else if (t === "gl") pg.innerHTML = glTable();
      else pg.innerHTML = '<div class="o-groups"><div>' + fld("Narration", '<span class="v">' + esc(inv ? inv.narration || "-" : "-") + '</span>') + '</div><div>' + fld("Source", '<span class="v">' + (inv ? esc(inv.source_type || "manual") : "manual") + '</span>') + '</div></div>';
    }
    function glTable() {
      var td = 0, tc = 0;
      var body = glLines.map(function (g) { td += Number(g.debit); tc += Number(g.credit); return '<tr><td>' + esc(g.accounts ? g.accounts.code + " " + g.accounts.name : "") + '</td><td>' + esc(g.label || "") + '</td><td class="num">' + (Number(g.debit) ? money(g.debit) : "") + '</td><td class="num">' + (Number(g.credit) ? money(g.credit) : "") + '</td></tr>'; }).join("");
      return '<table class="o-lines"><thead><tr><th>Account</th><th>Label</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th></tr></thead><tbody>' + body +
        '<tr style="font-weight:700"><td colspan="2">Total</td><td class="num">' + money(td) + '</td><td class="num">' + money(tc) + '</td></tr></tbody></table>';
    }
    function renderLines(pg) {
      if (!editable) {
        var body = linesState.map(function (l) {
          var amt = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0;
          return '<tr><td>' + esc(l.name) + '</td><td class="num">' + Number(l.quantity) + '</td><td class="num">' + money(l.unit_price) + '</td><td>' + (amt ? amt + "%" : "-") + '</td><td class="num">' + money(l.quantity * l.unit_price) + '</td></tr>';
        }).join("");
        pg.innerHTML = '<table class="o-lines"><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th>Tax</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>' + body + '</tbody></table>' + totalsHTML();
        return;
      }
      var accOpts = accounts.map(function (a) { return '<option value="' + a.id + '">' + esc(a.code + " " + a.name) + '</option>'; }).join("");
      var taxOpts = '<option value="">No tax</option>' + taxes.map(function (t) { return '<option value="' + t.id + '" data-amt="' + Number(t.amount) + '">' + esc(t.name) + ' (' + Number(t.amount) + '%)</option>'; }).join("");
      var prodOpts = '<option value="">-</option>' + products.map(function (p) { return '<option value="' + p.id + '">' + esc((p.default_code ? "[" + p.default_code + "] " : "") + p.name) + '</option>'; }).join("");
      pg.innerHTML = '<table class="o-lines"><thead><tr>' + (products.length ? '<th style="width:150px">Product</th>' : '') + '<th>Description</th><th style="width:140px">' + (isSale ? "Revenue Account" : "Expense Account") + '</th><th style="width:56px;text-align:right">Qty</th><th style="width:96px;text-align:right">Unit Price</th><th style="width:112px">Tax</th><th style="width:88px;text-align:right">Subtotal</th><th style="width:24px"></th></tr></thead><tbody id="lnbody"></tbody></table>' +
        '<button class="o-addln" id="addln">+ Add a line</button>' + totalsHTML();
      var lb = document.getElementById("lnbody");
      function addRow(l) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          (products.length ? '<td><select class="l-prod">' + prodOpts + '</select></td>' : '') +
          '<td><input class="l-name" value="' + esc(l ? l.name : "") + '" placeholder="Description"></td>' +
          '<td><select class="l-acct">' + accOpts + '</select></td>' +
          '<td><input class="l-qty num" type="number" step="0.01" value="' + (l ? l.quantity : 1) + '"></td>' +
          '<td><input class="l-price num" type="number" step="0.01" value="' + (l ? l.unit_price : 0) + '"></td>' +
          '<td><select class="l-tax">' + taxOpts + '</select></td>' +
          '<td class="num l-sub">0.00</td><td><button class="del">&times;</button></td>';
        lb.appendChild(tr);
        if (l && l.account_id) tr.querySelector(".l-acct").value = l.account_id;
        if (l && l.tax_id) tr.querySelector(".l-tax").value = l.tax_id;
        if (l && l.product_id && tr.querySelector(".l-prod")) tr.querySelector(".l-prod").value = l.product_id;
        var psel = tr.querySelector(".l-prod");
        if (psel) psel.addEventListener("change", function () {
          var pr = products.filter(function (x) { return x.id === psel.value; })[0]; if (!pr) return;
          tr.querySelector(".l-name").value = pr.name;
          tr.querySelector(".l-price").value = isSale ? pr.list_price : pr.cost_price;
          var acc = isSale ? pr.income_account_id : pr.expense_account_id; if (acc) tr.querySelector(".l-acct").value = acc;
          var tx = isSale ? pr.sale_tax_id : pr.purchase_tax_id; if (tx) tr.querySelector(".l-tax").value = tx;
          recalc();
        });
        tr.querySelector(".del").onclick = function () { tr.remove(); recalc(); };
        tr.querySelectorAll("input,select").forEach(function (el) { el.addEventListener("input", recalc); });
        recalc();
      }
      document.getElementById("addln").onclick = function () { addRow(null); };
      if (linesState.length) linesState.forEach(addRow); else addRow(null);
      recalc();
    }
    function currentLines() {
      var lb = document.getElementById("lnbody"); if (!lb) return linesState;
      return Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) {
        var q = parseFloat(tr.querySelector(".l-qty").value) || 0, p = parseFloat(tr.querySelector(".l-price").value) || 0;
        var ps = tr.querySelector(".l-prod");
        return { name: tr.querySelector(".l-name").value.trim() || (isSale ? "Service" : "Cost"), account_id: tr.querySelector(".l-acct").value || null, tax_id: tr.querySelector(".l-tax").value || null, quantity: q, unit_price: p, product_id: ps ? (ps.value || null) : null };
      });
    }
    function recalc() {
      var lb = document.getElementById("lnbody"); if (!lb) return;
      var sub = 0, tax = 0;
      lb.querySelectorAll("tr").forEach(function (tr) {
        var q = parseFloat(tr.querySelector(".l-qty").value) || 0, p = parseFloat(tr.querySelector(".l-price").value) || 0, ln = q * p;
        var ts = tr.querySelector(".l-tax"); var amt = ts.value ? Number(ts.options[ts.selectedIndex].getAttribute("data-amt")) : 0;
        sub += ln; tax += ln * amt / 100; tr.querySelector(".l-sub").textContent = money(ln);
      });
      setTotals(sub, tax);
    }
    function totalsHTML() { return '<div class="o-tot" id="o-tot"></div>'; }
    function setTotals(sub, tax) {
      var el = document.getElementById("o-tot"); if (!el) return;
      el.innerHTML = '<div class="r"><span class="k">Untaxed Amount</span><span>' + S.company.currency_code + " " + money(sub) + '</span></div>' +
        '<div class="r"><span class="k">Taxes</span><span>' + S.company.currency_code + " " + money(tax) + '</span></div>' +
        '<div class="r tt"><span class="k">Total</span><span>' + S.company.currency_code + " " + money(sub + tax) + '</span></div>';
    }
    if (!editable) { // compute static totals
      var sub0 = linesState.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
      var tax0 = linesState.reduce(function (s, l) { var a = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0; return s + l.quantity * l.unit_price * a / 100; }, 0);
      renderTab("lines"); setTotals(sub0, tax0);
    } else renderTab("lines");
    document.querySelectorAll(".o-nb-tabs .tb").forEach(function (x) { x.onclick = function () { renderTab(x.dataset.t); }; });
    if (smart) document.getElementById("sm-gl").onclick = function () { renderTab("gl"); };

    // ---- actions ----
    async function save(alsoPost) {
      var partnerId = document.getElementById("f-partner").value;
      if (!partnerId) { toast("Pick a " + (isSale ? "customer" : "vendor")); return null; }
      var lns = currentLines().filter(function (l) { return l.quantity * l.unit_price || l.name; });
      if (!lns.length) { toast("Add at least one line"); return null; }
      var untax = lns.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
      var hdr = {
        partner_id: partnerId, invoice_date: document.getElementById("f-date").value,
        due_date: document.getElementById("f-due").value || null, ref: document.getElementById("f-ref").value.trim(),
        amount_untaxed: untax, amount_total: untax, amount_residual: untax
      };
      var invId = id;
      if (id === "new") {
        hdr.company_id = S.company.id; hdr.move_type = moveType; hdr.currency_code = S.company.currency_code; hdr.state = "draft";
        hdr.number = await nextNumber(moveType);
        var ins = await sb.from("invoices").insert(hdr).select("id").single();
        if (ins.error) { toast("Could not save: " + ins.error.message); return null; }
        invId = ins.data.id;
      } else {
        var up = await sb.from("invoices").update(hdr).eq("id", id);
        if (up.error) { toast("Could not save: " + up.error.message); return null; }
        await sb.from("invoice_lines").delete().eq("invoice_id", id);
      }
      var rows = lns.map(function (l, i) { return { company_id: S.company.id, invoice_id: invId, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, account_id: l.account_id, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price }; });
      var lr = await sb.from("invoice_lines").insert(rows);
      if (lr.error) { toast("Lines failed: " + lr.error.message); return null; }
      if (alsoPost) { var pr = await sb.rpc("post_invoice", { p_invoice: invId }); if (pr.error) { toast("Saved draft, posting failed: " + pr.error.message); return invId; } }
      return invId;
    }
    if (editable) {
      document.getElementById("f-discard").onclick = function () { go(isSale ? "inv.out" : "inv.in"); };
      document.getElementById("f-save").onclick = async function () { var nid = await save(false); if (nid) { toast("Saved"); renderInvoiceForm(nid, moveType); } };
      document.getElementById("f-confirm").onclick = async function () { var nid = await save(true); if (nid) { toast("Posted to the ledger"); renderInvoiceForm(nid, moveType); } };
    } else if (inv.state === "posted" && Number(inv.amount_residual) > 0.005) {
      document.getElementById("f-pay").onclick = function () { openPaymentModal(inv, function () { renderInvoiceForm(id, moveType); }); };
    }
    if (inv && inv.state === "posted" && !isRefund) document.getElementById("f-refund").onclick = function () { createCreditNote(inv, linesState, isSale); };
    if (inv) document.getElementById("f-print").onclick = function () { printInvoice(inv, linesState, isSale, taxes); };
    if (inv && isSale) document.getElementById("f-email").onclick = function () { openSendModal(inv); };
  }
  function openSendModal(inv) {
    var isRefund = (inv.move_type || "").indexOf("refund") >= 0;
    var to = inv.partners && inv.partners.email ? inv.partners.email : "";
    var m = document.createElement("div"); m.className = "modal on"; m.id = "sendmodal";
    m.innerHTML = '<div class="sheet"><h3>Email ' + esc(inv.number || "") + '</h3><div class="form" style="padding:16px 18px;display:grid;gap:12px">' +
      '<div><label>To</label><input id="s-to" type="email" value="' + esc(to) + '" placeholder="customer@email.com"></div>' +
      '<div class="muted" style="font-size:12px">A clean ' + (isRefund ? "credit note" : "invoice") + ' will be emailed from your Space Work address. The customer receives a proper document, not this app.</div>' +
      '</div><div class="foot"><button class="btn" id="s-cancel">Cancel</button><button class="btn pri" id="s-send" style="background:var(--app);border-color:var(--app)">Send</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("s-cancel").onclick = function () { m.remove(); };
    document.getElementById("s-send").onclick = async function () {
      var to2 = document.getElementById("s-to").value.trim();
      var btn = document.getElementById("s-send"); btn.disabled = true; btn.textContent = "Sending...";
      var sess = (await sb.auth.getSession()).data.session;
      if (!sess) { toast("Sign in again"); btn.disabled = false; btn.textContent = "Send"; return; }
      try {
        var res = await fetch("/api/send-invoice", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + sess.access_token }, body: JSON.stringify({ invoice_id: inv.id, to: to2 }) });
        var j = await res.json().catch(function () { return {}; });
        if (!res.ok) { toast(j.error || "Send failed"); btn.disabled = false; btn.textContent = "Send"; return; }
        m.remove(); toast("Sent to " + j.to);
      } catch (e) { toast("Send failed: " + (e && e.message)); btn.disabled = false; btn.textContent = "Send"; }
    };
  }
  function fld(label, valueHtml) { return '<div class="o-fld"><label>' + esc(label) + '</label><div class="v">' + valueHtml + '</div></div>'; }
  async function createCreditNote(inv, lines, isSale) {
    var moveType = isSale ? "out_refund" : "in_refund";
    var untax = lines.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
    var hdr = { company_id: S.company.id, move_type: moveType, partner_id: inv.partner_id, number: await nextNumber(moveType), invoice_date: today(), due_date: today(), currency_code: inv.currency_code || S.company.currency_code, state: "draft", ref: "Credit note for " + (inv.number || ""), amount_untaxed: untax, amount_total: untax, amount_residual: untax };
    var ins = await sb.from("invoices").insert(hdr).select("id").single();
    if (ins.error) { toast("Could not create: " + ins.error.message); return; }
    var invId = ins.data.id;
    var rows = lines.map(function (l, i) { return { company_id: S.company.id, invoice_id: invId, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, account_id: l.account_id, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price }; });
    var lr = await sb.from("invoice_lines").insert(rows);
    if (lr.error) { toast("Lines failed: " + lr.error.message); return; }
    toast("Credit note created (draft)");
    renderInvoiceForm(invId, moveType);
  }

  // ============================ PRINT / PDF ============================
  function printInvoice(inv, lines, isSale, taxes) {
    var co = S.company, cc = inv.currency_code || co.currency_code;
    var isRefund = (inv.move_type || "").indexOf("refund") >= 0;
    var docTitle = isSale ? (isRefund ? "Credit Note" : "Invoice") : (isRefund ? "Vendor Credit Note" : "Vendor Bill");
    var partner = inv.partners ? inv.partners.name : "";
    var sub = 0, tax = 0;
    var body = lines.map(function (l) {
      var amt = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0;
      var ls = Number(l.quantity) * Number(l.unit_price); sub += ls; tax += ls * amt / 100;
      return '<tr><td>' + esc(l.name) + '</td><td class="r">' + Number(l.quantity) + '</td><td class="r">' + money(l.unit_price) + '</td><td class="r">' + (amt ? amt + "%" : "-") + '</td><td class="r">' + money(ls) + '</td></tr>';
    }).join("");
    var tot = sub + tax, due = Number(inv.amount_residual != null ? inv.amount_residual : tot);
    var html =
      '<div class="pinv">' +
      '<div class="phead"><div class="pfrom"><div class="pname">' + esc(co.name) + '</div><div class="pmuted">' + esc(co.legal_name || "") + (co.country ? "<br>" + esc(co.country) : "") + '</div></div>' +
      '<div class="pdoc"><div class="pdt">' + docTitle + '</div><div class="pnum">' + esc(inv.number || "Draft") + '</div></div></div>' +
      '<div class="pmeta"><div><div class="pl">Bill to</div><div class="pv">' + esc(partner) + '</div></div>' +
      '<div><div class="pl">' + (isSale ? "Invoice Date" : "Bill Date") + '</div><div class="pv">' + esc(inv.invoice_date || "") + '</div>' +
      '<div class="pl" style="margin-top:8px">Due Date</div><div class="pv">' + esc(inv.due_date || "-") + '</div></div></div>' +
      '<table class="ptab"><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit Price</th><th class="r">Tax</th><th class="r">Amount</th></tr></thead><tbody>' + body + '</tbody></table>' +
      '<div class="psum"><div class="pr"><span>Untaxed Amount</span><span>' + cc + " " + money(sub) + '</span></div>' +
      '<div class="pr"><span>Taxes</span><span>' + cc + " " + money(tax) + '</span></div>' +
      '<div class="pr ptt"><span>Total</span><span>' + cc + " " + money(tot) + '</span></div>' +
      '<div class="pr"><span>Amount Due</span><span>' + cc + " " + money(due) + '</span></div></div>' +
      '<div class="pfoot">' + esc(co.name) + ' &middot; Generated by Orbit</div></div>';
    var wrap = document.createElement("div"); wrap.className = "o-print"; wrap.innerHTML = html;
    document.body.appendChild(wrap);
    document.body.classList.add("printing");
    window.print();
    setTimeout(function () { document.body.classList.remove("printing"); wrap.remove(); }, 400);
  }
  async function nextNumber(moveType) {
    var prefix = { out_invoice: "INV", out_refund: "RINV", in_invoice: "BILL", in_refund: "RBILL" }[moveType] || "INV";
    var r = await sb.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("move_type", moveType);
    return prefix + "/" + new Date().getFullYear() + "/" + ("0000" + ((r.count || 0) + 1)).slice(-4);
  }

  // ============================ SALES / PURCHASE ORDER FORM ============================
  async function renderOrderForm(id, kind) {
    var isSale = kind === "sale", tbl = isSale ? "sale_orders" : "purchase_orders", ltbl = isSale ? "sale_order_lines" : "purchase_order_lines";
    var listAction = isSale ? "so.list" : "po.list";
    var parent = { action: listAction, title: isSale ? "Quotations" : "Purchase Orders" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var order = null, lines = [];
    if (id !== "new") {
      order = (await sb.from(tbl).select("*, partners(name)").eq("id", id).maybeSingle()).data;
      lines = (await sb.from(ltbl).select("*").eq("order_id", id).order("id")).data || [];
    }
    var editable = !order || order.state === "draft" || order.state === "sent";
    var confirmed = order && (order.state === "sale" || order.state === "purchase" || order.state === "done");
    var partners = (await sb.from("partners").select("id,name").eq(isSale ? "is_customer" : "is_vendor", true).order("name")).data || [];
    var products = ((await sb.from("products").select("id,name,default_code,list_price,cost_price,sale_tax_id,purchase_tax_id").eq("company_id", S.company.id).eq("is_active", true).order("name")).data) || [];
    var taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id).order("amount", { ascending: false })).data || []).filter(function (t) { var s = (t.scope || "").toLowerCase(); return !s || s === "both" || s === (isSale ? "sale" : "purchase"); });
    if (!taxes.length) taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id)).data) || [];
    document.querySelector(".o-bc span:last-child").textContent = order ? (order.number || "Draft") : "New";

    var btns = "";
    if (editable) btns += '<button class="pri" id="o-confirm">Confirm</button><button id="o-save">Save</button><button id="o-discard">Discard</button>';
    else if (confirmed) btns += '<button class="pri" id="o-toinv">' + (isSale ? "Create Invoice" : "Create Bill") + '</button>';
    var st = order ? order.state : "draft", atFirst = (st === "draft" || st === "sent");
    var stages = '<div class="o-stages"><span class="st ' + (atFirst ? "on" : "done") + '">' + (isSale ? "Quotation" : "Draft") + '</span><span class="st ' + (!atFirst ? "on" : "") + '">' + (isSale ? "Sales Order" : "Purchase Order") + '</span></div>';

    var partnerField = editable ? '<select id="o-partner">' + partners.map(function (p) { return '<option value="' + p.id + '"' + ((order && order.partner_id === p.id) ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc(order && order.partners ? order.partners.name : "") + '</span>';
    var groups = '<div class="o-groups"><div>' +
      fld(isSale ? "Customer" : "Vendor", partnerField) +
      fld("Currency", '<input readonly value="' + esc(S.company.currency_code) + '">') +
      '</div><div>' +
      fld("Order Date", editable ? '<input id="o-date" type="date" value="' + (order ? order.date_order || today() : today()) + '">' : '<span class="v">' + esc(order.date_order || "") + '</span>') +
      fld("Reference / Note", editable ? '<input id="o-ref" value="' + esc(order ? order.note || "" : "") + '" placeholder="optional">' : '<span class="v">' + esc(order ? order.note || "" : "") + '</span>') +
      '</div></div>';
    var title = order ? (order.number || (isSale ? "Draft Quotation" : "Draft Purchase Order")) : "New";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title">' + esc(title) + '</div>' + groups +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Order Lines</div></div><div class="o-nb-pg" id="nbpg"></div></div></div>';

    var linesState = lines.map(function (l) { return { name: l.name, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, product_id: l.product_id }; });
    function totHTML() { return '<div class="o-tot" id="o-tot"></div>'; }
    function setTot(sub, tax) { var el = document.getElementById("o-tot"); if (!el) return; el.innerHTML = '<div class="r"><span class="k">Untaxed Amount</span><span>' + S.company.currency_code + " " + money(sub) + '</span></div><div class="r"><span class="k">Taxes</span><span>' + S.company.currency_code + " " + money(tax) + '</span></div><div class="r tt"><span class="k">Total</span><span>' + S.company.currency_code + " " + money(sub + tax) + '</span></div>'; }
    function recalc() { var lb = document.getElementById("lnbody"); if (!lb) return; var sub = 0, tax = 0; lb.querySelectorAll("tr").forEach(function (tr) { var q = parseFloat(tr.querySelector(".l-qty").value) || 0, p = parseFloat(tr.querySelector(".l-price").value) || 0, ln = q * p; var ts = tr.querySelector(".l-tax"); var amt = ts.value ? Number(ts.options[ts.selectedIndex].getAttribute("data-amt")) : 0; sub += ln; tax += ln * amt / 100; tr.querySelector(".l-sub").textContent = money(ln); }); setTot(sub, tax); }
    function currentLines() { var lb = document.getElementById("lnbody"); if (!lb) return linesState; return Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) { var q = parseFloat(tr.querySelector(".l-qty").value) || 0, p = parseFloat(tr.querySelector(".l-price").value) || 0, ps = tr.querySelector(".l-prod"); return { name: tr.querySelector(".l-name").value.trim() || "Item", tax_id: tr.querySelector(".l-tax").value || null, quantity: q, unit_price: p, product_id: ps ? (ps.value || null) : null }; }); }
    function renderLines() {
      var pg = document.getElementById("nbpg");
      if (!editable) {
        var body = linesState.map(function (l) { var amt = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0; return '<tr><td>' + esc(l.name) + '</td><td class="num">' + Number(l.quantity) + '</td><td class="num">' + money(l.unit_price) + '</td><td>' + (amt ? amt + "%" : "-") + '</td><td class="num">' + money(l.quantity * l.unit_price) + '</td></tr>'; }).join("");
        pg.innerHTML = '<table class="o-lines"><thead><tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th>Tax</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>' + body + '</tbody></table>' + totHTML();
        var sub0 = linesState.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0), tax0 = linesState.reduce(function (s, l) { var a = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0; return s + l.quantity * l.unit_price * a / 100; }, 0);
        setTot(sub0, tax0); return;
      }
      var prodOpts = '<option value="">-</option>' + products.map(function (p) { return '<option value="' + p.id + '">' + esc((p.default_code ? "[" + p.default_code + "] " : "") + p.name) + '</option>'; }).join("");
      var taxOpts = '<option value="">No tax</option>' + taxes.map(function (t) { return '<option value="' + t.id + '" data-amt="' + Number(t.amount) + '">' + esc(t.name) + ' (' + Number(t.amount) + '%)</option>'; }).join("");
      pg.innerHTML = '<table class="o-lines"><thead><tr>' + (products.length ? '<th style="width:170px">Product</th>' : "") + '<th>Description</th><th style="width:56px;text-align:right">Qty</th><th style="width:96px;text-align:right">Unit Price</th><th style="width:112px">Tax</th><th style="width:88px;text-align:right">Subtotal</th><th style="width:24px"></th></tr></thead><tbody id="lnbody"></tbody></table><button class="o-addln" id="addln">+ Add a line</button>' + totHTML();
      var lb = document.getElementById("lnbody");
      function addRow(l) {
        var tr = document.createElement("tr");
        tr.innerHTML = (products.length ? '<td><select class="l-prod">' + prodOpts + '</select></td>' : "") + '<td><input class="l-name" value="' + esc(l ? l.name : "") + '" placeholder="Description"></td><td><input class="l-qty num" type="number" step="0.01" value="' + (l ? l.quantity : 1) + '"></td><td><input class="l-price num" type="number" step="0.01" value="' + (l ? l.unit_price : 0) + '"></td><td><select class="l-tax">' + taxOpts + '</select></td><td class="num l-sub">0.00</td><td><button class="del">&times;</button></td>';
        lb.appendChild(tr);
        if (l && l.tax_id) tr.querySelector(".l-tax").value = l.tax_id;
        if (l && l.product_id && tr.querySelector(".l-prod")) tr.querySelector(".l-prod").value = l.product_id;
        var ps = tr.querySelector(".l-prod");
        if (ps) ps.addEventListener("change", function () { var pr = products.filter(function (x) { return x.id === ps.value; })[0]; if (!pr) return; tr.querySelector(".l-name").value = pr.name; tr.querySelector(".l-price").value = isSale ? pr.list_price : pr.cost_price; var tx = isSale ? pr.sale_tax_id : pr.purchase_tax_id; if (tx) tr.querySelector(".l-tax").value = tx; recalc(); });
        tr.querySelector(".del").onclick = function () { tr.remove(); recalc(); };
        tr.querySelectorAll("input,select").forEach(function (el) { el.addEventListener("input", recalc); });
        recalc();
      }
      document.getElementById("addln").onclick = function () { addRow(null); };
      if (linesState.length) linesState.forEach(addRow); else addRow(null);
      recalc();
    }
    renderLines();

    async function save(confirmIt) {
      var partnerId = document.getElementById("o-partner").value;
      if (!partnerId) { toast("Pick a " + (isSale ? "customer" : "vendor")); return null; }
      var lns = currentLines().filter(function (l) { return l.quantity * l.unit_price || l.name !== "Item"; });
      if (!lns.length) { toast("Add at least one line"); return null; }
      var untax = lns.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
      var tax = lns.reduce(function (s, l) { var a = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0; return s + l.quantity * l.unit_price * a / 100; }, 0);
      var hdr = { partner_id: partnerId, date_order: document.getElementById("o-date").value, note: document.getElementById("o-ref").value.trim(), amount_untaxed: untax, amount_tax: tax, amount_total: untax + tax };
      var oid = id;
      if (id === "new") {
        hdr.company_id = S.company.id; hdr.currency_code = S.company.currency_code; hdr.state = confirmIt ? (isSale ? "sale" : "purchase") : "draft"; hdr.number = await nextOrderNumber(kind);
        var ins = await sb.from(tbl).insert(hdr).select("id").single(); if (ins.error) { toast("Could not save: " + ins.error.message); return null; } oid = ins.data.id;
      } else {
        if (confirmIt) hdr.state = isSale ? "sale" : "purchase";
        var up = await sb.from(tbl).update(hdr).eq("id", id); if (up.error) { toast("Could not save: " + up.error.message); return null; }
        await sb.from(ltbl).delete().eq("order_id", id);
      }
      var rows = lns.map(function (l, i) { return { company_id: S.company.id, order_id: oid, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, quantity: l.quantity, unit_price: l.unit_price, tax_id: l.tax_id, price_subtotal: l.quantity * l.unit_price }; });
      var lr = await sb.from(ltbl).insert(rows); if (lr.error) { toast("Lines failed: " + lr.error.message); return null; }
      return oid;
    }
    if (editable) {
      document.getElementById("o-discard").onclick = function () { go(listAction); };
      document.getElementById("o-save").onclick = async function () { var nid = await save(false); if (nid) { toast("Saved"); renderOrderForm(nid, kind); } };
      document.getElementById("o-confirm").onclick = async function () { var nid = await save(true); if (nid) { toast(isSale ? "Sales order confirmed" : "Purchase order confirmed"); renderOrderForm(nid, kind); } };
    } else if (confirmed) {
      document.getElementById("o-toinv").onclick = function () { createInvoiceFromOrder(order, linesState, kind); };
    }
  }
  async function nextOrderNumber(kind) {
    var prefix = kind === "sale" ? "SO" : "PO", tbl = kind === "sale" ? "sale_orders" : "purchase_orders";
    var r = await sb.from(tbl).select("id", { count: "exact", head: true }).eq("company_id", S.company.id);
    return prefix + "/" + new Date().getFullYear() + "/" + ("0000" + ((r.count || 0) + 1)).slice(-4);
  }
  async function createInvoiceFromOrder(order, lines, kind) {
    var isSale = kind === "sale", moveType = isSale ? "out_invoice" : "in_invoice";
    var untax = lines.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
    var hdr = { company_id: S.company.id, move_type: moveType, partner_id: order.partner_id, number: await nextNumber(moveType), invoice_date: today(), due_date: new Date(Date.now() + 2592e6).toISOString().slice(0, 10), currency_code: S.company.currency_code, state: "draft", amount_untaxed: untax, amount_total: untax, amount_residual: untax };
    hdr[isSale ? "sale_order_id" : "purchase_order_id"] = order.id;
    var ins = await sb.from("invoices").insert(hdr).select("id").single();
    if (ins.error) { toast("Could not create: " + ins.error.message); return; }
    var invId = ins.data.id;
    var rows = lines.map(function (l, i) { return { company_id: S.company.id, invoice_id: invId, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price }; });
    var lr = await sb.from("invoice_lines").insert(rows);
    if (lr.error) { toast("Invoice lines failed: " + lr.error.message); return; }
    toast(isSale ? "Invoice created (draft)" : "Bill created (draft)");
    renderInvoiceForm(invId, moveType);
  }

  // ============================ PARTNER FORM ============================
  async function renderPartnerForm(id, kind) {
    var isCust = kind === "customer";
    var parent = { action: isCust ? "cust" : "vend", title: isCust ? "Customers" : "Vendors" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var p = id === "new" ? {} : (await sb.from("partners").select("*").eq("id", id).maybeSingle()).data || {};
    var invCount = id === "new" ? 0 : ((await sb.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("partner_id", id).eq("move_type", isCust ? "out_invoice" : "in_invoice")).count || 0);
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (p.name || "");
    var smart = id !== "new" ? '<div class="o-smart"><button class="sb" id="sm-inv"><span class="v">' + invCount + '</span><span class="k">' + (isCust ? "Invoices" : "Bills") + '</span></button></div>' : "";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="p-save">Save</button><button id="p-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet">' + smart +
      '<div class="o-title"><input id="p-name" value="' + esc(p.name || "") + '" placeholder="' + (isCust ? "Customer" : "Vendor") + ' name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Email", '<input id="p-email" value="' + esc(p.email || "") + '" placeholder="name@company.com">') +
      fld("Phone", '<input id="p-phone" value="' + esc(p.phone || "") + '">') +
      fld("Tax / VAT no.", '<input id="p-vat" value="' + esc(p.vat || "") + '">') +
      '</div><div>' +
      fld("Street", '<input id="p-street" value="' + esc(p.street || "") + '">') +
      fld("City", '<input id="p-city" value="' + esc(p.city || "") + '">') +
      fld("Country", '<input id="p-country" value="' + esc(p.country || "") + '">') +
      '</div></div></div>';
    if (id !== "new") document.getElementById("sm-inv").onclick = function () { go(isCust ? "inv.out" : "inv.in"); };
    document.getElementById("p-discard").onclick = function () { go(isCust ? "cust" : "vend"); };
    document.getElementById("p-save").onclick = async function () {
      var name = document.getElementById("p-name").value.trim();
      if (!name) { toast("Name is required"); return; }
      var row = { name: name, email: gv("p-email"), phone: gv("p-phone"), vat: gv("p-vat"), street: gv("p-street"), city: gv("p-city"), country: gv("p-country") };
      var r;
      if (id === "new") { row.org_id = S.company.org_id; row.is_company = true; row.is_customer = isCust; row.is_vendor = !isCust; r = await sb.from("partners").insert(row); }
      else r = await sb.from("partners").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go(isCust ? "cust" : "vend");
    };
  }
  function gv(id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; }

  // ============================ ACCOUNT FORM ============================
  async function renderAccountForm(id) {
    var parent = { action: "accounts", title: "Chart of Accounts" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var a = id === "new" ? { is_active: true } : (await sb.from("accounts").select("*").eq("id", id).maybeSingle()).data || {};
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (a.code + " " + a.name);
    var typeOpts = S.types.map(function (t) { return '<option value="' + t.code + '"' + (a.type_code === t.code ? " selected" : "") + '>' + esc(t.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="a-save">Save</button><button id="a-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="a-name" value="' + esc(a.name || "") + '" placeholder="Account name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Code", '<input id="a-code" value="' + esc(a.code || "") + '" placeholder="e.g. 7020">') +
      fld("Type", '<select id="a-type">' + typeOpts + '</select>') +
      '</div><div>' +
      fld("Status", '<select id="a-active"><option value="1"' + (a.is_active ? " selected" : "") + '>Active</option><option value="0"' + (!a.is_active ? " selected" : "") + '>Archived</option></select>') +
      '</div></div></div>';
    document.getElementById("a-discard").onclick = function () { go("accounts"); };
    document.getElementById("a-save").onclick = async function () {
      var code = gv("a-code"), name = gv("a-name");
      if (!code || !name) { toast("Code and name are required"); return; }
      var row = { code: code, name: name, type_code: document.getElementById("a-type").value, is_active: document.getElementById("a-active").value === "1" };
      var r;
      if (id === "new") { row.company_id = S.company.id; r = await sb.from("accounts").insert(row); }
      else r = await sb.from("accounts").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("accounts");
    };
  }

  // ============================ PRODUCT FORM ============================
  async function renderProductForm(id) {
    var parent = { action: "products", title: "Products" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var p = id === "new" ? { type: "service", is_active: true } : (await sb.from("products").select("*").eq("id", id).maybeSingle()).data || {};
    var accs = (await sb.from("accounts").select("id,code,name,type_code").eq("company_id", S.company.id).eq("is_active", true).order("code")).data || [];
    var inc = accs.filter(function (a) { return (a.type_code || "").indexOf("income") === 0; });
    var exp = accs.filter(function (a) { return (a.type_code || "").indexOf("expense") === 0; });
    var taxes = (await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id).order("amount", { ascending: false })).data || [];
    var saleTax = taxes.filter(function (t) { var s = (t.scope || "").toLowerCase(); return !s || s === "both" || s === "sale"; });
    var purTax = taxes.filter(function (t) { var s = (t.scope || "").toLowerCase(); return !s || s === "both" || s === "purchase"; });
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (p.name || "");
    function sel(id2, list, cur, blank) { return '<select id="' + id2 + '">' + (blank ? '<option value="">' + blank + '</option>' : '') + list.map(function (x) { return '<option value="' + (x.id || x.code) + '"' + ((cur === (x.id || x.code)) ? " selected" : "") + '>' + esc(x.name ? ((x.code ? x.code + " " : "") + x.name) : x) + (x.amount != null ? " (" + x.amount + "%)" : "") + '</option>'; }).join("") + '</select>'; }
    var typeSel = '<select id="pr-type">' + Object.keys(PTYPE).map(function (k) { return '<option value="' + k + '"' + (p.type === k ? " selected" : "") + '>' + PTYPE[k] + '</option>'; }).join("") + '</select>';
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pr-save">Save</button><button id="pr-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="pr-name" value="' + esc(p.name || "") + '" placeholder="Product name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Reference", '<input id="pr-code" value="' + esc(p.default_code || "") + '">') +
      fld("Type", typeSel) +
      fld("Sales Price", '<input id="pr-price" type="number" step="0.01" value="' + (p.list_price || 0) + '">') +
      fld("Cost", '<input id="pr-cost" type="number" step="0.01" value="' + (p.cost_price || 0) + '">') +
      fld("Status", '<select id="pr-active"><option value="1"' + (p.is_active ? " selected" : "") + '>Active</option><option value="0"' + (!p.is_active ? " selected" : "") + '>Archived</option></select>') +
      '</div><div>' +
      fld("Income Account", sel("pr-inc", inc, p.income_account_id, "Default")) +
      fld("Expense Account", sel("pr-exp", exp, p.expense_account_id, "Default")) +
      fld("Sales Tax", sel("pr-stax", saleTax, p.sale_tax_id, "None")) +
      fld("Purchase Tax", sel("pr-ptax", purTax, p.purchase_tax_id, "None")) +
      '</div></div></div>';
    document.getElementById("pr-discard").onclick = function () { go("products"); };
    document.getElementById("pr-save").onclick = async function () {
      var name = gv("pr-name"); if (!name) { toast("Name is required"); return; }
      var row = {
        name: name, default_code: gv("pr-code"), type: document.getElementById("pr-type").value,
        list_price: parseFloat(gv("pr-price")) || 0, cost_price: parseFloat(gv("pr-cost")) || 0,
        income_account_id: document.getElementById("pr-inc").value || null, expense_account_id: document.getElementById("pr-exp").value || null,
        sale_tax_id: document.getElementById("pr-stax").value || null, purchase_tax_id: document.getElementById("pr-ptax").value || null,
        is_active: document.getElementById("pr-active").value === "1"
      };
      var r;
      if (id === "new") { row.company_id = S.company.id; r = await sb.from("products").insert(row); }
      else r = await sb.from("products").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("products");
    };
  }

  // ============================ PAYMENT MODAL ============================
  function openPaymentModal(inv, onDone) {
    var due = Number(inv.amount_residual || inv.amount_total || 0);
    var m = document.createElement("div"); m.className = "modal on"; m.id = "paymodal";
    m.innerHTML = '<div class="sheet"><h3>Register Payment &middot; ' + esc(inv.number || "") + '</h3><div class="form">' +
      '<div><label>Amount (' + esc(S.company.currency_code) + ')</label><input id="p-amt" type="number" step="0.01" value="' + due + '"></div>' +
      '<div class="row2"><div><label>Date</label><input id="p-date" type="date" value="' + today() + '"></div><div><label>Journal</label><select id="p-jrn"><option value="BNK">Bank</option><option value="CSH">Cash</option></select></div></div>' +
      '<div><label>Reference</label><input id="p-ref" placeholder="Receipt / transfer ref"></div>' +
      '</div><div class="foot"><button class="btn" id="p-cancel">Cancel</button><button class="btn pri" id="p-save" style="background:var(--app);border-color:var(--app)">Register</button></div></div>';
    document.body.appendChild(m);
    m.querySelector(".form").style.cssText = "padding:16px 18px;display:grid;gap:12px";
    document.getElementById("p-cancel").onclick = function () { m.remove(); };
    document.getElementById("p-save").onclick = async function () {
      var amt = parseFloat(document.getElementById("p-amt").value);
      if (!(amt > 0)) { toast("Enter an amount"); return; }
      var r = await sb.rpc("register_payment", { p_invoice: inv.id, p_amount: amt, p_date: document.getElementById("p-date").value, p_journal_code: document.getElementById("p-jrn").value, p_method: "bank", p_ref: document.getElementById("p-ref").value });
      if (r.error) { toast("Could not register: " + r.error.message); return; }
      m.remove(); toast("Payment registered"); if (onDone) onDone();
    };
  }

  // ============================ DASHBOARD ============================
  async function renderDashboard() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Dashboard") + '</div><div class="o-form-bg" style="padding:18px"><div id="db" class="o-empty">Loading...</div></div></div>';
    wireBc();
    var rows = (await sb.rpc("trial_balance", { p_company: S.company.id })).data || [];
    var income = 0, expense = 0, cash = 0, recv = 0, pay = 0;
    rows.forEach(function (r) {
      var g = (r.type_code || "").split("_")[0];
      if (g === "income") income += Number(r.credit) - Number(r.debit);
      if (g === "expense") expense += Number(r.debit) - Number(r.credit);
      if (r.type_code === "asset_cash") cash += Number(r.balance);
      if (r.type_code === "asset_receivable") recv += Number(r.balance);
      if (r.type_code === "liability_payable") pay += Number(r.credit) - Number(r.debit);
    });
    var cc = S.company.currency_code;
    document.getElementById("db").className = "";
    document.getElementById("db").innerHTML =
      '<div class="kpis">' +
      kpi("Cash &amp; Bank", cc + " " + money(cash)) + kpi("Receivable", cc + " " + money(recv)) +
      kpi("Payable", cc + " " + money(pay)) + kpi("Net Result (YTD)", cc + " " + money(income - expense)) + '</div>' +
      '<div class="o-jcards">' +
      jcard("Customer Invoices", cc + " " + money(recv), "Outstanding receivable", "inv.out", "New Invoice", function () { renderInvoiceForm("new", "out_invoice"); }) +
      jcard("Vendor Bills", cc + " " + money(pay), "Outstanding payable", "inv.in", "New Bill", function () { renderInvoiceForm("new", "in_invoice"); }) +
      jcard("Bank", cc + " " + money(cash), "Cash & bank balance", "pay.in", "Register Payment", null) +
      '</div>';
    document.querySelectorAll("[data-jgo]").forEach(function (e) { e.onclick = function () { go(e.dataset.jgo); }; });
    var ni = document.getElementById("jc-new-inv"); if (ni) ni.onclick = function () { renderInvoiceForm("new", "out_invoice"); };
    var nb = document.getElementById("jc-new-bill"); if (nb) nb.onclick = function () { renderInvoiceForm("new", "in_invoice"); };
  }
  function kpi(l, n) { return '<div class="kpi"><div class="l">' + l + '</div><div class="n">' + n + '</div></div>'; }
  function jcard(name, big, sub, action, newLabel, newFn) {
    var nid = name === "Customer Invoices" ? "jc-new-inv" : name === "Vendor Bills" ? "jc-new-bill" : "";
    return '<div class="o-jc"><div class="hd"><span class="nm">' + esc(name) + '</span></div>' +
      '<div class="bd"><div class="row"><span>' + esc(sub) + '</span><b>' + big + '</b></div></div>' +
      (newFn ? '<span class="lk" ' + (nid ? 'id="' + nid + '"' : "") + '>' + esc(newLabel) + ' &rarr;</span>' : '<span class="lk" data-jgo="' + action + '">View &rarr;</span>') + '</div>';
  }

  // ============================ REPORTS ============================
  async function renderReport(kind) {
    var titles = { pl: "Profit and Loss", bs: "Balance Sheet", tb: "Trial Balance" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(titles[kind]) + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div>' +
      '<div class="o-form-bg"><div class="o-report" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var rows = (await sb.rpc("trial_balance", { p_company: S.company.id })).data || [];
    var cc = S.company.currency_code, rep = document.getElementById("rep");
    if (kind === "tb") {
      var td = 0, tc = 0;
      var body = rows.map(function (r) { td += Number(r.debit); tc += Number(r.credit); return '<tr><td class="cd">' + esc(r.code) + '</td><td>' + esc(r.name) + '</td><td class="num">' + (Number(r.debit) ? money(r.debit) : "") + '</td><td class="num">' + (Number(r.credit) ? money(r.credit) : "") + '</td></tr>'; }).join("");
      rep.innerHTML = '<h1>Trial Balance</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; as of ' + today() + '</div>' +
        '<table class="o-rt"><thead><tr><td class="cd">Code</td><td>Account</td><td class="num">Debit</td><td class="num">Credit</td></tr></thead><tbody>' + body +
        '<tr class="tot"><td></td><td>Total</td><td class="num">' + money(td) + '</td><td class="num">' + money(tc) + '</td></tr></tbody></table>';
    } else if (kind === "pl") {
      var inc = rows.filter(function (r) { return (r.type_code || "").indexOf("income") === 0; });
      var exp = rows.filter(function (r) { return (r.type_code || "").indexOf("expense") === 0; });
      var incT = 0, expT = 0;
      var incR = inc.map(function (r) { var v = Number(r.credit) - Number(r.debit); incT += v; return repLine(r.code, r.name, v); }).join("");
      var expR = exp.map(function (r) { var v = Number(r.debit) - Number(r.credit); expT += v; return repLine(r.code, r.name, v); }).join("");
      rep.innerHTML = '<h1>Profit and Loss</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + '</div>' +
        '<table class="o-rt"><tbody><tr class="sec"><td colspan="3">Income</td></tr>' + (incR || repEmpty()) + '<tr class="tot"><td></td><td>Total Income</td><td class="num">' + money(incT) + '</td></tr>' +
        '<tr class="sec"><td colspan="3">Expenses</td></tr>' + (expR || repEmpty()) + '<tr class="tot"><td></td><td>Total Expenses</td><td class="num">' + money(expT) + '</td></tr>' +
        '<tr class="tot"><td></td><td>Net Profit</td><td class="num">' + money(incT - expT) + '</td></tr></tbody></table>';
    } else {
      function grp(prefix, flip) { var g = rows.filter(function (r) { return (r.type_code || "").indexOf(prefix) === 0; }); var t = 0; var h = g.map(function (r) { var v = flip ? Number(r.credit) - Number(r.debit) : Number(r.balance); t += v; return repLine(r.code, r.name, v); }).join(""); return { h: h, t: t }; }
      var a = grp("asset", false), l = grp("liability", true), e = grp("equity", true);
      var result = 0; rows.forEach(function (r) { var tc = r.type_code || ""; if (tc.indexOf("income") === 0) result += Number(r.credit) - Number(r.debit); if (tc.indexOf("expense") === 0) result -= Number(r.debit) - Number(r.credit); });
      rep.innerHTML = '<h1>Balance Sheet</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; as of ' + today() + '</div>' +
        '<table class="o-rt"><tbody><tr class="sec"><td colspan="3">Assets</td></tr>' + (a.h || repEmpty()) + '<tr class="tot"><td></td><td>Total Assets</td><td class="num">' + money(a.t) + '</td></tr>' +
        '<tr class="sec"><td colspan="3">Liabilities</td></tr>' + (l.h || repEmpty()) + '<tr class="tot"><td></td><td>Total Liabilities</td><td class="num">' + money(l.t) + '</td></tr>' +
        '<tr class="sec"><td colspan="3">Equity</td></tr>' + (e.h || repEmpty()) + repLine("", "Current Year Earnings", result) + '<tr class="tot"><td></td><td>Total Equity</td><td class="num">' + money(e.t + result) + '</td></tr></tbody></table>';
    }
  }
  function repLine(code, name, v) { return '<tr><td class="cd">' + esc(code) + '</td><td>' + esc(name) + '</td><td class="num">' + money(v) + '</td></tr>'; }
  function repEmpty() { return '<tr><td></td><td class="muted">No entries.</td><td></td></tr>'; }

  // ============================ CONSOLIDATION ============================
  async function renderConsolidation() {
    var ref = (S.org && S.org.ref_currency) || S.company.currency_code || "USD";
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Consolidation") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report" id="rep"><div class="o-empty">Consolidating ' + S.companies.length + ' entities...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var rates = (await sb.from("currency_rates").select("code,rate,rate_date,rate_type").eq("org_id", S.org.id).order("rate_date", { ascending: false })).data || [];
    var rateMap = {}; rates.forEach(function (r) { if (rateMap[r.code] === undefined) rateMap[r.code] = Number(r.rate); }); rateMap[ref] = 1;
    var cons = {}, entities = [], missing = {};
    for (var i = 0; i < S.companies.length; i++) {
      var co = S.companies[i];
      var factor = co.currency_code === ref ? 1 : rateMap[co.currency_code];
      var known = factor !== undefined;
      if (!known) { missing[co.currency_code] = 1; factor = 1; }
      var tb = (await sb.rpc("trial_balance", { p_company: co.id })).data || [];
      var eInc = 0, eExp = 0, eAssets = 0;
      /* eslint-disable no-loop-func */
      (function (factor) {
        tb.forEach(function (r) {
          var g = (r.type_code || "").split("_")[0];
          var c = cons[r.code] || (cons[r.code] = { code: r.code, name: r.name, type_code: r.type_code, debit: 0, credit: 0, balance: 0 });
          c.debit += Number(r.debit) * factor; c.credit += Number(r.credit) * factor; c.balance += Number(r.balance) * factor;
          if (g === "income") eInc += (Number(r.credit) - Number(r.debit)) * factor;
          if (g === "expense") eExp += (Number(r.debit) - Number(r.credit)) * factor;
          if (g === "asset") eAssets += Number(r.balance) * factor;
        });
      })(factor);
      entities.push({ name: co.name, cur: co.currency_code, factor: factor, known: known, assets: eAssets, result: eInc - eExp });
    }
    var rows = Object.keys(cons).map(function (k) { return cons[k]; }).sort(function (a, b) { return (a.code || "") < (b.code || "") ? -1 : 1; });
    var missKeys = Object.keys(missing);
    var banner = missKeys.length ? '<div style="background:var(--warn-s);color:var(--warn);padding:10px 14px;border-radius:9px;margin-bottom:14px;font-size:13px">No exchange rate set for <b>' + esc(missKeys.join(", ")) + '</b> - those entities are shown 1:1 until you add a rate. <a id="cons-rates" style="cursor:pointer;font-weight:700;text-decoration:underline">Add a rate</a></div>' : '';
    var entRows = entities.map(function (e) {
      return '<tr><td>' + esc(e.name) + '</td><td class="muted">' + esc(e.cur) + '</td><td class="num">' + (e.cur === ref ? "1.000000" : (e.known ? Number(e.factor).toLocaleString("en-US", { maximumFractionDigits: 6 }) : '<span style="color:var(--warn)">n/a</span>')) + '</td><td class="num">' + money(e.assets) + '</td><td class="num">' + money(e.result) + '</td></tr>';
    }).join("");
    function grp(prefix, flip) { var t = 0, html = ""; rows.forEach(function (r) { if ((r.type_code || "").indexOf(prefix) !== 0) return; var v = flip ? Number(r.credit) - Number(r.debit) : Number(r.balance); t += v; html += repLine(r.code, r.name, v); }); return { t: t, html: html }; }
    var inc = grp("income", true);
    var expT = 0, expHtml = ""; rows.forEach(function (r) { if ((r.type_code || "").indexOf("expense") !== 0) return; var v = Number(r.debit) - Number(r.credit); expT += v; expHtml += repLine(r.code, r.name, v); });
    var a = grp("asset", false), l = grp("liability", true), eq = grp("equity", true);
    var result = inc.t - expT;
    document.getElementById("rep").innerHTML =
      '<h1>Consolidated Financials</h1><div class="sub">' + esc(S.org ? S.org.name : "") + ' &middot; ' + S.companies.length + ' entities &middot; presented in ' + esc(ref) + ' &middot; as of ' + today() + '</div>' + banner +
      '<table class="o-rt"><tbody><tr class="sec"><td colspan="5">Entities</td></tr>' +
      '<tr style="font-size:11px;color:var(--ink3)"><td>Entity</td><td>Currency</td><td class="num">Rate &rarr; ' + esc(ref) + '</td><td class="num">Assets</td><td class="num">Result</td></tr>' +
      entRows + '</tbody></table>' +
      '<table class="o-rt" style="margin-top:20px"><tbody><tr class="sec"><td colspan="3">Consolidated Profit &amp; Loss</td></tr>' +
      (inc.html || repEmpty()) + '<tr class="tot"><td></td><td>Total Income</td><td class="num">' + money(inc.t) + '</td></tr>' +
      (expHtml || repEmpty()) + '<tr class="tot"><td></td><td>Total Expenses</td><td class="num">' + money(expT) + '</td></tr>' +
      '<tr class="tot"><td></td><td>Consolidated Net Profit</td><td class="num">' + money(result) + '</td></tr></tbody></table>' +
      '<table class="o-rt" style="margin-top:20px"><tbody><tr class="sec"><td colspan="3">Consolidated Balance Sheet</td></tr>' +
      (a.html || repEmpty()) + '<tr class="tot"><td></td><td>Total Assets</td><td class="num">' + money(a.t) + '</td></tr>' +
      (l.html || repEmpty()) + '<tr class="tot"><td></td><td>Total Liabilities</td><td class="num">' + money(l.t) + '</td></tr>' +
      (eq.html || repEmpty()) + repLine("", "Current Year Earnings", result) + '<tr class="tot"><td></td><td>Total Equity</td><td class="num">' + money(eq.t + result) + '</td></tr></tbody></table>';
    var cr = document.getElementById("cons-rates"); if (cr) cr.onclick = function () { go("rates"); };
  }

  // ============================ BANK STATEMENTS + RECONCILIATION ============================
  function cfgBankStatements() {
    return {
      title: "Bank Statements", pageSize: 80,
      fetch: function () { return sb.from("bank_statements").select("*, journals(name)").eq("company_id", S.company.id).order("statement_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.name || "") + " " + (s.journals ? s.journals.name : ""); },
      columns: [
        { label: "Name", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } },
        { label: "Journal", get: function (s) { return esc(s.journals ? s.journals.name : ""); } },
        { label: "Date", get: function (s) { return '<span class="muted">' + esc(s.statement_date || "") + '</span>'; } },
        { label: "Start Balance", num: true, get: function (s) { return money(s.balance_start); } },
        { label: "End Balance", num: true, get: function (s) { return money(s.balance_end); } }
      ],
      groupBy: [{ label: "Journal", get: function (s) { return s.journals ? s.journals.name : "None"; } }],
      onOpen: function (s) { renderBankStatementForm(s.id); },
      onNew: function () { renderBankStatementForm("new"); }
    };
  }
  async function renderBankStatementForm(id) {
    var parent = { action: "bank", title: "Bank Statements" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var stmt = null, lines = [];
    if (id !== "new") {
      stmt = (await sb.from("bank_statements").select("*, journals(code,name)").eq("id", id).maybeSingle()).data;
      lines = (await sb.from("bank_statement_lines").select("*, accounts(code,name), partners(name)").eq("statement_id", id).order("line_date")).data || [];
    }
    var journals = (await sb.from("journals").select("id,code,name").eq("company_id", S.company.id).order("code")).data || [];
    var bankJ = journals.filter(function (j) { return j.code === "BNK" || j.code === "CSH" || /bank|cash/i.test(j.name); }); if (!bankJ.length) bankJ = journals;
    var accounts = (await sb.from("accounts").select("id,code,name").eq("company_id", S.company.id).eq("is_active", true).order("code")).data || [];
    var isNew = id === "new";
    document.querySelector(".o-bc span:last-child").textContent = stmt ? stmt.name : "New";
    var jrnCode = stmt && stmt.journals ? stmt.journals.code : "BNK";
    var accOpts = accounts.map(function (a) { return '<option value="' + a.id + '">' + esc(a.code + " " + a.name) + '</option>'; }).join("");

    var btns = isNew ? '<button class="pri" id="b-save">Save</button><button id="b-discard">Discard</button>' : '<button id="b-back">Back</button>';
    var jOpts = bankJ.map(function (j) { return '<option value="' + j.id + '" data-code="' + esc(j.code) + '"' + ((stmt && stmt.journal_id === j.id) ? " selected" : "") + '>' + esc(j.name) + '</option>'; }).join("");
    var groups = '<div class="o-groups"><div>' +
      fld("Name", isNew ? '<input id="b-name" placeholder="e.g. Bank - August 2026">' : '<span class="v">' + esc(stmt.name) + '</span>') +
      fld("Journal", isNew ? '<select id="b-jrn">' + jOpts + '</select>' : '<span class="v">' + esc(stmt.journals ? stmt.journals.name : "") + '</span>') +
      '</div><div>' +
      fld("Statement Date", isNew ? '<input id="b-date" type="date" value="' + today() + '">' : '<span class="v">' + esc(stmt.statement_date || "") + '</span>') +
      fld("End Balance", isNew ? '<input id="b-end" type="number" step="0.01" value="0">' : '<span class="v">' + S.company.currency_code + " " + money(stmt.balance_end) + '</span>') +
      '</div></div>';

    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title">' + esc(stmt ? stmt.name : "New Bank Statement") + '</div>' + groups +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Statement Lines</div></div><div class="o-nb-pg" id="nbpg"></div></div></div>';
    var pg = document.getElementById("nbpg");

    if (isNew) {
      pg.innerHTML = '<table class="o-lines"><thead><tr><th style="width:120px">Date</th><th>Label</th><th style="width:120px;text-align:right">Amount (+in / -out)</th><th style="width:24px"></th></tr></thead><tbody id="lnbody"></tbody></table><button class="o-addln" id="addln">+ Add a line</button>';
      var lb = document.getElementById("lnbody");
      function addRow() {
        var tr = document.createElement("tr");
        tr.innerHTML = '<td><input class="l-date" type="date" value="' + today() + '"></td><td><input class="l-label" placeholder="e.g. Customer receipt / Bank fee"></td><td><input class="l-amt num" type="number" step="0.01" value="0"></td><td><button class="del">&times;</button></td>';
        lb.appendChild(tr); tr.querySelector(".del").onclick = function () { tr.remove(); };
      }
      document.getElementById("addln").onclick = addRow; addRow();
      document.getElementById("b-discard").onclick = function () { go("bank"); };
      document.getElementById("b-save").onclick = async function () {
        var name = (document.getElementById("b-name").value || "").trim(); if (!name) { toast("Name the statement"); return; }
        var jsel = document.getElementById("b-jrn");
        var hdr = { company_id: S.company.id, name: name, journal_id: jsel.value || null, statement_date: document.getElementById("b-date").value, balance_end: parseFloat(document.getElementById("b-end").value) || 0 };
        var ins = await sb.from("bank_statements").insert(hdr).select("id").single();
        if (ins.error) { toast("Could not save: " + ins.error.message); return; }
        var sid = ins.data.id;
        var rows = Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) { return { statement_id: sid, company_id: S.company.id, line_date: tr.querySelector(".l-date").value, label: tr.querySelector(".l-label").value.trim(), amount: parseFloat(tr.querySelector(".l-amt").value) || 0 }; }).filter(function (r) { return r.amount || r.label; });
        if (rows.length) { var lr = await sb.from("bank_statement_lines").insert(rows); if (lr.error) { toast("Lines failed: " + lr.error.message); return; } }
        toast("Statement saved"); renderBankStatementForm(sid);
      };
    } else {
      document.getElementById("b-back").onclick = function () { go("bank"); };
      var recN = lines.filter(function (l) { return l.is_reconciled; }).length;
      var body = lines.map(function (l) {
        var recCell = l.is_reconciled
          ? '<span class="badge paid">Reconciled</span> <span class="muted">' + esc(l.accounts ? l.accounts.code : "") + '</span>'
          : '<select class="rec-acct" data-id="' + l.id + '"><option value="">Counterpart account...</option>' + accOpts + '</select> <button class="btn sm rec-btn" data-id="' + l.id + '">Reconcile</button>';
        return '<tr><td class="muted">' + esc(l.line_date || "") + '</td><td>' + esc(l.label || "") + '</td><td class="num">' + (Number(l.amount) < 0 ? '<span style="color:var(--bad)">' : '<span style="color:var(--good)">') + money(l.amount) + '</span></td><td>' + recCell + '</td></tr>';
      }).join("");
      pg.innerHTML = '<div class="muted" style="margin-bottom:8px;font-size:12.5px">' + recN + ' of ' + lines.length + ' lines reconciled</div>' +
        '<table class="o-lines"><thead><tr><th style="width:110px">Date</th><th>Label</th><th style="width:110px;text-align:right">Amount</th><th style="width:320px">Reconcile with</th></tr></thead><tbody>' + (body || '<tr><td colspan="4" class="muted" style="padding:14px">No lines.</td></tr>') + '</tbody></table>' +
        '<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><div class="muted" style="font-size:12.5px;margin-bottom:6px">Add a line</div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="al-date" type="date" value="' + today() + '" style="padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--ink)"><input id="al-label" placeholder="Label" style="flex:1;min-width:140px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--ink)"><input id="al-amt" type="number" step="0.01" placeholder="Amount" style="width:120px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--ink)"><button class="btn" id="al-add">Add line</button></div></div>';
      Array.prototype.forEach.call(document.querySelectorAll(".rec-btn"), function (b) {
        b.onclick = async function () {
          var sel = document.querySelector('.rec-acct[data-id="' + b.dataset.id + '"]');
          if (!sel.value) { toast("Pick a counterpart account"); return; }
          b.disabled = true; b.textContent = "Posting...";
          var r = await sb.rpc("reconcile_bank_line", { p_line: b.dataset.id, p_account: sel.value, p_journal_code: jrnCode });
          if (r.error) { toast("Could not reconcile: " + r.error.message); b.disabled = false; b.textContent = "Reconcile"; return; }
          toast("Reconciled to the ledger"); renderBankStatementForm(id);
        };
      });
      document.getElementById("al-add").onclick = async function () {
        var amt = parseFloat(document.getElementById("al-amt").value) || 0, label = document.getElementById("al-label").value.trim();
        if (!amt && !label) { toast("Enter a line"); return; }
        var r = await sb.from("bank_statement_lines").insert({ statement_id: id, company_id: S.company.id, line_date: document.getElementById("al-date").value, label: label, amount: amt });
        if (r.error) { toast("Could not add: " + r.error.message); return; }
        toast("Line added"); renderBankStatementForm(id);
      };
    }
  }

  // ---- start ----
  sb.auth.onAuthStateChange(function (_e, session) { if (!session) renderLogin("in"); });
  boot();
})();

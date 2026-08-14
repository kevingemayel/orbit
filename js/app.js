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
  var S = { user: null, profile: null, org: null, companies: [], company: null, app: null, action: null, types: [], ui: loadUI() };
  var L = null; // current list state
  var FIXED_APP_THEMES = ["spacework", "corporate", "blue", "pink"];
  function loadUI() { try { var u = JSON.parse(localStorage.getItem("orbit_ui")); if (u && u.theme) return { theme: u.theme, font: u.font || "inter", size: u.size || "normal" }; } catch (e) { } return { theme: "spacework", font: "inter", size: "normal" }; }
  function saveUI() { try { localStorage.setItem("orbit_ui", JSON.stringify(S.ui)); } catch (e) { } }
  function fontStack(f) { return ({ system: '"Segoe UI",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif', inter: '"Inter",system-ui,sans-serif', rounded: '"Nunito","Segoe UI",system-ui,sans-serif', serif: '"Lora",Georgia,"Times New Roman",serif', mono: '"SF Mono","Cascadia Code","Consolas",ui-monospace,monospace' })[f] || "inherit"; }
  function applyTheme() {
    var de = document.documentElement;
    if (S.ui.theme && S.ui.theme !== "system") de.setAttribute("data-theme", S.ui.theme); else de.removeAttribute("data-theme");
    de.style.setProperty("--ui", fontStack(S.ui.font));
    applyAppColor(); applyFontScale();
  }
  function applyAppColor() {
    var s = document.documentElement.style;
    if (FIXED_APP_THEMES.indexOf(S.ui.theme) >= 0) { s.removeProperty("--app"); s.removeProperty("--app2"); }
    else if (S.app && APPS[S.app]) { s.setProperty("--app", APPS[S.app].color); s.setProperty("--app2", APPS[S.app].color2); }
    else { s.removeProperty("--app"); s.removeProperty("--app2"); }
  }
  function applyFontScale() {
    var z = ({ small: 0.92, normal: 1, large: 1.1 })[S.ui.size] || 1;
    var m = document.getElementById("o-main"); if (m) m.style.zoom = z;
    var h = document.querySelector(".o-home"); if (h) h.style.zoom = z;
  }

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
        { label: "Reporting", items: [["Profit and Loss", "rep.pl"], ["Balance Sheet", "rep.bs"], ["General Ledger", "rep.gl"], ["Trial Balance", "rep.tb"], ["Partner Ledger", "rep.partner"], ["Aged Receivable", "rep.aged.recv"], ["Aged Payable", "rep.aged.pay"], ["VAT / Tax Report", "rep.tax"], ["Partner Statement", "rep.stmt"], ["Consolidation", "rep.cons"]] },
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
    crm: {
      name: "CRM", icon: "◎", color: "#e11d48", color2: "#be123c", home: "crm.pipe",
      menus: [
        { label: "Pipeline", action: "crm.pipe" },
        { label: "Leads", action: "crm.leads" },
        { label: "Configuration", items: [["Stages", "crm.stages"]] }
      ]
    },
    inventory: {
      name: "Inventory", icon: "▦", color: "#16a34a", color2: "#15803d", home: "inv.onhand",
      menus: [
        { label: "Overview", action: "inv.onhand" },
        { label: "Operations", items: [["Stock Moves", "inv.moves"], ["Replenishment", "inv.reorder"]] },
        { label: "Products", items: [["Products", "products"], ["Lots / Serials", "lots"]] },
        { label: "Configuration", items: [["Warehouses", "wh"], ["Locations", "loc"]] }
      ]
    },
    project: {
      name: "Projects", icon: "◈", color: "#db2777", color2: "#be185d", home: "proj.list",
      menus: [
        { label: "Projects", action: "proj.list" },
        { label: "Tasks", action: "task.list" },
        { label: "Timesheets", action: "ts.list" }
      ]
    },
    hr: {
      name: "Employees", icon: "☺", color: "#4f46e5", color2: "#4338ca", home: "hr.emp",
      menus: [
        { label: "Employees", items: [["Employees", "hr.emp"], ["Departments", "hr.dept"], ["Job Positions", "hr.jobs"], ["Contracts", "hr.contracts"]] },
        { label: "Attendances", items: [["Attendances", "hr.att"], ["Roster", "hr.roster"], ["Shifts", "hr.shifts"]] },
        { label: "Time Off", items: [["Requests", "hr.leaves"], ["Allocations", "hr.alloc"]] },
        { label: "Payroll", items: [["Payslip Runs", "hr.runs"], ["Payslips", "hr.slips"], ["Salary Structures", "hr.struct"], ["Salary Heads", "hr.heads"]] },
        { label: "Expenses", action: "hr.exp" }
      ]
    },
    settings: {
      name: "Settings", icon: "⚙", color: "#475569", color2: "#334155", home: "companies",
      menus: [
        { label: "Companies", action: "companies" },
        { label: "Appearance", action: "appearance" },
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
    "rep.gl": "accounting", "rep.partner": "accounting", "rep.aged.recv": "accounting", "rep.aged.pay": "accounting", "rep.tax": "accounting", "rep.stmt": "accounting",
    companies: "settings", taxes: "settings", products: "sales", "so.list": "sales", "po.list": "purchase",
    "inv.outr": "accounting", "inv.inr": "accounting", rates: "settings", "rep.cons": "accounting", bank: "accounting", appearance: "settings",
    "inv.onhand": "inventory", "inv.moves": "inventory", wh: "inventory", "inv.reorder": "inventory", loc: "inventory", lots: "inventory",
    "proj.list": "project", "task.list": "project", "ts.list": "project",
    "crm.pipe": "crm", "crm.leads": "crm", "crm.stages": "crm",
    "hr.emp": "hr", "hr.dept": "hr", "hr.jobs": "hr", "hr.leaves": "hr", "hr.att": "hr", "hr.exp": "hr",
    "hr.contracts": "hr", "hr.roster": "hr", "hr.shifts": "hr", "hr.alloc": "hr", "hr.runs": "hr", "hr.slips": "hr", "hr.struct": "hr", "hr.heads": "hr"
  };
  var SOON = [["Manufacturing", "⚒", "#0d9488"], ["Website", "◐", "#2563eb"], ["Point of Sale", "▤", "#7c3aed"]];

  // ============================ AUTH ============================
  function renderLogin(mode) {
    mode = mode || "in";
    root.innerHTML =
      '<div class="login"><div class="card">' +
      '<div class="brandrow"><div class="logo">O</div><div class="wm">Space Work<span>Orbit</span></div></div>' +
      '<h1>' + (mode === "in" ? "Sign in to Orbit" : "Create your account") + "</h1>" +
      '<p class="sub">Business management for the built environment</p>' +
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
    applyFontScale();
  }

  function openApp(key) {
    S.app = key;
    applyAppColor();
    go(APPS[key].home);
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
    applyAppColor(); applyFontScale();
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
    if (!S.app) { S.app = ACTION_APP[action] || "accounting"; applyAppColor(); }
    if (!document.getElementById("o-main")) renderShell();
    else { /* keep shell, but ensure menu highlights current app */ }
    routeAction(action);
  }
  // Re-render the current view (used by modals to refresh the list after a save).
  function renderView() { if (S.action) routeAction(S.action); }
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
      case "rep.gl": return renderGeneralLedger();
      case "rep.partner": return renderPartnerLedger();
      case "rep.aged.recv": return renderAged("recv");
      case "rep.aged.pay": return renderAged("pay");
      case "rep.tax": return renderTaxReport();
      case "rep.stmt": return renderStatement(null);
      case "rep.cons": return renderConsolidation();
      case "rates": return renderList(cfgRates());
      case "bank": return renderList(cfgBankStatements());
      case "appearance": return renderAppearance();
      case "inv.onhand": return renderOnHand();
      case "inv.moves": return renderList(cfgStockMoves());
      case "wh": return renderList(cfgWarehouses());
      case "inv.reorder": return renderReorder();
      case "loc": return renderList(cfgLocations());
      case "lots": return renderLots();
      case "proj.list": return renderList(cfgProjects());
      case "task.list": return renderList(cfgTasks());
      case "ts.list": return renderList(cfgTimesheets());
      case "crm.pipe": return renderPipeline();
      case "crm.leads": return renderList(cfgLeads());
      case "crm.stages": return renderList(cfgCrmStages());
      case "hr.emp": return renderList(cfgEmployees());
      case "hr.dept": return renderList(cfgDepartments());
      case "hr.jobs": return renderList(cfgJobs());
      case "hr.leaves": return renderList(cfgLeaves());
      case "hr.att": return renderList(cfgAttendances());
      case "hr.exp": return renderList(cfgExpenses());
      case "hr.contracts": return renderList(cfgContracts());
      case "hr.roster": return renderList(cfgRoster());
      case "hr.shifts": return renderList(cfgShifts());
      case "hr.alloc": return renderList(cfgLeaveAllocations());
      case "hr.runs": return renderList(cfgPayslipRuns());
      case "hr.slips": return renderList(cfgPayslips());
      case "hr.struct": return renderList(cfgSalaryStructures());
      case "hr.heads": return renderList(cfgSalaryHeads());
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
      '<button class="o-filtbtn" id="o-export" title="Download the current list as a CSV file (opens in Excel)">Export</button>' +
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
    document.getElementById("o-export").onclick = exportListCsv;
    cfg.fetch().then(function (rows) { L.all = rows || []; paintBody(); });
  }
  function htmlToText(h) { var d = document.createElement("div"); d.innerHTML = (h == null ? "" : String(h)); return (d.textContent || "").replace(/\s+/g, " ").trim(); }
  function csvCell(s) { s = (s == null ? "" : String(s)); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function exportListCsv() {
    var cfg = L.cfg, rows = applyRows(), cols = cfg.columns;
    var out = [cols.map(function (c) { return csvCell(c.label); }).join(",")];
    rows.forEach(function (r) { out.push(cols.map(function (c) { return csvCell(htmlToText(c.get(r))); }).join(",")); });
    var csv = "﻿" + out.join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = (cfg.title || "export").replace(/[^\w]+/g, "_").toLowerCase() + "_" + today() + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast(rows.length + " row" + (rows.length === 1 ? "" : "s") + " exported to CSV");
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
      filters: [{ label: "Posted", test: function (m) { return m.state === "posted"; } }, { label: "Draft", test: function (m) { return m.state !== "posted"; } }],
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
      '<div><label>Currency code</label>' + fhint("Currency code", "The 3-letter code of the currency you are quoting, e.g. EUR or LBP.") + '<input id="r-code" placeholder="e.g. EUR" style="text-transform:uppercase"></div>' +
      '<div class="row2"><div><label>Date</label>' + fhint("Date", "The date this rate applies from. The latest rate on or before a date is used.") + '<input id="r-date" type="date" value="' + today() + '"></div><div><label>Type</label>' + fhint("Type", "Spot for day-to-day, Closing for balance sheet, Average for P&L.") + '<select id="r-type"><option value="spot">Spot</option><option value="closing">Closing</option><option value="average">Average</option></select></div></div>' +
      '<div><label>Rate &mdash; value of 1 unit in ' + esc(ref) + '</label>' + fhint("__rate", "How many " + ref + " one unit of this currency is worth. E.g. 1 EUR = 1.09 " + ref + ".") + '<input id="r-rate" type="number" step="0.0000001" placeholder="e.g. 1.09"></div>' +
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
    if (inv && isSale) document.getElementById("f-email").onclick = function () { openSendModal(inv, linesState); };
  }
  function openSendModal(inv, lines) {
    var isRefund = (inv.move_type || "").indexOf("refund") >= 0;
    var isSale = (inv.move_type || "").indexOf("out_") === 0;
    var docName = isSale ? (isRefund ? "Credit Note" : "Invoice") : (isRefund ? "Vendor Credit Note" : "Bill");
    var to = inv.partners && inv.partners.email ? inv.partners.email : "";
    var defSubject = docName + " " + (inv.number || "") + " from " + S.company.name;
    var m = document.createElement("div"); m.className = "modal on"; m.id = "sendmodal";
    m.innerHTML = '<div class="sheet wide"><h3>Email ' + esc(inv.number || "") + '</h3><div class="form" style="padding:16px 18px;display:grid;gap:12px;max-height:76vh;overflow:auto">' +
      '<div class="row2"><div><label>To</label>' + fhint("To", "Where the email is sent. Defaults to the customer's email; you can change it.") + '<input id="s-to" type="email" value="' + esc(to) + '" placeholder="customer@email.com"></div>' +
      '<div><label>Subject</label>' + fhint("Subject") + '<input id="s-subj" value="' + esc(defSubject) + '"></div></div>' +
      '<div><label>Message to the customer (optional)</label>' + fhint("__note", "A short cover note shown at the top of the email, above the invoice.") + '<textarea id="s-note" rows="3" placeholder="e.g. Hi, please find your invoice attached below. Payment is due within 30 days. Thank you!"></textarea></div>' +
      '<div><label>Preview &mdash; this is exactly what your customer receives</label><iframe id="s-preview" style="width:100%;height:360px;border:1px solid var(--line);border-radius:8px;background:#fff"></iframe></div>' +
      '</div><div class="foot"><button class="btn" id="s-cancel">Cancel</button><button class="btn pri" id="s-send" style="background:var(--app);border-color:var(--app)">Send email</button></div></div>';
    document.body.appendChild(m);
    function renderPreview() { document.getElementById("s-preview").srcdoc = emailPreviewHtml(inv, lines || [], document.getElementById("s-note").value); }
    document.getElementById("s-note").addEventListener("input", renderPreview);
    renderPreview();
    document.getElementById("s-cancel").onclick = function () { m.remove(); };
    document.getElementById("s-send").onclick = async function () {
      var to2 = document.getElementById("s-to").value.trim();
      var subj = document.getElementById("s-subj").value.trim();
      var note = document.getElementById("s-note").value;
      var btn = document.getElementById("s-send"); btn.disabled = true; btn.textContent = "Sending...";
      var sess = (await sb.auth.getSession()).data.session;
      if (!sess) { toast("Sign in again"); btn.disabled = false; btn.textContent = "Send email"; return; }
      try {
        var res = await fetch("/api/send-invoice", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + sess.access_token }, body: JSON.stringify({ invoice_id: inv.id, to: to2, subject: subj, note: note }) });
        var j = await res.json().catch(function () { return { error: "Server error (HTTP " + res.status + ")" }; });
        if (j.error || !j.ok) { toast(j.error || "Send failed"); btn.disabled = false; btn.textContent = "Send email"; return; }
        m.remove(); toast("Sent to " + j.to);
      } catch (e) { toast("Send failed: " + (e && e.message)); btn.disabled = false; btn.textContent = "Send email"; }
    };
  }
  function emailPreviewHtml(inv, lines, note) {
    var co = S.company, cc = inv.currency_code || co.currency_code || "USD";
    var isRefund = (inv.move_type || "").indexOf("refund") >= 0, isSale = (inv.move_type || "").indexOf("out_") === 0;
    var docName = isSale ? (isRefund ? "Credit Note" : "Invoice") : (isRefund ? "Vendor Credit Note" : "Bill");
    var sub = 0;
    var rows = (lines || []).map(function (l) { var ls = Number(l.quantity) * Number(l.unit_price); sub += ls; return '<tr><td style="padding:8px;border-bottom:1px solid #eee">' + esc(l.name) + '</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">' + Number(l.quantity) + '</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">' + money(l.unit_price) + '</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">' + money(ls) + '</td></tr>'; }).join("");
    var total = Number(inv.amount_total != null ? inv.amount_total : sub), due = Number(inv.amount_residual != null ? inv.amount_residual : total);
    var partner = inv.partners ? inv.partners.name : "";
    var noteBlock = (note && note.trim()) ? '<div style="margin:18px 0;padding:13px 15px;background:#f4f6f9;border-left:3px solid #152030;border-radius:6px;font-size:13.5px;white-space:pre-wrap;color:#333">' + esc(note) + '</div>' : '';
    return '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:16px;background:#fff;font-family:Segoe UI,Arial,sans-serif;color:#152030">' +
      '<div style="max-width:640px;margin:0 auto">' +
      '<div style="display:flex;justify-content:space-between;border-bottom:2px solid #152030;padding-bottom:14px">' +
      '<div><div style="font-size:20px;font-weight:800">' + esc(co.name || "Space Work") + '</div><div style="color:#666;font-size:12px">' + esc(co.legal_name || "") + (co.country ? "<br>" + esc(co.country) : "") + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:22px;font-weight:800;text-transform:uppercase;color:#333">' + esc(docName) + '</div><div style="color:#666">' + esc(inv.number || "") + '</div></div></div>' + noteBlock +
      '<div style="display:flex;justify-content:space-between;margin:18px 0;font-size:13px">' +
      '<div><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700">Bill to</div><div style="font-weight:600">' + esc(partner) + '</div></div>' +
      '<div style="text-align:right"><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700">Date</div><div>' + esc(inv.invoice_date || "") + '</div><div style="text-transform:uppercase;font-size:10px;color:#888;font-weight:700;margin-top:6px">Due</div><div>' + esc(inv.due_date || "-") + '</div></div></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Description</th><th style="text-align:right;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Qty</th><th style="text-align:right;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Unit Price</th><th style="text-align:right;padding:8px;border-bottom:1px solid #999;font-size:11px;text-transform:uppercase;color:#666">Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div style="margin-left:auto;width:260px;margin-top:14px;font-size:13px"><div style="display:flex;justify-content:space-between;padding:4px 0"><span>Total</span><span style="font-weight:800">' + cc + ' ' + money(total) + '</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #ddd"><span>Amount Due</span><span>' + cc + ' ' + money(due) + '</span></div></div>' +
      '<div style="margin-top:28px;border-top:1px solid #ddd;padding-top:10px;color:#888;font-size:11px;text-align:center">' + esc(co.name || "Space Work") + ' &middot; sent via Orbit</div>' +
      '</div></body></html>';
  }
  var FIELD_DESC = {
    "Customer": "The client this document is billed to. Pick from your customers.",
    "Vendor": "The supplier this document comes from. Pick from your vendors.",
    "Reference": "Optional: your internal note or the other party's document/PO number.",
    "Reference / Note": "Optional note shown on the order, e.g. a PO number or terms.",
    "Invoice Date": "Date the invoice is issued. Drives the accounting period it lands in.",
    "Bill Date": "Date shown on the vendor's bill.",
    "Order Date": "Date the order is placed.",
    "Due Date": "When payment is expected. Used for aging and reminders.",
    "Journal": "The accounting journal this posts to (set automatically).",
    "Currency": "Currency of this document. Defaults to your company currency.",
    "Narration": "Free-text notes stored on the underlying journal entry.",
    "Source": "Where this entry originated (e.g. an invoice or a stock move).",
    "Email": "Address used to email invoices and documents to this contact.",
    "Phone": "Contact phone number.",
    "Tax / VAT no.": "The party's tax / VAT registration number, for compliant invoices.",
    "Street": "Street address line.",
    "City": "City or town.",
    "Country": "Country.",
    "Type": "The kind of record. Changes how it behaves in the app.",
    "Sales Price": "Default unit price used when you sell this product.",
    "Cost": "Unit cost. Used for margins and for stock valuation.",
    "Status": "Active records are usable; archived ones are hidden from lists.",
    "Income Account": "Revenue account credited when this product is sold. Blank uses the default (7000).",
    "Expense Account": "Expense account debited when this product is bought. Blank uses the default (6000).",
    "Sales Tax": "Tax applied by default when selling this product.",
    "Purchase Tax": "Tax applied by default when buying this product.",
    "Code": "Short unique code, e.g. the account number.",
    "Name": "A clear label to identify this record.",
    "Product": "The item this movement applies to.",
    "Quantity": "Number of units.",
    "To": "The recipient's email address.",
    "Subject": "The email subject line your customer will see.",
    "Statement Date": "The closing date of this bank statement period.",
    "End Balance": "The closing balance printed on the statement. Reconciliation aims to match this."
  };
  function fld(label, valueHtml, desc) {
    desc = desc || FIELD_DESC[label] || "";
    return '<div class="o-fld"><div class="lbl"><label>' + esc(label) + '</label>' + (desc ? '<span class="d">' + esc(desc) + '</span>' : "") + '</div><div class="v">' + valueHtml + '</div></div>';
  }
  function fhint(label, override) { var d = override || FIELD_DESC[label] || ""; return d ? '<div class="fd">' + esc(d) + '</div>' : ""; }
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
  function printPayslip(slip, lines, empName) {
    var co = S.company, cc = slip.currency_code || co.currency_code;
    var earn = lines.filter(function (l) { return l.category === "earning" || l.category === "benefit"; });
    var ded = lines.filter(function (l) { return l.category === "deduction"; });
    var emp = lines.filter(function (l) { return l.category === "employer_cost"; });
    var empTot = emp.reduce(function (s, l) { return s + Number(l.amount || 0); }, 0);
    function rows(arr) { return arr.length ? arr.map(function (l) { return '<tr><td>' + esc(l.name) + '</td><td class="r">' + money(l.amount) + '</td></tr>'; }).join("") : '<tr><td>-</td><td class="r"></td></tr>'; }
    var html = '<div class="pinv">' +
      '<div class="phead"><div class="pfrom"><div class="pname">' + esc(co.name) + '</div><div class="pmuted">' + esc(co.legal_name || "") + (co.country ? "<br>" + esc(co.country) : "") + '</div></div>' +
      '<div class="pdoc"><div class="pdt">Payslip</div><div class="pnum">' + esc((slip.date_from || "") + " to " + (slip.date_to || "")) + '</div></div></div>' +
      '<div class="pmeta"><div><div class="pl">Employee</div><div class="pv">' + esc(empName || "") + '</div></div>' +
      '<div><div class="pl">Worked days</div><div class="pv">' + Number(slip.worked_days || 0) + '</div><div class="pl" style="margin-top:8px">Overtime hours</div><div class="pv">' + Number(slip.ot_hours || 0) + '</div></div></div>' +
      '<table class="ptab"><thead><tr><th>Earnings</th><th class="r">Amount</th></tr></thead><tbody>' + rows(earn) + '</tbody></table>' +
      '<table class="ptab"><thead><tr><th>Deductions</th><th class="r">Amount</th></tr></thead><tbody>' + rows(ded) + '</tbody></table>' +
      (emp.length ? '<table class="ptab"><thead><tr><th>Employer costs</th><th class="r">Amount</th></tr></thead><tbody>' + rows(emp) + '</tbody></table>' : "") +
      '<div class="psum"><div class="pr"><span>Gross</span><span>' + cc + " " + money(slip.gross) + '</span></div>' +
      '<div class="pr"><span>Total deductions</span><span>' + cc + " " + money(slip.total_deductions) + '</span></div>' +
      '<div class="pr ptt"><span>Net pay</span><span>' + cc + " " + money(slip.net) + '</span></div>' +
      (empTot ? '<div class="pr"><span>Cost to company</span><span>' + cc + " " + money((Number(slip.gross) || 0) + empTot) + '</span></div>' : "") + '</div>' +
      '<div class="pfoot">' + esc(co.name) + ' &middot; Generated by Orbit</div></div>';
    var wrap = document.createElement("div"); wrap.className = "o-print"; wrap.innerHTML = html;
    document.body.appendChild(wrap); document.body.classList.add("printing"); window.print();
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
    var invCount = 0, firstInvId = null;
    if (order) { var _ic = (await sb.from("invoices").select("id").eq(isSale ? "sale_order_id" : "purchase_order_id", order.id)).data || []; invCount = _ic.length; firstInvId = _ic[0] ? _ic[0].id : null; }
    var smart = (order && invCount) ? '<div class="o-smart"><button class="sb" id="o-sm-inv"><span class="v">' + invCount + '</span><span class="k">' + (isSale ? "Invoices" : "Bills") + '</span></button></div>' : "";

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
      '<div class="o-sheet">' + smart + '<div class="o-title">' + esc(title) + '</div>' + groups +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Order Lines</div></div><div class="o-nb-pg" id="nbpg"></div></div></div>';
    if (order && invCount) { var _smb = document.getElementById("o-sm-inv"); if (_smb) _smb.onclick = function () { renderInvoiceForm(firstInvId, isSale ? "out_invoice" : "in_invoice"); }; }

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
    var smart = id !== "new" ? '<div class="o-smart"><button class="sb" id="sm-inv"><span class="v">' + invCount + '</span><span class="k">' + (isCust ? "Invoices" : "Bills") + '</span></button><button class="sb" id="sm-stmt"><span class="v">&#9776;</span><span class="k">Statement</span></button></div>' : "";
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
    if (id !== "new") {
      document.getElementById("sm-inv").onclick = function () { go(isCust ? "inv.out" : "inv.in"); };
      document.getElementById("sm-stmt").onclick = function () { renderStatement(id); };
    }
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
    var jiCount = id === "new" ? 0 : ((await sb.from("journal_lines").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("account_id", id)).count || 0);
    var aSmart = id !== "new" ? '<div class="o-smart"><button class="sb" id="a-sm-gl"><span class="v">' + jiCount + '</span><span class="k">Journal Items</span></button></div>' : "";
    var typeOpts = S.types.map(function (t) { return '<option value="' + t.code + '"' + (a.type_code === t.code ? " selected" : "") + '>' + esc(t.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="a-save">Save</button><button id="a-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet">' + aSmart + '<div class="o-title"><input id="a-name" value="' + esc(a.name || "") + '" placeholder="Account name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Code", '<input id="a-code" value="' + esc(a.code || "") + '" placeholder="e.g. 7020">') +
      fld("Type", '<select id="a-type">' + typeOpts + '</select>') +
      '</div><div>' +
      fld("Status", '<select id="a-active"><option value="1"' + (a.is_active ? " selected" : "") + '>Active</option><option value="0"' + (!a.is_active ? " selected" : "") + '>Archived</option></select>') +
      '</div></div></div>';
    document.getElementById("a-discard").onclick = function () { go("accounts"); };
    if (id !== "new") { var _ag = document.getElementById("a-sm-gl"); if (_ag) _ag.onclick = function () { go("rep.gl"); }; }
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
    var prSmart = "";
    if (id !== "new" && p.type === "storable") { var _oh = await onHandMap(); prSmart = '<div class="o-smart"><button class="sb" id="pr-sm-oh"><span class="v">' + Number(_oh[id] || 0) + '</span><span class="k">On Hand</span></button></div>'; }
    function sel(id2, list, cur, blank) { return '<select id="' + id2 + '">' + (blank ? '<option value="">' + blank + '</option>' : '') + list.map(function (x) { return '<option value="' + (x.id || x.code) + '"' + ((cur === (x.id || x.code)) ? " selected" : "") + '>' + esc(x.name ? ((x.code ? x.code + " " : "") + x.name) : x) + (x.amount != null ? " (" + x.amount + "%)" : "") + '</option>'; }).join("") + '</select>'; }
    var typeSel = '<select id="pr-type">' + Object.keys(PTYPE).map(function (k) { return '<option value="' + k + '"' + (p.type === k ? " selected" : "") + '>' + PTYPE[k] + '</option>'; }).join("") + '</select>';
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pr-save">Save</button><button id="pr-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet">' + prSmart + '<div class="o-title"><input id="pr-name" value="' + esc(p.name || "") + '" placeholder="Product name"></div>' +
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
    var _po = document.getElementById("pr-sm-oh"); if (_po) _po.onclick = function () { go("inv.onhand"); };
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
      '<div><label>Amount (' + esc(S.company.currency_code) + ')</label>' + fhint("__amt", "How much is being paid now. Defaults to the full amount still due.") + '<input id="p-amt" type="number" step="0.01" value="' + due + '"></div>' +
      '<div class="row2"><div><label>Date</label>' + fhint("Date", "The date the money was received or paid.") + '<input id="p-date" type="date" value="' + today() + '"></div><div><label>Journal</label>' + fhint("Journal", "Which account the money moves through: your bank or cash on hand.") + '<select id="p-jrn"><option value="BNK">Bank</option><option value="CSH">Cash</option></select></div></div>' +
      '<div><label>Reference</label>' + fhint("Reference", "Optional: the transfer/receipt number for your records.") + '<input id="p-ref" placeholder="Receipt / transfer ref"></div>' +
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
    var invs = (await sb.from("invoices").select("id,number,invoice_date,due_date,amount_total,amount_residual, partners(name)").eq("company_id", S.company.id).eq("move_type", "out_invoice").eq("state", "posted")).data || [];
    var mnow = new Date(), months = [];
    for (var mi = 5; mi >= 0; mi--) { var _d = new Date(mnow.getFullYear(), mnow.getMonth() - mi, 1); months.push(_d.getFullYear() + "-" + ("0" + (_d.getMonth() + 1)).slice(-2)); }
    var revByM = {}; months.forEach(function (m) { revByM[m] = 0; });
    invs.forEach(function (v) { var m = (v.invoice_date || "").slice(0, 7); if (revByM[m] !== undefined) revByM[m] += Number(v.amount_total || 0); });
    var revData = months.map(function (m) { return { label: new Date(m + "-01T00:00:00").toLocaleDateString("en-US", { month: "short" }), value: revByM[m] }; });
    var todayS = today(), buckets = { "Not due": 0, "1-30 days": 0, "31-60 days": 0, "60+ days": 0 };
    invs.forEach(function (v) { var due = Number(v.amount_residual || 0); if (due <= 0.005) return; var dd = v.due_date || v.invoice_date; if (!dd || dd >= todayS) { buckets["Not due"] += due; return; } var days = Math.floor((new Date(todayS) - new Date(dd)) / 864e5); if (days <= 30) buckets["1-30 days"] += due; else if (days <= 60) buckets["31-60 days"] += due; else buckets["60+ days"] += due; });
    var ageData = Object.keys(buckets).map(function (k) { return { label: k, value: buckets[k] }; });
    var byCust = {}; invs.forEach(function (v) { var n = v.partners ? v.partners.name : "(none)"; byCust[n] = (byCust[n] || 0) + Number(v.amount_total || 0); });
    var topData = Object.keys(byCust).map(function (n) { return { label: n, value: byCust[n] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
    var chartsHtml = '<div class="o-charts">' +
      chartCard("Revenue - last 6 months", invs.length ? svgBars(revData, cc) : '<div class="muted" style="padding:10px">No posted invoices yet.</div>') +
      chartCard("Receivables aging", svgBars(ageData, cc)) +
      chartCard("Top customers", topData.length ? svgBars(topData, cc) : '<div class="muted" style="padding:10px">No invoices yet.</div>') +
      '</div>';
    var overdue = invs.filter(function (v) { var dd = v.due_date || v.invoice_date; return Number(v.amount_residual || 0) > 0.005 && dd && dd < todayS; }).sort(function (a, b) { return (a.due_date || "") < (b.due_date || "") ? -1 : 1; });
    var overdueTotal = overdue.reduce(function (s, v) { return s + Number(v.amount_residual || 0); }, 0);
    var overdueRows = overdue.slice(0, 8).map(function (v) {
      var dd = v.due_date || v.invoice_date, days = Math.floor((new Date(todayS) - new Date(dd)) / 864e5);
      return '<tr data-inv="' + v.id + '" style="cursor:pointer"><td>' + esc(v.partners ? v.partners.name : "(none)") + '</td><td>' + esc(v.number || "") + '</td><td>' + esc(dd) + '</td><td class="num" style="color:var(--warn,#c0392b);font-weight:600">' + days + 'd</td><td class="num">' + cc + ' ' + money(v.amount_residual) + '</td></tr>';
    }).join("");
    var overdueHtml = overdue.length
      ? '<div class="o-chart" style="margin-top:14px"><h3>Overdue invoices &middot; ' + cc + ' ' + money(overdueTotal) + ' across ' + overdue.length + ' invoice' + (overdue.length === 1 ? "" : "s") + '</h3><div class="o-chart-bd" style="padding:0"><table class="o-list"><thead><tr><th>Customer</th><th>Number</th><th>Due</th><th class="num">Overdue</th><th class="num">Amount</th></tr></thead><tbody>' + overdueRows + '</tbody></table></div></div>'
      : '';
    document.getElementById("db").className = "";
    document.getElementById("db").innerHTML =
      '<div class="kpis">' +
      kpi("Cash &amp; Bank", cc + " " + money(cash)) + kpi("Receivable", cc + " " + money(recv)) +
      kpi("Payable", cc + " " + money(pay)) + kpi("Net Result (YTD)", cc + " " + money(income - expense)) + '</div>' +
      '<div class="o-jcards">' +
      jcard("Customer Invoices", cc + " " + money(recv), "Outstanding receivable", "inv.out", "New Invoice", function () { renderInvoiceForm("new", "out_invoice"); }) +
      jcard("Vendor Bills", cc + " " + money(pay), "Outstanding payable", "inv.in", "New Bill", function () { renderInvoiceForm("new", "in_invoice"); }) +
      jcard("Bank", cc + " " + money(cash), "Cash & bank balance", "pay.in", "Register Payment", null) +
      '</div>' + chartsHtml + overdueHtml;
    document.querySelectorAll("[data-jgo]").forEach(function (e) { e.onclick = function () { go(e.dataset.jgo); }; });
    var ni = document.getElementById("jc-new-inv"); if (ni) ni.onclick = function () { renderInvoiceForm("new", "out_invoice"); };
    var nb = document.getElementById("jc-new-bill"); if (nb) nb.onclick = function () { renderInvoiceForm("new", "in_invoice"); };
    document.querySelectorAll("[data-inv]").forEach(function (el) { el.onclick = function () { renderInvoiceForm(el.dataset.inv, "out_invoice"); }; });
  }
  function kpi(l, n) { return '<div class="kpi"><div class="l">' + l + '</div><div class="n">' + n + '</div></div>'; }
  function chartCard(title, inner) { return '<div class="o-chart"><h3>' + esc(title) + '</h3><div class="o-chart-bd">' + inner + '</div></div>'; }
  function svgBars(items, cc) {
    var vals = items.map(function (i) { return Math.abs(Number(i.value) || 0); });
    var max = Math.max.apply(null, vals.concat([1]));
    var w = 560, labelW = 122, rowH = 30, h = items.length * rowH + 6, barMax = w - labelW - 118;
    var body = items.map(function (it, idx) {
      var y = idx * rowH + 6, bw = Math.max(2, (Math.abs(Number(it.value) || 0) / max) * barMax);
      return '<text x="0" y="' + (y + 16) + '" font-size="12.5" fill="var(--ink2)">' + esc(String(it.label).slice(0, 18)) + '</text>' +
        '<rect x="' + labelW + '" y="' + (y + 4) + '" width="' + bw.toFixed(1) + '" height="17" rx="4" fill="var(--accent)"></rect>' +
        '<text x="' + w + '" y="' + (y + 16) + '" font-size="12" text-anchor="end" fill="var(--ink)" font-weight="600">' + cc + ' ' + money(it.value) + '</text>';
    }).join("");
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:100%;display:block;height:auto">' + body + '</svg>';
  }
  function jcard(name, big, sub, action, newLabel, newFn) {
    var nid = name === "Customer Invoices" ? "jc-new-inv" : name === "Vendor Bills" ? "jc-new-bill" : "";
    return '<div class="o-jc"><div class="hd"><span class="nm">' + esc(name) + '</span></div>' +
      '<div class="bd"><div class="row"><span>' + esc(sub) + '</span><b>' + big + '</b></div></div>' +
      (newFn ? '<span class="lk" ' + (nid ? 'id="' + nid + '"' : "") + '>' + esc(newLabel) + ' &rarr;</span>' : '<span class="lk" data-jgo="' + action + '">View &rarr;</span>') + '</div>';
  }

  // ============================ REPORTS ============================
  var REP_PERIOD = "year";
  var PERIODS = [["year", "This year"], ["quarter", "This quarter"], ["month", "This month"], ["lastyear", "Last year"], ["all", "All time"]];
  function periodSelect() { return '<select id="rp-period" class="o-filtbtn" style="margin-right:8px">' + PERIODS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === REP_PERIOD ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select>'; }
  function wirePeriod(rerender) { var el = document.getElementById("rp-period"); if (el) el.onchange = function () { REP_PERIOD = this.value; rerender(); }; }
  function periodRange(p) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    function ymd(yy, mm, dd) { return yy + "-" + ("0" + mm).slice(-2) + "-" + ("0" + dd).slice(-2); }
    function lastDay(yy, mm) { return new Date(yy, mm, 0).getDate(); }
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (p === "year") return { from: ymd(y, 1, 1), to: ymd(y, 12, 31), label: "FY " + y };
    if (p === "lastyear") return { from: ymd(y - 1, 1, 1), to: ymd(y - 1, 12, 31), label: "FY " + (y - 1) };
    if (p === "quarter") { var qs = Math.floor(m / 3) * 3; return { from: ymd(y, qs + 1, 1), to: ymd(y, qs + 3, lastDay(y, qs + 3)), label: "Q" + (Math.floor(m / 3) + 1) + " " + y }; }
    if (p === "month") return { from: ymd(y, m + 1, 1), to: ymd(y, m + 1, lastDay(y, m + 1)), label: names[m] + " " + y };
    return { from: null, to: null, label: "all time" };
  }
  // Recreates the trial_balance rpc row shape ({code,name,type_code,debit,credit,balance})
  // from posted journal_lines, but honouring a date window so reports can be period-scoped.
  async function computeRows(fromD, toD) {
    var lines = (await sb.from("journal_lines").select("debit,credit, accounts!inner(code,name,type_code), journal_entries!inner(date,state)")
      .eq("company_id", S.company.id).eq("journal_entries.state", "posted")).data || [];
    var acc = {};
    lines.forEach(function (l) {
      var d = l.journal_entries ? l.journal_entries.date : null; if (!d) return;
      if (fromD && d < fromD) return; if (toD && d > toD) return;
      var a = l.accounts || {}, k = a.code || "zz";
      var r = acc[k] || (acc[k] = { code: a.code, name: a.name, type_code: a.type_code, debit: 0, credit: 0, balance: 0 });
      r.debit += Number(l.debit) || 0; r.credit += Number(l.credit) || 0;
    });
    return Object.keys(acc).map(function (k) { var r = acc[k]; r.balance = r.debit - r.credit; return r; }).sort(function (a, b) { return (a.code || "") < (b.code || "") ? -1 : 1; });
  }
  async function renderReport(kind) {
    var titles = { pl: "Profit and Loss", bs: "Balance Sheet", tb: "Trial Balance" };
    var pr = periodRange(REP_PERIOD);
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(titles[kind]) + '<div class="gap"></div>' + periodSelect() + '<button class="o-filtbtn" id="rp-export">Export</button><button class="o-filtbtn" id="rp-print">Print</button></div>' +
      '<div class="o-form-bg"><div class="o-report" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
    wirePeriod(function () { renderReport(kind); });
    var asOf = pr.to || today();
    var rows = await computeRows(kind === "pl" ? pr.from : null, pr.to);
    var cc = S.company.currency_code, rep = document.getElementById("rep");
    if (kind === "tb") {
      var td = 0, tc = 0;
      var body = rows.map(function (r) { td += Number(r.debit); tc += Number(r.credit); return '<tr><td class="cd">' + esc(r.code) + '</td><td>' + esc(r.name) + '</td><td class="num">' + (Number(r.debit) ? money(r.debit) : "") + '</td><td class="num">' + (Number(r.credit) ? money(r.credit) : "") + '</td></tr>'; }).join("");
      rep.innerHTML = '<h1>Trial Balance</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; as of ' + asOf + '</div>' +
        '<table class="o-rt"><thead><tr><td class="cd">Code</td><td>Account</td><td class="num">Debit</td><td class="num">Credit</td></tr></thead><tbody>' + body +
        '<tr class="tot"><td></td><td>Total</td><td class="num">' + money(td) + '</td><td class="num">' + money(tc) + '</td></tr></tbody></table>';
    } else if (kind === "pl") {
      var inc = rows.filter(function (r) { return (r.type_code || "").indexOf("income") === 0; });
      var exp = rows.filter(function (r) { return (r.type_code || "").indexOf("expense") === 0; });
      var incT = 0, expT = 0;
      var incR = inc.map(function (r) { var v = Number(r.credit) - Number(r.debit); incT += v; return repLine(r.code, r.name, v); }).join("");
      var expR = exp.map(function (r) { var v = Number(r.debit) - Number(r.credit); expT += v; return repLine(r.code, r.name, v); }).join("");
      rep.innerHTML = '<h1>Profit and Loss</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; ' + esc(pr.label) + (pr.from ? ' (' + pr.from + ' to ' + pr.to + ')' : '') + '</div>' +
        '<table class="o-rt"><tbody><tr class="sec"><td colspan="3">Income</td></tr>' + (incR || repEmpty()) + '<tr class="tot"><td></td><td>Total Income</td><td class="num">' + money(incT) + '</td></tr>' +
        '<tr class="sec"><td colspan="3">Expenses</td></tr>' + (expR || repEmpty()) + '<tr class="tot"><td></td><td>Total Expenses</td><td class="num">' + money(expT) + '</td></tr>' +
        '<tr class="tot"><td></td><td>Net Profit</td><td class="num">' + money(incT - expT) + '</td></tr></tbody></table>';
    } else {
      function grp(prefix, flip) { var g = rows.filter(function (r) { return (r.type_code || "").indexOf(prefix) === 0; }); var t = 0; var h = g.map(function (r) { var v = flip ? Number(r.credit) - Number(r.debit) : Number(r.balance); t += v; return repLine(r.code, r.name, v); }).join(""); return { h: h, t: t }; }
      var a = grp("asset", false), l = grp("liability", true), e = grp("equity", true);
      var result = 0; rows.forEach(function (r) { var tc = r.type_code || ""; if (tc.indexOf("income") === 0) result += Number(r.credit) - Number(r.debit); if (tc.indexOf("expense") === 0) result -= Number(r.debit) - Number(r.credit); });
      rep.innerHTML = '<h1>Balance Sheet</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; as of ' + asOf + '</div>' +
        '<table class="o-rt"><tbody><tr class="sec"><td colspan="3">Assets</td></tr>' + (a.h || repEmpty()) + '<tr class="tot"><td></td><td>Total Assets</td><td class="num">' + money(a.t) + '</td></tr>' +
        '<tr class="sec"><td colspan="3">Liabilities</td></tr>' + (l.h || repEmpty()) + '<tr class="tot"><td></td><td>Total Liabilities</td><td class="num">' + money(l.t) + '</td></tr>' +
        '<tr class="sec"><td colspan="3">Equity</td></tr>' + (e.h || repEmpty()) + repLine("", "Current Year Earnings", result) + '<tr class="tot"><td></td><td>Total Equity</td><td class="num">' + money(e.t + result) + '</td></tr></tbody></table>';
    }
  }
  function repLine(code, name, v) { return '<tr><td class="cd">' + esc(code) + '</td><td>' + esc(name) + '</td><td class="num">' + money(v) + '</td></tr>'; }
  function repEmpty() { return '<tr><td></td><td class="muted">No entries.</td><td></td></tr>'; }
  function repChrome(title, wide, withPeriod) { return '<div class="o-view"><div class="o-cp">' + bcHTML(title) + '<div class="gap"></div>' + (withPeriod ? periodSelect() : "") + '<button class="o-filtbtn" id="rp-export">Export</button><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report' + (wide ? ' wide' : '') + '" id="rep"><div class="o-empty">Loading...</div></div></div></div>'; }
  function repHead(title, cc) { return '<h1>' + esc(title) + '</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; as of ' + today() + '</div>'; }
  // Generic report export: scrape the rendered .o-rt table in #rep into CSV.
  function exportRepCsv() {
    var rep = document.getElementById("rep"); if (!rep) return;
    var table = rep.querySelector("table.o-rt");
    if (!table) { toast("Nothing to export yet"); return; }
    var title = (rep.querySelector("h1") ? rep.querySelector("h1").textContent : "report");
    var out = [];
    table.querySelectorAll("tr").forEach(function (tr) {
      var row = []; tr.querySelectorAll("th,td").forEach(function (td) { row.push(csvCell(htmlToText(td.innerHTML))); });
      if (row.length) out.push(row.join(","));
    });
    var csv = "﻿" + out.join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" }), url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url; a.download = title.replace(/[^\w]+/g, "_").toLowerCase() + "_" + today() + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Report exported to CSV");
  }

  async function renderGeneralLedger() {
    document.getElementById("o-main").innerHTML = repChrome("General Ledger", true, true);
    wireBc(); document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
    wirePeriod(renderGeneralLedger);
    var pr = periodRange(REP_PERIOD), cc = S.company.currency_code, rep = document.getElementById("rep");
    var lines = (await sb.from("journal_lines")
      .select("debit,credit,label, accounts!inner(code,name), journal_entries!inner(date,entry_number,ref,state), partners(name)")
      .eq("company_id", S.company.id).eq("journal_entries.state", "posted")).data || [];
    lines = lines.filter(function (l) { var d = l.journal_entries ? l.journal_entries.date : null; if (!d) return false; if (pr.from && d < pr.from) return false; if (pr.to && d > pr.to) return false; return true; });
    if (!lines.length) { rep.innerHTML = repHead("General Ledger - " + pr.label, cc) + '<div class="o-empty">No posted journal entries in this period.</div>'; return; }
    var byAcc = {};
    lines.forEach(function (l) { var a = l.accounts || {}; var k = (a.code || "zz") + "|" + (a.name || ""); (byAcc[k] || (byAcc[k] = [])).push(l); });
    var keys = Object.keys(byAcc).sort();
    var html = "", gtd = 0, gtc = 0;
    keys.forEach(function (k) {
      var rowsA = byAcc[k].slice().sort(function (x, y) { return (x.journal_entries.date < y.journal_entries.date) ? -1 : 1; });
      var parts = k.split("|"), bal = 0, atd = 0, atc = 0;
      html += '<tr class="sec"><td colspan="7">' + esc(parts[0]) + ' ' + esc(parts[1]) + '</td></tr>';
      rowsA.forEach(function (l) {
        var d = Number(l.debit) || 0, c = Number(l.credit) || 0; bal += d - c; atd += d; atc += c; var e = l.journal_entries || {};
        html += '<tr><td>' + esc(e.date || "") + '</td><td>' + esc(e.entry_number || e.ref || "") + '</td><td>' + esc((l.partners && l.partners.name) || "") + '</td><td>' + esc(l.label || "") + '</td>' +
          '<td class="num">' + (d ? money(d) : "") + '</td><td class="num">' + (c ? money(c) : "") + '</td><td class="num">' + money(bal) + '</td></tr>';
      });
      gtd += atd; gtc += atc;
      html += '<tr class="tot"><td colspan="4">Total ' + esc(parts[0]) + '</td><td class="num">' + money(atd) + '</td><td class="num">' + money(atc) + '</td><td class="num">' + money(atd - atc) + '</td></tr>';
    });
    rep.innerHTML = repHead("General Ledger - " + pr.label, cc) +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Date</td><td>Entry</td><td>Partner</td><td>Label</td><td class="num">Debit</td><td class="num">Credit</td><td class="num">Balance</td></tr></thead><tbody>' +
      html + '<tr class="tot"><td colspan="4">Grand Total</td><td class="num">' + money(gtd) + '</td><td class="num">' + money(gtc) + '</td><td class="num">' + money(gtd - gtc) + '</td></tr></tbody></table></div>';
  }

  async function renderPartnerLedger() {
    document.getElementById("o-main").innerHTML = repChrome("Partner Ledger", true);
    wireBc(); document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
    var cc = S.company.currency_code, rep = document.getElementById("rep");
    var lines = (await sb.from("journal_lines")
      .select("debit,credit,label,partner_id, accounts!inner(code,name,type_code), journal_entries!inner(date,entry_number,ref,state), partners(name)")
      .eq("company_id", S.company.id).eq("journal_entries.state", "posted").not("partner_id", "is", null)).data || [];
    lines = lines.filter(function (l) { var t = (l.accounts && l.accounts.type_code) || ""; return t === "asset_receivable" || t === "liability_payable"; });
    if (!lines.length) { rep.innerHTML = repHead("Partner Ledger", cc) + '<div class="o-empty">No receivable or payable entries with a partner yet.</div>'; return; }
    var byP = {};
    lines.forEach(function (l) { var pid = l.partner_id; var name = (l.partners && l.partners.name) || "(no partner)"; (byP[pid] || (byP[pid] = { name: name, rows: [] })).rows.push(l); });
    var keys = Object.keys(byP).sort(function (a, b) { return byP[a].name < byP[b].name ? -1 : 1; });
    var html = "", gtd = 0, gtc = 0;
    keys.forEach(function (k) {
      var p = byP[k]; var rowsP = p.rows.slice().sort(function (x, y) { return x.journal_entries.date < y.journal_entries.date ? -1 : 1; });
      var bal = 0, ptd = 0, ptc = 0;
      html += '<tr class="sec"><td colspan="6">' + esc(p.name) + '</td></tr>';
      rowsP.forEach(function (l) { var d = Number(l.debit) || 0, c = Number(l.credit) || 0; bal += d - c; ptd += d; ptc += c; var e = l.journal_entries || {}; html += '<tr><td>' + esc(e.date || "") + '</td><td>' + esc(e.entry_number || e.ref || "") + '</td><td>' + esc(l.label || "") + '</td><td class="num">' + (d ? money(d) : "") + '</td><td class="num">' + (c ? money(c) : "") + '</td><td class="num">' + money(bal) + '</td></tr>'; });
      gtd += ptd; gtc += ptc;
      html += '<tr class="tot"><td colspan="3">Total ' + esc(p.name) + '</td><td class="num">' + money(ptd) + '</td><td class="num">' + money(ptc) + '</td><td class="num">' + money(ptd - ptc) + '</td></tr>';
    });
    rep.innerHTML = repHead("Partner Ledger", cc) + '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Date</td><td>Entry</td><td>Label</td><td class="num">Debit</td><td class="num">Credit</td><td class="num">Balance</td></tr></thead><tbody>' + html + '<tr class="tot"><td colspan="3">Grand Total</td><td class="num">' + money(gtd) + '</td><td class="num">' + money(gtc) + '</td><td class="num">' + money(gtd - gtc) + '</td></tr></tbody></table></div>';
  }

  async function renderAged(which) {
    var isRecv = which === "recv", title = isRecv ? "Aged Receivable" : "Aged Payable";
    document.getElementById("o-main").innerHTML = repChrome(title, true);
    wireBc(); document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
    var cc = S.company.currency_code, rep = document.getElementById("rep");
    var types = isRecv ? ["out_invoice", "out_refund"] : ["in_invoice", "in_refund"];
    var invs = (await sb.from("invoices").select("partner_id,invoice_date,due_date,amount_residual,move_type, partners(name)").eq("company_id", S.company.id).in("move_type", types).eq("state", "posted")).data || [];
    var todayS = today(), byP = {};
    invs.forEach(function (v) {
      var due = Number(v.amount_residual || 0); if (Math.abs(due) <= 0.005) return;
      var sign = (v.move_type === "out_refund" || v.move_type === "in_refund") ? -1 : 1, amt = due * sign;
      var pid = v.partner_id || "none", name = (v.partners && v.partners.name) || "(no partner)";
      var p = byP[pid] || (byP[pid] = { name: name, b: [0, 0, 0, 0, 0], total: 0 });
      var dd = v.due_date || v.invoice_date, idx;
      if (!dd || dd >= todayS) idx = 0;
      else { var days = Math.floor((new Date(todayS) - new Date(dd)) / 864e5); idx = days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4; }
      p.b[idx] += amt; p.total += amt;
    });
    var partners = Object.keys(byP).map(function (k) { return byP[k]; }).filter(function (p) { return Math.abs(p.total) > 0.005; }).sort(function (a, b) { return b.total - a.total; });
    var cols = ["Not due", "1-30", "31-60", "61-90", "90+"], tot = [0, 0, 0, 0, 0], gtot = 0;
    var body = partners.map(function (p) {
      var tds = p.b.map(function (x, i) { tot[i] += x; return '<td class="num">' + (Math.abs(x) > 0.005 ? money(x) : "") + '</td>'; }).join("");
      gtot += p.total;
      return '<tr><td>' + esc(p.name) + '</td>' + tds + '<td class="num"><b>' + money(p.total) + '</b></td></tr>';
    }).join("");
    var totRow = '<tr class="tot"><td>Total</td>' + tot.map(function (x) { return '<td class="num">' + money(x) + '</td>'; }).join("") + '<td class="num">' + money(gtot) + '</td></tr>';
    rep.innerHTML = repHead(title, cc) + (partners.length
      ? '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Partner</td>' + cols.map(function (c) { return '<td class="num">' + c + '</td>'; }).join("") + '<td class="num">Total</td></tr></thead><tbody>' + body + totRow + '</tbody></table></div>'
      : '<div class="o-empty">Nothing outstanding.</div>');
  }

  async function renderTaxReport() {
    document.getElementById("o-main").innerHTML = repChrome("VAT / Tax Report", false, true);
    wireBc(); document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
    wirePeriod(renderTaxReport);
    var pr = periodRange(REP_PERIOD), cc = S.company.currency_code, rep = document.getElementById("rep");
    var rows = (await sb.from("invoice_lines").select("price_subtotal, invoices!inner(move_type,state,invoice_date), taxes(name,amount)")
      .eq("company_id", S.company.id).eq("invoices.state", "posted")).data || [];
    rows = rows.filter(function (r) { var d = r.invoices ? r.invoices.invoice_date : null; if (!d) return false; if (pr.from && d < pr.from) return false; if (pr.to && d > pr.to) return false; return true; });
    var sales = {}, purch = {};
    rows.forEach(function (r) {
      var mt = (r.invoices && r.invoices.move_type) || "out_invoice";
      var isSale = mt.indexOf("out") === 0, sign = mt.indexOf("refund") >= 0 ? -1 : 1;
      var rate = (r.taxes && Number(r.taxes.amount)) || 0;
      var base = Number(r.price_subtotal || 0) * sign, tax = base * rate / 100;
      var nm = (r.taxes && r.taxes.name) || "No tax / exempt";
      var bag = isSale ? sales : purch, e = bag[nm] || (bag[nm] = { base: 0, tax: 0 });
      e.base += base; e.tax += tax;
    });
    function section(title, bag) {
      var keys = Object.keys(bag).sort(), tb = 0, tt = 0;
      var body = keys.map(function (k) { var e = bag[k]; tb += e.base; tt += e.tax; return '<tr><td>' + esc(k) + '</td><td class="num">' + money(e.base) + '</td><td class="num">' + money(e.tax) + '</td></tr>'; }).join("");
      return { html: '<tr class="sec"><td colspan="3">' + title + '</td></tr>' + (body || '<tr><td class="muted">None.</td><td></td><td></td></tr>') + '<tr class="tot"><td>Total ' + title + '</td><td class="num">' + money(tb) + '</td><td class="num">' + money(tt) + '</td></tr>', tax: tt };
    }
    var s = section("Sales (output VAT)", sales), p = section("Purchases (input VAT)", purch);
    var net = s.tax - p.tax;
    rep.innerHTML = repHead("VAT / Tax Report - " + pr.label, cc) +
      '<table class="o-rt"><thead><tr><td>Tax</td><td class="num">Net base</td><td class="num">Tax amount</td></tr></thead><tbody>' +
      s.html + p.html +
      '<tr class="tot"><td>' + (net >= 0 ? 'VAT payable' : 'VAT credit (refundable)') + '</td><td class="num"></td><td class="num">' + money(Math.abs(net)) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="sub" style="margin-top:14px">Output VAT is tax you collected on sales; input VAT is tax you paid on purchases. Payable = output minus input. Credit notes are netted out. Posted documents only.</div>';
  }

  async function renderStatement(pid) {
    var cc = S.company.currency_code;
    var partners = (await sb.from("partners").select("id,name").order("name")).data || [];
    var sel = '<select id="stmt-sel" class="o-filtbtn" style="min-width:220px"><option value="">Select a partner...</option>' +
      partners.map(function (p) { return '<option value="' + p.id + '"' + (p.id === pid ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>';
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Partner Statement") + '<div class="gap"></div>' + sel +
      '<button class="o-filtbtn" id="rp-export">Export</button><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Select a partner above to view their statement of account.</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
    var selEl = document.getElementById("stmt-sel");
    selEl.onchange = function () { renderStatement(selEl.value); };
    if (!pid) return;
    var rep = document.getElementById("rep");
    var partner = partners.filter(function (p) { return p.id === pid; })[0] || { name: "" };
    var invs = (await sb.from("invoices").select("number,move_type,invoice_date,due_date,amount_total").eq("company_id", S.company.id).eq("partner_id", pid).eq("state", "posted")).data || [];
    var pays = (await sb.from("payments").select("date,amount,amount_company,payment_type,reference,memo").eq("company_id", S.company.id).eq("partner_id", pid).in("state", ["posted", "reconciled"])).data || [];
    var ev = [];
    invs.forEach(function (v) {
      var t = v.move_type, docs = { out_invoice: "Invoice", out_refund: "Credit Note", in_invoice: "Vendor Bill", in_refund: "Vendor Refund" };
      var delta = (t === "out_invoice" || t === "in_refund" ? 1 : -1) * Number(v.amount_total || 0);
      ev.push({ date: v.invoice_date || "", doc: docs[t] || t, ref: v.number || "", due: v.due_date || "", delta: delta });
    });
    pays.forEach(function (p) {
      var amt = Number(p.amount_company || p.amount || 0);
      var delta = (p.payment_type === "inbound" ? -1 : 1) * amt;
      ev.push({ date: p.date || "", doc: p.payment_type === "inbound" ? "Payment received" : "Payment made", ref: p.reference || p.memo || "", due: "", delta: delta });
    });
    ev.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    if (!ev.length) { rep.innerHTML = repHead("Statement - " + partner.name, cc) + '<div class="o-empty">No posted documents for this partner yet.</div>'; return; }
    var bal = 0;
    var body = ev.map(function (e) {
      bal += e.delta;
      var charge = e.delta > 0 ? money(e.delta) : "";
      var credit = e.delta < 0 ? money(-e.delta) : "";
      return '<tr><td>' + esc(e.date) + '</td><td>' + esc(e.doc) + '</td><td>' + esc(e.ref) + '</td><td>' + esc(e.due) + '</td><td class="num">' + charge + '</td><td class="num">' + credit + '</td><td class="num">' + money(bal) + '</td></tr>';
    }).join("");
    var owed = bal, dir = owed > 0.005 ? partner.name + " owes you" : owed < -0.005 ? "You owe " + partner.name : "Settled";
    rep.innerHTML = repHead("Statement of Account - " + partner.name, cc) +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Date</td><td>Document</td><td>Reference</td><td>Due</td><td class="num">Charges</td><td class="num">Payments</td><td class="num">Balance</td></tr></thead><tbody>' +
      body + '<tr class="tot"><td colspan="6">' + esc(dir) + '</td><td class="num">' + money(Math.abs(owed)) + '</td></tr></tbody></table></div>' +
      '<div class="sub" style="margin-top:14px">Charges increase the balance owed to you; payments and credit notes reduce it. A positive closing balance is what the partner still owes. Posted documents only.</div>';
  }

  // ============================ CONSOLIDATION ============================
  async function renderConsolidation() {
    var ref = (S.org && S.org.ref_currency) || S.company.currency_code || "USD";
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Consolidation") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report" id="rep"><div class="o-empty">Consolidating ' + S.companies.length + ' entities...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); }; var _ex = document.getElementById("rp-export"); if (_ex) _ex.onclick = exportRepCsv;
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

  // ============================ APPEARANCE (THEME) ============================
  function renderAppearance() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Appearance") + '</div><div class="o-form-bg"><div class="appr" id="appr"></div></div></div>';
    wireBc();
    var THEMES = [
      ["spacework", "Space Work", ["#fbfaf8", "#0a66ff", "#14161a"]],
      ["system", "System", ["#fbfaf8", "#0a66ff", "#14161a"]],
      ["light", "Light", ["#ffffff", "#0a66ff", "#14161a"]],
      ["dark", "Dark", ["#141a23", "#5b9bf0", "#0c1016"]],
      ["corporate", "Corporate", ["#eef1f5", "#1f4e79", "#1f4e79"]],
      ["colorful", "Colorful", ["#f6f4ff", "#7c3aed", "#db2777"]],
      ["blue", "Blue", ["#eef4fc", "#2563eb", "#1d4ed8"]],
      ["pink", "Pink", ["#fdf2f7", "#db2777", "#be185d"]]
    ];
    var FONTS = [["system", "System"], ["inter", "Inter"], ["rounded", "Rounded"], ["serif", "Serif"], ["mono", "Mono"]];
    var SIZES = [["small", "Small"], ["normal", "Normal"], ["large", "Large"]];
    function draw() {
      document.getElementById("appr").innerHTML =
        '<h3>Theme</h3><div class="themes">' + THEMES.map(function (t) {
          return '<div class="th' + (S.ui.theme === t[0] ? " on" : "") + '" data-theme="' + t[0] + '"><div class="sw">' + t[2].map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") + '</div><div class="nm">' + t[1] + (S.ui.theme === t[0] ? " &#10003;" : "") + '</div></div>';
        }).join("") + '</div>' +
        '<h3>Font</h3><div class="opts">' + FONTS.map(function (f) { return '<button class="opt' + (S.ui.font === f[0] ? " on" : "") + '" data-font="' + f[0] + '">' + f[1] + '</button>'; }).join("") + '</div>' +
        '<h3>Text size</h3><div class="opts">' + SIZES.map(function (s) { return '<button class="opt' + (S.ui.size === s[0] ? " on" : "") + '" data-size="' + s[0] + '">' + s[1] + '</button>'; }).join("") + '</div>' +
        '<div class="hint">Saved on this device; applies across the whole app instantly.</div>';
      document.querySelectorAll("#appr [data-theme]").forEach(function (x) { x.onclick = function () { S.ui.theme = x.dataset.theme; saveUI(); applyTheme(); draw(); }; });
      document.querySelectorAll("#appr [data-font]").forEach(function (x) { x.style.fontFamily = fontStack(x.dataset.font); x.onclick = function () { S.ui.font = x.dataset.font; saveUI(); applyTheme(); draw(); }; });
      document.querySelectorAll("#appr [data-size]").forEach(function (x) { x.onclick = function () { S.ui.size = x.dataset.size; saveUI(); applyFontScale(); draw(); }; });
    }
    draw();
  }

  // ============================ INVENTORY ============================
  var INV = null;
  async function ensureInventory() {
    if (INV && INV.company === S.company.id) return INV;
    var whs = (await sb.from("warehouses").select("id,name,code").eq("company_id", S.company.id).order("name")).data || [];
    if (!whs.length) { var w = await sb.from("warehouses").insert({ company_id: S.company.id, name: "Main Warehouse", code: "WH" }).select("id,name,code").single(); if (w.error) { toast("Inventory setup failed: " + w.error.message); return null; } whs = [w.data]; }
    var locs = (await sb.from("stock_locations").select("id,name,usage,warehouse_id").eq("company_id", S.company.id)).data || [];
    async function ensureLoc(usage, name, whId) {
      var l = locs.filter(function (x) { return x.usage === usage && (whId ? x.warehouse_id === whId : true); })[0];
      if (l) return l;
      var r = await sb.from("stock_locations").insert({ company_id: S.company.id, warehouse_id: whId || whs[0].id, name: name, usage: usage }).select("id,name,usage,warehouse_id").single();
      if (r.data) locs.push(r.data);
      return r.data || {};
    }
    for (var i = 0; i < whs.length; i++) { if (!locs.filter(function (x) { return x.usage === "internal" && x.warehouse_id === whs[i].id; })[0]) await ensureLoc("internal", whs[i].name + " / Stock", whs[i].id); }
    var supplier = await ensureLoc("supplier", "Vendors", null);
    var customer = await ensureLoc("customer", "Customers", null);
    var adjust = await ensureLoc("inventory", "Inventory Adjustment", null);
    var internal = locs.filter(function (x) { return x.usage === "internal"; });
    INV = { company: S.company.id, warehouses: whs, internal: internal, supplier: supplier.id, customer: customer.id, adjust: adjust.id, stock: internal[0] ? internal[0].id : null };
    return INV;
  }
  async function onHandMap() {
    var by = await onHandByLoc(), oh = {};
    Object.keys(by).forEach(function (pid) { oh[pid] = Object.keys(by[pid]).reduce(function (s, l) { return s + by[pid][l]; }, 0); });
    return oh;
  }
  async function onHandByLoc() {
    var locs = (await sb.from("stock_locations").select("id,usage").eq("company_id", S.company.id)).data || [];
    var internal = {}; locs.forEach(function (l) { if (l.usage === "internal") internal[l.id] = 1; });
    var moves = (await sb.from("stock_moves").select("product_id,quantity,location_id,location_dest_id").eq("company_id", S.company.id).eq("state", "done")).data || [];
    var by = {};
    function add(pid, loc, q) { by[pid] = by[pid] || {}; by[pid][loc] = (by[pid][loc] || 0) + q; }
    moves.forEach(function (m) { var q = Number(m.quantity) || 0; if (internal[m.location_dest_id]) add(m.product_id, m.location_dest_id, q); if (internal[m.location_id]) add(m.product_id, m.location_id, -q); });
    return by;
  }
  var OH_LOC = "all";
  async function renderOnHand() {
    var main = document.getElementById("o-main");
    var inv = await ensureInventory();
    var locSel = "";
    if (inv && inv.internal.length > 1) {
      if (OH_LOC !== "all" && !inv.internal.filter(function (l) { return l.id === OH_LOC; })[0]) OH_LOC = "all";
      locSel = '<select id="oh-loc" style="border:1px solid var(--line);background:var(--panel2);color:var(--ink);border-radius:8px;padding:6px 9px;font:inherit;font-size:13px"><option value="all">All locations</option>' +
        inv.internal.map(function (l) { return '<option value="' + l.id + '"' + (OH_LOC === l.id ? " selected" : "") + '>' + esc(l.name) + '</option>'; }).join("") + '</select>';
    } else OH_LOC = "all";
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("On Hand") +
      '<button class="o-new" id="i-recv">Receive</button><button class="btn" id="i-deliv">Deliver</button><button class="btn" id="i-xfer">Transfer</button><button class="btn" id="i-adj">Adjust</button>' +
      '<div class="gap"></div>' + locSel +
      '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var prods = (await sb.from("products").select("id,name,default_code,type,cost_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    wireInvBtns(prods);
    var ls = document.getElementById("oh-loc"); if (ls) ls.onchange = function () { OH_LOC = this.value; renderOnHand(); };
    var body = document.getElementById("o-body");
    if (!prods.length) { body.innerHTML = '<div class="o-empty">No products yet. Add products (set type to <b>Storable</b>) in the Products screen, then Receive stock.</div>'; return; }
    var by = await onHandByLoc();
    function qOf(pid) { if (!by[pid]) return 0; if (OH_LOC === "all") return Object.keys(by[pid]).reduce(function (s, l) { return s + by[pid][l]; }, 0); return by[pid][OH_LOC] || 0; }
    var storable = prods.filter(function (p) { return p.type === "storable" || p.type === "consumable"; });
    var list = storable.length ? storable : prods;
    var rows = list.map(function (p) {
      var q = qOf(p.id), val = q * Number(p.cost_price || 0);
      return "<tr><td class='num' style='text-align:left'>" + esc(p.default_code || "") + "</td><td><b>" + esc(p.name) + "</b></td><td class='muted'>" + esc(PTYPE[p.type] || p.type) + "</td><td class='num'>" + q + "</td><td class='num'>" + money(p.cost_price) + "</td><td class='num'>" + money(val) + "</td></tr>";
    }).join("");
    var totVal = list.reduce(function (s, p) { return s + qOf(p.id) * Number(p.cost_price || 0); }, 0);
    var rules = (await sb.from("reordering_rules").select("product_id,min_qty,location_id").eq("company_id", S.company.id)).data || [];
    var minMap = {}; rules.forEach(function (r) { if (!r.location_id) minMap[r.product_id] = Number(r.min_qty || 0); });
    var totalAll = 0, lowCount = 0;
    list.forEach(function (p) { var tot = by[p.id] ? Object.keys(by[p.id]).reduce(function (s, l) { return s + by[p.id][l]; }, 0) : 0; totalAll += tot * Number(p.cost_price || 0); var mn = minMap[p.id] || 0; if (mn > 0 && tot < mn) lowCount++; });
    var lots = (await sb.from("stock_lots").select("id,expiry_date").eq("company_id", S.company.id)).data || [];
    var lotoh = await lotOnHand(), soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    var expCount = lots.filter(function (l) { return l.expiry_date && l.expiry_date <= soon && (lotoh[l.id] || 0) > 0; }).length;
    var kpis = '<div class="kpis" style="padding:14px 14px 2px">' + kpi("Total stock value", S.company.currency_code + " " + money(totalAll)) + kpi("Low-stock items", "" + lowCount) + kpi("Expiring / expired lots", "" + expCount) + '</div>';
    body.innerHTML = kpis + '<table class="o-list"><thead><tr><th>Reference</th><th>Product</th><th>Type</th><th class="num">On Hand</th><th class="num">Unit Cost</th><th class="num">Value</th></tr></thead><tbody>' + rows +
      "<tr style='font-weight:700'><td></td><td>Total stock value" + (OH_LOC !== "all" ? " (this location)" : "") + "</td><td></td><td></td><td></td><td class='num'>" + S.company.currency_code + " " + money(totVal) + "</td></tr></tbody></table>";
  }
  function wireInvBtns(prods) {
    var b = { "i-recv": "receive", "i-deliv": "deliver", "i-xfer": "transfer", "i-adj": "adjust" };
    Object.keys(b).forEach(function (id) { var el = document.getElementById(id); if (el) el.onclick = function () { openStockModal(b[id], prods); }; });
  }
  async function openStockModal(kind, prods) {
    var titles = { receive: "Receive stock", deliver: "Deliver stock", adjust: "Inventory adjustment", transfer: "Internal transfer" };
    var storable = prods.filter(function (p) { return p.type === "storable" || p.type === "consumable"; });
    if (!storable.length) storable = prods;
    if (!storable.length) { toast("Add a product first (Products screen)"); return; }
    var inv = await ensureInventory(); if (!inv) return;
    if (kind === "transfer" && inv.internal.length < 2) { toast("Add a second location first (Configuration > Locations)"); return; }
    var m = document.createElement("div"); m.className = "modal on"; m.id = "stockmodal";
    var opts = storable.map(function (p) { return '<option value="' + p.id + '">' + esc((p.default_code ? "[" + p.default_code + "] " : "") + p.name) + '</option>'; }).join("");
    var locOpts = inv.internal.map(function (l) { return '<option value="' + l.id + '">' + esc(l.name) + '</option>'; }).join("");
    var locField = "";
    if (kind === "transfer") locField = '<div class="row2"><div><label>From location</label>' + fhint("__from", "The stock location the goods leave.") + '<select id="k-from">' + locOpts + '</select></div><div><label>To location</label>' + fhint("__to", "The stock location the goods arrive at.") + '<select id="k-to">' + locOpts + '</select></div></div>';
    else if (inv.internal.length > 1) locField = '<div><label>Location</label>' + fhint("__loc", "Which warehouse / stock location this affects.") + '<select id="k-loc">' + locOpts + '</select></div>';
    var lotField = "";
    if (kind === "receive") lotField = '<div class="row2"><div><label>Lot / Serial (optional)</label>' + fhint("__lot", "A batch or serial number for traceability. Leave blank if not tracked.") + '<input id="k-lot" placeholder="e.g. LOT-2026-014"></div><div><label>Expiry (optional)</label>' + fhint("__exp", "Best-before / expiry date for this lot, if any.") + '<input id="k-exp" type="date"></div></div>';
    else if (kind === "deliver") lotField = '<div><label>Lot / Serial (optional)</label>' + fhint("__lot", "The batch/serial being shipped, for traceability.") + '<input id="k-lot" placeholder="lot shipped"></div>';
    m.innerHTML = '<div class="sheet"><h3>' + titles[kind] + '</h3><div class="form">' +
      '<div><label>Product</label>' + fhint("Product", "The storable item you are moving. Only stockable products appear here.") + '<select id="k-prod">' + opts + '</select></div>' + locField +
      '<div><label>' + (kind === "adjust" ? "Counted quantity on hand" : "Quantity") + '</label>' + fhint("__kqty", kind === "adjust" ? "The actual quantity you counted. We adjust stock to match it." : (kind === "receive" ? "How many units are coming into stock." : kind === "deliver" ? "How many units are leaving stock." : "How many units to move between the two locations.")) + '<input id="k-qty" type="number" step="0.01" value="' + (kind === "adjust" ? "0" : "1") + '"></div>' + lotField +
      '</div><div class="foot"><button class="btn" id="k-cancel">Cancel</button><button class="btn pri" id="k-save" style="background:var(--app);border-color:var(--app)">' + (kind === "adjust" ? "Apply" : kind === "transfer" ? "Transfer" : "Confirm") + '</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("k-cancel").onclick = function () { m.remove(); };
    document.getElementById("k-save").onclick = async function () {
      var pid = document.getElementById("k-prod").value, qty = parseFloat(document.getElementById("k-qty").value);
      if (isNaN(qty)) { toast("Enter a quantity"); return; }
      var loc = document.getElementById("k-loc") ? document.getElementById("k-loc").value : inv.stock;
      var src, dest, q = qty, vkind = null;
      if (kind === "receive") { src = inv.supplier; dest = loc; vkind = "receive"; if (!(q > 0)) { toast("Quantity must be positive"); return; } }
      else if (kind === "deliver") { src = loc; dest = inv.customer; vkind = "deliver"; if (!(q > 0)) { toast("Quantity must be positive"); return; } }
      else if (kind === "transfer") { var from = document.getElementById("k-from").value, to = document.getElementById("k-to").value; if (from === to) { toast("Pick two different locations"); return; } if (!(q > 0)) { toast("Quantity must be positive"); return; } src = from; dest = to; }
      else { var cur = ((await onHandByLoc())[pid] || {})[loc] || 0; var diff = qty - cur; if (Math.abs(diff) < 0.0001) { toast("No change"); return; } if (diff > 0) { src = inv.adjust; dest = loc; q = diff; vkind = "adjust_up"; } else { src = loc; dest = inv.adjust; q = -diff; vkind = "adjust_down"; } }
      var r = await sb.from("stock_moves").insert({ company_id: S.company.id, product_id: pid, quantity: q, location_id: src, location_dest_id: dest, state: "done", date: new Date().toISOString() }).select("id").single();
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      if (vkind) { var product = prods.filter(function (p) { return p.id === pid; })[0] || {}; await postStockValue(vkind, product, q, r.data && r.data.id); }
      var lotName = document.getElementById("k-lot") ? document.getElementById("k-lot").value.trim() : "";
      if (lotName && r.data && r.data.id) { var lotId = await findOrCreateLot(pid, lotName, document.getElementById("k-exp") ? document.getElementById("k-exp").value : null); if (lotId) await sb.from("stock_move_lines").insert({ company_id: S.company.id, move_id: r.data.id, lot_id: lotId, quantity: q }); }
      m.remove(); toast(kind === "transfer" ? "Transferred between locations" : "Stock updated & posted to the ledger"); renderOnHand();
    };
  }
  var INVACC = null;
  async function invAccounts() {
    if (INVACC && INVACC.company === S.company.id) return INVACC;
    var accs = (await sb.from("accounts").select("id,code").eq("company_id", S.company.id).in("code", ["3100", "4700", "6000", "6500"])).data || [];
    var by = {}; accs.forEach(function (a) { by[a.code] = a.id; });
    var jr = (await sb.from("journals").select("id").eq("company_id", S.company.id).eq("code", "MISC").maybeSingle()).data;
    INVACC = { company: S.company.id, inv: by["3100"], susp: by["4700"], cogs: by["6000"], adj: by["6500"], journal: jr ? jr.id : null };
    return INVACC;
  }
  // Perpetual-inventory GL posting for a stock move (value = qty x product cost).
  //  receive: Dr 3100 Inventory / Cr 4700 Interim ; deliver: Dr 6000 COGS / Cr 3100
  //  adjust up: Dr 3100 / Cr 6500 ; adjust down: Dr 6500 / Cr 3100
  async function postStockValue(kind, product, qty, moveId) {
    var cost = Number(product.cost_price || 0), value = qty * cost;
    if (value <= 0) return;
    var a = await invAccounts();
    if (!a.journal || !a.inv) return;
    var dr, cr, sQ = qty, sV = value;
    if (kind === "receive") { dr = a.inv; cr = a.susp; }
    else if (kind === "deliver") { dr = a.cogs; cr = a.inv; sQ = -qty; sV = -value; }
    else if (kind === "adjust_up") { dr = a.inv; cr = a.adj; }
    else { dr = a.adj; cr = a.inv; sQ = -qty; sV = -value; }
    if (!dr || !cr) return;
    var e = await sb.from("journal_entries").insert({ company_id: S.company.id, journal_id: a.journal, date: today(), ref: "", narration: "Stock: " + (product.name || ""), currency_code: S.company.currency_code, state: "draft", source_type: "stock", source_id: moveId ? String(moveId) : "" }).select("id").single();
    if (e.error) { toast("Stock saved; GL entry failed: " + e.error.message); return; }
    var eid = e.data.id;
    var lr = await sb.from("journal_lines").insert([{ entry_id: eid, company_id: S.company.id, account_id: dr, label: product.name || "", debit: value, credit: 0 }, { entry_id: eid, company_id: S.company.id, account_id: cr, label: product.name || "", debit: 0, credit: value }]);
    if (lr.error) { toast("Stock saved; GL lines failed: " + lr.error.message); return; }
    var pr = await sb.rpc("post_entry", { p_entry: eid });
    if (pr.error) { toast("Stock saved; GL post failed: " + pr.error.message); return; }
    await sb.from("stock_valuation_layers").insert({ company_id: S.company.id, product_id: product.id, move_id: moveId || null, quantity: sQ, unit_cost: cost, value: sV, journal_entry_id: eid });
  }
  function cfgStockMoves() {
    return {
      title: "Stock Moves", pageSize: 80,
      fetch: function () {
        return Promise.all([
          sb.from("stock_moves").select("*, products(name)").eq("company_id", S.company.id).order("date", { ascending: false }),
          sb.from("stock_locations").select("id,name,usage").eq("company_id", S.company.id)
        ]).then(function (res) {
          var locMap = {}; (res[1].data || []).forEach(function (l) { locMap[l.id] = l; });
          return (res[0].data || []).map(function (m) { m._src = locMap[m.location_id]; m._dest = locMap[m.location_dest_id]; return m; });
        });
      },
      searchText: function (m) { return (m.products ? m.products.name : "") + " " + (m._src ? m._src.name : "") + " " + (m._dest ? m._dest.name : ""); },
      columns: [
        { label: "Date", get: function (m) { return '<span class="muted">' + esc((m.date || "").slice(0, 10)) + '</span>'; } },
        { label: "Product", get: function (m) { return '<b>' + esc(m.products ? m.products.name : "") + '</b>'; } },
        { label: "From", get: function (m) { return '<span class="muted">' + esc(m._src ? m._src.name : "") + '</span>'; } },
        { label: "To", get: function (m) { return '<span class="muted">' + esc(m._dest ? m._dest.name : "") + '</span>'; } },
        { label: "Quantity", num: true, get: function (m) { return Number(m.quantity); } }
      ],
      filters: [
        { label: "Receipts", test: function (m) { return m._dest && m._dest.usage === "internal" && (!m._src || m._src.usage !== "internal"); } },
        { label: "Deliveries", test: function (m) { return m._src && m._src.usage === "internal" && (!m._dest || m._dest.usage !== "internal"); } },
        { label: "Internal", test: function (m) { return m._src && m._src.usage === "internal" && m._dest && m._dest.usage === "internal"; } }
      ],
      groupBy: [
        { label: "Type", get: function (m) { var s = m._src ? m._src.usage : "", d = m._dest ? m._dest.usage : ""; if (d === "internal" && s !== "internal") return "Receipt"; if (s === "internal" && d !== "internal") return "Delivery"; if (s === "internal" && d === "internal") return "Internal transfer"; return "Other"; } },
        { label: "Product", get: function (m) { return m.products ? m.products.name : "None"; } },
        { label: "Month", get: function (m) { return (m.date || "").slice(0, 7); } }
      ]
    };
  }
  function cfgWarehouses() {
    return {
      title: "Warehouses", pageSize: 50,
      fetch: function () { return sb.from("warehouses").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (w) { return (w.name || "") + " " + (w.code || ""); },
      columns: [
        { label: "Name", get: function (w) { return '<b>' + esc(w.name) + '</b>'; } },
        { label: "Code", get: function (w) { return '<span class="muted">' + esc(w.code || "") + '</span>'; } }
      ],
      onNew: function () { openWarehouseModal(); }
    };
  }
  function openWarehouseModal() {
    var m = document.createElement("div"); m.className = "modal on"; m.id = "whmodal";
    m.innerHTML = '<div class="sheet"><h3>New warehouse</h3><div class="form">' +
      '<div class="row2"><div><label>Name</label>' + fhint("Name", "A name for this storage location, e.g. Main Warehouse or Beirut Depot.") + '<input id="w-name" placeholder="Main Warehouse"></div><div><label>Code</label>' + fhint("Code", "A short code for the warehouse, e.g. WH or BEY.") + '<input id="w-code" placeholder="WH"></div></div>' +
      '</div><div class="foot"><button class="btn" id="w-cancel">Cancel</button><button class="btn pri" id="w-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("w-cancel").onclick = function () { m.remove(); };
    document.getElementById("w-save").onclick = async function () {
      var name = document.getElementById("w-name").value.trim(); if (!name) { toast("Name required"); return; }
      var r = await sb.from("warehouses").insert({ company_id: S.company.id, name: name, code: document.getElementById("w-code").value.trim() });
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      INV = null; m.remove(); toast("Warehouse added"); renderView();
    };
  }
  function cfgLocations() {
    return {
      title: "Locations", pageSize: 100,
      fetch: function () {
        return Promise.all([
          sb.from("stock_locations").select("*").eq("company_id", S.company.id).order("name"),
          sb.from("warehouses").select("id,name").eq("company_id", S.company.id)
        ]).then(function (res) { var wm = {}; (res[1].data || []).forEach(function (w) { wm[w.id] = w.name; }); return (res[0].data || []).map(function (l) { l._wh = wm[l.warehouse_id]; return l; }); });
      },
      searchText: function (l) { return (l.name || "") + " " + (l.usage || ""); },
      columns: [
        { label: "Name", get: function (l) { return '<b>' + esc(l.name) + '</b>'; } },
        { label: "Warehouse", get: function (l) { return '<span class="muted">' + esc(l._wh || "") + '</span>'; } },
        { label: "Usage", get: function (l) { return '<span class="badge">' + esc(l.usage) + '</span>'; } }
      ],
      groupBy: [{ label: "Usage", get: function (l) { return l.usage; } }, { label: "Warehouse", get: function (l) { return l._wh || "None"; } }],
      onNew: function () { openLocationModal(); }
    };
  }
  async function openLocationModal() {
    var whs = (await sb.from("warehouses").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    if (!whs.length) { toast("Create a warehouse first (Configuration > Warehouses)"); return; }
    var m = document.createElement("div"); m.className = "modal on"; m.id = "locmodal";
    var whOpts = whs.map(function (w) { return '<option value="' + w.id + '">' + esc(w.name) + '</option>'; }).join("");
    m.innerHTML = '<div class="sheet"><h3>New stock location</h3><div class="form">' +
      '<div><label>Name</label>' + fhint("__lname", "A name for this internal storage spot, e.g. Aisle A, Cold Room, or Site Store.") + '<input id="l-name" placeholder="e.g. Aisle A"></div>' +
      '<div><label>Warehouse</label>' + fhint("__lwh", "The warehouse this location sits in.") + '<select id="l-wh">' + whOpts + '</select></div>' +
      '</div><div class="foot"><button class="btn" id="l-cancel">Cancel</button><button class="btn pri" id="l-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("l-cancel").onclick = function () { m.remove(); };
    document.getElementById("l-save").onclick = async function () {
      var name = document.getElementById("l-name").value.trim(); if (!name) { toast("Name required"); return; }
      var r = await sb.from("stock_locations").insert({ company_id: S.company.id, warehouse_id: document.getElementById("l-wh").value, name: name, usage: "internal" });
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      INV = null; m.remove(); toast("Location added"); renderView();
    };
  }
  async function renderReorder() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Replenishment") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    await ensureInventory();
    var oh = await onHandMap();
    var prods = (await sb.from("products").select("id,name,default_code,type,cost_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var storable = prods.filter(function (p) { return p.type === "storable" || p.type === "consumable"; });
    var rules = (await sb.from("reordering_rules").select("*").eq("company_id", S.company.id)).data || [];
    var ruleMap = {}; rules.forEach(function (r) { if (!r.location_id) ruleMap[r.product_id] = r; });
    var body = document.getElementById("o-body");
    if (!storable.length) { body.innerHTML = '<div class="o-empty">No storable products yet. Set a product\'s type to <b>Storable</b> to plan replenishment.</div>'; return; }
    var inStyle = 'style="width:74px;padding:5px 7px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--ink);text-align:right;font:inherit;font-size:13px"';
    var rows = storable.map(function (p) {
      var r = ruleMap[p.id] || {}, min = Number(r.min_qty || 0), max = Number(r.max_qty || 0), q = oh[p.id] || 0;
      var need = (min > 0 && q < min) ? Math.max(max, min) - q : 0;
      var status = need > 0 ? '<span class="badge unpaid">Below min</span>' : (min > 0 ? '<span class="badge paid">OK</span>' : '<span class="muted">no rule</span>');
      return "<tr><td class='num' style='text-align:left'>" + esc(p.default_code || "") + "</td><td><b>" + esc(p.name) + "</b></td><td class='num'>" + q + "</td>" +
        "<td><input class='rr-min' data-id='" + p.id + "' value='" + min + "' " + inStyle + "></td>" +
        "<td><input class='rr-max' data-id='" + p.id + "' value='" + max + "' " + inStyle + "></td>" +
        "<td class='num'>" + (need > 0 ? need : "") + "</td><td>" + status + "</td>" +
        "<td>" + (need > 0 ? "<button class='btn sm rr-order' data-id='" + p.id + "' data-need='" + need + "'>Receive " + need + "</button>" : "") + "</td></tr>";
    }).join("");
    body.innerHTML = '<div style="padding:16px"><div class="card"><h3>Reordering rules &amp; low stock <span class="muted" style="font-weight:500;font-size:12px">set a Min and Max per product &middot; on-hand below Min flags a reorder up to Max</span></h3>' +
      '<table><thead><tr><th>Reference</th><th>Product</th><th class="num">On Hand</th><th>Min</th><th>Max</th><th class="num">To Order</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    function saveRule(pid) {
      var min = parseFloat(document.querySelector('.rr-min[data-id="' + pid + '"]').value) || 0;
      var max = parseFloat(document.querySelector('.rr-max[data-id="' + pid + '"]').value) || 0;
      var existing = ruleMap[pid];
      if (existing) return sb.from("reordering_rules").update({ min_qty: min, max_qty: max }).eq("id", existing.id);
      return sb.from("reordering_rules").insert({ company_id: S.company.id, product_id: pid, min_qty: min, max_qty: max });
    }
    body.querySelectorAll(".rr-min, .rr-max").forEach(function (inp) { inp.addEventListener("change", function () { saveRule(inp.dataset.id).then(function () { toast("Rule saved"); renderReorder(); }); }); });
    body.querySelectorAll(".rr-order").forEach(function (b) { b.onclick = function () { openStockModal("receive", storable); setTimeout(function () { var ps = document.getElementById("k-prod"); if (ps) ps.value = b.dataset.id; var qi = document.getElementById("k-qty"); if (qi) qi.value = b.dataset.need; }, 200); }; });
  }
  async function findOrCreateLot(productId, name, expiry) {
    var ex = (await sb.from("stock_lots").select("id").eq("company_id", S.company.id).eq("product_id", productId).eq("name", name).maybeSingle()).data;
    if (ex) return ex.id;
    var r = await sb.from("stock_lots").insert({ company_id: S.company.id, product_id: productId, name: name, expiry_date: expiry || null }).select("id").single();
    return r.data ? r.data.id : null;
  }
  async function lotOnHand() {
    var locs = (await sb.from("stock_locations").select("id,usage").eq("company_id", S.company.id)).data || [];
    var internal = {}; locs.forEach(function (l) { if (l.usage === "internal") internal[l.id] = 1; });
    var lines = (await sb.from("stock_move_lines").select("lot_id,quantity, stock_moves(location_id,location_dest_id)").eq("company_id", S.company.id)).data || [];
    var by = {};
    lines.forEach(function (l) { var mv = l.stock_moves; if (!mv || !l.lot_id) return; var q = Number(l.quantity) || 0; if (internal[mv.location_dest_id]) by[l.lot_id] = (by[l.lot_id] || 0) + q; if (internal[mv.location_id]) by[l.lot_id] = (by[l.lot_id] || 0) - q; });
    return by;
  }
  async function renderLots() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Lots / Serials") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var lots = (await sb.from("stock_lots").select("*, products(name)").eq("company_id", S.company.id).order("name")).data || [];
    var oh = await lotOnHand();
    var body = document.getElementById("o-body");
    if (!lots.length) { body.innerHTML = '<div class="o-empty">No lots or serial numbers yet. Add a <b>Lot / Serial</b> when you Receive stock and it will appear here with its on-hand and expiry.</div>'; return; }
    var todayS = today(), soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    var rows = lots.map(function (l) {
      var q = oh[l.id] || 0, exp = l.expiry_date || "";
      var st = exp ? (exp < todayS ? '<span class="badge unpaid">Expired</span>' : (exp <= soon ? '<span class="badge partial">Expiring soon</span>' : '<span class="badge paid">OK</span>')) : '<span class="muted">-</span>';
      return "<tr><td><b>" + esc(l.name) + "</b></td><td>" + esc(l.products ? l.products.name : "") + "</td><td class='num'>" + q + "</td><td class='muted'>" + esc(exp || "-") + "</td><td>" + st + "</td></tr>";
    }).join("");
    body.innerHTML = '<table class="o-list"><thead><tr><th>Lot / Serial</th><th>Product</th><th class="num">On Hand</th><th>Expiry</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // ============================ PROJECTS & TIMESHEETS ============================
  var BILLING = { none: "Non-billable", fixed: "Fixed price", tm: "Time & material", milestone: "Milestones" };
  function cfgProjects() {
    return {
      title: "Projects", pageSize: 80,
      fetch: function () {
        return Promise.all([
          sb.from("projects").select("*, partners(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }),
          sb.from("timesheets").select("project_id,hours").eq("company_id", S.company.id)
        ]).then(function (res) { var h = {}; (res[1].data || []).forEach(function (t) { h[t.project_id] = (h[t.project_id] || 0) + Number(t.hours || 0); }); return (res[0].data || []).map(function (p) { p._hours = h[p.id] || 0; return p; }); });
      },
      searchText: function (p) { return (p.name || "") + " " + (p.partners ? p.partners.name : ""); },
      columns: [
        { label: "Project", get: function (p) { return '<b>' + esc(p.name) + '</b>'; } },
        { label: "Customer", get: function (p) { return esc(p.partners ? p.partners.name : ""); } },
        { label: "Deadline", get: function (p) { return '<span class="muted">' + esc(p.date_deadline || "") + '</span>'; } },
        { label: "Billing", get: function (p) { return '<span class="muted">' + esc(BILLING[p.billing_type] || p.billing_type) + '</span>'; } },
        { label: "Hours", num: true, get: function (p) { return Number(p._hours).toFixed(2); } },
        { label: "Status", get: function (p) { return p.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge unpaid">Closed</span>'; } }
      ],
      filters: [{ label: "Active", test: function (p) { return p.is_active; } }, { label: "Closed", test: function (p) { return !p.is_active; } }],
      groupBy: [{ label: "Customer", get: function (p) { return p.partners ? p.partners.name : "None"; } }, { label: "Billing", get: function (p) { return BILLING[p.billing_type] || p.billing_type; } }],
      kanbanCard: function (p) { return '<div class="t">' + esc(p.name) + '</div><div class="muted">' + esc(p.partners ? p.partners.name : "") + '</div><div class="r"><span>' + esc(p.date_deadline || "") + '</span><b>' + Number(p._hours).toFixed(1) + ' h</b></div>'; },
      onOpen: function (p) { renderProjectForm(p.id); },
      onNew: function () { renderProjectForm("new"); }
    };
  }
  async function renderProjectForm(id) {
    var parent = { action: "proj.list", title: "Projects" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var p = id === "new" ? { is_active: true, billing_type: "none" } : (await sb.from("projects").select("*, partners(name)").eq("id", id).maybeSingle()).data || {};
    var customers = (await sb.from("partners").select("id,name").eq("is_customer", true).order("name")).data || [];
    var tasks = id === "new" ? [] : (await sb.from("project_tasks").select("*").eq("project_id", id).order("created_at")).data || [];
    var ts = id === "new" ? [] : (await sb.from("timesheets").select("id,hours,task_id,is_invoiced").eq("project_id", id)).data || [];
    var hoursByTask = {}, totalHours = 0, unbilledHours = 0, unbilledIds = []; ts.forEach(function (t) { hoursByTask[t.task_id] = (hoursByTask[t.task_id] || 0) + Number(t.hours || 0); totalHours += Number(t.hours || 0); if (!t.is_invoiced) { unbilledHours += Number(t.hours || 0); unbilledIds.push(t.id); } });
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (p.name || "");
    var smart = id !== "new" ? '<div class="o-smart"><button class="sb"><span class="v">' + totalHours.toFixed(1) + '</span><span class="k">Hours logged</span></button><button class="sb"><span class="v">' + tasks.length + '</span><span class="k">Tasks</span></button></div>' : "";
    var custOpts = '<option value="">(none)</option>' + customers.map(function (c) { return '<option value="' + c.id + '"' + (p.partner_id === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>'; }).join("");
    var billOpts = Object.keys(BILLING).map(function (k) { return '<option value="' + k + '"' + (p.billing_type === k ? " selected" : "") + '>' + BILLING[k] + '</option>'; }).join("");
    var tasksTab = tasks.length ? '<table class="o-lines"><thead><tr><th>Task</th><th style="text-align:right">Planned h</th><th style="text-align:right">Logged h</th><th>Deadline</th></tr></thead><tbody>' + tasks.map(function (t) { return '<tr><td>' + esc(t.name) + '</td><td class="num">' + Number(t.planned_hours || 0) + '</td><td class="num">' + (hoursByTask[t.id] || 0).toFixed(1) + '</td><td class="muted">' + esc(t.date_deadline || "") + '</td></tr>'; }).join("") + '</tbody></table>' : '<div class="muted" style="padding:8px 0">No tasks yet. Add them in the Tasks screen.</div>';
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pf-save">Save</button><button id="pf-discard">Discard</button>' + (id !== "new" ? '<button id="pf-time">Log time</button>' : '') + (unbilledHours > 0.001 ? '<button id="pf-bill">Bill ' + unbilledHours.toFixed(1) + 'h</button>' : '') + '</div><div></div></div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title"><input id="pf-name" value="' + esc(p.name || "") + '" placeholder="Project name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Customer", '<select id="pf-cust">' + custOpts + '</select>', "The client this project is delivered for.") +
      fld("Billing", '<select id="pf-bill">' + billOpts + '</select>', "How the project is billed: non-billable, fixed price, time & material, or milestones.") +
      '</div><div>' +
      fld("Start date", '<input id="pf-start" type="date" value="' + (p.date_start || "") + '">', "When work on the project begins.") +
      fld("Deadline", '<input id="pf-deadline" type="date" value="' + (p.date_deadline || "") + '">', "Target completion date.") +
      fld("Status", '<select id="pf-active"><option value="1"' + (p.is_active ? " selected" : "") + '>Active</option><option value="0"' + (!p.is_active ? " selected" : "") + '>Closed</option></select>', "Active projects accept time entries; closed ones are archived.") +
      '</div></div>' +
      (id !== "new" ? '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Tasks</div></div><div class="o-nb-pg">' + tasksTab + '</div></div>' : "") +
      '</div>';
    document.getElementById("pf-discard").onclick = function () { go("proj.list"); };
    document.getElementById("pf-save").onclick = async function () {
      var name = gv("pf-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, partner_id: document.getElementById("pf-cust").value || null, billing_type: document.getElementById("pf-bill").value, date_start: gv("pf-start") || null, date_deadline: gv("pf-deadline") || null, is_active: document.getElementById("pf-active").value === "1" };
      var r; if (id === "new") { row.company_id = S.company.id; r = await sb.from("projects").insert(row); } else r = await sb.from("projects").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("proj.list");
    };
    if (id !== "new") document.getElementById("pf-time").onclick = function () { openTimesheetModal(p.id, function () { renderProjectForm(p.id); }); };
    if (unbilledHours > 0.001) document.getElementById("pf-bill").onclick = function () { openBillModal(p, unbilledHours, unbilledIds); };
  }
  async function openBillModal(project, hours, tsIds) {
    if (!project.partner_id) { toast("Set a Customer on the project first, then Save."); return; }
    var m = document.createElement("div"); m.className = "modal on"; m.id = "billmodal";
    m.innerHTML = '<div class="sheet"><h3>Bill time &middot; ' + esc(project.name) + '</h3><div class="form">' +
      '<div class="row2"><div><label>Unbilled hours</label>' + fhint("__bhrs", "Total logged time not yet invoiced on this project.") + '<input value="' + hours.toFixed(2) + '" readonly></div><div><label>Rate / hour (' + esc(S.company.currency_code) + ')</label>' + fhint("__brate", "Your billing rate. Hours x rate becomes the invoice amount.") + '<input id="b-rate" type="number" step="0.01" value="0"></div></div>' +
      '<div><label>Invoice line description</label>' + fhint("__bdesc", "The text your customer sees on the invoice line.") + '<input id="b-desc" value="Professional services - ' + esc(project.name) + '"></div>' +
      '<div class="muted" style="font-size:12.5px" id="b-total">Invoice total: ' + S.company.currency_code + ' 0.00</div>' +
      '</div><div class="foot"><button class="btn" id="b-cancel">Cancel</button><button class="btn pri" id="b-save" style="background:var(--app);border-color:var(--app)">Create draft invoice</button></div></div>';
    document.body.appendChild(m);
    function upd() { var rate = parseFloat(document.getElementById("b-rate").value) || 0; document.getElementById("b-total").textContent = "Invoice total: " + S.company.currency_code + " " + money(hours * rate); }
    document.getElementById("b-rate").addEventListener("input", upd);
    document.getElementById("b-cancel").onclick = function () { m.remove(); };
    document.getElementById("b-save").onclick = async function () {
      var rate = parseFloat(document.getElementById("b-rate").value) || 0;
      if (!(rate > 0)) { toast("Enter a rate per hour"); return; }
      var untax = hours * rate;
      var hdr = { company_id: S.company.id, move_type: "out_invoice", partner_id: project.partner_id, project_id: project.id, number: await nextNumber("out_invoice"), invoice_date: today(), due_date: new Date(Date.now() + 2592e6).toISOString().slice(0, 10), currency_code: S.company.currency_code, state: "draft", amount_untaxed: untax, amount_total: untax, amount_residual: untax };
      var ins = await sb.from("invoices").insert(hdr).select("id").single();
      if (ins.error) { toast("Could not create: " + ins.error.message); return; }
      var invId = ins.data.id;
      var lr = await sb.from("invoice_lines").insert({ company_id: S.company.id, invoice_id: invId, sequence: 10, name: document.getElementById("b-desc").value.trim() || project.name, quantity: hours, unit_price: rate, price_subtotal: untax });
      if (lr.error) { toast("Invoice line failed: " + lr.error.message); return; }
      await sb.from("timesheets").update({ is_invoiced: true }).in("id", tsIds);
      m.remove(); toast("Draft invoice created from " + hours.toFixed(1) + " h"); renderInvoiceForm(invId, "out_invoice");
    };
  }
  function cfgTasks() {
    return {
      title: "Tasks", pageSize: 100,
      fetch: function () {
        return Promise.all([
          sb.from("project_tasks").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }),
          sb.from("timesheets").select("task_id,hours").eq("company_id", S.company.id)
        ]).then(function (res) { var h = {}; (res[1].data || []).forEach(function (t) { h[t.task_id] = (h[t.task_id] || 0) + Number(t.hours || 0); }); return (res[0].data || []).map(function (t) { t._hours = h[t.id] || 0; return t; }); });
      },
      searchText: function (t) { return (t.name || "") + " " + (t.projects ? t.projects.name : ""); },
      columns: [
        { label: "Task", get: function (t) { return '<b>' + esc(t.name) + '</b>'; } },
        { label: "Project", get: function (t) { return esc(t.projects ? t.projects.name : ""); } },
        { label: "Planned h", num: true, get: function (t) { return Number(t.planned_hours || 0); } },
        { label: "Logged h", num: true, get: function (t) { return Number(t._hours).toFixed(2); } },
        { label: "Deadline", get: function (t) { return '<span class="muted">' + esc(t.date_deadline || "") + '</span>'; } }
      ],
      filters: [{ label: "Overdue", test: function (t) { return t.date_deadline && t.date_deadline < today(); } }, { label: "No deadline", test: function (t) { return !t.date_deadline; } }],
      groupBy: [{ label: "Project", get: function (t) { return t.projects ? t.projects.name : "None"; } }],
      kanbanCard: function (t) { return '<div class="t">' + esc(t.name) + '</div><div class="muted">' + esc(t.projects ? t.projects.name : "") + '</div><div class="r"><span>' + esc(t.date_deadline || "") + '</span><b>' + Number(t._hours).toFixed(1) + ' / ' + Number(t.planned_hours || 0) + ' h</b></div>'; },
      onOpen: function (t) { renderTaskForm(t.id); },
      onNew: function () { renderTaskForm("new"); }
    };
  }
  async function renderTaskForm(id) {
    var parent = { action: "task.list", title: "Tasks" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var t = id === "new" ? {} : (await sb.from("project_tasks").select("*").eq("id", id).maybeSingle()).data || {};
    var projects = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (t.name || "");
    var projOpts = projects.map(function (pr) { return '<option value="' + pr.id + '"' + (t.project_id === pr.id ? " selected" : "") + '>' + esc(pr.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="tf-save">Save</button><button id="tf-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="tf-name" value="' + esc(t.name || "") + '" placeholder="Task name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Project", '<select id="tf-proj">' + projOpts + '</select>', "The project this task belongs to.") +
      fld("Planned hours", '<input id="tf-planned" type="number" step="0.25" value="' + (t.planned_hours || 0) + '">', "Estimated hours to finish this task, for planning vs actual.") +
      '</div><div>' +
      fld("Deadline", '<input id="tf-deadline" type="date" value="' + (t.date_deadline || "") + '">', "When this task is due.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Description</div></div><div class="o-nb-pg"><textarea id="tf-desc" rows="4" style="width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);color:var(--ink);font:inherit;resize:vertical" placeholder="What needs to be done...">' + esc(t.description || "") + '</textarea></div></div>' +
      '</div>';
    document.getElementById("tf-discard").onclick = function () { go("task.list"); };
    document.getElementById("tf-save").onclick = async function () {
      var name = gv("tf-name"); if (!name) { toast("Name required"); return; }
      if (!document.getElementById("tf-proj").value) { toast("Pick a project"); return; }
      var row = { name: name, project_id: document.getElementById("tf-proj").value, planned_hours: parseFloat(gv("tf-planned")) || 0, date_deadline: gv("tf-deadline") || null, description: document.getElementById("tf-desc").value };
      var r; if (id === "new") { row.company_id = S.company.id; r = await sb.from("project_tasks").insert(row); } else r = await sb.from("project_tasks").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("task.list");
    };
  }
  function cfgTimesheets() {
    return {
      title: "Timesheets", pageSize: 100,
      fetch: function () { return sb.from("timesheets").select("*, projects(name), project_tasks(name)").eq("company_id", S.company.id).order("work_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (t) { return (t.name || "") + " " + (t.projects ? t.projects.name : ""); },
      columns: [
        { label: "Date", get: function (t) { return '<span class="muted">' + esc(t.work_date || "") + '</span>'; } },
        { label: "Project", get: function (t) { return '<b>' + esc(t.projects ? t.projects.name : "") + '</b>'; } },
        { label: "Task", get: function (t) { return esc(t.project_tasks ? t.project_tasks.name : ""); } },
        { label: "Description", get: function (t) { return '<span class="muted">' + esc(t.name || "") + '</span>'; } },
        { label: "Hours", num: true, get: function (t) { return Number(t.hours || 0).toFixed(2); } }
      ],
      filters: [{ label: "To invoice", test: function (t) { return !t.is_invoiced; } }, { label: "Invoiced", test: function (t) { return !!t.is_invoiced; } }],
      groupBy: [{ label: "Project", get: function (t) { return t.projects ? t.projects.name : "None"; } }, { label: "Month", get: function (t) { return (t.work_date || "").slice(0, 7); } }],
      onNew: function () { openTimesheetModal(); }
    };
  }
  async function openTimesheetModal(projectId, onDone) {
    var projects = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    if (!projects.length) { toast("Create a project first"); return; }
    var tasks = (await sb.from("project_tasks").select("id,name,project_id").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on"; m.id = "tsmodal";
    var pj = projectId || projects[0].id;
    var projOpts = projects.map(function (p) { return '<option value="' + p.id + '"' + (p.id === pj ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    function taskOptsFor(pid) { return '<option value="">(none)</option>' + tasks.filter(function (t) { return t.project_id === pid; }).map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join(""); }
    m.innerHTML = '<div class="sheet"><h3>Log time</h3><div class="form">' +
      '<div class="row2"><div><label>Date</label>' + fhint("__tsdate", "The day the work was done.") + '<input id="ts-date" type="date" value="' + today() + '"></div><div><label>Hours</label>' + fhint("__tshours", "How many hours you spent.") + '<input id="ts-hours" type="number" step="0.25" value="1"></div></div>' +
      '<div><label>Project</label>' + fhint("__tsproj", "The project this time is charged to.") + '<select id="ts-proj">' + projOpts + '</select></div>' +
      '<div><label>Task (optional)</label>' + fhint("__tstask", "The specific task within the project, if any.") + '<select id="ts-task">' + taskOptsFor(pj) + '</select></div>' +
      '<div><label>Description</label>' + fhint("__tsdesc", "A short note on what you worked on.") + '<input id="ts-desc" placeholder="e.g. Site survey, shop drawings..."></div>' +
      '</div><div class="foot"><button class="btn" id="ts-cancel">Cancel</button><button class="btn pri" id="ts-save" style="background:var(--app);border-color:var(--app)">Log</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ts-proj").onchange = function () { document.getElementById("ts-task").innerHTML = taskOptsFor(this.value); };
    document.getElementById("ts-cancel").onclick = function () { m.remove(); };
    document.getElementById("ts-save").onclick = async function () {
      var hours = parseFloat(document.getElementById("ts-hours").value); if (!(hours > 0)) { toast("Enter the hours worked"); return; }
      var row = { company_id: S.company.id, project_id: document.getElementById("ts-proj").value, task_id: document.getElementById("ts-task").value || null, work_date: document.getElementById("ts-date").value, hours: hours, name: document.getElementById("ts-desc").value.trim() };
      var r = await sb.from("timesheets").insert(row);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Time logged"); if (onDone) onDone(); else renderView();
    };
  }

  // ============================ CRM ============================
  async function ensureCrmStages() {
    var st = (await sb.from("crm_stages").select("id,name,sequence,is_won").eq("company_id", S.company.id).order("sequence")).data || [];
    if (!st.length) {
      var defs = [["New", 10, false], ["Qualified", 20, false], ["Proposition", 30, false], ["Won", 40, true]];
      for (var i = 0; i < defs.length; i++) { var r = await sb.from("crm_stages").insert({ company_id: S.company.id, name: defs[i][0], sequence: defs[i][1], is_won: defs[i][2] }).select("id,name,sequence,is_won").single(); if (r.data) st.push(r.data); }
    }
    return st;
  }
  async function renderPipeline() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Pipeline") + '<button class="o-new" id="crm-new">New</button></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    document.getElementById("crm-new").onclick = function () { renderLeadForm("new"); };
    var stages = await ensureCrmStages();
    var leads = (await sb.from("crm_leads").select("*, partners(name)").eq("company_id", S.company.id).eq("is_active", true).order("created_at", { ascending: false })).data || [];
    var byStage = {}; leads.forEach(function (l) { (byStage[l.stage_id] = byStage[l.stage_id] || []).push(l); });
    var cols = stages.map(function (s) {
      var ls = byStage[s.id] || [], amt = ls.reduce(function (a, l) { return a + Number(l.expected_revenue || 0); }, 0);
      var cards = ls.map(function (l) { return '<div class="o-lead" data-id="' + l.id + '"><div class="t">' + esc(l.name) + '</div><div class="m">' + esc(l.partners ? l.partners.name : (l.contact_name || "")) + '</div><div class="rev">' + S.company.currency_code + ' ' + money(l.expected_revenue) + ' &middot; ' + Number(l.probability || 0) + '%</div></div>'; }).join("");
      return '<div class="o-pcol"><div class="hd"><span>' + esc(s.name) + '</span><span class="amt">' + ls.length + ' &middot; ' + S.company.currency_code + ' ' + money(amt) + '</span></div><div class="cards">' + (cards || '<div class="muted" style="font-size:12px;padding:6px">Empty</div>') + '</div></div>';
    }).join("");
    document.getElementById("o-body").innerHTML = '<div class="o-pipe">' + cols + '</div>';
    document.querySelectorAll(".o-lead[data-id]").forEach(function (el) { el.onclick = function () { renderLeadForm(el.dataset.id); }; });
  }
  function cfgLeads() {
    return {
      title: "Leads", pageSize: 80,
      fetch: function () { return Promise.all([sb.from("crm_leads").select("*, partners(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }), sb.from("crm_stages").select("id,name").eq("company_id", S.company.id)]).then(function (res) { var sm = {}; (res[1].data || []).forEach(function (s) { sm[s.id] = s.name; }); return (res[0].data || []).map(function (l) { l._stage = sm[l.stage_id]; return l; }); }); },
      searchText: function (l) { return (l.name || "") + " " + (l.contact_name || "") + " " + (l.partners ? l.partners.name : ""); },
      columns: [
        { label: "Opportunity", get: function (l) { return '<b>' + esc(l.name) + '</b>'; } },
        { label: "Customer", get: function (l) { return esc(l.partners ? l.partners.name : (l.contact_name || "")); } },
        { label: "Stage", get: function (l) { return '<span class="badge">' + esc(l._stage || "") + '</span>'; } },
        { label: "Expected", num: true, get: function (l) { return money(l.expected_revenue); } },
        { label: "Prob.", num: true, get: function (l) { return Number(l.probability || 0) + "%"; } }
      ],
      filters: [{ label: "Open", test: function (l) { return l.is_active !== false; } }, { label: "Lost", test: function (l) { return l.is_active === false; } }],
      groupBy: [{ label: "Stage", get: function (l) { return l._stage || "None"; } }],
      onOpen: function (l) { renderLeadForm(l.id); },
      onNew: function () { renderLeadForm("new"); }
    };
  }
  async function renderLeadForm(id) {
    var parent = { action: "crm.pipe", title: "Pipeline" };
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var l = id === "new" ? { probability: 10 } : (await sb.from("crm_leads").select("*, partners(name)").eq("id", id).maybeSingle()).data || {};
    var stages = await ensureCrmStages();
    var customers = (await sb.from("partners").select("id,name").eq("is_customer", true).order("name")).data || [];
    if (id === "new" && !l.stage_id && stages[0]) l.stage_id = stages[0].id;
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (l.name || "");
    var stageBar = '<div class="o-stages">' + stages.map(function (s) { return '<span class="st ' + (l.stage_id === s.id ? "on" : "") + '" data-stage="' + s.id + '">' + esc(s.name) + '</span>'; }).join("") + '</div>';
    var custOpts = '<option value="">(none yet)</option>' + customers.map(function (c) { return '<option value="' + c.id + '"' + (l.partner_id === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>'; }).join("");
    var btns = '<button class="pri" id="ld-save">Save</button><button id="ld-discard">Discard</button>';
    if (id !== "new" && !l.partner_id) btns += '<button id="ld-tocust">Create Customer</button>';
    if (id !== "new") btns += '<button id="ld-quote">Create Quotation</button>';
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stageBar + '</div>' +
      '<div class="o-sheet"><div class="o-title"><input id="ld-name" value="' + esc(l.name || "") + '" placeholder="Opportunity name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Customer", '<select id="ld-cust">' + custOpts + '</select>', "Link to an existing customer, or fill the contact fields and convert later.") +
      fld("Contact name", '<input id="ld-contact" value="' + esc(l.contact_name || "") + '">', "The person's name, if not yet a saved customer.") +
      fld("Email", '<input id="ld-email" value="' + esc(l.email || "") + '">', "Contact email address.") +
      fld("Phone", '<input id="ld-phone" value="' + esc(l.phone || "") + '">', "Contact phone number.") +
      '</div><div>' +
      fld("Expected revenue", '<input id="ld-rev" type="number" step="0.01" value="' + (l.expected_revenue || 0) + '">', "Estimated deal value if won.") +
      fld("Probability", '<input id="ld-prob" type="number" step="1" value="' + (l.probability || 0) + '">', "Your confidence of winning, in percent.") +
      fld("Source", '<input id="ld-src" value="' + esc(l.source || "") + '">', "Where the lead came from, e.g. referral or website.") +
      '</div></div></div>';
    document.querySelectorAll(".o-stages .st[data-stage]").forEach(function (x) { x.onclick = async function () { l.stage_id = x.dataset.stage; document.querySelectorAll(".o-stages .st").forEach(function (y) { y.classList.toggle("on", y === x); }); if (id !== "new") { await sb.from("crm_leads").update({ stage_id: l.stage_id }).eq("id", id); toast("Stage updated"); } }; });
    document.getElementById("ld-discard").onclick = function () { go("crm.pipe"); };
    document.getElementById("ld-save").onclick = async function () {
      var name = gv("ld-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, partner_id: document.getElementById("ld-cust").value || null, contact_name: gv("ld-contact"), email: gv("ld-email"), phone: gv("ld-phone"), expected_revenue: parseFloat(gv("ld-rev")) || 0, probability: parseFloat(gv("ld-prob")) || 0, source: gv("ld-src"), stage_id: l.stage_id };
      var r; if (id === "new") { row.company_id = S.company.id; row.is_active = true; r = await sb.from("crm_leads").insert(row); } else r = await sb.from("crm_leads").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("crm.pipe");
    };
    var cb = document.getElementById("ld-tocust"); if (cb) cb.onclick = async function () {
      var cname = gv("ld-contact") || gv("ld-name");
      var pr = await sb.from("partners").insert({ org_id: S.company.org_id, name: cname, is_company: true, is_customer: true, email: gv("ld-email") || null, phone: gv("ld-phone") || null }).select("id").single();
      if (pr.error) { toast("Could not create: " + pr.error.message); return; }
      await sb.from("crm_leads").update({ partner_id: pr.data.id }).eq("id", id);
      toast("Customer created & linked"); renderLeadForm(id);
    };
    var qb = document.getElementById("ld-quote"); if (qb) qb.onclick = async function () {
      if (!l.partner_id) { toast("Link or create a customer first"); return; }
      var num = await nextOrderNumber("sale");
      var so = await sb.from("sale_orders").insert({ company_id: S.company.id, number: num, partner_id: l.partner_id, date_order: today(), state: "draft", currency_code: S.company.currency_code, amount_untaxed: 0, amount_total: 0, note: "From opportunity: " + l.name }).select("id").single();
      if (so.error) { toast("Could not create: " + so.error.message); return; }
      toast("Quotation created (draft)"); renderOrderForm(so.data.id, "sale");
    };
  }
  function cfgCrmStages() {
    return {
      title: "Pipeline Stages", pageSize: 50,
      fetch: function () { return sb.from("crm_stages").select("*").eq("company_id", S.company.id).order("sequence").then(function (r) { return r.data || []; }); },
      searchText: function (s) { return s.name || ""; },
      columns: [{ label: "Stage", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } }, { label: "Order", num: true, get: function (s) { return s.sequence; } }, { label: "Won stage", get: function (s) { return s.is_won ? '<span class="badge paid">Won</span>' : '<span class="muted">-</span>'; } }],
      onNew: function () { openStageModal(); }
    };
  }
  function openStageModal() {
    var m = document.createElement("div"); m.className = "modal on"; m.id = "stgmodal";
    m.innerHTML = '<div class="sheet"><h3>New pipeline stage</h3><div class="form">' +
      '<div><label>Name</label>' + fhint("__stgname", "The stage name, e.g. Qualified or Negotiation.") + '<input id="stg-name"></div>' +
      '<div class="row2"><div><label>Order</label>' + fhint("__stgseq", "Position in the pipeline (lower shows first).") + '<input id="stg-seq" type="number" value="50"></div><div><label>Won stage</label>' + fhint("__stgwon", "Reaching this stage means the deal is won.") + '<select id="stg-won"><option value="0">No</option><option value="1">Yes</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="stg-cancel">Cancel</button><button class="btn pri" id="stg-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("stg-cancel").onclick = function () { m.remove(); };
    document.getElementById("stg-save").onclick = async function () {
      var name = document.getElementById("stg-name").value.trim(); if (!name) { toast("Name required"); return; }
      var r = await sb.from("crm_stages").insert({ company_id: S.company.id, name: name, sequence: parseInt(document.getElementById("stg-seq").value) || 50, is_won: document.getElementById("stg-won").value === "1" });
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Stage added"); renderView();
    };
  }

  // ============================ EMPLOYEES / HR ============================
  function cfgEmployees() {
    return {
      title: "Employees", pageSize: 80,
      fetch: function () {
        return Promise.all([
          sb.from("hr_employees").select("*, hr_departments(name), hr_jobs(name)").eq("company_id", S.company.id).order("name"),
          sb.from("hr_employees").select("id,name").eq("company_id", S.company.id)
        ]).then(function (res) { var mm = {}; (res[1].data || []).forEach(function (e) { mm[e.id] = e.name; }); return (res[0].data || []).map(function (e) { e._mgr = e.manager_id ? mm[e.manager_id] : ""; return e; }); });
      },
      searchText: function (e) { return (e.name || "") + " " + (e.work_email || "") + " " + (e.hr_jobs ? e.hr_jobs.name : ""); },
      columns: [
        { label: "Name", get: function (e) { return '<b>' + esc(e.name) + '</b>'; } },
        { label: "Job Position", get: function (e) { return esc(e.hr_jobs ? e.hr_jobs.name : ""); } },
        { label: "Department", get: function (e) { return esc(e.hr_departments ? e.hr_departments.name : ""); } },
        { label: "Work Email", get: function (e) { return '<span class="muted">' + esc(e.work_email || "") + '</span>'; } },
        { label: "Manager", get: function (e) { return esc(e._mgr || ""); } },
        { label: "Status", get: function (e) { return e.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge">Archived</span>'; } }
      ],
      filters: [{ label: "Active", test: function (e) { return e.is_active; } }, { label: "Archived", test: function (e) { return !e.is_active; } }],
      groupBy: [{ label: "Department", get: function (e) { return e.hr_departments ? e.hr_departments.name : "None"; } }, { label: "Job Position", get: function (e) { return e.hr_jobs ? e.hr_jobs.name : "None"; } }],
      kanbanCard: function (e) { return '<div class="t">' + esc(e.name) + '</div><div class="muted">' + esc(e.hr_jobs ? e.hr_jobs.name : "") + '</div><div class="r"><span>' + esc(e.hr_departments ? e.hr_departments.name : "") + '</span><span>' + esc(e.work_email || "") + '</span></div>'; },
      onOpen: function (e) { renderEmployeeForm(e.id); },
      onNew: function () { renderEmployeeForm("new"); }
    };
  }
  async function renderEmployeeForm(id) {
    var parent = { action: "hr.emp", title: "Employees" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var e = id === "new" ? { is_active: true } : (await sb.from("hr_employees").select("*").eq("id", id).maybeSingle()).data || {};
    var depts = (await sb.from("hr_departments").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var jobs = (await sb.from("hr_jobs").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var leaveCount = id === "new" ? 0 : ((await sb.from("hr_leaves").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("employee_id", id)).count || 0);
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (e.name || "");
    function opts(list, cur, blank) { return (blank ? '<option value="">' + blank + '</option>' : "") + list.map(function (x) { return '<option value="' + x.id + '"' + (cur === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join(""); }
    var smart = id !== "new" ? '<div class="o-smart"><button class="sb" id="e-sm-lv"><span class="v">' + leaveCount + '</span><span class="k">Time Off</span></button></div>' : "";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="e-save">Save</button><button id="e-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title"><input id="e-name" value="' + esc(e.name || "") + '" placeholder="Employee name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Work Email", '<input id="e-email" value="' + esc(e.work_email || "") + '" placeholder="name@company.com">', "The employee's work email address.") +
      fld("Department", '<select id="e-dept">' + opts(depts, e.department_id, "None") + '</select>', "The department this employee belongs to.") +
      fld("Job Position", '<select id="e-job">' + opts(jobs, e.job_id, "None") + '</select>', "The employee's job title / position.") +
      '</div><div>' +
      fld("Manager", '<select id="e-mgr">' + opts(emps.filter(function (x) { return x.id !== id; }), e.manager_id, "None") + '</select>', "Who this employee reports to.") +
      fld("Status", '<select id="e-active"><option value="1"' + (e.is_active ? " selected" : "") + '>Active</option><option value="0"' + (!e.is_active ? " selected" : "") + '>Archived</option></select>', "Active employees appear in selections; archived ones are hidden.") +
      '</div></div></div>';
    document.getElementById("e-discard").onclick = function () { go("hr.emp"); };
    var _el = document.getElementById("e-sm-lv"); if (_el) _el.onclick = function () { go("hr.leaves"); };
    document.getElementById("e-save").onclick = async function () {
      var name = gv("e-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, work_email: gv("e-email"), department_id: document.getElementById("e-dept").value || null, job_id: document.getElementById("e-job").value || null, manager_id: document.getElementById("e-mgr").value || null, is_active: document.getElementById("e-active").value === "1" };
      var r; if (id === "new") { row.company_id = S.company.id; r = await sb.from("hr_employees").insert(row); } else r = await sb.from("hr_employees").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("hr.emp");
    };
  }
  function cfgDepartments() {
    return {
      title: "Departments", pageSize: 80,
      fetch: function () {
        return sb.from("hr_departments").select("*").eq("company_id", S.company.id).order("name").then(function (r) {
          var rows = r.data || [], nm = {}; rows.forEach(function (d) { nm[d.id] = d.name; });
          return sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).then(function (er) { var em = {}; (er.data || []).forEach(function (x) { em[x.id] = x.name; }); rows.forEach(function (d) { d._parent = d.parent_id ? nm[d.parent_id] : ""; d._mgr = d.manager_id ? em[d.manager_id] : ""; }); return rows; });
        });
      },
      searchText: function (d) { return d.name || ""; },
      columns: [
        { label: "Department", get: function (d) { return '<b>' + esc(d.name) + '</b>'; } },
        { label: "Parent", get: function (d) { return esc(d._parent || ""); } },
        { label: "Manager", get: function (d) { return esc(d._mgr || ""); } }
      ],
      onOpen: function (d) { openDeptModal(d); },
      onNew: function () { openDeptModal(); }
    };
  }
  async function openDeptModal(dept) {
    dept = dept || {};
    var depts = (await sb.from("hr_departments").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    function opts(list, cur) { return '<option value="">None</option>' + list.map(function (x) { return '<option value="' + x.id + '"' + (cur === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join(""); }
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (dept.id ? "Edit department" : "New department") + '</h3><div class="form">' +
      '<div><label>Name</label>' + fhint("__dname", "The department name, e.g. Engineering or Site Operations.") + '<input id="d-name" value="' + esc(dept.name || "") + '"></div>' +
      '<div class="row2"><div><label>Parent department</label>' + fhint("__dparent", "The department this one sits under, if any.") + '<select id="d-parent">' + opts(depts.filter(function (x) { return x.id !== dept.id; }), dept.parent_id) + '</select></div>' +
      '<div><label>Manager</label>' + fhint("__dmgr", "The employee who manages this department.") + '<select id="d-mgr">' + opts(emps, dept.manager_id) + '</select></div></div>' +
      '</div><div class="foot"><button class="btn" id="d-cancel">Cancel</button><button class="btn pri" id="d-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("d-cancel").onclick = function () { m.remove(); };
    document.getElementById("d-save").onclick = async function () {
      var name = gv("d-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, parent_id: document.getElementById("d-parent").value || null, manager_id: document.getElementById("d-mgr").value || null };
      var r; if (dept.id) r = await sb.from("hr_departments").update(row).eq("id", dept.id); else { row.company_id = S.company.id; r = await sb.from("hr_departments").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgJobs() {
    return {
      title: "Job Positions", pageSize: 80,
      fetch: function () { return sb.from("hr_jobs").select("*, hr_departments(name)").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (j) { return (j.name || "") + " " + (j.hr_departments ? j.hr_departments.name : ""); },
      columns: [
        { label: "Job Position", get: function (j) { return '<b>' + esc(j.name) + '</b>'; } },
        { label: "Department", get: function (j) { return esc(j.hr_departments ? j.hr_departments.name : ""); } }
      ],
      groupBy: [{ label: "Department", get: function (j) { return j.hr_departments ? j.hr_departments.name : "None"; } }],
      onOpen: function (j) { openJobModal(j); },
      onNew: function () { openJobModal(); }
    };
  }
  async function openJobModal(job) {
    job = job || {};
    var depts = (await sb.from("hr_departments").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (job.id ? "Edit job position" : "New job position") + '</h3><div class="form">' +
      '<div><label>Job title</label>' + fhint("__jname", "The position title, e.g. Facade Engineer or Project Manager.") + '<input id="j-name" value="' + esc(job.name || "") + '"></div>' +
      '<div><label>Department</label>' + fhint("__jdept", "The department this role belongs to.") + '<select id="j-dept"><option value="">None</option>' + depts.map(function (d) { return '<option value="' + d.id + '"' + (job.department_id === d.id ? " selected" : "") + '>' + esc(d.name) + '</option>'; }).join("") + '</select></div>' +
      '</div><div class="foot"><button class="btn" id="j-cancel">Cancel</button><button class="btn pri" id="j-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("j-cancel").onclick = function () { m.remove(); };
    document.getElementById("j-save").onclick = async function () {
      var name = gv("j-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, department_id: document.getElementById("j-dept").value || null };
      var r; if (job.id) r = await sb.from("hr_jobs").update(row).eq("id", job.id); else { row.company_id = S.company.id; r = await sb.from("hr_jobs").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }
  var LEAVE_T = { paid: "Paid time off", sick: "Sick leave", unpaid: "Unpaid" };
  function cfgLeaves() {
    return {
      title: "Time Off", pageSize: 80,
      fetch: function () { return sb.from("hr_leaves").select("*, hr_employees(name)").eq("company_id", S.company.id).order("date_from", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (l) { return (l.hr_employees ? l.hr_employees.name : "") + " " + (l.leave_type || ""); },
      columns: [
        { label: "Employee", get: function (l) { return '<b>' + esc(l.hr_employees ? l.hr_employees.name : "") + '</b>'; } },
        { label: "Type", get: function (l) { return LEAVE_T[l.leave_type] || l.leave_type || ""; } },
        { label: "From", get: function (l) { return '<span class="muted">' + esc(l.date_from || "") + '</span>'; } },
        { label: "To", get: function (l) { return '<span class="muted">' + esc(l.date_to || "") + '</span>'; } },
        { label: "Days", num: true, get: function (l) { return Number(l.days || 0); } },
        { label: "Status", get: function (l) { return l.state === "approved" ? '<span class="badge paid">Approved</span>' : l.state === "refused" ? '<span class="badge">Refused</span>' : '<span class="badge draft">To approve</span>'; } }
      ],
      filters: [{ label: "To approve", test: function (l) { return l.state !== "approved" && l.state !== "refused"; } }, { label: "Approved", test: function (l) { return l.state === "approved"; } }],
      groupBy: [{ label: "Employee", get: function (l) { return l.hr_employees ? l.hr_employees.name : "None"; } }, { label: "Type", get: function (l) { return LEAVE_T[l.leave_type] || l.leave_type || "None"; } }],
      onOpen: function (l) { openLeaveModal(l); },
      onNew: function () { openLeaveModal(); }
    };
  }
  async function openLeaveModal(leave) {
    leave = leave || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    if (!emps.length) { toast("Add an employee first"); return; }
    var approved = leave.state === "approved";
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (leave.id ? "Time off request" : "New time off") + '</h3><div class="form">' +
      '<div><label>Employee</label>' + fhint("__lvemp", "Who is taking time off.") + '<select id="lv-emp">' + emps.map(function (x) { return '<option value="' + x.id + '"' + (leave.employee_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div><label>Type</label>' + fhint("__lvtype", "The kind of leave.") + '<select id="lv-type"><option value="paid"' + (leave.leave_type === "paid" ? " selected" : "") + '>Paid time off</option><option value="sick"' + (leave.leave_type === "sick" ? " selected" : "") + '>Sick leave</option><option value="unpaid"' + (leave.leave_type === "unpaid" ? " selected" : "") + '>Unpaid</option></select></div>' +
      '<div class="row2"><div><label>From</label>' + fhint("__lvfrom", "First day off.") + '<input id="lv-from" type="date" value="' + (leave.date_from || today()) + '"></div><div><label>To</label>' + fhint("__lvto", "Last day off.") + '<input id="lv-to" type="date" value="' + (leave.date_to || today()) + '"></div></div>' +
      '<div><label>Days</label>' + fhint("__lvdays", "Number of days requested.") + '<input id="lv-days" type="number" step="0.5" value="' + (leave.days || 1) + '"></div>' +
      '</div><div class="foot"><button class="btn" id="lv-cancel">Cancel</button>' + (leave.id && !approved ? '<button class="btn" id="lv-approve">Approve</button>' : "") + '<button class="btn pri" id="lv-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("lv-cancel").onclick = function () { m.remove(); };
    function collect() { return { employee_id: document.getElementById("lv-emp").value, leave_type: document.getElementById("lv-type").value, date_from: document.getElementById("lv-from").value, date_to: document.getElementById("lv-to").value, days: parseFloat(gv("lv-days")) || 0 }; }
    document.getElementById("lv-save").onclick = async function () {
      var row = collect();
      var r; if (leave.id) r = await sb.from("hr_leaves").update(row).eq("id", leave.id); else { row.company_id = S.company.id; row.state = "draft"; r = await sb.from("hr_leaves").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
    var ap = document.getElementById("lv-approve"); if (ap) ap.onclick = async function () {
      var row = collect(); row.state = "approved";
      var r = await sb.from("hr_leaves").update(row).eq("id", leave.id);
      if (r.error) { toast("Could not approve: " + r.error.message); return; }
      m.remove(); toast("Approved"); renderView();
    };
  }
  function cfgAttendances() {
    return {
      title: "Attendances", pageSize: 100,
      fetch: function () { return sb.from("hr_attendances").select("*, hr_employees(name)").eq("company_id", S.company.id).order("check_in", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (a) { return a.hr_employees ? a.hr_employees.name : ""; },
      columns: [
        { label: "Employee", get: function (a) { return '<b>' + esc(a.hr_employees ? a.hr_employees.name : "") + '</b>'; } },
        { label: "Check In", get: function (a) { return '<span class="muted">' + esc((a.check_in || "").replace("T", " ").slice(0, 16)) + '</span>'; } },
        { label: "Check Out", get: function (a) { return '<span class="muted">' + esc((a.check_out || "").replace("T", " ").slice(0, 16)) + '</span>'; } },
        { label: "Worked Hours", num: true, get: function (a) { return Number(a.worked_hours || 0).toFixed(2); } }
      ],
      groupBy: [{ label: "Employee", get: function (a) { return a.hr_employees ? a.hr_employees.name : "None"; } }],
      onNew: function () { openAttendanceModal(); }
    };
  }
  async function openAttendanceModal() {
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    if (!emps.length) { toast("Add an employee first"); return; }
    var nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Log attendance</h3><div class="form">' +
      '<div><label>Employee</label>' + fhint("__atemp", "The employee who worked.") + '<select id="at-emp">' + emps.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="row2"><div><label>Check in</label>' + fhint("__atin", "When the employee started.") + '<input id="at-in" type="datetime-local" value="' + nowLocal + '"></div><div><label>Check out</label>' + fhint("__atout", "When the employee finished.") + '<input id="at-out" type="datetime-local" value="' + nowLocal + '"></div></div>' +
      '</div><div class="foot"><button class="btn" id="at-cancel">Cancel</button><button class="btn pri" id="at-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("at-cancel").onclick = function () { m.remove(); };
    document.getElementById("at-save").onclick = async function () {
      var ci = document.getElementById("at-in").value, co = document.getElementById("at-out").value;
      if (!ci) { toast("Check in required"); return; }
      var wh = (ci && co) ? Math.max(0, (new Date(co) - new Date(ci)) / 3600000) : 0;
      var r = await sb.from("hr_attendances").insert({ company_id: S.company.id, employee_id: document.getElementById("at-emp").value, check_in: new Date(ci).toISOString(), check_out: co ? new Date(co).toISOString() : null, worked_hours: Number(wh.toFixed(2)) });
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Attendance logged"); renderView();
    };
  }
  function cfgExpenses() {
    return {
      title: "Expenses", pageSize: 80,
      fetch: function () { return sb.from("hr_expenses").select("*, hr_employees(name)").eq("company_id", S.company.id).order("expense_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (x) { return (x.name || "") + " " + (x.hr_employees ? x.hr_employees.name : ""); },
      columns: [
        { label: "Description", get: function (x) { return '<b>' + esc(x.name) + '</b>'; } },
        { label: "Employee", get: function (x) { return esc(x.hr_employees ? x.hr_employees.name : ""); } },
        { label: "Date", get: function (x) { return '<span class="muted">' + esc(x.expense_date || "") + '</span>'; } },
        { label: "Amount", num: true, get: function (x) { return (x.currency_code || S.company.currency_code) + " " + money(x.amount); } },
        { label: "Status", get: function (x) { return x.state === "approved" ? '<span class="badge paid">Approved</span>' : x.state === "submitted" ? '<span class="badge partial">Submitted</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "To submit", test: function (x) { return !x.state || x.state === "draft"; } }, { label: "Approved", test: function (x) { return x.state === "approved"; } }],
      groupBy: [{ label: "Employee", get: function (x) { return x.hr_employees ? x.hr_employees.name : "None"; } }, { label: "Month", get: function (x) { return (x.expense_date || "").slice(0, 7); } }],
      onOpen: function (x) { openExpenseModal(x); },
      onNew: function () { openExpenseModal(); }
    };
  }
  async function openExpenseModal(exp) {
    exp = exp || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    if (!emps.length) { toast("Add an employee first"); return; }
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (exp.id ? "Expense" : "New expense") + '</h3><div class="form">' +
      '<div><label>Description</label>' + fhint("__exname", "What the expense was for, e.g. Site travel or Materials.") + '<input id="ex-name" value="' + esc(exp.name || "") + '"></div>' +
      '<div class="row2"><div><label>Employee</label>' + fhint("__exemp", "Who paid the expense.") + '<select id="ex-emp">' + emps.map(function (x) { return '<option value="' + x.id + '"' + (exp.employee_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div><label>Amount (' + esc(S.company.currency_code) + ')</label>' + fhint("__examt", "The total amount spent.") + '<input id="ex-amt" type="number" step="0.01" value="' + (exp.amount || 0) + '"></div></div>' +
      '<div><label>Date</label>' + fhint("__exdate", "When the expense was incurred.") + '<input id="ex-date" type="date" value="' + (exp.expense_date || today()) + '"></div>' +
      '</div><div class="foot"><button class="btn" id="ex-cancel">Cancel</button>' + (exp.id && exp.state !== "approved" ? '<button class="btn" id="ex-approve">Approve</button>' : "") + '<button class="btn pri" id="ex-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ex-cancel").onclick = function () { m.remove(); };
    function collect() { return { name: gv("ex-name"), employee_id: document.getElementById("ex-emp").value, amount: parseFloat(gv("ex-amt")) || 0, expense_date: document.getElementById("ex-date").value, currency_code: S.company.currency_code }; }
    document.getElementById("ex-save").onclick = async function () {
      if (!gv("ex-name")) { toast("Description required"); return; }
      var row = collect();
      var r; if (exp.id) r = await sb.from("hr_expenses").update(row).eq("id", exp.id); else { row.company_id = S.company.id; row.state = "draft"; r = await sb.from("hr_expenses").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
    var ap = document.getElementById("ex-approve"); if (ap) ap.onclick = async function () {
      var r = await sb.from("hr_expenses").update({ state: "approved" }).eq("id", exp.id);
      if (r.error) { toast("Could not approve: " + r.error.message); return; }
      m.remove(); toast("Approved"); renderView();
    };
  }

  // ============================ PAYROLL ENGINE ============================
  var CALC_TYPES = [["fixed", "Fixed amount"], ["percent", "% of a base head"], ["per_day", "Per worked day"], ["per_hour", "Per worked hour"], ["overtime", "Overtime (hours x rate)"], ["undertime", "Undertime (hours x rate)"], ["formula", "Formula"]];
  var HEAD_CATS = [["earning", "Earning"], ["deduction", "Deduction"], ["benefit", "Benefit"], ["employer_cost", "Employer cost (EOS / employer SSF)"], ["total", "Total"]];
  function calcLabel(c) { for (var i = 0; i < CALC_TYPES.length; i++) if (CALC_TYPES[i][0] === c) return CALC_TYPES[i][1]; return c; }
  // Safe-ish formula eval: owner-configured expressions over payroll variables + Math.
  function evalFormula(expr, vars) {
    try { var keys = Object.keys(vars); return Number(new Function(keys.join(","), "with(Math){return (" + (expr || "0") + ");}").apply(null, keys.map(function (k) { return vars[k]; }))) || 0; }
    catch (e) { return 0; }
  }
  // Walk salary heads in sequence, compute each, accumulate gross/net.
  function computePayslip(contract, heads, w) {
    var wage = Number(contract.wage) || 0, wdays = Number(contract.working_days) || 26, dhours = Number(contract.daily_hours) || 8, otMult = Number(contract.ot_multiplier) || 1.25;
    var worked_days = (w.worked_days != null ? Number(w.worked_days) : wdays);
    var day_rate = wdays ? wage / wdays : 0, hour_rate = dhours ? day_rate / dhours : 0;
    var ot_hours = Number(w.ot_hours) || 0, ut_hours = Number(w.ut_hours) || 0, leave_days = Number(w.leave_days) || 0;
    var worked_hours = (w.worked_hours != null ? Number(w.worked_hours) : worked_days * dhours);
    var vars = { BASIC: wage, wage: wage, working_days: wdays, daily_hours: dhours, day_rate: day_rate, hour_rate: hour_rate, worked_days: worked_days, worked_hours: worked_hours, ot_hours: ot_hours, ut_hours: ut_hours, leave_days: leave_days, GROSS: 0, NET: 0 };
    var earnings = 0, ded = 0, employer = 0, lines = [];
    heads.slice().filter(function (h) { return h.is_active !== false; }).sort(function (a, b) { return (a.sequence || 0) - (b.sequence || 0); }).forEach(function (h) {
      var cat = h.category || "earning", amt = 0;
      if (cat === "total") { amt = /net/i.test(h.code) ? (earnings - ded) : earnings; }
      else switch (h.calc_type) {
        case "fixed": amt = Number(h.amount) || 0; break;
        case "percent": amt = (Number(h.amount) || 0) / 100 * (Number(vars[h.base_code]) || 0); break;
        case "per_day": amt = (h.code === "BASIC" ? day_rate : Number(h.amount) || 0) * worked_days; break;
        case "per_hour": amt = (Number(h.amount) || 0) * worked_hours; break;
        case "overtime": amt = ot_hours * hour_rate * ((Number(h.amount) || 0) || otMult); break;
        case "undertime": amt = ut_hours * hour_rate; break;
        case "formula": amt = evalFormula(h.formula, vars); break;
        default: amt = Number(h.amount) || 0;
      }
      amt = Math.round(amt * 100) / 100; vars[h.code] = amt;
      if (cat === "earning" || cat === "benefit") earnings += amt; else if (cat === "deduction") ded += amt; else if (cat === "employer_cost") employer += amt;
      vars.GROSS = earnings; vars.NET = earnings - ded;
      lines.push({ code: h.code, name: h.name, category: cat, amount: amt, sequence: h.sequence || 0 });
    });
    return { lines: lines, gross: earnings, deductions: ded, net: earnings - ded, employer: employer };
  }
  async function payslipWorked(empId, from, to, contract) {
    var atts = (await sb.from("hr_attendances").select("worked_hours,check_in").eq("company_id", S.company.id).eq("employee_id", empId).gte("check_in", from).lte("check_in", to + "T23:59:59")).data || [];
    var wh = 0, days = {}; atts.forEach(function (a) { wh += Number(a.worked_hours) || 0; if (a.check_in) days[(a.check_in || "").slice(0, 10)] = 1; });
    var dhours = Number(contract.daily_hours) || 8, wdays = Object.keys(days).length;
    if (!atts.length) { wdays = Number(contract.working_days) || 26; wh = wdays * dhours; }
    var expected = wdays * dhours;
    var lv = (await sb.from("hr_leaves").select("days").eq("company_id", S.company.id).eq("employee_id", empId).eq("state", "approved").gte("date_from", from).lte("date_from", to)).data || [];
    return { worked_days: wdays, worked_hours: Math.round(wh * 100) / 100, ot_hours: Math.round(Math.max(0, wh - expected) * 100) / 100, ut_hours: Math.round(Math.max(0, expected - wh) * 100) / 100, leave_days: lv.reduce(function (s, x) { return s + Number(x.days || 0); }, 0) };
  }
  async function postPayslip(slip) {
    var accs = (await sb.from("accounts").select("id,code,name,type_code").eq("company_id", S.company.id).eq("is_active", true)).data || [];
    var expAccs = accs.filter(function (a) { return (a.type_code || "").indexOf("expense") === 0; });
    var payAccs = accs.filter(function (a) { return (a.type_code || "").indexOf("liability") === 0; });
    // Gross salary is a P&L EXPENSE (prefer a salary/personnel expense account).
    var exp = (expAccs.filter(function (a) { return /salar|payroll|personnel|wage|staff/i.test(a.name); })[0] || expAccs.filter(function (a) { return a.code === "6000"; })[0] || expAccs[0] || {}).id;
    // Net pay is a liability (salaries payable if it exists, else generic payable).
    var netAcc = (payAccs.filter(function (a) { return /salar|payroll|personnel/i.test(a.name); })[0] || payAccs.filter(function (a) { return a.code === "4000"; })[0] || payAccs[0] || {}).id;
    var dedAcc = (payAccs.filter(function (a) { return a.code === "4000"; })[0] || payAccs[0] || {}).id;
    if (!exp || !netAcc) { toast("Need a salary/expense account and a payable account in the chart"); return false; }
    var jr = (await sb.from("journals").select("id").eq("company_id", S.company.id).eq("code", "MISC").maybeSingle()).data;
    if (!jr) { toast("No MISC journal to post to"); return false; }
    var gross = Number(slip.gross) || 0, ded = Number(slip.total_deductions) || 0, net = Number(slip.net) || 0;
    var elines = (await sb.from("hr_payslip_lines").select("amount,category").eq("payslip_id", slip.id)).data || [];
    var employer = elines.filter(function (l) { return l.category === "employer_cost"; }).reduce(function (s, l) { return s + Number(l.amount || 0); }, 0);
    var e = await sb.from("journal_entries").insert({ company_id: S.company.id, journal_id: jr.id, date: slip.date_to || today(), ref: "Payslip", narration: "Payroll " + (slip.date_from || ""), currency_code: S.company.currency_code, state: "draft", source_type: "payslip", source_id: String(slip.id) }).select("id").single();
    if (e.error) { toast("Entry failed: " + e.error.message); return false; }
    var eid = e.data.id, jl = [{ entry_id: eid, company_id: S.company.id, account_id: exp, label: "Gross salary", debit: gross, credit: 0 }];
    if (ded > 0.005) jl.push({ entry_id: eid, company_id: S.company.id, account_id: dedAcc, label: "Payroll deductions", debit: 0, credit: ded });
    jl.push({ entry_id: eid, company_id: S.company.id, account_id: netAcc, label: "Net salary payable", debit: 0, credit: net });
    if (employer > 0.005) { jl.push({ entry_id: eid, company_id: S.company.id, account_id: exp, label: "Employer costs (EOS/SSF)", debit: employer, credit: 0 }); jl.push({ entry_id: eid, company_id: S.company.id, account_id: dedAcc, label: "Employer cost provision", debit: 0, credit: employer }); }
    if ((await sb.from("journal_lines").insert(jl)).error) { toast("Lines failed"); return false; }
    var pr = await sb.rpc("post_entry", { p_entry: eid });
    if (pr.error) { toast("Post failed: " + pr.error.message); return false; }
    await sb.from("hr_payslips").update({ state: "confirmed", journal_entry_id: eid }).eq("id", slip.id);
    return true;
  }

  // ---- Contracts ----
  function cfgContracts() {
    return {
      title: "Contracts", pageSize: 80,
      fetch: function () { return sb.from("hr_contracts").select("*, hr_employees(name), hr_salary_structures(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (c) { return (c.hr_employees ? c.hr_employees.name : "") + " " + (c.name || ""); },
      columns: [
        { label: "Employee", get: function (c) { return '<b>' + esc(c.hr_employees ? c.hr_employees.name : "") + '</b>'; } },
        { label: "Structure", get: function (c) { return esc(c.hr_salary_structures ? c.hr_salary_structures.name : ""); } },
        { label: "Wage", num: true, get: function (c) { return (c.currency_code || S.company.currency_code) + " " + money(c.wage); } },
        { label: "Days/mo", num: true, get: function (c) { return Number(c.working_days || 0); } },
        { label: "Status", get: function (c) { return c.state === "running" ? '<span class="badge paid">Running</span>' : c.state === "expired" ? '<span class="badge">Expired</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Running", test: function (c) { return c.state === "running"; } }, { label: "Draft", test: function (c) { return c.state !== "running" && c.state !== "expired"; } }],
      groupBy: [{ label: "Structure", get: function (c) { return c.hr_salary_structures ? c.hr_salary_structures.name : "None"; } }],
      onOpen: function (c) { renderContractForm(c.id); },
      onNew: function () { renderContractForm("new"); }
    };
  }
  async function renderContractForm(id) {
    var parent = { action: "hr.contracts", title: "Contracts" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var c = id === "new" ? { state: "draft", working_days: 26, daily_hours: 8, ot_multiplier: 1.25, currency_code: S.company.currency_code } : (await sb.from("hr_contracts").select("*").eq("id", id).maybeSingle()).data || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var structs = (await sb.from("hr_salary_structures").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var slipCount = id === "new" ? 0 : ((await sb.from("hr_payslips").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("contract_id", id)).count || 0);
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : ((emps.filter(function (e) { return e.id === c.employee_id; })[0] || {}).name || "Contract");
    function opt(list, cur) { return '<option value="">None</option>' + list.map(function (x) { return '<option value="' + x.id + '"' + (cur === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join(""); }
    var smart = id !== "new" ? '<div class="o-smart"><button class="sb" id="ct-sm-slip"><span class="v">' + slipCount + '</span><span class="k">Payslips</span></button></div>' : "";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="ct-save">Save</button><button id="ct-discard">Discard</button></div>' +
      '<div class="o-stages"><span class="st ' + (c.state === "draft" || !c.state ? "on" : "done") + '">Draft</span><span class="st ' + (c.state === "running" ? "on" : "") + '">Running</span></div></div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title">Employment contract</div>' +
      '<div class="o-groups"><div>' +
      fld("Employee", '<select id="ct-emp">' + opt(emps, c.employee_id) + '</select>', "The employee this contract is for.") +
      fld("Salary Structure", '<select id="ct-struct">' + opt(structs, c.structure_id) + '</select>', "The set of salary heads used to compute this employee's payslip.") +
      fld("Monthly Wage", '<input id="ct-wage" type="number" step="0.01" value="' + (c.wage || 0) + '">', "The basic monthly salary. Per-day/hour rates derive from this.") +
      fld("Status", '<select id="ct-state"><option value="draft"' + (c.state === "draft" || !c.state ? " selected" : "") + '>Draft</option><option value="running"' + (c.state === "running" ? " selected" : "") + '>Running</option><option value="expired"' + (c.state === "expired" ? " selected" : "") + '>Expired</option></select>', "Only running contracts are picked up by payroll runs.") +
      '</div><div>' +
      fld("Working Days / month", '<input id="ct-wdays" type="number" step="0.5" value="' + (c.working_days || 26) + '">', "Standard paid days per month, used to prorate basic and set the day rate.") +
      fld("Daily Hours", '<input id="ct-dhours" type="number" step="0.5" value="' + (c.daily_hours || 8) + '">', "Standard hours per day, used for the hourly (overtime) rate.") +
      fld("Overtime Multiplier", '<input id="ct-otm" type="number" step="0.05" value="' + (c.ot_multiplier || 1.25) + '">', "Overtime pay = OT hours x hourly rate x this multiplier (e.g. 1.25, 1.5, 2).") +
      fld("Start Date", '<input id="ct-start" type="date" value="' + (c.date_start || "") + '">', "When the contract begins.") +
      '</div></div></div>';
    document.getElementById("ct-discard").onclick = function () { go("hr.contracts"); };
    var _cs = document.getElementById("ct-sm-slip"); if (_cs) _cs.onclick = function () { go("hr.slips"); };
    document.getElementById("ct-save").onclick = async function () {
      if (!document.getElementById("ct-emp").value) { toast("Pick an employee"); return; }
      var row = { employee_id: document.getElementById("ct-emp").value, structure_id: document.getElementById("ct-struct").value || null, wage: parseFloat(gv("ct-wage")) || 0, currency_code: S.company.currency_code, working_days: parseFloat(gv("ct-wdays")) || 26, daily_hours: parseFloat(gv("ct-dhours")) || 8, ot_multiplier: parseFloat(gv("ct-otm")) || 1.25, state: document.getElementById("ct-state").value, date_start: gv("ct-start") || null };
      var r; if (id === "new") { row.company_id = S.company.id; r = await sb.from("hr_contracts").insert(row); } else r = await sb.from("hr_contracts").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      toast("Saved"); go("hr.contracts");
    };
  }

  // ---- Shifts + Roster ----
  function cfgShifts() {
    return {
      title: "Shifts", pageSize: 80,
      fetch: function () { return sb.from("hr_shifts").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (s) { return s.name || ""; },
      columns: [
        { label: "Shift", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } },
        { label: "Start", get: function (s) { return esc(s.start_time || ""); } },
        { label: "End", get: function (s) { return esc(s.end_time || ""); } },
        { label: "Break (min)", num: true, get: function (s) { return Number(s.break_minutes || 0); } },
        { label: "Hours", num: true, get: function (s) { return Number(s.hours || 0); } }
      ],
      onOpen: function (s) { openShiftModal(s); },
      onNew: function () { openShiftModal(); }
    };
  }
  function openShiftModal(shift) {
    shift = shift || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (shift.id ? "Edit shift" : "New shift") + '</h3><div class="form">' +
      '<div><label>Name</label>' + fhint("__shn", "Shift name, e.g. Day shift or Night shift.") + '<input id="sh-name" value="' + esc(shift.name || "") + '"></div>' +
      '<div class="row2"><div><label>Start time</label>' + fhint("__shs", "Shift start, HH:MM.") + '<input id="sh-start" type="time" value="' + (shift.start_time || "08:00") + '"></div><div><label>End time</label>' + fhint("__she", "Shift end, HH:MM.") + '<input id="sh-end" type="time" value="' + (shift.end_time || "17:00") + '"></div></div>' +
      '<div class="row2"><div><label>Break (minutes)</label>' + fhint("__shb", "Unpaid break within the shift.") + '<input id="sh-break" type="number" value="' + (shift.break_minutes != null ? shift.break_minutes : 60) + '"></div><div><label>Paid hours</label>' + fhint("__shh", "Paid working hours in this shift (drives expected hours for OT/UT).") + '<input id="sh-hours" type="number" step="0.25" value="' + (shift.hours != null ? shift.hours : 8) + '"></div></div>' +
      '</div><div class="foot"><button class="btn" id="sh-cancel">Cancel</button><button class="btn pri" id="sh-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("sh-cancel").onclick = function () { m.remove(); };
    document.getElementById("sh-save").onclick = async function () {
      var name = gv("sh-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, start_time: gv("sh-start"), end_time: gv("sh-end"), break_minutes: parseInt(gv("sh-break")) || 0, hours: parseFloat(gv("sh-hours")) || 0 };
      var r; if (shift.id) r = await sb.from("hr_shifts").update(row).eq("id", shift.id); else { row.company_id = S.company.id; r = await sb.from("hr_shifts").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgRoster() {
    return {
      title: "Roster", pageSize: 120,
      fetch: function () { return sb.from("hr_roster").select("*, hr_employees(name), hr_shifts(name)").eq("company_id", S.company.id).order("work_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return (r.hr_employees ? r.hr_employees.name : "") + " " + (r.hr_shifts ? r.hr_shifts.name : ""); },
      columns: [
        { label: "Date", get: function (r) { return '<span class="muted">' + esc(r.work_date || "") + '</span>'; } },
        { label: "Employee", get: function (r) { return '<b>' + esc(r.hr_employees ? r.hr_employees.name : "") + '</b>'; } },
        { label: "Shift", get: function (r) { return esc(r.hr_shifts ? r.hr_shifts.name : ""); } }
      ],
      groupBy: [{ label: "Employee", get: function (r) { return r.hr_employees ? r.hr_employees.name : "None"; } }, { label: "Date", get: function (r) { return r.work_date || "None"; } }],
      onNew: function () { openRosterModal(); }
    };
  }
  async function openRosterModal() {
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var shifts = (await sb.from("hr_shifts").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    if (!emps.length) { toast("Add an employee first"); return; }
    if (!shifts.length) { toast("Create a shift first"); return; }
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Assign roster</h3><div class="form">' +
      '<div><label>Employee</label>' + fhint("__rse", "Who to schedule.") + '<select id="rs-emp">' + emps.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div><label>Shift</label>' + fhint("__rsh", "The shift to assign on each day in the range.") + '<select id="rs-shift">' + shifts.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="row2"><div><label>From</label>' + fhint("__rsf", "First day to schedule.") + '<input id="rs-from" type="date" value="' + today() + '"></div><div><label>To</label>' + fhint("__rst", "Last day to schedule.") + '<input id="rs-to" type="date" value="' + today() + '"></div></div>' +
      '<div><label>Skip weekends</label>' + fhint("__rsw", "Do not create roster rows for Saturday/Sunday.") + '<select id="rs-skip"><option value="1">Yes</option><option value="0">No</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="rs-cancel">Cancel</button><button class="btn pri" id="rs-save" style="background:var(--app);border-color:var(--app)">Assign</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("rs-cancel").onclick = function () { m.remove(); };
    document.getElementById("rs-save").onclick = async function () {
      var emp = document.getElementById("rs-emp").value, shift = document.getElementById("rs-shift").value, from = gv("rs-from"), to = gv("rs-to"), skip = document.getElementById("rs-skip").value === "1";
      if (!from || !to || to < from) { toast("Pick a valid date range"); return; }
      var rows = [], d = new Date(from + "T00:00:00"), end = new Date(to + "T00:00:00");
      while (d <= end) { var dow = d.getDay(); if (!(skip && (dow === 0 || dow === 6))) rows.push({ company_id: S.company.id, employee_id: emp, work_date: d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2), shift_id: shift }); d.setDate(d.getDate() + 1); }
      if (!rows.length) { toast("No days to assign"); return; }
      var r = await sb.from("hr_roster").upsert(rows, { onConflict: "employee_id,work_date" });
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast(rows.length + " day(s) rostered"); renderView();
    };
  }

  // ---- Salary structures + heads ----
  function cfgSalaryStructures() {
    return {
      title: "Salary Structures", pageSize: 80,
      fetch: function () { return sb.from("hr_salary_structures").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (s) { return s.name || ""; },
      columns: [{ label: "Structure", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } }, { label: "Status", get: function (s) { return s.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge">Archived</span>'; } }],
      onOpen: function (s) { openStructureModal(s); },
      onNew: function () { openStructureModal(); }
    };
  }
  function openStructureModal(st) {
    st = st || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (st.id ? "Edit structure" : "New salary structure") + '</h3><div class="form">' +
      '<div><label>Name</label>' + fhint("__stn", "Structure name, e.g. Site Labour, Staff, or Management.") + '<input id="st-name" value="' + esc(st.name || "") + '"></div>' +
      '</div><div class="foot"><button class="btn" id="st-cancel">Cancel</button><button class="btn pri" id="st-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("st-cancel").onclick = function () { m.remove(); };
    document.getElementById("st-save").onclick = async function () {
      var name = gv("st-name"); if (!name) { toast("Name required"); return; }
      var r; if (st.id) r = await sb.from("hr_salary_structures").update({ name: name }).eq("id", st.id); else r = await sb.from("hr_salary_structures").insert({ company_id: S.company.id, name: name });
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgSalaryHeads() {
    return {
      title: "Salary Heads", pageSize: 120,
      fetch: function () { return sb.from("hr_salary_heads").select("*, hr_salary_structures(name)").eq("company_id", S.company.id).order("sequence").then(function (r) { return r.data || []; }); },
      searchText: function (h) { return (h.code || "") + " " + (h.name || ""); },
      columns: [
        { label: "Seq", num: true, get: function (h) { return h.sequence; } },
        { label: "Code", get: function (h) { return '<span class="badge">' + esc(h.code) + '</span>'; } },
        { label: "Name", get: function (h) { return '<b>' + esc(h.name) + '</b>'; } },
        { label: "Category", get: function (h) { return esc(h.category); } },
        { label: "Computation", get: function (h) { return h.calc_type === "formula" ? esc("= " + h.formula) : h.calc_type === "percent" ? Number(h.amount) + "% of " + esc(h.base_code) : h.calc_type === "fixed" ? money(h.amount) : calcLabel(h.calc_type); } },
        { label: "Structure", get: function (h) { return esc(h.hr_salary_structures ? h.hr_salary_structures.name : ""); } }
      ],
      filters: [{ label: "Earnings", test: function (h) { return h.category === "earning" || h.category === "benefit"; } }, { label: "Deductions", test: function (h) { return h.category === "deduction"; } }],
      groupBy: [{ label: "Structure", get: function (h) { return h.hr_salary_structures ? h.hr_salary_structures.name : "None"; } }, { label: "Category", get: function (h) { return h.category || "None"; } }],
      onOpen: function (h) { openHeadModal(h); },
      onNew: function () { openHeadModal(); }
    };
  }
  async function openHeadModal(head) {
    head = head || {};
    var structs = (await sb.from("hr_salary_structures").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet" style="max-width:640px"><h3>' + (head.id ? "Edit salary head" : "New salary head") + '</h3><div class="form">' +
      '<div class="row2"><div><label>Code</label>' + fhint("__hdc", "Short unique code used in formulas, e.g. BASIC, HRA, OT.") + '<input id="hd-code" value="' + esc(head.code || "") + '" style="text-transform:uppercase"></div><div><label>Name</label>' + fhint("__hdn", "Label shown on the payslip.") + '<input id="hd-name" value="' + esc(head.name || "") + '"></div></div>' +
      '<div class="row2"><div><label>Structure</label>' + fhint("__hds", "Which salary structure this head belongs to.") + '<select id="hd-struct">' + structs.map(function (x) { return '<option value="' + x.id + '"' + (head.structure_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div><div><label>Category</label>' + fhint("__hdcat", "Earnings add to gross; deductions subtract; totals show gross/net.") + '<select id="hd-cat">' + HEAD_CATS.map(function (o) { return '<option value="' + o[0] + '"' + (head.category === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></div></div>' +
      '<div><label>Computation type</label>' + fhint("__hdct", "How this head is calculated.") + '<select id="hd-calc">' + CALC_TYPES.map(function (o) { return '<option value="' + o[0] + '"' + (head.calc_type === o[0] ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></div>' +
      '<div class="row2"><div><label>Amount / rate / multiplier</label>' + fhint("__hda", "Fixed amount, percent (e.g. 25), or OT multiplier depending on the type.") + '<input id="hd-amt" type="number" step="0.0001" value="' + (head.amount || 0) + '"></div><div><label>Base head (for %)</label>' + fhint("__hdb", "The code a percentage applies to, e.g. BASIC or GROSS.") + '<input id="hd-base" value="' + esc(head.base_code || "BASIC") + '" style="text-transform:uppercase"></div></div>' +
      '<div><label>Formula (for Formula type)</label>' + fhint("__hdf", "Expression using head codes + variables: BASIC, GROSS, day_rate, hour_rate, ot_hours, ut_hours, worked_days. E.g. GROSS * 0.05.") + '<input id="hd-formula" value="' + esc(head.formula || "") + '" placeholder="e.g. GROSS * 0.05"></div>' +
      '<div class="row2"><div><label>Sequence</label>' + fhint("__hdseq", "Computation order (lower first). Earnings before deductions/totals.") + '<input id="hd-seq" type="number" value="' + (head.sequence || 10) + '"></div><div><label>Active</label>' + fhint("__hdact", "Inactive heads are skipped in payroll.") + '<select id="hd-active"><option value="1"' + (head.is_active !== false ? " selected" : "") + '>Yes</option><option value="0"' + (head.is_active === false ? " selected" : "") + '>No</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="hd-cancel">Cancel</button><button class="btn pri" id="hd-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("hd-cancel").onclick = function () { m.remove(); };
    document.getElementById("hd-save").onclick = async function () {
      var code = gv("hd-code").toUpperCase(), name = gv("hd-name");
      if (!code || !name) { toast("Code and name required"); return; }
      if (!document.getElementById("hd-struct").value) { toast("Pick a structure"); return; }
      var row = { code: code, name: name, structure_id: document.getElementById("hd-struct").value, category: document.getElementById("hd-cat").value, calc_type: document.getElementById("hd-calc").value, amount: parseFloat(gv("hd-amt")) || 0, base_code: gv("hd-base").toUpperCase() || "BASIC", formula: gv("hd-formula"), sequence: parseInt(gv("hd-seq")) || 10, is_active: document.getElementById("hd-active").value === "1" };
      var r; if (head.id) r = await sb.from("hr_salary_heads").update(row).eq("id", head.id); else { row.company_id = S.company.id; r = await sb.from("hr_salary_heads").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }

  // ---- Payslip runs + payslips ----
  function cfgPayslipRuns() {
    return {
      title: "Payslip Runs", pageSize: 80,
      fetch: function () { return sb.from("hr_payslip_runs").select("*").eq("company_id", S.company.id).order("date_from", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return r.name || ""; },
      columns: [
        { label: "Run", get: function (r) { return '<b>' + esc(r.name) + '</b>'; } },
        { label: "From", get: function (r) { return '<span class="muted">' + esc(r.date_from || "") + '</span>'; } },
        { label: "To", get: function (r) { return '<span class="muted">' + esc(r.date_to || "") + '</span>'; } },
        { label: "Status", get: function (r) { return r.state === "done" ? '<span class="badge paid">Done</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      onOpen: function (r) { renderPayslipRunForm(r.id); },
      onNew: function () { renderPayslipRunForm("new"); }
    };
  }
  async function renderPayslipRunForm(id) {
    var parent = { action: "hr.runs", title: "Payslip Runs" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var now = new Date(), y = now.getFullYear(), mo = now.getMonth();
    function ymd(yy, mm, dd) { return yy + "-" + ("0" + mm).slice(-2) + "-" + ("0" + dd).slice(-2); }
    var run = id === "new" ? { name: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }), date_from: ymd(y, mo + 1, 1), date_to: ymd(y, mo + 1, new Date(y, mo + 1, 0).getDate()), state: "draft" } : (await sb.from("hr_payslip_runs").select("*").eq("id", id).maybeSingle()).data || {};
    var slips = id === "new" ? [] : (await sb.from("hr_payslips").select("*, hr_employees(name)").eq("company_id", S.company.id).eq("run_id", id).order("created_at")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (run.name || "Run");
    var slipRows = slips.map(function (s) { return '<tr data-slip="' + s.id + '" style="cursor:pointer"><td>' + esc(s.hr_employees ? s.hr_employees.name : "") + '</td><td class="num">' + Number(s.worked_days || 0) + '</td><td class="num">' + Number(s.ot_hours || 0) + '</td><td class="num">' + money(s.gross) + '</td><td class="num">' + money(s.total_deductions) + '</td><td class="num"><b>' + money(s.net) + '</b></td></tr>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pr-save">Save</button><button id="pr-discard">Discard</button>' + (id !== "new" ? '<button id="pr-gen">Generate payslips</button><button id="pr-postall">Post all</button><button id="pr-bank">Bank file</button>' : "") + '</div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="pr-name" value="' + esc(run.name || "") + '" placeholder="e.g. August 2026"></div>' +
      '<div class="o-groups"><div>' +
      fld("Period From", '<input id="pr-from" type="date" value="' + (run.date_from || "") + '">', "First day of the pay period.") +
      '</div><div>' +
      fld("Period To", '<input id="pr-to" type="date" value="' + (run.date_to || "") + '">', "Last day of the pay period.") +
      '</div></div>' +
      (id !== "new" ? '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Payslips (' + slips.length + ')</div></div><div class="o-nb-pg"><table class="o-list"><thead><tr><th>Employee</th><th class="num">Days</th><th class="num">OT h</th><th class="num">Gross</th><th class="num">Deductions</th><th class="num">Net</th></tr></thead><tbody>' + (slipRows || '<tr><td colspan="6" class="muted" style="padding:10px">No payslips yet. Click <b>Generate payslips</b>.</td></tr>') + '</tbody></table></div></div>' : "") +
      '</div>';
    document.getElementById("pr-discard").onclick = function () { go("hr.runs"); };
    document.querySelectorAll("[data-slip]").forEach(function (el) { el.onclick = function () { renderPayslipForm(el.dataset.slip); }; });
    document.getElementById("pr-save").onclick = async function () {
      var row = { name: gv("pr-name") || "Run", date_from: gv("pr-from") || null, date_to: gv("pr-to") || null };
      var nid = id; if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("hr_payslip_runs").insert(row).select("id").single(); if (ins.error) { toast(ins.error.message); return; } nid = ins.data.id; } else { if ((await sb.from("hr_payslip_runs").update(row).eq("id", id)).error) { toast("Save failed"); return; } }
      toast("Saved"); renderPayslipRunForm(nid);
    };
    var gb = document.getElementById("pr-gen"); if (gb) gb.onclick = async function () {
      var contracts = (await sb.from("hr_contracts").select("*").eq("company_id", S.company.id).eq("state", "running")).data || [];
      if (!contracts.length) { toast("No running contracts. Set a contract to Running first."); return; }
      var headsAll = (await sb.from("hr_salary_heads").select("*").eq("company_id", S.company.id)).data || [];
      await sb.from("hr_payslips").delete().eq("company_id", S.company.id).eq("run_id", id);
      var made = 0;
      for (var i = 0; i < contracts.length; i++) {
        var ct = contracts[i];
        var w = await payslipWorked(ct.employee_id, run.date_from, run.date_to, ct);
        var heads = headsAll.filter(function (h) { return h.structure_id === ct.structure_id; });
        var res = computePayslip(ct, heads, w);
        var ins = await sb.from("hr_payslips").insert({ company_id: S.company.id, run_id: id, employee_id: ct.employee_id, contract_id: ct.id, date_from: run.date_from, date_to: run.date_to, worked_days: w.worked_days, worked_hours: w.worked_hours, ot_hours: w.ot_hours, ut_hours: w.ut_hours, leave_days: w.leave_days, gross: res.gross, total_deductions: res.deductions, net: res.net, currency_code: ct.currency_code || S.company.currency_code, state: "draft" }).select("id").single();
        if (!ins.error && ins.data) { made++; var pls = res.lines.map(function (l) { return { company_id: S.company.id, payslip_id: ins.data.id, code: l.code, name: l.name, category: l.category, amount: l.amount, sequence: l.sequence }; }); await sb.from("hr_payslip_lines").insert(pls); }
      }
      toast(made + " payslip(s) generated"); renderPayslipRunForm(id);
    };
    var pab = document.getElementById("pr-postall"); if (pab) pab.onclick = async function () {
      var todo = (await sb.from("hr_payslips").select("*").eq("company_id", S.company.id).eq("run_id", id).eq("state", "draft")).data || [];
      if (!todo.length) { toast("No draft payslips to post"); return; }
      var n = 0; for (var i = 0; i < todo.length; i++) { if (await postPayslip(todo[i])) n++; }
      await sb.from("hr_payslip_runs").update({ state: "done" }).eq("id", id);
      toast(n + " payslip(s) posted to the ledger"); renderPayslipRunForm(id);
    };
    var bkb = document.getElementById("pr-bank"); if (bkb) bkb.onclick = async function () {
      var sl = (await sb.from("hr_payslips").select("net,currency_code, hr_employees(name,bank_account,work_email)").eq("company_id", S.company.id).eq("run_id", id)).data || [];
      if (!sl.length) { toast("No payslips to export"); return; }
      var out = ["Employee,Bank Account,Email,Currency,Net Amount"];
      sl.forEach(function (s) { var e = s.hr_employees || {}; out.push([csvCell(e.name || ""), csvCell(e.bank_account || ""), csvCell(e.work_email || ""), csvCell(s.currency_code || S.company.currency_code), csvCell(money(s.net))].join(",")); });
      var csv = "﻿" + out.join("\r\n"), blob = new Blob([csv], { type: "text/csv;charset=utf-8" }), url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = ("bank_file_" + (run.name || "run")).replace(/[^\w]+/g, "_").toLowerCase() + ".csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast(sl.length + " payment line(s) exported");
    };
  }
  function cfgPayslips() {
    return {
      title: "Payslips", pageSize: 100,
      fetch: function () { return sb.from("hr_payslips").select("*, hr_employees(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return s.hr_employees ? s.hr_employees.name : ""; },
      columns: [
        { label: "Employee", get: function (s) { return '<b>' + esc(s.hr_employees ? s.hr_employees.name : "") + '</b>'; } },
        { label: "Period", get: function (s) { return '<span class="muted">' + esc((s.date_from || "") + " to " + (s.date_to || "")) + '</span>'; } },
        { label: "Days", num: true, get: function (s) { return Number(s.worked_days || 0); } },
        { label: "OT h", num: true, get: function (s) { return Number(s.ot_hours || 0); } },
        { label: "Gross", num: true, get: function (s) { return money(s.gross); } },
        { label: "Net", num: true, get: function (s) { return '<b>' + money(s.net) + '</b>'; } },
        { label: "Status", get: function (s) { return s.state === "paid" ? '<span class="badge paid">Paid</span>' : s.state === "confirmed" ? '<span class="badge partial">Confirmed</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Draft", test: function (s) { return s.state === "draft" || !s.state; } }, { label: "Confirmed", test: function (s) { return s.state === "confirmed"; } }, { label: "Paid", test: function (s) { return s.state === "paid"; } }],
      groupBy: [{ label: "Status", get: function (s) { return s.state || "draft"; } }],
      onOpen: function (s) { renderPayslipForm(s.id); },
      onNew: function () { renderPayslipForm("new"); }
    };
  }
  async function renderPayslipForm(id) {
    var parent = { action: "hr.slips", title: "Payslips" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var now = new Date(), y = now.getFullYear(), mo = now.getMonth();
    function ymd(yy, mm, dd) { return yy + "-" + ("0" + mm).slice(-2) + "-" + ("0" + dd).slice(-2); }
    var slip = id === "new" ? { date_from: ymd(y, mo + 1, 1), date_to: ymd(y, mo + 1, new Date(y, mo + 1, 0).getDate()), state: "draft" } : (await sb.from("hr_payslips").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("hr_payslip_lines").select("*").eq("payslip_id", id).order("sequence")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : ((emps.filter(function (e) { return e.id === slip.employee_id; })[0] || {}).name || "Payslip");
    var cc = slip.currency_code || S.company.currency_code, posted = slip.state === "confirmed" || slip.state === "paid";
    function lineRows(ls) {
      var earn = ls.filter(function (l) { return l.category === "earning" || l.category === "benefit"; });
      var ded = ls.filter(function (l) { return l.category === "deduction"; });
      var emp = ls.filter(function (l) { return l.category === "employer_cost"; });
      var empTot = emp.reduce(function (s, l) { return s + Number(l.amount || 0); }, 0);
      function sec(title, arr) { return '<tr class="sec"><td colspan="2">' + title + '</td></tr>' + (arr.length ? arr.map(function (l) { return '<tr><td>' + esc(l.name) + ' <span class="muted">' + esc(l.code) + '</span></td><td class="num">' + money(l.amount) + '</td></tr>'; }).join("") : '<tr><td class="muted">-</td><td></td></tr>'); }
      return '<table class="o-rt"><tbody>' + sec("Earnings", earn) + '<tr class="tot"><td>Gross</td><td class="num">' + money(slip.gross) + '</td></tr>' + sec("Deductions", ded) + '<tr class="tot"><td>Total deductions</td><td class="num">' + money(slip.total_deductions) + '</td></tr><tr class="tot"><td>Net pay</td><td class="num">' + cc + " " + money(slip.net) + '</td></tr>' +
        (emp.length ? sec("Employer costs (not deducted from the employee)", emp) + '<tr class="tot"><td>Total employer cost</td><td class="num">' + money(empTot) + '</td></tr><tr class="tot"><td>Cost to company</td><td class="num">' + cc + " " + money((Number(slip.gross) || 0) + empTot) + '</td></tr>' : "") +
        '</tbody></table>';
    }
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="ps-save">Save</button><button id="ps-discard">Discard</button>' + (id !== "new" && !posted ? '<button id="ps-compute">Compute</button><button id="ps-post">Confirm &amp; Post</button>' : "") + (id !== "new" ? '<button id="ps-print">Print</button>' : "") + '</div>' +
      '<div class="o-stages"><span class="st ' + (!posted ? "on" : "done") + '">Draft</span><span class="st ' + (slip.state === "confirmed" ? "on" : slip.state === "paid" ? "done" : "") + '">Confirmed</span><span class="st ' + (slip.state === "paid" ? "on" : "") + '">Paid</span></div></div>' +
      '<div class="o-sheet"><div class="o-title">Payslip</div>' +
      '<div class="o-groups"><div>' +
      fld("Employee", (posted ? '<span class="v">' + esc((emps.filter(function (e) { return e.id === slip.employee_id; })[0] || {}).name || "") + '</span>' : '<select id="ps-emp"><option value="">Select...</option>' + emps.map(function (x) { return '<option value="' + x.id + '"' + (slip.employee_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select>'), "The employee being paid. Their running contract sets the wage and structure.") +
      fld("Period From", '<input id="ps-from" type="date" value="' + (slip.date_from || "") + '"' + (posted ? " disabled" : "") + '>', "Start of the pay period.") +
      fld("Period To", '<input id="ps-to" type="date" value="' + (slip.date_to || "") + '"' + (posted ? " disabled" : "") + '>', "End of the pay period.") +
      '</div><div>' +
      fld("Worked Days", '<input id="ps-wd" type="number" step="0.5" value="' + (slip.worked_days || 0) + '"' + (posted ? " disabled" : "") + '>', "Paid days worked. Prorates the basic salary.") +
      fld("Overtime Hours", '<input id="ps-ot" type="number" step="0.25" value="' + (slip.ot_hours || 0) + '"' + (posted ? " disabled" : "") + '>', "Hours beyond the rostered/expected hours.") +
      fld("Undertime Hours", '<input id="ps-ut" type="number" step="0.25" value="' + (slip.ut_hours || 0) + '"' + (posted ? " disabled" : "") + '>', "Hours short of the expected hours (deducted).") +
      fld("Leave Days", '<input id="ps-lv" type="number" step="0.5" value="' + (slip.leave_days || 0) + '"' + (posted ? " disabled" : "") + '>', "Approved leave days in the period.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Salary computation</div></div><div class="o-nb-pg" id="ps-lines">' + (lines.length ? lineRows(lines) : '<div class="muted" style="padding:10px">Fill the fields and click <b>Compute</b> to build the payslip from the employee\'s contract + salary heads.</div>') + '</div></div>' +
      '</div>';
    document.getElementById("ps-discard").onclick = function () { go("hr.slips"); };
    var prbtn2 = document.getElementById("ps-print"); if (prbtn2) prbtn2.onclick = function () { printPayslip(slip, lines, (emps.filter(function (e) { return e.id === slip.employee_id; })[0] || {}).name || ""); };
    async function gather() {
      var empId = posted ? slip.employee_id : (document.getElementById("ps-emp") ? document.getElementById("ps-emp").value : slip.employee_id);
      return { employee_id: empId, date_from: gv("ps-from"), date_to: gv("ps-to"), worked_days: parseFloat(gv("ps-wd")) || 0, ot_hours: parseFloat(gv("ps-ot")) || 0, ut_hours: parseFloat(gv("ps-ut")) || 0, leave_days: parseFloat(gv("ps-lv")) || 0 };
    }
    async function computeAndPersist(persist) {
      var g = await gather(); if (!g.employee_id) { toast("Pick an employee"); return null; }
      var ct = (await sb.from("hr_contracts").select("*").eq("company_id", S.company.id).eq("employee_id", g.employee_id).order("state", { ascending: false })).data || [];
      var contract = ct.filter(function (x) { return x.state === "running"; })[0] || ct[0];
      if (!contract) { toast("This employee has no contract. Create one under Contracts."); return null; }
      var heads = (await sb.from("hr_salary_heads").select("*").eq("company_id", S.company.id).eq("structure_id", contract.structure_id)).data || [];
      if (!heads.length) { toast("The contract's salary structure has no heads."); return null; }
      var res = computePayslip(contract, heads, { worked_days: g.worked_days, ot_hours: g.ot_hours, ut_hours: g.ut_hours, leave_days: g.leave_days });
      slip.gross = res.gross; slip.total_deductions = res.deductions; slip.net = res.net; slip.currency_code = contract.currency_code || S.company.currency_code;
      document.getElementById("ps-lines").innerHTML = lineRows(res.lines);
      if (persist) {
        var row = { employee_id: g.employee_id, contract_id: contract.id, date_from: g.date_from || null, date_to: g.date_to || null, worked_days: g.worked_days, ot_hours: g.ot_hours, ut_hours: g.ut_hours, leave_days: g.leave_days, gross: res.gross, total_deductions: res.deductions, net: res.net, currency_code: slip.currency_code };
        var sid = id;
        if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("hr_payslips").insert(row).select("id").single(); if (ins.error) { toast(ins.error.message); return null; } sid = ins.data.id; }
        else { if ((await sb.from("hr_payslips").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
        await sb.from("hr_payslip_lines").delete().eq("payslip_id", sid);
        await sb.from("hr_payslip_lines").insert(res.lines.map(function (l) { return { company_id: S.company.id, payslip_id: sid, code: l.code, name: l.name, category: l.category, amount: l.amount, sequence: l.sequence }; }));
        return sid;
      }
      return id;
    }
    document.getElementById("ps-save").onclick = async function () { var sid = await computeAndPersist(true); if (sid) { toast("Saved"); renderPayslipForm(sid); } };
    var cbtn = document.getElementById("ps-compute"); if (cbtn) cbtn.onclick = function () { computeAndPersist(false); };
    var pbtn = document.getElementById("ps-post"); if (pbtn) pbtn.onclick = async function () {
      var sid = await computeAndPersist(true); if (!sid) return;
      var fresh = (await sb.from("hr_payslips").select("*").eq("id", sid).maybeSingle()).data;
      var ok = await postPayslip(fresh);
      if (ok) { toast("Confirmed & posted to the ledger"); renderPayslipForm(sid); }
    };
  }

  // ---- Leave allocations ----
  function cfgLeaveAllocations() {
    return {
      title: "Time Off Allocations", pageSize: 80,
      fetch: function () { return sb.from("hr_leave_allocations").select("*, hr_employees(name)").eq("company_id", S.company.id).order("year", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (a) { return (a.hr_employees ? a.hr_employees.name : "") + " " + (a.leave_type || ""); },
      columns: [
        { label: "Employee", get: function (a) { return '<b>' + esc(a.hr_employees ? a.hr_employees.name : "") + '</b>'; } },
        { label: "Type", get: function (a) { return LEAVE_T[a.leave_type] || a.leave_type || ""; } },
        { label: "Year", num: true, get: function (a) { return a.year; } },
        { label: "Days allocated", num: true, get: function (a) { return Number(a.days || 0); } }
      ],
      groupBy: [{ label: "Employee", get: function (a) { return a.hr_employees ? a.hr_employees.name : "None"; } }],
      onOpen: function (a) { openAllocModal(a); },
      onNew: function () { openAllocModal(); }
    };
  }
  async function openAllocModal(al) {
    al = al || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    if (!emps.length) { toast("Add an employee first"); return; }
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (al.id ? "Edit allocation" : "New allocation") + '</h3><div class="form">' +
      '<div><label>Employee</label>' + fhint("__ale", "Who is granted the days.") + '<select id="al-emp">' + emps.map(function (x) { return '<option value="' + x.id + '"' + (al.employee_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="row2"><div><label>Type</label>' + fhint("__alt", "Leave type this balance is for.") + '<select id="al-type"><option value="paid"' + (al.leave_type === "paid" ? " selected" : "") + '>Paid time off</option><option value="sick"' + (al.leave_type === "sick" ? " selected" : "") + '>Sick leave</option><option value="unpaid"' + (al.leave_type === "unpaid" ? " selected" : "") + '>Unpaid</option></select></div>' +
      '<div><label>Year</label>' + fhint("__aly", "The calendar year.") + '<input id="al-year" type="number" value="' + (al.year || new Date().getFullYear()) + '"></div></div>' +
      '<div><label>Days allocated</label>' + fhint("__ald", "Number of days granted for the year.") + '<input id="al-days" type="number" step="0.5" value="' + (al.days || 0) + '"></div>' +
      '</div><div class="foot"><button class="btn" id="al-cancel">Cancel</button><button class="btn pri" id="al-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("al-cancel").onclick = function () { m.remove(); };
    document.getElementById("al-save").onclick = async function () {
      var row = { employee_id: document.getElementById("al-emp").value, leave_type: document.getElementById("al-type").value, year: parseInt(gv("al-year")) || new Date().getFullYear(), days: parseFloat(gv("al-days")) || 0 };
      var r; if (al.id) r = await sb.from("hr_leave_allocations").update(row).eq("id", al.id); else { row.company_id = S.company.id; r = await sb.from("hr_leave_allocations").insert(row); }
      if (r.error) { toast("Could not save: " + r.error.message); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }

  // ---- start ----
  applyTheme();
  sb.auth.onAuthStateChange(function (_e, session) { if (!session) renderLogin("in"); });
  boot();
})();

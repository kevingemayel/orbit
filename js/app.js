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
  function fontStack(f) { return ({ system: '"Segoe UI",-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif', onest: '"Onest",system-ui,sans-serif', inter: '"Onest",system-ui,sans-serif', rounded: '"Nunito","Segoe UI",system-ui,sans-serif', serif: '"Lora",Georgia,"Times New Roman",serif', mono: '"JetBrains Mono","SF Mono","Cascadia Code","Consolas",ui-monospace,monospace' })[f] || "inherit"; }
  function applyTheme() {
    var de = document.documentElement;
    if (S.ui.theme && S.ui.theme !== "system") de.setAttribute("data-theme", S.ui.theme); else de.removeAttribute("data-theme");
    de.style.setProperty("--ui", fontStack(S.ui.font));
    applyAppColor(); applyFontScale();
  }
  function applyAppColor() {
    // Orbit brand: the navbar is always ink; app identity lives in the colorful
    // app-switcher tiles, not the chrome. Blue (--accent) is reserved for actions/AI.
    // Themed presets (corporate/blue/pink) still set their own --app via CSS.
    var s = document.documentElement.style;
    s.removeProperty("--app"); s.removeProperty("--app2");
  }
  function applyFontScale() {
    var z = ({ small: 0.92, normal: 1, large: 1.1 })[S.ui.size] || 1;
    var m = document.getElementById("o-main"); if (m) m.style.zoom = z;
    var h = document.querySelector(".o-home"); if (h) h.style.zoom = z;
  }

  // Orbit diamond mark (open frame + solid core + blue AI dot). Stroke inherits currentColor
  // so it flips with the theme (ink on light, near-white on dark); the AI dot is always blue.
  function orbitMark(stroke) { stroke = stroke || "currentColor"; return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M 75.5 38.3 L 87.2 50 L 50 87.2 L 12.8 50 L 50 12.8 L 61.3 24.1" fill="none" stroke="' + stroke + '" stroke-width="13" stroke-linejoin="miter"></path><rect x="42" y="42" width="16" height="16" fill="' + stroke + '" transform="rotate(45 50 50)"></rect><circle cx="68.4" cy="31.2" r="8" fill="#2f6bff"></circle></svg>'; }
  // Orbit lockup: the mark is the "O" (no dot); the blue dot moves out to become the tittle of the i in "orbit".
  // Mark stroke + wordmark inherit currentColor (theme-aware); the AI dot stays blue.
  function orbitLockup() { return '<svg viewBox="0 0 285 110" role="img" aria-label="Orbit"><g transform="translate(0 5)"><path d="M 75.5 38.3 L 87.2 50 L 50 87.2 L 12.8 50 L 50 12.8 L 61.3 24.1" fill="none" stroke="currentColor" stroke-width="13" stroke-linejoin="miter"></path><rect x="42" y="42" width="16" height="16" fill="currentColor" transform="rotate(45 50 50)"></rect></g><text x="88" y="92" font-family="Onest, sans-serif" font-weight="800" font-size="98" letter-spacing="-2" fill="currentColor">rb&#305;t</text><circle cx="207" cy="18" r="10" fill="#2f6bff"></circle></svg>'; }
  var esc = function (s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var money = function (n) { if (S.role && S.role.can_see_money === false) return "•••"; return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  // central modal accessibility (ORB-07): every .modal gets dialog semantics + autofocus + Escape-to-close
  function _a11yEnhanceModal(m) { if (!m || m._a11y) return; m._a11y = 1; var sheet = m.querySelector(".sheet") || m; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); setTimeout(function () { var f = m.querySelector("input:not([type=hidden]),select,textarea,button"); if (f) { try { f.focus(); } catch (e) { } } }, 40); }
  (function initModalA11y() {
    // stamp an accessible name on the prominent record-name field (it otherwise has only a placeholder)
    function _a11yTitles(n) {
      if (!n.querySelectorAll) return;
      [].forEach.call(n.querySelectorAll(".o-title input[placeholder]:not([aria-label]):not([aria-labelledby])"), function (inp) { inp.setAttribute("aria-label", inp.getAttribute("placeholder")); });
      if (n.matches && n.matches(".o-title input[placeholder]:not([aria-label])")) n.setAttribute("aria-label", n.getAttribute("placeholder"));
    }
    function start() { try { new MutationObserver(function (ms) { ms.forEach(function (mu) { [].forEach.call(mu.addedNodes || [], function (n) { if (n.nodeType !== 1) return; if (n.classList && n.classList.contains("modal")) _a11yEnhanceModal(n); _a11yTitles(n); }); }); }).observe(document.body, { childList: true, subtree: true }); } catch (e) { } }
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var mods = document.querySelectorAll(".modal.on"); if (mods.length) { var top = mods[mods.length - 1]; var c = top.querySelector('[id$="-cancel"]') || top.querySelector(".foot .btn:not(.pri)"); if (c) c.click(); else top.remove(); } } });
  })();
  var today = function () { return new Date().toISOString().slice(0, 10); };
  var fmtD = function (d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  var parseD = function (s) { if (!s) return null; var p = String(s).slice(0, 10).split("-"); return new Date(+p[0], (+p[1]) - 1, +p[2]); };
  var isLocked = function (dateStr) { var ld = S.company && S.company.lock_date; return !!(ld && dateStr && String(dateStr).slice(0, 10) <= ld); };
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add("on"); }); setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 250); }, 2400); }
  // ORB-16: turn raw database / API errors into plain language for toasts
  function errMsg(e) {
    var m = (e && (e.message || e.msg)) || (typeof e === "string" ? e : "") || "Something went wrong.";
    var s = String(m).toLowerCase();
    if (/posted invoice|locked|greater than zero|non-zero/.test(s)) return m;            // our own friendly raises
    if (/duplicate key|already exists|unique constraint/.test(s)) return "That already exists — a record with the same code or number is already saved.";
    if (/foreign key/.test(s)) return "This record is linked to others, so it can’t be changed or removed that way.";
    if (/not-null|null value in column/.test(s)) return "A required field is missing.";
    if (/permission denied|row-level security|row level security|not allowed/.test(s)) return "You don’t have permission to do that.";
    if (/check constraint|violates check/.test(s)) return "That value isn’t allowed here.";
    if (/jwt|token is expired|not authenticated/.test(s)) return "Your session expired — please sign in again.";
    if (/failed to fetch|networkerror|network request/.test(s)) return "Network problem — check your connection and try again.";
    if (/invalid input syntax|invalid text representation|invalid input/.test(s)) return "One of the values is in the wrong format.";
    if (/pgrst|constraint|relation .* does not exist|column .* does not exist|syntax error/.test(s)) return "Couldn’t save that — please check the fields and try again.";
    return m;
  }
  var SEARCH_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

  // ======================= APP / MENU CONFIG =======================
  var APPS = {
    accounting: {
      name: "Accounting", icon: "€", color: "#7c3aed", color2: "#5b21b6", home: "dashboard",
      menus: [
        { label: "Dashboard", action: "dashboard" },
        { label: "Cockpit", action: "cockpit" },
        { label: "Customers", items: [["Invoices", "inv.out"], ["Credit Notes", "inv.outr"], ["Payments", "pay.in"], ["Customers", "cust"]] },
        { label: "Vendors", items: [["Bills", "inv.in"], ["Refunds", "inv.inr"], ["Payments", "pay.out"], ["Vendors", "vend"]] },
        { label: "Accounting", items: [["Journal Entries", "moves"], ["Bank Statements", "bank"], ["Assets", "assets.list"], ["Chart of Accounts", "accounts"]] },
        { label: "Reporting", items: [["Profit and Loss", "rep.pl"], ["Balance Sheet", "rep.bs"], ["General Ledger", "rep.gl"], ["Trial Balance", "rep.tb"], ["Partner Ledger", "rep.partner"], ["Aged Receivable", "rep.aged.recv"], ["Aged Payable", "rep.aged.pay"], ["Budgets", "budget.list"], ["Cash Flow Forecast", "rep.cashfwd"], ["Collections", "rep.collections"], ["VAT / Tax Report", "rep.tax"], ["Partner Statement", "rep.stmt"], ["Consolidation", "rep.cons"]] },
        { label: "Configuration", items: [["Companies", "companies"], ["Taxes", "taxes"], ["Products", "products"], ["Exchange Rates", "rates"], ["Follow-up Levels", "fu.levels"]] }
      ]
    },
    sales: {
      name: "Sales", icon: "$", color: "#0891b2", color2: "#0e7490", home: "so.list",
      menus: [
        { label: "Orders", items: [["Quotations", "so.list"], ["Invoices", "inv.out"]] },
        { label: "Customers", action: "cust" },
        { label: "Products", action: "products" },
        { label: "Configuration", items: [["Pricelists", "sale.pricelists"], ["Quotation Templates", "sale.qtempl"]] }
      ]
    },
    purchase: {
      name: "Purchase", icon: "⛁", color: "#b45309", color2: "#92400e", home: "po.list",
      menus: [
        { label: "Orders", items: [["Purchase Orders", "po.list"], ["Bills", "inv.in"], ["3-Way Match", "pur.match"]] },
        { label: "Procurement", items: [["RFQ / Compare Quotes", "rfq.list"], ["Material Requisitions", "pur.req"], ["Subcontract Certificates", "pur.sccert"]] },
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
    estimation: {
      name: "Estimation", icon: "▣", color: "#0d9488", color2: "#0f766e", home: "est.list",
      menus: [
        { label: "Tenders", action: "est.list" },
        { label: "Customers", action: "cust" }
      ]
    },
    inventory: {
      name: "Inventory", icon: "▦", color: "#16a34a", color2: "#15803d", home: "inv.onhand",
      menus: [
        { label: "Overview", action: "inv.onhand" },
        { label: "Operations", items: [["Stock Moves", "inv.moves"], ["Material Issues", "inv.issues"], ["Scrap", "inv.scrap"], ["Replenishment", "inv.reorder"]] },
        { label: "Products", items: [["Products", "products"], ["Product Categories", "inv.cats"], ["Lots / Serials", "lots"]] },
        { label: "Configuration", items: [["Warehouses", "wh"], ["Locations", "loc"], ["Units of Measure", "inv.uoms"], ["Storage Categories", "inv.storage"], ["Putaway Rules", "inv.putaway"], ["Delivery Methods", "inv.delivery"], ["Package Types", "inv.packages"]] }
      ]
    },
    project: {
      name: "Projects", icon: "◈", color: "#db2777", color2: "#be185d", home: "proj.list",
      menus: [
        { label: "Projects", action: "proj.list" },
        { label: "Tasks", action: "task.list" },
        { label: "Execution", action: "proj.board" },
        { label: "My Work", action: "proj.mywork" },
        { label: "Programme", action: "proj.schedule" },
        { label: "Timesheets", action: "ts.list" },
        { label: "Billing", items: [["Progress Certificates", "pc.list"], ["Variations", "var.list"], ["WIP Schedule", "proj.wip"]] },
        { label: "Costs", items: [["Job Cost", "proj.jobcost"], ["Cost Codes", "cost.codes"], ["Subcontracts", "sc.list"], ["Project P&L", "proj.pnl"], ["Retention", "proj.retention"]] }
      ]
    },
    manufacturing: {
      name: "Manufacturing", icon: "⚒", color: "#0d9488", color2: "#0f766e", home: "mfg.wo",
      menus: [
        { label: "Work Orders", action: "mfg.wo" },
        { label: "Bills of Materials", action: "mfg.boms" },
        { label: "Products", action: "products" }
      ]
    },
    documents: {
      name: "Documents", icon: "▤", color: "#0369a1", color2: "#075985", home: "doc.subs",
      menus: [
        { label: "Submittals", action: "doc.subs" },
        { label: "RFIs", action: "doc.rfis" },
        { label: "Transmittals", action: "doc.trans" },
        { label: "Projects", action: "proj.list" }
      ]
    },
    site: {
      name: "Site & Install", icon: "✓", color: "#ca8a04", color2: "#a16207", home: "site.snags",
      menus: [
        { label: "Install Jobs", action: "inst.jobs" },
        { label: "Snagging", action: "site.snags" },
        { label: "Inspections", action: "site.insp" },
        { label: "Plant & Equipment", action: "site.plant" },
        { label: "Site Diary", action: "site.diary" }
      ]
    },
    contacts: {
      name: "Contacts", icon: "☎", color: "#0ea5e9", color2: "#0284c7", home: "contacts",
      menus: [
        { label: "Contacts", action: "contacts" },
        { label: "Configuration", items: [["Tags", "contact.tags"]] }
      ]
    },
    calendar: {
      name: "Calendar", icon: "◷", color: "#0891b2", color2: "#0e7490", home: "cal.month",
      menus: [
        { label: "Calendar", action: "cal.month" },
        { label: "Agenda", action: "cal.agenda" }
      ]
    },
    sign: {
      name: "Sign", icon: "✒", color: "#7c3aed", color2: "#6d28d9", home: "sign.list",
      menus: [{ label: "Signature Requests", action: "sign.list" }]
    },
    recruitment: {
      name: "Recruitment", icon: "☺", color: "#db2777", color2: "#be185d", home: "rec.applicants",
      menus: [
        { label: "Applicants", action: "rec.applicants" },
        { label: "Job Positions", action: "hr.jobs" }
      ]
    },
    knowledge: {
      name: "Knowledge", icon: "▤", color: "#ca8a04", color2: "#a16207", home: "kb.articles",
      menus: [{ label: "Articles", action: "kb.articles" }]
    },
    hr: {
      name: "Employees", icon: "☺", color: "#4f46e5", color2: "#4338ca", home: "hr.emp",
      menus: [
        { label: "Employees", items: [["Employees", "hr.emp"], ["Departments", "hr.dept"], ["Job Positions", "hr.jobs"], ["Contracts", "hr.contracts"]] },
        { label: "Talent", items: [["Skills", "hr.skills"], ["Employee Skills", "hr.empskills"], ["Certifications", "hr.certs"], ["Onboarding", "hr.onboard"], ["Appraisals", "hr.appraisals"]] },
        { label: "Planning", items: [["Planning", "hr.planning"], ["Shift Templates", "hr.shifttmpl"]] },
        { label: "Attendances", items: [["Attendances", "hr.att"], ["Roster", "hr.roster"], ["Shifts", "hr.shifts"]] },
        { label: "Time Off", items: [["Requests", "hr.leaves"], ["Allocations", "hr.alloc"]] },
        { label: "Payroll", items: [["Payslip Runs", "hr.runs"], ["Payslips", "hr.slips"], ["Salary Structures", "hr.struct"], ["Salary Heads", "hr.heads"], ["End of Service", "hr.eos"], ["Payroll Consolidation", "hr.payconsol"]] },
        { label: "Expenses", action: "hr.exp" }
      ]
    },
    settings: {
      name: "Settings", icon: "⚙", color: "#475569", color2: "#334155", home: "companies",
      menus: [
        { label: "Getting started", action: "settings.setup" },
        { label: "Pending signups", action: "platform.pending" },
        { label: "Companies", action: "companies" },
        { label: "Users & Roles", action: "settings.users" },
        { label: "Roles & Permissions", action: "settings.roles" },
        { label: "Approvals", action: "approvals.inbox" },
        { label: "Approval Rules", action: "approvals.rules" },
        { label: "Portal Access", action: "portal.admin" },
        { label: "Document Numbering", action: "settings.numbering" },
        { label: "Import Data", action: "settings.import" },
        { label: "Period Lock", action: "settings.lock" },
        { label: "Appearance", action: "appearance" },
        { label: "Taxes", action: "taxes" },
        { label: "Exchange Rates", action: "rates" },
        { label: "Chart of Accounts", action: "accounts" }
      ]
    },
    insights: {
      name: "Insights", icon: "▬", color: "#0891b2", color2: "#0e7490", home: "dash.home",
      menus: [
        { label: "Dashboard", action: "dash.home" }
      ]
    }
  };
  // which app owns an action (for breadcrumb when navigated directly)
  var ACTION_APP = {
    dashboard: "accounting", "inv.out": "accounting", "inv.in": "accounting", "pay.in": "accounting",
    "pay.out": "accounting", cust: "accounting", vend: "accounting", moves: "accounting",
    accounts: "accounting", "rep.pl": "accounting", "rep.bs": "accounting", "rep.tb": "accounting",
    "rep.gl": "accounting", "rep.partner": "accounting", "rep.aged.recv": "accounting", "rep.aged.pay": "accounting", "rep.tax": "accounting", "rep.stmt": "accounting",
    "settings.setup": "settings", "settings.import": "settings", "platform.pending": "settings", companies: "settings", taxes: "settings", products: "sales", "so.list": "sales", "po.list": "purchase",
    "est.list": "estimation", "mfg.wo": "manufacturing", "mfg.boms": "manufacturing", "inst.jobs": "site", "doc.subs": "documents", "doc.rfis": "documents", "doc.trans": "documents",
    "pur.req": "purchase", "pur.sccert": "purchase", "pur.match": "purchase", "rfq.list": "purchase",
    "inv.outr": "accounting", "inv.inr": "accounting", rates: "settings", "rep.cons": "accounting", "rep.cashfwd": "accounting", "rep.collections": "accounting", cockpit: "accounting", "assets.list": "accounting", "budget.list": "accounting", "fu.levels": "accounting", bank: "accounting", appearance: "settings",
    "inv.onhand": "inventory", "inv.moves": "inventory", "inv.issues": "inventory", "inv.cats": "inventory", "inv.uoms": "inventory", wh: "inventory", "inv.reorder": "inventory", loc: "inventory", lots: "inventory",
    "inv.scrap": "inventory", "inv.storage": "inventory", "inv.putaway": "inventory", "inv.delivery": "inventory", "inv.packages": "inventory", "sale.pricelists": "sales", "sale.qtempl": "sales",
    "proj.list": "project", "task.list": "project", "ts.list": "project", "pc.list": "project", "var.list": "project", "sc.list": "project", "proj.pnl": "project", "proj.retention": "project", "proj.wip": "project", "proj.jobcost": "project", "cost.codes": "project",
    "crm.pipe": "crm", "crm.leads": "crm", "crm.stages": "crm",
    "hr.emp": "hr", "hr.dept": "hr", "hr.jobs": "hr", "hr.leaves": "hr", "hr.att": "hr", "hr.exp": "hr",
    "hr.contracts": "hr", "hr.roster": "hr", "hr.shifts": "hr", "hr.alloc": "hr", "hr.runs": "hr", "hr.slips": "hr", "hr.struct": "hr", "hr.heads": "hr", "hr.eos": "hr", "hr.payconsol": "hr",
    "hr.skills": "hr", "hr.empskills": "hr", "hr.certs": "hr", "hr.onboard": "hr", "hr.appraisals": "hr", "hr.planning": "hr", "hr.shifttmpl": "hr",
    contacts: "contacts", "contact.tags": "contacts", "settings.users": "settings", "settings.roles": "settings", "settings.numbering": "settings", "settings.lock": "settings", "approvals.inbox": "settings", "approvals.rules": "settings", "portal.admin": "settings",
    "cal.month": "calendar", "cal.agenda": "calendar", "sign.list": "sign", "rec.applicants": "recruitment", "kb.articles": "knowledge",
    "site.snags": "site", "site.insp": "site", "site.plant": "site", "site.diary": "site", "proj.schedule": "project", "proj.board": "project", "proj.mywork": "project",
    "dash.home": "insights"
  };
  // ============================ PERMISSIONS (RBAC) ============================
  // S.role is the resolved role row (from public.roles). full_access => god.
  // permissions jsonb: { "*":{v,m}, "<module>":{v,m,f:{feature:bool}} }.
  var MOD_ALIAS = { project: "projects", hr: "employees" };
  function modKey(appKey) { return MOD_ALIAS[appKey] || appKey; }
  // Every module + the "parts" that can be toggled on/off inside it (enforced ones only).
  var MODULE_CATALOG = [
    { key: "accounting", label: "Accounting", features: [["reporting", "Financial reports"]] },
    { key: "sales", label: "Sales", features: [] },
    { key: "purchase", label: "Purchase", features: [] },
    { key: "crm", label: "CRM", features: [] },
    { key: "estimation", label: "Estimation", features: [] },
    { key: "inventory", label: "Inventory", features: [] },
    { key: "projects", label: "Projects", features: [["delivery", "Delivery view"], ["execution", "Execution board"], ["costs", "Costs & P&L"]] },
    { key: "manufacturing", label: "Manufacturing", features: [] },
    { key: "documents", label: "Documents", features: [] },
    { key: "site", label: "Site Ops", features: [] },
    { key: "contacts", label: "Contacts", features: [] },
    { key: "calendar", label: "Calendar", features: [] },
    { key: "sign", label: "Sign", features: [] },
    { key: "recruitment", label: "Recruitment", features: [] },
    { key: "knowledge", label: "Knowledge", features: [] },
    { key: "employees", label: "Employees (HR)", features: [["payroll", "Payroll"]] },
    { key: "insights", label: "Insights", features: [] },
    { key: "settings", label: "Settings", features: [] }
  ];
  var MODULE_LABEL = {}; MODULE_CATALOG.forEach(function (m) { MODULE_LABEL[m.key] = m.label; });
  // action -> [module, feature] for the toggleable "parts" (clean in-module subsets only).
  var FEATURE_ACTIONS = {};
  (function () {
    ["rep.pl", "rep.bs", "rep.gl", "rep.tb", "rep.partner", "rep.aged.recv", "rep.aged.pay", "rep.tax", "rep.stmt", "rep.cons", "rep.cashfwd", "rep.collections", "budget.list", "cockpit", "dashboard"].forEach(function (a) { FEATURE_ACTIONS[a] = ["accounting", "reporting"]; });
    ["proj.list", "pc.list", "var.list", "proj.wip", "proj.schedule", "ts.list"].forEach(function (a) { FEATURE_ACTIONS[a] = ["projects", "delivery"]; });
    ["proj.board", "proj.mywork", "task.list"].forEach(function (a) { FEATURE_ACTIONS[a] = ["projects", "execution"]; });
    ["sc.list", "proj.pnl", "proj.retention", "proj.jobcost", "cost.codes"].forEach(function (a) { FEATURE_ACTIONS[a] = ["projects", "costs"]; });
    ["hr.runs", "hr.slips", "hr.struct", "hr.heads", "hr.eos", "hr.payconsol"].forEach(function (a) { FEATURE_ACTIONS[a] = ["employees", "payroll"]; });
  })();
  function moduleForAction(action) { var app = ACTION_APP[action] || S.app; return app ? modKey(app) : null; }
  function permFor(mod) {
    var r = S.role;
    if (!r) return { v: true, m: true };          // boot / owner fallback (never lock the owner out)
    if (r.full_access) return { v: true, m: true };
    var p = r.permissions || {};
    var e = p[mod] || p["*"] || { v: false, m: false };
    return { v: !!e.v, m: !!e.m };
  }
  function canView(mod) { return permFor(mod).v; }
  function canManage(mod) { return permFor(mod).m; }
  function canViewApp(appKey) { return canView(modKey(appKey)); }
  function canManageApp(appKey) { return canManage(modKey(appKey)); }
  function featureAllowed(action) {
    var fa = FEATURE_ACTIONS[action]; if (!fa) return true;
    var r = S.role; if (!r || r.full_access) return true;
    var mp = (r.permissions || {})[fa[0]]; if (!mp || !mp.f) return true;
    return mp.f[fa[1]] !== false;                  // parts are opt-out: allowed unless explicitly off
  }
  function canGo(action) {
    if (action.indexOf("platform.") === 0) return !!S.isPlatformAdmin;
    var mod = moduleForAction(action);
    if (mod && !canView(mod)) return false;
    if (!featureAllowed(action)) return false;
    return true;
  }
  function canSeeMoney() { return !S.role || S.role.can_see_money !== false; }
  function canManageRoles() { return !S.role || !!S.role.full_access || !!S.role.can_manage_roles; }
  function myRoleRank() { return S.role && typeof S.role.rank === "number" ? S.role.rank : 100; }
  // resolve the current user's role for the active company's org (org-specific first, then global template)
  async function loadRole() {
    try {
      if (!S.company || !S.company.org_id) return { slug: "owner", full_access: true, can_manage_roles: true, can_see_money: true, rank: 100 };
      var mem = (await sb.from("org_members").select("role").eq("org_id", S.company.org_id).eq("user_id", S.user.id).maybeSingle()).data;
      var slug = mem && mem.role ? mem.role : "owner";   // fail-open to owner (only ever hits owners in practice)
      var rows = (await sb.from("roles").select("*").eq("slug", slug).or("org_id.eq." + S.company.org_id + ",org_id.is.null")).data || [];
      var orgRole = rows.filter(function (r) { return r.org_id === S.company.org_id; })[0];
      var globalRole = rows.filter(function (r) { return !r.org_id; })[0];
      return orgRole || globalRole || { slug: slug, full_access: true, can_manage_roles: true, can_see_money: true, rank: 100 };
    } catch (e) { return { slug: "owner", full_access: true, can_manage_roles: true, can_see_money: true, rank: 100 }; }
  }
  // platform-operator "support mode": true when I'm an operator viewing a company outside my own orgs
  function isSupportView() { return !!(S.isPlatformAdmin && S.company && S.company.org_id && S.homeOrgIds && S.homeOrgIds.indexOf(S.company.org_id) < 0); }
  function maybeLogSupport() { if (isSupportView()) { try { sb.rpc("log_platform_access", { p_company: S.company.id }); } catch (e) { } } }
  function supportBarHTML() {
    if (!isSupportView()) return "";
    return '<div class="o-support" role="status"><span class="o-support-dot" aria-hidden="true"></span>Support mode &mdash; you are viewing <b>' + esc(S.company.name) + '</b>, which is not your organisation. Your access is logged.</div>';
  }
  var SOON = [["Website", "◐", "#2563eb"], ["Point of Sale", "▤", "#7c3aed"]];
  // Orbit brand module icons (viewBox 0 0 100 100, currentColor stroke so they work on any tile, exactly one blue AI dot).
  var APP_ICONS = {
    accounting: '<svg viewBox="0 0 100 100"><path d="M28 14 H72 V86 L64.7 80 L57.3 86 L50 80 L42.7 86 L35.3 80 L28 86 Z M38 30 H62 M38 42 H62 M38 54 H50" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter"/><circle cx="60" cy="66" r="5" fill="#2F6BFF"/></svg>',
    sales: '<svg viewBox="0 0 100 100"><path d="M8 34 H26 L42 48 M92 34 H74 L58 48 M8 62 H24 M92 62 H76 M40 60 L47 67 M52 55 L59 62" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter"/><path d="M42 48 L50 41 L66 55 L58 62 Z" fill="currentColor" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter"/><circle cx="50" cy="22" r="7" fill="#2F6BFF"/></svg>',
    purchase: '<svg viewBox="0 0 100 100"><path d="M24 38 H76 L70 80 H30 Z M38 38 C38 24 62 24 62 38" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="miter"/><circle cx="76" cy="26" r="7" fill="#2F6BFF"/></svg>',
    crm: '<svg viewBox="0 0 100 100"><circle cx="39" cy="52" r="21" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="63" cy="52" r="21" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="51" cy="23" r="7" fill="#2F6BFF"/></svg>',
    inventory: '<svg viewBox="0 0 100 100"><rect x="22" y="22" width="25" height="25" fill="none" stroke="currentColor" stroke-width="8"/><rect x="55" y="22" width="25" height="25" fill="none" stroke="currentColor" stroke-width="8"/><rect x="22" y="55" width="25" height="25" fill="none" stroke="currentColor" stroke-width="8"/><rect x="60" y="60" width="15" height="15" fill="currentColor" transform="rotate(45 67.5 67.5)"/><circle cx="84" cy="51" r="7" fill="#2F6BFF"/></svg>',
    project: '<svg viewBox="0 0 100 100"><path d="M 71 40 L 81 50 L 50 81 L 19 50 L 50 19 L 59 28" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="miter"/><rect x="43.5" y="43.5" width="13" height="13" fill="currentColor" transform="rotate(45 50 50)"/><circle cx="67" cy="32" r="7" fill="#2F6BFF"/></svg>',
    hr: '<svg viewBox="0 0 100 100"><circle cx="50" cy="34" r="13" fill="none" stroke="currentColor" stroke-width="8"/><path d="M24 80 C24 62 76 62 76 80" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="66" cy="22" r="7" fill="#2F6BFF"/></svg>',
    settings: '<svg viewBox="0 0 100 100"><path d="M44 12 H56 L58 22 A30 30 0 0 1 66.5 26.9 L76 23 L84 33 L78 41.5 A30 30 0 0 1 80 51 L89 56 L85 68 L74.9 67.4 A30 30 0 0 1 68.9 74.9 L71 85 L59.5 89 L54 80.4 A30 30 0 0 1 44.4 80 L38 88 L27 83 L29.9 73.2 A30 30 0 0 1 23.4 65.4 L13 65 L11 53 L20.5 49.7 A30 30 0 0 1 22.7 40 L16 32 L24 22.5 L33.6 26.6 A30 30 0 0 1 42 22 Z" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter"/><rect x="44" y="44" width="12" height="12" fill="currentColor" transform="rotate(45 50 50)"/><circle cx="76" cy="20" r="7" fill="#2F6BFF"/></svg>',
    estimation: '<svg viewBox="0 0 100 100"><rect x="28" y="14" width="44" height="72" rx="3" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="miter"/><path d="M38 28 H62" stroke="currentColor" stroke-width="7" fill="none"/><circle cx="42" cy="52" r="3.5" fill="currentColor"/><circle cx="58" cy="52" r="3.5" fill="currentColor"/><circle cx="42" cy="66" r="3.5" fill="currentColor"/><circle cx="58" cy="66" r="3.5" fill="currentColor"/><circle cx="42" cy="78" r="3.5" fill="currentColor"/><circle cx="58" cy="78" r="7" fill="#2F6BFF"/></svg>',
    manufacturing: '<svg viewBox="0 0 100 100"><path d="M38 12 H62 V36 L56 42 V64 H44 V42 L38 36 Z" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter" transform="rotate(-45 50 50)"/><path d="M44 64 H56 L51.5 86 H48.5 Z M46 12 V22 M54 12 V22" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter" transform="rotate(-45 50 50)"/><circle cx="78" cy="26" r="7" fill="#2F6BFF"/></svg>',
    installation: '<svg viewBox="0 0 100 100"><path d="M16 64 H84" stroke="currentColor" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M26 62 C26 34 74 34 74 62" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="miter"/><path d="M43 38 V28 H57 V38" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="miter"/><circle cx="74" cy="30" r="7" fill="#2F6BFF"/></svg>',
    documents: '<svg viewBox="0 0 100 100"><path d="M28 14 H62 L78 30 V86 H28 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="miter"/><path d="M62 14 V30 H78" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="miter"/><path d="M40 48 H64 M40 60 H60" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="66" cy="72" r="7" fill="#2F6BFF"/></svg>',
    contacts: '<svg viewBox="0 0 100 100"><rect x="22" y="18" width="56" height="64" rx="7" fill="none" stroke="currentColor" stroke-width="7"/><circle cx="50" cy="44" r="9" fill="none" stroke="currentColor" stroke-width="6"/><path d="M34 70 C34 58 66 58 66 70" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="72" cy="26" r="6" fill="#2F6BFF"/></svg>',
    site: '<svg viewBox="0 0 100 100"><rect x="26" y="20" width="48" height="64" rx="7" fill="none" stroke="currentColor" stroke-width="7"/><rect x="40" y="13" width="20" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="6"/><path d="M37 52 l8 8 17 -19" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="65" cy="73" r="6" fill="#2F6BFF"/></svg>',
    calendar: '<svg viewBox="0 0 100 100"><rect x="18" y="24" width="64" height="58" rx="8" fill="none" stroke="currentColor" stroke-width="7"/><path d="M18 40 H82" stroke="currentColor" stroke-width="7"/><path d="M34 15 V30 M66 15 V30" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle cx="63" cy="61" r="7" fill="#2F6BFF"/></svg>',
    sign: '<svg viewBox="0 0 100 100"><path d="M18 70 C34 70 38 36 52 36 C62 36 58 60 70 60 C76 60 78 54 80 50" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M16 84 H84" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle cx="82" cy="28" r="7" fill="#2F6BFF"/></svg>',
    recruitment: '<svg viewBox="0 0 100 100"><circle cx="46" cy="38" r="16" fill="none" stroke="currentColor" stroke-width="7"/><path d="M18 84 C18 60 74 60 74 84" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle cx="78" cy="34" r="8" fill="#2F6BFF"/></svg>',
    knowledge: '<svg viewBox="0 0 100 100"><path d="M50 30 C41 22 26 22 16 26 V76 C26 72 41 72 50 80 C59 72 74 72 84 76 V26 C74 22 59 22 50 30 Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/><path d="M50 30 V80" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="24" r="6" fill="#2F6BFF"/></svg>',
    insights: '<svg viewBox="0 0 100 100"><path d="M18 82 H86" stroke="currentColor" stroke-width="7" stroke-linecap="round" fill="none"/><rect x="26" y="52" width="13" height="26" fill="none" stroke="currentColor" stroke-width="6"/><rect x="47" y="38" width="13" height="40" fill="none" stroke="currentColor" stroke-width="6"/><rect x="68" y="24" width="13" height="54" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="74" cy="16" r="7" fill="#2F6BFF"/></svg>',
    "Manufacturing": '<svg viewBox="0 0 100 100"><path d="M38 12 H62 V36 L56 42 V64 H44 V42 L38 36 Z" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter" transform="rotate(-45 50 50)"/><path d="M44 64 H56 L51.5 86 H48.5 Z M46 12 V22 M54 12 V22" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="miter" transform="rotate(-45 50 50)"/><circle cx="78" cy="26" r="7" fill="#2F6BFF"/></svg>',
    "Website": '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="8"/><ellipse cx="50" cy="50" rx="14" ry="32" fill="none" stroke="currentColor" stroke-width="8"/><path d="M18 50 H82" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="76" cy="26" r="7" fill="#2F6BFF"/></svg>',
    "Point of Sale": '<svg viewBox="0 0 100 100"><path d="M30 18 H70 V74 L62 68 L54 74 L46 68 L38 74 L30 68 Z M40 36 H60 M40 48 H52" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="miter"/><circle cx="60" cy="48" r="5" fill="#2F6BFF"/></svg>'
  };

  // ============================ AUTH ============================
  // ORB-09 sign-in bot protection: dormant until a Cloudflare Turnstile SITE key is
  // present (set below or via window.APP_CONFIG.TURNSTILE_SITE_KEY). When set, the
  // login + signup render the widget and pass its token to Supabase; when empty,
  // auth behaves exactly as before (no widget, no token).
  var TURNSTILE_SITE_KEY = (window.APP_CONFIG && window.APP_CONFIG.TURNSTILE_SITE_KEY) || "0x4AAAAAAEUjGpVLqP-zNy-m";
  function mountTurnstile() {
    if (!TURNSTILE_SITE_KEY) return;
    window.__cfToken = "";
    var el = document.getElementById("cf-widget"); if (!el) return;
    function render() { try { window.turnstile.render(el, { sitekey: TURNSTILE_SITE_KEY, callback: function (t) { window.__cfToken = t; } }); } catch (e) {} }
    if (window.turnstile && window.turnstile.render) { render(); return; }
    if (!document.getElementById("cf-turnstile-js")) {
      window.__cfOnload = render;
      var s = document.createElement("script"); s.id = "cf-turnstile-js"; s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__cfOnload"; s.async = true; s.defer = true; document.head.appendChild(s);
    } else {
      var n = 0, iv = setInterval(function () { if (window.turnstile && window.turnstile.render) { clearInterval(iv); render(); } else if (++n > 50) clearInterval(iv); }, 100);
    }
  }
  function renderLogin(mode) {
    mode = mode || "in";
    root.innerHTML =
      '<div class="login"><div class="card">' +
      '<div class="brandrow"><div class="lockup">' + orbitLockup() + '</div><div class="byline">by Space Work</div></div>' +
      '<h1>' + (mode === "in" ? "Sign in to Orbit" : "Create your account") + "</h1>" +
      '<p class="sub">Business management for the built environment</p>' +
      '<label>Email</label><input id="email" type="email" autocomplete="username" placeholder="you@company.com">' +
      '<label>Password</label><input id="pw" type="password" autocomplete="current-password" placeholder="........">' +
      (TURNSTILE_SITE_KEY ? '<div id="cf-widget" style="margin-top:14px"></div>' : '') +
      '<div class="err" id="err"></div>' +
      '<button class="btn pri" id="go" style="width:100%;margin-top:14px;background:var(--accent);border-color:var(--accent)">' + (mode === "in" ? "Sign in" : "Sign up") + "</button>" +
      '<div class="switch">' + (mode === "in" ? 'No account yet? <a id="sw">Create one</a>' : 'Already have an account? <a id="sw">Sign in</a>') + "</div>" +
      "</div></div>";
    document.getElementById("sw").onclick = function () { renderLogin(mode === "in" ? "up" : "in"); };
    document.getElementById("go").onclick = doAuth.bind(null, mode);
    document.getElementById("pw").onkeydown = function (e) { if (e.key === "Enter") doAuth(mode); };
    mountTurnstile();
  }
  async function doAuth(mode) {
    var email = document.getElementById("email").value.trim();
    var pw = document.getElementById("pw").value;
    var err = document.getElementById("err"); err.textContent = "";
    if (!email || !pw) { err.textContent = "Enter your email and password."; return; }
    var creds = { email: email, password: pw };
    if (TURNSTILE_SITE_KEY) {
      if (!window.__cfToken) { err.textContent = "Please complete the verification below."; return; }
      creds.options = { captchaToken: window.__cfToken };
    }
    var res = mode === "in" ? await sb.auth.signInWithPassword(creds) : await sb.auth.signUp(creds);
    if (res.error) { err.textContent = res.error.message; if (TURNSTILE_SITE_KEY && window.turnstile) { try { window.turnstile.reset(); } catch (e) {} window.__cfToken = ""; } return; }
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
    // platform (operator) support access: am I an operator, and which orgs are truly mine?
    try {
      var pa = await sb.rpc("is_platform_admin"); S.isPlatformAdmin = !!(pa && pa.data);
      S.homeOrgIds = S.isPlatformAdmin ? ((await sb.rpc("my_home_orgs")).data || []) : null;
    } catch (e) { S.isPlatformAdmin = false; S.homeOrgIds = null; }
    if (!S.companies.length) { renderNoCompany(); return; }
    S.company = S.companies.filter(function (c) { return c.id === S.profile.active_company_id; })[0];
    // an operator with no active company set should land in one of their OWN orgs, not a tenant
    if (!S.company && S.isPlatformAdmin && S.homeOrgIds && S.homeOrgIds.length) S.company = S.companies.filter(function (c) { return S.homeOrgIds.indexOf(c.org_id) >= 0; })[0];
    if (!S.company) S.company = S.companies[0];
    if (S.company.org_id) S.org = (await sb.from("orgs").select("*").eq("id", S.company.org_id).maybeSingle()).data;
    if (S.org && (S.org.status === "pending" || S.org.status === "rejected") && !S.isPlatformAdmin) { renderPendingApproval(S.org.status); return; }
    S.role = await loadRole();
    S.types = (await sb.from("account_types").select("*")).data || [];
    maybeLogSupport();
    renderHome();
  }
  // First-run for a brand-new signup with no company yet: let them create their company
  // right here (calls the create_org_for_me RPC = org + owner membership + company), then
  // boot straight into the app (where the Getting-started checklist takes over).
  var TC_VERSION = "v1";
  // A brand-new signup applies for access: a few KYC questions + Terms acceptance.
  // apply_for_company creates a PENDING org; a Space Work admin approves within 6h.
  function renderNoCompany() {
    var ss = 'style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);color:var(--ink);font:inherit;font-size:14px"';
    var btypes = ["General contractor", "Subcontractor", "Property developer", "Consultant / engineering", "Facade / cladding", "Fit-out / interiors", "Supplier / trading", "Other"];
    var emps = ["1-5", "6-20", "21-50", "51-200", "200+"];
    root.innerHTML =
      '<div class="login"><div class="card" style="width:560px;max-width:100%;text-align:left">' +
      '<div class="brandrow"><div class="lockup">' + orbitLockup() + '</div><div class="byline">by Space Work</div></div>' +
      '<h1>Apply for access</h1>' +
      '<p class="sub">Welcome, ' + esc(S.user.email) + '. Tell us a little about your business. We review new accounts and email you within 6 hours.</p>' +
      '<label for="nc-name">Company name</label><input id="nc-name" placeholder="e.g. Skyline Facades SARL" autocomplete="organization">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label for="nc-country">Country</label><input id="nc-country" placeholder="e.g. Lebanon" autocomplete="country-name"></div><div><label for="nc-city">City <span class="muted" style="font-weight:400">(optional)</span></label><input id="nc-city" placeholder="e.g. Beirut"></div></div>' +
      '<label for="nc-btype">Business type</label><select id="nc-btype" ' + ss + '><option value="">Select...</option>' + btypes.map(function (b) { return '<option>' + b + '</option>'; }).join("") + '</select>' +
      '<label for="nc-scope">Scope of work</label><input id="nc-scope" placeholder="e.g. Aluminium &amp; glazing facades, curtain walling">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label for="nc-emp">Number of employees</label><select id="nc-emp" ' + ss + '><option value="">Select...</option>' + emps.map(function (e) { return '<option>' + e + '</option>'; }).join("") + '</select></div><div><label for="nc-phone">Contact phone</label><input id="nc-phone" placeholder="+961 ..." autocomplete="tel"></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label for="nc-reg">Registration / Tax no. <span class="muted" style="font-weight:400">(optional)</span></label><input id="nc-reg"></div><div><label for="nc-cur">Currency</label><input id="nc-cur" value="USD" maxlength="3" style="text-transform:uppercase"></div></div>' +
      '<label style="display:flex;align-items:flex-start;gap:9px;margin-top:14px;font-size:13px;color:var(--ink2);font-weight:400"><input type="checkbox" id="nc-tc" style="margin-top:3px"><span>I have read and agree to the <a id="nc-terms" style="cursor:pointer">Terms &amp; Conditions</a> on behalf of my company.</span></label>' +
      '<div class="err" id="nc-err" role="alert"></div>' +
      '<button class="btn pri" id="nc-create" style="width:100%;margin-top:14px;background:var(--accent);border-color:var(--accent)">Submit application</button>' +
      '<div class="switch">Signed in as ' + esc(S.user.email) + ' &middot; <a id="nc-out">Sign out</a></div>' +
      '</div></div>';
    document.getElementById("nc-name").focus();
    document.getElementById("nc-out").onclick = signOut;
    document.getElementById("nc-terms").onclick = openTermsModal;
    var create = document.getElementById("nc-create");
    create.onclick = async function () {
      var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var err = document.getElementById("nc-err"); err.textContent = "";
      var name = g("nc-name"), country = g("nc-country"), btype = g("nc-btype"), scope = g("nc-scope"), emp = g("nc-emp"), phone = g("nc-phone");
      if (!name) { err.textContent = "Enter your company name."; return; }
      if (!country) { err.textContent = "Enter your country."; return; }
      if (!btype) { err.textContent = "Select your business type."; return; }
      if (!scope) { err.textContent = "Describe your scope of work."; return; }
      if (!emp) { err.textContent = "Select your number of employees."; return; }
      if (!phone) { err.textContent = "Enter a contact phone."; return; }
      if (!document.getElementById("nc-tc").checked) { err.textContent = "Please accept the Terms & Conditions to continue."; return; }
      create.disabled = true; create.textContent = "Submitting...";
      var res = await sb.rpc("apply_for_company", { p_company: name, p_country: country, p_business_type: btype, p_scope: scope, p_employees: emp, p_phone: phone, p_city: g("nc-city"), p_reg_no: g("nc-reg"), p_currency: (g("nc-cur") || "USD").toUpperCase().slice(0, 3) || "USD", p_tc_version: TC_VERSION });
      if (res.error || !res.data) { err.textContent = "Could not submit: " + ((res.error && res.error.message) || "unexpected error") + "."; create.disabled = false; create.textContent = "Submit application"; return; }
      boot(); // -> pending gate -> renderPendingApproval
    };
  }
  function renderPendingApproval(status) {
    var rejected = status === "rejected";
    root.innerHTML = '<div class="login"><div class="card" style="text-align:center">' +
      '<div class="brandrow" style="justify-content:center"><div class="lockup">' + orbitLockup() + '</div></div>' +
      '<div style="font-size:38px;margin:6px 0">' + (rejected ? "&#9888;&#65039;" : "&#9203;") + '</div>' +
      '<h1 style="font-size:20px">' + (rejected ? "Application not approved" : "Application received") + '</h1>' +
      '<p class="sub">' + (rejected
        ? "Your account was not approved. If you think this is a mistake, reply to our email or contact us."
        : "Thanks, " + esc(S.user.email) + ". Your account is under review &mdash; we&rsquo;ll email you within <b>6 hours</b>. You can close this window; sign back in after you hear from us.") + '</p>' +
      '<button class="btn" id="pa-out" style="margin-top:14px">Sign out</button>' +
      '</div></div>';
    document.getElementById("pa-out").onclick = signOut;
  }
  function termsHtml() {
    return '<p class="muted" style="margin-top:0">Last updated 19 August 2026 &middot; version ' + TC_VERSION + '</p><ol style="padding-left:18px;font-size:13.5px;line-height:1.6">' +
      '<li><b>Parties.</b> These Terms are an agreement between <b>SPACE WORK S.A.R.L</b>, a company registered in Lebanon (Commercial Registration No. 1032139), registered office at CityGate, Sioufi, Ashrafieh, Beirut, Lebanon ("Space Work", "we", "us"), and the company or organisation that registers for an account ("you").</li>' +
      '<li><b>The service.</b> Orbit is a cloud-based construction and business-management platform ("the Service"), provided on an "as is" and "as available" basis. Access requires that we review and approve your application. We may add, change or withdraw features.</li>' +
      '<li><b>Your account &amp; your data.</b> You are responsible for your account, the users you invite, and the accuracy and lawfulness of the data you enter. You retain ownership of your data; you grant us the limited rights needed to host, process, back up and operate the Service for you. You can request an export or deletion of your data by emailing info@spacework.ai.</li>' +
      '<li><b>Acceptable use.</b> You must not use the Service unlawfully, attempt to breach its security or access other customers&rsquo; data, upload malware, or resell or provide the Service to third parties without our written agreement.</li>' +
      '<li><b>Fees.</b> Orbit is currently provided <b>free of charge</b>, with no ongoing commitment. We may introduce fees in future; if we do, we will give reasonable notice, and you may stop using the Service if you do not wish to accept them.</li>' +
      '<li><b>Privacy &amp; security.</b> We process personal data only to provide and improve the Service, and apply reasonable technical and organisational security measures, consistent with applicable data-protection law (including the GDPR and CCPA where they apply). We do not sell your data. For any privacy request, contact info@spacework.ai.</li>' +
      '<li><b>Availability &amp; liability.</b> We aim for high availability but do not warrant that the Service will be uninterrupted or error-free. To the maximum extent permitted by law, Space Work is not liable for indirect or consequential loss, or loss of profit or data; and as the Service is provided free of charge, our total liability is limited to the greatest extent the law allows. You remain responsible for keeping your own records.</li>' +
      '<li><b>Suspension &amp; termination.</b> We may suspend or terminate access that breaches these Terms, poses a security risk, or where an application is not approved. You may stop using the Service and close your account at any time.</li>' +
      '<li><b>Changes to these Terms.</b> We may update these Terms from time to time; the current version is shown at sign-up, and continued use of the Service means you accept the version in force.</li>' +
      '<li><b>Governing law.</b> These Terms are governed by the laws of <b>Lebanon</b>, and any dispute is subject to the competent courts of <b>Beirut</b>.</li>' +
      '<li><b>Contact.</b> Space Work S.A.R.L &mdash; info@spacework.ai.</li>' +
      '</ol>';
  }
  function openTermsModal() {
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet" style="max-width:640px"><h3>Terms &amp; Conditions</h3><div class="form" style="max-height:60vh;overflow:auto">' + termsHtml() + '</div><div class="foot"><button class="btn pri" id="tc-close" style="background:var(--accent);border-color:var(--accent)">Close</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("tc-close").onclick = function () { m.remove(); };
  }

  // ======================= APP SWITCHER (HOME) =======================
  function renderHome() {
    S.app = null; S.action = null;
    var tiles = Object.keys(APPS).filter(function (k) { return canViewApp(k); }).map(function (k) {
      var a = APPS[k];
      return '<button class="o-tile" data-app="' + k + '" aria-label="Open ' + esc(a.name) + '"><span class="ic" aria-hidden="true">' + (APP_ICONS[k] || a.icon) + '</span><span class="nm">' + esc(a.name) + '</span></button>';
    }).join("");
    var soon = SOON.map(function (s) {
      return '<div class="o-tile soon" aria-disabled="true"><span class="ic" aria-hidden="true">' + (APP_ICONS[s[0]] || s[1]) + '</span><span class="nm">' + esc(s[0]) + '</span></div>';
    }).join("");
    var initials = (S.user.email || "?").slice(0, 2).toUpperCase();
    root.innerHTML =
      '<div class="o-home">' + supportBarHTML() +
      '<div class="o-home-top"><div class="lockup">' + orbitLockup() + '</div><span class="muted" style="font-size:12.5px">&nbsp; ' + esc(S.org ? S.org.name : "") + '</span>' +
      '<div style="margin-left:auto;display:flex;align-items:center;gap:8px">' + companySelectHTML("home") + '<div class="o-ava" id="ava" style="background:var(--accent-soft);color:var(--accent)">' + initials + '</div></div></div>' +
      '<div class="o-grid">' + tiles + soon + '</div></div>';
    root.querySelectorAll(".o-tile[data-app]").forEach(function (t) { t.onclick = function () { openApp(t.dataset.app); }; });
    wireCompanySelect("home");
    document.getElementById("ava").onclick = function (e) { openAvatarMenu(e.currentTarget); };
    applyFontScale();
    homeDashInject();
    setupBannerInject();
  }
  // ORB-11: a compact owner/manager KPI strip on the home, above the app grid (money roles only)
  async function homeDashInject() {
    try {
      if (!S.company || !canView("accounting")) return;   // money values self-mask via money() for hidden roles
      var cid = S.company.id, cc = S.company.currency_code, td = today();
      var invs = (await sb.from("invoices").select("amount_residual,due_date,state,move_type").eq("company_id", cid).eq("move_type", "out_invoice").eq("state", "posted")).data || [];
      var recv = 0, overdue = 0;
      invs.forEach(function (i) { var r = Number(i.amount_residual) || 0; if (r > 0.005) { recv += r; if (i.due_date && i.due_date < td) overdue += r; } });
      var projN = ((await sb.from("projects").select("id", { count: "exact", head: true }).eq("company_id", cid).eq("is_active", true)).count) || 0;
      var poRows = (await sb.from("purchase_orders").select("amount_total,state").eq("company_id", cid)).data || [];
      var openPO = poRows.filter(function (p) { return ["sent", "purchase"].indexOf(p.state) >= 0; }).reduce(function (s, p) { return s + (Number(p.amount_total) || 0); }, 0);
      var grid = root.querySelector(".o-grid"); if (!grid) return;
      var cards = [["Receivable", cc + " " + money(recv), "rep.aged.recv"], ["Overdue", cc + " " + money(overdue), "rep.aged.recv", overdue > 0.005], ["Active projects", String(projN), "proj.list"], ["Committed (open POs)", cc + " " + money(openPO), "po.list"]];
      var html = '<div class="o-hd">' + cards.map(function (c) { return '<button class="o-hd-k" data-go="' + c[2] + '" aria-label="' + esc(c[0]) + '"><div class="o-hd-v' + (c[3] ? " bad" : "") + '">' + esc(c[1]) + '</div><div class="o-hd-l">' + esc(c[0]) + '</div></button>'; }).join("") + '</div>';
      grid.insertAdjacentHTML("beforebegin", html);
      root.querySelectorAll(".o-hd-k[data-go]").forEach(function (b) { b.onclick = function () { goApp(b.dataset.go); }; });
    } catch (e) { /* dashboard strip is best-effort */ }
  }

  function openApp(key) {
    if (!canViewApp(key)) { toast("You do not have access to " + (APPS[key] ? APPS[key].name : key)); return; }
    S.app = key;
    applyAppColor();
    go(APPS[key].home);
  }

  // ============================ SHELL ============================
  // small line-icon for a sidebar menu item, chosen by keyword; decorative (aria-hidden)
  function svgIc(inner) { return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>'; }
  function menuIcon(t) {
    t = (t || "").toLowerCase();
    var map = [
      [/dash|cockpit|insight|report|overview|p&l|balance|ledger|trial|aged|wip|consolidat|vat|analytic/, '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'],
      [/customer|vendor|contact|employee|applicant|user|team|member|supplier|department/, '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'],
      [/invoice|bill|quotation|order|certificate|submittal|rfi|transmittal|article|document|payslip|journal|statement|\bmove|requisition|note/, '<path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h4"/>'],
      [/payment|account|budget|\btax|exchange|\brate|pricelist|salary|payroll|expense|retention|cash|collection|dunning|follow|advance/, '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.6c0-1.4 5-1.4 5 .2s-5 .6-5 2.4 5 1.4 5 0"/>'],
      [/product|inventory|stock|\bbom|warehouse|\blot|serial|material|scrap|package|\buom|categor|putaway|storage|replenish|reorder|on hand/, '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>'],
      [/project|task|execution|programme|breakdown|my work|sprint/, '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'],
      [/calendar|agenda|planning|shift|attendance|roster|time off|allocation|timesheet/, '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>'],
      [/config|setting|compan|appearance|period lock|numbering/, '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'],
      [/sign|signature/, '<path d="M3 17c4 0 4-10 8-10s2 8 5 8 3-4 5-4"/><path d="M3 21h18"/>'],
      [/knowledge|method statement/, '<path d="M4 4h9a3 3 0 013 3v13a2 2 0 00-2-2H4z"/><path d="M20 4h-4a2 2 0 00-2 2"/>'],
      [/snag|inspection|plant|equipment|site diary|install|qhse|safety|foreman/, '<path d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>'],
      [/role|permission|approval/, '<path d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6z"/>'],
      [/pipeline|lead|stage|\bcrm/, '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>'],
      [/work order|manufactur|fabricat/, '<path d="M14 7a4 4 0 00-5.5 5.2l-5 5a2 2 0 002.8 2.8l5-5A4 4 0 0017 10l-2 2-2-2 2-2z"/>'],
      [/portal/, '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],
      [/tender|estimat/, '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>']
    ];
    for (var i = 0; i < map.length; i++) if (map[i][0].test(t)) return svgIc(map[i][1]);
    return svgIc('<circle cx="12" cy="12" r="2.5"/>');
  }
  // distinct icons pool: if two items in the same menu would share an icon, the
  // builder pulls the next unused one from here so no two items look the same.
  var FALLBACK_POOL = [
    '<path d="M4 15a8 8 0 0116 0"/><path d="M12 15l4-3"/>',
    '<path d="M4 20V5M4 20h16"/><path d="M8 16l3-4 3 2 4-6"/>',
    '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5"/>',
    '<rect x="1.5" y="6" width="12" height="10" rx="1"/><path d="M13.5 9h4l3.5 3.5V16h-7.5z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    '<path d="M5 4h11a2 2 0 012 2v15H7a2 2 0 01-2-2z"/><path d="M9 4v15"/>',
    '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M10 10v8M14 10v8M19 10v8M3 20.5h18"/>',
    '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2"/>',
    '<path d="M4 5h16M8 10h12M12 15h8M4 5v14"/>',
    '<path d="M12 3v18M5 21h14M4 8h16"/><path d="M4 8l-1.6 4a2.6 2.6 0 005.2 0zM20 8l-1.6 4a2.6 2.6 0 005.2 0z"/>',
    '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    '<path d="M3 12c3-4 6 4 9 0s6-4 9 0"/><path d="M3 17c3-4 6 4 9 0s6-4 9 0"/>',
    '<circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/><path d="M6 18L18 6"/>',
    '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    '<path d="M4 8h12l-3-3M20 16H8l3 3"/>',
    '<path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 21a2 2 0 004 0"/>',
    '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="11" rx="1"/><rect x="17" y="4" width="4" height="7" rx="1"/>',
    '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h4"/>',
    '<path d="M4 6h8M4 12h12M4 18h6"/><path d="M4 4v16"/>',
    '<path d="M14 7a4 4 0 00-5.5 5.2l-5 5a2 2 0 002.8 2.8l5-5A4 4 0 0017 10l-2 2-2-2z"/>',
    '<path d="M4 16a8 8 0 0116 0"/><path d="M4 16h16"/><path d="M9 8V5h6v3"/>',
    '<path d="M5 21V4M5 4h11l-2 3 2 3H5"/>',
    '<path d="M3 21V10l9-5 9 5v11"/><path d="M8 21v-6h8v6"/>',
    '<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c0-1.5 1.5-2.5 2.5-2.5s2.5 1 2.5 2.5M14 9h4M14 12h4"/>',
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18"/>',
    '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    '<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h4"/>',
    '<path d="M3 6h6l2 2h10v11H3z"/>',
    '<path d="M4 4h16v6H4zM4 14h16v6H4z"/>'
  ];
  // keep the sidebar's active item in sync as you navigate within an app
  function highlightSide() {
    var side = document.getElementById("oside"); if (!side) return;
    side.querySelectorAll(".o-si").forEach(function (b) {
      var on = b.dataset.go === S.action;
      b.classList.toggle("on", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    var act = side.querySelector(".o-si.o-si-sub.on");
    if (act) { var sub = act.closest(".o-sub"); if (sub && sub.hasAttribute("hidden")) { sub.removeAttribute("hidden"); var grp = sub.previousElementSibling; if (grp) grp.setAttribute("aria-expanded", "true"); } }
  }
  function renderShell() {
    var a = APPS[S.app];
    if (S.sideCollapsed === undefined) { var _ss = localStorage.getItem("orbit_side"); S.sideCollapsed = _ss === null ? (window.innerWidth <= 760) : _ss === "1"; }
    var initials = (S.user.email || "?").slice(0, 2).toUpperCase();
    function menuItemVisible(action) { return action === "settings.roles" ? canManageRoles() : canGo(action); }
    var vmenus = a.menus.map(function (m) {
      if (m.items) { var its = m.items.filter(function (it) { return menuItemVisible(it[1]); }); return its.length ? { label: m.label, items: its } : null; }
      return menuItemVisible(m.action) ? m : null;
    }).filter(Boolean);
    var usedSvg = {};
    function pickIcon(label) {
      var s = menuIcon(label);
      if (usedSvg[s]) { for (var k = 0; k < FALLBACK_POOL.length; k++) { var f = svgIc(FALLBACK_POOL[k]); if (!usedSvg[f]) { s = f; break; } } }
      usedSvg[s] = 1; return s;
    }
    function siItem(action, label, sub) {
      return '<button class="o-si' + (sub ? " o-si-sub" : "") + '" data-go="' + action + '" aria-label="' + esc(label) + '" title="' + esc(label) + '"><span class="o-si-ic">' + pickIcon(label) + '</span><span class="o-si-l">' + esc(label) + '</span></button>';
    }
    var side = vmenus.map(function (m, i) {
      if (m.items) {
        var open = m.items.some(function (it) { return it[1] === S.action; });
        var subs = m.items.map(function (it) { return siItem(it[1], it[0], true); }).join("");
        return '<div class="o-sgrp"><button class="o-si o-si-grp" data-grp="' + i + '" aria-expanded="' + (open ? "true" : "false") + '"><span class="o-si-l">' + esc(m.label) + '</span><span class="o-si-caret" aria-hidden="true">&#8250;</span></button><div class="o-sub" data-sub="' + i + '"' + (open ? "" : " hidden") + '>' + subs + '</div></div>';
      }
      return siItem(m.action, m.label, false);
    }).join("");
    root.innerHTML =
      '<div class="o-app' + (isSupportView() ? " has-support" : "") + '">' + supportBarHTML() +
      '<a href="#o-main" class="o-skip">Skip to content</a>' +
      '<header class="o-navbar">' +
      '<button class="o-waffle" id="waffle" title="All apps" aria-label="All apps">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="6" height="6" rx="1.4"/><rect x="9.5" y="2" width="6" height="6" rx="1.4"/><rect x="17" y="2" width="6" height="6" rx="1.4"/><rect x="2" y="9.5" width="6" height="6" rx="1.4"/><rect x="9.5" y="9.5" width="6" height="6" rx="1.4"/><rect x="17" y="9.5" width="6" height="6" rx="1.4"/><rect x="2" y="17" width="6" height="6" rx="1.4"/><rect x="9.5" y="17" width="6" height="6" rx="1.4"/><rect x="17" y="17" width="6" height="6" rx="1.4"/></svg>' +
      '</button>' +
      '<span class="o-brandmark" title="Orbit">' + orbitMark() + '</span>' +
      '<span class="o-appname">' + esc(a.name) + '</span>' +
      '<div class="o-gs"><input id="o-gs-in" type="text" placeholder="Search records..." aria-label="Search records" autocomplete="off"><div class="o-gs-dd" id="o-gs-dd"></div></div>' +
      '<div class="o-systray">' + companySelectHTML("bar") + bellHTML() + '<button class="o-ava" id="ava" aria-label="Account menu">' + initials + '</button></div>' +
      '</header>' +
      '<div class="o-shell">' +
      '<nav class="o-side' + (S.sideCollapsed ? " collapsed" : "") + '" id="oside" aria-label="' + esc(a.name) + ' menu">' +
      '<div class="o-side-items">' + side + '</div>' +
      '<button class="o-side-toggle" id="osidetoggle" aria-label="' + (S.sideCollapsed ? "Expand menu" : "Collapse menu") + '" title="' + (S.sideCollapsed ? "Expand menu" : "Collapse menu") + '"><span class="o-side-tg-ic" aria-hidden="true">&#8249;</span><span class="o-si-l">Collapse</span></button>' +
      '</nav>' +
      '<main id="o-main" tabindex="-1" style="overflow:hidden"></main>' +
      '</div>' +
      '</div>';
    document.getElementById("waffle").onclick = renderHome;
    var _gs = document.getElementById("o-gs-in");
    if (_gs) { var _gt; _gs.oninput = function () { var v = this.value; clearTimeout(_gt); _gt = setTimeout(function () { runGlobalSearch(v); }, 250); }; _gs.onblur = function () { setTimeout(function () { var d = document.getElementById("o-gs-dd"); if (d) d.style.display = "none"; }, 180); }; _gs.onfocus = function () { if (this.value.trim().length > 1) { var d = document.getElementById("o-gs-dd"); if (d && d.innerHTML) d.style.display = "block"; } }; }
    document.getElementById("ava").onclick = function (e) { openAvatarMenu(e.currentTarget); };
    var _bell = document.getElementById("bell"); if (_bell) _bell.onclick = function (e) { openNotifPanel(e.currentTarget); };
    refreshBell();
    if (window._bellIv) clearInterval(window._bellIv);
    window._bellIv = setInterval(function () { if (document.getElementById("bell")) refreshBell(); }, 45000);
    wireCompanySelect("bar");
    document.querySelectorAll("#oside .o-si[data-go]").forEach(function (b) { b.onclick = function () { go(b.dataset.go); if (window.innerWidth <= 760 && !S.sideCollapsed) { S.sideCollapsed = true; var sd0 = document.getElementById("oside"); if (sd0) sd0.classList.add("collapsed"); } }; });
    document.querySelectorAll("#oside .o-si-grp").forEach(function (b) { b.onclick = function () { var sub = document.querySelector('.o-sub[data-sub="' + b.dataset.grp + '"]'); if (!sub) return; if (sub.hasAttribute("hidden")) { sub.removeAttribute("hidden"); b.setAttribute("aria-expanded", "true"); } else { sub.setAttribute("hidden", ""); b.setAttribute("aria-expanded", "false"); } }; });
    var _stg = document.getElementById("osidetoggle");
    if (_stg) _stg.onclick = function () { S.sideCollapsed = !S.sideCollapsed; var sd = document.getElementById("oside"); if (sd) sd.classList.toggle("collapsed", S.sideCollapsed); localStorage.setItem("orbit_side", S.sideCollapsed ? "1" : "0"); _stg.setAttribute("aria-label", S.sideCollapsed ? "Expand menu" : "Collapse menu"); _stg.setAttribute("title", S.sideCollapsed ? "Expand menu" : "Collapse menu"); };
    applyAppColor(); applyFontScale(); highlightSide();
  }
  // ORB-19: global search across records, from the top bar
  async function runGlobalSearch(q) {
    var dd = document.getElementById("o-gs-dd"); if (!dd || !S.company) return;
    q = (q || "").trim();
    if (q.length < 2) { dd.innerHTML = ""; dd.style.display = "none"; return; }
    var like = "%" + q.replace(/[%,_]/g, " ") + "%", cid = S.company.id, oid = S.company.org_id, results = [];
    function P(ok, builder) { return ok ? builder() : Promise.resolve({ data: [] }); }
    try {
      var res = await Promise.all([
        P(canView("accounting") || canView("contacts"), function () { return sb.from("partners").select("id,name,is_customer,is_vendor").eq("org_id", oid).ilike("name", like).limit(6); }),
        P(canView("projects"), function () { return sb.from("projects").select("id,name").eq("company_id", cid).ilike("name", like).limit(6); }),
        P(canView("accounting"), function () { return sb.from("invoices").select("id,number,move_type").eq("company_id", cid).ilike("number", like).limit(6); }),
        P(canView("purchase"), function () { return sb.from("purchase_orders").select("id,number").eq("company_id", cid).ilike("number", like).limit(6); }),
        P(canView("sales") || canView("inventory"), function () { return sb.from("products").select("id,name,default_code").eq("company_id", cid).ilike("name", like).limit(6); })
      ]);
      (res[0].data || []).forEach(function (p) { results.push({ type: "partner", id: p.id, label: p.name, sub: p.is_customer ? "Customer" : (p.is_vendor ? "Vendor" : "Contact"), extra: p.is_vendor && !p.is_customer ? "vendor" : "customer" }); });
      (res[1].data || []).forEach(function (p) { results.push({ type: "project", id: p.id, label: p.name, sub: "Project" }); });
      (res[2].data || []).forEach(function (i) { results.push({ type: "invoice", id: i.id, label: i.number || "Draft", sub: i.move_type === "in_invoice" ? "Bill" : (i.move_type === "out_refund" ? "Credit note" : "Invoice"), extra: i.move_type || "out_invoice" }); });
      (res[3].data || []).forEach(function (o) { results.push({ type: "po", id: o.id, label: o.number || "Draft", sub: "Purchase order" }); });
      (res[4].data || []).forEach(function (p) { results.push({ type: "product", id: p.id, label: p.name, sub: p.default_code ? "Item · " + p.default_code : "Item" }); });
    } catch (e) { }
    if (!results.length) { dd.innerHTML = '<div class="o-gs-empty">No matches for “' + esc(q) + '”</div>'; dd.style.display = "block"; return; }
    dd.innerHTML = results.slice(0, 24).map(function (r) { return '<button class="o-gs-item" data-type="' + r.type + '" data-id="' + r.id + '" data-extra="' + (r.extra || "") + '"><span class="o-gs-l">' + esc(r.label) + '</span><span class="o-gs-s">' + esc(r.sub) + '</span></button>'; }).join("");
    dd.style.display = "block";
    dd.querySelectorAll(".o-gs-item").forEach(function (b) { b.onmousedown = function (e) { e.preventDefault(); openRecord(b.dataset.type, b.dataset.id, b.dataset.extra); }; });
  }
  function openRecord(type, id, extra) {
    var dd = document.getElementById("o-gs-dd"); if (dd) { dd.style.display = "none"; dd.innerHTML = ""; }
    var gin = document.getElementById("o-gs-in"); if (gin) gin.value = "";
    var appFor = { partner: "accounting", project: "project", invoice: "accounting", po: "purchase", product: "sales" };
    var app = appFor[type] || "accounting";
    if (app !== S.app) { S.app = app; applyAppColor(); renderShell(); }
    if (type === "partner") renderPartnerForm(id, extra || "customer");
    else if (type === "project") renderProjectForm(id);
    else if (type === "invoice") renderInvoiceForm(id, extra || "out_invoice");
    else if (type === "po") renderOrderForm(id, "purchase");
    else if (type === "product") renderProductForm(id);
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
      resetSeqCache();
      if (S.company.org_id) S.org = (await sb.from("orgs").select("*").eq("id", S.company.org_id).maybeSingle()).data;
      S.role = await loadRole();
      maybeLogSupport();
      await sb.from("profiles").update({ active_company_id: S.company.id }).eq("id", S.user.id);
      if (S.app && !canViewApp(S.app)) { renderHome(); return; }
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
    if (e.target.closest("[data-dd]") || e.target.closest(".mi") || e.target.closest("#ava") || e.target.closest("#bell") || e.target.closest(".o-filtbtn")) return;
    closeDropdowns();
  });

  // ============================ NOTIFICATIONS ============================
  function bellHTML() {
    return '<button class="o-bell" id="bell" title="Notifications"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><span class="o-bell-dot" id="bell-dot" style="display:none"></span></button>';
  }
  async function refreshBell() {
    var dot = document.getElementById("bell-dot"); if (!dot) return;
    try {
      var r = await sb.from("notifications").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("is_read", false);
      var n = r.count || 0;
      if (n > 0) { dot.style.display = "flex"; dot.textContent = n > 9 ? "9+" : String(n); } else dot.style.display = "none";
    } catch (e) {}
  }
  async function notify(opts) {
    try {
      await sb.from("notifications").insert({
        company_id: opts.company_id || S.company.id, kind: opts.kind || "system",
        title: opts.title || "", body: opts.body || "", link_action: opts.link_action || null,
        link_id: opts.link_id || null, employee_id: opts.employee_id || null, user_id: opts.user_id || null,
        actor_name: opts.actor_name || (S.user && S.user.email) || ""
      });
    } catch (e) {}
  }
  async function openNotifPanel(anchor) {
    closeDropdowns();
    var r = anchor.getBoundingClientRect();
    var dd = document.createElement("div"); dd.className = "o-dd o-notif"; dd.dataset.dd = "1";
    dd.style.right = (window.innerWidth - r.right) + "px"; dd.style.left = "auto";
    dd.innerHTML = '<div class="o-notif-h">Notifications<button class="o-notif-all" id="nt-all">Mark all read</button></div><div class="o-notif-list" id="nt-list"><div class="o-notif-empty">Loading...</div></div>';
    document.body.appendChild(dd);
    var rows = (await sb.from("notifications").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).limit(40)).data || [];
    var list = document.getElementById("nt-list");
    if (!rows.length) { list.innerHTML = '<div class="o-notif-empty">You are all caught up.</div>'; }
    else list.innerHTML = rows.map(function (n) {
      return '<button class="o-notif-i' + (n.is_read ? "" : " unread") + '" data-id="' + n.id + '" data-act="' + esc(n.link_action || "") + '" data-lid="' + (n.link_id || "") + '"><div class="o-notif-t">' + esc(n.title) + '</div>' + (n.body ? '<div class="o-notif-b">' + esc(n.body) + '</div>' : "") + '<div class="o-notif-w">' + esc(n.actor_name || "") + (n.actor_name ? " &middot; " : "") + agWhen(n.created_at) + '</div></button>';
    }).join("");
    document.getElementById("nt-all").onclick = async function () { await sb.from("notifications").update({ is_read: true }).eq("company_id", S.company.id).eq("is_read", false); closeDropdowns(); refreshBell(); };
    list.querySelectorAll(".o-notif-i").forEach(function (b) { b.onclick = async function () { await sb.from("notifications").update({ is_read: true }).eq("id", b.dataset.id); closeDropdowns(); refreshBell(); notifOpen(b.dataset.act, b.dataset.lid); }; });
  }
  async function notifOpen(act, lid) {
    if (!act) return;
    if (act === "task" && lid) { var t = (await sb.from("project_tasks").select("project_id").eq("id", lid).maybeSingle()).data; if (t) { AGS.proj = t.project_id; go("proj.board"); setTimeout(function () { openTaskPanel(lid, t.project_id); }, 350); } return; }
    go(act);
  }

  // ============================ APPROVALS ============================
  var APPR_DOC_LABEL = { purchase_order: "Purchase order", sales_order: "Sales order", vendor_bill: "Vendor bill", customer_invoice: "Customer invoice", subcontract: "Subcontract", variation: "Variation", expense: "Expense" };
  // Returns "ok" (allowed to post) or "blocked" (approval requested / awaiting).
  async function approvalGate(docType, docId, docNumber, amount, backAction) {
    var rules = (await sb.from("approval_rules").select("*").eq("company_id", S.company.id).eq("doc_type", docType).eq("is_active", true)).data || [];
    var matching = rules.filter(function (r) { return Number(amount || 0) >= Number(r.min_amount || 0); });
    if (!matching.length) return "ok";
    var rule = matching.sort(function (a, b) { return Number(b.min_amount) - Number(a.min_amount); })[0];
    var ex = (await sb.from("approvals").select("*").eq("doc_type", docType).eq("doc_id", docId).order("created_at", { ascending: false }).limit(1)).data || [];
    var a = ex[0];
    if (a && a.status === "approved") return "ok";
    if (a && a.status === "pending") { toast("Already awaiting approval"); return "blocked"; }
    await sb.from("approvals").insert({ company_id: S.company.id, rule_id: rule.id, doc_type: docType, doc_id: docId, doc_number: docNumber || "", doc_amount: Number(amount) || 0, requested_by: (S.user && S.user.email) || "", status: "pending", link_action: backAction || null });
    notify({ kind: "approval_request", employee_id: rule.approver_employee_id || null, title: "Approval needed: " + (docNumber || APPR_DOC_LABEL[docType] || docType), body: S.company.currency_code + " " + money(amount) + " " + (APPR_DOC_LABEL[docType] || docType), link_action: "approvals.inbox" });
    toast("Sent for approval (" + S.company.currency_code + " " + money(amount) + ")");
    return "blocked";
  }
  async function renderApprovalsInbox() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Approvals") + '<div class="gap"></div><button class="o-filtbtn" id="ap-rules">Approval rules</button></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    document.getElementById("ap-rules").onclick = function () { go("approvals.rules"); };
    var rows = (await sb.from("approvals").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).limit(120)).data || [];
    var pending = rows.filter(function (r) { return r.status === "pending"; }), decided = rows.filter(function (r) { return r.status !== "pending"; });
    var body = document.getElementById("o-body");
    if (!rows.length) { body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">No approvals yet</div><div class="o-empty2-h">When a purchase order, invoice or other document crosses a threshold you set, it lands here for sign-off before it can be posted.</div><button class="o-new" id="ap-rules2" style="margin-top:14px">Set up approval rules</button></div>'; document.getElementById("ap-rules2").onclick = function () { go("approvals.rules"); }; return; }
    function card(r, pend) {
      return '<div class="ap-card"><div class="ap-card-main"><div class="ap-doc">' + esc(r.doc_number || (APPR_DOC_LABEL[r.doc_type] || r.doc_type)) + ' <span class="ap-type">' + esc(APPR_DOC_LABEL[r.doc_type] || r.doc_type) + '</span></div><div class="ap-amt">' + esc(S.company.currency_code) + " " + money(r.doc_amount) + '</div><div class="ap-meta">Requested by ' + esc(r.requested_by || "someone") + ' &middot; ' + agWhen(r.created_at) + (r.status !== "pending" ? ' &middot; ' + esc(r.status) + ' by ' + esc(r.decided_by || "") + (r.approver_note ? ' (' + esc(r.approver_note) + ')' : "") : "") + '</div></div>' +
        (pend ? '<div class="ap-actions">' + (r.link_action ? '<button class="o-filtbtn ap-open" data-act="' + esc(r.link_action) + '">View doc</button>' : "") + '<button class="o-filtbtn ap-reject" data-id="' + r.id + '">Reject</button><button class="o-filtbtn pri ap-approve" data-id="' + r.id + '">Approve</button></div>' : '<div class="ap-badge ' + esc(r.status) + '">' + (r.status === "approved" ? "Approved" : "Rejected") + '</div>') + '</div>';
    }
    body.innerHTML = '<div style="padding:14px 16px">' + (pending.length ? '<div class="ap-sec-h">Awaiting you (' + pending.length + ')</div>' + pending.map(function (r) { return card(r, true); }).join("") : '<div class="ap-sec-h">Nothing awaiting approval</div>') + (decided.length ? '<div class="ap-sec-h" style="margin-top:24px">History</div>' + decided.map(function (r) { return card(r, false); }).join("") : "") + '</div>';
    document.querySelectorAll(".ap-approve").forEach(function (b) { b.onclick = function () { decideApproval(b.dataset.id, "approved"); }; });
    document.querySelectorAll(".ap-reject").forEach(function (b) { b.onclick = function () { decideApproval(b.dataset.id, "rejected"); }; });
    document.querySelectorAll(".ap-open").forEach(function (b) { b.onclick = function () { if (b.dataset.act) go(b.dataset.act); }; });
  }
  async function decideApproval(id, decision) {
    var appr = (await sb.from("approvals").select("*").eq("id", id).maybeSingle()).data; if (!appr) return;
    var note = "";
    if (decision === "rejected") { note = window.prompt("Reason for rejection (optional):", "") || ""; }
    var r = await sb.from("approvals").update({ status: decision, approver_note: note, decided_by: (S.user && S.user.email) || "", decided_at: new Date().toISOString() }).eq("id", id);
    if (r.error) { toast(errMsg(r.error)); return; }
    notify({ kind: "approval_result", title: (decision === "approved" ? "Approved" : "Rejected") + ": " + (appr.doc_number || APPR_DOC_LABEL[appr.doc_type] || appr.doc_type), body: (APPR_DOC_LABEL[appr.doc_type] || appr.doc_type) + " " + S.company.currency_code + " " + money(appr.doc_amount) + (note ? " - " + note : ""), link_action: appr.link_action || "approvals.inbox" });
    toast(decision === "approved" ? "Approved - the requester can now post it" : "Rejected");
    renderApprovalsInbox();
  }
  function cfgApprovalRules() {
    return {
      title: "Approval Rules", pageSize: 80,
      fetch: function () { return sb.from("approval_rules").select("*, hr_employees(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return (r.name || "") + " " + (APPR_DOC_LABEL[r.doc_type] || r.doc_type); },
      columns: [
        { label: "Rule", get: function (r) { return '<b>' + esc(r.name) + '</b>'; } },
        { label: "Document", get: function (r) { return esc(APPR_DOC_LABEL[r.doc_type] || r.doc_type); } },
        { label: "Needs sign-off at or above", num: true, get: function (r) { return S.company.currency_code + " " + money(r.min_amount); } },
        { label: "Approver", get: function (r) { return esc(r.hr_employees ? r.hr_employees.name : "Anyone"); } },
        { label: "Active", get: function (r) { return r.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge draft">Off</span>'; } }
      ],
      emptyHint: "No rules yet. Add one so big documents need sign-off before they post.",
      onOpen: function (r) { openApprovalRuleModal(r); }, onNew: function () { openApprovalRuleModal(null); }
    };
  }
  async function openApprovalRuleModal(r) {
    r = r || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var typeOpts = Object.keys(APPR_DOC_LABEL).map(function (k) { return '<option value="' + k + '">' + APPR_DOC_LABEL[k] + '</option>'; }).join("");
    var apprOpts = '<option value="">Anyone can approve</option>' + emps.map(function (e) { return '<option value="' + e.id + '"' + (r.approver_employee_id === e.id ? " selected" : "") + '>' + esc(e.name) + '</option>'; }).join("");
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (r.id ? "Edit rule" : "New approval rule") + '</h3><div class="form">' +
      '<div><label>Rule name</label><input id="ar-name" value="' + esc(r.name || "") + '" placeholder="e.g. Large purchase orders"></div>' +
      '<div class="row2"><div><label>Applies to</label><select id="ar-type">' + typeOpts + '</select></div><div><label>Needs approval at or above (' + esc(S.company.currency_code) + ')</label><input id="ar-min" type="number" step="0.01" value="' + (r.id ? (r.min_amount || 0) : 1000) + '"></div></div>' +
      '<div class="row2"><div><label>Approver</label><select id="ar-appr">' + apprOpts + '</select></div><div><label>Status</label><select id="ar-active"><option value="1">Active</option><option value="0">Off</option></select></div></div>' +
      '<div class="sub">While a matching document is above the threshold it cannot be confirmed or posted until it is approved here.</div>' +
      '</div><div class="foot"><button class="btn" id="ar-cancel">Cancel</button>' + (r.id ? '<button class="btn" id="ar-del" style="color:var(--bad)">Delete</button>' : "") + '<button class="btn pri" id="ar-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ar-type").value = r.doc_type || "purchase_order";
    document.getElementById("ar-active").value = r.is_active === false ? "0" : "1";
    document.getElementById("ar-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("ar-del"); if (del) del.onclick = async function () { await sb.from("approval_rules").delete().eq("id", r.id); m.remove(); toast("Deleted"); go("approvals.rules"); };
    document.getElementById("ar-save").onclick = async function () {
      var row = { name: gv("ar-name") || "Rule", doc_type: document.getElementById("ar-type").value, min_amount: parseFloat(gv("ar-min")) || 0, approver_employee_id: document.getElementById("ar-appr").value || null, is_active: document.getElementById("ar-active").value === "1" };
      var res; if (r.id) res = await sb.from("approval_rules").update(row).eq("id", r.id); else { row.company_id = S.company.id; res = await sb.from("approval_rules").insert(row); }
      if (res.error) { toast(errMsg(res.error)); return; } m.remove(); toast("Saved"); go("approvals.rules");
    };
  }

  // ============================ INSIGHTS: dashboard / report builder ============================
  var RPT_SOURCES = {
    inv_out: { label: "Customer invoices", table: "invoices", select: "*, partners(name)", base: function (q) { return q.eq("move_type", "out_invoice"); },
      measures: { count: { label: "Number of invoices" }, total: { label: "Total invoiced", field: "amount_total", money: true }, due: { label: "Amount outstanding", field: "amount_residual", money: true } },
      dims: { "": { label: "(single total)" }, status: { label: "Status", get: function (r) { return r.state === "posted" ? "Posted" : (r.state || "Draft"); } }, month: { label: "Month", get: function (r) { return (r.invoice_date || "").slice(0, 7) || "?"; }, time: true }, customer: { label: "Customer", get: function (r) { return r.partners ? r.partners.name : "None"; } } } },
    po: { label: "Purchase orders", table: "purchase_orders", select: "*, partners(name)", base: function (q) { return q; },
      measures: { count: { label: "Number of orders" }, total: { label: "Total committed", field: "amount_total", money: true } },
      dims: { "": { label: "(single total)" }, status: { label: "Status", get: function (r) { return r.state || "draft"; } }, vendor: { label: "Vendor", get: function (r) { return r.partners ? r.partners.name : "None"; } }, month: { label: "Month", get: function (r) { return (r.date_order || "").slice(0, 7) || "?"; }, time: true } } },
    projects: { label: "Projects", table: "projects", select: "*, partners(name)", base: function (q) { return q; },
      measures: { count: { label: "Number of projects" }, contract: { label: "Contract value", field: "contract_value", money: true } },
      dims: { "": { label: "(single total)" }, status: { label: "Status", get: function (r) { return r.is_active ? "Active" : "Closed"; } }, billing: { label: "Billing type", get: function (r) { return BILLING[r.billing_type] || r.billing_type || "None"; } }, customer: { label: "Customer", get: function (r) { return r.partners ? r.partners.name : "None"; } } } },
    tasks: { label: "Execution tasks", table: "project_tasks", select: "*", base: function (q) { return q.eq("is_agile", true); },
      measures: { count: { label: "Number of tasks" }, points: { label: "Effort points", field: "points" } },
      dims: { "": { label: "(single total)" }, stage: { label: "Stage", get: function (r) { return agStageLabel(r.board_stage || "backlog"); } }, priority: { label: "Priority", get: function (r) { return (TASK_PRIO[r.priority] || TASK_PRIO.medium).label; } } } }
  };
  var RPT_CHART = { kpi: "Single number", bar: "Bar chart", line: "Line (over time)", table: "Table" };
  async function computeReport(rep) {
    var src = RPT_SOURCES[rep.source]; if (!src) return null;
    var meas = src.measures[rep.measure] || src.measures.count;
    var dimKey = rep.group_by || "", dim = src.dims[dimKey];
    var rows = (await src.base(sb.from(src.table).select(src.select).eq("company_id", S.company.id))).data || [];
    if (!dimKey || !dim || !dim.get) {
      var total = meas.field ? rows.reduce(function (s, r) { return s + Number(r[meas.field] || 0); }, 0) : rows.length;
      return { single: true, total: total, meas: meas, n: rows.length };
    }
    var map = {};
    rows.forEach(function (r) { var k = dim.get(r) || "None"; if (!(k in map)) map[k] = 0; map[k] += meas.field ? Number(r[meas.field] || 0) : 1; });
    var entries = Object.keys(map).map(function (k) { return { label: k, value: map[k] }; });
    if (dim.time) entries.sort(function (a, b) { return a.label < b.label ? -1 : 1; }); else entries.sort(function (a, b) { return b.value - a.value; });
    return { single: false, entries: entries, meas: meas, dim: dim, total: entries.reduce(function (s, e) { return s + e.value; }, 0) };
  }
  function rptFmt(v, meas) { return meas.money ? (S.company.currency_code + " " + money(v)) : (Math.round(v * 100) / 100).toLocaleString(); }
  function widgetBody(rep, data) {
    if (!data) return '<div class="muted">No data</div>';
    if (data.single || rep.chart === "kpi") { return '<div class="rw-kpi">' + rptFmt(data.total, data.meas) + '</div><div class="rw-kpi-sub">' + esc(data.meas.label) + '</div>'; }
    var entries = data.entries || []; if (!entries.length) return '<div class="muted" style="padding:10px 0">No data yet</div>';
    var max = Math.max.apply(null, entries.map(function (e) { return e.value; }).concat([1]));
    if (rep.chart === "table") { return '<table class="rw-tbl"><tbody>' + entries.map(function (e) { return '<tr><td>' + esc(e.label) + '</td><td class="num">' + rptFmt(e.value, data.meas) + '</td></tr>'; }).join("") + '</tbody></table>'; }
    if (rep.chart === "line") {
      var w = 280, h = 90, pad = 6, n = entries.length;
      var pts = entries.map(function (e, i) { var x = pad + (n <= 1 ? 0 : (i / (n - 1)) * (w - 2 * pad)); var y = h - pad - (e.value / max) * (h - 2 * pad); return (Math.round(x * 10) / 10) + "," + (Math.round(y * 10) / 10); });
      var area = "M" + pad + "," + (h - pad) + " L" + pts.join(" L") + " L" + (w - pad) + "," + (h - pad) + " Z";
      return '<div class="o-rt-wrap"><svg class="rw-line" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><path d="' + area + '" fill="var(--accent-soft)"/><polyline points="' + pts.join(" ") + '" fill="none" stroke="var(--accent)" stroke-width="2"/></svg></div><div class="rw-line-x">' + entries.map(function (e) { return '<span>' + esc(e.label.slice(5) || e.label) + '</span>'; }).join("") + '</div>';
    }
    return '<div class="rw-bars">' + entries.slice(0, 8).map(function (e) { var pc = Math.round(e.value / max * 100); return '<div class="rw-bar-row"><span class="rw-bar-l" title="' + esc(e.label) + '">' + esc(e.label) + '</span><span class="rw-bar-track"><span class="rw-bar-fill" style="width:' + pc + '%"></span></span><span class="rw-bar-v">' + rptFmt(e.value, data.meas) + '</span></div>'; }).join("") + '</div>';
  }
  async function renderInsights() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Dashboard") + '<div class="gap"></div><button class="o-filtbtn pri" id="rw-new">+ New report</button></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    document.getElementById("rw-new").onclick = function () { openReportModal(null); };
    var reports = (await sb.from("reports").select("*").eq("company_id", S.company.id).order("sort_order").order("created_at")).data || [];
    var body = document.getElementById("o-body");
    if (!reports.length) { body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">Build your dashboard</div><div class="o-empty2-h">Create report tiles from your live data (invoices, orders, projects, tasks) as KPIs, bar or line charts. They refresh every time you open this page.</div><button class="o-new" id="rw-new2" style="margin-top:14px">+ New report</button></div>'; document.getElementById("rw-new2").onclick = function () { openReportModal(null); }; return; }
    body.innerHTML = '<div class="rw-grid">' + reports.map(function (r) { return '<div class="rw-card"><div class="rw-head"><div class="rw-title">' + esc(r.name) + '</div><button class="rw-edit" data-id="' + r.id + '">Edit</button></div><div class="rw-body" id="rwb-' + r.id + '"><div class="muted">Loading...</div></div></div>'; }).join("") + '</div>';
    reports.forEach(function (rep) { computeReport(rep).then(function (data) { var el = document.getElementById("rwb-" + rep.id); if (el) el.innerHTML = widgetBody(rep, data); }).catch(function () { var el = document.getElementById("rwb-" + rep.id); if (el) el.innerHTML = '<div class="muted">Could not load</div>'; }); });
    document.querySelectorAll(".rw-edit").forEach(function (b) { b.onclick = function () { openReportModal(reports.filter(function (r) { return r.id === b.dataset.id; })[0]); }; });
  }
  function openReportModal(rep) {
    rep = rep || { source: "inv_out", measure: "count", group_by: "status", chart: "bar" };
    function measOpts(k, sel) { var s = RPT_SOURCES[k]; return Object.keys(s.measures).map(function (mk) { return '<option value="' + mk + '"' + (mk === sel ? " selected" : "") + '>' + s.measures[mk].label + '</option>'; }).join(""); }
    function dimOpts(k, sel) { var s = RPT_SOURCES[k]; return Object.keys(s.dims).map(function (dk) { return '<option value="' + dk + '"' + (dk === sel ? " selected" : "") + '>' + s.dims[dk].label + '</option>'; }).join(""); }
    var srcOpts = Object.keys(RPT_SOURCES).map(function (k) { return '<option value="' + k + '"' + (k === rep.source ? " selected" : "") + '>' + RPT_SOURCES[k].label + '</option>'; }).join("");
    var chartOpts = Object.keys(RPT_CHART).map(function (k) { return '<option value="' + k + '"' + (k === rep.chart ? " selected" : "") + '>' + RPT_CHART[k] + '</option>'; }).join("");
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (rep.id ? "Edit report" : "New report") + '</h3><div class="form">' +
      '<div><label>Title</label><input id="rp-name" value="' + esc(rep.name || "") + '" placeholder="e.g. Invoiced by month"></div>' +
      '<div class="row2"><div><label>Data source</label><select id="rp-src">' + srcOpts + '</select></div><div><label>Measure</label><select id="rp-meas">' + measOpts(rep.source, rep.measure) + '</select></div></div>' +
      '<div class="row2"><div><label>Group by</label><select id="rp-dim">' + dimOpts(rep.source, rep.group_by) + '</select></div><div><label>Chart</label><select id="rp-chart">' + chartOpts + '</select></div></div>' +
      '<div class="sub">The numbers are calculated live from your data each time the dashboard loads.</div>' +
      '</div><div class="foot"><button class="btn" id="rp-cancel">Cancel</button>' + (rep.id ? '<button class="btn" id="rp-del" style="color:var(--bad)">Delete</button>' : "") + '<button class="btn pri" id="rp-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    var srcSel = document.getElementById("rp-src");
    srcSel.onchange = function () { document.getElementById("rp-meas").innerHTML = measOpts(srcSel.value, "count"); document.getElementById("rp-dim").innerHTML = dimOpts(srcSel.value, ""); };
    document.getElementById("rp-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("rp-del"); if (del) del.onclick = async function () { await sb.from("reports").delete().eq("id", rep.id); m.remove(); renderInsights(); };
    document.getElementById("rp-save").onclick = async function () {
      var row = { name: gv("rp-name") || "Report", source: srcSel.value, measure: document.getElementById("rp-meas").value, group_by: document.getElementById("rp-dim").value, chart: document.getElementById("rp-chart").value };
      var r; if (rep.id) r = await sb.from("reports").update(row).eq("id", rep.id); else { row.company_id = S.company.id; r = await sb.from("reports").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); renderInsights();
    };
  }

  // ============================ PORTAL ACCESS (admin) ============================
  var PORTAL_ROLE = { client: "Client", subcontractor: "Subcontractor", supplier: "Supplier" };
  function cfgPortalAccess() {
    return {
      title: "Portal Access", pageSize: 80,
      fetch: function () { return sb.from("portal_access").select("*, partners(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return (r.email || "") + " " + (r.partners ? r.partners.name : ""); },
      columns: [
        { label: "Contact", get: function (r) { return '<b>' + esc(r.partners ? r.partners.name : "") + '</b>'; } },
        { label: "Sign-in email", get: function (r) { return esc(r.email); } },
        { label: "Sees", get: function (r) { return esc(PORTAL_ROLE[r.role] || r.role); } },
        { label: "Active", get: function (r) { return r.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge draft">Off</span>'; } }
      ],
      emptyHint: "Invite a client, subcontractor or supplier to see their own projects, certificates and invoices in the read-only portal.",
      onOpen: function (r) { openPortalInviteModal(r); }, onNew: function () { openPortalInviteModal(null); }
    };
  }
  async function openPortalInviteModal(r) {
    r = r || {};
    var partners = (await sb.from("partners").select("id,name,email").order("name")).data || [];
    var pOpts = '<option value="">Pick a contact</option>' + partners.map(function (p) { return '<option value="' + p.id + '" data-email="' + esc(p.email || "") + '"' + (r.partner_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    var roleOpts = Object.keys(PORTAL_ROLE).map(function (k) { return '<option value="' + k + '">' + PORTAL_ROLE[k] + '</option>'; }).join("");
    var portalUrl = window.location.origin + "/portal.html";
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (r.id ? "Edit portal access" : "Invite to portal") + '</h3><div class="form">' +
      '<div><label>Contact</label><select id="pi-partner">' + pOpts + '</select></div>' +
      '<div><label>Sign-in email</label><input id="pi-email" value="' + esc(r.email || "") + '" placeholder="who@company.com"></div>' +
      '<div class="row2"><div><label>They can see</label><select id="pi-role">' + roleOpts + '</select></div><div><label>Status</label><select id="pi-active"><option value="1">Active</option><option value="0">Off</option></select></div></div>' +
      '<div class="sub">They sign in at <b>' + esc(portalUrl) + '</b> with this email (a one-time link is emailed, no password). They only ever see their own projects, certificates and invoices, read-only.</div>' +
      '</div><div class="foot"><button class="btn" id="pi-cancel">Cancel</button>' + (r.id ? '<button class="btn" id="pi-del" style="color:var(--bad)">Remove</button>' : "") + '<button class="btn pri" id="pi-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("pi-role").value = r.role || "client";
    document.getElementById("pi-active").value = r.is_active === false ? "0" : "1";
    var psel = document.getElementById("pi-partner");
    psel.onchange = function () { var opt = psel.options[psel.selectedIndex]; var em = opt ? opt.getAttribute("data-email") : ""; if (em && !gv("pi-email")) document.getElementById("pi-email").value = em; };
    document.getElementById("pi-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("pi-del"); if (del) del.onclick = async function () { await sb.from("portal_access").delete().eq("id", r.id); m.remove(); toast("Removed"); go("portal.admin"); };
    document.getElementById("pi-save").onclick = async function () {
      var partnerId = psel.value, email = (gv("pi-email") || "").trim();
      if (!partnerId) { toast("Pick a contact"); return; }
      if (!email || email.indexOf("@") < 0) { toast("Enter a valid email"); return; }
      var row = { partner_id: partnerId, email: email, role: document.getElementById("pi-role").value, is_active: document.getElementById("pi-active").value === "1" };
      var res; if (r.id) res = await sb.from("portal_access").update(row).eq("id", r.id); else { row.company_id = S.company.id; res = await sb.from("portal_access").insert(row); }
      if (res.error) { toast(errMsg(res.error)); return; } m.remove(); toast("Portal access saved"); go("portal.admin");
    };
  }

  // ============================ ROUTER ============================
  function go(action) {
    if (action === "settings.roles" && !canManageRoles()) { toast("Only owners and super admins can manage roles"); if (!S.app) renderHome(); return; }
    if (!canGo(action)) { toast("You do not have access to that"); if (!S.app) renderHome(); return; }
    S.action = action;
    if (!S.app) { S.app = ACTION_APP[action] || "accounting"; applyAppColor(); }
    if (!document.getElementById("o-main")) renderShell();
    else { /* keep shell, but ensure menu highlights current app */ }
    routeAction(action);
    highlightSide();
  }
  // Re-render the current view (used by modals to refresh the list after a save).
  function renderView() { if (S.action) routeAction(S.action); }
  // Navigate to an action that may belong to a different app: switch the shell/sidebar to
  // the owning app first (so the sidebar matches the content), then route. Used by the
  // Getting-started wizard's deep links.
  function goApp(action) {
    var app = ACTION_APP[action] || S.app;
    if (app && app !== S.app) { S.app = app; applyAppColor(); renderShell(); }
    go(action);
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
      case "est.list": return renderList(cfgTenders());
      case "mfg.wo": return renderList(cfgWorkOrders());
      case "mfg.boms": return renderList(cfgBoms());
      case "inst.jobs": return renderList(cfgInstallJobs());
      case "doc.subs": return renderList(cfgSubmittals());
      case "doc.rfis": return renderList(cfgRfis());
      case "doc.trans": return renderList(cfgTransmittals());
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
      case "rep.cashfwd": return renderCashForecast();
      case "rep.collections": return renderCollections();
      case "cockpit": return renderCockpit();
      case "assets.list": return renderList(cfgAssets());
      case "budget.list": return renderList(cfgBudgets());
      case "fu.levels": return renderList(cfgFollowupLevels());
      case "sale.pricelists": return renderList(cfgPricelists());
      case "sale.qtempl": return renderList(cfgQuoteTemplates());
      case "inv.scrap": return openScrapFlow();
      case "inv.storage": return renderList(cfgStorageCategories());
      case "inv.putaway": return renderList(cfgPutawayRules());
      case "inv.delivery": return renderList(cfgDeliveryMethods());
      case "inv.packages": return renderList(cfgPackageTypes());
      case "hr.skills": return renderList(cfgSkills());
      case "hr.empskills": return renderList(cfgEmployeeSkills());
      case "hr.certs": return renderList(cfgCertifications());
      case "hr.onboard": return renderList(cfgOnboarding());
      case "hr.appraisals": return renderList(cfgAppraisals());
      case "hr.planning": return renderList(cfgPlanning());
      case "hr.shifttmpl": return renderList(cfgShiftTemplates());
      case "contacts": return renderList(cfgContacts());
      case "contact.tags": return renderList(cfgContactTags());
      case "cal.month": return renderCalendar();
      case "cal.agenda": return renderAgenda();
      case "sign.list": return renderList(cfgSignRequests());
      case "rec.applicants": return renderList(cfgApplicants());
      case "kb.articles": return renderList(cfgArticles());
      case "settings.users": return renderUsers();
      case "settings.roles": return renderRoles();
      case "settings.setup": return renderSetup();
      case "settings.import": return renderImport();
      case "platform.pending": return renderPendingSignups();
      case "settings.numbering": return renderNumbering();
      case "approvals.inbox": return renderApprovalsInbox();
      case "approvals.rules": return renderList(cfgApprovalRules());
      case "dash.home": return renderInsights();
      case "portal.admin": return renderList(cfgPortalAccess());
      case "settings.lock": return openLockDateModal();
      case "rates": return renderList(cfgRates());
      case "bank": return renderList(cfgBankStatements());
      case "appearance": return renderAppearance();
      case "inv.onhand": return renderOnHand();
      case "inv.moves": return renderList(cfgStockMoves());
      case "inv.issues": return renderList(cfgMaterialIssues());
      case "inv.cats": return renderList(cfgProductCategories());
      case "inv.uoms": return renderList(cfgUoms());
      case "wh": return renderList(cfgWarehouses());
      case "inv.reorder": return renderReorder();
      case "loc": return renderList(cfgLocations());
      case "lots": return renderLots();
      case "rfq.list": return renderList(cfgRFQs());
      case "pur.req": return renderList(cfgRequisitions());
      case "pur.sccert": return renderList(cfgSubcontractCerts());
      case "pur.match": return renderMatch();
      case "proj.list": return renderList(cfgProjects());
      case "task.list": return renderList(cfgTasks());
      case "ts.list": return renderList(cfgTimesheets());
      case "pc.list": return renderList(cfgCertificates());
      case "var.list": return renderList(cfgVariations());
      case "sc.list": return renderList(cfgSubcontracts());
      case "proj.pnl": return renderProjectPnL();
      case "proj.jobcost": return renderJobCost();
      case "cost.codes": return renderList(cfgCostCodes());
      case "proj.retention": return renderRetention();
      case "proj.wip": return renderWIP();
      case "proj.schedule": return renderSchedule();
      case "proj.board": return renderBoard();
      case "proj.mywork": return renderMyWork();
      case "site.snags": return renderList(cfgSnags());
      case "site.insp": return renderList(cfgInspections());
      case "site.plant": return renderList(cfgPlant());
      case "site.diary": return renderList(cfgSiteDiary());
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
      case "hr.roster": return renderRoster();
      case "hr.eos": return renderEOS();
      case "hr.payconsol": return renderPayrollConsolidation();
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
      (cfg.onNew && canManageApp(S.app) ? '<button class="o-new" id="o-new">New</button>' : '') +
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
    var _newBtn = document.getElementById("o-new"); if (_newBtn && cfg.onNew) _newBtn.onclick = cfg.onNew;
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
    if (!body || !pager) return; // navigated away before an async list fetch resolved
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
    if (!total) {
      var noneAtAll = !(L.all && L.all.length);
      var titleWord = (cfg.title || "records").toLowerCase();
      if (noneAtAll) {
        body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">No ' + esc(titleWord) + ' yet</div>' +
          '<div class="o-empty2-h">' + esc(cfg.emptyHint || ("Create your first " + titleWord.replace(/s$/, "") + " to get started.")) + '</div>' +
          (cfg.onNew && canManageApp(S.app) ? '<button class="o-new" id="o-empty-new" style="margin-top:16px">+ Create ' + esc(titleWord.replace(/s$/, "")) + '</button>' : '') + '</div>';
        var eb = document.getElementById("o-empty-new"); if (eb) eb.onclick = cfg.onNew;
      } else {
        body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">No matches</div><div class="o-empty2-h">Nothing matches your current search or filters. Clear them to see everything.</div></div>';
      }
      return;
    }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      emptyHint: isSale ? "Use a quotation for a straightforward product or service sale. For a priced construction bid with a cost breakdown and margin, use Estimation → Tenders instead, then turn the won tender into a project." : "Raise a purchase order to buy materials or subcontract work from a vendor.",
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
    var partners = (await sb.from("partners").select("id,name,payment_days,contact_person,mobile,phone,credit_limit").eq(isSale ? "is_customer" : "is_vendor", true).order("name")).data || [];
    var creditCache = {};
    async function creditWarnHtml() {
      if (!isSale) return "";
      var pid = document.getElementById("f-partner") ? document.getElementById("f-partner").value : (inv && inv.partner_id);
      var partner = partners.filter(function (x) { return x.id === pid; })[0];
      if (!partner || !(Number(partner.credit_limit) > 0)) return "";
      if (creditCache[pid] === undefined) {
        var open = (await sb.from("invoices").select("amount_residual,id").eq("company_id", S.company.id).eq("partner_id", pid).eq("move_type", "out_invoice").eq("state", "posted").gt("amount_residual", 0.005)).data || [];
        creditCache[pid] = open.reduce(function (s, o) { return o.id === (inv && inv.id) ? s : s + Number(o.amount_residual || 0); }, 0);
      }
      var lb = document.getElementById("lnbody"), thisTot = 0;
      if (lb) lb.querySelectorAll("tr").forEach(function (tr) { thisTot += (parseFloat(tr.querySelector(".l-qty").value) || 0) * (parseFloat(tr.querySelector(".l-price").value) || 0); });
      var exposure = creditCache[pid] + thisTot, lim = Number(partner.credit_limit);
      if (exposure <= lim + 0.005) return "";
      return '<div class="ob-banner" style="margin:0 0 12px">! Over credit limit &middot; ' + esc(partner.name) + ' would owe ' + S.company.currency_code + ' ' + money(exposure) + ' against a limit of ' + S.company.currency_code + ' ' + money(lim) + ' (' + S.company.currency_code + ' ' + money(exposure - lim) + ' over). You can still post it.</div>';
    }
    async function refreshCreditWarn() { var el = document.getElementById("f-credit-warn"); if (el) el.innerHTML = await creditWarnHtml(); }
    var accounts = ((await sb.from("accounts").select("id,code,name,type_code").eq("company_id", S.company.id).eq("is_active", true).order("code")).data || [])
      .filter(function (a) { return (a.type_code || "").indexOf(isSale ? "income" : "expense") === 0; });
    var taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id).order("amount", { ascending: false })).data || [])
      .filter(function (t) { var s = (t.scope || "").toLowerCase(); return !s || s === "both" || s === (isSale ? "sale" : "purchase"); });
    if (!taxes.length) taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id)).data) || [];
    var products = ((await sb.from("products").select("id,name,default_code,list_price,cost_price,income_account_id,expense_account_id,sale_tax_id,purchase_tax_id").eq("company_id", S.company.id).eq("is_active", true).order("name")).data) || [];
    var projects = ((await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data) || [];
    var glLines = [];
    if (inv && inv.state === "posted" && inv.journal_entry_id) glLines = (await sb.from("journal_lines").select("*, accounts(code,name)").eq("entry_id", inv.journal_entry_id)).data || [];

    // breadcrumb title
    document.querySelector(".o-bc span:last-child").textContent = inv ? (inv.number || "Draft") : "New";

    // status bar buttons
    var btns = "";
    if (editable) btns += '<button class="pri" id="f-confirm" title="Post to the accounts. This finalises it - a posted document cannot be edited.">Confirm &amp; post</button><button id="f-save" title="Keep working on it as an editable draft.">Save draft</button><button id="f-discard">Discard</button>';
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
    var invCosts = isSale ? [] : (((await sb.from("cost_codes").select("id,code,name").eq("company_id", S.company.id).eq("is_active", true).order("sort")).data) || []);
    var groups =
      '<div class="o-groups"><div>' +
      fld(isSale ? "Customer" : "Vendor", partnerField) +
      fld("Reference", editable ? '<input id="f-ref" value="' + esc(inv ? inv.ref || "" : "") + '" placeholder="optional">' : '<span class="v">' + esc(inv ? inv.ref || "" : "") + '</span>') +
      '</div><div>' +
      fld(isSale ? "Invoice Date" : "Bill Date", editable ? '<input id="f-date" type="date" value="' + (inv ? inv.invoice_date || today() : today()) + '">' : '<span class="v">' + esc(inv.invoice_date || "") + '</span>', "Date the " + (isSale ? "invoice" : "bill") + " is issued.") +
      (editable ? fld("Payment terms", '<select id="f-terms"><option value="0">Due on receipt</option><option value="15">Within 15 days</option><option value="30" selected>Within 30 days</option><option value="45">Within 45 days</option><option value="60">Within 60 days</option><option value="90">Within 90 days</option><option value="eom">End of next month</option></select>', "Pick when payment is due; the due date fills in automatically.") : "") +
      fld("Due Date", editable ? '<input id="f-due" type="date" value="' + (inv ? inv.due_date || "" : new Date(Date.now() + 2592e6).toISOString().slice(0, 10)) + '">' : '<span class="v">' + esc(inv.due_date || "") + '</span>', "When payment is expected. Set automatically from the payment terms; you can override it.") +
      fld("Project", editable ? '<select id="f-proj"><option value="">(none)</option>' + projects.map(function (pr) { return '<option value="' + pr.id + '"' + ((inv && inv.project_id === pr.id) ? " selected" : "") + '>' + esc(pr.name) + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc((projects.filter(function (pr) { return inv && pr.id === inv.project_id; })[0] || {}).name || "-") + '</span>', "Tag this " + (isSale ? "invoice" : "bill") + " to a project/site so its cost and revenue roll up in the Project P&L.") +
      (isSale ? "" : fld("Cost Code", editable ? '<select id="f-costcode"><option value="">(none)</option>' + invCosts.map(function (c) { return '<option value="' + c.id + '"' + ((inv && inv.cost_code_id === c.id) ? " selected" : "") + '>' + esc(c.code) + (c.name ? " - " + esc(c.name) : "") + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc((invCosts.filter(function (c) { return inv && c.id === inv.cost_code_id; })[0] || {}).code || "-") + '</span>', "Cost bucket for job costing — this bill rolls up under this code in the Job Cost report.")) +
      '</div></div>';

    // notebook
    var tabs = ['<div class="tb on" data-t="lines">' + (isSale ? "Invoice Lines" : "Bill Lines") + '</div>'];
    if (inv && inv.state === "posted") tabs.push('<div class="tb" data-t="gl">Journal Items</div>');
    tabs.push('<div class="tb" data-t="other">Other Info</div>');

    var title = inv ? (inv.number || "Draft " + (isRefund ? "Credit Note" : (isSale ? "Invoice" : "Bill"))) : "New";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div id="f-credit-warn" style="padding:12px 20px 0"></div>' +
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
      pg.innerHTML = '<table class="o-lines"><thead><tr>' + (products.length ? '<th style="width:150px">Product</th>' : '') + '<th>Description</th><th class="acct-col" style="width:140px;display:none">' + (isSale ? "Revenue Account" : "Expense Account") + '</th><th style="width:56px;text-align:right">Qty</th><th style="width:96px;text-align:right">Unit Price</th><th style="width:112px">Tax</th><th style="width:88px;text-align:right">Subtotal</th><th style="width:24px"></th></tr></thead><tbody id="lnbody"></tbody></table>' +
        '<button class="o-addln" id="addln">+ Add a line</button><button id="acct-toggle" type="button" style="margin-left:10px;background:none;border:none;color:var(--slate);font:inherit;font-size:12px;cursor:pointer;text-decoration:underline">Show accounting detail</button>' + totalsHTML();
      var lb = document.getElementById("lnbody");
      function addRow(l) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          (products.length ? '<td><select class="l-prod">' + prodOpts + '</select></td>' : '') +
          '<td><input class="l-name" value="' + esc(l ? l.name : "") + '" placeholder="Description"></td>' +
          '<td class="acct-col" style="display:none"><select class="l-acct">' + accOpts + '</select></td>' +
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
      var atog = document.getElementById("acct-toggle");
      if (atog) atog.onclick = function () { var show = pg.querySelector(".acct-col") && pg.querySelector(".acct-col").style.display === "none"; pg.querySelectorAll(".acct-col").forEach(function (c) { c.style.display = show ? "" : "none"; }); atog.textContent = show ? "Hide accounting detail" : "Show accounting detail"; };
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
      refreshCreditWarn();
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
      if (alsoPost && !(untax > 0.005)) { toast("Cannot post an invoice with a zero total. Add amounts to the lines first."); return null; }
      if (isLocked(document.getElementById("f-date").value)) { toast("Period locked on/before " + S.company.lock_date + " - choose a later date"); return null; }
      var hdr = {
        partner_id: partnerId, invoice_date: document.getElementById("f-date").value,
        due_date: document.getElementById("f-due").value || null, ref: document.getElementById("f-ref").value.trim(),
        project_id: document.getElementById("f-proj") ? (document.getElementById("f-proj").value || null) : null,
        cost_code_id: document.getElementById("f-costcode") ? (document.getElementById("f-costcode").value || null) : null,
        amount_untaxed: untax, amount_total: untax, amount_residual: untax
      };
      var invId = id;
      if (id === "new") {
        hdr.company_id = S.company.id; hdr.move_type = moveType; hdr.currency_code = S.company.currency_code; hdr.state = "draft";
        hdr.number = await nextNumber(moveType);
        var ins = await sb.from("invoices").insert(hdr).select("id").single();
        if (ins.error) { toast("Could not save: " + errMsg(ins.error)); return null; }
        invId = ins.data.id;
      } else {
        var up = await sb.from("invoices").update(hdr).eq("id", id);
        if (up.error) { toast("Could not save: " + errMsg(up.error)); return null; }
        await sb.from("invoice_lines").delete().eq("invoice_id", id);
      }
      var rows = lns.map(function (l, i) { return { company_id: S.company.id, invoice_id: invId, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, account_id: l.account_id, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price }; });
      var lr = await sb.from("invoice_lines").insert(rows);
      if (lr.error) { toast("Lines failed: " + errMsg(lr.error)); return null; }
      if (alsoPost) { var pr = await sb.rpc("post_invoice", { p_invoice: invId }); if (pr.error) { toast("Saved draft, posting failed: " + errMsg(pr.error)); return invId; } }
      return invId;
    }
    if (editable) {
      // Payment terms -> auto due date
      function applyTerms() {
        var t = document.getElementById("f-terms"), d = document.getElementById("f-date"), due = document.getElementById("f-due");
        if (!t || !d || !due) return;
        var base = parseD(d.value) || new Date(), nd;
        if (t.value === "eom") nd = new Date(base.getFullYear(), base.getMonth() + 2, 0);
        else { nd = new Date(base); nd.setDate(nd.getDate() + (parseInt(t.value, 10) || 0)); }
        due.value = fmtD(nd);
      }
      var fterms = document.getElementById("f-terms"); if (fterms) fterms.onchange = applyTerms;
      var fdate = document.getElementById("f-date"); if (fdate) fdate.onchange = applyTerms;
      var fpart = document.getElementById("f-partner");
      if (fpart) fpart.onchange = function () {
        var p = partners.filter(function (x) { return x.id === fpart.value; })[0];
        if (p && p.payment_days != null && document.getElementById("f-terms")) {
          var opt = [].filter.call(document.getElementById("f-terms").options, function (o) { return o.value === String(p.payment_days); })[0];
          if (opt) { document.getElementById("f-terms").value = String(p.payment_days); applyTerms(); }
        }
        refreshCreditWarn();
      };
      if (id === "new" && !inv) applyTerms(); // seed due date from default terms on a fresh invoice
      document.getElementById("f-discard").onclick = function () { go(isSale ? "inv.out" : "inv.in"); };
      document.getElementById("f-save").onclick = async function () { var nid = await save(false); if (nid) { toast("Saved as draft"); renderInvoiceForm(nid, moveType); } };
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
    // associate the <label> with the field's control when the value markup carries an id (ORB-07)
    var m = /\bid="([^"]+)"/.exec(valueHtml || "");
    var forAttr = m ? ' for="' + m[1] + '"' : "";
    return '<div class="o-fld"><div class="lbl"><label' + forAttr + '>' + esc(label) + '</label>' + (desc ? '<span class="d">' + esc(desc) + '</span>' : "") + '</div><div class="v">' + valueHtml + '</div></div>';
  }
  function fhint(label, override) { var d = override || FIELD_DESC[label] || ""; return d ? '<div class="fd">' + esc(d) + '</div>' : ""; }
  async function createCreditNote(inv, lines, isSale) {
    var moveType = isSale ? "out_refund" : "in_refund";
    var untax = lines.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
    var hdr = { company_id: S.company.id, move_type: moveType, partner_id: inv.partner_id, number: await nextNumber(moveType), invoice_date: today(), due_date: today(), currency_code: inv.currency_code || S.company.currency_code, state: "draft", ref: "Credit note for " + (inv.number || ""), amount_untaxed: untax, amount_total: untax, amount_residual: untax };
    var ins = await sb.from("invoices").insert(hdr).select("id").single();
    if (ins.error) { toast("Could not create: " + errMsg(ins.error)); return; }
    var invId = ins.data.id;
    var rows = lines.map(function (l, i) { return { company_id: S.company.id, invoice_id: invId, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, account_id: l.account_id, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price }; });
    var lr = await sb.from("invoice_lines").insert(rows);
    if (lr.error) { toast("Lines failed: " + errMsg(lr.error)); return; }
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
  // collision-safe sequence: highest existing numeric suffix + 1 (count-based numbering repeats a number after any deletion)
  function maxSeq(rows, prefixYear) { var mx = 0; (rows || []).forEach(function (r) { var num = r.number || ""; if (prefixYear && num.indexOf(prefixYear) !== 0) return; var m = /(\d+)\s*$/.exec(num); if (m) { var n = parseInt(m[1], 10); if (n > mx) mx = n; } }); return mx; }
  // ---- configurable document numbering (ORB-06): admin-editable prefix / padding / year per doc type ----
  var DOC_TYPES = [
    ["INV", "Customer invoice"], ["RINV", "Customer credit note"], ["BILL", "Vendor bill"], ["RBILL", "Vendor refund"],
    ["SO", "Sales order / quotation"], ["PO", "Purchase order"], ["TND", "Tender / estimate"],
    ["SUB", "Submittal"], ["RFI", "RFI"], ["TRN", "Transmittal"],
    ["SNAG", "Snag / punch item"], ["INSP", "Inspection"], ["INS", "Install job"], ["SIGN", "Signature request"], ["WO", "Work order"]
  ];
  var _seqCache = null, _seqCacheCo = null;
  async function loadSeqCfg() {
    if (_seqCache && _seqCacheCo === S.company.id) return _seqCache;
    _seqCacheCo = S.company.id; var rows = [];
    try { rows = (await sb.from("number_sequences").select("*").eq("company_id", S.company.id)).data || []; } catch (e) {}
    _seqCache = {}; rows.forEach(function (r) { _seqCache[r.doc_type] = r; });
    return _seqCache;
  }
  function resetSeqCache() { _seqCache = null; }
  async function seqCfg(defPrefix) { var c = await loadSeqCfg(); var r = c[defPrefix]; return { prefix: (r && r.prefix) || defPrefix, padding: (r && r.padding) || 4, use_year: r ? r.use_year !== false : true }; }
  function seqPrefixYear(cfg) { return cfg.prefix + (cfg.use_year ? "/" + new Date().getFullYear() : "") + "/"; }
  function seqPad(cfg, n) { return ("000000000" + n).slice(-Math.max(1, cfg.padding || 4)); }
  async function nextNumber(moveType) {
    var defPrefix = { out_invoice: "INV", out_refund: "RINV", in_invoice: "BILL", in_refund: "RBILL" }[moveType] || "INV";
    var cfg = await seqCfg(defPrefix), py = seqPrefixYear(cfg);
    var rows = (await sb.from("invoices").select("number").eq("company_id", S.company.id).eq("move_type", moveType).like("number", py + "%")).data || [];
    return py + seqPad(cfg, maxSeq(rows, py) + 1);
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
    var partners = (await sb.from("partners").select("id,name,pricelist_id").eq(isSale ? "is_customer" : "is_vendor", true).order("name")).data || [];
    var products = ((await sb.from("products").select("id,name,default_code,list_price,cost_price,sale_tax_id,purchase_tax_id").eq("company_id", S.company.id).eq("is_active", true).order("name")).data) || [];
    var plItemsCache = {};
    async function pricelistPriceFor(productId) {
      if (!isSale) return null;
      var ps = document.getElementById("o-partner"); var pid = ps ? ps.value : (order && order.partner_id);
      var partner = partners.filter(function (x) { return x.id === pid; })[0];
      if (!partner || !partner.pricelist_id) return null;
      if (!plItemsCache[partner.pricelist_id]) plItemsCache[partner.pricelist_id] = (await sb.from("pricelist_items").select("*").eq("pricelist_id", partner.pricelist_id)).data || [];
      var items = plItemsCache[partner.pricelist_id];
      var prod = products.filter(function (x) { return x.id === productId; })[0]; var list = prod ? Number(prod.list_price || 0) : 0;
      var item = items.filter(function (it) { return it.product_id === productId; }).sort(function (a, b) { return Number(b.min_qty) - Number(a.min_qty); })[0] || items.filter(function (it) { return !it.product_id; })[0];
      if (!item) return null;
      if (item.fixed_price != null) return Number(item.fixed_price);
      if (item.percent_off) return list * (1 - Number(item.percent_off) / 100);
      return null;
    }
    var orderProjects = ((await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data) || [];
    var orderCosts = isSale ? [] : (((await sb.from("cost_codes").select("id,code,name").eq("company_id", S.company.id).eq("is_active", true).order("sort")).data) || []);
    var taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id).order("amount", { ascending: false })).data || []).filter(function (t) { var s = (t.scope || "").toLowerCase(); return !s || s === "both" || s === (isSale ? "sale" : "purchase"); });
    if (!taxes.length) taxes = ((await sb.from("taxes").select("id,name,amount,scope").eq("company_id", S.company.id)).data) || [];
    document.querySelector(".o-bc span:last-child").textContent = order ? (order.number || "Draft") : "New";
    var invCount = 0, firstInvId = null;
    if (order) { var _ic = (await sb.from("invoices").select("id").eq(isSale ? "sale_order_id" : "purchase_order_id", order.id)).data || []; invCount = _ic.length; firstInvId = _ic[0] ? _ic[0].id : null; }
    var smart = (order && invCount) ? '<div class="o-smart"><button class="sb" id="o-sm-inv"><span class="v">' + invCount + '</span><span class="k">' + (isSale ? "Invoices" : "Bills") + '</span></button></div>' : "";

    var btns = "";
    if (editable) btns += '<button class="pri" id="o-confirm">Confirm</button><button id="o-save">Save</button><button id="o-discard">Discard</button>';
    else if (confirmed) { if (!isSale) btns += '<button id="o-receive">Receive goods</button>'; btns += '<button class="pri" id="o-toinv">' + (isSale ? "Create Invoice" : "Create Bill") + '</button>'; }
    var st = order ? order.state : "draft", atFirst = (st === "draft" || st === "sent");
    var stages = '<div class="o-stages"><span class="st ' + (atFirst ? "on" : "done") + '">' + (isSale ? "Quotation" : "RFQ") + '</span><span class="st ' + (!atFirst ? "on" : "") + '">' + (isSale ? "Sales Order" : "Purchase Order") + '</span></div>';

    var partnerField = editable ? '<select id="o-partner">' + partners.map(function (p) { return '<option value="' + p.id + '"' + ((order && order.partner_id === p.id) ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc(order && order.partners ? order.partners.name : "") + '</span>';
    var groups = '<div class="o-groups"><div>' +
      fld(isSale ? "Customer" : "Vendor", partnerField) +
      fld("Project", editable ? '<select id="o-proj"><option value="">(none)</option>' + orderProjects.map(function (pr) { return '<option value="' + pr.id + '"' + ((order && order.project_id === pr.id) ? " selected" : "") + '>' + esc(pr.name) + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc((orderProjects.filter(function (pr) { return order && pr.id === order.project_id; })[0] || {}).name || "-") + '</span>', "Tag this order to a project/site so open POs show as committed cost in the Project P&L.") +
      (isSale ? "" : fld("Cost Code", editable ? '<select id="o-costcode"><option value="">(none)</option>' + orderCosts.map(function (c) { return '<option value="' + c.id + '"' + ((order && order.cost_code_id === c.id) ? " selected" : "") + '>' + esc(c.code) + (c.name ? " - " + esc(c.name) : "") + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc((orderCosts.filter(function (c) { return order && c.id === order.cost_code_id; })[0] || {}).code || "-") + '</span>', "Cost bucket for job costing — this PO rolls up under this code in the Job Cost report.")) +
      fld("Currency", '<input readonly value="' + esc(S.company.currency_code) + '">') +
      '</div><div>' +
      fld("Order Date", editable ? '<input id="o-date" type="date" value="' + (order ? order.date_order || today() : today()) + '">' : '<span class="v">' + esc(order.date_order || "") + '</span>') +
      fld("Reference / Note", editable ? '<input id="o-ref" value="' + esc(order ? order.note || "" : "") + '" placeholder="optional">' : '<span class="v">' + esc(order ? order.note || "" : "") + '</span>') +
      '</div></div>';
    var title = order ? (order.number || (isSale ? "Draft Quotation" : "Request for Quotation")) : "New";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title">' + esc(title) + '</div>' + groups +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Order Lines</div></div><div class="o-nb-pg" id="nbpg"></div></div></div>';
    if (order && invCount) { var _smb = document.getElementById("o-sm-inv"); if (_smb) _smb.onclick = function () { renderInvoiceForm(firstInvId, isSale ? "out_invoice" : "in_invoice"); }; }

    var linesState = lines.map(function (l) { return { id: l.id, name: l.name, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, product_id: l.product_id, qty_received: l.qty_received, qty_billed: l.qty_billed }; });
    function totHTML() { return '<div class="o-tot" id="o-tot"></div>'; }
    function setTot(sub, tax) { var el = document.getElementById("o-tot"); if (!el) return; el.innerHTML = '<div class="r"><span class="k">Untaxed Amount</span><span>' + S.company.currency_code + " " + money(sub) + '</span></div><div class="r"><span class="k">Taxes</span><span>' + S.company.currency_code + " " + money(tax) + '</span></div><div class="r tt"><span class="k">Total</span><span>' + S.company.currency_code + " " + money(sub + tax) + '</span></div>'; }
    function recalc() { var lb = document.getElementById("lnbody"); if (!lb) return; var sub = 0, tax = 0; lb.querySelectorAll("tr").forEach(function (tr) { var q = parseFloat(tr.querySelector(".l-qty").value) || 0, p = parseFloat(tr.querySelector(".l-price").value) || 0, ln = q * p; var ts = tr.querySelector(".l-tax"); var amt = ts.value ? Number(ts.options[ts.selectedIndex].getAttribute("data-amt")) : 0; sub += ln; tax += ln * amt / 100; tr.querySelector(".l-sub").textContent = money(ln); }); setTot(sub, tax); }
    function currentLines() { var lb = document.getElementById("lnbody"); if (!lb) return linesState; return Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) { var q = parseFloat(tr.querySelector(".l-qty").value) || 0, p = parseFloat(tr.querySelector(".l-price").value) || 0, ps = tr.querySelector(".l-prod"); return { name: tr.querySelector(".l-name").value.trim() || "Item", tax_id: tr.querySelector(".l-tax").value || null, quantity: q, unit_price: p, product_id: ps ? (ps.value || null) : null }; }); }
    function renderLines() {
      var pg = document.getElementById("nbpg");
      if (!editable) {
        var showMatch = !isSale;
        var body = linesState.map(function (l) {
          var amt = l.tax_id ? (taxes.filter(function (t) { return t.id === l.tax_id; })[0] || {}).amount || 0 : 0;
          var matchCells = "";
          if (showMatch) {
            var ord = Number(l.quantity || 0), rec = Number(l.qty_received || 0), bil = Number(l.qty_billed || 0);
            var badge = (bil > rec + 0.001) ? '<span class="badge unpaid">Billed &gt; received</span>' : (rec >= ord - 0.001 && bil >= ord - 0.001 ? '<span class="badge paid">Matched</span>' : (rec > 0.001 || bil > 0.001 ? '<span class="badge partial">In progress</span>' : '<span class="badge">Not received</span>'));
            matchCells = '<td class="num">' + rec + '</td><td class="num">' + bil + '</td><td>' + badge + '</td>';
          }
          return '<tr><td>' + esc(l.name) + '</td><td class="num">' + Number(l.quantity) + '</td>' + matchCells + '<td class="num">' + money(l.unit_price) + '</td><td>' + (amt ? amt + "%" : "-") + '</td><td class="num">' + money(l.quantity * l.unit_price) + '</td></tr>';
        }).join("");
        pg.innerHTML = '<table class="o-lines"><thead><tr><th>Description</th><th style="text-align:right">' + (showMatch ? "Ordered" : "Qty") + '</th>' + (showMatch ? '<th style="text-align:right">Received</th><th style="text-align:right">Billed</th><th>3-way match</th>' : '') + '<th style="text-align:right">Unit Price</th><th>Tax</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>' + body + '</tbody></table>' + totHTML();
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
        if (ps) ps.addEventListener("change", async function () { var pr = products.filter(function (x) { return x.id === ps.value; })[0]; if (!pr) return; tr.querySelector(".l-name").value = pr.name; var price = isSale ? pr.list_price : pr.cost_price; if (isSale) { var plp = await pricelistPriceFor(pr.id); if (plp != null) price = plp; } tr.querySelector(".l-price").value = price; var tx = isSale ? pr.sale_tax_id : pr.purchase_tax_id; if (tx) tr.querySelector(".l-tax").value = tx; recalc(); });
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
      var hdr = { partner_id: partnerId, date_order: document.getElementById("o-date").value, note: document.getElementById("o-ref").value.trim(), project_id: document.getElementById("o-proj") ? (document.getElementById("o-proj").value || null) : null, amount_untaxed: untax, amount_tax: tax, amount_total: untax + tax };
      if (!isSale) hdr.cost_code_id = document.getElementById("o-costcode") ? (document.getElementById("o-costcode").value || null) : null;
      var oid = id;
      if (id === "new") {
        hdr.company_id = S.company.id; hdr.currency_code = S.company.currency_code; hdr.state = confirmIt ? (isSale ? "sale" : "purchase") : "draft"; hdr.number = await nextOrderNumber(kind);
        var ins = await sb.from(tbl).insert(hdr).select("id").single(); if (ins.error) { toast("Could not save: " + errMsg(ins.error)); return null; } oid = ins.data.id;
      } else {
        if (confirmIt) hdr.state = isSale ? "sale" : "purchase";
        var up = await sb.from(tbl).update(hdr).eq("id", id); if (up.error) { toast("Could not save: " + errMsg(up.error)); return null; }
        await sb.from(ltbl).delete().eq("order_id", id);
      }
      var rows = lns.map(function (l, i) { return { company_id: S.company.id, order_id: oid, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, quantity: l.quantity, unit_price: l.unit_price, tax_id: l.tax_id, price_subtotal: l.quantity * l.unit_price }; });
      var lr = await sb.from(ltbl).insert(rows); if (lr.error) { toast("Lines failed: " + errMsg(lr.error)); return null; }
      return oid;
    }
    if (editable) {
      document.getElementById("o-discard").onclick = function () { go(listAction); };
      document.getElementById("o-save").onclick = async function () { var nid = await save(false); if (nid) { toast("Saved"); renderOrderForm(nid, kind); } };
      document.getElementById("o-confirm").onclick = async function () {
        var nid = await save(false); if (!nid) return;
        var doc = (await sb.from(tbl).select("amount_total,number").eq("id", nid).maybeSingle()).data || {};
        var gate = await approvalGate(isSale ? "sales_order" : "purchase_order", nid, doc.number, doc.amount_total, listAction);
        if (gate === "blocked") { renderOrderForm(nid, kind); return; }
        var nid2 = await save(true); if (nid2) { toast(isSale ? "Sales order confirmed" : "Purchase order confirmed"); renderOrderForm(nid2, kind); }
      };
    } else if (confirmed) {
      document.getElementById("o-toinv").onclick = function () { createInvoiceFromOrder(order, linesState, kind); };
      var recBtn = document.getElementById("o-receive"); if (recBtn) recBtn.onclick = function () { receivePOGoods(order, linesState); };
    }
  }
  // Goods receipt against a confirmed PO: mark lines received and pull storable products into stock.
  async function receivePOGoods(order, lines) {
    var prods = (await sb.from("products").select("id,type,cost_price,name").eq("company_id", S.company.id)).data || [];
    var prodBy = {}; prods.forEach(function (p) { prodBy[p.id] = p; });
    var inv = await ensureInventory();
    var got = 0, receivedAny = false;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      var ord = Number(l.quantity || 0), already = Number(l.qty_received || 0);
      if (already >= ord - 0.001) continue;                 // already received - don't double-receive
      var toRecv = ord - already; receivedAny = true;
      if (l.id) await sb.from("purchase_order_lines").update({ qty_received: ord }).eq("id", l.id);
      var pr = l.product_id ? prodBy[l.product_id] : null;
      if (pr && (pr.type === "storable" || pr.type === "consumable") && inv && inv.stock) {
        var r = await sb.from("stock_moves").insert({ company_id: S.company.id, product_id: pr.id, quantity: toRecv, location_id: inv.supplier, location_dest_id: inv.stock, project_id: order.project_id || null, state: "done", date: new Date().toISOString() }).select("id").single();
        if (!r.error) { await postStockValue("receive", pr, toRecv, r.data && r.data.id); got++; }
      }
    }
    if (!receivedAny) { toast("Already fully received"); return; }
    toast(got ? ("Goods received - " + got + " stock item(s) added to inventory") : "Goods received"); renderOrderForm(order.id, "purchase");
  }
  async function nextOrderNumber(kind) {
    var tbl = kind === "sale" ? "sale_orders" : "purchase_orders";
    var cfg = await seqCfg(kind === "sale" ? "SO" : "PO"), py = seqPrefixYear(cfg);
    var rows = (await sb.from(tbl).select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
    return py + seqPad(cfg, maxSeq(rows, py) + 1);
  }
  async function createInvoiceFromOrder(order, lines, kind) {
    var isSale = kind === "sale", moveType = isSale ? "out_invoice" : "in_invoice";
    var untax = lines.reduce(function (s, l) { return s + l.quantity * l.unit_price; }, 0);
    var hdr = { company_id: S.company.id, move_type: moveType, partner_id: order.partner_id, number: await nextNumber(moveType), invoice_date: today(), due_date: new Date(Date.now() + 2592e6).toISOString().slice(0, 10), currency_code: S.company.currency_code, state: "draft", project_id: order.project_id || null, amount_untaxed: untax, amount_total: untax, amount_residual: untax };
    hdr[isSale ? "sale_order_id" : "purchase_order_id"] = order.id;
    var ins = await sb.from("invoices").insert(hdr).select("id").single();
    if (ins.error) { toast("Could not create: " + errMsg(ins.error)); return; }
    var invId = ins.data.id;
    var rows = lines.map(function (l, i) { return { company_id: S.company.id, invoice_id: invId, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name, tax_id: l.tax_id, quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price }; });
    var lr = await sb.from("invoice_lines").insert(rows);
    if (lr.error) { toast("Invoice lines failed: " + errMsg(lr.error)); return; }
    if (!isSale) { for (var i = 0; i < lines.length; i++) { if (lines[i].id) await sb.from("purchase_order_lines").update({ qty_billed: Number(lines[i].quantity || 0) }).eq("id", lines[i].id); } }
    toast(isSale ? "Invoice created (draft)" : "Bill created (draft)");
    renderInvoiceForm(invId, moveType);
  }

  // ============================ PARTNER FORM ============================
  async function renderPartnerForm(id, kind) {
    var isCust = kind === "customer", isContact = kind === "contact";
    var parent = isContact ? { action: "contacts", title: "Contacts" } : { action: isCust ? "cust" : "vend", title: isCust ? "Customers" : "Vendors" };
    var backAction = isContact ? "contacts" : (isCust ? "cust" : "vend");
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var p = id === "new" ? {} : (await sb.from("partners").select("*").eq("id", id).maybeSingle()).data || {};
    var pricelists = (await sb.from("pricelists").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var banks = id === "new" ? [] : (await sb.from("partner_bank_accounts").select("*").eq("partner_id", id).order("id")).data || [];
    function bankRow(b) { b = b || {}; return '<tr><td><input class="pb-bank" value="' + esc(b.bank_name || "") + '" placeholder="Bank"></td><td><input class="pb-acc" value="' + esc(b.account_number || "") + '"></td><td><input class="pb-iban" value="' + esc(b.iban || "") + '"></td><td><input class="pb-cur" value="' + esc(b.currency_code || "") + '" style="width:70px"></td><td><button class="pb-del" style="border:none;background:none;color:var(--bad);cursor:pointer;font-size:16px">&times;</button></td></tr>'; }
    var invCount = id === "new" ? 0 : ((await sb.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", S.company.id).eq("partner_id", id).eq("move_type", isCust ? "out_invoice" : "in_invoice")).count || 0);
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (p.name || "");
    var smart = id !== "new" ? '<div class="o-smart"><button class="sb" id="sm-inv"><span class="v">' + invCount + '</span><span class="k">' + (isCust ? "Invoices" : "Bills") + '</span></button><button class="sb" id="sm-stmt"><span class="v">&#9776;</span><span class="k">Statement</span></button></div>' : "";
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="p-save">Save</button><button id="p-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet">' + smart +
      '<div class="o-title"><input id="p-name" value="' + esc(p.name || "") + '" placeholder="' + (isContact ? "Contact" : isCust ? "Customer" : "Vendor") + ' name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Contact person", '<input id="p-contact" value="' + esc(p.contact_person || "") + '" placeholder="Who you deal with">', "The person you actually talk to at this company.") +
      fld("Email", '<input id="p-email" value="' + esc(p.email || "") + '" placeholder="name@company.com">') +
      fld("Phone", '<input id="p-phone" value="' + esc(p.phone || "") + '">') +
      fld("Mobile", '<input id="p-mobile" value="' + esc(p.mobile || "") + '">') +
      fld("Tax / VAT no.", '<input id="p-vat" value="' + esc(p.vat || "") + '">') +
      '</div><div>' +
      fld("Street", '<input id="p-street" value="' + esc(p.street || "") + '">') +
      fld("City", '<input id="p-city" value="' + esc(p.city || "") + '">') +
      fld("Country", '<input id="p-country" value="' + esc(p.country || "") + '">') +
      '</div></div>' +
      '<div class="o-groups"><div>' +
      fld("Payment terms (days)", '<select id="p-payterms"><option value="">(none)</option><option value="0">Due on receipt</option><option value="15">15 days</option><option value="30">30 days</option><option value="45">45 days</option><option value="60">60 days</option><option value="90">90 days</option></select>', "Default number of days to pay. Pre-fills the due date on their invoices.") +
      fld("Credit limit", '<input id="p-credit" type="number" step="0.01" value="' + (p.credit_limit != null ? p.credit_limit : "") + '" placeholder="0 = no limit">', "A soft ceiling on how much they can owe. Leave blank for no limit.") +
      fld("Industry", '<input id="p-industry" value="' + esc(p.industry || "") + '" placeholder="e.g. Construction, Developer">', "Sector, for segmenting contacts.") +
      fld("Tags", '<input id="p-tags" value="' + esc(p.tags || "") + '" placeholder="comma-separated">', "Free tags, comma-separated.") +
      '</div><div>' +
      fld("Pricelist", '<select id="p-pl"><option value="">(default prices)</option>' + pricelists.map(function (x) { return '<option value="' + x.id + '"' + (p.pricelist_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select>', "Pricelist applied to this customer's sales-order lines.") +
      fld("Intercompany entity", '<select id="p-ic"><option value="">External party</option>' + S.companies.map(function (c) { return '<option value="' + c.id + '"' + (p.intercompany_company_id === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>'; }).join("") + '</select>', "If this party is one of your own group companies, tag it here so its balances net out in consolidation.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Bank accounts</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Bank</th><th>Account no.</th><th>IBAN</th><th>Currency</th><th></th></tr></thead><tbody id="pb-lines">' + (banks.length ? banks.map(bankRow).join("") : "") + '</tbody></table><button id="pb-add" class="o-addln">+ Add bank account</button></div></div>' +
      '</div>';
    if (id !== "new") {
      document.getElementById("sm-inv").onclick = function () { go(isCust ? "inv.out" : "inv.in"); };
      document.getElementById("sm-stmt").onclick = function () { renderStatement(id); };
    }
    function wireBankDel() { document.querySelectorAll("#pb-lines .pb-del").forEach(function (x) { x.onclick = function () { x.closest("tr").remove(); }; }); }
    wireBankDel();
    var ptEl = document.getElementById("p-payterms"); if (ptEl) ptEl.value = p.payment_days != null ? String(p.payment_days) : "";
    document.getElementById("pb-add").onclick = function () { document.getElementById("pb-lines").insertAdjacentHTML("beforeend", bankRow()); wireBankDel(); };
    document.getElementById("p-discard").onclick = function () { go(backAction); };
    document.getElementById("p-save").onclick = async function () {
      var name = document.getElementById("p-name").value.trim();
      if (!name) { toast("Name is required"); return; }
      var ptVal = document.getElementById("p-payterms") ? document.getElementById("p-payterms").value : "";
      var creditVal = gv("p-credit");
      var row = { name: name, contact_person: gv("p-contact"), email: gv("p-email"), phone: gv("p-phone"), mobile: gv("p-mobile"), vat: gv("p-vat"), street: gv("p-street"), city: gv("p-city"), country: gv("p-country"), payment_days: ptVal !== "" ? parseInt(ptVal, 10) : null, credit_limit: creditVal !== "" ? parseFloat(creditVal) : null, industry: gv("p-industry"), tags: gv("p-tags"), pricelist_id: (document.getElementById("p-pl") && document.getElementById("p-pl").value) || null, intercompany_company_id: (document.getElementById("p-ic") && document.getElementById("p-ic").value) || null };
      var r, sid = id;
      if (id === "new") { row.org_id = S.company.org_id; row.is_company = true; if (!isContact) { row.is_customer = isCust; row.is_vendor = !isCust; } var ins = await sb.from("partners").insert(row).select("id").single(); if (ins.error) { toast("Could not save: " + errMsg(ins.error)); return; } sid = ins.data.id; }
      else { r = await sb.from("partners").update(row).eq("id", id); if (r.error) { toast("Could not save: " + errMsg(r.error)); return; } }
      await sb.from("partner_bank_accounts").delete().eq("partner_id", sid);
      var bks = [].map.call(document.querySelectorAll("#pb-lines tr"), function (tr) { return { company_id: S.company.id, partner_id: sid, bank_name: tr.querySelector(".pb-bank").value.trim(), account_number: tr.querySelector(".pb-acc").value.trim(), iban: tr.querySelector(".pb-iban").value.trim(), currency_code: tr.querySelector(".pb-cur").value.trim() }; }).filter(function (b) { return b.bank_name || b.account_number || b.iban; });
      if (bks.length) await sb.from("partner_bank_accounts").insert(bks);
      toast("Saved"); go(backAction);
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
    var cats = (await sb.from("product_categories").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var uoms = (await sb.from("uoms").select("name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
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
      fld("Category", '<select id="pr-cat"><option value="">(none)</option>' + cats.map(function (c) { return '<option value="' + c.id + '"' + (p.category_id === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>'; }).join("") + '</select>', "Group this material, e.g. Aluminium, Glass, Hardware, Sealants, Steel.") +
      fld("Type", typeSel) +
      fld("Unit of Measure", '<select id="pr-uom"><option value="">(none)</option>' + uoms.map(function (u) { return '<option value="' + esc(u.name) + '"' + (p.uom === u.name ? " selected" : "") + '>' + esc(u.name) + '</option>'; }).join("") + '</select>', "How it is measured & stocked, e.g. m2, kg, tube, box.") +
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
        category_id: document.getElementById("pr-cat").value || null, uom: gv("pr-uom") || null,
        list_price: parseFloat(gv("pr-price")) || 0, cost_price: parseFloat(gv("pr-cost")) || 0,
        income_account_id: document.getElementById("pr-inc").value || null, expense_account_id: document.getElementById("pr-exp").value || null,
        sale_tax_id: document.getElementById("pr-stax").value || null, purchase_tax_id: document.getElementById("pr-ptax").value || null,
        is_active: document.getElementById("pr-active").value === "1"
      };
      var r;
      if (id === "new") { row.company_id = S.company.id; r = await sb.from("products").insert(row); }
      else r = await sb.from("products").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not register: " + errMsg(r.error)); return; }
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
    var _db = document.getElementById("db"); if (!_db) return;   // guard: user navigated away before this async render resolved
    _db.className = "";
    _db.innerHTML =
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
    var cons = {}, entities = [], missing = {}, factorByCo = {};
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
      factorByCo[co.id] = factor;
    }
    var rows = Object.keys(cons).map(function (k) { return cons[k]; }).sort(function (a, b) { return (a.code || "") < (b.code || "") ? -1 : 1; });
    // Intercompany eliminations: partners tagged as a group company -> their sales/costs + AR/AP net out
    var icPartners = (await sb.from("partners").select("id,name,intercompany_company_id").not("intercompany_company_id", "is", null)).data || [];
    var icRev = 0, icCost = 0, icAR = 0, icAP = 0, icCount = 0;
    if (icPartners.length) {
      var icIds = icPartners.map(function (p) { return p.id; });
      var coIds = S.companies.map(function (c) { return c.id; });
      var icInv = (await sb.from("invoices").select("company_id,move_type,amount_untaxed,amount_residual,partner_id").in("company_id", coIds).eq("state", "posted").in("partner_id", icIds)).data || [];
      icInv.forEach(function (v) {
        var f = factorByCo[v.company_id] || 1, u = Number(v.amount_untaxed || 0) * f, r = Number(v.amount_residual || 0) * f; icCount++;
        if (v.move_type === "out_invoice") { icRev += u; icAR += r; }
        else if (v.move_type === "in_invoice") { icCost += u; icAP += r; }
        else if (v.move_type === "out_refund") { icRev -= u; icAR -= r; }
        else if (v.move_type === "in_refund") { icCost -= u; icAP -= r; }
      });
    }
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
    // group figures after intercompany eliminations
    var gInc = inc.t - icRev, gExp = expT - icCost, gResult = gInc - gExp;
    var gAssets = a.t - icAR, gLiab = l.t - icAP;
    var cta = gAssets - (gLiab + eq.t + gResult); // translation plug so the group balance sheet balances
    document.getElementById("rep").innerHTML =
      '<h1>Consolidated Financials</h1><div class="sub">' + esc(S.org ? S.org.name : "") + ' &middot; ' + S.companies.length + ' entities &middot; presented in ' + esc(ref) + ' &middot; as of ' + today() + '</div>' + banner +
      '<table class="o-rt"><tbody><tr class="sec"><td colspan="5">Entities</td></tr>' +
      '<tr style="font-size:11px;color:var(--ink3)"><td>Entity</td><td>Currency</td><td class="num">Rate &rarr; ' + esc(ref) + '</td><td class="num">Assets</td><td class="num">Result</td></tr>' +
      entRows + '</tbody></table>' +
      (icCount ? '<table class="o-rt" style="margin-top:20px"><tbody><tr class="sec"><td colspan="2">Intercompany eliminations &middot; ' + icPartners.length + ' related ' + (icPartners.length > 1 ? "parties" : "party") + '</td></tr>' +
        '<tr><td>Intercompany revenue / cost eliminated</td><td class="num">' + money(icRev) + ' / ' + money(icCost) + '</td></tr>' +
        '<tr><td>Intercompany receivables / payables eliminated</td><td class="num">' + money(icAR) + ' / ' + money(icAP) + '</td></tr></tbody></table>' : '') +
      '<table class="o-rt" style="margin-top:20px"><tbody><tr class="sec"><td colspan="3">Group Profit &amp; Loss' + (icCount ? ' (after eliminations)' : '') + '</td></tr>' +
      (inc.html || repEmpty()) + '<tr class="tot"><td></td><td>Total Income</td><td class="num">' + money(inc.t) + '</td></tr>' +
      (icRev ? repLine("", "less: intercompany revenue", -icRev) + '<tr class="tot"><td></td><td>Group Income</td><td class="num">' + money(gInc) + '</td></tr>' : '') +
      (expHtml || repEmpty()) + '<tr class="tot"><td></td><td>Total Expenses</td><td class="num">' + money(expT) + '</td></tr>' +
      (icCost ? repLine("", "less: intercompany costs", -icCost) + '<tr class="tot"><td></td><td>Group Expenses</td><td class="num">' + money(gExp) + '</td></tr>' : '') +
      '<tr class="tot"><td></td><td>Group Net Profit' + (icCount ? ' (after eliminations)' : '') + '</td><td class="num">' + money(gResult) + '</td></tr></tbody></table>' +
      '<table class="o-rt" style="margin-top:20px"><tbody><tr class="sec"><td colspan="3">Group Balance Sheet</td></tr>' +
      (a.html || repEmpty()) + '<tr class="tot"><td></td><td>Total Assets</td><td class="num">' + money(a.t) + '</td></tr>' +
      (icAR ? repLine("", "less: intercompany receivables", -icAR) + '<tr class="tot"><td></td><td>Group Assets</td><td class="num">' + money(gAssets) + '</td></tr>' : '') +
      (l.html || repEmpty()) + '<tr class="tot"><td></td><td>Total Liabilities</td><td class="num">' + money(l.t) + '</td></tr>' +
      (icAP ? repLine("", "less: intercompany payables", -icAP) + '<tr class="tot"><td></td><td>Group Liabilities</td><td class="num">' + money(gLiab) + '</td></tr>' : '') +
      (eq.html || repEmpty()) + repLine("", "Current Year Earnings", gResult) + repLine("", "Currency translation adjustment", cta) +
      '<tr class="tot"><td></td><td>Total Equity</td><td class="num">' + money(eq.t + gResult + cta) + '</td></tr>' +
      '<tr class="tot"><td></td><td>Total Liabilities + Equity</td><td class="num">' + money(gLiab + eq.t + gResult + cta) + '</td></tr></tbody></table>' +
      '<div class="sub" style="margin-top:12px">Each entity is translated to ' + esc(ref) + ' at the entered rate. Balances with parties tagged as a group company (intercompany) are eliminated so internal trade is not double-counted. The <b>currency translation adjustment</b> is the FX effect of translating multi-currency entities and keeps the group balance sheet balancing. Realised FX gain/loss on a foreign-currency invoice is recognised in the entity on settlement; each entity trades in its own currency, so the group FX effect shows here as the translation adjustment.</div>';
    var cr = document.getElementById("cons-rates"); if (cr) cr.onclick = function () { go("rates"); };
  }

  // ============================ CASH FLOW FORECAST ============================
  async function renderCashForecast() {
    var cc = S.company.currency_code;
    document.getElementById("o-main").innerHTML = repChrome("Cash Flow Forecast", true);
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var ex = document.getElementById("rp-export"); if (ex) ex.onclick = exportRepCsv;
    // opening cash = bank + cash GL balances (codes 51xx bank, 53xx cash)
    var tb = (await sb.rpc("trial_balance", { p_company: S.company.id })).data || [];
    var opening = 0; tb.forEach(function (r) { var code = String(r.code || ""); if (code.charAt(0) === "5" && (code.charAt(1) === "1" || code.charAt(1) === "3")) opening += Number(r.balance || 0); });
    var WK = 13;
    var start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday of this week
    var buckets = []; for (var w = 0; w < WK; w++) { var d = new Date(start); d.setDate(start.getDate() + w * 7); buckets.push({ start: d, inflow: 0, outflow: 0 }); }
    function idxFor(dateStr) { var d = parseD(dateStr); if (!d) return 0; var diff = Math.floor((d - start) / 6048e5); if (diff < 0) return 0; if (diff >= WK) return -1; return diff; }
    function addIn(dateStr, amt) { var i = idxFor(dateStr); if (i < 0) return; buckets[i].inflow += amt; }
    function addOut(dateStr, amt) { var i = idxFor(dateStr); if (i < 0) return; buckets[i].outflow += amt; }
    // AR / AP open documents by due date
    var docs = (await sb.from("invoices").select("move_type,due_date,amount_residual").eq("company_id", S.company.id).eq("state", "posted").gt("amount_residual", 0.005)).data || [];
    docs.forEach(function (d) {
      var amt = Number(d.amount_residual || 0);
      if (d.move_type === "out_invoice") addIn(d.due_date, amt);
      else if (d.move_type === "out_refund") addOut(d.due_date, amt);
      else if (d.move_type === "in_invoice") addOut(d.due_date, amt);
      else if (d.move_type === "in_refund") addIn(d.due_date, amt);
    });
    // committed POs (unbilled) by planned date
    var poLines = (await sb.from("purchase_order_lines").select("price_subtotal,quantity,qty_billed, purchase_orders!inner(id,date_planned,state,company_id)").eq("purchase_orders.company_id", S.company.id).in("purchase_orders.state", ["draft", "sent", "purchase"])).data || [];
    var poByOrder = {};
    poLines.forEach(function (l) { var po = l.purchase_orders; var q = Number(l.quantity || 0), b = Number(l.qty_billed || 0), frac = q > 0 ? Math.max(0, (q - b) / q) : 1, v = Number(l.price_subtotal || 0) * frac; if (!poByOrder[po.id]) poByOrder[po.id] = { date: po.date_planned, amt: 0 }; poByOrder[po.id].amt += v; });
    Object.keys(poByOrder).forEach(function (k) { if (poByOrder[k].amt > 0.005) addOut(poByOrder[k].date, poByOrder[k].amt); });
    // payroll estimate: running contracts monthly gross at each month-end within horizon
    var contracts = (await sb.from("hr_contracts").select("wage,state").eq("company_id", S.company.id).eq("state", "running")).data || [];
    var monthlyPayroll = contracts.reduce(function (s, c) { return s + Number(c.wage || 0); }, 0);
    if (monthlyPayroll > 0) buckets.forEach(function (b) { var bs = b.start, be = new Date(bs); be.setDate(bs.getDate() + 6); var me = new Date(bs.getFullYear(), bs.getMonth() + 1, 0); if (me >= bs && me <= be) addOut(fmtD(me), monthlyPayroll); });
    // client retention expected release (projects with a retention_due_date)
    var projs = (await sb.from("projects").select("id,name,retention_due_date").eq("company_id", S.company.id).not("retention_due_date", "is", null)).data || [];
    if (projs.length) {
      var pIds = projs.map(function (p) { return p.id; });
      var certs = (await sb.from("project_certificates").select("project_id,retention_amount,state,date_to").in("project_id", pIds).neq("state", "draft").order("date_to")).data || [];
      var latestRet = {}; certs.forEach(function (c) { latestRet[c.project_id] = Number(c.retention_amount || 0); });
      var rels = (await sb.from("retention_releases").select("project_id,amount").in("project_id", pIds)).data || [];
      var relBy = {}; rels.forEach(function (r) { if (r.project_id) relBy[r.project_id] = (relBy[r.project_id] || 0) + Number(r.amount || 0); });
      projs.forEach(function (p) { var out = (latestRet[p.id] || 0) - (relBy[p.id] || 0); if (out > 0.005) addIn(p.retention_due_date, out); });
    }
    var run = opening, low = opening, rows = "";
    buckets.forEach(function (b, i) {
      var net = b.inflow - b.outflow; run += net; if (run < low) low = run;
      var cls = run < 0 ? ' style="color:var(--bad);font-weight:700"' : '';
      rows += '<tr><td class="muted">Wk ' + (i + 1) + ' &middot; ' + fmtD(b.start) + '</td><td class="num" style="color:var(--good)">' + money(b.inflow) + '</td><td class="num" style="color:var(--bad)">' + money(b.outflow) + '</td><td class="num"' + (net < 0 ? ' style="color:var(--bad)"' : '') + '>' + money(net) + '</td><td class="num"' + cls + '>' + money(run) + '</td></tr>';
    });
    var kpi = function (l, v, col) { return '<div class="kpi"><div class="l">' + l + '</div><div class="n"' + (col ? ' style="color:' + col + '"' : '') + '>' + cc + ' ' + money(v) + '</div></div>'; };
    document.getElementById("rep").innerHTML = repHead("Cash Flow Forecast (13 weeks)", cc) +
      '<div class="kpis" style="margin:14px 0 4px">' + kpi("Opening cash", opening) + kpi("Lowest projected", low, low < 0 ? 'var(--bad)' : '') + kpi("Projected in 13 weeks", run, run < 0 ? 'var(--bad)' : '') + '</div>' +
      (low < 0 ? '<div class="ob-banner">! Cash is projected to go negative within 13 weeks (low ' + cc + ' ' + money(low) + '). Chase receivables or defer commitments.</div>' : '') +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Week</td><td class="num">Inflows</td><td class="num">Outflows</td><td class="num">Net</td><td class="num">Running cash</td></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="sub" style="margin-top:8px">Opening cash = bank + cash GL balances. Inflows = customer invoices due + expected retention releases (on a project\'s Retention due date). Outflows = vendor bills due, unbilled committed POs (by planned date), and estimated monthly payroll (running contracts). Overdue items sit in week 1. Anything due beyond 13 weeks is excluded.</div>';
  }

  // ============================ COLLECTIONS (overdue AR follow-up) ============================
  async function renderCollections() {
    var cc = S.company.currency_code;
    document.getElementById("o-main").innerHTML = repChrome("Collections", true);
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var ex = document.getElementById("rp-export"); if (ex) ex.onclick = exportRepCsv;
    var today0 = new Date(); today0.setHours(0, 0, 0, 0);
    function daysLate(due) { var d = parseD(due); return d ? Math.floor((today0 - d) / 864e5) : 0; }
    var docs = (await sb.from("invoices").select("id,number,move_type,due_date,amount_residual,partner_id,partners(name,phone,email)").eq("company_id", S.company.id).eq("state", "posted").eq("move_type", "out_invoice").gt("amount_residual", 0.005)).data || [];
    var over = docs.filter(function (d) { return daysLate(d.due_date) > 0; });
    var fu = (await sb.from("ar_followups").select("*").eq("company_id", S.company.id).order("followup_date", { ascending: false })).data || [];
    var lastByInv = {}, lastByPartner = {}; fu.forEach(function (f) { if (f.invoice_id && !lastByInv[f.invoice_id]) lastByInv[f.invoice_id] = f; if (f.partner_id && !lastByPartner[f.partner_id]) lastByPartner[f.partner_id] = f; });
    var levels = (await sb.from("followup_levels").select("*").eq("company_id", S.company.id).order("days", { ascending: false })).data || [];
    function levelFor(dl) { for (var i = 0; i < levels.length; i++) { if (dl >= Number(levels[i].days || 0)) return levels[i]; } return null; }
    var byP = {}; over.forEach(function (d) { var k = d.partner_id || "none"; (byP[k] = byP[k] || { name: d.partners ? d.partners.name : "(no customer)", phone: d.partners ? d.partners.phone : "", rows: [], total: 0 }).rows.push(d); byP[k].total += Number(d.amount_residual || 0); });
    var totalOver = over.reduce(function (s, d) { return s + Number(d.amount_residual || 0); }, 0);
    var bk = { "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    over.forEach(function (d) { var dl = daysLate(d.due_date); bk[dl <= 30 ? "1-30" : dl <= 60 ? "31-60" : dl <= 90 ? "61-90" : "90+"] += Number(d.amount_residual || 0); });
    var sections = Object.keys(byP).sort(function (a, b) { return byP[b].total - byP[a].total; }).map(function (k) {
      var p = byP[k], lp = lastByPartner[k];
      var invRows = p.rows.sort(function (a, b) { return daysLate(b.due_date) - daysLate(a.due_date); }).map(function (d) {
        var dl = daysLate(d.due_date), lf = lastByInv[d.id], lv = levelFor(dl);
        var stat = lf ? '<span class="muted">' + esc(lf.status) + (lf.promised_date ? ' &middot; promised ' + esc(lf.promised_date) : '') + '</span>' : '<span class="muted">-</span>';
        var sugg = lv ? '<span class="ob-flag" style="background:' + (lv.action === "legal" ? "var(--bad)" : lv.action === "letter" ? "var(--warn)" : "var(--accent)") + '" title="' + esc(lv.message || "") + '">' + esc(lv.name) + '</span>' : '<span class="muted">-</span>';
        return '<tr><td>' + esc(d.number || "") + '</td><td class="muted">' + esc(d.due_date || "") + '</td><td class="num"' + (dl > 60 ? ' style="color:var(--bad)"' : '') + '>' + dl + '</td><td class="num">' + money(d.amount_residual) + '</td><td>' + sugg + '</td><td>' + stat + '</td><td><button class="fu-btn" data-inv="' + d.id + '" data-p="' + (d.partner_id || "") + '" style="padding:3px 10px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--accent);font:inherit;font-size:12px;cursor:pointer">Log follow-up</button></td></tr>';
      }).join("");
      return '<tr class="sec"><td colspan="7"><b>' + esc(p.name) + '</b> &middot; ' + cc + ' ' + money(p.total) + ' overdue' + (p.phone ? ' &middot; ' + esc(p.phone) : '') + (lp && lp.next_action_date ? ' &middot; next action ' + esc(lp.next_action_date) : '') + '</td></tr>' + invRows;
    }).join("");
    var kpi = function (l, v) { return '<div class="kpi"><div class="l">' + l + '</div><div class="n">' + cc + ' ' + money(v) + '</div></div>'; };
    document.getElementById("rep").innerHTML = repHead("Collections - overdue receivables", cc) +
      '<div class="kpis" style="margin:14px 0 4px">' + kpi("Total overdue", totalOver) + kpi("1-30 days", bk["1-30"]) + kpi("31-60", bk["31-60"]) + kpi("61-90", bk["61-90"]) + kpi("90+ days", bk["90+"]) + '</div>' +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Invoice</td><td>Due</td><td class="num">Days late</td><td class="num">Amount due</td><td>Suggested</td><td>Last follow-up</td><td></td></tr></thead><tbody>' + (sections || '<tr><td colspan="7" class="muted">No overdue receivables. Nicely done.</td></tr>') + '</tbody></table></div>' +
      '<div class="sub" style="margin-top:8px">Overdue = posted customer invoices past their due date with a balance. <b>Suggested</b> comes from your follow-up levels (Accounting &rsaquo; Configuration &rsaquo; Follow-up Levels). Use Log follow-up to record a call/email, a promise-to-pay date, and the next chase date.</div>';
    document.querySelectorAll(".fu-btn").forEach(function (b) { b.onclick = function () { openFollowupModal(b.dataset.inv, b.dataset.p); }; });
  }
  async function openFollowupModal(invoiceId, partnerId) {
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Log follow-up</h3><div class="form">' +
      '<div class="row2"><div><label>Date</label>' + fhint("__fud", "When you contacted them.") + '<input id="fu-date" type="date" value="' + today() + '"></div>' +
      '<div><label>Channel</label>' + fhint("__fuc", "How you reached out.") + '<select id="fu-ch"><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option><option value="letter">Letter</option></select></div></div>' +
      '<div><label>Note</label>' + fhint("__fun", "What was said.") + '<input id="fu-note" placeholder="e.g. Spoke to accounts, awaiting director sign-off"></div>' +
      '<div class="row2"><div><label>Promised date</label>' + fhint("__fup", "If they promised to pay by a date.") + '<input id="fu-pd" type="date"></div>' +
      '<div><label>Promised amount</label>' + fhint("__fua", "Amount promised, optional.") + '<input id="fu-pa" type="number" step="0.01" value="0"></div></div>' +
      '<div class="row2"><div><label>Next action date</label>' + fhint("__fna", "When to chase again.") + '<input id="fu-na" type="date"></div>' +
      '<div><label>Status</label>' + fhint("__fus", "Where this stands.") + '<select id="fu-st"><option value="open">Open</option><option value="promised">Promised to pay</option><option value="escalated">Escalated</option><option value="paid">Paid</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="fu-cancel">Cancel</button><button class="btn pri" id="fu-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("fu-cancel").onclick = function () { m.remove(); };
    document.getElementById("fu-save").onclick = async function () {
      var row = { company_id: S.company.id, invoice_id: invoiceId || null, partner_id: partnerId || null, followup_date: document.getElementById("fu-date").value, channel: document.getElementById("fu-ch").value, note: document.getElementById("fu-note").value.trim(), promised_date: document.getElementById("fu-pd").value || null, promised_amount: parseFloat(document.getElementById("fu-pa").value) || 0, next_action_date: document.getElementById("fu-na").value || null, status: document.getElementById("fu-st").value };
      var r = await sb.from("ar_followups").insert(row); if (r.error) { toast(errMsg(r.error)); return; }
      m.remove(); toast("Follow-up logged"); renderCollections();
    };
  }

  // ============================ PLANNING (shifts + templates) ============================
  function cfgShiftTemplates() {
    return {
      title: "Shift Templates", pageSize: 60,
      fetch: function () { return sb.from("shift_templates").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.name || "") + " " + (s.role || ""); },
      columns: [{ label: "Name", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } }, { label: "Role", get: function (s) { return esc(s.role || ""); } }, { label: "Time", get: function (s) { return esc((s.start_time || "") + " - " + (s.end_time || "")); } }, { label: "Hours", num: true, get: function (s) { return Number(s.hours || 0); } }],
      onOpen: function (s) { openShiftTemplateModal(s); }, onNew: function () { openShiftTemplateModal(null); }
    };
  }
  function openShiftTemplateModal(s) {
    s = s || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (s.id ? "Edit" : "New") + ' shift template</h3><div class="form">' +
      '<div class="row2"><div><label>Name</label><input id="st2-name" value="' + esc(s.name || "") + '"></div><div><label>Role</label><input id="st2-role" value="' + esc(s.role || "") + '" placeholder="e.g. Installer, Foreman"></div></div>' +
      '<div class="row2"><div><label>Start</label><input id="st2-start" value="' + esc(s.start_time || "08:00") + '"></div><div><label>End</label><input id="st2-end" value="' + esc(s.end_time || "17:00") + '"></div></div>' +
      '<div><label>Hours</label><input id="st2-hours" type="number" step="0.25" value="' + (s.hours || 8) + '"></div>' +
      '</div><div class="foot"><button class="btn" id="st2-cancel">Cancel</button>' + (s.id ? '<button class="btn" id="st2-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="st2-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("st2-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("st2-del"); if (del) del.onclick = async function () { await sb.from("shift_templates").delete().eq("id", s.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("st2-save").onclick = async function () {
      var row = { name: gv("st2-name") || "Shift", role: gv("st2-role"), start_time: gv("st2-start"), end_time: gv("st2-end"), hours: parseFloat(gv("st2-hours")) || 8 };
      var r; if (s.id) r = await sb.from("shift_templates").update(row).eq("id", s.id); else { row.company_id = S.company.id; r = await sb.from("shift_templates").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgPlanning() {
    return {
      title: "Planning", pageSize: 120,
      fetch: function () { return sb.from("planning_shifts").select("*, hr_employees(name), projects(name)").eq("company_id", S.company.id).order("shift_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.role || "") + " " + (s.hr_employees ? s.hr_employees.name : "") + " " + (s.projects ? s.projects.name : ""); },
      columns: [
        { label: "Date", get: function (s) { return '<b>' + esc(s.shift_date || "") + '</b>'; } },
        { label: "Assignee", get: function (s) { return s.hr_employees ? esc(s.hr_employees.name) : '<span class="ob-flag" style="background:var(--warn)">OPEN</span>'; } },
        { label: "Role", get: function (s) { return esc(s.role || ""); } },
        { label: "Project", get: function (s) { return esc(s.projects ? s.projects.name : ""); } },
        { label: "Time", get: function (s) { return esc((s.start_time || "") + " - " + (s.end_time || "")); } },
        { label: "Hours", num: true, get: function (s) { return Number(s.hours || 0); } },
        { label: "Published", get: function (s) { return s.published ? '<span class="badge paid">Published</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Open shifts", test: function (s) { return !s.employee_id; } }, { label: "Published", test: function (s) { return s.published; } }, { label: "Draft", test: function (s) { return !s.published; } }],
      groupBy: [{ label: "Assignee", get: function (s) { return s.hr_employees ? s.hr_employees.name : "Open shift"; } }, { label: "Role", get: function (s) { return s.role || "None"; } }, { label: "Project", get: function (s) { return s.projects ? s.projects.name : "None"; } }],
      onOpen: function (s) { openPlanningShiftModal(s); }, onNew: function () { openPlanningShiftModal(null); }
    };
  }
  async function openPlanningShiftModal(s) {
    s = s || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var tmpls = (await sb.from("shift_templates").select("*").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (s.id ? "Edit" : "New") + ' shift</h3><div class="form">' +
      (tmpls.length ? '<div><label>From template</label>' + fhint("__pt", "Load role + times from a shift template.") + '<select id="ps-tmpl"><option value="">(none)</option>' + tmpls.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join("") + '</select></div>' : "") +
      '<div class="row2"><div><label>Assignee</label>' + fhint("__pa", "Leave as Open shift to publish an unassigned slot.") + '<select id="ps-emp"><option value="">Open shift</option>' + empOptions(emps, s.employee_id) + '</select></div><div><label>Role</label><input id="ps-role" value="' + esc(s.role || "") + '"></div></div>' +
      '<div class="row2"><div><label>Project</label><select id="ps-proj"><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (s.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div><div><label>Date</label><input id="ps-date" type="date" value="' + (s.shift_date || today()) + '"></div></div>' +
      '<div class="row2"><div><label>Start</label><input id="ps-start" value="' + esc(s.start_time || "08:00") + '"></div><div><label>End</label><input id="ps-end" value="' + esc(s.end_time || "17:00") + '"></div></div>' +
      '<div class="row2"><div><label>Hours</label><input id="ps-hours" type="number" step="0.25" value="' + (s.hours || 8) + '"></div><div><label>Status</label><select id="ps-pub"><option value="0">Draft</option><option value="1">Published</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="ps-cancel">Cancel</button>' + (s.id ? '<button class="btn" id="ps-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="ps-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ps-pub").value = s.published ? "1" : "0";
    var tsel = document.getElementById("ps-tmpl"); if (tsel) tsel.onchange = function () { var t = tmpls.filter(function (x) { return x.id === tsel.value; })[0]; if (t) { document.getElementById("ps-role").value = t.role || ""; document.getElementById("ps-start").value = t.start_time || ""; document.getElementById("ps-end").value = t.end_time || ""; document.getElementById("ps-hours").value = t.hours || 8; } };
    document.getElementById("ps-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("ps-del"); if (del) del.onclick = async function () { await sb.from("planning_shifts").delete().eq("id", s.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("ps-save").onclick = async function () {
      var row = { employee_id: document.getElementById("ps-emp").value || null, role: gv("ps-role"), project_id: document.getElementById("ps-proj").value || null, shift_date: gv("ps-date") || null, start_time: gv("ps-start"), end_time: gv("ps-end"), hours: parseFloat(gv("ps-hours")) || 0, published: document.getElementById("ps-pub").value === "1" };
      var r; if (s.id) r = await sb.from("planning_shifts").update(row).eq("id", s.id); else { row.company_id = S.company.id; r = await sb.from("planning_shifts").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }

  // ============================ CONTACTS (unified directory + tags) ============================
  function cfgContacts() {
    return {
      title: "Contacts", pageSize: 80,
      fetch: function () { return sb.from("partners").select("*").order("name").then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.name || "") + " " + (p.email || "") + " " + (p.city || "") + " " + (p.industry || ""); },
      columns: [
        { label: "Name", get: function (p) { return '<b>' + esc(p.name) + '</b>'; } },
        { label: "Type", get: function (p) { var t = []; if (p.is_customer) t.push("Customer"); if (p.is_vendor) t.push("Vendor"); return '<span class="muted">' + (t.join(" / ") || "Contact") + '</span>'; } },
        { label: "Industry", get: function (p) { return esc(p.industry || ""); } },
        { label: "Email", get: function (p) { return '<span class="muted">' + esc(p.email || "") + '</span>'; } },
        { label: "City", get: function (p) { return esc(p.city || ""); } }
      ],
      filters: [{ label: "Customers", test: function (p) { return p.is_customer; } }, { label: "Vendors", test: function (p) { return p.is_vendor; } }, { label: "Intercompany", test: function (p) { return !!p.intercompany_company_id; } }],
      groupBy: [{ label: "Industry", get: function (p) { return p.industry || "None"; } }, { label: "Country", get: function (p) { return p.country || "None"; } }],
      onOpen: function (p) { renderPartnerForm(p.id, "contact"); }, onNew: function () { renderPartnerForm("new", "contact"); }
    };
  }
  function cfgContactTags() {
    return {
      title: "Contact Tags", pageSize: 60,
      fetch: function () { return sb.from("contact_tags").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (t) { return t.name || ""; },
      columns: [{ label: "Tag", get: function (t) { return '<b>' + esc(t.name) + '</b>'; } }, { label: "Colour", get: function (t) { return t.color ? '<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:' + esc(t.color) + ';vertical-align:middle"></span> ' + esc(t.color) : ''; } }],
      onOpen: function (t) { openContactTagModal(t); }, onNew: function () { openContactTagModal(null); }
    };
  }
  function openContactTagModal(t) {
    t = t || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (t.id ? "Edit" : "New") + ' tag</h3><div class="form">' +
      '<div class="row2"><div><label>Name</label><input id="ct-name" value="' + esc(t.name || "") + '"></div><div><label>Colour</label><input id="ct-color" type="color" value="' + (t.color || "#2f6bff") + '"></div></div>' +
      '</div><div class="foot"><button class="btn" id="ct-cancel">Cancel</button>' + (t.id ? '<button class="btn" id="ct-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="ct-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ct-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("ct-del"); if (del) del.onclick = async function () { await sb.from("contact_tags").delete().eq("id", t.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("ct-save").onclick = async function () {
      var row = { name: gv("ct-name") || "Tag", color: document.getElementById("ct-color").value };
      var r; if (t.id) r = await sb.from("contact_tags").update(row).eq("id", t.id); else { row.company_id = S.company.id; r = await sb.from("contact_tags").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }

  // ============================ SETTINGS: USERS & ROLES ============================
  function slugify(s) { return ((s || "role").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40)) || "role"; }
  async function rolesForOrg() {
    var roles = (await sb.from("roles").select("*").or("org_id.eq." + S.company.org_id + ",org_id.is.null")).data || [];
    var bySlug = {}; roles.forEach(function (r) { if (!bySlug[r.slug] || r.org_id) bySlug[r.slug] = r; });   // org copy overrides global
    return Object.keys(bySlug).map(function (k) { return bySlug[k]; }).sort(function (a, b) { return b.rank - a.rank; });
  }
  async function renderUsers() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Users & Roles") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var members = (await sb.from("org_members").select("*").eq("org_id", S.company.org_id)).data || [];
    var roleList = await rolesForOrg();
    var ids = members.map(function (m) { return m.user_id; }).filter(Boolean);
    var profs = ids.length ? ((await sb.from("profiles").select("*").in("id", ids)).data || []) : [];
    var pmap = {}; profs.forEach(function (p) { pmap[p.id] = p; });
    var myRank = myRoleRank();
    var body = document.getElementById("o-body");
    var rows = members.map(function (mem) {
      var mine = mem.user_id === (S.user && S.user.id);
      var p = pmap[mem.user_id] || {};
      var who = esc(p.full_name || p.email || ((mem.user_id || "").slice(0, 8) + "..."));
      var known = roleList.some(function (r) { return r.slug === mem.role; });
      var opts = roleList.map(function (r) {
        var dis = r.rank > myRank && r.slug !== mem.role;   // cannot assign a role above your own rank
        return '<option value="' + r.slug + '"' + (mem.role === r.slug ? " selected" : "") + (dis ? " disabled" : "") + '>' + esc(r.label || r.slug) + '</option>';
      }).join("") + (known ? "" : '<option selected>' + esc(mem.role || "(none)") + '</option>');
      var sel = '<select class="um-role" data-id="' + mem.id + '"' + (mine ? " disabled" : "") + '>' + opts + '</select>';
      return '<tr><td><b>' + who + '</b>' + (mine ? ' <span class="badge paid">you</span>' : '') + '</td><td>' + sel + '</td></tr>';
    }).join("");
    var manageBtn = canManageRoles() ? '<button class="o-filtbtn" id="ur-manage" style="margin-left:auto">Manage roles &amp; permissions</button>' : '';
    body.innerHTML = '<div style="padding:16px"><div class="card"><div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0">Team members</h3>' + manageBtn + '</div>' +
      '<div class="sub" style="margin:6px 0 12px">Each person\'s role controls which apps they see and what they can change. Define roles in Roles &amp; Permissions.</div>' +
      '<table><thead><tr><th>User</th><th style="width:260px">Role</th></tr></thead><tbody>' + (rows || '<tr><td colspan="2" class="muted">No members.</td></tr>') + '</tbody></table>' +
      '<div class="sub" style="margin-top:10px">To add a teammate: they sign up in the app, then set their role here. You cannot change your own role.</div></div></div>';
    var mb = document.getElementById("ur-manage"); if (mb) mb.onclick = function () { go("settings.roles"); };
    body.querySelectorAll(".um-role").forEach(function (s) { s.onchange = async function () { var r = await sb.from("org_members").update({ role: s.value }).eq("id", s.dataset.id); if (r.error) { toast(errMsg(r.error)); } else toast("Role updated"); }; });
  }

  // ============================ SETTINGS: ROLES & PERMISSIONS ============================
  async function renderRoles() {
    if (!canManageRoles()) { toast("Only owners and super admins can manage roles"); go("companies"); return; }
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Roles & Permissions") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var list = await rolesForOrg();
    var bySlug = {}; list.forEach(function (r) { bySlug[r.slug] = r; });
    var myRank = myRoleRank();
    var body = document.getElementById("o-body");
    var cards = list.map(function (r) {
      var editable = !r.protected && (S.role.full_access || r.rank < myRank);
      var isOrg = !!r.org_id;
      var tags = (isOrg ? '<span class="badge draft">Custom</span>' : '<span class="badge">Template</span>') +
        (r.full_access ? ' <span class="badge paid">Full access</span>' : '') +
        (r.can_see_money === false ? ' <span class="badge unpaid">No money</span>' : '') +
        (r.can_manage_roles ? ' <span class="badge">Roles</span>' : '');
      var actions = (isOrg && editable ? '<button class="o-filtbtn rl-del" data-id="' + r.id + '" style="color:var(--bad)">Delete</button>' : '') +
        (editable ? '<button class="o-filtbtn rl-edit" data-slug="' + r.slug + '">' + (isOrg ? "Edit" : "Customize") + '</button>' : '<span class="muted" style="font-size:11.5px">Locked</span>');
      return '<div class="rl-card"><div class="rl-h"><b>' + esc(r.label || r.slug) + '</b> ' + tags + '</div>' +
        '<div class="muted" style="font-size:12.5px;margin:4px 0 8px">' + esc(r.description || "") + '</div>' +
        '<div class="rl-f"><span class="muted" style="font-size:11.5px">Rank ' + r.rank + '</span><div style="margin-left:auto;display:flex;gap:6px;align-items:center">' + actions + '</div></div></div>';
    }).join("");
    body.innerHTML = '<div style="padding:16px"><div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px"><div><h3 style="margin:0">Roles &amp; Permissions</h3><div class="sub" style="max-width:60ch">Switch each app, and parts of an app, on or off for every role. Templates are shared defaults; Customize one to make an editable copy for ' + esc(S.org ? S.org.name : "your company") + '. Owner and Developer are locked so no one can weaken them.</div></div><button class="o-new" id="rl-new" style="margin-left:auto">+ New role</button></div>' +
      '<div class="rl-grid">' + cards + '</div></div>';
    document.getElementById("rl-new").onclick = function () { openRoleEditor(null); };
    body.querySelectorAll(".rl-edit").forEach(function (b) { b.onclick = function () { openRoleEditor(bySlug[b.dataset.slug]); }; });
    body.querySelectorAll(".rl-del").forEach(function (b) { b.onclick = async function () { var m = document.createElement("div"); m.className = "modal on"; m.innerHTML = '<div class="sheet"><h3>Delete role?</h3><div class="form"><div class="sub">People currently on this role fall back to the shared template with the same name, if any.</div></div><div class="foot"><button class="btn" id="rd-c">Cancel</button><button class="btn pri" id="rd-y" style="background:var(--bad);border-color:var(--bad)">Delete</button></div></div>'; document.body.appendChild(m); document.getElementById("rd-c").onclick = function () { m.remove(); }; document.getElementById("rd-y").onclick = async function () { var r = await sb.from("roles").delete().eq("id", b.dataset.id); m.remove(); if (r.error) { toast(errMsg(r.error)); } else { toast("Deleted"); renderRoles(); } }; }; });
  }
  function openRoleEditor(role) {
    var isNew = !role;
    var t = role || { label: "", description: "", rank: 10, can_see_money: true, can_manage_roles: false, full_access: false, permissions: {} };
    function eff(k) { var p = t.permissions || {}; var e = p[k] || p["*"] || { v: false, m: false }; return { v: !!e.v, m: !!e.m }; }
    function featOn(k, f) { var p = t.permissions || {}; var mp = p[k]; if (mp && mp.f && mp.f[f] === false) return false; return true; }
    var rowsHtml = MODULE_CATALOG.map(function (mm) {
      var e = eff(mm.key);
      var feats = mm.features.map(function (f) { return '<label class="rl-feat"><input type="checkbox" class="rl-fx" data-mod="' + mm.key + '" data-feat="' + f[0] + '"' + (featOn(mm.key, f[0]) ? " checked" : "") + '> ' + esc(f[1]) + '</label>'; }).join("");
      return '<tr data-mod="' + mm.key + '"><td>' + esc(mm.label) + '</td>' +
        '<td style="text-align:center"><input type="checkbox" class="rl-v" data-mod="' + mm.key + '"' + (e.v ? " checked" : "") + '></td>' +
        '<td style="text-align:center"><input type="checkbox" class="rl-m" data-mod="' + mm.key + '"' + (e.m ? " checked" : "") + '></td>' +
        '<td>' + (feats ? '<div class="rl-feats">' + feats + '</div>' : '<span class="muted" style="font-size:11px">whole module</span>') + '</td></tr>';
    }).join("");
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet wide"><h3>' + (isNew ? "New role" : (role.org_id ? "Edit role" : "Customize role") + ": " + esc(t.label || t.slug)) + '</h3><div class="form">' +
      '<div class="row2"><div><label>Role name</label><input id="rl-label" value="' + esc(t.label || "") + '" placeholder="e.g. Site Manager"></div><div><label>Rank (higher = more senior)</label><input id="rl-rank" type="number" value="' + (t.rank || 10) + '"></div></div>' +
      '<div><label>Description</label><input id="rl-desc" value="' + esc(t.description || "") + '" placeholder="What this role is for"></div>' +
      '<div class="row2"><div><label>Can see money</label><select id="rl-money"><option value="1"' + (t.can_see_money !== false ? " selected" : "") + '>Yes</option><option value="0"' + (t.can_see_money === false ? " selected" : "") + '>No - hide all amounts</option></select></div>' +
      '<div><label>Can manage roles</label><select id="rl-cmr"><option value="0"' + (!t.can_manage_roles ? " selected" : "") + '>No</option><option value="1"' + (t.can_manage_roles ? " selected" : "") + '>Yes</option></select></div></div>' +
      '<div class="rl-tablewrap"><table class="rl-table"><thead><tr><th>App / module</th><th>View</th><th>Manage</th><th>Parts of it</th></tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' +
      '<div class="sub"><b>View</b> lets them open the app. <b>Manage</b> lets them create and edit. <b>Parts</b> switch off pieces of an app while keeping the rest. Junior-style roles usually have View on and Manage off.</div>' +
      '</div><div class="foot"><button class="btn" id="rl-cancel">Cancel</button><button class="btn pri" id="rl-save" style="background:var(--accent);border-color:var(--accent)">Save role</button></div></div>';
    document.body.appendChild(m);
    m.querySelectorAll(".rl-m").forEach(function (x) { x.onchange = function () { if (x.checked) { var v = m.querySelector('.rl-v[data-mod="' + x.dataset.mod + '"]'); if (v) v.checked = true; } }; });
    document.getElementById("rl-cancel").onclick = function () { m.remove(); };
    document.getElementById("rl-save").onclick = async function () {
      var label = gv("rl-label"); if (!label) { toast("Name the role"); return; }
      var perms = {};
      MODULE_CATALOG.forEach(function (mm) {
        var v = m.querySelector('.rl-v[data-mod="' + mm.key + '"]').checked;
        var man = m.querySelector('.rl-m[data-mod="' + mm.key + '"]').checked;
        var entry = { v: v, m: man };
        if (mm.features.length) { var f = {}; mm.features.forEach(function (ff) { var cb = m.querySelector('.rl-fx[data-mod="' + mm.key + '"][data-feat="' + ff[0] + '"]'); f[ff[0]] = cb ? cb.checked : true; }); entry.f = f; }
        perms[mm.key] = entry;
      });
      var payload = { label: label, description: gv("rl-desc"), rank: parseInt(gv("rl-rank"), 10) || 10, can_see_money: document.getElementById("rl-money").value === "1", can_manage_roles: document.getElementById("rl-cmr").value === "1", permissions: perms, org_id: S.company.org_id, is_system: false, protected: false, full_access: false };
      var res;
      if (role && role.org_id) { res = await sb.from("roles").update(payload).eq("id", role.id); }
      else if (role && !role.org_id) { payload.slug = role.slug; res = await sb.from("roles").insert(payload); }
      else { payload.slug = slugify(label); res = await sb.from("roles").insert(payload); }
      if (res.error) { toast(/duplicate|unique/i.test(res.error.message) ? "A role with that name already exists. Pick another name." : res.error.message); return; }
      m.remove(); toast("Role saved"); renderRoles();
    };
  }

  function openLockDateModal() {
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Period lock &middot; ' + esc(S.company.name) + '</h3><div class="form">' +
      '<div><label>Lock entries dated on or before</label>' + fhint("__lk", "New invoices dated on or before this date are blocked, so a closed period can\'t be changed. Leave blank to unlock.") + '<input id="lk-date" type="date" value="' + (S.company.lock_date || "") + '"></div>' +
      '</div><div class="foot"><button class="btn" id="lk-cancel">Cancel</button><button class="btn pri" id="lk-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("lk-cancel").onclick = function () { m.remove(); };
    document.getElementById("lk-save").onclick = async function () {
      var d = document.getElementById("lk-date").value || null;
      var r = await sb.from("companies").update({ lock_date: d }).eq("id", S.company.id);
      if (r.error) { toast(errMsg(r.error)); return; }
      S.company.lock_date = d; m.remove(); toast(d ? ("Locked on/before " + d) : "Unlocked");
    };
  }

  // ============================ EMPLOYEES: SKILLS / CERTIFICATIONS / ONBOARDING / APPRAISALS ============================
  function empOptions(emps, sel) { return emps.map(function (e) { return '<option value="' + e.id + '"' + (e.id === sel ? " selected" : "") + '>' + esc(e.name) + '</option>'; }).join(""); }
  function cfgSkills() {
    return {
      title: "Skills", pageSize: 80,
      fetch: function () { return sb.from("skills").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.name || "") + " " + (s.category || ""); },
      columns: [{ label: "Skill", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } }, { label: "Category", get: function (s) { return esc(s.category || ""); } }],
      groupBy: [{ label: "Category", get: function (s) { return s.category || "None"; } }],
      onOpen: function (s) { openSkillModal(s); }, onNew: function () { openSkillModal(null); }
    };
  }
  function openSkillModal(s) {
    s = s || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (s.id ? "Edit" : "New") + ' skill</h3><div class="form">' +
      '<div><label>Skill name</label><input id="sk-name" value="' + esc(s.name || "") + '"></div>' +
      '<div><label>Category</label><input id="sk-cat" value="' + esc(s.category || "") + '" placeholder="e.g. Technical, Trade, Safety"></div>' +
      '</div><div class="foot"><button class="btn" id="sk-cancel">Cancel</button>' + (s.id ? '<button class="btn" id="sk-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="sk-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("sk-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("sk-del"); if (del) del.onclick = async function () { await sb.from("skills").delete().eq("id", s.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("sk-save").onclick = async function () {
      var row = { name: gv("sk-name") || "Skill", category: gv("sk-cat") };
      var r; if (s.id) r = await sb.from("skills").update(row).eq("id", s.id); else { row.company_id = S.company.id; r = await sb.from("skills").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgEmployeeSkills() {
    return {
      title: "Employee Skills", pageSize: 100,
      fetch: function () { return sb.from("employee_skills").select("*, hr_employees(name), skills(name,category)").eq("company_id", S.company.id).order("id", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (e) { return (e.hr_employees ? e.hr_employees.name : "") + " " + (e.skills ? e.skills.name : ""); },
      columns: [
        { label: "Employee", get: function (e) { return '<b>' + esc(e.hr_employees ? e.hr_employees.name : "") + '</b>'; } },
        { label: "Skill", get: function (e) { return esc(e.skills ? e.skills.name : ""); } },
        { label: "Level", get: function (e) { return '<span class="badge partial">' + esc(e.level || "") + '</span>'; } }
      ],
      groupBy: [{ label: "Employee", get: function (e) { return e.hr_employees ? e.hr_employees.name : "None"; } }, { label: "Skill", get: function (e) { return e.skills ? e.skills.name : "None"; } }],
      onOpen: function (e) { openEmployeeSkillModal(e); }, onNew: function () { openEmployeeSkillModal(null); }
    };
  }
  async function openEmployeeSkillModal(es) {
    es = es || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var skills = (await sb.from("skills").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (es.id ? "Edit" : "Add") + ' employee skill</h3><div class="form">' +
      '<div><label>Employee</label><select id="es-emp">' + empOptions(emps, es.employee_id) + '</select></div>' +
      '<div><label>Skill</label><select id="es-skill">' + skills.map(function (x) { return '<option value="' + x.id + '"' + (es.skill_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div><label>Level</label><select id="es-level"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="es-cancel">Cancel</button>' + (es.id ? '<button class="btn" id="es-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="es-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("es-level").value = es.level || "intermediate";
    document.getElementById("es-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("es-del"); if (del) del.onclick = async function () { await sb.from("employee_skills").delete().eq("id", es.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("es-save").onclick = async function () {
      if (!skills.length) { toast("Add skills first (Talent > Skills)"); return; }
      var row = { employee_id: document.getElementById("es-emp").value, skill_id: document.getElementById("es-skill").value, level: document.getElementById("es-level").value };
      var r; if (es.id) r = await sb.from("employee_skills").update(row).eq("id", es.id); else { row.company_id = S.company.id; r = await sb.from("employee_skills").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgCertifications() {
    return {
      title: "Certifications", pageSize: 100,
      fetch: function () { return sb.from("certifications").select("*, hr_employees(name)").eq("company_id", S.company.id).order("expiry_date").then(function (r) { return r.data || []; }); },
      searchText: function (c) { return (c.name || "") + " " + (c.authority || "") + " " + (c.hr_employees ? c.hr_employees.name : ""); },
      columns: [
        { label: "Employee", get: function (c) { return '<b>' + esc(c.hr_employees ? c.hr_employees.name : "") + '</b>'; } },
        { label: "Certificate", get: function (c) { return esc(c.name); } },
        { label: "Authority", get: function (c) { return esc(c.authority || ""); } },
        { label: "Expiry", get: function (c) { var ex = c.expiry_date; var soon = ex && parseD(ex) && (parseD(ex) - new Date()) / 864e5 < 60; return ex ? '<span class="muted">' + esc(ex) + '</span>' + (isOverdue(ex) ? ' <span class="ob-flag">expired</span>' : (soon ? ' <span class="ob-flag" style="background:var(--warn)">soon</span>' : '')) : '<span class="muted">-</span>'; } }
      ],
      filters: [{ label: "Expiring/expired", test: function (c) { return c.expiry_date && (isOverdue(c.expiry_date) || (parseD(c.expiry_date) - new Date()) / 864e5 < 60); } }],
      groupBy: [{ label: "Employee", get: function (c) { return c.hr_employees ? c.hr_employees.name : "None"; } }],
      onOpen: function (c) { openCertificationModal(c); }, onNew: function () { openCertificationModal(null); }
    };
  }
  async function openCertificationModal(c) {
    c = c || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (c.id ? "Edit" : "New") + ' certification</h3><div class="form">' +
      '<div><label>Employee</label><select id="ce-emp">' + empOptions(emps, c.employee_id) + '</select></div>' +
      '<div class="row2"><div><label>Certificate</label><input id="ce-name" value="' + esc(c.name || "") + '"></div><div><label>Authority</label><input id="ce-auth" value="' + esc(c.authority || "") + '"></div></div>' +
      '<div class="row2"><div><label>Issued</label><input id="ce-iss" type="date" value="' + (c.issued_date || "") + '"></div><div><label>Expiry</label><input id="ce-exp" type="date" value="' + (c.expiry_date || "") + '"></div></div>' +
      '</div><div class="foot"><button class="btn" id="ce-cancel">Cancel</button>' + (c.id ? '<button class="btn" id="ce-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="ce-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ce-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("ce-del"); if (del) del.onclick = async function () { await sb.from("certifications").delete().eq("id", c.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("ce-save").onclick = async function () {
      var row = { employee_id: document.getElementById("ce-emp").value, name: gv("ce-name") || "Certificate", authority: gv("ce-auth"), issued_date: gv("ce-iss") || null, expiry_date: gv("ce-exp") || null };
      var r; if (c.id) r = await sb.from("certifications").update(row).eq("id", c.id); else { row.company_id = S.company.id; r = await sb.from("certifications").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgOnboarding() {
    return {
      title: "Onboarding", pageSize: 120,
      fetch: function () { return sb.from("hr_onboarding").select("*, hr_employees(name)").eq("company_id", S.company.id).order("sequence").then(function (r) { return r.data || []; }); },
      searchText: function (o) { return (o.task || "") + " " + (o.hr_employees ? o.hr_employees.name : ""); },
      columns: [
        { label: "Employee", get: function (o) { return '<b>' + esc(o.hr_employees ? o.hr_employees.name : "") + '</b>'; } },
        { label: "Kind", get: function (o) { return o.kind === "offboarding" ? '<span class="badge draft">Offboarding</span>' : '<span class="badge partial">Onboarding</span>'; } },
        { label: "Task", get: function (o) { return esc(o.task); } },
        { label: "Due", get: function (o) { return '<span class="muted">' + esc(o.due_date || "") + '</span>'; } },
        { label: "Done", get: function (o) { return o.done ? '<span class="badge paid">Done</span>' : (isOverdue(o.due_date) ? '<span class="ob-flag">overdue</span>' : '<span class="muted">open</span>'); } }
      ],
      filters: [{ label: "Open", test: function (o) { return !o.done; } }, { label: "Onboarding", test: function (o) { return o.kind === "onboarding"; } }, { label: "Offboarding", test: function (o) { return o.kind === "offboarding"; } }],
      groupBy: [{ label: "Employee", get: function (o) { return o.hr_employees ? o.hr_employees.name : "None"; } }, { label: "Kind", get: function (o) { return o.kind; } }],
      onOpen: function (o) { openOnboardingModal(o); }, onNew: function () { openOnboardingModal(null); }
    };
  }
  async function openOnboardingModal(o) {
    o = o || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (o.id ? "Edit" : "New") + ' checklist item</h3><div class="form">' +
      '<div><label>Employee</label><select id="ob-emp">' + empOptions(emps, o.employee_id) + '</select></div>' +
      '<div class="row2"><div><label>Kind</label><select id="ob-kind"><option value="onboarding">Onboarding</option><option value="offboarding">Offboarding</option></select></div><div><label>Due date</label><input id="ob-due" type="date" value="' + (o.due_date || "") + '"></div></div>' +
      '<div><label>Task</label><input id="ob-task" value="' + esc(o.task || "") + '" placeholder="e.g. Issue PPE, Sign contract, Return laptop"></div>' +
      '<div><label>Status</label><select id="ob-done"><option value="0">Open</option><option value="1">Done</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="ob-cancel">Cancel</button>' + (o.id ? '<button class="btn" id="ob-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="ob-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ob-kind").value = o.kind || "onboarding";
    document.getElementById("ob-done").value = o.done ? "1" : "0";
    document.getElementById("ob-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("ob-del"); if (del) del.onclick = async function () { await sb.from("hr_onboarding").delete().eq("id", o.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("ob-save").onclick = async function () {
      var row = { employee_id: document.getElementById("ob-emp").value, kind: document.getElementById("ob-kind").value, task: gv("ob-task") || "Task", due_date: gv("ob-due") || null, done: document.getElementById("ob-done").value === "1" };
      var r; if (o.id) r = await sb.from("hr_onboarding").update(row).eq("id", o.id); else { row.company_id = S.company.id; r = await sb.from("hr_onboarding").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgAppraisals() {
    return {
      title: "Appraisals", pageSize: 80,
      fetch: function () { return sb.from("appraisals").select("*, hr_employees(name)").eq("company_id", S.company.id).order("appraisal_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (a) { return (a.period || "") + " " + (a.hr_employees ? a.hr_employees.name : ""); },
      columns: [
        { label: "Employee", get: function (a) { return '<b>' + esc(a.hr_employees ? a.hr_employees.name : "") + '</b>'; } },
        { label: "Date", get: function (a) { return '<span class="muted">' + esc(a.appraisal_date || "") + '</span>'; } },
        { label: "Period", get: function (a) { return esc(a.period || ""); } },
        { label: "Rating", get: function (a) { var n = Number(a.rating || 0); return n ? "★".repeat(Math.min(5, n)) + '<span class="muted">' + "☆".repeat(Math.max(0, 5 - n)) + '</span>' : '<span class="muted">-</span>'; } },
        { label: "Status", get: function (a) { return a.state === "done" ? '<span class="badge paid">Done</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Draft", test: function (a) { return a.state !== "done"; } }, { label: "Done", test: function (a) { return a.state === "done"; } }],
      groupBy: [{ label: "Employee", get: function (a) { return a.hr_employees ? a.hr_employees.name : "None"; } }],
      onOpen: function (a) { renderAppraisalForm(a.id); }, onNew: function () { renderAppraisalForm("new"); }
    };
  }
  async function renderAppraisalForm(id) {
    var parent = { action: "hr.appraisals", title: "Appraisals" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var a = id === "new" ? { state: "draft", appraisal_date: today(), rating: 3 } : (await sb.from("appraisals").select("*, hr_employees(name)").eq("id", id).maybeSingle()).data || {};
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : ((a.hr_employees ? a.hr_employees.name : "") + " " + (a.period || ""));
    var done = a.state === "done", dis = done ? " disabled" : "";
    var btns = done ? '<button id="ap-reopen">Reopen</button>' : '<button class="pri" id="ap-save">Save</button><button id="ap-discard">Discard</button>' + (id !== "new" ? '<button id="ap-done">Mark done</button>' : '');
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div><div class="o-stages"><span class="st ' + (done ? "done" : "on") + '">Draft</span><span class="st ' + (done ? "on" : "") + '">Done</span></div></div>' +
      '<div class="o-sheet"><div class="o-groups"><div>' +
      fld("Employee", done ? '<span class="v">' + esc(a.hr_employees ? a.hr_employees.name : "") + '</span>' : '<select id="ap-emp">' + empOptions(emps, a.employee_id) + '</select>') +
      fld("Date", '<input id="ap-date" type="date" value="' + (a.appraisal_date || today()) + '"' + dis + '>') +
      fld("Period", '<input id="ap-period" value="' + esc(a.period || "") + '"' + dis + ' placeholder="e.g. 2026 H1">') +
      fld("Rating (1-5)", '<input id="ap-rating" type="number" min="1" max="5" value="' + (a.rating || 3) + '"' + dis + '>') +
      '</div><div>' +
      fld("Manager", '<input id="ap-mgr" value="' + esc(a.manager || "") + '"' + dis + '>') +
      '</div></div>' +
      fld("Strengths", '<textarea id="ap-str" rows="3"' + dis + '>' + esc(a.strengths || "") + '</textarea>') +
      fld("Areas to improve", '<textarea id="ap-imp" rows="3"' + dis + '>' + esc(a.improvements || "") + '</textarea>') +
      '</div>';
    var db = document.getElementById("ap-discard"); if (db) db.onclick = function () { go("hr.appraisals"); };
    async function persist(extra) {
      var row = Object.assign({ employee_id: (document.getElementById("ap-emp") || {}).value || a.employee_id, appraisal_date: gv("ap-date") || null, period: gv("ap-period"), rating: parseInt(gv("ap-rating"), 10) || 0, manager: gv("ap-mgr"), strengths: (document.getElementById("ap-str") || {}).value || "", improvements: (document.getElementById("ap-imp") || {}).value || "" }, extra || {});
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("appraisals").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("appraisals").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    var sv = document.getElementById("ap-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderAppraisalForm(sid); } };
    var dn = document.getElementById("ap-done"); if (dn) dn.onclick = async function () { var sid = await persist({ state: "done" }); if (sid) { toast("Marked done"); renderAppraisalForm(sid); } };
    var ro = document.getElementById("ap-reopen"); if (ro) ro.onclick = async function () { await sb.from("appraisals").update({ state: "draft" }).eq("id", id); toast("Reopened"); renderAppraisalForm(id); };
  }

  // ============================ INVENTORY CONFIG (delivery / packages / storage / putaway) ============================
  async function openScrapFlow() {
    var prods = (await sb.from("products").select("id,name,default_code,type,cost_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    openStockModal("scrap", prods);
  }
  function cfgDeliveryMethods() {
    return {
      title: "Delivery Methods", pageSize: 60,
      fetch: function () { return sb.from("delivery_methods").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (d) { return (d.name || "") + " " + (d.carrier || ""); },
      columns: [{ label: "Name", get: function (d) { return '<b>' + esc(d.name) + '</b>'; } }, { label: "Carrier", get: function (d) { return esc(d.carrier || ""); } }, { label: "Price", num: true, get: function (d) { return money(d.price); } }, { label: "Active", get: function (d) { return d.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge draft">Off</span>'; } }],
      onOpen: function (d) { openDeliveryMethodModal(d); }, onNew: function () { openDeliveryMethodModal(null); }
    };
  }
  function openDeliveryMethodModal(d) {
    d = d || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (d.id ? "Edit" : "New") + ' delivery method</h3><div class="form">' +
      '<div><label>Name</label><input id="dm-name" value="' + esc(d.name || "") + '"></div>' +
      '<div class="row2"><div><label>Carrier</label><input id="dm-carrier" value="' + esc(d.carrier || "") + '"></div><div><label>Price</label><input id="dm-price" type="number" step="0.01" value="' + (d.price || 0) + '"></div></div>' +
      '<div><label>Notes</label><input id="dm-notes" value="' + esc(d.notes || "") + '"></div>' +
      '<div><label>Status</label><select id="dm-active"><option value="1"' + (d.is_active !== false ? " selected" : "") + '>Active</option><option value="0"' + (d.is_active === false ? " selected" : "") + '>Off</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="dm-cancel">Cancel</button>' + (d.id ? '<button class="btn" id="dm-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="dm-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("dm-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("dm-del"); if (del) del.onclick = async function () { await sb.from("delivery_methods").delete().eq("id", d.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("dm-save").onclick = async function () {
      var row = { name: gv("dm-name") || "Delivery", carrier: gv("dm-carrier"), price: parseFloat(gv("dm-price")) || 0, notes: gv("dm-notes"), is_active: document.getElementById("dm-active").value === "1" };
      var r; if (d.id) r = await sb.from("delivery_methods").update(row).eq("id", d.id); else { row.company_id = S.company.id; r = await sb.from("delivery_methods").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgPackageTypes() {
    return {
      title: "Package Types", pageSize: 60,
      fetch: function () { return sb.from("package_types").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (p) { return p.name || ""; },
      columns: [{ label: "Name", get: function (p) { return '<b>' + esc(p.name) + '</b>'; } }, { label: "L x W x H", get: function (p) { return Number(p.length || 0) + " x " + Number(p.width || 0) + " x " + Number(p.height || 0); } }, { label: "Max weight", num: true, get: function (p) { return money(p.max_weight); } }],
      onOpen: function (p) { openPackageTypeModal(p); }, onNew: function () { openPackageTypeModal(null); }
    };
  }
  function openPackageTypeModal(p) {
    p = p || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (p.id ? "Edit" : "New") + ' package type</h3><div class="form">' +
      '<div><label>Name</label><input id="pk-name" value="' + esc(p.name || "") + '"></div>' +
      '<div class="row2"><div><label>Length</label><input id="pk-l" type="number" step="0.01" value="' + (p.length || 0) + '"></div><div><label>Width</label><input id="pk-w" type="number" step="0.01" value="' + (p.width || 0) + '"></div></div>' +
      '<div class="row2"><div><label>Height</label><input id="pk-h" type="number" step="0.01" value="' + (p.height || 0) + '"></div><div><label>Max weight</label><input id="pk-mw" type="number" step="0.01" value="' + (p.max_weight || 0) + '"></div></div>' +
      '</div><div class="foot"><button class="btn" id="pk-cancel">Cancel</button>' + (p.id ? '<button class="btn" id="pk-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="pk-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("pk-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("pk-del"); if (del) del.onclick = async function () { await sb.from("package_types").delete().eq("id", p.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("pk-save").onclick = async function () {
      var row = { name: gv("pk-name") || "Package", length: parseFloat(gv("pk-l")) || 0, width: parseFloat(gv("pk-w")) || 0, height: parseFloat(gv("pk-h")) || 0, max_weight: parseFloat(gv("pk-mw")) || 0 };
      var r; if (p.id) r = await sb.from("package_types").update(row).eq("id", p.id); else { row.company_id = S.company.id; r = await sb.from("package_types").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgStorageCategories() {
    return {
      title: "Storage Categories", pageSize: 60,
      fetch: function () { return sb.from("storage_categories").select("*").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (s) { return s.name || ""; },
      columns: [{ label: "Name", get: function (s) { return '<b>' + esc(s.name) + '</b>'; } }, { label: "Max weight", num: true, get: function (s) { return money(s.max_weight); } }, { label: "Capacity", num: true, get: function (s) { return money(s.capacity); } }],
      onOpen: function (s) { openStorageCategoryModal(s); }, onNew: function () { openStorageCategoryModal(null); }
    };
  }
  function openStorageCategoryModal(s) {
    s = s || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (s.id ? "Edit" : "New") + ' storage category</h3><div class="form">' +
      '<div><label>Name</label><input id="sc2-name" value="' + esc(s.name || "") + '"></div>' +
      '<div class="row2"><div><label>Max weight</label><input id="sc2-mw" type="number" step="0.01" value="' + (s.max_weight || 0) + '"></div><div><label>Capacity</label><input id="sc2-cap" type="number" step="0.01" value="' + (s.capacity || 0) + '"></div></div>' +
      '<div><label>Notes</label><input id="sc2-notes" value="' + esc(s.notes || "") + '"></div>' +
      '</div><div class="foot"><button class="btn" id="sc2-cancel">Cancel</button>' + (s.id ? '<button class="btn" id="sc2-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="sc2-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("sc2-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("sc2-del"); if (del) del.onclick = async function () { await sb.from("storage_categories").delete().eq("id", s.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("sc2-save").onclick = async function () {
      var row = { name: gv("sc2-name") || "Category", max_weight: parseFloat(gv("sc2-mw")) || 0, capacity: parseFloat(gv("sc2-cap")) || 0, notes: gv("sc2-notes") };
      var r; if (s.id) r = await sb.from("storage_categories").update(row).eq("id", s.id); else { row.company_id = S.company.id; r = await sb.from("storage_categories").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgPutawayRules() {
    return {
      title: "Putaway Rules", pageSize: 60,
      fetch: function () { return sb.from("putaway_rules").select("*, products(name), product_categories(name), stock_locations(name)").eq("company_id", S.company.id).order("sequence").then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.products ? p.products.name : "") + " " + (p.product_categories ? p.product_categories.name : ""); },
      columns: [
        { label: "When", get: function (p) { return p.products ? esc(p.products.name) : (p.product_categories ? 'Category: ' + esc(p.product_categories.name) : '(any)'); } },
        { label: "Store at", get: function (p) { return esc(p.stock_locations ? p.stock_locations.name : ""); } }
      ],
      onOpen: function (p) { openPutawayRuleModal(p); }, onNew: function () { openPutawayRuleModal(null); }
    };
  }
  async function openPutawayRuleModal(p) {
    p = p || {};
    var products = (await sb.from("products").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var cats = (await sb.from("product_categories").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var locs = (await sb.from("stock_locations").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (p.id ? "Edit" : "New") + ' putaway rule</h3><div class="form">' +
      '<div><label>Product</label>' + fhint("__pw1", "Apply to this product (or leave blank and pick a category).") + '<select id="pw-prod"><option value="">(any)</option>' + products.map(function (x) { return '<option value="' + x.id + '"' + (p.product_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div><label>Or product category</label><select id="pw-cat"><option value="">(any)</option>' + cats.map(function (x) { return '<option value="' + x.id + '"' + (p.category_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '<div><label>Store at location</label><select id="pw-loc"><option value="">(pick)</option>' + locs.map(function (x) { return '<option value="' + x.id + '"' + (p.location_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '</div><div class="foot"><button class="btn" id="pw-cancel">Cancel</button>' + (p.id ? '<button class="btn" id="pw-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="pw-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("pw-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("pw-del"); if (del) del.onclick = async function () { await sb.from("putaway_rules").delete().eq("id", p.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("pw-save").onclick = async function () {
      var row = { product_id: document.getElementById("pw-prod").value || null, category_id: document.getElementById("pw-cat").value || null, location_id: document.getElementById("pw-loc").value || null };
      if (!row.location_id) { toast("Pick a location"); return; }
      var r; if (p.id) r = await sb.from("putaway_rules").update(row).eq("id", p.id); else { row.company_id = S.company.id; r = await sb.from("putaway_rules").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }

  // ============================ CALENDAR & ACTIVITIES ============================
  var CAT_COLOR = { meeting: "#2f6bff", site_visit: "#0d9488", milestone: "#7c3aed", reminder: "#c58217", deadline: "#c58217", other: "#55565c", submittal: "#0369a1", rfi: "#ea580c", cert: "#f4573d", invoice: "#0ea66f", planning: "#4f46e5", install: "#ea580c" };
  async function collectCalendarItems(fromStr, toStr) {
    var cid = S.company.id, out = [];
    function push(date, title, cat, action) { if (!date) return; var d = String(date).slice(0, 10); if (d < fromStr || d > toStr) return; out.push({ date: d, title: title, cat: cat, action: action }); }
    var ev = (await sb.from("calendar_events").select("*").eq("company_id", cid).gte("event_date", fromStr).lte("event_date", toStr)).data || [];
    ev.forEach(function (e) { out.push({ date: e.event_date, title: e.title, cat: e.category || "other", event: e }); });
    var subs = (await sb.from("submittals").select("number,title,due_date,status").eq("company_id", cid).not("due_date", "is", null).gte("due_date", fromStr).lte("due_date", toStr)).data || [];
    subs.forEach(function (s) { if (["approved", "approved_comments", "superseded"].indexOf(s.status) < 0) push(s.due_date, "Submittal due: " + (s.title || s.number), "submittal", "doc.subs"); });
    var rfis = (await sb.from("rfis").select("number,subject,needed_by,status").eq("company_id", cid).not("needed_by", "is", null).gte("needed_by", fromStr).lte("needed_by", toStr)).data || [];
    rfis.forEach(function (r) { if (r.status === "open") push(r.needed_by, "RFI due: " + (r.subject || r.number), "rfi", "doc.rfis"); });
    var certs = (await sb.from("certifications").select("name,expiry_date, hr_employees(name)").eq("company_id", cid).not("expiry_date", "is", null).gte("expiry_date", fromStr).lte("expiry_date", toStr)).data || [];
    certs.forEach(function (c) { push(c.expiry_date, "Cert expires: " + (c.name || "") + (c.hr_employees ? " (" + c.hr_employees.name + ")" : ""), "cert", "hr.certs"); });
    var invs = (await sb.from("invoices").select("number,due_date,move_type,state,amount_residual").eq("company_id", cid).eq("state", "posted").eq("move_type", "out_invoice").gt("amount_residual", 0.005).not("due_date", "is", null).gte("due_date", fromStr).lte("due_date", toStr)).data || [];
    invs.forEach(function (i) { push(i.due_date, "Invoice due: " + i.number, "invoice", "rep.collections"); });
    var shifts = (await sb.from("planning_shifts").select("shift_date,role, hr_employees(name)").eq("company_id", cid).gte("shift_date", fromStr).lte("shift_date", toStr)).data || [];
    shifts.forEach(function (s) { push(s.shift_date, "Shift: " + (s.hr_employees ? s.hr_employees.name : "Open") + (s.role ? " (" + s.role + ")" : ""), "planning", "hr.planning"); });
    var jobs = (await sb.from("install_jobs").select("number,description,due_date,status").eq("company_id", cid).not("due_date", "is", null).gte("due_date", fromStr).lte("due_date", toStr)).data || [];
    jobs.forEach(function (j) { if (j.status !== "done") push(j.due_date, "Install due: " + (j.description || j.number), "install", "inst.jobs"); });
    return out;
  }
  var CALV = null;
  async function renderCalendar(y, mo) {
    var now = new Date();
    if (y == null) { y = CALV ? CALV.y : now.getFullYear(); mo = CALV ? CALV.m : now.getMonth(); }
    CALV = { y: y, m: mo };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Calendar") + '<div class="gap"></div><button class="o-filtbtn" id="cal-prev">&#8249;</button><button class="o-filtbtn" id="cal-today">Today</button><button class="o-filtbtn" id="cal-next">&#8250;</button><button class="o-filtbtn" id="cal-agenda">Agenda</button></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    document.getElementById("cal-prev").onclick = function () { var nm = mo - 1, ny = y; if (nm < 0) { nm = 11; ny--; } renderCalendar(ny, nm); };
    document.getElementById("cal-next").onclick = function () { var nm = mo + 1, ny = y; if (nm > 11) { nm = 0; ny++; } renderCalendar(ny, nm); };
    document.getElementById("cal-today").onclick = function () { renderCalendar(now.getFullYear(), now.getMonth()); };
    document.getElementById("cal-agenda").onclick = function () { renderAgenda(); };
    var first = new Date(y, mo, 1), startDow = (first.getDay() + 6) % 7; // Monday=0
    var gridStart = new Date(y, mo, 1 - startDow);
    var last = new Date(y, mo + 1, 0);
    var items = await collectCalendarItems(fmtD(gridStart), fmtD(new Date(y, mo + 1, 6 - ((last.getDay() + 6) % 7) + 1)));
    var byDay = {}; items.forEach(function (it) { (byDay[it.date] = byDay[it.date] || []).push(it); });
    var todayStr = fmtD(now), monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][mo];
    var head = '<tr>' + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) { return '<th>' + d + '</th>'; }).join("") + '</tr>';
    var cells = "";
    for (var w = 0; w < 6; w++) {
      cells += '<tr>';
      for (var dd = 0; dd < 7; dd++) {
        var cur = new Date(gridStart); cur.setDate(gridStart.getDate() + w * 7 + dd);
        var ds = fmtD(cur), inMonth = cur.getMonth() === mo, dayItems = byDay[ds] || [];
        var chips = dayItems.slice(0, 4).map(function (it) { var col = CAT_COLOR[it.cat] || "#55565c"; return '<div class="cal-chip" data-date="' + ds + '"' + (it.event ? ' data-ev="' + it.event.id + '"' : (it.action ? ' data-go="' + it.action + '"' : '')) + ' style="background:' + col + '22;color:' + col + ';border-left:3px solid ' + col + '" title="' + esc(it.title) + '">' + esc(it.title) + '</div>'; }).join("");
        if (dayItems.length > 4) chips += '<div class="cal-more">+' + (dayItems.length - 4) + ' more</div>';
        cells += '<td class="cal-cell' + (inMonth ? "" : " off") + (ds === todayStr ? " today" : "") + '" data-date="' + ds + '"><div class="cal-dnum">' + cur.getDate() + '</div>' + chips + '</td>';
      }
      cells += '</tr>';
    }
    document.getElementById("o-body").innerHTML = '<div style="padding:14px 16px"><h2 style="margin:0 0 10px;font-size:18px">' + monthName + ' ' + y + '</h2><div class="o-rt-wrap"><table class="cal-grid"><thead>' + head + '</thead><tbody>' + cells + '</tbody></table></div><div class="sub" style="margin-top:8px">Click a day to add an event. Coloured items are pulled automatically from submittals, RFIs, certifications, invoices due, planning and installation.</div></div>';
    document.querySelectorAll(".cal-chip").forEach(function (c) { c.onclick = function (e) { e.stopPropagation(); if (c.dataset.ev) { openEventModal(null, c.dataset.ev); } else if (c.dataset.go) { go(c.dataset.go); } }; });
    document.querySelectorAll(".cal-cell").forEach(function (c) { c.onclick = function () { openEventModal(c.dataset.date); }; });
  }
  async function renderAgenda() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Agenda") + '<div class="gap"></div><button class="o-filtbtn" id="ag-cal">Month view</button></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    document.getElementById("ag-cal").onclick = function () { renderCalendar(); };
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var from = fmtD(now), to = fmtD(new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()));
    var items = (await collectCalendarItems(from, to)).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var byDay = {}; items.forEach(function (it) { (byDay[it.date] = byDay[it.date] || []).push(it); });
    var days = Object.keys(byDay).sort();
    var html = days.map(function (d) {
      var rows = byDay[d].map(function (it) { var col = CAT_COLOR[it.cat] || "#55565c"; return '<div class="ag-item" ' + (it.event ? 'data-ev="' + it.event.id + '"' : (it.action ? 'data-go="' + it.action + '"' : '')) + ' style="cursor:pointer"><span class="ag-dot" style="background:' + col + '"></span>' + esc(it.title) + '<span class="ag-cat">' + esc(it.cat.replace("_", " ")) + '</span></div>'; }).join("");
      var dt = parseD(d), lbl = dt.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
      return '<div class="ag-day"><div class="ag-date">' + lbl + (d === fmtD(now) ? ' &middot; today' : '') + '</div>' + rows + '</div>';
    }).join("");
    document.getElementById("o-body").innerHTML = '<div style="padding:14px 16px;max-width:760px"><h2 style="margin:0 0 10px;font-size:18px">Next 3 months</h2>' + (html || '<div class="o-empty">Nothing scheduled. Add events in the Calendar.</div>') + '</div>';
    document.querySelectorAll(".ag-item").forEach(function (c) { c.onclick = function () { if (c.dataset.ev) openEventModal(null, c.dataset.ev); else if (c.dataset.go) go(c.dataset.go); }; });
  }
  async function openEventModal(dateStr, eventId) {
    var e = eventId ? (await sb.from("calendar_events").select("*").eq("id", eventId).maybeSingle()).data || {} : { event_date: dateStr || today(), category: "meeting", all_day: true };
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (eventId ? "Edit" : "New") + ' event</h3><div class="form">' +
      '<div><label>Title</label><input id="ev-title" value="' + esc(e.title || "") + '"></div>' +
      '<div class="row2"><div><label>Date</label><input id="ev-date" type="date" value="' + (e.event_date || today()) + '"></div><div><label>Type</label><select id="ev-cat"><option value="meeting">Meeting</option><option value="site_visit">Site visit</option><option value="milestone">Milestone</option><option value="reminder">Reminder</option><option value="deadline">Deadline</option><option value="other">Other</option></select></div></div>' +
      '<div class="row2"><div><label>Start time</label><input id="ev-start" value="' + esc(e.start_time || "") + '" placeholder="e.g. 09:00"></div><div><label>End time</label><input id="ev-end" value="' + esc(e.end_time || "") + '" placeholder="e.g. 10:00"></div></div>' +
      '<div class="row2"><div><label>Project</label><select id="ev-proj"><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (e.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div><div><label>Location</label><input id="ev-loc" value="' + esc(e.location || "") + '"></div></div>' +
      '<div><label>Notes</label><input id="ev-notes" value="' + esc(e.notes || "") + '"></div>' +
      '</div><div class="foot"><button class="btn" id="ev-cancel">Cancel</button>' + (eventId ? '<button class="btn" id="ev-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="ev-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("ev-cat").value = e.category || "meeting";
    document.getElementById("ev-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("ev-del"); if (del) del.onclick = async function () { await sb.from("calendar_events").delete().eq("id", eventId); m.remove(); toast("Deleted"); renderCalendar(); };
    document.getElementById("ev-save").onclick = async function () {
      var row = { title: gv("ev-title") || "Event", event_date: gv("ev-date") || today(), category: document.getElementById("ev-cat").value, start_time: gv("ev-start"), end_time: gv("ev-end"), project_id: document.getElementById("ev-proj").value || null, location: gv("ev-loc"), notes: gv("ev-notes") };
      var r; if (eventId) r = await sb.from("calendar_events").update(row).eq("id", eventId); else { row.company_id = S.company.id; r = await sb.from("calendar_events").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderCalendar();
    };
  }

  // ============================ SIGN / APPROVALS ============================
  var SIGN_TYPES = [["ipc", "Payment certificate (IPC)"], ["subcontract", "Subcontract"], ["purchase_order", "Purchase order"], ["contract", "Contract"], ["document", "Document"], ["other", "Other"]];
  function signTypeLabel(t) { var m = SIGN_TYPES.filter(function (x) { return x[0] === t; })[0]; return m ? m[1] : t; }
  function cfgSignRequests() {
    return {
      title: "Signature Requests", pageSize: 80,
      fetch: function () { return sb.from("sign_requests").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.number || "") + " " + (s.title || "") + " " + (s.ref || ""); },
      columns: [
        { label: "Number", get: function (s) { return '<b>' + esc(s.number || "/") + '</b>'; } },
        { label: "Title", get: function (s) { return esc(s.title); } },
        { label: "Type", get: function (s) { return signTypeLabel(s.doc_type); } },
        { label: "Project", get: function (s) { return esc(s.projects ? s.projects.name : ""); } },
        { label: "Status", get: function (s) { return s.status === "signed" ? '<span class="badge paid">Signed</span>' : s.status === "pending" ? '<span class="badge partial">Awaiting</span>' : s.status === "declined" ? '<span class="badge unpaid">Declined</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Awaiting", test: function (s) { return s.status === "pending"; } }, { label: "Signed", test: function (s) { return s.status === "signed"; } }, { label: "Draft", test: function (s) { return s.status === "draft"; } }],
      groupBy: [{ label: "Type", get: function (s) { return signTypeLabel(s.doc_type); } }, { label: "Status", get: function (s) { return s.status; } }],
      onOpen: function (s) { renderSignForm(s.id); }, onNew: function () { renderSignForm("new"); }
    };
  }
  async function renderSignForm(id) {
    var parent = { action: "sign.list", title: "Signature Requests" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var s = id === "new" ? { status: "draft", doc_type: "document" } : (await sb.from("sign_requests").select("*").eq("id", id).maybeSingle()).data || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var sigs = id === "new" ? [] : (await sb.from("sign_signatures").select("*").eq("request_id", id).order("sequence")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (s.number || s.title || "Request");
    var st = s.status || "draft", done = st === "signed" || st === "declined";
    var typeOpts = SIGN_TYPES.map(function (x) { return '<option value="' + x[0] + '"' + (s.doc_type === x[0] ? " selected" : "") + '>' + x[1] + '</option>'; }).join("");
    var projOpts = '<option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (s.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    var allSigned = sigs.length && sigs.every(function (g) { return g.signed_at; });
    var btns = done ? "" : '<button class="pri" id="sg-save">Save</button><button id="sg-discard">Discard</button>';
    if (id !== "new" && st === "draft") btns += '<button id="sg-send">Send for signature</button>';
    if (id !== "new" && st === "pending" && allSigned) btns += '<button id="sg-complete">Mark fully signed</button>';
    var stages = '<div class="o-stages"><span class="st ' + (st === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (st === "pending" ? "on" : (st === "signed" ? "done" : "")) + '">Awaiting signatures</span><span class="st ' + (st === "signed" ? "on" : "") + '">Signed</span></div>';
    function sigRow(g) { g = g || {}; var signed = !!g.signed_at; return '<tr data-sig="' + (g.id || "") + '"><td>' + (id === "new" || st === "draft" ? '<input class="sg-name" value="' + esc(g.signer_name || "") + '" placeholder="Signer name">' : esc(g.signer_name || "")) + '</td><td>' + (id === "new" || st === "draft" ? '<input class="sg-role" value="' + esc(g.signer_role || "") + '" placeholder="Role">' : esc(g.signer_role || "")) + '</td><td>' + (signed ? '<span class="badge paid">Signed ' + esc((g.signed_at || "").slice(0, 10)) + '</span>' + (g.signature_data && g.signature_data.indexOf("data:image") === 0 ? ' <img src="' + g.signature_data + '" style="height:26px;vertical-align:middle;border:1px solid var(--line);border-radius:4px">' : (g.signature_data ? ' <i>' + esc(g.signature_data) + '</i>' : '')) : (st === "pending" ? '<button class="sg-sign" data-id="' + g.id + '" style="padding:3px 10px;border:1px solid var(--accent);border-radius:7px;background:var(--accent);color:#fff;font:inherit;font-size:12px;cursor:pointer">Sign</button>' : '<span class="muted">not sent</span>')) + '</td>' + (st === "draft" ? '<td><button class="sg-del" style="border:none;background:none;color:var(--bad);cursor:pointer;font-size:16px">&times;</button></td>' : '<td></td>') + '</tr>'; }
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title"><input id="sg-title" value="' + esc(s.title || "") + '" placeholder="What is being signed"' + (done ? " disabled" : "") + '></div>' +
      '<div class="o-groups"><div>' +
      fld("Type", '<select id="sg-type"' + (st !== "draft" ? " disabled" : "") + '>' + typeOpts + '</select>') +
      fld("Reference", '<input id="sg-ref" value="' + esc(s.ref || "") + '"' + (st !== "draft" ? " disabled" : "") + ' placeholder="e.g. IPC-01, PO number">') +
      '</div><div>' +
      fld("Project", '<select id="sg-proj"' + (st !== "draft" ? " disabled" : "") + '>' + projOpts + '</select>') +
      fld("Notes", '<input id="sg-notes" value="' + esc(s.notes || "") + '"' + (done ? " disabled" : "") + '>') +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Signers</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Name</th><th>Role</th><th>Signature</th><th></th></tr></thead><tbody id="sg-lines">' + (sigs.length ? sigs.map(sigRow).join("") : (st === "draft" ? sigRow() : '')) + '</tbody></table>' + (st === "draft" ? '<button id="sg-add" class="o-addln">+ Add signer</button>' : '') + '</div></div>' +
      '</div>';
    var db = document.getElementById("sg-discard"); if (db) db.onclick = function () { go("sign.list"); };
    function wireDel() { document.querySelectorAll("#sg-lines .sg-del").forEach(function (x) { x.onclick = function () { x.closest("tr").remove(); }; }); }
    wireDel();
    var addb = document.getElementById("sg-add"); if (addb) addb.onclick = function () { document.getElementById("sg-lines").insertAdjacentHTML("beforeend", sigRow()); wireDel(); };
    document.querySelectorAll(".sg-sign").forEach(function (b) { b.onclick = function () { openSignatureModal(b.dataset.id, id); }; });
    async function persist() {
      var row = { title: gv("sg-title") || "Signature request", doc_type: document.getElementById("sg-type").value, ref: gv("sg-ref"), project_id: document.getElementById("sg-proj").value || null, notes: gv("sg-notes") };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.status = "draft"; row.number = await nextDocNumber("sign_requests", "SIGN"); var ins = await sb.from("sign_requests").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("sign_requests").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      if (st === "draft") {
        await sb.from("sign_signatures").delete().eq("request_id", sid);
        var rows = [].map.call(document.querySelectorAll("#sg-lines tr"), function (tr, i) { return { company_id: S.company.id, request_id: sid, signer_name: (tr.querySelector(".sg-name") || {}).value || "", signer_role: (tr.querySelector(".sg-role") || {}).value || "", sequence: (i + 1) * 10 }; }).filter(function (g) { return g.signer_name; });
        if (rows.length) await sb.from("sign_signatures").insert(rows);
      }
      return sid;
    }
    var sv = document.getElementById("sg-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderSignForm(sid); } };
    var snd = document.getElementById("sg-send"); if (snd) snd.onclick = async function () { var sid = await persist(); if (!sid) return; if (!document.querySelectorAll("#sg-lines tr").length) { toast("Add at least one signer"); return; } await sb.from("sign_requests").update({ status: "pending" }).eq("id", sid); toast("Sent for signature"); renderSignForm(sid); };
    var cmp = document.getElementById("sg-complete"); if (cmp) cmp.onclick = async function () { await sb.from("sign_requests").update({ status: "signed" }).eq("id", id); toast("Marked fully signed"); renderSignForm(id); };
  }
  function openSignatureModal(sigId, requestId) {
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Sign</h3><div class="form">' +
      '<div><label>Your name</label><input id="sig-name" placeholder="Type your full name"></div>' +
      '<div><label>Draw your signature</label><canvas id="sig-canvas" width="440" height="140" style="border:1px dashed var(--line);border-radius:8px;background:#fff;touch-action:none;width:100%;max-width:440px"></canvas><div style="margin-top:4px"><button class="btn" id="sig-clear" style="font-size:12px;padding:4px 10px">Clear</button></div></div>' +
      '<div class="sub">By signing you confirm you approve this document. Your name, signature and a timestamp are recorded.</div>' +
      '</div><div class="foot"><button class="btn" id="sig-cancel">Cancel</button><button class="btn pri" id="sig-save" style="background:var(--accent);border-color:var(--accent)">Confirm signature</button></div></div>';
    document.body.appendChild(m);
    var cv = document.getElementById("sig-canvas"), ctx = cv.getContext("2d"), drawing = false, drew = false;
    ctx.strokeStyle = "#16171c"; ctx.lineWidth = 2; ctx.lineCap = "round";
    function pos(e) { var r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] : e; return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) }; }
    function start(e) { drawing = true; drew = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
    function move(e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }
    function end() { drawing = false; }
    cv.addEventListener("mousedown", start); cv.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    cv.addEventListener("touchstart", start); cv.addEventListener("touchmove", move); cv.addEventListener("touchend", end);
    document.getElementById("sig-clear").onclick = function () { ctx.clearRect(0, 0, cv.width, cv.height); drew = false; };
    document.getElementById("sig-cancel").onclick = function () { m.remove(); };
    document.getElementById("sig-save").onclick = async function () {
      var name = document.getElementById("sig-name").value.trim();
      if (!name) { toast("Type your name"); return; }
      var data = drew ? cv.toDataURL("image/png") : name;
      var r = await sb.from("sign_signatures").update({ signer_name: name, signature_data: data, signed_at: new Date().toISOString() }).eq("id", sigId);
      if (r.error) { toast(errMsg(r.error)); return; }
      m.remove(); toast("Signed"); renderSignForm(requestId);
    };
  }

  // ============================ RECRUITMENT ============================
  var APP_STAGES = [["new", "New"], ["screening", "Screening"], ["interview", "Interview"], ["offer", "Offer"], ["hired", "Hired"], ["rejected", "Rejected"]];
  function appStageLabel(s) { var m = APP_STAGES.filter(function (x) { return x[0] === s; })[0]; return m ? m[1] : s; }
  function cfgApplicants() {
    return {
      title: "Applicants", pageSize: 100,
      fetch: function () { return sb.from("applicants").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (a) { return (a.name || "") + " " + (a.email || "") + " " + (a.source || ""); },
      columns: [
        { label: "Name", get: function (a) { return '<b>' + esc(a.name) + '</b>'; } },
        { label: "Email", get: function (a) { return '<span class="muted">' + esc(a.email || "") + '</span>'; } },
        { label: "Stage", get: function (a) { return '<span class="badge ' + (a.stage === "hired" ? "paid" : a.stage === "rejected" ? "unpaid" : "partial") + '">' + appStageLabel(a.stage) + '</span>'; } },
        { label: "Rating", get: function (a) { var n = Number(a.rating || 0); return n ? "★".repeat(Math.min(5, n)) : '<span class="muted">-</span>'; } },
        { label: "Applied", get: function (a) { return '<span class="muted">' + esc(a.applied_date || "") + '</span>'; } }
      ],
      filters: APP_STAGES.map(function (s) { return { label: s[1], test: function (a) { return a.stage === s[0]; } }; }),
      groupBy: [{ label: "Stage", get: function (a) { return appStageLabel(a.stage); } }, { label: "Source", get: function (a) { return a.source || "None"; } }],
      kanbanCard: function (a) { return '<div class="t">' + esc(a.name) + '</div><div class="muted">' + esc(a.email || "") + '</div><div class="r"><span>' + esc(a.source || "") + '</span><span>' + (Number(a.rating || 0) ? "★".repeat(a.rating) : "") + '</span></div>'; },
      onOpen: function (a) { renderApplicantForm(a.id); }, onNew: function () { renderApplicantForm("new"); }
    };
  }
  async function renderApplicantForm(id) {
    var parent = { action: "rec.applicants", title: "Applicants" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var a = id === "new" ? { stage: "new", applied_date: today(), rating: 0 } : (await sb.from("applicants").select("*").eq("id", id).maybeSingle()).data || {};
    var jobs = (await sb.from("hr_jobs").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (a.name || "Applicant");
    var jobOpts = '<option value="">(none)</option>' + jobs.map(function (j) { return '<option value="' + j.id + '"' + (a.job_id === j.id ? " selected" : "") + '>' + esc(j.name) + '</option>'; }).join("");
    var stageBtns = APP_STAGES.filter(function (x) { return x[0] !== a.stage; }).map(function (x) { return '<button id="ap-stage-' + x[0] + '">' + (x[0] === "hired" ? "Hire" : x[0] === "rejected" ? "Reject" : "Move to " + x[1]) + '</button>'; }).join("");
    var stages = '<div class="o-stages">' + APP_STAGES.filter(function (x) { return x[0] !== "rejected"; }).map(function (x) { var idx = APP_STAGES.map(function (z) { return z[0]; }).indexOf(a.stage), cur = APP_STAGES.map(function (z) { return z[0]; }).indexOf(x[0]); return '<span class="st ' + (a.stage === x[0] ? "on" : (cur < idx ? "done" : "")) + '">' + x[1] + '</span>'; }).join("") + '</div>';
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="ap-save">Save</button><button id="ap-discard">Discard</button></div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title"><input id="ap-name" value="' + esc(a.name || "") + '" placeholder="Applicant name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Email", '<input id="ap-email" value="' + esc(a.email || "") + '">') +
      fld("Phone", '<input id="ap-phone" value="' + esc(a.phone || "") + '">') +
      fld("Job position", '<select id="ap-job">' + jobOpts + '</select>') +
      fld("Stage", '<select id="ap-stage">' + APP_STAGES.map(function (x) { return '<option value="' + x[0] + '"' + (a.stage === x[0] ? " selected" : "") + '>' + x[1] + '</option>'; }).join("") + '</select>') +
      '</div><div>' +
      fld("Source", '<input id="ap-source" value="' + esc(a.source || "") + '" placeholder="e.g. LinkedIn, referral">') +
      fld("Rating (1-5)", '<input id="ap-rating" type="number" min="0" max="5" value="' + (a.rating || 0) + '">') +
      fld("Applied date", '<input id="ap-applied" type="date" value="' + (a.applied_date || today()) + '">') +
      fld("CV link", '<input id="ap-cv" value="' + esc(a.cv_link || "") + '" placeholder="URL to CV">') +
      '</div></div>' +
      fld("Notes", '<textarea id="ap-notes" rows="3">' + esc(a.notes || "") + '</textarea>') +
      '</div>';
    document.getElementById("ap-discard").onclick = function () { go("rec.applicants"); };
    async function persist(extra) {
      var row = Object.assign({ name: gv("ap-name") || "Applicant", email: gv("ap-email"), phone: gv("ap-phone"), job_id: document.getElementById("ap-job").value || null, stage: document.getElementById("ap-stage").value, source: gv("ap-source"), rating: parseInt(gv("ap-rating"), 10) || 0, applied_date: gv("ap-applied") || null, cv_link: gv("ap-cv"), notes: (document.getElementById("ap-notes") || {}).value || "" }, extra || {});
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("applicants").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("applicants").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    document.getElementById("ap-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderApplicantForm(sid); } };
  }

  // ============================ KNOWLEDGE ============================
  function cfgArticles() {
    return {
      title: "Articles", pageSize: 80,
      fetch: function () { return sb.from("articles").select("*").eq("company_id", S.company.id).order("updated_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (a) { return (a.title || "") + " " + (a.category || "") + " " + (a.body || ""); },
      columns: [
        { label: "Title", get: function (a) { return '<b>' + esc(a.title) + '</b>'; } },
        { label: "Category", get: function (a) { return esc(a.category || ""); } },
        { label: "Updated", get: function (a) { return '<span class="muted">' + esc((a.updated_at || "").slice(0, 10)) + '</span>'; } },
        { label: "Status", get: function (a) { return a.is_published ? '<span class="badge paid">Published</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Published", test: function (a) { return a.is_published; } }, { label: "Draft", test: function (a) { return !a.is_published; } }],
      groupBy: [{ label: "Category", get: function (a) { return a.category || "Uncategorised"; } }],
      onOpen: function (a) { renderArticleForm(a.id); }, onNew: function () { renderArticleForm("new"); }
    };
  }
  async function renderArticleForm(id) {
    var parent = { action: "kb.articles", title: "Articles" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var a = id === "new" ? { is_published: true } : (await sb.from("articles").select("*").eq("id", id).maybeSingle()).data || {};
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (a.title || "Article");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="kb-save">Save</button><button id="kb-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="kb-title" value="' + esc(a.title || "") + '" placeholder="Article title"></div>' +
      '<div class="o-groups"><div>' + fld("Category", '<input id="kb-cat" value="' + esc(a.category || "") + '" placeholder="e.g. Method statements, HR, Safety">', "Group articles by topic.") + '</div><div>' + fld("Status", '<select id="kb-pub"><option value="1"' + (a.is_published !== false ? " selected" : "") + '>Published</option><option value="0"' + (a.is_published === false ? " selected" : "") + '>Draft</option></select>') + '</div></div>' +
      fld("Body", '<textarea id="kb-body" rows="16" style="font-family:inherit;line-height:1.6">' + esc(a.body || "") + '</textarea>', "Write the procedure / notes. Plain text.") +
      '</div>';
    document.getElementById("kb-discard").onclick = function () { go("kb.articles"); };
    document.getElementById("kb-save").onclick = async function () {
      var row = { title: gv("kb-title") || "Untitled", category: gv("kb-cat"), body: (document.getElementById("kb-body") || {}).value || "", is_published: document.getElementById("kb-pub").value === "1", updated_at: new Date().toISOString() };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("articles").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return; } sid = ins.data.id; }
      else { if ((await sb.from("articles").update(row).eq("id", id)).error) { toast("Save failed"); return; } }
      toast("Saved"); renderArticleForm(sid);
    };
  }

  // ============================ SITE OPS: SNAGGING / QHSE ============================
  var SEV = { low: ["Low", "var(--slate)"], medium: ["Medium", "var(--warn)"], high: ["High", "#ea580c"], critical: ["Critical", "var(--bad)"] };
  function sevBadge(s) { var m = SEV[s] || ["?", "var(--slate)"]; return '<span style="display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:6px;background:' + m[1] + ';color:#fff">' + m[0] + '</span>'; }
  function snagStatusBadge(s) { return (s === "closed" || s === "verified") ? '<span class="badge paid">' + esc(s.charAt(0).toUpperCase() + s.slice(1)) + '</span>' : s === "fixed" ? '<span class="badge partial">Fixed</span>' : s === "in_progress" ? '<span class="badge partial">In progress</span>' : '<span class="badge unpaid">Open</span>'; }
  function cfgSnags() {
    return {
      title: "Snags", pageSize: 120,
      fetch: function () { return sb.from("snags").select("*, projects(name), hr_employees(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.number || "") + " " + (s.description || "") + " " + (s.location || "") + " " + (s.trade || "") + " " + (s.projects ? s.projects.name : ""); },
      columns: [
        { label: "Number", get: function (s) { return '<b>' + esc(s.number || "/") + '</b>'; } },
        { label: "Description", get: function (s) { return esc(s.description); } },
        { label: "Location", get: function (s) { return esc(s.location || ""); } },
        { label: "Severity", get: function (s) { return sevBadge(s.severity); } },
        { label: "Project", get: function (s) { return esc(s.projects ? s.projects.name : ""); } },
        { label: "Assigned", get: function (s) { return esc(s.hr_employees ? s.hr_employees.name : ""); } },
        { label: "Due", get: function (s) { return '<span class="muted">' + esc(s.due_date || "") + '</span>' + (["closed", "verified"].indexOf(s.status) < 0 && isOverdue(s.due_date) ? ' <span class="ob-flag">overdue</span>' : ''); } },
        { label: "Status", get: function (s) { return snagStatusBadge(s.status); } }
      ],
      filters: [{ label: "Open", test: function (s) { return ["closed", "verified"].indexOf(s.status) < 0; } }, { label: "Critical / high", test: function (s) { return s.severity === "critical" || s.severity === "high"; } }, { label: "Overdue", test: function (s) { return ["closed", "verified"].indexOf(s.status) < 0 && isOverdue(s.due_date); } }],
      groupBy: [{ label: "Project", get: function (s) { return s.projects ? s.projects.name : "None"; } }, { label: "Severity", get: function (s) { return (SEV[s.severity] || ["?"])[0]; } }, { label: "Status", get: function (s) { return s.status; } }, { label: "Trade", get: function (s) { return s.trade || "None"; } }],
      kanbanCard: function (s) { return '<div class="t">' + esc(s.description) + '</div><div class="muted">' + esc(s.location || "") + '</div><div class="r"><span>' + sevBadge(s.severity) + '</span><span>' + esc(s.hr_employees ? s.hr_employees.name : "") + '</span></div>'; },
      onOpen: function (s) { openSnagModal(s); }, onNew: function () { openSnagModal(null); }
    };
  }
  async function openSnagModal(s) {
    s = s || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (s.id ? "Snag " + esc(s.number || "") : "New snag") + '</h3><div class="form">' +
      '<div><label>Description</label><input id="sn-desc" value="' + esc(s.description || "") + '" placeholder="What is the defect?"></div>' +
      '<div class="row2"><div><label>Project / site</label><select id="sn-proj"><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (s.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div><div><label>Location</label><input id="sn-loc" value="' + esc(s.location || "") + '" placeholder="e.g. North elevation L5"></div></div>' +
      '<div class="row2"><div><label>Severity</label><select id="sn-sev"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div><div><label>Trade</label><input id="sn-trade" value="' + esc(s.trade || "") + '" placeholder="e.g. Glazing, Sealant"></div></div>' +
      '<div class="row2"><div><label>Assigned to</label><select id="sn-emp"><option value="">(none)</option>' + emps.map(function (e) { return '<option value="' + e.id + '"' + (s.assigned_to === e.id ? " selected" : "") + '>' + esc(e.name) + '</option>'; }).join("") + '</select></div><div><label>Due date</label><input id="sn-due" type="date" value="' + (s.due_date || "") + '"></div></div>' +
      '<div class="row2"><div><label>Status</label><select id="sn-status"><option value="open">Open</option><option value="in_progress">In progress</option><option value="fixed">Fixed</option><option value="verified">Verified</option><option value="closed">Closed</option></select></div><div><label>Photo URL</label><input id="sn-photo" value="' + esc(s.photo_url || "") + '" placeholder="optional link"></div></div>' +
      '</div><div class="foot"><button class="btn" id="sn-cancel">Cancel</button>' + (s.id ? '<button class="btn" id="sn-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="sn-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("sn-sev").value = s.severity || "medium";
    document.getElementById("sn-status").value = s.status || "open";
    document.getElementById("sn-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("sn-del"); if (del) del.onclick = async function () { await sb.from("snags").delete().eq("id", s.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("sn-save").onclick = async function () {
      var row = { description: gv("sn-desc") || "Snag", project_id: document.getElementById("sn-proj").value || null, location: gv("sn-loc"), severity: document.getElementById("sn-sev").value, trade: gv("sn-trade"), assigned_to: document.getElementById("sn-emp").value || null, due_date: gv("sn-due") || null, status: document.getElementById("sn-status").value, photo_url: gv("sn-photo") };
      var r; if (s.id) r = await sb.from("snags").update(row).eq("id", s.id); else { row.company_id = S.company.id; row.number = await nextDocNumber("snags", "SNAG"); r = await sb.from("snags").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }
  function cfgInspections() {
    return {
      title: "Inspections", pageSize: 100,
      fetch: function () { return sb.from("inspections").select("*, projects(name)").eq("company_id", S.company.id).order("insp_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (i) { return (i.number || "") + " " + (i.insp_type || "") + " " + (i.inspector || "") + " " + (i.area || "") + " " + (i.projects ? i.projects.name : ""); },
      columns: [
        { label: "Number", get: function (i) { return '<b>' + esc(i.number || "/") + '</b>'; } },
        { label: "Type", get: function (i) { return esc((i.insp_type || "").replace("_", " ")); } },
        { label: "Project", get: function (i) { return esc(i.projects ? i.projects.name : ""); } },
        { label: "Inspector", get: function (i) { return esc(i.inspector || ""); } },
        { label: "Date", get: function (i) { return '<span class="muted">' + esc(i.insp_date || "") + '</span>'; } },
        { label: "Status", get: function (i) { return i.status === "closed" ? '<span class="badge paid">Closed</span>' : '<span class="badge partial">Open</span>'; } }
      ],
      filters: [{ label: "Open", test: function (i) { return i.status !== "closed"; } }, { label: "Safety", test: function (i) { return i.insp_type === "safety"; } }],
      groupBy: [{ label: "Project", get: function (i) { return i.projects ? i.projects.name : "None"; } }, { label: "Type", get: function (i) { return i.insp_type || "None"; } }],
      onOpen: function (i) { openInspectionModal(i); }, onNew: function () { openInspectionModal(null); }
    };
  }
  async function openInspectionModal(i) {
    i = i || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (i.id ? "Inspection " + esc(i.number || "") : "New inspection") + '</h3><div class="form">' +
      '<div class="row2"><div><label>Type</label><select id="in-type"><option value="quality">Quality</option><option value="safety">Safety (QHSE)</option><option value="pre_pour">Pre-pour</option><option value="handover">Handover</option><option value="snag">Snag</option></select></div><div><label>Date</label><input id="in-date" type="date" value="' + (i.insp_date || today()) + '"></div></div>' +
      '<div class="row2"><div><label>Project</label><select id="in-proj"><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (i.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div><div><label>Area</label><input id="in-area" value="' + esc(i.area || "") + '"></div></div>' +
      '<div class="row2"><div><label>Inspector</label><input id="in-insp" value="' + esc(i.inspector || "") + '"></div><div><label>Score (%)</label><input id="in-score" type="number" min="0" max="100" value="' + (i.score || 0) + '"></div></div>' +
      '<div><label>Notes</label><textarea id="in-notes" rows="2">' + esc(i.notes || "") + '</textarea></div>' +
      '<div><label>Status</label><select id="in-status"><option value="open">Open</option><option value="closed">Closed</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="in-cancel">Cancel</button>' + (i.id ? '<button class="btn" id="in-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="in-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("in-type").value = i.insp_type || "quality";
    document.getElementById("in-status").value = i.status || "open";
    document.getElementById("in-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("in-del"); if (del) del.onclick = async function () { await sb.from("inspections").delete().eq("id", i.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("in-save").onclick = async function () {
      var row = { insp_type: document.getElementById("in-type").value, insp_date: gv("in-date") || null, project_id: document.getElementById("in-proj").value || null, area: gv("in-area"), inspector: gv("in-insp"), score: parseInt(gv("in-score"), 10) || 0, notes: (document.getElementById("in-notes") || {}).value || "", status: document.getElementById("in-status").value };
      var r; if (i.id) r = await sb.from("inspections").update(row).eq("id", i.id); else { row.company_id = S.company.id; row.number = await nextDocNumber("inspections", "INSP"); r = await sb.from("inspections").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }

  // ============================ SITE OPS: PLANT & EQUIPMENT ============================
  function cfgPlant() {
    return {
      title: "Plant & Equipment", pageSize: 100,
      fetch: function () { return sb.from("plant_equipment").select("*, projects(name)").eq("company_id", S.company.id).order("name").then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.code || "") + " " + (p.name || "") + " " + (p.category || "") + " " + (p.supplier || ""); },
      columns: [
        { label: "Code", get: function (p) { return '<b>' + esc(p.code || "") + '</b>'; } },
        { label: "Name", get: function (p) { return esc(p.name); } },
        { label: "Category", get: function (p) { return esc(p.category || ""); } },
        { label: "Ownership", get: function (p) { return p.ownership === "hired" ? '<span class="badge partial">Hired</span>' : '<span class="badge">Owned</span>'; } },
        { label: "On project", get: function (p) { return esc(p.projects ? p.projects.name : ""); } },
        { label: "Day rate", num: true, get: function (p) { return money(p.daily_rate); } },
        { label: "Status", get: function (p) { return p.status === "on_site" ? '<span class="badge paid">On site</span>' : p.status === "maintenance" ? '<span class="badge unpaid">Maintenance</span>' : p.status === "off_hired" ? '<span class="badge draft">Off-hired</span>' : '<span class="badge partial">Available</span>'; } }
      ],
      filters: [{ label: "On site", test: function (p) { return p.status === "on_site"; } }, { label: "Hired", test: function (p) { return p.ownership === "hired"; } }, { label: "Maintenance", test: function (p) { return p.status === "maintenance"; } }],
      groupBy: [{ label: "Category", get: function (p) { return p.category || "None"; } }, { label: "Status", get: function (p) { return p.status; } }, { label: "Ownership", get: function (p) { return p.ownership; } }],
      onOpen: function (p) { openPlantModal(p); }, onNew: function () { openPlantModal(null); }
    };
  }
  async function openPlantModal(p) {
    p = p || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (p.id ? "Edit equipment" : "New equipment") + '</h3><div class="form">' +
      '<div class="row2"><div><label>Code</label><input id="pl2-code" value="' + esc(p.code || "") + '" placeholder="e.g. CR-01"></div><div><label>Name</label><input id="pl2-name" value="' + esc(p.name || "") + '"></div></div>' +
      '<div class="row2"><div><label>Category</label><input id="pl2-cat" value="' + esc(p.category || "") + '" placeholder="e.g. Crane, Hoist, Access"></div><div><label>Ownership</label><select id="pl2-own"><option value="owned">Owned</option><option value="hired">Hired</option></select></div></div>' +
      '<div class="row2"><div><label>Supplier (if hired)</label><input id="pl2-sup" value="' + esc(p.supplier || "") + '"></div><div><label>Day rate</label><input id="pl2-rate" type="number" step="0.01" value="' + (p.daily_rate || 0) + '"></div></div>' +
      '<div class="row2"><div><label>Status</label><select id="pl2-status"><option value="available">Available</option><option value="on_site">On site</option><option value="maintenance">Maintenance</option><option value="off_hired">Off-hired</option></select></div><div><label>On project</label><select id="pl2-proj"><option value="">(none)</option>' + projs.map(function (x) { return '<option value="' + x.id + '"' + (p.project_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div></div>' +
      '<div class="row2"><div><label>Location</label><input id="pl2-loc" value="' + esc(p.location || "") + '"></div><div><label>Next service</label><input id="pl2-serv" type="date" value="' + (p.next_service_date || "") + '"></div></div>' +
      '<div class="row2"><div><label>On hire from</label><input id="pl2-start" type="date" value="' + (p.start_date || "") + '"></div><div><label>Off hire</label><input id="pl2-end" type="date" value="' + (p.end_date || "") + '"></div></div>' +
      '</div><div class="foot"><button class="btn" id="pl2-cancel">Cancel</button>' + (p.id ? '<button class="btn" id="pl2-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="pl2-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("pl2-own").value = p.ownership || "owned";
    document.getElementById("pl2-status").value = p.status || "available";
    document.getElementById("pl2-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("pl2-del"); if (del) del.onclick = async function () { await sb.from("plant_equipment").delete().eq("id", p.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("pl2-save").onclick = async function () {
      var row = { code: gv("pl2-code"), name: gv("pl2-name") || "Equipment", category: gv("pl2-cat"), ownership: document.getElementById("pl2-own").value, supplier: gv("pl2-sup"), daily_rate: parseFloat(gv("pl2-rate")) || 0, status: document.getElementById("pl2-status").value, project_id: document.getElementById("pl2-proj").value || null, location: gv("pl2-loc"), next_service_date: gv("pl2-serv") || null, start_date: gv("pl2-start") || null, end_date: gv("pl2-end") || null };
      var r; if (p.id) r = await sb.from("plant_equipment").update(row).eq("id", p.id); else { row.company_id = S.company.id; r = await sb.from("plant_equipment").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView();
    };
  }

  // ============================ SITE OPS: SITE DIARY ============================
  function cfgSiteDiary() {
    return {
      title: "Site Diary", pageSize: 100,
      fetch: function () { return sb.from("site_diaries").select("*, projects(name)").eq("company_id", S.company.id).order("diary_date", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (d) { return (d.diary_date || "") + " " + (d.work_done || "") + " " + (d.projects ? d.projects.name : ""); },
      columns: [
        { label: "Date", get: function (d) { return '<b>' + esc(d.diary_date || "") + '</b>'; } },
        { label: "Project", get: function (d) { return esc(d.projects ? d.projects.name : ""); } },
        { label: "Weather", get: function (d) { return esc(d.weather || ""); } },
        { label: "Manpower", num: true, get: function (d) { return String(d.manpower || 0); } },
        { label: "Work done", get: function (d) { return '<span class="muted">' + esc((d.work_done || "").slice(0, 60)) + '</span>'; } }
      ],
      groupBy: [{ label: "Project", get: function (d) { return d.projects ? d.projects.name : "None"; } }],
      onOpen: function (d) { renderSiteDiaryForm(d.id); }, onNew: function () { renderSiteDiaryForm("new"); }
    };
  }
  async function renderSiteDiaryForm(id) {
    var parent = { action: "site.diary", title: "Site Diary" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var d = id === "new" ? { diary_date: today() } : (await sb.from("site_diaries").select("*").eq("id", id).maybeSingle()).data || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (d.diary_date || "Diary");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="sd-save">Save</button><button id="sd-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet"><div class="o-groups"><div>' +
      fld("Project / site", '<select id="sd-proj"><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (d.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>') +
      fld("Date", '<input id="sd-date" type="date" value="' + (d.diary_date || today()) + '">') +
      fld("Weather", '<input id="sd-weather" value="' + esc(d.weather || "") + '" placeholder="e.g. Clear, Rain PM">') +
      fld("Temperature", '<input id="sd-temp" value="' + esc(d.temperature || "") + '" placeholder="e.g. 28C">') +
      '</div><div>' +
      fld("Own manpower", '<input id="sd-man" type="number" value="' + (d.manpower || 0) + '">', "Number of your own staff on site.") +
      fld("Subcontractor staff", '<input id="sd-subs" type="number" value="' + (d.subcontractor_count || 0) + '">') +
      fld("Visitors", '<input id="sd-vis" value="' + esc(d.visitors || "") + '" placeholder="e.g. Consultant, client rep">') +
      '</div></div>' +
      fld("Work done today", '<textarea id="sd-work" rows="3">' + esc(d.work_done || "") + '</textarea>') +
      fld("Delays / issues", '<textarea id="sd-delays" rows="2">' + esc(d.delays || "") + '</textarea>', "Anything that held up work - weather, access, materials, instructions.") +
      fld("Materials received", '<input id="sd-mat" value="' + esc(d.materials_received || "") + '">') +
      fld("Notes", '<input id="sd-notes" value="' + esc(d.notes || "") + '">') +
      '</div>';
    document.getElementById("sd-discard").onclick = function () { go("site.diary"); };
    document.getElementById("sd-save").onclick = async function () {
      var row = { project_id: document.getElementById("sd-proj").value || null, diary_date: gv("sd-date") || null, weather: gv("sd-weather"), temperature: gv("sd-temp"), manpower: parseInt(gv("sd-man"), 10) || 0, subcontractor_count: parseInt(gv("sd-subs"), 10) || 0, visitors: gv("sd-vis"), work_done: (document.getElementById("sd-work") || {}).value || "", delays: (document.getElementById("sd-delays") || {}).value || "", materials_received: gv("sd-mat"), notes: gv("sd-notes") };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("site_diaries").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return; } sid = ins.data.id; }
      else { if ((await sb.from("site_diaries").update(row).eq("id", id)).error) { toast("Save failed"); return; } }
      toast("Saved"); renderSiteDiaryForm(sid);
    };
  }

  // ============================ PROGRAMME (GANTT) - client-facing schedule ============================
  async function renderSchedule(projectId) {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Programme") + '<div class="gap"></div><select id="sc-proj" class="o-filtbtn"></select><button class="o-filtbtn" id="sc-add">+ Activity</button><button class="o-filtbtn" id="sc-print">Print</button></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var psel = document.getElementById("sc-proj");
    psel.innerHTML = '<option value="">Pick a project</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (projectId === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    document.getElementById("sc-print").onclick = function () { window.print(); };
    psel.onchange = function () { renderSchedule(psel.value); };
    document.getElementById("sc-add").onclick = function () { if (!projectId) { toast("Pick a project first"); return; } openScheduleTaskModal(null, projectId); };
    var body = document.getElementById("o-body");
    if (!projectId) { body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">Pick a project</div><div class="o-empty2-h">Choose a project above to build and view its programme (Gantt).</div></div>'; return; }
    var tasks = (await sb.from("schedule_tasks").select("*").eq("project_id", projectId).order("sort_order").order("start_date")).data || [];
    if (!tasks.length) { body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">No activities yet</div><div class="o-empty2-h">Add activities with start and end dates to draw the programme.</div><button class="o-new" id="sc-add2" style="margin-top:14px">+ Add activity</button></div>'; document.getElementById("sc-add2").onclick = function () { openScheduleTaskModal(null, projectId); }; return; }
    var dated = tasks.filter(function (t) { return t.start_date && t.end_date; });
    var minD = null, maxD = null;
    dated.forEach(function (t) { var s = parseD(t.start_date), e = parseD(t.end_date); if (!minD || s < minD) minD = s; if (!maxD || e > maxD) maxD = e; });
    if (!minD) { minD = new Date(); maxD = new Date(minD.getFullYear(), minD.getMonth() + 3, 0); }
    // pad a few days
    minD = new Date(minD); minD.setDate(minD.getDate() - 2);
    maxD = new Date(maxD); maxD.setDate(maxD.getDate() + 2);
    var totalDays = Math.max(1, Math.round((maxD - minD) / 864e5));
    function pct(dt) { return ((parseD(dt) - minD) / 864e5) / totalDays * 100; }
    // month gridlines
    var grid = "", cur = new Date(minD.getFullYear(), minD.getMonth(), 1);
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    while (cur <= maxD) {
      var lp = ((cur - minD) / 864e5) / totalDays * 100;
      if (lp >= 0 && lp <= 100) grid += '<div class="gantt-month" style="left:' + lp + '%"><span>' + monthNames[cur.getMonth()] + " " + String(cur.getFullYear()).slice(2) + '</span></div>';
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    var todayPct = pct(today());
    var rows = tasks.map(function (t) {
      var hasDates = t.start_date && t.end_date;
      var left = hasDates ? pct(t.start_date) : 0, right = hasDates ? pct(t.end_date) : 0, w = Math.max(0.6, right - left);
      var prog = Math.max(0, Math.min(100, Number(t.progress || 0)));
      var bar = t.is_milestone
        ? '<div class="gantt-ms" style="left:' + left + '%" title="' + esc(t.name) + '"></div>'
        : (hasDates ? '<div class="gantt-bar" style="left:' + left + '%;width:' + w + '%" title="' + esc(t.name) + ' (' + prog + '%)"><div class="gantt-fill" style="width:' + prog + '%"></div></div>' : '');
      return '<div class="gantt-row" data-id="' + t.id + '"><div class="gantt-label">' + (t.wbs ? '<span class="muted">' + esc(t.wbs) + '</span> ' : '') + esc(t.name) + '</div><div class="gantt-track">' + bar + '</div></div>';
    }).join("");
    body.innerHTML = '<div style="padding:14px 16px"><div class="o-rt-wrap"><div class="gantt" style="min-width:820px"><div class="gantt-head"><div class="gantt-label" style="font-weight:700">Activity</div><div class="gantt-track gantt-grid">' + grid + (todayPct >= 0 && todayPct <= 100 ? '<div class="gantt-today" style="left:' + todayPct + '%"></div>' : '') + '</div></div>' + rows + '</div></div><div class="sub" style="margin-top:8px">This is the client-facing programme. Click an activity to edit. The internal team board lives on the project\'s Execution tab.</div></div>';
    document.querySelectorAll(".gantt-row").forEach(function (r) { r.onclick = function () { var t = tasks.filter(function (x) { return x.id === r.dataset.id; })[0]; openScheduleTaskModal(t, projectId); }; });
  }
  async function openScheduleTaskModal(t, projectId) {
    t = t || {};
    var others = (await sb.from("schedule_tasks").select("id,name").eq("project_id", projectId)).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (t.id ? "Edit activity" : "New activity") + '</h3><div class="form">' +
      '<div><label>Activity</label><input id="st-name" value="' + esc(t.name || "") + '"></div>' +
      '<div class="row2"><div><label>WBS / code</label><input id="st-wbs" value="' + esc(t.wbs || "") + '" placeholder="e.g. 2.1"></div><div><label>Progress (%)</label><input id="st-prog" type="number" min="0" max="100" value="' + (t.progress || 0) + '"></div></div>' +
      '<div class="row2"><div><label>Start</label><input id="st-start" type="date" value="' + (t.start_date || "") + '"></div><div><label>End</label><input id="st-end" type="date" value="' + (t.end_date || "") + '"></div></div>' +
      '<div class="row2"><div><label>Depends on</label><select id="st-dep"><option value="">(none)</option>' + others.filter(function (o) { return o.id !== t.id; }).map(function (o) { return '<option value="' + o.id + '"' + (t.depends_on === o.id ? " selected" : "") + '>' + esc(o.name) + '</option>'; }).join("") + '</select></div><div><label>Milestone?</label><select id="st-ms"><option value="0">No</option><option value="1">Yes</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="st-cancel">Cancel</button>' + (t.id ? '<button class="btn" id="st-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="st-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("st-ms").value = t.is_milestone ? "1" : "0";
    document.getElementById("st-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("st-del"); if (del) del.onclick = async function () { await sb.from("schedule_tasks").delete().eq("id", t.id); m.remove(); toast("Deleted"); renderSchedule(projectId); };
    document.getElementById("st-save").onclick = async function () {
      var row = { name: gv("st-name") || "Activity", wbs: gv("st-wbs"), progress: parseFloat(gv("st-prog")) || 0, start_date: gv("st-start") || null, end_date: gv("st-end") || null, depends_on: document.getElementById("st-dep").value || null, is_milestone: document.getElementById("st-ms").value === "1" };
      var r; if (t.id) r = await sb.from("schedule_tasks").update(row).eq("id", t.id); else { row.company_id = S.company.id; row.project_id = projectId; r = await sb.from("schedule_tasks").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); renderSchedule(projectId);
    };
  }

  // ============================ EXECUTION (internal agile board) ============================
  // The team's working board (Asana / ActiveCollab style). Distinct from the
  // client-facing Delivery view (contract / BOQ / programme). Runs on project_tasks
  // enriched with agile fields + sprints / comments / checklists / watchers / activity.
  var BOARD_STAGES = [
    { key: "backlog", label: "Backlog" },
    { key: "todo", label: "To do" },
    { key: "in_progress", label: "In progress" },
    { key: "review", label: "Review" },
    { key: "done", label: "Done" }
  ];
  var TASK_PRIO = { low: { label: "Low", cls: "pr-low" }, medium: { label: "Medium", cls: "pr-med" }, high: { label: "High", cls: "pr-high" }, urgent: { label: "Urgent", cls: "pr-urg" } };
  var AGS = { proj: "", view: "list", sprint: "", member: "" };
  var _agActor = null;
  var AG_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function agInitials(name) { name = (name || "").trim(); if (!name) return "?"; var p = name.split(/\s+/); return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : "")).toUpperCase(); }
  function agAvatar(emp, sm) { if (!emp) return '<span class="ag-ava none' + (sm ? " sm" : "") + '" title="Unassigned">?</span>'; return '<span class="ag-ava' + (sm ? " sm" : "") + '" title="' + esc(emp.name) + '">' + esc(agInitials(emp.name)) + '</span>'; }
  function agPrio(p) { var d = TASK_PRIO[p] || TASK_PRIO.medium; return '<span class="ag-prio ' + d.cls + '">' + d.label + '</span>'; }
  function agStageLabel(k) { for (var i = 0; i < BOARD_STAGES.length; i++) if (BOARD_STAGES[i].key === k) return BOARD_STAGES[i].label; return k || "Backlog"; }
  function agDate(s) { if (!s) return ""; var d = parseD(s); return d.getDate() + " " + AG_MONTHS[d.getMonth()]; }
  function agWhen(iso) { if (!iso) return ""; var d = new Date(iso); var hh = ("0" + d.getHours()).slice(-2), mm = ("0" + d.getMinutes()).slice(-2); return d.getDate() + " " + AG_MONTHS[d.getMonth()] + " " + hh + ":" + mm; }
  function agBody(s) { return esc(s || "").replace(/@([A-Za-z][A-Za-z'\-]*)/g, '<span class="ag-mention">@$1</span>').replace(/\n/g, "<br>"); }
  function agResolveMentions(text, emps) { var ids = []; (emps || []).forEach(function (e) { var fn = (e.name || "").split(/\s+/)[0]; if (fn && new RegExp("@" + fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text)) ids.push(e.id); }); return ids; }
  async function agActor() { if (_agActor) return _agActor; try { var u = (await sb.auth.getUser()).data.user; _agActor = (u && (u.email || u.id)) || "Team"; } catch (e) { _agActor = "Team"; } return _agActor; }
  async function logTaskActivity(taskId, projectId, verb, detail) { try { await sb.from("task_activity").insert({ company_id: S.company.id, task_id: taskId, project_id: projectId || null, actor_name: await agActor(), verb: verb, detail: detail || "" }); } catch (e) {} }

  async function renderBoard(projectId) {
    if (projectId !== undefined) AGS.proj = projectId;
    var vt = [["list", "List"], ["board", "Board"], ["sprints", "Sprints"]].map(function (v) { return '<button class="o-filtbtn ag-vt' + (AGS.view === v[0] ? " on" : "") + '" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join("");
    document.getElementById("o-main").innerHTML =
      '<div class="o-view"><div class="o-cp">' + bcHTML("Execution") + '<div class="gap"></div>' +
      '<select id="ab-proj" class="o-filtbtn"></select>' + vt +
      '<select id="ab-member" class="o-filtbtn" title="Filter by assignee"></select>' +
      '<button class="o-filtbtn" id="ab-new">+ Task</button></div>' +
      '<div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var psel = document.getElementById("ab-proj");
    psel.innerHTML = '<option value="">Pick a project</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (AGS.proj === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    psel.onchange = function () { AGS.proj = psel.value; AGS.sprint = ""; renderBoard(); };
    document.querySelectorAll(".ag-vt").forEach(function (b) { b.onclick = function () { AGS.view = b.dataset.v; renderBoard(); }; });
    document.getElementById("ab-new").onclick = function () { if (!AGS.proj) { toast("Pick a project first"); return; } openTaskPanel("new", AGS.proj); };
    var body = document.getElementById("o-body");
    var msel = document.getElementById("ab-member");
    if (!AGS.proj) { msel.style.display = "none"; body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">Pick a project</div><div class="o-empty2-h">The Execution board is your team\'s internal workspace: assign work, move it across stages, comment, and run sprints. It is separate from the client-facing Delivery view (contract, BOQ, programme).</div></div>'; return; }

    var res = await Promise.all([
      sb.from("project_tasks").select("*").eq("project_id", AGS.proj).order("sort_order").order("created_at"),
      sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name"),
      sb.from("sprints").select("*").eq("project_id", AGS.proj).order("sort_order"),
      sb.from("task_checklists").select("task_id,is_done").eq("company_id", S.company.id),
      sb.from("task_comments").select("task_id").eq("company_id", S.company.id)
    ]);
    var tasks = res[0].data || [], emps = res[1].data || [], sprints = res[2].data || [];
    var empById = {}; emps.forEach(function (e) { empById[e.id] = e; });
    var clByTask = {}; (res[3].data || []).forEach(function (c) { var o = clByTask[c.task_id] || (clByTask[c.task_id] = { d: 0, t: 0 }); o.t++; if (c.is_done) o.d++; });
    var cmByTask = {}; (res[4].data || []).forEach(function (c) { cmByTask[c.task_id] = (cmByTask[c.task_id] || 0) + 1; });
    var subByParent = {}; tasks.forEach(function (t) { if (t.parent_task_id) subByParent[t.parent_task_id] = (subByParent[t.parent_task_id] || 0) + 1; });
    var ctx = { empById: empById, emps: emps, clByTask: clByTask, cmByTask: cmByTask, subByParent: subByParent, sprints: sprints };

    msel.style.display = AGS.view === "board" ? "" : "none";
    msel.innerHTML = '<option value="">All members</option><option value="__none">Unassigned</option>' + emps.map(function (e) { return '<option value="' + e.id + '"' + (AGS.member === e.id ? " selected" : "") + '>' + esc(e.name) + '</option>'; }).join("");
    msel.onchange = function () { AGS.member = msel.value; renderBoard(); };

    if (AGS.view === "sprints") { renderSprintsView(body, tasks, sprints, ctx); return; }
    if (AGS.view === "list") { renderBoardList(body, tasks, ctx); return; }

    var shown = tasks.filter(function (t) { return !t.parent_task_id; });
    if (AGS.member === "__none") shown = shown.filter(function (t) { return !t.assignee_id; });
    else if (AGS.member) shown = shown.filter(function (t) { return t.assignee_id === AGS.member; });
    if (AGS.sprint === "__backlog") shown = shown.filter(function (t) { return !t.sprint_id; });
    else if (AGS.sprint) shown = shown.filter(function (t) { return t.sprint_id === AGS.sprint; });

    renderBoardKanban(body, shown, ctx);
  }

  function agSprintBar(sprints) {
    if (!sprints.length) return "";
    var chips = '<button class="ag-schip' + (AGS.sprint === "" ? " on" : "") + '" data-s="">All</button><button class="ag-schip' + (AGS.sprint === "__backlog" ? " on" : "") + '" data-s="__backlog">Backlog</button>' +
      sprints.map(function (s) { return '<button class="ag-schip' + (AGS.sprint === s.id ? " on" : "") + '" data-s="' + s.id + '">' + esc(s.name) + (s.status === "active" ? ' <span class="ag-sdot"></span>' : "") + '</button>'; }).join("");
    return '<div class="ag-sbar"><span class="ag-sbar-l">Sprint:</span>' + chips + '</div>';
  }
  function boardCardHtml(t, ctx) {
    var emp = t.assignee_id ? ctx.empById[t.assignee_id] : null;
    var cl = ctx.clByTask[t.id], sub = ctx.subByParent[t.id] || 0, cm = ctx.cmByTask[t.id] || 0;
    var due = t.date_deadline, over = due && due < today() && t.board_stage !== "done";
    var labels = (t.labels || []).slice(0, 3).map(function (l) { return '<span class="ag-label">' + esc(l) + '</span>'; }).join("");
    var meta = [];
    if (cl && cl.t) meta.push('<span class="ag-m" title="Checklist">&#10003; ' + cl.d + '/' + cl.t + '</span>');
    if (sub) meta.push('<span class="ag-m" title="Subtasks">&#9776; ' + sub + '</span>');
    if (cm) meta.push('<span class="ag-m" title="Comments">&#9993; ' + cm + '</span>');
    if (t.blocked_by) meta.push('<span class="ag-m block" title="Blocked by another task">&#9888;</span>');
    var stg = t.board_stage || "backlog", stLbl = agStageLabel(stg);
    // move buttons = the keyboard/click alternative to dragging (ORB-07). aria-hidden because the
    // card's own aria-label already tells screen-reader users to use the arrow keys.
    var mv = '<div class="ag-move" aria-hidden="true"><button type="button" class="ag-mv" data-dir="-1" tabindex="-1" title="Move to previous column">‹</button><button type="button" class="ag-mv" data-dir="1" tabindex="-1" title="Move to next column">›</button></div>';
    return '<div class="ag-card" draggable="true" tabindex="0" role="group" aria-roledescription="Task card" aria-keyshortcuts="Enter ArrowLeft ArrowRight" aria-label="' + esc(t.name) + ', in ' + esc(stLbl) + '. Press Enter to open, or use the left and right arrow keys to move it between columns." data-id="' + t.id + '" data-stage="' + stg + '" data-pts="' + (Number(t.points) || 0) + '">' +
      (labels ? '<div class="ag-labels">' + labels + '</div>' : '') +
      '<div class="ag-card-th"><span class="ag-check' + (t.board_stage === "done" ? " on" : "") + '" data-id="' + t.id + '" title="Mark complete"></span><span class="ag-card-t' + (t.board_stage === "done" ? " done" : "") + '">' + esc(t.name) + '</span></div>' +
      '<div class="ag-card-f"><div class="ag-card-l">' + agPrio(t.priority) + (Number(t.points) ? '<span class="ag-pts" title="Effort points">' + Number(t.points) + '</span>' : '') + (due ? '<span class="ag-due' + (over ? " over" : "") + '">' + agDate(due) + '</span>' : '') + '</div>' + agAvatar(emp) + '</div>' +
      (meta.length ? '<div class="ag-card-m">' + meta.join("") + '</div>' : '') + mv + '</div>';
  }
  function renderBoardKanban(body, shown, ctx) {
    var cols = BOARD_STAGES.map(function (st) {
      var ct = shown.filter(function (t) { return (t.board_stage || "backlog") === st.key; });
      var pts = ct.reduce(function (s, t) { return s + Number(t.points || 0); }, 0);
      return '<div class="ag-col" data-stage="' + st.key + '"><div class="ag-col-h"><span class="ag-col-t">' + st.label + '</span><span class="ag-col-n">' + ct.length + (pts ? ' &middot; ' + pts + ' pts' : '') + '</span></div>' +
        '<div class="ag-col-b" data-stage="' + st.key + '">' + ct.map(function (t) { return boardCardHtml(t, ctx); }).join("") + '</div>' +
        '<div class="ag-quick"><input class="ag-quick-in" data-stage="' + st.key + '" placeholder="+ Add task"></div></div>';
    }).join("");
    body.innerHTML = agSprintBar(ctx.sprints) + '<div class="ag-board">' + cols + '</div>';
    document.querySelectorAll(".ag-schip").forEach(function (b) { b.onclick = function () { AGS.sprint = b.dataset.s; renderBoard(); }; });
    document.querySelectorAll(".ag-card").forEach(function (c) {
      c.addEventListener("click", function (e) { if (e.target.closest(".ag-check") || e.target.closest(".ag-mv")) return; openTaskPanel(c.dataset.id, AGS.proj); });
      c.addEventListener("keydown", function (e) {
        if (e.target !== c) return;                        // only when the card itself is focused
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTaskPanel(c.dataset.id, AGS.proj); }
        else if (e.key === "ArrowRight") { e.preventDefault(); agMoveCard(c.dataset.id, 1); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); agMoveCard(c.dataset.id, -1); }
      });
    });
    document.querySelectorAll(".ag-mv").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); var card = b.closest(".ag-card"); if (card) agMoveCard(card.dataset.id, Number(b.dataset.dir)); }); });
    document.querySelectorAll(".ag-check").forEach(function (cb) { cb.addEventListener("click", function (e) { e.stopPropagation(); agToggleDone(cb.dataset.id, !cb.classList.contains("on")); }); });
    wireBoardDnD();
    wireQuickAdd();
  }
  function agRecount() {
    document.querySelectorAll(".ag-col").forEach(function (col) {
      var cards = col.querySelectorAll(".ag-card"), pts = 0;
      cards.forEach(function (c) { pts += Number(c.dataset.pts || 0); });
      var el = col.querySelector(".ag-col-n"); if (el) el.innerHTML = cards.length + (pts ? ' &middot; ' + pts + ' pts' : '');
    });
  }
  // shared stage-change persistence for drag, keyboard arrows and the move buttons (ORB-07)
  async function agPersistStage(id, newStage) {
    var upd = { board_stage: newStage, is_agile: true, completed_at: newStage === "done" ? new Date().toISOString() : null };
    var r = await sb.from("project_tasks").update(upd).eq("id", id);
    if (r.error) { toast("Move failed: " + errMsg(r.error)); renderBoard(); return false; }
    logTaskActivity(id, AGS.proj, "moved", "to " + agStageLabel(newStage));
    return true;
  }
  function agRelabelCard(card, newStage) {
    card.setAttribute("aria-label", (card.getAttribute("aria-label") || "").replace(/, in .*?\./, ", in " + agStageLabel(newStage) + "."));
  }
  // keyboard/button move: shift a focused card to the adjacent column (the drag alternative)
  async function agMoveCard(id, dir) {
    var card = document.querySelector('.ag-card[data-id="' + id + '"]'); if (!card) return;
    var cur = card.dataset.stage || "backlog", idx = -1;
    for (var i = 0; i < BOARD_STAGES.length; i++) if (BOARD_STAGES[i].key === cur) { idx = i; break; }
    var ni = idx + dir; if (idx < 0 || ni < 0 || ni >= BOARD_STAGES.length) return;
    var newStage = BOARD_STAGES[ni].key;
    var col = document.querySelector('.ag-col-b[data-stage="' + newStage + '"]'); if (!col) return;
    col.appendChild(card); card.dataset.stage = newStage; agRelabelCard(card, newStage); agRecount(); card.focus();
    toast("Moved to " + agStageLabel(newStage));
    await agPersistStage(id, newStage);
  }
  function wireBoardDnD() {
    var dragId = null;
    document.querySelectorAll(".ag-card").forEach(function (c) {
      c.addEventListener("dragstart", function (e) { dragId = c.dataset.id; c.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", c.dataset.id); } catch (x) {} });
      c.addEventListener("dragend", function () { c.classList.remove("dragging"); document.querySelectorAll(".ag-col-b").forEach(function (b) { b.classList.remove("ag-over"); }); });
    });
    document.querySelectorAll(".ag-col-b").forEach(function (col) {
      col.addEventListener("dragover", function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; col.classList.add("ag-over"); });
      col.addEventListener("dragleave", function () { col.classList.remove("ag-over"); });
      col.addEventListener("drop", async function (e) {
        e.preventDefault(); col.classList.remove("ag-over");
        var id = dragId || (e.dataTransfer && e.dataTransfer.getData("text/plain")); if (!id) return;
        var card = document.querySelector('.ag-card[data-id="' + id + '"]'); if (!card) return;
        var newStage = col.dataset.stage; if (card.dataset.stage === newStage && card.parentNode === col) return;
        col.appendChild(card); card.dataset.stage = newStage; agRelabelCard(card, newStage); agRecount();
        await agPersistStage(id, newStage);
      });
    });
  }
  function wireQuickAdd() {
    document.querySelectorAll(".ag-quick-in").forEach(function (inp) {
      inp.addEventListener("keydown", async function (e) {
        if (e.key !== "Enter") return;
        var name = inp.value.trim(); if (!name) return;
        inp.value = ""; inp.disabled = true;
        var row = { company_id: S.company.id, project_id: AGS.proj, name: name, board_stage: inp.dataset.stage, is_agile: true, priority: "medium", sort_order: Math.round(Date.now() / 1000) % 1000000 };
        if (AGS.sprint && AGS.sprint !== "__backlog") row.sprint_id = AGS.sprint;
        if (AGS.member && AGS.member !== "__none") row.assignee_id = AGS.member;
        var r = await sb.from("project_tasks").insert(row).select("id").single();
        inp.disabled = false;
        if (r.error) { toast(errMsg(r.error)); return; }
        logTaskActivity(r.data.id, AGS.proj, "created", name);
        renderBoard();
      });
    });
  }
  // LIST = a checkable, nestable outline. This is also the work breakdown: use + on
  // any row to break a task into sub-tasks; tick the circle to complete it.
  function renderBoardList(body, tasks, ctx) {
    if (!tasks.length) { body.innerHTML = '<div class="ol-wrap"><div class="o-empty2"><div class="o-empty2-t">No tasks yet</div><div class="o-empty2-h">Add your first task below. Then use the + on any row to break it into sub-tasks.</div></div><div class="ag-addwrap" style="max-width:520px;margin:6px auto 0"><input class="ag-add-root" placeholder="+ Add a task and press Enter"></div></div>'; wireOutlineAdd(); return; }
    var childrenOf = {};
    tasks.forEach(function (t) { var p = t.parent_task_id || "__root"; (childrenOf[p] = childrenOf[p] || []).push(t); });
    Object.keys(childrenOf).forEach(function (k) { childrenOf[k].sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0) || ((a.created_at || "") < (b.created_at || "") ? -1 : 1); }); });
    var roots = childrenOf["__root"] || [];
    function counts(t) { var kids = childrenOf[t.id]; if (!kids || !kids.length) return { d: t.board_stage === "done" ? 1 : 0, tt: 1 }; var d = 0, tt = 0; kids.forEach(function (k) { var c = counts(k); d += c.d; tt += c.tt; }); return { d: d, tt: tt }; }
    function rowHtml(t, depth) {
      var kids = childrenOf[t.id] || [], has = kids.length > 0, done = t.board_stage === "done";
      var emp = t.assignee_id ? ctx.empById[t.assignee_id] : null, due = t.date_deadline, over = due && due < today() && !done;
      var cc = has ? counts(t) : null;
      var row = '<div class="ol-row' + (done ? " done" : "") + '" data-id="' + t.id + '" style="padding-left:' + (depth * 24 + 10) + 'px">' +
        (has ? '<span class="ol-caret" data-t="' + t.id + '">&#9662;</span>' : '<span class="ol-caret empty"></span>') +
        '<span class="ol-check' + (done ? " on" : "") + '" data-id="' + t.id + '" title="Mark complete"></span>' +
        '<span class="ol-name">' + esc(t.name) + '</span>' +
        (cc ? '<span class="ol-count" title="Sub-tasks done">' + cc.d + '/' + cc.tt + '</span>' : '') +
        '<span class="ol-meta">' + (t.priority && t.priority !== "medium" ? agPrio(t.priority) : '') + (due ? '<span class="ol-due' + (over ? " over" : "") + '">' + agDate(due) + '</span>' : '') + (emp ? agAvatar(emp, true) : '') + '</span>' +
        '<button class="ol-add" data-parent="' + t.id + '" title="Add a sub-task">+</button></div>';
      return row + (has ? '<div class="ol-children" data-parent="' + t.id + '">' + kids.map(function (k) { return rowHtml(k, depth + 1); }).join("") + '</div>' : '');
    }
    var top = roots.reduce(function (a, t) { var c = counts(t); a.d += c.d; a.tt += c.tt; return a; }, { d: 0, tt: 0 });
    body.innerHTML = '<div class="ol-wrap">' +
      '<div class="ol-top"><b>' + top.d + ' of ' + top.tt + ' done</b><span class="muted"> &middot; tick the circle to complete a task &middot; use + to break work into sub-tasks</span></div>' +
      '<div class="ol-body">' + roots.map(function (r) { return rowHtml(r, 0); }).join("") + '</div>' +
      '<div class="ag-addwrap"><input class="ag-add-root" placeholder="+ Add a task and press Enter"></div></div>';
    body.querySelectorAll(".ol-caret[data-t]").forEach(function (c) { c.onclick = function (e) { e.stopPropagation(); var kids = body.querySelector('.ol-children[data-parent="' + c.dataset.t + '"]'); if (kids) { var open = kids.style.display !== "none"; kids.style.display = open ? "none" : ""; c.innerHTML = open ? "&#9656;" : "&#9662;"; } }; });
    body.querySelectorAll(".ol-check").forEach(function (cb) { cb.onclick = function (e) { e.stopPropagation(); agToggleDone(cb.dataset.id, !cb.classList.contains("on")); }; });
    body.querySelectorAll(".ol-add").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openSubQuickAdd(b.dataset.parent); }; });
    body.querySelectorAll(".ol-row").forEach(function (r) { r.onclick = function (e) { if (e.target.closest(".ol-check") || e.target.closest(".ol-caret[data-t]") || e.target.closest(".ol-add")) return; openTaskPanel(r.dataset.id, AGS.proj); }; });
    wireOutlineAdd();
  }
  function wireOutlineAdd() {
    document.querySelectorAll(".ag-add-root").forEach(function (inp) {
      inp.onkeydown = async function (e) {
        if (e.key !== "Enter") return; var n = inp.value.trim(); if (!n) return; inp.value = ""; inp.disabled = true;
        var row = { company_id: S.company.id, project_id: AGS.proj, name: n, board_stage: "todo", is_agile: true, priority: "medium", sort_order: Math.round(Date.now() / 1000) % 1000000 };
        var r = await sb.from("project_tasks").insert(row).select("id").single(); inp.disabled = false;
        if (r.error) { toast(errMsg(r.error)); return; } logTaskActivity(r.data.id, AGS.proj, "created", n); renderBoard();
      };
    });
  }
  async function agToggleDone(id, done) {
    var upd = { board_stage: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null, is_agile: true };
    var r = await sb.from("project_tasks").update(upd).eq("id", id);
    if (r.error) { toast(errMsg(r.error)); return; }
    logTaskActivity(id, AGS.proj, done ? "completed" : "reopened", "");
    renderBoard();
  }
  function renderSprintsView(body, tasks, sprints, ctx) {
    var cards = sprints.map(function (s) {
      var st = tasks.filter(function (t) { return t.sprint_id === s.id && !t.parent_task_id; });
      var total = st.reduce(function (a, t) { return a + Number(t.points || 0); }, 0);
      var done = st.filter(function (t) { return t.board_stage === "done"; }).reduce(function (a, t) { return a + Number(t.points || 0); }, 0);
      var pct = total ? Math.round(done / total * 100) : 0;
      var daysLeft = s.end_date ? Math.ceil((parseD(s.end_date) - parseD(today())) / 864e5) : null;
      var badge = s.status === "active" ? '<span class="badge paid">Active</span>' : s.status === "done" ? '<span class="badge draft">Done</span>' : '<span class="badge unpaid">Planned</span>';
      return '<div class="ag-sprint"><div class="ag-sprint-h"><div><b>' + esc(s.name) + '</b> ' + badge + '</div><button class="o-filtbtn ag-sp-edit" data-id="' + s.id + '">Edit</button></div>' +
        (s.goal ? '<div class="muted" style="margin:2px 0 8px">' + esc(s.goal) + '</div>' : '') +
        (s.start_date || s.end_date ? '<div class="sub" style="margin-bottom:8px">' + esc(s.start_date || "?") + ' to ' + esc(s.end_date || "?") + '</div>' : '') +
        '<div class="ag-burn"><div class="ag-burn-f" style="width:' + pct + '%"></div></div>' +
        '<div class="ag-sprint-meta"><span>' + st.length + ' tasks</span><span>' + done + ' / ' + total + ' pts</span><span>' + pct + '% done</span>' + (daysLeft != null ? '<span>' + (daysLeft >= 0 ? daysLeft + ' days left' : (-daysLeft) + ' days over') + '</span>' : '') + '</div>' +
        '<div class="ag-sprint-actions"><button class="o-filtbtn ag-sp-open" data-id="' + s.id + '">Open board</button>' + (s.status !== "active" ? '<button class="o-filtbtn ag-sp-start" data-id="' + s.id + '">Start sprint</button>' : '<button class="o-filtbtn ag-sp-done" data-id="' + s.id + '">Complete</button>') + '</div></div>';
    }).join("");
    var backlogN = tasks.filter(function (t) { return !t.sprint_id && !t.parent_task_id; }).length;
    body.innerHTML = '<div style="padding:14px 16px"><div class="ag-sprint-top"><button class="o-new" id="ag-new-sp">+ New sprint</button><span class="muted">Backlog: ' + backlogN + ' unscheduled tasks</span></div>' +
      (sprints.length ? '<div class="ag-sprints">' + cards + '</div>' : '<div class="o-empty2"><div class="o-empty2-t">No sprints yet</div><div class="o-empty2-h">Sprints are optional timeboxes (say two weeks). Create one, drag tasks into it on the board, then Start it to track burndown.</div><button class="o-new" id="ag-new-sp2" style="margin-top:14px">+ New sprint</button></div>') + '</div>';
    var nb = document.getElementById("ag-new-sp"); if (nb) nb.onclick = function () { openSprintModal(null, AGS.proj); };
    var nb2 = document.getElementById("ag-new-sp2"); if (nb2) nb2.onclick = function () { openSprintModal(null, AGS.proj); };
    document.querySelectorAll(".ag-sp-edit").forEach(function (b) { b.onclick = function () { openSprintModal(sprints.filter(function (s) { return s.id === b.dataset.id; })[0], AGS.proj); }; });
    document.querySelectorAll(".ag-sp-open").forEach(function (b) { b.onclick = function () { AGS.sprint = b.dataset.id; AGS.view = "board"; renderBoard(); }; });
    document.querySelectorAll(".ag-sp-start").forEach(function (b) { b.onclick = async function () { await sb.from("sprints").update({ status: "active" }).eq("id", b.dataset.id); toast("Sprint started"); renderBoard(); }; });
    document.querySelectorAll(".ag-sp-done").forEach(function (b) { b.onclick = async function () { await sb.from("sprints").update({ status: "done" }).eq("id", b.dataset.id); toast("Sprint completed"); renderBoard(); }; });
  }
  async function openSprintModal(s, projectId) {
    s = s || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (s.id ? "Edit sprint" : "New sprint") + '</h3><div class="form">' +
      '<div><label>Name</label><input id="sp-name" value="' + esc(s.name || "") + '" placeholder="e.g. Sprint 5 - Level 12 facade"></div>' +
      '<div><label>Goal</label><input id="sp-goal" value="' + esc(s.goal || "") + '" placeholder="What this sprint aims to deliver"></div>' +
      '<div class="row2"><div><label>Start</label><input id="sp-start" type="date" value="' + (s.start_date || "") + '"></div><div><label>End</label><input id="sp-end" type="date" value="' + (s.end_date || "") + '"></div></div>' +
      '<div><label>Status</label><select id="sp-status"><option value="planned">Planned</option><option value="active">Active</option><option value="done">Done</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="sp-cancel">Cancel</button>' + (s.id ? '<button class="btn" id="sp-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="sp-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("sp-status").value = s.status || "planned";
    document.getElementById("sp-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("sp-del"); if (del) del.onclick = async function () { await sb.from("sprints").delete().eq("id", s.id); m.remove(); toast("Deleted"); renderBoard(); };
    document.getElementById("sp-save").onclick = async function () {
      var row = { name: gv("sp-name") || "Sprint", goal: gv("sp-goal"), start_date: gv("sp-start") || null, end_date: gv("sp-end") || null, status: document.getElementById("sp-status").value };
      var r; if (s.id) r = await sb.from("sprints").update(row).eq("id", s.id); else { row.company_id = S.company.id; row.project_id = projectId; r = await sb.from("sprints").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; } m.remove(); renderBoard();
    };
  }

  function stageProgress(stage) { return ({ done: 100, review: 70, in_progress: 40, todo: 10, backlog: 0 })[stage || "backlog"] || 0; }
  function renderBoardTree(body, tasks, ctx) {
    var childrenOf = {};
    tasks.forEach(function (t) { var p = t.parent_task_id || "__root"; (childrenOf[p] = childrenOf[p] || []).push(t); });
    Object.keys(childrenOf).forEach(function (k) { childrenOf[k].sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0) || ((a.created_at || "") < (b.created_at || "") ? -1 : 1); }); });
    var roots = childrenOf["__root"] || [];
    function prog(t) { var kids = childrenOf[t.id]; if (!kids || !kids.length) return stageProgress(t.board_stage); var s = 0; kids.forEach(function (k) { s += prog(k); }); return Math.round(s / kids.length); }
    var totalLeaves = 0, doneLeaves = 0;
    tasks.forEach(function (t) { if (!(childrenOf[t.id] && childrenOf[t.id].length)) { totalLeaves++; if (t.board_stage === "done") doneLeaves++; } });
    var overall = totalLeaves ? Math.round(doneLeaves / totalLeaves * 100) : 0;
    function nodeHtml(t, wbs, depth) {
      var kids = childrenOf[t.id] || [], has = kids.length > 0;
      var emp = t.assignee_id ? ctx.empById[t.assignee_id] : null, p = prog(t);
      var row = '<div class="wbs-row" data-id="' + t.id + '" style="padding-left:' + (depth * 22 + 10) + 'px">' +
        (has ? '<span class="wbs-caret" data-t="' + t.id + '">&#9662;</span>' : '<span class="wbs-caret empty"></span>') +
        '<span class="wbs-no">' + wbs + '</span>' +
        '<span class="wbs-name">' + esc(t.name) + '</span>' +
        '<span class="wbs-mid">' + agPrio(t.priority) + (Number(t.points) ? '<span class="ag-pts">' + Number(t.points) + '</span>' : '') + '</span>' +
        '<span class="wbs-stage">' + esc(agStageLabel(t.board_stage || "backlog")) + '</span>' +
        '<span class="wbs-bar"><span class="wbs-fill" style="width:' + p + '%"></span></span><span class="wbs-pct">' + p + '%</span>' +
        (emp ? agAvatar(emp, true) : '<span class="wbs-un">&ndash;</span>') +
        '<button class="wbs-add" data-parent="' + t.id + '" title="Add sub-activity">+</button></div>';
      var childHtml = has ? '<div class="wbs-children" data-parent="' + t.id + '">' + kids.map(function (k, i) { return nodeHtml(k, wbs + "." + (i + 1), depth + 1); }).join("") + '</div>' : '';
      return row + childHtml;
    }
    var tree = roots.length ? roots.map(function (r, i) { return nodeHtml(r, String(i + 1), 0); }).join("") : '<div class="o-empty2"><div class="o-empty2-t">No activities yet</div><div class="o-empty2-h">Break the work down into activities and sub-activities. Add the first with + Task above, then + on any row to nest work under it.</div></div>';
    body.innerHTML = '<div class="wbs-wrap">' +
      '<div class="wbs-top"><div><b>Work breakdown</b> <span class="muted">' + tasks.length + ' activities &middot; ' + overall + '% complete</span></div>' +
      '<div class="muted" style="font-size:11.5px">Numbered by structure &middot; percent rolls up from the lowest level</div></div>' +
      '<div class="wbs-body">' + tree + '</div></div>';
    body.querySelectorAll(".wbs-caret[data-t]").forEach(function (c) { c.onclick = function (e) { e.stopPropagation(); var kids = body.querySelector('.wbs-children[data-parent="' + c.dataset.t + '"]'); if (kids) { var open = kids.style.display !== "none"; kids.style.display = open ? "none" : ""; c.innerHTML = open ? "&#9656;" : "&#9662;"; } }; });
    body.querySelectorAll(".wbs-row").forEach(function (r) { r.onclick = function (e) { if (e.target.closest(".wbs-add") || e.target.closest(".wbs-caret[data-t]")) return; openTaskPanel(r.dataset.id, AGS.proj, function () { renderBoard(); }); }; });
    body.querySelectorAll(".wbs-add").forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openSubQuickAdd(b.dataset.parent); }; });
  }
  function openSubQuickAdd(parentId) {
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Add sub-activity</h3><div class="form"><div><label>Name</label><input id="wq-name" placeholder="Sub-activity name"></div></div><div class="foot"><button class="btn" id="wq-c">Cancel</button><button class="btn pri" id="wq-s" style="background:var(--accent);border-color:var(--accent)">Add</button></div></div>';
    document.body.appendChild(m); var inp = document.getElementById("wq-name"); inp.focus();
    document.getElementById("wq-c").onclick = function () { m.remove(); };
    async function save() { var n = inp.value.trim(); if (!n) { m.remove(); return; } var r = await sb.from("project_tasks").insert({ company_id: S.company.id, project_id: AGS.proj, name: n, parent_task_id: parentId, board_stage: "backlog", is_agile: true, priority: "medium", sort_order: Math.round(Date.now() / 1000) % 1000000 }); m.remove(); if (r.error) { toast(errMsg(r.error)); } else { toast("Added"); renderBoard(); } }
    document.getElementById("wq-s").onclick = save; inp.onkeydown = function (e) { if (e.key === "Enter") save(); };
  }
  async function openTaskPanel(taskId, projectId, onClose) {
    var isNew = taskId === "new";
    var t = isNew ? { priority: "medium", board_stage: "backlog", points: 0 } : ((await sb.from("project_tasks").select("*").eq("id", taskId).maybeSingle()).data || {});
    projectId = projectId || t.project_id;
    var pre = await Promise.all([
      sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name"),
      sb.from("sprints").select("id,name,status").eq("project_id", projectId).order("sort_order"),
      sb.from("project_tasks").select("id,name").eq("project_id", projectId).eq("is_agile", true),
      isNew ? Promise.resolve({ data: [] }) : sb.from("task_checklists").select("*").eq("task_id", taskId).order("sort_order"),
      isNew ? Promise.resolve({ data: [] }) : sb.from("project_tasks").select("id,name,board_stage,assignee_id").eq("parent_task_id", taskId).order("created_at"),
      isNew ? Promise.resolve({ data: [] }) : sb.from("task_comments").select("*").eq("task_id", taskId).order("created_at"),
      isNew ? Promise.resolve({ data: [] }) : sb.from("task_watchers").select("employee_id").eq("task_id", taskId),
      isNew ? Promise.resolve({ data: [] }) : sb.from("task_activity").select("*").eq("task_id", taskId).order("created_at", { ascending: false }).limit(40)
    ]);
    var emps = pre[0].data || [], sprints = pre[1].data || [], siblings = (pre[2].data || []).filter(function (x) { return x.id !== taskId; });
    var checklist = pre[3].data || [], subtasks = pre[4].data || [], comments = pre[5].data || [], watchers = pre[6].data || [], activity = pre[7].data || [];
    var empById = {}; emps.forEach(function (e) { empById[e.id] = e; });

    var bg = document.createElement("div"); bg.className = "ag-panel-bg";
    function close() { bg.remove(); document.removeEventListener("keydown", onKey); if (onClose) onClose(); else renderBoard(); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    bg.addEventListener("mousedown", function (e) { if (e.target === bg) close(); });

    var empOpts = function (sel) { return '<option value="">Unassigned</option>' + emps.map(function (e) { return '<option value="' + e.id + '"' + (e.id === sel ? " selected" : "") + '>' + esc(e.name) + '</option>'; }).join(""); };
    var stageOpts = BOARD_STAGES.map(function (st) { return '<option value="' + st.key + '"' + ((t.board_stage || "backlog") === st.key ? " selected" : "") + '>' + st.label + '</option>'; }).join("");
    var prioOpts = Object.keys(TASK_PRIO).map(function (k) { return '<option value="' + k + '"' + ((t.priority || "medium") === k ? " selected" : "") + '>' + TASK_PRIO[k].label + '</option>'; }).join("");
    var sprintOpts = '<option value="">Backlog (no sprint)</option>' + sprints.map(function (s) { return '<option value="' + s.id + '"' + (t.sprint_id === s.id ? " selected" : "") + '>' + esc(s.name) + (s.status === "active" ? " (active)" : "") + '</option>'; }).join("");
    var blockOpts = '<option value="">Not blocked</option>' + siblings.map(function (s) { return '<option value="' + s.id + '"' + (t.blocked_by === s.id ? " selected" : "") + '>' + esc(s.name) + '</option>'; }).join("");

    bg.innerHTML = '<div class="ag-panel"><div class="ag-panel-top"><span class="ag-panel-eyebrow">Execution task</span><div class="ag-panel-topbtns">' +
      (isNew ? "" : '<button class="o-filtbtn ag-tp-del">Delete</button>') + '<button class="o-filtbtn pri ag-tp-save">Save</button><button class="ag-panel-x ag-tp-close">&times;</button></div></div>' +
      '<div class="ag-panel-title"><input id="tp-name" value="' + esc(t.name || "") + '" placeholder="Task name"></div>' +
      '<div class="ag-panel-body"><div class="ag-panel-main">' +
      '<div class="ag-fieldlabel">Description</div><textarea id="tp-desc" class="ag-desc" placeholder="What needs to be done, acceptance criteria, links...">' + esc(t.description || "") + '</textarea>' +
      '<div id="tp-collab"></div></div>' +
      '<div class="ag-panel-side">' +
      '<div class="ag-sf"><label>Status</label><select id="tp-stage">' + stageOpts + '</select></div>' +
      '<div class="ag-sf"><label>Assignee</label><select id="tp-assignee">' + empOpts(t.assignee_id) + '</select></div>' +
      '<div class="ag-sf-2"><div class="ag-sf"><label>Priority</label><select id="tp-prio">' + prioOpts + '</select></div><div class="ag-sf"><label>Points</label><input id="tp-points" type="number" step="0.5" min="0" value="' + (Number(t.points) || 0) + '"></div></div>' +
      '<div class="ag-sf"><label>Sprint</label><select id="tp-sprint">' + sprintOpts + '</select></div>' +
      '<div class="ag-sf-2"><div class="ag-sf"><label>Start</label><input id="tp-start" type="date" value="' + (t.date_start || "") + '"></div><div class="ag-sf"><label>Due</label><input id="tp-due" type="date" value="' + (t.date_deadline || "") + '"></div></div>' +
      '<div class="ag-sf"><label>Blocked by</label><select id="tp-block">' + blockOpts + '</select></div>' +
      '<div class="ag-sf"><label>Labels (comma separated)</label><input id="tp-labels" value="' + esc((t.labels || []).join(", ")) + '" placeholder="e.g. fabrication, urgent"></div>' +
      '</div></div></div>';
    document.body.appendChild(bg);

    function paintCollab() {
      var host = document.getElementById("tp-collab");
      if (isNew) { host.innerHTML = '<div class="ag-sec ag-hint">Save this task first to add a checklist, subtasks, comments and watchers.</div>'; return; }
      var doneN = checklist.filter(function (c) { return c.is_done; }).length;
      var clHtml = '<div class="ag-sec"><div class="ag-sec-h">Checklist' + (checklist.length ? ' <span class="muted">' + doneN + '/' + checklist.length + '</span>' : '') + '</div>' +
        (checklist.length ? '<div class="ag-cl-bar"><div class="ag-cl-fill" style="width:' + (checklist.length ? Math.round(doneN / checklist.length * 100) : 0) + '%"></div></div>' : '') +
        checklist.map(function (c) { return '<div class="ag-check"><label><input type="checkbox" class="tp-cl-tog" data-id="' + c.id + '"' + (c.is_done ? " checked" : "") + '><span' + (c.is_done ? ' class="done"' : '') + '>' + esc(c.title) + '</span></label><button class="ag-x tp-cl-del" data-id="' + c.id + '">&times;</button></div>'; }).join("") +
        '<div class="ag-add-row"><input id="tp-cl-new" class="ag-add-in" placeholder="+ Add checklist item"></div></div>';
      var subHtml = '<div class="ag-sec"><div class="ag-sec-h">Subtasks' + (subtasks.length ? ' <span class="muted">' + subtasks.length + '</span>' : '') + '</div>' +
        subtasks.map(function (s) { var e = s.assignee_id ? empById[s.assignee_id] : null; return '<div class="ag-sub tp-sub-open" data-id="' + s.id + '"><span class="ag-sub-dot' + (s.board_stage === "done" ? " done" : "") + '"></span><span class="ag-sub-t">' + esc(s.name) + '</span>' + (e ? agAvatar(e, true) : '') + '</div>'; }).join("") +
        '<div class="ag-add-row"><input id="tp-sub-new" class="ag-add-in" placeholder="+ Add subtask"></div></div>';
      var wTags = watchers.map(function (w) { var e = empById[w.employee_id]; return e ? '<span class="ag-wtag">' + esc(e.name) + '<button class="ag-x tp-w-del" data-id="' + w.employee_id + '">&times;</button></span>' : ""; }).join("");
      var wAdd = '<select id="tp-w-add" class="ag-add-in"><option value="">+ Add watcher</option>' + emps.filter(function (e) { return !watchers.some(function (w) { return w.employee_id === e.id; }); }).map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + '</option>'; }).join("") + '</select>';
      var wHtml = '<div class="ag-sec"><div class="ag-sec-h">Watchers</div><div class="ag-wtags">' + (wTags || '<span class="muted" style="font-size:12.5px">No one is following this task yet.</span>') + '</div>' + wAdd + '</div>';
      var mchips = emps.slice(0, 10).map(function (e) { return '<button class="ag-mchip" data-name="' + esc(e.name) + '">@' + esc(e.name.split(/\s+/)[0]) + '</button>'; }).join("");
      var cHtml = '<div class="ag-sec"><div class="ag-sec-h">Comments</div>' +
        (comments.length ? comments.map(function (c) { return '<div class="ag-comment"><div class="ag-comment-h"><b>' + esc(c.author_name || "Team") + '</b> <span class="muted">' + agWhen(c.created_at) + '</span></div><div class="ag-comment-b">' + agBody(c.body) + '</div></div>'; }).join("") : '<div class="muted" style="font-size:12.5px;margin-bottom:8px">No comments yet.</div>') +
        '<div class="ag-comment-new"><textarea id="tp-comment" placeholder="Write a comment. Use @ to mention a teammate."></textarea>' + (mchips ? '<div class="ag-mchips">' + mchips + '</div>' : '') + '<button class="o-filtbtn pri" id="tp-comment-post">Comment</button></div></div>';
      var aHtml = activity.length ? '<div class="ag-sec"><div class="ag-sec-h">Activity</div>' + activity.map(function (a) { return '<div class="ag-act"><span class="ag-act-dot"></span><span>' + esc(a.actor_name || "Team") + ' <b>' + esc(a.verb) + '</b> ' + esc(a.detail || "") + ' <span class="muted">&middot; ' + agWhen(a.created_at) + '</span></span></div>'; }).join("") + '</div>' : "";
      host.innerHTML = clHtml + subHtml + wHtml + cHtml + aHtml;
      wireCollab();
    }
    function wireCollab() {
      if (isNew) return;
      document.querySelectorAll(".tp-cl-tog").forEach(function (x) { x.onclick = async function () { var it = checklist.filter(function (c) { return c.id === x.dataset.id; })[0]; it.is_done = x.checked; await sb.from("task_checklists").update({ is_done: x.checked }).eq("id", x.dataset.id); paintCollab(); }; });
      document.querySelectorAll(".tp-cl-del").forEach(function (x) { x.onclick = async function () { await sb.from("task_checklists").delete().eq("id", x.dataset.id); checklist = checklist.filter(function (c) { return c.id !== x.dataset.id; }); paintCollab(); }; });
      var cln = document.getElementById("tp-cl-new"); if (cln) cln.onkeydown = async function (e) { if (e.key !== "Enter") return; var v = cln.value.trim(); if (!v) return; cln.value = ""; var ins = await sb.from("task_checklists").insert({ company_id: S.company.id, task_id: taskId, title: v, sort_order: (checklist.length + 1) * 10 }).select("*").single(); if (ins.error) { toast(errMsg(ins.error)); return; } checklist.push(ins.data); paintCollab(); document.getElementById("tp-cl-new").focus(); };
      var subn = document.getElementById("tp-sub-new"); if (subn) subn.onkeydown = async function (e) { if (e.key !== "Enter") return; var v = subn.value.trim(); if (!v) return; subn.value = ""; var ins = await sb.from("project_tasks").insert({ company_id: S.company.id, project_id: projectId, name: v, parent_task_id: taskId, is_agile: true, board_stage: "backlog", priority: "medium" }).select("id,name,board_stage,assignee_id").single(); if (ins.error) { toast(errMsg(ins.error)); return; } subtasks.push(ins.data); logTaskActivity(taskId, projectId, "added subtask", v); paintCollab(); document.getElementById("tp-sub-new").focus(); };
      document.querySelectorAll(".tp-sub-open").forEach(function (r) { r.onclick = function () { close(); setTimeout(function () { openTaskPanel(r.dataset.id, projectId); }, 60); }; });
      document.querySelectorAll(".tp-w-del").forEach(function (x) { x.onclick = async function () { await sb.from("task_watchers").delete().eq("task_id", taskId).eq("employee_id", x.dataset.id); watchers = watchers.filter(function (w) { return w.employee_id !== x.dataset.id; }); paintCollab(); }; });
      var wadd = document.getElementById("tp-w-add"); if (wadd) wadd.onchange = async function () { if (!wadd.value) return; var eid = wadd.value; var ins = await sb.from("task_watchers").insert({ company_id: S.company.id, task_id: taskId, employee_id: eid }); if (ins.error) { toast(errMsg(ins.error)); return; } watchers.push({ employee_id: eid }); paintCollab(); };
      document.querySelectorAll(".ag-mchip").forEach(function (b) { b.onclick = function () { var ta = document.getElementById("tp-comment"); ta.value = (ta.value + (ta.value && !/\s$/.test(ta.value) ? " " : "") + "@" + b.dataset.name.split(/\s+/)[0] + " ").replace(/^\s+/, ""); ta.focus(); }; });
      var cp = document.getElementById("tp-comment-post"); if (cp) cp.onclick = async function () { var ta = document.getElementById("tp-comment"); var v = ta.value.trim(); if (!v) return; cp.disabled = true; var mids = agResolveMentions(v, emps); var who = await agActor(); var ins = await sb.from("task_comments").insert({ company_id: S.company.id, task_id: taskId, project_id: projectId, body: v, author_name: who, mentions: mids }).select("*").single(); cp.disabled = false; if (ins.error) { toast(errMsg(ins.error)); return; } comments.push(ins.data); mids.forEach(function (mid) { notify({ kind: "mention", employee_id: mid, title: who + " mentioned you", body: v.slice(0, 120), link_action: "task", link_id: taskId }); }); paintCollab(); };
    }
    paintCollab();

    document.querySelector(".ag-tp-close").onclick = close;
    var delb = document.querySelector(".ag-tp-del"); if (delb) delb.onclick = async function () { if (!confirm("Delete this task and its checklist, subtasks and comments?")) return; await sb.from("project_tasks").delete().eq("id", taskId); toast("Task deleted"); close(); };
    document.querySelector(".ag-tp-save").onclick = async function () {
      var name = gv("tp-name"); if (!name) { toast("Task name required"); return; }
      var newStage = document.getElementById("tp-stage").value, newAssignee = document.getElementById("tp-assignee").value || null, newPrio = document.getElementById("tp-prio").value;
      var row = { name: name, description: document.getElementById("tp-desc").value, board_stage: newStage, assignee_id: newAssignee, priority: newPrio, points: parseFloat(gv("tp-points")) || 0, sprint_id: document.getElementById("tp-sprint").value || null, date_start: gv("tp-start") || null, date_deadline: gv("tp-due") || null, blocked_by: document.getElementById("tp-block").value || null, labels: gv("tp-labels").split(",").map(function (s) { return s.trim(); }).filter(Boolean), is_agile: true, completed_at: newStage === "done" ? (t.completed_at || new Date().toISOString()) : null };
      if (isNew) {
        row.company_id = S.company.id; row.project_id = projectId;
        var ins = await sb.from("project_tasks").insert(row).select("id").single();
        if (ins.error) { toast(errMsg(ins.error)); return; }
        logTaskActivity(ins.data.id, projectId, "created", name);
        if (newAssignee) notify({ kind: "assignment", employee_id: newAssignee, title: "You were assigned a task", body: name, link_action: "task", link_id: ins.data.id });
        toast("Task created"); bg.remove(); document.removeEventListener("keydown", onKey); openTaskPanel(ins.data.id, projectId, onClose); return;
      }
      var r = await sb.from("project_tasks").update(row).eq("id", taskId);
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      if ((newAssignee || null) !== (t.assignee_id || null)) { logTaskActivity(taskId, projectId, "assigned", newAssignee ? ("to " + (empById[newAssignee] ? empById[newAssignee].name : "someone")) : "unassigned"); if (newAssignee) notify({ kind: "assignment", employee_id: newAssignee, title: "You were assigned a task", body: name, link_action: "task", link_id: taskId }); }
      if (newStage !== (t.board_stage || "backlog")) logTaskActivity(taskId, projectId, "moved", "to " + agStageLabel(newStage));
      if (newPrio !== (t.priority || "medium")) logTaskActivity(taskId, projectId, "set priority", TASK_PRIO[newPrio].label);
      toast("Saved"); close();
    };
  }

  async function renderMyWork(empId) {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("My Work") + '<div class="gap"></div><select id="mw-emp" class="o-filtbtn"></select></div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var sel = document.getElementById("mw-emp");
    if (empId === undefined) empId = AGS.member || (emps[0] && emps[0].id) || "";
    sel.innerHTML = '<option value="">Pick a team member</option>' + emps.map(function (e) { return '<option value="' + e.id + '"' + (empId === e.id ? " selected" : "") + '>' + esc(e.name) + '</option>'; }).join("");
    sel.onchange = function () { renderMyWork(sel.value); };
    var body = document.getElementById("o-body");
    if (!empId) { body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">Pick a team member</div><div class="o-empty2-h">See every task assigned to a person across all projects, grouped by stage.</div></div>'; return; }
    var tasks = (await sb.from("project_tasks").select("*, projects(name)").eq("assignee_id", empId).eq("is_agile", true).order("date_deadline", { ascending: true, nullsFirst: false })).data || [];
    if (!tasks.length) { body.innerHTML = '<div class="o-empty2"><div class="o-empty2-t">Nothing assigned</div><div class="o-empty2-h">This person has no execution tasks yet. Assign them work from any project board.</div></div>'; return; }
    var open = tasks.filter(function (t) { return t.board_stage !== "done"; }), doneN = tasks.length - open.length;
    var groups = [["todo", "To do"], ["in_progress", "In progress"], ["review", "Review"], ["backlog", "Backlog"]].map(function (g) {
      var gt = open.filter(function (t) { return (t.board_stage || "backlog") === g[0]; });
      if (!gt.length) return "";
      return '<div class="ag-mw-g"><div class="ag-mw-gh">' + g[1] + ' <span class="muted">' + gt.length + '</span></div>' + gt.map(function (t) {
        var over = t.date_deadline && t.date_deadline < today();
        return '<div class="ag-mw-row" data-id="' + t.id + '" data-proj="' + t.project_id + '"><div class="ag-mw-t"><b>' + esc(t.name) + '</b><span class="muted"> &middot; ' + esc(t.projects ? t.projects.name : "") + '</span></div><div class="ag-mw-r">' + agPrio(t.priority) + (t.date_deadline ? '<span class="ag-due' + (over ? " over" : "") + '">' + agDate(t.date_deadline) + '</span>' : '') + '</div></div>';
      }).join("") + '</div>';
    }).join("");
    body.innerHTML = '<div style="padding:14px 16px"><div class="ag-mw-sum">' + open.length + ' open &middot; ' + doneN + ' done</div>' + (groups || '<div class="muted">All assigned work is done.</div>') + '</div>';
    document.querySelectorAll(".ag-mw-row").forEach(function (r) { r.onclick = function () { AGS.proj = r.dataset.proj; openTaskPanel(r.dataset.id, r.dataset.proj, function () { renderMyWork(empId); }); }; });
  }

  // ============================ SALES: PRICELISTS ============================
  function cfgPricelists() {
    return {
      title: "Pricelists", pageSize: 80,
      fetch: function () { return sb.from("pricelists").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (p) { return (p.name || "") + " " + (p.currency_code || ""); },
      columns: [
        { label: "Name", get: function (p) { return '<b>' + esc(p.name) + '</b>'; } },
        { label: "Currency", get: function (p) { return esc(p.currency_code || S.company.currency_code); } },
        { label: "Active", get: function (p) { return p.is_active ? '<span class="badge paid">Active</span>' : '<span class="badge draft">Archived</span>'; } }
      ],
      onOpen: function (p) { renderPricelistForm(p.id); }, onNew: function () { renderPricelistForm("new"); }
    };
  }
  async function renderPricelistForm(id) {
    var parent = { action: "sale.pricelists", title: "Pricelists" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var p = id === "new" ? { is_active: true, currency_code: S.company.currency_code } : (await sb.from("pricelists").select("*").eq("id", id).maybeSingle()).data || {};
    var items = id === "new" ? [] : (await sb.from("pricelist_items").select("*").eq("pricelist_id", id).order("sequence")).data || [];
    var products = (await sb.from("products").select("id,name,default_code,list_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (p.name || "Pricelist");
    function prodOpts(sel) { return '<option value="">(any product)</option>' + products.map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? " selected" : "") + '>' + esc((x.default_code ? x.default_code + " " : "") + x.name) + '</option>'; }).join(""); }
    function rowHtml(l) { l = l || {}; return '<tr><td><select class="pi-prod">' + prodOpts(l.product_id) + '</select></td><td><input class="pi-min" type="number" step="0.01" value="' + (l.min_qty || 1) + '" style="width:70px;text-align:right"></td><td><input class="pi-fixed" type="number" step="0.01" value="' + (l.fixed_price != null ? l.fixed_price : "") + '" placeholder="fixed" style="width:90px;text-align:right"></td><td><input class="pi-off" type="number" step="0.01" value="' + (l.percent_off || 0) + '" style="width:70px;text-align:right"></td><td><button class="pi-del" style="border:none;background:none;color:var(--bad);cursor:pointer;font-size:16px">&times;</button></td></tr>'; }
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pl-save">Save</button><button id="pl-discard">Discard</button></div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="pl-name" value="' + esc(p.name || "") + '" placeholder="Pricelist name"></div>' +
      '<div class="o-groups"><div>' + fld("Currency", '<input id="pl-cur" value="' + esc(p.currency_code || S.company.currency_code) + '">', "Currency this pricelist prices in.") + '</div><div>' + fld("Active", '<select id="pl-active"><option value="1"' + (p.is_active !== false ? " selected" : "") + '>Active</option><option value="0"' + (p.is_active === false ? " selected" : "") + '>Archived</option></select>') + '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Price rules</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Product</th><th style="text-align:right">Min qty</th><th style="text-align:right">Fixed price</th><th style="text-align:right">% off</th><th></th></tr></thead><tbody id="pl-lines">' + (items.length ? items.map(rowHtml).join("") : rowHtml()) + '</tbody></table><button id="pl-add" class="o-addln">+ Add rule</button></div></div>' +
      '<div class="sub" style="margin:8px 0">A rule sets either a fixed price or a % discount off the product list price. Assign a pricelist to a customer on their contact card; it then prices their sales order lines.</div>' +
      '</div>';
    document.getElementById("pl-discard").onclick = function () { go("sale.pricelists"); };
    function wireDel() { document.querySelectorAll("#pl-lines .pi-del").forEach(function (x) { x.onclick = function () { x.closest("tr").remove(); }; }); }
    wireDel();
    document.getElementById("pl-add").onclick = function () { document.getElementById("pl-lines").insertAdjacentHTML("beforeend", rowHtml()); wireDel(); };
    document.getElementById("pl-save").onclick = async function () {
      var row = { name: gv("pl-name") || "Pricelist", currency_code: gv("pl-cur") || S.company.currency_code, is_active: document.getElementById("pl-active").value === "1" };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("pricelists").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return; } sid = ins.data.id; }
      else { if ((await sb.from("pricelists").update(row).eq("id", id)).error) { toast("Save failed"); return; } }
      await sb.from("pricelist_items").delete().eq("pricelist_id", sid);
      var its = [].map.call(document.querySelectorAll("#pl-lines tr"), function (tr, i) { var fx = tr.querySelector(".pi-fixed").value; return { company_id: S.company.id, pricelist_id: sid, product_id: tr.querySelector(".pi-prod").value || null, min_qty: parseFloat(tr.querySelector(".pi-min").value) || 1, fixed_price: fx === "" ? null : parseFloat(fx), percent_off: parseFloat(tr.querySelector(".pi-off").value) || 0, sequence: (i + 1) * 10 }; }).filter(function (l) { return l.product_id || l.fixed_price != null || l.percent_off; });
      if (its.length) { var ir = await sb.from("pricelist_items").insert(its); if (ir.error) { toast(errMsg(ir.error)); return; } }
      toast("Saved"); renderPricelistForm(sid);
    };
  }

  // ============================ SALES: QUOTATION TEMPLATES ============================
  function cfgQuoteTemplates() {
    return {
      title: "Quotation Templates", pageSize: 80,
      fetch: function () { return sb.from("quote_templates").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (t) { return (t.name || ""); },
      columns: [{ label: "Name", get: function (t) { return '<b>' + esc(t.name) + '</b>'; } }, { label: "Note", get: function (t) { return '<span class="muted">' + esc((t.note || "").slice(0, 70)) + '</span>'; } }],
      onOpen: function (t) { renderQuoteTemplateForm(t.id); }, onNew: function () { renderQuoteTemplateForm("new"); }
    };
  }
  async function renderQuoteTemplateForm(id) {
    var parent = { action: "sale.qtempl", title: "Quotation Templates" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var t = id === "new" ? {} : (await sb.from("quote_templates").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("quote_template_lines").select("*").eq("template_id", id).order("sequence")).data || [];
    var products = (await sb.from("products").select("id,name,default_code,list_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (t.name || "Template");
    function prodOpts(sel) { return '<option value="">(free text)</option>' + products.map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? " selected" : "") + '>' + esc((x.default_code ? x.default_code + " " : "") + x.name) + '</option>'; }).join(""); }
    function rowHtml(l) { l = l || {}; return '<tr><td><select class="qt-prod">' + prodOpts(l.product_id) + '</select></td><td><input class="qt-name" value="' + esc(l.name || "") + '" placeholder="Description"></td><td><input class="qt-qty" type="number" step="0.01" value="' + (l.quantity || 1) + '" style="width:64px;text-align:right"></td><td><input class="qt-price" type="number" step="0.01" value="' + (l.unit_price || 0) + '" style="width:90px;text-align:right"></td><td><button class="qt-del" style="border:none;background:none;color:var(--bad);cursor:pointer;font-size:16px">&times;</button></td></tr>'; }
    var btns = '<button class="pri" id="qt-save">Save</button><button id="qt-discard">Discard</button>' + (id !== "new" ? '<button id="qt-quote">Create quotation</button>' : '');
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="qt-tname" value="' + esc(t.name || "") + '" placeholder="Template name"></div>' +
      fld("Note", '<input id="qt-note" value="' + esc(t.note || "") + '" placeholder="Optional note shown on the quote">') +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Template lines</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Product</th><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit price</th><th></th></tr></thead><tbody id="qt-lines">' + (lines.length ? lines.map(rowHtml).join("") : rowHtml()) + '</tbody></table><button id="qt-add" class="o-addln">+ Add line</button></div></div>' +
      '</div>';
    document.getElementById("qt-discard").onclick = function () { go("sale.qtempl"); };
    document.querySelectorAll("#qt-lines .qt-prod").forEach(function (s) { s.onchange = function () { var pr = products.filter(function (x) { return x.id === s.value; })[0]; if (pr) { var tr = s.closest("tr"); if (!tr.querySelector(".qt-name").value) tr.querySelector(".qt-name").value = pr.name; if (!Number(tr.querySelector(".qt-price").value)) tr.querySelector(".qt-price").value = pr.list_price || 0; } }; });
    function wireDel() { document.querySelectorAll("#qt-lines .qt-del").forEach(function (x) { x.onclick = function () { x.closest("tr").remove(); }; }); }
    wireDel();
    document.getElementById("qt-add").onclick = function () { document.getElementById("qt-lines").insertAdjacentHTML("beforeend", rowHtml()); wireDel(); };
    function readLines() { return [].map.call(document.querySelectorAll("#qt-lines tr"), function (tr, i) { return { product_id: tr.querySelector(".qt-prod").value || null, name: tr.querySelector(".qt-name").value || "", quantity: parseFloat(tr.querySelector(".qt-qty").value) || 1, unit_price: parseFloat(tr.querySelector(".qt-price").value) || 0, sequence: (i + 1) * 10 }; }).filter(function (l) { return l.name || l.product_id; }); }
    async function persist() {
      var row = { name: gv("qt-tname") || "Template", note: gv("qt-note") };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("quote_templates").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("quote_templates").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      await sb.from("quote_template_lines").delete().eq("template_id", sid);
      var ls = readLines().map(function (l) { l.company_id = S.company.id; l.template_id = sid; return l; });
      if (ls.length) { var ir = await sb.from("quote_template_lines").insert(ls); if (ir.error) { toast(errMsg(ir.error)); return null; } }
      return sid;
    }
    document.getElementById("qt-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderQuoteTemplateForm(sid); } };
    var q = document.getElementById("qt-quote"); if (q) q.onclick = async function () {
      var sid = await persist(); if (!sid) return;
      var tl = readLines();
      var hdr = { company_id: S.company.id, number: await nextOrderNumber("sale"), partner_id: null, state: "draft", date_order: today(), currency_code: S.company.currency_code, amount_untaxed: 0, amount_total: 0, note: "From template: " + (gv("qt-tname") || "") };
      var so = await sb.from("sale_orders").insert(hdr).select("id").single();
      if (so.error) { toast(errMsg(so.error)); return; }
      var sub = 0, ln = tl.map(function (l, i) { sub += l.quantity * l.unit_price; return { company_id: S.company.id, order_id: so.data.id, product_id: l.product_id, name: l.name || "Item", quantity: l.quantity, unit_price: l.unit_price, price_subtotal: l.quantity * l.unit_price, sequence: (i + 1) * 10 }; });
      if (ln.length) await sb.from("sale_order_lines").insert(ln);
      await sb.from("sale_orders").update({ amount_untaxed: sub, amount_total: sub }).eq("id", so.data.id);
      toast("Quotation created"); renderOrderForm(so.data.id, "sale");
    };
  }

  // ============================ FIXED ASSETS & DEPRECIATION ============================
  function cfgAssets() {
    return {
      title: "Assets", pageSize: 80,
      fetch: function () { return sb.from("assets").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (a) { return (a.number || "") + " " + (a.name || "") + " " + (a.category || ""); },
      columns: [
        { label: "Number", get: function (a) { return '<b>' + esc(a.number || "/") + '</b>'; } },
        { label: "Asset", get: function (a) { return esc(a.name); } },
        { label: "Category", get: function (a) { return esc(a.category || ""); } },
        { label: "Value", num: true, get: function (a) { return money(a.acquisition_value); } },
        { label: "Life", get: function (a) { return (a.life_months || 0) + " mo"; } },
        { label: "Status", get: function (a) { return a.state === "running" ? '<span class="badge partial">Running</span>' : a.state === "closed" ? '<span class="badge paid">Closed</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Running", test: function (a) { return a.state === "running"; } }, { label: "Draft", test: function (a) { return a.state === "draft"; } }, { label: "Closed", test: function (a) { return a.state === "closed"; } }],
      groupBy: [{ label: "Category", get: function (a) { return a.category || "None"; } }, { label: "Status", get: function (a) { return a.state; } }],
      onOpen: function (a) { renderAssetForm(a.id); }, onNew: function () { renderAssetForm("new"); }
    };
  }
  function assetSchedule(asset) {
    var val = Number(asset.acquisition_value || 0), sal = Number(asset.salvage_value || 0), life = parseInt(asset.life_months, 10) || 1;
    var depreciable = Math.max(0, val - sal), per = depreciable / life;
    var start = parseD(asset.start_date || asset.acquisition_date) || new Date();
    var out = [], cum = 0;
    for (var i = 0; i < life; i++) {
      var d = new Date(start.getFullYear(), start.getMonth() + i, Math.min(start.getDate(), 28));
      var amt = (i === life - 1) ? (depreciable - cum) : per;
      cum += amt;
      out.push({ seq: i + 1, line_date: fmtD(d), depreciation: Math.round(amt * 100) / 100, cumulative: Math.round(cum * 100) / 100, book_value: Math.round((val - cum) * 100) / 100 });
    }
    return out;
  }
  async function renderAssetForm(id) {
    var parent = { action: "assets.list", title: "Assets" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var a = id === "new" ? { state: "draft", method: "linear", life_months: 60, asset_account: "2100", depr_account: "2800", expense_account: "6800", acquisition_date: today() } : (await sb.from("assets").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("asset_lines").select("*").eq("asset_id", id).order("seq")).data || [];
    var cc = S.company.currency_code, running = a.state === "running", closed = a.state === "closed", dis = (running || closed) ? " disabled" : "";
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (a.number || a.name || "Asset");
    var postedTot = lines.filter(function (l) { return l.posted; }).reduce(function (s, l) { return s + Number(l.depreciation || 0); }, 0);
    var bookNow = Number(a.acquisition_value || 0) - postedTot;
    var dueCount = lines.filter(function (l) { return !l.posted && parseD(l.line_date) <= new Date(); }).length;
    var btns = closed ? "" : '<button class="pri" id="as-save">Save</button><button id="as-discard">Discard</button>';
    if (id !== "new" && a.state === "draft") btns += '<button id="as-confirm">Confirm &amp; schedule</button>';
    if (id !== "new" && running) btns += '<button id="as-post">Post depreciation' + (dueCount ? " (" + dueCount + " due)" : "") + '</button><button id="as-close">Close</button>';
    var stages = '<div class="o-stages"><span class="st ' + (a.state === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (running ? "on" : (closed ? "done" : "")) + '">Running</span><span class="st ' + (closed ? "on" : "") + '">Closed</span></div>';
    var smart = '<div class="o-smart"><button class="sb" style="cursor:default"><span class="v">' + cc + " " + money(a.acquisition_value) + '</span><span class="k">Cost</span></button><button class="sb" style="cursor:default"><span class="v">' + cc + " " + money(postedTot) + '</span><span class="k">Depreciated</span></button><button class="sb" style="cursor:default"><span class="v">' + cc + " " + money(bookNow) + '</span><span class="k">Book value</span></button></div>';
    var sched = lines.length ? lines : assetSchedule(a);
    var schedRows = sched.map(function (l) { return '<tr' + (l.posted ? ' style="opacity:.6"' : '') + '><td class="muted">' + esc(l.line_date) + '</td><td class="num">' + money(l.depreciation) + '</td><td class="num">' + money(l.cumulative) + '</td><td class="num">' + money(l.book_value) + '</td><td>' + (l.posted ? '<span class="badge paid">Posted</span>' : (parseD(l.line_date) <= new Date() ? '<span class="badge partial">Due</span>' : '<span class="muted">Scheduled</span>')) + '</td></tr>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title"><input id="as-name" value="' + esc(a.name || "") + '" placeholder="Asset name"' + dis + '></div>' +
      '<div class="o-groups"><div>' +
      fld("Category", '<input id="as-cat" value="' + esc(a.category || "") + '"' + dis + ' placeholder="e.g. Plant, Vehicles, IT">', "Grouping for reporting.") +
      fld("Acquisition value", '<input id="as-val" type="number" step="0.01" value="' + (a.acquisition_value || 0) + '"' + dis + '>', "Purchase cost of the asset.") +
      fld("Salvage value", '<input id="as-sal" type="number" step="0.01" value="' + (a.salvage_value || 0) + '"' + dis + '>', "Residual value at end of life; not depreciated.") +
      fld("Useful life (months)", '<input id="as-life" type="number" step="1" value="' + (a.life_months || 60) + '"' + dis + '>', "Months to depreciate over.") +
      '</div><div>' +
      fld("Acquisition date", '<input id="as-acq" type="date" value="' + (a.acquisition_date || today()) + '"' + dis + '>', "When it was bought.") +
      fld("Depreciation start", '<input id="as-start" type="date" value="' + (a.start_date || a.acquisition_date || today()) + '"' + dis + '>', "First depreciation date.") +
      fld("Expense account", '<input id="as-exp" value="' + esc(a.expense_account || "6800") + '"' + dis + '>', "Depreciation expense account (P&L).") +
      fld("Accum. depreciation", '<input id="as-depr" value="' + esc(a.depr_account || "2800") + '"' + dis + '>', "Accumulated depreciation account (contra-asset).") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Depreciation schedule</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Date</th><th style="text-align:right">Depreciation</th><th style="text-align:right">Cumulative</th><th style="text-align:right">Book value</th><th>Status</th></tr></thead><tbody>' + (schedRows || '<tr><td colspan="5" class="muted">Fill in value + life; Confirm to lock the schedule.</td></tr>') + '</tbody></table></div></div>' +
      '</div>';
    var db = document.getElementById("as-discard"); if (db) db.onclick = function () { go("assets.list"); };
    async function persist() {
      var row = { name: gv("as-name") || "Asset", category: gv("as-cat"), acquisition_value: parseFloat(gv("as-val")) || 0, salvage_value: parseFloat(gv("as-sal")) || 0, life_months: parseInt(gv("as-life"), 10) || 60, acquisition_date: gv("as-acq") || null, start_date: gv("as-start") || null, expense_account: gv("as-exp") || "6800", depr_account: gv("as-depr") || "2800" };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.state = "draft"; row.number = await nextDocNumber("assets", "FA"); var ins = await sb.from("assets").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("assets").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    var sv = document.getElementById("as-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderAssetForm(sid); } };
    var cf = document.getElementById("as-confirm"); if (cf) cf.onclick = async function () {
      var sid = await persist(); if (!sid) return;
      var fresh = (await sb.from("assets").select("*").eq("id", sid).maybeSingle()).data;
      var sc = assetSchedule(fresh).map(function (l) { l.company_id = S.company.id; l.asset_id = sid; return l; });
      await sb.from("asset_lines").delete().eq("asset_id", sid);
      if (sc.length) { var ir = await sb.from("asset_lines").insert(sc); if (ir.error) { toast(errMsg(ir.error)); return; } }
      await sb.from("assets").update({ state: "running" }).eq("id", sid);
      toast("Scheduled over " + sc.length + " months"); renderAssetForm(sid);
    };
    var pp = document.getElementById("as-post"); if (pp) pp.onclick = async function () {
      var duel = lines.filter(function (l) { return !l.posted && parseD(l.line_date) <= new Date(); });
      if (!duel.length) { toast("Nothing due to post"); return; }
      var n = 0;
      for (var i = 0; i < duel.length; i++) {
        var l = duel[i];
        var eid = await postRetentionEntry(a.expense_account || "6800", a.depr_account || "2800", Number(l.depreciation || 0), "Depreciation " + (a.number || "") + " - " + (a.name || ""), a.id, "depreciation");
        await sb.from("asset_lines").update({ posted: true, journal_entry_id: eid || null }).eq("id", l.id); n++;
      }
      toast("Posted " + n + " depreciation " + (n === 1 ? "entry" : "entries")); renderAssetForm(id);
    };
    var cl = document.getElementById("as-close"); if (cl) cl.onclick = async function () { await sb.from("assets").update({ state: "closed" }).eq("id", id); toast("Closed"); renderAssetForm(id); };
  }

  // ============================ BUDGETS ============================
  function cfgBudgets() {
    return {
      title: "Budgets", pageSize: 80,
      fetch: function () { return sb.from("budgets").select("*").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (b) { return (b.name || ""); },
      columns: [
        { label: "Name", get: function (b) { return '<b>' + esc(b.name) + '</b>'; } },
        { label: "From", get: function (b) { return '<span class="muted">' + esc(b.date_start || "") + '</span>'; } },
        { label: "To", get: function (b) { return '<span class="muted">' + esc(b.date_end || "") + '</span>'; } }
      ],
      onOpen: function (b) { renderBudgetForm(b.id); }, onNew: function () { renderBudgetForm("new"); }
    };
  }
  async function renderBudgetForm(id) {
    var parent = { action: "budget.list", title: "Budgets" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var yr = new Date().getFullYear();
    var b = id === "new" ? { date_start: yr + "-01-01", date_end: yr + "-12-31" } : (await sb.from("budgets").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("budget_lines").select("*").eq("budget_id", id).order("sequence")).data || [];
    var accts = (await sb.from("accounts").select("code,name").eq("company_id", S.company.id).order("code")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (b.name || "Budget");
    function acctOpts(sel) { return accts.map(function (x) { return '<option value="' + x.code + '"' + (x.code === sel ? " selected" : "") + '>' + esc(x.code + " " + x.name) + '</option>'; }).join(""); }
    function rowHtml(l) { l = l || {}; return '<tr><td><select class="bl-acc">' + acctOpts(l.account_code) + '</select></td><td><input class="bl-lbl" value="' + esc(l.label || "") + '" placeholder="Note"></td><td><input class="bl-amt" type="number" step="0.01" value="' + (l.planned || 0) + '" style="text-align:right"></td><td><button class="bl-del" style="border:none;background:none;color:var(--bad);cursor:pointer;font-size:16px">&times;</button></td></tr>'; }
    var btns = '<button class="pri" id="bg-save">Save</button><button id="bg-discard">Discard</button>' + (id !== "new" ? '<button id="bg-report">Budget vs actual</button>' : '');
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="bg-name" value="' + esc(b.name || "") + '" placeholder="Budget name (e.g. 2026 Operating)"></div>' +
      '<div class="o-groups"><div>' + fld("From", '<input id="bg-start" type="date" value="' + (b.date_start || "") + '">', "Budget period start.") + '</div><div>' + fld("To", '<input id="bg-end" type="date" value="' + (b.date_end || "") + '">', "Budget period end.") + '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Budget lines</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Account</th><th>Note</th><th style="text-align:right">Planned</th><th></th></tr></thead><tbody id="bg-lines">' + (lines.length ? lines.map(rowHtml).join("") : rowHtml()) + '</tbody></table><button id="bg-add" class="o-addln">+ Add line</button></div></div>' +
      '</div>';
    document.getElementById("bg-discard").onclick = function () { go("budget.list"); };
    function wireDel() { document.querySelectorAll("#bg-lines .bl-del").forEach(function (x) { x.onclick = function () { x.closest("tr").remove(); }; }); }
    wireDel();
    document.getElementById("bg-add").onclick = function () { document.getElementById("bg-lines").insertAdjacentHTML("beforeend", rowHtml()); wireDel(); };
    function readLines() { return [].map.call(document.querySelectorAll("#bg-lines tr"), function (tr, i) { return { account_code: (tr.querySelector(".bl-acc") || {}).value || "", label: (tr.querySelector(".bl-lbl") || {}).value || "", planned: parseFloat((tr.querySelector(".bl-amt") || {}).value) || 0, sequence: (i + 1) * 10 }; }).filter(function (l) { return l.account_code; }); }
    async function persist() {
      var row = { name: gv("bg-name") || "Budget", date_start: gv("bg-start") || null, date_end: gv("bg-end") || null };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("budgets").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("budgets").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      await sb.from("budget_lines").delete().eq("budget_id", sid);
      var ls = readLines().map(function (l) { l.company_id = S.company.id; l.budget_id = sid; return l; });
      if (ls.length) { var ir = await sb.from("budget_lines").insert(ls); if (ir.error) { toast(errMsg(ir.error)); return null; } }
      return sid;
    }
    document.getElementById("bg-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderBudgetForm(sid); } };
    var rp = document.getElementById("bg-report"); if (rp) rp.onclick = async function () { var sid = await persist(); if (sid) renderBudgetReport(sid); };
  }
  async function renderBudgetReport(budgetId) {
    document.getElementById("o-main").innerHTML = repChrome("Budget vs Actual", true);
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); }; var ex = document.getElementById("rp-export"); if (ex) ex.onclick = exportRepCsv;
    var cc = S.company.currency_code;
    var b = (await sb.from("budgets").select("*").eq("id", budgetId).maybeSingle()).data || {};
    var lines = (await sb.from("budget_lines").select("*").eq("budget_id", budgetId).order("sequence")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = b.name || "Budget";
    var jl = (await sb.from("journal_lines").select("debit,credit, accounts(code,type_code), journal_entries!inner(date,state,company_id)").eq("journal_entries.company_id", S.company.id).eq("journal_entries.state", "posted").gte("journal_entries.date", b.date_start).lte("journal_entries.date", b.date_end)).data || [];
    var actByCode = {}, typeByCode = {};
    jl.forEach(function (l) { var c = l.accounts && l.accounts.code; if (!c) return; typeByCode[c] = l.accounts.type_code; actByCode[c] = (actByCode[c] || 0) + (Number(l.debit || 0) - Number(l.credit || 0)); });
    var rows = "", tp = 0, ta = 0;
    lines.forEach(function (l) {
      var code = l.account_code, tc = typeByCode[code] || "", isIncome = tc.indexOf("income") === 0;
      var raw = actByCode[code] || 0, actual = isIncome ? -raw : raw;
      var planned = Number(l.planned || 0), variance = planned - actual;
      tp += planned; ta += actual;
      var over = actual > planned + 0.005;
      rows += '<tr' + (over ? ' style="background:var(--bad-s)"' : '') + '><td>' + esc(code) + '</td><td>' + esc(l.label || "") + '</td><td class="num">' + money(planned) + '</td><td class="num">' + money(actual) + '</td><td class="num"' + (variance < 0 ? ' style="color:var(--bad)"' : '') + '>' + money(variance) + '</td><td class="num">' + (planned ? Math.round(actual / planned * 100) + "%" : "-") + '</td><td>' + (over ? '<span class="ob-flag">over</span>' : (planned && actual >= planned * 0.9 ? '<span class="ob-flag" style="background:var(--warn)">near</span>' : '<span style="color:var(--good);font-weight:600">ok</span>')) + '</td></tr>';
    });
    document.getElementById("rep").innerHTML = '<h1>' + esc(b.name || "Budget") + ' &middot; budget vs actual</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; ' + esc(b.date_start || "") + ' to ' + esc(b.date_end || "") + '</div>' +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Account</td><td>Note</td><td class="num">Planned</td><td class="num">Actual</td><td class="num">Variance</td><td class="num">Used</td><td>Status</td></tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="muted">No budget lines.</td></tr>') + '<tr class="tot"><td>Total</td><td></td><td class="num">' + money(tp) + '</td><td class="num">' + money(ta) + '</td><td class="num">' + money(tp - ta) + '</td><td class="num">' + (tp ? Math.round(ta / tp * 100) + "%" : "-") + '</td><td></td></tr></tbody></table></div>' +
      '<div class="sub" style="margin-top:8px">Actual = posted journal lines on each account within the period (income shown positive as earned). A red row means it has passed the plan.</div>';
  }

  // ============================ FOLLOW-UP (DUNNING) LEVELS ============================
  function cfgFollowupLevels() {
    return {
      title: "Follow-up Levels", pageSize: 60,
      fetch: function () { return sb.from("followup_levels").select("*").eq("company_id", S.company.id).order("days").then(function (r) { return r.data || []; }); },
      searchText: function (l) { return (l.name || "") + " " + (l.action || ""); },
      columns: [
        { label: "Level", get: function (l) { return '<b>' + esc(l.name) + '</b>'; } },
        { label: "Days overdue", num: true, get: function (l) { return String(l.days || 0); } },
        { label: "Action", get: function (l) { return esc(l.action || ""); } },
        { label: "Message", get: function (l) { return '<span class="muted">' + esc((l.message || "").slice(0, 70)) + '</span>'; } }
      ],
      onOpen: function (l) { openFollowupLevelModal(l); }, onNew: function () { openFollowupLevelModal(null); }
    };
  }
  function openFollowupLevelModal(lvl) {
    lvl = lvl || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (lvl.id ? "Edit" : "New") + ' follow-up level</h3><div class="form">' +
      '<div class="row2"><div><label>Level name</label>' + fhint("__fln", "e.g. Reminder, Warning, Final notice.") + '<input id="fl-name" value="' + esc(lvl.name || "") + '"></div>' +
      '<div><label>Days overdue</label>' + fhint("__fld2", "Applies once an invoice is this many days past due.") + '<input id="fl-days" type="number" value="' + (lvl.days || 15) + '"></div></div>' +
      '<div><label>Action</label>' + fhint("__fla", "What to do at this level.") + '<select id="fl-action"><option value="email">Email reminder</option><option value="call">Phone call</option><option value="letter">Formal letter</option><option value="legal">Escalate / legal</option></select></div>' +
      '<div><label>Message</label>' + fhint("__flm", "Suggested wording for the reminder.") + '<textarea id="fl-msg" rows="2">' + esc(lvl.message || "") + '</textarea></div>' +
      '</div><div class="foot"><button class="btn" id="fl-cancel">Cancel</button>' + (lvl.id ? '<button class="btn" id="fl-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="fl-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("fl-action").value = lvl.action || "email";
    document.getElementById("fl-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("fl-del"); if (del) del.onclick = async function () { await sb.from("followup_levels").delete().eq("id", lvl.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("fl-save").onclick = async function () {
      var row = { name: gv("fl-name") || "Level", days: parseInt(gv("fl-days"), 10) || 0, action: document.getElementById("fl-action").value, message: (document.getElementById("fl-msg") || {}).value || "" };
      var r;
      if (lvl.id) r = await sb.from("followup_levels").update(row).eq("id", lvl.id);
      else { row.company_id = S.company.id; r = await sb.from("followup_levels").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }

  // ============================ DOCUMENT CONTROL (submittals / RFIs / transmittals) ============================
  var SUBMITTAL_TYPES = [["shop_drawing", "Shop drawing"], ["material_approval", "Material approval"], ["sample", "Sample"], ["method_statement", "Method statement"], ["other", "Other"]];
  function subTypeLabel(t) { var m = SUBMITTAL_TYPES.filter(function (x) { return x[0] === t; })[0]; return m ? m[1] : t; }
  function docBadge(text, color) { return '<span style="display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:6px;background:' + color + ';color:#fff;white-space:nowrap">' + esc(text) + '</span>'; }
  function subStatusBadge(s) { var m = { draft: ["Draft", "var(--slate)"], submitted: ["Submitted", "var(--warn)"], approved: ["Approved", "var(--good)"], approved_comments: ["Approved w/ comments", "var(--good)"], rejected: ["Rejected", "var(--bad)"], superseded: ["Superseded", "var(--slate)"] }[s] || [s, "var(--slate)"]; return docBadge(m[0], m[1]); }
  function rfiStatusBadge(s) { var m = { open: ["Open", "var(--warn)"], answered: ["Answered", "var(--good)"], closed: ["Closed", "var(--slate)"] }[s] || [s, "var(--slate)"]; return docBadge(m[0], m[1]); }
  function nextRev(r) { r = String(r || "A"); if (/^[A-Za-z]$/.test(r)) return String.fromCharCode(r.toUpperCase().charCodeAt(0) + 1); var n = parseInt(r, 10); return isNaN(n) ? r + "'" : (n + 1) + ""; }
  async function nextDocNumber(table, prefix) {
    var cfg = await seqCfg(prefix), py = seqPrefixYear(cfg);
    var rows = (await sb.from(table).select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
    return py + seqPad(cfg, maxSeq(rows, py) + 1);
  }
  // Settings > Document Numbering (ORB-06): admin edits prefix / digits / year per document type
  // ============================ GETTING STARTED (ORB-05 onboarding) ============================
  function suCheck() { return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>'; }
  // the checklist model: what each step is, why it matters, and where it takes you.
  var SETUP_STEPS = [
    { key: "profile", n: "Company profile", why: "Your legal name, country and currency stamp every invoice, quote and report.", cta: "Save profile" },
    { key: "numbering", n: "Document numbering", why: "Choose how invoices, POs, tenders and certificates are numbered (prefix, year, running digits).", cta: "Set numbering", go: "settings.numbering" },
    { key: "taxes", n: "Tax rates", why: "Add your VAT / sales-tax rates so quotes and invoices calculate the right totals.", cta: "Add tax rates", go: "taxes" },
    { key: "team", n: "Your team", why: "Add the people who work with you, so you can assign tasks and run payroll.", cta: "Add people", go: "hr.emp" },
    { key: "customer", n: "First customer", why: "Add a client you will bill. Contacts are shared across all your companies.", cta: "Add a customer", go: "cust" },
    { key: "project", n: "First project", why: "Create the job you are delivering. Budget, BOQ, certificates and the execution board all hang off a project.", cta: "Create a project", go: "proj.list" }
  ];
  // compute which steps are done, from live data (cheap head/count queries, each tolerant of failure)
  async function setupState() {
    var cid = S.company.id, oid = S.company.org_id;
    function cnt(q) { return q.then(function (r) { return (r && r.count) || 0; }).catch(function () { return 0; }); }
    var r = await Promise.all([
      cnt(sb.from("number_sequences").select("id", { count: "exact", head: true }).eq("company_id", cid)),
      cnt(sb.from("taxes").select("id", { count: "exact", head: true }).eq("company_id", cid)),
      cnt(sb.from("hr_employees").select("id", { count: "exact", head: true }).eq("company_id", cid)),
      oid ? cnt(sb.from("partners").select("id", { count: "exact", head: true }).eq("org_id", oid).eq("is_customer", true)) : Promise.resolve(0),
      cnt(sb.from("projects").select("id", { count: "exact", head: true }).eq("company_id", cid))
    ]);
    var profileDone = !!(S.company.legal_name && S.company.country && S.company.currency_code);
    var doneMap = { profile: profileDone, numbering: r[0] > 0, taxes: r[1] > 0, team: r[2] > 0, customer: r[3] > 0, project: r[4] > 0 };
    return SETUP_STEPS.map(function (s) { return { key: s.key, done: !!doneMap[s.key] }; });
  }
  async function renderSetup() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Getting started") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var state = await setupState();
    var doneN = state.filter(function (s) { return s.done; }).length, tot = state.length, pct = Math.round(doneN / tot * 100);
    var co = S.company;
    var cards = SETUP_STEPS.map(function (m, i) {
      var done = state[i].done;
      var numHtml = done ? suCheck() : String(i + 1);
      var pill = done ? '<span class="su-pill done">Done</span>' : '<span class="su-pill">To do</span>';
      var info = '<div class="su-info"><div class="su-step-t">' + esc(m.n) + ' ' + pill + '</div><div class="su-step-w">' + esc(m.why) + '</div></div>';
      var right, extra = "";
      if (m.key === "profile") {
        right = '<div class="su-cta-slot"></div>';
        extra = '<div class="su-profile">' +
          '<div class="su-fg"><label for="su-name">Company name</label><input id="su-name" value="' + esc(co.name || "") + '"></div>' +
          '<div class="su-fg"><label for="su-legal">Legal name</label><input id="su-legal" value="' + esc(co.legal_name || "") + '" placeholder="Registered name"></div>' +
          '<div class="su-fg"><label for="su-country">Country</label><input id="su-country" value="' + esc(co.country || "") + '" placeholder="e.g. Lebanon"></div>' +
          '<div class="su-fg"><label for="su-cur">Currency</label><input id="su-cur" value="' + esc(co.currency_code || "") + '" placeholder="e.g. USD" style="text-transform:uppercase"></div>' +
          '<div class="su-profile-save"><button class="pri" id="su-save">' + esc(m.cta) + '</button></div>' +
          '</div>';
      } else {
        right = '<div class="su-cta"><button class="' + (done ? "" : "pri") + '" data-go="' + m.go + '">' + (done ? "Review" : esc(m.cta)) + '</button></div>';
      }
      return '<div class="su-step' + (done ? " done" : "") + '"><div class="su-step-h"><span class="su-num' + (done ? " done" : "") + '">' + numHtml + '</span>' + info + right + '</div>' + extra + '</div>';
    }).join("");
    var allset = doneN >= tot
      ? '<div class="card su-allset"><span class="su-allset-ic">' + suCheck() + '</span><div><b>You are all set up.</b> Orbit has the basics it needs to run real projects. You can revisit this checklist any time from Settings &rsaquo; Getting started.</div></div>'
      : '';
    document.getElementById("o-body").innerHTML = '<div class="su-wrap">' +
      '<div class="su-head"><div><h2 style="margin:0 0 3px">Getting started</h2><div class="sub" style="margin:0">A short checklist to get <b>' + esc(co.name) + '</b> ready. Finish these and Orbit is ready to run real projects.</div></div>' +
      '<div class="su-prog"><div class="su-prog-n">' + doneN + ' / ' + tot + '</div><div class="su-bar"><span style="width:' + pct + '%"></span></div></div></div>' +
      allset + '<div class="su-steps">' + cards + '</div></div>';
    var sv = document.getElementById("su-save");
    if (sv) sv.onclick = async function () {
      var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var upd = { name: g("su-name"), legal_name: g("su-legal"), country: g("su-country"), currency_code: (g("su-cur") || "USD").toUpperCase() };
      if (!upd.name) { toast("Company name is required"); return; }
      sv.disabled = true;
      var res = await sb.from("companies").update(upd).eq("id", S.company.id);
      sv.disabled = false;
      if (res.error) { toast("Save failed: " + errMsg(res.error)); return; }
      Object.assign(S.company, upd);
      var ci = S.companies.filter(function (c) { return c.id === S.company.id; })[0]; if (ci) Object.assign(ci, upd);
      toast("Company profile saved");
      renderSetup();
    };
    document.querySelectorAll("#o-body .su-cta [data-go]").forEach(function (b) { b.onclick = function () { goApp(b.dataset.go); }; });
  }
  // Home-screen nudge: a compact progress card above the app grid, for admins, until dismissed.
  async function setupBannerInject() {
    try {
      if (!S.company || !canManage("settings")) return;
      var cid = S.company.id;
      if (localStorage.getItem("orbit_setup_hide_" + cid) === "1") return;
      var state = await setupState();
      var doneN = state.filter(function (s) { return s.done; }).length, tot = state.length;
      var grid = root.querySelector(".o-grid"); if (!grid) return;           // user navigated away while loading
      if (doneN >= tot) return;                                              // fully set up, no nudge
      var pct = Math.round(doneN / tot * 100);
      var chips = SETUP_STEPS.map(function (m, i) {
        var done = state[i].done;
        return '<span class="su-chip' + (done ? " done" : "") + '">' + (done ? suCheck() : '<span class="su-cdot"></span>') + esc(m.n) + '</span>';
      }).join("");
      var html = '<div class="su-home card">' +
        '<div class="su-home-top"><div><div class="su-home-t">Finish setting up ' + esc(S.company.name) + '</div>' +
        '<div class="su-home-s">' + doneN + ' of ' + tot + ' steps done &middot; a few basics make Orbit ready to run real projects.</div></div>' +
        '<div class="su-home-btns"><button class="pri" id="su-continue">Continue setup</button><button class="lnk" id="su-hide">Hide</button></div></div>' +
        '<div class="su-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="su-chips">' + chips + '</div></div>';
      grid.insertAdjacentHTML("beforebegin", html);
      document.getElementById("su-continue").onclick = function () { goApp("settings.setup"); };
      document.getElementById("su-hide").onclick = function () { localStorage.setItem("orbit_setup_hide_" + cid, "1"); var el = root.querySelector(".su-home"); if (el) el.remove(); };
    } catch (e) { /* nudge is best-effort */ }
  }

  // ============================ PLATFORM: PENDING SIGNUPS (approval) ============================
  async function renderPendingSignups() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Pending signups") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var body = document.getElementById("o-body");
    if (!S.isPlatformAdmin) { body.innerHTML = '<div style="padding:18px"><div class="o-empty">Platform admins only.</div></div>'; return; }
    var pend = ((await sb.rpc("pending_signups")).data) || [];
    if (!pend.length) { body.innerHTML = '<div style="padding:18px"><div class="o-empty2"><div class="o-empty2-t">No pending applications</div><div class="o-empty2-h">New signups that are awaiting review will appear here for you to approve or reject.</div></div></div>'; return; }
    function kv(k, v) { return v ? '<div><span style="color:var(--ink3)">' + esc(k) + ':</span> ' + esc(v) + '</div>' : ""; }
    var cards = pend.map(function (o) {
      return '<div class="card"><div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:240px"><h3 style="margin:0 0 3px">' + esc(o.name) + '</h3>' +
        '<div class="mini">' + esc(o.business_type || "") + ((o.country || o.city) ? ' &middot; ' + esc((o.city ? o.city + ", " : "") + (o.country || "")) : "") + '</div>' +
        '<div style="margin-top:8px;font-size:13px;color:var(--ink2);display:flex;flex-direction:column;gap:3px">' +
        kv("Scope of work", o.scope_of_work) + kv("Employees", o.employee_count) + kv("Phone", o.contact_phone) + kv("Reg / Tax no.", o.reg_no) + kv("Applied", (o.applied_at || "").slice(0, 16).replace("T", " ")) + kv("Terms accepted", o.tc_version) +
        '</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;flex:none"><button class="btn pri pa-appr" data-id="' + o.id + '" data-name="' + esc(o.name) + '" style="background:var(--good);border-color:var(--good)">Approve</button><button class="btn pa-rej" data-id="' + o.id + '" style="color:var(--bad)">Reject</button></div>' +
        '</div></div>';
    }).join("");
    body.innerHTML = '<div style="padding:16px;max-width:880px"><div class="sub" style="margin:0 0 12px"><b>' + pend.length + '</b> application' + (pend.length === 1 ? "" : "s") + ' awaiting review. Approving unlocks the account immediately; the applicant can then sign in.</div>' + cards + '</div>';
    async function setStatus(id, status, verb) {
      var r = await sb.rpc("set_org_status", { p_org: id, p_status: status });
      if (r.error) { toast(errMsg(r.error)); return; }
      toast(verb); renderPendingSignups();
    }
    document.querySelectorAll(".pa-appr").forEach(function (b) { b.onclick = function () { setStatus(b.dataset.id, "active", "Approved " + b.dataset.name); }; });
    document.querySelectorAll(".pa-rej").forEach(function (b) { b.onclick = function () { setStatus(b.dataset.id, "rejected", "Rejected"); }; });
  }

  // ============================ DATA IMPORT (ORB-15) ============================
  // per-entity import spec: fields = [key, label, required, type]
  var IMPORT_SPECS = {
    customers: { label: "Customers", table: "partners", scope: "org", extra: { is_customer: true, is_company: true }, fields: [["name", "Name", true], ["email", "Email", false], ["phone", "Phone", false], ["city", "City", false], ["country", "Country", false], ["vat", "Tax / VAT no.", false]] },
    vendors: { label: "Vendors / Suppliers", table: "partners", scope: "org", extra: { is_vendor: true, is_company: true }, fields: [["name", "Name", true], ["email", "Email", false], ["phone", "Phone", false], ["city", "City", false], ["country", "Country", false], ["vat", "Tax / VAT no.", false]] },
    products: { label: "Products / Items", table: "products", scope: "company", extra: { is_active: true }, fields: [["name", "Name", true], ["default_code", "Code", false], ["list_price", "Sale price", false, "num"], ["cost_price", "Cost price", false, "num"]] },
    cost_codes: { label: "Cost Codes", table: "cost_codes", scope: "company", extra: { is_active: true }, fields: [["code", "Code", true], ["name", "Name", false], ["category", "Category", false]] },
    projects: { label: "Projects", table: "projects", scope: "company", extra: { is_active: true }, fields: [["name", "Name", true], ["contract_value", "Contract value", false, "num"]] }
  };
  function csvParse(text) {
    text = String(text).replace(/^﻿/, "");
    var rows = [], row = [], cur = "", i = 0, q = false;
    while (i < text.length) {
      var ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i += 2; continue; } q = false; i++; continue; } cur += ch; i++; continue; }
      if (ch === '"') { q = true; i++; continue; }
      if (ch === ',') { row.push(cur); cur = ""; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ""; i++; continue; }
      cur += ch; i++;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return (c || "").trim() !== ""; }); });
  }
  function importTemplate(spec) {
    var header = spec.fields.map(function (f) { return csvCell(f[1] + (f[2] ? " *" : "")); }).join(",");
    var example = spec.fields.map(function (f) { return csvCell(f[3] === "num" ? "0" : ("Example " + f[1])); }).join(",");
    return "﻿" + header + "\r\n" + example;
  }
  function downloadBlob(name, text, mime) {
    var blob = new Blob([text], { type: (mime || "text/csv") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  async function renderImport() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Import Data") + '</div><div class="o-body" id="o-body"></div></div>';
    wireBc();
    var keys = Object.keys(IMPORT_SPECS);
    var entityOpts = keys.map(function (k) { return '<option value="' + k + '">' + esc(IMPORT_SPECS[k].label) + '</option>'; }).join("");
    document.getElementById("o-body").innerHTML =
      '<div style="padding:16px;max-width:820px"><div class="card">' +
      '<h3 style="margin-top:0">Import data from a spreadsheet</h3>' +
      '<div class="sub" style="margin:0 0 14px">Pick what to import, download the template, fill it in (keep the header row), and upload it. Columns marked <b>*</b> are required. Existing records are not changed &mdash; this adds new rows.</div>' +
      '<div class="su-fg" style="max-width:340px"><label for="im-entity">What are you importing?</label><select id="im-entity">' + entityOpts + '</select></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0"><button class="btn" id="im-tmpl">Download template</button><label class="btn" for="im-file" style="cursor:pointer;background:var(--accent);border-color:var(--accent);color:#fff">Choose CSV file</label><input id="im-file" type="file" accept=".csv,text/csv" style="display:none"></div>' +
      '<div id="im-fields" class="mini"></div>' +
      '<div id="im-preview" style="margin-top:14px"></div>' +
      '</div></div>';
    function showFields() {
      var spec = IMPORT_SPECS[document.getElementById("im-entity").value];
      document.getElementById("im-fields").innerHTML = 'Columns: ' + spec.fields.map(function (f) { return '<b>' + esc(f[1]) + '</b>' + (f[2] ? ' <span style="color:var(--bad)">*</span>' : ''); }).join(", ");
      document.getElementById("im-preview").innerHTML = "";
    }
    document.getElementById("im-entity").onchange = showFields; showFields();
    document.getElementById("im-tmpl").onclick = function () { var k = document.getElementById("im-entity").value, spec = IMPORT_SPECS[k]; downloadBlob(k + "_template.csv", importTemplate(spec)); toast("Template downloaded"); };
    document.getElementById("im-file").onchange = function () {
      var file = this.files && this.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () { previewImport(document.getElementById("im-entity").value, csvParse(rd.result)); };
      rd.readAsText(file);
    };
    function previewImport(entKey, rows) {
      var spec = IMPORT_SPECS[entKey], prev = document.getElementById("im-preview");
      if (rows.length < 2) { prev.innerHTML = '<div class="ob-banner">That file has no data rows. Use the template and add at least one row under the header.</div>'; return; }
      var headers = rows[0].map(function (h) { return (h || "").replace(/\*/g, "").trim().toLowerCase(); });
      var colFor = {};
      spec.fields.forEach(function (f) { var idx = headers.indexOf(f[1].toLowerCase()); if (idx < 0) idx = headers.indexOf(f[0].toLowerCase()); colFor[f[0]] = idx; });
      var data = rows.slice(1).map(function (r) {
        var obj = { __err: [] };
        spec.fields.forEach(function (f) { var v = colFor[f[0]] >= 0 ? (r[colFor[f[0]]] || "").trim() : ""; if (f[2] && !v) obj.__err.push(f[1]); obj[f[0]] = v; });
        return obj;
      });
      var okN = data.filter(function (d) { return !d.__err.length; }).length, badN = data.length - okN;
      var head = spec.fields.map(function (f) { return '<th>' + esc(f[1]) + (f[2] ? ' *' : '') + '</th>'; }).join("");
      var body = data.slice(0, 25).map(function (d) {
        var tds = spec.fields.map(function (f) { var bad = f[2] && !d[f[0]]; return '<td' + (bad ? ' style="background:var(--bad-s);color:var(--bad)"' : '') + '>' + esc(d[f[0]] || (bad ? "missing" : "")) + '</td>'; }).join("");
        return '<tr>' + tds + '</tr>';
      }).join("");
      prev.innerHTML = '<div class="sub" style="margin:0 0 8px"><b>' + data.length + '</b> rows found &middot; <span style="color:var(--good)">' + okN + ' ready</span>' + (badN ? ' &middot; <span style="color:var(--bad)">' + badN + ' missing a required field (skipped)</span>' : '') + (data.length > 25 ? ' &middot; showing first 25' : '') + '</div>' +
        '<div class="o-rt-wrap"><table class="o-list"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
        '<button class="btn pri" id="im-go" style="margin-top:12px;background:var(--accent);border-color:var(--accent)"' + (okN ? '' : ' disabled') + '>Import ' + okN + ' row' + (okN === 1 ? '' : 's') + '</button>';
      var go = document.getElementById("im-go");
      if (go) go.onclick = async function () {
        go.disabled = true; go.textContent = "Importing...";
        var payload = data.filter(function (d) { return !d.__err.length; }).map(function (d) {
          var row = {}; for (var kk in spec.extra) row[kk] = spec.extra[kk];
          row[spec.scope === "org" ? "org_id" : "company_id"] = spec.scope === "org" ? S.company.org_id : S.company.id;
          spec.fields.forEach(function (f) { var v = d[f[0]]; if (v === "" || v == null) return; row[f[0]] = f[3] === "num" ? (Number(v) || 0) : v; });
          return row;
        });
        var res = await sb.from(spec.table).insert(payload);
        if (res.error) { toast("Import failed: " + errMsg(res.error)); go.disabled = false; go.textContent = "Import " + okN + " rows"; return; }
        toast("Imported " + payload.length + " " + spec.label.toLowerCase()); prev.innerHTML = '<div class="ob-banner" style="background:var(--good-s);color:var(--good);border:0">Imported ' + payload.length + ' rows successfully.</div>';
      };
    }
  }

  // ============================ RFQ / SUPPLIER COMPARISON (ORB-14) ============================
  function rfqBadge(s) {
    var col = { draft: "--ink3", sent: "--accent", closed: "--warn", awarded: "--good", cancelled: "--bad" }[s] || "--ink3";
    var txt = { draft: "Draft", sent: "Sent", closed: "Closed", awarded: "Awarded", cancelled: "Cancelled" }[s] || (s || "Draft");
    return '<span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:6px;color:var(' + col + ');border:1px solid var(' + col + ')">' + esc(txt) + '</span>';
  }
  function cfgRFQs() {
    return {
      title: "RFQ / Compare Quotes", pageSize: 80,
      fetch: function () { return sb.from("rfqs").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return (r.number || "") + " " + (r.title || "") + " " + (r.projects ? r.projects.name : ""); },
      columns: [
        { label: "Number", get: function (r) { return '<b>' + esc(r.number || "Draft") + '</b>'; } },
        { label: "Title", get: function (r) { return esc(r.title || ""); } },
        { label: "Project", get: function (r) { return '<span class="muted">' + esc(r.projects ? r.projects.name : "") + '</span>'; } },
        { label: "Deadline", get: function (r) { return esc(r.deadline || ""); } },
        { label: "Status", get: function (r) { return rfqBadge(r.status); } }
      ],
      filters: [{ label: "Open", test: function (r) { return ["draft", "sent", "closed"].indexOf(r.status) >= 0; } }, { label: "Awarded", test: function (r) { return r.status === "awarded"; } }],
      emptyHint: "An RFQ lets you ask several suppliers to quote the same items, compare their prices side by side, and award the best one — which creates a draft PO (your committed cost).",
      onOpen: function (r) { renderRFQForm(r.id); }, onNew: function () { renderRFQForm("new"); }
    };
  }
  async function renderRFQForm(id) {
    var parent = { action: "rfq.list", title: "RFQ / Compare Quotes" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var isNew = id === "new";
    var rfq = isNew ? { status: "draft", title: "Request for Quotation" } : ((await sb.from("rfqs").select("*").eq("id", id).maybeSingle()).data || {});
    var projects = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var ccs = (await sb.from("cost_codes").select("id,code,name").eq("company_id", S.company.id).eq("is_active", true).order("sort")).data || [];
    var vendorParts = (await sb.from("partners").select("id,name").eq("is_vendor", true).order("name")).data || [];
    var kc = 1, L = [], V = [], B = {};
    if (!isNew) {
      var lrows = (await sb.from("rfq_lines").select("*").eq("rfq_id", id).order("sequence")).data || [];
      var idToK = {};
      L = lrows.map(function (l) { var k = kc++; idToK[l.id] = k; return { k: k, description: l.description, unit: l.unit, quantity: l.quantity }; });
      V = ((await sb.from("rfq_vendors").select("*").eq("rfq_id", id)).data || []).map(function (v) { return { partner_id: v.partner_id }; });
      ((await sb.from("rfq_bids").select("*").eq("rfq_id", id)).data || []).forEach(function (b) { var k = idToK[b.rfq_line_id]; if (k != null) B[k + "|" + b.partner_id] = b.unit_price; });
    }
    if (!L.length) L = [{ k: kc++, description: "", unit: "", quantity: 1 }];
    var awarded = rfq.status === "awarded";
    function vname(pid) { var p = vendorParts.filter(function (x) { return x.id === pid; })[0]; return p ? p.name : "Vendor"; }
    function syncFromDom() {
      var lb = document.getElementById("rl-body");
      if (lb) L = Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) { return { k: Number(tr.dataset.k), description: tr.querySelector(".rl-desc").value.trim(), unit: tr.querySelector(".rl-unit").value.trim(), quantity: parseFloat(tr.querySelector(".rl-qty").value) || 0 }; });
      document.querySelectorAll(".rfq-bid").forEach(function (inp) { var key = inp.dataset.k + "|" + inp.dataset.partner; if (inp.value !== "") B[key] = Number(inp.value); else delete B[key]; });
      rfq.title = (document.getElementById("rfq-title") || {}).value || rfq.title;
      rfq.project_id = (document.getElementById("rfq-proj") || {}).value || null;
      rfq.cost_code_id = (document.getElementById("rfq-cc") || {}).value || null;
      rfq.deadline = (document.getElementById("rfq-deadline") || {}).value || null;
      rfq.note = (document.getElementById("rfq-note") || {}).value || "";
    }
    async function persist() {
      var hdr = { title: rfq.title || "RFQ", project_id: rfq.project_id || null, cost_code_id: rfq.cost_code_id || null, deadline: rfq.deadline || null, note: rfq.note || "" };
      if (isNew) {
        hdr.company_id = S.company.id; hdr.status = "sent";
        var yr = new Date().getFullYear(), py = "RFQ/" + yr + "/";
        var ex = (await sb.from("rfqs").select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
        hdr.number = py + ("000" + (maxSeq(ex, py) + 1)).slice(-4);
        var r = await sb.from("rfqs").insert(hdr).select("id,number,status").single();
        if (r.error) { toast(errMsg(r.error)); return false; }
        id = r.data.id; isNew = false; rfq.number = r.data.number; rfq.status = r.data.status;
      } else { await sb.from("rfqs").update(hdr).eq("id", id); }
      var Lf = L.filter(function (l) { return l.description; });
      await sb.from("rfq_lines").delete().eq("rfq_id", id);
      var kToId = {};
      if (Lf.length) {
        var ins = await sb.from("rfq_lines").insert(Lf.map(function (l, i) { return { company_id: S.company.id, rfq_id: id, description: l.description, unit: l.unit || "", quantity: l.quantity || 0, sequence: (i + 1) * 10 }; })).select("id,sequence");
        if (ins.error) { toast(errMsg(ins.error)); return false; }
        var sorted = (ins.data || []).slice().sort(function (a, b) { return a.sequence - b.sequence; });
        sorted.forEach(function (row, i) { if (Lf[i]) kToId[Lf[i].k] = row.id; });
      }
      await sb.from("rfq_vendors").delete().eq("rfq_id", id);
      if (V.length) { var vi = await sb.from("rfq_vendors").insert(V.map(function (v) { return { company_id: S.company.id, rfq_id: id, partner_id: v.partner_id, status: "invited" }; })); if (vi.error) { toast(errMsg(vi.error)); return false; } }
      await sb.from("rfq_bids").delete().eq("rfq_id", id);
      var bidRows = [];
      Lf.forEach(function (l) { V.forEach(function (v) { var val = B[l.k + "|" + v.partner_id]; if (val != null && val !== "" && kToId[l.k]) bidRows.push({ company_id: S.company.id, rfq_id: id, rfq_line_id: kToId[l.k], partner_id: v.partner_id, unit_price: Number(val) }); }); });
      if (bidRows.length) { var bi = await sb.from("rfq_bids").insert(bidRows); if (bi.error) { toast(errMsg(bi.error)); return false; } }
      return true;
    }
    async function award(partnerId) {
      syncFromDom();
      if (!(await persist())) return;
      var lns = (await sb.from("rfq_lines").select("*").eq("rfq_id", id).order("sequence")).data || [];
      var pb = {}; ((await sb.from("rfq_bids").select("*").eq("rfq_id", id).eq("partner_id", partnerId)).data || []).forEach(function (b) { pb[b.rfq_line_id] = b.unit_price; });
      var untax = lns.reduce(function (s, l) { return s + (Number(pb[l.id]) || 0) * (Number(l.quantity) || 0); }, 0);
      var po = await sb.from("purchase_orders").insert({ company_id: S.company.id, number: await nextOrderNumber("purchase"), partner_id: partnerId, date_order: today(), state: "draft", currency_code: S.company.currency_code, project_id: rfq.project_id || null, cost_code_id: rfq.cost_code_id || null, amount_untaxed: untax, amount_total: untax, note: "Awarded from " + (rfq.number || "RFQ") }).select("id,number").single();
      if (po.error) { toast(errMsg(po.error)); return; }
      var poLines = lns.map(function (l) { var up = Number(pb[l.id]) || 0; return { company_id: S.company.id, order_id: po.data.id, name: l.description, quantity: l.quantity, unit_price: up, price_subtotal: up * (Number(l.quantity) || 0), cost_code_id: rfq.cost_code_id || null }; });
      if (poLines.length) await sb.from("purchase_order_lines").insert(poLines);
      await sb.from("rfqs").update({ status: "awarded", awarded_partner_id: partnerId }).eq("id", id);
      toast("Awarded to " + vname(partnerId) + " — draft " + po.data.number + " created"); renderRFQForm(id);
    }
    function draw() {
      var header = '<div class="o-groups"><div>' +
        fld("Title", '<input id="rfq-title" value="' + esc(rfq.title || "") + '">') +
        fld("Project", '<select id="rfq-proj"><option value="">(none)</option>' + projects.map(function (p) { return '<option value="' + p.id + '"' + (rfq.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>') +
        fld("Cost Code", '<select id="rfq-cc"><option value="">(none)</option>' + ccs.map(function (c) { return '<option value="' + c.id + '"' + (rfq.cost_code_id === c.id ? " selected" : "") + '>' + esc(c.code) + (c.name ? " - " + esc(c.name) : "") + '</option>'; }).join("") + '</select>') +
        '</div><div>' +
        fld("Deadline", '<input id="rfq-deadline" type="date" value="' + esc(rfq.deadline || "") + '">') +
        fld("Note", '<input id="rfq-note" value="' + esc(rfq.note || "") + '" placeholder="optional">') +
        fld("Status", rfqBadge(rfq.status)) +
        '</div></div>';
      var lineRows = L.map(function (l, i) { return '<tr data-k="' + l.k + '"><td><input class="rl-desc" value="' + esc(l.description || "") + '" placeholder="Item to quote"></td><td><input class="rl-unit" value="' + esc(l.unit || "") + '" style="width:64px" placeholder="unit"></td><td><input class="rl-qty num" type="number" step="0.01" value="' + (l.quantity != null ? l.quantity : 1) + '" style="width:84px"></td><td><button class="del rl-del" data-i="' + i + '" aria-label="Remove line">&times;</button></td></tr>'; }).join("");
      var linesTbl = '<h3 style="margin:16px 0 6px">Items to quote</h3><div class="o-rt-wrap"><table class="o-lines"><thead><tr><th>Description</th><th>Unit</th><th style="text-align:right">Qty</th><th style="width:24px"></th></tr></thead><tbody id="rl-body">' + lineRows + '</tbody></table></div><button class="o-new" id="rl-add" style="margin-top:6px">+ Add item</button>';
      var chips = V.map(function (v, i) { return '<span class="rfq-vchip">' + esc(vname(v.partner_id)) + ' <button class="rfq-vdel" data-i="' + i + '" aria-label="Remove supplier">&times;</button></span>'; }).join("");
      var addOpts = vendorParts.filter(function (p) { return !V.some(function (v) { return v.partner_id === p.id; }); }).map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join("");
      var vendorsSec = '<h3 style="margin:18px 0 6px">Suppliers invited</h3><div class="rfq-vchips">' + (chips || '<span class="muted">None yet.</span>') + '</div>' + (vendorParts.length ? '<div style="margin-top:8px"><select id="rfq-addv" style="max-width:280px"><option value="">+ Add a supplier...</option>' + addOpts + '</select></div>' : '<div class="sub">Add vendor contacts first (Contacts).</div>');
      var matrix = "";
      if (V.length && L.some(function (l) { return l.description; })) {
        var Lf = L.filter(function (l) { return l.description; });
        var vt = {}; V.forEach(function (v) { vt[v.partner_id] = 0; });
        var headRow = '<th>Item</th><th class="num">Qty</th>' + V.map(function (v) { return '<th class="num">' + esc(vname(v.partner_id)) + '</th>'; }).join("");
        var mrows = Lf.map(function (l) {
          var totals = V.map(function (v) { var p = B[l.k + "|" + v.partner_id]; return (p != null && p !== "") ? Number(p) * (Number(l.quantity) || 0) : null; });
          var valid = totals.filter(function (x) { return x != null; }); var best = valid.length ? Math.min.apply(null, valid) : null;
          var cells = V.map(function (v, ci) { var t = totals[ci]; if (t != null) vt[v.partner_id] += t; var isB = best != null && t === best && valid.length > 1; return '<td class="num' + (isB ? " rfq-best" : "") + '"><input class="rfq-bid num" data-k="' + l.k + '" data-partner="' + v.partner_id + '" type="number" step="0.01" style="width:92px;text-align:right" value="' + (B[l.k + "|" + v.partner_id] != null ? B[l.k + "|" + v.partner_id] : "") + '"></td>'; }).join("");
          return '<tr><td>' + esc(l.description) + '</td><td class="num">' + (Number(l.quantity) || 0) + '</td>' + cells + '</tr>';
        }).join("");
        var cheapest = null, cmin = null; V.forEach(function (v) { var t = vt[v.partner_id]; if (t > 0 && (cmin === null || t < cmin)) { cmin = t; cheapest = v.partner_id; } });
        var totRow = '<td><b>Total</b></td><td></td>' + V.map(function (v) { return '<td class="num"><b>' + money(vt[v.partner_id]) + '</b></td>'; }).join("");
        var awRow = '<td></td><td></td>' + V.map(function (v) { return '<td class="num">' + (awarded ? (rfq.awarded_partner_id === v.partner_id ? '<span class="rfq-awarded">✓ Awarded</span>' : '') : '<button class="rfq-award btn' + (v.partner_id === cheapest ? " pri" : "") + '" data-partner="' + v.partner_id + '"' + (v.partner_id === cheapest ? ' style="background:var(--accent);border-color:var(--accent)"' : '') + '>Award</button>') + '</td>'; }).join("");
        matrix = '<h3 style="margin:20px 0 6px">Compare quotes</h3><div class="sub" style="margin:0 0 8px">Enter each supplier\'s unit price. The lowest price per line is highlighted; the cheapest supplier overall has the emphasised Award button. Awarding creates a draft PO to that supplier (tagged to this project + cost code).</div><div class="o-rt-wrap"><table class="o-list"><thead><tr>' + headRow + '</tr></thead><tbody>' + mrows + '</tbody><tfoot><tr style="border-top:2px solid var(--line)">' + totRow + '</tr><tr>' + awRow + '</tr></tfoot></table></div>';
      }
      var btns = awarded ? '<button id="rfq-reopen">Reopen</button>' : '<button class="pri" id="rfq-save">Save</button>';
      document.querySelector(".o-form").innerHTML = '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div></div><div class="o-sheet"><div class="o-title">' + esc(rfq.number || rfq.title || "New RFQ") + '</div>' + header + linesTbl + vendorsSec + matrix + '</div>';
      var addL = document.getElementById("rl-add"); if (addL) addL.onclick = function () { syncFromDom(); L.push({ k: kc++, description: "", unit: "", quantity: 1 }); draw(); };
      document.querySelectorAll(".rl-del").forEach(function (b) { b.onclick = function () { syncFromDom(); L.splice(Number(b.dataset.i), 1); if (!L.length) L = [{ k: kc++, description: "", unit: "", quantity: 1 }]; draw(); }; });
      var addV = document.getElementById("rfq-addv"); if (addV) addV.onchange = function () { if (!this.value) return; syncFromDom(); V.push({ partner_id: this.value }); draw(); };
      document.querySelectorAll(".rfq-vdel").forEach(function (b) { b.onclick = function () { syncFromDom(); V.splice(Number(b.dataset.i), 1); draw(); }; });
      document.querySelectorAll(".rfq-bid").forEach(function (inp) { inp.addEventListener("change", function () { syncFromDom(); draw(); }); });
      var sv = document.getElementById("rfq-save"); if (sv) sv.onclick = async function () { syncFromDom(); if (await persist()) { toast("Saved"); renderRFQForm(id); } };
      document.querySelectorAll(".rfq-award").forEach(function (b) { b.onclick = function () { award(b.dataset.partner); }; });
      var ro = document.getElementById("rfq-reopen"); if (ro) ro.onclick = async function () { await sb.from("rfqs").update({ status: "sent", awarded_partner_id: null }).eq("id", id); renderRFQForm(id); };
    }
    draw();
  }

  async function renderNumbering() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Document Numbering") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    resetSeqCache(); var cfg = await loadSeqCfg(); var yr = new Date().getFullYear();
    function preview(p, pad, uy) { return esc((p || "DOC") + (uy ? "/" + yr : "") + "/" + ("000000000" + 1).slice(-Math.max(1, pad || 4))); }
    var rows = DOC_TYPES.map(function (d) {
      var key = d[0], r = cfg[key] || {}; var p = r.prefix || key, pad = r.padding || 4, uy = r.use_year !== false;
      return '<tr data-key="' + key + '"><td><b>' + esc(d[1]) + '</b></td>' +
        '<td><input class="ns-prefix" aria-label="Prefix for ' + esc(d[1]) + '" value="' + esc(p) + '" style="width:96px"></td>' +
        '<td><input class="ns-pad" type="number" min="1" max="8" aria-label="Digits for ' + esc(d[1]) + '" value="' + pad + '" style="width:64px"></td>' +
        '<td style="text-align:center"><input class="ns-year" type="checkbox" aria-label="Include year for ' + esc(d[1]) + '"' + (uy ? " checked" : "") + '></td>' +
        '<td class="ns-prev muted" style="font-variant-numeric:tabular-nums">' + preview(p, pad, uy) + '</td></tr>';
    }).join("");
    document.getElementById("o-body").innerHTML = '<div style="padding:16px"><div class="card"><div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0">Document Numbering</h3><button class="pri" id="ns-save" style="margin-left:auto">Save</button></div>' +
      '<div class="sub" style="margin:6px 0 12px">Choose how each document is numbered. Changes affect new documents only, per company. Format is <b>PREFIX / year / running number</b>.</div>' +
      '<div class="o-rt-wrap"><table class="o-lines"><thead><tr><th>Document</th><th>Prefix</th><th>Digits</th><th style="text-align:center">Year</th><th>Next looks like</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
    function upd(tr) { tr.querySelector(".ns-prev").innerHTML = preview(tr.querySelector(".ns-prefix").value, parseInt(tr.querySelector(".ns-pad").value, 10) || 4, tr.querySelector(".ns-year").checked); }
    document.querySelectorAll("#o-body tbody tr").forEach(function (tr) { tr.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", function () { upd(tr); }); i.addEventListener("change", function () { upd(tr); }); }); });
    document.getElementById("ns-save").onclick = async function () {
      var ups = [].map.call(document.querySelectorAll("#o-body tbody tr"), function (tr) {
        var key = tr.dataset.key, lbl = (DOC_TYPES.filter(function (d) { return d[0] === key; })[0] || [])[1] || "";
        return { company_id: S.company.id, doc_type: key, label: lbl, prefix: (tr.querySelector(".ns-prefix").value || "").trim() || key, padding: Math.min(8, Math.max(1, parseInt(tr.querySelector(".ns-pad").value, 10) || 4)), use_year: tr.querySelector(".ns-year").checked };
      });
      var r = await sb.from("number_sequences").upsert(ups, { onConflict: "company_id,doc_type" });
      resetSeqCache();
      if (r.error) { toast("Save failed: " + errMsg(r.error)); return; }
      toast("Numbering saved");
    };
  }
  function isOverdue(dateStr) { var d = parseD(dateStr); var t0 = new Date(); t0.setHours(0, 0, 0, 0); return d && d < t0; }

  function cfgSubmittals() {
    return {
      title: "Submittals", pageSize: 80,
      fetch: function () { return sb.from("submittals").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.number || "") + " " + (s.title || "") + " " + (s.consultant || "") + " " + (s.projects ? s.projects.name : ""); },
      columns: [
        { label: "Number", get: function (s) { return '<b>' + esc(s.number || "/") + '</b>'; } },
        { label: "Title", get: function (s) { return esc(s.title); } },
        { label: "Type", get: function (s) { return subTypeLabel(s.doc_type); } },
        { label: "Rev", get: function (s) { return esc(s.revision || ""); } },
        { label: "Project", get: function (s) { return esc(s.projects ? s.projects.name : ""); } },
        { label: "Consultant", get: function (s) { return esc(s.consultant || ""); } },
        { label: "Status", get: function (s) { return subStatusBadge(s.status) + (isOverdue(s.due_date) && ["approved", "approved_comments", "superseded"].indexOf(s.status) < 0 ? ' <span class="ob-flag">overdue</span>' : ''); } }
      ],
      filters: [
        { label: "Open", test: function (s) { return ["approved", "superseded", "rejected"].indexOf(s.status) < 0; } },
        { label: "Approved", test: function (s) { return s.status === "approved" || s.status === "approved_comments"; } },
        { label: "Rejected", test: function (s) { return s.status === "rejected"; } },
        { label: "Overdue", test: function (s) { return isOverdue(s.due_date) && ["approved", "approved_comments", "superseded"].indexOf(s.status) < 0; } }
      ],
      groupBy: [{ label: "Project", get: function (s) { return s.projects ? s.projects.name : "None"; } }, { label: "Type", get: function (s) { return subTypeLabel(s.doc_type); } }, { label: "Status", get: function (s) { return s.status; } }],
      onOpen: function (s) { renderSubmittalForm(s.id); }, onNew: function () { renderSubmittalForm("new"); }
    };
  }
  async function renderSubmittalForm(id) {
    var parent = { action: "doc.subs", title: "Submittals" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var s = id === "new" ? { status: "draft", revision: "A", doc_type: "shop_drawing" } : (await sb.from("submittals").select("*").eq("id", id).maybeSingle()).data || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (s.number || s.title || "Submittal");
    var st = s.status || "draft", terminal = st === "superseded", dis = terminal ? " disabled" : "";
    var btns = terminal ? "" : '<button class="pri" id="sm-save">Save</button><button id="sm-discard">Discard</button>';
    if (id !== "new") {
      if (st === "draft") btns += '<button id="sm-submit">Submit to consultant</button>';
      if (st === "submitted") btns += '<button id="sm-approve">Approve</button><button id="sm-approvec">Approve w/ comments</button><button id="sm-reject">Reject</button>';
      if (["approved", "approved_comments", "rejected"].indexOf(st) >= 0) btns += '<button id="sm-rev">New revision</button>';
    }
    var stages = '<div class="o-stages"><span class="st ' + (st === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (st === "submitted" ? "on" : (["approved", "approved_comments", "rejected", "superseded"].indexOf(st) >= 0 ? "done" : "")) + '">Submitted</span><span class="st ' + (["approved", "approved_comments"].indexOf(st) >= 0 ? "on" : "") + '">' + (st === "rejected" ? "Rejected" : "Approved") + '</span></div>';
    var typeOpts = SUBMITTAL_TYPES.map(function (x) { return '<option value="' + x[0] + '"' + (s.doc_type === x[0] ? " selected" : "") + '>' + x[1] + '</option>'; }).join("");
    var projOpts = '<option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (s.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title"><input id="sm-title" value="' + esc(s.title || "") + '" placeholder="Submittal title"' + dis + '></div>' +
      '<div class="o-groups"><div>' +
      fld("Project", '<select id="sm-proj"' + dis + '>' + projOpts + '</select>', "Which project this document belongs to.") +
      fld("Type", '<select id="sm-type"' + dis + '>' + typeOpts + '</select>', "Shop drawing, material approval, sample, etc.") +
      fld("Revision", '<input id="sm-rev-in" value="' + esc(s.revision || "A") + '"' + dis + '>', "Revision letter/number of this document.") +
      fld("Reference", '<input id="sm-ref" value="' + esc(s.ref || "") + '"' + dis + '>', "Your drawing/document reference number.") +
      '</div><div>' +
      fld("Consultant", '<input id="sm-cons" value="' + esc(s.consultant || "") + '"' + dis + ' placeholder="Reviewing consultant">', "Who reviews and approves it.") +
      fld("Due date", '<input id="sm-due" type="date" value="' + (s.due_date || "") + '"' + dis + '>', "When you need the response by.") +
      fld("Submitted", '<span class="v">' + esc(s.submitted_date || "-") + '</span>') +
      fld("Response", '<span class="v">' + esc(s.response_date || "-") + '</span>') +
      '</div></div>' +
      fld("Notes", '<textarea id="sm-notes" rows="2"' + dis + '>' + esc(s.notes || "") + '</textarea>') +
      '</div>';
    var db = document.getElementById("sm-discard"); if (db) db.onclick = function () { go("doc.subs"); };
    async function persist(extra) {
      var row = Object.assign({ title: gv("sm-title") || "Submittal", project_id: (document.getElementById("sm-proj") || {}).value || null, doc_type: (document.getElementById("sm-type") || {}).value || "shop_drawing", revision: gv("sm-rev-in") || "A", ref: gv("sm-ref"), consultant: gv("sm-cons"), due_date: gv("sm-due") || null, notes: (document.getElementById("sm-notes") || {}).value || "" }, extra || {});
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.status = "draft"; row.number = await nextDocNumber("submittals", "SUB"); var ins = await sb.from("submittals").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("submittals").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    function wire(bid, extra, msg) { var b = document.getElementById(bid); if (b) b.onclick = async function () { var sid = await persist(extra); if (sid) { toast(msg); renderSubmittalForm(sid); } }; }
    var sv = document.getElementById("sm-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderSubmittalForm(sid); } };
    wire("sm-submit", { status: "submitted", submitted_date: today() }, "Submitted");
    wire("sm-approve", { status: "approved", response_date: today() }, "Approved");
    wire("sm-approvec", { status: "approved_comments", response_date: today() }, "Approved with comments");
    wire("sm-reject", { status: "rejected", response_date: today() }, "Rejected");
    var rv = document.getElementById("sm-rev"); if (rv) rv.onclick = async function () {
      await persist({ status: "superseded" });
      var copy = { company_id: S.company.id, project_id: (document.getElementById("sm-proj") || {}).value || null, title: gv("sm-title") || "Submittal", doc_type: (document.getElementById("sm-type") || {}).value, revision: nextRev(gv("sm-rev-in")), ref: gv("sm-ref"), consultant: gv("sm-cons"), status: "draft", number: await nextDocNumber("submittals", "SUB") };
      var ins = await sb.from("submittals").insert(copy).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return; }
      toast("New revision " + copy.revision + " created"); renderSubmittalForm(ins.data.id);
    };
  }

  function cfgRfis() {
    return {
      title: "RFIs", pageSize: 80,
      fetch: function () { return sb.from("rfis").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (r) { return (r.number || "") + " " + (r.subject || "") + " " + (r.discipline || "") + " " + (r.projects ? r.projects.name : ""); },
      columns: [
        { label: "Number", get: function (r) { return '<b>' + esc(r.number || "/") + '</b>'; } },
        { label: "Subject", get: function (r) { return esc(r.subject); } },
        { label: "Project", get: function (r) { return esc(r.projects ? r.projects.name : ""); } },
        { label: "Discipline", get: function (r) { return esc(r.discipline || ""); } },
        { label: "Needed by", get: function (r) { return '<span class="muted">' + esc(r.needed_by || "") + '</span>'; } },
        { label: "Status", get: function (r) { return rfiStatusBadge(r.status) + (r.status === "open" && isOverdue(r.needed_by) ? ' <span class="ob-flag">overdue</span>' : ''); } }
      ],
      filters: [
        { label: "Open", test: function (r) { return r.status === "open"; } },
        { label: "Answered", test: function (r) { return r.status === "answered"; } },
        { label: "Closed", test: function (r) { return r.status === "closed"; } },
        { label: "Overdue", test: function (r) { return r.status === "open" && isOverdue(r.needed_by); } }
      ],
      groupBy: [{ label: "Project", get: function (r) { return r.projects ? r.projects.name : "None"; } }, { label: "Status", get: function (r) { return r.status; } }, { label: "Discipline", get: function (r) { return r.discipline || "None"; } }],
      onOpen: function (r) { renderRfiForm(r.id); }, onNew: function () { renderRfiForm("new"); }
    };
  }
  async function renderRfiForm(id) {
    var parent = { action: "doc.rfis", title: "RFIs" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var r = id === "new" ? { status: "open", raised_date: today() } : (await sb.from("rfis").select("*").eq("id", id).maybeSingle()).data || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (r.number || r.subject || "RFI");
    var st = r.status || "open";
    var btns = '<button class="pri" id="rf-save">Save</button><button id="rf-discard">Discard</button>';
    if (id !== "new" && st === "open") btns += '<button id="rf-answer">Mark answered</button>';
    if (id !== "new" && st === "answered") btns += '<button id="rf-close">Close</button><button id="rf-reopen">Reopen</button>';
    var stages = '<div class="o-stages"><span class="st ' + (st === "open" ? "on" : "done") + '">Open</span><span class="st ' + (st === "answered" ? "on" : (st === "closed" ? "done" : "")) + '">Answered</span><span class="st ' + (st === "closed" ? "on" : "") + '">Closed</span></div>';
    var projOpts = '<option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (r.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title"><input id="rf-subj" value="' + esc(r.subject || "") + '" placeholder="RFI subject"></div>' +
      '<div class="o-groups"><div>' +
      fld("Project", '<select id="rf-proj">' + projOpts + '</select>', "Which project this query is about.") +
      fld("Discipline", '<input id="rf-disc" value="' + esc(r.discipline || "") + '" placeholder="e.g. Structural, Facade">', "Trade or discipline the query concerns.") +
      '</div><div>' +
      fld("Raised date", '<input id="rf-raised" type="date" value="' + (r.raised_date || today()) + '">', "When the query was raised.") +
      fld("Needed by", '<input id="rf-needed" type="date" value="' + (r.needed_by || "") + '">', "Date an answer is required to avoid delay.") +
      '</div></div>' +
      fld("Question", '<textarea id="rf-q" rows="3" placeholder="What needs clarifying?">' + esc(r.question || "") + '</textarea>') +
      fld("Answer", '<textarea id="rf-a" rows="3" placeholder="Consultant response">' + esc(r.answer || "") + '</textarea>') +
      (r.answered_date ? '<div class="sub">Answered ' + esc(r.answered_date) + '</div>' : '') +
      '</div>';
    document.getElementById("rf-discard").onclick = function () { go("doc.rfis"); };
    async function persist(extra) {
      var row = Object.assign({ subject: gv("rf-subj") || "RFI", project_id: (document.getElementById("rf-proj") || {}).value || null, discipline: gv("rf-disc"), raised_date: gv("rf-raised") || null, needed_by: gv("rf-needed") || null, question: (document.getElementById("rf-q") || {}).value || "", answer: (document.getElementById("rf-a") || {}).value || "" }, extra || {});
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.status = "open"; row.number = await nextDocNumber("rfis", "RFI"); var ins = await sb.from("rfis").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("rfis").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    document.getElementById("rf-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderRfiForm(sid); } };
    var an = document.getElementById("rf-answer"); if (an) an.onclick = async function () { if (!((document.getElementById("rf-a") || {}).value || "").trim()) { toast("Enter the answer first"); return; } var sid = await persist({ status: "answered", answered_date: today() }); if (sid) { toast("Marked answered"); renderRfiForm(sid); } };
    var cl = document.getElementById("rf-close"); if (cl) cl.onclick = async function () { var sid = await persist({ status: "closed" }); if (sid) { toast("Closed"); renderRfiForm(sid); } };
    var ro = document.getElementById("rf-reopen"); if (ro) ro.onclick = async function () { var sid = await persist({ status: "open" }); if (sid) { toast("Reopened"); renderRfiForm(sid); } };
  }

  function cfgTransmittals() {
    return {
      title: "Transmittals", pageSize: 80,
      fetch: function () { return sb.from("transmittals").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (t) { return (t.number || "") + " " + (t.to_party || "") + " " + (t.purpose || "") + " " + (t.projects ? t.projects.name : ""); },
      columns: [
        { label: "Number", get: function (t) { return '<b>' + esc(t.number || "/") + '</b>'; } },
        { label: "To", get: function (t) { return esc(t.to_party || ""); } },
        { label: "Project", get: function (t) { return esc(t.projects ? t.projects.name : ""); } },
        { label: "Purpose", get: function (t) { return esc(t.purpose || ""); } },
        { label: "Date", get: function (t) { return '<span class="muted">' + esc(t.transmittal_date || "") + '</span>'; } }
      ],
      groupBy: [{ label: "Project", get: function (t) { return t.projects ? t.projects.name : "None"; } }],
      onOpen: function (t) { renderTransmittalForm(t.id); }, onNew: function () { renderTransmittalForm("new"); }
    };
  }
  async function renderTransmittalForm(id) {
    var parent = { action: "doc.trans", title: "Transmittals" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var t = id === "new" ? { transmittal_date: today() } : (await sb.from("transmittals").select("*, projects(name)").eq("id", id).maybeSingle()).data || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var items = id === "new" ? [] : (await sb.from("transmittal_items").select("*").eq("transmittal_id", id).order("sequence")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (t.number || "Transmittal");
    function rowHtml(it) { it = it || {}; return '<tr><td><input class="ti-desc" value="' + esc(it.description || "") + '" placeholder="Document"></td><td><input class="ti-ref" value="' + esc(it.doc_ref || "") + '" placeholder="Ref"></td><td><input class="ti-rev" value="' + esc(it.revision || "") + '" placeholder="Rev" style="width:60px"></td><td><input class="ti-cop" type="number" value="' + (it.copies || 1) + '" style="width:70px"></td><td><button class="ti-del" style="border:none;background:none;color:var(--bad);cursor:pointer;font-size:16px">&times;</button></td></tr>'; }
    var projOpts = '<option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (t.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    var btns = '<button class="pri" id="tr-save">Save</button><button id="tr-discard">Discard</button>' + (id !== "new" ? '<button id="tr-print">Print</button>' : '');
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div><div></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="tr-to" value="' + esc(t.to_party || "") + '" placeholder="Recipient (consultant / client)"></div>' +
      '<div class="o-groups"><div>' +
      fld("Project", '<select id="tr-proj">' + projOpts + '</select>', "Which project these documents relate to.") +
      fld("Purpose", '<input id="tr-purpose" value="' + esc(t.purpose || "") + '" placeholder="e.g. For approval, For construction">', "Why you are sending them.") +
      '</div><div>' +
      fld("Date", '<input id="tr-date" type="date" value="' + (t.transmittal_date || today()) + '">', "Date of transmittal.") +
      fld("Notes", '<input id="tr-notes" value="' + esc(t.notes || "") + '">', "Any covering note.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Documents transmitted</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Document</th><th>Ref</th><th>Rev</th><th>Copies</th><th></th></tr></thead><tbody id="tr-lines">' + (items.length ? items.map(rowHtml).join("") : rowHtml()) + '</tbody></table><button id="tr-add" class="o-addln">+ Add document</button></div></div>' +
      '</div>';
    document.getElementById("tr-discard").onclick = function () { go("doc.trans"); };
    function wireDel() { document.querySelectorAll("#tr-lines .ti-del").forEach(function (b) { b.onclick = function () { b.closest("tr").remove(); }; }); }
    wireDel();
    document.getElementById("tr-add").onclick = function () { var tb = document.getElementById("tr-lines"); tb.insertAdjacentHTML("beforeend", rowHtml()); wireDel(); };
    function readItems() { return [].map.call(document.querySelectorAll("#tr-lines tr"), function (tr, i) { return { description: (tr.querySelector(".ti-desc") || {}).value || "", doc_ref: (tr.querySelector(".ti-ref") || {}).value || "", revision: (tr.querySelector(".ti-rev") || {}).value || "", copies: parseInt((tr.querySelector(".ti-cop") || {}).value, 10) || 1, sequence: (i + 1) * 10 }; }).filter(function (it) { return it.description.trim(); }); }
    async function persist() {
      var row = { to_party: gv("tr-to"), project_id: (document.getElementById("tr-proj") || {}).value || null, purpose: gv("tr-purpose"), transmittal_date: gv("tr-date") || null, notes: gv("tr-notes") };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.number = await nextDocNumber("transmittals", "TR"); var ins = await sb.from("transmittals").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("transmittals").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      await sb.from("transmittal_items").delete().eq("transmittal_id", sid);
      var its = readItems().map(function (it) { it.company_id = S.company.id; it.transmittal_id = sid; return it; });
      if (its.length) { var ir = await sb.from("transmittal_items").insert(its); if (ir.error) { toast(errMsg(ir.error)); return null; } }
      return sid;
    }
    document.getElementById("tr-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderTransmittalForm(sid); } };
    var pr = document.getElementById("tr-print"); if (pr) pr.onclick = function () { printTransmittal(t, readItems(), (t.projects ? t.projects.name : "")); };
  }
  function printTransmittal(t, items, projName) {
    var co = S.company;
    var body = items.map(function (it, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(it.description) + '</td><td>' + esc(it.doc_ref || "") + '</td><td>' + esc(it.revision || "") + '</td><td class="r">' + (it.copies || 1) + '</td></tr>'; }).join("");
    var html = '<div class="pinv">' +
      '<div class="phead"><div class="pfrom"><div class="pname">' + esc(co.name) + '</div><div class="pmuted">' + esc(co.legal_name || "") + (co.country ? "<br>" + esc(co.country) : "") + '</div></div>' +
      '<div class="pdoc"><div class="pdt">Transmittal</div><div class="pnum">' + esc(t.number || "Draft") + '</div></div></div>' +
      '<div class="pmeta"><div><div class="pl">To</div><div class="pv">' + esc(t.to_party || "") + '</div>' + (projName ? '<div class="pl" style="margin-top:8px">Project</div><div class="pv">' + esc(projName) + '</div>' : '') + '</div>' +
      '<div><div class="pl">Date</div><div class="pv">' + esc(t.transmittal_date || "") + '</div><div class="pl" style="margin-top:8px">Purpose</div><div class="pv">' + esc(t.purpose || "") + '</div></div></div>' +
      '<table class="ptab"><thead><tr><th>#</th><th>Document</th><th>Ref</th><th>Rev</th><th class="r">Copies</th></tr></thead><tbody>' + (body || '<tr><td colspan="5">No documents listed</td></tr>') + '</tbody></table>' +
      (t.notes ? '<div class="pmuted" style="margin-top:12px">' + esc(t.notes) + '</div>' : '') +
      '<div class="pfoot">' + esc(co.name) + ' &middot; Generated by Orbit</div></div>';
    var wrap = document.createElement("div"); wrap.className = "o-print"; wrap.innerHTML = html;
    document.body.appendChild(wrap); document.body.classList.add("printing"); window.print();
    setTimeout(function () { document.body.classList.remove("printing"); wrap.remove(); }, 400);
  }

  // ============================ EXECUTIVE COCKPIT (group-wide) ============================
  async function renderCockpit() {
    var ref = (S.org && S.org.ref_currency) || S.company.currency_code || "USD";
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Cockpit") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Loading group cockpit...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var coIds = S.companies.map(function (c) { return c.id; });
    var rates = (await sb.from("currency_rates").select("code,rate,rate_date").eq("org_id", S.org.id).order("rate_date", { ascending: false })).data || [];
    var rateMap = {}; rates.forEach(function (r) { if (rateMap[r.code] === undefined) rateMap[r.code] = Number(r.rate); }); rateMap[ref] = 1;
    var factorByCo = {}, missing = {}; S.companies.forEach(function (c) { var f = c.currency_code === ref ? 1 : rateMap[c.currency_code]; if (f === undefined) { missing[c.currency_code] = 1; f = 1; } factorByCo[c.id] = f; });
    var fx = function (coId, v) { return Number(v || 0) * (factorByCo[coId] || 1); };
    var projs = (await sb.from("projects").select("id,name,contract_value,company_id").in("company_id", coIds).eq("is_active", true)).data || [];
    var certs = (await sb.from("project_certificates").select("project_id,current_certified,state,company_id").in("company_id", coIds)).data || [];
    var buds = (await sb.from("project_budgets").select("project_id,amount,company_id").in("company_id", coIds)).data || [];
    var billLines = (await sb.from("invoice_lines").select("price_subtotal, invoices!inner(project_id,move_type,state,company_id)").in("invoices.company_id", coIds).eq("invoices.move_type", "in_invoice").eq("invoices.state", "posted").not("invoices.project_id", "is", null)).data || [];
    var issues = (await sb.from("stock_moves").select("quantity,project_id,company_id,products(cost_price)").in("company_id", coIds).not("project_id", "is", null)).data || [];
    var labour = (await sb.from("install_jobs").select("project_id,labour_cost,company_id").in("company_id", coIds).not("project_id", "is", null)).data || [];
    var overdue = (await sb.from("invoices").select("amount_residual,due_date,company_id").in("company_id", coIds).eq("state", "posted").eq("move_type", "out_invoice").gt("amount_residual", 0.005)).data || [];
    var tenders = (await sb.from("tenders").select("status,company_id").in("company_id", coIds)).data || [];
    var contracts = (await sb.from("hr_contracts").select("wage,company_id").in("company_id", coIds).eq("state", "running")).data || [];
    var projById = {}; projs.forEach(function (p) { projById[p.id] = { p: p, cert: 0, bud: 0, act: 0 }; });
    certs.forEach(function (c) { if (c.state !== "draft" && projById[c.project_id]) projById[c.project_id].cert += fx(c.company_id, c.current_certified); });
    buds.forEach(function (b) { if (projById[b.project_id]) projById[b.project_id].bud += fx(b.company_id, b.amount); });
    billLines.forEach(function (l) { var pid = l.invoices && l.invoices.project_id; if (pid && projById[pid]) projById[pid].act += fx(l.invoices.company_id, l.price_subtotal); });
    issues.forEach(function (m) { if (projById[m.project_id]) projById[m.project_id].act += fx(m.company_id, Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0)); });
    labour.forEach(function (l) { if (projById[l.project_id]) projById[l.project_id].act += fx(l.company_id, l.labour_cost); });
    var backlog = 0, overBudget = [], marginRisk = [], byCo = {};
    S.companies.forEach(function (c) { byCo[c.id] = { name: c.name, cur: c.currency_code, active: 0, over: 0, risk: 0, cash: 0, backlog: 0 }; });
    Object.keys(projById).forEach(function (k) {
      var o = projById[k], contract = fx(o.p.company_id, o.p.contract_value), bl = Math.max(0, contract - o.cert); backlog += bl;
      var co = byCo[o.p.company_id]; co.active++; co.backlog += bl;
      if (o.bud > 0 && o.act > o.bud + 0.005) { overBudget.push(o.p.name); co.over++; }
      if (o.cert > 0 && (o.cert - o.act) < 0) { marginRisk.push(o.p.name); co.risk++; }
    });
    var t0 = new Date(); t0.setHours(0, 0, 0, 0);
    var overdueTot = 0; overdue.forEach(function (d) { var pd = parseD(d.due_date); if (pd && pd < t0) overdueTot += fx(d.company_id, d.amount_residual); });
    var payroll = 0; contracts.forEach(function (c) { payroll += fx(c.company_id, c.wage); });
    var tOpen = 0, tWon = 0, tLost = 0; tenders.forEach(function (t) { if (t.status === "draft" || t.status === "submitted") tOpen++; else if (t.status === "won") tWon++; else if (t.status === "lost") tLost++; });
    var winRate = (tWon + tLost) > 0 ? Math.round(tWon / (tWon + tLost) * 100) : 0;
    var cashTot = 0;
    for (var i = 0; i < S.companies.length; i++) { var c = S.companies[i]; var tb = (await sb.rpc("trial_balance", { p_company: c.id })).data || []; var csh = 0; tb.forEach(function (r) { var code = String(r.code || ""); if (code.charAt(0) === "5" && (code.charAt(1) === "1" || code.charAt(1) === "3")) csh += Number(r.balance || 0); }); byCo[c.id].cash = fx(c.id, csh); cashTot += byCo[c.id].cash; }
    var card = function (l, v, sub, go2, col) { return '<div class="cp-card"' + (go2 ? ' data-go="' + go2 + '" style="cursor:pointer"' : '') + '><div class="l">' + l + '</div><div class="n"' + (col ? ' style="color:' + col + '"' : '') + '>' + v + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div>'; };
    var mny = function (v) { return ref + ' ' + money(v); };
    var missKeys = Object.keys(missing);
    var coRows = S.companies.map(function (c) { var b = byCo[c.id]; return '<tr><td>' + esc(b.name) + '</td><td class="muted">' + esc(b.cur) + '</td><td class="num">' + money(b.backlog) + '</td><td class="num">' + money(b.cash) + '</td><td class="num">' + b.active + '</td><td class="num"' + (b.over ? ' style="color:var(--bad)"' : '') + '>' + b.over + '</td><td class="num"' + (b.risk ? ' style="color:var(--warn)"' : '') + '>' + b.risk + '</td></tr>'; }).join("");
    document.getElementById("rep").innerHTML =
      '<h1>Executive Cockpit</h1><div class="sub">' + esc(S.org ? S.org.name : "") + ' &middot; group-wide &middot; presented in ' + esc(ref) + ' &middot; as of ' + today() + '</div>' +
      (missKeys.length ? '<div class="ob-banner warn">No exchange rate for <b>' + esc(missKeys.join(", ")) + '</b> - those entities counted 1:1. Add a rate in Exchange Rates for accurate group figures.</div>' : '') +
      '<div class="cp-grid">' +
        card("Signed backlog", mny(backlog), "contract value not yet certified", "proj.pnl") +
        card("Cash position", mny(cashTot), "bank + cash, all entities", null, cashTot < 0 ? 'var(--bad)' : '') +
        card("Overdue receivables", mny(overdueTot), "past due, chase these", "rep.collections", overdueTot > 0 ? 'var(--bad)' : 'var(--good)') +
        card("Monthly payroll", mny(payroll), "running contracts", "hr.runs") +
        card("Open tenders", tOpen, "in the pipeline", "est.list") +
        card("Tender win rate", winRate + '%', tWon + " won / " + tLost + " lost", "est.list") +
      '</div>' +
      (overBudget.length || marginRisk.length ? '<div class="ob-banner" style="margin-top:14px">' + (overBudget.length ? '! Over budget: <b>' + overBudget.map(esc).join(", ") + '</b>' : '') + (overBudget.length && marginRisk.length ? ' &nbsp;|&nbsp; ' : '') + (marginRisk.length ? 'Margin at risk: <b>' + marginRisk.map(esc).join(", ") + '</b>' : '') + '</div>' : '<div class="ob-banner" style="background:var(--good-s);border-color:var(--good);color:var(--good);margin-top:14px">All active projects within budget.</div>') +
      '<h3 style="font-size:14px;margin:20px 0 6px">By entity</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Entity</td><td>Cur</td><td class="num">Backlog</td><td class="num">Cash</td><td class="num">Active</td><td class="num">Over budget</td><td class="num">Margin risk</td></tr></thead><tbody>' + coRows + '</tbody></table></div>' +
      '<div class="sub" style="margin-top:8px">Backlog = signed contract value minus certified to date. Over budget = actual cost above the cost budget. Margin at risk = certified revenue below actual cost. Figures translated to ' + esc(ref) + ' at your exchange rates.</div>';
    document.querySelectorAll(".cp-card[data-go]").forEach(function (el) { el.onclick = function () { go(el.dataset.go); }; });
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
        if (ins.error) { toast("Could not save: " + errMsg(ins.error)); return; }
        var sid = ins.data.id;
        var rows = Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) { return { statement_id: sid, company_id: S.company.id, line_date: tr.querySelector(".l-date").value, label: tr.querySelector(".l-label").value.trim(), amount: parseFloat(tr.querySelector(".l-amt").value) || 0 }; }).filter(function (r) { return r.amount || r.label; });
        if (rows.length) { var lr = await sb.from("bank_statement_lines").insert(rows); if (lr.error) { toast("Lines failed: " + errMsg(lr.error)); return; } }
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
          if (r.error) { toast("Could not reconcile: " + errMsg(r.error)); b.disabled = false; b.textContent = "Reconcile"; return; }
          toast("Reconciled to the ledger"); renderBankStatementForm(id);
        };
      });
      document.getElementById("al-add").onclick = async function () {
        var amt = parseFloat(document.getElementById("al-amt").value) || 0, label = document.getElementById("al-label").value.trim();
        if (!amt && !label) { toast("Enter a line"); return; }
        var r = await sb.from("bank_statement_lines").insert({ statement_id: id, company_id: S.company.id, line_date: document.getElementById("al-date").value, label: label, amount: amt });
        if (r.error) { toast("Could not add: " + errMsg(r.error)); return; }
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
      ["spacework", "Space Work", ["#fafaf8", "#2f6bff", "#16171c"]],
      ["system", "System", ["#fafaf8", "#2f6bff", "#16171c"]],
      ["light", "Light", ["#ffffff", "#2f6bff", "#16171c"]],
      ["dark", "Dark", ["#16181f", "#6f9bff", "#0c0d12"]],
      ["corporate", "Corporate", ["#eef1f5", "#1f4e79", "#1f4e79"]],
      ["colorful", "Colorful", ["#f6f4ff", "#7c3aed", "#db2777"]],
      ["blue", "Blue", ["#eef4fc", "#2563eb", "#1d4ed8"]],
      ["pink", "Pink", ["#fdf2f7", "#db2777", "#be185d"]]
    ];
    var FONTS = [["system", "System"], ["onest", "Onest"], ["rounded", "Rounded"], ["serif", "Serif"], ["mono", "Mono"]];
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
    if (!whs.length) { var w = await sb.from("warehouses").insert({ company_id: S.company.id, name: "Main Warehouse", code: "WH" }).select("id,name,code").single(); if (w.error) { toast("Inventory setup failed: " + errMsg(w.error)); return null; } whs = [w.data]; }
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
      '<button class="o-new" id="i-recv">Receive</button><button class="btn" id="i-issue">Issue to Project</button><button class="btn" id="i-deliv">Deliver</button><button class="btn" id="i-xfer">Transfer</button><button class="btn" id="i-adj">Adjust</button>' +
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
    var b = { "i-recv": "receive", "i-issue": "issue", "i-deliv": "deliver", "i-xfer": "transfer", "i-adj": "adjust" };
    Object.keys(b).forEach(function (id) { var el = document.getElementById(id); if (el) el.onclick = function () { openStockModal(b[id], prods); }; });
  }
  async function openStockModal(kind, prods) {
    var titles = { receive: "Receive stock", deliver: "Deliver stock", adjust: "Inventory adjustment", transfer: "Internal transfer", issue: "Issue material to a project", scrap: "Scrap / write-off" };
    var storable = prods.filter(function (p) { return p.type === "storable" || p.type === "consumable"; });
    if (!storable.length) storable = prods;
    if (!storable.length) { toast("Add a product first (Products screen)"); return; }
    var inv = await ensureInventory(); if (!inv) return;
    if (kind === "transfer" && inv.internal.length < 2) { toast("Add a second location first (Configuration > Locations)"); return; }
    var issueProjs = [];
    if (kind === "issue") {
      issueProjs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
      if (!issueProjs.length) { toast("Create a project first (Projects app)"); return; }
    }
    var m = document.createElement("div"); m.className = "modal on"; m.id = "stockmodal";
    var opts = storable.map(function (p) { return '<option value="' + p.id + '">' + esc((p.default_code ? "[" + p.default_code + "] " : "") + p.name) + '</option>'; }).join("");
    var locOpts = inv.internal.map(function (l) { return '<option value="' + l.id + '">' + esc(l.name) + '</option>'; }).join("");
    var projField = kind === "issue" ? '<div><label>Project / site</label>' + fhint("__kproj", "The project the material is consumed on. The cost is booked against it.") + '<select id="k-proj">' + issueProjs.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join("") + '</select></div>' : "";
    var locField = "";
    if (kind === "transfer") locField = '<div class="row2"><div><label>From location</label>' + fhint("__from", "The stock location the goods leave.") + '<select id="k-from">' + locOpts + '</select></div><div><label>To location</label>' + fhint("__to", "The stock location the goods arrive at.") + '<select id="k-to">' + locOpts + '</select></div></div>';
    else if (inv.internal.length > 1) locField = '<div><label>' + (kind === "issue" ? "From location" : "Location") + '</label>' + fhint("__loc", kind === "issue" ? "The stock location the material leaves." : "Which warehouse / stock location this affects.") + '<select id="k-loc">' + locOpts + '</select></div>';
    var lotField = "";
    if (kind === "receive") lotField = '<div class="row2"><div><label>Lot / Serial (optional)</label>' + fhint("__lot", "A batch or serial number for traceability. Leave blank if not tracked.") + '<input id="k-lot" placeholder="e.g. LOT-2026-014"></div><div><label>Expiry (optional)</label>' + fhint("__exp", "Best-before / expiry date for this lot, if any.") + '<input id="k-exp" type="date"></div></div>';
    else if (kind === "deliver") lotField = '<div><label>Lot / Serial (optional)</label>' + fhint("__lot", "The batch/serial being shipped, for traceability.") + '<input id="k-lot" placeholder="lot shipped"></div>';
    m.innerHTML = '<div class="sheet"><h3>' + titles[kind] + '</h3><div class="form">' +
      '<div><label>Product</label>' + fhint("Product", "The storable item you are moving. Only stockable products appear here.") + '<select id="k-prod">' + opts + '</select></div>' + projField + locField +
      '<div><label>' + (kind === "adjust" ? "Counted quantity on hand" : "Quantity") + '</label>' + fhint("__kqty", kind === "adjust" ? "The actual quantity you counted. We adjust stock to match it." : (kind === "receive" ? "How many units are coming into stock." : kind === "deliver" ? "How many units are leaving stock." : kind === "issue" ? "How many units are issued to the project." : "How many units to move between the two locations.")) + '<input id="k-qty" type="number" step="0.01" value="' + (kind === "adjust" ? "0" : "1") + '"></div>' + lotField +
      '</div><div class="foot"><button class="btn" id="k-cancel">Cancel</button><button class="btn pri" id="k-save" style="background:var(--app);border-color:var(--app)">' + (kind === "adjust" ? "Apply" : kind === "transfer" ? "Transfer" : "Confirm") + '</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("k-cancel").onclick = function () { m.remove(); };
    document.getElementById("k-save").onclick = async function () {
      var pid = document.getElementById("k-prod").value, qty = parseFloat(document.getElementById("k-qty").value);
      if (isNaN(qty)) { toast("Enter a quantity"); return; }
      var loc = document.getElementById("k-loc") ? document.getElementById("k-loc").value : inv.stock;
      var projId = (kind === "issue" && document.getElementById("k-proj")) ? document.getElementById("k-proj").value : null;
      var src, dest, q = qty, vkind = null;
      if (kind === "receive") { src = inv.supplier; dest = loc; vkind = "receive"; if (!(q > 0)) { toast("Quantity must be positive"); return; } }
      else if (kind === "deliver") { src = loc; dest = inv.customer; vkind = "deliver"; if (!(q > 0)) { toast("Quantity must be positive"); return; } }
      else if (kind === "issue") { src = loc; dest = inv.customer; vkind = "deliver"; if (!(q > 0)) { toast("Quantity must be positive"); return; } if (!projId) { toast("Pick a project"); return; } }
      else if (kind === "transfer") { var from = document.getElementById("k-from").value, to = document.getElementById("k-to").value; if (from === to) { toast("Pick two different locations"); return; } if (!(q > 0)) { toast("Quantity must be positive"); return; } src = from; dest = to; }
      else if (kind === "scrap") { src = loc; dest = inv.adjust; vkind = "adjust_down"; if (!(q > 0)) { toast("Quantity must be positive"); return; } }
      else { var cur = ((await onHandByLoc())[pid] || {})[loc] || 0; var diff = qty - cur; if (Math.abs(diff) < 0.0001) { toast("No change"); return; } if (diff > 0) { src = inv.adjust; dest = loc; q = diff; vkind = "adjust_up"; } else { src = loc; dest = inv.adjust; q = -diff; vkind = "adjust_down"; } }
      var r = await sb.from("stock_moves").insert({ company_id: S.company.id, product_id: pid, quantity: q, location_id: src, location_dest_id: dest, project_id: projId, state: "done", date: new Date().toISOString() }).select("id").single();
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      if (vkind) { var product = prods.filter(function (p) { return p.id === pid; })[0] || {}; await postStockValue(vkind, product, q, r.data && r.data.id, projId); }
      var lotName = document.getElementById("k-lot") ? document.getElementById("k-lot").value.trim() : "";
      if (lotName && r.data && r.data.id) { var lotId = await findOrCreateLot(pid, lotName, document.getElementById("k-exp") ? document.getElementById("k-exp").value : null); if (lotId) await sb.from("stock_move_lines").insert({ company_id: S.company.id, move_id: r.data.id, lot_id: lotId, quantity: q }); }
      m.remove(); toast(kind === "transfer" ? "Transferred between locations" : kind === "issue" ? "Material issued to project & posted" : kind === "scrap" ? "Scrapped & written off to expense" : "Stock updated & posted to the ledger"); renderOnHand();
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
  async function postStockValue(kind, product, qty, moveId, projId) {
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
    var narr = (projId ? "Material issued: " : "Stock: ") + (product.name || "");
    var e = await sb.from("journal_entries").insert({ company_id: S.company.id, journal_id: a.journal, date: today(), ref: "", narration: narr, currency_code: S.company.currency_code, state: "draft", source_type: projId ? "material_issue" : "stock", source_id: moveId ? String(moveId) : "" }).select("id").single();
    if (e.error) { toast("Stock saved; GL entry failed: " + errMsg(e.error)); return; }
    var eid = e.data.id;
    var lr = await sb.from("journal_lines").insert([{ entry_id: eid, company_id: S.company.id, account_id: dr, label: product.name || "", debit: value, credit: 0 }, { entry_id: eid, company_id: S.company.id, account_id: cr, label: product.name || "", debit: 0, credit: value }]);
    if (lr.error) { toast("Stock saved; GL lines failed: " + errMsg(lr.error)); return; }
    var pr = await sb.rpc("post_entry", { p_entry: eid });
    if (pr.error) { toast("Stock saved; GL post failed: " + errMsg(pr.error)); return; }
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
  // ---- Material issues to projects (site consumption) ----
  function cfgMaterialIssues() {
    return {
      title: "Material Issues", pageSize: 80, newLabel: "Issue to Project",
      fetch: function () {
        return sb.from("stock_moves").select("*, products(name,cost_price), projects(name)").eq("company_id", S.company.id).not("project_id", "is", null).order("date", { ascending: false }).then(function (r) { return r.data || []; });
      },
      searchText: function (m) { return (m.products ? m.products.name : "") + " " + (m.projects ? m.projects.name : ""); },
      columns: [
        { label: "Date", get: function (m) { return '<span class="muted">' + esc((m.date || "").slice(0, 10)) + '</span>'; } },
        { label: "Material", get: function (m) { return '<b>' + esc(m.products ? m.products.name : "") + '</b>'; } },
        { label: "Project / site", get: function (m) { return esc(m.projects ? m.projects.name : ""); } },
        { label: "Quantity", num: true, get: function (m) { return Number(m.quantity); } },
        { label: "Cost value", num: true, get: function (m) { return money(Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0)); } }
      ],
      groupBy: [{ label: "Project", get: function (m) { return m.projects ? m.projects.name : "None"; } }, { label: "Month", get: function (m) { return (m.date || "").slice(0, 7); } }],
      onNew: function () { renderOnHand(); setTimeout(function () { var b = document.getElementById("i-issue"); if (b) b.click(); }, 250); }
    };
  }
  // ---- Product categories ----
  function cfgProductCategories() {
    return {
      title: "Product Categories", pageSize: 80,
      fetch: function () {
        return sb.from("product_categories").select("*").eq("company_id", S.company.id).order("name").then(function (r) {
          var rows = r.data || [], nm = {}; rows.forEach(function (c) { nm[c.id] = c.name; });
          return sb.from("products").select("category_id").eq("company_id", S.company.id).then(function (pr) {
            var cnt = {}; (pr.data || []).forEach(function (p) { if (p.category_id) cnt[p.category_id] = (cnt[p.category_id] || 0) + 1; });
            rows.forEach(function (c) { c._parent = c.parent_id ? nm[c.parent_id] : ""; c._count = cnt[c.id] || 0; }); return rows;
          });
        });
      },
      searchText: function (c) { return c.name || ""; },
      columns: [
        { label: "Category", get: function (c) { return '<b>' + esc(c.name) + '</b>'; } },
        { label: "Parent", get: function (c) { return esc(c._parent || ""); } },
        { label: "Products", num: true, get: function (c) { return c._count; } }
      ],
      onOpen: function (c) { openCategoryModal(c); }, onNew: function () { openCategoryModal(); }
    };
  }
  async function openCategoryModal(cat) {
    cat = cat || {};
    var cats = (await sb.from("product_categories").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (cat.id ? "Edit category" : "New category") + '</h3><div class="form">' +
      '<div><label>Name</label>' + fhint("__cn", "The material group, e.g. Aluminium, Glass, Hardware, Sealants, Steel.") + '<input id="c-name" value="' + esc(cat.name || "") + '"></div>' +
      '<div><label>Parent category</label>' + fhint("__cp", "Nest this under a broader group, if any.") + '<select id="c-parent"><option value="">None</option>' + cats.filter(function (x) { return x.id !== cat.id; }).map(function (x) { return '<option value="' + x.id + '"' + (cat.parent_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div>' +
      '</div><div class="foot"><button class="btn" id="c-cancel">Cancel</button><button class="btn pri" id="c-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("c-cancel").onclick = function () { m.remove(); };
    document.getElementById("c-save").onclick = async function () {
      var name = gv("c-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, parent_id: document.getElementById("c-parent").value || null };
      var r; if (cat.id) r = await sb.from("product_categories").update(row).eq("id", cat.id); else { row.company_id = S.company.id; r = await sb.from("product_categories").insert(row); }
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }
  // ---- Units of measure ----
  var UOM_CATS = ["unit", "length", "area", "volume", "weight"];
  function cfgUoms() {
    return {
      title: "Units of Measure", pageSize: 120,
      fetch: function () { return sb.from("uoms").select("*").eq("company_id", S.company.id).order("category").order("name").then(function (r) { return r.data || []; }); },
      searchText: function (u) { return (u.name || "") + " " + (u.category || ""); },
      columns: [
        { label: "Unit", get: function (u) { return '<b>' + esc(u.name) + '</b>'; } },
        { label: "Type", get: function (u) { return esc(u.category || "unit"); } },
        { label: "Status", get: function (u) { return u.is_active === false ? '<span class="badge">Archived</span>' : '<span class="badge paid">Active</span>'; } }
      ],
      groupBy: [{ label: "Type", get: function (u) { return u.category || "unit"; } }],
      onOpen: function (u) { openUomModal(u); }, onNew: function () { openUomModal(); }
    };
  }
  async function openUomModal(u) {
    u = u || {};
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (u.id ? "Edit unit" : "New unit") + '</h3><div class="form">' +
      '<div class="row2"><div><label>Name</label>' + fhint("__un", "Short symbol, e.g. m2, kg, tube, box, sheet.") + '<input id="u-name" value="' + esc(u.name || "") + '"></div>' +
      '<div><label>Type</label>' + fhint("__uc", "What it measures. Groups similar units together.") + '<select id="u-cat">' + UOM_CATS.map(function (c) { return '<option value="' + c + '"' + ((u.category || "unit") === c ? " selected" : "") + '>' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; }).join("") + '</select></div></div>' +
      '<div><label>Status</label>' + fhint("__us", "Archived units stay on history but are hidden from new pickers.") + '<select id="u-active"><option value="1"' + (u.is_active !== false ? " selected" : "") + '>Active</option><option value="0"' + (u.is_active === false ? " selected" : "") + '>Archived</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="u-cancel">Cancel</button><button class="btn pri" id="u-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("u-cancel").onclick = function () { m.remove(); };
    document.getElementById("u-save").onclick = async function () {
      var name = gv("u-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, category: document.getElementById("u-cat").value, is_active: document.getElementById("u-active").value === "1" };
      var r; if (u.id) r = await sb.from("uoms").update(row).eq("id", u.id); else { row.company_id = S.company.id; r = await sb.from("uoms").insert(row); }
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
    var needs = storable.map(function (p) { var r = ruleMap[p.id] || {}, min = Number(r.min_qty || 0), max = Number(r.max_qty || 0), q = oh[p.id] || 0; var need = (min > 0 && q < min) ? Math.max(max, min) - q : 0; return { p: p, need: need }; }).filter(function (x) { return x.need > 0; });
    body.innerHTML = '<div style="padding:16px"><div class="card"><h3 style="display:flex;align-items:center;gap:10px">Reordering rules &amp; low stock <span class="muted" style="font-weight:500;font-size:12px">set a Min and Max per product &middot; on-hand below Min flags a reorder up to Max</span>' + (needs.length ? '<button class="btn sm pri" id="rr-sched" style="margin-left:auto;background:var(--accent);border-color:var(--accent)">Run scheduler (' + needs.length + ')</button>' : '') + '</h3>' +
      '<table><thead><tr><th>Reference</th><th>Product</th><th class="num">On Hand</th><th>Min</th><th>Max</th><th class="num">To Order</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    var schedBtn = document.getElementById("rr-sched");
    if (schedBtn) schedBtn.onclick = async function () {
      var num = await nextOrderNumber("purchase");
      var po = await sb.from("purchase_orders").insert({ company_id: S.company.id, number: num, state: "draft", date_order: today(), currency_code: S.company.currency_code, amount_untaxed: 0, amount_total: 0, note: "Auto-generated from replenishment" }).select("id").single();
      if (po.error) { toast(errMsg(po.error)); return; }
      var sub = 0, plines = needs.map(function (x, i) { var price = Number(x.p.cost_price || 0); sub += x.need * price; return { company_id: S.company.id, order_id: po.data.id, product_id: x.p.id, name: x.p.name, quantity: x.need, unit_price: price, price_subtotal: x.need * price, qty_received: 0, qty_billed: 0, sequence: (i + 1) * 10 }; });
      var lr = await sb.from("purchase_order_lines").insert(plines); if (lr.error) { toast(errMsg(lr.error)); return; }
      await sb.from("purchase_orders").update({ amount_untaxed: sub, amount_total: sub }).eq("id", po.data.id);
      toast("Draft PO " + num + " created with " + needs.length + " items"); renderOrderForm(po.data.id, "purchase");
    };
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
    var srcTender = (id !== "new" && p.source_tender_id) ? (await sb.from("tenders").select("id,number,name").eq("id", p.source_tender_id).maybeSingle()).data : null;
    var customers = (await sb.from("partners").select("id,name").eq("is_customer", true).order("name")).data || [];
    var tasks = id === "new" ? [] : (await sb.from("project_tasks").select("*").eq("project_id", id).order("created_at")).data || [];
    var ts = id === "new" ? [] : (await sb.from("timesheets").select("id,hours,task_id,is_invoiced").eq("project_id", id)).data || [];
    var hoursByTask = {}, totalHours = 0, unbilledHours = 0, unbilledIds = []; ts.forEach(function (t) { hoursByTask[t.task_id] = (hoursByTask[t.task_id] || 0) + Number(t.hours || 0); totalHours += Number(t.hours || 0); if (!t.is_invoiced) { unbilledHours += Number(t.hours || 0); unbilledIds.push(t.id); } });
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (p.name || "");
    var cc = S.company.currency_code;
    var boqTot = id === "new" ? 0 : ((await sb.from("project_boq").select("amount").eq("project_id", id)).data || []).reduce(function (s, x) { return s + Number(x.amount || 0); }, 0);
    var certTot = id === "new" ? 0 : ((await sb.from("project_certificates").select("current_certified,state").eq("project_id", id)).data || []).filter(function (x) { return x.state !== "draft"; }).reduce(function (s, x) { return s + Number(x.current_certified || 0); }, 0);
    var smart = id !== "new" ? '<div class="o-smart">' +
      '<button class="sb" id="pf-sm-boq"><span class="v">' + cc + " " + money(boqTot > 0 ? boqTot : (p.contract_value || 0)) + '</span><span class="k">Contract' + (boqTot > 0 ? ' (BOQ)' : '') + '</span></button>' +
      '<button class="sb" id="pf-sm-cert"><span class="v">' + cc + " " + money(certTot) + '</span><span class="k">Certified</span></button>' +
      '<button class="sb" id="pf-sm-budget"><span class="v">&#9776;</span><span class="k">Cost budget</span></button>' +
      '<button class="sb"><span class="v">' + totalHours.toFixed(1) + '</span><span class="k">Hours</span></button></div>' : "";
    var custOpts = '<option value="">(none)</option>' + customers.map(function (c) { return '<option value="' + c.id + '"' + (p.partner_id === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>'; }).join("");
    var billOpts = Object.keys(BILLING).map(function (k) { return '<option value="' + k + '"' + (p.billing_type === k ? " selected" : "") + '>' + BILLING[k] + '</option>'; }).join("");
    var tasksTab = tasks.length ? '<table class="o-lines"><thead><tr><th>Task</th><th style="text-align:right">Planned h</th><th style="text-align:right">Logged h</th><th>Deadline</th></tr></thead><tbody>' + tasks.map(function (t) { return '<tr><td>' + esc(t.name) + '</td><td class="num">' + Number(t.planned_hours || 0) + '</td><td class="num">' + (hoursByTask[t.id] || 0).toFixed(1) + '</td><td class="muted">' + esc(t.date_deadline || "") + '</td></tr>'; }).join("") + '</tbody></table>' : '<div class="muted" style="padding:8px 0">No tasks yet. Add them in the Tasks screen.</div>';
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pf-save">Save</button><button id="pf-discard">Discard</button>' + (id !== "new" ? '<button id="pf-exec">Execution board</button>' : '') + (id !== "new" ? '<button id="pf-time">Log time</button>' : '') + (unbilledHours > 0.001 ? '<button id="pf-bill">Bill ' + unbilledHours.toFixed(1) + 'h</button>' : '') + '</div><div></div></div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title"><input id="pf-name" value="' + esc(p.name || "") + '" placeholder="Project name"></div>' +
      (srcTender ? '<div class="sub" style="margin:-2px 0 8px"><b>From tender:</b> <button class="lnk" id="pf-fromtender">' + esc(srcTender.number || srcTender.name || "tender") + '</button> &middot; budget &amp; BOQ carried from the estimate</div>' : '') +
      '<div class="o-groups"><div>' +
      fld("Customer", '<select id="pf-cust">' + custOpts + '</select>', "The client this project is delivered for.") +
      fld("Billing", '<select id="pf-bill">' + billOpts + '</select>', "How the project is billed: non-billable, fixed price, time & material, or milestones.") +
      '</div><div>' +
      fld("Start date", '<input id="pf-start" type="date" value="' + (p.date_start || "") + '">', "When work on the project begins.") +
      fld("Deadline", '<input id="pf-deadline" type="date" value="' + (p.date_deadline || "") + '">', "Target completion date.") +
      fld("Status", '<select id="pf-active"><option value="1"' + (p.is_active ? " selected" : "") + '>Active</option><option value="0"' + (!p.is_active ? " selected" : "") + '>Closed</option></select>', "Active projects accept time entries; closed ones are archived.") +
      '</div></div>' +
      '<div class="o-groups"><div>' +
      fld("Project Code", '<input id="pf-code" value="' + esc(p.code || "") + '" placeholder="e.g. PRJ-001">', "Your internal reference for this contract.") +
      fld("Contract Value", '<input id="pf-cval" type="number" step="0.01" value="' + (boqTot > 0 ? boqTot : (p.contract_value || 0)) + '"' + (boqTot > 0 ? ' readonly' : '') + '>', boqTot > 0 ? "Set automatically from the Bill of Quantities. Edit the BOQ to change it." : "The awarded contract sum (grows with approved variations).") +
      '</div><div>' +
      fld("Retention %", '<input id="pf-ret" type="number" step="0.1" value="' + (p.retention_pct || 0) + '">', "Percent held back on each progress certificate, e.g. 10.") +
      fld("Advance Payment", '<input id="pf-adv" type="number" step="0.01" value="' + (p.advance_amount || 0) + '">', "Advance / mobilisation paid up front, recovered across certificates.") +
      '</div></div>' +
      (id !== "new" ? '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Tasks</div></div><div class="o-nb-pg">' + tasksTab + '</div></div>' : "") +
      '</div>';
    document.getElementById("pf-discard").onclick = function () { go("proj.list"); };
    var pft = document.getElementById("pf-fromtender"); if (pft) pft.onclick = function () { renderTenderForm(srcTender.id); };
    document.getElementById("pf-save").onclick = async function () {
      var name = gv("pf-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, partner_id: document.getElementById("pf-cust").value || null, billing_type: document.getElementById("pf-bill").value, date_start: gv("pf-start") || null, date_deadline: gv("pf-deadline") || null, is_active: document.getElementById("pf-active").value === "1", code: gv("pf-code"), contract_value: (boqTot > 0 ? boqTot : (parseFloat(gv("pf-cval")) || 0)), retention_pct: parseFloat(gv("pf-ret")) || 0, advance_amount: parseFloat(gv("pf-adv")) || 0 };
      var r; if (id === "new") { row.company_id = S.company.id; r = await sb.from("projects").insert(row); } else r = await sb.from("projects").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      toast("Saved"); go("proj.list");
    };
    if (id !== "new") {
      var _sb1 = document.getElementById("pf-sm-boq"); if (_sb1) _sb1.onclick = function () { renderBOQ(p.id); };
      var _sb2 = document.getElementById("pf-sm-cert"); if (_sb2) _sb2.onclick = function () { go("pc.list"); };
      var _sb3 = document.getElementById("pf-sm-budget"); if (_sb3) _sb3.onclick = function () { renderBudget(p.id); };
    }
    if (id !== "new") document.getElementById("pf-exec").onclick = function () { AGS.proj = p.id; AGS.view = "board"; go("proj.board"); };
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
      if (ins.error) { toast("Could not create: " + errMsg(ins.error)); return; }
      var invId = ins.data.id;
      var lr = await sb.from("invoice_lines").insert({ company_id: S.company.id, invoice_id: invId, sequence: 10, name: document.getElementById("b-desc").value.trim() || project.name, quantity: hours, unit_price: rate, price_subtotal: untax });
      if (lr.error) { toast("Invoice line failed: " + errMsg(lr.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
    if (id !== "new") btns += '<button id="ld-tender">Create Tender</button><button id="ld-quote">Create Quotation</button>';
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
      '</div></div>' + (id !== "new" ? '<div class="sub" style="margin-top:8px"><b>Create Tender</b> for a priced construction bid (cost build-up, margin, BOQ) that becomes a project with its budget when you mark it Won. <b>Create Quotation</b> for a simple priced offer of products or services.</div>' : '') + '</div>';
    document.querySelectorAll(".o-stages .st[data-stage]").forEach(function (x) { x.onclick = async function () { l.stage_id = x.dataset.stage; document.querySelectorAll(".o-stages .st").forEach(function (y) { y.classList.toggle("on", y === x); }); if (id !== "new") { await sb.from("crm_leads").update({ stage_id: l.stage_id }).eq("id", id); toast("Stage updated"); } }; });
    document.getElementById("ld-discard").onclick = function () { go("crm.pipe"); };
    document.getElementById("ld-save").onclick = async function () {
      var name = gv("ld-name"); if (!name) { toast("Name required"); return; }
      var row = { name: name, partner_id: document.getElementById("ld-cust").value || null, contact_name: gv("ld-contact"), email: gv("ld-email"), phone: gv("ld-phone"), expected_revenue: parseFloat(gv("ld-rev")) || 0, probability: parseFloat(gv("ld-prob")) || 0, source: gv("ld-src"), stage_id: l.stage_id };
      var r; if (id === "new") { row.company_id = S.company.id; row.is_active = true; r = await sb.from("crm_leads").insert(row); } else r = await sb.from("crm_leads").update(row).eq("id", id);
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      toast("Saved"); go("crm.pipe");
    };
    var cb = document.getElementById("ld-tocust"); if (cb) cb.onclick = async function () {
      var cname = gv("ld-contact") || gv("ld-name");
      var pr = await sb.from("partners").insert({ org_id: S.company.org_id, name: cname, is_company: true, is_customer: true, email: gv("ld-email") || null, phone: gv("ld-phone") || null }).select("id").single();
      if (pr.error) { toast("Could not create: " + errMsg(pr.error)); return; }
      await sb.from("crm_leads").update({ partner_id: pr.data.id }).eq("id", id);
      toast("Customer created & linked"); renderLeadForm(id);
    };
    var tndb = document.getElementById("ld-tender"); if (tndb) tndb.onclick = async function () {
      if (!l.partner_id) { toast("Link or create a customer first (use Create Customer)."); return; }
      var num = await nextTenderNumber();
      var tn = await sb.from("tenders").insert({ company_id: S.company.id, number: num, name: l.name || "Tender", partner_id: l.partner_id, status: "draft", tender_date: today(), margin_pct: 15, total_cost: 0, total_sell: Number(l.expected_revenue || 0), source_lead_id: id, notes: "From opportunity: " + (l.name || "") }).select("id").single();
      if (tn.error) { toast("Could not create tender: " + errMsg(tn.error)); return; }
      toast("Tender created from lead - price it, then Mark Won to open the project"); renderTenderForm(tn.data.id);
    };
    var qb = document.getElementById("ld-quote"); if (qb) qb.onclick = async function () {
      if (!l.partner_id) { toast("Link or create a customer first"); return; }
      var num = await nextOrderNumber("sale");
      var so = await sb.from("sale_orders").insert({ company_id: S.company.id, number: num, partner_id: l.partner_id, date_order: today(), state: "draft", currency_code: S.company.currency_code, amount_untaxed: 0, amount_total: 0, note: "From opportunity: " + l.name }).select("id").single();
      if (so.error) { toast("Could not create: " + errMsg(so.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }
  var LEAVE_T = { paid: "Paid time off", sick: "Sick leave", unpaid: "Unpaid" };
  async function leaveBalance(empId, type, year) {
    var al = (await sb.from("hr_leave_allocations").select("days").eq("company_id", S.company.id).eq("employee_id", empId).eq("leave_type", type).eq("year", year)).data || [];
    var allocated = al.reduce(function (s, x) { return s + Number(x.days || 0); }, 0);
    var lv = (await sb.from("hr_leaves").select("days,date_from").eq("company_id", S.company.id).eq("employee_id", empId).eq("leave_type", type).eq("state", "approved")).data || [];
    var taken = lv.filter(function (x) { return (x.date_from || "").slice(0, 4) === String(year); }).reduce(function (s, x) { return s + Number(x.days || 0); }, 0);
    return { allocated: allocated, taken: taken, remaining: allocated - taken };
  }
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
      '<div id="lv-bal" class="muted" style="font-size:12.5px;padding:2px 0">Checking balance...</div>' +
      '</div><div class="foot"><button class="btn" id="lv-cancel">Cancel</button>' + (leave.id && !approved ? '<button class="btn" id="lv-approve">Approve</button>' : "") + '<button class="btn pri" id="lv-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("lv-cancel").onclick = function () { m.remove(); };
    var LV_REM = Infinity;
    async function refreshBal() {
      var el = document.getElementById("lv-bal"); if (!el) return;
      var type = document.getElementById("lv-type").value, emp = document.getElementById("lv-emp").value;
      var yr = parseInt((document.getElementById("lv-from").value || today()).slice(0, 4)) || new Date().getFullYear();
      if (type === "unpaid") { LV_REM = Infinity; el.style.color = ""; el.textContent = "Unpaid leave - no allocation limit."; return; }
      var b = await leaveBalance(emp, type, yr); LV_REM = b.remaining;
      el.style.color = b.remaining < 0 ? "var(--warn,#c0392b)" : "";
      el.textContent = "Balance " + yr + ": allocated " + b.allocated + ", taken " + b.taken + ", remaining " + b.remaining + " day(s)." + (b.allocated === 0 ? " (No allocation set - add one under Time Off > Allocations.)" : "");
    }
    ["lv-emp", "lv-type", "lv-from", "lv-days"].forEach(function (id) { var e = document.getElementById(id); if (e) e.addEventListener("change", refreshBal); });
    refreshBal();
    function collect() { return { employee_id: document.getElementById("lv-emp").value, leave_type: document.getElementById("lv-type").value, date_from: document.getElementById("lv-from").value, date_to: document.getElementById("lv-to").value, days: parseFloat(gv("lv-days")) || 0 }; }
    document.getElementById("lv-save").onclick = async function () {
      var row = collect();
      var r; if (leave.id) r = await sb.from("hr_leaves").update(row).eq("id", leave.id); else { row.company_id = S.company.id; row.state = "draft"; r = await sb.from("hr_leaves").insert(row); }
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
    var ap = document.getElementById("lv-approve"); if (ap) ap.onclick = async function () {
      var row = collect();
      if (row.leave_type !== "unpaid" && row.days > LV_REM + 0.001) { toast("Exceeds balance: only " + (isFinite(LV_REM) ? LV_REM : 0) + " day(s) remaining. Add an allocation first."); return; }
      row.state = "approved";
      var r = await sb.from("hr_leaves").update(row).eq("id", leave.id);
      if (r.error) { toast("Could not approve: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
    var ap = document.getElementById("ex-approve"); if (ap) ap.onclick = async function () {
      var r = await sb.from("hr_expenses").update({ state: "approved" }).eq("id", exp.id);
      if (r.error) { toast("Could not approve: " + errMsg(r.error)); return; }
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
    if (e.error) { toast("Entry failed: " + errMsg(e.error)); return false; }
    var eid = e.data.id, jl = [{ entry_id: eid, company_id: S.company.id, account_id: exp, label: "Gross salary", debit: gross, credit: 0 }];
    if (ded > 0.005) jl.push({ entry_id: eid, company_id: S.company.id, account_id: dedAcc, label: "Payroll deductions", debit: 0, credit: ded });
    jl.push({ entry_id: eid, company_id: S.company.id, account_id: netAcc, label: "Net salary payable", debit: 0, credit: net });
    if (employer > 0.005) { jl.push({ entry_id: eid, company_id: S.company.id, account_id: exp, label: "Employer costs (EOS/SSF)", debit: employer, credit: 0 }); jl.push({ entry_id: eid, company_id: S.company.id, account_id: dedAcc, label: "Employer cost provision", debit: 0, credit: employer }); }
    if ((await sb.from("journal_lines").insert(jl)).error) { toast("Lines failed"); return false; }
    var pr = await sb.rpc("post_entry", { p_entry: eid });
    if (pr.error) { toast("Post failed: " + errMsg(pr.error)); return false; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
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
      var nid = id; if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("hr_payslip_runs").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return; } nid = ins.data.id; } else { if ((await sb.from("hr_payslip_runs").update(row).eq("id", id)).error) { toast("Save failed"); return; } }
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
        if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("hr_payslips").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
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
      if (r.error) { toast("Could not save: " + errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }

  // ---- Roster calendar grid ----
  var ROSTER_WEEK = null;
  function ymdLocal(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  async function renderRoster() {
    if (!ROSTER_WEEK) { var n = new Date(); var dow = (n.getDay() + 6) % 7; n.setDate(n.getDate() - dow); ROSTER_WEEK = ymdLocal(n); }
    var start = new Date(ROSTER_WEEK + "T00:00:00"), days = [];
    for (var i = 0; i < 7; i++) { var d = new Date(start); d.setDate(start.getDate() + i); days.push(ymdLocal(d)); }
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Roster") + '<div class="gap"></div><span class="o-pager">Week of ' + ROSTER_WEEK + '</span><button class="o-filtbtn" id="rst-prev">&#8249; Prev</button><button class="o-filtbtn" id="rst-today">This week</button><button class="o-filtbtn" id="rst-next">Next &#8250;</button></div><div class="o-form-bg" style="padding:14px"><div id="rst" class="o-empty">Loading...</div></div></div>';
    wireBc();
    document.getElementById("rst-prev").onclick = function () { var s = new Date(ROSTER_WEEK + "T00:00:00"); s.setDate(s.getDate() - 7); ROSTER_WEEK = ymdLocal(s); renderRoster(); };
    document.getElementById("rst-next").onclick = function () { var s = new Date(ROSTER_WEEK + "T00:00:00"); s.setDate(s.getDate() + 7); ROSTER_WEEK = ymdLocal(s); renderRoster(); };
    document.getElementById("rst-today").onclick = function () { ROSTER_WEEK = null; renderRoster(); };
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var shifts = (await sb.from("hr_shifts").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var roster = (await sb.from("hr_roster").select("employee_id,work_date,shift_id").eq("company_id", S.company.id).gte("work_date", days[0]).lte("work_date", days[6])).data || [];
    var rmap = {}; roster.forEach(function (r) { rmap[r.employee_id + "|" + r.work_date] = r.shift_id; });
    var dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var head = '<tr><th style="text-align:left">Employee</th>' + days.map(function (d, i) { return '<th>' + dow[i] + '<br><span class="muted">' + d.slice(5) + '</span></th>'; }).join("") + '</tr>';
    var body = emps.map(function (e) {
      return '<tr><td style="text-align:left"><b>' + esc(e.name) + '</b></td>' + days.map(function (d) {
        var cur = rmap[e.id + "|" + d] || "";
        return '<td><select class="rst-cell" data-emp="' + e.id + '" data-date="' + d + '"><option value=""' + (!cur ? " selected" : "") + '>Off</option>' + shifts.map(function (s) { return '<option value="' + s.id + '"' + (cur === s.id ? " selected" : "") + '>' + esc(s.name) + '</option>'; }).join("") + '</select></td>';
      }).join("") + '</tr>';
    }).join("");
    var rst = document.getElementById("rst"); rst.className = "";
    rst.innerHTML = !emps.length ? '<div class="o-empty">Add employees first.</div>' : !shifts.length ? '<div class="o-empty">Create a shift first (Attendances &gt; Shifts).</div>' : '<div class="o-rt-wrap"><table class="o-rt o-roster">' + head + body + '</table></div>';
    document.querySelectorAll(".rst-cell").forEach(function (sel) {
      sel.onchange = async function () {
        var emp = sel.dataset.emp, date = sel.dataset.date, sh = sel.value, r;
        if (sh) r = await sb.from("hr_roster").upsert({ company_id: S.company.id, employee_id: emp, work_date: date, shift_id: sh }, { onConflict: "employee_id,work_date" });
        else r = await sb.from("hr_roster").delete().eq("company_id", S.company.id).eq("employee_id", emp).eq("work_date", date);
        if (r && r.error) toast("Could not save: " + errMsg(r.error)); else toast("Roster updated");
      };
    });
  }

  // ---- End-of-service settlement ----
  async function renderEOS() {
    var emps = (await sb.from("hr_employees").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var sel = '<select id="eos-emp" class="o-filtbtn" style="min-width:200px"><option value="">Select employee...</option>' + emps.map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + '</option>'; }).join("") + '</select>';
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("End of Service") + '<div class="gap"></div>' + sel + '<input id="eos-date" type="date" class="o-filtbtn" value="' + today() + '"><button class="o-filtbtn" id="eos-calc">Calculate</button><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report" id="eos" style="max-width:660px"><div class="o-empty">Pick an employee and their last working day, then Calculate the end-of-service gratuity.</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    document.getElementById("eos-calc").onclick = compute;
    document.getElementById("eos-emp").onchange = function () { if (this.value) compute(); };
    async function compute() {
      var empId = document.getElementById("eos-emp").value; if (!empId) { toast("Pick an employee"); return; }
      var end = document.getElementById("eos-date").value || today();
      var ct = (await sb.from("hr_contracts").select("*").eq("company_id", S.company.id).eq("employee_id", empId).order("state", { ascending: false })).data || [];
      var contract = ct.filter(function (x) { return x.state === "running"; })[0] || ct[0];
      var rep = document.getElementById("eos");
      if (!contract || !contract.date_start) { rep.innerHTML = '<div class="o-empty">This employee has no contract with a start date. Set a contract start date under Contracts.</div>'; return; }
      var cc = contract.currency_code || S.company.currency_code;
      var start = new Date(contract.date_start + "T00:00:00"), fin = new Date(end + "T00:00:00");
      var years = Math.max(0, (fin - start) / (365.25 * 864e5)), basic = Number(contract.wage) || 0, dayRate = basic / 30;
      var first5 = Math.min(years, 5), after = Math.max(0, years - 5), days21 = first5 * 21, days30 = after * 30;
      var g1 = dayRate * days21, g2 = dayRate * days30, total = g1 + g2;
      var empName = (emps.filter(function (e) { return e.id === empId; })[0] || {}).name || "";
      rep.innerHTML = '<h1>End-of-Service Settlement</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + esc(empName) + ' &middot; ' + cc + '</div>' +
        '<table class="o-rt"><tbody>' +
        '<tr><td>Contract start</td><td class="num">' + esc(contract.date_start) + '</td></tr>' +
        '<tr><td>Last working day</td><td class="num">' + esc(end) + '</td></tr>' +
        '<tr><td>Years of service</td><td class="num">' + years.toFixed(2) + '</td></tr>' +
        '<tr><td>Last basic salary</td><td class="num">' + cc + " " + money(basic) + '</td></tr>' +
        '<tr><td>Daily rate (basic / 30)</td><td class="num">' + cc + " " + money(dayRate) + '</td></tr>' +
        '<tr class="sec"><td colspan="2">Gratuity (21 days/yr first 5 years, 30 days/yr after)</td></tr>' +
        '<tr><td>First 5 years: ' + first5.toFixed(2) + ' yr &times; 21 days = ' + days21.toFixed(1) + ' days</td><td class="num">' + cc + " " + money(g1) + '</td></tr>' +
        '<tr><td>Beyond 5 years: ' + after.toFixed(2) + ' yr &times; 30 days = ' + days30.toFixed(1) + ' days</td><td class="num">' + cc + " " + money(g2) + '</td></tr>' +
        '<tr class="tot"><td>Total end-of-service gratuity</td><td class="num">' + cc + " " + money(total) + '</td></tr>' +
        '</tbody></table>' +
        '<div class="sub" style="margin-top:14px">Standard Gulf-style gratuity: 21 days of basic per year for the first 5 years, 30 days per year thereafter. This is the total accrued benefit due; net any monthly EOS provision already booked via payslips.</div>';
    }
  }

  // ---- Payroll consolidation across entities ----
  async function renderPayrollConsolidation() {
    var ref = (S.org && S.org.ref_currency) || S.company.currency_code || "USD";
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Payroll Consolidation") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report" id="rep"><div class="o-empty">Consolidating payroll across ' + S.companies.length + ' entities...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var rates = (await sb.from("currency_rates").select("code,rate,rate_date").eq("org_id", S.org.id).order("rate_date", { ascending: false })).data || [];
    var rateMap = {}; rates.forEach(function (r) { if (rateMap[r.code] === undefined) rateMap[r.code] = Number(r.rate); }); rateMap[ref] = 1;
    var rows = [], totGross = 0, totEmployer = 0, totNet = 0, missing = {};
    for (var i = 0; i < S.companies.length; i++) {
      var co = S.companies[i];
      var slips = (await sb.from("hr_payslips").select("gross,net").eq("company_id", co.id).in("state", ["confirmed", "paid"])).data || [];
      var lines = (await sb.from("hr_payslip_lines").select("amount,category, hr_payslips!inner(state)").eq("company_id", co.id).eq("category", "employer_cost")).data || [];
      var employer = lines.filter(function (l) { return l.hr_payslips && (l.hr_payslips.state === "confirmed" || l.hr_payslips.state === "paid"); }).reduce(function (s, l) { return s + Number(l.amount || 0); }, 0);
      var gross = slips.reduce(function (s, x) { return s + Number(x.gross || 0); }, 0), net = slips.reduce(function (s, x) { return s + Number(x.net || 0); }, 0);
      var factor = co.currency_code === ref ? 1 : rateMap[co.currency_code], known = factor !== undefined;
      if (!known) { missing[co.currency_code] = 1; factor = 1; }
      var gRef = gross * factor, eRef = employer * factor, nRef = net * factor;
      totGross += gRef; totEmployer += eRef; totNet += nRef;
      rows.push('<tr><td>' + esc(co.name) + '</td><td class="muted">' + esc(co.currency_code) + '</td><td class="num">' + money(gRef) + '</td><td class="num">' + money(eRef) + '</td><td class="num">' + money(gRef + eRef) + '</td><td class="num">' + money(nRef) + '</td></tr>');
    }
    var banner = Object.keys(missing).length ? '<div style="background:var(--warn-s);color:var(--warn);padding:10px 14px;border-radius:9px;margin-bottom:14px;font-size:13px">No exchange rate for <b>' + esc(Object.keys(missing).join(", ")) + '</b> - those entities are shown 1:1. Add a rate under Accounting &gt; Exchange Rates.</div>' : '';
    document.getElementById("rep").innerHTML = '<h1>Payroll Consolidation</h1><div class="sub">' + esc((S.org && S.org.name) || S.company.name) + ' &middot; ' + ref + ' &middot; posted payslips</div>' + banner +
      '<table class="o-rt"><thead><tr><td>Entity</td><td>Cur</td><td class="num">Gross</td><td class="num">Employer cost</td><td class="num">Total cost</td><td class="num">Net</td></tr></thead><tbody>' +
      (rows.join("") || '<tr><td colspan="6" class="muted">No posted payslips yet.</td></tr>') +
      '<tr class="tot"><td colspan="2">Total (' + ref + ')</td><td class="num">' + money(totGross) + '</td><td class="num">' + money(totEmployer) + '</td><td class="num">' + money(totGross + totEmployer) + '</td><td class="num">' + money(totNet) + '</td></tr>' +
      '</tbody></table>';
  }

  // ============================ CONTRACTOR PROJECTS ============================
  // ---- Schedule of Values (BOQ) ----
  async function renderBOQ(projectId) {
    var proj = (await sb.from("projects").select("name,contract_value").eq("id", projectId).maybeSingle()).data || {};
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Schedule of Values", { action: "proj.list", title: "Projects" }) + '<div class="gap"></div><button class="o-new" id="boq-add">+ Add line</button><button class="o-filtbtn" id="boq-save">Save</button></div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-title">Schedule of Values &middot; ' + esc(proj.name || "") + '</div><div class="o-rt-wrap"><table class="o-lines"><thead><tr><th style="width:90px">Code</th><th>Description</th><th style="width:64px">Unit</th><th style="width:80px;text-align:right">Qty</th><th style="width:100px;text-align:right">Rate</th><th style="width:110px;text-align:right">Amount</th><th style="width:24px"></th></tr></thead><tbody id="boq-body"></tbody></table></div><div class="o-tot" id="boq-tot" style="margin-top:10px"></div></div></div></div></div>';
    wireBc();
    var lines = (await sb.from("project_boq").select("*").eq("project_id", projectId).order("sequence")).data || [];
    var body = document.getElementById("boq-body");
    function recalc() { var tot = 0; body.querySelectorAll("tr").forEach(function (tr) { var q = parseFloat(tr.querySelector(".bq-qty").value) || 0, r = parseFloat(tr.querySelector(".bq-rate").value) || 0; var a = q * r; tot += a; tr.querySelector(".bq-amt").textContent = money(a); }); document.getElementById("boq-tot").innerHTML = '<div class="r tt"><span class="k">Total contract value</span><span>' + S.company.currency_code + " " + money(tot) + '</span></div>'; }
    function addRow(l) { var tr = document.createElement("tr"); tr.innerHTML = '<td><input class="bq-code" value="' + esc(l ? l.code : "") + '"></td><td><input class="bq-desc" value="' + esc(l ? l.description : "") + '" placeholder="Description"></td><td><input class="bq-unit" value="' + esc(l ? l.unit : "") + '"></td><td><input class="bq-qty num" type="number" step="0.01" value="' + (l ? l.quantity : 1) + '"></td><td><input class="bq-rate num" type="number" step="0.01" value="' + (l ? l.rate : 0) + '"></td><td class="num bq-amt">0.00</td><td><button class="del">&times;</button></td>'; body.appendChild(tr); tr.querySelector(".del").onclick = function () { tr.remove(); recalc(); }; tr.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", recalc); }); }
    document.getElementById("boq-add").onclick = function () { addRow(null); recalc(); };
    document.getElementById("boq-save").onclick = async function () {
      await sb.from("project_boq").delete().eq("project_id", projectId);
      var rows = Array.prototype.map.call(body.querySelectorAll("tr"), function (tr, i) { var q = parseFloat(tr.querySelector(".bq-qty").value) || 0, r = parseFloat(tr.querySelector(".bq-rate").value) || 0; return { company_id: S.company.id, project_id: projectId, code: tr.querySelector(".bq-code").value.trim(), description: tr.querySelector(".bq-desc").value.trim() || "Item", unit: tr.querySelector(".bq-unit").value.trim(), quantity: q, rate: r, amount: q * r, sequence: (i + 1) * 10 }; });
      if (rows.length) { var ins = await sb.from("project_boq").insert(rows); if (ins.error) { toast(errMsg(ins.error)); return; } }
      await sb.from("projects").update({ contract_value: rows.reduce(function (s, x) { return s + x.amount; }, 0) }).eq("id", projectId);
      toast("Schedule of values saved"); renderProjectForm(projectId);
    };
    if (lines.length) lines.forEach(addRow); else addRow(null);
    recalc();
  }

  // ---- Cost budget ----
  async function renderBudget(projectId) {
    var proj = (await sb.from("projects").select("name,contract_value").eq("id", projectId).maybeSingle()).data || {};
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Cost Budget", { action: "proj.list", title: "Projects" }) + '<div class="gap"></div><button class="o-new" id="bg-add">+ Add line</button><button class="o-filtbtn" id="bg-save">Save</button></div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-title">Cost Budget &middot; ' + esc(proj.name || "") + '</div><div class="o-rt-wrap"><table class="o-lines"><thead><tr><th style="width:160px">Cost code</th><th style="width:140px">Category</th><th>Description</th><th style="width:130px;text-align:right">Budgeted cost</th><th style="width:24px"></th></tr></thead><tbody id="bg-body"></tbody></table></div><div class="o-tot" id="bg-tot" style="margin-top:10px"></div></div></div></div></div>';
    wireBc();
    var lines = (await sb.from("project_budgets").select("*").eq("project_id", projectId).order("id")).data || [];
    var ccs = (await sb.from("cost_codes").select("id,code,name").eq("company_id", S.company.id).eq("is_active", true).order("sort")).data || [];
    function ccOpts(sel) { return '<option value="">&mdash;</option>' + ccs.map(function (c) { return '<option value="' + c.id + '"' + (sel === c.id ? " selected" : "") + '>' + esc(c.code) + (c.name ? " - " + esc(c.name) : "") + '</option>'; }).join(""); }
    var body = document.getElementById("bg-body"), cv = Number(proj.contract_value) || 0;
    function recalc() { var tot = 0; body.querySelectorAll("tr").forEach(function (tr) { tot += parseFloat(tr.querySelector(".bg-amt").value) || 0; }); document.getElementById("bg-tot").innerHTML = '<div class="r"><span class="k">Total budgeted cost</span><span>' + S.company.currency_code + " " + money(tot) + '</span></div><div class="r"><span class="k">Contract value</span><span>' + S.company.currency_code + " " + money(cv) + '</span></div><div class="r tt"><span class="k">Estimated margin</span><span>' + S.company.currency_code + " " + money(cv - tot) + " (" + (cv ? ((cv - tot) / cv * 100).toFixed(1) : "0") + '%)</span></div>'; }
    function addRow(l) { var tr = document.createElement("tr"); tr.innerHTML = '<td><select class="bg-cc">' + ccOpts(l ? l.cost_code_id : "") + '</select></td><td><input class="bg-cat" value="' + esc(l ? l.category : "") + '" placeholder="e.g. Labour"></td><td><input class="bg-desc" value="' + esc(l ? l.description : "") + '"></td><td><input class="bg-amt num" type="number" step="0.01" value="' + (l ? l.amount : 0) + '"></td><td><button class="del">&times;</button></td>'; body.appendChild(tr); tr.querySelector(".del").onclick = function () { tr.remove(); recalc(); }; tr.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", recalc); }); }
    document.getElementById("bg-add").onclick = function () { addRow(null); recalc(); };
    document.getElementById("bg-save").onclick = async function () {
      await sb.from("project_budgets").delete().eq("project_id", projectId);
      var rows = Array.prototype.map.call(body.querySelectorAll("tr"), function (tr) { return { company_id: S.company.id, project_id: projectId, cost_code_id: tr.querySelector(".bg-cc").value || null, category: tr.querySelector(".bg-cat").value.trim() || "Cost", description: tr.querySelector(".bg-desc").value.trim(), amount: parseFloat(tr.querySelector(".bg-amt").value) || 0 }; });
      if (rows.length) { var ins = await sb.from("project_budgets").insert(rows); if (ins.error) { toast(errMsg(ins.error)); return; } }
      toast("Budget saved"); renderProjectForm(projectId);
    };
    if (lines.length) lines.forEach(addRow); else addRow(null);
    recalc();
  }

  // ---- Cost codes (ORB-13): the shared cost dimension used across budget / PO / bill ----
  function cfgCostCodes() {
    return {
      title: "Cost Codes", pageSize: 300,
      fetch: function () { return sb.from("cost_codes").select("*").eq("company_id", S.company.id).order("sort").then(function (r) { return r.data || []; }); },
      searchText: function (c) { return (c.code || "") + " " + (c.name || "") + " " + (c.category || ""); },
      columns: [
        { label: "Code", get: function (c) { return '<b>' + esc(c.code) + '</b>'; } },
        { label: "Name", get: function (c) { return esc(c.name || ""); } },
        { label: "Category", get: function (c) { return '<span class="muted">' + esc(c.category || "") + '</span>'; } },
        { label: "Status", get: function (c) { return c.is_active === false ? '<span class="badge draft">Inactive</span>' : '<span class="badge partial">Active</span>'; } }
      ],
      groupBy: [{ label: "Category", get: function (c) { return c.category || "Uncategorised"; } }],
      emptyHint: "Cost codes are your standard cost buckets (Labour, Materials, Subcontract, Plant, Preliminaries...). Add your set once, assign them on budget / PO / bill lines, and the Job Cost report shows budget vs committed vs actual per code.",
      onOpen: function (c) { openCostCodeModal(c); }, onNew: function () { openCostCodeModal(null); }
    };
  }
  function openCostCodeModal(c) {
    c = c || {};
    var cats = ["Labour", "Materials", "Subcontract", "Plant & Equipment", "Preliminaries", "Overheads", "Other"];
    var catOpts = cats.map(function (x) { return '<option' + (c.category === x ? " selected" : "") + '>' + x + '</option>'; }).join("");
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (c.id ? "Edit" : "New") + ' cost code</h3><div class="form">' +
      '<div class="row2"><div><label for="cc-code">Code</label><input id="cc-code" value="' + esc(c.code || "") + '" placeholder="e.g. 100"></div><div><label for="cc-cat">Category</label><select id="cc-cat">' + catOpts + '</select></div></div>' +
      '<div><label for="cc-name">Name</label><input id="cc-name" value="' + esc(c.name || "") + '" placeholder="e.g. Site labour"></div>' +
      '<div class="row2"><div><label for="cc-sort">Sort</label><input id="cc-sort" type="number" value="' + (c.sort != null ? c.sort : 10) + '"></div><div><label for="cc-active">Active</label><select id="cc-active"><option value="1">Active</option><option value="0">Inactive</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="cc-cancel">Cancel</button>' + (c.id ? '<button class="btn" id="cc-del" style="color:var(--bad)">Delete</button>' : '') + '<button class="btn pri" id="cc-save" style="background:var(--accent);border-color:var(--accent)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("cc-active").value = c.is_active === false ? "0" : "1";
    document.getElementById("cc-cancel").onclick = function () { m.remove(); };
    var del = document.getElementById("cc-del"); if (del) del.onclick = async function () { await sb.from("cost_codes").delete().eq("id", c.id); m.remove(); toast("Deleted"); renderView(); };
    document.getElementById("cc-save").onclick = async function () {
      var code = document.getElementById("cc-code").value.trim();
      if (!code) { toast("Enter a code"); return; }
      var row = { code: code, name: document.getElementById("cc-name").value.trim(), category: document.getElementById("cc-cat").value, sort: parseInt(document.getElementById("cc-sort").value, 10) || 10, is_active: document.getElementById("cc-active").value === "1" };
      var r; if (c.id) r = await sb.from("cost_codes").update(row).eq("id", c.id); else { row.company_id = S.company.id; r = await sb.from("cost_codes").insert(row); }
      if (r.error) { toast(errMsg(r.error)); return; }
      m.remove(); toast("Saved"); renderView();
    };
  }

  // ---- Job Cost report (ORB-12): budget vs committed vs actual, by cost code ----
  async function renderJobCost() {
    var main = document.getElementById("o-main");
    main.innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Job Cost") + '</div><div class="o-body" id="o-body"><div class="o-empty">Loading...</div></div></div>';
    wireBc();
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    if (!projs.length) { document.getElementById("o-body").innerHTML = '<div style="padding:18px"><div class="o-empty">No projects yet &mdash; create a project first.</div></div>'; return; }
    var sel = (S.jobCostProj && projs.some(function (p) { return p.id === S.jobCostProj; })) ? S.jobCostProj : projs[0].id;
    document.getElementById("o-body").innerHTML = '<div style="padding:16px"><div class="card"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="margin:0">Job Cost</h3><select id="jc-proj" aria-label="Project" style="margin-left:auto;max-width:100%">' + projs.map(function (p) { return '<option value="' + p.id + '"' + (p.id === sel ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div><div class="sub" style="margin:6px 0 12px">Budget vs committed (open + billed purchase orders) vs actual (posted supplier bills), grouped by cost code. Assign cost codes on budget, PO and bill lines to fill it in.</div><div id="jc-table"><div class="o-empty">Loading...</div></div></div></div>';
    document.getElementById("jc-proj").onchange = function () { jobCostTable(this.value); };
    jobCostTable(sel);
  }
  async function jobCostTable(projectId) {
    S.jobCostProj = projectId;
    var el = document.getElementById("jc-table"); if (!el) return;
    var codes = (await sb.from("cost_codes").select("id,code,name,sort").eq("company_id", S.company.id).order("sort")).data || [];
    var buds = (await sb.from("project_budgets").select("cost_code_id,amount").eq("project_id", projectId)).data || [];
    var pos = (await sb.from("purchase_orders").select("cost_code_id,state,amount_untaxed,amount_total").eq("company_id", S.company.id).eq("project_id", projectId)).data || [];
    var bills = (await sb.from("invoices").select("cost_code_id,state,amount_untaxed,amount_total").eq("company_id", S.company.id).eq("project_id", projectId).eq("move_type", "in_invoice")).data || [];
    var map = {};
    function bucket(id) { id = id || "_none"; if (!map[id]) map[id] = { budget: 0, committed: 0, actual: 0 }; return map[id]; }
    buds.forEach(function (b) { bucket(b.cost_code_id).budget += Number(b.amount) || 0; });
    pos.forEach(function (p) { if (["sent", "purchase", "done"].indexOf(p.state) >= 0) bucket(p.cost_code_id).committed += Number(p.amount_untaxed) || Number(p.amount_total) || 0; });
    bills.forEach(function (b) { if (b.state === "posted") bucket(b.cost_code_id).actual += Number(b.amount_untaxed) || Number(b.amount_total) || 0; });
    var codeById = {}; codes.forEach(function (c) { codeById[c.id] = c; });
    var order = codes.map(function (c) { return c.id; }).filter(function (id) { return map[id]; });
    Object.keys(map).forEach(function (id) { if (id !== "_none" && order.indexOf(id) < 0) order.push(id); });
    if (map["_none"]) order.push("_none");
    var cc = S.company.currency_code, tot = { budget: 0, committed: 0, actual: 0 };
    var rows = order.map(function (id) {
      var m = map[id]; tot.budget += m.budget; tot.committed += m.committed; tot.actual += m.actual;
      var name = id === "_none" ? "Uncoded" : (codeById[id] ? (codeById[id].code + (codeById[id].name ? " - " + codeById[id].name : "")) : "Cost code");
      var variance = m.budget - m.actual, pct = m.budget ? Math.round(m.actual / m.budget * 100) : 0;
      return '<tr><td>' + esc(name) + '</td><td class="num">' + money(m.budget) + '</td><td class="num">' + money(m.committed) + '</td><td class="num">' + money(m.actual) + '</td><td class="num" style="color:' + (variance < 0 ? "var(--bad)" : "var(--good)") + '">' + money(variance) + '</td><td class="num">' + pct + '%</td></tr>';
    }).join("");
    var totVar = tot.budget - tot.actual, totPct = tot.budget ? Math.round(tot.actual / tot.budget * 100) : 0;
    el.innerHTML = '<div class="o-rt-wrap"><table class="o-list"><thead><tr><th>Cost code</th><th class="num">Budget</th><th class="num">Committed</th><th class="num">Actual</th><th class="num">Variance</th><th class="num">% used</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="muted" style="text-align:center;padding:16px">No budget or costs yet. Add a cost budget, then raise POs / bills against this project.</td></tr>') +
      '</tbody><tfoot><tr style="font-weight:700;border-top:2px solid var(--line)"><td>Total (' + esc(cc) + ')</td><td class="num">' + money(tot.budget) + '</td><td class="num">' + money(tot.committed) + '</td><td class="num">' + money(tot.actual) + '</td><td class="num" style="color:' + (totVar < 0 ? "var(--bad)" : "var(--good)") + '">' + money(totVar) + '</td><td class="num">' + totPct + '%</td></tr></tfoot></table></div>';
  }

  // ---- Variations ----
  function cfgVariations() {
    return {
      title: "Variations", pageSize: 80,
      fetch: function () { return sb.from("project_variations").select("*, projects(name)").eq("company_id", S.company.id).order("vdate", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (v) { return (v.number || "") + " " + (v.description || "") + " " + (v.projects ? v.projects.name : ""); },
      columns: [
        { label: "Number", get: function (v) { return '<b>' + esc(v.number || "/") + '</b>'; } },
        { label: "Project", get: function (v) { return esc(v.projects ? v.projects.name : ""); } },
        { label: "Description", get: function (v) { return '<span class="muted">' + esc(v.description || "") + '</span>'; } },
        { label: "Date", get: function (v) { return '<span class="muted">' + esc(v.vdate || "") + '</span>'; } },
        { label: "Amount", num: true, get: function (v) { return money(v.amount); } },
        { label: "Status", get: function (v) { return v.state === "approved" ? '<span class="badge paid">Approved</span>' : v.state === "rejected" ? '<span class="badge">Rejected</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Approved", test: function (v) { return v.state === "approved"; } }, { label: "Draft", test: function (v) { return v.state === "draft" || !v.state; } }],
      groupBy: [{ label: "Project", get: function (v) { return v.projects ? v.projects.name : "None"; } }],
      onOpen: function (v) { openVariationModal(v); }, onNew: function () { openVariationModal(); }
    };
  }
  async function openVariationModal(v) {
    v = v || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (v.id ? "Variation" : "New variation") + '</h3><div class="form">' +
      '<div><label>Project</label>' + fhint("__vpr", "The project this change order belongs to.") + '<select id="v-proj">' + projs.map(function (p) { return '<option value="' + p.id + '"' + (v.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="row2"><div><label>Number</label>' + fhint("__vnum", "Variation / change order number.") + '<input id="v-num" value="' + esc(v.number || "") + '"></div><div><label>Date</label>' + fhint("__vdate", "When the variation was raised.") + '<input id="v-date" type="date" value="' + (v.vdate || today()) + '"></div></div>' +
      '<div><label>Description</label>' + fhint("__vdesc", "What changed in scope.") + '<input id="v-desc" value="' + esc(v.description || "") + '"></div>' +
      '<div><label>Amount</label>' + fhint("__vamt", "Added (or negative) contract value. Approving grows the contract value.") + '<input id="v-amt" type="number" step="0.01" value="' + (v.amount || 0) + '"></div>' +
      '</div><div class="foot"><button class="btn" id="v-cancel">Cancel</button>' + (v.id && v.state !== "approved" ? '<button class="btn" id="v-approve">Approve</button>' : "") + '<button class="btn pri" id="v-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("v-cancel").onclick = function () { m.remove(); };
    function collect() { return { project_id: document.getElementById("v-proj").value, number: gv("v-num"), vdate: gv("v-date"), description: gv("v-desc") || "Variation", amount: parseFloat(gv("v-amt")) || 0 }; }
    document.getElementById("v-save").onclick = async function () { if (!gv("v-desc")) { toast("Description required"); return; } var row = collect(); var r; if (v.id) r = await sb.from("project_variations").update(row).eq("id", v.id); else { row.company_id = S.company.id; row.state = "draft"; r = await sb.from("project_variations").insert(row); } if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView(); };
    var ap = document.getElementById("v-approve"); if (ap) ap.onclick = async function () { var row = collect(); row.state = "approved"; var r = await sb.from("project_variations").update(row).eq("id", v.id); if (r.error) { toast(errMsg(r.error)); return; } var pr = (await sb.from("projects").select("contract_value").eq("id", row.project_id).maybeSingle()).data; await sb.from("projects").update({ contract_value: (Number(pr.contract_value) || 0) + row.amount }).eq("id", row.project_id); m.remove(); toast("Approved - contract value updated"); renderView(); };
  }

  // ---- Subcontracts ----
  function cfgSubcontracts() {
    return {
      title: "Subcontracts", pageSize: 80,
      fetch: function () { return sb.from("subcontracts").select("*, projects(name), partners(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (s) { return (s.number || "") + " " + (s.name || "") + " " + (s.partners ? s.partners.name : ""); },
      columns: [
        { label: "Number", get: function (s) { return '<b>' + esc(s.number || "/") + '</b>'; } },
        { label: "Subcontract", get: function (s) { return esc(s.name); } },
        { label: "Vendor", get: function (s) { return esc(s.partners ? s.partners.name : ""); } },
        { label: "Project", get: function (s) { return esc(s.projects ? s.projects.name : ""); } },
        { label: "Amount", num: true, get: function (s) { return (s.currency_code || S.company.currency_code) + " " + money(s.amount); } },
        { label: "Retention", num: true, get: function (s) { return Number(s.retention_pct || 0) + "%"; } },
        { label: "Status", get: function (s) { return s.state === "active" ? '<span class="badge paid">Active</span>' : s.state === "closed" ? '<span class="badge">Closed</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Active", test: function (s) { return s.state === "active"; } }],
      groupBy: [{ label: "Project", get: function (s) { return s.projects ? s.projects.name : "None"; } }, { label: "Vendor", get: function (s) { return s.partners ? s.partners.name : "None"; } }],
      onOpen: function (s) { openSubcontractModal(s); }, onNew: function () { openSubcontractModal(); }
    };
  }
  async function openSubcontractModal(sc) {
    sc = sc || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var vendors = (await sb.from("partners").select("id,name").eq("is_vendor", true).order("name")).data || [];
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>' + (sc.id ? "Subcontract" : "New subcontract") + '</h3><div class="form">' +
      '<div><label>Subcontract name</label>' + fhint("__scn", "What is subcontracted, e.g. Aluminium fabrication.") + '<input id="sc-name" value="' + esc(sc.name || "") + '"></div>' +
      '<div class="row2"><div><label>Number</label>' + fhint("__scnum", "Your subcontract reference.") + '<input id="sc-num" value="' + esc(sc.number || "") + '"></div><div><label>Vendor</label>' + fhint("__scv", "The subcontractor.") + '<select id="sc-vend"><option value="">(none)</option>' + vendors.map(function (x) { return '<option value="' + x.id + '"' + (sc.vendor_id === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join("") + '</select></div></div>' +
      '<div><label>Project</label>' + fhint("__scp", "The project this subcontract is for.") + '<select id="sc-proj"><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (sc.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select></div>' +
      '<div class="row2"><div><label>Amount</label>' + fhint("__sca", "The subcontract value.") + '<input id="sc-amt" type="number" step="0.01" value="' + (sc.amount || 0) + '"></div><div><label>Retention %</label>' + fhint("__scr", "Retention withheld from the subcontractor.") + '<input id="sc-ret" type="number" step="0.1" value="' + (sc.retention_pct || 0) + '"></div></div>' +
      '<div><label>Status</label>' + fhint("__scst", "Draft, active, or closed.") + '<select id="sc-state"><option value="draft"' + (sc.state === "draft" || !sc.state ? " selected" : "") + '>Draft</option><option value="active"' + (sc.state === "active" ? " selected" : "") + '>Active</option><option value="closed"' + (sc.state === "closed" ? " selected" : "") + '>Closed</option></select></div>' +
      '</div><div class="foot"><button class="btn" id="sc-cancel">Cancel</button><button class="btn pri" id="sc-save" style="background:var(--app);border-color:var(--app)">Save</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("sc-cancel").onclick = function () { m.remove(); };
    document.getElementById("sc-save").onclick = async function () { if (!gv("sc-name")) { toast("Name required"); return; } var row = { name: gv("sc-name"), number: gv("sc-num"), vendor_id: document.getElementById("sc-vend").value || null, project_id: document.getElementById("sc-proj").value || null, amount: parseFloat(gv("sc-amt")) || 0, retention_pct: parseFloat(gv("sc-ret")) || 0, currency_code: S.company.currency_code, state: document.getElementById("sc-state").value }; var r; if (sc.id) r = await sb.from("subcontracts").update(row).eq("id", sc.id); else { row.company_id = S.company.id; r = await sb.from("subcontracts").insert(row); } if (r.error) { toast(errMsg(r.error)); return; } m.remove(); toast("Saved"); renderView(); };
  }

  // ---- Progress certificates (IPC) ----
  function cfgCertificates() {
    return {
      title: "Progress Certificates", pageSize: 80,
      fetch: function () { return sb.from("project_certificates").select("*, projects(name)").eq("company_id", S.company.id).order("date_to", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (c) { return (c.number || "") + " " + (c.projects ? c.projects.name : ""); },
      columns: [
        { label: "Number", get: function (c) { return '<b>' + esc(c.number || "/") + '</b>'; } },
        { label: "Project", get: function (c) { return esc(c.projects ? c.projects.name : ""); } },
        { label: "Date", get: function (c) { return '<span class="muted">' + esc(c.date_to || "") + '</span>'; } },
        { label: "Gross to date", num: true, get: function (c) { return money(c.gross_to_date); } },
        { label: "Retention", num: true, get: function (c) { return money(c.retention_amount); } },
        { label: "This certificate", num: true, get: function (c) { return '<b>' + money(c.current_certified) + '</b>'; } },
        { label: "Status", get: function (c) { return c.state === "invoiced" ? '<span class="badge paid">Invoiced</span>' : c.state === "certified" ? '<span class="badge partial">Certified</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Draft", test: function (c) { return c.state === "draft" || !c.state; } }, { label: "Certified", test: function (c) { return c.state === "certified"; } }, { label: "Invoiced", test: function (c) { return c.state === "invoiced"; } }],
      groupBy: [{ label: "Project", get: function (c) { return c.projects ? c.projects.name : "None"; } }],
      onOpen: function (c) { renderCertificateForm(c.id); }, onNew: function () { renderCertificateForm("new"); }
    };
  }
  async function renderCertificateForm(id, presetProject) {
    var parent = { action: "pc.list", title: "Progress Certificates" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var projs = (await sb.from("projects").select("id,name,contract_value,retention_pct,advance_amount,partner_id").eq("company_id", S.company.id).order("name")).data || [];
    var cert = id === "new" ? { state: "draft", date_to: today(), project_id: presetProject || (projs[0] ? projs[0].id : null) } : (await sb.from("project_certificates").select("*").eq("id", id).maybeSingle()).data || {};
    var proj = projs.filter(function (p) { return p.id === cert.project_id; })[0] || {};
    var cc = S.company.currency_code, posted = cert.state === "certified" || cert.state === "invoiced";
    var boq = (await sb.from("project_boq").select("*").eq("project_id", cert.project_id).order("sequence")).data || [];
    var certLines = id === "new" ? [] : (await sb.from("project_certificate_lines").select("*").eq("certificate_id", id).order("sequence")).data || [];
    // previous certificate (most recent non-draft for this project, excluding self)
    var prevCerts = (await sb.from("project_certificates").select("*").eq("company_id", S.company.id).eq("project_id", cert.project_id).neq("id", id === "new" ? "00000000-0000-0000-0000-000000000000" : id).in("state", ["certified", "invoiced"]).order("date_to", { ascending: false })).data || [];
    var prevCert = prevCerts[0];
    var prevLines = prevCert ? ((await sb.from("project_certificate_lines").select("boq_id,cum_amount,cum_pct").eq("certificate_id", prevCert.id)).data || []) : [];
    var prevByBoq = {}; prevLines.forEach(function (l) { prevByBoq[l.boq_id] = l; });
    var savedByBoq = {}; certLines.forEach(function (l) { savedByBoq[l.boq_id] = l; });
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (cert.number || "Certificate");
    var projField = (id === "new") ? '<select id="pc-proj">' + projs.map(function (p) { return '<option value="' + p.id + '"' + (cert.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc(proj.name || "") + '</span>';
    var lineRows = boq.map(function (b) {
      var sv = savedByBoq[b.id], pv = prevByBoq[b.id];
      var prevPct = pv ? Number(pv.cum_pct) : 0, curPct = sv ? Number(sv.cum_pct) : prevPct;
      return '<tr data-boq="' + b.id + '" data-amt="' + b.amount + '" data-prev="' + (pv ? pv.cum_amount : 0) + '"><td>' + esc(b.code || "") + '</td><td>' + esc(b.description) + '</td><td class="num">' + money(b.amount) + '</td><td class="num muted">' + prevPct.toFixed(1) + '%</td><td><input class="pc-pct num" type="number" step="0.1" value="' + curPct + '"' + (posted ? " disabled" : "") + ' style="width:70px"></td><td class="num pc-cur">0.00</td></tr>';
    }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="pc-save">Save</button><button id="pc-discard">Discard</button>' + (id !== "new" && !posted ? '<button id="pc-compute">Compute</button><button id="pc-certify">Certify</button>' : "") + (cert.state === "certified" ? '<button id="pc-invoice">Create client invoice</button>' : "") + '</div>' +
      '<div class="o-stages"><span class="st ' + (!posted ? "on" : "done") + '">Draft</span><span class="st ' + (cert.state === "certified" ? "on" : cert.state === "invoiced" ? "done" : "") + '">Certified</span><span class="st ' + (cert.state === "invoiced" ? "on" : "") + '">Invoiced</span></div></div>' +
      '<div class="o-sheet"><div class="o-title">Interim Payment Certificate</div>' +
      '<div class="o-groups"><div>' +
      fld("Project", projField, "The contract being certified.") +
      fld("Certificate No.", '<input id="pc-num" value="' + esc(cert.number || "") + '"' + (posted ? " disabled" : "") + '>', "This certificate's number, e.g. IPC-03.") +
      '</div><div>' +
      fld("Date", '<input id="pc-date" type="date" value="' + (cert.date_to || today()) + '"' + (posted ? " disabled" : "") + '>', "Valuation date / period end.") +
      fld("Materials on site", '<input id="pc-mat" type="number" step="0.01" value="' + (cert.materials_on_site || 0) + '"' + (posted ? " disabled" : "") + '>', "Value of materials delivered but not yet built in.") +
      fld("Advance recovery", '<input id="pc-adv" type="number" step="0.01" value="' + (cert.advance_recovery || 0) + '"' + (posted ? " disabled" : "") + '>', "Advance payment recovered on this certificate.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Schedule of values</div></div><div class="o-nb-pg"><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Code</td><td>Description</td><td class="num">Contract</td><td class="num">Prev %</td><td class="num">Cum %</td><td class="num">This period</td></tr></thead><tbody>' + (lineRows || '<tr><td colspan="6" class="muted">No schedule of values. Add one on the project (Schedule of Values).</td></tr>') + '</tbody></table></div><div class="o-tot" id="pc-sum" style="margin-top:12px"></div></div></div>' +
      '</div>';
    document.getElementById("pc-discard").onclick = function () { go("pc.list"); };
    if (id === "new") { var ps = document.getElementById("pc-proj"); if (ps) ps.onchange = function () { renderCertificateForm("new", ps.value); }; }
    var retPct = Number(proj.retention_pct) || 0;
    function computeSummary() {
      var work = 0;
      document.querySelectorAll("#o-main tr[data-boq]").forEach(function (tr) {
        var amt = Number(tr.dataset.amt) || 0, prevAmt = Number(tr.dataset.prev) || 0;
        var pct = parseFloat(tr.querySelector(".pc-pct").value) || 0;
        var cum = amt * pct / 100; work += cum;
        tr.querySelector(".pc-cur").textContent = money(cum - prevAmt);
      });
      var mat = parseFloat(gv("pc-mat")) || 0, adv = parseFloat(gv("pc-adv")) || 0;
      var variations = 0; // approved variations already fold into contract; kept 0 here to avoid double count
      var gross = work + mat + variations;
      var retention = gross * retPct / 100;
      var net = gross - retention - adv;
      var prevNet = prevCert ? Number(prevCert.net_to_date) : 0;
      var current = net - prevNet;
      document.getElementById("pc-sum").innerHTML =
        '<div class="r"><span class="k">Work done to date</span><span>' + cc + " " + money(work) + '</span></div>' +
        '<div class="r"><span class="k">Materials on site</span><span>' + cc + " " + money(mat) + '</span></div>' +
        '<div class="r"><span class="k">Gross value to date</span><span>' + cc + " " + money(gross) + '</span></div>' +
        '<div class="r"><span class="k">Less retention (' + retPct + '%)</span><span>-' + cc + " " + money(retention) + '</span></div>' +
        '<div class="r"><span class="k">Less advance recovery</span><span>-' + cc + " " + money(adv) + '</span></div>' +
        '<div class="r"><span class="k">Net to date</span><span>' + cc + " " + money(net) + '</span></div>' +
        '<div class="r"><span class="k">Less previously certified</span><span>-' + cc + " " + money(prevNet) + '</span></div>' +
        '<div class="r tt"><span class="k">Amount due this certificate</span><span>' + cc + " " + money(current) + '</span></div>';
      return { work: work, mat: mat, gross: gross, retention: retention, adv: adv, net: net, prevNet: prevNet, current: current };
    }
    document.querySelectorAll(".pc-pct").forEach(function (i) { i.addEventListener("input", computeSummary); });
    var mi = document.getElementById("pc-mat"), ai = document.getElementById("pc-adv"); if (mi) mi.addEventListener("input", computeSummary); if (ai) ai.addEventListener("input", computeSummary);
    computeSummary();
    async function persist() {
      var projId = id === "new" ? (document.getElementById("pc-proj") ? document.getElementById("pc-proj").value : cert.project_id) : cert.project_id;
      var s = computeSummary();
      var row = { project_id: projId, number: gv("pc-num"), date_to: gv("pc-date"), work_done: s.work, materials_on_site: s.mat, variations_done: 0, gross_to_date: s.gross, retention_pct: retPct, retention_amount: s.retention, advance_recovery: s.adv, net_to_date: s.net, previous_certified: s.prevNet, current_certified: s.current };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("project_certificates").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("project_certificates").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      await sb.from("project_certificate_lines").delete().eq("certificate_id", sid);
      var lrows = [];
      document.querySelectorAll("#o-main tr[data-boq]").forEach(function (tr, i) {
        var amt = Number(tr.dataset.amt) || 0, prevAmt = Number(tr.dataset.prev) || 0, pct = parseFloat(tr.querySelector(".pc-pct").value) || 0, cum = amt * pct / 100;
        lrows.push({ company_id: S.company.id, certificate_id: sid, boq_id: tr.dataset.boq, description: "", contract_amount: amt, prev_pct: 0, cum_pct: pct, cum_amount: cum, prev_amount: prevAmt, current_amount: cum - prevAmt, sequence: (i + 1) * 10 });
      });
      if (lrows.length) await sb.from("project_certificate_lines").insert(lrows);
      return sid;
    }
    document.getElementById("pc-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderCertificateForm(sid); } };
    var cbtn = document.getElementById("pc-compute"); if (cbtn) cbtn.onclick = computeSummary;
    var cert2 = document.getElementById("pc-certify"); if (cert2) cert2.onclick = async function () { var sid = await persist(); if (!sid) return; await sb.from("project_certificates").update({ state: "certified" }).eq("id", sid); toast("Certified"); renderCertificateForm(sid); };
    var inv = document.getElementById("pc-invoice"); if (inv) inv.onclick = async function () {
      if (!proj.partner_id) { toast("Set a Customer on the project first."); return; }
      var amt = Number(cert.current_certified) || 0;
      if (!(amt > 0.005)) { toast("This certificate has nothing to invoice - the current amount is zero."); return; }
      var num = await nextNumber("out_invoice");
      var ins = await sb.from("invoices").insert({ company_id: S.company.id, move_type: "out_invoice", partner_id: proj.partner_id, number: num, invoice_date: cert.date_to || today(), due_date: new Date(Date.now() + 2592e6).toISOString().slice(0, 10), currency_code: S.company.currency_code, state: "draft", project_id: cert.project_id, ref: "Progress cert " + (cert.number || ""), amount_untaxed: amt, amount_total: amt, amount_residual: amt }).select("id").single();
      if (ins.error) { toast("Invoice failed: " + errMsg(ins.error)); return; }
      var incAcc = (await sb.from("accounts").select("id").eq("company_id", S.company.id).eq("code", "7000").maybeSingle()).data;
      await sb.from("invoice_lines").insert({ company_id: S.company.id, invoice_id: ins.data.id, sequence: 10, name: "Progress certificate " + (cert.number || "") + " - " + (proj.name || ""), account_id: incAcc ? incAcc.id : null, quantity: 1, unit_price: Number(cert.current_certified) || 0, price_subtotal: Number(cert.current_certified) || 0 });
      // book the retention held by the client as a receivable (revenue recognised on gross work)
      var prevRet = prevCert ? Number(prevCert.retention_amount || 0) : 0;
      await postRetentionEntry("4110", "7000", Number(cert.retention_amount || 0) - prevRet, "Retention receivable " + (cert.number || "") + " - " + (proj.name || ""), ins.data.id);
      // advance recovered this period: clear the customer-advance liability and recognise that revenue (Dr 4190 / Cr 7000)
      await postRetentionEntry("4190", "7000", Number(cert.advance_recovery || 0), "Advance recovery " + (cert.number || "") + " - " + (proj.name || ""), ins.data.id, "advance");
      await sb.from("project_certificates").update({ state: "invoiced", invoice_id: ins.data.id }).eq("id", cert.id);
      toast("Draft invoice created"); renderInvoiceForm(ins.data.id, "out_invoice");
    };
  }

  // ---- Project P&L ----
  // Cost categories: normalise a budget category label and map a GL account code to a category,
  // so we can compare budget vs actual per category and alert when a category goes over.
  var COST_CATS = ["Material", "Labour", "Subcontract", "Overhead"];
  function normCat(c) {
    c = String(c || "").toLowerCase();
    if (c.indexOf("labour") >= 0 || c.indexOf("labor") >= 0) return "Labour";
    if (c.indexOf("subcon") >= 0 || c.indexOf("sub-con") >= 0 || c.indexOf("sub con") >= 0) return "Subcontract";
    if (c.indexOf("material") >= 0 || c.indexOf("supply") >= 0 || c.indexOf("procure") >= 0) return "Material";
    return "Overhead";
  }
  function catForAccount(code) {
    code = String(code || "");
    if (code === "6100") return "Subcontract";
    if (code === "6400" || code === "4200") return "Labour";
    if (code === "6000" || code.charAt(0) === "3") return "Material";
    return "Overhead";
  }
  // product_id -> cost category via its expense account (default Material = procurement),
  // so committed purchase orders can be split by category for early over-budget warnings.
  async function productCatMap() {
    var prods = (await sb.from("products").select("id,expense_account_id").eq("company_id", S.company.id)).data || [];
    var accs = (await sb.from("accounts").select("id,code").eq("company_id", S.company.id)).data || [];
    var codeById = {}; accs.forEach(function (a) { codeById[a.id] = a.code; });
    var m = {}; prods.forEach(function (p) { m[p.id] = p.expense_account_id ? catForAccount(codeById[p.expense_account_id]) : "Material"; });
    return m;
  }

  async function renderProjectPnL() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Project P&L") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var cc = S.company.currency_code;
    var projs = (await sb.from("projects").select("id,name,contract_value").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var certs = (await sb.from("project_certificates").select("project_id,current_certified,state").eq("company_id", S.company.id)).data || [];
    var budgets = (await sb.from("project_budgets").select("project_id,category,amount").eq("company_id", S.company.id)).data || [];
    // ACTUAL cost = posted project-tagged vendor bill lines (by GL account) + materials issued + site labour
    var billLines = (await sb.from("invoice_lines").select("price_subtotal, accounts(code), invoices!inner(project_id,move_type,state,company_id)").eq("invoices.company_id", S.company.id).eq("invoices.move_type", "in_invoice").eq("invoices.state", "posted").not("invoices.project_id", "is", null)).data || [];
    var issues = (await sb.from("stock_moves").select("quantity,project_id,products(cost_price)").eq("company_id", S.company.id).not("project_id", "is", null)).data || [];
    var labour = (await sb.from("install_jobs").select("project_id,labour_cost").eq("company_id", S.company.id).not("project_id", "is", null)).data || [];
    // COMMITTED = open purchase orders (draft/sent/purchase) tagged to the project, NET of what's already billed
    var poLines = (await sb.from("purchase_order_lines").select("price_subtotal,quantity,qty_billed,product_id, purchase_orders!inner(project_id,state,company_id)").eq("purchase_orders.company_id", S.company.id).not("purchase_orders.project_id", "is", null).in("purchase_orders.state", ["draft", "sent", "purchase"])).data || [];
    var pm = await productCatMap();
    var certBy = {}, budBy = {}, actBy = {}, comBy = {}, catAct = {}, catBud = {}, catCom = {};
    function bump(o, pid, cat, v) { if (!o[pid]) o[pid] = {}; o[pid][cat] = (o[pid][cat] || 0) + v; }
    certs.forEach(function (c) { if (c.state !== "draft") certBy[c.project_id] = (certBy[c.project_id] || 0) + Number(c.current_certified || 0); });
    budgets.forEach(function (b) { budBy[b.project_id] = (budBy[b.project_id] || 0) + Number(b.amount || 0); bump(catBud, b.project_id, normCat(b.category), Number(b.amount || 0)); });
    billLines.forEach(function (l) { var pid = l.invoices && l.invoices.project_id; if (!pid) return; var v = Number(l.price_subtotal || 0); actBy[pid] = (actBy[pid] || 0) + v; bump(catAct, pid, catForAccount(l.accounts && l.accounts.code), v); });
    issues.forEach(function (m) { var v = Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0); actBy[m.project_id] = (actBy[m.project_id] || 0) + v; bump(catAct, m.project_id, "Material", v); });
    labour.forEach(function (l) { var v = Number(l.labour_cost || 0); if (!v || !l.project_id) return; actBy[l.project_id] = (actBy[l.project_id] || 0) + v; bump(catAct, l.project_id, "Labour", v); });
    poLines.forEach(function (l) { var pid = l.purchase_orders && l.purchase_orders.project_id; if (!pid) return; var q = Number(l.quantity || 0), b = Number(l.qty_billed || 0), frac = q > 0 ? Math.max(0, (q - b) / q) : 1, v = Number(l.price_subtotal || 0) * frac; comBy[pid] = (comBy[pid] || 0) + v; bump(catCom, pid, (l.product_id && pm[l.product_id]) || "Material", v); });
    // red = actual already over budget in a category; amber = actual under but actual+committed will exceed it
    function overCats(pid) { var out = []; COST_CATS.forEach(function (c) { var a = (catAct[pid] || {})[c] || 0, bd = (catBud[pid] || {})[c] || 0; if (a > 0 && a > bd + 0.005) out.push({ cat: c, act: a, bud: bd }); }); return out; }
    function foreCats(pid) { var out = []; COST_CATS.forEach(function (c) { var a = (catAct[pid] || {})[c] || 0, cm = (catCom[pid] || {})[c] || 0, bd = (catBud[pid] || {})[c] || 0; if (bd > 0 && a <= bd + 0.005 && a + cm > bd + 0.005) out.push({ cat: c, gap: a + cm - bd }); }); return out; }
    var tc = 0, tcert = 0, tbud = 0, tact = 0, tcom = 0, alerts = [], foreAlerts = [];
    var rows = projs.map(function (p) {
      var cv = Number(p.contract_value) || 0, cert = certBy[p.id] || 0, bud = budBy[p.id] || 0, act = actBy[p.id] || 0, com = comBy[p.id] || 0;
      var variance = bud - act, margin = cert - act, over = overCats(p.id), fore = foreCats(p.id);
      if (over.length) alerts.push({ name: p.name, over: over });
      if (fore.length) foreAlerts.push({ name: p.name, fore: fore });
      tc += cv; tcert += cert; tbud += bud; tact += act; tcom += com;
      var vc = variance < 0 ? ' style="color:var(--bad)"' : '';
      var flag = over.length ? ' <span class="ob-flag" title="Over budget: ' + over.map(function (o) { return esc(o.cat); }).join(", ") + '">! over</span>'
        : (fore.length ? ' <span class="ob-flag" style="background:var(--warn)" title="Committed cost will exceed budget: ' + fore.map(function (o) { return esc(o.cat); }).join(", ") + '">forecast</span>' : '');
      return '<tr class="pnl-row" data-proj="' + p.id + '" style="cursor:pointer"><td>' + esc(p.name) + flag + '</td><td class="num">' + money(cv) + '</td><td class="num">' + money(cert) + '</td><td class="num">' + money(bud) + '</td><td class="num">' + money(act) + '</td><td class="num">' + money(com) + '</td><td class="num"' + vc + '>' + money(variance) + '</td><td class="num">' + money(margin) + '</td></tr>';
    }).join("");
    var tvar = tbud - tact, tmargin = tcert - tact;
    var banner = (alerts.length ? '<div class="ob-banner">! ' + alerts.length + ' project' + (alerts.length > 1 ? "s" : "") + ' over budget in a category &middot; ' + alerts.map(function (a) { return '<b>' + esc(a.name) + '</b> (' + a.over.map(function (o) { return esc(o.cat) + " +" + cc + " " + money(o.act - o.bud); }).join(", ") + ')'; }).join(" &nbsp;|&nbsp; ") + '</div>' : '')
      + (foreAlerts.length ? '<div class="ob-banner warn">Forecast: ' + foreAlerts.length + ' project' + (foreAlerts.length > 1 ? "s" : "") + ' where committed cost will exceed a category budget &middot; ' + foreAlerts.map(function (a) { return '<b>' + esc(a.name) + '</b> (' + a.fore.map(function (o) { return esc(o.cat) + " +" + cc + " " + money(o.gap); }).join(", ") + ')'; }).join(" &nbsp;|&nbsp; ") + '</div>' : '');
    document.getElementById("rep").innerHTML = '<h1>Project P&amp;L</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; active projects &middot; click a project for its cost detail</div>' + banner +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Project</td><td class="num">Contract</td><td class="num">Certified</td><td class="num">Budget cost</td><td class="num">Actual cost</td><td class="num">Committed</td><td class="num">Cost variance</td><td class="num">Margin</td></tr></thead><tbody>' +
      (rows || '<tr><td colspan="8" class="muted">No active projects.</td></tr>') +
      '<tr class="tot"><td>Total</td><td class="num">' + money(tc) + '</td><td class="num">' + money(tcert) + '</td><td class="num">' + money(tbud) + '</td><td class="num">' + money(tact) + '</td><td class="num">' + money(tcom) + '</td><td class="num">' + money(tvar) + '</td><td class="num">' + money(tmargin) + '</td></tr>' +
      '</tbody></table></div>' +
      '<div class="sub" style="margin-top:12px">Actual = posted project bills + materials issued + site labour. Committed = open POs tagged to the project. Cost variance = Budget - Actual (red if over). Margin = Certified - Actual. <b>! over</b> = actual cost has already passed a category budget; <b style="color:var(--warn)">forecast</b> = committed cost will take a category over. Click a project for the by-category breakdown.</div>';
    document.querySelectorAll(".pnl-row").forEach(function (tr) { tr.onclick = function () { renderProjectCosts(tr.dataset.proj); }; });
  }

  // ---- Per-project cost drill-down (from Project P&L rows / project smart button) ----
  async function renderProjectCosts(projectId) {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("...", { action: "proj.pnl", title: "Project P&L" }) + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var cc = S.company.currency_code;
    var proj = (await sb.from("projects").select("id,name,contract_value").eq("id", projectId).maybeSingle()).data || {};
    document.querySelector(".o-bc span:last-child").textContent = proj.name || "Project";
    var certs = (await sb.from("project_certificates").select("number,date_to,current_certified,state").eq("project_id", projectId).order("date_to")).data || [];
    var budgets = (await sb.from("project_budgets").select("category,description,amount").eq("project_id", projectId).order("id")).data || [];
    var bills = (await sb.from("invoices").select("number,invoice_date,amount_untaxed, partners(name)").eq("company_id", S.company.id).eq("move_type", "in_invoice").eq("state", "posted").eq("project_id", projectId).order("invoice_date")).data || [];
    var issues = (await sb.from("stock_moves").select("quantity,date, products(name,cost_price)").eq("company_id", S.company.id).eq("project_id", projectId).order("date")).data || [];
    var billLinesD = (await sb.from("invoice_lines").select("price_subtotal, accounts(code), invoices!inner(project_id,move_type,state,company_id)").eq("invoices.company_id", S.company.id).eq("invoices.move_type", "in_invoice").eq("invoices.state", "posted").eq("invoices.project_id", projectId)).data || [];
    var labourD = (await sb.from("install_jobs").select("number,description,foreman,labour_hours,labour_cost").eq("company_id", S.company.id).eq("project_id", projectId).order("created_at")).data || [];
    var poLinesD = (await sb.from("purchase_order_lines").select("price_subtotal,quantity,qty_billed,product_id, purchase_orders!inner(id,number,state,project_id,company_id)").eq("purchase_orders.company_id", S.company.id).eq("purchase_orders.project_id", projectId).in("purchase_orders.state", ["draft", "sent", "purchase"])).data || [];
    var pmD = await productCatMap();
    var poNet = {}, cCom = {};
    poLinesD.forEach(function (l) { var po = l.purchase_orders; var q = Number(l.quantity || 0), b = Number(l.qty_billed || 0), frac = q > 0 ? Math.max(0, (q - b) / q) : 1, v = Number(l.price_subtotal || 0) * frac; if (!poNet[po.id]) poNet[po.id] = { number: po.number, state: po.state, amt: 0 }; poNet[po.id].amt += v; cCom[(l.product_id && pmD[l.product_id]) || "Material"] = (cCom[(l.product_id && pmD[l.product_id]) || "Material"] || 0) + v; });
    var pos = Object.keys(poNet).map(function (k) { return poNet[k]; }).filter(function (p) { return p.amt > 0.005; });
    var cv = Number(proj.contract_value) || 0;
    var certified = certs.filter(function (c) { return c.state !== "draft"; }).reduce(function (s, c) { return s + Number(c.current_certified || 0); }, 0);
    var budTot = budgets.reduce(function (s, b) { return s + Number(b.amount || 0); }, 0);
    var billTot = bills.reduce(function (s, b) { return s + Number(b.amount_untaxed || 0); }, 0);
    var issTot = issues.reduce(function (s, m) { return s + Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0); }, 0);
    var labTot = labourD.reduce(function (s, l) { return s + Number(l.labour_cost || 0); }, 0);
    var actTot = billTot + issTot + labTot;
    var comTot = pos.reduce(function (s, p) { return s + Number(p.amt || 0); }, 0);
    var margin = certified - actTot;
    // Budget vs actual by category, so an over-budget category jumps out
    var cAct = {}, cBud = {};
    function bumpc(o, cat, v) { o[cat] = (o[cat] || 0) + v; }
    billLinesD.forEach(function (l) { bumpc(cAct, catForAccount(l.accounts && l.accounts.code), Number(l.price_subtotal || 0)); });
    issues.forEach(function (m) { bumpc(cAct, "Material", Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0)); });
    if (labTot) bumpc(cAct, "Labour", labTot);
    budgets.forEach(function (b) { bumpc(cBud, normCat(b.category), Number(b.amount || 0)); });
    var comTotCat = 0;
    var catRows = COST_CATS.map(function (c) {
      var bud = cBud[c] || 0, act = cAct[c] || 0, com = cCom[c] || 0, fore = act + com;
      comTotCat += com;
      if (bud === 0 && act === 0 && com === 0) return "";
      var st, cls = "";
      if (bud === 0 && act > 0.005) { st = '<span class="ob-flag">! no budget</span>'; cls = ' style="background:var(--bad-s)"'; }
      else if (act > bud + 0.005) { st = '<span class="ob-flag">! over by ' + cc + ' ' + money(act - bud) + '</span>'; cls = ' style="background:var(--bad-s)"'; }
      else if (bud > 0 && fore > bud + 0.005) { st = '<span class="ob-flag" style="background:var(--warn)">forecast over by ' + cc + ' ' + money(fore - bud) + '</span>'; cls = ' style="background:var(--warn-s)"'; }
      else if (bud > 0 && act >= bud * 0.9) { st = '<span class="ob-flag" style="background:var(--warn)">near limit</span>'; }
      else { st = '<span style="color:var(--good);font-weight:600">ok</span>'; }
      return '<tr' + cls + '><td>' + c + '</td><td class="num">' + money(bud) + '</td><td class="num">' + money(act) + '</td><td class="num">' + money(com) + '</td><td class="num">' + money(fore) + '</td><td class="num">' + (bud > 0 ? Math.round(fore / bud * 100) + '%' : '-') + '</td><td>' + st + '</td></tr>';
    }).filter(Boolean).join("");
    function kpi2(l, v) { return '<div class="kpi"><div class="l">' + l + '</div><div class="n">' + cc + ' ' + money(v) + '</div></div>'; }
    var billRows = bills.map(function (b) { return '<tr><td>' + esc(b.number || "") + '</td><td>' + esc(b.partners ? b.partners.name : "") + '</td><td class="muted">' + esc(b.invoice_date || "") + '</td><td class="num">' + money(b.amount_untaxed) + '</td></tr>'; }).join("");
    var issRows = issues.map(function (m) { return '<tr><td>' + esc(m.products ? m.products.name : "") + '</td><td class="muted">' + esc((m.date || "").slice(0, 10)) + '</td><td class="num">' + Number(m.quantity) + '</td><td class="num">' + money(Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0)) + '</td></tr>'; }).join("");
    var budRows = budgets.map(function (b) { return '<tr><td>' + esc(b.category || "") + '</td><td>' + esc(b.description || "") + '</td><td class="num">' + money(b.amount) + '</td></tr>'; }).join("");
    var labRows = labourD.map(function (l) { return '<tr><td>' + esc(l.number || "") + '</td><td>' + esc(l.description || "") + '</td><td class="muted">' + esc(l.foreman || "") + '</td><td class="num">' + Number(l.labour_hours || 0) + '</td><td class="num">' + money(l.labour_cost) + '</td></tr>'; }).join("");
    var poRows = pos.map(function (p) { return '<tr><td>' + esc(p.number || "") + '</td><td class="muted">' + esc(p.state) + '</td><td class="num">' + money(p.amt) + '</td></tr>'; }).join("");
    var anyOver = COST_CATS.some(function (c) { return (cAct[c] || 0) > (cBud[c] || 0) + 0.005 && (cAct[c] || 0) > 0; });
    var anyFore = !anyOver && COST_CATS.some(function (c) { var bd = cBud[c] || 0; return bd > 0 && (cAct[c] || 0) <= bd + 0.005 && (cAct[c] || 0) + (cCom[c] || 0) > bd + 0.005; });
    document.getElementById("rep").innerHTML = '<h1>' + esc(proj.name || "Project") + ' &middot; cost detail</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + '</div>' +
      '<div class="kpis" style="margin:14px 0 4px">' + kpi2("Contract", cv) + kpi2("Certified", certified) + kpi2("Budget cost", budTot) + kpi2("Actual cost", actTot) + kpi2("Committed", comTot) + kpi2("Margin (cert - actual)", margin) + '</div>' +
      (anyOver ? '<div class="ob-banner" style="margin:10px 0">! This project is over budget in one or more categories - see the cost control table below.</div>' : (anyFore ? '<div class="ob-banner warn" style="margin:10px 0">Forecast: committed cost will push one or more categories over budget - see the cost control table below.</div>' : '')) +
      '<h3 style="font-size:14px;margin:18px 0 6px">Cost control by category</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Category</td><td class="num">Budget</td><td class="num">Actual</td><td class="num">Committed</td><td class="num">Forecast</td><td class="num">Used</td><td>Status</td></tr></thead><tbody>' + (catRows || '<tr><td colspan="7" class="muted">No budget or costs yet.</td></tr>') + '<tr class="tot"><td>Total</td><td class="num">' + money(budTot) + '</td><td class="num">' + money(actTot) + '</td><td class="num">' + money(comTotCat) + '</td><td class="num">' + money(actTot + comTotCat) + '</td><td class="num">' + (budTot > 0 ? Math.round((actTot + comTotCat) / budTot * 100) + '%' : '-') + '</td><td></td></tr></tbody></table></div>' +
      '<div class="sub" style="margin-top:6px">Actual = vendor bills (by GL account: 6000/3xxx Material, 6100 Subcontract, 6400 Labour) + materials issued (Material) + installation labour (Labour). Committed = open POs not yet billed, split by category. Forecast = Actual + Committed. Red = a category has already spent past its budget; amber = committed cost will take it over.</div>' +
      '<h3 style="font-size:14px;margin:18px 0 6px">Cost budget</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Category</td><td>Description</td><td class="num">Budget</td></tr></thead><tbody>' + (budRows || '<tr><td colspan="3" class="muted">No budget lines.</td></tr>') + '<tr class="tot"><td>Total budget</td><td></td><td class="num">' + money(budTot) + '</td></tr></tbody></table></div>' +
      '<h3 style="font-size:14px;margin:20px 0 6px">Actual - vendor bills (posted, tagged to this project)</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Bill</td><td>Vendor</td><td>Date</td><td class="num">Amount</td></tr></thead><tbody>' + (billRows || '<tr><td colspan="4" class="muted">No project bills yet.</td></tr>') + '<tr class="tot"><td>Total bills</td><td></td><td></td><td class="num">' + money(billTot) + '</td></tr></tbody></table></div>' +
      '<h3 style="font-size:14px;margin:20px 0 6px">Actual - materials issued to site</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Material</td><td>Date</td><td class="num">Qty</td><td class="num">Cost value</td></tr></thead><tbody>' + (issRows || '<tr><td colspan="4" class="muted">No materials issued yet.</td></tr>') + '<tr class="tot"><td>Total issued</td><td></td><td></td><td class="num">' + money(issTot) + '</td></tr></tbody></table></div>' +
      (labourD.length ? '<h3 style="font-size:14px;margin:20px 0 6px">Actual - site labour (installation)</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Job</td><td>Description</td><td>Foreman</td><td class="num">Hours</td><td class="num">Cost</td></tr></thead><tbody>' + labRows + '<tr class="tot"><td>Total labour</td><td></td><td></td><td></td><td class="num">' + money(labTot) + '</td></tr></tbody></table></div>' : '') +
      '<h3 style="font-size:14px;margin:20px 0 6px">Committed - open purchase orders</h3><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>PO</td><td>Status</td><td class="num">Amount</td></tr></thead><tbody>' + (poRows || '<tr><td colspan="3" class="muted">No open POs.</td></tr>') + '<tr class="tot"><td>Total committed</td><td></td><td class="num">' + money(comTot) + '</td></tr></tbody></table></div>';
  }

  // Book retention as a real GL balance: a separate balanced entry (positive dr/cr, no negative lines
  // so it passes the journal_lines non-negative check). Client: Dr 4110 / Cr 7000. Sub: Dr 6100 / Cr 4010.
  async function postRetentionEntry(drCode, crCode, amount, narration, invId, sourceType) {
    if (!(Number(amount) > 0.005)) return;
    var accs = (await sb.from("accounts").select("id,code").eq("company_id", S.company.id).in("code", [drCode, crCode])).data || [];
    var by = {}; accs.forEach(function (a) { by[a.code] = a.id; });
    if (!by[drCode] || !by[crCode]) return;
    var jr = (await sb.from("journals").select("id").eq("company_id", S.company.id).eq("code", "MISC").maybeSingle()).data;
    if (!jr) return;
    var e = await sb.from("journal_entries").insert({ company_id: S.company.id, journal_id: jr.id, date: today(), ref: "", narration: narration, currency_code: S.company.currency_code, state: "draft", source_type: sourceType || "retention", source_id: invId ? String(invId) : "" }).select("id").single();
    if (e.error) return;
    var lr = await sb.from("journal_lines").insert([
      { entry_id: e.data.id, company_id: S.company.id, account_id: by[drCode], label: narration, debit: Number(amount), credit: 0 },
      { entry_id: e.data.id, company_id: S.company.id, account_id: by[crCode], label: narration, debit: 0, credit: Number(amount) }
    ]);
    if (lr.error) return;
    await sb.rpc("post_entry", { p_entry: e.data.id });
    return e.data.id;
  }

  // ---- Retention report (cash held on both sides) ----
  async function renderRetention() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("Retention") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var cc = S.company.currency_code;
    // client-side retention held from us = latest non-draft progress certificate per project (retention_amount is cumulative on gross-to-date)
    var certs = (await sb.from("project_certificates").select("project_id,date_to,gross_to_date,retention_amount,state, projects(name)").eq("company_id", S.company.id).neq("state", "draft").order("date_to", { ascending: true })).data || [];
    var byProj = {}; certs.forEach(function (c) { byProj[c.project_id] = c; });
    // subcontractor-side retention we hold = latest non-draft subcontract certificate per subcontract
    var scerts = (await sb.from("subcontract_certificates").select("subcontract_id,date_to,gross_to_date,retention_amount,state, subcontracts(name, partners(name))").eq("company_id", S.company.id).neq("state", "draft").order("date_to", { ascending: true })).data || [];
    var bySc = {}; scerts.forEach(function (c) { bySc[c.subcontract_id] = c; });
    var releases = (await sb.from("retention_releases").select("side,project_id,subcontract_id,amount").eq("company_id", S.company.id)).data || [];
    var relProj = {}, relSc = {};
    releases.forEach(function (r) { if (r.side === "client" && r.project_id) relProj[r.project_id] = (relProj[r.project_id] || 0) + Number(r.amount || 0); if (r.side === "sub" && r.subcontract_id) relSc[r.subcontract_id] = (relSc[r.subcontract_id] || 0) + Number(r.amount || 0); });
    var recvHeld = 0, recvRel = 0, recvOut = 0, payHeld = 0, payRel = 0, payOut = 0;
    var recvRows = Object.keys(byProj).map(function (pid) {
      var c = byProj[pid], held = Number(c.retention_amount || 0), rel = relProj[pid] || 0, out = held - rel;
      recvHeld += held; recvRel += rel; recvOut += out;
      var nm = c.projects ? c.projects.name : "";
      var btn = out > 0.005 ? '<button class="btn sm rel-btn" data-side="client" data-id="' + pid + '" data-name="' + esc(nm) + '" data-out="' + out + '">Release</button>' : '';
      return '<tr><td>' + esc(nm) + '</td><td class="num">' + money(c.gross_to_date) + '</td><td class="num">' + money(held) + '</td><td class="num">' + money(rel) + '</td><td class="num"><b>' + money(out) + '</b></td><td>' + btn + '</td></tr>';
    }).join("");
    var payRows = Object.keys(bySc).map(function (sid) {
      var c = bySc[sid], held = Number(c.retention_amount || 0), rel = relSc[sid] || 0, out = held - rel;
      payHeld += held; payRel += rel; payOut += out;
      var sc = c.subcontracts || {}, nm = sc.name || "";
      var btn = out > 0.005 ? '<button class="btn sm rel-btn" data-side="sub" data-id="' + sid + '" data-name="' + esc(nm) + '" data-out="' + out + '">Release</button>' : '';
      return '<tr><td>' + esc(nm) + '</td><td>' + esc(sc.partners ? sc.partners.name : "") + '</td><td class="num">' + money(c.gross_to_date) + '</td><td class="num">' + money(held) + '</td><td class="num">' + money(rel) + '</td><td class="num"><b>' + money(out) + '</b></td><td>' + btn + '</td></tr>';
    }).join("");
    var net = recvOut - payOut;
    document.getElementById("rep").innerHTML = '<h1>Retention</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; held vs released vs outstanding</div>' +
      '<h3 style="font-size:14px;margin:14px 0 6px">Retention held by clients &middot; receivable to us</h3>' +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Project</td><td class="num">Gross certified</td><td class="num">Held</td><td class="num">Released</td><td class="num">Outstanding</td><td></td></tr></thead><tbody>' +
      (recvRows || '<tr><td colspan="6" class="muted">No certified progress certificates yet.</td></tr>') +
      '<tr class="tot"><td>Total</td><td class="num"></td><td class="num">' + money(recvHeld) + '</td><td class="num">' + money(recvRel) + '</td><td class="num">' + money(recvOut) + '</td><td></td></tr></tbody></table></div>' +
      '<h3 style="font-size:14px;margin:20px 0 6px">Retention we hold from subcontractors &middot; payable by us</h3>' +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Subcontract</td><td>Subcontractor</td><td class="num">Gross certified</td><td class="num">Held</td><td class="num">Released</td><td class="num">Outstanding</td><td></td></tr></thead><tbody>' +
      (payRows || '<tr><td colspan="7" class="muted">No certified subcontract certificates yet.</td></tr>') +
      '<tr class="tot"><td>Total</td><td></td><td class="num"></td><td class="num">' + money(payHeld) + '</td><td class="num">' + money(payRel) + '</td><td class="num">' + money(payOut) + '</td><td></td></tr></tbody></table></div>' +
      '<div class="o-tot" style="margin-top:16px"><div class="r"><span class="k">Retention receivable outstanding (clients hold)</span><span>' + cc + ' ' + money(recvOut) + '</span></div><div class="r"><span class="k">Retention payable outstanding (we hold)</span><span>-' + cc + ' ' + money(payOut) + '</span></div><div class="r tt"><span class="k">Net retention position</span><span>' + cc + ' ' + money(net) + '</span></div></div>' +
      '<div class="sub" style="margin-top:10px">Release retention when it falls due (practical completion / end of the defects-liability period). Releasing a client line records cash received (Dr Bank / Cr Retention receivable); releasing a subcontractor line records cash paid (Dr Retention payable / Cr Bank).</div>';
    document.querySelectorAll(".rel-btn").forEach(function (b) { b.onclick = function () { openReleaseModal(b.dataset.side, b.dataset.id, b.dataset.name, Number(b.dataset.out)); }; });
  }
  async function openReleaseModal(side, entityId, name, outstanding) {
    var cc = S.company.currency_code;
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Release retention &middot; ' + esc(name) + '</h3><div class="form">' +
      '<div><label>Amount (' + esc(cc) + ')</label>' + fhint("__ramt", "How much retention to release now. Defaults to the full outstanding amount.") + '<input id="rel-amt" type="number" step="0.01" value="' + outstanding + '"></div>' +
      '<div class="row2"><div><label>Date</label>' + fhint("__rdate", "When the retention is released / settled.") + '<input id="rel-date" type="date" value="' + today() + '"></div>' +
      '<div><label>Through</label>' + fhint("__rjrn", side === "client" ? "Where the retention cash is received." : "Where the retention cash is paid from.") + '<select id="rel-jrn"><option value="5100">Bank</option><option value="5300">Cash</option></select></div></div>' +
      '</div><div class="foot"><button class="btn" id="rel-cancel">Cancel</button><button class="btn pri" id="rel-save" style="background:var(--accent);border-color:var(--accent)">' + (side === "client" ? "Record receipt" : "Record payment") + '</button></div></div>';
    document.body.appendChild(m);
    m.querySelector(".form").style.cssText = "padding:16px 18px;display:grid;gap:12px";
    document.getElementById("rel-cancel").onclick = function () { m.remove(); };
    document.getElementById("rel-save").onclick = async function () {
      var amt = parseFloat(document.getElementById("rel-amt").value);
      if (!(amt > 0)) { toast("Enter an amount"); return; }
      if (amt > outstanding + 0.005) { toast("More than the outstanding retention"); return; }
      var ok = await postRetentionRelease(side, entityId, name, amt, document.getElementById("rel-date").value, document.getElementById("rel-jrn").value);
      if (!ok) return;
      m.remove(); toast("Retention released"); renderRetention();
    };
  }
  async function postRetentionRelease(side, entityId, name, amount, date, bankCode) {
    // client: Dr Bank / Cr 4110 (retention received). sub: Dr 4010 / Cr Bank (retention paid).
    var drCode = side === "client" ? bankCode : "4010";
    var crCode = side === "client" ? "4110" : bankCode;
    var narr = (side === "client" ? "Retention released (received) - " : "Retention released (paid) - ") + name;
    var accs = (await sb.from("accounts").select("id,code").eq("company_id", S.company.id).in("code", [drCode, crCode])).data || [];
    var by = {}; accs.forEach(function (a) { by[a.code] = a.id; });
    if (!by[drCode] || !by[crCode]) { toast("Missing account " + drCode + " / " + crCode); return false; }
    var jr = (await sb.from("journals").select("id").eq("company_id", S.company.id).eq("code", "MISC").maybeSingle()).data;
    if (!jr) { toast("No misc journal"); return false; }
    var e = await sb.from("journal_entries").insert({ company_id: S.company.id, journal_id: jr.id, date: date || today(), ref: "", narration: narr, currency_code: S.company.currency_code, state: "draft", source_type: "retention_release", source_id: "" }).select("id").single();
    if (e.error) { toast(errMsg(e.error)); return false; }
    var lr = await sb.from("journal_lines").insert([
      { entry_id: e.data.id, company_id: S.company.id, account_id: by[drCode], label: narr, debit: Number(amount), credit: 0 },
      { entry_id: e.data.id, company_id: S.company.id, account_id: by[crCode], label: narr, debit: 0, credit: Number(amount) }
    ]);
    if (lr.error) { toast(errMsg(lr.error)); return false; }
    var pr = await sb.rpc("post_entry", { p_entry: e.data.id });
    if (pr.error) { toast(errMsg(pr.error)); return false; }
    var rec = { company_id: S.company.id, side: side, amount: Number(amount), release_date: date || today(), journal_entry_id: e.data.id };
    if (side === "client") rec.project_id = entityId; else rec.subcontract_id = entityId;
    await sb.from("retention_releases").insert(rec);
    return true;
  }

  // ---- WIP schedule (cost-to-cost % complete; over / under billing) ----
  async function renderWIP() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("WIP Schedule") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var cc = S.company.currency_code;
    var projs = (await sb.from("projects").select("id,name,contract_value").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var certs = (await sb.from("project_certificates").select("project_id,current_certified,state").eq("company_id", S.company.id)).data || [];
    var budgets = (await sb.from("project_budgets").select("project_id,amount").eq("company_id", S.company.id)).data || [];
    var billLines = (await sb.from("invoice_lines").select("price_subtotal, invoices!inner(project_id,move_type,state,company_id)").eq("invoices.company_id", S.company.id).eq("invoices.move_type", "in_invoice").eq("invoices.state", "posted").not("invoices.project_id", "is", null)).data || [];
    var issues = (await sb.from("stock_moves").select("quantity,project_id,products(cost_price)").eq("company_id", S.company.id).not("project_id", "is", null)).data || [];
    var certBy = {}, budBy = {}, actBy = {};
    certs.forEach(function (c) { if (c.state !== "draft") certBy[c.project_id] = (certBy[c.project_id] || 0) + Number(c.current_certified || 0); });
    budgets.forEach(function (b) { budBy[b.project_id] = (budBy[b.project_id] || 0) + Number(b.amount || 0); });
    billLines.forEach(function (l) { var pid = l.invoices && l.invoices.project_id; if (pid) actBy[pid] = (actBy[pid] || 0) + Number(l.price_subtotal || 0); });
    issues.forEach(function (m) { actBy[m.project_id] = (actBy[m.project_id] || 0) + Number(m.quantity || 0) * Number(m.products ? m.products.cost_price : 0); });
    var tcv = 0, tbud = 0, tact = 0, tearn = 0, tbill = 0, tob = 0;
    var rows = projs.map(function (p) {
      var cv = Number(p.contract_value) || 0, bud = budBy[p.id] || 0, act = actBy[p.id] || 0, billed = certBy[p.id] || 0;
      var pct = bud > 0 ? Math.min(act / bud, 1) : 0;
      var earned = cv * pct, ob = billed - earned;
      tcv += cv; tbud += bud; tact += act; tearn += earned; tbill += billed; tob += ob;
      var obc = ob > 0.005 ? ' style="color:var(--warn)"' : (ob < -0.005 ? ' style="color:var(--good)"' : '');
      return '<tr><td>' + esc(p.name) + '</td><td class="num">' + money(cv) + '</td><td class="num">' + money(bud) + '</td><td class="num">' + money(act) + '</td><td class="num">' + (pct * 100).toFixed(1) + '%</td><td class="num">' + money(earned) + '</td><td class="num">' + money(billed) + '</td><td class="num"' + obc + '>' + money(ob) + '</td></tr>';
    }).join("");
    document.getElementById("rep").innerHTML = '<h1>WIP schedule</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; % complete = actual cost / budget (cost-to-cost)</div>' +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Project</td><td class="num">Contract</td><td class="num">Budget</td><td class="num">Actual cost</td><td class="num">% complete</td><td class="num">Earned revenue</td><td class="num">Billed</td><td class="num">Over/(under) billed</td></tr></thead><tbody>' +
      (rows || '<tr><td colspan="8" class="muted">No active projects.</td></tr>') +
      '<tr class="tot"><td>Total</td><td class="num">' + money(tcv) + '</td><td class="num">' + money(tbud) + '</td><td class="num">' + money(tact) + '</td><td class="num"></td><td class="num">' + money(tearn) + '</td><td class="num">' + money(tbill) + '</td><td class="num">' + money(tob) + '</td></tr>' +
      '</tbody></table></div>' +
      '<div class="sub" style="margin-top:12px">Earned revenue = contract x % complete. Over-billed (amber) = billed more than earned (a liability); under-billed (green) = earned more than billed (an asset). Add a cost budget per project so % complete can be computed.</div>';
  }

  // ---- 3-way match (PO ordered vs goods received vs billed) ----
  async function renderMatch() {
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML("3-Way Match") + '<div class="gap"></div><button class="o-filtbtn" id="rp-print">Print</button></div><div class="o-form-bg"><div class="o-report wide" id="rep"><div class="o-empty">Loading...</div></div></div></div>';
    wireBc();
    document.getElementById("rp-print").onclick = function () { window.print(); };
    var cc = S.company.currency_code;
    var pos = (await sb.from("purchase_orders").select("id,number,state, partners(name)").eq("company_id", S.company.id).in("state", ["purchase", "done"]).order("date_order", { ascending: false })).data || [];
    if (!pos.length) { document.getElementById("rep").innerHTML = '<h1>3-Way Match</h1><div class="o-empty">No confirmed purchase orders yet. Confirm a PO, receive goods, then bill it to see the match here.</div>'; return; }
    var lines = (await sb.from("purchase_order_lines").select("order_id,name,quantity,qty_received,qty_billed,unit_price").in("order_id", pos.map(function (p) { return p.id; }))).data || [];
    var byPo = {}; lines.forEach(function (l) { (byPo[l.order_id] = byPo[l.order_id] || []).push(l); });
    function badge(ord, rec, bil) { return (bil > rec + 0.001) ? '<span class="badge unpaid">Billed &gt; received</span>' : (rec >= ord - 0.001 && bil >= ord - 0.001 ? '<span class="badge paid">Matched</span>' : (rec > 0.001 || bil > 0.001 ? '<span class="badge partial">In progress</span>' : '<span class="badge">Not received</span>')); }
    var rows = pos.map(function (p) {
      var ls = byPo[p.id] || [];
      var head = '<tr class="sec"><td colspan="6">' + esc(p.number || "") + ' &middot; ' + esc(p.partners ? p.partners.name : "") + '</td></tr>';
      var lrows = ls.map(function (l) { var ord = Number(l.quantity || 0), rec = Number(l.qty_received || 0), bil = Number(l.qty_billed || 0); return '<tr><td>' + esc(l.name) + '</td><td class="num">' + ord + '</td><td class="num">' + rec + '</td><td class="num">' + bil + '</td><td class="num">' + money(l.unit_price) + '</td><td>' + badge(ord, rec, bil) + '</td></tr>'; }).join("");
      return head + (lrows || '<tr><td colspan="6" class="muted">No lines.</td></tr>');
    }).join("");
    var exceptions = lines.filter(function (l) { return Number(l.qty_billed || 0) > Number(l.qty_received || 0) + 0.001; }).length;
    document.getElementById("rep").innerHTML = '<h1>3-Way Match</h1><div class="sub">' + esc(S.company.name) + ' &middot; ' + cc + ' &middot; ordered vs received vs billed &middot; ' + (exceptions ? '<span style="color:var(--bad)">' + exceptions + ' exception(s)</span>' : 'no exceptions') + '</div>' +
      '<div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Item</td><td class="num">Ordered</td><td class="num">Received</td><td class="num">Billed</td><td class="num">Unit price</td><td>Status</td></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="sub" style="margin-top:12px">Matched = goods received and billed both cover the ordered quantity. "Billed &gt; received" flags a bill for goods not yet received - investigate before paying. Use Receive goods on a confirmed PO to record receipts.</div>';
  }

  // ============================ MATERIAL REQUISITIONS ============================
  function cfgRequisitions() {
    return {
      title: "Material Requisitions", pageSize: 80,
      fetch: function () {
        return sb.from("material_requisitions").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (rows) {
          rows = rows.data || []; if (!rows.length) return rows;
          return sb.from("material_requisition_lines").select("requisition_id").in("requisition_id", rows.map(function (r) { return r.id; })).then(function (lr) {
            var cnt = {}; (lr.data || []).forEach(function (l) { cnt[l.requisition_id] = (cnt[l.requisition_id] || 0) + 1; }); rows.forEach(function (r) { r._lines = cnt[r.id] || 0; }); return rows;
          });
        });
      },
      searchText: function (r) { return (r.number || "") + " " + (r.requested_by || "") + " " + (r.projects ? r.projects.name : ""); },
      columns: [
        { label: "Number", get: function (r) { return '<b>' + esc(r.number || "/") + '</b>'; } },
        { label: "Project / site", get: function (r) { return esc(r.projects ? r.projects.name : ""); } },
        { label: "Requested by", get: function (r) { return esc(r.requested_by || ""); } },
        { label: "Date", get: function (r) { return '<span class="muted">' + esc(r.req_date || "") + '</span>'; } },
        { label: "Items", num: true, get: function (r) { return r._lines; } },
        { label: "Status", get: function (r) { return r.state === "ordered" ? '<span class="badge paid">Ordered</span>' : r.state === "approved" ? '<span class="badge partial">Approved</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Draft", test: function (r) { return r.state === "draft" || !r.state; } }, { label: "Approved", test: function (r) { return r.state === "approved"; } }, { label: "Ordered", test: function (r) { return r.state === "ordered"; } }],
      groupBy: [{ label: "Project", get: function (r) { return r.projects ? r.projects.name : "None"; } }, { label: "Status", get: function (r) { return r.state || "draft"; } }],
      onOpen: function (r) { renderRequisitionForm(r.id); }, onNew: function () { renderRequisitionForm("new"); }
    };
  }
  async function renderRequisitionForm(id) {
    var parent = { action: "pur.req", title: "Material Requisitions" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var req = id === "new" ? { state: "draft", req_date: today() } : (await sb.from("material_requisitions").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("material_requisition_lines").select("*").eq("requisition_id", id).order("sequence")).data || [];
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).order("name")).data || [];
    var products = (await sb.from("products").select("id,name,default_code,uom,cost_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var uoms = (await sb.from("uoms").select("name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var ordered = req.state === "ordered";
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (req.number || "Requisition");
    var uomOpts = '<option value="">-</option>' + uoms.map(function (u) { return '<option value="' + esc(u.name) + '">' + esc(u.name) + '</option>'; }).join("");
    var prodOpts = '<option value="">-</option>' + products.map(function (p) { return '<option value="' + p.id + '">' + esc((p.default_code ? "[" + p.default_code + "] " : "") + p.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + (ordered ? "" : '<button class="pri" id="mr-save">Save</button>') + '<button id="mr-discard">Discard</button>' + (id !== "new" && !ordered ? '<button id="mr-po">Create Purchase Order</button>' : "") + '</div>' +
      '<div class="o-stages"><span class="st ' + (!ordered ? "on" : "done") + '">Draft</span><span class="st ' + (req.state === "approved" ? "on" : ordered ? "done" : "") + '">Approved</span><span class="st ' + (ordered ? "on" : "") + '">Ordered</span></div></div>' +
      '<div class="o-sheet"><div class="o-title">Material Requisition</div>' +
      '<div class="o-groups"><div>' +
      fld("Number", '<input id="mr-num" value="' + esc(req.number || "") + '"' + (ordered ? " disabled" : "") + ' placeholder="auto">', "Your requisition reference. Left blank, we number it for you.") +
      fld("Project / site", '<select id="mr-proj"' + (ordered ? " disabled" : "") + '><option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (req.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("") + '</select>', "Which site needs the material.") +
      '</div><div>' +
      fld("Requested by", '<input id="mr-by" value="' + esc(req.requested_by || "") + '"' + (ordered ? " disabled" : "") + '>', "Who raised the request, e.g. the site engineer.") +
      fld("Date", '<input id="mr-date" type="date" value="' + (req.req_date || today()) + '"' + (ordered ? " disabled" : "") + '>', "When the material is needed.") +
      '</div></div>' +
      fld("Note", '<input id="mr-note" value="' + esc(req.note || "") + '"' + (ordered ? " disabled" : "") + ' placeholder="optional">', "Any instructions for procurement.") +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Requested items</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th style="width:200px">Product</th><th>Description</th><th style="width:80px;text-align:right">Qty</th><th style="width:110px">Unit</th>' + (ordered ? "" : '<th style="width:24px"></th>') + '</tr></thead><tbody id="mrbody"></tbody></table>' + (ordered ? "" : '<button class="o-addln" id="mr-addln">+ Add a line</button>') + '</div></div>' +
      '</div>';
    document.getElementById("mr-discard").onclick = function () { go("pur.req"); };
    var lb = document.getElementById("mrbody");
    function addRow(l) {
      var tr = document.createElement("tr");
      if (ordered) { tr.innerHTML = '<td>' + esc(l ? (products.filter(function (p) { return p.id === l.product_id; })[0] || {}).name || "" : "") + '</td><td>' + esc(l ? l.name : "") + '</td><td class="num">' + Number(l ? l.quantity : 0) + '</td><td>' + esc(l ? l.uom : "") + '</td>'; lb.appendChild(tr); return; }
      tr.innerHTML = '<td><select class="mr-prod">' + prodOpts + '</select></td><td><input class="mr-name" value="' + esc(l ? l.name : "") + '" placeholder="Description"></td><td><input class="mr-qty num" type="number" step="0.01" value="' + (l ? l.quantity : 1) + '"></td><td><select class="mr-uom">' + uomOpts + '</select></td><td><button class="del">&times;</button></td>';
      lb.appendChild(tr);
      if (l && l.product_id) tr.querySelector(".mr-prod").value = l.product_id;
      if (l && l.uom) tr.querySelector(".mr-uom").value = l.uom;
      var ps = tr.querySelector(".mr-prod");
      ps.addEventListener("change", function () { var pr = products.filter(function (x) { return x.id === ps.value; })[0]; if (!pr) return; tr.querySelector(".mr-name").value = pr.name; if (pr.uom) tr.querySelector(".mr-uom").value = pr.uom; });
      tr.querySelector(".del").onclick = function () { tr.remove(); };
    }
    if (lines.length) lines.forEach(addRow); else if (!ordered) addRow(null);
    var addb = document.getElementById("mr-addln"); if (addb) addb.onclick = function () { addRow(null); };
    function currentLines() {
      return Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) {
        var ps = tr.querySelector(".mr-prod"); if (!ps) return null;
        return { product_id: ps.value || null, name: (tr.querySelector(".mr-name").value || "").trim(), quantity: parseFloat(tr.querySelector(".mr-qty").value) || 0, uom: tr.querySelector(".mr-uom").value || "" };
      }).filter(function (l) { return l && (l.product_id || l.name); });
    }
    async function persist() {
      var lns = currentLines();
      var num = gv("mr-num") || (req.number || (await nextReqNumber()));
      var row = { number: num, project_id: document.getElementById("mr-proj").value || null, requested_by: gv("mr-by"), req_date: gv("mr-date"), note: gv("mr-note") };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("material_requisitions").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("material_requisitions").update(row).eq("id", id)).error) { toast("Save failed"); return null; } await sb.from("material_requisition_lines").delete().eq("requisition_id", id); }
      if (lns.length) { var lr = await sb.from("material_requisition_lines").insert(lns.map(function (l, i) { return { company_id: S.company.id, requisition_id: sid, product_id: l.product_id, name: l.name, quantity: l.quantity, uom: l.uom, sequence: (i + 1) * 10 }; })); if (lr.error) { toast("Lines failed: " + errMsg(lr.error)); return null; } }
      return sid;
    }
    var sv = document.getElementById("mr-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderRequisitionForm(sid); } };
    var pob = document.getElementById("mr-po"); if (pob) pob.onclick = async function () {
      var sid = await persist(); if (!sid) return;
      var lns = currentLines(); if (!lns.length) { toast("Add at least one item first"); return; }
      var poNum = await nextOrderNumber("purchase");
      var ins = await sb.from("purchase_orders").insert({ company_id: S.company.id, number: poNum, date_order: today(), state: "draft", currency_code: S.company.currency_code, project_id: document.getElementById("mr-proj").value || null, note: "From requisition " + (gv("mr-num") || "") }).select("id").single();
      if (ins.error) { toast("Could not create PO: " + errMsg(ins.error)); return; }
      var prMap = {}; products.forEach(function (p) { prMap[p.id] = p; });
      await sb.from("purchase_order_lines").insert(lns.map(function (l, i) { var pr = l.product_id ? prMap[l.product_id] : null, price = pr ? Number(pr.cost_price || 0) : 0; return { company_id: S.company.id, order_id: ins.data.id, sequence: (i + 1) * 10, product_id: l.product_id, name: l.name + (l.uom ? " (" + l.uom + ")" : ""), quantity: l.quantity, unit_price: price, price_subtotal: l.quantity * price }; }));
      await sb.from("material_requisitions").update({ state: "ordered" }).eq("id", sid);
      toast("Draft purchase order created - pick the vendor and confirm"); renderOrderForm(ins.data.id, "purchase");
    };
  }
  async function nextReqNumber() {
    var py = "MR/" + new Date().getFullYear() + "/";
    var rows = (await sb.from("material_requisitions").select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
    return py + ("0000" + (maxSeq(rows, py) + 1)).slice(-4);
  }

  // ============================ SUBCONTRACT CERTIFICATES (payables IPC) ============================
  function cfgSubcontractCerts() {
    return {
      title: "Subcontract Certificates", pageSize: 80,
      fetch: function () { return sb.from("subcontract_certificates").select("*, subcontracts(name, number, partners(name), projects(name))").eq("company_id", S.company.id).order("date_to", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (c) { return (c.number || "") + " " + (c.subcontracts ? c.subcontracts.name : "") + " " + (c.subcontracts && c.subcontracts.partners ? c.subcontracts.partners.name : ""); },
      columns: [
        { label: "Number", get: function (c) { return '<b>' + esc(c.number || "/") + '</b>'; } },
        { label: "Subcontract", get: function (c) { return esc(c.subcontracts ? c.subcontracts.name : ""); } },
        { label: "Subcontractor", get: function (c) { return esc(c.subcontracts && c.subcontracts.partners ? c.subcontracts.partners.name : ""); } },
        { label: "Date", get: function (c) { return '<span class="muted">' + esc(c.date_to || "") + '</span>'; } },
        { label: "Gross to date", num: true, get: function (c) { return money(c.gross_to_date); } },
        { label: "Retention", num: true, get: function (c) { return money(c.retention_amount); } },
        { label: "This certificate", num: true, get: function (c) { return '<b>' + money(c.current_certified) + '</b>'; } },
        { label: "Status", get: function (c) { return c.state === "billed" ? '<span class="badge paid">Billed</span>' : c.state === "certified" ? '<span class="badge partial">Certified</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Draft", test: function (c) { return c.state === "draft" || !c.state; } }, { label: "Certified", test: function (c) { return c.state === "certified"; } }, { label: "Billed", test: function (c) { return c.state === "billed"; } }],
      groupBy: [{ label: "Subcontractor", get: function (c) { return c.subcontracts && c.subcontracts.partners ? c.subcontracts.partners.name : "None"; } }, { label: "Project", get: function (c) { return c.subcontracts && c.subcontracts.projects ? c.subcontracts.projects.name : "None"; } }],
      onOpen: function (c) { renderSubcontractCertForm(c.id); }, onNew: function () { renderSubcontractCertForm("new"); }
    };
  }
  async function renderSubcontractCertForm(id, presetSc) {
    var parent = { action: "pur.sccert", title: "Subcontract Certificates" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var scs = (await sb.from("subcontracts").select("id,name,number,amount,retention_pct, partners(name), projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false })).data || [];
    if (!scs.length) { document.querySelector(".o-form").innerHTML = '<div class="o-sheet"><div class="o-empty">No subcontracts yet. Create one first (Projects &rsaquo; Subcontracts), then certify progress here.</div></div>'; return; }
    var cert = id === "new" ? { state: "draft", date_to: today(), subcontract_id: presetSc || scs[0].id } : (await sb.from("subcontract_certificates").select("*").eq("id", id).maybeSingle()).data || {};
    var sc = scs.filter(function (x) { return x.id === cert.subcontract_id; })[0] || scs[0];
    var cc = S.company.currency_code, posted = cert.state === "certified" || cert.state === "billed";
    var retPct = Number(sc.retention_pct) || 0, scAmt = Number(sc.amount) || 0;
    var prevCerts = (await sb.from("subcontract_certificates").select("*").eq("company_id", S.company.id).eq("subcontract_id", cert.subcontract_id).neq("id", id === "new" ? "00000000-0000-0000-0000-000000000000" : id).in("state", ["certified", "billed"]).order("date_to", { ascending: false })).data || [];
    var prevNet = prevCerts[0] ? Number(prevCerts[0].net_to_date) : 0;
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (cert.number || "Certificate");
    var scField = (id === "new") ? '<select id="sx-sc">' + scs.map(function (x) { return '<option value="' + x.id + '"' + (cert.subcontract_id === x.id ? " selected" : "") + '>' + esc((x.number ? x.number + " - " : "") + x.name + (x.partners ? " (" + x.partners.name + ")" : "")) + '</option>'; }).join("") + '</select>' : '<span class="v">' + esc((sc.number ? sc.number + " - " : "") + sc.name) + '</span>';
    var initPct = scAmt ? (Number(cert.gross_to_date || 0) / scAmt * 100) : Number(cert.percent_complete || 0);
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="sx-save">Save</button><button id="sx-discard">Discard</button>' + (id !== "new" && !posted ? '<button id="sx-certify">Certify</button>' : "") + (cert.state === "certified" ? '<button id="sx-bill">Create vendor bill</button>' : "") + '</div>' +
      '<div class="o-stages"><span class="st ' + (!posted ? "on" : "done") + '">Draft</span><span class="st ' + (cert.state === "certified" ? "on" : cert.state === "billed" ? "done" : "") + '">Certified</span><span class="st ' + (cert.state === "billed" ? "on" : "") + '">Billed</span></div></div>' +
      '<div class="o-sheet"><div class="o-title">Subcontract Payment Certificate</div>' +
      '<div class="o-groups"><div>' +
      fld("Subcontract", scField, "The subcontract whose progress you are certifying.") +
      fld("Subcontractor", '<span class="v">' + esc(sc.partners ? sc.partners.name : "") + '</span>', "The subcontractor who will be paid.") +
      fld("Certificate No.", '<input id="sx-num" value="' + esc(cert.number || "") + '"' + (posted ? " disabled" : "") + ' placeholder="e.g. SC-IPC-02">', "This certificate's number.") +
      '</div><div>' +
      fld("Subcontract value", '<span class="v">' + cc + " " + money(scAmt) + '</span>', "The agreed subcontract amount.") +
      fld("Date", '<input id="sx-date" type="date" value="' + (cert.date_to || today()) + '"' + (posted ? " disabled" : "") + '>', "Valuation date / period end.") +
      fld("Percent complete", '<input id="sx-pct" type="number" step="0.1" value="' + (Math.round(initPct * 100) / 100) + '"' + (posted ? " disabled" : "") + '>', "Cumulative work done, as a % of the subcontract value.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Valuation</div></div><div class="o-nb-pg"><div class="o-tot" id="sx-sum"></div></div></div>' +
      '</div>';
    document.getElementById("sx-discard").onclick = function () { go("pur.sccert"); };
    if (id === "new") { var scSel = document.getElementById("sx-sc"); if (scSel) scSel.onchange = function () { renderSubcontractCertForm("new", scSel.value); }; }
    function compute() {
      var pct = parseFloat(gv("sx-pct")) || 0, gross = scAmt * pct / 100;
      var retention = gross * retPct / 100, net = gross - retention, current = net - prevNet;
      document.getElementById("sx-sum").innerHTML =
        '<div class="r"><span class="k">Gross work to date (' + pct + '%)</span><span>' + cc + " " + money(gross) + '</span></div>' +
        '<div class="r"><span class="k">Less retention (' + retPct + '%)</span><span>-' + cc + " " + money(retention) + '</span></div>' +
        '<div class="r"><span class="k">Net to date</span><span>' + cc + " " + money(net) + '</span></div>' +
        '<div class="r"><span class="k">Less previously certified</span><span>-' + cc + " " + money(prevNet) + '</span></div>' +
        '<div class="r tt"><span class="k">Payable this certificate</span><span>' + cc + " " + money(current) + '</span></div>';
      return { pct: pct, gross: gross, retention: retention, net: net, current: current };
    }
    var pi = document.getElementById("sx-pct"); if (pi) pi.addEventListener("input", compute);
    compute();
    async function persist() {
      var scId = id === "new" ? (document.getElementById("sx-sc") ? document.getElementById("sx-sc").value : cert.subcontract_id) : cert.subcontract_id;
      var s = compute();
      var row = { subcontract_id: scId, number: gv("sx-num"), date_to: gv("sx-date"), percent_complete: s.pct, gross_to_date: s.gross, retention_pct: retPct, retention_amount: s.retention, net_to_date: s.net, previous_certified: prevNet, current_certified: s.current };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.state = "draft"; var ins = await sb.from("subcontract_certificates").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("subcontract_certificates").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    document.getElementById("sx-save").onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderSubcontractCertForm(sid); } };
    var cb = document.getElementById("sx-certify"); if (cb) cb.onclick = async function () { var sid = await persist(); if (!sid) return; await sb.from("subcontract_certificates").update({ state: "certified" }).eq("id", sid); toast("Certified"); renderSubcontractCertForm(sid); };
    var bb = document.getElementById("sx-bill"); if (bb) bb.onclick = async function () {
      var full = (await sb.from("subcontracts").select("vendor_id, project_id, name").eq("id", cert.subcontract_id).maybeSingle()).data || {};
      if (!full.vendor_id) { toast("Set a Vendor on the subcontract first."); return; }
      var num = await nextNumber("in_invoice");
      var accs = (await sb.from("accounts").select("id,code").eq("company_id", S.company.id).in("code", ["6100", "6000"])).data || [];
      var accBy = {}; accs.forEach(function (a) { accBy[a.code] = a.id; });
      var expAcc = accBy["6100"] || accBy["6000"] || null;
      var ins = await sb.from("invoices").insert({ company_id: S.company.id, move_type: "in_invoice", partner_id: full.vendor_id, number: num, invoice_date: cert.date_to || today(), currency_code: S.company.currency_code, state: "draft", project_id: full.project_id || null, ref: "Subcontract cert " + (cert.number || "") }).select("id").single();
      if (ins.error) { toast("Bill failed: " + errMsg(ins.error)); return; }
      await sb.from("invoice_lines").insert({ company_id: S.company.id, invoice_id: ins.data.id, sequence: 10, name: "Subcontract certificate " + (cert.number || "") + " - " + (full.name || ""), account_id: expAcc, quantity: 1, unit_price: Number(cert.current_certified) || 0, price_subtotal: Number(cert.current_certified) || 0 });
      // book the retention we hold from the subcontractor as a payable (cost recognised on gross work)
      var prevRet = prevCerts[0] ? Number(prevCerts[0].retention_amount || 0) : 0;
      await postRetentionEntry("6100", "4010", Number(cert.retention_amount || 0) - prevRet, "Retention payable " + (cert.number || "") + " - " + (full.name || ""), ins.data.id);
      await sb.from("subcontract_certificates").update({ state: "billed", bill_id: ins.data.id }).eq("id", cert.id);
      toast("Draft vendor bill created - retention booked to 4010"); renderInvoiceForm(ins.data.id, "in_invoice");
    };
  }

  // ============================ ESTIMATION / TENDERING ============================
  function cfgTenders() {
    return {
      title: "Tenders", pageSize: 80,
      emptyHint: "A tender is a priced construction bid: build up cost by trade, add margin, and track win/loss. This is the right place for project bids (not Sales quotations). Win one and it becomes a project.",
      fetch: function () { return sb.from("tenders").select("*, partners(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (t) { return (t.number || "") + " " + (t.name || "") + " " + (t.partners ? t.partners.name : ""); },
      columns: [
        { label: "Number", get: function (t) { return '<b>' + esc(t.number || "/") + '</b>'; } },
        { label: "Tender", get: function (t) { return esc(t.name); } },
        { label: "Client", get: function (t) { return esc(t.partners ? t.partners.name : ""); } },
        { label: "Date", get: function (t) { return '<span class="muted">' + esc(t.tender_date || "") + '</span>'; } },
        { label: "Cost", num: true, get: function (t) { return money(t.total_cost); } },
        { label: "Value", num: true, get: function (t) { return '<b>' + money(t.total_sell) + '</b>'; } },
        { label: "Margin", num: true, get: function (t) { var c = Number(t.total_cost || 0), s = Number(t.total_sell || 0); return s ? ((s - c) / s * 100).toFixed(1) + "%" : "-"; } },
        { label: "Status", get: function (t) { return t.status === "won" ? '<span class="badge paid">Won</span>' : t.status === "lost" ? '<span class="badge unpaid">Lost</span>' : t.status === "submitted" ? '<span class="badge partial">Submitted</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Open", test: function (t) { return t.status === "draft" || t.status === "submitted"; } }, { label: "Won", test: function (t) { return t.status === "won"; } }, { label: "Lost", test: function (t) { return t.status === "lost"; } }],
      groupBy: [{ label: "Status", get: function (t) { return t.status || "draft"; } }, { label: "Client", get: function (t) { return t.partners ? t.partners.name : "None"; } }],
      onOpen: function (t) { renderTenderForm(t.id); }, onNew: function () { renderTenderForm("new"); }
    };
  }
  async function nextTenderNumber() {
    var cfg = await seqCfg("TND"), py = seqPrefixYear(cfg);
    var rows = (await sb.from("tenders").select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
    return py + seqPad(cfg, maxSeq(rows, py) + 1);
  }
  async function renderTenderForm(id) {
    var parent = { action: "est.list", title: "Tenders" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var t = id === "new" ? { status: "draft", tender_date: today(), margin_pct: 15 } : (await sb.from("tenders").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("tender_lines").select("*").eq("tender_id", id).order("sequence")).data || [];
    var partners = (await sb.from("partners").select("id,name").eq("is_customer", true).order("name")).data || [];
    var srcLead = t.source_lead_id ? (await sb.from("crm_leads").select("id,name").eq("id", t.source_lead_id).maybeSingle()).data : null;
    var locked = t.status === "won";
    var defMargin = Number(t.margin_pct != null ? t.margin_pct : 15);
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (t.number || t.name || "Tender");
    function num(v) { return parseFloat(v) || 0; }
    var btns = (locked ? "" : '<button class="pri" id="tn-save">Save</button>') + '<button id="tn-discard">Discard</button>';
    if (id !== "new" && t.status === "draft") btns += '<button id="tn-submit">Mark Submitted</button>';
    if (id !== "new" && (t.status === "draft" || t.status === "submitted")) btns += '<button id="tn-won">Mark Won</button><button id="tn-lost">Mark Lost</button>';
    if (t.status === "won" && t.project_id) btns += '<button id="tn-goproj">Open project</button>';
    var stages = '<div class="o-stages"><span class="st ' + (t.status === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (t.status === "submitted" ? "on" : (t.status === "won" || t.status === "lost" ? "done" : "")) + '">Submitted</span><span class="st ' + (t.status === "won" ? "on" : "") + '">' + (t.status === "lost" ? "Lost" : "Won") + '</span></div>';
    var partnerOpts = '<option value="">(none)</option>' + partners.map(function (p) { return '<option value="' + p.id + '"' + (t.partner_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title"><input id="tn-name" value="' + esc(t.name || "") + '" placeholder="Tender name"' + (locked ? " disabled" : "") + '></div>' +
      (srcLead ? '<div class="sub" style="margin:-2px 0 8px"><b>From opportunity:</b> <button class="lnk" id="tn-fromlead">' + esc(srcLead.name) + '</button></div>' : '') +
      '<div class="o-groups"><div>' +
      fld("Number", '<input id="tn-num" value="' + esc(t.number || "") + '"' + (locked ? " disabled" : "") + ' placeholder="auto">', "Your tender reference. Left blank, we number it.") +
      fld("Client", '<select id="tn-client"' + (locked ? " disabled" : "") + '>' + partnerOpts + '</select>', "The client inviting the tender.") +
      fld("Default margin %", '<input id="tn-margin" type="number" step="0.1" value="' + defMargin + '"' + (locked ? " disabled" : "") + '>', "Applied to new lines; override per line.") +
      '</div><div>' +
      fld("Tender date", '<input id="tn-date" type="date" value="' + (t.tender_date || today()) + '"' + (locked ? " disabled" : "") + '>', "When you price / submit the bid.") +
      fld("Valid until", '<input id="tn-valid" type="date" value="' + (t.valid_until || "") + '"' + (locked ? " disabled" : "") + '>', "Bid validity date.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Priced BOQ &middot; cost buildup</div></div><div class="o-nb-pg"><div class="o-rt-wrap"><table class="o-lines" style="min-width:920px"><thead><tr><th style="width:56px">Code</th><th>Description</th><th style="width:54px">Unit</th><th style="width:60px;text-align:right">Qty</th><th style="width:72px;text-align:right">Material</th><th style="width:72px;text-align:right">Labour</th><th style="width:72px;text-align:right">Subcont</th><th style="width:66px;text-align:right">Other</th><th style="width:62px;text-align:right">Margin%</th><th style="width:78px;text-align:right">Rate</th><th style="width:86px;text-align:right">Total</th>' + (locked ? "" : '<th style="width:20px"></th>') + '</tr></thead><tbody id="tlbody"></tbody></table></div>' + (locked ? "" : '<button class="o-addln" id="tn-addln">+ Add a line</button>') + '<div class="o-tot" id="tn-tot" style="margin-top:12px"></div></div></div>' +
      '</div>';
    document.getElementById("tn-discard").onclick = function () { go("est.list"); };
    var tfl = document.getElementById("tn-fromlead"); if (tfl) tfl.onclick = function () { renderLeadForm(srcLead.id); };
    var lb = document.getElementById("tlbody");
    function recalc() {
      var tc = 0, ts = 0;
      lb.querySelectorAll("tr").forEach(function (tr) {
        var qi = tr.querySelector(".tl-qty"); if (!qi) return;
        var q = num(qi.value), uc = num(tr.querySelector(".tl-mat").value) + num(tr.querySelector(".tl-lab").value) + num(tr.querySelector(".tl-sub").value) + num(tr.querySelector(".tl-oth").value);
        var mg = num(tr.querySelector(".tl-margin").value), rate = uc * (1 + mg / 100), total = rate * q;
        tr.querySelector(".tl-rate").textContent = money(rate); tr.querySelector(".tl-total").textContent = money(total);
        tc += uc * q; ts += total;
      });
      var el = document.getElementById("tn-tot"); if (el) el.innerHTML = '<div class="r"><span class="k">Total cost</span><span>' + S.company.currency_code + " " + money(tc) + '</span></div><div class="r"><span class="k">Total value (sell)</span><span>' + S.company.currency_code + " " + money(ts) + '</span></div><div class="r tt"><span class="k">Margin</span><span>' + S.company.currency_code + " " + money(ts - tc) + " (" + (ts ? ((ts - tc) / ts * 100).toFixed(1) : "0") + '%)</span></div>';
      return { cost: tc, sell: ts };
    }
    function addRow(l) {
      var tr = document.createElement("tr");
      if (locked) {
        tr.innerHTML = '<td>' + esc(l.code || "") + '</td><td>' + esc(l.description || "") + '</td><td>' + esc(l.unit || "") + '</td><td class="num">' + Number(l.quantity || 0) + '</td><td class="num">' + money(l.material_cost) + '</td><td class="num">' + money(l.labour_cost) + '</td><td class="num">' + money(l.subcontract_cost) + '</td><td class="num">' + money(l.other_cost) + '</td><td class="num">' + Number(l.margin_pct || 0) + '%</td><td class="num">' + money(l.sell_rate) + '</td><td class="num">' + money(l.line_total) + '</td>';
        lb.appendChild(tr); return;
      }
      tr.innerHTML = '<td><input class="tl-code" value="' + esc(l ? l.code : "") + '"></td><td><input class="tl-desc" value="' + esc(l ? l.description : "") + '" placeholder="Description"></td><td><input class="tl-unit" value="' + esc(l ? l.unit : "") + '"></td><td><input class="tl-qty num" type="number" step="0.01" value="' + (l ? l.quantity : 1) + '"></td><td><input class="tl-mat num" type="number" step="0.01" value="' + (l ? l.material_cost : 0) + '"></td><td><input class="tl-lab num" type="number" step="0.01" value="' + (l ? l.labour_cost : 0) + '"></td><td><input class="tl-sub num" type="number" step="0.01" value="' + (l ? l.subcontract_cost : 0) + '"></td><td><input class="tl-oth num" type="number" step="0.01" value="' + (l ? l.other_cost : 0) + '"></td><td><input class="tl-margin num" type="number" step="0.1" value="' + (l ? l.margin_pct : defMargin) + '"></td><td class="num tl-rate">0.00</td><td class="num tl-total">0.00</td><td><button class="del">&times;</button></td>';
      lb.appendChild(tr);
      tr.querySelectorAll("input").forEach(function (el) { el.addEventListener("input", recalc); });
      tr.querySelector(".del").onclick = function () { tr.remove(); recalc(); };
    }
    if (lines.length) lines.forEach(addRow); else if (!locked) addRow(null);
    var addb = document.getElementById("tn-addln"); if (addb) addb.onclick = function () { addRow(null); recalc(); };
    recalc();
    function currentLines() {
      return Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr) {
        var qi = tr.querySelector(".tl-qty"); if (!qi) return null;
        var q = num(qi.value), mat = num(tr.querySelector(".tl-mat").value), lab = num(tr.querySelector(".tl-lab").value), sub = num(tr.querySelector(".tl-sub").value), oth = num(tr.querySelector(".tl-oth").value), mg = num(tr.querySelector(".tl-margin").value);
        var uc = mat + lab + sub + oth, rate = uc * (1 + mg / 100);
        return { code: tr.querySelector(".tl-code").value.trim(), description: tr.querySelector(".tl-desc").value.trim() || "Item", unit: tr.querySelector(".tl-unit").value.trim(), quantity: q, material_cost: mat, labour_cost: lab, subcontract_cost: sub, other_cost: oth, margin_pct: mg, sell_rate: rate, line_total: rate * q };
      }).filter(Boolean);
    }
    async function persist() {
      var tot = recalc();
      var n = gv("tn-num") || (t.number || (await nextTenderNumber()));
      var row = { number: n, name: gv("tn-name") || "Tender", partner_id: document.getElementById("tn-client").value || null, tender_date: gv("tn-date"), valid_until: gv("tn-valid") || null, margin_pct: num(gv("tn-margin")), total_cost: tot.cost, total_sell: tot.sell };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.status = "draft"; var ins = await sb.from("tenders").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("tenders").update(row).eq("id", id)).error) { toast("Save failed"); return null; } await sb.from("tender_lines").delete().eq("tender_id", id); }
      var lns = currentLines();
      if (lns.length) { var lr = await sb.from("tender_lines").insert(lns.map(function (l, i) { return Object.assign({ company_id: S.company.id, tender_id: sid, sequence: (i + 1) * 10 }, l); })); if (lr.error) { toast("Lines failed: " + errMsg(lr.error)); return null; } }
      return sid;
    }
    var sv = document.getElementById("tn-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderTenderForm(sid); } };
    var subb = document.getElementById("tn-submit"); if (subb) subb.onclick = async function () { var sid = await persist(); if (!sid) return; await sb.from("tenders").update({ status: "submitted", submitted_date: today() }).eq("id", sid); toast("Marked submitted"); renderTenderForm(sid); };
    var lostb = document.getElementById("tn-lost"); if (lostb) lostb.onclick = async function () { var sid = await persist(); if (!sid) return; await sb.from("tenders").update({ status: "lost" }).eq("id", sid); toast("Marked lost"); renderTenderForm(sid); };
    var wonb = document.getElementById("tn-won"); if (wonb) wonb.onclick = async function () { var sid = await persist(); if (!sid) return; await convertTenderToProject(sid); };
    var gpb = document.getElementById("tn-goproj"); if (gpb) gpb.onclick = function () { renderProjectForm(t.project_id); };
  }
  async function convertTenderToProject(tenderId) {
    var t = (await sb.from("tenders").select("*").eq("id", tenderId).maybeSingle()).data;
    if (!t) { toast("Tender not found"); return; }
    var lines = (await sb.from("tender_lines").select("*").eq("tender_id", tenderId).order("sequence")).data || [];
    var proj = await sb.from("projects").insert({ company_id: S.company.id, name: t.name || "Project", code: t.number || "", partner_id: t.partner_id || null, contract_value: Number(t.total_sell || 0), source_tender_id: tenderId, is_active: true }).select("id").single();
    if (proj.error) { toast("Could not create project: " + errMsg(proj.error)); return; }
    var pid = proj.data.id;
    var mat = 0, lab = 0, sub = 0, oth = 0;
    lines.forEach(function (l) { var q = Number(l.quantity || 0); mat += Number(l.material_cost || 0) * q; lab += Number(l.labour_cost || 0) * q; sub += Number(l.subcontract_cost || 0) * q; oth += Number(l.other_cost || 0) * q; });
    var buds = [];
    if (mat > 0) buds.push({ category: "Material", amount: mat });
    if (lab > 0) buds.push({ category: "Labour", amount: lab });
    if (sub > 0) buds.push({ category: "Subcontract", amount: sub });
    if (oth > 0) buds.push({ category: "Overhead / other", amount: oth });
    if (buds.length) await sb.from("project_budgets").insert(buds.map(function (b) { return { company_id: S.company.id, project_id: pid, category: b.category, description: "From tender " + (t.number || ""), amount: b.amount }; }));
    if (lines.length) await sb.from("project_boq").insert(lines.map(function (l, i) { return { company_id: S.company.id, project_id: pid, code: l.code || "", description: l.description || "Item", unit: l.unit || "", quantity: Number(l.quantity || 0), rate: Number(l.sell_rate || 0), amount: Number(l.line_total || 0), sequence: (i + 1) * 10 }; }));
    await sb.from("tenders").update({ status: "won", project_id: pid }).eq("id", tenderId);
    toast("Tender won - project created with cost budget & schedule of values"); renderProjectForm(pid);
  }

  // ============================ MANUFACTURING / FABRICATION ============================
  function cfgBoms() {
    return {
      title: "Bills of Materials", pageSize: 80,
      fetch: function () { return sb.from("boms").select("*, products(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (b) { return (b.name || "") + " " + (b.products ? b.products.name : ""); },
      columns: [
        { label: "BOM", get: function (b) { return '<b>' + esc(b.name) + '</b>'; } },
        { label: "Produces", get: function (b) { return esc(b.products ? b.products.name : "-"); } },
        { label: "Output qty", num: true, get: function (b) { return Number(b.output_qty || 1); } }
      ],
      onOpen: function (b) { renderBomForm(b.id); }, onNew: function () { renderBomForm("new"); }
    };
  }
  async function renderBomForm(id) {
    var parent = { action: "mfg.boms", title: "Bills of Materials" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var bom = id === "new" ? { output_qty: 1 } : (await sb.from("boms").select("*").eq("id", id).maybeSingle()).data || {};
    var lines = id === "new" ? [] : (await sb.from("bom_lines").select("*").eq("bom_id", id).order("sequence")).data || [];
    var products = (await sb.from("products").select("id,name,default_code,uom,cost_price").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (bom.name || "BOM");
    function prodOpts(sel) { return '<option value="">-</option>' + products.map(function (p) { return '<option value="' + p.id + '"' + (sel === p.id ? " selected" : "") + '>' + esc((p.default_code ? "[" + p.default_code + "] " : "") + p.name) + '</option>'; }).join(""); }
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns"><button class="pri" id="bm-save">Save</button><button id="bm-discard">Discard</button></div></div>' +
      '<div class="o-sheet"><div class="o-title"><input id="bm-name" value="' + esc(bom.name || "") + '" placeholder="BOM name"></div>' +
      '<div class="o-groups"><div>' +
      fld("Finished product", '<select id="bm-prod">' + prodOpts(bom.product_id) + '</select>', "The fabricated unit this BOM produces.") +
      '</div><div>' +
      fld("Output qty", '<input id="bm-outqty" type="number" step="0.01" value="' + (bom.output_qty || 1) + '">', "How many finished units one BOM run makes.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Components</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th style="width:220px">Component</th><th>Description</th><th style="width:90px;text-align:right">Qty</th><th style="width:90px">Unit</th><th style="width:22px"></th></tr></thead><tbody id="bmbody"></tbody></table><button class="o-addln" id="bm-addln">+ Add a component</button></div></div>' +
      '</div>';
    document.getElementById("bm-discard").onclick = function () { go("mfg.boms"); };
    var lb = document.getElementById("bmbody");
    function addRow(l) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><select class="bl-prod">' + prodOpts(l ? l.product_id : null) + '</select></td><td><input class="bl-name" value="' + esc(l ? l.name : "") + '" placeholder="optional"></td><td><input class="bl-qty num" type="number" step="0.01" value="' + (l ? l.quantity : 1) + '"></td><td><input class="bl-unit" value="' + esc(l ? l.unit : "") + '"></td><td><button class="del">&times;</button></td>';
      lb.appendChild(tr);
      var ps = tr.querySelector(".bl-prod");
      ps.addEventListener("change", function () { var pr = products.filter(function (x) { return x.id === ps.value; })[0]; if (pr && !tr.querySelector(".bl-name").value) tr.querySelector(".bl-name").value = pr.name; if (pr && pr.uom && !tr.querySelector(".bl-unit").value) tr.querySelector(".bl-unit").value = pr.uom; });
      tr.querySelector(".del").onclick = function () { tr.remove(); };
    }
    if (lines.length) lines.forEach(addRow); else addRow(null);
    document.getElementById("bm-addln").onclick = function () { addRow(null); };
    document.getElementById("bm-save").onclick = async function () {
      var row = { name: gv("bm-name") || "BOM", product_id: document.getElementById("bm-prod").value || null, output_qty: parseFloat(gv("bm-outqty")) || 1 };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; var ins = await sb.from("boms").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return; } sid = ins.data.id; }
      else { if ((await sb.from("boms").update(row).eq("id", id)).error) { toast("Save failed"); return; } await sb.from("bom_lines").delete().eq("bom_id", id); }
      var lns = Array.prototype.map.call(lb.querySelectorAll("tr"), function (tr, i) { var ps = tr.querySelector(".bl-prod"); return { company_id: S.company.id, bom_id: sid, product_id: ps.value || null, name: tr.querySelector(".bl-name").value.trim(), quantity: parseFloat(tr.querySelector(".bl-qty").value) || 0, unit: tr.querySelector(".bl-unit").value.trim(), sequence: (i + 1) * 10 }; }).filter(function (l) { return l.product_id || l.name; });
      if (lns.length) { var lr = await sb.from("bom_lines").insert(lns); if (lr.error) { toast("Components failed: " + errMsg(lr.error)); return; } }
      toast("Saved"); go("mfg.boms");
    };
  }
  function cfgWorkOrders() {
    return {
      title: "Work Orders", pageSize: 80,
      fetch: function () { return sb.from("work_orders").select("*, products(name), projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (w) { return (w.number || "") + " " + (w.products ? w.products.name : "") + " " + (w.projects ? w.projects.name : ""); },
      columns: [
        { label: "Number", get: function (w) { return '<b>' + esc(w.number || "/") + '</b>'; } },
        { label: "Product", get: function (w) { return esc(w.products ? w.products.name : ""); } },
        { label: "Project", get: function (w) { return esc(w.projects ? w.projects.name : ""); } },
        { label: "Qty", num: true, get: function (w) { return Number(w.quantity || 0); } },
        { label: "Done", num: true, get: function (w) { return Number(w.quantity_done || 0); } },
        { label: "Status", get: function (w) { return w.state === "done" ? '<span class="badge paid">Done</span>' : w.state === "in_progress" ? '<span class="badge partial">In progress</span>' : w.state === "cancel" ? '<span class="badge">Cancelled</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Open", test: function (w) { return w.state === "draft" || w.state === "in_progress"; } }, { label: "Done", test: function (w) { return w.state === "done"; } }],
      groupBy: [{ label: "Status", get: function (w) { return w.state || "draft"; } }, { label: "Project", get: function (w) { return w.projects ? w.projects.name : "None"; } }],
      onOpen: function (w) { renderWorkOrderForm(w.id); }, onNew: function () { renderWorkOrderForm("new"); }
    };
  }
  async function nextWoNumber() {
    var py = "WO/" + new Date().getFullYear() + "/";
    var rows = (await sb.from("work_orders").select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
    return py + ("0000" + (maxSeq(rows, py) + 1)).slice(-4);
  }
  async function renderWorkOrderForm(id) {
    var parent = { action: "mfg.wo", title: "Work Orders" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var wo = id === "new" ? { state: "draft", quantity: 1, date_planned: today() } : (await sb.from("work_orders").select("*").eq("id", id).maybeSingle()).data || {};
    var products = (await sb.from("products").select("id,name,default_code").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var boms = (await sb.from("boms").select("id,name,product_id,output_qty").eq("company_id", S.company.id).order("name")).data || [];
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var done = wo.state === "done", editable = !done;
    var blines = wo.bom_id ? (await sb.from("bom_lines").select("*, products(name,cost_price)").eq("bom_id", wo.bom_id).order("sequence")).data || [] : [];
    var selBom = boms.filter(function (b) { return b.id === wo.bom_id; })[0];
    var factor = selBom && Number(selBom.output_qty) ? (Number(wo.quantity || 0) / Number(selBom.output_qty)) : Number(wo.quantity || 0);
    var matCost = blines.reduce(function (s, l) { return s + Number(l.quantity || 0) * factor * Number(l.products ? l.products.cost_price : 0); }, 0);
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (wo.number || "Work order");
    var cc = S.company.currency_code;
    var btns = (done ? "" : '<button class="pri" id="wo-save">Save</button><button id="wo-discard">Discard</button>');
    if (id !== "new" && wo.state === "draft") btns += '<button id="wo-start">Start</button>';
    if (id !== "new" && (wo.state === "draft" || wo.state === "in_progress")) btns += '<button class="pri" id="wo-complete">Complete &amp; consume</button>';
    var stages = '<div class="o-stages"><span class="st ' + (wo.state === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (wo.state === "in_progress" ? "on" : wo.state === "done" ? "done" : "") + '">In progress</span><span class="st ' + (wo.state === "done" ? "on" : "") + '">Done</span></div>';
    function opts(list, sel, blank) { return (blank ? '<option value="">' + blank + '</option>' : "") + list.map(function (x) { return '<option value="' + x.id + '"' + (sel === x.id ? " selected" : "") + '>' + esc(x.name) + '</option>'; }).join(""); }
    var compRows = blines.map(function (l) { var q = Number(l.quantity || 0) * factor; return '<tr><td>' + esc(l.products ? l.products.name : (l.name || "")) + '</td><td class="num">' + (Math.round(q * 100) / 100) + '</td><td class="num">' + money(q * Number(l.products ? l.products.cost_price : 0)) + '</td></tr>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet"><div class="o-title">' + (wo.number ? esc(wo.number) : "New work order") + '</div>' +
      '<div class="o-groups"><div>' +
      fld("Product to fabricate", editable ? '<select id="wo-prod">' + opts(products, wo.product_id, "(none)") + '</select>' : '<span class="v">' + esc((products.filter(function (p) { return p.id === wo.product_id; })[0] || {}).name || "-") + '</span>', "The finished facade unit being fabricated.") +
      fld("Bill of materials", editable ? '<select id="wo-bom">' + opts(boms, wo.bom_id, "(none)") + '</select>' : '<span class="v">' + esc((selBom || {}).name || "-") + '</span>', "Components consumed to fabricate it. Save to preview.") +
      fld("Project / site", editable ? '<select id="wo-proj">' + opts(projs, wo.project_id, "(none)") + '</select>' : '<span class="v">' + esc((projs.filter(function (p) { return p.id === wo.project_id; })[0] || {}).name || "-") + '</span>', "Fabrication material cost is booked to this project.") +
      '</div><div>' +
      fld("Quantity", editable ? '<input id="wo-qty" type="number" step="0.01" value="' + (wo.quantity || 1) + '">' : '<span class="v">' + Number(wo.quantity || 0) + '</span>', "How many units to fabricate.") +
      fld("Planned date", editable ? '<input id="wo-date" type="date" value="' + (wo.date_planned || today()) + '">' : '<span class="v">' + esc(wo.date_planned || "") + '</span>') +
      fld("Estimated material cost", '<span class="v">' + cc + " " + money(matCost) + '</span>', "Component cost for this quantity, from the BOM.") +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Components for this quantity</div></div><div class="o-nb-pg"><div class="o-rt-wrap"><table class="o-rt"><thead><tr><td>Component</td><td class="num">Qty needed</td><td class="num">Cost</td></tr></thead><tbody>' + (compRows || '<tr><td colspan="3" class="muted">Pick a BOM and quantity, then Save to preview components.</td></tr>') + '<tr class="tot"><td>Total material cost</td><td class="num"></td><td class="num">' + money(matCost) + '</td></tr></tbody></table></div>' + (done ? '<div class="sub" style="margin-top:10px">Completed - ' + Number(wo.quantity_done || 0) + ' unit(s) fabricated; components consumed' + (wo.project_id ? " and costed to the project." : ".") + '</div>' : "") + '</div></div>' +
      '</div>';
    var dbtn = document.getElementById("wo-discard"); if (dbtn) dbtn.onclick = function () { go("mfg.wo"); };
    async function woPersist() {
      var row = { product_id: document.getElementById("wo-prod") ? (document.getElementById("wo-prod").value || null) : wo.product_id, bom_id: document.getElementById("wo-bom") ? (document.getElementById("wo-bom").value || null) : wo.bom_id, project_id: document.getElementById("wo-proj") ? (document.getElementById("wo-proj").value || null) : wo.project_id, quantity: parseFloat(gv("wo-qty")) || 0, date_planned: gv("wo-date") };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.state = "draft"; row.number = await nextWoNumber(); var ins = await sb.from("work_orders").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("work_orders").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    var svb = document.getElementById("wo-save"); if (svb) svb.onclick = async function () { var sid = await woPersist(); if (sid) { toast("Saved"); renderWorkOrderForm(sid); } };
    var stb = document.getElementById("wo-start"); if (stb) stb.onclick = async function () { var sid = await woPersist(); if (!sid) return; await sb.from("work_orders").update({ state: "in_progress" }).eq("id", sid); toast("Started"); renderWorkOrderForm(sid); };
    var cpb = document.getElementById("wo-complete"); if (cpb) cpb.onclick = async function () { var sid = await woPersist(); if (!sid) return; var full = (await sb.from("work_orders").select("*").eq("id", sid).maybeSingle()).data; await completeWorkOrder(full); };
  }
  async function completeWorkOrder(wo) {
    if (wo.state === "done") { toast("Already completed"); return; }
    if (!wo.bom_id) { toast("Set a BOM first so components can be consumed"); return; }
    var bom = (await sb.from("boms").select("*").eq("id", wo.bom_id).maybeSingle()).data;
    var blines = (await sb.from("bom_lines").select("*, products(name,cost_price)").eq("bom_id", wo.bom_id).order("sequence")).data || [];
    var inv = await ensureInventory();
    var factor = bom && Number(bom.output_qty) ? (Number(wo.quantity || 0) / Number(bom.output_qty)) : Number(wo.quantity || 0);
    var consumed = 0;
    for (var i = 0; i < blines.length; i++) {
      var bl = blines[i], pr = bl.products || {};
      var qty = Number(bl.quantity || 0) * factor;
      if (!(qty > 0) || !bl.product_id) continue;
      var mv = await sb.from("stock_moves").insert({ company_id: S.company.id, product_id: bl.product_id, quantity: qty, location_id: inv.stock, location_dest_id: inv.customer, project_id: wo.project_id || null, state: "done", date: new Date().toISOString() }).select("id").single();
      if (!mv.error) { await postStockValue("deliver", { id: bl.product_id, name: pr.name, cost_price: pr.cost_price }, qty, mv.data && mv.data.id, wo.project_id || null); consumed++; }
    }
    await sb.from("work_orders").update({ quantity_done: Number(wo.quantity || 0), state: "done" }).eq("id", wo.id);
    toast(consumed ? ("Work order complete - " + consumed + " component(s) consumed" + (wo.project_id ? " to the project" : "")) : "Work order complete (no components)");
    renderWorkOrderForm(wo.id);
  }

  // ============================ INSTALLATION (site crews) ============================
  function cfgInstallJobs() {
    return {
      title: "Install Jobs", pageSize: 80,
      fetch: function () { return sb.from("install_jobs").select("*, projects(name)").eq("company_id", S.company.id).order("created_at", { ascending: false }).then(function (r) { return r.data || []; }); },
      searchText: function (j) { return (j.number || "") + " " + (j.description || "") + " " + (j.foreman || "") + " " + (j.projects ? j.projects.name : ""); },
      columns: [
        { label: "Number", get: function (j) { return '<b>' + esc(j.number || "/") + '</b>'; } },
        { label: "Job", get: function (j) { return esc(j.description); } },
        { label: "Project / site", get: function (j) { return esc(j.projects ? j.projects.name : ""); } },
        { label: "Foreman", get: function (j) { return esc(j.foreman || ""); } },
        { label: "Progress", get: function (j) { var p = Number(j.planned_qty || 0), d = Number(j.installed_qty || 0); return d + " / " + p + (p ? " (" + Math.round(d / p * 100) + "%)" : ""); } },
        { label: "Labour cost", num: true, get: function (j) { return money(j.labour_cost); } },
        { label: "Status", get: function (j) { return j.status === "done" ? '<span class="badge paid">Done</span>' : j.status === "in_progress" ? '<span class="badge partial">In progress</span>' : '<span class="badge draft">Draft</span>'; } }
      ],
      filters: [{ label: "Open", test: function (j) { return j.status !== "done"; } }, { label: "Done", test: function (j) { return j.status === "done"; } }],
      groupBy: [{ label: "Project", get: function (j) { return j.projects ? j.projects.name : "None"; } }, { label: "Foreman", get: function (j) { return j.foreman || "None"; } }],
      onOpen: function (j) { renderInstallJobForm(j.id); }, onNew: function () { renderInstallJobForm("new"); }
    };
  }
  async function nextInstNumber() {
    var py = "INS/" + new Date().getFullYear() + "/";
    var rows = (await sb.from("install_jobs").select("number").eq("company_id", S.company.id).like("number", py + "%")).data || [];
    return py + ("0000" + (maxSeq(rows, py) + 1)).slice(-4);
  }
  async function renderInstallJobForm(id) {
    var parent = { action: "inst.jobs", title: "Install Jobs" };
    document.getElementById("o-main").innerHTML = '<div class="o-view"><div class="o-cp">' + bcHTML(id === "new" ? "New" : "...", parent) + '</div><div class="o-form-bg"><div class="o-form"><div class="o-sheet"><div class="o-empty">Loading...</div></div></div></div></div>';
    wireBc();
    var j = id === "new" ? { status: "draft", start_date: today() } : (await sb.from("install_jobs").select("*").eq("id", id).maybeSingle()).data || {};
    var projs = (await sb.from("projects").select("id,name").eq("company_id", S.company.id).eq("is_active", true).order("name")).data || [];
    var logs = id === "new" ? [] : (await sb.from("install_logs").select("*").eq("job_id", id).order("log_date", { ascending: false })).data || [];
    var done = j.status === "done", cc = S.company.currency_code;
    document.querySelector(".o-bc span:last-child").textContent = id === "new" ? "New" : (j.number || j.description || "Job");
    var planned = Number(j.planned_qty || 0), installed = Number(j.installed_qty || 0), pct = planned ? Math.round(installed / planned * 100) : 0;
    var btns = (done ? "" : '<button class="pri" id="ij-save">Save</button><button id="ij-discard">Discard</button>');
    if (id !== "new" && j.status === "draft") btns += '<button id="ij-start">Start</button>';
    if (id !== "new" && !done) btns += '<button id="ij-log">Log installation</button><button id="ij-done">Mark done</button>';
    var stages = '<div class="o-stages"><span class="st ' + (j.status === "draft" ? "on" : "done") + '">Draft</span><span class="st ' + (j.status === "in_progress" ? "on" : j.status === "done" ? "done" : "") + '">In progress</span><span class="st ' + (j.status === "done" ? "on" : "") + '">Done</span></div>';
    var projOpts = '<option value="">(none)</option>' + projs.map(function (p) { return '<option value="' + p.id + '"' + (j.project_id === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>'; }).join("");
    var smart = '<div class="o-smart"><button class="sb" style="cursor:default"><span class="v">' + installed + " / " + planned + '</span><span class="k">Installed / planned</span></button><button class="sb" style="cursor:default"><span class="v">' + pct + '%</span><span class="k">Progress</span></button><button class="sb" style="cursor:default"><span class="v">' + cc + " " + money(j.labour_cost) + '</span><span class="k">Labour cost</span></button></div>';
    var logRows = logs.map(function (l) { return '<tr><td class="muted">' + esc(l.log_date || "") + '</td><td class="num">' + Number(l.installed_qty || 0) + '</td><td class="num">' + Number(l.hours || 0) + '</td><td>' + esc(l.note || "") + '</td></tr>'; }).join("");
    document.querySelector(".o-form").innerHTML =
      '<div class="o-statusbar"><div class="o-sb-btns">' + btns + '</div>' + stages + '</div>' +
      '<div class="o-sheet">' + smart + '<div class="o-title"><input id="ij-desc" value="' + esc(j.description || "") + '" placeholder="Installation job"' + (done ? " disabled" : "") + '></div>' +
      '<div class="o-groups"><div>' +
      fld("Project / site", done ? '<span class="v">' + esc((projs.filter(function (p) { return p.id === j.project_id; })[0] || {}).name || "-") + '</span>' : '<select id="ij-proj">' + projOpts + '</select>', "Labour logged here books to this project as Labour cost.") +
      fld("Area / elevation", '<input id="ij-area" value="' + esc(j.area || "") + '"' + (done ? " disabled" : "") + ' placeholder="e.g. North elevation L3-L8">', "Which part of the building.") +
      fld("Foreman", '<input id="ij-foreman" value="' + esc(j.foreman || "") + '"' + (done ? " disabled" : "") + '>', "Crew lead on this job.") +
      fld("Crew size", '<input id="ij-crew" type="number" step="1" value="' + (j.crew_size || 0) + '"' + (done ? " disabled" : "") + '>', "Number of installers.") +
      '</div><div>' +
      fld("Planned qty", '<input id="ij-planned" type="number" step="0.01" value="' + (j.planned_qty || 0) + '"' + (done ? " disabled" : "") + '>', "Units to install on this job.") +
      fld("Unit", '<input id="ij-unit" value="' + esc(j.unit || "") + '"' + (done ? " disabled" : "") + ' placeholder="e.g. panel, m2">') +
      fld("Labour rate / hr", '<input id="ij-rate" type="number" step="0.01" value="' + (j.labour_rate || 0) + '"' + (done ? " disabled" : "") + '>', "Cost per labour hour for costing installation to the project.") +
      fld("Due date", '<input id="ij-due" type="date" value="' + (j.due_date || "") + '"' + (done ? " disabled" : "") + '>') +
      '</div></div>' +
      '<div class="o-nb"><div class="o-nb-tabs"><div class="tb on">Daily logs</div></div><div class="o-nb-pg"><table class="o-lines"><thead><tr><th>Date</th><th style="text-align:right">Installed</th><th style="text-align:right">Hours</th><th>Note</th></tr></thead><tbody>' + (logRows || '<tr><td colspan="4" class="muted">No logs yet. Use "Log installation" to record daily progress + hours.</td></tr>') + '</tbody></table></div></div>' +
      '</div>';
    var db = document.getElementById("ij-discard"); if (db) db.onclick = function () { go("inst.jobs"); };
    async function persist() {
      var row = { description: gv("ij-desc") || "Installation", project_id: (document.getElementById("ij-proj") ? document.getElementById("ij-proj").value : j.project_id) || null, area: gv("ij-area"), foreman: gv("ij-foreman"), crew_size: parseInt(gv("ij-crew"), 10) || 0, planned_qty: parseFloat(gv("ij-planned")) || 0, unit: gv("ij-unit"), labour_rate: parseFloat(gv("ij-rate")) || 0, due_date: gv("ij-due") || null };
      var sid = id;
      if (id === "new") { row.company_id = S.company.id; row.status = "draft"; row.number = await nextInstNumber(); var ins = await sb.from("install_jobs").insert(row).select("id").single(); if (ins.error) { toast(errMsg(ins.error)); return null; } sid = ins.data.id; }
      else { if ((await sb.from("install_jobs").update(row).eq("id", id)).error) { toast("Save failed"); return null; } }
      return sid;
    }
    var sv = document.getElementById("ij-save"); if (sv) sv.onclick = async function () { var sid = await persist(); if (sid) { toast("Saved"); renderInstallJobForm(sid); } };
    var st = document.getElementById("ij-start"); if (st) st.onclick = async function () { var sid = await persist(); if (!sid) return; await sb.from("install_jobs").update({ status: "in_progress" }).eq("id", sid); toast("Started"); renderInstallJobForm(sid); };
    var dn = document.getElementById("ij-done"); if (dn) dn.onclick = async function () { var sid = await persist(); if (!sid) return; await sb.from("install_jobs").update({ status: "done" }).eq("id", sid); toast("Marked done"); renderInstallJobForm(sid); };
    var lg = document.getElementById("ij-log"); if (lg) lg.onclick = async function () { var sid = await persist(); if (!sid) return; openInstallLogModal(sid); };
  }
  async function openInstallLogModal(jobId) {
    var j = (await sb.from("install_jobs").select("*").eq("id", jobId).maybeSingle()).data || {};
    var cc = S.company.currency_code;
    var m = document.createElement("div"); m.className = "modal on";
    m.innerHTML = '<div class="sheet"><h3>Log installation &middot; ' + esc(j.description || "") + '</h3><div class="form">' +
      '<div class="row2"><div><label>Date</label>' + fhint("__ild", "The day this work was done.") + '<input id="il-date" type="date" value="' + today() + '"></div>' +
      '<div><label>Installed qty</label>' + fhint("__ilq", "Units installed this day.") + '<input id="il-qty" type="number" step="0.01" value="0"></div></div>' +
      '<div class="row2"><div><label>Labour hours</label>' + fhint("__ilh", "Total crew hours this day; costed at the rate to the project.") + '<input id="il-hours" type="number" step="0.01" value="0"></div>' +
      '<div><label>Rate/hr (' + esc(cc) + ')</label>' + fhint("__ilr", "Defaults from the job; adjust if needed.") + '<input id="il-rate" type="number" step="0.01" value="' + (j.labour_rate || 0) + '"></div></div>' +
      '<div><label>Note</label>' + fhint("__iln", "Optional.") + '<input id="il-note" placeholder="optional"></div>' +
      '</div><div class="foot"><button class="btn" id="il-cancel">Cancel</button><button class="btn pri" id="il-save" style="background:var(--accent);border-color:var(--accent)">Log &amp; cost</button></div></div>';
    document.body.appendChild(m);
    document.getElementById("il-cancel").onclick = function () { m.remove(); };
    document.getElementById("il-save").onclick = async function () {
      var qty = parseFloat(document.getElementById("il-qty").value) || 0, hours = parseFloat(document.getElementById("il-hours").value) || 0, rate = parseFloat(document.getElementById("il-rate").value) || 0;
      if (qty <= 0 && hours <= 0) { toast("Enter installed qty or hours"); return; }
      var cost = hours * rate, eid = null;
      if (cost > 0.005 && j.project_id) eid = await postRetentionEntry("6400", "4200", cost, "Install labour " + (j.number || "") + " - " + (j.description || ""), jobId, "install_labour");
      var ins = await sb.from("install_logs").insert({ company_id: S.company.id, job_id: jobId, log_date: document.getElementById("il-date").value, installed_qty: qty, hours: hours, note: document.getElementById("il-note").value.trim(), journal_entry_id: eid || null }).select("id").single();
      if (ins.error) { toast(errMsg(ins.error)); return; }
      await sb.from("install_jobs").update({ installed_qty: Number(j.installed_qty || 0) + qty, labour_hours: Number(j.labour_hours || 0) + hours, labour_cost: Number(j.labour_cost || 0) + cost, status: j.status === "draft" ? "in_progress" : j.status }).eq("id", jobId);
      m.remove(); toast(cost > 0 ? ("Logged - " + cc + " " + money(cost) + " labour costed to the project") : "Logged"); renderInstallJobForm(jobId);
    };
  }

  // ---- start ----
  applyTheme();
  sb.auth.onAuthStateChange(function (_e, session) { if (!session) renderLogin("in"); });
  boot();
})();

// ============================================================================
//  Orbit - Spacework ERP  (front end, wired to the live Supabase database)
// ============================================================================
(function () {
  var cfg = window.APP_CONFIG || {};
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  var root = document.getElementById("root");
  var S = { user: null, profile: null, org: null, companies: [], company: null, view: "dashboard" };

  var esc = function (s) { return (s == null ? "" : "" + s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var money = function (n) { return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function toast(msg) { var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add("on"); }); setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 250); }, 2200); }

  // ---- modules / nav ----
  var MENU = [
    { grp: "Overview", items: [["dashboard", "Dashboard"]] },
    { grp: "Accounting", items: [["accounts", "Chart of Accounts"], ["trial", "Trial Balance"], ["journals", "Journals"]] },
    { grp: "Sales", items: [["clients", "Customers"], ["invoices", "Invoices"]] },
    { grp: "Company", items: [["companies", "Companies"]] }
  ];
  var TYPE_GROUPS = [
    ["asset", "Assets"], ["liability", "Liabilities"], ["equity", "Equity"], ["income", "Income"], ["expense", "Expenses"], ["off", "Off-Balance"]
  ];

  // ========================= AUTH =========================
  function renderLogin(mode) {
    mode = mode || "in";
    root.innerHTML =
      '<div class="login"><div class="card">' +
      '<div class="logo">O</div>' +
      '<h1>' + (mode === "in" ? "Sign in to Orbit" : "Create your account") + "</h1>" +
      '<p class="sub">Spacework ERP</p>' +
      '<label>Email</label><input id="email" type="email" autocomplete="username" placeholder="you@company.com">' +
      '<label>Password</label><input id="pw" type="password" autocomplete="current-password" placeholder="••••••••">' +
      '<div class="err" id="err"></div>' +
      '<button class="btn pri" id="go" style="width:100%;margin-top:14px">' + (mode === "in" ? "Sign in" : "Sign up") + "</button>" +
      '<div class="switch">' + (mode === "in"
        ? 'No account yet? <a id="sw">Create one</a>'
        : 'Already have an account? <a id="sw">Sign in</a>') + "</div>" +
      "</div></div>";
    document.getElementById("sw").onclick = function () { renderLogin(mode === "in" ? "up" : "in"); };
    document.getElementById("go").onclick = doAuth.bind(null, mode);
    document.getElementById("pw").onkeydown = function (e) { if (e.key === "Enter") doAuth(mode); };
  }
  async function doAuth(mode) {
    var email = document.getElementById("email").value.trim();
    var pw = document.getElementById("pw").value;
    var err = document.getElementById("err");
    err.textContent = "";
    if (!email || !pw) { err.textContent = "Enter your email and password."; return; }
    var res = mode === "in"
      ? await sb.auth.signInWithPassword({ email: email, password: pw })
      : await sb.auth.signUp({ email: email, password: pw });
    if (res.error) { err.textContent = res.error.message; return; }
    if (mode === "up" && !res.data.session) { err.textContent = "Check your email to confirm, then sign in."; return; }
    boot();
  }

  // ========================= BOOT =========================
  async function boot() {
    var sess = (await sb.auth.getSession()).data.session;
    if (!sess) { renderLogin("in"); return; }
    S.user = sess.user;
    var pr = await sb.from("profiles").select("*").eq("id", S.user.id).maybeSingle();
    S.profile = pr.data || {};
    var co = await sb.from("companies").select("*").order("name");
    S.companies = co.data || [];
    if (!S.companies.length) { renderNoCompany(); return; }
    var activeId = S.profile.active_company_id;
    S.company = S.companies.filter(function (c) { return c.id === activeId; })[0] || S.companies[0];
    if (S.company.org_id) { var o = await sb.from("orgs").select("*").eq("id", S.company.org_id).maybeSingle(); S.org = o.data; }
    render();
  }

  function renderNoCompany() {
    root.innerHTML = '<div class="login"><div class="card"><div class="logo">O</div><h1>Welcome to Orbit</h1>' +
      '<p class="sub">You are signed in as ' + esc(S.user.email) + ', but you are not attached to a company yet. Ask your administrator to add you, or an owner can set up a company.</p>' +
      '<button class="btn" id="out" style="margin-top:12px">Sign out</button></div></div>';
    document.getElementById("out").onclick = signOut;
  }
  async function signOut() { await sb.auth.signOut(); renderLogin("in"); }

  // ========================= SHELL =========================
  function render() {
    var initials = (S.user.email || "?").slice(0, 2).toUpperCase();
    var opts = S.companies.map(function (c) { return '<option value="' + c.id + '"' + (c.id === S.company.id ? " selected" : "") + ">" + esc(c.name) + " (" + esc(c.currency_code) + ")</option>"; }).join("");
    var nav = MENU.map(function (m) {
      return '<div class="sh">' + m.grp + "</div>" + m.items.map(function (it) {
        return '<div class="nav' + (S.view === it[0] ? " on" : "") + '" data-v="' + it[0] + '">' + it[1] + "</div>";
      }).join("");
    }).join("");
    root.innerHTML =
      '<div class="erp">' +
      '<div class="tb"><div class="brand"><div class="logo">O</div>Orbit</div>' +
      '<div class="sp"></div>' +
      '<select id="coSel" title="Active company">' + opts + "</select>" +
      '<button class="btn sm" id="out">Sign out</button>' +
      '<div class="ava" title="' + esc(S.user.email) + '">' + esc(initials) + "</div></div>" +
      '<div class="main"><div class="side">' + nav + "</div>" +
      '<div class="content" id="content"></div></div></div>' +
      '<div class="modal" id="modal"></div>';
    document.getElementById("out").onclick = signOut;
    document.getElementById("coSel").onchange = async function () {
      var id = this.value;
      S.company = S.companies.filter(function (c) { return c.id === id; })[0];
      await sb.from("profiles").update({ active_company_id: id }).eq("id", S.user.id);
      renderView();
    };
    root.querySelector(".side").addEventListener("click", function (e) {
      var n = e.target.closest("[data-v]"); if (n) { S.view = n.dataset.v; render(); }
    });
    renderView();
  }

  function cp(title, sub, actions) {
    return '<div class="cp"><div><h2>' + esc(title) + "</h2>" + (sub ? '<div class="sub">' + esc(sub) + "</div>" : "") + "</div><div>" + (actions || "") + "</div></div>";
  }

  function renderView() {
    var c = document.getElementById("content");
    if (S.view === "dashboard") return viewDashboard(c);
    if (S.view === "accounts") return viewAccounts(c);
    if (S.view === "trial") return viewTrial(c);
    if (S.view === "companies") return viewCompanies(c);
    // stubs for modules whose screens are next
    c.innerHTML = cp(navLabel(S.view), S.company.name) +
      '<div class="wrap"><div class="card"><div style="padding:40px;text-align:center;color:var(--ink3)">' +
      "This module's screen is next in the build. The data model and security for it are already live in the database." +
      "</div></div></div>";
  }
  function navLabel(v) { var r = v; MENU.forEach(function (m) { m.items.forEach(function (it) { if (it[0] === v) r = it[1]; }); }); return r; }

  // ========================= DASHBOARD =========================
  async function viewDashboard(c) {
    c.innerHTML = cp("Dashboard", S.company.name + "  ·  " + S.company.currency_code) + '<div class="wrap" id="db">Loading...</div>';
    var tb = await sb.rpc("trial_balance", { p_company: S.company.id });
    var rows = tb.data || [];
    var assets = 0, income = 0, expense = 0;
    rows.forEach(function (r) {
      var g = (r.type_code || "").split("_")[0];
      if (g === "income") income += Number(r.credit) - Number(r.debit);
      if (g === "expense") expense += Number(r.debit) - Number(r.credit);
      if (g === "asset") assets += Number(r.balance);
    });
    document.getElementById("db").innerHTML =
      '<div class="kpis">' +
      kpi("Total assets", S.company.currency_code + " " + money(assets)) +
      kpi("Income (YTD)", S.company.currency_code + " " + money(income)) +
      kpi("Expenses (YTD)", S.company.currency_code + " " + money(expense)) +
      kpi("Result", S.company.currency_code + " " + money(income - expense)) +
      "</div>" +
      '<div class="card"><h3>' + esc(S.company.name) + " · setup</h3>" +
      '<table><tbody>' +
      row2("Legal name", S.company.legal_name || S.company.name) +
      row2("Currency", S.company.currency_code) +
      row2("Country", S.company.country || "-") +
      row2("Chart of accounts", "Lebanese (editable) · " + rows.length + " accounts") +
      row2("Companies in group", S.companies.length + "") +
      "</tbody></table></div>";
  }
  function kpi(l, n) { return '<div class="kpi"><div class="l">' + esc(l) + '</div><div class="n">' + esc(n) + "</div></div>"; }
  function row2(a, b) { return "<tr><td class='muted' style='width:200px'>" + esc(a) + "</td><td>" + esc(b) + "</td></tr>"; }

  // ========================= CHART OF ACCOUNTS (editable) =========================
  async function viewAccounts(c) {
    c.innerHTML = cp("Chart of Accounts", S.company.name, '<button class="btn pri" id="addAcc">New account</button>') + '<div class="wrap" id="acc">Loading...</div>';
    document.getElementById("addAcc").onclick = openAccountModal;
    var res = await sb.from("accounts").select("*").eq("company_id", S.company.id).order("code");
    var accs = res.data || [];
    var types = (await sb.from("account_types").select("*")).data || [];
    var typeName = {}; types.forEach(function (t) { typeName[t.code] = t.name; });
    var byGroup = {}; accs.forEach(function (a) { var g = (a.type_code || "").split("_")[0]; (byGroup[g] = byGroup[g] || []).push(a); });
    var html = '<div class="card"><h3>' + accs.length + ' accounts <span class="muted" style="font-size:12px;font-weight:500">click a name to rename · toggle active</span></h3>' +
      "<table><thead><tr><th style='width:90px'>Code</th><th>Name</th><th>Type</th><th style='width:90px'>Status</th></tr></thead><tbody>";
    TYPE_GROUPS.forEach(function (tg) {
      var list = byGroup[tg[0]]; if (!list || !list.length) return;
      html += "<tr class='grp-row'><td colspan='4'>" + tg[1] + "</td></tr>";
      list.forEach(function (a) {
        html += "<tr data-id='" + a.id + "'>" +
          "<td class='num' style='text-align:left'>" + esc(a.code) + "</td>" +
          "<td><input class='cell acc-name' data-id='" + a.id + "' value='" + esc(a.name) + "'></td>" +
          "<td class='muted'>" + esc(typeName[a.type_code] || a.type_code) + "</td>" +
          "<td><span class='badge acc-tog" + (a.is_active ? "" : " off") + "' data-id='" + a.id + "' data-on='" + (a.is_active ? 1 : 0) + "' style='cursor:pointer'>" + (a.is_active ? "Active" : "Archived") + "</span></td></tr>";
      });
    });
    html += "</tbody></table></div>";
    document.getElementById("acc").innerHTML = html;
    // inline rename
    Array.prototype.forEach.call(document.querySelectorAll(".acc-name"), function (inp) {
      var orig = inp.value;
      inp.addEventListener("blur", async function () {
        if (inp.value === orig) return;
        var r = await sb.from("accounts").update({ name: inp.value }).eq("id", inp.dataset.id);
        if (r.error) { inp.value = orig; toast("Could not save: " + r.error.message); } else { orig = inp.value; toast("Saved"); }
      });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") inp.blur(); });
    });
    // toggle active
    Array.prototype.forEach.call(document.querySelectorAll(".acc-tog"), function (b) {
      b.addEventListener("click", async function () {
        var on = b.dataset.on === "1";
        var r = await sb.from("accounts").update({ is_active: !on }).eq("id", b.dataset.id);
        if (r.error) { toast("Could not update: " + r.error.message); return; }
        b.dataset.on = on ? "0" : "1"; b.textContent = on ? "Archived" : "Active"; b.classList.toggle("off", on);
      });
    });
  }
  async function openAccountModal() {
    var types = (await sb.from("account_types").select("*").order("internal_group")).data || [];
    var opts = types.map(function (t) { return "<option value='" + t.code + "'>" + esc(t.name) + " (" + t.internal_group + ")</option>"; }).join("");
    var m = document.getElementById("modal");
    m.innerHTML = '<div class="sheet"><h3>New account</h3><div class="form">' +
      "<div><label>Code</label><input id='a-code' placeholder='e.g. 7020'></div>" +
      "<div><label>Name</label><input id='a-name' placeholder='Account name'></div>" +
      "<div><label>Type</label><select id='a-type'>" + opts + "</select></div>" +
      "</div><div class='foot'><button class='btn' id='a-cancel'>Cancel</button><button class='btn pri' id='a-save'>Add account</button></div></div>";
    m.classList.add("on");
    document.getElementById("a-cancel").onclick = function () { m.classList.remove("on"); };
    document.getElementById("a-save").onclick = async function () {
      var code = document.getElementById("a-code").value.trim();
      var name = document.getElementById("a-name").value.trim();
      var type = document.getElementById("a-type").value;
      if (!code || !name) { toast("Code and name are required"); return; }
      var r = await sb.from("accounts").insert({ company_id: S.company.id, code: code, name: name, type_code: type });
      if (r.error) { toast("Could not add: " + r.error.message); return; }
      m.classList.remove("on"); toast("Account added"); viewAccounts(document.getElementById("content"));
    };
  }

  // ========================= TRIAL BALANCE =========================
  async function viewTrial(c) {
    c.innerHTML = cp("Trial Balance", S.company.name + "  ·  as of today") + '<div class="wrap" id="tb">Loading...</div>';
    var res = await sb.rpc("trial_balance", { p_company: S.company.id });
    var rows = res.data || [];
    var td = 0, tc = 0;
    var body = rows.map(function (r) {
      td += Number(r.debit); tc += Number(r.credit);
      var d = Number(r.debit), cr = Number(r.credit);
      return "<tr><td class='num' style='text-align:left'>" + esc(r.code) + "</td><td>" + esc(r.name) + "</td>" +
        "<td class='num'>" + (d ? money(d) : "") + "</td><td class='num'>" + (cr ? money(cr) : "") + "</td></tr>";
    }).join("");
    document.getElementById("tb").innerHTML = '<div class="card"><h3>Trial balance <span class="muted" style="font-size:12px;font-weight:500">' + S.company.currency_code + "</span></h3>" +
      "<table><thead><tr><th style='width:90px'>Code</th><th>Account</th><th class='num'>Debit</th><th class='num'>Credit</th></tr></thead><tbody>" + body +
      "<tr style='font-weight:700'><td></td><td>Total</td><td class='num'>" + money(td) + "</td><td class='num'>" + money(tc) + "</td></tr>" +
      "</tbody></table></div>" +
      '<div style="margin-top:12px;font-size:13px;color:' + (Math.abs(td - tc) < 0.01 ? "var(--good)" : "var(--bad)") + '">' +
      (Math.abs(td - tc) < 0.01 ? "In balance (debits = credits)" : "Out of balance") + "</div>";
  }

  // ========================= COMPANIES =========================
  async function viewCompanies(c) {
    c.innerHTML = cp("Companies", (S.org ? S.org.name : "") + "  ·  group") + '<div class="wrap" id="co">Loading...</div>';
    var res = await sb.from("companies").select("*").order("name");
    var rows = (res.data || []).map(function (c) {
      return "<tr><td><b>" + esc(c.name) + "</b></td><td class='muted'>" + esc(c.legal_name || "") + "</td><td>" + esc(c.currency_code) + "</td><td class='muted'>" + esc(c.country || "-") + "</td><td class='muted'>" + (c.parent_company_id ? "subsidiary" : "parent / standalone") + "</td></tr>";
    }).join("");
    document.getElementById("co").innerHTML = '<div class="card"><h3>' + (res.data || []).length + ' companies</h3>' +
      "<table><thead><tr><th>Name</th><th>Legal name</th><th>Currency</th><th>Country</th><th>Role</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  }

  // ---- start ----
  sb.auth.onAuthStateChange(function (_e, session) { if (!session) renderLogin("in"); });
  boot();
})();

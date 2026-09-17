/* Node runner for the structural checks. Uses only node: built-ins, so there is
 * no package.json, no install step and nothing to keep up to date.
 *
 *   node --test tests/
 *
 * The same checks run in a browser via tests/browser.html, which is how they are
 * verified on a machine with no Node installed. */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "app.css"), "utf8");
const CHECKS = require("./checks.js");
// the screen help pages, one file per group of apps, keyed by file name
const help = {};
const helpDir = path.join(root, "js", "help");
if (fs.existsSync(helpDir)) {
  for (const f of fs.readdirSync(helpDir)) {
    if (f.endsWith(".js")) help[f.slice(0, -3)] = fs.readFileSync(path.join(helpDir, f), "utf8");
  }
}

for (const check of CHECKS.checks) {
  test(check.name, () => {
    let r;
    try { r = check.run(src, css, help); } catch (e) { assert.fail("check threw: " + e.stack); }
    assert.ok(r.ok, r.detail + "\n\n  why this matters: " + check.why);
  });
}

// A check that only ever passes proves nothing, so the suite also verifies that
// each check FAILS when its bug is reintroduced. Two of these were written wrong
// the first time and were caught only by this.
const MUTATIONS = {
  "app.js parses": s => s + "\n function (",
  "every icon name exists": s => s.replace("{{ico:box}}", "{{ico:nosuchicon}}"),
  "every menu action is routed": s => s.replace('action: "mfg.dies"', 'action: "mfg.ghost"'),
  "no duplicate route labels": s => s.replace('case "mfg.dies":', 'case "mfg.wo":'),
  "no manual chapter is orphaned from its app": s => s.replace('plot: ["property"]', ""),
  "every screen grid belongs to a real chapter": s => s.replace(/^    property: \{$/m, "    ghostapp: {"),
  "every tutorial has a chapter and routed steps": s => s.replace('go: "mfg.boms"', 'go: "mfg.nowhere"'),
  "every walkthrough opens a routed screen and points at a real control": s => s.replace('sel: "#f-pay"', 'sel: "#f-nosuchbutton"'),
  "every image has alt text": s => s.replace('<img alt="" src=', "<img src="),
  "the accessibility layer is wired": s => s.replace("function a11yPromote", "function a11yRemoved"),
  "every ledger report honours the selected book": s => s.replace('bookFilter(sb.from("journal_lines").select("account_id', 'noFilter(sb.from("journal_lines").select("account_id'),
  "the offline outbox is wired": s => s.replace("async function svcWrite", "async function svcRemoved"),
  "status colours are readable as text":
    s => s.replace(".badge.paid{background:var(--good-s);color:var(--good-t)}", ".badge.paid{background:var(--good-s);color:var(--good)}"),
  "every approval document type is actually enforced":
    s => s.replace('approvalGate("expense"', 'noGate("expense"'),
  "an approval decision is authorised by the database":
    s => s.replace('sb.rpc("approval_decide"', 'sb.rpc("approval_decide_OFF"'),
  "a table bill charges the same tax as the register":
    s => s.replace("var due = svcR2(T.tot - takenSoFar)", "var due = svcR2(T.sub - takenSoFar)"),
  "account and ledger reads page past the 1,000-row cap":
    s => s + '\n var x = (await sb.from("accounts").select("id").eq("company_id", S.company.id)).data || [];',
  "every table name is a real table name":
    s => s.replace('sb.from("subcontracts")', 'sb.from("sc.list")'),
  "record forms name the breadcrumb through bcTitle":
    s => s.replace("    bcTitle(", "    document.querySelector(\".o-bc span:last-child\").textContent = ("),
  "every screen has its own help page": s => s.replace('"inv.in": {', '"inv.in.gone": {'),
  "a posted document is reopened by the database, never set back to draft by the app":
    s => s + '\n sb.from("invoices").update({ state: "draft" }).eq("id", x);',
  "no function is declared twice": s => s + "\n  function bcTitle() {}\n",
  "a confirmed order is amended in place":
    s => s.replace('if (!amend) await sb.from(ltbl).delete().eq("order_id", id);', 'await sb.from(ltbl).delete().eq("order_id", id);'),
  "suppliers never see a project's name":
    s => s.replace("esc(projCode) + '</div>'", "esc(projCode) + ' ' + esc(projRec.name) + '</div>'"),
  "the Counter never picks an account by a fixed code":
    s => s.replace("var cid = S.company.id, cashGl = pf.cashGl", 'var guess = cashAcctByCode(chart, "5300"); var cid = S.company.id, cashGl = pf.cashGl'),
  "keyboard data entry runs from one engine":
    s => s.replace('document.addEventListener("keydown", keyflowKey, true)', 'document.addEventListener("keydown", keyflowGone, true)'),
  "no em dash": s => s.replace("Fabrication", "Fabri—cation"),
};

test("the checks actually catch their bug", async (t) => {
  for (const check of CHECKS.checks) {
    await t.test(check.name, () => {
      const mutate = MUTATIONS[check.name];
      assert.ok(mutate, "no mutation defined - add one so this check is proven to work");
      // the help check mutates the help files instead of the source
      if (/own help page/.test(check.name)) {
        const brokenHelp = {};
        for (const k of Object.keys(help)) brokenHelp[k] = mutate(help[k]);
        assert.notDeepStrictEqual(brokenHelp, help, "the mutation changed nothing, so the check was never exercised");
        assert.strictEqual(check.run(src, css, brokenHelp).ok, false, "the check passed on deliberately broken help");
        return;
      }
      // a CSS-level check mutates the stylesheet instead of the source
      const cssCheck = /status colours/.test(check.name);
      const broken = mutate(cssCheck ? css : src);
      assert.notStrictEqual(broken, cssCheck ? css : src, "the mutation changed nothing, so the check was never exercised");
      const r = cssCheck ? check.run(src, broken, help) : check.run(broken, css, help);
      assert.strictEqual(r.ok, false, "the check passed on deliberately broken source");
    });
  }
});

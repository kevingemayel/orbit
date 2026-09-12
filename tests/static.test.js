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

for (const check of CHECKS.checks) {
  test(check.name, () => {
    let r;
    try { r = check.run(src, css); } catch (e) { assert.fail("check threw: " + e.stack); }
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
  "record forms name the breadcrumb through bcTitle":
    s => s.replace("    bcTitle(", "    document.querySelector(\".o-bc span:last-child\").textContent = ("),
  "no function is declared twice": s => s + "\n  function bcTitle() {}\n",
  "no em dash": s => s.replace("Fabrication", "Fabri—cation"),
};

test("the checks actually catch their bug", async (t) => {
  for (const check of CHECKS.checks) {
    await t.test(check.name, () => {
      const mutate = MUTATIONS[check.name];
      assert.ok(mutate, "no mutation defined - add one so this check is proven to work");
      // a CSS-level check mutates the stylesheet instead of the source
      const cssCheck = /status colours/.test(check.name);
      const broken = mutate(cssCheck ? css : src);
      assert.notStrictEqual(broken, cssCheck ? css : src, "the mutation changed nothing, so the check was never exercised");
      const r = cssCheck ? check.run(src, broken) : check.run(broken, css);
      assert.strictEqual(r.ok, false, "the check passed on deliberately broken source");
    });
  }
});

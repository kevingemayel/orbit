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
const CHECKS = require("./checks.js");

for (const check of CHECKS.checks) {
  test(check.name, () => {
    let r;
    try { r = check.run(src); } catch (e) { assert.fail("check threw: " + e.stack); }
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
  "no em dash": s => s.replace("Fabrication", "Fabri—cation"),
};

test("the checks actually catch their bug", async (t) => {
  for (const check of CHECKS.checks) {
    await t.test(check.name, () => {
      const mutate = MUTATIONS[check.name];
      assert.ok(mutate, "no mutation defined - add one so this check is proven to work");
      const broken = mutate(src);
      assert.notStrictEqual(broken, src, "the mutation changed nothing, so the check was never exercised");
      assert.strictEqual(check.run(broken).ok, false, "the check passed on deliberately broken source");
    });
  }
});

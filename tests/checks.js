/* ===========================================================================
 * Orbit structural checks.
 *
 * Orbit is one large IIFE with no build step and no module system, so there is
 * nothing to import and unit-test in the usual way. What HAS actually broken in
 * this codebase is structural: a menu pointing at a screen that no longer
 * exists, an icon name that silently renders a grey dot, a manual chapter that
 * no app can reach. Every check below was written after a real bug of that
 * shape, and each one runs against the source text so it needs no runtime.
 *
 * Runs identically in Node (tests/static.test.js) and in a browser
 * (tests/browser.html). No dependencies, deliberately.
 * ======================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ORBIT_CHECKS = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---- helpers -----------------------------------------------------------
  // Slice a top-level `  var NAME = {` ... `  };` block out of the source.
  function block(src, name) {
    var re = new RegExp("^  var " + name + " = [\\{\\[]", "m");
    var m = re.exec(src);
    if (!m) return "";
    var lines = src.slice(m.index).split("\n"), out = [];
    for (var i = 0; i < lines.length; i++) {
      out.push(lines[i]);
      if (i > 0 && /^  [\}\]];\s*$/.test(lines[i])) break;
    }
    return out.join("\n");
  }
  function all(src, re, group) {
    var out = [], m; re.lastIndex = 0;
    while ((m = re.exec(src)) !== null) { out.push(m[group == null ? 1 : group]); if (m.index === re.lastIndex) re.lastIndex++; }
    return out;
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function missing(needles, haystack) { return uniq(needles).filter(function (n) { return haystack.indexOf(n) < 0; }); }
  function ok(detail) { return { ok: true, detail: detail || "" }; }
  function bad(detail) { return { ok: false, detail: detail }; }

  // Actions the router resolves by prefix or suffix rather than a case label.
  var DYNAMIC = [/^help\./, /\.help$/, /^act\./, /^platform\./];
  function isDynamic(a) { return DYNAMIC.some(function (re) { return re.test(a); }); }

  function iconNames(src) { return all(block(src, "ICON"), /^\s*([a-zA-Z][a-zA-Z0-9]*)\s*:/gm); }
  function menuActions(src) {
    var b = block(src, "APPS");
    return uniq(all(b, /action:\s*"([a-zA-Z0-9_.]+)"/g)
      .concat(all(b, /\["[^"]*",\s*"([a-zA-Z0-9_.]+)"\]/g)));
  }
  function routedActions(src) { return uniq(all(src, /case\s+"([a-zA-Z0-9_.]+)":/g)); }
  function appKeys(src) { return all(block(src, "APPS"), /^    ([a-z_]+):\s*\{/gm); }
  function chapterKeys(src) { return all(block(src, "HELP_MANUAL"), /key:\s*"([a-z_]+)"/g); }
  function mapKeys(src) { return all(block(src, "MAN_MAPS"), /^    ([a-z_]+):\s*\{/gm); }
  function appHelpKeys(src) { return all(block(src, "APP_HELP"), /([a-z_]+):\s*\[/g); }
  function appHelpValues(src) { return all(block(src, "APP_HELP"), /"([a-z_]+)"/g); }
  function tutorialKeys(src) { return all(block(src, "HELP_TUTORIALS"), /^    ([a-z_]+):\s*\{/gm); }

  // ---- the checks --------------------------------------------------------
  var checks = [

    { name: "app.js parses",
      why: "A syntax error ships a blank app. This has happened (a double-quoted string closed with a single quote).",
      run: function (src) {
        try { new Function(src); return ok(src.length.toLocaleString() + " chars"); }
        catch (e) { return bad(e.name + ": " + e.message); }
      } },

    { name: "every icon name exists",
      why: "hSvg falls back to a grey dot for an unknown name, so a typo never errors and looks fine in a smoke test.",
      run: function (src) {
        var known = iconNames(src);
        if (!known.length) return bad("could not read the ICON map");
        var used = []
          .concat(all(src, /\{\{ico:([a-zA-Z]+)\}\}/g))     // manual article tokens
          .concat(all(src, /\{ i: "([a-zA-Z]+)"/g))          // MAN_MAPS screen tiles
          .concat(all(src, /\bico: "([a-zA-Z]+)"/g))         // tutorial steps
          .concat(all(src, /hIcon\("([a-zA-Z]+)"\)/g));      // direct calls
        // "name" appears only inside the comments documenting the syntax
        var gone = missing(used, known).filter(function (n) { return n !== "name"; });
        return gone.length ? bad("unknown icon(s): " + gone.join(", ")) : ok(uniq(used).length + " names, all real");
      } },

    { name: "every menu action is routed",
      why: "A menu entry pointing at an action with no case label is a dead button.",
      run: function (src) {
        var routed = routedActions(src);
        var dead = menuActions(src).filter(function (a) { return routed.indexOf(a) < 0 && !isDynamic(a); });
        return dead.length ? bad("dead menu action(s): " + dead.join(", ")) : ok(menuActions(src).length + " actions all resolve");
      } },

    { name: "no duplicate route labels",
      why: "A second case for the same action silently shadows the first.",
      run: function (src) {
        var seen = {}, dupes = [];
        all(src, /case\s+"([a-zA-Z0-9_.]+)":/g).forEach(function (a) {
          if (seen[a]) { if (dupes.indexOf(a) < 0) dupes.push(a); } else seen[a] = 1;
        });
        return dupes.length ? bad("duplicated: " + dupes.join(", ")) : ok(Object.keys(seen).length + " unique routes");
      } },

    { name: "no manual chapter is orphaned from its app",
      why: "Property had a full chapter and a 28-screen grid that no user could open from inside the Property app, because APP_HELP had no entry for it. Note the app key ('plot') and the chapter key ('property') differ, so comparing names is not enough: what matters is that some app claims each chapter.",
      run: function (src) {
        // Chapters that exist only inside the Help app and belong to no single app.
        var STANDALONE = ["overview", "glossary"];
        var chapters = chapterKeys(src);
        var apps = appKeys(src).filter(function (k) { return k !== "help"; });
        var claimed = uniq(appHelpValues(src).concat(apps.filter(function (k) { return chapters.indexOf(k) >= 0; })));
        var orphan = chapters.filter(function (c) { return claimed.indexOf(c) < 0 && STANDALONE.indexOf(c) < 0; });
        if (!orphan.length) return ok(chapters.length + " chapters, every one claimed by an app");
        var unmapped = apps.filter(function (k) { return appHelpKeys(src).indexOf(k) < 0 && chapters.indexOf(k) < 0; });
        return bad("chapter(s) no app opens: " + orphan.join(", ") +
          (unmapped.length ? " | app(s) with no chapter mapped: " + unmapped.join(", ") + " - is one of these meant to claim it?" : ""));
      } },

    { name: "every screen grid belongs to a real chapter",
      why: "MAN_MAPS is appended onto a chapter by key. A map with no chapter is never rendered.",
      run: function (src) {
        var gone = missing(mapKeys(src), chapterKeys(src));
        return gone.length ? bad("screen grid with no chapter: " + gone.join(", ")) : ok(mapKeys(src).length + " grids matched");
      } },

    { name: "every tutorial has a chapter and routed steps",
      why: "A tutorial links back to its chapter and each step opens a screen. Both are dead links if wrong.",
      run: function (src) {
        var b = block(src, "HELP_TUTORIALS"), routed = routedActions(src), problems = [];
        var chapters = chapterKeys(src);
        missing(all(b, /chapter:\s*"([a-z_]+)"/g), chapters).forEach(function (c) { problems.push("tutorial chapter '" + c + "' does not exist"); });
        all(b, /\bgo:\s*"([a-zA-Z0-9_.]+)"/g).forEach(function (a) {
          if (routed.indexOf(a) < 0 && !isDynamic(a)) problems.push("tutorial step opens dead action '" + a + "'");
        });
        missing(all(src, /data-tut=\\?"([a-z_]+)\\?"/g), tutorialKeys(src)).forEach(function (t) { problems.push("button starts missing tutorial '" + t + "'"); });
        return problems.length ? bad(uniq(problems).join("; ")) : ok(tutorialKeys(src).length + " tutorial(s) wired");
      } },

    { name: "every image has alt text",
      why: "An <img> with no alt is announced as its filename, or as nothing at all. Decorative thumbnails need alt=\"\", not a missing attribute.",
      run: function (src) {
        var bare = all(src, /(<img (?![^>]*\balt=)[^>]{0,120})/g);
        return bare.length ? bad(bare.length + " image(s) without alt, first: " + bare[0].slice(0, 70))
                           : ok(all(src, /(<img)/g).length + " images, all have alt");
      } },

    { name: "the accessibility layer is wired",
      why: "Orbit's keyboard access depends on one interceptor promoting click-bound divs to buttons. If it is removed or renamed, 1,000 controls silently become mouse-only again and nothing else fails.",
      run: function (src) {
        var need = [
          ["onclick interceptor", /Object\.defineProperty\(HTMLElement\.prototype,\s*"onclick"/],
          ["promote to button", /function a11yPromote/],
          ["keyboard activation", /e\.key === "Enter" \|\| e\.key === " "/],
          ["dialog role and focus trap", /function a11yDialog/],
          ["skip link", /id = "o-skip"/],
          ["toasts announced", /setAttribute\("aria-live", "polite"\)/]
        ];
        var gone = need.filter(function (p) { return !p[1].test(src); }).map(function (p) { return p[0]; });
        return gone.length ? bad("missing: " + gone.join(", ")) : ok(need.length + " pieces present");
      } },

    { name: "every ledger report honours the selected book",
      why: "Multi-book only works if EVERY report filters by the chosen book. One report that forgets shows statutory and management mixed together, which is worse than having no books at all: the number looks right and is not.",
      run: function (src) {
        var problems = [];
        // Any query joining journal_entries for reporting must pass through
        // bookFilter. Note bookFilter WRAPS the query, so it sits to the LEFT of
        // sb.from - the window has to look backwards, not forwards.
        // The filter can appear on either side: bookFilter(sb.from(...)) wraps it,
        // or the query is built into a variable and filtered on a following line.
        var joins = [], re = /sb\.from\("journal_lines"\)[\s\S]{0,400}?journal_entries!inner/g, m;
        while ((m = re.exec(src)) !== null) {
          var window = src.slice(Math.max(0, m.index - 80), m.index + m[0].length + 320);
          joins.push(window);
          if (window.indexOf("bookFilter") < 0) {
            problems.push("a journal_lines report query near line " + src.slice(0, m.index).split("\n").length + " does not use bookFilter");
          }
        }
        // Every trial_balance caller must pass the book codes.
        var tb = all(src, /(sb\.rpc\("trial_balance",[^)]*\))/g);
        tb.forEach(function (c) { if (c.indexOf("p_book_codes") < 0) problems.push("a trial_balance call does not pass p_book_codes"); });
        if (!/function bookFilter/.test(src)) problems.push("bookFilter is missing");
        if (!/function bookCodes/.test(src)) problems.push("bookCodes is missing");
        if (!/function bookChipHTML/.test(src)) problems.push("the non-primary book warning chip is missing");
        return problems.length ? bad(uniq(problems).join("; "))
                               : ok(tb.length + " trial_balance call(s) and " + joins.length + " ledger query(ies) all book-aware");
      } },

    { name: "no em dash",
      why: "A standing house rule for all Orbit copy.",
      run: function (src) {
        var n = (src.match(/—/g) || []).length;
        return n ? bad(n + " em dash character(s) present") : ok("none");
      } }
  ];

  function run(src) {
    return checks.map(function (c) {
      var r;
      try { r = c.run(src); } catch (e) { r = bad("check threw: " + e.message); }
      return { name: c.name, why: c.why, ok: r.ok, detail: r.detail };
    });
  }

  return { checks: checks, run: run };
});

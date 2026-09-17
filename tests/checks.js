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
  // The source of one function, found at any depth: from its declaration down to
  // the closing brace at the same indentation. Orbit's indentation is consistent
  // enough for that to be exact, and it keeps a check inside the function it is
  // about instead of matching the same words somewhere else in the file.
  // Call it on its own result to reach a function nested inside another.
  function fnBody(src, name) {
    var m = new RegExp("^([ \\t]*)(?:async )?function " + name + "\\s*\\(", "m").exec(src || "");
    if (!m) return "";
    var lines = src.slice(m.index).split("\n"), out = [];
    for (var i = 0; i < lines.length; i++) {
      out.push(lines[i]);
      if (i === 0 && /\}\s*$/.test(lines[0]) && lines[0].split("{").length === lines[0].split("}").length) return out.join("\n");
      if (i > 0 && lines[i].replace(/\s+$/, "") === m[1] + "}") return out.join("\n");
    }
    return "";
  }

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

    { name: "every walkthrough opens a routed screen and points at a real control",
      why: "A walkthrough lights up a control by its id, class or attribute and waits for it. Rename the id on the screen and the walk stops at that step saying it cannot find the control, while the page itself still loads and works, so nothing else would catch it.",
      run: function (src) {
        var b = block(src, "HELP_WALKS"), cl = block(src, "WK_CHECKLISTS");
        if (!b) return bad("HELP_WALKS is missing");
        if (!cl) return bad("WK_CHECKLISTS is missing");
        // the walks name the controls, so the controls must exist somewhere else in the file
        var rest = src.split(b).join(""), routed = routedActions(src), problems = [];
        all(b + "\n" + cl, /\bgo:\s*"([a-zA-Z0-9_.]+)"/g).forEach(function (a) {
          if (routed.indexOf(a) < 0 && !isDynamic(a)) problems.push("opens dead action '" + a + "'");
        });
        var sels = uniq(all(b, /(?:\bsel:\s*|wkHas\()"([^"]+)"/g));
        sels.forEach(function (s) {
          all(s, /#([A-Za-z][\w-]*)/g).forEach(function (id) {
            if (!new RegExp("id\\s*=\\s*\\\\?[\"']" + id + "\\\\?[\"']").test(rest)) problems.push("no element has the id " + id);
          });
          all(s, /\.([A-Za-z][\w-]*)/g).forEach(function (c) {
            if (!new RegExp("class=\\\\?\"[^\"]*\\b" + c + "\\b").test(rest)) problems.push("no element has the class " + c);
          });
          all(s, /\[([a-z][\w-]*)\]/g).forEach(function (at) { if (rest.indexOf(at + "=\"") < 0) problems.push("no element has the attribute " + at); });
        });
        var keys = all(b, /^    ([a-z_]+):\s*\{/gm), ids = all(b, /\bid:\s*"([a-z_]+)"/g);
        all(cl, /\bwalk:\s*"([a-z_]+)"/g).forEach(function (k) { if (keys.indexOf(k) < 0) problems.push("checklist starts missing walk '" + k + "'"); });
        all(cl, /\bat:\s*"([a-z_]+)"/g).forEach(function (k) { if (ids.indexOf(k) < 0) problems.push("checklist starts at missing step '" + k + "'"); });
        return problems.length ? bad(uniq(problems).join("; ")) : ok(keys.length + " walkthroughs and " + sels.length + " controls, every one real");
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
          ["toasts announced", /setAttribute\("aria-live", "polite"\)/],
          ["fields get names", /function a11yFields/],
          ["the naming pass is scheduled", /queued = true; setTimeout\(flush, 0\)/]
        ];
        var gone = need.filter(function (p) { return !p[1].test(src); }).map(function (p) { return p[0]; });
        return gone.length ? bad("missing: " + gone.join(", ")) : ok(need.length + " pieces present");
      } },

    { name: "status colours are readable as text",
      why: "A green Paid pill was drawing 2.79:1 green on pale green, and amber on cream was 2.82:1. Both are far under the 4.5:1 EN 301 549 and WCAG AA floor for body text, which is what closes UK and EU public sector. The fills are fine; it is the WORDS that were unreadable, so there is a separate token for the text and every text use must take it.",
      run: function (src, css) {
        var sheet = css || src;
        // the `color` property only: border-color and background-color are
        // fills, and a fill at that contrast is fine
        var raw = (sheet.match(/(?:^|[;{\s"'>])color:\s*var\(--(?:good|warn|bad)[,)]/g) || []);
        if (raw.length) return bad(raw.length + " place(s) still use a status fill colour as text");
        var t = (sheet.match(/--good-t:/g) || []).length;
        if (t < 5) return bad("only " + t + " theme(s) define the readable text tokens");
        return ok(t + " themes define --good-t/--warn-t/--bad-t, no raw status colour used as text");
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

    { name: "the offline outbox is wired",
      why: "A till that stops taking orders when the wifi drops is the failure this exists to prevent. If the outbox is removed, or a service write stops going through svcWrite, everything still parses and the loss only shows up mid-shift.",
      run: function (src) {
        var need = [
          ["outbox write path", /async function svcWrite/],
          ["durable queue", /indexedDB\.open\("orbit_outbox"/],
          ["client-generated ids", /if \(op === "insert" && !payload\.id\) payload\.id = uuid\(\)/],
          ["idempotent replay", /upsert\(entry\.payload, \{ onConflict: "id" \}\)/],
          ["drains on reconnect", /addEventListener\("online"/],
          ["offline indicator", /function obPaint/]
        ];
        var gone = need.filter(function (p) { return !p[1].test(src); }).map(function (p) { return p[0]; });
        if (gone.length) return bad("missing: " + gone.join(", "));
        // and nothing on the service path may write straight past the queue
        var a = src.indexOf("SERVICE: the two screens"), b = src.indexOf("THE THREE REPORTS");
        var svc = (a >= 0 && b > a) ? src.slice(a, b) : "";
        var direct = all(svc, /(sb\.from\("[a-z_]+"\)\.(?:insert|update|delete))/g);
        return direct.length
          ? bad(direct.length + " service write(s) bypass the outbox, first: " + direct[0])
          : ok(need.length + " pieces present, no service write bypasses the queue");
      } },

    { name: "every approval document type is actually enforced",
      why: "subcontract, variation and expense were offered in the rule editor and nothing ever called approvalGate for them. A rule set there did nothing at all, and the user had no way to find that out: the screen showed an active rule and the document posted anyway.",
      run: function (src) {
        var m = /var APPR_DOC_LABEL = \{([^}]*)\}/.exec(src);
        if (!m) return bad("could not read APPR_DOC_LABEL");
        var types = uniq(all(m[1], /([a-z_]+):/g));
        if (!types.length) return bad("no document types found");
        // The type is not always a literal in the call: some sites pass a
        // ternary, some a variable set on the line above. Look at the call and
        // the statement leading up to it, which is where those are decided.
        var zones = "", re = /approvalGate\(/g, mm;
        while ((mm = re.exec(src)) !== null) zones += src.slice(Math.max(0, mm.index - 260), mm.index + 120) + "\n";
        var miss = types.filter(function (t) { return zones.indexOf('"' + t + '"') < 0; });
        return miss.length
          ? bad(miss.length + " type(s) offered in the rule editor but never checked: " + miss.join(", "))
          : ok(types.length + " document types, every one gated");
      } },

    { name: "an approval decision is authorised by the database",
      why: "the approvals table had one write policy for every command, so anyone who could raise a purchase order could also approve it, whoever the rule named, and the audit trail then said a named person signed it off. A browser-side check is not authorisation.",
      run: function (src) {
        var need = [
          ["decisions go through the guarded function", /sb\.rpc\("approval_decide"/],
          ["the inbox separates what is yours", /function isMine/],
          ["someone else's items are not actionable", /Not yours to decide/]
        ];
        var gone = need.filter(function (p) { return !p[1].test(src); }).map(function (p) { return p[0]; });
        return gone.length ? bad("missing: " + gone.join(", ")) : ok(need.length + " pieces present");
      } },

    { name: "a table bill charges the same tax as the register",
      why: "The floor pad wrote subtotal = total and left tax at 0, so the same order rung at the table came out 11% cheaper than at the counter and the sales tax report quietly under-declared. Nothing errors when this breaks; the money is just wrong.",
      run: function (src) {
        var need = [
          ["reads the sales rate", /async function svcVat/],
          ["one totals routine", /function svcTotals/],
          ["the order stores its tax", /svcWrite\("pos_orders", "update", \{ subtotal: t\.sub, tax: t\.tax, total: t\.tot \}/],
          ["the bill is due on the tax-inclusive total", /var due = svcR2\(T\.tot - takenSoFar\)/],
          ["splits are tax inclusive", /var grossUp = function/]
        ];
        var gone = need.filter(function (p) { return !p[1].test(src); }).map(function (p) { return p[0]; });
        return gone.length ? bad("missing: " + gone.join(", ")) : ok(need.length + " pieces present");
      } },

    { name: "record forms name the breadcrumb through bcTitle",
      why: "A positional selector on the breadcrumb (span:last-child) broke every record form the day a button was added after the title. The title has an id and one helper writes it.",
      run: function (src) {
        if (src.indexOf(".o-bc span:last-child") >= 0) return bad("a screen still uses the positional selector");
        if (!/id="bc-title"/.test(src)) return bad("bcHTML no longer names the title span");
        if (!/function bcTitle\(/.test(src)) return bad("bcTitle helper is missing");
        var n = (src.match(/^\s+bcTitle\(/gm) || []).length;
        return n ? ok(n + " forms use bcTitle") : bad("no form calls bcTitle");
      } },

    { name: "no function is declared twice",
      why: "Orbit is one scope, so a second function with the same name silently replaces the first wherever it sits in the file. A list-engine helper called wireQuickAdd was shadowed by an older agile-board helper of the same name, and the add line did nothing, without an error anywhere.",
      run: function (src) {
        var seen = {}, dup = [];
        all(src, /^  (?:async )?function ([A-Za-z_$][\w$]*)\s*\(/gm).forEach(function (n) { if (seen[n]) { if (dup.indexOf(n) < 0) dup.push(n); } seen[n] = 1; });
        return dup.length ? bad("declared twice: " + dup.join(", ")) : ok(Object.keys(seen).length + " top-level functions, all unique");
      } },

    { name: "account and ledger reads page past the 1,000-row cap",
      why: "Supabase returns at most 1,000 rows a request. ALGECO's chart has 1,136 accounts, so every screen that read the whole chart in one request silently lost the last 136: the income accounts vanished from pickers, and a company setting showed 'not set' and would have been wiped on save. The ledger reports add journal lines up in the browser, so the same cap would make a trial balance come out short without any error.",
      run: function (src) {
        if (!/async function allRows\(/.test(src)) return bad("the allRows paging helper is missing");
        var acc = /\(await sb\.from\("accounts"\)\.select\("[^"]*"\)\.eq\("company_id", [A-Za-z.]+\)(?:\.eq\("is_active", true\)|\.or\("is_active\.is\.null,is_active\.eq\.true"\))?(?:\.order\("code"\))?\)\.data/g;
        var led = /\(await bookFilter\(sb\.from\("journal_lines"\)/g;
        var n = (src.match(acc) || []).length, m = (src.match(led) || []).length + (/var q = sb\.from\("journal_lines"\)[\s\S]{0,400}?\(await q\)\.data/.test(src) ? 1 : 0);
        if (n || m) return bad((n ? n + " full account list(s)" : "") + (n && m ? " and " : "") + (m ? m + " ledger read(s)" : "") + " without paging");
        return ok("every full account list and ledger read pages");
      } },

    { name: "every table name is a real table name",
      why: "A search-and-replace for the Subcontracts screen key turned sb.from(\"subcontracts\") into sb.from(\"sc.list\") in six places. Nothing errored at load; the list, the form, the approval hand-off and the certificate lookup all read a table that cannot exist, for weeks.",
      run: function (src) {
        var bad1 = uniq(all(src, /sb\.from\("([^"]*)"\)/g)).filter(function (t) { return !/^[a-z][a-z0-9_]*$/.test(t); });
        return bad1.length ? bad(bad1.length + " impossible table name(s): " + bad1.join(", ")) : ok("every sb.from() names a plain identifier");
      } },

    { name: "every screen has its own help page",
      why: "Every screen explains itself: what it is for, when and how to use it, every field, and how it connects to the other apps. A screen added to a menu without a page quietly has none, a help file that does not parse takes every page in it down, and a link to a screen that does not exist is a dead end in the middle of the explanation.",
      run: function (src, css, help) {
        var fm = /var SCREEN_HELP_FILES = \[([^\]]*)\]/.exec(src);
        if (!fm) return bad("SCREEN_HELP_FILES is missing from app.js");
        var files = all(fm[1], /"([a-z0-9-]+)"/g);
        help = help || {};
        var absent = files.filter(function (f) { return !help[f]; });
        if (absent.length) return bad("help file(s) listed but not found: " + absent.map(function (f) { return "js/help/" + f + ".js"; }).join(", "));
        for (var i = 0; i < files.length; i++) {
          try { new Function(help[files[i]]); } catch (e) { return bad("js/help/" + files[i] + ".js does not parse: " + e.message); }
          if (help[files[i]].indexOf("—") >= 0) return bad("js/help/" + files[i] + ".js contains an em dash");
        }
        // the header comment documents the page shape with example keys; skip it
        var text = files.map(function (f) { return help[f]; }).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
        var pages = uniq(all(text, /^\s*"([a-zA-Z0-9_.]+)":\s*\{/gm));
        var gone = menuActions(src).filter(function (a) { return !isDynamic(a) && pages.indexOf(a) < 0; });
        if (gone.length) return bad(gone.length + " screen(s) with no help page: " + gone.join(", "));
        var routed = routedActions(src);
        var dead = uniq(all(text, /\bto:\s*"([a-zA-Z0-9_.]+)"/g)).filter(function (a) { return routed.indexOf(a) < 0 && !isDynamic(a); });
        return dead.length ? bad("help links to screen(s) that do not exist: " + dead.join(", ")) : ok(pages.length + " pages in " + files.length + " files, every menu screen covered");
      } },

    { name: "a posted document is reopened by the database, never set back to draft by the app",
      why: "Edit on a posted voucher or bill goes through reopen_journal_entry and reopen_invoice, which keep the posted version in document_revisions, refuse a closed period and keep a bill's payments matched. An update that set state to draft directly would skip all three, and the database refuses it, so the button would only ever fail.",
      run: function (src) {
        var direct = all(src, /sb\.from\("(invoices|journal_entries)"\)\.update\(\{[^}]*\bstate:\s*"draft"/g);
        if (direct.length) return bad(direct.length + " direct update(s) set a posted document back to draft: " + direct.join(", "));
        var missing = ["reopen_journal_entry", "reopen_invoice"].filter(function (f) { return src.indexOf('sb.rpc("' + f + '"') < 0; });
        return missing.length ? bad("Edit no longer calls " + missing.join(" and ")) : ok("both Edit buttons reopen through the database");
      } },

    { name: "a confirmed order is amended in place",
      why: "Editing a confirmed purchase or sales order must keep its lines, because the lines carry what was already received and billed. Deleting them by order_id and inserting fresh rows resets those quantities to zero, so a half-received PO could be received and billed a second time. Only a draft may replace its lines wholesale; an amend updates, adds and removes lines one by one.",
      run: function (src) {
        var save = fnBody(fnBody(src, "renderOrderForm"), "save");
        if (!save) return bad("could not find save() inside renderOrderForm");
        if (!/\bif \(amend\)/.test(save)) return bad("save() no longer has an amend branch");
        if (!/sb\.from\([\w$]+\)\.update\(rows\[/.test(save)) return bad("an amend no longer updates the existing lines in place");
        // every delete of an order's lines must sit right behind the not-amending guard
        var re = /sb\.from\([^)]*\)\.delete\(\)\s*\.(?:eq|in)\(\s*"order_id"/g, m, n = 0, loose = [];
        while ((m = re.exec(save)) !== null) {
          n++;
          var before = save.slice(Math.max(0, m.index - 80), m.index);
          if (!/if \(!amend\)\s*\{?\s*(?:(?:var\s+[\w$]+\s*=\s*)?await\s+)?$/.test(before)) loose.push(save.slice(m.index, m.index + 60).split(/\r?\n/)[0]);
        }
        if (loose.length) return bad(loose.length + " delete(s) of an order's lines also run when amending: " + loose.join(" | "));
        return ok(n ? n + " delete of an order's lines, only when not amending; an amend updates lines in place" : "save() deletes no lines by order; an amend updates lines in place");
      } },

    { name: "suppliers never see a project's name",
      why: "A purchase order or an RFQ goes to a supplier, and a supplier who can read the project's name can go round the contractor to its client. Both prints show the project's short code instead. The name is one small edit away from coming back, because the order form already holds every project's name for its picker.",
      run: function (src) {
        var problems = [], LEAKS = [
          [/\bprojects?\.name\b/, "a joined project's .name"],
          [/\bprojects\s*\([^)]*\bname\b/, "projects(name) in a select"],
          [/\bprojLabel\(/, "projLabel(), which includes the name"],
          [/\bproject_name\b/, "project_name"],
          [/\b(?:projRec|rp|proj|prj)\.name\b/, "a project record's .name"]
        ];
        [["renderOrderForm", "printOrder", "the purchase order print"], ["renderRFQForm", "printRfq", "the RFQ print"]].forEach(function (t) {
          var fn = fnBody(fnBody(src, t[0]), t[1]);
          if (!fn) { problems.push(t[1] + " not found inside " + t[0]); return; }
          if (!/Project code/.test(fn) || !/\.code\b/.test(fn)) problems.push(t[2] + " no longer prints the project code");
          var hits = [];
          // whatever a record taken from a project list is called in this print, its .name is off limits
          all(fn, /\b([A-Za-z_$][\w$]*)\s*=\s*[\w$.]*[Pp]roj[\w$]*\.filter\(/g).forEach(function (v) {
            if (new RegExp("\\b" + v.replace(/\$/g, "\\$") + "\\s*\\.\\s*name\\b").test(fn)) hits.push(v + ".name");
          });
          LEAKS.forEach(function (p) { if (p[0].test(fn)) hits.push(p[1]); });
          if (hits.length) problems.push(t[2] + " prints a project's name: " + uniq(hits).join(", "));
        });
        return problems.length ? bad(problems.join("; ")) : ok("the PO and RFQ prints show the project code and never the name");
      } },

    { name: "the Counter never picks an account by a fixed code",
      why: "Counter postings used to look accounts up by standard codes: card and transfer lines went to 5100 whatever the cash account was, and a guessed 5300 or 4190 put money in accounts nobody had chosen or could see, or that the chart did not have. Every side now posts to an account the cashier can see: the cash account's own ledger account and the Counter account chosen in the dialog. The one default left is 6900 for a daily-close difference, shown in the field and changeable.",
      run: function (src) {
        var names = ["cashPreflight", "cashPostLedger", "confirmHandover", "openCashCountModal"], body = {}, problems = [];
        names.forEach(function (n) { body[n] = fnBody(src, n); if (!body[n]) problems.push(n + " not found"); });
        if (problems.length) return bad(problems.join("; "));
        // the visible over/short default is allowed once, in exactly this shape
        var allowed = /\bos0\s*=\s*cashAcctByCode\(ccChart,\s*"6900"\)/, hasDefault = allowed.test(body.openCashCountModal);
        body.openCashCountModal = body.openCashCountModal.replace(allowed, "os0 = null");
        names.forEach(function (n) {
          all(body[n], /(cashAcctByCode\([^)]*\))/g).forEach(function (c) { problems.push(n + " calls " + c); });
          all(body[n], /((?:\.code\s*===?\s*|\.eq\(\s*"code"\s*,\s*)"(?:5100|5300|4190|6900)")/g).forEach(function (c) { problems.push(n + " matches " + c); });
        });
        return problems.length ? bad(uniq(problems).join("; "))
                               : ok(names.length + " posting functions use chosen accounts" + (hasDefault ? "; 6900 only as the visible close-difference default" : ""));
      } },

    { name: "keyboard data entry runs from one engine",
      why: "Enter used to do nothing in any Orbit form, so every purchase order line cost a trip to the mouse. One capture-phase listener now walks the fields on every form, dialog and lines table, and at the end of the last row presses that table's own Add button so the cursor lands in the new line's first field. It has to stay one engine and stay wired: a copy per screen drifts apart, and losing the skip list makes Enter fire twice in the four editors that already answer it themselves (the spreadsheet grid, the quick-add line, an in-place list cell and the journal voucher), which saves a record and jumps a field on the same keystroke.",
      run: function (src) {
        var kf = fnBody(src, "keyflowKey");
        if (!kf) return bad("the keyflow engine (keyflowKey) is gone");
        if (!/document\.addEventListener\("keydown", keyflowKey, true\)/.test(src)) return bad("keyflowKey is no longer wired as a document-level capture listener, so Enter does nothing again");
        var skip = /var KEYFLOW_SKIP = '([^']*)'/.exec(src);
        if (!skip) return bad("KEYFLOW_SKIP is missing, so the editors that own Enter are no longer skipped");
        var owns = [".sg-in", ".o-qa", "o-ecell", "je-grid", 'data-enter="own"'];
        var lost = owns.filter(function (s) { return skip[1].indexOf(s) < 0; });
        if (lost.length) return bad("KEYFLOW_SKIP no longer skips " + lost.join(", ") + ", so Enter fires twice there");
        if (!/function keyflowAddRow\(/.test(src) || !/\.o-addln/.test(fnBody(src, "keyflowAddBtn")))
          return bad("Enter at the end of a lines table no longer presses that table's own Add button");
        if (!/tagName === "TEXTAREA"/.test(kf)) return bad("Enter no longer leaves a textarea alone, so it cannot start a new paragraph");
        if (!/closest\("\.o-form"\)/.test(kf) || !/\.modal/.test(kf) || !/table\.o-lines/.test(kf))
          return bad("the engine no longer recognises forms, dialogs and lines tables, so it either does nothing or acts on screens it should not");
        return ok("one capture listener, " + skip[1].split(",").length + " opted-out editors, lines tables grow through .o-addln");
      } },

    { name: "the allowed-networks rule belongs to the database, and the app only explains it",
      why: "The browser talks to PostgREST directly with the publishable key, so an address rule enforced in app.js is advice: the same request can be repeated by hand with the same token. The rule lives in migration 196, inside my_member_in, my_role_in and my_company_ids, and two jobs are left to the app that it must not lose. The Settings screen has to show the address the DATABASE reports (ip_whoami), because an address looked up from a service in the browser can be a different one, and somebody would then arm the rule against the wrong address and shut the office out. And start-up has to ask ip_status, because a refused person's membership simply stops existing: every list comes back empty and the company picker goes short, with nothing anywhere on screen saying why.",
      run: function (src) {
        var problems = [];
        var scr = fnBody(src, "renderIpRules");
        if (!scr) return bad("renderIpRules is gone, so there is nowhere to set an address rule up");
        if (scr.indexOf('sb.rpc("ip_whoami")') < 0) problems.push("the screen no longer asks the database which address it sees (ip_whoami)");
        if (/fetch\s*\(/.test(scr)) problems.push("the screen reads an address from somewhere other than the database, which can differ from the one the rule compares");
        var st = fnBody(src, "ipStatus");
        if (!st || st.indexOf('sb.rpc("ip_status")') < 0) problems.push("ipStatus no longer asks the database who is refused");
        if (!/function renderIpBlocked\(/.test(src)) problems.push("the screen that tells a refused person why is gone");
        var bt = fnBody(src, "boot");
        if (!bt) problems.push("boot not found");
        else {
          if (!/ipStatus\(\)/.test(bt)) problems.push("start-up no longer asks whether this connection is allowed, so a refused person gets an empty app and no reason");
          if (!/renderIpBlocked\(/.test(bt)) problems.push("start-up no longer shows the refused screen");
        }
        return problems.length ? bad(problems.join("; ")) : ok("the rule is the database's; the screen reads ip_whoami and start-up reads ip_status");
      } },

    { name: "the access review reads the app map instead of a list of its own",
      why: "The access review answers 'is anything missing from what this person can do' by following work across two screens: raise a purchase order, then receive against it. If those steps named permission modules directly they would rot the first time a screen moved, which in this codebase has already happened twice (the Contracting split, and the document registers). So every step names a SCREEN, and the review turns it into a module through ACTION_MODULE and ACTION_APP at the moment it runs. A step naming a screen that no longer exists resolves to nothing and its rule vanishes silently, which is worse than a wrong answer: the page looks complete and is not.",
      run: function (src) {
        var chains = block(src, "ACCESS_CHAINS"), needs = block(src, "MONEY_NEEDS"), appr = block(src, "APPR_DOC_ACTION");
        if (!chains || !needs || !appr) return bad("ACCESS_CHAINS, MONEY_NEEDS or APPR_DOC_ACTION is gone, so the review no longer asks about missing access");
        var steps = uniq(all(chains, /\b(?:from|to):\s*"([a-zA-Z0-9_.]+)"/g)
          .concat(all(needs, /"([a-zA-Z0-9_.]+)"/g).filter(function (s) { return s.indexOf(".") > 0; }))
          .concat(all(appr, /:\s*"([a-zA-Z0-9_.]+)"/g)));
        if (steps.length < 10) return bad("only " + steps.length + " screen(s) named: the review's rules have been emptied out");
        var routed = routedActions(src);
        var dead = steps.filter(function (a) { return routed.indexOf(a) < 0 && !isDynamic(a); });
        if (dead.length) return bad("the access review names screen(s) that no longer exist: " + dead.join(", "));
        // ACTION_APP writes a key with a dot in quotes and one without a dot bare, so accept both
        var mapped = block(src, "ACTION_APP") + "\n" + block(src, "ACTION_MODULE");
        var lost = steps.filter(function (a) {
          var e = a.replace(/\./g, "\\.");
          return !new RegExp('(?:"' + e + '"|(?:^|[{,\\s])' + e + ')\\s*:', "m").test(mapped);
        });
        if (lost.length) return bad("screen(s) the review cannot turn into a permission module: " + lost.join(", "));
        var mods = all(block(src, "MONEY_SWITCHES"), /"([a-z]+)"/g);
        var ghost = missing(mods, all(block(src, "MODULE_CATALOG"), /key:\s*"([a-z]+)"/g));
        if (ghost.length) return bad("money switch(es) naming app(s) that do not exist: " + ghost.join(", "));
        var body = fnBody(src, "renderAccessReview");
        if (!body) return bad("renderAccessReview is gone");
        if (!/arMod\(/.test(body)) return bad("the review no longer resolves its screens through the app map, so its rules can no longer follow a screen that moves");
        var kinds = uniq(all(body, /\bq\("([a-z]+)",/g));
        var odd = kinds.filter(function (k) { return ["wide", "gap", "note"].indexOf(k) < 0; });
        if (odd.length) return bad("question kind(s) the page cannot count or colour: " + odd.join(", "));
        return ok(steps.length + " screens, " + kinds.length + " question kinds, all resolved through the app map");
      } },

    { name: "no em dash",
      why: "A standing house rule for all Orbit copy.",
      run: function (src, css, help) {
        // the character itself, and the entity or escape that draws the same thing on screen,
        // in the app and in every screen help file
        var text = src + "\n" + Object.keys(help || {}).map(function (k) { return help[k]; }).join("\n");
        var n = (text.match(/—|&mdash;|&#8212;|\\u2014/g) || []).length;
        return n ? bad(n + " em dash(es) present, as the character, &mdash; or &#8212;") : ok("none, as a character or an entity");
      } }
  ];

  function run(src, css, help) {
    return checks.map(function (c) {
      var r;
      try { r = c.run(src, css, help); } catch (e) { r = bad("check threw: " + e.message); }
      return { name: c.name, why: c.why, ok: r.ok, detail: r.detail };
    });
  }

  return { checks: checks, run: run };
});

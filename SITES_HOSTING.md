# Website module - going live (Cloudflare setup)

The code is done and deployed. Everything below is one-time Cloudflare config on the
`spacework.ai` zone. After it, every customer site is live at its own clean address.

## What already works (no setup needed)
- Build sites in **Orbit -> Website**: sites, pages, blocks, publish, form inbox.
- The renderer is live. Preview any published site at:
  `https://orbit.spacework.ai/site/?host=<slug>.sites.spacework.ai&path=/`
  (verified: the `algeco-demo` site renders fully).

## Step 1 - Wildcard subdomain (free addresses, `name.sites.spacework.ai`)
In Cloudflare **DNS** for `spacework.ai`, add a **proxied** record so the wildcard
resolves and Cloudflare answers it:
- Type `CNAME`, Name `*.sites`, Target `spacework.ai`, Proxy **ON** (orange cloud).
- Also add `CNAME  sites  ->  spacework.ai`, Proxy **ON** (this is the fallback origin).

## Step 2 - Deploy the site Worker
The Worker (`worker/`) serves those hostnames at their own root. From the repo:
```
cd worker
npx wrangler login
npx wrangler deploy
```
`wrangler.toml` already declares the routes `*.sites.spacework.ai/*` and
`sites.spacework.ai/*`. After deploy, `algeco-demo.sites.spacework.ai` serves the
site at its root (no `/site/` path). Subdomains are now fully live.

## Step 3 - Custom domains (customer's own domain, SSL auto)
Turn on **Cloudflare for SaaS** so customers can use their own domain with a cert
issued for *their* name (spacework.ai invisible to visitors):
1. Zone `spacework.ai` -> **SSL/TLS -> Custom Hostnames** -> enable, and set the
   **Fallback Origin** to `sites.spacework.ai` (the Worker serves it).
2. Create an **API token** (My Profile -> API Tokens) scoped to this zone with
   permission **SSL and Certificates: Edit** (and Zone: Read).
3. In the **orbit Pages project -> Settings -> Environment variables** add two
   encrypted vars used by `functions/site-domain`:
   - `CF_API_TOKEN` = the token from step 2
   - `CF_ZONE_ID`   = the `spacework.ai` zone id (Overview page, right sidebar)
4. Redeploy the Pages project (push any commit, or "Retry deployment").

Now in **Website -> a site -> Custom domain**: a customer types `www.theirbiz.com`,
Orbit registers it with Cloudflare, shows the CNAME to add at their registrar
(`www.theirbiz.com -> sites.spacework.ai`), and **Verify** flips it to Live once the
cert issues. Nothing of spacework.ai is visible on their site.

## Notes
- Supabase URL + anon key are baked into `functions/site/render-core.js` (public,
  RLS-safe). No secret lives in the Worker.
- To brand even the CNAME target, point custom hostnames at an unbranded domain you
  own instead of `sites.spacework.ai` and set that as the fallback origin.

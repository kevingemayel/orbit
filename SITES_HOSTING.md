# Website module - going live (Cloudflare setup)

Live progress + the exact remaining steps. Account `c40488d42e7e15a69ff7fdb4a39a0ac9`,
zone `spacework.ai`, **Zone ID `6774b0a25a80fcb62533be8056820d6b`** (public, = `CF_ZONE_ID`).

## DONE + verified
- **Step 1 - Wildcard DNS.** Two **proxied** CNAMEs on `spacework.ai`, live:
  - `*.sites`  -> `spacework.ai`  (Proxied)
  - `sites`    -> `spacework.ai`  (Proxied, the fallback-origin host)
- **Worker `orbit-sites` + real code DEPLOYED.** Verified: `orbit-sites.kevingemayel.workers.dev`
  returns the render-engine 404 page (not "Hello World"), so the engine is live on the Worker.
- **Worker routes.** Both bound to `orbit-sites` (added from the Worker's Domains tab):
  - `*.sites.spacework.ai/*`
  - `sites.spacework.ai/*`
  (Whole-zone `*.spacework.ai/*` was deliberately NOT created - it would hijack orbit/plot/www.)

## BLOCKER found: SSL for the nested wildcard
`slug.sites.spacework.ai` over HTTPS fails with `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`.
Cause: Cloudflare's **free Universal SSL covers `spacework.ai` + `*.spacework.ai` only (ONE
level)**, not the two-level `*.sites.spacework.ai`. Fix options:
- **Advanced Certificate Manager (~$10/mo/zone)** - order an advanced cert for
  `sites.spacework.ai` + `*.sites.spacework.ai`. Auto-renews, covers unlimited sub-sites.
  (SSL/TLS -> Edge Certificates -> Order an advanced certificate.) Recommended.
- **Free but manual:** get a Let's Encrypt `*.sites.spacework.ai` wildcard via DNS-01,
  Upload a custom certificate; re-upload every ~90 days.
- **Avoid it entirely:** don't offer free subdomains - use only customer custom domains
  (Cloudflare for SaaS issues their certs), reachable at a clean CNAME to `sites.spacework.ai`.

## REMAINING (need your browser / billing / a token - I don't do these)

### A. DONE - real code pasted into orbit-sites and deployed (verified on workers.dev).
Only the SSL blocker above stands between this and live HTTPS subdomains.

### B. Custom domains - Cloudflare for SaaS  (only needed for customer-owned domains)
1. Zone `spacework.ai` -> **SSL/TLS -> Custom Hostnames -> Enable Cloudflare for SaaS**.
   This now opens a **billing checkout**: it wants a billing address, Terms-of-Service
   acceptance, and card-on-file authorization (100 custom hostnames are free; you only
   pay past that). You have to complete this - it is a legal/billing step.
2. After activation, set the **Fallback Origin** to `sites.spacework.ai`.

### C. Wire the app's "Add custom domain" button to Cloudflare
In the **orbit Pages project -> Settings -> Environment variables**, add two encrypted
vars used by `functions/site-domain`:
- `CF_API_TOKEN` = an API token you create (My Profile -> API Tokens) scoped to zone
  `spacework.ai` with **SSL and Certificates: Edit** (+ Zone: Read). Paste it straight
  into the dashboard field - never through the assistant.
- `CF_ZONE_ID`   = `6774b0a25a80fcb62533be8056820d6b`
Then redeploy the Pages project (push any commit or "Retry deployment").

## What works after each step
- After **A**: free subdomains `slug.sites.spacework.ai` are fully live.
- After **B + C**: customers can add their own domain; cert issues for THEIR name; no
  spacework.ai shown to their visitors.

## Notes
- Supabase URL + anon key are baked into `render-core.js` (public, RLS-safe). No secret
  lives in the Worker itself.
- The renderer is already live for testing at
  `https://orbit.spacework.ai/site/?host=<slug>.sites.spacework.ai&path=/`.

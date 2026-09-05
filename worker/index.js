// Orbit Sites Worker - the production multi-tenant website host.
// Bound (in wrangler.toml) to *.sites.spacework.ai/* and, via Cloudflare for SaaS,
// to every customer custom domain. It reads the incoming Host header and serves the
// matching site at its own root, sharing the exact render engine the app previews with.
import { serveSite } from "../functions/site/render-core.js";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = (request.headers.get("host") || url.hostname || "").toLowerCase();
    // let Cloudflare's own ACME/HTTP validation for custom hostnames pass through untouched
    if (url.pathname.startsWith("/.well-known/")) return new Response("", { status: 404 });
    return serveSite(host, url.pathname, {});
  }
};

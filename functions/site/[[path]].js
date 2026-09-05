// Cloudflare Pages Function - website PREVIEW on the app origin.
// orbit.spacework.ai/site/?host=<slug>.sites.spacework.ai&path=/  ->  renders that site.
// Production traffic to real site hostnames is served by the dedicated Worker
// (worker/index.js), which shares the same render engine (functions/site/render-core.js).
import { serveSite } from "./render-core.js";

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const host = url.searchParams.get("host") || request.headers.get("host") || "";
  let path = url.searchParams.get("path");
  if (!path) { const seg = params && params.path ? (Array.isArray(params.path) ? params.path : [params.path]) : []; path = "/" + seg.join("/"); }
  return serveSite(host, path, {});
}

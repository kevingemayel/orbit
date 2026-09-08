// Cloudflare Pages Function  ->  /api/calendar/<token>.ics
//
// The address a person pastes into Google, Outlook or Apple Calendar. There is
// no session here on purpose: a calendar app subscribing to a URL cannot sign
// in, so the token in the path IS the authorisation. It is 24 random bytes,
// it is checked inside Postgres, and it can be rolled from inside Orbit.
//
// Nothing is written except the last-fetched stamp, and the RPC only ever
// returns the events belonging to that one token's owner.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";

function fold(line) {
  // iCalendar lines wrap at 75 octets, continued with a single leading space
  const out = [];
  let s = line;
  while (s.length > 73) { out.push(s.slice(0, 73)); s = " " + s.slice(73); }
  out.push(s);
  return out.join("\r\n");
}
function esc(v) {
  return String(v == null ? "" : v).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function stamp(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const raw = String(params.token || "");
  const token = raw.replace(/\.ics$/i, "");
  const supaUrl = env.SUPABASE_URL || SUPA;
  const anon = env.SUPABASE_ANON_KEY || ANON;

  if (!token || token.length < 20) return new Response("Not found", { status: 404 });

  let data = null;
  try {
    const r = await fetch(supaUrl + "/rest/v1/rpc/calendar_feed_events", {
      method: "POST",
      headers: { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token })
    });
    if (!r.ok) return new Response("Not found", { status: 404 });
    data = await r.json();
  } catch (e) {
    return new Response("Temporarily unavailable", { status: 503 });
  }
  if (!data || !Array.isArray(data.events)) return new Response("Not found", { status: 404 });

  const now = stamp(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Space Work//Orbit//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    fold("X-WR-CALNAME:" + esc(data.name || "Orbit")),
    "X-PUBLISHED-TTL:PT1H", "REFRESH-INTERVAL;VALUE=DURATION:PT1H"
  ];
  for (const e of data.events) {
    const s = stamp(e.starts_at), en = stamp(e.ends_at);
    if (!s || !en) continue;
    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + esc(e.uid) + "@orbit.spacework.ai");
    lines.push("DTSTAMP:" + now);
    lines.push("DTSTART:" + s);
    lines.push("DTEND:" + en);
    lines.push(fold("SUMMARY:" + esc(e.title || "Busy")));
    if (e.location) lines.push(fold("LOCATION:" + esc(e.location)));
    if (e.descr) lines.push(fold("DESCRIPTION:" + esc(e.descr)));
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="orbit.ics"',
      "Cache-Control": "public, max-age=900"
    }
  });
}

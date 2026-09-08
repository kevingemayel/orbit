// Cloudflare Pages Function  ->  /api/calendar-pull
//
// The other direction. Every hour the database scheduler calls this with the
// shared secret; it fetches each person's own secret iCalendar address from
// Google or Outlook, reads when they are busy, and hands the blocks back to
// Postgres. Orbit then knows not to book a job over the dentist.
//
// Only the times are kept. The title is stored to make the calendar readable,
// nothing else: no attendees, no description, no location. A private
// appointment stays private.
//
// The fetch has to happen here rather than in the browser because a calendar
// provider serves no CORS headers, and rather than in Postgres because parsing
// iCalendar in SQL would be worse than this.
const SUPA = "https://hlkwzbkgkwywomuvilwe.supabase.co";
const ANON = "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW";
const VERSION = "calendar-pull-v1";
const MAX_BYTES = 3_000_000;

export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, version: VERSION }), { headers: { "Content-Type": "application/json" } });
}

// ---- the smallest iCalendar reader that is actually correct ----------------
function unfold(text) {
  // a continuation line starts with a space or tab and belongs to the one above
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}
function icsDate(v, tzid) {
  // 20260908T143000Z | 20260908T143000 | 20260908
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, hh, mi, ss, z] = m;
  if (!hh) return { iso: `${y}-${mo}-${d}T00:00:00Z`, allDay: true };
  // A floating time (no Z, no TZID we can resolve) is read as UTC. It shifts a
  // block by the offset at worst; inventing a timezone would be worse.
  void tzid;
  return { iso: `${y}-${mo}-${d}T${hh}:${mi}:${ss}${z ? "Z" : "Z"}`, allDay: false };
}
function parseIcs(text, limit) {
  const out = [];
  const lines = unfold(text).split("\n");
  let cur = null;
  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) { cur = {}; continue; }
    if (line.startsWith("END:VEVENT")) {
      if (cur && cur.start && cur.end) {
        out.push({
          uid: (cur.uid || "").slice(0, 200) || (cur.start + "-" + cur.end),
          title: (cur.summary || "Busy").slice(0, 140),
          starts_at: cur.start, ends_at: cur.end, all_day: !!cur.allDay
        });
      }
      cur = null;
      if (out.length >= limit) break;
      continue;
    }
    if (!cur) continue;
    const c = line.indexOf(":");
    if (c < 0) continue;
    const nameAndParams = line.slice(0, c), value = line.slice(c + 1);
    const name = nameAndParams.split(";")[0].toUpperCase();
    if (name === "UID") cur.uid = value.trim();
    else if (name === "SUMMARY") cur.summary = value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").trim();
    else if (name === "DTSTART") { const p = icsDate(value); if (p) { cur.start = p.iso; cur.allDay = p.allDay; } }
    else if (name === "DTEND") { const p = icsDate(value); if (p) cur.end = p.iso; }
    else if (name === "DURATION" && cur.start && !cur.end) {
      const d = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(value.trim());
      if (d) {
        const ms = (+(d[1] || 0) * 86400 + +(d[2] || 0) * 3600 + +(d[3] || 0) * 60) * 1000;
        cur.end = new Date(new Date(cur.start).getTime() + (ms || 3600000)).toISOString();
      }
    }
  }
  return out;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const H = { "Content-Type": "application/json" };
  const json = (o, s) => new Response(JSON.stringify(o), { status: s || 200, headers: H });
  const secret = (request.headers.get("x-cron-secret") || "").trim();
  if (!secret) return json({ error: "missing secret" }, 401);

  const supaUrl = env.SUPABASE_URL || SUPA;
  const anon = env.SUPABASE_ANON_KEY || ANON;
  const hdr = { apikey: anon, Authorization: "Bearer " + anon, "Content-Type": "application/json" };

  async function rpc(name, body, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 12000);
    try {
      const r = await fetch(supaUrl + "/rest/v1/rpc/" + name, { method: "POST", headers: hdr, body: JSON.stringify(body), signal: c.signal });
      return { ok: r.ok, data: await r.json().catch(() => null) };
    } finally { clearTimeout(t); }
  }

  const due = await rpc("due_calendar_pulls", { p_secret: secret });
  if (!due.ok) return json({ error: "could not load feeds", detail: due.data }, 200);
  const feeds = Array.isArray(due.data) ? due.data : [];
  if (!feeds.length) return json({ ok: true, feeds: 0 });

  let synced = 0, failed = 0, events = 0;
  for (const f of feeds) {
    let url = String(f.url || "").trim();
    if (url.startsWith("webcal://")) url = "https://" + url.slice(9);
    // only a plain public https address; nothing internal, nothing on our own host
    if (!/^https:\/\//i.test(url)) {
      await rpc("calendar_busy_upsert", { p_secret: secret, p_feed: f.id, p_events: [], p_error: "The address must start with https://" });
      failed++; continue;
    }
    try {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), 15000);
      const r = await fetch(url, { headers: { Accept: "text/calendar,*/*" }, redirect: "follow", signal: c.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error("The calendar address returned " + r.status);
      const text = (await r.text()).slice(0, MAX_BYTES);
      if (text.indexOf("BEGIN:VCALENDAR") < 0) throw new Error("That address did not return a calendar");
      const parsed = parseIcs(text, 800);
      const up = await rpc("calendar_busy_upsert", { p_secret: secret, p_feed: f.id, p_events: parsed });
      if (!up.ok) throw new Error("Could not store the events");
      synced++; events += parsed.length;
    } catch (e) {
      await rpc("calendar_busy_upsert", { p_secret: secret, p_feed: f.id, p_events: [], p_error: (e && e.message) || "Could not read that calendar" });
      failed++;
    }
  }
  return json({ ok: true, feeds: feeds.length, synced, failed, events });
}

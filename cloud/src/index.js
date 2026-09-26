// Sky Garden cloud saves.
// Each player has a private sync key made by the game. We never store the key itself,
// only a SHA-256 hash of it, so the database alone can't be used to load someone's garden.
//
// GET  /load?key=KEY            -> { updated, save } or 404
// POST /save  { key, updated, save }  -> { ok, updated } (older saves are refused with 409)

const ALLOWED = ['https://tupeloghost.github.io', 'http://localhost:9011'];
const MAX_SAVE = 200_000; // bytes; a full late-game save is about 10 KB
const KEY_RE = /^[A-Za-z0-9]{24,64}$/;

function cors(origin) {
  const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });
}
async function hashKey(key) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });

    if (request.method === 'GET' && url.pathname === '/load') {
      const key = url.searchParams.get('key') || '';
      if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, origin);
      const row = await env.DB.prepare('SELECT updated, data FROM saves WHERE id = ?').bind(await hashKey(key)).first();
      if (!row) return json({ error: 'not found' }, 404, origin);
      return json({ updated: row.updated, save: JSON.parse(row.data) }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/save') {
      const text = await request.text();
      if (text.length > MAX_SAVE) return json({ error: 'too big' }, 413, origin);
      let body; try { body = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400, origin); }
      const { key, updated, save } = body || {};
      if (!KEY_RE.test(key || '') || !Number.isFinite(updated) || typeof save !== 'object' || save === null) return json({ error: 'bad request' }, 400, origin);
      const id = await hashKey(key), data = JSON.stringify(save);
      // Only write if this save is newer than what is stored, so an old device can't overwrite progress.
      const res = await env.DB.prepare(
        'INSERT INTO saves (id, updated, data) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET updated = excluded.updated, data = excluded.data WHERE excluded.updated > saves.updated'
      ).bind(id, updated, data).run();
      if (!res.meta.changes) return json({ error: 'older than cloud save' }, 409, origin);
      return json({ ok: true, updated }, 200, origin);
    }

    return json({ error: 'not found' }, 404, origin);
  },
};

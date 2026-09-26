// Sky Garden cloud saves.
// Each player has a private sync key made by the game. We never store the key itself,
// only a SHA-256 hash of it, so the database alone can't be used to load someone's garden.
//
// GET  /load?key=KEY            -> { updated, save } or 404
// POST /save  { key, updated, save }  -> { ok, updated } (older saves are refused with 409)
// POST /feedback { mood, text, where, day, player } -> { ok }   (playtest notes)
// GET  /visit?code=FRIEND          -> a friend's public island (no private data)
// POST /gift   { key, code, kind: 'gift'|'water', item } -> one of each per friend per day
// GET  /inbox?key=KEY              -> gifts and waterings waiting for you (marks them delivered)
// POST /contribute { key, goal, n } and GET /community?goal=ID   (shared community goals)

const ALLOWED = ['https://tupeloghost.github.io', 'http://localhost:9011'];
const MAX_SAVE = 200_000; // bytes; a full late-game save is about 10 KB
const KEY_RE = /^[A-Za-z0-9]{24,64}$/;
const CODE_RE = /^[A-F0-9]{6}$/;
const GOAL_RE = /^[a-z0-9-]{3,40}$/;
const ITEM_RE = /^[a-z]{2,20}$/;
// what a visitor is allowed to see of someone's island
const PUBLIC = ['name','look','mode','tiles','placed','roof','wall','bigGarden','bridge','bridge2','quest','q2','q3','q4','q5','built','sprinklers','boulder','relics','aha'];
const friendCode = id => id.slice(0, 6).toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);
const cleanName = n => String(n || '').replace(/[^\p{L}\p{N} '._-]/gu, '').trim().slice(0, 16) || 'A friend';

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
        'INSERT INTO saves (id, updated, data, created, code) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(id) DO UPDATE SET updated = excluded.updated, data = excluded.data, code = excluded.code WHERE excluded.updated > saves.updated'
      ).bind(id, updated, data, Date.now(), friendCode(id)).run();
      if (!res.meta.changes) return json({ error: 'older than cloud save' }, 409, origin);
      return json({ ok: true, updated }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/feedback') {
      const text = await request.text();
      if (text.length > 6000) return json({ error: 'too big' }, 413, origin);
      let b; try { b = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400, origin); }
      const mood = ['love','okay','confused','bored'].includes(b.mood) ? b.mood : null;
      const note = String(b.text || '').slice(0, 2000).trim();
      if (!mood && !note) return json({ error: 'empty' }, 400, origin);
      const player = KEY_RE.test(b.player || '') ? (await hashKey(b.player)).slice(0, 12) : null;
      await env.DB.prepare('INSERT INTO feedback (at, player, mood, note, place, day) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
        .bind(Date.now(), player, mood, note, String(b.where || '').slice(0, 200), Number.isFinite(b.day) ? b.day : null).run();
      return json({ ok: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/visit') {
      const code = (url.searchParams.get('code') || '').toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: 'bad code' }, 400, origin);
      const row = await env.DB.prepare('SELECT data FROM saves WHERE code = ?').bind(code).first();
      if (!row) return json({ error: 'not found' }, 404, origin);
      const full = JSON.parse(row.data), pub = {};
      PUBLIC.forEach(k => { if (full[k] !== undefined) pub[k] = full[k]; });
      pub.name = full.ageBand === 'kid' ? 'A young gardener' : cleanName(full.name); // kids' names stay private
      return json({ island: pub }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/gift') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const code = String(b.code || '').toUpperCase(), kind = b.kind === 'water' ? 'water' : 'gift';
      if (!KEY_RE.test(b.key || '') || !CODE_RE.test(code) || (kind === 'gift' && !ITEM_RE.test(b.item || ''))) return json({ error: 'bad request' }, 400, origin);
      const from = await hashKey(b.key), to = await env.DB.prepare('SELECT id FROM saves WHERE code = ?').bind(code).first();
      if (!to) return json({ error: 'not found' }, 404, origin);
      if (to.id === from) return json({ error: 'that is you' }, 400, origin);
      const me = await env.DB.prepare('SELECT data FROM saves WHERE id = ?').bind(from).first();
      const meData = me ? JSON.parse(me.data) : {};
      const fromName = meData.ageBand === 'kid' ? 'A young gardener' : cleanName(meData.name);
      const res = await env.DB.prepare('INSERT OR IGNORE INTO gifts (to_id, from_id, from_name, kind, item, day, at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
        .bind(to.id, from, fromName, kind, kind === 'gift' ? b.item : null, today(), Date.now()).run();
      if (!res.meta.changes) return json({ error: 'already today' }, 409, origin);
      return json({ ok: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/inbox') {
      const key = url.searchParams.get('key') || '';
      if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, origin);
      const id = await hashKey(key);
      const { results } = await env.DB.prepare('SELECT id, from_name, kind, item FROM gifts WHERE to_id = ? AND claimed = 0 ORDER BY at LIMIT 50').bind(id).all();
      if (results.length) await env.DB.prepare(`UPDATE gifts SET claimed = 1 WHERE id IN (${results.map(() => '?').join(',')})`).bind(...results.map(r => r.id)).run();
      return json({ items: results.map(r => ({ from: r.from_name, kind: r.kind, item: r.item })) }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/contribute') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const n = Math.max(0, Math.min(50, Math.floor(Number(b.n) || 0)));
      if (!KEY_RE.test(b.key || '') || !GOAL_RE.test(b.goal || '') || !n) return json({ error: 'bad request' }, 400, origin);
      await env.DB.prepare('INSERT INTO community (goal, count) VALUES (?1, ?2) ON CONFLICT(goal) DO UPDATE SET count = count + excluded.count').bind(b.goal, n).run();
      const row = await env.DB.prepare('SELECT count FROM community WHERE goal = ?').bind(b.goal).first();
      return json({ ok: true, count: row.count }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/community') {
      const goal = url.searchParams.get('goal') || '';
      if (!GOAL_RE.test(goal)) return json({ error: 'bad goal' }, 400, origin);
      const row = await env.DB.prepare('SELECT count FROM community WHERE goal = ?').bind(goal).first();
      return json({ goal, count: row ? row.count : 0 }, 200, origin);
    }

    return json({ error: 'not found' }, 404, origin);
  },
};

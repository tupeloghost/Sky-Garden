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
// POST /brand { key, shop, logo }  and GET /brand?code=FRIEND     (a player's shop name and logo)
// POST /list { key, item, qty, price | wantItem+wantQty, product? } -> put something up at the trading post
// GET  /market                     -> newest open listings from everyone, with shop names and logos
// GET  /shop?code=FRIEND           -> one player's shop: their brand and open listings
// POST /buy { key, id }            -> buy a listing (the seller is paid through /inbox)
// POST /unlist { key, id }         -> take your own listing down

const ALLOWED = ['https://tupeloghost.github.io', 'http://localhost:9011'];
const MAX_SAVE = 200_000; // bytes; a full late-game save is about 10 KB
const KEY_RE = /^[A-Za-z0-9]{24,64}$/;
const CODE_RE = /^[A-F0-9]{6}$/;
const GOAL_RE = /^[a-z0-9-]{3,40}$/;
const ITEM_RE = /^[a-z]{2,20}$/;
// what a visitor is allowed to see of someone's island
const PUBLIC = ['specialty','expand','builds','home','name','look','mode','tiles','placed','roof','wall','bigGarden','bridge','bridge2','quest','q2','q3','q4','q5','built','sprinklers','boulder','relics','aha'];
const friendCode = id => id.slice(0, 6).toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);
// kids pick shop names from these words only, so no personal info can be typed
const KID_ADJ = ['Sunny','Cozy','Happy','Little','Starry','Breezy','Golden','Mossy','Rosy','Misty','Bright','Merry'];
const KID_NOUN = ['Garden','Nook','Workshop','Corner','Market','Studio','Meadow','Cottage','Lantern','Harbor','Orchard','Den'];
const SHAPES = ['circle','shield','star','heart','leaf','diamond'], PATTERNS = ['plain','stripes','dots','waves','checks','flowers'];
const BASES = ['pot','basket','jam','tea','candy','soup','crisp','saltfish'];
const cleanText = (t, n) => String(t || '').replace(/[^\p{L}\p{N} '&.!-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, n);
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi ? v : null;
function cleanLogo(l) { l = l || {}; return { shape:SHAPES.includes(l.shape) ? l.shape : 'circle', bg:int(l.bg, 0, 0xffffff) ?? 0xffc857, fg:int(l.fg, 0, 0xffffff) ?? 0x3b2f4a,
  sym:typeof l.sym === 'string' && [...l.sym].length <= 2 ? l.sym : '', letters:String(l.letters || '').replace(/[^A-Z]/g, '').slice(0, 2) }; }
function cleanProduct(p, kid) { if (!p || !BASES.includes(p.base)) return null;
  const name = kid ? (KID_ADJ.includes(String(p.name).split(' ')[0]) ? cleanText(p.name, 30) : 'Handmade') : cleanText(p.name, 30) || 'Handmade';
  return { base:p.base, name, color:int(p.color, 0, 0xffffff) ?? 0xffc857, color2:int(p.color2, 0, 0xffffff) ?? 0xffffff, pattern:PATTERNS.includes(p.pattern) ? p.pattern : 'plain' }; }
async function whoAmI(env, key) { const id = await hashKey(key); const row = await env.DB.prepare('SELECT data FROM saves WHERE id = ?').bind(id).first();
  const d = row ? JSON.parse(row.data) : {}; return { id, kid:d.ageBand === 'kid' || !d.birthday || !d.birthday.y, name:d.ageBand === 'kid' ? 'A young gardener' : cleanName(d.name) }; }
const listingOut = r => ({ id:r.id, code:r.code, item:r.item, qty:r.qty, product:r.product ? JSON.parse(r.product) : null, price:r.price, wantItem:r.want_item, wantQty:r.want_qty,
  shop:r.shop || null, logo:r.logo ? JSON.parse(r.logo) : null, created:r.created });
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
      // trading post sales waiting to be paid out to this seller
      const sold = (await env.DB.prepare("SELECT * FROM listings WHERE seller_id = ? AND status = 'sold' AND paid = 0 LIMIT 50").bind(id).all()).results;
      if (sold.length) await env.DB.prepare(`UPDATE listings SET paid = 1 WHERE id IN (${sold.map(() => '?').join(',')})`).bind(...sold.map(r => r.id)).run();
      return json({ items: [...results.map(r => ({ from: r.from_name, kind: r.kind, item: r.item })),
        ...sold.map(r => ({ kind:'sale', from:r.buyer_name, ...listingOut(r) }))] }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/brand') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      if (!KEY_RE.test(b.key || '')) return json({ error: 'bad request' }, 400, origin);
      const me = await whoAmI(env, b.key);
      let shop = cleanText(b.shop, 24);
      if (me.kid) { const [a, n] = shop.split(' '); if (!KID_ADJ.includes(a) || !KID_NOUN.includes(n) || shop.split(' ').length !== 2) shop = 'Sunny Workshop'; }
      if (!shop) return json({ error: 'no name' }, 400, origin);
      await env.DB.prepare('INSERT INTO brands (id, code, shop, logo, updated) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(id) DO UPDATE SET shop = excluded.shop, logo = excluded.logo, updated = excluded.updated')
        .bind(me.id, friendCode(me.id), shop, JSON.stringify(cleanLogo(b.logo)), Date.now()).run();
      return json({ ok: true, shop }, 200, origin);
    }

    if (request.method === 'GET' && (url.pathname === '/brand' || url.pathname === '/shop')) {
      const code = (url.searchParams.get('code') || '').toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: 'bad code' }, 400, origin);
      const br = await env.DB.prepare('SELECT shop, logo FROM brands WHERE code = ?').bind(code).first();
      const brand = br ? { code, shop:br.shop, logo:JSON.parse(br.logo) } : null;
      if (url.pathname === '/brand') return json({ brand }, 200, origin);
      const { results } = await env.DB.prepare("SELECT l.*, b.shop, b.logo FROM listings l LEFT JOIN brands b ON b.id = l.seller_id WHERE l.code = ? AND l.status = 'open' ORDER BY l.created DESC LIMIT 20").bind(code).all();
      return json({ brand, listings: results.map(listingOut) }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/market') {
      const { results } = await env.DB.prepare("SELECT l.*, b.shop, b.logo FROM listings l LEFT JOIN brands b ON b.id = l.seller_id WHERE l.status = 'open' ORDER BY l.created DESC LIMIT 40").all();
      return json({ listings: results.map(listingOut) }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/list') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      if (!KEY_RE.test(b.key || '') || !ITEM_RE.test(b.item || '')) return json({ error: 'bad request' }, 400, origin);
      const me = await whoAmI(env, b.key), qty = int(b.qty, 1, 99), price = b.price == null ? null : int(b.price, 1, 99999);
      const wantItem = b.wantItem && ITEM_RE.test(b.wantItem) ? b.wantItem : null, wantQty = wantItem ? int(b.wantQty, 1, 99) : null;
      if (!qty || (price == null) === (wantItem == null) || (wantItem && !wantQty)) return json({ error: 'bad offer' }, 400, origin);
      const product = b.product ? cleanProduct(b.product, me.kid) : null; if (b.product && !product) return json({ error: 'bad product' }, 400, origin);
      const open = await env.DB.prepare("SELECT COUNT(*) AS n FROM listings WHERE seller_id = ? AND status = 'open'").bind(me.id).first();
      if (open.n >= 8) return json({ error: 'too many' }, 409, origin);
      const res = await env.DB.prepare('INSERT INTO listings (seller_id, code, item, qty, product, price, want_item, want_qty, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)')
        .bind(me.id, friendCode(me.id), b.item, qty, product ? JSON.stringify(product) : null, price, wantItem, wantQty, Date.now()).run();
      return json({ ok: true, id: res.meta.last_row_id }, 200, origin);
    }

    if (request.method === 'POST' && (url.pathname === '/buy' || url.pathname === '/unlist')) {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const lid = int(b.id, 1, 1e12); if (!KEY_RE.test(b.key || '') || !lid) return json({ error: 'bad request' }, 400, origin);
      const me = await whoAmI(env, b.key), row = await env.DB.prepare('SELECT * FROM listings WHERE id = ?').bind(lid).first();
      if (!row || row.status !== 'open') return json({ error: 'gone' }, 409, origin);
      if (url.pathname === '/unlist') {
        if (row.seller_id !== me.id) return json({ error: 'not yours' }, 403, origin);
        const r = await env.DB.prepare("UPDATE listings SET status = 'closed' WHERE id = ? AND status = 'open'").bind(lid).run();
        return r.meta.changes ? json({ ok: true, listing: listingOut(row) }, 200, origin) : json({ error: 'gone' }, 409, origin);
      }
      if (row.seller_id === me.id) return json({ error: 'that is yours' }, 400, origin);
      const r = await env.DB.prepare("UPDATE listings SET status = 'sold', buyer_id = ?1, buyer_name = ?2 WHERE id = ?3 AND status = 'open'").bind(me.id, me.name, lid).run();
      if (!r.meta.changes) return json({ error: 'gone' }, 409, origin);
      return json({ ok: true, listing: listingOut(row) }, 200, origin);
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

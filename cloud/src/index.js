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
// POST /redeem { key, code }      -> use a Founding Gardener tester code (one player per code)
// GET  /founders                   -> names on the Founding Gardeners wall (only players who said yes)
// POST /bug { msg, stack, where, day, player, ver }  -> automatic error reports from the game
// GET  /polls?key=KEY  and  POST /vote { key, poll, choice }  -> Town Hall voting, one vote per player per poll
// GET  /admin (Authorization: Bearer SECRET) -> the private dashboard data (needs the ADMIN_TOKEN secret)
// GET  /me?key=KEY                 -> your founder status and trust level (1 founder, 2 keeper, 3 elder keeper)
// POST /event { key, kind, detail } -> activity history (missions, trials, shared reflections)
// POST /propose { key, kind, payload } -> keepers suggest world changes; nothing shows until approved
// GET  /world                       -> approved world changes everyone sees
// POST /admin/act (Bearer)          -> set levels, pause privileges, revoke, approve proposals, start council polls
// POST /report { key, code, listing?, reason } -> report a shop; 3 different reporters hide it until reviewed
// Some founder-only features live in private/extras.js, which is kept out of the public repo.

import * as EXTRA from '../private/extras.js';

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
// --- word filter for shop and product names ---
// Whole-word matches (short words that also appear inside innocent words, like "class" or "Scunthorpe").
const BAD_WORDS = ['ass','arse','dick','cock','cum','fag','fags','homo','hoe','hoes','jap','kike','kys','nazi','nazis','piss','porn','pussy','rape','sex','sexy','slut','spic','tit','tits','twat','wank','whore','kill','nude','nudes','boob','boobs','penis','vagina','hitler','kkk','meth','weed','drugs'];
// Anywhere inside a word (these never appear in innocent words, except the ones allowed below).
const BAD_PARTS = ['fuck','fuk','shit','bitch','cunt','nigg','faggot','retard','bastard','asshole','dildo','blowjob','jizz','rapist','pedo','molest','suicide','killyourself','terrorist','whore','porn'];
const ALLOW = ['scunthorpe','therapist','therapists','pedometer','pedometers','shiitake','shitake','cocktail','cocktails','cumin','cucumber','cucumbers','peacock','hancock','dickens','sussex','essex','bassoon','titmouse'];
function badName(t) {
  const low = String(t || '').toLowerCase(), norm = low.replace(/[0@4]/g, m => ({ '0':'o', '@':'a', '4':'a' }[m])).replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[5$]/g, 's').replace(/7/g, 't');
  if (/https?|www|\.com|\.net|\.org|\.gg|\.io|discord|snapchat|insta|tiktok|telegram|whatsapp/.test(low)) return true; // no links or contact apps
  if (/\d{5,}/.test(low.replace(/[\s.()-]/g, ''))) return true; // no phone numbers
  const toks = norm.split(/[^a-z]+/).filter(Boolean), words = [];
  for (let i = 0; i < toks.length; i++) { // spaced-out letters like "f u c k" count as one word
    if (toks[i].length === 1) { let j = i, w = ''; while (j < toks.length && toks[j].length === 1) w += toks[j++]; if (w.length > 1) { words.push(w); i = j - 1; continue; } }
    words.push(toks[i]); }
  const dd = w => w.replace(/(.)\1+/g, '$1');
  return words.some(w => !ALLOW.includes(w) && (BAD_WORDS.includes(w) || BAD_WORDS.includes(dd(w)) || BAD_PARTS.some(b => w.includes(b) || dd(w).includes(dd(b)))));
}
const cleanText = (t, n) => String(t || '').replace(/[^\p{L}\p{N} '&.!-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, n);
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi ? v : null;
function cleanLogo(l) { l = l || {}; return { shape:SHAPES.includes(l.shape) ? l.shape : 'circle', bg:int(l.bg, 0, 0xffffff) ?? 0xffc857, fg:int(l.fg, 0, 0xffffff) ?? 0x3b2f4a,
  sym:typeof l.sym === 'string' && [...l.sym].length <= 2 ? l.sym : '', letters:String(l.letters || '').replace(/[^A-Z]/g, '').slice(0, 2) }; }
function cleanProduct(p, kid) { if (!p || !BASES.includes(p.base)) return null;
  const name = kid ? (KID_ADJ.includes(String(p.name).split(' ')[0]) ? cleanText(p.name, 30) : 'Handmade') : cleanText(p.name, 30) || 'Handmade';
  return { base:p.base, name, color:int(p.color, 0, 0xffffff) ?? 0xffc857, color2:int(p.color2, 0, 0xffffff) ?? 0xffffff, pattern:PATTERNS.includes(p.pattern) ? p.pattern : 'plain' }; }
async function whoAmI(env, key) { const id = await hashKey(key); const row = await env.DB.prepare('SELECT data FROM saves WHERE id = ?').bind(id).first();
  const d = row ? JSON.parse(row.data) : {}; return { id, kid:d.ageBand === 'kid' || !d.birthday || !d.birthday.y, name:d.ageBand === 'kid' ? 'A young gardener' : cleanName(d.name) }; }
const TESTER_RE = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
async function memberOf(env, key) { if (!KEY_RE.test(key || '')) return null; const id = await hashKey(key);
  let r = await env.DB.prepare('SELECT * FROM tester_codes WHERE used_by = ?').bind(id).first();
  // a code can also be linked to extra games of the same person (added from the dashboard's database, never by players)
  if (!r) r = await env.DB.prepare('SELECT t.* FROM code_keys k JOIN tester_codes t ON t.code = k.code WHERE k.key = ?').bind(id).first();
  return r ? { id, code:r.code, level:r.level, paused:JSON.parse(r.paused || '[]'), revoked:!!r.revoked, myth:r.myth || null, row:r } : { id, code:null, level:0, paused:[], revoked:false, myth:null, row:null }; }
async function logEvent(env, m, kind, detail) { try { await env.DB.prepare('INSERT INTO events (at, player, code, kind, detail) VALUES (?1, ?2, ?3, ?4, ?5)').bind(Date.now(), m ? m.id.slice(0, 12) : null, m ? m.code : null, kind, String(detail || '').slice(0, 1000)).run(); } catch {} }
const audienceOk = (a, lvl) => a === 'all' || (a === 'keepers' && lvl >= 2) || (a === 'elders' && lvl >= 3);
const MYTHS = ['simurgh','ziz','ibis'];
// who a creator mission is for: everyone, a tier, or one founder by code
const missionFor = (aud, m) => aud === 'founders' || audienceOk(aud, m.level) || aud === 'code:' + m.code;
async function addMission(env, b) { const aud = String(b.audience || 'founders'); if (!(['founders','keepers','elders'].includes(aud) || /^code:SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(aud))) return 'bad audience';
  const title = cleanText(b.title, 80), how = cleanText(b.how, 240); if (!title) return 'needs a title';
  await env.DB.prepare('INSERT INTO cmissions (created, audience, title, how, reward) VALUES (?1, ?2, ?3, ?4, ?5)').bind(Date.now(), aud, title, how, int(b.reward, 0, 500) ?? 50).run(); return null; }
const listingOut = r => ({ founder:!!r.founder, id:r.id, code:r.code, item:r.item, qty:r.qty, product:r.product ? JSON.parse(r.product) : null, price:r.price, wantItem:r.want_item, wantQty:r.want_qty,
  shop:r.shop || null, logo:r.logo ? JSON.parse(r.logo) : null, created:r.created });
const cleanName = n => String(n || '').replace(/[^\p{L}\p{N} '._-]/gu, '').trim().slice(0, 16) || 'A friend';

function cors(origin) {
  const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Vary': 'Origin' };
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
    const H = { json, cors, origin, memberOf, logEvent, hashKey, int, cleanText, cleanName, badName, today, KEY_RE, TESTER_RE, addMission, audienceOk };
    { const r = await EXTRA.handle(request, url, env, H); if (r) return r; }

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
      { const m = await memberOf(env, b.player); if (m && m.code) await logEvent(env, m, 'feedback', `${mood || ''} ${note.slice(0, 120)}`); }
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
      if (badName(shop)) return json({ error: 'not allowed' }, 400, origin);
      await env.DB.prepare('INSERT INTO brands (id, code, shop, logo, updated) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(id) DO UPDATE SET shop = excluded.shop, logo = excluded.logo, updated = excluded.updated')
        .bind(me.id, friendCode(me.id), shop, JSON.stringify(cleanLogo(b.logo)), Date.now()).run();
      return json({ ok: true, shop }, 200, origin);
    }

    if (request.method === 'GET' && (url.pathname === '/brand' || url.pathname === '/shop')) {
      const code = (url.searchParams.get('code') || '').toUpperCase();
      if (!CODE_RE.test(code)) return json({ error: 'bad code' }, 400, origin);
      const br = await env.DB.prepare('SELECT shop, logo, hidden FROM brands WHERE code = ?').bind(code).first();
      if (br && br.hidden) return json(url.pathname === '/brand' ? { brand:null } : { brand:null, listings:[] }, 200, origin);
      const brand = br ? { code, shop:br.shop, logo:JSON.parse(br.logo) } : null;
      if (url.pathname === '/brand') return json({ brand }, 200, origin);
      const { results } = await env.DB.prepare("SELECT l.*, b.shop, b.logo, (SELECT 1 FROM tester_codes t WHERE t.used_by = l.seller_id) AS founder FROM listings l LEFT JOIN brands b ON b.id = l.seller_id WHERE l.code = ? AND l.status = 'open' ORDER BY l.created DESC LIMIT 20").bind(code).all();
      return json({ brand, listings: results.map(listingOut) }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/market') {
      const { results } = await env.DB.prepare("SELECT l.*, b.shop, b.logo, (SELECT 1 FROM tester_codes t WHERE t.used_by = l.seller_id) AS founder FROM listings l LEFT JOIN brands b ON b.id = l.seller_id WHERE l.status = 'open' AND COALESCE(b.hidden, 0) = 0 ORDER BY l.created DESC LIMIT 40").all();
      return json({ listings: results.map(listingOut) }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/list') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      if (!KEY_RE.test(b.key || '') || !ITEM_RE.test(b.item || '')) return json({ error: 'bad request' }, 400, origin);
      const me = await whoAmI(env, b.key), qty = int(b.qty, 1, 99), price = b.price == null ? null : int(b.price, 1, 99999);
      const wantItem = b.wantItem && ITEM_RE.test(b.wantItem) ? b.wantItem : null, wantQty = wantItem ? int(b.wantQty, 1, 99) : null;
      if (!qty || (price == null) === (wantItem == null) || (wantItem && !wantQty)) return json({ error: 'bad offer' }, 400, origin);
      const product = b.product ? cleanProduct(b.product, me.kid) : null; if (b.product && !product) return json({ error: 'bad product' }, 400, origin);
      if (product && badName(product.name)) return json({ error: 'not allowed' }, 400, origin);
      const hid = await env.DB.prepare('SELECT hidden FROM brands WHERE id = ?').bind(me.id).first(); if (hid && hid.hidden) return json({ error: 'shop paused' }, 403, origin);
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

    if (request.method === 'POST' && url.pathname === '/redeem') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const code = String(b.code || '').toUpperCase().trim();
      if (!KEY_RE.test(b.key || '') || !TESTER_RE.test(code)) return json({ error: 'bad code' }, 400, origin);
      const me = await hashKey(b.key), row = await env.DB.prepare('SELECT used_by FROM tester_codes WHERE code = ?').bind(code).first();
      if (!row) return json({ error: 'not found' }, 404, origin);
      if (row.used_by && row.used_by !== me && !(await env.DB.prepare('SELECT 1 FROM code_keys WHERE key = ?1 AND code = ?2').bind(me, code).first())) return json({ error: 'used' }, 409, origin);
      { const mine = await env.DB.prepare('SELECT code FROM tester_codes WHERE used_by = ?').bind(me).first(); if (mine && mine.code !== code) return json({ error: 'has a code' }, 409, origin); } // one founder code per player
      if (!row.used_by) { await env.DB.prepare('UPDATE tester_codes SET used_by = ?1, used_at = ?2 WHERE code = ?3 AND used_by IS NULL').bind(me, Date.now(), code).run(); await logEvent(env, { id:me, code }, 'joined', 'Used their founder code'); }
      return json({ ok: true, founder: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/founders') {
      const { results } = await env.DB.prepare('SELECT s.data FROM tester_codes t JOIN saves s ON s.id = t.used_by ORDER BY t.used_at').all();
      const names = results.map(r => { try { return JSON.parse(r.data); } catch { return null; } }).filter(d => d && d.creditWall)
        .map(d => d.ageBand === 'kid' ? 'A young gardener' : cleanName(d.name));
      return json({ names }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/bug') {
      const text = await request.text(); if (text.length > 8000) return json({ error: 'too big' }, 413, origin);
      let b; try { b = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400, origin); }
      const player = KEY_RE.test(b.player || '') ? (await hashKey(b.player)).slice(0, 12) : null;
      await env.DB.prepare('INSERT INTO bugs (at, player, msg, stack, place, day, ver) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
        .bind(Date.now(), player, String(b.msg || '').slice(0, 300), String(b.stack || '').slice(0, 1500), String(b.where || '').slice(0, 200), Number.isFinite(b.day) ? b.day : null, String(b.ver || '').slice(0, 20)).run();
      return json({ ok: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/polls') {
      const key = url.searchParams.get('key') || '', me = KEY_RE.test(key) ? await hashKey(key) : null;
      const mm = KEY_RE.test(key) ? await memberOf(env, key) : null, lvl = mm && !mm.revoked ? mm.level : 0;
      const { results: rawPolls } = await env.DB.prepare('SELECT * FROM polls WHERE open = 1 ORDER BY created DESC LIMIT 6').all();
      const results = rawPolls.filter(p => audienceOk(p.audience || 'all', lvl));
      const polls = [];
      for (const p of results) { const opts = JSON.parse(p.options);
        const counts = (await env.DB.prepare('SELECT choice, COUNT(*) AS n FROM votes WHERE poll = ? GROUP BY choice').bind(p.id).all()).results;
        const mine = me ? await env.DB.prepare('SELECT choice FROM votes WHERE poll = ? AND voter = ?').bind(p.id, me).first() : null;
        polls.push({ id:p.id, audience:p.audience || 'all', question:p.question, options:opts, counts:opts.map((_, i) => (counts.find(c => c.choice === i) || {}).n || 0), mine: mine ? mine.choice : null }); }
      return json({ polls }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/vote') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      if (!KEY_RE.test(b.key || '')) return json({ error: 'bad request' }, 400, origin);
      const poll = await env.DB.prepare('SELECT options, audience FROM polls WHERE id = ? AND open = 1').bind(int(b.poll, 1, 1e9)).first();
      if (!poll) return json({ error: 'closed' }, 404, origin);
      { const m = await memberOf(env, b.key); const lvl = m && !m.revoked ? m.level : 0; if (!audienceOk(poll.audience || 'all', lvl) || (m && m.paused.includes('vote'))) return json({ error: 'not allowed' }, 403, origin); }
      const choice = int(b.choice, 0, JSON.parse(poll.options).length - 1); if (choice == null) return json({ error: 'bad choice' }, 400, origin);
      const r = await env.DB.prepare('INSERT OR IGNORE INTO votes (poll, voter, choice, at) VALUES (?1, ?2, ?3, ?4)').bind(b.poll, await hashKey(b.key), choice, Date.now()).run();
      if (!r.meta.changes) return json({ error: 'already voted' }, 409, origin);
      { const m = await memberOf(env, b.key); if (m && m.code) await logEvent(env, m, 'vote', `Poll ${b.poll}: ${JSON.parse(poll.options)[choice]}`); }
      return json({ ok: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/admin') {
      if (!env.ADMIN_TOKEN || (request.headers.get('Authorization') || '') !== 'Bearer ' + env.ADMIN_TOKEN) return json({ error: 'no' }, 403, origin);
      const all = async (q, ...a) => (await env.DB.prepare(q).bind(...a).all()).results;
      const players = await all(`SELECT id, created, updated, json_extract(data,'$.name') AS name, json_extract(data,'$.quest') AS q1, json_extract(data,'$.q2') AS q2, json_extract(data,'$.q3') AS q3, json_extract(data,'$.q4') AS q4, json_extract(data,'$.q5') AS q5,
        json_extract(data,'$.day') AS day, json_extract(data,'$.home') AS home, json_extract(data,'$.founder.code') AS founder, json_extract(data,'$.missions') AS missions, json_array_length(json_extract(data,'$.playDates')) AS playdays FROM saves ORDER BY updated DESC LIMIT 200`);
      const founders = await all('SELECT t.code, t.label, t.used_at, t.level, t.paused, t.revoked, t.myth, (SELECT COUNT(*) FROM blessings b JOIN sightings s ON s.id = b.sighting WHERE s.code = t.code) AS seen, json_extract(s.data,\'$.name\') AS name FROM tester_codes t LEFT JOIN saves s ON s.id = t.used_by ORDER BY t.created');
      const feedback = await all('SELECT at, player, mood, note, place, day FROM feedback ORDER BY at DESC LIMIT 60');
      const bugs = await all('SELECT msg, COUNT(*) AS n, MAX(at) AS last, MAX(place) AS place, MAX(stack) AS stack FROM bugs GROUP BY msg ORDER BY last DESC LIMIT 40');
      const polls = await all('SELECT p.id, p.question, p.options, p.open, p.audience, (SELECT json_group_array(json_object(\'c\', choice, \'n\', n)) FROM (SELECT choice, COUNT(*) AS n FROM votes v WHERE v.poll = p.id GROUP BY choice)) AS counts FROM polls p ORDER BY p.created DESC LIMIT 10');
      const events = await all('SELECT at, code, kind, detail FROM events ORDER BY at DESC LIMIT 300');
      const proposals = await all('SELECT id, code, kind, payload, status, created, decided FROM proposals ORDER BY created DESC LIMIT 80');
      const cmissions = await all('SELECT c.id, c.audience, c.title, c.how, c.reward, c.active, c.created, (SELECT json_group_array(json_object(\'code\', d.code, \'note\', d.note, \'at\', d.at)) FROM cmission_done d WHERE d.mission = c.id) AS done FROM cmissions c ORDER BY c.created DESC LIMIT 40');
      const extra = await EXTRA.admin(env, H);
      return json({ now:Date.now(), extra, cmissions, events, proposals, players:players.map(p => ({ ...p, id:p.id.slice(0, 12) })), founders, feedback, bugs, polls }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/me') {
      const m = await memberOf(env, url.searchParams.get('key') || ''); if (!m) return json({ error: 'bad key' }, 400, origin);
      const out = { founder: !!m.code && !m.revoked, code: m.code || null, level: m.revoked ? 0 : m.level, paused: m.paused, revoked: m.revoked };
      if (m.code && !m.revoked) {
        // a founder only ever learns about their own form, never anyone else's
        out.myth = m.myth; if (m.myth) out.seen = (await env.DB.prepare('SELECT COUNT(*) AS n FROM blessings b JOIN sightings s ON s.id = b.sighting WHERE s.code = ?').bind(m.code).first()).n;
        const { results } = await env.DB.prepare('SELECT id, audience, title, how, reward FROM cmissions WHERE active = 1 AND id NOT IN (SELECT mission FROM cmission_done WHERE code = ?) ORDER BY created DESC LIMIT 20').bind(m.code).all();
        out.missions = results.filter(x => missionFor(x.audience, m)).map(({ audience, ...x }) => x);
        Object.assign(out, await EXTRA.me(env, m, H));
      }
      return json(out, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/appear') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const m = await memberOf(env, b.key); if (!m || !m.code || m.revoked || !m.myth || m.paused.includes('myth')) return json({ error: 'no' }, 403, origin);
      const target = b.to ? await EXTRA.target(env, m, b.to) : null;
      const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM sightings WHERE code = ?1 AND day = ?2 AND target IS ?3').bind(m.code, today(), target).first()).n;
      if (n >= 1) return json({ error: 'already today' }, 409, origin);
      await env.DB.prepare('INSERT INTO sightings (at, code, form, day, target) VALUES (?1, ?2, ?3, ?4, ?5)').bind(Date.now(), m.code, m.myth, today(), target).run();
      await logEvent(env, m, 'appear', `Sent their ${m.myth} out into the sky`); return json({ ok: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/sighting') {
      // anyone can glimpse a legend, but the answer never says whose it was
      const key = url.searchParams.get('key') || ''; if (!KEY_RE.test(key)) return json({ error: 'bad key' }, 400, origin);
      const m = await memberOf(env, key);
      const r = await env.DB.prepare('SELECT id, form FROM sightings WHERE at > ?1 AND code IS NOT ?2 AND target IS NULL AND id NOT IN (SELECT sighting FROM blessings WHERE player = ?3) ORDER BY RANDOM() LIMIT 1').bind(Date.now() - 3 * 864e5, m.code, m.id).first();
      return json({ sighting: r ? { id:r.id, form:r.form } : null }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/bless') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      if (!KEY_RE.test(b.key || '')) return json({ error: 'bad key' }, 400, origin);
      const s = await env.DB.prepare('SELECT id, code, form FROM sightings WHERE id = ?').bind(int(b.id, 1, 1e9)).first(); if (!s) return json({ error: 'gone' }, 404, origin);
      const me = await hashKey(b.key); const r = await env.DB.prepare('INSERT OR IGNORE INTO blessings (sighting, player, at) VALUES (?1, ?2, ?3)').bind(s.id, me, Date.now()).run();
      if (r.meta.changes) await logEvent(env, { id:me, code:s.code }, 'blessed', `Their ${s.form} was seen and blessed a player`);
      return json({ ok: true }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/mission-done') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const m = await memberOf(env, b.key); if (!m || !m.code || m.revoked) return json({ error: 'no' }, 403, origin);
      const x = await env.DB.prepare('SELECT id, title, audience FROM cmissions WHERE id = ? AND active = 1').bind(int(b.id, 1, 1e9)).first(); if (!x || !missionFor(x.audience, m)) return json({ error: 'no' }, 404, origin);
      const r = await env.DB.prepare('INSERT OR IGNORE INTO cmission_done (mission, code, at, note) VALUES (?1, ?2, ?3, ?4)').bind(x.id, m.code, Date.now(), String(b.note || '').slice(0, 500)).run();
      if (r.meta.changes) await logEvent(env, m, 'cmission', `${x.title}${b.note ? ': ' + String(b.note).slice(0, 300) : ''}`); return json({ ok: true }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/event') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const kinds = ['mission','trial','reflection','keeperstep','secretgift','mythpower','mythpath','mythfirst'];
      if (!kinds.includes(b.kind)) return json({ error: 'bad kind' }, 400, origin);
      const m = await memberOf(env, b.key); if (!m || !m.code) return json({ error: 'not a founder' }, 403, origin);
      await logEvent(env, m, b.kind, String(b.detail || '').slice(0, 1000)); return json({ ok: true }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/propose') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const m = await memberOf(env, b.key); if (!m || !m.code || m.revoked || m.level < 2) return json({ error: 'not a keeper' }, 403, origin);
      if (m.paused.includes('propose')) return json({ error: 'paused' }, 403, origin);
      const kind = ['placename','landmark'].includes(b.kind) ? b.kind : null; if (!kind) return json({ error: 'bad kind' }, 400, origin);
      let payload = {};
      if (kind === 'placename') { const name = cleanText(b.payload && b.payload.name, 24); if (!name || badName(name)) return json({ error: 'not allowed' }, 400, origin); payload = { name }; }
      if (kind === 'landmark') { const t = ['fountain','sundial','belltower','stonecircle'].includes(b.payload && b.payload.type) ? b.payload.type : null; if (!t) return json({ error: 'bad landmark' }, 400, origin);
        payload = { type:t, color:int(b.payload.color, 0, 0xffffff) ?? 0xffc857, color2:int(b.payload.color2, 0, 0xffffff) ?? 0xffffff }; }
      const open = await env.DB.prepare("SELECT COUNT(*) AS n FROM proposals WHERE code = ? AND status = 'pending'").bind(m.code).first();
      if (open.n >= 3) return json({ error: 'too many' }, 409, origin);
      await env.DB.prepare('INSERT INTO proposals (code, kind, payload, created) VALUES (?1, ?2, ?3, ?4)').bind(m.code, kind, JSON.stringify(payload), Date.now()).run();
      await logEvent(env, m, 'propose', `${kind}: ${JSON.stringify(payload)}`); return json({ ok: true }, 200, origin);
    }

    if (request.method === 'GET' && url.pathname === '/world') {
      const { results } = await env.DB.prepare("SELECT kind, payload FROM proposals WHERE status = 'approved' ORDER BY decided DESC").all();
      const world = {}; results.forEach(r => { if (!world[r.kind]) world[r.kind] = JSON.parse(r.payload); });
      return json({ world }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/admin/act') {
      if (!env.ADMIN_TOKEN || (request.headers.get('Authorization') || '') !== 'Bearer ' + env.ADMIN_TOKEN) return json({ error: 'no' }, 403, origin);
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const code = String(b.code || '');
      if (b.action === 'level') await env.DB.prepare('UPDATE tester_codes SET level = ? WHERE code = ?').bind(int(b.value, 1, 4) || 1, code).run();
      else if (b.action === 'paused') await env.DB.prepare('UPDATE tester_codes SET paused = ? WHERE code = ?').bind(JSON.stringify((b.value || []).filter(x => ['propose','vote','missions','testisland','myth'].includes(x))), code).run();
      else if (b.action === 'revoke') await env.DB.prepare('UPDATE tester_codes SET revoked = ? WHERE code = ?').bind(b.value ? 1 : 0, code).run();
      else if (await EXTRA.adminAct(env, b, H)) { /* handled privately */ }
      else if (b.action === 'myth') await env.DB.prepare('UPDATE tester_codes SET myth = ? WHERE code = ?').bind(MYTHS.includes(b.value) ? b.value : null, code).run();
      else if (b.action === 'mission') { const err = await addMission(env, b); if (err) return json({ error: err }, 400, origin); }
      else if (b.action === 'missionoff') await env.DB.prepare('UPDATE cmissions SET active = 0 WHERE id = ?').bind(int(b.id, 1, 1e9)).run();
      else if (b.action === 'decide') await env.DB.prepare('UPDATE proposals SET status = ?, decided = ? WHERE id = ?').bind(b.value === 'approved' ? 'approved' : 'rejected', Date.now(), int(b.id, 1, 1e9)).run();
      else if (b.action === 'poll') { const opts = (b.options || []).map(o => cleanText(o, 80)).filter(Boolean).slice(0, 6); const aud = ['all','keepers','elders'].includes(b.audience) ? b.audience : 'all';
        if (!b.question || opts.length < 2) return json({ error: 'need a question and 2 options' }, 400, origin);
        await env.DB.prepare('UPDATE polls SET open = 0 WHERE audience = ?').bind(aud).run();
        await env.DB.prepare('INSERT INTO polls (question, options, audience, created) VALUES (?1, ?2, ?3, ?4)').bind(cleanText(b.question, 120), JSON.stringify(opts), aud, Date.now()).run(); }
      else return json({ error: 'bad action' }, 400, origin);
      return json({ ok: true }, 200, origin);
    }

    if (request.method === 'POST' && url.pathname === '/report') {
      let b; try { b = JSON.parse(await request.text()); } catch { return json({ error: 'bad json' }, 400, origin); }
      const code = String(b.code || '').toUpperCase(), reason = ['rude','personal','other'].includes(b.reason) ? b.reason : 'other';
      if (!KEY_RE.test(b.key || '') || !CODE_RE.test(code)) return json({ error: 'bad request' }, 400, origin);
      const me = await hashKey(b.key); if (friendCode(me) === code) return json({ error: 'that is you' }, 400, origin);
      { const m = await memberOf(env, b.key); if (m && m.code) await logEvent(env, m, 'report', `Reported ${code}: ${reason}`); }
      await env.DB.prepare('INSERT OR IGNORE INTO reports (reporter, code, listing, reason, at) VALUES (?1, ?2, ?3, ?4, ?5)').bind(me, code, int(b.listing, 1, 1e12), reason, Date.now()).run();
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE code = ? AND reviewed = 0').bind(code).first();
      if (n.n >= 3) await env.DB.prepare('UPDATE brands SET hidden = 1 WHERE code = ?').bind(code).run(); // paused until a person reviews it
      return json({ ok: true }, 200, origin);
    }

    return json({ error: 'not found' }, 404, origin);
  },
};

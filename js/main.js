import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HOWTO, QUEST5, BUILDINGS, GRANDMA_LETTER2, MUTE_KEY, SEASONS, CROPS, ITEMS, FURN, LOVES, BRIDGE2_COST, BRIDGE_COST, DAY_LEN, SAVE_KEY, NEIGHBORS, AHA, RECALL, AHA_ORDER, RELICS, LAYERS, QUESTIONS, QUEST3, QUEST4, ROOFS, WALLS, PAINT_PRICE, QUEST1, QUEST2, CHIMES } from '../data/content.js';
import { CONSTELLATIONS } from '../data/stars.js';
import { FINDS } from '../data/finds.js';
import { FISH } from '../data/fish.js';
import { KNOWHOW } from '../data/knowhow.js';
import { icon } from '../data/icons.js';
import { FEATURES } from '../data/features.js';
import { ROLLOUT } from '../data/rollout.js';
import { DILEMMAS, islandFeel, PATHS } from '../data/journey.js';
import { EXPANSIONS, RECLAIM_FACT } from '../data/expand.js';
import { SHIP_PATHS, HEADINGS, WAYFINDING, FLOATING } from '../data/ship.js';
import { MISSIONS, FOUNDER_GIFTS } from '../data/founders.js';
import { COMPANIONS, KID_PET_NAMES, BALLOON_FACT } from '../data/companions.js';
import { MENTOR, TRIALS, LANDMARKS } from '../data/keepers.js';
import { KID_ADJ, KID_NOUN, SHAPES, PATTERNS, SYMBOLS, PALETTE, BASES, logoSvg, productSwatch, hx, MARK_LESSON, DESIGN_LESSON } from '../data/market.js';
import { BUTTERFLIES, TAP_FACTS } from '../data/nature.js';
import { INSECTS } from '../data/insects.js';
import { TASTES, REACT, TIERS, TIER_HEARTS, tasteOf } from '../data/tastes.js';
import { SPECIES, NAMES, OUTFITS, TOP_COLORS, PERSONALITIES, REQUEST_LINES } from '../data/visitors.js';
import { SPECIALTIES, HOME_PRICE, AWAY_MULT, TRADE_FACT, heirloomOf, heirloomId, codeOfHeirloom, isHeirloom } from '../data/trade.js';
import * as VERSIONDATA from './version.js'; // the version number, stamped on every commit
const VERSION = VERSIONDATA.VERSION || { n:0, date:'' };
import * as MYTHDATA from '../data/myths.js'; // read as a whole, so an older cached copy can never stop the game from starting
const MYTHS = MYTHDATA.MYTHS || {}, SHROOM_FINDS = MYTHDATA.FINDS || ['It glows softly.'], DEV_CONTENT = MYTHDATA.DEV_CONTENT || { path:'', legend:[], power:{ name:'Power', text:'' }, missions:[], reflect:['?'], learn:['?'] }, glowName = MYTHDATA.glowName || (n => `Level ${n + 1}`);
import { EYE_COLORS, EYE_STYLES, BROWS, FACE_EXTRAS, TOPS, SHOES, SHOE_COLORS, FOUNDER_HATS, SKIN, HAIR_STYLES, HAIR_COLORS, SHIRTS, BOTTOMS, BOTTOM_COLORS, HATS, HAT_COLORS, DEFAULT_LOOK, MODES } from '../data/player.js';
import { realSeason, moonPhase, activeFestival, dateLabel, FESTIVAL_AHA, FESTIVALS, festivalWindow } from '../data/calendar.js';
import { VILLAGERS, VILLAGER_LOVES, VILLAGER_LOOK, RECIPES, BOOKS, XYLO, XYLO_NAMES, PENTA, SONGS, PENTA_AHA, SAYINGS } from '../data/village.js';
Object.assign(NEIGHBORS, VILLAGERS); Object.assign(LOVES, VILLAGER_LOVES);
RECIPES.forEach(r => ITEMS[r.id] = { name:r.name, sell:r.sell, kind:'dish' });
Object.assign(AHA, FESTIVAL_AHA);
import { MEM_ART } from '../data/memart.js';
Object.keys(MEM_ART).forEach(k => { if (AHA[k]) Object.assign(AHA[k], MEM_ART[k]); }); // pictures and hooks for the Memory cards
INSECTS.forEach(b => ITEMS[b.id] = { name:b.name, sell:b.sell, kind:'bug' }); BUTTERFLIES.forEach(b => ITEMS[b.id] = { name:b.name, sell:50, kind:'bug' });
SPECIALTIES.forEach(sp => { ITEMS[sp.id] = { name:sp.name, sell:HOME_PRICE, kind:'specialty' }; FINDS[sp.id] = { fact:sp.fact, hint:'Every island grows 1 specialty. Trade with friends to get the others.' }; });
// heirloom flowers are named after the island they came from, so register any we hold
const registerHeirloom = id => { if (isHeirloom(id) && !ITEMS[id]) ITEMS[id] = { name:heirloomOf(codeOfHeirloom(id)).name, sell:60, kind:'heirloom' }; return id; };
for (const id of Object.keys(FESTIVAL_AHA)) if (!AHA_ORDER.includes(id)) AHA_ORDER.push(id);


// ============ STATE ============
const fresh = () => ({ day:1, t:0, coins:40, seeds:{ cloudberry:4, sunbell:0, skywheat:0, moonpumpkin:0, frostmint:0, kale:0 }, bag:{},
  tiles:Array.from({length:9},()=>({s:0})), sel:'cloudberry', hearts:{ nana:0, pip:0, drizzle:0, twins:0, lumen:0, mabel:0, hoot:0, allegra:0, sage:0 }, talked:{}, gifted:{}, scenes:[],
  bridge:false, pos:[0,0,2], where:'home', quest:0, aha:[], relics:0, digs:[], asked:-1, qi:0, letter:false,
  order:null, furn:{}, placed:Array(10).fill(null), q2:0, potDay:-1, fruit:{}, q3:0, bridge2:false, sprinklers:false, used:[], bigGarden:false, boulder:false, south:false, lastSeason:null, fests:{}, q5:0, tut:0, home:0, builds:[], stations:{}, bronzeKnown:false, tools:{}, pickups:[], chopped:{}, created:false, birthday:null, startedAt:null, lastParty:null, partyHat:false, name:'', look:null, mode:null, built:[], charted:[], cooked:[], read:[], songs:[], penta:false, sayings:[], builtDay:{}, q4:0, goals:null, paints:['0xff8fa3','0xfff1d6'], roof:'0xff8fa3', wall:'0xfff1d6' });
// testers can switch to a separate Test island; it has its own save and never touches the cloud
const PROFILE = (() => { try { return localStorage.getItem('sg.profile') || 'main'; } catch { return 'main'; } })();
const TESTSLOT = PROFILE === 'test';
// testers can keep extra save files, like separate games. An extra file lives on this device only: it never backs up to the cloud.
const FILE = /^f[234]$/.test(PROFILE) ? PROFILE : null;
const SLOT = TESTSLOT ? 'sg.save.test' : FILE ? 'sg.save.' + FILE : SAVE_KEY;
const SIDE = TESTSLOT || !!FILE; // not the first save file
// the Creator can preview what one founder sees, on the test island only
const PREVIEW = (() => { if (!TESTSLOT) return null; try { return JSON.parse(localStorage.getItem('sg.preview') || 'null'); } catch { return null; } })();
if (TESTSLOT) document.body.classList.add('testisland');
let S;
try {
  const saved = JSON.parse(localStorage.getItem(SLOT)) || {};
  const f = fresh();
  S = { ...f, ...saved, seeds:{ ...f.seeds, ...(saved.seeds||{}) }, hearts:{ ...f.hearts, ...(saved.hearts||{}) } };
  if (saved.letter && saved.tut === undefined) S.tut = 9;
  if (saved.letter && saved.home === undefined) S.home = 3; // players from before building keep their finished hut
  if (saved.letter && saved.created === undefined) S.created = true;
  if (S.look && !S.look.human) S.look = { ...DEFAULT_LOOK, hat:S.look.hat || 'none', hatColor:S.look.hatColor || DEFAULT_LOOK.hatColor };
  if (saved.crops) { for (const k in saved.crops) if (saved.crops[k]) S.bag[k] = (S.bag[k]||0) + saved.crops[k]; delete S.crops; }
  if (S.quest >= 5 && !saved.q2) S.q2 = S.q2 || 0;
  if (S.pos.length === 2) S.pos = [S.pos[0], 0, S.pos[1]];
} catch { S = fresh(); }
// --- cloud sync: each garden has a private sync key and backs itself up to the Sky Garden cloud ---
const CLOUD = 'https://sky-garden-saves.tupeloghost.workers.dev';
// automatic bug reports: if something breaks, the error and where the player was go to the cloud (never from developer mode or a local preview)
{ const sent = new Set(); const report = (msg, stack) => { try {
    if (sent.size >= 5 || sent.has(msg) || localStorage.getItem('sg.dev') === 'true' || /^(localhost|127\.)/.test(location.hostname)) return; sent.add(msg);
    const q = document.getElementById('quest'), where = q ? q.innerText.replace(/\s+/g, ' ').slice(0, 180) : '';
    fetch(`${CLOUD}/bug`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ msg:String(msg).slice(0, 300), stack:String(stack || '').slice(0, 1500), where, day:typeof S !== 'undefined' && S ? S.day : null, player:typeof S !== 'undefined' && S ? S.syncKey : null, ver:String(VERSION.n) }) }).catch(() => {});
  } catch {} };
  addEventListener('error', e => report(e.message, e.error && e.error.stack));
  addEventListener('unhandledrejection', e => report('Promise: ' + (e.reason && e.reason.message || e.reason), e.reason && e.reason.stack)); }
const KEY_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I, easy to type
const newSyncKey = () => [...crypto.getRandomValues(new Uint8Array(24))].map(b => KEY_ABC[b % 32]).join('');
const prettyKey = k => k.match(/.{1,4}/g).join('-');
const cleanKey = k => (k || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
if (!S.syncKey) S.syncKey = newSyncKey();
{ const dk = new Date().toISOString().slice(0, 10); S.playDates = S.playDates || [];
  if (!S.playDates.length && S.day > 1) { // testers who played before rolling unlocks keep everything they already use
    S.unlocked = [S.goals && 'goals', (S.builds || []).some(b => b.p === 'chest') && 'chest', (S.bugs || []).length && 'butterflies', S.tools?.bag1 && 'bagup', S.stations?.kiln && 'pottery', S.stations?.furnace && 'bronze'].filter(Boolean); }
  if (!/[?&]visit=/.test(location.search) && !S.playDates.includes(dk)) { S.playDates.push(dk); S.playDates = S.playDates.slice(-60); S.newDay = true; } }
if (!S.specialty) S.specialty = SPECIALTIES[Math.floor(Math.random() * SPECIALTIES.length)].id;
[...Object.keys(S.bag || {}), ...Object.keys(S.chest || {})].forEach(registerHeirloom);
let cloudDirty = true, lastPush = 0, cloudState = { when:0, ok:null };
let setupCam = false; // camera close-up while making your character
// saving also records where you stand, so inside/outside always matches after a reload
const save = () => { if (VISIT) return; S.savedAt = Date.now(); try { if (!lying && !fish3) S.pos = [player.position.x, player.position.y, player.position.z]; } catch {} if (typeof ageBand === 'function') S.ageBand = ageBand(); cloudDirty = true; try { localStorage.setItem(SLOT, JSON.stringify(S)); } catch {} };
// is a feature switched on? live for everyone, or switched on in developer mode
const devFeatures = () => { try { return JSON.parse(localStorage.getItem('sg.features') || '{}'); } catch { return {}; } };
function featureOn(id) { const f = FEATURES.find(x => x.id === id), d = devOn() ? devFeatures() : {};
  if (f && !f.live && (!devOn() || d[id] === false)) return false; // not released yet
  return devOn() || unlockedToday(id); }
// rolling unlocks: count the real days this player has opened the game
function unlockedToday(id) { const r = ROLLOUT.find(x => x.id === id); return !r || (S.unlocked || []).includes(id) || playDays() >= r.day; }
const playDays = () => (S.playDates || []).length + (S.bonusDays || 0);
// developer mode only works for the Creator (checked with the server) or on a local test copy
// On the live site, the Creator's test island is her developer profile and her real island stays a normal player's.
const LOCALDEV = /^(localhost|127\.)/.test(location.hostname);
const DEV_OK = (() => { if (LOCALDEV) return true; try { return sessionStorage.getItem('sg.devok') === '1'; } catch { return false; } })();
if (location.hash === '#dev') { try { localStorage.setItem('sg.dev', 'true'); } catch {} }
const devFlag = () => { try { return localStorage.getItem('sg.dev') === 'true'; } catch { return false; } };
const devOn = () => devFlag() || (DEV_OK && !LOCALDEV && TESTSLOT); // #dev in the address turns it on; the Creator's test island has it on by itself
// the real island's key, even while on the test island (the Creator's tools are tied to it)
const mainKey = () => { if (!SIDE) return S.syncKey; try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}').syncKey || S.syncKey; } catch { return S.syncKey; } };
async function cloudPush(force) {
  if (devOn() || VISIT || SIDE) return; // developer mode, visits, the test island and extra save files never touch the cloud
  if (!cloudDirty || (!force && Date.now() - lastPush < 60000)) return;
  lastPush = Date.now(); cloudDirty = false;
  try {
    const r = await fetch(`${CLOUD}/save`, { method:'POST', headers:{ 'Content-Type':'application/json' }, keepalive:true,
      body: JSON.stringify({ key:S.syncKey, updated:S.savedAt || Date.now(), save:S }) });
    cloudState = { when:Date.now(), ok: r.ok || r.status === 409 };
    communitySend();
  } catch { cloudDirty = true; cloudState = { when:Date.now(), ok:false }; }
}
async function cloudLoad(key) {
  const r = await fetch(`${CLOUD}/load?key=${encodeURIComponent(key)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('cloud error');
  return r.json();
}
addEventListener('visibilitychange', () => { if (document.hidden) cloudPush(true); });
const VISIT_CODE = (new URLSearchParams(location.search).get('visit') || '').toUpperCase();
let VISIT = null, mine = null;
if (/^[A-F0-9]{6}$/.test(VISIT_CODE)) {
  try { const r = await fetch(`${CLOUD}/visit?code=${VISIT_CODE}`); if (r.ok) VISIT = (await r.json()).island; } catch {}
  if (VISIT) {
    mine = S;
    S = { ...fresh(), ...VISIT, letter:true, tut:9, created:true, where:'home', pos:[-1.2, 0, .8], t:mine.t, day:mine.day, south:mine.south,
      syncKey:mine.syncKey, look:mine.look, coins:mine.coins, bag:mine.bag, aha:VISIT.aha || [], used:[], found:[], goals:null };
  }
}
const saveMine = () => { mine.savedAt = Date.now(); try { localStorage.setItem(SLOT, JSON.stringify(mine)); } catch {} };
const friendCodeOf = async key => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))].map(b => b.toString(16).padStart(2,'0')).join('').slice(0,6).toUpperCase();
let muted = false; try { muted = localStorage.getItem(MUTE_KEY) === 'true'; } catch {}
var VOL = { music:.7, sfx:.7, nature:.7 }; try { Object.assign(VOL, JSON.parse(localStorage.getItem('sg.vol') || '{}')); } catch {} /* each player's own volume, kept on this device */
function volGain(k) { return Math.pow(Math.max(0, Math.min(1, VOL[k])) / .7, 2); }
// The world follows the real calendar: real seasons, tonight's real moon, festivals on their real dates.
let dateOverride = null; // for testing only
const today = () => dateOverride ? new Date(dateOverride) : new Date();
const season = () => realSeason(today(), S.south);
const festival = () => activeFestival(today());
const isFestival = () => !!festival();
const moon = () => moonPhase(today());
const hour = () => 6 + S.t*18;
const bagAdd = (k, n=1) => { S.bag[k] = (S.bag[k]||0) + n; if (S.bag[k] <= 0) delete S.bag[k]; if (n > 0) noteFind(k); };
if (!S.found) S.found = [...new Set([...Object.keys(S.bag), ...Object.keys(S.furn || {}), ...(S.cooked || [])])];

// ============ SCENE ============
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbfe3ff, 30, 75);
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 250);
const hemi = new THREE.HemisphereLight(0xffffff, 0xb9a7d9, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 1.6);
sun.castShadow = true; sun.shadow.mapSize.set(1024,1024);
let lowGfx = false; try { lowGfx = localStorage.getItem('sg.lowgfx') === 'true'; } catch {}
function setLowGfx(on) {
  lowGfx = on; try { localStorage.setItem('sg.lowgfx', on); } catch {}
  renderer.setPixelRatio(on ? 1 : Math.min(2, devicePixelRatio)); sun.castShadow = !on;
  if (typeof tufts !== 'undefined') tufts.visible = !on && season() !== 3;
}
Object.assign(sun.shadow.camera, { left:-14, right:14, top:14, bottom:-14 });
scene.add(sun); scene.add(sun.target);

// --- art style: a = original, b = diorama (cel shading + outlines), c = storybook (soft, pastel, paper grain) ---
const LOOK = 'a'; // the original chunky toy look (the diorama and storybook tests were retired); clear any old test choice
try { localStorage.removeItem('sg.look'); } catch {}
const makeRamp = (steps, lo) => { const d = new Uint8Array(steps); for (let i=0;i<steps;i++) d[i] = Math.round(255 * (lo + (1-lo) * i/(steps-1))); const t = new THREE.DataTexture(d, steps, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; };
const RAMP = LOOK === 'b' ? makeRamp(3, .5) : LOOK === 'c' ? makeRamp(5, .62) : null;
const CREAM = new THREE.Color(0xfff4e6);
const tint = c => LOOK === 'c' ? new THREE.Color(c).lerp(CREAM, .16) : new THREE.Color(c);
const NO_OUTLINE = { visible:false };
const mat = (c, o={}) => { if (!RAMP) return new THREE.MeshStandardMaterial({ color:c, roughness:.85, ...o }); const { roughness, metalness, ...rest } = o; return new THREE.MeshToonMaterial({ color:tint(c), gradientMap:RAMP, ...rest }); };
const glow = (c) => { const m = new THREE.MeshBasicMaterial({ color:c }); m.userData.outlineParameters = NO_OUTLINE; return m; };
// things you can tap that do something small: deco(obj, fn) makes obj tappable, fn runs when you get there
const decos = [], pulsers = new Set(); let gardenFenceMat = null;
function applyFenceColor() { if (gardenFenceMat && S.fenceColor != null) gardenFenceMat.color.set(S.fenceColor); }
function pulse(h, amt) { if (h.userData.base == null) h.userData.base = h.scale.x; h.userData.pulse = amt; pulsers.add(h); }
const deco = (o, use) => { o.userData.kind = 'deco'; o.userData.use = use; decos.push(o); return o; };
const hitBox = (w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible:false })); return m; };
const mesh = (g, m, x=0, y=0, z=0) => { const o = new THREE.Mesh(g, m); o.position.set(x,y,z); o.castShadow = o.receiveShadow = true; return o; };
const sph = (r) => new THREE.SphereGeometry(r, 24, 16);
const walkables = [];
// a soft round glow, drawn once and reused by everything that shines
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.35,'rgba(255,255,255,.45)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
function halo(color, size, opacity = .8, additive = true) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ userData:{ outlineParameters:NO_OUTLINE }, map:haloTex, color, transparent:true, opacity, depthWrite:false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  sp.scale.setScalar(size); return sp;
}

// small painted textures: white with darker marks, so any paint color shows through them
const texBase = {};
function tx(kind, rx = 1, ry = 1) {
  if (!texBase[kind]) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); let sd = kind.length * 7919 + 13; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256);
    const strands = (n, dark, light) => { for (let i = 0; i < n; i++) { const x = R() * 256, y = R() * 300 - 40, l = 20 + R() * 60; g.strokeStyle = R() < .6 ? `rgba(70,42,18,${dark * (.5 + R())})` : `rgba(255,255,255,${light})`; g.lineWidth = .8 + R() * 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 6, y + l); g.stroke(); } };
    if (kind === 'straw') { strands(2200, .2, .55); const gr = g.createLinearGradient(0, 0, 0, 70); gr.addColorStop(0, 'rgba(60,35,15,.4)'); gr.addColorStop(1, 'rgba(60,35,15,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 70); for (let x = 0; x < 256; x += 3) { g.fillStyle = `rgba(255,255,255,${.25 + R() * .4})`; g.fillRect(x, 244 - R() * 10, 2, 14); } } // a shadow under the layer above, and a pale ragged fringe at the bottom
    if (kind === 'grain') strands(520, .12, .35);
    if (kind === 'planks') { strands(420, .1, .3); for (let x = 0; x < 256; x += 64) { g.fillStyle = 'rgba(60,35,15,.5)'; g.fillRect(x, 0, 3, 256); } }
    if (kind === 'plaster') for (let i = 0; i < 90; i++) { const x = R() * 256, y = R() * 256, r = 10 + R() * 34; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(120,90,50,${.05 + R() * .07})`); gr.addColorStop(1, 'rgba(120,90,50,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    if (kind === 'meadow') { for (let i = 0; i < 700; i++) { const x = R() * 256, y = R() * 256; g.strokeStyle = R() < .55 ? `rgba(40,70,20,${.07 + R() * .1})` : `rgba(255,255,255,${.25 + R() * .3})`; g.lineWidth = 1 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 5, y - 4 - R() * 6); g.stroke(); } for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(255,255,255,${.35 + R() * .3})`; g.beginPath(); g.arc(R() * 256, R() * 256, 1.5 + R() * 1.5, 0, 7); g.fill(); } } // short blades of grass and a few clover dots
    if (kind === 'leaf') for (let i = 0; i < 260; i++) { const x = R() * 256, y = R() * 256, r = 5 + R() * 9; g.fillStyle = R() < .5 ? `rgba(20,60,20,${.06 + R() * .09})` : `rgba(255,255,255,${.18 + R() * .25})`; g.beginPath(); g.ellipse(x, y, r, r * .55, R() * 3, 0, 7); g.fill(); } // overlapping leaves
    if (kind === 'earth') { for (let y = 0; y < 256; y += 22 + R() * 30) { g.fillStyle = `rgba(60,35,15,${.1 + R() * .14})`; g.fillRect(0, y, 256, 3 + R() * 7); } for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(60,35,15,${.08 + R() * .12})`; g.fillRect(R() * 256, R() * 256, 3 + R() * 9, 2 + R() * 4); } } // layers of soil with pebbles
    if (kind === 'fur') for (let i = 0; i < 1100; i++) { const x = R() * 256, y = R() * 256; g.strokeStyle = R() < .5 ? `rgba(60,40,30,${.05 + R() * .08})` : `rgba(255,255,255,${.2 + R() * .3})`; g.lineWidth = 1 + R(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 4, y + 5 + R() * 7); g.stroke(); }
    if (kind === 'stone') for (let i = 0; i < 900; i++) { g.fillStyle = R() < .5 ? `rgba(40,35,50,${.05 + R() * .12})` : `rgba(255,255,255,${.2 + R() * .3})`; g.fillRect(R() * 256, R() * 256, 1 + R() * 4, 1 + R() * 3); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; texBase[kind] = t; }
  const t = texBase[kind].clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t;
}
const fine = (c, o = {}) => { const m = mat(c, o); m.userData.outlineParameters = NO_OUTLINE; return m; }; // for small details: no dark outline around them
const LEAF_GEO = new THREE.SphereGeometry(.5, 8, 5); // one leaf shape, stretched to fit wherever a leaf or petal is drawn
// --- islands ---
const GRASS = [0x8fdc8a, 0x7fd07a, 0xdcbb62, 0xeef3ff]; // fall is a golden meadow, not sand
function island(r, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x,y,z);
  const topGeo = new THREE.CylinderGeometry(r, r*.97, 1, 48, 1, false); { const P = topGeo.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const d = Math.hypot(P.getX(i), P.getZ(i)) / r, f = P.getY(i) > .49 ? 1.07 - .16 * d * d : .86; col.push(f, f, f); }
    topGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); }
  const topMat = o.mat || mat(0x8fdc8a); topMat.vertexColors = true; if (!topMat.map && !lowGfx) topMat.map = tx('meadow', Math.round(r * 1.2), Math.round(r * 1.2));
  const top = mesh(topGeo, topMat, 0, -.5, 0); g.add(top);
  g.add(mesh(new THREE.CylinderGeometry(r*.97, r*.9, .6, 48), mat(0xb98a63, { map:tx('earth', Math.round(r), 1) }), 0, -1.3, 0));
  const rock = mesh(new THREE.ConeGeometry(r*.9, r*.8, 48), mat(0x9c7fa8, { map:tx('stone', Math.round(r), 3) }), 0, -1.6 - r*.4, 0); rock.rotation.x = Math.PI; g.add(rock);
  for (let i = 0; i < Math.round(r * 1.1); i++) { const a = i * 2.9 + r, d = r * (.5 + (i % 3) * .14), ck = mesh(new THREE.DodecahedronGeometry(.28 + (i % 4) * .1), mat(i % 2 ? 0x8a6f96 : 0xa98fb5), Math.cos(a) * d, -1.75 - (1 - d / r) * r * .72, Math.sin(a) * d); ck.rotation.set(i, i * 2, i * 3); g.add(ck); } // chunks of rock jutting from the underside
  const lipMat = topMat.clone(); lipMat.vertexColors = false; lipMat.color.multiplyScalar(.9); // the rim matches the deeper edge color
  const lip = mesh(new THREE.TorusGeometry(r - .05, .3, 10, 72), lipMat, 0, -.14, 0); lip.rotation.x = Math.PI/2; lip.userData.keep = true; g.add(lip);
  for (let i=0;i<Math.round(r*1.4);i++){ const a = i*2.39, rr = r*(.45 + (i%4)*.1), len = 1 + (i%5)*.45, vine = i%3 === 0;
    const root = mesh(new THREE.CylinderGeometry(.035, .012, len, 5), mat(vine ? 0x5fb85c : 0x7a5236), Math.cos(a)*rr, -1.7 - len/2 - (1 - rr/r)*r*.5, Math.sin(a)*rr);
    root.rotation.z = Math.sin(i)*.15; g.add(root);
    if (vine) root.add(mesh(sph(.08), mat(0x7fd88a), 0, -len/2, 0)); }
  if (!o.mat && !lowGfx) { const hr = i => { const v = Math.sin((i + r * 9.1 + x) * 127.1) * 43758.5; return v - Math.floor(v); }, bits = new THREE.Group(), n = Math.round(r * 9);
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + hr(i) * .08, bl = mesh(new THREE.ConeGeometry(.03 + hr(i + 5) * .025, .14 + hr(i + 9) * .16, 4), lipMat, Math.cos(a) * (r + .24), -.1 - hr(i + 2) * .1, Math.sin(a) * (r + .24)); bl.rotation.set(Math.PI + Math.sin(a) * .9, 0, -Math.cos(a) * .9); bl.castShadow = false; bits.add(bl); } // blades of grass hanging over the edge
    const pm = [mat(0xcfc6b6), mat(0xb3aabb)]; for (let i = 0; i < Math.round(r * 2.2); i++) { const a = hr(i + 30) * 6.28, d = r * (.72 + hr(i + 40) * .24), pb = mesh(new THREE.DodecahedronGeometry(.05 + hr(i + 50) * .05), pm[i % 2], Math.cos(a) * d, .03, Math.sin(a) * d); pb.rotation.set(i, i * 2, 0); pb.scale.y = .6; pb.castShadow = false; bits.add(pb); } // pebbles near the edge
    g.add(bake(bits)); }
  bake(g); scene.add(g); if (!o.hidden) walkables.push(top); return { g, top, lip, r };
}
const HOME = island(9, 0, 0, 0);
const ORCH_POS = new THREE.Vector3(28, -1.5, 3);
const ORCH = island(8, ORCH_POS.x, ORCH_POS.y, ORCH_POS.z);
const WIND_POS = new THREE.Vector3(30, -3, -20);
const WIND = island(8, WIND_POS.x, WIND_POS.y, WIND_POS.z);
const NIGHT_POS = new THREE.Vector3(53, -2.5, -15);
const NIGHT = island(7, NIGHT_POS.x, NIGHT_POS.y, NIGHT_POS.z); NIGHT.top.material.color.set(0x6a5aa8); NIGHT.top.material.emissive = new THREE.Color(0x2a2150); NIGHT.lip.material.color.set(0x5d4f98); NIGHT.lip.material.emissive = new THREE.Color(0x221a44); // the rim matches its purple ground

// --- grass tufts that sway ---
const tuftGeo = (() => { const pos = [], nor = []; // three flat blades fanned out, merged into one shape
  [[-.35, -.05, .24], [0, 0, .32], [.4, .06, .22]].forEach(([lean, x, h], i) => { const b = new THREE.ConeGeometry(.05, h, 3).toNonIndexed();
    b.scale(1.5, 1, .45); b.translate(0, h/2, 0); b.rotateZ(lean); b.rotateY(i * 1.1); b.translate(x, 0, (i - 1) * .03);
    pos.push(...b.attributes.position.array); nor.push(...b.attributes.normal.array); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g; })();
var SEASON_ISLES = [HOME, ORCH, WIND]; // islands whose grass changes with the season
const TUFT = [0x74cf6c, 0x62bf5c, 0xdcb556, 0xe6eef8]; // a shade brighter than the ground, so the grass reads as grass, not specks
const tuftMat = mat(0x74cf6c);
const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, 680);
const tuftData = [], dummy = new THREE.Object3D();
for (let i=0; i<680; i++) {
  // the home island keeps only a light scatter of grass, mostly near the edges, so the middle stays open
  const onHome = i < 330, R = onHome ? 8.6 : 7.6, c = onHome ? new THREE.Vector3() : i < 520 ? ORCH_POS : WIND_POS;
  if ((onHome && i >= 110) || (!onHome && i % 3)) { tuftData.push({ x:0, y:-50, z:0, s:.01, ph:0 }); continue; } // a light scatter everywhere, not a carpet of spikes
  let x, z; do { const a = Math.random()*Math.PI*2, r = onHome ? 5.2 + Math.random()*3.4 : 4.4 + Math.random()*3.1; x = c.x + Math.cos(a)*r; z = c.z + Math.sin(a)*r; }
  while (onHome && x > .3 && x < 4.6 && z > -1.8 && z < 3.5);
  tuftData.push({ x, y:c.y, z, s:.5 + Math.random()*.45, ph:Math.random()*6 });
}
tufts.receiveShadow = true; scene.add(tufts);
function swayTufts(now) {
  const windy = 0.12 + Math.sin(now*.3)*.05;
  tuftData.forEach((d, i) => {
    dummy.position.set(d.x, d.y, d.z); dummy.scale.set(1, d.s, 1);
    dummy.rotation.set(Math.sin(now*1.8 + d.ph + d.x*.3)*windy, 0, Math.cos(now*1.5 + d.ph)*windy*.6);
    dummy.updateMatrix(); tufts.setMatrixAt(i, dummy.matrix);
  });
  tufts.instanceMatrix.needsUpdate = true;
}

// --- trees ---
const trees = [];
const CANOPY = [0x5fc377, 0x4fb46a, 0xf0a04b, 0xf4f7ff];
function tree(parent, x, z, fruitKind) {
  const g = new THREE.Group(); g.position.set(x,0,z);
  const seed = Math.abs(Math.sin(x*12.9 + z*78.2)) * 1000, r = k => { const v = Math.sin(seed + k*37.7) * 43758.5; return v - Math.floor(v); };
  const bark = mat(0x9b6b4a, { map:tx('grain', 2, 2) });
  const trunk = mesh(new THREE.CylinderGeometry(.16,.26,1.3,10), bark, 0, .65, 0); trunk.rotation.z = (r(1)-.5)*.12; g.add(trunk);
  for (let i=0;i<3;i++){ const a = i*2.1 + r(2); const root = mesh(new THREE.ConeGeometry(.12,.45,6), bark, Math.cos(a)*.22, .1, Math.sin(a)*.22); root.rotation.set(Math.sin(a)*1.2, 0, -Math.cos(a)*1.2); g.add(root); }
  [-1,1].forEach(sd => { const br = mesh(new THREE.CylinderGeometry(.05,.08,.6,6), bark, sd*.22, 1.15, 0); br.rotation.z = -sd*.9; g.add(br); });
  const canopy = new THREE.Group(); canopy.position.y = 1.25; g.add(canopy);
  const cm = mat(0x5fc377, { map:tx('leaf', 3, 2) }), cm2 = mat(0x4fb46a, { map:tx('leaf', 3, 2) });
  { const kn = mesh(new THREE.TorusGeometry(.05,.022,6,10), mat(0x7a5236), .02, .62, .2); kn.rotation.y = .1; g.add(kn); const hole = mesh(new THREE.CircleGeometry(.04, 10), mat(0x4a3020), .02, .62, .205); g.add(hole); // a knot in the trunk
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + r(11), t = mesh(new THREE.ConeGeometry(.04,.2,4), mat(i % 2 ? 0x5fa85a : 0x8fcf7a), Math.cos(a) * .36, .09, Math.sin(a) * .36); t.material.userData.outlineParameters = { visible:false }; g.add(t); } }
  const blobs = [[0,.55,0,.85,cm],[.55,.35,.2,.55,cm2],[-.5,.4,-.2,.52,cm],[.1,.95,-.1,.55,cm],[-.2,.3,.5,.5,cm2],[.3,.25,-.5,.48,cm],[-.55,.75,.25,.4,cm2],[.45,.8,.35,.38,cm]];
  blobs.forEach(([bx,by,bz,br,m], i) => { const b = mesh(sph(br * (.9 + r(i+5)*.2)), m, bx, by, bz); b.scale.y = .9; canopy.add(b); });
  for (let i = 0; i < 14; i++) { const a = i * 2.4 + r(20), e = .1 + r(i + 21) * 1.2, rr = .92, b = mesh(sph(.16 + r(i + 30) * .1), i % 2 ? cm : cm2, Math.cos(a) * Math.cos(e) * rr, .5 + Math.sin(e) * .62, Math.sin(a) * Math.cos(e) * rr); b.scale.y = .8; canopy.add(b); } // small clumps of leaves break up the outline
  const fruits = new THREE.Group(); canopy.add(fruits);
  if (fruitKind) for (let i=0;i<8;i++){ const a=i*.8 + r(9); fruits.add(mesh(sph(.13), mat(fruitKind === 'apple' ? 0xff6b6b : 0xffb36b), Math.cos(a)*.82, .3+Math.sin(i*2)*.35, Math.sin(a)*.82)); }
  fruits.userData.keep = true; bake(canopy);
  g.userData = { canopy, cm, cm2, fruits, ph:Math.random()*6 };
  parent.add(g); trees.push(g); return g;
}
// home trees stand at the back and sides, so the front of the island (nearest the camera) stays an open meadow
const woodTrees = [[1.4,-7.7],[-2.75,-6.75],[7,-1.75],[5.5,-4.75]].map(([x,z]) => tree(scene, x, z)); // the first tree stands clear of Nana's back wall, so there is room to walk behind her cottage
[[-5.5,-2],[-6,3.5],[5.5,3]].forEach(([x,z]) => woodTrees.push(tree(WIND.g, x, z)));
woodTrees.forEach((t, i) => { t.userData.kind = 'tree'; t.userData.key = 'tree'+i; });
const fruitTrees = [[-3,-3,'apple'],[2,-4,'peach'],[-4,3,'peach'],[5,.3,'apple']].map(([x,z,k], i) => {
  const t = tree(ORCH.g, x, z, k); t.userData.kind = 'fruitTree'; t.userData.i = i; t.userData.fruitKind = k; return t;
});

// --- flowers ---
const flowers = new THREE.Group(); scene.add(flowers);
{ const hr = i => { const v = Math.sin(i * 127.1) * 43758.5; return v - Math.floor(v); }, wf = new THREE.Group(), stem = mat(0x4fb46a), mid = mat(0xffd23f), cols = [0xffffff, 0xffd1dc, 0xfff3a0, 0xc9b6ff].map(c => mat(c));
  for (let i = 0; i < 46; i++) { const a = hr(i) * Math.PI * 2, r = 6.3 + hr(i + 9) * 2.1, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .1 + hr(i + 3) * .08; if (z > 3.2 && Math.abs(x) < 4.5) continue; // keep the front meadow open
    wf.add(mesh(new THREE.CylinderGeometry(.008,.008,h,3), stem, x, h / 2, z)); wf.add(mesh(sph(.022), mid, x, h + .012, z));
    for (let p = 0; p < 5; p++) { const pa = p / 5 * Math.PI * 2, pt = mesh(LEAF_GEO, cols[i % 4], x + Math.cos(pa) * .035, h + .008, z + Math.sin(pa) * .035); pt.scale.set(.05, .014, .05); wf.add(pt); } }
  wf.traverse(o => { if (o.isMesh) o.castShadow = false; }); flowers.add(bake(wf)); }

// --- house with windows that glow at night ---
const house = new THREE.Group(); house.position.set(-4,0,-3); house.userData.kind = 'house'; scene.add(house);
const trim = mat(0xffffff), wood = mat(0x9b6b4a), woodLight = mat(0xc98f58), roofMat = mat(0xff8fa3), wallMat = mat(0xfff1d6);
const winMat = new THREE.MeshStandardMaterial({ color:0x9fd3ff, emissive:0xffc46b, emissiveIntensity:0, roughness:.4 });
let winHalos = [];
// your home comes in three sizes and three kinds of wall. It grows upward, so it never takes more ground.
const HOME_STYLES = {
  daub:  { name:'Woven branches and clay', what:'Thin branches woven together, then covered with wet clay and straw. Builders call it wattle and daub.', needs:{ log:10, fiber:6 }, color:0xfff1d6 },
  log:   { name:'Logs', what:'Whole logs stacked on their sides. A notch cut near each end locks the corners together.', needs:{ log:14 }, color:0x8a5a3b },
  stone: { name:'Stone', what:'Stones picked to fit, then stacked tight. Done well, the wall stands with no mortar. Builders call it dry stone.', needs:{ stone:12, log:2 }, color:0xa9a2b4 },
};
const HOME_SIZES = [null, { name:'hut' },
  { name:'cottage', needs:{ log:30, stone:20, fiber:12 }, coins:300, adds:'A cottage is taller. It has a loft upstairs with 6 more spots for furniture.' },
  { name:'house', needs:{ log:60, stone:40, fiber:20 }, coins:1500, adds:'A house has 2 full floors and a balcony. It has a study next to the loft with 6 more spots for furniture.' }];
const homeStyle = () => HOME_STYLES[S.homeStyle] ? S.homeStyle : 'daub', homeSize = () => (S.home || 0) < 3 ? 1 : Math.min(3, S.homeSize || 1), homeName = () => HOME_SIZES[homeSize()].name;
roofMat.map = tx('straw', 4, 1); wallMat.map = tx('plaster', 2, 2);
const ridgeMat = mat(0xff8fa3, { map:tx('straw', 4, 1) }), lampMat = new THREE.MeshStandardMaterial({ color:0xffe9b8, emissive:0xffc46b, emissiveIntensity:.15, roughness:.5 }); lampMat.userData.outlineParameters = NO_OUTLINE;
// --- keeping the detail cheap: once a building is drawn, parts that look the same are joined into one piece, so the phone draws a few pieces instead of hundreds ---
function bake(root) { try { root.updateWorldMatrix(true, true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map();
  const walk = o => { if (o !== root && (o.userData.kind || o.userData.use || o.userData.spin || o.userData.keep || o.userData.sway || o.userData.bob || !o.visible || o.isSprite || o.isLine)) return; // things you tap, things that move, and hidden things stay as they are
    if (o.isMesh && !o.children.length && o.material && !Array.isArray(o.material) && o.material.visible !== false && o.geometry.attributes.normal && o.geometry.attributes.uv && !o.userData.baked) { const m = o.material;
      const key = [m.type, m.color ? m.color.getHex() : '', m.map ? m.map.uuid : '', m.transparent, m.opacity, m.side, m.emissive ? m.emissive.getHex() : '', m.userData.outlineParameters ? 'n' : 'o', m.metalness, m.roughness, o.castShadow, o.receiveShadow, m.vertexColors].join('|');
      if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(o); }
    [...o.children].forEach(walk); };
  walk(root);
  buckets.forEach(list => { if (list.length < 2) return; const geos = list.map(o => { const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(), g = new THREE.BufferGeometry(); ['position', 'normal', 'uv'].forEach(k => g.setAttribute(k, src.attributes[k])); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); return g; });
    const merged = mergeGeometries(geos); if (!merged) return; const one = new THREE.Mesh(merged, list[0].material); one.castShadow = list[0].castShadow; one.receiveShadow = list[0].receiveShadow; one.userData.baked = true; root.add(one); list.forEach(o => o.parent && o.parent.remove(o)); });
} catch (e) { console.warn('bake', e); } return root; }
// a bush: big leafy clumps, smaller clumps to break up the outline, paler new leaves on top, and a few berries
function bushLook(g, s = 1, c = 0x4fb46a) { const k = g.position.x * 7.3 + g.position.z * 3.1, hr = i => { const v = Math.sin((i + k) * 127.1) * 43758.5; return v - Math.floor(v); };
  const m1 = mat(c, { map:tx('leaf', 3, 2) }), m2 = mat(new THREE.Color(c).multiplyScalar(.84).getHex(), { map:tx('leaf', 3, 2) }), tip = fine(new THREE.Color(c).lerp(new THREE.Color(0xd8f0a0), .45).getHex()), part = new THREE.Group();
  [[0,0,0,.45],[.35,-.05,.1,.34],[-.32,-.07,.08,.32],[.05,.15,-.15,.3]].forEach(([bx,by,bz,br], i) => part.add(mesh(sph(br*s), i % 2 ? m2 : m1, bx*s, br*s*.8 + by, bz*s)));
  for (let i = 0; i < 12; i++) { const a = hr(i) * 6.28, e = .15 + hr(i + 20) * 1.1, r = .46 * s, cl = mesh(sph((.1 + hr(i + 40) * .07) * s), i % 2 ? m1 : m2, Math.cos(a) * Math.cos(e) * r * 1.2, .3 * s + Math.sin(e) * r * .75, Math.sin(a) * Math.cos(e) * r); cl.scale.y = .8; part.add(cl); }
  for (let i = 0; i < 9; i++) { const a = hr(i + 60) * 6.28, r = hr(i + 70) * .3 * s, lf = mesh(LEAF_GEO, tip, Math.cos(a) * r, (.62 + hr(i + 80) * .14) * s - r * .4, Math.sin(a) * r); lf.scale.set(.09 * s, .03, .13 * s); lf.rotation.y = a; part.add(lf); }
  for (let i = 0; i < 5; i++) { const a = hr(i + 90) * 6.28, e = .3 + hr(i + 95) * .6; part.add(mesh(sph(.035 * s), fine(i % 2 ? 0xd8323c : 0xe8617a), Math.cos(a) * Math.cos(e) * .5 * s, .3 * s + Math.sin(e) * .36 * s, Math.sin(a) * Math.cos(e) * .44 * s)); }
  g.add(bake(part)); }
// --- detailed parts shared by every building: windows, doors, stone footings, chimneys, layered roofs, pots of flowers ---
const townHalos = [];
const KIT = (() => {
  const hr = i => { const x = Math.sin(i * 127.1) * 43758.5; return x - Math.floor(x); };
  const at = (g, x, y, z, ry = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); return p; };
  const BLOOM = [0xff8fa3, 0xfff3a0, 0xc9b6ff, 0xffffff, 0xffb36b];
  // a window facing +z: frame, panes, sill, and (if asked) shutters, a flower box and a night glow
  function win(g, x, y, z, o = {}) { const { w = .5, h = .46, ry = 0, shut = null, box = false, glass = winMat, frame = 0xffffff, round = false, lit = true, bars = true } = o, p = at(g, x, y, z, ry), fr = mat(frame), wt = fine(frame);
    if (round) { p.add(mesh(new THREE.TorusGeometry(w / 2 + .03, .045, 8, 22), fr, 0, 0, .03)); p.add(mesh(new THREE.CircleGeometry(w / 2, 22), glass, 0, 0, .02)); if (bars) { p.add(mesh(new THREE.BoxGeometry(.03, w, .02), wt, 0, 0, .04)); p.add(mesh(new THREE.BoxGeometry(w, .03, .02), wt, 0, 0, .04)); } }
    else { p.add(mesh(new THREE.BoxGeometry(w + .14, h + .14, .07), fr, 0, 0, .01)); p.add(mesh(new THREE.BoxGeometry(w, h, .08), glass, 0, 0, .03)); if (bars) { p.add(mesh(new THREE.BoxGeometry(.035, h, .03), wt, 0, 0, .08)); p.add(mesh(new THREE.BoxGeometry(w, .035, .03), wt, 0, 0, .08)); }
      p.add(mesh(new THREE.BoxGeometry(w + .26, .07, .16), mat(0xc98f58, { map:tx('planks', 2, 1) }), 0, -h / 2 - .1, .07)); }
    if (shut != null) { const sm = mat(shut), sl = fine(new THREE.Color(shut).multiplyScalar(.78).getHex()); [-1, 1].forEach(sd => { p.add(mesh(new THREE.BoxGeometry(.17, h + .12, .05), sm, sd * (w / 2 + .18), 0, .04)); [-.3, -.1, .1, .3].forEach(k => p.add(mesh(new THREE.BoxGeometry(.13, .02, .02), sl, sd * (w / 2 + .18), k * h, .07))); }); }
    if (box) flowerBox(p, 0, -h / 2 - .22, .14, w + .16, x * 7 + y);
    if (lit) { const hl = halo(0xffc46b, Math.max(w, h) * 2.4, 0); hl.position.set(0, 0, .22); p.add(hl); townHalos.push(hl); } return p; }
  function flowerBox(g, x, y, z, w = .66, seed = 0) { g.add(mesh(new THREE.BoxGeometry(w, .15, .17), mat(0xc98f58, { map:tx('planks', 2, 1) }), x, y, z)); g.add(mesh(new THREE.BoxGeometry(w - .06, .03, .12), fine(0x5a3f2c), x, y + .08, z));
    const n = Math.round(w / .11); for (let i = 0; i < n; i++) { const fx = x - w / 2 + .08 + i * (w - .16) / Math.max(1, n - 1), fy = y + .16 + hr(i + seed) * .08; g.add(mesh(new THREE.CylinderGeometry(.01, .01, .14, 4), fine(0x4fb46a), fx, fy - .05, z)); g.add(mesh(sph(.045), fine(BLOOM[(i + Math.floor(seed * 3 + 50)) % 5]), fx, fy + .03, z + (i % 2) * .03)); const lf = mesh(sph(.05), fine(i % 2 ? 0x4fb46a : 0x3f9a5c), fx + .04, fy - .07, z + .06); lf.scale.set(1, .5, .7); g.add(lf); } }
  // a plank door facing +z, with a frame, iron hinges and a brass knob. round:true makes a round burrow door
  function door(g, x, y, z, o = {}) { const { w = .6, h = 1, ry = 0, color = 0xc08a5c, frame = 0x8a6040, arch = true, round = false, pane = false, knob = 0xffc857 } = o, p = at(g, x, y, z, ry), dm = mat(color, { map:tx('grain', 1, 1) }), fm = mat(frame, { map:tx('grain', 1, 2) }), seam = fine(new THREE.Color(color).multiplyScalar(.5).getHex()), iron = fine(0x4a4450);
    if (round) { const r = w / 2; const f = mesh(new THREE.CylinderGeometry(r + .1, r + .1, .1, 26), fm, 0, r, 0); f.rotation.x = Math.PI / 2; p.add(f); const d = mesh(new THREE.CylinderGeometry(r, r, .12, 26), dm, 0, r, .03); d.rotation.x = Math.PI / 2; p.add(d);
      [-.5, 0, .5].forEach(k => p.add(mesh(new THREE.BoxGeometry(.012, 2 * r * Math.sqrt(1 - k * k * .8), .02), seam, k * r, r, .1))); [-.45, .45].forEach(k => { p.add(mesh(new THREE.BoxGeometry(r * 1.1, .05, .02), iron, -r * .3, r + k * r, .1)); }); p.add(mesh(sph(.05), fine(knob), r * .45, r, .12)); return p; }
    p.add(mesh(new THREE.BoxGeometry(w + .12, h, .07), fm, 0, h / 2, 0)); p.add(mesh(new THREE.BoxGeometry(w, h - .04, .1), dm, 0, h / 2 - .02, .02));
    if (arch) { const a1 = mesh(new THREE.CylinderGeometry(w / 2 + .06, w / 2 + .06, .07, 18, 1, false, -Math.PI / 2, Math.PI), fm, 0, h, 0); a1.rotation.x = -Math.PI / 2; p.add(a1); const a2 = mesh(new THREE.CylinderGeometry(w / 2, w / 2, .1, 18, 1, false, -Math.PI / 2, Math.PI), dm, 0, h - .03, .02); a2.rotation.x = -Math.PI / 2; p.add(a2); }
    const n = Math.max(2, Math.round(w / .18)); for (let i = 1; i < n; i++) p.add(mesh(new THREE.BoxGeometry(.012, h + (arch ? w * .3 : -.06), .02), seam, -w / 2 + i * w / n, h / 2 + (arch ? w * .12 : 0), .075));
    [.26, .8].forEach(k => { p.add(mesh(new THREE.BoxGeometry(w * .7, .05, .02), iron, -w * .12, h * k, .08)); p.add(mesh(sph(.028), iron, -w * .42, h * k, .08)); }); p.add(mesh(sph(.042), fine(knob), w * .33, h * .52, .1));
    if (pane) { const pn = mesh(new THREE.BoxGeometry(.16, .16, .03), winMat, 0, h * .78, .075); pn.rotation.z = Math.PI / 4; p.add(pn); } return p; }
  // rough stones around the foot of a wall: w wide, d deep, on the front and both sides
  function foot(g, w, d, cz = 0, seed = 0) { const fs = [mat(0xd8cfc0), mat(0xbfb6a8), mat(0xcac2b6)]; let i = seed;
    for (let x = -w / 2 - .04; x < w / 2; i++) { const l = .22 + hr(i + 3) * .2; g.add(mesh(new THREE.BoxGeometry(Math.min(l, w / 2 + .04 - x) - .03, .15 + hr(i) * .08, .12), fs[i % 3], x + l / 2, .1, cz + d / 2 + .04)); x += l; }
    [-1, 1].forEach(sd => { for (let z = -d / 2; z < d / 2 - .05; i++) { const l = .24 + hr(i + 9) * .2; g.add(mesh(new THREE.BoxGeometry(.12, .15 + hr(i) * .08, Math.min(l, d / 2 - z) - .03), fs[i % 3], sd * (w / 2 + .04), .1, cz + z + l / 2)); z += l; } }); }
  function chimney(g, x, y, z, h = .8, pot = true) { const sm = mat(0xb0a898, { map:tx('stone', 1, 1) }); g.add(mesh(new THREE.BoxGeometry(.32, h, .32), sm, x, y + h / 2, z)); for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(.14, .09, .05), mat(i % 2 ? 0x9a93a8 : 0xc8c2cf), x - .07 + hr(i + x) * .14, y + .1 + i * (h - .18) / 6, z + .17));
    g.add(mesh(new THREE.BoxGeometry(.42, .08, .42), mat(0x8a8290), x, y + h + .04, z)); if (pot) g.add(mesh(new THREE.CylinderGeometry(.08, .1, .18, 10), mat(0xc9703f), x, y + h + .17, z)); }
  // a pointed roof laid in overlapping layers with a rolled edge. R is the distance to a corner
  function hip(g, y, R, H, m, zs = 1, layers = 4) { for (let i = 0; i < layers; i++) { const y0 = i * H / layers, y1 = Math.min(H, y0 + H / layers + .1), c = mesh(new THREE.CylinderGeometry(Math.max(.02, R * (1 - y1 / H)), R * (1 - y0 / H) + .08, y1 - y0, 4), m, 0, y + (y0 + y1) / 2, 0); c.rotation.y = Math.PI / 4; c.scale.z = zs; g.add(c); }
    const tg = new THREE.TorusGeometry(R + .05, .09, 8, 4); tg.rotateZ(Math.PI / 4); tg.rotateX(Math.PI / 2); const roll = mesh(tg, m, 0, y + .05, 0); roll.scale.z = zs; g.add(roll); }
  // a roof with two sloping sides. half = half the depth of the walls, W = how wide, rh = how tall, m2 = ridge and trim
  function gable(g, y, half, rh, W, m, m2, wallM, o = {}) { const over = o.over ?? .3, ang = Math.atan2(rh, half), L = (half + over) / Math.cos(ang), n = o.layers ?? 4;
    if (wallM) { const sh = new THREE.Shape(); sh.moveTo(-half, 0); sh.lineTo(half, 0); sh.lineTo(0, rh); sh.closePath(); const gg = new THREE.ExtrudeGeometry(sh, { depth:W - .5, bevelEnabled:false }); gg.translate(0, 0, -(W - .5) / 2); gg.rotateY(Math.PI / 2); g.add(mesh(gg, wallM, 0, y, o.cz || 0)); }
    [0, Math.PI].forEach(yaw => { const side = new THREE.Group(); side.rotation.y = yaw; side.position.z = o.cz || 0; const sl = new THREE.Group(); sl.position.y = y + rh; sl.rotation.x = ang; side.add(sl); g.add(side);
      for (let i = 0; i < n; i++) sl.add(mesh(new THREE.BoxGeometry(W, .16, L / n + .14), m, 0, .08 + i * .03, L - (i + .5) * L / n));
      const roll = mesh(new THREE.CylinderGeometry(.1, .1, W, 10), m, 0, .06, L + .02); roll.rotation.z = Math.PI / 2; sl.add(roll); sl.add(mesh(new THREE.BoxGeometry(W + .06, .1, .4), m2, 0, .22, .17)); });
    const cap = mesh(new THREE.CylinderGeometry(.12, .12, W + .08, 10), m2, 0, y + rh + .16, o.cz || 0); cap.rotation.z = Math.PI / 2; g.add(cap); }
  // a clay pot with a leafy plant and a flower
  function pot(g, x, z, s = 1, c = 0, y = 0) { g.add(mesh(new THREE.CylinderGeometry(.13 * s, .09 * s, .2 * s, 12), mat(0xd9825b), x, y + .1 * s, z)); g.add(mesh(new THREE.CylinderGeometry(.14 * s, .14 * s, .03 * s, 12), mat(0xc9703f), x, y + .2 * s, z)); g.add(mesh(sph(.15 * s), mat(c % 2 ? 0x4fb46a : 0x3f9a5c), x, y + .32 * s, z)); [[.07, .43, .04], [-.06, .4, -.03], [.0, .46, -.06]].forEach(([dx, dy, dz], i) => g.add(mesh(sph(.05 * s), fine(BLOOM[(c + i) % 5]), x + dx * s, y + dy * s, z + dz * s))); }
  function barrel(g, x, z, s = 1) { g.add(mesh(new THREE.CylinderGeometry(.2 * s, .17 * s, .5 * s, 14), mat(0xa9744a, { map:tx('planks', 4, 1) }), x, .25 * s, z)); [.1, .4].forEach(y => g.add(mesh(new THREE.CylinderGeometry(.205 * s, .205 * s, .04 * s, 14), mat(0x4a4450), x, y * s, z))); g.add(mesh(new THREE.CylinderGeometry(.17 * s, .17 * s, .02, 14), mat(0x6b4630), x, .5 * s, z)); }
  function crate(g, x, z, s = 1, ry = 0) { const p = at(g, x, 0, z, ry); p.add(mesh(new THREE.BoxGeometry(.4 * s, .34 * s, .4 * s), mat(0xc98f58, { map:tx('planks', 2, 1) }), 0, .17 * s, 0)); [-1, 1].forEach(sd => { p.add(mesh(new THREE.BoxGeometry(.44 * s, .05 * s, .05 * s), mat(0x8a6040), 0, .17 * s + sd * .15 * s, .2 * s)); p.add(mesh(new THREE.BoxGeometry(.05 * s, .34 * s, .05 * s), mat(0x8a6040), sd * .19 * s, .17 * s, .2 * s)); }); return p; }
  function lantern(g, x, y, z) { const iron = fine(0x4a4450); g.add(mesh(new THREE.BoxGeometry(.04, .04, .2), iron, x, y + .2, z - .08)); g.add(mesh(new THREE.BoxGeometry(.03, .1, .03), iron, x, y + .15, z)); g.add(mesh(new THREE.BoxGeometry(.13, .17, .13), lampMat, x, y, z)); g.add(mesh(new THREE.BoxGeometry(.17, .03, .17), iron, x, y + .1, z)); g.add(mesh(new THREE.BoxGeometry(.17, .03, .17), iron, x, y - .1, z)); const hl = halo(0xffc46b, .9, 0); hl.position.set(x, y, z + .12); g.add(hl); townHalos.push(hl); }
  // thin dark lines across a wall, like the gaps between boards. n lines on a face w wide and h tall at height y, facing +z at z
  function boards(g, w, h, y, z, n, c = 0x000000, op = .18, ry = 0, x = 0) { const m = new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:op }); m.userData.outlineParameters = NO_OUTLINE; const p = at(g, x, 0, 0, ry); for (let i = 1; i < n; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(w, .018, .01), m); l.position.set(0, y - h / 2 + i * h / n, z); p.add(l); } }
  return { win, door, foot, chimney, hip, gable, pot, barrel, crate, lantern, boards, flowerBox, hr, at, BLOOM };
})();
function drawHouse() {
  house.clear(); winHalos = []; applyPaint();
  const sz = homeSize(), st = homeStyle(), add = m => (house.add(m), m), hr = i => { const x = Math.sin(i * 127.1) * 43758.5; return x - Math.floor(x); };
  const wh = sz === 3 ? 3.4 : sz === 2 ? 2.2 : 1.8, fz = st === 'log' ? 1.2 : st === 'stone' ? 1.16 : 1.1; // wall height, and how far the front face sticks out
  const dark = mat(0x8a6040, { map:tx('grain', 1, 2) }), plank = mat(0xc98f58, { map:tx('planks', 2, 1) }), stoneM = mat(0xb0a898, { map:tx('stone', 1, 1) }), seam = fine(0x4a3020), iron = fine(0x4a4450), white = fine(0xffffff), leaf = fine(0x4fb46a), leaf2 = fine(0x3f9a5c);
  add(mesh(new THREE.BoxGeometry(2.6, wh, 2.2), wallMat, 0, wh / 2, 0));
  // a footing of rough stones, each a little different
  add(mesh(new THREE.BoxGeometry(2.74, .2, 2.34), stoneM, 0, .1, 0));
  { const fs = [mat(0xd8cfc0), mat(0xbfb6a8), mat(0xcac2b6)]; let i = 0;
    for (let x = -1.34; x < 1.3; i++) { const w = .22 + hr(i + 3) * .2; add(mesh(new THREE.BoxGeometry(w - .03, .16 + hr(i) * .08, .12), fs[i % 3], x + w / 2, .11, fz + .06)); x += w; }
    [-1, 1].forEach(sd => { for (let z = -1.1, k = 0; z < 1.05; k++, i++) { const w = .24 + hr(i + 9) * .2; add(mesh(new THREE.BoxGeometry(.12, .16 + hr(i) * .08, w - .03), fs[i % 3], sd * 1.38, .11, z + w / 2)); z += w; } }); }
  if (st === 'log') { // round logs with bark, pale clay packed in the gaps, and ends that cross at the corners
    const lm = [mat(0xa9744a, { map:tx('grain', 1, 3) }), mat(0x96633f, { map:tx('grain', 1, 3) })], end = fine(0xe6c69a), ring = fine(0xb98a58), chink = fine(0xe8dcc0);
    for (let k = 0, y = .37; y < wh - .1; k++, y += .3) { const r = .15 + (hr(k) - .5) * .02;
      [-1, 1].forEach(sd => { const l = add(mesh(new THREE.CylinderGeometry(r, r, 3.04, 12), lm[k % 2], 0, y, sd * 1.05)); l.rotation.z = Math.PI / 2;
        [-1.53, 1.53].forEach(x => { const c = add(mesh(new THREE.CircleGeometry(r * .8, 12), end, x, y, sd * 1.05)); c.rotation.y = Math.sign(x) * Math.PI / 2; const c2 = add(mesh(new THREE.RingGeometry(r * .32, r * .42, 12), ring, x + Math.sign(x) * .002, y, sd * 1.05)); c2.rotation.y = c.rotation.y; });
        if (y + .3 < wh - .1) add(mesh(new THREE.BoxGeometry(2.6, .07, .04), chink, 0, y + .15, sd * 1.14)); });
      if (y + .15 < wh - .1) [-1, 1].forEach(sd => { const l = add(mesh(new THREE.CylinderGeometry(r, r, 2.64, 12), lm[(k + 1) % 2], sd * 1.15, y + .15, 0)); l.rotation.x = Math.PI / 2;
        [-1.33, 1.33].forEach(z => { const c = add(mesh(new THREE.CircleGeometry(r * .8, 12), end, sd * 1.15, y + .15, z)); if (z < 0) c.rotation.y = Math.PI; }); }); }
  } else if (st === 'stone') { // fitted stones: rows of different heights, stones of different sizes, big ones at the corners
    const sm = [0xb9b2c2, 0x9a93a8, 0xc8c2cf, 0x8f899c, 0xaaa2a0].map(c => mat(c, { map:tx('stone', 1, 1) }));
    for (let r = 0, y = .22; y < wh - .14; r++) { const h = Math.min(.2 + hr(r * 3) * .13, wh - .04 - y), yc = y + h / 2;
      let x = -1.3 + (r % 2 ? 0 : -.14); for (let i = 0; x < 1.3; i++) { const w = .26 + hr(r * 17 + i) * .34, x0 = Math.max(-1.3, x), x1 = Math.min(1.3, x + w), d = .08 + hr(r * 5 + i * 3) * .06;
        if (x1 - x0 > .08) add(mesh(new THREE.BoxGeometry(x1 - x0 - .025, h - .025, d), sm[Math.floor(hr(r * 31 + i * 7) * 5)], (x0 + x1) / 2, yc, 1.1 + d / 2 - .02)); x += w; }
      let z = -1.1 + (r % 2 ? -.12 : 0); for (let i = 0; z < 1.1; i++) { const w = .26 + hr(r * 13 + i + 50) * .34, z0 = Math.max(-1.1, z), z1 = Math.min(1.1, z + w), d = .08 + hr(r * 7 + i) * .06;
        if (z1 - z0 > .08) [-1, 1].forEach(sd => add(mesh(new THREE.BoxGeometry(d, h - .025, z1 - z0 - .025), sm[Math.floor(hr(r * 29 + i * 5 + sd) * 5)], sd * (1.3 + d / 2 - .02), yc, (z0 + z1) / 2))); z += w; }
      [-1, 1].forEach(sd => add(mesh(new THREE.BoxGeometry(.24, h - .02, .24), sm[(r + (sd > 0 ? 2 : 0)) % 5], sd * 1.3, yc, 1.1))); y += h; }
    [[-1.05, .3], [.5, .34], [1.2, .62], [-.6, .28]].forEach(([x, y], i) => { const m = add(mesh(sph(.09), i % 2 ? leaf : leaf2, x, y, 1.2)); m.scale.set(1.5, .5, .6); }); // moss
  } else { // plaster between dark timbers: posts, rails and corner braces
    const beam = (w, h, d, x, y, z, rz = 0, ry = 0) => { const m = add(mesh(new THREE.BoxGeometry(w, h, d), dark, x, y, z)); m.rotation.z = rz; m.rotation.y = ry; return m; };
    [[-1.3, 1.1], [1.3, 1.1], [-1.3, -1.1], [1.3, -1.1]].forEach(([x, z]) => beam(.17, wh, .17, x, wh / 2, z));
    beam(2.6, .11, .08, 0, .27, 1.11); beam(2.6, .11, .08, 0, wh - .06, 1.11);
    [-1, 1].forEach(sd => { beam(.09, .5, .07, sd * 1.12, .52, 1.11, sd * .5); });
    [-1.31, 1.31].forEach(x => { beam(.08, .13, 2.2, x, .28, 0); beam(.08, .13, 2.2, x, wh - .07, 0); beam(.08, wh - .3, .11, x, wh / 2, 0); beam(.08, .11, 2.2, x, 1.05, 0);
      [-1, 1].forEach(sd => { const b = beam(.07, .1, 1.0, x, 1.45, sd * .55); b.rotation.x = sd * .62; }); });
    if (sz > 1) beam(2.6, .13, .08, 0, 1.8, 1.11);
    if (sz === 3) { [-1, 1].forEach(sd => { beam(.52, .08, .07, sd * .87, 2.1, 1.11, sd * .5); beam(.52, .08, .07, sd * .87, 2.1, 1.115, -sd * .5); beam(.7, .1, .08, sd * .87, 3.08, 1.11); }); [-.47, .47].forEach(x => beam(.11, 1.5, .08, x, 2.6, 1.115)); }
  }
  // a window: frame, four panes, sill, shutters with slats, and a flower box if asked
  const shut = mat(0x7ec8e3), slat = fine(0x5aa9c8), bloom = [0xff8fa3, 0xfff3a0, 0xc9b6ff, 0xffffff, 0xffb36b].map(c => fine(c));
  const windowAt = (x, y, box) => { add(mesh(new THREE.BoxGeometry(.64, .6, .07), trim, x, y, fz + .01)); add(mesh(new THREE.BoxGeometry(.5, .46, .08), winMat, x, y, fz + .03));
    add(mesh(new THREE.BoxGeometry(.035, .46, .03), white, x, y, fz + .08)); add(mesh(new THREE.BoxGeometry(.5, .035, .03), white, x, y, fz + .08));
    add(mesh(new THREE.BoxGeometry(.76, .07, .16), plank, x, y - .33, fz + .07)); if (st !== 'daub') add(mesh(new THREE.BoxGeometry(.78, .1, .1), dark, x, y + .35, fz + .04));
    [-1, 1].forEach(sd => { add(mesh(new THREE.BoxGeometry(.17, .58, .05), shut, x + sd * .43, y, fz + .04)); [-.18, -.06, .06, .18].forEach(dy => add(mesh(new THREE.BoxGeometry(.13, .02, .02), slat, x + sd * .43, y + dy, fz + .07))); });
    const hl = halo(0xffc46b, 1.3, 0); hl.position.set(x, y, fz + .22); add(hl); winHalos.push(hl);
    if (box) { add(mesh(new THREE.BoxGeometry(.66, .15, .17), plank, x, y - .45, fz + .14)); add(mesh(new THREE.BoxGeometry(.6, .03, .12), fine(0x5a3f2c), x, y - .37, fz + .14));
      for (let i = 0; i < 6; i++) { const fx = x - .25 + i * .1, fy = y - .28 + hr(i + x * 9) * .08; add(mesh(new THREE.CylinderGeometry(.01, .01, .14, 4), leaf, fx, fy - .05, fz + .14)); add(mesh(sph(.045), bloom[(i + (x > 0 ? 2 : 0)) % 5], fx, fy + .03, fz + .14 + (i % 2) * .03)); const lf = add(mesh(sph(.05), i % 2 ? leaf : leaf2, fx + .04, fy - .07, fz + .2)); lf.scale.set(1, .5, .7); } } };
  [-.85, .85].forEach(x => windowAt(x, 1.05, true));
  // the door: planks, iron hinges, a brass knob, a little window, and a lantern beside it
  { const z = fz + .02; add(mesh(new THREE.BoxGeometry(.8, 1.2, .08), dark, 0, .6, z - .02)); const arch = add(mesh(new THREE.CylinderGeometry(.4, .4, .08, 18, 1, false, -Math.PI / 2, Math.PI), dark, 0, 1.2, z - .02)); arch.rotation.x = -Math.PI / 2;
    const dm = mat(0xc08a5c, { map:tx('grain', 1, 1) }); add(mesh(new THREE.BoxGeometry(.7, 1.14, .1), dm, 0, .59, z)); const top = add(mesh(new THREE.CylinderGeometry(.35, .35, .1, 18, 1, false, -Math.PI / 2, Math.PI), dm, 0, 1.16, z)); top.rotation.x = -Math.PI / 2;
    [-.175, 0, .175].forEach(x => add(mesh(new THREE.BoxGeometry(.012, 1.3, .02), seam, x, .66, z + .055))); [.3, .95].forEach(y => { add(mesh(new THREE.BoxGeometry(.5, .05, .02), iron, -.08, y, z + .06)); add(mesh(sph(.03), iron, -.3, y, z + .06)); });
    add(mesh(sph(.045), fine(0xffc857), .24, .6, z + .08)); const pane = add(mesh(new THREE.BoxGeometry(.16, .16, .03), winMat, 0, 1.12, z + .05)); pane.rotation.z = Math.PI / 4;
    add(mesh(new THREE.BoxGeometry(.04, .04, .2), iron, .6, 1.42, z + .1)); add(mesh(new THREE.BoxGeometry(.03, .1, .03), iron, .6, 1.37, z + .18)); add(mesh(new THREE.BoxGeometry(.13, .17, .13), lampMat, .6, 1.24, z + .18));
    add(mesh(new THREE.BoxGeometry(.17, .03, .17), iron, .6, 1.34, z + .18)); add(mesh(new THREE.BoxGeometry(.17, .03, .17), iron, .6, 1.14, z + .18)); const lh = halo(0xffc46b, .9, 0); lh.position.set(.6, 1.24, z + .3); add(lh); winHalos.push(lh); }
  // the porch: plank deck, square posts with brackets, two stone steps and a doormat
  add(mesh(new THREE.BoxGeometry(1.7, .12, .95), plank, 0, .14, 1.58)); add(mesh(new THREE.BoxGeometry(1.74, .08, .06), dark, 0, .1, 2.06));
  const ph = sz === 3 ? 1.52 : 1.27; [-.76, .76].forEach(x => { add(mesh(new THREE.BoxGeometry(.1, ph, .1), wood, x, .2 + ph / 2, 1.98)); add(mesh(new THREE.BoxGeometry(.16, .06, .16), dark, x, .23, 1.98)); add(mesh(new THREE.BoxGeometry(.16, .06, .16), dark, x, .2 + ph - .03, 1.98));
    const br = add(mesh(new THREE.BoxGeometry(.06, .34, .06), wood, x - Math.sign(x) * .12, .2 + ph - .17, 1.98)); br.rotation.z = Math.sign(x) * .75; });
  add(mesh(new THREE.BoxGeometry(.62, .1, .34), stoneM, 0, .05, 2.24)); add(mesh(new THREE.BoxGeometry(.8, .05, .3), stoneM, 0, .025, 2.5)); add(mesh(new THREE.BoxGeometry(.52, .025, .3), fine(0xd97f8f), 0, .215, 1.75));
  // a vine climbing the right-hand corner
  { const stem = fine(0x6f8a4a); for (let i = 0; i < 13; i++) { const t = i / 12, x = 1.16 + Math.sin(t * 7) * .1, y = .25 + t * Math.min(wh - .3, 1.9); if (i < 12) { const sg = add(mesh(new THREE.CylinderGeometry(.014, .018, .2, 5), stem, x, y + .08, fz + .05)); sg.rotation.z = Math.cos(t * 7) * .5; }
      const lf = add(mesh(sph(.075), i % 2 ? leaf : leaf2, x + (i % 2 ? .08 : -.08), y, fz + .07)); lf.scale.set(1.2, .8, .45); if (i % 4 === 2) add(mesh(sph(.04), bloom[i % 5], x, y + .05, fz + .11)); } }
  const chimney = (x, base, h) => { add(mesh(new THREE.BoxGeometry(.36, h, .36), stoneM, x, base + h / 2, -.35)); for (let i = 0; i < 7; i++) add(mesh(new THREE.BoxGeometry(.15, .1, .05), mat(i % 2 ? 0x9a93a8 : 0xc8c2cf), x - .08 + hr(i + x) * .16, base + .12 + i * (h - .2) / 7, -.16));
    add(mesh(new THREE.BoxGeometry(.46, .09, .46), mat(0x8a8290), x, base + h + .04, -.35)); add(mesh(new THREE.CylinderGeometry(.09, .11, .2, 10), mat(0xc9703f), x, base + h + .18, -.35)); return base + h + .3; };
  const strawTop = (x, y, z, r) => { const k = add(mesh(sph(r), ridgeMat, x, y, z)); k.scale.set(1, .7, 1); add(mesh(new THREE.ConeGeometry(r * .45, r * 1.5, 8), ridgeMat, x, y + r * .9, z)); };
  if (sz === 1) { // a thick pointed thatch roof, laid in four overlapping layers with a rolled edge
    add(mesh(new THREE.BoxGeometry(2.72, .1, 2.32), dark, 0, 1.8, 0));
    const H = 1.5, Rb = 2.2; for (let i = 0; i < 4; i++) { const y0 = i * H / 4, y1 = Math.min(H, y0 + H / 4 + .1), c = add(mesh(new THREE.CylinderGeometry(Math.max(.02, Rb * (1 - y1 / H)), Rb * (1 - y0 / H) + .09, y1 - y0, 4), roofMat, 0, 1.84 + (y0 + y1) / 2, 0)); c.rotation.y = Math.PI / 4; c.scale.z = .93; }
    const tg = new THREE.TorusGeometry(Rb + .06, .1, 8, 4); tg.rotateZ(Math.PI / 4); tg.rotateX(Math.PI / 2); const roll = add(mesh(tg, roofMat, 0, 1.9, 0)); roll.scale.z = .93;
    strawTop(0, 3.36, 0, .16);
    const aw = add(mesh(new THREE.BoxGeometry(1.8, .1, .86), roofMat, 0, 1.56, 1.66)); aw.rotation.x = .2; const ar = add(mesh(new THREE.CylinderGeometry(.065, .065, 1.8, 8), roofMat, 0, 1.47, 2.08)); ar.rotation.z = Math.PI / 2;
    house.userData.chim = { x:.75, y:chimney(.75, 2.5, .85), z:-.35 };
  } else { // a thatch roof with two sloping sides, a raised ridge with a patterned edge, and rolled eaves
    const rh = sz === 3 ? 1.5 : 1.4, half = 1.1, over = .36, ang = Math.atan2(rh, half), L = (half + over) / Math.cos(ang), W = 3.1;
    add(mesh(new THREE.BoxGeometry(2.72, .1, 2.32), dark, 0, wh, 0));
    const sh = new THREE.Shape(); sh.moveTo(-half, 0); sh.lineTo(half, 0); sh.lineTo(0, rh); sh.closePath();
    const gg = new THREE.ExtrudeGeometry(sh, { depth:2.6, bevelEnabled:false }); gg.translate(0, 0, -1.3); gg.rotateY(Math.PI / 2); add(mesh(gg, wallMat, 0, wh, 0)); // the pointed wall at each end
    if (st === 'daub') [-1.31, 1.31].forEach(x => { [-1, 1].forEach(sd => { const b = add(mesh(new THREE.BoxGeometry(.08, .1, Math.hypot(half, rh)), dark, x, wh + rh / 2, sd * half / 2)); b.rotation.x = sd * ang; }); add(mesh(new THREE.BoxGeometry(.08, rh - .1, .1), dark, x, wh + rh / 2, 0)); });
    [0, Math.PI].forEach(yaw => { const side = new THREE.Group(); side.rotation.y = yaw; const sl = new THREE.Group(); sl.position.y = wh + rh; sl.rotation.x = ang; side.add(sl); add(side);
      for (let i = 0; i < 4; i++) sl.add(mesh(new THREE.BoxGeometry(W, .2, L / 4 + .16), roofMat, 0, .1 + i * .035, L - (i + .5) * L / 4));
      const roll = mesh(new THREE.CylinderGeometry(.13, .13, W, 10), roofMat, 0, .08, L + .02); roll.rotation.z = Math.PI / 2; sl.add(roll);
      sl.add(mesh(new THREE.BoxGeometry(W + .08, .14, .56), ridgeMat, 0, .29, .24));
      for (let i = 0; i < 11; i++) { const d = mesh(new THREE.BoxGeometry(.2, .12, .2), ridgeMat, -W / 2 + .19 + i * (W - .38) / 10, .285, .52); d.rotation.y = Math.PI / 4; sl.add(d); }
      [.14, .36].forEach(z => sl.add(mesh(new THREE.BoxGeometry(W + .1, .025, .035), seam, 0, .372, z))); });
    const cap = add(mesh(new THREE.CylinderGeometry(.16, .16, W + .1, 10), ridgeMat, 0, wh + rh + .2, 0)); cap.rotation.z = Math.PI / 2; [-1, 1].forEach(sd => strawTop(sd * (W / 2 + .02), wh + rh + .24, 0, .13));
    const top = chimney(.75, wh + rh * .45, 1.25); if (sz === 3) chimney(-.75, wh + rh * .45, 1.25);
    house.userData.chim = { x:.75, y:top, z:-.35 };
    if (sz === 2) { // the loft window, under a rounded "eyebrow" of thatch
      add(mesh(new THREE.BoxGeometry(.86, .66, .9), wallMat, 0, wh + .5, .86));
      const brow = add(mesh(new THREE.CylinderGeometry(.56, .56, 1.02, 14, 1, false, Math.PI / 2, Math.PI), roofMat, 0, wh + .72, .84)); brow.rotation.x = Math.PI / 2; brow.scale.z = .62;
      add(mesh(new THREE.BoxGeometry(.56, .46, .06), trim, 0, wh + .5, 1.31)); add(mesh(new THREE.BoxGeometry(.44, .34, .08), winMat, 0, wh + .5, 1.32)); add(mesh(new THREE.BoxGeometry(.03, .34, .03), white, 0, wh + .5, 1.37)); add(mesh(new THREE.BoxGeometry(.44, .03, .03), white, 0, wh + .5, 1.37));
      add(mesh(new THREE.BoxGeometry(.62, .06, .1), plank, 0, wh + .25, 1.34));
      const hl = halo(0xffc46b, 1.1, 0); hl.position.set(0, wh + .5, 1.5); add(hl); winHalos.push(hl);
      const aw = add(mesh(new THREE.BoxGeometry(1.8, .1, .86), roofMat, 0, 1.56, 1.66)); aw.rotation.x = .2; const ar = add(mesh(new THREE.CylinderGeometry(.065, .065, 1.8, 8), roofMat, 0, 1.47, 2.08)); ar.rotation.z = Math.PI / 2;
    } else { // upstairs windows, and a balcony over the porch with a glass door, turned posts and flower pots
      [-.85, .85].forEach(x => windowAt(x, 2.65, false));
      add(mesh(new THREE.BoxGeometry(1.8, .1, 1), plank, 0, 1.77, 1.6)); add(mesh(new THREE.BoxGeometry(1.84, .07, .06), dark, 0, 1.76, 2.1));
      add(mesh(new THREE.BoxGeometry(.6, 1.06, .08), dark, 0, 2.35, fz)); add(mesh(new THREE.BoxGeometry(.48, .94, .1), wood, 0, 2.33, fz + .02)); add(mesh(new THREE.BoxGeometry(.34, .5, .04), winMat, 0, 2.47, fz + .07));
      add(mesh(new THREE.BoxGeometry(.025, .5, .02), white, 0, 2.47, fz + .1)); add(mesh(new THREE.BoxGeometry(.34, .025, .02), white, 0, 2.47, fz + .1)); add(mesh(sph(.03), fine(0xffc857), .17, 2.14, fz + .08));
      for (let i = 0; i < 9; i++) add(mesh(new THREE.CylinderGeometry(.022, .03, .46, 6), wood, -.72 + i * .18, 2.06, 2.08));
      [1.3, 1.56, 1.82].forEach(z => [-.86, .86].forEach(x => add(mesh(new THREE.CylinderGeometry(.022, .03, .46, 6), wood, x, 2.06, z))));
      add(mesh(new THREE.BoxGeometry(1.84, .06, .08), dark, 0, 2.31, 2.08)); [-.86, .86].forEach(x => { add(mesh(new THREE.BoxGeometry(.08, .06, .92), dark, x, 2.31, 1.64)); add(mesh(new THREE.BoxGeometry(.09, .56, .09), wood, x, 2.08, 2.08)); add(mesh(sph(.06), wood, x, 2.4, 2.08));
        add(mesh(new THREE.CylinderGeometry(.09, .07, .13, 10), mat(0xd9825b), x * .72, 1.89, 1.95)); add(mesh(sph(.1), leaf, x * .72, 2.02, 1.95)); add(mesh(sph(.045), bloom[x > 0 ? 0 : 1], x * .72 + .04, 2.1, 1.98)); });
      const vane = fine(0x4a4450); add(mesh(new THREE.CylinderGeometry(.015, .015, .6, 5), vane, 0, wh + rh + .6, 0)); add(mesh(new THREE.BoxGeometry(.5, .025, .025), vane, 0, wh + rh + .82, 0)); const tip = add(mesh(new THREE.ConeGeometry(.06, .16, 4), vane, .3, wh + rh + .82, 0)); tip.rotation.z = -Math.PI / 2; add(mesh(new THREE.BoxGeometry(.14, .12, .02), vane, -.24, wh + rh + .82, 0));
    }
  }
  bake(house);
}
const buildSite = new THREE.Group(); buildSite.position.copy(house.position); buildSite.userData.kind = 'buildsite'; scene.add(buildSite);
const siteStones = new THREE.Group(), siteFrame = new THREE.Group(), siteWalls = new THREE.Group(); buildSite.add(siteStones, siteFrame, siteWalls);
{ const h = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .5, 16), new THREE.MeshBasicMaterial({ visible:false })); h.position.y = .25; buildSite.add(h); } // the whole foundation answers a tap, not just the stones around it
for (let i=0;i<14;i++){ const a = i/14*Math.PI*2, x = Math.cos(a)*1.45, z = Math.sin(a)*1.25; const st = mesh(new THREE.DodecahedronGeometry(.2), mat(0xb3aabb), x, .1, z); st.rotation.set(i, i*2, 0); siteStones.add(st); }
siteStones.add(mesh(new THREE.CylinderGeometry(.05,.05,.9,6), mat(0x9b6b4a), 1.7, .45, 1.3)); siteStones.add(mesh(new THREE.BoxGeometry(.7,.4,.06), mat(0xfff1d6), 1.7, .95, 1.33));
siteFrame.add(mesh(new THREE.BoxGeometry(2.7,.14,2.3), mat(0xc98f58), 0, .07, 0));
[[-1.3,1.1],[1.3,1.1],[-1.3,-1.1],[1.3,-1.1]].forEach(([x,z]) => siteFrame.add(mesh(new THREE.BoxGeometry(.16,1.9,.16), mat(0x9b6b4a), x, .95, z)));
[[0,1.1,2.7,0],[0,-1.1,2.7,0],[1.3,0,2.3,1],[-1.3,0,2.3,1]].forEach(([x,z,l,r]) => { const bm = mesh(new THREE.BoxGeometry(l,.14,.14), mat(0x9b6b4a), x, 1.85, z); bm.rotation.y = r*Math.PI/2; siteFrame.add(bm); });
[[0,-1.1,2.6,0],[1.3,0,2.2,1],[-1.3,0,2.2,1],[-.85,1.1,.9,0],[.85,1.1,.9,0]].forEach(([x,z,l,r]) => { for (let k=0;k<4;k++){ const pl = mesh(new THREE.BoxGeometry(l,.38,.08), mat(k%2 ? 0xd9a066 : 0xc98f58), x, .3 + k*.42, z); pl.rotation.y = r*Math.PI/2; siteWalls.add(pl); } });
const campfire = new THREE.Group(); campfire.position.set(-3.3, 0, 1.15); campfire.userData.kind = 'campfire'; scene.add(campfire);
for (let i=0;i<7;i++){ const a = i/7*Math.PI*2; campfire.add(mesh(new THREE.DodecahedronGeometry(.13), mat(0x8a8290), Math.cos(a)*.38, .08, Math.sin(a)*.38)); }
[0,1,2].forEach(i => { const lg = mesh(new THREE.CylinderGeometry(.06,.06,.6,6), mat(0x7a5236), 0, .12, 0); lg.rotation.set(Math.PI/2, i*Math.PI/3, 0); campfire.add(lg); });
const flame = mesh(new THREE.ConeGeometry(.18,.5,8), glow(0xffa94d), 0, .35, 0); campfire.add(flame); const flameHalo = halo(0xffa94d, 2.2, .6); flameHalo.position.y = .4; campfire.add(flameHalo);
const workbench = new THREE.Group(); workbench.position.set(-6.3, 0, .2); workbench.userData.kind = 'workbench'; scene.add(workbench);
workbench.add(mesh(new THREE.CylinderGeometry(.42,.5,.55,14), mat(0x9b6b4a), 0, .27, 0)); workbench.add(mesh(new THREE.CylinderGeometry(.43,.43,.03,14), mat(0xd9a066), 0, .56, 0));
workbench.add(mesh(new THREE.BoxGeometry(.08,.35,.08), mat(0x9b6b4a), .15, .72, .05).rotateZ(.6)); workbench.add(mesh(new THREE.DodecahedronGeometry(.08), mat(0x8a8290), .28, .82, .05));
const pickupGroup = new THREE.Group(); scene.add(pickupGroup);
const nodes = [];
const addNode = (kind, ore, x, y, z, i) => { const g = new THREE.Group(); g.position.set(x, y, z); g.userData = { kind, ore, key:`${ore}${i}` };
  if (kind === 'claypit') { const m = mesh(sph(.5), mat(0xb8653f), 0, 0, 0); m.scale.set(1.3, .22, 1); g.add(m); g.add(mesh(sph(.2), mat(0x9c4f30), .3, .06, .1)); }
  else if (kind === 'sandpit') { const m = mesh(sph(.55), mat(0xead9a6), 0, 0, 0); m.scale.set(1.3, .18, 1.05); g.add(m); for (let k = 0; k < 4; k++) g.add(mesh(sph(.12), mat(0xdcc68a), Math.cos(k * 1.7) * .35, .05, Math.sin(k * 1.7) * .3)); g.add(mesh(new THREE.TorusGeometry(.12, .035, 6, 12), mat(0xffd9e0), -.2, .07, .2).rotateX(Math.PI / 2)); } /* pale sand, with a little shell in it */
  else { const r = mesh(new THREE.DodecahedronGeometry(.45), mat(ore === 'copper' ? 0x8f8a92 : 0x5f5a68), 0, .3, 0); r.rotation.set(i, i*2, 0); g.add(r);
    for (let k=0;k<5;k++){ const a = k*1.3; g.add(mesh(sph(.08), mat(ore === 'copper' ? 0x3fbf8f : 0xc9c9d9, ore === 'tin' ? { metalness:.6, roughness:.3 } : {}), Math.cos(a)*.38, .3 + Math.sin(k)*.2, Math.sin(a)*.38)); } }
  scene.add(g); nodes.push(g); };
[[-7.5,1.1],[3.0,-7.45]].forEach(([x,z],i) => addNode('claypit', 'clay', x, 0, z, i));
[[5.5,-4.8],[6,1.8]].forEach(([x,z],i) => addNode('claypit', 'clay', ORCH_POS.x + x, ORCH_POS.y, ORCH_POS.z + z, i + 2));
[[-5.5,-3],[-2,-6.2],[4.2,-5.4]].forEach(([x,z],i) => addNode('ore', 'copper', ORCH_POS.x + x, ORCH_POS.y, ORCH_POS.z + z, i));
addNode('ore', 'tin', WIND_POS.x + 5, WIND_POS.y, WIND_POS.z - 4.5, 0);
[[-6.6,2.6],[2.4,6.2],[-3.8,5.6]].forEach(([x,z],i) => addNode('sandpit', 'sand', ORCH_POS.x + x, ORCH_POS.y, ORCH_POS.z + z, i));
const kiln = new THREE.Group(); kiln.position.set(-5.9, 0, 2.1); kiln.userData.kind = 'kiln'; scene.add(kiln);
const kilnDome = mesh(new THREE.SphereGeometry(.75, 18, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xc0703f), 0, 0, 0); kiln.add(kilnDome);
kiln.add(mesh(new THREE.CylinderGeometry(.16,.2,.5,10), mat(0x9c4f30), .2, .85, -.2));
const kilnMouth = mesh(new THREE.CircleGeometry(.22, 14, 0, Math.PI), glow(0xff8a3c), 0, .02, .74); kiln.add(kilnMouth);
const furnace = new THREE.Group(); furnace.position.set(-7.3, 0, -1.6); furnace.userData.kind = 'furnace'; scene.add(furnace);
furnace.add(mesh(new THREE.CylinderGeometry(.5,.7,1.3,12), mat(0xa8603a), 0, .65, 0)); furnace.add(mesh(new THREE.CylinderGeometry(.3,.45,.3,12), mat(0x8a4a2e), 0, 1.45, 0));
const furnaceGlow = mesh(new THREE.CircleGeometry(.18, 12), glow(0xffc857), 0, .45, .6); furnace.add(furnaceGlow); const furnaceHalo = halo(0xff9a3c, 1.8, .5); furnaceHalo.position.set(0, .45, .7); furnace.add(furnaceHalo);
[-.85,.85].forEach(x => { house.add(mesh(new THREE.BoxGeometry(.62,.14,.22), mat(0x9b6b4a), x, .77, 1.2));
  for (let i=0;i<4;i++) house.add(mesh(sph(.07), mat([0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff][i]), x - .22 + i*.15, .88, 1.22)); });
house.add(mesh(sph(.05), mat(0xffc857, { metalness:.5 }), .22, .55, 1.18));
drawHouse();
const smoke = []; for (let i=0;i<5;i++){ const sm = halo(0xffffff, .5, 0, false); scene.add(sm); smoke.push(sm); }
// --- paths: one connected network of stepping stones on a soft packed-earth track ---
// hut door to the garden gate; from the gate, around the back of the garden past the sell crate to the Orchard bridge; and a branch to the Town Square bridge
const stones = new THREE.Group(); scene.add(stones);
const stoneMat = mat(0xe4dccd), stoneMat2 = mat(0xd6ccbb);
const WALKWAYS = [
  [[-4,-.95],[-3.65,-.35],[-2.85,-.1],[-1.9,-.15],[-.95,.15],[-.1,.55],[.55,.7]],
  [[-.35,.4],[-.5,-.7],[-.5,-1.9],[.1,-2.6],[1.7,-2.72],[3.1,-2.72],[4.3,-2.62],[5.35,-2.3],[6.15,-1.2],[6.75,.1],[7.5,.95],[8.2,1.2]],
  [[4.3,-2.62],[4.5,-3.6],[4.42,-4.9],[4.4,-6.1],[4.5,-6.75]],
];
const pathPts = []; // every stone, so grass and other things can stay off the path
const trackTex = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 64; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.28, 'rgba(255,255,255,.85)'); gr.addColorStop(.72, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 8, 64); const t = new THREE.CanvasTexture(c); return t; })();
const trackMat = new THREE.MeshStandardMaterial({ color:0xc8a878, map:trackTex, transparent:true, opacity:.55, depthWrite:false, roughness:1, polygonOffset:true, polygonOffsetFactor:-1 });
WALKWAYS.forEach((pts, pi) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'), len = curve.getLength();
  // the soft track: a ribbon along the curve that fades out at its edges
  const n = Math.ceil(len / .25), pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) { const k = i / n, p = curve.getPointAt(k), t = curve.getTangentAt(k), sx = -t.z, sz = t.x, w = .62;
    pos.push(p.x + sx * w, .018, p.z + sz * w, p.x - sx * w, .018, p.z - sz * w); uv.push(k * len, 0, k * len, 1);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); tg.setIndex(idx); tg.computeVertexNormals();
  const track = new THREE.Mesh(tg, trackMat); track.receiveShadow = true; track.renderOrder = -1; stones.add(track);
  // stepping stones every .62, alternating a little left and right like real steps
  const m = Math.max(2, Math.round(len / .62));
  for (let i = pi ? 1 : 0; i <= m; i++) { const k = i / m, p = curve.getPointAt(k), t = curve.getTangentAt(k), side = (i % 2 ? 1 : -1) * .09, r = .25 + ((i * 7) % 3) * .025;
    const st = mesh(new THREE.CylinderGeometry(r, r + .03, .06, 9), i % 3 ? stoneMat : stoneMat2, p.x - t.z * side, .025, p.z + t.x * side);
    st.rotation.y = i * 1.3; st.scale.set(1, 1, .82); st.castShadow = false; stones.add(st); pathPts.push([st.position.x, st.position.z]); } });
// keep the grass off the paths
tuftData.forEach(d => { if (Math.abs(d.y) < 1 && pathPts.some(([x, z]) => Math.hypot(d.x - x, d.z - z) < .55)) d.y = -50; });
const rocks = [[-7.1,3,.42],[5.8,-6,.38],[6.55,-5.3,.45],[-6.5,3.7,.36]].map(([x,z,r],i) => { const rk = mesh(new THREE.DodecahedronGeometry(r), mat(0xb3aabb, { map:tx('stone', 2, 2) }), x, r*.5, z); rk.rotation.set(i, i*2, 0); rk.userData = { kind:'rock', key:'rock'+i }; scene.add(rk);
  [[.9,-.3,.4,.38],[-.75,-.35,.6,.3],[.2,-.4,-.95,.26]].forEach(([dx, dy, dz, k], j) => { const sm = mesh(new THREE.DodecahedronGeometry(r * k), mat(j % 2 ? 0x9a93a8 : 0xc8c2cf), dx * r, dy * r, dz * r); sm.rotation.set(j, i, j * 2); rk.add(sm); }); { const ms = mesh(sph(r * .32), mat(0x7fbf6a), r * .3, r * .72, r * .2); ms.scale.set(1.3, .35, 1); rk.add(ms); } return rk; });

// --- sell crate ---
const mailbox = new THREE.Group(); mailbox.position.set(-1.75, 0, -1.35); // beside the path, facing you
mailbox.add(mesh(new THREE.CylinderGeometry(.05,.06,.9,8), mat(0x9b6b4a), 0, .45, 0));
const mbox = mesh(new THREE.CapsuleGeometry(.18,.35,4,10), mat(0x7ec8e3), 0, 1, 0); mbox.rotation.z = Math.PI/2; mailbox.add(mbox);
const mflag = new THREE.Group(); mflag.position.set(.2, 1, .1); mailbox.add(mflag);
mflag.add(mesh(new THREE.BoxGeometry(.03,.3,.03), mat(0x3b2f4a), 0, .15, 0)); mflag.add(mesh(new THREE.BoxGeometry(.14,.1,.02), mat(0xff5a5a), .07, .26, 0));
mailbox.userData.kind = 'mailbox';
const crate = new THREE.Group(); crate.position.set(5.2,0,-.3); // by the garden, on the path to the Orchard bridge
{ const slat = mat(0xd9a066), dark = mat(0xa8703f); // an open wooden crate with a gold coin on the front and produce peeking out
  crate.add(mesh(new THREE.BoxGeometry(.94,.72,.94), slat, 0, .38, 0));
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => crate.add(mesh(new THREE.BoxGeometry(.11,.8,.11), dark, sx*.46, .4, sz*.46)));
  [.2, .52].forEach(y => crate.add(mesh(new THREE.BoxGeometry(.98,.06,.98), dark, 0, y, 0)));
  crate.add(mesh(new THREE.BoxGeometry(1.02,.07,1.02), dark, 0, .78, 0));
  [[-.2,-.12,0xff6b6b],[.14,.1,0xffa94d],[.18,-.2,0x8fdc8a],[-.12,.2,0xffd36b]].forEach(([x, z, c]) => crate.add(mesh(sph(.14), mat(c), x, .74, z)));
  const coin = mesh(new THREE.CylinderGeometry(.14,.14,.03,24), mat(0xffc857, { metalness:.45, roughness:.35 }), 0, .44, .5); coin.rotation.x = Math.PI/2; crate.add(coin); }
crate.userData.kind = 'crate'; scene.add(crate);

// --- signs: one design everywhere. Two planks of warm wood in a darker frame, on two capped posts, lettered on both sides.
// Every sign is the same size and height, stands level, and faces you. The lettering is drawn at the board's exact shape, so it never stretches.
const SIGN_W = 1.3, SIGN_H = .42, SIGN_TOP = 1.4, signFaces = [];
const SQ_SIGN = [-3.2, 0, 3.0]; // the Town Square sign: at the entrance, on the left as you arrive (the planters line the right)
function signText(text, w = SIGN_W, h = SIGN_H) { const c = document.createElement('canvas'); c.width = 640; c.height = Math.round(640 * h / w); const x = c.getContext('2d'), W = c.width, H = c.height;
  ['#c98f58', '#be844f'].forEach((col, i) => { x.fillStyle = col; x.fillRect(0, i * H / 2, W, H / 2); }); // two planks
  x.strokeStyle = 'rgba(90,58,40,.16)'; x.lineWidth = 2; // a soft wood grain
  for (let i = 0; i < 8; i++) { const y0 = (i + .5) * H / 8; x.beginPath(); x.moveTo(0, y0); for (let px = 0; px <= W; px += 32) x.lineTo(px, y0 + Math.sin(px / 70 + i * 1.7) * 2.2); x.stroke(); }
  x.fillStyle = 'rgba(80,50,34,.4)'; x.fillRect(0, H / 2 - 2, W, 4); // the seam between the planks
  let fs = Math.round(H * .4); const font = () => `800 ${fs}px "Baloo 2", system-ui, sans-serif`; x.font = font();
  while (x.measureText(text).width > W * .84 && fs > 18) { fs -= 2; x.font = font(); } // only a long custom name gets smaller
  x.textAlign = 'center'; x.textBaseline = 'middle'; const ty = H / 2 + fs * .07;
  x.fillStyle = 'rgba(60,34,20,.6)'; x.fillText(text, W / 2 + 2, ty + 3); // carved into the wood
  x.lineJoin = 'round'; x.lineWidth = Math.max(3, fs * .07); x.strokeStyle = 'rgba(70,40,24,.55)'; x.strokeText(text, W / 2, ty);
  x.fillStyle = '#fffaf0'; x.fillText(text, W / 2, ty);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace; return tex; }
function signBoard(text, w = SIGN_W, h = SIGN_H, top = SIGN_TOP) { const g = new THREE.Group(), post = mat(0x8a5a3a), frame = mat(0x6e4630);
  [-1, 1].forEach(sd => { const px = sd * (w / 2 + .03);
    g.add(mesh(new THREE.BoxGeometry(.11, top + .06, .11), post, px, (top + .06) / 2, 0));
    const cap = mesh(new THREE.ConeGeometry(.095, .1, 4), post, px, top + .11, 0); cap.rotation.y = Math.PI / 4; g.add(cap); });
  const board = new THREE.Group(); board.position.y = top - h / 2 - .05; g.add(board);
  board.add(mesh(new THREE.BoxGeometry(w + .1, h + .1, .08), frame, 0, 0, 0));
  const e = { text, w, h, face:new THREE.MeshStandardMaterial({ map:signText(text, w, h), roughness:.85 }) }; signFaces.push(e);
  [1, -1].forEach(sd => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), e.face); pl.position.z = sd * .042; if (sd < 0) pl.rotation.y = Math.PI; pl.receiveShadow = true; board.add(pl); });
  const hb = hitBox(w + .3, top + .25, .5); hb.position.y = (top + .25) / 2; g.add(hb); // tap anywhere on the sign, posts included
  g.userData.setText = t => { e.text = t; e.face.map.dispose(); e.face.map = signText(t, w, h); e.face.needsUpdate = true; }; return g; }
// notice boards get a printed face the same way: a title and neat, evenly spaced cards
function boardText(title, w, h, kind) { const c = document.createElement('canvas'); c.width = 640; c.height = Math.round(640 * h / w); const x = c.getContext('2d'), W = c.width, H = c.height;
  const rr = (X, Y, w2, h2, r) => { x.beginPath(); x.roundRect(X, Y, w2, h2, r); x.fill(); };
  x.fillStyle = kind === 'founders' ? '#fff1d6' : '#d6b485'; x.fillRect(0, 0, W, H);
  if (kind !== 'founders') { x.fillStyle = 'rgba(120,80,40,.18)'; for (let i = 0; i < 260; i++) x.fillRect((i * 97) % W, (i * 61) % H, 3, 3); } // cork
  else { x.strokeStyle = '#d9a441'; x.lineWidth = 6; x.strokeRect(12, 12, W - 24, H - 24); }
  const tH = H * .24; x.fillStyle = kind === 'founders' ? 'rgba(0,0,0,0)' : '#fff4dc'; rr(W * .22, H * .07, W * .56, tH, 14);
  x.fillStyle = '#6e4630'; x.font = `800 ${Math.round(tH * .62)}px "Baloo 2", system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, W / 2, H * .07 + tH / 2 + 2);
  const cols = 3, rows = kind === 'founders' ? 2 : 2, gx = W * .1, gy = H * .38, cw = (W - gx * 2 - (cols - 1) * 22) / cols, ch = (H - gy - H * .08 - (rows - 1) * 18) / rows;
  const tints = kind === 'founders' ? ['#f6dfa4'] : ['#fff8ee', '#ffd9e1', '#fff3b8', '#dff1ff', '#e6f6de', '#fff8ee'];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const X = gx + k * (cw + 22), Y = gy + r * (ch + 18);
    x.fillStyle = 'rgba(60,40,30,.18)'; rr(X + 3, Y + 4, cw, ch, 8); x.fillStyle = tints[(r * cols + k) % tints.length]; rr(X, Y, cw, ch, 8);
    x.fillStyle = 'rgba(110,70,48,.35)'; for (let l = 0; l < 3; l++) x.fillRect(X + cw * .16, Y + ch * (.34 + l * .2), cw * (l === 2 ? .45 : .68), 4); // tidy lines of writing
    if (kind !== 'founders') { x.fillStyle = ['#e0566f', '#2c9c7d', '#5a4b99'][(r + k) % 3]; x.beginPath(); x.arc(X + cw / 2, Y + 10, 7, 0, 7); x.fill(); } } // a pin
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8; tex.colorSpace = THREE.SRGBColorSpace; return tex; }
function boardFace(title, w, h, kind) { const e = { board:true, title, w, h, kind, face:new THREE.MeshStandardMaterial({ map:boardText(title, w, h, kind), roughness:.9 }) }; signFaces.push(e);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), e.face); pl.receiveShadow = true; return pl; }
// the lettering is drawn before the font arrives, so draw every sign again once it has
try { document.fonts.load('800 60px "Baloo 2"').then(() => signFaces.forEach(e => { e.face.map.dispose(); e.face.map = e.board ? boardText(e.title, e.w, e.h, e.kind) : signText(e.text, e.w, e.h); e.face.needsUpdate = true; })); } catch {}
// --- bridge + sign ---
const sign = new THREE.Group(); sign.position.set(7.25,0,2.4); sign.add(signBoard('Orchard Isle')); // beside the bridge, facing you
sign.userData.kind = 'sign'; scene.add(sign);
const bridge = new THREE.Group(); scene.add(bridge);
let bridgePlanks = [];
const bridge2 = new THREE.Group(); scene.add(bridge2);
function layBridge(group, from, to, n, fixed) {
  group.children.forEach(c => { const i = walkables.indexOf(c); if (i >= 0) walkables.splice(i, 1); bridgePlanks.splice(bridgePlanks.indexOf(c) >>> 0, bridgePlanks.includes(c) ? 1 : 0); });
  group.clear();
  const ang = -Math.atan2(to.z-from.z, to.x-from.x), side = new THREE.Vector3(-(to.z-from.z), 0, to.x-from.x).normalize();
  for (let i=0;i<n;i++){
    if (!fixed && (i>3 && i<n-2)) continue; // broken middle
    const k = i/(n-1), p = from.clone().lerp(to, k); p.y -= Math.sin(k*Math.PI)*.5;
    const plank = mesh(new THREE.BoxGeometry(.72,.12,1.5), mat(i%2?0xd9a066:0xc98f58), p.x, p.y, p.z);
    plank.rotation.y = ang; group.add(plank);
    if (fixed) { walkables.push(plank); bridgePlanks.push(plank); }
  }
  if (fixed) [-1,1].forEach(s => { // rope rails
    const pts = []; for (let i=0;i<=20;i++){ const k=i/20, p = from.clone().lerp(to,k); p.y += .7 - Math.sin(k*Math.PI)*.5; p.addScaledVector(side, s*.72); pts.push(p); }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .035, 6), mat(0xc9a27a)));
  });
  group.updateMatrixWorld(true);
}
function buildBridge() {
  layBridge(bridge, new THREE.Vector3(8.4,-.07,1.2), new THREE.Vector3(20.6,-1.57,2.7), 20, S.bridge);
  layBridge(bridge2, new THREE.Vector3(28.3,-1.57,-4.5), new THREE.Vector3(29.6,-3.07,-12.4), 14, S.bridge2);
}
buildBridge();
const sign2 = new THREE.Group(); sign2.position.set(ORCH_POS.x + 1.4, ORCH_POS.y, ORCH_POS.z - 7.1);
sign2.add(signBoard('Windmill Isle'));
sign2.userData.kind = 'sign2'; scene.add(sign2);

// --- windmill isle ---
const windmill = new THREE.Group(); windmill.position.set(WIND_POS.x + 1, WIND_POS.y, WIND_POS.z - 1.5);
windmill.add(mesh(new THREE.CylinderGeometry(1.1,1.6,4,20), mat(0xfff6e6), 0, 2, 0));
windmill.add(mesh(new THREE.ConeGeometry(1.35,1.4,20), mat(0x7ec8e3), 0, 4.7, 0));
windmill.add(mesh(new THREE.BoxGeometry(.8,1.3,.1), mat(0x9b6b4a), 0, .65, 1.55));
windmill.add(mesh(new THREE.BoxGeometry(.5,.5,.08), winMat, 0, 2.6, 1.28));
const blades = new THREE.Group(); blades.position.set(0, 3.9, 1.35); windmill.add(blades);
blades.add(mesh(sph(.22), mat(0x9b6b4a)));
for (let i=0;i<4;i++){ const arm = new THREE.Group(); arm.rotation.z = i*Math.PI/2 + .3;
  arm.add(mesh(new THREE.BoxGeometry(.12,2.4,.08), mat(0x9b6b4a), 0, 1.3, 0));
  arm.add(mesh(new THREE.BoxGeometry(.55,1.9,.04), mat(0xfff1d6), .3, 1.5, .02)); blades.add(arm); }
const millstone = mesh(new THREE.CylinderGeometry(.6,.6,.25,24), mat(0xb0a898), 2, .13, 1.2); windmill.add(millstone);
windmill.userData.kind = 'windmill'; scene.add(windmill);
const sunflowers = new THREE.Group(); sunflowers.position.copy(WIND_POS); scene.add(sunflowers);
for (let i=0;i<9;i++){ const a = i*.7 + 2.2, r = 4.5 + (i%3)*.8, x = Math.cos(a)*r, z = Math.sin(a)*r;
  sunflowers.add(mesh(new THREE.CylinderGeometry(.04,.05,1.3,6), mat(0x4fb46a), x, .65, z));
  const head = mesh(new THREE.CylinderGeometry(.28,.28,.08,16), mat(0xffc857), x, 1.35, z); head.rotation.x = 1.2; sunflowers.add(head);
  sunflowers.add(mesh(new THREE.CylinderGeometry(.14,.14,.1,12), mat(0x7a5236), x, 1.37, z + .03).rotateX(1.2));
  const h = hitBox(.7, 1.6, .7); h.position.set(x, .8, z); sunflowers.add(h); deco(h, () => sunflowerSeeds(i)); }
const boulder = new THREE.Group(); boulder.position.set(WIND_POS.x + 4.5, WIND_POS.y, WIND_POS.z + 3.2);
const rock = mesh(new THREE.DodecahedronGeometry(.9), mat(0x9a93a8), 0, .7, 0); rock.scale.set(1.2,.9,1); boulder.add(rock);
const rosettaStone = mesh(new THREE.BoxGeometry(.6,.8,.15), mat(0x4a4458), 0, .4, 0); rosettaStone.visible = false; boulder.add(rosettaStone);
boulder.userData.kind = 'boulder'; scene.add(boulder);
// the bridge of light: only there after 8 PM, once the windmill spins
const lightBridge = new THREE.Group(); scene.add(lightBridge);
const lightMat = new THREE.MeshBasicMaterial({ color:0x9fe7e0, transparent:true, opacity:.85 });
let lightLit = null;
function drawLightBridge(on) {
  lightBridge.children.forEach(c => { const i = walkables.indexOf(c); if (i >= 0) walkables.splice(i, 1); const j = bridgePlanks.indexOf(c); if (j >= 0) bridgePlanks.splice(j, 1); });
  lightBridge.clear(); lightLit = on; if (!on) return;
  const from = new THREE.Vector3(37.7,-3.07,-19.3), to = new THREE.Vector3(46.3,-2.57,-16.2), n = 14, ang = -Math.atan2(to.z-from.z, to.x-from.x);
  for (let i=0;i<n;i++){ const k = i/(n-1), p = from.clone().lerp(to, k); p.y -= Math.sin(k*Math.PI)*.4;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(.72,.08,1.4), lightMat); plank.position.copy(p); plank.rotation.y = ang;
    lightBridge.add(plank); walkables.push(plank); bridgePlanks.push(plank); }
  lightBridge.updateMatrixWorld(true);
}
const nightStuff = new THREE.Group(); nightStuff.position.copy(NIGHT_POS); scene.add(nightStuff);
for (let i=0;i<14;i++){ const a = i*2.4, r = 2 + (i*1.7)%4.5, x = Math.cos(a)*r, z = Math.sin(a)*r, c = [0x9fe7e0, 0xff9fe0, 0xfff3a0][i%3];
  nightStuff.add(mesh(new THREE.CylinderGeometry(.05,.07,.3,8), mat(0xfff1d6), x, .15, z));
  nightStuff.add(mesh(new THREE.SphereGeometry(.18,14,8,0,Math.PI*2,0,Math.PI/2), glow(c), x, .28, z)); const mh = halo(c, .9, .55); mh.position.set(x, .35, z); nightStuff.add(mh);
  const h = hitBox(.5, .5, .5); h.position.set(x, .25, z); nightStuff.add(h); deco(h, () => glowMushroom(mh)); }
const easel = new THREE.Group(); easel.position.set(NIGHT_POS.x, NIGHT_POS.y, NIGHT_POS.z - 1.8);
[-.35,.35].forEach(x => { const l = mesh(new THREE.CylinderGeometry(.04,.04,1.6,6), mat(0x9b6b4a), x, .8, 0); l.rotation.z = -x*.3; easel.add(l); });
easel.add(mesh(new THREE.BoxGeometry(1,.8,.06), mat(0xfff6e6), 0, 1.25, .08));
easel.add(mesh(new THREE.CircleGeometry(.22, 24), glow(0xfff3a0), .1, 1.3, .12));
easel.userData.kind = 'easel'; scene.add(easel);
const darkroom = new THREE.Group(); darkroom.position.set(NIGHT_POS.x + 3, NIGHT_POS.y, NIGHT_POS.z + .8);
// the camera obscura: a little dark house with 1 tiny window (still dark, but with some charm)
darkroom.add(mesh(new THREE.BoxGeometry(1.8,1.6,1.8), mat(0x3b2f4a), 0, .8, 0));
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => darkroom.add(mesh(new THREE.BoxGeometry(.14,1.66,.14), mat(0xc98f58), sx*.9, .83, sz*.9)));
darkroom.add(mesh(new THREE.BoxGeometry(1.96,.1,1.96), mat(0xc98f58), 0, 1.62, 0));
darkroom.add(mesh(new THREE.ConeGeometry(1.5,.75,4), mat(0x2d3a6b), 0, 2.02, 0).rotateY(Math.PI/4));
darkroom.add(mesh(new THREE.OctahedronGeometry(.12), glow(0xffe07a), 0, 2.5, 0));
darkroom.add(mesh(new THREE.BoxGeometry(.6,1,.05), mat(0x5a3a28), -.45, .5, .91)); darkroom.add(mesh(sph(.04), mat(0xd9a441, { metalness:.6 }), -.25, .5, .95));
darkroom.add(mesh(new THREE.TorusGeometry(.1,.03,8,18), mat(0xd9a441, { metalness:.6, roughness:.3 }), .45, 1.1, .92)); darkroom.add(mesh(sph(.05), glow(0xffffff), .45, 1.1, .92));
darkroom.userData.kind = 'darkroom'; scene.add(darkroom);
const crystals = new THREE.Group(); crystals.position.set(NIGHT_POS.x - 3, NIGHT_POS.y, NIGHT_POS.z - .5);
[[0,1.4],[.45,1],[-.4,.8],[.2,.6],[-.2,.5]].forEach(([x,h],i) => crystals.add(mesh(new THREE.ConeGeometry(.14,h,6), new THREE.MeshStandardMaterial({ color:0xc9b6ff, emissive:0x8f7bff, emissiveIntensity:.6, roughness:.2 }), x, h/2, (i%2)*.25)));
const crystalHalo = halo(0x8f7bff, 3.2, .45); crystalHalo.position.y = .7; crystals.add(crystalHalo);
crystals.userData.kind = 'crystals'; scene.add(crystals);
// --- the Old Heart: the center of the old village ---
const OH = new THREE.Vector3(-2, -1, -48);
const OLD = island(11, OH.x, OH.y, OH.z); SEASON_ISLES.push(OLD);
const heart = new THREE.Group(); heart.position.copy(OH); scene.add(heart);
for (let i=0;i<9;i++){ const a = i/9*Math.PI*2 + .2, r = 9, broken = i%3 === 1;
  deco(heart.add(mesh(new THREE.CylinderGeometry(.35,.4, broken ? 1.1 : 2.6, 12), mat(0xe8e0d0), Math.cos(a)*r, broken ? .55 : 1.3, Math.sin(a)*r)).children.at(-1), () => factCard('THE OLD HEART', 'Old columns', TAP_FACTS.column, 'col')); }
heart.add(mesh(new THREE.CylinderGeometry(3,3.2,.2,40), mat(0xd8cfc0), 0, .1, 0));
const greatBell = new THREE.Group(); greatBell.position.set(OH.x, OH.y, OH.z);
const gbBody = mesh(new THREE.CylinderGeometry(.55,1.1,1.4,28, 1, true), mat(0xd9a441, { metalness:.55, roughness:.35, side:THREE.DoubleSide }), 0, 0, 0);
const gbTop = mesh(sph(.56), mat(0xd9a441, { metalness:.55, roughness:.35 }), 0, .7, 0); gbTop.scale.y = .5;
const crack = mesh(new THREE.BoxGeometry(.05,.9,.05), mat(0x3b2f4a), .7, -.1, .6); crack.rotation.z = .3;
const gbSwing = new THREE.Group(); gbSwing.add(gbBody, gbTop, crack); greatBell.add(gbSwing);
greatBell.userData.kind = 'greatbell'; scene.add(greatBell);
const bellFrame = new THREE.Group(); bellFrame.position.copy(OH); bellFrame.userData.kind = 'bellframe'; scene.add(bellFrame);
const frameMarker = new THREE.Group(); bellFrame.add(frameMarker);
[[-1.8,0],[1.8,0]].forEach(([x,z]) => { const st = mesh(new THREE.DodecahedronGeometry(.32), mat(0xb3aabb), x, .22, z); st.scale.y = .7; frameMarker.add(st); });
// see-through outline of the frame you are about to build
const ghostMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.28, depthWrite:false });
[-1.8,1.8].forEach(x => frameMarker.add(mesh(new THREE.BoxGeometry(.3,4.2,.3), ghostMat, x, 2.1, 0)));
frameMarker.add(mesh(new THREE.BoxGeometry(4.1,.35,.35), ghostMat, 0, 4.2, 0));
// the pile of building materials you tap to build the frame and fix its gears
const lumberPile = new THREE.Group(); lumberPile.position.set(OH.x + 3.4, OH.y, OH.z + 1.8); lumberPile.userData.kind = 'bellframe'; scene.add(lumberPile);
for (let i=0;i<5;i++){ const bm = mesh(new THREE.BoxGeometry(1.8,.2,.26), mat(i%2 ? 0xc98f58 : 0xb87d45), 0, .12 + Math.floor(i/2)*.21, (i%2 ? .15 : -.15) + (i > 3 ? 0 : 0)); bm.rotation.y = i%2 ? .08 : -.05; lumberPile.add(bm); }
const coil = mesh(new THREE.TorusGeometry(.28,.07,8,20), mat(0xc9a27a), -1.2, .08, .45); coil.rotation.x = Math.PI/2; lumberPile.add(coil);
[[1.25,.5],[1.1,-.5]].forEach(([x,z],i) => { const st = mesh(new THREE.DodecahedronGeometry(.34), mat(0xb3aabb), x, .28, z); st.rotation.set(i, i*2, 0); lumberPile.add(st); });
const pileGear = new THREE.Group(); pileGear.position.set(0, .72, 0); lumberPile.add(pileGear);
pileGear.add(mesh(new THREE.CylinderGeometry(.35,.35,.1,20), mat(0xc98f58)));
for (let i=0;i<10;i++){ const a = i/10*Math.PI*2; pileGear.add(mesh(new THREE.BoxGeometry(.12,.1,.12), mat(0xc98f58), Math.cos(a)*.4, 0, Math.sin(a)*.4)); }
const framePosts = new THREE.Group(); bellFrame.add(framePosts);
[-1.8,1.8].forEach(x => framePosts.add(mesh(new THREE.BoxGeometry(.3,4.2,.3), mat(0x9b6b4a), x, 2.1, 0)));
framePosts.add(mesh(new THREE.BoxGeometry(4.1,.35,.35), mat(0x9b6b4a), 0, 4.2, 0));
[-1,1].forEach(sd => { const br = mesh(new THREE.BoxGeometry(.15,1.3,.15), mat(0x8a6445), sd*1.35, 3.6, 0); br.rotation.z = sd*.8; framePosts.add(br); });
const frameGear = new THREE.Group(); frameGear.position.set(2.05, 4.2, 0); bellFrame.add(frameGear);
frameGear.add(mesh(new THREE.CylinderGeometry(.55,.55,.12,24), mat(0xc98f58), 0, 0, 0).rotateZ(Math.PI/2));
for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; frameGear.add(mesh(new THREE.BoxGeometry(.12,.14,.14), mat(0xc98f58), 0, Math.cos(a)*.62, Math.sin(a)*.62)); }
const ship2 = new THREE.Group(); ship2.position.set(OH.x + 10.1, OH.y, OH.z + .2); ship2.rotation.y = -1.45;
const hull2 = mesh(new THREE.SphereGeometry(1.2, 20, 10, 0, Math.PI*2, Math.PI/2, Math.PI/2), mat(0x3f86c9), 0, .85, 0); hull2.scale.set(1.5,.75,.75); ship2.add(hull2);
ship2.add(mesh(new THREE.CylinderGeometry(.07,.08,2.6,8), mat(0x9b6b4a), 0, 2.2, 0));
ship2.add(mesh(new THREE.PlaneGeometry(1.3,1.5), new THREE.MeshStandardMaterial({ color:0xfff6e6, side:THREE.DoubleSide }), .7, 2.4, 0));
{ const hb = hitBox(4.2, 4, 2.6); hb.position.y = 1.9; ship2.add(hb); } // easy to tap from any angle
ship2.userData.kind = 'ship2'; scene.add(ship2);
// building sites for rebuilding the village
// village building upgrades: level 2 needs Pottery Age goods, level 3 needs Glass Age goods. Each level changes the building outside, and the neighbor shares a cut of the takings each morning
const BUP = {
  bakery:      [{ name:'Brick oven', needs:{ brick:10, stone:8 }, coins:500, adds:'A brick bread oven beside the bakery. Dishes sell for 25% more.' },
                { name:'Glass shop window', needs:{ glass:4, bronze:1 }, coins:1200, adds:'A glass case of cakes out front, so passers-by stop and buy.' }],
  library:     [{ name:'Reading wing', needs:{ brick:10, log:10 }, coins:600, adds:'A new wing with tall windows for readers.' },
                { name:'Glass skylight', needs:{ glass:6, bronze:1 }, coins:1300, adds:'A glass dome on the roof that fills the library with daylight.' }],
  musichall:   [{ name:'Bell tower', needs:{ bronze:2, stone:10 }, coins:700, adds:'A bronze bell in a tower beside the hall.' },
                { name:'Stained glass', needs:{ glass:5 }, coins:1400, adds:'Colored glass panels that glow all around the hall.' }],
  temple:      [{ name:'Tea house and bridge', needs:{ log:12, fiber:10 }, coins:800, adds:'A curved bridge over the pond, and a small tea house.' },
                { name:'Glass lantern path', needs:{ glass:4, bronze:2 }, coins:1500, adds:'Glass lanterns along the path that glow every night.' }],
  observatory: [{ name:'Viewing balcony', needs:{ log:10, bronze:1 }, coins:500, adds:'A railed balcony around the tower for stargazing.' },
                { name:'Great lens telescope', needs:{ glass:3, bronze:3 }, coins:1200, adds:'A big brass telescope with a ground glass lens.' }],
};
const BUP_CUT = [0, 15, 40]; // coins each morning from 1 building, by its upgrades
const bLevel = id => (S.bLevel && S.bLevel[id]) || 1;
function upgradeExtras(g, id, lv) { if (lv < 2) return;
  const brick = mat(0xb5623f, { map:tx('stone', 1, 1) }), wood = mat(0x9b6b4a, { map:tx('grain', 1, 2) }), bronze = mat(0xd9a441, { metalness:.55, roughness:.35 }), gl = new THREE.MeshStandardMaterial({ color:0xa9dcff, transparent:true, opacity:.55, roughness:.05, metalness:.2 });
  if (id === 'bakery') { const ov = KIT.at(g, -1.95, 0, .3); ov.add(mesh(new THREE.SphereGeometry(.62, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), brick, 0, 0, 0)); ov.add(mesh(new THREE.CylinderGeometry(.66,.7,.18,16), brick, 0, .09, 0)); ov.add(mesh(new THREE.CircleGeometry(.22, 14, 0, Math.PI), mat(0x2a1a14), 0, .18, .63)); ov.add(mesh(sph(.12), glow(0xff8a3c), 0, .28, .5)); ov.add(mesh(new THREE.CylinderGeometry(.09,.11,.5,8), brick, .25, .65, -.2));
    if (lv >= 3) { const cs = KIT.at(g, 1.95, 0, .9); cs.add(mesh(new THREE.BoxGeometry(.9,.55,.55), wood, 0, .28, 0)); cs.add(mesh(new THREE.BoxGeometry(.86,.5,.5), gl, 0, .8, 0)); [0xff8fa3, 0xfff3a0, 0xc9b6ff].forEach((c, i) => { cs.add(mesh(new THREE.CylinderGeometry(.12,.12,.12,14), fine(c), -.27 + i * .27, .62, 0)); cs.add(mesh(new THREE.CylinderGeometry(.09,.09,.06,14), fine(0xfff6e6), -.27 + i * .27, .71, 0)); }); cs.add(mesh(new THREE.BoxGeometry(.96,.05,.6), bronze, 0, 1.07, 0)); } }
  if (id === 'library') { const w = KIT.at(g, -2.35, 0, -.3); w.add(mesh(new THREE.BoxGeometry(1.5,1.5,1.3), mat(0xf3e8d8, { map:tx('stone', 2, 2) }), 0, .75, 0)); const rf = mesh(new THREE.ConeGeometry(1.15,.7,4), mat(0x8a7fc0), 0, 1.85, 0); rf.rotation.y = Math.PI / 4; rf.scale.z = .85; w.add(rf); KIT.win(w, 0, .85, .66, { w:.5, h:.8, frame:0xe8e0d0 });
    if (lv >= 3) { const sk = KIT.at(g, 0, 2.9, .1); sk.add(mesh(new THREE.SphereGeometry(.62, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), gl, 0, 0, 0)); for (let i = 0; i < 6; i++) { const rb = mesh(new THREE.TorusGeometry(.62,.025,6,12,Math.PI / 2), bronze, 0, 0, 0); rb.rotation.y = i / 6 * Math.PI * 2; sk.add(rb); } sk.add(mesh(sph(.07), bronze, 0, .64, 0)); } }
  if (id === 'musichall') { const tw = KIT.at(g, 2.25, 0, -.7); [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([a, b]) => tw.add(mesh(new THREE.BoxGeometry(.12,2.2,.12), wood, a * .35, 1.1, b * .35))); tw.add(mesh(new THREE.BoxGeometry(.9,.1,.9), wood, 0, 2.2, 0)); const rf = mesh(new THREE.ConeGeometry(.7,.6,4), mat(0x9b88d8), 0, 2.55, 0); rf.rotation.y = Math.PI / 4; tw.add(rf);
      const bell = mesh(new THREE.CylinderGeometry(.12,.26,.36,14), bronze, 0, 1.92, 0); tw.add(bell); tw.add(mesh(new THREE.TorusGeometry(.26,.03,6,14), bronze, 0, 1.74, 0).rotateX(Math.PI / 2)); tw.add(mesh(sph(.06), bronze, 0, 1.7, 0));
    if (lv >= 3) for (let i = 0; i < 10; i++) { const a = (i + .5) / 10 * Math.PI * 2, c = KIT.BLOOM[i % 5], p = mesh(new THREE.CircleGeometry(.17, 12), new THREE.MeshBasicMaterial({ color:c, transparent:true, opacity:.85, side:THREE.DoubleSide }), Math.sin(a) * 1.66, 1.48, Math.cos(a) * 1.66); p.lookAt(Math.sin(a) * 4, 1.48, Math.cos(a) * 4); g.add(p); const h = halo(c, .7, .45); h.position.set(Math.sin(a) * 1.75, 1.48, Math.cos(a) * 1.75); g.add(h); } }
  if (id === 'temple') { const br = KIT.at(g, 0, 0, -1.6); for (let i = 0; i < 9; i++) { const t = i / 8, x = -1.05 + t * 2.1, y = .12 + Math.sin(t * Math.PI) * .32, pl = mesh(new THREE.BoxGeometry(.22,.05,.5), wood, x, y, 0); pl.rotation.z = Math.cos(t * Math.PI) * .45; br.add(pl); } [-.27, .27].forEach(z => { for (let i = 0; i < 9; i++) { const t = i / 8; br.add(mesh(new THREE.BoxGeometry(.04,.22,.04), mat(0xc0392b), -1.05 + t * 2.1, .26 + Math.sin(t * Math.PI) * .32, z)); } });
      const th = KIT.at(g, -2.3, 0, -1.6); th.add(mesh(new THREE.BoxGeometry(1.1,.9,.9), mat(0xfff1d6, { map:tx('plaster', 1, 1) }), 0, .45, 0)); const rf = mesh(new THREE.ConeGeometry(1,.45,4), mat(0x3b2f4a), 0, 1.12, 0); rf.rotation.y = Math.PI / 4; rf.scale.z = .8; th.add(rf); th.add(mesh(new THREE.BoxGeometry(.4,.6,.03), mat(0x7a5236), 0, .3, .46));
    if (lv >= 3) [[-1.35,.8],[1.35,.8],[-1.35,1.9],[1.35,1.9]].forEach(([x, z]) => { const lp = KIT.at(g, x, 0, z); lp.add(mesh(new THREE.CylinderGeometry(.04,.05,.8,8), bronze, 0, .4, 0)); lp.add(mesh(new THREE.BoxGeometry(.24,.3,.24), gl, 0, .95, 0)); lp.add(mesh(new THREE.BoxGeometry(.17,.22,.17), glow(0xffe7b0), 0, .95, 0)); lp.add(mesh(new THREE.ConeGeometry(.2,.14,4), bronze, 0, 1.17, 0).rotateY(Math.PI / 4)); const h = halo(0xffd88a, 1.5, .5); h.position.y = .95; lp.add(h); }); }
  if (id === 'observatory') { g.add(mesh(new THREE.TorusGeometry(1.98,.04,6,40), bronze, 0, 2.2, 0).rotateX(Math.PI / 2)); g.add(mesh(new THREE.CylinderGeometry(1.98,1.98,.08,40), wood, 0, 1.86, 0)); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; g.add(mesh(new THREE.BoxGeometry(.04,.34,.04), bronze, Math.sin(a) * 1.96, 2.03, Math.cos(a) * 1.96)); }
    if (lv >= 3) { const ts = KIT.at(g, 2.35, 0, .9); [-1, 0, 1].forEach(k => { const lg = mesh(new THREE.CylinderGeometry(.03,.04,1.2,6), wood, Math.sin(k * 2.1) * .22, .55, Math.cos(k * 2.1) * .22); lg.rotation.set(Math.cos(k * 2.1) * .2, 0, -Math.sin(k * 2.1) * .2); ts.add(lg); }); const tb = KIT.at(ts, 0, 1.25, 0); tb.rotation.set(.6, 0, -.5); tb.add(mesh(new THREE.CylinderGeometry(.16,.24,1.7,16), bronze, 0, 0, 0)); tb.add(mesh(new THREE.CylinderGeometry(.15,.15,.02,16), glow(0xcfeaff), 0, .86, 0)); const h = halo(0xcfeaff, .8, .5); h.position.y = .9; tb.add(h); } }
}
function buildingModel(id) {
  const g = new THREE.Group(), stone = c => mat(c, { map:tx('stone', 2, 2) }), ring = (r, y, c, n = 16) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, st = mesh(new THREE.BoxGeometry(2 * Math.PI * r / n - .03, .16 + KIT.hr(i) * .07, .12), mat(i % 2 ? c : 0xbfb6a8), Math.sin(a) * r, y, Math.cos(a) * r); st.rotation.y = a; g.add(st); } };
  if (id === 'bakery') { // warm plaster, a clay tile roof, a brick oven chimney, and bread in the window
    const tile = mat(0xd9825b, { map:tx('straw', 5, 1) });
    g.add(mesh(new THREE.BoxGeometry(2.6,1.9,2.2), mat(0xffe6cc, { map:tx('plaster', 2, 2) }), 0, .95, 0)); KIT.foot(g, 2.6, 2.2, 0, 3);
    [[-1.3,1.1],[1.3,1.1],[-1.3,-1.1],[1.3,-1.1]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(.15,1.9,.15), mat(0x9b6b4a), x, .95, z))); g.add(mesh(new THREE.BoxGeometry(2.72,.1,2.32), mat(0x9b6b4a), 0, 1.9, 0));
    KIT.hip(g, 1.94, 2.12, 1.25, tile, .93);
    { const br = mat(0xb5623f, { map:tx('stone', 1, 2) }); g.add(mesh(new THREE.CylinderGeometry(.24,.3,1.2,10), br, .8, 2.9, -.4)); g.add(mesh(new THREE.CylinderGeometry(.3,.3,.08,10), mat(0x8a4a30), .8, 3.52, -.4)); [2.6, 2.95, 3.3].forEach(y => g.add(mesh(new THREE.CylinderGeometry(.285 - (y - 2.6) * .05,.285 - (y - 2.6) * .05,.03,10), fine(0x8a4a30), .8, y, -.4))); }
    KIT.door(g, 0, 0, 1.12, { w:.7, h:1.1, pane:true }); KIT.lantern(g, .62, 1.3, 1.24);
    KIT.win(g, -.86, 1.05, 1.11, { w:.52, h:.46, shut:0xd9825b }); KIT.win(g, .86, 1.05, 1.11, { w:.52, h:.46, shut:0xd9825b });
    [-.86, .86].forEach(x => { g.add(mesh(new THREE.BoxGeometry(.6,.04,.2), mat(0xc98f58), x, .72, 1.22)); [-.16, .02, .2].forEach((dx, i) => { const lf = mesh(new THREE.CapsuleGeometry(.05,.1,4,8), mat(i % 2 ? 0xd9a066 : 0xc98a4a), x + dx, .79, 1.24); lf.rotation.z = Math.PI / 2; g.add(lf); }); }); // loaves on the sills
    const bread = mesh(new THREE.CapsuleGeometry(.18,.45,6,10), mat(0xd9a066), 0, 2.02, 1.24); bread.rotation.z = Math.PI/2; g.add(bread); [-.15, 0, .15].forEach(x => { const sc = mesh(new THREE.BoxGeometry(.03,.2,.02), fine(0xb5713a), x, 2.06, 1.42); sc.rotation.z = .5; g.add(sc); }); g.add(mesh(new THREE.BoxGeometry(.03,.3,.03), mat(0x4a4450), 0, 2.32, 1.24)); // the bread sign hangs over the door
    { const aw = mat(0xfff6e6), aw2 = mat(0xd9825b); for (let i = 0; i < 5; i++) { const st = mesh(new THREE.BoxGeometry(.22,.05,.5), i % 2 ? aw : aw2, -.44 + i * .22, 1.52, 1.34); st.rotation.x = .35; g.add(st); } }
    KIT.barrel(g, -1.05, 1.42, .9); { const sk = KIT.at(g, 1.05, 0, 1.42); sk.add(mesh(new THREE.CylinderGeometry(.2,.22,.42,12), mat(0xe8dcc0), 0, .21, 0)); sk.add(mesh(sph(.2), mat(0xe8dcc0), 0, .42, 0)); sk.add(mesh(new THREE.TorusGeometry(.12,.02,6,12), fine(0x9b6b4a), 0, .5, 0).rotateX(Math.PI / 2)); } // a sack of flour
  }
  if (id === 'library') { // pale stone, four grooved columns, wide steps, and tall windows full of books
    const st = stone(0xf3e8d8), tr = mat(0xe8e0d0);
    [[3.4,.1,2.9,.05,.2],[3.2,.1,2.7,.15,.15],[3,.1,2.5,.25,.1]].forEach(([w, h, d, y, z]) => g.add(mesh(new THREE.BoxGeometry(w, h, d), tr, 0, y, z)));
    g.add(mesh(new THREE.BoxGeometry(2.8,1.9,1.4), st, 0, 1.25, -.3)); KIT.boards(g, 2.81, 1.9, 1.25, .406, 7, 0x6b5a40, .14);
    [-1.2,-.4,.4,1.2].forEach(x => { g.add(mesh(new THREE.CylinderGeometry(.14,.16,1.7,14), mat(0xfff6e6), x, 1.25, .9)); g.add(mesh(new THREE.BoxGeometry(.4,.1,.4), tr, x, .35, .9)); g.add(mesh(new THREE.CylinderGeometry(.2,.17,.07,14), tr, x, .43, .9)); g.add(mesh(new THREE.CylinderGeometry(.18,.14,.08,14), tr, x, 2.12, .9)); g.add(mesh(new THREE.BoxGeometry(.42,.08,.42), tr, x, 2.2, .9)); });
    g.add(mesh(new THREE.BoxGeometry(3.1,.18,2.5), tr, 0, 2.32, .15));
    { const sh = new THREE.Shape(); sh.moveTo(-1.5, 0); sh.lineTo(1.5, 0); sh.lineTo(0, .7); sh.closePath(); const pg = new THREE.ExtrudeGeometry(sh, { depth:2.4, bevelEnabled:false }); pg.translate(0, 0, -1.05); g.add(mesh(pg, tr, 0, 2.41, 0)); const bk = KIT.at(g, 0, 2.62, 1.36); bk.add(mesh(new THREE.BoxGeometry(.5,.05,.02), mat(0x3f6fb5), 0, -.03, 0)); [-1, 1].forEach(sd => { const pg2 = mesh(new THREE.BoxGeometry(.24,.3,.02), fine(0xfff8ee), sd * .125, .12, .01); pg2.rotation.z = -sd * .12; bk.add(pg2); }); } // an open book carved over the columns
    KIT.door(g, 0, .3, .41, { w:.76, h:1.25, color:0x8a5a3b, frame:0x7a5236 });
    [-.95, .95].forEach(x => { KIT.win(g, x, 1.35, .41, { w:.46, h:.9, frame:0xe8e0d0 }); for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(.08,.2,.03), fine([0xff8fa3,0x7ec8e3,0xffc857,0x8fdc8a,0xc9b6ff][(i + r) % 5]), x - .15 + i * .1, 1.02 + r * .3, .47)); });
    [0xff8fa3,0x7ec8e3,0xffc857].forEach((c, i) => { const bk = mesh(new THREE.BoxGeometry(.18,.5,.35), mat(c), -.3 + i*.22, .55, 1.25); g.add(bk); g.add(mesh(new THREE.BoxGeometry(.19,.04,.36), fine(0xffffff), -.3 + i*.22, .7, 1.25)); });
    [-1.5, 1.5].forEach(x => KIT.lantern(g, x, 1.5, .52));
  }
  if (id === 'musichall') { // a round hall with a tiled dome, tall arched windows, and a gold note that turns on top
    g.add(mesh(new THREE.CylinderGeometry(1.6,1.7,1.8,28), mat(0xfff1d6, { map:tx('plaster', 6, 2) }), 0, .9, 0)); ring(1.72, .1, 0xd8cfc0, 22);
    g.add(mesh(new THREE.CylinderGeometry(1.72,1.72,.12,28), mat(0xc9b6ff), 0, 1.84, 0)); g.add(mesh(new THREE.CylinderGeometry(1.66,1.66,.1,28), mat(0x9b88d8), 0, 1.2, 0));
    g.add(mesh(new THREE.SphereGeometry(1.65,28,14,0,Math.PI*2,0,Math.PI/2), mat(0xc9b6ff), 0, 1.86, 0));
    for (let i = 0; i < 10; i++) { const rb = mesh(new THREE.TorusGeometry(1.66,.035,6,14,Math.PI / 2), mat(0x9b88d8), 0, 1.86, 0); rb.rotation.y = i / 10 * Math.PI * 2; g.add(rb); } g.add(mesh(sph(.16), mat(0xffc857), 0, 3.55, 0)); // ribs up the dome
    KIT.door(g, 0, 0, 1.64, { w:.72, h:1.1, color:0x9b6b4a }); KIT.lantern(g, .62, 1.3, 1.72);
    [-1, 1].forEach(sd => { [.75, 1.5].forEach(a => { const w = KIT.win(g, Math.sin(sd * a) * 1.63, 1.0, Math.cos(sd * a) * 1.63, { w:.34, h:.62, ry:sd * a, frame:0x9b88d8 }); const ar = mesh(new THREE.CylinderGeometry(.24,.24,.07,14,1,false,-Math.PI / 2,Math.PI), mat(0x9b88d8), 0, .31, .01); ar.rotation.x = -Math.PI / 2; w.add(ar); }); });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(.06,.13,3), fine(KIT.BLOOM[i % 5]), Math.sin(a) * 1.74, 1.7, Math.cos(a) * 1.74)).children; } // little flags under the dome
    const note = new THREE.Group(); note.position.set(0, 4.0, 0); g.add(note); const gold = mat(0xffc857);
    [-.16, .2].forEach((x, i) => { const hd = mesh(sph(.16), gold, x, i * .08, 0); hd.scale.set(1.2, .85, 1); note.add(hd); note.add(mesh(new THREE.BoxGeometry(.05,.7,.05), gold, x + .16, .35 + i * .08, 0)); }); const bm = mesh(new THREE.BoxGeometry(.42,.1,.05), gold, .18, .72, 0); bm.rotation.z = .22; note.add(bm); note.userData.spin = true;
    g.add(mesh(new THREE.CylinderGeometry(.02,.02,.4,6), gold, 0, 3.75, 0));
  }
  if (id === 'temple') { // a round moon gate of fitted stones, a still pond with lilies, stone lanterns and a blossom tree
    const gate = mesh(new THREE.TorusGeometry(1.2,.3,14,36), stone(0xe8e0d0), 0, 1.2, 0); g.add(gate);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; if (Math.sin(a) * 1.2 + 1.2 < .25) continue; const l = new THREE.Mesh(new THREE.BoxGeometry(.012, .62, .62), new THREE.MeshBasicMaterial({ color:0x6b5a40, transparent:true, opacity:.22 })); l.material.userData.outlineParameters = NO_OUTLINE; l.position.set(Math.cos(a) * 1.2, 1.2 + Math.sin(a) * 1.2, 0); l.rotation.z = a + Math.PI / 2; g.add(l); } // the joints between the gate stones
    g.add(mesh(new THREE.BoxGeometry(3.4,.3,.7), stone(0xd8cfc0), 0, .15, 0)); g.add(mesh(new THREE.BoxGeometry(3.6,.1,.9), mat(0xbfb6a8), 0, .05, 0));
    const pond = mesh(new THREE.CylinderGeometry(.9,.9,.05,28), mat(0x7ec8e3, { roughness:.2 }), 0, .03, -1.6); g.add(pond);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, st = mesh(new THREE.DodecahedronGeometry(.13), mat(i % 2 ? 0xbfb6a8 : 0xd8cfc0), Math.cos(a) * .95, .07, -1.6 + Math.sin(a) * .95); st.rotation.set(i, i * 2, 0); st.scale.y = .6; g.add(st); }
    [[-.3,-1.4,0xff8fa3],[.35,-1.85,0xffffff],[.1,-1.2,0xfff3a0]].forEach(([x, z, c]) => { g.add(mesh(new THREE.CylinderGeometry(.14,.14,.015,12,1,false,.5,5.6), fine(0x4fb46a), x, .065, z)); g.add(mesh(sph(.05), fine(c), x, .1, z)); }); // lily pads
    [[-1.6,-1.4],[1.6,-1.4]].forEach(([x, z]) => { g.add(mesh(new THREE.CylinderGeometry(.2,.24,.1,6), mat(0x9a93a8), x, .05, z)); g.add(mesh(new THREE.CylinderGeometry(.1,.14,.7,6), mat(0xb0a898), x, .45, z)); g.add(mesh(new THREE.CylinderGeometry(.24,.2,.08,6), mat(0xb0a898), x, .82, z)); g.add(mesh(new THREE.BoxGeometry(.3,.26,.3), lampMat, x, .99, z)); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a, b]) => g.add(mesh(new THREE.BoxGeometry(.05,.26,.05), mat(0xb0a898), x + a * .15, .99, z + b * .15)));
      const cp = mesh(new THREE.ConeGeometry(.34,.22,4), mat(0x9a93a8), x, 1.23, z); cp.rotation.y = Math.PI / 4; g.add(cp); g.add(mesh(sph(.05), mat(0x9a93a8), x, 1.37, z)); const lh = halo(0xffe0a8, 1.2, .5); lh.position.set(x, .99, z); g.add(lh); });
    g.add(mesh(new THREE.CylinderGeometry(.1,.16,1.2,8), mat(0x7a5236, { map:tx('grain', 1, 2) }), 1.6, .6, -2.2)); { const br = mesh(new THREE.CylinderGeometry(.04,.07,.7,6), mat(0x7a5236), 1.9, 1.3, -2.2); br.rotation.z = -.9; g.add(br); }
    [[1.6,1.8,-2.2,.62],[2.1,1.6,-2.1,.4],[1.2,1.65,-2.4,.42],[1.7,2.25,-2.3,.4]].forEach(([x, y, z, r], i) => g.add(mesh(sph(r), mat(i % 2 ? 0xffc4d6 : 0xffb6c8), x, y, z)));
    for (let i = 0; i < 7; i++) { const p = mesh(sph(.035), fine(0xffd9e4), 1.2 + KIT.hr(i) * 1.1, .03, -1.7 - KIT.hr(i + 5) * .9); p.scale.y = .3; g.add(p); } // fallen petals
    [[0,.9],[.1,1.35]].forEach(([x, z]) => { const st = mesh(new THREE.CylinderGeometry(.3,.32,.05,9), mat(0xd8cfc0), x, .025, z); st.scale.z = .7; g.add(st); });
  }
  if (id === 'observatory') { // a round stone tower, a dome with a slot for the telescope, and a brass telescope
    g.add(mesh(new THREE.CylinderGeometry(1.6,1.8,1.8,28), mat(0xfff6e6, { map:tx('stone', 6, 2) }), 0, .9, 0)); ring(1.84, .1, 0xd8cfc0, 22);
    [.6, 1.2].forEach(y => g.add(mesh(new THREE.CylinderGeometry(1.74 - y * .11,1.74 - y * .11,.03,28), fine(0xd8cfc0), 0, y, 0)));
    g.add(mesh(new THREE.CylinderGeometry(1.72,1.72,.14,28), mat(0x8a7fc0), 0, 1.84, 0));
    const dome = mesh(new THREE.SphereGeometry(1.65, 28, 14, 0, Math.PI*2, 0, Math.PI/2), mat(0x5a4b99, { metalness:.2 }), 0, 1.88, 0); g.add(dome);
    for (let i = 0; i < 8; i++) { const rb = mesh(new THREE.TorusGeometry(1.66,.03,6,14,Math.PI / 2), mat(0x8a7fc0), 0, 1.88, 0); rb.rotation.y = i / 8 * Math.PI * 2 + .4; g.add(rb); }
    { const slot = mesh(new THREE.TorusGeometry(1.67,.09,6,14,Math.PI / 2.2), mat(0x2e2438), 0, 1.88, 0); slot.rotation.y = -Math.PI / 2 + .55; slot.scale.z = 3; g.add(slot); } // the opening in the dome
    const tube = new THREE.Group(); tube.position.set(.5, 2.9, .3); tube.rotation.set(.5, 0, -.6); g.add(tube); tube.add(mesh(new THREE.CylinderGeometry(.18,.25,1.8,14), mat(0x3b2f4a), 0, 0, 0)); [-.6, 0, .6].forEach(y => tube.add(mesh(new THREE.CylinderGeometry(.2 + (.6 - y) * .03,.2 + (.6 - y) * .03,.06,14), mat(0xffc857), 0, y, 0))); tube.add(mesh(new THREE.CylinderGeometry(.16,.16,.02,14), mat(0xbfe3ff, { roughness:.1 }), 0, .9, 0)); tube.add(mesh(new THREE.CylinderGeometry(.05,.07,.3,8), mat(0xffc857), .2, -.6, 0));
    KIT.door(g, 0, 0, 1.68, { w:.72, h:1.1, color:0x9b6b4a }); KIT.lantern(g, .62, 1.3, 1.76);
    [-1, 1].forEach(sd => { const a = sd * .95; KIT.win(g, Math.sin(a) * 1.66, 1.05, Math.cos(a) * 1.66, { w:.36, round:true, ry:a, frame:0x8a7fc0 }); });
    [[.9,2.9,-.6],[-.7,3.2,.5],[-1.1,2.5,-.5],[.2,3.4,-.4]].forEach(([x, y, z], i) => { const st = mesh(new THREE.CircleGeometry(.06, 5), glow(0xfff3a0), x, y, z); st.lookAt(x * 3, y * 3 - 3, z * 3); g.add(st); }); // gold stars set into the dome
  }
  return bake(g);
}
const siteGroups = BUILDINGS.map((b, i) => {
  const g = new THREE.Group(); g.position.set(OH.x + b.pos[0], OH.y, OH.z + b.pos[1]); g.userData = { kind:'site', i };
  g.add(mesh(new THREE.CylinderGeometry(1.4,1.5,.15,24), mat(0xb0a898), 0, .07, 0));
  g.add(mesh(new THREE.CylinderGeometry(.06,.06,1,6), mat(0x9b6b4a), 1.2, .5, 1.1)); g.add(mesh(new THREE.BoxGeometry(.7,.4,.06), mat(0xfff1d6), 1.2, 1, 1.12)); g.children[1].userData = g.children[2].userData = { kind:'bplan', i };
  scene.add(g); return g;
});
function drawSites() {
  siteGroups.forEach((g, i) => {
    while (g.children.length > 3) g.remove(g.children[3]);
    const built = S.built.includes(BUILDINGS[i].id);
    g.children[1].position.set(built ? 2.1 : 1.2, .5, built ? 2.2 : 1.1); g.children[2].position.set(built ? 2.1 : 1.2, 1, built ? 2.22 : 1.12); /* a built building keeps its signpost, moved out front: its plans board */
    if (built) { const m = buildingModel(BUILDINGS[i].id); upgradeExtras(m, BUILDINGS[i].id, bLevel(BUILDINGS[i].id)); g.add(m); }
    const v = BUILDINGS[i].villager; if (v) npcs[v].visible = built;
  });
}
const marker = new THREE.Group(); scene.add(marker);
const markerMat = new THREE.MeshBasicMaterial({ color:0xffc857, fog:false });
// the quest marker: a gold chevron that always faces you, and a soft ring on the ground under the thing it points to
{ const chev = new THREE.Shape(); chev.moveTo(-.32, .26); chev.lineTo(0, -.12); chev.lineTo(.32, .26); chev.lineTo(.16, .26); chev.lineTo(0, .07); chev.lineTo(-.16, .26); chev.closePath();
  const geo = new THREE.ExtrudeGeometry(chev, { depth:.06, bevelEnabled:true, bevelThickness:.02, bevelSize:.025, bevelSegments:2 }); geo.center();
  marker.add(new THREE.Mesh(geo, markerMat));
  const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0xc9962f, fog:false })); back.scale.setScalar(1.16); back.position.z = -.03; marker.add(back);
  const up = new THREE.Mesh(geo, markerMat); up.scale.setScalar(.62); up.position.y = .3; marker.add(up); }
const markerRing = new THREE.Mesh(new THREE.RingGeometry(.5, .6, 40), new THREE.MeshBasicMaterial({ color:0xffe07a, transparent:true, opacity:.6, depthWrite:false, side:THREE.DoubleSide, fog:false }));
markerRing.rotation.x = -Math.PI/2; scene.add(markerRing);
const bushes = [];
const dressing = new THREE.Group(); scene.add(dressing); const grassPatches = [];
{ // grouped decorations: grass patches, bushes, flower beds, garden fence
  // soft light and dark patches in the grass, so the ground isn't one flat color
  const rnd = (i) => { const x = Math.sin(i*127.1)*43758.5; return x - Math.floor(x); };
  [[0,0,0,8.4],[ORCH_POS.x,ORCH_POS.y,ORCH_POS.z,7.4],[WIND_POS.x,WIND_POS.y,WIND_POS.z,7.4],[OH.x,OH.y,OH.z,10.2]].forEach(([cx,cy,cz,R], k) => {
    for (let i=0;i<14;i++){ const a = rnd(i+k*50)*Math.PI*2, r = Math.sqrt(rnd(i*3+k*70))*R*.85, f = rnd(i*7+k) > .5 ? 1.12 : .88;
      const pm = RAMP ? new THREE.MeshToonMaterial({ color:0x8fdc8a, gradientMap:RAMP, transparent:true, opacity:.55 }) : new THREE.MeshStandardMaterial({ color:0x8fdc8a, roughness:.95, transparent:true, opacity:.5 }); pm.userData.outlineParameters = NO_OUTLINE; pm.userData.f = f;
      const p = new THREE.Mesh(new THREE.CircleGeometry(.9 + rnd(i*11+k)*1.4, 20), pm); p.rotation.x = -Math.PI/2; p.position.set(cx + Math.cos(a)*r, cy + .012 + i*.0005, cz + Math.sin(a)*r); p.scale.set(1, .6 + rnd(i*5)*.5, 1);
      p.receiveShadow = true; dressing.add(p); grassPatches.push(p); } });
  // bushes in little groups
  const bush = (x, z, s=1, c=0x4fb46a, id) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.userData = { kind:'bush', key:'bush'+(id ?? bushes.length) }; bushes.push(g); bushLook(g, s, c); dressing.add(g); return g; };
  [[3,-5.95,1,0],[2,-6.5,.8,2],[-6.3,-5.6,1,3],[-7.9,-.3,.8,4]].forEach(([x,z,s,id]) => bush(x, z, s, undefined, id));
  // flower beds hugging the hut and along the path
  const bed = (x, z, n, rx, rz) => { for (let i=0;i<n;i++){ const fx = x + (rnd(i+x*13)-.5)*rx, fz = z + (rnd(i*3+z*7)-.5)*rz, c = [0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff,0xffb36b][i%5];
    dressing.add(mesh(new THREE.CylinderGeometry(.015,.015,.22,4), mat(0x4fb46a), fx, .11, fz)); dressing.add(mesh(sph(.075), mat(c), fx, .24, fz)); } };
  const bedAt = (x, z, rx, rz, i) => { const h = hitBox(rx + .3, .5, rz + .3); h.position.set(x, .25, z); dressing.add(h); deco(h, () => pickSeeds('bed' + i)); };
  [[-5.1,-1.25,.8,.35,0],[-2.9,-1.25,.8,.35,1],[-2,-2.55,.35,.8,4],[5.3,1.25,.4,.8,5]].forEach(([x,z,rx,rz,i]) => bedAt(x, z, rx, rz, i));
  bed(-5.1, -1.25, 5, .8, .35); bed(-2.9, -1.25, 5, .8, .35); bed(-2, -2.55, 4, .35, .8); bed(5.3, 1.25, 4, .4, .8); // by the porch, along the hut, along the garden
  // a low picket fence around the garden, open on the side facing the hut
  const fenceMat = gardenFenceMat = mat(0xfff1d6);
  const fence = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1-x0, z1-z0) / .4);
    for (let i=0;i<=n;i++){ const k = i/n; dressing.add(mesh(new THREE.BoxGeometry(.07,.5,.07), fenceMat, x0+(x1-x0)*k, .25, z0+(z1-z0)*k)); }
    const rail = mesh(new THREE.BoxGeometry(Math.hypot(x1-x0, z1-z0), .05, .04), fenceMat, (x0+x1)/2, .36, (z0+z1)/2); rail.rotation.y = -Math.atan2(z1-z0, x1-x0); dressing.add(rail);
    const h = hitBox(Math.hypot(x1-x0, z1-z0) + .2, .7, .4); h.position.copy(rail.position).setY(.3); h.rotation.y = rail.rotation.y; dressing.add(h); deco(h, () => paintGardenFence()); };
  applyFenceColor(); fence(.45, -1.75, 4.45, -1.75); fence(4.45, -1.75, 4.45, 3.5); fence(.45, 3.5, 4.45, 3.5); fence(.45, -1.75, .45, -.2); fence(.45, 1.6, .45, 3.5);
}
const sprinkler = new THREE.Group(); sprinkler.position.set(.15, 0, .25); sprinkler.visible = false;
sprinkler.add(mesh(new THREE.CylinderGeometry(.06,.06,.5,8), mat(0x8a8f99, { metalness:.4 }), 0, .25, 0));
const sprHead = new THREE.Group(); sprHead.position.y = .52; sprinkler.add(sprHead);
sprHead.add(mesh(new THREE.BoxGeometry(.5,.06,.06), mat(0x7ec8e3), 0, 0, 0)); sprHead.add(mesh(sph(.08), mat(0x7ec8e3)));
scene.add(sprinkler); deco(sprinkler, () => toast('Your sprinkler waters every plant in your garden each morning. No watering can needed.'));

// --- sundial: its shadow is really cast by the sun, shortest at noon ---
const sundial = new THREE.Group(); sundial.position.set(-1.5,0,1.5);
sundial.add(mesh(new THREE.CylinderGeometry(.75,.8,.18,32), mat(0xe8e0d0), 0, .09, 0));
const gnomon = mesh(new THREE.BoxGeometry(.06,.9,.5), mat(0x8a7a6a), 0, .5, 0); gnomon.rotation.x = .5; sundial.add(gnomon);
for (let i=0;i<12;i++){ const a=i/12*Math.PI*2; sundial.add(mesh(new THREE.BoxGeometry(.04,.02,.14), mat(0x8a7a6a), Math.cos(a)*.6, .19, Math.sin(a)*.6)); }
sundial.userData.kind = 'sundial'; scene.add(sundial);

// --- wind bell, appears when tuned ---
const bell = new THREE.Group(); bell.position.set(1.9,0,-5.2); bell.visible = false;
bell.add(mesh(new THREE.CylinderGeometry(.06,.06,2.4,8), mat(0x9b6b4a), -.7, 1.2, 0));
bell.add(mesh(new THREE.CylinderGeometry(.06,.06,2.4,8), mat(0x9b6b4a), .7, 1.2, 0));
bell.add(mesh(new THREE.BoxGeometry(1.6,.12,.12), mat(0x9b6b4a), 0, 2.4, 0));
const bellBody = mesh(new THREE.CylinderGeometry(.22,.42,.6,24), mat(0xffc857, { metalness:.5, roughness:.35 }), 0, 1.95, 0); bell.add(bellBody);
{ const hb = hitBox(1.7, 2.6, .8); hb.position.y = 1.3; bell.add(hb); } // tap anywhere on the bell frame
deco(bell, () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*180)); bell.userData.ring = 1.5; toast('Ding! Your Wind Bell rings out across the sky.'); });
scene.add(bell);

// --- festival lanterns ---
const lanterns = new THREE.Group(); lanterns.visible = false; scene.add(lanterns);
const lanternMat = glow(0xffb45c);
// 4 spots checked to be clear of trees, rocks, the hut, and everything else you can tap (festivals only)
[[-4,6.75],[4,6.75],[6.75,4],[-4.25,4]].forEach(([lx, lz]) => { const one = new THREE.Group(); one.position.set(lx, 0, lz); lanterns.add(one);
  one.add(mesh(new THREE.CylinderGeometry(.05,.05,1.8,6), mat(0x9b6b4a), 0, .9, 0));
  const l = mesh(sph(.22), lanternMat, 0, 1.9, 0); l.scale.y = 1.25; one.add(l); const lh = halo(0xffb45c, 1.6, .7); lh.position.set(0, 1.9, 0); one.add(lh);
  const h = hitBox(.6, 2.2, .6); h.position.set(0, 1.1, 0); one.add(h); deco(h, () => { pulse(lh, 1.2); chime(880); toast('You made a wish on the lantern. People light lanterns at festivals all over the world.'); }); });

// --- dig spots ---
// dig spots sit in the open meadow at the front, clear of trees and rocks (checked with a spacing test)
const DIG_SPOTS = [[1.5,7.25],[-2.25,7.25],[4.5,6],[.25,4.5],[-4.75,5.75],[2.75,4.5],[-1.75,5.25],[-5.6,4.8]];
let digGroups = [];
function drawDigs() {
  digGroups.forEach(g => scene.remove(g)); digGroups = [];
  S.digs.forEach((d, i) => {
    const g = new THREE.Group(); g.position.set(d.p[0], 0, d.p[1]); g.userData = { kind:'dig', i };
    const m = mesh(sph(.45), mat(d.n ? 0x7a5236 : 0xb98a63), 0, 0, 0); m.scale.set(1, .35 - d.n*.08, 1); g.add(m);
    const spark = mesh(new THREE.OctahedronGeometry(.16), mat(0xffe27a, { emissive:0xffc857, emissiveIntensity:.8 }), 0, .6, 0);
    spark.userData.spark = true; g.add(spark);
    scene.add(g); digGroups.push(g);
  });
}
function spawnDigs() {
  if (S.tut >= 1 && S.tut < 9) { drawDigs(); return; }
  if (S.quest < 1 || S.relics >= RELICS.length) { S.digs = []; drawDigs(); return; }
  const want = Math.min(2, RELICS.length - S.relics);
  const free = DIG_SPOTS.filter(p => !S.digs.some(d => d.p[0] === p[0] && d.p[1] === p[1]));
  while (S.digs.length < want && free.length) S.digs.push({ p: free.splice(Math.floor(Math.random()*free.length), 1)[0], n:0 });
  drawDigs();
}

// --- garden plots ---
const PLOT0 = new THREE.Vector3(1.2,0,-1), GAP = 1.25;
const tileGroups = [], lateClicks = []; let tilesReady = false;
function addTileGroup(i) {
  const g = new THREE.Group(); g.position.set(PLOT0.x + (i%3)*GAP, 0, PLOT0.z + Math.floor(i/3)*GAP);
  g.userData = { kind:'tile', i }; scene.add(g);
  g.add(mesh(new THREE.BoxGeometry(1.15,.05,1.15), new THREE.MeshBasicMaterial({ visible:false }), 0, .02, 0));
  tileGroups.push(g); if (tilesReady) lateClicks.push(g);
  return g;
}
S.tiles.forEach((_, i) => addTileGroup(i)); tilesReady = true;
// Each crop looks like the real plant and grows through visible stages (k goes 0 to 1).
// a leaf: a flat pointed oval growing out from (x, y, z), turned ry around and tipped up by tilt
function leafAt(parent, x, y, z, len, wid, ry, tilt, m) { const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry; const l = new THREE.Group(); l.rotation.x = -tilt; p.add(l);
  const b = mesh(LEAF_GEO, m, 0, 0, len / 2); b.scale.set(wid, .05, len); l.add(b); parent.add(p); return p; }
// each crop is drawn from the real plant: k is how grown it is (0 to 1)
function cropModel(id, k, ripe) {
  const c = CROPS[id], g = new THREE.Group(), leaf = mat(0x5fc377), dark = mat(0x3f8f55), stemM = mat(0x4fa862), sz = .35 + k*.65;
  const sway = o => { o.userData.sway = true; return o; }, bob = o => { o.userData.bob = true; o.userData.by = o.position.y; return o; };
  const fruit = ripe ? mat(c.color, { emissive:c.color, emissiveIntensity: id === 'starbloom' ? .6 : .15 }) : mat(0x9fd88a);
  if (id === 'skywheat') { // wheat: thin stalks with long leaves, and an ear of grain with whiskers on top
    const col = ripe ? mat(0xe6c35c) : mat(k > .6 ? 0xc9d46a : 0x7fcf6a);
    [[-.26,-.2],[.2,-.26],[0,.06],[-.2,.26],[.26,.2],[-.02,-.3],[.05,.34]].forEach(([x, z], i) => {
      const st = sway(new THREE.Group()); st.position.set(x, .1, z); const h = .72 * sz;
      st.add(mesh(new THREE.CylinderGeometry(.018,.025,h,5), col, 0, h/2, 0));
      leafAt(st, 0, h*.3, 0, .26*sz, .045, i*1.3, .9, col); leafAt(st, 0, h*.55, 0, .22*sz, .04, i*1.3 + 2.6, 1.0, col);
      if (k > .4) { for (let j = 0; j < 8; j++) { const kr = mesh(LEAF_GEO, col, (j % 2 ? .028 : -.028), h + .03 + j * .028 * sz, 0); kr.scale.set(.06, .07, .06); st.add(kr); }
        [-.03, 0, .03].forEach(dx => { const aw = mesh(new THREE.CylinderGeometry(.003,.006,.16*sz,3), col, dx, h + .3*sz, 0); aw.rotation.z = -dx * 8; st.add(aw); }); }
      g.add(bake(st)); });
  } else if (id === 'sunbell') { // sunflower: a thick stem, big heart-shaped leaves, and a seed disc ringed with two rows of petals
    const st = sway(new THREE.Group()); st.position.y = .1; g.add(st);
    const h = .3 + k*.95; st.add(mesh(new THREE.CylinderGeometry(.035,.05,h,7), stemM, 0, h/2, 0));
    for (let i = 0; i < 2 + Math.floor(k * 3); i++) leafAt(st, 0, h * (.25 + i * .16), 0, .2 + k * .1, .17 + k * .06, i * 2.4, .5, i % 2 ? leaf : dark);
    if (k > .5) { const head = new THREE.Group(); head.position.set(0, h + .02, .06); head.rotation.x = .55; st.add(head);
      const s2 = ripe ? .2 : .1;
      for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2, sp = mesh(LEAF_GEO, dark, Math.cos(a)*s2*1.05, Math.sin(a)*s2*1.05, -.03); sp.scale.set(.14,.07,.03); sp.rotation.z = a; head.add(sp); } // green sepals behind
      if (ripe) { const pm = mat(0xffd23f), pm2 = mat(0xf6b62c);
        for (let r = 0; r < 2; r++) for (let i = 0; i < 14; i++) { const a = (i + r * .5)/14*Math.PI*2, d = s2 + (r ? .07 : .1), pt = mesh(LEAF_GEO, r ? pm2 : pm, Math.cos(a)*d, Math.sin(a)*d, r ? -.012 : 0); pt.scale.set(r ? .17 : .22, .065, .02); pt.rotation.z = a; head.add(pt); }
        const disc = mesh(new THREE.CylinderGeometry(s2*.95,s2*.95,.05,18), mat(0x5a3a28, { map:tx('stone', 2, 2) }), 0, 0, .012); disc.rotation.x = Math.PI/2; head.add(disc);
        const ring = mesh(new THREE.TorusGeometry(s2*.6,.018,6,18), mat(0x7a5236), 0, 0, .04); head.add(ring); const mid = mesh(LEAF_GEO, mat(0x8a6a3a), 0, 0, .035); mid.scale.set(s2*.9, s2*.9, .04); head.add(mid);
      } else { const bud = mesh(LEAF_GEO, leaf, 0, 0, .02); bud.scale.set(s2*2, s2*2, .12); head.add(bud); } }
    bake(st);
  } else if (id === 'moonpumpkin') { // pumpkin: a vine along the ground, broad leaves, a yellow flower, then a ribbed fruit with a curled stem
    const vine = mesh(new THREE.TorusGeometry(.3,.018,5,14,Math.PI*1.3), stemM, 0, .13, 0); vine.rotation.x = Math.PI/2; g.add(vine);
    [[-.32,.2],[.28,-.26],[.32,.26],[-.22,-.32],[0,.36]].slice(0, 1 + Math.floor(k*4)).forEach(([x, z], i) => { g.add(mesh(new THREE.CylinderGeometry(.012,.012,.14,4), stemM, x, .17, z)); leafAt(g, x, .24, z, .2, .22, i * 1.9, .15, i % 2 ? leaf : dark); leafAt(g, x, .24, z, .14, .16, i * 1.9 + 1.2, .15, i % 2 ? leaf : dark); });
    { const td = mesh(new THREE.TorusGeometry(.05,.008,4,10,Math.PI*1.6), stemM, .36, .16, -.05); g.add(td); }
    if (k > .3 && k < .8 && !ripe) { for (let i = 0; i < 5; i++) { const a = i/5*Math.PI*2, pt = mesh(LEAF_GEO, mat(0xffd23f), -.05 + Math.cos(a)*.05, .2, -.1 + Math.sin(a)*.05); pt.scale.set(.07,.02,.07); g.add(pt); } }
    if (k > .3) { const p = new THREE.Group(); p.position.y = .12 + (ripe ? .12 : .05); const r = ripe ? .3 : .08 + k*.12;
      const core = mesh(sph(r*.78), fruit, 0, 0, 0); core.scale.y = .78; p.add(core);
      for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2, lobe = mesh(LEAF_GEO, fruit, Math.cos(a)*r*.55, 0, Math.sin(a)*r*.55); lobe.scale.set(r*.9, r*1.5, r*.9); p.add(lobe); } // eight ribs
      const stk = mesh(new THREE.CylinderGeometry(.025,.04,.14,6), mat(0x6b7a3a), .02, r*.72, 0); stk.rotation.z = -.4; p.add(stk); p.add(mesh(new THREE.CylinderGeometry(.06,.07,.03,8), mat(0x6b7a3a), 0, r*.62, 0));
      bake(p); g.add(ripe ? bob(p) : p); }
  } else if (id === 'cloudberry') { // cloudberry: a low plant with hand-shaped leaves, a white flower, then one berry that turns from red to amber
    const pl = sway(new THREE.Group()); pl.position.y = .1; g.add(pl);
    const n = 2 + Math.floor(k * 3);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + .4, hh = .08 + k * .12, x = Math.cos(a) * .14 * sz, z = Math.sin(a) * .14 * sz;
      const stk = mesh(new THREE.CylinderGeometry(.01,.012,hh,4), stemM, x * .6, hh/2, z * .6); pl.add(stk);
      for (let j = -2; j <= 2; j++) leafAt(pl, x, hh, z, (.11 - Math.abs(j) * .015) * (.6 + k * .6), .08, -a + Math.PI / 2 + j * .5, .12, i % 2 ? leaf : dark); } // five lobes, like a hand
    if (k > .35) { const hh = .16 + k * .14; pl.add(mesh(new THREE.CylinderGeometry(.008,.01,hh,4), stemM, 0, hh/2, 0));
      if (k < .7 && !ripe) { for (let i = 0; i < 5; i++) { const a = i/5*Math.PI*2, pt = mesh(LEAF_GEO, mat(0xffffff), Math.cos(a)*.045, hh, Math.sin(a)*.045); pt.scale.set(.07,.02,.07); pl.add(pt); } pl.add(mesh(sph(.02), mat(0xffd23f), 0, hh + .01, 0)); }
      else { const bm = ripe ? fruit : mat(0xd9523a), r = ripe ? .034 : .026; pl.add(mesh(sph(r), bm, 0, hh + r, 0)); for (let i = 0; i < 7; i++) { const a = i/7*Math.PI*2; pl.add(mesh(sph(r), bm, Math.cos(a)*r*1.3, hh + r*.6 + (i % 2) * r * .5, Math.sin(a)*r*1.3)); } } }
    bake(pl);
  } else if (id === 'frostmint') { // mint: upright stems with leaves in facing pairs, each pair turned a quarter turn from the last, and pale purple flower spikes
    const col = mat(ripe ? 0x5fd88a : 0x8fdc9a), col2 = mat(ripe ? 0x4cc07a : 0x7fcf8c);
    [[0,0],[-.2,.14],[.2,-.12],[.12,.22],[-.14,-.2]].slice(0, 2 + Math.floor(k * 3)).forEach(([x, z], si) => { const st = sway(new THREE.Group()); st.position.set(x, .1, z); const h = (.2 + .42 * k) * (si ? .85 : 1);
      st.add(mesh(new THREE.CylinderGeometry(.012,.016,h,4), stemM, 0, h/2, 0));
      for (let lv = 0, y = .07; y < h; lv++, y += .085) [0, Math.PI].forEach(o => leafAt(st, 0, y, 0, .1 - lv * .006, .075, o + (lv % 2) * Math.PI / 2 + si, .35, lv % 2 ? col : col2));
      if (ripe) for (let j = 0; j < 4; j++) st.add(mesh(sph(.022 - j * .003), mat(0xc9b6ff), 0, h + .02 + j * .028, 0));
      g.add(bake(st)); });
  } else if (id === 'kale') { // kale: a loose bunch of tall leaves with pale ribs and curly edges, and no head in the middle
    const col = mat(ripe ? 0x3f7a5a : 0x5f9a6a), col2 = mat(ripe ? 0x4f8f66 : 0x6faa78), rib = mat(0xcfe6c8), pl = sway(new THREE.Group()); pl.position.y = .1; g.add(pl);
    const n = 5 + Math.floor(k * 5);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, inner = i % 2, len = (inner ? .2 : .3) * sz + .06, tilt = inner ? 1.15 : .75, m = i % 3 ? col : col2;
      const p = leafAt(pl, Math.sin(a) * .03, .02, Math.cos(a) * .03, len, .2 * sz + .05, a, tilt, m), lf = p.children[0];
      const rb = mesh(new THREE.CylinderGeometry(.008,.012,len,4), rib, 0, .012, len/2); rb.rotation.x = Math.PI/2; lf.add(rb);
      for (let j = 0; j < 5; j++) { const t = j / 4, e = mesh(LEAF_GEO, m, (j % 2 ? 1 : -1) * (.085 * sz + .02) * Math.sin(Math.PI * (.25 + t * .6)), .012, len * (.25 + t * .7)); e.scale.set(.07,.07,.07); lf.add(e); } } // curls along the edge
    bake(pl);
  } else { // starbloom = Moonflower: a vine twining up a stake, heart-shaped leaves, and wide white trumpets that glow at night
    const st = sway(new THREE.Group()); st.position.y = .1; g.add(st); const h = .95 * sz + .1;
    st.add(mesh(new THREE.CylinderGeometry(.018,.022,h + .12,5), mat(0x9b6b4a), 0, (h + .12)/2, 0));
    const top = h * Math.min(1, .25 + k);
    for (let i = 0; i < 14; i++) { const t = i / 13, a = t * 9, y = t * top; if (y > top) break; const sg = mesh(new THREE.CylinderGeometry(.01,.01,top / 9,4), stemM, Math.cos(a) * .035, y + .03, Math.sin(a) * .035); sg.rotation.set(Math.sin(a) * .6, 0, Math.cos(a) * .6); st.add(sg); }
    for (let i = 0; i < 2 + Math.floor(k * 4); i++) { const y = top * (.18 + i * .16); if (y > top) break; const a = i * 2.3; leafAt(st, Math.cos(a) * .03, y, Math.sin(a) * .03, .15, .15, a, .35, i % 2 ? leaf : dark); leafAt(st, Math.cos(a) * .03, y, Math.sin(a) * .03, .07, .08, a + .5, .35, i % 2 ? leaf : dark); }
    if (k > .6) { const spots = ripe ? [[.5, top], [-2.2, top * .7], [2.6, top * .45]] : [[.5, top]];
      spots.forEach(([a, y]) => { const f = new THREE.Group(); f.position.set(Math.cos(a) * .07, y + .05, Math.sin(a) * .07); f.rotation.set(-.9 * Math.sin(a) + .5, 0, .9 * Math.cos(a)); st.add(f);
        if (ripe) { const tr = mesh(new THREE.ConeGeometry(.15,.07,14,1,true), fruit, 0, .125, 0); tr.rotation.x = Math.PI; tr.material.side = THREE.DoubleSide; f.add(tr);
          for (let i = 0; i < 5; i++) { const ln = mesh(new THREE.BoxGeometry(.012,.004,.14), fine(0xdff0c8), 0, .162, 0); ln.rotation.y = i / 5 * Math.PI * 2; ln.position.set(Math.sin(i / 5 * Math.PI * 2) * .07, .15, Math.cos(i / 5 * Math.PI * 2) * .07); f.add(ln); } // the star folded into the flower
          f.add(mesh(sph(.02), mat(0xfff3a0), 0, .06, 0)); }
        else { const bd = mesh(new THREE.ConeGeometry(.035,.16,6), mat(0xe8f0d0), 0, .08, 0); f.add(bd); } }); }
    bake(st);
  }
  return g;
}
function drawTile(i) {
  const g = tileGroups[i], t = S.tiles[i];
  while (g.children.length > 1) g.remove(g.children[1]);
  if (t.s === 0) { g.add(mesh(new THREE.BoxGeometry(1.08,.03,1.08), new THREE.MeshStandardMaterial({ color:0x9c7a55, transparent:true, opacity:.35 }), 0, .02, 0)); return; }
  g.add(mesh(new THREE.BoxGeometry(1.1,.14,1.1), mat(t.w ? 0x7a5236 : 0xb98a63, { map:tx('earth', 1, 2) }), 0, .05, 0));
  { const fm = mat(t.w ? 0x6b4630 : 0xa97a55), fr = new THREE.Group(); [-.39, -.13, .13, .39].forEach(z => { const r = mesh(new THREE.CylinderGeometry(.07,.07,1.04,6), fm, 0, .11, z); r.rotation.z = Math.PI / 2; r.scale.y = 1; r.scale.x = .5; fr.add(r); }); g.add(bake(fr)); } // furrows
  if (t.s === 2) {
    const c = CROPS[t.c], k = Math.min(1, t.d / c.days), ripe = t.d >= c.days;
    g.add(cropModel(t.c, k, ripe));
  }
}
S.tiles.forEach((_, i) => drawTile(i));
// --- island expansions: new land that joins the home island ---
const lobes = EXPANSIONS.map((e, i) => {
  const L = island(e.r, e.x, 0, e.z, { mat:HOME.top.material, hidden:true }); L.e = e; L.g.visible = false; L.lip.visible = false; L.extra = [];
  e.trees.forEach(([x,z], j) => { const t = tree(scene, x, z); t.userData.kind = 'tree'; t.userData.key = `x${e.id}t${j}`; L.extra.push(t); });
  e.rocks.forEach(([x,z,r], j) => { const rk = mesh(new THREE.DodecahedronGeometry(r), mat(0xb3aabb), x, r*.5, z); rk.rotation.set(j, j*2, 0); rk.userData = { kind:'rock', key:`x${e.id}r${j}` }; scene.add(rk); L.extra.push(rk); });
  e.bushes.forEach(([x,z], j) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.userData = { kind:'bush', key:`x${e.id}b${j}` };
    bushLook(b); scene.add(b); L.extra.push(b); });
  for (let k = 0; k < 18; k++) { const a = k*2.4, rr = 1.5 + (k*1.37) % (e.r - 2); L.g.add(mesh(sph(.08), mat([0xffffff,0xffd1dc,0xfff3a0,0xc9b6ff][k%4]), Math.cos(a)*rr, .06, Math.sin(a)*rr)); }
  L.extra.forEach(o => o.visible = false);
  return L;
});
const ownedLobes = () => lobes.filter((L, i) => i < (S.expand || 0));
// the grassy rim of each piece of land, drawn only where it is not inside other land (so joins look seamless)
function drawLips() {
  const lands = [HOME, ...ownedLobes()];
  lands.forEach(L => {
    if (L.lipArcs) L.lipArcs.forEach(a => L.g.remove(a)); L.lipArcs = []; L.lip.visible = false;
    const cx = L.g.position.x, cz = L.g.position.z, N = 144, R = L.r - .05, inside = t => lands.some(M => M !== L && Math.hypot(cx + Math.cos(t)*R - M.g.position.x, cz + Math.sin(t)*R - M.g.position.z) < M.r - .35);
    const out = [...Array(N)].map((_, i) => !inside(i / N * Math.PI * 2)); if (out.every(Boolean)) { L.lip.visible = true; return; }
    let i0 = out.findIndex(v => !v);
    for (let k = 1; k <= N; k++) { const i = (i0 + k) % N; if (!out[i]) continue; let n = 0; while (out[(i + n) % N] && n < N) n++;
      const arc = new THREE.Mesh(new THREE.TorusGeometry(R, .3, 10, Math.max(4, n), n / N * Math.PI * 2), L.top.material); arc.rotation.x = Math.PI/2;
      const w = new THREE.Group(); w.position.y = -.14; w.rotation.y = -(i / N * Math.PI * 2); w.add(arc); L.g.add(w); L.lipArcs.push(w); k += n - 1; }
  });
}
function showLobes(animate) {
  ownedLobes().forEach((L, i) => { const fresh = animate && i === (S.expand || 0) - 1;
    if (!walkables.includes(L.top)) walkables.push(L.top);
    L.g.visible = true; L.extra.forEach(o => o.visible = !fresh);
    if (fresh) { L.g.position.y = -5; L.rise = 1; } });
  drawLips();
}
const onLand = (x, z, m = .8) => Math.hypot(x, z) < 9 - m || ownedLobes().some(L => Math.hypot(x - L.e.x, z - L.e.z) < L.r - m);
showLobes(false);
const stakes = new THREE.Group(); stakes.position.set(2.45, 0, 2.9);
for (let i=0;i<4;i++) stakes.add(mesh(new THREE.CylinderGeometry(.05,.06,.7,6), mat(0xc98f58), -.4 + i*.27, .35, (i%2)*.12));
stakes.add(mesh(new THREE.TorusGeometry(.2,.05,6,14), mat(0xc9a27a), .45, .08, .1).rotateX(Math.PI/2));
stakes.userData.kind = 'stakes'; scene.add(stakes);

// --- critters ---
function critter({ body, belly, ear, earType, beak, hat, hatType, tail, frog, captain, spikes, owl, shell, outfit }) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); const eyes = [], arms = [];
  const furM = frog || shell ? mat(body) : mat(body, { map:tx('fur', 3, 2) }), bellyM = mat(belly), darkM = fine(0x2b2233), hx = frog ? 1.2 : 1, pawM = fine(new THREE.Color(body).multiplyScalar(.82).getHex());
  const b = mesh(sph(.5), furM, 0, .55, 0); b.scale.set(1,1.05,.95); inner.add(b);
  inner.add(mesh(sph(.3), bellyM, 0, .5, .28));
  const head = mesh(sph(.42), furM, 0, 1.2, 0); if (frog) head.scale.set(1.2,.85,1); inner.add(head);
  // the face: a muzzle, a nose, a smile and whiskers (birds have a beak instead; the frog has a wide mouth)
  if (frog) { const mo = mesh(new THREE.TorusGeometry(.2,.012,5,16,Math.PI*.7), darkM, 0, 1.2, .37); mo.rotation.set(.25, 0, Math.PI*1.15); inner.add(mo); [-1, 1].forEach(sd => inner.add(mesh(sph(.012), darkM, sd*.04, 1.27, .415))); }
  else if (!beak) { const mz = mesh(sph(.13), bellyM, 0, 1.13, .34); mz.scale.set(1.15, .8, .7); inner.add(mz); const ns = mesh(sph(.04), fine(0x5a3a3a), 0, 1.18, .44); ns.scale.set(1.2, .8, .8); inner.add(ns);
    [-1, 1].forEach(sd => { const sm = mesh(new THREE.TorusGeometry(.04,.009,5,10,Math.PI), darkM, sd*.04, 1.12, .435); sm.rotation.z = Math.PI; inner.add(sm);
      if (earType !== 'bunny' || true) [-.03, .03].forEach(dy => { const wk = mesh(new THREE.CylinderGeometry(.003,.003,.16,3), fine(0xffffff), sd*.2, 1.13 + dy, .38); wk.rotation.z = Math.PI/2 + sd*dy*6; wk.rotation.y = -sd*.4; inner.add(wk); }); }); }
  [-1, 1].forEach(sd => { for (let t = -1; t <= 1; t++) inner.add(mesh(sph(.035), pawM, sd*.22 + t*.05, .05, .2)); const pad = mesh(sph(.05), pawM, sd*.5, .62, .12); pad.scale.set(.8, .8, .5); inner.add(pad); }); // toes and paw pads
  [-1,1].forEach(s => {
    const eye = new THREE.Group(); eye.add(mesh(sph(.07), mat(0x2b2233, { roughness:.25 }))); eye.add(mesh(sph(.024), glow(0xffffff), .022, .03, .055));
    if (frog) { inner.add(mesh(sph(.14), mat(body), s*.22, 1.5, .12)); eye.position.set(s*.22, 1.53, .23); }
    else eye.position.set(s*.15, 1.26, .36);
    inner.add(eye); eyes.push(eye);
    const arm = mesh(sph(.13), furM, s*.47, .72, .04); arm.scale.set(.8, 1.25, .8); inner.add(arm); arms.push(arm);
    inner.add(mesh(sph(.07), mat(0xff9fb2), s*.26, 1.12, .32));
    inner.add(mesh(sph(.13), furM, s*.22, .1, .1));
    if (earType === 'round') { inner.add(mesh(sph(.14), mat(ear), s*.3, 1.55, 0)); const ei = mesh(sph(.08), fine(0xffb6c8), s*.3, 1.55, .09); ei.scale.z = .5; inner.add(ei); }
    if (earType === 'long') { const e = mesh(sph(.12), mat(ear), s*.4, 1.3, 0); e.scale.set(1.8,.7,1); inner.add(e); }
    if (earType === 'bunny') { const e = mesh(sph(.11), mat(body), s*.14, 1.78, -.02); e.scale.set(.8, 2.6, .6); e.rotation.z = -s*.12; inner.add(e); const ei = mesh(sph(.07), mat(0xffb6c8), s*.14, 1.8, .04); ei.scale.set(.7, 2.4, .3); ei.rotation.z = -s*.12; inner.add(ei); }
    if (earType === 'mouse') { const e = mesh(new THREE.CylinderGeometry(.2,.2,.05,20), mat(body), s*.34, 1.56, -.02); e.rotation.x = Math.PI/2; inner.add(e); const ei = mesh(new THREE.CylinderGeometry(.13,.13,.02,16), mat(0xffb6c8), s*.34, 1.56, .02); ei.rotation.x = Math.PI/2; inner.add(ei); }
  });
  if (beak) { const k = mesh(new THREE.ConeGeometry(.08,.18,8), mat(beak), 0, 1.15, .45); k.rotation.x = Math.PI/2; inner.add(k); }
  if (tail === 'puff') inner.add(mesh(sph(.14), mat(0xffffff), 0, .45, -.48));
  if (tail === 'long') { const tl = mesh(new THREE.CylinderGeometry(.05,.07,.7,8), mat(body), .1, .6, -.55); tl.rotation.x = -.9; tl.rotation.z = .3; inner.add(tl); }
  if (tail === 'fox') { const tl = mesh(sph(.2), mat(body), .08, .5, -.6); tl.scale.set(.8, .8, 1.8); inner.add(tl); inner.add(mesh(sph(.12), mat(0xffffff), .1, .5, -.88)); }
  if (tail === 'thin') { const tl = mesh(new THREE.TorusGeometry(.25,.025,6,16,Math.PI), mat(0xffb6c8), 0, .45, -.55); tl.rotation.y = Math.PI/2; inner.add(tl); }
  if (hatType === 'crown') for (let i=0;i<9;i++){ const a = i/9*Math.PI*2; inner.add(mesh(sph(.07), mat([hat, 0xffffff, 0xfff3a0][i%3]), Math.cos(a)*.3, 1.55, Math.sin(a)*.3)); }
  if (hatType === 'beanie') { const bn = mesh(new THREE.SphereGeometry(.44,20,10,0,Math.PI*2,0,Math.PI/2.2), mat(hat), 0, 1.3, 0); inner.add(bn); inner.add(mesh(new THREE.TorusGeometry(.4,.06,8,24), mat(hat), 0, 1.42, 0).rotateX(Math.PI/2)); inner.add(mesh(sph(.1), mat(0xffffff), 0, 1.76, 0)); }
  if (hatType === 'bow') [-1,1].forEach(sd => { const bw = mesh(sph(.12), mat(hat), .22 + sd*.1, 1.58, .05); bw.scale.set(1.2,.8,.5); inner.add(bw); });
  if (hatType === 'straw') { inner.add(mesh(new THREE.CylinderGeometry(.6,.62,.04,24), mat(0xf2d38a), 0, 1.58, 0)); inner.add(mesh(new THREE.CylinderGeometry(.26,.3,.24,20), mat(0xf2d38a), 0, 1.7, 0)); inner.add(mesh(new THREE.CylinderGeometry(.305,.305,.06,20), mat(hat), 0, 1.63, 0)); }
  if (hat && (!hatType || hatType === 'tophat')) { inner.add(mesh(new THREE.CylinderGeometry(.35,.4,.08,20), mat(hat), 0, 1.58, 0)); inner.add(mesh(new THREE.CylinderGeometry(.22,.25,.28,20), mat(hat), 0, 1.72, 0)); }
  if (earType === 'point') [-1,1].forEach(sd => { const e = mesh(new THREE.ConeGeometry(.13,.3,8), mat(ear), sd*.26, 1.58, 0); e.rotation.z = -sd*.3; inner.add(e); const ei = mesh(new THREE.ConeGeometry(.07,.2,8), fine(0xffb6c8), sd*.26, 1.56, .045); ei.rotation.z = -sd*.3; inner.add(ei); });
  if (spikes) for (let i=0;i<14;i++){ const a = (i/14)*Math.PI - Math.PI/2, yy = .5 + (i%3)*.3; const sp = mesh(new THREE.ConeGeometry(.07,.32,6), mat(0x6e5345), Math.sin(a)*.42, yy + .2, -Math.cos(a)*.3 - .15); sp.rotation.x = -1.1; sp.rotation.z = -Math.sin(a)*.6; inner.add(sp); }
  if (owl) { [-1,1].forEach(sd => { const disc = mesh(new THREE.CylinderGeometry(.14,.14,.03,16), mat(0xfff6e6), sd*.15, 1.26, .37); disc.rotation.x = Math.PI/2; inner.add(disc);
    const tuft = mesh(new THREE.ConeGeometry(.08,.25,6), mat(body), sd*.28, 1.62, 0); tuft.rotation.z = -sd*.4; inner.add(tuft); });
    inner.add(mesh(new THREE.TorusGeometry(.11,.02,6,16), mat(0x3b2f4a), -.15, 1.26, .41), mesh(new THREE.TorusGeometry(.11,.02,6,16), mat(0x3b2f4a), .15, 1.26, .41)); }
  if (shell) { const sh = mesh(new THREE.SphereGeometry(.62, 20, 12, 0, Math.PI*2, 0, Math.PI/2), mat(0x7a5a3a), 0, .45, -.18); sh.scale.set(1,.9,1.05); inner.add(sh);
    for (let i=0;i<6;i++) inner.add(mesh(new THREE.CylinderGeometry(.13,.13,.04,6), mat(0xa07a4f), Math.cos(i)*.3, .78 + (i%2)*.12, -.3 + Math.sin(i)*.2).rotateX(-.6)); }
  if (captain) { inner.add(mesh(new THREE.CylinderGeometry(.38,.38,.22,20), mat(0x2d3a6b), 0, 1.7, -.05)); inner.add(mesh(new THREE.BoxGeometry(.5,.04,.2), mat(0x1f2a52), 0, 1.6, .3)); inner.add(mesh(sph(.06), glow(0xffc857), 0, 1.72, .33)); }
  if (outfit) { const o = outfit, c = mat(o.color);
    if (o.style === 'cardigan' || o.style === 'coat' || o.style === 'vest' || o.style === 'robe') {
      const top = mesh(new THREE.CylinderGeometry(.44, .52, o.style === 'robe' ? .85 : .55, 20, 1, true), c, 0, o.style === 'robe' ? .45 : .62, 0); top.material.side = THREE.DoubleSide; inner.add(top);
      if (o.style !== 'vest') [-1,1].forEach(sd => { const sl = mesh(sph(.15), c, sd*.47, .72, .04); sl.scale.set(.85, 1.3, .85); inner.add(sl); });
      if (o.style === 'coat' || o.style === 'cardigan') for (let i=0;i<3;i++) inner.add(mesh(sph(.035), mat(o.trim || 0xffc857), 0, .78 - i*.15, .5));
      if (o.style === 'robe') inner.add(mesh(new THREE.TorusGeometry(.49,.04,6,24), mat(o.trim || 0xffc857), 0, .62, 0).rotateX(Math.PI/2));
    }
    if (o.style === 'apron' || o.style === 'overalls') {
      const bib = mesh(new THREE.BoxGeometry(.42, .5, .06), c, 0, .6, .45); bib.rotation.x = -.15; inner.add(bib);
      if (o.style === 'overalls') [-1,1].forEach(sd => inner.add(mesh(new THREE.BoxGeometry(.06,.35,.05), c, sd*.16, .95, .38)));
      if (o.style === 'apron') inner.add(mesh(new THREE.TorusGeometry(.5,.025,6,24), mat(0xffffff), 0, .6, 0).rotateX(Math.PI/2));
    }
    if (o.style === 'dress') { const dr = mesh(new THREE.CylinderGeometry(.42,.62,.6,20), c, 0, .38, 0); inner.add(dr); }
    if (o.acc === 'glasses') { [-1,1].forEach(sd => inner.add(mesh(new THREE.TorusGeometry(.085,.015,6,16), mat(0x9b6b4a), sd*.15, 1.26, .4))); inner.add(mesh(new THREE.BoxGeometry(.08,.015,.015), mat(0x9b6b4a), 0, 1.27, .41)); }
    if (o.acc === 'bowtie') [-1,1].forEach(sd => { const bt = mesh(new THREE.ConeGeometry(.08,.14,4), mat(o.trim || 0xff5a5a), sd*.07, .96, .42); bt.rotation.z = sd*Math.PI/2; inner.add(bt); });
    if (o.acc === 'scarf') { inner.add(mesh(new THREE.TorusGeometry(.33,.08,8,24), mat(o.trim || 0x9fe7e0), 0, .92, 0).rotateX(Math.PI/2)); const tail2 = mesh(new THREE.BoxGeometry(.12,.35,.06), mat(o.trim || 0x9fe7e0), .18, .75, .36); tail2.rotation.z = .2; inner.add(tail2); }
  }
  if (!beak) { const smile = mesh(new THREE.TorusGeometry(.06, .016, 6, 12, Math.PI), mat(0x2b2233), 0, frog ? 1.12 : 1.1, frog ? .48 : .39); smile.rotation.z = Math.PI; inner.add(smile); }
  g.userData.inner = inner; inner.userData.eyes = eyes; inner.userData.arms = arms; if (!inner.userData.scarf) inner.userData.scarf = null; inner.userData.blink = Math.random()*4;
  scene.add(g); return g;
}
// the player's character is rebuilt from their chosen look
const player = new THREE.Group(); scene.add(player);
function person(lk) {
  lk = { ...DEFAULT_LOOK, ...lk };
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); const eyes = [], arms = [];
  const skin = mat(lk.skin), shirt = mat(lk.shirt), bottom = mat(lk.bottomColor), hair = mat(lk.hairColor), shoe = mat(lk.shoeColor), dark = mat(0x2b2233);
  const dress = lk.top === 'dress', longSleeve = ['hoodie','sweater','buttonup'].includes(lk.top);
  // legs and shoes
  [-1,1].forEach(sd => {
    inner.add(mesh(new THREE.CylinderGeometry(.085,.075,.5,10), lk.bottom === 'pants' && !dress ? bottom : skin, sd*.12, .32, 0));
    if (lk.bottom === 'shorts' && !dress) inner.add(mesh(new THREE.CylinderGeometry(.1,.095,.2,10), bottom, sd*.12, .5, 0));
    if (lk.shoes === 'boots' || lk.shoes === 'rainboots') { inner.add(mesh(new THREE.CylinderGeometry(.095,.09,lk.shoes === 'rainboots' ? .3 : .22,10), shoe, sd*.12, lk.shoes === 'rainboots' ? .2 : .16, 0)); }
    const sh = mesh(sph(.1), shoe, sd*.12, .07, .04); sh.scale.set(1, .6, 1.4); inner.add(sh);
    if (lk.shoes === 'sneakers') { const sole = mesh(sph(.1), mat(0xffffff), sd*.12, .045, .04); sole.scale.set(1.04, .25, 1.44); inner.add(sole); }
  });
  // hips: skirt, dress, or waistband
  if (dress) inner.add(mesh(new THREE.CylinderGeometry(.24,.44,.55,18), shirt, 0, .52, 0));
  else if (lk.bottom === 'skirt') inner.add(mesh(new THREE.CylinderGeometry(.24,.4,.38,18), bottom, 0, .58, 0));
  else if (lk.bottom === 'longskirt') inner.add(mesh(new THREE.CylinderGeometry(.24,.42,.62,18), bottom, 0, .46, 0));
  else inner.add(mesh(new THREE.CylinderGeometry(.25,.24,.2,16), bottom, 0, .62, 0));
  // body
  inner.add(mesh(new THREE.CylinderGeometry(.22,.26,.52,16), shirt, 0, .95, 0));
  const shoulders = mesh(sph(.23), shirt, 0, 1.18, 0); shoulders.scale.set(1.1, .5, .85); inner.add(shoulders);
  if (lk.top === 'sweater') [0,1,2].forEach(i => inner.add(mesh(new THREE.TorusGeometry(.235 + i*.008,.022,6,24), mat(0xfff1d6), 0, .8 + i*.14, 0).rotateX(Math.PI/2)));
  if (lk.top === 'hoodie') { const hood = mesh(new THREE.TorusGeometry(.17,.07,8,20), shirt, 0, 1.25, -.08); hood.rotation.x = Math.PI/2.4; inner.add(hood);
    const pk = mesh(new THREE.BoxGeometry(.24,.12,.04), mat(new THREE.Color(lk.shirt).multiplyScalar(.85).getHex()), 0, .82, .235); inner.add(pk);
    [-1,1].forEach(sd => inner.add(mesh(new THREE.CylinderGeometry(.01,.01,.14,5), mat(0xffffff), sd*.05, 1.1, .25))); }
  if (lk.top === 'buttonup') { [-1,1].forEach(sd => { const c = mesh(new THREE.BoxGeometry(.1,.04,.08), shirt, sd*.07, 1.24, .15); c.rotation.z = sd*.5; inner.add(c); });
    [0,1,2].forEach(i => inner.add(mesh(sph(.018), mat(0xfff1d6), 0, 1.1 - i*.13, .25 - i*.005))); }
  if (lk.top === 'overalls') { const bib = mesh(new THREE.BoxGeometry(.3,.28,.06), bottom, 0, .9, .21); inner.add(bib);
    inner.add(mesh(new THREE.CylinderGeometry(.262,.262,.22,16), bottom, 0, .74, 0));
    [-1,1].forEach(sd => { inner.add(mesh(new THREE.BoxGeometry(.05,.34,.04), bottom, sd*.12, 1.1, .16)); inner.add(mesh(sph(.022), mat(0xd9a441, { metalness:.6 }), sd*.12, 1.0, .25)); }); }
  const jacket = lk.jacket === 'pioneer' ? mat(0x8a5a3a) : null;
  if (jacket) { inner.add(mesh(new THREE.CylinderGeometry(.245,.285,.5,16), jacket, 0, .96, 0)); const sh2 = mesh(sph(.25), jacket, 0, 1.18, 0); sh2.scale.set(1.12, .5, .9); inner.add(sh2);
    inner.add(mesh(new THREE.TorusGeometry(.19,.06,8,20), mat(0xfff1d6), 0, 1.22, 0).rotateX(Math.PI/2)); [-1,1].forEach(sd => inner.add(mesh(sph(.025), mat(0xd9a441, { metalness:.6 }), sd*.06, 1.05 - .12, .27)));
    const scarf = new THREE.Group(); scarf.position.set(.08, 1.25, -.16); inner.add(scarf); inner.add(mesh(new THREE.TorusGeometry(.15,.05,8,20), mat(0xd2334c), 0, 1.27, 0).rotateX(Math.PI/2));
    let seg = scarf; for (let i = 0; i < 4; i++) { const p = new THREE.Group(); p.position.set(0, i ? -.13 : 0, i ? -.02 : 0); p.add(mesh(new THREE.BoxGeometry(.1,.14,.03), mat(i % 2 ? 0xfff1d6 : 0xd2334c), 0, -.07, 0)); seg.add(p); seg = p; }
    inner.userData.scarf = scarf; }
  // arms that swing from the shoulder
  [-1,1].forEach(sd => {
    const arm = new THREE.Group(); arm.position.set(sd*.3, 1.15, 0); arm.rotation.z = sd*.08;
    arm.add(mesh(new THREE.CylinderGeometry(.07,.065,.28,10), jacket || shirt, 0, -.13, 0));
    arm.add(mesh(new THREE.CylinderGeometry(.06,.055,.24,10), jacket || longSleeve ? (jacket || shirt) : skin, 0, -.37, 0));
    arm.add(mesh(sph(.065), skin, 0, -.5, 0));
    inner.add(arm); arms.push(arm);
  });
  // neck and head
  inner.add(mesh(new THREE.CylinderGeometry(.08,.09,.1,10), skin, 0, 1.27, 0));
  inner.add(mesh(sph(.33), skin, 0, 1.52, 0));
  [-1,1].forEach(sd => {
    // each eye blinks by squashing its outer group, so the eye's own shape lives in a child group
    const eye = new THREE.Group(), e2 = new THREE.Group(); eye.add(e2);
    if (lk.eyes === 'happy') { const arc = mesh(new THREE.TorusGeometry(.04,.013,6,12,Math.PI), dark); arc.position.y = -.01; e2.add(arc); }
    else {
      e2.add(mesh(sph(.05), mat(lk.eyeColor, { roughness:.25 })));
      if (lk.eyeColor !== 0x2b2233) e2.add(mesh(sph(.027), dark, 0, 0, .03));
      e2.add(mesh(sph(.018), glow(0xffffff), .016, .022, .04));
      if (lk.eyes === 'lashes') [0,1].forEach(i => { const l = mesh(new THREE.BoxGeometry(.035,.012,.01), dark, sd*(.045 + i*.012), .035 + i*.012, .02); l.rotation.z = sd*(.5 + i*.3); e2.add(l); });
      if (lk.eyes === 'sleepy') { e2.scale.y = .55; e2.position.y = -.01; }
    }
    eye.position.set(sd*.12, 1.56, .29); inner.add(eye); eyes.push(eye);
    if (lk.brows !== 'none') { const b = mesh(new THREE.BoxGeometry(.09, lk.brows === 'bold' ? .028 : .016, .02), hair, sd*.12, 1.65, .3); b.rotation.z = -sd*.12; inner.add(b); }
    if (lk.blush) inner.add(mesh(sph(.055), mat(0xff9fb2), sd*.2, 1.47, .25));
    if (lk.freckles) [[.17,1.5],[.21,1.48],[.19,1.45]].forEach(([x, y]) => inner.add(mesh(sph(.011), mat(new THREE.Color(lk.skin).multiplyScalar(.62).getHex()), sd*x, y, .28)));
    if (lk.glasses) inner.add(mesh(new THREE.TorusGeometry(.075,.012,6,18), dark, sd*.12, 1.56, .31));
    inner.add(mesh(sph(.06), skin, sd*.33, 1.52, 0)); // ears
  });
  if (lk.glasses) inner.add(mesh(new THREE.BoxGeometry(.08,.012,.012), dark, 0, 1.57, .32));
  inner.add(mesh(sph(.035), mat(new THREE.Color(lk.skin).multiplyScalar(.9).getHex()), 0, 1.5, .33)); // nose
  const smile = mesh(new THREE.TorusGeometry(.05, .013, 6, 12, Math.PI), dark, 0, 1.42, .31); smile.rotation.z = Math.PI; inner.add(smile);
  // hair
  const h = lk.hair, cap = mesh(new THREE.SphereGeometry(.35, 22, 12, 0, Math.PI*2, 0, Math.PI/2.1), hair, 0, 1.54, -.02); cap.rotation.x = -.25;
  if (h === 'buzz') { cap.scale.setScalar(.97); cap.position.y = 1.55; }
  if (h !== 'afro') inner.add(cap);
  if (h === 'long' || h === 'wavy') { const back = mesh(sph(.3), hair, 0, 1.3, -.2); back.scale.set(1.15, 1.5, .6); inner.add(back);
    if (h === 'wavy') for (let i = 0; i < 6; i++) { const a = (i/5 - .5) * 2.4; inner.add(mesh(sph(.09), hair, Math.sin(a)*.32, 1.12 + Math.abs(Math.sin(i*1.3))*.05, -.18 + Math.cos(a)*.05)); } }
  if (h === 'bun') inner.add(mesh(sph(.14), hair, 0, 1.86, -.14));
  if (h === 'twinbuns') [-1,1].forEach(sd => inner.add(mesh(sph(.12), hair, sd*.22, 1.84, -.06)));
  if (h === 'ponytail') { inner.add(mesh(sph(.08), hair, 0, 1.7, -.33)); const pt = mesh(sph(.12), hair, 0, 1.46, -.4); pt.scale.set(.8, 2, .8); inner.add(pt); }
  if (h === 'braid') for (let i = 0; i < 6; i++) inner.add(mesh(sph(.075 - i*.004), hair, .2 + i*.01, 1.4 - i*.1, .12 + (i % 2 ? .02 : 0)));
  if (h === 'curly') for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; inner.add(mesh(sph(.1), hair, Math.cos(a)*.3, 1.68 + Math.sin(i*1.7)*.05, Math.sin(a)*.3 - .03)); }
  if (h === 'afro') { const af = mesh(new THREE.IcosahedronGeometry(.47, 2), hair, 0, 1.72, -.2); af.scale.set(1.05, .9, .8); inner.add(af); }
  if (h === 'locs') for (let i = 0; i < 11; i++) { const a = Math.PI*.15 + i/10*Math.PI*1.7; const l = mesh(new THREE.CylinderGeometry(.04,.035,.42,6), hair, Math.sin(a)*.32, 1.36, -Math.cos(a)*.3 - .02); inner.add(l); }
  if (h === 'spiky') for (let i = 0; i < 7; i++) { const a = (i/6 - .5) * 2.2; const sp = mesh(new THREE.ConeGeometry(.07,.2,6), hair, Math.sin(a)*.22, 1.84 - Math.abs(a)*.06, .05 - Math.abs(a)*.03); sp.rotation.z = -a*.5; sp.rotation.x = -.3; inner.add(sp); }
  if (h === 'sidepart') { const sw2 = mesh(sph(.2), hair, .1, 1.75, .12); sw2.scale.set(1.3, .5, .9); sw2.rotation.z = -.3; inner.add(sw2); }
  if (h === 'pigtails') [-1,1].forEach(sd => { const pt = mesh(sph(.12), hair, sd*.36, 1.42, -.08); pt.scale.set(.8, 1.3, .8); inner.add(pt); });
  if (h === 'bob') [-1,1].forEach(sd => { const sdh = mesh(sph(.18), hair, sd*.27, 1.46, -.03); sdh.scale.set(.6, 1.2, 1); inner.add(sdh); });
  // hats, sized for a person's head
  const hc = lk.hatColor, y = 1.8;
  if (lk.hat === 'tophat') { inner.add(mesh(new THREE.CylinderGeometry(.34,.38,.06,20), mat(hc), 0, y, 0)); inner.add(mesh(new THREE.CylinderGeometry(.22,.24,.28,20), mat(hc), 0, y + .16, 0)); }
  if (lk.hat === 'crown') for (let i=0;i<9;i++){ const a = i/9*Math.PI*2; inner.add(mesh(sph(.065), mat([hc, 0xffffff, 0xfff3a0][i%3]), Math.cos(a)*.28, y - .07, Math.sin(a)*.28)); }
  if (lk.hat === 'beanie') { inner.add(mesh(new THREE.SphereGeometry(.36,20,10,0,Math.PI*2,0,Math.PI/2.1), mat(hc), 0, 1.58, -.01)); inner.add(mesh(new THREE.TorusGeometry(.33,.05,8,24), mat(hc), 0, 1.64, 0).rotateX(Math.PI/2)); inner.add(mesh(sph(.09), mat(0xffffff), 0, 1.96, 0)); }
  if (lk.hat === 'bow') [-1,1].forEach(sd => { const bw = mesh(sph(.1), mat(hc), .2 + sd*.09, 1.8, .06); bw.scale.set(1.2,.8,.5); inner.add(bw); });
  if (lk.hat === 'pioneer') { inner.add(mesh(new THREE.SphereGeometry(.37,20,10,0,Math.PI*2,0,Math.PI/2), mat(0x8a5a3a), 0, 1.57, -.01));
    [-1,1].forEach(sd => { const f = mesh(sph(.12), mat(0x8a5a3a), sd*.33, 1.42, .02); f.scale.set(.5, 1.2, .9); inner.add(f); });
    [-1,1].forEach(sd => { inner.add(mesh(new THREE.TorusGeometry(.085,.025,8,16), mat(0xd9a441, { metalness:.6, roughness:.3 }), sd*.11, 1.8, .26)); inner.add(mesh(new THREE.CircleGeometry(.07,16), new THREE.MeshStandardMaterial({ color:0x9fe7e0, transparent:true, opacity:.7 }), sd*.11, 1.8, .27)); });
    inner.add(mesh(new THREE.TorusGeometry(.36,.02,6,24), mat(0x5a3a28), 0, 1.66, 0).rotateX(Math.PI/2.4)); inner.add(mesh(new THREE.OctahedronGeometry(.05), glow(0xffe07a), .2, 1.9, .2)); }
  if (lk.hat === 'party') { const ph = mesh(new THREE.ConeGeometry(.2,.45,16), mat(hc), 0, y + .15, 0); inner.add(ph); inner.add(mesh(sph(.07), mat(0xffffff), 0, y + .4, 0)); for (let i=0;i<3;i++) inner.add(mesh(new THREE.TorusGeometry(.2 - i*.055,.018,6,16), mat(0xffffff), 0, y + i*.12, 0).rotateX(Math.PI/2)); }
  if (lk.hat === 'straw') { inner.add(mesh(new THREE.CylinderGeometry(.56,.58,.04,24), mat(0xf2d38a), 0, y - .04, 0)); inner.add(mesh(new THREE.CylinderGeometry(.24,.28,.22,20), mat(0xf2d38a), 0, y + .08, 0)); inner.add(mesh(new THREE.CylinderGeometry(.285,.285,.06,20), mat(hc), 0, y + .01, 0)); }
  const hy = h === 'afro' ? .12 : 0;
  if (lk.hat === 'cap') { inner.add(mesh(new THREE.SphereGeometry(.36,20,10,0,Math.PI*2,0,Math.PI/2.2), mat(hc), 0, 1.6 + hy, -.01)); const bill = mesh(new THREE.CylinderGeometry(.22,.22,.03,20,1,false,0,Math.PI), mat(hc), 0, 1.68 + hy, .2); bill.rotation.y = -Math.PI/2; bill.scale.set(1, 1, 1.2); inner.add(bill); inner.add(mesh(sph(.035), mat(hc), 0, 1.95 + hy, 0)); }
  if (lk.hat === 'beret') { const br = mesh(sph(.33), mat(hc), .05, 1.83 + hy, -.02); br.scale.set(1.1, .32, 1.05); br.rotation.z = -.2; inner.add(br); inner.add(mesh(new THREE.CylinderGeometry(.015,.015,.06,5), mat(hc), .02, 1.94 + hy, 0)); }
  if (lk.hat === 'bucket') { inner.add(mesh(new THREE.CylinderGeometry(.3,.35,.24,20), mat(hc), 0, 1.8 + hy, 0)); inner.add(mesh(new THREE.CylinderGeometry(.36,.48,.08,20), mat(hc), 0, 1.68 + hy, 0)); }
  if (lk.hat === 'headband') inner.add(mesh(new THREE.TorusGeometry(.325,.03,6,24), mat(hc), 0, 1.72 + hy * .5, .02).rotateX(Math.PI/2 - .35));
  g.userData.inner = inner; inner.userData.eyes = eyes; inner.userData.arms = arms; inner.userData.blink = Math.random()*4;
  return g;
}
// the player's character is a person, rebuilt from their chosen look
function dressPlayer() {
  const lk = { ...DEFAULT_LOOK, ...(S.look && S.look.human ? S.look : {}) };
  player.children.slice().forEach(c => player.remove(c));
  let legend = false; try { legend = S.mythForm && mythOn(); } catch {} // a founder in their secret legendary form
  const c = legend ? mythModel(mythKind()) : person(lk); player.add(c); player.userData.inner = c.userData.inner;
}
dressPlayer();
let ownerNpc = null;
if (VISIT) {
  ownerNpc = person({ ...DEFAULT_LOOK, ...(VISIT.look && VISIT.look.human ? VISIT.look : {}) }); ownerNpc.position.set(-3.1, 0, -1.2); ownerNpc.rotation.y = .6;
  ownerNpc.userData.kind = 'owner'; scene.add(ownerNpc);
  const tag = labelSprite(VISIT.name); tag.position.y = 2.25; ownerNpc.add(tag);
}
player.position.set(...S.pos);
const npcs = {
  nana: critter({ body:0xf6f1ea, belly:0xffffff, ear:0x3b2f4a, earType:'long', outfit:{ style:'cardigan', color:0xc9b6ff, trim:0xffffff, acc:'glasses' } }),
  pip:  critter({ body:0x86c7ff, belly:0xfff3a0, beak:0xffb347, hat:0xff8fa3, outfit:{ style:'vest', color:0x8fdc8a } }),
  drizzle: critter({ body:0x7fcf8f, belly:0xe6f7c8, frog:true, captain:true, outfit:{ style:'coat', color:0x2d3a6b, trim:0xffc857 } }),
};
const mole = () => critter({ body:0x8b6b5a, belly:0xd9bfa6, ear:0x6e5345, earType:'round', beak:0xff9fb2, outfit:{ style:'overalls', color:0x3f5a8c } });
npcs.twins = new THREE.Group(); scene.add(npcs.twins);
const moss = mole(), fern = mole(); moss.position.x = -.45; fern.position.x = .45; fern.scale.setScalar(.9); moss.scale.setScalar(.8);
fern.userData.inner.add(mesh(new THREE.TorusGeometry(.1,.02,6,16), mat(0x3b2f4a), .15, 1.26, .4), mesh(new THREE.TorusGeometry(.1,.02,6,16), mat(0x3b2f4a), -.15, 1.26, .4));
npcs.twins.add(moss, fern); npcs.twins.userData.inner = moss.userData.inner;
npcs.twins.position.set(WIND_POS.x - 2.5, WIND_POS.y, WIND_POS.z + 2);
npcs.lumen = critter({ body:0x3b2f4a, belly:0x5a4b7a, outfit:{ acc:'scarf', trim:0x9fe7e0 } });
npcs.lumen.userData.inner.add(mesh(sph(.32), glow(0xfff38a), 0, .45, -.42));
const wingM = new THREE.MeshBasicMaterial({ color:0xdff3ff, transparent:true, opacity:.45, side:THREE.DoubleSide });
[-1,1].forEach(s2 => { const wg = new THREE.Mesh(new THREE.PlaneGeometry(.6,.3), wingM); wg.position.set(s2*.42, 1, -.25); wg.rotation.set(.3, s2*.5, s2*.4); npcs.lumen.userData.inner.add(wg); });
npcs.lumen.scale.setScalar(.75); npcs.lumen.position.set(NIGHT_POS.x - 1.2, NIGHT_POS.y, NIGHT_POS.z + 1.2);
npcs.nana.position.set(.1,0,-4.7);
function bubbleTex(kind) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = kind === '!' ? '#ffc857' : '#fff8ee'; g.beginPath(); g.arc(32,28,24,0,7); g.fill(); g.beginPath(); g.moveTo(24,46); g.lineTo(32,60); g.lineTo(38,46); g.fill();
  g.fillStyle = '#3b2f4a'; if (kind === '!') { g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('!', 32, 40); } else [20,32,44].forEach(x => { g.beginPath(); g.arc(x, 28, 4.5, 0, 7); g.fill(); });
  return new THREE.CanvasTexture(c); }
const BUBBLE = { '!':bubbleTex('!'), '...':bubbleTex('...') };
const bubbles = []; npcs.nana.scale.setScalar(1.05);
npcs.pip.position.set(-4.2,0,3); npcs.pip.scale.setScalar(.8);
npcs.drizzle.position.set(ORCH_POS.x - 1.5, ORCH_POS.y, ORCH_POS.z - .5);
for (const [id, v] of Object.entries(VILLAGERS)) {
  const b = BUILDINGS.find(x => x.id === v.building), c = critter({ ...VILLAGER_LOOK[id], outfit:{ mabel:{ style:'apron', color:0xfff6e6 }, hoot:{ acc:'bowtie', trim:0xff5a5a }, allegra:{ style:'dress', color:0xff8fa3 }, sage:{ style:'robe', color:0xc98f58, trim:0xffc857 } }[id] });
  c.position.set(OH.x + b.pos[0] - 1.9, OH.y, OH.z + b.pos[1] + 1.7); c.scale.setScalar(id === 'sage' ? .85 : .8); c.visible = false; npcs[id] = c;
}
Object.entries(npcs).forEach(([k,g]) => { g.userData.kind = 'npc'; g.userData.id = k; g.rotation.y = .4;
  const b = new THREE.Sprite(new THREE.SpriteMaterial({ map:BUBBLE['...'], depthWrite:false })); b.scale.setScalar(.6); b.position.y = 2.35; b.visible = false; b.userData = { id:k, ph:Math.random()*6 }; g.add(b); bubbles.push(b); });

// --- orchard: ship, pot, dock ---
const ship = new THREE.Group(); ship.position.set(ORCH_POS.x + 2, ORCH_POS.y, ORCH_POS.z + 4.2); ship.rotation.y = -.4;
const hull = mesh(new THREE.SphereGeometry(1.3, 24, 12, 0, Math.PI*2, Math.PI/2, Math.PI/2), mat(0x3f86c9), 0, .9, 0); hull.scale.set(1.6,.8,.8); ship.add(hull);
const deck = mesh(new THREE.CylinderGeometry(2.05,2.05,.12,24), mat(0xd9a066), 0, .9, 0); deck.scale.set(1, 1, .5); ship.add(deck);
ship.add(mesh(new THREE.CylinderGeometry(.07,.08,3,8), mat(0x9b6b4a), 0, 2.4, 0));
const stripe = mesh(new THREE.TorusGeometry(1.3, .07, 6, 40), mat(0xffffff), 0, .88, 0); stripe.rotation.x = Math.PI/2; stripe.scale.set(1.6, .8, 1); ship.add(stripe);
const flag = mesh(new THREE.PlaneGeometry(.55,.32), new THREE.MeshStandardMaterial({ color:0xff5a5a, side:THREE.DoubleSide }), .3, 3.75, 0); ship.add(flag);
const sail = mesh(new THREE.PlaneGeometry(1.5,1.7), new THREE.MeshStandardMaterial({ color:0xfff6e6, side:THREE.DoubleSide }), .8, 2.6, 0); sail.visible = false; ship.add(sail);
const shipExplore = new THREE.Group(), shipMarket = new THREE.Group(); ship.add(shipExplore, shipMarket);
{ shipExplore.add(mesh(new THREE.CylinderGeometry(.28,.22,.25,10), mat(0x9b6b4a), 0, 3.3, 0)); // crow's nest
  const scope = mesh(new THREE.CylinderGeometry(.05,.08,.6,8), mat(0xd9a441, { metalness:.5, roughness:.4 }), -1.1, 1.25, 0); scope.rotation.z = 1.1; shipExplore.add(scope);
  shipExplore.add(mesh(new THREE.BoxGeometry(.5,.05,.4), mat(0xfff1d6), -.6, .99, .15)); // chart
  for (let i = 0; i < 5; i++) shipMarket.add(mesh(new THREE.BoxGeometry(.5,.08,1), mat(i % 2 ? 0xfff1d6 : 0xff8fa3), -1.4 + i*.5, 2.15, 0).rotateX(.25));
  [-1.3,1.3].forEach(x => shipMarket.add(mesh(new THREE.CylinderGeometry(.04,.04,1.2,6), mat(0x9b6b4a), x, 1.55, .35)));
  [[-.9,0xffc857],[-.4,0x8fdc8a],[.9,0xff9a3c]].forEach(([x,c]) => { shipMarket.add(mesh(new THREE.BoxGeometry(.34,.26,.34), mat(0xc98f58), x, 1.08, .1)); shipMarket.add(mesh(sph(.12), mat(c), x, 1.28, .1)); }); }
function drawShip() { shipExplore.visible = S.shipPath === 'explore'; shipMarket.visible = S.shipPath === 'market'; }
drawShip();
const saggy = mesh(new THREE.PlaneGeometry(1.2,.8), new THREE.MeshStandardMaterial({ color:0xe8dcc8, side:THREE.DoubleSide }), .6, 1.6, 0); saggy.rotation.z = .5; ship.add(saggy);
ship.userData = { kind:'ship', lift:0 }; scene.add(ship);
const pot = new THREE.Group(); pot.position.set(ORCH_POS.x - 1.35, ORCH_POS.y, ORCH_POS.z + 3.5); // right by the ship, clear of the peach tree
pot.add(mesh(new THREE.CylinderGeometry(.42,.34,.45,20), mat(0x6b6f7a, { metalness:.3 }), 0, .23, 0));
const lid = mesh(new THREE.ConeGeometry(.46,.18,20), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.55, roughness:.1 }), 0, .55, 0); lid.visible = false; pot.add(lid);
pot.userData.kind = 'pot'; scene.add(pot);
const dock = new THREE.Group(); dock.position.set(ORCH_POS.x + 6.8, ORCH_POS.y, ORCH_POS.z - 2.5); dock.rotation.y = .5;
for (let i=0;i<5;i++) dock.add(mesh(new THREE.BoxGeometry(.5,.1,1.2), mat(i%2?0xd9a066:0xc98f58), i*.5, .02, 0));
const ripple = mesh(new THREE.TorusGeometry(.5,.04,8,30), glow(0xffffff), 3.2, -.2, 0); ripple.rotation.x = Math.PI/2; dock.add(ripple);
dock.userData.kind = 'dock'; scene.add(dock);
const homeDock = dock.clone(); homeDock.position.set(7.4, 0, -4.4); homeDock.rotation.y = .6; homeDock.userData = { kind:'dock' }; homeDock.visible = false; scene.add(homeDock);
// docks are ground you can walk on, so after fishing you can walk back to land (the home dock only while it is there)
const dockPlanks = d => d.children.filter(c => c.geometry && c.geometry.type === 'BoxGeometry');
dockPlanks(dock).forEach(p => walkables.push(p));
function syncHomeDock() { homeDock.visible = S.mode === 'fisher';
  dockPlanks(homeDock).forEach(p => { const i = walkables.indexOf(p); if (homeDock.visible && i < 0) walkables.push(p); if (!homeDock.visible && i >= 0) walkables.splice(i, 1); }); }

// --- the hut interior (a room far from the islands) ---
const ROOM = new THREE.Vector3(80, 0, -80);
const room = new THREE.Group(); room.position.copy(ROOM); scene.add(room);
const floor = mesh(new THREE.BoxGeometry(7.4,.2,6.4), mat(0xd8a877), 0, -.1, 0); room.add(floor); walkables.push(floor);
for (let i=-3;i<=3;i++) room.add(mesh(new THREE.BoxGeometry(.03,.01,6.4), mat(0xc4935f), i*1.05, .005, 0));
room.add(mesh(new THREE.BoxGeometry(7.4,3.2,.2), mat(0xfff1d6), 0, 1.6, -3.3));
room.add(mesh(new THREE.BoxGeometry(.2,3.2,6.6), mat(0xffe6cc), -3.8, 1.6, 0));
room.add(mesh(new THREE.BoxGeometry(.2,3.2,6.6), mat(0xffe6cc), 3.8, 1.6, 0));
const roomWin = new THREE.MeshBasicMaterial({ color:0xbfe3ff }); room.add(mesh(new THREE.BoxGeometry(1.4,1,.05), roomWin, 0, 1.8, -3.19));
room.add(mesh(new THREE.BoxGeometry(1.55,.1,.1), mat(0x9b6b4a), 0, 1.25, -3.15));
{ // cozy trim: wainscoting on the lower walls, a chair rail, baseboards, wooden caps on the wall tops, and a framed window with curtains
  const wain = mat(0xf2d7b8), trim = mat(0xb98a63), cap = mat(0x9b6b4a);
  room.add(mesh(new THREE.BoxGeometry(7.4,1.1,.04), wain, 0, .55, -3.19)); [-3.69, 3.69].forEach(x => room.add(mesh(new THREE.BoxGeometry(.04,1.1,6.4), wain, x, .55, 0)));
  [[1.12,.06],[.08,.12]].forEach(([y, h]) => { room.add(mesh(new THREE.BoxGeometry(7.4,h,.08), trim, 0, y, -3.17)); [-3.67, 3.67].forEach(x => room.add(mesh(new THREE.BoxGeometry(.08,h,6.4), trim, x, y, 0))); });
  room.add(mesh(new THREE.BoxGeometry(7.8,.1,.34), cap, 0, 3.24, -3.3)); [-3.8, 3.8].forEach(x => room.add(mesh(new THREE.BoxGeometry(.34,.1,6.6), cap, x, 3.24, 0)));
  const wf = mat(0xffffff); [[0, 2.33, 1.56, .09], [0, 1.8, .05, 1], [0, 1.8, 1.4, .05]].forEach(([x, y, w, h]) => room.add(mesh(new THREE.BoxGeometry(w, h, .07), wf, x, y, -3.15)));
  [-.68, .68].forEach(x => room.add(mesh(new THREE.BoxGeometry(.07,1.1,.07), wf, x, 1.8, -3.15)));
  [-1, 1].forEach(sd => { const c = mesh(new THREE.BoxGeometry(.34,1.25,.06), mat(0xffb3c1), sd*.92, 1.78, -3.1); c.rotation.z = sd*.04; room.add(c); });
  room.add(mesh(new THREE.CylinderGeometry(.025,.025,2.3,8), cap, 0, 2.45, -3.08).rotateZ(Math.PI/2)); }
const bed = new THREE.Group(); bed.position.set(-2.6,0,-2.1);
bed.add(mesh(new THREE.BoxGeometry(1.5,.45,2.1), mat(0x9b6b4a), 0, .22, 0));
bed.add(mesh(new THREE.BoxGeometry(1.4,.2,1.5), mat(0x86c7ff), 0, .52, .25));
bed.add(mesh(new THREE.BoxGeometry(1,.2,.45), mat(0xffffff), 0, .55, -.7));
bed.add(mesh(new THREE.BoxGeometry(1.5,.95,.12), mat(0x8a5a3b), 0, .48, -1.02)); bed.add(mesh(new THREE.BoxGeometry(1.42,.06,.5), mat(0xffffff), 0, .63, -.25)); // headboard and a folded sheet
bed.userData.kind = 'bed'; room.add(bed);
const doormat = mesh(new THREE.BoxGeometry(1.4,.04,.7), mat(0xff8fa3), 0, .02, 2.8); doormat.userData.kind = 'door'; room.add(doormat);
const shelf = new THREE.Group(); shelf.position.set(2.4,0,-2.95);
shelf.add(mesh(new THREE.BoxGeometry(2,2,.5), mat(0xb98a63), 0, 1, 0));
[.55,1.25].forEach(y => shelf.add(mesh(new THREE.BoxGeometry(1.85,.05,.45), mat(0x8a6445), 0, y, .02)));
const shelfItems = {
  bone:   (() => { const m = mesh(new THREE.CylinderGeometry(.05,.07,.5,8), mat(0xf4ecd8), -.6, .65, .1); m.rotation.z = Math.PI/2; return m; })(),
  temple: mesh(new THREE.BoxGeometry(.22,.35,.12), mat(0xb0a898), 0, .76, .1),
  tablet: (() => { const m = mesh(new THREE.BoxGeometry(.3,.22,.05), mat(0xc98f58), .6, .7, .1); m.rotation.x = -.2; return m; })(),
  bell:   mesh(new THREE.CylinderGeometry(.08,.15,.22,16), mat(0xffc857, { metalness:.5, roughness:.35 }), -.6, 1.39, .1),
  still:  mesh(new THREE.CylinderGeometry(.1,.08,.14,12), mat(0x9fd3ff), 0, 1.35, .1),
  rope:   (() => { const m = mesh(new THREE.TorusGeometry(.12,.035,8,20), mat(0xc9a27a), .6, 1.4, .1); return m; })(),
};
Object.values(shelfItems).forEach(m => shelf.add(m));
shelf.userData.kind = 'shelf'; room.add(shelf);
const roomLight = new THREE.PointLight(0xffd9a8, 0, 16, 1); roomLight.position.set(ROOM.x, 3, ROOM.z + .5); scene.add(roomLight);
// --- neighbors' homes: walk-in rooms, each dressed for its owner. Everything inside does something when tapped. ---
const ROOMS = {};
function makeRoom(id, n, o) { const c = new THREE.Vector3(ROOM.x + 24 * n, 0, ROOM.z), g = new THREE.Group(); g.position.copy(c); scene.add(g);
  const fl = mesh(new THREE.BoxGeometry(7.4,.2,6.4), mat(o.floor), 0, -.1, 0); g.add(fl); walkables.push(fl);
  for (let i=-3;i<=3;i++) g.add(mesh(new THREE.BoxGeometry(.03,.01,6.4), mat(o.line), i*1.05, .005, 0));
  g.add(mesh(new THREE.BoxGeometry(7.4,3.2,.2), mat(o.wall), 0, 1.6, -3.3)); [-3.8,3.8].forEach(x => g.add(mesh(new THREE.BoxGeometry(.2,3.2,6.6), mat(o.wall2), x, 1.6, 0)));
  const cap = mat(o.trim); g.add(mesh(new THREE.BoxGeometry(7.8,.1,.34), cap, 0, 3.24, -3.3)); [-3.8,3.8].forEach(x => g.add(mesh(new THREE.BoxGeometry(.34,.1,6.6), cap, x, 3.24, 0)));
  g.add(mesh(new THREE.BoxGeometry(7.4,.12,.08), cap, 0, .08, -3.17)); [-3.67,3.67].forEach(x => g.add(mesh(new THREE.BoxGeometry(.08,.12,6.4), cap, x, .08, 0)));
  const win = new THREE.MeshBasicMaterial({ color:0xbfe3ff }), wf = mat(0xffffff); g.add(mesh(new THREE.BoxGeometry(1.4,1,.05), win, o.winX || 0, 1.9, -3.19));
  [[2.43,1.56,.09],[1.37,1.56,.09],[1.9,.05,1],[1.9,1.4,.05]].forEach(([y,w,h]) => g.add(mesh(new THREE.BoxGeometry(w,h,.07), wf, o.winX || 0, y, -3.15)));
  const m = mesh(new THREE.BoxGeometry(1.4,.04,.7), mat(o.mat), 0, .02, 2.8); m.userData = { kind:'roomdoor' }; g.add(m);
  lateClicks.push(g); ROOMS[id] = { g, c, mat:m, out:o.out, name:o.name, win, back:o.back }; return g; }
// put a thing in a room and make all of it tappable
const thing = (g, obj, x, z, w, h, d, fn, label) => { obj.position.set(x, 0, z); g.add(obj); const hb = hitBox(w, h, d); hb.position.set(x, h / 2, z); g.add(hb); deco(hb, fn); hb.userData.label = label; return obj; };
const G = (...kids) => { const g = new THREE.Group(); kids.forEach(k => g.add(k)); return g; };
function enterRoom(id) { const R = ROOMS[id]; if (!R) return; const firstMuseum = id === 'museum' && !S.museumSeen; if (id === 'museum') { drawMuseum(); if (!S.museumSeen) { S.museumSeen = true; setTimeout(() => showCard(`<div class="kicker">THE MUSEUM</div><h2>It is empty. That is your job.</h2><p>Give the museum 1 of each fish, bug, and crop. Each one goes on show for good.</p><p>You get 25 coins for each one, and a sign that says who gave it.</p>`, 'Okay'), 700); } } S.where = 'hut'; S.room = id; player.position.set(R.c.x, 0, R.c.z + 2.2); roomLight.position.set(R.c.x, 3, R.c.z + .5); target = null; pending = null; snapCam(); sfx('door'); drawHud(); save(); if (!firstMuseum) toast(R.name); }
function exitRoom() { const R = ROOMS[S.room];
  if (R && R.back === 'loft') return enterRoom('loft'); // the study opens onto the loft
  if (R && R.back === 'hut') { enterHut(); player.position.set(ROOM.x - 2.3, 0, ROOM.z + 2.3); snapCam(); return; } // down the ladder
  S.room = null; S.where = 'home'; roomLight.position.set(ROOM.x, 3, ROOM.z + .5); if (R) player.position.copy(R.out()); target = null; pending = null; snapCam(); sfx('door'); drawHud(); save(); }
{ // Nana Gale's garden cottage: herbs, seeds, tea, and your grandmother's picture
  const g = makeRoom('nana', 1, { name:"Nana Gale's cottage", floor:0xd8a877, line:0xc4935f, wall:0xe3ecd2, wall2:0xd6e2c2, trim:0x8a6445, mat:0x8fdc8a, winX:-1.2, out:() => new THREE.Vector3(-1, 0, -4.5) });
  const wood = mat(0x9b6b4a), dark = mat(0x7a5236);
  // the seed cabinet: lots of little drawers
  const cab = G(mesh(new THREE.BoxGeometry(1.9,1.7,.5), wood, 0, .85, 0)); for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { cab.add(mesh(new THREE.BoxGeometry(.3,.3,.05), mat(0xc98f58), -.72 + c*.36, .3 + r*.38, .26)); cab.add(mesh(sph(.03), mat(0xffc857), -.72 + c*.36, .3 + r*.38, .3)); }
  thing(g, cab, 2.3, -2.9, 2, 1.8, .7, () => HELP.nana.run(), 'Seed cabinet: tap to help Nana');
  // herbs hung up to dry
  const herbs = G(mesh(new THREE.CylinderGeometry(.02,.02,2.2,6), dark, 0, 2.75, 0).rotateZ(Math.PI/2)); [-.8,-.4,0,.4,.8].forEach((x, i) => { const b = mesh(new THREE.ConeGeometry(.12,.45,7), mat([0x7fb86a,0xc9b6ff,0x8fdc8a,0xd9c06a,0x7fb86a][i]), x, 2.45, 0); b.rotation.x = Math.PI; herbs.add(b); });
  thing(g, herbs, .9, -3.0, 2.2, 3, .5, () => toy('herbs'), 'Drying herbs: tap to try');
  // kettle on a little stove
  const stove = G(mesh(new THREE.BoxGeometry(.9,.8,.7), mat(0x5a5560), 0, .4, 0), mesh(new THREE.CylinderGeometry(.2,.24,.26,14), mat(0x7ec8e3), 0, .93, 0), mesh(new THREE.TorusGeometry(.14,.025,6,14,Math.PI), mat(0x3b2f4a), 0, 1.06, 0), mesh(new THREE.CylinderGeometry(.03,.05,.22,8), mat(0x7ec8e3), .24, .98, 0).rotateZ(-.9));
  thing(g, stove, -3.0, -2.6, 1, 1.3, .9, () => toy('kettle'), 'Kettle: tap to make tea');
  // rocking chair
  const chair = G(mesh(new THREE.BoxGeometry(.7,.08,.6), wood, 0, .45, 0), mesh(new THREE.BoxGeometry(.7,.9,.08), wood, 0, .9, -.28)); [-.3,.3].forEach(x => { const rk = mesh(new THREE.TorusGeometry(.5,.035,6,16,1.6), dark, x, .52, 0); rk.rotation.set(0, Math.PI/2, Math.PI*1.245); chair.add(rk); [-.22,.22].forEach(z => chair.add(mesh(new THREE.BoxGeometry(.06,.4,.06), wood, x, .25, z))); });
  chair.rotation.y = .7; thing(g, chair, -2.4, .6, 1, 1.4, 1, () => { const L = NEIGHBORS.nana.heartLines; openDialog('Nana Gale', L[Math.floor(Math.random() * L.length)], [], S.hearts.nana); }, 'Rocking chair: tap to hear Nana');
  // your grandmother's picture
  const pic = G(mesh(new THREE.BoxGeometry(.8,.95,.05), mat(0xffc857), 0, 2.05, 0), mesh(new THREE.BoxGeometry(.64,.79,.02), mat(0xfff1d6), 0, 2.05, .03), mesh(sph(.14), mat(0xf4c9a0), 0, 2.15, .05), mesh(new THREE.BoxGeometry(.3,.26,.02), mat(0x9a93a8), 0, 1.88, .05));
  thing(g, pic, .2, -3.16, 1, 3, .3, () => toy('picture'), 'Picture: tap to dust it');
  // seedlings on the windowsill: one seed a day
  const pots = G(mesh(new THREE.BoxGeometry(1.5,.06,.3), wood, 0, 1.3, 0)); [-.5,0,.5].forEach(x => { pots.add(mesh(new THREE.CylinderGeometry(.11,.08,.16,10), mat(0xc0703f), x, 1.41, 0)); pots.add(mesh(sph(.09), mat(0x7fd88a), x, 1.55, 0)); });
  thing(g, pots, -1.2, -3.0, 1.6, 1.9, .5, () => pickSeeds('nanaSill'), 'Seedlings: tap for a seed');
  // a braided rug
  const rug = mesh(new THREE.CylinderGeometry(1.3,1.3,.03,28), mat(0xd9825b), 0, .02, 0); g.add(mesh(new THREE.CylinderGeometry(1,1,.035,28), mat(0xfff1d6), 0, .02, .4)); rug.position.z = .4; g.add(rug);
}
{ // Pip's Shop: his dream, finally real. Seeds, furniture, a scale, and a sign he keeps repainting
  const g = makeRoom('pip', 2, { name:"Pip's Shop", floor:0xe6c79a, line:0xd1ae7c, wall:0xcfe9ff, wall2:0xbfe0fb, trim:0xfff6e6, mat:0xff8fa3, winX:1.6, out:() => SQL(.9, -3.1) });
  const wood = mat(0xc98f58), dark = mat(0x9b6b4a);
  // the counter, with jars of seeds
  const counter = G(mesh(new THREE.BoxGeometry(3,.9,.8), mat(0x86c7ff), 0, .45, 0), mesh(new THREE.BoxGeometry(3.1,.08,.9), wood, 0, .94, 0)); [0xffc857,0x8fdc8a,0xc9b6ff,0xff8fa3].forEach((c, i) => { counter.add(mesh(new THREE.CylinderGeometry(.13,.13,.3,12), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.55 }), -1.1 + i*.4, 1.13, .1)); counter.add(mesh(sph(.09), mat(c), -1.1 + i*.4, 1.08, .1)); });
  thing(g, counter, -.6, -1.4, 3.2, 1.4, 1, () => seedShop(), 'Seed counter: tap to buy seeds');
  // Pip himself, behind his counter
  const pipIn = critter({ body:0x86c7ff, belly:0xfff3a0, beak:0xffb347, hat:0xff8fa3, outfit:{ style:'vest', color:0x8fdc8a } }); pipIn.scale.setScalar(.8);
  thing(g, pipIn, .4, -2.4, .9, 1.6, .8, () => talk('pip'), 'Pip: tap to talk');
  // lemonade
  const lem = G(mesh(new THREE.CylinderGeometry(.14,.12,.34,12), new THREE.MeshStandardMaterial({ color:0xfff3a0, transparent:true, opacity:.8 }), 0, 1.15, 0), mesh(sph(.06), mat(0xffe07a), .05, 1.3, 0));
  thing(g, lem, .65, -1.35, .5, 1.6, .6, () => HELP.pip.run(), 'Lemonade: tap to help Pip');
  // a balance scale
  const scale = G(mesh(new THREE.CylinderGeometry(.03,.05,.5,8), mat(0xd9a441, { metalness:.5 }), 0, 1.23, 0), mesh(new THREE.BoxGeometry(.7,.03,.03), mat(0xd9a441, { metalness:.5 }), 0, 1.48, 0)); [-.33,.33].forEach(x => scale.add(mesh(new THREE.CylinderGeometry(.13,.1,.04,12), mat(0xd9a441, { metalness:.5 }), x, 1.32, 0)));
  thing(g, scale, 1.25, -1.4, .8, 1.7, .6, () => toy('scale'), 'Scale: tap to try');
  // furniture for sale
  const furn = G(mesh(new THREE.BoxGeometry(.7,.4,.7), mat(0xff8fa3), 0, .3, 0), mesh(new THREE.BoxGeometry(.7,.7,.14), mat(0xff8fa3), 0, .65, -.3), mesh(new THREE.CylinderGeometry(.03,.05,1.3,8), dark, .9, .65, -.2), mesh(new THREE.ConeGeometry(.28,.3,12,1,true), mat(0xfff3a0), .9, 1.4, -.2));
  thing(g, furn, -2.7, 1.2, 1.9, 1.6, 1.1, () => furnShop(), 'Furniture: tap to buy');
  // the sign he keeps repainting
  const easel = G(mesh(new THREE.BoxGeometry(1.2,.6,.05), mat(0xfff6e6), 0, 1.25, 0), mesh(new THREE.BoxGeometry(.5,.08,.02), mat(0xff8fa3), -.2, 1.33, .03), mesh(new THREE.BoxGeometry(.3,.08,.02), mat(0x7ec8e3), .25, 1.15, .03)); [-.45,.45].forEach(x => easel.add(mesh(new THREE.BoxGeometry(.06,1.5,.06), dark, x, .75, -.06)));
  easel.rotation.y = -.5; thing(g, easel, 2.7, .6, 1.3, 1.7, .8, () => toy('sign'), "Pip's sign ideas: tap to look");
  // his first coin
  const jar = G(mesh(new THREE.BoxGeometry(.5,.5,.3), dark, 0, 1.75, 0), mesh(new THREE.CylinderGeometry(.11,.11,.03,16), mat(0xffc857, { metalness:.5 }), 0, 1.75, .17).rotateX(Math.PI/2));
  thing(g, jar, -2.9, -3.1, .7, 2.2, .4, () => toy('coin'), 'Framed coin: tap to flip it');
  // shelves of goods on the back wall
  const sh = G(); [1.2, 1.9].forEach(y => { sh.add(mesh(new THREE.BoxGeometry(2.4,.06,.35), wood, 0, y, 0)); [0xffc857,0x8fdc8a,0xff8fa3,0xc9b6ff,0x7ec8e3].forEach((c, i) => sh.add(mesh(new THREE.BoxGeometry(.3,.3,.25), mat(c), -.9 + i*.45, y + .18, 0))); }); sh.position.set(-.9, 0, -3.0); g.add(sh);
}
{ // Captain Drizzle's cabin: everything a sailor needs, and a few fish
  const g = makeRoom('drizzle', 3, { name:"Captain Drizzle's cabin", floor:0xb98a5e, line:0x9b7248, wall:0x86b8d9, wall2:0x78aacb, trim:0xfff6e6, mat:0xd6332e, winX:.3, out:() => new THREE.Vector3(ORCH_POS.x - 3, ORCH_POS.y, ORCH_POS.z + 6.5) });
  const wood = mat(0x9b6b4a), dark = mat(0x7a5236), rope = mat(0xe0c98f), brass = mat(0xd9a441, { metalness:.5 });
  // the ship's wheel
  const wheel = G(mesh(new THREE.TorusGeometry(.52,.07,8,28), wood, 0, 1.75, 0), mesh(new THREE.CylinderGeometry(.12,.12,.12,12), brass, 0, 1.75, .03).rotateX(Math.PI/2));
  for (let i = 0; i < 8; i++) { const sp = mesh(new THREE.CylinderGeometry(.03,.03,1.36,6), wood, 0, 1.75, 0); sp.rotation.z = i * Math.PI / 4; wheel.add(sp); }
  thing(g, wheel, -2.3, -3.12, 1.4, 2.6, .4, () => HELP.drizzle.run(), "Ship's wheel: tap to help Drizzle sail");
  // rope and knots on the wall
  const knots = G(mesh(new THREE.BoxGeometry(1.3,.9,.05), mat(0xf1e6cf), 0, 1.85, 0)); [[-.4,2.05],[0,2.05],[.4,2.05],[-.2,1.65],[.2,1.65]].forEach(([x, y]) => { knots.add(mesh(new THREE.TorusGeometry(.1,.03,6,14), rope, x, y, .04)); knots.add(mesh(new THREE.TorusGeometry(.06,.03,6,12), rope, x + .07, y - .03, .05)); });
  thing(g, knots, 2.2, -3.15, 1.4, 2.6, .3, () => toy('knots'), 'Knot rope: tap to try');
  // a compass on a stand
  const comp = G(mesh(new THREE.CylinderGeometry(.06,.1,.9,8), dark, 0, .45, 0), mesh(new THREE.CylinderGeometry(.2,.2,.08,18), brass, 0, .94, 0), mesh(new THREE.BoxGeometry(.28,.02,.04), mat(0xd6332e), 0, .99, 0));
  thing(g, comp, 1.2, -2.6, .6, 1.3, .6, () => toy('compass'), 'Compass: tap to try');
  // the hammock
  const ham = G(mesh(new THREE.CylinderGeometry(.06,.06,1.5,8), dark, -.95, .75, 0), mesh(new THREE.CylinderGeometry(.06,.06,1.5,8), dark, .95, .75, 0));
  [[-.5,1.12,.2],[0,1.0,0],[.5,1.12,-.2]].forEach(([x, y, r]) => { const sl = mesh(new THREE.BoxGeometry(.58,.06,.62), mat(0xfff1d6), x, y, 0); sl.rotation.z = r; ham.add(sl); const st = mesh(new THREE.BoxGeometry(.58,.065,.1), mat(0x3f86c9), x, y, 0); st.rotation.z = r; ham.add(st); });
  [[-.87,1.3,.5],[.87,1.3,-.5]].forEach(([x, y, r]) => { const rp = mesh(new THREE.BoxGeometry(.3,.03,.03), mat(0xe0c98f), x, y, 0); rp.rotation.z = r; ham.add(rp); });
  ham.rotation.y = Math.PI/2; thing(g, ham, 3.0, -.9, .9, 1.5, 2.1, () => toy('hammock'), 'Hammock: tap to try');
  // the chart table, with your grandmother's map
  const chart = G(mesh(new THREE.BoxGeometry(1.5,.08,.9), wood, 0, .8, 0), mesh(new THREE.BoxGeometry(1.1,.02,.65), mat(0xf1e6cf), 0, .85, 0), mesh(new THREE.BoxGeometry(.5,.021,.03), mat(0xd6332e), -.1, .86, .05), mesh(sph(.05), mat(0x3f86c9), .3, .88, -.15)); [[-.65,-.35],[.65,-.35],[-.65,.35],[.65,.35]].forEach(([x, z]) => chart.add(mesh(new THREE.BoxGeometry(.08,.8,.08), dark, x, .4, z)));
  thing(g, chart, -2.6, .2, 1.6, 1.2, 1, () => { const L = NEIGHBORS.drizzle.heartLines; openDialog('Captain Drizzle', L[Math.floor(Math.random() * L.length)], [], S.hearts.drizzle); }, 'Chart table: tap to hear Drizzle');
  // a barrel of ship's biscuit
  const barrel = G(mesh(new THREE.CylinderGeometry(.36,.32,.8,16), wood, 0, .4, 0), mesh(new THREE.TorusGeometry(.355,.025,6,20), mat(0x5a5560), 0, .62, 0).rotateX(Math.PI/2), mesh(new THREE.TorusGeometry(.345,.025,6,20), mat(0x5a5560), 0, .2, 0).rotateX(Math.PI/2), mesh(new THREE.CylinderGeometry(.13,.13,.05,12), mat(0xe6cf9c), .08, .83, .05));
  thing(g, barrel, 2.9, 1.5, .9, 1.1, .9, () => toy('biscuit'), "Ship's biscuit: tap to bite");
  // today's catch
  const bucket = G(mesh(new THREE.CylinderGeometry(.28,.22,.42,14), mat(0x8fa3b3, { metalness:.3 }), 0, .21, 0), mesh(new THREE.CylinderGeometry(.25,.25,.02,14), mat(0x7ec8e3), 0, .4, 0), mesh(sph(.09), mat(0x9fb6c8), .05, .45, 0));
  thing(g, bucket, -3.0, 2.0, .8, .9, .8, () => { if (!daily('drizzleBucket')) return toast('You already took today\'s fish. Drizzle fills the bucket again tomorrow.'); if (!gain('minnow', 1, player.position.clone().setY(1))) return bagFull(); toast('Drizzle: "Take 1, sailor. I always catch 1 more than I need."'); }, "Drizzle's bucket: tap for a fish");
  const rug = mesh(new THREE.CylinderGeometry(1.2,1.2,.03,28), mat(0x3f86c9), 0, .02, .6); g.add(rug); g.add(mesh(new THREE.CylinderGeometry(.9,.9,.035,28), mat(0xfff6e6), 0, .02, .6));
}
{ // Moss & Fern's burrow workshop, dug in under the windmill
  const g = makeRoom('twins', 4, { name:"Moss & Fern's burrow", floor:0x8a6a48, line:0x7a5c3e, wall:0x9c7a55, wall2:0x8f6e4b, trim:0x5f4630, mat:0x8fdc8a, winX:2.5, out:() => new THREE.Vector3(WIND_POS.x + 3.4, WIND_POS.y, WIND_POS.z + 1.5) });
  const wood = mat(0x9b6b4a), dark = mat(0x6b4a30), iron = mat(0x8a8f96, { metalness:.4 });
  // the workbench: a half-dug model tunnel
  const bench = G(mesh(new THREE.BoxGeometry(1.9,.1,.8), wood, 0, .8, 0), mesh(new THREE.BoxGeometry(.9,.4,.5), mat(0x7a5c3e), -.3, 1.05, 0), mesh(new THREE.CylinderGeometry(.16,.16,.52,14,1,false,0,Math.PI), mat(0x2a1c12), -.3, .86, 0).rotateX(Math.PI/2).rotateZ(Math.PI/2), mesh(new THREE.BoxGeometry(.08,.3,.08), iron, .6, 1, .1)); [[-.85,-.3],[.85,-.3],[-.85,.3],[.85,.3]].forEach(([x, z]) => bench.add(mesh(new THREE.BoxGeometry(.1,.8,.1), dark, x, .4, z)));
  thing(g, bench, -.9, -2.7, 2, 1.5, .9, () => HELP.twins.run(), 'Workbench: tap to help the twins');
  // spare gears from the windmill
  const gears = G(); [[-.35,2.0,.42,0xd9a441],[.3,1.75,.3,0xc98f58],[.05,2.35,.22,0x8a8f96]].forEach(([x, y, r, c]) => { gears.add(mesh(new THREE.CylinderGeometry(r,r,.07,16), mat(c, { metalness:.4 }), x, y, 0).rotateX(Math.PI/2)); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; gears.add(mesh(new THREE.BoxGeometry(.1,.1,.07), mat(c, { metalness:.4 }), x + Math.cos(a) * r, y + Math.sin(a) * r, 0)); } });
  thing(g, gears, -2.7, -3.15, 1.4, 3, .3, () => toy('gears'), 'Gears: tap to turn');
  // shovels
  const rack = G(mesh(new THREE.BoxGeometry(1.3,.08,.08), dark, 0, 1.9, 0)); [-.45,0,.45].forEach((x, i) => { rack.add(mesh(new THREE.CylinderGeometry(.03,.03,1.3,6), wood, x, 1.25, .06)); rack.add(mesh(new THREE.BoxGeometry(.24,.3,.04), iron, x, .5, .06)); if (i === 2) rack.add(mesh(new THREE.BoxGeometry(.26,.03,.05), mat(0xd6332e), x, 1.0, .08)); });
  thing(g, rack, .9, -3.12, 1.4, 2.2, .4, () => toy('shovels'), 'Shovels: tap to dig down');
  // the worm jars
  const jars = G(mesh(new THREE.BoxGeometry(1.2,.06,.35), wood, 0, 1.25, 0)); [-.38,0,.38].forEach(x => { jars.add(mesh(new THREE.CylinderGeometry(.15,.15,.34,12), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.5 }), x, 1.46, 0)); jars.add(mesh(new THREE.CylinderGeometry(.14,.14,.2,12), mat(0x5f4630), x, 1.39, 0)); jars.add(mesh(new THREE.TorusGeometry(.05,.02,6,10,4), mat(0xe58a8a), x, 1.5, .04)); });
  thing(g, jars, 2.4, -3.05, 1.3, 2, .5, () => toy('worms'), 'Worm jars: tap to try');
  // bunk beds
  const bunk = G(); [.35, 1.25].forEach((y, i) => { bunk.add(mesh(new THREE.BoxGeometry(1.7,.14,.8), wood, 0, y, 0)); bunk.add(mesh(new THREE.BoxGeometry(1.6,.12,.7), mat(i ? 0x8fdc8a : 0xffc857), 0, y + .12, 0)); bunk.add(mesh(new THREE.BoxGeometry(.4,.1,.5), mat(0xfff6e6), -.55, y + .22, 0)); }); [[-.85,-.4],[.85,-.4],[-.85,.4],[.85,.4]].forEach(([x, z]) => bunk.add(mesh(new THREE.BoxGeometry(.1,1.6,.1), dark, x, .8, z)));
  bunk.rotation.y = Math.PI/2; thing(g, bunk, -3.1, .3, 1, 1.7, 1.9, () => toy('bunk'), 'Bunk beds: tap to nap');
  // mushroom lamps
  const lamps = G(); [[0,.5,.16],[.3,.34,.12],[-.28,.28,.1]].forEach(([x, h, r]) => { lamps.add(mesh(new THREE.CylinderGeometry(.04,.05,h,8), mat(0xf1e6cf), x, h/2, 0)); lamps.add(mesh(new THREE.SphereGeometry(r,16,10,0,Math.PI*2,0,Math.PI/2), glow(0x9fe7e0), x, h, 0)); }); const lh = halo(0x9fe7e0, 1.6, .5); lh.position.y = .5; lamps.add(lh);
  thing(g, lamps, 3.0, 1.2, .9, 1, .9, () => toy('mushrooms'), 'Glowing mushrooms: tap to try');
  // today's diggings
  const pile = G(mesh(sph(.22), mat(0xb3aabb), 0, .16, 0), mesh(sph(.17), mat(0x9a93a8), .26, .12, .1), mesh(sph(.15), mat(0xc4bccb), -.2, .1, .16), mesh(sph(.13), mat(0xa39cb0), .05, .34, .05));
  thing(g, pile, 2.9, -1.3, .9, .7, .9, () => { if (!daily('twinsPile')) return toast('You already took a stone today. The twins dig up more by tomorrow.'); if (!gain('stone', 1, player.position.clone().setY(1))) return bagFull(); toast('Fern: "Take 1. We have so many." Moss: "We have ALL of them."'); }, 'Dug-up stones: tap to take one');
  const rug = mesh(new THREE.CylinderGeometry(1.2,1.2,.03,28), mat(0x6fae5a), 0, .02, .5); g.add(rug);
}
{ // Lumen's studio: night colors, paint, and a window on the moon
  const g = makeRoom('lumen', 5, { name:"Lumen's studio", floor:0x4a4470, line:0x3d3860, wall:0x2d3a6b, wall2:0x283360, trim:0xc9b6ff, mat:0x9fe7e0, winX:-1.7, out:() => new THREE.Vector3(NIGHT_POS.x - 1.8, NIGHT_POS.y, NIGHT_POS.z - 2.9) });
  const wood = mat(0x7a5a8a), dark = mat(0x4a3a5e), cream = mat(0xfff6e6);
  // three lanterns: red, green, blue
  const lant = G(mesh(new THREE.BoxGeometry(1.5,.08,.6), wood, 0, .8, 0)); [[-.6,-.25],[.6,-.25],[-.6,.25],[.6,.25]].forEach(([x, z]) => lant.add(mesh(new THREE.BoxGeometry(.07,.8,.07), dark, x, .4, z))); [[-.45,0xff5a5a],[0,0x5fe07a],[.45,0x5a8cff]].forEach(([x, c]) => { lant.add(mesh(new THREE.CylinderGeometry(.11,.11,.26,10), glow(c), x, .98, 0)); lant.add(mesh(new THREE.ConeGeometry(.14,.1,10), dark, x, 1.16, 0)); const h = halo(c, .7, .45); h.position.set(x, .98, 0); lant.add(h); });
  thing(g, lant, .4, -2.7, 1.6, 1.4, .8, () => HELP.lumen.run(), '3 lanterns: tap to help Lumen mix light');
  // her moon paintings
  const moons = G(); [-.75,0,.75].forEach((x, i) => { moons.add(mesh(new THREE.BoxGeometry(.6,.6,.05), mat(0xc9b6ff), x, 2.05, 0)); moons.add(mesh(new THREE.BoxGeometry(.5,.5,.02), mat(0x16203f), x, 2.05, .03)); moons.add(mesh(new THREE.CircleGeometry(.16, 20, 0, [Math.PI, Math.PI * 2, Math.PI][i]), glow(0xfdf6dc), x, 2.05, .045).rotateZ([-Math.PI/2, 0, Math.PI/2][i])); });
  thing(g, moons, 2.3, -3.16, 2.2, 3, .3, () => toy('moons'), 'Moon paintings: tap to turn the nights');
  // a telescope at the window
  const scope = G(mesh(new THREE.CylinderGeometry(.03,.03,1.1,6), dark, -.2, .55, .12).rotateZ(.25), mesh(new THREE.CylinderGeometry(.03,.03,1.1,6), dark, .2, .55, .12).rotateZ(-.25), mesh(new THREE.CylinderGeometry(.03,.03,1.1,6), dark, 0, .55, -.18).rotateX(.3)); const tube = mesh(new THREE.CylinderGeometry(.09,.06,1,12), mat(0xd9a441, { metalness:.5 }), 0, 1.3, -.1); tube.rotation.x = -1.0; scope.add(tube);
  thing(g, scope, -1.7, -2.5, .8, 1.9, .9, () => toy('telescope'), 'Telescope: tap to look');
  // the easel
  const eas = G(mesh(new THREE.BoxGeometry(1.1,1.3,.06), cream, 0, 1.45, 0), mesh(new THREE.CircleGeometry(.3, 24), glow(0xfdf6dc), .1, 1.6, .04), mesh(new THREE.BoxGeometry(1.0,.3,.02), mat(0x16203f), 0, .98, .035)); [-.45,.45].forEach(x => eas.add(mesh(new THREE.BoxGeometry(.06,2.1,.06), wood, x, 1.05, -.06))); eas.add(mesh(new THREE.BoxGeometry(.06,1.9,.06), wood, 0, .95, -.45).rotateX(.35));
  eas.rotation.y = -.55; thing(g, eas, 2.7, .2, 1.3, 2.2, 1, () => { const L = NEIGHBORS.lumen.heartLines; openDialog('Lumen', L[Math.floor(Math.random() * L.length)], [], S.hearts.lumen); }, 'Easel: tap to hear Lumen');
  // paint pots
  const pots = G(mesh(new THREE.BoxGeometry(1.3,.06,.35), wood, 0, 1.1, 0)); [0x2b4fd6,0xf6c531,0xd6332e,0xfff6e6].forEach((c, i) => { pots.add(mesh(new THREE.CylinderGeometry(.11,.09,.2,10), mat(0xdfe6ea), -.45 + i*.3, 1.23, 0)); pots.add(mesh(new THREE.CylinderGeometry(.09,.09,.02,10), mat(c), -.45 + i*.3, 1.33, 0)); }); [-.55,.55].forEach(x => pots.add(mesh(new THREE.BoxGeometry(.06,1.1,.3), dark, x, .55, 0)));
  pots.rotation.y = Math.PI/2; thing(g, pots, -3.3, -.6, .6, 1.5, 1.4, () => toy('paint'), 'Paint pots: tap to make paint');
  // a jar of moonflower seeds
  const jar = G(mesh(new THREE.CylinderGeometry(.2,.2,.4,14), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.45 }), 0, .7, 0), mesh(new THREE.CylinderGeometry(.21,.21,.05,14), dark, 0, .93, 0), mesh(sph(.1), glow(0xfdfcf0), 0, .62, 0), mesh(new THREE.CylinderGeometry(.26,.3,.5,10), wood, 0, .25, 0)); const jh = halo(0xfdfcf0, .9, .4); jh.position.y = .65; jar.add(jh);
  thing(g, jar, -2.9, 1.8, .8, 1.1, .8, () => { if (!daily('lumenJar')) return toast('You already took a seed today. Lumen saves more by tomorrow night.'); S.seeds.starbloom = (S.seeds.starbloom || 0) + 1; sfx('plant'); floatText(`+1 ${icon('starbloom')} moonflower seed`, player.position.clone()); save(); drawHud(); toast('Lumen: "Take a moonflower seed. They open at night. I like things that wait for the dark."'); }, 'Seed jar: tap for a moonflower seed');
  const rug = mesh(new THREE.CylinderGeometry(1.25,1.25,.03,28), mat(0x8b7fd6), 0, .02, .5); g.add(rug); g.add(mesh(new THREE.CylinderGeometry(.5,.5,.035,24), mat(0xfdf6dc), 0, .02, .5));
}
// --- the Old Heart buildings, inside ---
const ohOut = id => () => { const b = BUILDINGS.find(x => x.id === id); return new THREE.Vector3(OH.x + b.pos[0], OH.y, OH.z + b.pos[1] + 2.4); };
const hearts = id => () => { const L = NEIGHBORS[id].heartLines; openDialog(NEIGHBORS[id].name, L[Math.floor(Math.random() * L.length)], [], S.hearts[id]); };
{ // Mabel's Bakery: warm, floury, and run by an oven named Gerald
  const g = makeRoom('bakery', 6, { name:"Mabel's Bakery", floor:0xe9c9a0, line:0xd4b085, wall:0xffe3c4, wall2:0xfbd6b0, trim:0xb5622f, mat:0xffc857, winX:2.2, out:ohOut('bakery') });
  const wood = mat(0xc98f58), dark = mat(0x9b6b4a), brick = mat(0xb5622f);
  const oven = G(mesh(new THREE.BoxGeometry(1.8,1.7,1), brick, 0, .85, 0), mesh(new THREE.CylinderGeometry(.5,.5,.12,18,1,false,0,Math.PI), mat(0x2a1c12), 0, .75, .5).rotateX(Math.PI/2).rotateZ(Math.PI/2), mesh(new THREE.BoxGeometry(.9,.5,.06), mat(0x2a1c12), 0, .5, .5), mesh(new THREE.BoxGeometry(.5,.25,.02), glow(0xff9a3c), 0, .45, .54), mesh(new THREE.BoxGeometry(.4,1.2,.4), brick, .5, 2.3, -.2)); const oh = halo(0xff9a3c, 1.2, .4); oh.position.set(0, .6, .7); oven.add(oh);
  thing(g, oven, -.8, -2.7, 2, 2, 1.2, () => useBakery(), 'Gerald the oven: tap to cook');
  const bowl = G(mesh(new THREE.BoxGeometry(1.5,.08,.8), wood, 0, .85, 0), mesh(new THREE.SphereGeometry(.3,16,10,0,Math.PI*2,Math.PI/2,Math.PI/2), mat(0xdfe6ea), -.3, 1.19, 0), mesh(sph(.24), mat(0xf3e2bd), -.3, 1.08, 0), mesh(new THREE.CylinderGeometry(.04,.04,.6,8), wood, .35, .92, .1).rotateZ(Math.PI/2)); [[-.65,-.3],[.65,-.3],[-.65,.3],[.65,.3]].forEach(([x, z]) => bowl.add(mesh(new THREE.BoxGeometry(.08,.85,.08), dark, x, .42, z)));
  thing(g, bowl, 1.4, -.9, 1.6, 1.5, .9, () => HELP.mabel.run(), 'Dough bowl: tap to help Mabel');
  const jar = G(mesh(new THREE.BoxGeometry(.9,.06,.3), wood, 0, 1.3, 0), mesh(new THREE.CylinderGeometry(.16,.16,.36,12), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.5 }), 0, 1.52, 0), mesh(new THREE.CylinderGeometry(.15,.15,.22,12), mat(0xf3e2bd), 0, 1.45, 0), mesh(new THREE.BoxGeometry(.3,.02,.3), mat(0xff8fa3), 0, 1.71, 0));
  thing(g, jar, 2.3, -3.0, 1, 2.1, .5, () => toy('starter'), 'Starter jar: tap to feed it');
  const tray = G(mesh(new THREE.BoxGeometry(1.2,.06,.6), dark, 0, .9, 0)); for (let i = 0; i < 13; i++) tray.add(mesh(sph(.085), mat(0xd9a55a), -.48 + (i % 7) * .16, .97, i < 7 ? -.12 : .12)); [[-.5,-.22],[.5,-.22],[-.5,.22],[.5,.22]].forEach(([x, z]) => tray.add(mesh(new THREE.BoxGeometry(.06,.9,.06), dark, x, .45, z)));
  thing(g, tray, -3.0, -.6, .8, 1.3, 1.3, () => toy('dozen'), "Tray of rolls: tap to look"); tray.rotation.y = Math.PI/2;
  const sacks = G(); [[0,0],[.5,.1],[.22,-.05]].forEach(([x, z], i) => { const sk = mesh(sph(.3), mat(0xf1e6cf), x, i === 2 ? .7 : .26, z); sk.scale.set(1, .85, .8); sacks.add(sk); });
  thing(g, sacks, 3.0, 1.4, 1.2, 1.1, .9, hearts('mabel'), 'Flour sacks: tap to hear Mabel');
  g.add(mesh(new THREE.CylinderGeometry(1.2,1.2,.03,28), mat(0xff8fa3), 0, .02, .6));
}
{ // The Library: Professor Hoot's shelves
  const g = makeRoom('library', 7, { name:'The Library', floor:0xb98a5e, line:0x9b7248, wall:0xe6dcc6, wall2:0xdccfb4, trim:0x6b4a30, mat:0xd6332e, winX:0, out:ohOut('library') });
  const wood = mat(0x7a5236), dark = mat(0x5f3f28), cols = [0xd6332e,0x3f86c9,0x4cb86a,0xf6c531,0x8e44ad,0xff8fa3,0x7ec8e3];
  const shelf = side => { const sh = G(mesh(new THREE.BoxGeometry(2,2.4,.4), wood, 0, 1.2, 0)); [.35, 1.0, 1.65].forEach((y, r) => { for (let i = 0; i < 9; i++) sh.add(mesh(new THREE.BoxGeometry(.16,.5,.26), mat(cols[(i + r * 2 + side) % cols.length]), -.72 + i * .18, y + .28, .1)); sh.add(mesh(new THREE.BoxGeometry(1.9,.05,.36), dark, 0, y, .03)); }); return sh; };
  thing(g, shelf(0), -2.4, -3.0, 2.1, 2.5, .6, () => useLibrary(), 'Bookshelf: tap to read');
  thing(g, shelf(3), 2.4, -3.0, 2.1, 2.5, .6, () => useLibrary(), 'Bookshelf: tap to read');
  const cart = G(mesh(new THREE.BoxGeometry(1,.06,.5), wood, 0, .7, 0), mesh(new THREE.BoxGeometry(1,.06,.5), wood, 0, .3, 0)); [0,1,2,3,4].forEach(i => cart.add(mesh(new THREE.BoxGeometry(.14,.4,.3), mat(cols[i]), -.32 + i * .16 + (i === 3 ? .02 : 0), .93, 0))); [[-.45,-.2],[.45,-.2],[-.45,.2],[.45,.2]].forEach(([x, z]) => { cart.add(mesh(new THREE.BoxGeometry(.05,.75,.05), dark, x, .38, z)); cart.add(mesh(sph(.06), mat(0x3b2f4a), x, .06, z)); });
  thing(g, cart, 1.5, -.6, 1.1, 1.3, .7, () => HELP.hoot.run(), 'Book cart: tap to help Hoot');
  const cat = G(mesh(new THREE.BoxGeometry(1.1,1.1,.5), wood, 0, .55, 0)); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { cat.add(mesh(new THREE.BoxGeometry(.22,.26,.04), mat(0xc98f58), -.39 + c * .26, .22 + r * .33, .26)); cat.add(mesh(sph(.025), mat(0xffc857), -.39 + c * .26, .22 + r * .33, .29)); }
  thing(g, cat, -3.1, -.4, .7, 1.2, 1.2, () => toy('cards'), 'Card drawers: tap to find a book'); cat.rotation.y = Math.PI/2;
  const chair = G(mesh(new THREE.BoxGeometry(.8,.4,.8), mat(0x4cb86a), 0, .35, 0), mesh(new THREE.BoxGeometry(.8,.8,.16), mat(0x4cb86a), 0, .75, -.34), mesh(new THREE.CylinderGeometry(.03,.05,1.4,8), dark, .75, .7, -.2), mesh(new THREE.ConeGeometry(.26,.28,12,1,true), glow(0xfff3a0), .75, 1.5, -.2));
  chair.rotation.y = .6; thing(g, chair, -2.6, 1.5, 1.6, 1.6, 1.1, hearts('hoot'), 'Reading chair: tap to hear Hoot');
  const sign = G(mesh(new THREE.BoxGeometry(.9,.4,.04), mat(0xfff6e6), 0, 1.9, 0), mesh(new THREE.BoxGeometry(.6,.06,.02), mat(0x3b2f4a), 0, 1.95, .03), mesh(new THREE.BoxGeometry(.4,.06,.02), mat(0x3b2f4a), 0, 1.83, .03));
  thing(g, sign, 0, -3.17, 1, 2.6, .2, () => toy('quiet'), 'Sign: tap to read the old page');
  g.add(mesh(new THREE.BoxGeometry(2.2,.03,1.4), mat(0x8e3a3a), 0, .02, .7));
}
{ // Allegra's Music Hall
  const g = makeRoom('musichall', 8, { name:"Allegra's Music Hall", floor:0xc98f58, line:0xb07a45, wall:0xffd6de, wall2:0xfbc4cf, trim:0xd6332e, mat:0x7ec8e3, winX:-2.4, out:ohOut('musichall') });
  const wood = mat(0x7a5236), dark = mat(0x3b2f4a), xc = [0xff8fa3,0xffb36b,0xffc857,0xeeeeee,0x8fdc8a,0x7ec8e3,0xeeeeee,0xff8fa3];
  const stage = mesh(new THREE.BoxGeometry(3.6,.25,1.6), mat(0x9b6b4a), .6, .125, -2.4); g.add(stage); walkables.push(stage);
  const xy = G(); [-.5,.5].forEach(z => xy.add(mesh(new THREE.BoxGeometry(1.7,.06,.06), wood, 0, .95, z * .5))); xc.forEach((c, i) => xy.add(mesh(new THREE.BoxGeometry(.17,.05,.75 - i * .05), mat(c), -.7 + i * .2, 1.0, 0))); [[-.8,-.25],[.8,-.25],[-.8,.25],[.8,.25]].forEach(([x, z]) => xy.add(mesh(new THREE.BoxGeometry(.06,.95,.06), wood, x, .47, z)));
  thing(g, xy, .2, -1.2, 1.9, 1.3, .9, () => useMusicHall(), 'Xylophone: tap to play');
  const gl = G(mesh(new THREE.BoxGeometry(1.2,.06,.4), wood, 0, .85, 0)); [.9,.65,.4,.2].forEach((f, i) => { gl.add(mesh(new THREE.CylinderGeometry(.09,.07,.3,10), new THREE.MeshStandardMaterial({ color:0xeef7fb, transparent:true, opacity:.45 }), -.42 + i * .28, 1.03, 0)); gl.add(mesh(new THREE.CylinderGeometry(.075,.065,.28 * f,10), mat(0x7ec8e3), -.42 + i * .28, .89 + .14 * f, 0)); }); [-.5,.5].forEach(x => gl.add(mesh(new THREE.BoxGeometry(.06,.85,.3), wood, x, .42, 0)));
  thing(g, gl, 2.9, .3, .6, 1.4, 1.3, () => HELP.allegra.run(), 'Water glasses: tap to help Allegra'); gl.rotation.y = Math.PI/2;
  const piano = G(mesh(new THREE.BoxGeometry(1.5,1.1,.5), dark, 0, .55, 0), mesh(new THREE.BoxGeometry(1.4,.06,.3), mat(0xfff6e6), 0, .72, .38), mesh(new THREE.BoxGeometry(1.5,.08,.34), dark, 0, .66, .38)); for (let i = 0; i < 9; i++) if (i % 7 !== 2 && i % 7 !== 6) piano.add(mesh(new THREE.BoxGeometry(.07,.04,.17), dark, -.56 + i * .14, .77, .32));
  thing(g, piano, 1.4, -2.75, 1.6, 1.5, .9, () => toy('piano'), 'Piano: tap to play');
  const met = G(mesh(new THREE.BoxGeometry(.5,.9,.4), wood, 0, .45, 0), mesh(new THREE.ConeGeometry(.2,.5,4), mat(0x9b6b4a), 0, 1.15, 0).rotateY(Math.PI/4), mesh(new THREE.BoxGeometry(.02,.42,.02), mat(0xd9a441, { metalness:.5 }), .05, 1.12, .15).rotateZ(-.25), mesh(new THREE.BoxGeometry(.06,.06,.03), mat(0xd9a441, { metalness:.5 }), .08, 1.2, .15));
  thing(g, met, -1.6, -2.6, .7, 1.5, .6, () => toy('metronome'), 'Metronome: tap to try');
  const fork = G(mesh(new THREE.BoxGeometry(.5,.9,.3), wood, 0, .45, 0), mesh(new THREE.CylinderGeometry(.02,.02,.2,6), mat(0xcfd6dc, { metalness:.6 }), 0, 1, 0), mesh(new THREE.BoxGeometry(.02,.32,.02), mat(0xcfd6dc, { metalness:.6 }), -.05, 1.26, 0), mesh(new THREE.BoxGeometry(.02,.32,.02), mat(0xcfd6dc, { metalness:.6 }), .05, 1.26, 0), mesh(new THREE.BoxGeometry(.12,.02,.02), mat(0xcfd6dc, { metalness:.6 }), 0, 1.1, 0));
  thing(g, fork, -3.1, -.4, .6, 1.5, .7, () => toy('fork'), 'Tuning fork: tap to try');
  const stool = G(mesh(new THREE.CylinderGeometry(.3,.3,.1,14), mat(0xd6332e), 0, .55, 0), mesh(new THREE.CylinderGeometry(.05,.05,.5,8), dark, 0, .25, 0));
  thing(g, stool, -2.6, 1.6, .8, .8, .8, hearts('allegra'), "Allegra's stool: tap to hear her");
}
{ // Sage's Temple Garden: an indoor garden with a pond, raked sand, and a stone to read each day
  const g = makeRoom('temple', 9, { name:"Sage's Temple Garden", floor:0x8fbf7a, line:0x86b572, wall:0xd9d2c0, wall2:0xcfc7b3, trim:0x8a8f96, mat:0xc9b6ff, winX:2.3, out:ohOut('temple') });
  const stone = mat(0x8a8f96), wood = mat(0x9b6b4a);
  const say = G(mesh(new THREE.BoxGeometry(1,1.5,.3), stone, 0, .75, 0), mesh(new THREE.BoxGeometry(.7,.06,.02), mat(0x3b2f4a), 0, 1.1, .16), mesh(new THREE.BoxGeometry(.6,.06,.02), mat(0x3b2f4a), 0, .92, .16), mesh(new THREE.BoxGeometry(.66,.06,.02), mat(0x3b2f4a), 0, .74, .16), mesh(new THREE.BoxGeometry(1.2,.12,.5), stone, 0, .06, 0));
  thing(g, say, -.6, -2.8, 1.2, 1.7, .6, () => useTemple(), "Saying stone: tap for today's saying");
  const pond = G(mesh(new THREE.CylinderGeometry(1.1,1.1,.08,28), stone, 0, .04, 0), mesh(new THREE.CylinderGeometry(.95,.95,.09,28), mat(0x5fb4dc), 0, .045, 0)); [[-.3,.2,0xff7a45],[.35,-.25,0xffffff],[.1,.45,0xffc857]].forEach(([x, z, c]) => { const k = mesh(sph(.1), mat(c), x, .1, z); k.scale.set(1.7, .4, .8); pond.add(k); }); pond.add(mesh(new THREE.CylinderGeometry(.16,.16,.02,12), mat(0x4f9a5c), -.5, .1, -.35));
  thing(g, pond, 2.4, .6, 2.2, .5, 2.2, () => toy('koi'), 'Koi pond: tap to feed the koi');
  const sand = G(mesh(new THREE.BoxGeometry(2,.06,1.4), mat(0xeadfc8), 0, .03, 0)); for (let i = 0; i < 6; i++) sand.add(mesh(new THREE.BoxGeometry(1.9,.015,.03), mat(0xd6c9ab), 0, .065, -.55 + i * .22)); [[-.5,-.2,.16],[.4,.2,.12],[.1,-.35,.09]].forEach(([x, z, r]) => sand.add(mesh(sph(r), stone, x, r * .7, z)));
  thing(g, sand, -2.5, .7, 2.1, .5, 1.5, () => toy('sand'), 'Sand garden: tap to rake');
  const st3 = G(mesh(sph(.34), stone, -.4, .2, 0), mesh(sph(.24), mat(0xa3a8ae), .2, .15, .1), mesh(sph(.15), mat(0xbcc1c6), .55, .1, -.1)); st3.children.forEach(c => c.scale.y = .6);
  thing(g, st3, 1.9, -2.3, 1.5, .6, 1, () => HELP.sage.run(), '3 stones: tap to help Sage');
  const bench = G(mesh(new THREE.BoxGeometry(1.5,.1,.45), wood, 0, .45, 0)); [-.6,.6].forEach(x => bench.add(mesh(new THREE.BoxGeometry(.1,.45,.4), stone, x, .22, 0)));
  thing(g, bench, -2.6, -2.2, 1.6, .8, .7, hearts('sage'), 'Bench: tap to sit with Sage');
  const tree = G(mesh(new THREE.CylinderGeometry(.07,.1,1.1,8), wood, 0, .55, 0), mesh(sph(.42), mat(0xff8fa3), 0, 1.3, 0), mesh(sph(.3), mat(0xffb3c2), .3, 1.15, .1), mesh(sph(.28), mat(0xff8fa3), -.3, 1.1, -.1), mesh(new THREE.CylinderGeometry(.3,.24,.3,12), mat(0xb5622f), 0, .15, 0));
  thing(g, tree, 3.1, -2.6, .9, 1.8, .9, () => toy('rings'), "Sage's tree: tap to read its rings");
}
{ // The Observatory: a telescope, a model of the planets, and a rock older than the Earth
  const g = makeRoom('observatory', 10, { name:'The Observatory', floor:0x3d4470, line:0x333a62, wall:0x232a52, wall2:0x1f2548, trim:0xd9a441, mat:0x7ec8e3, winX:-2.2, out:ohOut('observatory') });
  const brass = mat(0xd9a441, { metalness:.5 }), dark = mat(0x2a2338), wood = mat(0x7a5236);
  const scope = G(mesh(new THREE.CylinderGeometry(.5,.6,.5,16), dark, 0, .25, 0), mesh(new THREE.CylinderGeometry(.1,.1,1,10), brass, 0, 1, 0)); const tube = mesh(new THREE.CylinderGeometry(.22,.16,2.2,16), brass, 0, 1.9, -.3); tube.rotation.x = -.8; scope.add(tube); scope.add(mesh(new THREE.CylinderGeometry(.24,.24,.06,16), mat(0xbfe3ff), 0, 2.67, -1.09).rotateX(-.8));
  thing(g, scope, 0, -1.6, 1.4, 2.6, 1.8, () => useObservatory(), 'Telescope: tap to chart the stars');
  const chart = G(mesh(new THREE.BoxGeometry(1.7,1.2,.05), mat(0x16203f), 0, 1.9, 0)); [[-.6,2.2],[-.3,1.9],[0,2.1],[.3,1.75],[.6,2.0],[.1,1.55],[-.5,1.6]].forEach(([x, y]) => chart.add(mesh(sph(.035), glow(0xfff3a0), x, y, .04)));
  thing(g, chart, 2.2, -3.16, 1.8, 3, .3, () => openStarList(), 'Star chart: tap to see what you have charted');
  const orr = G(mesh(new THREE.CylinderGeometry(.3,.4,.8,12), wood, 0, .4, 0), mesh(sph(.16), glow(0xffc857), 0, 1.15, 0)); [[.34,.05,0x9a93a8],[.5,.07,0xe2a15a],[.68,.075,0x5fb4dc],[.86,.06,0xd6553a]].forEach(([r, sz, c], i) => { const a = i * 1.7; orr.add(mesh(new THREE.TorusGeometry(r,.008,4,36), brass, 0, 1.15, 0).rotateX(Math.PI/2)); orr.add(mesh(sph(sz), mat(c), Math.cos(a) * r, 1.15, Math.sin(a) * r)); }); g.userData.orr = orr;
  thing(g, orr, -2.6, .3, 1.9, 1.5, 1.9, () => toy('orrery'), 'Planet model: tap to turn');
  const rock = G(mesh(new THREE.CylinderGeometry(.22,.3,.9,10), wood, 0, .45, 0), mesh(new THREE.DodecahedronGeometry(.2), mat(0x3b3438, { metalness:.3 }), 0, 1.08, 0));
  thing(g, rock, 2.7, .4, .8, 1.4, .8, () => toy('meteorite'), 'Meteorite: tap to test');
  const desk = G(mesh(new THREE.BoxGeometry(1.2,.08,.6), wood, 0, .8, 0), mesh(new THREE.BoxGeometry(.5,.04,.36), mat(0xfff6e6), -.1, .86, 0), mesh(new THREE.BoxGeometry(.02,.045,.36), mat(0xd6332e), -.1, .862, 0), mesh(new THREE.CylinderGeometry(.02,.02,.3,6), mat(0xffc857), .35, .87, .1).rotateZ(1.3)); [[-.5,-.22],[.5,-.22],[-.5,.22],[.5,.22]].forEach(([x, z]) => desk.add(mesh(new THREE.BoxGeometry(.07,.8,.07), dark, x, .4, z)));
  thing(g, desk, -2.4, -2.6, 1.3, 1.2, .8, () => toy('stars'), 'Notebook: tap to look');
  g.add(mesh(new THREE.CylinderGeometry(1.3,1.3,.03,28), mat(0x232a52), 0, .02, .7)); g.add(mesh(new THREE.CylinderGeometry(.5,.5,.035,5), glow(0xfff3a0), 0, .02, .7));
}
// --- the Museum: a place you fill. Give it one of each fish, bug, and crop, and it goes on show ---
const MUSEUM = { fish:{ name:'The Fish Tank', ids:FISH.map(f => f.id) }, bug:{ name:'The Bug Wall', ids:INSECTS.map(b => b.id) }, crop:{ name:'The Harvest Stand', ids:[...Object.keys(CROPS), 'apple', 'peach'] } };
var museumBits = {};
function drawMuseum() { S.museum = S.museum || {}; Object.entries(museumBits).forEach(([k, o]) => o.visible = k.startsWith('relic:') ? S.aha.includes(k.slice(6)) : !!S.museum[k]); }
function museumFact(k) { const b = INSECTS.find(x => x.id === k); return b ? `<p>${b.fact}</p>` : FINDS[k] ? `<p>${FINDS[k].fact}</p>${FINDS[k].see ? `<h4>See it for yourself</h4><p>${FINDS[k].see}</p>` : ''}` : ''; }
function museumWing(kind, msg) { S.museum = S.museum || {}; const W = MUSEUM[kind], n = W.ids.filter(k => S.museum[k]).length;
  const known = k => S.found.includes(k) || (S.bugs || []).includes(k), hidden = W.ids.filter(k => !S.museum[k] && !known(k)).length;
  showCard(`<div class="kicker">THE MUSEUM</div><h2>${W.name}: ${n} of ${W.ids.length}</h2><p>${msg || `Bring 1 of each here in your bag, then tap it below. You get 25 coins and it goes on show for good.${n ? ' Tap one on show to read its sign.' : ''}`}</p>
    <div class="jlist">${W.ids.filter(k => S.museum[k] || known(k)).map(k => S.museum[k] ? `<button data-mx="${k}">${icon(k, kind)} ${ITEMS[k].name} <span class="sub">On show</span></button>`
      : (S.bag[k] || 0) > 0 ? `<button data-mg="${k}">${icon(k, kind)} ${ITEMS[k].name} <span class="sub">Tap to give 1 of your ${S.bag[k]}</span></button>`
      : `<button class="locked">${icon(k, kind)} ${ITEMS[k].name}</button>`).join('')}</div>${hidden ? `<p class="sub" style="margin-top:8px">${hidden} more you have not found yet.</p>` : ''}`, 'Close');
  document.querySelectorAll('[data-mx]').forEach(b => b.onclick = () => { const k = b.dataset.mx; showCard(`<div class="kicker">${W.name.toUpperCase()}</div><h2>${icon(k, kind)} ${ITEMS[k].name}</h2><h4>In real life</h4>${museumFact(k)}<p class="sub" style="margin-top:10px">Given by you on day ${S.museum[k]}.</p>`, 'Back', () => museumWing(kind)); });
  document.querySelectorAll('[data-mg]').forEach(b => b.onclick = () => { const k = b.dataset.mg; bagAdd(k, -1); S.museum[k] = S.day; S.coins += 25; did('museum'); sfx('coin'); drawMuseum(); drawHud();
    const done = W.ids.every(x => S.museum[x]), all = done && Object.values(MUSEUM).every(w => w.ids.every(x => S.museum[x]));
    if (done) { S.coins += 300; [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 130)); }
    save(); drawHud();
    if (done) return showCard(`<div class="kicker">THE MUSEUM</div><h2>${W.name} is full!</h2><p>You put every one of them there. <b>+300 coins.</b></p>${all ? '<p>That was the last empty spot in the whole museum. Visitors will be reading your signs for years.</p>' : ''}`, 'Back', () => museumWing(kind));
    museumWing(kind, `<b>The ${ITEMS[k].name} is on show now. +25 coins.</b> Tap it to read its sign.`); }); }
function museumRelics() { const got = RELICS.filter(r => S.aha.includes(r.id));
  showCard(`<div class="kicker">THE MUSEUM</div><h2>The Relic Case: ${got.length} of ${RELICS.length}</h2><p>The old things you dig up from gold sparkles are shown here. You keep the memory. The museum keeps the relic safe.</p>
    ${got.length ? '<p>Tap one to read its sign.</p>' : ''}<div class="jlist">${got.map(r => `<button data-mr="${r.id}">${AHA[r.id].title}</button>`).join('')}</div>${got.length < RELICS.length ? `<p class="sub" style="margin-top:8px">${RELICS.length - got.length} still buried. Dig up gold sparkles on your island.</p>` : ''}`, 'Close');
  document.querySelectorAll('[data-mr]').forEach(b => b.onclick = () => showCard(ahaHtml(b.dataset.mr), 'Back', museumRelics)); }
function museumDesk() { S.museum = S.museum || {}; const total = Object.values(MUSEUM).reduce((a, w) => a + w.ids.length, 0), n = Object.keys(S.museum).length;
  showCard(`<div class="kicker">THE MUSEUM</div><h2>${n} of ${total} on show</h2><p>Tap a row to give things. Everything on show is something you found.</p>
    <div class="jlist">${Object.entries(MUSEUM).map(([id, w]) => `<button data-mw="${id}">${w.name} <span class="sub">${w.ids.filter(k => S.museum[k]).length} of ${w.ids.length}</span></button>`).join('')}<button id="mdReal">In real life <span class="sub">The first museum free for everyone</span></button></div>`, 'Close');
  document.querySelectorAll('[data-mw]').forEach(b => b.onclick = () => museumWing(b.dataset.mw));
  $('mdReal').onclick = () => showCard(`<div class="kicker">THE MUSEUM</div><h2>The first museum free for everyone</h2><h4>In real life</h4><p>The British Museum in London opened in 1759. It was the first national museum open to everyone, free. It is still free today.</p>`, 'Back', museumDesk); }
{ const g = makeRoom('museum', 11, { name:'The Museum', floor:0xf1ece2, line:0xddd5c6, wall:0xfff6e6, wall2:0xf3e9d6, trim:0xd9a441, mat:0xd6332e, winX:-2.8, out:() => new THREE.Vector3(ORCH_POS.x - .6, ORCH_POS.y, ORCH_POS.z - 2.2) });
  const stone = mat(0xd9d2c4), wood = mat(0x7a5236), brass = mat(0xd9a441, { metalness:.5 });
  // the fish tank
  const tank = G(mesh(new THREE.BoxGeometry(3.4,.6,.7), stone, 0, .3, 0), mesh(new THREE.BoxGeometry(3.3,1.5,.6), new THREE.MeshStandardMaterial({ color:0x7ec8e3, transparent:true, opacity:.35 }), 0, 1.35, 0), mesh(new THREE.BoxGeometry(3.4,.08,.7), brass, 0, 2.14, 0), mesh(new THREE.BoxGeometry(3.3,.06,.6), mat(0xe6d9b8), 0, .63, 0));
  FISH.forEach((f, i) => { const m = fishMesh(f, f.ray ? .7 : f.round ? .34 : .28 + (i % 3) * .06); m.position.set(-1.15 + (i % 3) * 1.15 + (Math.floor(i / 3) % 2) * .2, 1.0 + Math.floor(i / 3) * .42, .05); if (i % 2) m.rotation.y = Math.PI; tank.add(m); museumBits[f.id] = m; });
  thing(g, tank, .8, -2.85, 3.5, 2.2, .9, () => museumWing('fish'), 'Fish tank: tap to see or give fish');
  // the bug wall
  const wall = G(mesh(new THREE.BoxGeometry(2.6,1.5,.08), mat(0xf7f1e3), 0, 1.6, 0), mesh(new THREE.BoxGeometry(2.7,.08,.12), wood, 0, 2.38, 0), mesh(new THREE.BoxGeometry(2.7,.08,.12), wood, 0, .82, 0));
  INSECTS.forEach((b, i) => { const x = -1 + (i % 5) * .5, y = 1.95 - Math.floor(i / 5) * .65; wall.add(mesh(new THREE.BoxGeometry(.38,.04,.02), mat(0xddd5c6), x, y - .26, .05)); const m = bugModel(b.id); m.scale.setScalar(2.4); m.rotation.x = Math.PI / 2; m.position.set(x, y, .12); wall.add(m); museumBits[b.id] = m; });
  wall.rotation.y = Math.PI / 2; thing(g, wall, -3.6, -.4, .5, 2.6, 2.7, () => museumWing('bug'), 'Bug wall: tap to see or give bugs');
  // the harvest stand
  const stand = G(mesh(new THREE.BoxGeometry(1.9,.5,.9), wood, 0, .25, 0), mesh(new THREE.BoxGeometry(1.9,.4,.5), wood, 0, .7, -.2), mesh(new THREE.BoxGeometry(2,.05,1), mat(0x4cb86a), 0, .52, 0));
  MUSEUM.crop.ids.forEach((k, i) => { const top = i >= 5, m = mesh(sph(k === 'moonpumpkin' ? .17 : .12), mat(CROPS[k] ? CROPS[k].color : k === 'apple' ? 0xe5484d : 0xffb36b), -.72 + (top ? (i - 5) * .45 + .1 : i * .36), top ? 1.02 : .66, top ? -.2 : .22); stand.add(m); museumBits[k] = m; });
  stand.rotation.y = -Math.PI / 2; thing(g, stand, 3.1, .3, 1, 1.3, 2, () => museumWing('crop'), 'Harvest stand: tap to see or give crops');
  // the relic case
  const rcase = G(mesh(new THREE.BoxGeometry(1.3,.8,.7), stone, 0, .4, 0), mesh(new THREE.BoxGeometry(1.2,.5,.6), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.3 }), 0, 1.06, 0), mesh(new THREE.BoxGeometry(1.2,.03,.6), mat(0x8e3a3a), 0, .82, 0));
  [['bone', mesh(new THREE.CylinderGeometry(.03,.045,.34,8), mat(0xad8b68), -.38, .9, 0).rotateZ(Math.PI/2)], ['temple', mesh(new THREE.BoxGeometry(.2,.26,.12), mat(0xd9cfb9), 0, .97, 0)], ['tablet', mesh(new THREE.BoxGeometry(.26,.04,.2), mat(0xb9a58c), .38, .87, 0)]].forEach(([id, m]) => { rcase.add(m); museumBits['relic:' + id] = m; });
  thing(g, rcase, -1.9, 1.5, 1.4, 1.4, .9, () => museumRelics(), 'Relic case: tap to look');
  // the front desk
  const desk = G(mesh(new THREE.BoxGeometry(1.3,.9,.6), wood, 0, .45, 0), mesh(new THREE.BoxGeometry(1.4,.06,.7), stone, 0, .93, 0), mesh(new THREE.SphereGeometry(.1,14,8,0,Math.PI*2,0,Math.PI/2), brass, .35, .96, 0), mesh(sph(.025), brass, .35, 1.07, 0), mesh(new THREE.BoxGeometry(.4,.03,.3), mat(0xfff6e6), -.25, .97, 0));
  thing(g, desk, 1.6, 1.4, 1.5, 1.3, .8, () => { chime(1568); museumDesk(); }, 'Front desk: tap to see how full the museum is');
  g.add(mesh(new THREE.BoxGeometry(1.6,.03,3), mat(0x8e3a3a), 0, .02, 1.2));
}
// A designed room: every spot is meant for a certain kind of furniture.
const FURN_CAT = { cake:'decor', rug:'rug', table:'table', armchair:'seat', rocker:'seat', bookshelf:'tall', lamp:'decor', fern:'decor', globe:'decor', mushroom:'decor', painting:'wall', sign:'wall' };
// --- rooms your home gains as it grows: a loft (cottage) and a study (house) ---
makeRoom('loft', 12, { name:'The loft', back:'hut', floor:0xc99a6b, line:0xb5855a, wall:0xfbe9cf, wall2:0xf3dcc0, trim:0x8a6445, mat:0xc98f58, out:() => new THREE.Vector3(-4, 0, -.25) });
makeRoom('study', 13, { name:'The study', back:'loft', floor:0xb98a63, line:0xa3764f, wall:0xdfe8d6, wall2:0xd2dec6, trim:0x7a5236, mat:0x8fb8a0, winX:-1.4, out:() => new THREE.Vector3(-4, 0, -.25) });
ROOMS.loft.mat.userData.label = 'Ladder: tap to climb down'; ROOMS.study.mat.userData.label = 'Door: tap to go to the loft';
[floor, ROOMS.loft.g.children[0], ROOMS.study.g.children[0]].forEach(f => { f.material.map = tx('planks', 5, 1); f.material.needsUpdate = true; }); // floorboards with grain
const homeLadder = new THREE.Group(), studyDoor = new THREE.Group(), homePlans = new THREE.Group();
// what you can see from the loft window: tonight's stars, or the weather
function loftWindow() { if (VISIT) return toast(`${VISIT.name}'s window.`);
  const m = today().getMonth() + 1, up = CONSTELLATIONS.filter(c => c.months.includes(m)), night = hour() >= 20, done = up.filter(c => S.charted.includes(c.id)).length;
  showCard(`<div class="kicker">THE LOFT WINDOW</div><h2>${night ? 'Stars over your island' : raining ? 'Rain on the roof' : 'A clear sky'}</h2><p>${night ? '' : 'The stars come out after 8 PM. '}In the sky this month: <b>${up.map(c => c.name).join(', ')}</b>.</p>${S.built.includes('observatory') ? `<p>You have charted ${done} of these ${up.length}.${done < up.length ? ' Chart the rest at the Observatory after 8 PM.' : ''}</p>` : ''}`, 'Okay'); }
{ const w = mat(0x9b6b4a, { map:tx('grain', 1, 2) }), dk = mat(0x6b4630, { map:tx('grain', 1, 2) }), lt = mat(0xc98f58, { map:tx('grain', 1, 1) }), brass = fine(0xffc857), L = ROOMS.loft.g, ST = ROOMS.study.g;
  [-.28, .28].forEach(z => homeLadder.add(mesh(new THREE.BoxGeometry(.07,3.3,.07), w, 0, 1.6, z))); for (let i = 0; i < 9; i++) homeLadder.add(mesh(new THREE.BoxGeometry(.05,.05,.56), w, 0, .3 + i*.34, 0));
  homeLadder.rotation.z = -.16; homeLadder.position.set(-3.3, 0, 2.3); const hb = hitBox(.9, 3, 1); hb.position.set(.2, 1.5, 0); homeLadder.add(hb); deco(hb, () => VISIT ? toast(`${VISIT.name}'s loft is up there.`) : enterRoom('loft')).userData.label = 'Ladder: tap to climb to the loft'; room.add(homeLadder);
  studyDoor.add(mesh(new THREE.BoxGeometry(.1,2.2,1.2), dk, 0, 1.1, 0)); studyDoor.add(mesh(new THREE.BoxGeometry(.06,2,1), lt, -.04, 1, 0)); [-.25, 0, .25].forEach(z => studyDoor.add(mesh(new THREE.BoxGeometry(.01,2,.015), fine(0x7a5236), -.075, 1, z))); studyDoor.add(mesh(sph(.05), brass, -.1, 1, .36));
  studyDoor.position.set(3.66, 0, 1.6); const hd = hitBox(.6, 2.1, 1.2); hd.position.set(-.2, 1.05, 0); studyDoor.add(hd); deco(hd, () => enterRoom('study')).userData.label = 'Door: tap to go to the study'; L.add(studyDoor);
  homePlans.add(mesh(new THREE.BoxGeometry(.05,.78,1), w, 0, 0, 0)); homePlans.add(mesh(new THREE.BoxGeometry(.03,.66,.88), mat(0x3f6fb5), -.03, 0, 0)); // a blueprint: white lines on blue paper
  const wl = fine(0xffffff); [[0,-.12,.5,.02],[0,.1,.36,.02],[-.25,-.01,.02,.24],[.25,-.01,.02,.24],[-.14,.2,.02,.22],[.14,.2,.02,.22]].forEach(([z,y,l,h], i) => { const ln = mesh(new THREE.BoxGeometry(.01,h,l), wl, -.05, y, z); if (i > 3) ln.rotation.x = (i === 4 ? 1 : -1) * .9; homePlans.add(ln); });
  homePlans.position.set(3.66, 1.7, -1.1); const hp = hitBox(.4, .9, 1.1); hp.position.x = -.15; homePlans.add(hp); deco(hp, () => housePlans()).userData.label = 'House plans: tap to grow your home'; room.add(homePlans);
  // the main room: a patchwork quilt and a candle by the bed
  [[-.35,.1,0xff8fa3],[.35,.1,0xfff3a0],[0,.6,0xc9b6ff],[-.35,.6,0x8fdc8a],[.35,.6,0xffb36b],[0,.1,0xffffff]].forEach(([x, z, c]) => bed.add(mesh(new THREE.BoxGeometry(.33,.02,.46), fine(c), x, .63, z)));
  // the loft: rafters meeting at the top, thatch showing above them, a string of lights, a window seat and a wardrobe
  { const straw = mat(0xd9b36a, { map:tx('straw', 3, 2) }); [-1, 1].forEach(sd => { const sh = new THREE.Shape(); sh.moveTo(sd * 3.7, 1.25); sh.lineTo(sd * 3.7, 3.2); sh.lineTo(sd * .1, 3.2); sh.closePath(); const m = mesh(new THREE.ShapeGeometry(sh), straw, 0, 0, -3.19); m.receiveShadow = false; L.add(m);
      const len = Math.hypot(3.6, 1.95), r = mesh(new THREE.BoxGeometry(len, .2, .14), dk, sd * 1.9, 2.22, -3.13); r.rotation.z = -sd * Math.atan2(1.95, 3.6); L.add(r); });
    L.add(mesh(new THREE.BoxGeometry(3.4,.16,.12), dk, 0, 2.62, -3.12)); L.add(mesh(new THREE.BoxGeometry(.16,.62,.12), dk, 0, 2.93, -3.11));
    for (let i = 0; i < 11; i++) { const t = i / 10, x = -3.2 + t * 6.4, y = 1.38 - Math.sin(t * Math.PI) * .2 + (Math.abs(x) < .95 ? -.62 : 0); if (Math.abs(x) < .95) continue; L.add(mesh(sph(.055), glow([0xffe0a8, 0xffb3c1, 0xbfe3ff][i % 3]), x, y + .1, -3.1)); }
    const seat = G(mesh(new THREE.BoxGeometry(2.2,.5,.7), lt, 0, .25, 0), mesh(new THREE.BoxGeometry(2.1,.12,.62), mat(0xff8fa3), 0, .56, 0), mesh(new THREE.BoxGeometry(2.2,.06,.04), dk, 0, .3, .36));
    [[-.75, 0xfff3a0, .2], [.7, 0xc9b6ff, -.25], [.3, 0x8fdc8a, .1]].forEach(([x, c, rz]) => { const p = mesh(new THREE.BoxGeometry(.38,.36,.14), mat(c), x, .78, -.2); p.rotation.set(-.25, 0, rz); seat.add(p); }); [-.5, .5].forEach(x => seat.add(mesh(sph(.035), brass, x, .3, .37)));
    thing(L, seat, 0, -2.8, 2.3, 1.2, .9, loftWindow, 'Window seat: tap to look at the sky');
    const wr = G(mesh(new THREE.BoxGeometry(1.15,2.1,.6), w, 0, 1.05, 0), mesh(new THREE.BoxGeometry(1.27,.1,.68), dk, 0, 2.15, 0), mesh(new THREE.BoxGeometry(1.2,.12,.64), dk, 0, .06, 0));
    [-1, 1].forEach(sd => { wr.add(mesh(new THREE.BoxGeometry(.5,1.75,.04), lt, sd * .275, 1.1, .31)); wr.add(mesh(sph(.04), brass, sd * .07, 1.05, .35)); }); wr.add(mesh(new THREE.BoxGeometry(.34,1.2,.02), new THREE.MeshStandardMaterial({ color:0xdff3ff, roughness:.15, metalness:.4 }), -.275, 1.2, .335));
    { const sc = mesh(new THREE.BoxGeometry(.5,.07,.2), mat(0x7ec8e3), .35, 2.24, .1); sc.rotation.z = .08; wr.add(sc); wr.add(mesh(new THREE.CylinderGeometry(.16,.19,.2,12), mat(0xc98f58), -.3, 2.3, 0)); wr.add(mesh(new THREE.CylinderGeometry(.27,.27,.03,14), mat(0xc98f58), -.3, 2.21, 0)); } // a scarf and a straw hat on top
    thing(L, wr, 2.95, -2.9, 1.3, 2.2, .9, () => VISIT ? toast(`${VISIT.name}'s wardrobe.`) : openLookEditor(() => {}), 'Wardrobe: tap to change your look'); }
  // the study: a writing desk with your shop ledger, shelves of books, and a stand holding the story of your island
  { const desk = G(mesh(new THREE.BoxGeometry(1.9,.08,.8), w, 0, .78, 0), mesh(new THREE.BoxGeometry(1.7,.22,.7), lt, 0, .63, 0)); [[-.85,-.32],[.85,-.32],[-.85,.32],[.85,.32]].forEach(([x, z]) => desk.add(mesh(new THREE.BoxGeometry(.09,.74,.09), dk, x, .37, z)));
    [-.4, .4].forEach(x => desk.add(mesh(sph(.035), brass, x, .63, .36)));
    const page = fine(0xfff8ee); [-1, 1].forEach(sd => { const pg = mesh(new THREE.BoxGeometry(.3,.02,.42), page, sd * .16 - .2, .845, .05); pg.rotation.z = sd * .08; desk.add(pg); [-.12, -.04, .04, .12].forEach(z => desk.add(mesh(new THREE.BoxGeometry(.22,.004,.012), fine(0x8a7a66), sd * .16 - .2, .86, .05 + z))); }); desk.add(mesh(new THREE.BoxGeometry(.66,.03,.46), mat(0x9b3b4a), -.2, .825, .05));
    desk.add(mesh(new THREE.CylinderGeometry(.05,.06,.09,10), fine(0x2e2438), .35, .865, -.1)); const quill = mesh(new THREE.ConeGeometry(.03,.42,5), fine(0xffffff), .39, 1.05, -.1); quill.rotation.z = -.35; desk.add(quill);
    desk.add(mesh(new THREE.CylinderGeometry(.09,.11,.04,12), brass, .72, .84, -.15)); desk.add(mesh(new THREE.CylinderGeometry(.015,.015,.3,6), brass, .72, 1, -.15)); desk.add(mesh(sph(.11), glow(0xffe0a8), .72, 1.2, -.15));
    [0, 1, 2].forEach(i => desk.add(mesh(new THREE.CylinderGeometry(.07,.07,.025,12), brass, .3 + i * .012, .835 + i * .026, .25))); // a little stack of coins
    desk.add(mesh(new THREE.BoxGeometry(.5,.07,.5), mat(0x9b3b4a), 0, .5, .75)); [[-.2,.55],[.2,.55],[-.2,.95],[.2,.95]].forEach(([x, z]) => desk.add(mesh(new THREE.BoxGeometry(.05,.46,.05), dk, x, .23, z))); // a stool
    thing(ST, desk, -1.4, -2.7, 2, 1.4, 1.5, () => VISIT ? toast(`${VISIT.name}'s desk.`) : shopCard(), 'Desk: tap to open your shop ledger');
    [2.25, 2.75].forEach((y, r) => { ST.add(mesh(new THREE.BoxGeometry(1.5,.05,.26), w, .2 + r * 2.2, y - r * .5, -3.05)); for (let i = 0; i < 8; i++) { const h = .22 + ((i * 7 + r * 3) % 5) * .03; ST.add(mesh(new THREE.BoxGeometry(.11,h,.19), fine([0xff8fa3,0x7ec8e3,0xffc857,0x8fdc8a,0xc9b6ff,0x9b3b4a][(i + r * 2) % 6]), -.42 + i * .13 + r * 2.2 + .2, y - r * .5 + .025 + h / 2, -3.05)); } });
    const stand = G(mesh(new THREE.CylinderGeometry(.06,.08,1,10), dk, 0, .5, 0), mesh(new THREE.CylinderGeometry(.28,.3,.06,14), dk, 0, .03, 0)); const top = mesh(new THREE.BoxGeometry(.7,.05,.5), w, 0, 1.05, 0); top.rotation.x = .45; stand.add(top);
    const bk = new THREE.Group(); bk.position.set(0, 1.09, .02); bk.rotation.x = .45; bk.add(mesh(new THREE.BoxGeometry(.6,.04,.4), mat(0x3f6fb5), 0, 0, 0)); [-1, 1].forEach(sd => bk.add(mesh(new THREE.BoxGeometry(.27,.03,.36), page, sd * .145, .03, 0))); bk.add(mesh(new THREE.BoxGeometry(.03,.012,.5), fine(0xff8fa3), .05, .05, .08)); stand.add(bk);
    thing(ST, stand, 2.5, 1.7, .9, 1.4, .8, () => VISIT ? toast(`${VISIT.name}'s story.`) : openStory(), 'Book stand: tap to read your story'); }
}
function drawHomeInside() { homeLadder.visible = homeSize() >= 2; studyDoor.visible = homeSize() >= 3; }
const CAT_INFO = {
  rug:   { label:'Rug', need:'a rug', buy:'Pip sells a Round Rug.' },
  table: { label:'Table', need:'a table', buy:'Pip sells a Round Table.' },
  seat:  { label:'Chair', need:'a chair', buy:'Pip sells an Armchair. A good friend might give you one too.' },
  tall:  { label:'Bookshelf', need:'a bookshelf', buy:'Pip sells a Bookshelf.' },
  decor: { label:'Small decor', need:'something small, like a lamp or a plant', buy:'Pip sells a Paper Lamp, a Potted Fern, and a Star Globe.' },
  wall:  { label:'Wall art', need:'something to hang on the wall', buy:'Wall art comes from friends. Get to know Lumen and Pip.' },
};
const SPOTS = [
  { cat:'rug',   x:0,     z:.4 },
  { cat:'table', x:0,     z:.4 },
  { cat:'seat',  x:-1.55, z:.55, rot:Math.PI/2 },
  { cat:'seat',  x:1.55,  z:.55, rot:-Math.PI/2 },
  { cat:'tall',  x:-3.3,  z:.9,  rot:Math.PI/2 },
  { cat:'decor', x:-1.45, z:-2.7 },
  { cat:'decor', x:.95,   z:-2.8 },
  { cat:'decor', x:3.1,   z:2.3 },
  { cat:'wall',  x:-2.6,  z:-3.17, y:2.05 },
  { cat:'wall',  x:3.67,  z:.6,  y:1.7, rot:-Math.PI/2 },
  // the loft
  { rm:'loft', cat:'rug',   x:0,    z:.5 },
  { rm:'loft', cat:'seat',  x:-1.6, z:.6, rot:Math.PI/2 },
  { rm:'loft', cat:'tall',  x:-3.3, z:-.6, rot:Math.PI/2 },
  { rm:'loft', cat:'decor', x:-2.2, z:-2.7 },
  { rm:'loft', cat:'decor', x:1.9,  z:-2.8 },
  { rm:'loft', cat:'wall',  x:3.67, z:-.6, y:1.7, rot:-Math.PI/2 },
  // the study
  { rm:'study', cat:'table', x:0,    z:.2 },
  { rm:'study', cat:'seat',  x:1.5,  z:.3, rot:-Math.PI/2 },
  { rm:'study', cat:'tall',  x:-3.3, z:-.8, rot:Math.PI/2 },
  { rm:'study', cat:'tall',  x:3.3,  z:-.8, rot:-Math.PI/2 },
  { rm:'study', cat:'decor', x:1.9,  z:-2.8 },
  { rm:'study', cat:'wall',  x:1.4,  z:-3.17, y:2.05 },
];
function labelSprite(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = 'rgba(59,47,74,.72)'; g.beginPath(); g.roundRect(4, 8, 248, 48, 24); g.fill();
  g.fillStyle = '#fff8ee'; g.font = 'bold 26px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 33);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthTest:false })); sp.scale.set(1.2, .3, 1); sp.renderOrder = 5; return sp;
}
const hitMat = new THREE.MeshBasicMaterial({ visible:false }), markMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.4, side:THREE.DoubleSide });
const spotGroups = SPOTS.map((sp, i) => {
  const g = new THREE.Group(); g.position.set(sp.x, sp.y || 0, sp.z); g.rotation.y = sp.rot || 0; g.userData = { kind:'spot', i };
  const mark = new THREE.Group(), hit = new THREE.Group();
  if (sp.cat === 'wall') {
    mark.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(.95,.75)), new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:.6 })));
    hit.add(new THREE.Mesh(new THREE.PlaneGeometry(1,.8), hitMat));
  } else if (sp.cat === 'rug') {
    const r = mesh(new THREE.RingGeometry(1.05,1.15,40), markMat, 0, .015, 0); r.rotation.x = -Math.PI/2; mark.add(r);
    const h = new THREE.Mesh(new THREE.RingGeometry(.6,1.2,24), hitMat); h.rotation.x = -Math.PI/2; h.position.y = .02; hit.add(h);
  } else {
    const rr = sp.cat === 'tall' ? .55 : .42, r = mesh(new THREE.RingGeometry(rr - .07, rr, 24), markMat, 0, .02, 0); r.rotation.x = -Math.PI/2; mark.add(r);
    hit.add(mesh(new THREE.CylinderGeometry(rr, rr, sp.cat === 'table' ? .6 : .03, 16), hitMat, 0, sp.cat === 'table' ? .3 : .02, 0));
  }
  const lab = labelSprite(CAT_INFO[sp.cat].label); lab.position.set(0, sp.cat === 'wall' ? -.55 : .45, sp.cat === 'wall' ? .05 : sp.cat === 'rug' ? .8 : 0); if (sp.cat === 'rug') lab.position.y = .2;
  g.add(mark, hit, lab); (sp.rm ? ROOMS[sp.rm].g : room).add(g); return g;
});
if (S.placed.length === 10) S.placed = S.placed.concat(Array(SPOTS.length - 10).fill(null)); // the loft and the study added spots after the first 10
// older saves had 6 generic spots: move each placed item into a spot that fits it
if (S.placed.length !== SPOTS.length) {
  const old = S.placed.filter(Boolean); S.placed = Array(SPOTS.length).fill(null);
  old.forEach(k => { const i = SPOTS.findIndex((sp, j) => sp.cat === FURN_CAT[k] && !S.placed[j]); if (i >= 0) S.placed[i] = k; });
}
function furnModel(id) {
  const g = new THREE.Group();
  if (id === 'rug') g.add(mesh(new THREE.CylinderGeometry(.9,.9,.03,32), mat(0x7ec8e3), 0, .02, 0));
  if (id === 'fern') { g.add(mesh(new THREE.CylinderGeometry(.22,.17,.35,14), mat(0xd9825b), 0, .17, 0)); for (let i=0;i<6;i++){ const l = mesh(new THREE.ConeGeometry(.08,.6,6), mat(0x4fb46a), Math.cos(i)*.12, .55, Math.sin(i)*.12); l.rotation.set(Math.sin(i)*.5, 0, Math.cos(i)*.5); g.add(l); } }
  if (id === 'lamp') { g.add(mesh(new THREE.CylinderGeometry(.03,.03,1.2,8), mat(0x9b6b4a), 0, .6, 0)); g.add(mesh(sph(.28), glow(0xffe0a8), 0, 1.35, 0)); }
  if (id === 'table') { g.add(mesh(new THREE.CylinderGeometry(.55,.55,.07,24), mat(0xc98f58), 0, .7, 0)); g.add(mesh(new THREE.CylinderGeometry(.07,.12,.7,10), mat(0x9b6b4a), 0, .35, 0)); }
  if (id === 'armchair') { const c = mat(0xff8fa3); g.add(mesh(new THREE.BoxGeometry(.9,.4,.8), c, 0, .25, 0)); g.add(mesh(new THREE.BoxGeometry(.9,.7,.2), c, 0, .6, -.35)); [-1,1].forEach(s => g.add(mesh(new THREE.BoxGeometry(.18,.5,.8), c, s*.45, .4, 0))); }
  if (id === 'bookshelf') { g.add(mesh(new THREE.BoxGeometry(1,1.5,.35), mat(0x9b6b4a), 0, .75, 0)); for (let r=0;r<3;r++) for (let b=0;b<5;b++) g.add(mesh(new THREE.BoxGeometry(.13,.33,.28), mat([0xff8fa3,0x7ec8e3,0xffc857,0x8fdc8a,0xc9b6ff][(b+r)%5]), -.32+b*.16, .3+r*.45, .04)); }
  if (id === 'globe') { g.add(mesh(new THREE.CylinderGeometry(.2,.25,.5,12), mat(0x9b6b4a), 0, .25, 0)); const s = mesh(sph(.35), mat(0x1f2a52), 0, .85, 0); g.add(s); for (let i=0;i<14;i++) s.add(mesh(sph(.025), glow(0xfff3a0), ...new THREE.Vector3().randomDirection().multiplyScalar(.35).toArray())); }
  if (id === 'rocker') { const w = mat(0xb87d45); g.add(mesh(new THREE.BoxGeometry(.7,.08,.7), w, 0, .45, 0)); g.add(mesh(new THREE.BoxGeometry(.7,.8,.08), w, 0, .85, -.32)); [-1,1].forEach(s => { const r = mesh(new THREE.TorusGeometry(.6,.03,6,20,1.2), w, s*.3, .6, 0); r.rotation.set(0, Math.PI/2, Math.PI*1.35); g.add(r); }); g.add(mesh(new THREE.BoxGeometry(.6,.1,.6), mat(0xff8fa3), 0, .52, 0)); }
  if (id === 'sign') { g.add(mesh(new THREE.BoxGeometry(.9,.5,.06), mat(0xff8fa3), 0, 0, .03)); g.add(mesh(new THREE.BoxGeometry(.98,.08,.08), mat(0x9b6b4a), 0, .29, .04)); g.add(mesh(sph(.09), glow(0xffc857), 0, 0, .08)); [-.3,.3].forEach(x => g.add(mesh(sph(.05), mat(0xffffff), x, 0, .07))); return g; }
  if (id === 'sign_old') { g.add(mesh(new THREE.CylinderGeometry(.05,.05,1.1,8), mat(0x9b6b4a), 0, .55, 0)); g.add(mesh(new THREE.BoxGeometry(.9,.45,.08), mat(0xff8fa3), 0, 1.1, 0)); g.add(mesh(sph(.08), glow(0xffc857), 0, 1.1, .05)); }
  if (id === 'cake') { g.add(mesh(new THREE.CylinderGeometry(.34,.36,.24,20), mat(0xfff1d6), 0, .12, 0)); g.add(mesh(new THREE.CylinderGeometry(.24,.26,.2,20), mat(0xff8fa3), 0, .34, 0)); for (let i=0;i<5;i++){ const a = i/5*Math.PI*2; g.add(mesh(new THREE.CylinderGeometry(.015,.015,.12,6), mat(0x7ec8e3), Math.cos(a)*.14, .5, Math.sin(a)*.14)); g.add(mesh(sph(.025), glow(0xffc857), Math.cos(a)*.14, .58, Math.sin(a)*.14)); } return g; }
  if (id === 'painting') { g.add(mesh(new THREE.BoxGeometry(1,.8,.06), mat(0xc98f58), 0, 0, .03)); g.add(mesh(new THREE.BoxGeometry(.86,.66,.04), mat(0x1f2552), 0, 0, .06)); g.add(mesh(new THREE.CircleGeometry(.14,20), glow(0xfff3a0), .18, .1, .09)); [[-.25,.15],[-.1,-.12],[.3,-.18],[-.3,-.2]].forEach(([x,y]) => g.add(mesh(new THREE.CircleGeometry(.025,8), glow(0xffffff), x, y, .09))); return g; }
  if (id === 'painting_old') { [-.3,.3].forEach(x => g.add(mesh(new THREE.CylinderGeometry(.04,.04,1.5,6), mat(0x9b6b4a), x, .75, 0))); g.add(mesh(new THREE.BoxGeometry(.9,.7,.05), mat(0x1f2552), 0, 1.2, .06)); g.add(mesh(new THREE.CircleGeometry(.18,20), glow(0xfff3a0), .15, 1.28, .09)); g.add(mesh(new THREE.CircleGeometry(.05,10), glow(0xffffff), -.2, 1.1, .09)); }
  if (id === 'mushroom') { g.add(mesh(new THREE.CylinderGeometry(.1,.14,.6,10), mat(0xfff1d6), 0, .3, 0)); const cap = mesh(new THREE.SphereGeometry(.4,20,10,0,Math.PI*2,0,Math.PI/2), glow(0x9fe7e0), 0, .58, 0); g.add(cap); }
  return g;
}
function drawRoom() {
  // an empty spot only shows its outline and label when you own furniture that could go there, so the room isn't covered in labels
  const waiting = new Set(Object.entries(S.furn || {}).filter(([k, n]) => n > S.placed.filter(p => p === k).length).map(([k]) => FURN_CAT[k]));
  spotGroups.forEach((g, i) => {
    while (g.children.length > 3) g.remove(g.children[3]);
    const k = S.placed[i]; g.children[0].visible = g.children[2].visible = !k && waiting.has(SPOTS[i].cat);
    if (k) g.add(furnModel(k));
  });
  Object.entries(shelfItems).forEach(([id, m]) => m.visible = S.aha.includes(id));
}
drawRoom();

// --- sky: clouds, stars, rain/snow ---
const clouds = [];
for (let i=0;i<16;i++){
  const c = new THREE.Group(), m = mat(0xffffff, { roughness:1 });
  for (let j=0;j<4;j++){ const p = mesh(sph(.9+Math.random()*.8), m, j*1.1, Math.random()*.4, Math.random()*.6); p.castShadow = false; c.add(p); }
  c.position.set(-40+Math.random()*100, -14+Math.random()*8, -45+Math.random()*70); // a sea of clouds below the islands
  if (c.position.y > -4 && (Math.hypot(c.position.x, c.position.z) < 12 || Math.hypot(c.position.x-ORCH_POS.x, c.position.z-ORCH_POS.z) < 11 || Math.hypot(c.position.x-WIND_POS.x, c.position.z-WIND_POS.z) < 11 || Math.hypot(c.position.x-NIGHT_POS.x, c.position.z-NIGHT_POS.z) < 10 || Math.hypot(c.position.x-OH.x, c.position.z-OH.z) < 14 || (c.position.x > 5 && c.position.x < 22 && Math.abs(c.position.z-2) < 4))) c.position.y = -12;
  c.userData.v = .3 + Math.random()*.5; clouds.push(c); scene.add(c);
}
const starGeo = new THREE.BufferGeometry(), SN = 500, sp = new Float32Array(SN*3);
for (let i=0;i<SN;i++){ const v = new THREE.Vector3().randomDirection(); v.y = Math.abs(v.y)*.8 + .1; v.normalize().multiplyScalar(110); sp.set([v.x, v.y, v.z], i*3); }
starGeo.setAttribute('position', new THREE.BufferAttribute(sp,3));
const moonCanvas = document.createElement('canvas'); moonCanvas.width = moonCanvas.height = 128;
const moonTex = new THREE.CanvasTexture(moonCanvas);
const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:moonTex, transparent:true, fog:false, depthWrite:false }));
moonSprite.scale.setScalar(9); scene.add(moonSprite); const moonHalo = halo(0xdff3ff, 26, 0); scene.add(moonHalo); let moonDrawn = -1;
const starMat = new THREE.PointsMaterial({ color:0xffffff, size:2, sizeAttenuation:false, transparent:true, opacity:0, fog:false, depthWrite:false });
const stars = new THREE.Points(starGeo, starMat); scene.add(stars);
const rainGeo = new THREE.BufferGeometry(), RN = 400, rp = new Float32Array(RN*3);
for (let i=0;i<RN;i++){ rp[i*3]=Math.random()*24-12; rp[i*3+1]=Math.random()*12; rp[i*3+2]=Math.random()*24-12; }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rp,3));
const rainMat = new THREE.PointsMaterial({ color:0xdfeaff, size:.08, transparent:true, opacity:.8 });
const rain = new THREE.Points(rainGeo, rainMat); scene.add(rain);

// --- life: butterflies, fireflies, sparkle bursts ---
// wings, painted to match the real insect. The picture is the right-hand wing: the body is at the left edge, the head end is at the bottom.
function wingTex(kind) { const wingPics = wingTex.pics || (wingTex.pics = {}); if (wingPics[kind]) return wingPics[kind]; // (written as plain functions so the museum, drawn earlier in this file, can use them)
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const fore = () => { g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(20, 122, 92, 128, 124, 102); g.bezierCurveTo(128, 80, 96, 62, 0, 60); g.closePath(); };
  const hind = () => { g.beginPath(); g.moveTo(0, 62); g.bezierCurveTo(60, 68, 104, 52, 98, 28); g.bezierCurveTo(92, 4, 30, 6, 0, 48); g.closePath(); };
  const both = fn => { [hind, fore].forEach(sh => { g.save(); sh(); g.clip(); fn(sh === fore); g.restore(); }); };
  const edge = (col, w = 3) => { [hind, fore].forEach(sh => { sh(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }); };
  const dot = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const veins = (col, n = 6) => both(isFore => { g.strokeStyle = col; g.lineWidth = 1; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(0, isFore ? 66 : 56); g.lineTo(128, (isFore ? 60 : 0) + i * (isFore ? 12 : 11)); g.stroke(); } });
  if (kind === 'brimstone') { both(() => { g.fillStyle = '#f2e05a'; g.fillRect(0, 0, 128, 128); }); veins('rgba(150,130,20,.35)'); dot(62, 96, 4, '#e8892c'); dot(52, 36, 3.5, '#e8892c'); edge('#b9a52a', 2); } // butter yellow, one small orange spot on each wing
  if (kind === 'paintedlady') { both(isFore => { g.fillStyle = '#f08a3c'; g.fillRect(0, 0, 128, 128); if (isFore) { const gr = g.createLinearGradient(70, 0, 128, 0); gr.addColorStop(0, 'rgba(30,20,15,0)'); gr.addColorStop(.45, 'rgba(30,20,15,1)'); g.fillStyle = gr; g.fillRect(70, 0, 58, 128); } });
    [[100, 96, 5], [112, 108, 4], [92, 110, 3.5], [116, 92, 3]].forEach(([x, y, r]) => dot(x, y, r, '#ffffff')); [[40, 92, 6], [62, 84, 5], [30, 106, 4]].forEach(([x, y, r]) => dot(x, y, r, '#2a1c14')); [[40, 22], [56, 24], [72, 28], [86, 34]].forEach(([x, y]) => dot(x, y, 3.5, '#2a1c14')); edge('#2a1c14', 3); } // orange, black wing tips with white spots, a row of black dots behind
  if (kind === 'purpleemperor') { both(() => { const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#6a3fb5'); gr.addColorStop(.6, '#3b2a55'); gr.addColorStop(1, '#2a1d3d'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.beginPath(); g.moveTo(60, 10); g.lineTo(56, 60); g.stroke(); });
    [[84, 92, 5], [100, 104, 4], [70, 108, 4]].forEach(([x, y, r]) => dot(x, y, r, '#ffffff')); dot(80, 30, 7, '#e8892c'); dot(80, 30, 4, '#1a1226'); edge('#1a1226', 3); } // dark with a purple sheen, a white band, and an orange-ringed eye spot
  if (kind === 'morpho') { both(() => { const gr = g.createRadialGradient(20, 62, 4, 40, 62, 110); gr.addColorStop(0, '#7fd4ff'); gr.addColorStop(.6, '#2f8fe6'); gr.addColorStop(1, '#1a5fc4'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }); edge('#10131f', 9); [[104, 98], [112, 106], [96, 110]].forEach(([x, y]) => dot(x, y, 2.5, '#ffffff')); } // shining blue with a wide black border
  if (kind === 'luna') { g.beginPath(); g.moveTo(0, 62); g.bezierCurveTo(40, 66, 78, 56, 84, 40); g.bezierCurveTo(88, 24, 70, 16, 60, 0); g.bezierCurveTo(54, 14, 58, 26, 44, 30); g.bezierCurveTo(24, 34, 8, 44, 0, 50); g.closePath(); g.fillStyle = '#b6e889'; g.fill(); g.strokeStyle = '#8fcf6a'; g.lineWidth = 2; g.stroke(); // hindwing with its long tail
    fore(); g.fillStyle = '#b6e889'; g.fill(); g.strokeStyle = '#8fcf6a'; g.lineWidth = 2; g.stroke(); g.strokeStyle = '#8a4f6a'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 70); g.bezierCurveTo(20, 122, 92, 128, 124, 102); g.stroke(); // the purple-brown front edge
    [[58, 92], [44, 44]].forEach(([x, y]) => { dot(x, y, 7, '#f6f0c8'); dot(x, y, 4.5, '#8a4f6a'); dot(x + 1, y, 2.5, '#1a1226'); }); } // one eye spot on each wing
  if (kind === 'clear' || kind === 'cicada') { g.beginPath(); g.ellipse(64, 64, 62, 26, 0, 0, 7); g.fillStyle = 'rgba(235,245,255,.5)'; g.fill(); g.strokeStyle = kind === 'cicada' ? '#e8892c' : 'rgba(60,60,80,.75)'; g.lineWidth = 3; g.stroke(); g.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(2, 64); g.quadraticCurveTo(60, 40 + i * 8, 124, 46 + i * 6); g.stroke(); } for (let x = 30; x < 120; x += 22) { g.beginPath(); g.moveTo(x, 42); g.lineTo(x + 6, 86); g.stroke(); } } // clear, with veins (orange on the cicada)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return wingPics[kind] = t; }
function wingMat(kind) { const m = new THREE.MeshStandardMaterial({ map:wingTex(kind), transparent:true, alphaTest:.25, side:THREE.DoubleSide, roughness:.7 }); m.userData.outlineParameters = NO_OUTLINE; return m; }
const butterflies = [];
const wingGeo = new THREE.PlaneGeometry(.26,.26); wingGeo.rotateX(-Math.PI/2); wingGeo.translate(.13,0,0);
for (let i=0;i<9;i++){
  const g = new THREE.Group(), m = wingMat(BUTTERFLIES[i%4].id);
  const l = new THREE.Mesh(wingGeo, m), r = new THREE.Mesh(wingGeo, m); r.scale.x = -1; g.add(l, r);
  { const bm = fine(0x2a1c14), bd = mesh(new THREE.CapsuleGeometry(.012,.11,3,6), bm, 0, 0, 0); bd.rotation.x = Math.PI/2; g.add(bd); g.add(mesh(sph(.017), bm, 0, .004, .075));
    [-1, 1].forEach(sd => { const an = mesh(new THREE.CylinderGeometry(.002,.002,.07,3), bm, sd*.02, .012, .11); an.rotation.set(Math.PI/2 - .3, 0, -sd*.35); g.add(an); g.add(mesh(sph(.006), bm, sd*.032, .022, .143)); }); }
  const home3 = [new THREE.Vector3(), ORCH_POS, WIND_POS][i%3];
  g.userData = { l, r, ph:Math.random()*10, cx:home3.x + (Math.random()*6-3), cz:home3.z + (Math.random()*6-3), cy:home3.y };
  const hb = hitBox(.6, .6, .6); g.add(hb); g.userData.sp = BUTTERFLIES[i%4]; scene.add(g); butterflies.push(g); deco(g, () => spotButterfly(g));
}
const fireflies = [], ffMat = glow(0xeaff8a);
for (let i=0;i<30;i++){ const f = mesh(sph(.05), ffMat); f.castShadow = false; const onO = i%3===0;
  f.add(halo(0xeaff8a, 14 * .05, .6));
  f.userData = { cx:(onO?ORCH_POS.x:0) + Math.random()*14-7, cz:(onO?ORCH_POS.z:0) + Math.random()*14-7, cy:(onO?ORCH_POS.y:0), ph:Math.random()*10 };
  scene.add(f); fireflies.push(f); }
const sparks = [];
for (let i=0;i<50;i++){ const s = mesh(sph(.07), new THREE.MeshBasicMaterial({ color:0xffffff })); s.castShadow = false; s.visible = false; scene.add(s); sparks.push(s); }
function burst(pos, color=0xffe27a, n=14) {
  let made = 0;
  for (const s of sparks) { if (s.visible) continue;
    s.visible = true; s.material.color.set(color); s.position.copy(pos); s.position.y += .6;
    s.userData = { v:new THREE.Vector3(Math.random()-.5, Math.random()*1.4+.8, Math.random()-.5).multiplyScalar(3), life:1 };
    if (++made >= n) break; }
}

// --- seasons ---
function applySeason() {
  const s = season();
  SEASON_ISLES.forEach(I => { I.top.material.color.set(GRASS[s]); I.lip.material.color.set(GRASS[s]).multiplyScalar(.9); });
  tuftMat.color.set(TUFT[s]); tuftMat.emissive.set(TUFT[s]).multiplyScalar(.22);
  trees.forEach(t => { t.userData.cm.color.set(CANOPY[s]); t.userData.cm2.color.set(CANOPY[s]).multiplyScalar(.86); });
  grassPatches.forEach(p => p.material.color.set(GRASS[s]).multiplyScalar(p.material.userData.f));
  flowers.visible = s < 2; tufts.visible = s !== 3 && !lowGfx;
  rainMat.color.set(s === 3 ? 0xffffff : 0xdfeaff); rainMat.size = s === 3 ? .14 : .08;
  const fz = festival(); lanterns.visible = !!fz; if (fz) lanternMat.color.set(fz.color);
  try { balloons.visible = isPartyDay() && !VISIT; } catch {} // balloons are made later in startup
  fruitTrees.forEach((t, i) => t.userData.fruits.visible = S.fruit[i] !== S.day && s !== 3);
}
applySeason();

// ============ AUDIO ============
let actx;
function startAudio() {
  if (actx) return;
  actx = new (window.AudioContext || window.webkitAudioContext)();
  setChord(0);
  master = actx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(actx.destination);
  sfxBus = actx.createGain(); musicBus = actx.createGain(); natBus = actx.createGain(); [sfxBus, musicBus, natBus].forEach(b => b.connect(master)); applyVol();
  const len = actx.sampleRate * 8; noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
  const d = noiseBuf.getChannelData(0); let last = 0;
  for (let i=0;i<len;i++){ const w = Math.random()*2-1; last = (last + .02*w)/1.02; d[i] = last*3.5; } // soft brown noise
  const fade = actx.sampleRate; // blend the tail into the head so the loop has no seam
  for (let i=0;i<fade;i++){ const k = i/fade; d[len-fade+i] = d[len-fade+i]*(1-k) + d[i]*k; }
  const loop = (freq, q) => { const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = actx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(natBus); src.start(); return { f, g }; };
  wind = loop(700, .5); rainNode = loop(2500, .4);
  const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = .07; lg.gain.value = 180; lfo.connect(lg); lg.connect(wind.f.frequency); lfo.start();
}
let sfxBus, noiseBuf, wind, rainNode;
var master, musicBus, natBus;
function applyVol() { if (!actx) return; sfxBus.gain.value = volGain('sfx'); musicBus.gain.value = volGain('music'); natBus.gain.value = volGain('nature'); }
function tone(f, { type='sine', t=0, dur=.3, vol=.06, to=null, attack=.01, bus=null } = {}) {
  if (!actx) return;
  const at = actx.currentTime + t, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at); if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(at); o.stop(at + dur + .05);
}
function hush(freq, { t=0, dur=.2, vol=.15, q=1, to=null } = {}) {
  if (!actx) return;
  const at = actx.currentTime + t, src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(freq, at);
  if (to) f.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + dur*.2); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
  src.connect(f); f.connect(g); g.connect(sfxBus); src.start(at, Math.random()); src.stop(at + dur + .05);
}
let stepFlip = false;
const SFX = {
  step:  () => { stepFlip = !stepFlip; hush(stepFlip ? 380 : 320, { dur:.09, vol:.12, q:2 }); },
  wood:  () => { stepFlip = !stepFlip; tone(stepFlip ? 180 : 160, { to:120, dur:.08, vol:.05 }); },
  till:  () => { tone(110, { to:55, dur:.25, vol:.12 }); hush(300, { dur:.25, vol:.2 }); },
  plant: () => { tone(500, { to:900, dur:.15, vol:.05 }); tone(784, { t:.1, dur:.5, vol:.04 }); },
  water: () => { hush(1800, { dur:.7, vol:.14, to:600, q:.8 }); tone(1200, { t:.15, to:700, dur:.12, vol:.02 }); tone(1500, { t:.3, to:900, dur:.1, vol:.02 }); },
  dig:   () => { hush(250, { dur:.3, vol:.25, to:180, q:1.5 }); tone(90, { to:60, dur:.2, vol:.08 }); },
  pick:  () => { tone(300, { to:700, dur:.12, vol:.07 }); [784,1047].forEach((f,i) => tone(f, { t:.08+i*.1, dur:.8, vol:.05 })); },
  coin:  () => [988,1319,1568].forEach((f,i) => tone(f, { type:'triangle', t:i*.07, dur:.5, vol:.035 })),
  click: () => tone(1400, { dur:.05, vol:.025 }),
  chop:  () => { tone(150, { to:95, dur:.18, vol:.08 }); hush(700, { dur:.18, vol:.1, q:3 }); tone(130, { t:.2, to:90, dur:.14, vol:.05 }); },
  stone: () => { [0,.09].forEach((t,i) => { hush(2400 - i*500, { t, dur:.07, vol:.12, q:6 }); tone(620 - i*90, { t, dur:.08, vol:.025 }); }); },
  swish: () => { hush(3200, { dur:.35, vol:.1, to:1400, q:.9 }); },
  squelch:() => { hush(420, { dur:.3, vol:.18, to:220, q:4 }); tone(170, { to:260, dur:.2, vol:.04 }); },
  ting:  () => { tone(1568, { type:'triangle', dur:.7, vol:.03 }); tone(2093, { type:'triangle', t:.05, dur:.5, vol:.015 }); },
  chest: () => { tone(200, { to:150, dur:.2, vol:.06 }); hush(500, { t:.05, dur:.2, vol:.08, q:2 }); },
  door:  () => { hush(220, { dur:.35, vol:.2, q:2 }); tone(140, { t:.25, to:90, dur:.15, vol:.06 }); },
  cast:  () => { hush(1200, { dur:.4, vol:.06, to:3000, q:3 }); hush(900, { t:.45, dur:.3, vol:.12, to:400 }); },
  splash:() => { hush(1500, { dur:.5, vol:.2, to:500, q:.7 }); },
  heart: () => [659,880,1175].forEach((f,i) => tone(f, { t:i*.12, dur:.9, vol:.04 })),
  bird:  () => { const b = 2200 + Math.random()*1200; for (let i=0;i<2+Math.random()*3;i++) tone(b, { t:i*.13, to:b*(1.2+Math.random()*.3), dur:.09, vol:.012 }); },
  cricket: () => { for (let i=0;i<2;i++) tone(2600, { t:i*.14, dur:.12, vol:.004, attack:.04 }); },
};
function sfx(n) { if (actx && !muted) SFX[n](); }
const VOICES = { nana:{ f:240 }, pip:{ f:620 }, drizzle:{ f:150 }, twins:{ f:360 }, lumen:{ f:820 }, mabel:{ f:420 }, hoot:{ f:200 }, allegra:{ f:560 }, sage:{ f:130 }, none:{ f:400 } };
function babble(who, text) {
  if (!actx || muted) return;
  const v = VOICES[who] || VOICES.none, n = Math.min(12, Math.ceil(text.length / 14));
  for (let i=0;i<n;i++) tone(v.f * (0.85 + Math.random()*.4), { t:i*.075, dur:.07, vol:.035 });
}
function ambience() {
  if (!actx) return;
  const h = hour(), now = actx.currentTime, on = muted ? 0 : 1, inside = S.where === 'hut';
  const listening = /THE WIND BELL|MUSIC HALL/.test(($('veil').classList.contains('show') && $('card').querySelector('.kicker') || {}).textContent || ''); // hush the wind while a sound puzzle is open
  wind.g.gain.setTargetAtTime(on * (listening ? .004 : inside ? .012 : h > 19 ? .03 : .05), now, listening ? .2 : 1.5);
  rainNode.g.gain.setTargetAtTime(on * (raining && S.t < .5 && season() !== 3 ? (inside ? .05 : .12) : 0), now, 1.5);
  if (!inside && season() !== 3 && h >= 6.3 && h < 18.5 && Math.random() < .12) sfx('bird');
  if (!inside && season() < 3 && h >= 20 && Math.random() < .1) sfx('cricket');
}
let chordIdx = -1;
function setChord(i) { chordIdx = i; }
// music: slow, warm jazz-chord swells that fade into long rests, so nature carries the space
const PROGS = [
  [[174.6,220,261.6,329.6,392],[164.8,196,246.9,293.7],[146.8,174.6,220,261.6,329.6],[130.8,164.8,196,246.9]],
  [[146.8,185,220,277.2],[164.8,207.7,246.9,311.1],[138.6,174.6,207.7,261.6],[123.5,155.6,185,233.1]],
  [[110,130.8,164.8,196],[146.8,174.6,220,261.6],[98,123.5,146.8,174.6],[130.8,155.6,196,233.1]],
  [[110,130.8,164.8,196,246.9],[98,116.5,146.8,174.6],[87.3,110,130.8,164.8]],
];
let musicClock = 8, musicStep = 0;
function playMusic(dt) {
  if (!actx || muted || chordIdx < 0) return;
  if ((musicClock += dt) < 11) return;
  musicClock = Math.random() * 3;
  const prog = PROGS[chordIdx], ch = prog[musicStep++ % prog.length];
  ch.forEach((f, i) => { const t = i * .09; tone(f, { t, dur:7, vol:.018, attack:1.6, bus:musicBus }); tone(f*2.001, { t, dur:4, vol:.004, attack:1.2, bus:musicBus }); });
  if (chordIdx < 3 && Math.random() < .5) tone(ch[ch.length-1] * 2, { t:2.5, dur:4, vol:.01, attack:.4, bus:musicBus });
}
function chime(f=880) {
  if (!actx || muted) return;
  const o = actx.createOscillator(), g = actx.createGain(); o.type='sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0, actx.currentTime); g.gain.linearRampToValueAtTime(.08, actx.currentTime+.02); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime+1.2);
  o.connect(g); g.connect(sfxBus); o.start(); o.stop(actx.currentTime+1.3);
}
const muteBtn = document.getElementById('mute');
const ICON_ON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 7a4 4 0 010 6M15.5 5a7 7 0 010 10" fill="none" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>', ICON_OFF = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 8l4 4M17 8l-4 4" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>';
const drawMute = () => { muteBtn.innerHTML = muted ? ICON_OFF : ICON_ON; muteBtn.setAttribute('aria-label', muted ? 'Sound is off. Tap to turn on.' : 'Sound is on. Tap to turn off.'); };
drawMute();
muteBtn.onclick = () => { muted = !muted; try { localStorage.setItem(MUTE_KEY, muted); } catch {} if (master) master.gain.value = muted ? 0 : 1; if (!muted) sfx('click'); drawMute(); };

// ============ UI ============
const $ = id => document.getElementById(id);
let toastT;
// messages at the bottom of the screen: each stays long enough to read, they take turns instead of replacing each other, and a tap closes one early
const toastQ = []; let toastOn = false;
// one interruption at a time: a gift, a letter, a reveal or a "new today" card only starts once the screen has been clear for a few seconds
let quietSince = performance.now();
const screenBusy = () => $('dialog').classList.contains('show') || $('veil').classList.contains('show') || !!document.querySelector('.presents') || toastOn;
setInterval(() => { if (screenBusy()) quietSince = performance.now(); }, 300);
function quiet() { if (screenBusy() || performance.now() - quietSince < 3500) return false; quietSince = performance.now(); return true; } // true means: your turn, and nobody else gets one for a few seconds
function toast(msg) { msg = String(msg); if (toastOn && ($('toast').textContent === msg || toastQ.includes(msg))) return; if (toastOn) { if (toastQ.length < 3) toastQ.push(msg); return; }
  const t = $('toast'); t.textContent = msg; t.classList.add('show'); toastOn = true; clearTimeout(toastT); toastT = setTimeout(toastNext, Math.min(9000, Math.max(2600, 1300 + msg.length * 60))); }
function toastNext() { clearTimeout(toastT); $('toast').classList.remove('show'); toastOn = false; if (toastQ.length) { const m = toastQ.shift(); setTimeout(() => toast(m), 280); } }
$('toast').addEventListener('click', toastNext);
const hex = c => '#' + c.toString(16).padStart(6,'0');
const ICON = {
  coin:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#ffc857" stroke="#d99a2b" stroke-width="2"/><circle cx="10" cy="10" r="3.5" fill="none" stroke="#d99a2b" stroke-width="1.6"/></svg>',
  hammer:'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="10" height="5" rx="1.5" fill="#8a8290"/><rect x="8" y="8" width="3" height="10" rx="1.2" fill="#c98f58"/></svg>',
  goal:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#8fdc8a"/><path d="M6 10.5l2.7 2.7L14 7.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bag:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 5V4a2.5 2.5 0 015 0v1" fill="none" stroke="#9b6b4a" stroke-width="1.6"/><rect x="4" y="5" width="12" height="13" rx="4" fill="#d9a066"/><path d="M4.5 9.5h11" stroke="#9b6b4a" stroke-width="1.4"/><rect x="6.5" y="11.5" width="7" height="4.5" rx="1.5" fill="#c98f58"/></svg>',
  book:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5c2.5-1 5-1 7 .5v11c-2-1.5-4.5-1.5-7-.5z" fill="#ff8fa3"/><path d="M17 4.5c-2.5-1-5-1-7 .5v11c2-1.5 4.5-1.5 7-.5z" fill="#7ec8e3"/></svg>',
  on:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 7a4 4 0 010 6M15.5 5a7 7 0 010 10" fill="none" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>',
  off:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 8l4 4M17 8l-4 4" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>',
};
function drawHud() {
  const fz = festival(), mph = moon();
  $('day').textContent = fz ? fz.name : `${SEASONS[season()]}, ${dateLabel(today())}${raining ? (season() === 3 ? ', snow' : ', rain') : hour() >= 19 && (mph.idx === 4 || mph.idx === 0) ? `, ${mph.name.toLowerCase()}` : ''}`;
  const h = hour(), hr = Math.floor(h), mn = Math.floor((h-hr)*6)*10, h12 = ((hr+11)%12)+1;
  { const up = hr >= 6 && hr < 19, k = Math.min(1, Math.max(0, S.t)); $('clock').innerHTML = `<span class="dial">${up ? (hr >= 17 ? '🌇' : '☀️') : '🌙'}</span>${h12}:${String(mn).padStart(2,'0')} ${hr<12||hr>=24?'AM':'PM'}`; }
  $('coins').innerHTML = `${ICON.coin}${S.coins}`; $('coins').setAttribute('aria-label', `${S.coins} coins`);
  $('bagBtn').innerHTML = `${ICON.bag}<span class="lbl">Bag</span>`;
  Object.keys(S.furn).forEach(k => S.furn[k] > 0 && noteFind(k));
  { const cats = collectionCats(); $('journalBtn').innerHTML = `${ICON.book}<span class="lbl">Collections</span> ${cats.reduce((a, c) => a + c.ids.filter(c.has).length, 0)}`; }
  { const tg = typeof questTarget === 'function' ? questTarget() : null, fz = festival();
    bubbles.forEach(b => { const id = b.userData.id, fest = fz && fz.host === id && !S.fests[fz.id + fz.year];
      const kind = tg === npcs[id] ? null : fest ? '!' : S.talked[id] !== S.day ? '...' : null;
      b.visible = !!kind; if (kind) b.material.map = BUBBLE[kind]; }); }
  $('goalsBtn').hidden = !featureOn('goals'); ensureGoals(); $('goalsBtn').innerHTML = `${ICON.goal}<span class="lbl">Goals</span> ${S.goals.list.filter(g => g.have >= g.need).length} of 3`;
  drawQuest();
  { let tb = $('testBtn'); if (TESTSLOT) { if (!tb) { tb = document.createElement('button'); tb.id = 'testBtn'; tb.className = 'pill testpill'; tb.onclick = testerTools; tb.innerHTML = '🧪<span class="lbl"> Test island</span>'; $('coins').before(tb); } } }
  { let mb = $('missionsBtn'); if (founderOn() && fGot('missions') && !paused('missions') && !VISIT) { if (!mb) { mb = document.createElement('button'); mb.id = 'missionsBtn'; mb.className = 'pill founderpill'; mb.onclick = openMissions; $('goalsBtn').after(mb); } const L = missionList(); mb.innerHTML = `✦<span class="lbl"> Missions</span> ${L.filter(m => S.missions?.[m.id]).length} of ${L.length}`; } else if (mb) mb.remove(); }
  try { missionCheck(); } catch {}
  const s = season(), shown = Object.entries(CROPS).filter(([k,c]) => (c.seasons.includes(s) && (!c.locked || S.q4 >= 5)) || S.seeds[k] > 0);
  if (!shown.some(([k]) => k === S.sel) && shown.length) S.sel = shown[0][0];
  $('bar').style.display = S.where === 'hut' || buildMode ? 'none' : 'flex';
  $('buildBtn').hidden = VISIT || (S.home || 0) < 3 || S.where !== 'home'; $('buildBtn').innerHTML = `${ICON.hammer}<span class="lbl">${buildMode ? 'Building' : 'Build'}</span>`;
  // the hotbar: your tools on the left (tap one to see what it does), then your seeds
  const tools = [['axe','🪓','Stone Axe', 'Tap a tree to chop logs.'], ['pick','⛏️','Stone Pickaxe','Tap a rock to break it for stone.'], ['net','🦋','Bug Net','Tap an insect or butterfly to swing.'], ['rod','🎣','Fishing Rod','Tap a dock to fish.'], ['balloon','🎈','Founder Balloon','Fly to any island.'], ['myth','🪽','Legend','']]
    .filter(([k]) => k === 'rod' ? S.bridge || S.mode === 'fisher' : k === 'balloon' ? BALLOON_ON && S.founderBalloon && !VISIT : k === 'myth' ? mythOn() && !!mp().revealed : S.tools[k]).map(([k, ic, name, how]) => { const bronze = (k === 'axe' && S.tools.bronzeAxe) || (k === 'pick' && S.tools.bronzePick);
      return `<div class="hslot tool ${bronze ? 'bronze' : ''}" data-tool="${k}" data-how="${(bronze ? name.replace('Stone', 'Bronze') : name) + ': ' + how}"><span>${ic}</span></div>`; }).join('');
  const xt = ''; // extra tools (like the Creator's) live in the developer panel, not the hotbar
  $('bar').innerHTML = (tools || xt ? xt + tools + '<i class="hdiv"></i>' : '') + shown.map(([k,c]) => { const n = S.seeds[k] || 0, now = c.seasons.includes(s);
    return `<div class="hslot seed ${S.sel===k?'on':''} ${now ? '' : 'late'} ${n ? '' : 'none'}" data-k="${k}" title="${c.name}"><span>${icon(k)}</span><b>${n}</b><small>${now ? c.name : 'Off season'}</small></div>`; }).join('');
  document.querySelectorAll('.hslot.seed').forEach(el => el.onclick = () => { S.sel = el.dataset.k; drawHud(); const c = CROPS[S.sel], n = S.seeds[S.sel] || 0;
    toast(n ? `${c.name} seeds chosen. Tap an empty garden square to plant.` : `No ${c.name} seeds. Tap another seed in this bar, or buy more from Pip on the Town Square.`); });
  document.querySelectorAll('[data-xt]').forEach(el => el.onclick = () => extraTools[+el.dataset.xt].run());
  document.querySelectorAll('.hslot.tool:not([data-xt])').forEach(el => el.onclick = () => el.dataset.tool === 'balloon' ? balloonMenu() : el.dataset.tool === 'myth' ? mythMenu() : toast(el.dataset.how));
}
function openDialog(name, text, btns=[], hearts, voice) {
  babble(voice || (name.startsWith('Nana') ? 'nana' : name.startsWith('Pip') ? 'pip' : name.startsWith('Captain') ? 'drizzle' : name.startsWith('Moss') ? 'twins' : name.startsWith('Lumen') ? 'lumen' : ({ Mabel:'mabel', Professor:'hoot', Allegra:'allegra', Sage:'sage' })[name.split(' ')[0]] || 'none'), text);
  $('dName').textContent = name;
  $('dHearts').textContent = hearts == null ? '' : '♥'.repeat(hearts) + '♡'.repeat(10-hearts);
  const replyOnly = btns.some(b => b.only) || btns.length === 1 && /^\(\)\s*=>\s*\{?\s*closeDialog\(\);?\s*(toast\([^;]*\);?)?\s*\}?$/.test(String(btns[0].fn));
  const closer = { label:Object.values(NEIGHBORS).some(n => n.name === name) || Object.values(S.people || {}).some(p => p.name === name) || (typeof VISIT !== 'undefined' && VISIT && VISIT.name === name) ? 'Bye' : btns.length ? 'Not now' : 'Okay', ghost:true, fn:closeDialog }; // closing word: Bye to someone, Not now when there was something to do, Okay when there was only something to read
  const pages = sayPages(text), page = i => { typeText(pages[i]); $('dBtns').innerHTML = '';
    (i < pages.length - 1 ? [{ label:'Next', fn:() => { sfx('click'); page(i + 1); } }] : [...btns, ...(replyOnly ? [] : [closer])]).forEach(b => {
      const el = document.createElement('button'); el.textContent = b.label; if (b.ghost) el.className = 'ghost';
      el.onclick = b.fn; $('dBtns').appendChild(el); }); };
  page(0);
  $('dialog').classList.add('show');
}
function closeDialog() { $('dialog').classList.remove('show'); clearInterval(typeText.iv); }
// dialog text types out a few letters at a time; tapping the box shows it all
// what someone says, easy to take in: one sentence to a line, and when two people talk (Moss and Fern) each gets a line with their name in bold
function sayLines(text) { const safe = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;'), who = safe.split(/(?=(?:Moss|Fern): )/).map(p => p.trim()).filter(Boolean);
  if (who.length > 1) return who.map(p => p.replace(/^(Moss|Fern): /, '<b>$1:</b> '));
  const ACT = /^(?:(?:First|Then|Now),? )?(?:Tap|Go|Walk|Bring|Come back|Talk|Pick|Find|Fix|Take|Use|Cut|Help|Tell|Cross|Ring|Climb|Hang|Start|Look up|Gather|Make|Leave)\b/i, parts = safe.split(/(?<=[.!?]["”]?) (?=[A-Z0-9"“])/), isAct = t => t.length > 12 && ACT.test(t);
  if (safe.length < 90 && !parts.some(isAct)) return [safe];
  const out = []; // short sentences share a line (so "Oh!" is not a line by itself); a sentence that tells you what to do always gets a line to itself
  parts.forEach(t => { const act = isAct(t), last = out[out.length - 1];
    if (last && !act && !last.act && last.t.length + t.length <= 64) last.t += ' ' + t; else out.push({ t, act }); });
  return out.map(o => o.t); }
// a long speech is shown a few lines at a time, with Next, so it is never a wall of text
function sayPages(text) { const L = sayLines(text), n = Math.ceil(L.length / 4), size = Math.ceil(L.length / n), pages = []; for (let i = 0; i < L.length; i += size) pages.push(L.slice(i, i + size)); return pages; }
function typeText(text) { const el = $('dText'), lines = Array.isArray(text) ? text : sayLines(text), all = lines.join('<span class="brk"></span>'); clearInterval(typeText.iv); let i = 1; el.dataset.full = all;
  el.innerHTML = lines[0]; if (lines.length > 1) typeText.iv = setInterval(() => { i++; el.innerHTML = lines.slice(0, i).join('<span class="brk"></span>'); if (i >= lines.length) clearInterval(typeText.iv); }, 420); } // lines arrive one at a time; a tap shows them all
$('dialog').addEventListener('pointerdown', e => { if (e.target.tagName !== 'BUTTON') { clearInterval(typeText.iv); if ($('dText').dataset.full) $('dText').innerHTML = $('dText').dataset.full; } });
let cardClose = null, cardCleanup = null;
function hideCard() { $('veil').classList.remove('show'); if (cardCleanup) { cardCleanup(); cardCleanup = null; } }
function showCard(html, btn='Okay', onClose) {
  const kick = (html.match(/class="kicker">([^<]*)</) || [])[1] || '';
  $('card').className = 'card ' + (/, AGAIN$/.test(kick) ? 'k-recall' : /FESTIVAL/.test(kick) ? 'k-fest' : /STAR|OBSERVATORY|NIGHT SKY/.test(kick) ? 'k-star' : /MEMORY|STORY|TALE|SECRET|QUESTION/.test(kick) ? 'k-mem' : /LETTER|CHAPTER/.test(kick) ? 'k-letter' : 'k-plain');
  if (!$('veil').classList.contains('show')) { const c = $('card'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } // pops in when a menu opens
  if (cardCleanup) { cardCleanup(); cardCleanup = null; }
  btn = { 'Got it':'Okay', Done:'Close', Later:'Not now', 'Never mind':'Not now', Cancel:'Not now' }[btn] || btn; // a few words for closing, used the same way everywhere
  $('card').innerHTML = html + (btn ? `<button id="cardBtn">${btn}</button>` : '');
  // easy to take in: a long paragraph is shown one sentence to a line, on every card in the game
  $('card').querySelectorAll('p').forEach(p => { if (p.classList.contains('letter') || p.querySelector('button,input,select,textarea,svg,br') || p.textContent.length < 110) return; p.innerHTML = p.innerHTML.replace(/([.!?]"?)\s+(?=[A-Z0-9"“(]|<b>)/g, '$1<span class="brk"></span>'); });
  $('veil').classList.add('show'); cardClose = onClose;
  // rows you can tap get an arrow; rows that are only information look like plain text (checked once the caller has wired its buttons)
  setTimeout(() => document.querySelectorAll('#card .jlist button, #card .igrid .itile').forEach(b => { const tap = !!b.onclick && !b.classList.contains('locked'); b.classList.toggle('plain', !tap); b.classList.toggle('tap', tap && !!b.closest('.jlist')); if (!tap) b.tabIndex = -1; }), 0);
  if (btn) $('cardBtn').onclick = () => { hideCard(); const f = cardClose; cardClose = null; if (f) f(); };
}
function ahaHtml(id) {
  const a = AHA[id];
  return `<div class="kicker">${a.kicker}</div><h2>${a.title}</h2>${a.hook ? `<p class="memhook">${a.hook}</p>` : ''}${a.art ? `<div class="memart">${a.art}${a.cap ? a.cap.split(/(?<=[.?!]) +(?=[A-Z0-9])/).map(l => `<span>${l}</span>`).join('') : ''}</div>` : ''}<p class="gap">${a.did}</p><p class="gap">${a.real}</p><p class="gap">${a.today}</p>`;
}
// --- the three things you dig up: you handle each one before you read about it ---
const RELIC_PLAY = {
  // count the notches yourself: both rows come to 60
  bone(done) { const rows = [[11, 13, 17, 19], [11, 21, 19, 9]]; let row = 0, got = [];
    const draw = (msg) => { const sum = got.reduce((a, b) => a + b, 0), full = got.length === 4;
      showCard(`<div class="kicker">YOU DUG THIS UP</div><h2>A bone with marks cut into it</h2><p>${msg || 'Someone cut little notches into this bone, in groups. <b>Tap each group to count it.</b>'}</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;background:#ad8b68;border-radius:14px;padding:10px 8px">${rows[row].map((n, i) => `<button data-nb="${i}" style="margin:0;padding:8px 2px;background:${got[i] != null ? '#fff6e6' : '#c9ab88'};box-shadow:none;border-radius:10px;min-height:64px"><span style="display:block;font-size:11px;letter-spacing:-1px;line-height:1.1;word-break:break-all;color:#3f2c1f">${'|'.repeat(n)}</span><b style="font-size:18px">${got[i] != null ? n : '?'}</b></button>`).join('')}</div>
        <p style="text-align:center;font-weight:700;margin-top:8px">${got.filter(x => x != null).length ? `So far: ${got.filter(x => x != null).join(' + ')} = ${sum}` : '&nbsp;'}</p>
        ${full ? `<button id="rpNext">${row === 0 ? 'Turn the bone over' : 'What is this?'}</button>` : ''}`, null);
      document.querySelectorAll('[data-nb]').forEach(b => b.onclick = () => { const i = +b.dataset.nb; if (got[i] != null) return; got[i] = rows[row][i]; tone(500 + got[i] * 12, { dur:.12, vol:.04 });
        const all = [0, 1, 2, 3].every(k => got[k] != null); draw(all ? (row === 0 ? '<b>The row adds up to 60.</b> There is a second row on the other side.' : '<b>60 again.</b> The groups are different, but the total is the same. Nobody alive knows if that was on purpose.') : null); });
      if ($('rpNext')) $('rpNext').onclick = () => { if (row === 0) { row = 1; got = []; return draw('The other side. <b>Count these groups too.</b>'); } hideCard(); done(); }; };
    draw(); },
  // brush the dirt off, then say what you see
  temple(done) { const parts = [['A long arm, running down the side.', 'M30 10 V70'], ['Hands, with fingers, meeting in the middle.', 'M14 28 h12 M14 34 h12 M14 40 h12 M34 28 h12 M34 34 h12 M34 40 h12'], ['A belt, all the way around.', 'M6 34 H54 M6 42 H54'], ['A fox, carved under the arm.', 'M18 44 q6 -10 16 -6 l6 -6 l2 9 q4 5 2 10 l-8 2 l-1 8 h-4 v-7 h-8 l-2 7 h-4 v-10 q-5 -5 1 -7Z']]; const seen = [false, false, false, false]; let asked = false;
    const draw = (msg) => { const all = seen.every(Boolean);
      showCard(`<div class="kicker">YOU DUG THIS UP</div><h2>A carved stone, caked in ash</h2><p>${msg || 'There is a carving under the dirt. <b>Tap each patch to brush it clean.</b>'}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">${parts.map((pt, i) => `<button data-br="${i}" style="margin:0;padding:6px;background:${seen[i] ? '#d9cfb9' : '#6b5f52'};box-shadow:none;border-radius:12px"><svg viewBox="0 0 60 80" style="display:block;width:64px;height:84px;margin:0 auto" aria-hidden="true">${seen[i] ? `<path d="${pt[1]}" fill="none" stroke="#7a6e58" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` : '<circle cx="20" cy="26" r="7" fill="#584d42"/><circle cx="40" cy="52" r="10" fill="#584d42"/><circle cx="34" cy="20" r="4" fill="#7d7163"/>'}</svg></button>`).join('')}</div>
        ${all && !asked ? '<h4>Arms, hands, a belt. What is this stone?</h4><div class="chips"><button data-wh="table">A table</button><button data-wh="person">A person</button><button data-wh="tree">A tree</button></div>' : ''}${asked ? '<button id="rpNext">Who made it?</button>' : ''}`, null);
      document.querySelectorAll('[data-br]').forEach(b => b.onclick = () => { const i = +b.dataset.br; if (seen[i]) return; seen[i] = true; sfx('dig'); draw(`<b>${parts[i][0]}</b>`); });
      document.querySelectorAll('[data-wh]').forEach(b => b.onclick = () => { if (b.dataset.wh !== 'person') return draw('Look again at the arms and the hands.'); asked = true; chime(988); draw('<b>A person.</b> The flat top of the stone is the head. This is a statue, as tall as a house.'); });
      if ($('rpNext')) $('rpNext').onclick = () => { hideCard(); done(); }; };
    draw(); },
  // share out loaves: 60 splits nearly any way, 10 does not
  tablet(done) { const tried = { 60:{}, 10:{} };
    const draw = (msg) => { const n60 = Object.keys(tried[60]).length, n = n60 + Object.keys(tried[10]).length;
      const row = t => `<h4>${t} loaves, shared between...</h4><div class="chips">${[2, 3, 4, 5, 6].map(p => { const ok = t % p === 0, d = tried[t][p]; return `<button data-sh="${t}:${p}" class="${d ? '' : 'ghost'}" style="${d ? `background:${ok ? '#8fdc8a' : '#ffb3b3'}` : ''}">${p} people${d ? (ok ? `: ${t / p} each` : `: ${t % p} left over`) : ''}</button>`; }).join('')}</div>`;
      showCard(`<div class="kicker">YOU DUG THIS UP</div><h2>A clay tablet of wedge marks</h2><p>${msg || 'The marks are numbers. The people who wrote them counted in 60s, not 10s. <b>Share out 60 loaves to see why.</b>'}</p>${row(60)}${n60 >= 3 ? row(10) : ''}
        ${n >= 6 ? '<button id="rpNext">So that is why</button>' : `<p class="sub" style="margin-top:8px">${n60 < 3 ? `Tap ${3 - n60} more to see the 10 loaves.` : `Tap ${6 - n} more to see why.`}</p>`}`, null);
      document.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => { const [t, p] = b.dataset.sh.split(':').map(Number); const fresh = !tried[t][p]; tried[t][p] = 1; const ok = t % p === 0; sfx(ok ? 'pick' : 'click');
        const now10 = fresh && t === 60 && Object.keys(tried[60]).length === 3 && !Object.keys(tried[10]).length;
        draw((ok ? `<b>${t} loaves between ${p}: ${t / p} each, none left.</b>` : `<b>${t} loaves between ${p}: ${t % p} left over.</b> Somebody is going to argue.`) + (now10 ? ' <b>Now share out 10 loaves.</b>' : '')); });
      if ($('rpNext')) $('rpNext').onclick = () => { hideCard(); done(); }; };
    draw(); },
};
// --- do it first: a short hands-on moment before the card for a book, a recipe, or a festival ---
const playFirst = (id, then) => PLAY[id] ? PLAY[id](then) : then();
const PLAY = (() => { const pc = (k, t, body) => showCard(`<div class="kicker">${k}</div><h2>${t}</h2>${body}`, null), nx = (l = 'Next') => `<button id="plNext" style="margin-top:10px">${l}</button>`, on = done => { if ($('plNext')) $('plNext').onclick = () => { hideCard(); done(); }; };
  const each = (sel, fn) => document.querySelectorAll(sel).forEach(b => b.onclick = () => fn(b)), L = 'THE LIBRARY', K = "MABEL'S KITCHEN";
  return {
  // ---- library books ----
  press(done) { const T = { a:['SKY', false], b:['SKY', true], c:['YKS', true] }; const tried = {}; let cur = null;
    const tray = (k, flip) => `<span style="display:inline-flex;gap:3px${flip ? ';transform:scaleX(-1)' : ''}">${[...T[k][0]].map(ch => `<b style="display:inline-block;width:30px;height:36px;line-height:36px;text-align:center;background:${flip ? '#fff6e6' : '#8a8f96'};color:${flip ? '#3b2f4a' : '#fff'};border-radius:5px;font-size:22px${T[k][1] ? ';transform:scaleX(-1)' : ''}">${ch}</b>`).join('')}</span>`;
    const draw = (msg) => { pc(L, 'Set the type', `<p>${msg || 'You want to print the word <b>SKY</b>. Here are 3 trays of metal letters. <b>Tap a tray to ink it and press it on paper.</b>'}</p>
      <div class="jlist">${['a', 'b', 'c'].map(k => `<button data-ty="${k}" style="display:flex;align-items:center;justify-content:space-between;gap:10px">${tray(k)}<span class="sub">${tried[k] ? 'prints: ' : 'tap to print'}</span>${tried[k] ? tray(k, true) : ''}</button>`).join('')}</div>${tried.c ? nx('So that is how') : ''}`);
      each('[data-ty]', b => { const k = b.dataset.ty; tried[k] = 1; sfx(k === 'c' ? 'pick' : 'click'); draw(k === 'c' ? '<b>It prints SKY.</b> Every letter is backwards, and the word runs right to left. Paper flips it all the right way round.' : k === 'a' ? '<b>It prints a mess.</b> Normal letters come out backwards on paper.' : '<b>The letters are right, but it says YKS.</b> The word has to run backwards too.'); }); on(done); };
    draw(); },
  khipu(done) { const cord = (h, t, u) => `<svg viewBox="0 0 60 150" style="width:60px;height:150px" aria-hidden="true"><path d="M30 4 V146" stroke="#c9a06a" stroke-width="3"/>${[[h, 26], [t, 72], [u, 118]].map(([n, y]) => Array.from({ length:n }, (_, i) => `<circle cx="30" cy="${y + i * 8 - n * 4 + 4}" r="4.5" fill="#a3402c"/>`).join('')).join('')}</svg>`;
    const draw = (msg, won) => { pc(L, 'Read the knots', `<p>${msg || 'The Inca kept numbers on cords. <b>Knots near the top are hundreds. Knots in the middle are tens. Knots at the bottom are ones.</b>'}</p>
      <div style="display:flex;gap:18px;justify-content:center;align-items:flex-end;margin-top:8px"><div style="text-align:center">${cord(1, 4, 2)}<div><b>142</b></div><div class="sub">an example</div></div><div style="text-align:center">${cord(3, 2, 5)}<div><b>${won ? '325' : '?'}</b></div><div class="sub">your cord</div></div></div>
      ${won ? nx() : '<h4>What number is on your cord?</h4><div class="chips"><button data-kn="10">10</button><button data-kn="523">523</button><button data-kn="325">325</button></div>'}`);
      each('[data-kn]', b => { const v = b.dataset.kn; if (v === '325') { chime(988); return draw('<b>325.</b> 3 hundreds, 2 tens, 5 ones. You just read a 500-year-old record.', true); } sfx('click'); draw(v === '10' ? 'That is how many knots there are. <b>Where each knot sits matters too.</b>' : 'Close. <b>Read from the top down:</b> hundreds first.'); }); on(done); };
    draw(); },
  drift(done) { let v = 0, snapped = false; const B = 'L150 20 L158 40 L146 58 L164 78 L170 100 L152 118 L160 140';
    const draw = () => { pc(L, 'Slide the continents', `<p>${snapped ? '<b>They fit.</b> The stripes of rock line up. So do the bones of a small reptile that lived in fresh water and could never have swum an ocean.' : 'South America is on the left. Africa is on the right. <b>Drag the slider to push them together.</b>'}</p>
      <svg viewBox="0 0 300 160" style="display:block;width:100%;border-radius:14px;background:#7ec8e3;margin-top:8px" aria-hidden="true"><g id="plSA" transform="translate(${-70 + v * .7} 0)"><path d="M60 30 ${B} L70 150 Z" fill="#e2c07a"/><path d="M96 74 L162 76 L165 90 L98 88Z" fill="#b5622f" opacity=".8"/><circle cx="140" cy="112" r="4" fill="#3b2f4a"/><circle cx="128" cy="124" r="4" fill="#3b2f4a"/></g>
        <path d="M150 20 L158 40 L146 58 L164 78 L170 100 L152 118 L160 140 L250 150 L262 30Z" fill="#c9d48a"/><path d="M163 76 L236 78 L234 92 L168 90Z" fill="#b5622f" opacity=".8"/><circle cx="176" cy="112" r="4" fill="#3b2f4a"/><circle cx="190" cy="124" r="4" fill="#3b2f4a"/></svg>
      ${snapped ? `<p class="sub" style="margin-top:6px">Brown stripe: the same kind of rock. Dark dots: the same fossil.</p>${nx()}` : `<input id="plSl" type="range" min="0" max="100" value="${v}" aria-label="Push the continents together" style="width:100%;height:34px;accent-color:#e8a33d;margin-top:6px">`}`);
      if ($('plSl')) $('plSl').oninput = () => { v = +$('plSl').value; $('plSA').setAttribute('transform', `translate(${-70 + v * .7} 0)`); if (v >= 97) { v = 100; snapped = true; chime(784); draw(); } }; on(done); };
    draw(); },
  zero(done) { const col = (l, n) => `<div style="flex:1;text-align:center;background:#fff6e6;border-radius:12px;padding:8px 4px;min-height:84px"><div class="sub">${l}</div><div style="font-size:18px;letter-spacing:2px;margin-top:6px">${n ? '●'.repeat(n) : '&nbsp;'}</div></div>`;
    const draw = (msg, won) => { pc(L, 'The empty column', `<p>${msg || 'A counting board has a column for hundreds, tens, and ones. <b>Read the dots.</b>'}</p><div style="display:flex;gap:6px;margin-top:8px">${col('hundreds', 2)}${col('tens', 0)}${col('ones', 5)}</div>
      ${won ? nx() : '<h4>Write it down without the board</h4><div class="chips"><button data-zr="25">2 5</button><button data-zr="205">2 0 5</button><button data-zr="250">2 5 0</button></div>'}`);
      each('[data-zr]', b => { const v = b.dataset.zr; if (v === '205') { chime(988); return draw('<b>205.</b> The 0 means: nothing in this column. Without a mark for nothing, 25, 205, and 250 would all look the same.', true); } sfx('click'); draw(v === '25' ? 'That reads as 25. <b>The empty column got lost.</b>' : 'That puts the 5 in the tens column. <b>Look where the empty one is.</b>'); }); on(done); };
    draw(); },
  photosynthesis(done) { const tried = {}; let cur = null;
    const draw = () => { const sun = cur === 'sun'; pc(L, 'A plant under water', `<p>${cur ? (sun ? '<b>In the sun, little bubbles stream off the leaves.</b>' : '<b>In the dark, nothing. Not one bubble.</b>') : 'A leafy plant sits in a jar of water. <b>Try it in the sun, then in the dark.</b>'}</p>
      <svg viewBox="0 0 200 120" style="display:block;width:100%;max-width:260px;margin:8px auto 0;border-radius:14px;background:${cur ? (sun ? '#fff3c4' : '#3a3550') : '#eadfd0'}" aria-hidden="true"><rect x="60" y="20" width="80" height="90" rx="8" fill="#bfe6f5" opacity=".7"/><path d="M100 104 V52 M100 80 q-18 -6 -22 -22 M100 70 q18 -6 22 -22 M100 96 q-16 -2 -20 -14" stroke="#3f9a56" stroke-width="5" fill="none" stroke-linecap="round"/>${sun ? [[82, 46], [118, 40], [96, 34], [110, 56], [88, 62], [104, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" stroke="#9fd3ff"/>`).join('') : ''}</svg>
      <div class="chips" style="justify-content:center"><button data-ph="sun" class="${sun ? '' : 'ghost'}">☀️ In the sun</button><button data-ph="dark" class="${cur === 'dark' ? '' : 'ghost'}">🌙 In the dark</button></div>${tried.sun && tried.dark ? nx('What are the bubbles?') : ''}`);
      each('[data-ph]', b => { cur = b.dataset.ph; tried[cur] = 1; sfx(cur === 'sun' ? 'water' : 'click'); draw(); }); on(done); };
    draw(); },
  // ---- recipes ----
  jam(done) { const R = { fruit:['Just fruit', 'It boils down to a thin, runny sauce.'], sugar:['Fruit and sugar', 'Thick and sweet, but it never quite sets. It slides off the spoon.'], lemon:['Fruit, sugar, and a squeeze of lemon', 'It wrinkles when you push it. <b>It has set into jam.</b>'] }, tried = {};
    const draw = (k) => { if (k) tried[k] = 1; pc(K, '3 pots of berries', `<p>${k ? R[k][1] : 'Mabel has 3 pots on the stove. <b>Cook each one and see what you get.</b>'}</p><div class="chips">${Object.entries(R).map(([id, r]) => `<button data-jm="${id}" class="${tried[id] ? 'ghost' : ''}">${r[0]}</button>`).join('')}</div>${tried.lemon ? nx('Why did that one set?') : ''}`); each('[data-jm]', b => { sfx(b.dataset.jm === 'lemon' ? 'pick' : 'click'); draw(b.dataset.jm); }); on(done); };
    draw(); },
  crisp(done) { const R = { low:['Low: 100 degrees', 'Soft and cooked through, but pale. It smells like warm apple, and that is all.'], mid:['Hot: 180 degrees', '<b>Golden brown.</b> The whole bakery smells of toast and caramel.'], high:['Very hot: 300 degrees', 'Black on top, raw underneath. Mabel: "Gerald, NO."'] }, tried = {};
    const draw = (k) => { if (k) tried[k] = 1; pc(K, 'How hot should Gerald be?', `<p>${k ? R[k][1] : 'The apples are in the dish, with the topping on. <b>Pick how hot to make the oven.</b>'}</p><div class="chips">${Object.entries(R).map(([id, r]) => `<button data-cr="${id}" class="${tried[id] ? 'ghost' : ''}">${r[0]}</button>`).join('')}</div>${tried.mid ? nx('Where does the brown come from?') : ''}`); each('[data-cr]', b => { sfx(b.dataset.cr === 'mid' ? 'pick' : 'click'); draw(b.dataset.cr); }); on(done); };
    draw(); },
  tea(done) { let t = 0; const cup = (l, a) => `<div style="text-align:center"><svg viewBox="0 0 80 70" style="width:90px" aria-hidden="true"><path d="M12 10 H68 L62 62 H18Z" fill="#eef7fb" stroke="#9fc7da" stroke-width="2"/><path d="M15 16 H65 L60.500 59 H19.500Z" fill="rgba(79,154,92,${a.toFixed(2)})"/></svg><div><b>${l}</b></div></div>`;
    const draw = () => { pc(K, '2 cups, no stirring', `<p>${t === 0 ? '1 cup of hot water, 1 of cold. <b>Drop mint leaves in both, and do not stir.</b>' : t === 1 ? 'A minute later. <b>The hot cup is already turning green.</b> The cold one has barely changed.' : '<b>The hot cup is green all the way through.</b> The cold cup is still mostly clear.'}</p><div style="display:flex;justify-content:center;gap:20px;margin-top:8px">${cup('Hot', Math.min(.85, t * .42))}${cup('Cold', t * .09)}</div>
      ${t < 2 ? `<button id="plWait" style="margin-top:10px">${t ? 'Wait another minute' : 'Drop the mint in'}</button>` : nx('What moved the color?')}`); if ($('plWait')) $('plWait').onclick = () => { t++; sfx('water'); draw(); }; on(done); };
    draw(); },
  soup(done) { let h = 0, far = false;
    const draw = () => { pc(K, 'Carry the pot uphill', `<p>${far ? '<b>The higher you go, the cooler the boiling water.</b> It bubbles just as hard, but it is not as hot, so the soup cooks slower.' : 'A pot of water boils at the foot of a mountain. <b>Drag the slider to carry it up.</b>'}</p>
      <p style="text-align:center;font-size:20px;font-weight:800;margin-top:8px"><span id="plH">0</span> meters up: water boils at <span id="plT">100</span> degrees</p><input id="plSl" type="range" min="0" max="8800" step="100" value="${h}" aria-label="How high up the mountain" style="width:100%;height:34px;accent-color:#e8a33d"><p class="sub" id="plN">Sea level.</p>${far ? nx('Why does height matter?') : ''}`);
      const upd = () => { h = +$('plSl').value; $('plH').textContent = h.toLocaleString(); $('plT').textContent = Math.round(100 - h / 300); $('plN').textContent = h >= 8700 ? 'The top of Mount Everest. An egg takes a very long time up here.' : h >= 3000 ? 'A high mountain town.' : h >= 1000 ? 'Up in the hills.' : 'Sea level.'; };
      upd(); $('plSl').oninput = () => { upd(); if (h >= 3000 && !far) { far = true; draw(); } }; on(done); };
    draw(); },
  saltfish(done) { let n = 0;
    const draw = () => { pc(K, 'Salt the fish', `<p>${['A fresh, wet fillet of trout. <b>Sprinkle salt on it.</b>', 'A moment later, <b>beads of water appear on top of the fish.</b>', '<b>More water.</b> It is running off into the dish. The salt is pulling it out of the fish.'][Math.min(n, 2)]}</p>
      <svg viewBox="0 0 200 80" style="display:block;width:100%;max-width:260px;margin:8px auto 0" aria-hidden="true"><ellipse cx="100" cy="66" rx="88" ry="10" fill="#dfe6ea"/><path d="M24 44 Q100 10 176 40 Q100 70 24 44Z" fill="#f2a58a"/>${n ? Array.from({ length:n * 9 }, (_, i) => `<circle cx="${40 + (i * 37) % 120}" cy="${32 + (i * 13) % 22}" r="1.2" fill="#fff"/>`).join('') : ''}${n ? Array.from({ length:n * 4 }, (_, i) => `<ellipse cx="${50 + (i * 53) % 100}" cy="${36 + (i * 17) % 16}" rx="4" ry="3" fill="#9fd3ff" opacity=".9"/>`).join('') : ''}${n > 1 ? '<ellipse cx="100" cy="68" rx="60" ry="4" fill="#9fd3ff" opacity=".7"/>' : ''}</svg>
      ${n < 2 ? '<button id="plWait" style="margin-top:10px">Sprinkle salt</button>' : nx('Where did the water come from?')}`); if ($('plWait')) $('plWait').onclick = () => { n++; sfx('click'); draw(); }; on(done); };
    draw(); },
  candy(done) { const R = { slow:['Leave it by the warm oven', 'Hours later, the tray is full of <b>cloudy white crystals</b>, like rock candy.'], fast:['Pour it on the cold stone', 'It hardens in a minute into a <b>clear sheet, like glass.</b> You can see the seeds right through it.'] }, tried = {};
    const draw = (k) => { if (k) tried[k] = 1; pc(K, '2 ways to cool sugar', `<p>${k ? R[k][1] : 'The melted sugar is ready. <b>Try cooling it 2 ways.</b>'}</p><div class="chips">${Object.entries(R).map(([id, r]) => `<button data-cd="${id}" class="${tried[id] ? 'ghost' : ''}">${r[0]}</button>`).join('')}</div>${tried.slow && tried.fast ? nx('Same sugar. Why so different?') : ''}`); each('[data-cd]', b => { sfx('click'); draw(b.dataset.cd); }); on(done); };
    draw(); },
  // ---- festivals ----
  hanukkah(done) { const lit = Array(9).fill(false);
    const draw = (msg) => { const all = lit.every(Boolean); pc('HANUKKAH', 'Light the candles', `<p>${msg || '9 candles. The one in the middle stands taller. <b>Tap a candle to light it.</b>'}</p>
      <div style="display:flex;justify-content:center;align-items:flex-end;gap:5px;margin-top:10px;background:#1d1730;border-radius:14px;padding:14px 8px 10px">${lit.map((on2, i) => `<button data-cn="${i}" aria-label="Candle ${i + 1}" style="margin:0;padding:0;width:26px;height:${i === 4 ? 96 : 76}px;background:none;box-shadow:none;position:relative"><i style="position:absolute;left:8px;bottom:0;width:10px;height:${i === 4 ? 66 : 46}px;background:#7ec8e3;border-radius:3px"></i>${on2 ? `<i style="position:absolute;left:6px;bottom:${i === 4 ? 68 : 48}px;width:14px;height:20px;background:#ffc857;border-radius:50% 50% 50% 50% / 70% 70% 30% 30%;box-shadow:0 0 12px #ffc857"></i>` : ''}</button>`).join('')}</div>${all ? nx('Why 9?') : ''}`);
      each('[data-cn]', b => { const i = +b.dataset.cn; if (lit[i]) return; if (i !== 4 && !lit[4]) { sfx('click'); return draw('That one will not catch. <b>Light the tall middle candle first.</b> It lights all the others.'); } lit[i] = true; chime(i === 4 ? 523 : 600 + i * 40); draw(i === 4 ? '<b>The helper candle is lit.</b> Now use it to light the other 8.' : `<b>${lit.filter(Boolean).length - 1} of 8.</b>`); }); on(done); };
    draw(); },
  diwali(done) { const lit = Array(7).fill(false);
    const draw = () => { const n = lit.filter(Boolean).length, all = n === 7; pc('DIWALI', 'Light the lamps', `<p>${all ? '<b>Every lamp is burning.</b> The whole doorstep glows.' : n ? `<b>${n} of 7.</b> It gets a little brighter with each one.` : 'It is the darkest night of the month. 7 small clay lamps sit along the doorstep. <b>Tap each one to light it.</b>'}</p>
      <div style="display:flex;justify-content:center;gap:6px;margin-top:10px;border-radius:14px;padding:22px 6px 12px;background:rgb(${29 + n * 14},${23 + n * 9},${48 - n * 2})">${lit.map((on2, i) => `<button data-dy="${i}" aria-label="Lamp ${i + 1}" style="margin:0;padding:0;width:34px;height:44px;background:none;box-shadow:none;position:relative"><i style="position:absolute;left:3px;bottom:0;width:28px;height:13px;background:#b5622f;border-radius:0 0 14px 14px"></i>${on2 ? '<i style="position:absolute;left:11px;bottom:13px;width:12px;height:18px;background:#ffc857;border-radius:50% 50% 50% 50% / 70% 70% 30% 30%;box-shadow:0 0 14px #ffc857"></i>' : ''}</button>`).join('')}</div>${all ? nx() : ''}`);
      each('[data-dy]', b => { const i = +b.dataset.dy; if (lit[i]) return; lit[i] = true; chime(520 + i * 60); draw(); }); on(done); };
    draw(); },
  nowruz(done) { const IT = [['🌱', 'Sprouts', 'sabzeh', 1], ['🪞', 'A mirror', 'ayneh', 0], ['🍎', 'An apple', 'sib', 1], ['🧄', 'Garlic', 'sir', 1], ['🐟', 'A goldfish', 'mahi', 0], ['🫙', 'Vinegar', 'serkeh', 1], ['🌶️', 'Sumac spice', 'somaq', 1], ['🕯️', 'A candle', 'sham', 0], ['🍮', 'Sweet pudding', 'samanu', 1], ['🫒', 'Dried oleaster fruit', 'senjed', 1]], pick = new Set();
    const draw = (msg) => { const good = IT.every((x, i) => !!x[3] === pick.has(i)); pc('NOWRUZ', 'Set the table', `<p>${msg || 'Nana\'s table has 10 things on it. The custom is called Haft-sin: 7 things whose Persian names start with the letter S. <b>Tap the 7.</b>'}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px">${IT.map((x, i) => `<button data-nz="${i}" class="${pick.has(i) ? '' : 'ghost'}" style="margin:0;text-align:left">${x[0]} ${x[1]}<br><span class="sub"><i>${x[2]}</i></span></button>`).join('')}</div>${good ? nx() : `<p class="sub" style="margin-top:6px">${pick.size > 7 ? `${pick.size} picked. That is too many. Take ${pick.size - 7} off.` : `${pick.size} of 7 picked.`}</p>`}`);
      each('[data-nz]', b => { const i = +b.dataset.nz; if (pick.has(i)) { pick.delete(i); return draw(); } pick.add(i); sfx('click'); draw(IT[i][3] ? null : `<b>${IT[i][2][0].toUpperCase() + IT[i][2].slice(1)}</b> is on many tables too, but it ${IT[i][2] === 'sham' ? 'starts with the sound "sh", which is a different letter' : `starts with ${IT[i][2][0].toUpperCase()}`}. Tap it again to take it off.`); }); on(done); };
    draw(); },
  muertos(done) { const IT = [['🖼️', 'Her photo', 'So everyone knows who this is for.'], ['🌼', 'Marigolds', 'Bright orange, with a strong smell, to guide her home.'], ['🕯️', 'Candles', '1 small light for each person remembered.'], ['🍞', 'Sweet bread', 'Baked for this day, with a pattern like bones on top.'], ['🍵', 'Her favorite tea', 'Whatever she loved most. For your grandmother, it was mint tea.']], put = [];
    const draw = (msg) => { const all = put.length === IT.length; pc('DIA DE LOS MUERTOS', 'Build the altar', `<p>${msg || 'Nana is building an altar for your grandmother. <b>Tap each thing to set it in place.</b>'}</p>
      <div style="background:#7a3fa0;border-radius:14px;padding:10px;margin-top:8px;min-height:54px;text-align:center;font-size:30px;letter-spacing:6px">${put.map(i => IT[i][0]).join('') || '&nbsp;'}</div>
      <div class="chips" style="margin-top:8px">${IT.map((x, i) => put.includes(i) ? '' : `<button data-mu="${i}">${x[0]} ${x[1]}</button>`).join('')}</div>${all ? nx() : ''}`);
      each('[data-mu]', b => { const i = +b.dataset.mu; put.push(i); chime(500 + put.length * 70); draw(`<b>${IT[i][1]}.</b> ${IT[i][2]}`); }); on(done); };
    draw(); },
  passover(done) { const STEPS = ['Mix flour and water', 'Roll it flat', 'Poke rows of holes', 'Into the oven']; let step = 0, left = 18, iv = null, state = 'ready';
    const stop = () => { if (iv) { clearInterval(iv); iv = null; } };
    const draw = () => { pc('PASSOVER', 'Bake it before it rises', `<p>${state === 'ready' ? 'By tradition, this bread must go from mixing to fully baked in under 18 minutes. Any longer and the dough starts to rise. <b>Here, 1 second is 1 minute. Tap Start, then do each step.</b>' : state === 'late' ? '<b>Too slow.</b> The dough sat too long and started to puff. Nana: "No harm done, dear. We start again."' : state === 'won' ? `<b>Baked, with ${left} minutes to spare.</b> Flat, crisp, and dotted with holes.` : `<b>Step ${step + 1} of ${STEPS.length}.</b>`}</p>
      <p style="text-align:center;font-size:30px;font-weight:800;margin:6px 0" id="plClock">${state === 'ready' ? '18' : left} min</p>
      ${state === 'run' ? `<button id="plStep">${STEPS[step]}</button>` : state === 'won' ? nx('Why no time to rise?') : `<button id="plStart">${state === 'late' ? 'Start again' : 'Start'}</button>`}`);
      cardCleanup = stop;
      if ($('plStart')) $('plStart').onclick = () => { step = 0; left = 18; state = 'run'; draw(); iv = setInterval(() => { left--; const c = $('plClock'); if (c) c.textContent = left + ' min'; if (left <= 0) { stop(); state = 'late'; sfx('click'); draw(); } }, 1000); };
      if ($('plStep')) $('plStep').onclick = () => { sfx('click'); step++; if (step >= STEPS.length) { stop(); state = 'won'; chime(988); } draw(); if (state === 'run') cardCleanup = stop; }; on(done); };
    draw(); },
  eid(done) { const spot = 7; let found = false, tries = 0;
    const draw = (msg) => { pc('EID AL-FITR', 'Find the new moon', `<p>${msg || 'The sun has just set. Somewhere low in the sky is the thinnest sliver of a moon. <b>Tap where you see it.</b>'}</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:8px;border-radius:14px;overflow:hidden;background:linear-gradient(#1b2450,#6a4c8c 70%,#f0a070)">${Array.from({ length:12 }, (_, i) => `<button data-sk="${i}" aria-label="Part of the sky" style="margin:0;padding:0;height:52px;background:none;box-shadow:none;border-radius:0;font-size:${i === spot ? 22 : 10}px;color:#fff;opacity:${i === spot ? (found ? 1 : .32) : .7}">${i === spot ? '☽' : ['·', '', '·', '', '', '·', '', '', '·', '', '', ''][i]}</button>`).join('')}</div>${found ? nx() : ''}`);
      each('[data-sk]', b => { if (found) return; tries++; if (+b.dataset.sk === spot) { found = true; [784, 988, 1175].forEach((f, i) => setTimeout(() => chime(f), i * 130)); return draw(`<b>There it is.</b> ${tries > 1 ? `It took you ${tries} looks. ` : ''}It is so thin and so low that people gather outside to help each other spot it.`); } sfx('click'); draw('Only sky there. <b>Look lower, where the light is fading.</b>'); }); on(done); };
    draw(); },
  }; })();
function showAha(id, onClose) {
  lean('scholar', 2);
  let bonus = false;
  if (!S.aha.includes(id)) { S.aha.push(id); if (S.mode === 'scholar') { S.coins += 30; bonus = true; } }
  [523,659,784].forEach((f,i)=>setTimeout(()=>chime(f),i*140));
  showCard(ahaHtml(id) + (bonus ? '<p class="sub" style="margin-top:10px"><b>+30 coins.</b> Scholar bonus.</p>' : ''), 'Save to Collections', onClose); drawRoom(); drawHud(); save();
}
function showRecall(id, onClose) {
  const r = RECALL[id], a = r.aha || id;
  if (!S.used.includes(a)) S.used.push(a);
  [659,784,988,1319].forEach((f,i)=>setTimeout(()=>chime(f),i*120));
  showCard(`<div class="kicker">${AHA[a].title.toUpperCase()}, AGAIN</div><h2>${r.title}</h2><p>${r.text}</p>`, 'Nice!', onClose); save();
}
function lessonHtml(a) {
  return `<div class="kicker">${a.kicker}</div><h2>${a.title}</h2>${a.did ? `<p>${a.did}</p>` : ''}<p class="gap">${a.real}</p><p class="gap">${a.today}</p>`;
}
function collectionList(title, kicker, items, have, show) {
  showCard(`<div class="kicker">${kicker}</div><h2>${title}</h2><div class="jlist">${items.filter(x => have.includes(x.id)).map(x => `<button data-cl="${x.id}">${x.name || x.title}</button>`).join('')}${items.some(x => !have.includes(x.id)) ? `<button class="locked">${items.filter(x => !have.includes(x.id)).length} not found yet</button>` : ''}</div>`, 'Back', openJournal);
  document.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => show(items.find(x => x.id === b.dataset.cl)));
}
let quietFind = false; // the fishing reveal shows its own fact
function noteFind(k) {
  if (S.found.includes(k)) return;
  S.found.push(k); if (quietFind) return;
  const f = FINDS[k]; if (!f) return; // dishes and quest items have their own cards
  const name = ITEMS[k]?.name || FURN[k]?.name || k;
  const el = $('discover'), first = f.fact.split(/(?<=[.!?]) (?=[A-Z0-9])/)[0], more = first.length < f.fact.length || f.see;
  el.onclick = () => { el.classList.remove('show'); if (more) showCard(`<div class="kicker">FIRST FIND</div><h2>${name}</h2><h4>In real life</h4><p>${f.fact}</p>${f.see ? `<h4>See it for yourself</h4><p>${f.see}</p>` : ''}`, 'Okay'); };
  el.innerHTML = `<b>FIRST FIND! ${S.found.filter(x => FINDS[x]).length} of ${Object.keys(FINDS).length} found</b><strong>${name}</strong><span>${first}${more ? ' <u>Tap to read more.</u>' : ''}</span>`;
  el.classList.add('show'); chime(1047); setTimeout(() => chime(1319), 120);
  clearTimeout(noteFind.t); noteFind.t = setTimeout(() => el.classList.remove('show'), Math.max(6000, 2500 + first.length * 70));
}
function collTick() { const first = !S.collPaid; S.collPaid = S.collPaid || {};
  for (const c of collectionCats()) { const n = c.ids.filter(c.has).length, tiers = [...new Set([5, 10, c.ids.length])].filter(t => t <= c.ids.length).sort((a, b) => a - b), paid = S.collPaid[c.name] || 0;
    if (first) { S.collPaid[c.name] = tiers.filter(t => n >= t).length; continue; } // older games start from where they are
    if (paid < tiers.length && n >= tiers[paid]) { S.collPaid[c.name] = paid + 1; const full = tiers[paid] === c.ids.length, pay = full ? 200 : paid ? 80 : 40; S.coins += pay; save(); drawHud(); sfx('coin'); chime(1047);
      toast(full ? `Collections: you found every one of the ${c.name}! +${pay} coins` : `Collections: ${tiers[paid]} ${c.name} found! +${pay} coins`); return; } }
  if (first) save(); }
function collectionCats() { return allCats().filter(c => !({ Bugs:'butterflies', Specialties:'specialty', Heirlooms:'heirloom' })[c.name] || featureOn({ Bugs:'butterflies', Specialties:'specialty', Heirlooms:'heirloom' }[c.name])); }
function allCats() {
  const month = m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];
  const itemCard = (k, kick) => () => showCard(`<div class="kicker">${kick}</div><h2>${ITEMS[k]?.name || FURN[k]?.name}</h2><h4>In real life</h4><p>${FINDS[k].fact}</p>${FINDS[k].see ? `<h4>See it for yourself</h4><p>${FINDS[k].see}</p>` : ''}<h4>In Sky Garden</h4><p>${FINDS[k].hint}${CROPS[k] ? ` It grows in ${CROPS[k].days} days here, and sells for ${CROPS[k].sell} coins.` : ITEMS[k] ? ` It sells for ${ITEMS[k].sell} coins.` : ''}${S.fishLog?.[k] ? ` Your biggest: ${S.fishLog[k].best} cm.` : ''}</p>`, 'Back', () => openCategory(kick));
  return [
    { name:'Crops', ids:Object.keys(CROPS), has:k => S.found.includes(k), label:k => CROPS[k].name, open:k => itemCard(k, 'Crops'), hint:k => FINDS[k].hint },
    { name:'Fruit', ids:['apple','peach'], has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => itemCard(k, 'Fruit'), hint:k => FINDS[k].hint },
    { name:'Fish', ids:['minnow','trout','koi','sunfish','frostchar','guppy','lanterneel','puffer','moonray'], has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => itemCard(k, 'Fish'), hint:k => FINDS[k].hint },
    { name:'Specialties', ids:SPECIALTIES.map(x => x.id), has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => () => showCard(`<div class="kicker">SPECIALTIES</div><h2>${ITEMS[k].name}</h2><h4>In real life</h4><p>${FINDS[k].fact}</p><p>${TRADE_FACT}</p><h4>In Sky Garden</h4><p>${k === S.specialty ? 'This is your island\'s specialty.' : 'This grows on a friend\'s island.'} It sells for ${HOME_PRICE * AWAY_MULT} coins on any island where it does not grow.</p>`, 'Back', () => openCategory('Specialties')), hint:() => 'Trade with friends. Each island grows a different one.' },
    { name:'Heirlooms', ids:S.found.filter(isHeirloom), has:() => true, label:k => `${registerHeirloom(k) && ITEMS[k].name} (${codeOfHeirloom(k) === myCode ? 'yours' : 'island ' + codeOfHeirloom(k)})`, open:k => () => showCard(`<div class="kicker">HEIRLOOM FLOWERS</div><h2>${ITEMS[k].name}</h2><p>Only grows on island ${codeOfHeirloom(k)}.</p><h4>In real life</h4><p>Gardeners breed and name their own flower and vegetable varieties. In the 1930s one man bred the Mortgage Lifter tomato and paid off his house selling the seedlings.</p>`, 'Back', () => openCategory('Heirlooms')), hint:() => '' },
    { name:'Bugs', ids:[...BUTTERFLIES.map(b => b.id), ...INSECTS.map(b => b.id)], has:k => (S.bugs || []).includes(k), label:k => (BUTTERFLIES.find(b => b.id === k) || INSECTS.find(b => b.id === k)).name, open:k => () => { const b = BUTTERFLIES.find(x => x.id === k) || INSECTS.find(x => x.id === k); showCard(`<div class="kicker">BUGS</div><h2>${icon(k)} ${b.name}</h2><h4>In real life</h4><p>${b.fact}</p>`, 'Back', () => openCategory('Bugs')); }, hint:k => { const b = INSECTS.find(x => x.id === k); return b ? `Look ${ { air:'in the air', flower:'on flowers', ground:'on the ground', tree:'on tree trunks' }[b.where] } in ${b.seasons.map(x => SEASONS[x].toLowerCase()).join(' or ')}${b.time === 'night' ? ', at night' : b.time === 'day' ? ', in the day' : ''}.` : 'Tap a butterfly when you see one flying.'; } },
    { name:'Furniture', ids:Object.keys(FURN), has:k => S.found.includes(k), label:k => FURN[k].name, open:k => itemCard(k, 'Furniture'), hint:k => FINDS[k].hint },
    { name:'Memories', ids:AHA_ORDER, has:k => S.aha.includes(k), label:k => AHA[k].title + (S.used.includes(k) ? ' ★' : ''), open:k => () => showCard(ahaHtml(k), 'Back', () => openCategory('Memories')), hint:() => 'Find more by digging up sparkles, finishing chapters, and joining festivals.' },
    { name:'Dishes', ids:RECIPES.map(r => r.id), has:k => S.cooked.includes(k), label:k => RECIPES.find(r => r.id === k).name, open:k => () => showCard(lessonHtml(RECIPES.find(r => r.id === k).aha), 'Back', () => openCategory('Dishes')), how:'Cook the rest at the Bakery.', hint:k => `Needs ${Object.entries(RECIPES.find(r => r.id === k).needs).map(([i,n]) => `${n} ${ITEMS[i].name}`).join(' and ')}.` },
    { name:'Star Chart', ids:CONSTELLATIONS.map(c => c.id), has:k => S.charted.includes(k), label:k => CONSTELLATIONS.find(c => c.id === k).name, open:k => () => showCard(starHtml(CONSTELLATIONS.find(c => c.id === k)), 'Back', () => openCategory('Star Chart')), how:'Chart the rest at the Observatory after 8 PM. Each one is in the sky only in the months shown.', hint:k => `${CONSTELLATIONS.find(c => c.id === k).months.map(month).join(', ')}.` },
    { name:'Library Books', ids:BOOKS.map(b => b.id), has:k => S.read.includes(k), label:k => BOOKS.find(b => b.id === k).title, open:k => () => showCard(lessonHtml({ kicker:'THE LIBRARY', ...BOOKS.find(b => b.id === k) }), 'Back', () => openCategory('Library Books')), hint:() => 'Build the Library. A new book arrives every week.' },
    { name:'Songs', ids:[...SONGS.map(x => x.id), 'penta'], has:k => k === 'penta' ? S.penta : S.songs.includes(k), label:k => k === 'penta' ? 'The 5-Note Scale' : SONGS.find(x => x.id === k).name, open:k => () => showCard(lessonHtml(k === 'penta' ? PENTA_AHA : SONGS.find(x => x.id === k).aha), 'Back', () => openCategory('Songs')), hint:() => 'Build the Music Hall and play the xylophone.' },
    { name:'Know-how', ids:KNOWHOW.map(x => x.id), has:k => (S.know || []).includes(k), label:k => { const x = KNOWHOW.find(y => y.id === k); return `${x.icon} ${x.title}`; }, open:k => () => showCard(knowHtml(KNOWHOW.find(y => y.id === k)), 'Back', () => openCategory('Know-how')), hint:() => 'You pick these up by doing things, not by looking for them.' },
    { name:'Sayings', ids:SAYINGS.map(x => x.id), has:k => S.sayings.includes(k), label:k => SAYINGS.find(x => x.id === k).text.slice(0, 44) + '...', open:k => () => showCard(sayingHtml(SAYINGS.find(x => x.id === k)), 'Back', () => openCategory('Sayings')), hint:() => 'Build the Temple Garden. Sage shares a new saying each day.' },
  ];
}
function openCategory(name) {
  const c = collectionCats().find(x => x.name === name), got = c.ids.filter(c.has).length;
  const miss = c.ids.filter(k => !c.has(k)), hints = {}; miss.forEach(k => { const h = c.hint(k); hints[h] = (hints[h] || 0) + 1; }); // missing ones that share a hint show as one row with a count
  showCard(`<div class="kicker">COLLECTIONS</div><h2>${name}: ${got} of ${c.ids.length}</h2>${c.how && miss.length ? `<p>${c.how}</p>` : ''}<div class="jlist">${c.ids.filter(c.has).map(k => 1 ? `<button data-ck="${k}">${name === 'Bugs' ? icon(k) + ' ' : ['Crops','Fruit','Fish','Furniture','Dishes'].includes(name) ? icon(k, ITEMS[k]?.kind) + ' ' : ''}${c.label(k)}</button>` : '').join('')}${Object.entries(hints).map(([h, n]) => `<button class="locked"><span class="sub">${n > 1 ? `<b>${n} more.</b> ` : ''}${h}</span></button>`).join('')}</div>`, 'Back', openJournal);
  document.querySelectorAll('[data-ck]').forEach(b => b.onclick = c.open(b.dataset.ck));
}
const MONTH_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
if (!S.startedAt && !VISIT) S.startedAt = dayKey(today());
function yearMark() { if (S.birthday) return S.birthday; const st = new Date((S.startedAt || dayKey(today())) + 'T12:00'); return { m:st.getMonth()+1, d:st.getDate() }; }
function islandYear() { // Year 1 from the start; each birthday (or start anniversary) after that begins a new year
  const mk = yearMark(), st = new Date((S.startedAt || dayKey(today())) + 'T00:00'), now = today(); let n = 1;
  for (let y = st.getFullYear(); y <= now.getFullYear(); y++) { const b = new Date(y, mk.m-1, mk.d); if (b > st && b <= now) n++; }
  return n;
}
function ageBand() {
  if (S.founder && !(S.trust && S.trust.revoked)) return 'adult'; // testers the Creator invites are all adults, whatever birthday they entered
  if (!S.birthday || !S.birthday.y) return 'kid'; // no birthday given: kid-safe settings
  const d = today(), b = S.birthday; let age = d.getFullYear() - b.y; if (d.getMonth()+1 < b.m || (d.getMonth()+1 === b.m && d.getDate() < b.d)) age--;
  return age < 13 ? 'kid' : age < 18 ? 'teen' : 'adult';
}
const kidSafe = () => ageBand() === 'kid';
const isPartyDay = () => { const mk = yearMark(), d = today(); return d.getMonth()+1 === mk.m && d.getDate() === mk.d && dayKey(d) !== S.startedAt; };
function birthdayPicker(done, fromNana) {
  const draw = (msg = '') => {
    showCard(`<div class="kicker">${fromNana ? 'NANA GALE ASKS' : 'YOUR BIRTHDAY'}</div><h2>${fromNana ? '"When is your birthday, dear?"' : 'When is your birthday?'}</h2>
      <p>On your birthday the whole sky throws you a party, and your island starts a new year.</p>
      <div class="chips" style="margin-top:10px"><select id="bdM" style="font:18px 'Baloo 2',sans-serif;border-radius:12px;padding:6px">${MONTH_LONG.map((m,i) => `<option value="${i+1}">${m}</option>`).join('')}</select>
      <select id="bdD" style="font:18px 'Baloo 2',sans-serif;border-radius:12px;padding:6px">${Array.from({length:31}, (_,i) => `<option>${i+1}</option>`).join('')}</select>
      <select id="bdY" style="font:18px 'Baloo 2',sans-serif;border-radius:12px;padding:6px"><option value="">Year</option>${Array.from({length:100}, (_,i) => today().getFullYear() - i).map(y => `<option>${y}</option>`).join('')}</select></div>
      <p id="bdMsg" style="font-weight:700;min-height:20px;margin-top:8px">${msg}</p>
      <button id="bdOk">Save my birthday</button> <button id="bdSkip" class="ghost">Skip</button>`, null);
    if (S.birthday) { $('bdM').value = S.birthday.m; $('bdD').value = S.birthday.d; if (S.birthday.y) $('bdY').value = S.birthday.y; }
    $('bdOk').onclick = () => { const m = +$('bdM').value, d = +$('bdD').value, y = +$('bdY').value;
      if (!y) return draw('Pick the year too.');
      if (d > new Date(2024, m, 0).getDate()) return draw(`${MONTH_LONG[m-1]} only has ${new Date(2024, m, 0).getDate()} days.`);
      S.birthday = { m, d, y }; S.ageBand = ageBand(); S.birthdayAsked = true; save(); hideCard(); toast(`Birthday saved: ${MONTH_LONG[m-1]} ${d}.`); done && done(); };
    $('bdSkip').onclick = () => { S.birthdayAsked = true; save(); hideCard(); S.ageBand = 'kid'; save(); toast('Skipped. To add your birthday later, tap Bag, then Settings.'); done && done(); };
  };
  draw();
}
const balloons = new THREE.Group(); balloons.visible = false; scene.add(balloons);
balloons.add(mesh(new THREE.CylinderGeometry(.05,.06,1.1,6), mat(0x9b6b4a), -1.7, .55, -3.8)); // the post the bunch is tied to, in a clear spot by the hut
[[-2.2,-3.8],[-1.2,-3.8],[-1.7,-3.3],[-1.7,-4.3],[-2.1,-3.35],[-1.3,-4.25]].forEach(([x,z], i) => {
  const c = [0xff8fa3,0x7ec8e3,0xffc857,0x8fdc8a,0xc9b6ff,0xff9a3c][i];
  const b = mesh(sph(.26), new THREE.MeshStandardMaterial({ color:c, roughness:.3 }), x, 2.6 + (i%2)*.3, z); b.scale.y = 1.2; balloons.add(b);
  deco(b, () => { if (b.userData.fly) return; b.userData.fly = 1; tone(700, { to:1400, dur:.4, vol:.05 }); toast('Whoosh! The balloon floats up into the sky.'); });
  balloons.add(mesh(new THREE.CylinderGeometry(.008,.008,2.4,4), mat(0xffffff), x, 1.3 + (i%2)*.15, z)); });
function birthdayParty() {
  S.lastParty = dayKey(today());
  const yr = islandYear(), met = Object.keys(NEIGHBORS).filter(id => (S.hearts[id] || 0) > 0 && npcs[id]);
  const giftsFrom = met.map(id => NEIGHBORS[id].name.replace(/^Professor /, 'Professor ')), coins = 25 * Math.max(1, met.length);
  S.coins += coins; S.furn.cake = (S.furn.cake || 0) + 1; S.partyHat = true;
  const ys = S.yearStats || { aha:0, found:0, built:0 };
  const review = { aha:S.aha.length - ys.aha, found:(S.found || []).length - ys.found, built:S.built.length - ys.built };
  S.yearStats = { aha:S.aha.length, found:(S.found || []).length, built:S.built.length }; save(); drawHud();
  [523,659,784,1047,784,1047,1319].forEach((f,i) => setTimeout(() => chime(f), i*170)); burst(house.position, 0xff8fa3, 30);
  const yearCard = () => showCard(`<div class="kicker">YEAR ${yr} BEGINS TODAY</div><h2>Your year ${yr - 1} in review</h2>
    <div class="jlist"><button>${review.aha} memories brought back</button><button>${review.found} new things found</button><button>${review.built} buildings rebuilt</button></div>
    <p style="margin-top:10px">The cake is in your Bag. Place it inside your home.</p>`, 'Thank you!');
  showCard(`<div class="kicker">YEAR ${yr} BEGINS TODAY</div><h2>${S.birthday ? `Happy birthday, ${S.name || 'friend'}!` : `Happy Island Day, ${S.name || 'friend'}!`}</h2>
    <p>${S.birthday ? 'The whole sky came to celebrate you.' : '1 more year on your island. The whole sky came to celebrate.'}</p>
    <h4>Presents</h4><div class="jlist">
      ${giftsFrom.length ? `<button>${coins} coins from ${giftsFrom.join(', ')}</button>` : `<button>${coins} coins from the sky</button>`}
      <button>A Birthday Cake for your home</button><button id="bdHat">A party hat <span class="sub">Tap to wear it. Pick Hat, then Party hat.</span></button></div>`, 'Next', yearCard);
  $('bdHat').onclick = () => openLookEditor(yearCard);
}
function openJournal() {
  const cats = collectionCats(), tot = cats.reduce((a, c) => a + c.ids.length, 0), got = cats.reduce((a, c) => a + c.ids.filter(c.has).length, 0);
  // the list is drawn under a few labels; a group not named here lands under the last label, so none can go missing
  const groups = [['Things you grow and catch', ['Crops', 'Fruit', 'Fish', 'Specialties', 'Heirlooms', 'Bugs']], ['Home and kitchen', ['Furniture', 'Dishes']], ['Sky and music', ['Star Chart', 'Songs']], ['Things you learn', null]], grouped = groups.flatMap(g => g[1] || []);
  showCard(`<div class="kicker">COLLECTIONS: YEAR ${islandYear()} ON YOUR ISLAND</div><h2>${got} of ${tot} found</h2><p>Everything you have discovered in the sky. Tap a group to see what you have and what is still out there.</p>
    <div style="height:10px;border-radius:99px;background:#eadfd0;margin-top:10px;overflow:hidden"><div style="height:100%;width:${Math.round(got/tot*100)}%;background:#ffc857"></div></div>
    <button id="friendsBtn" class="ghost" style="margin-top:10px">What your neighbors like</button> ${featureOn('journey') ? '<button id="storyBtn" class="ghost" style="margin-top:10px">Your story</button>' : ''}
    <div class="jlist">${groups.map(([label, names]) => { const rows = cats.filter(c => names ? names.includes(c.name) : !grouped.includes(c.name)); return rows.length ? `<h4>${label}</h4>` + rows.map(c => { const n = c.ids.filter(c.has).length; return `<button data-cat="${c.name}">${c.name} <span class="sub">${n === c.ids.length ? `all ${n} found` : `${n} of ${c.ids.length} found`}</span></button>`; }).join('') : ''; }).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => openCategory(b.dataset.cat));
  if ($('storyBtn')) $('storyBtn').onclick = openStory;
  $('friendsBtn').onclick = openFriends;
}
function openJournalOld() {
  const items = AHA_ORDER.map(id => S.aha.includes(id) ? `<button data-id="${id}">${AHA[id].title}${S.used.includes(id) ? ' <span class="sub">★ used again</span>' : ''}</button>` : `<button class="locked">Not found yet</button>`).join('');
  showCard(`<div class="kicker">MEMORY JOURNAL</div><h2>${S.aha.length} of ${AHA_ORDER.length} memories</h2><p>Everything you have brought back to the sky.</p><div class="jlist">${S.built.includes('observatory') ? `<button id="starList">Star Chart <span class="sub">${S.charted.length} of ${CONSTELLATIONS.length} charted</span></button>` : ''}${items}</div>`, 'Close');
  if ($('starList')) $('starList').onclick = openStarList;
  const extra = [
    S.built.includes('bakery') && [`Recipes <span class="sub">${S.cooked.length} of ${RECIPES.length}</span>`, () => collectionList('Recipes', "MABEL'S KITCHEN", RECIPES, S.cooked, r => showCard(lessonHtml(r.aha), 'Back', openJournal))],
    S.built.includes('library') && [`Library books <span class="sub">${S.read.length} of ${BOOKS.length}</span>`, () => collectionList('Library books', 'THE LIBRARY', BOOKS, S.read, bk => showCard(lessonHtml({ kicker:'THE LIBRARY', ...bk }), 'Back', openJournal))],
    S.built.includes('musichall') && [`Songs <span class="sub">${S.songs.length + (S.penta ? 1 : 0)} of ${SONGS.length + 1}</span>`, () => collectionList('Songs', "ALLEGRA'S SONGBOOK", [...SONGS, { id:'penta', name:'The 5-Note Scale', aha:PENTA_AHA }], [...S.songs, ...(S.penta ? ['penta'] : [])], so => showCard(lessonHtml(so.aha), 'Back', openJournal))],
    S.built.includes('temple') && [`Sayings <span class="sub">${S.sayings.length} of ${SAYINGS.length}</span>`, () => collectionList('Sayings', 'TEMPLE GARDEN', SAYINGS.map(x => ({ ...x, name:x.text.slice(0, 42) + (x.text.length > 42 ? '...' : '') })), S.sayings, sy => showCard(sayingHtml(sy), 'Back', openJournal))],
  ].filter(Boolean);
  const list = $('card').querySelector('.jlist');
  extra.reverse().forEach(([label, fn]) => { const bt = document.createElement('button'); bt.innerHTML = label; bt.onclick = fn; list.prepend(bt); });
  document.querySelectorAll('.jlist [data-id]').forEach(b => b.onclick = () => showCard(ahaHtml(b.dataset.id), 'Back', openJournal));
}
// --- save codes: move a game to another device without an account ---
async function makeCode() {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let out = bytes, tag = 'SG1';
  if (window.CompressionStream) { out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); tag = 'SG2'; }
  let bin = ''; out.forEach(b => bin += String.fromCharCode(b));
  return `${tag}.${btoa(bin)}`;
}
async function readCode(code) {
  const [tag, body] = code.trim().split('.');
  const bytes = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  const raw = tag === 'SG2' ? new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()) : bytes;
  const data = JSON.parse(new TextDecoder().decode(raw));
  if (typeof data.day !== 'number' || !Array.isArray(data.tiles)) throw new Error('not a save');
  return data;
}
async function openMoveGame(back, tab) {
  const code = await makeCode();
  const ago = cloudState.when ? Math.max(1, Math.round((Date.now() - cloudState.when) / 60000)) : 0;
  const status = cloudState.ok === false ? 'Cloud backup could not connect. It will keep trying while you play.' : cloudState.when ? `Backed up to the cloud ${ago} minute${ago === 1 ? '' : 's'} ago.` : 'Your garden backs up to the cloud automatically while you play.';
  const home = () => openMoveGame(back);
  if (!tab) { showCard(`<div class="kicker">SYNC MY GAME</div><h2>Play on any device</h2><p>${status}</p>
    <div class="jlist"><button id="syGive">Put this game on another device</button><button id="syTake">Load a game from another device</button><button id="syCode">No internet? Use a save code</button></div>
    <p style="font-size:13px;opacity:.7;margin-top:10px">The makers can see anonymous progress from cloud backups, like which chapter a player has reached. No names or emails are collected.</p>`, back ? 'Back' : 'Close', back);
    $('syGive').onclick = () => openMoveGame(back, 'give'); $('syTake').onclick = () => openMoveGame(back, 'take'); $('syCode').onclick = () => openMoveGame(back, 'code'); return; }
  if (tab === 'give') showCard(`<div class="kicker">SYNC MY GAME</div><h2>Your sync key</h2>
    <p style="font:700 20px monospace;letter-spacing:.05em;margin-top:4px;word-break:break-all" id="myKey">${prettyKey(S.syncKey)}</p>
    <button id="copyKey">Copy sync key</button>
    <p style="margin-top:8px">On your other device, open Sky Garden. Tap <b>Sync my game</b>, then <b>Load a game from another device</b>. Enter this key.</p><p>Keep your key private. Anyone who has it can load your garden.</p>
    <p id="keyMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>`, 'Back', home);
  if (tab === 'take') showCard(`<div class="kicker">SYNC MY GAME</div><h2>Enter a sync key</h2>
    <input id="theirKey" placeholder="Type or paste a sync key" autocomplete="off" style="width:100%;margin-top:8px;font:16px monospace;border-radius:12px;border:2px solid #eadfd0;padding:10px">
    <button id="loadKey">Load from cloud</button>
    <p id="keyMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>`, 'Back', home);
  if (tab === 'code') showCard(`<div class="kicker">SYNC MY GAME</div><h2>Use a save code</h2>
    <h4>To move this game</h4><p>Tap Copy code. Send it to yourself in a text or email.</p>
    <textarea id="myCode" readonly rows="3" style="width:100%;margin-top:8px;font:12px monospace;border-radius:12px;border:2px solid #eadfd0;padding:8px">${code}</textarea>
    <button id="copyCode">Copy code</button>
    <h4>To load a game here</h4>
    <textarea id="theirCode" rows="3" placeholder="Paste a save code here" style="width:100%;margin-top:8px;font:12px monospace;border-radius:12px;border:2px solid #eadfd0;padding:8px"></textarea>
    <button id="loadCode">Load</button>
    <p id="codeMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>`, 'Back', home);
  if ($('copyKey')) $('copyKey').onclick = async () => {
    try { await navigator.clipboard.writeText(prettyKey(S.syncKey)); $('keyMsg').textContent = 'Sync key copied. Keep it somewhere safe.'; }
    catch { const r = document.createRange(); r.selectNodeContents($('myKey')); getSelection().removeAllRanges(); getSelection().addRange(r); $('keyMsg').textContent = 'The key is selected. Copy it with your device\'s copy command.'; }
  };
  if ($('loadKey')) $('loadKey').onclick = async () => {
    const key = cleanKey($('theirKey').value);
    if (key.length !== 24) { $('keyMsg').textContent = 'A sync key has 24 letters and numbers. Check that you typed all of it.'; return; }
    if (key === S.syncKey) { $('keyMsg').textContent = 'That is this device\'s own key. Enter it on your other device.'; return; }
    $('keyMsg').textContent = 'Checking the cloud...';
    let found; try { found = await cloudLoad(key); } catch { $('keyMsg').textContent = 'Could not reach the cloud. Check your internet and try again.'; return; }
    if (!found) { $('keyMsg').textContent = 'No garden was found for that key. Check each letter and try again.'; return; }
    const d = found.save;
    $('keyMsg').innerHTML = `Found it: ${d.coins} coins, ${(d.aha||[]).length} ${(d.aha||[]).length === 1 ? 'memory' : 'memories'}. This replaces the game on this device, and from now on both devices share 1 garden. <button id="sureKey" style="margin-top:8px">Yes, use this garden</button>`;
    $('sureKey').onclick = () => { d.syncKey = key; d.savedAt = found.updated; try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch {} location.reload(); };
  };
  if ($('copyCode')) $('copyCode').onclick = async () => {
    try { await navigator.clipboard.writeText(code); $('codeMsg').textContent = 'Copied! Now send it to yourself.'; }
    catch { $('myCode').select(); $('codeMsg').textContent = 'The code is selected. Copy it with your device\'s copy command.'; }
  };
  if ($('loadCode')) $('loadCode').onclick = async () => {
    const txt = $('theirCode').value;
    if (!txt.trim()) { $('codeMsg').textContent = 'Paste a save code in the box first.'; return; }
    let data; try { data = await readCode(txt); } catch { $('codeMsg').textContent = 'That code did not work. Make sure you copied the whole thing.'; return; }
    $('codeMsg').innerHTML = `This replaces the game on this device with the one from the code (${SEASONS[realSeason(today(), data.south)]}, ${data.coins} coins, ${(data.aha||[]).length} ${(data.aha||[]).length === 1 ? 'memory' : 'memories'}). <button id="sureLoad" style="margin-top:8px">Yes, replace it</button>`;
    $('sureLoad').onclick = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {} location.reload(); };
  };
}
// what each item is for, in plain words
function itemUse(k) {
  const it = ITEMS[k], uses = [];
  if (it.kind === 'material') {
    CRAFTS.forEach(c => { if (c.needs[k] && (LIMITS_ON || !/^bag\d$/.test(c.id))) uses.push(c.name); });
    if (k === 'clay') uses.push('bricks and pots in the kiln'); if (k === 'log') uses.push('kiln fuel');
    if (k === 'copper' || k === 'tin') uses.push('bronze in the furnace'); if (k === 'brick' || k === 'stone' || k === 'log') uses.push('building pieces');
    return uses.length ? `Used for: ${[...new Set(uses)].join(', ')}.` : 'Used for building.';
  }
  if (it.kind === 'specialty') return k === S.specialty ? `Your island's specialty. It sells for ${HOME_PRICE} here, but ${HOME_PRICE * AWAY_MULT} on a friend's island. Gift it to friends and ask for theirs.` : `From another island. It sells for ${HOME_PRICE * AWAY_MULT} here, because it does not grow on your island.`;
  if (it.kind === 'heirloom') { const c = codeOfHeirloom(k); return c === myCode ? 'Your own heirloom flower. It only grows on your island. Give 1 to a friend so they have 1 too.' : `A one-of-a-kind flower from island ${c}. It only grows there.`; }
  RECIPES.forEach(r => { if (r.needs[k]) uses.push(r.name); });
  return `Sells for ${it.sell} each.${uses.length ? ` Cook into: ${uses.join(', ')}.` : ''}`;
}
function openBag() {
  const GROUPS = [['bug','Bugs'],['specialty','Specialties'],['heirloom','Heirlooms'],['crop','Crops'],['fruit','Fruit'],['fish','Fish'],['dish','Dishes'],['material','Materials'],['quest','Special']];
  const tile = (k, n, name, sub) => `<button class="itile" data-it="${k}" title="${name}"><span class="ic">${icon(k, ITEMS[k]?.kind)}</span><b>${n}</b><small>${name}</small></button>`;
  const goods = GROUPS.map(([kind, label]) => { const list = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && ITEMS[k].kind === kind);
    return list.length ? `<h4>${label}</h4><div class="igrid">${list.map(([k,n]) => tile(k, n, ITEMS[k].name)).join('')}</div>` : ''; }).join('');
  const furn = Object.entries(S.furn).filter(([,n]) => n > 0).map(([k,n]) => `<button class="itile" data-fu="${k}"><span class="ic">${icon(k)}</span><b>${n}</b><small>${FURN[k].name}</small></button>`).join('');
  showCard(`${founderOn() ? `<div class="founder">✦ ${keeperLevel() >= 3 ? 'Elder Keeper' : keeperLevel() >= 2 ? 'Keeper' : 'Founding Gardener'}</div>` : ''}<h2>Your bag</h2>${LIMITS_ON ? spaceMeter(slotsIn(S.bag), packCap(), "Backpack") : ""}
    ${goods || '<p>Nothing yet. Pick crops and fruit, or catch fish.</p>'}
    ${(S.products || []).length ? `<h4>Products</h4><div class="igrid">${S.products.map((p, i) => `<button class="itile" data-pr="${i}">${productSwatch(p, 34)}<small>${productName(p)}</small></button>`).join('')}</div>` : ''}
    <h4>Furniture</h4>${furn ? `<div class="igrid">${furn}</div>` : '<p>None yet. Pip sells furniture.</p>'}
    <p id="itInfo" class="itinfo">Tap an item to see what it is for.</p>
    ${slotsIn(S.bag) ? '' : '<h4>Tip</h4><p>Sell crops, fruit, and fish in the crate by your garden. Place furniture inside your home.</p>'}
    ${(founderOn() && (DEV_OK || (S.trust && S.trust.level >= 4)) && !paused('testisland')) || TESTSLOT ? `<button id="islandBtn" class="ghost">${TESTSLOT ? '🧪 Back to my island' : '🧪 Go to my test island'}</button> ` : ''}${founderOn() && !VISIT ? '<button id="giftBtn" class="ghost">🎁 Founder gifts</button> ' : ''}<button id="setBtn" class="ghost">⚙ Settings</button>`, 'Close');
  document.querySelectorAll('[data-it]').forEach(b => b.onclick = () => { const k = b.dataset.it; $('itInfo').innerHTML = `<b>${icon(k, ITEMS[k].kind)} ${ITEMS[k].name}</b>. ${itemUse(k)}`; });
  document.querySelectorAll('[data-fu]').forEach(b => b.onclick = () => { const k = b.dataset.fu, p = S.placed.filter(x => x === k).length; $('itInfo').innerHTML = `<b>${icon(k)} ${FURN[k].name}</b>. ${p ? `${p} in your home.` : 'Not placed yet. Place it inside your home.'}`; });
  document.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => openProduct(S.products[+b.dataset.pr], openBag));
  if ($('islandBtn')) $('islandBtn').onclick = switchIsland;
  $('setBtn').onclick = openSettings; if ($('giftBtn')) $('giftBtn').onclick = () => openFounderGifts(openBag);
}
// settings: how you look, your birthday, your island, tester code, and moving your game to another device
function openSettings() {
  showCard(`<div class="kicker">SETTINGS</div><h2>You and your game</h2><div class="jlist"><button id="sndBtn">Sound and music</button><button id="lookBtn" >Change my look</button> ${S.founder || VISIT ? '' : '<button id="codeBtn" >I have a tester code</button>'} ${featureOn('switchIsle') ? `<button id="modeBtn" >Island: ${S.mode ? MODES.find(m => m.id === S.mode).name : 'Classic'}</button>` : ''} <button id="bdBtn" >${S.birthday ? `Birthday: ${MONTH_LONG[S.birthday.m-1]} ${S.birthday.d}` : 'Add my birthday'}</button> <button id="moveBtn" >Sync my game to another device</button><button id="gfxBtn">Graphics: ${lowGfx ? 'low (smoother on older phones)' : 'full'}</button>${canFiles() ? `<button id="filesBtn">Save files (File ${FILE_IDS.indexOf(fileNow) + 1})</button>` : ''}</div>`, 'Back', openBag);
  if ($('filesBtn')) $('filesBtn').onclick = () => openFiles(openSettings);
  $('gfxBtn').onclick = () => { setLowGfx(!lowGfx); openSettings(); };
  $('sndBtn').onclick = openSound;
  $('lookBtn').onclick = () => openLookEditor(openSettings);
  if ($('codeBtn')) $('codeBtn').onclick = testerCodeCard;
  if ($('modeBtn')) $('modeBtn').onclick = () => { setupCam = true; $('veil').classList.add('setup'); document.body.classList.add('in-setup'); modePicker(() => { endSetup(); openSettings(); }, { switching:true }); };
  $('bdBtn').onclick = () => birthdayPicker(openSettings);
  $('moveBtn').onclick = () => openMoveGame(openSettings);
}
function openSound() {
  const row = (k, l, d) => `<h4>${l}: <span data-vl="${k}">${Math.round(VOL[k] * 100)}</span>%</h4><p class="sub">${d}</p><input type="range" min="0" max="100" step="5" value="${Math.round(VOL[k] * 100)}" data-vol="${k}" aria-label="${l} volume" style="width:100%;height:34px;accent-color:#e8a33d">`;
  showCard(`<div class="kicker">SETTINGS</div><h2>Sound and music</h2><button id="sndAll" class="${muted ? '' : 'ghost'}">${muted ? '🔇 All sound is off. Tap to turn it on.' : '🔊 All sound is on. Tap to turn it off.'}</button>
    ${row('music', '🎵 Music', 'The slow, soft chords in the background.')}${row('sfx', '🔔 Sound effects', 'Taps, coins, chimes, bells, and birds.')}${row('nature', '🍃 Wind and rain', 'The steady whoosh of wind, and the rain.')}
    <p class="sub" style="margin-top:10px">Slide left for quieter and right for louder. All the way left turns it off.</p>`, 'Back', openSettings);
  $('sndAll').onclick = () => { muteBtn.click(); openSound(); };
  document.querySelectorAll('[data-vol]').forEach(r => { const k = r.dataset.vol;
    r.oninput = () => { VOL[k] = +r.value / 100; document.querySelector(`[data-vl="${k}"]`).textContent = r.value; applyVol(); try { localStorage.setItem('sg.vol', JSON.stringify(VOL)); } catch {} };
    r.onchange = () => { if (muted) return toast('All sound is off. Tap the button at the top to turn it on.'); if (k === 'sfx') sfx('coin'); if (k === 'music') [174.6, 220, 261.6, 329.6].forEach((f, i) => tone(f, { t:i * .09, dur:3, vol:.018, attack:.5, bus:musicBus })); }; });
}
$('journalBtn').onclick = openJournal;
$('bagBtn').onclick = openBag;
$('buildBtn').onclick = () => setBuildMode(!buildMode);
// --- daily goals: three small tasks each morning ---
const GOAL_TYPES = {
  water: n => `Water ${n} plants`, pick: n => `Pick ${n} crops`, sell: n => `Earn ${n} coins from selling`,
  talk: n => `Talk to ${n} neighbors`, gift: () => 'Give someone a gift', fish: n => `Catch ${n} fish`, fruit: n => `Pick ${n} fruits`,
  plant: n => `Plant ${n} seeds`, dig: () => 'Dig up a gold sparkle', chop: n => `Chop ${n} trees`, mine: n => `Break ${n} rocks`,
  wish: () => 'Make a wish at the fountain', sit: () => 'Sit on a bench in the Town Square', ask: () => 'Bring a neighbor what they asked for (see the notice board)',
};
// know-how: count what you do; after a few times, show the real skill you've been practicing (one a day, never during the first steps)
function knowHtml(x) { return `<div class="kicker">${x.term}</div><h2>${x.icon} ${x.title}</h2>${x.art ? `<div class="memart">${x.art}</div>` : ''}<p class="sub">${x.did}</p>${x.real.split(/(?<=[.:]) (?=[A-Z0-9])/).map(l => `<p class="gap">${l}</p>`).join('')}<p class="gap sub">${x.today}</p>`; } // one sentence to a line, so each idea is read on its own // no generic headings: the title is the idea, the kicker is its real name
// --- neighbors as experts: help with their craft by trying things. Nothing is explained until after you've done it. ---
function helpDone(id, know, thanks) { const first = !(S.helped || []).includes(id); if (first) { S.helped = [...(S.helped || []), id]; S.hearts[id] = Math.min(10, (S.hearts[id] || 0) + 1); }
  const x = KNOWHOW.find(k => k.id === know), isNew = !(S.know || []).includes(know); if (isNew) { S.know = [...(S.know || []), know]; S.coins += 40; }
  save(); drawHud(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 130));
  // one thing at a time: first what the neighbor says, then the idea on its own card
  const said = id === 'twins' ? thanks.split(/(?=Moss: |Fern: )/).map(l => l.replace(/^(Moss|Fern): /, '<b>$1:</b> ')).join('<br>') : `"${thanks}"`;
  showCard(`<div class="kicker">${NEIGHBORS[id].name.toUpperCase()}</div><p style="font-size:18px;line-height:1.5">${said}</p>`, 'Next', () => showCard(knowHtml(x) + (isNew ? '<p style="margin-top:10px"><b>+40 coins.</b> Saved in Collections, under Know-how.</p>' : ''), 'Huh. Neat.', () => { if (id === 'pip' && S.meetPip) { delete S.meetPip; save(); drawHud(); if ((S.home || 0) < 3) setTimeout(() => openDialog('Pip', "You are the new Keeper! Nana says you have no roof. I slept in my hat for a year. First, gather sticks and stones. Then make an axe at the tree stump workbench by your garden.", [], S.hearts.pip), 500); } })); }
const HELP = {
  pip: { label:'Help price the lemonade', run() { const tried = {}; let best = null;
    const draw = (msg = '"I made 10 cups of lemonade. Each cup cost me 2 coins to make. What should I charge?"') => { const n = Object.keys(tried).length;
      showCard(`<div class="kicker">HELP PIP</div><h2>🍋 Pip's lemonade</h2><p>${msg}</p><h4>Pick a price for 1 cup</h4><div class="chips">${[2, 4, 6, 7, 8, 10, 12].map(p => `<button data-pr="${p}" class="${tried[p] != null ? 'ghost' : ''}">${p} coins${tried[p] != null ? ` (earned ${tried[p]})` : ''}</button>`).join('')}</div>
        ${n >= 3 ? `<button id="hpDone">Go with ${best} coins</button>` : `<p class="sub" style="margin-top:8px">Try a few prices and see what happens.</p>`}`, 'Later');
      document.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => { const p = +b.dataset.pr, sold = Math.max(0, Math.min(10, 12 - p)), earn = sold * (p - 2); tried[p] = earn; if (best == null || earn > tried[best]) best = p; sfx(sold ? 'coin' : 'click');
        draw(`${'🥤'.repeat(sold) || 'Nobody came.'}<br><b>At ${p} coins, ${sold} ${sold === 1 ? 'neighbor' : 'neighbors'} bought a cup.</b> ${p === 2 ? 'Pip sold them all, but earned nothing. Each cup cost 2 coins to make.' : sold === 0 ? 'Too pricey. Pip earned nothing.' : `Pip earned ${earn} coins after paying for the lemons.`}`); });
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('pip', 'pricing', best === 7 ? '7 coins! Best day my cart has ever had.' : `${best} coins it is. That earned more than my guess would have!`); };
    draw(); } },
  nana: { label:'Help plant the old seeds', run() { const on = { corn:false, beans:false, squash:false };
    const tell = () => { const { corn, beans, squash } = on, out = [];
      if (!corn && !beans && !squash) return 'An empty mound of soil. Tap a seed to plant it. Tap again to take it out.';
      if (corn) out.push('🌽 The corn grows tall.' + (beans ? '' : ' It uses up a lot of the soil\'s food, though.'));
      if (beans) out.push(corn ? '🫘 The beans climb right up the corn. Their roots put food back in the soil for next year.' : '🫘 The beans flop on the ground. They have nothing to climb.');
      if (squash) out.push('🎃 The squash spreads big leaves over the soil. The ground under them stays damp.' + (corn || beans ? '' : ' It has the mound to itself.'));
      if (!squash && (corn || beans)) out.push('The bare soil dries out fast in the sun.');
      return out.join('<br>'); };
    const draw = () => { const all = on.corn && on.beans && on.squash;
      showCard(`<div class="kicker">HELP NANA</div><h2>🌱 Grandma's old seeds</h2><p>"Your grandmother planted these 3 in 1 mound. I never asked her why. Try them and see what happens."</p>
        <div class="chips">${[['corn', '🌽 Corn'], ['beans', '🫘 Beans'], ['squash', '🎃 Squash']].map(([k, l]) => `<button data-sd="${k}" class="${on[k] ? '' : 'ghost'}">${on[k] ? '✓ ' : ''}${l}</button>`).join('')}</div>
        <p class="itinfo">${tell()}</p>${all ? '<button id="hpDone">Tell Nana it worked</button>' : ''}`, 'Later');
      document.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => { on[b.dataset.sd] = !on[b.dataset.sd]; sfx('plant'); draw(); });
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('nana', 'sisters', 'So that is why she did it. Each one helps the other 2.'); };
    draw(); } },
  drizzle: { label:'Help sail upwind', run() { let up = 0, side = 0, last = '', trail = [];
    const map = () => { let h = ''; for (let r = 4; r >= 0; r--) for (let c = -4; c <= 4; c++) h += `<span style="height:30px;display:grid;place-items:center;font-size:${r === up && c === side ? 22 : 18}px">${r === up && c === side ? '⛵' : r === 4 && c === 0 ? '🏝' : trail.some(t => t[0] === r && t[1] === c) ? '<i style="width:7px;height:7px;border-radius:50%;background:#fff;opacity:.8"></i>' : ''}</span>`;
      return `<div style="background:#5fb4dc;border-radius:16px;padding:6px 8px;margin-top:8px"><div style="text-align:center;color:#fff;font-weight:700;font-size:13px">💨 wind blows this way ↓</div><div style="display:grid;grid-template-columns:repeat(9,1fr)">${h}</div></div>`; };
    const draw = (msg = '"See that island? The wind is blowing straight from it, right at us. Get us there."') => { const won = up >= 4 && side === 0;
      showCard(`<div class="kicker">HELP CAPTAIN DRIZZLE</div><h2>⛵ Into the wind</h2><p><b>${msg}</b></p>${map()}
        <p class="itinfo">🏝 The island is <b>${Math.max(0, 4 - up)}</b> away, straight ahead.${side ? ` You have drifted <b>${Math.abs(side)}</b> to the ${side < 0 ? 'left' : 'right'} of it.` : up ? ' You are lined up with it.' : ''}</p>
        ${won ? '<button id="hpDone">Tell Drizzle we made it</button>' : `<h4>Point the ship</h4><div class="chips"><button data-sl="l">↖ Up and to the left</button><button data-sl="s">↑ Straight at the island</button><button data-sl="r">↗ Up and to the right</button></div>`}`, 'Later');
      document.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { const d = b.dataset.sl;
        if (d === 's') { sfx('click'); return draw('The sail flaps and the ship does not move. A ship cannot sail straight into the wind. Try pointing to one side.'); }
        trail.push([up, side]); up = Math.min(4, up + 1); side += d === 'l' ? -1 : 1; sfx('cast'); last = d;
        draw(up >= 4 && side !== 0 ? `You are level with the island, but ${Math.abs(side)} to the ${side < 0 ? 'left' : 'right'} of it. The ship is back at the start. This time, switch to the other side sooner.` + ((up = 0, side = 0, trail = []), '') : `The sail fills! The ship moves up and to the ${d === 'l' ? 'left' : 'right'}.`); });
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('drizzle', 'tack', 'Ha! You zigzagged like an old sea dog. Left, then right, then left again.'); };
    draw(); } },
  lumen: { label:'Help mix the light', run() { const on = { r:false, g:false, b:false }; let step = 0;
    const draw = () => { const { r, g, b } = on, col = `rgb(${r ? 255 : 30},${g ? 255 : 30},${b ? 255 : 30})`, want = step === 0 ? 'yellow' : 'white', hit = step === 0 ? (r && g && !b) : (r && g && b);
      const name = r && g && b ? 'white' : r && g ? 'yellow' : r && b ? 'pink-purple (magenta)' : g && b ? 'blue-green (cyan)' : r ? 'red' : g ? 'green' : b ? 'blue' : 'dark';
      showCard(`<div class="kicker">HELP LUMEN</div><h2>💡 Painting with light</h2><p>"I have 3 lanterns: red, green, and blue. I need <b>${want}</b> light for my painting. Can you make it?"</p>
        <div style="height:110px;border-radius:18px;background:#1f2552;display:grid;place-items:center;margin-top:8px"><div style="width:84px;height:84px;border-radius:50%;background:${col};box-shadow:0 0 34px ${col}"></div></div>
        <p style="text-align:center;font-weight:700;margin-top:6px">The light is ${name}.</p>
        <div class="chips" style="justify-content:center">${[['r', '🔴 Red'], ['g', '🟢 Green'], ['b', '🔵 Blue']].map(([k, l]) => `<button data-lt="${k}" class="${on[k] ? '' : 'ghost'}">${l}: ${on[k] ? 'on' : 'off'}</button>`).join('')}</div>
        ${hit ? `<button id="hpDone">${step === 0 ? 'Next: make white light' : 'Show Lumen'}</button>` : ''}`, 'Later');
      document.querySelectorAll('[data-lt]').forEach(x => x.onclick = () => { on[x.dataset.lt] = !on[x.dataset.lt]; chime(on[x.dataset.lt] ? 880 : 660); draw(); });
      if ($('hpDone')) $('hpDone').onclick = () => { if (step === 0) { step = 1; return draw(); } helpDone('lumen', 'light', 'Red and green made yellow. All 3 made white. Paint never does that.'); }; };
    draw(); } },
  twins: { label:'Help dig a tunnel that holds', run() { const tried = {};
    const pic = k => `<svg viewBox="0 0 200 90" style="display:block;width:100%;max-width:260px;margin:8px auto 0" aria-hidden="true"><rect width="200" height="90" rx="12" fill="#8a6a44"/><path d="${{ flat:'M50 86 V40 H150 V86Z', point:'M50 86 V52 L100 20 L150 52 V86Z', arch:'M50 86 V52 Q50 20 100 20 Q150 20 150 52 V86Z' }[k]}" fill="#2a1c12"/><circle cx="88" cy="74" r="8" fill="#b98a63"/><circle cx="112" cy="74" r="8" fill="#9b7b5a"/></svg>`;
    const out = { flat:'Moss stands on top. The flat roof sags in the middle, and dirt rains down. <b>It caves in.</b> Fern: "Moss! Again?"', point:'Moss stands on top and it holds. Then Fern climbs up too. <b>It cracks right at the tip.</b>', arch:'Moss climbs on. Fern climbs on. They jump up and down. <b>The round roof does not move.</b>' };
    const draw = (k) => { if (k) tried[k] = 1;
      showCard(`<div class="kicker">HELP MOSS & FERN</div><h2>🕳️ The tunnel that keeps falling in</h2><p>${k ? out[k] : '"Fern: Our new tunnel keeps caving in. Moss: We tried digging faster. Fern: That was worse. Moss: What shape should the roof be?"'}</p>${k ? pic(k) : ''}
        <h4>Pick a roof shape to try</h4><div class="chips">${[['flat', 'Flat roof'], ['point', 'Pointed roof'], ['arch', 'Round roof']].map(([id, l]) => `<button data-tn="${id}" class="${tried[id] ? 'ghost' : ''}">${l}</button>`).join('')}</div>
        ${tried.arch ? '<button id="hpDone">Tell the twins: round roof</button>' : '<p class="sub" style="margin-top:8px">Try a shape and see what happens.</p>'}`, 'Later');
      document.querySelectorAll('[data-tn]').forEach(b => b.onclick = () => { sfx(b.dataset.tn === 'arch' ? 'pick' : 'chop'); draw(b.dataset.tn); });
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('twins', 'arch', 'Moss: Round! Fern: Like a worm. Moss: The worms knew all along. Fern: We owe the worms an apology.'); };
    draw(); } },
  mabel: { label:'Help the dough rise', run() { const tried = {};
    const out = { cold:'An hour later, the dough has barely moved. It looks sleepy. <b>Too cold.</b>', warm:'An hour later, the dough is 2 times as big, soft, and full of bubbles. <b>Just right.</b>', hot:'The dough puffed up fast, then stopped. The bottom is cooked hard. <b>Too hot.</b> Mabel: "Gerald, no!"' };
    const draw = (k) => { if (k) tried[k] = 1;
      showCard(`<div class="kicker">HELP MABEL</div><h2>🍞 The dough that will not rise</h2><p>${k ? out[k] : '"My dough needs to rest for an hour before I bake it. But where? I have 3 balls of dough. Try a spot with each."'}</p>
        <h4>Where should the dough rest?</h4><div class="chips">${[['cold', '❄️ By the open window'], ['warm', '☀️ On the shelf near the oven'], ['hot', '🔥 On top of the hot oven']].map(([id, l]) => `<button data-dg="${id}" class="${tried[id] ? 'ghost' : ''}">${l}</button>`).join('')}</div>
        ${tried.warm ? '<button id="hpDone">Tell Mabel: the warm shelf</button>' : '<p class="sub" style="margin-top:8px">Try a spot and see what happens.</p>'}`, 'Later');
      document.querySelectorAll('[data-dg]').forEach(b => b.onclick = () => { sfx(b.dataset.dg === 'warm' ? 'pick' : 'click'); draw(b.dataset.dg); });
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('mabel', 'warm', 'Warm, not hot. Like a good bath. I will tell Gerald to keep his distance.'); };
    draw(); } },
  hoot: { label:'Help find the lost book', run() { const target = 1 + Math.floor(Math.random() * 16); let lo = 1, hi = 16, tries = 0, found = false;
    const draw = (msg = '"Hoo. Someone put a book back in the wrong place. <b>Tap a book to open it.</b> I will tell you if the lost book is earlier or later. Use as few tries as you can."') => {
      showCard(`<div class="kicker">HELP PROFESSOR HOOT</div><h2>📚 The lost book</h2><p>${msg}</p>
        <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-top:10px">${Array.from({ length:16 }, (_, k) => k + 1).map(n => `<button data-bk="${n}" class="${n < lo || n > hi ? 'ghost' : ''}" ${found || n < lo || n > hi ? 'disabled' : ''} style="padding:10px 0;${n < lo || n > hi ? 'opacity:.35' : ''}${found && n === target ? ';background:#8fdc8a' : ''}">${n}</button>`).join('')}</div>
        <p class="sub" style="margin-top:8px">Tries so far: <b>${tries}</b>${found ? '' : `. The book is somewhere from ${lo} to ${hi}.`}</p>
        ${found ? `<button id="hpDone">Give Hoot the book</button>${tries > 4 ? ' <button id="hpAgain" class="ghost">Try again in fewer tries</button>' : ''}` : ''}`, 'Later');
      document.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => { const n = +b.dataset.bk; tries++;
        if (n === target) { found = true; sfx('pick'); return draw(tries <= 4 ? `<b>Book ${n}. That is the one!</b> Found in ${tries} ${tries === 1 ? 'try' : 'tries'}.` : `<b>Book ${n}. That is the one!</b> It took ${tries} tries. Hoot: "Hoo. Next time, try opening the middle one first."`); }
        sfx('click'); if (n < target) lo = n + 1; else hi = n - 1; draw(`Book ${n} is not it. Hoot: "The lost book is <b>${n < target ? 'later' : 'earlier'}</b> than that one."`); });
      if ($('hpAgain')) $('hpAgain').onclick = () => HELP.hoot.run();
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('hoot', 'halving', tries <= 4 ? `${tries} ${tries === 1 ? 'try' : 'tries'}! You opened the middle and threw away 1/2 the shelf each time. I have been checking one by one for 40 years.` : 'Found! Here is my trick: open the middle one, and 1/2 the shelf is ruled out at once.'); };
    draw(); } },
  allegra: { label:'Help tune the water glasses', run() { const G = [['Full', 1, 330, 'a low note'], ['3/4 full', .75, 392, 'a fairly low note'], ['1/2 full', .5, 494, 'a fairly high note'], ['A little water', .2, 659, 'a high note']];
    const order = [2, 0, 3, 1], heard = {}; let seq = [];
    const glass = (g, k) => `<button data-gl="${k}" aria-label="${G[g][0]} glass" style="padding:8px 4px;border-radius:14px;background:none;border:2px solid ${seq.includes(k) ? '#e8a33d' : '#eadfd0'};box-shadow:none"><svg viewBox="0 0 40 60" style="display:block;width:44px;margin:0 auto" aria-hidden="true"><path d="M6 4 L10 56 H30 L34 4Z" fill="#eef7fb" stroke="#9fc7da" stroke-width="2"/><path d="M${7.6 + (1 - G[g][1]) * 3.2} ${10 + (1 - G[g][1]) * 44} L10.8 55 H29.2 L${32.4 - (1 - G[g][1]) * 3.2} ${10 + (1 - G[g][1]) * 44}Z" fill="#7ec8e3"/></svg><span style="display:block;font-size:12px;font-weight:700;margin-top:2px">${seq.includes(k) ? seq.indexOf(k) + 1 : '&nbsp;'}</span><span class="sub" style="display:block;font-size:11px;line-height:1.2;min-height:27px">${heard[k] ? G[g][3] : ''}</span></button>`;
    const draw = (msg = '"I filled 4 glasses with water to make a tiny xylophone. Tap a glass to hear it. Then help me: <b>tap all 4 in order, from the lowest note to the highest.</b>"', won) => {
      showCard(`<div class="kicker">HELP ALLEGRA</div><h2>🥛 The singing glasses</h2><p>${msg}</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px">${order.map((g, k) => glass(g, k)).join('')}</div>
        ${won ? '<button id="hpDone">Play it for Allegra</button>' : `<p class="sub" style="margin-top:8px">${seq.length ? `You have tapped ${seq.length} of 4.` : 'Each tap plays the glass and counts as your next pick.'} <button id="glReset" class="ghost" style="padding:2px 10px">Start over</button></p>`}`, 'Later');
      if ($('glReset')) $('glReset').onclick = () => { seq = []; draw(); };
      document.querySelectorAll('[data-gl]').forEach(b => b.onclick = () => { const k = +b.dataset.gl, g = order[k]; if (won) return chime(G[g][2]); chime(G[g][2]); heard[k] = 1; if (muted && !G.told) { G.told = 1; toast('Sound is off, so the words will tell you each note.'); }
        if (seq.includes(k)) return draw(`${G[g][0]}: <b>${G[g][3]}.</b>`);
        seq.push(k);
        if (seq.length < 4) return draw(`${G[g][0]}: <b>${G[g][3]}.</b>`);
        const ok = seq.every((kk, n) => n === 0 || G[order[kk]][2] > G[order[seq[n - 1]]][2]);
        if (ok) { [330, 392, 494, 659].forEach((f, n) => setTimeout(() => chime(f), 300 + n * 220)); return draw('<b>Low to high. That is a scale!</b> Did you notice which glass was the lowest?', true); }
        seq = []; draw('Not quite in order. Each glass now shows its note. <b>Tap them again, from the lowest note to the highest.</b>'); });
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('allegra', 'pitch', 'The fullest glass sings the lowest! I had them backwards for a week. My neighbors were very patient.'); };
    draw(); } },
  sage: { label:'Help stack the garden stones', run() { const OFF = [0, 1/8, 1/8 + 1/6, 1/8 + 1/6 + 1/4, 1/8 + 1/6 + 1/4 + 1/2]; /* in stone lengths, from the bottom up: each stone reaches 1/8, 1/6, 1/4, 1/2 past the one below */
    const pile = n => { let h = ''; for (let k = 0; k < n; k++) { const x = 100 + (OFF[k + 1] - 1) * 60; /* OFF is how far each stone's right end reaches past the edge */ h += `<rect x="${x.toFixed(1)}" y="${70 - k * 14}" width="60" height="12" rx="3" fill="${['#8a8f96', '#a3a8ae', '#bcc1c6', '#d0d4d8'][k]}"/>`; }
      return `<svg viewBox="0 0 200 112" style="display:block;width:100%;max-width:280px;margin:8px auto 0" aria-hidden="true"><rect x="10" y="82" width="90" height="30" fill="#b9a58a"/><path d="M10 92 H100 M10 102 H100 M40 82 V92 M70 92 V102 M40 102 V112" stroke="#9b8a70" stroke-width="1.5"/><path d="M100 14 V112" stroke="#e5484d" stroke-width="1.5" stroke-dasharray="3 3"/><text x="104" y="108" font-size="9" font-weight="800" fill="#e5484d">edge</text>${h}</svg>`; };
    const draw = (msg, n, won) => {
      showCard(`<div class="kicker">HELP SAGE</div><h2>🪨 4 stones on the wall edge</h2><p>${msg}</p>${pile(n)}
        ${won ? '<button id="hpDone">Show Sage</button>' : n ? '<button id="snNext">Add the next stone</button>' : '<div class="chips"><button data-sn="y">Yes</button><button data-sn="n">No, it would fall</button></div>'}`, 'Later');
      document.querySelectorAll('[data-sn]').forEach(b => b.onclick = () => { sfx('click'); draw(b.dataset.sn === 'y' ? '<b>Sage nods.</b> "Watch." Each stone goes as far out as it can and still balance.' : '"Most people say that. Watch." Each stone goes as far out as it can and still balance.', 1); });
      if ($('snNext')) $('snNext').onclick = () => { sfx('pick'); n++; if (n < 4) return draw(`Stone ${n}. Its balance point, with everything on top, sits right over the edge below.`, n); draw('<b>The top stone is completely past the edge.</b> Nothing is under it but air, and it holds.', 4, true); };
      if ($('hpDone')) $('hpDone').onclick = () => helpDone('sage', 'balance', 'The trick is not strength. It is knowing exactly where the middle of the weight is.'); };
    draw('"The wall by the gate needs a lip of stones. Here is a riddle first. Stack 4 flat stones at the edge, each leaning out past the one below. Can the top stone end up completely past the edge?"', 0); } },
};
// the old stone: crack its symbols by comparing names you know, the way the real Rosetta Stone was read
function readStone() { const sym = { N:'◆', A:'●', P:'▲', I:'■' }, w = t => [...t].map(c => sym[c]).join(' ');
  const ask = (msg = '') => { showCard(`<div class="kicker">THE OLD STONE</div><h2>Can you read it?</h2><p>The stone says the same thing 2 times: once in letters you know, once in old symbols.</p>
      <p class="itinfo" style="font-size:20px;line-height:1.8">N A N A &nbsp;=&nbsp; ${w('NANA')}<br>P I P &nbsp;=&nbsp; ${w('PIP')}</p>
      <p style="margin-top:10px">Further down, 1 word is only in symbols:</p><p style="font-size:30px;text-align:center;letter-spacing:6px">${w('PAN')}</p><h4>What does it say?</h4>
      <div class="chips">${['NAP', 'PIN', 'PAN', 'NIP'].map(x => `<button data-st="${x}">${x}</button>`).join('')}</div><p style="font-weight:700;min-height:22px;margin-top:8px">${msg}</p>`, 'Later');
    document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { if (b.dataset.st !== 'PAN') { sfx('click'); return ask(`Not ${b.dataset.st}. Match each symbol to a letter in the 2 names above.`); }
      const first = !S.stoneRead; S.stoneRead = true; if (first) S.coins += 40; save(); drawHud(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 130));
      showCard(`<p style="font-size:18px"><b>PAN!</b> You just read a language nobody taught you.${first ? ' <b>+40 coins.</b>' : ''}</p>` + ahaHtml('rosetta'), 'Huh. Neat.'); }); };
  ask(); }
function did(act, n = 1) { if (VISIT) return; S.did = S.did || {}; S.did[act] = (S.did[act] || 0) + n; S.dayDid = S.dayDid || {}; S.dayDid[act] = 1; }
// dreams: a silly line each time you wake up. Half the time it is about something you did that day.
const DREAMS = ['You dreamed the sundial was running late.', 'You dreamed the moon came down to borrow a cup of sugar.', 'You dreamed your hut had a second floor. It was all stairs.',
  'You dreamed a cloud followed you around like a puppy.', 'You dreamed Pip hung 3 gold balls outside his shop. Everyone tried to pawn a hat.', 'You dreamed the bridge was made of toast. It held.',
  'You dreamed a snail passed you and said sorry.', 'You dreamed every fish wore a tiny hat.', 'You dreamed you won a staring contest with an owl.',
  'You dreamed the stars spelled your name. They spelled it wrong.', 'You dreamed you were a sandwich. A good one.', 'You dreamed you could fly, but only sideways.',
  'You dreamed the Wind Bell rang. It was your alarm clock.', 'You dreamed Nana knitted a sweater for the whole island.', 'You dreamed a potato gave a speech. It was moving.'];
const DAY_DREAMS = { fish:'You dreamed a fish caught you, then threw you back for being too small.', sell:'You dreamed Pip paid you in buttons. You were thrilled.', talk:'You dreamed Nana was 40 feet tall and still asked if you had eaten.',
  gift:'You dreamed everyone gave you the same gift. It was a spoon.', water:'You dreamed your crops watered you.', pick:'You dreamed a pumpkin asked to speak to your manager.', dig:'You dreamed you dug up your own shoe. Twice.',
  chop:'You dreamed the trees chopped back. Politely.', mine:'You dreamed a rock asked you to stop. You apologized.', wish:'You dreamed the fountain made a wish on you.', fruit:'You dreamed an apple fell up.', plant:'You dreamed you planted a spoon and grew a ladle.',
  sit:'You dreamed the bench sat on you for a change.', ask:'You dreamed a neighbor asked you for 900 turnips by noon.' };
function dream() { const mine = Object.keys(S.dayDid || {}).filter(k => DAY_DREAMS[k]), pool = mine.length && Math.random() < .5 ? mine.map(k => DAY_DREAMS[k]) : DREAMS.filter(d => d !== S.lastDream);
  const d = pool[Math.floor(Math.random() * pool.length)]; S.lastDream = d; return '💭 ' + d; }
function knowTick() { if (S.tut !== 9 || S.knowDay === S.day || !S.did) return; const x = KNOWHOW.find(k => (S.did[k.act] || 0) >= k.n && !(S.know || []).includes(k.id)); if (!x) return;
  S.know = [...(S.know || []), x.id]; S.knowDay = S.day; S.coins += 40; save(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 130));
  showCard(knowHtml(x) + '<p style="margin-top:10px"><b>+40 coins.</b> Saved in Collections, under Know-how.</p>', 'Huh. Neat.', drawHud); }
function ensureGoals() {
  if (S.goals && S.goals.day === S.day) return;
  const pool = [['pick',3],['sell',100],['talk',2],['gift',1],['plant',3]];
  if ((S.digs || []).length) pool.push(['dig',1]); if (S.tools.axe) pool.push(['chop',2]); if (S.tools.pick) pool.push(['mine',2]);
  if (squareOpen()) pool.push(['wish',1], ['sit',1], ['ask',1]);
  if (!S.sprinklers) pool.push(['water',3]);
  if (S.bridge) pool.push(['fish',2]);
  if (S.bridge && season() !== 3) pool.push(['fruit',2]);
  const list = []; while (list.length < 3) { const g = pool.splice(Math.floor(Math.random()*pool.length), 1)[0]; list.push({ t:g[0], need:g[1], have:0 }); }
  S.goals = { day:S.day, list, bonus:false };
}
function goal(t, n=1) {
  mythCount(t, n); did(t, t === 'sell' ? 1 : n);
  lean({ water:'grower', pick:'grower', sell:'trader', talk:'friend', gift:'friend', fish:'explorer', fruit:'explorer' }[t], t === 'sell' ? 1 : n);
  if (!featureOn('goals')) return;
  ensureGoals();
  const g = S.goals.list.find(x => x.t === t && x.have < x.need); if (!g) return;
  g.have = Math.min(g.need, g.have + n);
  const allDone = !S.goals.bonus && S.goals.list.every(x => x.have >= x.need);
  if (g.have >= g.need) { S.coins += 20; if (!allDone) setTimeout(() => { toast(`Goal done: ${GOAL_TYPES[t](g.need)}! +20 coins`); sfx('coin'); }, 700); }
  if (allDone) { S.goals.bonus = true; S.coins += 30; did('goals'); setTimeout(() => { toast('All 3 goals done today! +20 coins, and +30 bonus coins'); sfx('heart'); }, 700); }
  drawHud(); save();
}
function communityGoal() {
  const d = today(), m = d.getMonth(), ym = `${d.getFullYear()}-${String(m+1).padStart(2,'0')}`;
  const [type, title, verb, target] = [['harvest','The Great Harvest','Pick crops',500], ['fishing','The Big Catch','Catch fish',200], ['fruit','Orchard Days','Pick fruit',300]][m % 3];
  return { id:`${ym}-${type}`, type, title, text:`${verb} together this month. Every player adds to 1 shared total.`, target, reward:150 };
}
function communityAdd(type) {
  const cg = communityGoal(); if (cg.type !== type || VISIT) return;
  S.contrib = S.contrib || {}; S.contrib[cg.id] = (S.contrib[cg.id] || 0) + 1;
}
async function communitySend() {
  if (devOn() || VISIT) return;
  const cg = communityGoal(); S.contribSent = S.contribSent || {};
  const n = Math.min(50, (S.contrib?.[cg.id] || 0) - (S.contribSent[cg.id] || 0)); if (n <= 0) return;
  try { const r = await fetch(`${CLOUD}/contribute`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ key:S.syncKey, goal:cg.id, n }) });
    if (r.ok) { S.contribSent[cg.id] = (S.contribSent[cg.id] || 0) + n; save(); } } catch {}
}
async function communityHtml() {
  const cg = communityGoal(); let count = null;
  try { count = (await (await fetch(`${CLOUD}/community?goal=${cg.id}`)).json()).count; } catch {}
  const mineN = S.contrib?.[cg.id] || 0, done = count !== null && count >= cg.target, claimed = S.claimed?.[cg.id];
  return `<h4>Community goal: ${cg.title}</h4><p>${cg.text}</p>
    ${count === null ? '<p>Could not reach the cloud right now.</p>' : `<div style="height:12px;border-radius:99px;background:#eadfd0;margin-top:8px;overflow:hidden"><div style="height:100%;width:${Math.min(100, Math.round(count/cg.target*100))}%;background:#8fdc8a"></div></div>
    <p style="margin-top:4px"><b>${Math.min(count, cg.target)} of ${cg.target}</b> so far. You added ${mineN}.</p>`}
    ${done && mineN > 0 && !claimed ? `<button id="claimCg">Claim your reward: ${cg.reward} coins</button>` : done ? `<p style="font-weight:700">${claimed ? 'Reward claimed. Thank you for helping!' : 'Goal reached! You did not add to this one. Help next month to earn the reward.'}</p>` : ''}`;
}
function wireClaim() { const b = $('claimCg'); if (!b) return; b.onclick = () => { const cg = communityGoal(); S.claimed = S.claimed || {}; S.claimed[cg.id] = true; S.coins += cg.reward; save(); drawHud(); sfx('coin'); b.outerHTML = '<p style="font-weight:700">Reward claimed. Thank you for helping!</p>'; }; }
async function openMailbox(tab) {
  S.mailNew = false; save(); sfx('click');
  const code = await friendCodeOf(S.syncKey), friends = S.friends || [], log = S.mailLog || [];
  if (!tab) { showCard(`<div class="kicker">MAILBOX</div><h2>${log.length ? 'Your mail' : 'No mail yet'}</h2>
    ${log.length ? log.slice(-5).reverse().map(l => `<p class="gap">${l}</p>`).join('') : '<p>Gifts and letters from neighbors and friends show up here.</p>'}
    <div class="jlist" style="margin-top:12px"><button id="mbVisit">Visit a friend</button><button id="mbCode">Share my friend code</button></div>`, 'Close');
    $('mbVisit').onclick = () => openMailbox('visit'); $('mbCode').onclick = () => openMailbox('code'); return; }
  if (tab === 'code') showCard(`<div class="kicker">MAILBOX</div><h2>Your friend code</h2><p style="font:700 26px monospace;letter-spacing:.12em" id="myFc">${code}</p>
    <button id="copyFc" class="ghost">Copy code</button>
    <p style="margin-top:6px">A friend types this in their mailbox to visit your island. They can water your garden and leave a gift once a day.</p>
    <p id="fcMsg" style="margin-top:8px;font-weight:700;min-height:20px"></p>`, 'Back', () => openMailbox());
  if (tab === 'visit') showCard(`<div class="kicker">MAILBOX</div><h2>Visit a friend</h2>
    ${friends.length ? `<div class="jlist">${friends.map(f => `<button data-fc="${f.code}">${f.name} <span class="sub">${f.code}</span></button>`).join('')}</div><h4>Someone new</h4>` : ''}
    <input id="fcIn" maxlength="6" placeholder="Their 6-character code" autocomplete="off" style="width:100%;margin-top:6px;font:18px monospace;text-transform:uppercase;border-radius:12px;border:2px solid #eadfd0;padding:8px">
    <button id="fcGo">Visit</button>
    <p id="fcMsg" style="margin-top:8px;font-weight:700;min-height:20px"></p>`, 'Back', () => openMailbox());
  if ($('copyFc')) $('copyFc').onclick = async () => { try { await navigator.clipboard.writeText(code); $('fcMsg').textContent = 'Copied! Send it to a friend.'; } catch { $('fcMsg').textContent = `Your code is ${code}.`; } };
  const go = async c => { c = (c || '').toUpperCase().trim();
    if (!/^[A-F0-9]{6}$/.test(c)) { $('fcMsg').textContent = 'A friend code has 6 characters, using the numbers 0 to 9 and the letters A to F.'; return; }
    if (c === code) { $('fcMsg').textContent = 'That is your own code. Share it with a friend!'; return; }
    $('fcMsg').textContent = 'Looking for their island...';
    try { const r = await fetch(`${CLOUD}/visit?code=${c}`); if (!r.ok) throw 0; const isl = (await r.json()).island;
      S.friends = [{ code:c, name:isl.name }, ...(S.friends || []).filter(f => f.code !== c)].slice(0, 8); save(); cloudPush(true);
      $('fcMsg').textContent = `Flying to ${isl.name}'s island...`; setTimeout(() => location.href = `${location.pathname}?visit=${c}`, 600);
    } catch { $('fcMsg').textContent = 'No island found with that code. Check it and try again. Your friend needs to have played online at least once.'; } };
  if ($('fcGo')) $('fcGo').onclick = () => go($('fcIn').value);
  document.querySelectorAll('[data-fc]').forEach(b => b.onclick = () => go(b.dataset.fc));
}
async function checkInbox() {
  if (devOn() || VISIT || SIDE) return;
  let items = []; try { items = (await (await fetch(`${CLOUD}/inbox?key=${S.syncKey}`)).json()).items || []; } catch { return; }
  if (!items.length) return;
  const lines = [];
  items.forEach(it => {
    if (it.kind === 'water') { S.tiles.forEach((t, i) => { if (t.s >= 1) { t.w = true; drawTile(i); } }); lines.push(`${it.from} watered your garden.`); }
    else if (it.kind === 'sale') { const what = it.product ? it.product.name : ITEMS[registerHeirloom(it.item)] ? `${it.qty} ${plural(it.item, it.qty)}` : 'things';
      if (it.price) { S.coins += it.price; lines.push(`${it.from} bought your ${what} for ${it.price} coins.`); }
      else { registerHeirloom(it.wantItem); S.bag[it.wantItem] = (S.bag[it.wantItem] || 0) + it.wantQty; lines.push(`${it.from} traded ${it.wantQty} ${ITEMS[it.wantItem] ? plural(it.wantItem, it.wantQty) : 'things'} for your ${what}.`); }
      lean('trader'); }
    else if (ITEMS[registerHeirloom(it.item)] && ITEMS[it.item].kind !== 'quest') { bagAdd(it.item); lines.push(`${it.from} left you a ${ITEMS[it.item].name}.`); }
  });
  S.mailLog = [...(S.mailLog || []), ...lines].slice(-20); S.mailNew = true; save(); drawHud();
  showCard(`<div class="kicker">WHILE YOU WERE AWAY</div><h2>You had visitors!</h2><div class="jlist">${lines.map(l => `<button>${l}</button>`).join('')}</div><p style="margin-top:8px">Any gifts are in your Bag. To visit a friend back, tap your mailbox.</p>`, 'Yay!');
}
function openGoals() {
  ensureGoals();
  showCard(`<h2>Today's goals</h2><p>Each one pays 20 coins. Finish all 3 for 30 more.</p>
    <div class="jlist">${S.goals.list.map(g => { const done = g.have >= g.need, k = Math.min(1, g.have / g.need);
      return `<button class="goal ${done ? 'done' : ''}"><span class="gck">${done ? '✓' : ''}</span><span class="gtx">${GOAL_TYPES[g.t](g.need)}<small>${done ? 'Done' : g.t === 'sell' ? `${Math.min(g.have, g.need)} of ${g.need} coins` : `${Math.min(g.have, g.need)} of ${g.need}`}</small><i class="gbar"><b style="width:${Math.round(k * 100)}%"></b></i></span></button>`; }).join('')}</div>
    <div class="jlist" style="margin-top:12px">${hammockStep() ? '<button id="glHam">Nana\'s mission: the hammock</button>' : ''}<button id="glCg">The community goal</button></div>`, 'Close');
  if ($('glHam')) $('glHam').onclick = () => showCard(`<div class="kicker">A MISSION FROM NANA</div><h2>The hammock</h2><p>${hammockStep()}</p>`, 'Back', openGoals);
  $('glCg').onclick = async () => { showCard(`<div class="kicker">TODAY'S GOALS</div><div id="goalCg"><p>Loading the community goal...</p></div>`, 'Back', openGoals); const h = await communityHtml(); if ($('goalCg')) { $('goalCg').innerHTML = h; wireClaim(); } };
}
$('goalsBtn').onclick = openGoals;
function applyPaint() { roofMat.color.set(+S.roof); ridgeMat.color.set(+S.roof).multiplyScalar(.86); wallMat.color.set(homeStyle() === 'daub' || S.wallOn ? +S.wall : HOME_STYLES[homeStyle()].color); } // log and stone walls keep their own color until you paint them
document.addEventListener('click', e => { if (e.target.closest('button,.slot,.hslot') && e.target.id !== 'mute') sfx('click'); });
// S.tut: 1 Nana walks over, 2 dig the first spot, 3 plant, 4 water, 5 pick, 6 sell, 9 done
const TUT = {
  2: { text:'Tap the gold sparkle 3 times to dig it up.', help:'Nana showed you a gold sparkle right next to your garden. Walk to it and tap it 3 times. Each tap digs a little deeper.' },
  3: { text:'Tap the garden square to dig the soil, then tap it again to plant.', help:'Your garden is the patch of squares near your hut. The gold arrow points at one. Tap it once to dig the soil, then tap it again to plant 1 of the seeds Nana gave you.' },
  4: { text:'Tap the planted square to water it.', help:'Seeds need water. Tap the square with your new sprout to water it.' },
  5: { text:'Your first crop is ripe! Tap it to pick it.', help:'Your grandma\'s garden soil grew your first plant right away. Tap it to pick it. Usually crops take a few days.' },
  6: { text:'Sell your crop. Tap the wooden crate.', help:'The wooden crate next to your garden buys anything you grow, catch, or pick. Tap it to sell your crop for coins.' },
};
function tutActive() { return S.tut >= 2 && S.tut <= 6; }
function startTutorial() { S.tut = 1; save(); nanaWalk = { to: player.position.clone().add(new THREE.Vector3(-1.3, 0, -1.1)), back:false }; }
let nanaWalk = null;
const NANA_HOME = new THREE.Vector3(.1, 0, -4.7), FIRST_DIG = [-.2, 2.3]; // right by the garden
function tutAfterGreeting() {
  S.tut = 2; S.digs = [{ p:[...FIRST_DIG], n:0 }]; drawDigs(); save(); drawHud();
}
function tutAfterFirstMemory() {
  const c = Object.keys(CROPS).find(k => CROPS[k].seasons.includes(season()) && !CROPS[k].locked);
  S.tut = 3; S.tiles[0] = { s:0 }; S.seeds[c] = (S.seeds[c] || 0) + 2; S.sel = c; drawTile(0); save(); drawHud();
  openDialog('Nana Gale', "Your first memory! She would be proud. Now, her garden. Here are 2 seeds. Tap the square the arrow points at.", [], S.hearts.nana);
}
function tutTile(i) {
  if (!tutActive() || i !== 0) return;
  const t = S.tiles[0];
  if (S.tut === 3 && t.s === 2) { S.tut = 4; }
  else if (S.tut === 4 && t.w) {
    S.tut = 5; toast('Watch closely...');
    setTimeout(() => { const tt = S.tiles[0]; if (tt.s === 2) { tt.d = CROPS[tt.c].days; drawTile(0); burst(tileGroups[0].position, 0xffc4d6, 24); chime(784); chime(1047);
      openDialog('Nana Gale', "Oh my! Your grandmother's soil grows fast the very first time. Go on, pick it! After this, crops take a few days, so water them every day.", [], S.hearts.nana); } }, 1600);
  }
  else if (S.tut === 5 && t.s === 1) { S.tut = 6; }
  save(); drawHud();
}
function tutSold() {
  if (S.tut !== 6) return;
  S.tut = 9; save(); drawHud(); openSquare(); setTimeout(founderDrip, 9000); // the Town Square first, then any founder surprise
  setTimeout(() => {
    S.meetPip = true; save(); drawHud();
    openDialog('Nana Gale', (S.home || 0) < 3 ? "Your first coins! The neighbors just mended the little bridge at the back of the island. Go and meet Pip on the Town Square. He is selling lemonade, and it is not going well." : "Your first coins! That is how it works up here: grow things, sell them, and use the coins to rebuild. Now, there are more memories buried out there. New sparkles appear every morning. Off you go, dear!", [], S.hearts.nana);
    spawnDigs(); nanaWalk = { to: NANA_HOME.clone(), back:true };
    const fb = $('fbBtn'); fb.classList.add('pulse'); setTimeout(() => fb.classList.remove('pulse'), 4000);
  }, 900);
}
// a step you cannot do any more today: what to say instead, and no arrow
function questWait() { if (VISIT || S.tut < 9 || meetingPip()) return '';
  if (S.quest === 2 && hour() > 12.5) return 'Noon has passed. Tap the stone sundial tomorrow at noon (12 PM).';
  if (S.quest >= 5 && S.q2 === 1 && S.potDay === S.day) return 'The pot needs a day in the sun. Tap it again tomorrow.';
  if (S.quest >= 5 && S.q2 >= 5 && S.q3 >= 7 && S.q4 >= 5 && S.q5 === 5 && hour() > 12.5) return 'Noon has passed. Tap the bell tomorrow at noon (12 PM).';
  return ''; }
function questTarget() {
  if (VISIT) return ownerNpc;
  if (questWait()) return null;
  if (S.tut === 1) return null;
  if (meetingPip()) return npcs.pip;
  if (S.tut === 2) return digGroups[0] || null;
  if (S.tut >= 3 && S.tut <= 5) return tileGroups[0];
  if (S.tut === 6) return crate;
  if (S.quest < 5) return [npcs.nana, digGroups[0] || null, sundial, npcs.nana, sign][S.quest];
  if (S.q2 < 5) return [npcs.drizzle, pot, ship, npcs.drizzle, npcs.drizzle][S.q2];
  if (S.q3 < 7) return [sign2, npcs.twins, windmill, windmill, windmill, npcs.nana, npcs.twins][S.bridge2 && S.q3 === 0 ? 1 : S.q3];
  if (S.q4 < 5) return [npcs.lumen, easel, darkroom, crystals, npcs.lumen][S.q4];
  if (S.q5 < 6) return [npcs.drizzle, ship, greatBell, lumberPile, lumberPile, greatBell][S.q5];
  const nextSite = BUILDINGS.findIndex(b => !S.built.includes(b.id)); return nextSite >= 0 ? siteGroups[nextSite] : null;
}
const MARK_H = { npc:2.4, ship:4.2, windmill:5.6, greatbell:2.2, bellframe:1.4, house:3.8 };
function meetingPip() { return !VISIT && S.tut >= 9 && !!S.meetPip && !(S.helped || []).includes('pip'); }
function currentHowto() {
  if (TUT[S.tut]) return TUT[S.tut].help;
  if (meetingPip()) return 'Walk to the back of your island and cross the little bridge to the Town Square. The gold arrow points the way. Pip is the bird by the cart. Tap him, then tap Help price the lemonade.';
  if (S.quest < 5) return HOWTO.c1[S.quest];
  if (S.q2 < 5) return HOWTO.c2[S.q2];
  if (S.q3 < 7) return HOWTO.c3[S.bridge2 && S.q3 === 0 ? 1 : S.q3];
  if (S.q4 < 5) return HOWTO.c4[S.q4];
  return HOWTO.c5[S.q5];
}
$('quest').onclick = () => { if (VISIT) return goHome(); sfx('click'); showCard(`<div class="kicker">WHAT TO DO</div><h2>${$('quest').querySelector('.qt').textContent}</h2><p>${currentHowto()}</p>${hutLine() ? `<h4>Your hut: step ${(S.home || 0) + 1} of 3</h4><p>${homeStep().text}</p>` : ''}<h4>Tip</h4><p>A gold arrow floats over the next thing to tap.</p>`, 'Got it'); };
const hutLine = () => !VISIT && S.tut >= 9 && !meetingPip() && (S.home || 0) < 3 ? `<span class="q2"><b>YOUR HUT: STEP ${(S.home || 0) + 1} OF 3</b>${homeStep().text}</span>` : '';
function drawQuest() { drawQuestMain(); const w = questWait() || (!VISIT && S.tut >= 9 && S.quest >= 5 && S.q2 === 1 && S.potDay >= 0 && S.potDay < S.day ? 'Tap the metal pot by the ship. The fresh water is ready.' : ''), qt = $('quest').querySelector('.qt'); if (w && qt) qt.textContent = w; const h = hutLine(); if (h) $('quest').insertAdjacentHTML('beforeend', h); }
function drawQuestMain() {
  if (meetingPip()) { $('quest').innerHTML = `<i>Tap for help</i><b>MEET PIP</b><span class="qt">Cross the little bridge at the back of your island. Help Pip with his lemonade.</span>`; return; }
  if (VISIT) { $('quest').innerHTML = `<i>Tap to go home</i><b>VISITING ${VISIT.name.toUpperCase()}'S ISLAND</b><span class="qt">Say hi, water their garden, or leave a gift.</span>`; return; }
  if (S.tut === 1 || tutActive()) { $('quest').innerHTML = `<i>Tap for help</i><b>GETTING STARTED</b><span class="qt">${S.tut === 1 ? 'Nana Gale is coming to say hello.' : TUT[S.tut].text}</span>`; return; }
  if (S.quest < 5) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 1: THE WIND BELL</b><span class="qt">${QUEST1[S.quest]}${S.quest === 1 ? ` (${S.relics} of 3 found)` : ''}</span>`;
  else if (S.q2 < 5) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 2: THE CLOUD SHIP</b><span class="qt">${QUEST2[S.q2]}</span>`;
  else if (S.q3 < 7) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 3: THE WINDMILL</b><span class="qt">${QUEST3[S.bridge2 && S.q3 === 0 ? 1 : S.q3]}</span>`;
  else if (S.q4 < 5) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 4: THE PAINTER OF LIGHT</b><span class="qt">${QUEST4[S.q4]}</span>`;
  else $('quest').innerHTML = `<i>Tap for help</i><b>${S.q5 < 6 ? 'CHAPTER 5: THE OLD HEART' : 'REBUILD THE VILLAGE'}</b><span class="qt">${S.q5 < 6 ? QUEST5[S.q5] : (S.built.length < BUILDINGS.length ? `${S.built.length} of ${BUILDINGS.length} buildings. Tap a building site at the Old Heart.` : 'The village is rebuilt! Visit your neighbors, cook, read, play, and chart the stars.')}</span>`;
}

// ============ ACTIONS ============
// farming: one tap tills and plants, watering soaks the whole row, and picking sweeps up ripe neighbors
const rowOf = i => S.tiles.map((_, j) => j).filter(j => Math.floor(j / 3) === Math.floor(i / 3));
function useTile(i) {
  const t = S.tiles[i], pos = tileGroups[i].position, fx = (txt) => floatText(txt, pos.clone());
  if (t.s === 0) {
    t.s = 1; sfx('till'); burst(pos, 0xb98a63, 8);
    const c = CROPS[S.sel];
    if (!tutActive() && c && c.seasons.includes(season()) && S.seeds[S.sel] > 0) { S.seeds[S.sel]--; Object.assign(t, { s:2, c:S.sel, d:0 }); goal('plant'); setTimeout(() => sfx('plant'), 150); fx(`🌱 ${c.name}`); }
    else if (tutActive()) toast('Soil is ready! Tap it again to plant.'); else fx('Soil ready');
  }
  else if (t.s === 1) {
    let c = CROPS[S.sel];
    if (!c.seasons.includes(season()) || S.seeds[S.sel] <= 0) { const k2 = Object.keys(CROPS).find(k => S.seeds[k] > 0 && CROPS[k].seasons.includes(season()));
      if (k2) { S.sel = k2; c = CROPS[k2]; drawHud(); toast(`Planting ${c.name}. To plant something else, tap a seed in the bar at the bottom first.`); } }
    if (!c.seasons.includes(season())) { toast(`${c.name} only grows in ${c.seasons.map(s => SEASONS[s]).join(' and ')}. Pick another seed from the bar below.`); return; }
    if (S.seeds[S.sel] <= 0) { toast('No seeds for this season. Buy some from Pip on the Town Square.'); return; }
    S.seeds[S.sel]--; Object.assign(t, { s:2, c:S.sel, d:0 }); goal('plant'); sfx('plant'); if (tutActive()) toast(`Planted ${c.name}. Tap to water.`); else fx(`🌱 ${c.name}`);
  } else {
    const c = CROPS[t.c];
    if (t.d >= c.days) {
      const ripe = [i, ...rowOf(i).filter(j => j !== i && S.tiles[j].s === 2 && S.tiles[j].d >= CROPS[S.tiles[j].c].days)];
      let got = 0; const counts = {};
      for (const j of ripe) { const tj = S.tiles[j], k = tj.c; if (!canCarry(k)) break;
        bagAdd(k); got++; counts[k] = (counts[k] || 0) + 1; goal('pick'); communityAdd('harvest');
        if (S.mode === 'garden' && Math.random() < .2 && canCarry(k)) { bagAdd(k); counts[k]++; }
        S.tiles[j] = { s:1, w:tj.w }; burst(tileGroups[j].position, CROPS[k].color); drawTile(j); }
      if (!got) return bagFull();
      sfx('pick'); fx(Object.entries(counts).map(([k,n]) => `+${n} ${icon(k)}`).join('  '));
      if (tutActive()) toast(`You picked a ${c.name}!`);
    }
    else if (!t.w) {
      const row = rowOf(i).filter(j => S.tiles[j].s === 2 && !S.tiles[j].w); row.forEach(j => { S.tiles[j].w = true; goal('water'); burst(tileGroups[j].position, 0x9fd3ff, 6); drawTile(j); });
      sfx('water'); fx(`💧 ${row.length > 1 ? `Watered ${row.length}` : 'Watered'}`);
      if (tutActive()) toast(`Watered. ${c.days - t.d} more day${c.days - t.d > 1 ? 's' : ''}.`);
    }
    else fx(`${c.days - t.d} more day${c.days - t.d > 1 ? 's' : ''}`);
  }
  drawTile(i); drawHud(); save(); tutTile(i);
}
// what one item sells for at your crate: a specialty from another island is worth 5 times more here
// --- your shop: the long game. It grows from a crate into a brand as you sell, and each step shows a real idea from running a business ---
const SHOP_STAGES = [
  { name:'Crate', at:0 },
  { name:'Stand', at:300, perk:'Everything you sell here now earns 5% more.', term:'A SIGN', title:'Nobody can buy from a shop they cannot find',
    real:'Before most people could read, shops hung a picture outside: 3 gold balls for a pawnshop, a striped pole for a barber. A sign is the oldest kind of advertising. It tells people walking past what you sell, before they have to ask.',
    today:'Count the signs on any street. Every one is a shop saying: here I am, and here is what I have.' },
  { name:'Stall', at:1200, perk:'You now keep a ledger. It is a record of what you sell. Tap My shop to see what earns you the most.', term:'KEEPING BOOKS', title:'Write down what you earn, and you can see what works',
    real:'Merchants in Venice kept careful books of everything that came in and everything that went out. In 1494, Luca Pacioli printed the first description of how they did it. Shops still use the same method. It is called <b>bookkeeping</b>.',
    today:'Open your ledger. The crop with the biggest price is not always the one that earns the most per day.' },
  { name:'Shop', at:3000, perk:'Cooked dishes now sell for 15% more.', term:'ADDING VALUE', title:'Flour sells for a little. Bread sells for more.',
    real:'When you turn something plain into something people want more, you have <b>added value</b>. The extra coins pay for your work and your know-how. Bakers, carpenters, and tailors all earn their living this way.',
    today:'A bag of coffee beans makes dozens of cups. A coffee shop sells each cup for more than the beans in it cost. The difference is the work.' },
  { name:'Brand', at:7500, perk:'Everything you sell here now earns 10% more.', term:'A BRAND', title:'A name people trust is worth more than the goods',
    real:'The word <b>brand</b> comes from an old word for burning. Ranchers burned a mark into their cattle to show whose they were. Today a brand is a promise: buy from this name, and you know what you will get.',
    today:'People pay more for a name they trust. That trust takes years to build, and it can be lost in a day.' },
];
function shopData() { S.shop = S.shop || { earn:0, by:{}, stage:0 }; return S.shop; }
function shopName() { return (S.brand && S.brand.shop) || S.shopName || `${S.name || 'My'}${S.name ? "'s" : ''} Shop`; }
function shopBonus(k) { const st = (S.shop && S.shop.stage) || 0; return (st >= 4 ? 1.1 : st >= 1 ? 1.05 : 1) * (st >= 3 && ITEMS[k].kind === 'dish' ? 1.15 : 1); }
var shopBits = [], shopSign = null;
function drawShop() { const st = (S.shop && S.shop.stage) || 0; shopBits.forEach((g, i) => g.visible = st >= i + 1);
  if (shopSign && shopSign.text !== shopName()) { shopSign.text = shopName(); shopSign.face.map = signText(shopSign.text, shopSign.w, shopSign.h); shopSign.face.needsUpdate = true; } }
{ // what gets added to the crate at each stage
  const wood = mat(0x9b6b4a), b1 = new THREE.Group(), b2 = new THREE.Group(), b3 = new THREE.Group(), b4 = new THREE.Group();
  const sg = signBoard('My Shop', 1.5, .36, 2.05); sg.position.set(0, 0, -.62); b1.add(sg); shopSign = signFaces[signFaces.length - 1];
  for (let i = 0; i < 7; i++) { const st = mesh(new THREE.BoxGeometry(.235,.05,1.25), mat(i % 2 ? 0xfff6e6 : 0xff8fa3), -.7 + i * .235, 1.52, .02); st.rotation.x = .28; b1.add(st); }
  b2.add(mesh(new THREE.BoxGeometry(.7,.06,.8), wood, 1.0, .7, 0)); [[.72,-.32],[1.28,-.32],[.72,.32],[1.28,.32]].forEach(([x, z]) => b2.add(mesh(new THREE.BoxGeometry(.07,.7,.07), wood, x, .35, z)));
  [0xff8fa3,0x8fdc8a,0xffc857].forEach((c, i) => { b2.add(mesh(new THREE.CylinderGeometry(.09,.09,.2,10), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.55 }), .82 + i * .18, .83, -.2)); b2.add(mesh(sph(.06), mat(c), .82 + i * .18, .8, -.2)); });
  b2.add(mesh(new THREE.BoxGeometry(.34,.05,.26), mat(0x7a3fa0), 1.0, .76, .2)); b2.add(mesh(new THREE.BoxGeometry(.3,.02,.22), mat(0xfff6e6), 1.0, .79, .2));
  b3.add(mesh(new THREE.BoxGeometry(1.5,1.2,.08), mat(0xffe3c4), 0, 1.0, -.56)); [0xc9b6ff,0x7ec8e3,0xffc857,0x8fdc8a].forEach((c, i) => b3.add(mesh(new THREE.BoxGeometry(.24,.22,.16), mat(c), -.5 + i * .33, 1.26, -.46))); b3.add(mesh(new THREE.BoxGeometry(1.4,.05,.2), wood, 0, 1.13, -.46));
  b3.add(mesh(new THREE.CylinderGeometry(.02,.02,.3,6), mat(0x3b2f4a), -.85, 1.75, .3)); b3.add(mesh(sph(.09), glow(0xfff3a0), -.85, 1.58, .3));
  const star = mesh(new THREE.OctahedronGeometry(.16), mat(0xffc857, { metalness:.5 }), 0, 2.42, -.62); b4.add(star);
  for (let i = 0; i < 6; i++) { const f = mesh(new THREE.ConeGeometry(.08,.16,3), mat([0xff8fa3,0x7ec8e3,0xffc857][i % 3]), -.62 + i * .25, 1.34 - Math.sin(i / 5 * Math.PI) * .08, .66); f.rotation.x = Math.PI; b4.add(f); }
  [b1, b2, b3, b4].forEach(g => { crate.add(g); shopBits.push(g); }); drawShop(); }
function shopEarn(total, sold) { const d = shopData(); d.earn += total; Object.entries(sold).forEach(([k, c]) => { if (c) d.by[k] = (d.by[k] || 0) + c; });
  let up = d.stage; SHOP_STAGES.forEach((st, i) => { if (d.earn >= st.at) up = Math.max(up, i); });
  if (up > d.stage) { d.stage = up; drawShop(); const st = SHOP_STAGES[up]; setTimeout(() => { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => chime(f), i * 120)); burst(crate.position.clone().setY(1.4), 0xffc857, 30);
      showCard(`<div class="kicker">MY SHOP</div><h2>Your ${SHOP_STAGES[up - 1].name.toLowerCase()} is now a ${st.name.toLowerCase()}</h2><p><b>New:</b> ${st.perk}</p>`, 'Next', () => showCard(`<div class="kicker">${st.term}</div><h2>${st.title}</h2><p>${st.real}</p><p class="gap">${st.today}</p>`, 'See my shop', () => shopCard())); }, 900); } }
function shopCard() { const d = shopData(), st = d.stage, next = SHOP_STAGES[st + 1];
  const top = Object.entries(d.by).filter(([k]) => ITEMS[k]).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const perDay = Object.entries(CROPS).map(([k, c]) => [k, Math.round((c.sell * shopBonus(k) - c.seed) / c.days)]).sort((a, b) => b[1] - a[1]);
  showCard(`<div class="kicker">MY SHOP: ${SHOP_STAGES[st].name.toUpperCase()}</div><h2>${esc(shopName())}</h2>
    <p>You have earned <b>${d.earn} coins</b> selling here.${next ? ` At <b>${next.at}</b> coins, your shop grows into a ${next.name.toLowerCase()}.` : ' It is as big as a shop gets. You built a brand.'}</p>
    ${next ? `<div style="height:12px;border-radius:6px;background:#eadfd0;margin-top:8px;overflow:hidden"><i style="display:block;height:100%;width:${Math.min(100, Math.round((d.earn - SHOP_STAGES[st].at) / (next.at - SHOP_STAGES[st].at) * 100))}%;background:#ffc857"></i></div>` : ''}
    <div class="jlist" style="margin-top:10px">${SHOP_STAGES.map((x, i) => `<button${i && i <= st ? ` data-sg="${i}"` : ''}>${i <= st ? '✅' : '◻️'} ${x.name} <span class="sub">${i === 0 ? 'Where every shop starts.' : i <= st ? x.perk : `At ${x.at} coins earned.`}</span></button>`).join('')}</div>
    <div class="jlist" style="margin-top:12px">${st >= 2 ? '<button id="shLed">My ledger: what earned the most</button><button id="shCrop">What each crop earns per day</button>' : ''}${st >= 1 && !(S.brand && S.brand.shop) ? '<button id="shNm">Change the name on the sign</button>' : ''}</div>
    ${st < 2 ? '<p class="sub" style="margin-top:8px">A ledger opens here when your shop becomes a stall. It is a record of what you sell.</p>' : ''}`, 'Close');
  if ($('shLed')) $('shLed').onclick = () => showCard(`<div class="kicker">MY LEDGER</div><h2>What has earned the most</h2>${top.length ? top.map(([k, c]) => `<p class="gap">${icon(k, ITEMS[k].kind)} ${ITEMS[k].name}: <b>${c} coins</b></p>`).join('') : '<p>Nothing sold yet since you started keeping books.</p>'}`, 'Back', shopCard);
  if ($('shCrop')) $('shCrop').onclick = () => showCard(`<div class="kicker">MY LEDGER</div><h2>What each crop earns per day</h2><p class="sub">The selling price, minus the seed, divided by the days it takes to grow.</p>${perDay.map(([k, v]) => `<p class="gap">${icon(k, 'crop')} ${CROPS[k].name}: <b>${v} coins a day</b></p>`).join('')}`, 'Back', shopCard);
  if ($('shNm')) $('shNm').onclick = () => { showCard('<div class="kicker">MY SHOP</div><h2>The name on the sign</h2><input id="shName" maxlength="24" value="' + esc(shopName()) + '" style="width:100%;font:16px \'Baloo 2\',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:8px"><button id="shSave" style="margin-top:8px">Put this name on the sign</button>', 'Back', shopCard);
    $('shSave').onclick = () => { const v = $('shName').value.replace(/[<>]/g, '').trim().slice(0, 24); if (!v) return toast('Type a name first.'); S.shopName = v; save(); drawShop(); toast('The sign is repainted.'); shopCard(); }; };
  document.querySelectorAll('[data-sg]').forEach(b => b.onclick = () => { const x = SHOP_STAGES[+b.dataset.sg]; showCard(`<div class="kicker">${x.term}</div><h2>${x.title}</h2><p>${x.real}</p><p class="gap">${x.today}</p>`, 'Back', shopCard); });
}
const sellPrice = k => (ITEMS[k].kind === 'dish' && bLevel('bakery') >= 2 ? 1.25 : 1) * shopBonus(k) * ((S.perks || []).includes('marketRep') ? 1.1 : 1) * ITEMS[k].sell * (S.mode === 'fisher' && ITEMS[k].kind === 'fish' ? 1.25 : 1) * (ITEMS[k].kind === 'specialty' && k !== S.specialty ? AWAY_MULT : 1);
// the crate: pick what to sell. Dishes, specialties, heirlooms, and bugs you might want to keep start unchecked.
const SELL_KINDS = ['crop','fruit','fish','dish','bug','specialty','heirloom'], KEEP_BY_DEFAULT = ['dish','specialty','heirloom'];
function useCrate() {
  const list = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && SELL_KINDS.includes(ITEMS[k].kind));
  if (!list.length) { if ((S.shop && S.shop.earn) > 0) return shopCard(); toast('Nothing to sell yet. Pick crops, fruit, or fish first.'); return; }
  const qty = Object.fromEntries(list.map(([k, n]) => [k, tutActive() || !KEEP_BY_DEFAULT.includes(ITEMS[k].kind) ? n : 0])); let cur = null; // how many of each to sell
  const draw = () => { const total = list.reduce((a, [k]) => a + Math.round(qty[k] * sellPrice(k)), 0), cn = cur ? S.bag[cur] : 0;
    showCard(`<div class="kicker">${esc(shopName()).toUpperCase()}</div><h2>Tap what to sell</h2>
      <div class="igrid">${list.map(([k,n]) => `<button class="itile ${qty[k] ? 'sel' : 'off'}" data-sl="${k}" ${cur === k ? 'style="outline:3px solid #ff8fa3"' : ''}><span class="ic">${icon(k, ITEMS[k].kind)}</span><b>${qty[k]} of ${n}</b><small>${esc(ITEMS[k].name)}<br>${Math.round(qty[k] * sellPrice(k))} coins</small>${qty[k] ? '<i class="chk">✓</i>' : ''}</button>`).join('')}</div>
      ${cur ? `<div class="steppers" style="margin-top:10px"><div>${esc(ITEMS[cur].name)}: sell <button id="slMinus" class="ghost">−</button> <b>${qty[cur]}</b> of ${cn} <button id="slPlus" class="ghost">+</button> <button id="slOne" class="ghost">Just 1</button></div></div>` : ''}
      <button id="slGo" ${total ? '' : 'disabled style="opacity:.5"'}>${total ? (tutActive() ? `Sell for ${total} coins` : `Open your stall: ${total} coins of goods`) : 'Pick something to sell'}</button>${tutActive() ? '' : ' <button id="slShop" class="ghost">My shop</button>'}`, 'Not now');
    document.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { const k = b.dataset.sl; if (cur === k) qty[k] = qty[k] ? 0 : S.bag[k]; else { cur = k; if (!qty[k]) qty[k] = S.bag[k]; } sfx('click'); draw(); });
    if (cur) { $('slMinus').onclick = () => { qty[cur] = Math.max(0, qty[cur] - 1); draw(); }; $('slPlus').onclick = () => { qty[cur] = Math.min(cn, qty[cur] + 1); draw(); }; $('slOne').onclick = () => { qty[cur] = 1; draw(); }; }
    if ($('slShop')) $('slShop').onclick = () => shopCard();
    $('slGo').onclick = () => { if (!total) { toast('Tap the things you want to sell first.'); return; }
      if (!tutActive()) { hideCard(); return stallGame(list.filter(([k]) => qty[k] > 0).map(([k]) => [k, qty[k]])); }
      const sold = Object.fromEntries(list.map(([k]) => [k, Math.round(qty[k] * sellPrice(k))])); list.forEach(([k]) => { if (qty[k]) bagAdd(k, -qty[k]); }); S.coins += total; if (!tutActive()) shopEarn(total, sold); S.soldPick = true; hideCard(); sfx('coin'); burst(crate.position, 0xffc857); floatText(`+${total} coins`, crate.position.clone());
      goal('sell', total); drawHud(); save(); tutSold(); };
  };
  draw();
}

// selling at your stall: shoppers walk up to the crate one at a time. Some pay the price. Some haggle, and you decide
let stall3 = null;
function stallGame(goods) { if (stall3 || cine || !goods.length) return; target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), cp = crate.position.clone(), out = V(0, 0, 1), side = V(1, 0, 0), stand = cp.clone().addScaledVector(out, -1.0);
  player.position.copy(stand); player.rotation.y = 0; cine = { hold:true }; document.body.classList.add('in-cine');
  const LOOKS = [[0xf2c9a0, 0xfff1de, 0xb98a63, 'round', 'apron', 0x8fdc8a], [0xb9c3d6, 0xeef1f6, 0x8a93a6, 'long', 'vest', 0xff8fa3], [0xe8a46a, 0xfff3e2, 0xc47a45, 'pointy', 'scarf', 0x86c7ff], [0x9b7b6a, 0xe5d2c2, 0x6f5548, 'round', 'cardigan', 0xffc857], [0xf6f1ea, 0xffffff, 0x3b2f4a, 'long', 'overalls', 0xc9b6ff]];
  const per = goods.length > 5 ? [...goods.slice(0, 4), ['mix', 0]] : goods; // at most 5 shoppers: the last one buys whatever is left
  const lines = per.map(([k, n]) => k === 'mix' ? { items:goods.slice(4), price:goods.slice(4).reduce((a, [kk, nn]) => a + Math.round(nn * sellPrice(kk)), 0) } : { items:[[k, n]], price:Math.round(n * sellPrice(k)) });
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="stMsg">Your stall is open.</p><div id="stBtns" class="fhbtns"></div><p class="sub" style="margin:6px 0 0">Earned so far: <b id="stEarn">0</b> coins</p>`; document.body.appendChild(hud);
  const msg = t => { const e = $('stMsg'); if (e) e.innerHTML = t; }, btns = (h, wire) => { const e = $('stBtns'); if (e) { e.innerHTML = h; wire && wire(); } };
  let i = -1, who = null, st = 'wait', t = 0, last = performance.now(), raf, earned = 0, haggled = false; const sold = {};
  const name = it => it.map(([k, n]) => `${n} ${n === 1 ? ITEMS[k].name.toLowerCase() : plural(k, n)}`).join(', ');
  const pay = (L, amt) => { L.items.forEach(([k, n]) => { bagAdd(k, -n); sold[k] = (sold[k] || 0) + Math.round(amt * (n * sellPrice(k)) / Math.max(1, L.price)); }); S.coins += amt; earned += amt; $('stEarn').textContent = earned; sfx('coin'); burst(cp.clone().setY(1), 0xffc857, 12); floatText(`+${amt} coins`, cp.clone()); drawHud(); };
  const leave = () => { st = 'leave'; t = 0; };
  const next = () => { i++; if (who) { scene.remove(who.g); who = null; } if (i >= lines.length) return finish();
    const lk = LOOKS[i % LOOKS.length], g = critter({ body:lk[0], belly:lk[1], ear:lk[2], earType:lk[3], outfit:{ style:lk[4], color:lk[5] } }); g.scale.setScalar(.55); scene.add(g);
    const from = cp.clone().addScaledVector(out, 3.2).addScaledVector(side, i % 2 ? 3 : -3), to = cp.clone().addScaledVector(out, .9); g.position.copy(from); who = { g, from, to }; st = 'walk'; t = 0; msg('A shopper is coming...'); btns(''); };
  const arrive = () => { const L = lines[i], hag = Math.random() < .45 && L.price >= 6; st = 'talk';
    if (!hag) { msg(`"I'd like your ${name(L.items)}, please."<br>They hold out <b>${L.price} coins</b>.`); btns('<button id="stTake">Take the coins</button>', () => { $('stTake').onclick = () => { pay(L, L.price); msg('"Thank you!"'); btns(''); leave(); }; }); return; }
    const offer = Math.max(1, Math.round(L.price * (.7 + Math.random() * .15)));
    msg(`"Your ${name(L.items)} look lovely. Would you take <b>${offer}</b> instead of ${L.price}?"`);
    btns(`<button id="stYes">Deal: ${offer} coins</button><button id="stNo" class="ghost">No, the price is ${L.price}</button>`, () => {
      const lesson = () => { if (haggled) return ''; haggled = true; return '<br><span class="sub"><b>Haggling:</b> the buyer offers less and the seller decides. Saying no keeps your price, but some buyers walk away.</span>'; };
      $('stYes').onclick = () => { pay(L, offer); msg('"Wonderful. Thank you!"' + lesson()); btns(''); leave(); };
      $('stNo').onclick = () => { if (Math.random() < .6) { pay(L, L.price); msg(`"Fair enough. ${L.price} it is."` + lesson()); } else { sfx('click'); msg('"Hmm. Maybe next time." They walk off. Your goods stay in your bag.' + lesson()); } btns(''); leave(); }; }); };
  const finish = () => { st = 'done'; if (earned) { shopEarn(earned, sold); goal('sell', earned); } S.soldPick = true; save(); drawHud();
    msg(earned ? `<b>Stall closed.</b> You earned ${earned} coins today.` : '<b>Stall closed.</b> Nobody bought anything this time.'); btns('<button id="stDone">Close</button>', () => { $('stDone').onclick = end; }); };
  const end = () => { cancelAnimationFrame(raf); hud.remove(); if (who) scene.remove(who.g); stall3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); save(); };
  const step = dt => { t += dt; if (who) { const g = who.g, inner = g.children[0];
      if (st === 'walk') { const k = Math.min(1, t / 1.8); g.position.lerpVectors(who.from, who.to, k); g.rotation.y = Math.atan2(who.to.x - who.from.x, who.to.z - who.from.z); if (inner) inner.position.y = Math.abs(Math.sin(t * 9)) * .06; if (k >= 1) { g.rotation.y = Math.PI + 2.3; if (inner) inner.position.y = 0; arrive(); } }
      else if (st === 'leave') { const k = Math.min(1, t / 1.6), back = who.from.clone().addScaledVector(side, i % 2 ? -6 : 6); g.position.lerpVectors(who.to, back, k); g.rotation.y = Math.atan2(back.x - who.to.x, back.z - who.to.z); if (inner) inner.position.y = Math.abs(Math.sin(t * 9)) * .06; if (k >= 1) next(); } }
    else if (st === 'wait' && t > .6) next();
    camera.position.lerp(cp.clone().addScaledVector(out, 3.4).addScaledVector(side, 1.6).setY(2.3), 1 - Math.pow(.02, dt)); camera.lookAt(cp.x, .7, cp.z + .4); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); if (stall3) raf = requestAnimationFrame(loop); };
  stall3 = { step, end, get state() { return { i, st, earned, n:lines.length }; } }; loop(); }

// --- neighbors ---
function talk(id) {
  const n = NEIGHBORS[id], firstToday = S.talked[id] !== S.day;
  if (firstToday) { S.talked[id] = S.day; S.hearts[id] = Math.min(10, S.hearts[id]+1); chime(698); goal('talk'); }
  if (heartScene(id)) return;
  const fz = festival(); if (fz && id === fz.host && !S.fests[fz.id + fz.year]) return festivalTalk(fz);
  if (id === 'nana' && S.quest < 4) return nanaQuest();
  if (id === 'drizzle' && S.q2 < 5) return drizzleQuest();
  if (id === 'drizzle' && S.q4 >= 5 && S.q5 === 0) return drizzleOldHeart();
  if (id === 'twins' && S.q3 < 7) return twinsQuest();
  if (id === 'lumen' && S.q4 < 5) return lumenQuest();
  if (id === 'nana' && S.q3 === 5) return nanaBread();
  if (id === 'drizzle' && featureOn('journey') && S.q2 >= 5 && (!S.shipPath || (S.shipYear && S.shipYear < islandYear() && S.shipAsked !== islandYear()))) return shipChoice();
  if (S.secretFor && S.secretFor[id]) { const it = S.secretFor[id]; delete S.secretFor[id]; save(); return openDialog(n.name, `Someone left a lovely ${ITEMS[it]?.name.toLowerCase() || 'gift'} on my doorstep last night. No note, nothing. I wonder who it was. Whoever it was, they made my whole week.`, neighborButtons(id), S.hearts[id]); }
  if (firstToday && startDilemma(id)) return;
  if (id === 'pip' && S.asked !== S.day && (S.quest >= 1 || S.day > 1)) return pipQuestion();
  const pool = S.hearts[id] >= 3 ? [...n.lines, ...n.heartLines] : [...n.lines];
  if (id === 'nana' && S.aha.includes('rope') && !S.bigGarden) pool.push("Those fence stakes by your garden? A bigger plot needs a perfect square corner. You know how to make one now, don't you?", "Try the fence stakes by your garden, dear. You learned something on that ship.");
  if (id === 'drizzle' && S.aha.includes('stars') && !S.used.includes('stars')) pool.push("Come fish at night, sailor. The biggest fish hide under the star that stays.", "Night fishing! Find the still star and the manta rays will find you.");
  if (id === 'twins' && S.aha.includes('lever') && !S.boulder) pool.push("Moss: There is a big boulder by the sunflowers. Fern: Something is carved under it. Moss: If only we knew about levers. Fern: YOU do!");
  const line = pool[(S.day*7 + Math.floor(Math.random()*pool.length)) % pool.length];
  openDialog(n.name, line, neighborButtons(id), S.hearts[id]); save();
}
function neighborButtons(id) {
  const b = [];
  if (id === 'nana' && S.tut === 9 && !VISIT && !founderOn() && (S.hq || 0) < 4) b.push({ label:!S.hq ? 'Ask about the 2 trees' : S.hq === 1 && have('fiber') >= 8 ? 'Give Nana 8 grass' : 'About the hammock', fn:() => { closeDialog(); hammockTalk(); } });
  if (HELP[id] && S.tut === 9 && !VISIT && !(S.helped || []).includes(id)) b.push({ label:HELP[id].label, fn:() => { closeDialog(); HELP[id].run(); } });
  if (id === 'pip') {
    b.push({ label:'Buy seeds', fn:seedShop }, { label:'Buy furniture', fn:furnShop });
    const o = pipOrder();
    if (o && S.bag[o.crop]) b.push({ label:`Give Pip the ${CROPS[o.crop].name} for ${o.pay} coins`, fn:() => {
      bagAdd(o.crop, -1); S.coins += o.pay; S.order.done = true; S.hearts.pip = Math.min(10, S.hearts.pip+1); sfx('coin'); save(); drawHud();
      openDialog('Pip', `A ${CROPS[o.crop].name}! You are the best. Here is ${o.pay} coins, as promised.`, [], S.hearts.pip); } });
  }
  if (id === 'mabel') b.push({ label:'Cook', fn:() => { closeDialog(); useBakery(); } });
  if (id === 'hoot') b.push({ label:'Read a book', fn:() => { closeDialog(); useLibrary(); } });
  if (id === 'allegra') b.push({ label:'Play music', fn:() => { closeDialog(); useMusicHall(); } });
  if (id === 'sage') b.push({ label:"Today's saying", fn:() => { closeDialog(); useTemple(); } });
  if (id === 'pip' && featureOn('market') && !S.brand && (S.home || 0) >= 3 && !VISIT) b.push({ label:"Maker's mark", fn:() => { closeDialog(); openDialog('Pip', "You make such good things! You know what real makers do? They put their own mark on everything, so people know who made it. Let's make yours. Then you can sell at the Trading Post by your garden.", [{ label:'Make my mark', fn:() => { closeDialog(); brandEditor(() => designStudio()); } }], S.hearts.pip); } });
  if (id === 'nana' && featureOn('expand') && EXPANSIONS[S.expand || 0] && (S.home || 0) >= 3 && !VISIT) b.push({ label:'Grow the island', fn:() => { closeDialog(); expandCard(); } });
  if (S.gifted[id] !== S.day) b.push({ label:'Give a gift', fn:() => giftPicker(id) });
  return b;
}
function pipOrder() {
  if (!S.order || S.order.day !== S.day) {
    const opts = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(season()) && !CROPS[k].locked);
    const crop = opts[Math.floor(Math.random()*opts.length)];
    S.order = { day:S.day, crop, pay:Math.round(CROPS[crop].sell * 2 * ((S.perks || []).includes('pipBonus') ? 1.25 : 1)), done:false };
  }
  return S.order.done ? null : S.order;
}
function seedShop() {
  closeDialog();
  const s = season(), o = pipOrder();
  const crops = Object.entries(CROPS).filter(([,c]) => c.seasons.includes(s) && (!c.locked || S.q4 >= 5));
  const draw = () => showCard(`<div class="kicker">PIP'S SEEDS</div><h2>${SEASONS[s]} seeds</h2><p>You have ${S.coins} coins.</p>${o && !o.done ? `<p class="itinfo">Today Pip will pay ${o.pay} coins for 1 ${CROPS[o.crop].name}. That is more than the wooden crate pays. ${S.bag[o.crop] ? 'You have 1: talk to Pip and tap Give Pip the ' + CROPS[o.crop].name + '.' : 'Grow 1 and bring it to him.'}</p>` : ''}
    <div class="jlist">${crops.map(([k,c]) => {
      return `<div class="seedrow"><span class="ic">${icon(k)}</span><div class="si"><b>${c.name}</b> <small>${c.seed} coins. Sells for ${c.sell} after ${c.days} days.${S.seeds[k] ? ` You have ${S.seeds[k]}.` : ''}</small></div>
        <div class="sb">${[1,5,10].map(n => `<button data-sb="${k}:${n}" class="${S.coins >= c.seed * n ? '' : 'ghost'}">Buy ${n}</button>`).join('')}</div></div>`; }).join('')}</div>
    ${S.stations.furnace ? '<button id="buyTin" class="ghost">Tin, 15 coins</button>' : ''}`, 'Done', () => talk('pip'));
  const wire = () => { draw();
    document.querySelectorAll('[data-sb]').forEach(b => b.onclick = () => { const [k, n] = b.dataset.sb.split(':'), c = CROPS[k], cost = c.seed * +n;
      if (S.coins < cost) { toast(`Not enough coins. ${n} ${c.name} seeds cost ${cost}.`); return; }
      S.coins -= cost; S.seeds[k] = (S.seeds[k] || 0) + +n; S.sel = k; sfx('coin'); drawHud(); save(); wire(); });
    if ($('buyTin')) $('buyTin').onclick = () => { if (S.coins < 15) { toast('Not enough coins.'); return; } S.coins -= 15; bagAdd('tin'); sfx('coin'); save(); drawHud(); toast('+1 tin. Pip: Imported! Do not ask from how far.'); wire(); };
  };
  wire();
}
function furnShop(tab) {
  closeDialog();
  const list = Object.entries(FURN).filter(([,f]) => !f.gift).map(([k,f]) => `<button data-f="${k}">${f.name} <span class="sub">${f.price} coins${S.furn[k] ? `. You have ${S.furn[k]}` : ''}</span></button>`).join('');
  const swatch = (kind, map) => Object.entries(map).map(([hx, name]) => { const own = S.paints.includes(hx), on = S[kind] === hx;
    return `<button data-paint="${kind}:${hx}"><span class="dot" style="display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin-right:6px;background:#${hx.slice(2)}"></span>${name} <span class="sub">${on ? 'on your home now' : own ? 'owned' : ''}</span></button>`; }).join('');
  if (!tab) { showCard(`<div class="kicker">PIP'S FURNITURE</div><h2>Make your home cozy</h2><p>You have ${S.coins} coins.</p><div class="jlist"><button id="fsF">Furniture</button><button id="fsR">Roof paint</button><button id="fsW">Wall paint</button></div>`, 'Done');
    $('fsF').onclick = () => furnShop('furn'); $('fsR').onclick = () => furnShop('roof'); $('fsW').onclick = () => furnShop('wall'); return; }
  if (tab === 'furn') showCard(`<div class="kicker">PIP'S FURNITURE</div><h2>Furniture</h2><p>You have ${S.coins} coins. Place furniture inside your home.</p><div class="jlist">${list}</div>`, 'Back', () => furnShop());
  else showCard(`<div class="kicker">PIP'S FURNITURE</div><h2>${tab === 'roof' ? 'Roof paint' : 'Wall paint'}</h2><p>You have ${S.coins} coins. Each new color costs ${PAINT_PRICE} coins.</p><div class="jlist">${swatch(tab, tab === 'roof' ? ROOFS : WALLS)}</div>`, 'Back', () => furnShop());
  document.querySelectorAll('[data-paint]').forEach(b => b.onclick = () => {
    const [kind, hx] = b.dataset.paint.split(':');
    if (!S.paints.includes(hx)) { if (S.coins < PAINT_PRICE) { toast('Not enough coins.'); return; } S.coins -= PAINT_PRICE; S.paints.push(hx); sfx('coin'); }
    S[kind] = hx; if (kind === 'wall') S.wallOn = true; applyPaint(); burst(house.position, +hx, 16); save(); drawHud(); toast('Fresh paint on your home!'); furnShop(kind);
  });
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    const k = b.dataset.f, f = FURN[k];
    if (S.coins < f.price) { toast('Not enough coins.'); return; }
    S.coins -= f.price; S.furn[k] = (S.furn[k]||0) + 1; sfx('coin'); save(); drawHud(); drawRoom(); toast(`Bought a ${f.name}! Outlines show where it can go.`); furnShop('furn');
  });
}
function giftPicker(id) {
  closeDialog();
  const opts = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && ITEMS[k].kind !== 'quest');
  if (!opts.length) { toast('Nothing to give. Pick crops, fruit, or fish first.'); return; }
  showCard(`<div class="kicker">GIVE A GIFT</div><h2>Gift for ${NEIGHBORS[id].name}</h2><p>Everyone has things they love and things they can't stand. Watch how they react.</p>
    <div class="igrid">${opts.map(([k,n]) => `<button class="itile" data-g="${k}"><span class="ic">${icon(k, ITEMS[k].kind)}</span><b>${n}</b><small>${esc(ITEMS[k].name)}</small></button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
    const k = b.dataset.g, tier = tasteOf(TASTES[id], k, ITEMS[k].kind), dh = TIER_HEARTS[tier];
    hideCard(); bagAdd(k, -1); S.gifted[id] = S.day; goal('gift');
    S.hearts[id] = Math.max(0, Math.min(10, S.hearts[id] + dh));
    S.tastesKnown = S.tastesKnown || {}; S.tastesKnown[id] = { ...(S.tastesKnown[id] || {}), [k]:tier };
    if (dh > 0 && featureOn('journey')) karma('kind', dh > 1 ? 1 : 0); if (tier === 0) petHappy();
    sfx(tier === 0 ? 'heart' : tier <= 2 ? 'pick' : 'click'); burst(npcs[id].position, [0xff8fa3, 0xffe27a, 0xffffff, 0xb3aabb, 0x7a7a8a][tier]);
    const said = (REACT[id] || REACT.nana)[tier], note = dh > 0 ? ` (+${dh} heart${dh > 1 ? 's' : ''})` : dh < 0 ? ` (${dh} heart${dh < -1 ? 's' : ''})` : '';
    save(); drawHud(); if (!(dh > 0 && heartScene(id))) openDialog(NEIGHBORS[id].name, said + note, [], S.hearts[id]);
  });
}
// the Friends page: hearts, and every taste you have discovered so far
function openFriends() {
  const ids = Object.keys(NEIGHBORS).filter(id => S.hearts[id] != null && (S.talked[id] != null || S.hearts[id] > 0));
  const K = S.tastesKnown || {};
  showCard(`<div class="kicker">FRIENDS</div><h2>Your neighbors</h2><p>Gifts you have tried, and how each friend felt about them.</p>
    ${ids.map(id => { const known = Object.entries(K[id] || {}); const row = t => known.filter(([,v]) => v === t).map(([k]) => icon(k, ITEMS[k]?.kind)).join(' ');
      return `<div class="friend"><b>${NEIGHBORS[id].name}</b> <span class="hearts">${'♥'.repeat(S.hearts[id] || 0)}${'♡'.repeat(10 - (S.hearts[id] || 0))}</span>
        ${known.length ? ['Loves','Likes','Okay with','Dislikes','Hates'].map((l, t) => row(t) ? `<div class="tr"><small>${l}</small> ${row(t)}</div>` : '').join('') : ''}</div>`; }).join('')}
    ${Object.values(S.people || {}).map(p => { const known = Object.entries(p.known || {}), row = t => known.filter(([,v]) => v === t).map(([k]) => icon(k, ITEMS[k]?.kind)).join(' ');
      return `<div class="friend"><b>${esc(p.name)}</b> <small>${PERSONALITIES[p.pers].word} ${p.species}, ${p.status === 'resident' ? 'lives here' : p.status === 'visiting' ? 'visiting now' : 'moved on'}</small> <span class="hearts">${'♥'.repeat(p.hearts)}${'♡'.repeat(10 - p.hearts)}</span>
        ${known.length ? ['Loves','Likes','Okay with','Dislikes','Hates'].map((l, t) => row(t) ? `<div class="tr"><small>${l}</small> ${row(t)}</div>` : '').join('') : ''}</div>`; }).join('')}`, 'Back', openJournal);
}
// --- visiting villagers and the neighbors who stay ---
const peopleGroup = new THREE.Group(); scene.add(peopleGroup); lateClicks.push(peopleGroup);
const pick = a => a[Math.floor(Math.random() * a.length)];
const GIFTABLE = () => Object.keys(ITEMS).filter(k => ['crop','fruit','fish','dish','bug','specialty'].includes(ITEMS[k].kind));
function newPerson() {
  const sp = pick(SPECIES), [body, belly] = pick(sp.colors), pers = pick(Object.keys(PERSONALITIES)), P = PERSONALITIES[pers];
  const used = Object.values(S.people || {}).map(p => p.name), name = pick(NAMES.filter(n => !used.includes(n))) || pick(NAMES);
  const pool = GIFTABLE().sort(() => Math.random() - .5), taken = new Set([...P.loves, ...P.hates]);
  const take = n => pool.filter(k => !taken.has(k)).slice(0, n).map(k => (taken.add(k), k));
  const tastes = { loves:[...P.loves, ...take(1)], likes:take(4), dislikes:take(2), hates:[...P.hates] };
  const outfit = { style:pick(OUTFITS), color:pick(TOP_COLORS), trim:0xffffff, acc:Math.random() < .3 ? pick(['glasses','bowtie','scarf']) : undefined };
  return { vid:'v' + Date.now().toString(36), name, species:sp.id, pers, look:{ ...sp.look, body, belly, ear:body, outfit }, tastes, hearts:0, known:{}, status:'visiting', met:S.day, leaves:S.day + 2 + Math.floor(Math.random() * 2) };
}
// travelers camp on Orchard Isle once its bridge is built (lots of open space); before that, two quiet spots at the back of home
const campSpots = () => S.bridge ? [[0,-6.4],[6.2,-2.6],[-4.8,-5.6]].map(([x, z]) => [ORCH_POS.x + x, ORCH_POS.z + z]) : [[-6.5,-1.5],[-4.5,-5.75]];
const CAMP_SPOTS = [[-6.5,-1.5],[-4.5,-5.75]];
const spotY = (x, z) => Math.hypot(x - ORCH_POS.x, z - ORCH_POS.z) < 9 ? ORCH_POS.y : 0;
function freeSpot(list) { return list.find(([x,z]) => (spotY(x, z) !== 0 || !blockedAt(x, z)) && !(S.builds || []).some(b => Math.hypot(b.x - x, b.z - z) < 1.6) && !Object.values(S.people || {}).some(p => p.spot && Math.hypot(p.spot[0] - x, p.spot[1] - z) < 2)); }
function homeSpots() { return [...ownedLobes().flatMap(L => [[L.e.x + 1.2, L.e.z - 1], [L.e.x - 1.4, L.e.z + 1.2]]), [-6.5,-1.5],[-4.5,-5.75],[-3.2,-5.3]]; }
function tent(color) { const g = new THREE.Group(); const t = mesh(new THREE.ConeGeometry(.9, 1.3, 4), mat(color), 0, .65, 0); t.rotation.y = Math.PI/4; g.add(t);
  g.add(mesh(new THREE.BoxGeometry(.35, .6, .05), mat(0x3b2f4a), 0, .3, .5)); g.add(mesh(new THREE.CylinderGeometry(.03,.03,1.6,5), mat(0x9b6b4a), 0, .8, 0)); return g; }
function cottage(color) { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(1.5, 1, 1.3), mat(0xfff1d6), 0, .5, 0));
  const roof = mesh(new THREE.ConeGeometry(1.25, .8, 4), mat(color), 0, 1.4, 0); roof.rotation.y = Math.PI/4; g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(.35, .55, .05), mat(0x9b6b4a), 0, .28, .66)); g.add(mesh(new THREE.BoxGeometry(.3, .3, .05), mat(0x9fd3ff), .45, .6, .66)); return g; }
function drawPeople() {
  peopleGroup.children.slice().forEach(c => peopleGroup.remove(c));
  if (VISIT || !featureOn('villagers')) return;
  Object.values(S.people || {}).filter(p => p.status === 'visiting' || p.status === 'resident').forEach(p => {
    const spots = p.status === 'resident' ? homeSpots() : campSpots(); // older saves may hold a spot that's no longer used
    if (!p.spot || !spots.some(s => s[0] === p.spot[0] && s[1] === p.spot[1])) { p.spot = null; const sp = freeSpot(spots); if (!sp) return; p.spot = sp; save(); }
    const [x, z] = p.spot, y = spotY(x, z), home = p.status === 'resident' ? cottage(p.look.outfit.color) : tent(p.look.outfit.color);
    home.position.set(x, y, z - .9); peopleGroup.add(home);
    const c = critter(p.look); c.scale.setScalar(.85); c.position.set(x + .9, y, z + .1); c.rotation.y = -.4; c.userData.kind = 'visitor'; c.userData.vid = p.vid; peopleGroup.add(c);
    if (p.talked == null) { const bb = new THREE.Sprite(new THREE.SpriteMaterial({ map:BUBBLE['!'], transparent:true, depthTest:false })); bb.scale.setScalar(.55); bb.position.set(0, 2.3, 0); c.add(bb); }
    home.userData = { kind:'visitor', vid:p.vid };
  });
}
function personLine(p) { const P = PERSONALITIES[p.pers]; return pick(P.hi); }
function talkPerson(vid) {
  const p = S.people[vid]; if (!p) return;
  if (p.talked == null) setTimeout(drawPeople, 50);
  if (p.talked !== S.day) { p.talked = S.day; p.hearts = Math.min(10, p.hearts + 1); chime(698); goal('talk'); save(); }
  const b = [];
  if (p.gifted !== S.day) b.push({ label:'Give a gift', fn:() => { closeDialog(); personGift(vid); } });
  if (!p.request && p.status === 'visiting') { const s = season(), opts = [...Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(s) && !CROPS[k].locked), 'apple', 'peach', 'minnow', 'trout'];
    const k = pick(opts), n = 1 + Math.floor(Math.random() * 3); p.request = { k, n, done:false }; save(); }
  if (p.request && !p.request.done && have(p.request.k) >= p.request.n) { const r = p.request; b.push({ label:`Give ${r.n} ${plural(r.k, r.n)}`, fn:() => { // the button only shows once you have enough to give
    bagAdd(r.k, -r.n); r.done = true; const pay = Math.round(ITEMS[r.k].sell * r.n * 1.6) + 20; S.coins += pay; p.hearts = Math.min(10, p.hearts + 1); if (featureOn('journey')) karma('kind', 1); lean('friend');
    save(); drawHud(); sfx('coin'); closeDialog(); openDialog(p.name, `You found them! Thank you so much. Here, ${pay} coins.`, [], p.hearts); } }); }
  if (p.status === 'visiting' && p.hearts >= 3 && Object.values(S.people).filter(x => x.status === 'resident').length < 3 && (S.home || 0) >= 3)
    b.push({ label:'Invite them to stay', fn:() => { closeDialog(); invitePerson(vid); } });
  const extra = p.request && !p.request.done ? ' ' + pick(REQUEST_LINES).replace('{item}', plural(p.request.k, p.request.n)).replace('{n}', p.request.n) + (have(p.request.k) < p.request.n ? ` (${have(p.request.k)}/${p.request.n})` : '') : '';
  const tail = p.status === 'visiting' && p.leaves - S.day <= 1 ? ' I head out tomorrow, by the way.' : '';
  openDialog(p.name, personLine(p) + extra + tail, b, p.hearts);
}
function personGift(vid) {
  const p = S.people[vid], opts = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && ITEMS[k].kind !== 'quest');
  if (!opts.length) { toast('Nothing to give. Pick crops, fruit, or fish first.'); return; }
  showCard(`<div class="kicker">GIVE A GIFT</div><h2>Gift for ${p.name}</h2><p>You don't know their tastes yet. Watch how they react.</p>
    <div class="igrid">${opts.map(([k,n]) => `<button class="itile" data-pg="${k}"><span class="ic">${icon(k, ITEMS[k].kind)}</span><b>${n}</b><small>${esc(ITEMS[k].name)}</small></button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { const k = b.dataset.pg, tier = tasteOf(p.tastes, k, ITEMS[k].kind), dh = TIER_HEARTS[tier];
    hideCard(); bagAdd(k, -1); p.gifted = S.day; p.hearts = Math.max(0, Math.min(10, p.hearts + dh)); p.known[k] = tier; goal('gift'); lean('friend');
    const said = [`A ${ITEMS[k].name.toLowerCase()}?! How did you know? I love these!`, 'Oh, nice! Thank you!', 'Oh, thanks!', 'Hm. Not really my thing, but thanks.', "Ugh. Sorry. I really can't stand these."][tier];
    const note = dh > 0 ? ` (+${dh} heart${dh > 1 ? 's' : ''})` : dh < 0 ? ` (${dh} heart${dh < -1 ? 's' : ''})` : '';
    sfx(tier === 0 ? 'heart' : tier <= 2 ? 'pick' : 'click'); save(); openDialog(p.name, said + note, [], p.hearts); });
}
function invitePerson(vid) {
  const p = S.people[vid], P = PERSONALITIES[p.pers]; p.status = 'resident'; p.spot = null; lean('friend', 2);
  save(); drawPeople(); [523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*150));
  const c = peopleGroup.children.find(x => x.userData.vid === vid); if (c) burst(c.position.clone().setY(1), 0xffc857, 26);
  openDialog(p.name, P.invite, [], p.hearts);
}
// each morning: visitors pack up when their stay is over, and sometimes someone new arrives
function peopleNewDay() {
  if (VISIT || !featureOn('villagers')) return;
  S.people = S.people || {}; const notes = [];
  Object.values(S.people).forEach(p => { if (p.status === 'visiting' && S.day >= p.leaves) { p.status = 'left'; notes.push(`${p.name} packed up the tent and left a note: "Thanks for having me. I'll never forget your island."`); } });
  const visiting = Object.values(S.people).some(p => p.status === 'visiting');
  if (!visiting && Math.random() < .4) { const p = newPerson(); S.people[p.vid] = p; notes.push(`A traveler named ${p.name} is camping on ${S.bridge ? 'Orchard Isle' : 'your island'}! Go say hi.`); }
  if (notes.length) { S.mailLog = [...(S.mailLog || []), ...notes].slice(-20); setTimeout(() => toast(notes.at(-1)), 1500); }
  drawPeople();
}
function bringVisitor() { S.people = S.people || {}; Object.values(S.people).forEach(p => { if (p.status === 'visiting') p.status = 'left'; }); const p = newPerson(); S.people[p.vid] = p; save(); drawPeople(); return p; }
drawPeople();
// --- heart scenes: little stories at 3 and 6 hearts ---
function heartScene(id) {
  const h = S.hearts[id], key3 = id + '3', key6 = id + '6';
  if (!SCENES[key3]) return false;
  if (h >= 3 && !S.scenes.includes(key3)) { S.scenes.push(key3); save(); SCENES[key3](); return true; }
  if (h >= 6 && !S.scenes.includes(key6)) { S.scenes.push(key6); save(); SCENES[key6](); return true; }
  return false;
}
const SCENES = {
  nana3() {
    sfx('heart');
    openDialog('Nana Gale', "Come sit with me, dear. I weave from a punched card. A hole lifts a thread. A blank leaves it down. Computers use the same idea: a hole is 1, a blank is 0. This row reads hole, blank, hole, hole: 1011. Counting in 2s, the places are worth 8, 4, 2, and 1. What number is it?", [
      { label:'1,011', fn:() => openDialog('Nana Gale', "That is how it looks written down. Add up the places with a hole: 8, 2, and 1.", [{ label:'Try again', fn:SCENES.nana3 }]) },
      { label:'3', fn:() => openDialog('Nana Gale', "That is how many holes there are. But each place is worth a different amount: 8, 4, 2, 1.", [{ label:'Try again', fn:SCENES.nana3 }]) },
      { label:'11', fn:() => { closeDialog(); showAha('loom', () => openDialog('Nana Gale', "8, plus 2, plus 1. A loom and a laptop speak the same language, dear.", [], S.hearts.nana)); } },
    ], S.hearts.nana);
  },
  nana6() {
    S.furn.rocker = (S.furn.rocker||0) + 1; sfx('heart'); save();
    openDialog('Nana Gale', "Your grandmother and I found this island when it was just a rock with 1 tree. She said memory is a kind of farming: you plant what you know, and it grows in someone else. I kept her rocking chair all these years. It belongs in your home now.", [
      { label:'Thank you, Nana', fn:() => { closeDialog(); toast("You got Grandma's Rocker! Place it inside your home."); } }], S.hearts.nana);
  },
  pip3() {
    sfx('heart');
    openDialog('Pip', "Can I tell you something? I get lost. A lot. How do real birds fly across whole oceans without getting lost?", [
      ...['The sun','The stars','Something invisible'].map(a => ({ label:a, fn:() => openDialog('Pip', "All 3?! Birds are so much cooler than me.", [{ label:'How do they do it?', fn:() => { closeDialog(); showAha('migration'); } }], S.hearts.pip) })),
    ], S.hearts.pip);
  },
  pip6() {
    S.furn.sign = (S.furn.sign||0) + 1; sfx('heart'); save();
    openDialog('Pip', "I made this for my shop. The one I do not have yet. But you believe in me, so... I want you to keep it until I do. It is my lucky sign!", [
      { label:'I will keep it safe', fn:() => { closeDialog(); toast("You got Pip's Lucky Sign! Place it inside your home."); } }], S.hearts.pip);
  },
  drizzle3() {
    sfx('heart');
    openDialog('Captain Drizzle', "Sit, sit. Want to hear what holds the sky up? Old sailors say there is a giant tree. Its roots grip the deepest cloud. Its branches hold every island. The Great Gust shook that tree. That is why we all fell apart.", [
      { label:'Is that true?', fn:() => { closeDialog(); showAha('worldtree', () => openDialog('Captain Drizzle', "True or not, it is a good story. And good stories keep sailors going.", [], S.hearts.drizzle)); } }], S.hearts.drizzle);
  },
  lumen3() {
    sfx('heart');
    openDialog('Lumen', "Can I show you something? I shine plain white light into this crystal, and... look. A rainbow comes out the other side. Where do you think the colors come from?", [
      ...['The crystal adds them','They were in the light','Magic'].map(a => ({ label:a, fn:() => { closeDialog(); showAha('prism', () => openDialog('Lumen', "Every color, hiding inside white. I think about that a lot.", [], S.hearts.lumen)); } })),
    ], S.hearts.lumen);
  },
  lumen6() {
    S.furn.painting = (S.furn.painting||0) + 1; sfx('heart'); save();
    openDialog('Lumen', "I painted this for you. It is the night you first crossed the bridge of light. I have never given anyone a painting before.", [
      { label:'I love it', fn:() => { closeDialog(); toast("You got Lumen's Painting! Place it inside your home."); } }], S.hearts.lumen);
  },
  twins3() {
    sfx('heart');
    openDialog('Moss & Fern', "Fern: Want to know a secret? Moss: We counted the spirals in a sunflower. Fern: 1, 1, 2, 3, 5, 8, 13, 21... Moss: What comes next?", [
      ...[29, 34, 42].map(n => ({ label:String(n), fn:() => n === 34
        ? (closeDialog(), showAha('fibonacci', () => openDialog('Moss & Fern', "Moss: 21 spirals one way. Fern: 34 the other. Moss: Every time!", [], S.hearts.twins)))
        : openDialog('Moss & Fern', "Fern: Close! Moss: Hint: add the last 2 numbers together.", [{ label:'Try again', fn:SCENES.twins3 }]) })),
    ], S.hearts.twins);
  },
  twins6() {
    S.furn.mushroom = (S.furn.mushroom||0) + 1; sfx('heart'); save();
    openDialog('Moss & Fern', "Moss: We grow these deep in our tunnels. Fern: They glow in the dark. Moss: So you never feel lost. Fern: Take 1 for your home!", [
      { label:'Thank you both', fn:() => { closeDialog(); toast('You got a Glow Mushroom Lamp! Place it inside your home.'); } }], S.hearts.twins);
  },
  drizzle6() {
    bagAdd('puffer', 1); sfx('heart'); save();
    openDialog('Captain Drizzle', "You know, I had no crew for years. Just me and the fish. Now I have a friend. Here. The rarest fish I ever caught. A pufferfish. Do not eat it. Or do. It is your fish.", [], S.hearts.drizzle);
  },
};
function festivalTalk(f) {
  sfx('heart');
  const card = f.aha || f.id, host = NEIGHBORS[f.host].name;
  openDialog(host, f.line, [
    { label:'Celebrate', fn:() => { closeDialog(); S.fests[f.id + f.year] = true; S.coins += 30; save(); drawHud(); burst(npcs[f.host].position, f.color, 24);
      const thanks = () => toast(`${host} gave you 30 coins. Happy ${f.name}!`);
      S.aha.includes(card) ? (thanks(), sfx('coin')) : playFirst(card, () => showAha(card, thanks)); } }], S.hearts[f.host]);
}

// --- chapter 1 ---
function nanaQuest() {
  const h = S.hearts.nana;
  if (S.quest === 0) {
    S.quest = 1; if (S.tut === 1) tutAfterGreeting(); else spawnDigs(); drawHud(); save();
    openDialog('Nana Gale', `Oh! You must be ${S.name || 'the new Keeper'}. You have her eyes. See that gold sparkle by your garden? Something of hers is buried there. Tap it to dig.`, [], h);
  } else if (S.quest === 1) openDialog('Nana Gale', `Tap the gold sparkles to dig, dear. New sparkles show up each morning.`, neighborButtons('nana'), h);
  else if (S.quest === 2) openDialog('Nana Gale', "3 memories! Now, the old stone dial by your garden. Tap it when its shadow is the very shortest. Do not ask me why. Your grandmother always did.", neighborButtons('nana'), h);
  else if (S.quest === 3) openDialog('Nana Gale', "This is her Wind Bell frame. The big pipe survived, but the small ones are all mixed up. Hang the 3 that sound sweetest with the big one.", [{ label:'Tune the bell', fn:() => { closeDialog(); openBell(); } }, ...neighborButtons('nana')], h);
  save();
}
function pipQuestion() {
  const q = QUESTIONS[S.qi % QUESTIONS.length];
  openDialog("Pip's Big Question", q.q, [
    ...q.a.map((a, i) => ({ label:a, fn:() => {
      S.asked = S.day; S.qi++; save();
      openDialog('Pip', q.r[i], [{ label:'Tell me more', only:true, fn:() => { closeDialog(); showAha(q.id); } }], S.hearts.pip, 'pip'); // his reply first, then one button opens the card
    }})),
    { label:'Not today', fn:() => { S.asked = S.day; save(); talk('pip'); } },
  ], S.hearts.pip, 'pip');
}
function dig(i) {
  const d = S.digs[i];
  d.n++; sfx('dig'); burst(digGroups[i].position, 0x9b6b4a, 8);
  if (d.n < 3) { toast(`${LAYERS[d.n - 1]} Tap again to dig deeper.`); drawDigs(); save(); return; }
  const r = RELICS[S.relics];
  S.relics++; S.digs.splice(i, 1); goal('dig');
  if (S.relics >= RELICS.length) { S.quest = Math.max(S.quest, 2); S.digs = []; }
  drawDigs(); drawHud(); save(); // no message here: the card that opens next says what you dug up
  const after = () => showAha(r.id, () => { if (S.tut === 2) return tutAfterFirstMemory(); });
  if (RELIC_PLAY[r.id] && !S.aha.includes(r.id)) { S.aha.push(r.id); save(); } // kept even if the game is closed halfway through
  setTimeout(() => RELIC_PLAY[r.id] ? RELIC_PLAY[r.id](after) : after(), 700);
}
function useSundial() {
  const h = hour();
  if (S.quest < 2) { toast('An old sundial. Its shadow moves with the sun.'); return; }
  if (S.quest > 2) { toast('The sundial. When its shadow is shortest, it is noon.'); return; }
  if (h >= 11.5 && h <= 12.5) { S.quest = 3; save(); drawHud(); showAha('sundial'); }
  else if (h < 11.5) toast('Not noon yet. Come back at 12 PM. The clock is at the top of the screen.');
  else toast('Noon has passed. Try again tomorrow at 12 PM.');
}
function openBell() {
  const picked = new Set();
  const draw = (msg='') => {
    showCard(`<div class="kicker">THE WIND BELL</div><h2>Tune the pipes</h2>
      <p>Tap a pipe to hear it with the big pipe. Pick the 3 simplest fractions, then tap Ring the bell. Each pipe is a fraction as long as the big pipe. <b>Simple fractions with small numbers sound sweet. Messy fractions with big numbers clash.</b></p>
      <div class="jlist">${CHIMES.map((c,i)=>`<button data-i="${i}" style="${picked.has(i)?'background:#ffc857':''}">${picked.has(i)?'✓ ':''}Pipe ${i+1}: ${c.label}</button>`).join('')}</div>
      <p style="margin-top:10px;min-height:22px;font-weight:700">${msg}</p>
      <button id="ring">Ring the bell</button> <button id="deaf" class="ghost">Give me a hint</button> <button id="later" class="ghost">Later</button>`, null);
    $('deaf').onclick = () => draw('Hint: the 3 simplest are 1/2, 2/3, and 3/4.');
    document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, base = 262;
      if (muted) toast('Turn sound on to hear the pipes.');
      chime(base); chime(base * CHIMES[i].r);
      picked.has(i) ? picked.delete(i) : picked.add(i); draw();
    });
    $('later').onclick = hideCard;
    $('ring').onclick = () => {
      if (picked.size !== 3) return draw('Pick exactly 3 pipes.');
      if ([...picked].some(i => !CHIMES[i].sweet)) { chime(262); chime(262*16/15); return draw('One of those clashes. Look for the smallest numbers: 1/2 is simpler than 8/15.'); }
      hideCard();
      S.quest = S.bridge ? 5 : 4; S.coins += 50; bell.visible = true; save(); drawHud(); burst(bell.position, 0xffc857, 20);
      [262,330,392,524,660].forEach((f,i)=>setTimeout(()=>chime(f),i*220));
      setTimeout(() => showAha('bell', () => openDialog('Nana Gale', "Listen... Far away, another bell just answered. Someone is out there. Fix the broken bridge, dear. I put 50 coins in your pocket to help.", [], S.hearts.nana)), 1300);
    };
  };
  draw();
}
const bridgeCost = c => Math.round(c * (S.mode === 'explorer' ? .7 : 1));
function useSign() {
  if (S.bridge) { toast('The bridge to Orchard Isle. Walk across!'); return; }
  openDialog('Broken Bridge', `Fix this bridge to reach Orchard Isle. Coins: ${Math.min(S.coins, bridgeCost(BRIDGE_COST))}/${bridgeCost(BRIDGE_COST)}.`, S.coins < bridgeCost(BRIDGE_COST) ? [] : [{ label:'Fix the bridge', fn:() => {
    S.coins -= bridgeCost(BRIDGE_COST); S.bridge = true; if (S.quest >= 4) S.quest = 5; buildBridge(); save(); drawHud();
    [523,659,784,1047].forEach((f,i)=>setTimeout(()=>chime(f),i*160)); burst(sign.position, 0xffc857, 20);
    openDialog('Bridge fixed!', 'The bridge to Orchard Isle is whole again. Walk across and find out who answered the bell.');
  }}]);
}

// --- chapter 2 ---
function drizzleQuest() {
  const h = S.hearts.drizzle, nb = neighborButtons('drizzle');
  if (S.quest < 4) { openDialog('Captain Drizzle', "Ahoy there! Word is your island has a broken bell. Tune it and ring it, then come find me. I will be listening.", nb, h); return; }
  if (S.q2 === 0) {
    S.q2 = 1; if (S.quest < 5) S.quest = 5; save(); drawHud();
    openDialog('Captain Drizzle', "Ahoy! So YOU rang that bell. I am Captain Drizzle, and that is my cloud ship, the Puddle Jumper. Help me fix her, and I will take you anywhere. First, we need fresh water. The cloud-sea water out here is salty. Tap the pot by my ship.", [], h);
  } else if (S.q2 === 1) openDialog('Captain Drizzle', "Tap the pot by my ship, sailor! That fills it and puts the cup and lid in place. Then leave it in the sun until tomorrow. Trust the captain.", nb, h);
  else if (S.q2 === 2) openDialog('Captain Drizzle', "Fresh water, check! Now the sail. The mast needs a perfect square corner or she flies in circles. Tap the ship and use my knotted rope.", nb, h);
  else if (S.q2 === 3) {
    if (hour() >= 20) openDialog('Captain Drizzle', "Good, the stars are out. A captain needs a star that never moves. Look up and find it for me. I would do it myself, but looking up makes me dizzy.", [{ label:'Look at the stars', fn:() => { closeDialog(); starPuzzle(); } }, ...nb], h);
    else openDialog('Captain Drizzle', "Now we need stars, and it is too bright. Come back after 8 PM.", nb, h);
  } else if (S.q2 === 4) drizzleFinale();
  save();
}
function usePot() {
  if (S.q2 < 1) { toast('An old metal pot.'); return; }
  if (S.q2 > 1) { toast('The water pot. Leave it in the sun and it makes fresh water.'); return; }
  if (S.potDay < 0) { S.potDay = S.day; lid.visible = true; sfx('water'); save(); toast('You filled the pot, set the cup inside, and put the lid on. Leave it in the sun until tomorrow.'); return; }
  if (S.potDay === S.day) { toast('Nothing yet. Drops are forming on the lid. Come back tomorrow.'); return; }
  S.q2 = 2; lid.visible = false; save(); drawHud(); sfx('pick'); burst(pot.position, 0x9fd3ff);
  showAha('still', () => toast('The cup is full of fresh water!'));
}
function drizzleOldHeart() {
  S.q5 = 1; save(); drawHud(); sfx('heart');
  openDialog('Captain Drizzle', "Lumen told me everything. The Old Heart, the great bell, your grandmother. Well, sailor, the Puddle Jumper can do more than hover now. The center of the old village is straight ahead, past the clouds. Tap the ship whenever you are ready, and we fly. I packed snacks. They are all fish.", [], S.hearts.drizzle);
}
function flyTo(where) {
  const f = $('fade'); f.style.opacity = 1; sfx('cast');
  setTimeout(() => {
    if (where === 'heart') player.position.set(OH.x + 7.2, OH.y, OH.z + .8); else player.position.set(ORCH_POS.x + 1, ORCH_POS.y, ORCH_POS.z + 1.5);
    S.where = 'home'; target = null; pending = null; snapCam(); S.pos = [player.position.x, player.position.y, player.position.z]; save();
    f.style.opacity = 0;
    if (where === 'heart' && S.q5 === 1) { S.q5 = 2; save(); drawHud(); setTimeout(() => toast('The Old Heart. Tap the fallen bell in the middle.'), 700); }
  }, 700);
}
function useShip() {
  if (S.q2 >= 5 && S.shipPath && featureOn('journey')) { const b = [];
    if (S.q5 >= 1) b.push({ label:'Fly to the Old Heart', fn:() => { closeDialog(); flyTo('heart'); } });
    if (S.shipPath === 'explore') b.push({ label:'Go on a voyage', fn:() => { closeDialog(); voyage(); } }); else b.push({ label:'Market day', fn:() => { closeDialog(); marketDay(); } });
    openDialog('The Puddle Jumper', S.shipPath === 'explore' ? 'The explorer\'s ship, ready to sail.' : 'The floating market is open for business.', b); return; }
  if (S.q5 >= 1) { openDialog('The Puddle Jumper', 'The ship is ready to fly.', [{ label:'Fly to the Old Heart', fn:() => { closeDialog(); flyTo('heart'); } }]); return; }
  if (S.q2 < 2) { toast('The Puddle Jumper. Her sail is a mess.'); return; }
  if (S.q2 === 2) return ropePuzzle();
  if (S.q2 < 5) { toast('The sail looks great. Next, talk to Captain Drizzle after 8 PM.'); return; }
  toast('The ship is fixed. Follow the note at the top of your screen.');
}
function ropePuzzle(o = {}) {
  const total = o.total || 12, max = total - 2;
  let A = total/3, B = total/3, hint = false;
  const ROPE_HINT = { 12:'Hint: try Side A = 3 and Side B = 4.', 24:'Hint: last time, 3, 4, 5 worked. What if you double each side?', 36:'Hint: take the 3, 4, 5 answer and make each side 3 times longer.' };
  const draw = () => {
    const C = total - A - B;
    showCard(`<div class="kicker">${o.kicker || 'THE SAIL'}</div><h2>Make a square corner</h2>
      <p>${o.text || 'The rope has 12 knots. Split it into 3 sides to make a triangle. Your goal: make the bottom left corner a square corner, like the corner of a book.'}</p>
      <canvas class="rope" id="ropeC" width="520" height="300"></canvas>
      <div class="steppers"><div>Side A<br><button id="a-">-</button>${A}<button id="a+">+</button></div><div>Side B<br><button id="b-">-</button>${B}<button id="b+">+</button></div><div>Side C<br>${C}</div></div>
      <p id="ropeMsg" style="margin-top:8px;font-weight:700;text-align:center"></p>
      <p style="font-size:14px;text-align:center;opacity:.75">Use + and - to change Side A and Side B. Side C gets the rest. The corner turns green when it is square.</p>
      <p id="ropeHint" style="text-align:center;font-weight:700;color:#b87d45;min-height:0">${hint ? ROPE_HINT[total] : ''}</p>
      <button id="tie">Tie it</button> <button id="hintB" class="ghost">Hint</button> <button id="later" class="ghost">Later</button>`, null);
    $('hintB').onclick = () => { hint = true; draw(); };
    const cv = $('ropeC'), g = cv.getContext('2d'), msg = $('ropeMsg');
    const ok = A + B > C && A + C > B && B + C > A && C > 0;
    let ang = 0;
    if (ok) {
      ang = Math.acos((A*A + B*B - C*C) / (2*A*B)) * 180 / Math.PI;
      const u = 34 * 12 / total, x0 = 90, y0 = 250, p1 = [x0 + A*u, y0], p2 = [x0 + B*u*Math.cos(ang*Math.PI/180), y0 - B*u*Math.sin(ang*Math.PI/180)];
      g.lineWidth = 6; g.strokeStyle = '#b87d45'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(...p1); g.lineTo(...p2); g.closePath(); g.stroke();
      g.fillStyle = '#3b2f4a'; [[x0,y0,p1],[x0,y0,p2]].forEach(([x,y,p]) => { const n = p === p1 ? A : B; for (let i=0;i<=n;i++){ g.beginPath(); g.arc(x + (p[0]-x)*i/n, y + (p[1]-y)*i/n, 5, 0, 7); g.fill(); } });
      const right = Math.abs(ang - 90) < .5;
      g.strokeStyle = right ? '#2fae60' : '#ff8fa3'; g.lineWidth = 4;
      if (right) g.strokeRect(x0, y0 - 26, 26, 26); else { g.beginPath(); g.arc(x0, y0, 30, -ang*Math.PI/180, 0); g.stroke(); }
      msg.textContent = right ? 'A perfect square corner!' : `That corner is ${Math.round(ang)} degrees. A square corner is 90.`;
      msg.style.color = right ? '#2fae60' : '';
    } else msg.textContent = 'Those sides cannot meet. Try other numbers.';
    const step = (id, fn) => $(id).onclick = () => { fn(); draw(); };
    step('a-', () => A = Math.max(1, A-1)); step('a+', () => A = Math.min(max, A+1));
    step('b-', () => B = Math.max(1, B-1)); step('b+', () => B = Math.min(max, B+1));
    $('later').onclick = hideCard;
    $('tie').onclick = () => {
      if (!ok || Math.abs(ang - 90) >= .5) { msg.textContent = o.fail || 'Not square yet. The sail would sag.'; return; }
      if (o.done) { hideCard(); return o.done(A, B, C); }
      hideCard(); S.q2 = 3; sail.visible = true; saggy.visible = false; save(); drawHud(); sfx('pick'); burst(ship.position, 0xffffff, 18);
      showAha('rope', () => toast('The sail is up!'));
    };
  };
  draw();
}
function starPuzzle(o = {}) {
  showCard(`<div class="kicker">THE NIGHT SKY</div><h2>${o.title || 'Find the star that stays'}</h2>
    <p>${o.text || 'Watch the sky for a few seconds. Every star moves in a circle, except 1. Tap the star that stays still.'}</p>
    <canvas class="sky" id="skyC" width="560" height="560"></canvas>
    <p id="skyMsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px"></p>
    <button id="later" class="ghost">Later</button>`, null);
  const cv = $('skyC'), g = cv.getContext('2d'), pole = [370, 190];
  const list = [{ r:0, a:0, s:2.6 }];
  for (let i=0;i<70;i++) list.push({ r:40 + Math.random()*480, a:Math.random()*Math.PI*2, s:1 + Math.random()*1.8 });
  let spin = 0, raf, found = false;
  const pos = st => [pole[0] + Math.cos(st.a + spin)*st.r, pole[1] + Math.sin(st.a + spin)*st.r];
  const frame = () => {
    spin += .004;
    g.fillStyle = 'rgba(14,20,51,.35)'; g.fillRect(0, 0, 560, 560); // soft trails
    list.forEach(st => { const [x,y] = pos(st); g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(x, y, st.s, 0, 7); g.fill(); });
    raf = requestAnimationFrame(frame);
  };
  g.fillStyle = '#0e1433'; g.fillRect(0,0,560,560); frame();
  cardCleanup = () => cancelAnimationFrame(raf);
  cv.onpointerdown = e => {
    if (found) return;
    const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * 560 / b.width, y = (e.clientY - b.top) * 560 / b.height;
    let best = null, bd = 1e9; list.forEach(st => { const [sx,sy] = pos(st), d = Math.hypot(sx-x, sy-y); if (d < bd) { bd = d; best = st; } });
    if (bd > 30) { $('skyMsg').textContent = 'Tap right on a star.'; return; }
    if (best.r === 0) { found = true; sfx('pick'); $('skyMsg').textContent = 'That one! It stays put while the sky turns.';
      setTimeout(() => { hideCard(); if (o.done) return o.done(); S.q2 = 4; save(); drawHud(); showAha('stars', drizzleFinale); }, 1200); }
    else $('skyMsg').textContent = 'That one moved. Watch which one stays put.';
  };
  $('later').onclick = hideCard;
}
function drizzleFinale() {
  S.q2 = 5; S.coins += 100; ship.userData.lift = 1.4; save(); drawHud();
  [392,523,659,784,1047].forEach((f,i)=>setTimeout(()=>chime(f),i*180)); burst(ship.position, 0xffc857, 24);
  openDialog('Captain Drizzle', "She flies! Well. She hovers. That is a start! Listen, sailor: when you rang that bell, I heard 1 more answer. Far off, past the old Windmill. Someone else is waiting. Go to Windmill Isle and find them. Here, 100 coins for the best crew I ever had.", featureOn('journey') ? [{ label:'What happens to her now?', fn:() => { closeDialog(); shipChoice(); } }] : [], S.hearts.drizzle);
}
function useSign2() {
  if (S.bridge2) { toast('The bridge to Windmill Isle. Walk across!'); return; }
  openDialog('Broken Bridge', `This bridge goes to Windmill Isle. Coins: ${Math.min(S.coins, bridgeCost(BRIDGE2_COST))}/${bridgeCost(BRIDGE2_COST)}.`, S.coins < bridgeCost(BRIDGE2_COST) ? [] : [{ label:'Fix the bridge', fn:() => {
    S.coins -= bridgeCost(BRIDGE2_COST); S.bridge2 = true; if (S.q3 === 0) S.q3 = 1; buildBridge(); save(); drawHud();
    [523,659,784,1047].forEach((f,i)=>setTimeout(()=>chime(f),i*160)); burst(sign2.position, 0xffc857, 20);
    openDialog('Bridge fixed!', 'Walk across to Windmill Isle. Something is creaking up there.');
  }}]);
}
function twinsQuest() {
  const h = S.hearts.twins, nb = neighborButtons('twins');
  if (S.q2 < 5) { openDialog('Moss & Fern', "Moss: A visitor! Fern: Go help the captain first. Moss: He gets sad when he is stuck. Fern: Like the windmill.", nb, h); return; }
  if (S.q3 <= 1) {
    S.q3 = 2; save(); drawHud();
    openDialog('Moss & Fern', "Moss: Hello! I am Moss. Fern: I am Fern. Moss: That is our windmill. Fern: It used to grind flour for the whole sky. Moss: Then the Great Gust jammed its gears. Fern: Can you fix it? Tap the windmill!", [], h);
  } else if (S.q3 <= 4) openDialog('Moss & Fern', ["", "", "Fern: The gears first! Moss: Tap the windmill.", "Moss: Now the millstone. Fern: It is SO heavy.", "Fern: It spins! Moss: Tap it to grind our wheat."][S.q3], nb, h);
  else if (S.q3 === 5) openDialog('Moss & Fern', "Moss: Take the flour to Nana Gale. Fern: She makes the best bread in the sky.", nb, h);
  else if (S.q3 === 6) {
    S.q3 = 7; S.sprinklers = true; sprinkler.visible = true; save(); drawHud(); sfx('heart'); burst(npcs.twins.position, 0x9fe7e0, 20);
    openDialog('Moss & Fern', "Fern: Bread from OUR flour? Moss: We are so proud. Fern: Here, we built you a sprinkler that runs on wind power. Moss: It waters your whole garden every morning. Fern: Also... Moss: ...we felt the ground hum last night. Fern: From the dark island. Moss: Where the lights only come out at night. Fern: Go and look after 8 PM!", [], h);
  }
  save();
}
function useWindmill() {
  if (S.q3 < 2) { toast('An old windmill. Its blades are stuck.'); return; }
  if (S.q3 === 2) return gearPuzzle();
  if (S.q3 === 3) return leverPuzzle();
  if (S.q3 === 4) {
    S.q3 = 5; bagAdd('flour'); sfx('dig'); burst(windmill.position, 0xffffff, 20); save(); drawHud();
    toast('The millstone grinds the twins\' wheat into soft flour. Take it to Nana Gale!'); return;
  }
  toast('The windmill hums in the breeze.');
}
function nanaBread() {
  if (!S.bag.flour) { openDialog('Nana Gale', "Flour? Bring me flour from the windmill and I will show you some old magic.", neighborButtons('nana'), S.hearts.nana); return; }
  openDialog('Nana Gale', "Flour from the windmill! Now watch. Water, flour, a pinch of this. Now we wait while it rests... see how it puffs up? It is breathing.", [
    { label:'Watch the dough rise', fn:() => { closeDialog(); bagAdd('flour', -1); S.q3 = 6; save(); drawHud(); showAha('bread', () => toast('Warm bread! Go tell Moss & Fern.')); } }], S.hearts.nana);
}
function gearPuzzle(o = {}) {
  const target = o.target || 3, right = 24 / target;
  let teeth = 24, spin = 0, raf;
  const draw = (msg='') => {
    showCard(`<div class="kicker">${o.kicker || 'THE WINDMILL'}</div><h2>Fix the gears</h2>
      <p>The big gear turns with the wind. ${o.what || 'The millstone needs its small gear'} to spin exactly ${target} times for every 1 turn of the big gear.</p><p style="font-size:14px;opacity:.75;margin-top:6px">Tap a small gear below to try it. Watch the 2 counters at the top. When the counters match, tap Fit this gear.</p>
      <canvas class="rope" id="gearC" width="520" height="280"></canvas>
      <div class="steppers">${[6,8,12,16].map(n => `<button data-t="${n}" class="${n===teeth?'':'ghost'}">${n} teeth</button>`).join('')}</div>
      <p id="gearMsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px">${msg}</p>
      <button id="fit">Fit this gear</button> <button id="later" class="ghost">Later</button>`, null);
    const g = $('gearC').getContext('2d');
    const gear = (cx, cy, n, r, a, col) => { g.fillStyle = col; g.beginPath();
      for (let i=0;i<n*2;i++){ const rr = i%2 ? r : r + 10, t = a + i*Math.PI/n; g.lineTo(cx + Math.cos(t)*rr, cy + Math.sin(t)*rr); } g.closePath(); g.fill();
      g.fillStyle = '#f3e8d8'; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill(); g.fillStyle = '#3b2f4a'; g.beginPath(); g.arc(cx + Math.cos(a)*(r-16), cy + Math.sin(a)*(r-16), 5, 0, 7); g.fill(); };
    let bigTurns = 0, smallTurns = 0;
    const frame = () => {
      spin += .012; g.clearRect(0,0,520,280);
      const R = 96, r = R * teeth / 24;
      gear(170, 140, 24, R, spin, '#b87d45');
      gear(170 + R + r + 10, 140, teeth, r, -spin * 24/teeth + Math.PI/teeth, teeth === right ? '#2fae60' : '#c98f58');
      bigTurns = spin / (Math.PI*2); smallTurns = bigTurns * 24 / teeth;
      g.fillStyle = '#3b2f4a'; g.font = 'bold 20px Baloo 2, sans-serif';
      g.fillText(`Big gear: ${Math.floor(bigTurns)} turns`, 20, 30); g.fillText(`Small gear: ${Math.floor(smallTurns)} turns`, 290, 30);
      raf = requestAnimationFrame(frame);
    };
    frame(); cardCleanup = () => cancelAnimationFrame(raf);
    document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { teeth = +b.dataset.t; spin = 0; draw(); });
    $('later').onclick = hideCard;
    $('fit').onclick = () => {
      if (teeth !== right) { $('gearMsg').textContent = `With ${teeth} teeth it spins ${24/teeth} time${24/teeth === 1 ? '' : 's'} per big turn. ${24/teeth < target ? 'Try a gear with fewer teeth.' : 'Try a gear with more teeth.'}`; return; }
      if (o.done) { hideCard(); return o.done(); }
      hideCard(); S.q3 = 3; save(); drawHud(); sfx('pick'); burst(windmill.position, 0xffc857, 16);
      showAha('gears', () => toast('The gears fit! Now tap the windmill to lift the millstone.'));
    };
  };
  draw();
}
function leverPuzzle(o = {}) {
  const heavy = o.heavy || 60, push = o.push || 10;
  let f = 5, pushed = false;
  const draw = (msg='') => {
    showCard(`<div class="kicker">${o.kicker || 'THE WINDMILL'}</div><h2>${o.title || 'Lift the millstone'}</h2>
      <p>${o.text || 'The stone is too heavy to lift by hand. Use a plank and a log. Tap the arrow buttons to slide the log, then tap Push down.'}</p>
      <canvas class="rope" id="levC" width="520" height="260"></canvas>
      <div class="steppers"><div>Log<br><button id="l-">&lt;</button><button id="l+">&gt;</button></div></div>
      <p id="levMsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px">${msg}</p>
      <button id="push">Push down</button> <button id="later" class="ghost">Later</button>`, null);
    const g = $('levC').getContext('2d'), x0 = 40, L = 440, px = x0 + f/10*L, lifts = push*(10-f) > heavy*f;
    const tilt = pushed ? (lifts ? .22 : .03) : 0;
    g.clearRect(0,0,520,260);
    g.fillStyle = '#8fdc8a'; g.fillRect(0, 215, 520, 45);
    g.fillStyle = '#9b6b4a'; g.beginPath(); g.arc(px, 200, 16, 0, 7); g.fill(); // log
    g.save(); g.translate(px, 184); g.rotate(tilt);
    g.fillStyle = '#d9a066'; g.fillRect(x0 - px, -8, L, 14); // plank
    g.fillStyle = '#b0a898'; g.beginPath(); g.ellipse(x0 - px + 30, -34, 42 * (heavy > 60 ? 1.25 : 1), 26 * (heavy > 60 ? 1.25 : 1), 0, 0, 7); g.fill(); // stone
    g.fillStyle = '#ffe0b3'; g.beginPath(); g.arc(x0 - px + L - 20, -26, 18, 0, 7); g.fill(); // you
    g.restore();
    $('l-').onclick = () => { f = Math.max(1, f-1); pushed = false; draw(); };
    $('l+').onclick = () => { f = Math.min(9, f+1); pushed = false; draw(); };
    $('later').onclick = hideCard;
    $('push').onclick = () => {
      pushed = true; draw(lifts ? 'It lifts!' : 'Too heavy. Try sliding the log closer to the stone.');
      if (lifts && o.done) return setTimeout(() => { hideCard(); o.done(); }, 900);
      if (lifts) setTimeout(() => { hideCard(); S.q3 = 4; save(); drawHud(); sfx('pick'); burst(windmill.position, 0xffc857, 20);
        [262,330,392,524].forEach((f,i)=>setTimeout(()=>chime(f),i*200));
        showAha('lever', () => toast('The windmill spins! Tap it to grind the twins\' wheat.')); }, 900);
    };
  };
  draw();
}
function useStakes() {
  if (S.bigGarden) { toast('Your garden is already bigger.'); return; }
  if (!S.aha.includes('rope')) { toast('Fence stakes and a long rope. You cannot use them yet. First learn to make a square corner on Orchard Isle.'); return; }
  ropePuzzle({ kicker:'A BIGGER GARDEN', total:24, text:'This rope is 2 times as long: 24 spaces between the knots. Split it into 3 sides and make the bottom left corner a perfect square corner.', fail:'Not square yet. The fence would lean.',
    done:() => { S.bigGarden = true; for (let i=0;i<3;i++){ S.tiles.push({ s:0 }); addTileGroup(S.tiles.length-1); }
      stakes.visible = false; save(); sfx('pick'); burst(new THREE.Vector3(2.45,0,2.75), 0x8fdc8a, 20); showRecall('rope', () => toast('Your garden grew by 3 squares!')); } });
}
function useBoulder() {
  if (S.boulder) return readStone();
  if (!S.aha.includes('lever')) { toast('A huge boulder. It will not budge yet. Come back after you lift the millstone on Windmill Isle.'); return; }
  leverPuzzle({ kicker:'THE BOULDER', title:'Move the boulder', heavy:80, push:20, text:'Something is carved under this boulder. It is heavier than the millstone, but you are stronger now. Move the log, then push.',
    done:() => { S.boulder = true; rock.visible = false; rosettaStone.visible = true; save(); sfx('dig'); burst(boulder.position, 0x9a93a8, 20);
      showRecall('lever', () => showAha('rosetta')); } });
}
function lumenQuest() {
  const h = S.hearts.lumen, nb = neighborButtons('lumen');
  if (S.q3 < 7) { openDialog('Lumen', "Oh! Someone crossed the... how did you get here? Never mind. Come back when the windmill is working again.", nb, h); return; }
  if (S.q4 === 0) {
    S.q4 = 1; save(); drawHud();
    openDialog('Lumen', "Oh. Hello. I am Lumen. I paint at night. Nobody visits, so... sorry, I am nervous. I paint the moon every night. The wind mixed up my paintings. Could you help me put them back in order? They are on my easel.", [], h);
  } else if (S.q4 === 1) openDialog('Lumen', "My moon paintings are on the easel. Start with the darkest one.", nb, h);
  else if (S.q4 === 2) openDialog('Lumen', "Try my dark room. It is the little black house. There is a tiny window in it.", nb, h);
  else if (S.q4 === 3) openDialog('Lumen', "The crystals in my garden used to sing. Now they sound wrong. Tap the crystals and listen.", nb, h);
  else if (S.q4 === 4) {
    S.q4 = 5; S.seeds.starbloom = (S.seeds.starbloom||0) + 3; S.coins += 100; save(); drawHud(); sfx('heart'); burst(npcs.lumen.position, 0xfff3a0, 24);
    openDialog('Lumen', "Now I can show you my best painting. This is the Old Heart, before the Great Gust. Every island had a small bell. They all rang together with the giant bell in the middle. Then one night the big bell cracked. Without its song, the islands drifted apart.", [{ label:'What happened next?', fn:() => openDialog('Lumen', "Your grandmother tried to fix the bell. She never finished. I think you are supposed to. Go tell Captain Drizzle.", [{ label:'I will', fn:() => openDialog('Lumen', "Here: 3 moonflower seeds and 100 coins. Moonflowers are real, they open at night! In my garden they bloom in any season.", [], h) }], h) }], h);
  }
  save();
}
function useEasel() {
  if (S.q4 < 1) { toast('An easel with a glowing moon painting.'); return; }
  if (S.q4 > 1) { toast("Lumen's moon paintings, in order."); return; }
  moonPuzzle();
}
function drawMoon(ctx, p, w) {
  const r = w*.38, c = w/2, lit = '#fff3c4', dark = '#2a2350', th = p * Math.PI / 4;
  ctx.fillStyle = '#0e1433'; ctx.fillRect(0,0,w,w);
  ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.fill();
  if (p === 0) return;
  if (p === 4) { ctx.fillStyle = lit; ctx.beginPath(); ctx.arc(c, c, r, 0, 7); ctx.fill(); return; }
  const right = p < 4;
  ctx.fillStyle = lit; ctx.beginPath(); ctx.arc(c, c, r, -Math.PI/2, Math.PI/2, !right); ctx.fill();
  const rx = r * Math.abs(Math.cos(th));
  if (rx > .5) { ctx.fillStyle = (p === 3 || p === 5) ? lit : dark; ctx.beginPath(); ctx.ellipse(c, c, rx, r, 0, 0, 7); ctx.fill(); }
}
function moonPuzzle() {
  const order = [0,1,2,3,4,5,6,7].sort(() => Math.random() - .5), picked = [];
  const draw = (msg='') => {
    showCard(`<div class="kicker">LUMEN'S EASEL</div><h2>Put the moons in order</h2>
      <p>Tap all 8 paintings in order, starting with the darkest moon. Lumen painted the moon on 8 nights in a row. Each night the lit part grows until the moon is full. Then it shrinks.</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px">${order.map(p => `<canvas data-m="${p}" width="120" height="120" style="width:100%;border-radius:12px;cursor:pointer;${picked.includes(p) ? 'opacity:.25' : ''}"></canvas>`).join('')}</div>
      <p style="margin-top:10px;font-weight:700;text-align:center;min-height:22px">${msg || `${picked.length} of 8 in order`}</p>
      <button id="later" class="ghost">Later</button>`, null);
    document.querySelectorAll('[data-m]').forEach(cv => { drawMoon(cv.getContext('2d'), +cv.dataset.m, 120);
      cv.onclick = () => {
        const p = +cv.dataset.m; if (picked.includes(p)) return;
        if (p !== picked.length) return draw(picked.length === 0 ? 'Start with the darkest one.' : picked.length < 4 ? 'Hmm. Each night the light grows a little.' : 'Hmm. After full, the light shrinks a little each night.');
        picked.push(p); sfx('plant');
        if (picked.length === 8) { hideCard(); S.q4 = 2; save(); drawHud(); showAha('moon', () => toast("Lumen: Thank you! Now try my dark room.")); }
        else draw();
      }; });
    $('later').onclick = hideCard;
  };
  draw();
}
function useDarkroom() {
  if (S.q4 < 2) { toast('A little black house with 1 tiny window.'); return; }
  let size = 4;
  const names = ['', 'Tiny', 'Small', 'Medium', 'Big'];
  const draw = () => {
    showCard(`<div class="kicker">LUMEN'S DARK ROOM</div><h2>Make the picture sharp</h2>
      <p>Light from outside shines through 1 hole and makes a picture on the back wall. Tap the buttons to try different hole sizes. Find the one that makes the picture sharp.</p>
      <canvas class="rope" id="obsC" width="520" height="300" style="background:#0b0916"></canvas>
      <div class="steppers">${[4,3,2,1].map(n => `<button data-h="${n}" class="${n === size ? '' : 'ghost'}">${names[n]} hole</button>`).join('')}</div>
      <p id="obsMsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px"></p>
      <button id="later" class="ghost">Later</button>`, null);
    const g = $('obsC').getContext('2d'), blur = size * 7, copies = size === 1 ? 1 : 16;
    const scene = (ox, oy) => { g.save(); g.translate(260 + ox, 150 + oy); g.scale(1, -1); // upside down, like a real camera
      g.fillStyle = '#7ec8e3'; g.fillRect(-200, -110, 400, 220); g.fillStyle = '#8fdc8a'; g.fillRect(-200, -110, 400, 70);
      g.fillStyle = '#9b6b4a'; g.fillRect(-12, -40, 24, 70); g.fillStyle = '#4fb46a'; g.beginPath(); g.arc(0, 50, 50, 0, 7); g.fill();
      g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(130, 70, 22, 0, 7); g.fill(); g.restore(); };
    g.globalAlpha = (size === 1 ? .8 : 1) / copies;
    for (let i=0;i<copies;i++){ const a = i / copies * Math.PI * 2; scene(Math.cos(a)*blur, Math.sin(a)*blur); }
    g.globalAlpha = 1;
    $('obsMsg').textContent = ['', 'Sharp! A little dim, and upside down. That is the outside world.', 'Almost. Still a little fuzzy.', 'Blurry. Colors, but no shapes.', 'Bright, but just a blur.'][size];
    document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { size = +b.dataset.h; draw();
      if (size === 1 && S.q4 === 2) setTimeout(() => { hideCard(); S.q4 = 3; save(); drawHud(); sfx('pick'); showAha('optics', () => toast('Lumen: You found it! Now, my crystals...')); }, 1600); });
    $('later').onclick = hideCard;
  };
  draw();
}
function useCrystals() {
  if (S.q4 < 3) { toast('Glowing crystals of different heights.'); return; }
  const list = [{ l:'1/2', r:2, sweet:true }, { l:'7/10', r:10/7 }, { l:'2/3', r:3/2, sweet:true }, { l:'11/12', r:12/11 }, { l:'8/13', r:13/8 }];
  const picked = new Set();
  const draw = (msg='') => {
    showCard(`<div class="kicker">LUMEN'S GARDEN</div><h2>Tune the crystals</h2>
      <p>Tap a crystal to hear it ring together with the tallest one. Some pairs sound nice. Some sound harsh. Pick the 2 that sound nice, then tap Ring them. <span class="sub">In Sky Garden, crystals follow the same rule as strings and flutes: simple fractions sound sweet.</span></p>
      <div class="jlist">${list.map((c,i) => `<button data-c="${i}" style="${picked.has(i)?'background:#c9b6ff':''}">${picked.has(i)?'✓ ':''}Crystal ${i+1}: ${c.l} as tall</button>`).join('')}</div>
      <p style="margin-top:10px;min-height:22px;font-weight:700">${msg}</p>
      <button id="ring">Ring them</button> <button id="deaf" class="ghost">Give me a hint</button> <button id="later" class="ghost">Later</button>`, null);
    $('deaf').onclick = () => draw('Hint: just like the Wind Bell, the simplest fractions sound nice: 1/2 and 2/3.');
    document.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { const i = +b.dataset.c;
      if (muted) toast('Turn sound on to hear the crystals.'); chime(392); chime(392 * list[i].r); picked.has(i) ? picked.delete(i) : picked.add(i); draw(); });
    $('later').onclick = hideCard;
    $('ring').onclick = () => {
      if (picked.size !== 2) return draw('Pick exactly 2 crystals.');
      if ([...picked].some(i => !list[i].sweet)) { chime(392); chime(392*12/11); return draw('One of them clashes. Listen again.'); }
      hideCard(); S.q4 = 4; save(); drawHud(); [392,523,784,1047].forEach((f,i)=>setTimeout(()=>chime(f),i*180)); burst(crystals.position, 0xc9b6ff, 20);
      showRecall('bell', () => toast('The crystals sing! Talk to Lumen.'));
    };
  };
  draw();
}
function useShip2() { openDialog('The Puddle Jumper', 'Fly back to Orchard Isle?', [{ label:'Fly home', fn:() => { closeDialog(); flyTo('orchard'); } }]); }
function useGreatBell() {
  if (S.q5 < 2) { toast('A huge cracked bell.'); return; }
  if (S.q5 === 2) return leverPuzzle({ kicker:'THE GREAT BELL', title:'Lift the great bell', heavy:120, push:30,
    text:'The great bell is the heaviest thing in the sky. You have a very long plank and a log. Move the log, then push down on your end.',
    done:() => { S.q5 = 3; save(); drawHud(); sfx('dig'); burst(greatBell.position, 0xd9a441, 24); showRecall('lever2', () => toast('The bell is upright! Now tap the pile of wooden beams next to it to build a frame.')); } });
  if (S.q5 < 5) { toast('The bell is not ready to ring yet. Tap the pile of wooden beams next to it.'); return; }
  if (S.q5 === 5) {
    const h = hour();
    if (h >= 11.5 && h <= 12.5) return showRecall('sundial', ringGreatBell);
    toast(h < 11.5 ? 'Not noon yet. Come back at 12 PM. The clock is at the top of the screen.' : 'Noon has passed. Try again tomorrow at 12 PM.'); return;
  }
  chime(131); chime(196); chime(262); toast('BONNNG. Every island hums back.');
}
function useFrame() {
  if (S.q5 < 3) { toast('A pile of wooden beams, rope, and stones for building.'); return; }
  if (S.q5 === 3) return ropePuzzle({ kicker:'THE BELL FRAME', total:36, fail:'Not square yet. The frame would lean.',
    text:'The frame posts must stand at a perfect square corner, or the bell will swing crooked. This rope has 36 spaces between its knots.',
    done:() => { S.q5 = 4; save(); drawHud(); sfx('pick'); burst(bellFrame.position, 0x9b6b4a, 20); showRecall('rope2', () => toast('The frame stands! Tap the pile again to fix the gears.')); } });
  if (S.q5 === 4) return gearPuzzle({ kicker:'THE BELL FRAME', target:4, what:'The bell needs its small gear',
    done:() => { S.q5 = 5; save(); drawHud(); sfx('pick'); burst(frameGear.position, 0xc98f58, 16); showRecall('gears', () => toast('The bell hangs ready. Tap it at noon (12 PM) to ring it.')); } });
  toast('The great bell frame. Solid and square.');
}
function ringGreatBell() {
  S.q5 = 6; S.coins += 300; save(); drawHud(); gbSwing.userData.ring = 6;
  [131,196,262,330,392,523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*260));
  [new THREE.Vector3(0,0,0), ORCH_POS, WIND_POS, NIGHT_POS, OH].forEach((p, i) => setTimeout(() => burst(p.clone().setY(p.y + 1), [0xffc857,0xff8fa3,0x9fe7e0,0xc9b6ff,0xfff3a0][i], 30), 400 + i*500));
  crack.visible = false;
  setTimeout(() => showCard(`<div class="kicker">CHAPTER 5: THE OLD HEART</div><h2>The Sky Remembers</h2>
    <p>The great bell rings out across the sky. From every island, a small bell answers: Grandma's Wind Bell, Drizzle's ship bell, the windmill, Lumen's crystals. Far away, islands you have never seen begin to drift closer.</p>
    <h4>Tucked inside the bell, a letter</h4><p class="letter">${GRANDMA_LETTER2}</p>`, 'Next',
    () => showCard(`<div class="kicker">CHAPTER 5: THE OLD HEART</div><h2>5 building sites opened</h2><p>Tap a building site here at the Old Heart to rebuild it. You got 300 coins.</p>`, 'Rebuild the village')), 4200);
}
function upgradeMenu(i) { const b = BUILDINGS[i], lv = bLevel(b.id), next = BUP[b.id][lv - 1], who = b.villager ? NEIGHBORS[b.villager].name : 'The village';
  const done = BUP[b.id].slice(0, lv - 1).map(u => `<p class="sub">✓ ${u.name}</p>`).join('');
  if (!next) return showCard(`<div class="kicker">${b.name.toUpperCase()} PLANS</div><h2>Fully built</h2>${done}<p>${who} shares <b>${BUP_CUT[lv - 1]} coins</b> of the takings with you each morning.</p>`, 'Close');
  const ok = enough(next.needs) && S.coins >= next.coins;
  showCard(`<div class="kicker">${b.name.toUpperCase()} PLANS</div><h2>Level ${lv + 1}: ${next.name}</h2>${done}<p>${next.adds}</p><p>You paid for this building, so ${who} shares a cut of the takings: <b>${BUP_CUT[lv]} coins</b> each morning after this upgrade${lv > 1 ? `, up from ${BUP_CUT[lv - 1]}` : ''}.</p>${needChips(next.needs)} <span class="needs"><em class="${S.coins >= next.coins ? 'ok' : 'no'}">🪙 ${Math.min(S.coins, next.coins)}/${next.coins}</em></span>
    ${ok ? `<button id="upGo">Build the ${next.name.toLowerCase()}</button>` : ''}`, 'Close');
  if ($('upGo')) $('upGo').onclick = () => { Object.entries(next.needs).forEach(([k, n]) => bagAdd(k, -n)); S.coins -= next.coins; S.bLevel = { ...(S.bLevel || {}), [b.id]:lv + 1 }; save(); drawHud(); drawSites(); sfx('wood'); [523, 659, 784, 1047].forEach((f, j) => setTimeout(() => chime(f), j * 120)); burst(siteGroups[i].position.clone().setY(siteGroups[i].position.y + 2), 0xffe07a, 30);
    showCard(`<div class="kicker">${b.name.toUpperCase()}</div><h2>The ${next.name.toLowerCase()} is built!</h2><p>${next.adds}</p><p>From tomorrow, ${who} shares <b>${BUP_CUT[lv]} coins</b> each morning.</p>`, 'Okay'); }; }
// each morning, every upgraded building pays the player a share of its takings
function villageCut() { const n = BUILDINGS.reduce((t, b) => t + ((S.built || []).includes(b.id) ? BUP_CUT[bLevel(b.id) - 1] : 0), 0); if (!n) return; S.coins += n; setTimeout(() => toast(`The village shared ${n} coins of its takings with you.`), 2500); }
function useSite(i) {
  const b = BUILDINGS[i];
  if (S.q5 < 6) { toast('An old foundation. Ring the great bell first.'); return; }
  if (S.built.includes(b.id)) return enterRoom(b.id); // every finished building is a room you walk into
  if (b.soon) { toast(`${b.name}: ${b.about}`); return; }
  const kindName = { crop:'crops (any kind)', fish:'fish (any kind)', fruit:'fruits (any kind)', dish:'dishes from the Bakery (any kind)' };
  const countOf = k => k.startsWith('kind:') ? Object.entries(S.bag).filter(([id]) => ITEMS[id].kind === k.slice(5)).reduce((a, [,n]) => a + n, 0) : (S.bag[k] || 0);
  const have = Object.entries(b.items).map(([k,n]) => ({ k, n, got:countOf(k), label: k.startsWith('kind:') ? kindName[k.slice(5)] : ITEMS[k].name }));
  const can = S.coins >= b.coins && have.every(x => x.got >= x.n);
  showCard(`<div class="kicker">REBUILD THE VILLAGE</div><h2>${b.name}</h2><p>${b.about}</p><h4>To build it</h4>
    <div class="nlist"><div class="nrow ${S.coins >= b.coins ? 'ok' : 'no'}"><span><i class="nco">${ICON.coin}</i> Coins</span><b>${S.coins >= b.coins ? '✓ ' : ''}${Math.min(S.coins, b.coins)}/${b.coins}</b></div>${have.map(x => `<div class="nrow ${x.got >= x.n ? 'ok' : 'no'}"><span>${x.label[0].toUpperCase() + x.label.slice(1)}</span><b>${x.got >= x.n ? '✓ ' : ''}${Math.min(x.got, x.n)}/${x.n}</b></div>`).join('')}</div>
    ${can ? '<button id="build">Build it</button> ' : `<p style="margin-top:10px;font-weight:700">${S.coins < b.coins ? `You still need ${b.coins - S.coins} more coins.` : (x => `You still need ${x.n - x.got} more ${x.label}.`)(have.find(x => x.got < x.n))}</p>`}`, 'Later');
  if (can) $('build').onclick = () => {
    S.coins -= b.coins;
    Object.entries(b.items).forEach(([k,n]) => { if (!k.startsWith('kind:')) return bagAdd(k, -n);
      for (const id of Object.keys(S.bag).filter(id => ITEMS[id].kind === k.slice(5))) { const take = Math.min(n, S.bag[id]); bagAdd(id, -take); n -= take; if (!n) break; } });
    S.built.push(b.id); S.builtDay[b.id] = Date.now(); save(); hideCard(); drawSites(); drawHud();
    [392,523,659,784].forEach((f,j)=>setTimeout(()=>chime(f),j*150)); burst(siteGroups[i].position, 0xffc857, 30);
    toast(b.villager ? `The ${b.name} is built! ${NEIGHBORS[b.villager].name} is moving in. Go say hello.` : `The ${b.name} is built! Come back after 8 PM to chart the stars.`);
  };
}
function useBakery(made) {
  const ready = r => Object.entries(r.needs).every(([k,n]) => (S.bag[k]||0) >= n);
  // recipes you can cook right now come first; the rest are plain rows that say what is still missing
  showCard(`<div class="kicker">MABEL'S BAKERY</div><h2>What should we cook?</h2>${typeof made === 'string' ? `<p style="font-weight:700">${made}</p>` : ''}<p>Tap a recipe to cook it. Dishes sell for more than their ingredients.</p>
    <div class="jlist">${[...RECIPES.filter(ready), ...RECIPES.filter(r => !ready(r))].map(r => { const tick = S.cooked.includes(r.id) ? '✓ ' : '';
      return ready(r) ? `<button data-r="${r.id}">${tick}${r.name} <span class="sub">Ready to cook</span></button>`
        : `<button class="locked">${tick}${r.name} <span class="sub">needs ${Object.entries(r.needs).filter(([k,n]) => (S.bag[k]||0) < n).map(([k,n]) => `${n - (S.bag[k]||0)} more ${ITEMS[k].name}`).join(', ')}</span></button>`; }).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    const r = RECIPES.find(x => x.id === b.dataset.r);
    if (!ready(r)) return;
    Object.entries(r.needs).forEach(([k,n]) => bagAdd(k, -n)); bagAdd(r.id); sfx('pick'); burst(npcs.mabel.position, 0xffc857, 16);
    const first = !S.cooked.includes(r.id); if (first) S.cooked.push(r.id); save(); drawHud();
    if (first) playFirst(r.id, () => showCard(lessonHtml(r.aha), 'Add to my recipes', useBakery)); else useBakery(`You made ${r.name}! It sells for ${r.sell} coins.`);
  });
}
function booksOpen() { const since = S.builtDay.library || Date.now(); return Math.min(BOOKS.length, 1 + Math.floor((Date.now() - since) / (7 * 86400000))); }
function useLibrary() {
  const open = booksOpen(), next = Math.ceil(7 - ((Date.now() - (S.builtDay.library || Date.now())) / 86400000) % 7);
  showCard(`<div class="kicker">THE LIBRARY</div><h2>Professor Hoot's shelf</h2><p>A new book arrives every week. Tap a book to read it.</p>
    <div class="jlist">${BOOKS.slice(0, open).map(bk => `<button data-bk="${bk.id}">${S.read.includes(bk.id) ? '✓ ' : 'New: '}${bk.title}</button>`).join('')}</div>
    <p style="margin-top:10px;font-weight:700">${open < BOOKS.length ? `Next new book in ${next} day${next === 1 ? '' : 's'}.` : 'You have every book so far. More are on the way.'}</p>`, 'Close');
  document.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => { const bk = BOOKS.find(x => x.id === b.dataset.bk);
    const first = !S.read.includes(bk.id); if (first) { S.read.push(bk.id); save(); sfx('heart'); }
    const show = () => showCard(lessonHtml({ kicker:'THE LIBRARY', ...bk }), 'Back to the shelf', useLibrary); first ? playFirst(bk.id, show) : show(); });
}
function xyloNote(i) { const f = XYLO[i]; tone(f, { type:'triangle', dur:.9, vol:.07 }); tone(f*4, { dur:.25, vol:.012 }); }
function useMusicHall(song) {
  let played = [], idx = 0;
  const colors = ['#ff8fa3','#ffb36b','#ffc857','#eee','#8fdc8a','#7ec8e3','#eee','#ff8fa3'];
  const draw = (msg = '') => {
    showCard(`<div class="kicker">ALLEGRA'S MUSIC HALL</div><h2>${song ? `Learn: ${song.name}` : 'The xylophone'}</h2>
      <p>${song ? 'Tap the glowing bar each time. Go 1 note at a time until the song is done.' : 'Tap the bars to play. Try playing only the colored bars, and listen. Or pick a song to learn.'}</p>
      <div id="xylo" style="display:flex;gap:5px;align-items:flex-end;justify-content:center;margin-top:12px">${XYLO.map((f,i) => `<button data-x="${i}" style="flex:1;max-width:48px;margin:0;padding:0;height:${150 - i*10}px;border-radius:10px;background:${colors[i]};box-shadow:0 4px 0 #0002;${song && song.notes[idx] === i ? 'outline:4px solid #3b2f4a;outline-offset:2px' : ''}">${XYLO_NAMES[i]}</button>`).join('')}</div>
      ${song ? `<p style="text-align:center;font-weight:700;margin-top:10px;letter-spacing:.1em">${song.notes.map((n,i) => i < idx ? `<span style="color:#2fae60">${XYLO_NAMES[n]}</span>` : i === idx ? `[${XYLO_NAMES[n]}]` : XYLO_NAMES[n]).join(' ')}</p>` : ''}
      <p style="text-align:center;font-weight:700;min-height:22px;margin-top:6px">${msg}</p>
      ${song ? '<button id="free" class="ghost">Back to free play</button>' : SONGS.map(so => `<button data-so="${so.id}" class="ghost">${S.songs.includes(so.id) ? '✓ ' : ''}Learn ${so.name}</button>`).join(' ')}
      <button id="later" class="ghost">Close</button>`, null);
    document.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const i = +b.dataset.x; if (muted) toast('Sound is off. Turn it on to hear the notes.'); xyloNote(i);
      if (song) {
        if (i !== song.notes[idx]) return draw(`That was ${XYLO_NAMES[i]}. Tap the glowing bar, ${XYLO_NAMES[song.notes[idx]]}.`);
        idx++;
        if (idx >= song.notes.length) { const first = !S.songs.includes(song.id); if (first) { S.songs.push(song.id); save(); }
          setTimeout(() => first ? showCard(lessonHtml(song.aha), 'Add to my songbook', () => useMusicHall()) : useMusicHall(), 500); return draw('You played the whole song!'); }
        return draw();
      }
      played.push(i); played = played.slice(-10);
      if (!S.penta && played.length >= 10 && played.every(n => PENTA.includes(n))) { S.penta = true; save(); return setTimeout(() => showCard(lessonHtml(PENTA_AHA), 'Add to my songbook', () => useMusicHall()), 400); }
    });
    document.querySelectorAll('[data-so]').forEach(b => b.onclick = () => useMusicHall(SONGS.find(x => x.id === b.dataset.so)));
    if ($('free')) $('free').onclick = () => useMusicHall();
    $('later').onclick = hideCard;
  };
  draw();
}
function sayingHtml(sy) { return `<div class="kicker">TEMPLE GARDEN</div><h2>"${sy.text}"</h2><p>${sy.from}</p>`; }
function useTemple() {
  const d = today(), dayNum = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000), sy = SAYINGS[dayNum % SAYINGS.length];
  if (!S.sayings.includes(sy.id)) { S.sayings.push(sy.id); save(); }
  const y = d.getFullYear(), start = new Date(y, d.getMonth(), d.getDate());
  const upcoming = FESTIVALS.flatMap(f => [y, y+1].map(yy => ({ f, w:festivalWindow(f, yy) }))).filter(x => x.w && x.w.end > start).sort((a,b) => a.w.start - b.w.start).slice(0, 6);
  showCard(`${sayingHtml(sy)}<p class="sub" style="margin-top:10px">Sage shares a new saying every day. You have heard ${S.sayings.length} of ${SAYINGS.length}.</p>
    ${upcoming.length ? '<button id="tFest" class="ghost">Coming up in the village</button> ' : ''}`, 'Thank you, Sage');
  if (upcoming.length) $('tFest').onclick = () => showCard(`<div class="kicker">TEMPLE GARDEN</div><h2>Coming up in the village</h2><div class="jlist">${upcoming.map(x => `<button>${x.f.name} <span class="sub">${x.w.start <= start ? 'happening now' : dateLabel(x.w.start)}</span></button>`).join('')}</div>`, 'Back', useTemple);
}
function useObservatory() {
  if (hour() < 20) { toast('The stars come out after 8 PM. Come back tonight.'); return; }
  const m = today().getMonth() + 1, tonight = CONSTELLATIONS.filter(c => c.months.includes(m));
  showCard(`<div class="kicker">THE OBSERVATORY</div><h2>Tonight's sky</h2><p>Different constellations come out in different months. Pick 1 to find and chart.</p>
    <div class="jlist">${tonight.map(c => `<button data-cn="${c.id}">${S.charted.includes(c.id) ? '✓ ' : ''}${c.name}</button>`).join('')}</div>
    <p style="margin-top:8px" class="sub">You have charted ${S.charted.length} of ${CONSTELLATIONS.length}.</p>`, 'Close');
  document.querySelectorAll('[data-cn]').forEach(b => b.onclick = () => traceStars(CONSTELLATIONS.find(c => c.id === b.dataset.cn)));
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function starHtml(c) {
  return `<div class="kicker">STAR CHART</div><h2>${c.title}</h2><p>${c.real}</p><p class="gap">${c.today} Best seen in the evening in ${c.months.map(m => MONTH_NAMES[m-1]).join(', ')}.</p>`;
}
function openStarList() {
  showCard(`<div class="kicker">STAR CHART</div><h2>${S.charted.length} of ${CONSTELLATIONS.length} charted</h2><p>Chart them at the Observatory after 8 PM. Each one only comes out in certain months.</p>
    <div class="jlist">${CONSTELLATIONS.map(c => S.charted.includes(c.id) ? `<button data-sc="${c.id}">${c.name}</button>` : `<button class="locked"><span class="sub">out in ${c.months.map(m => MONTH_NAMES[m-1].slice(0,3)).join(', ')}</span></button>`).join('')}</div>`, 'Back', openJournal);
  document.querySelectorAll('[data-sc]').forEach(b => b.onclick = () => showCard(starHtml(CONSTELLATIONS.find(c => c.id === b.dataset.sc)), 'Back', openStarList));
}
function traceStars(c) {
  const key = p => p.join(','), uniq = [...new Map(c.pts.map(p => [key(p), p])).values()];
  const W = 560, P = p => [70 + p[0]*420, 70 + p[1]*420];
  const bg = []; for (let i=0;i<70;i++){ const p = [Math.random(), Math.random()]; if (uniq.every(u => Math.hypot(u[0]-p[0], u[1]-p[1]) > .07)) bg.push(p); }
  const found = new Set();
  showCard(`<div class="kicker">THE OBSERVATORY</div><h2>Find ${c.name}</h2>
    <p>The small chart in the corner shows its shape. Tap each of its stars in the sky.</p>
    <canvas class="sky" id="traceC" width="${W}" height="${W}"></canvas>
    <p id="traceMsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px">0 of ${uniq.length} stars</p>
    <button id="later" class="ghost">Later</button>`, null);
  const cv = $('traceC'), g = cv.getContext('2d');
  const draw = () => {
    g.fillStyle = '#0e1433'; g.fillRect(0,0,W,W);
    bg.forEach((p,i) => { const [x,y] = P(p); g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(x, y, 1 + (i%3)*.7, 0, 7); g.fill(); });
    uniq.forEach(p => { const [x,y] = P(p); g.fillStyle = found.has(key(p)) ? '#ffe27a' : '#fff8dc'; g.beginPath(); g.arc(x, y, found.has(key(p)) ? 5 : 2.3, 0, 7); g.fill(); });
    if (found.size === uniq.length) { g.strokeStyle = '#ffe27a'; g.lineWidth = 2; g.beginPath(); c.pts.forEach((p,i) => { const [x,y] = P(p); i ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(10,10,120,120); g.strokeStyle = '#9fe7e0'; g.lineWidth = 1.5; g.beginPath();
    c.pts.forEach((p,i) => { const x = 20 + p[0]*100, y = 20 + p[1]*100; i ? g.lineTo(x,y) : g.moveTo(x,y); }); g.stroke();
    uniq.forEach(p => { g.fillStyle = '#9fe7e0'; g.beginPath(); g.arc(20 + p[0]*100, 20 + p[1]*100, 2.5, 0, 7); g.fill(); });
  };
  draw();
  cv.onpointerdown = e => {
    if (found.size === uniq.length) return;
    const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * W / b.width, y = (e.clientY - b.top) * W / b.height;
    const hit = uniq.find(p => { const [px,py] = P(p); return Math.hypot(px-x, py-y) < 22; });
    if (!hit) { $('traceMsg').textContent = 'That star is not part of it. Compare with the small chart.'; return; }
    found.add(key(hit)); sfx('plant'); draw(); $('traceMsg').textContent = `${found.size} of ${uniq.length} stars`;
    if (found.size === uniq.length) { sfx('heart'); $('traceMsg').textContent = `You charted ${c.name}!`;
      if (!S.charted.includes(c.id)) { S.charted.push(c.id); save(); }
      setTimeout(() => showCard(starHtml(c), 'Add to my star chart', useObservatory), 1400); }
  };
  $('later').onclick = hideCard;
}
function useFruitTree(t) {
  const i = t.userData.i;
  if (season() === 3) { toast('The fruit trees are resting for winter.'); return; }
  if (S.fruit[i] === S.day) { toast('You picked this tree today. Come back tomorrow for more fruit.'); return; }
  if (!canCarry(t.userData.fruitKind)) return bagFull();
  return fruitGame(t); }
// picking fruit: get up close and find the ripe one by its color. Lift and twist: a ripe one comes away, an unripe one holds on
let tree3 = null;
// which way to look at something so nothing stands between the camera and it: tries 16 sides, starting from where the camera is now
function clearSide(c, dist, up, skip, wide = 1.1, ys = [.1, .7]) { const V = (x, y, z) => new THREE.Vector3(x, y, z), a0 = Math.atan2(camera.position.z - c.z, camera.position.x - c.x), rc = new THREE.Raycaster(), hide = player.visible; rc.camera = camera; player.visible = false;
  const blocks = h => h.object.visible && !(skip && skip.getObjectById(h.object.id)) && h.object.material && h.object.material.visible !== false && !h.object.material.transparent && !h.object.isSprite;
  let pick = null; for (let k = 0; k < 16 && !pick; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 8, d = V(Math.cos(a), 0, Math.sin(a)), cp = c.clone().addScaledVector(d, dist).add(V(0, up, 0)), sd = V(d.z, 0, -d.x);
    const clear = [-wide, 0, wide].every(o => { for (const y of ys) { const p = c.clone().addScaledVector(sd, o).add(V(0, y, 0)), dir = cp.clone().sub(p), len = dir.length(); rc.set(p.clone().addScaledVector(dir.normalize(), .25), dir); rc.far = len - .25 + .4;
      if (rc.intersectObjects(scene.children, true).some(blocks)) return false; } return true; });
    const roomy = clear && [-.6, -.3, 0, .3, .6].every(ha => [.15, .45, .75].every(va => { const f = c.clone().sub(cp).setY(0).normalize().applyAxisAngle(V(0, 1, 0), ha), dir = f.multiplyScalar(Math.cos(va)).add(V(0, -Math.sin(va), 0)).normalize(); rc.set(cp, dir); rc.far = 1.8; return !rc.intersectObjects(scene.children, true).some(blocks); })); /* nothing filling the edges of the view either */
    if (roomy && !solidPt(c.x + d.x * 2, c.z + d.z * 2)) pick = d; }
  player.visible = hide; return pick || V(Math.cos(a0), 0, Math.sin(a0)); }
// how much is crowding a camera at cp looking at look: rays fanned across the view, counting things closer than 2.2
function crowd(cp, look) { const rc = new THREE.Raycaster(), hide = player.visible, f = look.clone().sub(cp).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f); let n = 0; rc.camera = camera; player.visible = false;
  for (let x = -.6; x <= .61; x += .3) for (let y = -.45; y <= .46; y += .3) { rc.set(cp, f.clone().addScaledVector(r, x).addScaledVector(u, y).normalize()); rc.far = 2.2; if (rc.intersectObjects(scene.children, true).some(h => h.object.visible && h.object.material && h.object.material.visible !== false && !h.object.material.transparent && !h.object.isSprite)) n++; }
  player.visible = hide; return n; }
function fruitGame(t) { if (tree3 || cine) return; target = null; pending = null;
  const kind = t.userData.fruitKind, apple = kind === 'apple', fr = t.userData.fruits, F = fr.children.filter(c => c.isMesh), V = (x, y, z) => new THREE.Vector3(x, y, z), tp = t.getWorldPosition(V(0, 0, 0));
  const UNRIPE = apple ? [0x8fbf4a, 0xa7c454, 0xb27a3e, 0xc7b85a] : [0x9cbf55, 0xb8c766, 0xd9b25a, 0xd6c070] /* one is almost there: blushing, but still green underneath */, ripeI = Math.floor(Math.random() * F.length), olds = F.map(f => f.material);
  F.forEach((f, n) => { f.material = f.material.clone(); f.material.color.setHex(n === ripeI ? (apple ? 0xe8463c : 0xffa34d) : UNRIPE[n % UNRIPE.length]); f.userData.orig = f.position.clone(); });
  const fw = new THREE.Vector3(); fr.getWorldPosition(fw);
  const toCam = clearSide(fw, 3.6, .3, t), side = V(toCam.z, 0, -toCam.x);
  { const lc = fr.worldToLocal(fw.clone().addScaledVector(toCam, 3)), a0 = Math.atan2(lc.z, lc.x); // bring all the fruit round to the side facing you, a little bigger, so every one can be seen and tapped
    F.forEach((f, n) => { const a = a0 + (n - 3.5) * .3, h = .1 + ((n * 37) % 7) * .1; f.position.set(Math.cos(a) * 1.08, h, Math.sin(a) * 1.08); f.userData.home = f.position.clone(); f.userData.sc = f.scale.x; f.scale.setScalar(f.scale.x * 1.35); }); }
  player.position.copy(tp).addScaledVector(toCam, .4).addScaledVector(side, 2.4); player.position.y = groundAt(player.position.x, tp.y + .5, player.position.z) ?? tp.y; player.rotation.y = Math.atan2(-side.x, -side.z); cine = { hold:true }; document.body.classList.add('in-cine');
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="frMsg">Only 1 ${ITEMS[kind].name.toLowerCase()} is ripe today.<br>Tap the one you think is ready to lift and twist it.</p><div class="fhbtns"><button id="frDone" class="ghost">Done</button></div>`; document.body.appendChild(hud);
  const msg = h => { const e = $('frMsg'); if (e) e.innerHTML = h; };
  let state = 'pick', wob = null, wobT = 0, drop = null, dropT = 0, tries = 0, last = performance.now(), raf, tt = 0;
  const cleanup = () => { cancelAnimationFrame(raf); hud.remove(); F.forEach((f, n) => { f.material = olds[n]; f.position.copy(f.userData.orig); f.rotation.set(0, 0, 0); f.scale.setScalar(f.userData.sc); }); tree3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); drawUsed && 0; };
  $('frDone').onclick = cleanup;
  const press = e => { if (state !== 'pick') return; ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(F, false)[0]; if (!h) return msg('Tap one of the fruits on the tree.'); const n = F.indexOf(h.object); tries++;
    if (n !== ripeI) { wob = h.object; wobT = 0; tone(260, { dur:.12, vol:.05 }); return msg(`<b>It holds on tight.</b> Still ${apple ? 'green' : 'greenish'}, so not ripe yet. Try another.`); }
    state = 'drop'; drop = h.object; dropT = 0; sfx('pick');
    S.fruit[t.userData.i] = S.day; bagAdd(kind); goal('fruit'); communityAdd('fruit'); save(); drawHud();
    msg(`<b>It comes away in your hand.</b>${tries === 1 ? ' First try!' : ''}<br>A ripe fruit lets go with a gentle lift and twist. An unripe one holds on tight.<br>${apple ? 'Inside a ripe apple, the seeds have turned dark brown.' : 'A ripe peach has lost its green, even near the stem.'}`); $('frDone').textContent = 'Close'; $('frDone').className = ''; };
  const step = dt => { tt += dt; if (wob) { wobT += dt; wob.position.copy(wob.userData.home).add(V(Math.sin(wobT * 40) * .03 * Math.max(0, 1 - wobT * 2), 0, 0)); if (wobT > .5) { wob.position.copy(wob.userData.home); wob = null; } }
    if (drop) { dropT += dt; const k = Math.min(1, dropT / .7); drop.rotation.y = k * 3; drop.position.copy(drop.userData.home).add(V(0, -k * 1.2 + Math.sin(k * Math.PI) * .2, k * .4)); if (k >= 1 && state === 'drop') { state = 'done'; drop.visible = false; fr.visible = false; drop.visible = true; burst(fw.clone().setY(fw.y - .4), apple ? 0xff6b6b : 0xffb36b, 10); toast(`Picked a ${ITEMS[kind].name}!`); } }
    camera.position.lerp(fw.clone().addScaledVector(toCam, 3.6).add(V(0, .3, 0)), 1 - Math.pow(.02, dt)); camera.lookAt(fw.x, fw.y + .2, fw.z); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); if (tree3) raf = requestAnimationFrame(loop); };
  tree3 = { press, step, get state() { return { state, tries, ripeI }; }, fruitPoint:n => F[n].getWorldPosition(V(0, 0, 0)) }; loop(); }
function _oldPickFruit(t) { const i = t.userData.i;
  S.fruit[i] = S.day; bagAdd(t.userData.fruitKind); goal('fruit'); communityAdd('fruit'); t.userData.fruits.visible = false; sfx('pick');
  const wp = new THREE.Vector3(); t.getWorldPosition(wp); burst(wp.setY(wp.y + 1), t.userData.fruitKind === 'apple' ? 0xff6b6b : 0xffb36b);
  toast(`Picked a ${ITEMS[t.userData.fruitKind].name}!`); save();
}
function drawFishArt(g, x, y, len, f, tilt = 0) {
  const hx = c => '#' + c.toString(16).padStart(6, '0');
  g.save(); g.translate(x, y); g.rotate(tilt);
  if (f.glow) { const gr = g.createRadialGradient(0,0,4,0,0,len*.8); gr.addColorStop(0, 'rgba(255,243,138,.55)'); gr.addColorStop(1, 'rgba(255,243,138,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0,0,len*.8,0,7); g.fill(); }
  if (f.ray) {
    g.fillStyle = hx(f.body); g.beginPath(); g.moveTo(len*.35,0); g.quadraticCurveTo(0,-len*.55,-len*.25,0); g.quadraticCurveTo(0,len*.55,len*.35,0); g.fill();
    g.strokeStyle = hx(f.fin); g.lineWidth = 4; g.beginPath(); g.moveTo(-len*.25,0); g.quadraticCurveTo(-len*.5,len*.05,-len*.7,-len*.08); g.stroke();
    g.fillStyle = hx(f.belly); g.beginPath(); g.ellipse(len*.08,0,len*.12,len*.2,0,0,7); g.fill();
  } else {
    const h = f.long ? len*.16 : f.round ? len*.42 : len*.3, bl = f.long ? len*.5 : len*.36;
    g.fillStyle = hx(f.fin); g.beginPath(); g.moveTo(-bl*.85,0); g.lineTo(-bl*1.35,-h*.8); g.lineTo(-bl*1.2,0); g.lineTo(-bl*1.35,h*.8); g.closePath(); g.fill(); // tail
    if (f.round) { g.beginPath(); g.moveTo(-bl*.1,-h*.9); g.lineTo(bl*.1,-h*1.6); g.lineTo(bl*.35,-h*.8); g.fill(); g.beginPath(); g.moveTo(-bl*.1,h*.9); g.lineTo(bl*.1,h*1.6); g.lineTo(bl*.35,h*.8); g.fill(); }
    else { g.beginPath(); g.moveTo(-bl*.2,-h*.85); g.quadraticCurveTo(bl*.1,-h*1.5,bl*.35,-h*.85); g.fill(); }
    g.fillStyle = hx(f.body); g.beginPath(); g.ellipse(0,0,bl,h,0,0,7); g.fill();
    g.save(); g.beginPath(); g.ellipse(0,0,bl,h,0,0,7); g.clip(); g.fillStyle = hx(f.belly); g.fillRect(-bl, h*.15, bl*2, h);
    if (f.spots) { g.fillStyle = hx(f.spots); [[-.3,-.3,.22],[.15,-.45,.16],[-.05,.1,.14],[.35,-.1,.12]].forEach(([sx,sy,sr]) => { g.beginPath(); g.arc(sx*bl, sy*h, sr*h, 0, 7); g.fill(); }); }
    g.restore();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(bl*.62,-h*.18,Math.max(3,h*.2),0,7); g.fill(); g.fillStyle = '#2b2233'; g.beginPath(); g.arc(bl*.66,-h*.18,Math.max(2,h*.12),0,7); g.fill();
    g.fillStyle = hx(f.fin); g.globalAlpha = .8; g.beginPath(); g.ellipse(-bl*.05,h*.25,bl*.18,h*.14,.5,0,7); g.fill(); g.globalAlpha = 1;
  }
  g.restore();
}
function fishing(o = {}) {
  const night = hour() >= 20 && S.aha.includes('stars'), secret = !!o.secret, W = 520, H = 320;
  showCard(`<div class="kicker">${secret ? 'THE SECRET SPOT' : 'THE CLOUD STREAM'}</div><h2>Fishing</h2>
    <p id="fhelp">Tap Cast. When the bobber gets pulled under, tap Hook it! Then hold Reel to keep the green zone over the fish until the meter fills.</p>
    <canvas id="pondC" class="rope" width="${W}" height="${H}" style="background:#8fc3f2;touch-action:none"></canvas>
    <p id="fmsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px">${secret ? 'You are at the secret spot. The big ones live here.' : ''}</p>
    <button id="fAct" style="min-width:140px">Cast</button> ${night && !secret ? '<button id="secret" class="ghost">Find the secret spot</button> ' : ''}<button id="later" class="ghost">Done</button>`, null);
  const cv = $('pondC'), g = cv.getContext('2d'), act = $('fAct'), msg = t => $('fmsg').textContent = t;
  const ctx = { season:season(), hour:hour(), raining:raining && S.t < .5, secret };
  const pool = FISH.filter(f => f.when(ctx)).map(f => ({ ...f, weight: f.id === 'moonray' && moon().idx === 4 ? f.weight * 2 : f.weight }));
  let state = 'ready', t0 = 0, now = 0, raf, fish = null, nextNibble = 0, biteAt = 0, holding = false, zone = .3, zoneV = 0, fishX = .5, fishT = .5, fishNext = 0, meter = .3, size = 0, reelTick = 0, splashes = [];
  const shadows = [0,1,2].map(i => ({ x:Math.random()*W, y:170 + i*40, v:(Math.random() < .5 ? -1 : 1) * (12 + Math.random()*14), s:.7 + Math.random()*.5 }));
  const BX = 330, BY = 150, TIP = [70, 60];
  const pickFish = () => { let r = Math.random() * pool.reduce((a, f) => a + f.weight, 0); for (const f of pool) { if ((r -= f.weight) <= 0) return f; } return pool[0]; };
  const setAct = (label, dis = false) => { act.textContent = label; act.disabled = dis; act.style.opacity = dis ? .5 : 1; };
  const splash = (x, y, big) => splashes.push({ x, y, r:4, a:1, big });
  const draw = () => {
    const sky = g.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#cfe9ff'); sky.addColorStop(.28,'#9fd0f5'); sky.addColorStop(1,'#5f9fd6');
    g.fillStyle = sky; g.fillRect(0,0,W,H);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
    for (let i=0;i<6;i++){ g.beginPath(); const y = 100 + i*36; for (let x=0;x<=W;x+=20) g.lineTo(x, y + Math.sin(x*.03 + now*1.5 + i)*3); g.stroke(); }
    shadows.forEach(sh => { if (state === 'reel' || state === 'caught') return; sh.x += sh.v * .016; if (sh.x < -40) sh.x = W + 40; if (sh.x > W + 40) sh.x = -40;
      if (state === 'wait' || state === 'bite') { sh.x += (BX - sh.x) * .004; sh.y += (BY + 20 - sh.y) * .004; }
      g.fillStyle = 'rgba(30,50,90,.22)'; g.beginPath(); g.ellipse(sh.x, sh.y, 26*sh.s, 9*sh.s, 0, 0, 7); g.fill(); });
    g.fillStyle = '#c98f58'; g.fillRect(0, 40, 90, 18); g.fillStyle = '#9b6b4a'; g.fillRect(10, 58, 10, 50); g.fillRect(70, 58, 10, 50); // the dock
    g.strokeStyle = '#6b4f3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(30, 90); g.lineTo(TIP[0], TIP[1]); g.stroke(); // rod
    if (state === 'casting' || state === 'wait' || state === 'bite' || state === 'reel') {
      const k = state === 'casting' ? Math.min(1, (now - t0) / .5) : 1;
      let bx = TIP[0] + (BX - TIP[0]) * k, by = TIP[1] + (BY - TIP[1]) * k - Math.sin(k * Math.PI) * 60;
      if (state === 'wait') by += Math.sin(now*3)*2 + (now < nextNibble - 1.1 && now > nextNibble - 1.3 ? 5 : 0);
      if (state === 'bite') by += 12;
      if (state === 'reel') { bx += Math.sin(now*22)*4; by += 10; }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...TIP); g.quadraticCurveTo((TIP[0]+bx)/2, Math.min(TIP[1], by) - 30*k, bx, by); g.stroke();
      if (state !== 'reel') { g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by + 4, 9, 0, Math.PI); g.fill(); g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(bx, by + 4, 9, Math.PI, 0); g.fill(); }
      if (state === 'bite') { g.fillStyle = '#ffc857'; g.font = 'bold 44px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.fillText('!', bx, by - 22 + Math.sin(now*20)*3); }
    }
    splashes = splashes.filter(sp => { sp.r += sp.big ? 2.2 : 1.2; sp.a -= .025; g.strokeStyle = `rgba(255,255,255,${sp.a})`; g.lineWidth = 3; g.beginPath(); g.ellipse(sp.x, sp.y, sp.r*1.6, sp.r*.6, 0, 0, 7); g.stroke(); return sp.a > 0; });
    if (state === 'reel') {
      if (Math.random() < .2) splash(BX + (Math.random()-.5)*30, BY + 12, false);
      const x0 = 30, x1 = W - 30, bw = x1 - x0, zw = (.42 - fish.fight*.16) * bw, y = 262;
      g.fillStyle = 'rgba(255,248,238,.92)'; g.beginPath(); g.roundRect(x0 - 10, y - 30, bw + 20, 78, 16); g.fill();
      g.fillStyle = '#eadfd0'; g.beginPath(); g.roundRect(x0, y, bw, 26, 13); g.fill();
      const zx = x0 + zone * (bw - zw), fx = x0 + fishX * bw, inside = fx >= zx && fx <= zx + zw;
      g.fillStyle = inside ? '#8fdc8a' : '#c7e8c4'; g.beginPath(); g.roundRect(zx, y, zw, 26, 13); g.fill();
      drawFishArt(g, fx, y + 13, 30, fish, Math.sin(now*14)*.3);
      g.fillStyle = '#eadfd0'; g.beginPath(); g.roundRect(x0, y - 20, bw, 10, 5); g.fill();
      g.fillStyle = meter > .7 ? '#2fae60' : meter > .35 ? '#ffc857' : '#ff8fa3'; g.beginPath(); g.roundRect(x0, y - 20, Math.max(10, bw * meter), 10, 5); g.fill();
    }
    if (state === 'caught') {
      const k = Math.min(1, (now - t0) / .6), cx = W/2, cy = 150 - Math.sin(k * Math.PI * .5) * 20 + (1 - k) * 60;
      g.save(); g.translate(cx, 150); g.rotate(now * .5); for (let i=0;i<12;i++){ g.rotate(Math.PI/6); g.fillStyle = 'rgba(255,248,200,.35)'; g.beginPath(); g.moveTo(0,0); g.lineTo(200, -18); g.lineTo(200, 18); g.fill(); } g.restore();
      drawFishArt(g, cx, cy, fish.ray ? 200 : fish.long ? 230 : 150 + fish.fight*60, fish, Math.sin(now*3)*.08);
      for (let i=0;i<8;i++){ const a = now*2 + i; g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(cx + Math.cos(a)*(130 + i*6), 150 + Math.sin(a*1.3)*80, 3, 0, 7); g.fill(); }
    }
  };
  const land = () => {
    state = 'caught'; t0 = now;
    const f = fish, isNew = !S.found.includes(f.id); S.fishLog = S.fishLog || {}; const rec = S.fishLog[f.id] || { n:0, best:0 };
    const isRecord = rec.n > 0 && size > rec.best; rec.n++; rec.best = Math.max(rec.best, size); S.fishLog[f.id] = rec;
    quietFind = true; bagAdd(f.id); quietFind = false; goal('fish'); communityAdd('fishing'); save(); burst(new THREE.Vector3(player.position.x, player.position.y, player.position.z), f.body, 18);
    [523,659,784,1047].forEach((fr,i) => setTimeout(() => chime(fr), i*110)); sfx('splash');
    const price = Math.round(ITEMS[f.id].sell * (S.mode === 'fisher' ? 1.25 : 1));
    $('fhelp').innerHTML = `<b style="font-size:20px">You caught a ${ITEMS[f.id].name}!</b> ${size} cm. ${isNew ? '<span style="background:#6fd3b8;color:#fff;border-radius:99px;padding:1px 8px;font-weight:800">NEW!</span>' : ''} ${isRecord ? '<span style="background:#ffc857;border-radius:99px;padding:1px 8px;font-weight:800">New record!</span>' : ''}`;
    msg(isNew ? `In real life: ${FINDS[f.id].fact}` : `Sells for ${price} coins. Your biggest: ${rec.best} cm.`);
    setAct('Cast again');
  };
  const lose = why => { state = 'ready'; msg(why); setAct('Cast again'); tone(300, { to:140, dur:.4, vol:.05 }); };
  const loop = () => {
    const dt = .016; now += dt;
    if (state === 'casting' && now - t0 > .5) { state = 'wait'; splash(BX, BY + 8, false); sfx('splash'); nextNibble = now + 1 + Math.random(); biteAt = now + 2.2 + Math.random()*3; msg('Wait for it...'); }
    if (state === 'wait') {
      if (now > nextNibble) { tone(900, { dur:.05, vol:.025 }); splash(BX, BY + 8, false); nextNibble = now + .6 + Math.random()*1.2; }
      if (now > biteAt) { state = 'bite'; t0 = now; fish = pickFish(); splash(BX, BY + 8, true); sfx('splash'); tone(220, { to:110, dur:.25, vol:.08 }); msg('Something bit! Tap Hook it!'); setAct('Hook it!'); }
    }
    if (state === 'bite' && now - t0 > 1.1) lose('Too slow. It slipped off the hook.');
    if (state === 'reel') {
      zoneV += (holding ? 2.4 : -1.8) * dt; zoneV *= .985; zoneV = Math.max(-1, Math.min(1, zoneV)); zone += zoneV * dt;
      if (zone < 0) { zone = 0; zoneV = 0; } if (zone > 1) { zone = 1; zoneV = 0; }
      if (now > fishNext) { fishT = Math.random(); fishNext = now + (1.3 - fish.fight) * (.5 + Math.random()); }
      fishX += (fishT - fishX) * dt * (1 + fish.fight * 4);
      const zw = .42 - fish.fight*.16, zx = zone * (1 - zw), inside = fishX >= zx && fishX <= zx + zw;
      meter += (inside ? .3 : -.1 - fish.fight*.1) * dt;
      if (holding && (reelTick += dt) > .09) { reelTick = 0; tone(1300, { dur:.03, vol:.012 }); }
      if (meter >= 1) land(); else if (meter <= 0) lose(`It got away! ${fish.fight > .5 ? 'That was a strong one.' : 'Try again.'}`);
    }
    draw(); raf = requestAnimationFrame(loop);
  };
  const hold = on => { holding = on; };
  act.onclick = () => {
    if (state === 'ready' || state === 'caught') { if (!pool.length) return msg('Nothing is biting here right now.'); state = 'casting'; t0 = now; sfx('cast'); S.t = Math.min(.99, S.t + 10/(60*18)); drawHud(); msg('');
      $('fhelp').textContent = 'Tap Cast. When the bobber gets pulled under, tap Hook it! Then hold Reel to keep the green zone over the fish until the meter fills.'; setAct('Wait...', true); return; }
    if (state === 'wait') return lose('Too soon! The fish swam off.');
    if (state === 'bite') { state = 'reel'; meter = .45; zone = .35; zoneV = 0; fishX = .5; fishNext = 0; size = Math.round(fish.cm[0] + (fish.cm[1] - fish.cm[0]) * Math.pow(Math.random(), 1.6)); msg('Hold Reel to move the green zone. Keep the fish inside it!'); setAct('Hold to reel'); }
  };
  ['pointerdown','pointerup','pointerleave','pointercancel'].forEach(ev => { act.addEventListener(ev, e => { if (state === 'reel') { e.preventDefault(); hold(ev === 'pointerdown'); } }); cv.addEventListener(ev, e => { if (state === 'reel') hold(ev === 'pointerdown'); }); });
  const key = e => { if (e.code === 'Space' && state === 'reel') { e.preventDefault(); hold(e.type === 'keydown'); } };
  addEventListener('keydown', key); addEventListener('keyup', key);
  window.__sgFish = () => ({ state, fishX, zone, zw: fish ? .42 - fish.fight*.16 : 0, meter }); // read-only, for testing
  loop();
  cardCleanup = () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); };
  if (night && !secret) $('secret').onclick = () => starPuzzle({ title:'Find the secret spot', text:'The big fish rest under the 1 star that never moves. Find it.',
    done:() => { const first = !S.used.includes('stars'); const go = () => fishing({ secret:true }); first ? showRecall('stars', go) : go(); } });
  $('later').onclick = hideCard;
}

// ============ FISHING, OUT IN THE WORLD ============
// A pool of cloud water past the end of each dock, with fish shadows you can see before you cast.
function makePool(d) {
  const pool = new THREE.Group(); pool.position.set(3.9, -.32, 0); d.add(pool);
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.7, 48), new THREE.MeshStandardMaterial({ color:0x7ec8e3, transparent:true, opacity:.78, roughness:.2, metalness:.1 }));
  water.rotation.x = -Math.PI/2; pool.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.7, .12, 8, 48), new THREE.MeshStandardMaterial({ color:0xffffff, transparent:true, opacity:.7 })); rim.rotation.x = Math.PI/2; pool.add(rim);
  const rings = [0,1,2].map(i => { const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 40), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.25, side:THREE.DoubleSide })); r.rotation.x = -Math.PI/2; r.position.y = .01; r.userData.ph = i / 3; pool.add(r); return r; });
  pool.userData = { rings, water };
  return pool;
}
const pools = [makePool(dock), makePool(homeDock)];
function animatePools(now) { pools.forEach(p => p.userData.rings.forEach(r => { const k = (now * .15 + r.userData.ph) % 1; r.scale.setScalar(.4 + k * 2.2); r.material.opacity = .28 * (1 - k); })); }
// a little 3D fish, built from the same colors as the fish in the fish table
function fishMesh(f, len) {
  const g = new THREE.Group(), body = mat(f.body), fin = mat(f.fin), belly = mat(f.belly);
  if (f.ray) { const d = mesh(sph(.5), body); d.scale.set(len*.5, len*.07, len*.6); g.add(d); const b = mesh(sph(.5), belly, 0, -.02, 0); b.scale.set(len*.3, len*.05, len*.35); g.add(b);
    const tail = mesh(new THREE.CylinderGeometry(.02, .04, len*.8, 5), fin, -len*.5, 0, 0); tail.rotation.z = Math.PI/2; g.add(tail); }
  else { const h = f.round ? .42 : .28, b = mesh(sph(.5), body); b.scale.set(len, len*h, len*h*.7); g.add(b);
    const bl = mesh(sph(.5), belly, len*.05, -len*h*.18, 0); bl.scale.set(len*.8, len*h*.6, len*h*.66); g.add(bl);
    const tail = mesh(new THREE.ConeGeometry(len*h*.5, len*.35, 4), fin, -len*.6, 0, 0); tail.rotation.z = Math.PI/2; tail.scale.z = .25; g.add(tail);
    const top = mesh(new THREE.ConeGeometry(len*.12, len*h*.7, 4), fin, 0, len*h*.5, 0); top.scale.z = .2; g.add(top);
    if (f.spots) [[-.15,.1],[.12,.14],[.02,-.02]].forEach(([x,y]) => [-1,1].forEach(sd => g.add(mesh(sph(len*.06), mat(f.spots), x*len, y*len, sd*len*h*.33))));
    [-1,1].forEach(sd => { g.add(mesh(sph(len*.05), mat(0xffffff), len*.38, len*h*.12, sd*len*h*.3)); g.add(mesh(sph(len*.03), mat(0x2b2233), len*.41, len*h*.12, sd*len*h*.33)); }); }
  if (f.glow) { const hl = halo(f.glow, len * 2, .6); g.add(hl); }
  return g;
}
let fish3 = null;
function fishing3D(d = dock, o = {}) {
  if (fish3) return; const secret = !!o.secret, night = hour() >= 20 && S.aha.includes('stars');
  const pool = pools[d === homeDock ? 1 : 0], W = v => d.localToWorld(v.clone()), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ctx = { season:season(), hour:hour(), raining:raining && S.t < .5, secret };
  const table = FISH.filter(f => f.when(ctx)).map(f => ({ ...f, weight: f.id === 'moonray' && moon().idx === 4 ? f.weight * 2 : f.weight }));
  const pickFish = () => { let r = Math.random() * table.reduce((a, f) => a + f.weight, 0); for (const f of table) { if ((r -= f.weight) <= 0) return f; } return table[0]; };
  // stand at the end of the dock, facing the water
  const stand = W(V(2.1, 0, 0)), aim = W(V(3.9, 0, 0)); player.position.copy(stand); player.rotation.y = Math.atan2(aim.x - stand.x, aim.z - stand.z);
  target = null; pending = null; closeDialog();
  cine = { t:0, dur:1.2, p0:camera.position.clone(), p1:W(V(-.4, 2.6, 2.3)), l0:player.position.clone(), l1:W(V(4.2, -.3, -.2)), res:null };
  document.body.classList.add('in-cine');
  // rod, line, bobber
  const rod = new THREE.Group(); rod.position.set(.32, .95, .25); rod.rotation.x = .9; player.add(rod);
  rod.add(mesh(new THREE.CylinderGeometry(.018, .035, 1.7, 6), mat(0x9b6b4a), 0, .85, 0)); const tip = new THREE.Object3D(); tip.position.y = 1.7; rod.add(tip);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([...Array(16)].map(() => V(0,0,0))), line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:.85 })); scene.add(line); line.visible = false;
  const bob = new THREE.Group(); bob.add(mesh(new THREE.SphereGeometry(.09, 12, 8, 0, Math.PI*2, 0, Math.PI/2), mat(0xff5a5a))); const bw = mesh(new THREE.SphereGeometry(.09, 12, 8, 0, Math.PI*2, Math.PI/2, Math.PI/2), mat(0xffffff)); bob.add(bw); scene.add(bob); bob.visible = false;
  const bang = new THREE.Sprite(new THREE.SpriteMaterial({ map:(() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#ffc857'; x.font = 'bold 56px sans-serif'; x.textAlign = 'center'; x.fillText('!', 32, 54); return new THREE.CanvasTexture(c); })(), transparent:true }));
  bang.scale.setScalar(.6); scene.add(bang); bang.visible = false;
  // fish shadows: you can see how big a fish is before it bites
  const shadowMat = new THREE.MeshBasicMaterial({ color:0x1d2a4a, transparent:true, opacity:.35, depthWrite:false });
  const newShadow = () => { const f = pickFish(), size = Math.round(f.cm[0] + (f.cm[1] - f.cm[0]) * Math.pow(Math.random(), 1.6)), k = Math.min(1, (size - f.cm[0]) / Math.max(1, f.cm[1] - f.cm[0]));
    const sc = f.ray || f.id === 'sunfish' ? 1.3 + k*.5 : f.cm[1] < 20 ? .35 + k*.15 : .6 + k*.45;
    const m = new THREE.Mesh(new THREE.CircleGeometry(.5, 20), shadowMat); m.rotation.x = -Math.PI/2; m.scale.set(sc, sc*.4, 1); m.position.set((Math.random()-.5)*3, .02, (Math.random()-.5)*3);
    m.userData = { f, size, vx:(Math.random()-.5)*.6, vz:(Math.random()-.5)*.6 }; pool.add(m); return m; };
  let shadows = table.length ? [newShadow(), newShadow(), newShadow()] : [];
  // the on-screen controls
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="fhMsg">${secret ? 'The secret spot. The big ones live here.' : 'Tap the water right next to a shadow to cast there.<br>A big shadow means a big fish.'}</p>
    <div id="fhReel" class="fhreel" hidden><div class="fhmeter"><b id="fhM"></b></div><div class="fhbar"><i id="fhZ"></i><span id="fhF">🐟</span></div></div>
    <div class="fhbtns"><button id="fhAct">Cast</button>${night && !secret ? '<button id="fhSecret" class="ghost">Find the secret spot</button>' : ''}<button id="fhDone" class="ghost">Done</button></div>`;
  document.body.appendChild(hud);
  const msg = t => { $('fhMsg').textContent = t; }, act = $('fhAct'), setAct = (l, dis) => { act.textContent = l; act.disabled = !!dis; act.style.opacity = dis ? .5 : 1; };
  let state = 'ready', t0 = 0, now = 0, last = performance.now(), raf, cur = null, nextNibble = 0, biteAt = 0, holding = false, zone = .3, zoneV = 0, fishX = .5, fishT = .5, fishNext = 0, meter = .3, reelTick = 0, caught = null, arc = 0, aimP = null;
  const bobHome = () => aimP ? aimP.clone() : W(V(3.9 + Math.sin(arc) * .2, -.3, Math.cos(arc) * .3)); // where you tapped on the water, or straight out from the dock
  const splash = (p, big) => { burst(p.clone().setY(p.y + .05), 0xdff3ff, big ? 10 : 3); };
  const drawLine = (end, sag) => { const a = new THREE.Vector3(); tip.getWorldPosition(a); const pts = lineGeo.attributes.position;
    for (let i = 0; i < 16; i++) { const k = i / 15, p = a.clone().lerp(end, k); p.y -= Math.sin(k * Math.PI) * sag; pts.setXYZ(i, p.x, p.y, p.z); } pts.needsUpdate = true; };
  const land = () => {
    state = 'caught'; t0 = now; const f = cur.f, size = cur.size; petHappy();
    caught = fishMesh(f, f.ray ? .9 : Math.min(1.1, .25 + size / 160)); scene.add(caught); caught.position.copy(bob.position);
    bob.visible = false; line.visible = false; splash(bob.position, true); sfx('splash'); [523,659,784,1047].forEach((fr,i) => setTimeout(() => chime(fr), i*110));
    S.fishLog = S.fishLog || {}; const rec = S.fishLog[f.id] || { n:0, best:0 }, isNew = !S.found.includes(f.id), isRecord = rec.n > 0 && size > rec.best;
    cur.shadow.parent && pool.remove(cur.shadow); shadows = shadows.filter(s => s !== cur.shadow); if (table.length) shadows.push(newShadow());
    const fits = canCarry(f.id), keepable = fits;
    setTimeout(() => { if (!fish3) return;
      $('fhReel').hidden = true;
      msg(''); $('fhMsg').innerHTML = `<b style="font-size:20px">You caught a ${ITEMS[f.id].name}!</b> ${size} cm ${isNew ? '<span class="tagnew">NEW!</span>' : ''}${isRecord ? '<span class="tagrec">New record!</span>' : ''}<br>${!fits ? '<b>Your bag is full, so you can only let it go.</b>' : isNew ? `<i>In real life:</i> ${FINDS[f.id].fact}` : `Sells for ${Math.round(sellPrice(f.id))} coins.`}`;
      act.style.display = 'none';
      const btns = hud.querySelector('.fhbtns'), keepB = document.createElement('button'), relB = document.createElement('button');
      keepB.textContent = 'Keep it'; relB.textContent = 'Let it go'; relB.className = 'ghost'; if (!keepable) keepB.style.display = 'none'; btns.prepend(relB); btns.prepend(keepB);
      const after = () => { keepB.remove(); relB.remove(); act.style.display = ''; setAct('Cast again'); state = 'ready'; if (caught) { scene.remove(caught); caught = null; } msg('Watch the shadows. Tap Cast.'); };
      rec.n++; rec.best = Math.max(rec.best, size); S.fishLog[f.id] = rec; if (isNew) S.found.push(f.id); goal('fish'); communityAdd('fishing'); lean('explorer');
      keepB.onclick = () => { quietFind = true; bagAdd(f.id); quietFind = false; save(); drawHud(); sfx('pick'); after(); };
      relB.onclick = () => { if (featureOn('journey')) karma('harmony', 1); save(); sfx('splash'); state = 'release'; t0 = now; setTimeout(after, 900); };
    }, 900);
  };
  const lose = why => { state = 'ready'; msg(why); setAct('Cast again'); bob.visible = false; line.visible = false; bang.visible = false; $('fhReel').hidden = true; tone(300, { to:140, dur:.4, vol:.05 }); };
  const press = (on, e) => {
    if (!on) { holding = false; return; }
    if (state === 'reel') { holding = true; return; }
    if (state === 'ready') { if (!table.length) return msg('Nothing is biting here right now.'); aimP = null;
      if (e) { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera); const wp = pool.getWorldPosition(V(0, 0, 0)), hit = V(0, 0, 0);
        if (ray.ray.intersectPlane(new THREE.Plane(V(0, 1, 0), -(wp.y + .02)), hit)) { const lp = pool.worldToLocal(hit.clone()); if (Math.hypot(lp.x, lp.z) < 2.3) aimP = hit.setY(wp.y - .02); else return msg('Tap on the water to cast there.'); } }
      state = 'casting'; t0 = now; sfx('cast'); arc = Math.random() * 6; S.t = Math.min(.99, S.t + 10/(60*18)); drawHud(); msg(''); setAct('Wait...', true); return; }
    if (state === 'wait') return lose('Too soon! The fish swam off.');
    if (state === 'bite') { state = 'reel'; meter = .45; zone = .35; zoneV = 0; fishX = .5; fishNext = 0; holding = true; bang.visible = false; $('fhReel').hidden = false; msg('Hold to reel! Keep the fish inside the green zone.'); setAct('Hold to reel'); }
  };
  const loop = () => {
    const t = performance.now(), dt = Math.min(.05, (t - last) / 1000); last = t; now += dt;
    // shadows wander, and one swims to the bobber while you wait
    shadows.forEach(s => { const u = s.userData; if ((state === 'wait' || state === 'bite') && s === cur?.shadow) { const b = pool.worldToLocal(bob.position.clone()); s.position.x += (b.x - .25 - s.position.x) * dt * 1.2; s.position.z += (b.z - s.position.z) * dt * 1.2; }
      else if (state !== 'reel') { s.position.x += u.vx * dt; s.position.z += u.vz * dt; if (Math.hypot(s.position.x, s.position.z) > 2.2) { u.vx = -u.vx; u.vz = -u.vz; } if (Math.random() < .01) { u.vx = (Math.random()-.5)*.7; u.vz = (Math.random()-.5)*.7; } }
      s.rotation.z = Math.atan2(-u.vz, u.vx); });
    rod.rotation.x = .9 + (state === "reel" ? Math.sin(now*18)*.05 - .25 : 0);
    if (state === 'casting') { const k = Math.min(1, (now - t0) / .6), a = new THREE.Vector3(); tip.getWorldPosition(a); const e = bobHome();
      bob.visible = line.visible = true; bob.position.copy(a.lerp(e, k)).setY(bob.position.y + Math.sin(k*Math.PI) * 1.2); drawLine(bob.position, .2);
      if (k >= 1) { state = 'wait'; splash(bob.position, false); sfx('splash'); const bl = pool.worldToLocal(bob.position.clone()); let near = null, bd = aimP ? 1.3 : 9; shadows.forEach(sh => { const d2 = Math.hypot(sh.position.x - bl.x, sh.position.z - bl.z); if (d2 < bd) { bd = d2; near = sh; } }); if (!aimP && Math.random() < .5) near = shadows[Math.floor(Math.random() * shadows.length)] || near; cur = near ? { shadow:near, f:near.userData.f, size:near.userData.size } : null; // the fish closest to your bobber is the one that comes
        nextNibble = now + 1.2 + Math.random(); biteAt = now + 2.6 + Math.random()*3.2; msg('Wait for it... a shadow is coming.'); } }
    if (state === 'wait' || state === 'bite') { const e = bobHome(); bob.position.copy(e); bob.position.y += Math.sin(now*3)*.02;
      if (state === 'wait') { if (now > nextNibble) { tone(900, { dur:.05, vol:.025 }); splash(bob.position, false); nextNibble = now + .7 + Math.random()*1.2; } if (now < nextNibble - .55 && now > nextNibble - .75) bob.position.y -= .06;
        if (now > biteAt + 1.5 && !cur) lose('Nothing came. Cast right next to a shadow.'); else if (now > biteAt && cur) { state = 'bite'; t0 = now; splash(bob.position, true); sfx('splash'); tone(220, { to:110, dur:.25, vol:.08 }); msg('It bit! Tap Hook it!'); setAct('Hook it!'); bang.visible = true; } }
      if (state === 'bite') { bob.position.y -= .12; bang.position.copy(bob.position).setY(bob.position.y + .9 + Math.sin(now*20)*.05); if (now - t0 > 1.1) lose('Too slow. It slipped off the hook.'); }
      drawLine(bob.position, .15); }
    if (state === 'reel') { const f = cur.f, e = bobHome();
      bob.position.set(e.x + Math.sin(now*9)*.25, e.y - .1, e.z + Math.cos(now*7)*.25); if (Math.random() < .025) splash(bob.position, false); drawLine(bob.position, 0);
      zoneV += (holding ? 2.4 : -1.8) * dt; zoneV *= .985; zoneV = Math.max(-1, Math.min(1, zoneV)); zone += zoneV * dt; if (zone < 0) { zone = 0; zoneV = 0; } if (zone > 1) { zone = 1; zoneV = 0; }
      if (now > fishNext) { fishT = Math.random(); fishNext = now + (1.3 - f.fight) * (.5 + Math.random()); }
      fishX += (fishT - fishX) * dt * (1 + f.fight * 4);
      const zw = .42 - f.fight*.16, zx = zone * (1 - zw), inside = fishX >= zx && fishX <= zx + zw;
      meter += (inside ? .3 : -.1 - f.fight*.1) * dt;
      $('fhZ').style.left = `${zx*100}%`; $('fhZ').style.width = `${zw*100}%`; $('fhZ').className = inside ? 'in' : ''; $('fhF').style.left = `${fishX*100}%`;
      $('fhM').style.width = `${Math.max(3, meter*100)}%`; $('fhM').style.background = meter > .7 ? '#2fae60' : meter > .35 ? '#ffc857' : '#ff8fa3';
      if (holding && (reelTick += dt) > .09) { reelTick = 0; tone(1300, { dur:.03, vol:.012 }); }
      if (meter >= 1) land(); else if (meter <= 0) lose(`It got away! ${f.fight > .5 ? 'That was a strong one.' : 'Try again.'}`); }
    if ((state === 'caught' || state === 'release') && caught) { const k = Math.min(1, (now - t0) / .8), hand = player.position.clone().add(new THREE.Vector3(Math.sin(player.rotation.y) * .15, 2.05, Math.cos(player.rotation.y) * .15));
      if (state === 'caught') { const from = bobHome(); caught.position.lerpVectors(from, hand, easeIO(k)); caught.position.y += Math.sin(k*Math.PI) * 1.3; caught.rotation.z = Math.sin(now*8) * .2 * (1 - k) + (k >= 1 ? Math.sin(now*3)*.08 : 0); caught.rotation.y = player.rotation.y + Math.PI/2; holdUp = k > .7; }
      else { holdUp = false; const to = bobHome(); caught.position.lerpVectors(hand, to, easeIO(k)); caught.position.y += Math.sin(k*Math.PI) * .8; if (k >= 1 && caught.visible) { caught.visible = false; splash(to, true); } } }
    raf = requestAnimationFrame(loop);
  };
  const end = () => { cancelAnimationFrame(raf); holdUp = false; player.remove(rod); scene.remove(line, bob, bang); if (caught) scene.remove(caught); shadows.forEach(s => pool.remove(s));
    hud.remove(); removeEventListener('keydown', key); removeEventListener('keyup', key); fish3 = null; cine = null; document.body.classList.remove('in-cine');
    if (groundAt(player.position.x, player.position.y, player.position.z) === null) { const b = W(V(-.4, 0, 0)); player.position.set(b.x, groundAt(b.x, b.y, b.z) ?? b.y, b.z); } }; // never left standing on nothing
  const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(e.type === 'keydown'); } };
  addEventListener('keydown', key); addEventListener('keyup', key);
  act.addEventListener('pointerdown', e => { e.preventDefault(); press(true); }); ['pointerup','pointerleave','pointercancel'].forEach(ev => act.addEventListener(ev, () => press(false)));
  $('fhDone').onclick = end;
  if ($('fhSecret')) $('fhSecret').onclick = () => { end(); starPuzzle({ title:'Find the secret spot', text:'The big fish rest under the 1 star that never moves. Find it.',
    done:() => { const first = !S.used.includes('stars'); const go = () => { hideCard(); fishing3D(d, { secret:true }); }; first ? showRecall('stars', go) : go(); } }); };
  fish3 = { press, end };
  window.__sgFishShadows = () => shadows.map(sh => ({ w:pool.localToWorld(sh.position.clone()), size:sh.userData.size, id:sh.userData.f.id })); window.__sgFishCur = () => cur && { id:cur.f.id, size:cur.size }; window.__sgFish = () => ({ state, fishX, zone, zw: cur ? .42 - cur.f.fight*.16 : 0, meter, shadows:shadows.length }); // read-only, for testing
  loop();
}
let holdUp = false;

// --- the hut ---
const HOME_STAGES = [
  { name:'the frame', needs:{ log:6, stone:10 } },
  { name:'the walls' }, // what the walls need depends on the kind you pick
  { name:'the roof', needs:{ fiber:8, log:4 } },
];
const CRAFTS_OLD = [
  { id:'axe', name:'Stone Axe', needs:{ stick:3, stone:2, fiber:2 }, does:'Chop trees for logs.' },
  { id:'pick', name:'Stone Pickaxe', needs:{ stick:2, stone:3, fiber:1 }, does:'Break rocks for stone.' },
];
// --- backpack and storage space: each kind of item takes a slot, and a slot holds up to 30 ---
const STACK = 30;
var LIMITS_ON = false; // bag limits and chests are off for now (they may come back later); while off, you can carry everything
function slotsIn(box) { return Object.entries(box || {}).reduce((a, [k,n]) => a + (n > 0 && ITEMS[k] && ITEMS[k].kind !== 'quest' ? Math.ceil(n / STACK) : 0), 0); }
function packCap() { return 12 + (S.tools.bag1 ? 6 : 0) + (S.tools.bag2 ? 6 : 0) + (S.tools.bag3 ? 12 : 0); }
function storeCap() { return (S.builds || []).filter(b => b.p === 'chest').reduce((a, b) => a + (b.band ? 48 : 24), 0); }
// how many of item k fit (never forces anyone to drop what they already carry)
function roomFor(box, cap, k, n) { if (!LIMITS_ON || ITEMS[k]?.kind === 'quest') return n; const used = slotsIn(box), cur = box[k] || 0;
  let fit = 0; while (fit < n) { const next = used - Math.ceil(cur / STACK) + Math.ceil((cur + fit + 1) / STACK); if (next > cap && next > used) break; fit++; } return fit; }
const canCarry = (k, n = 1) => roomFor(S.bag, packCap(), k, n) >= n;
function bagFull() { toast(`Your backpack is full (${packCap()} slots). Put things in a chest, or craft a bigger bag at the workbench.`); sfx('click'); }
if (!LIMITS_ON && S.chest && Object.keys(S.chest).length) { Object.entries(S.chest).forEach(([k, n]) => { if (n > 0) S.bag[k] = (S.bag[k] || 0) + n; }); S.chest = {}; } // chests are off: their things go back in your bag
const have = k => S.bag[k] || 0, enough = needs => Object.entries(needs).every(([k,n]) => have(k) >= n);
// what something needs, shown the same way everywhere: how many you have out of how many it takes, like 0/14
const needName = (k, n) => { const t = plural(k, n).replace('grass fiber', 'grass'); return t[0].toUpperCase() + t.slice(1); };
const needText = needs => Object.entries(needs).map(([k,n]) => `${icon(k)} ${Math.min(have(k), n)}/${n} ${needName(k, n).toLowerCase()}`).join(', '); // in a sentence
const needChips = needs => `<span class="needs">${Object.entries(needs).map(([k,n]) => `<em class="${have(k) >= n ? 'ok' : 'no'}">${icon(k)} ${Math.min(have(k), n)}/${n}</em>`).join('')}</span>`; // on a row
const needList = (needs, coins) => `<div class="nlist">${Object.entries(needs).map(([k,n]) => `<div class="nrow ${have(k) >= n ? 'ok' : 'no'}"><span>${icon(k)} ${needName(k, n)}</span><b>${have(k) >= n ? '✓ ' : ''}${Math.min(have(k), n)}/${n}</b></div>`).join('')}${coins ? `<div class="nrow ${S.coins >= coins ? 'ok' : 'no'}"><span><i class="nco">${ICON.coin}</i> Coins</span><b>${S.coins >= coins ? '✓ ' : ''}${Math.min(S.coins, coins)}/${coins}</b></div>` : ''}</div>`; // on a card, one thing to a line
const stageNeeds = st => st === 1 ? HOME_STYLES[homeStyle()].needs : HOME_STAGES[st].needs;
function drawHome() {
  const st = S.home || 0; house.visible = st >= 3; buildSite.visible = st < 3;
  siteWalls.children.forEach((c, i) => c.material.color.set(homeStyle() === 'log' ? (i % 2 ? 0xa9744a : 0x96633f) : homeStyle() === 'stone' ? (i % 2 ? 0xb9b2c2 : 0x9a93a8) : (i % 2 ? 0xfff1d6 : 0xf2e2c4)));
  siteFrame.visible = st >= 1; siteWalls.visible = st >= 2; siteStones.children.slice(-2).forEach(c => c.visible = st === 0);
  campfire.visible = !VISIT;
}
// true if a spot is too close to something else you can tap
function nearThing(x, z) { try { const p = new THREE.Vector3(); return tappables().some(o => { if (o.userData.kind === 'pickup' || o.userData.kind === 'tile' || o.parent === pickupGroup) return false; o.getWorldPosition(p); return Math.hypot(p.x - x, p.z - z) < 1.3; }); } catch { return false; } }
function spawnPickups() {
  if (VISIT) return;
  const kinds = ['stick','stick','stone','fiber'], rnd = () => Math.random();
  while (S.pickups.length < 6) { let x, z, tries = 0; do { const land = [{ x:0, z:0, r:8.2 }, ...ownedLobes().map(L => ({ x:L.e.x, z:L.e.z, r:L.r - .8 }))], L = land[Math.floor(rnd()*land.length)], a = rnd()*Math.PI*2, r = (L.r === 8.2 ? 4.8 : 0) + rnd()*(L.r - (L.r === 8.2 ? 4.8 : 0)); x = L.x + Math.cos(a)*r; z = L.z + Math.sin(a)*r; tries++; }
    while (tries < 20 && ((x > .2 && x < 4.8 && z > -2 && z < 3.8) || Math.hypot(x+4, z+3) < 2 || nearThing(x, z))); const needStone = !S.tools.pick && S.pickups.filter(p => p.t === 'stone').length < 2, needStick = !S.tools.axe && S.pickups.filter(p => p.t === 'stick').length < 3; S.pickups.push({ t:needStone ? 'stone' : needStick ? 'stick' : kinds[Math.floor(rnd()*4)], x, z }); }
  drawPickups();
}
function drawPickups() {
  S.pickups = (S.pickups || []).filter(p => Math.hypot(p.x, p.z) > 4.5 && !nearThing(p.x, p.z)).slice(0, 6); // older saves had more, closer in, some under other things
  pickupGroup.clear();
  S.pickups.forEach((p, i) => {
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.userData = { kind:'pickup', i };
    if (p.t === 'stick') [0,1].forEach(k => { const st = mesh(new THREE.CylinderGeometry(.03,.035,.55,5), mat(0x8a6445), k*.08, .05, k*.06); st.rotation.set(Math.PI/2, 0, .3 + k); g.add(st); });
    if (p.t === 'stone') { g.add(mesh(new THREE.DodecahedronGeometry(.11), mat(0x9a93a8), 0, .08, 0)); g.add(mesh(new THREE.DodecahedronGeometry(.08), mat(0xb3aabb), .12, .06, .05)); }
    if (p.t === 'fiber') for (let k=0;k<5;k++){ const bl = mesh(new THREE.ConeGeometry(.025,.35,4), mat(0xb7c46a), (k-2)*.03, .15, 0); bl.rotation.z = (k-2)*.15; g.add(bl); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(.22,.3,20), new THREE.MeshBasicMaterial({ color:0xfff1b0, transparent:true, opacity:.3, side:THREE.DoubleSide })); ring.rotation.x = -Math.PI/2; ring.position.y = -.03; g.add(ring);
    g.add(mesh(new THREE.CylinderGeometry(.3,.3,.3,8), new THREE.MeshBasicMaterial({ visible:false }), 0, .15, 0));
    pickupGroup.add(g);
  });
}
// a "+2 logs" label that floats up from where you gathered, and a quick arm swing
let swingT = 0;
const plural = (k, n) => { const w = ITEMS[k].name.toLowerCase(); if (n <= 1 || w.endsWith('s') || ['fiber', 'clay', 'tin', 'copper', 'kale', 'wheat', 'mint'].includes(k) || /(kale|wheat|mint)$/.test(w)) return w; return /(ch|sh|x)$/.test(w) ? w + 'es' : w + 's'; }; // peaches, not peachs
function floatText(text, where) {
  if (!where) return; const v = where.clone().setY(where.y + 1.2).project(camera);
  const d = document.createElement('div'); d.className = 'floaty'; d.textContent = text;
  d.style.left = `${(v.x*.5+.5)*innerWidth}px`; d.style.top = `${(-v.y*.5+.5)*innerHeight}px`;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
}
function gain(k, n, where, swing) { if (!canCarry(k, n)) { n = roomFor(S.bag, packCap(), k, n); if (!n) return false; } for (let i=0;i<n;i++) bagAdd(k); burst(where, { stick:0x9b6b4a, stone:0xb3aabb, fiber:0xb7c46a, log:0xc98f58 }[k], 8);
  floatText(`+${n} ${icon(k)} ${plural(k, n)}`, where); if (swing) { swingT = .5; if (where) player.rotation.y = Math.atan2(where.x - player.position.x, where.z - player.position.z); } drawHud(); save(); }
function usePickup(i) {
  const p = S.pickups[i]; if (!p) return; if (!canCarry(p.t)) return bagFull();
  const n = 1 + (Math.random() < .35 ? 1 : 0); S.pickups.splice(i, 1); drawPickups();
  gain(p.t, n, new THREE.Vector3(p.x, 0, p.z)); sfx({ stone:'stone', fiber:'swish', stick:'chop' }[p.t] || 'plant');
  hintToast();
}
// things gathered today show it: a tree has a fresh cut and chips at its foot, a rock is broken down smaller, a bush is trimmed short. Clay and ore are gone until tomorrow.
const usedToday = o => S.chopped[o.userData.key] === S.day;
function drawUsed() { try {
  scene.traverse(o => { const k = o.userData && o.userData.kind; if (k === 'tree') { if (usedToday(o) && !o.userData.cut) { const c = new THREE.Group(), lt = fine(0xf1d6a8); const w = mesh(new THREE.ConeGeometry(.12,.2,4), lt, 0, .5, .2); w.rotation.x = Math.PI / 2; c.add(w); for (let i = 0; i < 6; i++) { const ch = mesh(new THREE.BoxGeometry(.08,.02,.04), lt, Math.cos(i * 1.1) * .4, .02, .25 + Math.sin(i * 1.7) * .2); ch.rotation.y = i; c.add(ch); } o.userData.cut = c; o.add(c); } if (o.userData.cut) o.userData.cut.visible = usedToday(o); }
    if (k === 'rock') { if (o.userData.baseY == null) o.userData.baseY = o.position.y; const u = usedToday(o); o.scale.setScalar(u ? .7 : 1); o.position.y = o.userData.baseY * (u ? .7 : 1); }
    if (k === 'bush') o.scale.setScalar(usedToday(o) ? .68 : 1); });
  placeNodes(); } catch {} }
// clay and ore turn up in new places each morning, and a patch you have dug is gone until tomorrow
const NODE_SPOTS = { clay:[[0,-7.5,1.1],[0,3.0,-7.45],[0,-5.2,-6.2],[0,7.7,-.6],[0,4.3,-6.9],[0,-7.8,1.9],[1,5.5,-4.8],[1,6,1.8],[1,-6.4,1.5],[1,-1.5,6.6],[1,1.5,-6.8],[1,6.6,-1.6]], copper:[[1,-5.5,-3],[1,-2,-6.2],[1,4.2,-5.4],[1,-6.8,-.6],[1,.8,-7],[1,3.4,6.4]], tin:[[2,5,-4.5],[2,-5.2,-3.6],[2,-3.5,5.2],[2,5.6,2.4]], sand:[[1,-6.6,2.6],[1,2.4,6.2],[1,-3.8,5.6],[1,6.8,-.2],[1,-1,6.8],[1,5.8,3.6],[1,-6.2,-1.4]] };
function placeNodes() { const base = [new THREE.Vector3(), ORCH_POS, WIND_POS], on = n => (n.userData.kind === 'claypit' ? potteryOn() : n.userData.kind === 'sandpit' ? !!S.stations.furnace : bronzeOn()) && !usedToday(n);
  nodes.forEach(n => n.visible = false); const taken = [];
  nodes.forEach((n, i) => { if (!on(n)) return; const ore = n.userData.ore, isl = ore === 'clay' ? (i < 2 ? 0 : 1) : ore === 'copper' || ore === 'sand' ? 1 : 2, pool = NODE_SPOTS[ore].filter(sp => sp[0] === isl);
    let spot = null; for (let t = 0; t < pool.length; t++) { const sp = pool[(S.day * 5 + i * 3 + t) % pool.length], x = base[isl].x + sp[1], z = base[isl].z + sp[2]; if (taken.some(q => Math.hypot(q[0] - x, q[1] - z) < 1.5) || nearThing(x, z) || groundAt(x, base[isl].y, z) === null) continue; spot = [x, z]; break; }
    if (spot) { n.position.set(spot[0], base[isl].y, spot[1]); taken.push(spot); } else taken.push([n.position.x, n.position.z]); n.visible = true; }); }
function chopTree(t) {
  if (!S.tools.axe) { toast('You need a stone axe to chop trees. Make 1 at the tree stump workbench.'); return; }
  const key = t.userData.key; if (S.chopped[key] === S.day) { toast('This tree needs to rest. Come back tomorrow.'); return; }
  if (!canCarry('log')) return bagFull();
  S.chopped[key] = S.day; t.userData.shake = 1; sfx('chop');
  if (S.chopDay !== S.day) { S.chopDay = S.day; S.chopN = 0; } if (++S.chopN === 7) karma('harmony', -1); const wp = new THREE.Vector3(); t.getWorldPosition(wp);
  const nl = S.tools.bronzeAxe ? 4 : 3; gain('log', nl, wp.setY(wp.y + 1), true); hintToast(); goal('chop'); drawUsed();
}
function mineRock(r) {
  if (!S.tools.pick) { toast('You need a stone pickaxe to break rocks. Make 1 at the tree stump workbench.'); return; }
  const key = r.userData.key; if (S.chopped[key] === S.day) { toast('You got all the stone from this rock today. Try again tomorrow.'); return; }
  if (!canCarry('stone')) return bagFull();
  S.chopped[key] = S.day; sfx('stone'); const ns = S.tools.bronzePick ? 5 : 3; gain('stone', ns, r.position.clone(), true); hintToast(); goal('mine'); drawUsed();
}
function cutBush(b) {
  const key = b.userData.key; if (S.chopped[key] === S.day) { toast('You already cut grass here today.'); return; }
  if (!canCarry('fiber')) return bagFull();
  bushGame(b); }
// cutting grass: long grass grows up around the bush. Swipe across it to cut it, then gather it up
let bush3 = null;
function bushGame(b) { if (bush3 || cine) return; target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), bp = b.getWorldPosition(V(0, 0, 0)), gy = groundAt(bp.x, bp.y + .5, bp.z) ?? 0, toCam = clearSide(V(bp.x, gy, bp.z), 3.2, 2.2, b, 1.4, [.2, .9]), side = V(toCam.z, 0, -toCam.x);
  player.position.set(bp.x, gy, bp.z).addScaledVector(toCam, 4.2).addScaledVector(side, .6); /* just behind the camera, out of the picture */ player.rotation.y = Math.atan2(bp.x - player.position.x, bp.z - player.position.z); cine = { hold:true }; document.body.classList.add('in-cine');
  const green = [mat(0x6fae5a), mat(0x86c06a), mat(0x5a9a4a)], tufts = [];
  const spots = []; for (let n = 0; n < 40 && spots.length < 7; n++) { const a = ((n % 9) - 4) * .3 + (n >= 9 ? .15 : 0), r = .95 + Math.floor(n / 9) * .2 + (n % 2) * .15, p = V(bp.x, gy, bp.z).addScaledVector(toCam, Math.cos(a) * r).addScaledVector(side, Math.sin(a) * r * 1.6);
    if (solidPt(p.x, p.z) || groundAt(p.x, gy + .5, p.z) === null || spots.some(q => q.distanceTo(p) < .4)) continue; const gp = groundAt(p.x, gy + .5, p.z); if (Math.abs(gp - gy) > .3) continue; spots.push(p); } /* only where nothing else stands */
  for (let i = 0; i < spots.length; i++) { const p = spots[i], g = new THREE.Group(); g.position.copy(p);
    const blades = []; for (let k = 0; k < 9; k++) { const bl = mesh(new THREE.ConeGeometry(.045, .8 - (k % 4) * .08, 4).translate(0, .4 - (k % 4) * .04, 0), green[k % 3], (k % 3 - 1) * .07, 0, (Math.floor(k / 3) - 1) * .07); bl.rotation.z = -(k % 3 - 1) * .25; bl.rotation.x = (Math.floor(k / 3) - 1) * .22; /* leans out from the base, like real grass */ g.add(bl); blades.push(bl); }
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .7, 8), new THREE.MeshBasicMaterial({ visible:false })); hit.position.y = .35; g.add(hit); const stubs = new THREE.Group(); for (let k = 0; k < 9; k++) stubs.add(mesh(new THREE.CylinderGeometry(.016, .02, .07, 5), green[k % 3], (k % 3 - 1) * .07, .035, (Math.floor(k / 3) - 1) * .07)); stubs.visible = false; g.add(stubs);
    scene.add(g); tufts.push({ g, blades, hit, stubs, cut:false, t:0 }); }
  const N = tufts.length;
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="bsMsg">Long grass has grown up around the bush.<br>Swipe your finger across it to cut it.</p><div class="fhbtns"><button id="bsDone" class="ghost">Done</button></div>`; document.body.appendChild(hud);
  const msg = h => { const e = $('bsMsg'); if (e) e.innerHTML = h; };
  let cutN = 0, down = false, finished = false, last = performance.now(), raf;
  const cv = renderer.domElement, hits = tufts.map(q => q.hit);
  const slice = e => { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera); ray.intersectObjects(hits, false).forEach(h => { const q = tufts.find(q => q.hit === h.object); if (q && !q.cut) { q.cut = true; cutN++; sfx('swish'); tone(700 + cutN * 40, { dur:.05, vol:.03 }); burst(q.g.position.clone().setY(gy + .35), 0x86c06a, 14); msg(`Cut: <b>${cutN}</b> of ${N}`); if (cutN === N) done(); } }); };
  const mv = e => { if (down) slice(e); }, up = () => { down = false; };
  const press = e => { down = true; slice(e); };
  cv.addEventListener('pointermove', mv); addEventListener('pointerup', up);
  const done = () => { finished = true; S.chopped[b.userData.key] = S.day; gain('fiber', 2, bp.clone().setY(gy + .6), true); drawUsed(); save(); [523, 659, 784].forEach((f, i) => setTimeout(() => chime(f), i * 110));
    msg(`<b>All cut. +2 grass.</b><br>Real life: rice, wheat and corn are all grasses.<br>Rice alone gives people about 1 of every 5 calories they eat.`); $('bsDone').textContent = 'Close'; $('bsDone').className = ''; };
  const end = () => { cancelAnimationFrame(raf); cv.removeEventListener('pointermove', mv); removeEventListener('pointerup', up); hud.remove(); tufts.forEach(q => scene.remove(q.g)); bush3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); if (finished) hintToast(); };
  $('bsDone').onclick = end;
  const step = dt => { tufts.forEach((q, i) => { if (q.cut) { q.t = Math.min(1, q.t + dt * 2.5); q.stubs.visible = true; q.blades.forEach(bl => { bl.visible = false; }); } /* the cut blades fly off in the green burst, leaving short flat stubs */ else q.blades.forEach((bl, k) => { bl.rotation.x = (Math.floor(k / 3) - 1) * .22 + Math.sin(performance.now() / 600 + i + k) * .08; }); });
    camera.position.lerp(V(bp.x, gy, bp.z).addScaledVector(toCam, 3.2).setY(gy + 2.2), 1 - Math.pow(.02, dt)); camera.lookAt(bp.x, gy + .3, bp.z); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); if (bush3) raf = requestAnimationFrame(loop); };
  bush3 = { press, end, step, get state() { return { cutN, finished }; }, tuftPoint:i => tufts[i].g.position.clone().setY(gy + .35) }; loop(); }
const CRAFTS = [
  { id:'axe',   name:'Stone Axe',     needs:{ stick:3, stone:2, fiber:2 }, does:'Chop trees for logs.' },
  { id:'pick',  name:'Stone Pickaxe', needs:{ stick:2, stone:3, fiber:1 }, does:'Break rocks for stone and dig ore.' },
  { id:'kiln',  name:'Kiln',          needs:{ stone:12, clay:6 }, does:'A clay oven for firing pots and bricks. Starts the Pottery Age.', station:true, after:'pick' },
  { id:'furnace', name:'Furnace',     needs:{ brick:8, stone:6 }, does:'A very hot oven for melting metal. Starts the Bronze Age.', station:true, after:'kiln' },
  { id:'net', name:'Bug Net', needs:{ fiber:5, stick:3 }, does:'Swing it at insects and butterflies to catch them. People have made nets from plant fibers for over 10,000 years.', after:'axe' },
  { id:'bag1', name:'Woven Grass Bag', needs:{ fiber:10, stick:4 }, does:'A bigger backpack: 18 slots instead of 12. People have woven bags from grass and reeds for thousands of years.', after:'axe' },
  { id:'bag2', name:'Clay-Bead Satchel', needs:{ fiber:8, pot:1, clay:4 }, does:'A bigger backpack: 24 slots. Fired clay beads make strong fastenings.', after:'kiln' },
  { id:'bag3', name:'Bronze-Buckle Pack', needs:{ bronze:2, fiber:8 }, does:'The biggest backpack: 36 slots. Metal buckles hold a heavy load closed.', after:'furnace' },
  { id:'bronzeAxe',  name:'Bronze Axe',     needs:{ bronze:2, stick:1 }, does:'Chop 4 logs per tree instead of 3.', after:'furnace' },
  { id:'bronzePick', name:'Bronze Pickaxe', needs:{ bronze:2, stick:1 }, does:'Break 5 stone per rock instead of 3.', after:'furnace' },
];
const potteryOn = () => featureOn('pottery') || !!S.stations.kiln, bronzeOn = () => featureOn('bronze') || !!S.stations.furnace;
const hasCraft = id => id === 'kiln' || id === 'furnace' ? !!S.stations[id] : !!S.tools[id];
const AGES = [
  { id:'stone', name:'Stone Age', done:() => S.tools.axe && S.tools.pick },
  { id:'pottery', name:'Pottery Age', done:() => !!S.stations.kiln, get soon() { return !potteryOn(); } },
  { id:'bronze', name:'Bronze Age', done:() => !!S.stations.furnace, get soon() { return !bronzeOn(); } },
  { id:'glass', name:'Glass Age', done:() => !!S.stations.glass, get soon() { return !S.stations.furnace; } },
  { id:'iron', name:'Iron Age', soon:true },
];
function agesHtml() {
  return `<div class="ages">${AGES.map(a => `<span class="${a.soon ? 'soon' : a.done() ? 'done' : ''}">${a.soon ? '' : a.done() ? '✓ ' : ''}${a.name}${a.soon ? ' (coming soon)' : ''}</span>`).join('<i>›</i>')}</div>`;
}
function drawStations() { kiln.visible = !!S.stations.kiln; furnace.visible = !!S.stations.furnace; drawUsed(); }
function useWorkbench() {
  const shown = CRAFTS.filter(c => (LIMITS_ON || !/^bag\d$/.test(c.id)) && (!c.after || hasCraft(c.after)) && (c.id !== 'kiln' || potteryOn()) && (!['furnace','bronzeAxe','bronzePick','bag3'].includes(c.id) || bronzeOn()) && (c.id !== 'bag1' || featureOn('bagup')) && (c.id !== 'net' || featureOn('butterflies')) && (c.id !== 'bag2' || (potteryOn() && S.tools.bag1)) && (c.id !== 'bag3' || S.tools.bag2));
  showCard(`<div class="kicker">TREE STUMP WORKBENCH</div><h2>Make things</h2>
    <p style="margin-top:8px">Make tools and workshops from what you gather.${S.tools.pick && !S.stations.kiln && potteryOn() ? ' Scoop clay from the reddish patches at the edge of your island.' : ''}${S.stations.kiln && !S.stations.furnace ? ' Fire clay into bricks at your kiln.' : ''}</p>
    <div class="jlist">${[...shown].sort((a, b) => (hasCraft(a.id) - hasCraft(b.id)) || (enough(b.needs) - enough(a.needs))).map(c => { const own = hasCraft(c.id), ok = enough(c.needs);
      return `<button data-cr="${c.id}" class="craft ${own ? 'own' : ok ? 'ready' : ''}"><span class="ct">${c.name}${own ? ' <small>You have it</small>' : ok ? ' <small class="go">Ready to make</small>' : ''}</span>
        <span class="sub">${c.does}</span>${own ? '' : `<span class="needs">${Object.entries(c.needs).map(([k,n]) => `<em class="${have(k) >= n ? 'ok' : 'no'}">${icon(k)} ${Math.min(have(k), n)}/${n}</em>`).join('')}</span>`}</button>`; }).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-cr]').forEach(b => b.onclick = () => {
    const c = CRAFTS.find(x => x.id === b.dataset.cr);
    if (hasCraft(c.id)) { toast(`You already have a ${c.name.toLowerCase()}.`); return; }
    if (!enough(c.needs)) { toast(`Not enough yet: ${needText(c.needs)}.`); return; }
    makeCraft(c); });
}
// making a thing at the workbench is something you do with your hands: knap and lash a stone tool, weave, stack a wall, or pour bronze. What it costs comes out of your bag only when it is finished
function craftDone(c) {
    if (hasCraft(c.id) || !enough(c.needs)) return hideCard();
    Object.entries(c.needs).forEach(([k,n]) => bagAdd(k, -n));
    if (c.station) S.stations[c.id] = true; else S.tools[c.id] = true; lean('maker', 2);
    save(); drawHud(); drawStations(); sfx('pick'); burst((c.station ? (c.id === 'kiln' ? kiln : furnace) : workbench).position.clone(), 0xc98f58, 20);
    if (c.id === 'axe' && !S.aha.includes('tools')) return showAha('tools', () => toast('Now tap a tree to chop logs.'));
    hideCard();
    if (c.station) { [523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*150)); toast(c.id === 'kiln' ? 'You built a kiln! The Pottery Age begins. Tap it to fire clay.' : 'You built a furnace! The Bronze Age begins. Tap it to melt metal.'); }
    else toast(`You made a ${c.name}!${c.id === 'pick' ? ' Now tap a rock to break it for stone.' : ''}`);
}
function makeCraft(c) { const id = c.id, K = 'TREE STUMP WORKBENCH', T = `Make a ${c.name}`, take = `<button id="mkTake" style="display:none;margin-top:10px">Take your ${c.name}</button>`;
  const finish = t => { t.reveal(); const b = t.el('mkTake'); if (b) { b.style.display = ''; b.onclick = () => craftDone(c); } [523, 659, 784].forEach((f, i) => setTimeout(() => chime(f), i * 120)); };
  if (id === 'axe' || id === 'pick') { const SP = [[96, 46], [110, 34], [128, 28], [146, 30], [162, 40]]; let chips = 0, wraps = 0;
    return tryIt(K, T, 'Strike the glowing spots on the edge to chip flakes off.',
      `<svg id="mkS" viewBox="60 8 160 128" ${SVGW}><path id="mkStone" d="M80 70 L96 46 L110 34 L128 28 L146 30 L162 40 L176 66 L160 100 L110 106 Z" fill="#9a9488" stroke="#6f695f" stroke-width="3"/>${SP.map(([x, y], i) => `<g data-k="${i}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="13" fill="transparent"/><circle class="mkG" cx="${x}" cy="${y}" r="6" fill="#ffd23f" opacity=".85"/></g>`).join('')}<g id="mkHaft" style="display:none"><rect x="158" y="14" width="13" height="120" rx="5" fill="#9b6b4a"/><g id="mkBands"></g></g></svg><div class="chips" style="justify-content:center"><button id="mkWrap" style="display:none">Wrap the cord</button></div>${take}`,
      ['Chipping flakes off a stone to make a sharp edge is called knapping.', 'People were doing it more than 3 million years ago.', 'Tying the stone to a handle came much later. A handle lets you swing far harder.'],
      t => { document.querySelectorAll('#mkS [data-k]').forEach(g => g.onclick = () => { if (g.dataset.done) return; g.dataset.done = 1; g.querySelector('.mkG').setAttribute('fill', '#cfc7bb'); chips++; tone(300 + chips * 60, { dur:.06, vol:.06, type:'square' });
          const [x, y] = SP[+g.dataset.k]; t.el('mkS').insertAdjacentHTML('beforeend', `<path d="M${x - 6} ${y} l6 -9 l7 7Z" fill="#b3aca0"><animateTransform attributeName="transform" type="translate" from="0 0" to="${(x - 128) * .8} -40" dur=".5s" fill="freeze"/><animate attributeName="opacity" from="1" to="0" dur=".5s" fill="freeze"/></path>`);
          t.tip(chips < 5 ? `<b>Chip.</b> ${chips} of 5. The edge is getting sharper.` : '<b>A sharp edge.</b> Now tie it to the handle.'); if (chips === 5) { t.el('mkStone').setAttribute('d', 'M80 70 L104 38 L128 26 L152 32 L176 66 L160 100 L110 106 Z'); t.el('mkHaft').style.display = ''; t.el('mkWrap').style.display = ''; } });
        t.el('mkS').addEventListener('click', e => { if (chips < 5 && !e.target.closest('[data-k]')) t.tip('Strike the glowing spots on the edge, not the middle.'); });
        t.el('mkWrap').onclick = () => { if (wraps >= 4) return; wraps++; sfx('swish'); t.el('mkBands').insertAdjacentHTML('beforeend', `<rect x="150" y="${42 + wraps * 9}" width="29" height="5" rx="2" fill="#c9b36a"/>`); t.tip(wraps < 4 ? `Wrap ${wraps} of 4.` : `<b>Tight and strong.</b> Your ${c.name} is ready.`); if (wraps === 4) { t.el('mkWrap').style.display = 'none'; finish(t); } }; }); }
  if (['net', 'bag1', 'bag2', 'bag3'].includes(id)) { let n = 0; const N = 12;
    const draw = t => { t.el('mkW').innerHTML = [...Array(n)].map((_, i) => { const row = Math.floor(i / 6), col = i % 6, over = (col + row) % 2 === 0; return `<rect x="${58 + col * 32}" y="${44 + row * 30}" width="34" height="12" rx="4" fill="#d9c49a" opacity="${over ? 1 : .35}"/>`; }).join(''); };
    return tryIt(K, T, 'Weave the grass across: over 1 thread, under the next.',
      `<svg viewBox="0 0 300 120" ${SVGW}>${[...Array(6)].map((_, i) => `<rect x="${70 + i * 32}" y="20" width="10" height="90" rx="4" fill="#7fae5a"/>`).join('')}<g id="mkW"></g></svg><div class="chips" style="justify-content:center"><button data-w="o">Over</button><button data-w="u">Under</button></div>${take}`,
      ['Over, under, over, under: that is weaving.', 'Each thread holds the others in place, so the whole thing holds together with no glue.', 'Start each new row the opposite way, and the weave locks tight.'],
      t => t.on('[data-w]', b => { if (n >= N) return; const row = Math.floor(n / 6), want = (n % 6 + row) % 2 === 0 ? 'o' : 'u'; if (b.dataset.w !== want) { sfx('click'); return t.tip(`Not this one. It goes <b>${want === 'o' ? 'over' : 'under'}</b>.${n % 6 === 0 && row ? ' A new row starts the opposite way.' : ''}`); }
        n++; sfx('swish'); draw(t); t.tip(n < N ? `${n} of ${N}.${n === 6 ? ' Row 2 starts the opposite way.' : ''}` : '<b>Woven tight.</b>'); if (n === N) finish(t); })); }
  if (id === 'kiln' || id === 'furnace') { let rows = [0], cracked = false; const mat2 = id === 'kiln' ? '#b3aca0' : '#c46a4a';
    const draw = t => { t.el('mkWall').innerHTML = rows.map((off, r) => [...Array(5)].map((_, i) => `<rect x="${58 + i * 40 - (off ? 20 : 0)}" y="${96 - r * 22}" width="38" height="20" rx="2" fill="${mat2}" stroke="#6f695f"/>`).join('')).join('') + (cracked ? '<path d="M138 116 V30" stroke="#3b2f4a" stroke-width="3" stroke-dasharray="4 3"/>' : ''); };
    return tryIt(K, T, 'Build the wall, row by row. For each new row, choose where the bricks go.',
      `<svg viewBox="0 0 300 130" ${SVGW}><rect x="40" y="116" width="220" height="8" fill="#8a6a48"/><g id="mkWall"></g></svg><div class="chips" style="justify-content:center"><button data-r="0">Line up with the row below</button><button data-r="1">Shift by 1/2 a brick</button></div>${take}`,
      ['Builders shift each row by 1/2 a brick.', 'Then no crack can run straight up the wall, and the weight spreads out across the bricks below.'],
      t => { draw(t); t.on('[data-r]', b => { if (rows.length >= 4) return; rows.push(+b.dataset.r ? 1 - rows[rows.length - 1] : rows[rows.length - 1]); sfx('stone'); cracked = false; draw(t);
        if (rows.length < 4) return t.tip(`Row ${rows.length} of 4.`); const straight = rows.some((o, i) => i && o === rows[i - 1]);
        if (straight) { cracked = true; draw(t); sfx('click'); t.tip('<b>Crack!</b> The joints line up, so a crack ran straight up. Try again.'); setTimeout(() => { rows = [0]; cracked = false; if (t.el('mkWall')) draw(t); }, 1600); }
        else { t.tip(`<b>It holds.</b> Your ${c.name.toLowerCase()} walls are strong.`); finish(t); } }); }); }
  let lv = 0, pour = false, done = false; // bronze tools: pour the hot bronze into the mold, right up to the line
  return tryIt(K, T, 'Hold Pour to fill the mold with hot bronze. Stop at the line.',
    `<svg viewBox="0 0 300 130" ${SVGW}><rect x="70" y="40" width="160" height="70" rx="8" fill="#8d8f96"/><path id="mkHole" d="M100 60 h90 l14 14 l-14 14 h-90Z" fill="#3b3a40"/><clipPath id="mkClip"><path d="M100 60 h90 l14 14 l-14 14 h-90Z"/></clipPath><rect id="mkLv" x="100" y="88" width="104" height="0" fill="#f0a23c" clip-path="url(#mkClip)"/><path d="M96 62 h112" stroke="#ffd23f" stroke-width="2" stroke-dasharray="5 3"/><text x="212" y="58" font-size="10" font-weight="800" fill="#3b2f4a">line</text></svg><div class="chips" style="justify-content:center"><button id="mkPour">Pour</button></div>${take}`,
    ['Pouring hot liquid metal into a shaped hole is called casting. People have done it for about 7,000 years.', 'Almost every metal shrinks a little as it cools.', 'So the mold is made 0.6% to 2.5% bigger than the finished tool.'],
    t => { const b = t.el('mkPour'); b.onpointerdown = e => { e.preventDefault(); if (!done) pour = true; }; ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { if (!pour) return; pour = false;
        if (lv < .9) t.tip(`<b>Not full yet.</b> The tool would have a hole in it. Keep pouring.`); else if (lv <= 1.04) { done = true; b.style.display = 'none'; t.tip('<b>Full to the line.</b> It cools and hardens.'); finish(t); } else { t.tip('<b>Too much. It spilled over.</b> You scrape it off and try again.'); lv = 0; } }));
      t.loop(dt => { if (pour) { lv += dt * .45; if (lv > 1.15) { pour = false; t.tip('<b>Too much. It spilled over.</b> You scrape it off and try again.'); lv = 0; } } t.el('mkLv').setAttribute('y', (88 - Math.min(lv, 1.1) * 28).toFixed(1)); t.el('mkLv').setAttribute('height', (Math.min(lv, 1.1) * 28).toFixed(1)); }); }); }
function gatherNode(n) {
  const { kind, ore, key } = n.userData;
  if (kind === 'ore' && !S.tools.pick) { toast('You need a stone pickaxe to dig ore. Make 1 at the tree stump workbench.'); return; }
  if (S.chopped[key] === S.day) { toast('Nothing left here today. It fills back in by tomorrow.'); return; }
  if (!canCarry(ore)) return bagFull();
  S.chopped[key] = S.day; const soft = kind === 'claypit' || kind === 'sandpit', amt = soft ? 2 : 1;
  sfx(kind === 'claypit' ? 'squelch' : kind === 'sandpit' ? 'swish' : 'ting'); for (let i=0;i<amt;i++) bagAdd(ore); burst(n.position.clone(), kind === 'claypit' ? 0xb8653f : kind === 'sandpit' ? 0xead9a6 : ore === 'copper' ? 0x3fbf8f : 0xc9c9d9, 12); floatText(`+${amt} ${icon(ore)} ${plural(ore, amt)}`, n.position.clone()); swingT = .5; save(); drawHud(); drawUsed();
  toast(`${kind === 'claypit' ? 'Clay is soft, wet earth that can be shaped and fired.' : kind === 'sandpit' ? 'Sand is mostly tiny grains of quartz. Melt it hot enough and it turns into glass.' : ore === 'copper' ? 'Copper ore has those green streaks. Smelt it in a furnace.' : 'Tin is rare. People once traded it across whole continents.'}`);
}
// the kiln: keep the fire just right
function useKiln() {
  showCard(`<div class="kicker">THE KILN</div><h2>Fire clay</h2><p>Pick what to make, then tend the fire. Too cool and nothing happens. Too hot and it cracks!</p>
    <div class="jlist"><button data-fire="brick" class="craft">Bricks x2 ${needChips({ clay:3, log:1 })}</button><button data-fire="pot" class="craft">Clay pot ${needChips({ clay:2, log:1 })}</button></div>`, 'Close');
  document.querySelectorAll('[data-fire]').forEach(b => b.onclick = () => { const what = b.dataset.fire, needs = what === 'brick' ? { clay:3, log:1 } : { clay:2, log:1 };
    if (!enough(needs)) { toast(`Not enough yet: ${needText(needs)}.`); return; } Object.entries(needs).forEach(([k,n]) => bagAdd(k, -n)); save(); kilnGame(what); });
}
// the kiln: stand at its mouth and tend the fire. The glow tells you how hot it is, the way smiths judged heat before thermometers
const HEAT_COLORS = [[300, 'No glow yet', 0x3a2420], [430, 'Black red', 0x5a1a12], [705, 'Dark red', 0x8f1d10], [815, 'Cherry red', 0xc8261a], [870, 'Bright cherry red', 0xe0441c], [982, 'Orange', 0xff8a1c], [1093, 'Yellow', 0xffd23f]];
let kiln3 = null;
function kilnGame(what) { if (kiln3 || cine) return; hideCard(); target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), kp = kiln.position.clone(), front = V(0, 0, 1), mouth = kp.clone().add(V(0, .12, .8)), oldCol = kilnMouth.material.color.getHex();
  player.position.copy(kp).add(V(.9, 0, 1.1)); player.rotation.y = Math.atan2(-.9, -.6); cine = { hold:true }; document.body.classList.add('in-cine');
  const fl = []; for (let i = 0; i < 4; i++) { const f = mesh(new THREE.ConeGeometry(.07, .26, 6), glow(0xffa94d), (i - 1.5) * .09, .1, .7); kiln.add(f); fl.push(f); } const halo2 = halo(0xff8a3c, 1.6, 0); halo2.position.set(0, .15, .85); kiln.add(halo2);
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="knMsg">Add wood to heat the kiln.<br>Watch the glow in its mouth. Keep it <b>dark red to cherry red</b> until the bar fills.</p><p id="knCol" style="font-weight:800;margin:0 0 6px">No glow yet, about 300°C</p><div class="fhmeter"><b id="knBar" style="width:0%;background:#ffc857"></b></div><div class="fhbtns"><button id="knAdd">Add wood</button><button id="knStop" class="ghost">Stop</button></div>`; document.body.appendChild(hud);
  const msg = t => { const e = $('knMsg'); if (e) e.innerHTML = t; };
  let temp = 300, done = 0, t = 0, last = performance.now(), raf, over = false;
  const cleanup = () => { cancelAnimationFrame(raf); hud.remove(); fl.forEach(f => kiln.remove(f)); kiln.remove(halo2); kilnMouth.material.color.setHex(oldCol); kiln3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); };
  const end = ok => { over = true; $('knAdd').style.display = 'none'; $('knStop').textContent = 'Close';
    if (ok) { if (what === 'brick') { bagAdd('brick'); bagAdd('brick'); } else bagAdd('pot'); save(); drawHud(); [523, 659, 784].forEach((f, i) => setTimeout(() => chime(f), i * 120)); burst(mouth.clone(), 0xffa94d, 18);
      msg(`<b>Done! You made ${what === 'brick' ? '2 bricks' : 'a clay pot'}.</b><br>Long before thermometers, smiths judged heat by the color of the glow.<br>Much old pottery was fired at about 800°C, a dark red glow.`); if (!S.aha.includes('pottery')) $('knStop').onclick = () => { cleanup(); setTimeout(() => showAha('pottery'), 200); }; }
    else { tone(200, { to:90, dur:.4, vol:.06 }); const back = what === 'brick' ? 2 : 1; bagAdd('clay', back); save(); drawHud(); burst(mouth.clone(), 0x9a8f86, 14);
      msg(`<b>Crack!</b> It went past orange and got too hot.<br>You saved ${back} clay from the pieces. Use a little less wood next time.`); } };
  $('knAdd').onclick = () => { if (over) return; temp = Math.min(1250, temp + 85); sfx('till'); };
  $('knStop').onclick = () => { if (!over) { Object.entries(what === 'brick' ? { clay:3, log:1 } : { clay:2, log:1 }).forEach(([k, n]) => bagAdd(k, n)); save(); drawHud(); toast('You stopped the fire. Your clay and wood are back in your bag.'); } cleanup(); };
  const step = dt => { t += dt; if (!over) { temp = Math.max(300, temp - dt * 55); const inZone = temp >= 760 && temp <= 900; if (inZone) done += dt / 6; if (temp >= 1150) end(false); else if (done >= 1) end(true);
      let c = HEAT_COLORS[0]; HEAT_COLORS.forEach(h => { if (temp >= h[0]) c = h; }); $('knCol').innerHTML = `${c[1]}, about ${Math.round(temp / 10) * 10}°C${inZone ? ' <span style="color:#3f8f3a">Just right</span>' : temp > 900 ? ' <span style="color:#c8261a">Too hot!</span>' : ''}`; $('knBar').style.width = Math.min(100, done * 100).toFixed(0) + '%';
      kilnMouth.material.color.setHex(c[2]); halo2.material.color.setHex(c[2]); halo2.material.opacity = Math.min(.8, Math.max(0, (temp - 400) / 900)); }
    const k = Math.max(0, (temp - 350) / 800); fl.forEach((f, i) => { f.scale.set(1, .3 + k * 1.6 + Math.sin(t * 11 + i * 2) * .15, 1); f.visible = k > .05; f.material.color.setHex(temp > 980 ? 0xffd23f : 0xffa94d); });
    camera.position.lerp(kp.clone().add(V(-.6, 1.5, 2.6)), 1 - Math.pow(.02, dt)); camera.lookAt(mouth.x, mouth.y + .1, mouth.z); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); if (kiln3) raf = requestAnimationFrame(loop); };
  kiln3 = { step, get state() { return { temp, done, over }; } }; loop(); }
// the furnace: find the bronze recipe yourself
// the furnace: pump the bellows until copper melts, mix in tin (the first time, find the right amount), then pour an ingot. Nothing leaves your bag until the ingot is poured
let furn3 = null;
// the furnace makes 2 things: bronze, and (once you have sand) glass
function useFurnace() { if (furn3 || cine) return;
  showCard(`<div class="kicker">THE FURNACE</div><h2>What will you make?</h2><div class="jlist"><button data-fu="bronze" class="craft">Bronze ingot ${needChips({ copper:2, tin:1, log:2 })}</button><button data-fu="glass" class="craft">Glass ${needChips({ sand:3, log:1 })}</button></div>${S.stations.glass ? '' : '<p class="sub">Sand comes from the pale patches on Orchard Isle.</p>'}`, 'Close');
  document.querySelectorAll('[data-fu]').forEach(b => b.onclick = () => b.dataset.fu === 'bronze' ? bronzeFurnace() : glassGame()); }
// glassblowing: fill a glowing gob of glass with your breath, and keep turning so it does not droop
function glassGame() { const needs = { sand:3, log:1 };
  if (!enough(needs)) return toast(`To make glass you need ${needText(needs)}. Scoop sand from the pale patches on Orchard Isle.`);
  if (!canCarry('glass')) return bagFull();
  Object.entries(needs).forEach(([k, n]) => bagAdd(k, -n)); save(); drawHud();
  let r = 9, sag = 0, blow = false, won = false;
  tryIt('THE FURNACE', '🫧 Blow glass', 'Hold <b>Blow</b> to fill the hot glass with air. Tap <b>Turn</b> often, or it droops. Then tap <b>Finish</b> inside the dotted rings.',
    `<svg viewBox="0 0 300 150" ${SVGW}><rect width="300" height="150" rx="10" fill="#2a2030"/><rect x="0" y="71" width="152" height="8" rx="3" fill="#8d97a1"/><circle cx="186" cy="75" r="33" fill="none" stroke="#fff6e6" stroke-width="1.5" stroke-dasharray="4 4" opacity=".75"/><circle cx="186" cy="75" r="39" fill="none" stroke="#fff6e6" stroke-width="1.5" stroke-dasharray="4 4" opacity=".75"/><ellipse id="gbG" cx="159" cy="75" rx="9" ry="9" fill="#ffb347"/><ellipse id="gbH" cx="155" cy="70" rx="3" ry="2" fill="#fff3c4" opacity=".7"/></svg>
     <div class="chips" style="justify-content:center"><button id="gbB">Blow</button><button id="gbT" class="ghost">Turn</button><button id="gbD" class="ghost">Finish</button></div>`,
    ['Glass is mostly sand.', 'Pure sand melts at about 1,700°C, hotter than old furnaces could reach.', 'Roman glassmakers mixed in soda from a natural salt called natron, so it melts far cooler.', 'Blowing glass through a pipe was invented in the 1st century BC, in what is now Syria and Lebanon.', 'Within about 100 years, a glass cup in Rome cost 1 copper coin.'],
    t => { const b = t.el('gbB'); b.onpointerdown = e => { e.preventDefault(); if (!won) blow = true; }; ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { blow = false; }));
      t.el('gbT').onclick = () => { if (won) return; sag = Math.max(0, sag - 14); tone(330, { dur:.05, vol:.03 }); };
      t.el('gbD').onclick = () => { if (won) return; if (r < 33) return t.tip('Too small. Blow a little more, out to the dotted rings.'); if (r > 39) return t.tip('Too big. Next time, stop sooner.'); if (sag > 10) return t.tip('It is drooping. Turn it, then finish.');
        won = true; blow = false; bagAdd('glass', 1); const first = !S.stations.glass; S.stations.glass = true; S.glassMade = (S.glassMade || 0) + 1; save(); drawHud(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 110));
        t.el('gbG').setAttribute('fill', '#cfeaff'); t.tip(`<b>A glass bubble.</b> It cools from orange to clear. +1 glass.${first ? '<br><b>The Glass Age begins.</b> Build glass lanterns and window walls.' : ''}`); t.reveal(); };
      t.loop(dt => { if (won) return; if (blow) r += 13 * dt; sag += dt * (5 + r / 7);
        if (r > 44) { r = 9; sag = 0; blow = false; sfx('click'); t.tip('<b>Pop!</b> Too much air. You gather a fresh gob from the furnace.'); }
        if (sag > 28) { r = 9; sag = 0; blow = false; sfx('click'); t.tip('<b>It drooped</b> and fell off the pipe. You gather a fresh gob. Keep turning.'); }
        const g = t.el('gbG'); if (!g) return; g.setAttribute('cx', (150 + r).toFixed(1)); g.setAttribute('cy', (75 + sag * .6).toFixed(1)); g.setAttribute('rx', r.toFixed(1)); g.setAttribute('ry', (r * (1 + sag / 50)).toFixed(1));
        const h = t.el('gbH'); h.setAttribute('cx', (150 + r * .7).toFixed(1)); h.setAttribute('cy', (75 + sag * .6 - r * .5).toFixed(1)); }); }); }
function bronzeFurnace() { const needs = { copper:2, tin:1, log:2 }; if (furn3 || cine) return;
  if (!enough(needs)) return toast(`To make bronze you need ${needText(needs)}. No tin? Buy it from Pip.`);
  closeDialog(); hideCard(); target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), fp = furnace.position.clone(), mouth = fp.clone().add(V(0, .45, .62)), oldCol = furnaceGlow.material.color.getHex();
  player.position.copy(fp).add(V(-1.05, 0, .85)); player.rotation.y = Math.atan2(1, -.7); cine = { hold:true }; document.body.classList.add('in-cine');
  const bel = new THREE.Group(); bel.position.set(-.38, .22, .82); bel.rotation.y = Math.PI + 1.1; bel.scale.setScalar(1.3); const top = mesh(new THREE.BoxGeometry(.5, .05, .3), mat(0x9b6b4a), 0, .08, 0), bot = mesh(new THREE.BoxGeometry(.5, .05, .3), mat(0x9b6b4a), 0, -.08, 0), skin = mesh(new THREE.BoxGeometry(.42, .14, .26), mat(0x7a5236), 0, 0, 0), noz = mesh(new THREE.CylinderGeometry(.03, .04, .3, 6), mat(0x5d6577), -.38, 0, 0); noz.rotation.z = Math.PI / 2; bel.add(top, bot, skin, noz); furnace.add(bel);
  const puffs = []; for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 5), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, depthWrite:false })); scene.add(p); puffs.push({ p, t:9 }); }
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="fuMsg">Copper melts at <b>1,085°C</b>. A plain fire is not enough.<br>Pump the bellows to push in air, and watch the glow.</p><p id="fuCol" style="font-weight:800;margin:0 0 6px"></p><div class="fhmeter"><b id="fuBar" style="width:0%;background:#d9a441"></b></div><div id="fuBtns" class="fhbtns"><button id="fuPump">Pump the bellows</button><button id="fuStop" class="ghost">Stop</button></div>`; document.body.appendChild(hud);
  const msg = t => { const e = $('fuMsg'); if (e) e.innerHTML = t; }, btns = h => { const e = $('fuBtns'); if (e) e.innerHTML = h; };
  let state = 'heat', temp = 400, melt = 0, squeeze = 0, tin = 1, lv = 0, pouring = false, last = performance.now(), raf, tt = 0;
  const cleanup = () => { cancelAnimationFrame(raf); hud.remove(); furnace.remove(bel); puffs.forEach(q => scene.remove(q.p)); furnaceGlow.material.color.setHex(oldCol); furn3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); };
  const wireStop = () => { const b = $('fuStop'); if (b) b.onclick = () => { if (state !== 'done') toast('You let the fire die down. Nothing was used.'); cleanup(); }; };
  const pump = () => { if (state !== 'heat') return; temp = Math.min(1300, temp + 75); squeeze = 1; sfx('swish'); const q = puffs.find(q => q.t > 1) || puffs[0]; q.t = 0; };
  $('fuPump').onclick = pump; wireStop();
  const toMix = () => { state = 'mix'; chime(880); msg('<b>The copper is melting.</b><br>' + (S.bronzeKnown ? 'You stir in 1 part tin for every 9 parts copper, the way you found before.' : 'Bronze is copper with a little tin. Out of 10 parts, how many should be tin? Pick, then test a bit of it.'));
    if (S.bronzeKnown) return toPour(); btns('<button id="fuLess" class="ghost">Less tin</button><button id="fuMore" class="ghost">More tin</button><button id="fuTest">Test it</button><button id="fuStop" class="ghost">Stop</button>'); wireStop(); showMix();
    $('fuLess').onclick = () => { tin = Math.max(0, tin - 1); sfx('click'); showMix(); }; $('fuMore').onclick = () => { tin = Math.min(5, tin + 1); sfx('click'); showMix(); };
    $('fuTest').onclick = () => { if (tin === 1) { S.bronzeKnown = true; save(); tone(1568, { dur:1.2, vol:.05 }); msg('<b>Ring!</b> You tap a cooled drop with a hammer. It is hard and tough.<br>9 parts copper and 1 part tin: that is bronze.'); setTimeout(() => { if (furn3) toPour(); }, 1600); }
      else if (tin === 0) { tone(220, { dur:.2, vol:.05 }); msg('<b>It bends.</b> Pure copper is too soft for a tool. Add a little tin.'); } else if (tin === 2) { tone(500, { dur:.25, vol:.05 }); msg('<b>Strong, but it chips at the edge.</b> A little brittle. Try a bit less tin.'); } else { tone(150, { to:90, dur:.3, vol:.06 }); msg('<b>It shatters like glass.</b> Far too much tin.'); } }; };
  const showMix = () => { $('fuCol').innerHTML = `Copper: <b>${10 - tin}</b> parts. Tin: <b>${tin}</b> ${tin === 1 ? 'part' : 'parts'}.`; };
  const toPour = () => { state = 'pour'; $('fuCol').textContent = ''; $('fuBar').style.width = '0%'; msg('Now pour it into the ingot mold.<br>Hold Pour, and let go at the line.'); btns('<button id="fuPour">Pour</button><button id="fuStop" class="ghost">Stop</button>'); wireStop();
    const b = $('fuPour'); b.onpointerdown = e => { e.preventDefault(); pouring = true; }; ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { if (!pouring) return; pouring = false;
      if (lv < .9) msg('<b>Not full yet.</b> Keep pouring.'); else if (lv <= 1.04) done(); else { msg('<b>It spilled over.</b> You scrape it back in and try again.'); lv = 0; } })); };
  const done = () => { state = 'done'; Object.entries(needs).forEach(([k, n]) => bagAdd(k, -n)); bagAdd('bronze'); save(); drawHud(); sfx('pick'); burst(mouth.clone(), 0xd9a441, 20); [523, 659, 784].forEach((f, i) => setTimeout(() => chime(f), i * 120));
    msg('<b>A bronze ingot!</b><br>Pumping bellows pushes extra air into the fire, so the fuel burns hotter.'); btns('<button id="fuStop">Close</button>'); const first = !S.aha.includes('bronze'); $('fuStop').onclick = () => { cleanup(); if (first) setTimeout(() => showAha('bronze'), 200); else toast('You made a bronze ingot!'); }; };
  const step = dt => { tt += dt;
    if (state === 'heat') { temp = Math.max(400, temp - dt * 70); if (temp >= 1085) melt += dt / 3; else melt = Math.max(0, melt - dt / 6); $('fuBar').style.width = Math.min(100, melt * 100).toFixed(0) + '%';
      let c = HEAT_COLORS[0]; [...HEAT_COLORS, [1315, 'White', 0xfff6e0]].forEach(h => { if (temp >= h[0]) c = h; }); $('fuCol').innerHTML = `${c[1]}, about ${Math.round(temp / 10) * 10}°C${temp >= 1085 ? ' <span style="color:#3f8f3a">Hot enough to melt copper</span>' : ''}`; furnaceGlow.material.color.setHex(c[2]); if (melt >= 1) toMix(); }
    if (state === 'pour') { if (pouring) { lv += dt * .45; if (lv > 1.15) { pouring = false; lv = 0; msg('<b>It spilled over.</b> You scrape it back in and try again.'); } } $('fuBar').style.width = Math.min(100, lv / 1.04 * 100).toFixed(0) + '%'; $('fuBar').style.background = lv > 1.04 ? '#e5484d' : lv >= .9 ? '#8fdc8a' : '#d9a441'; }
    squeeze = Math.max(0, squeeze - dt * 3); top.position.y = .08 - squeeze * .06; skin.scale.y = 1 - squeeze * .6;
    puffs.forEach(q => { q.t += dt; const k = Math.min(1, q.t / .6); noz.getWorldPosition(q.p.position); q.p.position.y += k * .25; q.p.scale.setScalar(.6 + k); q.p.material.opacity = q.t < .6 ? (1 - k) * .6 : 0; });
    camera.position.lerp(fp.clone().add(V(1.3, 1.5, 2.7)), 1 - Math.pow(.02, dt)); camera.lookAt(mouth.x, mouth.y, mouth.z); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); if (furn3) raf = requestAnimationFrame(loop); };
  furn3 = { step, pump, get state() { return { state, temp, melt, tin, lv }; } }; loop(); }
function bronzePuzzle() {
  let tin = 5;
  const draw = () => {
    const strong = [15, 60, 95, 80, 60, 45, 30, 20, 12, 8, 5][tin], brittle = [0, 5, 10, 30, 55, 70, 82, 90, 95, 98, 100][tin];
    showCard(`<div class="kicker">THE FURNACE</div><h2>Find the bronze recipe</h2><p>Bronze is copper mixed with a little tin. Out of 10 parts, how many should be tin? Try different mixes and watch what happens.</p>
      <div class="steppers"><div>Copper<br><b>${10 - tin}</b> parts</div><div>Tin<br><button id="t-">-</button><b>${tin}</b><button id="t+">+</button> parts</div></div>
      <h4>Strength</h4><div class="meter"><div style="width:${strong}%;background:#8fdc8a"></div></div>
      <h4>Brittleness (cracks easily)</h4><div class="meter"><div style="width:${brittle}%;background:#ff8fa3"></div></div>
      <p id="bMsg" style="font-weight:700;min-height:22px;margin-top:8px">${tin === 0 ? 'Pure copper: soft and bendy.' : tin === 1 ? 'Strong and tough. This looks like a great mix!' : tin === 2 ? 'Strong, but starting to get brittle.' : 'Too much tin. It would shatter like glass.'}</p>
      <button id="cast">Pour it</button> <button id="bLater" class="ghost">Later</button>`, null);
    $('t-').onclick = () => { tin = Math.max(0, tin - 1); draw(); }; $('t+').onclick = () => { tin = Math.min(10, tin + 1); draw(); };
    $('bLater').onclick = hideCard;
    $('cast').onclick = () => { if (tin !== 1) { $('bMsg').textContent = tin === 0 ? 'Too soft. Add a little tin.' : 'Too brittle. Try less tin.'; tone(200, { to:120, dur:.3, vol:.05 }); return; }
      S.bronzeKnown = true; save(); [392,523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*130)); burst(furnace.position.clone(), 0xd9a441, 24); showAha('bronze', useFurnace); };
  };
  draw();
}
function wallsPicker() { // step 2 of the hut: three real ways to build a wall
  showCard(`<div class="kicker">YOUR HOME</div><h2>Pick your walls</h2><div class="jlist">${Object.entries(HOME_STYLES).map(([k, w]) => `<button data-wall="${k}" class="craft">${w.name} ${needChips(w.needs)}</button>`).join('')}</div>`, 'Later');
  document.querySelectorAll('[data-wall]').forEach(b => b.onclick = () => { S.homeStyle = b.dataset.wall; save(); drawHome(); drawHud(); useBuildSite(); });
}
function useBuildSite() {
  const st = S.home || 0; if (st >= 3) return useHouse();
  if (st === 1 && !S.homeStyle) return wallsPicker();
  const stage = HOME_STAGES[st], needs = stageNeeds(st), ok = enough(needs);
  const howTo = { log:'Tap a tree with no fruit to chop logs with a stone axe.', stone:'Tap a rock to break off stone with a stone pickaxe.', fiber:'Tap a bush to cut grass fiber.' };
  const how = Object.entries(needs).filter(([k,n]) => have(k) < n).map(([k]) => howTo[k]).filter(Boolean).join(' '); // only what you are still short of
  showCard(`<div class="kicker">YOUR HUT: STEP ${st + 1} OF 3</div><h2>Build ${stage.name}</h2>
    ${st === 1 ? `<h4>${HOME_STYLES[homeStyle()].name}</h4><p>${HOME_STYLES[homeStyle()].what}</p>` : ''}${needList(needs)}${how ? `<p class="sub">${how}</p>` : ''}
    ${ok ? '<button id="buildHome">Build it</button>' : ''}${st === 1 ? ' <button id="otherWalls" class="ghost">Pick other walls</button>' : ''}`, ok ? 'Later' : 'Got it');
  if (st === 1) $('otherWalls').onclick = wallsPicker;
  if (ok) $('buildHome').onclick = () => {
    Object.entries(needs).forEach(([k,n]) => bagAdd(k, -n)); S.home = st + 1; if (S.home === 3) S.homeSize = 1; save(); drawHouse(); drawHome(); drawHud(); hideCard();
    sfx('till'); setTimeout(() => sfx('pick'), 250); burst(buildSite.position.clone(), 0xc98f58, 30);
    if (S.home === 3) { [523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*160)); burst(house.position.clone().setY(2), 0xffc857, 30);
      showAha('thatch', () => openDialog('Nana Gale', "A real home again! Built with your own two hands. Well, and a very determined axe. Go on inside. And dear? Try not to let the sky blow this one away.", [], S.hearts.nana)); }
    else toast(`You built ${stage.name}! Next: ${HOME_STAGES[S.home].name}.`);
  };
}
// the house plans on the wall inside: grow your home, or rebuild its walls another way
function housePlans() {
  if (VISIT) return toast(`${VISIT.name}'s house plans.`);
  const sz = homeSize(), next = HOME_SIZES[sz + 1], ok = next && enough(next.needs) && S.coins >= next.coins;
  showCard(`<div class="kicker">HOUSE PLANS</div><h2>Your home is a ${homeName()}</h2>
    ${next ? `<p>${next.adds}</p>${needList(next.needs, next.coins)}${ok ? `<button id="growHome">Build the ${next.name}</button> ` : ''}` : '<p>A house is the biggest home.</p>'}<button id="hpWalls" class="ghost">Change the walls</button>`, 'Close');
  $('hpWalls').onclick = wallPlans;
  if (ok) $('growHome').onclick = () => { Object.entries(next.needs).forEach(([k,n]) => bagAdd(k, -n)); S.coins -= next.coins; S.homeSize = sz + 1; save(); drawHouse(); drawHomeInside(); drawHud(); hideCard();
    [523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*160)); toast(sz === 1 ? 'Your home is a cottage now! Climb the ladder to see the loft.' : 'Your home is a house now! The study is through the door in the loft.'); };
}
function wallPlans() { // the three kinds of wall: a short row each, and the details when you tap one
  showCard(`<div class="kicker">HOUSE PLANS</div><h2>Walls</h2><div class="jlist">${Object.entries(HOME_STYLES).map(([k, w]) => `<button data-wall="${k}" class="craft">${w.name} ${k === homeStyle() ? '<span class="sub">Your walls now</span>' : needChips(w.needs)}</button>`).join('')}</div>`, 'Back', housePlans);
  document.querySelectorAll('[data-wall]').forEach(b => b.onclick = () => { const k = b.dataset.wall, w = HOME_STYLES[k], mine = k === homeStyle(), can = !mine && enough(w.needs);
    showCard(`<div class="kicker">WALLS</div><h2>${w.name}</h2><p>${w.what}</p>${mine ? '<p><b>Your walls now.</b></p>' : needList(w.needs)}${can ? '<button id="wallGo">Build these walls</button>' : ''}`, 'Back', wallPlans);
    if (can) $('wallGo').onclick = () => { Object.entries(w.needs).forEach(([m,n]) => bagAdd(m, -n)); S.homeStyle = k; S.wallOn = false; save(); drawHouse(); drawHud(); sfx('till'); hideCard(); toast(`New walls: ${w.name.toLowerCase()}. Step outside to see them.`); }; });
}
function homeStep() { // what the home-building goal says right now
  if (!S.tools.axe) return enough(CRAFTS[0].needs) ? { text:'Tap the tree stump workbench to make a stone axe.', target:workbench } : { text:`Pick up sticks, stones, and grass for a stone axe: ${needText(CRAFTS[0].needs)}.`, target:pickupGroup.children[0] || null };
  if (!S.tools.pick) return enough(CRAFTS[1].needs) ? { text:'Tap the tree stump workbench to make a stone pickaxe.', target:workbench } : { text:`Pick up grey stones for a stone pickaxe: ${needText(CRAFTS[1].needs)}. More appear each morning.`, target:pickupGroup.children.find(g => S.pickups[g.userData.i]?.t === 'stone') || pickupGroup.children[0] || null };
  const stage = HOME_STAGES[S.home || 0], needs = stageNeeds(S.home || 0);
  if (S.home === 1 && !S.homeStyle) return { text:'Tap the frame of your hut to pick your walls.', target:buildSite };
  if (enough(needs)) return { text:`Tap ${S.home ? 'your hut' : 'the old stones where your hut stood'} to build ${stage.name}.`, target:buildSite };
  const short = Object.entries(needs).find(([k,n]) => have(k) < n)[0];
  const tg = short === 'log' ? woodTrees.find(t => S.chopped[t.userData.key] !== S.day && t.parent === scene) : short === 'stone' ? rocks.find(r => S.chopped[r.userData.key] !== S.day) : bushes.find(b => S.chopped[b.userData.key] !== S.day);
  return { text:`Gather for ${stage.name}: ${needText(needs)}.`, target: tg || buildSite };
}
let lastHint = ''; function hintToast() { const h = homeHint(), k = h.replace(/\d+/g, ''); if (h && k !== lastHint) toast(h); lastHint = k; } // the floating +2 shows what you got; only speak up with a hint
function homeHint() { return (S.home || 0) < 3 ? homeStep().text : ''; }
// the campfire: sit by it, keep it going, and roast a marshmallow. Sleep here when you are ready
var fireF = 1; let fire3 = null;
function useCampfire() { if (fire3 || cine) return; closeDialog(); target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), cp = campfire.position.clone(), seat = cp.clone().add(V(.95, 0, .95)), fdir = cp.clone().sub(seat).setY(0).normalize(), side = V(fdir.z, 0, -fdir.x);
  player.position.copy(seat); player.rotation.y = Math.atan2(fdir.x, fdir.z); sitting = campfire; cine = { hold:true }; document.body.classList.add('in-cine');
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="fcMsg">Keep the fire going, and roast a marshmallow.<br>Hold Roast to hold it over the flames. Let go to pull it out.</p><p id="fcFact" class="sub" style="margin:-2px 0 8px"></p>
    <div class="fhbtns"><button id="fcStick" class="ghost">Add a stick</button><button id="fcBlow" class="ghost">Blow on it</button><button id="fcRoast">Roast</button></div><div class="fhbtns" style="margin-top:6px"><button id="fcSleep" class="ghost">${(S.home || 0) < 3 ? 'Sleep here tonight' : 'Sleep out here tonight'}</button><button id="fcUp" class="ghost">Get up</button></div>`; document.body.appendChild(hud);
  const msg = t => { const e = $('fcMsg'); if (e) e.innerHTML = t; };
  let F = .7, recent = [], smother = 0, holding = false, r = 0, onFire = false, eatT = 0, last = performance.now(), raf, usedStick = false, usedBlow = false, told = false, perfect = 0, tt = 0;
  const stick = new THREE.Group(); stick.add(mesh(new THREE.CylinderGeometry(.012, .012, 1.1, 5), mat(0x9b6b4a), 0, .55, 0)); const mm = mesh(new THREE.CylinderGeometry(.07, .07, .11, 10), mat(0xfffdf6), 0, 1.12, 0); stick.add(mm); const mmFire = mesh(new THREE.ConeGeometry(.06, .16, 6), glow(0xffa94d), 0, 1.25, 0); mmFire.visible = false; stick.add(mmFire); scene.add(stick);
  const smoke = []; for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color:0x9a9aa2, transparent:true, opacity:0, depthWrite:false })); scene.add(p); smoke.push(p); }
  const C = [[0, 0xfffdf6], [.35, 0xf0c46a], [.6, 0xb86f2c], [.85, 0x4a3020], [1, 0x1c1714]], col = v => { for (let i = 1; i < C.length; i++) if (v <= C[i][0]) { const a = new THREE.Color(C[i - 1][1]), b2 = new THREE.Color(C[i][1]); return a.lerp(b2, (v - C[i - 1][0]) / (C[i][0] - C[i - 1][0])); } return new THREE.Color(C[C.length - 1][1]); };
  const factMaybe = () => { if (!told && usedStick && usedBlow) { told = true; chime(988); $('fcFact').innerHTML = '<b>A fire needs 3 things: fuel, air, and heat.</b><br>Take any 1 away and it goes out.<br>Smothering a fire takes away its air.'; } };
  const end = () => { cancelAnimationFrame(raf); hud.remove(); scene.remove(stick, ...smoke); fireF = 1; fire3 = null; cine = null; sitting = null; document.body.classList.remove('in-cine'); snapCam(); save(); };
  $('fcStick').onclick = () => { usedStick = true; const n = performance.now(); recent = recent.filter(t => n - t < 3500); recent.push(n); sfx('chop');
    if (recent.length >= 3) { smother = 3; F = Math.max(.15, F - .35); msg('<b>Too many sticks at once.</b><br>The fire is smothered and smoky. It needs air. Blow on it.'); } else { F = Math.min(1.25, F + .22); msg(F > 1 ? 'A big, bright fire.' : 'The fire eats the new stick.'); } factMaybe(); };
  $('fcBlow').onclick = () => { usedBlow = true; sfx('swish'); if (onFire) { onFire = false; mmFire.visible = false; r = Math.max(r, .9); msg('Phew. You blew it out. It is burnt black.'); eatT = 1.6; }
    else if (smother > 0) { smother = 0; F = Math.min(1.2, F + .4); msg('<b>Whoosh.</b> Air reaches the wood and the flames leap back up.'); } else { F = Math.min(1.25, F + .1); msg('The flames flicker brighter for a moment.'); } factMaybe(); };
  const rb = $('fcRoast'); rb.onpointerdown = e => { e.preventDefault(); if (eatT > 0 || onFire) return; holding = true; }; ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => rb.addEventListener(ev, () => { if (!holding) return; holding = false;
    if (onFire) return; msg(r < .2 ? 'Still white. Hold it in longer.' : r < .55 ? (perfect++, '<b>Golden brown. Perfect.</b> Crisp outside, gooey inside.') : r < .85 ? 'Dark and crispy.' : 'Burnt black.'); if (r >= .2) { eatT = 1.4; sfx(r < .55 ? 'heart' : 'click'); } }));
  $('fcSleep').onclick = () => { end(); player.position.copy(seat); player.rotation.y = -2.4; goSleep('outside'); }; $('fcUp').onclick = end;
  const step = dt => { tt += dt; F = Math.max(.12, F - dt * .035); if (smother > 0) smother -= dt; fireF = (smother > 0 ? Math.max(.25, F * .4) : F) * 1.5;
    if (holding && !onFire) { r += dt * .32 * Math.min(1.2, fireF); if (r > 1.05) { onFire = true; holding = false; mmFire.visible = true; msg('<b>It caught fire!</b> Blow it out.'); } }
    if (eatT > 0 && (eatT -= dt) <= 0) { r = 0; onFire = false; mmFire.visible = false; msg('Mmm. Here is another marshmallow.'); }
    mm.material.color.copy(col(Math.min(1, r))); mm.scale.setScalar(1 + Math.min(r, .6) * .25); mmFire.scale.setScalar(1 + Math.sin(tt * 18) * .15);
    const reach = holding ? 1 : 0, from = seat.clone().addScaledVector(fdir, .2).setY(.75), tip = cp.clone().setY(holding ? .5 : .75).addScaledVector(fdir, holding ? 0 : -.35); stick.position.copy(from); stick.lookAt(tip); stick.rotateX(Math.PI / 2); stick.userData.k = (stick.userData.k || 0) + ((reach) - (stick.userData.k || 0)) * Math.min(1, dt * 6);
    smoke.forEach((p, i) => { const k = ((tt * .35 + i / 6) % 1); p.position.set(cp.x + Math.sin(i * 2 + tt) * .15, .5 + k * 2.2, cp.z + Math.cos(i * 3 + tt) * .15); p.scale.setScalar(.6 + k * 1.6); p.material.opacity = smother > 0 ? (1 - k) * .55 : 0; });
    camera.position.lerp(cp.clone().addScaledVector(fdir, -2.3).addScaledVector(side, 1.4).setY(1.9), 1 - Math.pow(.02, dt)); camera.lookAt(cp.x, .45, cp.z); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); raf = requestAnimationFrame(loop); };
  fire3 = { end, step, get state() { return { F, smother, r, onFire, perfect, told }; } }; loop(); }
function useHouse() {
  if ((S.home || 0) < 3) return useBuildSite();
  enterHut(); // straight inside, as the name tag says
}
function enterHut() { S.where = 'hut'; S.room = null; roomLight.position.set(ROOM.x, 3, ROOM.z + .5); player.position.set(ROOM.x, 0, ROOM.z + 2.2); target = null; pending = null; snapCam(); sfx('door'); drawRoom(); drawHud(); save(); }
function exitHut() { S.where = 'home'; player.position.set(-4, 0, -.25); target = null; pending = null; snapCam(); sfx('door'); drawHud(); save(); }
function useSpot(i) {
  const cur = S.placed[i], sp = SPOTS[i], info = CAT_INFO[sp.cat];
  if (cur) { openDialog('Your Home', `Take down the ${FURN[cur].name}? It goes back in your bag, and you can put it somewhere else.`, [{ label:'Take it down', fn:() => { S.placed[i] = null; drawRoom(); save(); closeDialog(); } }]); return; }
  const fits = Object.entries(S.furn).filter(([k,n]) => FURN_CAT[k] === sp.cat && n > S.placed.filter(x => x === k).length);
  if (!fits.length) { const owned = Object.entries(S.furn).some(([k,n]) => n > 0 && FURN_CAT[k] === sp.cat);
    toast(owned ? `This spot is for ${info.need}. Yours is already placed somewhere else.` : `This spot is for ${info.need}. ${info.buy}`); return; }
  showCard(`<div class="kicker">DECORATE</div><h2>${info.label}</h2><p>This spot is for ${info.need}. Pick one to place here.</p><div class="jlist">${fits.map(([k]) => `<button data-p="${k}">${FURN[k].name}</button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { S.placed[i] = b.dataset.p; hideCard(); drawRoom(); save(); sfx('plant');
    burst(spotGroups[i].getWorldPosition(new THREE.Vector3()).setY((sp.y || 0) + .2), 0xffc857, 10); });
}
let raining = false;
function seasonCheck() {
  const now = season(), was = S.lastSeason; S.lastSeason = now;
  if (was === null || was === now) return '';
  let lost = 0; if (S.mode !== 'cozy') S.tiles.forEach(t => { if (t.s === 2 && !CROPS[t.c].seasons.includes(now)) { t.s = 1; delete t.c; lost++; } });
  S.tiles.forEach((_, i) => drawTile(i)); applySeason();
  return `${SEASONS[now]} is here!${lost ? ` ${lost} out-of-season plant${lost>1?'s':''} wilted.` : ''} Pip has new seeds.`;
}
function sleep(passedOut, where) {
  S.day++; S.t = 0;
  S.tiles.forEach(t => { if (t.s === 2 && t.w) t.d++; t.w = false; });
  raining = Math.random() < .25;
  if (raining || S.sprinklers) S.tiles.forEach(t => { if (t.s >= 1) t.w = true; });
  let msg = passedOut ? (where === 'outside' ? 'New day!' : 'You were so tired you fell asleep. New day!') : raining ? (season() === 3 ? 'Good morning! Snow watered your crops.' : 'Good morning! Rain watered your crops.') : 'Good morning!';
  // one morning message only, the most important line: festival, then season change, then yesterday's wish, then rain or sprinkler
  if (S.sprinklers && !raining && !passedOut) msg = 'Good morning! Your sprinkler watered the garden.';
  const wishMsg = wishMorning(); if (wishMsg) msg = wishMsg; // yesterday's fountain wish
  const turned = seasonCheck(); if (turned) msg = turned;
  const fz = festival(); if (fz && !S.fests[fz.id + fz.year]) msg = `Today is ${fz.name}! Talk to ${NEIGHBORS[fz.host].name}.`;
  S.tiles.forEach((_, i) => drawTile(i));
  { const dm = dream(); S.dayDid = {}; setTimeout(() => { if (!screenBusy() && !toastQ.length && !S.newDay) toast(dm); }, 9000); } // after the good-morning message
  villageCut(); spawnDigs(); applySeason(); S.goals = null; ensureGoals(); peopleNewDay(); drawShrooms(); mythLookUp(); setTimeout(founderDrip, 6000); drawUsed();
  S.pickups = S.pickups || []; spawnPickups();
  if (where === 'outside') { if (S.where === 'hut') S.where = 'home'; } // you wake up right where you slept
  else if ((S.home || 0) < 3) { S.where = 'home'; player.position.set(campfire.position.x + .8, 0, campfire.position.z + .6); } else { S.where = 'hut'; player.position.set(ROOM.x - 1.4, 0, ROOM.z - .8); }
  target = null; pending = null; if (!cine) snapCam();
  toast(msg); if (wishMsg && msg !== wishMsg) toast(wishMsg); drawRoom(); drawHud(); save(); cloudPush(true); // a wish that came true is always told, after the main line
}

// --- going to sleep and waking up, as little film scenes ---
let cine = null, lying = false;
const easeIO = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2, wait = ms => new Promise(r => setTimeout(r, ms));
function shot(dur, p0, p1, l0, l1) { return new Promise(res => { cine = { t:0, dur, p0:p0.clone(), p1:p1.clone(), l0:l0.clone(), l1:l1.clone(), res }; }); }
function fadeTo(on, dark) { const f = $('fade'); if (dark) f.style.background = on ? '#1b1530' : f.style.background; f.style.opacity = on ? 1 : 0;
  return wait(750).then(() => { if (!on) f.style.background = ''; }); }
async function goSleep(where, passedOut) {
  if (cine) return; closeDialog(); target = null; pending = null; sitting = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  cine = { hold:true }; document.body.classList.add('in-cine'); // take the camera and hide the buttons
  if (where === 'outside') {
    lying = true; S.sleptOutside = true; if (S.t < .89) S.t = .89; // late enough that the stars are out
    const p = player.position.clone(), low = p.clone().add(V(1.9, 1.3, 2.1)), eye = p.clone().add(V(1.1, 1.0, 1.3)), body = p.clone().setY(p.y + .3), sky = p.clone().add(V(-6, 26, -18));
    if (passedOut) toast('You were so tired you lay down right where you were.');
    await shot(1.4, camera.position, low, p.clone().setY(p.y + .6), body);
    await shot(4.4, low, eye, body, sky); sfx('cricket'); await wait(900); sfx('cricket');
    await fadeTo(true, true);
    sleep(passedOut, 'outside'); lying = true;
    camera.position.copy(eye); cine = { t:0, dur:.01, p0:eye, p1:eye, l0:sky, l1:sky, res:() => {} };
    await wait(400); await fadeTo(false, true); sfx('bird'); await wait(700); sfx('bird');
    await shot(3.2, eye, low, sky, body); await wait(300);
    lying = false; burst(p.clone().setY(p.y + .5), 0xfff3a0, 10);
  } else {
    const bw = new THREE.Vector3(); bed.getWorldPosition(bw);
    player.position.set(bw.x, .42, bw.z + .92); player.rotation.y = 0; lying = true;
    const up = bw.clone().add(V(1.4, 2.4, 2.4)), look = bw.clone().setY(.5);
    await shot(1.5, camera.position, up, player.position.clone().setY(.8), look); await wait(900);
    await fadeTo(true, true);
    sleep(passedOut, 'bed'); player.position.set(bw.x, .42, bw.z + .92); lying = true; camera.position.copy(up);
    cine = { t:0, dur:.01, p0:up, p1:up, l0:look, l1:look, res:() => {} };
    await wait(500); await fadeTo(false, true); sfx('bird'); await wait(1300);
    lying = false; player.position.set(ROOM.x - 1.4, 0, ROOM.z - .8); await wait(200);
  }
  cine = null; document.body.classList.remove('in-cine');
}
// ============ INPUT ============
addEventListener('pointerup', () => { if (fish3) fish3.press(false); });
const tapMark = new THREE.Mesh(new THREE.RingGeometry(.18, .26, 24), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:0, depthWrite:false, side:THREE.DoubleSide }));
tapMark.rotation.x = -Math.PI/2; tapMark.userData.t = 1; scene.add(tapMark);
function markTap(p) { tapMark.position.set(p.x, p.y + .03, p.z); tapMark.userData.t = 0; }
const ray = new THREE.Raycaster(), down = new THREE.Raycaster(), ptr = new THREE.Vector2(), DOWN = new THREE.Vector3(0,-1,0);
let target = null, pending = null;
lobes.forEach(L => lateClicks.push(...L.extra));
const clickables = [...decos, ...nodes, kiln, furnace, pickupGroup, buildSite, workbench, campfire, ...woodTrees, ...rocks, ...bushes, ...(ownerNpc ? [ownerNpc] : []), mailbox, homeDock, greatBell, bellFrame, lumberPile, ship2, ...siteGroups, house, crate, sign, sign2, windmill, stakes, boulder, easel, darkroom, crystals, sundial, ship, pot, dock, bed, doormat, shelf, ...spotGroups, ...fruitTrees, ...tileGroups, ...Object.values(npcs)];
// ============ FREE BUILDING ============
const PIECES = [
  { id:'path', grp:'ground',    name:'Stone Path',     cost:{ stone:2 } },
  { id:'deck', grp:'ground',    name:'Wood Floor',     cost:{ log:1 } },
  { id:'fence', grp:'walls',   name:'Fence',          cost:{ log:1 } },
  { id:'hedge', grp:'walls',   name:'Hedge',          cost:{ fiber:2 } },
  { id:'wallw', grp:'walls',   name:'Wood Wall',      cost:{ log:2 } },
  { id:'walls', grp:'walls',   name:'Stone Wall',     cost:{ stone:3 } },
  { id:'lamp', grp:'lights',    name:'Lamp Post',      cost:{ log:1, stone:1 } },
  { id:'bench', grp:'lights',   name:'Bench',          cost:{ log:2 } },
  { id:'hammock', grp:'lights', name:'Hammock',        cost:{ fiber:8 } }, // hangs between 2 trees
  { id:'planter', grp:'garden', name:'Flower Planter', cost:{ log:1, fiber:1 } },
  { id:'arch', grp:'garden',    name:'Garden Arch',    cost:{ log:3, fiber:2 } },
  { id:'bpath', grp:'ground',   name:'Brick Path',     cost:{ brick:2 }, age:'kiln' },
  { id:'bwall', grp:'walls',   name:'Brick Wall',     cost:{ brick:3 }, age:'kiln' },
  { id:'potplant', grp:'garden',name:'Pot Planter',    cost:{ pot:1, fiber:1 }, age:'kiln' },
  { id:'flantern', grp:'lights', name:"Founder's Lantern", cost:{}, founder:true },
  { id:'chest', grp:'garden',   name:'Storage Chest',  cost:{ log:4, stone:2 } },
  { id:'blamp', grp:'lights',   name:'Bronze Lantern', cost:{ bronze:1, stone:1 }, age:'furnace' },
  { id:'statue', grp:'garden',  name:'Statue of Pip',  cost:{ bronze:2, stone:4 }, age:'furnace' },
  { id:'glamp', grp:'lights',   name:'Glass Lantern',  cost:{ glass:1, log:1 }, age:'glass' },
  { id:'gwall', grp:'walls',    name:'Window Wall',    cost:{ glass:2, log:2 }, age:'glass' },
];
const lampLights = [];
function pieceModel(id, hung) {
  const g = new THREE.Group(), wood = mat(0xc98f58, { map:tx('planks', 2, 1) }), dark = mat(0x9b6b4a, { map:tx('grain', 1, 2) }), stoneM = mat(0xc9c1d0, { map:tx('stone', 1, 1) });
  if (id === 'path') for (let i=0;i<4;i++){ const st = mesh(new THREE.CylinderGeometry(.24,.26,.06,7), stoneM, (i%2-.5)*.48, .03, (Math.floor(i/2)-.5)*.48); st.rotation.y = i; g.add(st); }
  if (id === 'deck') for (let i=0;i<4;i++) g.add(mesh(new THREE.BoxGeometry(.98,.08,.23), i%2 ? wood : mat(0xd9a066), 0, .04, -.37 + i*.245));
  if (id === 'fence') { [-.45,0,.45].forEach(x => g.add(mesh(new THREE.BoxGeometry(.08,.6,.08), mat(0xfff1d6), x, .3, 0))); [.2,.45].forEach(y => g.add(mesh(new THREE.BoxGeometry(1,.06,.05), mat(0xfff1d6), 0, y, 0))); }
  if (id === 'hedge') { const hm = mat(0x4fb46a); g.add(mesh(new THREE.BoxGeometry(.95,.7,.5), hm, 0, .35, 0)); [-.3,.3].forEach(x => g.add(mesh(sph(.3), hm, x, .62, 0))); }
  if (id === 'wallw') for (let k=0;k<3;k++) g.add(mesh(new THREE.BoxGeometry(1,.36,.14), k%2 ? wood : mat(0xd9a066), 0, .18 + k*.37, 0));
  if (id === 'walls') for (let k=0;k<3;k++) for (let j=0;j<2;j++) g.add(mesh(new THREE.BoxGeometry(.48,.32,.3), stoneM, -.25 + j*.5 + (k%2)*.08, .16 + k*.33, 0));
  if (id === 'lamp') { g.add(mesh(new THREE.CylinderGeometry(.05,.07,1.5,8), dark, 0, .75, 0)); g.add(mesh(new THREE.BoxGeometry(.28,.3,.28), glow(0xffe0a8), 0, 1.6, 0)); g.add(mesh(new THREE.ConeGeometry(.24,.18,4), dark, 0, 1.84, 0).rotateY(Math.PI/4));
    const lh = halo(0xffc46b, 2.2, 0); lh.position.y = 1.6; g.add(lh); lampLights.push(lh); }
  if (id === 'hammock') { const L = hung && hung.len ? hung.len - .3 : .92, k = L / .92;
    if (!hung || !hung.len) [-.5, .5].forEach(x => { const po = mesh(new THREE.CylinderGeometry(.045,.06,1.15,8), dark, x, .57, 0); po.rotation.z = x > 0 ? -.12 : .12; g.add(po); });
    const sling = mesh(new THREE.TorusGeometry(.46, .13, 8, 24, Math.PI), mat(0xfff1d6), 0, 1.02, 0); sling.rotation.z = Math.PI; sling.scale.set(k, .7, 2.3); g.add(sling); // sags in the middle
    [-.2, .2].forEach(z => { const st = mesh(new THREE.TorusGeometry(.46, .03, 6, 24, Math.PI), mat(0xff8fa3), 0, 1.03, z); st.rotation.z = Math.PI; st.scale.set(k, .7, 1); g.add(st); });
    if (hung && hung.len) [-1, 1].forEach(sd => g.add(mesh(new THREE.TorusGeometry(.2, .03, 6, 14), mat(0xc9a27a), sd * (hung.len / 2 - .02), 1.02, 0).rotateY(Math.PI / 2))); } // rope tied around each trunk
  if (id === 'bench') { g.add(mesh(new THREE.BoxGeometry(.95,.08,.38), wood, 0, .4, 0)); g.add(mesh(new THREE.BoxGeometry(.95,.3,.06), wood, 0, .62, -.18)); [-.4,.4].forEach(x => g.add(mesh(new THREE.BoxGeometry(.08,.4,.34), dark, x, .2, 0))); }
  if (id === 'planter') { g.add(mesh(new THREE.BoxGeometry(.8,.3,.5), wood, 0, .15, 0)); for (let i=0;i<6;i++) g.add(mesh(sph(.08), mat([0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff,0xffb36b,0xff8fa3][i]), -.28 + (i%3)*.28, .36, -.1 + Math.floor(i/3)*.2)); }
  if (id === 'bpath') for (let i=0;i<8;i++) g.add(mesh(new THREE.BoxGeometry(.46,.06,.22), mat(i%3 ? 0xc0703f : 0xa85c34), (i%2 ? .24 : -.24) + (Math.floor(i/2)%2 ? .06 : 0), .03, -.36 + Math.floor(i/2)*.24));
  if (id === 'bwall') for (let k=0;k<4;k++) for (let j=0;j<3;j++) g.add(mesh(new THREE.BoxGeometry(.31,.22,.26), mat((k+j)%2 ? 0xc0703f : 0xa85c34), -.33 + j*.33 + (k%2)*.08, .12 + k*.24, 0));
  if (id === 'potplant') { g.add(mesh(new THREE.CylinderGeometry(.26,.18,.36,14), mat(0xc0703f), 0, .18, 0)); for (let i=0;i<5;i++){ const l = mesh(new THREE.ConeGeometry(.07,.4,5), mat(0x4fb46a), Math.cos(i)*.1, .5, Math.sin(i)*.1); l.rotation.set(Math.sin(i)*.4, 0, Math.cos(i)*.4); g.add(l); } }
  if (id === 'blamp') { g.add(mesh(new THREE.CylinderGeometry(.05,.08,1.3,8), mat(0xd9a441, { metalness:.6, roughness:.35 }), 0, .65, 0)); g.add(mesh(new THREE.SphereGeometry(.2,12,10), glow(0xffe0a8), 0, 1.42, 0)); g.add(mesh(new THREE.ConeGeometry(.24,.2,8), mat(0xd9a441, { metalness:.6, roughness:.35 }), 0, 1.66, 0));
    const lh = halo(0xffc46b, 2.4, 0); lh.position.y = 1.42; g.add(lh); lampLights.push(lh); }
  if (id === 'statue') { const br = mat(0xc9924a, { metalness:.55, roughness:.4 }); g.add(mesh(new THREE.BoxGeometry(.7,.35,.7), mat(0xc9c1d0), 0, .17, 0)); g.add(mesh(sph(.32), br, 0, .62, 0)); g.add(mesh(sph(.26), br, 0, 1.05, 0));
    const bk = mesh(new THREE.ConeGeometry(.06,.14,6), br, 0, 1.02, .28); bk.rotation.x = Math.PI/2; g.add(bk); g.add(mesh(new THREE.CylinderGeometry(.2,.22,.08,14), br, 0, 1.3, 0)); g.add(mesh(new THREE.CylinderGeometry(.13,.15,.2,14), br, 0, 1.42, 0)); }
  if (id === 'flantern') { const gold = mat(0xd9a441, { metalness:.55, roughness:.35 });
    g.add(mesh(new THREE.CylinderGeometry(.18,.24,.2,8), gold, 0, .1, 0)); g.add(mesh(new THREE.CylinderGeometry(.04,.05,1.5,8), gold, 0, .85, 0));
    const cage = mesh(new THREE.OctahedronGeometry(.28), glow(0xc9b6ff), 0, 1.75, 0); cage.scale.y = 1.3; g.add(cage); g.add(mesh(new THREE.OctahedronGeometry(.1), glow(0xffe07a), 0, 2.2, 0));
    const lh = halo(0xc9b6ff, 2.6, 0); lh.position.y = 1.75; g.add(lh); lampLights.push(lh);
    for (let i = 0; i < 8; i++) { const f = mesh(sph(.035), new THREE.MeshBasicMaterial({ color:0xf6ff9a, transparent:true, opacity:0 })); g.add(f); lanternFF.push(f); } }
  if (id === 'glamp') { const gl = new THREE.MeshStandardMaterial({ color:0xd8f0ff, transparent:true, opacity:.35, roughness:.05, metalness:.1 });
    g.add(mesh(new THREE.CylinderGeometry(.05,.07,1.1,8), dark, 0, .55, 0)); g.add(mesh(new THREE.BoxGeometry(.36,.06,.36), dark, 0, 1.12, 0)); g.add(mesh(new THREE.BoxGeometry(.32,.4,.32), gl, 0, 1.35, 0)); g.add(mesh(new THREE.BoxGeometry(.24,.32,.24), glow(0xffe7b0), 0, 1.35, 0)); [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([x,z]) => g.add(mesh(new THREE.BoxGeometry(.03,.42,.03), dark, x * .16, 1.35, z * .16)));
    g.add(mesh(new THREE.ConeGeometry(.26,.18,4), dark, 0, 1.64, 0).rotateY(Math.PI/4)); const lh = halo(0xffd88a, 2.4, 0); lh.position.y = 1.35; g.add(lh); lampLights.push(lh); }
  if (id === 'gwall') { const gl = new THREE.MeshStandardMaterial({ color:0xcfeaff, transparent:true, opacity:.38, roughness:.05, metalness:.1 });
    [[0,.05,1,.1],[0,1.15,1,.1],[-.47,.6,.08,1.1],[.47,.6,.08,1.1],[0,.6,.06,1.1],[0,.6,1,.06]].forEach(([x,y,w,h]) => g.add(mesh(new THREE.BoxGeometry(w,h,.1), wood, x, y, 0)));
    [[-.24,.33],[.24,.33],[-.24,.88],[.24,.88]].forEach(([x,y]) => g.add(mesh(new THREE.BoxGeometry(.4,.48,.03), gl, x, y, 0))); }
  if (id === 'chest') { g.add(mesh(new THREE.BoxGeometry(.8,.42,.52), wood, 0, .21, 0)); const lid = mesh(new THREE.CylinderGeometry(.26,.26,.8,12,1,false,0,Math.PI), mat(0xd9a066), 0, .42, 0); lid.rotation.z = Math.PI/2; g.add(lid);
    [-.28,.28].forEach(x => { g.add(mesh(new THREE.BoxGeometry(.06,.44,.54), dark, x, .22, 0)); }); g.add(mesh(new THREE.BoxGeometry(.12,.14,.04), mat(0xd9a441, { metalness:.5, roughness:.4 }), 0, .38, .27)); g.userData.kind = 'chest'; }
  if (id === 'arch') { [-.45,.45].forEach(x => g.add(mesh(new THREE.BoxGeometry(.1,1.6,.1), mat(0xfff1d6), x, .8, 0))); const top = mesh(new THREE.TorusGeometry(.45,.05,6,16,Math.PI), mat(0xfff1d6), 0, 1.6, 0); g.add(top);
    for (let i=0;i<8;i++){ const a = i/7*Math.PI; g.add(mesh(sph(.07), mat([0xff8fa3,0x8fdc8a,0xfff3a0][i%3]), Math.cos(a)*.45, 1.6 + Math.sin(a)*.45, .05)); } }
  return g;
}
const buildGroup = new THREE.Group(); scene.add(buildGroup); lateClicks.push(buildGroup);
// --- island specialty plant and heirloom flower bed ---
let myCode = null;
const tradeGroup = new THREE.Group(); scene.add(tradeGroup); lateClicks.push(tradeGroup);
function drawTradePlants() {
  tradeGroup.clear(); const code = VISIT ? VISIT_CODE : myCode;
  const sp = SPECIALTIES.find(x => x.id === S.specialty);
  if (sp && featureOn('specialty') && !VISIT) {
    const g = new THREE.Group(); g.position.set(5.3, 0, 2.6); tradeGroup.add(g);
    g.add(mesh(new THREE.CylinderGeometry(.09,.13,1,7), mat(0x7a5236), 0, .5, 0));
    [[0,1.15,0,.55],[.35,.95,.1,.38],[-.32,.98,-.05,.4]].forEach(([x,y,z,r]) => g.add(mesh(sph(r), mat(sp.leaf), x, y, z)));
    for (let i = 0; i < 7; i++) { const a = i*.9, pod = mesh(new THREE.SphereGeometry(.12,8,6), mat(sp.color), Math.cos(a)*.52, .75 + (i%3)*.18, Math.sin(a)*.45); pod.scale.y = 1.5; g.add(pod); }
    const h = hitBox(1.3, 1.8, 1.3); h.position.y = .9; g.add(h); deco(g, pickSpecialty); }
  if (code && featureOn('heirloom')) {
    const f = heirloomOf(code), g = new THREE.Group(); g.position.set(-2.75, 0, 3); tradeGroup.add(g);
    g.add(mesh(new THREE.CylinderGeometry(.55,.6,.2,16), mat(0x7a5236), 0, .1, 0));
    [[0,0],[.28,.18],[-.26,.2],[.2,-.26],[-.22,-.22]].forEach(([x,z], j) => { const fl = new THREE.Group(); fl.position.set(x, .2, z); g.add(fl);
      const hgt = .35 + (j%2)*.12; fl.add(mesh(new THREE.CylinderGeometry(.015,.02,hgt,4), mat(0x4fb46a), 0, hgt/2, 0));
      const head = new THREE.Group(); head.position.y = hgt; fl.add(head);
      for (let i = 0; i < f.petals; i++) { const a = i / f.petals * Math.PI * 2, pt = mesh(new THREE.SphereGeometry(.07,7,5), mat(f.stripes && i % 2 ? f.tip : f.main), Math.cos(a)*.09, 0, Math.sin(a)*.09); pt.scale.set(1.4,.35,.8); pt.rotation.y = -a; head.add(pt);
        if (!f.stripes) head.add(mesh(sph(.025), mat(f.tip), Math.cos(a)*.16, .01, Math.sin(a)*.16)); }
      head.add(mesh(sph(.045), mat(f.center), 0, .03, 0)); });
    const h = hitBox(1.2, .8, 1.2); h.position.y = .4; g.add(h); deco(g, () => pickHeirloom(code)); }
  if (typeof tameOutlines === 'function' && outline) tameOutlines();
}
friendCodeOf(S.syncKey).then(c => { myCode = c; drawTradePlants(); });
function pickSpecialty() {
  const sp = SPECIALTIES.find(x => x.id === S.specialty);
  if (!canCarry(sp.id, 3)) return bagFull();
  if (!daily('specialty')) { toast(`You already picked your ${sp.name.toLowerCase()} today. More grows by tomorrow.`); return; }
  gain(sp.id, 3, new THREE.Vector3(4, 1, 5.1), true); sfx('pick');
  toast(`This is your island's specialty. On a friend's island it sells for ${HOME_PRICE * AWAY_MULT} coins, so it makes a good gift or trade.`);
}
function pickHeirloom(code) {
  if (VISIT) { toast(`This heirloom flower only grows on ${VISIT.name}'s island.`); return; }
  const id = registerHeirloom(heirloomId(code));
  if (!canCarry(id)) return bagFull();
  if (!daily('heirloom')) { toast('You already picked your heirloom flower today.'); return; }
  gain(id, 1, new THREE.Vector3(1.6, .8, 5.2), true); sfx('heart');
  toast(`You picked a ${ITEMS[id].name}. This flower only grows on your island, so no one else has one unless you give it to them.`);
}
// --- insects you can catch with a bug net ---
const bugGroup = new THREE.Group(); scene.add(bugGroup); lateClicks.push(bugGroup);
function bugModel(id) {
  const g = new THREE.Group(), s = sph, M = fine, body = new THREE.Group(); g.add(body);
  const wings = (w, h, kind = 'clear', y = .05, z = 0) => { const geo = new THREE.PlaneGeometry(w, h); geo.rotateX(-Math.PI/2); geo.translate(w/2, 0, 0); const m = wingMat(kind);
    const l = new THREE.Mesh(geo, m), r = new THREE.Mesh(geo, m); r.scale.x = -1; l.position.set(0, y, z); r.position.set(0, y, z); g.add(l, r); g.userData.wings = [...(g.userData.wings || []), l, r]; };
  const legs = (c, n = 3, len = .07, z0 = .03, dz = .035, y = 0) => { const lm = M(c); for (let i = 0; i < n; i++) [-1, 1].forEach(sd => { const lg = mesh(new THREE.CylinderGeometry(.004,.004,len,3), lm, sd * len * .45, y - .012, z0 - i * dz); lg.rotation.z = sd * 1.1; lg.rotation.y = (i - 1) * .5 * sd; body.add(lg); }); };
  const feelers = (c, len, z, spread = .35, y = .01) => { const fm = M(c); [-1, 1].forEach(sd => { const f = mesh(new THREE.CylinderGeometry(.003,.003,len,3), fm, sd * len * .25, y + len * .25, z + len * .35); f.rotation.set(Math.PI/2 - .6, 0, -sd * spread); body.add(f); }); };
  const part = (r, c, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = mesh(s(r), M(c), x, y, z); m.scale.set(sx, sy, sz); body.add(m); return m; };
  if (id === 'honeybee') { // fuzzy amber body in three parts, dark bands, big eyes, two pairs of clear wings
    part(.045, 0x3b2a1a, 0, 0, .085); part(.05, 0xc98a2a, 0, .005, .03, 1, 1, 1.1); part(.06, 0xffc857, 0, 0, -.06, 1, .95, 1.5);
    [-.02, -.06, -.1].forEach((z, i) => { const st = mesh(new THREE.TorusGeometry(.058 - i * .008,.011,6,14), M(0x2b2233), 0, 0, z); body.add(st); });
    [-1, 1].forEach(sd => part(.02, 0x1a1420, sd * .03, .01, .1)); legs(0x2b2233, 3, .06, .05, .035); feelers(0x2b2233, .05, .1); wings(.13, .07, 'clear', .05, .02); wings(.09, .05, 'clear', .05, -.02); g.userData.wings.forEach((w, i) => w.rotation.y = i % 2 ? -.45 : .45); }
  if (id === 'ladybird') { // the seven-spot: red wing cases with a seam, three spots on each side and one in the middle, a black head with two white marks
    const dome = mesh(new THREE.SphereGeometry(.075, 16, 10, 0, Math.PI*2, 0, Math.PI/2), M(0xd8323c)); dome.scale.set(1, .85, 1.15); body.add(dome);
    body.add(mesh(new THREE.BoxGeometry(.004,.01,.15), M(0x2b2233), 0, .063, -.005)); part(.04, 0x2b2233, 0, .012, .075, 1.2, .8, .8); [-1, 1].forEach(sd => part(.012, 0xffffff, sd * .03, .03, .095, 1, 1, .5));
    [[.035,.04,.03],[.045,.03,-.02],[.03,.03,-.06]].forEach(([x, y, z]) => [-1, 1].forEach(sd => part(.015, 0x2b2233, sd * x, y + .012, z, 1, .5, 1))); part(.016, 0x2b2233, 0, .058, .045, 1, .5, 1);
    legs(0x2b2233, 3, .05, .04, .04, .01); feelers(0x2b2233, .03, .09, .5); }
  if (id === 'dragonfly') { // the green darner: big eyes that meet, a green middle, a long thin blue tail in segments, four veined wings held flat
    part(.035, 0x3fbf5f, 0, 0, .12, 1, 1, 1.2); [-1, 1].forEach(sd => part(.026, 0x6fa85a, sd * .02, .012, .16));
    for (let i = 0; i < 8; i++) { const sg = mesh(new THREE.CylinderGeometry(.012 - i * .0008,.012 - i * .0008,.036,6), M(i % 2 ? 0x3f7fd0 : 0x5b9fe6), 0, 0, .075 - i * .037); sg.rotation.x = Math.PI/2; body.add(sg); }
    legs(0x2b2233, 3, .04, .14, .02); wings(.2, .05, 'clear', .02, .13); wings(.18, .055, 'clear', .02, .085); }
  if (id === 'hopper') { // grasshopper: a long green body, a big head, and two folded back legs with thick thighs
    const c = 0x7fb069; const bd = mesh(new THREE.CapsuleGeometry(.028, .13, 4, 8), M(c)); bd.rotation.x = Math.PI/2; body.add(bd); part(.032, 0x8fc079, 0, .01, .1, 1, 1.1, 1); [-1, 1].forEach(sd => part(.01, 0x2b2233, sd * .022, .025, .115));
    const wc = mesh(new THREE.CapsuleGeometry(.02, .12, 3, 6), M(0x6a9a58), 0, .022, -.03); wc.rotation.x = Math.PI/2; wc.scale.x = .8; body.add(wc);
    [-1, 1].forEach(sd => { const th = mesh(new THREE.CapsuleGeometry(.014, .09, 3, 6), M(c), sd * .045, .035, -.03); th.rotation.set(.9, 0, sd * .25); body.add(th); const sh = mesh(new THREE.CylinderGeometry(.005,.005,.12,4), M(0x5f8a4f), sd * .055, .02, -.085); sh.rotation.x = -.7; body.add(sh); });
    legs(0x5f8a4f, 2, .05, .07, .04); feelers(0x5f8a4f, .09, .11, .3, .02); }
  if (id === 'mantis') { // praying mantis: a three-cornered head on a long neck, front legs folded as if praying, a slim body
    const c = 0x8fdc8a; const ab = mesh(new THREE.CapsuleGeometry(.024, .13, 4, 8), M(c), 0, .02, -.04); ab.rotation.x = Math.PI/2 - .15; body.add(ab);
    const neck = mesh(new THREE.CylinderGeometry(.012,.016,.13,5), M(c), 0, .1, .06); neck.rotation.x = .5; body.add(neck);
    const hd = mesh(new THREE.ConeGeometry(.032,.04,3), M(0x9fe89a), 0, .17, .1); hd.rotation.set(Math.PI/2 + .5, 0, Math.PI); body.add(hd); [-1, 1].forEach(sd => part(.012, 0x3f7a4f, sd * .026, .178, .1));
    [-1, 1].forEach(sd => { const up = mesh(new THREE.CapsuleGeometry(.009, .06, 3, 5), M(c), sd * .03, .11, .11); up.rotation.x = -.9; body.add(up); const lo = mesh(new THREE.CapsuleGeometry(.008, .055, 3, 5), M(0x7fcf7a), sd * .03, .12, .15); lo.rotation.x = .7; body.add(lo); });
    legs(0x6fbf6a, 2, .08, .0, .06, .02); feelers(0x6fbf6a, .06, .11, .4, .17); }
  if (id === 'cicada') { // periodical cicada: a wide black body, red eyes set far apart, clear wings with orange veins that reach past the tail
    part(.055, 0x1f1a22, 0, .005, -.02, 1, .8, 1.7); part(.045, 0x2b2430, 0, .012, .07, 1.25, .8, .8); [-1, 1].forEach(sd => part(.016, 0xd8323c, sd * .05, .022, .085));
    [-.05, -.08].forEach(z => body.add(mesh(new THREE.TorusGeometry(.045,.006,5,12), M(0xe8892c), 0, .005, z))); legs(0xe8892c, 3, .05, .05, .035); wings(.22, .08, 'cicada', .045, .03); g.userData.wings.forEach((w, i) => w.rotation.y = i % 2 ? -1.25 : 1.25); }
  if (id === 'stagbeetle') { // stag beetle: black head and shoulders, red-brown wing cases, and two antler jaws with prongs
    part(.07, 0x5a2a1c, 0, .01, -.04, .95, .5, 1.35); body.add(mesh(new THREE.BoxGeometry(.004,.01,.17), M(0x2a1410), 0, .046, -.04)); part(.055, 0x1c1416, 0, .01, .055, 1.05, .5, .7); part(.045, 0x1c1416, 0, .01, .105, 1.15, .45, .6);
    [-1, 1].forEach(sd => { const jw = new THREE.Group(); jw.position.set(sd * .022, .012, .135); jw.rotation.y = sd * .55; body.add(jw); const jm = M(0x6b2a1c); jw.add(mesh(new THREE.BoxGeometry(.013,.013,.06), jm, 0, 0, .03)); const tip = mesh(new THREE.BoxGeometry(.011,.011,.05), jm, -sd * .014, 0, .075); tip.rotation.y = -sd * .9; jw.add(tip); const pr = mesh(new THREE.BoxGeometry(.01,.01,.022), jm, -sd * .012, 0, .04); pr.rotation.y = -sd * 1.3; jw.add(pr); });
    legs(0x1c1416, 3, .07, .07, .05, .005); feelers(0x1c1416, .04, .12, .9, .005); }
  if (id === 'firefly') { // firefly: a soft dark beetle with a red-and-black shield behind the head, and a tail that lights up
    part(.03, 0x2b2233, 0, 0, 0, 1, .7, 1.7); part(.024, 0xd8523c, 0, .004, .05, 1.2, .6, .7); part(.01, 0x1c1416, 0, .01, .052); const t = mesh(s(.024), glow(0xfff38a), 0, -.004, -.045); body.add(t);
    const h = halo(0xfff38a, .5, .9); g.add(h); g.userData.halo = h; legs(0x1c1416, 3, .035, .03, .025); feelers(0x1c1416, .04, .06, .4); wings(.09, .04, 'clear', .028, .01); g.userData.wings.forEach((w, i) => w.rotation.y = i % 2 ? -1.1 : 1.1); }
  if (id === 'lunamoth') { // luna moth: pale green wings with long tails and an eye spot on each, a white furry body, feathery feelers
    const bd = mesh(new THREE.CapsuleGeometry(.022, .07, 4, 6), M(0xf6f2e6)); bd.rotation.x = Math.PI/2; body.add(bd); part(.02, 0xf6f2e6, 0, .004, .055);
    [-1, 1].forEach(sd => { const f = mesh(new THREE.BoxGeometry(.012,.003,.05), M(0xd9b36a), sd * .022, .012, .085); f.rotation.y = -sd * .5; body.add(f); }); wings(.22, .26, 'luna', .01, -.02); }
  if (id === 'springtail') { // snow flea: a tiny dark blue body in segments, short feelers, and the forked spring under its tail
    for (let i = 0; i < 5; i++) part(.022 - Math.abs(i - 1.5) * .003, i % 2 ? 0x3a4468 : 0x2c3454, 0, 0, .045 - i * .026, 1, .8, .9); part(.016, 0x2c3454, 0, .002, .07);
    [-1, 1].forEach(sd => { const fk = mesh(new THREE.CylinderGeometry(.003,.003,.04,3), M(0x56608a), sd * .008, -.014, -.07); fk.rotation.x = 1.1; body.add(fk); }); legs(0x56608a, 3, .03, .03, .025); feelers(0x56608a, .03, .08, .4, 0); }
  bake(body);
  const hb = hitBox(.8, .8, .8); g.add(hb); g.scale.setScalar(id === 'lunamoth' || id === 'dragonfly' ? 1.6 : 1.8);
  return g;
}
const FLOWER_SPOTS = [[-5.1,-1.25],[-2.9,-1.25],[-5.55,-3],[-2.45,-3],[-.9,-.1],[6.3,.3]];
function spawnBugs() {
  bugGroup.children.slice().forEach(b => bugGroup.remove(b));
  if (VISIT || !featureOn('butterflies')) return;
  const s = season(), h = hour(), isNight = h >= 20 || h < 6, fit = INSECTS.filter(b => b.seasons.includes(s) && (b.time === 'any' || (b.time === 'night') === isNight));
  if (!fit.length) return;
  const trunks = woodTrees.filter(t => t.parent === scene && t.visible !== false);
  for (let i = 0; i < 4; i++) {
    const b = fit[Math.floor(Math.random() * fit.length)], g = bugModel(b.id); let x, y, z, tries = 0;
    if (b.where === 'tree' && trunks.length) { const t = trunks[Math.floor(Math.random()*trunks.length)], a = Math.random()*6.28; x = t.position.x + Math.cos(a)*.24; z = t.position.z + Math.sin(a)*.24; y = .6 + Math.random()*.4; g.rotation.y = -a + Math.PI/2; g.rotation.x = -1.2; }
    else if (b.where === 'flower') { const [fx, fz] = FLOWER_SPOTS[Math.floor(Math.random()*FLOWER_SPOTS.length)]; x = fx + (Math.random()-.5)*.6; z = fz + (Math.random()-.5)*.3; y = .3; }
    else { do { x = (Math.random()-.5)*15; z = (Math.random()-.5)*15; tries++; } while (tries < 30 && blockedAt(x, z)); y = b.where === 'air' ? 1 + Math.random()*.8 : .04; }
    g.position.set(x, y, z); g.userData = { ...g.userData, bug:b, ax:x, ay:y, az:z, ph:Math.random()*10, hop:0 };
    g.userData.kind = 'deco'; g.userData.use = () => swingNet(g, b, () => { g.userData.flee = 1; });
    bugGroup.add(g);
  }
}
let lastBugHour = -1;
function animateBugs(now, dt) {
  const hh = Math.floor(hour()); if (hh !== lastBugHour && hh % 3 === 0) { lastBugHour = hh; spawnBugs(); }
  bugGroup.visible = S.where !== 'hut';
  bugGroup.children.forEach(g => { const u = g.userData, b = u.bug; if (!b) return;
    if (u.flee > 0) { u.flee -= dt; g.position.y += dt * 3; if (b.where !== 'air') g.position.x += dt * 2; if (u.flee <= 0) g.visible = false; return; }
    if (u.wings) { const f = Math.sin(now * (b.id === 'lunamoth' ? 8 : 40) + u.ph) * (b.where === 'air' ? .9 : .15); u.wings.forEach((w, i) => w.rotation.z = i % 2 ? -f : f); }
    if (b.where === 'air') { const t = now * .5 + u.ph; g.position.set(u.ax + Math.sin(t) * 1.4, u.ay + Math.sin(t * 2.3) * .25, u.az + Math.cos(t * .8) * 1.4); g.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * .8)); }
    if (b.where === 'ground') { u.hop -= dt; if (u.hop <= 0) { u.hop = 1.5 + Math.random() * 2.5; u.hx = (Math.random()-.5) * .8; u.hz = (Math.random()-.5) * .8; u.ht = 0; }
      if (u.ht != null && u.ht < .45) { u.ht += dt; const k = u.ht / .45; g.position.x += u.hx * dt / .45; g.position.z += u.hz * dt / .45; g.position.y = u.ay + Math.sin(k * Math.PI) * .35; } }
    if (u.halo) u.halo.material.opacity = .5 + Math.sin(now * 3 + u.ph) * .4; });
}
// swing the net: most bugs are caught, but flying ones are quick
let netMesh = null;
function swingNet(g, b, onMiss) {
  if (!S.tools.net) { toast('You need a bug net. Make 1 at the tree stump workbench with grass fiber and sticks.'); return; }
  if (!netMesh) { netMesh = new THREE.Group(); netMesh.add(mesh(new THREE.CylinderGeometry(.02,.025,1.2,6), mat(0x9b6b4a), 0, .6, 0));
    const hoop = mesh(new THREE.TorusGeometry(.22, .02, 6, 20), mat(0xfff1d6), 0, 1.35, 0); netMesh.add(hoop); const bag = mesh(new THREE.ConeGeometry(.2, .35, 12, 1, true), new THREE.MeshStandardMaterial({ color:0xffffff, transparent:true, opacity:.55, side:THREE.DoubleSide }), 0, 1.35, -.17); bag.rotation.x = -Math.PI/2; netMesh.add(bag); }
  player.add(netMesh); netMesh.position.set(.35, .8, .2); netMesh.rotation.set(-1.4, 0, 0); swingT = .5; sfx('swish');
  const wp = new THREE.Vector3(); g.getWorldPosition(wp); player.rotation.y = Math.atan2(wp.x - player.position.x, wp.z - player.position.z);
  let k = 0; const sw = setInterval(() => { k += .1; netMesh.rotation.x = -1.4 + Math.sin(k * Math.PI) * 1.6; if (k >= 1) { clearInterval(sw); player.remove(netMesh); } }, 30);
  const got = Math.random() < (b.where === 'air' ? .72 : .9);
  setTimeout(() => {
    if (!got) { onMiss && onMiss(); toast(`Missed! The ${b.name.toLowerCase()} got away.`); return; }
    if (g.parent === bugGroup) bugGroup.remove(g); else g.userData.flee = 1.2;
    petHappy(); const isNew = !(S.bugs || []).includes(b.id); if (isNew) S.bugs = [...(S.bugs || []), b.id]; lean('explorer'); save(); drawHud();
    [784,988,1175].forEach((f,i) => setTimeout(() => chime(f), i*90)); burst(wp, 0xfff3a0, 12);
    showCard(`<div class="kicker">${isNew ? `NEW BUG! ${(S.bugs || []).length} of ${BUTTERFLIES.length + INSECTS.length}` : 'BUG NET'}</div><h2>${icon(b.id)} You caught a ${b.name}!</h2>
      ${isNew ? `<h4>In real life</h4><p>${b.fact}</p>` : `<p>It sells for ${ITEMS[b.id].sell} coins.</p>`}
      <button id="bKeep" ${canCarry(b.id) ? '' : 'style="display:none"'}>Keep it</button> <button id="bFree" class="ghost">Let it go</button>${canCarry(b.id) ? '' : '<p>Your bag is full.</p>'}`, null);
    $('bKeep').onclick = () => { bagAdd(b.id); save(); drawHud(); hideCard(); sfx('pick'); };
    $('bFree').onclick = () => { if (featureOn('journey')) karma('harmony', 1); save(); hideCard(); burst(wp.clone().setY(wp.y + .5), 0xc8f0b0, 10); toast(`The ${b.name.toLowerCase()} flies off, free.`); };
  }, 380);
}
// --- tap actions for decorations and build pieces ---
const PAINTS = [0xfff1d6, 0xff8fa3, 0x7ec8e3, 0xffc857, 0x8fdc8a, 0xc9b6ff, 0x9b6b4a];
const daily = key => { if (S.chopped[key] === S.day) return false; S.chopped[key] = S.day; return true; };
function pickSeeds(key) {
  if (!daily(key)) { toast('You already saved seeds here today. The flowers make more by tomorrow.'); return; }
  const s = season(), pool = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(s) && !CROPS[k].locked), k = pool[Math.floor(Math.random()*pool.length)] || 'cloudberry';
  S.seeds[k] = (S.seeds[k] || 0) + 1; sfx('plant'); floatText(`+1 ${icon(k)} ${CROPS[k].name.toLowerCase()} seed`, player.position.clone()); save(); drawHud();
  toast(`You saved a ${CROPS[k].name.toLowerCase()} seed from the flowers. ${TAP_FACTS.seeds}`);
}
function sunflowerSeeds(i) {
  if (!daily('sunseed' + i)) { toast('You already took seeds from this sunflower today.'); return; }
  S.seeds.sunbell = (S.seeds.sunbell || 0) + 2; sfx('plant'); floatText(`+2 ${icon('sunbell')} sunflower seeds`, player.position.clone()); save(); drawHud();
  toast(`+2 sunflower seeds. ${TAP_FACTS.sunflower}`);
}
function glowMushroom(h) { pulse(h, 1.5); tone(1047, { type:'triangle', dur:.6, vol:.03 }); tone(1568, { type:'triangle', t:.12, dur:.6, vol:.02 });
  if (!S.aha.includes('mush') && !(S.tapped || []).includes('mush')) { S.tapped = [...(S.tapped || []), 'mush']; save(); toast(TAP_FACTS.mushroom); } else toast('The mushroom glows brighter when you tap it.'); }
function factCard(kicker, title, text, id) { S.tapped = S.tapped || []; if (!S.tapped.includes(id)) { S.tapped.push(id); save(); }
  showCard(`<div class="kicker">${kicker}</div><h2>${title}</h2><h4>In real life</h4><p>${text}</p>`); }
function paintGardenFence() { S.fenceColor = PAINTS[(PAINTS.indexOf(S.fenceColor ?? PAINTS[0]) + 1) % PAINTS.length]; applyFenceColor(); sfx('click'); save(); toast('You painted the garden fence. Tap again for another color.'); }
function spotButterfly(g) {
  if (!featureOn('butterflies')) { g.userData.flee = 1.2; toast('The butterfly flutters away.'); return; }
  if (S.tools.net) return swingNet(g, { id:g.userData.sp.id, name:g.userData.sp.name, fact:g.userData.sp.fact, where:'air' }, () => { g.userData.flee = 1.2; });
  const sp = g.userData.sp; S.bugs = S.bugs || []; const first = !S.bugs.includes(sp.id);
  g.userData.flee = 1.2; tone(1760, { dur:.12, vol:.03 }); tone(2093, { t:.08, dur:.12, vol:.03 });
  if (first) { S.bugs.push(sp.id); save(); drawHud(); showCard(`<div class="kicker">NEW BUTTERFLY ${S.bugs.length} of ${BUTTERFLIES.length}</div><h2>${sp.name}</h2><h4>In real life</h4><p>${sp.fact}</p><p>Saved to Collections.</p>`); }
  else toast(`A ${sp.name}! You already have this one in Collections.`);
}
let sitting = null, danceT = 0; const lastPP = new THREE.Vector3(); const lanternFF = [];
const onPath = () => S.where === 'home' && (S.builds || []).some(b => (b.p === 'path' || b.p === 'bpath') && Math.abs(player.position.x - b.x) < .5 && Math.abs(player.position.z - b.z) < .5);
// a nap in the hammock skips ahead a few hours, never past 11 PM
const hammockOpen = () => founderOn() || S.hq >= 4;
// Nana's hammock: a short story mission. Each step says why you are doing it.
// hq: 0 not started, 1 gather 8 grass, 3 hang it between the 2 trees, 4 done
const HQ_SPOT = [6.25, -3.25];
function hammockStep() { return S.hq === 1 ? `Cut bushes for grass, then bring it to Nana. ${icon('fiber')} ${Math.min(8, have('fiber'))}/8` : S.hq === 3 ? 'Hang the hammock between the 2 trees behind your garden. Tap the glowing spot between them.' : ''; }
function hammockTalk() {
  if (!S.hq) return openDialog('Nana Gale', "See those 2 trees behind your garden? Your grandmother kept a hammock there. She said her best ideas came to her half asleep in it. The Great Gust took it.", [{ label:'Can we make a new one?', fn:() => { S.hq = 1; save(); drawHud();
      openDialog('Nana Gale', "We can. A hammock is only rope and knots, and rope is only grass. Bring me 8 grass. Bushes have plenty.", [], S.hearts.nana); } }], S.hearts.nana);
  if (S.hq === 1 && have('fiber') < 8) return openDialog('Nana Gale', `Grass ${have('fiber')}/8, dear. Cut a few more bushes.`, [], S.hearts.nana);
  if (S.hq === 1) { bagAdd('fiber', -8); S.hq = 3; save(); drawHud(); drawHammockSpot(); sfx('swish');
    return openDialog('Nana Gale', "Watch. 1 blade of grass snaps in your fingers. Twist many together and each one holds the others. That is all rope is. Now go hang it. Tap the glowing spot between the 2 trees behind your garden.", [], S.hearts.nana); }
  if (S.hq === 3) return openDialog('Nana Gale', 'It is ready. Hang it between the 2 trees behind your garden. Tap the glowing spot.', [], S.hearts.nana); }
var hammockSpot = null;
function drawHammockSpot() { if (!hammockSpot) { hammockSpot = new THREE.Group(); hammockSpot.position.set(HQ_SPOT[0], 0, HQ_SPOT[1]); const ring = new THREE.Mesh(new THREE.RingGeometry(.45, .6, 32), new THREE.MeshBasicMaterial({ color:0xffe07a, transparent:true, opacity:.8, side:THREE.DoubleSide })); ring.rotation.x = -Math.PI/2; ring.position.y = .04; hammockSpot.add(ring);
    const h = halo(0xffe07a, 1.6, .6); h.position.y = .5; hammockSpot.add(h); const hb = hitBox(1.4, 1.4, 1.4); hb.position.y = .7; hammockSpot.add(hb); deco(hb, hangHammock).userData.label = 'Glowing spot: tap to hang the hammock'; scene.add(hammockSpot); lateClicks.push(hammockSpot); }
  hammockSpot.visible = S.hq === 3 && !VISIT; }
function hangHammock() { if (S.hq !== 3) return; S.hq = 4; S.builds = [...(S.builds || []), { p:'hammock', x:HQ_SPOT[0], z:HQ_SPOT[1], a:-Math.atan2(3, 1.5), len:3.354 }]; drawBuilds(); drawHammockSpot(); save(); drawHud();
  burst(new THREE.Vector3(HQ_SPOT[0], 1, HQ_SPOT[1]), 0xffc857, 24); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 130));
  showCard(`<div class="kicker">NANA'S HAMMOCK</div><h2>It is up!</h2><p>The hammock hangs right where your grandmother's did. Tap it any time to take a nap and skip ahead in the day.</p>`, 'Try it'); }
function napMenu(o) { const max = Math.floor(23 - hour()); if (max < 1) return toast('It is too late for a nap. Time for bed.');
  let n = 1; const clock = h => { const hr = Math.floor(h), mn = Math.floor((h - hr) * 6) * 10; return `${((hr + 11) % 12) + 1}:${String(mn).padStart(2, '0')} ${hr < 12 ? 'AM' : 'PM'}`; };
  const draw = () => { showCard(`<div class="kicker">HAMMOCK</div><h2>How long a nap?</h2>
      <div class="steppers"><div><button id="npMinus" class="ghost">−</button> <b style="font-size:22px">${n} ${n === 1 ? 'hour' : 'hours'}</b> <button id="npPlus" class="ghost">+</button></div></div>
      <p style="text-align:center;margin-top:8px">You will wake up at <b>${clock(hour() + n)}</b>.</p><button id="npGo">Nap</button>`, 'Not now');
    $('npMinus').onclick = () => { n = Math.max(1, n - 1); sfx('click'); draw(); }; $('npPlus').onclick = () => { n = Math.min(max, n + 1); sfx('click'); draw(); };
    $('npGo').onclick = () => { hideCard(); hammockGame(o, n); }; };
  draw(); }
// the hammock: lie back and rock yourself to sleep. Gentle, steady rocking makes you sleepy. Rock too hard and you are wide awake again
let ham3 = null;
function hammockGame(o, hours) { if (ham3 || cine) return; target = null; pending = null;
  const m = o.userData && o.userData.b ? o : o.parent, b = m.userData.b, V = (x, y, z) => new THREE.Vector3(x, y, z), Q = new THREE.Quaternion();
  const piv = new THREE.Group(); piv.position.set(0, 1.02, 0); m.add(piv); [...m.children].forEach(c => { if (c !== piv && c.isMesh && Math.abs(c.position.x) < .05) { c.position.y -= 1.02; piv.add(c); } }); // the cloth swings, the ropes stay tied
  m.updateMatrixWorld(true); const pw = piv.getWorldPosition(V(0, 0, 0)), axis = V(1, 0, 0).applyQuaternion(m.quaternion).normalize(), perp = V(0, 0, 1).applyQuaternion(m.quaternion).normalize();
  const ry0 = player.rotation.y, base = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, (b.a || 0) - Math.PI / 2, 0, 'YXZ'));
  sitting = m; cine = { hold:true }; document.body.classList.add('in-cine');
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="hmMsg">Tap Rock to sway the hammock.<br>Keep it gentle and steady to drift off.</p><div class="fhmeter"><b id="hmZ" style="width:0%;background:#9fc7e8"></b></div><div class="fhbtns"><button id="hmRock">Rock</button><button id="hmUp" class="ghost">Get up</button></div>`; document.body.appendChild(hud);
  const msg = t => { const e = $('hmMsg'); if (e) e.innerHTML = t; };
  let th = 0, w = 0, zz = 0, state = 'rock', last = performance.now(), raf, warn = 0, sleepT = 0;
  const place = () => { piv.rotation.x = th; Q.setFromAxisAngle(axis, th); player.quaternion.copy(Q).multiply(base); const c = V(0, -.17, 0).applyAxisAngle(axis, th).add(pw); player.position.copy(c).addScaledVector(axis, -.62); };
  const end = (napped) => { cancelAnimationFrame(raf); hud.remove(); ham3 = null; drawBuilds(); player.rotation.set(0, ry0, 0); const px = pw.clone().addScaledVector(perp, .9); player.position.set(px.x, 0, px.z); sitting = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); if (!napped) save(); };
  const press = () => { if (state !== 'rock') return; w += (w >= 0 ? 1 : -1) * .55; sfx('swish'); };
  $('hmRock').addEventListener('pointerdown', e => { e.preventDefault(); press(); }); $('hmUp').onclick = () => end(false);
  const step = dt => {
    if (state === 'rock') { w += (-4.4 * Math.sin(th) - .35 * w) * dt; th += w * dt; if (Math.abs(th) > .7) { th = Math.sign(th) * .7; w *= -.3; } const A = Math.sqrt(th * th + w * w / 4.4);
      if (A > .42) { zz = Math.max(0, zz - dt * .25); if ((warn -= dt) <= 0) { warn = 2; msg('<b>Too wild!</b> You are wide awake now. Rock it gently.'); } }
      else if (A > .1) { zz = Math.min(1, zz + dt * .11); if (warn <= 0 || A <= .42) msg(zz < .35 ? 'Gentle and steady...' : zz < .7 ? 'Your eyes feel heavy...' : 'Almost asleep...'); warn = 0; }
      else msg('Tap Rock to sway the hammock.<br>Keep it gentle and steady to drift off.');
      $('hmZ').style.width = (zz * 100).toFixed(0) + '%';
      if (zz >= 1) { state = 'sleep'; sleepT = 0; $('hmRock').style.display = 'none'; $('hmUp').style.display = 'none'; msg('<b>Zzz...</b><br>In a 2019 study in Switzerland, adults in gently rocking beds fell asleep faster and slept more deeply.'); sfx('heart'); } }
    else if (state === 'sleep') { w += (-4.4 * Math.sin(th) - .25 * w) * dt; th += w * dt; sleepT += dt;
      if (sleepT > 3.2 && state === 'sleep') { state = 'out'; (async () => { await fadeTo(true, true); await wait(700); S.t = Math.min((23 - 6) / 18, S.t + hours / 18); S.napped = true; did('nap'); save(); drawHud(); end(true); await wait(400); fadeTo(false); toast(dream()); })(); } }
    place(); const ty = pw.clone().addScaledVector(perp, 3.6).setY(pw.y + 2.6); camera.position.lerp(ty, 1 - Math.pow(.02, dt)); camera.lookAt(pw.x, pw.y - .35, pw.z); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); if (ham3) raf = requestAnimationFrame(loop); };
  place(); ham3 = { press, end, step, get state() { return { state, zz, th, A:Math.sqrt(th * th + w * w / 4.4) }; } }; loop(); }
function usePiece(o) {
  const b = o.userData.b, p = PIECES.find(x => x.id === b.p);
  if (b.p === 'path' || b.p === 'bpath') return toast(TAP_FACTS.path);
  if (b.p === 'hammock') return napMenu(o);
  if (b.p === 'bench') return benchGame(o, new THREE.Vector3(b.x, 0, b.z), (b.r || 0) * Math.PI/2);
  if (b.p === 'lamp' || b.p === 'blamp' || b.p === 'glamp' || b.p === 'flantern') { b.off = !b.off; drawBuilds(); save(); sfx('click'); toast(b.off ? 'Lamp off.' : 'Lamp on. It glows at night.'); return; }
  if (b.p === 'planter' || b.p === 'potplant') return pickSeeds(`pl${b.x},${b.z}`);
  if (b.p === 'hedge') { if (!canCarry('fiber')) return bagFull(); if (!daily(`hg${b.x},${b.z}`)) { toast('You already trimmed this hedge today.'); return; }
    gain('fiber', 1, o.position.clone(), true); sfx('swish'); toast(`+1 grass. ${TAP_FACTS.hedge}`); return; }
  if (['fence','wallw','walls','bwall'].includes(b.p)) { b.c = PAINTS[(b.c == null ? 0 : PAINTS.indexOf(b.c)) + 1 === PAINTS.length ? 0 : (b.c == null ? 1 : PAINTS.indexOf(b.c) + 1)]; drawBuilds(); save(); sfx('click'); toast(`You painted the ${p.name.toLowerCase()}. Tap again for another color.`); return; }
  if (b.p === 'deck') { danceT = 2.4; player.position.set(b.x, 0, b.z); [523,659,784,659].forEach((f,i) => setTimeout(() => chime(f), i*280)); toast('You dance on the floor!'); return; }
  if (b.p === 'arch') return factCard('YOUR ISLAND', 'The arch', TAP_FACTS.arch, 'arch');
  if (b.p === 'statue') return factCard('YOUR ISLAND', 'Statue of Pip', TAP_FACTS.statue, 'statue');
  toast(`Your ${p.name.toLowerCase()}.`);
}
// every chest you build shares one storage, so your things are in any chest you open
function spaceMeter(used, cap, label) { const pct = Math.min(100, Math.round(used / Math.max(1, cap) * 100));
  return `<div class="space"><span>${label}: ${used} of ${cap} slots</span><i><b style="width:${pct}%;background:${used >= cap ? '#ff8fa3' : '#8fdc8a'}"></b></i></div>`; }
function openChest(chest) {
  S.chest = S.chest || {}; sfx('chest');
  const tile = (k, n, where) => `<button class="itile" data-${where}="${k}"><span class="ic">${icon(k, ITEMS[k]?.kind)}</span><b>${n}</b><small>${ITEMS[k].name}</small></button>`;
  const bag = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && ITEMS[k].kind !== 'quest'), box = Object.entries(S.chest).filter(([,n]) => n > 0);
  const canBand = chest && !chest.band && bronzeOn();
  showCard(`<div class="kicker">STORAGE CHEST</div><h2>Put things away</h2><p>Tap something in your bag to put it in storage. Tap something in storage to take it back. All your chests share the same space, and each chest adds more room.</p>
    ${spaceMeter(slotsIn(S.chest), storeCap(), 'Storage')}
    ${box.length ? `<div class="igrid">${box.map(([k,n]) => tile(k, n, 'out')).join('')}</div>` : '<p>Empty.</p>'}
    ${spaceMeter(slotsIn(S.bag), packCap(), 'Backpack')}
    ${bag.length ? `<div class="igrid">${bag.map(([k,n]) => tile(k, n, 'in')).join('')}</div>` : '<p>Empty.</p>'}
    <div style="margin-top:10px"><button id="chMat" class="ghost">Put away all materials</button> <button id="chAll" class="ghost">Take everything</button></div>
    ${canBand ? `<h4>Upgrade this chest</h4><p>Add bronze bands to make this chest hold twice as much (24 more slots). </p>${needList({ bronze:2 })}<button id="chBand"${enough({ bronze:2 }) ? '' : ' disabled style="opacity:.45"'}>Add bronze bands</button>` : chest?.band ? '<p style="margin-top:8px">This chest has bronze bands: it holds 48 slots.</p>' : ''}`);
  let short = false;
  const move = (k, into) => { const from = into ? S.bag : S.chest, to = into ? S.chest : S.bag, n = from[k] || 0; if (!n) return;
    const fit = roomFor(to, into ? storeCap() : packCap(), k, n); if (fit < n) short = true; if (!fit) return;
    to[k] = (to[k] || 0) + fit; from[k] -= fit; if (from[k] <= 0) delete from[k]; };
  const done = () => { sfx('click'); save(); drawHud(); openChest(chest); if (short) toast('Not enough room for all of it. Build another chest or get a bigger bag.'); };
  document.querySelectorAll('[data-in]').forEach(b => b.onclick = () => { move(b.dataset.in, true); done(); });
  document.querySelectorAll('[data-out]').forEach(b => b.onclick = () => { move(b.dataset.out, false); done(); });
  $('chMat').onclick = () => { Object.keys(S.bag).filter(k => ITEMS[k]?.kind === 'material').forEach(k => move(k, true)); done(); };
  $('chAll').onclick = () => { Object.keys(S.chest).forEach(k => move(k, false)); done(); };
  if ($('chBand')) $('chBand').onclick = () => { if (!enough({ bronze:2 })) { toast(`Not enough yet: ${needText({ bronze:2 })}.`); return; }
    bagAdd('bronze', -2); chest.band = true; drawBuilds(); save(); drawHud(); sfx('ting'); toast('Bronze bands added.'); openChest(chest); };
}
function drawBuilds() {
  buildGroup.clear(); lampLights.length = 0; lanternFF.length = 0;
  (S.builds || []).filter(b => LIMITS_ON || b.p !== 'chest').forEach(b => { const m = pieceModel(b.p, b); m.position.set(b.x, 0, b.z); m.rotation.y = b.len ? b.a : (b.r || 0) * Math.PI/2; buildGroup.add(m);
    if (!m.userData.kind) m.userData = { kind:'piece', b }; else m.userData.b = b;
    if (b.p === 'chest' && b.band) [-.2,.2].forEach(z => m.add(mesh(new THREE.BoxGeometry(.84,.06,.05), mat(0xd9a441, { metalness:.55, roughness:.4 }), 0, .3, z*1.35)));
    if (b.c) m.traverse(o => { if (o.isMesh && o.material?.color && !o.material.isMeshBasicMaterial) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(b.c), .7); } });
    if (b.off) m.traverse(o => { if (lampLights.includes(o)) { o.visible = false; lampLights.splice(lampLights.indexOf(o), 1); } else if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.visible !== false) { o.material = o.material.clone(); o.material.color.set(0x8a8290); } }); });
  if (typeof tameOutlines === 'function' && outline) tameOutlines();
}
// places you can't build over, so the important things stay reachable
function blockedAt(x, z) {
  if (!onLand(x, z)) return 'That is too close to the edge.';
  // where things stand on the home island now (kept in step with the layout)
  const at = (o, r) => [o.position.x, o.position.z, r];
  const circles = [[-4,-3,2], at(crate, .9), at(sign, 1), at(mailbox, .7), at(workbench, .8), at(campfire, .9), at(sundial, 1), at(kiln, 1), at(furnace, .9), [.1,-4.7,.9],[-1,-6,1.7],[1.9,-5.2,.9],[-1.7,-3.8,.7],
    ...nodes.filter(n => n.parent === scene && Math.hypot(n.position.x, n.position.z) < 9).map(n => at(n, .8)), [8.4,1.2,1.2],[4.9,-7.4,1.5],[-7.2,-3.8,1],[5.3,2.6,1],[-2.75,3,.9],[-5.1,-1.25,.7],[-2.9,-1.25,.7],[-2,-2.55,.7],[5.3,1.25,.7],
    ...woodTrees.filter(t => t.parent === scene).map(t => [t.position.x, t.position.z, 1]), ...rocks.map(r => [r.position.x, r.position.z, .7]), ...bushes.filter(b => b.parent && b.parent.parent === scene).map(b => [b.position.x, b.position.z, .7])];
  if (circles.some(([cx,cz,r]) => Math.hypot(x-cx, z-cz) < r)) return 'That spot is taken by something important.';
  if (x > .2 && x < 4.8 && z > -2 && z < (S.bigGarden ? 3.9 : 2.6)) return 'That is your garden.';
  return null;
}
let buildMode = false, buildSel = 'path', buildRot = 0, removing = false, moving = false, held = null;
const ghost = new THREE.Mesh(new THREE.PlaneGeometry(.96,.96), new THREE.MeshBasicMaterial({ color:0x8fdc8a, transparent:true, opacity:.45, depthWrite:false })); ghost.rotation.x = -Math.PI/2; ghost.visible = false; scene.add(ghost);
const gridLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color:0xffffff, transparent:true, opacity:.22 })); gridLines.visible = false; scene.add(gridLines);
function drawGrid() { const pts = [], seg = (x0, z0, x1, z1) => { if (onLand(x0, z0, .2) && onLand(x1, z1, .2)) pts.push(x0, .015, z0, x1, .015, z1); };
  for (let i = -20; i <= 20; i++) for (let j = -20; j < 20; j++) { seg(i, j, i, j + 1); seg(j, i, j + 1, i); }
  gridLines.geometry.dispose(); gridLines.geometry = new THREE.BufferGeometry(); gridLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); }
const BUILD_GROUPS = [['ground','Ground'],['walls','Walls'],['lights','Lights and seats'],['garden','Garden']]; let buildGrp = 'ground';
function drawBuildBar() {
  const bar = $('buildbar');
  bar.innerHTML = `<p class="bhelp">${held ? `Holding your ${PIECES.find(x => x.id === held.p).name.toLowerCase()}. Tap an empty square to set it down. Rotate turns it.` : moving ? 'Tap a piece you built to pick it up and move it.' : removing ? 'Tap a piece to remove it. You get its materials back.' : 'Pick a piece, then tap a square on the grid to place it.'} ${icon('log')} ${have('log')} ${icon('stone')} ${have('stone')} ${icon('fiber')} ${have('fiber')}</p>
    <div class="bcats">${BUILD_GROUPS.map(([k, n]) => `<button data-bg="${k}" class="${buildGrp === k ? 'on' : ''}">${n}</button>`).join('')}</div>
    <div class="bpieces">${PIECES.filter(p => p.grp === buildGrp && (p.id !== 'hammock' || hammockOpen()) && (!p.founder || (S.founder && fGot('lantern') && !(S.builds || []).some(b => b.p === p.id))) && (!p.age || S.stations[p.age]) && (p.id !== 'chest' || (LIMITS_ON && featureOn('chest')))).map(p => { const ok = enough(p.cost); return `<button data-pc="${p.id}" class="${buildSel === p.id && !removing ? 'on' : ''}" ${ok ? '' : 'style="opacity:.45"'}>${p.name}<small>${Object.entries(p.cost).map(([k,n]) => `${n} ${ITEMS[k].name.toLowerCase().replace('grass fiber','grass')}`).join(', ')}</small></button>`; }).join('')}</div>
    ${hammockOpen() || buildGrp !== 'lights' ? '' : '<p class="bhelp" style="font-weight:500;margin-top:6px">🔒 Hammock: Nana knows how to make 1. Talk to her.</p>'}
    <div class="bctl"><button id="bRot">Rotate</button><button id="bMove" class="${moving ? 'on' : ''}">Move</button><button id="bRem" class="${removing ? 'on' : ''}">Remove</button><button id="bTidy">Tidy up</button><button id="bDone" class="done">Done</button></div>`;
  bar.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { dropHeld(); buildSel = b.dataset.pc; removing = moving = false; drawBuildBar(); });
  bar.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { buildGrp = b.dataset.bg; drawBuildBar(); });
  ghostPiece();
  $('bRot').onclick = () => { if (held) { held.r = ((held.r || 0) + 1) % 4; ghostPiece(); toast('Turned the piece you are holding.'); return; }
    buildRot = (buildRot + 1) % 4; ghostPiece(); toast('Turned. Pieces you place now face the new way.'); };
  $('bMove').onclick = () => { dropHeld(); moving = !moving; removing = false; drawBuildBar(); };
  $('bRem').onclick = () => { dropHeld(); removing = !removing; moving = false; drawBuildBar(); };
  $('bTidy').onclick = () => { let got = 0, left = 0;
    for (let i = S.pickups.length - 1; i >= 0; i--) { const p = S.pickups[i]; if (canCarry(p.t)) { bagAdd(p.t); S.pickups.splice(i, 1); got++; } else left++; }
    drawPickups(); save(); drawHud(); drawBuildBar(); sfx(got ? 'pick' : 'click');
    toast(got ? `Tidied up! ${got} sticks, stones, and grass went into your bag.${left ? ' Your bag is too full for the rest.' : ''}` : left ? 'Your bag is too full to tidy up.' : 'Nothing to tidy. Your island is neat!'); };
  $('bDone').onclick = () => setBuildMode(false);
}
// put a held piece back where it came from (when you switch tools or finish)
function dropHeld() { if (!held) return; held.x = held.from.x; held.z = held.from.z; delete held.from; S.builds.push(held); held = null; drawBuilds(); save(); }
// a see-through copy of the piece you are holding, shown on the ghost square
let ghostModel = null;
function ghostPiece() { if (ghostModel) { ghost.remove(ghostModel); ghostModel = null; } const gp = held ? held.p : buildMode && !moving && !removing && buildSel !== 'hammock' && PIECES.some(x => x.id === buildSel) ? buildSel : null; if (!gp) return; // nothing held: show the piece you picked, so Rotate visibly turns it
  ghostModel = pieceModel(gp); ghostModel.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .6; } });
  ghostModel.rotation.set(Math.PI/2, 0, 0); ghostModel.rotateY((held ? held.r || 0 : buildRot) * Math.PI/2); ghost.add(ghostModel); }
function setBuildMode(on) {
  if (!on) dropHeld();
  if (on && ((S.home || 0) < 3 || S.where !== 'home' || VISIT)) { toast((S.home || 0) < 3 ? 'Finish building your hut first.' : 'You can only build on your home island.'); return; }
  buildMode = on; removing = moving = false; ghostPiece(); gridLines.visible = on; if (on) drawGrid(); ghost.visible = false; document.body.classList.toggle('building', on);
  if (on) { closeDialog(); drawBuildBar(); if (player.position.distanceTo(new THREE.Vector3(0,0,0)) > 10) { player.position.set(0,0,2); } }
  drawHud();
}
function cellAt(e) {
  ptr.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1); ray.setFromCamera(ptr, camera);
  const h = ray.intersectObjects([HOME.top, ...ownedLobes().map(L => L.top)], false)[0]; if (!h) return null;
  return { x: Math.floor(h.point.x) + .5, z: Math.floor(h.point.z) + .5 };
}
function buildTap(e) {
  const c = cellAt(e); if (!c) return;
  let idx = S.builds.findIndex(b => b.x === c.x && b.z === c.z);
  if (idx < 0) idx = S.builds.findIndex(b => b.len && Math.hypot(b.x - c.x, b.z - c.z) < 1.3); // a hammock hangs between squares
  if (moving && !held && idx >= 0 && S.builds[idx].len) { toast('A hammock is tied to its trees. Use Remove, then hang it somewhere else.'); return; }
  if (!moving && !removing && buildSel === 'hammock') { // it hangs between 2 trees that stand close together
    const p = PIECES.find(x => x.id === 'hammock'), wp = t => t.getWorldPosition(new THREE.Vector3()), ts = trees.filter(t => { let v = true; for (let a = t; a; a = a.parent) if (!a.visible) v = false; return v && Math.abs(wp(t).y) < .3; }).map(wp); let best = null;
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const len = Math.hypot(ts[i].x - ts[j].x, ts[i].z - ts[j].z), mx = (ts[i].x + ts[j].x) / 2, mz = (ts[i].z + ts[j].z) / 2, d = Math.hypot(mx - c.x, mz - c.z);
      if (len >= 1.8 && len <= 4.6 && d < 2.2 && (!best || d < best.d)) best = { d, len, x:mx, z:mz, a:-Math.atan2(ts[j].z - ts[i].z, ts[j].x - ts[i].x) }; }
    if (!best) { toast('A hammock hangs between 2 trees. Tap the ground between 2 trees that stand close together.'); return; }
    if (S.builds.some(b => b.len && Math.hypot(b.x - best.x, b.z - best.z) < .5)) { toast('A hammock already hangs between these trees.'); return; }
    if (!enough(p.cost)) { toast('A hammock needs 8 grass. Cut bushes to get grass.'); return; }
    Object.entries(p.cost).forEach(([k, n]) => bagAdd(k, -n)); S.builds.push({ p:'hammock', x:best.x, z:best.z, a:best.a, len:best.len }); lean('maker');
    sfx('swish'); burst(new THREE.Vector3(best.x, 1, best.z), 0xffc857, 10); drawBuilds(); save(); drawBuildBar(); drawHud(); return; }
  if (moving) {
    if (!held) { if (idx < 0) { toast('Tap a piece you built to pick it up.'); return; }
      held = S.builds.splice(idx, 1)[0]; held.from = { x:held.x, z:held.z }; sfx('click'); drawBuilds(); drawBuildBar(); return; }
    const why = blockedAt(c.x, c.z); if (why) { toast(why); return; }
    if (idx >= 0) { toast('Something is already built there. Pick an empty square.'); return; }
    const p = PIECES.find(x => x.id === held.p); delete held.from; held.x = c.x; held.z = c.z; S.builds.push(held); held = null;
    sfx(p.cost.stone || p.cost.brick ? 'stone' : p.cost.bronze ? 'ting' : p.cost.log ? 'chop' : 'swish'); burst(new THREE.Vector3(c.x, 0, c.z), 0xffc857, 8); drawBuilds(); save(); drawBuildBar(); return;
  }
  if (removing) {
    if (idx < 0) { toast('Nothing built there.'); return; }
    const b = S.builds.splice(idx, 1)[0], p = PIECES.find(x => x.id === b.p); Object.entries(p.cost).forEach(([k,n]) => bagAdd(k, n));
    sfx('dig'); burst(new THREE.Vector3(c.x, 0, c.z), 0xc98f58, 10); drawBuilds(); save(); drawBuildBar(); drawHud(); return;
  }
  const why = blockedAt(c.x, c.z); if (why) { toast(why); return; }
  if (idx >= 0) { toast('Something is already built there. Use Remove first.'); return; }
  const p = PIECES.find(x => x.id === buildSel);
  if (p.founder && (!S.founder || S.builds.some(b => b.p === p.id))) { toast('You already placed your Founder\'s Lantern. Use Move to put it somewhere else.'); return; }
  if (!enough(p.cost)) { toast(`Not enough for a ${p.name.toLowerCase()}. It needs ${Object.entries(p.cost).map(([k,n]) => `${n} ${ITEMS[k].name.toLowerCase().replace('grass fiber','grass')}`).join(', ')}.`); return; }
  Object.entries(p.cost).forEach(([k,n]) => bagAdd(k, -n)); S.builds.push({ p:p.id, x:c.x, z:c.z, r:buildRot }); lean('maker');
  sfx(p.cost.stone || p.cost.brick ? 'stone' : p.cost.bronze ? 'ting' : p.cost.log ? 'chop' : 'swish'); burst(new THREE.Vector3(c.x, 0, c.z), 0xffc857, 10); drawBuilds(); save(); drawBuildBar(); drawHud();
  if (p.id === 'path' && !S.aha.includes('roads')) showAha('roads');
}
renderer.domElement.addEventListener('pointermove', e => {
  if (!buildMode) return; const c = cellAt(e); if (!c) { ghost.visible = false; return; }
  ghost.visible = true; ghost.position.set(c.x, .03, c.z);
  const bad = !removing && !(moving && !held) && (blockedAt(c.x, c.z) || S.builds.some(b => b.x === c.x && b.z === c.z));
  ghost.material.color.set(removing || (moving && !held) ? 0xffc857 : bad ? 0xff5a5a : 0x8fdc8a);
});
// what a tap means: of everything under the finger, the thing whose middle is closest to it wins.
// Without this, a big tree, the hut, or your companion in front would catch taps meant for something smaller.
const tapBox = new THREE.Box3(), tapC = new THREE.Vector3();
function tapTarget(sx, sy) { ptr.set(sx/innerWidth*2-1, -(sy/innerHeight)*2+1); ray.setFromCamera(ptr, camera);
  const seen = new Set(), cands = [];
  for (const h of ray.intersectObjects([...clickables, ...lateClicks, ...digGroups], true)) {
    let vis = true, top = h.object; for (let a = h.object; a; a = a.parent) { if (!a.visible) { vis = false; break; } top = a; } if (!vis || top !== scene) continue; // hidden or not placed yet
    let o = h.object; while (o && !o.userData.kind) o = o.parent; if (!o || seen.has(o)) continue; seen.add(o);
    if ((o.userData.kind === 'sign' && S.bridge) || (o.userData.kind === 'sign2' && S.bridge2)) continue; // a fixed bridge's sign lets taps through
    tapBox.setFromObject(o); tapBox.getCenter(tapC); tapC.y = Math.min(tapC.y, tapBox.min.y + 1); tapC.project(camera);
    const px = Math.hypot((tapC.x - ptr.x) * innerWidth / 2, (tapC.y - ptr.y) * innerHeight / 2);
    cands.push({ o, score:px + h.distance * 2 + (o.userData.kind === 'pet' ? 60 : 0) }); if (cands.length >= 6) break; }
  cands.sort((a, b) => a.score - b.score); return cands.length ? cands[0].o : null; }
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
// phones: holding on the game must never bring up the text magnifier, selection, or zoom (the game reads pointer events, so taps still work)
renderer.domElement.addEventListener('touchstart', e => e.preventDefault(), { passive:false });
['gesturestart', 'dblclick', 'selectstart'].forEach(ev => document.addEventListener(ev, e => { if (!e.target.closest || !e.target.closest('input,textarea,select')) e.preventDefault(); }, { passive:false })); // a long press is for flying, not a menu
renderer.domElement.addEventListener('pointerdown', e => {
  if (fish3) { fish3.press(true, e); return; }
  if (swing3) { swing3.press(); return; }
  if (skip3) { skip3.press(); return; }
  if (dand3) { dand3.press(); return; }
  if (tree3) { tree3.press(e); return; }
  if (bush3) { bush3.press(e); return; }
  if (bench3) { bench3.press(e); return; }
  if (ham3) { ham3.press(); return; }
  if (canFly()) { flight.down = true; flight.at = performance.now(); flight.x = e.clientX; flight.y = e.clientY; }
  if (cine) return;
  if ($('title').style.display !== 'none' || $('veil').classList.contains('show')) return;
  if (buildMode) return buildTap(e);
  closeDialog();
  const o = tapTarget(e.clientX, e.clientY);
  if (o) { const wp = new THREE.Vector3(); o.getWorldPosition(wp); if (o === house || o === buildSite) wp.z += 2.6; target = wp; pending = o; return; /* the hut: stop at the door, not inside the walls */ }
  const g = ray.intersectObjects(walkables, false)[0];
  if (g) { target = g.point.clone(); pending = null; markTap(g.point); }
});
function goHome() { location.href = location.pathname; }
async function visitAction(kind, item) {
  try { const r = await fetch(`${CLOUD}/gift`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ key:mine.syncKey, code:VISIT_CODE, kind, item }) });
    if (r.status === 409) return 'already';
    return r.ok ? 'ok' : 'error';
  } catch { return 'error'; }
}
async function visitWater() {
  const res = await visitAction('water');
  if (res === 'ok') { S.tiles.forEach((t, i) => { if (t.s >= 1) { t.w = true; drawTile(i); } }); sfx('water'); burst(tileGroups[0].position, 0x9fd3ff, 20); toast(`You watered ${VISIT.name}'s garden! They will see it next time they play.`); }
  else toast(res === 'already' ? `You already watered ${VISIT.name}'s garden today.` : 'Could not reach the cloud. Try again.');
}
function visitGift() {
  const opts = Object.entries(mine.bag || {}).filter(([k,n]) => n > 0 && ITEMS[k] && ['crop','fruit','fish','dish','specialty','heirloom'].includes(ITEMS[k].kind));
  if (!opts.length) { toast('Your bag is empty. Bring crops, fruit, fish, or dishes next time.'); return; }
  showCard(`<div class="kicker">LEAVE A GIFT</div><h2>A gift for ${VISIT.name}</h2><p>Pick 1 thing from your bag. They get it next time they play.</p><div class="jlist">${opts.map(([k,n]) => `<button data-vg="${k}">${ITEMS[k].name} x${n}</button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-vg]').forEach(b => b.onclick = async () => { const k = b.dataset.vg; hideCard();
    const res = await visitAction('gift', k);
    if (res === 'ok') { mine.bag[k]--; if (mine.bag[k] <= 0) delete mine.bag[k]; saveMine(); sfx('heart'); burst(ownerNpc.position, 0xff8fa3, 20); toast(`You left ${VISIT.name} a ${ITEMS[k].name}!`); }
    else toast(res === 'already' ? `You already left ${VISIT.name} a gift today.` : 'Could not reach the cloud. Try again.'); });
}
function arrive(o) {
  if (window.__sgArrive) return window.__sgArrive(o); // tests watch arrivals without using the thing
  const k = o.userData.kind; noteTapped(o);
  if (VISIT) {
    if (k === 'deco' && o.userData.market && featureOn('market')) return openMarket();
    if (k === 'owner') return openDialog(VISIT.name, `Welcome to my island! Thanks for visiting.`, [{ label:'Leave a gift', fn:() => { closeDialog(); visitGift(); } }, { label:'Water their garden', fn:() => { closeDialog(); visitWater(); } }, { label:'Go home', fn:goHome }], null, 'none');
    if (k === 'tile') return S.tiles[o.userData.i].s === 2 ? visitWater() : toast(`This is ${VISIT.name}'s garden.`);
    if (k === 'house') return enterHut();
    if (k === 'door') return exitHut();
    if (k === 'roomdoor') return exitRoom();
    if (k === 'spot' || k === 'shelf') return toast(`${VISIT.name} decorated this.`);
    if (k === 'mailbox') return goHome();
    return toast(`This is ${VISIT.name}'s island. Look around!`);
  }
  if (k === 'mailbox') return openMailbox();
  if (k === 'pickup') return usePickup(o.userData.i);
  if (k === 'tree') return chopTree(o);
  if (k === 'rock') return mineRock(o);
  if (k === 'bush') return cutBush(o);
  if (k === 'workbench') return useWorkbench();
  if (k === 'chest') return openChest(o.userData.b);
  if (k === 'visitor') return talkPerson(o.userData.vid);
  if (k === 'pet') return petPet();
  if (k === 'deco') return o.userData.use(o);
  if (k === 'piece') return usePiece(o);
  if ((k === 'claypit' || k === 'sandpit' || k === 'ore') && o.visible) return gatherNode(o);
  if (k === 'kiln') return useKiln();
  if (k === 'furnace') return useFurnace();
  if (k === 'buildsite') return useBuildSite();
  if (k === 'campfire') return useCampfire();
  if (k === 'tile') useTile(o.userData.i);
  else if (k === 'crate') useCrate();
  else if (k === 'npc') { talk(o.userData.id); o.lookAt(player.position.x, o.position.y, player.position.z); }
  else if (k === 'sign') useSign();
  else if (k === 'sign2') useSign2();
  else if (k === 'windmill') useWindmill();
  else if (k === 'stakes') useStakes();
  else if (k === 'boulder') useBoulder();
  else if (k === 'easel') useEasel();
  else if (k === 'darkroom') useDarkroom();
  else if (k === 'crystals') useCrystals();
  else if (k === 'greatbell') useGreatBell();
  else if (k === 'bellframe') useFrame();
  else if (k === 'ship2') useShip2();
  else if (k === 'site') useSite(o.userData.i);
  else if (k === 'bplan') (S.built || []).includes(BUILDINGS[o.userData.i].id) ? upgradeMenu(o.userData.i) : useSite(o.userData.i);
  else if (k === 'house') useHouse();
  else if (k === 'dig') dig(o.userData.i);
  else if (k === 'sundial') useSundial();
  else if (k === 'ship') useShip();
  else if (k === 'pot') usePot();
  else if (k === 'dock') fishing3D(o);
  else if (k === 'fruitTree') useFruitTree(o);
  else if (k === 'bed') openDialog('Your Bed', 'Go to sleep and start a new day? Watered crops will grow.', [{ label:'Sleep', fn:() => { closeDialog(); goSleep('bed'); } }]);
  else if (k === 'door') exitHut();
  else if (k === 'roomdoor') exitRoom();
  else if (k === 'home') enterRoom(o.userData.room);
  else if (k === 'shelf') openJournal();
  else if (k === 'spot') useSpot(o.userData.i);
}
const keys = {};
// flying: in a legend's bird form, press and hold to take off and fly toward your finger; let go to glide down. Space works on a keyboard.
var flight = { down:false, at:0, x:0, y:0, on:false, alt:0, told:false };
const canFly = () => { try { return !!S.mythForm && mythOn() && S.where !== 'hut' && !cine && !buildMode && playing && !$('veil').classList.contains('show'); } catch { return false; } };
addEventListener('pointermove', e => { if (flight.down) { flight.x = e.clientX; flight.y = e.clientY; } });
['pointerup','pointercancel'].forEach(ev => addEventListener(ev, () => { flight.down = false; }));
addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
let onPlank = false;
function groundAt(x, y, z) {
  down.set(new THREE.Vector3(x, y + 1.2, z), DOWN); down.far = 3;
  const h = down.intersectObjects(walkables, false)[0];
  onPlank = !!h && bridgePlanks.includes(h.object);
  return h ? h.point.y : null;
}

// ============ LOOP ============
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth/innerHeight; camera.fov = innerWidth < innerHeight ? 55 : 40; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const sky = new THREE.Color(), SKY = [[0,0xffd6c9],[.3,0xbfe3ff],[.62,0xbfe3ff],[.69,0xffd2a6],[.76,0xffab86],[.83,0xe38aa8],[.9,0x5a4b99],[1,0x1f2552]].map(([t,c])=>[t,new THREE.Color(c)]);
function skyAt(t) { for (let i=1;i<SKY.length;i++) if (t <= SKY[i][0]) { const [a,ca]=SKY[i-1],[b,cb]=SKY[i]; return sky.copy(ca).lerp(cb,(t-a)/(b-a)); } return sky.copy(SKY.at(-1)[1]); }
const HUT_BG = new THREE.Color(0x2e2438);
const dome = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{ top:{ value:new THREE.Color() }, bottom:{ value:new THREE.Color() } },
  vertexShader:'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader:'uniform vec3 top; uniform vec3 bottom; varying float vY; void main(){ float k = smoothstep(-.15, .7, vY); gl_FragColor = vec4(mix(bottom, top, k), 1.); }',
}));
dome.renderOrder = -1; scene.add(dome);
const sunGlow = halo(0xfff1c4, 40, 0); scene.add(sunGlow);
const skyTop = new THREE.Color();
const ahead = () => innerHeight > innerWidth * 1.2 ? 2.2 : 0; // on tall phone screens, look further ahead so the top bar hides less
function camOffset() { const f = (typeof flight !== 'undefined' && flight) ? flight.alt : 0; return S.where === 'hut' ? new THREE.Vector3(0, 7.5, 7.8 - ahead()) : new THREE.Vector3(0, 10.5 + f * 1.3, 11 - ahead() + f * 1.2); }
function snapCam() { camera.position.copy(player.position).add(camOffset()); }
const perfCheck = { n:0, sum:0 };
const outline = LOOK === 'a' ? null : new OutlineEffect(renderer, { defaultThickness: LOOK === 'b' ? .0035 : .005, defaultColor: LOOK === 'b' ? [.23,.18,.29] : [.45,.33,.25], defaultAlpha: LOOK === 'b' ? .9 : .7 });
// only solid shaded things get outlines: no glows, sprites, sky, grass blades, or see-through parts
function tameOutlines() { scene.traverse(o => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
  ms.forEach(m => { if (!m.isMeshToonMaterial || m.transparent || o.isInstancedMesh || o.isPoints || o.isSprite) m.userData.outlineParameters = NO_OUTLINE; }); }); }
if (LOOK === 'b') renderer.domElement.style.filter = 'saturate(1.12) contrast(1.04)';
if (LOOK === 'c') { renderer.domElement.style.filter = 'saturate(.88) brightness(1.04) sepia(.08)'; document.body.classList.add('paper'); }
const clock = new THREE.Clock(); let playing = false, hudTick = 0, stepDist = 0, steerSide = 0, steerT = 0, route = null, routeFor = null, stallT = 0, stallD = 1e9, stallN = 0, stallLen = 1e9;
// is this spot inside something solid (whether or not you are standing there)
function solidPt(x, z) { const px = player.position.x, pz = player.position.z; player.position.x = 1e5; player.position.z = 1e5; const r = solidAt(x, z); player.position.x = px; player.position.z = pz; return r; }
// a route to (tx, tz) around buildings, trees and edges: spreads out over the ground in half-steps from where you stand and walks back along the shortest way found
// how close counts as there: right up to a thing you tapped, or the spot itself
const reach = () => pending ? Math.max(1.3, (pending.userData.solid || 0) + .5) : .4;
// is the straight line from you to (tx, tz) open ground all the way (up to where you would stop)
function clearLine(tx, tz) { const sx = player.position.x, sz = player.position.z, len = Math.hypot(tx - sx, tz - sz) - reach(); let y = player.position.y;
  for (let d = .4; d < len; d += .4) { const k = d / (len + reach()), x = sx + (tx - sx) * k, z = sz + (tz - sz) * k; y = groundAt(x, y, z); if (y === null || solidPt(x, z)) return false; } return true; }
function findRoute(tx, tz, stop = .4) { const C = .5, sx = player.position.x, sz = player.position.z, key = (i, j) => i * 1000 + j, from = new Map([[key(0, 0), null]]), open = [[0, 0, player.position.y]];
  let best = [0, 0], bestD = Math.hypot(tx - sx, tz - sz); const startD = bestD;
  for (let n = 0, q = 0; q < open.length && n < 3200; n++, q++) { const [i, j, y] = open[q], x = sx + i * C, z = sz + j * C, d = Math.hypot(tx - x, tz - z); if (d < bestD) { bestD = d; best = [i, j]; if (d < stop) break; }
    for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) { const k = key(i + di, j + dj); if (from.has(k)) continue; from.set(k, 0); const nx = x + di * C, nz = z + dj * C, ny = groundAt(nx, y, nz); if (ny === null || solidPt(nx, nz)) continue;
      if (di && dj && (solidPt(x + di * C, z) || solidPt(x, z + dj * C))) { from.delete(k); continue; } // no cutting a corner between two solid things
      from.set(k, [i, j]); open.push([i + di, j + dj, ny]); } }
  if (bestD > startD - .6) return null; // nowhere closer to go
  const pts = []; for (let c = best; c && (c[0] || c[1]); c = from.get(key(c[0], c[1]))) pts.unshift([sx + c[0] * C, sz + c[1] * C]); return pts.length ? pts : null; }
// flying: which islands are open to a bird, and where the nearest land is
function flyIslands() { return [
  { c:new THREE.Vector3(0, 0, 0), r:9, open:true }, { c:SQ, r:5.8, open:squareOpen() },
  { c:ORCH_POS, r:8, open:!!S.bridge }, { c:WIND_POS, r:8, open:!!S.bridge2 }, { c:NIGHT_POS, r:7, open:S.q4 >= 1 },
  { c:OH, r:10.5, open:S.q5 >= 1 }, { c:LH, r:3.4, open:keeperLevel() >= 2 },
  ...lobes.map((L, i) => ({ c:new THREE.Vector3(L.e.x, 0, L.e.z), r:L.r, open:i < (S.expand || 0) })) ]; }
function flyBlocked(x, z) { if (Math.hypot(x, z) > 90) return true; // don't fly off into nowhere
  return flyIslands().some(I => !I.open && Math.hypot(x - I.c.x, z - I.c.z) < I.r + .6) && !flyIslands().some(I => I.open && Math.hypot(x - I.c.x, z - I.c.z) < I.r - .4); }
function flyLevel(x, z) { let best = null; flyIslands().filter(I => I.open).forEach(I => { const d = Math.hypot(x - I.c.x, z - I.c.z) - I.r; if (!best || d < best.d) best = { d, y:I.c.y }; }); return best ? best.y : 0; }
function nearestLand() { const p = player.position; let best = null;
  flyIslands().filter(I => I.open).forEach(I => { const d = Math.hypot(p.x - I.c.x, p.z - I.c.z); const k = Math.max(0, (d - (I.r - 1.2)) / (d || 1));
    const x = p.x + (I.c.x - p.x) * k, z = p.z + (I.c.z - p.z) * k, dd = Math.hypot(x - p.x, z - p.z); if (!best || dd < best.dd) best = { x, z, dd }; });
  return best || { x:0, z:0 }; }
// the game loop keeps running even if one frame hits an error, so the game never freezes. The first error is reported once.
function tick() { requestAnimationFrame(tick); try { tickFrame(); } catch (e) { if (!tick.err) { tick.err = e; window.__tickErr = String(e && e.stack || e); setTimeout(() => { throw e; }); } } }
// golden hour: 1 at sunset (about 6:25 PM), fading to 0 an hour and a half either side
function goldHour() { return Math.max(0, 1 - Math.abs(hour() - 18.4) / 1.8); }
function tickFrame() {
  const dt = Math.min(.05, clock.getDelta()), now = clock.elapsedTime;
  const menuOpen = $('veil').classList.contains('show') || $('dialog').classList.contains('show');
  if (playing) {
    if (!menuOpen) S.t += dt * (window.__sgSpeed || 1) * (sitting && !swing3 ? 3 : 1) / (DAY_LEN * (S.mode === 'cozy' ? 2 : 1)); // the clock stops while any menu or conversation is open
    { const hr = hour(), w = S.lateWarn && S.lateWarn.day === S.day ? S.lateWarn.n : 0, home3 = (S.home || 0) >= 3; // two gentle warnings before the day ends at midnight
      if (!cine && hr >= 22 && w < 1) { S.lateWarn = { day:S.day, n:1 }; chime(523); toast(`It is 10 PM. ${home3 ? 'Tap your bed' : 'Tap the campfire'} to sleep.`); }
      else if (!cine && hr >= 23.5 && w < 2) { S.lateWarn = { day:S.day, n:2 }; chime(440); toast('It is 11:30 PM. You will fall asleep at midnight.'); } }
    if (S.t >= 1 && !cine) { if (S.room) exitRoom(); goSleep(S.where === 'hut' ? 'bed' : 'outside', true); }
    if ((hudTick += dt) > .5) { hudTick = 0; drawHud(); ambience(); cloudPush(); }
    playMusic(dt);
    setChord(S.t < .3 ? 0 : S.t < .65 ? 1 : S.t < .85 ? 2 : 3);
  }
  const h = hour(), night = Math.min(1, Math.max(0, (h - 19) / 2)), inside = S.where === 'hut';
  // light and sky
  const arc = Math.min(1, Math.max(0, (h-6)/13)) * Math.PI, el = Math.sin(arc);
  const lean = Math.cos(arc) - Math.cos((12-6)/13*Math.PI);
  if (inside) {
    scene.background = HUT_BG; scene.fog.color.copy(HUT_BG); dome.visible = false; sunGlow.visible = false;
    sun.intensity = .5; hemi.intensity = 1.25; hemi.color.setRGB(1, 1, 1); roomLight.intensity = 6;
    roomWin.color.copy(skyAt(S.t)); if (S.room && ROOMS[S.room]) ROOMS[S.room].win.color.copy(roomWin.color);
  } else {
    scene.background = skyAt(S.t); scene.fog.color.copy(scene.background);
    dome.visible = true; dome.position.copy(camera.position);
    dome.material.uniforms.bottom.value.copy(scene.background);
    dome.material.uniforms.top.value.copy(skyTop.copy(scene.background).offsetHSL(.02, .08, -.2));
    sunGlow.visible = el > .02 && night === 0; sunGlow.material.opacity = .55 * Math.min(1, el * 3);
    sunGlow.position.set(camera.position.x + lean*90, camera.position.y + 10 + el*60, camera.position.z - 110);
    const gold = goldHour(), dawn = Math.max(0, 1 - (h - 6) / 3.5); // a fresh, bright early morning
    sun.intensity = .45 + el*1.25 + gold*.45 + dawn*.6; hemi.intensity = .6 + el*.4 - night*.15 + gold*.45 + dawn*1.05; roomLight.intensity = 0;
    hemi.color.setRGB(1, 1 - gold*.14 - dawn*.03, 1 - gold*.36 - dawn*.06);
  }
  { const gold = inside ? 0 : goldHour(); sun.color.setHSL(.08 - gold*.03, .6 + gold*.35, .72 + el*.23 - gold*.05); }
  sun.position.set(lean*14 + player.position.x, player.position.y + 1.5 + el*16, lean*5 + 1.2 + player.position.z);
  sun.target.position.copy(player.position);
  starMat.opacity = inside ? 0 : night * .9;
  const mp = moon().idx; if (mp !== moonDrawn) { moonDrawn = mp; const mc = moonCanvas.getContext('2d'); drawMoon(mc, mp, 128);
    const img = mc.getImageData(0,0,128,128); for (let i=0;i<img.data.length;i+=4) if (img.data[i] < 40 && img.data[i+2] > 40 && img.data[i+2] < 70) img.data[i+3] = 0; mc.putImageData(img,0,0); moonTex.needsUpdate = true; }
  moonSprite.visible = !inside && night > 0; moonSprite.material.opacity = night; moonSprite.position.set(player.position.x - 30, player.position.y + 32, player.position.z - 70);
  winMat.emissiveIntensity = night * 1.4 + (h > 18 ? .3 : 0); lampMat.emissiveIntensity = .15 + winMat.emissiveIntensity;
  lampLights.forEach(l => l.material.opacity = night * .8);
  // movement
  if (cine) { target = null; pending = null; }
  if (sitting && (target || keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright)) sitting = null;
  let mv = cine ? new THREE.Vector3() : new THREE.Vector3((keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0), 0, (keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0));
  if (mv.lengthSq()) { target = null; pending = null; }
  else if (target) {
    if (routeFor !== target) { routeFor = target; route = null; stallT = 0; stallD = 1e9; stallN = 0; stallLen = 1e9; if (!clearLine(target.x, target.z)) { route = findRoute(target.x, target.z, reach()); stallLen = route ? route.length : 1e9; } } // something is in the way: work out the way round before setting off
    mv.subVectors(target, player.position); mv.y = 0; const left = mv.length();
    if (left < (pending ? Math.max(1.3, (pending.userData.solid || 0) + .5) : .1)) { const p = pending; target = null; pending = null; route = null; mv.set(0,0,0); if (p) arrive(p); }
    else { if (route && route.length) { mv.set(route[0][0] - player.position.x, 0, route[0][1] - player.position.z); if (mv.length() < .3) { route.shift(); if (route.length) mv.set(route[0][0] - player.position.x, 0, route[0][1] - player.position.z); else mv.subVectors(target, player.position).setY(0); } }
      if ((stallT += dt) > .9) { // not getting closer: stop pushing against it and work out a way around
        const onRoute = route && route.length, stuck = onRoute ? route.length >= stallLen : left > stallD - .3; // on a route, being held up means the next step of it was not reached
        if (!stuck) stallN = 0; else if (onRoute && ++stallN > 2) { target = null; pending = null; route = null; mv.set(0,0,0); } // tried twice from here and still held up: stop instead of shuffling on the spot
        else { route = findRoute(target.x, target.z, reach()); if (!route) { target = null; pending = null; mv.set(0,0,0); } }
        stallT = 0; stallD = left; stallLen = route ? route.length : 1e9; } }
  } else route = null;
  const inner = player.userData.inner;
  const flyNow = canFly() && ((flight.down && performance.now() - flight.at > 280) || keys[' ']);
  if (flyNow && !flight.on) { flight.on = true; target = null; pending = null; sfx('cast'); }
  // let go over open sky and the bird keeps gliding to the nearest island before it lands
  if (!flyNow && flight.on && groundAt(player.position.x, player.position.y, player.position.z) !== null) flight.on = false;
  if (flight.on) {
    let dir = mv.clone();
    if (!flyNow) { const L = nearestLand(); dir.set(L.x - player.position.x, 0, L.z - player.position.z); } // gliding in to land
    else if (flight.down) { ptr.set(flight.x/innerWidth*2-1, -(flight.y/innerHeight)*2+1); ray.setFromCamera(ptr, camera);
      const hitP = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -player.position.y), hitP)) { dir.subVectors(hitP, player.position); dir.y = 0; if (dir.length() < .4) dir.set(0, 0, 0); } }
    if (dir.lengthSq()) { dir.normalize().multiplyScalar(8.5 * dt);
      // the bird flies freely over open sky, but islands you haven't opened yet stay closed (it slides along their edge)
      let nx = player.position.x + dir.x, nz = player.position.z + dir.z;
      if (flyBlocked(nx, nz)) { if (!flyBlocked(nx, player.position.z)) nz = player.position.z; else if (!flyBlocked(player.position.x, nz)) nx = player.position.x; else { nx = player.position.x; nz = player.position.z; } }
      player.rotation.y = Math.atan2(nx - player.position.x, nz - player.position.z); player.position.x = nx; player.position.z = nz;
      const gy = groundAt(nx, player.position.y + 2, nz); const want = gy !== null ? gy : flyLevel(nx, nz);
      player.position.y += (want - player.position.y) * Math.min(1, dt * 4);
      if (gy !== null) S.pos = [player.position.x, player.position.y, player.position.z]; } // only remember spots on land
    mv.set(0, 0, 0);
  }
  flight.alt += ((flight.on ? 2.4 : 0) - flight.alt) * Math.min(1, dt * (flight.on ? 3 : 2.2));
  if (flight.alt > .02 && inner) { inner.position.y = flight.alt + Math.sin(now * 3) * .12 * Math.min(1, flight.alt); inner.rotation.z = Math.sin(now * 1.6) * .08 * Math.min(1, flight.alt); }
  if (flight.alt > .02 || flight.on) {} else
  if (mv.lengthSq() && !$('veil').classList.contains('show')) {
    mv.normalize().multiplyScalar((S.mode === 'explorer' ? 5.25 : 4.2) * (onPath() ? 1.35 : 1) * dt);
    const nx = player.position.x + mv.x, nz = player.position.z + mv.z;
    let gy = walkY(nx, nz);
    if (gy === null) { const full = mv.clone(); gy = walkY(nx, player.position.z); if (gy !== null) mv.z = 0; else { gy = walkY(player.position.x, nz); if (gy !== null) mv.x = 0; }
      if (gy !== null && mv.length() < full.length() * .4) { mv.copy(full); gy = null; } } // walking straight at something: sliding along one axis would leave you standing still, so steer around it instead
    if (gy === null) { const sides = steerSide ? [steerSide, -steerSide] : [1, -1]; // steer around it, and keep to the same side until you are past (no jittering left and right)
      find: for (const sd of sides) for (const a of [.45, .8, 1.15, 1.5, 1.85, 2.2]) { const r = mv.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a * sd), y = walkY(player.position.x + r.x, player.position.z + r.z); if (y !== null) { mv.copy(r); gy = y; steerSide = sd; steerT = .5; break find; } } }
    else if ((steerT -= dt) <= 0) steerSide = 0;
    if (gy !== null) {
      player.position.x += mv.x; player.position.z += mv.z; player.position.y = gy;
      if ((stepDist += mv.length()) > .6) { stepDist = 0; sfx(onPlank ? 'wood' : 'step'); }
      player.rotation.y = Math.atan2(mv.x, mv.z);
      inner.position.y = Math.abs(Math.sin(now*14))*.12; inner.rotation.z = Math.sin(now*14)*.06;
    inner.userData.arms.forEach((a, i) => a.rotation.x = Math.sin(now*14 + i*Math.PI) * .7);
      S.pos = [player.position.x, player.position.y, player.position.z];
    } else { if (target && !(route && route.length)) { route = findRoute(target.x, target.z, reach()); stallT = 0; } if (!target || !route) { target = null; pending = null; } // boxed in: look for a way round before giving up
      if (groundAt(player.position.x, player.position.y, player.position.z) === null) { const L = nearestLand(); let y = null; for (const h of [player.position.y, 0, -1.5, -3, 1.5, -4.5]) { y = groundAt(L.x, h, L.z); if (y !== null) break; }
        if (y !== null) { player.position.set(L.x, y, L.z); S.pos = [L.x, y, L.z]; } } } // stuck with no ground underfoot: step back onto land
  } else { inner.position.y *= .8; inner.rotation.z *= .8; inner.scale.y = 1 + Math.sin(now*2.5)*.02; }
  if (swingT > 0) { swingT = Math.max(0, swingT - dt); const a = inner.userData.arms[1] || inner.userData.arms[0], p = 1 - swingT/.5;
    a.rotation.x = p < .35 ? -2.6 * (p/.35) : -2.6 + 2.6 * ((p-.35)/.65); }
  pickupGroup.children.forEach((g, i) => { g.position.y = .06 + Math.sin(now*2.4 + i)*.05; g.rotation.y = now*.6 + i; });
  // life
  if (!inside && !lowGfx) swayTufts(now);
  if (playing && !lowGfx && perfCheck.n < 240 && !document.hidden) { perfCheck.n++; perfCheck.sum += dt;
    if (perfCheck.n === 240 && perfCheck.sum / 240 > 1/32) { setLowGfx(true); toast('Switched to low graphics so the game runs smoother.'); } }
  trees.forEach(t => { if (t.userData.shake) { t.userData.shake = Math.max(0, t.userData.shake - dt*2.5); t.rotation.z = Math.sin(now*40) * .06 * t.userData.shake; }
    t.userData.canopy.rotation.z = Math.sin(now*1.2 + t.userData.ph)*.035; t.userData.canopy.rotation.x = Math.cos(now*.9 + t.userData.ph)*.025; });
  if (nanaWalk) { const n = npcs.nana, d = nanaWalk.to.clone().sub(n.position); d.y = 0;
    if (d.length() > .15) { d.normalize().multiplyScalar(Math.min(d.length(), 2.6*dt)); n.position.add(d); n.rotation.y = Math.atan2(d.x, d.z); n.userData.inner.position.y = Math.abs(Math.sin(now*12))*.1; }
    else { n.userData.inner.position.y = 0; const back = nanaWalk.back; nanaWalk = null; if (!back && S.tut === 1) { n.lookAt(player.position.x, 0, player.position.z); talk('nana'); } } }
  Object.values(npcs).forEach((n,i) => { n.userData.inner.scale.y = 1 + Math.sin(now*2+i)*.03;
    const d = n.position.distanceTo(player.position);
    if (d < 4.5 && n !== npcs.twins) { const want = Math.atan2(player.position.x - n.position.x, player.position.z - n.position.z); let df = want - n.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); n.rotation.y += df * Math.min(1, dt*4); } });
  [player, ...Object.values(npcs), moss, fern].forEach(c => { const u = c.userData.inner?.userData; if (!u || !u.eyes) return;
    const k = (now + u.blink) % 4.2; u.eyes.forEach(e => e.scale.y = k < .12 ? .12 : 1);
    if (c !== player) u.arms.forEach((a, i) => a.rotation.x = Math.sin(now*1.6 + i + u.blink) * .12); });
  bubbles.forEach(b => b.position.y = 2.35 + Math.sin(now*2.5 + b.userData.ph)*.06);
  winHalos.forEach(hl => hl.material.opacity = winMat.emissiveIntensity * .45); townHalos.forEach(hl => hl.material.opacity = winMat.emissiveIntensity * .45);
  smoke.forEach((sm, i) => { const k = ((now*.25 + i/5) % 1); { const ch = house.userData.chim; sm.position.set(house.position.x + ch.x + Math.sin(k*6 + i)*.2, ch.y + k*2.2, house.position.z + ch.z); } sm.scale.setScalar(.4 + k*1.1); sm.material.opacity = (1-k) * .35 * (S.where === 'hut' ? 0 : 1); });
  moonHalo.material.opacity = moonSprite.visible ? night * .35 : 0; moonHalo.position.copy(moonSprite.position);
  tileGroups.forEach(g => g.traverse(c => { if (c.userData.bob) c.position.y = c.userData.by + Math.sin(now*3)*.04; if (c.userData.sway) c.rotation.z = Math.sin(now*2 + g.position.x)*.08; }));
  digGroups.forEach(g => g.children.forEach(c => { if (c.userData.spark) { c.rotation.y = now*2; c.position.y = .6 + Math.sin(now*3)*.1; } }));
  if (bell.visible) bellBody.rotation.z = Math.sin(now*1.5)*.08;
  const bflyOn = !inside && h < 18.5 && season() < 3 && !(raining && S.t < .5);
  const bflyN = featureOn('journey') ? Math.max(3, Math.min(9, 6 + Math.floor(((S.karma || {}).harmony || 0) / 2))) : 9;
  butterflies.forEach((b, i) => { b.visible = bflyOn && i < bflyN; if (!b.visible) return; const u = b.userData, t = now*.4 + u.ph;
    b.position.set(u.cx + Math.sin(t)*3 + Math.sin(t*2.3)*.8, u.cy + .8 + Math.sin(t*3.1)*.4, u.cz + Math.cos(t*.8)*3);
    b.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t*.8)); const f = Math.sin(now*18 + i)*1.1; u.l.rotation.z = f; u.r.rotation.z = -f;
    if (u.flee > 0) { u.flee = Math.max(0, u.flee - dt); b.position.y += Math.sin(u.flee / 1.2 * Math.PI) * 1.5; } });
  lobes.forEach(L => { if (!L.rise) return; L.rise = Math.max(0, L.rise - dt / 2.5); const k = 1 - L.rise; L.g.position.y = -5 * (1 - k) * (1 - k); if (!L.rise) { L.g.position.y = 0; L.extra.forEach(o => o.visible = true); burst(new THREE.Vector3(L.e.x, .5, L.e.z), 0x8fdc8a, 30); } });
  if (lighthouse && lighthouse.visible) { const nb = Math.min(1, Math.max(0, (hour() - 18.5) / 1.5)); lighthouse.userData.pivot.rotation.y = now * .8; lighthouse.userData.beam.material.opacity = .04 + nb * .14; }
  animatePools(now); if (tapMark.userData.t < 1) { tapMark.userData.t = Math.min(1, tapMark.userData.t + dt * 1.6); const k = tapMark.userData.t; tapMark.scale.setScalar(.6 + k * 1.2); tapMark.material.opacity = .8 * (1 - k); } animateBugs(now, dt); updatePet(dt, now); mythAnimate(dt, now); squareTick(dt, now); hintTick(dt, now); if (HINT_SKIP) nearTick(dt);
  { const sp = player.position.distanceTo(lastPP) / Math.max(dt, .001); lastPP.copy(player.position); const sc = player.userData.inner?.userData.scarf;
    if (sc) { let seg = sc, i = 0; while (seg && seg.children.length) { const k = Math.min(1, sp / 4); seg.rotation.x = -.15 - k * (.35 + i * .12) + Math.sin(now * (6 + i) + i) * (.06 + k * .12); seg = seg.children.find(c => c.isGroup); i++; } } }
  if (lanternFF.length) { const nf = Math.min(1, Math.max(0, (hour() - 19) / 2)); lanternFF.forEach((f, i) => { f.visible = nf > .2; const a = now * .8 + i * .78; f.position.set(Math.cos(a) * (.55 + Math.sin(now + i) * .15), 1.4 + Math.sin(now * 1.3 + i) * .45, Math.sin(a) * (.55 + Math.cos(now + i) * .15)); f.material.opacity = nf * (.5 + Math.sin(now * 4 + i) * .5); }); }
  pulsers.forEach(h => { h.userData.pulse = Math.max(0, h.userData.pulse - dt); h.scale.setScalar(h.userData.base * (1 + h.userData.pulse)); if (!h.userData.pulse) pulsers.delete(h); });
  if (bell.userData.ring > 0) { bell.userData.ring = Math.max(0, bell.userData.ring - dt); bellBody.rotation.z = Math.sin(now*12) * .35 * bell.userData.ring; }
  balloons.children.forEach(b => { if (b.userData.fly) { b.position.y += dt * 1.6; b.position.x += Math.sin(now*2) * dt * .3; if (b.position.y > 25) b.visible = false; } });
  // sitting: hips on the seat, legs hanging, leaning back a little, hands in the lap
  if (sitting) { inner.position.y = -.16; inner.rotation.x = -.07; inner.userData.arms.forEach(a => a.rotation.x = -.45); } else if (inner.rotation.x) inner.rotation.x *= .8;
  if (holdUp) inner.userData.arms.forEach(a => a.rotation.x = -2.9);
  if (lying) { inner.rotation.x = -Math.PI/2; inner.position.y = .22; inner.rotation.z = 0; } else if (inner.rotation.x) inner.rotation.x = 0;
  if (danceT > 0) { danceT = Math.max(0, danceT - dt); inner.rotation.y = danceT ? danceT * 6 : 0; inner.position.y = Math.abs(Math.sin(now*10)) * .18 * (danceT ? 1 : 0); }
  const ffOn = !inside && night > .3 && season() < 3;
  fireflies.forEach(f => { f.visible = ffOn; if (!ffOn) return; const u = f.userData, t = now*.3 + u.ph;
    f.position.set(u.cx + Math.sin(t)*1.5, u.cy + .6 + Math.sin(t*1.7)*.5, u.cz + Math.cos(t*1.3)*1.5); f.scale.setScalar(.5 + Math.max(0, Math.sin(now*2 + u.ph*3))*1.2); });
  sparks.forEach(s => { if (!s.visible) return; const u = s.userData; u.life -= dt*1.4; u.v.y -= 9*dt; s.position.addScaledVector(u.v, dt); s.scale.setScalar(Math.max(.01, u.life)); if (u.life <= 0) s.visible = false; });
  ripple.scale.setScalar(1 + (now % 2) * .6); ripple.material.opacity = 1 - (now % 2) / 2; ripple.material.transparent = true;
  ship.position.y = ORCH_POS.y + ship.userData.lift * (S.q2 >= 5 ? 1 : 0) + (S.q2 >= 5 ? Math.sin(now*1.3)*.12 : 0);
  lid.visible = S.q2 === 1 && S.potDay >= 0; sail.visible = S.q2 >= 3; saggy.visible = S.q2 < 3;
  lanterns.children.forEach((one, i) => { const l = one.children[1]; if (l) l.position.y = 1.9 + Math.sin(now*1.5 + i)*.05; });
  { const q = S.q5; frameMarker.visible = q < 4; ghostMat.opacity = q === 3 ? .22 + Math.sin(now*3)*.1 : 0; lumberPile.visible = q <= 4; pileGear.visible = q === 4; pileGear.rotation.y = now; framePosts.visible = q >= 4; frameGear.visible = q >= 5; crack.visible = q < 6;
    if (q < 3) { greatBell.position.set(OH.x, OH.y + .6, OH.z + .3); gbSwing.rotation.set(0, 0, 1.35); }
    else if (q < 5) { greatBell.position.set(OH.x, OH.y + .7, OH.z); gbSwing.rotation.set(0, 0, 0); }
    else { greatBell.position.set(OH.x, OH.y + 3.3, OH.z); const r = gbSwing.userData.ring || 0; gbSwing.rotation.set(0, 0, Math.sin(now*3) * .25 * Math.min(1, r)); if (r > 0) gbSwing.userData.ring = r - dt * .5; }
    if (q >= 5) frameGear.rotation.x += dt * (gbSwing.userData.ring > 0 ? 3 : .2); }
  { let tg = questTarget(); if (tg && S.where === 'hut') tg = S.room && ROOMS[S.room] ? ROOMS[S.room].mat : doormat;
    marker.visible = markerRing.visible = !!tg && !cine && !$('veil').classList.contains('show') && !document.body.classList.contains('on-title'); // hidden during rides and film scenes
    if (tg) { const wp = new THREE.Vector3(); tg.getWorldPosition(wp); const k = tg.userData.kind;
      marker.position.set(wp.x, wp.y + (MARK_H[k] || 1.9) + Math.sin(now*3)*.15 + (k === 'greatbell' && S.q5 >= 5 ? 1.5 : 0), wp.z);
      marker.quaternion.copy(camera.quaternion); // always faces you, from any angle
      const ph = (now * .8) % 1; markerRing.position.set(wp.x, wp.y + .04, wp.z); markerRing.scale.setScalar(.8 + ph * .7); markerRing.material.opacity = .65 * (1 - ph); }
    goalArrow(tg && marker.visible && !$('dialog').classList.contains('show') && !document.querySelector('.presents') && !document.body.classList.contains('in-cine')); }
  toyTick(dt, now);
  const wantLit = S.q3 >= 7 && h >= 20; if (wantLit !== lightLit) drawLightBridge(wantLit);
  if (lightLit) lightMat.opacity = .65 + Math.sin(now*2)*.2;
  crystals.children.forEach((c, i) => c.material.emissiveIntensity = .5 + Math.sin(now*1.5 + i)*.3);
  siteGroups.forEach(sg => sg.traverse(o => { if (o.userData.spin) { o.rotation.y = now; o.position.y = 3.9 + Math.sin(now*2)*.15; } }));
  flag.rotation.y = Math.sin(now*3) * .3;
  mflag.rotation.z = S.mailNew ? 0 : -Math.PI/2;
  if (balloons.visible) balloons.children.forEach((b, i) => { if (b.geometry.type === 'SphereGeometry') b.position.y = 2.6 + (i%4)*.15 + Math.sin(now*1.5 + i)*.1; });
  if (kiln.visible && !kiln3) kilnMouth.material.color.setHSL(.07, 1, .5 + Math.sin(now*6)*.08);
  if (furnace.visible && !furn3) furnaceHalo.material.opacity = .4 + Math.sin(now*5)*.15;
  if (campfire.visible) { flame.scale.set((1 + Math.sin(now*9)*.1) * fireF, (1 + Math.sin(now*13)*.15) * fireF, fireF); flameHalo.material.opacity = Math.min(1, fireF) * (.45 + Math.sin(now*7)*.15); }
  if (S.q3 >= 4) blades.rotation.z -= dt * 1.2; else blades.rotation.z = Math.sin(now*.7)*.03;
  millstone.visible = S.q3 < 4;
  sprinkler.visible = S.sprinklers; if (S.sprinklers) sprHead.rotation.y += dt * (h < 8 ? 6 : .6);
  clouds.forEach(c => { c.position.x += c.userData.v*dt; if (c.position.x > 60) c.position.x = -45; });
  rain.visible = !inside && raining && S.t < .5;
  if (rain.visible) { const p = rainGeo.attributes.position, sp = season() === 3 ? 3 : 14; for (let i=0;i<RN;i++){ let y = p.getY(i) - sp*dt; if (y<0) y += 12; p.setY(i,y); } p.needsUpdate = true; rain.position.set(player.position.x, player.position.y, player.position.z); }
  // camera
  if (cine) { if (cine.p0) { cine.t += dt; const k = easeIO(Math.min(1, cine.t / cine.dur)); camera.position.lerpVectors(cine.p0, cine.p1, k); camera.lookAt(new THREE.Vector3().lerpVectors(cine.l0, cine.l1, k));
      if (cine.t >= cine.dur && cine.res) { const r = cine.res; cine.res = null; r(); } } }
  else if (setupCam) { const wide = innerWidth >= 760, off = wide ? new THREE.Vector3(1.25, 1, 0) : new THREE.Vector3(0, .15, 0);
    camera.position.lerp(player.position.clone().add(new THREE.Vector3(off.x, 2.2, 4.6)), 1 - Math.pow(.001, dt)); camera.lookAt(player.position.x + off.x, player.position.y + off.y + .15 + (wide ? 0 : -.9), player.position.z); player.rotation.y = Math.sin(now*.6)*.5; }
  else if (!playing) { const a = now*.07; camera.position.set(Math.sin(a)*17, 9.5, Math.cos(a)*17); camera.lookAt(0, .5, 0); }
  else if (buildMode) { camera.position.lerp(new THREE.Vector3(0, 17, 13), 1 - Math.pow(.02, dt)); camera.lookAt(0, 0, 1); }
  else { camera.position.lerp(player.position.clone().add(camOffset()), 1 - Math.pow(.02, dt));
  camera.lookAt(player.position.x, player.position.y + .6, player.position.z - ahead()); }
  if (outline) outline.render(scene, camera); else renderer.render(scene, camera);
}
snapCam(); tameOutlines();
try { drawHammockSpot(); } catch {}
if (S.room && ROOMS[S.room] && S.where === 'hut') roomLight.position.set(ROOMS[S.room].c.x, 3, ROOMS[S.room].c.z + .5); else S.room = null;
bell.visible = S.quest >= 4; sprinkler.visible = S.sprinklers; stakes.visible = !S.bigGarden; rock.visible = !S.boulder; rosettaStone.visible = S.boulder; drawHouse(); drawHomeInside(); drawSites(); spawnDigs(); drawHome(); drawBuilds(); drawStations(); if (!(S.pickups || []).length) spawnPickups(); else drawPickups(); syncHomeDock(); if (lowGfx) setLowGfx(true);
drawHud(); tick();
$('moveTitle').onclick = () => openMoveGame();
const localAt = S.savedAt || 0; save();
if (!VISIT && !SIDE) cloudLoad(S.syncKey).then(found => {
  if (found && found.updated > localAt + 5000 && !playing) {
    found.save.syncKey = S.syncKey; found.save.savedAt = found.updated;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(found.save)); } catch {}
    location.reload();
  } else { cloudPush(true); checkInbox(); }
}).catch(() => {});
if (VISIT) setTimeout(() => $('start').onclick(), 50);
const hemiBtn = $('hemi');
const drawHemi = () => hemiBtn.textContent = S.south ? 'Seasons: Southern Hemisphere' : 'Seasons: Northern Hemisphere';
drawHemi(); hemiBtn.onclick = () => { S.south = !S.south; S.lastSeason = null; save(); drawHemi(); applySeason(); drawHud(); };
function lookPicker(title, done, withName) {
  const lk = { ...DEFAULT_LOOK, ...(S.look && S.look.human ? S.look : {}) };
  let name = S.name || '';
  setupCam = true; document.getElementById('veil').classList.add('setup'); document.body.classList.add('in-setup');
  const sw = (list, cur, attr) => list.map(c => `<button class="sw ${c === cur ? 'on' : ''}" data-${attr}="${c}" style="background:#${c.toString(16).padStart(6,'0')}" aria-label="color"></button>`).join('');
  let tab = 'face';
  const chips = (obj, key, attr) => `<div class="chips">${Object.entries(obj).map(([k,v]) => `<button data-${attr}="${k}" class="${lk[key] === k ? '' : 'ghost'}">${v}</button>`).join('')}</div>`;
  const draw = () => {
    const tabs = { face:'Face', hair:'Hair', clothes:'Clothes', hat:'Hat' };
    const body = {
      face:`<h4>Skin tone</h4><div class="chips">${sw(SKIN, lk.skin, 'skin')}</div>
        <h4>Eye color</h4><div class="chips">${sw(EYE_COLORS, lk.eyeColor, 'ecol')}</div>
        <h4>Eyes</h4>${chips(EYE_STYLES, 'eyes', 'es')}
        <h4>Eyebrows</h4>${chips(BROWS, 'brows', 'bw')}
        <h4>Extras</h4><div class="chips">${Object.entries(FACE_EXTRAS).map(([k,v]) => `<button data-fx="${k}" class="${lk[k] ? '' : 'ghost'}">${lk[k] ? '✓ ' : ''}${v}</button>`).join('')}</div>`,
      hair:`<h4>Hairstyle</h4>${chips(HAIR_STYLES, 'hair', 'hs')}<h4>Hair color</h4><div class="chips">${sw(HAIR_COLORS, lk.hairColor, 'hcol')}</div>`,
      clothes:`<h4>Top</h4>${chips(TOPS, 'top', 'tp')}<div class="chips">${sw(SHIRTS, lk.shirt, 'shirt')}</div>
        ${lk.top === 'dress' ? '' : `<h4>${lk.top === 'overalls' ? 'Overalls and bottoms' : 'Bottoms'}</h4>${chips(BOTTOMS, 'bottom', 'bt')}`}
        ${lk.top === 'dress' ? '' : `<div class="chips">${sw(BOTTOM_COLORS, lk.bottomColor, 'bcol')}</div>`}
        <h4>Shoes</h4>${chips(SHOES, 'shoes', 'shs')}<div class="chips">${sw(SHOE_COLORS, lk.shoeColor, 'scol')}</div>
        ${S.founder && fGot('outfit') ? `<h4>Founder outfit</h4><div class="chips"><button data-jk="pioneer" class="${lk.jacket === 'pioneer' ? '' : 'ghost'}">Sky Pioneer jacket and scarf</button><button data-jk="" class="${lk.jacket ? 'ghost' : ''}">My own top</button></div>` : ''}`,
      hat:`<h4>Hat</h4><div class="chips">${Object.entries({ ...HATS, ...(S.partyHat ? { party:'Party hat' } : {}), ...(S.founder ? FOUNDER_HATS : {}) }).map(([k,v]) => `<button data-hat="${k}" class="${lk.hat === k ? '' : 'ghost'}">${v}</button>`).join('')}</div>
        ${lk.hat !== 'none' ? `<h4>Hat color</h4><div class="chips">${sw(HAT_COLORS, lk.hatColor, 'hc')}</div>` : ''}`,
    };
    showCard(`<div class="kicker">${title}</div><h2>Make your character</h2>
      ${withName ? `<h4>Your name</h4><input id="nm" maxlength="16" value="${name.replace(/"/g,'')}" placeholder="Type a name" autocomplete="off" style="width:100%;font:18px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:8px">` : ''}
      <div class="chips lk-tabs">${Object.entries(tabs).map(([k,v]) => `<button data-lt="${k}" class="${tab === k ? '' : 'ghost'}">${v}</button>`).join('')}</div>
      ${body[tab]}
      <p id="lkMsg" style="font-weight:700;min-height:20px;margin-top:8px"></p>
      <button id="lkDone">${withName ? 'Next' : 'Done'}</button> <button id="lkRand" class="ghost">Surprise me</button>`, null);
    const upd = () => { S.look = { ...lk }; dressPlayer(); };
    if ($('nm')) $('nm').oninput = e => name = e.target.value;
    const pick = (attr, key, num) => document.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => { lk[key] = num ? +b.dataset[attr] : b.dataset[attr]; upd(); draw(); });
    document.querySelectorAll('[data-lt]').forEach(b => b.onclick = () => { tab = b.dataset.lt; draw(); });
    pick('ecol','eyeColor',1); pick('es','eyes'); pick('bw','brows'); pick('tp','top'); pick('shs','shoes'); pick('scol','shoeColor',1);
    document.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { lk[b.dataset.fx] = !lk[b.dataset.fx]; upd(); draw(); });
    const any = a => a[Math.floor(Math.random() * a.length)];
    $('lkRand').onclick = () => { Object.assign(lk, { skin:any(SKIN), eyeColor:any(EYE_COLORS), eyes:any(Object.keys(EYE_STYLES)), brows:any(Object.keys(BROWS)), hair:any(Object.keys(HAIR_STYLES)), hairColor:any(HAIR_COLORS.slice(0, 11)),
      top:any(Object.keys(TOPS)), shirt:any(SHIRTS), bottom:any(Object.keys(BOTTOMS)), bottomColor:any(BOTTOM_COLORS), shoes:any(Object.keys(SHOES)), shoeColor:any(SHOE_COLORS), freckles:Math.random() < .3, glasses:Math.random() < .25, blush:Math.random() < .7 }); upd(); draw(); };
    pick('skin','skin',1); pick('hs','hair'); pick('hcol','hairColor',1); pick('shirt','shirt',1); pick('bt','bottom'); pick('bcol','bottomColor',1);
    document.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { lk.hat = b.dataset.hat; upd(); draw(); });
    document.querySelectorAll('[data-jk]').forEach(b => b.onclick = () => { lk.jacket = b.dataset.jk || undefined; upd(); draw(); });
    document.querySelectorAll('[data-hc]').forEach(b => b.onclick = () => { lk.hatColor = +b.dataset.hc; upd(); draw(); });
    $('lkDone').onclick = () => {
      if (withName && !name.trim()) { $('lkMsg').textContent = 'Type a name for your character first.'; return; }
      S.look = { ...lk }; if (withName) S.name = name.trim().slice(0, 16); save(); dressPlayer(); done();
    };
  };
  upd0(); draw();
  function upd0() { S.look = { ...lk }; dressPlayer(); }
}
function modePicker(done, o = {}) {
  let pick = o.switching ? S.mode : null;
  const draw = () => {
    showCard(`<div class="kicker">${o.late ? 'A BONUS' : o.switching ? 'YOUR ISLAND' : o.returning ? 'WELCOME BACK' : 'NEW GAME'}</div><h2>${o.late ? 'Pick a bonus for your island' : 'Choose your island'}</h2><p>${o.late ? 'Pick the one that fits how you play. You get both of its extras.' : o.returning || o.switching ? 'Each island gives you something extra. You keep your progress, coins, and collections.' : 'Each island has its own perks. You pick once, at the start.'}</p>
      <p class="sub">Tap an island to see what it gives you. Each island is for people who love:</p><div class="jlist">${MODES.map(m => `<button data-md="${m.id}" style="${pick === m.id ? 'background:#ffc857' : ''}">${pick === m.id ? '✓ ' : ''}${m.name} <span class="sub">${m.blurb}</span>${pick === m.id ? `<span class="sub" style="display:block;margin-top:2px">${m.perks.map(x => '• ' + x).join('<br>')}</span>` : ''}</button>`).join('')}</div>
      <p id="mdMsg" style="font-weight:700;min-height:20px;margin-top:8px"></p>
      <button id="mdGo">${o.switching ? 'Switch to this island' : o.late ? 'Take this bonus' : o.returning ? 'Keep playing' : 'Start my adventure'}</button> <button id="mdBack" class="ghost">${o.switching ? 'Never mind' : o.late ? 'Ask me tomorrow' : 'Back'}</button>`, null);
    document.querySelectorAll('[data-md]').forEach(b => b.onclick = () => { pick = b.dataset.md; draw(); });
    $('mdBack').onclick = () => o.late ? (S.modeAsked = false, save(), done()) : o.switching ? (endSetup(), done()) : lookPicker(o.returning ? 'WELCOME BACK' : 'NEW GAME', () => modePicker(done, o), true);
    $('mdGo').onclick = () => { if (!pick) { $('mdMsg').textContent = 'Pick an island first.'; return; } S.mode = pick; applyModeStart(); if (o.switching || o.returning) toast(o.late ? `Done. Your island is now ${MODES.find(m => m.id === pick).name}, and both extras are switched on.` : `Welcome to ${MODES.find(m => m.id === pick).name}!`); done(); };
  };
  draw();
}
function applyModeStart() {
  if (S.mode === 'garden' && !S.bigGarden) { S.bigGarden = true; for (let i=0;i<3;i++){ S.tiles.push({ s:0 }); addTileGroup(S.tiles.length-1); } stakes.visible = false; }
  S.modeGifts = S.modeGifts || [];
  if (S.mode === 'scholar' && !S.modeGifts.includes('scholar')) { S.furn.bookshelf = (S.furn.bookshelf || 0) + 1; S.modeGifts.push('scholar'); }
  syncHomeDock();
  // starter seeds must be plantable in the real season the player starts in
  if (!S.setupDone && !CROPS.cloudberry.seasons.includes(season()) && S.seeds.cloudberry === 4) {
    const k = Object.keys(CROPS).filter(c => !CROPS[c].locked && CROPS[c].seasons.includes(season())).sort((a, b) => CROPS[a].days - CROPS[b].days)[0];
    if (k) { S.seeds.cloudberry = 0; S.seeds[k] = 4; S.sel = k; drawHud(); }
  }
  S.created = true; S.setupDone = true; save();
}
function openLookEditor(back) { lookPicker('YOUR LOOK', () => { endSetup(); if (back) back(); else toast('Looking good!'); }, true); }
function endSetup() { setupCam = false; document.getElementById('veil').classList.remove('setup'); document.body.classList.remove('in-setup'); hideCard(); }
$('start').onclick = () => { dispatchEvent(new Event('sg-playing')); $('title').style.display = 'none'; document.body.classList.remove('on-title'); playing = true; snapCam(); startAudio();
  { const turned = seasonCheck(); applySeason(); if (turned && S.letter) toast(turned); }
  { const fz = festival(); if (fz && S.letter && !S.fests[fz.id + fz.year]) setTimeout(() => toast(`Today is ${fz.name}! Talk to ${NEIGHBORS[fz.host].name}.`), 800); }
  if (S.created && S.letter && !S.setupDone && !VISIT) {
    const toIsland = () => { setupCam = true; $('veil').classList.add('setup'); document.body.classList.add('in-setup'); modePicker(() => { endSetup(); $('start').onclick(); }, { returning:true }); };
    showCard(`<div class="kicker">WELCOME BACK</div><h2>New in Sky Garden!</h2><p>You can now make your own character, add your birthday, and choose an island that gives you something extra.</p><h4>Your progress is safe</h4><p>Everything you have stays exactly as it is.</p>`, "Let's set it up", () =>
      lookPicker('WELCOME BACK', () => { endSetup(); if (!S.birthdayAsked && !S.birthday) birthdayPicker(toIsland); else toIsland(); }, true));
    return;
  }
  if (!S.created) { lookPicker('NEW GAME', () => { endSetup(); applyModeStart(); $('start').onclick(); }, true); return; } // straight into the island: the birthday and the island choice are asked on later days
  if (isPartyDay() && S.lastParty !== dayKey(today()) && S.letter) setTimeout(birthdayParty, 900);
  else if (S.tut === 9 && !S.birthdayAsked && !S.birthday && S.letter) setTimeout(() => birthdayPicker(null, true), 1200);
  if (!S.letter) { S.letter = true; save(); showCard(`<div class="kicker">${(S.home || 0) < 3 ? 'A LETTER UNDER A STONE' : 'A LETTER ON THE TABLE'}</div><h2>Dear ${S.name || 'little one'},</h2><p class="letter">${(S.home || 0) < 3 ? 'You made it. Sorry about the hut. The Great Gust took it.' : 'You made it. The hut is yours now.'}<br><br>The wind took what we knew, too: how to count, how to tell time, how to make music. It is all still here, buried. Dig it up.<br><br>Nana Gale is on her way over.<br><br>Love, Grandma</p>`, 'Let\'s go!', () => { if (S.tut === 0) startTutorial(); }); } };
// --- trading post and creator shops ---
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const ME = () => VISIT ? mine : S, saveMe = () => VISIT ? saveMine() : save();
const TRADEABLE = ['crop','fruit','fish','dish','specialty','heirloom','material','bug'];
const isKid = () => ageBand() === 'kid';
async function api(path, body) {
  if (TESTSLOT && body && !['/feedback','/bug'].includes(path.split('?')[0]) && !(DEV_OK && path.startsWith('/creator/'))) { setTimeout(() => toast('That only works on your real island. Tap Bag, then Back to my island.'), 60); return { ok:false, status:0, error:'test island' }; }
  if (TESTSLOT && body && path === '/feedback') body = { ...body, where:'[test island] ' + (body.where || '') };
  if (FILE && body && !['/feedback','/bug'].includes(path.split('?')[0])) { setTimeout(() => toast('That only works on your first save file.'), 60); return { ok:false, status:0, error:'extra save file' }; }
  if (FILE && body && path === '/feedback') body = { ...body, where:`[save file ${FILE.slice(1)}] ` + (body.where || '') };
  try { const r = await fetch(`${CLOUD}${path}`, body ? { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) } : undefined);
    const j = await r.json().catch(() => ({})); return { ok:r.ok, status:r.status, ...j }; } catch { return { ok:false, status:0, error:'offline' }; }
}
// the trading post stall on your island
const stall = new THREE.Group(); stall.position.set(-2.8, 0, 4.6); stall.rotation.y = .3; scene.add(stall); lateClicks.push(stall);
{ const wood = mat(0xc98f58), dark = mat(0x9b6b4a);
  stall.add(mesh(new THREE.BoxGeometry(1.8,.8,.7), wood, 0, .4, 0)); stall.add(mesh(new THREE.BoxGeometry(1.9,.08,.8), dark, 0, .82, 0));
  [-.85,.85].forEach(x => stall.add(mesh(new THREE.CylinderGeometry(.05,.05,1.9,6), dark, x, .95, -.3)));
  for (let i = 0; i < 5; i++) stall.add(mesh(new THREE.BoxGeometry(.4,.1,.9), mat(i % 2 ? 0xfff1d6 : 0xff8fa3), -.8 + i*.4, 1.9, -.05).rotateX(-.35));
  [[-.5,0xffc857],[0,0x8fdc8a],[.5,0x7ec8e3]].forEach(([x,c]) => stall.add(mesh(new THREE.BoxGeometry(.28,.22,.28), mat(c), x, .98, .1)));
  const hb = hitBox(2, 2.2, 1.2); hb.position.y = 1; stall.add(hb); deco(stall, () => openMarket()); stall.userData.market = true; }
function drawStall() { stall.visible = featureOn('market'); }
drawStall();
function productName(p) { return esc(p.name || BASES[p.base]?.name || 'Handmade'); }
function listingLabel(l) { if (l.product) return `${productSwatch(l.product, 30)} <b>${productName(l.product)}</b>`;
  registerHeirloom(l.item); const it = ITEMS[l.item]; return it ? `${icon(l.item, it.kind)} <b>${l.qty} ${esc(plural(l.item, l.qty))}</b>` : null; }
function askText(l) { if (l.price) return `${l.price} coins`; registerHeirloom(l.wantItem); const w = ITEMS[l.wantItem]; return w ? `Trade for ${l.wantQty} ${icon(l.wantItem, w.kind)} ${esc(w.name)}` : 'Trade'; }
function marketTabs(on) { if (VISIT) return ''; const tabs = [['market','Market'],['sell','Sell'],['make','Design'],['mine','My listings'],['brand','My brand']];
  return `<div class="mtabs">${tabs.map(([k,l]) => `<button data-mt="${k}" class="${on === k ? '' : 'ghost'}">${l}</button>`).join('')}</div>`; }
function wireTabs() { document.querySelectorAll('[data-mt]').forEach(b => b.onclick = () => openMarket(b.dataset.mt)); }
async function openMarket(tab = 'market') {
  if (!featureOn('market') && !VISIT) return;
  if (tab === 'sell') return sellTab(); if (tab === 'make') return designStudio(); if (tab === 'mine') return myListings(); if (tab === 'brand') return brandEditor(() => openMarket('brand'));
  showCard(`<div class="kicker">TRADING POST</div><h2>${VISIT ? `${esc(VISIT.name)}'s shop` : 'The market'}</h2>${marketTabs('market')}<p>Loading...</p>`, 'Close');
  const res = VISIT ? await api(`/shop?code=${VISIT_CODE}`) : await api('/market');
  if (!res.ok) { $('card').querySelector('p').textContent = 'Could not reach the market. Check your internet and try again.'; wireTabs(); return; }
  const rows = (res.listings || []).map(l => { const lab = listingLabel(l); if (!lab) return ''; const mineL = l.code === myCode;
    return `<div class="mrow">${l.logo ? logoSvg(l.logo, 40) : '<span class="nologo">🏪</span>'}<div class="minfo"><small>${esc(l.shop || 'A shop')}${l.founder ? ' <span class="fstar">✦</span>' : ''}</small><div>${lab}</div><div class="mask">${askText(l)}</div></div>
      <div class="mbtns">${mineL ? '<small>Yours</small>' : `<button data-buy="${l.id}">${l.price ? 'Buy' : 'Trade'}</button>`}${!VISIT && !mineL ? `<button class="ghost" data-shop="${l.code}">Shop</button>` : ''}</div></div>`; }).join('');
  showCard(`<div class="kicker">TRADING POST</div><h2>${VISIT ? `${esc(res.brand?.shop || VISIT.name + "'s shop")}` : 'The market'}</h2>${marketTabs('market')}
    ${VISIT && res.brand ? `<div class="brandhead">${logoSvg(res.brand.logo, 56)}<p>Everything here was made or grown on this island.</p></div>` : ''}
    ${rows || `<p>${VISIT ? 'Nothing for sale here right now.' : 'Nothing for sale yet. Be the first! Tap Sell.'}</p>`}
    ${VISIT && VISIT_CODE !== myCode ? '<button id="repShop" class="ghost rep">Report this shop</button>' : ''}
    ${!VISIT && !S.brand ? '<p class="itinfo">Want to sell your own things? Talk to Pip about a maker\'s mark first. That is your logo and shop name.</p>' : ''}`, 'Close');
  wireTabs();
  const byId = Object.fromEntries((res.listings || []).map(l => [l.id, l]));
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buyListing(byId[b.dataset.buy]));
  document.querySelectorAll('[data-shop]').forEach(b => b.onclick = () => openShop(b.dataset.shop));
  if ($('repShop')) $('repShop').onclick = () => reportShop(VISIT_CODE, null, () => openMarket());
}
async function openShop(code) {
  const res = await api(`/shop?code=${code}`); if (!res.ok) { toast('Could not load that shop.'); return; }
  const rows = (res.listings || []).map(l => { const lab = listingLabel(l); return lab ? `<div class="mrow"><div class="minfo"><div>${lab}</div><div class="mask">${askText(l)}</div></div></div>` : ''; }).join('');
  showCard(`<div class="kicker">A SHOP ON ISLAND ${code}</div><div class="brandhead">${res.brand ? logoSvg(res.brand.logo, 64) : ''}<h2>${esc(res.brand?.shop || 'A shop')}</h2></div>
    ${rows || '<p>Nothing for sale right now.</p>'}<button id="goVisit">Visit their island</button> ${code !== myCode ? '<button id="repShop" class="ghost rep">Report this shop</button>' : ''}`, 'Back', () => openMarket());
  $('goVisit').onclick = () => { location.href = `${location.pathname}?visit=${code}`; };
  if ($('repShop')) $('repShop').onclick = () => reportShop(code, null, () => openShop(code));
}
async function buyListing(l) {
  const T = ME(); T.bag = T.bag || {};
  if (l.price && (T.coins || 0) < l.price) { toast(`You need ${l.price} coins. You have ${T.coins || 0}.`); return; }
  if (!l.price && (T.bag[l.wantItem] || 0) < l.wantQty) { toast(`You need ${l.wantQty} ${ITEMS[l.wantItem]?.name.toLowerCase()} to trade.`); return; }
  if (!VISIT && !l.product && !canCarry(l.item, l.qty)) return bagFull();
  if (l.price) T.coins -= l.price; else { T.bag[l.wantItem] -= l.wantQty; if (T.bag[l.wantItem] <= 0) delete T.bag[l.wantItem]; }
  saveMe(); drawHud();
  const res = await api('/buy', { key:T.syncKey, id:l.id });
  if (!res.ok) { if (l.price) T.coins += l.price; else T.bag[l.wantItem] = (T.bag[l.wantItem] || 0) + l.wantQty; saveMe(); drawHud();
    toast(res.status === 409 ? 'Someone else got it first. Sorry!' : 'Could not reach the market. Nothing was spent.'); return; }
  if (l.product) { T.products = [...(T.products || []), { ...l.product, uid:Date.now().toString(36), maker:{ code:l.code, shop:l.shop, logo:l.logo } }]; }
  else { registerHeirloom(l.item); T.bag[l.item] = (T.bag[l.item] || 0) + l.qty; if (!VISIT) noteFind(l.item); }
  lean('trader'); saveMe(); drawHud(); sfx('coin');
  toast(`You got ${l.product ? l.product.name : `${l.qty} ${ITEMS[l.item].name.toLowerCase()}`} from ${l.shop || 'a shop'}! ${VISIT ? 'It is waiting in your bag at home.' : ''}`);
  openMarket();
}
function sellTab() {
  if (!S.brand) return brandEditor(() => sellTab());
  const goods = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && TRADEABLE.includes(ITEMS[k].kind)), prods = S.products || [];
  const wants = Object.keys(ITEMS).filter(k => TRADEABLE.includes(ITEMS[k].kind) && !isHeirloom(k));
  showCard(`<div class="kicker">TRADING POST</div><h2>Sell something</h2>${marketTabs('sell')}
    <p>Pick what to sell, then set a price in coins or ask for something in trade.</p>
    ${prods.length ? `<h4>Your products</h4><div class="igrid">${prods.map((p, i) => `<button class="itile" data-sp="${i}">${productSwatch(p, 34)}<small>${productName(p)}</small></button>`).join('')}</div>` : ''}
    <h4>From your bag</h4>${goods.length ? `<div class="igrid">${goods.map(([k,n]) => `<button class="itile" data-si="${k}"><span class="ic">${icon(k, ITEMS[k].kind)}</span><b>${n}</b><small>${esc(ITEMS[k].name)}</small></button>`).join('')}</div>` : '<p>Your bag is empty.</p>'}
    <div id="sellForm"></div>`, 'Close');
  wireTabs();
  const form = (label, max, value, onPost) => {
    $('sellForm').innerHTML = `<h4>Selling: ${label}</h4>
      ${max > 1 ? `<p>How many? <input id="sQty" type="number" min="1" max="${max}" value="1" class="numin"> of ${max}</p>` : ''}
      <div class="steppers" style="justify-content:flex-start"><button id="sCoins">For coins</button><button id="sTrade" class="ghost">For a trade</button></div>
      <p id="sAsk">Price: <input id="sPrice" type="number" min="1" max="99999" value="${value}" class="numin"> coins</p>
      <p class="itinfo">Tip: it sells for about ${value} coins at your crate. Price it too high and no one buys. Too low and you lose out.</p>
      <button id="sPost">Put it up for sale</button>`;
    try { $('sellForm').scrollIntoView({ behavior:'smooth', block:'nearest' }); } catch {}
    let trade = false;
    $('sCoins').onclick = () => { trade = false; $('sCoins').className = ''; $('sTrade').className = 'ghost'; $('sAsk').innerHTML = `Price: <input id="sPrice" type="number" min="1" max="99999" value="${value}" class="numin"> coins`; };
    $('sTrade').onclick = () => { trade = true; $('sTrade').className = ''; $('sCoins').className = 'ghost';
      $('sAsk').innerHTML = `Ask for <input id="wQty" type="number" min="1" max="99" value="1" class="numin"> <select id="wItem">${wants.map(k => `<option value="${k}">${esc(ITEMS[k].name)}</option>`).join('')}</select>`; };
    $('sPost').onclick = () => { const qty = Math.max(1, Math.min(max, +($('sQty')?.value || 1)));
      const ask = trade ? { wantItem:$('wItem').value, wantQty:Math.max(1, Math.min(99, +$('wQty').value || 1)) } : { price:Math.max(1, Math.min(99999, Math.round(+$('sPrice').value || 1))) };
      onPost(qty, ask); };
  };
  document.querySelectorAll('[data-si]').forEach(b => b.onclick = () => { const k = b.dataset.si;
    form(`${icon(k, ITEMS[k].kind)} ${esc(ITEMS[k].name)}`, Math.min(99, S.bag[k]), Math.max(1, Math.round(sellPrice(k))), async (qty, ask) => {
      if ((S.bag[k] || 0) < qty) return; bagAdd(k, -qty); save(); drawHud();
      const res = await api('/list', { key:S.syncKey, item:k, qty, ...ask });
      if (!res.ok) { S.bag[k] = (S.bag[k] || 0) + qty; save(); drawHud(); toast(res.status === 409 ? 'You can have up to 8 things for sale at once.' : res.error === 'shop paused' ? 'Your shop is paused while we look at a report. Your items are safe.' : 'Could not reach the market. Your items are safe.'); return; }
      sfx('coin'); lean('trader'); toast('It is up for sale!'); myListings(); }); });
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { const i = +b.dataset.sp, p = prods[i];
    form(`${productSwatch(p, 24)} ${productName(p)}`, 1, BASES[p.base]?.value || 60, async (qty, ask) => {
      const [taken] = S.products.splice(i, 1); save();
      const res = await api('/list', { key:S.syncKey, item:'product', qty:1, product:{ base:taken.base, name:taken.name, color:taken.color, color2:taken.color2, pattern:taken.pattern }, ...ask });
      if (!res.ok) { S.products.push(taken); save(); toast(res.status === 409 ? 'You can have up to 8 things for sale at once.' : res.error === 'not allowed' ? 'That product name is not allowed. Rename it in the Design Studio and try again.' : res.error === 'shop paused' ? 'Your shop is paused while we look at a report. Your product is safe.' : 'Could not reach the market. Your product is safe.'); return; }
      sfx('coin'); lean('trader'); toast('Your product is up for sale! Your logo goes with it.'); myListings(); }); });
}
async function myListings() {
  showCard(`<div class="kicker">TRADING POST</div><h2>What you have for sale</h2>${marketTabs('mine')}<p>Loading...</p>`, 'Close'); wireTabs();
  const res = await api(`/shop?code=${myCode}`); if (!res.ok) { $('card').querySelector('p').textContent = 'Could not reach the market.'; return; }
  const rows = (res.listings || []).map(l => { const lab = listingLabel(l); return lab ? `<div class="mrow"><div class="minfo"><div>${lab}</div><div class="mask">${askText(l)}</div></div><div class="mbtns"><button class="ghost" data-un="${l.id}">Take down</button></div></div>` : ''; }).join('');
  showCard(`<div class="kicker">TRADING POST</div><h2>What you have for sale</h2>${marketTabs('mine')}${rows || '<p>You have nothing for sale. Tap Sell to put something up.</p>'}
    <p class="itinfo">When something sells, the payment arrives in your mailbox the next time you play.</p>`, 'Close'); wireTabs();
  const byId = Object.fromEntries((res.listings || []).map(l => [l.id, l]));
  document.querySelectorAll('[data-un]').forEach(b => b.onclick = async () => { const res2 = await api('/unlist', { key:S.syncKey, id:+b.dataset.un });
    if (!res2.ok) { toast(res2.status === 409 ? 'It already sold!' : 'Could not reach the market.'); return myListings(); }
    const l = byId[b.dataset.un]; if (l.product) S.products = [...(S.products || []), { ...l.product, uid:Date.now().toString(36), maker:{ code:myCode, shop:S.brand?.shop, logo:S.brand?.logo } }];
    else { registerHeirloom(l.item); S.bag[l.item] = (S.bag[l.item] || 0) + l.qty; }
    save(); drawHud(); toast('Taken down. It is back in your bag.'); myListings(); });
}
// your maker's mark: a logo and a shop name
function brandEditor(done) {
  const b = S.brand ? JSON.parse(JSON.stringify(S.brand)) : { shop:'', logo:{ shape:'circle', bg:0xffc857, fg:0x3b2f4a, sym:'🌸', letters:'' } }, L = b.logo, kid = isKid();
  const [ka, kn] = (b.shop || 'Sunny Workshop').split(' ');
  const draw = () => {
    showCard(`<div class="kicker">${S.brand ? 'TRADING POST' : 'MY BRAND'}</div><h2>Your maker's mark</h2>${S.brand ? marketTabs('brand') : ''}
      <div class="brandhead">${logoSvg(L, 84)}<h3>${esc(kid ? `${$('kA')?.value || ka} ${$('kN')?.value || kn}` : b.shop || 'Your shop name')}</h3></div>
      <h4>Shape</h4><div class="chips">${SHAPES.map(s => `<button data-sh="${s}" class="${L.shape === s ? '' : 'ghost'}">${logoSvg({ ...L, shape:s, sym:'', letters:'' }, 26)}</button>`).join('')}</div>
      <h4>Fill color</h4><div class="chips">${PALETTE.map(c => `<button class="sw ${L.bg === c ? 'on' : ''}" data-bg="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Outline and letter color</h4><div class="chips">${PALETTE.map(c => `<button class="sw sm ${L.fg === c ? 'on' : ''}" data-fg="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Symbol</h4><div class="chips">${['', ...SYMBOLS].map(s => `<button data-sy="${s}" class="${L.sym === s ? '' : 'ghost'}">${s || 'None'}</button>`).join('')}</div>
      <h4>Letters (up to 2)</h4><input id="bLet" maxlength="2" value="${esc(L.letters)}" class="numin" style="width:70px;text-transform:uppercase">
      <h4>Shop name</h4>${kid ? `<select id="kA">${KID_ADJ.map(w => `<option ${w === ka ? 'selected' : ''}>${w}</option>`).join('')}</select> <select id="kN">${KID_NOUN.map(w => `<option ${w === kn ? 'selected' : ''}>${w}</option>`).join('')}</select>`
        : `<input id="bShop" maxlength="24" value="${esc(b.shop)}" placeholder="Like Moonpetal Goods" class="numin" style="width:100%">`}
      <p style="font-size:13px;opacity:.7;margin-top:6px">Everyone who shops at the Trading Post will see your logo and shop name.</p>
      <button id="bSave">Save my brand</button>`, S.brand ? 'Close' : 'Later');
    wireTabs();
    const keep = () => { L.letters = ($('bLet').value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2); if ($('bShop')) b.shop = $('bShop').value; };
    document.querySelectorAll('[data-sh]').forEach(x => x.onclick = () => { keep(); L.shape = x.dataset.sh; draw(); });
    document.querySelectorAll('[data-bg]').forEach(x => x.onclick = () => { keep(); L.bg = +x.dataset.bg; draw(); });
    document.querySelectorAll('[data-fg]').forEach(x => x.onclick = () => { keep(); L.fg = +x.dataset.fg; draw(); });
    document.querySelectorAll('[data-sy]').forEach(x => x.onclick = () => { keep(); L.sym = x.dataset.sy; draw(); });
    $('bSave').onclick = async () => { keep(); const shop = kid ? `${$('kA').value} ${$('kN').value}` : b.shop.trim();
      if (!shop) { toast('Give your shop a name.'); return; }
      const res = await api('/brand', { key:S.syncKey, shop, logo:L });
      if (!res.ok) { toast(res.error === 'not allowed' ? 'That shop name is not allowed. Please pick a kind name without links or numbers.' : 'Could not save your brand. Check your internet and try again.'); return; }
      const first = !S.brand; S.brand = { shop:res.shop || shop, logo:L }; save(); sfx('heart');
      if (first) { S.coins += 100; save(); drawHud(); lean('maker', 2); return showCard(`<div class="kicker">MAKER'S MARK</div><h2>${esc(S.brand.shop)} is open!</h2><div class="brandhead">${logoSvg(L, 72)}</div><p><b>Pip gave you 100 coins to get started.</b></p>`, 'Okay', () => showCard(`<div class="kicker">MAKER'S MARK</div><h2>A mark tells people who made it</h2><h4>In real life</h4><p>${MARK_LESSON}</p><p>Next, design your first product at the Trading Post.</p>`, 'Okay', () => done && done())); }
      toast('Brand saved.'); done && done(); };
  };
  draw();
}
// the design studio: turn things you made into one-of-a-kind products
function designStudio() {
  if (!S.brand) return brandEditor(() => designStudio());
  const kid = isKid(), avail = Object.entries(BASES).filter(([, b]) => !b.age || S.stations[b.age]);
  const d = designStudio.d = designStudio.d || { base:avail[0][0], color:0xff8fa3, color2:0xffffff, pattern:'stripes', name:'', adj:KID_ADJ[0] };
  const draw = () => { const B = BASES[d.base], nm = kid ? `${d.adj} ${B.name}` : (d.name || B.name);
    showCard(`<div class="kicker">DESIGN STUDIO</div><h2>Make a product</h2>${marketTabs('make')}
      <div class="brandhead">${productSwatch(d, 84)}${logoSvg(S.brand.logo, 40)}<h3>${esc(nm)}</h3></div>
      <h4>What to make</h4><div class="chips">${avail.map(([k, b]) => `<button data-ba="${k}" class="${d.base === k ? '' : 'ghost'}" ${enough(b.needs) ? '' : 'style="opacity:.5"'}>${esc(b.name)}</button>`).join('')}</div>
      ${needList(B.needs)}
      <h4>Main color</h4><div class="chips">${PALETTE.map(c => `<button class="sw ${d.color === c ? 'on' : ''}" data-c1="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Pattern and its color</h4><div class="chips">${PATTERNS.map(p => `<button data-pa="${p}" class="${d.pattern === p ? '' : 'ghost'}">${p[0].toUpperCase() + p.slice(1)}</button>`).join('')}</div>
      <div class="chips" style="margin-top:6px">${PALETTE.map(c => `<button class="sw sm ${d.color2 === c ? 'on' : ''}" data-c2="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Name it</h4>${kid ? `<select id="pdAdj">${KID_ADJ.map(w => `<option ${w === d.adj ? 'selected' : ''}>${w}</option>`).join('')}</select> ${esc(B.name)}`
        : `<input id="pdName" maxlength="30" value="${esc(d.name)}" placeholder="${esc(B.name)}" class="numin" style="width:100%">`}
      <p style="font-size:13px;opacity:.7;margin-top:6px">Your logo and shop name stay on it, even after you sell it.</p>
      <button id="dMake"${enough(B.needs) ? '' : ' disabled style="opacity:.45"'}>Make it</button>`, 'Close');
    wireTabs();
    const keep = () => { if ($('pdName')) d.name = $('pdName').value.slice(0, 30); if ($('pdAdj')) d.adj = $('pdAdj').value; };
    document.querySelectorAll('[data-ba]').forEach(x => x.onclick = () => { keep(); d.base = x.dataset.ba; draw(); });
    document.querySelectorAll('[data-c1]').forEach(x => x.onclick = () => { keep(); d.color = +x.dataset.c1; draw(); });
    document.querySelectorAll('[data-c2]').forEach(x => x.onclick = () => { keep(); d.color2 = +x.dataset.c2; draw(); });
    document.querySelectorAll('[data-pa]').forEach(x => x.onclick = () => { keep(); d.pattern = x.dataset.pa; draw(); });
    $('dMake').onclick = () => { keep(); if (!enough(B.needs)) { toast(`Not enough yet: ${needText(B.needs)}.`); return; }
      Object.entries(B.needs).forEach(([k,n]) => bagAdd(k, -n));
      const first = !(S.madeProducts > 0); S.madeProducts = (S.madeProducts || 0) + 1;
      S.products = [...(S.products || []), { uid:Date.now().toString(36), base:d.base, name:(kid ? `${d.adj} ${B.name}` : (d.name.trim() || B.name)), color:d.color, color2:d.color2, pattern:d.pattern, maker:{ code:myCode, shop:S.brand.shop, logo:S.brand.logo } }];
      lean('maker', 2); save(); drawHud(); sfx('pick'); burst(player.position.clone().setY(1), d.color, 16);
      if (first) return showCard(`<div class="kicker">YOUR FIRST PRODUCT</div><h2>${esc(S.products.at(-1).name)}</h2><div class="brandhead">${productSwatch(d, 72)}${logoSvg(S.brand.logo, 40)}</div><h4>In real life</h4><p>${DESIGN_LESSON}</p><p>Sell it at the Trading Post, or keep it. No one else has one exactly like it.</p>`, 'Okay', () => openMarket('sell'));
      toast('Made! Find it in your bag, or sell it at the Trading Post.'); };
  };
  draw();
}
// report a shop name, product name, or listing that is rude or shares personal info
function reportShop(code, listing, back) {
  showCard(`<div class="kicker">REPORT</div><h2>What is wrong?</h2><p>Thank you for helping keep Sky Garden kind. Your report is private. The shop will not know it was you.</p>
    <div class="jlist"><button data-why="rude">A rude or mean name</button><button data-why="personal">It shares personal info or a link</button><button data-why="other">Something else feels wrong</button></div>`, 'Cancel', back);
  document.querySelectorAll('[data-why]').forEach(b => b.onclick = async () => {
    const res = await api('/report', { key:ME().syncKey, code, listing, reason:b.dataset.why });
    showCard(`<div class="kicker">REPORT</div><h2>${res.ok ? 'Thank you' : 'Could not send'}</h2><p>${res.ok ? 'We got your report. If several people report the same shop, it is paused until a person looks at it.' : 'Check your internet and try again.'}</p>`, 'Okay', back); });
}
function openProduct(p, back) {
  const mineP = p.maker?.code === myCode;
  showCard(`<div class="kicker">PRODUCT</div><div class="brandhead">${productSwatch(p, 84)}<h2>${productName(p)}</h2></div>
    <div class="brandhead">${p.maker?.logo ? logoSvg(p.maker.logo, 40) : ''}<p>${mineP ? 'Made by you' : `Made by <b>${esc(p.maker?.shop || 'a maker')}</b> on island ${p.maker?.code || '?'}`}</p></div>
    ${!mineP && p.maker?.code && !VISIT ? '<button id="pShop">See their shop</button> <button id="pVisit" class="ghost">Visit their island</button> <button id="pRep" class="ghost rep">Report</button>' : ''}`, 'Back', back);
  if ($('pRep')) $('pRep').onclick = () => reportShop(p.maker.code, null, () => openProduct(p, back));
  if ($('pShop')) { $('pShop').onclick = () => openShop(p.maker.code); $('pVisit').onclick = () => { location.href = `${location.pathname}?visit=${p.maker.code}`; }; }
}
// --- Chapter 2's fork: explorer's ship or floating market ---
function shipChoice() {
  const again = !!S.shipPath; if (again) { S.shipAsked = islandYear(); save(); }
  const opts = Object.entries(SHIP_PATHS);
  openDialog('Captain Drizzle', again ? `A new year, sailor! Last year she was ${SHIP_PATHS[S.shipPath].name.toLowerCase()}. Want to keep her that way, or try the other road?`
    : "Now, what should the Puddle Jumper be, day to day? Some captains chase the horizon. Some bring the whole world to their deck. It is your call, sailor.", [{ label:'Let me think', fn:ask }], S.hearts.drizzle);
  function ask() { closeDialog(); showCard(`<div class="kicker">CAPTAIN DRIZZLE ASKS</div><h2>What should the ship become?</h2>
    ${opts.map(([k, p]) => `<button data-sp2="${k}" class="${S.shipPath === k ? '' : 'ghost'}" style="display:block;width:100%;text-align:left;margin-top:8px"><b>${p.name}</b>${S.shipPath === k ? ' (this year)' : ''}<br><span class="sub">${p.short}</span></button>`).join('')}
    <p style="font-size:13px;opacity:.7;margin-top:8px">Either way, the ship can still fly you anywhere. You can change your mind when the next island year starts.</p>`, again ? 'Keep it as is' : null, () => closeDialog());
  document.querySelectorAll('[data-sp2]').forEach(b => b.onclick = () => { const k = b.dataset.sp2, changed = k !== S.shipPath; S.shipPath = k; S.shipYear = islandYear();
    lean(k === 'explore' ? 'explorer' : 'trader', 3); if (changed) S.bigChoices = [...(S.bigChoices || []), k === 'explore' ? 'You made the Puddle Jumper an explorer\'s ship.' : 'You made the Puddle Jumper a floating market.'];
    save(); drawShip(); hideCard(); closeDialog(); burst(ship.position, 0xffc857, 22); [523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*150));
    openDialog('Captain Drizzle', k === 'explore' ? "An explorer! I knew it. I put up a crow's nest and dug out my old charts. Tap the ship once a day and we sail." : "A market! I will stack the crates. Folks from every island will shout their orders. Tap the ship each day to see what they want.", [], S.hearts.drizzle); }); }
}
function voyage() {
  if (S.voyageDay === S.day) { toast('The crew is resting. You can sail again tomorrow.'); return; }
  showCard(`<div class="kicker">VOYAGE</div><h2>Which way, navigator?</h2><p>No map, no compass. Drizzle says: "Pick how we find our way."</p>
    <div class="jlist">${HEADINGS.map(h => `<button data-hd="${h.id}">${h.label}<span class="sub"> ${h.hint}</span></button>`).join('')}</div>`, 'Not now');
  document.querySelectorAll('[data-hd]').forEach(b => b.onclick = () => { const hd = b.dataset.hd; S.voyageDay = S.day; S.voyages = (S.voyages || 0) + 1; lean('explorer', 2);
    const pool = { birds:['apple','peach','minnow'], swells:['trout','koi','guppy'], stars:['sunfish','frostchar','lanterneel'] }[hd];
    const haul = { [pool[Math.floor(Math.random()*3)]]:2, [pool[Math.floor(Math.random()*3)]]:1 }, rare = Math.random() < .2 ? (Math.random() < .5 ? 'puffer' : 'moonray') : null;
    if (rare) haul[rare] = (haul[rare] || 0) + 1;
    const coins = 30 + Math.floor(Math.random()*40), got = giveReward({ coins, items:haul }); save(); drawHud(); sfx('splash');
    const first = S.voyages === 1, done = S.voyages === 3;
    showCard(`<div class="kicker">VOYAGE ${S.voyages}</div><h2>${rare ? 'A rare catch!' : 'Land ho!'}</h2><p>You came home with ${got.join(', ')}.</p>
      ${first ? `<h4>In real life</h4><p>${WAYFINDING}</p>` : ''}
      ${done ? `<h4>Drizzle is proud</h4><p>"3 voyages, 3 safe returns. You are a real navigator now. Take my old Star Globe. It showed me the way for 40 years."</p><p><b>You got the Star Globe! Place it inside your home.</b></p>` : ''}`, 'Okay');
    if (done) { S.furn.globe = (S.furn.globe || 0) + 1; save(); } });
}
function marketDay() {
  const s = season();
  if (!S.boat || S.boat.day !== S.day) { const pool = [...Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(s) && !CROPS[k].locked), 'apple', 'peach', 'minnow', 'trout'];
    S.boat = { day:S.day, orders:[...Array(3)].map(() => { const k = pool[Math.floor(Math.random()*pool.length)], n = 1 + Math.floor(Math.random()*3); return { k, n, pay:Math.round(ITEMS[k].sell * n * 1.5), done:false }; }) }; save(); }
  showCard(`<div class="kicker">THE FLOATING MARKET</div><h2>Today's orders</h2><p>Shoppers from all over the sky call out what they want. These orders pay 50% more than selling at your crate.</p>
    <div class="jlist">${S.boat.orders.map((o, i) => `<button data-mo="${i}" ${o.done ? 'class="locked"' : ''}>${o.done ? '✓ ' : ''}${icon(o.k)} ${o.n} ${esc(plural(o.k, o.n))} <span class="sub">${o.done ? 'Delivered' : `pays ${o.pay} coins. ${Math.min(have(o.k), o.n)}/${o.n}`}</span></button>`).join('')}</div>${S.boat.orders.every(o => o.done) ? '<p><b>All 3 orders are filled. New orders come tomorrow.</b></p>' : ''}`, 'Close');
  document.querySelectorAll('[data-mo]').forEach(b => b.onclick = () => { const o = S.boat.orders[+b.dataset.mo]; if (o.done) return;
    if (have(o.k) < o.n) { toast(`You need ${o.n} ${plural(o.k, o.n)}.`); return; }
    bagAdd(o.k, -o.n); S.coins += o.pay; o.done = true; S.marketFilled = (S.marketFilled || 0) + 1; lean('trader'); goal('sell', o.pay); sfx('coin'); save(); drawHud();
    const first = S.marketFilled === 1, done = S.marketFilled === 6;
    if (done) { S.perks = [...new Set([...(S.perks || []), 'marketRep'])]; S.coins += 300; save(); drawHud(); }
    if (first || done) return showCard(`<div class="kicker">THE FLOATING MARKET</div><h2>${first ? 'Your first sale on the water' : 'The market is famous!'}</h2>
      ${first ? `<h4>In real life</h4><p>${FLOATING}</p>` : `<p>"6 orders filled! Word is spreading, sailor. Shoppers trust us now." Drizzle hands you 300 coins from the market's savings, and from now on your crate pays 10% more.</p>`}`, 'Okay', marketDay);
    marketDay(); });
}
// --- Founding Gardeners: tester codes, gifts, missions, quick reactions, and the thank-you wall ---
async function redeemTester(code) {
  const res = await api('/redeem', { key:S.syncKey, code:String(code).toUpperCase().trim() });
  if (!res.ok) return res.error === 'used' ? 'That code was already used by someone else.' : res.error === 'has a code' ? 'This game already has a founder code, so it can\'t use another one.' : res.error === 'not found' || res.error === 'bad code' ? 'That code does not look right. Check it and try again.' : 'Could not reach Sky Garden. Check your internet and try again.';
  const first = !S.founder; S.founder = { code:String(code).toUpperCase().trim(), at:Date.now() }; S.missions = S.missions || {}; save(); drawHud();
  if (first) { S.founder.day0 = playDays(); save(); setTimeout(founderDrip, 2000); } return null;
}
// --- opening presents: tap a wrapped box, it shakes, the lid pops, confetti flies, and the gift rises out ---
function openPresents(gifts, done) {
  const ov = document.createElement('div'); ov.className = 'presents'; document.body.appendChild(ov);
  const cv = document.createElement('canvas'); cv.className = 'confetti'; ov.appendChild(cv); const g = cv.getContext('2d');
  let bits = [], raf; const size = () => { cv.width = innerWidth; cv.height = innerHeight; }; size();
  const pop = (x, y, colors) => { for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9; bits.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 6, r:Math.random() * 6.3, vr:(Math.random() - .5) * .4, w:5 + Math.random() * 6, c:colors[i % colors.length], life:1 }); } };
  const tick = () => { g.clearRect(0, 0, cv.width, cv.height); bits = bits.filter(b => b.life > 0);
    bits.forEach(b => { b.vy += .28; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life -= .008; g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.globalAlpha = Math.min(1, b.life * 2); g.fillStyle = b.c; g.fillRect(-b.w/2, -b.w/4, b.w, b.w/2); g.restore(); });
    raf = requestAnimationFrame(tick); }; tick();
  let i = 0;
  const show = () => {
    const gf = gifts[i], wrap = gf.wrap || ['#ff8fa3','#ffc857'];
    ov.querySelectorAll('.pstage').forEach(e => e.remove());
    const st = document.createElement('div'); st.className = 'pstage';
    st.innerHTML = `<div class="pcount">${gifts.length > 1 ? `Gift ${i + 1} of ${gifts.length}` : 'A gift for you'}</div>
      <div class="pbox" style="--w1:${wrap[0]};--w2:${wrap[1]}"><div class="plid"><i class="bow"></i></div><div class="pbody"></div><div class="prays"></div><div class="pitem">${gf.icon}</div></div>
      <div class="ptext"><h2>${gf.title}</h2><p>${gf.text}</p></div><div class="phint">Tap the present to open it</div><button class="pnext">${i < gifts.length - 1 ? 'Next gift' : (gf.last || 'Yay!')}</button>`;
    ov.appendChild(st);
    const box = st.querySelector('.pbox'); let opened = false, taps = 0;
    box.onclick = () => { if (opened) return; taps++;
      if (taps === 1 && gifts.length) { box.classList.add('wiggle'); tone(700, { dur:.08, vol:.03 }); setTimeout(() => box.classList.remove('wiggle'), 350); st.querySelector('.phint').textContent = 'Tap again!'; return; }
      opened = true; box.classList.add('open'); st.classList.add('opened'); try { navigator.vibrate && navigator.vibrate([20, 40, 30]); } catch {}
      const r = box.getBoundingClientRect(); pop(r.left + r.width / 2, r.top + r.height * .35, ['#ff8fa3','#ffc857','#8fdc8a','#7ec8e3','#c9b6ff','#ffffff']);
      tone(300, { to:900, dur:.25, vol:.06 }); [523,659,784,1047,1319].forEach((f,k) => setTimeout(() => chime(f), 180 + k*90)); };
    st.querySelector('.pnext').onclick = () => { if (!opened) { box.onclick(); box.onclick(); return; } i++; if (i < gifts.length) show(); else { cancelAnimationFrame(raf); ov.classList.add('bye'); setTimeout(() => { ov.remove(); done && done(); }, 300); } };
  };
  addEventListener('resize', size); show();
}
// Founder gifts arrive one at a time over the first days, so each one is a surprise and nothing piles up.
const F_GIFTS = {
  pet:{ icon:'🐾', title:'A companion!', text:'A little friend who follows you everywhere. Who will it be?', wrap:['#8fdc8a','#fff6e6'], last:'Choose my companion' },
  outfit:{ icon:'🧥', title:'The Sky Pioneer outfit', text:'A flight jacket, a long scarf that trails in the wind, and an aviator cap with goggles. To wear it, tap Bag, then Settings, then Change my look, then Clothes.', wrap:['#7ec8e3','#fff1d6'] },
  balloon:{ icon:'🎈', title:'Your own hot-air balloon', text:'It flies you to any island you have opened. Tap the 🎈 on your hotbar.', wrap:['#ffc857','#ff8fa3'] },
  lantern:{ icon:'🏮', title:"The Founder's Lantern", text:'A glowing lantern for your island. At night, fireflies gather around it. Tap Build to place it.', wrap:['#c9b6ff','#ffe07a'] },
  missions:{ icon:'✦', title:'Missions', text:'Tap ✦ Missions at the top of your screen. They are things we would love you to try. Each one pays 50 coins.', wrap:['#ffe07a','#c9b6ff'] },
};
function fGot(k) { if (S.founder && !S.fGot && S.founderBalloon) S.fGot = ['pet','outfit','balloon','lantern','missions','testisland']; return (S.fGot || []).includes(k); } // older founder saves already had everything
function fDay() { return S.founder ? playDays() - (S.founder.day0 != null ? S.founder.day0 : playDays() - 1) + 1 : 0; }
function founderDrip() { if (!founderOn() || VISIT || TESTSLOT || PREVIEW) return;
  const busy = !S.setupDone || S.tut !== 9 || !quiet(); if (busy) { if (S.tut === 9) setTimeout(founderDrip, 4000); return; }
  const d = fDay(), give = (keys, head, body, then) => { S.fGot = [...(S.fGot || []), ...keys]; save(); showCard(`<div class="kicker">✦ FOUNDING GARDENER ✦</div><h2>${head}</h2><p>${body}</p>`, 'Open it', () => openPresents(keys.filter(k => F_GIFTS[k]).map(k => F_GIFTS[k]), () => { const tip = () => { if (!S.giftTipSeen) { S.giftTipSeen = true; save(); toast('See all your founder gifts anytime: tap Bag, then Founder gifts.'); } }; then ? then(tip) : tip(); })); };
  if (!fGot('pet')) return give(['pet'], 'Welcome, founder!', 'You were invited in before anyone else. Very few people have walked this island yet. We wrapped something for you, and more is on the way.', tip => choosePet(tip));
  if (d >= 2 && !fGot('outfit')) return give(['outfit', 'missions'], 'Another present!', '2 founder gifts for your second day.', tip => { drawHud(); tip(); });
  if (BALLOON_ON && d >= 3 && !fGot('balloon')) return give(['balloon'], 'A present for day 3!', 'This one is big.', tip => { S.founderBalloon = true; save(); drawBalloon(); drawHud(); tip(); });
  if (d >= 4 && (S.home || 0) >= 3 && !fGot('lantern')) return give(['lantern'], 'A present for your new home', 'Your hut is rebuilt. Here is something to light it up.', tip => { drawHud(); tip(); });
  if (!S.giftsSeen && (S.fGot || []).length > 1 && !(mythOn() && !mp().revealed)) { S.giftsSeen = true; save(); openFounderGifts(); } // once: founders who already opened gifts see what they have and how to use each
}
addEventListener('sg-playing', () => setTimeout(founderDrip, 4000));
// testers can nap from the start: a hammock already hangs between the 2 trees behind the garden
addEventListener('sg-playing', () => { if (!founderOn() || S.fHammock || VISIT || TESTSLOT) return; S.fHammock = true;
  if (!(S.builds || []).some(b => b.len)) { S.builds = [...(S.builds || []), { p:'hammock', x:6.25, z:-3.25, a:-Math.atan2(3, 1.5), len:3.354 }]; drawBuilds(); }
  S.fGot = [...new Set([...(S.fGot || []), 'hammock'])]; save(); });
function testerCodeCard() {
  showCard(`<div class="kicker">TESTER CODE</div><h2>Enter your code</h2><p>If Sky Garden sent you a tester code, type it here. It looks like SKY-AB12-CD34.</p>
    <input id="tcIn" maxlength="13" placeholder="SKY-XXXX-XXXX" class="numin" style="width:100%;text-transform:uppercase;font-size:18px;margin-top:8px"><p id="tcMsg" style="min-height:22px;font-weight:700;margin-top:6px"></p><button id="tcGo">Use my code</button>`, 'Cancel', openBag);
  $('tcGo').onclick = async () => { $('tcMsg').textContent = 'Checking...'; const err = await redeemTester($('tcIn').value); if (err) $('tcMsg').textContent = err; else { $('tcMsg').textContent = 'Your code worked!'; setTimeout(() => { if ($('tcMsg')) hideCard(); }, 1200); } };
}
{ const tc = new URLSearchParams(location.search).get('tester'); if (tc && !VISIT) { history.replaceState(null, '', location.pathname); addEventListener('sg-playing', () => setTimeout(async () => { const err = await redeemTester(tc); if (err && !S.founder) toast(err); }, 1500), { once:true }); } }
// missions: shown only to founders, checked every time the screen updates
function missionList() { return MISSIONS.filter(m => !m.feature || featureOn(m.feature)); }
var reactQueue = [];
function missionCheck() {
  if (!founderOn() || paused('missions') || VISIT) return; S.missions = S.missions || {};
  missionList().forEach(m => { if (!S.missions[m.id] && m.done(S)) { S.missions[m.id] = S.day; S.coins += 50; save(); drawHud(); reactQueue.push(m); } });
  if (reactQueue.length && !cine && quiet()) { chime(988); askReaction(reactQueue.shift()); }
}
function askReaction(m) {
  if ($('veil').classList.contains('show')) { reactQueue.unshift(m); return; }
  showCard(`<div class="kicker">✦ MISSION DONE: +50 COINS</div><h2>${m.title}</h2><p>How did that feel?</p>
    <div class="steppers" style="justify-content:flex-start;margin-top:10px">${[['love','Loved it'],['okay','It was okay'],['confused','Confusing']].map(([k,l]) => `<button data-rx="${k}" class="ghost">${l}</button>`).join('')}</div>`, 'Skip');
  document.querySelectorAll('[data-rx]').forEach(b => b.onclick = () => { api('/feedback', { mood:b.dataset.rx, text:'', where:`Mission: ${m.title}`, day:S.day, player:S.syncKey }); hideCard(); helperGrow(); });
}
function openMissions() {
  const list = missionList(), done = list.filter(m => S.missions?.[m.id]).length;
  showCard(`<div class="kicker">✦ MISSIONS</div><h2>${done} of ${list.length} done</h2><p>Things we would love you to try. Each pays 50 coins.</p>
    <button id="myGifts">🎁 My founder gifts</button>
    <div class="jlist">${list.map(m => `<button class="${S.missions?.[m.id] ? 'mdone' : ''}">${S.missions?.[m.id] ? '✓ ' : ''}${m.title}<span class="sub"> ${m.how}</span></button>`).join('')}</div>`, 'Close');
  $('myGifts').onclick = () => openFounderGifts(openMissions);
}
// every founder gift you have, and exactly how to use it (gifts still on the way are not named: they stay a surprise)
const GIFT_HOW = [
  ['pet', '🐾', 'Your companion', 'It follows you everywhere. Tap it to give it a pat.'],
  ['missions', '✦', 'Tester missions', 'Tap ✦ Missions at the top of your screen. Each one pays 50 coins.'],
  ['hammock', '😴', 'A hammock', 'It hangs between the 2 trees behind your garden. Tap it to take a nap and skip ahead in the day.'],
  ['outfit', '🧥', 'The Sky Pioneer outfit', 'Tap Bag, then Settings, then Change my look, then Clothes.'],
  ['lantern', '🏮', "The Founder's Lantern", 'Tap Build, pick Founder\'s Lantern, and tap a square. Fireflies gather around it at night.'],
];
function openFounderGifts(back) { const have = GIFT_HOW.filter(g => fGot(g[0]));
  showCard(`<div class="kicker">✦ FOUNDING GARDENER ✦</div><h2>Your founder gifts</h2>
    <div class="jlist">${have.map(([, ic, name, how]) => `<button><span style="font-size:20px">${ic}</span> ${name}<span class="sub"><br>${how}</span></button>`).join('')}</div>
    ${have.length < GIFT_HOW.length ? '<p style="margin-top:10px">More gifts are on the way over your first days.</p>' : ''}`, back ? 'Back' : 'Close', back); }
// the Founding Gardeners wall on every island
const foundersWall = new THREE.Group(); foundersWall.position.set(-7.2, 0, -3.8); foundersWall.rotation.y = .9; scene.add(foundersWall); lateClicks.push(foundersWall);
{ const w = mat(0xc98f58), gold = mat(0xd9a441, { metalness:.5, roughness:.4 });
  [-.7,.7].forEach(x => foundersWall.add(mesh(new THREE.CylinderGeometry(.06,.07,1.6,8), w, x, .8, 0)));
  foundersWall.add(mesh(new THREE.BoxGeometry(1.7,.9,.1), mat(0xfff1d6), 0, 1.15, .02)); foundersWall.add(mesh(new THREE.BoxGeometry(1.8,.1,.14), gold, 0, 1.65, .02));
  { const f = boardFace('Founding Gardeners', 1.6, .8, 'founders'); f.position.set(0, 1.15, .075); foundersWall.add(f); }
  foundersWall.add(mesh(new THREE.OctahedronGeometry(.1), glow(0xc9b6ff), 0, 1.85, .02));
  const hb = hitBox(1.9, 1.9, .6); hb.position.y = 1; foundersWall.add(hb); foundersWall.userData.kind = 'deco'; foundersWall.userData.use = openWall; }
function drawWall() { foundersWall.visible = featureOn('founders') && !VISIT; }
drawWall();
async function openWall() {
  showCard(`<div class="kicker">✦ THE FOUNDING GARDENERS ✦</div><h2>Thank you</h2><p>These are the first people who played Sky Garden and helped build it.</p><p id="wallNames" style="margin-top:8px">Loading...</p>`, 'Close');
  const res = await api('/founders'); if (!$('wallNames')) return;
  $('wallNames').innerHTML = res.ok && res.names.length ? `<div class="wallnames">${res.names.map(n => `<span>✦ ${esc(n)}</span>`).join('')}</div>` : res.ok ? 'The first founders are joining now.' : 'Could not load the wall right now.';
}
// --- Town Hall: every player gets 1 vote per question on what gets built next ---
const townHall = new THREE.Group(); townHall.position.set(-4.6, 0, -6.2); townHall.rotation.y = .5; scene.add(townHall); lateClicks.push(townHall);
{ const w = mat(0x9b6b4a); [-.8,.8].forEach(x => townHall.add(mesh(new THREE.CylinderGeometry(.07,.08,1.9,8), w, x, .95, 0)));
  townHall.add(mesh(new THREE.BoxGeometry(1.9,1.1,.12), mat(0xc98f58), 0, 1.3, 0)); const roof = mesh(new THREE.ConeGeometry(1.35,.5,4), mat(0xff8fa3), 0, 2.1, 0); roof.rotation.y = Math.PI/4; roof.scale.z = .35; townHall.add(roof);
  [[-.5,1.45,0xfff1d6],[.1,1.2,0xfff3a0],[.55,1.5,0xdff3ff],[-.3,1.05,0xffd1dc]].forEach(([x,y,c]) => { const pp = mesh(new THREE.BoxGeometry(.42,.34,.02), mat(c), x, y, .08); pp.rotation.z = (x * 7 % 1) * .3 - .15; townHall.add(pp); });
  const hb = hitBox(2, 2.3, .8); hb.position.y = 1.1; townHall.add(hb); townHall.userData.kind = 'deco'; townHall.userData.use = () => openTownHall(); }
function drawTownHall() { townHall.visible = false; } // Town Hall votes live on the Town Square's notice board now, so there's one board
drawTownHall();
async function openTownHall() {
  showCard(`<div class="kicker">TOWN HALL</div><h2>What should we build next?</h2><p>Loading the vote...</p>`, 'Close');
  const res = await api(`/polls?key=${S.syncKey}`); if (!$('card')) return;
  if (!res.ok) { showCard(`<div class="kicker">TOWN HALL</div><h2>The Town Hall is closed</h2><p>Could not reach the town board. Check your internet and try again.</p>`, 'Close'); return; }
  if (!res.polls.length) { showCard(`<div class="kicker">TOWN HALL</div><h2>No vote right now</h2><p>Check back soon. When there is a new question, everyone gets 1 vote.</p>`, 'Close'); return; }
  const label = a => a === 'keepers' ? "✦ KEEPERS' COUNCIL" : a === 'elders' ? '✦ ELDERS\' COUNCIL' : 'EVERYONE VOTES';
  showCard(`<div class="kicker">TOWN HALL</div><h2>Your voice</h2>${res.polls.map(p => { const total = p.counts.reduce((a, b) => a + b, 0) || 1, voted = p.mine != null;
    return `<h4>${label(p.audience)}</h4><p><b>${esc(p.question)}</b></p><div class="jlist">${p.options.map((o, i) => voted ? `<div class="pollrow ${p.mine === i ? 'mine' : ''}"><span>${esc(o)}${p.mine === i ? ' (your vote)' : ''}</span><i style="width:${Math.round(p.counts[i] / total * 100)}%"></i><b>${p.counts[i]}</b></div>`
      : `<button data-vote="${p.id}:${i}" data-aud="${p.audience}">${esc(o)}</button>`).join('')}</div>`; }).join('')}`, 'Close');
  document.querySelectorAll('[data-vote]').forEach(b => b.onclick = async () => { const [pid, ch] = b.dataset.vote.split(':').map(Number), r = await api('/vote', { key:S.syncKey, poll:pid, choice:ch });
    if (r.ok || r.status === 409) { sfx('heart'); helperGrow(); if (b.dataset.aud !== 'all') { kp().voted = true; save(); } openTownHall(); } else if (r.error !== 'test island') toast(r.status === 403 ? 'Your vote is paused right now.' : 'Could not send your vote. Try again.'); });
}
// --- the Helper Tree: grows once a day when you help make Sky Garden better. Honest notes count the same as nice ones. ---
const helperTree = new THREE.Group(); helperTree.position.set(2.6, 0, -3.9); scene.add(helperTree); lateClicks.push(helperTree);
function drawHelperTree() {
  helperTree.children.slice().forEach(c => helperTree.remove(c)); helperTree.visible = featureOn('helpertree') && !VISIT; if (!helperTree.visible) return;
  const st = Math.min(6, (S.helper || {}).stage || 0), k = .45 + st * .11, founder = !!S.founder, bloomA = founder ? 0xc9b6ff : 0xffb3c6, bloomB = founder ? 0xffe07a : 0xffffff;
  helperTree.add(mesh(new THREE.CylinderGeometry(.08*k, .14*k, 1.3*k, 8), mat(0x9b6b4a), 0, .65*k, 0));
  const crown = new THREE.Group(); crown.position.y = 1.3*k; helperTree.add(crown);
  [[0,.3,0,.55],[.4,.1,.2,.4],[-.38,.15,-.15,.42],[.1,.55,-.1,.38]].slice(0, 1 + Math.min(3, st)).forEach(([x,y,z,r]) => crown.add(mesh(sph(r*k*1.4), mat(0x6fcf7a), x*k*1.4, y*k*1.4, z*k*1.4)));
  if (st >= 3) for (let i = 0; i < (st - 2) * 10; i++) { const a = i * 2.4, rr = .75*k*1.4; crown.add(mesh(sph(.13), mat(i % 3 ? bloomA : bloomB), Math.cos(a)*rr*.8, .2 + (i % 5)*.12*k, Math.sin(a)*rr*.8)); }
  if (st >= 6) { const h = halo(founder ? 0xc9b6ff : 0xffd1dc, 3, .5); h.position.y = 1.6*k; helperTree.add(h); }
  const hb = hitBox(1.4, 2.4, 1.4); hb.position.y = 1; helperTree.add(hb); helperTree.userData.kind = 'deco'; helperTree.userData.use = openHelperTree;
}
function helperGrow() { if (!featureOn('helpertree')) return; S.helper = S.helper || { stage:0, day:-1 }; if (S.helper.day === S.day || S.helper.stage >= 6) return;
  S.helper.day = S.day; S.helper.stage++; save(); drawHelperTree(); burst(helperTree.position.clone().setY(1.5), S.founder ? 0xc9b6ff : 0xffb3c6, 18); setTimeout(() => toast('Your Helper Tree grew! Thank you for helping build Sky Garden.'), 1200); }
function openHelperTree() { const st = (S.helper || {}).stage || 0, today = (S.helper || {}).day === S.day;
  showCard(`<div class="kicker">HELPER TREE</div><h2>${st >= 6 ? 'In full bloom!' : `Growing: stage ${st} of 6`}</h2>
    <p>This tree grows when you help make Sky Garden better, once a day at most.${S.founder ? ' As a Founding Gardener, yours blooms in founder violet and gold.' : ''}</p>
    <h4>Ways to help</h4><p>• Send a note with the pink Feedback button. Honest notes count the same as nice ones.</p><p>• Vote on the Town Square notice board. Tap Town Hall votes.</p>${S.founder ? '<p>• Answer a quick question after a tester mission.</p>' : ''}
    <p style="margin-top:8px"><b>${st >= 6 ? 'It cannot grow any bigger. Thank you!' : today ? 'It already grew today. Come back tomorrow.' : 'It is ready to grow today.'}</b></p>`, 'Close'); }
drawHelperTree();
// ============ FOUNDER COMPANION ============
const petGroup = new THREE.Group(); scene.add(petGroup); lateClicks.push(petGroup);
var pet = null; // var: the game loop can start before this part loads
function petModel(kind) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const M = mat;
  const eye = (x, y, z, r = .045) => { body.add(mesh(sph(r), M(0x2b2233, { roughness:.2 }), x, y, z)); body.add(mesh(sph(r * .35), glow(0xffffff), x + r*.3, y + r*.35, z + r*.7)); };
  if (kind === 'fox') { const fur = M(0xf2d29b), cream = M(0xfff6e6);
    const b = mesh(sph(.2), fur, 0, .22, 0); b.scale.set(.85, .8, 1.15); body.add(b); body.add(mesh(sph(.13), cream, 0, .2, .12));
    const h = mesh(sph(.17), fur, 0, .44, .14); body.add(h); body.add(mesh(sph(.08), cream, 0, .4, .27)); body.add(mesh(sph(.025), M(0x2b2233), 0, .42, .34));
    [-1,1].forEach(sd => { const e = mesh(new THREE.ConeGeometry(.08,.26,8), fur, sd*.1, .64, .1); e.rotation.z = -sd*.35; body.add(e); const ei = mesh(new THREE.ConeGeometry(.045,.18,8), M(0xffc4a3), sd*.1, .63, .115); ei.rotation.z = -sd*.35; body.add(ei); eye(sd*.065, .47, .28); });
    const t = mesh(new THREE.CapsuleGeometry(.06,.2,4,8), fur, 0, .3, -.28); t.rotation.x = -1; body.add(t); body.add(mesh(sph(.065), cream, 0, .38, -.38)); body.userData.tail = t; }
  if (kind === 'panda') { const fur = M(0xc2562b), dark = M(0x3b2a26), white = M(0xfff6e6);
    const b = mesh(sph(.2), fur, 0, .22, 0); b.scale.set(.9, .85, 1.1); body.add(b); [-1,1].forEach(sd => body.add(mesh(new THREE.CylinderGeometry(.045,.05,.14,8), dark, sd*.1, .07, .08)));
    const h = mesh(sph(.17), fur, 0, .46, .12); body.add(h); body.add(mesh(sph(.085), white, 0, .42, .24)); body.add(mesh(sph(.025), dark, 0, .43, .32));
    [-1,1].forEach(sd => { body.add(mesh(sph(.05), white, sd*.1, .52, .23)); body.add(mesh(sph(.07), fur, sd*.13, .62, .08)); body.add(mesh(sph(.045), white, sd*.13, .62, .11)); eye(sd*.07, .48, .27); });
    const t = new THREE.Group(); t.position.set(0, .25, -.2); body.add(t); for (let i = 0; i < 5; i++) t.add(mesh(sph(.065 - i*.004), i % 2 ? white : fur, 0, i*.02, -i*.07)); body.userData.tail = t; }
  if (kind === 'owl') { const down = M(0xf3e6cf), face = M(0xfffaf0), buff = M(0xe0b97e);
    const b = mesh(sph(.24), down, 0, .3, 0); b.scale.set(1, 1.05, .95); body.add(b); const f = mesh(sph(.17), face, 0, .36, .14); f.scale.set(1.1, 1.15, .6); body.add(f);
    [-1,1].forEach(sd => { eye(sd*.07, .38, .23, .055); const w = mesh(sph(.12), buff, sd*.2, .28, -.02); w.scale.set(.4, 1, .9); body.add(w); body.userData['wing' + sd] = w; body.add(mesh(new THREE.ConeGeometry(.035,.08,6), buff, sd*.14, .54, .05)); });
    const bk = mesh(new THREE.ConeGeometry(.03,.07,6), M(0xffb347), 0, .32, .26); bk.rotation.x = Math.PI/2 + .3; body.add(bk); [-1,1].forEach(sd => body.add(mesh(sph(.035), M(0xffb347), sd*.07, .08, .08)));
    body.userData.owl = true; }
  const hb = hitBox(.7, .8, .7); hb.position.y = .35; g.add(hb); g.scale.setScalar(1.45); g.userData = { kind:'pet', body }; return g;
}
function drawPet() { petGroup.children.slice().forEach(c => petGroup.remove(c)); pet = null;
  if (!S.pet || VISIT) return; pet = petModel(S.pet.kind); petGroup.add(pet); pet.position.copy(player.position).add(new THREE.Vector3(.8, 0, -.6));
  pet.userData.idle = 0; pet.userData.chase = null; pet.userData.happy = 0; pet.userData.nextChase = 8; }
function petHappy() { if (pet) pet.userData.happy = 1.2; }
function petPet() { if (!pet) return; petHappy(); burst(pet.position.clone().setY(.8), 0xff8fa3, 10); tone(1175, { dur:.1, vol:.04 }); tone(1568, { t:.1, dur:.15, vol:.035 });
  const C = COMPANIONS[S.pet.kind]; S.petPets = (S.petPets || 0) + 1; save();
  if (S.petPets === 1) showCard(`<div class="kicker">${esc(S.pet.name).toUpperCase()}</div><h2>Your ${C.name.toLowerCase()}</h2><h4>In real life</h4><p>${C.fact}</p>`); else toast(`${S.pet.name} loves that!`); }
function updatePet(dt, now, moving) {
  if (!pet) return; const u = pet.userData, b = u.body, p = pet.position, pp = player.position;
  if (p.distanceTo(pp) > 12 || Math.abs(p.y - pp.y) > 3) { p.copy(pp).add(new THREE.Vector3(.8, 0, -.6)); }
  const back = new THREE.Vector3(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y)).multiplyScalar(-.45), side = new THREE.Vector3(Math.cos(player.rotation.y), 0, -Math.sin(player.rotation.y)).multiplyScalar(1.05);
  let goal = pp.clone().add(back).add(side);
  u.nextChase -= dt;
  if (!u.chase && u.nextChase <= 0 && typeof butterflies !== 'undefined') { u.nextChase = 9 + Math.random() * 8; const bf = butterflies.find(x => x.visible && x.position.distanceTo(p) < 5); if (bf) u.chase = { t:1.6, bf }; }
  if (u.chase) { u.chase.t -= dt; goal = u.chase.bf.position.clone().setY(pp.y); if (u.chase.t <= 0) u.chase = null; }
  const d = goal.clone().sub(p); d.y = 0; const dist = d.length(), fast = dist > 3 ? 5.5 : u.chase ? 4.6 : 3.4;
  const walking = dist > .25;
  if (walking) { d.normalize().multiplyScalar(Math.min(dist, fast * dt)); p.add(d); pet.rotation.y = Math.atan2(d.x, d.z); p.y += (pp.y - p.y) * Math.min(1, dt * 6); u.idle = 0; }
  else { u.idle += dt; pet.rotation.y += (Math.atan2(pp.x - p.x, pp.z - p.z) - pet.rotation.y) * Math.min(1, dt * 3); }
  const nightNap = hour() >= 21 && u.idle > 6;
  if (u.happy > 0) { u.happy -= dt; b.position.y = Math.abs(Math.sin(now * 12)) * .25; b.rotation.y = u.happy * 5; }
  else if (b.userData.owl) { b.position.y = .55 + Math.sin(now * (walking ? 10 : 2)) * (walking ? .08 : .03); b.rotation.y = 0;
    [-1,1].forEach(sd => { const w = b.userData['wing' + sd]; if (w) w.rotation.z = walking ? Math.sin(now * 20) * sd * .9 : 0; }); if (nightNap) b.position.y = .05; }
  else { b.rotation.y = 0; b.position.y = walking ? Math.abs(Math.sin(now * 11)) * .09 : 0; b.scale.y = nightNap ? .7 : u.idle > 4 ? .9 : 1; b.rotation.z = nightNap ? .9 : 0;
    if (b.userData.tail) b.userData.tail.rotation.y = Math.sin(now * (walking ? 9 : 3)) * .5; }
}
drawPet();
function choosePet(done) {
  const kid = ageBand() === 'kid';
  const face = k => ({ fox:`<svg width="70" height="70" viewBox="0 0 100 100"><path d="M18 20 L38 52 L22 58 Z M82 20 L62 52 L78 58 Z" fill="#f2d29b"/><circle cx="50" cy="60" r="28" fill="#f2d29b"/><ellipse cx="50" cy="72" rx="15" ry="11" fill="#fff6e6"/><circle cx="40" cy="56" r="5" fill="#2b2233"/><circle cx="60" cy="56" r="5" fill="#2b2233"/><circle cx="50" cy="68" r="3.5" fill="#2b2233"/></svg>`,
    panda:`<svg width="70" height="70" viewBox="0 0 100 100"><circle cx="26" cy="34" r="12" fill="#c2562b"/><circle cx="74" cy="34" r="12" fill="#c2562b"/><circle cx="26" cy="34" r="6" fill="#fff6e6"/><circle cx="74" cy="34" r="6" fill="#fff6e6"/><circle cx="50" cy="58" r="30" fill="#c2562b"/><ellipse cx="50" cy="70" rx="14" ry="10" fill="#fff6e6"/><circle cx="37" cy="46" r="7" fill="#fff6e6"/><circle cx="63" cy="46" r="7" fill="#fff6e6"/><circle cx="39" cy="55" r="5" fill="#2b2233"/><circle cx="61" cy="55" r="5" fill="#2b2233"/><circle cx="50" cy="66" r="3.5" fill="#2b2233"/></svg>`,
    owl:`<svg width="70" height="70" viewBox="0 0 100 100"><ellipse cx="50" cy="58" rx="32" ry="34" fill="#e0b97e" stroke="#9b7b5a" stroke-width="3"/><path d="M50 32 C28 30 22 52 34 66 C42 74 58 74 66 66 C78 52 72 30 50 32 Z" fill="#fffaf0"/><circle cx="40" cy="52" r="7" fill="#2b2233"/><circle cx="60" cy="52" r="7" fill="#2b2233"/><path d="M47 60 L53 60 L50 67 Z" fill="#ffb347"/></svg>` })[k];
  let pick = 'fox';
  const draw = () => { showCard(`<div class="kicker">✦ YOUR COMPANION</div><h2>Who will come with you?</h2><p>A little friend who follows you everywhere. Pick 1.</p>
    <div class="petpick">${Object.entries(COMPANIONS).map(([k, c]) => `<button data-pk="${k}" class="${pick === k ? 'on' : ''}">${face(k)}<b>${c.name}</b></button>`).join('')}</div>
    <h4>Name them</h4>${kid ? `<select id="petName">${KID_PET_NAMES.map(n => `<option>${n}</option>`).join('')}</select>` : `<input id="petName" maxlength="14" placeholder="Like Biscuit" class="numin" style="width:100%">`}
    <button id="petGo">Welcome home!</button>`, null);
    document.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => { const nm = $('petName').value; pick = b.dataset.pk; draw(); $('petName').value = nm; });
    $('petGo').onclick = () => { const nm = String($('petName').value || '').replace(/[^\p{L} '-]/gu, '').trim().slice(0, 14) || KID_PET_NAMES[Math.floor(Math.random() * KID_PET_NAMES.length)];
      S.pet = { kind:pick, name:nm, since:S.day }; save(); drawPet(); hideCard(); petHappy(); burst(pet.position.clone().setY(.6), 0xffc857, 24); [659,784,988,1319].forEach((f,i) => setTimeout(() => chime(f), i*120));
      toast(`${nm} the ${COMPANIONS[pick].name.toLowerCase()} is here! Tap ${nm} anytime to say hi.`); setTimeout(() => done && done(), 2600); }; };
  draw();
}
// ============ FOUNDER BALLOON: fly to any island you have opened ============
function makeBalloon() { const g = new THREE.Group(); const cols = [0xc9b6ff, 0xffe07a];
  for (let i = 0; i < 8; i++) { const lune = new THREE.Mesh(new THREE.SphereGeometry(1.1, 6, 16, i * Math.PI / 4, Math.PI / 4), mat(cols[i % 2])); lune.scale.set(1, 1.25, 1); lune.position.y = 3; g.add(lune); }
  g.add(mesh(new THREE.CylinderGeometry(.35, .6, .5, 16, 1, true), mat(0xc9b6ff), 0, 1.75, 0)); g.add(mesh(new THREE.CylinderGeometry(.45, .38, .45, 12), mat(0xa9744a), 0, .45, 0));
  [[.3,.3],[-.3,.3],[.3,-.3],[-.3,-.3]].forEach(([x,z]) => { const r = mesh(new THREE.CylinderGeometry(.012,.012,1.2,4), mat(0x6b4f3a), x*.9, 1.15, z*.9); g.add(r); });
  g.add(mesh(new THREE.OctahedronGeometry(.12), glow(0xffe07a), 0, 4.45, 0)); return g; }
const balloon = makeBalloon(); balloon.position.set(2.4, 0, -4.35); scene.add(balloon); lateClicks.push(balloon); // in the open behind the garden, clear of the wind bell
{ const hb = hitBox(1.6, 4.6, 1.6); hb.position.y = 2.2; balloon.add(hb); balloon.userData.kind = 'deco'; balloon.userData.use = () => balloonMenu(); }
var BALLOON_ON = false; // the hot-air balloon is retired for now: legends are how founders fly. It may come back later as an unlock for everyone.
function drawBalloon() { balloon.visible = BALLOON_ON && !!S.founderBalloon && !VISIT; }
drawBalloon();
function balloonMenu() {
  // the island you are standing on is left out: you are already there
  const C = { home:new THREE.Vector3(0, 0, 0), square:SQ, orchard:ORCH_POS, windmill:WIND_POS, night:NIGHT_POS, heart:OH, lighthouse:LH }, p = player.position;
  const here = S.where === 'hut' ? 'home' : Object.keys(C).sort((a, b) => Math.hypot(p.x - C[a].x, p.z - C[a].z) - Math.hypot(p.x - C[b].x, p.z - C[b].z))[0];
  const D = [['home','Home island', true], ['square','Town Square', squareOpen()], ['orchard','Orchard Isle', S.bridge], ['windmill','Windmill Isle', S.bridge2], ['night','Night Isle', S.q4 >= 1], ['heart','The Old Heart', S.q5 >= 1], ['lighthouse','Lighthouse Rock', keeperLevel() >= 2]].filter(d => d[2] && d[0] !== here);
  if (!D.length) return showCard(`<div class="kicker">✦ FOUNDER BALLOON</div><h2>Nowhere to fly yet</h2><p>Build a bridge to your first new island. Then your balloon can fly you there anytime.</p>`, 'Okay');
  showCard(`<div class="kicker">✦ FOUNDER BALLOON</div><h2>Where to?</h2><p>Your balloon flies you to any island you have opened.</p>
    <div class="jlist">${D.map(([k, n]) => `<button data-fly="${k}">🎈 ${n}</button>`).join('')}</div>`, 'Not now');
  document.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { hideCard(); balloonTo(b.dataset.fly); });
}
async function balloonTo(where) {
  if (cine) return; closeDialog(); target = null; pending = null; cine = { hold:true }; document.body.classList.add('in-cine');
  const V = (x, y, z) => new THREE.Vector3(x, y, z), fly = makeBalloon(); scene.add(fly);
  const start = player.position.clone(); fly.position.copy(start); if (pet) pet.visible = false; const ride = () => player.position.copy(fly.position).add(V(0, .25, 0));
  const rider = player.clone ? null : null; sfx('cast'); tone(200, { to:500, dur:1.5, vol:.05 });
  let t0 = performance.now(); const lift = () => { const k = (performance.now() - t0) / 3000; fly.position.y = start.y + Math.pow(Math.min(1, k), 1.6) * 9; fly.rotation.y += .004; ride(); if (k < 1.2 && fly.parent) requestAnimationFrame(lift); }; lift();
  await shot(3, camera.position.clone(), start.clone().add(V(6, 4, 8)), start.clone().setY(start.y + 1.5), start.clone().setY(start.y + 8));
  await fadeTo(true, false);
  const dest = { home:V(2.2, 0, -5.6), square:V(SQ.x - 1.2, SQ.y, SQ.z + 3.4), orchard:V(ORCH_POS.x + 1, ORCH_POS.y, ORCH_POS.z + 1.5), windmill:V(WIND_POS.x, WIND_POS.y, WIND_POS.z + 2.5), night:V(NIGHT_POS.x, NIGHT_POS.y, NIGHT_POS.z + 2), heart:V(OH.x + 7.2, OH.y, OH.z + .8), lighthouse:V(LH.x - .2, LH.y, LH.z + 2) }[where];
  S.where = 'home'; fly.position.copy(dest).setY(dest.y + 8); ride(); save();
  camera.position.copy(dest.clone().add(V(6, 5, 8))); cine = { t:0, dur:.01, p0:camera.position.clone(), p1:camera.position.clone(), l0:dest.clone().setY(dest.y + 5), l1:dest.clone().setY(dest.y + 5), res:() => {} };
  await wait(300); await fadeTo(false, false);
  t0 = performance.now(); const land = () => { const k = Math.min(1, (performance.now() - t0) / 2600); fly.position.y = dest.y + 8 * (1 - easeIO(k)); ride(); if (k < 1 && fly.parent) requestAnimationFrame(land); }; land();
  await shot(2.6, camera.position.clone(), dest.clone().add(V(4, 3, 6)), dest.clone().setY(dest.y + 5), dest.clone().setY(dest.y + .8));
  player.position.copy(dest).add(V(1.1, 0, .6)); if (pet) { pet.visible = true; pet.position.copy(dest).add(V(.8, 0, -.6)); petHappy(); } burst(dest.clone().setY(dest.y + .6), 0xffe07a, 18); chime(784); chime(1047);
  t0 = performance.now(); const away = () => { const k = (performance.now() - t0) / 2500; fly.position.y = dest.y + k * 12; fly.position.x += .01; if (k < 1) requestAnimationFrame(away); else scene.remove(fly); }; away();
  cine = null; document.body.classList.remove('in-cine'); snapCam();
  if (where === 'heart' && S.q5 === 1) { S.q5 = 2; save(); drawHud(); setTimeout(() => toast('The Old Heart. Tap the fallen bell in the middle.'), 700); }
  if (!S.balloonFact) { S.balloonFact = true; save(); setTimeout(() => showCard(`<div class="kicker">FIRST FLIGHT</div><h2>People first flew in a balloon</h2><h4>In real life</h4><p>${BALLOON_FACT}</p>`), 900); }
}
// --- save files (testers): up to 4 separate games on this device. File 1 is the one that backs up to the cloud. ---
const FILE_IDS = ['main', 'f2', 'f3', 'f4'], fileKey = id => id === 'main' ? SAVE_KEY : 'sg.save.' + id, fileNow = FILE || 'main';
const readFile = id => { try { return JSON.parse(localStorage.getItem(fileKey(id)) || 'null'); } catch { return null; } };
const canFiles = () => !VISIT && !TESTSLOT && (!!FILE || !!(readFile('main') || {}).founder);
const fileChapter = d => !d.created ? 'Not started' : (d.tut || 0) < 9 ? 'Getting started' : (d.quest || 0) < 5 ? 'Chapter 1' : (d.q2 || 0) < 5 ? 'Chapter 2' : (d.q3 || 0) < 7 ? 'Chapter 3' : (d.q4 || 0) < 5 ? 'Chapter 4' : (d.q5 || 0) < 6 ? 'Chapter 5' : 'Rebuilding the village';
function goFile(id) { try { if (playing) save(); localStorage.setItem('sg.profile', id); } catch {} location.reload(); }
function openFiles(back) {
  const rows = FILE_IDS.map((id, i) => [id, i + 1, readFile(id)]).filter(([id, , d]) => d || id === 'main'), free = FILE_IDS.find(id => id !== 'main' && !readFile(id));
  showCard(`<div class="kicker">SAVE FILES</div><h2>Pick a game</h2><div class="jlist">${rows.map(([id, n, d]) => { d = d || {}; return `<button data-file="${id}" class="craft">File ${n}${d.name ? ': ' + esc(d.name) : ''} <span class="sub">${id === fileNow ? 'Playing now' : `Day ${d.day || 1}, ${fileChapter(d)}, ${d.coins || 0} coins`}</span></button>`; }).join('')}</div>
    ${free ? '<button id="fileNew">Start a new game</button> ' : ''}${rows.length > 1 ? '<button id="fileDel" class="ghost">Delete a file</button>' : ''}
    <p class="sub" style="margin-top:10px">File 1 backs up to the cloud. The other files stay on this device only.</p>`, back ? 'Back' : 'Close', back);
  document.querySelectorAll('[data-file]').forEach(b => { if (b.dataset.file !== fileNow) b.onclick = () => goFile(b.dataset.file); });
  if ($('fileNew')) $('fileNew').onclick = () => { const m = readFile('main') || {}; try { localStorage.setItem(fileKey(free), JSON.stringify({ founder:m.founder, trust:m.trust, south:m.south })); } catch {} goFile(free); }; // a new file starts the game from the beginning, as the same tester
  if ($('fileDel')) $('fileDel').onclick = () => { const extra = rows.filter(([id]) => id !== 'main');
    showCard(`<div class="kicker">SAVE FILES</div><h2>Delete which file?</h2><p>File 1 cannot be deleted here.</p><div class="jlist">${extra.map(([id, n, d]) => `<button data-del="${id}">File ${n}${d && d.name ? ': ' + esc(d.name) : ''}</button>`).join('')}</div>`, 'Back', () => openFiles(back));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const id = b.dataset.del, n = FILE_IDS.indexOf(id) + 1;
      showCard(`<div class="kicker">SAVE FILES</div><h2>Delete File ${n}?</h2><p>That game is gone for good. This cannot be undone.</p><button id="fileSure">Yes, delete File ${n}</button>`, 'Keep it', () => openFiles(back));
      $('fileSure').onclick = () => { try { localStorage.removeItem(fileKey(id)); } catch {} if (id === fileNow) { playing = false; try { localStorage.setItem('sg.profile', 'main'); } catch {} location.reload(); } else openFiles(back); }; }); };
}
{ const fb = $('filesTitle'); if (fb && canFiles()) { fb.hidden = false; fb.textContent = `Save files (File ${FILE_IDS.indexOf(fileNow) + 1})`; fb.onclick = () => openFiles(); } }
// --- the Test island: a sandbox for testers, with tester tools ---
function switchIsland() {
  if (TESTSLOT) { try { localStorage.setItem('sg.profile', 'main'); } catch {} location.reload(); return; }
  let has = null; try { has = localStorage.getItem('sg.save.test'); } catch {}
  const go = () => { try { localStorage.setItem('sg.profile', 'test'); } catch {} location.reload(); };
  if (has) return go();
  showCard(`<div class="kicker">🧪 TEST ISLAND</div><h2>Just for trying things</h2><p>A separate island. Skip days, get coins and materials, and try new things right away. Nothing you do there changes your real island.</p>
    <p style="margin-top:8px">How should it start?</p><button id="tFresh">Start fresh</button> <button id="tCopy" class="ghost">Copy my island</button>`, 'Not now');
  const founderBits = () => ({ trust:S.trust, founder:S.founder, founderBalloon:S.founderBalloon, pet:S.pet, missions:S.missions, look:S.look, birthday:S.birthday, name:S.name });
  $('tFresh').onclick = () => { try { localStorage.setItem('sg.save.test', JSON.stringify(founderBits())); } catch {} go(); };
  $('tCopy').onclick = () => { const copy = JSON.parse(JSON.stringify(S)); copy.syncKey = undefined; try { localStorage.setItem('sg.save.test', JSON.stringify(copy)); } catch {} go(); };
}
function testerTools() {
  showCard(`<div class="kicker">🧪 TEST ISLAND</div><h2>Tester tools</h2><p>Only on your test island. Your real island is safe.</p>
    <div class="jlist">
      <button data-tt="day">Skip to tomorrow <span class="sub">Crops grow, new day starts</span></button>
      <button data-tt="night">Jump to night <span class="sub">See stars, fireflies, night fish</span></button>
      <button data-tt="unlock">Next unlock day <span class="sub">Shows tomorrow's New today card</span></button>
      <button data-tt="all">Unlock everything that's released <span class="sub">No waiting for play days</span></button>
      <button data-tt="coins">Get 1,000 coins</button>
      <button data-tt="mats">Get 20 of every material</button>
      <button data-tt="seeds">Get 10 of every seed</button>
      <button data-tt="reset" class="ghost">Start my test island over</button>
    </div>`, 'Close');
  document.querySelectorAll('[data-tt]').forEach(b => b.onclick = () => { const t = b.dataset.tt; hideCard();
    if (t === 'day') return goSleep(S.where === 'hut' ? 'bed' : 'outside');
    if (t === 'night') { S.t = Math.max(S.t, .86); drawHud(); toast('It is night now.'); }
    if (t === 'unlock' || t === 'all') { S.bonusDays = t === 'all' ? 30 : (S.bonusDays || 0) + 1; S.newDay = t === 'unlock'; save(); if (t === 'unlock') maybeNewToday(); else { drawHud(); drawStations(); drawTradePlants(); drawStall(); spawnBugs(); drawPeople(); drawTownHall(); drawHelperTree(); toast('Everything released is unlocked on your test island.'); } }
    if (t === 'coins') { S.coins += 1000; toast('+1,000 coins'); }
    if (t === 'mats') { ['stick','stone','fiber','log','clay','brick','copper','tin','bronze'].forEach(k => S.bag[k] = (S.bag[k] || 0) + 20); toast('+20 of every material'); }
    if (t === 'seeds') { Object.keys(CROPS).forEach(k => S.seeds[k] = (S.seeds[k] || 0) + 10); toast('+10 of every seed'); }
    if (t === 'reset') { showCard(`<div class="kicker">🧪 TEST ISLAND</div><h2>Start over?</h2><p>Your test island goes back to the very beginning. Your real island is not touched.</p><button id="tReset">Yes, start over</button>`, 'Cancel');
      $('tReset').onclick = () => { try { localStorage.setItem('sg.save.test', JSON.stringify({ founder:S.founder, founderBalloon:S.founderBalloon, pet:S.pet, look:S.look, birthday:S.birthday, name:S.name })); } catch {} location.reload(); }; return; }
    save(); drawHud(); });
}
// ============ THE KEEPERS' PATH ============
// trust comes from the server: 1 founder, 2 keeper, 3 elder keeper. The creator can change or pause it anytime.
function founderOn() { return !!S.founder && !(S.trust && S.trust.revoked); }
function paused(p) { return !!(S.trust && (S.trust.paused || []).includes(p)); }
function keeperLevel() { if (devOn()) return 3; return founderOn() && featureOn('keepers') ? (S.trust && S.trust.level) || 1 : 0; }
async function syncTrust() { if (VISIT || SIDE || !S.syncKey) return;
  try { const r = await (await fetch(`${CLOUD}/me?key=${S.syncKey}`)).json(); if (r && 'level' in r) { if (r.founder && r.level >= 4) { try { sessionStorage.setItem('sg.devok', '1'); } catch {} }
    if (r.founder && r.code && (!S.founder || S.founder.code !== r.code)) S.founder = { code:r.code, at:Date.now(), day0:(S.founder && S.founder.day0) ?? playDays() - 1 }; // the server knows this game is a founder's
    S.trust = { level:r.level, paused:r.paused || [], revoked:!!r.revoked, myth:r.myth || null, seen:r.seen || 0, missions:r.missions || [], mythData:r.mythData || null, link:r.link || null }; save(); dressPlayer(); drawHud(); drawKeepers(); mythReveal(); loadMods(r.mods); setTimeout(() => thanksCheck(r.thanks), 5000); } } catch {}
  try { const w = await (await fetch(`${CLOUD}/world`)).json(); if (w && w.world) { S.world = w.world; save(); drawWorld(); } } catch {} }
addEventListener('sg-playing', () => setTimeout(syncTrust, 2500));
// when a player's feedback leads to a change, they open a thank-you gift: coins, and a list of what they said and what changed
function thanksCheck(list) { list = (list || []).filter(t => !(S.thanked || []).includes(t.id)); if (!list.length) return;
  const busy = !S.setupDone || S.tut < 9 || (S.where === 'hut' && S.room) || (mythOn() && !mp().revealed) || !quiet();
  if (busy) return setTimeout(() => thanksCheck(list), 4000);
  const coins = list.reduce((a, t) => a + (t.coins || 0), 0), n = list.length;
  openPresents([{ icon:'💡', title:n === 1 ? 'Your feedback changed the game' : `${n} of your ideas changed the game`, text:`Thank you. Here are ${coins} coins.`, wrap:['#ffc857','#7ec8e3'], last:'See what changed' }], () => {
    S.coins += coins; S.thanked = [...(S.thanked || []), ...list.map(t => t.id)].slice(-300); save(); drawHud(); sfx('coin');
    fetch(`${CLOUD}/thanks-claim`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ key:S.syncKey, ids:list.map(t => t.id) }) }).catch(() => {});
    showCard(`<div class="kicker">THANK YOU</div><h2>What your feedback changed</h2>${list.map(t => `<p style="margin-top:12px">${t.note ? `<span class="sub">You said: “${esc(t.note)}”</span><br>` : ''}✅ <b>${esc(t.changed)}</b></p>`).join('')}<p style="margin-top:12px">Keep the feedback coming. Tap Feedback any time.</p>`, 'Close'); }); }
function logKeeper(kind, detail) { if (!SIDE && !VISIT) fetch(`${CLOUD}/event`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ key:S.syncKey, kind, detail }) }).catch(() => {}); }
// Lighthouse Rock: a little island only keepers can see. Reach it by balloon.
const LH = new THREE.Vector3(-15, -1.2, -11);
const LHI = island(3.4, LH.x, LH.y, LH.z, { hidden:true }); LHI.g.visible = false; SEASON_ISLES.push(LHI); applySeason();
var lighthouse = new THREE.Group(); lighthouse.position.set(LH.x + .9, LH.y, LH.z - .7); scene.add(lighthouse);
{ for (let i = 0; i < 5; i++) lighthouse.add(mesh(new THREE.CylinderGeometry(.62 - i*.07, .66 - i*.07, .62, 20), mat(i % 2 ? 0xd2334c : 0xfff6e6), 0, .31 + i*.62, 0));
  lighthouse.add(mesh(new THREE.CylinderGeometry(.55,.55,.08,20), mat(0x3b2f4a), 0, 3.14, 0)); lighthouse.add(mesh(new THREE.CylinderGeometry(.3,.3,.5,12), glow(0xfff3a0), 0, 3.42, 0));
  lighthouse.add(mesh(new THREE.ConeGeometry(.42,.45,16), mat(0xd2334c), 0, 3.9, 0));
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.4, 9, 20, 1, true), new THREE.MeshBasicMaterial({ color:0xfff3a0, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false }));
  beam.rotation.z = Math.PI/2; beam.position.set(4.5, 0, 0); const pivot = new THREE.Group(); pivot.position.y = 3.42; pivot.add(beam); lighthouse.add(pivot); lighthouse.userData.pivot = pivot; lighthouse.userData.beam = beam; }
const wren = critter({ body:0x9b7b5a, belly:0xf3e2c4, beak:0xd9a441, outfit:{ style:'coat', color:0x2d3a6b, trim:0xffc857, acc:'scarf' } }); wren.scale.setScalar(.8);
wren.position.set(LH.x - 1, LH.y, LH.z + .7); wren.userData = { ...wren.userData, kind:'deco', use:() => openKeeper() }; wren.rotation.y = .6;
const keeperGroup = new THREE.Group(); scene.add(keeperGroup); lateClicks.push(keeperGroup, wren, LHI.g);
const SAPLING_SPOTS = [[1.9, 1.2], [-1.6, 1.9], [.2, -2.2]];
const EDGE_STONES = [[8.2, -2.8], [-1.4, -8.2], [-8.2, 3.9], [-7.6, -5.2]]; // at the edges, clear of everything and out of the front meadow
function kp() { S.kp = S.kp || { done:[], stones:[], planted:[], secret:0 }; return S.kp; }
function currentTrial() { const lvl = keeperLevel(); return TRIALS.find(t => t.level <= lvl && !kp().done.includes(t.id)) || null; }
function drawKeepers() {
  keeperGroup.children.slice().forEach(c => keeperGroup.remove(c));
  const on = keeperLevel() >= 2 && !VISIT;
  LHI.g.visible = lighthouse.visible = wren.visible = on;
  if (on && !walkables.includes(LHI.top)) walkables.push(LHI.top); if (!on && walkables.includes(LHI.top)) walkables.splice(walkables.indexOf(LHI.top), 1);
  if (!on) return; const k = kp(), t = currentTrial();
  // the marker stones for the Trial of the Map
  if (t && t.id === 'map') EDGE_STONES.forEach(([x, z], i) => { if (k.stones.includes(i)) return; const g = new THREE.Group(); g.position.set(x, 0, z);
    const st = mesh(new THREE.CylinderGeometry(.18, .26, .9, 6), mat(0xb3aabb), 0, .45, 0); g.add(st); g.add(mesh(new THREE.OctahedronGeometry(.1), glow(0x9fe7e0), 0, 1.05, 0)); const h = halo(0x9fe7e0, 1.6, .5); h.position.y = .9; g.add(h);
    const hb = hitBox(.8, 1.4, .8); hb.position.y = .6; g.add(hb); g.userData = { kind:'deco', use:() => { k.stones.push(i); save(); sfx('ting'); burst(g.position.clone().setY(1), 0x9fe7e0, 14); drawKeepers();
      toast(k.stones.length < 4 ? `Marker stone ${k.stones.length} of 4 charted.` : 'All 4 marker stones charted! Fly to the lighthouse and tell Wren.'); } }; keeperGroup.add(g); });
  // saplings in the Keepers' Grove on Lighthouse Rock (they grow 1 stage for each day you come back)
  SAPLING_SPOTS.forEach(([x, z], i) => { const g = new THREE.Group(); g.position.set(LH.x + x, LH.y, LH.z + z); const planted = k.planted[i];
    if (planted == null) { if (!(t && t.id === 'seeds')) return; g.add(mesh(new THREE.CylinderGeometry(.35, .35, .05, 16), mat(0x7a5236), 0, .03, 0)); const h = halo(0x8fdc8a, 1.2, .5); h.position.y = .3; g.add(h);
      const hb = hitBox(.8, .8, .8); hb.position.y = .3; g.add(hb); g.userData = { kind:'deco', use:() => { k.planted[i] = playDays(); save(); sfx('plant'); burst(g.position.clone().setY(.5), 0x8fdc8a, 12); drawKeepers();
        toast(k.planted.filter(p => p != null).length < 3 ? `Sapling ${k.planted.filter(p => p != null).length} of 3 planted. Plant the next one.` : 'All 3 saplings planted! Talk to Wren.'); } }; }
    else { const age = Math.min(4, playDays() - planted), sc = .35 + age * .2; g.add(mesh(new THREE.CylinderGeometry(.05*sc, .08*sc, 1*sc, 6), mat(0x9b6b4a), 0, .5*sc, 0)); g.add(mesh(sph(.45*sc), mat(0x5fc377), 0, 1.05*sc, 0)); }
    keeperGroup.add(g); });
}
function reflectCard(t, after) {
  showCard(`<div class="kicker">${t.name.toUpperCase()}</div><h2>Wisdom</h2><p>${t.wisdom}</p>`, 'Next', () => { showCard(`<div class="kicker">${t.name.toUpperCase()}</div><h2>A question to sit with</h2><p><i>${t.reflect}</i></p>
    <textarea id="rfText" rows="3" maxlength="800" placeholder="Write your answer here, just for you (optional)" style="width:100%;margin-top:8px;font:16px inherit;border-radius:12px;border:2px solid var(--line);padding:8px"></textarea>
    <label style="display:flex;gap:8px;align-items:center;margin-top:6px;font-size:14px"><input type="checkbox" id="rfShare"> Share my answer with the person who made Sky Garden</label>
    <button id="rfDone">Keep it in my journal</button>`, null);
  $('rfDone').onclick = () => { const text = $('rfText').value.trim(); S.reflections = S.reflections || {}; if (text) S.reflections[t.id] = { text, day:S.day };
    if (text && $('rfShare').checked) logKeeper('reflection', `${t.name}: ${text}`); save(); hideCard(); after && after(); }; });
}
function finishTrial(t) { const k = kp(); if (k.done.includes(t.id)) return; k.done.push(t.id); save(); logKeeper('trial', `Finished ${t.name}`);
  [392,523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*160)); burst(wren.position.clone().setY(1.5), 0xfff3a0, 30);
  reflectCard(t, () => { drawKeepers(); const next = currentTrial();
    showCard(`<div class="kicker">${MENTOR.name.toUpperCase()}, ${MENTOR.title.toUpperCase()}</div><h2>${next ? 'Well done, Keeper' : 'You walked the whole path'}</h2><p>${next ? `"You are ready for the next one. Tap me again to start ${next.name}."` : keeperLevel() >= 3 ? '"There is nothing more I can teach you. Keep the sky well, Elder."' : '"You have done all a Keeper can do, for now. The last trial is for Elders. Keep being kind. It gets noticed."'}</p>`, 'Okay'); drawHud(); });
}
function openKeeper() {
  const t = currentTrial(), k = kp();
  if (!t) { showCard(`<div class="kicker">${MENTOR.name.toUpperCase()}, ${MENTOR.title.toUpperCase()}</div><h2>The light is kept</h2><p>"The lamp stays lit because someone climbs those stairs every night. That is all keeping is."</p>
    ${Object.keys(S.reflections || {}).length ? '<button id="rfJournal" class="ghost">My reflections</button>' : ''}`, 'Okay'); if ($('rfJournal')) $('rfJournal').onclick = keeperJournal; return; }
  const ready = t.id === 'map' ? k.stones.length >= 4 : t.id === 'seeds' ? k.planted.filter(p => p != null).length >= 3 : t.id === 'voice' ? !!k.voted : t.id === 'unseen' ? k.secret >= 3 : false;
  const progress = t.id === 'map' ? `${k.stones.length} of 4 stones charted` : t.id === 'seeds' ? `${k.planted.filter(p => p != null).length} of 3 saplings planted` : t.id === 'voice' ? (k.voted ? 'You voted' : 'Not voted yet') : t.id === 'unseen' ? `${k.secret} of 3 secret gifts given` : '';
  showCard(`<div class="kicker">${MENTOR.name.toUpperCase()}, ${MENTOR.title.toUpperCase()}</div><h2>${t.name}</h2><h4>Your task</h4><p>${t.task}</p>${progress ? `<p><b>${progress}</b></p>` : ''}<p>"${t.intro}"</p>
    <div id="kpAct"></div>${Object.keys(S.reflections || {}).length ? '<button id="rfJournal" class="ghost">My reflections</button>' : ''}`, 'Later');
  if ($('rfJournal')) $('rfJournal').onclick = keeperJournal;
  const act = $('kpAct');
  if (t.id === 'map' && ready) { act.innerHTML = `<h4>Name the village square</h4><input id="kpName" maxlength="24" placeholder="Like Lantern Square" class="numin" style="width:100%"><p id="kpMsg" style="min-height:20px;font-weight:700"></p><button id="kpSend">Send my name</button>`;
    $('kpSend').onclick = async () => { const name = $('kpName').value.trim(); if (!name) { $('kpMsg').textContent = 'Type a name first.'; return; } $('kpMsg').textContent = 'Sending...';
      const r = await api('/propose', { key:S.syncKey, kind:'placename', payload:{ name } });
      if (r.ok || devOn()) { finishTrial(t); } else $('kpMsg').textContent = r.error === 'not allowed' ? 'That name is not allowed. Try another.' : r.error === 'too many' ? 'You already have ideas waiting for approval.' : 'Could not send it. Try again.'; }; }
  if (t.id === 'gift') { let d = { type:'fountain', color:0x7ec8e3, color2:0xfff1d6 };
    const draw = () => { act.innerHTML = `<h4>Choose a landmark</h4><div class="chips">${Object.entries(LANDMARKS).map(([k2, n]) => `<button data-lm="${k2}" class="${d.type === k2 ? '' : 'ghost'}">${n}</button>`).join('')}</div>
      <h4>Main color</h4><div class="chips">${PALETTE.map(c => `<button class="sw ${d.color === c ? 'on' : ''}" data-lc="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Trim color</h4><div class="chips">${PALETTE.map(c => `<button class="sw sm ${d.color2 === c ? 'on' : ''}" data-lc2="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <p style="font-size:13px;opacity:.7;margin-top:6px">Your design goes to Sky Garden's creator first.</p><p id="kpMsg" style="min-height:20px;font-weight:700"></p><button id="kpSend">Send my design</button>`;
      act.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { d.type = b.dataset.lm; draw(); }); act.querySelectorAll('[data-lc]').forEach(b => b.onclick = () => { d.color = +b.dataset.lc; draw(); }); act.querySelectorAll('[data-lc2]').forEach(b => b.onclick = () => { d.color2 = +b.dataset.lc2; draw(); });
      $('kpSend').onclick = async () => { $('kpMsg').textContent = 'Sending...'; const r = await api('/propose', { key:S.syncKey, kind:'landmark', payload:d }); if (r.ok || devOn()) finishTrial(t); else $('kpMsg').textContent = r.error === 'too many' ? 'You already have ideas waiting for approval.' : 'Could not send it. Try again.'; }; };
    draw(); }
  if (t.id === 'voice' && !ready) act.innerHTML = '<p>Fly to the Town Square and tap the notice board. Then tap Town Hall votes. The Keepers\' Council vote is there.</p>';
  if (t.id === 'unseen' && !ready) { act.innerHTML = '<button id="kpSecret">Leave a secret gift</button>'; $('kpSecret').onclick = secretGift; }
  if (ready && ['seeds','voice','unseen'].includes(t.id)) { act.innerHTML = '<button id="kpDone">Tell Wren you are done</button>'; $('kpDone').onclick = () => finishTrial(t); }
}
function secretGift() {
  const who = Object.keys(NEIGHBORS).filter(id => npcs[id] && S.talked[id] != null), items = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && !['quest','material'].includes(ITEMS[k].kind));
  if (!items.length) { toast('You have nothing in your bag to give yet. Get something, then tap Wren again.'); return; }
  let to = who[0];
  const draw = () => { showCard(`<div class="kicker">THE TRIAL OF THE UNSEEN</div><h2>A secret gift</h2><p>Pick a neighbor, then pick a gift from your bag. They will never know it came from you.</p>
    <div class="chips">${who.map(id => `<button data-sw="${id}" class="${to === id ? '' : 'ghost'}">${NEIGHBORS[id].name}</button>`).join('')}</div>
    <div class="igrid" style="margin-top:8px">${items.map(([k,n]) => `<button class="itile" data-sg="${k}"><span class="ic">${icon(k, ITEMS[k].kind)}</span><b>${n}</b><small>${esc(ITEMS[k].name)}</small></button>`).join('')}</div>`, 'Cancel', openKeeper);
    document.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { to = b.dataset.sw; draw(); });
    document.querySelectorAll('[data-sg]').forEach(b => b.onclick = () => { const k = b.dataset.sg; bagAdd(k, -1); kp().secret++; S.secretFor = { ...(S.secretFor || {}), [to]:k }; if (featureOn('journey')) karma('kind', 1); save(); logKeeper('secretgift', `Secret gift to ${to}`);
      sfx('heart'); hideCard(); toast(`You left a ${ITEMS[k].name.toLowerCase()} on ${NEIGHBORS[to].name}'s doorstep. ${kp().secret < 3 ? `That is ${kp().secret} of 3.` : 'That is all 3. Tap Wren.'}`); }); };
  draw();
}
function keeperJournal() { const R = S.reflections || {};
  showCard(`<div class="kicker">MY REFLECTIONS</div><h2>Keeper's journal</h2><p>Your answers, just for you.</p>${TRIALS.filter(t => R[t.id]).map(t => `<h4>${t.name}</h4><p><i>${t.reflect}</i></p><p>${esc(R[t.id].text)}</p>`).join('')}`, 'Back', openKeeper); }
// approved world changes everyone sees: the village square's name and a landmark, at the Old Heart
const worldGroup = new THREE.Group(); worldGroup.position.copy(OH); scene.add(worldGroup);
function landmarkModel(d) { const g = new THREE.Group(), a = mat(d.color), b = mat(d.color2), stone = mat(0xd8cfc0);
  if (d.type === 'fountain') { g.add(mesh(new THREE.CylinderGeometry(1.1,1.2,.4,24), stone, 0, .2, 0)); g.add(mesh(new THREE.CylinderGeometry(.95,.95,.05,24), glow(0x9fd3ff), 0, .41, 0)); g.add(mesh(new THREE.CylinderGeometry(.15,.2,1.1,12), a, 0, .9, 0)); g.add(mesh(new THREE.CylinderGeometry(.45,.2,.2,16), b, 0, 1.5, 0)); }
  if (d.type === 'sundial') { g.add(mesh(new THREE.CylinderGeometry(1,1.1,.25,24), stone, 0, .12, 0)); const gn = mesh(new THREE.BoxGeometry(.06,.7,.7), a, 0, .5, 0); gn.rotation.x = .6; g.add(gn); for (let i = 0; i < 12; i++) { const an = i/12*Math.PI*2; g.add(mesh(sph(.06), b, Math.cos(an)*.85, .27, Math.sin(an)*.85)); } }
  if (d.type === 'belltower') { [-.4,.4].forEach(x => g.add(mesh(new THREE.BoxGeometry(.18,2.4,.18), a, x, 1.2, 0))); g.add(mesh(new THREE.BoxGeometry(1.1,.2,.4), a, 0, 2.45, 0)); const r = mesh(new THREE.ConeGeometry(.75,.6,4), b, 0, 2.85, 0); r.rotation.y = Math.PI/4; g.add(r); g.add(mesh(new THREE.CylinderGeometry(.14,.26,.36,16), mat(0xffc857, { metalness:.5 }), 0, 1.95, 0)); }
  if (d.type === 'stonecircle') for (let i = 0; i < 7; i++) { const an = i/7*Math.PI*2, st = mesh(new THREE.BoxGeometry(.35,1.1 + (i%3)*.2,.25), i % 2 ? a : b, Math.cos(an)*1.1, .55, Math.sin(an)*1.1); st.rotation.y = -an; g.add(st); }
  return g; }
function drawWorld() { worldGroup.children.slice().forEach(c => worldGroup.remove(c)); const W = S.world || {};
  if (W.landmark) { const lm = landmarkModel(W.landmark); lm.position.set(3.0, 0, 3.5); worldGroup.add(lm); }
  if (W.placename) { const sign = signBoard(W.placename.name); sign.position.set(...SQ_SIGN); worldGroup.add(sign); } }
drawKeepers(); drawWorld();
// --- growing the island ---
function expandReady(e) { return e.needs === 'home' ? (S.home || 0) >= 3 : e.needs === 'kiln' ? !!S.stations.kiln && potteryOn() : !!S.stations.furnace && bronzeOn(); }
function expandCard() {
  const e = EXPANSIONS[S.expand || 0]; if (!e) { toast('Your island is as big as it can grow for now.'); return; }
  const ok = enough(e.cost) && S.coins >= e.coins, ready = expandReady(e);
  showCard(`<div class="kicker">NANA GALE</div><h2>Grow the island: ${e.name}</h2>
    <p>"When I was young, we made new land by piling earth and stone at the edge until it held. We can do it again."</p>
    <p>New land joins your island with room to build, plus new trees, rocks, and bushes.</p>
    ${ready ? needList(e.cost, e.coins) : `<h4>Not yet</h4><p>${e.why}</p>`}
    ${ready ? (ok ? `<button id="exGo">Build the ${e.name}</button>` : `<p><b>You do not have enough yet. Gather the rest, then talk to Nana Gale again.</b></p>`) : ''}`, 'Later');
  if ($('exGo')) $('exGo').onclick = () => {
    if (!enough(e.cost) || S.coins < e.coins) { toast('Not enough yet.'); return; }
    Object.entries(e.cost).forEach(([k,n]) => bagAdd(k, -n)); S.coins -= e.coins; S.expand = (S.expand || 0) + 1; lean('maker', 3);
    save(); drawHud(); hideCard(); showLobes(true); sfx('dig'); [392,523,659,784].forEach((f,i) => setTimeout(() => chime(f), 400 + i*200));
    const first = S.expand === 1;
    setTimeout(() => first ? showCard(`<div class="kicker">NEW LAND</div><h2>The ${e.name} is yours</h2><h4>In real life</h4><p>${RECLAIM_FACT}</p>`) : toast(`The ${e.name} joined your island!`), 2900);
  };
}
// --- the quiet journey: hidden karma, paths, choices, and rewards that come later ---
function karma(k, n) { S.karma = S.karma || { kind:0, harmony:0 }; S.karma[k] = Math.max(-20, Math.min(30, (S.karma[k] || 0) + n)); }
function lean(path, n = 1) { if (!path || VISIT) return; S.paths = S.paths || {}; S.paths[path] = (S.paths[path] || 0) + n; }
function giveReward(g) { if (!g) return [];
  const got = [];
  if (g.coins) { S.coins += g.coins; got.push(`${g.coins} coins`); }
  Object.entries(g.items || {}).forEach(([k,n]) => { S.bag[k] = (S.bag[k] || 0) + n; noteFind(k); got.push(`${n} ${icon(k)} ${plural(k, n)}`); }); // gifts always fit
  Object.entries(g.seeds || {}).forEach(([k,n]) => { S.seeds[k] = (S.seeds[k] || 0) + n; got.push(`${n} ${CROPS[k].name.toLowerCase()} seeds`); });
  if (g.furn) { S.furn[g.furn] = (S.furn[g.furn] || 0) + 1; noteFind(g.furn); got.push(`a ${FURN[g.furn].name}`); }
  if (g.perk) { S.perks = [...new Set([...(S.perks || []), g.perk])]; }
  return got;
}
function startDilemma(who) {
  if (!featureOn('journey') || VISIT || (!devOn() && playDays() < 3)) return false;
  const dk = new Date().toISOString().slice(0, 10); if (S.dilemmaDate === dk) return false;
  const done = (S.choices || []).map(c => c.id), d = DILEMMAS.find(x => x.who === who && !done.includes(x.id)); if (!d) return false;
  S.dilemmaDate = dk; save();
  const opts = Math.random() < .5 ? ['a','b'] : ['b','a']; // the kind option is not always in the same place
  openDialog(NEIGHBORS[who].name, d.text, opts.map(k => ({ label:d[k].label, fn:() => chooseDilemma(d, k) })), S.hearts[who]);
  return true;
}
function chooseDilemma(d, k) {
  const o = d[k]; closeDialog();
  if (o.kind) karma('kind', o.kind); if (o.harmony) karma('harmony', o.harmony);
  S.choices = [...(S.choices || []), { id:d.id, pick:k, day:playDays() }];
  const got = giveReward(o.now);
  if (o.later) S.later = [...(S.later || []), { id:d.id, due:playDays() + o.later.days }];
  if (k === 'a') lean('trader'); else lean(o.harmony ? 'grower' : 'friend');
  save(); drawHud();
  if (got.length) { sfx('coin'); toast(`You got ${got.join(', ')}.`); } else { sfx('click'); toast(d.who === 'twins' ? 'Moss and Fern get to work.' : `${NEIGHBORS[d.who].name} nods slowly.`); }
}
// letters for choices that pay off later, delivered the first time you play on the day they are due
function deliverLetters(then) {
  const due = (S.later || []).filter(l => l.due <= playDays()); if (!due.length) return then && then();
  S.later = S.later.filter(l => l.due > playDays());
  const show = i => { if (i >= due.length) { save(); drawHud(); return then && then(); }
    const d = DILEMMAS.find(x => x.id === due[i].id), L = d.b.later, got = giveReward(L.give);
    S.mailLog = [...(S.mailLog || []), `${L.from} sent you ${got.join(', ')}.`].slice(-20);
    chime(659); setTimeout(() => chime(880), 150);
    showCard(`<div class="kicker">A LETTER</div><h2>${L.from} wrote to you</h2><p class="letter">${L.letter}</p>`, 'Open what is inside', () => showCard(`<div class="kicker">A LETTER</div><h2>Inside: ${got.join(', ')}</h2>${L.give.perk === 'pipBonus' ? '<p>Pip\'s orders now pay you 25% more.</p>' : ''}`, 'Okay', () => show(i + 1))); };
  show(0);
}
// kind people get surprise gifts sometimes (never announced as a reward)
function kindnessGift() {
  const k = (S.karma || {}).kind || 0; if (k < 5 || Math.random() > Math.min(.5, k / 30)) return;
  const who = ['nana','pip'][Math.floor(Math.random()*2)], pool = ['apple','peach','cloudberry','kale','trout'], it = pool[Math.floor(Math.random()*pool.length)];
  S.bag[it] = (S.bag[it] || 0) + 2; S.mailLog = [...(S.mailLog || []), `${NEIGHBORS[who].name} left you 2 ${ITEMS[it].name.toLowerCase()} "just because".`].slice(-20); S.mailNew = true;
}
function openStory() {
  const ps = Object.entries(S.paths || {}).sort((a,b) => b[1] - a[1]).slice(0, 2).filter(([,n]) => n >= 3), kk = S.karma || {};
  showCard(`<div class="kicker">YOUR STORY</div><h2>${S.name ? S.name + "'s" : 'Your'} journey</h2>
    <p style="font-style:italic">${islandFeel(kk.kind || 0, kk.harmony || 0)}</p>
    <h4>Who you are becoming</h4>${ps.length ? '<p class="sub">You love to:</p>' + ps.map(([k]) => `<p><b>${PATHS[k][0]}.</b> ${PATHS[k][1]}</p>`).join('') : '<p>Keep playing. Your path will show here.</p>'}
    <h4>Choices you made</h4>${(S.bigChoices || []).map(t => `<p><b>• ${t}</b></p>`).join('')}${(S.choices || []).length ? `<div class="jlist">${S.choices.map(c => { const d = DILEMMAS.find(x => x.id === c.id); return `<p>• ${d[c.pick].story}</p>`; }).join('')}</div>` : (S.bigChoices || []).length ? '' : '<p>None yet. Neighbors sometimes ask you to decide things. There are no wrong answers.</p>'}`, 'Back', openJournal);
}
// --- rolling unlocks: a "New today" card the first time you play each day ---
function maybeNewToday() {
  if (!S.newDay || VISIT || !S.setupDone) return;
  if (!quiet()) return setTimeout(maybeNewToday, 2500); // wait for a clear moment instead of giving up
  S.newDay = false; save();
  if (featureOn('journey')) { kindnessGift(); return deliverLetters(() => newTodayCard()); }
  newTodayCard();
}
function newTodayCard() {
  const d = playDays(), fresh = ROLLOUT.filter(r => r.day === d && featureOn(r.id)), next = ROLLOUT.find(r => r.day > d && FEATURES.find(f => f.id === r.id)?.live !== false);
  if (!fresh.length) { if (!S.mode && !S.modeAsked && S.tut >= 9 && d >= 3) { S.modeAsked = true; save(); setupCam = true; $('veil').classList.add('setup'); document.body.classList.add('in-setup'); modePicker(() => endSetup(), { returning:true, late:true }); } return; }
  drawHud(); drawStations(); drawTradePlants(); drawStall(); spawnBugs(); drawPeople(); drawTownHall(); drawHelperTree(); drawWall(); chime(784); setTimeout(() => chime(1047), 140);
  const show = i => { const r = fresh[i], last = i === fresh.length - 1; showCard(`<div class="kicker">NEW TODAY${fresh.length > 1 ? `: ${i + 1} OF ${fresh.length}` : ''}</div><h2>${r.title}</h2><p>${r.text}</p>${last && next ? `<p style="opacity:.75;margin-top:10px">${next.day === d + 1 ? 'Something new unlocks tomorrow.' : `The next new thing unlocks after ${next.day - d} more days of play.`}</p>` : ''}`, last ? 'Okay' : 'Next', last ? undefined : () => show(i + 1)); };
  show(0);
}
{ const st = $('start').onclick; $('start').onclick = () => { st(); setTimeout(maybeNewToday, 1800); }; }
// --- playtest feedback: a short form that goes to the Sky Garden cloud ---
function openFeedback() {
  let mood = null;
  const where = `${$('quest').querySelector('b')?.textContent || ''}: ${$('quest').querySelector('.qt')?.textContent || ''}`;
  showCard(`<div class="kicker">FEEDBACK</div><h2>How is it going?</h2><p>Your notes go straight to the people making Sky Garden. Thank you!</p>
    <div class="steppers" style="justify-content:flex-start">${[['love','Loving it'],['okay',"It's okay"],['confused','Confused'],['bored','Bored']].map(([k,l]) => `<button data-mood="${k}" class="ghost">${l}</button>`).join('')}</div>
    ${kidSafe() ? (S.birthday && S.birthday.y ? '' : '<p class="sub" style="margin-top:10px">To write a note too, add your birthday first: tap Bag, then Settings, then Add my birthday.</p>') : `<textarea id="fbText" rows="4" maxlength="2000" placeholder="What happened? What did you like? Where did you get stuck? (optional)" style="width:100%;margin-top:10px;font:16px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:10px"></textarea>`}
    <p style="font-size:13px;opacity:.7;margin-top:6px">We also send where you are in the game (${where}) so we know what your note is about. Nothing else about you is sent.</p>
    <button id="fbSend">Send</button> <button id="fbLater" class="ghost">Not now</button>
    <p id="fbMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>`, null);
  document.querySelectorAll('[data-mood]').forEach(b => b.onclick = () => { mood = b.dataset.mood; document.querySelectorAll('[data-mood]').forEach(x => x.className = x === b ? '' : 'ghost'); });
  $('fbLater').onclick = hideCard;
  $('fbSend').onclick = async () => {
    const text = $('fbText') ? $('fbText').value.trim() : '';
    if (!mood && !text) { $('fbMsg').textContent = 'Pick how it is going, or write a note first.'; return; }
    $('fbMsg').textContent = 'Sending...';
    try {
      const r = await fetch(`${CLOUD}/feedback`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ mood, text, where: (devOn() ? '[dev] ' : '') + (TESTSLOT ? '[test island] ' : '') + (FILE ? `[save file ${FILE.slice(1)}] ` : '') + where, day:S.day, player:S.syncKey }) });
      if (!r.ok) throw new Error();
      hideCard(); toast('Thank you! Your feedback was sent.'); sfx('heart'); helperGrow();
    } catch { $('fbMsg').textContent = 'Could not send. Check your internet and try again. Your note is still here.'; }
  };
}
$('fbBtn').hidden = false; $('fbBtn').onclick = openFeedback;
// inside claude.ai, the Feedback button opens the comment box instead
(async () => {
  try {
    const comments = await window.claude?.use?.('comments');
    if (!comments) return;
    const fb = $('fbBtn'); fb.hidden = false; $('testNote').hidden = false;
    fb.onclick = async () => {
      try { const r = await comments.openComposer({ element: fb }); if (!r.opened) toast('Tap Feedback again to leave a note.'); }
      catch (e) { fb.hidden = true; toast('Feedback is off for this view.'); }
    };
  } catch {}
})();
// ============ THE TOWN SQUARE ============
// A small plaza island next to home, where the neighbors gather. It opens on day 1, right after the first steps with Nana.
// Shared things live here (market stall, Town Hall board, Helper Tree, the Keepers' landmark), so home stays your own space.
const SQ = new THREE.Vector3(9.5, 0, -15);
const SQI = island(5.8, SQ.x, SQ.y, SQ.z, { mat:mat(0xf3e4c4) });
var squareBits = null; // var: the game loop can start before this part loads
const squareBridge = new THREE.Group(); scene.add(squareBridge);
const SQL = (x, z) => new THREE.Vector3(SQ.x + x, SQ.y, SQ.z + z); // a spot on the square, from its center
const faceCenter = (o, x, z) => { o.rotation.y = Math.atan2(-x, -z); };
{ const g = new THREE.Group(); g.position.copy(SQ); scene.add(g); squareBits = { g, drops:[], water:null };
  // paving: soft rings and a path from the bridge to the fountain
  [[1.75, 2.15, 0xe2c99a], [3.7, 3.95, 0xe2c99a]].forEach(([a, b, c]) => { const r = new THREE.Mesh(new THREE.RingGeometry(a, b, 48), mat(c)); r.rotation.x = -Math.PI/2; r.position.y = .012; g.add(r); });
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.2), mat(0xe2c99a)); path.rotation.x = -Math.PI/2; path.rotation.z = Math.atan2(-2.9, 4.6); path.position.set(-1.55, .011, 3.3); g.add(path);
  // the fountain: tap to toss a coin and make a wish
  const stone = mat(0xd8cfc0, { map:tx('stone', 4, 1) }), fnt = new THREE.Group(); g.add(fnt); squareBits.fnt = fnt;
  fnt.add(mesh(new THREE.CylinderGeometry(1.35, 1.45, .45, 32), stone, 0, .22, 0));
  const water = mesh(new THREE.CylinderGeometry(1.2, 1.2, .06, 32), new THREE.MeshStandardMaterial({ color:0x7ec8e3, transparent:true, opacity:.8, roughness:.15 }), 0, .4, 0); fnt.add(water); squareBits.water = water;
  fnt.add(mesh(new THREE.CylinderGeometry(.22, .3, 1.05, 16), stone, 0, .9, 0));
  fnt.add(mesh(new THREE.CylinderGeometry(.62, .42, .18, 24), stone, 0, 1.42, 0));
  fnt.add(mesh(new THREE.CylinderGeometry(.55, .55, .04, 24), water.material, 0, 1.5, 0));
  fnt.add(mesh(sph(.13), stone, 0, 1.68, 0));
  for (let i = 0; i < 10; i++) { const d = mesh(sph(.05), new THREE.MeshBasicMaterial({ color:0xdff3ff, transparent:true, opacity:.85 }), 0, 1.5, 0); d.userData.ph = i / 10; fnt.add(d); squareBits.drops.push(d); }
  const fh = hitBox(3, 1.6, 3); fh.position.y = .8; fnt.add(fh); deco(fh, wishFountain).userData.label = 'Fountain: tap to make a wish'; solid(fh, 1.5);
  // benches around the fountain: sit and let time pass faster
  [55, 235, 305].map(d => [Math.cos(d * Math.PI / 180) * 3, Math.sin(d * Math.PI / 180) * 3]).forEach(([x, z]) => { const b = new THREE.Group(); b.position.set(x, 0, z); faceCenter(b, x, z); g.add(b); const w = mat(0xc98f58);
    b.add(mesh(new THREE.BoxGeometry(1.3, .08, .42), w, 0, .42, 0)); b.add(mesh(new THREE.BoxGeometry(1.3, .34, .07), w, 0, .66, -.2));
    w.map = tx('planks', 1, 3); [-.07, .07].forEach(z => b.add(mesh(new THREE.BoxGeometry(1.3, .012, .012), fine(0x8a6040), 0, .465, z))); [.58, .74].forEach(y => b.add(mesh(new THREE.BoxGeometry(1.3, .012, .012), fine(0x8a6040), 0, y, -.16)));
    [-.62, .62].forEach(sx => { b.add(mesh(new THREE.BoxGeometry(.07, .06, .44), mat(0x5a3a28), sx, .62, 0)); b.add(mesh(new THREE.BoxGeometry(.07, .2, .06), mat(0x5a3a28), sx, .52, .18)); b.add(mesh(new THREE.BoxGeometry(.07, .5, .06), mat(0x5a3a28), sx, .6, -.2)); });
    [-.55, .55].forEach(sx => b.add(mesh(new THREE.BoxGeometry(.07, .42, .38), mat(0x5a3a28), sx, .21, 0)));
    const h = hitBox(1.4, .9, .8); h.position.y = .45; b.add(h); deco(h, () => sitBench(b)).userData.label = 'Bench: tap to sit'; });
  // lamp posts that glow at night
  [75, 170, 250].forEach(deg => { const a = deg * Math.PI / 180, x = Math.cos(a) * 4.9, z = Math.sin(a) * 4.9, l = new THREE.Group(); l.position.set(x, 0, z); g.add(l);
    l.add(mesh(new THREE.CylinderGeometry(.06, .08, 1.9, 8), mat(0x3b2f4a), 0, .95, 0)); l.add(mesh(new THREE.BoxGeometry(.3, .34, .3), glow(0xffe7a8), 0, 2.02, 0)); l.add(mesh(new THREE.ConeGeometry(.26, .2, 4), mat(0x3b2f4a), 0, 2.29, 0).rotateY(Math.PI/4));
    { const ir = mat(0x3b2f4a); l.add(mesh(new THREE.CylinderGeometry(.16, .2, .14, 10), ir, 0, .07, 0)); l.add(mesh(new THREE.CylinderGeometry(.1, .14, .16, 10), ir, 0, .22, 0)); l.add(mesh(new THREE.CylinderGeometry(.09, .09, .05, 10), ir, 0, 1.2, 0)); l.add(mesh(new THREE.BoxGeometry(.36, .04, .36), ir, 0, 1.84, 0));
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a2, b2]) => l.add(mesh(new THREE.BoxGeometry(.03, .34, .03), fine(0x3b2f4a), a2 * .15, 2.02, b2 * .15))); l.add(mesh(sph(.045), ir, 0, 2.42, 0)); const arm = mesh(new THREE.BoxGeometry(.5, .03, .03), ir, 0, 1.62, 0); l.add(arm); }
    const lh = halo(0xffc46b, 2.4, 0); lh.position.y = 2.02; l.add(lh); lampLights.push(lh);
    const h = hitBox(.5, 2.4, .5); h.position.y = 1.2; l.add(h); deco(h, () => toast('Before electric streetlights, lamplighters lit each street lamp by hand at dusk.')); });
  // the notice board: goals, missions, votes, and what's happening
  const nb = new THREE.Group(); nb.position.set(-4.3, 0, -1.7); faceCenter(nb, -4.3, -1.7); g.add(nb);
  [-.6, .6].forEach(x => nb.add(mesh(new THREE.CylinderGeometry(.06, .07, 1.6, 8), mat(0x9b6b4a), x, .8, 0)));
  nb.add(mesh(new THREE.BoxGeometry(1.5, .95, .08), mat(0xc98f58), 0, 1.35, 0)); nb.add(mesh(new THREE.BoxGeometry(1.64, .1, .2), mat(0x8a5a3a), 0, 1.88, 0));
  { const f = boardFace('Notices', 1.4, .85, 'notice'); f.position.set(0, 1.35, .045); nb.add(f); }
  const nh = hitBox(1.7, 2, .6); nh.position.y = 1; nb.add(nh); deco(nh, openNotice).userData.label = 'Notice board: tap to read';
  // Pip's cart: seeds and furniture, restocked every morning
  const cart = new THREE.Group(); cart.position.set(3.7, 0, -3.1); faceCenter(cart, 3.7, -3.1); g.add(cart);
  cart.add(mesh(new THREE.BoxGeometry(1.5, .55, .8), mat(0x86c7ff), 0, .75, 0)); [-.6, .6].forEach(x => { const wh = mesh(new THREE.TorusGeometry(.28, .06, 8, 16), mat(0x5a3a28), x, .3, .42); cart.add(wh); });
  [-.62, .62].forEach(x => cart.add(mesh(new THREE.CylinderGeometry(.04, .04, 1.2, 6), mat(0xfff1d6), x, 1.55, -.3)));
  const aw = mesh(new THREE.BoxGeometry(1.6, .08, .9), mat(0xff8fa3), 0, 2.15, -.05); aw.rotation.x = .18; cart.add(aw);
  [[-.4, 0xffc857], [0, 0x8fdc8a], [.4, 0xc9b6ff]].forEach(([x, c]) => cart.add(mesh(new THREE.BoxGeometry(.28, .2, .22), mat(c), x, 1.13, .1)));
  { cart.children[0].material.map = tx('planks', 5, 1); const dk = mat(0x5a3a28), cream = mat(0xfff6e6); // spoked wheels, a striped awning with a scalloped edge, handles, a counter, seed packets
    [-.6, .6].forEach(x => { for (let i = 0; i < 4; i++) { const sp = mesh(new THREE.BoxGeometry(.03,.52,.03), dk, x, .3, .42); sp.rotation.z = i * Math.PI / 4; cart.add(sp); } cart.add(mesh(sph(.06), mat(0xffc857), x, .3, .46)); });
    for (let i = 0; i < 4; i++) { const st = mesh(new THREE.BoxGeometry(.2,.085,.9), cream, -.6 + i * .4, 2.152, -.05); st.rotation.x = .18; cart.add(st); }
    for (let i = 0; i < 8; i++) { const sc = mesh(new THREE.CylinderGeometry(.1,.1,.04,10,1,false,-Math.PI / 2,Math.PI), i % 2 ? cream : mat(0xff8fa3), -.7 + i * .2, 2.06, .4); sc.rotation.x = Math.PI / 2; cart.add(sc); }
    cart.add(mesh(new THREE.BoxGeometry(1.6,.06,.9), mat(0xc98f58, { map:tx('planks', 4, 1) }), 0, 1.04, 0)); [-.4, .4].forEach(z => { const hd = mesh(new THREE.CylinderGeometry(.03,.03,.7,6), dk, -1.05, .82, z * .8); hd.rotation.z = 1.2; cart.add(hd); });
    [[-.55,0x8fdc8a],[-.2,0xffc857],[.15,0xff8fa3],[.5,0xc9b6ff]].forEach(([x, c], i) => { const pk = mesh(new THREE.BoxGeometry(.16,.2,.02), mat(0xfff8ee), x, 1.2, .36); pk.rotation.x = -.3; cart.add(pk); const dot = mesh(new THREE.CircleGeometry(.045, 10), fine(c), x, 1.21, .375); dot.rotation.x = -.3; cart.add(dot); }); }
  const ch = hitBox(1.7, 2.2, 1.1); ch.position.y = 1.1; cart.add(ch); deco(ch, pipCart).userData.label = "Pip's cart: tap to shop"; solid(ch, .95);
  // two planters by the entrance: Pip tucks a spare seed packet in one each day
  [[-1.37, 4.14], [-.78, 3.21]].forEach(([x, z], i) => { const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = 1.01; g.add(p); // lining the right side of the entrance
    p.add(mesh(new THREE.BoxGeometry(.8, .4, .5), mat(0xc98f58), 0, .2, 0));
    for (let k = 0; k < 4; k++) { p.add(mesh(new THREE.CylinderGeometry(.015, .015, .25, 4), mat(0x4fb46a), -.27 + k * .18, .5, 0)); p.add(mesh(sph(.07), mat([0xff8fa3, 0xfff3a0, 0xc9b6ff, 0xffffff][k]), -.27 + k * .18, .64, 0)); }
    const h = hitBox(.9, .8, .6); h.position.y = .4; p.add(h); deco(h, () => planterSeed(i)).userData.label = 'Planter: tap to be the bee'; });
  // the sign at the entrance (a Keeper-approved name replaces it)
  const sg = signBoard('Town Square'); sg.position.set(...SQ_SIGN); g.add(sg); squareBits.sign = sg;
  const sh = hitBox(1.5, .6, .3); sh.position.y = SIGN_TOP - .2; sg.add(sh); // only the board answers a tap, so the posts do not catch taps meant for the ground behind deco(sh, () => showCard(`<div class="kicker">THE TOWN SQUARE</div><h2>Where the neighbors gather</h2><p>Towns have gathered around open squares for thousands of years. In ancient Athens it was the agora: a marketplace where people traded, talked, and argued about big ideas.</p><p>In Sky Garden, the square is where the village comes together: markets, votes, festivals, and news.</p>`, 'Okay'));
}
// Nana Gale's garden cottage, at the back of the home island: mossy roof, round door, flowers everywhere
const nanaHome = new THREE.Group(); nanaHome.position.set(-1, 0, -6); nanaHome.userData = { kind:'home', room:'nana' }; scene.add(nanaHome); lateClicks.push(nanaHome);
{ const h = nanaHome, sod = mat(0x7fb86a, { map:tx('straw', 4, 1) }), wallM = mat(0xf3f0d8, { map:tx('plaster', 2, 2) }), dk = mat(0x8a6040, { map:tx('grain', 1, 2) });
  h.add(mesh(new THREE.BoxGeometry(2.1,1.4,1.7), wallM, 0, .7, 0)); KIT.foot(h, 2.1, 1.7, 0, 2);
  [[-1.05,.85],[1.05,.85],[-1.05,-.85],[1.05,-.85]].forEach(([x, z]) => h.add(mesh(new THREE.BoxGeometry(.14,1.4,.14), dk, x, .7, z))); h.add(mesh(new THREE.BoxGeometry(2.2,.1,1.8), dk, 0, 1.4, 0));
  KIT.hip(h, 1.44, 1.78, 1.15, sod, .9); // a roof of living grass, with moss and flowers growing on it
  [[-.5,2.02,.55],[.4,2.2,.36],[.75,1.82,.62],[-.8,1.76,.6],[.1,1.7,.84],[-.2,2.4,.2]].forEach(([x, y, z], i) => { const m = mesh(sph(.15), mat(i % 2 ? 0x9bd88a : 0x8fcf7a), x, y, z); m.scale.set(1.2, .6, 1); h.add(m); });
  [[.2,2.0,.56],[-.62,1.86,.6],[.6,1.98,.5],[-.1,1.8,.78],[.9,1.72,.66]].forEach(([x, y, z], i) => { h.add(mesh(new THREE.CylinderGeometry(.01,.01,.12,4), fine(0x4fb46a), x, y + .04, z)); h.add(mesh(sph(.045), fine(KIT.BLOOM[i % 5]), x, y + .12, z)); });
  KIT.chimney(h, .6, 1.75, -.3, .7);
  KIT.door(h, -.45, .16, .86, { w:.72, round:true, color:0xb98a5c }); h.add(mesh(new THREE.BoxGeometry(.6,.08,.3), mat(0xbfb6a8), -.45, .04, 1.08));
  KIT.win(h, .5, .85, .86, { w:.5, h:.42, shut:0x8fb86a, box:true });
  KIT.win(h, 1.06, .85, 0, { w:.36, round:true, ry:Math.PI / 2 }); KIT.lantern(h, -.98, 1.05, .98);
  KIT.pot(h, -1.02, 1.02, .9, 1); KIT.pot(h, .1, 1.04, .7, 3); KIT.pot(h, 1.2, .95, 1, 0);
  { const can = fine(0x8fa3b0); h.add(mesh(new THREE.CylinderGeometry(.09,.1,.16,10), can, .92, .08, 1.12)); const sp = mesh(new THREE.CylinderGeometry(.015,.02,.2,6), can, 1.05, .12, 1.12); sp.rotation.z = -.9; h.add(sp); const hd = mesh(new THREE.TorusGeometry(.06,.012,6,10,Math.PI), can, .92, .17, 1.12); h.add(hd); } // a watering can
  [[-1.3,.5],[-1.35,.1],[1.4,.4],[-1.25,-.4]].forEach(([x, z], i) => { h.add(mesh(new THREE.CylinderGeometry(.015,.015,.3,4), fine(0x4fb46a), x, .15, z)); h.add(mesh(sph(.09), mat(KIT.BLOOM[i % 5]), x, .33, z)); const lf = mesh(sph(.07), fine(0x4fb46a), x + .06, .12, z); lf.scale.y = .4; h.add(lf); });
  const hb = hitBox(2.3, 2.6, 1.9); hb.position.y = 1.3; h.add(hb); } bake(nanaHome);
// Pip's Shop on the Town Square: his cart grew up
const pipShop = new THREE.Group(); pipShop.position.copy(SQL(.9, -4.5)); faceCenter(pipShop, .9, -4.5); pipShop.userData = { kind:'home', room:'pip' }; scene.add(pipShop); lateClicks.push(pipShop);
{ const h = pipShop, wallM = mat(0x86c7ff, { map:tx('planks', 6, 1) }), cream = mat(0xfff6e6), rose = mat(0xff8fa3);
  h.add(mesh(new THREE.BoxGeometry(2.3,1.5,1.5), wallM, 0, .75, 0)); KIT.foot(h, 2.3, 1.5, 0, 5);
  [[-1.15,.75],[1.15,.75]].forEach(([x, z]) => h.add(mesh(new THREE.BoxGeometry(.12,1.5,.12), cream, x, .75, z)));
  h.add(mesh(new THREE.BoxGeometry(2.5,.14,1.7), cream, 0, 1.57, 0)); h.add(mesh(new THREE.BoxGeometry(2.36,.2,1.56), mat(0x6fb3ee), 0, 1.74, 0)); h.add(mesh(new THREE.BoxGeometry(2.5,.08,1.7), cream, 0, 1.86, 0)); // a low wall around the flat roof
  for (let i = 0; i < 6; i++) { const st = mesh(new THREE.BoxGeometry(.4,.07,.8), i % 2 ? cream : rose, -1 + i*.4, 1.42, 1.05); st.rotation.x = .3; h.add(st); const sc = mesh(new THREE.CylinderGeometry(.2,.2,.05,12,1,false,0,Math.PI), i % 2 ? cream : rose, -1 + i*.4, 1.3, 1.42); sc.rotation.set(0, Math.PI / 2, Math.PI / 2 + .3); sc.rotation.set(Math.PI / 2 + .3, 0, Math.PI); h.add(sc); } // striped awning with a scalloped edge
  [-1.1, 1.1].forEach(x => { const br = mesh(new THREE.BoxGeometry(.05,.05,.75), mat(0x9b6b4a), x, 1.28, 1.08); br.rotation.x = .3; h.add(br); });
  KIT.door(h, -.6, 0, .76, { w:.56, h:.98, color:0xfff6e6, frame:0xff8fa3, pane:true, arch:false });
  KIT.win(h, .45, .88, .76, { w:.84, h:.56, frame:0xfff6e6 }); h.add(mesh(new THREE.BoxGeometry(.86,.04,.2), mat(0xc98f58), .45, .66, .85));
  [0xffc857,0x8fdc8a,0xc9b6ff,0xff8fa3].forEach((c, i) => { h.add(mesh(new THREE.BoxGeometry(.14,.16,.1), mat(c), .14 + i*.2, .77, .87)); h.add(mesh(new THREE.BoxGeometry(.15,.03,.11), fine(0xffffff), .14 + i*.2, .8, .87)); }); // jars and boxes in the window
  const sg = signBoard("Pip's Shop", 1.5, .4, .5); sg.position.set(0, 1.72, 0); h.add(sg);
  for (let i = 0; i < 9; i++) { const fl = mesh(new THREE.ConeGeometry(.07,.14,3), fine(KIT.BLOOM[i % 5]), -1.08 + i * .27, 1.5 - Math.sin(i / 8 * Math.PI) * .07, .86); fl.rotation.x = Math.PI; fl.scale.z = .3; h.add(fl); } // a string of little flags
  KIT.lantern(h, -1.02, 1.1, .88); KIT.barrel(h, 1.0, 1.0, .9); { const c = KIT.crate(h, -1.05, 1.05, .9, .3); [[-.08,.36,0,0xff8fa3],[.08,.36,.05,0xffc857],[0,.38,-.08,0x8fdc8a]].forEach(([x, y, z, col]) => c.add(mesh(sph(.08), mat(col), x, y, z))); }
  KIT.pot(h, .1, 1.0, .8, 2);
  const hb = hitBox(2.5, 2.4, 1.8); hb.position.y = 1.2; h.add(hb); } bake(pipShop);
// Captain Drizzle's cabin, on shore beside his ship: blue boards, a round window, a life ring
const drizzleHome = new THREE.Group(); drizzleHome.position.set(ORCH_POS.x - 3, ORCH_POS.y, ORCH_POS.z + 5); drizzleHome.userData = { kind:'home', room:'drizzle' }; scene.add(drizzleHome); lateClicks.push(drizzleHome);
{ const h = drizzleHome, cream = mat(0xfff6e6), roofM = mat(0xd9a066, { map:tx('planks', 1, 8) });
  h.add(mesh(new THREE.BoxGeometry(2,1.4,1.5), mat(0x3f86c9), 0, .7, 0)); KIT.boards(h, 2.01, 1.4, .7, .756, 8); KIT.boards(h, 1.5, 1.4, .7, 1.006, 8, 0, .18, Math.PI / 2); KIT.foot(h, 2, 1.5, 0, 8);
  h.add(mesh(new THREE.BoxGeometry(2.06,.14,1.56), cream, 0, .45, 0)); [[-1,.75],[1,.75]].forEach(([x, z]) => h.add(mesh(new THREE.BoxGeometry(.1,1.4,.1), cream, x, .7, z)));
  const rf = mesh(new THREE.CylinderGeometry(.85,.85,2.2,18,1,false,0,Math.PI), roofM, 0, 1.4, 0); rf.rotation.z = Math.PI/2; rf.scale.set(.55, 1, 1); h.add(rf); // a roof curved like an upturned boat, with ribs
  [-1.05,-.52,0,.52,1.05].forEach(x => { const rb = mesh(new THREE.TorusGeometry(.86,.035,6,16,Math.PI), mat(0x9b6b4a), x, 1.4, 0); rb.rotation.y = Math.PI / 2; rb.scale.set(1, .56, 1); h.add(rb); });
  [-1.11, 1.11].forEach(x => { const e = mesh(new THREE.CircleGeometry(.84, 18, 0, Math.PI), mat(0x3f86c9), x, 1.4, 0); e.rotation.y = Math.sign(x) * Math.PI / 2; e.scale.y = .56; h.add(e); });
  KIT.door(h, -.45, 0, .76, { w:.56, h:.98, color:0xb98a5c, arch:false }); KIT.win(h, -.45, .72, .84, { w:.22, round:true, bars:false, lit:false });
  KIT.win(h, .5, .85, .76, { w:.44, round:true, frame:0xfff6e6 }); for (let i = 0; i < 8; i++) h.add(mesh(sph(.022), fine(0xffc857), .5 + Math.cos(i * Math.PI / 4) * .26, .85 + Math.sin(i * Math.PI / 4) * .26, .82)); // a porthole with brass bolts
  h.add(mesh(new THREE.TorusGeometry(.2,.07,8,20), mat(0xff5a5a), 0, 1.75, .5)); [0, 1, 2, 3].forEach(i => h.add(mesh(new THREE.BoxGeometry(.1,.15,.16), cream, Math.cos(i * Math.PI/2) * .2, 1.75 + Math.sin(i * Math.PI/2) * .2, .5)));
  h.add(mesh(new THREE.CylinderGeometry(.03,.03,1,6), mat(0x9b6b4a), .85, 2.2, -.4)); h.add(mesh(sph(.045), fine(0xffc857), .85, 2.72, -.4)); h.add(mesh(new THREE.PlaneGeometry(.4,.24), new THREE.MeshStandardMaterial({ color:0xff5a5a, side:THREE.DoubleSide }), 1.06, 2.56, -.4));
  KIT.lantern(h, .98, 1.05, .88); KIT.barrel(h, 1.25, .5, 1);
  { const iron = mat(0x4a4450), an = KIT.at(h, -1.2, 0, .7, .4); an.rotation.z = .25; an.add(mesh(new THREE.CylinderGeometry(.03,.03,.7,6), iron, 0, .4, 0)); an.add(mesh(new THREE.TorusGeometry(.07,.02,6,12), iron, 0, .8, 0)); an.add(mesh(new THREE.BoxGeometry(.3,.04,.04), iron, 0, .68, 0)); const ar = mesh(new THREE.TorusGeometry(.22,.035,6,14,Math.PI), iron, 0, .27, 0); ar.rotation.z = Math.PI; an.add(ar); } // an anchor leaning on the wall
  { const rope = mat(0xd9c39a); [0, 1, 2].forEach(i => { const c = mesh(new THREE.TorusGeometry(.16 - i * .02,.035,6,16), rope, .2, .04 + i * .06, 1.0); c.rotation.x = Math.PI / 2; h.add(c); }); [[.75,0xff5a5a],[.95,0xffc857]].forEach(([x, c]) => { h.add(mesh(sph(.1), mat(c), x, .1, 1.0)); h.add(mesh(new THREE.BoxGeometry(.21,.03,.21), fine(0xffffff), x, .1, 1.0)); }); } // a coil of rope and two floats
  const hb = hitBox(2.2, 2.6, 1.7); hb.position.y = 1.3; h.add(hb); } bake(drizzleHome);
// Moss & Fern's burrow: a round door in a grassy mound against the windmill
const twinsHome = new THREE.Group(); twinsHome.position.set(WIND_POS.x + 3.4, WIND_POS.y, WIND_POS.z - .3); twinsHome.userData = { kind:'home', room:'twins' }; scene.add(twinsHome); lateClicks.push(twinsHome);
{ const h = twinsHome; const md = mesh(new THREE.SphereGeometry(1.25, 28, 16, 0, Math.PI*2, 0, Math.PI/2), mat(0x7fbf6a, { map:tx('straw', 8, 2) }), 0, 0, 0); md.scale.set(1.05, .95, 1); h.add(md);
  for (let i = 0; i < 22; i++) { const a = KIT.hr(i) * Math.PI * 2, e = .15 + KIT.hr(i + 40) * 1.1, r = 1.27 * Math.cos(e), x = Math.cos(a) * r * 1.05, z = Math.sin(a) * r, y = Math.sin(e) * 1.19; if (z > .6 && Math.abs(x) < .75 && y < 1.15) continue; // grass tufts and flowers all over the mound
    if (i % 3) { const t = mesh(new THREE.ConeGeometry(.05,.2,4), fine(i % 2 ? 0x5fa85a : 0x8fcf7a), x, y + .06, z); h.add(t); } else { h.add(mesh(new THREE.CylinderGeometry(.01,.01,.14,4), fine(0x4fb46a), x, y + .05, z)); h.add(mesh(sph(.055), fine(KIT.BLOOM[i % 5]), x, y + .14, z)); } }
  for (let i = 0; i < 11; i++) { const a = Math.PI * (i / 10), st = mesh(new THREE.DodecahedronGeometry(.11), mat(i % 2 ? 0xbfb6a8 : 0xd8cfc0), Math.cos(a) * .66, .1 + Math.sin(a) * .62, 1.0); st.rotation.set(i, i * 2, 0); h.add(st); } // an arch of stones around the door
  KIT.door(h, 0, .06, 1.0, { w:1.0, round:true, color:0xc98f58, frame:0x6b4a30 });
  [-.82, .82].forEach(x => { const w = KIT.win(h, x, .62, .78, { w:.26, round:true, ry:x * .75, frame:0x8a6040 }); });
  h.add(mesh(new THREE.CylinderGeometry(.09,.09,.5,8), mat(0xb0a898), -.55, 1.25, -.2)); h.add(mesh(new THREE.ConeGeometry(.17,.14,8), mat(0x8a8f96), -.55, 1.6, -.2)); h.add(mesh(new THREE.CylinderGeometry(.11,.11,.04,8), mat(0x8a8f96), -.55, 1.5, -.2));
  [[1.05,.9,.14,0xe0556f],[1.2,1.05,.1,0xe0556f],[-1.15,.95,.12,0xf2c14e],[.95,1.15,.08,0xf2c14e]].forEach(([x, z, r, c]) => { h.add(mesh(new THREE.CylinderGeometry(r * .3, r * .4, r * 1.4, 8), mat(0xfff1d6), x, r * .7, z)); const cap = mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(c), x, r * 1.3, z); h.add(cap); [0, 2, 4].forEach(k => h.add(mesh(sph(r * .16), fine(0xffffff), x + Math.cos(k) * r * .55, r * 1.3 + r * .62, z + Math.sin(k) * r * .55))); }); // mushrooms
  [[0,1.35],[.12,1.72],[-.1,2.05]].forEach(([x, z], i) => { const st = mesh(new THREE.CylinderGeometry(.2,.22,.05,9), mat(i % 2 ? 0xbfb6a8 : 0xd8cfc0), x, .025, z); st.scale.z = .75; h.add(st); }); // stepping stones
  const sg = signBoard('The Burrow', 1.2, .36, 1); sg.position.set(1.6, 0, .9); h.add(sg);
  const hb = hitBox(2.5, 1.7, 2.4); hb.position.y = .85; h.add(hb); } bake(twinsHome);
// Lumen's studio on Night Isle: dark walls, a big window that glows, a crescent moon on the roof
const lumenHome = new THREE.Group(); lumenHome.position.set(NIGHT_POS.x - 1.8, NIGHT_POS.y, NIGHT_POS.z - 4.4); lumenHome.userData = { kind:'home', room:'lumen' }; scene.add(lumenHome); lateClicks.push(lumenHome);
{ const h = lumenHome, wallM = mat(0x3b2f6a, { map:tx('planks', 5, 1) }), trimM = mat(0x5b4a94), roofM = mat(0x2d3a6b, { map:tx('straw', 4, 1) });
  h.add(mesh(new THREE.BoxGeometry(2.1,1.6,1.6), wallM, 0, .8, 0)); KIT.foot(h, 2.1, 1.6, 0, 11);
  [[-1.05,.8],[1.05,.8],[-1.05,-.8],[1.05,-.8]].forEach(([x, z]) => h.add(mesh(new THREE.BoxGeometry(.13,1.6,.13), trimM, x, .8, z))); h.add(mesh(new THREE.BoxGeometry(2.2,.1,1.7), trimM, 0, 1.6, 0));
  KIT.hip(h, 1.64, 1.72, 1.05, roofM, .92);
  [[.5,1.95,.62],[-.45,2.15,.4],[.1,2.4,.22],[-.7,1.85,.68],[.75,2.2,.3],[-.1,1.9,.75]].forEach(([x, y, z], i) => h.add(mesh(sph(i % 2 ? .03 : .04), glow(i % 2 ? 0xffffff : 0xfff3a0), x, y, z))); // stars painted on the roof
  KIT.door(h, -.5, 0, .81, { w:.56, h:1, color:0xc9b6ff, frame:0x5b4a94, knob:0xffe07a }); { const st = mesh(new THREE.CircleGeometry(.09, 5), glow(0xffe07a), -.5, .78, .9); st.rotation.z = Math.PI / 10; h.add(st); }
  h.add(mesh(new THREE.BoxGeometry(1.04,.94,.07), trimM, .45, .95, .8)); h.add(mesh(new THREE.BoxGeometry(.9,.8,.06), glow(0xfff3a0), .45, .95, .82)); [-.15, .15].forEach(dx => h.add(mesh(new THREE.BoxGeometry(.035,.8,.03), fine(0x3b2f6a), .45 + dx, .95, .86))); h.add(mesh(new THREE.BoxGeometry(.9,.035,.03), fine(0x3b2f6a), .45, .95, .86)); h.add(mesh(new THREE.BoxGeometry(1.14,.07,.16), trimM, .45, .46, .86));
  const cres = mesh(new THREE.TorusGeometry(.2,.06,8,18,Math.PI*1.25), glow(0xfdf6dc), 0, 2.98, 0); cres.rotation.z = Math.PI*.9; h.add(cres); h.add(mesh(new THREE.CylinderGeometry(.015,.015,.2,5), fine(0x5b4a94), 0, 2.72, 0));
  const wh = halo(0xfff3a0, 1.6, .35); wh.position.set(.45, .95, 1); h.add(wh);
  for (let i = 0; i < 9; i++) { const t = i / 8; h.add(mesh(sph(.045), glow([0xffe0a8, 0xc9b6ff, 0x9fe7e0][i % 3]), -1 + t * 2, 1.52 - Math.sin(t * Math.PI) * .12, .86)); } // a string of lights under the roof
  [[-1.2,.95,0xff8fa3],[-1.0,1.1,0x9fe7e0],[-1.25,1.2,0xfff3a0]].forEach(([x, z, c]) => { h.add(mesh(new THREE.CylinderGeometry(.08,.07,.14,10), mat(0xdfe3ea), x, .07, z)); h.add(mesh(new THREE.CylinderGeometry(.07,.07,.02,10), glow(c), x, .145, z)); }); // pots of glowing paint
  { const br = mesh(new THREE.CylinderGeometry(.015,.015,.4,5), mat(0x9b6b4a), -1.0, .12, 1.25); br.rotation.z = 1.2; h.add(br); h.add(mesh(sph(.03), glow(0xff8fa3), -.82, .19, 1.25)); }
  const hb = hitBox(2.3, 2.8, 1.8); hb.position.y = 1.4; h.add(hb); } bake(lumenHome);
// The Museum, at the back of Orchard Isle: cream stone, four columns, and a red banner
const museumHome = new THREE.Group(); museumHome.position.set(ORCH_POS.x - .6, ORCH_POS.y, ORCH_POS.z - 4.4); museumHome.userData = { kind:'home', room:'museum' }; scene.add(museumHome); lateClicks.push(museumHome);
{ const h = museumHome, st = mat(0xf3ead8, { map:tx('stone', 2, 2) }), tr = mat(0xd9cdb6), tile = mat(0xb5622f, { map:tx('planks', 12, 1) });
  h.add(mesh(new THREE.BoxGeometry(2.6,1.7,1.6), st, 0, .95, -.1)); KIT.boards(h, 2.61, 1.7, .95, .706, 6, 0x6b5a40, .16);
  [[3.2,.1,2.5,.05,.2],[3,.1,2.3,.15,.15],[2.8,.1,2.1,.25,.1]].forEach(([w, hh, d, y, z]) => h.add(mesh(new THREE.BoxGeometry(w, hh, d), tr, 0, y, z))); // three wide steps
  [-1.05,-.38,.38,1.05].forEach(x => { h.add(mesh(new THREE.CylinderGeometry(.1,.12,1.36,14), st, x, 1.06, .85)); h.add(mesh(new THREE.BoxGeometry(.3,.08,.3), tr, x, .34, .85)); h.add(mesh(new THREE.CylinderGeometry(.15,.13,.06,14), tr, x, .41, .85)); h.add(mesh(new THREE.CylinderGeometry(.13,.1,.07,14), tr, x, 1.76, .85)); h.add(mesh(new THREE.BoxGeometry(.32,.07,.32), tr, x, 1.83, .85));
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI - Math.PI / 2 + .26, fl = new THREE.Mesh(new THREE.BoxGeometry(.012, 1.25, .012), new THREE.MeshBasicMaterial({ color:0x6b5a40, transparent:true, opacity:.25 })); fl.material.userData.outlineParameters = NO_OUTLINE; fl.position.set(x + Math.sin(a) * .112, 1.06, .85 + Math.cos(a) * .112); h.add(fl); } }); // columns with a base, a top, and grooves down the front
  h.add(mesh(new THREE.BoxGeometry(2.9,.16,2.1), tr, 0, 1.94, .1)); h.add(mesh(new THREE.BoxGeometry(2.7,.06,1.9), st, 0, 2.04, .1));
  { const rg = new THREE.CylinderGeometry(1.25, 1.25, 2.9, 3); rg.rotateZ(Math.PI/2); rg.rotateX(-Math.PI/2); const rf = mesh(rg, tile, 0, 2.32, .1); rf.scale.y = .45; h.add(rf);
    const sh = new THREE.Shape(); sh.moveTo(-1.02, 0); sh.lineTo(1.02, 0); sh.lineTo(0, .52); sh.closePath(); h.add(mesh(new THREE.ShapeGeometry(sh), st, 0, 2.08, 1.565)); h.add(mesh(new THREE.CircleGeometry(.15, 20), mat(0xffc857), 0, 2.26, 1.57)); h.add(mesh(new THREE.CircleGeometry(.09, 20), fine(0xd6332e), 0, 2.26, 1.575)); } // the triangle over the columns, with a gold medallion
  h.add(mesh(new THREE.BoxGeometry(.96,1.3,.05), tr, 0, .95, .7)); [-1, 1].forEach(sd => { KIT.door(h, sd * .2, .3, .72, { w:.38, h:1.18, color:0x8a5a3b, frame:0x7a5236, arch:false, knob:0xffc857 }); });
  [-.75,.75].forEach(x => { h.add(mesh(new THREE.BoxGeometry(.3,1,.03), mat(0xd6332e), x, 1.2, .73)); h.add(mesh(new THREE.BoxGeometry(.34,.04,.05), mat(0xffc857), x, 1.71, .73)); const tp = mesh(new THREE.ConeGeometry(.15,.16,4), mat(0xd6332e), x, .62, .73); tp.rotation.set(Math.PI, Math.PI / 4, 0); tp.scale.z = .1; h.add(tp); h.add(mesh(new THREE.CircleGeometry(.07, 5), fine(0xffc857), x, 1.25, .75)); }); // banners with a star
  [-1.35, 1.35].forEach(x => { h.add(mesh(new THREE.BoxGeometry(.4,.34,.4), tr, x, .17, 1.15)); h.add(mesh(sph(.24), mat(0x4fb46a), x, .52, 1.15)); h.add(mesh(sph(.16), mat(0x3f9a5c), x + .08, .72, 1.12)); KIT.lantern(h, x * .98, 1.3, .78); }); // clipped bushes in stone planters
  const sg = signBoard('Museum', 1.2, .36, 1); sg.position.set(1.9, 0, 1.1); h.add(sg);
  const hb = hitBox(3, 2.6, 2.3); hb.position.y = 1.3; h.add(hb); } bake(museumHome);
// --- small playthings: things to mess about with. Play a few times and the real idea behind each one shows up in Know-how ---
var toyBall, ballV = new THREE.Vector3(), ballPrev = new THREE.Vector3(), toySwing, toyPuffs, ballH = 0, ballVy = 0, ballUps = 0, ballHint = false;
{ // a ball on the meadow: walk into it and it rolls. Tap it and it pops up: tap again before it lands to keep it in the air
  toyBall = new THREE.Group(); toyBall.position.set(0, .24, 4.6); const sk = mesh(sph(.24), mat(0xffffff)); toyBall.add(sk);
  [[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]].forEach(([x, y, z]) => { const d = mesh(sph(.1), mat(0x3b2f4a), x * .17, y * .17, z * .17); toyBall.add(d); });
  const hb = hitBox(1.1, 1.1, 1.1); toyBall.add(hb); deco(hb, () => { const d = toyBall.position.clone().sub(player.position).setY(0); if (d.length() < .01) d.set(0, 0, -1); d.normalize();
    const air = ballH > .3; ballUps = air ? ballUps + 1 : 1; ballVy = 6.8; ballV.copy(d.multiplyScalar(air ? .5 : 1.1)); sfx('click'); tone(392 * Math.pow(1.06, Math.min(ballUps, 16)), { dur:.12, vol:.04 }); did('kick'); swingT = .5;
    if (ballUps > 1) { floatText(String(ballUps), toyBall.position); if (ballUps % 5 === 0) burst(toyBall.position.clone(), 0xffe07a, 14); } else if (!ballHint) { ballHint = true; toast('Tap the ball again before it lands.'); } }); hb.userData.label = 'Ball: tap to kick it up';
  scene.add(toyBall); lateClicks.push(toyBall); }
{ // dandelions gone to seed
  const g = new THREE.Group(); g.position.set(-2.6, 0, 5.7); g.scale.setScalar(1.7); toyPuffs = []; /* big enough to spot from across the meadow */
  [[0,0,.5],[.3,.12,.38],[-.22,.2,.42]].forEach(([x, z, h]) => { g.add(mesh(new THREE.CylinderGeometry(.012,.016,h,5), mat(0x6fae5a), x, h / 2, z)); const pf = new THREE.Group(); pf.position.set(x, h, z); pf.add(mesh(sph(.035), mat(0xd9cfa6))); for (let i = 0; i < 14; i++) { const a = i * 2.4, b = Math.acos(1 - 2 * (i + .5) / 14), d = mesh(sph(.022), mat(0xffffff), Math.sin(b) * Math.cos(a) * .1, Math.cos(b) * .1, Math.sin(b) * Math.sin(a) * .1); pf.add(d); } g.add(pf); toyPuffs.push(pf); });
  [[-.1,-.15],[.2,-.1]].forEach(([x, z]) => { const lf = mesh(sph(.09), mat(0x5fae6b), x, .03, z); lf.scale.set(1.6, .2, .7); g.add(lf); });
  const hb = hitBox(.9, .8, .8); hb.position.y = .4; g.add(hb); deco(hb, () => dandGame()); Object.defineProperty(hb.userData, 'label', { get:() => puffsLeft() > 0 ? 'Dandelions: tap to blow' : 'Dandelions: blown, new puffs tomorrow', enumerable:true });
  scene.add(g); lateClicks.push(g); }
var dandSprouts = [];
{ // dandelions you planted: where a seed you blew came down, a yellow one grows (the newest 5)
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.012,.016,.3,5), mat(0x6fae5a), 0, .15, 0)); const hd = mesh(sph(.09), mat(0xffd23f), 0, .32, 0); hd.scale.y = .5; g.add(hd); const pf = mesh(sph(.14), mat(0xffffff), 0, .38, 0); g.add(pf); g.userData = { hd, pf }; [[-.1,0],[.1,.04]].forEach(([x, z]) => { const lf = mesh(sph(.09), mat(0x5fae6b), x, .03, z); lf.scale.set(1.5, .2, .6); g.add(lf); });
    const hb = hitBox(.6, .6, .6); hb.position.y = .3; g.add(hb); deco(hb, () => { const sp = (S.dandSpots || [])[i]; if (!sp) return; if (sp[2] === S.day) return toast('You planted this today. It will be a puff ball tomorrow.'); if (sp[3] === S.day) return toast('A bare stem. It puffs up again by tomorrow.'); dandGame(i); }); g.userData.hb = hb; g.visible = false; scene.add(g); lateClicks.push(g); dandSprouts.push(g); } }
const puffsLeft = () => 3 - (S.puffs && S.puffs.day === S.day ? S.puffs.n : 0);
function drawToys() { if (toyPuffs) toyPuffs.forEach((pf, i) => pf.visible = i >= 3 - puffsLeft());
  dandSprouts.forEach((g, i) => { const sp = (S.dandSpots || [])[i]; g.visible = !!sp && S.where !== 'hut' && !VISIT; if (sp) { const young = sp[2] === S.day, bare = sp[3] === S.day; g.position.set(sp[0], 0, sp[1]); g.scale.setScalar(young ? .6 : bare ? 1 : 1.7); g.userData.hd.visible = young; /* a puff ball stands tall so it is easy to spot */ g.userData.pf.visible = !young && !bare; g.userData.hb.userData.label = young || bare ? 'Dandelion: tap to look' : 'Dandelion: tap to blow'; } }); }
let dand3 = null;
// dandelions: blow a seed off and ride the wind with it. Tap to puff it higher. Where it comes down on the island, a dandelion grows
function dandGame(from) { const own = from != null; if (dand3 || cine) return; if (!own && puffsLeft() <= 0) return toast('Only bare stems are left. New ones puff up by tomorrow.');
  closeDialog(); hideCard(); target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), base = own ? V(S.dandSpots[from][0], 0, S.dandSpots[from][1]) : toyPuffs[0].parent.position.clone(), dir = own && Math.hypot(base.x, base.z) > 1.5 ? base.clone().multiplyScalar(-1).normalize() : V(1, 0, -.55).normalize(), sideV = V(-dir.z, 0, dir.x);
  { const px = base.x - dir.x * .9, pz = base.z - dir.z * .9; if (walkY(px, pz) !== null) player.position.set(px, 0, pz); player.rotation.y = Math.atan2(dir.x, dir.z); }
  cine = { hold:true }; document.body.classList.add('in-cine');
  const seed = new THREE.Group(); seed.add(mesh(sph(.03), mat(0x8a6a48), 0, -.16, 0), mesh(new THREE.CylinderGeometry(.006,.006,.16,4), mat(0xf4efe0), 0, -.08, 0)); { const top = mesh(sph(.1), mat(0xffffff), 0, .02, 0); top.scale.y = .3; seed.add(top); for (let i = 0; i < 10; i++) { const a = i * .628; seed.add(mesh(sph(.022), mat(0xffffff), Math.cos(a) * .13, .05, Math.sin(a) * .13)); } } seed.scale.setScalar(2); seed.visible = false; scene.add(seed);
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="dnMsg"></p><div class="fhbtns"><button id="dnAct"></button><button id="dnDone" class="ghost">Done</button></div>`; document.body.appendChild(hud);
  const msg = t => { const m = $('dnMsg'); if (m) m.innerHTML = t; };
  let state, t = 0, vy = 0, start = V(0, 0, 0), offT = 0, last = performance.now(), raf, look = base.clone().setY(.5);
  const ready = () => { state = 'ready'; seed.visible = false; $('dnAct').style.display = ''; $('dnAct').textContent = 'Blow'; msg(`Tap to blow a seed off.${S.puffBest ? ` Best: ${S.puffBest} steps.` : ''}`); };
  const dist = () => Math.max(0, seed.position.clone().sub(start).setY(0).dot(dir));
  const finish = landed => { state = 'done'; const left = own ? 0 : puffsLeft(); $('dnAct').style.display = left ? '' : 'none'; $('dnAct').textContent = `Blow again (${left} left)`;
    if (!landed) { seed.visible = false; return msg('<b>It sailed off the island.</b> Seeds that ride the wind can start a plant far from home.'); }
    const d = +dist().toFixed(1), best = d > (S.puffBest || 0); if (best) S.puffBest = d; sfx('step'); burst(seed.position.clone(), 0x8fdc8a, 10);
    let grow = false; if (!nearThing(seed.position.x, seed.position.z) && !tileGroups.some(tg => Math.hypot(tg.position.x - seed.position.x, tg.position.z - seed.position.z) < .8)) { grow = true; S.dandSpots = [...(S.dandSpots || []), [+seed.position.x.toFixed(2), +seed.position.z.toFixed(2), S.day]].slice(-5); drawToys(); seed.visible = false; }
    if (best && d > 2) [659, 880].forEach((f, i) => setTimeout(() => chime(f), i * 130));
    msg(`<b>It landed ${d} steps away.</b>${grow ? ' A dandelion grows here now.' : ''}${best ? ' <b>A new best!</b>' : ` Best: ${S.puffBest}.`}`); save(); };
  const press = () => {
    if (state === 'ready') { const hp = new THREE.Vector3(); if (own) { hp.copy(base).setY(.36); if (S.dandSpots[from]) S.dandSpots[from][3] = S.day; } else { const n = 3 - puffsLeft(); (toyPuffs[n] || toyPuffs[0]).getWorldPosition(hp); S.puffs = { day:S.day, n:n + 1 }; } drawToys();
      seed.position.copy(hp); start.copy(hp); seed.visible = true; vy = 1.7; t = 0; offT = 0; state = 'fly'; sfx('swish'); did('blow'); for (let i = 0; i < 3; i++) setTimeout(() => burst(hp.clone().addScaledVector(dir, i * .5).setY(hp.y + i * .25), 0xffffff, 12), i * 160);
      $('dnAct').textContent = 'Puff'; msg('Tap to puff it higher.<br>Land it as far as you can, before the edge.'); }
    else if (state === 'fly') { vy = 1.5; tone(880, { dur:.08, vol:.025 }); burst(seed.position.clone().setY(seed.position.y - .25), 0xffffff, 4); }
    else if (state === 'done' && !own && puffsLeft() > 0) ready(); };
  const end = () => { cancelAnimationFrame(raf); hud.remove(); removeEventListener('keydown', key); scene.remove(seed); dand3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); save(); };
  const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); } };
  addEventListener('keydown', key); $('dnAct').addEventListener('pointerdown', e => { e.preventDefault(); press(); }); $('dnDone').onclick = end;
  const step = dt => {
    if (state === 'fly') { t += dt; vy = Math.max(-.8, vy - 1.6 * dt); const p = seed.position, sp = 1.5 + .35 * Math.sin(t * 1.3); p.addScaledVector(dir, sp * dt); p.y += (vy + .25 * Math.sin(t * 2.1)) * dt; if (p.y > 4.2) { p.y = 4.2; vy = Math.min(vy, 0); }
      seed.rotation.z = Math.sin(t * 3) * .25; seed.rotation.y += dt * 1.2;
      const gy = groundAt(p.x, .5, p.z); if (t > 2.5) msg(`<b style="font-size:20px">${dist().toFixed(1)}</b> steps`);
      if (gy !== null && p.y - .24 <= gy) { p.y = gy + .24; finish(true); }
      else if (gy === null && ((offT += dt) > 2.4 || p.y < -1.5)) finish(false); }
    const flying = state === 'fly' || (state === 'done' && seed.visible), c = flying ? seed.position : base.clone().setY(.5);
    camera.position.lerp(flying ? c.clone().addScaledVector(sideV, 4.4).addScaledVector(dir, -1.2).setY(c.y + 1.3) : base.clone().addScaledVector(dir, -2.4).addScaledVector(sideV, 2.6).setY(1.9), 1 - Math.pow(.02, dt)); look.lerp(flying ? c.clone().addScaledVector(dir, .8) : c, 1 - Math.pow(.01, dt)); camera.lookAt(look); };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); raf = requestAnimationFrame(loop); };
  ready(); dand3 = { press, end, step, get state() { return { state, y:seed.position.y, d:state === 'ready' ? 0 : dist(), vy, left:puffsLeft() }; } }; loop(); }
{ // a swing on Windmill Isle
  const g = new THREE.Group(); g.position.set(WIND_POS.x - 3.8, WIND_POS.y, WIND_POS.z - 4.6); const wood = mat(0x9b6b4a);
  [-.9,.9].forEach(x => [-.5,.5].forEach(z => { const leg = mesh(new THREE.CylinderGeometry(.05,.06,2.3,8), wood, x, 1.1, z * .5); leg.rotation.x = -z * .45; g.add(leg); })); g.add(mesh(new THREE.CylinderGeometry(.05,.05,2,8), wood, 0, 2.15, 0).rotateZ(Math.PI/2));
  toySwing = new THREE.Group(); toySwing.position.set(0, 2.15, 0); [-.3,.3].forEach(x => toySwing.add(mesh(new THREE.CylinderGeometry(.012,.012,1.5,5), mat(0xe0c98f), x, -.75, 0))); toySwing.add(mesh(new THREE.BoxGeometry(.75,.05,.28), mat(0xd6332e), 0, -1.5, 0)); g.add(toySwing);
  const hb = hitBox(2, 2.3, 1.2); hb.position.y = 1.15; g.add(hb); deco(hb, () => swingGame()); hb.userData.label = 'Swing: tap to swing';
  scene.add(g); lateClicks.push(g); solid(g, .9); }
{ // flat stones by the Orchard dock, for skipping
  const g = new THREE.Group(); g.position.set(ORCH_POS.x + 5.2, ORCH_POS.y, ORCH_POS.z - 2.0);
  [[0,.04,0,.2],[.18,.05,.12,.16],[-.14,.04,.14,.15],[.04,.11,.05,.15],[-.02,.17,.03,.12]].forEach(([x, y, z, r], i) => { const st = mesh(sph(r), mat([0x9aa0a8,0x8a8f96,0xb3b8be,0xa3a8ae,0xc4c9ce][i]), x, y, z); st.scale.y = .28; g.add(st); });
  const hb = hitBox(.9, .6, .9); hb.position.y = .3; g.add(hb); deco(hb, () => skipGame()); hb.userData.label = 'Flat stones: tap to skip one';
  scene.add(g); lateClicks.push(g); }
function toyTick(dt, now) {
  if (toySwing && !swing3) toySwing.rotation.x = Math.sin(now * 1.6) * .12;
  if (!toyBall || S.where === 'hut') return; const b = toyBall.position, pl = player.position;
  if (ballH > 0 || ballVy > 0) { ballVy -= 15 * dt; ballH += ballVy * dt; // up in the air, and back down with a bounce
    if (ballH <= 0) { ballH = 0; if (ballUps > 1) { const best = ballUps > (S.ballBest || 0); if (best) { S.ballBest = ballUps; save(); } toast(`${ballUps} kicks in the air.${best ? ' A new best!' : ` Best: ${S.ballBest}.`}`); if (best) chime(1047); } ballUps = 0;
      if (ballVy < -2.5) { ballVy = -ballVy * .42; sfx('step'); } else ballVy = 0; } }
  b.y = .24 + ballH;
  if (ballH < .3 && Math.abs(pl.y) < 1 && Math.hypot(pl.x - b.x, pl.z - b.z) < .6) { const mv = pl.clone().sub(ballPrev).setY(0); if (mv.length() > .001) { const d = b.clone().sub(pl).setY(0).normalize(); ballV.copy(d.multiplyScalar(Math.min(7, 2.5 + mv.length() / Math.max(dt, .001) * .8))); did('kick', .34); } }
  ballPrev.copy(pl);
  const sp = ballV.length(); if (sp < .02) { ballV.set(0, 0, 0); return; }
  let nx = b.x + ballV.x * dt, nz = b.z + ballV.z * dt;
  const hit = (cx, cz, r) => { const dx = nx - cx, dz = nz - cz, d = Math.hypot(dx, dz); if (d < r) { const n = new THREE.Vector3(dx / (d || 1), 0, dz / (d || 1)); ballV.reflect(n).multiplyScalar(.6); nx = cx + n.x * r; nz = cz + n.z * r; } };
  const P = new THREE.Vector3(); for (const o of (SOLIDS || [])) { if (!o.visible) continue; o.getWorldPosition(P); if (Math.abs(P.y) > 1 || Math.hypot(P.x, P.z) > 10) continue; const bx = o.userData.solidBox; hit(P.x, P.z + (bx ? bx[2] : 0), (bx ? Math.max(bx[0], bx[1]) : o.userData.solid) + .2); }
  const R = Math.hypot(nx, nz); if (R > 8.3) { const n = new THREE.Vector3(-nx / R, 0, -nz / R); ballV.reflect(n).multiplyScalar(.6); nx = -n.x * 8.3; nz = -n.z * 8.3; }
  toyBall.children[0].parent.rotation.x += ballV.z * dt / .24; toyBall.rotation.z -= ballV.x * dt / .24; b.x = nx; b.z = nz; ballV.multiplyScalar(Math.max(0, 1 - dt * (ballH > 0 ? .15 : 1.1))); }
// the swing: push in time and it climbs, push at the wrong moment and it sinks
// ---- things in the neighbors' homes that you try with your own hands. You do it first, and the reason shows up after ----
function tryIt(kicker, title, tip, art, fact, wire) {
  showCard(`<div class="kicker">${kicker}</div><h2>${title}</h2><p id="tyTip">${tip}</p><div id="tyArt" style="margin-top:8px;touch-action:manipulation;user-select:none;-webkit-user-select:none">${art}</div><div id="tyFact"></div>`, 'Close');
  let done = false, raf = 0, last = performance.now(), fn = null, T = 0;
  const tick = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; T += dt; if (fn && $('tyArt')) { fn(dt, T); raf = requestAnimationFrame(tick); } };
  cardCleanup = () => { cancelAnimationFrame(raf); fn = null; };
  const api = { tip:t => { if ($('tyTip')) $('tyTip').innerHTML = t; }, loop:f => { fn = f; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }, step:dt => { T += dt; if (fn) fn(dt, T); },
    reveal:() => { if (done || !$('tyFact')) return; done = true; chime(988); $('tyFact').innerHTML = (Array.isArray(fact) ? fact : fact.split(/(?<=[.?!]) +(?=[A-Z0-9])/)).map(l => `<p class="gap">${l}</p>`).join(''); },
    on:(sel, f) => document.querySelectorAll('#tyArt ' + sel).forEach(b => b.onclick = () => f(b)), el:id => document.getElementById(id) };
  window.__toy = api; wire(api); } // (window.__toy lets tests step the activity by hand)
const SVGW = 'style="display:block;width:100%;max-width:340px;margin:0 auto"';
const TOYS = {
  piano() { const WF = [261.6,293.7,329.6,349.2,392,440,493.9,523.3,587.3,659.3], BK = [[0,277.2],[1,311.1],[3,370],[4,415.3],[5,466.2],[7,554.4],[8,622.3]]; let blacks = 0;
    tryIt("ALLEGRA'S MUSIC HALL", '🎹 The piano', 'Play it. Then try only the black keys.',
      `<svg viewBox="0 0 300 110" ${SVGW}>${WF.map((f, i) => `<rect data-f="${f}" x="${i * 30 + .5}" y="1" width="29" height="108" rx="3" fill="#fffdf6" stroke="#3b2f4a"/>`).join('')}${BK.map(([i, f]) => `<rect data-f="${f}" data-b="1" x="${(i + 1) * 30 - 10}" y="1" width="20" height="66" rx="3" fill="#3b2f4a"/>`).join('')}</svg>`,
      'A full piano has 88 keys: 52 white and 36 black. The black keys make a 5-note scale. That is why they sound good in any order.',
      t => document.querySelectorAll('#tyArt rect').forEach(k => k.onpointerdown = e => { e.preventDefault(); chime(+k.dataset.f); const c = k.getAttribute('fill'); k.setAttribute('fill', '#ffc857'); setTimeout(() => k.setAttribute('fill', c), 160); if (k.dataset.b && ++blacks >= 5) t.reveal(); })); },
  metronome() { let bpm = 0, ph = 0, streak = 0;
    tryIt("ALLEGRA'S MUSIC HALL", '⏱️ The metronome', 'Pick a speed.',
      `<svg viewBox="0 0 300 130" ${SVGW}><path d="M110 125 L135 15 H165 L190 125Z" fill="#b8793f" stroke="#7a5236" stroke-width="3"/><g id="mtArm"><path d="M150 112 V22" stroke="#e8e2d0" stroke-width="4" stroke-linecap="round"/><rect x="141" y="40" width="18" height="12" rx="2" fill="#ffc857"/></g><circle cx="150" cy="112" r="5" fill="#3b2f4a"/></svg>
       <div class="chips" style="justify-content:center">${[[60, 'Slow: 60'], [100, 'Walking: 100'], [160, 'Fast: 160']].map(([b, l]) => `<button data-bpm="${b}" class="ghost">${l}</button>`).join('')}</div><button id="mtTap" style="margin-top:8px;display:none">Tap on each tick</button>`,
      'The numbers are beats in 1 minute. 60 is 1 beat each second. The metronome was patented in 1815. That same year, Beethoven began writing its speeds on his music.',
      t => { t.on('[data-bpm]', b => { bpm = +b.dataset.bpm; streak = 0; document.querySelectorAll('[data-bpm]').forEach(x => x.className = x === b ? '' : 'ghost'); t.el('mtTap').style.display = ''; t.tip('Now tap the button on each tick. Get 4 in a row.'); });
        t.el('mtTap').onpointerdown = e => { e.preventDefault(); const off = ph - Math.round(ph); if (Math.abs(off) < .2) { streak++; t.tip(`<b>On the beat.</b> ${Math.min(streak, 4)} of 4.`); if (streak >= 4) t.reveal(); } else { streak = 0; t.tip(off > 0 ? '<b>Late.</b> Tap right on the tick.' : '<b>Early.</b> Tap right on the tick.'); } };
        t.loop(dt => { if (!bpm) return; const b0 = Math.floor(ph); ph += dt * bpm / 60; if (Math.floor(ph) > b0) tone(Math.floor(ph) % 4 ? 880 : 1175, { dur:.05, vol:.05 }); t.el('mtArm').setAttribute('transform', `rotate(${(Math.cos(ph * Math.PI) * 24).toFixed(1)} 150 112)`); }); }); },
  fork() { let f = 422, shake = 0, plk = 0;
    tryIt("ALLEGRA'S MUSIC HALL", '🎵 The tuning fork', 'Hit the fork. Then pluck the string.',
      `<svg viewBox="0 0 300 110" ${SVGW}><g id="tfFork"><path d="M60 100 V62 M48 62 H72 M48 62 V12 M72 62 V12" fill="none" stroke="#9aa3ad" stroke-width="7" stroke-linecap="round"/></g><circle cx="130" cy="55" r="6" fill="#7a5236"/><circle cx="280" cy="55" r="6" fill="#7a5236"/><path id="tfStr" d="M130 55 Q205 55 280 55" fill="none" stroke="#c9a06a" stroke-width="2.5"/></svg>
       <div class="chips" style="justify-content:center"><button id="tfHit">Hit the fork</button><button id="tfPluck">Pluck the string</button><button id="tfUp" class="ghost">Tighter</button><button id="tfDown" class="ghost">Looser</button></div>`,
      'This fork shakes 440 times a second. That note, called A, is the world standard for tuning. 2 notes that are close but not the same make a slow wobble, called beats.',
      t => { t.el('tfHit').onclick = () => { tone(440, { dur:1.6, vol:.05 }); shake = 1; };
        t.el('tfPluck').onclick = () => { tone(f, { dur:1.6, vol:.05 }); tone(440, { dur:1.6, vol:.05 }); plk = 1; shake = 1; if (f === 440) { t.tip('<b>No wobble.</b> The string matches the fork. It is in tune.'); t.reveal(); } else t.tip(`<b>They clash.</b> The sound wobbles. The string is too ${f < 440 ? 'low. Make it tighter.' : 'high. Make it looser.'}`); };
        t.el('tfUp').onclick = () => { f = Math.min(458, f + 6); sfx('click'); t.tip('Tighter. Pluck it again.'); }; t.el('tfDown').onclick = () => { f = Math.max(404, f - 6); sfx('click'); t.tip('Looser. Pluck it again.'); };
        t.loop((dt, T) => { shake = Math.max(0, shake - dt * .7); plk = Math.max(0, plk - dt * .7); t.el('tfFork').setAttribute('transform', `translate(${(Math.sin(T * 90) * 2 * shake).toFixed(2)} 0)`); t.el('tfStr').setAttribute('d', `M130 55 Q205 ${(55 + Math.sin(T * 70) * 9 * plk).toFixed(1)} 280 55`); }); }); },
  scale() { const W = 8; let sum = 0, ang = -16;
    tryIt("PIP'S SHOP", '⚖️ The balance scale', 'How heavy is the sack? Add weights until the beam is level.',
      `<svg viewBox="0 0 300 140" ${SVGW}><path d="M150 30 V125 M120 125 H180" stroke="#7a5236" stroke-width="6" stroke-linecap="round"/><g id="scBeam"><path d="M50 30 H250" stroke="#b8793f" stroke-width="6" stroke-linecap="round"/><g id="scL"><path d="M50 30 L30 80 H70Z" fill="none" stroke="#9aa3ad" stroke-width="1.5"/><path d="M25 80 H75" stroke="#7a5236" stroke-width="4" stroke-linecap="round"/><path d="M36 79 q14 -34 28 0Z" fill="#d9c49a" stroke="#a8875a"/><text x="50" y="74" text-anchor="middle" font-size="12" font-weight="800" fill="#7a5236">?</text></g><g id="scR"><path d="M250 30 L230 80 H270Z" fill="none" stroke="#9aa3ad" stroke-width="1.5"/><path d="M225 80 H275" stroke="#7a5236" stroke-width="4" stroke-linecap="round"/><text id="scSum" x="250" y="74" text-anchor="middle" font-size="14" font-weight="800" fill="#3b2f4a">0</text></g></g></svg>
       <div class="chips" style="justify-content:center">${[1, 2, 5].map(n => `<button data-w="${n}">+${n}</button>`).join('')}<button id="scClr" class="ghost">Take all off</button></div>`,
      ['On the Moon, everything weighs 1/6 as much.', 'A bathroom scale there would show 1/6 of your weight.', 'This scale would still say 8.', 'Both sides get lighter by the same amount, so they still balance.'],
      t => { const set = () => { t.el('scSum').textContent = sum; t.tip(sum === W ? `<b>Level.</b> The sack weighs ${W}.` : sum > W ? '<b>Too much.</b> Your side dropped. Take all off and try again.' : `Your side holds ${sum}. The sack is heavier.`); if (sum === W) t.reveal(); };
        t.on('[data-w]', b => { sum += +b.dataset.w; sfx('click'); set(); }); t.el('scClr').onclick = () => { sum = 0; set(); t.tip('How heavy is the sack? Add weights until the beam is level.'); };
        t.loop(dt => { const want = Math.max(-16, Math.min(16, (sum - W) * 4)); ang += (want - ang) * Math.min(1, dt * 5); t.el('scBeam').setAttribute('transform', `rotate(${ang.toFixed(2)} 150 30)`); ['scL', 'scR'].forEach((id, i) => t.el(id).setAttribute('transform', `rotate(${(-ang).toFixed(2)} ${i ? 250 : 50} 30)`)); }); }); },
  knots() { const n = 3 + Math.floor(Math.random() * 5), GLASS = 8; let run = 0, tm = 0, count = 0;
    tryIt("CAPTAIN DRIZZLE'S SHIP", '🪢 How fast is the ship?', 'Drop the rope in the sea. Count each knot as it slides through your hand.',
      `<svg viewBox="0 0 300 100" ${SVGW}><rect width="300" height="100" rx="10" fill="#dff1fb"/><path d="M0 50 H300" stroke="#c9a06a" stroke-width="4"/><g id="knRope"></g><path d="M150 26 V74" stroke="#3b2f4a" stroke-width="3" stroke-dasharray="4 4"/><text x="150" y="20" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">your hand</text><rect x="20" y="84" width="260" height="8" rx="4" fill="#fff"/><rect id="knGlass" x="20" y="84" width="0" height="8" rx="4" fill="#ffc857"/></svg>
       <div class="chips" style="justify-content:center"><button id="knGo">Drop the rope</button><button id="knTap" style="display:none">Knot!</button></div>`,
      "A ship's speed is still measured in knots. Sailors let a knotted rope run out while a sand glass ran. The number of knots that passed was the speed. 1 knot is about 1.85 kilometers an hour.",
      t => { t.el('knGo').onclick = () => { run = 1; tm = 0; count = 0; t.el('knGo').style.display = 'none'; t.el('knTap').style.display = ''; t.tip('Tap <b>Knot!</b> each time a knot crosses your hand.'); sfx('cast'); };
        t.el('knTap').onpointerdown = e => { e.preventDefault(); if (run === 1) { count++; sfx('click'); t.tip(`Knots counted: <b>${count}</b>`); } };
        t.loop(dt => { if (run !== 1) return; tm += dt; t.el('knGlass').setAttribute('width', Math.min(260, tm / GLASS * 260)); const sp = n * 150 / GLASS; // each knot is 150 apart on the rope, and n of them cross in the time of the glass
          t.el('knRope').innerHTML = [...Array(n)].map((_, i) => { const x = 150 + (i + .5) * 150 - tm * sp; return x > -10 && x < 310 ? `<circle cx="${x.toFixed(1)}" cy="50" r="7" fill="#9b6b4a"/>` : ''; }).join('');
          if (tm >= GLASS) { run = 2; t.el('knTap').style.display = 'none'; t.el('knGo').style.display = ''; t.el('knGo').textContent = 'Try again'; t.tip(count === n ? `<b>${n} knots.</b> The ship is sailing at ${n} knots.` : `You counted ${count}. ${n} went by. The ship is sailing at ${n} knots.`); t.reveal(); } }); }); },
  compass() { let h = 0, hv = 0, mag = false, nd = 0, turns = 0;
    tryIt("CAPTAIN DRIZZLE'S SHIP", '🧭 The compass', 'Turn around. Watch the red needle.',
      `<svg viewBox="0 0 300 150" ${SVGW}><g id="cpCase"><circle cx="130" cy="75" r="62" fill="#f6ead8" stroke="#b8793f" stroke-width="6"/>${['N', 'E', 'S', 'W'].map((c, i) => `<text x="130" y="32" text-anchor="middle" font-size="14" font-weight="800" fill="#3b2f4a" transform="rotate(${i * 90} 130 75)">${c}</text>`).join('')}</g><g id="cpNeedle"><path d="M130 30 L138 75 H122Z" fill="#e5484d"/><path d="M130 120 L138 75 H122Z" fill="#cfd6dd"/></g><circle cx="130" cy="75" r="4" fill="#3b2f4a"/><g id="cpMag" style="display:none"><rect x="236" y="60" width="44" height="14" fill="#e5484d"/><rect x="236" y="74" width="44" height="14" fill="#9aa3ad"/><text x="258" y="104" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">magnet</text></g></svg>
       <div class="chips" style="justify-content:center"><button id="cpL">Turn left</button><button id="cpR">Turn right</button><button id="cpM" class="ghost">Hold a magnet close</button></div>`,
      'The needle is a tiny magnet, and Earth is a giant one. That is why 1 end always points north. A magnet close by pulls harder than the Earth, so it fools the needle.',
      t => { const turn = d => { h += d * 90; turns++; sfx('click'); t.tip(mag ? 'The needle only looks at the magnet now.' : '<b>The case turned. The needle did not.</b> It still points north.'); }; t.el('cpL').onclick = () => turn(-1); t.el('cpR').onclick = () => turn(1);
        t.el('cpM').onclick = () => { mag = !mag; t.el('cpMag').style.display = mag ? '' : 'none'; t.el('cpM').textContent = mag ? 'Take the magnet away' : 'Hold a magnet close'; t.tip(mag ? '<b>The needle swings to the magnet.</b> North is forgotten.' : 'The needle swings back to north.'); if (turns) t.reveal(); };
        t.loop(dt => { hv += (h - hv) * Math.min(1, dt * 6); const want = mag ? 90 : 0; nd += (want - nd) * Math.min(1, dt * 4); t.el('cpCase').setAttribute('transform', `rotate(${hv.toFixed(1)} 130 75)`); t.el('cpNeedle').setAttribute('transform', `rotate(${(nd + Math.sin(performance.now() / 90) * (Math.abs(want - nd) > 2 ? 3 : .6)).toFixed(1)} 130 75)`); }); }); },
  hammock() { let A = 5, big = 0, mug = 0, mv = 0;
    tryIt("CAPTAIN DRIZZLE'S SHIP", "🛏️ The sailor's hammock", 'The ship is rolling. Watch the mug on the shelf, and the sailor in the hammock.',
      `<svg viewBox="0 0 300 150" ${SVGW}><rect width="300" height="150" rx="10" fill="#dff1fb"/><g id="hmShip"><rect x="30" y="20" width="240" height="110" rx="8" fill="#e9c99a" stroke="#7a5236" stroke-width="5"/><path d="M40 96 H130" stroke="#7a5236" stroke-width="5" stroke-linecap="round"/><g id="hmMug"><rect x="78" y="80" width="14" height="14" rx="2" fill="#fff" stroke="#3b2f4a"/></g><circle cx="165" cy="40" r="3.5" fill="#3b2f4a"/><circle cx="250" cy="40" r="3.5" fill="#3b2f4a"/><g id="hmBed"><path d="M165 40 Q207 100 250 40" fill="#fff6e6" stroke="#b8793f" stroke-width="3"/><circle cx="190" cy="62" r="8" fill="#f1c9a5"/><path d="M198 68 Q215 80 235 62" stroke="#7ec8e3" stroke-width="9" stroke-linecap="round" fill="none"/></g></g></svg>
       <div class="chips" style="justify-content:center"><button id="hmS" class="ghost">Small waves</button><button id="hmB">Big waves</button></div>`,
      "A hammock hangs from 2 hooks, so it can swing. When the ship rolls, the hammock stays level and nobody gets tipped out of bed. Things on a shelf are not so lucky.",
      t => { t.el('hmS').onclick = () => { A = 5; t.tip('Small waves. The mug holds on.'); }; t.el('hmB').onclick = () => { A = 18; t.tip('<b>Big waves.</b> The mug slides. The sailor sleeps on.'); };
        t.loop((dt, T) => { const th = A * Math.sin(T * 1.7), slip = Math.abs(th) > 9 ? Math.sin(th * Math.PI / 180) * 420 : 0; mv = (mv + slip * dt) * (1 - dt * 1.5); mug += mv * dt; if (mug < -36) { mug = -36; mv = 0; } if (mug > 36) { mug = 36; mv = 0; }
          t.el('hmShip').setAttribute('transform', `rotate(${th.toFixed(2)} 150 130)`); t.el('hmMug').setAttribute('transform', `translate(${mug.toFixed(1)} 0)`); t.el('hmBed').setAttribute('transform', `rotate(${(-th * .85).toFixed(2)} 207 40)`); if (A > 10 && (big += dt) > 3.5) t.reveal(); }); }); },
  biscuit() { let bites = 0, soft = false, broken = false;
    tryIt("CAPTAIN DRIZZLE'S SHIP", "🍪 Ship's biscuit", 'Tap the biscuit to take a bite.',
      `<svg viewBox="0 0 300 120" ${SVGW}><g id="bsB" style="cursor:pointer"><rect x="95" y="20" width="110" height="80" rx="8" fill="#e3c391" stroke="#b08a52" stroke-width="3"/>${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<circle cx="${117 + c * 22}" cy="${40 + r * 20}" r="2.5" fill="#b08a52"/>`).join('')).join('')}<path id="bsCrack" d="" fill="none" stroke="#7a5236" stroke-width="2.5"/></g><g id="bsCup" style="display:none"><path d="M225 60 h50 v22 q0 16 -25 16 q-25 0 -25 -16Z" fill="#fff" stroke="#3b2f4a" stroke-width="2"/><path d="M229 64 h42" stroke="#8a5a2b" stroke-width="5"/></g></svg>
       <div class="chips" style="justify-content:center"><button id="bsDunk" style="display:none">Dunk it in your drink</button></div>`,
      "Ship's biscuit is flour and water, baked hard so it keeps for years. For long trips it was baked 4 times. Sailors and soldiers dropped it in a hot drink to soften it.",
      t => { t.el('bsB').onpointerdown = e => { e.preventDefault(); if (broken) return; const b = t.el('bsB'); b.setAttribute('transform', 'translate(2 1)'); setTimeout(() => b.setAttribute('transform', ''), 70);
          if (soft) { broken = true; sfx('click'); t.el('bsCrack').setAttribute('d', 'M150 20 L143 45 L158 62 L146 82 L152 100'); t.tip('<b>It breaks.</b> Soft enough to eat now.'); return t.reveal(); }
          bites++; tone(180, { dur:.05, vol:.06, type:'square' }); t.tip(bites < 4 ? `<b>Clonk.</b> ${bites} ${bites === 1 ? 'bite' : 'bites'}. Not a dent.` : `<b>Clonk.</b> ${bites} bites. It is as hard as a brick.`); if (bites >= 4) { t.el('bsDunk').style.display = ''; t.el('bsCup').style.display = ''; } };
        t.el('bsDunk').onclick = () => { soft = true; sfx('water'); t.el('bsDunk').style.display = 'none'; t.el('bsB').querySelector('rect').setAttribute('fill', '#c9a06a'); t.tip('It soaks for a minute. Now tap it again.'); }; }); },
  gears() { let big = 0, want = 0, told = false;
    tryIt("THE TWINS' BURROW", '⚙️ The spare gears', 'Turn the big gear. Watch the small one.',
      `<svg viewBox="0 0 300 172" ${SVGW}><g id="grBig"><circle cx="110" cy="75" r="60" fill="#b8793f"/><circle cx="110" cy="75" r="64" fill="none" stroke="#b8793f" stroke-width="12" stroke-dasharray="6.7 6.7"/><circle cx="110" cy="75" r="8" fill="#7a5236"/><circle cx="110" cy="28" r="6" fill="#ffc857"/></g><g id="grSm"><circle cx="198" cy="75" r="18" fill="#d9a066"/><circle cx="198" cy="75" r="21.3" fill="none" stroke="#d9a066" stroke-width="12" stroke-dasharray="6.7 6.7"/><circle cx="198" cy="75" r="4" fill="#7a5236"/><circle cx="198" cy="62" r="4" fill="#e5484d"/></g><text id="grTxt" x="150" y="166" text-anchor="middle" font-size="12" font-weight="800" fill="#3b2f4a">Big gear: 0. Small gear: 0.</text></svg>
       <div class="chips" style="justify-content:center"><button id="grGo">Turn the big gear</button></div>`,
      'The big gear has 30 teeth and the small one has 10. Each tooth pushes 1 tooth. So the small gear must go around 3 times to keep up. Bikes use this to trade speed for strength.',
      t => { t.el('grGo').onclick = () => { want += .25; sfx('click'); };
        t.loop(dt => { if (big < want) big = Math.min(want, big + dt * .5); t.el('grBig').setAttribute('transform', `rotate(${(big * 360).toFixed(1)} 110 75)`); t.el('grSm').setAttribute('transform', `rotate(${(-big * 1080 + 6).toFixed(1)} 198 75)`); t.el('grTxt').textContent = `Big gear: ${+big.toFixed(2)}. Small gear: ${+(big * 3).toFixed(2)}.`;
          if (big >= 1 && !told) { told = true; t.tip('<b>1 turn of the big gear. 3 turns of the small one.</b>'); t.reveal(); } }); }); },
  worms() { let day = 0, wet = 0;
    const jar = (x, worm) => `<g transform="translate(${x} 0)"><rect x="10" y="20" width="90" height="110" rx="8" fill="#eef7fb" stroke="#9fc7da" stroke-width="3"/><rect x="13" y="50" width="84" height="26" fill="#6b4a32"/><rect x="13" y="76" width="84" height="24" fill="#d9c49a"/><rect x="13" y="100" width="84" height="27" fill="#8a6a48"/>${worm ? `<g id="wmMix" opacity="0"><rect x="13" y="50" width="84" height="77" fill="#7d5a3c"/><path d="M30 52 q10 20 -4 36 q-8 14 6 36 M62 52 q-10 26 8 40 q10 12 -2 32 M84 54 q6 30 -8 50" fill="none" stroke="#3b2a1c" stroke-width="4" stroke-linecap="round"/><path d="M40 70 q8 -6 14 2" fill="none" stroke="#e79a9a" stroke-width="4" stroke-linecap="round"/><path d="M70 104 q8 6 14 -2" fill="none" stroke="#e79a9a" stroke-width="4" stroke-linecap="round"/></g>` : ''}<rect id="${worm ? 'wmWa' : 'wmWb'}" x="13" y="50" width="84" height="0" fill="#7ec8e3" opacity=".85"/><text x="55" y="146" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">${worm ? 'with worms' : 'no worms'}</text></g>`;
    tryIt("THE TWINS' BURROW", '🪱 The worm jars', 'Both jars have 3 layers of soil. Only 1 has worms.',
      `<svg viewBox="0 0 300 150" ${SVGW}>${jar(30, true)}${jar(160, false)}</svg><div class="chips" style="justify-content:center"><button id="wmGo">A day goes by</button></div>`,
      'Worm tunnels let air and water down into the soil, so roots can drink and breathe. Worms also pull dead leaves down and mix the soil. Charles Darwin studied worms for 40 years and wrote a book about them in 1881.',
      t => { t.el('wmGo').onclick = () => { if (day < 3) { day++; sfx('click'); t.el('wmMix').setAttribute('opacity', day / 3); t.tip(day < 3 ? `Day ${day}. The worms are digging.` : '<b>Day 3.</b> The worm jar is all mixed, and full of tunnels.'); if (day === 3) t.el('wmGo').textContent = 'Pour water on both'; } else if (!wet) { wet = .001; sfx('water'); t.el('wmGo').style.display = 'none'; } };
        t.loop(dt => { if (!wet) return; wet = Math.min(1, wet + dt * .5); const a = t.el('wmWa'), b = t.el('wmWb'); b.setAttribute('y', 36); b.setAttribute('height', 14); a.setAttribute('y', 36 + wet * 14); a.setAttribute('height', Math.max(0, 14 * (1 - wet * 1.6)));
          if (wet >= 1) { t.tip('<b>With worms, the water sinks right in.</b> With no worms, it sits on top.'); t.reveal(); } }); }); },
  mushrooms() { let dark = false, dT = 0; const M = [[70, 110], [150, 96], [225, 112]];
    tryIt("THE TWINS' BURROW", '🍄 The glowing mushrooms', 'The lamp is on. Blow it out.',
      `<svg viewBox="0 0 300 140" ${SVGW}><defs><filter id="msGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter></defs><rect id="msBg" width="300" height="140" rx="10" fill="#f3e3c4"/>${M.map(([x, y]) => `<circle class="msG" cx="${x}" cy="${y - 14}" r="24" fill="#7dffb0" filter="url(#msGlow)" opacity="0"/><rect x="${x - 4}" y="${y - 12}" width="8" height="22" rx="3" fill="#e9e2cf"/><path class="msC" d="M${x - 20} ${y - 10} q20 -26 40 0Z" fill="#c9b58a"/>`).join('')}<g id="msBugs"></g></svg>
       <div class="chips" style="justify-content:center"><button id="msGo">Blow out the lamp</button></div>`,
      "More than 100 kinds of real mushrooms glow in the dark. Nobody is sure why. In 1 test in Brazil, the glow drew in insects that could carry the mushroom's spores away. Spores work like seeds.",
      t => { t.el('msGo').onclick = () => { dark = !dark; dT = 0; sfx('swish'); t.el('msGo').textContent = dark ? 'Light the lamp' : 'Blow out the lamp'; t.el('msBg').setAttribute('fill', dark ? '#14121f' : '#f3e3c4'); document.querySelectorAll('.msG').forEach(g => g.setAttribute('opacity', dark ? .9 : 0)); document.querySelectorAll('.msC').forEach(c => c.setAttribute('fill', dark ? '#9dffc4' : '#c9b58a')); t.tip(dark ? '<b>They glow green.</b> Watch what flies in.' : 'The lamp is on. Blow it out.'); };
        t.loop((dt, T) => { if (!dark) { t.el('msBugs').innerHTML = ''; return; } dT += dt; const k = Math.min(1, dT / 3.5); t.el('msBugs').innerHTML = M.map(([x, y], i) => { const sx = [10, 290, 150][i], sy = [20, 30, 5][i], bx = sx + (x - sx) * k + Math.sin(T * 6 + i) * 6 * (1.2 - k), by = sy + (y - 30 - sy) * k + Math.cos(T * 7 + i) * 5; return `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="2.5" fill="#ffe9a8"/>`; }).join(''); if (dT > 3.5) t.reveal(); }); }); },
  telescope() { let night = 0; const N = [[-44, -22, 30], [-58, -16, 14], [-48, -20, 16, 40]];
    const view = () => night === 0 ? `<circle cx="150" cy="75" r="68" fill="#101425" stroke="#b8793f" stroke-width="6"/>${[[110, 50, 1.5], [185, 40, 1.2], [200, 100, 1.4], [120, 108, 1.1], [150, 78, 4.5]].map(([x, y, r], i) => `<circle ${i === 4 ? 'id="tsJ" style="cursor:pointer"' : ''} cx="${x}" cy="${y}" r="${r}" fill="${i === 4 ? '#ffe6b0' : '#fff'}"/>${i === 4 ? '<circle id="tsJ2" cx="150" cy="78" r="18" fill="transparent" style="cursor:pointer"/>' : ''}`).join('')}`
      : `<circle cx="150" cy="75" r="68" fill="#101425" stroke="#b8793f" stroke-width="6"/><circle cx="150" cy="75" r="16" fill="#e8c48f"/><path d="M135 70 H165 M134 78 H166" stroke="#b9895a" stroke-width="3"/>${N[night - 1].map(dx => `<circle cx="${150 + dx}" cy="75" r="2.6" fill="#fff"/>`).join('')}`;
    tryIt("LUMEN'S HOME", '🔭 The telescope', 'Tap the brightest light in the sky.', `<svg id="tsV" viewBox="0 0 300 150" ${SVGW}>${view()}</svg><div class="chips" style="justify-content:center"><button id="tsN" style="display:none">Look again the next night</button></div>`,
      'In January 1610, Galileo saw 3 small lights beside Jupiter. The next night they had moved. Soon he counted 4. They were moons going around Jupiter. It was the first proof that not everything circles the Earth.',
      t => { const go = () => { night++; t.el('tsV').innerHTML = view(); sfx('click'); t.el('tsN').style.display = night < 3 ? '' : 'none'; t.tip(night === 1 ? '<b>It is Jupiter.</b> There are 3 tiny lights in a line beside it.' : night === 2 ? '<b>They moved.</b> Stars do not do that.' : '<b>Now there are 4.</b> They are going around Jupiter.'); if (night === 3) t.reveal(); };
        ['tsJ', 'tsJ2'].forEach(id => { if (t.el(id)) t.el(id).onclick = go; }); t.el('tsN').onclick = go; }); },
  paint() { let g = 0, oil = false;
    tryIt("LUMEN'S HOME", '🎨 The blue paint', 'This blue stone will be paint. Grind it.',
      `<svg viewBox="0 0 300 130" ${SVGW}><path d="M14 62 q61 86 122 0Z" fill="#cfc7bb" stroke="#8d857a" stroke-width="3"/><ellipse cx="75" cy="62" rx="61" ry="9" fill="#e4ddd2" stroke="#8d857a" stroke-width="2"/><ellipse id="ptPow" cx="75" cy="64" rx="0" ry="0" fill="#3f66d0"/><path id="ptStone" d="M52 66 l9 -26 l20 -7 l18 14 l-5 19Z" fill="#2a4fb0" stroke="#1b3478" stroke-width="2"/><g id="ptPestle"><path d="M118 8 L90 52" stroke="#a79f93" stroke-width="11" stroke-linecap="round"/></g><g id="ptBrush" style="display:none"><path d="M96 58 L136 22" stroke="#b8793f" stroke-width="5" stroke-linecap="round"/><path d="M96 58 l-10 4 l4 -10Z" fill="#1f3fa8" stroke="#1f3fa8" stroke-width="4" stroke-linejoin="round"/></g><rect x="160" y="20" width="120" height="90" rx="6" fill="#fffdf6" stroke="#7a5236" stroke-width="4"/><rect id="ptSky" x="164" y="24" width="112" height="52" fill="#fffdf6" style="cursor:pointer"/><path d="M164 76 q28 -22 56 0 q28 -18 56 0 V106 H164Z" fill="#8fbf7a"/><circle cx="250" cy="42" r="7" fill="#ffe07a"/></svg>
       <div class="chips" style="justify-content:center"><button id="ptGo">Grind</button></div>`,
      'The best blue paint was made by grinding a blue stone called lapis lazuli. The stone came from mines in what is now Afghanistan. The paint was named ultramarine, which means beyond the sea. In the 1400s it could cost as much as gold.',
      t => { t.el('ptGo').onclick = () => { if (g < 6) { g++; tone(140 + g * 8, { dur:.08, vol:.05, type:'square' }); t.el('ptStone').setAttribute('transform', `translate(75 62) scale(${(1 - g / 6).toFixed(2)}) translate(-75 -62)`); t.el('ptPow').setAttribute('rx', 8 + g * 7); t.el('ptPow').setAttribute('ry', 1.5 + g); t.el('ptPestle').setAttribute('transform', `translate(${g % 2 ? -12 : 0} ${g % 2 ? 6 : 0})`); t.tip(g < 6 ? `Grind. ${g} of 6.` : '<b>A fine blue powder.</b> Now stir in oil.'); if (g === 6) t.el('ptGo').textContent = 'Stir in oil'; }
          else if (!oil) { oil = true; sfx('water'); t.el('ptPow').setAttribute('fill', '#1f3fa8'); t.el('ptPestle').style.display = 'none'; t.el('ptBrush').style.display = ''; t.el('ptGo').style.display = 'none'; t.tip('<b>Paint.</b> Tap the sky in the picture to paint it.'); } };
        t.el('ptSky').onclick = () => { if (!oil) return t.tip(g < 6 ? 'No paint yet. Grind the stone first.' : 'Stir in oil first.'); t.el('ptSky').setAttribute('fill', '#2a4fb0'); sfx('swish'); t.tip('<b>A deep blue sky.</b>'); t.reveal(); }; }); },
  starter() { let lvl = 30, fed = 0, peak = false;
    tryIt("MABEL'S BAKERY", '🫙 The starter jar', 'It is flat and hungry. Feed it.',
      `<svg viewBox="0 0 300 150" ${SVGW}><rect x="100" y="14" width="100" height="126" rx="10" fill="#eef7fb" stroke="#9fc7da" stroke-width="3"/><rect id="stD" x="103" y="107" width="94" height="30" rx="6" fill="#f1e6cf"/><g id="stBub"></g><path d="M97 107 H203" stroke="#e5484d" stroke-width="3"/><text x="212" y="111" font-size="11" font-weight="800" fill="#e5484d">start</text></svg>
       <div class="chips" style="justify-content:center"><button id="stGo">Feed it flour and water</button></div>`,
      "The bubbles are gas. Wild yeast in the jar makes it as it eats the flour. Mabel feeds her starter every day. A bakery in San Francisco says its starter has been kept alive since 1849.",
      t => { t.el('stGo').onclick = () => { fed = 1; peak = false; sfx('water'); t.tip('Fed. Watch the red line.'); };
        t.loop((dt, T) => { if (fed) { lvl = Math.min(64, lvl + dt * 7); if (lvl >= 60 && !peak) { peak = true; t.tip('<b>It doubled.</b> It is alive, and full of bubbles.'); t.reveal(); } if (lvl >= 64) fed = 0; } else if (peak && lvl > 34) { lvl -= dt * 1.5; if (lvl <= 34) t.tip('It sank back. It is hungry again.'); }
          t.el('stD').setAttribute('y', 137 - lvl); t.el('stD').setAttribute('height', lvl); t.el('stBub').innerHTML = lvl > 34 ? [...Array(9)].map((_, i) => { const y = 134 - ((T * 9 + i * 13) % Math.max(8, lvl - 6)); return `<circle cx="${112 + (i * 37 % 76)}" cy="${y.toFixed(1)}" r="${2 + i % 3}" fill="#fffdf6" stroke="#d8c9a6"/>`; }).join('') : ''; }); }); },
  dozen() { const P = [[0, 4], [1, 5], [2, 4]].flatMap(([r, c]) => [...Array(c)].map((_, i) => [150 + (i - (c - 1) / 2) * 50, 34 + r * 40])); let done = false;
    tryIt("MABEL'S BAKERY", "🥖 The baker's dozen", 'Someone orders a dozen rolls. Mabel bags 13. Why the extra one?',
      `<svg viewBox="0 0 300 150" ${SVGW}><rect x="12" y="6" width="276" height="138" rx="12" fill="#cfd6dd" stroke="#8d97a1" stroke-width="3"/>${P.map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="20" ry="15" fill="${i === 12 ? '#f1cf94' : '#e3b574'}" stroke="#b08040" stroke-width="2"/>`).join('')}</svg>
       <div class="chips" style="justify-content:center"><button data-a="luck">For luck</button><button data-a="law">To stay out of trouble</button><button data-a="tray">The tray holds 13</button></div>`,
      ["13 is called a baker's dozen.", 'In medieval England, bakers faced stiff penalties for selling bread that weighed too little.', 'The likely reason for the extra roll: being safe.'],
      t => t.on('[data-a]', b => { if (done) return; if (b.dataset.a !== 'law') { sfx('click'); return t.tip({ luck:'Not luck. Think about what could go wrong for a baker.', tray:'The tray is not the reason. Think about the law.' }[b.dataset.a]); } done = true; chime(784); t.tip('<b>Right.</b> 1 extra roll was cheap insurance.'); t.reveal(); })); },
  cards() { let st = 0; const row = (from, stepN, names) => `<div class="chips" style="justify-content:center">${[...Array(10)].map((_, i) => `<button data-n="${from + i * stepN}" class="ghost" style="min-width:54px">${String(from + i * stepN).padStart(3, '0')}</button>`).join('')}</div>`;
    const draw = t => { t.el('cdRow').innerHTML = st === 0 ? row(0, 100) : st === 1 ? row(500, 10) : st === 2 ? row(590, 1) : '<p style="text-align:center;font-size:30px;margin:6px 0">📘🐋</p>';
        document.querySelectorAll('#cdRow [data-n]').forEach(b => b.onclick = () => { const v = +b.dataset.n, ok = [500, 590, 599][st] === v; if (!ok) { sfx('click'); return t.tip(`Not in there. Look at the ${['first', 'second', 'last'][st]} digit of <b>599</b>.`); } st++; chime(660 + st * 110); t.tip(['', '<b>500: science.</b> Now pick the next drawer.', '<b>590: animals.</b> Now the last digit.', '<b>599: mammals.</b> There it is. The book about whales.'][st]); draw(t); if (st === 3) t.reveal(); }); };
    tryIt('THE LIBRARY', '🗂️ The card drawers', 'Find the book about whales. Its number is <b>599</b>. Pick a drawer.', '<div id="cdRow"></div>',
      'Every book has a number, so it has exactly 1 home on the shelf. Each digit narrows it down. Melvil Dewey published the idea in 1876. Libraries in at least 135 countries use it.', t => draw(t)); },
  sand() { let len = 0, lp = null; const ST = [[80, 60, 20], [200, 100, 26], [235, 45, 13]];
    tryIt("SAGE'S GARDEN", '🪨 The sand garden', 'Drag your finger across the sand to rake it.', `<canvas id="sdC" width="600" height="340" style="display:block;width:100%;max-width:340px;margin:0 auto;border-radius:12px;touch-action:none"></canvas><div class="chips" style="justify-content:center"><button id="sdClr" class="ghost">Smooth it over</button></div>`,
      'In Japan, gardens like this are raked by hand. The raked sand stands for water. The stones can stand for mountains or islands. Zen priests rake the sand to help them concentrate.',
      t => { const c = t.el('sdC'), x = c.getContext('2d'); const stones = () => ST.forEach(([sx, sy, r]) => { x.fillStyle = '#e9dfc6'; x.beginPath(); x.ellipse(sx * 2, sy * 2, r * 2 + 14, r * 1.5 + 12, 0, 0, 7); x.fill(); x.fillStyle = '#8d8f96'; x.beginPath(); x.ellipse(sx * 2, sy * 2, r * 2, r * 1.5, 0, 0, 7); x.fill(); x.fillStyle = '#a9abb2'; x.beginPath(); x.ellipse(sx * 2 - r * .5, sy * 2 - r * .5, r, r * .6, 0, 0, 7); x.fill(); });
        const clear = () => { x.fillStyle = '#e9dfc6'; x.fillRect(0, 0, 600, 340); stones(); len = 0; }; clear(); t.el('sdClr').onclick = clear;
        const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 600, (e.clientY - r.top) / r.height * 340]; };
        c.onpointerdown = e => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch {} lp = pt(e); }; c.onpointerup = c.onpointercancel = () => { lp = null; };
        c.onpointermove = e => { if (!lp) return; const p = pt(e), dx = p[0] - lp[0], dy = p[1] - lp[1], d = Math.hypot(dx, dy); if (d < 4) return; const nx = -dy / d, ny = dx / d; x.lineCap = 'round';
          for (let k = -2; k <= 2; k++) { x.strokeStyle = '#cbbd9c'; x.lineWidth = 5; x.beginPath(); x.moveTo(lp[0] + nx * k * 13, lp[1] + ny * k * 13); x.lineTo(p[0] + nx * k * 13, p[1] + ny * k * 13); x.stroke(); x.strokeStyle = '#f6eeda'; x.lineWidth = 2; x.beginPath(); x.moveTo(lp[0] + nx * k * 13 + 3, lp[1] + ny * k * 13 + 3); x.lineTo(p[0] + nx * k * 13 + 3, p[1] + ny * k * 13 + 3); x.stroke(); }
          stones(); len += d; lp = p; if (len > 1400) { t.tip('<b>Lines like ripples on water.</b> Keep going as long as you like.'); t.reveal(); } }; }); },
  orrery() { const PL = [['Mercury', 88, 26, '#b9b3a8', 4], ['Venus', 225, 44, '#e8c48f', 6], ['Earth', 365, 62, '#4f8fe0', 6], ['Mars', 687, 80, '#d2603a', 5]]; let yr = 0, crank = 0, told = false;
    tryIt('THE OBSERVATORY', '🪐 The planet model', 'Hold the button to turn the crank.',
      `<svg viewBox="0 0 300 180" ${SVGW}><rect width="300" height="180" rx="10" fill="#151a2e"/>${PL.map(p => `<circle cx="150" cy="90" r="${p[2]}" fill="none" stroke="#39406a" stroke-width="1.5"/>`).join('')}<circle cx="150" cy="90" r="11" fill="#ffd23f"/>${PL.map((p, i) => `<circle id="orP${i}" cx="${150 + p[2]}" cy="90" r="${p[4]}" fill="${p[3]}"/>`).join('')}</svg><p id="orTxt" class="sub" style="text-align:center;margin:6px 0 0">Earth: 0 trips around the sun.</p>
       <div class="chips" style="justify-content:center"><button id="orGo">Turn the crank</button></div>`,
      'Planets near the sun go around faster. Mercury makes about 4 trips for each 1 of Earth. A model like this is called an orrery. The name comes from the Earl of Orrery, who was given one around 1712.',
      t => { const b = t.el('orGo'); b.onpointerdown = e => { e.preventDefault(); crank = 9; }; ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { crank = Math.min(crank, .6); })); b.onclick = () => { crank = Math.max(crank, .6); };
        t.loop(dt => { if (crank > 0) { crank -= dt; yr += dt * .22; } PL.forEach((p, i) => { const a = yr * 365 / p[1] * Math.PI * 2; t.el('orP' + i).setAttribute('cx', (150 + Math.cos(a) * p[2]).toFixed(1)); t.el('orP' + i).setAttribute('cy', (90 - Math.sin(a) * p[2]).toFixed(1)); });
          t.el('orTxt').innerHTML = `Earth: <b>${yr.toFixed(1)}</b> trips around the sun. Mercury: <b>${(yr * 365 / 88).toFixed(1)}</b>. Mars: <b>${(yr * 365 / 687).toFixed(1)}</b>.`; if (yr >= 1 && !told) { told = true; t.tip('<b>1 trip for Earth is 1 year.</b> Mercury has already gone around 4 times.'); t.reveal(); } }); }); },
  meteorite() { let a = false, b = false, mx = 150, want = 150;
    tryIt('THE OBSERVATORY', '☄️ The meteorite', 'Is it really from space? Try the magnet on both rocks.',
      `<svg viewBox="0 0 300 130" ${SVGW}><path d="M35 100 l10 -30 l28 -12 l26 14 l6 28Z" fill="#9a9488" stroke="#6f695f" stroke-width="2"/><text x="72" y="120" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">garden rock</text><path d="M195 100 l6 -34 l30 -14 l30 16 l4 32Z" fill="#3a3530" stroke="#1f1b18" stroke-width="2"/><circle cx="215" cy="80" r="4" fill="#2a2622"/><circle cx="240" cy="72" r="5" fill="#2a2622"/><text x="230" y="120" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">meteorite</text><g id="mtMag"><rect x="-16" y="14" width="32" height="12" fill="#e5484d"/><rect x="-16" y="26" width="32" height="12" fill="#9aa3ad"/></g></svg>
       <div class="chips" style="justify-content:center"><button id="mtA">Try the garden rock</button><button id="mtB">Try the meteorite</button></div>`,
      'More than 95 of every 100 meteorites pull a magnet, because they hold iron. Most are about 4.5 billion years old. The oldest rock found on Earth is about 4 billion.',
      t => { let y = 0, wy = 0; t.el('mtA').onclick = () => { want = 70; wy = 8; a = true; sfx('click'); t.tip('<b>Nothing.</b> The magnet slides right off.'); if (b) t.reveal(); }; t.el('mtB').onclick = () => { want = 230; wy = 28; b = true; tone(700, { dur:.05, vol:.06 }); t.tip('<b>Clack.</b> The magnet sticks. There is iron inside.'); if (a) t.reveal(); };
        t.loop(dt => { mx += (want - mx) * Math.min(1, dt * 6); y += (wy - y) * Math.min(1, dt * 6); t.el('mtMag').setAttribute('transform', `translate(${mx.toFixed(1)} ${y.toFixed(1)})`); }); }); },
  herbs() { let wk = 0;
    tryIt("NANA GALE'S HOME", '🌿 The drying herbs', '2 bunches of fresh mint. 1 hangs in the air. 1 is shut in a jar.',
      `<svg viewBox="0 0 300 150" ${SVGW}><path d="M30 14 H140" stroke="#7a5236" stroke-width="4" stroke-linecap="round"/><path d="M85 14 V34" stroke="#c9a06a" stroke-width="2"/><g id="hbA">${[-18, -6, 6, 18].map(dx => `<path d="M85 34 q${dx} 30 ${dx * 1.4} 70" stroke="#5a8f4a" stroke-width="3" fill="none"/><ellipse class="hbL" cx="${85 + dx * 1.2}" cy="${86}" rx="9" ry="16" fill="#5fae6b"/>`).join('')}</g><rect x="180" y="30" width="80" height="104" rx="10" fill="#eef7fb" stroke="#9fc7da" stroke-width="3"/><rect x="186" y="20" width="68" height="12" rx="4" fill="#b8793f"/>${[-14, 0, 14].map(dx => `<path d="M220 126 q${dx} -30 ${dx * 1.3} -62" stroke="#5a8f4a" stroke-width="3" fill="none"/><ellipse class="hbJ" cx="${220 + dx * 1.2}" cy="76" rx="9" ry="16" fill="#5fae6b"/>`).join('')}<g id="hbMold" opacity="0">${[[206, 70], [222, 84], [236, 68], [214, 96], [230, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#cfd6dd" opacity=".9"/>`).join('')}</g><text x="85" y="146" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">in the air</text><text x="220" y="146" text-anchor="middle" font-size="11" font-weight="800" fill="#3b2f4a">in a jar</text></svg>
       <div class="chips" style="justify-content:center"><button id="hbGo">A week goes by</button></div>`,
      'Mold needs water to grow. Fresh herbs are mostly water. Hung in moving air, they dry before mold can start. Then they keep for months.',
      t => { t.el('hbGo').onclick = () => { if (wk >= 2) return; wk++; sfx('click'); document.querySelectorAll('.hbL').forEach(l => { l.setAttribute('rx', 9 - wk * 2.5); l.setAttribute('ry', 16 - wk * 3); l.setAttribute('fill', wk === 1 ? '#7f9a55' : '#8a8a52'); }); document.querySelectorAll('.hbJ').forEach(l => l.setAttribute('fill', wk === 1 ? '#5a8a52' : '#4f6f48')); t.el('hbMold').setAttribute('opacity', wk / 2);
          t.tip(wk === 1 ? 'Week 1. The hanging bunch is shrinking. Grey fuzz starts in the jar.' : '<b>Week 2.</b> The hanging bunch is dry and crisp. The jar is full of mold.'); if (wk === 2) { t.el('hbGo').style.display = 'none'; t.reveal(); } }; }); },
  kettle() { let st = 0, steep = 0, pour = 0;
    tryIt("NANA GALE'S HOME", '🫖 Mint tea', 'Make a pot of tea with Nana.',
      `<svg viewBox="0 0 300 150" ${SVGW}><g id="ktPot"><path d="M60 60 q0 -22 30 -22 q30 0 30 22 v30 q0 14 -30 14 q-30 0 -30 -14Z" fill="#cfd6dd" stroke="#8d97a1" stroke-width="3"/><path d="M120 66 q22 -4 26 -22" fill="none" stroke="#8d97a1" stroke-width="6" stroke-linecap="round"/><path d="M60 62 q-18 4 -14 24 q4 10 16 6" fill="none" stroke="#8d97a1" stroke-width="5"/><circle cx="90" cy="34" r="5" fill="#8d97a1"/></g><path id="ktStream" d="" fill="none" stroke="#c98a3a" stroke-width="3" stroke-linecap="round"/><path d="M200 96 l4 44 h28 l4 -44Z" fill="#eef7fb" stroke="#9fc7da" stroke-width="2.5"/><path id="ktTea" d="" fill="#c98a3a"/><ellipse id="ktFoam" cx="218" cy="0" rx="0" ry="0" fill="#fff6e6"/><text id="ktLeaf" x="90" y="130" text-anchor="middle" font-size="20"></text></svg>
       <div class="chips" style="justify-content:center"><button id="ktGo">Put mint in the pot</button></div>`,
      'In Morocco, serving mint tea to a guest is a sign of welcome. It is poured from high above the glass. That mixes in air and settles the leaves.',
      t => { t.el('ktGo').onclick = () => { if (st === 0) { st = 1; sfx('click'); t.el('ktLeaf').textContent = '🌿'; t.el('ktGo').textContent = 'Pour in hot water'; t.tip('Mint is in.'); } else if (st === 1) { st = 2; sfx('water'); t.el('ktLeaf').textContent = ''; t.el('ktGo').style.display = 'none'; t.tip('Let it sit...'); } else if (st === 3) { st = 4; sfx('water'); t.el('ktGo').style.display = 'none'; t.tip('Up high, and pour.'); } };
        t.loop(dt => { if (st === 2 && (steep += dt) > 2.5) { st = 3; t.el('ktGo').style.display = ''; t.el('ktGo').textContent = 'Pour a glass from up high'; t.tip('<b>Ready.</b> Nana lifts the pot high.'); }
          if (st === 4) { pour = Math.min(1, pour + dt * .5); const k = Math.min(1, pour * 3); t.el('ktPot').setAttribute('transform', `translate(${(60 * k).toFixed(1)} ${(-18 * k).toFixed(1)}) rotate(${(22 * k).toFixed(1)} 146 44)`);
            if (pour > .33 && pour < 1) t.el('ktStream').setAttribute('d', `M208 32 Q217 70 218 ${(138 - Math.max(0, (pour - .33) / .67) * 34).toFixed(1)}`); else t.el('ktStream').setAttribute('d', ''); const lv = Math.max(0, (pour - .33) / .67) * 34; t.el('ktTea').setAttribute('d', lv > 0 ? `M${(204 - lv / 11).toFixed(1)} ${(140 - lv).toFixed(1)} L204 140 H232 L${(232 + lv / 11).toFixed(1)} ${(140 - lv).toFixed(1)}Z` : ''); t.el('ktFoam').setAttribute('cy', 140 - lv); t.el('ktFoam').setAttribute('rx', lv > 2 ? 14 : 0); t.el('ktFoam').setAttribute('ry', lv > 2 ? 3 : 0);
            if (pour >= 1) { st = 5; t.tip('<b>A glass of mint tea, with foam on top.</b> Nana hands it to you.'); t.reveal(); } } }); }); },
  coin() { let flips = 0, right = 0, spin = 0, face = 'H', pick = null, seq = '';
    tryIt("PIP'S SHOP", '🪙 The first coin Pip ever earned', 'Flip it. Call it: heads or tails?',
      `<svg viewBox="0 0 300 110" ${SVGW}><g id="cnC"><circle cx="150" cy="55" r="40" fill="#ffc857" stroke="#c98f1e" stroke-width="5"/><text id="cnT" x="150" y="66" text-anchor="middle" font-size="30" font-weight="800" fill="#8a5a12">H</text></g></svg><p id="cnSeq" class="sub" style="text-align:center;min-height:20px;margin:4px 0 0;letter-spacing:3px"></p>
       <div class="chips" style="justify-content:center"><button data-c="H">Heads</button><button data-c="T">Tails</button></div>`,
      'A coin has no memory. Even after 5 heads in a row, the next flip is still 1 chance in 2. Lots of shopkeepers frame the first coin they earn.',
      t => { t.on('[data-c]', b => { if (spin > 0) return; pick = b.dataset.c; spin = .9; sfx('click'); t.tip('It spins...'); });
        t.loop(dt => { if (spin <= 0) return; spin -= dt; const k = Math.cos(spin * 28); t.el('cnC').setAttribute('transform', `translate(0 ${(-Math.sin(Math.max(0, spin) / .9 * Math.PI) * 26).toFixed(1)}) translate(150 55) scale(1 ${Math.abs(k).toFixed(2)}) translate(-150 -55)`); t.el('cnT').textContent = k > 0 ? 'H' : 'T';
          if (spin <= 0) { face = Math.random() < .5 ? 'H' : 'T'; t.el('cnT').textContent = face; t.el('cnC').setAttribute('transform', ''); flips++; seq += face; if (face === pick) right++; t.el('cnSeq').textContent = seq.split('').join(' '); chime(face === pick ? 880 : 440);
            t.tip(`<b>${face === 'H' ? 'Heads' : 'Tails'}.</b> ${face === pick ? 'You called it.' : 'Not this time.'} ${right} right out of ${flips}.`); if (flips >= 5) t.reveal(); } }); }); },
  sign() { let left = [0, 1];
    const SG = [{ art:'<rect x="135" y="14" width="30" height="96" rx="15" fill="#fff"/><path d="M135 30 l30 -14 M135 52 l30 -14 M135 74 l30 -14 M135 96 l30 -14" stroke="#e5484d" stroke-width="9"/><circle cx="150" cy="14" r="9" fill="#c9a24a"/>', ok:'barber', hit:'<b>The barber.</b> Barbers once let blood and pulled teeth, as well as cutting hair. The red stripe stands for blood.' },
      { art:'<path d="M110 16 H190" stroke="#7a5236" stroke-width="5"/><path d="M125 16 V40 M150 16 V62 M175 16 V40" stroke="#7a5236" stroke-width="3"/><circle cx="125" cy="52" r="14" fill="#ffc857" stroke="#c98f1e" stroke-width="3"/><circle cx="150" cy="74" r="14" fill="#ffc857" stroke="#c98f1e" stroke-width="3"/><circle cx="175" cy="52" r="14" fill="#ffc857" stroke="#c98f1e" stroke-width="3"/>', ok:'pawn', hit:'<b>The pawnshop.</b> Bring something valuable, borrow money against it, and buy it back later.' }];
    let cur = 0; const draw = t => { t.el('sgA').innerHTML = SG[cur].art; };
    tryIt("PIP'S SHOP", '🪧 Signs without words', 'Pip is studying old shop signs for his own. Which shop hung this one?',
      `<svg viewBox="0 0 300 120" ${SVGW}><rect width="300" height="120" rx="10" fill="#f3e3c4"/><g id="sgA"></g></svg><div class="chips" style="justify-content:center"><button data-p="barber">Barber</button><button data-p="pawn">Pawnshop</button><button data-p="baker">Baker</button></div>`,
      ['When most people could not read, shops and inns hung pictures instead of words.', 'The 3 gold balls still mark pawnshops today.', 'The striped pole still marks barbers.'],
      t => { draw(t); t.on('[data-p]', b => { if (cur > 1) return; if (b.dataset.p !== SG[cur].ok) { sfx('click'); return t.tip('Not that one. Look again.'); } chime(660 + cur * 120); t.tip(SG[cur].hit + (cur === 0 ? '<br>Next sign.' : '')); cur++; if (cur < 2) setTimeout(() => draw(t), 900); else t.reveal(); }); }); },
  shovels() { let depth = 0, digging = false, told = 0;
    tryIt("THE TWINS' BURROW", '⛏️ Under your feet', 'Hold Dig to dig straight down. Watch the layers.',
      `<svg viewBox="0 0 300 130" ${SVGW}><rect width="300" height="20" fill="#dff1fb"/><rect y="20" width="300" height="18" fill="#3e2a1c"/><rect y="38" width="300" height="52" fill="#a7784a"/><rect y="90" width="300" height="40" fill="#9aa3ad"/><rect y="20" width="300" height="4" fill="#6fae5a"/><path id="shHole" d="" fill="#1f1610"/><text id="shL" x="290" y="0" text-anchor="end" font-size="12" font-weight="800" fill="#fff6e6"></text></svg>
       <div class="chips" style="justify-content:center"><button id="shGo">Dig</button></div>`,
      ['That dark top layer is topsoil. Most of the life in soil lives there.', '2.5 cm of it can take hundreds of years to form, often around 500.'],
      t => { const b = t.el('shGo'); b.onpointerdown = e => { e.preventDefault(); digging = true; }; ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => { digging = false; }));
        t.loop(dt => { if (!digging || depth >= 100) return; depth = Math.min(100, depth + dt * 30); if (Math.random() < dt * 4) sfx('swish'); t.el('shHole').setAttribute('d', `M135 20 h30 v${depth.toFixed(0)} h-30Z`);
          const L = depth < 18 ? 0 : depth < 70 ? 1 : 2; if (L >= told) { const y = [31, 66, 112][L], w = ['<b>Topsoil.</b> Dark, full of roots and worms.', '<b>Subsoil.</b> Paler, and almost no roots.', '<b>Rock.</b> The shovel stops here.'][L]; t.el('shL').setAttribute('y', y); t.el('shL').textContent = ['Topsoil', 'Subsoil', 'Rock'][L]; t.tip(w); chime(520 + L * 120); told = L + 1; if (L === 2) { depth = 100; t.reveal(); } } }); }); },
  bunk() { const tried = {};
    tryIt("THE TWINS' BURROW", '🛏️ The bunk beds', 'Take a nap on the bottom bunk. How long should you sleep?',
      `<svg viewBox="0 0 300 150" ${SVGW}><path d="M70 12 V140 M230 12 V140" stroke="#b8793f" stroke-width="8" stroke-linecap="round"/><rect x="70" y="40" width="160" height="14" rx="4" fill="#7ec8e3"/><rect x="70" y="118" width="160" height="14" rx="4" fill="#ff8fa3"/><circle cx="150" cy="108" r="12" fill="#f1c9a5"/><path id="bkF" d="M143 108 q7 4 14 0" stroke="#3b2f4a" stroke-width="2" fill="none"/><text id="bkZ" x="176" y="96" font-size="16" font-weight="800" fill="#7a7290"></text></svg>
       <div class="chips" style="justify-content:center"><button data-m="20">20 minutes</button><button data-m="45">45 minutes</button><button data-m="90">90 minutes</button></div>`,
      ['A nap of 10 to 30 minutes stays in light sleep.', 'From about 30 to 60 minutes, you sink into deep sleep.', 'Waking from deep sleep makes you groggy. It is called sleep inertia.', 'A 90-minute nap finishes a whole sleep cycle, so it usually avoids it.'],
      t => t.on('[data-m]', b => { const m = +b.dataset.m, foggy = m === 45; tried[m] = 1; sfx('swish'); t.el('bkZ').textContent = 'z z z';
        setTimeout(() => { t.el('bkZ').textContent = foggy ? '???' : ''; t.el('bkF').setAttribute('d', foggy ? 'M143 112 q7 -4 14 0' : 'M143 106 q7 8 14 0'); chime(foggy ? 300 : 784);
          t.tip(foggy ? '<b>45 minutes.</b> You wake up foggy and cross. Try another.' : `<b>${m} minutes.</b> You wake up clear-headed.` + (tried[45] ? '' : ' Now try 45.')); if (tried[45] && (tried[20] || tried[90])) t.reveal(); }, 900); })); },
  moons() { let d = 0; const NM = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
    const lit = () => { const p = d / 29.5, R = 44, rx = Math.abs(Math.cos(p * 2 * Math.PI)) * R, wax = p < .5, gib = p > .25 && p < .75; if (d === 0) return ''; return `M150 16 A${R} ${R} 0 0 ${wax ? 1 : 0} 150 104 A${rx.toFixed(1)} ${R} 0 0 ${wax ? (gib ? 1 : 0) : (gib ? 0 : 1)} 150 16Z`; };
    tryIt("LUMEN'S HOME", '🌙 The moon paintings', 'Lumen paints the moon every night. Drag to turn the nights.',
      `<svg viewBox="0 0 300 120" ${SVGW}><rect width="300" height="120" rx="10" fill="#151a2e"/><circle cx="150" cy="60" r="44" fill="#2b3150"/><path id="mnL" d="" fill="#f4efd8"/></svg><p id="mnN" style="text-align:center;font-weight:800;margin:6px 0 2px">Night 1: New moon</p><input id="mnS" type="range" min="0" max="29" value="0" style="display:block;width:100%;max-width:300px;margin:0 auto">${S.aha.includes('moon') ? '<div class="chips" style="justify-content:center"><button id="mnA" class="ghost">Read the Memory card</button></div>' : ''}`,
      'The moon makes no light of its own. The sun always lights 1/2 of it. It takes about 29.5 days to go from 1 new moon to the next.',
      t => { let seenFull = false; const set = () => { d = +t.el('mnS').value; t.el('mnL').setAttribute('d', lit()); const i = d === 0 ? 0 : d < 7 ? 1 : d === 7 ? 2 : d < 15 ? 3 : d === 15 ? 4 : d < 22 ? 5 : d === 22 ? 6 : 7; t.el('mnN').textContent = `Night ${d + 1}: ${NM[i]}`; if (d >= 15) seenFull = true; if (seenFull && d >= 22) t.reveal(); };
        t.el('mnS').oninput = set; if (t.el('mnA')) t.el('mnA').onclick = () => showCard(ahaHtml('moon'), 'Close'); set(); }); },
  quiet() { const TXT = 'READINGWITHOUTSPACESISHARD', GAPS = [6, 13, 19, 21]; const cut = new Set(); let done = false;
    const draw = t => { t.el('qtW').innerHTML = TXT.split('').map((c, i) => `<span data-i="${i}" style="display:inline-block;padding:4px 1px;cursor:pointer;margin-right:${cut.has(i) ? 14 : 0}px">${c}</span>`).join(''); };
    tryIt('THE LIBRARY', '📜 A page with no spaces', 'Under the QUIET PLEASE sign hangs an old page. Tap the last letter of each word to split it.',
      `<p id="qtW" style="text-align:center;font:800 20px/1.6 Georgia,serif;letter-spacing:1px;margin:10px 0;word-break:break-all"></p>`,
      ['Old Latin and Greek books had no spaces between words.', 'Irish and Anglo-Saxon scribes added them in the 600s and 700s.', 'In the 380s, Augustine was surprised to see Ambrose read with his voice silent. He wrote about it in his Confessions.'],
      t => { draw(t); t.el('qtW').onclick = e => { if (done) return; const i = e.target.dataset && e.target.dataset.i; if (i == null || +i === TXT.length - 1) return; const n = +i; cut.has(n) ? cut.delete(n) : cut.add(n); tone(500 + cut.size * 60, { dur:.05, vol:.03 }); draw(t);
          if (cut.size === GAPS.length && GAPS.every(g => cut.has(g))) { done = true; chime(880); t.tip('<b>Reading without spaces is hard.</b> Now you know why they were added.'); t.reveal(); } else t.tip(`Words: <b>${cut.size + 1}</b>`); }; }); },
  koi() { const K = [{ n:'Patience', x:120, y:60, a:0, sp:52, c:'#f08c2e', ate:0 }, { n:'Patience Two', x:175, y:90, a:2, sp:60, c:'#fdf6ea', ate:0 }, { n:'Gary', x:160, y:50, a:4, sp:96, c:'#e5484d', ate:0 }]; let food = [], total = 0;
    tryIt("SAGE'S GARDEN", '🐟 The koi pond', 'Tap the water to drop in some food.',
      `<svg id="koS" viewBox="0 0 300 150" ${SVGW} style="touch-action:none"><ellipse cx="150" cy="75" rx="130" ry="66" fill="#bfe3f2" stroke="#8d8f96" stroke-width="6"/><g id="koF"></g><g id="koK"></g></svg>`,
      "Sage has named them Patience, Patience Two, and Gary. Koi learn who feeds them and gather when that person comes. They can be trained to eat from a hand.",
      t => { const sv = t.el('koS'); sv.onpointerdown = e => { e.preventDefault(); const r = sv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 300, y = (e.clientY - r.top) / r.height * 150; if (Math.pow((x - 150) / 118, 2) + Math.pow((y - 75) / 54, 2) > 1 || food.length > 3) return; food.push([x, y]); sfx('water'); };
        t.loop(dt => { K.forEach(k => { let tg = null, bd = 1e9; food.forEach(f => { const d = Math.hypot(f[0] - k.x, f[1] - k.y); if (d < bd) { bd = d; tg = f; } });
            if (tg) { k.a = Math.atan2(tg[1] - k.y, tg[0] - k.x); k.x += Math.cos(k.a) * k.sp * dt; k.y += Math.sin(k.a) * k.sp * dt; if (bd < 9 && food.includes(tg)) { food.splice(food.indexOf(tg), 1); k.ate++; total++; tone(660, { dur:.05, vol:.04 }); const top = [...K].sort((a, b) => b.ate - a.ate)[0]; t.tip(`<b>${k.n} got it.</b> ${K.map(q => `${q.n}: ${q.ate}`).join('. ')}.`); if (total >= 5) t.reveal(); } }
            else { k.a += dt * .7; k.x += Math.cos(k.a) * 16 * dt; k.y += Math.sin(k.a) * 16 * dt; if (Math.pow((k.x - 150) / 105, 2) + Math.pow((k.y - 75) / 46, 2) > 1) k.a = Math.atan2(75 - k.y, 150 - k.x); } });
          t.el('koF').innerHTML = food.map(f => `<circle cx="${f[0].toFixed(1)}" cy="${f[1].toFixed(1)}" r="3" fill="#8a5a2b"/>`).join('');
          t.el('koK').innerHTML = K.map(k => `<g transform="translate(${k.x.toFixed(1)} ${k.y.toFixed(1)}) rotate(${(k.a * 57.3).toFixed(0)})"><path d="M-12 0 l-9 -6 v12Z" fill="${k.c}" stroke="#b8793f" stroke-width="1"/><ellipse rx="13" ry="6" fill="${k.c}" stroke="#b8793f" stroke-width="1"/><circle cx="8" cy="-2" r="1.3" fill="#3b2f4a"/></g>`).join(''); }); }); },
  stars() { let done = false, city = false; const S2 = [...Array(90)].map(() => [14 + Math.random() * 272, 12 + Math.random() * 126, 1 + Math.random() * 1.8]);
    tryIt('THE OBSERVATORY', '📓 How many stars?', 'On a clear night far from any town, about how many stars can you see at once?',
      `<svg viewBox="0 0 300 150" ${SVGW}><rect id="nbSky" width="300" height="150" rx="10" fill="#101425"/>${S2.map(([x, y, r], i) => `<circle class="nbs" data-k="${i % 18 ? 1 : 0}" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#fff"/>`).join('')}</svg>
       <div id="nbB" class="chips" style="justify-content:center"><button data-n="250">250</button><button data-n="2500">2,500</button><button data-n="25000">25,000</button></div>`,
      ['From a truly dark place: about 2,500 stars at once.', 'From a big city center: as few as 50.', 'The rest are still there, washed out by the glow of streetlights.', 'Your grandmother\'s notebook: "Lost count at 412. A moth landed on my nose."'],
      t => t.on('[data-n]', b => { if (done) return; const n = +b.dataset.n; if (n !== 2500) { sfx('click'); return t.tip(n < 2500 ? 'More than that.' : 'Fewer than that.'); } done = true; chime(784); t.tip('<b>About 2,500.</b> Now see what a city does to them.');
        t.el('nbB').innerHTML = '<button id="nbC">Turn on the city lights</button>'; t.el('nbC').onclick = () => { city = !city; document.querySelectorAll('.nbs').forEach(c => c.style.opacity = city && c.dataset.k === '1' ? 0 : 1); t.el('nbSky').setAttribute('fill', city ? '#3a3350' : '#101425'); t.el('nbC').textContent = city ? 'Turn them off' : 'Turn on the city lights'; t.tip(city ? '<b>The city.</b> Only the brightest few are left.' : '<b>Dark again.</b> All of them back.'); t.reveal(); }; })); },
  rings() { const R = [9, 16, 26, 31, 42, 50, 54, 64, 70]; let done = false;
    tryIt("SAGE'S GARDEN", "🌳 Sage's tree", 'A branch came down in the wind. 1 ring grew in a drought year. Tap it.',
      `<svg viewBox="0 0 300 160" ${SVGW}><circle cx="150" cy="80" r="76" fill="#7a5236"/>${[...R].reverse().map((r, k) => `<circle data-g="${R.length - 1 - k}" cx="150" cy="80" r="${r}" fill="${(R.length - 1 - k) % 2 ? '#e9c99a' : '#dcb47e'}" stroke="#a9773f" stroke-width="1.5" style="cursor:pointer"/>`).join('')}</svg>`,
      ['A tree adds 1 ring each year.', 'A wide ring means a good, wet year. A thin ring means a hard, dry one.', 'Scientists match ring patterns in old beams to find the exact year the tree was cut.', 'It is called dendrochronology.'],
      t => t.on('[data-g]', c => { if (done) return; const g = +c.dataset.g; if (g !== 6) { sfx('click'); return t.tip(g === 0 ? 'That is the middle: the first year. Look for the thinnest band.' : 'That ring is wide: a good year. Look for the thinnest band.'); } done = true; c.setAttribute('fill', '#ffc857'); chime(660); t.tip(`<b>Ring 7.</b> The branch barely grew that year. It was ${R.length - 7} years before it fell.`); t.reveal(); })); },
  picture() { let len = 0, lp = null;
    tryIt("ON NANA'S WALL", '🖼️ The dusty picture', 'The glass is dusty. Rub it clean with your finger.',
      `<div style="position:relative;max-width:300px;margin:0 auto"><svg viewBox="0 0 300 200" style="display:block;width:100%;border-radius:10px"><rect width="300" height="200" fill="#fdf3dc"/><path d="M196 30 h46 M219 30 v18" stroke="#7a5236" stroke-width="4"/><path d="M203 48 h32 l6 46 h-44Z" fill="#d9a441"/><circle cx="219" cy="100" r="5" fill="#b8793f"/><circle cx="120" cy="70" r="16" fill="#e8e2d6"/><circle cx="120" cy="105" r="38" fill="#c98a5c"/><path d="M82 100 q38 -52 76 0 q-10 -30 -38 -30 q-28 0 -38 30Z" fill="#e8e2d6"/><circle cx="106" cy="104" r="4" fill="#3b2f4a"/><circle cx="134" cy="104" r="4" fill="#3b2f4a"/><path d="M104 120 q16 14 32 0" stroke="#3b2f4a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="98" cy="116" r="6" fill="#f2a08a" opacity=".6"/><circle cx="142" cy="116" r="6" fill="#f2a08a" opacity=".6"/><path d="M78 200 q42 -66 84 0Z" fill="#8fb8a0"/></svg><canvas id="pcC" width="300" height="200" style="position:absolute;inset:0;width:100%;height:100%;border-radius:10px;touch-action:none"></canvas></div>`,
      'A drawing of your grandmother, smiling, with the Wind Bell behind her. Nana keeps it where the morning light hits it.',
      t => { const c = t.el('pcC'), x = c.getContext('2d'); x.fillStyle = '#b9ad98'; x.fillRect(0, 0, 300, 200); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${150 + Math.random() * 50},${140 + Math.random() * 50},${120 + Math.random() * 40},.5)`; x.fillRect(Math.random() * 300, Math.random() * 200, 3, 3); }
        x.globalCompositeOperation = 'destination-out'; x.lineCap = 'round'; x.lineWidth = 38; const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 300, (e.clientY - r.top) / r.height * 200]; };
        c.onpointerdown = e => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch {} lp = pt(e); x.beginPath(); x.arc(lp[0], lp[1], 19, 0, 7); x.fill(); }; c.onpointerup = c.onpointercancel = () => { lp = null; };
        c.onpointermove = e => { if (!lp) return; const p = pt(e); x.beginPath(); x.moveTo(lp[0], lp[1]); x.lineTo(p[0], p[1]); x.stroke(); len += Math.hypot(p[0] - lp[0], p[1] - lp[1]); lp = p; if (len > 900) { t.tip('<b>There she is.</b>'); t.reveal(); } }; }); },
};
function toy(id) { try { TOYS[id](); did('toy'); } catch (e) { console.error(e); toast('That did not open. Try again.'); } }

let swing3 = null;
// the swing: you sit on the real one and ride it. Tap as you swing forward to go higher, then jump off and see how far you fly
function swingGame() { if (swing3 || cine) return; closeDialog(); hideCard(); target = null; pending = null;
  const g = toySwing.parent, piv = new THREE.Vector3(); toySwing.getWorldPosition(piv); const W = 2.2, R = 1.95, TOP = 1.2, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let a = .14, w = 0, last = performance.now(), raf, state = 'ride', kicks = 0, topped = false, lean = 0, push = 0, kicked = false, fly = null, endT = 0, side = 0;
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="swMsg">Tap when you swing forward.</p><div class="fhmeter"><b id="swBar" style="width:8%;background:#ffc857"></b></div><div class="fhbtns"><button id="swKick">Kick</button><button id="swOff" class="ghost">Jump off</button></div>`; document.body.appendChild(hud);
  const msg = t => { const m = $('swMsg'); if (m) m.innerHTML = t; };
  cine = { hold:true }; document.body.classList.add('in-cine'); sitting = toySwing; player.rotation.y = 0;
  const amp = () => Math.acos(Math.max(-1, 1 - (.5 * w * w + W * W * (1 - Math.cos(a))) / (W * W)));
  const place = () => { toySwing.rotation.x = -a; player.rotation.x = -a - lean; player.position.set(piv.x, piv.y - R * Math.cos(a), piv.z + R * Math.sin(a)); };
  const end = () => { cancelAnimationFrame(raf); hud.remove(); removeEventListener('keydown', key); swing3 = null; cine = null; sitting = null; document.body.classList.remove('in-cine'); toySwing.rotation.x = 0; player.rotation.x = 0;
    if (state !== 'landed') { let p = null; for (const dz of [1, 1.5, -1, -1.5, 2]) { const y = walkY(piv.x, piv.z + dz); if (y !== null) { p = [piv.x, y, piv.z + dz]; break; } } if (p) player.position.set(...p); else player.position.set(piv.x, g.position.y, piv.z + 1); }
    S.pos = [player.position.x, player.position.y, player.position.z]; snapCam(); save(); };
  const press = () => { if (state !== 'ride' || kicked) return; kicked = true; kicks++; lean = .35; // 1 kick for each swing: tapping fast does not help
    if (w > .02 || (Math.abs(w) <= .02 && a <= 0)) { const early = a < .25 * Math.max(.3, amp()); push = early ? .22 : .1; sfx('swish'); msg(early ? '<b>Higher!</b>' : '<b>A little higher.</b> Tap sooner, as you start forward.'); }
    else { w *= .55; sfx('click'); msg('<b>Too soon.</b> Wait until you swing forward.'); } };
  const jump = () => { if (state !== 'ride') return; if (amp() < .3) return end(); // barely moving: just hop down
    state = 'fly'; sitting = null; const v = w * R; fly = { vx:0, vy:Math.max(1.2, v * Math.sin(a) + 1.6), vz:Math.max(.8, v * Math.cos(a)), z0:player.position.z, t:0 }; sfx('cast'); msg('Wheee!'); $('swKick').style.display = 'none'; $('swOff').style.display = 'none'; };
  const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); } };
  addEventListener('keydown', key); $('swKick').addEventListener('pointerdown', e => { e.preventDefault(); press(); }); $('swOff').onclick = jump;
  const step = dt => {
    if (state === 'ride') { const was = a;
      if (push > 0 && w > 0) { const A0 = amp(), d = Math.min(push, dt * .5), dE = W * W * (Math.cos(A0) - Math.cos(Math.min(TOP, A0 + d))); w = Math.sqrt(w * w + 2 * dE); push -= d; } // a good kick adds height smoothly over the forward swing
      if (w < 0) push = 0;
      { const w0 = w; w += (-W * W * Math.sin(a) - .06 * w) * dt; if ((w0 > 0) !== (w > 0)) kicked = false; } a += w * dt; if (a > TOP) { a = TOP; w = Math.min(0, w); } if (a < -TOP) { a = -TOP; w = Math.max(0, w); }
      if (Math.abs(a) < .02 && Math.abs(w) < .12) w = .3; // never quite stops: there is always a small sway to tap along with
      lean = Math.max(0, lean - dt * .9); place();
      if (was < 0 && a >= 0 && Math.abs(w) > .6) sfx('swish');
      const A = amp(); $('swBar').style.width = Math.min(100, A / 1.1 * 100) + '%';
      if (!topped && A >= 1.1) { topped = true; did('swing', 3); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 120)); burst(player.position.clone().setY(player.position.y + 1), 0xffe07a, 24); msg(`<b>As high as the bar!</b> ${kicks} kicks. Tap Jump off to fly.`); $('swBar').style.background = '#8fdc8a'; }
      const back = 4.6 + A * 1.6; side += ((a > 0 ? .35 : -.35) * A - side) * Math.min(1, dt * 2); // the view sits beside the swing and leans with it a little
      camera.position.lerp(V(piv.x + back, piv.y + .2 + A * .8, piv.z + 2.6 + side), 1 - Math.pow(.01, dt)); camera.lookAt(piv.x, piv.y - 1.1 + A * .3, piv.z + side * .6); }
    else if (state === 'fly') { fly.t += dt; fly.vy -= 9 * dt; let nz = player.position.z + fly.vz * dt, ny = player.position.y + fly.vy * dt; const gy = groundAt(piv.x, g.position.y + 1, nz);
      if (gy === null || (nz - piv.z > 1 && solidPt(piv.x, nz))) { nz = player.position.z; fly.vz = 0; } // never past the edge or into a wall
      toySwing.rotation.x *= Math.pow(.2, dt); player.rotation.x += dt * (fly.vz > 2.5 ? -6.5 : 0) ; player.position.set(piv.x, ny, nz);
      const fy = groundAt(piv.x, g.position.y + 1, nz) ?? g.position.y;
      if (fly.vy < 0 && ny <= fy) { if (nz - piv.z < 1) { nz = piv.z + 1; player.position.z = nz; } player.position.y = groundAt(piv.x, g.position.y + 1, nz) ?? fy; player.rotation.x = 0; state = 'landed'; const d = Math.max(0, nz - piv.z); sfx('step'); burst(player.position.clone(), 0xffffff, 14);
        const best = d > (S.swingBest || 0); if (best) S.swingBest = +d.toFixed(1); msg(`<b>You flew ${d.toFixed(1)} steps.</b>${best ? ' A new best!' : ` Best: ${S.swingBest}.`}`); if (best && d > 1) [659, 880].forEach((f, i) => setTimeout(() => chime(f), i * 130)); endT = 1.6; }
      camera.position.lerp(V(piv.x + 6.5, piv.y + 1, piv.z + 3.5), 1 - Math.pow(.02, dt)); camera.lookAt(piv.x, player.position.y + .6, player.position.z); }
    else if ((endT -= dt) <= 0) { end(); return false; } };
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; if (step(dt) !== false) raf = requestAnimationFrame(loop); };
  place(); swing3 = { press, jump, end, step, get state() { return { a, w, amp:amp(), state, kicks, topped }; } }; loop(); }
// skipping stones: try an angle and a spin, and count the skips
let skip3 = null;
// skipping stones: you stand on the dock and throw. Tap once to set how the stone is tipped, once more for its spin, then watch it hop out over the clouds
function skipGame() { if (skip3 || cine) return; closeDialog(); hideCard(); target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), Wd = v => dock.localToWorld(v.clone()), stand = Wd(V(1.9, 0, 0)), dir = Wd(V(6, 0, 0)).sub(stand).setY(0).normalize(), sideV = V(dir.z, 0, -dir.x), ySea = stand.y - .22;
  player.position.set(stand.x, groundAt(stand.x, stand.y + .5, stand.z) ?? stand.y, stand.z); player.rotation.y = Math.atan2(dir.x, dir.z); cine = { hold:true }; document.body.classList.add('in-cine');
  const stone = mesh(sph(.2), mat(0x9aa0a8)); stone.scale.y = .28; scene.add(stone);
  const lane = new THREE.Group(); lane.position.copy(stand).addScaledVector(dir, 8.6).setY(ySea - .02); lane.rotation.y = Math.atan2(dir.x, dir.z); { const p = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 16), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.14, depthWrite:false })); p.rotation.x = -Math.PI / 2; lane.add(p); } scene.add(lane);
  const rings = [], ringGeo = new THREE.TorusGeometry(.3, .035, 6, 26);
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="skMsg"></p><div class="fhbar" id="skBar"><i id="skZ"></i><span id="skM" style="top:3px"></span></div><div class="fhbtns" style="margin-top:10px"><button id="skAct"></button><button id="skDone" class="ghost">Done</button></div>`; document.body.appendChild(hud);
  const msg = t => { const m = $('skMsg'); if (m) m.innerHTML = t; };
  let state, ph, deg = 20, spin = 1, n = 0, why = '', segs = [], k = 0, u = 0, dist = 0, flyT = 0, sinkT = 0, last = performance.now(), raf, look = stand.clone().addScaledVector(dir, 5).setY(ySea);
  const STONE = d => `<svg viewBox="0 0 30 24" width="30" height="24" style="display:block"><ellipse cx="15" cy="12" rx="12" ry="4" fill="#8a8f96" transform="rotate(${(-d).toFixed(0)} 15 12)"/></svg>`;
  const aim = () => { state = 'tilt'; ph = 0; $('skBar').style.display = ''; $('skZ').style.cssText = 'left:40%;width:20%'; $('skAct').textContent = 'Set the tilt'; msg(`Tap when the front of the stone tips up a little.${S.skipBest ? ` Best: ${S.skipBest}.` : ''}`); stone.visible = true; };
  const thrown = () => { // what the throw does, from how it was tipped and how fast it spins
    n = deg < 5 ? 0 : Math.round(20 * Math.exp(-Math.pow((deg - 20) / 8, 2)) * (.2 + .8 * spin)); if (deg >= 5) n = Math.max(1, n); if (spin < .35) n = Math.min(n, 3);
    why = deg < 5 ? 'Nose down. It dives straight in.' : deg < 13 ? 'Too flat. The front edge catches the water and digs in.' : deg > 30 ? 'Tipped up too far. It slaps the water and stops.' : spin < .35 ? 'Not enough spin. It wobbles, flips over, and sinks.' : n >= 14 ? 'Tipped up a little, with lots of spin. It stays flat and steady.' : 'Close. A little more spin, or a little nearer the middle.';
    segs = [{ len:2.2, h:.25, dur:.42, drop:.9 }]; for (let i = 0; i < n; i++) { const len = Math.max(.3, 1.55 * Math.pow(.88, i)); segs.push({ len, h:Math.max(.05, .45 * Math.pow(.85, i)), dur:.14 + len * .1, drop:0 }); }
    k = 0; u = 0; dist = .4; flyT = 0; state = 'fly'; sfx('cast'); swingT = .5; $('skBar').style.display = 'none'; $('skAct').style.display = 'none'; msg('<b>0</b>'); did('skip'); };
  const press = () => { if (state === 'tilt') { state = 'spin'; ph = 0; $('skZ').style.cssText = 'left:72%;width:28%'; $('skAct').textContent = 'Throw'; msg('Tap when the spin is fast.'); sfx('click'); }
    else if (state === 'spin') thrown(); else if (state === 'done') { $('skAct').style.display = ''; aim(); } };
  const end = () => { cancelAnimationFrame(raf); hud.remove(); removeEventListener('keydown', key); scene.remove(stone, lane); rings.forEach(r => scene.remove(r.m)); skip3 = null; cine = null; document.body.classList.remove('in-cine'); snapCam(); save(); };
  const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(); } };
  addEventListener('keydown', key); $('skAct').addEventListener('pointerdown', e => { e.preventDefault(); press(); }); $('skDone').onclick = end;
  const touch = (p, i) => { const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.8, depthWrite:false })); m.rotation.x = Math.PI / 2; m.position.copy(p).setY(ySea); scene.add(m); rings.push({ m, t:0 }); tone(520 * Math.pow(1.05, i), { dur:.09, vol:.05 }); msg(`<b style="font-size:22px">${i + 1}</b>`); };
  const step = dt => { ph += dt;
    if (state === 'tilt' || state === 'spin') { const p = .5 - .5 * Math.cos(ph * (state === 'tilt' ? 3.4 : 5.6)); if (state === 'tilt') deg = -10 + 60 * p; else spin = p;
      const mk = $('skM'); mk.style.left = (p * 100) + '%'; mk.innerHTML = state === 'tilt' ? STONE(deg) : `<b style="display:block;font-size:20px;line-height:24px;transform:rotate(${(ph * (200 + 900 * p)).toFixed(0)}deg)">↻</b>`; $('skZ').className = (state === 'tilt' ? Math.abs(deg - 20) <= 6 : p >= .72) ? 'in' : '';
      stone.position.copy(player.position).addScaledVector(dir, .3).addScaledVector(sideV, .5).setY(player.position.y + 1); stone.rotation.set(0, player.rotation.y + (state === 'spin' ? ph * (4 + 14 * p) : 0), 0); stone.rotateX(-deg * Math.PI / 180); }
    else if (state === 'fly') { const sg = segs[k]; u += dt / sg.dur; flyT += dt; const uu = Math.min(1, u), d = dist + sg.len * uu; stone.position.copy(stand).addScaledVector(dir, d).setY(ySea + .05 + sg.drop * (1 - uu) + sg.h * 4 * uu * (1 - uu));
      stone.rotation.set(0, flyT * (6 + 22 * spin), 0); stone.rotateX(-deg * Math.PI / 180 + (spin < .35 ? Math.sin(flyT * 16) * .7 : 0));
      if (u >= 1) { dist += sg.len; u = 0; if (k < n) touch(stone.position, k); k++; if (k >= segs.length || n === 0) { state = 'sink'; sinkT = 0; sfx('water'); burst(stone.position.clone().setY(ySea + .1), 0xdff3ff, 12); } } }
    else if (state === 'sink') { sinkT += dt; stone.position.y -= dt * 1.2; if (sinkT > .45) { stone.visible = false; state = 'done'; const best = n > (S.skipBest || 0); if (best) S.skipBest = n; save(); if (best && n > 2) [659, 880, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 120));
        msg(`<b>${n} ${n === 1 ? 'skip' : 'skips'}.</b> ${why}${best && n > 2 ? ' <b>A new best!</b>' : S.skipBest ? ` Best: ${S.skipBest}.` : ''}`); $('skAct').style.display = ''; $('skAct').textContent = 'Throw again'; } }
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; r.m.scale.setScalar(1 + r.t * 3.2); r.m.material.opacity = Math.max(0, .8 - r.t * .7); if (r.t > 1.15) { scene.remove(r.m); rings.splice(i, 1); } }
    const flying = state === 'fly' || state === 'sink', out = flying ? Math.min(dist, 14) : 0; // the view sits behind your shoulder, then follows the stone out
    camera.position.lerp(stand.clone().addScaledVector(dir, -3.8 + out * .45).addScaledVector(sideV, 2.1).setY(stand.y + 2.8 + out * .12), 1 - Math.pow(.02, dt)); look.lerp(flying ? stone.position : stand.clone().addScaledVector(dir, 4).setY(ySea), 1 - Math.pow(.01, dt)); camera.lookAt(look); };
  const loop = () => { const t = performance.now(), dt = Math.min(.05, (t - last) / 1000); last = t; step(dt); raf = requestAnimationFrame(loop); };
  aim(); skip3 = { press, end, step, get state() { return { state, deg, spin, n, k, dist }; } }; loop(); }
function drawHomes() { pipShop.visible = squareOpen(); drawToys(); }
// --- solid things: you walk around them, not through them ---
[[house, 2.3, [1.4, 1.63, .42]], [windmill, 1.3], [crate, .58], [sundial, .72], [workbench, .44], [kiln, .7], [furnace, .6], [nanaHome, 1.3, [1.1, .95, 0]], [pipShop, 1.35, [1.25, 1, 0]], [drizzleHome, 1.3, [1.05, .85, 0]], [museumHome, 1.6, [1.5, 1.1, .1]], [twinsHome, 1.45], [lumenHome, 1.35, [1.1, .9, 0]], [darkroom, 1.1], [lighthouse, .7], [ship, 1.4], [ship2, 1.4], [campfire, .36],
  ...trees.map(t => [t, .26]), ...rocks.map(r => [r, .36]), ...siteGroups.map(g => [g, 1.5])].forEach(([o, r, box]) => solid(o, r, box));
// shared things move here from the home island
stall.position.copy(SQL(4.4, 1.5)); faceCenter(stall, 4.4, 1.5);
townHall.position.copy(SQL(.5, -4.7)); faceCenter(townHall, .5, -4.7);
helperTree.position.copy(SQL(-3.3, -3.8));
worldGroup.position.copy(SQ);
function squareOpen() { return !!S.square || (S.tut === 9 && S.square === undefined); }
function drawSquare() { try { drawHomes(); } catch {}
  if (S.tut === 9 && S.square === undefined) { S.square = true; S.squareNew = true; save(); } // older games get it right away
  layBridge(squareBridge, new THREE.Vector3(4.55, -.07, -7.18), new THREE.Vector3(6.6, -.07, -10.4), 8, squareOpen()); squareBridge.visible = squareOpen();
  if (squareBits.sign) squareBits.sign.visible = !(S.world && S.world.placename);
  if (squareOpen() && !VISIT) { npcs.pip.position.copy(SQL(4.7, -1.2)); npcs.pip.rotation.y = -2.2; } } // Pip minds his cart on the square
// right after the first steps with Nana: the bridge appears
function openSquare() { if (S.square) return; S.square = true; S.squareNew = true; save(); drawSquare(); burst(new THREE.Vector3(5.6, .5, -8.8), 0xffc857, 30); setTimeout(squareIntro, 2500); }
function squareIntro() { if (!S.squareNew || VISIT) return;
  const busy = !S.setupDone || !quiet(); if (busy) return setTimeout(squareIntro, 3000);
  S.squareNew = false; save(); [523, 659, 784].forEach((f, i) => setTimeout(() => chime(f), i * 150));
  showCard(`<div class="kicker">NEW</div><h2>The Town Square is open</h2><p>The neighbors fixed the little bridge at the back of your island. Across it is the Town Square, with a fountain, benches, and Pip's cart.</p>`, 'Take me there', () => { target = new THREE.Vector3(5.3, 0, -8.3); pending = null; }); }
function wishFountain() {
  if (S.coins < 1) return toast('You need 1 coin to toss in the fountain.');
  if (S.wishDay === S.day) return toast('You already made a wish today. Come back tomorrow.');
  S.coins -= 1; S.wishDay = S.day; goal('wish'); save(); drawHud(); sfx('water'); burst(SQL(0, 0).setY(.6), 0x9fd3ff, 22); [880, 1175, 1568].forEach((f, i) => setTimeout(() => chime(f), i * 140));
  const facts = ['About 3,000 euros are tossed into Rome\'s Trevi Fountain every day. The city collects it and gives it to Caritas, a charity that feeds people in need.',
    'At the Trevi Fountain, the tradition is to toss a coin over your left shoulder with your right hand. The legend says it means you will return to Rome.',
    'People have tossed coins into springs and wells for thousands of years. Ancient Romans and Celts left offerings in water for luck and health.',
    'The Trevi Fountain took about 30 years to build and was finished in 1762.'];
  showCard(`<div class="kicker">THE FOUNTAIN</div><h2>You made a wish</h2><p>${facts[S.day % facts.length]}</p><p class="sub">In Sky Garden, a wish brings a small surprise tomorrow morning.</p>`, 'Okay'); }
function wishMorning() { if (S.wishDay !== S.day - 1 || S.wishPaid === S.wishDay) return; S.wishPaid = S.wishDay;
  if (Math.random() < .5) { S.coins += 25; return 'Your wish came true: 25 coins turned up by the fountain.'; }
  const ks = Object.keys(CROPS).filter(k => !CROPS[k].locked && CROPS[k].seasons.includes(season())), k = ks[Math.floor(Math.random() * ks.length)]; S.seeds[k] = (S.seeds[k] || 0) + 3;
  return `Your wish came true: 3 ${CROPS[k].name} seeds turned up by the fountain.`; }
// the planters: be the bee. Carry pollen from a flower to another of the same kind, and that flower makes seeds you can keep (1 planter, once a day)
function planterSeed(i) { S.planter = S.planter || {}; if (S.planter[i] === S.day) return toast('You already got seeds from this planter today. New flowers open by tomorrow.');
  let ks = Object.keys(CROPS).filter(k => !CROPS[k].locked && k !== 'skywheat' && CROPS[k].seasons.includes(season())); if (!ks.length) ks = ['sunbell'];
  const r = n => { let x = Math.sin((S.day + 1) * 97 + i * 31 + n * 13) * 1e4; return x - Math.floor(x); }, pick = []; for (let n = 0; pick.length < 3 && n < 12; n++) { const k = ks[Math.floor(r(n) * ks.length)]; if (!pick.includes(k) || ks.length < 3) pick.push(k); }
  const F = [...pick, ...pick].map((k, n) => ({ k, o:r(20 + n) })).sort((a, b) => a.o - b.o).map(f => f.k), X = F.map((_, n) => 32 + n * 47);
  const FL = { cloudberry:['#ffffff', 6, '#ffd23f'], sunbell:['#ffc21a', 9, '#6b4423'], moonpumpkin:['#ff9f1c', 8, '#ffd23f'], frostmint:['#c9a4e8', 6, '#efe3ff'], kale:['#fff27a', 7, '#e8c93a'], starbloom:['#f4f4ff', 10, '#dfe6ff'] }, hex = k => (FL[k] || ['#ff8fa3'])[0], pr = k => (FL[k] || [0, 8])[1], ctr = k => (FL[k] || [0, 0, '#ffd23f'])[2]; // each flower in its real color
  let carry = null, from = -1, done = false, bx = 150, by = 20, tx = 150, ty = 20, pod = 0, podAt = -1;
  tryIt('THE TOWN SQUARE', '🌸 The planter', 'Be the bee. Tap a flower to pick up its pollen.',
    `<svg viewBox="0 0 300 160" ${SVGW}><rect width="300" height="160" rx="10" fill="#dff1fb"/><rect x="8" y="118" width="284" height="38" rx="6" fill="#c98f58"/><rect x="8" y="118" width="284" height="8" fill="#8a6a48"/>${F.map((k, n) => `<g data-f="${n}" style="cursor:pointer"><path d="M${X[n]} 120 V82" stroke="#4fb46a" stroke-width="3"/><ellipse cx="${X[n] - 8}" cy="104" rx="7" ry="3.5" fill="#5fae6b"/><g class="plP" id="plP${n}">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(X[n] + Math.cos(a * Math.PI / 180) * 10).toFixed(1)}" cy="${(70 + Math.sin(a * Math.PI / 180) * 10).toFixed(1)}" r="${pr(k)}" fill="${hex(k)}" stroke="#d8cfc0" stroke-width="1"/>`).join('')}</g><circle id="plC${n}" cx="${X[n]}" cy="70" r="5.5" fill="${ctr(k)}"/><ellipse id="plPod${n}" cx="${X[n]}" cy="72" rx="0" ry="0" fill="#7fbf6a"/><circle cx="${X[n]}" cy="76" r="24" fill="transparent"/><text x="${X[n]}" y="146" text-anchor="middle" font-size="8.5" font-weight="800" fill="#fff6e6">${CROPS[k].name}</text></g>`).join('')}<g id="plBee"><ellipse cx="-4" cy="-6" rx="5" ry="3.5" fill="#fff" opacity=".85"/><ellipse cx="4" cy="-6" rx="5" ry="3.5" fill="#fff" opacity=".85"/><ellipse rx="8" ry="5.5" fill="#ffc857"/><path d="M-2 -5 v10 M3 -5 v10" stroke="#3b2f4a" stroke-width="2"/><g id="plDust"></g></g></svg>`,
    ['A flower makes seeds only after it gets pollen, usually from another flower of the same kind.', 'Bees carry it from flower to flower as they drink.', 'Of the 115 leading food crops in the world, 87 depend at least partly on animals like bees to carry their pollen.'],
    t => { t.on('[data-f]', g => { if (done) return; const n = +g.dataset.f, k = F[n]; tx = X[n]; ty = 56;
        if (carry === null || n === from) { carry = k; from = n; sfx('swish'); t.el('plDust').innerHTML = [[-5, 3], [0, 5], [5, 3]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${hex(k)}"/>`).join(''); t.tip(`The bee is dusted with <b>${CROPS[k].name}</b> pollen. Now tap another ${CROPS[k].name} flower.`); return; }
        if (k !== carry) { sfx('click'); t.tip(`That is a ${CROPS[k].name} flower. ${CROPS[carry].name} pollen does nothing here. Find the other ${CROPS[carry].name}.`); return; }
        done = true; podAt = n; chime(880); t.el('plDust').innerHTML = ''; t.tip(`<b>It worked.</b> The ${CROPS[k].name} flower drops its petals and starts to make seeds...`);
        S.planter[i] = S.day; S.seeds[k] = (S.seeds[k] || 0) + 1; save(); drawHud(); did('pollinate'); });
      t.loop(dt => { bx += (tx - bx) * Math.min(1, dt * 5); by += (ty - by) * Math.min(1, dt * 5); t.el('plBee').setAttribute('transform', `translate(${bx.toFixed(1)} ${(by + Math.sin(performance.now() / 110) * 2).toFixed(1)})`);
        if (podAt >= 0 && pod < 1) { pod = Math.min(1, pod + dt * .6); t.el('plP' + podAt).setAttribute('opacity', (1 - pod).toFixed(2)); t.el('plP' + podAt).setAttribute('transform', `translate(0 ${(pod * 40).toFixed(1)})`); t.el('plC' + podAt).setAttribute('fill', '#a8c76a'); t.el('plPod' + podAt).setAttribute('rx', (7 * pod).toFixed(1)); t.el('plPod' + podAt).setAttribute('ry', (10 * pod).toFixed(1));
          if (pod >= 1) { sfx('plant'); t.tip(`<b>Seeds!</b> 1 ${CROPS[F[podAt]].name} seed packet goes in your bag.`); t.reveal(); } } }); }); }
function pipCart() { showCard(`<div class="kicker">PIP'S CART</div><h2>What do you need?</h2><p>Pip restocks the cart every morning.</p><div class="jlist"><button id="pcS">🌱 Seeds</button><button id="pcF">🪑 Furniture</button></div>`, 'Not now');
  $('pcS').onclick = () => { hideCard(); seedShop(); }; $('pcF').onclick = () => { hideCard(); furnShop(); }; }
function sitBench(b) { const wp = new THREE.Vector3(); b.getWorldPosition(wp); if (b.parent === squareBits.g) goal('sit'); benchGame(b, wp, b.rotation.y); }
// sitting on a bench: time passes 3 times faster, and pigeons come. Toss crumbs in front of you. Toss them right on top of a bird and it flies off
let bench3 = null;
function benchGame(b, wp, ry) { if (bench3 || cine) return; closeDialog(); hideCard(); target = null; pending = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z), f = V(Math.sin(ry), 0, Math.cos(ry)), sd = V(f.z, 0, -f.x), gy = wp.y;
  const cs = [1, -1].map(k => [k, crowd(wp.clone().addScaledVector(f, -.9).addScaledVector(sd, 2.6 * k).setY(gy + 2.7), wp.clone().addScaledVector(f, 1.3).setY(gy + .2))]).sort((x, y) => x[1] - y[1])[0][0]; /* the more open side */
  sitting = b; player.position.copy(wp); player.rotation.y = ry; cine = { hold:true }; document.body.classList.add('in-cine');
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="bnMsg">Time passes 3 times faster while you sit.<br>Tap the ground in front of you to toss crumbs.</p><div class="fhbtns"><button id="bnUp" class="ghost">Get up</button></div>`; document.body.appendChild(hud);
  const msg = t => { const m = $('bnMsg'); if (m) m.innerHTML = t; };
  const crumbs = [], birds = [], tosses = []; let fed = 0, spawnT = 2.5, last = performance.now(), raf, told = false, scared = 0;
  const pigeon = () => { const g = new THREE.Group(), grey = mat(0x9aa3b5), dark = mat(0x5d6577); const body = mesh(sph(.13), grey, 0, .16, 0); body.scale.set(.85, .8, 1.3); g.add(body);
    const neck = mesh(sph(.075), mat(0x6f8f8a), 0, .27, .1); g.add(neck); const head = mesh(sph(.065), dark, 0, .35, .14); g.add(head); const bk = mesh(new THREE.ConeGeometry(.018, .06, 5), mat(0x3b2f4a), 0, .34, .21); bk.rotation.x = Math.PI / 2; g.add(bk);
    [-1, 1].forEach(x => { const w = mesh(sph(.09), dark, x * .09, .19, -.02); w.scale.set(.35, .6, 1.25); g.add(w); g.add(mesh(new THREE.CylinderGeometry(.008, .008, .08, 4), mat(0xe58a8a), x * .04, .04, .02)); });
    const tail = mesh(new THREE.BoxGeometry(.1, .02, .14), dark, 0, .15, -.19); tail.rotation.x = .3; g.add(tail); g.userData.head = head; scene.add(g); return g; };
  const spawn = () => { let land = null; for (let k = 0; k < 12 && !land; k++) { const p = wp.clone().addScaledVector(f, .9 + Math.random() * 2.2).addScaledVector(sd, (Math.random() - .5) * 3).setY(gy); if (groundAt(p.x, gy + .5, p.z) !== null && !solidPt(p.x, p.z)) land = p; } if (!land) return; const g = pigeon(), side = Math.random() < .5 ? -1 : 1;
    const from = land.clone().addScaledVector(sd, side * 5).setY(gy + 3.5); g.position.copy(from); birds.push({ g, st:'in', t:0, from, land, hop:0, peck:0 }); };
  const toss = p => { const from = player.position.clone().addScaledVector(f, .3).setY(gy + .9); tosses.push({ from, to:p, t:0 }); sfx('swish'); };
  const press = e => { ptr.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ptr, camera); const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(V(0, 1, 0), -gy), hit)) return;
    const rel = hit.clone().sub(wp), fwd = rel.dot(f); if (fwd < .6 || fwd > 4.5 || Math.abs(rel.dot(sd)) > 2.6 || groundAt(hit.x, gy + .5, hit.z) === null || solidPt(hit.x, hit.z)) return msg('Toss the crumbs on open ground in front of the bench.'); toss(hit); };
  const end = () => { cancelAnimationFrame(raf); hud.remove(); birds.forEach(b => scene.remove(b.g)); crumbs.forEach(c => scene.remove(c.m)); tosses.forEach(t => t.m && scene.remove(t.m)); bench3 = null; cine = null; sitting = null; document.body.classList.remove('in-cine'); snapCam(); save(); };
  $('bnUp').onclick = end;
  const step = dt => {
    for (let i = tosses.length - 1; i >= 0; i--) { const t = tosses[i]; if (!t.m) { t.m = new THREE.Group(); for (let k = 0; k < 5; k++) t.m.add(mesh(sph(.025), mat(0xe8cf9a), (k % 3 - 1) * .06, 0, (k % 2 - .5) * .08)); scene.add(t.m); }
      t.t += dt / .45; const k = Math.min(1, t.t); t.m.position.lerpVectors(t.from, t.to, k).setY(t.from.y + (t.to.y - t.from.y) * k + Math.sin(k * Math.PI) * .7);
      if (k >= 1) { tosses.splice(i, 1); crumbs.push({ m:t.m, p:t.to.clone() }); t.m.position.copy(t.to).setY(gy + .02);
        birds.forEach(b => { if (b.st !== 'flee' && b.st !== 'in' && b.g.position.distanceTo(t.to) < .45) { b.st = 'flee'; b.t = 0; b.from = b.g.position.clone(); scared++; if (!told) msg('<b>Whoosh.</b> Crumbs right on top of a bird scare it off. Toss them a little away.'); } }); } }
    if ((spawnT -= dt) <= 0) { spawnT = 2 + Math.random() * 2.5; if (birds.length < (crumbs.length ? 5 : 2)) spawn(); }
    for (let i = birds.length - 1; i >= 0; i--) { const b = birds[i], g = b.g; b.t += dt;
      if (b.st === 'in') { const k = Math.min(1, b.t / 1.3); g.position.lerpVectors(b.from, b.land, k).setY(b.from.y + (b.land.y - b.from.y) * (1 - Math.pow(1 - k, 2))); g.rotation.y = Math.atan2(b.land.x - b.from.x, b.land.z - b.from.z); if (k >= 1) { b.st = 'walk'; b.t = 0; } }
      else if (b.st === 'flee') { const k = b.t / 1.1; g.position.copy(b.from).addScaledVector(sd, (i % 2 ? 1 : -1) * k * 5).setY(b.from.y + k * k * 4); if (k >= 1) { scene.remove(g); birds.splice(i, 1); } }
      else { let c = null, bd = 1e9; crumbs.forEach(q => { const d = g.position.distanceTo(q.p); if (d < bd) { bd = d; c = q; } });
        if (b.st === 'peck') { g.userData.head.position.y = .35 - Math.abs(Math.sin(b.t * 14)) * .14; if (b.t > .7) { g.userData.head.position.y = .35; if (b.c && crumbs.includes(b.c)) { crumbs.splice(crumbs.indexOf(b.c), 1); scene.remove(b.c.m); fed++; tone(1200, { dur:.04, vol:.03 }); if (!told) msg(`Crumbs eaten: <b>${fed}</b>`); } b.st = 'walk'; b.t = 0; } }
        else if (c) { const dir = c.p.clone().sub(g.position).setY(0); if (dir.length() < .12) { b.st = 'peck'; b.t = 0; b.c = c; } else { g.rotation.y = Math.atan2(dir.x, dir.z); g.position.addScaledVector(dir.normalize(), dt * .9); g.position.y = gy + Math.abs(Math.sin(b.t * 9)) * .04; g.userData.head.position.z = .14 + Math.sin(b.t * 9) * .03; } }
        else { g.userData.head.position.z = .14 + Math.sin(b.t * 5) * .03; if (Math.random() < dt * .3) g.rotation.y += (Math.random() - .5) * 2; } } }
    if (!told && fed >= 6) { told = true; chime(988); msg('<b>The pigeons trust you now.</b><br>In a 2011 study in Paris, wild pigeons learned which person fed them and which one chased them.<br>They still knew them apart after the 2 people swapped coats.'); }
    camera.position.lerp(wp.clone().addScaledVector(f, -.9).addScaledVector(sd, 2.6 * cs).setY(gy + 2.7), 1 - Math.pow(.02, dt)); camera.lookAt(wp.clone().addScaledVector(f, 1.3).setY(gy + .2)); }; // beside and above you, so the ground in front of the bench shows
  const loop = () => { const n = performance.now(), dt = Math.min(.05, (n - last) / 1000); last = n; step(dt); raf = requestAnimationFrame(loop); };
  bench3 = { press, end, step, get state() { return { fed, birds:birds.length, crumbs:crumbs.length, scared, told }; } }; loop(); }
// each morning, two neighbors post something they'd love. Bring it for coins and a warmer friendship.
function ensureAsks() { if (S.asks && S.asks.day === S.day) return S.asks;
  const who = [...new Set(['nana', 'pip', ...(S.bridge ? ['drizzle'] : []), ...(S.bridge2 ? ['twins'] : []), ...Object.keys(S.talked || {})])].filter(id => NEIGHBORS[id] && npcs[id]), opts = []; // neighbors you can reach
  Object.keys(CROPS).filter(k => !CROPS[k].locked && CROPS[k].seasons.includes(season())).forEach(k => opts.push([k, 2 + Math.floor(Math.random() * 2), 'for a recipe']));
  if (S.bridge && season() !== 3) ['apple', 'peach'].forEach(k => ITEMS[k] && opts.push([k, 2, 'for a pie']));
  Object.keys(S.fishLog || {}).forEach(k => ITEMS[k] && opts.push([k, 1, 'for supper']));
  const list = []; while (list.length < 2 && who.length && opts.length) { const id = who.splice(Math.floor(Math.random() * who.length), 1)[0], [k, n, why] = opts.splice(Math.floor(Math.random() * opts.length), 1)[0];
    list.push({ id, k, n, why, pay:Math.round(ITEMS[k].sell * n * 1.25) + 10, done:false }); }
  S.asks = { day:S.day, list }; save(); return S.asks; }
function openNotice() { const fz = festival(), rows = [], asks = ensureAsks().list;
  asks.forEach((a, i) => { const nm = NEIGHBORS[a.id].name, it = ITEMS[a.k].name, h = have(a.k);
    rows.push(`<button ${!a.done && h >= a.n ? `data-ask="${i}"` : ''} class="${a.done ? 'mdone' : ''}">${a.done ? '✓ ' : '🧺 '}${nm} would love ${a.n} ${it} ${a.why}.<span class="sub"><br>${a.done ? `Delivered. +${a.pay} coins.` : `Pays ${a.pay} coins. ${h >= a.n ? `<b>✓ ${a.n}/${a.n}</b>` : `${h}/${a.n}`}`}</span></button>`); });
  rows.push(`<button id="nbG">✅ Today's goals</button>`);
  if (founderOn() && fGot('missions') && !paused('missions')) rows.push(`<button id="nbM">✦ Missions</button>`);
  if (featureOn('townhall')) rows.push(`<button id="nbT">🗳 Town Hall votes</button>`);
  showCard(`<div class="kicker">NOTICE BOARD</div><h2>What's happening</h2><p><b>${dateLabel ? dateLabel(today()) : ''}</b>${fz ? `<br>🎉 Today is <b>${fz.name}</b>. Talk to ${NEIGHBORS[fz.host].name}.` : ''}</p>${asks.length ? '<h4>Neighbors are asking. Tap one to bring it.</h4>' : ''}<div class="jlist">${rows.join('')}</div>`, 'Close');
  document.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { const a = asks[+b.dataset.ask]; if (a.done || have(a.k) < a.n) return;
    bagAdd(a.k, -a.n); a.done = true; S.coins += a.pay; S.hearts[a.id] = Math.min(10, (S.hearts[a.id] || 0) + 1); goal('ask'); save(); drawHud(); sfx('coin'); chime(698); openNotice(); });
  if ($('nbG')) $('nbG').onclick = () => { hideCard(); openGoals(); }; if ($('nbM')) $('nbM').onclick = () => { hideCard(); openMissions(); }; if ($('nbT')) $('nbT').onclick = () => { hideCard(); openTownHall(); }; }
function squareTick(dt, now) { if (!squareBits) return;
  squareBits.drops.forEach(d => { const k = (now * .6 + d.userData.ph) % 1, a = d.userData.ph * Math.PI * 2; d.position.set(Math.cos(a) * (.1 + k * .95), 1.55 + k * .5 - k * k * 1.4, Math.sin(a) * (.1 + k * .95)); });
  if (squareBits.water) squareBits.water.material.opacity = .72 + Math.sin(now * 2) * .06; }
lateClicks.push(squareBits.g); drawSquare(); if (S.squareNew) addEventListener('sg-playing', () => setTimeout(squareIntro, 4000));

// ============ LEGENDS ============
// Rare creatures. A few players are secretly given one by the Creator. Everything personal about it
// (its story, missions, and questions) comes from the server, only to that player. Anyone might see one fly by.
var mythShrooms = null, mythSky = null; // var: the game loop can start before this part loads
var mythExtras = [], mythActions = {}, mythHooks = {}, extraTools = []; // var: used by the game loop. Filled in by private modules the server sends to the right people
function mythKind() { const k = (devOn() && S.devMyth) || (S.trust && S.trust.myth) || null; return k && MYTHS[k] ? k : null; } // in dev mode, the legend being tried comes first
function mythOn() { return (featureOn('myths') || !!PREVIEW || (S.trust && S.trust.level >= 4)) && (founderOn() || devOn()) && !!mythKind() && !paused('myth') && !VISIT && (!TESTSLOT || !!PREVIEW || devOn()); }
function mythF() { const k = mythKind(); return { ...MYTHS[k], ...((devOn() && S.devMyth === k && S.devMythData) || (S.trust && S.trust.myth === k && S.trust.mythData) || DEV_CONTENT) }; }
function mp() { S.myth = S.myth || { light:0, list:[], day:0, done:0, journal:[], shrooms:[] }; return S.myth; }
// a legendary creature, built from simple shapes. Wings sit where arms would, so walking flaps them.
function mythModel(kind) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); const eyes = [], arms = [], F = MYTHS[kind], M = mat, shift = [];
  const eye = (x, y, z, r = .05) => { const e = new THREE.Group(); e.add(mesh(sph(r), M(0x2b2233, { roughness:.2 }))); e.add(mesh(sph(r * .38), glow(0xffffff), r*.3, r*.35, r*.75)); e.position.set(x, y, z); inner.add(e); eyes.push(e); };
  const wing = (sd, color, len, tips) => { const arm = new THREE.Group(); arm.position.set(sd*.34, 1.1, -.05); inner.add(arm); arms.push(arm);
    for (let i = 0; i < 4; i++) { const f = mesh(sph(.2), M(i === 3 && tips ? tips : color), sd*(.12 + i*.16*len), -.05 - i*.04, -i*.03); f.scale.set(.9, .22, .55 - i*.06); f.rotation.z = sd*.25; arm.add(f); } return arm; };
  if (kind === 'simurgh') {
    const body = mesh(sph(.42), M(F.colors[0]), 0, .95, 0); body.scale.set(1, 1.1, 1.2); inner.add(body); shift.push(body);
    inner.add(mesh(sph(.28), M(0xfff1d6), 0, .88, .22));
    const head = mesh(sph(.3), M(0xe0a066), 0, 1.55, .2); inner.add(head); const snout = mesh(sph(.14), M(0xf3d2a4), 0, 1.47, .44); snout.scale.set(1, .8, 1.1); inner.add(snout);
    inner.add(mesh(sph(.05), M(0x2b2233), 0, 1.52, .57)); eye(-.11, 1.62, .42); eye(.11, 1.62, .42);
    [-1,1].forEach(sd => { const ear = mesh(sph(.13), M(0x9b6b4a), sd*.27, 1.5, .12); ear.scale.set(.5, 1.3, .8); ear.rotation.z = sd*.3; inner.add(ear); });
    for (let i = 0; i < 3; i++) { const c = mesh(new THREE.ConeGeometry(.04, .2, 6), glow(F.colors[i + 1]), (i - 1)*.09, 1.9, .1); c.rotation.z = (1 - i)*.3; inner.add(c); shift.push(c); }
    const tail = new THREE.Group(); tail.position.set(0, 1.0, -.45); inner.add(tail);
    for (let i = 0; i < 9; i++) { const a = (i/8 - .5) * 2.2, f = new THREE.Group(); f.rotation.z = a; f.rotation.x = -.5; tail.add(f);
      const plume = mesh(sph(.16), M(F.colors[i % 5]), 0, .62, 0); plume.scale.set(.55, 1.5, .2); f.add(plume); shift.push(plume); f.add(mesh(sph(.06), glow(0x3f86c9), 0, .82, .03)); }
    wing(-1, F.colors[3], 1, F.colors[4]); wing(1, F.colors[3], 1, F.colors[4]);
  } else if (kind === 'ziz') {
    const body = mesh(sph(.45), M(0x3f86c9), 0, 1.0, 0); body.scale.set(1, 1.05, 1.25); inner.add(body); inner.add(mesh(sph(.3), M(0x8fdc8a), 0, .92, .24));
    inner.add(mesh(new THREE.CylinderGeometry(.11, .15, .45, 10), M(0x3f86c9), 0, 1.45, .12)); inner.add(mesh(sph(.24), M(0x7ec8e3), 0, 1.72, .18));
    const beak = mesh(new THREE.ConeGeometry(.07, .26, 8), M(0xffc857), 0, 1.68, .45); beak.rotation.x = Math.PI/2; inner.add(beak); eye(-.1, 1.78, .36); eye(.1, 1.78, .36);
    [-1,1].forEach(sd => { inner.add(mesh(new THREE.CylinderGeometry(.03, .03, .55, 6), M(0xffc857), sd*.15, .3, 0)); const ft = mesh(sph(.08), M(0xffc857), sd*.15, .04, .07); ft.scale.set(1, .4, 1.6); inner.add(ft); });
    [-1,1].forEach(sd => { const w = wing(sd, 0x2d3a6b, 1.25, 0x7ec8e3); for (let i = 0; i < 6; i++) w.add(mesh(sph(.025), glow(0xfff3a0), sd*(.15 + i*.1), -.02, .05)); });
    const tail = mesh(sph(.22), M(0x2d3a6b), 0, .95, -.5); tail.scale.set(1, .3, 1.2); inner.add(tail);
  } else {
    const body = mesh(sph(.38), M(0xfff6e6), 0, 1.0, 0); body.scale.set(.95, 1, 1.3); inner.add(body);
    inner.add(mesh(new THREE.TorusGeometry(.16, .04, 8, 18), M(0xffc857, { metalness:.5, roughness:.35 }), 0, 1.3, .1).rotateX(Math.PI/2));
    inner.add(mesh(new THREE.CylinderGeometry(.08, .1, .4, 10), M(0xfff6e6), 0, 1.45, .1)); inner.add(mesh(sph(.2), M(0x2b2233), 0, 1.72, .12));
    const bk = mesh(new THREE.TorusGeometry(.3, .03, 6, 16, Math.PI/2), M(0x2b2233), 0, 1.42, .45); bk.rotation.set(0, Math.PI/2, Math.PI); inner.add(bk);
    eye(-.1, 1.76, .28, .04); eye(.1, 1.76, .28, .04);
    [-1,1].forEach(sd => inner.add(mesh(new THREE.CylinderGeometry(.025, .025, .6, 6), M(0x2b2233), sd*.12, .32, 0)));
    wing(-1, 0xfff6e6, 1, 0x2b2233); wing(1, 0xfff6e6, 1, 0x2b2233);
    inner.add(mesh(new THREE.OctahedronGeometry(.07), glow(0xffc857), 0, 2.05, .1));
  }
  const aura = halo(F.colors[0], 2.6, .35); aura.position.y = 1; inner.add(aura);
  g.userData.inner = inner; inner.userData.eyes = eyes; inner.userData.arms = arms; inner.userData.blink = Math.random()*4; inner.userData.shift = shift; inner.userData.aura = aura; inner.userData.myth = kind;
  return g;
}
function mythAnimate(dt, now) {
  const u = player.userData.inner && player.userData.inner.userData;
  if (u && u.myth) { u.shift.forEach((m, i) => m.material.color.setHSL(((now * .05) + i * .09) % 1, .75, .62));
    const fl = flight && flight.alt > .1; u.arms.forEach((a, i) => a.rotation.z = Math.sin(now * (fl ? 10 : 3) + i * Math.PI) * (fl ? .75 : .12)); if (u.aura) u.aura.material.opacity = .25 + .1 * Math.sin(now * 2) + Math.min(.3, mp().light * .01); }
  if (mythSky && mythSky.visible) { const d = mythSky.userData; d.t += dt; const a = d.t * .35;
    mythSky.position.set(Math.cos(a) * 10, 7.5 + Math.sin(d.t * .8) * .6, Math.sin(a) * 10 - 3); mythSky.rotation.y = -a; const iu = mythSky.userData.inner.userData;
    iu.arms.forEach((w, i) => w.rotation.z = Math.sin(now * 5 + i * Math.PI) * .5); (iu.shift || []).forEach((m, i) => m.material.color.setHSL(((now * .05) + i * .09) % 1, .75, .62));
    if (d.t > 70) { mythSky.visible = false; toast('It flew away.'); } }
  if (mythShrooms) mythShrooms.children.forEach((m, i) => { const h = m.userData.halo; if (h) h.material.opacity = .45 + .25 * Math.sin(now * 2 + i); });
  if (mythHooks && mythHooks.frame) mythHooks.frame(dt, now);
}
// 5 missions a day; finish any 3
// an action a private module added, if it belongs to the legend in use right now
function mythAct(t) { const a = mythActions[t]; return a && (!a.kind || a.kind === mythKind()) ? a : null; }
function mythDaily() { const P = mp(), F = mythF();
  if (P.day !== S.day) { const pool = F.missions, used = new Set(), list = [];
    for (let i = 0; list.length < 5 && i < pool.length * 2; i++) { const m = pool[(S.day * 5 + i * 7 + (P.done || 0)) % pool.length]; if (!used.has(m.t)) { used.add(m.t); list.push({ t:m.t, n:m.n, have:0, text:m.text, self:!!m.self }); } }
    P.day = S.day; P.list = list; P.bonus = false; save(); }
  return P; }
function mythCount(t, n = 1) { if (!mythOn()) return; const P = mythDaily(); let changed = false;
  P.list.forEach(m => { if (m.t === t && m.have < m.n) { m.have = Math.min(m.n, m.have + n); changed = true; if (m.have >= m.n) mythDone(m.text); } });
  if (changed && !P.bonus && P.list.filter(m => m.have >= m.n).length >= 3) { P.bonus = true; P.light++; S.coins += 60; setTimeout(() => { toast(`3 legend tasks done today! Bonus: +60 coins and 1 more level.`); chime(1319); }, 1600); }
  save(); }
function mythDone(text) { const P = mp(); P.light++; P.done = (P.done || 0) + 1; S.coins += 40; drawHud();
  setTimeout(() => { toast(`Legend task done! +40 coins, and you went up a level.`); [784, 988, 1175].forEach((f, i) => setTimeout(() => chime(f), i * 110)); burst(player.position.clone().setY(1.2), MYTHS[mythKind()].colors[0], 18); }, 500);
  logKeeper('mythpath', text); }
function mythMenu() { if (!mythOn()) return; const F = mythF(), P = mythDaily(), T = S.trust || {}, form = !!S.mythForm, short = F.name.replace('The ', ''), a = /^[aeiou]/i.test(short) ? 'an' : 'a';
  const btn = m => m.t === 'reflect' ? 'Answer' : m.t === 'learn' ? 'Read' : mythAct(m.t) ? mythAct(m.t).label : m.self ? 'I did it' : '';
  const row = m => `<p>${m.have >= m.n ? '✅' : '◻️'} ${m.text} ${m.n > 1 ? `<b>${m.have} of ${m.n}</b>` : ''} ${m.have < m.n && btn(m) ? `<button class="ghost" data-mt="${m.t}" style="padding:2px 10px">${btn(m)}</button>` : ''}</p>`;
  const cm = T.missions || [];
  showCard(`<div class="kicker">✦ ${F.path.toUpperCase()} ✦</div><h2>${F.name}</h2>
    <p><b>${glowName(P.light || 0)}</b> <span class="sub">(you go up a level with every legend task)</span>${T.seen ? `<br>Players have tapped you ${T.seen} time${T.seen === 1 ? '' : 's'} as ${a} ${short}.` : ''}</p>
    <div class="chips"><button id="myForm">${form ? 'Back to your everyday self' : `Become ${F.name.replace('The ', 'the ')}`}</button>${P.power === S.day ? '' : `<button id="myPow">${F.power.name}</button>`}
    ${P.appear === S.day ? '' : '<button id="myApp">Fly over another island</button>'}<button id="myLeg" class="ghost">The legend</button>${P.journal && P.journal.length ? '<button id="myJr" class="ghost">Journal</button>' : ''}</div>
    ${P.power === S.day || P.appear === S.day ? `<p class="sub">${P.power === S.day ? `${F.power.name}: used today.` : ''} ${P.appear === S.day ? 'Fly over another island: done today.' : ''}</p>` : ''}
    <h4>Today's legend tasks: finish any 3 of these 5</h4>${P.list.map(row).join('')}
    ${form ? '<p class="sub"><b>To fly:</b> press and hold anywhere on the island. You follow your finger. Let go to land. On a keyboard, hold Space.</p>' : ''}
    ${cm.length ? `<h4>From the game's maker</h4>${cm.map(m => `<p>✧ <b>${esc(m.title)}</b>${m.how ? `<br><span class="sub">${esc(m.how)}</span>` : ''} <button class="ghost" data-cm="${m.id}" style="padding:2px 10px">I did it: get ${m.reward} coins</button></p>`).join('')}` : ''}
    ${mythExtras.map(x => x.html()).join('')}`, 'Close');
  $('myForm').onclick = () => { S.mythForm = !form; save(); dressPlayer(); hideCard(); burst(player.position.clone().setY(1), F.colors[0], 30); chime(form ? 660 : 988); toast(form ? 'You are back to your everyday self.' : `You became ${F.name.replace('The ', 'the ')}. Press and hold anywhere to fly. Let go to land.`); };
  if ($('myPow')) $('myPow').onclick = () => mythPower();
  if ($('myApp')) $('myApp').onclick = () => mythAppear();
  $('myLeg').onclick = () => showCard(`<div class="kicker">IN LEGEND</div><h2>${F.name}</h2>${F.legend.map(l => `<p>${l}</p>`).join('')}<h4>In Sky Garden: ${F.power.name}</h4><p>${F.power.text}</p><h4>In Sky Garden: fly over another island</h4><p>Once a day, you can fly over a random player's island as ${a} ${short}. If they tap it, they get a gift. They never find out it was you.</p>`, 'Back', mythMenu);
  if ($('myJr')) $('myJr').onclick = () => showCard(`<div class="kicker">JUST FOR YOU</div><h2>Your journal</h2>${P.journal.slice(-12).reverse().map(j => `<p><i>${esc(j.q)}</i><br>${esc(j.a)}</p>`).join('')}`, 'Back', mythMenu);
  document.querySelectorAll('[data-mt]').forEach(b => b.onclick = () => { const t = b.dataset.mt;
    if (t === 'reflect') return mythReflect(); if (t === 'learn') return mythLearn(); if (mythAct(t)) return mythAct(t).run();
    mythCount(t); mythMenu(); });
  document.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { const m = cm.find(x => x.id === +b.dataset.cm);
    showCard(`<div class="kicker">FROM THE GAME'S MAKER</div><h2>${esc(m.title)}</h2><p>How did it go? (optional, only the game's maker can read this)</p><textarea id="cmNote" maxlength="400" rows="3" style="width:100%;font:16px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:8px"></textarea><button id="cmGo">Done</button>`, 'Back', mythMenu);
    $('cmGo').onclick = async () => { const r = PREVIEW ? { ok:true } : await api('/mission-done', { key:S.syncKey, id:m.id, note:$('cmNote').value.trim() }); if (!r.ok && !devOn()) return toast('Could not connect. Check your internet and try again.');
      T.missions = cm.filter(x => x !== m); S.coins += m.reward; mp().light++; save(); drawHud(); chime(1175); toast(`+${m.reward} coins. The game's maker will see it.`); mythMenu(); }; });
  mythExtras.forEach(x => x.bind && x.bind());
}
function mythReflect() { const F = mythF(), q = F.reflect[S.day % F.reflect.length];
  showCard(`<div class="kicker">TODAY'S QUESTION</div><h2>${q}</h2><textarea id="rfA" maxlength="600" rows="4" style="width:100%;font:16px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:8px"></textarea>
    <p><label><input type="checkbox" id="rfShare"> Share this with the game's maker</label></p><p class="sub">Unless you tick the box, only you can read your answer. It's saved in your journal.</p><button id="rfGo">Save my answer</button>`, 'Back', mythMenu);
  $('rfGo').onclick = () => { const a = $('rfA').value.trim(); if (!a) return toast('Write a few words first.'); mp().journal = [...(mp().journal || []), { q, a, day:S.day }].slice(-60);
    if ($('rfShare').checked) logKeeper('reflection', `${q} | ${a}`); mythCount('reflect'); save(); mythMenu(); }; }
function mythLearn() { const F = mythF(), f = F.learn[(S.day + (mp().done || 0)) % F.learn.length];
  showCard(`<div class="kicker">TODAY'S STRANGE FACT</div><h2>Did you know?</h2><p>${f}</p>`, 'Cool', () => { mythCount('learn'); mythMenu(); }); }
// powers: once a day
function mythPower() { const k = mythKind(), F = mythF(), P = mp();
  if (mythAct('power')) return mythAct('power').run(); // a private module can supply the power
  P.power = S.day; hideCard();
  if (k === 'simurgh') { mythBloom(7, true); toast('7 glowing mushrooms popped up around your island. Tap them to collect.'); }
  if (k === 'ziz') { S.tiles.forEach((t, i) => { if (t.s >= 1) { t.w = true; drawTile(i); } }); raining = true; sfx('water'); burst(player.position.clone().setY(2), 0x9fd3ff, 40);
    if (ITEMS.candy) gain('candy', 1, player.position.clone().setY(1)); toast('It\'s raining! Every plant is watered, and you got a treat covered in sprinkles.'); }
  mythCount('power'); logKeeper('mythpower', F.power.name); save(); }
async function mythAppear(to) { const P = mp(), F = MYTHS[mythKind()]; hideCard();
  const r = devOn() || PREVIEW ? { ok:true } : await api('/appear', to ? { key:S.syncKey, to } : { key:S.syncKey }); if (!r.ok) { toast(r.error === 'already today' ? 'You already flew over an island today. Try again tomorrow.' : 'Could not connect. Check your internet and try again.'); return false; }
  burst(player.position.clone().setY(2), F.colors[0], 40); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 140));
  if (!to) { P.appear = S.day; mythCount('appear'); save(); toast(`Today you're flying over another player's island as ${/^[aeiou]/i.test(F.name.replace('The ', '')) ? 'an' : 'a'} ${F.name.replace('The ', '')}.`); }
  return true; }
// glowing mushrooms, each with a small gift and a silly surprise
function mythBloom(n, mine) { const P = mp(); if (mine) P.shrooms = [];
  for (let i = 0, tries = 0; i < n && tries < 80; tries++) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6, x = Math.cos(a) * r, z = Math.sin(a) * r; if (!onLand(x, z)) continue; P.shrooms.push([x, z]); i++; }
  P.shroomDay = S.day; save(); drawShrooms(); }
function drawShrooms() { if (!mythShrooms) { mythShrooms = new THREE.Group(); scene.add(mythShrooms); lateClicks.push(mythShrooms); }
  mythShrooms.children.slice().forEach(c => mythShrooms.remove(c)); const P = mp(); if (VISIT || P.shroomDay !== S.day) return;
  P.shrooms.forEach(([x, z], i) => { const g = new THREE.Group(), c = new THREE.Color().setHSL((i * .17) % 1, .8, .62).getHex();
    g.add(mesh(new THREE.CylinderGeometry(.05, .07, .3, 8), mat(0xfff6e6), 0, .15, 0)); const cap = mesh(new THREE.SphereGeometry(.2, 14, 8, 0, Math.PI*2, 0, Math.PI/2), glow(c), 0, .28, 0); cap.scale.y = .8; g.add(cap);
    const h = halo(c, 1.2, .6); h.position.y = .3; g.add(h); g.userData.halo = h; g.position.set(x, 0, z);
    const hb = deco(hitBox(.6, .7, .6), () => mythShroomTap(i)); hb.position.y = .3; g.add(hb); mythShrooms.add(g); }); }
function mythShroomTap(i) { const P = mp(), [x, z] = P.shrooms[i] || []; if (x == null) return; P.shrooms.splice(i, 1); save(); drawShrooms();
  const at = new THREE.Vector3(x, .6, z); burst(at, 0xc98bff, 16); chime(1047 + Math.random() * 300);
  if (Math.random() < .5) { const c = 10 + Math.floor(Math.random() * 16); S.coins += c; floatText(`+${c} coins`, at); } else { const ks = Object.keys(CROPS).filter(k => !CROPS[k].locked && CROPS[k].seasons.includes(season())), k = ks[Math.floor(Math.random() * ks.length)]; S.seeds[k] = (S.seeds[k] || 0) + 1; floatText(`+1 ${CROPS[k].name} seed`, at); }
  setTimeout(() => toast(SHROOM_FINDS[Math.floor(Math.random() * SHROOM_FINDS.length)]), 900); drawHud(); }
// sightings: any gardener might glimpse a legend. The sky never says whose.
function mythSighting(s) { if (!featureOn('myths') || VISIT || !s || !MYTHS[s.form]) return;
  if (!mythSky) { mythSky = new THREE.Group(); scene.add(mythSky); lateClicks.push(mythSky); }
  mythSky.children.slice().forEach(c => mythSky.remove(c)); const m = mythModel(s.form); m.scale.setScalar(1.3); mythSky.add(m); mythSky.userData.inner = m.userData.inner;
  const hb = deco(hitBox(3, 3, 3), () => mythBless(s)); hb.position.y = 1.4; mythSky.add(hb); mythSky.userData.t = 0; mythSky.visible = true;
  setTimeout(() => toast(s.toast || 'Something is flying over your island. Tap it!'), 1500); }
function mythBless(s) { const F = MYTHS[s.form]; mythSky.visible = false; S.blessed = [...(S.blessed || []), s.id].slice(-50);
  if (s.form === 'simurgh') mythBloom(3);
  if (s.form === 'ziz') { S.tiles.forEach((t, i) => { if (t.s >= 1) { t.w = true; drawTile(i); } }); if (ITEMS.candy) gain('candy', 1, player.position.clone().setY(1)); }
  if (s.form === 'ibis') S.coins += 50;
  save(); drawHud(); [659, 784, 988, 1319].forEach((f, i) => setTimeout(() => chime(f), i * 120));
  if (s.card) { showCard(s.card, s.cardBtn || 'Okay'); if (s.onBless) s.onBless(); }
  else showCard(`<div class="kicker">✦ A RARE SIGHTING ✦</div><h2>${F.appear.head}</h2><p>${F.appear.gift}</p><p class="sub">No one knows where they come from.</p>`, 'Awesome');
  if (s.id > 0 && !devOn()) api('/bless', { key:S.syncKey, id:s.id }); }
async function mythLookUp() { if (!featureOn('myths') || VISIT || SIDE || S.sightDay === S.day || !S.syncKey || devOn()) return;
  try { const r = await (await fetch(`${CLOUD}/sighting?key=${S.syncKey}`)).json(); S.sightDay = S.day; save(); if (r.sighting && Math.random() < .7) setTimeout(() => mythSighting(r.sighting), 20000 + Math.random() * 60000); } catch {} }
// the first time: the reveal
// a picture of the player's own legend (the same 3D creature that flies over islands), for the present they open
function mythPortrait(k) { try {
  const r = new THREE.WebGLRenderer({ alpha:true, antialias:true, preserveDrawingBuffer:true }); r.setSize(320, 320); r.setClearColor(0, 0);
  const sc = new THREE.Scene(), m = mythModel(k); sc.add(m); sc.add(new THREE.HemisphereLight(0xffffff, 0xb9a7d9, 1.6)); const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(2, 4, 5); sc.add(dl);
  const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
  const cam = new THREE.PerspectiveCamera(35, 1, .01, 100); cam.position.set(c.x + size * .35, c.y + size * .22, c.z + size * .95); cam.lookAt(c);
  r.render(sc, cam); const url = r.domElement.toDataURL('image/png'); r.dispose(); r.forceContextLoss();
  return `<img src="${url}" alt="" style="width:230px;height:230px;display:block;margin-top:-40px">`; } catch { return '🪽'; } }
function mythReveal() { if (!mythOn() || mp().revealed) return; const F = mythF(), short = F.name.replace('The ', ''), a = /^[aeiou]/i.test(short) ? 'an' : 'a';
  if (!PREVIEW && !devOn() && (S.tut !== 9 || S.where === 'hut')) return setTimeout(mythReveal, 5000); // after the first steps, out under the sky
  const busy = !S.setupDone || !quiet(); if (busy) return setTimeout(mythReveal, 3000);
  mp().revealed = S.day; save(); [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => chime(f), i * 220));
  const perks = () => showCard(`<div class="kicker">✦ YOUR LEGEND ✦</div><h2>What you can do now</h2>
    <div class="jlist">
      <button>🪽 <b>Become ${F.name.replace('The ', 'the ')}</b><span class="sub"><br>Then press and hold anywhere to fly.</span></button>
      <button>✨ <b>${F.power.name}</b>, once a day</button>
      <button>🌍 <b>Fly over someone's island</b>, once a day<span class="sub"><br>If they tap it, they get a gift.</span></button>
      <button>✦ <b>Legend tasks every day</b><span class="sub"><br>Finish any 3 of the 5. Each one pays 40 coins.</span></button>
    </div><p style="margin-top:10px">Tap the 🪽 button at the bottom of your screen to find all of this.</p>`, `Become ${F.name.replace('The ', 'the ')}`, () => { S.mythForm = true; save(); dressPlayer(); burst(player.position.clone().setY(1), F.colors[0], 40); drawHud(); });
  const secret = () => showCard(`<div class="kicker">✦ A SECRET ✦</div><h2>Where legends come from</h2>
    <p style="margin-top:12px;display:flex;gap:10px;align-items:flex-start"><span style="font-size:26px;line-height:1">🌍</span><span>People all over the world tell stories of giant birds in the sky: the Garuda, the Thunderbird, the Roc from Sinbad's voyages. And ${F.name.replace('The ', 'the ')}.</span></p>
    <p style="margin-top:12px;display:flex;gap:10px;align-items:flex-start"><span style="font-size:26px;line-height:1">🤔</span><span>Nobody knows how these stories started. Maybe someone saw something they couldn't explain.</span></p>
    <p style="margin-top:12px;display:flex;gap:10px;align-items:flex-start"><span style="font-size:26px;line-height:1">✨</span><span>In Sky Garden, the stories start with you. When players spot ${a} ${short} crossing their sky, that's you. You're the story they tell.</span></p>
    <p style="margin-top:12px;display:flex;gap:10px;align-items:flex-start"><span style="font-size:26px;line-height:1">🤫</span><span><b>No one is ever told. Only you, and the game's maker, know.</b></span></p>`, 'What can I do?', perks);
  const story = () => showCard(`<div class="kicker">✦ THE OTHER YOU ✦</div><h2>${F.name}</h2><p class="sub">From ${F.from || 'an old legend'}</p>${(F.fun || F.legend.map(l => ['✦', l])).map(([e, l]) => `<p style="margin-top:12px;display:flex;gap:10px;align-items:flex-start"><span style="font-size:26px;line-height:1">${e}</span><span>${l}</span></p>`).join('')}`, 'Keep reading', secret);
  const hex = c => '#' + c.toString(16).padStart(6, '0'); // it arrives as a present you open, wrapped in the legend's own colors
  openPresents([{ icon:mythPortrait(mythKind()), title:`You are ${F.name.replace('The ', 'the ')}`, text:`A creature of ${F.from || 'an old legend'}. It has always been a part of you. Now you can let it out.`, wrap:[hex(F.colors[0]), hex(F.colors[1])], last:'Read the legend' }], story);
  logKeeper('mythfirst', F.name); }
// developer mode: try any legend with its real content, then put your own back exactly as it was
async function devTryLegend(k) { if (!devOn()) return;
  if (k && !S.devMyth) S.mythStash = { myth:S.myth || null, form:!!S.mythForm };
  S.devMyth = k || null; S.devMythData = null; S.mythForm = false;
  if (k) { S.myth = null; const r = await api(`/creator/legend?key=${mainKey()}&form=${k}`); if (r.ok && r.legend) S.devMythData = r.legend; else toast('Showing sample text. The real story only loads for the Creator.'); }
  else if (S.mythStash) { S.myth = S.mythStash.myth; S.mythForm = S.mythStash.form; S.mythStash = null; }
  save(); dressPlayer(); drawHud(); drawShrooms(); if (k) mythReveal(); }
// private modules: extra parts of the game the server only sends to the people they are for
const loadedMods = new Set();
const MODCTX = { get S() { return S; }, key:mainKey, THREE, api, showCard, hideCard, toast, chime, burst, player, esc, save, drawHud, dressPlayer, $, hour, devOn:() => devOn() || !!PREVIEW, CLOUD, switchIsland,
  PREVIEW, MYTHS, extraTools, mythMenu, mythSighting, mythCount, mythKind, mythF, mythOn, mythAppear, mythBless, mp, mythExtras, mythActions, mythHooks, logKeeper };
function loadMods(list) { (list || []).forEach(n => { if (loadedMods.has(n) || !/^[a-z]+$/.test(n)) return; loadedMods.add(n);
  const who = PREVIEW ? `key=${PREVIEW.key}&as=${PREVIEW.code}` : `key=${mainKey()}`;
  // fetched fresh every time (never a cached copy), then run from a local blob so browsers treat it like our own code
  fetch(`${CLOUD}/mod?name=${n}&${who}&t=${Date.now()}`, { cache:'no-store' }).then(r => { if (!r.ok) throw 0; return r.text(); })
    .then(src => import(URL.createObjectURL(new Blob([src], { type:'text/javascript' })))).then(m => m.default(MODCTX)).catch(() => loadedMods.delete(n)); }); }
// preview: show exactly what one founder sees. Runs on the test island, where nothing reaches the server.
function previewStart() { if (!PREVIEW) return; const d = PREVIEW.data || {};
  if (S.previewOf !== PREVIEW.code) { S.myth = null; S.mythForm = false; S.loveNotes = []; S.loveRead = []; S.previewOf = PREVIEW.code; }
  S.founder = S.founder || { code:PREVIEW.code, at:Date.now() }; S.trust = { level:d.level || 1, paused:[], revoked:false, myth:d.myth || null, mythData:d.mythData || null, link:d.link || null, seen:0, missions:d.missions || [] };
  save(); dressPlayer(); drawHud(); loadMods(d.mods || []);
  const bar = document.createElement('div'); bar.className = 'previewbar';
  bar.innerHTML = `<b>👁 Previewing as ${esc(PREVIEW.label)}</b> <button id="pvFly" class="ghost">Show me a fly-over</button> <button id="pvStop">Stop preview</button>`; document.body.appendChild(bar);
  $('pvStop').onclick = () => { try { localStorage.removeItem('sg.preview'); localStorage.setItem('sg.profile', 'main'); } catch {} location.reload(); };
  $('pvFly').onclick = () => { const others = Object.keys(MYTHS).filter(k => k !== d.myth); mythSighting({ id:0, form:others[Math.floor(Math.random() * others.length)] }); };
  if (!d.myth) toast(`${PREVIEW.label} has no legend yet. Pick one for them on the dashboard.`); else setTimeout(mythReveal, 1500); }
addEventListener('sg-playing', () => setTimeout(() => { if (PREVIEW) return previewStart(); mythLookUp(); drawShrooms(); mythReveal(); setInterval(() => { if (playing) mythReveal(); }, 20000); }, PREVIEW ? 1500 : 5000));
// test helpers: what a tap at a screen point would hit, and every tappable thing in the world
function pickAt(sx, sy) { return tapTarget(sx, sy); }
// hints: things you walk past 3 times without ever tapping sparkle once, with a nudge
var HINT_SKIP = new Set(['pickup', 'dig', 'tile', 'pet', 'door', 'roomdoor', 'bed']);
var hintKey = o => { const p = new THREE.Vector3(); o.getWorldPosition(p); return `${o.userData.kind}:${o.userData.key || o.userData.id || Math.round(p.x) + ',' + Math.round(p.z)}`; };
function noteTapped(o) { try { const k = hintKey(o); if (!(S.tapped || []).includes(k)) { S.tapped = [...(S.tapped || []), k].slice(-500); } } catch {} }
var hintT = 0, hintNear = new Set(), hintLast = -1e9; // var: the game loop can start before this part loads
function hintTick(dt, now) { if (!HINT_SKIP || (hintT += dt) < 1) return; hintT = 0;
  if (playing && !cine && !fish3 && !buildMode && !VISIT && !$('veil').classList.contains('show') && !$('dialog').classList.contains('show') && !document.querySelector('.presents')) { try { knowTick(); collTick(); } catch {} }
  if (!playing || S.tut !== 9 || document.querySelector('.presents') || cine || fish3 || flight.on || buildMode || VISIT || $('veil').classList.contains('show') || $('dialog').classList.contains('show')) return;
  const p = new THREE.Vector3(), near = new Set(), tg = typeof questTarget === 'function' ? questTarget() : null; S.hintPass = S.hintPass || {};
  tappables().forEach(o => { if (HINT_SKIP.has(o.userData.kind) || o === tg) return; o.getWorldPosition(p); if (Math.abs(p.y - player.position.y) > 1.5 || Math.hypot(p.x - player.position.x, p.z - player.position.z) > 2.6) return;
    const k = hintKey(o); if ((S.tapped || []).includes(k) || (S.hinted || []).includes(k)) return; near.add(k);
    if (!hintNear.has(k)) S.hintPass[k] = (S.hintPass[k] || 0) + 1;
    if (S.hintPass[k] >= 3 && now - hintLast > 90) { hintLast = now; S.hinted = [...(S.hinted || []), k].slice(-500); save();
      const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()); c.y = b.max.y + .3; burst(c, 0xffe07a, 18); chime(1175);
      toast(o.userData.kind === 'npc' ? 'Someone here might have something to say. Tap them to chat.' : 'You have not tried this yet. Tap it!'); } });
  hintNear = near; }
// name tags: walk near something and a small label says what it is and what tapping does
var nearEl = null, nearObj = null, nearT = 0;
function nearLabel(o) { const k = o.userData.kind, u = o.userData;
  if (u.label) return u.label;
  if (k === 'piece') return u.b && u.b.p === 'hammock' ? 'Hammock: tap to nap' : u.b && u.b.p === 'bench' ? 'Bench: tap to sit' : null;
  if (k === 'npc') return NEIGHBORS[u.id] ? `${NEIGHBORS[u.id].name}: tap to talk` : null;
  if (k === 'home') return ROOMS[u.room] ? `${ROOMS[u.room].name}: tap to go in` : null;
  if ((k === 'tree' || k === 'rock' || k === 'bush') && usedToday(o)) return `${k[0].toUpperCase() + k.slice(1)}: back tomorrow`;
  if (k === 'tree') return S.tools.axe ? 'Tree: tap to chop' : 'Tree: make an axe at the workbench first';
  if (k === 'rock') return S.tools.pick ? 'Rock: tap to break' : 'Rock: make a pickaxe at the workbench first';
  if (k === 'house') return `Your ${homeName()}: tap to go in`;
  if (k === 'ship') return "Captain Drizzle's ship: tap to look";
  if (k === 'mailbox') return VISIT ? 'Mailbox: tap to go home' : 'Mailbox: tap to visit friends';
  if (k === 'sign') return S.bridge ? null : 'Broken bridge: tap to fix';
  if (k === 'sign2') return S.bridge2 ? null : 'Broken bridge: tap to fix';
  if (k === 'bplan') return (S.built || []).includes(BUILDINGS[u.i].id) ? `${BUILDINGS[u.i].name} plans: tap to upgrade` : S.q5 < 6 ? 'Building site: ring the great bell first' : 'Building site: tap to build';
  if (k === 'site') return (S.built || []).includes(BUILDINGS[u.i].id) ? `${BUILDINGS[u.i].name}: tap to go in` : S.q5 < 6 ? 'Building site: ring the great bell first' : BUILDINGS[u.i].soon ? `${BUILDINGS[u.i].name}: coming soon` : 'Building site: tap to build';
  if (k === 'greatbell') return S.q5 >= 5 ? 'The Great Bell: tap to ring' : 'The Great Bell: tap';
  if (k === 'boulder') return S.boulder ? 'Old stone: tap to read it' : 'Boulder: tap to move it';
  return ({ buildsite:'Your hut: tap to build', crate:`${shopName()}: tap to sell`, sundial:'Sundial: tap at noon', campfire:'Campfire: tap to sleep', workbench:'Tree stump workbench: tap to make things',
    bush:'Bush: tap to cut grass', dig:'Gold sparkle: tap to dig', fruitTree:'Fruit tree: tap to pick', dock:'Dock: tap to fish',
    door:'Doormat: tap to go outside', roomdoor:'Doormat: tap to go outside', bed:'Your bed: tap to sleep', shelf:'Shelf: tap to see Collections', kiln:'Kiln: tap to fire clay', furnace:'Furnace: tap to melt metal',
    ship2:'The ship: tap to fly home', pot:'Metal pot: tap to fill', windmill:'Windmill: tap to look', easel:"Lumen's easel: tap to sort the moons", darkroom:"Lumen's dark room: tap to look inside",
    visitor:'A traveler: tap to talk', stakes:'Fence stakes: tap to grow your garden' })[k] || (k === 'claypit' ? 'Clay: tap to scoop' : k === 'sandpit' ? 'Sand: tap to scoop' : k === 'ore' ? 'Ore: tap to dig' : null); }
function nearTick(dt) { if (!nearEl) { nearEl = document.createElement('div'); nearEl.className = 'neartag'; document.body.appendChild(nearEl); }
  const off = !playing || cine || fish3 || buildMode || (flight && flight.on) || $('veil').classList.contains('show') || $('dialog').classList.contains('show') || document.querySelector('.presents');
  if (off) { nearEl.style.opacity = 0; nearObj = null; return; }
  if ((nearT += dt) > .25) { nearT = 0; let best = null, bd = 2.4; const p = new THREE.Vector3(), tg = typeof questTarget === 'function' ? questTarget() : null;
    tappables().forEach(o => { if (['pickup', 'tile', 'pet', 'spot'].includes(o.userData.kind)) return; o.getWorldPosition(p); if (Math.abs(p.y - player.position.y) > 2.5) return;
      const d = Math.hypot(p.x - player.position.x, p.z - player.position.z); if (d < bd && nearLabel(o)) { bd = d; best = o; } });
    nearObj = best; if (best) nearEl.textContent = nearLabel(best); }
  if (!nearObj || cine) { nearEl.style.opacity = 0; return; } // no name tags during a ride or a film scene
  const b = new THREE.Box3().setFromObject(nearObj), c = b.getCenter(new THREE.Vector3()); c.y = Math.min(b.max.y, c.y + 1.6) + .25; c.project(camera);
  if (c.z > 1) { nearEl.style.opacity = 0; return; }
  nearEl.style.left = `${(c.x + 1) / 2 * innerWidth}px`; nearEl.style.top = `${Math.max(70, (1 - c.y) / 2 * innerHeight)}px`; nearEl.style.opacity = 1; }
// when your goal is off the screen, an arrow at the edge points toward it
var goalEl;
function goalArrow(on) { if (!goalEl) { goalEl = document.createElement('div'); goalEl.id = 'goalArrow'; goalEl.innerHTML = '<span>➤</span><b>Goal</b>'; document.body.appendChild(goalEl); }
  let show = false;
  if (on) { const v = marker.position.clone().project(camera), back = v.z > 1; let dx = back ? -v.x : v.x, dy = back ? -v.y : v.y;
    if (back || Math.abs(dx) > .95 || Math.abs(dy) > .9) { const m = Math.max(Math.abs(dx) / .9, Math.abs(dy) / .64, .001); dx /= m; dy /= m; show = true;
      goalEl.style.left = (dx * .5 + .5) * innerWidth + 'px'; goalEl.style.top = (-dy * .5 + .5) * innerHeight + 'px'; goalEl.firstChild.style.transform = `rotate(${Math.atan2(-dy, dx)}rad)`; } }
  goalEl.classList.toggle('show', show); }
var SOLIDS;
function solid(o, r, box) { o.userData.solid = r; if (box) o.userData.solidBox = box; (SOLIDS = SOLIDS || []).push(o); } /* box = [half width, half depth, center z], for buildings */
function solidAt(x, z) { const p = new THREE.Vector3(); for (const o of (SOLIDS || [])) { let vis = true, top = o; for (let a = o; a; a = a.parent) { if (!a.visible) { vis = false; break; } top = a; } if (!vis || top !== scene) continue;
    if (o.userData.kind === 'site' && !(S.built || []).includes(BUILDINGS[o.userData.i].id)) continue; // an empty building site is just a flat pad
    o.getWorldPosition(p); if (Math.abs(p.y - player.position.y) > 1.6) continue; const r = o.userData.solid;
    const bx = o.userData.solidBox; if (bx) { const inB = (px, pz, m) => { const l = o.worldToLocal(new THREE.Vector3(px, p.y, pz)); return Math.abs(l.x) < bx[0] + m && Math.abs(l.z - bx[2]) < bx[1] + m; };
      if (inB(x, z, .2) && !inB(player.position.x, player.position.z, .17)) return true; continue; }
    if (Math.hypot(p.x - x, p.z - z) < r && Math.hypot(p.x - player.position.x, p.z - player.position.z) >= r - .03) return true; } // (if you are somehow inside one, you can always walk out)
  return false; }
const walkY = (x, z) => solidAt(x, z) ? null : groundAt(x, player.position.y, z);
function tappables() { const out = new Set(); const walk = o => { if (!o.visible) return; if (o.userData && o.userData.kind) { out.add(o); } o.children.forEach(walk); };
  [...clickables, ...lateClicks, ...digGroups].forEach(walk); decos.forEach(d => { let v = true; for (let o = d; o; o = o.parent) if (!o.visible) v = false; if (v) out.add(d); }); return [...out]; }
// --- finer detail on things around the islands. Everything here is added on top of the simple shapes above ---
try { const hr = KIT.hr, ringOf = (g, r, y, n, c1 = 0xd8cfc0, c2 = 0xbfb6a8, h = .18) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, st = mesh(new THREE.BoxGeometry(2 * Math.PI * r / n - .03, h + hr(i) * .07, .14), mat(i % 2 ? c1 : c2), Math.sin(a) * r, h / 2, Math.cos(a) * r); st.rotation.y = a; g.add(st); } };
  const band = (g, r, y, c, t = .035) => { const b = mesh(new THREE.TorusGeometry(r, t, 6, 32), mat(c), 0, y, 0); b.rotation.x = Math.PI / 2; g.add(b); return b; };
  { // the windmill: plaster tower on a stone foot, a thatched cap, latticed sails, a proper door, round windows, sacks of grain
    const w = windmill; w.children[0].material.map = tx('plaster', 6, 3); w.children[1].material.map = tx('straw', 6, 1); w.children[2].visible = false;
    ringOf(w, 1.66, 0, 22); band(w, 1.44, 1.3, 0x9b6b4a); band(w, 1.25, 2.85, 0x9b6b4a); band(w, 1.36, 4.03, 0x5aa9c8, .06); w.add(mesh(sph(.12), mat(0xffc857), 0, 5.45, 0));
    KIT.door(w, 0, 0, 1.54, { w:.8, h:1.25 }); KIT.lantern(w, .7, 1.45, 1.5);
    w.add(mesh(new THREE.BoxGeometry(.66,.66,.06), mat(0xffffff), 0, 2.6, 1.26)); w.add(mesh(new THREE.BoxGeometry(.03,.5,.03), fine(0xffffff), 0, 2.6, 1.33)); w.add(mesh(new THREE.BoxGeometry(.5,.03,.03), fine(0xffffff), 0, 2.6, 1.33)); w.add(mesh(new THREE.BoxGeometry(.8,.07,.16), mat(0xc98f58), 0, 2.26, 1.34));
    [-1, 1].forEach(sd => KIT.win(w, Math.sin(sd * 1.2) * 1.42, 1.5, Math.cos(sd * 1.2) * 1.42, { w:.34, round:true, ry:sd * 1.2, frame:0x9b6b4a }));
    blades.children.forEach(arm => { if (!arm.isGroup) return; const lm = fine(0x8a6040); for (let i = 0; i < 6; i++) arm.add(mesh(new THREE.BoxGeometry(.55,.03,.05), lm, .3, .62 + i * .35, .05)); arm.add(mesh(new THREE.BoxGeometry(.03,1.9,.05), lm, .57, 1.5, .05)); arm.add(mesh(new THREE.BoxGeometry(.03,1.9,.05), lm, .3, 1.5, .05)); });
    blades.add(mesh(new THREE.CylinderGeometry(.1,.1,.2,10), mat(0x4a4450), 0, 0, .14).rotateX(Math.PI / 2));
    millstone.add(mesh(new THREE.CylinderGeometry(.1,.1,.26,12), mat(0x4a4450), 0, 0, 0)); for (let i = 0; i < 8; i++) { const gr = mesh(new THREE.BoxGeometry(.02,.01,.48), fine(0x8a8290), Math.sin(i * Math.PI / 4) * .33, .13, Math.cos(i * Math.PI / 4) * .33); gr.rotation.y = i * Math.PI / 4; millstone.add(gr); }
    [[-1.75,1.2,0],[-2.0,.75,.5]].forEach(([x, z, r]) => { const sk = KIT.at(w, x, 0, z, r); sk.add(mesh(new THREE.CylinderGeometry(.2,.24,.44,12), mat(0xe8dcc0, { map:tx('grain', 2, 1) }), 0, .22, 0)); sk.add(mesh(sph(.21), mat(0xe8dcc0), 0, .44, 0)); const tie = mesh(new THREE.TorusGeometry(.1,.02,6,12), fine(0x9b6b4a), 0, .56, 0); tie.rotation.x = Math.PI / 2; sk.add(tie); sk.add(mesh(new THREE.ConeGeometry(.09,.12,8), mat(0xe8dcc0), 0, .64, 0)); });
    KIT.barrel(w, 1.5, 1.5, .9); KIT.pot(w, -.9, 1.75, .9, 2); }
  { // the cloud ship: planked hull, a railing, a cabin with a porthole, spars on the mast, ropes, an anchor, a stern lantern
    deck.material.map = tx('planks', 8, 1); deck.material.needsUpdate = true;
    [[.62, .96], [.36, .85], [.12, .68]].forEach(([y, f]) => { const r = mesh(new THREE.TorusGeometry(1.3 * f, .022, 6, 44), fine(0x2f6aa3), 0, y, 0); r.rotation.x = Math.PI / 2; r.scale.set(1.6, .8, 1); ship.add(r); });
    const rail = mat(0x9b6b4a, { map:tx('grain', 1, 2) }); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; if (Math.abs(Math.sin(a)) > .9 && Math.cos(a) > -.2 && Math.sin(a) > 0) continue; ship.add(mesh(new THREE.CylinderGeometry(.025,.03,.36,6), rail, Math.cos(a) * 1.98, 1.14, Math.sin(a) * .98)); }
    { const tr = mesh(new THREE.TorusGeometry(1, .035, 6, 44), rail, 0, 1.33, 0); tr.rotation.x = Math.PI / 2; tr.scale.set(1.98, .98, 1); ship.add(tr); }
    { const cab = KIT.at(ship, -1.25, .96, 0); cab.add(mesh(new THREE.BoxGeometry(.75,.5,.72), mat(0xfff6e6, { map:tx('planks', 3, 1) }), 0, .25, 0)); const rf = mesh(new THREE.BoxGeometry(.9,.07,.86), mat(0xd6332e), 0, .54, 0); cab.add(rf); KIT.win(cab, 0, .28, .37, { w:.22, round:true, frame:0xffc857, bars:false }); KIT.win(cab, 0, .28, -.37, { w:.22, round:true, frame:0xffc857, bars:false, ry:Math.PI }); cab.add(mesh(new THREE.BoxGeometry(.04,.34,.26), mat(0x9b6b4a), .39, .2, 0)); }
    ship.add(mesh(new THREE.CylinderGeometry(.035,.035,1.7,6), rail, .8, 3.48, 0).rotateZ(Math.PI / 2)); ship.add(mesh(new THREE.CylinderGeometry(.03,.03,1.6,6), rail, .8, 1.72, 0).rotateZ(Math.PI / 2)); ship.add(mesh(sph(.07), mat(0xffc857), 0, 3.95, 0));
    const rope = fine(0xd9c39a); [[1.9, 1.0], [-1.9, 1.0]].forEach(([x, y]) => { const len = Math.hypot(x, 3.8 - y), r = mesh(new THREE.CylinderGeometry(.012,.012,len,4), rope, x / 2, (3.8 + y) / 2, 0); r.rotation.z = Math.atan2(x, 3.8 - y); ship.add(r); });
    ship.add(mesh(sph(.13), mat(0xffc857), 2.12, 1.0, 0)); { const st = mesh(new THREE.ConeGeometry(.1,.3,5), mat(0xffc857), 2.3, 1.05, 0); st.rotation.z = -Math.PI / 2; ship.add(st); } // a gold figurehead
    { const iron = mat(0x4a4450), an = KIT.at(ship, 1.45, .55, .72); an.add(mesh(new THREE.CylinderGeometry(.025,.025,.5,6), iron, 0, .1, 0)); an.add(mesh(new THREE.BoxGeometry(.24,.035,.035), iron, 0, .3, 0)); const ar = mesh(new THREE.TorusGeometry(.16,.03,6,14,Math.PI), iron, 0, -.02, 0); ar.rotation.z = Math.PI; an.add(ar); an.add(mesh(new THREE.TorusGeometry(.05,.015,6,10), iron, 0, .38, 0)); }
    ship.add(mesh(new THREE.CylinderGeometry(.025,.025,.6,6), rail, -1.95, 1.3, 0)); KIT.lantern(ship, -1.95, 1.7, 0);
    { const d = KIT.at(ship, .35, .96, -.45); KIT.barrel(d, 0, 0, .7); const c = KIT.at(ship, .75, .96, .42, .3); KIT.crate(c, 0, 0, .7); }
    const rd = mesh(new THREE.BoxGeometry(.5,.6,.05), mat(0x2f6aa3), -2.05, .45, 0); ship.add(rd); }
  { // the tree stump workbench: bark, rings on the cut top, roots, a pile of split logs, a mallet
    const wb = workbench; wb.children[0].material.map = tx('grain', 2, 1); [.14, .27, .38].forEach(r => { const rg = mesh(new THREE.TorusGeometry(r, .008, 4, 24), fine(0xb5713a), 0, .578, 0); rg.rotation.x = Math.PI / 2; wb.add(rg); });
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + .3, rt = mesh(new THREE.ConeGeometry(.13,.5,6), mat(0x9b6b4a), Math.cos(a) * .46, .1, Math.sin(a) * .46); rt.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25); wb.add(rt); }
    [[0,0],[.16,0],[.08,.13]].forEach(([dz, dy], i) => { const lg = mesh(new THREE.CylinderGeometry(.075,.075,.5,8), mat(i % 2 ? 0xa9744a : 0x96633f, { map:tx('grain', 1, 2) }), -.75, .08 + dy, .1 + dz); lg.rotation.z = Math.PI / 2; wb.add(lg); [-.251, .251].forEach(x => { const e = mesh(new THREE.CircleGeometry(.065, 8), fine(0xe6c69a), -.75 + x, .08 + dy, .1 + dz); e.rotation.y = Math.sign(x) * Math.PI / 2; wb.add(e); }); });
    wb.add(mesh(new THREE.CylinderGeometry(.07,.07,.16,10), mat(0xb98a5c), -.18, .64, -.12).rotateZ(Math.PI / 2)); wb.add(mesh(new THREE.CylinderGeometry(.02,.02,.26,6), mat(0x8a6040), -.18, .62, .03).rotateX(Math.PI / 2));
    for (let i = 0; i < 6; i++) { const sh = mesh(new THREE.BoxGeometry(.07,.01,.03), fine(0xf1d6a8), .55 + hr(i) * .3, .01, .3 + hr(i + 4) * .3); sh.rotation.y = i; wb.add(sh); } }
  { // the kiln: brick dome, an arch of bricks around the mouth, a capped chimney, firewood, pots set out to dry
    kilnDome.material.map = tx('stone', 4, 2); const br = [mat(0xa8552f), mat(0xc97a4a)];
    for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI, b = mesh(new THREE.BoxGeometry(.13,.1,.1), br[i % 2], Math.cos(a) * .3, .03 + Math.sin(a) * .3, .72); b.rotation.z = a + Math.PI / 2; kiln.add(b); }
    for (let r = 0; r < 3; r++) { const rg = mesh(new THREE.TorusGeometry(.75 * Math.cos(.3 + r * .32), .012, 4, 28), fine(0x8a4a30), 0, .75 * Math.sin(.3 + r * .32), 0); rg.rotation.x = Math.PI / 2; kiln.add(rg); }
    kiln.add(mesh(new THREE.CylinderGeometry(.2,.2,.06,10), mat(0x7a3f26), .2, 1.12, -.2));
    [[0,0],[.15,0],[.075,.12]].forEach(([dx, dy], i) => { const lg = mesh(new THREE.CylinderGeometry(.06,.06,.45,7), mat(i % 2 ? 0xa9744a : 0x96633f), .95 + dx, .07 + dy, .25); lg.rotation.x = Math.PI / 2; kiln.add(lg); });
    [[-.95,.35,.12],[-1.1,.05,.09]].forEach(([x, z, r]) => { kiln.add(mesh(new THREE.CylinderGeometry(r * .8, r * .6, r * 1.6, 12), mat(0xd9a27a), x, r * .8, z)); kiln.add(mesh(new THREE.TorusGeometry(r * .8, .015, 6, 14), mat(0xc98a5c), x, r * 1.6, z).rotateX(Math.PI / 2)); }); }
  { // the furnace: iron bands, a stone foot, bellows, tongs, a little heap of ore
    furnace.children[0].material.map = tx('stone', 3, 2); ringOf(furnace, .74, 0, 12, 0x9a93a8, 0x8a8290, .14); band(furnace, .64, .4, 0x4a4450, .03); band(furnace, .56, .95, 0x4a4450, .03); band(furnace, .46, 1.32, 0x4a4450, .03);
    const bl = KIT.at(furnace, -.85, .25, .35, .6); bl.add(mesh(new THREE.BoxGeometry(.42,.12,.3), mat(0x9b6b4a), 0, .1, 0)); bl.add(mesh(new THREE.BoxGeometry(.42,.14,.3), mat(0x6b4630), 0, 0, 0)); bl.add(mesh(new THREE.BoxGeometry(.42,.06,.3), mat(0x9b6b4a), 0, -.1, 0)); const nz = mesh(new THREE.ConeGeometry(.05,.3,8), mat(0x4a4450), .34, 0, 0); nz.rotation.z = -Math.PI / 2; bl.add(nz); bl.add(mesh(new THREE.BoxGeometry(.04,.3,.04), mat(0x8a6040), 0, -.28, 0));
    [[.8,.5,0x8f8a92],[.95,.3,0x5aa38a],[.72,.25,0x8f8a92]].forEach(([x, z, c], i) => { const o = mesh(new THREE.DodecahedronGeometry(.1 + i * .02), mat(c), x, .08, z); o.rotation.set(i, i * 2, 0); furnace.add(o); });
    const tg = fine(0x4a4450); [-1, 1].forEach(sd => { const t = mesh(new THREE.BoxGeometry(.02,.02,.5), tg, .55 + sd * .03, .02, -.35); t.rotation.y = sd * .08 + .5; furnace.add(t); }); }
  { // the sundial: weathered stone on a step, an engraved ring, a bolder pointer
    sundial.children[0].material.map = tx('stone', 3, 3); sundial.add(mesh(new THREE.CylinderGeometry(.92,.98,.08,32), mat(0xcfc6b6, { map:tx('stone', 3, 3) }), 0, .04, 0));
    [.34, .7].forEach(r => { const rg = mesh(new THREE.TorusGeometry(r, .01, 4, 40), fine(0x8a7a6a), 0, .185, 0); rg.rotation.x = Math.PI / 2; sundial.add(rg); });
    for (let i = 0; i < 12; i += 3) { const a = i / 12 * Math.PI * 2; sundial.add(mesh(new THREE.BoxGeometry(.07,.025,.2), fine(0x6b5a4a), Math.cos(a) * .58, .195, Math.sin(a) * .58)).rotation.y = -a + Math.PI / 2; }
    [[.8,.3],[-.7,.55],[.2,-.85]].forEach(([x, z], i) => { const t = mesh(new THREE.ConeGeometry(.04,.18,4), fine(i % 2 ? 0x5fa85a : 0x8fcf7a), x, .08, z); sundial.add(t); }); }
  { // the dark room: board walls on a stone foot, and a lantern over the door
    darkroom.children[0].material.map = tx('planks', 5, 1); KIT.foot(darkroom, 1.8, 1.8, 0, 21); KIT.lantern(darkroom, -.45, 1.25, .96); }
  if (lighthouse) { // the lighthouse: rocks at its foot, a door, small windows, a railed walkway around the lamp
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rk = mesh(new THREE.DodecahedronGeometry(.2 + hr(i) * .14), mat(i % 2 ? 0x9a93a8 : 0xb3aabb, { map:tx('stone', 1, 1) }), Math.cos(a) * .8, .1, Math.sin(a) * .8); rk.rotation.set(i, i * 2, 0); lighthouse.add(rk); }
    KIT.door(lighthouse, 0, 0, .65, { w:.4, h:.72, color:0x8a5a3b }); [1.5, 2.4].forEach((y, i) => KIT.win(lighthouse, 0, y, .58 - i * .09, { w:.2, round:true, frame:0x3b2f4a, bars:false }));
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; lighthouse.add(mesh(new THREE.CylinderGeometry(.015,.015,.26,5), fine(0x3b2f4a), Math.cos(a) * .53, 3.3, Math.sin(a) * .53)); } band(lighthouse, .53, 3.43, 0x3b2f4a, .018);
    lighthouse.add(mesh(sph(.07), mat(0xffc857), 0, 4.16, 0)); }
  if (squareBits && squareBits.fnt) { // the Town Square: a carved fountain with coins in the water, joints in the paving, and goods on Pip's cart
    const f = squareBits.fnt, g = squareBits.g, st = mat(0xd8cfc0, { map:tx('stone', 2, 1) }), dk = mat(0xbfb6a8);
    band(f, 1.36, .46, 0xcfc6b6, .06); band(f, 1.46, .03, 0xbfb6a8, .07); ringOf(f, 1.5, 0, 20, 0xd8cfc0, 0xcac2b6, .12);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = mesh(new THREE.BoxGeometry(.3,.26,.06), dk, Math.sin(a) * 1.41, .22, Math.cos(a) * 1.41); p.rotation.y = a; f.add(p); } // carved panels around the basin
    f.add(mesh(new THREE.CylinderGeometry(.36,.4,.12,16), st, 0, .44, 0)); band(f, .27, .7, 0xcfc6b6, .03); band(f, .24, 1.1, 0xcfc6b6, .03); band(f, .62, 1.52, 0xcfc6b6, .035);
    f.add(mesh(new THREE.CylinderGeometry(.09,.13,.2,10), st, 0, 1.6, 0)); f.add(mesh(new THREE.ConeGeometry(.07,.16,8), st, 0, 1.86, 0));
    [[.5,.3],[-.6,.5],[.2,-.7],[-.3,-.4],[.8,-.2],[-.85,-.1]].forEach(([x, z], i) => { const c = mesh(new THREE.CylinderGeometry(.06,.06,.012,12), mat(0xffc857, { metalness:.5, roughness:.3 }), x, .39, z); c.rotation.z = (i % 3 - 1) * .2; f.add(c); }); // wishes
    [[.75,.55,0xff8fa3],[-.5,-.8,0xffffff]].forEach(([x, z, c]) => { f.add(mesh(new THREE.CylinderGeometry(.16,.16,.012,12,1,false,.5,5.6), fine(0x4fb46a), x, .44, z)); f.add(mesh(sph(.05), fine(c), x, .47, z)); });
    const jm = new THREE.MeshBasicMaterial({ color:0x8a6f48, transparent:true, opacity:.28 }); jm.userData.outlineParameters = NO_OUTLINE;
    [[1.75, 2.15, 18], [3.7, 3.95, 34]].forEach(([a, b, n]) => { for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2, l = new THREE.Mesh(new THREE.BoxGeometry(.02, .004, b - a), jm); l.position.set(Math.sin(an) * (a + b) / 2, .016, Math.cos(an) * (a + b) / 2); l.rotation.y = an; g.add(l); } }); // gaps between paving stones
    for (let i = 0; i < 26; i++) { const an = hr(i) * Math.PI * 2, r = 2.4 + hr(i + 30) * 1.1, pv = mesh(new THREE.CylinderGeometry(.16 + hr(i + 7) * .1, .18 + hr(i + 7) * .1, .02, 7), mat(i % 2 ? 0xe2c99a : 0xd9bd8a), Math.cos(an) * r, .012, Math.sin(an) * r); pv.rotation.y = i; pv.scale.z = .8; pv.castShadow = false; g.add(pv); } // loose paving stones between the rings
  }
  { // the second ship, moored at the Old Heart: a deck, planking, a railing, a spar, a flag and a lantern
    const dk2 = mesh(new THREE.CylinderGeometry(1.78,1.78,.1,24), mat(0xd9a066, { map:tx('planks', 8, 1) }), 0, .86, 0); dk2.scale.set(1, 1, .5); ship2.add(dk2);
    { const sp = mesh(new THREE.TorusGeometry(1.2, .06, 6, 40), mat(0xffffff), 0, .84, 0); sp.rotation.x = Math.PI / 2; sp.scale.set(1.5, .75, 1); ship2.add(sp); }
    [[.6, .96], [.36, .85], [.14, .68]].forEach(([y, fk]) => { const r = mesh(new THREE.TorusGeometry(1.2 * fk, .02, 6, 40), fine(0x2f6aa3), 0, y, 0); r.rotation.x = Math.PI / 2; r.scale.set(1.5, .75, 1); ship2.add(r); });
    const rl = mat(0x9b6b4a, { map:tx('grain', 1, 2) }); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; ship2.add(mesh(new THREE.CylinderGeometry(.022,.028,.32,6), rl, Math.cos(a) * 1.72, 1.07, Math.sin(a) * .84)); }
    { const tr = mesh(new THREE.TorusGeometry(1, .03, 6, 40), rl, 0, 1.24, 0); tr.rotation.x = Math.PI / 2; tr.scale.set(1.72, .84, 1); ship2.add(tr); }
    ship2.add(mesh(new THREE.CylinderGeometry(.03,.03,1.5,6), rl, .7, 3.18, 0).rotateZ(Math.PI / 2)); ship2.add(mesh(new THREE.CylinderGeometry(.028,.028,1.4,6), rl, .7, 1.64, 0).rotateZ(Math.PI / 2)); ship2.add(mesh(sph(.06), mat(0xffc857), 0, 3.54, 0));
    ship2.add(mesh(new THREE.PlaneGeometry(.5,.3), new THREE.MeshStandardMaterial({ color:0xff5a5a, side:THREE.DoubleSide }), .27, 3.34, 0));
    ship2.add(mesh(sph(.11), mat(0xffc857), 1.84, .95, 0)); ship2.add(mesh(new THREE.CylinderGeometry(.022,.022,.5,6), rl, -1.7, 1.2, 0)); KIT.lantern(ship2, -1.7, 1.55, 0);
    { const d = KIT.at(ship2, .5, .91, -.35); KIT.barrel(d, 0, 0, .65); const c = KIT.at(ship2, -.7, .91, .3, .4); KIT.crate(c, 0, 0, .65); }
    const rope = fine(0xd9c39a); [1.7, -1.7].forEach(x => { const len = Math.hypot(x, 2.5), r = mesh(new THREE.CylinderGeometry(.011,.011,len,4), rope, x / 2, 2.25, 0); r.rotation.z = Math.atan2(x, 2.5); ship2.add(r); }); }
  { // the sell crate: wood grain on the slats
    crate.children[0].material.map = tx('planks', 4, 1); crate.children[0].material.needsUpdate = true; }
  // join the look-alike parts of the big static things (moving and changing parts are marked to stay separate)
  blades.userData.keep = millstone.userData.keep = true; bake(windmill);
  [sail, saggy, flag, shipExplore, shipMarket].forEach(o => o.userData.keep = true); bake(ship); bake(ship2);
  if (squareBits && squareBits.fnt) { squareBits.water.userData.keep = true; squareBits.drops.forEach(d => d.userData.keep = true); bake(squareBits.fnt); }
  [workbench, kiln, furnace, sundial, darkroom].forEach(o => { if (o === kiln) kilnMouth.userData.keep = kilnDome.userData.keep = true; if (o === furnace) furnaceGlow.userData.keep = true; if (o === sundial) gnomon.userData.keep = true; bake(o); }); if (lighthouse) { lighthouse.userData.pivot.userData.keep = true; bake(lighthouse); }
} catch (e) { console.warn('detail', e); }
window.__sg = { VERSION, upgradeMenu, drawSites, siteGroups, villageCut,  glassGame, bronzeFurnace, nodes, get swing3() { return swing3; }, get bush3() { return bush3; }, cutBush, bushes, get tree3() { return tree3; }, fruitTrees, useFruitTree, get stall3() { return stall3; }, stallGame, get furn3() { return furn3; }, useFurnace, drawStations, get kiln3() { return kiln3; }, kilnGame, useKiln, makeCraft, CRAFTS, get fire3() { return fire3; }, useCampfire, get ham3() { return ham3; }, napMenu, drawBuilds, buildGroup, get bench3() { return bench3; }, sitBench, squareBits, planterSeed, toy, TOYS, drawToys, dandSprouts, get skip3() { return skip3; }, get dand3() { return dand3; }, dandGame, get ball() { return { h:ballH, vy:ballVy, ups:ballUps }; }, getPending:() => pending, findRoute, solidPt, getRoute:() => route, drawUsed, placeNodes, nodes, getTarget:() => target && target.toArray(), walkY, groundAt, questWait, questTarget, openDialog, closeDialog, drawTile, cropModel, bugModel, critter, scene, openFiles, FILE, museumDesk, useBakery, useTemple, useSite, birthdayParty, shipChoice, useFurnace, reflectCard, setRain:v => { raining = v; }, setDate:d => { dateOverride = d; }, noteFind, useCrate, openMoveGame, openMailbox, openGoals, furnShop, quiet, newTodayCard, helpDone, loftWindow, drawHouse, drawHomeInside, housePlans, useBuildSite, house, homeSize, drawHome, HELP, modePicker, endSetup, PLAY, RELIC_PLAY, shopCard, shopEarn, drawShop, shopData, crate, swingGame, skipGame, toyBall, ballV, museumWing, drawMuseum, MUSEUM, enterRoom, exitRoom, ROOMS, thanksCheck, openSound, openSettings, solidAt, exitHut, lanterns, SQ, pickAt, tappables, camera, decos,  openSquare, wishFountain, openNotice, pipCart, drawSquare, frame:() => tickFrame(), flight, devTryLegend, founderDrip, fDay, fGot, MODCTX, mythMenu, mythSighting, mythKind, mythCount, mythReveal, mp, drawShrooms, mythPower, mythAppear, mythOn, openKeeper, drawKeepers, drawWorld, syncTrust, keeperLevel, finishTrial, currentTrial, LH, switchIsland, testerTools, TESTSLOT, choosePet, drawPet, petPet, balloonTo, balloonMenu, openPresents, get pet() { return pet; }, openTownHall, helperGrow, openHelperTree, drawHelperTree, redeemTester, openMissions, openWall, missionCheck, seedShop, bringVisitor, talkPerson, drawPeople, peopleNewDay, personGift, peopleGroup, giftPicker, openFriends, spawnBugs, swingNet, bugGroup, fishing3D, get fish3() { return fish3; }, goSleep, shipChoice, voyage, marketDay, drawShip, get cine() { return cine; }, openMarket, brandEditor, designStudio, buyListing, openProduct, get myCode() { return myCode; }, expandCard, showLobes, lobes, onLand, chooseDilemma, startDilemma, deliverLetters, openStory, DILEMMAS, maybeNewToday, playDays, arrive, decos, get sitting() { return sitting; }, featureOn, FEATURES, useKiln, kilnGame, useFurnace, bronzePuzzle, gatherNode, nodes, get stations() { return S.stations; }, screenOf:(x,z) => { const v = new THREE.Vector3(x,0,z).project(camera); return { clientX:(v.x+1)/2*innerWidth, clientY:(1-v.y)/2*innerHeight }; }, setBuildMode, buildTap, get buildMode() { return buildMode; }, PIECES, useWorkbench, useBuildSite, usePickup, chopTree, mineRock, cutBush, homeStep, woodTrees, rocks, bushes, drawHome, birthdayParty, isPartyDay, islandYear, ageBand, openFeedback, birthdayPicker, openMailbox, visitWater, visitGift, checkInbox, communityHtml, get visiting() { return VISIT; }, get __homeDockVisible() { return homeDock.visible; }, save, drawHud, snapCam, CROPS, ITEMS, FURN, AHA_ORDER, BUILDINGS, RECIPES, BOOKS, SAYINGS, FINDS, get dateOverride() { return dateOverride; }, setDate:d => { dateOverride = d; applySeason(); drawHud(); }, festival, moon, season, S, sleep, useTile, useCrate, dig, useSundial, openBell, talk, openJournal, openBag, SFX, ambience, enterHut, exitHut, useSpot, usePot, useShip, fishing, starPuzzle, ropePuzzle, useFruitTree, fruitTrees, player, applySeason, drawRoom, useSign, walkTo:(x,y,z)=>{ target=new THREE.Vector3(x,y,z); pending=null; }, npcs, groundAt, walkables, useSign2, useWindmill, gearPuzzle, leverPuzzle, WIND_POS, useStakes, useBoulder, NIGHT_POS, useEasel, useDarkroom, useCrystals, moonPuzzle, useBakery, useLibrary, useMusicHall, useTemple, useGreatBell, useFrame, useSite, useObservatory, traceStars, flyTo, useShip, CONSTELLATIONS, OH, openGoals, furnShop, goal };

// developer mode: add #dev to the address, or tap the title 5 times
{ let taps = 0; document.querySelector('.title h1').addEventListener('click', () => { if (++taps >= 5 && LOCALDEV && !devOn()) { try { localStorage.setItem('sg.dev', 'true'); } catch {} import('./dev.js?v=' + Date.now()); toast('Developer mode on.'); } }); }
// ask the server once per visit whether this game is the Creator's; only then can developer mode turn on
// also starts loading the Creator's tools right away, before Play is tapped
if (mainKey() && !VISIT && !PREVIEW) fetch(`${CLOUD}/me?key=${mainKey()}`).then(r => r.json()).then(r => { if (!(r && r.founder && r.level >= 4)) return;
  loadMods(['creator']); if (DEV_OK) return;
  try { sessionStorage.setItem('sg.devok', '1'); } catch {} if (TESTSLOT && !playing) location.reload(); }).catch(() => {});
// on the Creator's test island, bring in her tools (the real island's key unlocks them)
if (DEV_OK && TESTSLOT && !PREVIEW) addEventListener('sg-playing', () => setTimeout(() => loadMods(['creator']), 1500));
if (devOn()) import('./dev.js?v=' + Date.now());

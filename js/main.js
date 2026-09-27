import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { HOWTO, QUEST5, BUILDINGS, GRANDMA_LETTER2, MUTE_KEY, SEASONS, CROPS, ITEMS, FURN, LOVES, BRIDGE2_COST, BRIDGE_COST, DAY_LEN, SAVE_KEY, NEIGHBORS, AHA, RECALL, AHA_ORDER, RELICS, LAYERS, QUESTIONS, QUEST3, QUEST4, ROOFS, WALLS, PAINT_PRICE, QUEST1, QUEST2, CHIMES } from '../data/content.js';
import { CONSTELLATIONS } from '../data/stars.js';
import { FINDS } from '../data/finds.js';
import { FISH } from '../data/fish.js';
import { icon } from '../data/icons.js';
import { FEATURES } from '../data/features.js';
import { ROLLOUT } from '../data/rollout.js';
import { DILEMMAS, islandFeel, PATHS } from '../data/journey.js';
import { EXPANSIONS, RECLAIM_FACT } from '../data/expand.js';
import { SHIP_PATHS, HEADINGS, WAYFINDING, FLOATING } from '../data/ship.js';
import { KID_ADJ, KID_NOUN, SHAPES, PATTERNS, SYMBOLS, PALETTE, BASES, logoSvg, productSwatch, hx, MARK_LESSON, DESIGN_LESSON } from '../data/market.js';
import { BUTTERFLIES, TAP_FACTS } from '../data/nature.js';
import { INSECTS } from '../data/insects.js';
import { TASTES, REACT, TIERS, TIER_HEARTS, tasteOf } from '../data/tastes.js';
import { SPECIES, NAMES, OUTFITS, TOP_COLORS, PERSONALITIES, REQUEST_LINES } from '../data/visitors.js';
import { SPECIALTIES, HOME_PRICE, AWAY_MULT, TRADE_FACT, heirloomOf, heirloomId, codeOfHeirloom, isHeirloom } from '../data/trade.js';
import { SKIN, HAIR_STYLES, HAIR_COLORS, SHIRTS, BOTTOMS, BOTTOM_COLORS, HATS, HAT_COLORS, DEFAULT_LOOK, MODES } from '../data/player.js';
import { realSeason, moonPhase, activeFestival, dateLabel, FESTIVAL_AHA, FESTIVALS, festivalWindow } from '../data/calendar.js';
import { VILLAGERS, VILLAGER_LOVES, VILLAGER_LOOK, RECIPES, BOOKS, XYLO, XYLO_NAMES, PENTA, SONGS, PENTA_AHA, SAYINGS } from '../data/village.js';
Object.assign(NEIGHBORS, VILLAGERS); Object.assign(LOVES, VILLAGER_LOVES);
RECIPES.forEach(r => ITEMS[r.id] = { name:r.name, sell:r.sell, kind:'dish' });
Object.assign(AHA, FESTIVAL_AHA);
INSECTS.forEach(b => ITEMS[b.id] = { name:b.name, sell:b.sell, kind:'bug' }); BUTTERFLIES.forEach(b => ITEMS[b.id] = { name:b.name, sell:50, kind:'bug' });
SPECIALTIES.forEach(sp => { ITEMS[sp.id] = { name:sp.name, sell:HOME_PRICE, kind:'specialty' }; FINDS[sp.id] = { fact:sp.fact, hint:'Every island grows one specialty. Trade with friends to get the others.' }; });
// heirloom flowers are named after the island they came from, so register any we hold
const registerHeirloom = id => { if (isHeirloom(id) && !ITEMS[id]) ITEMS[id] = { name:heirloomOf(codeOfHeirloom(id)).name, sell:60, kind:'heirloom' }; return id; };
for (const id of Object.keys(FESTIVAL_AHA)) if (!AHA_ORDER.includes(id)) AHA_ORDER.push(id);


// ============ STATE ============
const fresh = () => ({ day:1, t:0, coins:40, seeds:{ cloudberry:4, sunbell:0, skywheat:0, moonpumpkin:0, frostmint:0, kale:0 }, bag:{},
  tiles:Array.from({length:9},()=>({s:0})), sel:'cloudberry', hearts:{ nana:0, pip:0, drizzle:0, twins:0, lumen:0, mabel:0, hoot:0, allegra:0, sage:0 }, talked:{}, gifted:{}, scenes:[],
  bridge:false, pos:[0,0,2], where:'home', quest:0, aha:[], relics:0, digs:[], asked:-1, qi:0, letter:false,
  order:null, furn:{}, placed:Array(10).fill(null), q2:0, potDay:-1, fruit:{}, q3:0, bridge2:false, sprinklers:false, used:[], bigGarden:false, boulder:false, south:false, lastSeason:null, fests:{}, q5:0, tut:0, home:0, builds:[], stations:{}, bronzeKnown:false, tools:{}, pickups:[], chopped:{}, created:false, birthday:null, startedAt:null, lastParty:null, partyHat:false, name:'', look:null, mode:null, built:[], charted:[], cooked:[], read:[], songs:[], penta:false, sayings:[], builtDay:{}, q4:0, goals:null, paints:['0xff8fa3','0xfff1d6'], roof:'0xff8fa3', wall:'0xfff1d6' });
let S;
try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
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
const save = () => { if (VISIT) return; S.savedAt = Date.now(); if (typeof ageBand === 'function') S.ageBand = ageBand(); cloudDirty = true; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };
// is a feature switched on? live for everyone, or switched on in developer mode
const devFeatures = () => { try { return JSON.parse(localStorage.getItem('sg.features') || '{}'); } catch { return {}; } };
function featureOn(id) { const f = FEATURES.find(x => x.id === id), d = devOn() ? devFeatures() : {};
  if (f && !f.live && (!devOn() || d[id] === false)) return false; // not released yet
  return devOn() || unlockedToday(id); }
// rolling unlocks: count the real days this player has opened the game
function unlockedToday(id) { const r = ROLLOUT.find(x => x.id === id); return !r || (S.unlocked || []).includes(id) || playDays() >= r.day; }
const playDays = () => (S.playDates || []).length + (S.bonusDays || 0);
const devOn = () => { try { return localStorage.getItem('sg.dev') === 'true'; } catch { return false; } };
async function cloudPush(force) {
  if (devOn() || VISIT) return; // developer mode and visits never touch the cloud
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
const saveMine = () => { mine.savedAt = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(mine)); } catch {} };
const friendCodeOf = async key => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)))].map(b => b.toString(16).padStart(2,'0')).join('').slice(0,6).toUpperCase();
let muted = false; try { muted = localStorage.getItem(MUTE_KEY) === 'true'; } catch {}
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

// --- islands ---
const GRASS = [0x8fdc8a, 0x7fd07a, 0xd9b86a, 0xeef3ff];
function island(r, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x,y,z);
  const top = mesh(new THREE.CylinderGeometry(r, r*.97, 1, 48), o.mat || mat(0x8fdc8a), 0, -.5, 0); g.add(top);
  g.add(mesh(new THREE.CylinderGeometry(r*.97, r*.9, .6, 48), mat(0xb98a63), 0, -1.3, 0));
  const rock = mesh(new THREE.ConeGeometry(r*.9, r*.8, 48), mat(0x9c7fa8), 0, -1.6 - r*.4, 0); rock.rotation.x = Math.PI; g.add(rock);
  const lip = mesh(new THREE.TorusGeometry(r - .05, .3, 10, 72), top.material, 0, -.14, 0); lip.rotation.x = Math.PI/2; g.add(lip);
  for (let i=0;i<Math.round(r*1.4);i++){ const a = i*2.39, rr = r*(.45 + (i%4)*.1), len = 1 + (i%5)*.45, vine = i%3 === 0;
    const root = mesh(new THREE.CylinderGeometry(.035, .012, len, 5), mat(vine ? 0x5fb85c : 0x7a5236), Math.cos(a)*rr, -1.7 - len/2 - (1 - rr/r)*r*.5, Math.sin(a)*rr);
    root.rotation.z = Math.sin(i)*.15; g.add(root);
    if (vine) root.add(mesh(sph(.08), mat(0x7fd88a), 0, -len/2, 0)); }
  scene.add(g); if (!o.hidden) walkables.push(top); return { g, top, lip, r };
}
const HOME = island(9, 0, 0, 0);
const ORCH_POS = new THREE.Vector3(28, -1.5, 3);
const ORCH = island(8, ORCH_POS.x, ORCH_POS.y, ORCH_POS.z);
const WIND_POS = new THREE.Vector3(30, -3, -20);
const WIND = island(8, WIND_POS.x, WIND_POS.y, WIND_POS.z);
const NIGHT_POS = new THREE.Vector3(53, -2.5, -15);
const NIGHT = island(7, NIGHT_POS.x, NIGHT_POS.y, NIGHT_POS.z); NIGHT.top.material.color.set(0x6a5aa8); NIGHT.top.material.emissive = new THREE.Color(0x2a2150);

// --- grass tufts that sway ---
const tuftGeo = new THREE.ConeGeometry(.05, .28, 4); tuftGeo.translate(0, .14, 0);
const tuftMat = mat(0x6cc26a);
const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, 680);
const tuftData = [], dummy = new THREE.Object3D();
for (let i=0; i<680; i++) {
  const onHome = i < 330, R = onHome ? 8.6 : 7.6, c = onHome ? new THREE.Vector3() : i < 520 ? ORCH_POS : WIND_POS;
  let x, z; do { const a = Math.random()*Math.PI*2, r = Math.sqrt(Math.random())*R; x = c.x + Math.cos(a)*r; z = c.z + Math.sin(a)*r; }
  while (onHome && x > .3 && x < 4.6 && z > -1.8 && z < 3.5);
  tuftData.push({ x, y:c.y, z, s:.6 + Math.random()*.8, ph:Math.random()*6 });
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
  const bark = mat(0x9b6b4a);
  const trunk = mesh(new THREE.CylinderGeometry(.16,.26,1.3,10), bark, 0, .65, 0); trunk.rotation.z = (r(1)-.5)*.12; g.add(trunk);
  for (let i=0;i<3;i++){ const a = i*2.1 + r(2); const root = mesh(new THREE.ConeGeometry(.12,.45,6), bark, Math.cos(a)*.22, .1, Math.sin(a)*.22); root.rotation.set(Math.sin(a)*1.2, 0, -Math.cos(a)*1.2); g.add(root); }
  [-1,1].forEach(sd => { const br = mesh(new THREE.CylinderGeometry(.05,.08,.6,6), bark, sd*.22, 1.15, 0); br.rotation.z = -sd*.9; g.add(br); });
  const canopy = new THREE.Group(); canopy.position.y = 1.25; g.add(canopy);
  const cm = mat(0x5fc377), cm2 = mat(0x4fb46a);
  const blobs = [[0,.55,0,.85,cm],[.55,.35,.2,.55,cm2],[-.5,.4,-.2,.52,cm],[.1,.95,-.1,.55,cm],[-.2,.3,.5,.5,cm2],[.3,.25,-.5,.48,cm],[-.55,.75,.25,.4,cm2],[.45,.8,.35,.38,cm]];
  blobs.forEach(([bx,by,bz,br,m], i) => { const b = mesh(sph(br * (.9 + r(i+5)*.2)), m, bx, by, bz); b.scale.y = .9; canopy.add(b); });
  const fruits = new THREE.Group(); canopy.add(fruits);
  if (fruitKind) for (let i=0;i<8;i++){ const a=i*.8 + r(9); fruits.add(mesh(sph(.13), mat(fruitKind === 'apple' ? 0xff6b6b : 0xffb36b), Math.cos(a)*.82, .3+Math.sin(i*2)*.35, Math.sin(a)*.82)); }
  g.userData = { canopy, cm, cm2, fruits, ph:Math.random()*6 };
  parent.add(g); trees.push(g); return g;
}
const woodTrees = [[-7,-1],[-6,4],[5,-6],[-2,7],[6.5,5]].map(([x,z]) => tree(scene, x, z));
[[-5.5,-2],[-6,3.5],[5.5,3]].forEach(([x,z]) => woodTrees.push(tree(WIND.g, x, z)));
woodTrees.forEach((t, i) => { t.userData.kind = 'tree'; t.userData.key = 'tree'+i; });
const fruitTrees = [[-3,-3,'apple'],[2,-4,'peach'],[-4,3,'peach'],[5,.3,'apple']].map(([x,z,k], i) => {
  const t = tree(ORCH.g, x, z, k); t.userData.kind = 'fruitTree'; t.userData.i = i; t.userData.fruitKind = k; return t;
});

// --- flowers ---
const flowers = new THREE.Group(); scene.add(flowers);
for (let i=0;i<46;i++){ const a=Math.random()*Math.PI*2, r=3+Math.random()*5.3, x=Math.cos(a)*r, z=Math.sin(a)*r;
  if (x>0 && x<5 && z>-2.5 && z<3) continue;
  flowers.add(mesh(sph(.08), mat([0xffffff,0xffd1dc,0xfff3a0,0xc9b6ff][i%4]), x, .06, z)); }

// --- house with windows that glow at night ---
const house = new THREE.Group(); house.position.set(-4,0,-3);
house.add(mesh(new THREE.BoxGeometry(2.6,1.8,2.2), mat(0xfff1d6), 0, .9, 0));
const roof = mesh(new THREE.ConeGeometry(2.35,1.5,4), mat(0xff8fa3), 0, 2.52, 0); roof.rotation.y = Math.PI/4; roof.scale.set(1, 1, .95); house.add(roof);
const trim = mat(0xffffff), wood = mat(0x9b6b4a), woodLight = mat(0xc98f58);
house.add(mesh(new THREE.BoxGeometry(2.75,.12,2.35), trim, 0, 1.8, 0)); // roof edge trim
house.add(mesh(new THREE.BoxGeometry(2.8,.18,2.4), mat(0xd8cfc0), 0, .09, 0)); // stone footing
[[-1.3,1.1],[1.3,1.1],[-1.3,-1.1],[1.3,-1.1]].forEach(([x,z]) => house.add(mesh(new THREE.BoxGeometry(.14,1.8,.14), woodLight, x, .9, z))); // corner posts
[-.85,.85].forEach(x => { house.add(mesh(new THREE.BoxGeometry(.62,.57,.06), trim, x, 1.05, 1.11));
  [-1,1].forEach(sd => house.add(mesh(new THREE.BoxGeometry(.16,.55,.05), mat(0x7ec8e3), x + sd*.42, 1.05, 1.13))); });
const porch = mesh(new THREE.BoxGeometry(1.6,.12,.9), woodLight, 0, .12, 1.55); house.add(porch);
[-.7,.7].forEach(x => house.add(mesh(new THREE.CylinderGeometry(.05,.05,1.25,8), wood, x, .75, 1.95)));
const awning = mesh(new THREE.BoxGeometry(1.75,.08,1), mat(0xff8fa3), 0, 1.42, 1.62); awning.rotation.x = .22; house.add(awning); house.userData.awning = awning;
const arch = mesh(new THREE.CylinderGeometry(.35,.35,.1,16,1,false,0,Math.PI), wood, 0, 1.1, 1.12); arch.rotation.set(Math.PI/2, 0, Math.PI/2); house.add(arch);
house.add(mesh(new THREE.BoxGeometry(.3,.12,.35), mat(0xd8cfc0), 0, .06, 2.15)); // step
house.add(mesh(new THREE.BoxGeometry(.7,1.1,.1), mat(0x9b6b4a), 0, .55, 1.12));
const winMat = new THREE.MeshStandardMaterial({ color:0x9fd3ff, emissive:0xffc46b, emissiveIntensity:0, roughness:.4 });
[-.85,.85].forEach(x => house.add(mesh(new THREE.BoxGeometry(.5,.45,.08), winMat, x, 1.05, 1.12)));
house.add(mesh(new THREE.BoxGeometry(.32,.8,.32), mat(0xb0a898), .75, 2.95, -.35)); house.add(mesh(new THREE.BoxGeometry(.4,.1,.4), mat(0x8a8290), .75, 3.38, -.35)); // stone chimney
house.userData.kind = 'house'; scene.add(house);
const buildSite = new THREE.Group(); buildSite.position.copy(house.position); buildSite.userData.kind = 'buildsite'; scene.add(buildSite);
const siteStones = new THREE.Group(), siteFrame = new THREE.Group(), siteWalls = new THREE.Group(); buildSite.add(siteStones, siteFrame, siteWalls);
for (let i=0;i<14;i++){ const a = i/14*Math.PI*2, x = Math.cos(a)*1.45, z = Math.sin(a)*1.25; const st = mesh(new THREE.DodecahedronGeometry(.2), mat(0xb3aabb), x, .1, z); st.rotation.set(i, i*2, 0); siteStones.add(st); }
siteStones.add(mesh(new THREE.CylinderGeometry(.05,.05,.9,6), mat(0x9b6b4a), 1.7, .45, 1.3)); siteStones.add(mesh(new THREE.BoxGeometry(.7,.4,.06), mat(0xfff1d6), 1.7, .95, 1.33));
siteFrame.add(mesh(new THREE.BoxGeometry(2.7,.14,2.3), mat(0xc98f58), 0, .07, 0));
[[-1.3,1.1],[1.3,1.1],[-1.3,-1.1],[1.3,-1.1]].forEach(([x,z]) => siteFrame.add(mesh(new THREE.BoxGeometry(.16,1.9,.16), mat(0x9b6b4a), x, .95, z)));
[[0,1.1,2.7,0],[0,-1.1,2.7,0],[1.3,0,2.3,1],[-1.3,0,2.3,1]].forEach(([x,z,l,r]) => { const bm = mesh(new THREE.BoxGeometry(l,.14,.14), mat(0x9b6b4a), x, 1.85, z); bm.rotation.y = r*Math.PI/2; siteFrame.add(bm); });
[[0,-1.1,2.6,0],[1.3,0,2.2,1],[-1.3,0,2.2,1],[-.85,1.1,.9,0],[.85,1.1,.9,0]].forEach(([x,z,l,r]) => { for (let k=0;k<4;k++){ const pl = mesh(new THREE.BoxGeometry(l,.38,.08), mat(k%2 ? 0xd9a066 : 0xc98f58), x, .3 + k*.42, z); pl.rotation.y = r*Math.PI/2; siteWalls.add(pl); } });
const campfire = new THREE.Group(); campfire.position.set(-3.3, 0, .9); campfire.userData.kind = 'campfire'; scene.add(campfire);
for (let i=0;i<7;i++){ const a = i/7*Math.PI*2; campfire.add(mesh(new THREE.DodecahedronGeometry(.13), mat(0x8a8290), Math.cos(a)*.38, .08, Math.sin(a)*.38)); }
[0,1,2].forEach(i => { const lg = mesh(new THREE.CylinderGeometry(.06,.06,.6,6), mat(0x7a5236), 0, .12, 0); lg.rotation.set(Math.PI/2, i*Math.PI/3, 0); campfire.add(lg); });
const flame = mesh(new THREE.ConeGeometry(.18,.5,8), glow(0xffa94d), 0, .35, 0); campfire.add(flame); const flameHalo = halo(0xffa94d, 2.2, .6); flameHalo.position.y = .4; campfire.add(flameHalo);
const workbench = new THREE.Group(); workbench.position.set(-6.1, 0, .5); workbench.userData.kind = 'workbench'; scene.add(workbench);
workbench.add(mesh(new THREE.CylinderGeometry(.42,.5,.55,14), mat(0x9b6b4a), 0, .27, 0)); workbench.add(mesh(new THREE.CylinderGeometry(.43,.43,.03,14), mat(0xd9a066), 0, .56, 0));
workbench.add(mesh(new THREE.BoxGeometry(.08,.35,.08), mat(0x9b6b4a), .15, .72, .05).rotateZ(.6)); workbench.add(mesh(new THREE.DodecahedronGeometry(.08), mat(0x8a8290), .28, .82, .05));
const pickupGroup = new THREE.Group(); scene.add(pickupGroup);
const nodes = [];
const addNode = (kind, ore, x, y, z, i) => { const g = new THREE.Group(); g.position.set(x, y, z); g.userData = { kind, ore, key:`${ore}${i}` };
  if (kind === 'claypit') { const m = mesh(sph(.5), mat(0xb8653f), 0, 0, 0); m.scale.set(1.3, .22, 1); g.add(m); g.add(mesh(sph(.2), mat(0x9c4f30), .3, .06, .1)); }
  else { const r = mesh(new THREE.DodecahedronGeometry(.45), mat(ore === 'copper' ? 0x8f8a92 : 0x5f5a68), 0, .3, 0); r.rotation.set(i, i*2, 0); g.add(r);
    for (let k=0;k<5;k++){ const a = k*1.3; g.add(mesh(sph(.08), mat(ore === 'copper' ? 0x3fbf8f : 0xc9c9d9, ore === 'tin' ? { metalness:.6, roughness:.3 } : {}), Math.cos(a)*.38, .3 + Math.sin(k)*.2, Math.sin(a)*.38)); } }
  scene.add(g); nodes.push(g); };
[[-7.9,-2.2],[3.5,-7.4]].forEach(([x,z],i) => addNode('claypit', 'clay', x, 0, z, i));
[[5.5,-4.8],[6,1.8]].forEach(([x,z],i) => addNode('claypit', 'clay', ORCH_POS.x + x, ORCH_POS.y, ORCH_POS.z + z, i + 2));
[[-5.5,-3],[-2,-6.2],[4.2,-5.4]].forEach(([x,z],i) => addNode('ore', 'copper', ORCH_POS.x + x, ORCH_POS.y, ORCH_POS.z + z, i));
addNode('ore', 'tin', WIND_POS.x + 5, WIND_POS.y, WIND_POS.z - 4.5, 0);
const kiln = new THREE.Group(); kiln.position.set(-5.2, 0, 2.1); kiln.userData.kind = 'kiln'; scene.add(kiln);
const kilnDome = mesh(new THREE.SphereGeometry(.75, 18, 10, 0, Math.PI*2, 0, Math.PI/2), mat(0xc0703f), 0, 0, 0); kiln.add(kilnDome);
kiln.add(mesh(new THREE.CylinderGeometry(.16,.2,.5,10), mat(0x9c4f30), .2, .85, -.2));
const kilnMouth = mesh(new THREE.CircleGeometry(.22, 14, 0, Math.PI), glow(0xff8a3c), 0, .02, .74); kiln.add(kilnMouth);
const furnace = new THREE.Group(); furnace.position.set(-7.2, 0, -2.7); furnace.userData.kind = 'furnace'; scene.add(furnace);
furnace.add(mesh(new THREE.CylinderGeometry(.5,.7,1.3,12), mat(0xa8603a), 0, .65, 0)); furnace.add(mesh(new THREE.CylinderGeometry(.3,.45,.3,12), mat(0x8a4a2e), 0, 1.45, 0));
const furnaceGlow = mesh(new THREE.CircleGeometry(.18, 12), glow(0xffc857), 0, .45, .6); furnace.add(furnaceGlow); const furnaceHalo = halo(0xff9a3c, 1.8, .5); furnaceHalo.position.set(0, .45, .7); furnace.add(furnaceHalo);
[-.85,.85].forEach(x => { house.add(mesh(new THREE.BoxGeometry(.62,.14,.22), mat(0x9b6b4a), x, .77, 1.2));
  for (let i=0;i<4;i++) house.add(mesh(sph(.07), mat([0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff][i]), x - .22 + i*.15, .88, 1.22)); });
house.add(mesh(sph(.05), mat(0xffc857, { metalness:.5 }), .22, .55, 1.18));
const winHalos = [-.85,.85].map(x => { const hl = halo(0xffc46b, 1.3, 0); hl.position.set(x, 1.05, 1.3); house.add(hl); return hl; });
const smoke = []; for (let i=0;i<5;i++){ const sm = halo(0xffffff, .5, 0, false); scene.add(sm); smoke.push(sm); }
const stones = new THREE.Group(); scene.add(stones);
const stoneMat = mat(0xd8cfc0);
[[[-4,-1.7],[.6,-.9]], [[.6,-.9],[7.7,1.2]], [[-4,-1.7],[-1.8,.4]]].forEach(([[x0,z0],[x1,z1]]) => {
  const n = Math.round(Math.hypot(x1-x0, z1-z0) / .85);
  for (let i=0;i<=n;i++){ const k = i/n, x = x0 + (x1-x0)*k + Math.sin(i*2.1)*.12, z = z0 + (z1-z0)*k + Math.cos(i*1.7)*.12;
    if (x > .3 && x < 4.6 && z > -1.8 && z < 3.5) continue;
    const st = mesh(new THREE.CylinderGeometry(.26 + (i%3)*.04, .3, .06, 9), stoneMat, x, .02, z); st.rotation.y = i; stones.add(st); } });
const rocks = [[-7.6,1.4,.42],[6.8,-3.6,.38],[-2.8,-6.9,.45],[3.2,6.9,.4],[-6.2,-4.8,.36],[7.4,1.6,.34]].map(([x,z,r],i) => { const rk = mesh(new THREE.DodecahedronGeometry(r), mat(0xb3aabb), x, r*.5, z); rk.rotation.set(i, i*2, 0); rk.userData = { kind:'rock', key:'rock'+i }; scene.add(rk); return rk; });

// --- sell crate ---
const mailbox = new THREE.Group(); mailbox.position.set(-1.7, 0, -1.6); mailbox.rotation.y = .5;
mailbox.add(mesh(new THREE.CylinderGeometry(.05,.06,.9,8), mat(0x9b6b4a), 0, .45, 0));
const mbox = mesh(new THREE.CapsuleGeometry(.18,.35,4,10), mat(0x7ec8e3), 0, 1, 0); mbox.rotation.z = Math.PI/2; mailbox.add(mbox);
const mflag = new THREE.Group(); mflag.position.set(.2, 1, .1); mailbox.add(mflag);
mflag.add(mesh(new THREE.BoxGeometry(.03,.3,.03), mat(0x3b2f4a), 0, .15, 0)); mflag.add(mesh(new THREE.BoxGeometry(.14,.1,.02), mat(0xff5a5a), .07, .26, 0));
mailbox.userData.kind = 'mailbox';
const crate = new THREE.Group(); crate.position.set(5,0,-2.6);
crate.add(mesh(new THREE.BoxGeometry(1,.8,1), mat(0xd9a066), 0, .4, 0));
crate.add(mesh(new THREE.BoxGeometry(1.05,.12,1.05), mat(0xb87d45), 0, .82, 0));
crate.userData.kind = 'crate'; scene.add(crate);

// --- bridge + sign ---
const sign = new THREE.Group(); sign.position.set(8.2,0,1.6);
sign.add(mesh(new THREE.CylinderGeometry(.08,.08,1.2,8), mat(0x9b6b4a), 0, .6, 0));
sign.add(mesh(new THREE.BoxGeometry(1,.55,.1), mat(0xfff1d6), 0, 1.2, 0));
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
sign2.add(mesh(new THREE.CylinderGeometry(.08,.08,1.2,8), mat(0x9b6b4a), 0, .6, 0));
sign2.add(mesh(new THREE.BoxGeometry(1,.55,.1), mat(0xfff1d6), 0, 1.2, 0));
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
darkroom.add(mesh(new THREE.BoxGeometry(1.8,1.6,1.8), mat(0x2a2338), 0, .8, 0));
darkroom.add(mesh(new THREE.ConeGeometry(1.45,.7,4), mat(0x3b2f4a), 0, 1.95, 0).rotateY(Math.PI/4));
darkroom.add(mesh(sph(.06), glow(0xffffff), 0, 1.1, .92));
darkroom.userData.kind = 'darkroom'; scene.add(darkroom);
const crystals = new THREE.Group(); crystals.position.set(NIGHT_POS.x - 3, NIGHT_POS.y, NIGHT_POS.z - .5);
[[0,1.4],[.45,1],[-.4,.8],[.2,.6],[-.2,.5]].forEach(([x,h],i) => crystals.add(mesh(new THREE.ConeGeometry(.14,h,6), new THREE.MeshStandardMaterial({ color:0xc9b6ff, emissive:0x8f7bff, emissiveIntensity:.6, roughness:.2 }), x, h/2, (i%2)*.25)));
const crystalHalo = halo(0x8f7bff, 3.2, .45); crystalHalo.position.y = .7; crystals.add(crystalHalo);
crystals.userData.kind = 'crystals'; scene.add(crystals);
// --- the Old Heart: the center of the old village ---
const OH = new THREE.Vector3(-2, -1, -48);
const OLD = island(11, OH.x, OH.y, OH.z);
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
const ship2 = new THREE.Group(); ship2.position.set(OH.x + 9.3, OH.y, OH.z - .6); ship2.rotation.y = -1.45;
const hull2 = mesh(new THREE.SphereGeometry(1.2, 20, 10, 0, Math.PI*2, Math.PI/2, Math.PI/2), mat(0x3f86c9), 0, .85, 0); hull2.scale.set(1.5,.75,.75); ship2.add(hull2);
ship2.add(mesh(new THREE.CylinderGeometry(.07,.08,2.6,8), mat(0x9b6b4a), 0, 2.2, 0));
ship2.add(mesh(new THREE.PlaneGeometry(1.3,1.5), new THREE.MeshStandardMaterial({ color:0xfff6e6, side:THREE.DoubleSide }), .7, 2.4, 0));
ship2.userData.kind = 'ship2'; scene.add(ship2);
// building sites for rebuilding the village
function buildingModel(id) {
  const g = new THREE.Group();
  if (id === 'bakery') {
    g.add(mesh(new THREE.BoxGeometry(2.6,1.9,2.2), mat(0xffe6cc), 0, .95, 0));
    const r = mesh(new THREE.ConeGeometry(2.1,1.2,4), mat(0xd9825b), 0, 2.5, 0); r.rotation.y = Math.PI/4; g.add(r);
    g.add(mesh(new THREE.CylinderGeometry(.25,.3,1,10), mat(0xb0a898), .8, 3, -.4));
    g.add(mesh(new THREE.BoxGeometry(.7,1.1,.1), mat(0x9b6b4a), 0, .55, 1.12));
    const bread = mesh(new THREE.CapsuleGeometry(.18,.45,6,10), mat(0xd9a066), 0, 2.1, 1.2); bread.rotation.z = Math.PI/2; g.add(bread);
  }
  if (id === 'library') {
    g.add(mesh(new THREE.BoxGeometry(3,.25,2.4), mat(0xe8e0d0), 0, .12, 0));
    [-1.2,-.4,.4,1.2].forEach(x => g.add(mesh(new THREE.CylinderGeometry(.16,.18,1.9,12), mat(0xfff6e6), x, 1.2, .9)));
    g.add(mesh(new THREE.BoxGeometry(2.8,1.9,1.4), mat(0xf3e8d8), 0, 1.2, -.3));
    const ped = mesh(new THREE.CylinderGeometry(0, 1.7, .8, 3), mat(0xe8e0d0), 0, 2.55, .2); ped.rotation.set(Math.PI/2, 0, Math.PI/2); ped.scale.set(1, .5, 1); g.add(ped);
    [0xff8fa3,0x7ec8e3,0xffc857].forEach((c,i) => g.add(mesh(new THREE.BoxGeometry(.18,.5,.35), mat(c), -.3 + i*.22, .5, 1.05)));
  }
  if (id === 'musichall') {
    g.add(mesh(new THREE.CylinderGeometry(1.6,1.7,1.8,24), mat(0xfff1d6), 0, .9, 0));
    g.add(mesh(new THREE.SphereGeometry(1.65,24,12,0,Math.PI*2,0,Math.PI/2), mat(0xc9b6ff), 0, 1.8, 0));
    g.add(mesh(new THREE.BoxGeometry(.7,1.1,.1), mat(0x9b6b4a), 0, .55, 1.62));
    const note = new THREE.Group(); note.position.set(0, 3.9, 0); g.add(note);
    note.add(mesh(sph(.2), mat(0x3b2f4a), 0, 0, 0)); note.add(mesh(new THREE.BoxGeometry(.06,.7,.06), mat(0x3b2f4a), .17, .35, 0)); note.userData.spin = true;
  }
  if (id === 'temple') {
    const gate = mesh(new THREE.TorusGeometry(1.2,.3,12,32), mat(0xe8e0d0), 0, 1.2, 0); g.add(gate);
    g.add(mesh(new THREE.BoxGeometry(3.4,.3,.7), mat(0xd8cfc0), 0, .15, 0));
    const pond = mesh(new THREE.CylinderGeometry(.9,.9,.05,24), mat(0x7ec8e3, { roughness:.2 }), 0, .03, -1.6); g.add(pond);
    [[-1.6,-1.4],[1.6,-1.4]].forEach(([x,z]) => { g.add(mesh(new THREE.CylinderGeometry(.12,.18,.8,6), mat(0xb0a898), x, .4, z)); g.add(mesh(new THREE.BoxGeometry(.4,.3,.4), mat(0xb0a898), x, .95, z)); const lh = halo(0xffe0a8, 1.2, .5); lh.position.set(x, .95, z); g.add(lh); });
    const tr = mesh(sph(.7), mat(0xffb6c8), 1.6, 1.8, -2.2); g.add(tr); g.add(mesh(new THREE.CylinderGeometry(.1,.14,1.2,8), mat(0x9b6b4a), 1.6, .6, -2.2));
  }
  if (id === 'observatory') {
    g.add(mesh(new THREE.CylinderGeometry(1.6,1.8,1.8,24), mat(0xfff6e6), 0, .9, 0));
    const dome = mesh(new THREE.SphereGeometry(1.65, 24, 12, 0, Math.PI*2, 0, Math.PI/2), mat(0x5a4b99, { metalness:.2 }), 0, 1.8, 0); g.add(dome);
    const tube = mesh(new THREE.CylinderGeometry(.18,.25,1.8,12), mat(0x3b2f4a), .5, 2.9, .3); tube.rotation.set(.5, 0, -.6); g.add(tube);
    g.add(mesh(new THREE.BoxGeometry(.7,1.1,.1), mat(0x9b6b4a), 0, .55, 1.62));
  }
  return g;
}
const siteGroups = BUILDINGS.map((b, i) => {
  const g = new THREE.Group(); g.position.set(OH.x + b.pos[0], OH.y, OH.z + b.pos[1]); g.userData = { kind:'site', i };
  g.add(mesh(new THREE.CylinderGeometry(1.4,1.5,.15,24), mat(0xb0a898), 0, .07, 0));
  g.add(mesh(new THREE.CylinderGeometry(.06,.06,1,6), mat(0x9b6b4a), 1.2, .5, 1.1)); g.add(mesh(new THREE.BoxGeometry(.7,.4,.06), mat(0xfff1d6), 1.2, 1, 1.12));
  scene.add(g); return g;
});
function drawSites() {
  siteGroups.forEach((g, i) => {
    while (g.children.length > 3) g.remove(g.children[3]);
    const built = S.built.includes(BUILDINGS[i].id);
    g.children[1].visible = g.children[2].visible = !built;
    if (built) g.add(buildingModel(BUILDINGS[i].id));
    const v = BUILDINGS[i].villager; if (v) npcs[v].visible = built;
  });
}
const marker = new THREE.Group(); scene.add(marker);
const markerMat = new THREE.MeshBasicMaterial({ color:0xffc857, fog:false });
const mCone = new THREE.Mesh(new THREE.ConeGeometry(.28,.55,16), markerMat); mCone.rotation.x = Math.PI; marker.add(mCone);
const mRing = new THREE.Mesh(new THREE.TorusGeometry(.2,.06,8,20), markerMat); mRing.position.y = .45; mRing.rotation.x = Math.PI/2; marker.add(mRing);
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
  const bush = (x, z, s=1, c=0x4fb46a) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.userData = { kind:'bush', key:'bush'+bushes.length }; bushes.push(g); [[0,0,0,.45],[.35,-.05,.1,.34],[-.32,-.07,.08,.32],[.05,.15,-.15,.3]].forEach(([bx,by,bz,br]) => g.add(mesh(sph(br*s), mat(c), bx*s, br*s*.8 + by, bz*s))); dressing.add(g); return g; };
  [[-6.2,-2.6],[-5.6,-3.4,.8],[-2.2,-4.2,.9],[-6.9,2.6,.8],[5.9,-4.4],[6.7,-3.6,.7],[-1.6,6.6],[1.2,7.4,.8],[7.2,3.6,.8],[-4.8,5.2,.7]].forEach(([x,z,s]) => bush(x, z, s || 1));
  // flower beds hugging the hut and along the path
  const bed = (x, z, n, rx, rz) => { for (let i=0;i<n;i++){ const fx = x + (rnd(i+x*13)-.5)*rx, fz = z + (rnd(i*3+z*7)-.5)*rz, c = [0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff,0xffb36b][i%5];
    dressing.add(mesh(new THREE.CylinderGeometry(.015,.015,.22,4), mat(0x4fb46a), fx, .11, fz)); dressing.add(mesh(sph(.075), mat(c), fx, .24, fz)); } };
  const bedAt = (x, z, rx, rz, i) => { const h = hitBox(rx + .3, .5, rz + .3); h.position.set(x, .25, z); dressing.add(h); deco(h, () => pickSeeds('bed' + i)); };
  [[-5.1,-1.25,.8,.35],[-2.9,-1.25,.8,.35],[-5.55,-3,.35,1.8],[-2.45,-3,.35,1.8],[-.9,-.1,.7,.5],[6.3,.3,.8,.6]].forEach(([x,z,rx,rz], i) => bedAt(x, z, rx, rz, i));
  bed(-5.1, -1.25, 7, .8, .35); bed(-2.9, -1.25, 7, .8, .35); bed(-5.55, -3, 8, .35, 1.8); bed(-2.45, -3, 8, .35, 1.8); bed(-.9, -.1, 6, .7, .5); bed(6.3, .3, 6, .8, .6);
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
const sundial = new THREE.Group(); sundial.position.set(-1.6,0,1.2);
sundial.add(mesh(new THREE.CylinderGeometry(.75,.8,.18,32), mat(0xe8e0d0), 0, .09, 0));
const gnomon = mesh(new THREE.BoxGeometry(.06,.9,.5), mat(0x8a7a6a), 0, .5, 0); gnomon.rotation.x = .5; sundial.add(gnomon);
for (let i=0;i<12;i++){ const a=i/12*Math.PI*2; sundial.add(mesh(new THREE.BoxGeometry(.04,.02,.14), mat(0x8a7a6a), Math.cos(a)*.6, .19, Math.sin(a)*.6)); }
sundial.userData.kind = 'sundial'; scene.add(sundial);

// --- wind bell, appears when tuned ---
const bell = new THREE.Group(); bell.position.set(.3,0,-5.6); bell.visible = false;
bell.add(mesh(new THREE.CylinderGeometry(.06,.06,2.4,8), mat(0x9b6b4a), -.7, 1.2, 0));
bell.add(mesh(new THREE.CylinderGeometry(.06,.06,2.4,8), mat(0x9b6b4a), .7, 1.2, 0));
bell.add(mesh(new THREE.BoxGeometry(1.6,.12,.12), mat(0x9b6b4a), 0, 2.4, 0));
const bellBody = mesh(new THREE.CylinderGeometry(.22,.42,.6,24), mat(0xffc857, { metalness:.5, roughness:.35 }), 0, 1.95, 0); bell.add(bellBody);
deco(bell, () => { [523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*180)); bell.userData.ring = 1.5; toast('Ding! Your Wind Bell rings out across the sky.'); });
scene.add(bell);

// --- festival lanterns ---
const lanterns = new THREE.Group(); lanterns.visible = false; scene.add(lanterns);
const lanternMat = glow(0xffb45c);
for (let i=0;i<8;i++){ const a = i/8*Math.PI*2 + .3, x = Math.cos(a)*7.2, z = Math.sin(a)*7.2;
  lanterns.add(mesh(new THREE.CylinderGeometry(.05,.05,1.8,6), mat(0x9b6b4a), x, .9, z));
  const l = mesh(sph(.22), lanternMat, x, 1.9, z); l.scale.y = 1.25; lanterns.add(l); const lh = halo(0xffb45c, 1.6, .7); lh.position.set(x, 1.9, z); lanterns.add(lh);
  const h = hitBox(.6, 2.2, .6); h.position.set(x, 1.1, z); lanterns.add(h); deco(h, () => { pulse(lh, 1.2); chime(880); toast('You made a wish on the lantern. People light lanterns at festivals all over the world.'); }); }

// --- dig spots ---
const DIG_SPOTS = [[-6.5,2],[2.5,6],[-2.5,-7.2],[7,-1.5],[.5,-3.8],[-3.5,5.8],[4.2,3.8],[-7.5,-3.5]];
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
function cropModel(id, k, ripe) {
  const c = CROPS[id], g = new THREE.Group(), leaf = mat(0x5fc377), dark = mat(0x3f8f55), sz = .35 + k*.65;
  const sway = o => { o.userData.sway = true; return o; }, bob = o => { o.userData.bob = true; o.userData.by = o.position.y; return o; };
  const fruit = ripe ? mat(c.color, { emissive:c.color, emissiveIntensity: id === 'starbloom' ? .6 : .15 }) : mat(0x9fd88a);
  if (id === 'skywheat') {
    const col = ripe ? mat(0xe6c35c) : mat(k > .6 ? 0xc9d46a : 0x7fcf6a);
    [[-.2,-.15],[.15,-.2],[0,.1],[-.15,.25],[.22,.18]].forEach(([x,z]) => {
      const st = sway(new THREE.Group()); st.position.set(x,.1,z);
      st.add(mesh(new THREE.CylinderGeometry(.025,.03,.7*sz,5), col, 0, .35*sz, 0));
      if (k > .4) st.add(mesh(new THREE.CapsuleGeometry(.06,.18*sz,3,6), col, 0, .7*sz + .08, 0));
      g.add(st); });
  } else if (id === 'sunbell') {
    const st = sway(new THREE.Group()); st.position.y = .1; g.add(st);
    const h = .3 + k*.9; st.add(mesh(new THREE.CylinderGeometry(.04,.05,h,6), leaf, 0, h/2, 0));
    { const lf = mesh(new THREE.SphereGeometry(.12,8,6), leaf, .1, h*.5, 0); lf.scale.set(1,.3,.6); st.add(lf); }
    if (k > .5) { const head = new THREE.Group(); head.position.set(0,h+.02,.05); head.rotation.x = .5; st.add(head);
      const s2 = ripe ? .24 : .12;
      for (let i = 0; i < 10; i++) { const a = i/10*Math.PI*2; const pt = mesh(new THREE.SphereGeometry(.07,6,4), ripe ? mat(0xffd35c) : leaf, Math.cos(a)*s2, Math.sin(a)*s2, 0); pt.scale.set(1.3,1.3,.3); head.add(pt); }
      head.add(mesh(new THREE.CylinderGeometry(s2*.7,s2*.7,.06,12), mat(0x5a3a28), 0, 0, 0).rotateX(Math.PI/2)); }
  } else if (id === 'moonpumpkin') {
    [[-.3,.2],[.25,-.25],[.3,.25],[-.2,-.3]].slice(0, 1 + Math.floor(k*3)).forEach(([x,z]) => { const lf = mesh(new THREE.SphereGeometry(.16,8,5), dark, x, .16, z); lf.scale.set(1,.35,1); g.add(lf); });
    if (k > .3) { const p = new THREE.Group(); p.position.y = .12 + (ripe ? .12 : .05); const r = ripe ? .3 : .08 + k*.1;
      for (let i = 0; i < 6; i++) { const a = i/6*Math.PI*2; const lobe = mesh(new THREE.SphereGeometry(r*.55,8,6), fruit, Math.cos(a)*r*.4, 0, Math.sin(a)*r*.4); lobe.scale.y = .85; p.add(lobe); }
      p.add(mesh(new THREE.CylinderGeometry(.03,.04,.12,5), mat(0x6b4f3a), 0, r*.5, 0)); g.add(ripe ? bob(p) : p); }
  } else if (id === 'cloudberry') {
    const b = mesh(new THREE.SphereGeometry(.3*sz,8,6), leaf, 0, .2*sz + .08, 0); b.scale.y = .6; g.add(sway(b));
    if (k > .5) [[.18,.1],[-.15,.12],[0,-.18],[.12,-.12]].forEach(([x,z]) => g.add(mesh(new THREE.SphereGeometry(ripe ? .08 : .05,6,5), ripe ? fruit : mat(0xf2f0e0), x*sz*1.3, .3*sz + .1, z*sz*1.3)));
  } else if (id === 'frostmint' || id === 'kale') {
    const n = 3 + Math.floor(k*5), col = id === 'kale' ? mat(ripe ? 0x3f7a4f : 0x5f9a6a) : mat(ripe ? 0x5fd88a : 0x8fdc9a);
    for (let i = 0; i < n; i++) { const a = i/n*Math.PI*2, lf = mesh(new THREE.SphereGeometry((id === 'kale' ? .16 : .1)*sz + .03,7,5), col, Math.cos(a)*.14*sz, .15 + (i%2)*.08*sz, Math.sin(a)*.14*sz);
      lf.scale.set(1, id === 'kale' ? 1.4 : .7, .6); lf.rotation.y = -a; lf.rotation.z = .4; g.add(sway(lf)); }
    if (id === 'kale') g.add(mesh(new THREE.SphereGeometry(.1*sz+.02,7,5), col, 0, .3*sz+.08, 0));
  } else { // starbloom = Moonflower, a vine with white blooms that glow at night
    const st = sway(new THREE.Group()); st.position.y = .1; g.add(st);
    st.add(mesh(new THREE.CylinderGeometry(.03,.03,.9*sz,5), leaf, 0, .45*sz, 0));
    [[.12,.3],[-.12,.5],[.1,.7]].forEach(([x,y]) => { if (y < sz) { const lf = mesh(new THREE.SphereGeometry(.09,6,4), leaf, x, y*sz+.1, 0); lf.scale.set(1.2,.4,.8); st.add(lf); } });
    if (k > .6) { const fl = mesh(new THREE.ConeGeometry(ripe ? .2 : .08, .2, 10, 1, true), fruit, 0, .95*sz + .12, 0); fl.rotation.x = Math.PI; st.add(ripe ? bob(fl) : fl); }
  }
  return g;
}
function drawTile(i) {
  const g = tileGroups[i], t = S.tiles[i];
  while (g.children.length > 1) g.remove(g.children[1]);
  if (t.s === 0) return;
  g.add(mesh(new THREE.BoxGeometry(1.1,.14,1.1), mat(t.w ? 0x7a5236 : 0xb98a63), 0, .05, 0));
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
    [[0,0,0,.45],[.35,-.05,.1,.34],[-.32,-.07,.08,.32],[.05,.15,-.15,.3]].forEach(([bx,by,bz,br]) => b.add(mesh(sph(br), mat(0x4fb46a), bx, by + br*.8, bz))); scene.add(b); L.extra.push(b); });
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
  const b = mesh(sph(.5), mat(body), 0, .55, 0); b.scale.set(1,1.05,.95); inner.add(b);
  inner.add(mesh(sph(.3), mat(belly), 0, .5, .28));
  const head = mesh(sph(.42), mat(body), 0, 1.2, 0); if (frog) head.scale.set(1.2,.85,1); inner.add(head);
  [-1,1].forEach(s => {
    const eye = new THREE.Group(); eye.add(mesh(sph(.07), mat(0x2b2233, { roughness:.25 }))); eye.add(mesh(sph(.024), glow(0xffffff), .022, .03, .055));
    if (frog) { inner.add(mesh(sph(.14), mat(body), s*.22, 1.5, .12)); eye.position.set(s*.22, 1.53, .23); }
    else eye.position.set(s*.15, 1.26, .36);
    inner.add(eye); eyes.push(eye);
    const arm = mesh(sph(.13), mat(body), s*.47, .72, .04); arm.scale.set(.8, 1.25, .8); inner.add(arm); arms.push(arm);
    inner.add(mesh(sph(.07), mat(0xff9fb2), s*.26, 1.12, .32));
    inner.add(mesh(sph(.13), mat(body), s*.22, .1, .1));
    if (earType === 'round') inner.add(mesh(sph(.14), mat(ear), s*.3, 1.55, 0));
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
  if (earType === 'point') [-1,1].forEach(sd => { const e = mesh(new THREE.ConeGeometry(.13,.3,8), mat(ear), sd*.26, 1.58, 0); e.rotation.z = -sd*.3; inner.add(e); });
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
  g.userData.inner = inner; inner.userData.eyes = eyes; inner.userData.arms = arms; inner.userData.blink = Math.random()*4;
  scene.add(g); return g;
}
// the player's character is rebuilt from their chosen look
const player = new THREE.Group(); scene.add(player);
function person(lk) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner); const eyes = [], arms = [];
  const skin = mat(lk.skin), shirt = mat(lk.shirt), bottom = mat(lk.bottomColor), hair = mat(lk.hairColor), shoe = mat(0x3b2f4a);
  // legs and shoes
  [-1,1].forEach(sd => {
    inner.add(mesh(new THREE.CylinderGeometry(.085,.075,.5,10), lk.bottom === 'pants' ? bottom : skin, sd*.12, .32, 0));
    if (lk.bottom === 'shorts') inner.add(mesh(new THREE.CylinderGeometry(.1,.095,.2,10), bottom, sd*.12, .5, 0));
    const sh = mesh(sph(.1), shoe, sd*.12, .07, .04); sh.scale.set(1, .6, 1.4); inner.add(sh);
  });
  // hips: skirt or waistband
  if (lk.bottom === 'skirt') inner.add(mesh(new THREE.CylinderGeometry(.24,.4,.38,18), bottom, 0, .58, 0));
  else inner.add(mesh(new THREE.CylinderGeometry(.25,.24,.2,16), bottom, 0, .62, 0));
  // body
  inner.add(mesh(new THREE.CylinderGeometry(.22,.26,.52,16), shirt, 0, .95, 0));
  const shoulders = mesh(sph(.23), shirt, 0, 1.18, 0); shoulders.scale.set(1.1, .5, .85); inner.add(shoulders);
  // arms that swing from the shoulder
  [-1,1].forEach(sd => {
    const arm = new THREE.Group(); arm.position.set(sd*.3, 1.15, 0); arm.rotation.z = sd*.08;
    arm.add(mesh(new THREE.CylinderGeometry(.07,.065,.28,10), shirt, 0, -.13, 0));
    arm.add(mesh(new THREE.CylinderGeometry(.06,.055,.24,10), skin, 0, -.37, 0));
    arm.add(mesh(sph(.065), skin, 0, -.5, 0));
    inner.add(arm); arms.push(arm);
  });
  // neck and head
  inner.add(mesh(new THREE.CylinderGeometry(.08,.09,.1,10), skin, 0, 1.27, 0));
  inner.add(mesh(sph(.33), skin, 0, 1.52, 0));
  [-1,1].forEach(sd => {
    const eye = new THREE.Group(); eye.add(mesh(sph(.05), mat(0x2b2233, { roughness:.25 }))); eye.add(mesh(sph(.018), glow(0xffffff), .016, .022, .04));
    eye.position.set(sd*.12, 1.56, .29); inner.add(eye); eyes.push(eye);
    inner.add(mesh(sph(.055), mat(0xff9fb2), sd*.2, 1.47, .25));
    inner.add(mesh(sph(.06), skin, sd*.33, 1.52, 0)); // ears
  });
  inner.add(mesh(sph(.035), mat(new THREE.Color(lk.skin).multiplyScalar(.9).getHex()), 0, 1.5, .33)); // nose
  const smile = mesh(new THREE.TorusGeometry(.05, .013, 6, 12, Math.PI), mat(0x2b2233), 0, 1.42, .31); smile.rotation.z = Math.PI; inner.add(smile);
  // hair
  const cap = mesh(new THREE.SphereGeometry(.35, 22, 12, 0, Math.PI*2, 0, Math.PI/2.1), hair, 0, 1.54, -.02); cap.rotation.x = -.25; inner.add(cap);
  if (lk.hair === 'long') { const back = mesh(sph(.3), hair, 0, 1.3, -.2); back.scale.set(1.15, 1.5, .6); inner.add(back); }
  if (lk.hair === 'bun') inner.add(mesh(sph(.14), hair, 0, 1.86, -.14));
  if (lk.hair === 'curly') for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; inner.add(mesh(sph(.1), hair, Math.cos(a)*.3, 1.68 + Math.sin(i*1.7)*.05, Math.sin(a)*.3 - .03)); }
  if (lk.hair === 'pigtails') [-1,1].forEach(sd => { const pt = mesh(sph(.12), hair, sd*.36, 1.42, -.08); pt.scale.set(.8, 1.3, .8); inner.add(pt); });
  if (lk.hair === 'bob') [-1,1].forEach(sd => { const sdh = mesh(sph(.18), hair, sd*.27, 1.46, -.03); sdh.scale.set(.6, 1.2, 1); inner.add(sdh); });
  // hats, sized for a person's head
  const hc = lk.hatColor, y = 1.8;
  if (lk.hat === 'tophat') { inner.add(mesh(new THREE.CylinderGeometry(.34,.38,.06,20), mat(hc), 0, y, 0)); inner.add(mesh(new THREE.CylinderGeometry(.22,.24,.28,20), mat(hc), 0, y + .16, 0)); }
  if (lk.hat === 'crown') for (let i=0;i<9;i++){ const a = i/9*Math.PI*2; inner.add(mesh(sph(.065), mat([hc, 0xffffff, 0xfff3a0][i%3]), Math.cos(a)*.28, y - .07, Math.sin(a)*.28)); }
  if (lk.hat === 'beanie') { inner.add(mesh(new THREE.SphereGeometry(.36,20,10,0,Math.PI*2,0,Math.PI/2.1), mat(hc), 0, 1.58, -.01)); inner.add(mesh(new THREE.TorusGeometry(.33,.05,8,24), mat(hc), 0, 1.64, 0).rotateX(Math.PI/2)); inner.add(mesh(sph(.09), mat(0xffffff), 0, 1.96, 0)); }
  if (lk.hat === 'bow') [-1,1].forEach(sd => { const bw = mesh(sph(.1), mat(hc), .2 + sd*.09, 1.8, .06); bw.scale.set(1.2,.8,.5); inner.add(bw); });
  if (lk.hat === 'party') { const ph = mesh(new THREE.ConeGeometry(.2,.45,16), mat(hc), 0, y + .15, 0); inner.add(ph); inner.add(mesh(sph(.07), mat(0xffffff), 0, y + .4, 0)); for (let i=0;i<3;i++) inner.add(mesh(new THREE.TorusGeometry(.2 - i*.055,.018,6,16), mat(0xffffff), 0, y + i*.12, 0).rotateX(Math.PI/2)); }
  if (lk.hat === 'straw') { inner.add(mesh(new THREE.CylinderGeometry(.56,.58,.04,24), mat(0xf2d38a), 0, y - .04, 0)); inner.add(mesh(new THREE.CylinderGeometry(.24,.28,.22,20), mat(0xf2d38a), 0, y + .08, 0)); inner.add(mesh(new THREE.CylinderGeometry(.285,.285,.06,20), mat(hc), 0, y + .01, 0)); }
  g.userData.inner = inner; inner.userData.eyes = eyes; inner.userData.arms = arms; inner.userData.blink = Math.random()*4;
  return g;
}
// the player's character is a person, rebuilt from their chosen look
function dressPlayer() {
  const lk = { ...DEFAULT_LOOK, ...(S.look && S.look.human ? S.look : {}) };
  player.children.slice().forEach(c => player.remove(c));
  const c = person(lk); player.add(c); player.userData.inner = c.userData.inner;
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
npcs.nana.position.set(-1,0,-5.2);
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
const pot = new THREE.Group(); pot.position.set(ORCH_POS.x - 3.2, ORCH_POS.y, ORCH_POS.z + 3.3);
pot.add(mesh(new THREE.CylinderGeometry(.42,.34,.45,20), mat(0x6b6f7a, { metalness:.3 }), 0, .23, 0));
const lid = mesh(new THREE.ConeGeometry(.46,.18,20), new THREE.MeshStandardMaterial({ color:0xdff3ff, transparent:true, opacity:.55, roughness:.1 }), 0, .55, 0); lid.visible = false; pot.add(lid);
pot.userData.kind = 'pot'; scene.add(pot);
const dock = new THREE.Group(); dock.position.set(ORCH_POS.x + 6.8, ORCH_POS.y, ORCH_POS.z - 2.5); dock.rotation.y = .5;
for (let i=0;i<5;i++) dock.add(mesh(new THREE.BoxGeometry(.5,.1,1.2), mat(i%2?0xd9a066:0xc98f58), i*.5, .02, 0));
const ripple = mesh(new THREE.TorusGeometry(.5,.04,8,30), glow(0xffffff), 3.2, -.2, 0); ripple.rotation.x = Math.PI/2; dock.add(ripple);
dock.userData.kind = 'dock'; scene.add(dock);
const homeDock = dock.clone(); homeDock.position.set(7.4, 0, -4.4); homeDock.rotation.y = .6; homeDock.userData = { kind:'dock' }; homeDock.visible = false; scene.add(homeDock);

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
const bed = new THREE.Group(); bed.position.set(-2.6,0,-2.1);
bed.add(mesh(new THREE.BoxGeometry(1.5,.45,2.1), mat(0x9b6b4a), 0, .22, 0));
bed.add(mesh(new THREE.BoxGeometry(1.4,.2,1.5), mat(0x86c7ff), 0, .52, .25));
bed.add(mesh(new THREE.BoxGeometry(1,.2,.45), mat(0xffffff), 0, .55, -.7));
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
// A designed room: every spot is meant for a certain kind of furniture.
const FURN_CAT = { cake:'decor', rug:'rug', table:'table', armchair:'seat', rocker:'seat', bookshelf:'tall', lamp:'decor', fern:'decor', globe:'decor', mushroom:'decor', painting:'wall', sign:'wall' };
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
  g.add(mark, hit, lab); room.add(g); return g;
});
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
  spotGroups.forEach((g, i) => {
    while (g.children.length > 3) g.remove(g.children[3]);
    const k = S.placed[i]; g.children[0].visible = g.children[2].visible = !k;
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
const butterflies = [];
const wingGeo = new THREE.PlaneGeometry(.2,.15); wingGeo.rotateX(-Math.PI/2); wingGeo.translate(.1,0,0);
for (let i=0;i<9;i++){
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color:[0xffd35c,0xff9fb2,0xc9b6ff,0x9fe7e0][i%4], side:THREE.DoubleSide });
  const l = new THREE.Mesh(wingGeo, m), r = new THREE.Mesh(wingGeo, m); r.scale.x = -1; g.add(l, r);
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
  HOME.top.material.color.set(GRASS[s]); ORCH.top.material.color.set(GRASS[s]); WIND.top.material.color.set(GRASS[s]);
  tuftMat.color.set([0x6cc26a, 0x5fb85c, 0xc9a24f, 0xdfe8f5][s]);
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
  sfxBus = actx.createGain(); sfxBus.gain.value = muted ? 0 : 1; sfxBus.connect(actx.destination);
  const len = actx.sampleRate * 8; noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
  const d = noiseBuf.getChannelData(0); let last = 0;
  for (let i=0;i<len;i++){ const w = Math.random()*2-1; last = (last + .02*w)/1.02; d[i] = last*3.5; } // soft brown noise
  const fade = actx.sampleRate; // blend the tail into the head so the loop has no seam
  for (let i=0;i<fade;i++){ const k = i/fade; d[len-fade+i] = d[len-fade+i]*(1-k) + d[i]*k; }
  const loop = (freq, q) => { const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = actx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(sfxBus); src.start(); return { f, g }; };
  wind = loop(700, .5); rainNode = loop(2500, .4);
  const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = .07; lg.gain.value = 180; lfo.connect(lg); lg.connect(wind.f.frequency); lfo.start();
}
let sfxBus, noiseBuf, wind, rainNode;
function tone(f, { type='sine', t=0, dur=.3, vol=.06, to=null, attack=.01 } = {}) {
  if (!actx) return;
  const at = actx.currentTime + t, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at); if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
  o.connect(g); g.connect(sfxBus); o.start(at); o.stop(at + dur + .05);
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
  wind.g.gain.setTargetAtTime(on * (inside ? .012 : h > 19 ? .03 : .05), now, 1.5);
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
  ch.forEach((f, i) => { const t = i * .09; tone(f, { t, dur:7, vol:.018, attack:1.6 }); tone(f*2.001, { t, dur:4, vol:.004, attack:1.2 }); });
  if (chordIdx < 3 && Math.random() < .5) tone(ch[ch.length-1] * 2, { t:2.5, dur:4, vol:.01, attack:.4 });
}
function chime(f=880) {
  if (!actx || muted) return;
  const o = actx.createOscillator(), g = actx.createGain(); o.type='sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0, actx.currentTime); g.gain.linearRampToValueAtTime(.08, actx.currentTime+.02); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime+1.2);
  o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+1.3);
}
const muteBtn = document.getElementById('mute');
const ICON_ON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 7a4 4 0 010 6M15.5 5a7 7 0 010 10" fill="none" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>', ICON_OFF = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 8l4 4M17 8l-4 4" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>';
const drawMute = () => { muteBtn.innerHTML = muted ? ICON_OFF : ICON_ON; muteBtn.setAttribute('aria-label', muted ? 'Sound is off. Tap to turn on.' : 'Sound is on. Tap to turn off.'); };
drawMute();
muteBtn.onclick = () => { muted = !muted; try { localStorage.setItem(MUTE_KEY, muted); } catch {} if (sfxBus) sfxBus.gain.value = muted ? 0 : 1; if (!muted) sfx('click'); drawMute(); };

// ============ UI ============
const $ = id => document.getElementById(id);
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
const hex = c => '#' + c.toString(16).padStart(6,'0');
const ICON = {
  coin:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#ffc857" stroke="#d99a2b" stroke-width="2"/><circle cx="10" cy="10" r="3.5" fill="none" stroke="#d99a2b" stroke-width="1.6"/></svg>',
  hammer:'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="4" width="10" height="5" rx="1.5" fill="#8a8290"/><rect x="8" y="8" width="3" height="10" rx="1.2" fill="#c98f58"/></svg>',
  goal:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#8fdc8a"/><path d="M6 10.5l2.7 2.7L14 7.8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bag:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 7h12l-1 10H5z" fill="#d9a066"/><path d="M7 7V5.5a3 3 0 016 0V7" fill="none" stroke="#9b6b4a" stroke-width="1.8"/></svg>',
  book:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 4.5c2.5-1 5-1 7 .5v11c-2-1.5-4.5-1.5-7-.5z" fill="#ff8fa3"/><path d="M17 4.5c-2.5-1-5-1-7 .5v11c2-1.5 4.5-1.5 7-.5z" fill="#7ec8e3"/></svg>',
  on:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 7a4 4 0 010 6M15.5 5a7 7 0 010 10" fill="none" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>',
  off:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 8h3l4-3.5v11L6 12H3z" fill="#3b2f4a"/><path d="M13 8l4 4M17 8l-4 4" stroke="#3b2f4a" stroke-width="1.7" stroke-linecap="round"/></svg>',
};
function drawHud() {
  const fz = festival(), mph = moon();
  $('day').textContent = fz ? fz.name : `${SEASONS[season()]}, ${dateLabel(today())}${raining ? (season() === 3 ? ', snow' : ', rain') : hour() >= 19 && (mph.idx === 4 || mph.idx === 0) ? `, ${mph.name.toLowerCase()}` : ''}`;
  const h = hour(), hr = Math.floor(h), mn = Math.floor((h-hr)*6)*10, h12 = ((hr+11)%12)+1;
  $('clock').textContent = `${h12}:${String(mn).padStart(2,'0')} ${hr<12||hr>=24?'AM':'PM'}`;
  $('coins').innerHTML = `${ICON.coin}${S.coins}`; $('coins').setAttribute('aria-label', `${S.coins} coins`);
  $('bagBtn').innerHTML = `${ICON.bag}<span class="lbl">Bag</span>`;
  Object.keys(S.furn).forEach(k => S.furn[k] > 0 && noteFind(k));
  { const cats = collectionCats(); $('journalBtn').innerHTML = `${ICON.book}<span class="lbl">Collections</span> ${cats.reduce((a, c) => a + c.ids.filter(c.has).length, 0)}`; }
  { const tg = typeof questTarget === 'function' ? questTarget() : null, fz = festival();
    bubbles.forEach(b => { const id = b.userData.id, fest = fz && fz.host === id && !S.fests[fz.id + fz.year];
      const kind = tg === npcs[id] ? null : fest ? '!' : S.talked[id] !== S.day ? '...' : null;
      b.visible = !!kind; if (kind) b.material.map = BUBBLE[kind]; }); }
  $('goalsBtn').hidden = !featureOn('goals'); ensureGoals(); $('goalsBtn').innerHTML = `${ICON.goal}<span class="lbl">Goals</span> ${S.goals.list.filter(g => g.have >= g.need).length}/3`;
  drawQuest();
  const s = season(), shown = Object.entries(CROPS).filter(([k,c]) => (c.seasons.includes(s) && (!c.locked || S.q4 >= 5)) || S.seeds[k] > 0);
  if (!shown.some(([k]) => k === S.sel) && shown.length) S.sel = shown[0][0];
  $('bar').style.display = S.where === 'hut' || buildMode ? 'none' : 'flex';
  $('buildBtn').hidden = VISIT || (S.home || 0) < 3 || S.where !== 'home'; $('buildBtn').innerHTML = `${ICON.hammer}<span class="lbl">${buildMode ? 'Building' : 'Build'}</span>`;
  $('bar').innerHTML = shown.map(([k,c]) => `<div class="slot ${S.sel===k?'on':''}" data-k="${k}"><span class="sic">${icon(k)}</span>${c.name}<small>${S.seeds[k] || 0} seed${(S.seeds[k] || 0) === 1 ? '' : 's'}${c.seasons.includes(s) ? '' : ', out of season'}</small></div>`).join('');
  document.querySelectorAll('.slot').forEach(el => el.onclick = () => { S.sel = el.dataset.k; drawHud(); });
}
function openDialog(name, text, btns=[], hearts, voice) {
  babble(voice || (name.startsWith('Nana') ? 'nana' : name.startsWith('Pip') ? 'pip' : name.startsWith('Captain') ? 'drizzle' : name.startsWith('Moss') ? 'twins' : name.startsWith('Lumen') ? 'lumen' : ({ Mabel:'mabel', Professor:'hoot', Allegra:'allegra', Sage:'sage' })[name.split(' ')[0]] || 'none'), text);
  $('dName').textContent = name; $('dText').textContent = text;
  $('dHearts').textContent = hearts == null ? '' : '♥'.repeat(hearts) + '♡'.repeat(10-hearts);
  $('dBtns').innerHTML = '';
  [...btns, { label:'Bye', ghost:true, fn:closeDialog }].forEach(b => {
    const el = document.createElement('button'); el.textContent = b.label; if (b.ghost) el.className = 'ghost';
    el.onclick = b.fn; $('dBtns').appendChild(el);
  });
  $('dialog').classList.add('show');
}
function closeDialog() { $('dialog').classList.remove('show'); }
let cardClose = null, cardCleanup = null;
function hideCard() { $('veil').classList.remove('show'); if (cardCleanup) { cardCleanup(); cardCleanup = null; } }
function showCard(html, btn='Okay', onClose) {
  const kick = (html.match(/class="kicker">([^<]*)</) || [])[1] || '';
  $('card').className = 'card ' + (/ALREADY KNEW/.test(kick) ? 'k-recall' : /FESTIVAL/.test(kick) ? 'k-fest' : /STAR|OBSERVATORY|NIGHT SKY/.test(kick) ? 'k-star' : /MEMORY|STORY|TALE|SECRET|QUESTION/.test(kick) ? 'k-mem' : /LETTER|CHAPTER/.test(kick) ? 'k-letter' : 'k-plain');
  if (cardCleanup) { cardCleanup(); cardCleanup = null; }
  $('card').innerHTML = html + (btn ? `<button id="cardBtn">${btn}</button>` : '');
  $('veil').classList.add('show'); cardClose = onClose;
  if (btn) $('cardBtn').onclick = () => { hideCard(); const f = cardClose; cardClose = null; if (f) f(); };
}
function ahaHtml(id) {
  const a = AHA[id];
  return `<div class="kicker">${a.kicker}</div><h2>${a.title}</h2><h4>What you did</h4><p>${a.did}</p><h4>The real story</h4><p>${a.real}</p><h4>Where you see it today</h4><p>${a.today}</p>`;
}
function showAha(id, onClose) {
  lean('scholar', 2);
  if (!S.aha.includes(id)) { S.aha.push(id); if (S.mode === 'scholar') { S.coins += 30; setTimeout(() => toast('Scholar bonus: +30 coins for a new memory!'), 600); } }
  [523,659,784].forEach((f,i)=>setTimeout(()=>chime(f),i*140));
  showCard(ahaHtml(id), 'Save to my journal', onClose); drawRoom(); drawHud(); save();
}
function showRecall(id, onClose) {
  const r = RECALL[id], a = r.aha || id;
  if (!S.used.includes(a)) S.used.push(a);
  [659,784,988,1319].forEach((f,i)=>setTimeout(()=>chime(f),i*120));
  showCard(`<div class="kicker">YOU ALREADY KNEW THIS</div><h2>${r.title}</h2><p>${r.text}</p><h4>From your journal</h4><p>${AHA[a].title}</p>`, 'Nice!', onClose); save();
}
function lessonHtml(a) {
  return `<div class="kicker">${a.kicker}</div><h2>${a.title}</h2>${a.did ? `<h4>What you did</h4><p>${a.did}</p>` : ''}<h4>The real story</h4><p>${a.real}</p><h4>Where you see it today</h4><p>${a.today}</p>`;
}
function collectionList(title, kicker, items, have, show) {
  showCard(`<div class="kicker">${kicker}</div><h2>${title}</h2><div class="jlist">${items.map(x => have.includes(x.id) ? `<button data-cl="${x.id}">${x.name || x.title}</button>` : `<button class="locked">??? Not found yet</button>`).join('')}</div>`, 'Back', openJournal);
  document.querySelectorAll('[data-cl]').forEach(b => b.onclick = () => show(items.find(x => x.id === b.dataset.cl)));
}
let quietFind = false; // the fishing reveal shows its own fact
function noteFind(k) {
  if (S.found.includes(k)) return;
  S.found.push(k); if (quietFind) return;
  const f = FINDS[k]; if (!f) return; // dishes and quest items have their own cards
  const name = ITEMS[k]?.name || FURN[k]?.name || k;
  const el = $('discover'); el.onclick = () => el.classList.remove('show');
  el.innerHTML = `<b>FIRST FIND! ${S.found.filter(x => FINDS[x]).length} of ${Object.keys(FINDS).length} found</b><strong>${name}</strong><span><i style="font-style:normal;font-weight:800">In real life:</i> ${f.fact}</span>`;
  el.classList.add('show'); chime(1047); setTimeout(() => chime(1319), 120);
  clearTimeout(noteFind.t); noteFind.t = setTimeout(() => el.classList.remove('show'), 7000);
}
function collectionCats() { return allCats().filter(c => !({ Bugs:'butterflies', Specialties:'specialty', Heirlooms:'heirloom' })[c.name] || featureOn({ Bugs:'butterflies', Specialties:'specialty', Heirlooms:'heirloom' }[c.name])); }
function allCats() {
  const month = m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];
  const itemCard = (k, kick) => () => showCard(`<div class="kicker">${kick}</div><h2>${ITEMS[k]?.name || FURN[k]?.name}</h2><h4>In real life</h4><p>${FINDS[k].fact}</p><h4>In Sky Garden</h4><p>${FINDS[k].hint}${CROPS[k] ? ` It grows in ${CROPS[k].days} days here, and sells for ${CROPS[k].sell} coins.` : ITEMS[k] ? ` It sells for ${ITEMS[k].sell} coins.` : ''}${S.fishLog?.[k] ? ` Your biggest: ${S.fishLog[k].best} cm.` : ''}</p>`, 'Back', () => openCategory(kick));
  return [
    { name:'Crops', ids:Object.keys(CROPS), has:k => S.found.includes(k), label:k => CROPS[k].name, open:k => itemCard(k, 'Crops'), hint:k => FINDS[k].hint },
    { name:'Fruit', ids:['apple','peach'], has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => itemCard(k, 'Fruit'), hint:k => FINDS[k].hint },
    { name:'Fish', ids:['minnow','trout','koi','sunfish','frostchar','guppy','lanterneel','puffer','moonray'], has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => itemCard(k, 'Fish'), hint:k => FINDS[k].hint },
    { name:'Specialties', ids:SPECIALTIES.map(x => x.id), has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => () => showCard(`<div class="kicker">SPECIALTIES</div><h2>${ITEMS[k].name}</h2><h4>In real life</h4><p>${FINDS[k].fact}</p><p>${TRADE_FACT}</p><h4>In Sky Garden</h4><p>${k === S.specialty ? 'This is your island\'s specialty.' : 'This grows on a friend\'s island.'} It sells for ${HOME_PRICE * AWAY_MULT} coins on any island where it does not grow.</p>`, 'Back', () => openCategory('Specialties')), hint:() => 'Trade with friends. Each island grows a different one.' },
    { name:'Heirlooms', ids:S.found.filter(isHeirloom), has:() => true, label:k => `${registerHeirloom(k) && ITEMS[k].name} (${codeOfHeirloom(k) === myCode ? 'yours' : 'island ' + codeOfHeirloom(k)})`, open:k => () => showCard(`<div class="kicker">HEIRLOOM FLOWERS</div><h2>${ITEMS[k].name}</h2><p>Only grows on island ${codeOfHeirloom(k)}.</p><h4>In real life</h4><p>Gardeners breed and name their own flower and vegetable varieties. In the 1930s one man bred the Mortgage Lifter tomato and paid off his house selling the seedlings.</p>`, 'Back', () => openCategory('Heirlooms')), hint:() => '' },
    { name:'Bugs', ids:[...BUTTERFLIES.map(b => b.id), ...INSECTS.map(b => b.id)], has:k => (S.bugs || []).includes(k), label:k => (BUTTERFLIES.find(b => b.id === k) || INSECTS.find(b => b.id === k)).name, open:k => () => { const b = BUTTERFLIES.find(x => x.id === k) || INSECTS.find(x => x.id === k); showCard(`<div class="kicker">BUGS</div><h2>${icon(k)} ${b.name}</h2><h4>In real life</h4><p>${b.fact}</p>`, 'Back', () => openCategory('Bugs')); }, hint:k => { const b = INSECTS.find(x => x.id === k); return b ? `Look ${ { air:'in the air', flower:'on flowers', ground:'on the ground', tree:'on tree trunks' }[b.where] } in ${b.seasons.map(x => SEASONS[x].toLowerCase()).join(' or ')}${b.time === 'night' ? ', at night' : b.time === 'day' ? ', in the day' : ''}.` : 'Tap a butterfly when you see one flying.'; } },
    { name:'Furniture', ids:Object.keys(FURN), has:k => S.found.includes(k), label:k => FURN[k].name, open:k => itemCard(k, 'Furniture'), hint:k => FINDS[k].hint },
    { name:'Memories', ids:AHA_ORDER, has:k => S.aha.includes(k), label:k => AHA[k].title + (S.used.includes(k) ? ' ★' : ''), open:k => () => showCard(ahaHtml(k), 'Back', () => openCategory('Memories')), hint:() => 'Keep playing the story, digging, and celebrating festivals.' },
    { name:'Dishes', ids:RECIPES.map(r => r.id), has:k => S.cooked.includes(k), label:k => RECIPES.find(r => r.id === k).name, open:k => () => showCard(lessonHtml(RECIPES.find(r => r.id === k).aha), 'Back', () => openCategory('Dishes')), hint:k => `Cook it at the Bakery. Needs ${Object.entries(RECIPES.find(r => r.id === k).needs).map(([i,n]) => `${n} ${ITEMS[i].name}`).join(' and ')}.` },
    { name:'Star Chart', ids:CONSTELLATIONS.map(c => c.id), has:k => S.charted.includes(k), label:k => CONSTELLATIONS.find(c => c.id === k).name, open:k => () => showCard(starHtml(CONSTELLATIONS.find(c => c.id === k)), 'Back', () => openCategory('Star Chart')), hint:k => `Chart it at the Observatory after 8 PM. Out in ${CONSTELLATIONS.find(c => c.id === k).months.map(month).join(', ')}.` },
    { name:'Library Books', ids:BOOKS.map(b => b.id), has:k => S.read.includes(k), label:k => BOOKS.find(b => b.id === k).title, open:k => () => showCard(lessonHtml({ kicker:'THE LIBRARY', ...BOOKS.find(b => b.id === k) }), 'Back', () => openCategory('Library Books')), hint:() => 'Build the Library. A new book arrives every week.' },
    { name:'Songs', ids:[...SONGS.map(x => x.id), 'penta'], has:k => k === 'penta' ? S.penta : S.songs.includes(k), label:k => k === 'penta' ? 'The Five-Note Scale' : SONGS.find(x => x.id === k).name, open:k => () => showCard(lessonHtml(k === 'penta' ? PENTA_AHA : SONGS.find(x => x.id === k).aha), 'Back', () => openCategory('Songs')), hint:() => 'Build the Music Hall and play the xylophone.' },
    { name:'Sayings', ids:SAYINGS.map(x => x.id), has:k => S.sayings.includes(k), label:k => SAYINGS.find(x => x.id === k).text.slice(0, 44) + '...', open:k => () => showCard(sayingHtml(SAYINGS.find(x => x.id === k)), 'Back', () => openCategory('Sayings')), hint:() => 'Build the Temple Garden. Sage shares a new saying each day.' },
  ];
}
function openCategory(name) {
  const c = collectionCats().find(x => x.name === name), got = c.ids.filter(c.has).length;
  showCard(`<div class="kicker">COLLECTIONS</div><h2>${name}: ${got} of ${c.ids.length}</h2><div class="jlist">${c.ids.map(k => c.has(k) ? `<button data-ck="${k}">${name === 'Bugs' ? icon(k) + ' ' : ['Crops','Fruit','Fish','Furniture','Dishes'].includes(name) ? icon(k, ITEMS[k]?.kind) + ' ' : ''}${c.label(k)}</button>` : `<button class="locked">??? <span class="sub">${c.hint(k)}</span></button>`).join('')}</div>`, 'Back', openJournal);
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
  if (!S.birthday || !S.birthday.y) return 'kid'; // no birthday given: use kid-safe settings
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
    $('bdSkip').onclick = () => { S.birthdayAsked = true; save(); hideCard(); S.ageBand = 'kid'; save(); toast('No problem. Your island will celebrate the day you started instead. You can add it later from your Bag.'); done && done(); };
  };
  draw();
}
const balloons = new THREE.Group(); balloons.visible = false; scene.add(balloons);
[[-5.6,-1.6],[-2.4,-1.6],[-5.6,-4.4],[-2.4,-4.4],[-4,-1.2],[-1.2,-2.4]].forEach(([x,z], i) => {
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
  showCard(`<div class="kicker">${S.birthday ? 'HAPPY BIRTHDAY' : 'HAPPY ISLAND DAY'}</div><h2>${S.birthday ? `Happy birthday, ${S.name || 'friend'}!` : `Happy Island Day, ${S.name || 'friend'}!`}</h2>
    <p>${S.birthday ? 'The whole sky came to celebrate you.' : 'One more year on your island. The whole sky came to celebrate.'} Year ${yr} begins today!</p>
    <h4>Presents</h4><div class="jlist">
      ${giftsFrom.length ? `<button>${coins} coins from ${giftsFrom.join(', ')}</button>` : `<button>${coins} coins from the sky</button>`}
      <button>A Birthday Cake for your hut</button><button>A party hat (Bag, then Change my look)</button></div>
    <h4>Your year ${yr - 1} in review</h4><div class="jlist"><button>${review.aha} memories brought back</button><button>${review.found} new things found</button><button>${review.built} buildings rebuilt</button></div>`, 'Thank you!');
}
function openJournal() {
  const cats = collectionCats(), tot = cats.reduce((a, c) => a + c.ids.length, 0), got = cats.reduce((a, c) => a + c.ids.filter(c.has).length, 0);
  showCard(`<div class="kicker">COLLECTIONS: YEAR ${islandYear()} ON YOUR ISLAND</div><h2>${got} of ${tot} found</h2><p>Everything you have discovered in the sky. Tap a group to see what you have and what is still out there.</p>
    <div style="height:10px;border-radius:99px;background:#eadfd0;margin-top:10px;overflow:hidden"><div style="height:100%;width:${Math.round(got/tot*100)}%;background:#ffc857"></div></div>
    <button id="friendsBtn" class="ghost" style="margin-top:10px">Friends</button> ${featureOn('journey') ? '<button id="storyBtn" class="ghost" style="margin-top:10px">Your story</button>' : ''}
    <div class="jlist">${cats.map(c => { const n = c.ids.filter(c.has).length; return `<button data-cat="${c.name}">${n === c.ids.length ? '✓ ' : ''}${c.name} <span class="sub">${n} of ${c.ids.length}</span></button>`; }).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => openCategory(b.dataset.cat));
  if ($('storyBtn')) $('storyBtn').onclick = openStory;
  $('friendsBtn').onclick = openFriends;
}
function openJournalOld() {
  const items = AHA_ORDER.map(id => S.aha.includes(id) ? `<button data-id="${id}">${AHA[id].title}${S.used.includes(id) ? ' <span class="sub">★ used again</span>' : ''}</button>` : `<button class="locked">??? Not found yet</button>`).join('');
  showCard(`<div class="kicker">MEMORY JOURNAL</div><h2>${S.aha.length} of ${AHA_ORDER.length} memories</h2><p>Everything you have brought back to the sky.</p><div class="jlist">${S.built.includes('observatory') ? `<button id="starList">Star Chart <span class="sub">${S.charted.length} of ${CONSTELLATIONS.length} charted</span></button>` : ''}${items}</div>`, 'Close');
  if ($('starList')) $('starList').onclick = openStarList;
  const extra = [
    S.built.includes('bakery') && [`Recipes <span class="sub">${S.cooked.length} of ${RECIPES.length}</span>`, () => collectionList('Recipes', "MABEL'S KITCHEN", RECIPES, S.cooked, r => showCard(lessonHtml(r.aha), 'Back', openJournal))],
    S.built.includes('library') && [`Library books <span class="sub">${S.read.length} of ${BOOKS.length}</span>`, () => collectionList('Library books', 'THE LIBRARY', BOOKS, S.read, bk => showCard(lessonHtml({ kicker:'THE LIBRARY', ...bk }), 'Back', openJournal))],
    S.built.includes('musichall') && [`Songs <span class="sub">${S.songs.length + (S.penta ? 1 : 0)} of ${SONGS.length + 1}</span>`, () => collectionList('Songs', "ALLEGRA'S SONGBOOK", [...SONGS, { id:'penta', name:'The Five-Note Scale', aha:PENTA_AHA }], [...S.songs, ...(S.penta ? ['penta'] : [])], so => showCard(lessonHtml(so.aha), 'Back', openJournal))],
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
async function openMoveGame(back) {
  const code = await makeCode();
  const ago = cloudState.when ? Math.max(1, Math.round((Date.now() - cloudState.when) / 60000)) : 0;
  const status = cloudState.ok === false ? 'Cloud backup could not connect. It will keep trying while you play.' : cloudState.when ? `Backed up to the cloud ${ago} minute${ago === 1 ? '' : 's'} ago.` : 'Your garden backs up to the cloud automatically while you play.';
  showCard(`<div class="kicker">SYNC MY GAME</div><h2>Play on any device</h2>
    <p>${status}</p>
    <h4>Your sync key</h4>
    <p style="font:700 20px monospace;letter-spacing:.05em;margin-top:4px;word-break:break-all" id="myKey">${prettyKey(S.syncKey)}</p>
    <button id="copyKey">Copy sync key</button>
    <p style="margin-top:8px">On another phone or computer, open Sky Garden, tap <b>Sync my game</b>, and enter this key. After that, both devices stay in sync. Keep your key private: anyone who has it can load your garden.</p>
    <h4>Have a sync key from another device?</h4>
    <input id="theirKey" placeholder="Type or paste a sync key" autocomplete="off" style="width:100%;margin-top:8px;font:16px monospace;border-radius:12px;border:2px solid #eadfd0;padding:10px">
    <button id="loadKey">Load from cloud</button>
    <p id="keyMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>
    <p style="font-size:13px;opacity:.7;margin-top:6px">So we can make the game better, the makers can see anonymous progress from cloud backups, like which chapter a player has reached. No names or emails are collected.</p>
    <h4>Graphics</h4><p>${lowGfx ? 'Low graphics is on. It runs smoother on older phones.' : 'Full graphics are on.'}</p>
    <button id="gfxBtn" class="ghost">${lowGfx ? 'Switch to full graphics' : 'Switch to low graphics'}</button>
    <h4 style="margin-top:22px">No internet? Use a save code instead</h4>
    <h4>Step 1: On this device</h4><p>Tap Copy code. Then send it to yourself, like in a text or email.</p>
    <textarea id="myCode" readonly rows="3" style="width:100%;margin-top:8px;font:12px monospace;border-radius:12px;border:2px solid #eadfd0;padding:8px">${code}</textarea>
    <button id="copyCode">Copy code</button>
    <h4>Step 2: On the other device</h4><p>Open Sky Garden, tap Move my game, paste the code here, and tap Load.</p>
    <textarea id="theirCode" rows="3" placeholder="Paste a save code here" style="width:100%;margin-top:8px;font:12px monospace;border-radius:12px;border:2px solid #eadfd0;padding:8px"></textarea>
    <button id="loadCode">Load</button>
    <p id="codeMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>`, back ? 'Back' : 'Close', back);
  $('gfxBtn').onclick = () => { setLowGfx(!lowGfx); openMoveGame(back); };
  $('copyKey').onclick = async () => {
    try { await navigator.clipboard.writeText(prettyKey(S.syncKey)); $('keyMsg').textContent = 'Sync key copied. Keep it somewhere safe.'; }
    catch { const r = document.createRange(); r.selectNodeContents($('myKey')); getSelection().removeAllRanges(); getSelection().addRange(r); $('keyMsg').textContent = 'The key is selected. Copy it with your device\'s copy command.'; }
  };
  $('loadKey').onclick = async () => {
    const key = cleanKey($('theirKey').value);
    if (key.length !== 24) { $('keyMsg').textContent = 'A sync key has 24 letters and numbers. Check that you typed all of it.'; return; }
    if (key === S.syncKey) { $('keyMsg').textContent = 'That is this device\'s own key. Enter it on your other device.'; return; }
    $('keyMsg').textContent = 'Checking the cloud...';
    let found; try { found = await cloudLoad(key); } catch { $('keyMsg').textContent = 'Could not reach the cloud. Check your internet and try again.'; return; }
    if (!found) { $('keyMsg').textContent = 'No garden was found for that key. Check each letter and try again.'; return; }
    const d = found.save;
    $('keyMsg').innerHTML = `Found it: ${d.coins} coins, ${(d.aha||[]).length} ${(d.aha||[]).length === 1 ? 'memory' : 'memories'}. This replaces the game on this device, and from now on both devices share one garden. <button id="sureKey" style="margin-top:8px">Yes, use this garden</button>`;
    $('sureKey').onclick = () => { d.syncKey = key; d.savedAt = found.updated; try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch {} location.reload(); };
  };
  $('copyCode').onclick = async () => {
    try { await navigator.clipboard.writeText(code); $('codeMsg').textContent = 'Copied! Now send it to yourself.'; }
    catch { $('myCode').select(); $('codeMsg').textContent = 'The code is selected. Copy it with your device\'s copy command.'; }
  };
  $('loadCode').onclick = async () => {
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
    CRAFTS.forEach(c => { if (c.needs[k]) uses.push(c.name); });
    if (k === 'clay') uses.push('bricks and pots in the kiln'); if (k === 'log') uses.push('kiln fuel');
    if (k === 'copper' || k === 'tin') uses.push('bronze in the furnace'); if (k === 'brick' || k === 'stone' || k === 'log') uses.push('building pieces');
    return uses.length ? `Used for: ${[...new Set(uses)].join(', ')}.` : 'Used for building.';
  }
  if (it.kind === 'specialty') return k === S.specialty ? `Your island's specialty. It sells for ${HOME_PRICE} here, but ${HOME_PRICE * AWAY_MULT} on a friend's island. Gift it to friends and ask for theirs.` : `From another island. It sells for ${HOME_PRICE * AWAY_MULT} here, because it does not grow on your island.`;
  if (it.kind === 'heirloom') { const c = codeOfHeirloom(k); return c === myCode ? 'Your own heirloom flower. It only grows on your island. Give one to a friend so they have one too.' : `A one-of-a-kind flower from island ${c}. It only grows there.`; }
  RECIPES.forEach(r => { if (r.needs[k]) uses.push(r.name); });
  return `Sells for ${it.sell} each.${uses.length ? ` Cook into: ${uses.join(', ')}.` : ''}`;
}
function openBag() {
  const GROUPS = [['bug','Bugs'],['specialty','Specialties'],['heirloom','Heirlooms'],['crop','Crops'],['fruit','Fruit'],['fish','Fish'],['dish','Dishes'],['material','Materials'],['quest','Special']];
  const tile = (k, n, name, sub) => `<button class="itile" data-it="${k}" title="${name}"><span class="ic">${icon(k, ITEMS[k]?.kind)}</span><b>${n}</b><small>${name}</small></button>`;
  const goods = GROUPS.map(([kind, label]) => { const list = Object.entries(S.bag).filter(([k,n]) => n > 0 && ITEMS[k] && ITEMS[k].kind === kind);
    return list.length ? `<h4>${label}</h4><div class="igrid">${list.map(([k,n]) => tile(k, n, ITEMS[k].name)).join('')}</div>` : ''; }).join('');
  const furn = Object.entries(S.furn).filter(([,n]) => n > 0).map(([k,n]) => `<button class="itile" data-fu="${k}"><span class="ic">${icon(k)}</span><b>${n}</b><small>${FURN[k].name}</small></button>`).join('');
  showCard(`<div class="kicker">YOUR BAG</div><h2>Your stuff</h2>${spaceMeter(slotsIn(S.bag), packCap(), "Backpack")}
    ${goods || '<p>Nothing yet. Pick crops, fruit, or fish.</p>'}
    ${(S.products || []).length ? `<h4>Products</h4><div class="igrid">${S.products.map((p, i) => `<button class="itile" data-pr="${i}">${productSwatch(p, 34)}<small>${productName(p)}</small></button>`).join('')}</div>` : ''}
    <h4>Furniture</h4>${furn ? `<div class="igrid">${furn}</div>` : '<p>None yet. Pip sells furniture.</p>'}
    <p id="itInfo" class="itinfo">Tap an item to see what it is for.</p>
    <h4>Tip</h4><p>Sell crops, fruit, and fish in the crate by your garden. Place furniture inside your hut.</p>
    <button id="lookBtn" class="ghost">Change my look</button> ${featureOn('switchIsle') ? `<button id="modeBtn" class="ghost">Island: ${S.mode ? MODES.find(m => m.id === S.mode).name : 'Classic'}</button>` : ''} <button id="bdBtn" class="ghost">${S.birthday ? `Birthday: ${MONTH_LONG[S.birthday.m-1]} ${S.birthday.d}` : 'Add my birthday'}</button> <button id="moveBtn" class="ghost">Sync my game to another device</button>`, 'Close');
  document.querySelectorAll('[data-it]').forEach(b => b.onclick = () => { const k = b.dataset.it; $('itInfo').innerHTML = `<b>${icon(k, ITEMS[k].kind)} ${ITEMS[k].name}</b>. ${itemUse(k)}`; });
  document.querySelectorAll('[data-fu]').forEach(b => b.onclick = () => { const k = b.dataset.fu, p = S.placed.filter(x => x === k).length; $('itInfo').innerHTML = `<b>${icon(k)} ${FURN[k].name}</b>. ${p ? `${p} in your hut.` : 'Not placed yet. Place it inside your hut.'}`; });
  document.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => openProduct(S.products[+b.dataset.pr], openBag));
  $('lookBtn').onclick = () => openLookEditor(openBag);
  if ($('modeBtn')) $('modeBtn').onclick = () => { setupCam = true; $('veil').classList.add('setup'); document.body.classList.add('in-setup'); modePicker(() => { endSetup(); openBag(); }, { switching:true }); };
  $('bdBtn').onclick = () => birthdayPicker(openBag);
  $('moveBtn').onclick = () => openMoveGame(openBag);
}
$('journalBtn').onclick = openJournal;
$('bagBtn').onclick = openBag;
$('buildBtn').onclick = () => setBuildMode(!buildMode);
// --- daily goals: three small tasks each morning ---
const GOAL_TYPES = {
  water: n => `Water ${n} plants`, pick: n => `Pick ${n} crops`, sell: n => `Sell ${n} coins of stuff`,
  talk: n => `Talk to ${n} neighbors`, gift: () => 'Give someone a gift', fish: n => `Catch ${n} fish`, fruit: n => `Pick ${n} fruits`,
};
function ensureGoals() {
  if (S.goals && S.goals.day === S.day) return;
  const pool = [['pick',3],['sell',100],['talk',2],['gift',1]];
  if (!S.sprinklers) pool.push(['water',3]);
  if (S.bridge) pool.push(['fish',2]);
  if (S.bridge && season() !== 3) pool.push(['fruit',2]);
  const list = []; while (list.length < 3) { const g = pool.splice(Math.floor(Math.random()*pool.length), 1)[0]; list.push({ t:g[0], need:g[1], have:0 }); }
  S.goals = { day:S.day, list, bonus:false };
}
function goal(t, n=1) {
  lean({ water:'grower', pick:'grower', sell:'trader', talk:'friend', gift:'friend', fish:'explorer', fruit:'explorer' }[t], t === 'sell' ? 1 : n);
  if (!featureOn('goals')) return;
  ensureGoals();
  const g = S.goals.list.find(x => x.t === t && x.have < x.need); if (!g) return;
  g.have = Math.min(g.need, g.have + n);
  if (g.have >= g.need) { S.coins += 20; setTimeout(() => { toast(`Goal done: ${GOAL_TYPES[t](g.need)}! +20 coins`); sfx('coin'); }, 700); }
  if (!S.goals.bonus && S.goals.list.every(x => x.have >= x.need)) { S.goals.bonus = true; S.coins += 30; setTimeout(() => { toast('All 3 goals done today! +30 bonus coins'); sfx('heart'); }, 2400); }
  drawHud(); save();
}
function communityGoal() {
  const d = today(), m = d.getMonth(), ym = `${d.getFullYear()}-${String(m+1).padStart(2,'0')}`;
  const [type, title, verb, target] = [['harvest','The Great Harvest','Pick crops',500], ['fishing','The Big Catch','Catch fish',200], ['fruit','Orchard Days','Pick fruit',300]][m % 3];
  return { id:`${ym}-${type}`, type, title, text:`${verb} together this month. Every one that anyone picks or catches counts.`, target, reward:150 };
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
    <p style="margin-top:4px"><b>${Math.min(count, cg.target)} of ${cg.target}</b> together. You helped with ${mineN}.</p>`}
    ${done && mineN > 0 && !claimed ? `<button id="claimCg">Claim your reward: ${cg.reward} coins</button>` : done ? `<p style="font-weight:700">${claimed ? 'Reward claimed. Thank you for helping!' : 'Goal reached! Help next month to earn the reward.'}</p>` : ''}`;
}
function wireClaim() { const b = $('claimCg'); if (!b) return; b.onclick = () => { const cg = communityGoal(); S.claimed = S.claimed || {}; S.claimed[cg.id] = true; S.coins += cg.reward; save(); drawHud(); sfx('coin'); b.outerHTML = '<p style="font-weight:700">Reward claimed. Thank you for helping!</p>'; }; }
async function openMailbox() {
  S.mailNew = false; save(); sfx('click');
  const code = await friendCodeOf(S.syncKey), friends = S.friends || [], log = S.mailLog || [];
  showCard(`<div class="kicker">MAILBOX</div><h2>Friends</h2>
    <h4>Your friend code</h4><p style="font:700 26px monospace;letter-spacing:.12em" id="myFc">${code}</p>
    <button id="copyFc" class="ghost">Copy code</button>
    <p style="margin-top:6px">Friends type this code in their mailbox to visit your island. They can water your garden and leave you a gift once a day.</p>
    <h4>Visit a friend</h4>
    <input id="fcIn" maxlength="6" placeholder="Their 6-character code" autocomplete="off" style="width:100%;margin-top:6px;font:18px monospace;text-transform:uppercase;border-radius:12px;border:2px solid #eadfd0;padding:8px">
    <button id="fcGo">Visit</button>
    ${friends.length ? `<div class="jlist">${friends.map(f => `<button data-fc="${f.code}">Visit ${f.name} <span class="sub">${f.code}</span></button>`).join('')}</div>` : ''}
    <p id="fcMsg" style="margin-top:8px;font-weight:700;min-height:20px"></p>
    ${log.length ? `<h4>Recent mail</h4><div class="jlist">${log.slice(-6).reverse().map(l => `<button>${l}</button>`).join('')}</div>` : ''}
    <div id="cgBox"><p style="margin-top:12px">Loading the community goal...</p></div>`, 'Close');
  $('copyFc').onclick = async () => { try { await navigator.clipboard.writeText(code); $('fcMsg').textContent = 'Copied! Send it to a friend.'; } catch { $('fcMsg').textContent = `Your code is ${code}.`; } };
  const go = async c => { c = (c || '').toUpperCase().trim();
    if (!/^[A-F0-9]{6}$/.test(c)) { $('fcMsg').textContent = 'A friend code has 6 characters, using the numbers 0 to 9 and the letters A to F.'; return; }
    if (c === code) { $('fcMsg').textContent = 'That is your own code. Share it with a friend!'; return; }
    $('fcMsg').textContent = 'Looking for their island...';
    try { const r = await fetch(`${CLOUD}/visit?code=${c}`); if (!r.ok) throw 0; const isl = (await r.json()).island;
      S.friends = [{ code:c, name:isl.name }, ...(S.friends || []).filter(f => f.code !== c)].slice(0, 8); save(); cloudPush(true);
      $('fcMsg').textContent = `Flying to ${isl.name}'s island...`; setTimeout(() => location.href = `${location.pathname}?visit=${c}`, 600);
    } catch { $('fcMsg').textContent = 'No island found with that code. Check it and try again. Your friend needs to have played online at least once.'; } };
  $('fcGo').onclick = () => go($('fcIn').value);
  document.querySelectorAll('[data-fc]').forEach(b => b.onclick = () => go(b.dataset.fc));
  $('cgBox').innerHTML = await communityHtml(); wireClaim();
}
async function checkInbox() {
  if (devOn() || VISIT) return;
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
  showCard(`<div class="kicker">WHILE YOU WERE AWAY</div><h2>You had visitors!</h2><div class="jlist">${lines.map(l => `<button>${l}</button>`).join('')}</div><p style="margin-top:8px">Gifts are in your Bag. Visit them back from your mailbox!</p>`, 'Yay!');
}
function openGoals() {
  ensureGoals();
  setTimeout(async () => { const box = $('goalCg'); if (box) { box.innerHTML = await communityHtml(); wireClaim(); } }, 0);
  showCard(`<div class="kicker">TODAY</div><h2>Little goals</h2><p>Each one pays 20 coins. Finish all 3 for 30 more. New goals every morning.</p>
    <div class="jlist">${S.goals.list.map(g => `<button>${g.have >= g.need ? '✓ ' : ''}${GOAL_TYPES[g.t](g.need)} <span class="sub">${g.t === 'sell' ? `${g.have} of ${g.need} coins` : `${g.have} of ${g.need}`}</span></button>`).join('')}</div><div id="goalCg"><p style="margin-top:12px">Loading the community goal...</p></div>`, 'Close');
}
$('goalsBtn').onclick = openGoals;
function applyPaint() { roof.material.color.set(+S.roof); house.userData.awning.material.color.set(+S.roof); house.children[0].material.color.set(+S.wall); }
document.addEventListener('click', e => { if (e.target.closest('button,.slot') && e.target.id !== 'mute') sfx('click'); });
// S.tut: 1 Nana walks over, 2 dig the first spot, 3 plant, 4 water, 5 pick, 6 sell, 9 done
const TUT = {
  2: { text:'Tap the sparkly spot 3 times to dig it up.', help:'Nana showed you a gold sparkle right next to your garden. Walk to it and tap it 3 times. Each tap digs a little deeper.' },
  3: { text:'Tap the garden square to dig the soil, then tap it again to plant.', help:'Your garden is the patch of squares near your hut. The gold arrow points at one. Tap it once to dig the soil, then tap it again to plant one of the seeds Nana gave you.' },
  4: { text:'Tap the planted square to water it.', help:'Seeds need water. Tap the square with your new sprout to water it.' },
  5: { text:'Your first crop is ripe! Tap it to pick it.', help:'Grandma\'s soil grew your first plant right away. Tap it to pick it. Usually crops take a few days.' },
  6: { text:'Sell your crop. Tap the wooden crate.', help:'The wooden crate next to your garden buys anything you grow, catch, or pick. Tap it to sell your crop for coins.' },
};
function tutActive() { return S.tut >= 2 && S.tut <= 6; }
function startTutorial() { S.tut = 1; save(); nanaWalk = { to: player.position.clone().add(new THREE.Vector3(-1.3, 0, -1.1)), back:false }; }
let nanaWalk = null;
const NANA_HOME = new THREE.Vector3(-1, 0, -5.2), FIRST_DIG = [.3, -2.9];
function tutAfterGreeting() {
  S.tut = 2; S.digs = [{ p:[...FIRST_DIG], n:0 }]; drawDigs(); save(); drawHud();
}
function tutAfterFirstMemory() {
  const c = Object.keys(CROPS).find(k => CROPS[k].seasons.includes(season()) && !CROPS[k].locked);
  S.tut = 3; S.tiles[0] = { s:0 }; S.seeds[c] = (S.seeds[c] || 0) + 2; S.sel = c; drawTile(0); save(); drawHud();
  openDialog('Nana Gale', "You found your first memory! Your grandmother would be proud. Now, you'll need coins to rebuild the sky. Let me show you her garden. Here are 2 seeds that grow this season. Tap the square the arrow points at.", [], S.hearts.nana);
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
  S.tut = 9; save(); drawHud();
  setTimeout(() => {
    openDialog('Nana Gale', (S.home || 0) < 3 ? "Your first coins! Now, the important part. You need a roof over your head, and no, the sky is not a roof, whatever Pip tells you. See the sticks and stones lying about? Gather some and make yourself a stone axe at that old tree stump." : "Your first coins! That is how it works up here: grow things, sell them, and use the coins to rebuild. Now, there are more memories buried out there. New sparkles appear every morning. Off you go, dear!", [], S.hearts.nana);
    spawnDigs(); nanaWalk = { to: NANA_HOME.clone(), back:true };
    const fb = $('fbBtn'); fb.classList.add('pulse'); setTimeout(() => fb.classList.remove('pulse'), 4000);
    setTimeout(() => toast('Tell us what you think anytime with the pink Feedback button.'), 5500);
  }, 900);
}
function questTarget() {
  if (VISIT) return ownerNpc;
  if (S.tut === 1) return null;
  if (S.tut >= 9 && (S.home || 0) < 3) return homeStep().target;
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
function currentHowto() {
  if (TUT[S.tut]) return TUT[S.tut].help;
  if (S.tut >= 9 && (S.home || 0) < 3) return 'Grandma\'s hut blew away, so you are building a new one. First pick up sticks, stones, and grass that lie around the island. Craft a stone axe and a stone pickaxe at the tree stump. Then chop trees for logs, break rocks for stone, and cut bushes for grass fiber. Tap your home site to build the frame, the walls, and the roof. Until then, you sleep by the campfire.';
  if (S.quest < 5) return HOWTO.c1[S.quest];
  if (S.q2 < 5) return HOWTO.c2[S.q2];
  if (S.q3 < 7) return HOWTO.c3[S.bridge2 && S.q3 === 0 ? 1 : S.q3];
  if (S.q4 < 5) return HOWTO.c4[S.q4];
  return HOWTO.c5[S.q5];
}
$('quest').onclick = () => { if (VISIT) return goHome(); sfx('click'); showCard(`<div class="kicker">WHAT TO DO</div><h2>${$('quest').querySelector('.qt').textContent}</h2><p>${currentHowto()}</p><h4>Tip</h4><p>A gold arrow floats over the next thing to tap.</p>`, 'Got it'); };
function drawQuest() {
  if (!VISIT && S.tut >= 9 && (S.home || 0) < 3) { $('quest').innerHTML = `<i>Tap for help</i><b>BUILD YOUR HOME</b><span class="qt">${homeStep().text}</span>`; return; }
  if (VISIT) { $('quest').innerHTML = `<i>Tap to go home</i><b>VISITING ${VISIT.name.toUpperCase()}'S ISLAND</b><span class="qt">Say hi, water their garden, or leave a gift.</span>`; return; }
  if (S.tut === 1 || tutActive()) { $('quest').innerHTML = `<i>Tap for help</i><b>GETTING STARTED</b><span class="qt">${S.tut === 1 ? 'Nana Gale is coming to say hello.' : TUT[S.tut].text}</span>`; return; }
  if (S.quest < 5) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 1: THE WIND BELL</b><span class="qt">${QUEST1[S.quest]}${S.quest === 1 ? ` (${S.relics} of 3 found)` : ''}</span>`;
  else if (S.q2 < 5) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 2: THE CLOUD SHIP</b><span class="qt">${QUEST2[S.q2]}</span>`;
  else if (S.q3 < 7) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 3: THE WINDMILL</b><span class="qt">${QUEST3[S.bridge2 && S.q3 === 0 ? 1 : S.q3]}</span>`;
  else if (S.q4 < 5) $('quest').innerHTML = `<i>Tap for help</i><b>CHAPTER 4: THE PAINTER OF LIGHT</b><span class="qt">${QUEST4[S.q4]}</span>`;
  else $('quest').innerHTML = `<i>Tap for help</i><b>${S.q5 < 6 ? 'CHAPTER 5: THE OLD HEART' : 'REBUILD THE VILLAGE'}</b><span class="qt">${S.q5 < 6 ? QUEST5[S.q5] : (S.built.length < BUILDINGS.length ? `${S.built.length} of ${BUILDINGS.length} buildings. Tap a building site at the Old Heart.` : 'The village is rebuilt! Visit your neighbors, cook, read, play, and chart the stars.')}</span>`;
}

// ============ ACTIONS ============
function useTile(i) {
  const t = S.tiles[i], pos = tileGroups[i].position;
  if (t.s === 0) { t.s = 1; sfx('till'); burst(pos, 0xb98a63, 8); toast('Tilled! Now tap it to plant.'); }
  else if (t.s === 1) {
    const c = CROPS[S.sel];
    if (!c.seasons.includes(season())) { toast(`${c.name} only grows in ${c.seasons.map(s => SEASONS[s]).join(' and ')}.`); return; }
    if (S.seeds[S.sel] <= 0) { toast(`No ${c.name} seeds. Buy some from Pip.`); return; }
    S.seeds[S.sel]--; Object.assign(t, { s:2, c:S.sel, d:0 }); sfx('plant'); toast(`Planted ${c.name}. Tap to water.`);
  } else {
    const c = CROPS[t.c];
    if (t.d >= c.days && !canCarry(t.c)) return bagFull();
    if (t.d >= c.days) { bagAdd(t.c); goal('pick'); communityAdd('harvest'); if (S.mode === 'garden' && Math.random() < .2) { bagAdd(t.c); setTimeout(() => toast(`Bonus crop! You got an extra ${c.name}.`), 900); } S.tiles[i] = { s:1, w:t.w }; sfx('pick'); burst(pos, c.color); toast(`Picked a ${c.name}! Sell it in the crate or give it as a gift.`); }
    else if (!t.w) { t.w = true; goal('water'); sfx('water'); burst(pos, 0x9fd3ff, 8); toast(`Watered. ${c.days - t.d} more day${c.days - t.d>1?'s':''}.`); }
    else toast('Already watered today. Sleep to let it grow.');
  }
  drawTile(i); drawHud(); save(); tutTile(i);
}
// what one item sells for at your crate: a specialty from another island is worth 5 times more here
const sellPrice = k => ((S.perks || []).includes('marketRep') ? 1.1 : 1) * ITEMS[k].sell * (S.mode === 'fisher' && ITEMS[k].kind === 'fish' ? 1.25 : 1) * (ITEMS[k].kind === 'specialty' && k !== S.specialty ? AWAY_MULT : 1);
function useCrate() {
  let total = 0;
  for (const k in S.bag) { if (ITEMS[k].kind === 'quest' || ITEMS[k].kind === 'material') continue; total += Math.round(S.bag[k] * sellPrice(k)); delete S.bag[k]; }
  if (!total) { toast('Nothing to sell yet. Pick crops, fruit, or fish first.'); return; }
  S.coins += total; sfx('coin'); burst(crate.position, 0xffc857); toast(`Sold for ${total} coins!`); goal('sell', total); drawHud(); save(); tutSold();
}

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
  if (id === 'pip') {
    b.push({ label:'Buy seeds', fn:seedShop }, { label:'Furniture', fn:furnShop });
    const o = pipOrder();
    if (o && S.bag[o.crop]) b.push({ label:`Give order: ${CROPS[o.crop].name} (+${o.pay})`, fn:() => {
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
  const s = season(), o = pipOrder();
  const btns = Object.entries(CROPS).filter(([,c]) => c.seasons.includes(s) && (!c.locked || S.q4 >= 5)).map(([k,c]) => ({ label:`${c.name} seed, ${c.seed}`, fn:() => {
    if (S.coins < c.seed) { toast('Not enough coins.'); return; }
    S.coins -= c.seed; S.seeds[k]++; S.sel = k; sfx('coin'); toast(`Bought 1 ${c.name} seed. You have ${S.seeds[k]}.`); drawHud(); save();
  }}));
  if (S.stations.furnace) btns.push({ label:'Tin, 15', fn:() => { if (S.coins < 15) { toast('Not enough coins.'); return; } S.coins -= 15; bagAdd('tin'); sfx('coin'); save(); drawHud(); toast('Pip: Imported! From very far away. Do not ask how far. I do not know.'); } });
  openDialog('Pip', `${SEASONS[s]} seeds! ${o ? `Today I am hungry for a ${CROPS[o.crop].name}. Bring me one and I pay double: ${o.pay} coins.` : 'Thanks for today\'s order!'}`, btns, S.hearts.pip);
}
function furnShop() {
  closeDialog();
  const list = Object.entries(FURN).filter(([,f]) => !f.gift).map(([k,f]) => `<button data-f="${k}">${f.name} <span class="sub">${f.price} coins${S.furn[k] ? `, you have ${S.furn[k]}` : ''}. Goes in a ${CAT_INFO[FURN_CAT[k]].label.toLowerCase()} spot.</span></button>`).join('');
  const swatch = (kind, map) => Object.entries(map).map(([hx, name]) => { const own = S.paints.includes(hx), on = S[kind] === hx;
    return `<button data-paint="${kind}:${hx}"><span class="dot" style="display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin-right:6px;background:#${hx.slice(2)}"></span>${name} <span class="sub">${on ? 'on your hut now' : own ? 'owned, tap to use' : PAINT_PRICE + ' coins'}</span></button>`; }).join('');
  showCard(`<div class="kicker">PIP'S FURNITURE</div><h2>Make your hut cozy</h2><p>You have ${S.coins} coins. Place furniture inside your hut.</p><div class="jlist">${list}</div>
    <h4>Roof paint</h4><div class="jlist">${swatch('roof', ROOFS)}</div><h4>Wall paint</h4><div class="jlist">${swatch('wall', WALLS)}</div>`, 'Done');
  document.querySelectorAll('[data-paint]').forEach(b => b.onclick = () => {
    const [kind, hx] = b.dataset.paint.split(':');
    if (!S.paints.includes(hx)) { if (S.coins < PAINT_PRICE) { toast('Not enough coins.'); return; } S.coins -= PAINT_PRICE; S.paints.push(hx); sfx('coin'); }
    S[kind] = hx; applyPaint(); burst(house.position, +hx, 16); save(); drawHud(); toast('Fresh paint on your hut!'); furnShop();
  });
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
    const k = b.dataset.f, f = FURN[k];
    if (S.coins < f.price) { toast('Not enough coins.'); return; }
    S.coins -= f.price; S.furn[k] = (S.furn[k]||0) + 1; sfx('coin'); save(); drawHud(); toast(`Bought a ${f.name}! Place it in your hut.`); furnShop();
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
    if (dh > 0 && featureOn('journey')) karma('kind', dh > 1 ? 1 : 0);
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
        ${known.length ? ['Loves','Likes','Okay with','Dislikes','Hates'].map((l, t) => row(t) ? `<div class="tr"><small>${l}</small> ${row(t)}</div>` : '').join('') : '<div class="tr"><small>No gifts yet.</small></div>'}</div>`; }).join('')}
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
const CAMP_SPOTS = [[6.2,-1.2],[-6.5,-1.8],[1.5,-6.5],[-4.5,6],[5.8,3.2],[-.5,6.4],[6.6,-5.4]];
function freeSpot(list) { return list.find(([x,z]) => !blockedAt(x, z) && !(S.builds || []).some(b => Math.hypot(b.x - x, b.z - z) < 1.6) && !Object.values(S.people || {}).some(p => p.spot && Math.hypot(p.spot[0] - x, p.spot[1] - z) < 2)); }
function homeSpots() { return [...ownedLobes().flatMap(L => [[L.e.x + 1.2, L.e.z - 1], [L.e.x - 1.4, L.e.z + 1.2]]), [-6.5,-1.8],[1.5,-6.5],[-4.5,6],[5.8,3.2]]; }
function tent(color) { const g = new THREE.Group(); const t = mesh(new THREE.ConeGeometry(.9, 1.3, 4), mat(color), 0, .65, 0); t.rotation.y = Math.PI/4; g.add(t);
  g.add(mesh(new THREE.BoxGeometry(.35, .6, .05), mat(0x3b2f4a), 0, .3, .5)); g.add(mesh(new THREE.CylinderGeometry(.03,.03,1.6,5), mat(0x9b6b4a), 0, .8, 0)); return g; }
function cottage(color) { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(1.5, 1, 1.3), mat(0xfff1d6), 0, .5, 0));
  const roof = mesh(new THREE.ConeGeometry(1.25, .8, 4), mat(color), 0, 1.4, 0); roof.rotation.y = Math.PI/4; g.add(roof);
  g.add(mesh(new THREE.BoxGeometry(.35, .55, .05), mat(0x9b6b4a), 0, .28, .66)); g.add(mesh(new THREE.BoxGeometry(.3, .3, .05), mat(0x9fd3ff), .45, .6, .66)); return g; }
function drawPeople() {
  peopleGroup.children.slice().forEach(c => peopleGroup.remove(c));
  if (VISIT || !featureOn('villagers')) return;
  Object.values(S.people || {}).filter(p => p.status === 'visiting' || p.status === 'resident').forEach(p => {
    if (!p.spot) { const sp = freeSpot(p.status === 'resident' ? homeSpots() : CAMP_SPOTS); if (!sp) return; p.spot = sp; save(); }
    const [x, z] = p.spot, home = p.status === 'resident' ? cottage(p.look.outfit.color) : tent(p.look.outfit.color);
    home.position.set(x, 0, z - .9); peopleGroup.add(home);
    const c = critter(p.look); c.scale.setScalar(.85); c.position.set(x + .9, 0, z + .1); c.rotation.y = -.4; c.userData.kind = 'visitor'; c.userData.vid = p.vid; peopleGroup.add(c);
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
  if (p.request && !p.request.done) { const r = p.request; b.push({ label:have(r.k) >= r.n ? `Give ${r.n} ${plural(r.k, r.n)}` : `Their favor: ${r.n} ${plural(r.k, r.n)}`, fn:() => {
    if (have(r.k) < r.n) { toast(`Bring ${r.n} ${plural(r.k, r.n)}. You have ${have(r.k)}.`); return; }
    bagAdd(r.k, -r.n); r.done = true; const pay = Math.round(ITEMS[r.k].sell * r.n * 1.6) + 20; S.coins += pay; p.hearts = Math.min(10, p.hearts + 1); if (featureOn('journey')) karma('kind', 1); lean('friend');
    save(); drawHud(); sfx('coin'); closeDialog(); openDialog(p.name, `You found them! Thank you so much. Here, ${pay} coins.`, [], p.hearts); } }); }
  if (p.status === 'visiting' && p.hearts >= 3 && Object.values(S.people).filter(x => x.status === 'resident').length < 3 && (S.home || 0) >= 3)
    b.push({ label:'Invite them to stay', fn:() => { closeDialog(); invitePerson(vid); } });
  const extra = p.request && !p.request.done ? ' ' + pick(REQUEST_LINES).replace('{item}', plural(p.request.k, p.request.n)).replace('{n}', p.request.n) : '';
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
  if (!visiting && Math.random() < .4) { const p = newPerson(); S.people[p.vid] = p; notes.push(`A traveler named ${p.name} is camping on your island! Go say hi.`); }
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
    openDialog('Nana Gale', "Come sit with me, dear. I am weaving. See my pattern card? Each row is holes and no holes. Hole, hole, blank. Hole, hole, blank. Hole, hole... what comes next?", [
      { label:'A hole', fn:() => openDialog('Nana Gale', "Hmm, look again. It repeats in threes.", [{ label:'Try again', fn:SCENES.nana3 }]) },
      { label:'A blank', fn:() => { closeDialog(); showAha('loom', () => openDialog('Nana Gale', "Your grandmother used to say a pattern is just a promise you keep. Now you know how to keep this one.", [], S.hearts.nana)); } },
    ], S.hearts.nana);
  },
  nana6() {
    S.furn.rocker = (S.furn.rocker||0) + 1; sfx('heart'); save();
    openDialog('Nana Gale', "Your grandmother and I found this island when it was just a rock with one tree. She said memory is a kind of farming: you plant what you know, and it grows in someone else. I kept her rocking chair all these years. It belongs in your hut now.", [
      { label:'Thank you, Nana', fn:() => { closeDialog(); toast("You got Grandma's Rocker! Place it inside your hut."); } }], S.hearts.nana);
  },
  pip3() {
    sfx('heart');
    openDialog('Pip', "Can I tell you something? I get lost. A lot. How do real birds fly across whole oceans without getting lost?", [
      ...['The sun','The stars','Something invisible'].map(a => ({ label:a, fn:() => { closeDialog(); toast('Pip: All three?! Birds are so much cooler than me.'); setTimeout(() => showAha('migration'), 800); } })),
    ], S.hearts.pip);
  },
  pip6() {
    S.furn.sign = (S.furn.sign||0) + 1; sfx('heart'); save();
    openDialog('Pip', "I made this for my shop. The one I do not have yet. But you believe in me, so... I want you to keep it until I do. It is my lucky sign!", [
      { label:'I will keep it safe', fn:() => { closeDialog(); toast("You got Pip's Lucky Sign! Place it inside your hut."); } }], S.hearts.pip);
  },
  drizzle3() {
    sfx('heart');
    openDialog('Captain Drizzle', "Sit, sit. Want to hear what holds the sky up? Old sailors say there is a tree so big its roots grip the deepest cloud and its branches hold every island. When the Great Gust came, it shook that tree. That is why we all fell apart.", [
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
      { label:'I love it', fn:() => { closeDialog(); toast("You got Lumen's Painting! Place it inside your hut."); } }], S.hearts.lumen);
  },
  twins3() {
    sfx('heart');
    openDialog('Moss & Fern', "Fern: Want to know a secret? Moss: We counted the spirals in a sunflower. Fern: 1, 1, 2, 3, 5, 8, 13, 21... Moss: What comes next?", [
      ...[29, 34, 42].map(n => ({ label:String(n), fn:() => n === 34
        ? (closeDialog(), showAha('fibonacci', () => openDialog('Moss & Fern', "Moss: 21 spirals one way. Fern: 34 the other. Moss: Every time!", [], S.hearts.twins)))
        : openDialog('Moss & Fern', "Fern: Close! Moss: Hint: add the last two numbers together.", [{ label:'Try again', fn:SCENES.twins3 }]) })),
    ], S.hearts.twins);
  },
  twins6() {
    S.furn.mushroom = (S.furn.mushroom||0) + 1; sfx('heart'); save();
    openDialog('Moss & Fern', "Moss: We grow these deep in our tunnels. Fern: They glow in the dark. Moss: So you never feel lost. Fern: Take one for your hut!", [
      { label:'Thank you both', fn:() => { closeDialog(); toast('You got a Glow Mushroom Lamp! Place it inside your hut.'); } }], S.hearts.twins);
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
      S.aha.includes(card) ? (thanks(), sfx('coin')) : showAha(card, thanks); } }], S.hearts[f.host]);
}

// --- chapter 1 ---
function nanaQuest() {
  const h = S.hearts.nana;
  if (S.quest === 0) {
    S.quest = 1; if (S.tut === 1) tutAfterGreeting(); else spawnDigs(); drawHud(); save();
    openDialog('Nana Gale', `Oh! You must be ${S.name || 'the new Keeper'}. You have her eyes. Your grandmother was our Keeper of Memory. When the Great Gust hit, the village's memories fell into the ground like seeds. See that sparkle, right by your garden? Tap it a few times to dig it up.`, [], h);
  } else if (S.quest === 1) openDialog('Nana Gale', `Keep digging, dear. ${S.relics} of 3 memories found. New sparkles show up each morning.`, neighborButtons('nana'), h);
  else if (S.quest === 2) openDialog('Nana Gale', "Three memories! Now, the old stone dial by your garden. Tap it when its shadow is the very shortest. Do not ask me why. Your grandmother always did.", neighborButtons('nana'), h);
  else if (S.quest === 3) openDialog('Nana Gale', "This is her Wind Bell frame. The big chime survived, but the small ones are all mixed up. Hang the three that sound sweetest with the big one.", [{ label:'Tune the bell', fn:() => { closeDialog(); openBell(); } }, ...neighborButtons('nana')], h);
  save();
}
function pipQuestion() {
  const q = QUESTIONS[S.qi % QUESTIONS.length];
  openDialog("Pip's Big Question", q.q, [
    ...q.a.map((a, i) => ({ label:a, fn:() => {
      S.asked = S.day; S.qi++; closeDialog(); toast(`Pip: ${q.r[i]}`); save();
      setTimeout(() => showAha(q.id), 900);
    }})),
    { label:'Not today', fn:() => { S.asked = S.day; save(); talk('pip'); } },
  ], S.hearts.pip, 'pip');
}
function dig(i) {
  const d = S.digs[i];
  d.n++; sfx('dig'); burst(digGroups[i].position, 0x9b6b4a, 8);
  if (d.n < 3) { toast(`${LAYERS[d.n - 1]} Tap again to dig deeper.`); drawDigs(); save(); return; }
  const r = RELICS[S.relics];
  S.relics++; S.digs.splice(i, 1);
  if (S.relics >= RELICS.length) { S.quest = Math.max(S.quest, 2); S.digs = []; }
  drawDigs(); drawHud(); save();
  toast(`${LAYERS[2]} You found ${r.name}!`);
  setTimeout(() => showAha(r.id, () => { if (S.tut === 2) return tutAfterFirstMemory(); if (S.quest === 2 && S.relics === 3) toast('Go talk to Nana Gale.'); }), 700);
}
function useSundial() {
  const h = hour();
  if (S.quest < 2) { toast('An old sundial. Its shadow moves with the sun.'); return; }
  if (S.quest > 2) { toast('The sundial. Shortest shadow means noon.'); return; }
  if (h >= 11.5 && h <= 12.5) { S.quest = 3; save(); drawHud(); showAha('sundial', () => toast('Go see Nana Gale.')); }
  else if (h < 11.5) toast('Not noon yet. Come back at 12 PM. The clock is at the top of the screen.');
  else toast('Noon has passed. Try again tomorrow at 12 PM.');
}
function openBell() {
  const picked = new Set();
  const draw = (msg='') => {
    showCard(`<div class="kicker">THE WIND BELL</div><h2>Tune the chimes</h2>
      <p>Tap a chime to hear it ring together with the big bell. Some pairs sound nice. Some sound harsh. Pick the 3 that sound nice, then tap Ring the bell.</p>
      <div class="jlist">${CHIMES.map((c,i)=>`<button data-i="${i}" style="${picked.has(i)?'background:#ffc857':''}">${picked.has(i)?'✓ ':''}Chime ${i+1}: ${c.label} as long</button>`).join('')}</div>
      <p style="margin-top:10px;min-height:22px;font-weight:700">${msg}</p>
      <button id="ring">Ring the bell</button> <button id="deaf" class="ghost">Can't hear it?</button> <button id="later" class="ghost">Later</button>`, null);
    $('deaf').onclick = () => draw('Hint: the nice-sounding chimes have the simplest lengths: 1/2, 2/3, and 3/4.');
    document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, base = 262;
      if (muted) toast('Turn sound on to hear the chimes.');
      chime(base); chime(base * CHIMES[i].r);
      picked.has(i) ? picked.delete(i) : picked.add(i); draw();
    });
    $('later').onclick = hideCard;
    $('ring').onclick = () => {
      if (picked.size !== 3) return draw('Pick exactly 3 chimes.');
      if ([...picked].some(i => !CHIMES[i].sweet)) { chime(262); chime(262*16/15); return draw('Hmm. One of them clashes. Listen again.'); }
      hideCard();
      S.quest = S.bridge ? 5 : 4; S.coins += 50; bell.visible = true; save(); drawHud(); burst(bell.position, 0xffc857, 20);
      [262,330,392,524,660].forEach((f,i)=>setTimeout(()=>chime(f),i*220));
      setTimeout(() => showAha('bell', () => openDialog('Nana Gale', "Listen... Far to the east, another bell just answered. Someone is out there. Fix that bridge, dear. I put 50 coins in your pocket to help.", [], S.hearts.nana)), 1300);
    };
  };
  draw();
}
const bridgeCost = c => Math.round(c * (S.mode === 'explorer' ? .7 : 1));
function useSign() {
  if (S.bridge) { toast('The bridge to Orchard Isle. Walk across!'); return; }
  openDialog('Broken Bridge', `Fix this bridge to reach Orchard Isle. Cost: ${bridgeCost(BRIDGE_COST)} coins. You have ${S.coins}.`, [{ label:`Fix it (${bridgeCost(BRIDGE_COST)})`, fn:() => {
    if (S.coins < bridgeCost(BRIDGE_COST)) { toast('Not enough coins yet.'); return; }
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
    openDialog('Captain Drizzle', "Ahoy! So YOU rang that bell. I am Captain Drizzle, and that is my cloud ship, the Puddle Jumper. She has not flown since the Great Gust. Help me fix her, and I will take you anywhere. First, fresh water. Everything out here is cloud-salt. Use the pot by my ship.", [], h);
  } else if (S.q2 === 1) openDialog('Captain Drizzle', "The pot, sailor! Fill it with cloud-sea water, put the little cup in the middle, lid on top, and leave it in the sun until tomorrow. Trust the captain.", nb, h);
  else if (S.q2 === 2) openDialog('Captain Drizzle', "Fresh water, check! Now the sail. The mast needs a perfect square corner or she flies in circles. Tap the ship and use my knotted rope.", nb, h);
  else if (S.q2 === 3) {
    if (hour() >= 20) openDialog('Captain Drizzle', "Good, the stars are out. A captain needs a star that never moves. Look up and find it for me.", [{ label:'Look up', fn:() => { closeDialog(); starPuzzle(); } }, ...nb], h);
    else openDialog('Captain Drizzle', "Now we need stars, and it is too bright. Come back after 8 PM.", nb, h);
  } else if (S.q2 === 4) drizzleFinale();
  save();
}
function usePot() {
  if (S.q2 < 1) { toast('An old metal pot.'); return; }
  if (S.q2 > 1) { toast('The water pot. Sun in, fresh water out.'); return; }
  if (S.potDay < 0) { S.potDay = S.day; lid.visible = true; sfx('water'); save(); toast('You filled the pot, set the cup inside, and put the lid on. Leave it in the sun until tomorrow.'); return; }
  if (S.potDay === S.day) { toast('Nothing yet. Drops are forming on the lid. Come back tomorrow.'); return; }
  S.q2 = 2; lid.visible = false; save(); drawHud(); sfx('pick'); burst(pot.position, 0x9fd3ff);
  showAha('still', () => toast('The cup is full of fresh water! Tell Captain Drizzle, then tap the ship.'));
}
function drizzleOldHeart() {
  S.q5 = 1; save(); drawHud(); sfx('heart');
  openDialog('Captain Drizzle', "Lumen told me everything. The Old Heart, the great bell, your grandmother. Well, sailor, the Puddle Jumper can do more than hover now. The center of the old village is due north. Tap her whenever you are ready, and we fly.", [], S.hearts.drizzle);
}
function flyTo(where) {
  const f = $('fade'); f.style.opacity = 1; sfx('cast');
  setTimeout(() => {
    if (where === 'heart') player.position.set(OH.x + 7.2, OH.y, OH.z + .8); else player.position.set(ORCH_POS.x + 1, ORCH_POS.y, ORCH_POS.z + 1.5);
    S.where = 'home'; target = null; pending = null; snapCam(); S.pos = [player.position.x, player.position.y, player.position.z]; save();
    f.style.opacity = 0;
    if (where === 'heart' && S.q5 === 1) { S.q5 = 2; save(); drawHud(); setTimeout(() => toast('The Old Heart. The great bell lies fallen in the middle.'), 700); }
  }, 700);
}
function useShip() {
  if (S.q2 >= 5 && S.shipPath && featureOn('journey')) { const b = [];
    if (S.q5 >= 1) b.push({ label:'Fly to the Old Heart', fn:() => { closeDialog(); flyTo('heart'); } });
    if (S.shipPath === 'explore') b.push({ label:'Go on a voyage', fn:() => { closeDialog(); voyage(); } }); else b.push({ label:'Market day', fn:() => { closeDialog(); marketDay(); } });
    openDialog('The Puddle Jumper', S.shipPath === 'explore' ? 'The explorer\'s ship, ready to sail.' : 'The floating market is open for business.', b); return; }
  if (S.q5 >= 1) { openDialog('The Puddle Jumper', 'Fly north to the Old Heart?', [{ label:'Fly!', fn:() => { closeDialog(); flyTo('heart'); } }]); return; }
  if (S.q2 < 2) { toast('The Puddle Jumper. Her sail is a mess.'); return; }
  if (S.q2 === 2) return ropePuzzle();
  if (S.q2 < 5) { toast('The sail looks great. Now she needs a navigator.'); return; }
  toast('The Puddle Jumper, ready to fly.');
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
      showAha('rope', () => toast('The sail is up! Come back after 8 PM and talk to Captain Drizzle.'));
    };
  };
  draw();
}
function starPuzzle(o = {}) {
  showCard(`<div class="kicker">THE NIGHT SKY</div><h2>${o.title || 'Find the star that stays'}</h2>
    <p>${o.text || 'Watch the sky for a few seconds. Every star moves in a circle, except one. Tap the star that stays still.'}</p>
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
  openDialog('Captain Drizzle', "She flies! Well. She hovers. That is a start! Listen, sailor: when you rang that bell, I heard one more answer. Far north, past the old Windmill. Someone else is waiting. Here, 100 coins for the best crew I ever had.", featureOn('journey') ? [{ label:'What happens to her now?', fn:() => { closeDialog(); shipChoice(); } }] : [], S.hearts.drizzle);
}
function useSign2() {
  if (S.bridge2) { toast('The bridge to Windmill Isle. Walk across!'); return; }
  openDialog('Broken Bridge', `This bridge goes north to Windmill Isle. Cost: ${bridgeCost(BRIDGE2_COST)} coins. You have ${S.coins}.`, [{ label:`Fix it (${bridgeCost(BRIDGE2_COST)})`, fn:() => {
    if (S.coins < bridgeCost(BRIDGE2_COST)) { toast('Not enough coins yet.'); return; }
    S.coins -= bridgeCost(BRIDGE2_COST); S.bridge2 = true; if (S.q3 === 0) S.q3 = 1; buildBridge(); save(); drawHud();
    [523,659,784,1047].forEach((f,i)=>setTimeout(()=>chime(f),i*160)); burst(sign2.position, 0xffc857, 20);
    openDialog('Bridge fixed!', 'The bridge to Windmill Isle is whole again. You can hear something creaking up there.');
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
    openDialog('Moss & Fern', "Fern: Bread from OUR flour? Moss: We are so proud. Fern: Here, we built you a sprinkler that runs on wind power. Moss: It waters your whole garden every morning. Fern: Also... Moss: ...we felt the ground hum last night. Fern: From the dark island. Moss: Where the lights only come out at night.", [], h);
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
    { label:'Wait for it', fn:() => { closeDialog(); bagAdd('flour', -1); S.q3 = 6; save(); drawHud(); showAha('bread', () => toast('Warm bread! Go tell Moss & Fern.')); } }], S.hearts.nana);
}
function gearPuzzle(o = {}) {
  const target = o.target || 3, right = 24 / target;
  let teeth = 24, spin = 0, raf;
  const draw = (msg='') => {
    showCard(`<div class="kicker">${o.kicker || 'THE WINDMILL'}</div><h2>Fix the gears</h2>
      <p>The big gear turns with the wind. ${o.what || 'The millstone needs its small gear'} to spin exactly ${target} times for every 1 turn of the big gear.</p><p style="font-size:14px;opacity:.75;margin-top:6px">Tap a small gear below to try it. Watch the two counters at the top. When the small gear counts ${target} turns for each 1 big turn, tap Fit this gear.</p>
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
  if (!S.aha.includes('rope')) { toast('Fence stakes and a long rope. A bigger garden needs a perfect square corner. Maybe someone on another island knows how.'); return; }
  ropePuzzle({ kicker:'A BIGGER GARDEN', total:24, text:'This rope is twice as long: 24 spaces between the knots. Split it into 3 sides and make the bottom left corner a perfect square corner.', fail:'Not square yet. The fence would lean.',
    done:() => { S.bigGarden = true; for (let i=0;i<3;i++){ S.tiles.push({ s:0 }); addTileGroup(S.tiles.length-1); }
      stakes.visible = false; save(); sfx('pick'); burst(new THREE.Vector3(2.45,0,2.75), 0x8fdc8a, 20); showRecall('rope', () => toast('Your garden grew by 3 plots!')); } });
}
function useBoulder() {
  if (S.boulder) { toast('The old stone with three kinds of writing.'); return; }
  if (!S.aha.includes('lever')) { toast('A huge boulder. Something is carved underneath, but it will not budge.'); return; }
  leverPuzzle({ kicker:'THE BOULDER', title:'Move the boulder', heavy:80, push:20, text:'Something is carved under this boulder. It is heavier than the millstone, but you are stronger now. Move the log, then push.',
    done:() => { S.boulder = true; rock.visible = false; rosettaStone.visible = true; save(); sfx('dig'); burst(boulder.position, 0x9a93a8, 20);
      showRecall('lever', () => showAha('rosetta')); } });
}
function lumenQuest() {
  const h = S.hearts.lumen, nb = neighborButtons('lumen');
  if (S.q3 < 7) { openDialog('Lumen', "Oh! Someone crossed the... how did you get here? Never mind. Come back when the windmill sings again.", nb, h); return; }
  if (S.q4 === 0) {
    S.q4 = 1; save(); drawHud();
    openDialog('Lumen', "Oh. Hello. I am Lumen. I paint at night. Nobody visits, so... sorry, I am nervous. I paint the moon every night, but the wind knocked my paintings over and now they are all mixed up. Could you help me put them back in order? They are on my easel.", [], h);
  } else if (S.q4 === 1) openDialog('Lumen', "My moon paintings are on the easel. Start with the darkest one.", nb, h);
  else if (S.q4 === 2) openDialog('Lumen', "Try my dark room. It is the little black house. There is a tiny window in it.", nb, h);
  else if (S.q4 === 3) openDialog('Lumen', "The crystals in my garden used to sing. Now they sound wrong. Could you listen to them?", nb, h);
  else if (S.q4 === 4) {
    S.q4 = 5; S.seeds.starbloom = (S.seeds.starbloom||0) + 3; S.coins += 100; save(); drawHud(); sfx('heart'); burst(npcs.lumen.position, 0xfff3a0, 24);
    openDialog('Lumen', "Now I can show you my best painting. This is the Old Heart, before the Great Gust. See the giant bell in the middle? Every island had a small bell, and they all rang together with the big one. Then one night the big bell cracked. Without its song, the islands drifted apart. Your grandmother tried to fix it. She never finished. I think you are supposed to. Here: 3 moonflower seeds. Moonflowers are real, they open at night! In my garden they bloom in any season.", [], h);
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
      <p>Lumen painted the moon on 8 nights in a row. Tap all 8 paintings in order, starting with the darkest moon. Night by night the lit part grows until the moon is full, then it shrinks.</p>
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
  if (S.q4 < 2) { toast('A little black house with one tiny window.'); return; }
  let size = 4;
  const names = ['', 'Tiny', 'Small', 'Medium', 'Big'];
  const draw = () => {
    showCard(`<div class="kicker">LUMEN'S DARK ROOM</div><h2>Make the picture sharp</h2>
      <p>Light from outside shines through one hole and makes a picture on the back wall. Tap the buttons to try different hole sizes. Find the one that makes the picture sharp.</p>
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
      <p>Tap a crystal to hear it ring together with the tallest one. Some pairs sound nice. Some sound harsh. Pick the 2 that sound nice, then tap Ring them.</p>
      <div class="jlist">${list.map((c,i) => `<button data-c="${i}" style="${picked.has(i)?'background:#c9b6ff':''}">${picked.has(i)?'✓ ':''}Crystal ${i+1}: ${c.l} as tall</button>`).join('')}</div>
      <p style="margin-top:10px;min-height:22px;font-weight:700">${msg}</p>
      <button id="ring">Ring them</button> <button id="deaf" class="ghost">Can't hear it?</button> <button id="later" class="ghost">Later</button>`, null);
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
  if (S.q5 < 5) { toast('The bell is upright, but it needs a frame to hang from.'); return; }
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
    done:() => { S.q5 = 5; save(); drawHud(); sfx('pick'); burst(frameGear.position, 0xc98f58, 16); showRecall('gears', () => toast('The bell hangs ready. Ring it at exactly noon.')); } });
  toast('The great bell frame. Solid and square.');
}
function ringGreatBell() {
  S.q5 = 6; S.coins += 300; save(); drawHud(); gbSwing.userData.ring = 6;
  [131,196,262,330,392,523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*260));
  [new THREE.Vector3(0,0,0), ORCH_POS, WIND_POS, NIGHT_POS, OH].forEach((p, i) => setTimeout(() => burst(p.clone().setY(p.y + 1), [0xffc857,0xff8fa3,0x9fe7e0,0xc9b6ff,0xfff3a0][i], 30), 400 + i*500));
  crack.visible = false;
  setTimeout(() => showCard(`<div class="kicker">CHAPTER 5: THE OLD HEART</div><h2>The Sky Remembers</h2>
    <p>The great bell rings out across the sky. From every island, a small bell answers: Grandma's Wind Bell, Drizzle's ship bell, the windmill, Lumen's crystals. Far away, islands you have never seen begin to drift closer.</p>
    <h4>Tucked inside the bell, a letter</h4><p class="letter">${GRANDMA_LETTER2}</p>
    <h4>What's next</h4><p>Five building sites have opened here at the Old Heart. Rebuild the village, one building at a time. You also got 300 coins.</p>`, 'Rebuild the village'), 4200);
}
function useSite(i) {
  const b = BUILDINGS[i];
  if (S.q5 < 6) { toast('An old foundation. Ring the great bell first.'); return; }
  if (S.built.includes(b.id)) return ({ observatory:useObservatory, bakery:useBakery, library:useLibrary, musichall:useMusicHall, temple:useTemple })[b.id]();
  if (b.soon) { toast(`${b.name}: ${b.about}`); return; }
  const kindName = { crop:'crops (any kind)', fish:'fish (any kind)', fruit:'fruits (any kind)', dish:'dishes from the Bakery (any kind)' };
  const countOf = k => k.startsWith('kind:') ? Object.entries(S.bag).filter(([id]) => ITEMS[id].kind === k.slice(5)).reduce((a, [,n]) => a + n, 0) : (S.bag[k] || 0);
  const have = Object.entries(b.items).map(([k,n]) => ({ k, n, got:countOf(k), label: k.startsWith('kind:') ? kindName[k.slice(5)] : ITEMS[k].name }));
  const can = S.coins >= b.coins && have.every(x => x.got >= x.n);
  showCard(`<div class="kicker">REBUILD THE VILLAGE</div><h2>${b.name}</h2><p>${b.about}</p><h4>To build it</h4>
    <div class="jlist"><button>${b.coins} coins <span class="sub">you have ${S.coins}</span></button>${have.map(x => `<button>${x.got >= x.n ? '✓ ' : ''}${x.n} ${x.label} <span class="sub">you have ${x.got}</span></button>`).join('')}</div>
    ${can ? '<button id="build">Build it</button> ' : '<p style="margin-top:10px;font-weight:700">Not enough yet. Keep farming and fishing.</p>'}`, 'Later');
  if (can) $('build').onclick = () => {
    S.coins -= b.coins;
    Object.entries(b.items).forEach(([k,n]) => { if (!k.startsWith('kind:')) return bagAdd(k, -n);
      for (const id of Object.keys(S.bag).filter(id => ITEMS[id].kind === k.slice(5))) { const take = Math.min(n, S.bag[id]); bagAdd(id, -take); n -= take; if (!n) break; } });
    S.built.push(b.id); S.builtDay[b.id] = Date.now(); save(); hideCard(); drawSites(); drawHud();
    [392,523,659,784].forEach((f,j)=>setTimeout(()=>chime(f),j*150)); burst(siteGroups[i].position, 0xffc857, 30);
    toast(b.villager ? `The ${b.name} is built! ${NEIGHBORS[b.villager].name} is moving in. Go say hello.` : `The ${b.name} is built! Come back after 8 PM to chart the stars.`);
  };
}
function useBakery() {
  showCard(`<div class="kicker">MABEL'S BAKERY</div><h2>What should we cook?</h2><p>Pick a recipe. If you have everything it needs, tap Cook. Dishes sell for more than their ingredients, and make great gifts.</p>
    <div class="jlist">${RECIPES.map(r => { const ok = Object.entries(r.needs).every(([k,n]) => (S.bag[k]||0) >= n);
      return `<button data-r="${r.id}" ${ok ? '' : 'style="opacity:.6"'}>${S.cooked.includes(r.id) ? '✓ ' : ''}${r.name} <span class="sub">needs ${Object.entries(r.needs).map(([k,n]) => `${n} ${ITEMS[k].name} (you have ${S.bag[k]||0})`).join(', ')}. Sells for ${r.sell}.</span></button>`; }).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
    const r = RECIPES.find(x => x.id === b.dataset.r), miss = Object.entries(r.needs).find(([k,n]) => (S.bag[k]||0) < n);
    if (miss) { toast(`You need ${miss[1]} ${ITEMS[miss[0]].name} for this. You have ${S.bag[miss[0]]||0}.`); return; }
    Object.entries(r.needs).forEach(([k,n]) => bagAdd(k, -n)); bagAdd(r.id); sfx('pick'); burst(npcs.mabel.position, 0xffc857, 16);
    const first = !S.cooked.includes(r.id); if (first) S.cooked.push(r.id); save(); drawHud();
    if (first) showCard(lessonHtml(r.aha), 'Add to my recipes', useBakery); else { toast(`You made ${r.name}! It is in your bag.`); useBakery(); }
  });
}
function booksOpen() { const since = S.builtDay.library || Date.now(); return Math.min(BOOKS.length, 1 + Math.floor((Date.now() - since) / (7 * 86400000))); }
function useLibrary() {
  const open = booksOpen(), next = Math.ceil(7 - ((Date.now() - (S.builtDay.library || Date.now())) / 86400000) % 7);
  showCard(`<div class="kicker">THE LIBRARY</div><h2>Professor Hoot's shelf</h2><p>A new book arrives every week. Tap a book to read it.</p>
    <div class="jlist">${BOOKS.slice(0, open).map(bk => `<button data-bk="${bk.id}">${S.read.includes(bk.id) ? '✓ ' : 'New: '}${bk.title}</button>`).join('')}</div>
    <p style="margin-top:10px;font-weight:700">${open < BOOKS.length ? `Next new book in ${next} day${next === 1 ? '' : 's'}.` : 'You have every book so far. More are on the way.'}</p>`, 'Close');
  document.querySelectorAll('[data-bk]').forEach(b => b.onclick = () => { const bk = BOOKS.find(x => x.id === b.dataset.bk);
    if (!S.read.includes(bk.id)) { S.read.push(bk.id); save(); sfx('heart'); }
    showCard(lessonHtml({ kicker:'THE LIBRARY', ...bk }), 'Back to the shelf', useLibrary); });
}
function xyloNote(i) { const f = XYLO[i]; tone(f, { type:'triangle', dur:.9, vol:.07 }); tone(f*4, { dur:.25, vol:.012 }); }
function useMusicHall(song) {
  let played = [], idx = 0;
  const colors = ['#ff8fa3','#ffb36b','#ffc857','#eee','#8fdc8a','#7ec8e3','#eee','#ff8fa3'];
  const draw = (msg = '') => {
    showCard(`<div class="kicker">ALLEGRA'S MUSIC HALL</div><h2>${song ? `Learn: ${song.name}` : 'The xylophone'}</h2>
      <p>${song ? 'Tap the glowing bar each time. Go one note at a time until the song is done.' : 'Tap the bars to play. Try playing only the colored bars, and listen. Or pick a song to learn.'}</p>
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
  showCard(`${sayingHtml(sy)}<h4>Coming up in the village</h4><div class="jlist">${upcoming.map(x => `<button>${x.f.name} <span class="sub">${x.w.start <= start ? 'happening now' : dateLabel(x.w.start)}</span></button>`).join('')}</div>
    <p style="margin-top:10px">Sage shares a new saying every day. You have heard ${S.sayings.length} of ${SAYINGS.length}.</p>`, 'Thank you, Sage');
}
function useObservatory() {
  if (hour() < 20) { toast('The stars come out after 8 PM. Come back tonight.'); return; }
  const m = today().getMonth() + 1, tonight = CONSTELLATIONS.filter(c => c.months.includes(m));
  showCard(`<div class="kicker">THE OBSERVATORY</div><h2>Tonight's sky</h2><p>Different constellations come out in different months. Pick one to find and chart.</p>
    <div class="jlist">${tonight.map(c => `<button data-cn="${c.id}">${S.charted.includes(c.id) ? '✓ ' : ''}${c.name}</button>`).join('')}</div>
    <p style="margin-top:8px" class="sub">You have charted ${S.charted.length} of ${CONSTELLATIONS.length}. The rest come out in other months.</p>`, 'Close');
  document.querySelectorAll('[data-cn]').forEach(b => b.onclick = () => traceStars(CONSTELLATIONS.find(c => c.id === b.dataset.cn)));
}
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function starHtml(c) {
  return `<div class="kicker">STAR CHART</div><h2>${c.title}</h2><h4>The real story</h4><p>${c.real}</p><h4>Look for it</h4><p>${c.today} Best seen in the evening in ${c.months.map(m => MONTH_NAMES[m-1]).join(', ')}.</p>`;
}
function openStarList() {
  showCard(`<div class="kicker">STAR CHART</div><h2>${S.charted.length} of ${CONSTELLATIONS.length} charted</h2><p>Chart them at the Observatory after 8 PM. Each one only comes out in certain months.</p>
    <div class="jlist">${CONSTELLATIONS.map(c => S.charted.includes(c.id) ? `<button data-sc="${c.id}">${c.name}</button>` : `<button class="locked">??? <span class="sub">out in ${c.months.map(m => MONTH_NAMES[m-1].slice(0,3)).join(', ')}</span></button>`).join('')}</div>`, 'Back', openJournal);
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
  if (S.fruit[i] === S.day) { toast('Already picked today. Come back tomorrow.'); return; }
  if (!canCarry(t.userData.fruitKind)) return bagFull();
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
  if (night && !secret) $('secret').onclick = () => starPuzzle({ title:'Find the secret spot', text:'The big fish rest under the one star that never moves. Find it.',
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
  const hud = document.createElement('div'); hud.className = 'fishhud'; hud.innerHTML = `<p id="fhMsg">${secret ? 'The secret spot. The big ones live here.' : 'Watch the shadows. Big shadow, big fish. Tap Cast.'}</p>
    <div id="fhReel" class="fhreel" hidden><div class="fhmeter"><b id="fhM"></b></div><div class="fhbar"><i id="fhZ"></i><span id="fhF">🐟</span></div></div>
    <div class="fhbtns"><button id="fhAct">Cast</button>${night && !secret ? '<button id="fhSecret" class="ghost">Find the secret spot</button>' : ''}<button id="fhDone" class="ghost">Done</button></div>`;
  document.body.appendChild(hud);
  const msg = t => { $('fhMsg').textContent = t; }, act = $('fhAct'), setAct = (l, dis) => { act.textContent = l; act.disabled = !!dis; act.style.opacity = dis ? .5 : 1; };
  let state = 'ready', t0 = 0, now = 0, last = performance.now(), raf, cur = null, nextNibble = 0, biteAt = 0, holding = false, zone = .3, zoneV = 0, fishX = .5, fishT = .5, fishNext = 0, meter = .3, reelTick = 0, caught = null, arc = 0;
  const bobHome = () => W(V(3.9 + Math.sin(arc) * .2, -.3, Math.cos(arc) * .3));
  const splash = (p, big) => { burst(p.clone().setY(p.y + .05), 0xdff3ff, big ? 10 : 3); };
  const drawLine = (end, sag) => { const a = new THREE.Vector3(); tip.getWorldPosition(a); const pts = lineGeo.attributes.position;
    for (let i = 0; i < 16; i++) { const k = i / 15, p = a.clone().lerp(end, k); p.y -= Math.sin(k * Math.PI) * sag; pts.setXYZ(i, p.x, p.y, p.z); } pts.needsUpdate = true; };
  const land = () => {
    state = 'caught'; t0 = now; const f = cur.f, size = cur.size;
    caught = fishMesh(f, f.ray ? .9 : Math.min(1.1, .25 + size / 160)); scene.add(caught); caught.position.copy(bob.position);
    bob.visible = false; line.visible = false; splash(bob.position, true); sfx('splash'); [523,659,784,1047].forEach((fr,i) => setTimeout(() => chime(fr), i*110));
    S.fishLog = S.fishLog || {}; const rec = S.fishLog[f.id] || { n:0, best:0 }, isNew = !S.found.includes(f.id), isRecord = rec.n > 0 && size > rec.best;
    cur.shadow.parent && pool.remove(cur.shadow); shadows = shadows.filter(s => s !== cur.shadow); if (table.length) shadows.push(newShadow());
    const fits = canCarry(f.id), keepable = fits;
    setTimeout(() => { if (!fish3) return;
      $('fhReel').hidden = true;
      msg(''); $('fhMsg').innerHTML = `<b style="font-size:20px">You caught a ${ITEMS[f.id].name}!</b> ${size} cm ${isNew ? '<span class="tagnew">NEW!</span>' : ''}${isRecord ? '<span class="tagrec">New record!</span>' : ''}<br>${isNew ? `<i>In real life:</i> ${FINDS[f.id].fact}` : `Sells for ${Math.round(sellPrice(f.id))} coins. Your biggest: ${Math.max(rec.best, size)} cm.`}${fits ? '' : '<br><b>Your bag is full.</b>'}`;
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
  const press = on => {
    if (!on) { holding = false; return; }
    if (state === 'reel') { holding = true; return; }
    if (state === 'ready') { if (!table.length) return msg('Nothing is biting here right now.'); state = 'casting'; t0 = now; sfx('cast'); arc = Math.random() * 6; S.t = Math.min(.99, S.t + 10/(60*18)); drawHud(); msg(''); setAct('Wait...', true); return; }
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
      if (k >= 1) { state = 'wait'; splash(bob.position, false); sfx('splash'); const near = shadows.reduce((b, s) => !b || s.userData.size > 0 && Math.random() < .5 ? s : b, null); cur = near ? { shadow:near, f:near.userData.f, size:near.userData.size } : null;
        nextNibble = now + 1.2 + Math.random(); biteAt = now + 2.6 + Math.random()*3.2; msg('Wait for it... a shadow is coming.'); } }
    if (state === 'wait' || state === 'bite') { const e = bobHome(); bob.position.copy(e); bob.position.y += Math.sin(now*3)*.02;
      if (state === 'wait') { if (now > nextNibble) { tone(900, { dur:.05, vol:.025 }); splash(bob.position, false); nextNibble = now + .7 + Math.random()*1.2; } if (now < nextNibble - .55 && now > nextNibble - .75) bob.position.y -= .06;
        if (now > biteAt && cur) { state = 'bite'; t0 = now; splash(bob.position, true); sfx('splash'); tone(220, { to:110, dur:.25, vol:.08 }); msg('It bit! Tap now!'); setAct('Hook it!'); bang.visible = true; } }
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
    hud.remove(); removeEventListener('keydown', key); removeEventListener('keyup', key); fish3 = null; cine = null; document.body.classList.remove('in-cine'); };
  const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(e.type === 'keydown'); } };
  addEventListener('keydown', key); addEventListener('keyup', key);
  act.addEventListener('pointerdown', e => { e.preventDefault(); press(true); }); ['pointerup','pointerleave','pointercancel'].forEach(ev => act.addEventListener(ev, () => press(false)));
  $('fhDone').onclick = end;
  if ($('fhSecret')) $('fhSecret').onclick = () => { end(); starPuzzle({ title:'Find the secret spot', text:'The big fish rest under the one star that never moves. Find it.',
    done:() => { const first = !S.used.includes('stars'); const go = () => { hideCard(); fishing3D(d, { secret:true }); }; first ? showRecall('stars', go) : go(); } }); };
  fish3 = { press, end };
  window.__sgFish = () => ({ state, fishX, zone, zw: cur ? .42 - cur.f.fight*.16 : 0, meter, shadows:shadows.length }); // read-only, for testing
  loop();
}
let holdUp = false;

// --- the hut ---
const HOME_STAGES = [
  { name:'the frame', needs:{ log:6, stone:10 } },
  { name:'the walls', needs:{ log:10, fiber:6 } },
  { name:'the roof', needs:{ fiber:8, log:4 } },
];
const CRAFTS_OLD = [
  { id:'axe', name:'Stone Axe', needs:{ stick:3, stone:2, fiber:2 }, does:'Chop trees for logs.' },
  { id:'pick', name:'Stone Pickaxe', needs:{ stick:2, stone:3, fiber:1 }, does:'Break rocks for stone.' },
];
// --- backpack and storage space: each kind of item takes a slot, and a slot holds up to 30 ---
const STACK = 30;
function slotsIn(box) { return Object.entries(box || {}).reduce((a, [k,n]) => a + (n > 0 && ITEMS[k] && ITEMS[k].kind !== 'quest' ? Math.ceil(n / STACK) : 0), 0); }
function packCap() { return 12 + (S.tools.bag1 ? 6 : 0) + (S.tools.bag2 ? 6 : 0) + (S.tools.bag3 ? 12 : 0); }
function storeCap() { return (S.builds || []).filter(b => b.p === 'chest').reduce((a, b) => a + (b.band ? 48 : 24), 0); }
// how many of item k fit (never forces anyone to drop what they already carry)
function roomFor(box, cap, k, n) { if (ITEMS[k]?.kind === 'quest') return n; const used = slotsIn(box), cur = box[k] || 0;
  let fit = 0; while (fit < n) { const next = used - Math.ceil(cur / STACK) + Math.ceil((cur + fit + 1) / STACK); if (next > cap && next > used) break; fit++; } return fit; }
const canCarry = (k, n = 1) => roomFor(S.bag, packCap(), k, n) >= n;
function bagFull() { toast(`Your backpack is full (${packCap()} slots). Put things in a chest, or craft a bigger bag at the workbench.`); sfx('click'); }
const have = k => S.bag[k] || 0, enough = needs => Object.entries(needs).every(([k,n]) => have(k) >= n);
const needText = needs => Object.entries(needs).map(([k,n]) => `${icon(k)} ${n} ${ITEMS[k].name.toLowerCase()}${n > 1 && !ITEMS[k].name.endsWith('s') && k !== 'fiber' ? 's' : ''} (you have ${have(k)})`).join(', ');
function drawHome() {
  const st = S.home || 0; house.visible = st >= 3; buildSite.visible = st < 3;
  siteFrame.visible = st >= 1; siteWalls.visible = st >= 2; siteStones.children.slice(-2).forEach(c => c.visible = st === 0);
  campfire.visible = !VISIT;
}
function spawnPickups() {
  if (VISIT) return;
  const kinds = ['stick','stick','stone','fiber'], rnd = () => Math.random();
  while (S.pickups.length < 10) { let x, z, tries = 0; do { const land = [{ x:0, z:0, r:8.2 }, ...ownedLobes().map(L => ({ x:L.e.x, z:L.e.z, r:L.r - .8 }))], L = land[Math.floor(rnd()*land.length)], a = rnd()*Math.PI*2, r = (L.r === 8.2 ? 2 : 0) + rnd()*(L.r - (L.r === 8.2 ? 2 : 0)); x = L.x + Math.cos(a)*r; z = L.z + Math.sin(a)*r; tries++; }
    while (tries < 20 && ((x > .2 && x < 4.8 && z > -2 && z < 3.8) || Math.hypot(x+4, z+3) < 2)); const needStone = !S.tools.pick && S.pickups.filter(p => p.t === 'stone').length < 5; S.pickups.push({ t:needStone ? 'stone' : kinds[Math.floor(rnd()*4)], x, z }); }
  drawPickups();
}
function drawPickups() {
  pickupGroup.clear();
  S.pickups.forEach((p, i) => {
    const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.userData = { kind:'pickup', i };
    if (p.t === 'stick') [0,1].forEach(k => { const st = mesh(new THREE.CylinderGeometry(.03,.035,.55,5), mat(0x8a6445), k*.08, .05, k*.06); st.rotation.set(Math.PI/2, 0, .3 + k); g.add(st); });
    if (p.t === 'stone') { g.add(mesh(new THREE.DodecahedronGeometry(.11), mat(0x9a93a8), 0, .08, 0)); g.add(mesh(new THREE.DodecahedronGeometry(.08), mat(0xb3aabb), .12, .06, .05)); }
    if (p.t === 'fiber') for (let k=0;k<5;k++){ const bl = mesh(new THREE.ConeGeometry(.025,.35,4), mat(0xb7c46a), (k-2)*.03, .15, 0); bl.rotation.z = (k-2)*.15; g.add(bl); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(.22,.3,20), new THREE.MeshBasicMaterial({ color:0xfff1b0, transparent:true, opacity:.55, side:THREE.DoubleSide })); ring.rotation.x = -Math.PI/2; ring.position.y = -.03; g.add(ring);
    g.add(mesh(new THREE.CylinderGeometry(.3,.3,.3,8), new THREE.MeshBasicMaterial({ visible:false }), 0, .15, 0));
    pickupGroup.add(g);
  });
}
// a "+2 logs" label that floats up from where you gathered, and a quick arm swing
let swingT = 0;
const plural = (k, n) => `${ITEMS[k].name.toLowerCase()}${n > 1 && !ITEMS[k].name.endsWith('s') && k !== 'fiber' && k !== 'clay' && k !== 'tin' && k !== 'copper' ? 's' : ''}`;
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
  toast(`+${n} ${ITEMS[p.t].name.toLowerCase()}. ${homeHint()}`);
}
function chopTree(t) {
  if (!S.tools.axe) { toast('You need a stone axe to chop trees. Craft one at the tree stump workbench.'); return; }
  const key = t.userData.key; if (S.chopped[key] === S.day) { toast('This tree needs to rest. Come back tomorrow.'); return; }
  if (!canCarry('log')) return bagFull();
  S.chopped[key] = S.day; t.userData.shake = 1; sfx('chop');
  if (S.chopDay !== S.day) { S.chopDay = S.day; S.chopN = 0; } if (++S.chopN === 7) karma('harmony', -1); const wp = new THREE.Vector3(); t.getWorldPosition(wp);
  const nl = S.tools.bronzeAxe ? 3 : 2; gain('log', nl, wp.setY(wp.y + 1), true); toast(`+${nl} logs. ${homeHint()}`);
}
function mineRock(r) {
  if (!S.tools.pick) { toast('You need a stone pickaxe to break rocks. Craft one at the tree stump workbench.'); return; }
  const key = r.userData.key; if (S.chopped[key] === S.day) { toast('You got all the stone from this rock today. Try again tomorrow.'); return; }
  if (!canCarry('stone')) return bagFull();
  S.chopped[key] = S.day; sfx('stone'); const ns = S.tools.bronzePick ? 5 : 3; gain('stone', ns, r.position.clone(), true); toast(`+${ns} stone. ${homeHint()}`);
}
function cutBush(b) {
  const key = b.userData.key; if (S.chopped[key] === S.day) { toast('You already cut grass here today.'); return; }
  if (!canCarry('fiber')) return bagFull();
  S.chopped[key] = S.day; sfx('swish'); gain('fiber', 2, b.position.clone(), true); toast(`+2 grass fiber. ${homeHint()}`);
}
const CRAFTS = [
  { id:'axe',   name:'Stone Axe',     needs:{ stick:3, stone:2, fiber:2 }, does:'Chop trees for logs.' },
  { id:'pick',  name:'Stone Pickaxe', needs:{ stick:2, stone:3, fiber:1 }, does:'Break rocks for stone and dig ore.' },
  { id:'kiln',  name:'Kiln',          needs:{ stone:12, clay:6 }, does:'A clay oven for firing pots and bricks. Starts the Pottery Age.', station:true, after:'pick' },
  { id:'furnace', name:'Furnace',     needs:{ brick:8, stone:6 }, does:'A very hot oven for melting metal. Starts the Bronze Age.', station:true, after:'kiln' },
  { id:'net', name:'Bug Net', needs:{ fiber:5, stick:3 }, does:'Swing it at insects and butterflies to catch them. People have made nets from plant fibers for over 10,000 years.', after:'axe' },
  { id:'bag1', name:'Woven Grass Bag', needs:{ fiber:10, stick:4 }, does:'A bigger backpack: 18 slots instead of 12. People have woven bags from grass and reeds for thousands of years.', after:'axe' },
  { id:'bag2', name:'Clay-Bead Satchel', needs:{ fiber:8, pot:1, clay:4 }, does:'A bigger backpack: 24 slots. Fired clay beads make strong fastenings.', after:'kiln' },
  { id:'bag3', name:'Bronze-Buckle Pack', needs:{ bronze:2, fiber:8 }, does:'The biggest backpack: 36 slots. Metal buckles hold a heavy load closed.', after:'furnace' },
  { id:'bronzeAxe',  name:'Bronze Axe',     needs:{ bronze:2, stick:1 }, does:'Chop 3 logs per tree instead of 2.', after:'furnace' },
  { id:'bronzePick', name:'Bronze Pickaxe', needs:{ bronze:2, stick:1 }, does:'Break 5 stone per rock instead of 3.', after:'furnace' },
];
const potteryOn = () => featureOn('pottery') || !!S.stations.kiln, bronzeOn = () => featureOn('bronze') || !!S.stations.furnace;
const hasCraft = id => id === 'kiln' || id === 'furnace' ? !!S.stations[id] : !!S.tools[id];
const AGES = [
  { id:'stone', name:'Stone Age', done:() => S.tools.axe && S.tools.pick },
  { id:'pottery', name:'Pottery Age', done:() => !!S.stations.kiln, get soon() { return !potteryOn(); } },
  { id:'bronze', name:'Bronze Age', done:() => !!S.stations.furnace, get soon() { return !bronzeOn(); } },
  { id:'glass', name:'Glass Age', soon:true },
  { id:'iron', name:'Iron Age', soon:true },
];
function agesHtml() {
  return `<div class="ages">${AGES.map(a => `<span class="${a.soon ? 'soon' : a.done() ? 'done' : ''}">${a.soon ? '' : a.done() ? '✓ ' : ''}${a.name}${a.soon ? ' (coming soon)' : ''}</span>`).join('<i>›</i>')}</div>`;
}
function drawStations() { kiln.visible = !!S.stations.kiln; furnace.visible = !!S.stations.furnace;
  nodes.forEach(n => n.visible = n.userData.kind === 'claypit' ? potteryOn() : bronzeOn()); }
function useWorkbench() {
  const shown = CRAFTS.filter(c => (!c.after || hasCraft(c.after)) && (c.id !== 'kiln' || potteryOn()) && (!['furnace','bronzeAxe','bronzePick','bag3'].includes(c.id) || bronzeOn()) && (c.id !== 'bag1' || featureOn('bagup')) && (c.id !== 'net' || featureOn('butterflies')) && (c.id !== 'bag2' || (potteryOn() && S.tools.bag1)) && (c.id !== 'bag3' || S.tools.bag2));
  showCard(`<div class="kicker">TREE STUMP WORKBENCH</div><h2>Craft</h2><h4>Ages of invention</h4>${agesHtml()}
    <p style="margin-top:8px">Make tools and workshops from what you gather.${S.tools.pick && !S.stations.kiln && potteryOn() ? ' Scoop clay from the reddish patches at the edge of your island.' : ''}${S.stations.kiln && !S.stations.furnace ? ' Fire clay into bricks at your kiln.' : ''}</p>
    <div class="jlist">${shown.map(c => `<button data-cr="${c.id}" ${hasCraft(c.id) || !enough(c.needs) ? 'style="opacity:.6"' : ''}>${hasCraft(c.id) ? '✓ ' : ''}${c.name} <span class="sub">${hasCraft(c.id) ? 'You have this. ' : ''}${c.does} Needs ${needText(c.needs)}.</span></button>`).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-cr]').forEach(b => b.onclick = () => {
    const c = CRAFTS.find(x => x.id === b.dataset.cr);
    if (hasCraft(c.id)) { toast(`You already have a ${c.name.toLowerCase()}.`); return; }
    if (!enough(c.needs)) { toast(`Not enough yet. Needs ${needText(c.needs)}.`); return; }
    Object.entries(c.needs).forEach(([k,n]) => bagAdd(k, -n));
    if (c.station) S.stations[c.id] = true; else S.tools[c.id] = true; lean('maker', 2);
    save(); drawHud(); drawStations(); sfx('pick'); burst((c.station ? (c.id === 'kiln' ? kiln : furnace) : workbench).position.clone(), 0xc98f58, 20);
    if (c.id === 'axe' && !S.aha.includes('tools')) return showAha('tools', () => toast('Now tap a tree to chop logs.'));
    hideCard();
    if (c.station) { [523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*150)); toast(c.id === 'kiln' ? 'You built a kiln! The Pottery Age begins. Tap it to fire clay.' : 'You built a furnace! The Bronze Age begins. Tap it to melt metal.'); }
    else toast(`You made a ${c.name}! ${c.does}`);
  });
}
function gatherNode(n) {
  const { kind, ore, key } = n.userData;
  if (kind === 'ore' && !S.tools.pick) { toast('You need a stone pickaxe to dig ore. Craft one at the tree stump workbench.'); return; }
  if (S.chopped[key] === S.day) { toast('Nothing left here today. It fills back in by tomorrow.'); return; }
  if (!canCarry(ore)) return bagFull();
  S.chopped[key] = S.day; const amt = kind === 'claypit' ? 2 : 1;
  sfx(kind === 'claypit' ? 'squelch' : 'ting'); for (let i=0;i<amt;i++) bagAdd(ore); burst(n.position.clone(), kind === 'claypit' ? 0xb8653f : ore === 'copper' ? 0x3fbf8f : 0xc9c9d9, 12); floatText(`+${amt} ${icon(ore)} ${plural(ore, amt)}`, n.position.clone()); swingT = .5; save(); drawHud();
  toast(`+${amt} ${ITEMS[ore].name.toLowerCase()}. ${kind === 'claypit' ? 'Clay is soft, wet earth that can be shaped and fired.' : ore === 'copper' ? 'Copper ore has those green streaks. Smelt it in a furnace.' : 'Tin is rare. People once traded it across whole continents.'}`);
}
// the kiln: keep the fire just right
function useKiln() {
  showCard(`<div class="kicker">THE KILN</div><h2>Fire clay</h2><p>Pick what to make. Then keep the fire in the green zone by tapping Add wood. Too cool and nothing happens. Too hot and it cracks!</p>
    <div class="jlist"><button data-fire="brick">Bricks x2 <span class="sub">needs ${needText({ clay:3, log:1 })}</span></button><button data-fire="pot">Clay pot <span class="sub">needs ${needText({ clay:2, log:1 })}</span></button></div>`, 'Close');
  document.querySelectorAll('[data-fire]').forEach(b => b.onclick = () => { const what = b.dataset.fire, needs = what === 'brick' ? { clay:3, log:1 } : { clay:2, log:1 };
    if (!enough(needs)) { toast(`Not enough yet. Needs ${needText(needs)}.`); return; } Object.entries(needs).forEach(([k,n]) => bagAdd(k, -n)); save(); kilnGame(what); });
}
function kilnGame(what) {
  showCard(`<div class="kicker">THE KILN</div><h2>Keep it just right</h2><p>Tap Add wood when the heat drops. Keep the needle in the green zone until the bar fills.</p>
    <canvas id="kilnC" class="rope" width="520" height="220" style="background:#3b2f4a"></canvas><p id="kMsg" style="font-weight:700;text-align:center;min-height:22px;margin-top:6px"></p>
    <button id="kAdd">Add wood</button> <button id="kLater" class="ghost">Stop</button>`, null);
  const g = $('kilnC').getContext('2d'); let heat = .35, done = 0, t = 0, raf, over = false;
  const end = ok => { over = true; cancelAnimationFrame(raf);
    if (ok) { if (what === 'brick') { bagAdd('brick'); bagAdd('brick'); } else bagAdd('pot'); save(); drawHud(); [523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*120)); burst(kiln.position.clone(), 0xffa94d, 18);
      if (!S.aha.includes('pottery')) return setTimeout(() => showAha('pottery'), 500);
      $('kMsg').textContent = `Done! You made ${what === 'brick' ? '2 bricks' : 'a clay pot'}.`; $('kAdd').textContent = 'Close'; $('kAdd').onclick = hideCard; }
    else { tone(200, { to:90, dur:.4, vol:.06 }); $('kMsg').textContent = 'Crack! It got too hot. Try again with a little less wood.'; $('kAdd').textContent = 'Close'; $('kAdd').onclick = hideCard; } };
  const loop = () => { const dt = .016; t += dt; heat = Math.max(0, heat - dt * .11);
    const inZone = heat > .55 && heat < .8; if (inZone) done += dt / 4; if (heat >= 1) return end(false);
    g.fillStyle = '#3b2f4a'; g.fillRect(0,0,520,220);
    g.fillStyle = '#5a4b7a'; g.fillRect(40,90,440,36); g.fillStyle = '#8fdc8a'; g.fillRect(40 + .55*440, 90, .25*440, 36); g.fillStyle = '#ff5a5a'; g.fillRect(40 + .92*440, 90, .08*440, 36);
    g.fillStyle = '#fff'; g.fillRect(40 + heat*440 - 3, 80, 6, 56);
    for (let i=0;i<6;i++){ const fx = 180 + i*30, fh = 20 + heat*60 + Math.sin(t*12 + i)*8; g.fillStyle = `rgba(255,${120 + i*15},60,.85)`; g.beginPath(); g.moveTo(fx-12, 200); g.quadraticCurveTo(fx, 200 - fh*1.4, fx+12, 200); g.fill(); }
    g.fillStyle = '#eadfd0'; g.fillRect(40,30,440,14); g.fillStyle = '#ffc857'; g.fillRect(40,30,440*Math.min(1,done),14);
    g.fillStyle = '#fff8ee'; g.font = 'bold 18px "Baloo 2", sans-serif'; g.fillText(inZone ? 'Just right!' : heat < .55 ? 'Too cool' : 'Getting hot...', 40, 170);
    if (done >= 1) return end(true); raf = requestAnimationFrame(loop); };
  $('kAdd').onclick = () => { if (over) return; heat = Math.min(1.05, heat + .12); sfx('till'); };
  $('kLater').onclick = () => { cancelAnimationFrame(raf); hideCard(); };
  cardCleanup = () => cancelAnimationFrame(raf); loop();
}
// the furnace: find the bronze recipe yourself
function useFurnace() {
  const needs = { copper:2, tin:1, log:2 };
  if (!S.bronzeKnown) return bronzePuzzle();
  showCard(`<div class="kicker">THE FURNACE</div><h2>Smelt bronze</h2><p>You know the recipe: about 9 parts copper to 1 part tin.</p><div class="jlist"><button id="smelt">Bronze ingot <span class="sub">needs ${needText(needs)}</span></button></div>
    <p style="margin-top:8px">No tin? Pip imports it. He will not say from where.</p>`, 'Close');
  $('smelt').onclick = () => { if (!enough(needs)) { toast(`Not enough yet. Needs ${needText(needs)}.`); return; }
    Object.entries(needs).forEach(([k,n]) => bagAdd(k, -n)); bagAdd('bronze'); save(); drawHud(); sfx('pick'); burst(furnace.position.clone(), 0xd9a441, 18); hideCard(); toast('You made a bronze ingot!'); };
}
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
function useBuildSite() {
  const st = S.home || 0; if (st >= 3) return useHouse();
  const stage = HOME_STAGES[st], ok = enough(stage.needs);
  showCard(`<div class="kicker">YOUR HOME</div><h2>Build ${stage.name}</h2><p>Grandma's hut blew away in the Great Gust. Build a new one, one step at a time. Step ${st + 1} of 3.</p>
    <h4>You need</h4><p>${needText(stage.needs)}</p><h4>How to get them</h4><p>Chop trees for logs (stone axe). Break rocks for stone (stone pickaxe). Cut bushes for grass fiber.</p>
    ${ok ? '<button id="buildHome">Build it</button>' : ''}`, ok ? 'Later' : 'Got it');
  if (ok) $('buildHome').onclick = () => {
    Object.entries(stage.needs).forEach(([k,n]) => bagAdd(k, -n)); S.home = st + 1; save(); drawHome(); drawHud(); hideCard();
    sfx('till'); setTimeout(() => sfx('pick'), 250); burst(buildSite.position.clone(), 0xc98f58, 30);
    if (S.home === 3) { [523,659,784,1047].forEach((f,i) => setTimeout(() => chime(f), i*160)); burst(house.position.clone().setY(2), 0xffc857, 30);
      showAha('thatch', () => openDialog('Nana Gale', "A real home again! Built with your own two hands. Well, and a very determined axe. Go on inside. And dear? Try not to let the sky blow this one away.", [], S.hearts.nana)); }
    else toast(`You built ${stage.name}! Next: ${HOME_STAGES[S.home].name}.`);
  };
}
function homeStep() { // what the home-building goal says right now
  if (!S.tools.axe) return enough(CRAFTS[0].needs) ? { text:'Tap the tree stump to craft a stone axe.', target:workbench } : { text:`Pick up sticks, stones, and grass around your island. For a stone axe: ${needText(CRAFTS[0].needs)}.`, target:pickupGroup.children[0] || null };
  if (!S.tools.pick) return enough(CRAFTS[1].needs) ? { text:'Tap the tree stump to craft a stone pickaxe.', target:workbench } : { text:`Gather for a stone pickaxe: ${needText(CRAFTS[1].needs)}. Look for grey stones on the ground. More appear each morning.`, target:pickupGroup.children.find(g => S.pickups[g.userData.i]?.t === 'stone') || pickupGroup.children[0] || null };
  const stage = HOME_STAGES[S.home || 0];
  if (enough(stage.needs)) return { text:`Tap your home site to build ${stage.name}.`, target:buildSite };
  const short = Object.entries(stage.needs).find(([k,n]) => have(k) < n)[0];
  const tg = short === 'log' ? woodTrees.find(t => S.chopped[t.userData.key] !== S.day && t.parent === scene) : short === 'stone' ? rocks.find(r => S.chopped[r.userData.key] !== S.day) : bushes.find(b => S.chopped[b.userData.key] !== S.day);
  return { text:`Gather for ${stage.name}: ${needText(stage.needs)}.`, target: tg || buildSite };
}
function homeHint() { return (S.home || 0) < 3 ? homeStep().text : ''; }
function useCampfire() { openDialog('Campfire', (S.home || 0) < 3 ? 'Until your home is built, you sleep out here under the stars. Sleep until morning?' : 'A cozy fire. Sleep out here tonight, under the stars?', [{ label:'Sleep', fn:() => { closeDialog(); player.position.set(campfire.position.x + .9, 0, campfire.position.z + .9); player.rotation.y = -2.4; goSleep('outside'); } }]); }
function useHouse() {
  if ((S.home || 0) < 3) return useBuildSite();
  openDialog('Your Hut', 'Home sweet home.', [{ label:'Go inside', fn:() => { closeDialog(); enterHut(); } }]);
}
function enterHut() { S.where = 'hut'; player.position.set(ROOM.x, 0, ROOM.z + 2.2); target = null; pending = null; snapCam(); sfx('door'); drawRoom(); drawHud(); save(); }
function exitHut() { S.where = 'home'; player.position.set(-4, 0, -1.3); target = null; pending = null; snapCam(); sfx('door'); drawHud(); save(); }
function useSpot(i) {
  const cur = S.placed[i], sp = SPOTS[i], info = CAT_INFO[sp.cat];
  if (cur) { openDialog('Your Hut', `Take down the ${FURN[cur].name}? It goes back in your bag, and you can put it somewhere else.`, [{ label:'Take it down', fn:() => { S.placed[i] = null; drawRoom(); save(); closeDialog(); } }]); return; }
  const fits = Object.entries(S.furn).filter(([k,n]) => FURN_CAT[k] === sp.cat && n > S.placed.filter(x => x === k).length);
  if (!fits.length) { const owned = Object.entries(S.furn).some(([k,n]) => n > 0 && FURN_CAT[k] === sp.cat);
    toast(owned ? `This spot is for ${info.need}. Yours is already placed somewhere else.` : `This spot is for ${info.need}. ${info.buy}`); return; }
  showCard(`<div class="kicker">DECORATE</div><h2>${info.label}</h2><p>This spot is for ${info.need}. Pick one to place here.</p><div class="jlist">${fits.map(([k]) => `<button data-p="${k}">${FURN[k].name}</button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { S.placed[i] = b.dataset.p; hideCard(); drawRoom(); save(); sfx('plant');
    burst(new THREE.Vector3(ROOM.x + sp.x, (sp.y || 0) + .2, ROOM.z + sp.z), 0xffc857, 10); });
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
  let msg = passedOut ? 'You were so tired you fell asleep. New day!' : raining ? (season() === 3 ? 'Good morning! Snow watered your crops.' : 'Good morning! Rain watered your crops.') : 'Good morning!';
  const turned = seasonCheck(); if (turned) msg = turned;
  else if (S.sprinklers && !raining) msg += ' Your sprinkler watered the garden.';
  const fz = festival(); if (fz && !S.fests[fz.id + fz.year]) msg = `Today is ${fz.name}! Talk to ${NEIGHBORS[fz.host].name}.`;
  S.tiles.forEach((_, i) => drawTile(i));
  spawnDigs(); applySeason(); S.goals = null; ensureGoals(); peopleNewDay();
  S.pickups = S.pickups || []; spawnPickups();
  if (where === 'outside') { if (S.where === 'hut') S.where = 'home'; } // you wake up right where you slept
  else if ((S.home || 0) < 3) { S.where = 'home'; player.position.set(campfire.position.x + .8, 0, campfire.position.z + .6); } else { S.where = 'hut'; player.position.set(ROOM.x - 1.4, 0, ROOM.z - .8); }
  target = null; pending = null; if (!cine) snapCam();
  toast(msg); drawRoom(); drawHud(); save(); cloudPush(true);
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
    lying = true; if (S.t < .89) S.t = .89; // late enough that the stars are out
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
    player.position.set(bw.x, .42, bw.z + .15); player.rotation.y = 0; lying = true;
    const up = bw.clone().add(V(1.4, 2.4, 2.4)), look = bw.clone().setY(.5);
    await shot(1.5, camera.position, up, player.position.clone().setY(.8), look); await wait(900);
    await fadeTo(true, true);
    sleep(passedOut, 'bed'); player.position.set(bw.x, .42, bw.z + .15); lying = true; camera.position.copy(up);
    cine = { t:0, dur:.01, p0:up, p1:up, l0:look, l1:look, res:() => {} };
    await wait(500); await fadeTo(false, true); sfx('bird'); await wait(1300);
    lying = false; player.position.set(ROOM.x - 1.4, 0, ROOM.z - .8); await wait(200);
  }
  cine = null; document.body.classList.remove('in-cine');
}
// ============ INPUT ============
addEventListener('pointerup', () => { if (fish3) fish3.press(false); });
const ray = new THREE.Raycaster(), down = new THREE.Raycaster(), ptr = new THREE.Vector2(), DOWN = new THREE.Vector3(0,-1,0);
let target = null, pending = null;
lobes.forEach(L => lateClicks.push(...L.extra));
const clickables = [...decos, ...nodes, kiln, furnace, pickupGroup, buildSite, workbench, campfire, ...woodTrees, ...rocks, ...bushes, ...(ownerNpc ? [ownerNpc] : []), mailbox, homeDock, greatBell, bellFrame, lumberPile, ship2, ...siteGroups, house, crate, sign, sign2, windmill, stakes, boulder, easel, darkroom, crystals, sundial, ship, pot, dock, bed, doormat, shelf, ...spotGroups, ...fruitTrees, ...tileGroups, ...Object.values(npcs)];
// ============ FREE BUILDING ============
const PIECES = [
  { id:'path',    name:'Stone Path',     cost:{ stone:2 } },
  { id:'deck',    name:'Wood Floor',     cost:{ log:1 } },
  { id:'fence',   name:'Fence',          cost:{ log:1 } },
  { id:'hedge',   name:'Hedge',          cost:{ fiber:2 } },
  { id:'wallw',   name:'Wood Wall',      cost:{ log:2 } },
  { id:'walls',   name:'Stone Wall',     cost:{ stone:3 } },
  { id:'lamp',    name:'Lamp Post',      cost:{ log:1, stone:1 } },
  { id:'bench',   name:'Bench',          cost:{ log:2 } },
  { id:'planter', name:'Flower Planter', cost:{ log:1, fiber:1 } },
  { id:'arch',    name:'Garden Arch',    cost:{ log:3, fiber:2 } },
  { id:'bpath',   name:'Brick Path',     cost:{ brick:2 }, age:'kiln' },
  { id:'bwall',   name:'Brick Wall',     cost:{ brick:3 }, age:'kiln' },
  { id:'potplant',name:'Pot Planter',    cost:{ pot:1, fiber:1 }, age:'kiln' },
  { id:'chest',   name:'Storage Chest',  cost:{ log:4, stone:2 } },
  { id:'blamp',   name:'Bronze Lantern', cost:{ bronze:1, stone:1 }, age:'furnace' },
  { id:'statue',  name:'Statue of Pip',  cost:{ bronze:2, stone:4 }, age:'furnace' },
];
const lampLights = [];
function pieceModel(id) {
  const g = new THREE.Group(), wood = mat(0xc98f58), dark = mat(0x9b6b4a), stoneM = mat(0xc9c1d0);
  if (id === 'path') for (let i=0;i<4;i++){ const st = mesh(new THREE.CylinderGeometry(.24,.26,.06,7), stoneM, (i%2-.5)*.48, .03, (Math.floor(i/2)-.5)*.48); st.rotation.y = i; g.add(st); }
  if (id === 'deck') for (let i=0;i<4;i++) g.add(mesh(new THREE.BoxGeometry(.98,.08,.23), i%2 ? wood : mat(0xd9a066), 0, .04, -.37 + i*.245));
  if (id === 'fence') { [-.45,0,.45].forEach(x => g.add(mesh(new THREE.BoxGeometry(.08,.6,.08), mat(0xfff1d6), x, .3, 0))); [.2,.45].forEach(y => g.add(mesh(new THREE.BoxGeometry(1,.06,.05), mat(0xfff1d6), 0, y, 0))); }
  if (id === 'hedge') { const hm = mat(0x4fb46a); g.add(mesh(new THREE.BoxGeometry(.95,.7,.5), hm, 0, .35, 0)); [-.3,.3].forEach(x => g.add(mesh(sph(.3), hm, x, .62, 0))); }
  if (id === 'wallw') for (let k=0;k<3;k++) g.add(mesh(new THREE.BoxGeometry(1,.36,.14), k%2 ? wood : mat(0xd9a066), 0, .18 + k*.37, 0));
  if (id === 'walls') for (let k=0;k<3;k++) for (let j=0;j<2;j++) g.add(mesh(new THREE.BoxGeometry(.48,.32,.3), stoneM, -.25 + j*.5 + (k%2)*.08, .16 + k*.33, 0));
  if (id === 'lamp') { g.add(mesh(new THREE.CylinderGeometry(.05,.07,1.5,8), dark, 0, .75, 0)); g.add(mesh(new THREE.BoxGeometry(.28,.3,.28), glow(0xffe0a8), 0, 1.6, 0)); g.add(mesh(new THREE.ConeGeometry(.24,.18,4), dark, 0, 1.84, 0).rotateY(Math.PI/4));
    const lh = halo(0xffc46b, 2.2, 0); lh.position.y = 1.6; g.add(lh); lampLights.push(lh); }
  if (id === 'bench') { g.add(mesh(new THREE.BoxGeometry(.95,.08,.38), wood, 0, .4, 0)); g.add(mesh(new THREE.BoxGeometry(.95,.3,.06), wood, 0, .62, -.18)); [-.4,.4].forEach(x => g.add(mesh(new THREE.BoxGeometry(.08,.4,.34), dark, x, .2, 0))); }
  if (id === 'planter') { g.add(mesh(new THREE.BoxGeometry(.8,.3,.5), wood, 0, .15, 0)); for (let i=0;i<6;i++) g.add(mesh(sph(.08), mat([0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff,0xffb36b,0xff8fa3][i]), -.28 + (i%3)*.28, .36, -.1 + Math.floor(i/3)*.2)); }
  if (id === 'bpath') for (let i=0;i<8;i++) g.add(mesh(new THREE.BoxGeometry(.46,.06,.22), mat(i%3 ? 0xc0703f : 0xa85c34), (i%2 ? .24 : -.24) + (Math.floor(i/2)%2 ? .06 : 0), .03, -.36 + Math.floor(i/2)*.24));
  if (id === 'bwall') for (let k=0;k<4;k++) for (let j=0;j<3;j++) g.add(mesh(new THREE.BoxGeometry(.31,.22,.26), mat((k+j)%2 ? 0xc0703f : 0xa85c34), -.33 + j*.33 + (k%2)*.08, .12 + k*.24, 0));
  if (id === 'potplant') { g.add(mesh(new THREE.CylinderGeometry(.26,.18,.36,14), mat(0xc0703f), 0, .18, 0)); for (let i=0;i<5;i++){ const l = mesh(new THREE.ConeGeometry(.07,.4,5), mat(0x4fb46a), Math.cos(i)*.1, .5, Math.sin(i)*.1); l.rotation.set(Math.sin(i)*.4, 0, Math.cos(i)*.4); g.add(l); } }
  if (id === 'blamp') { g.add(mesh(new THREE.CylinderGeometry(.05,.08,1.3,8), mat(0xd9a441, { metalness:.6, roughness:.35 }), 0, .65, 0)); g.add(mesh(new THREE.SphereGeometry(.2,12,10), glow(0xffe0a8), 0, 1.42, 0)); g.add(mesh(new THREE.ConeGeometry(.24,.2,8), mat(0xd9a441, { metalness:.6, roughness:.35 }), 0, 1.66, 0));
    const lh = halo(0xffc46b, 2.4, 0); lh.position.y = 1.42; g.add(lh); lampLights.push(lh); }
  if (id === 'statue') { const br = mat(0xc9924a, { metalness:.55, roughness:.4 }); g.add(mesh(new THREE.BoxGeometry(.7,.35,.7), mat(0xc9c1d0), 0, .17, 0)); g.add(mesh(sph(.32), br, 0, .62, 0)); g.add(mesh(sph(.26), br, 0, 1.05, 0));
    const bk = mesh(new THREE.ConeGeometry(.06,.14,6), br, 0, 1.02, .28); bk.rotation.x = Math.PI/2; g.add(bk); g.add(mesh(new THREE.CylinderGeometry(.2,.22,.08,14), br, 0, 1.3, 0)); g.add(mesh(new THREE.CylinderGeometry(.13,.15,.2,14), br, 0, 1.42, 0)); }
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
    const g = new THREE.Group(); g.position.set(4, 0, 5.1); tradeGroup.add(g);
    g.add(mesh(new THREE.CylinderGeometry(.09,.13,1,7), mat(0x7a5236), 0, .5, 0));
    [[0,1.15,0,.55],[.35,.95,.1,.38],[-.32,.98,-.05,.4]].forEach(([x,y,z,r]) => g.add(mesh(sph(r), mat(sp.leaf), x, y, z)));
    for (let i = 0; i < 7; i++) { const a = i*.9, pod = mesh(new THREE.SphereGeometry(.12,8,6), mat(sp.color), Math.cos(a)*.52, .75 + (i%3)*.18, Math.sin(a)*.45); pod.scale.y = 1.5; g.add(pod); }
    const h = hitBox(1.3, 1.8, 1.3); h.position.y = .9; g.add(h); deco(g, pickSpecialty); }
  if (code && featureOn('heirloom')) {
    const f = heirloomOf(code), g = new THREE.Group(); g.position.set(1.6, 0, 5.2); tradeGroup.add(g);
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
  toast(`+3 ${plural(sp.id, 3)}. This is your island's specialty. It sells for ${HOME_PRICE * AWAY_MULT} coins on a friend's island, so gift it and trade.`);
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
  const g = new THREE.Group(), s = sph, M = mat, wingM = new THREE.MeshStandardMaterial({ color:0xffffff, transparent:true, opacity:.6, side:THREE.DoubleSide });
  const wings = (w, h, c, y = .05) => { const m = c ? new THREE.MeshStandardMaterial({ color:c, side:THREE.DoubleSide }) : wingM, geo = new THREE.PlaneGeometry(w, h); geo.rotateX(-Math.PI/2); geo.translate(w/2, 0, 0);
    const l = new THREE.Mesh(geo, m), r = new THREE.Mesh(geo, m); r.scale.x = -1; l.position.y = r.position.y = y; g.add(l, r); g.userData.wings = [l, r]; };
  if (id === 'honeybee') { const b = mesh(s(.07), M(0xffc857)); b.scale.set(1, .85, 1.4); g.add(b); [-.04,.04].forEach(z => { const st = mesh(new THREE.TorusGeometry(.062,.012,6,16), M(0x2b2233), 0, 0, z); g.add(st); }); wings(.09, .06); }
  if (id === 'ladybird') { const b = mesh(new THREE.SphereGeometry(.07, 12, 8, 0, Math.PI*2, 0, Math.PI/2), M(0xd8323c)); g.add(b); g.add(mesh(s(.035), M(0x2b2233), 0, .01, .06)); [[.03,.03],[-.03,.03],[.035,-.02],[-.035,-.02],[0,.05]].forEach(([x,z]) => g.add(mesh(s(.014), M(0x2b2233), x, .05, z))); }
  if (id === 'dragonfly') { const b = mesh(new THREE.CylinderGeometry(.015, .01, .3, 6), M(0x3fbf8f)); b.rotation.x = Math.PI/2; g.add(b); g.add(mesh(s(.03), M(0x5b8fd6), 0, 0, .15)); wings(.16, .04); const w2 = g.userData.wings; wings(.14, .035); g.userData.wings.forEach(w => w.position.z = -.05); g.userData.wings.push(...w2); }
  if (id === 'hopper' || id === 'mantis') { const c = id === 'mantis' ? 0x8fdc8a : 0x7fb069, b = mesh(new THREE.CapsuleGeometry(.03, .14, 4, 8), M(c)); b.rotation.x = Math.PI/2 - (id === 'mantis' ? .9 : 0); g.add(b);
    [-1,1].forEach(sd => { const leg = mesh(new THREE.CylinderGeometry(.008, .008, .14, 4), M(c), sd*.04, .01, -.04); leg.rotation.z = sd*.9; g.add(leg); }); g.add(mesh(s(.028), M(c), 0, id === 'mantis' ? .1 : .02, .09)); }
  if (id === 'cicada') { const b = mesh(s(.06), M(0x5f6b3a)); b.scale.set(1, .8, 1.6); g.add(b); g.add(mesh(s(.02), M(0xd8323c), .04, .03, .08)); g.add(mesh(s(.02), M(0xd8323c), -.04, .03, .08)); wings(.08, .14); }
  if (id === 'stagbeetle') { const b = mesh(s(.08), M(0x4a2e1f)); b.scale.set(.9, .5, 1.3); g.add(b); [-1,1].forEach(sd => { const m = mesh(new THREE.ConeGeometry(.015, .1, 5), M(0x6b3a22), sd*.03, .01, .14); m.rotation.x = Math.PI/2; m.rotation.z = sd*.4; g.add(m); }); }
  if (id === 'firefly') { const b = mesh(s(.03), M(0x3b2f4a)); g.add(b); const t = mesh(s(.025), glow(0xfff38a), 0, 0, -.03); g.add(t); const h = halo(0xfff38a, .5, .9); g.add(h); g.userData.halo = h; wings(.04, .03); }
  if (id === 'lunamoth') { g.add(mesh(new THREE.CapsuleGeometry(.018, .06, 4, 6), M(0xf2f0e0))); wings(.14, .12, 0xc8f0b0); }
  if (id === 'springtail') { const b = mesh(s(.03), M(0x6a6f8a)); b.scale.set(1, .7, 1.4); g.add(b); }
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
    if (u.wings) { const f = Math.sin(now * (b.id === 'lunamoth' ? 8 : 40) + u.ph) * (b.where === 'air' ? .9 : .15); u.wings[0].rotation.z = f; u.wings[1].rotation.z = -f; }
    if (b.where === 'air') { const t = now * .5 + u.ph; g.position.set(u.ax + Math.sin(t) * 1.4, u.ay + Math.sin(t * 2.3) * .25, u.az + Math.cos(t * .8) * 1.4); g.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t * .8)); }
    if (b.where === 'ground') { u.hop -= dt; if (u.hop <= 0) { u.hop = 1.5 + Math.random() * 2.5; u.hx = (Math.random()-.5) * .8; u.hz = (Math.random()-.5) * .8; u.ht = 0; }
      if (u.ht != null && u.ht < .45) { u.ht += dt; const k = u.ht / .45; g.position.x += u.hx * dt / .45; g.position.z += u.hz * dt / .45; g.position.y = u.ay + Math.sin(k * Math.PI) * .35; } }
    if (u.halo) u.halo.material.opacity = .5 + Math.sin(now * 3 + u.ph) * .4; });
}
// swing the net: most bugs are caught, but flying ones are quick
let netMesh = null;
function swingNet(g, b, onMiss) {
  if (!S.tools.net) { toast('You need a bug net. Make one at the tree stump workbench with grass fiber and sticks.'); return; }
  if (!netMesh) { netMesh = new THREE.Group(); netMesh.add(mesh(new THREE.CylinderGeometry(.02,.025,1.2,6), mat(0x9b6b4a), 0, .6, 0));
    const hoop = mesh(new THREE.TorusGeometry(.22, .02, 6, 20), mat(0xfff1d6), 0, 1.35, 0); netMesh.add(hoop); const bag = mesh(new THREE.ConeGeometry(.2, .35, 12, 1, true), new THREE.MeshStandardMaterial({ color:0xffffff, transparent:true, opacity:.55, side:THREE.DoubleSide }), 0, 1.35, -.17); bag.rotation.x = -Math.PI/2; netMesh.add(bag); }
  player.add(netMesh); netMesh.position.set(.35, .8, .2); netMesh.rotation.set(-1.4, 0, 0); swingT = .5; sfx('swish');
  const wp = new THREE.Vector3(); g.getWorldPosition(wp); player.rotation.y = Math.atan2(wp.x - player.position.x, wp.z - player.position.z);
  let k = 0; const sw = setInterval(() => { k += .1; netMesh.rotation.x = -1.4 + Math.sin(k * Math.PI) * 1.6; if (k >= 1) { clearInterval(sw); player.remove(netMesh); } }, 30);
  const got = Math.random() < (b.where === 'air' ? .72 : .9);
  setTimeout(() => {
    if (!got) { onMiss && onMiss(); toast(`Missed! The ${b.name.toLowerCase()} got away.`); return; }
    if (g.parent === bugGroup) bugGroup.remove(g); else g.userData.flee = 1.2;
    const isNew = !(S.bugs || []).includes(b.id); if (isNew) S.bugs = [...(S.bugs || []), b.id]; lean('explorer'); save(); drawHud();
    [784,988,1175].forEach((f,i) => setTimeout(() => chime(f), i*90)); burst(wp, 0xfff3a0, 12);
    showCard(`<div class="kicker">${isNew ? `NEW BUG! ${(S.bugs || []).length} of ${BUTTERFLIES.length + INSECTS.length}` : 'BUG NET'}</div><h2>${icon(b.id)} You caught a ${b.name}!</h2>
      ${isNew ? `<h4>In real life</h4><p>${b.fact}</p>` : `<p>It sells for ${ITEMS[b.id].sell} coins, or you can let it go.</p>`}
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
let sitting = null, danceT = 0;
const onPath = () => S.where === 'home' && (S.builds || []).some(b => (b.p === 'path' || b.p === 'bpath') && Math.abs(player.position.x - b.x) < .5 && Math.abs(player.position.z - b.z) < .5);
function usePiece(o) {
  const b = o.userData.b, p = PIECES.find(x => x.id === b.p);
  if (b.p === 'path' || b.p === 'bpath') return toast(TAP_FACTS.path);
  if (b.p === 'bench') { sitting = o; player.position.set(b.x, 0, b.z); player.rotation.y = (b.r || 0) * Math.PI/2; toast('You sit and rest. Time passes 3 times faster. Tap anywhere to get up.'); return; }
  if (b.p === 'lamp' || b.p === 'blamp') { b.off = !b.off; drawBuilds(); save(); sfx('click'); toast(b.off ? 'Lamp off.' : 'Lamp on. It glows at night.'); return; }
  if (b.p === 'planter' || b.p === 'potplant') return pickSeeds(`pl${b.x},${b.z}`);
  if (b.p === 'hedge') { if (!canCarry('fiber')) return bagFull(); if (!daily(`hg${b.x},${b.z}`)) { toast('You already trimmed this hedge today.'); return; }
    gain('fiber', 1, o.position.clone(), true); sfx('swish'); toast(`You trimmed the hedge. +1 grass fiber. ${TAP_FACTS.hedge}`); return; }
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
    <h4>In storage</h4>${box.length ? `<div class="igrid">${box.map(([k,n]) => tile(k, n, 'out')).join('')}</div>` : '<p>Empty.</p>'}
    ${spaceMeter(slotsIn(S.bag), packCap(), 'Backpack')}
    <h4>In your bag</h4>${bag.length ? `<div class="igrid">${bag.map(([k,n]) => tile(k, n, 'in')).join('')}</div>` : '<p>Empty.</p>'}
    <div style="margin-top:10px"><button id="chMat" class="ghost">Put away all materials</button> <button id="chAll" class="ghost">Take everything</button></div>
    ${canBand ? `<h4>Upgrade this chest</h4><p>Add bronze bands to make this chest hold twice as much (24 more slots). Real chests were made stronger with metal bands. Needs ${needText({ bronze:2 })}.</p><button id="chBand">Add bronze bands</button>` : chest?.band ? '<p style="margin-top:8px">This chest has bronze bands: it holds 48 slots.</p>' : ''}`);
  let short = false;
  const move = (k, into) => { const from = into ? S.bag : S.chest, to = into ? S.chest : S.bag, n = from[k] || 0; if (!n) return;
    const fit = roomFor(to, into ? storeCap() : packCap(), k, n); if (fit < n) short = true; if (!fit) return;
    to[k] = (to[k] || 0) + fit; from[k] -= fit; if (from[k] <= 0) delete from[k]; };
  const done = () => { sfx('click'); save(); drawHud(); openChest(chest); if (short) toast('Not enough room for all of it. Build another chest or get a bigger bag.'); };
  document.querySelectorAll('[data-in]').forEach(b => b.onclick = () => { move(b.dataset.in, true); done(); });
  document.querySelectorAll('[data-out]').forEach(b => b.onclick = () => { move(b.dataset.out, false); done(); });
  $('chMat').onclick = () => { Object.keys(S.bag).filter(k => ITEMS[k]?.kind === 'material').forEach(k => move(k, true)); done(); };
  $('chAll').onclick = () => { Object.keys(S.chest).forEach(k => move(k, false)); done(); };
  if ($('chBand')) $('chBand').onclick = () => { if (!enough({ bronze:2 })) { toast(`Not enough yet. Needs ${needText({ bronze:2 })}.`); return; }
    bagAdd('bronze', -2); chest.band = true; drawBuilds(); save(); drawHud(); sfx('ting'); toast('Bronze bands added. This chest now holds 48 slots.'); openChest(chest); };
}
function drawBuilds() {
  buildGroup.clear(); lampLights.length = 0;
  (S.builds || []).forEach(b => { const m = pieceModel(b.p); m.position.set(b.x, 0, b.z); m.rotation.y = (b.r || 0) * Math.PI/2; buildGroup.add(m);
    if (!m.userData.kind) m.userData = { kind:'piece', b }; else m.userData.b = b;
    if (b.p === 'chest' && b.band) [-.2,.2].forEach(z => m.add(mesh(new THREE.BoxGeometry(.84,.06,.05), mat(0xd9a441, { metalness:.55, roughness:.4 }), 0, .3, z*1.35)));
    if (b.c) m.traverse(o => { if (o.isMesh && o.material?.color && !o.material.isMeshBasicMaterial) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(b.c), .7); } });
    if (b.off) m.traverse(o => { if (lampLights.includes(o)) { o.visible = false; lampLights.splice(lampLights.indexOf(o), 1); } else if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.visible !== false) { o.material = o.material.clone(); o.material.color.set(0x8a8290); } }); });
  if (typeof tameOutlines === 'function' && outline) tameOutlines();
}
// places you can't build over, so the important things stay reachable
function blockedAt(x, z) {
  if (!onLand(x, z)) return 'That is too close to the edge.';
  const circles = [[-2.8,4.6,1.2],[4,5.1,1],[1.6,5.2,.9],[-5.2,2.1,1],[-7.2,-2.7,1],[-7.9,-2.2,.8],[3.5,-7.4,.8],[-4,-3,2],[5,-2.6,.9],[8.2,1.6,1],[-1.7,-1.6,.7],[-6.1,.5,.8],[-3.3,.9,.9],[-1.6,1.2,1],[.3,-5.6,1.3],[-1,-5.2,.9],[-4.2,3,.9],[7.4,-4.4,1.2],[8.4,1.2,1.2]];
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
function drawBuildBar() {
  const bar = $('buildbar');
  bar.innerHTML = `<p class="bhelp">${held ? `Holding your ${PIECES.find(x => x.id === held.p).name.toLowerCase()}. Tap an empty square to set it down. Rotate turns it.` : moving ? 'Tap a piece you built to pick it up and move it.' : removing ? 'Tap a piece to pick it up. You get its materials back.' : 'Pick a piece, then tap a square on the grid to place it.'} You have ${have('log')} logs, ${have('stone')} stone, ${have('fiber')} grass.</p>
    <div class="bpieces">${PIECES.filter(p => (!p.age || S.stations[p.age]) && (p.id !== 'chest' || featureOn('chest'))).map(p => { const ok = enough(p.cost); return `<button data-pc="${p.id}" class="${buildSel === p.id && !removing ? 'on' : ''}" ${ok ? '' : 'style="opacity:.45"'}>${p.name}<small>${Object.entries(p.cost).map(([k,n]) => `${n} ${ITEMS[k].name.toLowerCase().replace('grass fiber','grass')}`).join(', ')}</small></button>`; }).join('')}</div>
    <div class="bctl"><button id="bRot">Rotate</button><button id="bMove" class="${moving ? 'on' : ''}">Move</button><button id="bRem" class="${removing ? 'on' : ''}">Remove</button><button id="bTidy">Tidy up</button><button id="bDone" class="done">Done</button></div>`;
  bar.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { dropHeld(); buildSel = b.dataset.pc; removing = moving = false; drawBuildBar(); });
  ghostPiece();
  $('bRot').onclick = () => { if (held) { held.r = ((held.r || 0) + 1) % 4; ghostPiece(); toast('Turned the piece you are holding.'); return; }
    buildRot = (buildRot + 1) % 4; toast('Turned. Pieces you place now face the new way.'); };
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
function ghostPiece() { if (ghostModel) { ghost.remove(ghostModel); ghostModel = null; } if (!held) return;
  ghostModel = pieceModel(held.p); ghostModel.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .6; } });
  ghostModel.rotation.set(Math.PI/2, 0, 0); ghostModel.rotateY((held.r || 0) * Math.PI/2); ghost.add(ghostModel); }
function setBuildMode(on) {
  if (!on) dropHeld();
  if (on && ((S.home || 0) < 3 || S.where !== 'home' || VISIT)) { toast((S.home || 0) < 3 ? 'Finish building your home first.' : 'You can build on your home island.'); return; }
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
  const idx = S.builds.findIndex(b => b.x === c.x && b.z === c.z);
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
  if (!enough(p.cost)) { toast(`Not enough materials for a ${p.name.toLowerCase()}. Chop trees, break rocks, and cut bushes.`); return; }
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
renderer.domElement.addEventListener('pointerdown', e => {
  if (fish3) { fish3.press(true); return; }
  if (cine) return;
  if ($('title').style.display !== 'none' || $('veil').classList.contains('show')) return;
  if (buildMode) return buildTap(e);
  closeDialog();
  ptr.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects([...clickables, ...lateClicks, ...digGroups], true).find(h => { for (let o = h.object; o; o = o.parent) if (!o.visible) return false; return true; });
  if (hit) {
    let o = hit.object; while (o && !o.userData.kind) o = o.parent;
    if (o) { const wp = new THREE.Vector3(); o.getWorldPosition(wp); target = wp; pending = o; return; }
  }
  const g = ray.intersectObjects(walkables, false)[0];
  if (g) { target = g.point.clone(); pending = null; }
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
  showCard(`<div class="kicker">LEAVE A GIFT</div><h2>A gift for ${VISIT.name}</h2><p>Pick one thing from your bag. They get it next time they play.</p><div class="jlist">${opts.map(([k,n]) => `<button data-vg="${k}">${ITEMS[k].name} x${n}</button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-vg]').forEach(b => b.onclick = async () => { const k = b.dataset.vg; hideCard();
    const res = await visitAction('gift', k);
    if (res === 'ok') { mine.bag[k]--; if (mine.bag[k] <= 0) delete mine.bag[k]; saveMine(); sfx('heart'); burst(ownerNpc.position, 0xff8fa3, 20); toast(`You left ${VISIT.name} a ${ITEMS[k].name}!`); }
    else toast(res === 'already' ? `You already left ${VISIT.name} a gift today.` : 'Could not reach the cloud. Try again.'); });
}
function arrive(o) {
  const k = o.userData.kind;
  if (VISIT) {
    if (k === 'deco' && o.userData.market && featureOn('market')) return openMarket();
    if (k === 'owner') return openDialog(VISIT.name, `Welcome to my island! Thanks for visiting.`, [{ label:'Leave a gift', fn:() => { closeDialog(); visitGift(); } }, { label:'Water my garden', fn:() => { closeDialog(); visitWater(); } }, { label:'Go home', fn:goHome }], null, 'none');
    if (k === 'tile') return S.tiles[o.userData.i].s === 2 ? visitWater() : toast(`This is ${VISIT.name}'s garden.`);
    if (k === 'house') return enterHut();
    if (k === 'door') return exitHut();
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
  if (k === 'deco') return o.userData.use(o);
  if (k === 'piece') return usePiece(o);
  if ((k === 'claypit' || k === 'ore') && o.visible) return gatherNode(o);
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
  else if (k === 'house') useHouse();
  else if (k === 'dig') dig(o.userData.i);
  else if (k === 'sundial') useSundial();
  else if (k === 'ship') useShip();
  else if (k === 'pot') usePot();
  else if (k === 'dock') fishing3D(o);
  else if (k === 'fruitTree') useFruitTree(o);
  else if (k === 'bed') openDialog('Your Bed', 'Go to sleep and start a new day? Watered crops will grow.', [{ label:'Sleep', fn:() => { closeDialog(); goSleep('bed'); } }]);
  else if (k === 'door') exitHut();
  else if (k === 'shelf') openJournal();
  else if (k === 'spot') useSpot(o.userData.i);
}
const keys = {};
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
const sky = new THREE.Color(), SKY = [[0,0xffd6c9],[.3,0xbfe3ff],[.65,0xbfe3ff],[.75,0xffb38a],[.82,0xe38aa8],[.9,0x5a4b99],[1,0x1f2552]].map(([t,c])=>[t,new THREE.Color(c)]);
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
function camOffset() { return S.where === 'hut' ? new THREE.Vector3(0, 7.5, 7.8 - ahead()) : new THREE.Vector3(0, 10.5, 11 - ahead()); }
function snapCam() { camera.position.copy(player.position).add(camOffset()); }
const perfCheck = { n:0, sum:0 };
const outline = LOOK === 'a' ? null : new OutlineEffect(renderer, { defaultThickness: LOOK === 'b' ? .0035 : .005, defaultColor: LOOK === 'b' ? [.23,.18,.29] : [.45,.33,.25], defaultAlpha: LOOK === 'b' ? .9 : .7 });
// only solid shaded things get outlines: no glows, sprites, sky, grass blades, or see-through parts
function tameOutlines() { scene.traverse(o => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
  ms.forEach(m => { if (!m.isMeshToonMaterial || m.transparent || o.isInstancedMesh || o.isPoints || o.isSprite) m.userData.outlineParameters = NO_OUTLINE; }); }); }
if (LOOK === 'b') renderer.domElement.style.filter = 'saturate(1.12) contrast(1.04)';
if (LOOK === 'c') { renderer.domElement.style.filter = 'saturate(.88) brightness(1.04) sepia(.08)'; document.body.classList.add('paper'); }
const clock = new THREE.Clock(); let playing = false, hudTick = 0, stepDist = 0;
function tick() {
  const dt = Math.min(.05, clock.getDelta()), now = clock.elapsedTime;
  const menuOpen = $('veil').classList.contains('show') || $('dialog').classList.contains('show');
  if (playing) {
    if (!menuOpen) S.t += dt * (window.__sgSpeed || 1) * (sitting ? 3 : 1) / (DAY_LEN * (S.mode === 'cozy' ? 2 : 1)); // the clock stops while any menu or conversation is open
    if (S.t >= 1 && !cine) goSleep(S.where === 'hut' ? 'bed' : 'outside', true);
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
    sun.intensity = .5; hemi.intensity = 1.25; roomLight.intensity = 6;
    roomWin.color.copy(skyAt(S.t));
  } else {
    scene.background = skyAt(S.t); scene.fog.color.copy(scene.background);
    dome.visible = true; dome.position.copy(camera.position);
    dome.material.uniforms.bottom.value.copy(scene.background);
    dome.material.uniforms.top.value.copy(skyTop.copy(scene.background).offsetHSL(.02, .08, -.2));
    sunGlow.visible = el > .02 && night === 0; sunGlow.material.opacity = .55 * Math.min(1, el * 3);
    sunGlow.position.set(camera.position.x + lean*90, camera.position.y + 10 + el*60, camera.position.z - 110);
    sun.intensity = .45 + el*1.25; hemi.intensity = .6 + el*.4 - night*.15; roomLight.intensity = 0;
  }
  sun.color.setHSL(.08, .6, .72 + el*.23);
  sun.position.set(lean*14 + player.position.x, player.position.y + 1.5 + el*16, lean*5 + 1.2 + player.position.z);
  sun.target.position.copy(player.position);
  starMat.opacity = inside ? 0 : night * .9;
  const mp = moon().idx; if (mp !== moonDrawn) { moonDrawn = mp; const mc = moonCanvas.getContext('2d'); drawMoon(mc, mp, 128);
    const img = mc.getImageData(0,0,128,128); for (let i=0;i<img.data.length;i+=4) if (img.data[i] < 40 && img.data[i+2] > 40 && img.data[i+2] < 70) img.data[i+3] = 0; mc.putImageData(img,0,0); moonTex.needsUpdate = true; }
  moonSprite.visible = !inside && night > 0; moonSprite.material.opacity = night; moonSprite.position.set(player.position.x - 30, player.position.y + 32, player.position.z - 70);
  winMat.emissiveIntensity = night * 1.4 + (h > 18 ? .3 : 0);
  lampLights.forEach(l => l.material.opacity = night * .8);
  // movement
  if (cine) { target = null; pending = null; }
  if (sitting && (target || keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright)) sitting = null;
  let mv = cine ? new THREE.Vector3() : new THREE.Vector3((keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0), 0, (keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0));
  if (mv.lengthSq()) { target = null; pending = null; }
  else if (target) {
    mv.subVectors(target, player.position); mv.y = 0;
    if (mv.length() < (pending ? 1.3 : .1)) { const p = pending; target = null; pending = null; mv.set(0,0,0); if (p) arrive(p); }
  }
  const inner = player.userData.inner;
  if (mv.lengthSq() && !$('veil').classList.contains('show')) {
    mv.normalize().multiplyScalar((S.mode === 'explorer' ? 5.25 : 4.2) * (onPath() ? 1.35 : 1) * dt);
    const nx = player.position.x + mv.x, nz = player.position.z + mv.z;
    let gy = groundAt(nx, player.position.y, nz);
    if (gy === null) { gy = groundAt(nx, player.position.y, player.position.z); if (gy !== null) mv.z = 0; else { gy = groundAt(player.position.x, player.position.y, nz); if (gy !== null) mv.x = 0; } }
    if (gy !== null) {
      player.position.x += mv.x; player.position.z += mv.z; player.position.y = gy;
      if ((stepDist += mv.length()) > .6) { stepDist = 0; sfx(onPlank ? 'wood' : 'step'); }
      player.rotation.y = Math.atan2(mv.x, mv.z);
      inner.position.y = Math.abs(Math.sin(now*14))*.12; inner.rotation.z = Math.sin(now*14)*.06;
    inner.userData.arms.forEach((a, i) => a.rotation.x = Math.sin(now*14 + i*Math.PI) * .7);
      S.pos = [player.position.x, player.position.y, player.position.z];
    } else { target = null; pending = null; }
  } else { inner.position.y *= .8; inner.rotation.z *= .8; inner.scale.y = 1 + Math.sin(now*2.5)*.02; }
  if (swingT > 0) { swingT = Math.max(0, swingT - dt); const a = inner.userData.arms[1] || inner.userData.arms[0], p = 1 - swingT/.5;
    a.rotation.x = p < .35 ? -2.6 * (p/.35) : -2.6 + 2.6 * ((p-.35)/.65); }
  pickupGroup.children.forEach((g, i) => { g.position.y = .06 + Math.sin(now*2.4 + i)*.05; g.rotation.y = now*.6 + i; });
  // life
  if (!inside && !lowGfx) swayTufts(now);
  if (playing && !lowGfx && perfCheck.n < 240 && !document.hidden) { perfCheck.n++; perfCheck.sum += dt;
    if (perfCheck.n === 240 && perfCheck.sum / 240 > 1/32) { setLowGfx(true); toast('Switched to low graphics so the game runs smoother. You can change this in Sync my game.'); } }
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
  winHalos.forEach(hl => hl.material.opacity = winMat.emissiveIntensity * .45);
  smoke.forEach((sm, i) => { const k = ((now*.25 + i/5) % 1); sm.position.set(house.position.x + .75 + Math.sin(k*6 + i)*.2, 3.45 + k*2.2, house.position.z - .35); sm.scale.setScalar(.4 + k*1.1); sm.material.opacity = (1-k) * .35 * (S.where === 'hut' ? 0 : 1); });
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
  animatePools(now); animateBugs(now, dt);
  pulsers.forEach(h => { h.userData.pulse = Math.max(0, h.userData.pulse - dt); h.scale.setScalar(h.userData.base * (1 + h.userData.pulse)); if (!h.userData.pulse) pulsers.delete(h); });
  if (bell.userData.ring > 0) { bell.userData.ring = Math.max(0, bell.userData.ring - dt); bellBody.rotation.z = Math.sin(now*12) * .35 * bell.userData.ring; }
  balloons.children.forEach(b => { if (b.userData.fly) { b.position.y += dt * 1.6; b.position.x += Math.sin(now*2) * dt * .3; if (b.position.y > 25) b.visible = false; } });
  if (sitting) { inner.position.y = -.28; }
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
  lanterns.children.forEach((l, i) => { if (l.geometry.type === 'SphereGeometry') l.position.y = 1.9 + Math.sin(now*1.5 + i)*.05; });
  { const q = S.q5; frameMarker.visible = q < 4; ghostMat.opacity = q === 3 ? .22 + Math.sin(now*3)*.1 : 0; lumberPile.visible = q <= 4; pileGear.visible = q === 4; pileGear.rotation.y = now; framePosts.visible = q >= 4; frameGear.visible = q >= 5; crack.visible = q < 6;
    if (q < 3) { greatBell.position.set(OH.x, OH.y + .6, OH.z + .3); gbSwing.rotation.set(0, 0, 1.35); }
    else if (q < 5) { greatBell.position.set(OH.x, OH.y + .7, OH.z); gbSwing.rotation.set(0, 0, 0); }
    else { greatBell.position.set(OH.x, OH.y + 3.3, OH.z); const r = gbSwing.userData.ring || 0; gbSwing.rotation.set(0, 0, Math.sin(now*3) * .25 * Math.min(1, r)); if (r > 0) gbSwing.userData.ring = r - dt * .5; }
    if (q >= 5) frameGear.rotation.x += dt * (gbSwing.userData.ring > 0 ? 3 : .2); }
  { let tg = questTarget(); if (tg && S.where === 'hut') tg = doormat;
    marker.visible = !!tg && !$('veil').classList.contains('show');
    if (tg) { const wp = new THREE.Vector3(); tg.getWorldPosition(wp); const k = tg.userData.kind;
      marker.position.set(wp.x, wp.y + (MARK_H[k] || 1.9) + Math.sin(now*3)*.15 + (k === 'greatbell' && S.q5 >= 5 ? 1.5 : 0), wp.z); marker.rotation.y = now*1.5; } }
  const wantLit = S.q3 >= 7 && h >= 20; if (wantLit !== lightLit) drawLightBridge(wantLit);
  if (lightLit) lightMat.opacity = .65 + Math.sin(now*2)*.2;
  crystals.children.forEach((c, i) => c.material.emissiveIntensity = .5 + Math.sin(now*1.5 + i)*.3);
  siteGroups.forEach(sg => sg.traverse(o => { if (o.userData.spin) { o.rotation.y = now; o.position.y = 3.9 + Math.sin(now*2)*.15; } }));
  flag.rotation.y = Math.sin(now*3) * .3;
  mflag.rotation.z = S.mailNew ? 0 : -Math.PI/2;
  if (balloons.visible) balloons.children.forEach((b, i) => { if (b.geometry.type === 'SphereGeometry') b.position.y = 2.6 + (i%4)*.15 + Math.sin(now*1.5 + i)*.1; });
  if (kiln.visible) kilnMouth.material.color.setHSL(.07, 1, .5 + Math.sin(now*6)*.08);
  if (furnace.visible) furnaceHalo.material.opacity = .4 + Math.sin(now*5)*.15;
  if (campfire.visible) { flame.scale.set(1 + Math.sin(now*9)*.1, 1 + Math.sin(now*13)*.15, 1); flameHalo.material.opacity = .45 + Math.sin(now*7)*.15; }
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
  requestAnimationFrame(tick);
}
snapCam(); tameOutlines();
bell.visible = S.quest >= 4; sprinkler.visible = S.sprinklers; stakes.visible = !S.bigGarden; rock.visible = !S.boulder; rosettaStone.visible = S.boulder; applyPaint(); drawSites(); spawnDigs(); drawHome(); drawBuilds(); drawStations(); if (!(S.pickups || []).length) spawnPickups(); else drawPickups(); homeDock.visible = S.mode === 'fisher'; if (lowGfx) setLowGfx(true);
drawHud(); tick();
$('moveTitle').onclick = () => openMoveGame();
const localAt = S.savedAt || 0; save();
if (!VISIT) cloudLoad(S.syncKey).then(found => {
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
  const draw = () => {
    showCard(`<div class="kicker">${title}</div><h2>Make your character</h2>
      ${withName ? `<h4>Your name</h4><input id="nm" maxlength="16" value="${name.replace(/"/g,'')}" placeholder="Type a name" autocomplete="off" style="width:100%;font:18px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:8px">` : ''}
      <h4>Skin tone</h4><div class="chips">${sw(SKIN, lk.skin, 'skin')}</div>
      <h4>Hair</h4><div class="chips">${Object.entries(HAIR_STYLES).map(([k,v]) => `<button data-hs="${k}" class="${lk.hair === k ? '' : 'ghost'}">${v}</button>`).join('')}</div>
      <div class="chips">${sw(HAIR_COLORS, lk.hairColor, 'hcol')}</div>
      <h4>Shirt</h4><div class="chips">${sw(SHIRTS, lk.shirt, 'shirt')}</div>
      <h4>Bottoms</h4><div class="chips">${Object.entries(BOTTOMS).map(([k,v]) => `<button data-bt="${k}" class="${lk.bottom === k ? '' : 'ghost'}">${v}</button>`).join('')}</div>
      <div class="chips">${sw(BOTTOM_COLORS, lk.bottomColor, 'bcol')}</div>
      <h4>Hat</h4><div class="chips">${Object.entries({ ...HATS, ...(S.partyHat ? { party:'Party hat' } : {}) }).map(([k,v]) => `<button data-hat="${k}" class="${lk.hat === k ? '' : 'ghost'}">${v}</button>`).join('')}</div>
      ${lk.hat !== 'none' ? `<h4>Hat color</h4><div class="chips">${sw(HAT_COLORS, lk.hatColor, 'hc')}</div>` : ''}
      <p id="lkMsg" style="font-weight:700;min-height:20px;margin-top:8px"></p>
      <button id="lkDone">${withName ? 'Next' : 'Done'}</button>`, null);
    const upd = () => { S.look = { ...lk }; dressPlayer(); };
    if ($('nm')) $('nm').oninput = e => name = e.target.value;
    const pick = (attr, key, num) => document.querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => { lk[key] = num ? +b.dataset[attr] : b.dataset[attr]; upd(); draw(); });
    pick('skin','skin',1); pick('hs','hair'); pick('hcol','hairColor',1); pick('shirt','shirt',1); pick('bt','bottom'); pick('bcol','bottomColor',1);
    document.querySelectorAll('[data-hat]').forEach(b => b.onclick = () => { lk.hat = b.dataset.hat; upd(); draw(); });
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
    showCard(`<div class="kicker">${o.returning ? 'WELCOME BACK' : o.switching ? 'YOUR ISLAND' : 'NEW GAME'}</div><h2>Choose your island</h2><p>${o.returning || o.switching ? 'Each island has its own perks. Your progress, coins, and collections stay exactly as they are. The perks are added on top.' : 'Each island has its own perks. You pick once, at the start.'}</p>
      <div class="jlist">${MODES.map(m => `<button data-md="${m.id}" style="${pick === m.id ? 'background:#ffc857' : ''}">${pick === m.id ? '✓ ' : ''}${m.name} <span class="sub">${m.blurb}</span><span class="sub" style="display:block;margin-top:2px">${m.perks.map(x => '• ' + x).join('<br>')}</span></button>`).join('')}</div>
      <p id="mdMsg" style="font-weight:700;min-height:20px;margin-top:8px"></p>
      <button id="mdGo">${o.switching ? 'Switch to this island' : o.returning ? 'Keep playing' : 'Start my adventure'}</button> <button id="mdBack" class="ghost">${o.switching ? 'Never mind' : 'Back'}</button>`, null);
    document.querySelectorAll('[data-md]').forEach(b => b.onclick = () => { pick = b.dataset.md; draw(); });
    $('mdBack').onclick = () => o.switching ? (endSetup(), done()) : lookPicker(o.returning ? 'WELCOME BACK' : 'NEW GAME', () => modePicker(done, o), true);
    $('mdGo').onclick = () => { if (!pick) { $('mdMsg').textContent = 'Pick an island first.'; return; } S.mode = pick; applyModeStart(); if (o.switching || o.returning) toast(`Welcome to ${MODES.find(m => m.id === pick).name}! Everything you had is still here.`); done(); };
  };
  draw();
}
function applyModeStart() {
  if (S.mode === 'garden' && !S.bigGarden) { S.bigGarden = true; for (let i=0;i<3;i++){ S.tiles.push({ s:0 }); addTileGroup(S.tiles.length-1); } stakes.visible = false; }
  S.modeGifts = S.modeGifts || [];
  if (S.mode === 'scholar' && !S.modeGifts.includes('scholar')) { S.furn.bookshelf = (S.furn.bookshelf || 0) + 1; S.modeGifts.push('scholar'); }
  homeDock.visible = S.mode === 'fisher';
  S.created = true; S.setupDone = true; save();
}
function openLookEditor(back) { lookPicker('YOUR LOOK', () => { endSetup(); if (back) back(); else toast('Looking good!'); }, true); }
function endSetup() { setupCam = false; document.getElementById('veil').classList.remove('setup'); document.body.classList.remove('in-setup'); hideCard(); }
$('start').onclick = () => { $('title').style.display = 'none'; document.body.classList.remove('on-title'); playing = true; snapCam(); startAudio();
  { const turned = seasonCheck(); applySeason(); if (turned && S.letter) toast(turned); }
  { const fz = festival(); if (fz && S.letter && !S.fests[fz.id + fz.year]) setTimeout(() => toast(`Today is ${fz.name}! Talk to ${NEIGHBORS[fz.host].name}.`), 800); }
  if (S.created && S.letter && !S.setupDone && !VISIT) {
    const toIsland = () => { setupCam = true; $('veil').classList.add('setup'); document.body.classList.add('in-setup'); modePicker(() => { endSetup(); $('start').onclick(); }, { returning:true }); };
    showCard(`<div class="kicker">WELCOME BACK</div><h2>New in Sky Garden!</h2><p>You can now make your own character, add your birthday, and choose an island with its own perks.</p><h4>Your progress is safe</h4><p>Your coins, collections, memories, story progress, garden, and hut all stay exactly as they are.</p>`, "Let's set it up", () =>
      lookPicker('WELCOME BACK', () => { endSetup(); if (!S.birthdayAsked && !S.birthday) birthdayPicker(toIsland); else toIsland(); }, true));
    return;
  }
  if (!S.created) { lookPicker('NEW GAME', () => { endSetup(); birthdayPicker(() => { setupCam = true; $('veil').classList.add('setup'); document.body.classList.add('in-setup'); modePicker(() => { endSetup(); $('start').onclick(); }); }); }, true); return; }
  if (isPartyDay() && S.lastParty !== dayKey(today()) && S.letter) setTimeout(birthdayParty, 900);
  else if (S.tut === 9 && !S.birthdayAsked && !S.birthday && S.letter) setTimeout(() => birthdayPicker(null, true), 1200);
  if (!S.letter) { S.letter = true; save(); showCard(`<div class="kicker">${(S.home || 0) < 3 ? 'A LETTER UNDER A STONE' : 'A LETTER ON THE TABLE'}</div><h2>Dear ${S.name || 'little one'},</h2><p class="letter">${(S.home || 0) < 3 ? 'If you are reading this, you made it. I am sorry about the hut. The Great Gust took it, so all that is left are the stones it stood on. You will build a better one. ' : 'If you are reading this, the hut is yours now. '}The Great Gust scattered more than islands. It scattered what we knew: how to count, how to tell time, how to make music. Those memories are still out there, in the dirt and the sky. Nana Gale will show you where to start.<br><br>The sky remembers what it used to be. Help it.<br><br>Love, Grandma</p>`, 'Let\'s go!', () => { if (S.tut === 0) startTutorial(); }); } };
// --- trading post and creator shops ---
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const ME = () => VISIT ? mine : S, saveMe = () => VISIT ? saveMine() : save();
const TRADEABLE = ['crop','fruit','fish','dish','specialty','heirloom','material','bug'];
const isKid = () => ageBand() === 'kid';
async function api(path, body) {
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
function marketTabs(on) { const tabs = VISIT ? [['market','Their shop']] : [['market','Market'],['sell','Sell'],['make','Design'],['mine','My listings'],['brand','My brand']];
  return `<div class="mtabs">${tabs.map(([k,l]) => `<button data-mt="${k}" class="${on === k ? '' : 'ghost'}">${l}</button>`).join('')}</div>`; }
function wireTabs() { document.querySelectorAll('[data-mt]').forEach(b => b.onclick = () => openMarket(b.dataset.mt)); }
async function openMarket(tab = 'market') {
  if (!featureOn('market') && !VISIT) return;
  if (tab === 'sell') return sellTab(); if (tab === 'make') return designStudio(); if (tab === 'mine') return myListings(); if (tab === 'brand') return brandEditor(() => openMarket('brand'));
  showCard(`<div class="kicker">TRADING POST</div><h2>${VISIT ? `${esc(VISIT.name)}'s shop` : 'The market'}</h2>${marketTabs('market')}<p>Loading...</p>`, 'Close');
  const res = VISIT ? await api(`/shop?code=${VISIT_CODE}`) : await api('/market');
  if (!res.ok) { $('card').querySelector('p').textContent = 'Could not reach the market. Check your internet and try again.'; wireTabs(); return; }
  const rows = (res.listings || []).map(l => { const lab = listingLabel(l); if (!lab) return ''; const mineL = l.code === myCode;
    return `<div class="mrow">${l.logo ? logoSvg(l.logo, 40) : '<span class="nologo">🏪</span>'}<div class="minfo"><small>${esc(l.shop || 'A shop')} · island ${l.code}</small><div>${lab}</div><div class="mask">${askText(l)}</div></div>
      <div class="mbtns">${mineL ? '<small>Yours</small>' : `<button data-buy="${l.id}">${l.price ? 'Buy' : 'Trade'}</button>`}${!VISIT && !mineL ? `<button class="ghost" data-shop="${l.code}">Shop</button>` : ''}${!mineL ? `<button class="ghost rep" data-rep="${l.code}" data-rl="${l.id}">Report</button>` : ''}</div></div>`; }).join('');
  showCard(`<div class="kicker">TRADING POST</div><h2>${VISIT ? `${esc(res.brand?.shop || VISIT.name + "'s shop")}` : 'The market'}</h2>${marketTabs('market')}
    ${VISIT && res.brand ? `<div class="brandhead">${logoSvg(res.brand.logo, 56)}<p>Everything here was made or grown on this island.</p></div>` : ''}
    ${rows || `<p>${VISIT ? 'Nothing for sale here right now.' : 'Nothing for sale yet. Be the first! Tap Sell.'}</p>`}
    ${!VISIT && !S.brand ? '<p class="itinfo">Want to sell your own things? Talk to Pip about a maker\'s mark first.</p>' : ''}`, 'Close');
  wireTabs();
  const byId = Object.fromEntries((res.listings || []).map(l => [l.id, l]));
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buyListing(byId[b.dataset.buy]));
  document.querySelectorAll('[data-shop]').forEach(b => b.onclick = () => openShop(b.dataset.shop));
  document.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => reportShop(b.dataset.rep, +b.dataset.rl, () => openMarket()));
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
  if (l.price && (T.coins || 0) < l.price) { toast(`You need ${l.price} coins.`); return; }
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
      <p class="itinfo">Tip: it sells for about ${value} coins at your crate. Price it too high and no one buys. Too low and you lose out. Real sellers look at what similar things sell for.</p>
      <button id="sPost">Put it up for sale</button>`;
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
      sfx('coin'); lean('trader'); toast('It is up for sale! When someone buys it, you get paid through your mailbox.'); myListings(); }); });
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { const i = +b.dataset.sp, p = prods[i];
    form(`${productSwatch(p, 24)} ${productName(p)}`, 1, BASES[p.base]?.value || 60, async (qty, ask) => {
      const [taken] = S.products.splice(i, 1); save();
      const res = await api('/list', { key:S.syncKey, item:'product', qty:1, product:{ base:taken.base, name:taken.name, color:taken.color, color2:taken.color2, pattern:taken.pattern }, ...ask });
      if (!res.ok) { S.products.push(taken); save(); toast(res.status === 409 ? 'You can have up to 8 things for sale at once.' : res.error === 'not allowed' ? 'That product name is not allowed. Rename it in the Design Studio and try again.' : res.error === 'shop paused' ? 'Your shop is paused while we look at a report. Your product is safe.' : 'Could not reach the market. Your product is safe.'); return; }
      sfx('coin'); lean('trader'); toast('Your product is up for sale! Your logo goes with it.'); myListings(); }); });
}
async function myListings() {
  showCard(`<div class="kicker">TRADING POST</div><h2>My listings</h2>${marketTabs('mine')}<p>Loading...</p>`, 'Close'); wireTabs();
  const res = await api(`/shop?code=${myCode}`); if (!res.ok) { $('card').querySelector('p').textContent = 'Could not reach the market.'; return; }
  const rows = (res.listings || []).map(l => { const lab = listingLabel(l); return lab ? `<div class="mrow"><div class="minfo"><div>${lab}</div><div class="mask">${askText(l)}</div></div><div class="mbtns"><button class="ghost" data-un="${l.id}">Take down</button></div></div>` : ''; }).join('');
  showCard(`<div class="kicker">TRADING POST</div><h2>My listings</h2>${marketTabs('mine')}${rows || '<p>You have nothing for sale. Tap Sell to put something up.</p>'}
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
    showCard(`<div class="kicker">MY BRAND</div><h2>Your maker's mark</h2>${S.brand ? marketTabs('brand') : ''}
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
      if (first) { S.coins += 100; save(); drawHud(); lean('maker', 2); return showCard(`<div class="kicker">MAKER'S MARK</div><h2>${esc(S.brand.shop)} is open!</h2><div class="brandhead">${logoSvg(L, 72)}</div><h4>In real life</h4><p>${MARK_LESSON}</p><p><b>Pip gave you 100 coins to get started.</b> Next, design your first product at the Trading Post.</p>`, 'Okay', () => done && done()); }
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
      <p style="font-size:14px">Needs ${needText(B.needs)}.</p>
      <h4>Main color</h4><div class="chips">${PALETTE.map(c => `<button class="sw ${d.color === c ? 'on' : ''}" data-c1="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Pattern and its color</h4><div class="chips">${PATTERNS.map(p => `<button data-pa="${p}" class="${d.pattern === p ? '' : 'ghost'}">${p[0].toUpperCase() + p.slice(1)}</button>`).join('')}</div>
      <div class="chips" style="margin-top:6px">${PALETTE.map(c => `<button class="sw sm ${d.color2 === c ? 'on' : ''}" data-c2="${c}" style="background:${hx(c)}"></button>`).join('')}</div>
      <h4>Name it</h4>${kid ? `<select id="pdAdj">${KID_ADJ.map(w => `<option ${w === d.adj ? 'selected' : ''}>${w}</option>`).join('')}</select> ${esc(B.name)}`
        : `<input id="pdName" maxlength="30" value="${esc(d.name)}" placeholder="${esc(B.name)}" class="numin" style="width:100%">`}
      <p style="font-size:13px;opacity:.7;margin-top:6px">Your logo goes on it, and it carries your shop name wherever it goes.</p>
      <button id="dMake">Make it</button>`, 'Close');
    wireTabs();
    const keep = () => { if ($('pdName')) d.name = $('pdName').value.slice(0, 30); if ($('pdAdj')) d.adj = $('pdAdj').value; };
    document.querySelectorAll('[data-ba]').forEach(x => x.onclick = () => { keep(); d.base = x.dataset.ba; draw(); });
    document.querySelectorAll('[data-c1]').forEach(x => x.onclick = () => { keep(); d.color = +x.dataset.c1; draw(); });
    document.querySelectorAll('[data-c2]').forEach(x => x.onclick = () => { keep(); d.color2 = +x.dataset.c2; draw(); });
    document.querySelectorAll('[data-pa]').forEach(x => x.onclick = () => { keep(); d.pattern = x.dataset.pa; draw(); });
    $('dMake').onclick = () => { keep(); if (!enough(B.needs)) { toast(`Not enough yet. Needs ${needText(B.needs)}.`); return; }
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
  openDialog('Captain Drizzle', again ? `A new year, sailor! Last year she was ${SHIP_PATHS[S.shipPath].name.toLowerCase()}. Want to keep her that way, or try the other road?`
    : "Now, what should the Puddle Jumper be, day to day? Some captains chase the horizon. Some bring the whole world to their deck. It is your call, sailor.", [], S.hearts.drizzle);
  const opts = Object.entries(SHIP_PATHS).filter(([k]) => !again || true);
  showCard(`<div class="kicker">CAPTAIN DRIZZLE ASKS</div><h2>What should the ship become?</h2>
    ${opts.map(([k, p]) => `<button data-sp2="${k}" class="${S.shipPath === k ? '' : 'ghost'}" style="display:block;width:100%;text-align:left;margin-top:8px"><b>${p.name}</b>${S.shipPath === k ? ' (this year)' : ''}<br><span class="sub">${p.short}</span></button>`).join('')}
    <p style="font-size:13px;opacity:.7;margin-top:8px">She can still fly you anywhere either way. You can change your mind on your next island year.</p>`, again ? 'Keep it as is' : null, () => closeDialog());
  document.querySelectorAll('[data-sp2]').forEach(b => b.onclick = () => { const k = b.dataset.sp2, changed = k !== S.shipPath; S.shipPath = k; S.shipYear = islandYear();
    lean(k === 'explore' ? 'explorer' : 'trader', 3); if (changed) S.bigChoices = [...(S.bigChoices || []), k === 'explore' ? 'You made the Puddle Jumper an explorer\'s ship.' : 'You made the Puddle Jumper a floating market.'];
    save(); drawShip(); hideCard(); closeDialog(); burst(ship.position, 0xffc857, 22); [523,659,784].forEach((f,i) => setTimeout(() => chime(f), i*150));
    openDialog('Captain Drizzle', k === 'explore' ? "An explorer! I knew it. I put up a crow's nest and dug out my old charts. Tap the ship once a day and we sail." : "A market! I will stack the crates. Folks from every island will shout their orders. Tap the ship each day to see what they want.", [], S.hearts.drizzle); });
}
function voyage() {
  if (S.voyageDay === S.day) { toast('The crew is resting. One voyage a day, sailor.'); return; }
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
      ${done ? `<h4>Drizzle is proud</h4><p>"Three voyages, three safe returns. You are a real navigator now. Take my old Star Globe. It showed me the way for forty years."</p>` : ''}`, 'Okay');
    if (done) { S.furn.globe = (S.furn.globe || 0) + 1; save(); } });
}
function marketDay() {
  const s = season();
  if (!S.boat || S.boat.day !== S.day) { const pool = [...Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(s) && !CROPS[k].locked), 'apple', 'peach', 'minnow', 'trout'];
    S.boat = { day:S.day, orders:[...Array(3)].map(() => { const k = pool[Math.floor(Math.random()*pool.length)], n = 1 + Math.floor(Math.random()*3); return { k, n, pay:Math.round(ITEMS[k].sell * n * 1.5), done:false }; }) }; save(); }
  showCard(`<div class="kicker">THE FLOATING MARKET</div><h2>Today's orders</h2><p>Shoppers from all over the sky call out what they want. These pay 50% more than your crate.</p>
    <div class="jlist">${S.boat.orders.map((o, i) => `<button data-mo="${i}" ${o.done ? 'class="locked"' : ''}>${o.done ? '✓ ' : ''}${icon(o.k)} ${o.n} ${esc(plural(o.k, o.n))} <span class="sub">${o.done ? 'Delivered' : `pays ${o.pay} coins (you have ${have(o.k)})`}</span></button>`).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-mo]').forEach(b => b.onclick = () => { const o = S.boat.orders[+b.dataset.mo]; if (o.done) return;
    if (have(o.k) < o.n) { toast(`You need ${o.n} ${plural(o.k, o.n)}.`); return; }
    bagAdd(o.k, -o.n); S.coins += o.pay; o.done = true; S.marketFilled = (S.marketFilled || 0) + 1; lean('trader'); goal('sell', o.pay); sfx('coin'); save(); drawHud();
    const first = S.marketFilled === 1, done = S.marketFilled === 6;
    if (done) { S.perks = [...new Set([...(S.perks || []), 'marketRep'])]; S.coins += 300; save(); drawHud(); }
    if (first || done) return showCard(`<div class="kicker">THE FLOATING MARKET</div><h2>${first ? 'Your first sale on the water' : 'The market is famous!'}</h2>
      ${first ? `<h4>In real life</h4><p>${FLOATING}</p>` : `<p>"Six orders filled! Word is spreading, sailor. Shoppers trust us now." Drizzle hands you 300 coins from the market's savings, and from now on your crate pays 10% more.</p>`}`, 'Okay', marketDay);
    marketDay(); });
}
// --- growing the island ---
function expandReady(e) { return e.needs === 'home' ? (S.home || 0) >= 3 : e.needs === 'kiln' ? !!S.stations.kiln && potteryOn() : !!S.stations.furnace && bronzeOn(); }
function expandCard() {
  const e = EXPANSIONS[S.expand || 0]; if (!e) { toast('Your island is as big as it can grow for now.'); return; }
  const ok = enough(e.cost) && S.coins >= e.coins, ready = expandReady(e);
  showCard(`<div class="kicker">NANA GALE</div><h2>Grow the island: ${e.name}</h2>
    <p>"When I was young, we made new land by piling earth and stone at the edge until it held. We can do it again."</p>
    <p>New land joins your island with room to build, plus new trees, rocks, and bushes.</p>
    ${ready ? `<h4>It needs</h4><p>${needText(e.cost)}, and ${e.coins} coins (you have ${S.coins}).</p>` : `<h4>Not yet</h4><p>${e.why}</p>`}
    ${ready ? `<button id="exGo" ${ok ? '' : 'style="opacity:.55"'}>Build the ${e.name}</button>` : ''}`, 'Later');
  if ($('exGo')) $('exGo').onclick = () => {
    if (!enough(e.cost) || S.coins < e.coins) { toast(`Not enough yet. Needs ${needText(e.cost)}, and ${e.coins} coins.`); return; }
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
    showCard(`<div class="kicker">A LETTER FROM ${L.from.toUpperCase()}</div><h2>Something came back to you</h2><p>${L.letter}</p><p><b>Inside:</b> ${got.join(', ')}${L.give.perk === 'pipBonus' ? ', and Pip\'s orders now pay you 25% more' : ''}.</p><p style="opacity:.75;font-style:italic;margin-top:10px">${L.quote}</p>`, 'Okay', () => show(i + 1)); };
  show(0);
}
// kind people get surprise gifts sometimes (never announced as a reward)
function kindnessGift() {
  const k = (S.karma || {}).kind || 0; if (k < 5 || Math.random() > Math.min(.5, k / 30)) return;
  const who = ['nana','pip'][Math.floor(Math.random()*2)], pool = ['apple','peach','cloudberry','kale','trout'], it = pool[Math.floor(Math.random()*pool.length)];
  S.bag[it] = (S.bag[it] || 0) + 2; S.mailLog = [...(S.mailLog || []), `${NEIGHBORS[who].name} left you 2 ${ITEMS[it].name.toLowerCase()} "just because".`].slice(-20); S.mailNew = true;
  setTimeout(() => toast(`${NEIGHBORS[who].name} left something in your mailbox, just because.`), 4000);
}
function openStory() {
  const ps = Object.entries(S.paths || {}).sort((a,b) => b[1] - a[1]).slice(0, 2).filter(([,n]) => n >= 3), kk = S.karma || {};
  showCard(`<div class="kicker">YOUR STORY</div><h2>${S.name ? S.name + "'s" : 'Your'} journey</h2>
    <p style="font-style:italic">${islandFeel(kk.kind || 0, kk.harmony || 0)}</p>
    <h4>Who you are becoming</h4>${ps.length ? ps.map(([k]) => `<p><b>${PATHS[k][0]}.</b> ${PATHS[k][1]}</p>`).join('') : '<p>Keep playing. Your path will show here.</p>'}
    <h4>Choices you made</h4>${(S.bigChoices || []).map(t => `<p><b>• ${t}</b></p>`).join('')}${(S.choices || []).length ? `<div class="jlist">${S.choices.map(c => { const d = DILEMMAS.find(x => x.id === c.id); return `<p>• ${d[c.pick].story}</p>`; }).join('')}</div>` : (S.bigChoices || []).length ? '' : '<p>None yet. Neighbors sometimes ask you to decide things. There are no wrong answers.</p>'}`, 'Back', openJournal);
}
// --- rolling unlocks: a "New today" card the first time you play each day ---
function maybeNewToday() {
  if (!S.newDay || VISIT || !S.setupDone || $('veil').classList.contains('show')) return;
  S.newDay = false; save();
  if (featureOn('journey')) { kindnessGift(); return deliverLetters(() => newTodayCard()); }
  newTodayCard();
}
function newTodayCard() {
  const d = playDays(), fresh = ROLLOUT.filter(r => r.day === d && featureOn(r.id)), next = ROLLOUT.find(r => r.day > d && FEATURES.find(f => f.id === r.id)?.live !== false);
  if (!fresh.length) return;
  drawHud(); drawStations(); drawTradePlants(); drawStall(); spawnBugs(); drawPeople(); chime(784); setTimeout(() => chime(1047), 140);
  showCard(`<div class="kicker">NEW TODAY: DAY ${d}</div>${fresh.map(r => `<h2>${r.title}</h2><p>${r.text}</p>`).join('')}${next ? `<p style="opacity:.75;margin-top:10px">${next.day === d + 1 ? 'Something new unlocks tomorrow. See you then!' : 'More unlocks soon. Keep playing each day!'}</p>` : ''}`);
}
{ const st = $('start').onclick; $('start').onclick = () => { st(); setTimeout(maybeNewToday, 1800); }; }
// --- playtest feedback: a short form that goes to the Sky Garden cloud ---
function openFeedback() {
  let mood = null;
  const where = `${$('quest').querySelector('b')?.textContent || ''}: ${$('quest').querySelector('.qt')?.textContent || ''}`;
  showCard(`<div class="kicker">FEEDBACK</div><h2>How is it going?</h2><p>Your notes go straight to the people making Sky Garden. Thank you!</p>
    <div class="steppers" style="justify-content:flex-start">${[['love','Loving it'],['okay',"It's okay"],['confused','Confused'],['bored','Bored']].map(([k,l]) => `<button data-mood="${k}" class="ghost">${l}</button>`).join('')}</div>
    ${kidSafe() ? '' : `<textarea id="fbText" rows="4" maxlength="2000" placeholder="What happened? What did you like? Where did you get stuck? (optional)" style="width:100%;margin-top:10px;font:16px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:10px"></textarea>`}
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
      const r = await fetch(`${CLOUD}/feedback`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ mood, text, where: (devOn() ? '[dev] ' : '') + where, day:S.day, player:S.syncKey }) });
      if (!r.ok) throw new Error();
      hideCard(); toast('Thank you! Your feedback was sent.'); sfx('heart');
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
window.__sg = { bringVisitor, talkPerson, drawPeople, peopleNewDay, personGift, peopleGroup, giftPicker, openFriends, spawnBugs, swingNet, bugGroup, fishing3D, get fish3() { return fish3; }, goSleep, shipChoice, voyage, marketDay, drawShip, get cine() { return cine; }, openMarket, brandEditor, designStudio, buyListing, openProduct, get myCode() { return myCode; }, expandCard, showLobes, lobes, onLand, chooseDilemma, startDilemma, deliverLetters, openStory, DILEMMAS, maybeNewToday, playDays, arrive, decos, get sitting() { return sitting; }, featureOn, FEATURES, useKiln, kilnGame, useFurnace, bronzePuzzle, gatherNode, nodes, get stations() { return S.stations; }, screenOf:(x,z) => { const v = new THREE.Vector3(x,0,z).project(camera); return { clientX:(v.x+1)/2*innerWidth, clientY:(1-v.y)/2*innerHeight }; }, setBuildMode, buildTap, get buildMode() { return buildMode; }, PIECES, useWorkbench, useBuildSite, usePickup, chopTree, mineRock, cutBush, homeStep, woodTrees, rocks, bushes, drawHome, birthdayParty, isPartyDay, islandYear, ageBand, openFeedback, birthdayPicker, openMailbox, visitWater, visitGift, checkInbox, communityHtml, get visiting() { return VISIT; }, get __homeDockVisible() { return homeDock.visible; }, save, drawHud, snapCam, CROPS, ITEMS, FURN, AHA_ORDER, BUILDINGS, RECIPES, BOOKS, SAYINGS, FINDS, get dateOverride() { return dateOverride; }, setDate:d => { dateOverride = d; applySeason(); drawHud(); }, festival, moon, season, S, sleep, useTile, useCrate, dig, useSundial, openBell, talk, openJournal, openBag, SFX, ambience, enterHut, exitHut, useSpot, usePot, useShip, fishing, starPuzzle, ropePuzzle, useFruitTree, fruitTrees, player, applySeason, drawRoom, useSign, walkTo:(x,y,z)=>{ target=new THREE.Vector3(x,y,z); pending=null; }, npcs, groundAt, walkables, useSign2, useWindmill, gearPuzzle, leverPuzzle, WIND_POS, useStakes, useBoulder, NIGHT_POS, useEasel, useDarkroom, useCrystals, moonPuzzle, useBakery, useLibrary, useMusicHall, useTemple, useGreatBell, useFrame, useSite, useObservatory, traceStars, flyTo, useShip, CONSTELLATIONS, OH, openGoals, furnShop, goal };

// developer mode: add #dev to the address, or tap the title 5 times
{ let taps = 0; document.querySelector('.title h1').addEventListener('click', () => { if (++taps >= 5) { try { localStorage.setItem('sg.dev', 'true'); } catch {} import('./dev.js'); toast('Developer mode on.'); } }); }
if (location.hash === '#dev') { try { localStorage.setItem('sg.dev', 'true'); } catch {} }
if (devOn()) import('./dev.js');

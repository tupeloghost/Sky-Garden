import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { HOWTO, QUEST5, BUILDINGS, GRANDMA_LETTER2, MUTE_KEY, SEASONS, CROPS, ITEMS, FURN, LOVES, BRIDGE2_COST, BRIDGE_COST, DAY_LEN, SAVE_KEY, NEIGHBORS, AHA, RECALL, AHA_ORDER, RELICS, LAYERS, QUESTIONS, QUEST3, QUEST4, ROOFS, WALLS, PAINT_PRICE, QUEST1, QUEST2, CHIMES } from '../data/content.js';
import { CONSTELLATIONS } from '../data/stars.js';
import { FINDS } from '../data/finds.js';
import { realSeason, moonPhase, activeFestival, dateLabel, FESTIVAL_AHA, FESTIVALS, festivalWindow } from '../data/calendar.js';
import { VILLAGERS, VILLAGER_LOVES, VILLAGER_LOOK, RECIPES, BOOKS, XYLO, XYLO_NAMES, PENTA, SONGS, PENTA_AHA, SAYINGS } from '../data/village.js';
Object.assign(NEIGHBORS, VILLAGERS); Object.assign(LOVES, VILLAGER_LOVES);
RECIPES.forEach(r => ITEMS[r.id] = { name:r.name, sell:r.sell, kind:'dish' });
Object.assign(AHA, FESTIVAL_AHA);
for (const id of Object.keys(FESTIVAL_AHA)) if (!AHA_ORDER.includes(id)) AHA_ORDER.push(id);


// ============ STATE ============
const fresh = () => ({ day:1, t:0, coins:40, seeds:{ cloudberry:4, sunbell:0, skywheat:0, moonpumpkin:0, frostmint:0 }, bag:{},
  tiles:Array.from({length:9},()=>({s:0})), sel:'cloudberry', hearts:{ nana:0, pip:0, drizzle:0, twins:0, lumen:0, mabel:0, hoot:0, allegra:0, sage:0 }, talked:{}, gifted:{}, scenes:[],
  bridge:false, pos:[0,0,2], where:'home', quest:0, aha:[], relics:0, digs:[], asked:-1, qi:0, letter:false,
  order:null, furn:{}, placed:[null,null,null,null,null,null], q2:0, potDay:-1, fruit:{}, q3:0, bridge2:false, sprinklers:false, used:[], bigGarden:false, boulder:false, south:false, lastSeason:null, fests:{}, q5:0, tut:0, built:[], charted:[], cooked:[], read:[], songs:[], penta:false, sayings:[], builtDay:{}, q4:0, goals:null, paints:['0xff8fa3','0xfff1d6'], roof:'0xff8fa3', wall:'0xfff1d6' });
let S;
try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
  const f = fresh();
  S = { ...f, ...saved, seeds:{ ...f.seeds, ...(saved.seeds||{}) }, hearts:{ ...f.hearts, ...(saved.hearts||{}) } };
  if (saved.letter && saved.tut === undefined) S.tut = 9;
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
let cloudDirty = true, lastPush = 0, cloudState = { when:0, ok:null };
const save = () => { S.savedAt = Date.now(); cloudDirty = true; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };
const devOn = () => { try { return localStorage.getItem('sg.dev') === 'true'; } catch { return false; } };
async function cloudPush(force) {
  if (devOn()) return; // developer mode never touches the cloud
  if (!cloudDirty || (!force && Date.now() - lastPush < 60000)) return;
  lastPush = Date.now(); cloudDirty = false;
  try {
    const r = await fetch(`${CLOUD}/save`, { method:'POST', headers:{ 'Content-Type':'application/json' }, keepalive:true,
      body: JSON.stringify({ key:S.syncKey, updated:S.savedAt || Date.now(), save:S }) });
    cloudState = { when:Date.now(), ok: r.ok || r.status === 409 };
  } catch { cloudDirty = true; cloudState = { when:Date.now(), ok:false }; }
}
async function cloudLoad(key) {
  const r = await fetch(`${CLOUD}/load?key=${encodeURIComponent(key)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('cloud error');
  return r.json();
}
addEventListener('visibilitychange', () => { if (document.hidden) cloudPush(true); });
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
const LOOK = (() => { const q = new URLSearchParams(location.search).get('look'); if (q) { try { localStorage.setItem('sg.look', q); } catch {} return q; } try { return localStorage.getItem('sg.look') || 'a'; } catch { return 'a'; } })();
const makeRamp = (steps, lo) => { const d = new Uint8Array(steps); for (let i=0;i<steps;i++) d[i] = Math.round(255 * (lo + (1-lo) * i/(steps-1))); const t = new THREE.DataTexture(d, steps, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; };
const RAMP = LOOK === 'b' ? makeRamp(3, .5) : LOOK === 'c' ? makeRamp(5, .62) : null;
const CREAM = new THREE.Color(0xfff4e6);
const tint = c => LOOK === 'c' ? new THREE.Color(c).lerp(CREAM, .16) : new THREE.Color(c);
const NO_OUTLINE = { visible:false };
const mat = (c, o={}) => { if (!RAMP) return new THREE.MeshStandardMaterial({ color:c, roughness:.85, ...o }); const { roughness, metalness, ...rest } = o; return new THREE.MeshToonMaterial({ color:tint(c), gradientMap:RAMP, ...rest }); };
const glow = (c) => { const m = new THREE.MeshBasicMaterial({ color:c }); m.userData.outlineParameters = NO_OUTLINE; return m; };
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
function island(r, x, y, z) {
  const g = new THREE.Group(); g.position.set(x,y,z);
  const top = mesh(new THREE.CylinderGeometry(r, r*.97, 1, 48), mat(0x8fdc8a), 0, -.5, 0); g.add(top);
  g.add(mesh(new THREE.CylinderGeometry(r*.97, r*.9, .6, 48), mat(0xb98a63), 0, -1.3, 0));
  const rock = mesh(new THREE.ConeGeometry(r*.9, r*.8, 48), mat(0x9c7fa8), 0, -1.6 - r*.4, 0); rock.rotation.x = Math.PI; g.add(rock);
  const lip = mesh(new THREE.TorusGeometry(r - .05, .3, 10, 72), top.material, 0, -.14, 0); lip.rotation.x = Math.PI/2; g.add(lip);
  for (let i=0;i<Math.round(r*1.4);i++){ const a = i*2.39, rr = r*(.45 + (i%4)*.1), len = 1 + (i%5)*.45, vine = i%3 === 0;
    const root = mesh(new THREE.CylinderGeometry(.035, .012, len, 5), mat(vine ? 0x5fb85c : 0x7a5236), Math.cos(a)*rr, -1.7 - len/2 - (1 - rr/r)*r*.5, Math.sin(a)*rr);
    root.rotation.z = Math.sin(i)*.15; g.add(root);
    if (vine) root.add(mesh(sph(.08), mat(0x7fd88a), 0, -len/2, 0)); }
  scene.add(g); walkables.push(top); return { g, top };
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
  g.add(mesh(new THREE.CylinderGeometry(.18,.25,1.2,12), mat(0x9b6b4a), 0, .6, 0));
  const canopy = new THREE.Group(); canopy.position.y = 1.2; g.add(canopy);
  const cm = mat(0x5fc377);
  canopy.add(mesh(sph(.9), cm, 0, .5, 0)); canopy.add(mesh(sph(.55), cm, .5, .3, .2)); canopy.add(mesh(sph(.5), cm, -.45, .35, -.2));
  const fruits = new THREE.Group(); canopy.add(fruits);
  if (fruitKind) for (let i=0;i<6;i++){ const a=i*1.1; fruits.add(mesh(sph(.14), mat(fruitKind === 'apple' ? 0xff6b6b : 0xffb36b), Math.cos(a)*.8, .35+Math.sin(i*2)*.3, Math.sin(a)*.8)); }
  g.userData = { canopy, cm, fruits, ph:Math.random()*6 };
  parent.add(g); trees.push(g); return g;
}
[[-7,-1],[-6,4],[5,-6],[-2,7],[6.5,5]].forEach(([x,z]) => tree(scene, x, z));
[[-5.5,-2],[-6,3.5],[5.5,3]].forEach(([x,z]) => tree(WIND.g, x, z));
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
const roof = mesh(new THREE.ConeGeometry(2.1,1.4,4), mat(0xff8fa3), 0, 2.5, 0); roof.rotation.y = Math.PI/4; house.add(roof);
house.add(mesh(new THREE.BoxGeometry(.7,1.1,.1), mat(0x9b6b4a), 0, .55, 1.12));
const winMat = new THREE.MeshStandardMaterial({ color:0x9fd3ff, emissive:0xffc46b, emissiveIntensity:0, roughness:.4 });
[-.85,.85].forEach(x => house.add(mesh(new THREE.BoxGeometry(.5,.45,.08), winMat, x, 1.05, 1.12)));
house.add(mesh(new THREE.BoxGeometry(.25,.6,.25), mat(0xc98f7a), .7, 2.9, -.3)); // chimney
house.userData.kind = 'house'; scene.add(house);
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
[[-7.6,1.4,.3],[6.8,-3.6,.25],[-2.8,-6.9,.35],[3.2,6.9,.28],[-6.2,-4.8,.2]].forEach(([x,z,r],i) => { const rk = mesh(new THREE.DodecahedronGeometry(r), mat(0xb3aabb), x, r*.5, z); rk.rotation.set(i, i*2, 0); scene.add(rk); });

// --- sell crate ---
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
  sunflowers.add(mesh(new THREE.CylinderGeometry(.14,.14,.1,12), mat(0x7a5236), x, 1.37, z + .03).rotateX(1.2)); }
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
  nightStuff.add(mesh(new THREE.SphereGeometry(.18,14,8,0,Math.PI*2,0,Math.PI/2), glow(c), x, .28, z)); const mh = halo(c, .9, .55); mh.position.set(x, .35, z); nightStuff.add(mh); }
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
  heart.add(mesh(new THREE.CylinderGeometry(.35,.4, broken ? 1.1 : 2.6, 12), mat(0xe8e0d0), Math.cos(a)*r, broken ? .55 : 1.3, Math.sin(a)*r)); }
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
const dressing = new THREE.Group(); scene.add(dressing); const grassPatches = [];
if (LOOK !== 'a') {
  // soft light and dark patches in the grass, so the ground isn't one flat color
  const rnd = (i) => { const x = Math.sin(i*127.1)*43758.5; return x - Math.floor(x); };
  [[0,0,0,8.4],[ORCH_POS.x,ORCH_POS.y,ORCH_POS.z,7.4],[WIND_POS.x,WIND_POS.y,WIND_POS.z,7.4],[OH.x,OH.y,OH.z,10.2]].forEach(([cx,cy,cz,R], k) => {
    for (let i=0;i<14;i++){ const a = rnd(i+k*50)*Math.PI*2, r = Math.sqrt(rnd(i*3+k*70))*R*.85, f = rnd(i*7+k) > .5 ? 1.12 : .88;
      const pm = new THREE.MeshToonMaterial({ color:0x8fdc8a, gradientMap:RAMP, transparent:true, opacity:.55 }); pm.userData.outlineParameters = NO_OUTLINE; pm.userData.f = f;
      const p = new THREE.Mesh(new THREE.CircleGeometry(.9 + rnd(i*11+k)*1.4, 20), pm); p.rotation.x = -Math.PI/2; p.position.set(cx + Math.cos(a)*r, cy + .012 + i*.0005, cz + Math.sin(a)*r); p.scale.set(1, .6 + rnd(i*5)*.5, 1);
      p.receiveShadow = true; dressing.add(p); grassPatches.push(p); } });
  // bushes in little groups
  const bush = (x, z, s=1, c=0x4fb46a) => { const g = new THREE.Group(); g.position.set(x, 0, z); [[0,0,0,.45],[.35,-.05,.1,.34],[-.32,-.07,.08,.32],[.05,.15,-.15,.3]].forEach(([bx,by,bz,br]) => g.add(mesh(sph(br*s), mat(c), bx*s, br*s*.8 + by, bz*s))); dressing.add(g); return g; };
  [[-6.2,-2.6],[-5.6,-3.4,.8],[-2.2,-4.2,.9],[-6.9,2.6,.8],[5.9,-4.4],[6.7,-3.6,.7],[-1.6,6.6],[1.2,7.4,.8],[7.2,3.6,.8],[-4.8,5.2,.7]].forEach(([x,z,s]) => bush(x, z, s || 1));
  // flower beds hugging the hut and along the path
  const bed = (x, z, n, rx, rz) => { for (let i=0;i<n;i++){ const fx = x + (rnd(i+x*13)-.5)*rx, fz = z + (rnd(i*3+z*7)-.5)*rz, c = [0xff8fa3,0xfff3a0,0xc9b6ff,0xffffff,0xffb36b][i%5];
    dressing.add(mesh(new THREE.CylinderGeometry(.015,.015,.22,4), mat(0x4fb46a), fx, .11, fz)); dressing.add(mesh(sph(.075), mat(c), fx, .24, fz)); } };
  bed(-4, -1.55, 14, 2.4, .35); bed(-5.55, -3, 8, .35, 1.8); bed(-2.45, -3, 8, .35, 1.8); bed(-.9, -.1, 6, .7, .5); bed(6.3, .3, 6, .8, .6);
  // a low picket fence around the garden, open on the side facing the hut
  const fenceMat = mat(0xfff1d6);
  const fence = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1-x0, z1-z0) / .4);
    for (let i=0;i<=n;i++){ const k = i/n; dressing.add(mesh(new THREE.BoxGeometry(.07,.5,.07), fenceMat, x0+(x1-x0)*k, .25, z0+(z1-z0)*k)); }
    const rail = mesh(new THREE.BoxGeometry(Math.hypot(x1-x0, z1-z0), .05, .04), fenceMat, (x0+x1)/2, .36, (z0+z1)/2); rail.rotation.y = -Math.atan2(z1-z0, x1-x0); dressing.add(rail); };
  fence(.45, -1.75, 4.45, -1.75); fence(4.45, -1.75, 4.45, 3.5); fence(.45, 3.5, 4.45, 3.5); fence(.45, -1.75, .45, -.2); fence(.45, 1.6, .45, 3.5);
}
const sprinkler = new THREE.Group(); sprinkler.position.set(.15, 0, .25); sprinkler.visible = false;
sprinkler.add(mesh(new THREE.CylinderGeometry(.06,.06,.5,8), mat(0x8a8f99, { metalness:.4 }), 0, .25, 0));
const sprHead = new THREE.Group(); sprHead.position.y = .52; sprinkler.add(sprHead);
sprHead.add(mesh(new THREE.BoxGeometry(.5,.06,.06), mat(0x7ec8e3), 0, 0, 0)); sprHead.add(mesh(sph(.08), mat(0x7ec8e3)));
scene.add(sprinkler);

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
scene.add(bell);

// --- festival lanterns ---
const lanterns = new THREE.Group(); lanterns.visible = false; scene.add(lanterns);
const lanternMat = glow(0xffb45c);
for (let i=0;i<8;i++){ const a = i/8*Math.PI*2 + .3, x = Math.cos(a)*7.2, z = Math.sin(a)*7.2;
  lanterns.add(mesh(new THREE.CylinderGeometry(.05,.05,1.8,6), mat(0x9b6b4a), x, .9, z));
  const l = mesh(sph(.22), lanternMat, x, 1.9, z); l.scale.y = 1.25; lanterns.add(l); const lh = halo(0xffb45c, 1.6, .7); lh.position.set(x, 1.9, z); lanterns.add(lh); }

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
function drawTile(i) {
  const g = tileGroups[i], t = S.tiles[i];
  while (g.children.length > 1) g.remove(g.children[1]);
  if (t.s === 0) return;
  g.add(mesh(new THREE.BoxGeometry(1.1,.14,1.1), mat(t.w ? 0x7a5236 : 0xb98a63), 0, .05, 0));
  if (t.s === 2) {
    const c = CROPS[t.c], k = Math.min(1, t.d / c.days), ripe = t.d >= c.days;
    const stem = mesh(new THREE.ConeGeometry(.12 + k*.1, .3 + k*.5, 8), mat(0x5fc377), 0, .3 + k*.25, 0); stem.userData.sway = true; g.add(stem);
    if (ripe) { const f = mesh(sph(t.c === 'moonpumpkin' ? .38 : .28), mat(c.color, { emissive:c.color, emissiveIntensity:.2 }), 0, .85, 0); f.userData.bob = true; g.add(f); }
    else if (k > 0) g.add(mesh(sph(.1 + k*.08), mat(0x7fd88a), 0, .55 + k*.4, 0));
  }
}
S.tiles.forEach((_, i) => drawTile(i));
const stakes = new THREE.Group(); stakes.position.set(2.45, 0, 2.9);
for (let i=0;i<4;i++) stakes.add(mesh(new THREE.CylinderGeometry(.05,.06,.7,6), mat(0xc98f58), -.4 + i*.27, .35, (i%2)*.12));
stakes.add(mesh(new THREE.TorusGeometry(.2,.05,6,14), mat(0xc9a27a), .45, .08, .1).rotateX(Math.PI/2));
stakes.userData.kind = 'stakes'; scene.add(stakes);

// --- critters ---
function critter({ body, belly, ear, earType, beak, hat, frog, captain, spikes, owl, shell }) {
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
  });
  if (beak) { const k = mesh(new THREE.ConeGeometry(.08,.18,8), mat(beak), 0, 1.15, .45); k.rotation.x = Math.PI/2; inner.add(k); }
  if (hat) { inner.add(mesh(new THREE.CylinderGeometry(.35,.4,.08,20), mat(hat), 0, 1.58, 0)); inner.add(mesh(new THREE.CylinderGeometry(.22,.25,.28,20), mat(hat), 0, 1.72, 0)); }
  if (earType === 'point') [-1,1].forEach(sd => { const e = mesh(new THREE.ConeGeometry(.13,.3,8), mat(ear), sd*.26, 1.58, 0); e.rotation.z = -sd*.3; inner.add(e); });
  if (spikes) for (let i=0;i<14;i++){ const a = (i/14)*Math.PI - Math.PI/2, yy = .5 + (i%3)*.3; const sp = mesh(new THREE.ConeGeometry(.07,.32,6), mat(0x6e5345), Math.sin(a)*.42, yy + .2, -Math.cos(a)*.3 - .15); sp.rotation.x = -1.1; sp.rotation.z = -Math.sin(a)*.6; inner.add(sp); }
  if (owl) { [-1,1].forEach(sd => { const disc = mesh(new THREE.CylinderGeometry(.14,.14,.03,16), mat(0xfff6e6), sd*.15, 1.26, .37); disc.rotation.x = Math.PI/2; inner.add(disc);
    const tuft = mesh(new THREE.ConeGeometry(.08,.25,6), mat(body), sd*.28, 1.62, 0); tuft.rotation.z = -sd*.4; inner.add(tuft); });
    inner.add(mesh(new THREE.TorusGeometry(.11,.02,6,16), mat(0x3b2f4a), -.15, 1.26, .41), mesh(new THREE.TorusGeometry(.11,.02,6,16), mat(0x3b2f4a), .15, 1.26, .41)); }
  if (shell) { const sh = mesh(new THREE.SphereGeometry(.62, 20, 12, 0, Math.PI*2, 0, Math.PI/2), mat(0x7a5a3a), 0, .45, -.18); sh.scale.set(1,.9,1.05); inner.add(sh);
    for (let i=0;i<6;i++) inner.add(mesh(new THREE.CylinderGeometry(.13,.13,.04,6), mat(0xa07a4f), Math.cos(i)*.3, .78 + (i%2)*.12, -.3 + Math.sin(i)*.2).rotateX(-.6)); }
  if (captain) { inner.add(mesh(new THREE.CylinderGeometry(.38,.38,.22,20), mat(0x2d3a6b), 0, 1.7, -.05)); inner.add(mesh(new THREE.BoxGeometry(.5,.04,.2), mat(0x1f2a52), 0, 1.6, .3)); inner.add(mesh(sph(.06), glow(0xffc857), 0, 1.72, .33)); }
  if (!beak) { const smile = mesh(new THREE.TorusGeometry(.06, .016, 6, 12, Math.PI), mat(0x2b2233), 0, frog ? 1.12 : 1.1, frog ? .48 : .39); smile.rotation.z = Math.PI; inner.add(smile); }
  g.userData.inner = inner; inner.userData.eyes = eyes; inner.userData.arms = arms; inner.userData.blink = Math.random()*4;
  scene.add(g); return g;
}
const player = critter({ body:0xffe0b3, belly:0xfff6e6, ear:0xffc58f, earType:'round', hat:0x7ec8e3 });
player.position.set(...S.pos);
const npcs = {
  nana: critter({ body:0xf6f1ea, belly:0xffffff, ear:0x3b2f4a, earType:'long' }),
  pip:  critter({ body:0x86c7ff, belly:0xfff3a0, beak:0xffb347, hat:0xff8fa3 }),
  drizzle: critter({ body:0x7fcf8f, belly:0xe6f7c8, frog:true, captain:true }),
};
const mole = () => critter({ body:0x8b6b5a, belly:0xd9bfa6, ear:0x6e5345, earType:'round', beak:0xff9fb2 });
npcs.twins = new THREE.Group(); scene.add(npcs.twins);
const moss = mole(), fern = mole(); moss.position.x = -.45; fern.position.x = .45; fern.scale.setScalar(.9); moss.scale.setScalar(.8);
fern.userData.inner.add(mesh(new THREE.TorusGeometry(.1,.02,6,16), mat(0x3b2f4a), .15, 1.26, .4), mesh(new THREE.TorusGeometry(.1,.02,6,16), mat(0x3b2f4a), -.15, 1.26, .4));
npcs.twins.add(moss, fern); npcs.twins.userData.inner = moss.userData.inner;
npcs.twins.position.set(WIND_POS.x - 2.5, WIND_POS.y, WIND_POS.z + 2);
npcs.lumen = critter({ body:0x3b2f4a, belly:0x5a4b7a });
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
  const b = BUILDINGS.find(x => x.id === v.building), c = critter(VILLAGER_LOOK[id]);
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
const SPOTS = [[-2.2,.6],[-.8,-1.1],[.9,-1.1],[2.4,.6],[-1,1.7],[1.1,1.7]];
const spotGroups = SPOTS.map(([x,z], i) => {
  const g = new THREE.Group(); g.position.set(x,0,z); g.userData = { kind:'spot', i };
  const ring = mesh(new THREE.RingGeometry(.42,.5,24), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.35 }), 0, .02, 0); ring.rotation.x = -Math.PI/2;
  g.add(ring); g.add(mesh(new THREE.CylinderGeometry(.5,.5,.03,16), new THREE.MeshBasicMaterial({ visible:false }), 0, .02, 0));
  room.add(g); return g;
});
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
  if (id === 'sign') { g.add(mesh(new THREE.CylinderGeometry(.05,.05,1.1,8), mat(0x9b6b4a), 0, .55, 0)); g.add(mesh(new THREE.BoxGeometry(.9,.45,.08), mat(0xff8fa3), 0, 1.1, 0)); g.add(mesh(sph(.08), glow(0xffc857), 0, 1.1, .05)); }
  if (id === 'painting') { [-.3,.3].forEach(x => g.add(mesh(new THREE.CylinderGeometry(.04,.04,1.5,6), mat(0x9b6b4a), x, .75, 0))); g.add(mesh(new THREE.BoxGeometry(.9,.7,.05), mat(0x1f2552), 0, 1.2, .06)); g.add(mesh(new THREE.CircleGeometry(.18,20), glow(0xfff3a0), .15, 1.28, .09)); g.add(mesh(new THREE.CircleGeometry(.05,10), glow(0xffffff), -.2, 1.1, .09)); }
  if (id === 'mushroom') { g.add(mesh(new THREE.CylinderGeometry(.1,.14,.6,10), mat(0xfff1d6), 0, .3, 0)); const cap = mesh(new THREE.SphereGeometry(.4,20,10,0,Math.PI*2,0,Math.PI/2), glow(0x9fe7e0), 0, .58, 0); g.add(cap); }
  return g;
}
function drawRoom() {
  spotGroups.forEach((g, i) => {
    while (g.children.length > 2) g.remove(g.children[2]);
    g.children[0].visible = !S.placed[i];
    if (S.placed[i]) g.add(furnModel(S.placed[i]));
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
  scene.add(g); butterflies.push(g);
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
  trees.forEach(t => t.userData.cm.color.set(CANOPY[s]));
  grassPatches.forEach(p => p.material.color.set(GRASS[s]).multiplyScalar(p.material.userData.f));
  flowers.visible = s < 2; tufts.visible = s !== 3 && !lowGfx;
  rainMat.color.set(s === 3 ? 0xffffff : 0xdfeaff); rainMat.size = s === 3 ? .14 : .08;
  const fz = festival(); lanterns.visible = !!fz; if (fz) lanternMat.color.set(fz.color);
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
  ensureGoals(); $('goalsBtn').innerHTML = `${ICON.goal}<span class="lbl">Goals</span> ${S.goals.list.filter(g => g.have >= g.need).length}/3`;
  drawQuest();
  const s = season(), shown = Object.entries(CROPS).filter(([k,c]) => (c.seasons.includes(s) && (!c.locked || S.q4 >= 5)) || S.seeds[k] > 0);
  if (!shown.some(([k]) => k === S.sel) && shown.length) S.sel = shown[0][0];
  $('bar').style.display = S.where === 'hut' ? 'none' : 'flex';
  $('bar').innerHTML = shown.map(([k,c]) => `<div class="slot ${S.sel===k?'on':''}" data-k="${k}"><span class="dot" style="background:${hex(c.color)}"></span>${c.name}<small>${S.seeds[k]} seeds${c.seasons.includes(s) ? '' : ', out of season'}</small></div>`).join('');
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
  if (!S.aha.includes(id)) S.aha.push(id);
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
function noteFind(k) {
  if (S.found.includes(k)) return;
  S.found.push(k);
  const f = FINDS[k]; if (!f) return; // dishes and quest items have their own cards
  const name = ITEMS[k]?.name || FURN[k]?.name || k;
  const el = $('discover'); el.onclick = () => el.classList.remove('show');
  el.innerHTML = `<b>FIRST FIND! ${S.found.filter(x => FINDS[x]).length} of ${Object.keys(FINDS).length} found</b><strong>${name}</strong><span>${f.fact}</span>`;
  el.classList.add('show'); chime(1047); setTimeout(() => chime(1319), 120);
  clearTimeout(noteFind.t); noteFind.t = setTimeout(() => el.classList.remove('show'), 7000);
}
function collectionCats() {
  const month = m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1];
  const itemCard = (k, kick) => () => showCard(`<div class="kicker">${kick}</div><h2>${ITEMS[k]?.name || FURN[k]?.name}</h2><p>${FINDS[k].fact}</p><h4>Where to find it</h4><p>${FINDS[k].hint}</p>`, 'Back', () => openCategory(kick));
  return [
    { name:'Crops', ids:Object.keys(CROPS), has:k => S.found.includes(k), label:k => CROPS[k].name, open:k => itemCard(k, 'Crops'), hint:k => FINDS[k].hint },
    { name:'Fruit', ids:['apple','peach'], has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => itemCard(k, 'Fruit'), hint:k => FINDS[k].hint },
    { name:'Fish', ids:['minnow','trout','puffer','moonray'], has:k => S.found.includes(k), label:k => ITEMS[k].name, open:k => itemCard(k, 'Fish'), hint:k => FINDS[k].hint },
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
  showCard(`<div class="kicker">COLLECTIONS</div><h2>${name}: ${got} of ${c.ids.length}</h2><div class="jlist">${c.ids.map(k => c.has(k) ? `<button data-ck="${k}">${c.label(k)}</button>` : `<button class="locked">??? <span class="sub">${c.hint(k)}</span></button>`).join('')}</div>`, 'Back', openJournal);
  document.querySelectorAll('[data-ck]').forEach(b => b.onclick = c.open(b.dataset.ck));
}
function openJournal() {
  const cats = collectionCats(), tot = cats.reduce((a, c) => a + c.ids.length, 0), got = cats.reduce((a, c) => a + c.ids.filter(c.has).length, 0);
  showCard(`<div class="kicker">COLLECTIONS</div><h2>${got} of ${tot} found</h2><p>Everything you have discovered in the sky. Tap a group to see what you have and what is still out there.</p>
    <div style="height:10px;border-radius:99px;background:#eadfd0;margin-top:10px;overflow:hidden"><div style="height:100%;width:${Math.round(got/tot*100)}%;background:#ffc857"></div></div>
    <div class="jlist">${cats.map(c => { const n = c.ids.filter(c.has).length; return `<button data-cat="${c.name}">${n === c.ids.length ? '✓ ' : ''}${c.name} <span class="sub">${n} of ${c.ids.length}</span></button>`; }).join('')}</div>`, 'Close');
  document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => openCategory(b.dataset.cat));
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
function openBag() {
  const goods = Object.entries(S.bag).map(([k,n]) => `<button>${ITEMS[k].name} x${n} <span class="sub">sells for ${ITEMS[k].sell} each</span></button>`).join('');
  const furn = Object.entries(S.furn).filter(([,n]) => n > 0).map(([k,n]) => { const p = S.placed.filter(x => x === k).length;
    return `<button>${FURN[k].name} x${n} <span class="sub">${p ? `${p} in your hut` : 'not placed yet'}</span></button>`; }).join('');
  showCard(`<div class="kicker">YOUR BAG</div><h2>Your stuff</h2>
    <div class="jlist">${goods || '<p>Nothing yet. Pick crops, fruit, or fish.</p>'}</div>
    <h4>Furniture</h4><div class="jlist">${furn || '<p>None yet. Pip sells furniture.</p>'}</div>
    <h4>Tip</h4><p>Sell crops, fruit, and fish in the crate by your garden. Place furniture inside your hut.</p>
    <button id="moveBtn" class="ghost">Sync my game to another device</button>`, 'Close');
  $('moveBtn').onclick = () => openMoveGame(openBag);
}
$('journalBtn').onclick = openJournal;
$('bagBtn').onclick = openBag;
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
  ensureGoals();
  const g = S.goals.list.find(x => x.t === t && x.have < x.need); if (!g) return;
  g.have = Math.min(g.need, g.have + n);
  if (g.have >= g.need) { S.coins += 20; setTimeout(() => { toast(`Goal done: ${GOAL_TYPES[t](g.need)}! +20 coins`); sfx('coin'); }, 700); }
  if (!S.goals.bonus && S.goals.list.every(x => x.have >= x.need)) { S.goals.bonus = true; S.coins += 30; setTimeout(() => { toast('All 3 goals done today! +30 bonus coins'); sfx('heart'); }, 2400); }
  drawHud(); save();
}
function openGoals() {
  ensureGoals();
  showCard(`<div class="kicker">TODAY</div><h2>Little goals</h2><p>Each one pays 20 coins. Finish all 3 for 30 more. New goals every morning.</p>
    <div class="jlist">${S.goals.list.map(g => `<button>${g.have >= g.need ? '✓ ' : ''}${GOAL_TYPES[g.t](g.need)} <span class="sub">${g.t === 'sell' ? `${g.have} of ${g.need} coins` : `${g.have} of ${g.need}`}</span></button>`).join('')}</div>`, 'Close');
}
$('goalsBtn').onclick = openGoals;
function applyPaint() { roof.material.color.set(+S.roof); house.children[0].material.color.set(+S.wall); }
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
    openDialog('Nana Gale', "Your first coins! That is how it works up here: grow things, sell them, and use the coins to rebuild. Now, there are more memories buried out there. New sparkles appear every morning. Off you go, dear!", [], S.hearts.nana);
    spawnDigs(); nanaWalk = { to: NANA_HOME.clone(), back:true };
    const fb = $('fbBtn'); fb.classList.add('pulse'); setTimeout(() => fb.classList.remove('pulse'), 4000);
    setTimeout(() => toast('Tell us what you think anytime with the pink Feedback button.'), 5500);
  }, 900);
}
function questTarget() {
  if (S.tut === 1) return null;
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
  if (S.quest < 5) return HOWTO.c1[S.quest];
  if (S.q2 < 5) return HOWTO.c2[S.q2];
  if (S.q3 < 7) return HOWTO.c3[S.bridge2 && S.q3 === 0 ? 1 : S.q3];
  if (S.q4 < 5) return HOWTO.c4[S.q4];
  return HOWTO.c5[S.q5];
}
$('quest').onclick = () => { sfx('click'); showCard(`<div class="kicker">WHAT TO DO</div><h2>${$('quest').querySelector('.qt').textContent}</h2><p>${currentHowto()}</p><h4>Tip</h4><p>A gold arrow floats over the next thing to tap.</p>`, 'Got it'); };
function drawQuest() {
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
    if (t.d >= c.days) { bagAdd(t.c); goal('pick'); S.tiles[i] = { s:1, w:t.w }; sfx('pick'); burst(pos, c.color); toast(`Picked a ${c.name}! Sell it in the crate or give it as a gift.`); }
    else if (!t.w) { t.w = true; goal('water'); sfx('water'); burst(pos, 0x9fd3ff, 8); toast(`Watered. ${c.days - t.d} more day${c.days - t.d>1?'s':''}.`); }
    else toast('Already watered today. Sleep to let it grow.');
  }
  drawTile(i); drawHud(); save(); tutTile(i);
}
function useCrate() {
  let total = 0;
  for (const k in S.bag) { if (ITEMS[k].kind === 'quest') continue; total += S.bag[k] * ITEMS[k].sell; delete S.bag[k]; }
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
  if (id === 'pip' && S.asked !== S.day && (S.quest >= 1 || S.day > 1)) return pipQuestion();
  const pool = S.hearts[id] >= 3 ? [...n.lines, ...n.heartLines] : [...n.lines];
  if (id === 'nana' && S.aha.includes('rope') && !S.bigGarden) pool.push("Those fence stakes by your garden? A bigger plot needs a perfect square corner. You know how to make one now, don't you?", "Try the fence stakes by your garden, dear. You learned something on that ship.");
  if (id === 'drizzle' && S.aha.includes('stars') && !S.used.includes('stars')) pool.push("Come fish at night, sailor. The biggest fish hide under the star that stays.", "Night fishing! Find the still star and the Moon Rays will find you.");
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
  if (S.gifted[id] !== S.day) b.push({ label:'Give a gift', fn:() => giftPicker(id) });
  return b;
}
function pipOrder() {
  if (!S.order || S.order.day !== S.day) {
    const opts = Object.keys(CROPS).filter(k => CROPS[k].seasons.includes(season()) && !CROPS[k].locked);
    const crop = opts[Math.floor(Math.random()*opts.length)];
    S.order = { day:S.day, crop, pay:CROPS[crop].sell * 2, done:false };
  }
  return S.order.done ? null : S.order;
}
function seedShop() {
  const s = season(), o = pipOrder();
  const btns = Object.entries(CROPS).filter(([,c]) => c.seasons.includes(s) && (!c.locked || S.q4 >= 5)).map(([k,c]) => ({ label:`${c.name} seed, ${c.seed}`, fn:() => {
    if (S.coins < c.seed) { toast('Not enough coins.'); return; }
    S.coins -= c.seed; S.seeds[k]++; S.sel = k; sfx('coin'); toast(`Bought 1 ${c.name} seed. You have ${S.seeds[k]}.`); drawHud(); save();
  }}));
  openDialog('Pip', `${SEASONS[s]} seeds! ${o ? `Today I am hungry for a ${CROPS[o.crop].name}. Bring me one and I pay double: ${o.pay} coins.` : 'Thanks for today\'s order!'}`, btns, S.hearts.pip);
}
function furnShop() {
  closeDialog();
  const list = Object.entries(FURN).filter(([,f]) => !f.gift).map(([k,f]) => `<button data-f="${k}">${f.name} <span class="sub">${f.price} coins${S.furn[k] ? `, you have ${S.furn[k]}` : ''}</span></button>`).join('');
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
  const opts = Object.entries(S.bag).filter(([k]) => ['crop','fruit','fish','dish'].includes(ITEMS[k].kind));
  if (!opts.length) { toast('Nothing to give. Pick crops, fruit, or fish first.'); return; }
  showCard(`<div class="kicker">GIVE A GIFT</div><h2>Gift for ${NEIGHBORS[id].name}</h2><p>Everyone has favorites. Watch how they react.</p><div class="jlist">${opts.map(([k,n]) => `<button data-g="${k}">${ITEMS[k].name} x${n}</button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
    const k = b.dataset.g, loved = LOVES[id].includes(k);
    hideCard(); bagAdd(k, -1); S.gifted[id] = S.day; goal('gift');
    S.hearts[id] = Math.min(10, S.hearts[id] + (loved ? 2 : 1)); sfx(loved ? 'heart' : 'pick'); burst(npcs[id].position, loved ? 0xff8fa3 : 0xffe27a);
    const said = loved ? { nana:"Oh my! My very favorite. You remembered, didn't you?", pip:"FOR ME?! This is the best day of my whole life. Again!", drizzle:"Now THAT is a proper gift. You have a sailor's heart.", twins:"Moss: Our favorite! Fern: Our MOST favorite!", lumen:"Oh... this is my favorite. How did you know?" }[id] || 'My favorite! Thank you so much!'
                       : { nana:"How thoughtful, dear. Thank you.", pip:"Ooh, a present! Thank you!", drizzle:"Much obliged, sailor.", twins:"Moss: For us? Fern: For us!", lumen:"Oh. For me? Thank you." }[id] || 'How kind of you. Thank you!';
    save(); if (!heartScene(id)) openDialog(NEIGHBORS[id].name, said + (loved ? ' (+2 hearts)' : ' (+1 heart)'), [], S.hearts[id]);
  });
}

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
    openDialog('Captain Drizzle', "You know, I had no crew for years. Just me and the fish. Now I have a friend. Here. The rarest fish I ever caught. A Rainbow Puffer. Do not eat it. Or do. It is your fish.", [], S.hearts.drizzle);
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
    openDialog('Nana Gale', "Oh! You have her eyes. Your grandmother was our Keeper of Memory. When the Great Gust hit, the village's memories fell into the ground like seeds. See that sparkle, right by your garden? Tap it a few times to dig it up.", [], h);
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
function useSign() {
  if (S.bridge) { toast('The bridge to Orchard Isle. Walk across!'); return; }
  openDialog('Broken Bridge', `Fix this bridge to reach Orchard Isle. Cost: ${BRIDGE_COST} coins. You have ${S.coins}.`, [{ label:`Fix it (${BRIDGE_COST})`, fn:() => {
    if (S.coins < BRIDGE_COST) { toast('Not enough coins yet.'); return; }
    S.coins -= BRIDGE_COST; S.bridge = true; if (S.quest >= 4) S.quest = 5; buildBridge(); save(); drawHud();
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
  openDialog('Captain Drizzle', "She flies! Well. She hovers. That is a start! Listen, sailor: when you rang that bell, I heard one more answer. Far north, past the old Windmill. Someone else is waiting. Here, 100 coins for the best crew I ever had.", [], S.hearts.drizzle);
}
function useSign2() {
  if (S.bridge2) { toast('The bridge to Windmill Isle. Walk across!'); return; }
  openDialog('Broken Bridge', `This bridge goes north to Windmill Isle. Cost: ${BRIDGE2_COST} coins. You have ${S.coins}.`, [{ label:`Fix it (${BRIDGE2_COST})`, fn:() => {
    if (S.coins < BRIDGE2_COST) { toast('Not enough coins yet.'); return; }
    S.coins -= BRIDGE2_COST; S.bridge2 = true; if (S.q3 === 0) S.q3 = 1; buildBridge(); save(); drawHud();
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
    openDialog('Lumen', "Now I can show you my best painting. This is the Old Heart, before the Great Gust. See the giant bell in the middle? Every island had a small bell, and they all rang together with the big one. Then one night the big bell cracked. Without its song, the islands drifted apart. Your grandmother tried to fix it. She never finished. I think you are supposed to. Here: 3 Starbloom seeds. They grow in any season.", [], h);
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
  S.fruit[i] = S.day; bagAdd(t.userData.fruitKind); goal('fruit'); t.userData.fruits.visible = false; sfx('pick');
  const wp = new THREE.Vector3(); t.getWorldPosition(wp); burst(wp.setY(wp.y + 1), t.userData.fruitKind === 'apple' ? 0xff6b6b : 0xffb36b);
  toast(`Picked a ${ITEMS[t.userData.fruitKind].name}!`); save();
}
function fishing(o = {}) {
  let state = 'idle', timer, dipTimer;
  const cast = () => {
    state = 'wait'; $('bob').className = 'bob'; $('fmsg').textContent = 'Wait for the bobber to dip...'; $('pull').textContent = 'Pull!'; sfx('cast');
    S.t = Math.min(.99, S.t + 10/(60*18)); drawHud();
    timer = setTimeout(() => { state = 'dip'; $('bob').className = 'bob dip'; sfx('splash'); $('fmsg').textContent = 'Now!';
      dipTimer = setTimeout(() => { if (state === 'dip') { state = 'idle'; $('bob').className = 'bob'; $('fmsg').textContent = 'Too slow. It got away.'; $('pull').textContent = 'Cast again'; } }, 800);
    }, 1500 + Math.random()*2500);
  };
  const night = hour() >= 20 && S.aha.includes('stars');
  const secret = !!o.secret;
  showCard(`<div class="kicker">THE CLOUD STREAM</div><h2>Fishing</h2><p>Cast your line. When the bobber dips, pull fast!${night ? ' Captain Drizzle says the biggest fish hide under the star that stays.' : ''}</p>
    <div class="pond"><div class="bob gone" id="bob"></div></div><p id="fmsg" style="margin-top:8px;font-weight:700;text-align:center;min-height:22px"></p>
    <button id="pull">Cast</button> ${night ? '<button id="secret">Find the secret spot</button> ' : ''}<button id="later" class="ghost">Done</button>`, null);
  cardCleanup = () => { clearTimeout(timer); clearTimeout(dipTimer); };
  if (night) $('secret').onclick = () => starPuzzle({ title:'Find the secret spot', text:'The big fish rest under the one star that never moves. Find it.',
    done:() => { const first = !S.used.includes('stars'); const go = () => fishing({ secret:true }); first ? showRecall('stars', go) : go(); } });
  if (secret) { $('fmsg').textContent = 'You are at the secret spot. Cast!'; if (night) $('secret').remove(); }
  $('pull').onclick = () => {
    if (state === 'idle') return cast();
    if (state === 'wait') { clearTimeout(timer); state = 'idle'; $('bob').className = 'bob'; $('fmsg').textContent = 'Too soon! The fish swam off.'; $('pull').textContent = 'Cast again'; return; }
    if (state === 'dip') {
      clearTimeout(dipTimer); state = 'idle'; const r = Math.random(), k = secret ? (r < (moon().idx === 4 ? .8 : .5) ? 'moonray' : 'puffer') : r < .6 ? 'minnow' : r < .92 ? 'trout' : 'puffer';
      bagAdd(k); goal('fish'); save(); sfx('pick'); $('bob').className = 'bob gone';
      $('fmsg').textContent = `You caught a ${ITEMS[k].name}! It sells for ${ITEMS[k].sell}.`; $('pull').textContent = 'Cast again';
    }
  };
  $('later').onclick = hideCard;
}

// --- the hut ---
function useHouse() {
  openDialog('Your Hut', 'Home sweet home.', [{ label:'Go inside', fn:() => { closeDialog(); enterHut(); } }]);
}
function enterHut() { S.where = 'hut'; player.position.set(ROOM.x, 0, ROOM.z + 2.2); target = null; pending = null; snapCam(); sfx('door'); drawRoom(); drawHud(); save(); }
function exitHut() { S.where = 'home'; player.position.set(-4, 0, -1.3); target = null; pending = null; snapCam(); sfx('door'); drawHud(); save(); }
function useSpot(i) {
  const cur = S.placed[i];
  if (cur) { openDialog('Your Hut', `Pick up the ${FURN[cur].name}?`, [{ label:'Pick it up', fn:() => { S.placed[i] = null; drawRoom(); save(); closeDialog(); } }]); return; }
  const free = Object.entries(S.furn).filter(([k,n]) => n > S.placed.filter(x => x === k).length);
  if (!free.length) { toast('Buy furniture from Pip, then place it here.'); return; }
  showCard(`<div class="kicker">DECORATE</div><h2>Place something here</h2><div class="jlist">${free.map(([k]) => `<button data-p="${k}">${FURN[k].name}</button>`).join('')}</div>`, 'Never mind');
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { S.placed[i] = b.dataset.p; hideCard(); drawRoom(); save(); sfx('plant'); burst(new THREE.Vector3(ROOM.x + SPOTS[i][0], 0, ROOM.z + SPOTS[i][1]), 0xffc857, 10); });
}
let raining = false;
function seasonCheck() {
  const now = season(), was = S.lastSeason; S.lastSeason = now;
  if (was === null || was === now) return '';
  let lost = 0; S.tiles.forEach(t => { if (t.s === 2 && !CROPS[t.c].seasons.includes(now)) { t.s = 1; delete t.c; lost++; } });
  S.tiles.forEach((_, i) => drawTile(i)); applySeason();
  return `${SEASONS[now]} is here!${lost ? ` ${lost} out-of-season plant${lost>1?'s':''} wilted.` : ''} Pip has new seeds.`;
}
function sleep(passedOut) {
  S.day++; S.t = 0;
  S.tiles.forEach(t => { if (t.s === 2 && t.w) t.d++; t.w = false; });
  raining = Math.random() < .25;
  if (raining || S.sprinklers) S.tiles.forEach(t => { if (t.s >= 1) t.w = true; });
  let msg = passedOut ? 'You were so tired you fell asleep. New day!' : raining ? (season() === 3 ? 'Good morning! Snow watered your crops.' : 'Good morning! Rain watered your crops.') : 'Good morning!';
  const turned = seasonCheck(); if (turned) msg = turned;
  else if (S.sprinklers && !raining) msg += ' Your sprinkler watered the garden.';
  const fz = festival(); if (fz && !S.fests[fz.id + fz.year]) msg = `Today is ${fz.name}! Talk to ${NEIGHBORS[fz.host].name}.`;
  S.tiles.forEach((_, i) => drawTile(i));
  spawnDigs(); applySeason(); S.goals = null; ensureGoals();
  S.where = 'hut'; player.position.set(ROOM.x - 1.4, 0, ROOM.z - .8); target = null; pending = null; snapCam();
  toast(msg); drawRoom(); drawHud(); save(); cloudPush(true);
}

// ============ INPUT ============
const ray = new THREE.Raycaster(), down = new THREE.Raycaster(), ptr = new THREE.Vector2(), DOWN = new THREE.Vector3(0,-1,0);
let target = null, pending = null;
const clickables = [greatBell, bellFrame, lumberPile, ship2, ...siteGroups, house, crate, sign, sign2, windmill, stakes, boulder, easel, darkroom, crystals, sundial, ship, pot, dock, bed, doormat, shelf, ...spotGroups, ...fruitTrees, ...tileGroups, ...Object.values(npcs)];
renderer.domElement.addEventListener('pointerdown', e => {
  if ($('title').style.display !== 'none' || $('veil').classList.contains('show')) return;
  closeDialog();
  ptr.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects([...clickables, ...lateClicks, ...digGroups], true)[0];
  if (hit) {
    let o = hit.object; while (o && !o.userData.kind) o = o.parent;
    if (o) { const wp = new THREE.Vector3(); o.getWorldPosition(wp); target = wp; pending = o; return; }
  }
  const g = ray.intersectObjects(walkables, false)[0];
  if (g) { target = g.point.clone(); pending = null; }
});
function arrive(o) {
  const k = o.userData.kind;
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
  else if (k === 'dock') fishing();
  else if (k === 'fruitTree') useFruitTree(o);
  else if (k === 'bed') openDialog('Your Bed', 'Go to sleep and start a new day? Watered crops will grow.', [{ label:'Sleep', fn:() => { closeDialog(); sleep(); } }]);
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
    if (!menuOpen) S.t += dt * (window.__sgSpeed || 1) / DAY_LEN; // the clock stops while any menu or conversation is open
    if (S.t >= 1) sleep(true);
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
  // movement
  let mv = new THREE.Vector3((keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0), 0, (keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0));
  if (mv.lengthSq()) { target = null; pending = null; }
  else if (target) {
    mv.subVectors(target, player.position); mv.y = 0;
    if (mv.length() < (pending ? 1.3 : .1)) { const p = pending; target = null; pending = null; mv.set(0,0,0); if (p) arrive(p); }
  }
  const inner = player.userData.inner;
  if (mv.lengthSq() && !$('veil').classList.contains('show')) {
    mv.normalize().multiplyScalar(4.2*dt);
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
  // life
  if (!inside && !lowGfx) swayTufts(now);
  if (playing && !lowGfx && perfCheck.n < 240 && !document.hidden) { perfCheck.n++; perfCheck.sum += dt;
    if (perfCheck.n === 240 && perfCheck.sum / 240 > 1/32) { setLowGfx(true); toast('Switched to low graphics so the game runs smoother. You can change this in Sync my game.'); } }
  trees.forEach(t => { t.userData.canopy.rotation.z = Math.sin(now*1.2 + t.userData.ph)*.035; t.userData.canopy.rotation.x = Math.cos(now*.9 + t.userData.ph)*.025; });
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
  smoke.forEach((sm, i) => { const k = ((now*.25 + i/5) % 1); sm.position.set(house.position.x + .7 + Math.sin(k*6 + i)*.2, 3.1 + k*2.2, house.position.z - .3); sm.scale.setScalar(.4 + k*1.1); sm.material.opacity = (1-k) * .35 * (S.where === 'hut' ? 0 : 1); });
  moonHalo.material.opacity = moonSprite.visible ? night * .35 : 0; moonHalo.position.copy(moonSprite.position);
  tileGroups.forEach(g => g.children.forEach(c => { if (c.userData.bob) c.position.y = .85 + Math.sin(now*3)*.06; if (c.userData.sway) c.rotation.z = Math.sin(now*2 + g.position.x)*.08; }));
  digGroups.forEach(g => g.children.forEach(c => { if (c.userData.spark) { c.rotation.y = now*2; c.position.y = .6 + Math.sin(now*3)*.1; } }));
  if (bell.visible) bellBody.rotation.z = Math.sin(now*1.5)*.08;
  const bflyOn = !inside && h < 18.5 && season() < 3 && !(raining && S.t < .5);
  butterflies.forEach((b, i) => { b.visible = bflyOn; if (!bflyOn) return; const u = b.userData, t = now*.4 + u.ph;
    b.position.set(u.cx + Math.sin(t)*3 + Math.sin(t*2.3)*.8, u.cy + .8 + Math.sin(t*3.1)*.4, u.cz + Math.cos(t*.8)*3);
    b.rotation.y = Math.atan2(Math.cos(t), -Math.sin(t*.8)); const f = Math.sin(now*18 + i)*1.1; u.l.rotation.z = f; u.r.rotation.z = -f; });
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
  if (S.q3 >= 4) blades.rotation.z -= dt * 1.2; else blades.rotation.z = Math.sin(now*.7)*.03;
  millstone.visible = S.q3 < 4;
  sprinkler.visible = S.sprinklers; if (S.sprinklers) sprHead.rotation.y += dt * (h < 8 ? 6 : .6);
  clouds.forEach(c => { c.position.x += c.userData.v*dt; if (c.position.x > 60) c.position.x = -45; });
  rain.visible = !inside && raining && S.t < .5;
  if (rain.visible) { const p = rainGeo.attributes.position, sp = season() === 3 ? 3 : 14; for (let i=0;i<RN;i++){ let y = p.getY(i) - sp*dt; if (y<0) y += 12; p.setY(i,y); } p.needsUpdate = true; rain.position.set(player.position.x, player.position.y, player.position.z); }
  // camera
  if (!playing) { const a = now*.07; camera.position.set(Math.sin(a)*17, 9.5, Math.cos(a)*17); camera.lookAt(0, .5, 0); }
  else { camera.position.lerp(player.position.clone().add(camOffset()), 1 - Math.pow(.02, dt));
  camera.lookAt(player.position.x, player.position.y + .6, player.position.z - ahead()); }
  if (outline) outline.render(scene, camera); else renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
snapCam(); tameOutlines();
bell.visible = S.quest >= 4; sprinkler.visible = S.sprinklers; stakes.visible = !S.bigGarden; rock.visible = !S.boulder; rosettaStone.visible = S.boulder; applyPaint(); drawSites(); spawnDigs(); if (lowGfx) setLowGfx(true);
drawHud(); tick();
$('moveTitle').onclick = () => openMoveGame();
const localAt = S.savedAt || 0; save();
cloudLoad(S.syncKey).then(found => {
  if (found && found.updated > localAt + 5000 && !playing) {
    found.save.syncKey = S.syncKey; found.save.savedAt = found.updated;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(found.save)); } catch {}
    location.reload();
  } else cloudPush(true);
}).catch(() => {});
const hemiBtn = $('hemi');
const drawHemi = () => hemiBtn.textContent = S.south ? 'Seasons: Southern Hemisphere' : 'Seasons: Northern Hemisphere';
drawHemi(); hemiBtn.onclick = () => { S.south = !S.south; S.lastSeason = null; save(); drawHemi(); applySeason(); drawHud(); };
$('start').onclick = () => { $('title').style.display = 'none'; document.body.classList.remove('on-title'); playing = true; snapCam(); startAudio();
  { const turned = seasonCheck(); applySeason(); if (turned && S.letter) toast(turned); }
  { const fz = festival(); if (fz && S.letter && !S.fests[fz.id + fz.year]) setTimeout(() => toast(`Today is ${fz.name}! Talk to ${NEIGHBORS[fz.host].name}.`), 800); }
  if (!S.letter) { S.letter = true; save(); showCard(`<div class="kicker">A LETTER ON THE TABLE</div><h2>Dear little one,</h2><p class="letter">If you are reading this, the hut is yours now. The Great Gust scattered more than islands. It scattered what we knew: how to count, how to tell time, how to make music. Those memories are still out there, in the dirt and the sky. Nana Gale will show you where to start.<br><br>The sky remembers what it used to be. Help it.<br><br>Love, Grandma</p>`, 'Let\'s go!', () => { if (S.tut === 0) startTutorial(); }); } };
// --- playtest feedback: a short form that goes to the Sky Garden cloud ---
function openFeedback() {
  let mood = null;
  const where = `${$('quest').querySelector('b')?.textContent || ''}: ${$('quest').querySelector('.qt')?.textContent || ''}`;
  showCard(`<div class="kicker">FEEDBACK</div><h2>How is it going?</h2><p>Your notes go straight to the people making Sky Garden. Thank you!</p>
    <div class="steppers" style="justify-content:flex-start">${[['love','Loving it'],['okay',"It's okay"],['confused','Confused'],['bored','Bored']].map(([k,l]) => `<button data-mood="${k}" class="ghost">${l}</button>`).join('')}</div>
    <textarea id="fbText" rows="4" maxlength="2000" placeholder="What happened? What did you like? Where did you get stuck? (optional)" style="width:100%;margin-top:10px;font:16px 'Baloo 2',sans-serif;border-radius:12px;border:2px solid #eadfd0;padding:10px"></textarea>
    <p style="font-size:13px;opacity:.7;margin-top:6px">We also send where you are in the game (${where}) so we know what your note is about. Nothing else about you is sent.</p>
    <button id="fbSend">Send</button> <button id="fbLater" class="ghost">Not now</button>
    <p id="fbMsg" style="margin-top:8px;font-weight:700;min-height:22px"></p>`, null);
  document.querySelectorAll('[data-mood]').forEach(b => b.onclick = () => { mood = b.dataset.mood; document.querySelectorAll('[data-mood]').forEach(x => x.className = x === b ? '' : 'ghost'); });
  $('fbLater').onclick = hideCard;
  $('fbSend').onclick = async () => {
    const text = $('fbText').value.trim();
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
window.__sg = { save, drawHud, snapCam, CROPS, ITEMS, FURN, AHA_ORDER, BUILDINGS, RECIPES, BOOKS, SAYINGS, FINDS, get dateOverride() { return dateOverride; }, setDate:d => { dateOverride = d; applySeason(); drawHud(); }, festival, moon, season, S, sleep, useTile, useCrate, dig, useSundial, openBell, talk, openJournal, openBag, SFX, ambience, enterHut, exitHut, useSpot, usePot, useShip, fishing, starPuzzle, ropePuzzle, useFruitTree, fruitTrees, player, applySeason, drawRoom, useSign, walkTo:(x,y,z)=>{ target=new THREE.Vector3(x,y,z); pending=null; }, npcs, groundAt, walkables, useSign2, useWindmill, gearPuzzle, leverPuzzle, WIND_POS, useStakes, useBoulder, NIGHT_POS, useEasel, useDarkroom, useCrystals, moonPuzzle, useBakery, useLibrary, useMusicHall, useTemple, useGreatBell, useFrame, useSite, useObservatory, traceStars, flyTo, useShip, CONSTELLATIONS, OH, openGoals, furnShop, goal };

// developer mode: add #dev to the address, or tap the title 5 times
{ let taps = 0; document.querySelector('.title h1').addEventListener('click', () => { if (++taps >= 5) { try { localStorage.setItem('sg.dev', 'true'); } catch {} import('./dev.js'); toast('Developer mode on.'); } }); }
if (location.hash === '#dev') { try { localStorage.setItem('sg.dev', 'true'); } catch {} }
if (devOn()) import('./dev.js');

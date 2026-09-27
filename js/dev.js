// Sky Garden developer mode. Jump around, change time and date, and give yourself things for testing.
// While it is on, nothing syncs to the cloud. Turn it off from the panel.
const g = window.__sg, S = g.S;
const KEEP = ['syncKey','south','letter'];
const ALL_AHA = { c1:['bone','temple','tablet','sundial'], c2:['bell'], c3:['still','rope','stars'], c4:['gears','lever','bread'], c5:['moon','optics'] };

function preset(name) {
  const base = { letter:true, coins:1000, quest:0, relics:0, digs:[], bridge:false, bridge2:false, q2:0, q3:0, q4:0, q5:0, sprinklers:false, aha:[], used:[], built:[], builtDay:{}, where:'home', pos:[0,0,2], t:.25 };
  const steps = {
    'Chapter 1 start':  {},
    'Chapter 1: tune the bell': { quest:3, relics:3, aha:[...ALL_AHA.c1] },
    'Chapter 2 start':  { quest:5, relics:3, bridge:true, aha:[...ALL_AHA.c1, ...ALL_AHA.c2] },
    'Chapter 3 start':  { quest:5, relics:3, bridge:true, q2:5, aha:[...ALL_AHA.c1, ...ALL_AHA.c2, ...ALL_AHA.c3] },
    'Chapter 4 start (night)': { quest:5, relics:3, bridge:true, q2:5, bridge2:true, q3:7, sprinklers:true, t:.83, aha:[...ALL_AHA.c1, ...ALL_AHA.c2, ...ALL_AHA.c3, ...ALL_AHA.c4] },
    'Chapter 5 start':  { quest:5, relics:3, bridge:true, q2:5, bridge2:true, q3:7, sprinklers:true, q4:5, aha:Object.values(ALL_AHA).flat() },
    'Story done, village empty': { quest:5, relics:3, bridge:true, q2:5, bridge2:true, q3:7, sprinklers:true, q4:5, q5:6, aha:Object.values(ALL_AHA).flat() },
    'Village fully built': { quest:5, relics:3, bridge:true, q2:5, bridge2:true, q3:7, sprinklers:true, q4:5, q5:6, aha:Object.values(ALL_AHA).flat(),
      built:g.BUILDINGS.map(b => b.id), builtDay:{ library: Date.now() - 400 * 86400000 } },
  };
  const keep = Object.fromEntries(KEEP.map(k => [k, S[k]]));
  Object.assign(S, base, steps[name], keep);
  reloadWith(`Jumped to: ${name}`);
}
function reloadWith(msg) { g.save(); try { sessionStorage.setItem('sg.devmsg', msg); } catch {} location.reload(); }

const TELEPORT = {
  'Home isle': () => [0, 0, 2], 'Orchard Isle': () => [26.5, -1.5, 2.5], 'Windmill Isle': () => [g.WIND_POS.x - 1, g.WIND_POS.y, g.WIND_POS.z + 4],
  'Night Isle': () => [g.NIGHT_POS.x, g.NIGHT_POS.y, g.NIGHT_POS.z + 3], 'Old Heart': () => [g.OH.x + 7.2, g.OH.y, g.OH.z + .8],
};

const css = document.createElement('style');
css.textContent = `
#devBtn { position:fixed; left:10px; bottom:calc(76px + env(safe-area-inset-bottom, 0px)); z-index:9; border:0; border-radius:999px; background:#3b2f4a; color:#ffc857; font:800 13px 'Baloo 2',sans-serif; padding:6px 12px; box-shadow:0 3px 0 #0003; cursor:pointer; }
#devPanel { position:fixed; inset:auto 10px calc(116px + env(safe-area-inset-bottom, 0px)) 10px; max-width:420px; max-height:70vh; overflow:auto; z-index:9; background:#2a2140; color:#fff8ee; border-radius:18px; padding:12px 14px; font:14px 'Baloo 2',sans-serif; box-shadow:0 8px 30px #0006; display:none; }
#devPanel.show { display:block; }
#devPanel h5 { margin:10px 0 4px; font-size:12px; letter-spacing:.08em; color:#ffc857; }
#devPanel button { border:0; border-radius:10px; background:#4a3d6a; color:#fff8ee; font:700 13px 'Baloo 2',sans-serif; padding:4px 10px; margin:2px 2px 0 0; cursor:pointer; }
#devPanel button.warn { background:#b8435e; }
#devPanel input { font:14px 'Baloo 2',sans-serif; border-radius:8px; border:0; padding:3px 6px; }
#devPanel .row { display:flex; flex-wrap:wrap; gap:2px; align-items:center; }`;
document.head.appendChild(css);

const btn = document.createElement('button'); btn.id = 'devBtn'; btn.textContent = 'DEV';
const panel = document.createElement('div'); panel.id = 'devPanel';
document.body.append(btn, panel);
btn.onclick = () => { draw(); panel.classList.toggle('show'); };

function draw() {
  const d = g.dateOverride ? new Date(g.dateOverride) : new Date();
  panel.innerHTML = `
    <b>Developer mode</b> <span style="opacity:.7">Cloud sync is paused.</span>
    <h5>JUMP TO</h5><div class="row" id="dvJump"></div>
    <h5>TIME</h5><div class="row">
      ${[['6 AM',0],['Noon',6/18],['5 PM',11/18],['9 PM',15/18]].map(([l,t]) => `<button data-t="${t}">${l}</button>`).join('')}
      <button id="dvNext">Next day</button>
      <button id="dvSpeed">Speed: ${window.__sgSpeed || 1}x</button></div>
    <h5>DATE (festivals, seasons, moon)</h5><div class="row">
      <input type="date" id="dvDate" value="${d.toISOString().slice(0,10)}"> <button id="dvDateGo">Use date</button> <button id="dvToday">Real today</button></div>
    <p style="margin:4px 0 0;opacity:.8">Now: ${document.getElementById('day').textContent}</p>
    ${(g.MODCTX.extraTools || []).length ? `<h5>CREATOR</h5><div class="row">${g.MODCTX.extraTools.map((x, i) => `<button data-ct="${i}" style="background:#ffc857;color:#3b2f4a">${x.icon} ${x.title}</button>`).join('')}</div>` : ''}
    <h5>TELEPORT</h5><div class="row">${Object.keys(TELEPORT).map(k => `<button data-tp="${k}">${k}</button>`).join('')}<button id="dvHut">Inside hut</button></div>
    <h5>GIVE</h5><div class="row">
      <button id="dvCoins">+1,000 coins</button><button id="dvBag">5 of every item</button><button id="dvSeeds">10 of every seed</button><button id="dvFurn">All furniture</button></div>
    <h5>COLLECTIONS</h5><div class="row"><button id="dvAll">Collect everything</button><button id="dvNone">Clear collections</button></div>
    <h5>ROLLING UNLOCKS</h5><div class="row"><span style="margin-right:6px">Play day ${g.playDays()}</span><button id="dvDay">+1 play day (show New today)</button><button id="dvDayReset">Back to day 1</button></div>
    <p style="margin:2px 0 0;opacity:.7">Dev mode always sees everything. Play days decide what players see.</p>
    <h5>VILLAGERS</h5><div class="row"><button id="dvVisitor">Bring a visitor now</button></div>
    <h5>FEATURES (off = players don't see it yet)</h5><div class="row">${g.FEATURES.map(f => `<button data-ft="${f.id}" title="${f.what}" style="${g.featureOn(f.id) ? 'background:#8fdc8a;color:#1d2b1f' : ''}">${f.name}: ${f.live ? 'live for everyone' : g.featureOn(f.id) ? 'on in dev' : 'off'}</button>`).join('')}</div>
    <h5>LEGENDS</h5><div class="row">${[['simurgh','the Simurgh'],['ziz','the Ziz'],['ibis','the Ibis of Thoth']].map(([k, n]) => `<button data-dm="${k}" style="${S.devMyth === k ? 'background:#c9b6ff;color:#1d1433' : ''}">${S.devMyth === k ? '✓ ' : ''}Try ${n}</button>`).join('')}${S.devMyth ? '<button data-dm="">Stop trying</button>' : ''}<button id="dvFly">Show a fly-over</button></div>
    <p style="margin:2px 0 0;opacity:.7">Try shows that legend's real reveal, form, and missions. Stop brings your own back.</p>
    <h5>RESET</h5><div class="row"><button class="warn" id="dvReset">Start a brand new game</button><button id="dvOff">Turn off developer mode</button></div>
    <p id="dvMsg" style="margin:6px 0 0;min-height:18px;color:#9fe7e0"></p>`;
  const jump = panel.querySelector('#dvJump');
  ['Chapter 1 start','Chapter 1: tune the bell','Chapter 2 start','Chapter 3 start','Chapter 4 start (night)','Chapter 5 start','Story done, village empty','Village fully built']
    .forEach(n => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => preset(n); jump.appendChild(b); });
  const msg = t => panel.querySelector('#dvMsg').textContent = t;
  panel.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { S.t = +b.dataset.t; g.save(); g.drawHud(); msg(`Time set to ${b.textContent}.`); });
  panel.querySelector('#dvNext').onclick = () => { g.sleep(); msg('Skipped to the next day.'); };
  panel.querySelector('#dvSpeed').onclick = () => { const s = { 1:5, 5:20, 20:1 }[window.__sgSpeed || 1]; window.__sgSpeed = s; draw(); msg(s === 1 ? 'Normal speed.' : `Time runs ${s}x faster.`); };
  panel.querySelector('#dvDateGo').onclick = () => { const v = panel.querySelector('#dvDate').value; if (!v) return; g.setDate(v + 'T12:00'); draw(); msg(`Date set to ${v}.`); };
  panel.querySelector('#dvToday').onclick = () => { g.setDate(null); draw(); msg('Back to the real date.'); };
  panel.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => { if (S.where === 'hut') g.exitHut(); const p = TELEPORT[b.dataset.tp](); g.player.position.set(...p); S.pos = p; g.snapCam(); g.save(); msg(`Teleported to ${b.dataset.tp}.`); });
  panel.querySelector('#dvHut').onclick = () => { g.enterHut(); msg('Inside your hut.'); };
  panel.querySelector('#dvCoins').onclick = () => { S.coins += 1000; g.save(); g.drawHud(); msg('Added 1,000 coins.'); };
  panel.querySelector('#dvBag').onclick = () => { Object.keys(g.ITEMS).forEach(k => { if (g.ITEMS[k].kind !== 'quest') S.bag[k] = (S.bag[k] || 0) + 5; }); g.save(); g.drawHud(); msg('Added 5 of every item.'); };
  panel.querySelector('#dvSeeds').onclick = () => { Object.keys(g.CROPS).forEach(k => S.seeds[k] = (S.seeds[k] || 0) + 10); g.save(); g.drawHud(); msg('Added 10 of every seed.'); };
  panel.querySelector('#dvFurn').onclick = () => { Object.keys(g.FURN).forEach(k => S.furn[k] = (S.furn[k] || 0) + 1); g.save(); g.drawHud(); msg('Added one of every furniture piece.'); };
  panel.querySelector('#dvAll').onclick = () => {
    S.found = [...new Set([...S.found, ...Object.keys(g.FINDS)])]; S.aha = [...g.AHA_ORDER]; S.cooked = g.RECIPES.map(r => r.id); S.charted = g.CONSTELLATIONS.map(c => c.id);
    S.read = g.BOOKS.map(b => b.id); S.songs = ['twinkle','ode']; S.penta = true; S.sayings = g.SAYINGS.map(x => x.id); g.save(); g.drawHud(); msg('Everything collected.'); };
  panel.querySelector('#dvNone').onclick = () => { Object.assign(S, { found:[], cooked:[], charted:[], read:[], songs:[], penta:false, sayings:[] }); g.save(); g.drawHud(); msg('Collections cleared. Story memories were kept.'); };
  panel.querySelectorAll('[data-dm]').forEach(b => b.onclick = async () => { panel.classList.remove('show'); await g.devTryLegend(b.dataset.dm); if (!b.dataset.dm) g.toast('Back to your own legend.'); });
  panel.querySelector('#dvFly').onclick = () => { panel.classList.remove('show'); const ks = ['simurgh','ziz','ibis']; g.mythSighting({ id:0, form:ks[Math.floor(Math.random() * 3)] }); };
  panel.querySelectorAll('[data-ct]').forEach(b => b.onclick = () => { panel.classList.remove('show'); g.MODCTX.extraTools[+b.dataset.ct].run(); });
  panel.querySelectorAll('[data-ft]').forEach(b => b.onclick = () => { const f = g.FEATURES.find(x => x.id === b.dataset.ft); if (f.live) { msg(`${f.name} is live for everyone. Change it in data/features.js.`); return; }
    let d = {}; try { d = JSON.parse(localStorage.getItem('sg.features') || '{}'); } catch {} d[f.id] = !g.featureOn(f.id); try { localStorage.setItem('sg.features', JSON.stringify(d)); } catch {}
    reloadWith(`${f.name} is now ${d[f.id] ? 'on' : 'off'} in developer mode.`); });
  panel.querySelector('#dvDay').onclick = () => { S.bonusDays = (S.bonusDays || 0) + 1; S.newDay = true; g.save(); panel.classList.remove('show'); try { localStorage.removeItem('sg.dev'); } catch {} g.maybeNewToday(); try { localStorage.setItem('sg.dev', 'true'); } catch {} };
  panel.querySelector('#dvDayReset').onclick = () => { S.bonusDays = 0; S.playDates = (S.playDates || []).slice(-1); S.unlocked = []; g.save(); draw(); msg('Back to play day 1.'); };
  panel.querySelector('#dvVisitor').onclick = () => { const p = g.bringVisitor(); msg(`${p.name} the ${p.species} is camping on your island.`); };
  panel.querySelector('#dvReset').onclick = () => {
    const b = panel.querySelector('#dvReset'); if (b.dataset.sure) { try { localStorage.removeItem('sg.save'); } catch {} location.reload(); return; }
    b.dataset.sure = 1; b.textContent = 'Tap again to erase this game'; };
  panel.querySelector('#dvOff').onclick = () => { try { localStorage.removeItem('sg.dev'); } catch {} window.__sgSpeed = 1; if (location.hash === '#dev') history.replaceState(null, '', location.pathname); location.reload(); };
}

try { const m = sessionStorage.getItem('sg.devmsg'); if (m) { sessionStorage.removeItem('sg.devmsg'); setTimeout(() => { draw(); panel.classList.add('show'); panel.querySelector('#dvMsg').textContent = m; }, 300); } } catch {}

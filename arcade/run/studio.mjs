// studio.mjs — THE LEVEL STUDIO (Nov 7, crew Ground Truth). Open the game with ?studio (run/index.html?studio).
// Chikin: "i want to make myself a level designer too … somethign where i can easily make stairs and ramps and add and take away
// assets" / "and drops" / "using the aesthetics we already have" / "so i can edit the levels that we have" / "so that way i can
// continue working while you sleep".
// Potato: "give him the hammer … nothing he does can break the real thing."
//
// HOW IT WORKS: the real game draws the level, held still at one moment of the song (main.mjs: RUN.studio). This file only adds the
// panel under the stage and a see-through layer over it for pointing. His changes are a small list (studio-edits.mjs) that the level
// is rebuilt with; the level's own .mjs file is never written. SAVE sends the list to tools/serve.py (run/levels/edits/<level>.json).
//   pick a level · scrub the song (the bar, the wheel, [ ]) · pick a piece, click where it goes · drag it · drag its right edge to make it
//   longer · click one of the level's own things to switch it off (H) · ⌘Z / ⇧⌘Z · space = play from here (esc = stop) · ⌘S = save
import * as T from '../play/vendor/three.module.js';
import { PAINT, DEFAULT_OBJECTS, IG_OBJECTS } from './obstacles.mjs';
import { THINGS, itemObjs, sigs, floorAt, EDITS_V } from './studio-edits.mjs';

const RUN = window.RUN, S = RUN.studio, $ = id => document.getElementById(id);
const EXTRA = [{ id: 'boo-not-found', n: 404, title: '404 Boo Not Found (secret)' }];
const LEVELS = [...RUN.LEVELS, ...EXTRA];
const INK = '#120a05', SKIN = '#da9643', PURPLE = '#9a52ff', MAGENTA = '#e03ccf', GREEN = '#2bff88', LILAC = '#c9a7ff';
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = t => (t < 0 ? '-' : '') + Math.floor(Math.abs(t) / 60) + ':' + (Math.abs(t) % 60).toFixed(1).padStart(4, '0');
const LS = 'potato-level-studio.v1';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(LS + '.' + k)); } catch (e) { return null; } };
const lsSet = (k, v) => { try { if (v == null) localStorage.removeItem(LS + '.' + k); else localStorage.setItem(LS + '.' + k, JSON.stringify(v)); } catch (e) {} };

window.STUDIO_LIVE = window.STUDIO_LIVE || {};
let lvl = (lsGet('last') && lsGet('last').id) || 'thursday-potato', T0 = (lsGet('last') && lsGet('last').t) || 12;
let draft = null, sel = null, tool = null, hist = [], fut = [], dirty = false, state = 'busy', drag = null, hover = null, mouse = null, playFrom = 0;
// FOOTPRINTS (the crew's bold choice — cut it by setting this to false): after "play from here", the last three tries stay drawn over the
// level as dotted purple footprints, with a burst where he fell, and a mark on the song bar. Potato: "the only provable thing is the footprint."
const FOOTPRINTS = true;
const trails = {};   // where he actually went on the last tries, per level
// POTATO SIGNS IT (pass-2 engineer's bold choice — cut it by setting this to false): every save, Potato answers in one faint line of his
// own lettering over the stage. Lines are DRAFTS for Chikin to keep / cut / rewrite (POTATO-VOICE.md §14); they're only ever seen here.
const SIGNS = true;
const SIGN_LINES = ['fair. that\'s yours now.', 'clean, on purpose.', 'i\'ll run it. no promises.', 'the level as built is still there. breathe.',
  'ok ok. that\'s the move.', 'you built a room. i\'ll find the door.', 'saved. unlike some thursdays.', 'a stair is a jump with a plan.'];
let signK = Math.floor(Math.random() * SIGN_LINES.length);
function potatoSigns() { const d = document.createElement('div'); d.className = 'ssign'; d.textContent = SIGN_LINES[signK++ % SIGN_LINES.length]; $('stage').appendChild(d);
  setTimeout(() => d.classList.add('go'), 2600); setTimeout(() => d.remove(), 3600); }

// ---------------- the look ----------------
const css = `
body.studio .wrap { max-width: 1400px; }
body.studio #stage { max-height: calc(100vh - 322px); margin: 0 auto; border: 3px solid ${INK}; box-shadow: 0 0 0 2px #2a1a0e, 6px 6px 0 2px ${INK}; }
body.studio #dev, body.studio .foot { display: none !important; }
body.studio.st-edit #hud, body.studio.st-edit #pads { display: none !important; }
#sover { position: absolute; inset: 0; z-index: 40; width: 100%; height: 100%; cursor: crosshair; }
body.studio.st-play #sover { pointer-events: none; }
body.studio.st-busy #sover { cursor: progress; }
#studio { --pan: #140c08; display: grid; gap: 8px; color: #fff2dc; font: 13px/1.3 Inter, sans-serif; }
#studio button, #studio select, #studio input { font: 400 12px "Rubik Mono One", Inter, sans-serif; color: ${INK}; background: ${SKIN}; border: 3px solid ${INK};
  border-radius: 7px 9px 6px 8px; box-shadow: 3px 3px 0 ${INK}; padding: 6px 10px; cursor: pointer; }
#studio button:nth-of-type(2n) { transform: rotate(-0.8deg); } #studio button:nth-of-type(3n) { transform: rotate(0.7deg); }
#studio button:hover { filter: brightness(1.12); } #studio button:active { box-shadow: 1px 1px 0 ${INK}; translate: 2px 2px; }
#studio button:disabled { opacity: .35; cursor: default; filter: none; }
#studio select { background: #fff2dc; max-width: 270px; }
#studio input { background: #fff2dc; font: 700 14px Inter, sans-serif; width: 9em; cursor: text; }
.sbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.sbar .time { font: 400 22px "Major Mono Display", monospace; color: #ffe9a8; min-width: 120px; text-shadow: 2px 0 ${MAGENTA}, -2px 0 #2a0f63; }
#studio button.go { background: ${GREEN}; font-size: 14px; padding: 8px 14px; }
body.studio.st-play #studio button.go { background: #ff5c5c; }
#studio button.save { background: ${PURPLE}; color: #fff2dc; }
#studio button.save.dirty { animation: sdirty 1.1s steps(2) infinite; }
@keyframes sdirty { 50% { background: ${MAGENTA}; } }
#studio button.quiet { background: #3a2a1c; color: #fff2dc; }
#studio button.quiet.on { background: ${LILAC}; color: ${INK}; }
#sstate { font: 400 12px "Major Mono Display", monospace; color: ${LILAC}; min-width: 150px; }
.sgap { flex: 1; }
#stl { width: 100%; height: 40px; display: block; cursor: ew-resize; border: 3px solid ${INK}; border-radius: 8px; background: #0b0710; box-shadow: 3px 3px 0 ${INK}; }
.srow { display: grid; grid-template-columns: 1fr minmax(240px, 330px); gap: 10px; align-items: start; }
#spal { display: flex; flex-wrap: wrap; gap: 6px; align-content: flex-start; max-height: 182px; overflow: auto; padding: 4px 6px 6px 2px; }
#spal .grp { writing-mode: vertical-rl; transform: rotate(180deg); font: 400 10px "Major Mono Display", monospace; color: ${LILAC}; height: 66px; text-align: center; margin: 0 -2px; }
#spal .card { width: 66px; height: 70px; display: grid; grid-template-rows: 1fr auto; place-items: center; padding: 4px 2px 3px; background: #241710; color: #fff2dc;
  border: 3px solid ${INK}; border-radius: 8px 6px 9px 7px; box-shadow: 3px 3px 0 ${INK}; cursor: pointer; font: 700 10px/1.05 Inter, sans-serif; text-align: center; position: relative; }
#spal .card:nth-child(3n) { transform: rotate(-1.2deg); } #spal .card:nth-child(4n+1) { transform: rotate(1deg); }
#spal .card canvas { width: 50px; height: 40px; }
#spal .card .k { position: absolute; left: 4px; top: 2px; font: 400 10px "Major Mono Display", monospace; color: ${SKIN}; }
#spal .card .pk { position: absolute; right: 3px; top: 2px; font: 900 10px Inter, sans-serif; color: ${INK}; background: #ffe9a8; border: 2px solid ${INK}; border-radius: 4px; padding: 0 3px; }
#spal .card.on { background: ${PURPLE}; box-shadow: 3px 3px 0 ${INK}, 0 0 14px ${PURPLE}; }
#spal.off .card { opacity: .3; pointer-events: none; }
#sinsp { background: var(--pan); border: 3px solid ${INK}; border-radius: 9px 7px 8px 10px; box-shadow: 4px 4px 0 ${INK}; padding: 7px 10px; min-height: 120px; max-height: 182px; overflow: auto; }
#sinsp .fs { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
#sinsp .fs .r { flex-direction: column; align-items: flex-start; gap: 1px; margin: 2px 0; }
#sinsp .r > span { white-space: nowrap; }
#sinsp h3 { margin: 0 0 3px; font: 400 14px "Major Mono Display", monospace; color: ${SKIN}; }
#sinsp .r { display: flex; align-items: center; gap: 5px; margin: 3px 0; justify-content: space-between; }
#sinsp .r b { font: 700 11px Inter, sans-serif; color: #fff2dc; }
#sinsp .r span.v { font: 400 13px "Major Mono Display", monospace; color: #ffe9a8; min-width: 44px; text-align: center; display: inline-block; }
#sinsp .r button { padding: 0 7px; font-size: 13px; white-space: nowrap; box-shadow: 2px 2px 0 ${INK}; }
#sinsp .hint { color: #b9a58e; font-size: 12px; margin-top: 4px; }
#sinsp .note { background: #2a0f63; border: 3px solid ${INK}; border-radius: 8px; padding: 8px; color: #e7dcff; transform: rotate(-0.6deg); }
#studio button.del { background: #ff5c5c; }
.stoast { position: absolute; left: 50%; top: 14px; transform: translateX(-50%) rotate(-1deg); z-index: 45; background: ${PURPLE}; color: #fff2dc; border: 3px solid ${INK};
  box-shadow: 4px 4px 0 ${INK}; border-radius: 8px; padding: 6px 12px; font: 400 14px "Major Mono Display", monospace; pointer-events: none; transition: opacity .4s; }
.ssign { position: absolute; right: 18px; bottom: 16px; z-index: 44; font: 400 17px "Major Mono Display", monospace; color: #e7dcff; pointer-events: none;
  text-shadow: 2px 0 ${MAGENTA}, -2px 0 #2a0f63, 0 0 10px #7b3cf2; animation: ssign .5s steps(5) both; }
.ssign.go { animation: ssigngo 1s steps(6) forwards; }
@keyframes ssign { 0% { opacity: 0; clip-path: inset(0 100% 0 0); } 40% { opacity: 1; transform: translateX(4px) skewX(-12deg); } 100% { opacity: .9; clip-path: inset(0 0 0 0); } }
@keyframes ssigngo { 30% { transform: translateX(-6px); clip-path: inset(40% 0 20% 0); } 100% { opacity: 0; clip-path: inset(50% 0 50% 0); transform: translateX(10px); } }
@media (max-width: 860px) { .srow { grid-template-columns: 1fr; } }`;
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
document.body.classList.add('studio'); document.title = 'Level Studio · 404';

const panel = document.createElement('div'); panel.id = 'studio';
panel.innerHTML = `
<div class="sbar">
  <select id="slvl" aria-label="level"></select>
  <span class="time" id="stime">0:00.0</span>
  <button class="go" id="splay" title="space: he gets a 2-bar run-up · shift+space: exactly here">▶ play from here</button>
  <button id="sundo" title="⌘Z">undo</button><button id="sredo" title="⇧⌘Z">redo</button>
  <button class="quiet" id="szoom" title="Z: see more of the song while you build">see ×1</button>
  <span class="sgap"></span>
  <span id="sstate"></span>
  <button class="save" id="ssave" title="⌘S">save</button>
  <button class="quiet" id="sdl" title="a copy of this level's edits, to keep">download</button>
  <button class="quiet" id="sreset" title="take every edit off this level (they're kept in the history)">reset level</button>
</div>
<canvas id="stl" aria-label="the song: drag to move through it"></canvas>
<div class="srow"><div id="spal"></div><div id="sinsp"></div></div>`;
$('stage').after(panel);
const over = document.createElement('canvas'); over.id = 'sover'; $('stage').appendChild(over);
const oc = over.getContext('2d'), tl = $('stl'), tc = tl.getContext('2d');
setTimeout(() => S.fit(), 0);

function setState(s) { state = s; document.body.classList.toggle('st-edit', s === 'edit'); document.body.classList.toggle('st-play', s === 'play'); document.body.classList.toggle('st-busy', s === 'busy');
  $('splay').textContent = s === 'play' ? '■ stop (esc)' : '▶ play from here'; }
function toast(text) { const d = document.createElement('div'); d.className = 'stoast'; d.textContent = text; $('stage').appendChild(d); setTimeout(() => { d.style.opacity = 0; }, 1400); setTimeout(() => d.remove(), 1900); }

// ---------------- the level + its course ----------------
const C = () => RUN.C;
const isMode = () => { const c = C(); return !!(c && (c.def.mode || c.def.shooter)); };
const P = () => (C() ? C().P : 0.5), OFF = () => (C() ? C().OFF : 0);
const snapT = (t, free) => free ? t : OFF() + Math.round((t - OFF()) / (P() / 4)) * (P() / 4);
const snapY = (y, free) => free ? y : Math.round(y * 10) / 10;
function tOfX(x) { const c = C(); let a = -12, b = (c ? c.end : 300) + 12; for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (c.X(m) < x) a = m; else b = m; } return (a + b) / 2; }
function baseObjs() { const c = C(); return c ? (c.def.studioBase || c.def.objs) : []; }
const floorObjs = () => { const c = C(); return c ? c.def.objs : []; };   // (the floor under the cursor: the level as it is now, his own ramps and stairs included)
let baseSigs = null, baseFor = null;
function sigList() { const b = baseObjs(); if (baseFor !== b) { baseFor = b; baseSigs = sigs(b); } return baseSigs; }

// screen <-> world (the game's own camera)
function size() { const r = $('stage').getBoundingClientRect(); return { W: r.width, H: r.height }; }
function proj(x, y) { const { W, H } = size(), v = new T.Vector3(x, y, 0).project(S.cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }
function unproj(px, py) { const { W, H } = size(), M = S.cam.matrixWorldInverse.clone().invert(), nx = px / W * 2 - 1, ny = 1 - py / H * 2;
  const a = new T.Vector3(nx, ny, -1).applyMatrix4(S.cam.projectionMatrixInverse).applyMatrix4(M), b = new T.Vector3(nx, ny, 1).applyMatrix4(S.cam.projectionMatrixInverse).applyMatrix4(M);
  const k = Math.abs(b.z - a.z) > 1e-9 ? -a.z / (b.z - a.z) : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; }   // (the ray through the pixel, met at the level's plane z = 0: the camera looks a little down)   // (pass 2: proj's own matrix inverted — the camera's matrixWorld can be a frame ahead; designer #5)

// the box (world units) of one course object, the way core.mjs + view.mjs size it
function boxOf(o) {
  const c = C(); if (!c || o.t == null) return null; const X = c.X, x = X(o.t);
  switch (o.k) {
    case 'block': return { x0: x, x1: o.tEnd != null ? X(o.tEnd) : x + (o.w || 1), y0: o.y - (o.h || 0.6), y1: o.y };
    case 'wall': return { x0: x, x1: x + (o.thick ? (o.w || 3) : 0.7), y0: o.y ?? -1, y1: (o.y ?? -1) + Math.min(o.h || 6, 6) };
    case 'spike': return { x0: x + 0.1, x1: x + 0.9 * (o.w || 1), y0: o.y, y1: o.y + (o.h || 0.55) };
    case 'hurdle': return { x0: x, x1: x + (o.w || 1.2), y0: o.y, y1: o.y + (o.h || 0.7) };
    case 'word': { const tall = o.wk === 'wall' || o.wk === 'armor', w = Math.max(o.w || 1, tall ? 0.95 : 1.0); return { x0: x + (o.w || 1) / 2 - w / 2, x1: x + (o.w || 1) / 2 + w / 2, y0: o.y0, y1: tall ? Math.min(o.y1, o.y0 + 5.6) : Math.max(o.y1, o.y0 + 0.8) }; }
    case 'orb': return { x0: x - 0.56, x1: x + 0.56, y0: o.y - 0.56, y1: o.y + 0.56 };
    case 'pad': return { x0: x - 0.45, x1: x + 0.45, y0: o.y, y1: o.y + 0.3 };
    case 'token': return { x0: x - 0.3, x1: x + 0.3, y0: o.y - 0.3, y1: o.y + 0.3 };
    case 'packet': return { x0: x - 0.35, x1: x + 0.35, y0: o.y - 0.35, y1: o.y + 0.35 };
    case 'spam': return { x0: x, x1: x + 0.9, y0: o.y, y1: o.y + (o.n || 1) * 0.9 };
    default: return null;
  }
}
const union = bs => bs.filter(Boolean).reduce((u, b) => u ? { x0: Math.min(u.x0, b.x0), x1: Math.max(u.x1, b.x1), y0: Math.min(u.y0, b.y0), y1: Math.max(u.y1, b.y1) } : { ...b }, null);
function itemBoxes(it) { if (it.type === 'hole' || it.type === 'drop') return [itemBox(it)].filter(Boolean); return itemObjs(it).map(boxOf).filter(Boolean); }
function itemBox(it) {
  const c = C(); if (!c) return null;
  if (it.type === 'hole' || it.type === 'drop') { const t0 = it.t + (it.lead || 0), y = floorAt(baseObjs(), t0 + 0.01); return { x0: c.X(t0), x1: c.X(t0 + (it.len || 0.5)), y0: y - (it.type === 'drop' ? (it.depth ?? 1) + 0.6 : 1.2), y1: y + 0.25 }; }
  return union(itemObjs(it).map(boxOf));
}
const LEAD = { low: 0.5, hurdle: 0.5, spike: 0.5, high: 0.4, wall: 0.1 };   // (where the piece sits after the press, in beats: a press ON the beat clears it)
const LENGTHY = { stairs: 1, ramp: 1, hole: 1, drop: 1, platform: 1, crumble: 1, bounce: 1 };
const lengthy = it => LENGTHY[it.type] || (it.type === 'thing' && LENGTHY[it.what]);

// ---------------- the draft (his edits) ----------------
const blank = () => ({ level: lvl, v: EDITS_V, items: [], hide: [] });
const clone = o => JSON.parse(JSON.stringify(o));
function live() { window.STUDIO_LIVE[lvl] = { ...draft, live: true }; }
let savedJ = '';   // what's in the file now (undo back to it = nothing unsaved)
const draftJ = () => JSON.stringify({ items: draft.items, hide: draft.hide });
function markDirty(v = true) { if (v && draftJ() === savedJ) v = false; dirty = v; $('ssave').classList.toggle('dirty', dirty); $('sstate').textContent = dirty ? 'not saved yet' : (draft.saved ? 'saved ' + draft.saved.slice(11, 16) : (draft.items.length || draft.hide.length ? 'saved' : 'nothing changed yet'));
  if (dirty) lsSet('draft.' + lvl, { at: Date.now(), draft }); else lsSet('draft.' + lvl, null); }
async function commit(fn, msg) {        // every change: undo point, the change, rebuild the level with it (the draft changes at once; rebuilds queue up, only the last one runs)
  if (state === 'play') return; hist.push(clone(draft)); if (hist.length > 200) hist.shift(); fut = [];
  fn(draft); live(); markDirty(); if (msg) toast(msg); await rebuild(); }
async function undo() { if (!hist.length || state === 'play') return; fut.push(clone(draft)); draft = hist.pop(); fixSel(); live(); markDirty(); await rebuild(); }
async function redo() { if (!fut.length || state === 'play') return; hist.push(clone(draft)); draft = fut.pop(); fixSel(); live(); markDirty(); await rebuild(); }
function fixSel() { if (sel && sel.kind === 'item' && !draft.items.some(i => i.id === sel.id)) sel = null; }
const newId = () => 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);

async function loadDraft(id) {
  let file = null; try { const r = await fetch(`levels/edits/${id}.json`, { cache: 'no-store' }); if (r.ok) file = await r.json(); } catch (e) {}
  const kept = lsGet('draft.' + id);   // unsaved work from last time (this browser) wins, and says so
  draft = kept && kept.draft ? kept.draft : file && typeof file === 'object' ? { ...blank(), ...file } : blank();
  draft.items = draft.items || []; draft.hide = draft.hide || []; draft.level = id;
  savedJ = file && typeof file === 'object' ? JSON.stringify({ items: file.items || [], hide: file.hide || [] }) : JSON.stringify({ items: [], hide: [] });
  const back = kept && kept.draft && draftJ() !== savedJ;
  hist = []; fut = []; sel = null; live(); markDirty(back);
  if (back) toast('your unsaved work is back');
}

// ---------------- moving through the song ----------------
// (pass 2) ONE worker holds the level: every rebuild / move asks it, and while it's busy only the newest ask is kept. Clicks, keys and
// undos made meanwhile change the draft at once and are never dropped (designer #7).
let want = null, working = false, idleW = [];
const idle = () => working ? new Promise(r => idleW.push(r)) : Promise.resolve();
function ask(rb) { want = { rebuild: !!(rb || (want && want.rebuild)) }; if (!working) work(); return idle(); }
async function work() {
  working = true; setState('busy');
  while (want) { const w = want; want = null; try { await S.at(lvl, T0, w.rebuild ? { rebuild: true } : {}); } catch (e) { console.error('studio', e); if (w.rebuild) toast('that broke the level — undo it'); } }
  working = false; setState('edit'); refreshPanel(); const ws = idleW; idleW = []; ws.forEach(r => r()); }
const rebuild = () => ask(true);
function goTo(t) {
  const c = C(); T0 = Math.max(0, Math.min(t, c ? c.end - 0.5 : t)); lsSet('last', { id: lvl, t: T0 }); lsSet('t.' + lvl, T0); $('stime').textContent = fmt(T0);
  return ask(false); }
async function openLevelUI(id, keepT) {
  await idle(); working = true; want = null;
  const prev = lvl; lvl = id; $('slvl').value = id; setState('busy');
  if (!keepT && prev !== id) { const kt = lsGet('t.' + id); T0 = kt != null ? kt : 12; }   // (each level remembers its own place, designer #14)
  tool = null; sel = null;   // (the piece in his hand doesn't follow him into another level)
  await loadDraft(id);
  await S.at(lvl, 0, { rebuild: true });
  const c = C(); T0 = Math.max(0, Math.min(T0, c.end - 0.5)); await S.at(lvl, T0);
  lsSet('last', { id: lvl, t: T0 }); $('stime').textContent = fmt(T0);
  working = false; setState('edit'); buildPalette(); refreshPanel(); const ws = idleW; idleW = []; ws.forEach(r => r());
}
async function play(exact) {
  if (state === 'play') return stop(); await idle(); if (state !== 'edit') return;
  playFrom = T0; if (FOOTPRINTS) trails[lvl] = [...(trails[lvl] || []).slice(-2), { pts: [], died: null }];
  const from = exact ? T0 : Math.max(0, T0 - 8 * P());   // (pass 2: a run-up of 2 bars, so he isn't dead before you can press — designer #1)
  globalThis.STUDIO_ZOOM = 1; setState('play'); try { await S.play(lvl, from); } catch (e) { console.error(e); }
}
async function stop(back) { if (state !== 'play') return; const s = RUN.sim && RUN.sim.s; setState('busy'); globalThis.STUDIO_ZOOM = 1 / ZOOMS[zoomI]; await goTo(back || !s ? playFrom : snapT(s.t, true)); }
// zoom out while building (designer #4): see 2 or 4 times as much song; play always uses the game's own camera
const ZOOMS = [1, 2, 4]; let zoomI = 0;
function zoom(d) { zoomI = (zoomI + (d ?? 1) + ZOOMS.length) % ZOOMS.length; globalThis.STUDIO_ZOOM = 1 / ZOOMS[zoomI]; $('szoom').textContent = 'see ×' + ZOOMS[zoomI]; $('szoom').classList.toggle('on', zoomI > 0); }

// ---------------- the palette: the game's own pieces, in this level's own look ----------------
const SHAPES = [
  { key: 'stairs', name: 'stairs', hint: 'steps up (or down) — each one a hop, or tiny ones he walks' },
  { key: 'ramp', name: 'ramp', hint: 'a slope he walks up (or down)' },
  { key: 'hole', name: 'hole', hint: 'the floor is gone: hop it' },
  { key: 'drop', name: 'drop', hint: 'the floor sinks for a stretch, then comes back up' },
];
const NICE = { bincage: 'the cage', fallthought: 'falling thought', hangmic: 'hanging mic', mascotwall: 'mascot.png', selwall: 'selection sweep', tinwall: 'the tin', toywall: 'toy.png',
  rtFineprint: 'fine print', rtTabs: 'hanging tabs', rtMic: 'the mic', rtCoat: 'the coat', rtMirror: 'the mirror', rtStampMark: 'stamp mark', rtNone: "(the story's own)" };
const nice = nm => NICE[nm] || String(nm).replace(/^rt(?=[A-Z])/, '').replace(/([a-z])([A-Z0-9])/g, '$1 $2').toLowerCase();
const KEYOF = { low: '↑', hurdle: '↑', spike: '↑', high: '↓', wall: 'space' };
function theme() { const c = C(); return (c && c.theme) || {}; }
function objSet() { const TH = theme(); return TH.igOff ? { ...DEFAULT_OBJECTS, ...(TH.objects || {}) } : { ...IG_OBJECTS }; }
function ocol() { const TH = theme(); return { a: TH.objA || TH.edge || GREEN, b: TH.objB || TH.digit2 || '#ffbf73' }; }
function paintIcon(cv, kind, extra = {}) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, TH = theme(), gr = TH.ground || TH.block || '#06140c', ed = TH.edge || GREEN;
  x.clearRect(0, 0, W, H); x.lineJoin = 'round'; x.lineCap = 'round';
  const ink = (lw = 4) => { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); };
  const floor = (y0, from = 0, to = W) => { x.fillStyle = gr; x.fillRect(from, y0, to - from, H - y0); x.fillStyle = ed; x.fillRect(from, y0, to - from, 4); };
  if (kind === 'stairs') { floor(H - 10); for (let i = 0; i < 4; i++) { const sx = 6 + i * 13, top = H - 10 - (i + 1) * 9; x.beginPath(); x.rect(sx, top, W - 6 - sx, H - 10 - top); x.fillStyle = gr; x.fill(); ink(3); x.fillStyle = ed; x.fillRect(sx, top, 13, 3); } }
  else if (kind === 'ramp') { floor(H - 10); x.beginPath(); x.moveTo(6, H - 10); x.lineTo(W - 8, 10); x.lineTo(W - 8, H - 10); x.closePath(); x.fillStyle = gr; x.fill(); ink(3); x.strokeStyle = ed; x.lineWidth = 4; x.beginPath(); x.moveTo(8, H - 12); x.lineTo(W - 10, 12); x.stroke(); }
  else if (kind === 'hole') { floor(H - 16, 0, W * 0.34); floor(H - 16, W * 0.66, W); x.fillStyle = '#000'; x.fillRect(W * 0.34, H - 16, W * 0.32, 16); x.fillStyle = PURPLE; x.font = `400 13px "Major Mono Display", monospace`; x.textAlign = 'center'; x.fillText('↓', W / 2, H - 3); }
  else if (kind === 'drop') { floor(H - 26, 0, W * 0.28); floor(H - 26, W * 0.72, W); floor(H - 8, W * 0.28, W * 0.72); x.beginPath(); x.rect(W * 0.28, H - 26, W * 0.44, 18); x.fillStyle = '#000'; x.fill(); }
  else if (kind === 'platform' || kind === 'crumble' || kind === 'bounce') { x.beginPath(); x.rect(8, H / 2 - 6, W - 16, 14); x.fillStyle = TH.block || '#06140c'; x.fill(); ink(3); x.fillStyle = kind === 'bounce' ? '#ffe14d' : ed; x.fillRect(8, H / 2 - 6, W - 16, 4);
    if (kind === 'crumble') { x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(W * 0.4, H / 2 - 6); x.lineTo(W * 0.46, H / 2 + 2); x.lineTo(W * 0.42, H / 2 + 8); x.moveTo(W * 0.7, H / 2 - 6); x.lineTo(W * 0.66, H / 2 + 8); x.stroke(); }
    if (kind === 'bounce') { x.strokeStyle = '#ffe14d'; x.lineWidth = 3; for (const k of [0.3, 0.5, 0.7]) { x.beginPath(); x.moveTo(W * k - 5, H / 2 - 12); x.lineTo(W * k, H / 2 - 18); x.lineTo(W * k + 5, H / 2 - 12); x.stroke(); } } }
  else if (kind === 'orb') { x.beginPath(); x.arc(W / 2, H / 2, 15, 0, 7); x.fillStyle = '#fff6b0'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#ffe14d'; x.stroke(); x.beginPath(); x.arc(W / 2, H / 2, 18, 0, 7); ink(2); }
  else if (kind === 'pad') { floor(H - 10); x.beginPath(); x.ellipse(W / 2, H - 10, 16, 9, 0, Math.PI, 0); x.fillStyle = '#ffe14d'; x.fill(); ink(3); }
  else if (kind === 'token') { x.beginPath(); x.arc(W / 2, H / 2, 14, 0, 7); x.fillStyle = TH.token || '#ffcf4a'; x.fill(); ink(3); x.fillStyle = '#2a1a00'; x.font = '900 16px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(TH.tokenGlyph || 'T', W / 2, H / 2 + 1); }
  else if (kind === 'spike') { floor(H - 10); x.beginPath(); x.moveTo(W / 2 - 14, H - 10); x.lineTo(W / 2, H - 34); x.lineTo(W / 2 + 14, H - 10); x.closePath(); x.fillStyle = '#ff4d3a'; x.fill(); ink(3); }
  else if (kind === 'hurdle') { floor(H - 10); x.fillStyle = '#3a0a0c'; x.fillRect(8, H - 30, W - 16, 20); x.beginPath(); x.rect(8, H - 30, W - 16, 20); ink(3); x.fillStyle = '#ffc2b8'; x.font = `400 13px "Major Mono Display", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(extra.text || '404', W / 2, H - 20); }
  else {   // low / high / wall + this level's own pieces: painted by the game's own painters (obstacles.mjs)
    const wk = extra.wk || kind, name = extra.obj || objSet()[wk], tall = wk === 'wall', pw = tall ? 70 : 96, ph = tall ? 260 : wk === 'high' ? 150 : 90;
    const art = document.createElement('canvas'); art.width = pw; art.height = ph; const ax = art.getContext('2d');
    try { (PAINT[name] || PAINT[objSet()[wk]] || PAINT.sock)(ax, pw, ph, ocol(), '404', performance.now() / 1000); } catch (e) { ax.fillStyle = SKIN; ax.fillRect(8, 8, pw - 16, ph - 16); }
    let empty = true; try { const d = ax.getImageData(0, 0, pw, ph).data; for (let i = 3; i < d.length; i += 16) if (d[i] > 20) { empty = false; break; } } catch (e) { empty = false; }
    if (empty) { ax.fillStyle = '#3a2a1c'; ax.fillRect(10, 10, pw - 20, ph - 20); ax.strokeStyle = SKIN; ax.lineWidth = 6; ax.setLineDash([12, 8]); ax.strokeRect(10, 10, pw - 20, ph - 20); }   // (a level whose story paints these itself)
    let bx = 0, by = 0, bw = pw, bh = ph; if (!empty) try { const d = ax.getImageData(0, 0, pw, ph).data; let x0 = pw, y0 = ph, x1 = 0, y1 = 0;
      for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++) if (d[(yy * pw + xx) * 4 + 3] > 20) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      if (x1 > x0 && y1 > y0) { bx = x0; by = y0; bw = x1 - x0 + 1; bh = y1 - y0 + 1; } } catch (e) {}   // (pass 2: crop to the drawing)
    const k = Math.min((W - 6) / bw, (H - 6) / bh, 2.5); x.drawImage(art, bx, by, bw, bh, (W - bw * k) / 2, (H - bh * k) / 2, bw * k, bh * k);
  }
}
let palette = [];
function buildPalette() {
  const pal = $('spal'); pal.innerHTML = ''; palette = [];
  const add = (grp, entry) => { palette.push(entry); const d = document.createElement('div'); d.className = 'card'; d.title = entry.hint || entry.name; d.dataset.i = palette.length - 1;
    const cv = document.createElement('canvas'); cv.width = 108; cv.height = 92; d.appendChild(cv); d.appendChild(Object.assign(document.createElement('span'), { textContent: entry.name }));
    if (palette.length <= 9) d.appendChild(Object.assign(document.createElement('span'), { className: 'k', textContent: palette.length }));
    const kk = entry.tool && entry.tool.type === 'thing' && KEYOF[entry.tool.what]; if (kk) d.appendChild(Object.assign(document.createElement('span'), { className: 'pk', textContent: kk }));
    if (grp) pal.appendChild(Object.assign(document.createElement('div'), { className: 'grp', textContent: grp })); pal.appendChild(d); paintIcon(cv, entry.icon, entry.extra); };
  SHAPES.forEach((s, i) => add(i === 0 ? 'shape the ground' : null, { ...s, icon: s.key, tool: { type: s.key } }));
  const own = []; const seen = new Set();   // this level's own pieces (the painters it already uses)
  for (const o of baseObjs()) if (o.k === 'word' && (o.wk === 'low' || o.wk === 'high' || o.wk === 'wall')) { const nm = o.obj || objSet()[o.wk], key = o.wk + ':' + nm; if (!seen.has(key)) { seen.add(key); own.push({ wk: o.wk, obj: o.obj || null, nm }); } }
  const HINT = { low: 'he jumps it: press ↑ on the beat', high: 'he ducks under it: hold ↓', wall: 'he glitches through it: press space', hurdle: 'a word on the floor: press ↑', spike: 'an error tooth: press ↑',
    platform: 'a ledge to stand on', crumble: 'a ledge that falls after he lands', bounce: 'a ledge that throws him up', orb: 'press ↑ while he touches it: a jump in the air', pad: 'throws him up by itself', token: 'food for him (tokens)' };
  ['low', 'high', 'wall'].forEach((wk, i) => add(i === 0 ? 'put things in his way' : null, { key: wk, name: THINGS[wk].name, icon: wk, extra: { wk }, tool: { type: 'thing', what: wk }, hint: HINT[wk] }));
  for (const w of ['hurdle', 'spike', 'platform', 'crumble', 'bounce', 'orb', 'pad', 'token']) add(null, { key: w, name: THINGS[w].name, icon: w, tool: { type: 'thing', what: w }, hint: HINT[w] });
  own.filter(o => o.obj).forEach((o, i) => add(i === 0 ? "this level's own pieces" : null, { key: 'own:' + o.obj, name: nice(o.obj), icon: o.wk, extra: { wk: o.wk, obj: o.obj }, tool: { type: 'thing', what: o.wk, obj: o.obj }, hint: `${nice(o.obj)} — ${HINT[o.wk]}` }));
  pal.classList.toggle('off', isMode());
  pal.onclick = e => { const d = e.target.closest('.card'); if (!d) return; pick(+d.dataset.i); };
}
function pick(i) { const e = palette[i]; if (!e || isMode()) return; tool = tool && tool.key === e.key ? null : { ...e.tool, key: e.key, name: e.name }; sel = null;
  [...$('spal').querySelectorAll('.card')].forEach(d => d.classList.toggle('on', tool && palette[+d.dataset.i].key === tool.key)); refreshPanel(); }

// (pass 2) a piece dropped within a quarter beat of the END of something he built up high snaps onto that end, at its height:
// ramp up, then stairs → the stairs come down off the top (designer #14 + the ramp → stairs-down flow)
function endOf(it) { const ld = it.lead || 0;
  if (it.type === 'ramp') return { t: it.t + it.len, top: it.dir === 'down' ? it.y : it.y + it.rise };
  if (it.type === 'stairs' && it.dir !== 'down') return { t: it.t + ld + (it.steps + (it.land ?? 1)) * it.stepT, top: it.y + it.steps * it.rise };
  if (it.type === 'thing' && ['platform', 'crumble', 'bounce'].includes(it.what)) return { t: it.t + ld + (it.len || 1), top: it.y };
  return null; }
function joinAt(t) { let best = null; for (const it of draft.items) { const e = endOf(it); if (e && e.top > 0.15 + floorAt(floorObjs(), e.t + 0.02) && Math.abs(t - e.t) < P() / 4 + 0.03 && (!best || Math.abs(t - e.t) < Math.abs(t - best.t))) best = e; } return best; }
function placeAt(tl, t, w, alt) {   // where a click puts the armed piece: { t, y, join }
  const fl = floorAt(floorObjs(), t + 0.01, w.y), j = tl.type === 'stairs' || tl.type === 'ramp' || tl.type === 'thing' ? joinAt(t) : null;
  if (j && !alt) return { t: +j.t.toFixed(3), y: j.top, join: true };
  const floating = tl.type === 'thing' && ['platform', 'crumble', 'bounce', 'orb', 'token', 'high'].includes(tl.what) && w.y > fl + 0.9;
  return { t, y: floating ? snapY(w.y - (tl.what === 'high' ? 1.8 : 0), alt) : fl, join: false }; }
function makeAt(tl, t, w, alt) { const pl = placeAt(tl, t, w, alt), it = makeItem(tl, pl.t, +pl.y.toFixed(2));
  if (pl.join && it.type === 'stairs') { const fl = floorAt(floorObjs(), pl.t + 0.01, pl.y - 0.3), n = Math.max(1, Math.min(16, Math.round((pl.y - fl) / it.rise)));   // (off the top, down to the floor)
    Object.assign(it, { dir: 'down', lead: 0, land: 0, steps: n, rise: +((pl.y - fl) / n).toFixed(3), y: +fl.toFixed(2) }); }
  if (pl.join && it.type === 'ramp') { it.dir = 'down'; it.y = +(pl.y - it.rise).toFixed(2); if (it.y < floorAt(floorObjs(), pl.t + 0.01)) { it.y = floorAt(floorObjs(), pl.t + 0.01); it.rise = +(pl.y - it.y).toFixed(2); } }
  return it; }
// a fresh item of the armed tool at a moment
function makeItem(tl, t, y) {
  const p = P(), it = { id: newId(), type: tl.type, t };
  if (tl.type === 'stairs') { const sT = p < 0.4 ? 2 * p : p; Object.assign(it, { lead: +(0.4 * sT).toFixed(3), y, steps: 3, rise: 0.5, stepT: +sT.toFixed(3), dir: 'up', land: 1 }); }   // (pass 2: 2 beats a step on a fast song, lead follows the step: a ±160 ms window, designer #3)
  else if (tl.type === 'ramp') Object.assign(it, { y, len: +(3 * p).toFixed(3), rise: 1, dir: 'up' });
  else if (tl.type === 'hole') Object.assign(it, { lead: +(0.2 * p).toFixed(3), len: +(0.6 * p).toFixed(3) });
  else if (tl.type === 'drop') Object.assign(it, { len: +(3 * p).toFixed(3), depth: 1 });
  else if (tl.type === 'thing') { Object.assign(it, { what: tl.what, y }); const ld = LEAD[tl.what]; if (ld) it.lead = +(ld * p).toFixed(3); if (tl.obj) it.obj = tl.obj; if (LENGTHY[tl.what]) it.len = +(2 * p).toFixed(3);
    if (['low', 'high', 'wall', 'hurdle'].includes(tl.what)) { const c = C(), sung = c && c.signs && c.signs.find(w => w.t0 <= t + 0.05 && w.t1 > t - 0.05); it.text = sung ? String(sung.text).replace(/[^\p{L}\p{N}' ?!.-]/gu, '').slice(0, 14) || '404' : '404'; } }
  return it;
}

// ---------------- the inspector ----------------
const STEP = { steps: [1, 1, 16, 0], rise: [0.1, 0.1, 2, 1], stepT: ['beat4', 0.06, 4, 2], land: [1, 0, 12, 0], len: ['beat4', 0.1, 16, 2], depth: [0.1, 0.1, 4, 1], y: [0.1, -6, 12, 1] };
const LABEL = { steps: 'steps', rise: 'step height', stepT: 'step length', land: 'top landing', len: 'length', depth: 'how deep', y: 'height' };
const label = (it, k) => it.type === 'ramp' && k === 'rise' ? 'how high' : LABEL[k];
const stairLead = x => { if (x.type === 'stairs') x.lead = x.dir === 'down' ? 0 : +(0.4 * x.stepT).toFixed(3); };   // (the lead follows the step length; down needs no press)
function fields(it) {
  if (it.type === 'stairs') return ['steps', 'rise', 'stepT', 'land', 'y'];
  if (it.type === 'ramp') return ['len', 'rise', 'y'];
  if (it.type === 'hole') return ['len'];
  if (it.type === 'drop') return ['len', 'depth'];
  return [...(LENGTHY[it.what] ? ['len'] : []), 'y'];
}
const showV = (k, v) => k === 'len' || k === 'stepT' ? (v / P()).toFixed(2).replace(/\.?0+$/, '') + ' beat' + (Math.abs(v / P() - 1) < 1e-3 ? '' : 's') : k === 'steps' || k === 'land' ? String(v) : (+v).toFixed(1);
function refreshPanel() {
  const c = C(), ins = $('sinsp'); $('sundo').disabled = !hist.length; $('sredo').disabled = !fut.length;
  if (isMode()) { ins.innerHTML = `<h3>${(LEVELS.find(l => l.id === lvl) || {}).title || lvl}</h3><div class="note">this level runs its own game (its own rules, not the runner's ground), so the hammer can't build here yet. you can still move through it and play it from any moment.</div>`; return; }
  const it = sel && sel.kind === 'item' ? draft.items.find(i => i.id === sel.id) : null;
  if (it) {
    const nm = it.type === 'thing' ? (it.obj ? nice(it.obj) : THINGS[it.what].name) : it.type;
    let h = `<h3>${esc(nm)} · ${fmt(it.t)}</h3>`;
    if (it.type === 'stairs' || it.type === 'ramp') h += `<div class="r"><b>which way</b><span><button data-dir="up" ${it.dir !== 'down' ? 'style="background:#2bff88"' : ''}>up</button> <button data-dir="down" ${it.dir === 'down' ? 'style="background:#2bff88"' : ''}>down</button></span></div>`;
    h += '<div class="fs">'; for (const k of fields(it)) h += `<div class="r"><b>${label(it, k)}</b><span><button data-k="${k}" data-d="-1">−</button> <span class="v">${showV(k, it[k] ?? 0)}</span> <button data-k="${k}" data-d="1">+</button></span></div>`;
    h += '</div>'; if ('text' in it) h += `<div class="r"><b>word</b><input id="stext" value="${esc(it.text)}" maxlength="16"></div>`;
    h += `<div class="r"><button data-nudge="-1">◀ earlier</button><button data-nudge="1">later ▶</button><button class="del" id="sdel">delete</button></div>`;
    if (it.type === 'stairs' && it.rise > 0.21 && it.dir !== 'down') h += `<div class="hint">steps taller than 0.2 need a hop each: press ↑ on each yellow key. 0.2 or less he walks. shift-click + / − = a whole beat.</div>`;
    if (c.def.cutscenes && c.def.cutscenes.some(([a, b]) => it.t >= a - 0.1 && it.t < b)) h += `<div class="hint">this is inside a cutscene (the purple on the song bar): he doesn't play here, so things in his way don't show and holes get filled.</div>`;
    ins.innerHTML = h; return;
  }
  if (sel && sel.kind === 'orig') {
    const o = baseObjs()[sel.i], hid = draft.hide.includes(sel.sig);
    ins.innerHTML = `<h3>${esc(o ? (o.text || o.label || o.k) : 'level piece')} · ${o ? fmt(o.t) : ''}</h3><div class="hint">one of the level's own pieces (${o ? o.k + (o.wk ? ' · ' + o.wk : '') : ''}). switching it off never deletes it: you can bring it back any time.</div>
      <div class="r"><button id="shide" class="${hid ? '' : 'del'}">${hid ? 'bring it back' : 'switch it off (H)'}</button></div>`; return; }
  ins.innerHTML = tool ? `<h3>${tool.name}</h3><div class="hint">click in the level where it goes (it snaps to the beat; hold alt for free). esc puts it down.</div>`
    : `<h3>the hammer</h3><div class="hint">pick a piece on the left, then click in the level.<br>click a thing you built to change it; drag it to move it, drag its right edge to make it longer.<br>click one of the level's own things to switch it off.<br>space: play (2-bar run-up) · shift+space: exactly here · esc: stop · Z: see more · ⌘Z undo · ⌘S save · wheel or [ ]: move<br>red ring + ! = a level thing is inside what you built: click it, switch it off.</div>
      <div class="hint">${draft.items.length} built · ${draft.hide.length} switched off</div>`;
}
$('sinsp').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || state === 'play') return;
  if (b.id === 'shide' && sel && sel.kind === 'orig') return toggleHide();
  const it = sel && sel.kind === 'item' ? draft.items.find(i => i.id === sel.id) : null; if (!it) return;
  if (b.id === 'sdel') return del();
  if (b.dataset.dir) return commit(d => { const x = d.items.find(i => i.id === it.id), was = x.dir || 'up'; x.dir = b.dataset.dir;
    if (x.type === 'stairs' && was !== x.dir) x.y = +(x.y + (x.dir === 'down' ? -1 : 1) * x.steps * x.rise).toFixed(2);   // (the top stays where he clicked: down = from here, down)
    stairLead(x); });
  if (b.dataset.nudge) return commit(d => { const x = d.items.find(i => i.id === it.id); x.t = Math.max(0, snapT(x.t + +b.dataset.nudge * P() / 4)); });
  if (b.dataset.k) { const k = b.dataset.k, [st, mn, mx, dec] = STEP[k], step = st === 'beat4' ? (e.shiftKey ? P() : P() / 4) : st;   // (shift-click: a whole beat)
    return commit(d => { const x = d.items.find(i => i.id === it.id), v = (x[k] ?? 0) + +b.dataset.d * step; x[k] = +Math.max(st === 'beat4' ? P() / 4 : mn, Math.min(st === 'beat4' ? mx * P() : mx, v)).toFixed(dec === 0 ? 0 : 3); if (k === 'stepT') stairLead(x); }); }
});
$('sinsp').addEventListener('change', e => { if (e.target.id !== 'stext' || !sel) return; const v = e.target.value.slice(0, 16) || '404'; commit(d => { const x = d.items.find(i => i.id === sel.id); if (x) x.text = v; }); });
async function del() { if (!sel || sel.kind !== 'item') return; const id = sel.id; sel = null; await commit(d => { d.items = d.items.filter(i => i.id !== id); }, 'gone'); }
async function toggleHide() { if (!sel || sel.kind !== 'orig' || isMode()) return; const s = sel.sig, on = !draft.hide.includes(s);
  await commit(d => { d.hide = on ? [...d.hide, s] : d.hide.filter(x => x !== s); }, on ? 'switched off' : 'back on'); }

// ---------------- pointing at the level ----------------
function at(e) { const r = over.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function hitItem(px, py) { const w = unproj(px, py); let best = null, ba = 1e9;
  for (const it of draft.items) for (const b of itemBoxes(it)) { const pad = 0.15; if (w.x >= b.x0 - pad && w.x <= b.x1 + pad && w.y >= b.y0 - pad && w.y <= b.y1 + pad) { const a = (b.x1 - b.x0) * (b.y1 - b.y0); if (a < ba) { ba = a; best = it; } } }
  return best; }
// what a click means: one of the level's own things (not ground) wins over a piece of ground he built around it — so a tin buried in new stairs can still be switched off
function pickAt(px, py) { const it = hitItem(px, py), o = hitOrig(px, py), ob = o && baseObjs()[o.i];
  if (o && ob && ob.k !== 'block' && (!it || (it.type !== 'thing' || ['platform', 'crumble', 'bounce'].includes(it.what)))) return { orig: o };
  return it ? { item: it } : o ? { orig: o } : {}; }
function hitEdge(it, px, py) { if (!lengthy(it)) return false; const b = itemBox(it); if (!b) return false; const [ex, ey0] = proj(b.x1, b.y1), [, ey1] = proj(b.x1, b.y0); return Math.abs(px - ex) < 10 && py > ey0 - 12 && py < ey1 + 12; }
function hitOrig(px, py) { const w = unproj(px, py), B = baseObjs(), Sg = sigList(); let best = null, ba = 1e9;
  for (let i = 0; i < B.length; i++) { const o = B[i]; if (o.studio) continue; const b = boxOf(o); if (!b) continue;
    if (w.x >= b.x0 && w.x <= b.x1 && w.y >= b.y0 && w.y <= b.y1) { const a = (b.x1 - b.x0) * Math.min(4, b.y1 - b.y0) * (o.k === 'block' && !o.step ? 6 : 1); if (a < ba) { ba = a; best = { kind: 'orig', i, sig: Sg[i] }; } } }
  return best; }
over.addEventListener('mousemove', e => { const [px, py] = at(e); mouse = { px, py, alt: e.altKey };
  if (drag) { dragMove(px, py, e.altKey); return; }
  if (state === 'play') return; const pk = tool ? {} : pickAt(px, py); hover = pk.orig || null;
  const it = pk.item; over.style.cursor = tool ? 'copy' : it ? (hitEdge(it, px, py) ? 'ew-resize' : 'grab') : hover ? 'pointer' : 'crosshair'; });
over.addEventListener('mouseleave', () => { mouse = null; hover = null; });
over.addEventListener('mousedown', async e => {
  if (state === 'play' || e.button !== 0) return; e.preventDefault(); const [px, py] = at(e);
  if (tool) { if (isMode()) return; const w = unproj(px, py), t = Math.max(0.05, snapT(tOfX(w.x), e.altKey));
    const it = makeAt(tool, +t.toFixed(3), w, e.altKey); sel = { kind: 'item', id: it.id };
    if (!e.shiftKey) { tool = null; [...$('spal').querySelectorAll('.card')].forEach(d => d.classList.remove('on')); }   // (shift: keep the piece in hand)
    await commit(d => { d.items.push(it); }); return; }
  const pk = pickAt(px, py), it = pk.item;
  if (it) { sel = { kind: 'item', id: it.id }; const w = unproj(px, py); drag = { id: it.id, edge: hitEdge(it, px, py), w0: w, t: it.t, y: it.y, len: it.len, steps: it.steps, moved: false }; over.style.cursor = drag.edge ? 'ew-resize' : 'grabbing'; refreshPanel(); return; }
  sel = pk.orig || null; refreshPanel();
});
function dragItem() { return drag && draft.items.find(i => i.id === drag.id); }
function dragMove(px, py, alt) { const it = dragItem(); if (!it) return; const w = unproj(px, py), c = C(); drag.moved = true;
  if (drag.edge) { const end = snapT(tOfX(w.x), alt);
    if (it.type === 'stairs') it.steps = Math.max(1, Math.min(16, Math.round((end - it.t) / it.stepT - (it.land ?? 1))));
    else it.len = +Math.max(P() / 4, end - it.t).toFixed(3); }
  else { const nx = c.X(drag.t) + (w.x - drag.w0.x); it.t = +Math.max(0.05, snapT(tOfX(nx), alt)).toFixed(3); if (it.y != null) it.y = +snapY(drag.y + (w.y - drag.w0.y), alt).toFixed(2); } }
addEventListener('mouseup', async () => { if (!drag) return; const d0 = drag, it = dragItem(); drag = null; over.style.cursor = 'grab'; if (!it || !d0.moved) return;
  const after = clone(it); Object.assign(it, { t: d0.t, y: d0.y, len: d0.len, steps: d0.steps }); if (d0.len === undefined) delete it.len; if (d0.steps === undefined) delete it.steps; if (d0.y === undefined) delete it.y;   // (back to before, so undo has it)
  await commit(d => { Object.assign(d.items.find(i => i.id === after.id), after); }); });
let wheelT = null;
over.addEventListener('wheel', e => { if (state === 'play') return; e.preventDefault(); const c = C(); T0 = Math.max(0, Math.min(T0 + Math.sign(e.deltaY || e.deltaX) * (e.shiftKey ? 2 : 0.25) * (P() / 0.5) * ZOOMS[zoomI], c ? c.end - 0.5 : T0)); $('stime').textContent = fmt(T0);
  clearTimeout(wheelT); wheelT = setTimeout(() => goTo(T0), 140); }, { passive: false });

// ---------------- the song bar ----------------
function drawTimeline() {
  const r = tl.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); if (tl.width !== Math.round(r.width * dpr)) { tl.width = Math.round(r.width * dpr); tl.height = Math.round(r.height * dpr); }
  const W = tl.width, H = tl.height, c = C(), L = c ? c.end : 240; tc.clearRect(0, 0, W, H); if (!c) return; const X = t => t / L * W;
  for (const [a, b] of c.def.cutscenes || []) { tc.fillStyle = '#2a0f63'; tc.fillRect(X(a), 0, X(b) - X(a), H); }
  tc.fillStyle = '#ffffff10'; for (let b = Math.ceil(-OFF() / P() / 4); OFF() + b * 4 * P() < L; b++) tc.fillRect(X(OFF() + b * 4 * P()), H * 0.62, 1, H * 0.38);
  { const ss = c.def.sections || []; tc.font = `${10 * dpr}px "Major Mono Display", monospace`; ss.forEach((s, i) => { tc.fillStyle = LILAC; tc.fillRect(X(s[1]), 0, 2 * dpr, H * 0.45);
    const room = (i + 1 < ss.length ? X(ss[i + 1][1]) : W) - X(s[1]) - 8 * dpr; let txt = String(s[0]).slice(0, 18); while (txt && tc.measureText(txt).width > room) txt = txt.slice(0, -1);
    tc.fillStyle = '#c9a7ff99'; if (txt) tc.fillText(txt, X(s[1]) + 4 * dpr, 11 * dpr); }); }
  for (const s of draft ? draft.hide : []) { const tt = +s.split('|')[1]; if (isFinite(tt)) { tc.fillStyle = '#ff5c5c'; tc.fillRect(X(tt) - dpr, H * 0.55, 2 * dpr, H * 0.45); } }
  for (const it of draft ? draft.items : []) { tc.fillStyle = sel && sel.id === it.id ? PURPLE : SKIN; const x0 = X(it.t), x1 = Math.max(x0 + 4 * dpr, X(it.t + (it.len || (it.type === 'stairs' ? it.stepT * (it.steps + (it.land ?? 1)) : 0.2)))); tc.fillRect(x0, H * 0.5, x1 - x0, H * 0.3); tc.strokeStyle = INK; tc.lineWidth = dpr; tc.strokeRect(x0, H * 0.5, x1 - x0, H * 0.3); }
  const tr = trails[lvl]; if (tr) for (const a of tr) if (a.died != null) { tc.fillStyle = MAGENTA; tc.fillRect(X(a.died) - dpr, 0, 2 * dpr, H); }
  const nowT = state === 'play' && RUN.sim ? RUN.sim.s.t : T0; tc.fillStyle = '#ffe9a8'; tc.fillRect(X(nowT) - 1.5 * dpr, 0, 3 * dpr, H); tc.beginPath(); tc.moveTo(X(nowT) - 7 * dpr, 0); tc.lineTo(X(nowT) + 7 * dpr, 0); tc.lineTo(X(nowT), 9 * dpr); tc.fill();
}
let tlDrag = false;
const tlT = e => { const r = tl.getBoundingClientRect(), c = C(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (c ? c.end : 240); };
tl.addEventListener('mousedown', e => { if (state === 'play') return; tlDrag = true; goTo(tlT(e)); });
addEventListener('mousemove', e => { if (tlDrag) { T0 = tlT(e); $('stime').textContent = fmt(T0); goTo(T0); } });
addEventListener('mouseup', () => { tlDrag = false; });

// ---------------- the overlay (what he built, what he switched off, where Potato really went) ----------------
function rectW(b) { const [ax, ay] = proj(b.x0, b.y1), [bx, by] = proj(b.x1, b.y0); return [ax, ay, bx - ax, by - ay]; }
function sticker(b, col, lw, dash) { const [x, y, w, h] = rectW(b); oc.save(); oc.setLineDash(dash || []); oc.lineJoin = 'round';
  oc.lineWidth = lw + 4; oc.strokeStyle = INK; oc.strokeRect(x, y, w, h); oc.lineWidth = lw; oc.strokeStyle = col; oc.strokeRect(x, y, w, h); oc.restore(); return [x, y, w, h]; }
function drawOverlay() {
  const r = $('stage').getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  if (over.width !== Math.round(r.width * dpr) || over.height !== Math.round(r.height * dpr)) { over.width = Math.round(r.width * dpr); over.height = Math.round(r.height * dpr); }
  oc.setTransform(dpr, 0, 0, dpr, 0, 0); oc.clearRect(0, 0, r.width, r.height);
  if (!C() || !draft || !S.cam) return; S.cam.updateMatrixWorld();
  if (state === 'play') return;
  // footprints: the last tries from "play from here", dotted, a purple burst where he fell (the only provable thing is the footprint)
  for (const [k, a] of (trails[lvl] || []).entries()) { const age = (trails[lvl].length - 1 - k); oc.globalAlpha = 0.85 - age * 0.3;
    oc.fillStyle = PURPLE; for (let i = 0; i < a.pts.length; i += 3) { const [x, y] = proj(a.pts[i][0], a.pts[i][1] + 0.35); oc.beginPath(); oc.arc(x, y, 2.4, 0, 7); oc.fill(); }
    if (a.died != null && a.pts.length) { const p = a.pts[a.pts.length - 1], [x, y] = proj(p[0], p[1] + 0.6); oc.strokeStyle = MAGENTA; oc.lineWidth = 3;
      for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + 0.3; oc.beginPath(); oc.moveTo(x + Math.cos(an) * 5, y + Math.sin(an) * 5); oc.lineTo(x + Math.cos(an) * (11 + (i % 2) * 6), y + Math.sin(an) * (11 + (i % 2) * 6)); oc.stroke(); } } }
  oc.globalAlpha = 1;
  // the level's own pieces he switched off: a ghost of where they were
  const B = baseObjs(), Sg = sigList(), hid = new Set(draft.hide);
  for (let i = 0; i < B.length; i++) if (hid.has(Sg[i])) { const b = boxOf(B[i]); if (!b) continue; const [x, y, w, h] = sticker(b, '#ff5c5c', 2, [5, 5]);
    oc.strokeStyle = '#ff5c5c'; oc.lineWidth = 2; oc.beginPath(); oc.moveTo(x, y + h); oc.lineTo(x + w, y); oc.stroke(); }
  if (hover) { const b = boxOf(B[hover.i]); if (b) sticker(b, GREEN, 2, [6, 4]); }
  if (sel && sel.kind === 'orig') { const b = boxOf(B[sel.i]); if (b) sticker(b, GREEN, 3); }
  // what he built
  for (const it of draft.items) { const b = itemBox(it); if (!b) continue; const on = sel && sel.kind === 'item' && sel.id === it.id;
    const [x, y, w, h] = sticker(b, on ? PURPLE : SKIN, on ? 4 : 2, on ? [] : [7, 5]);
    if (on) { oc.shadowColor = PURPLE; oc.shadowBlur = 12; oc.strokeStyle = PURPLE; oc.lineWidth = 2; oc.strokeRect(x - 3, y - 3, w + 6, h + 6); oc.shadowBlur = 0;
      if (lengthy(it)) { oc.fillStyle = PURPLE; oc.strokeStyle = INK; oc.lineWidth = 3; oc.beginPath(); oc.rect(x + w - 6, y + h / 2 - 12, 12, 24); oc.fill(); oc.stroke(); } } }
  // where to press: a little key on the floor at each beat the piece is built for (show it, don't say it)
  for (const it of draft.items) { const presses = it.type === 'stairs' && it.rise > 0.21 && it.dir !== 'down' ? Array.from({ length: it.steps }, (_, i) => it.t + i * it.stepT) : it.type === 'hole' ? [it.t] : it.type === 'thing' && LEAD[it.what] ? [it.t]
      : it.type === 'drop' && (it.depth ?? 1) > 0.21 ? [it.t + Math.max(0.1, it.len || 1) - 0.25] : [];
    const glyph = it.type === 'thing' && it.what === 'high' ? '↓' : it.type === 'thing' && it.what === 'wall' ? 'space' : '↑';
    for (const pt of presses) { const c = C(), y = it.type === 'drop' ? floorAt(B, it.t + 0.01) - (it.depth ?? 1) : (it.y ?? floorAt(B, pt)) + (it.type === 'stairs' ? (pt - it.t) / it.stepT * it.rise : 0), [x, yy] = proj(c.X(pt), y), bw = glyph.length > 1 ? 44 : 24;
      oc.fillStyle = '#ffe9a8'; oc.strokeStyle = INK; oc.lineWidth = 3; oc.beginPath(); oc.roundRect(x - bw / 2, yy - 36, bw, 26, 5); oc.fill(); oc.stroke();
      oc.fillStyle = INK; oc.font = glyph.length > 1 ? '900 12px Inter, sans-serif' : '900 18px Inter, sans-serif'; oc.textAlign = 'center'; oc.fillText(glyph, x, yy - 17); oc.textAlign = 'start'; } }
  { const ground = draft.items.flatMap(it => it.type === 'stairs' || it.type === 'ramp' || (it.type === 'thing' && ['platform', 'crumble', 'bounce'].includes(it.what)) ? itemBoxes(it) : []);
    if (ground.length) for (let i = 0; i < B.length; i++) { const o = B[i]; if (o.k === 'block' || o.studio || hid.has(Sg[i])) continue; const b = boxOf(o); if (!b) continue;
      if (ground.some(g => b.x0 < g.x1 && b.x1 > g.x0 && b.y0 < g.y1 - 0.05 && b.y1 > g.y0)) { const [x, y, w, h] = sticker(b, '#ff5c5c', 3); oc.fillStyle = '#ff5c5c'; oc.font = '900 16px Inter, sans-serif'; oc.fillText('!', x + w / 2 - 3, y - 6); } } }
  // the piece in his hand, where it would go
  if (tool && mouse && state !== 'play') { const w = unproj(mouse.px, mouse.py), t = Math.max(0.05, snapT(tOfX(w.x), mouse.alt));
    const it = makeAt(tool, t, w, mouse.alt), bs = itemBoxes(it), b = itemBox(it);
    if (b) { oc.globalAlpha = 0.9; for (const bb of bs) { const [x, y, ww, h] = rectW(bb); oc.fillStyle = it.type === 'hole' || it.type === 'drop' ? '#000000aa' : '#9a52ff55'; oc.fillRect(x, y, ww, h); oc.lineWidth = 2; oc.strokeStyle = LILAC; oc.setLineDash([3, 4]); oc.strokeRect(x, y, ww, h); oc.setLineDash([]); }
      oc.globalAlpha = 1; const [x, y] = rectW(b); oc.font = '400 12px "Major Mono Display", monospace'; oc.fillStyle = '#ffe9a8'; oc.fillText(fmt(t), x, y - 6); } }
}

// ---------------- keys ----------------
addEventListener('keydown', async e => {
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT');
  if (state === 'play') { if (e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); stop(); } return; }
  if (typing) { e.stopImmediatePropagation(); if (e.code === 'Escape') e.target.blur(); return; }   // (the letters still type; the game just doesn't hear them)
  e.stopImmediatePropagation();   // (while he builds, the game doesn't hear the keys)
  const cmd = e.metaKey || e.ctrlKey;
  if (cmd && e.code === 'KeyZ') { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
  if (cmd && e.code === 'KeyS') { e.preventDefault(); return save(); }
  if (cmd) return;
  if (e.code === 'Space') { e.preventDefault(); return play(e.shiftKey); }
  if (e.code === 'KeyZ') return zoom(e.shiftKey ? -1 : 1);
  if (e.code === 'Minus' || e.code === 'Equal') return zoom(e.code === 'Minus' ? 1 : -1);
  if (e.code === 'Escape') { tool = null; sel = null; [...$('spal').querySelectorAll('.card')].forEach(d => d.classList.remove('on')); refreshPanel(); return; }
  if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); if (sel && sel.kind === 'item') return del(); if (sel && sel.kind === 'orig' && !draft.hide.includes(sel.sig)) return toggleHide(); return; }
  if (e.code === 'KeyH' && sel && sel.kind === 'orig') return toggleHide();
  if (e.code === 'BracketLeft' || e.code === 'BracketRight') { e.preventDefault(); return goTo(T0 + (e.code === 'BracketLeft' ? -1 : 1) * (e.shiftKey ? 4 * P() : P())); }
  const it = sel && sel.kind === 'item' ? draft.items.find(i => i.id === sel.id) : null;
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); const d = e.code === 'ArrowLeft' ? -1 : 1;
    if (it) return commit(x => { const y = x.items.find(i => i.id === it.id); y.t = Math.max(0.05, +snapT(y.t + d * (e.shiftKey ? P() : P() / 4)).toFixed(3)); });
    return goTo(T0 + d * (e.shiftKey ? P() : P() / 4)); }
  if ((e.code === 'ArrowUp' || e.code === 'ArrowDown') && it && it.y != null) { e.preventDefault(); const d = e.code === 'ArrowUp' ? 1 : -1; return commit(x => { const y = x.items.find(i => i.id === it.id); y.y = +(y.y + d * (e.shiftKey ? 0.5 : 0.1)).toFixed(2); }); }
  const n = /^Digit([1-9])$/.exec(e.code); if (n) return pick(+n[1] - 1);
}, true);
addEventListener('keyup', e => { if (state !== 'play' && !(e.target && e.target.tagName === 'INPUT')) e.stopImmediatePropagation(); }, true);

// ---------------- saving (tools/serve.py's save door), the backup, reset ----------------
async function save() {
  await idle(); const body = JSON.stringify({ ...draft, live: undefined, level: lvl, v: EDITS_V });
  try { const r = await fetch(`/studio/save/${lvl}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.why || r.status); draft.saved = j.saved; savedJ = draftJ(); live(); markDirty(false); toast('saved'); if (SIGNS) potatoSigns(); }
  catch (e) { toast("couldn't save — download keeps a copy"); $('sstate').textContent = 'the save door is shut (' + (e.message || e) + ')'; }
}
function download() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...draft, live: undefined, level: lvl, v: EDITS_V }, null, 1)], { type: 'application/json' }));
  a.download = `${lvl}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
async function reset() {
  if (!confirm(`take every edit off ${lvl}?\n(the old ones are kept in levels/edits/.history, nothing is deleted)`)) return;
  try { const r = await fetch(`/studio/reset/${lvl}`, { method: 'POST' }); if (!r.ok) throw new Error(r.status); } catch (e) { toast("couldn't reach the save door"); return; }
  lsSet('draft.' + lvl, null); hist.push(clone(draft)); draft = blank(); savedJ = draftJ(); sel = null; live(); markDirty(false); toast('back to the level as built'); await rebuild(); }

// ---------------- wiring ----------------
const sl = $('slvl'); for (const l of LEVELS) sl.add(new Option(`${l.n}. ${l.title}`, l.id));
sl.onchange = async () => { if (dirty && !confirm('this level has changes that are not saved yet. keep them for later and switch?')) { sl.value = lvl; return; } await openLevelUI(sl.value); };
// (pass 2: keys pressed while it's busy are kept; only "play" waits for it)
$('splay').onclick = e => (state === 'play' ? stop() : play(e.shiftKey)); $('szoom').onclick = e => zoom(e.shiftKey ? -1 : 1);
$('sundo').onclick = undo; $('sredo').onclick = redo; $('ssave').onclick = save; $('sdl').onclick = download; $('sreset').onclick = reset;
addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

function frame() {
  try {
    if (state === 'play') { const s = RUN.sim && RUN.sim.s, tr = trails[lvl] && trails[lvl][trails[lvl].length - 1];
      if (s && tr) { const last = tr.pts[tr.pts.length - 1]; if (!last || Math.abs(last[0] - s.x) > 0.05 || Math.abs(last[1] - s.y) > 0.05) tr.pts.push([s.x, s.y]); if (s.dead && tr.died == null) tr.died = s.t; }
      if (s) $('stime').textContent = fmt(s.t);
      if (s && s.dead) { setTimeout(() => { if (state === 'play') stop(true); }, 650); }   // (a fall: straight back to where he was building, the footprints show what happened)
      else if (RUN.mode !== 'run') stop(true); }
    else if (state === 'edit' && RUN.mode !== 'run') goTo(T0);   // (the game left the level — a hidden tab, the kitchen: back in)
    drawOverlay(); drawTimeline();
  } catch (e) { console.warn('studio frame', e); }
  requestAnimationFrame(frame);
}
window.STUDIO = { get draft() { return draft; }, get state() { return state; }, get T0() { return T0; }, goTo, openLevel: openLevelUI, play, stop, save, undo, redo, pick, get sel() { return sel; }, set sel(v) { sel = v; refreshPanel(); }, commit, proj, unproj, itemBox, boxOf, baseObjs, sigList };
const urlL = new URLSearchParams(location.search).get('level'), urlT = new URLSearchParams(location.search).get('t');
if (urlL && LEVELS.some(l => l.id === urlL)) lvl = urlL; if (urlT != null && isFinite(+urlT)) T0 = +urlT;
(async () => { const w = () => new Promise(r => { const k = () => (document.getElementById('boot') && document.getElementById('boot').hidden ? r() : setTimeout(k, 100)); k(); }); await w();
  await openLevelUI(lvl); requestAnimationFrame(frame); })();

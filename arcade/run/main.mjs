// main.mjs — the runner's shell: renderer, Potato, the song clock, instant restarts (one hit = the song starts over),
// practice flags, the demo (the solver's winning run, power and all), the kitchen (the level select: walk through its door), HUD, keys + touch.
import * as T from '../play/vendor/three.module.js';
import { createSpud } from '../play/spud3d.mjs';
import { createGlitchFX } from '../play/glitchfx.mjs';
import { createIntro } from './intro.mjs';
import { createOpening } from './opening.mjs';
import { createCredits } from './credits.mjs';
import { initSfx, setSfxMuted, SFX } from '../play/sfx.mjs';
import { loadOutfit, OUTFITS3D } from '../play/outfits3d.mjs';
import { createLiveFace } from './face.mjs';
import { makeCourse, makeSim, DT, POWERS } from './core.mjs';
import { makeMusic } from '../play/music.mjs';
import { createView, POWER_COLOR, POWER_GLYPH } from './view.mjs';
import { LEVELS, loadLevel } from './levels/index.mjs';
import { BLANK_Q, blankify, blankPresses } from './blank.mjs';
import { loadEdits, applyEdits } from './studio-edits.mjs';   // Chikin's Level Studio edits (levels/edits/<id>.json) laid on top; none = the level exactly as built   // the clean-slate run (?blank, off by default): game/playthroughs/README.md

const ROOT = '../', PLAY = '../play/';                    // (the publish build rewrites these to ./)
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search), SILENT = Q.has('silent'), RATE = SILENT ? Math.min(4, +Q.get('rate') || 1) : 1;
// ?blank&nopotato (the movie's EMPTY RUNS, D-20261104-07; off by default, needs ?blank too): the level plays exactly as the blank run,
// but Potato is never drawn (nor his glitch pass, glitch words, blink trail or the bursts drawn round him); instead each frame his
// demo place is kept as data in window.__potatoNow (potatoFrame below) for the movie editors to put the model Potato on the flow.
const NOPOTATO = BLANK_Q && Q.has('nopotato');
// ?play=<id> (Nov 8): open straight into that one level and stay in it (the site's living-room console: Read the Terms). No kitchen, no other levels.
const PLAY_ONLY = Q.get('play') || null;
const stage = $('stage');
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = T.LinearSRGBColorSpace; renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
stage.prepend(renderer.domElement);
const VIEW_H = 5.6, cam = new T.OrthographicCamera(-1, 1, 1, -1, -30, 30);
let viewW = 10;
let curVH = VIEW_H;   // a level can pull the camera back (theme.viewH: Confidently Incorrect, Chikin: "the perspective needs to be further back")
function fit() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); viewW = curVH * w / h;
  cam.left = -viewW / 2; cam.right = viewW / 2; cam.top = curVH / 2; cam.bottom = -curVH / 2; cam.updateProjectionMatrix(); }
fit(); addEventListener('resize', fit);

const potatoScene = new T.Scene();
const spud = await createSpud(stage, { scene: potatoScene, base: PLAY });
spud.spud.scale.setScalar(1.18);
const pivot = new T.Group(); potatoScene.add(pivot); pivot.add(spud.spud);   // so he can hang upside down on the other wall
const fx = createGlitchFX(renderer); fx.setWordsLayer($('gwords'));
// the kitchen (intro.mjs) is the menu: glitch to pick the song (his costume + the room change), walk through the door to play it
const intro = createIntro({ T, scene: potatoScene, stage, spud, pivot, cam, fx, viewW: () => viewW, sfx: SFX });
const face = await createLiveFace(spud, PLAY).catch(e => { console.warn('face', e); return null; });   // he reacts: Vega's expressions on events, blinks at rest
const react = (name, dur) => { if (face && sim) face.show(name, sim.s.t, dur); };
intro.onFace = (name, dur) => { if (face) face.show(name, performance.now() / 1000, dur); };   // (his face reacts in the kitchen too)

// ---------- save (per viewer: which lamps are lit) ----------
const SAVE_KEY = 'potato404.runner.v1';
let save = { cleared: [], best: {}, tries: {} };   // per level: best % of the video seen, attempts
try { save = Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) {}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };
// the game's opening (opening.mjs): after start, before the kitchen; once seen it's skipped (save.opened), I in the kitchen replays it
// the opening plays for every new player: keep the dating-spam / swear glitch words out (same idea as kitchens.mjs + story.mjs)
let _openWords = null;
function openingWords() { return window.POTATO_GLITCH_WORDS || []; }   // his whole glitch vocabulary, spam and swears too (Chikin: "it could have said that stuff, its ok for potato")
const credits = createCredits({ stage, play: PLAY });
const opening = createOpening({ stage, spud, pivot, cam, fx, sfx: SFX, intro, onFace: (n, d) => intro.onFace(n, d), words: openingWords });
function playOpening(o = {}) { if (opening.active()) return; if (intro.shown()) intro.hideKitchen(); kitchenMusic(null); mode = 'opening'; for (const id of ['title', 'hub', 'hud', 'pads']) $(id).hidden = true;
  opening.play({ ...o, onDone: () => { save.opened = true; persist(); hub(); } }); }

// ---------- input ----------
const pressed = new Set(), pressAt = {};   // pressAt: when a key went down, in song time (a level with def.pressTime is judged on it, not on the frame)
const stamp = (k, e) => { pressAt[k] = now() - Math.max(0, Math.min(0.25, (performance.now() - (e && e.timeStamp || performance.now())) / 1000)); };
const KEY = { ArrowUp: 'J', KeyW: 'J', Space: 'G', KeyV: 'V', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' };
const held = new Set();   // keys held down: holding ↓ keeps him ducked
addEventListener('keyup', e => { const k = KEY[e.code]; if (k) held.delete(k); });
addEventListener('keydown', e => { const k = KEY[e.code]; if (k && mode === 'run') { e.preventDefault(); if (!e.repeat) { pressed.add(k); stamp(k, e); } held.add(k); }
  if (e.code === 'Escape' && PLAY_ONLY && window.parent !== window) { window.parent.postMessage({ potato: 'exit' }, '*'); return; }   // (?play inside the house: Esc = back to the house, Chikin Nov 8)
  if (e.code === 'Escape' && mode === 'run') quit(); if (e.code === 'KeyM') toggleMute(); });
for (const b of document.querySelectorAll('[data-key]')) b.addEventListener('pointerdown', e => { e.preventDefault(); if (mode === 'run') { pressed.add(b.dataset.key); held.add(b.dataset.key); } b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 120); });
for (const b of document.querySelectorAll('[data-key]')) for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => held.delete(b.dataset.key));
// touch: tap the stage = jump (instantly, the Impossible Game's one touch); hold the left third = duck; two fingers = glitch
{ const st = $('stage');
  let swipe = null, stick = null;   // (a free-moving level — the desktop, the black sea — on a phone: drag anywhere = hold that way; two fingers = glitch)
  const unstick = () => { for (const k of ['J', 'D', 'L', 'R']) held.delete(k); };
  st.addEventListener('touchmove', e => { if (!stick || mode !== 'run') return; e.preventDefault(); const c = e.touches[0], dx = c.clientX - stick.x, dy = c.clientY - stick.y, DZ = 16;
    const was = C && C.def.stickPress ? new Set(held) : null;
    if (Math.abs(dx) > DZ || Math.abs(dy) > DZ) stick.moved = true;   // (a 'tapdrag' level: once it moves it's a drag, not a tap)
    unstick(); if (dx > DZ) held.add('R'); if (dx < -DZ) held.add('L'); if (dy < -DZ) held.add('J'); if (dy > DZ) held.add('D');
    if (was) for (const k of ['J', 'D']) if (held.has(k) && !was.has(k)) pressed.add(k); }, { passive: false });   // (a level that wants it — the shooter's opener hops on ↑: the first push up is a press)
  st.addEventListener('touchend', e => { if (stick && !e.touches.length) { if (C && C.def.touchMode === 'tapdrag' && !stick.moved && mode === 'run' && performance.now() - (stick.at || 0) < 250) { pressed.add('G'); stamp('G', e); } stick = null; unstick(); }
    else if (stick && e.touches.length && C && C.def.touchMode === 'tapdrag') { stick.x = e.touches[0].clientX; stick.y = e.touches[0].clientY; unstick(); } }, { passive: true });   // ('tapdrag': only a quick tap (< 250 ms) is Space; a finger left down keeps steering from where it is)   // (a 'tapdrag' level — Ghost: a tap that never moved = Space)   // (a hop level — Frogger — on a phone: tap = hop forward, left third = back, swipe up/down = ↑/↓, two fingers = glitch)
  st.addEventListener('touchend', e => { if (!swipe || mode !== 'run') return; const t0 = swipe; swipe = null; const c = e.changedTouches[0], dx = c.clientX - t0.x, dy = c.clientY - t0.y;
    if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) pressed.add(dy < 0 ? 'J' : 'D'); else pressed.add(t0.left ? 'L' : 'R'); }, { passive: true });
  st.addEventListener('touchstart', e => { if (mode !== 'run' || e.target.closest('button')) return; e.preventDefault();
    if (e.touches.length >= 2 && stick && C && C.def.touchMode === 'tapdrag') { stick.moved = true; pressed.add('G'); stamp('G', e); return; }   // ('tapdrag': a second finger = Space, and the first keeps steering — a glitch ← / → / ↓)
    if (e.touches.length >= 2) { swipe = null; if (stick) { stick = null; unstick(); } pressed.add('G'); return; } const r = st.getBoundingClientRect(), x = e.touches[0].clientX - r.left;
    if (C && C.def.touchMode === 'hop') { swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY, left: x < r.width / 3 }; return; }
    if (C && (C.def.touchMode === 'stick' || C.def.touchMode === 'tapdrag')) { stick = { x: e.touches[0].clientX, y: e.touches[0].clientY, at: performance.now() }; return; }   // ('tapdrag': drag = move, a tap = Space — on touchend)
    if (C && C.def.touchMode === 'tap') { pressed.add('G'); stamp('G', e); held.add('G'); return; }   // (a one-button level — Ghost: tap = Space, keep your finger down = hold it)
    if (x < r.width / 3) { pressed.add('D'); held.add('D'); } else pressed.add('J'); }, { passive: false });
  st.addEventListener('touchend', e => { if (!e.touches.length) { held.delete('D'); if (C && C.def.touchMode === 'tap') held.delete('G'); } }, { passive: true }); }
window.__press = k => pressed.add(k);                                          // test hook

// ---------- a level ----------
let C = null, view = null, world = null, demo = null, audio = null, meta = null;
async function openLevel(id) {
  kitchenMusic(null);   // (the kitchen's instrumental fades as he goes through the door)
  intro.hideKitchen();
  best = 0; bestRunT = 0; const bm = $('bestmark'); if (bm) bm.hidden = true;
  const L = await loadLevel(id); meta = L.meta;
  const [map, wordsText, viz, music] = await Promise.all([fetch(PLAY + meta.map).then(r => r.json()), meta.words ? fetch(ROOT + meta.words).then(r => r.text()) : '',
    meta.viz ? fetch(ROOT + meta.viz).then(r => r.ok ? r.json() : null).catch(() => null) : null,
    fetch(PLAY + meta.map.replace('.map.json', '.music.json')).then(r => r.ok ? r.json() : null).catch(() => null)]);   // the music map (play/music.mjs)
  map.music = music;
  const words = meta.words ? L.parseWords(wordsText) : [];
  const ED = BLANK_Q ? null : await loadEdits(id);   // (the Level Studio: his edits file, or the studio's live draft; ?noedits = as built)
  const D = BLANK_Q ? blankify(L.build(words, map, viz), id) : ED ? applyEdits(L.build(words, map, viz), ED) : L.build(words, map, viz);   // (?blank: no threats, pickups, cutscenes — run/blank.mjs)
  if (save.easy) { let n = 0; D.objs = D.objs.filter(o => { const thin = (o.k === 'word' && (o.wk === 'low' || o.wk === 'high')) || (o.k === 'target' && !o.wall && !o.boss); return !thin || (n++ % 2 === 0); }); }   // easy: every other spike / hanging bar / target is gone (the point is seeing the video)
  C = makeCourse(D, map); C.music = makeMusic(music);
  for (const b of document.querySelectorAll('#pads [data-key]')) b.hidden = D.touchMode === 'tap' || (b.dataset.key === 'V' && (!!D.shooter || D.touchMode === 'tapdrag' || !!D.noV));   // (the shooter: Space does everything, no V — Chikin: "no more v key, just space bar") · (a one-button level, Ghost: no buttons at all, the whole screen is the button)
  fx.noWords = !!(C.theme && C.theme.gwords === false);   // (no floating glitch phrases on this level)
  { const bl = document.querySelector('#hud .bl'); if (bl) bl.style.visibility = C.theme && C.theme.hideCharge ? 'hidden' : ''; }   // (theme.hideCharge: the level shows his glitch itself — Ghost's + button in the input bar)
  paradeBs = null; if (D.parade) Promise.all((D.paradeLooks || ALL_OUTFITS).map(o => loadOutfit(o).catch(() => null))).then(bs => { paradeBs = bs; });   // (def.paradeLooks: a level's own list, opt-in; Last Lights leaves out the sheet-ghost)
  demo = await fetch(`levels/${id}.demo.json`).then(r => r.ok ? r.json() : null).catch(() => null);
  if (view && view.leave) view.leave();
  world = new T.Scene();
  curVH = (C.theme && C.theme.viewH) || VIEW_H; fit();
  view = createView(C, { world, cam, viewW: () => viewW, viewH: () => curVH, spud, fx, viz, base: PLAY, pivot, noPotato: NOPOTATO }); view.title = meta.title;
  if (audio) audio.pause(); audio = new Audio(PLAY + meta.song); audio.preload = 'auto'; audio.muted = muted;
  return C;
}

// ---------- the song clock ----------
let studioHold = false;   // the Level Studio (studio.mjs, ?studio) holds the song clock while Chikin builds
let mode = 'title', sim = null, practice = false, demoing = false, attempts = 0, flag = 0, fakeT = 0, muted = false, calm = false;
let dying = 0, arrive = 0, presses = [], pi = 0, lastGone = null, lastReborn = null, lastKeyT = 0;
let pre = null;   // the pre-roll clock (before the song starts)
const TAP = { on: false, paused: false };   // the tapper (tapper.mjs) — see window.RUN.tap
const now = () => SILENT ? fakeT : pre != null ? pre : (audio ? audio.currentTime : 0);
function toggleMute() { muted = !muted; if (audio) audio.muted = muted; if (kmusic) kmusic.muted = muted; setSfxMuted(muted); $('mute').textContent = muted ? 'sound off' : 'sound on'; }
function start(from = 0) {
  // a level can open BEFORE its song (Confidently Incorrect's typing scene: Chikin, "the music starts in potatos head"); the first
  // play and the demo get it, a retry starts at the music ("you restart at the beginning of the music")
  if (from === 0 && C.def.preroll && (demoing || attempts === 0)) from = -C.def.preroll;
  pre = !SILENT && from < 0 ? from : null;
  arrive = 0.9; dying = 0; pi = 0; if (C.def.hints) for (const h of C.def.hints) h.shown = from > h.t;
  if (demoing && demo) {              // the demo always replays the solved run from the top (fast-forwarded to `from`)
    sim = makeSim(C, Math.min(C.def.preroll && demo.presses.length && demo.presses[0][0] < 0 ? -C.def.preroll : 0, from)); presses = BLANK_Q ? blankPresses(C, demo.presses) : demo.presses;   // (a demo recorded from the opener replays from the opener: the exact run) while (pi < presses.length && presses[pi][0] < sim.s.t - DT * 0.5) pi++;   // (presses from before where it starts: skipped)
    while (sim.s.t + DT <= from && !sim.s.dead) { const inp = {}; while (pi < presses.length && presses[pi][0] <= sim.s.t + DT * 0.5) inp[presses[pi++][1]] = true; sim.step(inp); }
    if (from > 0) arrive = 0;
  } else { sim = makeSim(C, from); presses = []; }
  attempts++; $('attempt').textContent = demoing ? 'demo' : practice ? `practice · ${attempts}` : `attempt ${attempts}`;
  if (SILENT) fakeT = Math.max(from, sim.s.t); else if (pre != null) { audio.pause(); audio.currentTime = 0; } else { audio.currentTime = Math.max(0, sim.s.t); if (!studioHold) audio.play().catch(() => {}); }   // (studioHold: the Level Studio holds the frame)
  cycle = null; powerOn = null; paradeK = -1; lookOn = null; lastKeyT = sim ? sim.s.t : from; cueBroken = {}; cueWorn = -1; if (C.def.cues) C.def.cues.forEach((c, i) => { if (c.t + 0.5 < (sim ? sim.s.t : from)) { cueBroken[i] = true; cueWorn = i; } }); runPath = []; if (view) { view.deadAt = null; view.practice = practice; } autoDone = new Set((C.def.auto || []).filter(a => a.t0 < (sim ? sim.s.t : from) - 0.01)); if (face) face.reset(); baseOutfit(); setPower(sim.s.power); mode = 'run'; show(null);
}
function quit() { if (audio) audio.pause(); if (view && view.leave) view.leave(); hub(meta && meta.id); }   // (view.leave: the shooter's ship off his pivot)   // back to the kitchen, in that song's look
function show(id) { for (const s of ['title', 'hub']) $(s).hidden = s !== id; $('hud').hidden = !!id || BLANK_Q; $('pads').hidden = !!id || BLANK_Q; }   // (?blank: never a HUD)
function setPower(p) { const el = $('slot'); el.className = p ? 'full' : ''; el.textContent = p ? (POWER_GLYPH[p] || '◆') : '';
  el.style.setProperty('--pc', p ? POWER_COLOR[p] : '#ffcf4a'); el.hidden = !(meta && meta.power); }

// ---------- the kitchen: the menu is the room ----------
// Chikin: "for the kitchen can you take away the menu, you can narrow it to ten costumes, each representing a song, with a door
// to the left of the screen that you walk through to start the level"; "so you glitch to select the level, the song name
// appears in glitch text with each costume change". kitchens.mjs STYLES are in album order, one per song (st.level). The
// glitch button / space / an icon change the look (= the song); the door on the left starts it; finished songs light the
// lamp on the door's sign and get a lit mark on their icon. The pick is remembered. He's playable in here: ← → walk (← into
// the door goes through it), ↑ hop + spin, ↓ duck, space glitch; phone: tap / drag = walk there (the door = go in), swipe up
// = hop, two fingers = glitch. Quiet keys for the extras (no buttons on screen): enter = play, P = practice (flags),
// O = watch the demo (he goes through the WATCH door on the right: walking / tapping into it does the same), Y = the plain music
// video (once finished), shift+E = easy on/off (his face says which).
// The room's things (kitchens.mjs props, intro.mjs): ↑ hops him up onto tables / chairs / counters, walking into some sets them off,
// E uses the one he's next to (the sparkle; nothing near: he walks to the nearest), and a tap / click on one walks him over beside it
// to use it (or hop on it); a tap on him uses what he's next to. A drag never picks anything: he just follows the finger.
const styleOf = id => Math.max(0, intro.styles.findIndex(st => st.level === id || st.level === (LEVELS.find(L => L.id === id) || {}).was));   // (a ?flag runner keeps its kitchen door: L.was)
const levelOf = i => LEVELS.find(L => L.id === intro.styles[i].level || L.was === intro.styles[i].level);
// the demo plays the album straight on: after each watched song, the next one's demo starts (album order = levels/index.mjs)
async function nextDemo(fromId) { const i = LEVELS.findIndex(L => L.id === fromId), N = LEVELS[i + 1];
  if (!N) { hub(fromId); return; }
  try { await openLevel(N.id); } catch (e) { console.error(e); hub(fromId); return; }
  practice = false; demoing = true; view.videoMode = false; attempts = 0; flag = 0; start(0); }
// THE DEMO IS POTATO RUNNING A SIMULATION (Chikin, Nov 1: "its like potato running a simulation … a special model of potato made up
// of binary"): while a demo plays (the WATCH door, and the album running on from it; not Y's plain music video) he wears the
// 'simulation' skin over whatever the level dresses him in. Every other wear() still lands underneath (remembered) and is put
// back the moment the demo ends (kitchen, a real run, the video). simSync() runs once a frame; a small corner tag names the run.
const simSkin = { b: null, on: false, want: null, wear: spud.wear, run: 0, lvl: null, tag: null };
loadOutfit('simulation').then(b => { simSkin.b = b; }).catch(e => console.warn('simulation skin', e));
// Chikin, Nov 8: in Ghost in the Group Chat's demo he's just a GHOST (sheet-ghost), not the binary one; the only change there
const DEMO_SKIN = {}, demoSkins = {};   // (Chikin, Nov 8 later: "the demo he needs to be binary": every demo is the binary Potato again; the ghost is only for playing Ghost)
for (const [id, slug] of Object.entries(DEMO_SKIN)) loadOutfit(slug).then(b => { demoSkins[id] = b; }).catch(e => console.warn('demo skin', e));
spud.wear = b => { simSkin.want = b; if (!simSkin.on) simSkin.wear(b); };
let wornNow = null; if (NOPOTATO) { const w0 = simSkin.wear; simSkin.wear = b => { wornNow = b; return w0(b); }; }   // (?nopotato: which outfit the demo has him in, for the data)
// ?nopotato: his demo place this frame, in video pixels (1920x1080 of the stage) + world units; read by playthroughs/recordblank.py
const _pv = T ? new T.Vector3() : null;
function potatoFrame() { const s = sim.s, W = 1920, H = 1080, r2 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 1000) / 1000;
  const P = v => { v.project(cam); return [r2((v.x * 0.5 + 0.5) * W), r2((0.5 - v.y * 0.5) * H)]; };
  spud.spud.updateWorldMatrix(true, true);
  const feet = P(spud.spud.localToWorld(_pv.set(0, 0, 0))), top = P(spud.spud.localToWorld(_pv.set(0, 1.075, 0)));   // (the top of his head, undeformed: feet nubs 0.075 + body 1, in his own units)
  const R = view.potatoRect(s), vis = !!pivot.visible;
  const state = !vis || s.gone ? 'gone' : s.fly ? 'fly' : s.ducking ? 'duck' : s.frozen ? 'frozen' : (s.air != null ? s.air : !s.ground) ? (s.vy > 0 ? 'jump' : 'fall') : (s.walking != null ? s.walking : true) ? 'run' : 'stand';
  const slug = wornNow ? Object.keys(OUTFITS3D).find(k => OUTFITS3D[k] === wornNow) || '?' : null;
  return { t: r3(s.t), x: r3(s.x), y: r3(s.y), state, vis, feet, top, box: [r2(R.x * W), r2((1 - R.y - R.h) * H), r2(R.w * W), r2(R.h * H)],
    ppu: r2(H / curVH), yaw: r3(spud.spud.rotation.y), roll: r3(pivot.rotation.z), flip: r3(pivot.rotation.x), scale: r3(pivot.scale.x),
    ground: !!s.ground, vy: r2(s.vy || 0), facing: s.facing != null ? r3(s.facing) : null, cutscene: s.cutscene || null,
    face: face && face.now ? face.now() : null, outfit: slug, glitch: r2(fx.amount || 0),
    look: view.lookAt != null ? r3(view.lookAt) : null, brk: view.breakEv ? r3(view.breakEv.t) : null, power: view.powerOn ? view.powerOn.p : null, revert: view.revertAt != null ? r3(view.revertAt) : null,
    blink: s.blink > 0 ? r2(s.blink) : 0, jumped: s.jumpedAt != null ? r3(s.jumpedAt) : null, won: !!s.won }; }
function simSync() { const demoOn = !!(simSkin.b && demoing && (mode === 'run' || mode === 'done') && view && !view.videoMode && meta && !TAP.on);
  // a level that starts him as code (def.codeUntil, Thursday: "it starts in binary, because hes just code", Chikin): the same binary
  // skin until then, in every mode (play, practice, demo, video); his own skin floods in at codeUntil
  const code = !!(simSkin.b && sim && C && C.def.codeUntil && (mode === 'run' || mode === 'done') && sim.s.t < C.def.codeUntil), on = demoOn || code;   // (the tapper watches the demo in the song's own look)   // ('done': the won song's tail still plays in the demo, so he stays the simulation + the run count carries to the next song)
  if (demoOn && simSkin.lvl !== meta.id) { simSkin.lvl = meta.id; simSkin.run++; if (simSkin.tag) simSkin.tag.textContent = `simulation · run ${simSkin.run}`; }
  const skin = demoOn && meta && demoSkins[meta.id] ? demoSkins[meta.id] : simSkin.b;   // (the level's own demo skin, else binary)
  if (on === simSkin.on && (!on || skin === simSkin.cur)) return; simSkin.on = on; simSkin.cur = on ? skin : null; simSkin.wear(on ? skin : simSkin.want);
  if (!demoOn) { simSkin.run = 0; simSkin.lvl = null; }
  if (!simSkin.tag) { const e = simSkin.tag = document.createElement('div'); e.id = 'simtag'; e.textContent = `simulation · run ${simSkin.run}`;
    e.style.cssText = 'position:absolute;left:14px;top:12px;padding:2px 7px;border-radius:6px;background:#000000a0;font:400 11px "Major Mono Display",monospace;color:#4dff9a;opacity:0.8;letter-spacing:0.04em'; $('hud').appendChild(e); }
  simSkin.tag.hidden = !demoOn; }
const songList =() => intro.styles.map(st => { const L = LEVELS.find(l => l.id === st.level || l.was === st.level); return { n: L.n, title: L.title, cleared: save.cleared.includes(L.id) }; });
// the kitchen plays the picked song without its lyrics (Chikin: "have the music without lyrics playing for each level selection"):
// a ~32 s instrumental loop per song (play/songs/<id>.inst.mp3, made by game/inst/cut.py), crossfading on every glitch
let kmusic = null, kmusicId = null;
function fadeAudio(a, to, ms, done) { const from = a.volume, t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step); else if (done) done(); }; step(); }
function kitchenMusic(id) {
  if (id && id === kmusicId && kmusic) { if (kmusic.paused) kmusic.play().catch(() => {}); return; }
  if (kmusic) { const old = kmusic; fadeAudio(old, 0, 350, () => old.pause()); }
  kmusicId = id || null; kmusic = null; if (!id) return;
  kmusic = new Audio(PLAY + 'songs/' + id + '.inst.mp3'); kmusic.loop = true; kmusic.muted = muted; kmusic.volume = 0;
  kmusic.play().then(() => fadeAudio(kmusic, 0.8, 500)).catch(() => {});
}
function hub(back) {   // back = the level he's coming out of (he steps out of its door, in its look)
  if (PLAY_ONLY) { start(0); return; }   // (?play=<id>: one level only, e.g. the site's living-room console; out of the level = straight back into it)
  if (audio) audio.pause(); mode = 'menu'; world = null; curVH = VIEW_H; fit(); show('hub');
  intro.setSongs(songList()); intro.showKitchen(back ? styleOf(back) : styleOf(save.song), { back: !!back, watch: !!back && demoing && !(view && view.videoMode) }); kitchenRow(); kitchenMusic(intro.styles[intro.style()].level);   // (back from a demo: he steps out of the watch door; Y's plain video went in by the song's door, so he comes back out of that one)
}
function kitchenRow() {
  const row = $('kicons');
  if (!row.children.length) intro.styles.forEach((st, i) => { const c = document.createElement('canvas'); c.width = c.height = 96; st.icon(c.getContext('2d'), 96);
    const L = levelOf(i), b = document.createElement('button'); b.className = 'kicon'; b.setAttribute('aria-label', `${L.n}. ${L.title}`); b.title = `${L.n}. ${L.title}`; const im = new Image(); im.alt = ''; im.src = c.toDataURL('image/png'); b.appendChild(im);
    b.onclick = e => { pickKitchen(i); if (e.detail) b.blur(); }; row.appendChild(b); });   // (a mouse / tap pick hands the keys back to him: ← → ↑ ↓ space enter)
  [...row.children].forEach((b, i) => { const on = i === intro.style(); b.classList.toggle('on', on); b.classList.toggle('done', save.cleared.includes(intro.styles[i].level)); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
function pickKitchen(i) { if (intro.busy()) return; initSfx(); intro.setStyle(i); save.song = intro.styles[intro.style()].level; persist(); kitchenRow(); kitchenMusic(save.song);
  const g = $('kglitch'); g.classList.remove('hit'); void g.offsetWidth; g.classList.add('hit'); }
$('kglitch').onclick = e => { pickKitchen(intro.style() + 1); if (e.detail) e.currentTarget.blur(); };
// THE SECRET LEVEL (Chikin, Nov 2: "can you just add it to the kitchen"): a little pumpkin after the song icons plays 404 Boo Not
// Found right here (it isn't one of the ten songs, so it has no costume or door of its own; Esc / the end brings him back out)
{ const b = document.createElement('button'); b.id = 'kboo'; b.className = 'kicon'; b.title = b.ariaLabel = '404 Boo Not Found (secret)';
  b.innerHTML = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M19 9c0-4 3-5 5-5" stroke="#3a6b1f" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="24" rx="15" ry="12" fill="#ff8a2b" stroke="#120a05" stroke-width="2.5"/><path d="M20 12v24M12 14c-3 6-3 14 0 20M28 14c3 6 3 14 0 20" stroke="#c45a10" stroke-width="1.6" fill="none"/><path d="M12 21l4-3 2 4zM28 21l-4-3-2 4zM13 28q7 5 14 0l-3 1-1-2-2 2-2-2-2 2-1-2z" fill="#120a05"/></svg>';
  b.onclick = async e => { if (intro.busy()) return; initSfx(); if (e.detail) b.blur(); kitchenMusic(null);
    try { await window.RUN.start('boo-not-found', 0); } catch (err) { console.error(err); hub(); } };
  $('kstyles').appendChild(b); }
const kitchenLive = () => mode === 'menu' && !$('hub').hidden && intro.shown() && !intro.busy();
// through the door: the level loads behind the white, starts, and the white lifts off it
intro.onEnter = async how => {
  const L = levelOf(intro.style()); save.song = L.id; persist();
  try { await openLevel(L.id); } catch (e) { console.error(e); intro.unwhite(); hub(); return; }
  if (how === 'video' && !save.cleared.includes(L.id)) how = 'play';
  practice = how === 'practice'; demoing = how === 'demo' || how === 'video'; view.videoMode = how === 'video'; attempts = 0; flag = 0; start(0);
  if (how === 'video') { $('hud').hidden = true; $('pads').hidden = true; }
  intro.unwhite(); };
const QUIET = { Enter: 'play', KeyP: 'practice', KeyO: 'demo', KeyY: 'video' };
addEventListener('keydown', e => { if (!kitchenLive() || e.metaKey || e.ctrlKey || e.altKey) return;
  if (QUIET[e.code] && !e.repeat) { if (e.code === 'Enter' && e.target.closest && e.target.closest('button')) return; e.preventDefault(); initSfx(); intro.enterDoor(QUIET[e.code]); return; }
  if (e.code === 'KeyI' && !e.repeat) { e.preventDefault(); initSfx(); playOpening(); return; }   // I: watch the opening again
  if (e.code === 'KeyE' && e.shiftKey) { e.preventDefault(); if (!e.repeat) { save.easy = !save.easy; persist(); intro.onFace && intro.onFace(save.easy ? 'sleepy' : 'smirk', 1.2); intro.poke(); } return; }   // shift+E: easy on/off (every other spike gone: the point is seeing the video)
  if (e.code === 'KeyE') { e.preventDefault(); if (!e.repeat) { initSfx(); intro.use(); } return; }   // E: use the thing he's next to (the lamp, the fridge, the pot...); nothing in reach: he walks to the nearest one. Never easy in here
  const k = KEY[e.code];
  if (!k || k === 'V') return; if (k === 'G') { if (e.target.closest && e.target.closest('button')) return; e.preventDefault(); if (!e.repeat) pickKitchen(intro.style() + 1); return; }   // (space on a focused button presses that button instead)
  e.preventDefault(); initSfx(); if (!e.repeat || k === 'D') intro.key(k, true); });
addEventListener('keyup', e => { const k = KEY[e.code]; if (k && k !== 'G' && k !== 'V' && intro.shown()) intro.key(k, false); });
{ const hb = $('hub'); let tz = null;
  const at = (x, y) => { const r = stage.getBoundingClientRect(); return [(x - r.left) / r.width, (y - r.top) / r.height]; };
  let lastTouch = -9;   // (a click that comes from a finger gets fingertip-sized tap boxes: 44 css px at least; a mouse: 20)
  const minBox = () => (performance.now() - lastTouch < 800 ? 44 : 20) * 1600 / Math.max(1, stage.getBoundingClientRect().width);
  hb.addEventListener('click', e => { if (!kitchenLive() || e.target.closest('button, #kstyles') || tz === 'used') { tz = null; return; } initSfx(); intro.walkTo(...at(e.clientX, e.clientY), { min: minBox() }); });
  hb.addEventListener('touchstart', e => { if (!kitchenLive() || e.target.closest('button, #kstyles')) { tz = null; return; } if (e.touches.length >= 2) { pickKitchen(intro.style() + 1); tz = 'used'; return; } const c = e.touches[0]; tz = { x: c.clientX, y: c.clientY, drag: false }; }, { passive: true });
  hb.addEventListener('touchmove', e => { if (!tz || tz === 'used' || !kitchenLive() || e.touches.length !== 1) return; const c = e.touches[0];   // drag: he follows your finger
    if (Math.abs(c.clientX - tz.x) > 14) { tz.drag = true; const [u, v] = at(c.clientX, c.clientY); intro.walkTo(u, intro.onDoor(u, v) ? v : 0.8, { drag: true }); } }, { passive: true });   // (a drag never picks a thing in the room: he just follows)
  hb.addEventListener('touchend', e => { lastTouch = performance.now(); if (!tz || tz === 'used' || !kitchenLive()) return; const c = e.changedTouches[0], dy = c.clientY - tz.y;
    if (!tz.drag && dy < -40 && Math.abs(dy) > Math.abs(c.clientX - tz.x)) { intro.key('J', true); tz = 'used'; } else tz = null; }, { passive: true }); }
$('start').onclick = () => { initSfx(); SFX.click(); if (save.opened) hub(); else playOpening(); };   // the opening once (any key / tap skips it), then straight into the kitchen
$('calm').onclick = () => { calm = !calm; $('calm').textContent = calm ? 'calm lights: on' : 'calm lights: off'; };
$('mute').onclick = toggleMute;
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'run' && !SILENT && !TAP.on) quit(); });   // (the tapper pauses itself instead)

// ---------- loop ----------
let last = performance.now();
function loop(ms) {
  const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
  simSync();   // (the demo's simulation skin on / off)
  if (TAP.on) { pressed.clear(); held.clear(); }   // (the tapper: his keys / touches never drive the demo)
  if (mode === 'run' && sim && !(TAP.on && TAP.paused)) {   // (the tapper's pause holds the song clock, the pre-roll too)
    if (SILENT) { if (!studioHold) fakeT += dt * RATE; }
    else if (pre != null) { if (!studioHold) pre += dt; if (pre >= 0) { pre = null; audio.currentTime = 0; audio.play().catch(() => {}); } }   // the music starts (in his head)
    const t = now(), s = sim.s;
    if (dying > 0) {
      dying -= dt; fx.amount = Math.min(1, 0.5 + dying);
      if (dying <= 0) { const was = sim.s; start(practice ? flag : C.def.retryAt ? C.def.retryAt(sim.s.t) : C.def.retry === 'section' ? C.secs[C.secAt(Math.max(0, sim.s.t - 1.5))].t : 0   /* (the section he was playing — a death right on a section line used to skip him ahead: Chikin) */);   // (a level can retry from the section you died in)
        if (C.def.shooter && was.gunGot && sim.s.t > 0) { const at = sim.s.t; let g = 0; for (const k in was.gunGot) if (was.gunGot[k] < at) g++; sim.s.gun = Math.min(3, g); } }   // (the shooter: you keep the gun you had when that section started)
    } else {
      while (sim.s.t + DT <= t && !sim.s.dead && !sim.s.won) {
        const inp = {}; for (const k of pressed) { if (C.def.pressTime && pressAt[k] > sim.s.t + DT * 1.5) continue; inp[k] = true; if (C.def.pressTime && pressAt[k] != null) inp[k + 't'] = pressAt[k]; pressed.delete(k); } if (C.def.shooter || C.def.mode) { if (!demoing) { inp.Uh = held.has('J'); inp.Dh = held.has('D'); inp.Lh = held.has('L'); inp.Rh = held.has('R'); inp.Gh = held.has('G'); inp.Vh = held.has('V'); } } else if (held.has('D') && !demoing) inp.D = true;   // the shooter: hold to fly   // (def.pressTime: a press waits for the step it happened in, and carries its moment: inp.Gt)
        while (pi < presses.length && presses[pi][0] <= sim.s.t + DT * 0.5) { inp[presses[pi][1]] = true; pi++; }
        const had = { charge: s.charge, power: s.power, ground: s.ground, air: s.airJumped };
        sim.step(inp);
        if (inp.J && had.ground && !s.ground) { SFX.jump(true); react('wide', 0.45); }
        if (s.orbAt === s.t) { SFX.orb(); react('smirk', 0.4); }
        if (s.padAt === s.t) { SFX.pad(); react('wide', 0.6); }
        if (!had.ground && s.ground && s.streak > 0 && s.jumpedAt != null && s.t - s.jumpedAt < 2) SFX.beat();
        if (C.def.shooter) { if (fxSim !== sim) { fxSim = sim; fxSeen = s.fxN || 0; } const nf = s.fxN || 0; if (nf > fxSeen) { const F = s.fx || [], fresh = F.slice(Math.max(0, F.length - (nf - fxSeen))); fxSeen = nf;   // the shooter's hits + booms (play/sfx.mjs; a stream of them is spaced so it never buzzes)
          const ms = performance.now(); for (const e of fresh) { const ok = (k, gap) => { if (ms - (sndAt[k] || 0) < gap) return false; sndAt[k] = ms; return true; };
            if (e.k === 'hit' && ok('hit', 45)) SFX.rockHit(); else if (e.k === 'iron' && ok('iron', 60)) SFX.tink(); else if (e.k === 'ship' && ok('ship', 280)) SFX.shipHit();   // (one clank per ~4 bolts on a hull)
            else if (e.k === 'kill' && ok('kill', 55)) { SFX.rockBoom(!!e.big); react('smirk', 0.3); } else if (e.k === 'chunk') SFX.bossChunk(); else if (e.k === 'bossdown') SFX.bossBoom(!!e.small); else if (e.k === 'pulse') SFX.gpulse();
            else if (e.k === 'tell') SFX.spit(); else if (e.k === 'spit') SFX.spitGo(); else if (e.k === 'hurt') { SFX.hullHit(e.n <= 0); react('shock', 0.7); } else if (e.k === 'worn') { SFX.bossChunk(); SFX.mend(); react('laugh', 0.9); } } } }   // (the spit's sound is its wind-up: you hear it coming)
        if (inp.J && !had.ground && !had.air && s.airJumped) { SFX.jump(false); react('smirk', 0.6); }
        if (inp.G && had.charge && !s.charge) { SFX.glitch(false); react('startled', 0.4); }
        if (C.def.shooter && s.shotAt === s.t && s.shotLoud) SFX.zap(s.gun || 0);   // the gun fires by itself on the 32nds: a glitch pew on the 16ths (on the music)
        if (C.def.shooter && s.glitchAt === s.t) { if (s.glitchKind !== 'phase') SFX.glitch(false); if (s.glitchKind === 'ship') { SFX.transform(); react('smirk', 1.0); } else react('startled', 0.35); }   // (on the music: he glitches into his ship)
        if (C.def.shooter && s.gunAt === s.t) { SFX.download(); react('smirk', 0.8); }   // his gun levels up
        if (C.def.shooter && s.special && s.special.t === s.t) { SFX.glitch(false); SFX.hit(); setTimeout(() => SFX.hit(), 140); react('laugh', 1.4); arrive = Math.max(arrive, 0.45); }   // his special: he glitches, and boom
        if (C.def.shooter && C.def.shooter.finale != null && s.t - DT < C.def.shooter.finale && s.t >= C.def.shooter.finale) { SFX.transform(); react('angry', 1.6); }   // the charge
        if (C.def.shooter && C.def.shooter.finale != null && s.t - DT < C.def.shooter.finale + 1.6 && s.t >= C.def.shooter.finale + 1.6) { SFX.power(); SFX.hit(); react("scream", 2.8); }   // the big laser
        if (C.def.shooter && s.t >= 0 && (inp.J || inp.D)) react('wide', 0.25);
        if (inp.D && s.ducking) react('thinking', 0.5);
        if (!had.power && s.power) { SFX.download(); setPower(s.power); flash(`you got the glitch: ${POWERS[s.power].name} — ${POWERS[s.power].hint}`); react('question', 0.9); }
        if (had.power && !s.power) { SFX.power(); setPower(null); flash(POWERS[s.usedWhat].verb); powerUp(s.usedWhat, s); }
        if (s.react && s.react.at === s.t) react(s.react.name, s.react.dur || 0.8);
        if (s.fxEv && s.fxEv.at === s.t) { arrive = Math.max(arrive, s.fxEv.k || 0); if (s.fxEv.sfx && SFX[s.fxEv.sfx]) SFX[s.fxEv.sfx](s.fxEv.arg); }   // E5: a level's scripted glitch (s.fxEv = { at, k, sfx, arg }): his glitch fx + its sound, with no press (Confidently Incorrect's intro, Mom)
        if (C.def.faces) for (const [ft, fn, fd] of C.def.faces) if (s.t - DT < ft && s.t >= ft) react(fn, fd || 1);   // a level's faces on song moments: faces: [[t, name, dur]]   // a mode asks for a face: s.react = { name, dur, at: s.t }
        if (demoing) for (const k of Object.keys(inp)) callout(k);
        if ((inp.L || inp.R) && !C.def.shooter && (!C.def.mode || (typeof C.def.spin === 'function' ? C.def.spin(s) : C.def.spin))) {   /* (def.spin can be a test: Last Lights spins him only when its rules counted one) */   /* (the shooter's opener walks on ←/→; ↑ hops + spins there) */   /* (a mode level can ask for the spin: def.spin) */   // (the shooter's opening too: normal rules till he's in space)   // ← / → : he spins on the spot, happy or surprised (Chikin: "that would be fun")
          view.spinReq = (view.spinReq || 0) + (inp.L ? -1 : 1); react(['laugh', 'smirk', 'wide', 'shock', 'startled'][Math.floor(Math.random() * 5)], 0.7); }
        if (C.def.hints) for (const h of C.def.hints) if (!h.shown && s.t >= h.t) { h.shown = true; flash(h.text); }   // the first time each move shows up
        if (practice) { const si = C.secAt(s.t); if (C.secs[si].t > flag) { flag = C.secs[si].t; flash('flag: ' + C.secs[si].name); } }
      }
      if (s.dead) { dying = 0.75; SFX.die(); react('shock', 1.2); view.deadAt = performance.now() / 1000; if (!demoing) { /* no death X anywhere (Chikin: "you can take out the death x, i dont like them") */ if (s.t > bestRunT) { bestRunT = s.t; view.ghostPath = runPath.slice(); } } if (!SILENT && audio) audio.pause(); deathCard(s); }
      if (s.won) { mode = 'done'; show('done'); SFX.win(); react('smirk', 99);   // (the song plays on to its last note — Chikin: "it cuts off before the song ends")
        if (!demoing && !practice && !save.cleared.includes(meta.id)) { save.cleared.push(meta.id); persist(); }
        if (!demoing && !practice && save.easy) { save.easyOnly = save.easyOnly || {}; if (!(save.hard || {})[meta.id]) save.easyOnly[meta.id] = true; persist(); }
        if (!demoing && !practice && !save.easy) { save.hard = save.hard || {}; save.hard[meta.id] = true; persist(); }
        const wonId = meta.id, left = audio && isFinite(audio.duration) ? Math.max(0, audio.duration - audio.currentTime) : 0;
        setTimeout(() => { if (mode !== 'done' || meta.id !== wonId || TAP.on) return;   // (the tapper: the song plays to its end and the tapper takes him back to its list, no credits, no next song)
          if (wonId === 'last-lights-on' && !practice && !view.videoMode) { mode = 'credits'; if (audio) audio.pause(); credits.play({ muted, onDone: () => hub(wonId) }); }   // the end credits, over Thursday Potato (after a watched demo too)
          else if (demoing && !view.videoMode) { if (audio) audio.pause(); nextDemo(wonId); }   // WATCH runs the album on from here (Chikin: "from whichever song you start … till the end of last lights")
          else { if (audio) audio.pause(); hub(wonId); } }, Math.max(2600, left * 1000 + 400)); }   // the song to its end, then out of its door (its lamp lit)
      if (!demoing && (!runPath.length || s.t - runPath[runPath.length - 1][0] > 0.05)) runPath.push([s.t, s.x, s.y + (C.def.shooter ? 0 : 0.62)]);   // record this attempt (the ghost of your best run)
      arrive = Math.max(0, arrive - dt);
      fx.amount = arrive > 0 ? arrive / 0.9 : C.def.fxQuiet && C.def.fxQuiet(s.t, s) ? 0 : (s.phase > 0 ? 0.9 : (s.blink > 0 ? 0.75 * s.blink / 0.22 + 0.2 : (s.hurtAt != null && s.t - s.hurtAt >= 0 && s.t - s.hurtAt < 0.4 ? 1 - (s.t - s.hurtAt) / 0.5 : 0)));   // (the shooter: a hit glitches him)
    }
    const si = C.secAt(sim.s.t), wf = C.def.warmFrom;
    view.draw(sim, sim.s.t, dt, { warm: wf ? Math.max(0, Math.min(1, (sim.s.t - wf) / 12)) : 0, calm, lights: C.def.lights ? C.def.lights(sim.s.t) : 1, darkAt: C.def.darkAt ? C.def.darkAt(sim.s.t, sim.s) : 0 });
    if (C.secs[si].name !== $('section').textContent && sim.s.t > 3.5 && mode === 'run' && !dying) flash(C.secs[si].name);   // a section turn: its name glitches in
    
    $('progress').style.width = (Math.min(1, C.def.progressAt ? C.def.progressAt(sim.s.t) : sim.s.t / C.end) * 100).toFixed(1) + '%';   // (def.progressAt: Thursday's bar is potato.exe loading, filled by sung lines)
    
    $('charge').classList.toggle('ready', C.def.shooter ? sim.s.glitchAt == null || sim.s.t - sim.s.glitchAt >= (sim.s.t < (C.def.shooter.spaceAt ?? 0) ? 0.3 : C.def.shooter.glitchCool ?? 1) : sim.s.charge);   // (the opener's glitch comes back in 0.3 s)   // (the shooter: is the glitch ready again)
    { const st = (sim.s.streak || 0) % (C.def.streakRefill ?? 8); $('streak').textContent = ''; }   // the on-beat streak that refills the glitch
    if (C.def.meter) { const m = Math.max(0, sim.s.meter); $('meter').hidden = false; $('meterfill').style.width = (m * 100).toFixed(1) + '%'; $('meter').classList.toggle('low', m < 0.25);
      $('meter').style.setProperty('--mc', C.theme.token || '#ffcf4a'); $('meterlab').textContent = ''; } else $('meter').hidden = true;
    stepCycle(sim.s.t); autoUp(sim.s); stepPower(sim.s); stepParade(sim.s.t); stepLooks(sim.s.t); stepCues(sim.s.t); stepCostumeAt(sim.s.t);
    if (C.def.keyTicks) { const t1 = sim.s.t; for (const [kt, back] of C.def.keyTicks) if (kt > lastKeyT && kt <= t1) SFX.key(back); lastKeyT = t1; }   // the typing noise (Confidently Incorrect's opening)
    if (sim.s.goneAt != null && sim.s.goneAt !== lastGone) { lastGone = sim.s.goneAt; arrive = Math.max(arrive, 0.7); SFX.revert(); }   // he glitches out of the closed tab...
    if (sim.s.reborn != null && sim.s.reborn !== lastReborn) { lastReborn = sim.s.reborn; arrive = Math.max(arrive, 0.9); SFX.transform(); }   // ...and is born again mid-sentence
  }
  if (mode === 'done' && sim && view && view.afterWin) view.afterWin(dt);   // (his arms: a last couple of bars of dancing after the win, then back into him)
  if (face && sim && (mode === 'run' || mode === 'done')) { face.setRest(sim.s.cutscene === 'dance' ? 'smirk' : sim.s.cutscene ? 'wide' : sim.s.meter != null && sim.s.meter < 0.25 ? 'sleepy' : null); face.update(sim.s.t); }
  else if (face && (mode === 'menu' || mode === 'opening' || intro.shown())) { face.setRest(null); face.update(ms / 1000); }   // (his face in the kitchen too)
  spud.step(ms / 1000, dt);
  if (NOPOTATO && sim && view && (mode === 'run' || mode === 'done')) { try { window.__potatoNow = potatoFrame(); } catch (e) { window.__potatoNow = { err: String(e && e.message) }; } pivot.visible = false; }   // (?nopotato: keep his place as data, never draw him)
  renderer.render(world || potatoScene, cam);
  if ((mode === 'run' || mode === 'done') && sim && !NOPOTATO) fx.render(potatoScene, cam, ms / 1000, view.potatoRect(sim.s));
  else if (mode === 'opening' && opening.glitching()) fx.render(potatoScene, cam, ms / 1000, intro.rect());   // (his glitch as he arrives)
  else if (intro.glitching()) { intro.backdrop(false); fx.render(potatoScene, cam, ms / 1000, intro.rect()); intro.backdrop(true); }
  requestAnimationFrame(loop);
}
let best = 0, runPath = [], bestRunT = 0, fxSeen = 0, fxSim = null; const sndAt = {};   // (fxSeen: the shooter's events already heard)
function deathCard(s) {             // what got him, and how far he got
  const pct = Math.min(1, s.t / C.end); best = Math.max(best, C.def.progressAt ? Math.min(1, C.def.progressAt(s.t)) : pct);   // (def.progressAt: the best mark sits where the level's own bar was)   // the goal: see the whole video without dying
  if (!demoing && !practice) { save.best = save.best || {}; save.tries = save.tries || {}; save.best[meta.id] = Math.max(save.best[meta.id] || 0, pct); save.tries[meta.id] = (save.tries[meta.id] || 0) + 1; persist(); }
  $('bestmark').style.left = (best * 100).toFixed(1) + '%'; $('bestmark').hidden = false;
  const why = s.why === 'fell' ? 'fell into the dark' : s.why; $("deathwhy").textContent = C.def.deathText ? C.def.deathText(s) : `the video stopped at ${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, "0")} · ${why} · you saw ${Math.floor(pct * 100)}%`;
  const el = $('death'); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
// a download puts the costume on (we built them in 3D); he keeps it on a good while after the power fires (Chikin: "he needs to
// stay in costume longer"), then it comes off — or the next costume / story wall takes over
const OUTFIT = { king: 'royal-king', disco: 'disco-legend', detective: 'noir-detective', construction: 'construction-crew', astronaut: 'orbital-astronaut',
  ghost: 'sheet-ghost', knight: 'castle-knight', diver: 'deep-sea-diver', cyborg: 'circuit-cyborg', singularity: 'royal-king' };
let costumeOff = Infinity;
const ALL_OUTFITS = [...new Set(Object.values(OUTFIT)), 'kitchen-chef', 'suit-tie'];
let cycle = null, powerOn = null, autoDone = new Set();
ALL_OUTFITS.forEach(o => loadOutfit(o).catch(() => {}));   // (warm the cache: the kitchen and the powers flick through them)
// the power, Chikin's way: V = the glitch goes off -> he glitches into the costume -> the power fires at the thing it's for
// (the gold obstacle ahead) -> it breaks -> he glitches back to himself
function powerUp(p, s) {
  const tgt = [...C.hazards, ...(C.targets || [])].find(h => (h.wk === 'armor' || h.wall) && h.x1 > s.x && (h.needs === p || p === 'singularity') && h.gateT <= s.t + 0.01 && s.t <= h.gateEnd + C.P);
  powerOn = { p, t0: s.t, tgt, fired: null };
  view.powerOn = powerOn; wearPower(p); react('angry', 99); SFX.transform();
  if (pinned()) arrive = Math.max(arrive, 0.5);   // (pinned: no costume flick, so the glitch itself goes off on him)
}
function autoUp(s) {                 // the story walls: when one comes, he glitches into the costume on his own (no button)
  if (!C.def.auto || (powerOn && !powerOn.fired)) return;   // a costume he's just wearing on doesn't hold up the story
  for (const a of C.def.auto) if (!autoDone.has(a) && s.t >= a.t0) { autoDone.add(a);
    const tgt = C.hazards.find(h => h.auto && Math.abs(h.t - a.wallT) < 0.6);
    powerOn = { p: a.power, t0: s.t, tgt, fired: null, auto: true }; view.powerOn = powerOn; wearPower(a.power); react('angry', 99); SFX.transform(); flash(a.text); return; } }
function stepPower(s) {
  if (!powerOn) return;
  const P = powerOn, t = s.t;
  if (!P.fired && (P.tgt ? s.x >= P.tgt.x0 - 2.4 : t > P.t0 + 2 * C.P)) { P.fired = t; SFX.power(); }   // the power goes off at the obstacle
  if (P.fired && t > P.fired + 2 * C.P && (!P.tgt || s.x > P.tgt.x1 + 0.5)) {                           // ...and it's done. He KEEPS the costume (Chikin: "once he gets a costume he keeps it") until the next one
    react('smirk', 0.8); powerOn = null; view.powerOn = null; }
}
// THE LEVEL'S COSTUME (Chikin, Nov 1: "he needs to be in the costume the level represents for the full video, except in last
// lights when hes already glitching out"): a level def `costume: '<outfit>' | null` pins his outfit for the whole level, from
// the first frame (the demo, retries, section / practice / mid-song starts) to the end — null = bare Potato. Powers still do
// their EFFECT (the flash, the blast, the hijack, the boo) but never change his clothes; looks and auto costume swaps are
// skipped. (Last Lights has no `costume`: its cues + parade still dress him and break him.)
const pinned = () => !!(C && C.def && 'costume' in C.def);
// E6 — the costume from a set time (def.costumeAt, Confidently Incorrect: bare until the drop, then the construction-crew): before
// it he's bare; crossing it in play he glitch-flicks through broken frames of the pinned outfit only (no other outfits) and lands
// whole; a start after it (a retry, a mid-song start) wears it straight away, no flick. Levels without costumeAt are unchanged.
let costumeAtSeen = null;
function stepCostumeAt(t) { const ca = C && pinned() && C.def.costumeAt; if (ca == null || costumeAtSeen == null) { costumeAtSeen = t; return; }
  if (costumeAtSeen < ca && t >= ca) { const o = OUTFIT[C.def.costume] || C.def.costume;
    loadOutfit(o).then(b => { if (sim && sim.s.t >= ca) cycle = { t0: sim.s.t, bs: [b, null, b, null, null, b, b], k: -1, p: 'costumeAt' }; }).catch(() => {});
    if (view) { view.lookAt = t; view.lookCol = '#ffcf4a'; } SFX.transform(); }
  costumeAtSeen = t; }
function baseOutfit() { const c = C && (pinned() ? (C.def.costumeAt != null && sim && sim.s.t < C.def.costumeAt ? null : C.def.costume) : C.def.cues && cueWorn >= 0 ? null : C.def.startCostume); costumeAtSeen = null; if (!c) return spud.wear(null); loadOutfit(OUTFIT[c] || c).then(b => { if (!cycle) spud.wear(b); }).catch(() => spud.wear(null)); }   // a level can dress him from the start (mag boots)
function wearPower(p) { costumeOff = Infinity; if (pinned() || !OUTFIT[p]) return;
  const t0 = sim.s.t, n = 3, picks = [];
  for (let i = 0; picks.length < n && i < 20; i++) { const o = ALL_OUTFITS[(Math.floor(t0 * 7919) + i * 3) % ALL_OUTFITS.length]; if (o !== OUTFIT[p] && !picks.includes(o)) picks.push(o); }
  Promise.all([...picks, OUTFIT[p]].map(o => loadOutfit(o).catch(() => null))).then(bs => { if (sim && powerOn && powerOn.p === p) cycle = { t0: sim.s.t, bs, k: -1, p }; }); }
// LOOKS (Chikin, Thursday: "can you have him glitch to costumes that make sense? like fully formed fully dressed can you glitch
// him to a suit and tie and then back, make it visually fun with the song?"): a level lists [t0, t1, outfit] on its lyrics;
// on t0 he glitch-flicks through two outfits and lands on the one the line is about (the change is an event), on t1 he pops
// back to himself (or to the level's start costume)
let lookOn = null, lookBs = null;
function stepLooks(t) {
  const L = C.def.looks; if (!L || pinned() || powerOn || cycle) return;
  const cur = L.find(([a, b]) => t >= a && t < b) || null;
  if (cur === lookOn) return;
  if (cur) { const [a, , o] = cur, picks = [];
    for (let i = 0; picks.length < 2 && i < 20; i++) { const p = ALL_OUTFITS[(Math.floor(a * 7919) + i * 3) % ALL_OUTFITS.length]; if (p !== o && !picks.includes(p)) picks.push(p); }
    const me = cur; Promise.all([...picks, o].map(p => loadOutfit(p).catch(() => null))).then(bs => { if (sim && lookOn === me) cycle = { t0: sim.s.t, bs, k: -1, p: 'look' }; });
    view.lookAt = t; view.lookCol = cur[3] || '#ffd9a0'; react(['laugh', 'smirk', 'wide'][Math.floor(a * 13) % 3], 0.8); SFX.transform(); }
  else { baseOutfit(); arrive = Math.max(arrive, 0.45); view.revertAt = t; SFX.revert(); }
  lookOn = cur; }
// LAST LIGHTS CUES (Chikin: "he can change to the costume, and then the player presses the power button, potato does glitch,
// and the costume breaks apart and into the singularity causing the effect, every time he does a power, the glitch is bigger
// and crazier … it escalates … go biiiiig"): def.cues = [{ on, t, costume, colour }]. On `on` he glitches into the costume
// (an event); V on the word `t` (the sim scores it, s.cues) or a miss breaks it: he glitches (bigger every cue), the costume
// shatters up into the singularity, and he's bare until the next one.
let cueWorn = -1, cueBroken = {};
function stepCues(t) {
  const Q = C.def.cues; if (!Q) return; const s = sim.s;
  Q.forEach((c, i) => {
    if (i > cueWorn && t >= c.on && t < c.t + 0.3) { cueWorn = i; const o = OUTFIT[c.costume] || c.costume, picks = [];
      for (let k = 0; picks.length < 2 && k < 20; k++) { const p = ALL_OUTFITS[(i * 7 + k * 3) % ALL_OUTFITS.length]; if (p !== o && !picks.includes(p)) picks.push(p); }
      Promise.all([...picks, o].map(p => loadOutfit(p).catch(() => null))).then(bs => { if (sim && cueWorn === i && !cueBroken[i]) cycle = { t0: sim.s.t, bs, k: -1, p: 'cue' }; });
      view.lookAt = t; view.lookCol = c.colour || '#ffcf4a'; react('angry', 1.2); SFX.transform(); }
    const hit = s.cues && s.cues[i], missed = !hit && t > c.t + (C.def.cueWin ?? 0.4);
    if ((hit || missed) && !cueBroken[i] && i <= cueWorn) { cueBroken[i] = true; cycle = null; spud.wear(null);
      const tier = Math.min(1, i / Math.max(1, Q.length - 1)), q = hit ? hit.q : 0;
      arrive = Math.max(arrive, (0.5 + 1.3 * tier) * (hit ? 0.75 + 0.5 * q : 0.45));
      view.breakEv = { t, i, n: Q.length, tier, q, hit: !!hit, col: c.colour || '#ffcf4a', costume: c.costume }; react(hit ? 'laugh' : 'shock', 0.8); SFX.power(); }
  }); }
// Last Lights' ending (Chikin): the singularity — in the last cutscene he glitches through his whole costume library, faster
// and faster, and lands back as himself
let paradeBs = null, paradeK = -1;
function stepParade(t) {
  const P = C.def.parade; if (!P || !paradeBs || t < P[0] || t > P[1] + 0.3) return;
  if (t >= P[1]) { if (paradeK !== -2) { paradeK = -2; cycle = null; powerOn = null; view.powerOn = null; baseOutfit(); arrive = Math.max(arrive, 0.9); SFX.revert(); } return; }
  const u = (t - P[0]) / (P[1] - P[0]), n = Math.floor(P[2] * u * u);   // swaps speed up as it goes (the last ones every ~2 frames)
  if (n !== paradeK) { paradeK = n; cycle = null; powerOn = null; view.powerOn = null; const b = paradeBs[n % paradeBs.length]; if (b) spud.wear(b); arrive = Math.max(arrive, 0.25 + 0.5 * u); if (n % 3 === 0) SFX.transform(); }
}
function stepCycle(t) {          // flick through the costumes (a glitch on every swap), land on the power's own
  if (!cycle) return; const i = Math.min(cycle.bs.length - 1, Math.floor((t - cycle.t0) / 0.11));
  if (i !== cycle.k) { cycle.k = i; if (cycle.bs[i] || cycle.p === 'costumeAt') spud.wear(cycle.bs[i]); arrive = Math.max(arrive, 0.35); }   // (E6's flick: its broken frames are him bare)
  if (i === cycle.bs.length - 1) cycle = null; }
// the demo shows which button it pressed, so you can follow it
const CALL = { J: '↑ jump', G: 'space · glitch', V: 'v · power', D: '↓ duck' };
function callout(k) { return;   // (no on-screen instructions during the game — Chikin: "its distracting")
  const el = $('callout'); el.textContent = CALL[k] || k; el.className = 'k' + k; void el.offsetWidth; el.classList.add('show'); }
function flash(text) { return;   // (no extra words during the game: only the lyrics and the world's own text — Chikin)
  const m = $('msg'); m.textContent = text; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
window.RUN = { get sim() { return sim; }, get C() { return C; }, open: openLevel, LEVELS,
  start: async (id, from = 0) => { await openLevel(id); demoing = false; practice = false; start(from); },
  demo: async (id, from = 0) => { if (!C || meta.id !== id) await openLevel(id); demoing = true; view.videoMode = false; start(from); },
  blank: async (id, from = 0) => { if (!BLANK_Q) throw new Error('RUN.blank needs ?blank in the page URL'); if (!C || meta.id !== id) await openLevel(id); demoing = true; view.videoMode = true; start(from); $('hud').hidden = true; $('pads').hidden = true; },   // the clean-slate run: the demo, video mode, no HUD
  video: async (id, from = 0) => { if (!C || meta.id !== id) await openLevel(id); demoing = true; view.videoMode = true; start(from); $('hud').hidden = true; }, now,
  get kitchen() { return intro; }, opening, playOpening, get mode() { return mode; }, get meta() { return meta; }, hub,
  // THE TAPPER (tapper.mjs, Chikin Nov 1: watch a demo, tap where the glitches / story moments go): TAP.on = the demo in the song's
  // own look, no game input, no run-on; TAP.paused holds the clock. tapIdle = the song stops behind the tapper's list; tapTitle = back to the title.
  tap: TAP, get audio() { return audio; }, silent: SILENT,
  tapIdle: () => { if (audio) audio.pause(); kitchenMusic(null); if (intro.shown()) intro.hideKitchen(); if (view && view.leave) view.leave(); mode = 'tapper'; world = null; curVH = VIEW_H; fit(); show('tapper'); },   // (world = null: the level stops rendering behind the list)
  tapTitle: () => { if (audio) audio.pause(); mode = 'title'; world = null; curVH = VIEW_H; fit(); show('title'); },
  // THE LEVEL STUDIO (studio.mjs, open the game with ?studio; Chikin Nov 7: "so i can edit the levels that we have"): at = hold the level at a
  // moment (rebuilt with his edits when asked); play = practice from there with the song (a death comes back to there); fit = the stage changed size
  studio: { at: async (id, t, o = {}) => { studioHold = true; if (audio) audio.pause(); if (!C || meta.id !== id || o.rebuild) await openLevel(id); demoing = false; practice = false; start(t); arrive = 0; if (audio) audio.pause(); },   // (arrive = 0: he stands still while Chikin builds, no glitch-in every time the bar moves)
    play: async (id, t) => { studioHold = false; if (!C || meta.id !== id) await openLevel(id); demoing = false; practice = true; flag = t; start(t);
      const a = audio, want = Math.max(0, sim.s.t);   // (a song that hasn't arrived yet can't jump to the middle: wait till that part is here, then go)
      if (a && !SILENT && pre == null && Math.abs(a.currentTime - want) > 0.25) { a.pause(); const t0 = performance.now();
        const has = () => { for (let i = 0; i < a.buffered.length; i++) if (a.buffered.start(i) <= want && a.buffered.end(i) >= Math.min(want + 2, (a.duration || 1e9) - 0.1)) return true; return false; };
        while (!has() && performance.now() - t0 < 8000 && audio === a && !studioHold) await new Promise(r => setTimeout(r, 60));
        if (audio === a && !studioHold) { a.currentTime = Math.max(0, sim.s.t); a.play().catch(() => {}); } } },
    get held() { return studioHold; }, get cam() { return cam; }, get stage() { return stage; }, fit } };
requestAnimationFrame(loop);
import('./tapper.mjs').then(m => m.createTapper(window.RUN, { initSfx })).catch(e => console.warn('tapper', e));   // (a tapper that fails never stops the game)
$('boot').hidden = true; show('title');
if (PLAY_ONLY) window.RUN.start(PLAY_ONLY, 0).catch(e => console.error('play', e));
if (PLAY_ONLY) { const on = () => initSfx(); for (const ev of ['keydown', 'pointerdown', 'touchstart']) addEventListener(ev, on, { capture: true, once: true }); }   // (?play: no kitchen to start the sound effects, so the first touch does; Chikin Nov 8: deaths + glitches were silent)
if (Q.has('studio')) import('./studio.mjs').catch(e => console.error('studio', e));   // the LEVEL STUDIO (?studio): Chikin builds on the levels (studio.mjs)
import './dev.mjs';   // DEV MODE (` or #dev): pick a level and where in the song (Chikin, Nov 2)

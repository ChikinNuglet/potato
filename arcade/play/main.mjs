// main.mjs — boots the game: renderer, Potato, the glitch pass, input, the song clock, the kitchen hub, saves.
import * as T from './vendor/three.module.js';
import { createSpud } from './spud3d.mjs';
import { loadOutfit } from './outfits3d.mjs';
import { createGlitchFX } from './glitchfx.mjs';
import { buildLevel } from './engine.mjs';
import { LEVELS, loadLevel } from './levels/index.mjs';
import { POWERS, RANDOM_POOL } from './powers.mjs';
import { initSfx, setSfxMuted, SFX } from './sfx.mjs';

const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search), SILENT = Q.has('silent'), ALL = Q.has('all');
const RATE = SILENT ? Math.min(3, +Q.get('rate') || 1) : 1;      // tests only: run the silent clock faster
const stage = $('stage');
const renderer = new T.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = T.LinearSRGBColorSpace; renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
stage.prepend(renderer.domElement);
const VIEW_H = 6.4, CAM_Y = 2.2;
const cam = new T.OrthographicCamera(-1, 1, 1, -1, -30, 30);
let viewW = 12;
function fit() { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); viewW = VIEW_H * w / h;
  cam.left = -viewW / 2; cam.right = viewW / 2; cam.top = VIEW_H / 2; cam.bottom = -VIEW_H / 2; cam.updateProjectionMatrix(); }
fit(); addEventListener('resize', fit);
cam.position.set(0, CAM_Y + 0.35, 10); cam.lookAt(0, CAM_Y, 0);

const potatoScene = new T.Scene();
const spud = await createSpud(stage, { scene: potatoScene });
spud.spud.scale.setScalar(0.92);
const fx = createGlitchFX(renderer); fx.setWordsLayer($('gwords'));

// ---------- save ----------
const SAVE_KEY = 'potato404.save.v1';
let save = { cleared: [] };
try { save = JSON.parse(localStorage.getItem(SAVE_KEY)) || save; } catch (e) {}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

// ---------- input: keyboard (Matt's keys + WASD) and touch buttons ----------
const keys = new Set(), pressedSet = new Set();
const KEY = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', ArrowUp: 'J', KeyW: 'J', ArrowDown: 'D', KeyS: 'D', Space: 'G', KeyV: 'V' };
const input = { has: k => keys.has(k), pressed: k => pressedSet.has(k) };
const press = k => { if (!keys.has(k)) pressedSet.add(k); keys.add(k); };
addEventListener('keydown', e => { const k = KEY[e.code]; if (k && mode === 'level') { e.preventDefault(); press(k); }
  if ((e.code === 'Escape' || e.code === 'KeyP') && mode === 'level') pause(!paused);
  if (e.code === 'KeyM') toggleMute(); });
addEventListener('keyup', e => { const k = KEY[e.code]; if (k) keys.delete(k); });
for (const b of document.querySelectorAll('[data-key]')) {
  const k = b.dataset.key, down = e => { e.preventDefault(); press(k); b.classList.add('on'); }, up = e => { e.preventDefault(); keys.delete(k); b.classList.remove('on'); };
  b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
}
window.__press = k => pressedSet.add(k); window.__hold = (k, on) => on ? keys.add(k) : keys.delete(k);    // test hooks

// ---------- the song clock ----------
let audio = null, fakeT = 0, running = false, paused = false, muted = false, mode = 'title', level = null, levelMeta = null;
let world = new T.Scene();
const now = () => SILENT ? fakeT : (audio ? audio.currentTime : 0);
function toggleMute() { muted = !muted; if (audio) audio.muted = muted; setSfxMuted(muted); $('mute').textContent = muted ? 'sound off' : 'sound on'; }
function pause(on) { if (mode !== 'level' || !running) return; paused = on; if (audio && !SILENT) on ? audio.pause() : audio.play().catch(() => {}); $('paused').hidden = !on; }
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (mode === 'level') pause(true); else if (audio) audio.pause(); } });
addEventListener('pagehide', () => audio && audio.pause());

// ---------- what a level can ask the shell for ----------
let flashTimer = 0;
const ctx = {
  get world() { return world; }, cam, spud, CAM_Y, viewW: () => viewW, now, loadOutfit,
  seek: t => { if (SILENT) fakeT = t; else if (audio) audio.currentTime = t; },
  ended: () => !SILENT && audio && audio.ended,
  flash(text) { const m = $('msg'); m.textContent = text; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); },
  beatPulse(b) { $('beat').classList.toggle('on', b % 2 === 0); },
  beatHit() { const e = $('beat'); e.classList.add('hit'); setTimeout(() => e.classList.remove('hit'), 180); },
  glitch(k) { fx.amount = k; },
  hud(h) { $('section').textContent = h.section; const s = Math.ceil(h.left); $('time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    $('charge').classList.toggle('ready', h.charge); $('progress').style.width = (h.progress * 100).toFixed(1) + '%'; },
  setPowerLabel(pw) { $('power').textContent = pw ? pw.name : 'no power'; $('hint').textContent = pw ? pw.hint : 'space: glitch through walls'; },
  randomPower: () => RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)],
  win(L) { finishLevel(L); },
  setTheme(th) { stage.style.setProperty('--hud', th.hud); stage.style.setProperty('--hudaccent', th.accent); stage.style.background = th.sky; },
};

// ---------- screens ----------
function show(id) { for (const s of ['title', 'hub', 'card', 'result']) $(s).hidden = s !== id; }
function hub() {
  mode = 'hub'; stopSong(); show('hub'); if (voiceClip) voiceClip.pause();
  const list = $('levels'); list.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const open = ALL || i === 0 || save.cleared.includes(LEVELS[i - 1].id), done = save.cleared.includes(L.id);
    const b = document.createElement('button'); b.className = 'lvl' + (done ? ' done' : '') + (open ? '' : ' locked'); b.disabled = !open;
    b.innerHTML = `<span class="lamp" aria-hidden="true"></span><span class="num">${L.n}</span><span class="t">${L.title}</span><span class="p">${open ? L.place : 'locked'}</span>`;
    b.onclick = () => { SFX.click(); card(L); }; list.appendChild(b);
  });
  $('lampcount').textContent = `${save.cleared.length} of 10 lights on`;
}
// story voices: the narrator reads the level's line on its card; Potato says his line when its light comes on
let voiceClip = null;
function speak(file) { if (voiceClip) voiceClip.pause(); if (muted) return; voiceClip = new Audio(file); voiceClip.volume = 0.9; voiceClip.play().catch(() => {}); }
function card(L) { levelMeta = L; show('card'); speak(`voice/n${String(L.n).padStart(2, '0')}.mp3`); $('cardnum').textContent = `level ${L.n}`; $('cardtitle').textContent = L.title; $('cardplace').textContent = L.place;
  $('cardline').textContent = L.line; $('cardpower').textContent = `download: ${L.power}`; $('play').focus(); }
async function startLevel(L) {
  levelMeta = L;
  if (voiceClip) voiceClip.pause();
  initSfx(); show(null); for (const s of ['title', 'hub', 'card', 'result']) $(s).hidden = true;
  $('loading').hidden = false;
  const def = await loadLevel(L.id), map = await fetch(def.map).then(r => r.json());
  world = new T.Scene();
  level = buildLevel(ctx, def, map);
  stopSong(); audio = new Audio(def.song); audio.muted = muted; audio.preload = 'auto';
  await new Promise(ok => { audio.addEventListener('canplaythrough', ok, { once: true }); setTimeout(ok, 4000); });
  $('loading').hidden = true; mode = 'level'; paused = false; fakeT = 0; running = true; ctx.setPowerLabel(null);
  level.start(); spud.wear(null);
  if (!SILENT) audio.play().catch(() => {});
  last = performance.now();
}
function stopSong() { if (audio) { audio.pause(); audio = null; } running = false; }
function finishLevel(L) {
  if (!save.cleared.includes(levelMeta.id)) { save.cleared.push(levelMeta.id); persist(); }
  running = false; setTimeout(() => { stopSong(); mode = 'result'; show('result'); $('restitle').textContent = levelMeta.title;
    $('resline').textContent = levelMeta.after;
    $('resp').textContent = levelMeta.n >= 10
      ? 'everything else went dark. his ten lights stayed on: the last signal, still here. then a new dead link clicked, and a new little file fell into the 404. the kitchen lights were on.'
      : 'a light comes on in the kitchen.';
    $('resstats').textContent = `glitched out ${L.L.deaths}× · beat jumps ${L.L.beatJumps} · glitches ${L.L.glitches}`;
    $('next').hidden = levelMeta.n >= 10; speak(`voice/p${String(levelMeta.n).padStart(2, '0')}.mp3`); }, 1200);
}
$('start').onclick = () => { initSfx(); SFX.click(); hub(); };
$('play').onclick = () => startLevel(levelMeta);
$('back').onclick = () => hub();
$('again').onclick = () => startLevel(levelMeta);
$('tohub').onclick = () => hub();
$('next').onclick = () => card(LEVELS[levelMeta.n]);
$('quit').onclick = () => { paused = false; $('paused').hidden = true; hub(); };
$('resume').onclick = () => pause(false);
$('mute').onclick = toggleMute;

// ---------- loop ----------
let last = performance.now();
const v = new T.Vector3();
function potatoRect() {
  if (!level) return null; const P = level.P; let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const [x, y] of [[P.x - 0.8, P.y - 0.15], [P.x + 0.8, P.y - 0.15], [P.x - 0.8, P.y + 1.5], [P.x + 0.8, P.y + 1.5]]) {
    v.set(x, y, 0).project(cam); const u = v.x * 0.5 + 0.5, w = v.y * 0.5 + 0.5; x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, w); y1 = Math.max(y1, w); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function loop(ms) {
  const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
  if (mode === 'level' && level) {
    if (running && !paused) { const k = Math.max(1, Math.round(RATE)); for (let i = 0; i < k; i++) { if (SILENT) fakeT += dt; level.step(dt, input); } }
    level.draw(dt);
  }
  pressedSet.clear();
  spud.step(ms / 1000, dt);
  renderer.render(world, cam);
  if (mode === 'level') fx.render(potatoScene, cam, ms / 1000, potatoRect());
  requestAnimationFrame(loop);
}
window.GAME = { spud, fx, get level() { return level; }, startLevel: id => startLevel(LEVELS.find(l => l.id === id)), now, LEVELS, save };
requestAnimationFrame(loop);
$('boot').hidden = true; show('title');

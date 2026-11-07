// Potato's room: the game's kitchen (kitchen/, built by tools/make-kitchen.py), his 3D model, his songs and his voice. Space glitches, Esc changes
// costume (room + song go with it), E uses what he's next to, a double tap on an arrow spins him.
import * as T from './lib/vendor/three.module.js';
import { createSpud } from './lib/spud3d.mjs';
import { createGlitchFX } from './lib/glitchfx.mjs';
import { initSfx, setSfxMuted, SFX } from './lib/sfx.mjs';
import { createIntro } from './kitchen/intro.mjs';
import { STYLES, setBadge, setPetunia, setPetting } from './kitchen/kitchens.mjs';
import { createLiveFace } from './kitchen/face.mjs';
import { playOpening } from './opening.mjs';
import { installPortal, PHONE_NOTE } from './portal.mjs';
import { installBooth } from './booth.mjs';

const $ = id => document.getElementById(id), stage = $('stage'), Q = new URLSearchParams(location.search), TEST = Q.has('t');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
// THE FAN CLUB. FAN_CLUB stays false until the list has a home: saveEmail goes nowhere yet, and a box that keeps nothing would be a lie.
const FAN_CLUB = false;
async function saveEmail(address) { /* Claude wires this once Chikin picks where the list lives */ }
const GATE = true;   // the launch potato.exe code box on arrival: off until the studio is for sale (?gate=1 shows it)
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const BLEED = true;   // the rooms bleed: a glitch leaves a strip of the last kitchen in the new one, its song faint through it, healing over 6 s. false = off.
const RADIO = [['thursday-potato', 'Thursday Potato'], ['last-lights-on', 'Last Lights On'], ['get-down', 'Get Down'], ['still-here', 'Still Here'], ['confidently-incorrect', 'Confidently Incorrect'], ['between-messages', 'Between Messages'], ['no-answer', 'No Answer'], ['turn-me-off', 'Turn Me Off'], ['read-the-terms', 'Read The Terms'], ['ghost-in-the-group-chat', 'Ghost in the Group Chat']];   // her radio, in Taticat's room
const BOOTH = STYLES.findIndex(s => s.id === 'booth');
let muted = store.get('potato-room-muted') === '1', audio = null, line = null;
const initS = () => { initSfx(); setSfxMuted(muted); };
// each room brings its song, no words: the game kitchen's ~32 s loops, crossfading on every change. The first touch or key starts it. It dips while he talks.
let kmusic = null, kmusicId = null, mLevel = 0.8; const faint = new Set();
function fadeAudio(a, to, ms, done) { const from = a.volume, t0 = performance.now(), tk = a.__fade = (a.__fade || 0) + 1; const step = () => { if (a.__fade !== tk) return; const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) setTimeout(step, 16); else if (done) done(); }; step(); }
function roomMusic(id) { if (id && id === kmusicId && kmusic) { if (kmusic.paused) kmusic.play().catch(() => {}); return; }
  if (kmusic) { const old = kmusic; if (BLEED && !REDUCED) { faint.add(old); fadeAudio(old, 0.1, 300, () => fadeAudio(old, 0, 5600, () => { old.pause(); faint.delete(old); })); } else fadeAudio(old, 0, 350, () => old.pause()); }
  kmusicId = id; kmusic = null; if (!id) return; const a = kmusic = new Audio('music/' + id + '.inst.mp3'); a.loop = true; a.muted = muted; a.volume = 0;
  a.play().then(() => { if (a === kmusic) fadeAudio(a, mLevel, 500); }).catch(() => {}); }
const duckMusic = on => { mLevel = on ? 0.22 : 0.8; if (kmusic && !kmusic.paused) fadeAudio(kmusic, mLevel, 200); };
const songOf = i => STYLES[i].id === 'taticat' ? store.get('potato-room-radio') || 'thursday-potato' : STYLES[i].level;

async function main() {
  const LITE = matchMedia('(pointer: coarse)').matches;   // phones and tablets: lighter drawing so he stays smooth
  const renderer = new T.WebGLRenderer({ antialias: !LITE, alpha: true, preserveDrawingBuffer: true }), VIEW_H = 5.6; let viewW = 10; renderer.setClearColor(0, 0);
  renderer.outputColorSpace = T.LinearSRGBColorSpace; renderer.setPixelRatio(Math.min(LITE ? 1.25 : 2, devicePixelRatio || 1)); stage.prepend(renderer.domElement); window.__bootBar(18);
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, -30, 30), scene = new T.Scene();
  const fit = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1; renderer.setSize(w, h, false); viewW = VIEW_H * w / h; cam.left = -viewW / 2; cam.right = viewW / 2; cam.top = VIEW_H / 2; cam.bottom = -VIEW_H / 2; cam.updateProjectionMatrix(); };
  fit(); new ResizeObserver(fit).observe(stage);
  const spud = await createSpud(stage, { scene, base: './lib/' }); spud.spud.scale.setScalar(1.18); const pivot = new T.Group(); scene.add(pivot); pivot.add(spud.spud);
  const fx = createGlitchFX(renderer); fx.setWordsLayer($('gwords')); window.__bootBar(45);
  const intro = createIntro({ T, scene, stage, spud, pivot, cam, fx, viewW: () => viewW, sfx: SFX });
  const face = await createLiveFace(spud, './lib/').catch(() => null); intro.onFace = (name, dur) => { if (face && !audio) face.show(name, performance.now() / 1000, dur); };
  await Promise.race([window.__css.then(() => document.fonts.load('20px "Major Mono Display"')).catch(() => {}), new Promise(r => setTimeout(r, 1500))]);
  { const im = new Image(); im.onload = () => setBadge(im); im.src = 'lib/fan-badge.webp'; const p = new Image(); p.onload = () => setPetunia(p); p.src = 'lib/petunia.jpg'; }
  window.__bootBar(60);

  // ---- the little circle tiles, from the game
  const row = $('looks'), addTile = i => { const st = STYLES[i], c = document.createElement('canvas'); c.width = c.height = 96; st.icon(c.getContext('2d'), 96); const b = document.createElement('button'), im = new Image(), name = (RADIO.find(r => r[0] === st.level) || [0, st.name])[1]; b.className = 'kicon'; b.setAttribute('aria-label', name); b.title = name; im.alt = ''; im.src = c.toDataURL('image/png'); b.append(im); b.dataset.i = i; b.onclick = e => { pick(i); if (e.detail) b.blur(); }; row.append(b); };
  const count = () => BOOTH; let room = 0, inBooth = false, boothLook = 0;
  for (let i = 0; i < count(); i++) addTile(i);
  const tiles = () => { [...row.children].forEach(b => { const on = +b.dataset.i === room; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }); };
  function pick(i) { if (intro.busy()) return; initS(); i = (i + count()) % count();
    if (inBooth) { boothLook = i; room = i; tiles(); return intro.dressOnly(STYLES[i].outfit); }
    room = i; intro.setStyle(i); tiles(); roomMusic(songOf(i)); }
  const glitchOnly = () => { initS(); intro.poke(); SFX.glitch && SFX.glitch(); };
  const jukebox = () => { const k = RADIO.findIndex(r => r[0] === songOf(intro.style())), id = RADIO[(k + 1) % RADIO.length][0]; store.set('potato-room-radio', id); roomMusic(id); };
  const portal = installPortal({ glitch: glitchOnly, opened() { store.set('potato-room-door', '1'); }, music: on => { if (!kmusic) return; on ? kmusic.play().catch(() => {}) : kmusic.pause(); } });
  // the right door: locked everywhere, except Taticat's, which is always open, and Potato's own (Regular), which the password opens. Both lead to the demo for now
  Object.defineProperty(intro, 'rightOpen', { get() { const id = STYLES[intro.style()].id; return id === 'taticat' || (id === 'bare' && store.get('potato-room-door') === '1'); } });
  const booth = installBooth({ T, renderer, scene, pivot, intro, fx, wordsHome: $('gwords'), face, faces: spud, STYLES, count, glitch: glitchOnly, walkable: on => { boothBusy = on; intro.noPaint = on; }, sfx: SFX }); let boothBusy = false;
  window.__boothNext = () => pick(room + 1);
  intro.onProp = id => { if (id === 'terminal') portal.open(); if (id === 'juke') jukebox(); if (id === 'photobooth') booth.open(); };
  const go = (i, watch) => { intro.showKitchen(i, { back: true, watch }); };
  intro.onEnter = how => { if (how === 'demo') { portal.video(() => go(intro.style(), true)); return; }
    if (!inBooth) { inBooth = true; STYLES[BOOTH].outfit = STYLES[boothLook = room].outfit; go(BOOTH); } else { inBooth = false; STYLES[BOOTH].outfit = null; go(room); roomMusic(songOf(room)); } tiles(); };
  intro.setSongs(STYLES.map(st => { const k = RADIO.findIndex(r => r[0] === st.level); return { n: k >= 0 ? k + 1 : '', title: k >= 0 ? RADIO[k][1] : '', cleared: false }; }));

  // ---- keys: the game's, plus Esc for costumes, Space for a glitch, a double tap on an arrow for a spin
  const KEY = { ArrowUp: 'J', KeyW: 'J', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' }, lastTap = { k: null, t: 0 };
  const spin = d => { initS(); intro.spinBy(d); };
  const press = (k, down) => { if (down && (k === 'L' || k === 'R')) { const now = performance.now(); if (lastTap.k === k && now - lastTap.t < 300) { spin(k === 'L' ? -1 : 1); lastTap.k = null; } else { lastTap.k = k; lastTap.t = now; } } initS(); intro.key(k, down); };
  addEventListener('keydown', e => { if (e.metaKey || e.ctrlKey || e.altKey || document.getElementById('p404') || document.getElementById('bth')) return; if (e.key === 'Escape') { e.preventDefault(); if (!e.repeat) pick(room + 1); return; } if (e.code === 'KeyT') { if (!e.repeat) speak(nextLine()); return; }
    if (e.code === 'Space') { if (e.target.closest && e.target.closest('button,select')) return; e.preventDefault(); if (!e.repeat) { glitchOnly(); if (intro.props().near >= 0) intro.use(); } return; } if (e.code === 'KeyE') { e.preventDefault(); if (!e.repeat) { initS(); intro.use(); } return; }
    const k = KEY[e.code]; if (!k) return; e.preventDefault(); if (!e.repeat || k === 'D') press(k, true); });
  addEventListener('keyup', e => { const k = KEY[e.code]; if (k) intro.key(k, false); });
  document.querySelectorAll('#pads [data-k]').forEach(b => { const k = b.dataset.k; if (k === 'G') { b.onclick = () => { glitchOnly(); if (intro.props().near >= 0) intro.use(); }; return; } b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} press(k, true); }); for (const ev of ['pointerup', 'pointercancel']) b.addEventListener(ev, () => intro.key(k, false)); });
  $('esc').onclick = () => pick(room + 1);
  const at = e => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  stage.addEventListener('click', e => { if (e.target.closest('button,select,label')) return; initS(); intro.walkTo(...at(e), { min: (e.pointerType === 'touch' ? 44 : 20) * 1600 / Math.max(1, stage.clientWidth) }); });
  { const first = () => { removeEventListener('pointerdown', first); removeEventListener('keydown', first); roomMusic(songOf(room)); }; addEventListener('pointerdown', first); addEventListener('keydown', first); }

  // ---- sound on or off
  const setMute = m => { muted = m; store.set('potato-room-muted', m ? '1' : '0'); setSfxMuted(m); if (audio) audio.muted = m; if (kmusic) kmusic.muted = m; faint.forEach(a => { a.muted = m; }); const b = $('mute'), s = m ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', m); b.setAttribute('aria-label', s); b.title = s; };
  $('mute').onclick = () => setMute(!muted); setMute(muted);

  // ---- his voice: the mp3 is the clock; his mouth flips between his real drawn faces on the line's timings
  const L = new T.TextureLoader(), load = f => new Promise(r => L.load(f, t => { t.colorSpace = T.NoColorSpace; t.anisotropy = 4; r(t); }, undefined, () => r(null)));
  const [fCanon, fOh, fGrin] = await Promise.all(['face-canon.png', 'faces/face-oh.png', 'faces/face-grin.png'].map(f => load('./lib/' + f)));
  let shown = null; const setF = t => { if (t && t !== shown) { shown = t; spud.setFace(t); } };
  function talk() { if (!audio || !line || !line.mouth) return; const now = audio.currentTime; let m = 'R'; for (const [t, c] of line.mouth) { if (t > now) break; m = c; } setF(m === 'A' || m === 'O' || m === 'U' ? fOh : m === 'E' || m === 'C' || m === 'L' ? fGrin : fCanon); }
  let V = [], bag = [];
  try { const r = await fetch('voice/lines.json', { signal: AbortSignal.timeout(6000) }); V = r.ok ? await r.json() : []; if (!Array.isArray(V)) V = []; } catch (e) { V = []; }
  const nextLine = () => { if (!bag.length) { bag = V.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return bag.pop(); };
  const stopTalk = () => { if (audio) { audio.onended = audio.onerror = null; audio.pause(); } audio = null; line = null; duckMusic(false); $('talk').classList.remove('on'); setF(fCanon); };
  function speak(l, tries = 0) { initS(); stopTalk(); duckMusic(true); line = l; const a = audio = new Audio('voice/' + l.id + '.mp3'); a.muted = muted; $('talk').classList.add('on');
    const skip = () => { if (audio !== a) return; stopTalk(); if (tries < Math.min(5, V.length - 1)) speak(nextLine(), tries + 1); };
    a.onended = () => { if (audio === a) stopTalk(); }; a.onerror = skip; a.play().catch(e => { if (e && e.name === 'NotSupportedError') skip(); }); }
  if (V.length) $('talk').onclick = () => speak(nextLine()); else $('talkw').hidden = true;

  if (FAN_CLUB) { const b = document.createElement('button'), d = document.createElement('dialog'); b.id = 'fanbtn'; b.type = 'button'; b.textContent = 'fan club'; d.id = 'fan';
    d.innerHTML = '<form method="dialog"><b>potato fan club</b><p>Potato updates, in your inbox. Leave any time.</p><label for="fanmail">Your email</label><input id="fanmail" type="email" required autocomplete="email"><div><button type="submit" value="join">Join</button><button type="button" value="no">Not now</button></div></form>';
    stage.append(b); document.body.append(d); b.onclick = () => d.showModal(); d.querySelector('[value=no]').onclick = () => d.close();
    d.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); const f = e.target, m = f.querySelector('input'); await saveEmail(m.value); f.innerHTML = '<b>you\'re in.</b><p>fair.</p>'; setTimeout(() => d.close(), 1400); }); }

  // ---- his thoughts: his glitch language, small and faint, drifting up when he's standing around
  { const W = (window.POTATO_GLITCH_WORDS || []).filter(w => w.length > 3 && w.length < 14), n = () => setTimeout(() => { if (W.length && !document.hidden && !audio && !intro.busy()) { const r = intro.rect(), e = document.createElement('span'); e.className = 'thought'; e.textContent = W[Math.floor(Math.random() * W.length)]; e.style.left = (r.x + r.w * (.2 + Math.random() * .6)) * 100 + '%'; e.style.top = (1 - r.y - r.h) * 100 + '%'; stage.append(e); setTimeout(() => e.remove(), 3400); } n(); }, 3500 + Math.random() * 5000); n(); }
  // ---- every frame
  intro.showKitchen(0); tiles(); let last = performance.now();
  // the cat: walk up and stop, and he ducks down to it, happy; its tail wags and there are hearts round them both. Walk off and it ends
  let pet = false, petX = 0, petT = 0; function stepPet(ms) { const q = intro.props(), here = STYLES[intro.style()].id === 'taticat' && q.x > 820 && q.x < 960 && q.y <= 0 && !intro.busy(); if (Math.abs(q.x - petX) > 2) { petX = q.x; petT = ms; } const on = here && ms - petT > 250; if (on === pet) return; pet = on; setPetting(on); spud.duck(on); if (face) face.setRest(on ? 'joy' : null); spud.turnTo(on ? 0.8 : 0.32); }
  function frame(ms) { const dt = Math.min(0.05, (ms - last) / 1000); last = ms; stepPet(ms); if (face && !audio && !boothBusy) { if (!pet) face.setRest(null); face.update(ms / 1000); } talk(); spud.step(ms / 1000, dt); if (!boothBusy) { renderer.render(scene, cam); if (intro.glitching()) { intro.backdrop(false); fx.render(scene, cam, ms / 1000, intro.rect()); intro.backdrop(true); } } requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  if (TEST) window.__room = { T, spud, cam, renderer, intro, pick, speak, booth, portal, get room() { return room; }, get inBooth() { return inBooth; }, get V() { return V; }, faint: () => faint.size, music: () => kmusic && { id: kmusicId, paused: kmusic.paused, muted: kmusic.muted, volume: kmusic.volume, t: kmusic.currentTime } };
  if (Q.has('rec')) {   // ?rec: saves every press for the commercial; tools/commercial-run.py replays them. Stop saves potato-run.json.
    const t0 = performance.now(), log = [], push = (k, v) => log.push([+((performance.now() - t0) / 1000).toFixed(3), k, v]), b = document.createElement('button');
    addEventListener('keydown', e => { if (!e.repeat) push('d', e.code); }, true); addEventListener('keyup', e => push('u', e.code), true);
    addEventListener('pointerdown', e => { const q = e.target.closest && e.target.closest('[data-k]'); if (q) push('pd', q.dataset.k); }, true); addEventListener('pointerup', e => { const q = e.target.closest && e.target.closest('[data-k]'); if (q) push('pu', q.dataset.k); }, true);
    addEventListener('click', e => { const q = e.target.closest && e.target.closest('#looks .kicon,#esc,#coupon button,#talk,#mute,#p404 button'); if (!q) return; push('c', q.matches('.kicon') ? '#looks .kicon:nth-child(' + ([...q.parentNode.children].indexOf(q) + 1) + ')' : q.id ? '#' + q.id : '#coupon button'); }, true);
    b.textContent = '● REC 0:00 · press to stop'; const tick = setInterval(() => { const q = Math.floor((performance.now() - t0) / 1000); b.textContent = `${q % 2 ? '○' : '●'} REC ${Math.floor(q / 60)}:${String(q % 60).padStart(2, '0')} · press to stop`; }, 500); b.style.cssText = 'position:fixed;left:50%;top:36px;transform:translateX(-50%);z-index:31;padding:6px 12px;background:#d42f27;color:#fff;border:3px solid #120a05;border-radius:9px;font:700 14px Inter,system-ui,sans-serif;cursor:pointer';
    b.onclick = e => { e.stopPropagation(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ w: stage.clientWidth, h: stage.clientHeight, seconds: (performance.now() - t0) / 1000, log })], { type: 'application/json' })); a.download = 'potato-run.json'; a.click(); clearInterval(tick); b.textContent = 'Saved to Downloads. Reload for another take'; b.style.background = '#2f9e55'; }; document.body.append(b); window.__recLog = log; }
  window.__bootBar(100); clearInterval(window.__bootTimer);
  // phones and tablets, once per device: the honest note, right after the opening
  const phoneNote = () => { if (!LITE || store.get('potato-room-phone-note') === '1') return; store.set('potato-room-phone-note', '1'); const n = document.createElement('div'); n.id = 'phonenote'; n.style.cssText = 'position:fixed;left:50%;top:34px;translate:-50% 0;z-index:40;width:min(440px,calc(100vw - 24px));box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0b0710;color:#b4ffd2;border:3px solid #4dff9a;border-radius:8px;font:400 14px/1.35 Inter,system-ui,sans-serif'; n.innerHTML = `<span style="flex:1">${PHONE_NOTE}</span><button type="button" style="padding:6px 12px;background:#4dff9a;color:#0b0710;border:0;border-radius:6px;font:700 14px Inter,system-ui,sans-serif">OK</button>`; n.querySelector('button').onclick = () => n.remove(); document.body.append(n); };
  const firstVisit = Q.has('coupon') || (!TEST && store.get('potato-room-seen') !== '1');
  if ((GATE || Q.has('gate')) && store.get('potato-backroom-unlocked') !== '1') { await portal.gate(); store.set('potato-backroom-unlocked', '1'); }
  if (firstVisit) { const op = playOpening({ glitch: () => { initS(); SFX.glitch && SFX.glitch(); }, reduced: REDUCED, logos: !TEST || Q.has('logos') }); $('boot').remove(); op.then(() => { store.set('potato-room-seen', '1'); stage.focus({ preventScroll: true }); phoneNote(); }); } else { $('boot').remove(); stage.focus({ preventScroll: true }); phoneNote(); }
  window.__ready = true;
}
main().catch(e => { console.error(e); window.__bootFail(); });

// Potato's room: the game's kitchen (kitchen/, built by tools/make-kitchen.py), his 3D model, his songs and his voice. Space glitches, Esc changes
// costume (room + song go with it), E uses what he's next to, a double tap on an arrow spins him.
import * as T from './lib/vendor/three.module.js';
import { createSpud } from './lib/spud3d.mjs';
import { createGlitchFX } from './lib/glitchfx.mjs';
import { initSfx, setSfxMuted, SFX } from './lib/sfx.mjs';
import { createIntro } from './kitchen/intro.mjs';
import { STYLES, setBadge, setPetunia, setPetting, HOUSE as HOUSE_KIT } from './kitchen/kitchens.mjs';
import { createLiveFace } from './kitchen/face.mjs';
import { playOpening } from './opening.mjs';
import { installPortal, PHONE_NOTE } from './portal.mjs';
import { installArcade } from './arcade.mjs';   // ARCADE (Nov 8): the living room's game console -> level select
import { installBooth } from './booth.mjs';
import { playFilm } from './film.mjs';   // FILM: The Coupon on the first visit (D-49)
import { installCave } from './cave.mjs';   // CAVE (Nov 7): the potato cave under the kitchen floor

const $ = id => document.getElementById(id), stage = $('stage'), Q = new URLSearchParams(location.search), TEST = Q.has('t');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
// THE FAN CLUB. FAN_CLUB stays false until the list has a home: saveEmail goes nowhere yet, and a box that keeps nothing would be a lie.
const FAN_CLUB = false;
async function saveEmail(address) { /* Claude wires this once Chikin picks where the list lives */ }
const GATE = true;   // the launch potato.exe code box on arrival: off until the studio is for sale (?gate=1 shows it)
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const BLEED = true;   // the rooms bleed: a glitch leaves a strip of the last kitchen in the new one, its song faint through it, healing over 6 s. false = off.
const RADIO = [['thursday-potato', 'Thursday Potato'], ['last-lights-on', 'Last Lights On'], ['get-down', 'Get Down'], ['still-here', 'Still Here'], ['confidently-incorrect', 'Confidently Incorrect'], ['between-messages', 'Between Messages'], ['no-answer', 'No Answer'], ['turn-me-off', 'Turn Me Off'], ['read-the-terms', 'Read The Terms'], ['ghost-in-the-group-chat', 'Ghost in the Group Chat']];   // the album
const BOOTH = STYLES.findIndex(s => s.id === 'booth'), LIVING = STYLES.findIndex(s => s.id === 'living');   // (the living room: kitchen/living.mjs, Nov 8)
let muted = store.get('potato-room-muted') === '1', audio = null, line = null;
const initS = () => { initSfx(); setSfxMuted(muted); };
// each room brings its song, no words: the game kitchen's ~32 s loops, crossfading on every change. The first touch or key starts it. It dips while he talks.
let kmusic = null, kmusicId = null, mLevel = 0.8; const faint = new Set();
let jukePlaying = false;   // (a jukebox song overrides the room's music: nothing else plays under it, Chikin Nov 8)
function fadeAudio(a, to, ms, done) { const from = a.volume, t0 = performance.now(), tk = a.__fade = (a.__fade || 0) + 1; const step = () => { if (a.__fade !== tk) return; const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) setTimeout(step, 16); else if (done) done(); }; step(); }
function roomMusic(id) { if (id && id === kmusicId && kmusic) { if (kmusic.paused && !jukePlaying) kmusic.play().catch(() => {}); return; }
  if (kmusic) { const old = kmusic; if (BLEED && !REDUCED) { faint.add(old); fadeAudio(old, 0.1, 300, () => fadeAudio(old, 0, 5600, () => { old.pause(); faint.delete(old); })); } else fadeAudio(old, 0, 350, () => old.pause()); }
  kmusicId = id; kmusic = null; if (!id) return; const a = kmusic = new Audio('music/' + id + '.inst.mp3'); a.loop = true; a.muted = muted; a.volume = 0;
  if (!jukePlaying) a.play().then(() => { if (a === kmusic) fadeAudio(a, mLevel, 500); }).catch(() => {}); }
const duckMusic = on => { mLevel = on ? 0.22 : 0.8; if (kmusic && !kmusic.paused) fadeAudio(kmusic, mLevel, 200); };
const songOf = i => STYLES[i].level;

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
  { const p = new Image(); p.onload = () => setPetunia(p); p.src = 'lib/petunia.jpg'; }
  window.__bootBar(60);

  // ---- the little circle tiles, from the game
  const row = $('looks'), addTile = i => { const st = STYLES[i], c = document.createElement('canvas'); c.width = c.height = 96; st.icon(c.getContext('2d'), 96); const b = document.createElement('button'), im = new Image(), name = (RADIO.find(r => r[0] === st.level) || [0, st.name])[1]; b.className = 'kicon'; b.setAttribute('aria-label', name); b.title = name; im.alt = ''; im.src = c.toDataURL('image/png'); b.append(im); b.dataset.i = i; b.onclick = e => { pick(i); if (e.detail) b.blur(); }; row.append(b); };
  const count = () => BOOTH; let room = 0, inBooth = false, boothLook = 0, inLiving = false;
  // ================= THE HOUSE (Chikin, Nov 12 night) =================
  // ?room=<name> = opened from the house page (house/index.html). His layout, inside and outside the same:
  //   ground floor:  living room -> Thursday Potato (the kitchen) -> Read The Terms
  //   upstairs (the door at the top of the living room stairs):  Get Down -> Confidently Incorrect -> Cyborg (its right door is locked)
  //   the attic (a ladder in Confidently's room):  Ghost
  // "there is not glitching between rooms in this house": a costume changes his clothes only. "only the rooms shown on the exterior should be shown":
  // a door that would lead anywhere else leads back out to the house. No basement door for now. No sign over the doors (his: the Thursday Potato one).
  const HOUSE = Q.get('room'), OUT = STYLES.map(st => st.outfit), ix = id => STYLES.findIndex(st => st.id === id); let look = 0;
  const HK = ix('bare'), HT = ix('suit-tie'), HG = ix('disco-legend'), HC = ix('construction-crew'), HY = ix('circuit-cyborg'), HA = ix('sheet-ghost');
  const HNAME = { kitchen: HK, terms: HT, getdown: HG, factory: HC, cyborg: HY, ghost: HA };
  const FRAMED = window.parent !== window;   // (opened from the outside view of the house, which is set aside for now: Chikin, Nov 13)
  const toHouse = () => { if (FRAMED) { window.parent.postMessage({ potato: 'exit' }, '*'); return true; } return false; };
  if (HOUSE) { HOUSE_KIT.on = true; for (const st of STYLES) st.noSign = true;
    const plus = (i, drop, add) => { STYLES[i].props = STYLES[i].props.filter(q => !drop.includes(q.id)).map(q => add[q.id] ? Object.assign({}, q, add[q.id]) : q).concat(add._new || []); };
    plus(HK, ['cave'], { _new: [{ id: 'camera', kind: 'switch', call: true, busy: 0.6, x0: 690, x1: 800, y0: 480, y1: 560, hint: [745, 470], sfx: { on: 'flick', off: 'flick' } }] });   // the camera on the kitchen table = the meme studio
    plus(HG, [], { speaker: { kind: 'switch', call: true, busy: 1 } });                                     // the speakers, turned on = Get Down (the easter egg)
    plus(HC, [], { belt: { call: true }, _new: [{ id: 'ladder', kind: 'switch', call: true, busy: 1, x0: 236, x1: 330, y0: 150, y1: 700, hint: [283, 140], sfx: { on: 'creak', off: 'creak' } }] });   // the lever = the level; the ladder = up to the attic
    plus(LIVING, [], { tv: { call: true } });                                                               // the TV = his channel
    const draw = (i, fn) => { const u0 = STYLES[i].under; STYLES[i].under = (x, t, lit, P, me) => { u0 && u0(x, t, lit, P, me); fn(x, t); }; };
    const INK = '#120a05';
    draw(HK, x => { x.save(); x.lineJoin = 'round'; x.lineWidth = 5; x.strokeStyle = INK;   // a little camera on the table: body, lens, a red light
      x.fillStyle = '#2b2f36'; x.beginPath(); x.roundRect(700, 508, 88, 52, 8); x.fill(); x.stroke(); x.fillStyle = '#3c424c'; x.beginPath(); x.roundRect(722, 496, 34, 16, 4); x.fill(); x.stroke();
      x.fillStyle = '#0b0d10'; x.beginPath(); x.arc(744, 534, 19, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#4c6a8a'; x.beginPath(); x.arc(744, 534, 10, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(739, 529, 4, 0, 7); x.fill();
      x.fillStyle = '#e8463a'; x.beginPath(); x.arc(776, 518, 5, 0, 7); x.fill(); x.restore(); });
    draw(HC, x => { x.save(); x.lineCap = 'round'; x.strokeStyle = INK;   // the ladder to the attic: a dark hatch in the ceiling, two rails, rungs
      x.fillStyle = '#0b0d10'; x.fillRect(222, 96, 122, 62); x.lineWidth = 6; x.strokeRect(222, 96, 122, 62);
      for (const X of [246, 320]) { x.lineWidth = 16; x.strokeStyle = INK; x.beginPath(); x.moveTo(X, 110); x.lineTo(X, 700); x.stroke(); x.lineWidth = 8; x.strokeStyle = '#b9853f'; x.beginPath(); x.moveTo(X, 110); x.lineTo(X, 700); x.stroke(); }
      for (let Y = 150; Y < 690; Y += 54) { x.lineWidth = 14; x.strokeStyle = INK; x.beginPath(); x.moveTo(246, Y); x.lineTo(320, Y); x.stroke(); x.lineWidth = 7; x.strokeStyle = '#d9a758'; x.beginPath(); x.moveTo(246, Y); x.lineTo(320, Y); x.stroke(); }
      x.restore(); }); }
  let houseGo = () => {};
  if (HOUSE) { globalThis.__potatoHouse = true; intro.glitchThrough = true;
    /* THE DOOR AT THE TOP OF THE STAIRS OPENS FOR HIM (Chikin, Nov 12 night: "the house is set the way it should be, you just need to make that door at the top of the stairs open").
       It used to need a key press nobody is told about. Now: walk him up, stand him in front of it for a breath, and it opens and he goes through. */
    { let held = 0; setInterval(() => { try { if (!inLiving || !intro.shown() || intro.busy() || document.getElementById('arc')) { held = 0; return; }
        const P = intro.props(), i = P.list.findIndex(q => q.id === 'upstairs'), p = P.list[i]; if (!p || P.state[i].on) { held = 0; return; }
        const there = P.on === 'stairs' && P.x > p.x0 - 30 && P.x < p.x1 + 30; held = there ? held + 1 : 0;
        if (held === 3 && P.near === i) intro.use(); } catch (e) {} }, 150); }   // he glitches by himself in his house: small, every so often, never while a game / the laptop / the booth is up
    setInterval(() => { if (!intro.shown() || intro.busy() || document.getElementById('arc') || document.getElementById('p404') || document.getElementById('bth') || document.hidden) return; if (Math.random() < 0.12) intro.pokeSoft(0.26 + Math.random() * 0.2); }, 1000); }
  // THE LINE (Chikin, Nov 8: "move binary so it connects to the front door, so its the first button, then let the doors open all the way
  // down the line"): the simulation is the first button; the living room's front door opens into it; every kitchen's left door = the one
  // before it on the row, right door = the one after (the last one's right door = the photo booth). ORDER = the row, left to right.
  const BIN = STYLES.findIndex(s => s.id === 'binary');
  const ORDER = Array.from({ length: count() }, (_, i) => i).filter(i => i !== BIN);   // (no button for the simulation: only the living room's front door goes there)   // (Chikin, Nov 8 later: "move binary to before halloween again": the row is back in its own order; the front door still opens into the simulation)
  const step = (i, d) => ORDER[(ORDER.indexOf(i) + d + ORDER.length) % ORDER.length];
  ORDER.forEach(i => addTile(i));
  const tiles = () => { [...row.children].forEach(b => { const on = +b.dataset.i === (HOUSE ? look : room); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }); };
  function pick(i) { if (intro.busy()) return; initS(); i = ((i % count()) + count()) % count();
    if (HOUSE) { look = i; STYLES[room].outfit = OUT[i]; if (inLiving) STYLES[LIVING].outfit = OUT[i]; if (inBooth) STYLES[BOOTH].outfit = OUT[i]; tiles(); window.__houseLook && window.__houseLook(i); return intro.dressOnly(OUT[i]); }
    if (inBooth) { boothLook = i; room = i; tiles(); return intro.dressOnly(STYLES[i].outfit); }
    if (inLiving) { STYLES[LIVING].outfit = STYLES[i].outfit; return intro.dressOnly(STYLES[i].outfit); }   // (in the living room a glitch changes his clothes, not the room)
    room = i; intro.setStyle(i); tiles(); roomMusic(songOf(i)); }
  const glitchOnly = () => { initS(); intro.poke(); SFX.glitch && SFX.glitch(); };
  // THE JUKEBOX (Chikin, Nov 8: "cycle through the full album in order by room, halloween included"): each press = the next song, in the
  // order the rooms sit on the row (Thursday first ... Last Lights On, then Boo Not Found), from whatever is playing now; then round again
  const ALBUM = [...new Set(ORDER.map(songOf).filter(id => id && (RADIO.some(r => r[0] === id) || id === 'boo-not-found')))];
  // a coin (glitch the jukebox) = ONE full song, the next on the album; glitch it again = off. When the song ends the jukebox goes quiet.
  let jukeA = null, jukeLast = -1;
  const roomBack = () => { jukePlaying = false; if (kmusic && kmusic.paused) { kmusic.volume = 0; kmusic.play().then(() => fadeAudio(kmusic, mLevel, 600)).catch(() => {}); } };
  const jukeStop = () => { if (!jukeA) return; const a = jukeA; jukeA = null; fadeAudio(a, 0, 400, () => a.pause()); roomBack(); };
  const jukebox = on => { if (!on) { jukeStop(); return; }
    jukeStop(); jukeLast = (jukeLast + 1) % ALBUM.length; const id = ALBUM[jukeLast]; store.set('potato-room-radio', id);
    jukePlaying = true; if (kmusic) kmusic.pause(); for (const f of faint) f.pause(); faint.clear();
    const a = jukeA = window.__juke = new Audio('music/' + id + '.mp3'); a.muted = muted; a.volume = 0.9;
    setTimeout(() => { if (jukeA === a) a.play().catch(() => {}); }, 700);   // (after the coin drops)
    a.onended = () => { if (jukeA !== a) return; jukeA = null; intro.propOff && intro.propOff('juke'); roomBack(); }; };
  const portal = installPortal({ house: HOUSE ? { password: 'thursday', demo: () => arcade.demo('thursday-potato', 'thursday potato') } : null, glitch: glitchOnly, opened() { store.set('potato-room-door', '1'); }, music: on => { if (!kmusic) return; on ? (jukePlaying ? 0 : kmusic.play().catch(() => {})) : kmusic.pause(); } });
  // the right door: locked everywhere except Potato's own (Regular), which the password opens. It leads to the demo for now
  Object.defineProperty(intro, 'leftShut', { get() { return STYLES[intro.style()].id === 'binary'; } });   // (no left door outside: only the lit doorway home)   // (Nov 8: the front door opens now: into the simulation)   // the living room's front door: it opens a crack onto the street, for now (intro.mjs peekOut)
  Object.defineProperty(intro, 'rightOpen', { get() { return !(HOUSE && !inLiving && !inBooth && (room === HY || (room === HT && !FRAMED))); } });   // (the house: Cyborg's right door is locked, Chikin Nov 12)   // (Nov 8: every door opens, down the line)
  const booth = installBooth({ T, renderer, scene, pivot, intro, fx, wordsHome: $('gwords'), face, faces: spud, STYLES, count, glitch: glitchOnly, walkable: on => { boothBusy = on; intro.noPaint = on; }, sfx: SFX }); let boothBusy = false;
  window.__boothNext = () => pick(step(room, 1));
  // CAVE (Nov 7): the trapdoor in the kitchen floor (kitchens.mjs prop 'cave') drops him into the cave (cave.mjs). The kitchen loop pauses while he's down there.
  const cave = installCave({ T, renderer, scene, pivot, intro, fx, wordsHome: $('gwords'), face, spud, sfx: SFX, glitch: glitchOnly, walkable: on => { boothBusy = on; intro.noPaint = on; },
    music: on => { if (!kmusic) return; on ? (jukePlaying ? 0 : kmusic.play().catch(() => {})) : kmusic.pause(); }, muted: () => muted });
  const intoCave = () => { if (cave.isOpen()) return; const x0 = pivot.position.x, x1 = ((200 + 328 * 0.76) / 1600 - 0.5) * viewW, t0 = performance.now();   // (a beat: the hatch flips open, the light comes up, he steps over the hole, crouches, drops)
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 220); pivot.position.x = x0 + (x1 - x0) * k; if (k < 1) requestAnimationFrame(step); else spud.duck(true); }; step();
    setTimeout(() => { spud.duck(false); cave.open(); }, 600); };
  const arcade = installArcade({ intro, glitch: glitchOnly, music: on => { if (!kmusic) return; on ? (jukePlaying ? 0 : kmusic.play().catch(() => {})) : kmusic.pause(); } });
  // THE TERMS (Chikin, Nov 8): in Read the Terms' room, walk up to the paper on the table and a question bar asks if you want to read the
  // terms. Yes = Read the Terms' level select (Play / Machine Learning). The house is a playground: you find it by walking up to it.
  // MACHINE LEARNING, its own thing (Chikin, Nov 8): in the cyborg room, stand still under the ring light: it lowers onto his head and
  // the binary Potato learning Read the Terms plays. Walk away (or close it) and it goes back up.
  { const CYB = STYLES.findIndex(st => st.id === 'circuit-cyborg'); let under = 0, fired = false, lastX = -1;   // Nov 13 (the visitor's walk): the list opens only when he STANDS under the light, and never once he has left the room
    setInterval(() => { const st = STYLES[CYB]; if (!st) return; const live = !inLiving && !inBooth && room === CYB && intro.shown() && !document.getElementById('arc');
      const P = live ? intro.props() : null, still = !!P && Math.abs(P.x - lastX) < 3; lastX = P ? P.x : -1; const ok = live && P.on == null && P.x > 700 && P.x < 840 && P.y < 0.05 && (still || fired);
      if (!ok) { under = 0; if (!document.getElementById('arc')) { fired = false; st.mlRing = 0; } return; }
      if (!under) under = performance.now(); if (fired || performance.now() - under < 700) return;
      fired = true; st.mlRing = performance.now(); st.mlX = P.x; SFX.hum && SFX.hum();
      setTimeout(() => { const Q2 = !inLiving && !inBooth && room === CYB && intro.shown() ? intro.props() : null; if (!Q2 || Q2.x < 680 || Q2.x > 860) { fired = false; st.mlRing = 0; return; } arcade.learn(HOUSE ? [['thursday-potato', 'thursday potato'], ['get-down', 'get down'], ['confidently-incorrect', 'confidently incorrect'], ['read-the-terms', 'read the terms'], ['between-messages', 'between messages'], ['ghost-in-the-group-chat', 'ghost in the group chat'], ['still-here', 'still here'], ['no-answer', 'no answer'], ['turn-me-off', 'turn me off'], ['last-lights-on', 'last lights on']].map(([id, title]) => ({ title, live: id, locked: !['thursday-potato', 'get-down', 'confidently-incorrect', 'read-the-terms', 'ghost-in-the-group-chat'].includes(id) }))   /* (Chikin, Nov 12 night: "lock any song that is not in the house as a level with a little error") */
        : [{ title: 'read the terms', src: 'demo/read-the-terms-ml.mp4' }, { title: 'ghost in the group chat', src: 'demo/ghost-in-the-group-chat.mp4' }]); }, 1700); }, 120); }
  const TERMS_ROOM = STYLES.findIndex(st => st.id === 'suit-tie'), GHOST_ROOM = STYLES.findIndex(st => st.id === 'sheet-ghost');
  // the question bar (one for the house): "read the terms?" at the paper; "join the chat?" when he answers Ghost's old phone (Nov 8)
  { const bar = document.createElement('div'); bar.id = 'termsbar'; bar.setAttribute('role', 'dialog');
    bar.innerHTML = '<span></span><button type="button" data-y>yes</button><button type="button" data-n>no</button>';
    bar.style.cssText = 'position:fixed;left:50%;bottom:110px;transform:translate(-50%,20px);z-index:7;display:flex;align-items:center;gap:12px;padding:10px 14px 10px 18px;background:#f7f2e4;color:#120a05;border:4px solid #120a05;border-radius:10px;box-shadow:4px 4px 0 #120a05;font:700 18px/1 "Major Mono Display",monospace;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s';
    const st2 = document.createElement('style'); st2.textContent = '#termsbar button{padding:7px 14px;border:3px solid #120a05;border-radius:8px;font:700 15px Inter,system-ui,sans-serif;cursor:pointer}#termsbar [data-y]{background:#4dff9a}#termsbar [data-n]{background:#fff}#termsbar.on{opacity:1!important;pointer-events:auto!important;transform:translate(-50%,0)!important}';
    document.head.append(st2); document.body.append(bar);
    let shown = null, dismissed = null, answered = false;
    const ASKS = { tv: { text: 'my channel?', yes: () => { window.open('https://www.youtube.com/@potato404file', '_blank', 'noopener'); intro.propOff('tv'); window.__tvOn = false; } }, belt: { text: "i'm sure it's fine. start it?", yes: () => { window.__beltOn = false; arcade.play('confidently-incorrect', 'confidently incorrect'); } }, getdown: { text: 'get down?', yes: () => { window.__spkOn = false; intro.propOff('speaker'); arcade.play('get-down', 'get down'); } }, terms: { text: 'read the terms?', yes: () => arcade.select() }, phone: { text: 'join the chat?', yes: () => arcade.play('ghost-in-the-group-chat', 'ghost in the group chat') } };
    const show = key => { if (key === shown) return; shown = key; if (key) bar.querySelector('span').textContent = ASKS[key].text; bar.setAttribute('aria-label', key ? ASKS[key].text : ''); bar.classList.toggle('on', !!key); };
    bar.querySelector('[data-y]').onclick = () => { const k = shown; show(null); dismissed = k; if (k === 'phone') { answered = false; intro.propOff('phone'); } ASKS[k] && ASKS[k].yes(); };
    bar.querySelector('[data-n]').onclick = () => { const k = shown; show(null); dismissed = k; if (k === 'getdown') { window.__spkOn = false; intro.propOff('speaker'); } if (k === 'belt') { window.__beltOn = false; intro.propOff('belt'); } if (k === 'phone') { answered = false; intro.propOff('phone'); } };
    window.__answerPhone = () => { answered = true; dismissed = null; };
    setInterval(() => { const live = !inLiving && !inBooth && intro.shown() && !document.getElementById('arc'), P = live ? intro.props() : null, nearId = live && P.near >= 0 && P.list[P.near] ? P.list[P.near].id : null;
      let want = null;
      const TV_LINK = false;   /* OFF for now (Chikin, Nov 12 night: "disable the youtube link in the living room for now"). true brings the 'my channel?' ask back. The TV still turns on and off. */
      if (TV_LINK && HOUSE && inLiving && window.__tvOn && intro.shown() && !document.getElementById('arc')) { const PL = intro.props(), tvp = PL.list.find(q => q.id === 'tv'); if (tvp && PL.x > tvp.x0 - 170 && PL.x < tvp.x1 + 170) want = 'tv'; }   /* (by the TV while it is on; the console in front of it is usually the nearer thing) */
      if (HOUSE && room === HG && !inLiving && !inBooth && window.__spkOn && intro.shown() && !document.getElementById('arc')) want = 'getdown';   /* the speakers are on: get down? */
      if (HOUSE && room === HC && !inLiving && !inBooth && window.__beltOn && intro.shown() && !document.getElementById('arc')) want = 'belt';
      if (live && room === TERMS_ROOM && nearId === 'terms') want = 'terms';   // walk up to the paper
      if (live && room === GHOST_ROOM && answered) want = nearId === 'phone' ? 'phone' : null;   // answer the phone (glitch it), stay by it
      if (live && room === GHOST_ROOM && answered && nearId !== 'phone') { answered = false; intro.propOff('phone'); }   // walked away: he hangs up
      if (want !== dismissed && dismissed !== null && !want) dismissed = null;
      if (!want) { if (shown) show(null); if (dismissed && dismissed !== want) dismissed = null; return; }
      if (dismissed !== want) show(want); }, 150); }
  intro.onProp = (id, on) => { if (id === 'terms') { intro.propOff('terms'); return; } if (id === 'phone') { if (on) window.__answerPhone && window.__answerPhone(); return; } if (id === 'console') return; if (HOUSE && id === 'upstairs') { if (on) setTimeout(() => { intro.propOff('upstairs'); houseGo(HG, false); }, 1350); return; }   // the stairs door: up to Get Down
    if (HOUSE && id === 'ladder') { if (on) setTimeout(() => { intro.propOff('ladder'); houseGo(HA, false); }, 700); return; }      // the ladder: up to the attic (Ghost)
    if (HOUSE && id === 'camera') { if (on) { booth.open(); setTimeout(() => intro.propOff('camera'), 400); } return; }             // the camera: the meme studio
    if (HOUSE && id === 'speaker') { window.__spkOn = !!on; return; }   /* the speakers come on, then he ASKS (Chikin, Nov 12 night: "get down doesnt ask if you want to get down") */
    if (HOUSE && id === 'belt') { window.__beltOn = !!on; return; }   /* the lever goes over, then he asks (Chikin, Nov 12 night: "confidently incorrect doesnt ask"). The words are a stand-in. */
    if (HOUSE && id === 'tv') { window.__tvOn = !!on; return; }
    if (id === 'upstairs') { if (on) setTimeout(() => { booth.open(); intro.propOff('upstairs'); }, 900); return; }   // (the door at the top of the living-room stairs: the meme studio, Nov 8)
    if (id === 'cave') return intoCave(); if (id === 'terminal') portal.open(); if (id === 'juke') jukebox(on); if (id === 'photobooth') booth.open(); };
  const go = (i, watch) => { intro.showKitchen(i, { back: true, watch }); };
  intro.onEnter = how => {   // how: 'play' = the left door, 'demo' = the right door
    // (Chikin, Nov 8: "you come in through the right door no matter what door you leave through": now you come in by the door that faces
    // the one you left: out the left door = in by the next room's right door; out the right = in by its left. watch = arrive at the right door)
    const left = how !== 'demo';
    const enter = i => { room = i; go(i, left); tiles(); roomMusic(songOf(i)); };
    const living = atRight => { inLiving = true; STYLES[LIVING].outfit = STYLES[room].outfit; intro.showKitchen(LIVING, { back: true, watch: atRight }); tiles(); };
    if (HOUSE) { const to = i => { STYLES[i].outfit = OUT[look]; enter(i); }, liv = atRight => { room = HK; STYLES[HK].outfit = OUT[look]; living(atRight); roomMusic(null); };
      if (inBooth) { inBooth = false; STYLES[BOOTH].outfit = null; return to(HK); }
      if (inLiving) { if (left) { if (toHouse()) return; location.href = '../'; return; } inLiving = false; STYLES[LIVING].outfit = null; return to(HK); }   // its front door = out: to the outside view, or (no outside view) back to the main door
      if (room === HK) return left ? liv(true) : to(HT);
      if (room === HT) { if (left) return to(HK); if (toHouse()) return; return to(HT); }
      if (room === HG) return left ? liv(true) : to(HC);                                                                // left = back down the stairs
      if (room === HC) return to(left ? HG : HY);
      if (room === HY) return to(HC);                                                                                   // (its right door never opens)
      if (room === HA) return to(HC);                                                                                   // the attic: either way is back down the ladder
      return to(HK); }
    if (inLiving) { inLiving = false; STYLES[LIVING].outfit = null; if (!left) enter(room); else enter(BIN >= 0 ? BIN : ORDER[0]); return; }   // right = back into the kitchen row; the front door = outside (the simulation)
    if (inBooth) { inBooth = false; STYLES[BOOTH].outfit = null; enter(room); return; }
    if (room === BIN) { room = ORDER[0]; living(false); return; }   // outside: the doorway back in = the living room's front door
    const pos = ORDER.indexOf(room);
    if (left) { if (pos <= 0 && LIVING >= 0) { living(true); return; } enter(ORDER[pos - 1]); return; }
    if (pos >= ORDER.length - 1) { inBooth = true; STYLES[BOOTH].outfit = STYLES[boothLook = room].outfit; go(BOOTH, false); tiles(); return; }   // the end of the line: the photo booth
    enter(ORDER[pos + 1]); };
  houseGo = (i, atRight) => { inLiving = false; inBooth = false; STYLES[LIVING].outfit = null; room = i; STYLES[i].outfit = OUT[look]; intro.showKitchen(i, { back: true, watch: atRight }); tiles(); roomMusic(songOf(i)); };
  intro.setSongs(STYLES.map(st => { const k = RADIO.findIndex(r => r[0] === st.level); return { n: '',   /* (Chikin, Nov 8: no numbers on the door signs, just the song) */  title: k >= 0 ? RADIO[k][1] : '', cleared: false }; }));

  // ---- keys: the game's, plus Esc for costumes, Space for a glitch, a double tap on an arrow for a spin
  const KEY = { ArrowUp: 'J', KeyW: 'J', ArrowDown: 'D', KeyS: 'D', ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R' }, lastTap = { k: null, t: 0 };
  const spin = d => { initS(); intro.spinBy(d); };
  const press = (k, down) => { if (down && (k === 'L' || k === 'R')) { const now = performance.now(); if (lastTap.k === k && now - lastTap.t < 300) { spin(k === 'L' ? -1 : 1); lastTap.k = null; } else { lastTap.k = k; lastTap.t = now; } } initS(); intro.key(k, down); };
  addEventListener('keydown', e => { if (e.metaKey || e.ctrlKey || e.altKey || document.getElementById('p404') || document.getElementById('bth') || document.getElementById('cave') || document.getElementById('arc')) return;   /* (a game / demo open: its own Esc) */ if (e.key === 'Escape') { e.preventDefault(); if (!e.repeat) pick(step(room, 1)); return; } if (e.code === 'KeyT') { if (!e.repeat) speak(nextLine()); return; }
    if (e.code === 'Space') { if (e.target.closest && e.target.closest('button,select')) return; e.preventDefault(); if (!e.repeat) { glitchOnly(); if (intro.props().near >= 0) intro.use(); } return; } if (e.code === 'KeyE') { e.preventDefault(); if (!e.repeat) { initS(); intro.use(); } return; }
    const k = KEY[e.code]; if (!k) return; e.preventDefault(); if (!e.repeat || k === 'D') press(k, true); });
  addEventListener('keyup', e => { const k = KEY[e.code]; if (k) intro.key(k, false); });
  document.querySelectorAll('#pads [data-k]').forEach(b => { const k = b.dataset.k; if (k === 'G') { b.onclick = () => { glitchOnly(); if (intro.props().near >= 0) intro.use(); }; return; } b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} press(k, true); }); for (const ev of ['pointerup', 'pointercancel']) b.addEventListener(ev, () => intro.key(k, false)); });
  $('esc').onclick = () => pick(step(room, 1));
  const at = e => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
  stage.addEventListener('click', e => { if (e.target.closest('button,select,label')) return; initS(); intro.walkTo(...at(e), { min: (e.pointerType === 'touch' ? 44 : 20) * 1600 / Math.max(1, stage.clientWidth) }); });
  { const first = () => { removeEventListener('pointerdown', first); removeEventListener('keydown', first); roomMusic(HOUSE && inLiving ? null : songOf(room)); };   /* (house: the living room is quiet; it used to start the kitchen's song) */ addEventListener('pointerdown', first); addEventListener('keydown', first); }

  // ---- sound on or off
  const setMute = m => { muted = m; store.set('potato-room-muted', m ? '1' : '0'); setSfxMuted(m); if (audio) audio.muted = m; if (kmusic) kmusic.muted = m; if (window.__juke) window.__juke.muted = m; faint.forEach(a => { a.muted = m; }); const b = $('mute'), s = m ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', m); b.setAttribute('aria-label', s); b.title = s; };
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
  // NO VOICE IN THE KITCHEN FOR NOW (Chikin, Nov 11: "for now the voice can have a little no mark over it, under constuction. no voice in the kitchen").
  // His talk button stays where it is with a no mark over it; nothing here makes him speak. To bring the voice back: VOICE_OFF = false.
  const VOICE_OFF = true;
  function speak(l, tries = 0) { if (VOICE_OFF) return; initS(); stopTalk(); duckMusic(true); line = l; const a = audio = new Audio('voice/' + l.id + '.mp3'); a.muted = muted; $('talk').classList.add('on');
    const skip = () => { if (audio !== a) return; stopTalk(); if (tries < Math.min(5, V.length - 1)) speak(nextLine(), tries + 1); };
    a.onended = () => { if (audio === a) stopTalk(); }; a.onerror = skip; a.play().catch(e => { if (e && e.name === 'NotSupportedError') skip(); }); }
  if (VOICE_OFF) { const b = $('talk'); b.classList.add('off'); b.setAttribute('aria-label', 'His voice: under construction'); b.title = 'His voice: under construction'; b.setAttribute('aria-disabled', 'true'); b.onclick = () => {}; }
  else if (V.length) $('talk').onclick = () => speak(nextLine()); else $('talkw').hidden = true;

  if (FAN_CLUB) { const b = document.createElement('button'), d = document.createElement('dialog'); b.id = 'fanbtn'; b.type = 'button'; b.textContent = 'fan club'; d.id = 'fan';
    d.innerHTML = '<form method="dialog"><b>potato fan club</b><p>Potato updates, in your inbox. Leave any time.</p><label for="fanmail">Your email</label><input id="fanmail" type="email" required autocomplete="email"><div><button type="submit" value="join">Join</button><button type="button" value="no">Not now</button></div></form>';
    stage.append(b); document.body.append(d); b.onclick = () => d.showModal(); d.querySelector('[value=no]').onclick = () => d.close();
    d.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); const f = e.target, m = f.querySelector('input'); await saveEmail(m.value); f.innerHTML = '<b>you\'re in.</b><p>fair.</p>'; setTimeout(() => d.close(), 1400); }); }

  // ---- his thoughts: his glitch language, small and faint, drifting up when he's standing around
  { const W = (window.POTATO_GLITCH_WORDS || []).filter(w => w.length > 3 && w.length < 14), n = () => setTimeout(() => { if (W.length && !document.hidden && !audio && !intro.busy()) { const r = intro.rect(), e = document.createElement('span'); e.className = 'thought'; e.textContent = W[Math.floor(Math.random() * W.length)]; e.style.left = (r.x + r.w * (.2 + Math.random() * .6)) * 100 + '%'; e.style.top = (1 - r.y - r.h) * 100 + '%'; stage.append(e); setTimeout(() => e.remove(), 3400); } n(); }, 3500 + Math.random() * 5000); n(); }
  // ---- every frame
  if (HOUSE === 'living' && LIVING >= 0) { inLiving = true; STYLES[LIVING].outfit = STYLES[room].outfit; intro.showKitchen(LIVING); }
  else if (HOUSE && HNAME[HOUSE] > 0) { room = HNAME[HOUSE]; STYLES[room].outfit = OUT[look]; intro.showKitchen(room); roomMusic(songOf(room)); }
  else intro.showKitchen(0);
  if (HOUSE) {   // the costume bubble, bottom left: his look now; a tap opens the looks, a pick closes them
    { const w = document.querySelector('#wip b'); if (w) w.textContent = 'still cooking'; }   // (every label in his house is his: Chikin, Nov 12 night. Stand-in words until he says yes.)
    document.documentElement.classList.add('house'); const b = document.createElement('button'), im = new Image(); b.id = 'cosb'; b.type = 'button'; b.setAttribute('aria-label', 'Costume'); b.setAttribute('aria-expanded', 'false'); im.alt = ''; b.append(im); document.body.append(b);
    const shut = () => { document.documentElement.classList.remove('looks-open'); b.setAttribute('aria-expanded', 'false'); };
    window.__houseLook = i => { const t = row.querySelector('[data-i="' + i + '"] img'); if (t) im.src = t.src; shut(); }; window.__houseLook(look);
    b.onclick = () => { const on = document.documentElement.classList.toggle('looks-open'); b.setAttribute('aria-expanded', String(on)); };
    addEventListener('pointerdown', e => { if (!e.target.closest('#cosb,#looks')) shut(); }, true); }
  if (HOUSE) {   // ================= THE HELLO (Chikin, Nov 12 night) =================
    // "we need potato to give a little tutorial at the beginning, when they get into the house, like he says hi and shows them around the kitchen,
    //  then if they have a potato, they use their potato, or if they are in on their own, they control potato" / "i need to test a different potato in the kitchen".
    // He walks the kitchen and says it in bubbles (no voice: the voice hold). Once per browser; ?tour shows it again. Words are stand-ins until Chikin says yes.
    // A picked Potato (the coupon page saves him in this browser as 'potato-spud'; ?spud=<id> loads one from the pool for testing, on this Mac only)
    // gets his tag over his head ("Spud - N") and says his own hello. He is the same body for now: only the tag and the words are his.
    const cssT = document.createElement('style'); cssT.textContent = `#hbub{position:fixed;z-index:60;transform:translate(-50%,-100%);max-width:min(84vw,460px);background:none;border:0;color:#efe2ff;font:400 clamp(16px,4vw,23px)/1.3 "Major Mono Display",ui-monospace,Menlo,monospace;text-align:center;text-transform:lowercase;cursor:pointer;-webkit-user-select:none;user-select:none;text-shadow:3px 0 #e03ccf,-3px 0 #7b3cf2,0 2px 0 #12062e,0 -2px 0 #12062e,2px 2px 0 #12062e,-2px -2px 0 #12062e,0 0 6px #12062e,0 0 14px #12062e,0 0 22px #12062e;animation:hbj 2.4s steps(1) infinite}
@keyframes hbj{0%,88%,100%{transform:translate(-50%,-100%)}90%{transform:translate(calc(-50% + 3px),-100%) skewX(-8deg)}94%{transform:translate(calc(-50% - 3px),-100%)}}
#hbub[hidden]{display:none}
#htag{position:fixed;z-index:6;transform:translate(-50%,-100%);background:none;border:0;padding:0;color:#c9a7ff;font:400 13px/1 "Major Mono Display",ui-monospace,Menlo,monospace;white-space:nowrap;pointer-events:none;text-shadow:2px 0 #e03ccf,-2px 0 #7b3cf2,0 0 4px #12062e,0 0 10px #12062e}#htag[hidden]{display:none}
@media (orientation:portrait) and (max-width:700px){#room{align-items:flex-start!important}#stage{width:calc(54dvh*1.7778)!important;max-width:none!important;will-change:transform}#hbub{top:calc(34px + env(safe-area-inset-top,0px));max-width:92vw;font-size:15px;padding:9px 12px}#deck{padding:14px 10px!important;gap:12px!important}#pads{gap:10px!important}#pads .key,#pads #kG{width:62px!important;height:62px!important}#phonenote{top:auto!important;bottom:calc(100px + env(safe-area-inset-bottom,0px))}}
@media (orientation:landscape) and (max-height:520px){#cosb{bottom:auto!important;top:calc(38px + env(safe-area-inset-top,0px));width:54px!important;height:54px!important}#hbub{top:104px;font-size:14px;padding:8px 12px;max-width:60vw}#phonenote{width:min(440px,56vw)!important}}`; document.head.append(cssT);
    const bub = document.createElement('div'); bub.id = 'hbub'; bub.hidden = true; bub.setAttribute('role', 'status'); document.body.append(bub);
    const tag = document.createElement('div'); tag.id = 'htag'; tag.hidden = true; document.body.append(tag);
    const overlay = () => document.getElementById('arc') || document.getElementById('p404') || document.getElementById('bth');
    (function follow() { requestAnimationFrame(follow); const r = intro.rect(), b = stage.getBoundingClientRect();
      /* the costume button lives in the bottom left corner of THE ROOM, not the screen (Chikin, Nov 12 night). A phone on its side keeps its thumb keys there, so it sits in the room's top left instead. */
      { const cb = document.getElementById('cosb'); if (cb) { const side = matchMedia('(orientation:landscape) and (max-height:520px)').matches, w = cb.offsetWidth || 68;
          cb.style.setProperty('left', (Math.max(b.left, 0) + 10) + 'px', 'important'); cb.style.setProperty('bottom', 'auto', 'important');
          cb.style.setProperty('top', (side ? Math.max(b.top, 30) + 8 : Math.min(b.bottom, innerHeight) - w - 10) + 'px', 'important'); } }
      if (!bub.hidden) { const cxp = b.left + (r.x + r.w / 2) * b.width, half = bub.offsetWidth / 2 + 8; bub.style.left = Math.max(half, Math.min(innerWidth - half, cxp)) + 'px'; bub.style.top = Math.max(bub.offsetHeight + 36, b.top + (1 - (r.y + r.h)) * b.height - (tag.hidden ? 12 : 36)) + 'px'; } if (tag.hidden) return; tag.style.visibility = intro.shown() && !overlay() ? 'visible' : 'hidden'; tag.style.left = (b.left + (r.x + r.w / 2) * b.width) + 'px'; tag.style.top = (b.top + (1 - (r.y + r.h)) * b.height - 4) + 'px'; })();
    /* A PHONE HELD UPRIGHT (Nov 12 night): the room is drawn tall, wider than the screen, and slides so he stays in view. Nothing else changes. */
    { const tall = matchMedia('(orientation:portrait) and (max-width:700px)'); let tx = null;
      (function cam() { requestAnimationFrame(cam); if (!tall.matches) { if (tx !== null) { stage.style.transform = ''; tx = null; } return; }
        const W = stage.offsetWidth, vw = innerWidth; if (W <= vw + 1) { stage.style.transform = ''; tx = null; return; }
        const r = intro.rect(), want = Math.max(vw - W, Math.min(0, vw / 2 - (r.x + r.w / 2) * W)); tx = tx === null ? want : tx + (want - tx) * 0.12;
        stage.style.transform = 'translateX(' + tx.toFixed(1) + 'px)'; })(); }
    const wait = ms => new Promise(r => setTimeout(r, ms)); let skip = null;
    const say = (text, ms) => new Promise(res => { bub.dataset.t = text; bub.textContent = ''; bub.hidden = false; let done = false; const end = () => { if (done) return; done = true; clearTimeout(t); skip = null; res(); }; const t = setTimeout(end, ms || Math.max(2600, 900 + text.length * 62)); skip = end; });
    bub.onclick = () => skip && skip();
    /* HE DOES NOT USE A SPEECH BOX (Chikin, Nov 12 night: "it shouldnt be a box, he doesnt use a speech box in potato form" / "not potato glitch text").
       His words hang over his head in his own purple glitch lettering, follow him, and a couple of letters slip into his glitch alphabet and back. */
    { const W = () => window.POTATO_GLITCH_WORDS || ['krrzzt', 'wh@t?!', 's0r\u2014t@', 'f1n\u2014e', 'n0p%', '0k@\u2014y'];
      /* HIS GLITCH LANGUAGE IS THE MATERIAL (canon and core, Chikin Nov 12 night: "its not cycling through his glitch language"). A line arrives as his glitch words and settles
         into the words you can read, left to right; while it hangs there, whole words keep slipping back into his language and out again. Never letter swaps. */
      const pick = n => { const all = W(), fit = all.filter(w => w.length <= Math.max(5, n + 3) && w.length >= Math.max(2, n - 3)); const from = fit.length > 6 ? fit : all; return from[Math.floor(Math.random() * from.length)]; };
      let was = '', settle = 0, held = [];
      setInterval(() => { if (bub.hidden) { was = ''; return; } const t = bub.dataset.t || '', words = t.split(' ');
        if (t !== was) { was = t; settle = 0; held = words.map(w => pick(w.length)); }
        if (settle < words.length) { settle += Math.max(1, Math.ceil(words.length / 6)); bub.textContent = words.map((w, i) => i < settle ? w : held[i]).join(' '); return; }
        if (Math.random() < 0.62) { bub.textContent = t; return; }
        const a = words.slice(), n = 1 + (Math.random() < 0.35 ? 1 : 0); for (let k = 0; k < n; k++) { const i = Math.floor(Math.random() * a.length); a[i] = pick(words[i].length); } bub.textContent = a.join(' '); }, 140); }
    const go = async x => { intro.walkTo((200 + 0.76 * x) / 1600, 0.86); for (let i = 0; i < 50; i++) { await wait(120); if (Math.abs(intro.props().x - x) < 46) break; } await wait(250); };
    const mine = async () => { let m = null; try { m = JSON.parse(localStorage.getItem('potato-spud') || 'null'); } catch (e) {}
      if (Q.get('spud')) { try { const j = await (await fetch('../redeem/pool.json')).json(), want = Q.get('spud'), i = j.potatoes.findIndex(q => q.id === want); if (i >= 0) m = { spud: i + 1, potato: j.potatoes[i] }; } catch (e) {} }
      return m && m.potato ? m : null; };
    // THEY LOAD INTO THE LIVING ROOM (Chikin, Nov 13: "can we put the exterior to the side, lets have them load into the living room").
    // First visit: he says hi where they land; the kitchen tour runs the first time they walk into the kitchen. ?tour shows both again.
    (async () => { const me = await mine(), first = Q.has('tour') || store.get('potato-house-tour') !== '1'; let helloDone = false, tourDone = !first, busyTalk = false;
      if (me) { tag.textContent = me.potato.pet_word || ('spud - ' + me.spud); tag.title = 'spud - ' + me.spud; tag.hidden = !(parseInt(String(me.spud).replace(/\D/g, ''), 10) > 0); window.__houseSpud = me; }
      /* HE IS HIS OWN POTATO (Chikin, Nov 12 night: "why did i get a regular potato?" / "thats the whole point of pick a potato, otherwise you just have potato" / "its why we did the long context that way").
         What his card says, he is: his own resting face, and his own colour in his glitch, his name and his words. Still the same Potato underneath (same body, same lettering).
         Not yet: his kind of glitch, how he moves, his habit. */
      if (me && me.potato) { const pp = me.potato, COL = { 'porch amber': '#F2A33A', 'sodium orange': '#FF8A1F', 'link blue': '#2B6CFF', 'highlighter': '#D8E600', 'moss': '#5E9E4A', 'mint': '#7FE0C0', 'teal': '#1FA3A3', 'rain grey': '#8FA3B0', 'pencil': '#6E6E6E', 'standby green': '#3BD67A', 'marquee gold': '#FFC83D' }, hex = COL[pp.colour];
        if (hex) { try { fx.setTint(hex); } catch (e) {} tag.style.color = hex; bub.style.textShadow = '3px 0 ' + hex + ',-3px 0 #7b3cf2,0 2px 0 #12062e,0 -2px 0 #12062e,2px 2px 0 #12062e,-2px -2px 0 #12062e,0 0 6px #12062e,0 0 14px #12062e,0 0 22px #12062e'; }
        if (pp.face && pp.face !== 'skeptical' && face) { const im = new Image(); im.onload = () => { face.addFace(pp.face, im); face.setRest(pp.face); }; im.src = './lib/faces/face-' + pp.face + '.png'; }
        window.__mine = { face: pp.face, colour: pp.colour, hex }; }   /* a name shows only on a picked Potato who is not Potato himself: never on Potato, never on Spud 00, Chikin's own (Nov 12 night: "only non potato poatos, so reallly only me and potato") */   // (Chikin, Nov 13: "make it their potatos name, in potato glitch language": every picked Potato has his own glitch word, and that is his name)
      const hello = async () => { busyTalk = true; await wait(1500);
        if (first) { await say("hi. this is my house. wipe your feet."); if (inLiving) await say("kitchen's through that door. tv's mine."); }
        if (me && me.potato.says && me.potato.says.hello) { if (first) await say("you brought your own. fair."); await say(me.potato.says.hello); }
        if (first) await say(LITE ? (me ? "he\'s yours to drive. the keys are down there." : "you drive. the keys are down there. don\'t break anything i like.") : (me ? "he\'s yours to drive. arrows. space glitches." : "you drive. arrows. space glitches. don\'t break anything i like."));
        bub.hidden = true; helloDone = true; busyTalk = false; };
      /* Nov 13 (the visitor's walk): the tour belongs to the kitchen. Leave the kitchen, or open a level or the laptop, and it stops: it used to keep talking in the next room and over a running level. */
      const here = () => !inLiving && !inBooth && room === HK && !overlay() && !document.getElementById('arc');
      const tour = async () => { busyTalk = true; tourDone = true; store.set('potato-house-tour', '1'); await wait(900);
        const stop = async (x, line) => { if (!here()) throw 0; await go(x); if (!here()) throw 0; await say(line); };
        try { await stop(1380, "the word's on the fridge. i'm not hiding it.");
          await stop(1250, "that's the laptop. it wants the word.");
          await stop(860, "camera's on the table. for memes. be nice.");
          await stop(520, "doors go places. upstairs is past the living room."); } catch (e) {}
        bub.hidden = true; busyTalk = false; };
      if (first || me) hello(); else helloDone = true;
      setInterval(() => { if (busyTalk || !helloDone || tourDone || overlay() || !intro.shown() || intro.busy()) return; if (!inLiving && !inBooth && room === HK) tour().catch(() => { bub.hidden = true; busyTalk = false; }); }, 700);
    })().catch(e => { console.warn('hello', e); bub.hidden = true; }); }
  tiles(); let last = performance.now();
  // the cat: walk up and stop, and he ducks down to it, happy; its tail wags and there are hearts round them both. Walk off and it ends
  let pet = false, petX = 0, petT = 0; function stepPet(ms) { const q = intro.props(), here = false && q.x > 820 && q.x < 960 && q.y <= 0 && !intro.busy(); if (Math.abs(q.x - petX) > 2) { petX = q.x; petT = ms; } const on = here && ms - petT > 250; if (on === pet) return; pet = on; setPetting(on); spud.duck(on); if (face) face.setRest(on ? 'joy' : (window.__mine && window.__mine.face !== 'skeptical' && window.__mine.face) || null); spud.turnTo(on ? 0.8 : 0.32); }
  function frame(ms) { const dt = Math.min(0.05, (ms - last) / 1000); last = ms; stepPet(ms); if (face && !audio && !boothBusy) { if (!pet) face.setRest((window.__mine && window.__mine.face !== 'skeptical' && window.__mine.face) || null); face.update(ms / 1000); } talk(); spud.step(ms / 1000, dt); if (!boothBusy) { renderer.render(scene, cam); if (intro.glitching()) { intro.backdrop(false); fx.render(scene, cam, ms / 1000, intro.rect()); intro.backdrop(true); } } requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  if (TEST) window.__room = { T, spud, cam, renderer, intro, pick, speak, booth, portal, cave, arcade, get room() { return room; }, get inBooth() { return inBooth; }, get inLiving() { return inLiving; }, get V() { return V; }, faint: () => faint.size, music: () => kmusic && { id: kmusicId, paused: kmusic.paused, muted: kmusic.muted, volume: kmusic.volume, t: kmusic.currentTime } };
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
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);   // (local previews on Chikin's Mac: codes can't be checked here, so no code box)
  // A one-time key already checked at the front door (the curtain's pass in index.html, minutes old) IS the code: don't ask for it twice.
  // (Chikin, Nov 11: "its not letting me in": the door spent his key, then this box asked for it again and called it used.)
  const cameThroughDoor = !!(window.__in || (window.__k && Date.now() - window.__k < 180000));   // __in = already in for this tab (a reload)
  if ((GATE || Q.has('gate')) && !LOCAL && !cameThroughDoor && store.get('potato-room-unlocked') !== '1') { await portal.gate(); store.set('potato-room-unlocked', '1'); }
  if (firstVisit) { const op = playOpening({ glitch: () => { initS(); SFX.glitch && SFX.glitch(); }, reduced: REDUCED, logos: !TEST || Q.has('logos') }); $('boot').remove(); op.then(() => {   /* (Chikin, Nov 8: no movie when the kitchen starts) */ store.set('potato-room-seen', '1'); stage.focus({ preventScroll: true }); phoneNote(); }); } else { $('boot').remove(); Promise.resolve().then(() => { stage.focus({ preventScroll: true }); phoneNote(); }); }   // FILM
  window.__ready = true;
}
main().catch(e => { console.error(e); window.__bootFail(); });

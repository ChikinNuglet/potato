// host-pet.mjs — the desktop host: ONE see-through window the size of the desktop, every Potato in it, the same engine and
// the same data files as the bench. The window lets clicks through to whatever is under it, except where a Potato (or the
// crack, or the hole) is: there the click is his.
//
// It runs in two places with no change:
//   Electron   tools/desktop-potato-living/ loads pet.html; window.petHost (preload) is the door to the main process
//              (click-through on / off, the right-click menu, save, quit).
//   a browser  /game/living-model/pet.html in Playwright's Chromium, no petHost: same page, for stills and tests.
//
// URL flags: seed=7 px=100 (how big he is: screen pixels per body height) n=1..5 muted=1 measure=SECONDS manual=1 lod=auto|full
// window.pet: living, add(), remove(id), zap(id), feed(id), squish(id), explode(id), mute(bool), count(), perf(), step(n), shot()
// The floor is the bottom of the window (the main process sizes the window to the work area, so that is the top of the Dock).
// Game-feel and physics engineer (seat 3), assembly round, team Not A Screensaver.
import { createLiving } from './living.mjs';
import { createMoves } from './moves.mjs';
import { createBrain } from './brain.mjs';
import { createFace } from './face.mjs';
import { createFx } from './fx.mjs';
import { createSound } from './sound.mjs';

const POTATO3D = new URL('../../../potato3d/', import.meta.url).href;      // read-only; only ever imported
const LM = new URL('../', import.meta.url).href;                           // game/living-model/
const CAST = ['pp-0106', 'pp-0103', 'pp-0104', 'pp-0110'];                 // the comedian's crowd cast (design/gags.json crowd_cast), in the order they arrive

export async function startPet(opts = {}) {
  const q = new URLSearchParams(location.search), num = (k, d) => (q.get(k) == null || isNaN(+q.get(k)) ? d : +q.get(k));
  const door = window.petHost || null, saved = (door && door.load && door.load()) || {};
  const PX = num('px', saved.px || 100), seed = num('seed', (Date.now() % 100000) | 0), manual = q.get('manual') === '1', TILT = 0.12, FLOOR_PX = 3;
  let W = window.innerWidth, H = window.innerHeight;
  const T = await import(POTATO3D + 'vendor/three.module.js');
  const { createSpud } = await import(POTATO3D + 'spud3d.mjs');
  const phys = await import(POTATO3D + 'spudphys/dmath.mjs');
  const J = async (u, opt) => { try { const r = await fetch(LM + u); if (!r.ok) throw 0; return await r.json(); } catch (e) { if (opt) return null; throw new Error('pet: cannot load ' + u); } };
  const data = { physics: await J('data/physics.json'), moves: await J('data/moves.json'), behaviour: await J('data/behaviour.json'), direction: await J('direction.json'),
    gags: await J('data/gags.json', 1) || await J('design/gags.json', 1), sounds: await J('data/sounds.json', 1), personalities: await J('../personalities/first-batch.json', 1) };

  if (q.get('slipstream') === '0') data.physics.slipstream = { ...(data.physics.slipstream || {}), on: false };
  // final round flags (engineer): ?scuffs=0 (bold choice off) · ?hitstop=0 · ?space=0 (personal space) · ?cap=0.18 (the squash ladder: impact depth only, the flight keeps 0.12)
  if (q.get('scuffs') === '0') data.physics.scuffs = { ...(data.physics.scuffs || {}), on: false };
  if (q.get('hitstop') === '0') data.physics.contact.hitstop = { ...(data.physics.contact.hitstop || {}), on: false };
  if (q.get('space') === '0') data.physics.crowd_space = { ...(data.physics.crowd_space || {}), on: false };
  if (q.get('cap') && +q.get('cap') > 0) { data.physics.flight.stretch_cap = Math.min(data.physics.squash.cap, data.physics.flight.stretch_cap == null ? 1 : data.physics.flight.stretch_cap); data.physics.squash.cap = Math.min(0.3, +q.get('cap')); }
  document.documentElement.style.cssText = 'background:transparent'; document.body.style.cssText = 'margin:0;overflow:hidden;background:transparent;user-select:none;-webkit-user-select:none';
  const mk = () => { const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none'; document.body.appendChild(c); return c; };
  const fxB = mk(), canvas = mk(), fxF = mk(), gB = fxB.getContext('2d'), gF = fxF.getContext('2d');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.keepBuffer || q.get('shots') === '1', powerPreference: 'low-power' });
  renderer.outputColorSpace = T.LinearSRGBColorSpace; renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene(), cam = new T.OrthographicCamera(0, W / PX, H / PX, 0, 0.1, 40); cam.position.set(0, 5 * Math.tan(TILT), 5); cam.rotation.x = -TILT;
  let DPR = 1;
  function fit() { W = window.innerWidth; H = window.innerHeight; DPR = Math.min(2, window.devicePixelRatio || 1); renderer.setPixelRatio(DPR); renderer.setSize(W, H, false);
    for (const c of [fxB, fxF]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
    // (final round) WARM the two fx layers now: the first paint on a screen-sized 2D canvas cost one 250 ms frame in the app, three frames after his first hard landing
    // (final/pet-electron: with ?scuffs=0 it never happened; the earlier rounds' unexplained stalls were most likely this, on the first crack). Paying it at start-up, off screen.
    for (const g of [gB, gF]) { g.fillStyle = 'rgba(18,10,5,0.02)'; g.fillRect(0, 0, 4, 4); g.strokeStyle = 'rgba(18,10,5,0.02)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(4, 4); g.stroke(); g.getImageData(0, 0, 1, 1); g.clearRect(0, 0, 8, 8); }
    cam.right = W / PX; cam.top = H / PX; cam.updateProjectionMatrix(); }
  fit();

  // the sound designer's player takes its own arguments; these lines wrap it (same adapter as the bench), the file is untouched
  const soundPlug = ctx => { const s = createSound({ data: ctx.data.sounds, base: LM, rng: ctx.rng.stream('room', 'sound'), time: () => ctx.clock.k / 60, saved: saved.sound });
    s.onchange = st => save({ sound: st });
    return { name: 'sound', raw: s, stats: s.stats, cue: s.cue, mute: s.mute, arm: s.arm, state: s.state,
      add(p) { s.register(p.id, { personality: p.personality, real: p.brain === 'real' }); }, remove(p) { s.remove(p.id); },
      event(name, e) { if (name === 'contact') s.contact(e); else if (name === 'cue') s.cue(e.name, e); } }; };
  const host = { scene, pxPerBh: PX, yScale: 1 / Math.cos(TILT), spudOpts: { base: POTATO3D }, lod: q.get('lod') || 'auto', now: () => performance.now() };
  const living = createLiving({ T, createSpud, phys, data, host, seed, plugins: { moves: createMoves, brain: createBrain, face: createFace, fx: createFx, sound: data.sounds ? soundPlug : null } });
  const setRoom = () => living.room.set({ left: 0, right: W / PX, floor: FLOOR_PX / PX, ceiling: H / PX });
  setRoom();
  // (final round) the comedian's ONE WITNESS stays off unless asked for: ?witness=1 installs it, with the behaviour designer's brain.hold so the juror keeps his look
  if (q.get('witness') === '1') import('./comedy/witness.mjs').then(m => { m.install(living); living.on('witness', e => { const p = living.find(e.slot); if (p && living.brain && living.brain.hold) living.brain.hold(p, 150); }); });
  const toBh = (x, y) => [x / PX, (H - y) / PX], fxView = { px: PX * DPR, toPx: (x, y) => [x * PX * DPR, (H - y * PX) * DPR] };
  let store = { ...saved }; function save(o) { store = { ...store, ...o }; if (door && door.save) door.save(store); }
  let muted = q.get('muted') === '1' || !!saved.muted;
  if (living.sound) { if (muted) living.sound.mute(true); if (!manual) living.sound.arm(window); }

  // ---- drawing: him (WebGL), and the two fx layers when they have changed ----
  const frameMs = [], drawMs = [], hitches = [], recent = []; let lastRaf = 0;
  living.on('*', (name, e) => { if (name === 'dragged') return; recent.push(living.clock.k + ':' + name + (e && e.move ? '=' + e.move : '') + (e && e.name ? '=' + e.name : '')); if (recent.length > 14) recent.shift(); });
  function drawFx() { const f = living.fx; if (!f || !f.dirty) return; gB.clearRect(0, 0, fxB.width, fxB.height); gF.clearRect(0, 0, fxF.width, fxF.height); f.draw(gB, 'back', fxView); f.draw(gF, 'front', fxView); }
  function draw() { const t0 = performance.now(); renderer.render(scene, cam); drawFx(); drawMs.push(performance.now() - t0); if (drawMs.length > 1200) drawMs.shift(); }

  // ---- the pointer: he sees it everywhere; a press is his only where he (or the crack, or the hole) is ----
  const body = living.body, MODE = living.MODE; let ptr = { x: W / 2, y: H / 2, down: false }, mine = false, held = false;
  const overPotato = (bx, by) => { for (const p of living.potatoes) { const s = p.slot; if (body.mode[s] === MODE.gone) continue; const big = body.mode[s] === MODE.clip ? 1.6 : 1; if (Math.hypot((bx - body.x[s]) / (0.6 * big), (by - body.y[s]) / (0.64 * big)) < 1) return p; } return null; };
  const isMine = (bx, by) => held || !!overPotato(bx, by) || !!(living.fx && living.fx.hit(bx, by));
  function setMine(v) { if (v === mine) return; mine = v; if (door && door.hit) door.hit(v); }
  let moves = 0, tickMs = 0;
  function onPtr(e) { moves++;
    ptr = { x: e.clientX, y: e.clientY, down: (e.buttons & 1) === 1 }; const [bx, by] = toBh(ptr.x, ptr.y);
    if (e.type === 'pointerdown' && e.button === 0 && !overPotato(bx, by) && living.fx && living.fx.click(bx, by)) { ptr.down = false; setMine(isMine(bx, by)); return; }   // the crack goes on a click; the hole shuts
    if (e.type === 'pointerdown' && e.button !== 0) return;
    held = ptr.down && (held || !!overPotato(bx, by));
    living.input({ type: 'pointer', x: bx, y: by, down: ptr.down && held, t: manual ? undefined : performance.now() / 1000 });   // stepped by hand (tests): the engine's own clock times the samples
    if (!ptr.down) held = false;
    setMine(isMine(bx, by));
  }
  for (const t of ['pointermove', 'pointerdown', 'pointerup']) window.addEventListener(t, onPtr);
  window.addEventListener('mouseleave', () => { if (!held) setMine(false); });
  window.addEventListener('contextmenu', e => { e.preventDefault(); const [bx, by] = toBh(e.clientX, e.clientY), p = overPotato(bx, by); if (door && door.menu) door.menu(info(p)); });
  window.addEventListener('resize', () => { fit(); setRoom(); if (living.fx) living.fx.dirty = true; });

  // ---- the crowd ----
  const info = p => ({ id: p ? p.id : null, tan: p ? !p.personality : false, count: living.potatoes.length, max: living.MAX, muted });
  const pet = {
    living, data, PX, seed,
    count: () => living.potatoes.length,
    /** one more, up to five: the first is him (the real brain's seat), the rest run on script with a personality each */
    async add() { if (living.potatoes.length >= living.MAX) return null; const have = new Set(living.potatoes.map(p => p.personality)); const id = living.potatoes.length === 0 ? null : CAST.find(c => !have.has(c)) || CAST[0];
      const taken = living.potatoes.map(p => body.x[p.slot]), w = W / PX; let x = w / 2, best = -1; for (let i = 1; i < 12; i++) { const c = w * i / 12, d = Math.min(...taken.map(t => Math.abs(t - c)), 99); if (d > best) { best = d; x = c; } }
      const made = await living.add(id, { x: living.potatoes.length === 0 ? Math.min(w - 1.2, w * 0.72) : x, y: living.potatoes.length === 0 ? undefined : H / PX + 0.8 });   // the others drop in from above the screen
      if (living.potatoes.length > 1) { const p = living.find(made); if (p) body.impulse(p.slot, 0, -0.5, 0); }
      if (door && door.count) door.count(info(null)); return made; },
    remove(id) { const ps = living.potatoes, p = id != null ? living.find(id) : ps.filter(x => x.personality).pop(); if (!p || ps.length <= 1) return false; if (living.sound && living.sound.raw && living.sound.raw.remove) { /* the adapter's remove runs in living.remove */ }
      const ok = living.remove(p.id); if (door && door.count) door.count(info(null)); return ok; },
    zap(id) { const p = living.find(id == null ? 0 : id) || living.potatoes[0]; if (p) living.input({ type: 'zapped', id: p.id }); },
    feed(id) { const p = living.find(id == null ? 0 : id) || living.potatoes[0]; if (p) living.input({ type: 'fed', id: p.id }); },
    squish(id) { const p = living.find(id == null ? 0 : id) || living.potatoes[0]; if (p) living.input({ type: 'squished', id: p.id }); },
    explode(id) { const p = living.find(id == null ? 0 : id) || living.potatoes[0]; if (p) living.input({ type: 'exploded', id: p.id }); },
    mute(on = !muted) { muted = !!on; if (living.sound) living.sound.mute(muted); save({ muted }); if (door && door.count) door.count(info(null)); return muted; },
    muted: () => muted,
    step(n = 1) { for (let i = 0; i < n; i++) living.tick(); draw(); return living.clock.k; },
    pointer(x, y, down) { onPtr({ type: down && !ptr.down ? 'pointerdown' : !down && ptr.down ? 'pointerup' : 'pointermove', clientX: x, clientY: y, buttons: down ? 1 : 0, button: 0 }); },
    shot() { renderer.render(scene, cam); if (living.fx) living.fx.dirty = true; drawFx(); const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; const g = c.getContext('2d'); g.drawImage(fxB, 0, 0); g.drawImage(canvas, 0, 0); g.drawImage(fxF, 0, 0); return c.toDataURL('image/png'); },
    perf() { const qs = a => { const b = [...a].sort((x, y) => x - y), at = f => (b.length ? +b[Math.min(b.length - 1, Math.floor(f * b.length))].toFixed(2) : 0); return { n: b.length, median: at(0.5), p95: at(0.95), p99: at(0.99), worst: at(1) }; };
      return { frame_ms: qs(frameMs), over_20ms: frameMs.filter(v => v > 20).length, over_34ms: frameMs.filter(v => v > 34).length, draw_call_ms: qs(drawMs), ...living.perf(), hitches_over_50ms: hitches.slice(), potatoes: living.potatoes.length, canvas: [canvas.width, canvas.height], dpr: DPR, px_per_body_height: PX }; },
    perfReset() { frameMs.length = 0; drawMs.length = 0; hitches.length = 0; living.perfReset(); },
  };
  window.pet = pet; window.living = living;
  if (door && door.onCmd) door.onCmd((cmd, arg) => { if (cmd === 'add') pet.add(); else if (cmd === 'remove') pet.remove(arg); else if (cmd === 'mute') pet.mute(arg); else if (cmd === 'zap') pet.zap(arg); else if (cmd === 'feed') pet.feed(arg); else if (cmd === 'squish') pet.squish(arg); else if (cmd === 'explode') pet.explode(arg); });

  const n0 = Math.max(1, Math.min(5, num('n', 1))); for (let i = 0; i < n0; i++) await pet.add();

  if (!manual) {
    let last = performance.now(), beat = 0;
    const loop = now => { const dt = (now - last) / 1000; last = now; if (lastRaf) { frameMs.push(now - lastRaf); if (frameMs.length > 4000) frameMs.shift(); if (now - lastRaf > 50 && hitches.length < 40) hitches.push({ ms: Math.round(now - lastRaf), k: living.clock.k, hidden: document.visibilityState, last_tick_ms: +tickMs.toFixed(1), last_draw_ms: +(drawMs[drawMs.length - 1] || 0).toFixed(1), before: recent.slice(-8) }); } lastRaf = now;
      if (document.visibilityState !== 'hidden') { const t0 = performance.now(); const n = living.frame(Math.min(dt, 0.25)); tickMs = performance.now() - t0; if (n) draw(); }
      if (!held) { const [bx, by] = toBh(ptr.x, ptr.y); setMine(isMine(bx, by)); }   // he walked out from under a still pointer: give the desktop its clicks back at once
      if (door && door.alive && now - beat > 1000) { beat = now; door.alive(); }
      requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  draw();
  if (door && door.ready) door.ready(info(null));

  // ---- measure=SECONDS: stand, be thrown, then five and one thrown into the rest; frame times out through the door; then the app quits ----
  const secs = num('measure', 0);
  if (secs > 0 && !manual) (async () => {
    const wait = s => new Promise(r => setTimeout(r, s * 1000)), out = { started: new Date().toISOString(), seconds_each: secs, phases: {} };
    const snap = async n => { if (door && door.snap) await door.snap(n); };
    await wait(5); pet.perfReset(); await wait(secs); out.phases.one_standing = pet.perf(); await snap('pet-electron-one');
    pet.perfReset(); body.impulse(living.potatoes[0].slot, -9, 11, 6); await wait(0.5); await snap('pet-electron-thrown'); await wait(secs - 0.5); out.phases.one_thrown = pet.perf();
    out.pointer_moves_seen_while_click_through = moves;
    while (living.potatoes.length < 5) await pet.add(); await wait(2.5);
    pet.perfReset(); await wait(secs); out.phases.five_standing = pet.perf(); await snap('pet-electron-five');
    pet.perfReset(); body.impulse(living.potatoes[0].slot, -12, 7, 5); await wait(secs); out.phases.five_one_thrown = pet.perf();
    out.plugins = { moves: !!living.moves, brain: !!living.brain, face: !!living.face, fx: !!living.fx, sound: !!living.sound }; out.judge = living.judge(); out.judge = { pass: out.judge.pass, fails: (out.judge.fails || []).length, frames: out.judge.frames_checked, worst: out.judge.worst_outside_exempt_frames };
    out.sound = living.sound ? { muted, started: living.sound.stats && living.sound.stats.started } : null;
    if (door && door.measured) door.measured(out); else window.__measured = out;
  })();
  return pet;
}

// intro.mjs — the kitchen, which IS the menu now. Matt: "for the kitchen can you take away the menu, you can narrow it to ten
// costumes, each representing a song, with a door to the left of the screen that you walk through to start the level";
// "you can change the opening, we arent building a kitchen at the start"; "jsut glitching between menu"; "so you glitch to
// select the level, the song name appears in glitch text with each costume change".
// No opening act: after start you're straight in the kitchen with him standing there (one beat of his glitch as he appears).
// Each glitch (space / the glitch button / an icon) changes his costume, the room and the song; the song's name glitches in
// on the sign over the door (kitchens.mjs). Walk him left through the door (or click / tap it) and that song starts: the door
// opens, the song's light spills out, he waddles in, and it cuts to the level.
// He's playable in here (Matt: "potato needs to have his left right jump duck and glitch controls for the kitchen too").
// And the room is too (Matt, Nov 1: "we need the kitchen to be interactive"): every room lists props (kitchens.mjs) he can
// walk into (bump), hop onto and stand on (hop: ↑ is a real jump in here, and he lands on tables, chairs, counters), or use
// when he's next to one (E, or tap / click it: he walks over and uses it). Each prop's state goes to the room's painting so
// it reacts in that room's style; they reset with every glitch.
// THE WATCH DOOR (Matt: "I need a demo option for each in the kitchen, make it a door to the right, I need to watch without
// figuring out what i am doing"): every room has a second door on the right wall, signed WATCH. Walk him right into it (or click /
// tap it, or press O) and the song's demo plays hands-off from the top, the whole song. The left door still plays it for real.
import { STYLES, DOOR, WDOOR, ROOM, preload } from './kitchens.mjs';
import { loadOutfit } from '../lib/outfits3d.mjs';
import { armsDriver } from './armsfx.mjs';
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const HOME_X = -1.4, SPEED = 2.4;
const GRAV = 22, JUMP_V = 7.56, CEIL = 2.7;         // his jump in the kitchen (world units): peaks ~1.3 up (exact, whatever the frame rate): tables + stools with room to spare; table -> counter
const REACH = 120, BUMP = 30, SIDE = 100, FACE_GAP = 3;
// HIS ARMS (Matt, Nov 1: "potato needs the arms, at least sometimes. It would help make him look like hes dancing"): in the disco,
// when the mirrorball party is on, he dances with them, every move ON the beat of the kitchen's music (the song's instrumental loop,
// main.mjs kitchenMusic: cut from a beat, so its clock / the song's game beat = beats). A new move every 2 bars. Arms go away the
// moment the party stops, he walks through a door or the kitchen closes. Outside the party (Matt, Nov 1: "arms whenever he jumps
// around and spins around" + "they should disappear when hes just standing still or waddling"): no arms at rest or walking, they
// pop out on every hop (↑ hops + spins) and go back into him when he lands (run/armsfx.mjs, shared with the levels).
const DANCE_SET = ['groove', 'disco', 'raise-the-roof', 'pump', 'wiggle'];
let instAudio = null;   // the kitchen loop that's playing (watched, never touched: main.mjs owns it)
if (typeof HTMLMediaElement !== 'undefined' && !HTMLMediaElement.prototype.__potatoBeat) {
  const play0 = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.__potatoBeat = true;
  HTMLMediaElement.prototype.play = function (...a) { if (/\.inst\.mp3/.test(this.src || '')) instAudio = this; return play0.apply(this, a); }; }
const GBEAT = {};       // song id -> its game beat (s), from its beat map
function gameBeat(id) { if (!id) return 0; if (GBEAT[id] === undefined) { GBEAT[id] = 0;
    fetch(new URL('../music/' + id + '.map.json', import.meta.url)).then(r => r.json()).then(m => { GBEAT[id] = m.gameBeat || 0; }).catch(() => {}); }
  return GBEAT[id]; }   // (room units) how close he has to be to use a thing / to bump into it / how far beside a thing he stands to use it (so he doesn't hide it); faces at most every 3 s

let S_bleed = () => {};
export const bleed = on => S_bleed(on);
export function createIntro({ T, scene, stage, spud, pivot, cam, fx, viewW, sfx }) {
  let spinOff = 0; const turnAt = a => spud.turnTo(a + spinOff);
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 900; const cx = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace;
  const plane = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); plane.position.z = -3; plane.renderOrder = -5;
  // in front of everything: the door's light washing over him as he goes in, and the white the level cuts in from
  const fg = document.createElement('canvas'); fg.width = 960; fg.height = 540; Object.assign(fg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
  const fx2 = fg.getContext('2d');
  const now = () => performance.now() / 1000;
  const LITE = matchMedia('(pointer: coarse)').matches;
  let tail = 0, cur = 0, looping = false, raf = 0, last = 0, lastPaint = -1, tr = null, flk = null, lastGl = -9, moving = false;
  let walk = { dir: 0, to: null, door: false, ducking: false };
  let songs = STYLES.map((st, i) => ({ n: i + 1, title: st.name, cleared: false })), nameAt = -99, white = 0, fading = null;
  let door = { open: 0, want: 0 }, door2 = { open: 0, want: 0 }, enter = null;   // (door2: the watch door)
  // the props: one state per prop of the current room (kitchens.mjs reads them as P[id]); his height + which one he's standing on
  let ps = [], P = {}, near = -1, pend = [], litK = 1, lastFace = -9, busyTo = -9, lamps = [], gravI = -1, faceDir = 0, live = false;
  const phys = { y: 0, vy: 0, air: false, on: -1 };
  // Nov 5 (Chikin: "he isnt flipping in the kitchen" / "double jump is a flip"): ↑ again in the air = a second, smaller hop and a
  // forward flip round his belly, like the double jump in the levels. flip.k = 0..1 through the turn (null: not flipping); dir follows where he faces.
  const flip = { k: null, dir: -1 }, FLIP_T = 0.5, MID = 0.62;
  const groove = { on: false, est: -1, beat: null, opt: { body: true } }, ARMS = armsDriver(spud), AO = { t: 0, air: false, vy: 0, vy0: 7, off: false, dance: null, beat: 0, body: true };   // his dance: the music clock (smoothed), its beat phase
  const planeH = () => plane.scale.y || viewW() * 9 / 16;
  const wx = X => (X / 1600 - 0.5) * viewW();                       // room canvas -> world
  const wy = Y => 1.6 + (0.5 - Y / 900) * planeH();
  const doorX = (G = DOOR) => wx((G.x0 + G.x1) / 2);
  const lo = () => wx(DOOR.x1 + 62), hi = () => wx(WDOOR.x0 - 62);   // he walks from the door to the watch door
  const doorAt = (X, Y) => Y > 120 && X < DOOR.x1 + 40 ? 'play' : Y > 120 && Y < WDOOR.y1 + 40 && X > WDOOR.x0 - 18 ? 'watch' : false;   // (canvas px: a door, its sign, or the wall beside it; the watch door stops at its step, so a finger exploring the floor at the right edge never starts a whole-song demo)
  const v3 = new T.Vector3();
  const toFg = (x, y) => { v3.set(x, y, 0).project(cam); return [(v3.x * 0.5 + 0.5) * 960, (0.5 - v3.y * 0.5) * 540]; };
  const rawX = () => ((pivot.position.x / viewW() + 0.5) * 1600 - ROOM.ox) / ROOM.sx;   // where he is in the room's own coordinates
  const worldOfRaw = X => wx(ROOM.ox + X * ROOM.sx);
  const rawY = y => (0.5 - (y - 1.6) / planeH()) * 900;
  const props = () => STYLES[cur].props || [];
  const gapTo = (p, X) => X < p.x0 ? p.x0 - X : X > p.x1 ? X - p.x1 : 0;
  const mid = p => (p.x0 + p.x1) / 2;
  // what E (and a tap beside him) can use: switches, things to knock, things to bump. Chairs + stools are walked into or hopped onto instead,
  // so E next to a chair still means the pot / the cauldron behind it
  const usable = p => p.kind === 'switch' || p.kind === 'knock' || p.kind === 'bump';
  const upNow = () => !phys.air && phys.on >= 0 && !!props()[phys.on] && !!props()[phys.on].walk;   // (on the stairs / the landing)
  const reachable = p => !(p.upY != null && (!upNow() || phys.y < wy(p.upY) - 0.12)) && !(p.downOnly && phys.y > 0.12);
  const stairsI = () => props().findIndex(q => q.walk);
  // up or down the stairs first, then do it: then = { up: true | false, use: i | x: raw X }
  function viaStairs(then) { const si = stairsI(), p = props()[si]; if (si < 0) return false; walk.then = then; walk.dir = 0; faceDir = 0; walk.chain = -1; walk.hopAt = 0;
    if (then.up) { walk.use = si; walk.hop = true; walk.to = Math.max(lo(), Math.min(hi(), worldOfRaw(p.seat[0] + 20))); }   // to the foot, hop on
    else { walk.use = -1; walk.hop = false; walk.to = Math.max(lo(), worldOfRaw(p.x0 - 30)); }   // off the bottom step
    return true; }
  const seatOf = p => p.seat || [p.x0, p.x1];
  function standOK(i, X, t) { const p = props()[i]; if (!p || p.top == null) return false; if (p.topAt) return X >= p.x0 && X <= p.x1; const [a, b] = seatOf(p), m = b - a <= 130 ? 8 : 0;   // (a seat: a little give; a counter / table: its own edge, no hanging off it)
    return X >= a - m && X <= b + m && (!p.standIf || p.standIf(ps[i], t)); }
  const idOf = id => props().findIndex(q => q.id === id);
  const lightWant = () => lamps.length ? lamps.filter(i => ps[i].on).length / lamps.length : 1;   // (the room's light: its lamp, or the share of its torches still lit)
  function resetProps() {
    ps = props().map(p => ({ on: !!p.startOn, t0: -99, land: -99, lx: 0, n: 0, inside: false, lt: 0, looped: false, off: -99, tap: -99 })); P = {}; props().forEach((p, i) => { P[p.id] = ps[i]; });
    pend.length = 0; near = -1; lamps = props().map((p, i) => p.lamp ? i : -1).filter(i => i >= 0); gravI = props().findIndex(p => p.gravity); litK = lightWant(); busyTo = now() + 0.5; live = false; }
  const lowG = () => gravI >= 0 && ps[gravI].on;   // (the galley's gravity switch)
  function reachH() { const st = STYLES[cur], low = lowG(), v = JUMP_V * Math.sqrt(st.grav || 1) * (low ? 0.78 : 1), g = GRAV * (st.grav || 1) * (low ? 0.3 : 1); return Math.min(CEIL, v * v / (2 * g)); }   // how high his hop gets
  function face(f) { if (!f || !S.onFace) return; const t = now(); if (t - lastFace < FACE_GAP) return; lastFace = t; S.onFace(f[0], f[1]); }
  function play(name) { if (name && sfx[name]) sfx[name](); }
  // something happens to prop i: 'use' (E / tap: a switch flips, a knock knocks / rights it, anything else gets poked), 'bump', 'land'
  function fire(i, how) { const p = props()[i], s = ps[i], t = now(); if (!p) return;
    if (how === 'use') { if (p.kind === 'switch' || p.kind === 'knock') { s.on = !s.on; how = s.on ? 'on' : 'off'; } else how = 'bump'; }
    if (how === 'land') { s.land = t; s.lx = rawX(); } else { s.t0 = t; s.n++; if (how === 'on') { s.lt = t; s.looped = false; } }
    play(p.sfx && p.sfx[how] !== undefined ? p.sfx[how] : how === 'land' ? 'land' : how === 'on' || how === 'off' ? 'flick' : null);
    face(p.face && p.face[how]);
    const af = p.after && p.after[how]; if (af) for (const [d, sn] of af) pend.push({ at: t + d, i, stamp: s.t0, sn });
    busyTo = Math.max(busyTo, t + (p.busy ?? 1)); if (p.call) S.onProp && S.onProp(p.id, s.on); }   // (painted every frame while it reacts: p.busy for the long ones)
  // where he stands to use a thing: right under it if it's overhead (the lamp's chain, the fan), else beside it, on the side he's
  // coming from, so his body doesn't hide what it does (the cauldron boiling over, the phone ringing)
  const visBox = p => p.hit || [p.x0, p.y0 ?? (p.top ?? 600) - 40, p.x1, p.y1 ?? 900];
  function covers(p, X, feet) { const [a, b, c, d] = visBox(p); return c > X - 95 && a < X + 95 && d > feet - 215 && b < feet - 10; }
  const rawOf = x => ((x / viewW() + 0.5) * 1600 - ROOM.ox) / ROOM.sx;
  function spotFor(p, X) { const feet = rawY(0);
    if (!covers(p, Math.max(p.x0, Math.min(p.x1, X)), feet)) return Math.max(p.x0, Math.min(p.x1, X));
    const [a, , c] = visBox(p), L = Math.min(a, p.x0) - SIDE, R = Math.max(c, p.x1) + SIDE, rl = rawOf(lo()) + 4, rh = rawOf(hi()) - 4, okL = L >= rl, okR = R <= rh;
    if (okL && (X < mid(p) || !okR)) return L; if (okR) return R; return X < mid(p) ? Math.max(rl, L) : Math.min(rh, R); }
  const toward = (p, X) => Math.sign(mid(p) - X) || 0;
  function turnToward(dir) { faceDir = dir; if (!moving && walk.to == null) turnAt(dir ? dir * 0.6 : 0.32); }
  function goUse(i, X) { const p = props()[i]; if (p && !reachable(p) && !(p.upY != null && upNow()) && viaStairs({ up: p.upY != null, use: i })) return; walk.use = i; walk.hop = false; walk.door = false; walk.dir = 0; walk.chain = -1; walk.hopAt = 0; faceDir = 0; walk.to = Math.max(lo(), Math.min(hi(), worldOfRaw(spotFor(p, X)))); }
  function useNow(i) { const t = now(), s = ps[i], p = props()[i]; if (!p || t - s.tap < 0.5) return; s.tap = t; fire(i, 'use');   // (a tap can't fire the same thing twice in half a second)
    const X = rawX(); if (phys.on < 0 && !phys.air && covers(p, X, rawY(phys.y))) { const tx = spotFor(p, X); walk.to = Math.max(lo(), Math.min(hi(), worldOfRaw(tx))); walk.use = -1; walk.dir = 0; faceDir = toward(p, tx); }   // he steps back to watch it
    else turnToward(toward(p, X)); }
  function hot(z, X, t) { if (!jump()) return; play('sizzle'); face(['startled', 0.8]); sfx.jump && sfx.jump(); walk.use = -1; walk.dir = 0; faceDir = 0;   // (the lit burners: he hops off them, sideways)
    walk.to = worldOfRaw(X < (z.x0 + z.x1) / 2 ? z.x0 - 34 : z.x1 + 34); }
  function stepProps(t, X, d) {   // timers: switching itself off, sounds while on, bumps as he walks into things, the one he's next to
    const L = props(); live = false;
    for (let i = 0; i < L.length; i++) { const p = L[i], s = ps[i];
      if (p.auto && s.on && t - s.t0 > p.auto) { s.on = false; s.t0 = t; play(p.sfx && p.sfx.done); face(p.face && p.face.done); busyTo = Math.max(busyTo, t + 1); }
      if (p.loop && s.on) { const due = s.looped ? s.lt + p.loop.every : s.t0 + (p.loop.first ?? p.loop.every); if (t >= due) { s.lt = t; play(p.loop.sfx); if (!s.looped) face(p.loop.face); s.looped = true; } }
      if (s.on && (p.loop || p.auto)) live = true;   // (a timed thing on: the pot's lid, the phone, the microwave... painted every frame)
      if (p.kind === 'bump' || p.bump) { const inside = !phys.air && phys.on < 0 && gapTo(p, X) < BUMP;   // walking INTO it (not past it, not stepping down off it)
        if (inside && !s.inside && d && d === toward(p, X) && t - s.t0 > 1.2 && t - s.off > 0.5) fire(i, 'bump'); s.inside = inside; } }
    for (let k = pend.length - 1; k >= 0; k--) { const q = pend[k]; if (t < q.at) continue; pend.splice(k, 1); if (ps[q.i] && ps[q.i].t0 === q.stamp) play(q.sn); }
    if (phys.on >= 0 && !phys.air && L[phys.on] && L[phys.on].zones) for (const z of L[phys.on].zones) if (z.act === 'hot' && X >= z.x0 && X <= z.x1) { const j = idOf(z.id); if (j >= 0 && ps[j].on) { hot(z, X, t); break; } }
    near = -1; let best = 1e9;   // the one E uses: in reach; nearest the middle of him; switches / knocks before things you bump
    for (let i = 0; i < L.length; i++) { const p = L[i]; if (!usable(p) || !reachable(p)) continue; const g = gapTo(p, X); if (g > REACH) continue; const sc = g + Math.abs(X - mid(p)) * 0.25 + (p.kind === 'bump' ? 40 : 0); if (sc < best) { best = sc; near = i; } }
    const want = lightWant(); litK += (want - litK) * Math.min(1, (want > litK ? 14 : 7) / 60 * 2); if (Math.abs(want - litK) < 0.01) litK = want; }
  // THE FRONT DOOR (the living room, Nov 8): it doesn't go anywhere yet. Walk into it and it opens a crack: the street, the outside he's never
  // been. He looks (awe), the night comes in, it swings shut, and he steps back. Walk off and back to look again.
  let peek = null, peekArm = true;
  function peekOut() { const t = now(); if (peek || !peekArm || !looping || enter) return; peek = { t0: t }; peekArm = false;
    walk.dir = 0; walk.to = null; walk.use = -1; walk.then = null; moving = false; spud.waddle(false); turnAt(-0.95); play('creak'); S.onFace && S.onFace('awe', 2.2); }
  function stepPeek(T0) { if (!peek) { if (!peekArm && pivot.position.x - lo() > 0.45) peekArm = true; return; } const a = T0 - peek.t0;
    door.want = a < 2.4 ? 0.62 : 0; if (a >= 2.4 && !peek.shut) { peek.shut = true; play('thud'); turnAt(0.32); walk.to = lo() + 0.55; }
    if (a > 2.9) peek = null; }
  function leave() { if (phys.on >= 0 && ps[phys.on]) ps[phys.on].off = now(); phys.on = -1; }
  // his height: a real jump in here, landing on whatever's under him on the way down (or the floor); walk off an edge and he drops.
  // Exact steps of the arc (not frame-rate dependent): the same hop at 10 fps as at 60
  function stepY(dt, X, t, free) {
    const st = STYLES[cur], low = !free && lowG(), g = GRAV * (st.grav || 1) * (low ? 0.3 : 1);
    if (phys.air) { const y0 = phys.y, vb = phys.vy; let y1 = y0 + vb * dt - g * dt * dt / 2; phys.vy = vb - g * dt; if (y1 >= CEIL && phys.vy > 0) { y1 = CEIL; phys.vy = 0; } y1 = Math.min(CEIL, y1);
      if (phys.vy <= 0) { let best = 0, bi = -1; const yTop = vb > 0 ? Math.min(CEIL, y0 + vb * vb / (2 * g)) : y0;   // (the top of the arc, if it fell inside this step)
        let score = -1;   // (the highest surface under him; one right under his middle beats one he'd only catch with an edge)
        const L = props(); if (!free) for (let i = 0; i < L.length; i++) { const p = L[i]; if (p.top == null || !standOK(i, X, t)) continue; const ty = wy(p.topAt ? p.topAt(X) : p.top), [a, b] = p.topAt ? [p.x0, p.x1] : seatOf(p), sc = ty + (X >= a && X <= b ? 10 : 0);
          if (sc > score && yTop >= ty - 0.03 && y1 <= ty) { score = sc; best = ty; bi = i; } }
        if (y1 <= best) { const sp = -phys.vy; y1 = best; phys.air = false; phys.dbl = false; phys.vy = 0; phys.on = bi; ARMS.settle(); spud.land(Math.min(6, sp * 0.6));
          if (bi >= 0) { fire(bi, 'land'); landZones(bi, X, t); } else if (sfx.land) sfx.land(Math.min(1.4, sp / 6));
          if (walk.chain >= 0) { if (bi >= 0 && bi === walk.via) walk.hopAt = t + 0.18; else walk.chain = -1; } } }   // (on the way up to a counter: one more hop)
      phys.y = y1; }
    else if (phys.on >= 0 && !free && props()[phys.on].topAt && standOK(phys.on, X, t)) { const p = props()[phys.on], top = p.topAt(X), ty = wy(top), s = ps[phys.on];   // STAIRS (the living room): he walks up and down them, a step at a time
      if (s.top !== top) { if (s.top != null && p.creak && p.creak(top) && p.stepSfx) play(p.stepSfx); s.top = top; }   // (one or two boards creak)
      if (Math.abs(ty - phys.y) > 0.003) phys.y += Math.sign(ty - phys.y) * Math.min(Math.abs(ty - phys.y), dt * 5.5); else phys.y = ty; }
    else if (phys.on >= 0 && (free || !standOK(phys.on, X, t))) { phys.air = true; phys.vy = 0; leave(); }   // off the edge
    else if (phys.on < 0 && phys.y > 0) { phys.air = true; phys.vy = 0; }
    if (flip.k != null) { flip.k = Math.min(1, flip.k + dt / FLIP_T); const e = flip.k < 1 ? flip.k * flip.k * (3 - 2 * flip.k) : 1;   // (eased: quick in the middle, settles upright)
      pivot.rotation.z = flip.dir * Math.PI * 2 * e; spud.place(0, -MID); pivot.position.y = phys.y + MID;   // pivot at his middle while he turns
      if (flip.k >= 1 || !phys.air) { flip.k = null; pivot.rotation.z = 0; spud.place(0, 0); pivot.position.y = phys.y; } }
    else pivot.position.y = phys.y; }
  function landZones(bi, X, t) { const p = props()[bi]; if (!p.zones) return;   // a spot on a surface that does something when he lands on it (the conch blows)
    for (const z of p.zones) { if (z.act === 'hot' || X < z.x0 || X > z.x1) continue; const j = idOf(z.id); if (j >= 0 && !ps[j].on) fire(j, 'use'); } }
  function airJump() { if (!phys.air || phys.dbl || flip.k != null) return false; const st = STYLES[cur]; phys.dbl = true; phys.vy = JUMP_V * 0.8 * Math.sqrt(st.grav || 1) * (lowG() ? 0.78 : 1);
    flip.k = 0; flip.dir = (moving === -1 || moving === -2 && walk.dir < 0) ? 1 : -1; spud.jumped(); return true; }   // (the double jump: one per hop)
  function jump() { if (phys.air) return false; const st = STYLES[cur]; leave(); phys.air = true; phys.dbl = false; phys.vy = JUMP_V * Math.sqrt(st.grav || 1) * (lowG() ? 0.78 : 1); spud.jumped(); return true; }

  const S = { styles: STYLES, onFace: null, onEnter: null,
    style() { return cur; },
    shown() { return looping; },
    // E (main.mjs): use the thing he's next to (marked with the sparkle); nothing in reach: he walks over to the nearest one and uses it
    use() { if (!looping || enter) return false; if (near >= 0) { useNow(near); return true; }
      const L = props(), X = rawX(); let bi = -1, bg = 1e9; L.forEach((p, i) => { if (!usable(p)) return; const g = gapTo(p, X) + (reachable(p) ? 0 : 400); if (g < bg) { bg = g; bi = i; } });
      if (bi < 0) return false; goUse(bi, X); return true; },
    props() { return { list: props(), state: ps, near, y: phys.y, on: phys.on >= 0 ? props()[phys.on].id : null, x: rawX() }; },   // (for checks)
    busy() { return !!enter; },
    glitching() { if (!looping) return false; if (fx.amount > 0 || tr || flk) { tail = 3; return true; } return tail-- > 0; },   // (main asks once a frame; a few frames past the end so his glitch words clear, however slow the frames)
    setSongs(list) { songs = list; },
    // into the kitchen: fresh from start (he's standing there), or back out of a level's door (he steps out of it)
    showKitchen(i = cur, o = {}) {
      cur = ((i % STYLES.length) + STYLES.length) % STYLES.length; tr = null; flk = null; enter = null; white = 0; fading = null;
      if (!plane.parent) scene.add(plane); if (!fg.parentNode) stage.appendChild(fg); fx2.clearRect(0, 0, 960, 540);
      const vw = viewW(); plane.scale.set(vw, vw * 9 / 16, 1); plane.position.set(0, 1.6, -3); plane.visible = true;
      cam.up.set(0, 1, 0); cam.zoom = 1; cam.position.set(0, 1.6, 10); cam.lookAt(0, 1.6, 0); cam.updateProjectionMatrix();
      pivot.rotation.set(0, 0, 0); pivot.scale.setScalar(1); pivot.visible = true; spud.place(0, 0); spud.duck(false);   // (a level may have left him hidden, flipped or mid-spin)
      stopDance(true); if (!STYLES[cur].noSong) gameBeat(STYLES[cur].level);
      walk = { dir: 0, to: null, door: false, ducking: false, use: -1, chain: -1, via: -1, hopAt: 0, then: null }; peek = null; peekArm = true; moving = false; faceDir = 0; phys.y = 0; phys.vy = 0; phys.air = false; phys.on = -1; phys.dbl = false; flip.k = null; resetProps();
      door2 = { open: 0, want: 0 };
      if (o.back && o.watch) { pivot.position.set(hi() - 0.25, 0, 0); door = { open: 0, want: 0 }; door2 = { open: 1, want: 0 }; spud.waddle(false); spud.snap(-0.6); }   // back out of the watch door
      else if (o.back) { pivot.position.set(lo() + 0.25, 0, 0); door = { open: 1, want: 0 }; spud.waddle(false); spud.snap(0.6); }   // he's just come back out; it swings shut behind him
      else { pivot.position.set(HOME_X, 0, 0); door = { open: 0, want: 0 }; spud.waddle(false); spud.snap(0.32); }
      dress(STYLES[cur].outfit, true);
      nameAt = now(); fx.amount = 0.9; lastGl = now(); sfx.glitch && sfx.glitch();   // one beat of his glitch as he appears; the name glitches onto the sign
      for (let k = 0; k < STYLES.length; k++) setTimeout(() => preload(k), 200 + k * 60);
      paintStyle(now()); startKitchen(); },
    backdrop(on) { plane.visible = on; },   // (hidden for the glitch pass: the glitch is his, never the whole picture)
    hideKitchen() { stopKitchen(); stopDance(true); scene.remove(plane); phys.y = 0; phys.vy = 0; phys.air = false; phys.on = -1; phys.dbl = false; flip.k = null; pivot.position.set(0, 0, 0); pivot.rotation.set(0, 0, 0); pivot.scale.setScalar(1); pivot.visible = true; spud.waddle(false); spud.duck(false); spud.snap(0.32);
      if (!(white > 0)) fg.remove(); },   // (the white stays up until the level is running: unwhite() takes it down)
    unwhite() { if (!fg.parentNode) return; const t0 = now(), w0 = white || 1; fading = t0;
      const f = () => { if (fading !== t0) return; const k = (now() - t0) / 0.45; white = w0 * (1 - ease(k)); fx2.clearRect(0, 0, 960, 540);
        if (k >= 1) { white = 0; fg.remove(); return; } fx2.fillStyle = `rgba(255,250,238,${white})`; fx2.fillRect(0, 0, 960, 540); requestAnimationFrame(f); }; f(); },
    // he glitches the room into the next song's: the room tears into plain slices (purple stays on him), the new one snaps in, he flicks
    // through two outfits and lands in the song's own, and the song's name glitches onto the sign over the door
    setStyle(i) {
      i = ((i % STYLES.length) + STYLES.length) % STYLES.length; if (i === cur || enter) return; const was = cur; cur = i;
      resetProps(); walk.use = -1; walk.chain = -1; walk.hopAt = 0; if (phys.on >= 0 || phys.y > 0) { phys.air = true; phys.on = -1; }   // a new room: its props fresh; if he was up on something, he drops onto whatever's there now
      if (!looping) return;
      const snap = document.createElement('canvas'); snap.width = 1600; snap.height = 900; snap.getContext('2d').drawImage(cv, 0, 0);
      tr = { t0: now(), from: snap, seed: Math.floor(Math.random() * 1000) }; addScar(snap); nameAt = now() + 0.12; door.want = 0; door.open = 0; door2.want = 0; door2.open = 0;
      const o = STYLES[i].outfit, pool = STYLES.map(st => st.outfit).filter(s => s && s !== o && s !== STYLES[was].outfit), picks = [];
      while (picks.length < 2 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      const me = tr; Promise.all([...picks, o].map(s => s ? loadOutfit(s).catch(() => null) : null)).then(bs => { if (cur === i && looping && (tr === me || (me && now() - me.t0 < 0.5))) flk = { t0: now(), bs, k: -1 }; });
      fx.amount = 0.9; lastGl = now(); sfx.glitch && sfx.glitch(); S.onFace && S.onFace(Math.random() < 0.5 ? 'smirk' : 'wide', 0.9); },
    key(k, down) {   // 'L' / 'R' walk, 'J' hop + spin, 'D' duck
      if (!looping || enter) return;
      if (k === 'L' || k === 'R') { const d = k === 'L' ? -1 : 1; if (down) { walk.dir = d; walk.to = null; walk.door = false; walk.use = -1; walk.chain = -1; walk.hopAt = 0; walk.then = null; faceDir = 0; if (peek && d > 0) peek.t0 = Math.min(peek.t0, now() - 2.4); } else if (walk.dir === d) walk.dir = 0; }
      else if (k === 'J' && down) { if (!jump()) { if (airJump()) { ARMS.spun(now()); sfx.jump && sfx.jump(); } return; } spud.spin(); ARMS.spun(now()); sfx.jump && sfx.jump(); if (now() - lastFace > FACE_GAP) S.onFace && S.onFace(Math.random() < 0.6 ? 'smirk' : 'startled', 0.8); }   // a real hop: he can land on things
      else if (k === 'D') { walk.ducking = down; spud.duck(down); } },
    // a click / tap / drag at (u, v) on the stage (0..1): walk there; on a door (or past it) = go through it (left: play, right: watch).
    // o.drag (a finger dragging): he just follows it, nothing in the room gets picked. o.min: the smallest a tap box gets (canvas px; a fingertip on a phone)
    walkTo(u, v = 0.8, o = {}) { if (!looping || enter) return; const x = (u - 0.5) * viewW(), y = 1.6 + (0.5 - v) * (cam.top - cam.bottom);
      const X = (x / viewW() + 0.5) * 1600, Y = (0.5 - (y - 1.6) / planeH()) * 900;
      walk.door = doorAt(X, Y);   // a door, its sign, or the wall beside it
      walk.use = -1; walk.chain = -1; walk.hopAt = 0; walk.then = null; faceDir = 0;
      if (!walk.door && !o.drag) {
        const RX = (X - ROOM.ox) / ROOM.sx, L = props(), cx = rawX(), feet = rawY(phys.y);
        const mx = (o.min || 0) / ROOM.sx, my = o.min || 0; let bi = -1, ba = 1e9;   // a prop? (the smallest tap box under the finger)
        L.forEach((p, i) => { let [a, b, c, d] = visBox(p); const cap = p.top != null ? p.top + 50 : 1e9;   // (something he stands on: only its top; the floor in front of it is still floor)
          if (c - a < mx) { const k = (mx - (c - a)) / 2; a -= k; c += k; } if (d - b < my) { const k = (my - (d - b)) / 2; b -= k; d += k; } d = Math.min(d, cap);
          if (RX >= a && RX <= c && Y >= b && Y <= d && (c - a) * (d - b) < ba) { ba = (c - a) * (d - b); bi = i; } });
        if (bi < 0 && near >= 0 && Math.abs(RX - cx) < 80 && Y < feet && Y > feet - 225) { walk.to = null; walk.dir = 0; useNow(near); return; }   // a tap on him (not on a thing): he uses what he's next to (a phone has no E)
        if (bi >= 0 && L[bi].walk) { const tx = Math.max(L[bi].x0 + 10, Math.min(L[bi].x1 - 10, RX)); if (upNow()) { walk.to = Math.max(lo(), Math.min(hi(), worldOfRaw(tx))); walk.dir = 0; } else viaStairs({ up: true, x: tx }); return; }   // the stairs: up them, to there
        if (bi < 0 && upNow() && Y > 640) { viaStairs({ up: false, x: RX }); return; }   // the floor, from up there: down the stairs first
        if (bi >= 0) { const p = L[bi], hop = (p.kind === 'hop' || (p.top != null && p.standIf && p.standIf(ps[bi], now()))) && !((p.bump || p.kind !== 'hop') && phys.on === bi);   // (a hop-on thing; or the haunted chair once it's up)
          if (!hop) { if (reachable(p) && gapTo(p, cx) <= REACH * 0.8 && !(phys.on < 0 && covers(p, cx, feet))) { walk.to = null; walk.dir = 0; useNow(bi); } else goUse(bi, cx); return; }   // walk over beside it, use it
          const [a, b] = seatOf(p); let tx = Math.max(a + 24, Math.min(b - 24, RX)), go = bi;
          if (wy(p.top) - phys.y > reachH() * 0.92) {   // too high to hop straight up (a counter from the floor): up via something lower that runs under it
            go = -1; for (let j = 0; j < L.length; j++) { const q = L[j]; if (j === bi || q.top == null || q.standIf) continue; const [qa, qb] = seatOf(q), l2 = Math.max(a, qa) + 16, h2 = Math.min(b, qb) - 16, qy = wy(q.top);
              if (h2 <= l2 || qy <= phys.y + 0.05 || qy - phys.y > reachH() * 0.92 || wy(p.top) - qy > reachH() * 0.92) continue; go = j; tx = Math.max(l2, Math.min(h2, RX)); break; }
            if (go < 0) { walk.to = Math.max(lo(), Math.min(hi(), x)); walk.dir = 0; return; }   // (no way up from here: he just walks there)
            walk.via = go; walk.chain = bi; }
          walk.use = go; walk.hop = true; walk.to = Math.max(lo(), Math.min(hi(), worldOfRaw(tx))); walk.dir = 0; return; } }
      walk.to = walk.door === 'watch' ? hi() + 0.01 : walk.door ? lo() - 0.01 : Math.max(lo(), Math.min(hi() - 0.05, x)); walk.dir = 0; },   // (the floor just short of the watch door: only the door itself goes through it)
    onDoor(u, v) { const x = (u - 0.5) * viewW(), y = 1.6 + (0.5 - v) * (cam.top - cam.bottom); const X = (x / viewW() + 0.5) * 1600, Y = (0.5 - (y - 1.6) / planeH()) * 900; return !!doorAt(X, Y); },
    // through a door: 'demo' goes through the watch door (right), everything else through the song's door (left)
    enterDoor(how = 'play') { if (how === 'demo' && !S.rightOpen) return; if (how !== 'demo' && S.leftShut) return peekOut(); if (!looping || enter) return; const side = how === 'demo' ? 'watch' : 'play'; enter = { t0: now(), how, side, phase: 'walk', t1: 0, done: false }; (side === 'watch' ? door2 : door).want = 1; walk.dir = 0; walk.to = null; walk.use = -1; walk.ducking = false; spud.duck(false);
      sfx.pop && sfx.pop(); S.onFace && S.onFace('smirk', 1.2); },
    poke() { fx.amount = 0.9; lastGl = now(); },
    rect() { const v = new T.Vector3(); let x0 = 1, y0 = 1, x1 = 0, y1 = 0; const px = pivot.position.x, py = pivot.position.y, s = pivot.scale.x;
      for (const [x, y] of [[px - 0.9 * s, py - 0.2], [px + 0.9 * s, py - 0.2], [px - 0.9 * s, py + 1.7 * s], [px + 0.9 * s, py + 1.7 * s]]) { v.set(x, y, 0).project(cam); const u = v.x * 0.5 + 0.5, w = v.y * 0.5 + 0.5; x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, w); y1 = Math.max(y1, w); }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; } };

  function dress(slug, now_) { if (!slug) { spud.wear(null); return; } loadOutfit(slug).then(b => { if (looping && STYLES[cur].outfit === slug && !flk) spud.wear(b); }).catch(() => {}); if (now_) spud.wear(null); }
  function startKitchen() { if (looping) return; looping = true; last = now(); raf = requestAnimationFrame(tick); }
  function stopKitchen() { looping = false; cancelAnimationFrame(raf); tr = null; flk = null; enter = null; }
  // the music's beat phase (beats), or null when there's no loop playing for this room's song. The audio clock only updates in
  // steps: a wall clock runs between them and is pulled onto it (snapped on a jump: the loop wrapping, a seek)
  function musicBeat(dt) { const st = STYLES[cur], gb = gameBeat(st.level), a = instAudio;
    if (!gb || !a || a.paused || !(a.src || '').includes(st.level + '.inst.mp3')) { groove.est = -1; return null; }
    const at = a.currentTime; if (groove.est < 0 || Math.abs(at - groove.est) > 0.12) groove.est = at; else groove.est += dt + (at - groove.est) * 0.08;
    return groove.est / gb; }
  function stepDance(T0, dt) {
    const st = STYLES[cur], disco = st.id === 'disco-legend';
    groove.beat = disco ? musicBeat(dt) : null;
    const party = disco && P.ball && P.ball.on && !enter && !tr && !flk;
    if (party) { const b = groove.beat != null ? groove.beat : T0 / 0.62;   // (no music: the song's own tempo off the wall clock)
      groove.on = true; AO.t = T0; AO.dance = DANCE_SET[Math.floor(b / 8) % DANCE_SET.length]; AO.beat = b; AO.body = groove.opt.body; AO.off = false; ARMS.update(AO); }
    else { groove.on = false; AO.t = T0; AO.dance = null; AO.air = phys.air; AO.vy = phys.vy; AO.vy0 = JUMP_V * Math.sqrt(st.grav || 1); AO.off = !!enter; ARMS.update(AO); } }   // (one reused options object)   // (no party: arms only in the air / spinning)
  function stopDance(now_) { groove.on = false; ARMS.reset(now_); }
  const me = { x: 0, y: 707, on: null }, po = { open: 0, open2: 0, num: 0, name: '', nameAt: 0, cleared: false, P: null, me, near: -1 };   // (reused every paint: no garbage per frame)
  // the rooms bleed: a glitch leaves a torn strip of the last room in this one; it jumps about, blinks out and heals over 6 s
  const scars = []; let scarsOff = false;
  S_bleed = on => { scarsOff = !on; };
  function addScar(from) { if (scarsOff) return; const n = 5 + Math.floor(Math.random() * 3); for (let q = 0; q < n; q++) { const w = 160 + Math.random() * 380, band = (q + Math.random()) / n; scars.push({ from, t0: now() + 0.3 + Math.random() * 0.5, y: 40 + band * 760, h: 28 + Math.random() * 64, x: Math.random() * (1600 - w), w, s: Math.floor(Math.random() * 1000), life: 3.5 + Math.random() * 3 }); } while (scars.length > 16) scars.shift(); }
  const PURP = ['#7b3cf2', '#9a52ff', '#e03ccf', '#c9a7ff', '#2a0f63'];
  function drawScars(T0) { cx.save(); cx.font = '400 15px "Major Mono Display", monospace'; cx.textBaseline = 'top'; for (let i = scars.length - 1; i >= 0; i--) { const c = scars[i]; if (T0 < c.t0) continue; const f0 = Math.floor((T0 - c.t0) * 12), age = (T0 - c.t0) / c.life; if (age >= 1) { scars.splice(i, 1); continue; }
      const h = c.h * (1 - age * 0.5), y0 = c.y + (c.h - h) / 2, w = c.w * (1 - age * 0.3), n = 3 + (c.s % 3), sh = h / n, fade = 1 - age * age; for (let q = 0, y = y0; q < n; q++, y += sh) { if (rnd(f0, q + c.s) < 0.08 + age * 0.45) continue; const hit = rnd(f0 + 3, q * 7 + c.s) > 0.7, dx = hit ? (rnd(f0, q + 40) - 0.5) * 120 : (rnd(f0 >> 2, q + 9) - 0.5) * 14; cx.globalAlpha = fade; cx.drawImage(c.from, c.x, y, w, sh, c.x + dx, y, w, sh);
        // the edge eats away in his glitch: chunky purple blocks and his binary, more of them as it fades
        const blocks = 8 + Math.floor(age * 22); for (let b = 0; b < blocks; b++) { const r = rnd(f0 + b, q + c.s + 11), side = b % 2, bw = 6 + rnd(b, f0) * 34, bh = 3 + rnd(f0, b + 5) * sh * 0.8, bx = side ? c.x + dx + w - bw * (0.5 + r) : c.x + dx - bw * (0.5 - r), by = y + rnd(b + 3, f0 + q) * (sh - bh); cx.globalAlpha = fade * (0.55 + 0.45 * r); cx.fillStyle = PURP[(b + f0) % PURP.length]; cx.fillRect(bx, by, bw, bh); }
        for (let b = 0; b < 3; b++) { const tx = c.x + dx + rnd(f0, b + q) * w; cx.globalAlpha = fade * 0.9; cx.fillStyle = PURP[b + 1]; cx.fillRect(tx, y, 10 + rnd(b, f0 + q) * 46, 2); }
        if (rnd(f0, q + 77) > 0.5) { cx.globalAlpha = fade * 0.85; cx.fillStyle = '#c9a7ff'; cx.fillText(rnd(f0, q) > 0.5 ? '0110' : '1001', c.x + dx + (rnd(f0 + 1, q) > 0.5 ? -46 : w + 4), y + 1); } } } cx.restore(); }
  function paintStyle(T0) { cx.clearRect(0, 0, 1600, 900); const sg = songs[cur] || {};
    me.x = rawX(); me.y = rawY(phys.y); me.on = phys.on >= 0 && props()[phys.on] ? props()[phys.on].id : null;
    po.beat = groove.beat; po.open = door.open; po.open2 = door2.open; po.num = sg.n; po.name = sg.title; po.nameAt = nameAt; po.cleared = sg.cleared; po.P = P; po.near = enter || tr ? -1 : near;
    STYLES[cur].paint(cx, T0, litK, po);
    if (tr) { const k = (T0 - tr.t0) / 0.35, f = Math.floor((T0 - tr.t0) * 24); let y = 0, j = 0;   // the old room in torn slices, sliding off, light/dark seams
      while (y < 900) { const h = 18 + rnd(j, tr.seed) * 70; if (rnd(j, tr.seed + 7) > k) { const dx = (rnd(f, j + tr.seed) - 0.5) * 360 * (0.25 + k);
        cx.drawImage(tr.from, 0, y, 1600, h, dx, y, 1600, h); cx.fillStyle = j % 2 ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';   /* plain light/dark seams: purple is his glitch only */ cx.fillRect(dx, y, 1600, 3); cx.fillRect(dx, y + h - 3, 1600, 3);
        cx.fillStyle = 'rgba(18,10,5,.45)'; cx.fillRect(dx + (dx > 0 ? -14 : 1600), y, 14, h); } y += h; j++; }   // (the torn edge: ink)
      for (let q = 0; q < 3; q++) { cx.fillStyle = q % 2 ? 'rgba(255,255,255,.7)' : 'rgba(18,10,5,.7)'; cx.fillRect(0, rnd(f, q + 90) * 900, 1600, 2 + rnd(f, q + 91) * 6); } }   // (scan lines: white + ink, never purple)
    drawScars(T0); tex.needsUpdate = true; }
  function tick() { if (!looping) return; raf = requestAnimationFrame(tick); const T0 = now(), dt = Math.min(0.05, T0 - last); last = T0;
    if (tr && T0 - tr.t0 >= 0.35) tr = null;
    if (flk) { const i = Math.min(flk.bs.length - 1, Math.floor((T0 - flk.t0) / 0.11)); if (i !== flk.k) { flk.k = i; spud.wear(flk.bs[i] || null); fx.amount = 0.9; if (i === flk.bs.length - 1) { sfx.transform && sfx.transform(); flk = null; } else sfx.glitch && sfx.glitch(); } }
    for (const dd of [door, door2]) { dd.open += (dd.want - dd.open) * Math.min(1, dt * (dd.want > dd.open ? 9 : 5)); if (Math.abs(dd.want - dd.open) < 0.002) dd.open = dd.want; }
    if (enter) { stepY(dt, rawX(), T0, true); stepEnter(T0, dt); }
    else {   // walking: ← / → (held), or a click / tap / drag
      let d = walk.dir;
      if (!d && walk.to != null) { const gap = walk.to - pivot.position.x; if (Math.abs(gap) < 0.06) { walk.to = null; if (walk.door) S.enterDoor(walk.door === 'watch' ? 'demo' : 'play');
          else if (walk.use >= 0) { const i = walk.use, p = props()[i]; walk.use = -1; if (p && walk.hop && phys.on !== i) { if (jump()) { sfx.jump && sfx.jump(); } } else if (p) { ps[i].tap = T0; fire(i, 'use'); faceDir = toward(p, rawX()); } } }   // got there: use it (turned to it) / hop up
        else d = Math.sign(gap); }
      if (walk.then && !phys.air && (walk.then.up ? upNow() : phys.on < 0 && phys.y <= 0.001)) { const th = walk.then; walk.then = null; if (th.use != null) goUse(th.use, rawX()); else { walk.to = Math.max(lo(), Math.min(hi(), worldOfRaw(th.x))); walk.use = -1; } }   // (the stairs route: next leg)
      if (walk.hopAt && T0 >= walk.hopAt) { walk.hopAt = 0; const c = walk.chain; walk.chain = -1; if (c >= 0 && standOK(c, rawX(), T0) && jump()) sfx.jump && sfx.jump(); }   // (table -> counter: the second hop)
      if (walk.dir > 0 && !phys.air && phys.on < 0 && phys.y <= 0.001) { const si = stairsI(), sp = props()[si], X = rawX();   // (→ held into the foot of the stairs: he walks up them, the way anyone would; taps keep their own route)
        if (sp && X >= sp.x0 && X < sp.x0 + 30) { phys.on = si; ps[si].top = null; } }
      if (d && !walk.ducking && !enter) { pivot.position.x = Math.max(lo() - 0.02, Math.min(hi(), pivot.position.x + d * SPEED * dt)); if (moving !== d) { moving = d; spud.waddle(true); turnAt(d * 0.95); }
        if (pivot.position.x <= lo() && d < 0) S.enterDoor('play');                // walked into the door: through it
        else if (pivot.position.x >= hi() && d > 0) { if (walk.dir > 0) S.enterDoor('demo'); else if (!walk.door) walk.to = null; } }   // walked (→ held) into the watch door: through it
      else if (moving) { moving = false; spud.waddle(false); turnAt(faceDir ? faceDir * 0.6 : 0.32); }   // stops: back to the side-eye (or turned to the thing he just used)
      if (!enter) { door.want = !tr && pivot.position.x - lo() < 0.9 && !S.leftShut ? 0.16 : 0; stepPeek(T0); door2.want = S.rightOpen && !tr ? (hi() - pivot.position.x < 0.9 ? 0.7 : 0.3) : 0; }   // near one, that door comes ajar: a sliver of the song's light (the way in, no sign needed)
      if (!enter) { const X = rawX(); stepY(dt, X, T0, false); stepProps(T0, X, walk.ducking ? 0 : d); }
    }
    stepDance(T0, dt);
    fx.amount = Math.max(0, fx.amount - dt * 2.4); if (tr || flk || fx.amount > 0) lastGl = T0;
    if (S.noPaint) { } else if (LITE ? T0 - lastPaint > (tr || enter ? 1 / 30 : 1 / 12) : tr || enter || door.open !== door.want || door2.open !== door2.want || T0 - nameAt < 1.2 || T0 < busyTo || live || phys.air || T0 - lastPaint > 1 / 24) { lastPaint = T0; paintStyle(T0); }   // (every frame while something's moving)
    drawFront(); }
  // through the door: he waddles to it as it opens, turns his back to us and walks into the light, which takes the screen
  const doorOf = e => e.side === 'watch' ? [WDOOR, door2] : [DOOR, door];
  function stepEnter(T0, dt) { const e = enter, [G, dd] = doorOf(e);
    if (e.phase === 'walk') { const gap = doorX(G) - pivot.position.x;
      if (Math.abs(gap) > 0.05) { if (moving !== -2) { moving = -2; spud.waddle(true); turnAt(Math.sign(gap) * 0.95); } pivot.position.x += Math.sign(gap) * Math.min(Math.abs(gap), SPEED * 0.85 * dt); }
      if (Math.abs(doorX(G) - pivot.position.x) <= 0.05 && dd.open > 0.85 && !phys.air && phys.y <= 0) { e.phase = 'in'; e.t1 = T0; turnAt(-Math.PI); spud.waddle(true); sfx.transform && sfx.transform(); } }
    else { const k = (T0 - e.t1) / 0.9, u = ease(k);
      pivot.scale.setScalar(1 - 0.32 * u); pivot.position.y = (wy(G.y1) - 0.06) * u;
      white = Math.max(0, (k - 0.55) / 0.45);
      if (k >= 1.12 && !e.done) { e.done = true; white = 1; moving = false; const how = e.how; S.onEnter && S.onEnter(how); } } }
  function drawFront() {
    fx2.clearRect(0, 0, 960, 540); const e = enter, [G, dd] = e ? doorOf(e) : [DOOR, door];
    if (e && dd.open > 0) {   // the song's light, washing out of the doorway and over him
      const [ax, ay] = toFg(doorX(G), wy((G.y0 + G.y1) / 2)), [, by] = toFg(0, wy(G.y0)), r = Math.abs(ay - by) * 1.6;
      const k = e.phase === 'in' ? ease((now() - e.t1) / 0.9) : 0, col = ((e.side === 'watch' && STYLES[cur].door2) || STYLES[cur].door).light;
      const g = fx2.createRadialGradient(ax, ay, 4, ax, ay, r * (0.6 + 0.9 * k)); g.addColorStop(0, `rgba(255,255,255,${0.15 + 0.7 * k})`); g.addColorStop(0.5, hexA(col, 0.12 + 0.4 * k)); g.addColorStop(1, hexA(col, 0));
      fx2.fillStyle = g; fx2.fillRect(0, 0, 960, 540); }
    if (white > 0) { fx2.fillStyle = `rgba(255,250,238,${Math.min(1, white)})`; fx2.fillRect(0, 0, 960, 540); } }
  const hexA = (c, a) => `rgba(${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)},${a})`;
  S.dressOnly = slug => { fx.amount = 0.9; lastGl = now(); sfx.glitch && sfx.glitch(); if (!slug) { spud.wear(null); return Promise.resolve(); } return loadOutfit(slug).then(b => spud.wear(b)).catch(() => {}); };
  S.spinBy = d => { spinOff += Math.PI * 2 * d; spud.turnBy(Math.PI * 2 * d); };
  return S;
}

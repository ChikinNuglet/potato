// modes/ghost-runner.mjs — Level 6 as a TRUE RUNNER (?ghost=runner; pass 2, team Read Receipts, Nov 5). Not the default Ghost until
// Chikin says so. The plan: levels/ghost-runner/PLAN-v3.md · the rules + numbers: DESIGN-v3.md · the chat (the level AND the movie):
// SCRIPT.md · the course: course-v3.json (made by course-gen-v3.mjs from SCRIPT.md; never hand-edited) · jokes: JOKES-v2.md.
// Pass 1's mode (← → walking, Space meaning four things) is kept in levels/ghost-runner/round2-build/.
//
// THE RULES (pure, 120 Hz; the bot and fair.mjs run this same code). World units W (Potato is 1.25 W tall).
//  · He RUNS RIGHT BY HIMSELF with the song (5.77 W/s: one beat = 3.53 W). ← → do nothing. ↑ jump · ↓ duck · Space = glitch.
//  · His MARK is where the song is (course knots). Anything that stops him leaves him behind (lag); while behind he runs 1.35× until
//    he's back on it. Lag is the only clock: the camera stays on the mark, so being late shows as him drifting left.
//  · HUGE phones, docked edge to edge, one chat on screen: the phone he's in shows the live thread, the one ahead is asleep (its owner's
//    lock screen + ONE banner: the newest text, the one he'll ride in), the one behind gets put down. Texts are one-way platforms; the
//    stack rises like a real chat (the newest text lands at the bottom and he steps down onto it). The input bar is a floor.
//  · SPACE (one rule): he goes purple for 0.45 s. While purple the glass between two phones, BLOCKED and falling texts pass through
//    him, and a blue text with his crawl on it (James's, not Read yet) that he's standing on becomes his (the rewrite). One charge:
//    it comes back when he lands from the air, when a rewrite lands (he eats James's text), or after 1.5 beats on the ground. A spent
//    press does nothing (a grey fizz; mashing restarts the 1.5-beat clock). His rim shows it: bright purple charged, dim lilac spent.
//    Anything shaking loose above him (a falling text, BLOCKED) gives him the charge for it 0.55 s before it falls (his rim lights).
//  · THE DOOR: every phone's last text is its owner's, going out. Space as he reaches the wall = he rides it out: it's rewritten (if
//    it's James's) AND he's through, and in the next phone the same text is the floor he lands on.
//  · Only two ways to die (both squished): stuck too long, so the owner puts the phone down on him (its lock screen slides down 1 beat
//    after the song has left it, over 1.5 beats) · a falling text / BLOCKED lands on him while he isn't purple.
//    What only costs time: a wall without a glitch (held at the glass), typing dots not jumped (a stumble), a badge / sag / thrown text
//    not ducked (knocked back). GRACE to 21.03: a wall pops him through after half a beat, nothing squishes. After a retry: 2.6 s safe.
//  · Set pieces: the tip (41.84, James drops his phone on the sofa: he's carried, the screen auto-rotates and shoves him), two tippers
//    (a phone hanging on a charger cable: Space at the wall on the word snaps it = GOOD; too early or never = it falls by itself, cracked,
//    and he's late), the bus cascade (four phones going down), BLOCKED ×2, the dog phone that becomes Petunia, the ending.
import * as G0 from './ghost-in-the-group-chat.mjs';
import { drawShimmer } from './ghost-water.mjs';
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare
const { SC } = G0;
const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const ease5 = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
const easeIn = x => { x = Math.max(0, Math.min(1, x)); return x * x; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mod = (a, n) => ((a % n) + n) % n;
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ======== numbers (W, s) ========
export const R = { WAKE: 7.88, CTL: 8.9, HT: 1.25, HTD: 0.6, HW: 0.36, GRAV: 35.2, V0: 11.0, FALL: 16, COY: 0.09, BUF: 0.12, DUCK: 0.55, PHASE: 0.45,
  CATCH: 1.35, SLOW: 0.8, SAFE: 2.6, FAILT: 0.6, DARK: 113.17, KICK: 2.4, FOOT: 0.18, STUMBLE: 0.25, KNOCK: 1.0, KNOCKT: 0.15, VH: 13.6, PRESS: 0.08 };

// ======== the course, prepared once ========
const PREPR = new WeakMap();
export function prepR(C) {
  if (PREPR.has(C)) return PREPR.get(C);
  const D = C.def.runner, co = D.course, P = co.P;
  const ph = co.phones.map(p => ({ ...p })), plats = co.plats.map(q => ({ ...q })), hz = co.hazards.map((h, i) => ({ ...h, i }));
  const X0 = SC[0] - ph[0].w / 2, Y0 = SC[1] - ph[0].h / 2;      // phone #0 sits exactly where the current Ghost's phone is (the opening hands over)
  for (const p of ph) { p.plats = p.plats.map(i => plats[i]); p.wx0 = X0 + p.x0; p.wx1 = X0 + p.x1; p.wyb = Y0 + p.yb; }
  const groups = new Map(); for (const q of plats) if (q.group != null && !q.copy && !q.ctx) { if (!groups.has(q.group)) groups.set(q.group, []); groups.get(q.group).push(q); }
  const tipA = ph.find(p => p.special.tipA), tipB = ph.find(p => p.special.tipB), tippers = ph.filter(p => p.special.tipper), last = ph[ph.length - 1];
  const markF = t => { const K = co.knots; if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const [a, ua] = K[i - 1], [b, ub] = K[i]; return ua + (ub - ua) * (t - a) / (b - a); } return K[K.length - 1][1]; };
  const out = { C, D, co, P, ph, plats, hz, X0, Y0, groups, tipA, tipB, tippers, last, mark: t => X0 + markF(t), quiet: co.quiet, beat: P };
  PREPR.set(C, out); return out;
}

// ======== a phone at t: where it is and what it's doing (pure in t and s.tp — the tippers' outcomes) ========
// dx, dy: offset from its docked place · present · awake (showing the chat) · lock 0…1 (its lock screen sliding down) · dark · hang /
// falling (a tipper) · ang + pivot (the tip's swing) · wob
export function pose(RP, p, t, s) {
  const B = RP.beat, o = { p, dx: 0, dy: 0, present: true, awake: false, asleep: false, lock: 0, dark: 0, hang: false, falling: false, crack: false, ang: 0, wob: 0, docked: true };
  if (p.special.tipB && t < p.special.tipB.land) o.present = false;            // (the lying phone is the upright one, fallen over: drawn as A until it lands)
  if (p.special.tipA) { const T = p.special.tipA;
    if (t >= T.warn && t < T.t) o.wob = Math.sin(Math.PI * (t - T.warn) / (0.5 * B)) * 0.06 * clamp((t - T.warn) / 0.15);
    if (t >= T.t) { o.ang = -Math.PI / 2 * easeIn((t - T.t) / (T.land - T.t)); o.pivot = [RP.X0 + T.pivot, p.wyb]; if (t >= T.land) o.present = false; } }
  if (p.special.tipper) { const T = p.special.tipper, st = s && s.tp && s.tp[p.id];
    if (t < p.tArrive) o.present = false;
    else if (!st || t < st.t0) { const k1 = ease5((t - p.tArrive) / B); o.dy = 6.5 + 5 * (1 - k1); o.hang = true; o.docked = false; o.wob = 0.06 * Math.sin(Math.PI * (t - RP.co.OFF) / B); }
    else { const k = clamp((t - st.t0) / T.fall); if (k < 1) { o.dy = 6.5 * (1 - easeIn(k)); o.falling = true; o.docked = false; o.wob = 0.06 * Math.sin(Math.PI * (t - RP.co.OFF) / B) * (1 - k); }
      else { o.landed = t - st.t0 - T.fall; if (!st.good) o.crack = true; } } }
  else if (p.tArrive != null && p.id > 0 && !p.special.tipB) {
    if (t < p.tArrive) o.present = false;
    else if (t < p.tDock) { const k = ease5((t - p.tArrive) / Math.max(0.05, p.tDock - p.tArrive)); o.dx = 5 * (1 - k); o.dy = -1.5 * (1 - k); o.docked = false; } }
  o.awake = o.present && o.docked && t >= p.tWake && !o.hang && !o.falling;
  o.asleep = o.present && !o.awake && (p.tLock0 == null || t < p.tLock0);
  if (p.special.dog && !(s && s.dogAt != null)) { o.awake = false; o.asleep = o.present; }
  if (p.tLock0 != null && t >= p.tLock0) { o.lock = easeIn((t - p.tLock0) / (p.tLock1 - p.tLock0)); if (t >= p.tLock1) { o.dark = 1; o.awake = false; }
    if (t >= p.tLock1 + 2 * B) { const k = ease((t - p.tLock1 - 2 * B) / (2 * B)); o.dx -= 3 * k; o.dy -= 7 * k; if (k >= 1) o.present = false; } }
  if (t >= R.DARK && p !== RP.last) { o.dark = Math.max(o.dark, clamp((t - R.DARK) / 0.2)); o.dy -= 2 * ease((t - R.DARK) / (2 * B)); o.awake = false; o.off = true; }
  o.x0 = p.wx0 + o.dx; o.x1 = p.wx1 + o.dx; o.yb = p.wyb + o.dy; o.yt = o.yb + p.h;
  if (p.special.tipA) o.x1 = o.x0 + p.w;
  return o;
}
// a text in phone p at t: its box in the world (null = not there yet); x from the course, y = the phone's bottom + where the rising stack has it
export function platBox(RP, q, o, t) {
  if (q.t > t + 1e-9) return null;
  let y = q.y0; for (const [lt, dy] of q.lifts) if (t >= lt) y += dy * ease((t - lt) / 0.15);
  const pop = q.t < 0 ? 1 : ease((t - q.t) / 0.12);
  return { x0: RP.X0 + q.xa + o.dx, x1: RP.X0 + q.xb + o.dx, y0: o.yb + y, y1: o.yb + y + q.h, pop };
}
const barTop = (o) => o.yb + RP_BAR;
let RP_BAR = 0.95;
// is the text his (rewritten) / Read (gone out as James typed it)?
const isMine = (s, q) => q.group != null && s.rew && s.rew[q.group] != null;
const isRead = (s, q, t) => q.group != null && s.readT && s.readT[q.group] != null && t >= s.readT[q.group];

// ======== the rules ========
export const mode = {
  init(s, api) {
    G0.mode.init(s, api);
    s.jlog = s.jlog || []; if (s.t >= R.WAKE) startRunner(s, s.t, api);
  },
  step(s, inp, t, api) {
    if (t < R.WAKE) { G0.mode.step(s, inp, t, api); return; }
    const C = api.C, RP = prepR(C), B = RP.beat, co = RP.co;
    if (!s.rOn) startRunner(s, t, api);
    const log = (k, ex) => s.jlog.push({ t, k, ...ex });
    const die = why => { if (!s.dead) api.die(why); if (!s.dead) { s.dead = true; s.why = why; } };
    RP_BAR = co.BAR_H;
    if (s.failT != null) { s.walking = false; if (t >= s.failT + R.FAILT) { s.gone = true; return die(s.why0 || 'lock'); } return; }
    // ---- 7.88 → the run's start: the camera pulls back, he glides onto James's phone and reads the porch-light line ----
    if (t < co.runStart) { const p0 = RP.ph[0], o0 = pose(RP, p0, t, s), base = p0.plats.filter(q => q.solid).map(q => platBox(RP, q, o0, t)).find(b => b);
      const tx = RP.mark(co.runStart) + 0.55, ty = base ? base.y1 : o0.yb + 2, k = ease5((t - R.WAKE) / (R.CTL - R.WAKE));
      const g = s.glide || (s.glide = { x: s.x, y: s.y }); s.x = g.x + (tx - g.x) * k; s.y = g.y + (ty - g.y) * k + Math.sin(k * Math.PI) * 1.0;
      s.ground = t >= R.CTL; s.on = base && s.ground ? p0.plats.find(q => q.solid).id : null; s.ph = 0; s.vy = 0; s.walking = false; s.facing = 0.4; s.phase = 0; s.ducking = false; return; }
    // ---- the tippers fall by themselves on their word + half a beat (WRONG) ----
    for (const T of RP.tippers) if (!s.tp[T.id] && t >= T.special.tipper.autoAt) { s.tp[T.id] = { t0: T.special.tipper.autoAt, good: false }; log('tipper' + (T === RP.tippers[0] ? 1 : 2), { good: false, auto: true }); }
    let ph = RP.ph[s.ph], o = pose(RP, ph, t, s);
    const ending = t >= R.DARK;
    if (ending && ph !== RP.last) { const L = RP.last, Lo = pose(RP, L, t, s); s.ph = L.id; ph = L; o = Lo; s.x = Math.max(Lo.x0 + 0.6, Math.min(s.x, Lo.x0 + L.w / 2)); s.ground = false; s.vy = 0; s.blink = 0.22; log('endpull'); }
    // ---- carried: James drops his phone (the tip) with him inside — rigid, nothing touches him, keys ignored ----
    if (RP.tipA && s.ph === RP.tipA.id && t >= RP.tipA.special.tipA.t) {
      const T = RP.tipA.special.tipA, pv = [RP.X0 + T.pivot, RP.tipA.wyb];
      if (!s.carry) { s.carry = { lx: s.x - pv[0], ly: s.y - pv[1] }; s.ground = false; s.on = null; s.vy = 0; s.react = { name: 'startled', dur: 0.6, at: t }; log('carry'); }
      if (t < T.release) { const a = Math.PI / 2 * easeIn((t - T.t) / (T.land - T.t)), c = Math.cos(-a), sn = Math.sin(-a), lx = s.carry.lx, ly = s.carry.ly + 0.5;
        s.x = pv[0] + lx * c - ly * sn; s.y = pv[1] + lx * sn + ly * c - 0.5; s.walking = false; s.phase = 0; s.ducking = false; return; }
      // the auto-rotate's shove: out of the turned screen into the lying phone, a little up and on
      s.ph = RP.tipB.id; ph = RP.tipB; o = pose(RP, ph, t, s); s.carry = null; s.vy = 5.5; s.ground = false; s.on = null; s.x = Math.max(o.x0 + 0.6, Math.min(s.x, o.x0 + 3)); s.y = Math.max(s.y, o.yb + 2.2);
      s.shoveAt = t; s.react = { name: 'shock', dur: 0.3, at: t }; if (!s.rotN) { s.rotN = 1; log('rotate1'); } log('shove'); }
    const safe = t < co.grace || t < (s.safeUntil ?? -9) || ending;
    const purple = () => t < s.phaseUntil;
    // ---- keys: ↑ jump (buffered, coyote) · ↓ duck · Space = purple ----
    if (inp.J) s.jumpBuf = t;
    if (inp.D || (inp.Dh && t < s.duckUntil + 1 / 60)) s.duckUntil = Math.max(s.duckUntil, t + (inp.D ? R.DUCK : 1 / 60));   // (↓ tucks him for 0.55 s, longer while held; in the air too)
    if (inp.G && !s.gone && !ending) {
      if (s.charge) { s.charge = false; s.useT = t; s.phaseUntil = t + R.PHASE; s.glitchAt = t; log('glitch'); }
      else { s.fizzAt = t; s.useT = t; log('fizzle'); } }   // (a spent press does nothing, and mashing keeps him empty: the 1.5-beat clock starts again)
    if (s.jumpBuf != null && t - s.jumpBuf <= R.BUF && (s.ground || t - s.coyT < R.COY) && !ending) { s.vy = R.V0; s.ground = false; s.on = null; s.jumpBuf = null; s.coyT = -9; s.jumpedAt = t; s.duckUntil = 0; log('jump'); }
    s.ducking = t < s.duckUntil;
    // ---- the run: on his mark at V, behind it 1.35 V, ahead of it 0.8 V; stopped by a stumble, a knock, or the glass ----
    const mk = RP.mark(t), lag = mk - s.x;
    let v = lag > 0.02 ? co.V * R.CATCH : lag < -0.3 ? co.V * R.SLOW : co.V;
    if (t < s.stumbleUntil) v = 0;
    if (ending) { const cx = o.x0 + ph.w / 2; if (s.x >= cx - 0.05) { v = 0; s.stopped = true; } }
    let nx = s.x + v / 120;
    // the glass: his front at the right wall of the phone he's in
    const nb = RP.ph[s.ph + 1], wallX = o.x1;
    if (nx + R.HW > wallX && !(ending)) {
      const no = nb ? pose(RP, nb, t, s) : null, open = no && no.present && no.docked && !ph.special.tipA && !nb.special.tipB;
      let pass = open && purple();
      if (!pass && open && t < co.grace) { if (s.heldAt == null) s.heldAt = t; if (t - s.heldAt >= 0.5 * B) { pass = true; s.phaseUntil = Math.max(s.phaseUntil, t + 0.2); log('pop'); } }
      // the tippers: Space at the wall on the word snaps the cable (GOOD); the phone drops into place and he's through as it docks
      if (!pass && nb && nb.special.tipper && !s.tp[nb.id] && purple() && s.glitchAt != null && t - s.glitchAt < R.PHASE) { const T = nb.special.tipper;
        if (s.glitchAt >= T.good[0]) { s.tp[nb.id] = { t0: t, good: true }; s.snapAt = t; s.phaseUntil = t + T.fall + 0.15; log('tipper' + (nb === RP.tippers[0] ? 1 : 2), { good: true }); s.react = { name: 'smirk', dur: 0.6, at: t }; } }
      if (pass) cross(RP, s, t, nb, log);
      else { nx = wallX - R.HW; if (s.heldAt == null) s.heldAt = t; s.atWall = t; }
    } else s.heldAt = null;
    if (s.ph !== ph.id) { ph = RP.ph[s.ph]; o = pose(RP, ph, t, s); }
    s.x = Math.max(o.x0 + 0.3, nx);
    // ---- up and down: ride the text he's on (it rises with the chat), fall, land on a text from above, the bar's kick ----
    const boxes = new Map(); for (const q of ph.plats) { if (!q.solid) continue; const b = platBox(RP, q, o, t); if (b) boxes.set(q.id, b); }
    if (s.ground && s.on != null) { const b = boxes.get(s.on); if (b && s.x >= b.x0 - R.FOOT && s.x <= b.x1 + R.FOOT) s.y = b.y1; else { s.ground = false; s.on = null; s.coyT = t; s.airFrom = t; } }
    else if (s.ground && s.on == null) { const by = barTop(o); s.y = by; }
    if (!s.ground) {
      const py = s.y; s.vy = Math.max(-R.FALL, s.vy - R.GRAV / 120); s.y += s.vy / 120;
      let land = null; for (const [id, b] of boxes) { if (s.x < b.x0 - R.FOOT || s.x > b.x1 + R.FOOT) continue; const pt = (s.prevTop && s.prevTop[id]) ?? b.y1; if (s.vy <= 0 && py >= pt - 0.03 && s.y <= b.y1 && (!land || b.y1 > land.b.y1)) land = { id, b }; }
      if (land) { s.y = land.b.y1; s.vy = 0; s.ground = true; s.on = land.id; s.landAt = t; if (!s.charge && t - (s.airFrom ?? t) >= 0.3) { s.charge = true; log('charge', { how: 'land' }); } }
      else if (s.y <= barTop(o)) { s.y = barTop(o); s.vy = Math.sqrt(2 * R.GRAV * R.KICK); s.barAt = t; s.react = { name: 'wide', dur: 0.4, at: t }; log('bar'); } }
    if (!s.ground && s.airFrom == null) s.airFrom = t; if (s.ground) s.airFrom = null;
    s.prevTop = {}; for (const [id, b] of boxes) s.prevTop[id] = b.y1;
    if (!s.charge && s.ground && t - s.useT >= 1.5 * B) { s.charge = true; log('charge', { how: 'ground' }); }
    // ---- his glitch on James's text (the rewrite) ----
    if (purple() && s.ground && s.on != null) { const q = RP.plats[s.on]; if (q.target && !isMine(s, q) && !isRead(s, q, t)) rewrite(RP, s, t, q.group, log); }
    // ---- Read: a blue text he's left goes Read half a beat later (it goes out as James typed it) ----
    for (const [g, qs] of RP.groups) { if (s.rew[g] != null || s.readT[g] != null) continue; const xb = Math.max(...qs.map(q => RP.X0 + q.xb)), p = RP.ph[qs[0].ph];
      if (s.x > xb + 0.2 || s.ph > p.id || RP.mark(t) > xb + RP.co.BW) { s.readT[g] = t + 0.5 * B; log('read', { g }); } }
    // ---- what's on his path ----
    hazards(RP, s, t, o, boxes, safe, log);
    // ---- the owner puts the phone down: its lock screen slides down; if it reaches his head he's squished ----
    if (o.lock > 0 && !o.off && s.failT == null && !s.gone) { const sy = o.yt - (o.yt - barTop(o)) * o.lock, head = s.y + (s.ducking ? R.HTD : R.HT);
      if (o.lock >= 0.4 && !(s.react && s.react.name === 'wide' && t - s.react.at < 0.3)) s.react = { name: 'wide', dur: 0.35, at: t };
      if (sy < head) { if (safe) popNext(RP, s, t, log); else squish(s, t, 'lock', log); } }
    // ---- the ending: he stops at the last phone's centre; the slider; he leaps out at us ----
    const end = C.def.phone.end || {};
    s.cutscene = end.see != null && t >= end.see && !s.gone ? 'see' : false;
    if (end.leap != null && t >= end.leap && !s.gone) { if (!s.leapFrom) s.leapFrom = { x: s.x, y: s.y }; const k = ease5((t - end.leap) / Math.max(0.05, end.out - end.leap)); s.y = s.leapFrom.y + 1.2 * k; s.ground = true; s.vy = 0; s.facing = 0; }
    if (end.out != null && t >= end.out && !s.gone) { s.gone = true; s.goneAt = t; s.goneFrom = { x: s.x, y: s.y }; }
    s.walking = s.ground && v > 0.5 && !s.ducking; s.facing = s.stopped ? s.facing * 0.97 + 0.3 * 0.03 : 1;
    s.phase = s.gone ? 0 : purple() ? 0.6 : 0;
    s.charged = !!s.charge; s.lag = RP.mark(t) - s.x;
  },
};
function rewrite(RP, s, t, g, log) {
  s.rew[g] = t; s.glitched = (s.glitched || 0) + 1; s.rewT = t; s.charge = true; s.score = (s.score || 0) + 100;
  s.react = { name: ['smirk', 'laugh', 'smirk', 'wide'][g % 4], dur: 0.6, at: t }; log('rewrite', { g });
}
function cross(RP, s, t, nb, log) {
  const from = { x: s.x, y: s.y }; s.ph = nb.id; s.heldAt = null; s.doorAt = t; s.doorFrom = from; s.blink = 0.18; s.blinkFrom = from; s.glitchAt = t;
  s.x = Math.max(s.x, RP.X0 + nb.x0 + 0.05);
  if (!s.doors) { s.doors = 0; log('door1'); } s.doors++; log('door', { to: nb.id });
  if (nb.owner === 'E' && !s.jessN) { s.jessN = 1; log('jess'); }
  if (nb.special.dog && s.dogAt == null) { s.dogAt = t; s.dogY = s.y; log('dog'); }
  const o = pose(RP, nb, t, s); if (s.y < o.yb + 0.95) s.y = o.yb + 0.95;
  s.ground = false; s.on = null; s.airFrom = t; s.vy = Math.min(s.vy, 0);
}
function popNext(RP, s, t, log) {   // grace / after a retry: the lock just pops him into the next phone (a free glitch)
  const nb = RP.ph[s.ph + 1]; if (!nb) return; const o = pose(RP, nb, t, s); if (!o.present) return;
  cross(RP, s, t, nb, log); s.x = Math.max(s.x, o.x0 + 0.6); s.safeUntil = Math.max(s.safeUntil ?? -9, t + 0.6); log('pop');
}
function squish(s, t, why, log) { if (s.failT != null) return; s.failT = t; s.why0 = why; s.squishAt = t; s.ground = false; s.vy = 0; s.react = { name: 'shock', dur: 1, at: t }; log('fail', { why }); }
// the things on his path (course hazards): dots (jump), badges / the sag (duck), thrown texts (duck), falling texts and BLOCKED (Space)
export function hazGeom(RP, h, t, s) {
  const p = RP.ph[h.ph], o = pose(RP, p, t, s), q = h.pl != null ? RP.plats[h.pl] : null, b = q ? platBox(RP, q, pose(RP, RP.ph[q.ph], t, s), t) : null;
  const floor = b ? b.y1 : o.yb + RP.co.BASE + 0.98, x = RP.X0 + h.x;
  if (h.kind === 'dots') return { x0: x - 0.42, x1: x + 0.42, y0: floor, y1: floor + 0.44, floor };
  if (h.kind === 'duck') return { x0: x - 0.48, x1: x + 0.48, y0: floor + 0.72, y1: floor + 1.5, floor };
  if (h.kind === 'sag') return { x0: x - 0.8, x1: x + 0.8, y0: floor + 0.72, y1: o.yt, floor };
  if (h.kind === 'throw') { const vx = 10, xx = x + vx * (h.t - t);   // (thrown at his head, Ghost's throw: it tracks his height while it flies)
    const fl = s && s.ph === h.ph && s.rOn && s.failT == null ? s.y : floor;
    return { x0: xx - 0.9, x1: xx + 0.9, y0: fl + 0.72, y1: fl + 1.5, floor: fl, fly: t > h.t - 0.75, sx: x + vx * 0.75 }; }
  if (false) { const vx = 10, xx = 0; return { x0: xx - 0.9, x1: xx + 0.9, y0: floor + 0.72, y1: floor + 1.5, floor, fly: t > h.t - 0.75, sx: x + vx * 0.75 }; }
  // a falling text / BLOCKED shakes under the header, then drops at 12 W/s so that its bottom meets his head (standing on his mark) at
  // the word − 0.08 s, whatever the phone's height: the same timing in a tall phone and a short one
  if (h.kind === 'drop' || h.kind === 'blocked') { const hh = h.kind === 'drop' ? 0.9 : 0.75, rest = o.yt - (o.p.kind === 'L' || o.p.kind === 'T' ? 1.3 : 1.5) - hh, hit = floor + R.HT,
      y = Math.min(rest, hit + 12 * (h.t - 0.08 - t)), y0 = Math.max(floor, y), falling = y < rest - 1e-6;
    if (h.kind === 'drop') return { x0: x - 1.3, x1: x + 1.3, y0, y1: y0 + hh, floor, falling, shake: !falling };
    return { x0: o.x0 + 0.3, x1: o.x1 - 0.3, y0, y1: y0 + hh, floor, falling, shake: !falling }; }
  return null;
}
function hazards(RP, s, t, o, boxes, safe, log) {
  const head = s.y + (s.ducking ? R.HTD : R.HT), purple = t < s.phaseUntil;
  for (const h of RP.hz) { if (t < h.appear || t > h.t + 1.2 || (s.hz[h.i])) continue; if (h.kind === 'stepup') continue;
    if ((h.kind === 'drop' || h.kind === 'blocked') && t >= h.t - 0.55 && t - 1 / 120 < h.t - 0.55 && !s.charge) { s.charge = true; log('charge', { how: 'danger' }); }   // (what's about to fall gives him the glitch for it: his rim lights 0.55 s before)
    const gm = hazGeom(RP, h, t, s); if (!gm) continue;
    const overlapX = s.x + R.HW > gm.x0 && s.x - R.HW < gm.x1, overlapY = head > gm.y0 && s.y < gm.y1;
    if (h.kind === 'dots') { if (overlapX && overlapY && s.ph === h.ph) { s.hz[h.i] = t; s.stumbleUntil = t + R.STUMBLE; s.x = gm.x0 - R.HW - 0.02; s.react = { name: 'startled', dur: 0.4, at: t }; log('stumble'); } continue; }
    if (h.kind === 'duck' || h.kind === 'sag' || (h.kind === 'throw' && gm.fly)) { if (overlapX && overlapY && s.ph === h.ph) { s.hz[h.i] = t; s.x -= R.KNOCK; s.stumbleUntil = t + R.KNOCKT; s.knockAt = t; s.react = { name: 'shock', dur: 0.5, at: t }; log('knock', { kind: h.kind }); } continue; }
    if ((h.kind === 'drop' || h.kind === 'blocked') && gm.falling) {
      const hit = h.kind === 'blocked' ? s.ph === h.ph && head > gm.y0 && s.y < gm.y1 : overlapX && overlapY;
      if (!hit || t > h.t + 0.05) { if (t >= h.t) s.hz[h.i] = -t; continue; }   // (once it lands it shatters: nothing to walk into)
      s.hz[h.i] = t;
      if (purple) { log('thru', { kind: h.kind }); s.thruAt = t; s.react = { name: 'smirk', dur: 0.5, at: t }; s.score = (s.score || 0) + 50; }
      else if (safe) { log('flinch', { kind: h.kind }); s.react = { name: 'startled', dur: 0.35, at: t }; }
      else if (h.soft && !s.softUsed) { s.softUsed = true; s.x -= R.KNOCK; s.stumbleUntil = t + 0.2; s.knockAt = t; s.react = { name: 'shock', dur: 0.5, at: t }; log('knock', { kind: 'soft' }); }
      else squish(s, t, h.kind === 'blocked' ? 'blocked' : 'bubble', log); } }
}
// the runner takes over from the opening (7.88) or a retry's line
function startRunner(s, t, api) {
  const C = api.C, RP = prepR(C), co = RP.co;
  Object.assign(s, { rOn: true, tp: {}, ph: 0, carry: null, safeUntil: -9, doors: 0, rotN: 0, rew: {}, readT: {}, hz: {}, charge: true, useT: -9, phaseUntil: -9, duckUntil: 0, stumbleUntil: -9,
    jumpBuf: null, duckBuf: null, coyT: -9, vy: 0, ground: true, on: null, glitched: 0, prevTop: {}, softUsed: false });
  for (const T of RP.tippers) if (t > T.special.tipper.good[1]) s.tp[T.id] = { t0: T.special.tipper.word, good: true };   // (a retry past a tipper: it went well)
  for (const h of RP.hz) if (h.t < t) s.hz[h.i] = -1;
  for (const [g, qs] of RP.groups) if (Math.max(...qs.map(q => q.t)) < t - 0.05) s.rew[g] = 0;   // (a retry: what came before went right — his)
  if (t <= R.WAKE + 0.05) { s.glide = { x: s.x, y: s.y }; return; }
  const p = RP.ph.find(p => p.tIn >= t - 0.05 && !p.special.tipper && !p.special.tipB) || RP.ph[0]; s.ph = p.id; const o = pose(RP, p, t, s);
  if (p.id > 0 && p.special.dog) s.dogAt = t;
  const q = p.plats.find(q => q.solid && q.t < 0), b = q ? platBox(RP, q, o, t) : null;
  s.x = Math.max(o.x0 + 0.6, RP.mark(t)); s.y = b ? b.y1 : o.yb + 1.3; s.on = q ? q.id : null; s.ground = !!b; s.safeUntil = t + R.SAFE; s.facing = 1;
  if (RP.tipA && t > RP.tipA.special.tipA.release) s.rotN = 1;
  if (t > 92.3) s.dogAt = s.dogAt ?? 0;
}

// ======== fair.mjs's look (def.fair): the things you meet, and the level's own timed checks on the demo's run ========
export function fairThings(C) { const RP = prepR(C); return RP.hz.filter(h => h.kind !== 'stepup').map(h => ({ x0: RP.X0 + h.x - 0.5, t: h.t, what: `${h.kind}${h.what ? ' ' + h.what : ''}`, seenAt: h.appear }))
  .concat(RP.ph.slice(1).map(p => ({ x0: p.wx0, t: RP.ph[p.id - 1].tWall, what: `wall into #${p.id}`, seenAt: p.tDock ?? p.tArrive }))); }
export function fairRunner(C, base) {
  const RP = prepR(C), out = [], B = RP.beat, s = base;
  for (const p of RP.ph) { const n = RP.ph[p.id + 1]; if (!n || p.tLock0 == null || n.special.tipB) continue; const open = n.special.tipper ? n.special.tipper.word : n.tDock;
    if (p.tLock0 - open < 3 * B - 0.02) out.push({ t: p.tLock0, kind: 'jolt', v: +(p.tLock0 - open).toFixed(2), what: `lock #${p.id}: door to #${n.id} open only ${(p.tLock0 - open).toFixed(2)} s before` }); }
  for (const T of RP.tippers) { const W = T.special.tipper; if (W.good[1] - W.good[0] < 0.5) out.push({ t: W.word, kind: 'jolt', v: +(W.good[1] - W.good[0]).toFixed(2), what: `tipper #${T.id} window` });
    if (W.word - T.tArrive < 1.5) out.push({ t: W.word, kind: 'jolt', v: +(W.word - T.tArrive).toFixed(2), what: `tipper #${T.id} hangs too briefly` }); }
  for (const h of RP.hz) if ((h.kind === 'blocked' || h.kind === 'drop') && h.t - h.appear < 1.0) out.push({ t: h.t, kind: 'jolt', v: +(h.t - h.appear).toFixed(2), what: `${h.kind} warning` });
  for (const [a, z] of RP.quiet) for (const h of RP.hz) if (h.t > a && h.t < z) out.push({ t: h.t, kind: 'jolt', v: 0, what: `${h.kind} in the quiet ${a}–${z}` });
  for (const k of (s.jlog || []).filter(e => e.k === 'knock')) { const f = s.jlog.find(e => e.k === 'fail' && e.t >= k.t && e.t < k.t + 3); if (f) out.push({ t: k.t, kind: 'knock', v: +(f.t - k.t).toFixed(2), what: `knock → lost` }); }
  return out;
}

// ======================================================================================================================================
// THE LOOK (ART v2, lifted): HUGE sticker phones (ink, no white border since D-20261105-09, a flat case colour, a glint, side-button nubs) docked edge to edge in
// the dark; inside the one he's in, the real iMessage thread (James blue on the right = his to glitch, everyone else grey on the left),
// the owner's faint wallpaper, the group header (the OTHER people's avatars: + his purple one from 26.36), the input bar. The phone ahead
// is asleep: its owner's lock screen and one banner. The phone behind gets its lock screen slid down. The seam where two phones meet is
// his doorway (lilac). The dark between holds the lyrics. No labels on anything (Chikin, 9:08). Purple is only his.
// ======================================================================================================================================
const INK = '#120a05', WHITE = '#ffffff', PURP = ['#7b3cf2', '#9a52ff', '#e03ccf', '#c9a7ff'], RED = '#ff3b30', LILAC = '#c9a7ff';
const OWN = { J: { c: '#3b7ee6', d: '#2a5fb4', ic: 'paw' }, S: { c: '#f0675a', d: '#c94a40', ic: 'heart' }, C: { c: '#e8b22c', d: '#b98a17', ic: 'bot' },
  M: { c: '#5fbf9f', d: '#3f977a', ic: 'daisy' }, E: { c: '#cfd3da', d: '#9aa0ab', ic: 'star' }, B: { c: '#6b7385', d: '#4c5363', ic: null }, T: { c: '#8a6bd6', d: '#6a4fb0', ic: null } };
const BUSC = ['#6b7385', '#7d8c5a', '#a3683f', '#4f7c8a', '#8a5a7d', '#5a6f8a', '#8a7d4f', '#5f5f6b', '#6f8a5a', '#8a4f4f'];
const FONT = (px, w = 600) => `${w} ${Math.max(1, Math.round(px))}px -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif`;
function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function icon(g, kind, x, y, sz, a = 1) {   // the owners' stickers (code-drawn, ink + white): paw, heart, robot, daisy, star, dog
  g.save(); g.translate(x, y); g.globalAlpha *= a;
  if (kind === 'paw') { for (const [r, col] of [[1.3, WHITE], [1, INK]].slice(OLD_WHITE ? 0 : 1)) { g.fillStyle = col; g.beginPath(); g.ellipse(0, sz * 0.14, sz * 0.26 * r, sz * 0.2 * r, 0, 0, 7); g.fill();
      for (const [a2, b2] of [[-0.3, -0.18], [-0.11, -0.32], [0.11, -0.32], [0.3, -0.18]]) { g.beginPath(); g.ellipse(a2 * sz, b2 * sz, sz * 0.09 * r, sz * 0.11 * r, 0, 0, 7); g.fill(); } } }
  else if (kind === 'heart') { for (const [r, col] of [[1.25, WHITE], [1, '#e8463c']].slice(OLD_WHITE ? 0 : 1)) { g.fillStyle = col; g.beginPath(); const k = sz * 0.36 * r; g.moveTo(0, k * 0.9); g.bezierCurveTo(-k * 1.6, -k * 0.1, -k * 0.7, -k * 1.2, 0, -k * 0.45); g.bezierCurveTo(k * 0.7, -k * 1.2, k * 1.6, -k * 0.1, 0, k * 0.9); g.fill(); } }
  else if (kind === 'bot') { if (OLD_WHITE) { g.fillStyle = WHITE; rr(g, -sz * 0.36, -sz * 0.3, sz * 0.72, sz * 0.6, sz * 0.12); g.fill(); } g.fillStyle = INK; rr(g, -sz * 0.3, -sz * 0.24, sz * 0.6, sz * 0.48, sz * 0.1); g.fill();
    g.strokeStyle = WHITE; g.lineWidth = sz * 0.06; for (const ex of [-0.13, 0.13]) { g.beginPath(); g.moveTo(ex * sz - sz * 0.06, -sz * 0.06); g.lineTo(ex * sz + sz * 0.06, sz * 0.06); g.moveTo(ex * sz + sz * 0.06, -sz * 0.06); g.lineTo(ex * sz - sz * 0.06, sz * 0.06); g.stroke(); } }
  else if (kind === 'daisy') { for (let i = 0; i < 8; i++) { g.fillStyle = WHITE; g.beginPath(); g.ellipse(Math.cos(i * 0.785) * sz * 0.22, Math.sin(i * 0.785) * sz * 0.22, sz * 0.13, sz * 0.08, i * 0.785, 0, 7); g.fill(); } g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(0, 0, sz * 0.12, 0, 7); g.fill(); }
  else if (kind === 'star') { g.fillStyle = WHITE; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? sz * 0.16 : sz * 0.38, a2 = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a2) * r, Math.sin(a2) * r); } g.fill(); }
  else if (kind === 'dog') { g.fillStyle = INK; g.beginPath(); g.ellipse(0, sz * 0.1, sz * 0.34, sz * 0.3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-sz * 0.3, -sz * 0.08, sz * 0.12, sz * 0.24, 0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(sz * 0.3, -sz * 0.08, sz * 0.12, sz * 0.24, -0.5, 0, 7); g.fill();
    g.fillStyle = '#c99257'; g.beginPath(); g.ellipse(0, sz * 0.12, sz * 0.27, sz * 0.24, 0, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(-sz * 0.1, sz * 0.05, sz * 0.035, 0, 7); g.arc(sz * 0.1, sz * 0.05, sz * 0.035, 0, 7); g.fill(); g.beginPath(); g.ellipse(0, sz * 0.2, sz * 0.07, sz * 0.05, 0, 0, 7); g.fill(); }
  else if (kind === 'potato') { g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, sz * 0.3, sz * 0.36, 0.2, 0, 7); g.fill(); g.fillStyle = '#da9643'; g.beginPath(); g.ellipse(0, 0, sz * 0.25, sz * 0.31, 0.2, 0, 7); g.fill(); g.fillStyle = '#a86a2a'; g.beginPath(); g.arc(-sz * 0.08, -sz * 0.1, sz * 0.03, 0, 7); g.arc(sz * 0.07, sz * 0.12, sz * 0.025, 0, 7); g.fill(); }
  g.restore();
}
export const modeView = ({ T, world: W3, C, cam }) => {
  const RP = prepR(C), co = RP.co, B = RP.beat, end = C.def.phone.end || {};
  const g0 = new T.Group(); W3.add(g0); const v0 = G0.modeView({ T, world: g0, C, cam });   // (the current Ghost's view, for the opening only)
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1000; const g = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace; tex.minFilter = T.LinearFilter;
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: false, depthWrite: false, depthTest: false })); mesh.renderOrder = -5; mesh.frustumCulled = false; W3.add(mesh);
  const img = src => { if (typeof Image === 'undefined' || !src) return null; const im = new Image(); im.src = new URL('../' + src, import.meta.url).href; return im; };
  const PET = { 1: img('easter/petunia-square.jpg'), 2: img('easter/petunia-2-square.jpg'), 3: img('easter/petunia-3-square.jpg'), 4: img('easter/petunia-4-square.jpg') };
  const okImg = im => im && im.complete && im.naturalWidth;
  let vw = 16, vh = 10, z = 1, cx = 0, cy = 0, u = 50, left = 0, top = 0, camYs = null, camXs = null, lastT = -9;
  const X = wx => (wx - left) * u, Y = wy => (top - wy) * u;
  // text in world units: canvas fonts want whole pixels, so text is drawn TS times bigger in a frame TS times smaller
  const TS = 40, font = (sz, w) => { g.font = FONT(sz * TS, w); }, measure = str => g.measureText(str).width / TS;
  const fillT = (str, x, y) => { g.save(); g.translate(x, y); g.scale(1 / TS, 1 / TS); g.fillText(str, 0, 0); g.restore(); };
  // ---------------- the camera: on his mark (he sits 30 % from the left when on it); y on the phone he's in ----------------
  function camera(f) {
    const { s, t } = f; vw = cam.right - cam.left; vh = cam.top - cam.bottom;
    const VH = R.VH, VWd = VH * vw / vh, ph = RP.ph[s.ph] || RP.ph[0], po = pose(RP, ph, t, s);
    const kx = RP.mark(t) + 0.2 * VWd, restY = po.yb + 11.74 / 2 - 0.1 + (ph.special.tipB ? 0 : 0);
    if (camYs == null || Math.abs(t - lastT) > 0.3) { camYs = restY; camXs = kx; } else { const a = 1 - Math.exp(-(t - lastT) / 0.5), a2 = 1 - Math.exp(-(t - lastT) / 0.25); camYs += (restY - camYs) * a; camXs += (kx - camXs) * a2; }
    let x = Math.min(Math.max(camXs, s.x - VWd / 2 + 1.5), s.x + VWd / 2 - 1.5), y = camYs, zz = vh / VH;
    if (t < R.CTL) { const k = ease5((t - R.WAKE) / (R.CTL - R.WAKE)), z0 = vh / (G0.S.IH * G0.Z); x = SC[0] + (x - SC[0]) * k; y = SC[1] + (y - SC[1]) * k; zz = Math.exp(Math.log(z0) + (Math.log(zz) - Math.log(z0)) * k); }
    if (t >= R.DARK) { const L = pose(RP, RP.last, t, s), k = ease5((t - R.DARK) / 0.9), ez = vh / (11.74 * 1.08); x += (L.x0 + RP.last.w / 2 - x) * k; y += ((L.yb + L.yt) / 2 - y) * k; zz = Math.exp(Math.log(zz) + (Math.log(ez) - Math.log(zz)) * k);
      if (end.leap != null && t >= end.leap - 0.2) { const gf = s.goneFrom || { x: s.x, y: s.y }, k2 = ease(clamp((t - (end.leap - 0.2)) / 0.35)) ** 1.6; x += (gf.x - x) * k2; y += (gf.y + 0.6 - y) * k2; zz *= Math.exp(Math.log(2.6) * k2); } }
    let sx = 0, sy = 0; const sh = s.failT != null && t - s.failT < 0.4 ? 1 - (t - s.failT) / 0.4 : 0;
    if (sh > 0) { sx = (hash(Math.floor(t * 60), 1) - 0.5) * 0.3 * sh; sy = (hash(Math.floor(t * 60), 2) - 0.5) * 0.3 * sh; }
    z = zz; cx = x + sx; cy = y + sy; lastT = t;
    cam.up.set(0, 1, 0); cam.zoom = z; cam.position.set(cx, cy, 10); cam.lookAt(cx, cy, 0); cam.updateProjectionMatrix();
  }
  function fitCanvas() { const W = 1600, H = Math.round(W * vh / vw); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    u = cv.width / (vw / z); left = cx - vw / (2 * z); top = cy + vh / (2 * z); mesh.position.set(cx, cy, -2); mesh.scale.set(vw / z, vh / z, 1); }
  // ---------------- the dark between the messages: navy, typing-dot stars, the far +41 skyline (purple at the end) ----------------
  function backdrop(f) {
    const { t } = f, W = cv.width, H = cv.height; g.setTransform(1, 0, 0, 1, 0, 0);
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b0e1d'); gr.addColorStop(0.62, '#121833'); gr.addColorStop(1, '#0a0c18'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const b = (t - co.OFF) / B;
    for (let i = 0; i < 46; i++) { const x = mod(hash(i, 7) * W * 1.6 - cx * u * 0.08 * (0.3 + hash(i, 3) * 0.4), W * 1.6) - W * 0.3, y = H * (0.08 + hash(i, 8) * 0.5);
      g.fillStyle = '#3a4570'; g.globalAlpha = 0.5; for (let k = 0; k < 3; k++) { const bob = ((Math.floor(b * 2) + k + i) % 3 === 0) ? -1.5 : 0; g.beginPath(); g.arc(x + k * 6, y + bob, 1.6, 0, 7); g.fill(); } }
    g.globalAlpha = 1;
    const crowd = t >= 101.51 ? 1 : 0.5;
    for (const [layer, n, k, y0, sz] of [[0, 34, 0.05, 0.72, 0.03], [1, 26, 0.1, 0.8, 0.045]]) for (let i = 0; i < n; i++) { if (hash(i, 30 + layer) > crowd) continue;
      const w = H * sz * (0.8 + hash(i, 1 + layer) * 0.6), h = w * 2.05, x = mod(i * W * 1.4 / n + hash(i, 2 + layer) * 30 - cx * u * k, W * 1.4) - W * 0.2, y = H * y0 + hash(i, 3 + layer) * H * 0.1;
      const lit = t >= 120.48 ? 1 : 0; g.fillStyle = layer ? '#1a2142' : '#141a35'; rr(g, x, y, w, h, w * 0.18); g.fill();
      g.fillStyle = lit ? PURP[0] : hash(i, 4 + layer) < 0.6 ? (layer ? '#2c3a6e' : '#222c55') : '#1f2850'; rr(g, x + 2, y + 2, w - 4, h - 4, w * 0.13); g.fill(); }
  }
  // the transform for a phone: its own frame in world units, turned about its pivot (the tip) or wobbling about its bottom
  function phoneFrame(o) { const p = o.p, k = u; let ang = o.ang + o.wob, px, py;
    if (o.pivot) { px = o.pivot[0]; py = o.pivot[1]; } else { px = (o.x0 + o.x1) / 2; py = o.yb; }
    const c = Math.cos(ang), sn = Math.sin(ang); g.setTransform(k * c, -k * sn, k * sn, k * c, X(px), Y(py)); return [px, py]; }
  const W2 = (o, wx) => wx - (o.pivot ? o.pivot[0] : (o.x0 + o.x1) / 2), H2 = (o, wy) => -(wy - (o.pivot ? o.pivot[1] : o.yb));
  // ---------------- a phone: the sticker body, then its screen ----------------
  const ownerOf = p => p.owner === 'B' ? { ...OWN.B, c: BUSC[(p.stranger || 0) % BUSC.length] } : OWN[p.owner] || OWN.B;
  const petOn = (p, s, t) => p.owner === 'S' && s.dogAt != null && (p.special.dog ? true : p.id > (RP.ph.find(q => q.special.dog) || { id: 1e9 }).id);
  function phone(o, f) {
    const { t, s } = f, p = o.p, Ow = ownerOf(p); phoneFrame(o);
    const x0 = W2(o, o.x0), x1 = W2(o, o.x0 + p.w), yT = H2(o, o.yt), yB = H2(o, o.yb), w = x1 - x0, h = yB - yT, rad = Math.min(w, h) * 0.1, ink = 0.11, bw = 0.11;
    if (o.landed != null && o.landed < 0.08) g.scale(1.02, 0.96);
    if (OLD_WHITE) { g.fillStyle = WHITE; rr(g, x0 - bw - ink, yT - bw - ink, w + 2 * (bw + ink), h + 2 * (bw + ink), rad + bw + ink); g.fill(); }
    g.fillStyle = INK; rr(g, x0 - ink, yT - ink, w + 2 * ink, h + 2 * ink, rad + ink); g.fill();
    g.fillStyle = Ow.c; rr(g, x0, yT, w, h, rad); g.fill(); g.fillStyle = Ow.d; g.fillRect(x1 - w * 0.06, yT + rad, w * 0.06, h - 2 * rad);
    const gx0 = x0 + 0.25, gx1 = x1 - 0.25, gy0 = yT + 0.25, gy1 = yB - 0.25;
    g.fillStyle = INK; rr(g, gx0 - 0.05, gy0 - 0.05, gx1 - gx0 + 0.1, gy1 - gy0 + 0.1, rad * 0.75); g.fill();
    g.save(); rr(g, gx0, gy0, gx1 - gx0, gy1 - gy0, rad * 0.7); g.clip();
    const G2 = { gx0, gx1, gy0, gy1 };
    if (o.dark >= 1) { g.fillStyle = '#05060a'; g.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0); }
    else if (o.asleep || o.hang || o.falling) lockScreen(o, f, G2, 1, true);
    else { chat(o, f, G2); if (o.lock > 0) lockScreen(o, f, G2, o.lock, false); if (o.dark > 0) { g.fillStyle = `rgba(5,6,10,${o.dark})`; g.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0); } }
    if (p.special.dog && s.dogAt != null && t - s.dogAt < 0.6) dogWipe(o, f, G2);
    if (o.crack) crack(G2);
    if (p.special.last && t >= (end.slider ?? 1e9) && o.dark < 1) slider(o, f, G2);
    g.restore();
    // a glint + the owner's sticker on the case corner (whose phone it is, no words)
    g.save(); g.globalAlpha = 0.08; g.fillStyle = WHITE; g.beginPath(); g.moveTo(gx0, gy0 + h * 0.4); g.lineTo(gx0 + w * 0.4, gy0); g.lineTo(gx0 + w * 0.55, gy0); g.lineTo(gx0, gy0 + h * 0.55); g.fill(); g.restore();
    const ic = petOn(p, s, t) ? null : Ow.ic; if (ic) { g.save(); g.translate(x1 - 0.42, yT + 0.42); g.rotate(0.22); icon(g, ic, 0, 0, 0.8); g.restore(); }
  }
  function wallpaper(o, f, G2, a) { const { t, s } = f, p = o.p, Ow = ownerOf(p);
    if (petOn(p, s, t)) { const im = PET[1]; if (okImg(im)) { g.save(); g.globalAlpha = a; const W = G2.gx1 - G2.gx0, H = G2.gy1 - G2.gy0, sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, G2.gx0 + (W - im.naturalWidth * sc) / 2, G2.gy0 + (H - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc); g.restore(); return; } }
    const ic = p.owner === 'J' || p.special.dog ? 'dog' : Ow.ic; if (!ic) return; g.globalAlpha = a; for (let i = 0; i < 18; i++) icon(g, ic, G2.gx0 + hash(i, 21 + p.id) * (G2.gx1 - G2.gx0), G2.gy0 + hash(i, 22 + p.id) * (G2.gy1 - G2.gy0), 0.75); g.globalAlpha = 1; }
  // the lock screen (k = how far down; 1 = all of it): bottom first (the owner's picture), the big clock, one banner (asleep ahead)
  function lockScreen(o, f, G2, k, ahead) {
    const { t, s } = f, p = o.p, x0 = G2.gx0, x1 = G2.gx1, yT = G2.gy0, H = G2.gy1 - G2.gy0, W = x1 - x0, cxm = (x0 + x1) / 2;
    g.save(); g.beginPath(); g.rect(x0, yT, W, H * k); g.clip(); g.translate(0, H * (k - 1));
    const gr = g.createLinearGradient(0, yT, 0, yT + H); gr.addColorStop(0, '#1b2350'); gr.addColorStop(1, '#0b1030'); g.fillStyle = gr; g.fillRect(x0, yT, W, H);
    if (petOn(p, s, t) && okImg(PET[1])) { const im = PET[1], sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.globalAlpha = 0.85; g.drawImage(im, x0 + (W - im.naturalWidth * sc) / 2, yT + (H - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc); g.globalAlpha = 1; }
    else { const Ow = ownerOf(p), wp = p.owner === 'J' || p.special.dog ? 'dog' : Ow.ic; if (wp) icon(g, wp, cxm, yT + H * 0.66, Math.min(W, H) * 0.42, 0.9);
      else { g.fillStyle = Ow.c; g.globalAlpha = 0.5; g.beginPath(); g.arc(cxm, yT + H * 0.72, Math.min(W, H) * 0.22, 0, 7); g.fill(); g.globalAlpha = 1; } }
    g.fillStyle = 'rgba(255,255,255,0.92)'; font(Math.min(H * 0.12, W * 0.24), 300); g.textAlign = 'center'; g.textBaseline = 'middle';
    fillT(s.rewT != null && t - s.rewT < 0.035 ? '4:04' : '9:41', cxm, yT + H * 0.17);
    if (ahead && !o.hang && !o.falling) {
      const prev = RP.ph[p.id - 1], dq = prev && prev.door != null ? RP.plats.find(q => q.row === prev.door && q.ph === prev.id) : null;
      if (p.special.wifi || (prev && prev.special.wifi && !dq)) wifiSheet(o, f, G2);
      else if (dq && t >= dq.t) { const bw = W * 0.88, bh = 0.85, by = yT + H * 0.3, txt = bubbleText(dq, s, t);
        g.fillStyle = 'rgba(245,245,250,0.85)'; rr(g, cxm - bw / 2, by, bw, bh, 0.3); g.fill(); g.fillStyle = (OWN[dq.who] || OWN.B).c; g.beginPath(); g.arc(cxm - bw / 2 + 0.42, by + bh / 2, 0.22, 0, 7); g.fill();
        if (isMine(s, dq)) { g.fillStyle = PURP[1]; g.beginPath(); g.arc(cxm - bw / 2 + 0.42, by + bh / 2, 0.12, 0, 7); g.fill(); }
        g.fillStyle = '#111'; font(0.3, 500); g.textAlign = 'left'; fillT(txt.length > 26 ? txt.slice(0, 25) + '…' : txt, cxm - bw / 2 + 0.78, by + bh / 2); } }
    if (o.hang) { const T = p.special.tipper, n = clamp(Math.floor((t - (T.word - 3 * B)) / B) + 1, 0, 3); if (t >= T.word - 3 * B) for (let i = 0; i < 3; i++) { g.fillStyle = i < n ? WHITE : 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(cxm + (i - 1) * 0.75, yT + H * 0.86, 0.22, 0, 7); g.fill(); }
      g.fillStyle = RED; g.fillRect(x1 - 0.85, yT + 0.25, 0.42, 0.18); }
    g.restore();
    if (!ahead && k < 1) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x0, yT + H * k - 0.05, W, 0.05); g.fillStyle = INK; rr(g, cxm - 0.8, yT + H * k - 0.22, 1.6, 0.08, 0.04); g.fill(); }
  }
  function wifiSheet(o, f, G2) {   // the real iOS join sheet: he IS the bus wi-fi (the network list is the gag: potato · potato 5G · potato_EXT)
    const W = G2.gx1 - G2.gx0, H = G2.gy1 - G2.gy0, sw = Math.min(W * 0.86, 5.2), sh = Math.min(H * 0.5, 3.6), x = (G2.gx0 + G2.gx1) / 2 - sw / 2, y = G2.gy0 + H * 0.36;
    g.fillStyle = 'rgba(242,242,247,0.95)'; rr(g, x, y, sw, sh, 0.35); g.fill(); g.fillStyle = '#111'; font(0.3, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT('Join "potato"?', x + sw / 2, y + 0.4);
    font(0.24, 500); const L = ['potato', 'potato 5G', 'potato_EXT']; L.forEach((n, i) => { const yy = y + 0.95 + i * 0.5; if (yy > y + sh - 0.3) return; g.fillStyle = '#e3e3e8'; g.fillRect(x + 0.25, yy + 0.22, sw - 0.5, 0.02); g.fillStyle = '#111'; g.textAlign = 'left'; fillT(n, x + 0.35, yy);
      g.fillStyle = PURP[1]; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + sw - 0.5, yy + 0.08, 0.06 + k * 0.08, -2.4, -0.7); g.strokeStyle = PURP[1]; g.lineWidth = 0.035; g.stroke(); } }); }
  function dogWipe(o, f, G2) { const { t, s } = f, k = clamp((t - s.dogAt) / 0.5), im = PET[1]; if (!okImg(im)) return;
    const W = G2.gx1 - G2.gx0, H = G2.gy1 - G2.gy0, r = Math.hypot(W, H) * ease(k), ex = G2.gx0 + 0.2, ey = H2(o, s.dogY ?? o.yb + 1.5);
    g.save(); g.beginPath(); g.arc(ex, ey, r, 0, 7); g.clip(); g.globalAlpha = 1 - clamp((t - s.dogAt - 0.5) / 0.1); const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); g.drawImage(im, G2.gx0 + (W - im.naturalWidth * sc) / 2, G2.gy0 + (H - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc); g.restore();
    g.save(); g.strokeStyle = PURP[1]; g.lineWidth = 0.18; g.globalAlpha = 1 - k; g.beginPath(); g.arc(ex, ey, r, 0, 7); g.stroke(); g.restore(); }
  // the real iOS power-off slider on James's last phone: its knob moves on the four beats (118.08 …), then he leaps out
  function slider(o, f, G2) { const { t } = f, st = end.steps || [], n = st.filter(x => t >= x).length, k = st.length ? n / st.length : 0, W = G2.gx1 - G2.gx0, sw = W * 0.8, sh = 0.95, x = G2.gx0 + (W - sw) / 2, y = G2.gy0 + 1.6;
    g.fillStyle = 'rgba(20,20,26,0.55)'; g.fillRect(G2.gx0, G2.gy0, W, G2.gy1 - G2.gy0);
    g.fillStyle = 'rgba(235,235,240,0.92)'; rr(g, x, y, sw, sh, sh / 2); g.fill();
    g.fillStyle = '#8e8e93'; font(0.3, 500); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT('slide to power off', x + sw / 2 + 0.4, y + sh / 2);
    const kx = x + sh / 2 + (sw - sh) * ease(k); g.fillStyle = WHITE; g.beginPath(); g.arc(kx, y + sh / 2, sh / 2 - 0.06, 0, 7); g.fill(); g.strokeStyle = RED; g.lineWidth = 0.07; g.beginPath(); g.arc(kx, y + sh / 2, 0.18, -1.1, 4.2); g.moveTo(kx, y + sh / 2 - 0.26); g.lineTo(kx, y + sh / 2 - 0.04); g.stroke(); }
  function crack(G2) { g.save(); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.05; g.beginPath(); const cx0 = (G2.gx0 + G2.gx1) / 2 + 1, cy0 = (G2.gy0 + G2.gy1) / 2; for (let i = 0; i < 6; i++) { g.moveTo(cx0, cy0); let x = cx0, y = cy0; for (let j = 0; j < 4; j++) { x += Math.cos(i * 1.05 + j * 0.3) * 0.8; y += Math.sin(i * 1.05 + j * 0.3) * 0.8; g.lineTo(x, y); } } g.stroke(); g.restore(); }
  // what a text says right now (his rewrite, her ALT if his went out unchanged)
  function bubbleText(q, s, t) { if (isMine(s, q) && q.rew && !q.photo) return q.rew;
    if (q.altOf != null && s.rew[q.altOf] == null && s.readT[q.altOf] != null && q.alt) return q.alt;
    if (q.altIfNone && q.altIfNone.groups.every(gp => s.rew[gp] == null && s.readT[gp] != null)) return q.altIfNone.text;
    return q.text; }
  function wrapPx(text, maxw) { const ws = String(text).split(/\s+/).filter(Boolean), L = []; let cur = ''; for (const w of ws) { const nx = cur ? cur + ' ' + w : w; if (!cur || measure(nx) <= maxw) cur = nx; else { L.push(cur); cur = w; } } if (cur) L.push(cur); return L.slice(0, 3); }
  // the live chat in the phone he's in (and the one he's crossing into)
  function chat(o, f, G2) {
    const { t, s } = f, p = o.p;
    g.fillStyle = '#fbfaf6'; g.fillRect(G2.gx0, G2.gy0, G2.gx1 - G2.gx0, G2.gy1 - G2.gy0); wallpaper(o, f, G2, 0.08);
    for (const q of p.plats) { const b = platBox(RP, q, o, t); if (!b) continue; bubble(q, b, o, f); }
    hazDraw(o, f); header(o, f, G2); bar(o, f, G2);
  }
  function bubble(q, b, o, f) {
    const { t, s } = f, x0 = W2(o, b.x0), x1 = W2(o, b.x1), yT = H2(o, b.y1), yB = H2(o, b.y0), w = x1 - x0, h = yB - yT, rad = Math.min(h / 2, 0.36);
    if (yB < G2top(o) - 0.2) return;
    const drop = RP.hz.find(hh => hh.kind === 'drop' && hh.row === q.row && q.row != null); if (drop && t >= drop.appear) return;   // (it's the one that shook loose)
    g.save(); g.globalAlpha = 0.25 + 0.75 * b.pop; if (b.pop < 1) { const k = 0.85 + 0.15 * b.pop, mx = (x0 + x1) / 2, my = yB; g.translate(mx, my); g.scale(k, k); g.translate(-mx, -my); }
    const J = q.who === 'J', mine = isMine(s, q), txt = bubbleText(q, s, t);
    if (q.sys) { g.fillStyle = q.sheet ? 'rgba(229,229,234,0.95)' : 'rgba(0,0,0,0)'; if (q.sheet) { rr(g, x0, yT, w, h, 0.3); g.fill(); }
      g.fillStyle = '#6e6e73'; font(0.3, 600); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT(mine && q.rew ? q.rew : txt, (x0 + x1) / 2, (yT + yB) / 2); g.restore(); return; }
    if (q.photo) { g.fillStyle = INK; rr(g, x0 - 0.05, yT - 0.05, w + 0.1, h + 0.1, 0.25); g.fill(); g.save(); rr(g, x0, yT, w, h, 0.22); g.clip();
      const im = q.pet ? PET[q.pet] : null;
      if (okImg(im)) { const sc = Math.max(w / im.naturalWidth, h / im.naturalHeight); g.drawImage(im, x0 + (w - im.naturalWidth * sc) / 2, yT + (h - im.naturalHeight * sc) / 2, im.naturalWidth * sc, im.naturalHeight * sc); }
      else if (/screenshot/i.test(q.text)) { g.fillStyle = WHITE; g.fillRect(x0, yT, w, h); g.fillStyle = '#e9e9eb'; for (let i = 0; i < 4; i++) { rr(g, x0 + 0.2 + (i % 2) * w * 0.35, yT + 0.2 + i * 0.38, w * 0.5, 0.28, 0.12); g.fill(); g.fillStyle = i % 2 ? '#0a84ff' : '#e9e9eb'; } }
      else if (/porch/i.test(q.text)) { g.fillStyle = '#1b2240'; g.fillRect(x0, yT, w, h); g.fillStyle = '#ffd27a'; g.fillRect(x0 + w * 0.35, yT + h * 0.25, w * 0.3, h * 0.4); g.globalAlpha *= 0.35; g.beginPath(); g.arc(x0 + w * 0.5, yT + h * 0.45, h * 0.5, 0, 7); g.fill(); }
      else { const gr = g.createLinearGradient(x0, yT, x0, yB); gr.addColorStop(0, '#9fb6d8'); gr.addColorStop(1, '#5b6f92'); g.fillStyle = gr; g.fillRect(x0, yT, w, h);
        if (/biscuit/i.test(q.text)) icon(g, 'dog', x0 + w * 0.42, yT + h * 0.55, h * 0.75); else if (/soup/i.test(q.text)) { g.fillStyle = '#e8d9b0'; g.beginPath(); g.ellipse(x0 + w / 2, yT + h * 0.6, w * 0.3, h * 0.2, 0, 0, 7); g.fill(); }
        else { g.fillStyle = '#d9a35f'; g.fillRect(x0 + w * 0.3, yT + h * 0.5, w * 0.4, h * 0.3); }
        if (mine) icon(g, 'potato', x0 + w * 0.75, yT + h * 0.62, h * 0.55); }
      if (mine) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16; g.fillStyle = PURP[1]; g.fillRect(x0, yT, w, h); }
      g.restore(); if (/screenshot/i.test(q.text)) { g.strokeStyle = WHITE; g.lineWidth = 0.12; rr(g, x0 + 0.06, yT + 0.06, w - 0.12, h - 0.12, 0.2); g.stroke(); } }
    else { const bg = J ? (mine ? '#3a1d6e' : '#0a84ff') : '#e9e9eb', fg = J ? '#ffffff' : '#1a1a1a';
      g.fillStyle = bg; rr(g, x0, yT, w, h, rad); g.fill();
      if (mine && t - (s.rew[q.group] ?? -9) < 0.3) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 * (1 - (t - s.rew[q.group]) / 0.3); g.fillStyle = PURP[1]; rr(g, x0, yT, w, h, rad); g.fill(); g.restore(); }
      // the text fits the bubble: as many lines as the bubble is tall, the type a little smaller if it must be (never under 70 %)
      const nL = Math.max(1, Math.round((h - 2 * co.PADY) / co.LH)); let fs = co.FS, L;
      for (let k = 0; k < 4; k++) { font(fs, 400); L = wrapPx(txt, w - 2 * co.PADX); if (L.length <= nL && L.every(l => measure(l) <= w - 2 * co.PADX + 0.01)) break; fs *= 0.9; if (fs < co.FS * 0.7) { fs = co.FS * 0.7; font(fs, 400); L = wrapPx(txt, w - 2 * co.PADX); break; } }
      L = L.slice(0, nL + 1); g.fillStyle = fg; g.textBaseline = 'middle'; const lh = co.LH * fs / co.FS, ty = (yT + yB) / 2 - (L.length - 1) * lh / 2;
      g.textAlign = J ? 'right' : 'left'; L.forEach((l, i) => fillT(l, J ? x1 - co.PADX : x0 + co.PADX, ty + i * lh));
      if (!J && q.who !== 'S' && q.who !== 'X') { g.fillStyle = (OWN[q.who] || OWN.B).c; g.beginPath(); g.arc(x0 - 0.02, yT + 0.05, 0.16, 0, 7); g.fill(); }
      if (mine) { g.strokeStyle = PURP[1]; g.globalAlpha = 0.85; g.lineWidth = 0.05; rr(g, x0 - 0.04, yT - 0.04, w + 0.08, h + 0.08, rad + 0.04); g.stroke(); g.globalAlpha = 1; } }
    // his crawl on a blue text that's still his to take (no crawl on Kevin's lines: the purple slides off them)
    const live = q.target && !mine && !isRead(s, q, t);
    if (live) { const ux = u, R0 = { x: X(0) + x0 * ux, y: 0, w: w * ux, h: h * ux, r: rad * ux }; g.save(); const m = g.getTransform(); g.setTransform(1, 0, 0, 1, 0, 0);
      const p0 = m.transformPoint({ x: x0, y: yT }); R0.x = p0.x; R0.y = p0.y; drawShimmer(g, R0, { t, u: 0.33 * u, k: 1, left: 1 }); g.restore(); }
    if (J && q.target && !q.copy) { g.fillStyle = '#8e8e93'; font(0.22, 500); g.textAlign = 'right'; g.textBaseline = 'top'; fillT(mine ? 'Delivered' : isRead(s, q, t) ? 'Read' : 'Delivered', x1, yB + 0.04); }
    g.restore();
  }
  const G2top = o => H2(o, o.yt) + 1.0;
  function header(o, f, G2) {   // the group header: the OTHER people's avatars (+ his purple one from 26.36, Kevin's never glitches), 9:41
    const { t, s } = f, p = o.p, x0 = G2.gx0, x1 = G2.gx1, y0 = G2.gy0, hh = p.kind === 'L' || p.kind === 'T' ? 0.85 : 1.05, y1 = y0 + hh;
    const sag = RP.hz.find(h => h.kind === 'sag' && h.ph === p.id && t >= h.appear && t < h.t + 1.2);
    g.fillStyle = '#efedf0'; g.fillRect(x0, y0, x1 - x0, hh); g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x0, y1 - 0.03, x1 - x0, 0.03);
    if (sag) { const gm = hazGeom(RP, sag, t, s), sx = W2(o, (gm.x0 + gm.x1) / 2), k = clamp((t - sag.appear) / 0.4), lo = H2(o, gm.y0), sw = (gm.x1 - gm.x0) / 2 + 0.4;
      g.fillStyle = '#d6d2dc'; g.strokeStyle = '#9a96a3'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(sx - sw - 0.6, y1); g.quadraticCurveTo(sx - sw, y1, sx - sw * 0.8, y1 + (lo - y1) * k); g.lineTo(sx + sw * 0.8, y1 + (lo - y1) * k); g.quadraticCurveTo(sx + sw, y1, sx + sw + 0.6, y1); g.fill(); g.stroke();
      g.fillStyle = PURP[1]; g.beginPath(); g.arc(sx, y1 + (lo - y1) * k - 0.3, 0.26, 0, 7); g.fill(); g.fillStyle = WHITE; g.fillRect(sx - 0.08, y1 + (lo - y1) * k - 0.35, 0.05, 0.1); g.fillRect(sx + 0.04, y1 + (lo - y1) * k - 0.33, 0.05, 0.08); }
    g.fillStyle = '#111'; font(0.27, 700); g.textBaseline = 'middle'; g.textAlign = 'left'; fillT(s.rewT != null && t - s.rewT < 0.035 ? '4:04' : '9:41', x0 + 0.4, y0 + 0.3);
    g.textAlign = 'right'; fillT('▮▮▮', x1 - 0.4, y0 + 0.3);
    g.fillStyle = '#000'; rr(g, (x0 + x1) / 2 - 0.9, y0 + 0.12, 1.8, 0.36, 0.18); g.fill();
    const others = ['J', 'S', 'K'].filter(k => k !== p.owner).slice(0, 3), plus = t >= 26.36; const ay = y0 + hh * 0.72;
    const cxm = (x0 + x1) / 2; others.forEach((k, i) => { const c = cxm + (i - (others.length - (plus ? 0 : 1)) / 2) * 0.44; g.fillStyle = '#efedf0'; g.beginPath(); g.arc(c, ay, 0.22, 0, 7); g.fill();
      g.fillStyle = k === 'K' ? '#7a8a6a' : k === 'S' && petOn(RP.ph.find(q => q.owner === 'S' && q.id >= p.id) || p, s, t) ? '#c99257' : OWN[k].c; g.beginPath(); g.arc(c, ay, 0.18, 0, 7); g.fill(); });
    if (plus) { const c = cxm + (others.length - (others.length) / 2) * 0.44; g.fillStyle = PURP[1]; g.beginPath(); g.arc(c, ay, 0.18, 0, 7); g.fill(); }
  }
  function bar(o, f, G2) { const y0 = H2(o, o.yb + co.BAR_H), y1 = G2.gy1, x0 = G2.gx0, x1 = G2.gx1;
    g.fillStyle = '#f2f1f4'; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.strokeStyle = '#c9c8ce'; g.lineWidth = 0.035; rr(g, x0 + 0.5, y0 + 0.1, x1 - x0 - 1.0, Math.min(0.45, (y1 - y0) * 0.55), 0.22); g.stroke(); }
  // ---------------- the things on his path (drawn in the phone they're in) ----------------
  function hazDraw(o, f) {
    const { t, s } = f, p = o.p;
    for (const h of RP.hz) { if (h.ph !== p.id || t < h.appear || t > h.t + 1.0 || h.kind === 'stepup' || h.kind === 'sag') continue; if (s.hz[h.i] && s.hz[h.i] > 0 && t > s.hz[h.i] + 0.25 && h.kind !== 'drop' && h.kind !== 'blocked') continue;
      const gm = hazGeom(RP, h, t, s); if (!gm) continue; const x0 = W2(o, gm.x0), x1 = W2(o, gm.x1), yT = H2(o, gm.y1), yB = H2(o, gm.y0), w = x1 - x0, hh = yB - yT, a = clamp((t - h.appear) / 0.15);
      g.save(); g.globalAlpha = a;
      if (h.kind === 'dots') { g.fillStyle = '#e7e5ea'; rr(g, x0, yT, w, hh, hh / 2); g.fill(); g.strokeStyle = '#b9b7c0'; g.lineWidth = 0.04; g.stroke(); for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(110,110,118,${0.35 + 0.65 * (Math.floor(t * 6) % 3 === k ? 1 : 0)})`; g.beginPath(); g.arc(x0 + w * (0.28 + k * 0.22), yT + hh / 2, hh * 0.15, 0, 7); g.fill(); } }
      else if (h.kind === 'duck') { const sc = ease(clamp((t - h.appear) / 0.15)), r = 0.42 * sc, bx = (x0 + x1) / 2, by = (yT + yB) / 2; g.fillStyle = WHITE; g.beginPath(); g.arc(bx, by, r + 0.06, 0, 7); g.fill(); g.fillStyle = '#e9e9eb'; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
        font(0.46 * sc, 500); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT(h.what || '👍', bx, by + 0.02); }
      else if (h.kind === 'throw') { const sh = gm.fly ? 0 : (hash(Math.floor(t * 40), h.i) - 0.5) * 0.15, xx = gm.fly ? x0 : W2(o, Math.min(gm.sx, o.x1 - 1.2)) - 0.9;
        if (h.thrown) { font(0.9, 500); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT(h.thrown, xx + 0.9 + sh, (yT + yB) / 2); }
        else { g.fillStyle = '#e9e9eb'; rr(g, xx + sh, yT, 1.8, hh, 0.3); g.fill(); g.fillStyle = '#1a1a1a'; font(0.26, 500); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT('hug??', xx + 0.9 + sh, (yT + yB) / 2); } }
      else if (h.kind === 'drop' || h.kind === 'blocked') { const sh = gm.shake ? (hash(Math.floor(t * 50), h.i) - 0.5) * 0.18 : 0;
        if (!gm.falling || t < h.t) { g.save(); g.setLineDash([0.16, 0.12]); g.strokeStyle = LILAC; g.lineWidth = 0.06; g.globalAlpha = 0.45 + 0.35 * Math.sin(t * 20);
          const fx = h.kind === 'blocked' ? [x0 + 0.8, x1 - 0.8] : [(x0 + x1) / 2]; for (const xx of fx) { g.beginPath(); g.moveTo(xx, yB); g.lineTo(xx, H2(o, gm.floor)); g.stroke(); } g.restore(); }
        if (s.hz[h.i] && s.hz[h.i] > 0 && t > s.hz[h.i]) { const k = (t - s.hz[h.i]) / 0.35; if (k < 1) { for (let i = 0; i < 14; i++) { g.fillStyle = PURP[i % 4]; g.globalAlpha = 1 - k; g.fillRect(x0 + hash(i, 1) * w, yT + k * 2 * hash(i, 2) + hh * hash(i, 3), 0.14, 0.14); } } g.restore(); continue; }
        if (t > h.t + 0.05) { g.restore(); continue; }
        if (h.kind === 'blocked') { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 + sh, yT + 0.12, w, hh); g.fillStyle = RED; g.fillRect(x0 + sh, yT, w, hh); g.fillStyle = WHITE; font(hh * 0.5, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT('⊘', (x0 + x1) / 2 + sh, (yT + yB) / 2 + 0.02); }
        else { g.fillStyle = '#e9e9eb'; rr(g, x0 + sh, yT, w, hh, 0.36); g.fill(); g.fillStyle = '#1a1a1a'; font(co.FS, 400); g.textAlign = 'left'; g.textBaseline = 'middle'; fillT(h.text || '', x0 + 0.3 + sh, (yT + yB) / 2); } }
      g.restore(); }
  }
  // ---------------- the seam where two docked phones meet: his doorway (lilac glow, brackets, his crawl) ----------------
  function seams(f, poses) {
    const { t, s } = f; g.setTransform(1, 0, 0, 1, 0, 0);
    for (const o of poses) { const p = o.p, n = RP.ph[p.id + 1]; if (!n || p.special.tipA) continue; const no = poses.find(q => q.p === n); if (!no || !no.docked || !o.docked || no.hang || no.falling) continue;
      const x = o.x1, y0 = Math.max(o.yb, no.yb) + 0.4, y1 = Math.min(o.yt, no.yt) - 0.4; if (y1 - y0 < 1) continue; const mine = s.ph === p.id;
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = LILAC; g.globalAlpha = mine ? 0.35 : 0.15; g.lineWidth = 0.5 * u; g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.restore();
      g.save(); g.setLineDash([0.12 * u, 0.12 * u]); g.strokeStyle = LILAC; g.lineWidth = 0.06 * u; g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); g.stroke(); g.restore();
      if (mine) { const st = Math.max(2, 0.09 * u); for (let i = 0; i < 12; i++) { const k = hash(i, Math.floor(t * 16) + p.id); g.fillStyle = PURP[i % 4]; g.globalAlpha = 0.85; g.fillRect(X(x) + (hash(i, 3) - 0.5) * st * 3, Y(y0 + (y1 - y0) * k), st, st); } g.globalAlpha = 1; } }
  }
  function cable(o, f) { const { t, s } = f; if (!o.hang && !(o.falling && s.snapAt != null && t - s.snapAt < 0.3)) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const x = X((o.x0 + o.x1) / 2), y = Y(o.yt); g.lineCap = 'round';
    for (const [lw, col] of [[0.16 * u, INK], [0.08 * u, '#e8e4dc']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(t * 2 + o.p.id) * 6, o.falling ? y - 0.8 * u : -20); g.stroke(); }
    if (s.snapAt != null && t - s.snapAt < 0.3) { const st2 = Math.max(3, 0.12 * u); for (let i = 0; i < 12; i++) { g.fillStyle = PURP[i % 4]; g.fillRect(x + (hash(i, Math.floor(t * 30)) - 0.5) * 0.8 * u, y - hash(i + 5, 2) * 2 * u, st2, st2); } } }
  function tear(f) { const { t, s } = f; if (s.doorAt == null || !s.doorFrom || t < s.doorAt || t - s.doorAt > 0.25) return; const a = 1 - (t - s.doorAt) / 0.25, n = 8;
    g.setTransform(1, 0, 0, 1, 0, 0); for (let i = 0; i < n; i++) { const k = hash(i, Math.floor(s.doorAt * 10)), y = s.y + 1.25 * (i + 0.5) / n, xa = s.doorFrom.x - 1.2 * k, xb = s.x + 0.4 * k;
      g.globalAlpha = a * 0.85; g.fillStyle = i % 3 === 0 ? PURP[2] : i % 3 === 1 ? PURP[1] : LILAC; g.fillRect(X(xa), Y(y) - 0.05 * u, X(xb) - X(xa) + 2, Math.max(2, 0.08 * u)); } g.globalAlpha = 1; }
  // his rim = his charge (bright purple charged, dim lilac spent); a spent press = a grey fizz
  function rim(f) { const { t, s } = f; if (s.gone || s.failT != null || t < co.runStart - 1) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const hh = (s.ducking ? R.HTD : R.HT), cxp = X(s.x), cyp = Y(s.y + hh / 2), rx = 0.55 * u, ry = hh / 2 * u + 0.12 * u;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = Math.max(2, 0.07 * u); g.strokeStyle = s.charge ? PURP[1] : '#5d5670'; g.globalAlpha = s.charge ? 0.55 + 0.2 * Math.sin(t * 9) : 0.25;
    g.beginPath(); g.ellipse(cxp, cyp, rx, ry, 0, 0, 7); g.stroke(); g.restore();
    if (s.fizzAt != null && t - s.fizzAt < 0.25) { const st = Math.max(3, 0.1 * u); for (let i = 0; i < 10; i++) { g.fillStyle = '#9a9aa6'; g.globalAlpha = 1 - (t - s.fizzAt) / 0.25; g.fillRect(cxp + (hash(i, 9) - 0.5) * u * 1.2, cyp + (hash(i, 8) - 0.5) * u * 1.2, st, st); } g.globalAlpha = 1; } }
  // ---------------- the end: black, the spread (the far phones light purple outward), Petunia 4 fills the view ----------------
  function finale(f) { const { t } = f; if (t < (end.black ?? 1e9)) return; g.setTransform(1, 0, 0, 1, 0, 0); const W = cv.width, H = cv.height;
    if (t < 120.48) { g.fillStyle = `rgba(0,0,0,${clamp((t - end.black) / 0.12)})`; g.fillRect(0, 0, W, H); return; }
    g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
    const n = 15, steps = [120.48, 120.79, 121.1]; for (let i = 0; i < n; i++) { const d = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2), lt = steps[Math.min(2, Math.floor(d * 3))], on = t >= lt;
      const w = W * 0.045, h = w * 2.05, x = W * (0.04 + 0.92 * i / (n - 1)) - w / 2, y = H * 0.55 + hash(i, 2) * H * 0.12;
      g.fillStyle = '#1a2142'; rr(g, x, y, w, h, w * 0.18); g.fill(); g.fillStyle = on ? PURP[i % 2] : '#141a35'; rr(g, x + 3, y + 3, w - 6, h - 6, w * 0.13); g.fill(); }
    if (t >= 121.0 - 0.3) { const k = ease5((t - 120.7) / 0.7), pet = PET[4], ph = H * (0.3 + 0.75 * k), pw = ph * 0.6, x = W / 2 - pw / 2, y = H * 0.5 - ph / 2;
      if (OLD_WHITE) { g.fillStyle = WHITE; rr(g, x - 8, y - 8, pw + 16, ph + 16, pw * 0.14); g.fill(); } g.fillStyle = INK; rr(g, x - 4, y - 4, pw + 8, ph + 8, pw * 0.13); g.fill(); g.fillStyle = OWN.S.c; rr(g, x, y, pw, ph, pw * 0.12); g.fill();
      const fr = pw * 0.05; g.fillStyle = INK; rr(g, x + fr, y + fr, pw - 2 * fr, ph - 2 * fr, pw * 0.09); g.fill();
      if (okImg(pet)) { g.save(); rr(g, x + fr + 2, y + fr + 2, pw - 2 * fr - 4, ph - 2 * fr - 4, pw * 0.08); g.clip(); const sw = pw - 2 * fr, sh = ph - 2 * fr, sc = Math.max(sw / pet.naturalWidth, sh / pet.naturalHeight);
        g.drawImage(pet, x + fr + (sw - pet.naturalWidth * sc) / 2, y + fr + (sh - pet.naturalHeight * sc) / 2, pet.naturalWidth * sc, pet.naturalHeight * sc); g.restore(); } } }
  // ---------------- one frame ----------------
  function draw(f) {
    const { t, s } = f;
    if (t < R.WAKE || !s.rOn) { g0.visible = true; mesh.visible = false; v0.draw(f); return; }
    g0.visible = false; mesh.visible = true; camera(f); fitCanvas(); backdrop(f);
    const VW = cv.width / u, VHh = cv.height / u, poses = [];
    for (const p of RP.ph) { const o = pose(RP, p, t, s); if (!o.present) continue; if (o.x0 - 3 > left + VW || Math.max(o.x1, o.x0 + p.h) + 3 < left) continue; poses.push(o); }
    // the tip: from the landing to the middle of the auto-rotate the lying phone is drawn as the upright one turned on its side (its chat sideways)
    if (RP.tipA) { const T = RP.tipA.special.tipA; if (t >= T.land && t < (T.rot[0] + T.rot[1]) / 2) { const oA = pose(RP, RP.tipA, T.land - 1e-4, s); oA.ang = -Math.PI / 2; oA.wob = 0; oA.present = true;
      const i = poses.findIndex(o => o.p === RP.tipB); if (i >= 0) poses.splice(i, 1); poses.push(oA); } }
    poses.sort((a, b) => (a.p.id === s.ph) - (b.p.id === s.ph) || (a.hang || a.falling ? 1 : 0) - (b.hang || b.falling ? 1 : 0));
    for (const o of poses) cable(o, f);
    for (const o of poses) phone(o, f);
    seams(f, poses); tear(f); rim(f);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (s.squishAt != null && s.failT != null) { const k = clamp((t - s.failT) / 0.15); g.fillStyle = `rgba(154,82,255,${0.3 * k})`; g.fillRect(0, 0, cv.width, cv.height); }
    finale(f); tex.needsUpdate = true;
  }
  // ---------------- the overlay: the lyrics in the dark (above the phones), his thoughts, his glitch words ----------------
  const LLINES = (() => { const by = new Map(); for (const w of C.signs || []) { if (w.t0 == null) continue; if (!by.has(w.line)) by.set(w.line, []); by.get(w.line).push(w); }
    const ls = [...by.values()].map(ws => ws.sort((a, b) => a.t0 - b.t0)).sort((a, b) => a[0].t0 - b[0].t0).map(ws => ({ ws, t0: ws[0].t0, t1: ws[ws.length - 1].t1 ?? ws[ws.length - 1].t0 + 0.4 }));
    ls.forEach((L, i) => { L.next = ls[i + 1] ? ls[i + 1].t0 : Infinity; }); return ls; })();
  function lyrics(ctx, f) { const { t, s } = f; if (t >= (end.black ?? 1e9)) return; let L = null; for (const l of LLINES) { if (l.t0 <= t + 0.05) L = l; else break; } if (!L || t > Math.min(L.next, L.t1 + 2.2)) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, o = pose(RP, RP.ph[s.ph] || RP.ph[0], t, s), pt = f.project(0, o.yt + 0.2), room = pt.y, SZ = Math.max(14, Math.min(H * 0.042, room * 0.55));
    const y = room > SZ * 1.3 ? room / 2 + 2 : H - SZ * 0.9; ctx.save(); ctx.font = `400 ${Math.round(SZ)}px "Major Mono Display", ui-monospace, monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const sp = ctx.measureText(' ').width, ws = L.ws.map(w => ({ w, txt: String(w.text ?? w.word).toLowerCase(), wd: ctx.measureText(String(w.text ?? w.word).toLowerCase()).width })), tot = ws.reduce((a, b) => a + b.wd, 0) + sp * (ws.length - 1), fit = Math.min(1, (W * 0.9) / tot);
    let xx = W / 2 - tot * fit / 2; for (const it of ws) { const on = t >= it.w.t0; ctx.save(); ctx.translate(xx, y); ctx.scale(fit, fit); ctx.globalAlpha = on ? 0.95 : 0.28; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(it.txt, 0, 0);
      ctx.fillStyle = on && t - it.w.t0 < 0.15 ? PURP[3] : '#c8d2ff'; ctx.fillText(it.txt, 0, 0); ctx.restore(); xx += (it.wd + sp) * fit; }
    ctx.restore(); }
  const THS = (C.def.thoughts !== false && C.def.runner && C.def.runner.thoughts) || [], TA = co.thoughtAt || {}, SHOWN = new Set(); let TQ = null;
  function thoughts(ctx, f) {
    const { t, s } = f; if (!THS.length || s.gone || s.failT != null) return;
    const ev = k => (s.jlog || []).find(e => e.k === k);
    if (!TQ) for (const th of THS) { if (SHOWN.has(th.n) || TA[th.n] == null) continue; const at = TA[th.n], e = typeof th.at === 'string' ? ev(th.at) : null; if (typeof th.at === 'string' && !e) continue;
      if (t < at || t > at + 0.3) continue; if (th.cond && !th.cond(s)) { SHOWN.add(th.n); continue; }
      SHOWN.add(th.n); const val = v => typeof v === 'function' ? v(e || {}) : v; TQ = { text: val(th.text), burst: val(th.burst), t0: t, life: Math.min(1.0, 0.35 + 0.12 * val(th.text).split(/\s+/).length) };
      const fc = val(th.face); if (fc) s.react = { name: fc.split('>')[0], dur: 0.9, at: t }; }
    if (!TQ) return; const a = t - TQ.t0; if (a > TQ.life + 0.35) { TQ = null; return; }
    const pt = f.project(s.x, s.y + 1.85), sz = Math.max(13, ctx.canvas.height * 0.024); ctx.save(); ctx.font = `700 ${Math.round(sz)}px "Major Mono Display", "JetBrains Mono", ui-monospace, monospace`; ctx.textAlign = 'center';
    if (a < TQ.life) { const tw = ctx.measureText(TQ.text).width, pw = tw + sz * 1.2, ph = sz * 1.7, W = ctx.canvas.width, x = Math.min(Math.max(pt.x, pw / 2 + 8), W - pw / 2 - 8), y = pt.y;
      ctx.globalAlpha = Math.min(1, a / 0.08) * 0.92; ctx.fillStyle = 'rgba(18,8,46,0.9)'; rr(ctx, x - pw / 2, y - ph * 0.68, pw, ph, ph / 2); ctx.fill(); ctx.strokeStyle = PURP[1]; ctx.lineWidth = 2; ctx.stroke();
      if (a < 0.06) { ctx.fillStyle = PURP[2]; ctx.fillText(TQ.text, x - 2, y); } ctx.fillStyle = '#ece0ff'; ctx.fillText(TQ.text, x, y); }
    else { const k = (a - TQ.life) / 0.35; ctx.globalAlpha = 0.8 * (1 - k); ctx.fillStyle = LILAC; ctx.fillText(TQ.burst || 'krrzzt', pt.x + k * 30, pt.y - k * 20); }
    ctx.restore(); }
  function over(ctx, f) { if (f.t < R.WAKE || !f.s.rOn) { if (v0.over) v0.over(ctx, f); return; } lyrics(ctx, f); thoughts(ctx, f); }
  return { draw, over, leave() { try { W3.remove(g0); W3.remove(mesh); } catch (e) {} } };
};

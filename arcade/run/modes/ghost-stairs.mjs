// modes/ghost-stairs.mjs — Level 6 as a STAIRCASE OF PHONES (?ghost=stairs; team Downstairs Neighbours, Nov 6). Not the default Ghost until Chikin says so.
// The rules + numbers: levels/ghost-stairs/STEPS.md · the chat: levels/ghost-stairs/SCRIPT.md + chat.mjs · the jokes: gags.mjs. The test: can a stranger follow the conversation with no effort?
//
// THE RULES (pure, 120 Hz; the bot runs this same code). World units; he's 1.25 tall; the view is 16.6 tall, never zooms.
//  · One conversation, many phones. 14 lit phones step down the hill. One is live; the others are dim and have no letters.
//  · Every phone: LAND, STAY, DOTS (the next phone types, the right wall opens), LEAVE (the input bar tips him out), DROP (a fixed arc, the keys don't steer it).
//    He can't be left behind and he can't miss a phone. Nothing ends the run. A hit knocks him along the strip and takes his glitch for a beat.
//  · He stands on the input bar, UNDER the words. The newest text lands over his head; older ones rise. The two newest texts are also platforms.
//  · ← → walk · double tap: spin · ↑ hop · ↑ again: flip · ↓ off a bubble · Space: his glitch.
//  · SPACE: on a text that glows (any time, anywhere on the phone), he blinks onto it and it's his. The words change on the sung word, not on the press. No glow: a fizz and a short phase
//    (through anything). On a Kevin line: his purple slides off and nothing happens.
//  · In the way: a line that shakes then falls (step aside) · something round that rolls (hop) · a wheel stuck in the door (spin next to it).
import * as G0 from './ghost-in-the-group-chat.mjs';
import { STEPS, WHO, HAZ, HUSH, SHORT_END, TORCHES } from '../levels/ghost-stairs/chat.mjs';
import { GAGS, TATICAT_TYPES, TATICAT_DOTS } from '../levels/ghost-stairs/gags.mjs';
const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const ease5 = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ======== numbers ========
export const R = {
  LONG_FALL: true,      // ★ the level designer's bold choice (STEPS §9): five phones at once on the first "ha". false: one step, the writer's timing
  READ_RECEIPT: true,   // ★ the writer's bold choice (SCRIPT §6): the last press, Delivered -> Read 4:04. false: it stays Delivered
  FOOT_KEYS: true,      // ★ the builder's bold choice: "i don't got hands". He stands on the input bar, so when he walks he types with his feet: the key under him goes purple and his glitch language piles up in that neighbour's input field, and he backspaces it when he stops. Never sent. false: gone
  BLINK_BACK: 0.55,     // after he takes a text he blinks back under the words, so he never sits on the line above. 0: he stays on the bubble (STEPS §5 as written)
  LIGHT: true,          // ★ the artist: the live phone is the old level's own white screen, the one lit thing on a dark hill (the last phone, S14, stays dark: everything's gone out). false: every live phone is dark mode
  DEAD_PIXEL: true,     // ★ the artist's bold choice: every phone he leaves keeps one stuck purple pixel. James powers off, the phones go out on each "ha", and the pixels don't. false: gone
  ERASED: true,         // ★ the builder's second bold choice (revise pass): on each "ha" of the long fall one dark phone shows, in its real colour, the true line he took from it. Only lines he really took; a run that took nothing stays dark. false: gone
  NEARLY: true,         // ★ the foreman's bold choice: dots have meant 'that's where you go next' all song. After Read 4:04 they start in Kevin's own thread, on the last phone, where there is no next, and they stop. Nothing is sent. Only if he pressed Read. false: gone
  NEARLY_IN: 0.5, NEARLY_FOR: 1.0,
  ECHO: true,           // his faint outline shows Space and the spin once, on the first phone
  VH: 16.6, LEFT: 6, FLOOR: 0.617,                                                      // the view: the live phone's left edge from the screen's left, the floor's height on screen
  PW: 7, PH: 15, FLOOR_Y: 9.9, HEAD: 1.5, STRIP: 1.5, BAR: 0.72, Y0: 100,            // a phone (STEPS §2)
  FS: 0.52, HOTFS: 0.44, MAXW: 5.6, PADX: 0.3, ROW1: 0.96, ROWL: 0.64, GAP: 0.14, NAME: 0.32, PHOTO: 2.0, PHOTOS: 1.32, BIG: 1.05, GREY: 0.5, READ: 0.48, ANIM: 0.18,
  WAKE: 7.88, S1: 9.36, PULL: 0.8, WALK: 7.2, ACCG: 70, ACCA: 42, GRAV: 46, HOP: 2.6, V2: 10, FALL: 20, COY: 0.09, DROP: 0.24, FOOT: 0.26, HW: 0.42, HT: 1.25, PHASE: 0.45,
  FIZZCD: 1.2, DBL: 0.3, SPIN: 0.42, SPINCD: 0.5, KNOCK: 1.5, DOOR: 1.0, TIP: 0.3, GLOWIN: 0.35, B: 0.61227, LINEG: 60, LINEHIT: 2.3, WHEEL_R: 2.8, ROLL_R: 0.45,
};
const NLEFT = 0.04;

// ======== text: a row's words, laid out in lines (table widths, so the sim and the look agree) ========
const CW = c => c === ' ' ? 0.27 : /[\u{1F000}-\u{1FFFF}]/u.test(c) ? 1.3 : null;
const tw = (word, hot) => hot ? [...word].length * R.HOTFS * 0.74 : [...word].reduce((a, c) => a + (CW(c) != null && CW(c) > 1 ? CW(c) * R.FS : 1.16 * G0.textW(c, R.FS)), 0);
function layout(text, inner = R.MAXW - 2 * R.PADX) {   // "*his* words|next line" -> lines of [{w, hot, wd}]
  const lines = []; let hot = false;
  for (const part of String(text).split('|')) { let line = [], lw = 0;
    for (const raw of part.split(' ')) { if (!raw) continue; const toks = raw.split('*'); let word = '', wasHot = hot; for (let i = 0; i < toks.length; i++) { if (i > 0) hot = !hot; if (toks[i]) { if (!word) wasHot = hot; word += toks[i]; } }
      const wd = tw(word, wasHot), sp = line.length ? 0.27 * R.FS : 0; if (line.length && lw + sp + wd > inner) { lines.push({ toks: line, w: lw }); line = []; lw = 0; }
      lw += (line.length ? 0.27 * R.FS : 0) + wd; line.push({ w: word, hot: wasHot, wd }); }
    lines.push({ toks: line, w: lw }); }
  return lines;
}
const textDims = text => { const lines = layout(text), w = Math.max(...lines.map(l => l.w)) + 2 * R.PADX; return { lines, w: Math.max(0.9, w), h: R.ROW1 + (lines.length - 1) * R.ROWL }; };

// ======== the staircase, prepared once ========
const PREP = new WeakMap();
export function prep(C) {
  if (PREP.has(C)) return PREP.get(C);
  const rows = [], steps = STEPS.map((q, i) => ({ ...q, i, rows: [...q.rows] }));
  const last = steps[steps.length - 1], prevOf = steps[steps.length - 2];
  if (!R.LONG_FALL) { Object.assign(prevOf, { leave: SHORT_END.leave, dy: SHORT_END.dy, fall: SHORT_END.fall }); Object.assign(last, { x: SHORT_END.x, top: SHORT_END.top }); }
  for (const q of steps) { q.x0 = q.x; q.x1 = q.x + R.PW; q.yt = R.Y0 + q.top; q.fl = q.yt - R.FLOOR_Y; q.yb = q.yt - R.PH; q.door = q.leave != null ? q.leave - R.DOOR : 1e9; q.spot = q.x0 + 1.5;
    q.rows = q.rows.map((r, j) => { const o = { ...r, rid: rows.length, st: q.i }; if (q.id === 'S14') o.t = q.land - 1 + j * 0.01; rows.push(o);
      if (o.alt && o.alt.text) o.altD = textDims(o.alt.text); const k = o.kind || 'text'; if (k === 'text' || k === 'big') o.d = textDims(o.text); if (o.to) o.toD = o.to === '🥔' ? { lines: [], w: 1.4, h: R.BIG } : textDims(o.to); if (o.cap) o.capD = textDims(o.cap); return o; }); }
  if (R.READ_RECEIPT) { const q = last, o = { t: q.land - 0.96, who: 'S', kind: 'read', text: 'Delivered', id: 'receipt', to: 'Read 4:04', glow: 1e9, flip: 'press', rid: rows.length, st: q.i, right: true }; rows.push(o); q.rows.push(o); }
  else { const q = last, o = { t: q.land - 0.96, who: 'S', kind: 'read', text: 'Delivered', rid: rows.length, st: q.i, right: true }; rows.push(o); q.rows.push(o); }
  if (R.NEARLY && R.READ_RECEIPT) { const q = last, o = { t: 0, t1: 1e9, who: 'D', kind: 'dots', nearly: true, noCarry: true, rid: rows.length, st: q.i }; rows.push(o); q.rows.push(o); }   // (the foreman's dots: times come from his press, see nearlyAt)
  const byId = {}; for (const r of rows) if (r.id) byId[r.id] = r;
  const dark = []; if (R.LONG_FALL) { const a = steps[12], b = last; for (let k = 1; k <= 4; k++) { const f = k / 5, top = a.yt + (b.yt - a.yt) * f, x0 = a.x0 + (b.x0 - a.x0) * f; dark.push({ x0, x1: x0 + R.PW, yt: top, yb: top - R.PH, at: HUSH[k] }); } }
  const haz = HAZ.map(h => h.kind === 'line' ? { ...h, d: textDims(h.text), dSwap: h.swap ? textDims(h.swap) : null } : { ...h });
  const out = { C, steps, rows, byId, dark, haz, last }; PREP.set(C, out); return out;
}
const taken = (s, id) => !!(s.take && s.take[id] != null);
export const flipAt = (s, r) => !r.id || !taken(s, r.id) ? 1e9 : r.flip === 'press' ? s.take[r.id] : Math.max(r.glow, s.take[r.id]);
const flipped = (s, r, t) => r.to != null && t >= flipAt(s, r);
// what a row actually says right now
export function say(s, r, t) {
  let text = r.text, kind = r.kind || 'text', who = r.who, d = r.d, pic = r.pic;
  if (r.alt && !taken(s, r.alt.of)) { text = r.alt.text ?? text; kind = r.alt.kind ?? kind; who = r.alt.who ?? who; d = r.altD || d; }
  const f = flipped(s, r, t); if (f) { text = r.to; d = r.toD; }
  if (r.to === '🥔' && f) kind = 'big';
  return { text, kind, who, d, pic, mine: f };
}
const SOLID = k => k === 'text' || k === 'big' || k === 'photo';
const nearlyAt = s => s.take.receipt + R.NEARLY_IN;   // (when his dots start: from the press, not the song)
const isUp = (s, r, t) => { if (r.nearly) { if (!taken(s, 'receipt')) return false; const a = nearlyAt(s); return t >= a && t < a + R.NEARLY_FOR + 0.15; } if (t < r.t) return false; if (r.only && !taken(s, r.only.of)) return false; if (r.kind === 'dots' && r.taticat && !TATICAT_TYPES) return false; if (r.kind === 'dots' && t >= r.t1 + 0.15) return false; if (r.fall && t >= r.fall.at + 0.2) return false; return true; };
// the phone's thread at t: the rows on it, newest last, with their boxes in the world
export function stack(P, s, t, q) {
  const list = []; const prev = P.steps[q.i - 1];
  if (prev && q.id !== 'S14') { let carry = null; for (const r of prev.rows) { if (!isUp(s, r, t) || r.noCarry || r.kind === 'dots' || r.kind === 'sys' || r.kind === 'read' || r.kind === 'heart' || r.fall) continue; carry = r; } if (carry) list.push(carry);
    const left = s.leftAt && s.leftAt[prev.i]; if (left != null) for (const r of prev.rows) if (r.t > left && r !== carry && isUp(s, r, t)) list.push(r); }   // (he walked out early: the lines he left behind still reach him)
  for (const r of q.rows) if (isUp(s, r, t) && r.kind !== 'heart') list.push(r);
  const out = []; let lastWho = null;
  for (const r of list) { const v = say(s, r, t), k = v.kind; let h = 0, w = 0;
    if (k === 'text' || k === 'big') { const d = v.d || { w: 2, h: 1 }; h = k === 'big' ? R.BIG : d.h; w = k === 'big' ? 1.3 : d.w; }
    else if (k === 'photo') { const sz = r.small ? R.PHOTOS : R.PHOTO; h = sz + (r.capD ? r.capD.h + 0.08 : 0); w = sz * 1.3; }
    else if (k === 'dots') { h = 0.8; w = 1.5; } else if (k === 'sys') { h = R.GREY; w = R.PW - 1; } else if (k === 'read') { h = R.READ; w = 3; }
    const named = SOLID(k) && v.who !== 'H' && v.who !== lastWho || (k === 'dots' && v.who !== lastWho && v.who === 'T'); if (named) h += R.NAME; if (r.id === 'dud' && v.mine && GAGS.edited.on) h += 0.3;
    out.push({ r, v, h, w, named, x0: 0, x1: 0, y0: 0, y1: 0 }); if (SOLID(k)) lastWho = v.who; }
  let y = q.fl + R.STRIP + 0.05;
  for (let i = out.length - 1; i >= 0; i--) { const b = out[i], r = b.r; const inn = r.nearly ? ease((t - nearlyAt(s)) / R.ANIM) : q.id === 'S14' ? 1 : ease((t - r.t) / R.ANIM); const gone = r.fall ? 1 - ease((t - r.fall.at) / 0.2) : r.nearly ? 1 - ease((t - nearlyAt(s) - R.NEARLY_FOR) / 0.15) : r.kind === 'dots' ? 1 - ease((t - r.t1) / 0.15) : 1, k = inn * gone;
    b.y0 = y; b.y1 = y + b.h; b.pop = inn; const right = WHO[b.v.who] && WHO[b.v.who].right || r.right, m = 0.42; b.right = right; b.x0 = right ? q.x1 - m - b.w : q.x0 + m; b.x1 = b.x0 + b.w; if (b.v.kind === 'sys') { b.x0 = q.x0 + 0.5; b.x1 = q.x1 - 0.5; } y += (b.h + R.GAP) * k; }
  return out;
}
const platsOf = st => st.filter(b => SOLID(b.v.kind)).slice(-2).map(b => ({ b, id: b.r.rid, x0: b.x0, x1: b.x1, y: b.y1 - (b.named ? R.NAME : 0) }));
const stepOf = (P, s) => P.steps[Math.max(0, Math.min(P.steps.length - 1, s.st))];
const wheelOf = (q, s) => q.wheel && !(s.wheel && s.wheel[q.i] != null);

// ======== hazards: where a thing is at t (null = not on screen) ========
// (falling lines are real bubbles at full size, kept inside the glass. They only knock him at their middle R.LINEHIT: he's a ghost, the edges go through him)
const lineX = (h, s, q) => { const w = h.d.w / 2 + 0.15; return clamp(s.x + h.aim, q.x0 + w, q.x1 - w); };
export function hazAt(P, h, s, t) {
  const q = P.steps[h.st], st = s.hz && s.hz[h.id]; if (h.only && !taken(s, h.only)) return null;
  if (h.kind === 'line') { if (t < h.shake) return null; const d = h.dSwap && taken(s, h.swapOf) ? h.dSwap : h.d, ww = d.w, hh = d.h, x = st && st.x != null ? st.x : lineX(h, s, q), y0 = st && st.y0 != null ? st.y0 : q.yt - R.HEAD - hh - 0.15, xr = st && st.xr != null ? st.xr : x;
    if (t < h.at) { if (h.fromRow) return null; const k = 1; return { kind: 'line', x, y: y0, w: ww, h: hh, d, shake: k, falling: false }; }
    const dt = t - h.at, y = y0 - 0.5 * R.LINEG * dt * dt, ty = q.fl + 0.05, tl = Math.sqrt(2 * Math.max(0.1, y0 - ty) / R.LINEG), k = clamp(dt / tl), xx = xr + (x - xr) * ease(k); if (y <= ty) { const age = dt - tl; return age > 0.18 ? null : { kind: 'line', x: xx, y: ty, w: ww, h: hh, d, falling: false, broke: age / 0.18 }; }
    return { kind: 'line', x: xx, y, w: ww, h: hh, d, falling: true }; }
  if (h.kind === 'roll') { if (t < h.at) return null; const xs = q.x0 + (h.x ?? (h.dir > 0 ? 0.8 : R.PW - 0.8)), yt = q.yt - R.HEAD;
    if (t < h.floorAt) { const k = ease((t - h.at) / (h.floorAt - h.at)); return { kind: 'roll', x: xs, y: yt + (q.fl + R.ROLL_R - yt) * (k * k), r: R.ROLL_R, rot: 0 }; }
    const x = xs + h.dir * h.v * (t - h.floorAt); if (x < q.x0 + 0.3 || x > q.x1 - 0.3) return null; return { kind: 'roll', x, y: q.fl + R.ROLL_R, r: R.ROLL_R, rot: h.dir * (t - h.floorAt) * h.v / R.ROLL_R }; }
  return null;
}

// ======== the rules ========
export const mode = {
  init(s, api) {
    G0.mode.init(s, api); s.jlog = s.jlog || [];
    if (s.t >= R.WAKE) startStairs(s, s.t, api);
  },
  step(s, inp, t, api) {
    if (t < R.WAKE) { G0.mode.step(s, inp, t, api); return; }
    const C = api.C, P = prep(C), B = R.B;
    if (!s.sOn) startStairs(s, t, api);
    const log = (k, ex) => s.jlog.push({ t, k, ...ex });
    s.blink = Math.max(0, (s.blink || 0) - 1 / 120);
    if (t - (s.useT ?? -9) > 0.2) s.charge = true;
    s.gone = false; s.ducking = false;
    // ---- the glide: from the lock glass down onto James's phone, feet touch on "ha" ----
    if (s.m === 'glide') { const q = P.steps[0], k = ease5((t - R.WAKE) / (R.S1 - R.WAKE)), g = s.glide; s.x = g.x + (q.spot - g.x) * k; s.y = g.y + (q.fl - g.y) * k + Math.sin(k * Math.PI) * 0.8; s.facing = 0.4; s.walking = false; s.ground = true; s.vy = 0;
      if (t >= R.S1) { s.m = 'on'; s.x = q.spot; s.y = q.fl; s.landAt = t; s.ground = true; log('land', { st: 0 }); } return; }
    // ---- the drop: a fixed arc, the keys don't steer it ----
    if (s.m === 'drop') { const q = P.steps[s.st], n = P.steps[s.st + 1], k = clamp((t - s.dropT) / s.dropDur), f = s.dropFrom; const X1 = n.spot, Y1 = n.fl, hump = Math.max(0, Math.min(0.5, (f.y - Y1) * 0.12));
      s.x = f.x + (X1 - f.x) * (k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k)); s.y = f.y + (Y1 - f.y) * (k * k) + hump * Math.sin(k * Math.PI); s.walking = false; s.facing = 0.7; s.ground = true; s.vy = 0;
      spinKeys(s, inp, t, log);
      if (k >= 1) { s.st++; s.m = 'on'; s.x = X1; s.y = Y1; s.vx = 0; s.ground = true; s.on = null; s.landAt = t; s.vyIn = -8; s.typed = 0; log('land', { st: s.st }); }
      s.phase = t < s.phaseUntil ? 0.6 : 0; return; }
    // ---- on a phone ----
    const q = stepOf(P, s), st = stack(P, s, t, q), plats = platsOf(st), byId = new Map(plats.map(p => [p.id, p]));
    const lastStep = q.leave == null;
    const hx = (inp.Rh ? 1 : 0) - (inp.Lh ? 1 : 0), acc = s.ground ? R.ACCG : R.ACCA;
    s.vx += clamp(hx * R.WALK - s.vx, -acc / 120, acc / 120);
    if (s.hurtUntil != null && t < s.hurtUntil) s.vx = 0;
    if (inp.J) { if (s.ground || t - s.coyT < R.COY) { s.vy = Math.sqrt(2 * R.GRAV * R.HOP); s.ground = false; s.on = null; s.jumpedAt = t; s.coyT = -9; s.hop2 = false; s.backAt = null; log('hop'); }
      else if (!s.hop2 && t - (s.jumpedAt ?? -9) >= 0.08) { s.vy = Math.max(s.vy, R.V2); s.hop2 = true; s.doubleAt = t; log('flip'); } }
    if (inp.D && s.ground && s.on != null) { s.dropId = s.on; s.dropUntil = t + R.DROP; s.ground = false; s.on = null; s.vy = -2.5; s.backAt = null; log('down'); }
    spinKeys(s, inp, t, log);
    if (t < (s.spinUntil ?? -9) && t - s.spinAt < 1 / 60 && wheelOf(q, s) && s.x >= q.x1 - R.WHEEL_R) { s.wheel = { ...s.wheel, [q.i]: t }; s.react = { name: 'smirk', dur: 0.5, at: t }; log('wheel', { st: q.i }); }
    // ---- SPACE ----
    if (inp.G) space(P, s, t, q, st, plats, byId, log);
    if (R.BLINK_BACK && s.backAt != null && t >= s.backAt) { s.backAt = null; if (s.on != null) { s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.y = q.fl; s.on = null; s.ground = true; s.vy = 0; } }
    // ---- moving ----
    let nx = s.x + s.vx / 120; const canDoor = !lastStep && t >= q.door && (!wheelOf(q, s) || q.wheel.free);
    const xa = q.x0 + 0.6, xb = q.x1 - 0.6;
    if (nx > xb) { if (canDoor && hx > 0 && s.y < q.fl + R.STRIP) return leave(P, s, t, q, log); nx = xb; s.vx = 0; } if (nx < xa) { nx = xa; s.vx = 0; }
    if (s.ground && s.on == null && Math.abs(nx - s.x) > 1e-4) { s.typed = (s.typed || 0) + Math.abs(nx - s.x); s.typedT = t; } s.x = nx; s.walking = s.ground && Math.abs(s.vx) > 0.4; if (Math.abs(s.vx) > 0.4) s.facing = Math.sign(s.vx) * 0.95; else if (s.ground) s.facing = q.quiet || q.kev ? 0.1 : 0.45;
    if (s.on != null) { const p = byId.get(s.on); if (!p) { s.on = null; s.ground = false; s.vy = 0; } else if (s.x < p.x0 - R.FOOT || s.x > p.x1 + R.FOOT) { s.on = null; s.ground = false; s.vy = 0; s.coyT = t; } else { s.y = p.y; if (p.b.r.pop && !(s.pop && s.pop[p.id])) { s.pop = { ...s.pop, [p.id]: t }; log('pop'); } } }
    else if (s.y > q.fl + 1e-6 || !s.ground) { const was = s.ground; s.ground = false; if (was) s.coyT = t; s.vy = Math.max(s.vy - R.GRAV / 120, -R.FALL); const ny = s.y + s.vy / 120;
      if (s.vy <= 0) { let land = null; for (const p of plats) { if (p.id === s.dropId && t < s.dropUntil) continue; if (s.x >= p.x0 - R.FOOT && s.x <= p.x1 + R.FOOT && s.y >= p.y - 0.02 && ny <= p.y + 0.02 && (!land || p.y > land.y)) land = p; }
        if (land) { s.y = land.y; s.vyIn = s.vy; s.vy = 0; s.ground = true; s.on = land.id; s.landAt = t; s.hop2 = false; if (land.b.r.pop && !(s.pop && s.pop[land.id])) { s.pop = { ...s.pop, [land.id]: t }; log('pop'); } }
        else if (ny <= q.fl) { s.y = q.fl; s.vyIn = s.vy; s.vy = 0; s.ground = true; s.on = null; s.landAt = t; s.hop2 = false; } else s.y = ny; } else s.y = ny; }
    else { s.y = q.fl; s.ground = true; }
    hazards(P, s, t, q, log);
    if (!lastStep) { if (t >= q.leave - R.TIP && t < q.leave && s.ground && s.on == null) s.x = Math.min(xb, s.x + 3.2 / 120);
      if (t >= q.leave) return leave(P, s, t, q, log); }
    s.phase = t < s.phaseUntil ? 0.6 : 0;
  },
};
function spinKeys(s, inp, t, log) {
  for (const k of ['L', 'R']) if (inp[k]) { if (s.tapK === k && t - s.tapT <= R.DBL && t - (s.spinAt ?? -9) >= R.SPINCD) { s.spinAt = t; s.spinUntil = t + R.SPIN; s.tapK = null; log('spin'); } else { s.tapK = k; s.tapT = t; } }
}
function space(P, s, t, q, st, plats, byId, log) {
  if (t < (s.noG ?? -9)) { s.fizzAt = t; log('fizzle'); return; }
  const g = [...st].reverse().find(b => b.r.to != null && b.r.id && !taken(s, b.r.id) && t >= b.r.t + R.GLOWIN && t <= b.r.glow && (b.r.id !== 'receipt' || R.READ_RECEIPT));
  if (g) { s.charge = false; s.useT = t; s.glitchAt = t; s.phaseUntil = t + R.PHASE; s.take = { ...s.take, [g.r.id]: t }; s.glitched = (s.glitched || 0) + 1; log('take', { id: g.r.id });
    s.react = { name: ['smirk', 'laugh', 'smirk', 'wide'][g.r.rid % 4], dur: 0.7, at: t };
    if (SOLID(g.v.kind)) { const p = plats.find(p => p.id === g.r.rid); if (p) { s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.x = clamp((p.x0 + p.x1) / 2, q.x0 + 0.6, q.x1 - 0.6); s.y = p.y; s.on = p.id; s.ground = true; s.vy = 0; s.vx = 0; s.backAt = R.BLINK_BACK ? t + R.BLINK_BACK : null; s.phaseUntil = t + R.BLINK_BACK + 0.25; } }
    return; }
  const newest = [...st].reverse().find(b => SOLID(b.v.kind)); if (newest && (newest.r.kev || q.quiet) && newest.r.kev) { s.slide = { rid: newest.r.rid, t }; log('slide'); return; }
  log('fizz'); if (t - (s.fizzT ?? -9) < R.FIZZCD) return;   // (a masher only goes purple now and then: a fizz has a cooldown, a glowing text never does)
  s.fizzT = t; s.fizzAt = t; s.charge = false; s.useT = t; s.glitchAt = t; s.phaseUntil = t + R.PHASE;
}
function leave(P, s, t, q, log) {
  if (q.leave == null) return;
  if (wheelOf(q, s) && !q.wheel.free) { s.squashAt = t; s.react = { name: 'shock', dur: 0.6, at: t }; log('jam', { st: q.i }); s.wheel = { ...s.wheel, [q.i]: -1 }; }
  if (s.ground && !s.on && t < q.leave - 0.02) s.leftAt = { ...s.leftAt, [q.i]: t };
  s.m = 'drop'; s.dropT = t; s.dropDur = q.fall; s.dropFrom = { x: s.x, y: s.y }; s.on = null; s.backAt = null; s.vx = 0; log('drop', { st: q.i });
  if (q.id === 'S4') s.rideT = t;
  if (q.id === 'S10') { s.glitchAt = t; s.useT = t; s.charge = false; s.phaseUntil = t + q.fall; log('tear'); }   // (he goes down through the question on his own: no press, Petunia's next either way)
}
function hazards(P, s, t, q, log) {
  const purple = t < s.phaseUntil, H = R.HT;
  for (const h of P.haz) { if (h.st !== q.i) continue; const st = s.hz[h.id] || (s.hz[h.id] = {}); if (st.done) continue;
    if (h.kind === 'line' && st.x == null && t >= h.shake + (h.late ? (h.at - h.shake - h.late) : 0)) st.x = lineX(h, s, q);
    if (h.fromRow && st.y0 == null && t >= h.at - 1 / 60) { const b = stack(P, s, h.at - 0.01, q).find(b => b.r.fall && b.v.text === h.text); if (b) { st.y0 = b.y0; st.xr = (b.x0 + b.x1) / 2; } }
    const g = hazAt(P, h, s, t); if (!g) continue; let hit = false;
    if (g.kind === 'line' && g.falling) hit = s.x + R.HW > g.x - R.LINEHIT / 2 && s.x - R.HW < g.x + R.LINEHIT / 2 && s.y + H > g.y && s.y < g.y + g.h;
    if (g.kind === 'roll' && t >= h.floorAt) hit = Math.abs(s.x - g.x) < 0.3 + g.r * 0.7 && s.y < g.y + g.r * 0.9 && s.y + H > g.y - g.r;
    if (!hit) continue; st.done = true;
    if (purple) { log('thru', { h: h.id }); continue; }
    if (h.free) { s.react = { name: 'startled', dur: 0.4, at: t }; log('flinch'); continue; }
    const dir = g.kind === 'roll' ? h.dir : s.x >= g.x ? 1 : -1; s.x = clamp(s.x + dir * R.KNOCK, q.x0 + 0.6, q.x1 - 0.6); if (g.kind === 'line') s.noG = t + R.B; s.knockAt = t; s.hurtUntil = t + 0.2; s.react = { name: 'shock', dur: 0.5, at: t }; log('knock', { h: h.id });
    if (h.icon === 'block' && GAGS.blockHalo.on) s.halo = t; }
}
function startStairs(s, t, api) {
  const P = prep(api.C);
  Object.assign(s, { sOn: true, st: 0, m: 'on', take: {}, wheel: {}, hz: {}, pop: {}, leftAt: {}, on: null, vx: 0, vy: 0, ground: true, charge: true, useT: -9, phaseUntil: -9, spinAt: -9, spinUntil: -9, hop2: false, coyT: -9, glitched: 0, dropId: null, dropUntil: -9, backAt: null, tapK: null, tapT: -9 });
  if (t <= R.WAKE + 0.05) { s.m = 'glide'; s.glide = { x: fromX(P), y: P.steps[0].fl + 2.4 }; s.x = s.glide.x; s.y = s.glide.y; s.blink = 0.22; return; }
  let i = 0; for (const q of P.steps) if (q.land <= t + 0.05) i = q.i; s.st = i; const q = P.steps[i];
  for (const r of P.rows) if (r.id && r.id !== 'receipt' && r.glow < t) s.take[r.id] = r.glow;   // (a seek: what came before went right, his)
  for (const q2 of P.steps) if (q2.i < i && q2.wheel) s.wheel[q2.i] = 0;
  for (const h of P.haz) if (h.st < i || h.at < t) s.hz[h.id] = { done: true };
  s.x = q.spot; s.y = q.fl; s.facing = 0.45;
}
const fromX = P => P.steps[0].x0 + R.PW / 2;

// ======================================================================================================================================
// THE LOOK. Quiet. A street going downhill at night; phones stepping down it. One phone awake, its real chat in four colours. Everything else dim and letterless.
// The strip over the input bar is sacred: nothing is drawn in it but him and what falls. No white lines. Purple is only his.
// ======================================================================================================================================
const INK = '#120a05', PURP = ['#7b3cf2', '#9a52ff', '#e03ccf', '#c9a7ff'], LILAC = '#c9a7ff', DEEP = '#2a0f63', WARM = '#ffcf7a';
const FEET = 'krrzzt wh@t?! s0r—t@ h@ndsh— tzzk 0xF00D// y3a—h ';
const OWN = { J: '#3b7ee6', S: '#f0675a', C: '#c9a24a', P: '#6fae96', D: '#5f6f86', T: '#8a6bd6' };
const UI = { scr: '#0b0b10', grey: '#2f2f33', greyInk: '#f2f2f7', dot: '#c9c9d2', bar: '#1c1c1e', field: '#26262b', line: '#38383a', sub: '#8e8e93', ink: '#f2f2f7', key: '#17171b', kbd: '#101014', hdr: '#141418', tread: '#3a3f5c', typed: LILAC, foot: LILAC, wheel: '190,190,200', dog: '#1b1c26', dog2: '#141520', heart: '#2c2c2e' };
const LT = { scr: '#ffffff', grey: '#e9e9eb', greyInk: '#0b0b0f', dot: '#8e8e93', bar: '#1f2029', field: '#30323e', line: '#d6d6dc', sub: '#77777f', ink: '#0b0b0f', key: '#2a2c37', kbd: '#1a1b23', hdr: '#f6f6f8', tread: '#120a05', typed: PURP[0], foot: LILAC, wheel: '70,70,80', dog: '#ecdcc6', dog2: '#d6bf9f', heart: '#e5e5ea' };
let M = UI;   // (the palette of the phone being drawn: LT only on the live phone. Everything asleep is UI)
const FONT = (px, w = 600) => `${w} ${Math.max(1, Math.round(px))}px -apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, "Apple Color Emoji", sans-serif`;
const HIS = px => `400 ${Math.max(1, Math.round(px))}px "Major Mono Display", ui-monospace, monospace`;
function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const mixC = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
function dogShape(x, cx, cy, r) { x.beginPath(); x.ellipse(cx, cy, r, r * 0.9, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx - r * 0.85, cy - r * 0.25, r * 0.3, r * 0.55, 0.4, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + r * 0.85, cy - r * 0.25, r * 0.3, r * 0.55, -0.4, 0, 7); x.fill(); }
function dogWall(x, cx, cy, r) {   // her dog's silhouette (Chikin: "the dog silhouette screensaver"), the wallpaper Petunia eats: sitting side-on, one flat shape, one ear, a collar. Pale, so it sits behind a chat
  x.fillStyle = M.dog; const el = (a, b, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx + a * r, cy + b * r, rx * r, ry * r, rot, 0, 7); x.fill(); };
  el(0.2, -0.5, 0.44, 0.42); el(0.72, -0.38, 0.36, 0.2, 0.12); el(-0.08, 0.5, 0.52, 0.88, 0.22); el(-0.45, 1.22, 0.58, 0.42); x.fillRect(cx + 0.12 * r, cy + 0.6 * r, 0.26 * r, 1.04 * r); x.fillRect(cx + 0.12 * r, cy + 1.54 * r, 0.42 * r, 0.12 * r);
  x.strokeStyle = M.dog; x.lineWidth = 0.16 * r; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 0.9 * r, cy + 1.3 * r); x.quadraticCurveTo(cx - 1.4 * r, cy + 1.2 * r, cx - 1.3 * r, cy + 0.62 * r); x.stroke();
  x.fillStyle = M.dog2; el(-0.06, -0.3, 0.17, 0.38, 0.22); x.save(); x.translate(cx + 0.14 * r, cy - 0.08 * r); x.rotate(0.28); x.fillRect(-0.34 * r, -0.05 * r, 0.68 * r, 0.11 * r); x.restore(); }
function photo(key) {   // code-drawn snaps: the pantry shelf, Biscuit, the porch light
  const c = document.createElement('canvas'), W = c.width = 390, H = c.height = 300, x = c.getContext('2d'), sky = (a, b) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  if (key === 'pantry') { sky('#3a2d22', '#20180f'); x.fillStyle = '#6b4a2c'; for (const y of [0.3, 0.72]) { x.fillRect(0, H * y, W, H * 0.05); } x.fillStyle = '#8c6a3f'; for (let i = 0; i < 4; i++) { x.fillRect(W * (0.08 + i * 0.22), H * 0.12, W * 0.14, H * 0.18); }
    x.fillStyle = '#b08d57'; x.beginPath(); x.moveTo(W * 0.3, H * 0.72); x.quadraticCurveTo(W * 0.24, H * 0.42, W * 0.42, H * 0.4); x.lineTo(W * 0.6, H * 0.4); x.quadraticCurveTo(W * 0.78, H * 0.45, W * 0.72, H * 0.72); x.closePath(); x.fill();
    x.fillStyle = '#da9643'; for (const [a, b] of [[0.45, 0.4], [0.53, 0.37], [0.6, 0.41]]) { x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.ellipse(W * a, H * b, 28, 20, 0.3, 0, 7); x.fill(); x.stroke(); } }
  else if (key === 'dog') { sky('#d8c6ad', '#a89276'); x.fillStyle = '#8a5a32'; dogShape(x, W * 0.5, H * 0.52, H * 0.34); x.fillStyle = '#efe2cf'; x.beginPath(); x.ellipse(W * 0.5, H * 0.62, H * 0.15, H * 0.1, 0, 0, 7); x.fill(); x.fillStyle = '#1b120c'; x.beginPath(); x.ellipse(W * 0.5, H * 0.58, H * 0.05, H * 0.035, 0, 0, 7); x.fill(); for (const e of [-0.12, 0.12]) { x.beginPath(); x.arc(W * 0.5 + e * H, H * 0.46, H * 0.03, 0, 7); x.fill(); } x.fillStyle = '#d23a2e'; x.fillRect(W * 0.5 - H * 0.2, H * 0.74, H * 0.4, H * 0.045); }
  else if (key === 'porch') { sky('#141a33', '#0b0f1f'); x.fillStyle = '#3c2a20'; x.fillRect(W * 0.3, H * 0.18, W * 0.34, H * 0.66); x.fillStyle = '#5c4434'; x.fillRect(W * 0.33, H * 0.22, W * 0.28, H * 0.62); const gl = x.createRadialGradient(W * 0.76, H * 0.25, 2, W * 0.76, H * 0.25, H * 0.55); gl.addColorStop(0, 'rgba(255,214,120,0.9)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gl; x.fillRect(0, 0, W, H); x.fillStyle = '#fff2c0'; x.beginPath(); x.arc(W * 0.76, H * 0.25, H * 0.05, 0, 7); x.fill(); x.fillStyle = '#6b6058'; x.fillRect(W * 0.15, H * 0.84, W * 0.7, H * 0.06); }
  return c;
}
export const modeView = ({ T, world: W3, C, cam }) => {
  const P = prep(C), B = R.B, steps = P.steps;
  const g0 = new T.Group(); W3.add(g0); const v0 = G0.modeView({ T, world: g0, C, cam });   // (the current Ghost's view, for the opening only)
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1000; const g = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace; tex.minFilter = T.LinearFilter;
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: false, depthWrite: false, depthTest: false })); mesh.renderOrder = -5; mesh.frustumCulled = false; W3.add(mesh);
  const img = src => { if (typeof Image === 'undefined' || !src) return null; const im = new Image(); im.src = new URL('../' + src, import.meta.url).href; return im; };
  const PICS = { pet1: img('easter/petunia-square.jpg'), pet2: img('easter/petunia-2-square.jpg'), pet3: img('easter/petunia-3-square.jpg'), pet4: img('easter/petunia-4-square.jpg'), pantry: photo('pantry'), dog: photo('dog'), porch: photo('porch') };
  const okImg = im => im && (im.getContext || (im.complete && im.naturalWidth));
  const iw = im => im.naturalWidth || im.width, ih = im => im.naturalHeight || im.height;
  let vw = 16, vh = 10, z = 1, cx = 0, cy = 0, u = 50, left = 0, top = 0;
  const X = wx => (wx - left) * u, Y = wy => (top - wy) * u;
  const TS = 40, font = (sz, w) => { g.font = FONT(sz * TS, w); }, fillT = (str, x, y) => { g.save(); g.translate(x, y); g.scale(1 / TS, 1 / TS); g.fillText(str, 0, 0); g.restore(); };
  // ---------------- the camera: fixed to the step; it only moves with him, in the drop ----------------
  const camOf = (q, VWd) => q.leave == null && q.id === 'S14' ? [q.x0 + R.PW / 2, q.fl + (R.FLOOR - 0.5) * R.VH] : [q.x0 + VWd / 2 - R.LEFT, q.fl + (R.FLOOR - 0.5) * R.VH];
  function camera(f) {
    const { s, t } = f; vw = cam.right - cam.left; vh = cam.top - cam.bottom;
    const VWd = R.VH * vw / vh, q = steps[Math.max(0, s.st)]; let [x, y] = camOf(q, VWd), zz = vh / R.VH;
    if (s.m === 'drop') { const n = steps[s.st + 1], k = ease5((t - s.dropT) / Math.max(0.7, s.dropDur + 0.26)), c1 = camOf(n, VWd); x += (c1[0] - x) * k; y += (c1[1] - y) * k; }
    else if (s.dropT != null && s.st > 0) { const k = ease5((t - s.dropT) / Math.max(0.7, steps[s.st - 1].fall + 0.26)); if (k < 1) { const c0 = camOf(steps[s.st - 1], VWd); x = c0[0] + (x - c0[0]) * k; y = c0[1] + (y - c0[1]) * k; } }
    if (t < R.S1 + R.PULL && s.st === 0) { const k = ease5((t - R.S1) / R.PULL), q0 = steps[0], x0 = q0.x0 + R.PW / 2, y0 = (q0.yt + q0.yb) / 2, z0 = vh / (R.PH * 1.03); x = x0 + (x - x0) * k; y = y0 + (y - y0) * k; zz = Math.exp(Math.log(z0) + (Math.log(zz) - Math.log(z0)) * k); }
    z = zz; cx = x; cy = y; cam.up.set(0, 1, 0); cam.zoom = z; cam.position.set(cx, cy, 10); cam.lookAt(cx, cy, 0); cam.updateProjectionMatrix();
  }
  function fitCanvas() { const W = 1600, H = Math.round(W * vh / vw); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; tex.dispose(); }   // (a canvas that changes size needs a new texture, or the old one's height leaves a band)
    u = cv.width / (vw / z); left = cx - vw / (2 * z); top = cy + vh / (2 * z); mesh.position.set(cx, cy, -2); mesh.scale.set(vw / z, vh / z, 1); }
  // ---------------- the street: one thing happens, very slowly (SCRIPT §4). It changes only between steps ----------------
  const HOUSES = (() => { const out = []; for (let i = 0; i < 44; i++) { const wx = -16 + i * 4.1 + hash(i, 1) * 1.6, wy = hillY(wx) - 3.5 - hash(i, 2) * 1.5, w = 2.2 + hash(i, 3) * 1.8, h = 1.8 + hash(i, 4) * 1.5; out.push({ wx, wy, w, h, i, lit: hash(i, 5) }); } return out; })();
  function hillY(wx) { const a = steps[0], b = steps[steps.length - 1]; return a.yb + (wx - a.x0) * (b.yb - a.yb) / (b.x0 - a.x0); }
  function street(f) {
    const { t, s } = f, W = cv.width, H = cv.height; g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#0a0e1e'; g.fillRect(0, 0, W, H);   // (flat night: the old level's table at the same hour, no glow in the sky. Lights do the telling)
    g.fillStyle = '#070a16'; g.beginPath(); g.moveTo(X(left - 2), Y(hillY(left - 2) - 3)); for (let wx = left - 2; wx <= left + W / u + 2; wx += 2) g.lineTo(X(wx), Y(hillY(wx) - 3 + Math.sin(wx * 0.4) * 0.35)); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    const left1 = left - 4, right1 = left + W / u + 4;
    for (const h of HOUSES) { if (h.wx < left1 || h.wx > right1) continue; const x0 = X(h.wx), y1 = Y(h.wy), w = h.w * u, hh = h.h * u, pk = x0 + w * (0.42 + hash(h.i, 6) * 0.16), ry = y1 - hh, rh = (0.65 + hash(h.i, 7) * 0.3) * u;
      g.fillStyle = '#05070f'; g.fillRect(x0, ry, w, hh + 60); g.beginPath(); g.moveTo(x0 - 0.2 * u, ry); g.lineTo(pk, ry - rh); g.lineTo(x0 + w + 0.2 * u, ry); g.closePath(); g.fill();
      if (hash(h.i, 8) > 0.5) g.fillRect(x0 + w * 0.72, ry - rh * 0.9, 0.26 * u, rh * 0.8);
      g.strokeStyle = '#1a2142'; g.lineWidth = Math.max(1.5, 0.07 * u); g.lineCap = 'round'; g.beginPath(); g.moveTo(pk, ry - rh); g.lineTo(x0 + w + 0.2 * u, ry); g.stroke();   // (one lit roof edge: the moon nobody draws)
      for (const wxx of [0.25, 0.58]) { g.fillStyle = '#0b0f20'; g.fillRect(x0 + w * wxx, y1 - hh * 0.75, w * 0.18, hh * 0.28); } }
    const left2 = TORCHES[Math.min(TORCHES.length - 1, Math.max(0, s.st))] ?? 0;
    for (let i = 0; i < 70; i++) { if (hash(i, 9) > left2) continue; const wx = -16 + i * 2.1 + Math.sin(t * 0.3 + i) * 0.5; if (wx < left1 || wx > right1) continue; const wy = hillY(wx) - 2.6 - hash(i, 10) * 1.3, a = -0.4 + Math.sin(t * 0.6 + i * 2) * 0.5, L = 1.1 * u;
      g.save(); g.translate(X(wx), Y(wy)); g.rotate(a); g.fillStyle = 'rgba(240,235,200,0.15)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(L, -0.16 * L); g.lineTo(L, 0.16 * L); g.closePath(); g.fill(); g.fillStyle = '#f0ebc8'; g.fillRect(-1, -1, 2.5, 2.5); g.restore(); }
    // the porch: his house at the bottom of the hill, the only warm thing. Two flat bands of light, a shut door, a lamp. It never glitches
    const L1 = steps[steps.length - 1], px = X(L1.x0 - 3.5), py = Y(L1.fl - 3);
    const hx = px - 2.7 * u, hy = py - 1.5 * u, hw = 3.6 * u, hh2 = 4.4 * u; g.fillStyle = '#05070f'; g.fillRect(hx, hy, hw, hh2); g.beginPath(); g.moveTo(hx - 0.3 * u, hy); g.lineTo(hx + hw * 0.46, hy - 1.3 * u); g.lineTo(hx + hw + 0.3 * u, hy); g.closePath(); g.fill();
    g.save(); g.beginPath(); g.rect(hx, hy, hw, hh2); g.clip(); for (const [r, col] of [[2.3, '#2a1a0c'], [1.15, '#4f3115']]) { g.fillStyle = col; g.beginPath(); g.arc(px, py, r * u, 0, 7); g.fill(); } g.restore();   // (the lamp's light on his wall, flat, stops at the corner)
    g.fillStyle = '#1b1109'; g.fillRect(px - 1.15 * u, py - 0.45 * u, 0.85 * u, 2 * u); g.fillStyle = 'rgba(255,207,122,0.55)'; g.fillRect(px - 0.3 * u, py - 0.45 * u, Math.max(1.5, 0.06 * u), 2 * u);
    g.fillStyle = WARM; g.beginPath(); g.arc(px, py - 0.1 * u, Math.max(2.5, 0.11 * u), 0, 7); g.fill();
  }
  // ---------------- a phone ----------------
  function shell(q, lit) { const c = lit ? OWN[q.owner] : mixC(OWN[q.owner] || '#555555', '#0a0c18', 0.8);
    g.setTransform(u, 0, 0, u, X(q.x0), Y(q.yt)); g.fillStyle = INK; rr(g, -0.1, -0.1, R.PW + 0.2, R.PH + 0.2, 0.74); g.fill(); g.fillStyle = c; rr(g, 0, 0, R.PW, R.PH, 0.68); g.fill(); g.fillStyle = lit ? M.scr : '#090a11'; rr(g, 0.16, 0.16, R.PW - 0.32, R.PH - 0.32, 0.54); g.fill(); }
  // the light a white screen throws on the street: one flat band, no soft glow (Vega: flat colour + one band)
  function pool(q, a) { if (a <= 0) return; g.setTransform(u, 0, 0, u, X(q.x0), Y(q.yt)); g.globalAlpha = a; const m = 0.8; g.fillStyle = '#10152e'; rr(g, -m, -m, R.PW + 2 * m, R.PH + 2 * m, 0.74 + m); g.fill(); g.globalAlpha = 1; }
  // a screen going to sleep / waking: the glass comes over it
  function glass(q, a) { if (a <= 0) return; g.setTransform(u, 0, 0, u, X(q.x0), Y(q.yt)); g.fillStyle = '#090a11'; g.globalAlpha = a; rr(g, 0.16, 0.16, R.PW - 0.32, R.PH - 0.32, 0.54); g.fill(); g.globalAlpha = 1; }
  // ★ the stuck pixel: one purple pixel in the glass of every phone he's been through. It's in the dark glass, so it can't compete with a chat, and it's the only thing that outlives the power button (R.DEAD_PIXEL)
  function deadPixel(id, low) { if (!R.DEAD_PIXEL) return; const px = low ? 0.9 + hash(id, 21) * 1.4 : 3.4 + hash(id, 21) * 2.8, py = low ? R.PH - 1.1 : 5.5 + hash(id, 22) * 6.5, sz = 0.17;   // (the right of the glass, below the top: the part of the last phone the camera still sees)
    g.fillStyle = PURP[1]; g.fillRect(px, py, sz, sz); }
  function dim(q, f, off) {   // asleep: black glass, a notch, one faint tread. No letters and no shapes: less on screen, and the next phone's typing dots have the glass to themselves
    const { t, s } = f; M = UI; shell(q, false); const yFl = R.FLOOR_Y; g.fillStyle = '#000'; rr(g, R.PW / 2 - 0.75, 0.26, 1.5, 0.3, 0.15); g.fill();
    if (!off) { g.fillStyle = '#2b2f47'; g.fillRect(0.16, yFl, R.PW - 0.32, 0.06); }
    if (q.i < s.st || (q.i === s.st && s.m === 'drop')) deadPixel(q.i);
    if (t >= 33.22 && t < 33.5 && q.i > 2) { g.fillStyle = PURP[1]; g.beginPath(); g.arc(R.PW / 2 + 1.4, 1.1, 0.12, 0, 7); g.fill(); }
    const prev = steps[q.i - 1]; if (prev && prev.leave != null && t >= prev.door && t < prev.leave + prev.fall && s.st <= prev.i && (q.id !== 'S12' || t >= 98.75)) typing(R.PW - 2.3 + -2.6, yFl - 1.1 - 0.4, 1, t);
  }
  function typing(x, y, a, t) { const ink = M.dot; g.globalAlpha = a; g.fillStyle = M.grey; rr(g, x, y, 1.5, 0.8, 0.4); g.fill(); for (let i = 0; i < 3; i++) { const w = 0.5 + 0.5 * Math.sin((t - i * 0.11) * 2 * Math.PI / (2 * B)); g.globalAlpha = a * (0.45 + 0.55 * w); g.fillStyle = ink; g.beginPath(); g.arc(x + 0.4 + i * 0.35, y + 0.4 - w * 0.06, 0.1, 0, 7); g.fill(); } g.globalAlpha = 1; }
  function live(q, f) {
    const { t, s } = f; M = R.LIGHT && q.id !== 'S14' ? LT : UI; shell(q, true);
    const isS = q.owner === 'S', petT = isS ? (q.petunia === 0 ? 0 : q.petunia ?? (q.i > 9 ? 0 : null)) : null, pet = okImg(PICS.pet4) ? PICS.pet4 : null;
    // the wallpaper: her dog's shape, until Petunia eats it
    g.save(); rr(g, 0.16, 0.16, R.PW - 0.32, R.PH - 0.32, 0.54); g.clip();
    if (q.dog) dogWall(g, R.PW / 2, 4.9, 1.9);
    if (petT != null && pet) { const k = clamp((t - petT) / 0.5), hold = petT > 0 ? 1 - 0.8 * ease((t - petT - 1.25) / 0.5) : 0.2, rad = 15 * k, cxx = q.spot - q.x0, cyy = R.FLOOR_Y; g.save(); g.beginPath(); g.arc(cxx, cyy, rad + 0.01, 0, 7); g.clip(); g.globalAlpha = hold; const sc = Math.max(R.PW / iw(pet), R.PH / ih(pet)); g.drawImage(pet, (R.PW - iw(pet) * sc) / 2, (R.PH - ih(pet) * sc) / 2, iw(pet) * sc, ih(pet) * sc); g.globalAlpha = 1; g.restore(); }
    g.restore();
    header(q, f);
    // the thread: the rows; older ones go under the header
    const st = stack(P, s, t, q); g.save(); g.beginPath(); g.rect(0.16, R.HEAD, R.PW - 0.32, R.FLOOR_Y - R.HEAD); g.clip();
    st.forEach((b, i) => { const n = st[i + 1]; b.tail = SOLID(b.v.kind) && !(n && SOLID(n.v.kind) && n.v.who === b.v.who); row(q, b, f); }); hearts(q, st, f);
    g.restore();
    // falling lines + rollers
    for (const h of P.haz) if (h.st === q.i) { const gm = hazAt(P, h, s, t); if (gm && !(s.hz[h.id] && s.hz[h.id].done && gm.kind === 'roll')) hazard(q, h, gm, t); }
    // the falling truth: "james LOOK at your phone" lands on the bar, and the bar gives
    const fr = q.rows.find(r => r.fall && r.id == null && !r.only); if (fr && t >= fr.fall.at && t < q.leave) { const d = fr.d, xx = q.x0 + 0.42, k = clamp((t - fr.fall.at) / 0.26), yy = R.FLOOR_Y - 2.2 + 2.2 * (k * k) - d.h; g.fillStyle = WHO.S.col; rr(g, xx - q.x0, yy, d.w, d.h, 0.34); g.fill(); textRow(fr.d.lines, xx - q.x0 + R.PADX, yy, d.h, WHO.S.ink, false); }
    bar(q, f); door(q, f); slider(q, f);
  }
  function header(q, f) {
    const { t, s } = f, S14 = q.id === 'S14', i = q.i + 1, clock = GAGS.clock.on ? GAGS.clock.byStep[i] : '9:41';
    g.fillStyle = M.hdr; g.save(); rr(g, 0.16, 0.16, R.PW - 0.32, R.PH - 0.32, 0.54); g.clip(); g.fillRect(0.16, 0.16, R.PW - 0.32, R.HEAD); g.restore();
    g.fillStyle = M.sub; font(0.24, 600); g.textAlign = 'left'; g.textBaseline = 'middle'; fillT(clock, 0.5, 0.42);
    g.fillStyle = '#000'; rr(g, R.PW / 2 - 0.75, 0.26, 1.5, 0.3, 0.15); g.fill();
    const n = t >= 101.22 ? 85 : t >= 26.36 ? 44 : 43; g.textAlign = 'center'; g.fillStyle = M.ink; font(0.34, 700); fillT(S14 ? 'kev' : `FIND KEVIN · ${n}`, R.PW / 2, 0.86);
    if (!S14) { const cols = ['#5a5f6e', '#6b6f7e', '#515664', '#62667a', '#4a4e5c']; for (let k = 0; k < 5; k++) { g.fillStyle = cols[k]; g.beginPath(); g.arc(R.PW / 2 - 0.84 + k * 0.42, 1.24, 0.14, 0, 7); g.fill(); } if (t >= 26.36) { const pop = ease((t - 26.36) / 0.15); g.fillStyle = PURP[1]; g.beginPath(); g.arc(R.PW / 2 + 1.26, 1.24, 0.14 * pop, 0, 7); g.fill(); } }
    else { g.fillStyle = '#5a5f6e'; g.beginPath(); g.arc(R.PW / 2, 1.24, 0.14, 0, 7); g.fill(); }
    g.fillStyle = M.line; g.fillRect(0.16, R.HEAD - 0.015, R.PW - 0.32, 0.03);
  }
  function bubbleTail(x, yB, right, col) { const d = right ? 1 : -1; g.fillStyle = col; g.beginPath(); g.moveTo(x - d * 0.3, yB - 0.34); g.quadraticCurveTo(x - d * 0.04, yB - 0.1, x + d * 0.17, yB + 0.03); g.quadraticCurveTo(x - d * 0.14, yB + 0.07, x - d * 0.4, yB - 0.03); g.closePath(); g.fill(); }
  function textRow(lines, x0, yt, h, ink, right, W = 0, hi) {   // lines of words, his in his font on a patch of deep purple
    const lh = R.ROWL, sp = 0.27 * R.FS * 1.15; let y = yt + R.ROW1 / 2; g.textBaseline = 'middle'; g.textAlign = 'left';
    for (const L of lines) { let x = x0; for (let i = 0; i < L.toks.length; i++) { const k = L.toks[i]; if (k.hot) { g.font = HIS(R.HOTFS * TS); } else font(R.FS * 1.05, 500); const wd = g.measureText(k.w).width / TS;
        if (k.hot) { const nx = L.toks[i + 1] && L.toks[i + 1].hot; g.fillStyle = DEEP; rr(g, x - 0.07, y - 0.3, wd + (nx ? sp + 0.14 : 0.14), 0.6, 0.08); g.fill(); g.fillStyle = LILAC; g.save(); g.translate(x, y); g.scale(1 / TS, 1 / TS); g.fillText(k.w, 0, 0); g.restore(); } else { g.fillStyle = ink; fillT(k.w, x, y); } x += wd + sp; } y += lh; }
  }
  function row(q, b, f) {
    const { t, s } = f, r = b.r, v = b.v, k = v.kind, o0 = WHO[v.who] || WHO.P, o = o0.col === WHO.P.col ? { ...o0, col: M.grey, ink: M.greyInk } : o0, ly = wy => q.yt - wy, x0 = b.x0 - q.x0, x1 = b.x1 - q.x0, yT = ly(b.y1), yB = ly(b.y0);
    const pop = q.id === 'S14' ? 1 : ease((t - r.t) / R.ANIM); if (pop <= 0) return;
    let dy = 0, dx = 0; const shakeT = r.fall ? r.fall.at - 0.8 : 1e9; if (t >= shakeT) { const a = Math.min(1, (t - shakeT) / 0.5) * 0.08; dx = Math.sin(t * 60) * a; dy = Math.cos(t * 47) * a; }
    g.save(); g.translate(dx, dy); g.globalAlpha = pop;
    let y = yT; if (b.named) { g.fillStyle = M.sub; font(0.26, 600); g.textAlign = b.right ? 'right' : 'left'; g.textBaseline = 'middle'; fillT(o.name, b.right ? x1 - 0.1 : x0 + 0.1, y + 0.14); y += R.NAME; }
    const bh = yB - y - (r.id === 'dud' && v.mine && GAGS.edited.on ? 0.3 : 0), bw = x1 - x0;
    if (k === 'text') { const col = v.who === 'H' ? DEEP : o.col; g.fillStyle = col; rr(g, x0, y, bw, bh, 0.34); g.fill(); if (b.tail) bubbleTail(b.right ? x1 : x0, y + bh, b.right, col); textRow(v.d.lines, x0 + R.PADX, y, bh, o.ink, b.right);
      if (r.id === 'dud' && v.mine && GAGS.edited.on) { g.fillStyle = M.sub; font(0.24, 500); g.textAlign = 'left'; g.textBaseline = 'middle'; fillT(GAGS.edited.text, x0 + 0.1, y + bh + 0.16); } }
    else if (k === 'big') { g.textAlign = b.right ? 'right' : 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; font(0.92, 500); fillT('🥔', b.right ? x1 : x0 + 0.05, y + bh / 2); }
    else if (k === 'photo') { const im = PICS[v.pic], cap = r.capD, ph = bh - (cap ? cap.h + 0.08 : 0); g.save(); rr(g, x0, y, bw, ph, 0.3); g.clip(); g.fillStyle = '#222'; g.fillRect(x0, y, bw, ph); if (okImg(im)) { const cr = r.crop || [0, 0, 1, 1], sw = iw(im) * cr[2], sh = ih(im) * cr[3], sc = Math.max(bw / sw, ph / sh); g.drawImage(im, iw(im) * cr[0], ih(im) * cr[1], sw, sh, x0 + (bw - sw * sc) / 2, y + (ph - sh * sc) / 2, sw * sc, sh * sc); } g.restore();
      if (cap) { const cx = b.right ? x1 - cap.w : x0; g.fillStyle = o.col; rr(g, cx, y + ph + 0.08, cap.w, cap.h, 0.34); g.fill(); textRow(cap.lines, cx + R.PADX, y + ph + 0.08, cap.h, o.ink, b.right); } }
    else if (k === 'dots') { typing(x0, yB - 0.8, pop, t); }
    else if (k === 'sys') { g.fillStyle = M.sub; font(0.3, 500); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT(r.text, R.PW / 2, (yT + yB) / 2); }
    else if (k === 'read') { const glowing = r.id === 'receipt' && !v.mine; g.textAlign = b.right ? 'right' : 'left'; g.textBaseline = 'middle'; g.fillStyle = v.mine ? M.typed : r.id === 'receipt' ? M.sub : M.ink; if (r.id !== 'receipt') g.globalAlpha = pop * 0.7; font(0.34, 500); fillT(v.text, b.right ? x1 - 0.1 : x0 + 0.1, (yT + yB) / 2); g.globalAlpha = pop; if (glowing) { const wd = g.measureText(v.text).width / TS + 0.34; g.strokeStyle = PURP[1]; g.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2.2); g.lineWidth = 0.07; rr(g, x1 + 0.07 - wd, yT - 0.02, wd, yB - yT + 0.04, 0.16); g.stroke(); g.globalAlpha = pop; } }
    // the glow: what's still his to take
    const open = r.to != null && r.id && r.id !== 'receipt' && !taken(s, r.id) && t >= r.t + R.GLOWIN && t <= r.glow;
    if (open) { const a = 0.75 + 0.25 * Math.sin(t * 7); g.strokeStyle = PURP[1]; g.globalAlpha = a; g.lineWidth = 0.09; rr(g, x0 - 0.02, y - 0.02, bw + 0.04, bh + 0.04, 0.36); g.stroke(); const nn = 7; for (let i = 0; i < nn; i++) { const c = (t * 0.5 + i / nn) % 1, per = 2 * (bw + bh), d = c * per; let px, py; if (d < bw) { px = x0 + d; py = y; } else if (d < bw + bh) { px = x1; py = y + d - bw; } else if (d < 2 * bw + bh) { px = x1 - (d - bw - bh); py = y + bh; } else { px = x0; py = y + bh - (d - 2 * bw - bh); } g.fillStyle = PURP[i % 4]; g.fillRect(px - 0.05, py - 0.05, 0.1, 0.1); } g.globalAlpha = pop; }
    if (r.id && taken(s, r.id) && r.to != null) { const fa = flipAt(s, r); if (t < fa) { g.fillStyle = PURP[0]; g.globalAlpha = 0.22 + 0.14 * Math.sin(t * 18); rr(g, x0, y, bw, bh, 0.34); g.fill(); g.globalAlpha = pop; }
      if (t >= fa && t - fa < 0.32) { const a = 1 - (t - fa) / 0.32; for (let i = 0; i < 14; i++) { const kk = Math.floor(t * 30); g.fillStyle = i === 7 ? '#4dff9a' : PURP[i % 4]; g.globalAlpha = a; g.fillRect(x0 + hash(i, kk) * bw, y + hash(i + 3, kk) * bh, 0.2 + hash(i, kk + 1) * 0.7, 0.1); } g.globalAlpha = pop; } }
    if (r.tear && t >= 91.6) { g.strokeStyle = PURP[1]; g.globalAlpha = clamp((t - 91.6) / 0.2); g.lineWidth = 0.09; rr(g, x0, y, bw, bh, 0.34); g.stroke(); g.globalAlpha = pop; }
    if (s.slide && s.slide.rid === r.rid && t - s.slide.t < 0.45) { const a = (t - s.slide.t) / 0.45; g.fillStyle = PURP[1]; g.globalAlpha = 0.7 * (1 - a); g.fillRect(x0 + bw * a, y + bh * 0.2 + a * 0.5, bw * 0.4, 0.14); g.fillRect(x0 + bw * 0.1, y + bh + a * 0.9, bw * 0.6, 0.1); g.globalAlpha = pop; }
    if (s.pop && s.pop[r.rid] != null && t - s.pop[r.rid] < 0.3) { const a = (t - s.pop[r.rid]) / 0.3; g.strokeStyle = M.typed; g.globalAlpha = 1 - a; g.lineWidth = 0.06; rr(g, x0 - a * 0.3, y - a * 0.3, bw + a * 0.6, bh + a * 0.6, 0.4); g.stroke(); g.globalAlpha = pop; }
    g.restore();
  }
  function hearts(q, st, f) { const { t } = f; for (const r of q.rows) if (r.kind === 'heart' && t >= r.t) { const b = st.find(b => b.r.id === r.on); if (!b) continue; const k = ease((t - r.t) / 0.2), x = b.x0 - q.x0 + 0.1, y = q.yt - b.y1 + R.NAME + 0.1; g.fillStyle = M.heart; g.beginPath(); g.arc(x, y, 0.32 * k, 0, 7); g.fill(); g.fillStyle = '#ff5a6a'; g.textAlign = 'center'; g.textBaseline = 'middle'; font(0.3 * Math.max(0.2, k), 500); fillT('❤', x, y + 0.01); } }
  function hazard(q, h, gm, t) {
    const lx = gm.x - q.x0, ly = q.yt - gm.y;
    if (gm.kind === 'line') { const sh = gm.shake ? Math.sin(t * 60) * 0.07 : 0, a = gm.broke != null ? 1 - gm.broke : 1; g.save(); g.globalAlpha = a; g.fillStyle = WHO.S.col; rr(g, lx - gm.w / 2 + sh, ly - gm.h, gm.w, gm.h, 0.34); g.fill(); textRow(gm.d.lines, lx - gm.w / 2 + sh + R.PADX, ly - gm.h, gm.h, WHO.S.ink, false); g.restore(); }
    else { g.save(); g.translate(lx, ly); g.rotate(-gm.rot); const r = gm.r; g.fillStyle = '#d8d8de'; g.strokeStyle = INK; g.lineWidth = 0.09; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
      if (h.icon === 'bell') { g.fillStyle = INK; g.beginPath(); g.moveTo(-0.24, 0.16); g.quadraticCurveTo(-0.2, -0.28, 0, -0.28); g.quadraticCurveTo(0.2, -0.28, 0.24, 0.16); g.closePath(); g.fill(); g.fillRect(-0.05, 0.18, 0.1, 0.07); g.strokeStyle = '#ff3b30'; g.lineWidth = 0.08; g.beginPath(); g.moveTo(-0.3, 0.3); g.lineTo(0.3, -0.3); g.stroke(); }
      else { g.strokeStyle = '#ff3b30'; g.lineWidth = 0.1; g.beginPath(); g.arc(0, 0, 0.27, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-0.19, -0.19); g.lineTo(0.19, 0.19); g.stroke(); } g.restore(); }
  }
  function bar(q, f) {
    const { t } = f, tip = q.leave != null ? clamp((t - (q.leave - R.TIP)) / R.TIP) : 0, ang = q.i === 3 ? (q.leave != null ? ease((t - q.leave) / 0.25) * 0.7 : 0) : ease(tip) * 0.13;
    g.save(); g.translate(0.16, R.FLOOR_Y); g.rotate(ang); g.fillStyle = M.bar; g.fillRect(0, 0, R.PW - 0.32, R.BAR); g.fillStyle = M.tread; g.fillRect(0, 0, R.PW - 0.32, 0.08); g.fillStyle = M.field; rr(g, 0.3, 0.17, R.PW - 1.5, 0.42, 0.21); g.fill();
    const s = f.s, onHere = R.FOOT_KEYS && s.st === q.i && s.m === 'on' && s.on == null;
    if (onHere) { const n = Math.floor((s.typed || 0) / 0.42) - Math.floor(Math.max(0, t - (s.typedT ?? t) - 0.5) / 0.05), L = FEET.length; if (n > 0) { let str = ''; for (let i = Math.max(0, n - 14); i < n; i++) str += FEET[i % L]; g.fillStyle = M.foot; g.textAlign = 'left'; g.textBaseline = 'middle'; g.save(); g.translate(0.5, 0.37); g.scale(1 / TS, 1 / TS); g.font = HIS(0.26 * TS); g.fillText(str, 0, 0); g.restore(); } }
    g.restore();
    const lit = onHere && s.walking ? Math.floor(((s.x - q.x0) - 0.4) / ((R.PW - 0.8) / 9)) : -1, down = lit >= 0 && Math.floor((s.typed || 0) / 0.42) % 2;
    g.fillStyle = M.kbd; g.save(); rr(g, 0.16, 0.16, R.PW - 0.32, R.PH - 0.32, 0.54); g.clip(); g.fillRect(0.16, R.FLOOR_Y + R.BAR, R.PW - 0.32, R.PH); g.restore();
    for (let r2 = 0; r2 < 4; r2++) { const n = r2 === 3 ? 5 : r2 === 2 ? 8 : 9, kw = (R.PW - 0.8) / n; for (let k = 0; k < n; k++) { const hit = r2 === 0 && k === lit; g.fillStyle = hit ? PURP[0] : M.key; rr(g, 0.4 + k * kw + 0.04, R.FLOOR_Y + R.BAR + 0.2 + r2 * 0.92 + (hit && down ? 0.06 : 0), kw - 0.08, 0.8, 0.1); g.fill(); } }
  }
  function door(q, f) {
    const { t, s } = f; if (q.leave == null) return;
    const yT = R.FLOOR_Y - R.STRIP;
    if (t >= q.door) { const k = ease((t - q.door) / 0.25); g.fillStyle = '#0a0d1b'; g.fillRect(R.PW - 0.18, yT, 0.32, R.STRIP * k); g.fillStyle = LILAC; g.globalAlpha = 0.7; g.fillRect(R.PW - 0.22, yT - 0.03, 0.4, 0.05); g.globalAlpha = 1; }
    if (q.wheel && !(s.wheel && s.wheel[q.i] != null)) { const cxx = R.PW - 0.72, cyy = R.FLOOR_Y - 0.7, near = s.st === q.i && s.x >= q.x1 - R.WHEEL_R; for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI, on = (Math.floor(t * (near ? 36 : 12)) + i) % 12; g.strokeStyle = `rgba(${M.wheel},${0.2 + 0.8 * on / 12})`; g.lineWidth = 0.08; g.lineCap = 'round'; g.beginPath(); g.moveTo(cxx + Math.cos(a) * 0.2, cyy + Math.sin(a) * 0.2); g.lineTo(cxx + Math.cos(a) * 0.38, cyy + Math.sin(a) * 0.38); g.stroke(); } }
    else if (q.wheel && s.wheel[q.i] > 0 && t - s.wheel[q.i] < 0.3) { const a = (t - s.wheel[q.i]) / 0.3; for (let i = 0; i < 10; i++) { g.fillStyle = '#bebec8'; g.globalAlpha = 1 - a; g.fillRect(R.PW - 0.72 + (hash(i, 2) - 0.5) * a * 1.4, R.FLOOR_Y - 0.7 + hash(i, 5) * a * 1.0, 0.08, 0.08); } g.globalAlpha = 1; }
  }
  function slider(q, f) { const { t } = f; if (q.id !== 'S13' || t < 115.62) return; const stops = R.LONG_FALL ? [115.62, 116.23, 116.46] : [115.62, 116.23, 116.84, 117.28], off = stops[stops.length - 1]; let k = 0; for (let i = 0; i < stops.length; i++) if (t >= stops[i]) k = i / (stops.length - 1);
    if (t >= off) { g.fillStyle = '#000'; rr(g, 0.16, 0.16, R.PW - 0.32, R.PH - 0.32, 0.54); g.fill(); return; }
    const x = 0.5, w = R.PW - 1, y = 1.9, h = 0.9; g.fillStyle = 'rgba(44,44,46,0.97)'; rr(g, x, y, w, h, h / 2); g.fill(); g.fillStyle = UI.ink; font(0.3, 500); g.textAlign = 'center'; g.textBaseline = 'middle'; fillT('slide to power off', x + w / 2 + 0.3, y + h / 2); g.fillStyle = '#f2f2f7'; g.beginPath(); g.arc(x + h / 2 + (w - h) * k, y + h / 2, h / 2 - 0.08, 0, 7); g.fill(); g.fillStyle = '#ff3b30'; g.fillRect(x + h / 2 + (w - h) * k - 0.04, y + 0.28, 0.08, 0.34); }
  // his faint outline shows Space and the spin once, on the first phone (no words)
  function echo(f) { if (!R.ECHO) return; const { t, s } = f; const q = steps[0]; if (s.st !== 0 || s.m !== 'on') return; const shape = (x, y, hw, a, col) => { const cxx = X(x), by = Y(y), hh = 1.3 * u, h2 = hw * u; g.setTransform(1, 0, 0, 1, 0, 0); g.save(); g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = Math.max(2, 0.06 * u); g.beginPath(); g.moveTo(cxx - h2, by); g.quadraticCurveTo(cxx - h2, by - hh * 1.25, cxx, by - hh); g.quadraticCurveTo(cxx + h2, by - hh * 1.25, cxx + h2, by); g.closePath(); g.stroke(); g.restore(); };
    if (t >= 13.9 && t < 14.9 && !taken(s, 'phones')) { const st = stack(P, s, t, q), b = st.find(b => b.r.id === 'phones'); if (b) { const k = Math.sin(clamp((t - 13.9) / 1.0) * Math.PI); shape((b.x0 + b.x1) / 2, q.fl + (b.y1 - R.NAME - q.fl) * k, 0.56, 0.75, PURP[1]); } }
    if (t >= 15.2 && t < 16.6 && !(s.wheel && s.wheel[0] != null)) { const k = clamp((t - 15.2) / 0.8), xx = s.x + (q.x1 - 1.1 - s.x) * ease(k), sp = t >= 16.0 ? Math.abs(Math.cos(Math.PI * (t - 16.0) / 0.42)) : 1; shape(xx, q.fl, 0.56 * Math.max(0.1, sp), 0.7 * Math.min(1, (16.6 - t) / 0.2), LILAC); } }
  let f0 = null, lastSt = -1, swapT = -9, swapFrom = -1;
  // ---------------- one frame ----------------
  function draw(f) {
    const { t, s } = f; f0 = f;
    if (t < R.WAKE || !s.sOn) { g0.visible = true; mesh.visible = false; v0.draw(f); return; }
    g0.visible = false; mesh.visible = true; camera(f); fitCanvas(); street(f);
    const VW = cv.width / u, VHh = cv.height / u, on = q => q.x1 > left - 1 && q.x0 < left + VW + 1 && q.yt > top - VHh - 1 && q.yb < top + 1;
    const cur = steps[Math.max(0, s.st)], dropping = s.m === 'drop', nowLive = t >= 116.46 && cur.id !== 'S14' ? null : cur;
    if (s.st !== lastSt || t < swapT) { swapFrom = s.st > lastSt && lastSt >= 0 ? lastSt : -1; lastSt = s.st; swapT = t; }
    const swap = ease((t - swapT) / 0.22), prevLive = swap < 1 && swapFrom >= 0 ? steps[swapFrom] : null;
    if (nowLive && nowLive.id !== 'S14' && R.LIGHT) pool(nowLive, swap); if (prevLive && R.LIGHT) pool(prevLive, 1 - swap);
    for (const q of steps) if (on(q) && q !== nowLive && q !== prevLive) dim(q, f, t >= 116.46 && q.id !== 'S14');
    for (const d of P.dark) if (d.x1 > left - 1 && d.x0 < left + VW + 1) { g.setTransform(u, 0, 0, u, X(d.x0), Y(d.yt)); g.fillStyle = INK; rr(g, -0.1, -0.1, R.PW + 0.2, R.PH + 0.2, 0.74); g.fill(); g.fillStyle = t >= d.at ? '#050508' : '#0b0c14'; rr(g, 0, 0, R.PW, R.PH, 0.68); g.fill(); g.fillStyle = '#000'; rr(g, R.PW / 2 - 0.75, 0.26, 1.5, 0.3, 0.15); g.fill(); if (t >= d.at) deadPixel(100 + d.at, true); }
    if (R.ERASED) erased(f);
    if (prevLive) { live(prevLive, f); glass(prevLive, swap); if (swap > 0.5) { g.setTransform(u, 0, 0, u, X(prevLive.x0), Y(prevLive.yt)); deadPixel(prevLive.i); } }
    if (nowLive) { live(nowLive, f); glass(nowLive, swapFrom >= 0 ? 1 - swap : 0); }
    if (s.m === 'drop' && s.rideT != null && t < s.rideT + 1.0) ride(f);
    echo(f); finale(f); tex.needsUpdate = true;
  }
  // ★ what they really said: on each "ha" of the long fall, one dark phone shows the true line he took from it, in its real colour. Only lines he really took. Nothing else is talking, James has just powered off (R.ERASED)
  const TRUTH = ['phones', 'tired', 'tonight', 'beg'];
  function erased(f) { const { t, s } = f; P.dark.forEach((d, i) => { const r = P.byId[TRUTH[i]]; if (t < d.at || !r || !taken(s, r.id) || !r.d) return; const o = WHO[r.who], b = r.d, xx = o.right ? R.PW - 0.42 - b.w : 0.42; g.setTransform(u, 0, 0, u, X(d.x0), Y(d.yt)); g.globalAlpha = ease((t - d.at) / 0.06) * (1 - ease((t - 117.72) / 0.45)); if (g.globalAlpha <= 0) { g.globalAlpha = 1; return; } g.fillStyle = o.col; rr(g, xx, 3.2, b.w, b.h, 0.34); g.fill(); textRow(b.lines, xx + R.PADX, 3.2, b.h, o.ink, o.right); g.globalAlpha = 1; }); }   // (gone by the time his feet touch: the last phone gets the screen to itself)
  function ride(f) { const { t, s } = f, r = P.steps[3].rows.find(r => r.fall), d = r.d, k = clamp((t - s.rideT) / 1.0); g.setTransform(u, 0, 0, u, X(s.x - d.w / 2), Y(s.y)); g.fillStyle = WHO.S.col; rr(g, 0, 0.02, d.w, d.h, 0.34); g.fill(); textRow(d.lines, R.PADX, 0.02, d.h, WHO.S.ink, false); if (k > 0.86) { const a = (k - 0.86) / 0.14; g.fillStyle = '#0a0d1b'; g.globalAlpha = a; g.fillRect(-0.1, -0.1, d.w + 0.2, d.h + 0.3); g.globalAlpha = 1; } }
  function finale(f) { const { t } = f; if (t < 120.2) return; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(4,4,10,${0.72 * ease((t - 120.2) / 0.9)})`; g.fillRect(0, 0, cv.width, cv.height); }
  // ---------------- the overlay: the lyrics in the sky, top right, faint · his thoughts, only on the drops ----------------
  const LLINES = (() => { const by = new Map(); for (const w of C.signs || []) { if (w.t0 == null) continue; if (!by.has(w.line)) by.set(w.line, []); by.get(w.line).push(w); }
    const ls = [...by.values()].map(ws => ws.sort((a, b) => a.t0 - b.t0)).sort((a, b) => a[0].t0 - b[0].t0).map(ws => ({ ws, t0: ws[0].t0, t1: ws[ws.length - 1].t1 ?? ws[ws.length - 1].t0 + 0.4 }));
    ls.forEach((L, i) => { L.next = ls[i + 1] ? ls[i + 1].t0 : Infinity; }); return ls; })();
  function lyrics(ctx, f) { const { t } = f; if (t < R.S1 || t > 120) return; let L = null; for (const l of LLINES) { if (l.t0 <= t + 0.05) L = l; else break; } if (!L || t > Math.min(L.next, L.t1 + 2.2)) return;
    const W = ctx.canvas.width, H = ctx.canvas.height, x0 = W * (R.LEFT + R.PW + 2.2) / (R.VH * W / H), maxW = W - x0 - W * 0.03, SZ = Math.max(12, H * 0.03), y = H * 0.1; ctx.save(); ctx.font = `400 ${Math.round(SZ)}px "Major Mono Display", ui-monospace, monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const sp = ctx.measureText(' ').width; let xx = x0, yy = y; for (const w of L.ws) { const txt = String(w.text ?? w.word).toLowerCase(), wd = ctx.measureText(txt).width, on = t >= w.t0; if (xx + wd > x0 + maxW) { xx = x0; yy += SZ * 1.5; } ctx.globalAlpha = on ? 0.5 : 0.14; ctx.fillStyle = on && t - w.t0 < 0.15 ? PURP[3] : '#c8d2ff'; ctx.fillText(txt, xx, yy); xx += wd + sp; }
    ctx.restore(); }
  function thoughts(ctx, f) { const { t, s } = f; let th = null; if (GAGS.notMe.on && t >= 34.44 && t < 35.65 && s.dropT != null) th = GAGS.notMe; else if (GAGS.tooHeavy.on && t >= 42.6 && t < 43.3) th = GAGS.tooHeavy; else if (GAGS.untouched.on && s.m === 'drop' && s.st === 12 && !s.glitched) th = GAGS.untouched; if (!th) return; const a = t - (th === GAGS.notMe ? 34.44 : th === GAGS.untouched ? s.dropT + 0.1 : 42.6), pt = f.project(s.x, s.y + 1.85), sz = Math.max(13, ctx.canvas.height * 0.024); ctx.save(); ctx.font = `400 ${Math.round(sz)}px "Major Mono Display", ui-monospace, monospace`; const heavy = th === GAGS.tooHeavy; ctx.textAlign = heavy ? 'left' : 'center'; const tw2 = ctx.measureText(th.text).width, W = ctx.canvas.width, x = heavy ? Math.min(pt.x, W - tw2 - 8) : Math.min(Math.max(pt.x, tw2 / 2 + 8), W - tw2 / 2 - 8);   // (the S4 thought hangs off him, out over the dark)
    ctx.globalAlpha = Math.min(1, a / 0.08, (th.s - 0.3 - a + 0.3) / 0.2) * 0.92; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(42,15,99,.95)'; ctx.strokeText(th.text, x, pt.y); ctx.fillStyle = '#ece0ff'; ctx.fillText(th.text, x, pt.y); ctx.restore(); }
  function halo(ctx, f) { const { t, s } = f; if (s.halo == null || t - s.halo > B) return; const pt = f.project(s.x, s.y + 1.7), k = (t - s.halo) / B, r = ctx.canvas.height * 0.03; ctx.save(); ctx.translate(pt.x, pt.y); ctx.scale(1, 0.34); ctx.strokeStyle = '#ff3b30'; ctx.globalAlpha = 1 - k * k; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.restore(); }
  function padlock(ctx, f) {   // the comedian's first laugh: on sung "face" the lock screen's padlock shakes no, the way phones do. At 7.88 he's in anyway
    const { t } = f, A = GAGS.faceNo; if (!A.on || t < 0.65 || !f.project) return; const yT = G0.OY + G0.K * G0.G.Y1, yB = G0.OY + G0.K * G0.G.Y0, a = f.project(G0.SC[0], yT), b = f.project(G0.SC[0], yB), hh = Math.abs(b.y - a.y), sz = hh * 0.016, k = (t - A.t) / (A.ms / 1000), dx = k >= 0 && k < 1 ? Math.sin(k * Math.PI * 6) * (1 - k) * sz * 0.9 : 0;
    ctx.save(); ctx.translate(a.x + dx, a.y + hh * 0.082); ctx.strokeStyle = '#f2f2f7'; ctx.fillStyle = '#f2f2f7'; ctx.lineWidth = sz * 0.34; ctx.beginPath(); ctx.arc(0, -sz * 0.35, sz * 0.62, Math.PI, 0); ctx.lineTo(sz * 0.62, sz * 0.1); ctx.moveTo(-sz * 0.62, -sz * 0.35); ctx.lineTo(-sz * 0.62, sz * 0.1); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-sz, 0, sz * 2, sz * 1.5, sz * 0.25); ctx.fill(); ctx.restore(); }
  function over(ctx, f) { if (f.t < R.WAKE || !f.s.sOn) { if (v0.over) v0.over(ctx, f); padlock(ctx, f); return; } lyrics(ctx, f); thoughts(ctx, f); halo(ctx, f); }
  return { draw, over, leave() { try { W3.remove(g0); W3.remove(mesh); } catch (e) {} } };
};

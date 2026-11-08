// modes/no-answer-runner.mjs — No Answer as a RUNNER (Night Shift Detectives, Nov 4): the hunt's rules + the overlay.
// The level is a standard runner (core.mjs physics, deaths, retry, fair.mjs, solve.mjs all work): there is NO mode.step.
// This file owns:
//   1. the rules of the hunt (pure, deterministic, 120 Hz; the bot and the replay see exactly this): the torch's aim and
//      light (L), what the beam finds, the page catch, the five DENIEDs, Enter on nothing, UNLOCKED. The level's
//      def.onStep = hunt.
//   2. modeView: what sits in FRONT of the world (the overlay): the ENTER MASTER PASSWORD box as the moon, the case board,
//      DENIED / UNLOCKED, his three thoughts, the torch in his hatband, his purple glitches on Chikin's Tapper marks, the black
//      beats (only his eyes), the one whole-screen ⚡ at 161.66, the intro's locked screen.
// The city and the dark (behind him) are story-no-answer-runner.mjs. Numbers come from the crew's docs (PLAN.md §2 says
// whose number wins where they disagree). Purple is his only: the torch's 1 px glitch edge, his glitches, the thoughts,
// the ⚡ at 161.66. Nothing else here is purple.

// ---------------- the numbers ----------------
export const NA = {
  OX: 0.52, OY: 1.20, OXD: 0.55, OYD: 0.80,            // the torch lens from his feet (world units): measured off the noir hat (PLAN §2 fix 5)
  AIM: { run: -6, duck: -18, up: 14, down: -10 }, EASE: 0.08,   // degrees (+ = up), eased over 0.08 s (DESIGN §2.2)
  HALF: L => 14 + 8 * L,                    // cone half-angle (LIGHTING §2.2, wins per PLAN §2 #2)
  R: (t, v) => Math.max(t >= 60.02 ? 8.6 : 6.4, 1.15 * v),   // reach: L never shortens it (DESIGN, PLAN §2 #3)
  NEAR: 2.4, LIT: 0.12,                     // an aim-find counts once its centre is in the cone, within 2.4 u of the lens, for 0.12 s
  FULL: 60.02, LAMP_OUT: 22.33,
  BLACK: [[49.64, 50.0], [58.28, 60.02]],
  STOP: [119.31, 120.03],                    // the biggest door: one song beat, "shake"
  ENTER: [156.84, 158.10], ENTER_AUTO: 157.70, UNLOCK: 161.66, HUSH: 149.8,
  PAGE: { t: 139.82, y: 2.35, r: 0.7, from: 139.0, to: 140.6, drop: 141.0 },
  THINK: [[84.10, 84.70, '> saving this one.'], [98.10, 99.00, '> that was my whole answer.'], [170.0, 172.5, '> nobody ever set one.']],   // DRAFTS for Chikin
};
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const inBlack = t => NA.BLACK.some(([a, b]) => t >= a && t < b);
// what the beam can find. kind: lead (warm, feeds a guess) | blank (cold, the box's cursor on it).
// how: auto (the running beam gets it) | duck (tip the beam down) | jump (lift it) | page (catch it) | box (it's in the box).
// at: where it stands (song time he passes it: x = C.X(at)); y: its height; pin: when its card pins if it's automatic.
export const FINDS = [
  { id: 'hint', kind: 'blank', how: 'box', at: 9.64, pin: 9.64 },
  { id: 'coupon', kind: 'lead', how: 'auto', at: 41.0, y: 1.4, pin: 41.0, guess: 'potato' },
  { id: 'flag', kind: 'lead', how: 'duck', at: 52.62, y: 0.12, guess: 'niepal' },
  { id: 'sticky', kind: 'lead', how: 'auto', at: 64.60, y: 1.0, pin: 64.44, guess: 'password' },
  { id: 'thu', kind: 'lead', how: 'jump', at: 84.50, y: 3.15, near: 3.3, guess: 'thursday' },
  { id: 'nameplate', kind: 'blank', how: 'auto', at: 119.31, y: 4.5, pin: 111.54 },
  { id: 'hollow', kind: 'blank', how: 'auto', at: 119.31, y: 1.0, pin: 119.31 },
  { id: 'page', kind: 'blank', how: 'page', at: 139.82, y: 2.35 },
];
export const FIND = Object.fromEntries(FINDS.map(f => [f.id, f]));
// the guesses (JOKES §2): he types them into the box; DENIED lands on a sung word every time
export const GUESSES = [
  { g: 'potato', card: 'coupon', t0: 43.14, per: 0.06, denied: 43.50 },
  { g: 'niepal', card: 'flag', t0: 54.24, per: 0.09, denied: 54.84 },
  { g: 'password', card: 'sticky', t0: 66.715, per: 0.075, denied: 67.24 },   // (DENIED lands on the d: the box didn't need him to finish)
  { g: 'maybe', card: null, t0: 97.30, per: 0.12, denied: 97.96 },
  { g: 'thursday', card: 'thu', t0: 152.0, per: 0.27, denied: 154.62, thu: true },   // THU_ builds into thursday (the movie)
];
// the light's story steps (LIGHTING §2.4: DENIED −0.20 instantly, a lead +0.06, the click, the hush, the doors)
const STEPS = [[43.50, -0.2], [54.84, -0.2], [60.02, 'full'], [67.24, -0.2], [97.96, -0.2], [154.62, -0.2], [157.34, 0.30], [161.66, 0.35]];
const L0 = 0.40;
export const RETRY = [9.64, 23.05, 37.45, 60.02, 88.50, 98.60, 120.03, 129.64, 141.40, 149.80, 161.66, 172.85];
export const retryAt = t => { const tt = Math.max(0, t - 1.5); let r = RETRY[0]; for (const a of RETRY) if (a <= tt) r = a; return r; };
const DT = 1 / 120;
const SNAP = {};

// the lens, in the world (the view draws the beam from the same place)
export const lensOf = s => ({ x: s.x + (s.ducking ? NA.OXD : NA.OX), y: s.y + (s.ducking ? NA.OYD : NA.OY) });
export const findX = (C, f) => C.X(f.at);
function fresh(from, C) {
  // a start mid-song with no snapshot (dev / the demo fast-forward): what happened before is greyed in, the light is the ladder's
  const na = { L: L0, aim: NA.AIM.run, acc: {}, got: {}, page: null, enter: null, fizzle: null, from };
  for (const f of FINDS) { const tp = f.pin ?? (f.how === 'page' ? NA.PAGE.drop : f.at); if (tp < from - 1e-6) na.got[f.id] = { t: tp, lit: f.how === 'box' || f.how === 'auto' }; }
  if (from > NA.PAGE.drop) na.page = { t: NA.PAGE.drop, caught: false };
  for (const [a, d] of STEPS) if (a < from - 1e-6) na.L = d === 'full' ? 1 : typeof d === 'number' && d > 0 ? d : Math.max(0.30, na.L + d);
  for (const f of FINDS) if (f.kind === 'lead' && na.got[f.id] && na.got[f.id].lit) na.L = Math.min(from < NA.FULL ? 0.5 : 1, na.L + 0.06);
  if (from > NA.ENTER_AUTO) na.enter = { t: NA.ENTER_AUTO, by: 'auto' };
  return na;
}
const pin = (na, f, t, lit) => { na.got = { ...na.got, [f.id]: { t, lit } }; if (lit && f.kind === 'lead') na.L = Math.min(t < NA.FULL ? 0.5 : 1, na.L + 0.06); };
// ---------------- the hunt: def.onStep (after the core's physics, every 1/120 s) ----------------
export function hunt(s, inp, t, C) {
  if (!s.na) { const from = t - DT; if (from < 0.01) for (const k in SNAP) delete SNAP[k];
    const r = SNAP[from.toFixed(2)]; s.na = r ? { ...r, acc: {}, from, retried: true } : fresh(from, C); }
  for (const a of RETRY) if (t - DT < a && t >= a) SNAP[a.toFixed(2)] = { ...s.na };   // a retry restores the light + keeps the cards
  const na = s.na = { ...s.na };
  // the aim: the detective's verb (duck tips it down, a jump lifts it, falling shows the landing)
  const want = s.ducking ? NA.AIM.duck : !s.ground ? (s.vy > 0 ? NA.AIM.up : NA.AIM.down) : NA.AIM.run;
  na.aim += (want - na.aim) * Math.min(1, DT / NA.EASE);
  // the story's light steps
  for (const [a, d] of STEPS) if (t - DT < a && t >= a) na.L = d === 'full' ? 1 : typeof d === 'number' && d > 0 ? d : Math.max(0.30, na.L + d);
  // the finds
  const O = lensOf(s), v = C.speedAt(t), half = NA.HALF(na.L) * Math.PI / 180, aim = na.aim * Math.PI / 180;
  for (const f of FINDS) { if (na.got[f.id]) continue;
    if (f.how === 'box' || f.how === 'auto') { if (t >= f.pin) pin(na, f, t, true); continue; }
    if (f.how === 'page') { if (t >= NA.PAGE.from && t <= NA.PAGE.to) { const px = findX(C, f), dx = px - s.x, dy = NA.PAGE.y - (s.y + 0.625);
        if (Math.hypot(dx, dy) <= NA.PAGE.r + 0.35) { pin(na, f, t, true); na.page = { t, caught: true }; s.react = { name: 'focused', dur: 0.8, at: t }; } }
      if (t >= NA.PAGE.drop && !na.got[f.id]) { pin(na, f, t, false); na.page = { t, caught: false }; } continue; }
    const fx = findX(C, f), dx = fx - O.x, dy = f.y - O.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const inCone = dx > 0 && d <= (f.near || NA.NEAR) && d <= NA.R(t, v) && Math.abs(ang - aim) <= half;
    if (inCone) { const a2 = (na.acc[f.id] || 0) + DT; na.acc = { ...na.acc, [f.id]: a2 }; if (a2 >= NA.LIT) pin(na, f, t, true); }
    else if (s.x > fx + 0.3) pin(na, f, t, false);   // passed it in the dark: it still pins, greyed (the plot never waits)
  }
  // the biggest door: Space = a purple fizzle on its frame, he doesn't move (the core's blink-hop is taken back)
  if (s.glitchAt === t && t >= NA.STOP[0] - 0.4 && t <= NA.STOP[1] + 0.2) { na.fizzle = t; if (s.y < 0.6) { s.y = 0; s.vy = 0; s.ground = true; } }
  // Enter on nothing (Space in the window); missed: he presses it himself, half a beat late
  if (!na.enter && t >= NA.ENTER[0] && t <= NA.ENTER[1] && (inp.G || s.glitchAt === t)) { na.enter = { t, by: 'player' }; if (s.y < 0.6) { s.y = 0; s.vy = 0; s.ground = true; } }
  if (!na.enter && t >= NA.ENTER_AUTO) na.enter = { t, by: 'auto' };
  s.na = na;
}
export const mode = { init() {} };   // (no mode.step: the core runner owns the frame)

// ---------------- what the box says at time t (a pure function of t + the run's state) ----------------
export function boxAt(t, na) {
  // -> { field, cursor, denied (0..1 alpha), deniedAt, unlocked (0..1), fly: {card, k} | null, enter }
  let field = '', denied = 0, fly = null, tint = null;
  for (const G of GUESSES) {
    if (t >= G.t0 - 0.45 && t < G.t0 && G.card) fly = { card: G.card, k: (t - (G.t0 - 0.45)) / 0.45 };
    if (t >= G.t0 && t < G.denied + 0.55) {
      if (G.thu) { const k = Math.floor((t - G.t0) / G.per); field = t - G.t0 < 0.5 ? 'THU' : G.g.slice(0, Math.max(3, Math.min(G.g.length, 3 + k - 1))); }
      else field = G.g.slice(0, Math.min(G.g.length, 1 + Math.floor((t - G.t0) / G.per)));
      if (t >= G.denied) tint = 'red'; }
    if (t >= G.denied && t < G.denied + 1.4) denied = Math.max(denied, t < G.denied + 1.1 ? 1 : 1 - (t - G.denied - 1.1) / 0.3);
  }
  const unlocked = t >= NA.UNLOCK ? clamp((t - NA.UNLOCK) / 0.15) : 0;
  return { field, tint, denied, fly, unlocked, enter: na && na.enter };
}
// the cards on the board: [{ id, kind, lit, t, struck }] in pin order
export function cardsAt(t, na) {
  const out = []; if (!na) return out;
  for (const f of FINDS) { const g = na.got[f.id]; if (!g || g.t > t) continue;
    const G = GUESSES.find(q => q.card === f.id); out.push({ id: f.id, kind: f.kind, lit: g.lit, t: g.t, struck: !!G && t >= G.denied }); }
  return out.sort((a, b) => a.t - b.t);
}
export function lightAt(t, na) {   // the drawn light: na.L + the flare on "case" (127.44) + the hush flicker (154.62 → 157.34, dips on Chikin's big taps)
  let L = na ? na.L : L0;
  if (t >= 127.44 && t < 127.80) L = Math.min(1, L + 0.3);
  if (t >= 154.62 && t < 157.34) { const dips = [154.81, 155.46, 156.10, 156.92]; for (const d of dips) if (t >= d && t < d + 0.09) L = 0.12; if (t >= 154.62 && t < 154.70) L = 0.12; }
  return L;
}

// ---------------- the overlay (browser only) ----------------
import { TAPS_GLITCH, TAPS_BIG } from '../levels/no-answer-runner.taps.mjs';
import { BLANK_Q } from '../blank.mjs';
// SET STRIP (Chikin, Nov 5: "the assets are supposed to go away" / "It's a setting, they have to fill the space",
// D-20261105-12/28): in the movie set (?blank) the overlay draws only the empty password box as the moon (ASK, left in) and
// the one whole-screen glitch (ASK); the locked screen, the guesses, DENIED, UNLOCKED, the case board, the torch, his
// glitches and his thoughts are not drawn. Only DRAWING changes: the hunt above is untouched. ?oldprops shows them again.
const SET = BLANK_Q && !(() => { try { return new URLSearchParams(location.search).has('oldprops'); } catch (e) { return false; } })();
const REST = { field: '', tint: null, denied: 0, fly: null, unlocked: 0, enter: null };   // (the box at rest: empty, never typed in)
const OSW = '"Oswald", "Arial Narrow", Impact, sans-serif', MONO = '"Major Mono Display", ui-monospace, monospace';
const COL = { moon: '#e8f4ff', halo: '200,225,255', red: '#ff4a4a', ok: '#59f59a', lilac: '201,167,255', purple: '#7b3cf2', purple2: '#9a52ff', ink: '#05080a', cream: '#efe3c4', warm: '#ffecbe' };
export function modeView({ C }) {
  SHARED.C = C;   // (the story layer projects the same course)
  const W = 960, H = 540;
  const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  let boxCv = null, boxKey = '';
  // the box at rest (top right, the moon): 196 x 62 px at 960 wide; the faint lyric line sits top centre, clear of it
  const BX = 750, BY = 14, BW = 196, BH = 64;
  function drawBox(x, B, t, na, sc = 1, cx = BX, cy = BY) {
    const w = BW * sc, h = BH * sc;
    x.save(); x.translate(cx, cy); x.scale(sc, sc);
    // the halo (the moon's light) — cheap: two soft rects, no gradients per frame beyond one
    const g = x.createRadialGradient(BW / 2, BH / 2, 10, BW / 2, BH / 2, BW * 0.9); g.addColorStop(0, `rgba(${B.unlocked ? '120,255,170' : COL.halo},${B.unlocked ? 0.16 * Math.max(0, 1 - (t - NA.UNLOCK) / 0.8) + 0.08 : 0.10})`); g.addColorStop(1, `rgba(${COL.halo},0)`);
    x.fillStyle = g; x.fillRect(BW / 2 - BW * 0.9, BH / 2 - BW * 0.9, BW * 1.8, BW * 1.8);   // (the rect covers the whole gradient: no hard edge under the moon)
    x.fillStyle = 'rgba(6,10,18,0.94)'; x.strokeStyle = B.unlocked && t - NA.UNLOCK < 0.25 ? COL.ok : COL.moon; x.lineWidth = 2.2;
    x.beginPath(); x.roundRect(0, 0, BW, BH, 12); x.fill(); x.stroke();
    x.textAlign = 'center'; x.fillStyle = '#eef4ff'; x.font = `700 13px ${OSW}`; x.fillText(B.unlocked ? 'MASTER PASSWORD' : 'ENTER MASTER PASSWORD', BW / 2, 18);
    x.strokeStyle = '#b9c4e6'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(14, 26, BW - 28, 28, 6); x.stroke();
    if (B.unlocked) { x.fillStyle = COL.ok; x.font = `700 20px ${OSW}`; x.globalAlpha = B.unlocked; x.fillText('UNLOCKED', BW / 2, 47); x.globalAlpha = 1; }
    else {
      x.textAlign = 'left'; x.font = `400 15px ${MONO}`; x.fillStyle = B.tint === 'red' ? '#ffb0b0' : '#eef4ff'; x.fillText(B.field, 22, 46);
      const cw = x.measureText(B.field).width, blink = Math.floor((t - C.OFF) / C.P) % 2 === 0;
      const still = na && na.enter && t >= na.enter.t;
      if (!B.tint && (blink || still)) { x.fillStyle = '#eef4ff'; x.fillRect(22 + cw + 2, 44, 10, 2.5); }
      // ↵ : pulses on the beats before Enter, pressed once
      const ent = !SET && [155.48, 156.20, 156.92].some(b => t >= b && t < b + 0.22) && !(na && na.enter);   // (SET: the ↵ never pulses)
      const pressed = na && na.enter && t >= na.enter.t && t < na.enter.t + 0.35;
      x.font = `700 16px ${OSW}`; x.textAlign = 'right'; x.fillStyle = pressed ? '#ffffff' : ent ? '#ffffff' : 'rgba(185,196,230,0.55)';
      if (pressed) { x.fillStyle = 'rgba(232,244,255,0.25)'; x.fillRect(BW - 40, 28, 24, 24); x.fillStyle = '#fff'; }
      x.fillText('↵', BW - 20, 46);
      if (ent) { x.strokeStyle = 'rgba(232,244,255,0.8)'; x.lineWidth = 1.5; x.strokeRect(BW - 40, 28, 24, 24); }
    }
    x.restore();
    if (B.denied > 0) { x.save(); x.globalAlpha = B.denied; x.fillStyle = COL.red; x.font = `700 12px ${OSW}`; x.textAlign = 'right'; x.fillText('DENIED', cx + w - 6, cy + h + 14); x.restore(); }
  }
  // the card pictures (tiny, no words: THU is the one with letters, it's the guess's own)
  function cardArt(x, id, cx, cy, s, lit) {
    x.save(); x.translate(cx, cy); x.scale(s, s); x.lineWidth = 1.6; x.strokeStyle = '#120a05';
    if (id === 'coupon') { x.fillStyle = '#e8dcbe'; x.fillRect(-9, -6, 18, 12); x.setLineDash([2, 2]); x.strokeStyle = '#6b5530'; x.strokeRect(-7.5, -4.5, 15, 9); x.setLineDash([]);
      x.fillStyle = '#da9643'; x.strokeStyle = '#120a05'; x.beginPath(); x.ellipse(0, 0, 3.5, 4.2, 0, 0, 7); x.fill(); x.stroke(); }
    else if (id === 'flag') { x.strokeStyle = '#d9c9a0'; x.beginPath(); x.moveTo(-5, 8); x.lineTo(-5, -8); x.stroke(); x.fillStyle = '#d33a3a'; x.beginPath(); x.moveTo(-5, -8); x.lineTo(7, -5); x.lineTo(-5, -2); x.closePath(); x.fill(); x.fillStyle = '#2a64c8'; x.fillRect(-5, -5.5, 3, 2); }
    else if (id === 'sticky') { x.fillStyle = '#ffe36b'; x.fillRect(-7, -7, 14, 14); x.fillStyle = '#9a8a30'; x.fillRect(-4, -2, 8, 1.4); x.fillRect(-4, 1.5, 6, 1.4); }
    else if (id === 'thu') { x.fillStyle = '#f2efe6'; x.fillRect(-7, -8, 14, 16); x.fillStyle = '#d33a3a'; x.fillRect(-7, -8, 14, 4); x.fillStyle = '#120a05'; x.font = `700 6px ${OSW}`; x.textAlign = 'center'; x.fillText('THU', 0, 5); }
    else if (id === 'nameplate') { x.fillStyle = '#b58a3a'; x.fillRect(-9, -4, 18, 8); x.fillStyle = '#5a4210'; x.fillRect(-6, 1, 12, 1); }
    else if (id === 'hollow') { x.strokeStyle = '#cfe9ff'; x.strokeRect(-5, -8, 10, 16); x.beginPath(); x.arc(2.5, 0, 1, 0, 7); x.stroke(); }
    else if (id === 'page') { x.fillStyle = '#f2efe6'; x.fillRect(-6, -8, 12, 16); x.fillStyle = '#8a92a2'; x.fillRect(-4, -5, 8, 1); x.fillRect(-4, -2, 6, 1); x.fillStyle = '#c03030'; x.fillRect(-4, 3, 4, 2); }
    else if (id === 'hint') { x.strokeStyle = '#cfe9ff'; x.strokeRect(-8, -5, 16, 10); }
    x.restore();
    if (!lit) { x.save(); x.fillStyle = 'rgba(5,8,10,0.55)'; x.fillRect(cx - 11 * s, cy - 10 * s, 22 * s, 20 * s); x.restore(); }
  }
  function board(x, t, na) {
    const cards = cardsAt(t, na); if (!cards.length) return;
    const grow = t >= NA.HUSH ? 1 + 0.4 * ease((t - NA.HUSH) / 1.0) : 1, cs = 20 * grow, gap = 4 * grow;
    let cx = BX + BW - cs / 2;
    const cy = BY + BH + 30 + 6 * (grow - 1) * 3;
    const blinkOn = Math.floor((t - C.OFF) / C.P) % 2 === 0;
    for (let i = cards.length - 1; i >= 0; i--) { const c = cards[i], age = t - c.t, pop = age < 0.25 ? 1 + 0.5 * (1 - age / 0.25) : 1;
      x.save(); x.globalAlpha = 0.85; x.fillStyle = c.kind === 'lead' ? 'rgba(40,30,18,0.9)' : 'rgba(14,22,34,0.9)'; x.strokeStyle = c.kind === 'lead' ? 'rgba(255,220,160,0.7)' : 'rgba(207,233,255,0.7)';
      x.lineWidth = 1.2; x.beginPath(); x.roundRect(cx - cs / 2 * pop, cy - cs / 2 * pop, cs * pop, cs * pop, 3); x.fill(); x.stroke(); x.globalAlpha = 1;
      cardArt(x, c.id, cx, cy, 0.8 * grow * pop, c.lit);
      if (c.kind === 'blank' && blinkOn && !(na.enter && t >= na.enter.t)) { x.fillStyle = '#eef4ff'; x.fillRect(cx - 4 * grow, cy + cs / 2 - 4 * grow, 8 * grow, 1.6 * grow); }   // the box's cursor, in time
      if (c.struck) { const k = clamp((t - (GUESSES.find(g => g.card === c.id).denied)) / 0.15); x.strokeStyle = COL.red; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - cs / 2, cy + cs / 2); x.lineTo(cx - cs / 2 + cs * k, cy + cs / 2 - cs * k); x.stroke(); }
      x.restore(); cx -= cs + gap; }
  }
  function glitchOn(x, P, t, big, seed) {   // a small purple glitch on HIM (Chikin's Tapper marks): tears across his box, never the world
    const n = big ? 5 : 3, w = big ? 70 : 46;
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const yy = P.y - 34 + rnd(seed, i) * 62, ww = w * (0.4 + rnd(seed, i + 9)), xx = P.x - ww / 2 + (rnd(seed, i + 3) - 0.5) * 30;
      x.fillStyle = i % 2 ? `rgba(154,82,255,${big ? 0.75 : 0.5})` : `rgba(123,60,242,${big ? 0.7 : 0.45})`; x.fillRect(xx, yy, ww, big ? 4 : 2.5); }
    x.restore();
  }
  const tapsG = TAPS_GLITCH, tapsB = TAPS_BIG;
  function lastTap(list, t, win) { let lo = 0, hi = list.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (list[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r >= 0 && t - list[r] < win ? r : -1; }
  return {
    over(x, f) {
      const { s, t } = f, na = s.na; if (!na) return;
      const P = f.project(s.x, s.y + 0.62);
      const u = f.project(s.x + 1, s.y).x - f.project(s.x, s.y).x;   // px per world unit
      // (the black beats: the story layer goes fully dark; he stays lit, as the movie keeps him — the 3D Potato draws above this overlay)
      // ---- the torch in the hatband: a small gunmetal cylinder, 1 px purple glitch edge (his), lens at the beam's origin ----
      // (SET: out, the torch is part of HIM and he's removed from the set; the beam stays. Chikin: "the assets are supposed to go away")
      if (!SET && t >= 5.5 && !(t >= 172.85 + 3.6)) { const L = lensOf(s), A = f.project(L.x, L.y), ang = -(na.aim) * Math.PI / 180, k = u / 96;
        x.save(); x.translate(A.x, A.y); x.rotate(ang); x.scale(k * 1.6, k * 1.6); x.fillStyle = '#6a707c'; x.strokeStyle = '#120a05'; x.lineWidth = 2.4;
        x.beginPath(); x.roundRect(-16, -4, 16, 8, 2); x.fill(); x.stroke(); x.beginPath(); x.roundRect(-4, -5.5, 6, 11, 2); x.fill(); x.stroke();
        x.strokeStyle = 'rgba(154,82,255,0.9)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-15, -4.8); x.lineTo(-5, -4.8); x.stroke();
        x.fillStyle = inBlack(t) ? '#3a3326' : '#fff6dc'; x.fillRect(2, -4.5, 1.6, 9); x.restore(); }
      // ---- his glitches on the Tapper marks (on him only; none in the hush's stillness 157.34–161.66 except his own) ----
      // (SET: out, his glitches are performed by the movie crew on the same taps; nothing drawn where he stood)
      if (!SET && t > 6) { const bi = lastTap(tapsB, t, 0.1), gi = lastTap(tapsG, t, 0.07);
        if (bi >= 0) glitchOn(x, P, t, true, bi * 7 + Math.floor(t * 24)); else if (gi >= 0) glitchOn(x, P, t, false, gi * 5 + Math.floor(t * 24)); }
      // ---- the whole-screen ⚡ (the level's one, 161.66, his): purple tears across everything for 0.3 s ----
      if (t >= NA.UNLOCK && t < NA.UNLOCK + 0.3) { const k = (t - NA.UNLOCK) / 0.3; x.save(); x.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 14; i++) { const yy = rnd(i, Math.floor(t * 30)) * H, hh = 4 + rnd(i, 3) * 22; x.fillStyle = i % 3 ? `rgba(154,82,255,${0.55 * (1 - k)})` : `rgba(123,60,242,${0.5 * (1 - k)})`; x.fillRect((rnd(i, 7) - 0.5) * 80, yy, W, hh); }
        x.restore(); }
      // ---- his thoughts (faint purple, lowercase, near him; never on the lyric line or under the box) ----
      // (SET: out, his lines at his place. Chikin: "the assets are supposed to go away")
      if (!SET) for (const [a, b, txt] of NA.THINK) if (t >= a && t < b) { const k = Math.min(clamp((t - a) / 0.12), clamp((b - t) / 0.2));
        x.save(); x.font = `400 17px ${MONO}`; x.textAlign = 'left'; x.globalAlpha = 0.85 * k; x.shadowColor = COL.purple; x.shadowBlur = 2; x.fillStyle = `rgb(${COL.lilac})`;
        const tx = Math.min(W - 330, P.x + 0.7 * u), ty = Math.max(150, P.y - 1.5 * u); x.fillText(txt, tx, ty); x.restore(); }
      // ---- the intro: the locked screen (0 → 6.0), then the box rises into the sky by 9.64 ----
      // (SET: no locked screen, no typing: the empty box hangs in the sky as the moon from the start; ASK, left in until Chikin says)
      if (SET) { drawBox(x, REST, t, null); return; }
      const B = boxAt(t, na);
      if (t < 9.64) { const k = ease((t - 6.0) / 3.64), sc = 2.6 + (1 - 2.6) * k, cx = (W - BW * 2.6) / 2 + (BX - (W - BW * 2.6) / 2) * k, cy = 170 + (BY - 170) * k;
        if (t < 6.0) { x.save(); x.fillStyle = `rgba(0,0,0,${t < 2.2 ? 0.96 : 0.96 * (1 - ease((t - 2.2) / 3.8)) })`; x.fillRect(0, 0, W, H);
          x.textAlign = 'center'; x.font = `700 15px ${OSW}`; x.fillStyle = `rgba(232,244,255,${t < 3.5 ? clamp(t / 0.8) : clamp((5.2 - t) / 1.2)})`; x.fillText('ALL SYSTEMS LOCKED', W / 2, 150); x.restore(); }
        drawBox(x, { ...B, field: t >= 2.4 ? 'hint: ______'.slice(0, Math.min(12, Math.floor((t - 2.4) / 0.08))) : '' }, t, na, sc, cx, cy);
        return; }
      // ---- the guess's card picture flies into the field ----
      if (B.fly) { const k = ease(B.fly.k), sx = BX + BW - 12, sy = BY + BH + 30, ex = BX + 30, ey = BY + 40;
        cardArt(x, B.fly.card, sx + (ex - sx) * k, sy + (ey - sy) * k - Math.sin(k * Math.PI) * 14, 1.1, true); }
      board(x, t, na);
      drawBox(x, B, t, na);
      // the biggest door's fizzle: his glitch can't pass it (purple on its frame for a few frames)
      if (na.fizzle != null && t - na.fizzle < 0.25) { const D = f.project(C.X(NA.STOP[0]) + 0.85, 1.8); x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(154,82,255,${0.8 * (1 - (t - na.fizzle) / 0.25)})`; x.lineWidth = 3;
        for (let i = 0; i < 5; i++) { const yy = D.y - 2 * u + rnd(i, Math.floor(t * 40)) * 4 * u; x.beginPath(); x.moveTo(D.x - 0.6 * u, yy); x.lineTo(D.x + 0.6 * u, yy + (rnd(i, 4) - 0.5) * 8); x.stroke(); } x.restore(); }
    },
  };
}
export const SHARED = {};   // (the level writes the ground here once built: the story layer paints the same drains + roofs)

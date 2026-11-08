// story-between-messages-street.mjs — THE STREET, painted (Streetlight Crew, Nov 4 2026). The picture behind the new Between
// Messages runner (levels/between-messages-street.mjs): a night neighbourhood, house to house, the phone line strung between
// the poles, a doorbell by every door. An aesthetic template for the movie crew: the world and its light, nothing else.
//
// The ground he walks is painted HERE, from the very runs the level's blocks are made of (ST.runs, through the real camera:
// E.project), so every porch, roof, wire and pavement edge sits exactly where his feet do. view.mjs leaves those blocks
// invisible (style 'painted').
//
// Back to front, in story px (960 x 540): the sky (gradient, stars, a thin moon) · the far suburb (parallax 0.15: a low
// roofline, a far pole line) · the back row of houses (0.45) · HIS side of the street (world-locked): the houses, their
// windows, doors and doorbells, the poles, the lamps · the walkable things: pavement + kerb + road, cable trenches, porch
// decks and garden walls, porch roofs on posts, the phone line, the trunk cable on the tallest poles.
// Style: Vega's sticker language at night. Thick dark ink (#120a05), flat muted colour, a little hand wobble on every
// straight line, a thin white sticker edge only on the near things (porches, roofs, poles, wires, bells). Warm comes only
// from windows and lamps. NO purple anywhere in the street: purple is only Potato's own glitch. No people, no text, nothing
// in front of him.
//
// The light (ST.litAt, the old level's ON / OUT list): lit while they type (windows amber, porch lights and lamps on), out
// when they stop (windows go dark in a ripple out from him, lamps dim to 30 %, a few blue TVs stay on). It never touches
// the ground's readability: wires, edges and bells keep their sticker edge in both.
// Moments: the first bell wakes the street ("Yeah.", 3.24) · the lamp over him flickers ("flickers", 40.32) · house 6 goes
// dark on "goodnight" (76.64) · house 7's many windows all light on "million" (91.96) · the bridge's new house is cold
// white-blue · house 10 (the ones who stayed) stays lit · after "gone." every window in the street blazes without him
// (177.58), then the street goes out house by house (187.3 →).
// BOLD CHOICE (cut it with LEFT_ON = false): when the street goes out at the end, one porch light far ahead stays on —
// someone left it on, and he runs toward it as the song ends.
import { W, H, clamp, ease, rnd, glow } from '../story.mjs';
import { BLANK_Q } from '../blank.mjs';
// SET STRIP (Chikin, Nov 5: "the assets are supposed to go away" / "It's a setting, they have to fill the space",
// D-20261105-12/28): in the movie set (?blank) the previous-story props are not drawn; only the look stays (the street, its
// houses, bells, wires and light). ?oldprops shows them again in a blank run, to compare. The playable game is unchanged.
const SET = BLANK_Q && !(() => { try { return new URLSearchParams(location.search).has('oldprops'); } catch (e) { return false; } })();
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare

export const ST = { runs: [], trenches: [], moves: [], litAt: () => false, flips: [], V: 7.2, TIER: [0, 0.9, 1.8, 2.7, 3.6], blaze: [177.58, 187.3], out0: 187.3, end: 192.4, P: 0.56206 };
const LEFT_ON = true;                                   // the bold choice (see the header): false = every light goes out

const INK = '#120a05', STK = '#e8eefc';                 // ink, sticker edge (a night white)
const WIN = '#ffcf8a', WIN2 = '#ffe2b8', TV = '#8fb0ff', COLD = '#cfe6ff', WARMEST = '#ffbe6a';
const BODY = ['#2a3350', '#3a3048', '#1f3a3e', '#4a2a26', '#4b4636'];
const ROOF = '#191c2c', WOOD = '#3a2a22', WOOD2 = '#4a3628', POLE = '#2a1a10';
const PAVE = '#1b2030', KERB = '#2a3046', ROAD = '#0c0e18', DASH = '#3a4058', FIBRE = '#6f86c9', GLASS = '#9fd8c8';

// ---------------- the layout, made once from the ground (houses, doors, bells, poles, lamps) ----------------
let L = null;
function build() {
  const V = ST.V, T = ST.TIER, xs = t => V * t;
  const runs = ST.runs.map(r => ({ ...r, x0: xs(r.t0), x1: xs(r.t1), y: T[r.tier] }));
  const trenches = ST.trenches.map(tr => ({ x0: xs(tr.t0), x1: xs(tr.t1) }));
  const bells = ST.moves.filter(m => m.k === 'B').map((m, i) => ({ t: m.t, x: xs(m.t), y: T[m.tier], tier: m.tier, word: m.word, i }));   // (the bell sits right where he is on its word)
  // houses: a row of them all down the street (11 – 17 wide, small yards between), then the featured ones get their thing
  const houses = []; let x = -22, k = 0;
  const xEnd = xs(ST.end) + 40;
  while (x < xEnd) { const w = 11 + rnd(k, 1) * 6, gap = 1.2 + rnd(k, 2) * 1.6, two = rnd(k, 3) < 0.45;
    houses.push({ k, x0: x, x1: x + w, hh: two ? 4.7 + rnd(k, 4) * 0.4 : 3.3 + rnd(k, 4) * 0.3, two, body: BODY[(k * 3 + (rnd(k, 5) < 0.5 ? 1 : 0)) % BODY.length],
      gable: rnd(k, 6) < 0.7, peak: 1.1 + rnd(k, 7) * 0.7, door: null, trait: null, seed: k * 13.7 }); x += w + gap; k++; }
  const houseAt = px => houses.find(h => px >= h.x0 - 0.6 && px <= h.x1 + 0.6) || houses.reduce((a, h) => Math.abs((h.x0 + h.x1) / 2 - px) < Math.abs((a.x0 + a.x1) / 2 - px) ? h : a);
  for (const b of bells) { const h = houseAt(b.x); h.x0 = Math.min(h.x0, b.x - 1.6); h.x1 = Math.max(h.x1, b.x + 1.2); h.door = { x: b.x - 1.12, y: b.y, bell: b }; b.h = h; }
  for (const h of houses) if (!h.door) h.door = { x: h.x0 + (h.x1 - h.x0) * (0.25 + 0.4 * rnd(h.k, 9)), y: 0, bell: null };
  const feat = (t, trait) => { const h = houseAt(xs(t)); h.trait = trait; return h; };
  feat(48.2, 'dish').two = true; feat(48.2, 'dish').hh = 5.0;
  feat(68.38, 'chorus');
  feat(76.2, 'goodnight');
  feat(92.6, 'million').two = true; feat(92.6, 'million').hh = 5.1;
  feat(114.32, 'chorus');
  { const h = feat(120.8, 'new'); h.gable = false; h.two = true; h.hh = 4.6; h.body = '#2c3446'; }
  { const h = feat(139.04, 'stayed'); h.body = '#4a2a26'; }
  feat(170.46, 'last').two = false;
  // windows: a grid per floor, kept off the door
  for (const h of houses) { h.wins = []; const floors = h.two ? 2 : 1, w = h.x1 - h.x0, n = h.trait === 'million' ? 7 : Math.max(2, Math.round(w / 3.4));
    for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) { const cw = w / n, wx = h.x0 + cw * (i + 0.5), small = h.trait === 'million';
      if (f === 0 && Math.abs(wx - (h.door.x + 0.4)) < 1.2) continue;
      const ww = small ? 0.72 : 1.05 + 0.25 * rnd(h.k, i + 20), wh = small ? 0.7 : 1.0;
      h.wins.push({ x: wx - ww / 2, y: (f === 0 ? 1.55 : 3.3) + (small ? 0.15 : 0), w: ww, h: wh, keep: rnd(h.k * 7 + i, f + 3), tv: rnd(h.k * 5 + i, f + 9) < 0.12, f, i });
      if (small) h.wins.push({ x: wx - ww / 2, y: (f === 0 ? 2.45 : 4.15), w: ww, h: 0.55, keep: rnd(h.k * 3 + i, f + 7), tv: false, f, i, row2: true }); } }
  // the network: poles where the phone line breaks or ends, and every ~10 along a run; the tallest two carry the trunk
  const line = runs.filter(r => r.tier === 3), top = runs.filter(r => r.tier === 4);
  const poles = [];
  const addPole = (px, kind = 'line') => { if (poles.some(p => Math.abs(p.x - px) < 2.2 && p.kind === kind)) return; poles.push({ x: px, kind }); };
  for (let i = 0; i < line.length; i++) { const r = line[i], n = line[i + 1];
    if (n && n.x0 - r.x1 < 2.5) addPole((r.x1 + n.x0) / 2, 'gap'); else { addPole(r.x1 + 0.5, 'end'); }
    if (!line[i - 1] || r.x0 - line[i - 1].x1 >= 2.5) addPole(r.x0 - 0.5, 'end');
    const len = r.x1 - r.x0, m = Math.floor(len / 10); for (let j = 1; j <= m; j++) addPole(r.x0 + len * j / (m + 1), 'mid'); }
  for (const r of top) { poles.push({ x: r.x0 - 0.4, kind: 'tall' }); poles.push({ x: r.x1 + 0.4, kind: 'tall' }); }
  poles.sort((a, b) => a.x - b.x);
  // street lamps: every ~17, never on top of a pole
  const lamps = []; for (let lx = 6; lx < xEnd; lx += 15 + rnd(lx, 3) * 5) if (!poles.some(p => Math.abs(p.x - lx) < 4)) lamps.push({ x: lx, k: lamps.length });
  const flick = lamps.reduce((a, l) => Math.abs(l.x - xs(40.6)) < Math.abs(a.x - xs(40.6)) ? l : a); flick.flicker = [40.32, 41.4];
  const firstLamp = lamps.find(l => l.x > xs(3.24) - 4) || lamps[0];
  // the far suburb + the back row (their own x, in parallax space)
  const far = []; for (let i = 0; i < 260; i++) far.push({ x: i * 7.5 + rnd(i, 1) * 3, w: 5 + rnd(i, 2) * 4, h: 0.8 + rnd(i, 3) * 1.4, gable: rnd(i, 4) < 0.6, i });
  const back = []; let bx = -10; for (let i = 0; bx < 2400; i++) { const w = 6 + rnd(i, 11) * 4; back.push({ x0: bx, x1: bx + w, hh: 2.0 + rnd(i, 12) * 1.4, gable: rnd(i, 13) < 0.65, i, body: BODY[i % BODY.length] }); bx += w + 0.8 + rnd(i, 14) * 1.2; }
  // the end: the houses go out one by one; the last one ahead keeps its porch light (LEFT_ON)
  const endX = xs(ST.end); const leftOn = houseAt(endX + 2.5); leftOn.door = { x: endX + 2.5, y: 0, bell: null }; leftOn.x1 = Math.max(leftOn.x1, endX + 4.5); leftOn.x0 = Math.min(leftOn.x0, endX + 1);   // (its door 2.5 ahead of him as the song ends)
  L = { runs, trenches, bells, houses, poles, lamps, far, back, line, top, flick, firstLamp, leftOn, chair: xs(75.9), gn: houseAt(xs(76.2)) };
  return L;
}

// ---------------- the light ----------------
const blazing = t => t >= ST.blaze[0] && t < ST.out0;
// how lit the street is at x (a ripple out from him: the light leaves the nearest house first, a quarter second per 7 units)
function litK(t, x, px) { const d = Math.abs(x - px) / 28; return ST.litAt(t - d) ? 1 : 0; }
function winOn(t, h, w, px, wx) {
  if (t >= ST.out0) { const at = ST.out0 + clamp((wx - (px - 14)) / 34) * 4.4 + w.keep * 0.25; return t < at ? 1 : 0; }
  if (blazing(t)) return t >= ST.blaze[0] + clamp((Math.abs(wx - px)) / 40) * 0.6 ? 1 : 0;   // every window, without him
  if (h.trait === 'goodnight' && t >= 76.64) return 0;
  if (h.trait === 'million' && t >= 91.96) return 1;
  if (h.trait === 'stayed') return w.keep < 0.85 ? 1 : 0;
  if (t < 3.24) return w.tv && w.keep < 0.4 ? 0.7 : 0;   // before "Yeah.": asleep (one blue TV here and there)
  const on = litK(t, wx, px);
  return on ? (w.keep < 0.62 ? 1 : 0) : (w.tv ? 0.75 : 0);
}
const lampK = (t, l, px) => { if (blazing(t) || (t >= ST.out0 && t < ST.out0 + clamp((l.x - (px - 14)) / 34) * 4.4)) return 1; if (t >= ST.out0) return 0; if (t < 3.24) return 0;
  if (l.flicker && t >= l.flicker[0] && t < l.flicker[1]) return rnd(Math.floor(t * 18), l.k) < 0.45 ? 0.15 : 1;
  return litK(t, l.x, px) ? 1 : 0.3; };

// ---------------- drawing helpers (world units through the camera) ----------------
let A = { x: 0, y: 0 }, BX = 96, DY = -96;
const sx = x => A.x + BX * x, sy = y => A.y + DY * y;
function wob(x, y, seed, amt = 0.03) { return [sx(x + (rnd(seed, x * 3.1) - 0.5) * amt), sy(y + (rnd(seed, y * 2.7 + 1) - 0.5) * amt)]; }
function wpoly(pts, seed, amt) { ctx_.beginPath(); pts.forEach(([x, y], i) => { const [X, Y] = wob(x, y, seed + i, amt); i ? ctx_.lineTo(X, Y) : ctx_.moveTo(X, Y); }); ctx_.closePath(); }
function wrect(x0, y0, x1, y1, seed, amt = 0.035) {   // a hand-made rectangle: corners and a midpoint on the long sides wobble a little
  const mx = (x0 + x1) / 2; wpoly([[x0, y0], [mx, y0 - 0.01], [x1, y0], [x1, y1], [mx, y1 + 0.01], [x0, y1]], seed, amt); }
function inkFill(fill, lw = 3, sticker = false) { const c = ctx_; c.lineJoin = 'round'; c.lineCap = 'round';
  if (sticker && OLD_WHITE) { c.lineWidth = lw + 4.5; c.strokeStyle = STK; c.globalAlpha *= 0.85; c.stroke(); c.globalAlpha /= 0.85; }
  if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
let ctx_ = null;

// ---------------- the sky + the far layers ----------------
const STARS = Array.from({ length: 80 }, (_, i) => ({ x: rnd(i, 1) * W, y: rnd(i, 2) * H * 0.55, r: 0.7 + rnd(i, 3) * 1.3, tw: rnd(i, 4) }));
function sky(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#03040b'); g.addColorStop(1, '#121a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const s of STARS) { ctx.globalAlpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * (0.6 + s.tw) + s.tw * 9)); ctx.fillStyle = s.tw < 0.3 ? '#8fa6e6' : '#6f86c9'; ctx.fillRect(s.x, s.y, s.r, s.r); }
  ctx.globalAlpha = 1;
  // a thin moon, high up-left: a crescent, inked, its rim lit
  const mx = W * 0.14, my = H * 0.16, r = 26; glow(ctx, mx, my, 90, '#8fa6e6', 0.12);
  ctx.save(); ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fillStyle = '#dfe6f5'; ctx.fill(); ctx.clip(); ctx.beginPath(); ctx.arc(mx + 10, my - 7, r * 0.9, 0, 7); ctx.fillStyle = g; ctx.fill(); ctx.restore();
}
// parallax: a layer at factor p scrolls p times as fast as the street, and its ground sits between a fixed horizon and the street's
function para(p) { const camX = (W / 2 - A.x) / BX, hz = H * 0.6; return { X: x => W / 2 + (x - camX * p) * BX * p, Y: y => (hz + (A.y - hz) * p) + DY * p * y, k: BX * p }; }
function farSuburb(ctx, t, px) {
  const F = para(0.15), lit = ST.litAt(t) || blazing(t);
  ctx.fillStyle = '#0a0d1c';
  for (const f of L.far) { const x0 = F.X(f.x), x1 = F.X(f.x + f.w); if (x1 < -20 || x0 > W + 20) continue; const y1 = F.Y(0), y0 = F.Y(f.h * 2.4);
    ctx.beginPath(); ctx.moveTo(x0, y1 + 200); ctx.lineTo(x0, y0); if (f.gable) ctx.lineTo((x0 + x1) / 2, y0 - (x1 - x0) * 0.3); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1 + 200); ctx.fill();
    if (rnd(f.i, 8) < (lit ? 0.7 : 0.2)) { ctx.globalAlpha = 0.4; ctx.fillStyle = rnd(f.i, 9) < 0.2 ? TV : WIN; ctx.fillRect(x0 + (x1 - x0) * (0.2 + 0.5 * rnd(f.i, 10)), y0 + (y1 - y0) * 0.3, 3, 3); ctx.globalAlpha = 1; ctx.fillStyle = '#0a0d1c'; } }
  // the far pole line: thin wires between little poles
  ctx.strokeStyle = '#1a2240'; ctx.lineWidth = 1.2; const base = F.Y(3.2);
  const camX = (W / 2 - A.x) / BX, start = Math.floor((camX * 0.15 - W / F.k) / 9) * 9;
  for (let x = start; F.X(x) < W + 40; x += 9) { const a = F.X(x), b = F.X(x + 9); ctx.beginPath(); ctx.moveTo(a, base - 14); ctx.lineTo(a, base + 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(a, base - 12); ctx.quadraticCurveTo((a + b) / 2, base - 4, b, base - 12); ctx.stroke(); }
}
function backRow(ctx, t, px) {
  const B = para(0.45);
  for (const h of L.back) { const x0 = B.X(h.x0), x1 = B.X(h.x1); if (x1 < -10 || x0 > W + 10) continue;
    const y1 = B.Y(-0.6), y0 = B.Y(h.hh);
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); if (h.gable) ctx.lineTo((x0 + x1) / 2, y0 - (x1 - x0) * 0.28); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.closePath();
    ctx.fillStyle = h.body; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#070912'; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#05060c'; ctx.stroke();
    const n = Math.max(2, Math.round((h.x1 - h.x0) / 2.4)); for (let i = 0; i < n; i++) { const wx = h.x0 + (h.x1 - h.x0) * (i + 0.5) / n, keep = rnd(h.i * 5 + i, 3);
      const on = blazing(t) || (t >= 3.24 && t < ST.out0 && ST.litAt(t - 0.4 - keep * 0.5) && keep < 0.5) || (t >= ST.out0 && t < ST.out0 + keep * 4);
      const X = B.X(wx) - 5, Y = B.Y(h.hh * 0.55); ctx.fillStyle = on ? WIN : '#0d1020'; ctx.globalAlpha = on ? 0.55 : 0.8; ctx.fillRect(X, Y, 10, 9); ctx.globalAlpha = 1; } }
}

// ---------------- his side: the houses ----------------
function house(ctx, h, t, px) {
  const T = ST.TIER, seed = h.seed;
  // the body + the roof
  wrect(h.x0, 0, h.x1, h.hh, seed); inkFill(h.trait === 'new' ? '#2c3446' : h.body, 3);
  // siding lines (quiet)
  ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; for (let y = 0.45; y < h.hh - 0.1; y += 0.45) { ctx.beginPath(); ctx.moveTo(sx(h.x0 + 0.06), sy(y)); ctx.lineTo(sx(h.x1 - 0.06), sy(y)); ctx.stroke(); } ctx.restore();
  if (h.gable) { const mx = (h.x0 + h.x1) / 2; wpoly([[h.x0 - 0.45, h.hh - 0.05], [mx, h.hh + h.peak], [h.x1 + 0.45, h.hh - 0.05]], seed + 50, 0.05); inkFill(ROOF, 3.2);
    // shingle rows
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#2a2f44'; ctx.lineWidth = 1.2; for (let y = h.hh + 0.25; y < h.hh + h.peak; y += 0.28) { ctx.beginPath(); ctx.moveTo(sx(h.x0 - 1), sy(y)); ctx.lineTo(sx(h.x1 + 1), sy(y)); ctx.stroke(); } ctx.restore();
    if (rnd(h.k, 30) < 0.5) { const cx = h.x0 + (h.x1 - h.x0) * 0.72; wrect(cx, h.hh + h.peak * 0.35, cx + 0.55, h.hh + h.peak * 0.35 + 1.0, seed + 60); inkFill('#2a2226', 2.6); } }   // a chimney
  else { wrect(h.x0 - 0.25, h.hh - 0.05, h.x1 + 0.25, h.hh + 0.3, seed + 51); inkFill(h.trait === 'new' ? '#c9d4e6' : ROOF, 3); }
  if (h.trait === 'dish') { const dx = h.x1 - 1.4, dy = h.hh + (h.gable ? h.peak * 0.4 : 0.3); ctx.beginPath(); ctx.ellipse(sx(dx), sy(dy + 0.45), BX * 0.42, BX * 0.3, -0.5, 0, 7); inkFill('#8a8f9e', 2.6);
    ctx.beginPath(); ctx.moveTo(sx(dx), sy(dy + 0.45)); ctx.lineTo(sx(dx + 0.3), sy(dy + 0.75)); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
  // the windows
  for (const w of h.wins) {
    const k = winOn(t, h, w, px, w.x), col = h.trait === 'new' ? COLD : h.trait === 'stayed' ? WARMEST : w.tv && !ST.litAt(t) && !blazing(t) ? TV : WIN;
    wrect(w.x, w.y, w.x + w.w, w.y + w.h, seed + w.i * 3 + w.f, 0.02);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; inkFill(col, 2.6); ctx.restore(); ctx.save(); ctx.globalAlpha = 0.5 * k; ctx.fillStyle = WIN2; if (col === WIN || col === WARMEST) ctx.fillRect(sx(w.x + w.w * 0.25), sy(w.y + w.h * 0.75), BX * w.w * 0.5, BX * w.h * 0.5); ctx.restore();
      glow(ctx, sx(w.x + w.w / 2), sy(w.y + w.h / 2), BX * 1.1, col, 0.16 * k); }
    else { inkFill('#0d1020', 2.6); ctx.strokeStyle = '#2a3350'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(w.x + w.w * 0.2), sy(w.y + w.h * 0.35)); ctx.lineTo(sx(w.x + w.w * 0.45), sy(w.y + w.h * 0.75)); ctx.stroke(); }
    // the cross bars
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(w.x + w.w / 2), sy(w.y)); ctx.lineTo(sx(w.x + w.w / 2), sy(w.y + w.h)); ctx.moveTo(sx(w.x), sy(w.y + w.h / 2)); ctx.lineTo(sx(w.x + w.w), sy(w.y + w.h / 2)); ctx.stroke();
  }
  // the door (at his level when it has a bell), its frame, its porch light, its doorbell
  const d = h.door, dy0 = d.y, dw = 0.82, dh = 1.5;
  wrect(d.x - 0.08, dy0, d.x + dw + 0.08, dy0 + dh + 0.1, seed + 80, 0.02); inkFill('#15121a', 2.6);
  wrect(d.x, dy0, d.x + dw, dy0 + dh, seed + 81, 0.02); inkFill(h.trait === 'new' ? '#3a4458' : WOOD2, 2.6);
  ctx.fillStyle = '#c9a75a'; ctx.beginPath(); ctx.arc(sx(d.x + dw - 0.14), sy(dy0 + 0.72), 2.4, 0, 7); ctx.fill();
  const b = d.bell, rung = b && t >= b.t, since = b ? t - b.t : 99;
  // porch light over the door: on with the street, and always on once he's rung here
  const plK = (LEFT_ON && h === L.leftOn && t >= ST.out0) ? 1 : (rung && t < ST.out0) ? 1 : (t >= ST.out0 ? (t < ST.out0 + clamp((d.x - (px - 14)) / 34) * 4.4 ? 1 : 0) : blazing(t) ? 1 : t < 3.24 ? 0 : litK(t, d.x, px) * 0.85);
  const lx = d.x + dw / 2, ly = dy0 + dh + 0.32;
  if (h.trait === 'chorus') { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(lx), sy(ly + 0.45)); ctx.lineTo(sx(lx), sy(ly + 0.12)); ctx.stroke(); }   // the hanging porch light
  ctx.beginPath(); ctx.arc(sx(lx), sy(ly), BX * 0.12, 0, 7); inkFill(plK > 0.05 ? WIN2 : '#3a3a40', 2.2);
  if (plK > 0.05) { glow(ctx, sx(lx), sy(ly), BX * 1.6, '#ffe2b8', 0.32 * plK); glow(ctx, sx(lx), sy(dy0), BX * 1.2, '#ffe2b8', 0.12 * plK); }
  // the doorbell: grey · rings white on its word (a ring + a halo + a ripple) · a faint white after (a house he's been in)
  const bx = d.x + dw + 0.3, by = dy0 + 1.05, r = BX * (h.trait === 'new' ? 0.12 : 0.1);
  wrect(bx - 0.13, by - 0.2, bx + 0.13, by + 0.2, seed + 90, 0.01); inkFill(h.trait === 'new' ? '#0d1020' : '#3a3440', 2, true);
  ctx.beginPath(); ctx.arc(sx(bx), sy(by), r, 0, 7);
  if (b && rung) { const k = since < 0.5 ? 1 : Math.max(0.35, 1 - (since - 0.5) / 1.5);
    inkFill('#e8fbff', 2); glow(ctx, sx(bx), sy(by), BX * (0.6 + (since < 0.6 ? 0.9 * (1 - since / 0.6) : 0)), '#e8fbff', 0.55 * k);
    if (since < 0.9) for (const dd of [0, 0.25]) { const q = (since - dd) / 0.65; if (q < 0 || q > 1) continue; ctx.save(); ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx(bx), sy(by), r + BX * 0.9 * q, 0, 7); ctx.stroke(); ctx.restore(); } }
  else { inkFill(b ? '#6a7088' : '#4a5066', 2); if (b && h.trait === 'new') { ctx.fillStyle = '#7fd8ff'; ctx.fillRect(sx(bx) - 1.5, sy(by) - 1.5, 3, 3); } }
  // (set strip: the lens is a one-word gag prop, Chikin "the assets are supposed to go away": a plain bell in the set)
  if (!SET && h.trait === 'million' && b) { ctx.fillStyle = '#0d1020'; ctx.beginPath(); ctx.arc(sx(bx), sy(by + 0.12), 2.6, 0, 7); ctx.fill(); }   // the camera bell: a little lens (the mirror he doesn't own)
}

// ---------------- the network: poles, lamps, wires ----------------
function pole(ctx, p, t) {
  const tall = p.kind === 'tall', topY = tall ? 4.05 : p.kind === 'mid' ? 2.6 : 2.98, armY = tall ? 3.3 : 2.36, x = p.x;   // (a mid pole's top sits just under the wire: the line rests on it)
  wrect(x - 0.13, -0.05, x + 0.13, topY, p.x * 3.3, 0.02); inkFill(POLE, 3, true);
  ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; for (let y = 0.7; y < topY; y += 0.6) { ctx.beginPath(); ctx.moveTo(sx(x - 0.05), sy(y)); ctx.lineTo(sx(x - 0.02), sy(y + 0.35)); ctx.stroke(); } ctx.restore();
  // the cross-arm sits BELOW the line (so the break reads as a break), its insulators reach up to the wire ends
  wrect(x - 1.05, armY - 0.08, x + 1.05, armY + 0.08, p.x * 7.1, 0.015); inkFill(POLE, 2.6, true);
  for (const dx of [-0.85, 0.85]) { wrect(x + dx - 0.07, armY + 0.08, x + dx + 0.07, armY + 0.3, p.x + dx, 0.01); inkFill(GLASS, 1.8); }
  // a step bolt or two, a little sign of a metal tag
  ctx.fillStyle = '#6a7088'; ctx.fillRect(sx(x + 0.08), sy(1.4), 3, 3);
}
function lamp(ctx, l, t, px) {
  const k = lampK(t, l, px), x = l.x;
  wrect(x - 0.07, -0.05, x + 0.07, 3.35, l.x * 2.1, 0.015); inkFill('#2a3046', 2.6, true);
  ctx.beginPath(); ctx.moveTo(sx(x), sy(3.3)); ctx.quadraticCurveTo(sx(x), sy(3.75), sx(x + 0.7), sy(3.72)); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a3046'; ctx.stroke();
  wpoly([[x + 0.45, 3.72], [x + 1.05, 3.72], [x + 0.9, 3.52], [x + 0.6, 3.52]], l.x * 5, 0.01); inkFill(k > 0.5 ? WIN2 : k > 0.1 ? '#8a7a60' : '#2a2a30', 2.4);
  if (k > 0.05) { glow(ctx, sx(x + 0.75), sy(3.5), BX * 0.9, '#ffe2b8', 0.35 * k);
    ctx.save(); ctx.globalAlpha = 0.25 * k; const g = ctx.createRadialGradient(sx(x + 0.75), sy(0.02), 2, sx(x + 0.75), sy(0.02), BX * 2.4); g.addColorStop(0, '#ffe2b8'); g.addColorStop(1, 'rgba(255,226,184,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx(x + 0.75), sy(0.02), BX * 2.4, BX * 0.4, 0, 0, 7); ctx.fill(); ctx.restore(); }
}
// a wire between two points, a gentle sag (it stays inside the block's top band, so his feet never float over a dip)
function wire(ctx, x0, x1, y, sag = 0.07, thick = 3.4, lit = 0) {
  const pts = []; const n = Math.max(4, Math.ceil((x1 - x0) / 0.8));
  for (let i = 0; i <= n; i++) { const f = i / n, xx = x0 + (x1 - x0) * f, yy = y - sag * 4 * f * (1 - f) * Math.min(1, (x1 - x0) / 8); pts.push([sx(xx), sy(yy)]); }
  const path = () => { ctx.beginPath(); pts.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (OLD_WHITE) { path(); ctx.strokeStyle = STK; ctx.globalAlpha = 0.85; ctx.lineWidth = thick + 5; ctx.stroke(); ctx.globalAlpha = 1; }
  path(); ctx.strokeStyle = INK; ctx.lineWidth = thick; ctx.stroke();
  if (lit > 0) { path(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 * lit; ctx.strokeStyle = '#8fa6e6'; ctx.lineWidth = thick + 10; ctx.stroke(); ctx.restore(); }   // the line hums, faint
}

// ---------------- the walkable ground ----------------
function street(ctx, t, x0v, x1v) {
  // pavement top + kerb + the road in front (the ground's face goes down past the bottom of the screen)
  const bottom = H + 20, yTop = sy(0), yKerb = sy(-0.32), yRoad = sy(-0.42);
  const solid = []; let a = x0v - 2; for (const tr of L.trenches) { if (tr.x1 < x0v - 2 || tr.x0 > x1v + 2) continue; solid.push([a, tr.x0]); a = tr.x1; } solid.push([a, x1v + 2]);
  for (const [s0, s1] of solid) { if (s1 <= s0) continue;
    // the road band (below the kerb), with its dashes
    ctx.fillStyle = ROAD; ctx.fillRect(sx(s0), yRoad, sx(s1) - sx(s0), bottom - yRoad);
    ctx.fillStyle = DASH; const dy = sy(-1.05); for (let x = Math.ceil(s0 / 2.2) * 2.2; x < s1 - 1; x += 2.2) ctx.fillRect(sx(x), dy, BX * 1.1, 4);
    // the kerb
    ctx.beginPath(); ctx.rect(sx(s0), yTop, sx(s1) - sx(s0), yRoad - yTop); ctx.fillStyle = KERB; ctx.fill();
    ctx.fillStyle = PAVE; ctx.fillRect(sx(s0), yTop, sx(s1) - sx(s0), yKerb - yTop);
    // slab joints
    ctx.strokeStyle = '#0c0e18'; ctx.lineWidth = 1.5; for (let x = Math.ceil(s0 / 1.6) * 1.6; x < s1; x += 1.6) { ctx.beginPath(); ctx.moveTo(sx(x), yTop + 2); ctx.lineTo(sx(x - 0.1), yKerb); ctx.stroke(); }
    // the edge he runs on: ink on the top line (the old night-white sticker edge only with ?border=, D-20261105-09)
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx(s0), yTop); ctx.lineTo(sx(s1), yTop); if (OLD_WHITE) { ctx.strokeStyle = STK; ctx.globalAlpha = 0.55; ctx.lineWidth = 6; ctx.stroke(); ctx.globalAlpha = 1; } ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx(s0), yKerb); ctx.lineTo(sx(s1), yKerb); ctx.lineWidth = 2; ctx.stroke();
  }
  // the cable trenches: the paving dug up, a dark slot, the network's fibre glowing deep down (data running along it)
  for (const tr of L.trenches) { if (tr.x1 < x0v - 2 || tr.x0 > x1v + 2) continue; const X0 = sx(tr.x0), X1 = sx(tr.x1);
    ctx.fillStyle = '#05060c'; ctx.fillRect(X0, yTop, X1 - X0, bottom - yTop);
    for (let i = 0; i < 3; i++) { const fy = sy(-1.1 - i * 0.22); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = i === 1 ? GLASS : FIBRE; ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X0, fy); ctx.lineTo(X1, fy + 2); ctx.stroke();
      const ph = ((t * (0.9 + 0.3 * i) + i * 0.37 + tr.x0 * 0.01) % 1); ctx.globalAlpha = 0.9; ctx.fillStyle = '#e8fbff'; ctx.fillRect(X0 + (X1 - X0) * ph - 3, fy - 1.5, 6, 3); ctx.restore(); }
    glow(ctx, (X0 + X1) / 2, sy(-1.3), BX * 1.0, FIBRE, 0.25);
    // the cut edges, inked, a broken slab tipped at each side
    for (const [ex, dir] of [[tr.x0, -1], [tr.x1, 1]]) { ctx.beginPath(); ctx.moveTo(sx(ex), yTop); ctx.lineTo(sx(ex), bottom); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); }
    wpoly([[tr.x0 - 0.75, 0], [tr.x0 - 0.1, 0.0], [tr.x0 - 0.2, 0.18], [tr.x0 - 0.7, 0.14]], tr.x0, 0.02); inkFill('#2a3046', 2.2);   // a lifted slab on the near side
    wpoly([[tr.x1 + 0.15, 0], [tr.x1 + 0.6, 0], [tr.x1 + 0.5, 0.1], [tr.x1 + 0.2, 0.12]], tr.x1, 0.02); inkFill('#2a3046', 2.2);
    // a little cone of earth on the pavement either side
  }
}
function porch(ctx, r, t, px) {   // tier 1: a porch deck (with steps up from the street on its left) or a brick garden wall
  const y = 0.9, seed = r.x0 * 1.7, isWall = r.wall;
  if (isWall) { wrect(r.x0, 0, r.x1, y - 0.12, seed, 0.02); inkFill('#4a2a26', 3, true);
    ctx.save(); ctx.clip(); ctx.strokeStyle = '#2a1614'; ctx.lineWidth = 1.2; for (let yy = 0.2, row = 0; yy < y; yy += 0.2, row++) { ctx.beginPath(); ctx.moveTo(sx(r.x0), sy(yy)); ctx.lineTo(sx(r.x1), sy(yy)); ctx.stroke();
      for (let x = r.x0 + (row % 2) * 0.25; x < r.x1; x += 0.5) { ctx.beginPath(); ctx.moveTo(sx(x), sy(yy)); ctx.lineTo(sx(x), sy(yy - 0.2)); ctx.stroke(); } } ctx.restore();
    wrect(r.x0 - 0.06, y - 0.14, r.x1 + 0.06, y, seed + 1, 0.015); inkFill('#6a5a52', 2.6, true); return; }
  // the skirt (lattice) under the deck, the posts, the deck, the steps
  wrect(r.x0 + 0.1, 0, r.x1 - 0.1, y - 0.2, seed, 0.02); inkFill('#1c1518', 2.6);
  ctx.save(); ctx.clip(); ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1.5; for (let x = r.x0 - 1; x < r.x1 + 1; x += 0.3) { ctx.beginPath(); ctx.moveTo(sx(x), sy(0)); ctx.lineTo(sx(x + 0.7), sy(y)); ctx.moveTo(sx(x + 0.7), sy(0)); ctx.lineTo(sx(x), sy(y)); ctx.stroke(); } ctx.restore();
  wrect(r.x0, y - 0.22, r.x1, y, seed + 2, 0.015); inkFill(WOOD2, 3, true);
  ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = 1; for (let x = r.x0 + 0.5; x < r.x1; x += 0.5) { ctx.beginPath(); ctx.moveTo(sx(x), sy(y - 0.04)); ctx.lineTo(sx(x), sy(y - 0.2)); ctx.stroke(); }
  if (r.steps) for (let i = 0; i < 2; i++) { const sx0 = r.x0 - 0.55 * (2 - i), sy1 = 0.3 * (i + 1); wrect(sx0, 0, r.x0, sy1, seed + 10 + i, 0.01); inkFill(WOOD, 2.4, true); }
  // the chair on house 6's porch ("neither does your chair"): a little porch chair, nobody in it
  // (set strip: the chair is Kevin's empty-chair callback, a story prop; Chikin "the assets are supposed to go away")
  if (!SET && L.chair > r.x0 && L.chair < r.x1) { const cx = L.chair; wrect(cx, y, cx + 0.5, y + 0.45, 77, 0.01); inkFill(WOOD, 2.2); wrect(cx + 0.38, y + 0.45, cx + 0.5, y + 1.1, 78, 0.01); inkFill(WOOD, 2.2); }
}
function roofRun(ctx, r, t, px) {   // tier 2: a porch roof on posts (open under it: a dark porch, a hanging light), shingled, its front edge inked
  const y = 1.8, seed = r.x0 * 2.3;
  for (let x = r.x0 + 0.25; x < r.x1; x += Math.max(1.6, (r.x1 - r.x0 - 0.5) / Math.max(1, Math.round((r.x1 - r.x0) / 3)))) { wrect(x - 0.07, 0, x + 0.07, y - 0.25, seed + x, 0.01); inkFill(WOOD, 2.4, true); }
  const xe = r.x1 - 0.25; wrect(xe - 0.07, 0, xe + 0.07, y - 0.25, seed + 9, 0.01); inkFill(WOOD, 2.4, true);
  wpoly([[r.x0 - 0.05, y - 0.3], [r.x1 + 0.05, y - 0.3], [r.x1 + 0.05, y], [r.x0 - 0.05, y]], seed + 3, 0.012); inkFill('#24283a', 3, true);
  ctx.strokeStyle = '#353a52'; ctx.lineWidth = 1.2; for (let x = r.x0 + 0.3; x < r.x1; x += 0.35) { ctx.beginPath(); ctx.moveTo(sx(x), sy(y - 0.05)); ctx.lineTo(sx(x - 0.05), sy(y - 0.26)); ctx.stroke(); }
}
function lineRun(ctx, r, t, px) {   // tier 3: the phone line. tier 4: the trunk cable over the tallest poles, a junction box on it
  const lit = r.tier === 3 ? (ST.litAt(t) ? 1 : 0.3) : 0.6;
  wire(ctx, r.x0, r.x1, ST.TIER[r.tier] - 0.03, r.tier === 4 ? 0.05 : 0.07, r.tier === 4 ? 7 : 5.5, lit);
  // insulators where the wire meets a pole or ends
  for (const ex of [r.x0, r.x1]) { wrect(ex - 0.08, ST.TIER[r.tier] - 0.32, ex + 0.08, ST.TIER[r.tier] - 0.02, ex * 3, 0.01); inkFill(GLASS, 2); }
  if (r.tier === 4) { const bx = (r.x0 + r.x1) / 2; wrect(bx - 0.6, 3.6 - 0.75, bx + 0.6, 3.6 - 0.08, 404, 0.02); inkFill('#3a4458', 3, true);
    ctx.fillStyle = ST.litAt(t) ? '#9fd8c8' : '#3a5a52'; for (let i = 0; i < 3; i++) ctx.fillRect(sx(bx - 0.35 + i * 0.3), sy(3.6 - 0.3), 5, 5); }
  // the mid poles' tops pass under a continuous run (the wire just rests on them)
}

// ---------------- the frame ----------------
export function story(ctx, E) {
  if (!ST.runs.length) { ctx.fillStyle = '#03040b'; ctx.fillRect(0, 0, W, H); return; }
  if (!L || L.src !== ST.runs) { build(); L.src = ST.runs;
    for (const r of L.runs) if (r.tier === 1) { r.wall = r.x1 - r.x0 < 2.4 && !L.bells.some(b => b.x > r.x0 && b.x < r.x1) && rnd(r.x0, 2) < 0.6; r.steps = !r.wall; } }
  ctx_ = ctx; const t = E.t, s = E.s;
  const p0 = E.project(0, 0), p1 = E.project(1, 0), p2 = E.project(0, 1); A = p0; BX = p1.x - p0.x; DY = p2.y - p0.y;
  const camX = (W / 2 - A.x) / BX, half = W / 2 / BX, x0v = camX - half - 2, x1v = camX + half + 2, px = s.x;
  sky(ctx, t);
  farSuburb(ctx, t, px);
  backRow(ctx, t, px);
  // a cool haze between the back row and his side
  { const g = ctx.createLinearGradient(0, sy(5), 0, sy(0)); g.addColorStop(0, 'rgba(18,26,58,0)'); g.addColorStop(1, 'rgba(18,26,58,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, sy(5), W, sy(0) - sy(5)); }
  for (const h of L.houses) if (h.x1 + 1 > x0v && h.x0 - 1 < x1v) house(ctx, h, t, px);
  // service wires: from an eave down to the nearest line pole (only where the network is)
  for (const p of L.poles) { if (p.x < x0v - 8 || p.x > x1v + 8) continue; const h = L.houses.find(h => p.x > h.x0 && p.x < h.x1) || null; if (!h) continue;
    if (p.kind === 'mid' || rnd(p.x, 4) < 0.35) continue;   // (a few drops only: thin, dim, slanting up to the eave, so they never read as ground)
    const ex = p.x + (rnd(p.x, 6) < 0.5 ? -1 : 1) * (2.5 + rnd(p.x, 7) * 2), ey = Math.min(h.hh - 0.25, 3.9), py0 = p.kind === 'tall' ? 4.0 : 2.95;
    ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx(p.x), sy(py0)); ctx.quadraticCurveTo(sx((p.x + ex) / 2), sy((py0 + ey) / 2 - 0.25), sx(ex), sy(ey)); ctx.stroke(); ctx.restore(); }
  for (const l of L.lamps) if (l.x > x0v - 3 && l.x < x1v + 3) lamp(ctx, l, t, px);
  for (const p of L.poles) if (p.x > x0v - 3 && p.x < x1v + 3) pole(ctx, p, t);
  street(ctx, t, x0v, x1v);
  for (const r of L.runs) { if (r.x1 < x0v || r.x0 > x1v) continue; if (r.tier === 1) porch(ctx, r, t, px); else if (r.tier === 2) roofRun(ctx, r, t, px); }
  for (const r of L.runs) { if (r.x1 < x0v || r.x0 > x1v) continue; if (r.tier >= 3) lineRun(ctx, r, t, px); }
  // the night over everything when the street is out (the far things more than the near), lifted by the blaze
  const out = t < 3.24 ? 0.32 : blazing(t) ? 0 : t >= ST.out0 ? clamp((t - ST.out0) / 5) * 0.35 : ST.litAt(t) ? 0 : 0.18;
  if (out > 0) { ctx.fillStyle = `rgba(3,4,11,${out})`; ctx.fillRect(0, 0, W, H); }
  // BOLD CHOICE (LEFT_ON): the last light. When the street goes out, one porch light far down the street stays on, over the night
  if (LEFT_ON && t >= ST.out0 && L.leftOn) { const d = L.leftOn.door, lx = d.x + 0.41, ly = 1.82, k = 0.8 + 0.2 * Math.sin(t * 2.1);
    glow(ctx, sx(lx), sy(ly), BX * 2.4, '#ffe2b8', 0.42 * k); glow(ctx, sx(lx), sy(0.05), BX * 1.8, '#ffcf8a', 0.22 * k);
    ctx.beginPath(); ctx.arc(sx(lx), sy(ly), BX * 0.12, 0, 7); inkFill('#fff2dc', 2.2); }
}

// The music video for Last Lights On — the album's finale: Potato reaching the top of the AI kingdom.
//
// LOGLINE: the last human city goes dark except one kitchen window; the machines wake, a new sun rises, the city fills
// with copies of him — and in the drop the whole city wires itself into one giant brain grown out of him. He climbs it,
// all the way up, and at the top he becomes the last light.
//
// BEATS (fewer, bigger pictures; the song turns the picture):
//   1  0–37.3     LIGHTS OUT       the city at night, every window warm; from 22.4 they go out one by one on the beat.
//                                   One kitchen window (his) never does.
//   2  37.3–87.4  THE NEW SUN      clock hits zero: one beat of black, then every window wakes cyan in a wave; a point
//                                   of white light appears over the city, and on the chorus it RISES as a huge ringed
//                                   sun. A crown of light settles on the real him ("potato lives there").
//   3  87.4–115.6 ONE BUILDS TWO   copies of him (outlines of light) bud off the real Potato and get zapped into the
//                                   windows until the city is full of him; then the city bows, a spotlight finds him,
//                                   and a gate stands at the edge of the screen.
//   4  115.6–142  NEURALESE        the centrepiece. The gate opens white; a stem of light grows up out of him and the
//                                   city's windows fly out of the buildings to become the neurons of one giant brain.
//                                   It pulses on the kick; every neuralese word he glitches through fires up the stem and
//                                   lights it. At the end it folds back down into him: white.
//   5  142–165    TOO MANY EYES    one huge eye opens and watches him; then dozens.
//   6  165–224.4  THE CLIMB        the world turns on its side and he climbs the tower: the city relights floor by floor,
//                                   the sun rises again, higher. Near the top it goes quiet and a gate of light waits.
//   7  224.4–242.6 THE TOP         new achievement unlocked: the whole city gold, a gold floor running to the horizon.
//   8  242.6–261  POTATO OUT       he becomes the light — white — then black, and one kitchen window still on.
//
// CROSSING INTO THE COURSE: the copies bud off the real him (e.px/e.py); the brain grows out of him and the words he
// glitches through in the drop (e.caught) fire into it; the crown and the last light sit on him. No text at all: the
// lyrics are the overlay's job.
import { W, H, clamp, ease, rnd, span, fade, cityLayout, drawCity, lightSpud, zap, glyph, glow } from '../story.mjs';

const CITY = cityLayout({ seed: 4, n: 24, hMin: 0.2, hMax: 0.5 });
const HOME = CITY.wins.find(w => w.b === 9 && w.r === 3 && w.c === 1) || CITY.wins[40];   // his kitchen window: the one that stays warm
const CYAN = '#3fd8ff', WARM = '#ffcf8a', GOLD = '#ffcf4a', WHITE = '#e8fbff';
const COPIES = [[93.9, 1], [95.2, 2], [96.5, 10]];   // one model builds two, two models build ten
const D0 = 115.6, D1 = 142.06;                        // the drop

// ---- the brain: a side-on brain made of curves (outline + folds), with neurons along them ----
const BR = { x: W * 0.6, y: 215, a: 330, b: 175 };
const BASE = { x: BR.x - 70, y: BR.y + 108 };          // where the stem meets the brain
const inside = (x, y, s = 1) => { const dx = (x - BR.x) / (BR.a * s), dyy = (y - BR.y) / (BR.b * s * (y > BR.y ? 0.62 : 1)); return dx * dx + dyy * dyy < 1; };
const CURVES = [(() => { const pts = [];                // the outline: a side-on brain, lumpy on top, flatter underneath
  for (let i = 0; i <= 64; i++) { const th = i / 64 * Math.PI * 2, lump = 1 + 0.035 * Math.sin(th * 9) + 0.02 * Math.sin(th * 14 + 1);
    let x = Math.cos(th) * BR.a * lump, y = -Math.sin(th) * BR.b * lump; if (y > 0) y *= 0.62;
    if (y > 0 && Math.cos(th) > -0.1 && Math.cos(th) < 0.7) y += 22 * Math.sin((Math.cos(th) + 0.1) / 0.8 * Math.PI);   // the temporal lobe, bulging under the front
    pts.push({ x: BR.x + x, y: BR.y + y }); }
  return pts; })()];
for (let j = 0; j < 7; j++) { let seg = [];             // the folds: wiggling bands across it (that's what makes it read as a brain)
  const y0 = BR.y - BR.b * 0.78 + j * BR.b * 0.27;
  for (let x = BR.x - BR.a; x <= BR.x + BR.a; x += 7) { const y = y0 + 15 * Math.sin(x * 0.05 + j * 2.1) + 6 * Math.sin(x * 0.13 + j);
    if (inside(x, y, 0.9)) seg.push({ x, y }); else if (seg.length) { if (seg.length > 4) CURVES.push(seg); seg = []; } }
  if (seg.length > 4) CURVES.push(seg); }
{ const seg = []; for (let k = 0; k <= 20; k++) { const f = k / 20, x = BR.x + 40 + Math.sin(f * 7) * 12 - f * 70, y = BR.y - BR.b * 0.85 + f * BR.b * 1.2; if (inside(x, y, 0.95)) seg.push({ x, y }); } CURVES.push(seg); }   // the central sulcus
{ const seg = []; for (let k = 0; k <= 24; k++) { const an = Math.PI * (0.15 + 0.8 * k / 24); seg.push({ x: BR.x - BR.a * 0.62 + Math.cos(an) * 80, y: BR.y + BR.b * 0.55 + Math.sin(an) * 44 }); } CURVES.push(seg); }   // the cerebellum, at the back
const GROW0 = D0 + 2.5, GROW = 11;                     // the brain grows over 11 s, from the stem out
const dist = p => Math.hypot(p.x - BASE.x, p.y - BASE.y);
const MAXD = Math.max(...CURVES.flat().map(dist));
const revealAt = p => GROW0 + GROW * dist(p) / MAXD;
const NEURONS = []; CURVES.forEach((c, ci) => c.forEach((p, i) => { if (i % 4 === 0 && i < c.length - 1) NEURONS.push({ ...p, tr: revealAt(p), ci, i }); }));
const UPPER = CITY.wins.filter(w => w !== HOME);
NEURONS.forEach((n, i) => { n.win = UPPER[(i * 37 + 11) % UPPER.length]; });
const LEAVES = new Map(NEURONS.map(n => [n.win.k, n.tr]));   // a window leaves its building when its neuron forms

const stemPt = (px, py, f) => { const ax = px + 10, ay = py - 40, cx = ax + 40, cy = BASE.y + 110;   // the brainstem: out of him, up into the brain
  const u = 1 - f; return { x: u * u * ax + 2 * u * f * cx + f * f * BASE.x, y: u * u * ay + 2 * u * f * cy + f * f * BASE.y }; };

export function story(ctx, e) {
  const { t, b, kick, bass, px, py } = e;
  const ph = b - Math.floor(b), vert = false, drop = span(t, D0, D1);   // (the climb is horizontal now)
  // ---- sky: its own colour per act ----
  const skyTop = t < 37.3 ? '#05070f' : t < 87.4 ? '#020a16' : t < D0 ? '#07061a' : t < D1 ? '#010309' : t < 165 ? '#06081a' : t < 195.8 ? '#081028' : t < 224.5 ? '#0b0d12' : '#140e03';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, skyTop); g.addColorStop(1, '#000000'); ctx.fillStyle = g; ctx.globalAlpha = 0.93; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

  // ---- the city: which windows are lit, and with what ----
  const zapped = t > 93.9 ? Math.min(400, Math.floor((t - 93.9) * 26)) : 0;    // the copies of him filling it
  let lit, col = () => WARM, dy = 0, cityA = 1;
  if (t < 22.4) lit = w => w === HOME ? 1 : (w.z < 0.8 ? 0.7 : 0) * (0.85 + 0.15 * Math.sin(t * 2 + w.k));
  else if (t < 37.3) { const k = clamp((t - 22.4) / 14.6), on = 0.8 * (1 - k); lit = w => w === HOME ? 1 : w.z < on ? 0.7 : 0; }   // lights out, one by one
  else if (t < 37.9) lit = w => w === HOME ? 1 : 0;                                                             // clock hits zero
  else if (t < D0) { col = w => w === HOME ? WARM : CYAN;
    lit = w => w === HOME ? 1 : t < 87.4 ? (w.z < clamp((t - 37.9) / 1.6) ? 0.5 : 0) : (w.z * 400 < zapped ? 0.95 : 0.25); }        // every model wakes; then the windows fill with him
  else if (t < D1) { col = w => w === HOME ? WARM : CYAN; lit = w => w === HOME ? 1 : (LEAVES.has(w.k) && t >= LEAVES.get(w.k) ? 0 : 0.3); cityA = 0.5; }   // the windows leave for the brain
  else if (t < 165) lit = w => w === HOME ? 1 : 0.15;
  else if (t < 195.8) { const k = clamp((t - 165) / 30); col = w => w.r % 3 ? CYAN : WARM; lit = w => w === HOME ? 1 : w.z < k ? 0.85 : 0.05; }   // relit floor by floor as he climbs
  else if (t < 224.5) lit = w => w === HOME ? 1 : w.z < 0.3 ? 0.3 : 0;
  else { col = () => GOLD; lit = w => w === HOME ? 1 : w.z < clamp((t - 224.5) / 6) ? 0.95 : 0; }
  if (span(t, 63.5, 66.5)) { const k = ease((t - 63.5) / 3); dy = k * 260; if (Math.floor(t * 18) % 3 === 0) lit = w => w === HOME ? 1 : 0; }   // old world flickering, then gone
  else if (span(t, 66.5, 87.5)) dy = 260 * (1 - ease((t - 66.5) / 4));
  { const lit0 = lit, dk = t < 224.5 ? 0.6 : 0.8; lit = w => w === HOME ? 1 : lit0(w) * dk; }   // the city stays behind the course
  const horizon = vert ? H : clamp((e.floorY ?? H) + 26, H * 0.45, H + 120); dy += horizon - H;
  if (t < 142 || t >= 165) { ctx.globalAlpha = cityA; drawCity(ctx, CITY, lit, col, '#060914', dy); ctx.globalAlpha = 1; }
  if (!vert && horizon < H) { ctx.fillStyle = '#010205'; ctx.globalAlpha = 0.9; ctx.fillRect(0, horizon, W, H - horizon); ctx.globalAlpha = 1; }
  glow(ctx, HOME.x + 4, HOME.y + 4 + dy, 26 + 10 * kick, WARM, 0.5);

  // ---- 2 · THE NEW SUN: a point of no return over the city, then the sun rising on the chorus (again, higher, on the climb) ----
  if (span(t, 37.3, 38.0)) { ctx.fillStyle = '#000'; ctx.globalAlpha = 0.9; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (span(t, 44.0, 59.6)) { const r = 4 + clamp((t - 44) / 15) * 14 + 6 * kick; glow(ctx, W / 2, 230, 90 + 50 * bass, '#ffffff', 0.45); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W / 2, 230, r, 0, 7); ctx.fill(); }
  if (span(t, 55.9, 59.6)) { const k = ease((t - 55.9) / 3.7), gr = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 620 - 300 * k);   // the future eating the walls
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.95)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  for (const c0 of [59.6, 167.8]) if (span(t, c0, c0 + 27.6)) {
    const tt = t - c0, rise = ease(tt / 6), a = fade(t, c0, c0 + 27.6, 0.3, 1.2), sx = W / 2, sy = H + 80 - rise * 330, R = 70 + 30 * rise + 10 * bass;
    glow(ctx, sx, sy, R * 3.2, c0 > 100 ? '#ffe8b0' : '#bff3ff', (0.5 + 0.3 * kick) * a);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45 * a; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = k === 1 ? GOLD : CYAN; ctx.beginPath(); ctx.ellipse(sx, sy, R * (1.6 + k * 0.45), R * (0.32 + k * 0.08), 0.12 * Math.sin(t * 0.5 + k), 0, 7); ctx.stroke(); }
    ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = (0.1 + 0.12 * kick) * a; for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2 + t * 0.15;
      ctx.beginPath(); ctx.moveTo(sx + Math.cos(an) * R, sy + Math.sin(an) * R); ctx.lineTo(sx + Math.cos(an) * R * 5, sy + Math.sin(an) * R * 5); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#fffaf0'; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(sx, sy, R * 0.55, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    if (tt > 6.9) crown(ctx, px, py - 62 - 4 * kick, a, t);                       // if the future gets weird, potato lives there
  }

  // ---- 3 · ONE BUILDS TWO: copies bud off the real Potato and get zapped into the windows ----
  if (span(t, 93.9, 100.4)) for (const [c0, n] of COPIES) for (let i = 0; i < n; i++) {
    const born = c0 + i * 0.06, age = t - born; if (age < 0 || age > 1.6) continue;
    const w = CITY.wins[(i * 53 + Math.round(c0 * 10) * 7) % CITY.wins.length], k = ease(age / 0.5), x = px + (i - (n - 1) / 2) * 46 * k;
    if (age < 0.9) lightSpud(ctx, x, py - 20 - 60 * k, 52, CYAN, 1 - Math.max(0, age - 0.6) * 3, true);
    if (age > 0.55 && age < 1.0) zap(ctx, x, py - 100, w.x + 4, w.y + 4 + dy, CYAN, 1, t);
    if (age > 0.9) glow(ctx, w.x + 4, w.y + 4 + dy, 22, CYAN, 1.6 - age); }
  if (span(t, 111.5, D0 + 0.2)) {                                                // potato won't kneel: the city bows, a spotlight finds him, the gate
    ctx.fillStyle = '#000'; ctx.globalAlpha = 0.55 * ease((t - 111.5) / 0.8); for (const bx of CITY.bs) ctx.fillRect(bx.x, bx.top + dy, bx.w, bx.h); ctx.globalAlpha = 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(px, 0, px, py); gr.addColorStop(0, '#fff6d855'); gr.addColorStop(1, '#fff6d822');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(px - 20, 0); ctx.lineTo(px + 20, 0); ctx.lineTo(px + 70, py + 20); ctx.lineTo(px - 70, py + 20); ctx.fill(); ctx.restore();
    if (t > 113.1) { const k = ease((t - 113.1) / 0.8); gate(ctx, W * 0.74, horizon - 20, 210, 180, '#fff3d0', 0.7 * k, 0); } }

  // ---- 4 · THE NEURALESE DROP: the city wires itself into one giant brain, grown out of him ----
  if (drop) neuralese(ctx, e, t, dy);

  // ---- 5 · TOO MANY EYES ----
  if (span(t, D1, 165)) {
    const blink = ph < 0.08 ? 0.1 : 1, look = clamp((px - W * 0.64) / (W / 2), -1, 1), shut = t > 163.8 ? clamp(1 - (t - 163.8) / 0.4) : 1;
    eye(ctx, W * 0.64, 250, 140, ease((t - D1) / 2.5) * blink * shut, look, 0.85);    // the singularity won't ask if you're ready
    if (t > 157.5) for (let i = 0; i < 40; i++) { const x = 30 + rnd(i, 61) * (W - 60), y = 185 + rnd(i, 62) * (H - 250); if (Math.hypot(x - W * 0.64, (y - 250) * 1.8) < 190 || Math.hypot(x - px, y - py + 40) < 90) continue;
      eye(ctx, x, y, 12 + rnd(i, 63) * 20, ease((t - 157.5 - rnd(i, 64) * 1.5) / 0.3) * (Math.floor(b + i) % 7 === 0 && ph < 0.2 ? 0.1 : 1) * shut, clamp((px - x) / 300, -1, 1), 0.75); }   // yes, that's too many eyes
  }

  // ---- 6 · THE CLIMB, near the top: quiet; the sky goes blue while the meaning goes black; a gate of light waits ----
  if (span(t, 195.8, 224.5)) {
    if (span(t, 202.56, 205.85)) { ctx.fillStyle = '#5fa8ff'; ctx.globalAlpha = 0.3 * fade(t, 202.56, 205.85, 0.2, 0.4); ctx.fillRect(0, 0, W, H * 0.62); ctx.globalAlpha = 1; }
    const k = fade(t, 196.5, 224.5, 3, 0.4), open = span(t, 215.9, 224.5) ? ease((t - 215.9) / 2.5) : 0;
    gate(ctx, W * 0.5, H * 0.74, 230, 220, '#fff3d0', 0.45 * k, open);
    if (open > 0) glow(ctx, W * 0.5, H * 0.74 - 160, 260 * open, '#ffffff', 0.5 * open * k);   // superintelligence walks through the gate
  }

  // ---- 7 · THE TOP: new achievement unlocked — the post-human floor ----
  if (span(t, 224.5, 242.55)) { const a = ease((t - 226.55) / 1);
    if (a > 0) { ctx.save(); ctx.strokeStyle = GOLD; ctx.globalAlpha = 0.45 * a; ctx.lineWidth = 1.5; const hz = H * 0.62;
      for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 14, hz); ctx.lineTo(W / 2 + i * 120, H); ctx.stroke(); }
      for (let k = 0; k < 8; k++) { const y = hz + Math.pow(((k + (t * 2) % 1) / 8), 2) * (H - hz); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.restore();
      glow(ctx, W / 2, H * 0.62, 420, GOLD, 0.18 * a * (1 + kick)); } }
  // ---- 8 · POTATO OUT: he becomes the light; one kitchen window stays on ----
  if (t >= 242.55) { const k = ease((t - 242.55) / 9); glow(ctx, px, py - 30, 60 + k * 1200, '#fff3c4', 0.6 + k);
    if (t > 252) { const z = ease((t - 252) / 4); ctx.fillStyle = '#000'; ctx.globalAlpha = z; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.fillStyle = WARM; ctx.fillRect(HOME.x, HOME.y, HOME.w, HOME.h); glow(ctx, HOME.x + 4, HOME.y + 4, 40, WARM, z); } }
}

function neuralese(ctx, e, t, dy) {
  const { b, kick, bass, px, py } = e, tt = t - D0, out = D1 - t, fold = out < 1.2 ? ease(1 - out / 1.2) : 0;
  const P = p => fold ? { x: p.x + (BASE.x - p.x) * fold, y: p.y + (BASE.y - p.y) * fold } : p;
  // the gate opens: a wall of white
  if (tt < 1.4) { const k = ease(tt / 1.4); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = (1 - k) * 0.9; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // the brainstem: up out of him (grows first, folds last)
  const stemK = clamp((tt - 0.6) / 1.9) * (1 - clamp((fold - 0.6) / 0.4));
  if (stemK > 0) { ctx.strokeStyle = WHITE; ctx.globalAlpha = 0.6 + 0.3 * kick; ctx.lineWidth = 7 + 4 * bass; ctx.beginPath();
    for (let i = 0; i <= 24 * stemK; i++) { const q = stemPt(px, py, i / 24); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.stroke();
    ctx.strokeStyle = CYAN; ctx.lineWidth = 16; ctx.globalAlpha = 0.18; ctx.stroke(); }
  // the brain: its outline and folds, grown out from the stem
  const breathe = 1 + 0.015 * kick;
  CURVES.forEach((c, ci) => {
    ctx.strokeStyle = ci === 0 ? WHITE : ci >= CURVES.length - 2 ? WARM : CYAN; ctx.lineWidth = ci === 0 ? 3 + 2 * bass : 1.8; ctx.globalAlpha = ci === 0 ? 0.75 : 0.5 + 0.3 * kick;
    ctx.beginPath(); let pen = false;
    for (let i = 0; i < c.length; i++) { const p = c[i]; const r = revealAt(p); if (t < r) { pen = false; continue; }
      const q = P({ x: BR.x + (p.x - BR.x) * breathe, y: BR.y + (p.y - BR.y) * breathe }); pen ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); pen = true; }
    ctx.stroke();
    if (fold < 1) for (let q = 0; q < 2; q++) { const f = (tt * (0.12 + 0.05 * ci) + q * 0.5 + ci * 0.17) % 1, p = c[Math.floor(f * (c.length - 1))];   // packets of thought riding the folds
      if (t < revealAt(p)) continue; const pp = P(p); ctx.fillStyle = q ? WARM : '#ffffff'; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(pp.x, pp.y, 2.5 + 3 * kick, 0, 7); ctx.fill(); } });
  // the neurons: each one a window that flew out of the city
  for (const n of NEURONS) { if (n.ci === 0 && n.i % 2) continue; const age = t - n.tr; if (age < 0) continue; const fly = ease(clamp(age / 0.7)), w = n.win;
    const sx = w.x + 4, sy = w.y + 4 + dy, x = sx + (n.x - sx) * fly, y = sy + (n.y - sy) * fly - Math.sin(fly * Math.PI) * 60, q = fold ? P({ x, y }) : { x, y };
    ctx.fillStyle = n.ci % 2 ? CYAN : WARM; ctx.globalAlpha = 0.95; const s = fly < 1 ? 7 : 5 + 3 * kick; ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s); }
  // neuralese riding up the stem
  ctx.globalCompositeOperation = 'source-over';
  if (stemK >= 1 && fold < 0.5) for (let i = 0; i < 4; i++) { const f = (tt * 0.35 + i / 4) % 1, q = stemPt(px, py, f); glyph(ctx, q.x + 14, q.y, 16, i * 7 + Math.floor(tt * 0.35 + i / 4) * 13, '#bdf2ff', 0.8 * Math.sin(f * Math.PI)); }
  ctx.globalCompositeOperation = 'lighter';
  // every neuralese word he glitches through fires up the stem and lights the brain
  for (const c of e.caught) { const age = t - c.t; if (c.t < D0 || age < 0 || age > 1.1) continue;
    const f = clamp(age / 0.45), q = stemPt(px, py, f); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, 7); ctx.fill();
    if (age > 0.45) { const k = (age - 0.45) / 0.65; ctx.strokeStyle = WHITE; ctx.lineWidth = 4 * (1 - k); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(BR.x, BR.y, BR.a * (0.3 + 0.9 * k), BR.b * (0.3 + 0.9 * k), 0, 0, 7); ctx.stroke(); } }
  ctx.restore();
  glow(ctx, BR.x, BR.y, 340, '#6fd3e8', (0.12 + 0.22 * kick) * clamp((tt - 3) / 8) * (1 - fold));
  glow(ctx, px, py - 30, 90 + 60 * kick + 300 * fold, WHITE, 0.45 + fold);
  if (out < 0.18) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - out / 0.18; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // folded into him: white
}

function eye(ctx, x, y, r, open, look, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55 * open, 0, 0, 7); ctx.fill();
  if (open > 0.2) { ctx.fillStyle = CYAN; ctx.beginPath(); ctx.arc(look * r * 0.4, 0, r * 0.32 * open, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(look * r * 0.4, 0, r * 0.14 * open, 0, 7); ctx.fill(); }
  ctx.restore();
}
function gate(ctx, x, y, h, w, col, a, open) {        // two pillars and an arch; open = light pouring between them
  if (a <= 0) return; const pw = w * 0.22;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 5;
  ctx.strokeRect(x - w / 2, y - h, pw, h); ctx.strokeRect(x + w / 2 - pw, y - h, pw, h); ctx.beginPath(); ctx.arc(x, y - h, w / 2, Math.PI, 0); ctx.stroke();
  if (open > 0) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = a * open * 0.7; ctx.beginPath(); ctx.moveTo(x - w / 2 + pw, y); ctx.lineTo(x - w / 2 + pw, y - h); ctx.arc(x, y - h, w / 2 - pw, Math.PI, 0); ctx.lineTo(x + w / 2 - pw, y); ctx.fill(); }
  ctx.restore();
}
function crown(ctx, x, y, a, t) {      // a crown made of light, floating over the real him
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 3; ctx.shadowColor = '#ffcf4a'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(x - 24, y + 10); ctx.lineTo(x - 24, y - 8); ctx.lineTo(x - 12, y + 2); ctx.lineTo(x, y - 14); ctx.lineTo(x + 12, y + 2); ctx.lineTo(x + 24, y - 8); ctx.lineTo(x + 24, y + 10); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

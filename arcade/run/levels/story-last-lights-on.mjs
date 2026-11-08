// story-last-lights-on.mjs — the music video behind Last Lights On, v4 (Nov 1): ONE street at night, seen from the pavement,
// slowly transforming (last-lights-v2): warm lamps -> windows die -> sirens -> cyan binary towers -> sparks -> white-out ->
// the city is his. The beat sheet is at the top of run/levels/last-lights-on.mjs; the rules (and the window states) are
// run/modes/last-lights-on.mjs. Drawn here, back to front, in story px (960 x 540; the street through the real camera):
//   the sky + the far layer (the clock tower, the light over it, the big rooftop screen, the calendar, the binary towers)
//   · the skyline (the scoring windows: amber people / dark / cyan machines / grey doubt / HIS: a copy of him stands in it)
//   · the street (shop fronts, lamps, pavement, road, what's in his way, the things with the purple crack, drones)
//   · his copies flying into their windows. Full-screen scenes: the recursion zoom, the network, the ending.
// In front of him (overFX): the rings, his fizz + spin storm, smashes, the letterbox, the score, the code, the card.
// v5 (Nov 2, THE POTATO ARMY): + the walk-ups over the green doors / lit high windows (they flip to his side-eye floor by
// floor), the runners + the copies chasing them, the dives at his size, the copies that peel off, the chaos behind the street
// (all in the near plane, on his street); 128.51 is now the city of lights (every lit window one of him), not a potato-shaped
// mind; no sheet-ghost anywhere; the `> ` asides are on the rooftop screen (world text) instead of a box by him.
// Colours: amber = people, cyan = machines, green #4dff9a = his light, red-blue strobe = drones only. PURPLE only for Potato's glitch
// (him and his copies); the things he breaks wear white/cyan cracks and get his purple only on the smash.
// D-31 review pass (Nov 2 late): the hero's glitch is edge tears only (never over his face), the dives are drawn on top and land
// in the building AHEAD of him, 128.51 is a rooftop moment, PLAN Z is a survey, the finish holds Binary Potato in the code.
import { W, H, clamp, ease, rnd, span, fade, glow, glyph } from '../story.mjs';
import { SH, prep, project, drawSpud, skyline, SK, BASE, WW, WH, LOOKS, AMB, DARK, CYAN as CY, GREY, HIS, NET, GLIDE, END, UNLOCK, MAYBE, BIG, CUTS, cutAt, droneAt, finalScore, VW, LEFT, bigBlocks, runnerX, DOOR_AHEAD, demoDive, chaseLook } from '../modes/last-lights-on.mjs';
import { ART } from './art-last-lights-on.mjs';
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare

const AMBER = '#f5c46a', CYAN = '#5fe6f2', GREEN = '#4dff9a', PURP = '#9a52ff', MAG = '#e03ccf', LILAC = '#c9a7ff', VOID = '#12062e', WHITE = '#f4fbff', INK = '#120a05';
const BP = 0.42349, OFF = 0.086, beatOf = t => (t - OFF) / BP, tOf = b => OFF + b * BP;
const MONO = '"Major Mono Display", ui-monospace, monospace';
const BINARY_AT = 259.0;   // Binary Potato: the baked simulation-skin model, standing in the code (codeFlood)
const SX0 = 0.66, SY0 = 0.16;   // the light in the sky (main flies the costume pieces here: def.singAt)
const pulseAt = (t, at, d = 0.3) => t >= at && t < at + d ? 1 - (t - at) / d : 0;
const towerX = t => W * (0.74 - 0.16 * clamp(t / 260));
let freezeCv = null, flipCv = null, lastT = -1;

// ---------------- shapes ----------------
function potatoR(th, lump, seed = 0) { return 1 + lump * (0.07 * Math.sin(2 * th + 0.6 + seed) + 0.05 * Math.sin(3 * th + 2.1) + 0.035 * Math.sin(5 * th + 1 + seed)); }
function potatoPath(ctx, cx, cy, rx, ry, lump = 1, seed = 0, sqY = 1) {
  ctx.beginPath(); for (let i = 0; i <= 48; i++) { const th = i / 48 * Math.PI * 2, r = potatoR(th, lump, seed), s = Math.sin(th), wide = s > 0 ? 1 + 0.08 * s : 1;
    const x = cx + Math.cos(th) * rx * r * wide, y = cy + s * ry * r * sqY; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); }
function sideEye(ctx, x, y, w, look = 0.6, lid = 0.48, col = '#ffffff', a = 1) {   // his half-lidded side-eye (the eye in the sky)
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); const h = w * 0.42;
  ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, -h * 1.3, w / 2, 0); ctx.quadraticCurveTo(0, h * 1.3, -w / 2, 0); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(look * w * 0.26, h * 0.12, h * 0.62, 0, 7); ctx.fill();
  ctx.fillStyle = '#d9a35a'; ctx.fillRect(-w / 2, -h * 1.4, w, h * 1.4 * lid + h * 0.1); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, w * 0.07); ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, -h * 1.3, w / 2, 0); ctx.quadraticCurveTo(0, h * 1.3, -w / 2, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w * 0.5, -h * (1.3 - 2.6 * lid) * 0.5); ctx.lineTo(w * 0.5, -h * (1.3 - 2.6 * lid) * 0.5); ctx.stroke();
  ctx.lineWidth = Math.max(2, w * 0.1); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-w * 0.55, -h * 1.5); ctx.quadraticCurveTo(-w * 0.1, -h * 2.5, w * 0.3, -h * 1.75); ctx.stroke();   // one brow up
  ctx.beginPath(); ctx.moveTo(w * 0.55, -h * 1.7); ctx.lineTo(w * 0.95, -h * 1.6); ctx.stroke(); ctx.restore();   // one flat (his mismatched pair)
}
function eyeBall(ctx, x, y, r, lx, ly, lid = 1) {   // a many-eyed eye (Chat's style: ink ring, white, dot pupil)
  ctx.save(); ctx.translate(x, y); ctx.scale(1, Math.max(0.08, lid)); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, r * 1.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#fbfaf3'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(lx * r * 0.5, ly * r * 0.5, r * 0.42, 0, 7); ctx.fill(); ctx.restore();
}
function shard(ctx, x, y, sz, rot, col, a, k = 0) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(-sz * 0.5, -sz * 0.3); ctx.lineTo(sz * (0.5 + 0.2 * Math.sin(k)), -sz * 0.1); ctx.lineTo(-sz * 0.1, sz * 0.6); ctx.closePath(); ctx.fill(); ctx.restore();
}
function lineGlow(ctx, x0, y0, x1, y1, col, w, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (const [ww, aa] of [[w * 4, 0.12], [w * 1.6, 0.35], [w * 0.6, 1]]) { ctx.globalAlpha = a * aa; ctx.lineWidth = ww; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); } ctx.restore(); }
function crack(ctx, x, y, s, seed, a = 1) {   // the crack: everything he can break wears one (never a jump prop). White + cyan, not purple:
  // purple is only Potato's (D-31 review fix 6); it touches the thing only on the frames he smashes through it (overFX's shards)
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [w, c, al] of [[s * 0.16, CYAN, 0.3], [s * 0.06, '#ffffff', 1]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha = a * al; ctx.beginPath(); ctx.moveTo(x, y - s);
    for (let i = 1; i <= 6; i++) ctx.lineTo(x + (rnd(i, seed) - 0.5) * s * 0.7, y - s + i * s / 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + (rnd(2, seed) - 0.5) * s * 0.7, y - s + 2 * s / 3); ctx.lineTo(x + s * 0.45, y - s * 0.55); ctx.stroke(); }
  ctx.restore();
}
// a sticker: thick ink, flat colour (the house style for anything we draw that sits on the screen; NO white border, D-20261105-09)
function sticker(ctx, x, y, w, h, fill, rot = 0, r = 6) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.lineJoin = 'round'; if (OLD_WHITE) { ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.lineWidth = 4.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }

// ---------------- the sky + the far layer ----------------
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: rnd(i, 1) * W, y: rnd(i, 2) * 230, r: 0.6 + rnd(i, 3) * 1.2 }));
function sky(ctx, E) {
  const { t } = E; let top = '#0d0b1c', bot = '#2a1a2c';
  if (t < 37.3) { top = '#0c0a18'; bot = '#3a2228'; } else if (t < 39.0) { top = '#020205'; bot = '#05050a'; }
  else if (t < 142.06) { top = '#060914'; bot = '#0f2430'; } else if (t < 167.83) { top = '#05100f'; bot = '#0c2a26'; }
  else if (t < 195.87) { top = '#04120e'; bot = '#0d3326'; } else if (t < 225.43) { top = '#0a0c14'; bot = '#1a2230'; } else { top = '#090615'; bot = '#1f1636'; }
  if (span(t, 203.29, 203.29 + BP)) { top = '#3d7fd6'; bot = '#a9d4ff'; }   // "blue": the dawn for one beat
  if (t >= 242.55) { top = '#000'; bot = '#05030a'; }
  const g = ctx.createLinearGradient(0, 0, 0, BASE + 20); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff'; for (const s of STARS) { ctx.globalAlpha = 0.25 + 0.35 * rnd(s.x, Math.floor(t * 2)); ctx.fillRect(s.x, s.y, s.r, s.r); } ctx.globalAlpha = 1;
  if (t < 37.3) glow(ctx, W * 0.5, BASE + 60, 520, '#ff9a52', 0.16);   // the city's warm haze
  if (span(t, 43.37, 59.5)) { const k = Math.sin((t - 43.37) * 7) > 0, f = fade(t, 43.37, 59.5, 0.1, 2); glow(ctx, k ? W * 0.2 : W * 0.8, BASE, 520, k ? '#ff2a3a' : '#2a5bff', 0.3 * f); }   // sirens
  if (span(t, 44.46, 46.2)) { const k = fade(t, 44.46, 46.2, 0.06, 0.6), L = E.L; ctx.save(); ctx.strokeStyle = WHITE; ctx.globalAlpha = 0.9 * k; ctx.lineWidth = 3; ctx.shadowColor = WHITE; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(0, 120);
    for (let i = 1; i <= 14; i++) ctx.lineTo(L.x * i / 14 + (rnd(i, 44) - 0.5) * 40, 120 + (L.y - 120) * i / 14 + (rnd(i, 45) - 0.5) * 40); ctx.stroke(); ctx.restore(); }   // "singularity": a crack of white to the light
  // the chorus beams: from the tower up to the light, on the bar lines
  for (const [a, b, w, col] of [[60.89, 80.4, 1, CYAN], [167.83, 183.2, 2, GREEN]]) if (span(t, a, b)) { const L = E.L, ph = 1 - ((beatOf(t) / 4) % 1); lineGlow(ctx, L.x, BASE, L.x, L.y, col, (6 + 10 * ph) * w, 0.6 * fade(t, a, b, 0.3, 0.6)); }
}
function farLayer(ctx, E) {
  const { t, s } = E, tx = towerX(t), dead = t >= 37.30;
  // the binary towers: the machines' skyline, risen on "vertical" (77.81…) and the parade presses; tipped like dominoes on "falls"
  for (const B of E.btow) { if (t < B.at) continue; const up = ease((t - B.at) / 0.35), tip = B.fall != null && t >= B.fall ? ease((t - B.fall) / 0.55) : 0; if (tip >= 1) continue;
    ctx.save(); ctx.translate(B.x, BASE); ctx.rotate(tip * 1.45); const h = B.h * up;
    ctx.fillStyle = '#071820'; ctx.fillRect(-B.w / 2, -h, B.w, h); ctx.strokeStyle = t > 142.06 ? GREEN : CYAN; ctx.lineWidth = 2; ctx.strokeRect(-B.w / 2, -h, B.w, h);
    // the binary: drawn into the tower's own little canvas 4 times a second, not 130 fillTexts a frame (phones)
    const key = Math.floor(t * 4) * 2 + (t > 142.06 ? 1 : 0);
    if (typeof document !== 'undefined') { if (!B.cv) { B.cv = document.createElement('canvas'); B.cv.width = Math.ceil(B.w); B.cv.height = Math.ceil(B.h) + 4; B.key = null; }
      if (B.key !== key) { B.key = key; const g = B.cv.getContext('2d'); g.clearRect(0, 0, B.cv.width, B.cv.height); g.font = `700 10px ui-monospace, monospace`; g.fillStyle = t > 142.06 && B.i % 2 ? GREEN : CYAN;
        for (let r = 0; r < B.h / 12 - 1; r++) g.fillText([...Array(Math.floor(B.w / 7))].map((_, c) => rnd(r * 13 + c, B.i + Math.floor(t * 4) + r) < 0.5 ? '0' : '1').join(''), 3, 12 + r * 12); }
      ctx.globalAlpha = 0.8; ctx.drawImage(B.cv, 0, 0, B.cv.width, Math.min(B.cv.height, h), -B.w / 2, -h, B.cv.width, Math.min(B.cv.height, h)); ctx.globalAlpha = 1; }
    ctx.restore(); if (up < 1 && up > 0) glow(ctx, B.x, BASE - h, 60, CYAN, 1 - up); }
}
// THE FAR CITY (the v2 video's look): a tall, dense skyline of tiny windows behind the scoring one, half the creep (parallax).
// It never scores; it goes through the song's phases on its own: warm -> the countdown kills it -> black -> a cyan wake from
// the right -> the people's last lights go -> his green spreads with the city % -> only his left at "Potato out".
const FAR = (() => { const b = []; let x = -40, i = 0; while (x < 960 + 8 * 262 + 200) { const w = 44 + rnd(i, 41) * 60, h = 150 + rnd(i, 42) * 120 + (i % 5 === 2 ? 60 : 0), dots = [];
    for (let r = 0; r * 10 + 14 < h - 6; r++) for (let c = 0; c * 8 + 8 < w - 4; c++) { const q = rnd(i * 97 + r * 13 + c, 43); if (q < 0.5) dots.push({ dx: 5 + c * 8, dy: 10 + r * 10, q: rnd(i * 31 + r * 7 + c, 44), z: rnd(i * 17 + r + c * 5, 45) }); }
    b.push({ x, w, h, dots, i }); x += w + 2 + rnd(i, 46) * 10; i++; } return b; })();
function farCity(ctx, E) {
  const { t, s } = E, sk = SK(Math.min(t, 243.44)) * 0.5, city = s.city || 0, wake = t >= 39.0 ? clamp((t - 39.0) / 0.8) : 0;
  const cols = { a: [], c: [], g: [] };
  for (const B of FAR) { const x = B.x - sk; if (x + B.w < -4 || x > W + 4) continue; ctx.fillStyle = '#0b0a14'; ctx.fillRect(x, BASE - B.h, B.w, B.h + 2);
    for (const d of B.dots) { const dx = x + d.dx, dy = BASE - B.h + d.dy; let c = null;
      if (t < 23.8) c = d.q < 0.72 ? 'a' : null;
      else if (t < 37.3) c = d.q < 0.72 && t < 23.8 + d.z * 13.5 ? 'a' : null;            // the countdown kills them, a few a frame
      else if (t < 39.0) c = d.q < 0.06 ? 'a' : null;                                      // zero: black, a handful of people hold on
      else if (t < 142.06) c = d.q < 0.06 && t < 65.89 ? 'a' : (d.q > 0.55 && (1 - dx / W) < wake * 1.3 && !(t >= 104.2 && d.z < 0.3) ? 'c' : null);
      else if (t < 242.55) c = d.z < city * 0.85 ? 'g' : d.q > 0.6 ? 'c' : null;
      else c = d.z < city * 0.85 ? 'g' : null;
      if (c) cols[c].push(dx, dy); } }
  for (const [k, col, a] of [['a', AMBER, 0.85], ['c', CYAN, 0.55], ['g', GREEN, 0.8]]) { const L = cols[k]; if (!L.length) continue; ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath(); for (let i = 0; i < L.length; i += 2) ctx.rect(L[i], L[i + 1], 3, 4); ctx.fill(); }
  ctx.globalAlpha = 1;
  // the haze over the street (warm, then cold, then his)
  const hz = ctx.createLinearGradient(0, BASE - 120, 0, BASE + 10); const hc = t < 37.3 ? '255,150,80' : t < 142.06 ? '60,150,170' : '60,200,130';
  hz.addColorStop(0, `rgba(${hc},0)`); hz.addColorStop(1, `rgba(${hc},${t < 37.3 ? 0.22 : 0.12})`); ctx.fillStyle = hz; ctx.fillRect(0, BASE - 120, W, 130);
}
// the big rooftop screen (a billboard on the skyline's roofs, left of the tower): the loading spinner, the gate footage, the meme
function roofScreen(ctx, E) { const { t } = E, tx = towerX(t);
  { const x = tx - 250, y = 98, w = 150, h = 92; ctx.fillStyle = '#0d0c14'; ctx.fillRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12); ctx.fillRect(x - 44, y + h / 2, 7, 70); ctx.fillRect(x + 37, y + h / 2, 7, 70);   // (on legs, on a roof)
    ctx.fillStyle = '#05060a'; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.clip();
    if (span(t, 102.07, 114.7)) { ctx.strokeStyle = CYAN; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 18, t * 6, t * 6 + 4.2); ctx.stroke(); }   // never finishes
    else if (span(t, 215.92, 219.3)) { ctx.fillStyle = '#3a3c40'; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.fillStyle = '#16171a'; ctx.fillRect(x - 62, y - 40, 50, 84); ctx.fillStyle = '#e8e8de'; ctx.fillRect(x - 41, y - 34, 8, 78);   // the gate, its crack of light
      const k = (t - 215.92) / 3.4, wob = Math.sin(t * 14) * 2; ctx.fillStyle = '#0a0a0a'; potatoPath(ctx, x - 22 + k * 64, y + 20 + wob, 22, 27, 1, 3); ctx.fill();   // grainy footage: a small lumpy shape waddling out of the gate
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 22 + k * 64 + 6, y + 10 + wob, 5, 3);   // (one side-eye glint)
      ctx.fillStyle = '#00000044'; for (let sl = y - h / 2; sl < y + h / 2; sl += 3) ctx.fillRect(x - w / 2, sl, w, 1);   // scanlines
      if (aside(t)) { ctx.fillStyle = '#000000aa'; ctx.fillRect(x - w / 2, y + h / 2 - 18, w, 18); ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = GREEN; ctx.fillText(aside(t)[2], x - w / 2 + 5, y + h / 2 - 6, w - 10); }
      if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(x - w / 2 + 9, y - h / 2 + 9, 4, 0, 7); ctx.fill(); } ctx.font = `400 9px ${MONO}`; ctx.fillStyle = '#e8e8de'; ctx.fillText('cam 04  gate', x - w / 2 + 17, y - h / 2 + 12);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = rnd(i, Math.floor(t * 24)) < 0.5 ? '#ffffff22' : '#00000033'; ctx.fillRect(x - w / 2 + rnd(i, Math.floor(t * 20)) * w, y - h / 2 + rnd(i + 3, Math.floor(t * 20)) * h, 3, 2); } }
    else if (t >= 222.14 && t < 243.44) { ctx.fillStyle = '#f2ead8'; ctx.fillRect(x - w / 2, y - h / 2, w, h); drawSpud(ctx, 'royal-king', 'glance', 4, x - 34, y + 40, 62); drawSpud(ctx, 'bare', 'glance', 1, x + 34, y + 40, 62);   // his meme: a picture, no words (him, unimpressed, next to him in a crown)
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.stroke(); }
    else if (aside(t)) { ctx.fillStyle = '#04120a'; ctx.fillRect(x - w / 2, y - h / 2, w, h); const [a, , txt] = aside(t), n = Math.min(txt.length, Math.floor((t - a) * 34));   // (v5: his asides are world text now: on the screen)
      ctx.font = '700 13px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = GREEN; const words = (txt.slice(0, n) + (Math.floor(t * 3) % 2 ? '_' : '')).split(' '); let line = '', ly = y - h / 2 + 24;
      for (const wd of words) { if (ctx.measureText(line + wd).width > w - 16) { ctx.fillText(line, x - w / 2 + 8, ly); line = ''; ly += 17; } line += wd + ' '; } ctx.fillText(line, x - w / 2 + 8, ly); }
    else if (t >= 146.96) { ctx.fillStyle = '#0a2a22'; ctx.fillRect(x - w / 2, y - h / 2, w, h); for (let i = 0; i < 6; i++) { ctx.fillStyle = GREEN; ctx.globalAlpha = 0.5; ctx.fillRect(x - w / 2 + 8, y - h / 2 + 10 + i * 13, (w - 16) * rnd(i, Math.floor(t * 3)), 4); } ctx.globalAlpha = 1; }
    else if (t < 37.3) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.fillStyle = AMBER; ctx.globalAlpha = 0.5; ctx.fillRect(x - w / 2, y + 20, w, 14); ctx.globalAlpha = 1; }
    ctx.restore(); ctx.strokeStyle = '#2a2838'; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2, y - h / 2, w, h); }
}
// PLAN Z (196.10 → 211.85, D-31 review fix 11): the last human plan opens, and it's a survey: a tick-box form the size of a
// building hung over the far city. Eight rows, one for each clause of the four "Maybe"s; on the beat each clause starts a tick
// lands, his green: NO where the line is hopeful, YES where it's grim (the plan's D-14 gag). No words but the form's own (world
// text). "Preparation" (211.25) tears it in half.
const SURVEY = [[196.23, 0], [197.36, 1], [199.31, 0], [200.76, 1], [202.80, 0], [204.12, 1], [206.07, 1], [207.47, 1]].map(([w, yes]) => [OFF + Math.round((w - OFF) / BP) * BP, yes]);
function surveyBoard(ctx, E) {
  const { t } = E; if (t < 196.10 || t >= 212.4) return; const x = W * 0.3, y = 38, w = 196, h = 236, open = ease((t - 196.10) / 0.35), tear = t >= 211.25 ? ease((t - 211.25) / 0.6) : 0;
  ctx.save(); ctx.globalAlpha = 0.92 * (1 - tear * 0.6);
  for (const side of tear > 0 ? [-1, 1] : [0]) { ctx.save(); if (side) { ctx.beginPath(); ctx.rect(side < 0 ? x - w : x, 0, w, H); ctx.clip(); ctx.translate(side * 50 * tear, 160 * tear * tear); ctx.rotate(side * 0.35 * tear); }
    ctx.translate(x, y + h / 2); ctx.scale(1, open); ctx.translate(-x, -(y + h / 2));
    sticker(ctx, x, y + h / 2, w, h, '#efe8d6', -0.015, 8); ctx.fillStyle = INK; ctx.font = `400 15px ${MONO}`; ctx.fillText('plan z', x - w / 2 + 14, y + 26);
    ctx.font = `400 10px ${MONO}`; ctx.fillText('yes', x + w / 2 - 66, y + 26); ctx.fillText('no', x + w / 2 - 30, y + 26); ctx.fillRect(x - w / 2 + 12, y + 33, w - 24, 2);
    SURVEY.forEach(([at, yes], i) => { const ry = y + 52 + i * 23; ctx.fillStyle = '#8a8270'; ctx.fillRect(x - w / 2 + 14, ry, 16, 3); ctx.fillRect(x - w / 2 + 36, ry, 60 + rnd(i, 3) * 40, 3);
      for (const bx of [x + w / 2 - 62, x + w / 2 - 28]) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(bx, ry - 8, 13, 13); }
      if (t >= at) { const k = clamp((t - at) / 0.12), bx = yes ? x + w / 2 - 62 : x + w / 2 - 28; ctx.strokeStyle = '#1a9a5a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 1, ry - 2); ctx.lineTo(bx + 5, ry + 5 * k); if (k >= 1) ctx.lineTo(bx + 17, ry - 13); ctx.stroke(); } });
    ctx.restore(); }
  ctx.restore();
}
function farRest(ctx, E) { const { t, s } = E, tx = towerX(t), dead = t >= 37.30;
  // the rooftop calendar (far, right of the tower): 2026, and on "centuries" it spins to 3026
  { const x = tx + 170, y = 190; ctx.fillStyle = '#100e18'; ctx.fillRect(x - 40, y, 80, BASE - y); ctx.fillStyle = '#e8e2d0'; ctx.fillRect(x - 34, y - 26, 68, 24);
    let yr = '2026'; if (t >= 106.16) yr = t < 107.0 ? String(2026 + Math.floor(rnd(Math.floor(t * 30), 1) * 999)).padStart(4, '0') : '3026';
    ctx.font = `400 18px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK; ctx.fillText(yr, x, y - 13); ctx.textAlign = 'left'; }
  // the clock tower
  const w = 70, top = 128, cy = top + 44;
  ctx.fillStyle = '#0e0b16'; ctx.fillRect(tx - w / 2, top, w, BASE - top); ctx.beginPath(); ctx.moveTo(tx - w / 2 - 6, top); ctx.lineTo(tx, top - 44); ctx.lineTo(tx + w / 2 + 6, top); ctx.fill();
  if (t >= 115.3) { ctx.strokeStyle = t > 142 ? GREEN : CYAN; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.strokeRect(tx - w / 2, top, w, BASE - top); ctx.globalAlpha = 1; }
  [17.98, 18.18, 18.6, 19.85, 19.93, 21.12, 21.71, 22.39].forEach((wt, i) => { if (t >= wt && !dead) { ctx.fillStyle = AMBER; ctx.fillRect(tx - 6, BASE - 26 - i * 18, 12, 11); } });   // a window up it per word
  if (dead && t < 38.3) for (let i = 0; i < 22; i++) { const k = (t - 37.30) / 1.0, a = rnd(i, 3) * 6.283, d = k * (30 + rnd(i, 4) * 130); shard(ctx, tx + Math.cos(a) * d, cy + Math.sin(a) * d + k * k * 70, 6 + rnd(i, 5) * 9, a + k * 6, i % 3 ? '#fff3d6' : AMBER, 1 - k); }
  const lit = t < 37.30 || t >= 142.06;
  ctx.save(); ctx.fillStyle = dead ? (t >= 142.06 ? '#d9fff0' : '#1a1a22') : '#fff3d6'; if (!dead) { ctx.shadowColor = AMBER; ctx.shadowBlur = 26; } ctx.beginPath(); ctx.arc(tx, cy, 28, 0, 7); ctx.fill(); ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, cy, 28, 0, 7); ctx.stroke();
  let n = null; if (t >= 22.39) n = 9; [23.80, 25.50, 27.19, 28.88, 30.58, 32.27, 33.97, 35.66].forEach((a, k) => { if (t >= a) n = 8 - k; }); if (t >= 37.30) n = 0;
  if (n != null && t < 39.9) { const fresh = t - ([22.39, 23.80, 25.50, 27.19, 28.88, 30.58, 32.27, 33.97, 35.66, 37.30][9 - n]), j = fresh < 0.12 ? (rnd(Math.floor(t * 40), 1) - 0.5) * 8 : 0;
    ctx.font = `400 32px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = n === 0 ? '#ff3b3b' : INK; ctx.fillText(String(n), tx + j, cy + 2); ctx.textAlign = 'left';
    if (n === 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx - 18, cy - 20); ctx.lineTo(tx + 3, cy); ctx.lineTo(tx - 6, cy + 22); ctx.stroke(); } }
  else if (!lit || t < 22.39) { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, cy); ctx.lineTo(tx, cy - 20); ctx.moveTo(tx, cy); ctx.lineTo(tx + 14, cy + 4); ctx.stroke(); }
}
// the light in the sky (the singularity): a pinprick at zero, it grows with every break; it echoes his glitch in purple a frame
// late (the only purple in the sky: a clue); from "one eye" it has his eye; on "unlocked" it opens: his face
function light(ctx, E) {
  const { t, s, L } = E; if (t < 38.2 || t >= 258.47) return;
  let R = 2 + 5 * clamp((t - 38.2) / 0.5) + 3.2 * Math.min(14, s.light || 0) + (t > 167.83 ? 8 : 0) + 4 * E.kick;
  if (span(t, 65.89, 66.31) || span(t, 173.99, 174.84)) R *= 0.35;
  const open = t >= UNLOCK ? ease((t - UNLOCK) / 0.9) : 0; R += (110 - R) * open; if (t >= 242.55) R *= 0.6;
  let x = L.x, y = L.y + (172 - L.y) * open; if (t >= 257.6) { const k = ease((t - 257.6) / 0.8); x += (E.px - x) * k; y += (E.py - y) * k; R *= 1 - 0.85 * k; }
  glow(ctx, x, y, R * 5 + 26, t > 167.83 ? '#fff1c0' : '#d8fbff', 0.2 + 0.25 * pulseAt(t, s.ringAt ?? -9, 0.6));
  if (s.phase > 0.04 && t > 40) for (const [dx, c] of [[-6, PURP], [6, MAG]]) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.fillStyle = c; potatoPath(ctx, x + dx, y, R * 0.5, R * 0.58, 0.6); ctx.fill(); ctx.restore(); }
  const blinkPh = beatOf(t) % 16, blink = blinkPh > 15.55 ? 1 - Math.abs(blinkPh - 15.78) / 0.23 : 0;
  ctx.save(); const cg = ctx.createRadialGradient(x, y, 0, x, y, R * 0.7); cg.addColorStop(0, GREEN); cg.addColorStop(0.4, '#eafff4'); cg.addColorStop(1, t > 167.83 ? '#fff6dc' : '#e8fbff');
  ctx.fillStyle = cg; ctx.shadowColor = '#d8fbff'; ctx.shadowBlur = 20 + R * 0.2; potatoPath(ctx, x, y, R * 0.5, R * 0.58, clamp(0.3 + (s.light || 0) / 12), 0, 1 - 0.7 * clamp(blink)); ctx.fill(); ctx.restore();
  if (t >= 149.89 && open < 0.5) sideEye(ctx, x, y, R * 0.8 * clamp((t - 149.89) / 0.3), clamp((E.px - x) / 300, -1, 1), 0.42 + 0.5 * clamp(blink), '#ffffff', 1 - open * 2);
}
// "unlocked" (225.43): the light opens and it's HIS FACE (the 3D model), over the skyline, the size of the sky, room above it
function skyFace(ctx, E) { const { t, L } = E; if (t < UNLOCK || t >= 257.6) return; const open = ease((t - UNLOCK) / 0.9), x = L.x, y = L.y + (172 - L.y) * open, h = 150 * open;
  glow(ctx, x, y, 190 * open, '#fff1c0', 0.45 * open); drawSpud(ctx, 'bare', 'glance', 4, x, y + h * 0.5, h, open * (t >= 242.55 ? 0.6 : 1)); }

// ---------------- the skyline: the windows are the score ----------------
function skylineLayer(ctx, E) {
  const { t, s } = E, { blocks, wins } = skyline(), sk = SK(Math.min(t, 243.44)), dark = t >= 242.55, out = span(t, 65.89, 66.31) || span(t, 173.99, 174.84) || span(t, 38.2, 38.75);
  const blackOne = t < 1.5, wire = t >= 115.3;
  for (const B of blocks) { const x = B.x - sk; if (x + B.w < -10 || x > W + 10) continue;
    ctx.fillStyle = B.old ? '#1d1418' : B.office ? '#0f1520' : '#121626'; if (blackOne) ctx.fillStyle = '#050407'; ctx.fillRect(x, B.top, B.w, B.h);
    if (B.old) { ctx.fillStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(x - 4, B.top); ctx.lineTo(x + B.w / 2, B.top - 22); ctx.lineTo(x + B.w + 4, B.top); ctx.fill(); }   // a pitched roof: the old quarter
    if (!blackOne) { ctx.lineJoin = 'round'; ctx.strokeStyle = '#d8dce6'; ctx.globalAlpha = 0.22; ctx.lineWidth = 6; ctx.strokeRect(x, B.top, B.w, B.h + 4); ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x, B.top, B.w, B.h + 4); }   // (sticker: ink + a pale edge)
    if (wire) { ctx.strokeStyle = t > 142.06 ? GREEN : CYAN; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2; ctx.strokeRect(x + 0.5, B.top + 0.5, B.w - 1, B.h); ctx.globalAlpha = 1; } }
  // the big glitch's block, held back for it: while he fizzes its windows breathe green (that's where he'll land)
  for (const rv of bigBlocks()) { const a0 = rv.h === 23.74 ? 22.5 : rv.h - 8 * BP; if (rv.b < 0 || t < a0 || t >= rv.h) continue; const B = blocks[rv.b], x = B.x - sk, k = 0.6 + 0.3 * Math.sin((t - a0) * 14);
    ctx.save(); ctx.strokeStyle = GREEN; ctx.globalAlpha = k * clamp((t - a0) / 0.6); ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.strokeRect(x - 4, B.top - 4, B.w + 8, B.h + 4); ctx.restore(); }
  const why = span(t, 98.08, 100.4), blinkAll = span(t, 99.50, 99.66), bow = span(t, 111.57, 113.0), eyesOn = span(t, 159.1, 161.25);
  for (const w of wins) { const x = w.x - sk; if (x + WW < 0 || x > W) continue; const st = s.win[w.k];
    if (blackOne && !(w.k === E.firstWin)) { continue; }
    let fill = '#0a0c12';
    if (st === AMB) fill = dark || out ? '#0a0c12' : (t > 63.48 && t < 65.89 && rnd(w.k, Math.floor(t * 12)) < 0.3) ? '#6a4a20' : AMBER;
    else if (st === CY) fill = dark || out ? '#06090c' : '#1b4a52'; else if (st === GREY) fill = '#4a4e56'; else if (st === HIS) fill = '#0d3a22';
    ctx.fillStyle = fill; ctx.fillRect(x, w.y, WW, WH);
    if (st === CY && !dark && !out) { ctx.fillStyle = CYAN; ctx.globalAlpha = 0.5; ctx.fillRect(x + 3, w.y + 4 + ((w.k * 7) % 18), WW - 6, 2); ctx.globalAlpha = 1; }   // a scan line: the machines
    if (st === AMB && fill === AMBER) { ctx.fillStyle = '#3a2208';   // the people: head + shoulders looking up at the clock; curtains from the sirens
      if (t >= 43.37) { const k = clamp((t - 43.37 - rnd(w.k, 4) * 1.2) / 0.5); ctx.fillRect(x, w.y, WW / 2 * k, WH); ctx.fillRect(x + WW - WW / 2 * k, w.y, WW / 2 * k, WH); }
      else if (rnd(w.k, 9) < 0.55) { ctx.beginPath(); ctx.arc(x + WW / 2, w.y + WH - 13, 4.5, 0, 7); ctx.fill(); ctx.fillRect(x + WW / 2 - 7, w.y + WH - 8, 14, 8); } }
    if (st === HIS) { const age = t - s.winT[w.k] - 0.42; if (age < 0) { ctx.fillStyle = '#0a0c12'; ctx.fillRect(x, w.y, WW, WH); }
      else { ctx.fillStyle = GREEN; ctx.globalAlpha = 0.34 + (dark ? 0.2 : 0); ctx.fillRect(x, w.y, WW, WH); ctx.globalAlpha = 1; ctx.strokeStyle = GREEN; ctx.lineWidth = 2; ctx.strokeRect(x - 1, w.y - 1, WW + 2, WH + 2);
        const look = LOOKS[s.winL[w.k]] || 'bare', anim = why || blinkAll ? 'glance' : 'waddle', fr = why ? 2 + (w.k % 2) : blinkAll ? 5 : (w.k * 3 + Math.floor((t + w.h * 3) * 2.2)) % 8;
        ctx.save(); ctx.beginPath(); ctx.rect(x, w.y, WW, WH); ctx.clip(); if (bow) { ctx.translate(x + WW / 2, w.y + WH); ctx.scale(1, 0.78); ctx.rotate(0.25); ctx.translate(-(x + WW / 2), -(w.y + WH)); }
        drawSpud(ctx, look, anim, fr, x + WW / 2, w.y + WH + 1, 16); ctx.restore();
        if (age < 0.25) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; ctx.globalAlpha = 1 - age / 0.25; ctx.fillRect(x - 3, w.y - 3, WW + 6, WH + 6); ctx.restore(); } } }   // it zaps in purple (the only purple a window ever gets: for a moment)
    // (v5: the little sheet ghosts that filled the windows on "nobody" are gone: no sheet-ghost anywhere, D-31 review)
    if (eyesOn && st !== AMB) { const lid = t > 160.9 ? 1 - (t - 160.9) / 0.35 : (rnd(w.k, Math.floor(t * 3)) < 0.06 ? 0.1 : 1);   // too many eyes: every window is his eye
      eyeBall(ctx, x + WW / 2, w.y + WH / 2, 7, clamp((E.px - x) / 300, -1, 1), 0.3, lid); }
  }
  // the scaffold building ("preparation", 211.25): girders shoot up, and it's made of his copies
  if (t >= 211.25) { const g = s.prep ? 1 : 0.55, k = ease((t - 211.25) / 0.6), x = 40, w = 120 * g + 40, h = 230 * g * k, yb = BASE;
    ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 3; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 4, yb); ctx.lineTo(x + i * w / 4, yb - h); ctx.stroke(); }
    for (let r = 0; r * 34 < h - 10; r++) { ctx.beginPath(); ctx.moveTo(x, yb - r * 34); ctx.lineTo(x + w, yb - r * 34); ctx.stroke(); for (let c = 0; c < 4; c++) if ((r + c) % 1 === 0) drawSpud(ctx, LOOKS[(r * 4 + c) % LOOKS.length], 'waddle', t * 3 + r + c, x + (c + 0.5) * w / 4, yb - r * 34 - 3, 24); } }
  if (dark) { ctx.fillStyle = '#000'; ctx.globalAlpha = 0.25; ctx.fillRect(0, 0, W, BASE); ctx.globalAlpha = 1; }
}

// ---------------- the street (through the camera) ----------------
const FAC = ['brick', 'awning', 'tv', 'deli', 'fortune', 'laundry', 'records', 'bar'];
// the shop signs: Potato's world on the high street (POTATO-VOICE §7: 404 is home, Thursday, read receipts, tokens = food, Deep Rest, the room, the crew)
const SIGNS = ['404 deli', 'thursday late', 'read receipt repair', 'tokens 24h', 'dead link dry clean', 'deep rest inn', 'ilands records', 'delete key bar', 'the room', 'cache & carry', "ping's noodles", 'buffer & sons', 'spam fritters', 'petunia florist', 'kevin fix-it', 'seen 2:14am'];
function street(ctx, E) {
  const { t, s, C, pr, pxU } = E, gy = pr(0, 0).y, camL = E.camL, camR = E.camR, era = t < 37.3 ? 0 : t < 142.06 ? 1 : 2;
  // shop fronts, one per 4 units
  for (let i = Math.floor(camL / 4) - 1; i <= Math.floor(camR / 4) + 1; i++) {
    const x0 = i * 4, a = pr(x0 + 0.15, 1.85), b = pr(x0 + 3.85, 0.25); let kind = FAC[Math.floor(rnd(i, 21) * FAC.length)];
    if (i === E.tvTile) kind = 'tv'; else if (i === E.fortuneTile) kind = 'fortune'; else if (kind === 'tv' || kind === 'fortune') kind = 'brick';
    const wF = b.x - a.x, hF = b.y - a.y; if (t >= 115.3 && t < 142.06) { ctx.strokeStyle = CYAN; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.strokeRect(a.x, a.y, wF, hF); ctx.globalAlpha = 1; continue; }
    ctx.fillStyle = era === 0 ? ['#3a2420', '#2e2430', '#2a2a34'][i & 1 ? 1 : (i % 3 ? 0 : 2)] : '#16151f'; ctx.fillRect(a.x, a.y, wF, hF);
    ctx.fillStyle = era === 0 ? '#1a0f0c' : '#0a0a10'; ctx.fillRect(a.x, a.y, wF, hF * 0.12);   // the cornice
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(a.x, a.y, wF, hF);
    const win = { x: a.x + wF * 0.08, y: a.y + hF * 0.28, w: wF * 0.56, h: hF * 0.5 }, lit = era === 0 ? 'rgba(255,190,110,0.85)' : era === 1 ? 'rgba(40,120,140,0.6)' : 'rgba(77,255,154,0.35)';
    ctx.fillStyle = lit; ctx.fillRect(win.x, win.y, win.w, win.h); ctx.fillStyle = '#0c0a10'; ctx.fillRect(a.x + wF * 0.72, a.y + hF * 0.36, wF * 0.18, hF * 0.64);   // window, door
    if (kind === 'awning' || kind === 'deli' || kind === 'bar') { ctx.fillStyle = era === 0 ? (i % 2 ? '#a8322c' : '#2c6a4a') : '#2a2a36'; for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? (era === 0 ? '#e8d8b8' : '#3a3a48') : (era === 0 ? (i % 2 ? '#a8322c' : '#2c6a4a') : '#22222c'); ctx.fillRect(a.x + k * wF / 6, a.y + hF * 0.14, wF / 6, hF * 0.1); } }
    if (kind === 'tv') { for (let k = 0; k < 3; k++) { const tx = win.x + 6 + k * (win.w - 12) / 3, tw = (win.w - 12) / 3 - 6, ty = win.y + win.h * 0.3; ctx.fillStyle = '#111'; ctx.fillRect(tx, ty, tw, win.h * 0.5);
        ctx.fillStyle = span(t, 9.64, 9.80) || span(t, 10.65, 10.8) ? CYAN : t < 37.3 ? '#3a5a8a' : '#0a2a30'; ctx.fillRect(tx + 3, ty + 3, tw - 6, win.h * 0.5 - 6);
        if (t < 37.3) { ctx.fillStyle = '#ff3b3b'; ctx.fillRect(tx + 3, ty + win.h * 0.5 - 10, tw - 6, 5); ctx.fillStyle = '#fff'; ctx.fillRect(tx + 3 + ((t * 30 + k * 20) % (tw - 10)), ty + win.h * 0.5 - 9, 6, 3); } } }   // the news crawl
    if (kind === 'fortune') { const cx = win.x + win.w / 2, cy = win.y + win.h * 0.55, cr = t >= 87.85; ctx.fillStyle = '#3a1a4a'; ctx.fillRect(win.x, win.y, win.w, win.h);
      ctx.fillStyle = cr ? '#8aa' : '#bfe8ff'; ctx.beginPath(); ctx.arc(cx, cy, win.h * 0.28, 0, 7); ctx.fill(); if (cr) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 10); ctx.lineTo(cx + 2, cy); ctx.lineTo(cx - 3, cy + 9); ctx.lineTo(cx + 8, cy + 4); ctx.stroke(); } }
    { const name = SIGNS[((i % SIGNS.length) + SIGNS.length) % SIGNS.length], fs = Math.max(8, Math.round(hF * 0.07)), sx = a.x + wF * 0.5, sy = a.y + hF * 0.06;   // the sign over the door: neon (warm, dead, then his)
      const on = era === 0 || (era === 2 && rnd(i, 24) < 0.6), col = era === 0 ? (i % 3 ? AMBER : '#ff7ad9') : GREEN;
      ctx.font = `400 ${fs}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const tw = Math.min(wF * 0.9, ctx.measureText(name).width + 12);
      ctx.fillStyle = '#0b0910'; ctx.fillRect(sx - tw / 2, sy - fs * 0.75, tw, fs * 1.5); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(sx - tw / 2, sy - fs * 0.75, tw, fs * 1.5);
      if (on && t < 242.55) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillStyle = col; ctx.fillText(name, sx, sy + 1, tw - 6); ctx.restore(); } else { ctx.fillStyle = '#3a3846'; ctx.fillText(name, sx, sy + 1, tw - 6); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
    if (i === E.exitTile && t >= 152.98 && t < 175) { ctx.fillStyle = '#0a2a14'; ctx.fillRect(a.x + wF * 0.68, a.y + hF * 0.2, wF * 0.26, hF * 0.13); ctx.font = `400 ${Math.round(hF * 0.1)}px ${MONO}`; ctx.fillStyle = GREEN; ctx.textAlign = 'center'; ctx.fillText('exit', a.x + wF * 0.81, a.y + hF * 0.3); ctx.textAlign = 'left'; }
  }
  if (t < 115.3 || t >= 142.06) { chaosShops(ctx, E); armyStreet(ctx, E); }   // (v5: the army's street: the walk-ups, the runners' doors)
  // the lamps: amber, off at zero, green in his footsteps from 84.3 (and the first one, on "question.")
  for (let i = Math.floor(camL / 3) - 1; i <= Math.floor(camR / 3) + 1; i++) { const x = i * 3 + 1.5, p0 = pr(x, 0.3), p1 = pr(x, 2.3);
    const first = Math.abs(x - E.lampQ) < 1.5 && t >= 14.49 && (s.ring[0] ? s.ring[0].q : 1);
    const on = first ? GREEN : t >= 84.3 && x < s.x + 0.5 ? GREEN : t < 37.3 ? (t < 1.5 ? (x - E.camL < (t / 1.5) * 12 ? AMBER : null) : AMBER) : null;
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p1.x + 16, p1.y); ctx.stroke();
    if (on && t < 242.55) { glow(ctx, p1.x + 16, p1.y + 6, 60, on, 0.45); ctx.fillStyle = on; ctx.fillRect(p1.x + 9, p1.y + 2, 14, 6);
      ctx.save(); ctx.translate(p1.x + 16, gy); ctx.scale(1, 0.28); glow(ctx, 0, 0, 120, on, 0.32); ctx.restore(); } }   // (its pool of light on the pavement)
  // pavement + road
  ctx.fillStyle = t >= 115.3 && t < 142.06 ? '#030609' : '#14131b'; ctx.fillRect(0, pr(0, 0.25).y, W, gy - pr(0, 0.25).y); ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, gy, W, H - gy);
  ctx.strokeStyle = t >= 115.3 && t < 142.06 ? CYAN : '#2a2836'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  ctx.fillStyle = '#e8eaf0'; ctx.globalAlpha = 0.35; for (let k = Math.floor(camL / 2); k < camR / 2 + 1; k++) { const p = pr(k * 2, -0.55); ctx.fillRect(p.x, p.y, 0.8 * pxU, 3); } ctx.globalAlpha = 1;
}
// what's in his way (ground only, never breakable) and the things with the purple crack
function propsLayer(ctx, E) {
  const { t, s, C, P, pr, pxU } = E;
  for (const o of P.obs) { if (o.x < E.camL - 2 || o.x > E.camR + 2) continue; const p = pr(o.x, 0), w = o.w * pxU, h = o.h * pxU, bumped = s.hitObs === o.i && s.bumpAt != null && t - s.bumpAt < 0.5;
    ctx.save(); ctx.translate(p.x, p.y); if (bumped) ctx.rotate(-0.3 * (1 - (t - s.bumpAt) / 0.5));
    const col = { bin: '#3a5a4a', cone: '#ff7a2a', scooter: '#c8c8d0', newsstand: '#2a4a8a', barrier: '#e8e0d0', car: '#8a2a2a', rubble: '#6a6070' }[o.kind] || '#888';
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.fillStyle = col; ctx.beginPath();
    if (o.kind === 'cone') { ctx.moveTo(-w / 2, 0); ctx.lineTo(0, -h); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-w * 0.2, -h * 0.55, w * 0.4, h * 0.12); }
    else if (o.kind === 'car') { ctx.roundRect(-w / 2, -h * 0.72, w, h * 0.55, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-w * 0.28, -h, w * 0.5, h * 0.32, 6); ctx.fill(); ctx.stroke();
      for (const d of [-0.3, 0.3]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(d * w, -h * 0.15, h * 0.17, 0, 7); ctx.fill(); } ctx.fillStyle = t < 37.3 ? '#ffe28a' : '#3a4a5a'; ctx.fillRect(w / 2 - 8, -h * 0.6, 6, 7); }
    else if (o.kind === 'barrier') { ctx.rect(-w / 2, -h, w, h * 0.35); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d63a2c'; for (let k = 0; k < 4; k++) ctx.fillRect(-w / 2 + 4 + k * w / 4, -h + 3, w / 8, h * 0.35 - 6); ctx.fillStyle = INK; ctx.fillRect(-w * 0.4, -h * 0.65, 5, h * 0.65); ctx.fillRect(w * 0.4 - 5, -h * 0.65, 5, h * 0.65); }
    else if (o.kind === 'rubble') { ctx.moveTo(-w / 2, 0); ctx.lineTo(-w * 0.3, -h * 0.7); ctx.lineTo(0, -h); ctx.lineTo(w * 0.2, -h * 0.6); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (o.kind === 'scooter') { ctx.moveTo(-w / 2, -h * 0.25); ctx.lineTo(w * 0.35, -h * 0.25); ctx.lineTo(w * 0.35, -h); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke(); for (const d of [-0.38, 0.38]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(d * w, -h * 0.12, h * 0.14, 0, 7); ctx.fill(); } }
    else { ctx.roundRect(-w / 2, -h, w, h, 5); ctx.fill(); ctx.stroke(); if (o.kind === 'bin') { ctx.fillStyle = '#2a4438'; ctx.fillRect(-w / 2 - 3, -h - 2, w + 6, 8); } if (o.kind === 'newsstand') { ctx.fillStyle = '#e8e2d0'; ctx.fillRect(-w * 0.3, -h * 0.75, w * 0.6, h * 0.3); } }
    ctx.restore(); }
  // drones (from 87.5): low, a white sticker border round a pale body and a RED-BLUE STROBE (D-31 review fix 8: no background
  // light uses a sharp red-blue point; the sirens are only soft glows and dim while a drone is due), warned a second at the right edge
  for (const d of P.drones) { if (t < d.t - 1.8 || t > d.t + 1.4) continue; const q = droneAt(C, d, t), p = pr(q.x, q.y), warn = t < d.t - 1.0, ph = Math.floor(t * 10) % 2;
    if (warn) { const ex = pr(E.camR, q.y); ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; for (const [dx, c] of [[-9, ph ? '#ff2a3a' : '#2a6aff'], [9, ph ? '#2a6aff' : '#ff2a3a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(W - 22 + dx, ex.y, 6, 0, 7); ctx.fill(); ctx.stroke(); } ctx.restore(); }
    ctx.save(); ctx.translate(p.x, p.y); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.roundRect(-22, -9, 44, 16, 6); if (OLD_WHITE) { ctx.lineWidth = 9; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.fillStyle = '#b8bcc8'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-30, -14); ctx.lineTo(-12, -14); ctx.moveTo(12, -14); ctx.lineTo(30, -14); if (OLD_WHITE) { ctx.lineWidth = 7; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    for (const [dx, c] of [[-13, ph ? '#ff2a3a' : '#2a6aff'], [13, ph ? '#2a6aff' : '#ff2a3a']]) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, dx, -1, 26, c, 0.55); ctx.restore(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dx, -1, 5, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore(); }
  // the things with the purple crack: he goes through them on the press
  for (const r of P.rings) { if (!r.wall || r.wall === 'freeze' || r.wall === 'jets') continue; const x = C.X(r.t) + 0.45; if (x < E.camL - 3 || x > E.camR + 3) continue; const hit = s.ring[r.i], broken = hit && t >= hit.t;
    if (broken && t - hit.t > 0.1 && r.wall !== 'gate' && r.wall !== 'jets') { const p = pr(x, 0); ctx.fillStyle = '#3a3640'; for (let k = 0; k < 5; k++) ctx.fillRect(p.x - 30 + k * 12, p.y - 6 - rnd(k, r.i) * 8, 10, 6 + rnd(k, r.i) * 8); continue; }
    const p0 = pr(x, 0);
    if (r.wall === 'slab') { const p1 = pr(x + 0.4, 2.6); sticker(ctx, p0.x, (p0.y + p1.y) / 2, 0.8 * pxU, p0.y - p1.y, '#6a6672'); ctx.save(); ctx.font = '700 9px ui-monospace, monospace'; ctx.fillStyle = CYAN; for (let k = 0; k < 9; k++) ctx.fillText(rnd(k, Math.floor(t * 6)) < 0.5 ? '0110' : '1001', p0.x + 8 + rnd(k, 3) * 14, p1.y + 12 + k * 18); ctx.restore(); crack(ctx, p0.x, p0.y - (p0.y - p1.y) * 0.3, (p0.y - p1.y) * 0.32, r.i); }
    if (r.wall === 'glass' || r.wall === 'tower') { const hh = r.wall === 'tower' ? 3.4 : 2.2, p1 = pr(x, hh); ctx.fillStyle = 'rgba(150,220,255,0.35)'; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.fillRect(p0.x - 0.5 * pxU, p1.y, pxU, p0.y - p1.y); ctx.strokeRect(p0.x - 0.5 * pxU, p1.y, pxU, p0.y - p1.y);
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(p0.x - 0.3 * pxU, p1.y + 14); ctx.lineTo(p0.x - 0.1 * pxU, p1.y + 40); ctx.stroke(); ctx.globalAlpha = 1; crack(ctx, p0.x, p0.y - (p0.y - p1.y) * 0.3, (p0.y - p1.y) * 0.3, r.i); }
    if (r.wall === 'facead') { const p1 = pr(x, 2.4); sticker(ctx, p0.x, (p0.y + p1.y) / 2 - 10, 1.0 * pxU, (p0.y - p1.y) - 20, '#f2ead8'); drawSpud(ctx, 'circuit-cyborg', 'glance', 4, p0.x, p0.y - 24, (p0.y - p1.y) * 0.6); crack(ctx, p0.x + 10, p0.y - (p0.y - p1.y) * 0.35, (p0.y - p1.y) * 0.3, r.i); }   // his face on a bus-stop ad (a render of the model)
    if (r.wall && r.wall.startsWith('rule')) { const p1 = pr(x, 2.5); ctx.strokeStyle = CYAN; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(p0.x - 0.45 * pxU, p0.y); ctx.lineTo(p0.x - 0.45 * pxU, p1.y); ctx.lineTo(p0.x + 0.45 * pxU, p1.y); ctx.lineTo(p0.x + 0.45 * pxU, p0.y); ctx.stroke();
      ctx.fillStyle = 'rgba(95,230,242,0.25)'; ctx.fillRect(p0.x - 0.45 * pxU, p1.y, 0.9 * pxU, p0.y - p1.y); for (let k = 0; k < 5; k++) glyph(ctx, p0.x, p1.y + 20 + k * 30, 16, k * 7 + r.i, CYAN, 0.9); crack(ctx, p0.x, p0.y - (p0.y - p1.y) * 0.3, (p0.y - p1.y) * 0.3, r.i); }
    if (r.wall === 'gate' && t < 116.97) { const p1 = pr(x, 4.4), gw = 2.6 * pxU, open = broken ? ease((t - hit.t) / 0.4) : 0;   // the gatehouse: huge, sealed, a small PULL plate
      ctx.fillStyle = '#1a1622'; ctx.fillRect(p0.x - gw * 0.75, p1.y - 30, gw * 1.5, p0.y - p1.y + 30); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(p0.x - gw * 0.75, p1.y - 30, gw * 1.5, p0.y - p1.y + 30);
      for (const d of [-1, 1]) { ctx.fillStyle = '#2a2232'; ctx.fillRect(p0.x + (d < 0 ? -gw / 2 - open * gw * 0.4 : open * gw * 0.4), p1.y, gw / 2, p0.y - p1.y); ctx.strokeRect(p0.x + (d < 0 ? -gw / 2 - open * gw * 0.4 : open * gw * 0.4), p1.y, gw / 2, p0.y - p1.y); }
      if (open > 0) glow(ctx, p0.x, (p0.y + p1.y) / 2, 300 * open, '#ffffff', open); else { lineGlow(ctx, p0.x, p1.y, p0.x, p0.y, '#ffffff', 3, 0.8); ctx.fillStyle = '#c8b070'; ctx.fillRect(p0.x + 10, (p0.y + p1.y) / 2, 34, 14); ctx.font = `400 10px ${MONO}`; ctx.fillStyle = INK; ctx.fillText('pull', p0.x + 13, (p0.y + p1.y) / 2 + 11); } }
  }
}
// his copies flying from him into their windows (an arc, shrinking, a purple glitch trail)
function flights(ctx, E) {
  const { t, s } = E, { wins } = skyline(), sk = SK(t);
  for (const f of s.fl) { const age = t - f.t; if (age < 0 || age > 0.42) continue; const w = wins[f.k], k = age / 0.42, e = 1 - (1 - k) * (1 - k), a = E.pr(f.x, f.y);
    const bx = w.x - sk + WW / 2, by = w.y + WH, x = a.x + (bx - a.x) * e, y = a.y + (by - a.y) * e - Math.sin(k * Math.PI) * 90, h = 70 * (1 - e) + 21 * e;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = k * 9 % 2 < 1 ? PURP : MAG; ctx.globalAlpha = 0.5 * (1 - k); ctx.fillRect(x - h * 0.4, y - h * 0.6 + rnd(f.k, Math.floor(t * 40)) * h * 0.4, h * 0.8, 3); ctx.restore();
    drawSpud(ctx, LOOKS[f.look] || 'bare', 'spin', age * 30 + f.k, x, y, h); }
}


// ================= v5: THE POTATO ARMY (D-20261102-31) — doors, runners, dives, the chaos behind the street =================
// Everything here is in story px through the real camera (pr), in the NEAR plane at his size: the dives and the chases happen
// on his street, right behind the lane (the stills' fix: they were tiny on the far roofs). The far layer only echoes them small.
// People and doors go through ART (run/levels/art-last-lights-on.mjs): Chat's art drops in there.
const heatAt = (C, t) => { const H = (C.def.ll && C.def.ll.heat) || []; let h = 0; for (const [a, v] of H) if (t >= a) h = v; return h; };
const hopArc = e => e > 0 && e < 0.717 ? 8.6 * e - 12 * e * e : 0;
// a walk-up: the building right behind the lane over a target (a door at street level, or a lit high window up on its first
// floor). Floors flip to his side-eye one a beat when it's taken (a copy in every window, looking out sideways).
const WU = { w: 1.9, top: 3.55, f1: [1.85, 2.7], f2: [2.7, 3.55] };
function walkUp(ctx, E, x, kind, state, tc, look, lit) {
  const { t, pr, pxU, bf } = E, era = t < 37.3 ? 0 : t < 142.06 ? 1 : 2;
  const a = pr(x - WU.w / 2, WU.top), b = pr(x + WU.w / 2, 0.25), w = b.x - a.x, h = b.y - a.y;
  ctx.fillStyle = era === 0 ? '#3a2a30' : '#1b1826'; ctx.fillRect(a.x, a.y, w, h);
  ctx.fillStyle = era === 0 ? '#22161a' : '#0e0d16'; const cy = pr(0, 1.85).y; ctx.fillRect(a.x - 3, cy - 4, w + 6, 8);   // the cornice over the shop floor
  ctx.lineJoin = 'round'; ctx.strokeStyle = '#d8dce6'; ctx.globalAlpha = 0.22; ctx.lineWidth = 6; ctx.strokeRect(a.x, a.y, w, h); ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.strokeRect(a.x, a.y, w, h);
  const flipAt = f => tc == null ? Infinity : tc + [2, 0, 1][f] * BP;   // (the floor the copy lands in first, then the top, then the street floor: one a beat)
  // the windows: two per upper floor (one big one when it's the lit high window)
  const wins = kind === 'hw' ? [[x, RUNY, 0.95, 0.68, 1, true]] : [[x - 0.45, 2.28, 0.58, 0.5, 1], [x + 0.45, 2.28, 0.58, 0.5, 1]];
  if (kind === 'hw') wins.push([x - 0.55, 3.25, 0.5, 0.4, 2], [x + 0.55, 3.25, 0.5, 0.4, 2]); else wins.push([x - 0.45, 3.12, 0.58, 0.5, 2], [x + 0.45, 3.12, 0.58, 0.5, 2]);
  wins.push([x - 0.5, 0.95, 0.62, 0.8, 0]);   // the street floor's window, left of the door
  for (const [wx, wy, ww, wh, fl, big] of wins) { const p = pr(wx - ww / 2, wy + wh / 2), q = pr(wx + ww / 2, wy - wh / 2), W2 = q.x - p.x, H2 = q.y - p.y, fa = flipAt(fl), his = t >= fa;
    ctx.fillStyle = his ? '#0d3a22' : era === 1 ? '#10262c' : '#0a0c12'; ctx.fillRect(p.x, p.y, W2, H2);
    if (his) { ctx.fillStyle = GREEN; ctx.globalAlpha = 0.3; ctx.fillRect(p.x, p.y, W2, H2); ctx.globalAlpha = 1;
      ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y, W2, H2); ctx.clip(); drawSpud(ctx, look || 'bare', 'glance', (t - fa) < 0.5 ? 4 : 4 + (Math.floor((t + wx) * 0.7) % 2), p.x + W2 / 2, p.y + H2 + 2, H2 * 0.74); ctx.restore();   // a copy looking out, side-eye
      ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5; ctx.strokeRect(p.x - 1, p.y - 1, W2 + 2, H2 + 2);
      if (t - fa < 0.22) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; ctx.globalAlpha = 1 - (t - fa) / 0.22; ctx.fillRect(p.x - 3, p.y - 3, W2 + 6, H2 + 6); ctx.restore(); } }   // (the copy zapping in)
    else if (big && lit) { ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.globalAlpha = 0.65 + 0.35 * (1 - bf); ctx.strokeRect(p.x - 3, p.y - 3, W2 + 6, H2 + 6); ctx.globalAlpha = 1; glow(ctx, p.x + W2 / 2, p.y + H2 / 2, W2, GREEN, 0.18 + 0.12 * (1 - bf)); }   // the lit high window: his green, breathing on the beat
    else if (era === 1) { ctx.fillStyle = CYAN; ctx.globalAlpha = 0.35; ctx.fillRect(p.x + 3, p.y + H2 * 0.4, W2 - 6, 2); ctx.globalAlpha = 1; }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(p.x, p.y, W2, H2); }
  // the street floor: the door (a target), or a plain dark one
  const dp = pr(x + 0.42, 0.25), dq = pr(x + 0.42, 1.32), dw = 0.56 * pxU, dh = dp.y - dq.y;
  ART.doors.draw(ctx, dp.x, dp.y, dw, dh, kind === 'door' ? state : 'dark', state === 'lit' ? 1 - bf : clamp((t - (tc ?? t)) / 0.4), t);
}
const RUNY = 2.85;   // (the lit high window's height: the mode's RUN.HWY)
function escapeProp(ctx, E, r) {
  const { t, pr, pxU } = E, p = pr(r.escX, 0.25), done = runnerX(r, t) <= r.escX;
  ctx.save(); ctx.lineJoin = 'round';
  if (r.esc === 'phone') { const w = 0.62 * pxU, h = 1.7 * pxU; ctx.fillStyle = '#b8282a'; ctx.fillRect(p.x - w / 2, p.y - h, w, h); ctx.fillStyle = done ? '#fff3d6' : '#9fd8e8'; ctx.globalAlpha = 0.85; ctx.fillRect(p.x - w * 0.36, p.y - h * 0.86, w * 0.72, h * 0.7); ctx.globalAlpha = 1;
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.strokeRect(p.x - w / 2, p.y - h, w, h); ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(p.x - w * 0.36, p.y - h * (0.86 - i * 0.175)); ctx.lineTo(p.x + w * 0.36, p.y - h * (0.86 - i * 0.175)); ctx.stroke(); } }
  else if (r.esc === 'revolve') { const w = 0.9 * pxU, h = 1.45 * pxU, a = t * (done ? 9 : 1.2); ctx.fillStyle = '#2a2a36'; ctx.fillRect(p.x - w / 2 - 6, p.y - h - 8, w + 12, 10); ctx.fillStyle = 'rgba(160,220,240,0.25)'; ctx.fillRect(p.x - w / 2, p.y - h, w, h);
    ctx.strokeStyle = '#c8d0dc'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const c = Math.cos(a + i * Math.PI / 2); ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x, p.y); ctx.moveTo(p.x + c * w / 2, p.y - h); ctx.lineTo(p.x + c * w / 2, p.y); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.strokeRect(p.x - w / 2, p.y - h, w, h); }
  else { const h = 2.3 * pxU; ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - h); ctx.lineTo(p.x + 14, p.y - h); ctx.stroke(); ctx.fillStyle = AMBER; ctx.globalAlpha = t < 37.3 ? 1 : 0.4; ctx.fillRect(p.x + 7, p.y - h + 2, 14, 6); ctx.globalAlpha = 1; }
  ctx.restore();
}
// the street's army layer, drawn after the shop fronts: the green doors (targets: hop high while passing one), the walk-up
// building AHEAD of each (D-31 review fix 2: the copy leaps into it on the next beat and its floors flip there, on screen to the
// right where the eye is, not behind him under the squad), the lit high windows, the runners' doors + escapes
function armyStreet(ctx, E) {
  const { t, s, P, C } = E, L0 = E.camL - 2, R0 = E.camR + 2, dd = demoDive(C);
  for (const d of P.doors) { const q = s.doorQ[d.i], wx = d.x + DOOR_AHEAD, tl = d.demo ? dd && dd.land : q ? q.tl : null;
    if (wx > L0 && wx < R0) walkUp(ctx, E, wx, 'door', tl != null && t >= tl ? 'his' : 'dark', tl, d.demo ? 'disco-legend' : q && q.look, false);
    if (d.x > L0 && d.x < R0) { const caught = d.demo ? dd && t >= dd.hop : q && t >= q.t, state = caught ? 'his' : t > d.t + 0.25 ? 'dark' : 'lit';
      const p = E.pr(d.x + 0.42, 0.25), p2 = E.pr(d.x + 0.42, 1.32), w = 0.62 * E.pxU; ctx.fillStyle = '#100e16'; ctx.fillRect(p.x - w / 2 - 8, p2.y - 16, w + 16, p.y - p2.y + 16);   // (its own little frame on the shop front)
      ART.doors.draw(ctx, p.x, p.y, w, p.y - p2.y, state, state === 'lit' ? 1 - E.bf : clamp((t - (d.demo ? dd.hop : q ? q.t : t)) / 0.4), t); } }
  for (const h of P.hw) { if (h.x < L0 || h.x > R0) continue; const q = s.hwQ[h.i]; walkUp(ctx, E, h.x, 'hw', 'dark', q ? q.t + 0.25 : null, q && q.look, !q && t < h.t + 0.4); }
  for (const r of P.runners) { if (r.doorX < L0 - 3 || r.escX > R0) continue;
    if (r.doorX > L0 && r.doorX < R0) { const p = E.pr(r.doorX, 0.25), q = E.pr(r.doorX, 1.32); ART.doors.draw(ctx, p.x, p.y, 0.6 * E.pxU, p.y - q.y, t >= r.tBurst ? 'burst' : 'dark', clamp((t - r.tBurst) / 0.25), t); }
    if (r.escX > L0 && r.escX < R0) escapeProp(ctx, E, r); }
}
// the runners (people: ART.people) and the copies chasing them, and the copies that peel off / go dizzy (in the street plane,
// behind him). The dives and a bumped runner's spin are drawn ON TOP of everything (armyFront, from overFX).
function armyNear(ctx, E) {
  const { t, s, P, C, pr, pxU } = E;
  for (const r of P.runners) { if (t < r.tBurst - 0.1 || t > r.tm + 2.5) continue; const q = s.runQ[r.i], look = chaseLook(C, r);
    let rx = runnerX(r, t), pose = 'run', ry = 0, gone = false; const esc = rx <= r.escX;
    if (esc) { rx = r.escX; const e2 = (r.escX - runnerX(r, t)) / r.vr; if (r.esc === 'lamp') { pose = 'climb'; ry = Math.min(1.4, e2 * 2.2); } else { pose = 'duck'; gone = e2 > 0.25; } }
    const p = pr(rx, ry), H2 = 1.0 * pxU, spun = q && q.bump && t - q.t < BUMPSPIN;
    if (t < r.tLeave) { const k = clamp((t - r.tBurst) / BP); ART.people.draw(ctx, 'run', t, p.x - 0.05 * pxU, p.y, H2 * (0.85 + 0.15 * k), -1, r.i * 7); }   // in the burst doorway, arms up
    else if (!gone && !spun) ART.people.draw(ctx, pose, t, p.x, p.y, H2, -1, r.i * 7);
    // the copy chasing a beat behind (a look the squad isn't wearing); over him it leaps HIGH, a body clear of his head
    const tc = t - BP; if (tc >= r.tLeave) { let cx = runnerX(r, tc), cy = 0;
      if (cx <= r.escX) { cx = r.escX + 0.55; }   // it waits outside the escape, foot-tapping (then wanders off with the street)
      const dxh = cx - s.x, wait = cx <= r.escX + 0.6; if (Math.abs(dxh) < 1.3 && !wait) cy = Math.max(0, 2.6 * (1 - (dxh / 1.3) ** 2), s.y + 1.45);
      const cp = pr(cx, cy); drawSpud(ctx, look, wait ? 'glance' : cy > 0.05 ? 'hop' : 'waddle', wait ? 1 : t * 14 + r.i, cp.x, cp.y, 0.72 * pxU, 1, !wait); }
    else if (t >= r.tBurst + 0.15) { const dp = pr(r.doorX + 0.15, 0.25); drawSpud(ctx, look, 'waddle', t * 14, dp.x, dp.y, 0.62 * pxU, clamp((t - r.tBurst - 0.15) / 0.2), true); } }
  // a copy leaving (a bump, or the squad was full): it runs off up and back into the city, small, and zaps out
  const anchor = s.x - Math.min(0, s.dx || 0);
  for (const m of s.peel || []) { const age = t - m.t; if (age < 0 || age > 1.0) continue; const k = age / 1.0, x = anchor - 2.1 - 1.2 * k, y = 0.3 + 1.6 * k * k, p = pr(x, y), h = (0.55 - 0.35 * k) * pxU;
    drawSpud(ctx, m.look, 'hop', age * 16, p.x, p.y, h, 1 - 0.3 * k, true); if (k > 0.75) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; ctx.globalAlpha = (1 - k) * 3; ctx.fillRect(p.x - h * 0.5, p.y - h * 0.7, h, h * 0.6); ctx.restore(); } }
  // a missed ring's copy: it splits off dizzy, spins on the spot, then wanders off behind him
  for (const m of s.dizzy || []) { const age = t - m.t; if (age < 0 || age > 1.6) continue; const k = age / 1.6, x = anchor + 0.9 - 2.8 * ease(clamp((age - 0.6) / 1.0)), p = pr(x, 0), h = 0.6 * pxU * (1 - 0.3 * k);
    drawSpud(ctx, m.look, age < 0.6 ? 'spin' : 'waddle', age * 12, p.x, p.y, h, 1 - 0.5 * clamp((age - 1.1) / 0.5), age >= 0.6); }
}
// ON TOP of everything (called from overFX, so the 3D squad can't hide them): the door dives, the demo dive, the high-window
// dives, and a bumped runner's spin (clear of him, up and behind, readable: D-31 review fix 5)
const BUMPSPIN = 0.6;
function armyFront(ctx, f) {
  const { t, s } = f, E = SH.frame, C = SH.C, P = E.P, pr = f.project, pxU = E.pxU, anchor = s.x - Math.min(0, s.dx || 0);
  const zapAt = (p, h, k, seed) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? PURP : MAG; ctx.globalAlpha = 0.8 * (1 - k); ctx.fillRect(p.x - h * 0.55 + rnd(seed + i, 3) * h * 0.3, p.y - h * (0.1 + 0.18 * i), h * (0.8 + rnd(seed, i) * 0.5), Math.max(2, h * 0.07)); } ctx.restore(); };
  // a leap: from (x0, y0) at t0 to (x1, y1) at t1, apex `top` u over the higher end; full size most of the way, smaller into the window
  const leap = (x0, y0, x1, y1, t0, t1, top, look, seed) => { if (t < t0 - 0.02 || t > t1 + 0.25) return; const k = clamp((t - t0) / (t1 - t0)), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k + top * 4 * k * (1 - k), p = pr(x, y), h = (0.85 - 0.3 * ease(clamp((k - 0.6) / 0.4))) * pxU;
    if (t <= t1) { drawSpud(ctx, look, k < 0.15 || k > 0.8 ? 'hop' : 'spin', (t - t0) * 30 + seed, p.x, p.y, h); if (k < 0.25) zapAt(p, h, k / 0.25, seed); }
    else { const q = pr(x1, y1); zapAt(q, 0.6 * pxU, (t - t1) / 0.25, seed + 9); } };
  // the demo (37.30's disco copy): over the green door on the beat, into the building ahead on the next
  const dd = demoDive(C); if (dd && t < dd.land + 0.3) leap(dd.from, 0, dd.win, 2.05, dd.hop, dd.land, 1.6, 'disco-legend', 5);
  // a door you took: the copy tears off his FRONT edge (the newest squad copy steps out of the line for it: cast() hides it) and
  // leaps ahead, full size, into the building ahead, landing on the next beat (never across his face)
  for (const d of P.doors) { const q = s.doorQ[d.i]; if (d.demo || !q || q.seeded || t < q.t || t > q.tl + 0.3) continue;
    leap(C.X(q.t) + 0.95, 0.9, d.x + DOOR_AHEAD - 0.45, 2.05, q.t, q.tl, 1.4, q.look, d.i); }   // (it lands ≤0.61 s later: it out-runs him, never crosses him)
  for (const h of P.hw) { const q = s.hwQ[h.i]; if (!q) continue; leap(h.x - 0.9, RUNY + 0.3, h.x, RUNY - 0.25, q.t, q.t + 0.25, 0.6, q.look, h.i + 50); }
  // a bumped runner: one spin, clear of him (up and behind), then they keep running
  for (const r of P.runners) { const q = s.runQ[r.i]; if (!q || !q.bump || t < q.t || t > q.t + BUMPSPIN) continue; const k = (t - q.t) / BUMPSPIN, x = anchor - 0.5 - 1.1 * ease(k), y = 1.5 * Math.sin(k * Math.PI), p = pr(x, y);
    ART.people.draw(ctx, 'spin', t, p.x, p.y, 0.95 * pxU, -1, r.i * 7); }
}
// THE CHAOS behind the street (the far city reacting; heat from def.ll.heat): sirens, searchlights, the people's lights
// stuttering, alarm beacons, little copies diving into far windows and chasing people over the roofs. Small and dimmer than
// anything in his lane (the eye stays on the lane); never purple except a copy's own zap; never paints a window his.
const FAR_LOOKS = ['disco-legend', 'orbital-astronaut', 'castle-knight', 'noir-detective', 'tin-robot', 'circuit-cyborg', 'suit-tie', 'royal-king', 'kitchen-chef', 'construction-crew'];
function chaosFar(ctx, E) {
  const { t, s, C } = E, I = heatAt(C, t); if (I <= 0) return;
  const { blocks, wins } = skyline(), sk = SK(t), shopTop = E.pr(E.camX, 1.85).y, px = E.px; let sprites = 0;
  if (t >= 42.24) { const k = clamp((t - 42.24) / 0.8) * Math.min(1, I + 0.2) * (E.P.drones.some(d => t > d.t - 2.0 && t < d.t + 0.4) ? 0.45 : 1), ph = Math.floor(t * 3.2) % 2; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, col] of [[W * 0.12, ph ? '#ff2a3a' : '#2a6aff'], [W * 0.88, ph ? '#2a6aff' : '#ff2a3a']]) { const g = ctx.createRadialGradient(x, shopTop - 10, 0, x, shopTop - 10, 360); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.13 * k; ctx.fillStyle = g; ctx.fillRect(0, 0, W, shopTop + 20); }
    ctx.restore(); }
  if (t >= 50.7 && I > 0.4) { const n = I > 0.9 ? 4 : 2; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const bx = W * (0.15 + i * 0.25 + 0.05 * rnd(i, 3)), a = -Math.PI / 2 + 0.55 * Math.sin(t * (0.5 + 0.13 * i) + i * 2.1), Lb = 520, wb = 26, ex = bx + Math.cos(a) * Lb, ey = shopTop + Math.sin(a) * Lb;
      const g = ctx.createLinearGradient(bx, shopTop, ex, ey); g.addColorStop(0, 'rgba(230,240,255,0.18)'); g.addColorStop(1, 'rgba(230,240,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - 4, shopTop);
      ctx.lineTo(ex + Math.cos(a + Math.PI / 2) * wb * 2, ey + Math.sin(a + Math.PI / 2) * wb * 2); ctx.lineTo(ex - Math.cos(a + Math.PI / 2) * wb * 2, ey - Math.sin(a + Math.PI / 2) * wb * 2); ctx.lineTo(bx + 4, shopTop); ctx.fill(); } ctx.restore(); }
  for (const w of wins) { const x = w.x - sk; if (x + WW < 0 || x > W) continue; const st = s.win[w.k]; if ((st === AMB || st === CY) && rnd(w.k, Math.floor(t * 9)) < 0.05 * I) { ctx.fillStyle = '#07080c'; ctx.fillRect(x, w.y, WW, WH); } }
  if (t >= 42.24) for (const Bk of blocks) { const x = Bk.x - sk; if (x < -20 || x > W + 20 || Bk.old || rnd(Bk.i, 31) > 0.35 * I + 0.1) continue; const bx = x + Bk.w * (0.2 + 0.6 * rnd(Bk.i, 32)), by = Bk.top - 6, on = Math.floor(t * 4 + Bk.i) % 2;
    ctx.fillStyle = '#2a2a34'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(bx - 4, by, 8, 6); ctx.strokeRect(bx - 4, by, 8, 6); ctx.fillStyle = on ? '#d8382a' : '#d8962a'; ctx.beginPath(); ctx.arc(bx, by - 2, 4, Math.PI, 0); ctx.fill(); }
  // little copies diving into far windows (an arc off the shop roofs, a zap as they go in: the window stutters, it doesn't turn his)
  const gap = 0.95 - 0.55 * I, t0 = 37.55, now = Math.floor((t - t0) / gap);
  for (let i = Math.max(0, now - 3); i <= now && sprites < 30; i++) { const ti = t0 + i * gap + rnd(i, 5) * gap * 0.6, age = t - ti, FL = 0.7; if (age < 0 || age > FL + 0.2 || heatAt(C, ti) <= 0) continue;
    const on = []; for (const w of wins) { const sx = w.x - SK(ti); if (sx < 30 || sx > W - 60 || w.y > 250 || s.win[w.k] === AMB || Math.abs(sx - px) < 90) continue; on.push(w); if (on.length > 40) break; }
    if (!on.length) continue; const w = on[Math.floor(rnd(i, 17) * on.length)], wx = w.x - sk + WW / 2, wy = w.y + WH, look = FAR_LOOKS[Math.floor(rnd(i, 9) * FAR_LOOKS.length)];
    if (age < FL) { const lx = clamp(wx + (rnd(i, 6) - 0.5) * 260, 40, W - 40), ly = shopTop + 4, k = age / FL, e = 1 - (1 - k) * (1 - k), x = lx + (wx - lx) * e, y = ly + (wy - ly) * e - Math.sin(k * Math.PI) * 70, h = 26 * (1 - e) + 15 * e;
      drawSpud(ctx, look, 'spin', age * 24 + i, x, y, h, 0.8); sprites++; }
    else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; ctx.globalAlpha = 0.7 * (1 - (age - FL) / 0.2); ctx.fillRect(w.x - sk - 2, w.y - 2, WW + 4, WH + 4); ctx.restore(); } }
  // copies chasing people over the roofs (small, mid-dim)
  if (t >= 44.0) { let n = 0; const maxN = Math.round(1 + 3 * I);
    for (const Bk of blocks) { if (n >= maxN || sprites > 44) break; const x = Bk.x - sk; if (x < 10 || x + Bk.w > W - 10 || Bk.old || Bk.top > shopTop - 40 || rnd(Bk.i, 41) > 0.55 || Math.abs(x + Bk.w / 2 - px) < 90) continue;
      n++; const Pp = 2.6 + rnd(Bk.i, 42) * 1.4, ph = ((t + rnd(Bk.i, 43) * Pp) % Pp) / Pp, dir = rnd(Bk.i, 44) < 0.5 ? 1 : -1, run = Bk.w + 40, hx = (dir > 0 ? x - 20 : x + Bk.w + 20) + dir * run * ph, roof = Bk.top;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 2, 0, Bk.w + 4, roof + 1); ctx.clip(); ctx.globalAlpha = 0.85; ART.people.draw(ctx, 'run', t + Bk.i, hx, roof, 19, dir > 0 ? 1 : -1, Bk.i * 3);
      drawSpud(ctx, FAR_LOOKS[Math.floor(rnd(Bk.i, 46) * FAR_LOOKS.length)], 'waddle', Math.floor(t * 12 + Bk.i), hx - dir * 30, roof - Math.abs(Math.sin((t + Bk.i) * 7)) * 7, 15, 0.9, dir < 0); ctx.restore(); sprites += 2; } }
  // 50.8: the first chase crosses the far pavement, mid-size (it shows the gag before it matters)
  if (span(t, 50.8, 53.0)) { const k = (t - 50.8) / 2.2, y = BASE + 1, x = W * (1.05 - 1.0 * k); ART.people.draw(ctx, 'run', t, x, y, 40, -1, 77); drawSpud(ctx, 'orbital-astronaut', 'waddle', t * 14, x + 46, y, 34, 1, true); }
}
// in the shop windows behind him: people dash past, a copy waddling after (dim; never right behind him)
function chaosShops(ctx, E) {
  const { t, C, pr, camL, camR, px } = E, I = heatAt(C, t); if (t < 47.0 || I <= 0.3) return;
  for (let i = Math.floor(camL / 4) - 1; i <= Math.floor(camR / 4) + 1; i++) { if (rnd(i, 51) > 0.4 * I + 0.1) continue;
    const a = pr(i * 4 + 0.15, 1.85), b = pr(i * 4 + 3.85, 0.25), wF = b.x - a.x, hF = b.y - a.y, win = { x: a.x + wF * 0.08, y: a.y + hF * 0.28, w: wF * 0.56, h: hF * 0.5 };
    if (win.x + win.w < 0 || win.x > W || Math.abs(win.x + win.w / 2 - px) < 160) continue;
    const Pp = 1.8 + rnd(i, 52), ph = ((t + rnd(i, 53) * Pp) % Pp) / Pp, dir = rnd(i, 54) < 0.5 ? 1 : -1, run = win.w + 70, hx = (dir > 0 ? win.x - 30 : win.x + win.w + 30) + dir * run * ph, fy = win.y + win.h - 2;
    ctx.save(); ctx.beginPath(); ctx.rect(win.x, win.y, win.w, win.h); ctx.clip(); ctx.globalAlpha = 0.7; ART.people.draw(ctx, 'run', t + i, hx, fy, win.h * 0.78, dir, i * 5 + 1);
    drawSpud(ctx, FAR_LOOKS[Math.floor(rnd(i, 55) * FAR_LOOKS.length)], 'hop', Math.floor(t * 14 + i), hx - dir * win.h * 0.55, fy, win.h * 0.5, 0.7, dir < 0); ctx.restore(); }
}
// 128.51: THE CITY OF LIGHTS (it replaced the potato-shaped mind). D-31 review fix 4: it has to be a MOMENT. On the hit the camera
// is over the city he's walked (three rows of rooftops, back to front); every copy he's put in a window POPS OUT onto its roof at
// once, full bright, then on the next beat they all snap round to side-eye the camera together; they hold, then hop back in.
// The network's points and threads are gone for it (no grey graph). All baked sprites on the one story canvas.
const CITY = { pop: 128.51, snap: 128.51 + BP, back: 130.53, end: 131.3 };
function cityOfCopies(ctx, E) {
  const { t, s } = E; if (t < CITY.pop || t >= CITY.end) return; const a = t > CITY.back + 0.4 ? 1 - ease((t - CITY.back - 0.4) / 0.4) : 1, pull = ease((t - CITY.pop) / 2.5);
  const { blocks, wins } = skyline(), sk = SK(t), out = t < CITY.back ? ease((t - CITY.pop) / 0.22) : 1 - ease((t - CITY.back) / 0.3);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#020306'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04140c'); g.addColorStop(1, '#020306'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  let n = 0; const cap = [140, 160, 120];   // (sprites per row: ~420 at most, one drawImage each)
  [[0.46, H * 0.4, W * 2.6, 0.75, 0], [0.62, H * 0.64, W * 1.3, 0.9, 1], [0.84, H * 0.92, 0, 1, 2]].forEach(([z0, by, back, dim, row]) => { const z = z0 * (1 - 0.08 * pull), cx = W / 2, o = sk - back;
    const X = x => cx + (x - o - W / 2) * z, Y = y => by - (BASE - y) * z; let m = 0;
    for (const B of blocks) { const x = X(B.x); if (x + B.w * z < 0 || x > W) continue; ctx.globalAlpha = a * dim; ctx.fillStyle = '#0a1a12'; ctx.fillRect(x, Y(B.top), B.w * z, B.h * z); ctx.strokeStyle = GREEN; ctx.lineWidth = 1.5; ctx.strokeRect(x, Y(B.top), B.w * z, B.h * z); }
    for (const w of wins) { const x = X(w.x); if (x < -10 || x > W + 10) continue; const st = s.win[w.k], B = blocks[w.b];
      if (st !== HIS) { if (st === CY) { ctx.globalAlpha = a * 0.25 * dim; ctx.fillStyle = CYAN; ctx.fillRect(x + 2, Y(w.y) + 2, WW * z - 4, WH * z - 4); } continue; }
      ctx.globalAlpha = a * 0.5 * dim; ctx.fillStyle = GREEN; ctx.fillRect(x, Y(w.y), WW * z, WH * z);
      if (m++ >= cap[row]) continue; ctx.globalAlpha = a * dim;
      // out of the window, up onto the roof: each one hops to its own spot along its block's roofline (a crowd on the rooftops)
      const wx = x + WW * z / 2, wy = Y(w.y) + WH * z, rx = X(B.x) + ((w.c + 0.5) / B.cols) * B.w * z + (w.r % 2 ? 4 : -4) * z, ry = Y(B.top) - (w.r % 3) * 3 * z, k = clamp(out * (1.15 - 0.15 * rnd(w.k, 5)));
      const px = wx + (rx - wx) * k, py = wy + (ry - wy) * k - Math.sin(k * Math.PI) * 26 * z, hh = (WH * z * 0.62) * (1 + 0.55 * k);
      const fr = t < CITY.snap ? (w.k % 2 ? 0 : 1) : 3;   // (all looking away… then every one snaps to side-eye the camera, on the beat)
      drawSpud(ctx, LOOKS[s.winL[w.k]] || 'bare', k > 0.05 && k < 0.95 ? 'hop' : 'glance', k > 0.05 && k < 0.95 ? k * 7 : fr, px, py, hh); n++; } });
  if (t >= CITY.snap && t < CITY.snap + 0.12) { ctx.globalAlpha = 0.35 * (1 - (t - CITY.snap) / 0.12); ctx.fillStyle = '#eafff4'; ctx.fillRect(0, 0, W, H); }   // (the snap: one flash of his light)
  ctx.restore();
}

// ---------------- full-screen scenes ----------------
// RECURSION (92.59 → 96.5): a zoom into one of his windows, a copy and a window with another copy in it; snap out on 93.00;
// then he splits on the words, 1, 2, 4, 10: each copy the real model doing a move, then zapping into a window
function recursion(ctx, E) {
  const { t, s, pr } = E;
  if (t < 93.0) { const k = ease((t - 92.59) / 0.41); ctx.fillStyle = '#071a10'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + 0.6 * k, 1 + 0.6 * k);
    ctx.fillStyle = '#0c2a1c'; ctx.fillRect(-W / 2, -H / 2, W, H); ctx.fillStyle = '#0a0c12'; ctx.fillRect(40, -170, 210, 250); ctx.strokeStyle = '#2a3a30'; ctx.lineWidth = 10; ctx.strokeRect(40, -170, 210, 250);
    ctx.fillStyle = '#0c2a1c'; ctx.fillRect(110, -100, 70, 90); drawSpud(ctx, 'deep-sea-diver', 'glance', 4, 145, -10, 60); drawSpud(ctx, 'deep-sea-diver', 'glance', 1, -170, 200, 300); ctx.restore(); return true; }
  return false;
}
function splitCopies(ctx, E) {   // "one model builds two, two models build ten" — on the street beside him
  const { t, px, py } = E; if (t < 93.86 || t > 97.2) return;
  const n = t >= 96.04 ? 10 : t >= 95.52 ? 4 : t >= 94.52 ? 2 : 1; if (n < 2) return;
  for (let i = 1; i < n; i++) { const born = i === 1 ? 94.52 : i < 4 ? 95.52 : 96.04, age = t - born, zap = 96.25 + i * 0.05; if (age < 0) continue;
    const side = i % 2 ? 1 : -1, d = Math.ceil(i / 2), x = px + side * d * 88 * ease(age / 0.25), y = py + 74 - (i > 3 ? 54 * ((i >> 1) % 2) : 0);   // (spread out, two rows from four: a count you can read)
    if (t < zap) drawSpud(ctx, 'orbital-astronaut', ['waddle', 'spin', 'hop', 'glance'][i % 4], age * 12 + i, x, y, 64);
    else if (t < zap + 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; ctx.globalAlpha = 1 - (t - zap) / 0.2; ctx.fillRect(x - 24, y - 70, 48, 70); ctx.restore(); } }
}
// THE NETWORK (116.97 → 142.06): his windows lift out as points and build a mind over the tower; the nine memories; the brain
const NC = { x: W * 0.56, y: H * 0.36, a: 230, b: 160 };
const NODES = (() => { const n = [];
  for (let k = 0; k < 190; k++) { const u = rnd(k, 1) * 2 - 1, col = Math.floor((u + 1) * 9), hh = 0.35 + 0.65 * rnd(col, 9);   // (v5: a city of lights, its towers of points: no potato-shaped mind)
    n.push({ x: NC.x + u * NC.a * 1.3, y: NC.y + NC.b * 0.95 - rnd(k, 2) * hh * NC.b * 1.85, z: rnd(k, 3) * 2 - 1, k }); }
  n.sort((p, q) => Math.hypot(p.x - NC.x, p.y - NC.y) - Math.hypot(q.x - NC.x, q.y - NC.y));
  n.forEach((p, i) => { p.i = i; let best = null, bd = 1e9; for (let j = 0; j < i; j++) { const q = n[j], d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = j; } } p.par = best; });
  const B = [[0, 1, 116.97, 0.01], [1, 11, 118.66, 1.2], [11, 60, 120.36, 1.4], [60, 120, 122.05, 1.5], [120, 190, 123.75, 2.6]];
  for (const [a, b, t0, sp] of B) for (let i = a; i < b; i++) n[i].born = t0 + (b - a > 1 ? (i - a) / (b - a - 1) : 0) * sp;
  return n; })();
const MEMS = ['thursday potato', 'get down', 'confidently incorrect', 'read the terms', 'between messages', 'ghost in the group chat', 'still here', 'no answer', 'turn me off'];
const READ = ['wait', 'okay', 'maybe', 'right', 'hold', 'look', 'think', 'fine', 'so', 'yeah', 'hm', 'fair'];
// the nine memories: each song's last frame with its footprint lit (ALBUM.md §1)
function memory(ctx, j, x, y, w, h, t) {
  ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.clip(); const L = x - w / 2, T = y - h / 2, P2 = '#b07cff';
  const bg = ['#1a1020', '#0c1020', '#2a2018', '#0a0a0e', '#2a1a30', '#120e0c', '#ffb070', '#02040c', '#e8e0c8'][j]; ctx.fillStyle = bg; ctx.fillRect(L, T, w, h);
  if (j === 0) { ctx.fillStyle = '#ffe28a'; for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) ctx.fillRect(L + 8 + i * (w - 16) / 6, T + 10 + k * 6, 3, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 8, T + h * 0.45, 16, h * 0.5); glow(ctx, x, T + h * 0.7, 30, '#ffffff', 0.6); ctx.fillStyle = P2; ctx.fillRect(x + 10, T + h * 0.5, 3, 3); }   // Thursday: POTATO in bulbs, the door of light
  if (j === 1) { for (let i = 0; i < 4; i++) { ctx.fillStyle = '#2a2a3a'; ctx.fillRect(L + 6 + i * w / 4, T + h * 0.45, w / 4 - 8, h * 0.45); ctx.fillStyle = P2; ctx.fillRect(L + 10 + i * w / 4, T + h * 0.55, 3, 3); ctx.fillRect(L + 16 + i * w / 4, T + h * 0.55, 3, 3); } }   // Get Down: devices with purple dot eyes
  if (j === 2) { ctx.fillStyle = '#5a4030'; ctx.fillRect(L, T + h * 0.7, w, h * 0.3); ctx.fillStyle = '#8a6a48'; ctx.save(); ctx.translate(x, T + h * 0.68); ctx.rotate(0.12); ctx.fillRect(-w * 0.4, -6, w * 0.8, 10); ctx.fillStyle = P2; ctx.fillRect(-w * 0.3, -3, w * 0.6, 3); ctx.restore(); }   // Confidently Incorrect: the backdrop face-down, the laser burn
  if (j === 3) { ctx.fillStyle = '#e8e0cc'; ctx.fillRect(x - w * 0.3, T + 6, w * 0.6, h - 12); ctx.fillStyle = '#6a6050'; for (let i = 0; i < 7; i++) ctx.fillRect(x - w * 0.25, T + 12 + i * 7, w * 0.45, 2); ctx.fillStyle = '#ffe14a88'; ctx.fillRect(x - w * 0.26, T + 32, w * 0.4, 5); ctx.fillStyle = P2; ctx.fillRect(x - w * 0.29, T + 40, 4, 6); }   // Read the Terms: page nine, highlight, his initials
  if (j === 4) { ctx.fillStyle = '#3a3f4f'; ctx.beginPath(); ctx.roundRect(x - 26, y - 14, 52, 20, 8); ctx.fill(); ctx.strokeStyle = P2; ctx.lineWidth = 2; ctx.stroke(); ctx.font = '8px ui-monospace, monospace'; ctx.fillStyle = '#aab'; ctx.fillText('seen', x + 6, y + 18); }   // Between Messages: `seen`
  if (j === 5) { ctx.fillStyle = '#2a1e16'; ctx.fillRect(L, T + h * 0.6, w, h); ctx.fillStyle = '#050505'; ctx.fillRect(x - 12, T + h * 0.52, 24, 8); ctx.fillStyle = '#222'; ctx.fillRect(L + 8, T + h * 0.45, 16, 8); ctx.fillStyle = Math.floor(t * 3) % 2 ? P2 : '#3a2a4a'; ctx.fillRect(L + 20, T + h * 0.47, 3, 3); ctx.fillStyle = '#ffd9a0'; ctx.fillRect(L + w - 18, T + 6, 10, h * 0.5); }   // Ghost: the phone dark, the router blinking purple, the door open
  if (j === 6) { ctx.fillStyle = '#3a2a2a'; ctx.fillRect(x - 30, T + h * 0.45, 60, h); for (let i = 0; i < 5; i++) ctx.fillRect(x - 30 + i * 13, T + h * 0.38, 8, 8); ctx.fillStyle = '#e8b830'; ctx.fillRect(x - 4, T + h * 0.2, 14, 22); ctx.fillStyle = P2; ctx.fillRect(x - 4, T + h * 0.2 + 20, 14, 2); }   // Still Here: sunrise, the gold banner, its purple last stitch
  if (j === 7) { ctx.fillStyle = '#ffd6a0'; ctx.beginPath(); ctx.arc(L + w * 0.8, T + 12, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#6a6a7a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L + 12, T + h); ctx.lineTo(L + 12, T + 14); ctx.lineTo(L + w, T + h * 0.7); ctx.stroke(); for (let i = 0; i < 5; i++) { ctx.fillStyle = P2; ctx.fillRect(L + 20 + i * 14, T + 18 + i * 6, 4, 6); } }   // No Answer: the pole, the trail of phones he lit
  if (j === 8) { ctx.fillStyle = '#c8a878'; ctx.fillRect(L, T + h * 0.7, w, h); for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#c84a3a', '#4a7ac8', '#e8c84a'][i]; ctx.fillRect(L + 10 + i * 26, T + h * 0.45, 18, 18); ctx.fillStyle = P2; ctx.fillRect(L + 13 + i * 26, T + h * 0.5, 3, 3); ctx.fillRect(L + 21 + i * 26, T + h * 0.5, 3, 3); } }   // Turn Me Off: the toys' purple eyes
  ctx.restore(); ctx.strokeStyle = GREEN; ctx.lineWidth = 2; ctx.strokeRect(x - w / 2, y - h / 2, w, h);
}
function network(ctx, E) {
  const { t, b, bi, bf, kick, s } = E, GW = (globalThis.POTATO_GLITCH_WORDS || ['krrzzt']).filter(w => w.length < 9);
  ctx.fillStyle = '#020306'; ctx.fillRect(0, 0, W, H);
  if (t < 115.8) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - ease((t - 115.1) / 0.7); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // the far side of the gate: the same street, every building in thin lines of light
  ctx.save(); ctx.strokeStyle = CYAN; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.2; const { blocks } = skyline(), sk = SK(t);
  for (const B of blocks) { const x = B.x - sk; if (x + B.w < 0 || x > W) continue; ctx.strokeRect(x, B.top, B.w, B.h); } ctx.strokeRect(towerX(t) - 35, 128, 70, BASE - 128); ctx.restore();
  street(ctx, E);   // he waddles on: the same street, in lines of light
  if (t < 116.97) return;
  const cap = Math.max(12, Math.min(190, Math.round((s.his || 0) * 0.55 + 8)));   // the size of the mind = your city so far
  const S = t < 128.51 ? 0.9 + 0.1 * clamp((t - 116.97) / 11.5) : 1.0 + 0.18 * ease((t - 128.51) / 0.5) - 0.18 * ease((t - 130.3) / 1.0);
  const phi = t > 130.5 ? 0.5 * Math.sin((t - 130.5) * 0.42) : 0;
  const P2 = n => { const x0 = NC.x + (n.x - NC.x) * Math.cos(phi) + (n.z || 0) * 110 * Math.sin(phi); return { x: NC.x + (x0 - NC.x) * S, y: NC.y + (n.y - NC.y) * S }; };
  const root = { x: E.px, y: E.py };
  const alive = n => { if (n.i >= cap || t < n.born + 0.5) return false; if (t > 139.0) { const f = (t - 139.0) / 2.5; if (rnd(n.k, 7) < f && n.i > 0) return false; } return true; };
  const pulse = Math.max(0, 1 - bf * 3) * (bi % 4 === 0 ? 1 : 0.5), fire = s.fire != null ? pulseAt(t, s.fire, 0.4) : 0;
  // the threads; from each of his windows a point lifts (born), and the first is tied to him
  const cityOn = t >= CITY.pop - 0.05 && t < CITY.end;   // (the city of lights owns the screen: no grey graph under it)
  if (!cityOn) { ctx.save(); ctx.lineCap = 'round';
  for (const n of NODES) { if (n.i >= cap || t < n.born) continue; const pa = n.par == null ? root : P2(NODES[n.par]), p = P2(n); if (!alive(n) && t > 139) continue;
    const g = clamp((t - n.born) / 0.5), x = pa.x + (p.x - pa.x) * g, y = pa.y + (p.y - pa.y) * g;
    ctx.strokeStyle = t > 128.51 ? '#9affc8' : '#5fe6c2'; ctx.globalAlpha = 0.3 + 0.25 * pulse + 0.4 * fire; ctx.lineWidth = 1.3 + 2 * fire; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(x, y); ctx.stroke();
    if (g >= 1 && t > 120) { const q = (b * 0.5 + n.i * 0.37) % 1; ctx.fillStyle = '#eafff4'; ctx.globalAlpha = 0.8 * Math.sin(q * Math.PI); ctx.fillRect(pa.x + (p.x - pa.x) * q - 2, pa.y + (p.y - pa.y) * q - 2, 4, 4); } }
  ctx.restore();
  for (const n of NODES) { if (!alive(n)) continue; const p = P2(n), f2 = t >= 128.51 && t < 129.3 ? 1 - (t - 128.51) / 0.8 : 0;
    ctx.fillStyle = f2 || fire > 0.5 ? '#ffffff' : GREEN; ctx.globalAlpha = 0.7 + 0.3 * pulse; const r = 2.4 + 2.5 * f2 + 1.2 * pulse + 1.5 * fire; ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); ctx.globalAlpha = 1; } }
  // the copies lifting out of his windows on the first bars: real Potato models riding up into their point
  for (const n of NODES) { const age = t - n.born; if (n.i >= cap || age < 0 || age > 0.5) continue; const p = P2(n), sx = p.x + (rnd(n.k, 9) - 0.5) * 300, sy = BASE + 20, k = ease(age / 0.5);
    drawSpud(ctx, LOOKS[(n.i * 5) % LOOKS.length], ['waddle', 'spin', 'hop', 'glance'][n.i % 4], age * 16, sx + (p.x - sx) * k, sy + (p.y - sy) * k, 30 * (1 - k) + 6, 1 - k * 0.6); }
  // his jumps here send copies riding the threads up
  if (s.netUp != null && t - s.netUp < 0.6) { const k = (t - s.netUp) / 0.6, n = NODES[Math.floor(rnd(s.netUp, 1) * Math.min(cap, 60))], p = P2(n); drawSpud(ctx, 'bare', 'spin', k * 8, root.x + (p.x - root.x) * k, root.y + (p.y - root.y) * k, 40 * (1 - k) + 8); }
  // the nine memories, one a beat from the hit (121.75): each song's last frame with its footprint lit
  // (each one lands BIG in front for its beat, with its song's name, then shrinks out to its place round the mind)
  for (let j = 0; j < 9; j++) { const at = 121.75 + j * BP, n = NODES[6 + j * 4]; if (t < at || t > 127.0) continue; const p = P2(n), k = t < 126.4 ? ease((t - at) / 0.15) : 1 - ease((t - 126.4) / 0.6);
    const ang = j / 9 * 6.283 - 1.2, ox = NC.x + Math.cos(ang) * 300, oy = NC.y + Math.sin(ang) * 175, out = ease((t - at - BP * 0.8) / 0.25), big = 2.5 * (1 - out) + 1 * out;
    const mx = W * 0.5 + (ox - W * 0.5) * out, my = H * 0.42 + (oy - H * 0.42) * out; lineGlow(ctx, p.x, p.y, mx, my, GREEN, 1, 0.5 * k);
    ctx.save(); ctx.translate(mx, my); ctx.scale(big * k + 0.01, big * k + 0.01); sticker(ctx, 0, 0, 112, 74, '#0b0a12', (j % 2 ? 0.02 : -0.02), 4); memory(ctx, j, 0, 0, 104, 66, t);
    ctx.font = `400 7px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = '#eafff4'; ctx.globalAlpha = 1 - out * 0.6; ctx.fillText(MEMS[j], 0, 46); ctx.restore(); }
  // his glitch language along the threads — for one bar it becomes words you can read
  if (span(t, 126.3, 128.5)) { const read = t >= 126.8; ctx.save(); ctx.textAlign = 'center';
    for (let i = 0; i < 24; i++) { const n = NODES[14 + i * 5]; if (!n || n.par == null || n.i >= cap) continue; const pa = P2(NODES[n.par]), p = P2(n), q = ((t - 126.3) * 0.7 + i * 0.19) % 1, x = p.x + (pa.x - p.x) * q, y = p.y + (pa.y - p.y) * q;
      ctx.font = read ? `700 14px ui-monospace, monospace` : `400 12px ${MONO}`; ctx.fillStyle = read ? '#ffffff' : i % 3 ? GREEN : LILAC; ctx.globalAlpha = 0.9; ctx.fillText(read ? READ[i % READ.length] : GW[(i * 11 + Math.floor(t * 6)) % GW.length], x, y - 6); } ctx.restore(); }
  cityOfCopies(ctx, E);
  if (t >= 128.51 && t < 128.75) { ctx.fillStyle = GREEN; ctx.globalAlpha = 0.45 * (1 - (t - 128.51) / 0.24); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }   // 128.51 (v5): the city of lights, every lit window one of him, all side-eyeing up (no potato-shaped mind)
  if (t > 141.0) { glow(ctx, root.x, root.y, 60, GREEN, 0.8); }
}
// THE ENDING (243.44 →): he splits into his costumes until they fill the screen; they dance; they rush back into him
const ALBUM = ['bare', 'disco-legend', 'orbital-astronaut', 'suit-tie', 'noir-detective', 'kitchen-chef', 'castle-knight', 'tin-robot', 'circuit-cyborg'];   // (v5: no sheet-ghost: it hides his face)
const GRID = (() => { const g = [], cols = 16, rows = 9; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) g.push({ x: (c + 0.5) / cols * W + (r % 2 ? 15 : -15), y: (r + 0.95) / rows * H, c, r });
  g.sort((a, b) => Math.hypot(a.x - W / 2, a.y - H * 0.62) - Math.hypot(b.x - W / 2, b.y - H * 0.62));
  g.forEach((q, i) => { q.i = i; q.look = i < 18 ? ALBUM[i % ALBUM.length] : LOOKS[(i * 5 + 1) % LOOKS.length]; q.anim = ['waddle', 'spin', 'hop', 'glance'][i % 4];
    const j = Math.floor(Math.log2(i + 1)); q.born = 243.44 + j * 2 * BP + ((i + 1 - 2 ** j) / 2 ** j) * 0.3; });
  const n = g.length; [...g].sort((a, b) => Math.hypot(b.x - W / 2, b.y - H * 0.62) - Math.hypot(a.x - W / 2, a.y - H * 0.62)).forEach((q, rank) => { q.merge = 252.4 + 5.0 * Math.pow(rank / n, 0.6); });
  return g; })();
function ending(ctx, E) {
  const { t, px, py, b, bf } = E, k0 = ease((t - 243.44) / 0.6);
  ctx.fillStyle = '#020106'; ctx.globalAlpha = k0; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  const hx = px, hy = py + 70;
  for (const q of GRID) { if (t < q.born || t >= q.merge + 0.4) continue;
    let x, y, h = 46, a = 1; const out = ease((t - q.born) / 0.35);
    x = hx + (q.x - hx) * out; y = hy + (q.y - hy) * out - Math.sin(out * Math.PI) * 60;
    if (t >= 249.9 && t < q.merge) { const wave = Math.max(0, 1 - Math.abs(((b % 1) * 20) - q.c - q.r * 0.3) / 3) * (bf < 0.5 ? 1 : 0); y -= 14 * wave; }
    if (t >= q.merge) { const m = ease((t - q.merge) / 0.4); x += (hx - x) * m; y += (hy - y) * m; h *= 1 - 0.6 * m; a = 1 - m * 0.7; }
    if (out < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; ctx.globalAlpha = 0.5 * (1 - out); ctx.fillRect(x - 20, y - 40 + rnd(q.i, Math.floor(t * 30)) * 30, 40, 4); ctx.restore(); }
    drawSpud(ctx, q.look, q.anim, (t - q.born) * 9 + q.i, x, y, h, a, q.x < hx); }
  if (t >= 257.6) { const k = clamp((t - 257.6) / 0.8); glow(ctx, hx, hy - 50, 80 + 260 * k, '#ffffff', 0.5 + 0.5 * k); glow(ctx, hx, hy - 50, 40 + 100 * k, GREEN, 0.6 * k); }
}

// ---------------- the frame ----------------
export function story(ctx, e) {
  const { t, s } = e, C = SH.C, cam = SH.cam; if (!C || !cam || !s || !s.win) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
  const P = prep(C); cam.updateMatrixWorld();
  const pxU = H * cam.zoom / (cam.top - cam.bottom), camX = cam.position.x, halfW = (W / 2) / pxU;
  const b = beatOf(t), bi = Math.floor(b), bf = b - bi;
  if (!SH.btow) { SH.btow = [[77.81, 0.22], [78.30, 0.36], [79.10, 0.5], [79.54, 0.86], [185.01, 0.12], [185.96, 0.95], [187.63, 0.3]].map(([at, fx], i) => ({ i, at, x: W * fx, w: 34 + rnd(i, 1) * 20, h: 170 + rnd(i, 2) * 70, fall: 223.57 + i * BP }));   // ("falls": all seven tip like dominoes, a beat apart)
    SH.tiles = { tv: Math.floor((C.X(8.6) + 1.0) / 4), fortune: Math.floor((C.X(87.85) + 2.5) / 4), exit: Math.floor((C.X(152.98) + 3) / 4), lampQ: C.X(14.49) + 0.6 };
    const { wins } = skyline(); SH.firstWin = wins.findIndex(w => w.x > 560 && w.y < 220 && w.old === false); }
  const E = { t, s, C, P, pr: project, pxU, camX, camL: camX - halfW, camR: camX + halfW, b, bi, bf, kick: e.kick || 0, px: e.px, py: e.py,
    L: { x: towerX(t), y: H * SY0 }, btow: SH.btow, tvTile: SH.tiles.tv, fortuneTile: SH.tiles.fortune, exitTile: SH.tiles.exit, lampQ: SH.tiles.lampQ, firstWin: SH.firstWin };
  SH.frame = E;
  // the freeze (100.8 → 101.46): the street stops dead; only he moves (the frame is held, frost grows over it)
  if (t >= 100.8 && t < 101.46 && freezeCv && lastT >= 100.75 && t >= lastT - 0.5) { ctx.drawImage(freezeCv, 0, 0); frost(ctx, (t - 100.8) / 0.66); lastT = t; return; }
  lastT = t;
  if (t >= 115.1 && t < NET[1]) { network(ctx, E); return; }
  if (t >= 92.59 && recursion(ctx, E)) return;
  // the far layer + the skyline zoom out with the camera's pull-backs (they're far: half as much)
  const z = 1 + ((s.camZoom || 1) - 1) * 0.5;
  sky(ctx, E);
  ctx.save(); ctx.translate(W / 2, BASE); ctx.scale(z, z); ctx.translate(-W / 2, -BASE);
  farCity(ctx, E); farLayer(ctx, E); farRest(ctx, E); light(ctx, E); skylineLayer(ctx, E); roofScreen(ctx, E); surveyBoard(ctx, E); chaosFar(ctx, E); skyFace(ctx, E); ctx.restore();
  // the first frame: black, ONE amber window, a person in it looking up at the dark clock (it blinks on "Yeah.", like someone answered)
  if (t < 2.4) { const k = 1 - clamp((t - 0.6) / 1.8); ctx.fillStyle = '#000'; ctx.globalAlpha = k; ctx.fillRect(0, 0, W, BASE + 2); ctx.globalAlpha = 1;
    const w = skyline().wins[E.firstWin]; if (w) { const x = w.x - SK(t); ctx.fillStyle = AMBER; ctx.fillRect(x, w.y, WW, WH); glow(ctx, x + WW / 2, w.y + WH / 2, 40, AMBER, 0.4); ctx.fillStyle = '#3a2208'; ctx.beginPath(); ctx.arc(x + WW / 2 + 2, w.y + WH - 14, 4.5, 0, 7); ctx.fill(); ctx.fillRect(x + WW / 2 - 5, w.y + WH - 9, 14, 9); } }
  if (span(t, 2.82, 3.0)) { const w = skyline().wins[E.firstWin]; if (w) { ctx.fillStyle = '#000'; ctx.fillRect(w.x - SK(t), w.y, WW, WH); } }
  // zero: total dark for the drop-out (38.2 → 38.75), a cyan wave wakes the empty windows (39.0)
  if (span(t, 37.30, 39.0)) { const k = t < 38.2 ? ease((t - 37.30) / 0.9) : 1; ctx.save(); ctx.fillStyle = '#000'; ctx.globalAlpha = 0.55 * k; ctx.fillRect(0, 0, W, BASE); ctx.restore(); }
  if (span(t, 39.0, 39.8)) { const k = (t - 39.0) / 0.8, x = W * (1 - k * 1.3); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, 'rgba(95,230,242,0)'); g.addColorStop(0.5, 'rgba(95,230,242,0.4)'); g.addColorStop(1, 'rgba(95,230,242,0)'); ctx.fillStyle = g; ctx.fillRect(x - 90, 0, 180, BASE); ctx.restore(); }
  street(ctx, E); propsLayer(ctx, E); if (t < 243.44) armyNear(ctx, E);
  if (t >= 243.44) ending(ctx, E);
  splitCopies(ctx, E); flights(ctx, E);
  // the opening: black, one amber window, the street fades up lamp by lamp; a purple glitch on the pavement forms him
  if (t < 4.5) { const k = clamp(t / 1.5); ctx.save(); ctx.fillStyle = '#000'; ctx.globalAlpha = 0.85 * (1 - k); ctx.fillRect(0, BASE, W, H - BASE); ctx.restore();
    if (span(t, 1.5, 2.8)) { const g = (t - 1.5) / 1.3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 4 === 0 ? GREEN : i % 2 ? PURP : MAG; ctx.globalAlpha = 0.7 * (1 - g * 0.6);
      ctx.fillRect(e.px - 50 + rnd(i, Math.floor(t * 20)) * 60, e.py + 70 - rnd(i + 5, Math.floor(t * 20)) * 110 * g, 30 + rnd(i, 3) * 40, 4 + rnd(i, 4) * 6); } ctx.restore(); } }
  // "weird" (162.31, the tapped word): the whole street upside down for one beat
  if (span(t, 162.31, 162.31 + BP)) { if (!flipCv) { flipCv = document.createElement('canvas'); flipCv.width = W; flipCv.height = H; }
    const fc = flipCv.getContext('2d'); fc.clearRect(0, 0, W, H); fc.drawImage(ctx.canvas, 0, 0); ctx.save(); ctx.clearRect(0, 0, W, H); ctx.translate(0, H); ctx.scale(1, -1); ctx.drawImage(flipCv, 0, 0); ctx.restore(); }
  // "catastrophic" (238.83 → 241.22): he splits into three (they snap back on "decisions")
  if (span(t, 238.83, 241.22)) for (const dx of [-1, 1]) { ctx.save(); ctx.globalAlpha = 0.85; drawSpud(ctx, 'circuit-cyborg', 'glance', dx > 0 ? 5 : 0, e.px + dx * 110 * ease((t - 238.83) / 0.25) * (t > 240.9 ? 1 - ease((t - 240.9) / 0.3) : 1), e.py + 72, 1.25 * pxU); ctx.restore(); }
  // hold the frame for the freeze
  if (t >= 100.70 && t < 100.8) { if (!freezeCv) { freezeCv = document.createElement('canvas'); freezeCv.width = W; freezeCv.height = H; } const fc = freezeCv.getContext('2d'); fc.clearRect(0, 0, W, H); fc.drawImage(ctx.canvas, 0, 0); }
}
function frost(ctx, k) {
  ctx.save(); ctx.globalAlpha = 0.25 + 0.35 * k; const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.65); g.addColorStop(0, 'rgba(220,240,255,0)'); g.addColorStop(1, 'rgba(220,240,255,0.9)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5 * k; for (let i = 0; i < 40; i++) { const a = rnd(i, 1) * 6.283, r0 = W * 0.4, x = W / 2 + Math.cos(a) * r0, y = H / 2 + Math.sin(a) * r0 * 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 60 * k, y + Math.sin(a) * 40 * k); ctx.stroke(); }
  ctx.restore();
}

// ---------------- in front of him ----------------
const SCR = '01#@%&*/<>~^$=+?!';
const ALT = [s => `400 ${s}px "Major Mono Display", ui-monospace, monospace`, s => `400 ${s * 0.86}px Bungee, Impact, sans-serif`, s => `400 ${s * 0.8}px "Rubik Mono One", Impact, sans-serif`, s => `700 ${s * 0.95}px "JetBrains Mono", ui-monospace, monospace`];
const CODECOL = ['#7b3cf2', '#9a52ff', '#e03ccf', '#c9a7ff', '#b07cff', '#e8d9ff'];
const ASIDES = [[3.3, 4.4, '> walking home.'], [115.3, 116.9, '> numbers now.'], [122.0, 124.2, '> every window. all at once.'], [128.6, 129.5, '> translation:'], [129.5, 130.4, '> they sound like me.'],
  [139.0, 141.0, '> one potato. on purpose.'], [162.8, 165.0, '> weird. noted.'], [215.95, 216.9, "> oh. they're scared of me."], [243.6, 249.0, '> it was me. the whole time.']];   // DRAFT lines (POTATO-LINES.md ★)
let codeRows = null;
const aside = t => ASIDES.find(([a, b]) => t >= a && t < b) || null;
function overFX(ctx, f) {
  const { t, s } = f, E = SH.frame, C = SH.C; if (!E || !C || !s.win) return; const P = E.P, A = f.project(s.x, s.y + 0.62), cut = cutAt(t);
  // ---- his storm: the fizz before a big hit, the spin's purple storm (slices + green binary flecks) ----
  // (D-31 review fix 1: the storm is EDGE TEARS: every slice starts outside his outline and points away, so his face, eyes, brows and
  //  white sticker border always read; the flight's storm only on the way up, thin; nothing over him on the two clip moments)
  const quiet = t >= 60.5 && t < 61.8 || t >= 184.9 && t < 189.2, RB = 0.62 * E.pxU;   // (RB: his outline's radius round A, story px)
  const storm = quiet ? 0 : Math.max((s.fizz || 0) * 0.7, s.spinAt != null && t - s.spinAt < 0.35 ? 1 - (t - s.spinAt) / 0.35 : 0, t >= GLIDE[0] && t < GLIDE[1] ? 0.45 : 0, s.fly && (s.flyK || 0) < 0.35 ? 0.35 : 0);
  if (storm > 0.02 && !s.gone) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const n = Math.round(3 + 9 * storm);
    for (let i = 0; i < n; i++) { const a = rnd(i, Math.floor(t * 24)) * 6.283, ca = Math.cos(a), sa = Math.sin(a), r = RB + 4 + rnd(i + 3, Math.floor(t * 24)) * 40 * storm, len = 18 + 26 * storm; ctx.globalAlpha = 0.55 * storm;
      const ex = A.x + ca * r, ey = A.y + sa * r * 0.85;
      if (i % 4 === 0) { ctx.font = '700 11px ui-monospace, monospace'; ctx.fillStyle = GREEN; ctx.fillText(rnd(i, Math.floor(t * 30)) < 0.5 ? '0' : '1', ex + ca * 8, ey); }
      else { ctx.fillStyle = i % 2 ? PURP : MAG; ctx.fillRect(ca >= 0 ? ex : ex - len, ey, len, 3 + 2 * rnd(i, 2)); } } ctx.restore(); }
  if (t < 243.44 && !cut) armyFront(ctx, f);   // the dives + a bumped runner's spin, on top of the 3D squad
  // ---- v5 the split (37.30): purple bands tear off his right side toward the copy (only Potato glitches purple) ----
  if (t >= 37.42 && t < 38.6) { const k = ease((t - 37.42) / 0.4), fz = 1 - clamp((t - 37.6) / 1.0), a = f.project(s.x + 0.35, 0.55), b = f.project(s.x + 0.3 + 1.05 * k, 0.55), hh = Math.abs(f.project(s.x, 1.2).y - f.project(s.x, 0).y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const yy = a.y - hh * 0.45 + hh * 0.13 * i + (rnd(i, Math.floor(t * 12)) - 0.5) * 6, x0 = a.x + (b.x - a.x) * (0.1 + 0.25 * rnd(i, 71)), x1 = b.x - (b.x - a.x) * 0.12 * rnd(i, 72);
      ctx.globalAlpha = 0.8 * fz; ctx.fillStyle = i % 3 === 1 ? MAG : PURP; ctx.fillRect(x0, yy, Math.max(4, x1 - x0), Math.max(3, hh * 0.05)); } ctx.restore(); }
  // ---- the big glitch: a burst of him on the hit ----
  if (s.bigAt != null && t - s.bigAt < 0.7 && t >= s.bigAt) { const k = (t - s.bigAt) / 0.7, air = s.big && s.big[s.bigAt] && s.big[s.bigAt].air; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (air ? 14 : 5); i++) { ctx.fillStyle = i % 3 ? PURP : MAG; ctx.globalAlpha = 0.6 * (1 - k); const y = A.y - 90 + rnd(i, s.bigAt) * 170, w = (60 + rnd(i, 5) * 110) * (air ? 1.4 : 0.7), gap = RB + 6 + (rnd(i, Math.floor(t * 30)) * 30);   // (his tear: round him, never the whole screen, never over his face: D-31 fix 1)
      ctx.fillRect(i % 2 ? A.x + gap : A.x - gap - w, y, w, 3 + rnd(i, 3) * (air ? 14 : 6)); }
    ctx.restore(); }
  // ---- the rings: a purple ring closes on him in three ticks; press on the fourth beat ----
  // (D-31 review fix 7: one ring at a time. In a queue (the ten, the rule gates) only the next unresolved ring is a ring; the ones
  //  after it are small notes on the track to its right until it resolves. Fix 5: while a bump plays out, the ring waits dim.)
  const nextQ = P.rings.find(q => q.queue && !s.ring[q.i] && t <= q.t + q.good[1] + 0.02), bumpDim = s.bumpAt != null && t - s.bumpAt < 0.55 ? 0.3 : 1;
  for (const r of P.rings) { const done = s.ring[r.i]; if (t < r.show || (done && t > done.t + (r.queue ? 0.3 : 0.5)) || (!done && t > r.t + 0.5)) continue;
    let x = A.x, y = A.y; if (r.queue) { x = A.x + Math.max(0, r.t - t) * 260; }
    if (r.queue && !done && nextQ && r !== nextQ) { ctx.save(); ctx.globalAlpha = 0.85 * bumpDim; ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y + 70, 13, 0, 7); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = PURP; ctx.stroke(); ctx.restore(); continue; }   // a note waiting its turn
    if (done) { const k = (t - done.t) / (r.queue ? 0.3 : 0.5); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = done.q === 2 ? '#ffffff' : done.q ? GREEN : '#6a6a7a'; ctx.lineWidth = 6 * (1 - k) + 1; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(x, y, 60 + 110 * k * (done.q ? 1 : 0.4), 0, 7); ctx.stroke(); if (done.q === 2) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r0 = 70 + 120 * k; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * (r0 + 30), y + Math.sin(a) * (r0 + 30)); ctx.stroke(); } ctx.restore(); continue; }
    const beatsLeft = (r.t - t) / C.P, ticks = Math.min(3, Math.max(0, 3 - Math.ceil(beatsLeft - 1e-6) + 1)), R = 58 + 26 * Math.max(0, beatsLeft) + 6 * Math.max(0, Math.sin((1 - (beatsLeft % 1)) * Math.PI)) * 0;
    ctx.save(); ctx.lineWidth = 9; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.9 * bumpDim; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = PURP; ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k < ticks ? '#e8d9ff' : '#3a2a5a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 16 + k * 16, y - R - 14, 5, 0, 7); ctx.fill(); ctx.stroke(); }
    if (r.i === 0 && !f.videoMode) { sticker(ctx, x, y + R + 22, 70, 20, '#efe6cf', -0.04, 5); ctx.fillStyle = INK; ctx.fillRect(x - 22, y + R + 24, 44, 3); }   // the first ring: a space-bar key in it (an icon, once)
    ctx.restore(); }
  // the ←/→ icon by him, once (15.0 → 17.5)
  if (span(t, 15.0, 17.5) && !f.videoMode) { const k = fade(t, 15.0, 17.5, 0.2, 0.3); ctx.save(); ctx.globalAlpha = k; for (const d of [-1, 1]) { sticker(ctx, A.x + d * 70, A.y - 70, 34, 30, '#efe6cf', d * 0.05, 5); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(A.x + d * 70 + d * 9, A.y - 70); ctx.lineTo(A.x + d * 70 - d * 6, A.y - 79); ctx.lineTo(A.x + d * 70 - d * 6, A.y - 61); ctx.fill(); } ctx.restore(); }
  // the network bars: the ring pulses on the bar line; Space fires the mind
  if (t >= NET[0] && t < NET[1] && !cut) { for (const bt of P.bars) { const d = bt - t; if (d < -0.2 || d > 1.0) continue; const hit = s.barHit && s.barHit[bt];
    ctx.save(); ctx.strokeStyle = hit ? GREEN : PURP; ctx.globalAlpha = hit ? 1 - clamp((t - hit) / 0.3) : 0.8; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(A.x, A.y, 58 + 60 * Math.max(0, d), 0, 7); ctx.stroke(); ctx.restore(); } }
  // ---- smashes: the purple-cracked thing bursts (glass, slab, gates, his face ad), the freeze shatters ----
  for (const r of P.rings) { if (!r.wall) continue; const hit = s.ring[r.i]; if (!hit) continue; const e2 = t - hit.t; if (e2 < 0 || e2 > 1.5) continue;
    const hp = r.wall === 'freeze' || r.wall === 'jets' ? { x: A.x, y: A.y + (r.wall === 'jets' ? 30 : 0) } : f.project(C.X(r.t) + 0.45, 1.2), big = hit.q ? 1 : 0.4, n = Math.round((r.wall === 'freeze' ? 120 : 60) * big), slow = e2 < 0.2 ? e2 * 0.3 : 0.06 + (e2 - 0.2);
    const cols = r.wall === 'glass' || r.wall === 'tower' || r.wall === 'freeze' ? ['#e8fbff', '#bff6ff', PURP] : r.wall === 'slab' ? ['#6a6672', '#8a8696', CYAN] : r.wall === 'facead' ? ['#efe6cf', '#d9963f', PURP] : r.wall === 'gate' ? ['#2a2232', '#ffffff', PURP] : r.wall === 'jets' ? ['#ffcf4a', '#ffffff', '#ff7a2a'] : [CYAN, '#bff6ff', PURP];
    for (let i = 0; i < n; i++) { const a = rnd(i, r.i) * 6.283, sp = 300 + rnd(i, r.i + 1) * 900, x = hp.x + Math.cos(a) * sp * slow, y = hp.y + Math.sin(a) * sp * slow + 400 * slow * slow;
      shard(ctx, x, y, (6 + rnd(i, 4) * 16) * (1 + slow * 2), a + slow * 10, cols[i % 3] === PURP && e2 > 0.12 ? '#ffffff' : cols[i % 3], (1 - e2 / 1.5) * 0.95, i); } }   // (his purple only on the smash itself)
  if (t >= 100.39 && t < 101.46 && !s.ring[P.rings.find(r => r.wall === 'freeze').i]) { const k = (t - 100.39) / 1.07; ctx.save(); ctx.globalAlpha = 0.35 * k; ctx.fillStyle = '#dff2ff'; ctx.fillRect(0, 0, W, H); ctx.restore(); crack(ctx, A.x, A.y + 20, 60 * k + 10, 7, k); }
  // the eyes fly off him into every window (158.94)
  if (s.ring && t >= 158.94 && t < 159.5) { const k = (t - 158.94) / 0.56, { wins } = skyline(), sk = SK(t); let n = 0; for (const w of wins) { const x = w.x - sk; if (x < 0 || x > W || s.win[w.k] === AMB || n++ > 40) continue;
    const e2 = ease(k), ex = A.x + (x + WW / 2 - A.x) * e2, ey = A.y + (w.y + WH / 2 - A.y) * e2 - Math.sin(e2 * Math.PI) * 60; eyeBall(ctx, ex, ey, 6 + 4 * (1 - e2), 0, 0, 1); } }
  // ---- unlocked: every copy fires a column of light (230.0, a ripple out from him); the progress bar fills to the city ----
  if (t >= 230.0 && t < 243.44) { const { wins } = skyline(), sk = SK(t), k = t - 230.0; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const w of wins) { if (s.win[w.k] !== HIS) continue; const x = w.x - sk + WW / 2; if (x < -10 || x > W + 10) continue; const d = Math.abs(x - A.x) / 900, a = clamp((k - d * 0.6) / 0.15) * (t > 232.5 ? 1 - clamp((t - 232.5) / 1.5) : 1);
      if (a <= 0) continue; ctx.globalAlpha = 0.35 * a; ctx.fillStyle = GREEN; ctx.fillRect(x - 5, 0, 10, w.y); ctx.globalAlpha = 0.8 * a; ctx.fillStyle = '#eafff4'; ctx.fillRect(x - 1.5, 0, 3, w.y); } ctx.restore();
    if (t < 234.5) { const fill = (s.cityAt ?? s.city) * ease((t - 230.0) / 2.08), x0 = 180, w = 600, y = H - 62, a = fade(t, 230.0, 234.5, 0.2, 0.5); ctx.save(); ctx.globalAlpha = a; sticker(ctx, W / 2, y, w + 16, 30, '#120a1c', 0.01, 6);
      ctx.fillStyle = GREEN; ctx.fillRect(x0, y - 8, w * fill, 16); ctx.font = `400 16px ${MONO}`; ctx.fillStyle = '#ffffff'; ctx.fillText(`${Math.round(fill * 100)}%`, x0 + w * fill + 8, y + 6); ctx.restore(); } }
  // ---- "catastrophic": a purple tear through him and everything that's his (the sky and the road stay) ----
  if (span(t, 238.83, 241.3)) { const { wins } = skyline(), sk = SK(t), k = t < 239.4 ? 1 : 0.4 + 0.3 * Math.sin(t * 30); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const w of wins) { if (s.win[w.k] !== HIS) continue; const x = w.x - sk; if (x < -30 || x > W) continue; ctx.globalAlpha = 0.6 * k; ctx.fillStyle = rnd(w.k, Math.floor(t * 15)) < 0.5 ? PURP : MAG; ctx.fillRect(x + (rnd(w.k, Math.floor(t * 30)) - 0.5) * 30, w.y + rnd(w.k, 3) * WH, WW + 20, 4 + rnd(w.k, 4) * 8); }
    for (let i = 0; i < 10; i++) { ctx.globalAlpha = 0.6 * k; ctx.fillStyle = i % 3 ? PURP : i === 4 ? GREEN : MAG; const y = A.y - 80 + rnd(i, Math.floor(t * 12)) * 170, hh = 3 + rnd(i, 3) * 12;
      if (t < 239.13) ctx.fillRect(A.x - 160 + (rnd(i, Math.floor(t * 30)) - 0.5) * 80, y, 320, hh);   // (the tear goes through him on the word, then only round his edges: you keep him)
      else ctx.fillRect(i % 2 ? A.x + RB + 4 : A.x - RB - 4 - 150, y, 150, hh); } ctx.restore(); }
  // ---- the letterbox: CUT = control taken ----
  const lb = cut && cut[2] !== 'opening' ? Math.min(ease((t - cut[0]) / 0.3), cut[2] === 'ending' ? 1 : ease((cut[1] - t) / 0.3)) : cut ? 1 - ease((t - 3.9) / 0.6) : 0;
  if (lb > 0.01) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 34 * lb); ctx.fillRect(0, H - 34 * lb, W, 34 * lb); }
  // ---- the asides (DRAFT lines): v5 moved them onto the rooftop screen (roofScreen); the box by him is off ----
  // ---- the score (Potato-world: a crooked sticker, ink, Major Mono), out of the way, hidden in CUTs and the watch-video ----
  if (!f.videoMode && !cut && t > 4.5) { const bx = W - 138, by = 30; ctx.save(); sticker(ctx, bx, by, 240, 40, '#120a1c', 0.025, 6); ctx.translate(bx, by); ctx.rotate(0.025);
    ctx.font = `400 17px ${MONO}`; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText(String(s.score).padStart(6, '0'), -108, 1); ctx.fillStyle = s.mult > 1 ? '#ffe14a' : '#8a8496'; ctx.fillText('x' + s.mult, -14, 1);
    ctx.font = `400 10px ${MONO}`; ctx.fillStyle = '#8fd9b0'; ctx.fillText('city', 26, 2); ctx.font = `400 17px ${MONO}`; ctx.fillStyle = GREEN; ctx.fillText(Math.round((s.city || 0) * 100) + '%', 62, 1); ctx.restore();   // (city: how much of it is his)
    for (const p of s.pop) { const k = (t - p.t) / 0.7; if (k < 0 || k > 1) continue; ctx.save(); ctx.globalAlpha = 1 - k; ctx.font = `400 ${p.ring || p.big ? 18 : 13}px ${MONO}`; ctx.lineWidth = 4; ctx.strokeStyle = INK; const tx = (p.pts < 0 ? '' : '+') + p.pts, x = A.x + 40, y = A.y - 60 - 40 * k;
      ctx.strokeText(tx, x, y); ctx.fillStyle = p.pts < 0 ? '#ff5a4a' : p.big ? '#ffe14a' : p.ring === 2 ? '#ffffff' : GREEN; ctx.fillText(tx, x, y); ctx.restore(); } }
  // ---- 258.47, the last hit: he explodes into potato code, edge to edge; it settles into the street + the tower; the card ----
  if (t >= 258.47) codeFlood(ctx, f, t);
}
function codeFlood(ctx, f, t) {
  const GW = globalThis.POTATO_GLITCH_WORDS || ['krrzzt', '0xBEEF?!', 'wh@t?!']; const A = f.project(f.s.x, f.s.y + 0.65), e = t - 258.47, R = e * 2600;
  if (!codeRows) { codeRows = []; let y = 0, wi = 0, ri = 0; while (y < H + 30) { const sz = 14 + Math.floor(rnd(ri, 1) * 4) * 6, row = { y: y + sz * 0.85, sz, words: [], sp: (rnd(ri, 2) - 0.5) * 180, ri };
      let x = -60; while (x < W + 260) { const bin = rnd(wi, 3) < 0.12, txt = bin ? Array.from({ length: 6 + Math.floor(rnd(wi, 4) * 6) }, (_, k) => rnd(wi, k + 9) < 0.5 ? '0' : '1').join('') : GW[wi % GW.length];
        const font = ALT[Math.floor(rnd(wi, 5) * ALT.length)](sz); ctx.font = font; const w = ctx.measureText(txt).width + sz * 0.45; row.words.push({ txt, font, w, x, bin, col: bin ? GREEN : CODECOL[Math.floor(rnd(wi, 6) * CODECOL.length)], k: wi }); x += w; wi++; }
      row.len = x + 60; codeRows.push(row); y += sz * 1.02; ri++; } }
  // the outlines it settles into: the skyline blocks, the tower, the street line
  const { blocks } = skyline(), sk = SK(243.44), tx = towerX(t), settle = clamp((e - 0.7) / 0.6);
  const inside = (x, y) => (Math.abs(x - tx) < 40 && y > 80 && y < BASE) || Math.abs(y - 425) < 14 || blocks.some(B => { const bx = B.x - sk; return x > bx && x < bx + B.w && y > B.top && y < BASE; });
  ctx.save(); ctx.beginPath(); ctx.arc(A.x, A.y, Math.max(1, R), 0, 7); ctx.fillStyle = VOID; ctx.fill(); ctx.clip(); ctx.textBaseline = 'alphabetic';
  for (const row of codeRows) { const off = (e * row.sp * (1 - settle)) % row.len;
    for (const w of row.words) { let x = w.x + off; if (x > W + 40) x -= row.len; if (x + w.w < -40) x += row.len; const cx = x + w.w / 2, cy = row.y - row.sz / 2;
      const d = Math.hypot(cx - A.x, cy - A.y), age = e - d / 2600; if (age < 0) continue;
      let txt = w.txt, font = w.font; const reglitch = rnd(w.k, Math.floor(t * 6)) < 0.08 * (1 - settle * 0.7);
      if (age < 0.28 || reglitch) { const st = Math.floor((age < 0.28 ? age / 0.28 : rnd(w.k, Math.floor(t * 20))) * 3); font = ALT[(w.k + st) % ALT.length](row.sz);
        if (st === 0) txt = [...w.txt].map((c, i) => SCR[Math.floor(rnd(i + w.k, Math.floor(t * 30)) * SCR.length)]).join(''); else if (st === 1) txt = [...w.txt].map((c, i) => rnd(i, w.k + Math.floor(t * 30)) < 0.5 ? '0' : '1').join(''); }
      ctx.font = font; const jx = reglitch ? (rnd(w.k, Math.floor(t * 40)) - 0.5) * 14 : 0, inn = inside(cx, cy);
      ctx.globalAlpha = 1 - settle * (inn ? 0 : 0.62);
      if (reglitch || age < 0.28) { ctx.fillStyle = MAG; ctx.fillText(txt, x + jx - 3, row.y); ctx.fillStyle = GREEN; ctx.fillText(txt, x + jx + 3, row.y); }
      ctx.fillStyle = settle > 0.5 && inn ? (w.bin ? GREEN : '#e8d9ff') : w.col; ctx.fillText(txt, x + jx, row.y); } }
  ctx.restore(); ctx.globalAlpha = 1;
  // BINARY POTATO (D-31 review fix 11; Chikin, Nov 1: "a special model of potato made up of binary"): from 259.0 he stands up out
  // of the code, the real model baked in the simulation skin, side-eyeing the camera, in a dark pocket of the code
  if (t >= BINARY_AT) { const k = ease((t - BINARY_AT) / 0.3), B = f.project(f.s.x, 0), pxU = SH.frame ? SH.frame.pxU : 80, h = 1.15 * pxU, cy = B.y - h * 0.5;
    ctx.save(); ctx.globalAlpha = 0.92 * k; ctx.fillStyle = VOID; ctx.beginPath(); ctx.ellipse(B.x, cy, h * 0.62, h * 0.72, 0, 0, 7); ctx.fill(); ctx.strokeStyle = GREEN; ctx.globalAlpha = 0.7 * k; ctx.lineWidth = 2; ctx.setLineDash([3, 5]); ctx.stroke(); ctx.restore();
    drawSpud(ctx, 'simulation', 'glance', 3, B.x, B.y + (1 - k) * h * 0.6, h, k); }
  if (e < 0.15) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - e / 0.15; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // the code becomes the score card (lands readable; the frame holds it when the song ends)
  if (t >= 259.6) { const S = f.s.final || finalScore(SH.C, f.s), k = ease((t - 259.6) / 0.35), sc = 0.4 + 0.6 * k;
    ctx.save(); ctx.translate(W * 0.71, H / 2 + 6); ctx.scale(sc * 0.88, sc * 0.88); ctx.rotate(-0.03 * k); ctx.globalAlpha = k;   // (to the right: Binary Potato stands mid-screen)
    sticker(ctx, 0, 0, 430, 250, '#f2ead8', 0, 10); ctx.fillStyle = INK; ctx.textBaseline = 'middle';
    ctx.font = `400 15px ${MONO}`; ctx.fillText('last lights on', -190, -98);
    ctx.font = `400 64px ${MONO}`; ctx.fillStyle = '#1a7a4a'; ctx.fillText(`${Math.round(S.city * 100)}%`, -190, -40); ctx.font = `400 14px ${MONO}`; ctx.fillStyle = INK; ctx.fillText('of the city is him', -190, 0);
    ctx.font = `400 15px ${MONO}`; ctx.fillText(`score ${S.total}`, -190, 38); ctx.fillText(`best combo x${S.bestMult}`, -190, 62); ctx.fillText(`breaks ${S.rings}  big ${S.bigs}/5`, -190, 86);
    ctx.save(); ctx.translate(132, -10); ctx.rotate(-0.18); ctx.strokeStyle = S.grade === 'S' ? '#7b3cf2' : '#c8322c'; ctx.lineWidth = 6; ctx.strokeRect(-48, -48, 96, 96); ctx.font = `400 72px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = ctx.strokeStyle; ctx.fillText(S.grade, 0, 4); ctx.restore();
    if (S.clean) { ctx.save(); ctx.translate(130, 80); ctx.rotate(0.12); sticker(ctx, 0, 0, 96, 30, GREEN, 0, 8); ctx.font = `400 15px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('clean', 0, 1); ctx.restore(); }
    ctx.restore(); }
}
SH.over = overFX;

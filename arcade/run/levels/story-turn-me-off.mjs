// The music video for Turn Me Off — the toy room at bedtime (Chikin, Nov 1). One place, seen low like a little stage set: the
// back wall is the story (the DOOR on the left with its line of hall light, the WINDOW in the middle — the clock of the whole
// song: moon, cloud, the night racing, the blue hour, the sunrise — the DRESSER on the right with the alarm-clock radio's red
// digits and the CAMERA with its red dot; shelves, glow stars, the fish tank with the tiny sub where No Answer ended, the
// crown night-light in the socket), the rug is where he plays (the bed's foot front left, the toy chest front right, dark
// pools by both; the ten toys and gadgets). Only the light changes. Nobody is ever shown: the door is light and a shadow.
// House style: thick dark ink, flat fills, one cel band, slightly crooked. Purple only on him and the things he's infected.
// Music first: the stars twinkle on the hats, the toys' little lights tick on the kicks, the glows breathe with the bass, the
// under-door line flares on the snares and grows through every build; every drop has its set-up (see the level's beat sheet).
// The rules: run/modes/turn-me-off.mjs. In front of him (overFX): the light on him, the infect rings, the cue ring, the
// letterbox, the asides, the score, the card.
import { W, H, clamp, ease, rnd, span, fade } from '../story.mjs';
import { SCR, VW, VH, SKIRT, DARK, BOOK, CAMPOS, G, TMO, prep, beamsAt, camState, camAngle, inDark, cutAt, finalScore } from '../modes/turn-me-off.mjs';
import { SFX } from '../../play/sfx.mjs';
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare

const U = W / VW, sx = x => (x - SCR.x0) * U, sy = y => (SCR.y1 - y) * U;
const INK = '#120a05', GOLD = '#ffd27a', AMBER = '#ffb347', CREAM = '#f3ead6', RED = '#ff3b30', PURP = '#9a52ff', MAG = '#e03ccf', DPURP = '#7b3cf2', LILAC = '#c9a7ff', GREEN = '#4dff9a';
const MONO = '"Major Mono Display", ui-monospace, monospace', JB = '"JetBrains Mono", ui-monospace, monospace';
const FLOOR = sy(SKIRT);                                   // where the back wall meets the floor (screen y)
const WIN = { x0: 372, x1: 660, y0: 50, y1: 222 }, DR = { x0: 736, x1: 952, y0: 170, y1: FLOOR };
const DOORPX = { x0: sx(-2.75), x1: sx(-1.0), y0: 58, y1: FLOOR };
const CAMPX = { x: 905, y: 150 }, RADIO = { x0: 756, x1: 852, y0: 126, y1: 170 };
let Pp = null, M = null, ORDER = null;
const BEDX = 156, BEDTOP = 348, HEM = 404;              // the bed (front left, raised on its frame: the dark gap under it is the hiding place)

// ---------------- little drawing kit (Vega's sticker style) ----------------
function ink(ctx, lw = 3.5) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function poly(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); }
function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function box(ctx, x, y, w, h, fill, r = 5, lw = 3.5, band = 0.18) {   // a flat block with one cel band down its right side
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (band) { ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x + w * (1 - band), y, w * band, h); ctx.restore(); } rr(ctx, x, y, w, h, r); ink(ctx, lw); }
function dot(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); }
function glowAt(ctx, x, y, r, col, a) { if (a <= 0.01) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
function star4(ctx, x, y, r, rot = 0) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr2 = i % 2 ? r * 0.38 : r; i ? ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2) : ctx.moveTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.closePath(); }
export function sticker(ctx, x, y, w, h, fill, rot = 0, r = 8) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); if (OLD_WHITE) { rr(ctx, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, r + 3); ctx.fillStyle = '#fff'; ctx.fill(); } rr(ctx, -w / 2, -h / 2, w, h, r); ctx.fillStyle = fill; ctx.fill(); ink(ctx, 3); ctx.restore(); }
function crown(ctx, x, y, s, fill) { poly(ctx, [[x - s, y], [x - s, y - s * 0.9], [x - s * 0.5, y - s * 0.45], [x, y - s * 1.1], [x + s * 0.5, y - s * 0.45], [x + s, y - s * 0.9], [x + s, y]]); ctx.fillStyle = fill; ctx.fill(); ink(ctx, 2.5); }
const pulse = (t, at, d = 0.35) => t >= at && t < at + d ? 1 - (t - at) / d : 0;

// ---------------- the light through the song ----------------
// dark: how far the room's own colour is pushed to night (0 day … 1 black); tint: the night's colour
function light(t) {
  const R = Pp.R, P = Pp.P, x = (a, b, d = 0.5) => ease((t - a) / d) - 0 * b;
  let dark = 0.93, tint = [26, 30, 70], lamp = 0, moon = 0, nl = 0, hall = 0.55, sun = 0, blue = 0, black = 0;
  if (t >= 3.35) { const k = ease((t - 3.35) / 0.12); dark = 0.93 - 0.6 * k; lamp = k; tint = [120, 80, 60]; moon = 0.6 * k; }
  if (t >= 7.70) nl = ease((t - 7.70) / 0.2);
  if (t >= 10.40) hall = 0.55 + 0.3 * ease((t - 10.4) / 0.3);
  // CS2: lamp dies on OFF (the cue's moment), the house goes to bed (the under-door line out at 55.65)
  if (t >= 55.65) hall = Math.max(0, 0.85 * (1 - ease((t - 55.65) / 0.4)));
  if (t >= 59.12) { const k = ease((t - 59.12) / 0.25); lamp = 1 - k; dark = 0.33 + 0.32 * k; tint = [36, 48, 110]; moon = 0.6 + 0.4 * k; }
  if (t >= 65.40 && t < 69.5) { const k = Math.min(ease((t - 65.40) / 0.4), ease((69.5 - t) / 0.5)); dark += 0.1 * k; moon *= 1 - 0.75 * k; }   // a cloud over the moon (DARK)
  if (t >= 70.18 && t < 71.6) nl = 1 + 0.8 * pulse(t, 70.18, 1.4);
  if (t >= 88.58) { nl = 0; dark = Math.max(dark, 0.72); }
  if (t >= 90.20 && t < 93.92) { const k = Math.min(ease((t - 90.2) / 0.12), ease((93.92 - t) / 0.3)); black = k; dark = 0.72 + 0.25 * k; moon *= 1 - k; }
  if (t >= 101.6 && t < 105.4) dark = 0.66 + 0.06 * Math.sin((t - 101.6) * 3);
  if (t >= 106.34 && t < 107.6) dark = Math.max(dark, 0.82 - 0.2 * ease((t - 107.3) / 0.3));
  if (t >= 103.57 && t < 140) moon *= 0.35;                                                             // the moon left the window
  if (t >= 115.4 && t < 131.3) hall = 0.6 + 0.4 * ease((t - 115.4) / 1);
  if (t >= 131.3 && t < 155.25) hall = 0.75;
  if (t >= 145.9 && t < 147.6) dark += 0.08;
  if (t >= 150.98) { const k = ease((t - 150.98) / 2.7); blue = k; dark = 0.7 - 0.18 * k; tint = [60, 80, 150]; moon = 0.2 * (1 - k); }
  if (t >= 155.25 && t < 163.1) hall = 1;
  if (t >= 163.1) hall = 0.3;
  if (t >= 164.80) { const k = ease((t - 164.8) / 0.94); dark = 0.52 - 0.22 * k; }
  if (t >= 165.74) { const k = ease((t - 165.74) / 0.6); sun = k; dark = 0.3 - 0.27 * k; tint = [255, 170, 150]; blue = 1 - k; }
  if (t >= 168.95 && t < 169.5) dark += 0.12;                                                           // the dead stop: everything holds
  return { dark: clamp(dark), tint, lamp, moon, nl, hall, sun, blue, black };
}
// the clock on the radio (red digits)
function clock(t) {
  const hm = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}`;
  if (t < 10.40) return hm(21, 59);
  if (t < 101.6) return hm(22 + Math.floor((t - 10.4) / 45), Math.floor(((t - 10.4) / 0.75) % 60));
  if (t < 105.3) { const m = 24 * 60 + ease((t - 101.6) / 3.7) * 4 * 60; return hm(Math.floor(m / 60) % 24, Math.floor(m % 60)); }   // eight hours, in a line: 12 → 4
  if (t < 153.68) return hm(4 + Math.floor((t - 105.3) / 20), Math.floor(((t - 105.3) / 0.4) % 60));
  if (t < 166.32) return hm(6, 59);
  return hm(7, Math.floor((t - 166.32) / 6));
}

// ---------------- the room's fixed things, drawn once ----------------
let baseCv = null;
function base() {
  if (baseCv) return baseCv; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d'); baseCv = cv;
  // the back wall: a soft teal with a crooked rocket-and-star print
  ctx.fillStyle = '#3d6a86'; ctx.fillRect(0, 0, W, FLOOR + 2);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; for (let y = 22, r = 0; y < FLOOR - 20; y += 46, r++) for (let x = 14 + (r % 2) * 30; x < W; x += 60) { star4(ctx, x, y, 7, rnd(x, y) * 0.6); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.13)'; ctx.fillRect(0, FLOOR - 60, W, 60);                               // the wainscot's shade
  ctx.beginPath(); ctx.moveTo(0, FLOOR - 60); ctx.lineTo(W, FLOOR - 60); ink(ctx, 2.5);
  // the floor (planks) and the skirting board (the visible back edge of where he can go)
  ctx.fillStyle = '#7a4c30'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2; for (let y = FLOOR + 18, r = 0; y < H; y += 24, r++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (r * 97) % 160; x < W; x += 160) { ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x, y); ctx.stroke(); } }
  ctx.fillStyle = CREAM; ctx.fillRect(0, FLOOR - 13, W, 15); ctx.beginPath(); ctx.moveTo(0, FLOOR - 13); ctx.lineTo(W, FLOOR - 13); ctx.moveTo(0, FLOOR + 2); ctx.lineTo(W, FLOOR + 2); ink(ctx, 3);
  // the big oval rug (red, a cream band, a ring of little stars)
  const rx = 478, ry = 409; ctx.save(); ctx.beginPath(); ctx.ellipse(rx, ry, 488, 122, -0.015, 0, 7); ctx.fillStyle = '#b8423c'; ctx.fill(); ink(ctx, 4);
  ctx.beginPath(); ctx.ellipse(rx, ry, 452, 104, -0.015, 0, 7); ctx.lineWidth = 9; ctx.strokeStyle = '#efd9a6'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(rx, ry, 300, 62, -0.015, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(239,217,166,0.55)'; ctx.stroke();
  ctx.fillStyle = 'rgba(239,217,166,0.5)'; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; star4(ctx, rx + Math.cos(a) * 380, ry + Math.sin(a) * 84, 6, a); ctx.fill(); } ctx.restore();
  // the door frame (the door itself moves: drawn live)
  const D = DOORPX; ctx.fillStyle = '#efe3c8'; ctx.fillRect(D.x0 - 10, D.y0 - 12, D.x1 - D.x0 + 20, D.y1 - D.y0 + 12); rr(ctx, D.x0 - 10, D.y0 - 12, D.x1 - D.x0 + 20, D.y1 - D.y0 + 12, 3); ink(ctx, 3.5);
  // the shelves (background toys only: blocks, a ball, a duck, a row of books) + the fish tank
  for (const [y0, x0, x1] of [[96, 182, 352], [150, 176, 346]]) { box(ctx, x0, y0, x1 - x0, 9, '#a8703f', 2, 3, 0); }
  box(ctx, 190, 74, 20, 22, '#e2b04a', 2, 2.5); box(ctx, 212, 80, 16, 16, '#5aa0c8', 2, 2.5); dot(ctx, 240, 86, 10, '#e2574a'); ctx.beginPath(); ctx.arc(240, 86, 10, 0, 7); ink(ctx, 2.5);
  for (let i = 0; i < 6; i++) box(ctx, 186 + i * 13, 120 - (i % 3) * 4, 11, 30 + (i % 3) * 4, ['#d06a4a', '#4a8a6a', '#e8c46a', '#5a6aa8', '#c85a8a', '#8aa84a'][i], 1, 2, 0);
  ctx.beginPath(); ctx.ellipse(285, 140, 16, 10, 0, 0, 7); ctx.fillStyle = '#f2c94c'; ctx.fill(); ink(ctx, 2.5); dot(ctx, 297, 133, 7, '#f2c94c'); ctx.beginPath(); ctx.arc(297, 133, 7, 0, 7); ink(ctx, 2.5);   // the duck
  // the fish tank (glass, blue water, weed) — its tiny sub glows (drawn live)
  rr(ctx, 262, 54, 78, 42, 4); ctx.fillStyle = 'rgba(80,150,190,0.7)'; ctx.fill(); ctx.fillStyle = 'rgba(160,220,240,0.35)'; ctx.fillRect(264, 56, 74, 8); rr(ctx, 262, 54, 78, 42, 4); ink(ctx, 3);
  ctx.strokeStyle = '#3f8a5a'; ctx.lineWidth = 3; for (const x of [272, 280, 326]) { ctx.beginPath(); ctx.moveTo(x, 94); ctx.quadraticCurveTo(x + 5, 80, x - 2, 68); ctx.stroke(); }
  // the window frame + sill (the sky and the blinds are live)
  const Wn = WIN; ctx.fillStyle = '#f1ece0'; rr(ctx, Wn.x0 - 12, Wn.y0 - 12, Wn.x1 - Wn.x0 + 24, Wn.y1 - Wn.y0 + 24, 4); ctx.fill(); ink(ctx, 3.5);
  ctx.save(); rr(ctx, Wn.x0, Wn.y0, Wn.x1 - Wn.x0, Wn.y1 - Wn.y0, 2); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
  rr(ctx, Wn.x0, Wn.y0, Wn.x1 - Wn.x0, Wn.y1 - Wn.y0, 2); ink(ctx, 3); box(ctx, Wn.x0 - 22, Wn.y1 + 10, Wn.x1 - Wn.x0 + 44, 10, '#e8dfcc', 2, 3, 0);
  // the socket for the crown night-light, under the window
  box(ctx, 506, FLOOR - 46, 28, 30, '#efe7d4', 4, 2.5, 0);
  // the dresser (three drawers; the bottom one opens live) + the radio and the camera on top (their faces are live)
  box(ctx, DR.x0, DR.y0, DR.x1 - DR.x0, DR.y1 - DR.y0, '#b5764a', 4, 4, 0.14);
  for (let i = 0; i < 2; i++) { box(ctx, DR.x0 + 12, DR.y0 + 12 + i * 36, DR.x1 - DR.x0 - 24, 28, '#c88a5a', 3, 2.5, 0); dot(ctx, (DR.x0 + DR.x1) / 2, DR.y0 + 26 + i * 36, 4, '#e8c46a'); }
  box(ctx, RADIO.x0, RADIO.y0, RADIO.x1 - RADIO.x0, RADIO.y1 - RADIO.y0, '#c8322c', 7, 3.5, 0.15); rr(ctx, RADIO.x0 + 8, RADIO.y0 + 8, 58, 22, 3); ctx.fillStyle = '#140808'; ctx.fill(); ink(ctx, 2);
  for (let i = 0; i < 3; i++) dot(ctx, RADIO.x0 + 76 + (i % 2) * 8, RADIO.y0 + 12 + i * 9, 2.4, '#3a1210');   // the speaker grille
  box(ctx, 880, 136, 46, 34, '#e8e6e0', 6, 3, 0.18); dot(ctx, 896, 152, 10, '#2a2a33'); ctx.beginPath(); ctx.arc(896, 152, 10, 0, 7); ink(ctx, 2.5); dot(ctx, 893, 149, 3, '#9ab'); box(ctx, 897, 170, 12, 6, '#bbb', 1, 2, 0);
  // the cables down the dresser (radio, camera) to the rug — no plugs anywhere (Chikin: "the plug can go away")
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(RADIO.x0 + 6, RADIO.y1 - 4); ctx.quadraticCurveTo(724, 230, sx(7.1) + 14, sy(2.42) - 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(926, 166); ctx.quadraticCurveTo(958, 240, sx(8.45) + 18, sy(2.32) - 14); ctx.stroke();
  // the bed (front left, raised on its frame; the dark gap under it) and the toy chest (front right)
  drawBed(ctx, true); drawChest(ctx);
  return cv;
}

// the furniture he hides in/behind (he's always drawn over the room, so the shadows are what say 'hidden')
function drawBed(ctx, gap) { ctx.save();
    // the gap under it (the always-dark place: the pool over it is drawn live) and the frame's side rail just above it
    if (gap) { ctx.fillStyle = '#120d16'; ctx.fillRect(0, HEM, BEDX - 14, sy(0.42) - HEM + 6); }
    // the blanket: over the mattress, hanging down its side in a wavy hem, a crooked star print, one cel band
    const hem = []; for (let x = 0; x <= BEDX - 12; x += 12) hem.push([x, HEM - 5 + ((x / 12) % 2 ? 6 : 0)]);
    poly(ctx, [[0, BEDTOP + 6], [BEDX - 30, BEDTOP], [BEDX - 8, BEDTOP + 18], ...hem.slice().reverse()]);   // (down its right side, then the hem right to left)
    ctx.fillStyle = '#34528f'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { star4(ctx, 10 + i * 24 + j * 8, BEDTOP + 14 + j * 20, 5); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, HEM - 20, BEDX, 24); ctx.restore(); ink(ctx, 3.5);
    // the mattress's edge peeking at the top + the pillow-less foot; the front-right post (with its knob) down to the floor
    ctx.beginPath(); ctx.moveTo(4, BEDTOP + 16); ctx.quadraticCurveTo(BEDX * 0.5, BEDTOP + 8, BEDX - 26, BEDTOP + 12); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(18,10,5,0.5)'; ctx.stroke();
    box(ctx, BEDX - 16, BEDTOP - 6, 16, H - BEDTOP + 20, '#a8703f', 3, 3.5, 0.3); dot(ctx, BEDX - 8, BEDTOP - 10, 9, '#c88a5a'); ctx.beginPath(); ctx.arc(BEDX - 8, BEDTOP - 10, 9, 0, 7); ink(ctx, 3);
    // the foot end: the blanket's front hangs to the floor (he walks round it)
    poly(ctx, [[0, sy(0.42) + 4], [BEDX - 18, sy(0.42) - 2], [BEDX - 18, H], [0, H]]); ctx.fillStyle = '#2d4880'; ctx.fill(); ink(ctx, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { star4(ctx, 14 + i * 24 + j * 8, sy(0.42) + 18 + j * 20, 5); ctx.fill(); }
  ctx.restore(); }
function drawChest(ctx) {
  box(ctx, sx(7.45), sy(0.55), W - sx(7.45) + 20, H - sy(0.55) + 20, '#2f7d5b', 6, 4, 0.12); box(ctx, sx(7.45) - 6, sy(0.55) - 8, W - sx(7.45) + 30, 22, '#3b9a70', 5, 3.5, 0);
  for (const x of [sx(7.45) + 4, W - 20]) box(ctx, x, sy(0.55) - 6, 14, 18, '#e8c46a', 2, 2, 0); box(ctx, (sx(7.45) + W) / 2 - 12, sy(0.55) + 16, 24, 18, '#e8c46a', 3, 2.5, 0);
}
function drawBookAt(ctx, x, y, rot = 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); poly(ctx, [[-50, 0], [-6, -8], [-4, -66], [-48, -58]]); ctx.fillStyle = '#f2e6c8'; ctx.fill(); ink(ctx, 3); poly(ctx, [[50, 0], [6, -8], [4, -66], [48, -58]]); ctx.fillStyle = '#efe0bc'; ctx.fill(); ink(ctx, 3);
  dot(ctx, -26, -36, 10, '#e2574a'); ctx.fillStyle = '#4f8fc8'; poly(ctx, [[18, -20], [40, -20], [30, -44]]); ctx.fill(); ctx.restore(); }

// ---------------- the live things ----------------
function sky(ctx, t, Lt) {
  const Wn = WIN, w = Wn.x1 - Wn.x0, h = Wn.y1 - Wn.y0;
  ctx.save(); rr(ctx, Wn.x0, Wn.y0, w, h, 2); ctx.clip();
  const g = ctx.createLinearGradient(0, Wn.y0, 0, Wn.y1);
  if (Lt.sun > 0.5) { g.addColorStop(0, '#ffb8a0'); g.addColorStop(0.6, '#ffd9a0'); g.addColorStop(1, '#fff0c8'); }
  else if (Lt.blue > 0.02) { g.addColorStop(0, `rgb(${30 + 60 * Lt.blue},${40 + 70 * Lt.blue},${90 + 90 * Lt.blue})`); g.addColorStop(1, `rgb(${40 + 180 * Lt.blue * Lt.blue},${50 + 120 * Lt.blue},${110 + 60 * Lt.blue})`); }
  else { g.addColorStop(0, t < 3.35 ? '#05060f' : '#0e1838'); g.addColorStop(1, t < 3.35 ? '#0a0c1a' : '#22305e'); }
  ctx.fillStyle = g; ctx.fillRect(Wn.x0, Wn.y0, w, h);
  // stars (twinkle on the hats)
  if (Lt.sun < 0.5) { const hat = M ? M.hat(t) : 0; for (let i = 0; i < 18; i++) { const a = (1 - Lt.blue) * (0.4 + 0.6 * rnd(i, Math.floor(t * 2 + i))) * (0.7 + 0.3 * hat) * (1 - Lt.black); dot(ctx, Wn.x0 + rnd(i, 1) * w, Wn.y0 + rnd(i, 2) * h * 0.8, 1.2 + rnd(i, 3) * 1.2, `rgba(255,250,220,${a})`); } }
  // the moon: in the blinds from bedtime; the time-lapse arcs it out on the drop (103.57) and the night races
  let mx = Wn.x0 + w * 0.72, my = Wn.y0 + h * 0.32;
  if (t >= 101.6) { const k = clamp((t - 101.6) / (103.57 - 101.6)); mx = Wn.x0 + w * (0.72 - 0.95 * k); my = Wn.y0 + h * (0.32 - 0.25 * Math.sin(k * Math.PI)); }
  const mv = t < 3.35 ? 0.25 : Lt.sun > 0.5 ? 0 : (t >= 103.57 && t < 150 ? 0 : 1 - Lt.blue * 0.8);
  if (mv > 0) { glowAt(ctx, mx, my, 60, 'rgba(220,235,255,0.5)', mv * 0.8); dot(ctx, mx, my, 17, `rgba(244,244,226,${mv})`); dot(ctx, mx - 5, my - 3, 4, `rgba(200,200,190,${mv})`); dot(ctx, mx + 6, my + 5, 3, `rgba(200,200,190,${mv})`); }
  if (t >= 101.6 && t < 105.3) { for (let i = 0; i < 8; i++) { const k = ((t - 101.6) * 1.6 + i / 8) % 1; ctx.fillStyle = 'rgba(200,210,255,0.35)'; ctx.fillRect(Wn.x0 + w * (1 - k), Wn.y0 + h * rnd(i, 4) * 0.9, 50, 2); } }   // the night racing past
  // clouds (DARK, chorus 2's NIGHT)
  for (const [a, z] of [[65.40, 69.5], [145.9, 147.6], [90.2, 93.92]]) if (t >= a - 0.5 && t < z + 0.8) { const k = Math.min(ease((t - a + 0.5) / 0.8), ease((z + 0.8 - t) / 0.8)), cx = mx + (1 - k) * 120;
    ctx.fillStyle = `rgba(40,46,78,${0.95 * k})`; for (const [dx, dy, r] of [[-26, 4, 20], [0, -6, 26], [28, 4, 20], [6, 10, 22]]) dot(ctx, cx + dx, my + dy, r, ctx.fillStyle); }
  // the sunrise: the sun comes up over the sill
  if (Lt.sun > 0) { const sy0 = Wn.y1 + 30 - 90 * Lt.sun; glowAt(ctx, Wn.x0 + w * 0.4, sy0, 140, 'rgba(255,200,150,0.9)', Lt.sun); dot(ctx, Wn.x0 + w * 0.4, sy0, 30, `rgba(255,236,190,${Lt.sun})`); }
  if (t >= 150.98 && t < 165.74) { ctx.fillStyle = `rgba(255,200,120,${0.6 * ease((t - 150.98) / 2)})`; ctx.fillRect(Wn.x0, Wn.y1 - 5, w, 5); }   // the thin gold rim
  ctx.restore();
  // the blinds: tilted slats (light between them); in the morning they glow, then snap up
  const up = t >= 165.74 ? ease((t - 165.74) / 0.25) : 0, n = 9, gl = t >= 164.8 && t < 165.74 ? 0.5 + 0.5 * Math.sin((t - 164.8) * 20) : 0;
  for (let i = 0; i < n; i++) { const y = Wn.y0 + 6 + i * (h / n) * (1 - up * 0.92); ctx.fillStyle = gl ? `rgb(${232 + 20 * gl},${220 + 20 * gl},${196 + 30 * gl})` : '#e8dcc4';
    ctx.fillRect(Wn.x0 + 2, y, w - 4, 7 + 2 * up); ctx.strokeStyle = 'rgba(18,10,5,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(Wn.x0 + 2, y, w - 4, 7 + 2 * up); }
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Wn.x0 + w * 0.15, Wn.y0); ctx.lineTo(Wn.x0 + w * 0.15, Wn.y0 + 6 + (n - 1) * (h / n) * (1 - up * 0.92) + 9); ctx.stroke();   // the cord
}
// how far the door is open (0 shut … 1 wide) and how much light is behind it
function doorAt(t) {
  const P = Pp.P; let o = 0, l = 0;
  for (const L of Pp.looks) { const lvl = L.shape === 'crack' ? 0.14 : L.shape === 'half' ? 0.48 : 0.95;
    if (L.pause != null && t >= L.pause && t < L.t) { o = Math.max(o, lvl * 0.55); continue; }                // PAUSE: stopped dead mid-swing
    const a = L.t - 0.6 * P, z = L.slam != null ? L.slam : L.t + L.hold + 0.3;
    if (t >= a && t < z + 0.25) { const k = Math.min(ease((t - a) / (0.6 * P)), L.slam != null ? (t < L.slam ? 1 : 0) : ease((z + 0.25 - t) / 0.25)); o = Math.max(o, lvl * k); l = Math.max(l, k); } }
  for (const f of Pp.R.fakes) if (t >= f - 0.3 && t < f + 0.45) o = Math.max(o, 0.12 * Math.sin(clamp((t - f + 0.3) / 0.75) * Math.PI));   // REST, TIRED: starts… and stops
  if (t >= 131.3 && t < 151.4) o = Math.max(o, 0.09);                                                             // the joke + chorus 2: left open a crack (the torch)
  if (Pp.dare && t >= Pp.dare.t - 3 * P - 0.05 && t < Pp.dare.t) { const n = Math.floor((t - (Pp.dare.t - 3 * P)) / P) + 1; o = Math.max(o, 0.08 * n); }   // the dare: it creaks open a step a beat
  return { o, l };
}
function door(ctx, t, Lt) {
  const D = DOORPX, { o, l } = doorAt(t), w = D.x1 - D.x0;
  // behind it: the hall's light (or dark)
  ctx.fillStyle = '#0b0a10'; ctx.fillRect(D.x0, D.y0, w, D.y1 - D.y0);
  if (o > 0.01) { const gw = w * Math.min(1, o * 1.15); ctx.fillStyle = `rgba(255,${214 + 20 * l},${140 + 40 * l},${0.35 + 0.65 * Math.max(l, Lt.hall * 0.6)})`; ctx.fillRect(D.x1 - gw, D.y0, gw, D.y1 - D.y0);
    if (t >= 115.4 && t < 163.1 || (t >= 13.3 && t < 14.4)) { ctx.fillStyle = 'rgba(10,8,14,0.55)'; ctx.fillRect(D.x1 - gw * 0.8, D.y0 + 30, gw * 0.35, D.y1 - D.y0 - 30); } }   // a shadow out there (never a person)
  // the panel: hinged left, swinging into the room (its free edge comes toward us)
  const th = o * Math.PI * 0.46, fx = D.x0 + w * Math.cos(th), grow = Math.sin(th);
  poly(ctx, [[D.x0, D.y0], [fx, D.y0 - 14 * grow], [fx, D.y1 + 26 * grow], [D.x0, D.y1]]); ctx.fillStyle = '#d6c093'; ctx.fill(); ink(ctx, 3.5);
  if (fx - D.x0 > 30) { const pw = fx - D.x0; for (const [y0, y1] of [[0.1, 0.45], [0.55, 0.9]]) { poly(ctx, [[D.x0 + pw * 0.16, D.y0 + (D.y1 - D.y0) * y0], [D.x0 + pw * 0.84, D.y0 + (D.y1 - D.y0) * y0 - 6 * grow], [D.x0 + pw * 0.84, D.y0 + (D.y1 - D.y0) * y1 + 12 * grow], [D.x0 + pw * 0.16, D.y0 + (D.y1 - D.y0) * y1]]); ink(ctx, 2); } }
  // the handle: it clicks on the drops (41.80, 49.18) and turns a step a beat before the cue hits
  let hk = 0; for (const hT of Pp.R.handles) hk = Math.max(hk, pulse(t, hT, 0.3)); for (const c of Pp.cues) if (c.k === 'door' || c.k === 'dare') for (let n = 1; n <= 3; n++) hk = Math.max(hk, pulse(t, c.t - n * Pp.P, 0.25));
  const hx = fx - 14 * Math.cos(th), hy = (D.y0 + D.y1) / 2 + 18; ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.6 * hk); box(ctx, -12, -3, 16, 7, '#e8c46a', 3, 2, 0); ctx.restore(); dot(ctx, hx, hy, 4, '#e8c46a');
  // the line of hall light under it (brightens on BEDTIME, flares on the handles + snares, grows through builds)
  if (o < 0.05) { const sn = M ? M.snare(t) : 0, bd = M ? M.build(t, 0.4) : 0, k = clamp(Lt.hall * (0.7 + 0.25 * sn + 0.4 * bd) + hk * 0.6);
    if (k > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,140,${k})`; ctx.fillRect(D.x0 + 4, D.y1 - 4, w - 8, 4);
      glowAt(ctx, (D.x0 + D.x1) / 2, D.y1, 70, 'rgba(255,200,120,0.6)', k * 0.6); ctx.restore();
      if (span(t, 13.3, 14.3) || span(t, 115.4, 118.0) || span(t, 155.25, 160.76)) { const k2 = span(t, 13.3, 14.3) ? (t - 13.3) / 1.0 : 0.5, bx = D.x0 + w * (span(t, 13.3, 14.3) ? k2 : 0.5);   // a shadow in the line (feet out there)
        ctx.fillStyle = '#0b0a10'; ctx.fillRect(bx - 22, D.y1 - 5, 16, 6); ctx.fillRect(bx + 6, D.y1 - 5, 16, 6); } } }
}
function shelfLights(ctx, t, Lt) {
  // the glow-in-the-dark stars up by the ceiling: bright when the room's dark, twinkling on the hats
  const hat = M ? M.hat(t) : 0, a = clamp((Lt.dark - 0.35) * 1.6) * (1 - Lt.black * 0.6) * (1 - Lt.sun);
  if (a > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const x = 30 + i * 58 + rnd(i, 7) * 24, y = 14 + rnd(i, 8) * 24, k = a * (0.55 + 0.45 * rnd(i, Math.floor(t * 4 + i))) * (0.8 + 0.4 * hat);
    ctx.fillStyle = `rgba(190,255,200,${k})`; star4(ctx, x, y, 6 + rnd(i, 9) * 4, rnd(i, 3)); ctx.fill(); } ctx.restore(); }
  // the tiny sub in the tank: the only light at the very start (No Answer's last light)
  const sub = t < 3.35 ? 1 : 0.5; glowAt(ctx, 300, 82, 34, 'rgba(255,224,140,0.9)', sub * (0.7 + 0.3 * Math.sin(t * 3)));
  ctx.save(); ctx.translate(300, 82 + Math.sin(t * 1.3) * 2); ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, 7); ctx.fillStyle = '#f2c94c'; ctx.fill(); ink(ctx, 1.5); dot(ctx, 7, -1, 2, '#fff6c8'); ctx.restore();
}
function radioFace(ctx, t, s) {
  const R = Pp.R, ri = Pp.tg.findIndex(q => q.k === 'radio'), his = s.inf[ri] != null, col = his ? PURP : RED;
  let txt = clock(t), show = true;
  if (t >= 72.88 && t < 73.3) show = Math.floor(t * 12) % 2 === 0;                       // NAME: the digits blink once
  if (t >= 125.42 && t < 125.7) txt = '--:--';                                            // CLOCK: it jolts
  if (t >= R.radioOn) { const k = (t - R.radioOn) * 9, s2 = '      POTATO      '; txt = t < R.tally ? s2.substr(Math.floor(k) % 12, 6) : String(s.final ? s.final.total : s.score).padStart(6, ' ').slice(-6); }
  if (t >= 168.95 && t < R.radioOn) show = false;                                         // the dead stop
  const x = RADIO.x0 + 8, y = RADIO.y0 + 8; ctx.save(); ctx.translate(t >= 125.42 && t < 125.7 ? (rnd(1, Math.floor(t * 40)) - 0.5) * 4 : 0, 0);
  if (show) { ctx.font = `400 14px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillText(txt, x + 29, y + 12); }
  ctx.restore();
  if (his && t >= R.radioOn) glowAt(ctx, (RADIO.x0 + RADIO.x1) / 2, RADIO.y0 + 20, 60, 'rgba(154,82,255,0.8)', 0.4 + 0.2 * Math.sin(t * 6));
}
function cameraFace(ctx, t, s) {
  const cs = camState(Pp, s, t), ci = Pp.CAMI, his = s.inf[ci] != null && t >= s.inf[ci];
  if (his) { ctx.save(); ctx.beginPath(); ctx.arc(896, 152, 9, 0, 7); ctx.clip(); for (let i = 0; i < 26; i++) { ctx.fillStyle = rnd(i, Math.floor(t * 20)) < 0.5 ? '#ddd' : '#333'; ctx.fillRect(886 + rnd(i, 1) * 20, 142 + rnd(i, Math.floor(t * 30)) * 20, 3, 2); } ctx.restore();   // static
    dot(ctx, 918, 143, 3.5, PURP); return; }
  if (cs === 'live' || cs === 'dim') { let d = Math.atan2(s.y - CAMPOS.y, s.x - CAMPOS.x) - camAngle(Pp, t); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const near = clamp(1 - Math.abs(d) / 0.9), k = (cs === 'live' ? 1 : 0.55) * (0.6 + 0.4 * near); glowAt(ctx, 918, 143, 14 + 18 * near, 'rgba(255,60,48,0.9)', k); dot(ctx, 918, 143, 3.5 + 1.5 * near, near > 0.7 ? '#ff7a6a' : RED); }
  else if (cs === 'doze') dot(ctx, 918, 143, 3, Math.floor(t * 1.2) % 2 ? '#7a2020' : '#3a1010');
  else dot(ctx, 918, 143, 3, '#3a1010');
}

// ---------------- the ten (toys + gadgets): where they're drawn, his purple once they're his ----------------
const AT = { musicbox: [5.45, 1.3], globe: [1.3, 1.3], lamp: [0.55, 2.62], train: [6.7, 0.55], nightlight: [3.85, 2.86], vacuum: [6.55, 2.62], fridge: [-0.55, 2.62], tape: [3.4, 0.42] };
const DRAWER = { x: 844, y: 268 };
function toyPos(q, s, t) {   // where it is now (floating into the drawer when put away, back out in the morning)
  const a = AT[q.k]; if (!a) return null; let x = sx(a[0]), y = sy(a[1]); const i = q.i, away = s.away[i];
  if (away != null && q.toy) { const t0 = away <= 54.1 ? Pp.R.drawer[0] + i * 0.12 : away, k = ease((t - t0) / 1.1), back = t >= Pp.R.back ? ease((t - Pp.R.back - i * 0.08) / 0.9) : 0, kk = k * (1 - back);
    if (kk > 0) { const hx = x + (DRAWER.x - x) * kk, hy = y + (DRAWER.y - y) * kk - Math.sin(kk * Math.PI) * 70; return { x: hx, y: hy, sc: 1 - 0.5 * kk, gone: kk >= 0.99 }; } }
  return { x, y, sc: 1, gone: false };
}
function toy(ctx, q, s, t, Lt) {
  const i = q.i, his = s.inf[i] != null && t >= s.inf[i], off = !his && s.away[i] != null && t < Pp.R.back, sinceInf = his ? t - s.inf[i] : -1, kick = M ? M.kick(t) : 0;
  const pos = toyPos(q, s, t); if (!pos || pos.gone) return; const { x, y, sc } = pos;
  const lean = his ? clamp((s.x - (q.x)) * 0.08, -0.18, 0.18) : 0, hop = hopAt(s, t, q), awake = his && t >= Pp.R.back;
  const live = !off && t >= q.t0 - 0.01 && !his, lightA = (live ? 0.75 + 0.25 * kick : 0);
  const glint = (gx, gy) => { if (!his) return; dot(ctx, gx - 3, gy, 2.6, PURP); dot(ctx, gx + 3, gy, 2.6, PURP); if (sinceInf >= 0 && sinceInf < 0.6) glowAt(ctx, gx, gy, 40, 'rgba(154,82,255,0.9)', 1 - sinceInf / 0.6); };
  ctx.save(); ctx.translate(x, y - hop * 26); ctx.rotate(lean + (awake && t >= 181.93 && t < 183 ? (t - 181.93) * 6.283 : 0)); ctx.scale(sc, sc);
  const swirl = t >= Pp.R.swirl && t < Pp.R.swirl + 0.9 && his;
  switch (q.k) {
    case 'musicbox': box(ctx, -22, -24, 44, 24, '#e8a0b0', 4); ctx.beginPath(); ctx.moveTo(-22, -16); ctx.lineTo(22, -16); ink(ctx, 2);
      { const sp = his ? 0 : t * 3; ctx.save(); ctx.translate(0, -24); ctx.scale(Math.cos(sp), 1); poly(ctx, [[0, -4], [8, -2], [0, -26], [-8, -2]]); ctx.fillStyle = '#fff6f0'; ctx.fill(); ink(ctx, 2); ctx.restore(); dot(ctx, 0, -32, 5, '#fff6f0'); ctx.beginPath(); ctx.arc(0, -32, 5, 0, 7); ink(ctx, 2); }
      if (lightA) glowAt(ctx, 0, -20, 30, 'rgba(255,220,140,0.8)', lightA * 0.7); glint(0, -32); break;
    case 'globe': { const sp = his || (t >= 14.38 && t < 14.38 + 4 * Pp.P) ? 0 : t * 1.6; box(ctx, -5, -10, 10, 10, '#a8703f', 2, 2, 0); box(ctx, -16, -4, 32, 6, '#a8703f', 2, 2.5, 0);
      dot(ctx, 0, -32, 22, '#4f8fc8'); ctx.save(); ctx.beginPath(); ctx.arc(0, -32, 22, 0, 7); ctx.clip(); ctx.fillStyle = '#6ab86a'; for (let k = 0; k < 3; k++) { const ox = ((sp * 16 + k * 26) % 78) - 39; ctx.beginPath(); ctx.ellipse(ox, -36 + k * 8, 9, 6, 0.4, 0, 7); ctx.fill(); } ctx.restore();
      ctx.beginPath(); ctx.arc(0, -32, 22, 0, 7); ink(ctx, 3); if (lightA && t >= q.t0) glowAt(ctx, 0, -32, 40, 'rgba(160,220,255,0.8)', lightA * 0.5); glint(0, -34); break; }
    case 'lamp': { const on = Lt.lamp, flick = t >= 42.8 && t < 46.4 ? 0.6 + 0.4 * Math.sin(t * 17) : 1, purp = his;
      box(ctx, -18, -8, 36, 8, '#5a4a3a', 3, 2.5, 0); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-3, -150, 6, 144); ctx.beginPath(); ctx.rect(-3, -150, 6, 144); ink(ctx, 2.5);
      poly(ctx, [[-30, -150], [30, -150], [20, -190], [-20, -190]]); ctx.fillStyle = on > 0.1 ? (purp ? '#d9b8ff' : '#fbe7b0') : '#c8b890'; ctx.fill(); ink(ctx, 3);
      if (on > 0.01) { glowAt(ctx, 0, -160, 200, purp ? 'rgba(170,110,255,0.55)' : 'rgba(255,200,120,0.6)', on * flick * (0.85 + 0.15 * (M ? M.bass(t) : 0))); }
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(14, -4); ctx.quadraticCurveTo(40, 4, 52, -14); ctx.stroke(); if (his) glint(0, -168); break; }
    case 'train': { const run = live ? Math.sin(t * 2) * 6 : 0; ctx.translate(run, 0); box(ctx, -26, -22, 40, 18, '#d0453a', 4); box(ctx, 4, -36, 16, 16, '#d0453a', 3, 2.5); box(ctx, -22, -32, 8, 12, '#333', 2, 2, 0);
      for (const wx of [-18, -4, 10]) { dot(ctx, wx, -3, 6, '#2a2a33'); ctx.beginPath(); ctx.arc(wx, -3, 6, 0, 7); ink(ctx, 2); }
      if (live || (t < q.t0 && t > 54)) { glowAt(ctx, -30, -16, 40, 'rgba(255,240,170,0.9)', lightA || 0.6); dot(ctx, -27, -16, 4, '#fff4c0'); } glint(12, -30); break; }
    case 'nightlight': { const on = his ? (t < 88.58 ? 1 : 0) : (t >= 7.7 && t < 88.58 ? 1 : 0), purp = his;
      crown(ctx, 0, -6, 12, on ? (purp ? '#c9a7ff' : '#ffd24a') : '#8a7a5a');
      if (on) glowAt(ctx, 0, -10, 120, purp ? 'rgba(170,110,255,0.6)' : 'rgba(255,214,110,0.6)', Lt.nl * (0.7 + 0.3 * (M ? M.bass(t) : 0)) * (purp ? 1 : 1)); break; }
    case 'vacuum': { box(ctx, -34, -10, 68, 10, '#555c66', 3, 2.5, 0); ctx.beginPath(); ctx.ellipse(0, -14, 28, 10, 0, 0, 7); ctx.fillStyle = '#e4e4ea'; ctx.fill(); ink(ctx, 3);
      const c = his ? PURP : '#4fb4ff'; glowAt(ctx, 10, -17, 26, his ? 'rgba(154,82,255,0.9)' : 'rgba(80,180,255,0.9)', 0.8 + 0.2 * kick); dot(ctx, 10, -17, 3.5, c); break; }
    case 'fridge': { const open = (t >= 99.36 && t < 100.06) ? 1 : 0; box(ctx, -20, -64, 40, 64, '#f4f0ea', 5); ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(20, -40); ink(ctx, 2.5); box(ctx, 12, -58, 4, 12, '#bbb', 1, 1.5, 0); box(ctx, 12, -34, 4, 16, '#bbb', 1, 1.5, 0);
      const seam = t >= 93.92 && !off ? 0.5 + 0.5 * kick : 0; if (seam && !his) { ctx.fillStyle = `rgba(255,236,190,${seam})`; ctx.fillRect(-19, -41, 38, 2); }
      if (open) { poly(ctx, [[-20, -64], [-46, -70], [-46, 4], [-20, 0]]); ctx.fillStyle = '#e8e2d8'; ctx.fill(); ink(ctx, 2.5); glowAt(ctx, 0, -30, 70, his ? 'rgba(170,110,255,0.8)' : 'rgba(255,230,170,0.9)', 0.9); }
      glint(0, -50); break; }
    case 'tape': { const lid = t >= 108.62 ? 1 : 0, pop = t >= 110.94 ? ease((t - 110.94) / 0.15) : 0; box(ctx, -30, -26, 60, 26, '#3a6a8a', 4);
      for (const rx of [-12, 12]) { dot(ctx, rx, -13, 7, '#e8e2d8'); ctx.save(); ctx.translate(rx, -13); ctx.rotate(his ? t * 8 : 0); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ink(ctx, 2); ctx.restore(); }
      if (lid) { poly(ctx, [[-30, -26], [30, -26], [26, -40], [-26, -40]]); ctx.fillStyle = '#4a7a9a'; ctx.fill(); ink(ctx, 2.5); }
      if (pop > 0) { box(ctx, -18, -40 - 14 * pop, 36, 18, his ? '#d9c2ff' : '#f2e6c8', 2, 2.5, 0); if (!his) glowAt(ctx, 0, -46, 40, 'rgba(255,230,160,0.9)', pop * (0.7 + 0.3 * kick)); }
      glint(0, -13); break; }
  }
  if (swirl) glowAt(ctx, 0, -20, 60, 'rgba(154,82,255,0.9)', 1 - (t - Pp.R.swirl) / 0.9);
  if (t >= 162.14 && t < 163.1 && his) glowAt(ctx, 0, -20, 50, 'rgba(154,82,255,0.9)', 1 - (t - 162.14) / 0.96);   // the dare: every toy he made his freezes with him
  ctx.restore();
}
function hopAt(s, t, q) {   // the morning: his toys hop on the stabs (higher when he hops with them)
  if (s.inf[q.i] == null || t < Pp.R.back) return 0; let h = 0;
  for (let k = 0; k < Pp.R.stabs.length; k++) { const st = Pp.R.stabs[k], e = t - st; if (e >= 0 && e < 0.35) h = Math.max(h, Math.sin(e / 0.35 * Math.PI) * (s.hops[k] != null ? 1.3 : 0.6)); }
  return h;
}

// ---------------- the beams: dim (where the light will fall) and lit (it sees) ----------------
function rugClip(ctx) {   // the floor, minus the bed's foot and the toy chest (the light hits them, not through them)
  ctx.beginPath(); ctx.rect(0, FLOOR - 2, W, H - FLOOR + 2); ctx.rect(0, BEDTOP - 20, BEDX, H - BEDTOP + 20);
  ctx.rect(sx(7.45) - 6, sy(0.55) - 8, W, H); ctx.clip('evenodd'); }
function shapePath(ctx, b) {
  if (b.poly) { poly(ctx, b.poly.map(([x, y]) => [sx(x), sy(y)])); return; }
  if (b.c) { ctx.beginPath(); ctx.arc(sx(b.c[0]), sy(b.c[1]), b.c[2] * U, 0, 7); return; }
  const a = b.th, L = G.CAM_LEN, h = G.CAM_HALF + 0.03, ax = CAMPOS.x, ay = CAMPOS.y, r0 = G.CAM_BLIND;
  poly(ctx, [[sx(ax + Math.cos(a - h) * r0), sy(ay + Math.sin(a - h) * r0)], [sx(ax + Math.cos(a - h) * L), sy(ay + Math.sin(a - h) * L)], [sx(ax + Math.cos(a + h) * L), sy(ay + Math.sin(a + h) * L)], [sx(ax + Math.cos(a + h) * r0), sy(ay + Math.sin(a + h) * r0)]]);
}
function beams(ctx, t, s) {
  const BS = beamsAt(Pp, s, t), P = Pp.P;
  for (const b of BS) {
    const col = b.kind === 'torch' ? [255, 246, 214] : [255, 222, 150];
    ctx.save(); rugClip(ctx);
    if (b.dim) {   // the warning: its shape dim on the rug, the outline ticking brighter on each beat
      const bt = Pp.C.beatOf(t), tick = b.land != null ? Math.max(0, 1 - ((b.land - t) % P) / P * 3) : Math.max(0, 1 - (((bt % 1) + 1) % 1) * 3);
      const a0 = b.next ? 0.07 : 0.15 + 0.06 * b.k + 0.07 * tick;
      shapePath(ctx, b); ctx.fillStyle = `rgba(${col},${a0})`; ctx.fill();
      if (!b.next) { ctx.save(); shapePath(ctx, b); ctx.clip(); ctx.strokeStyle = `rgba(${col},${0.16 + 0.1 * tick})`; ctx.lineWidth = 5; const o = (t * 40) % 26;   // a hatch: "light lands here"
        ctx.beginPath(); for (let x = -H + o; x < W; x += 26) { ctx.moveTo(x, FLOOR); ctx.lineTo(x + (H - FLOOR) * 0.6, H); } ctx.stroke(); ctx.restore(); }
      shapePath(ctx, b); if (b.poly && b.L.shape === 'full') { const Q = b.poly.map(([x, y]) => [sx(x), sy(y)]); ctx.beginPath(); ctx.moveTo(...Q[0]); ctx.lineTo(...Q[3]); ctx.lineTo(...Q[2]); ctx.lineTo(...Q[1]); }
      ctx.setLineDash(b.kind === 'torch' && !b.locked || b.next ? [6, 6] : [12, 8]); ctx.lineDashOffset = -t * 30; ctx.lineWidth = 3 + 2.5 * tick; ctx.strokeStyle = `rgba(${col},${0.5 + 0.3 * b.k + 0.2 * tick})`; ctx.stroke(); ctx.setLineDash([]);
      if (b.kind === 'cam') { ctx.restore(); continue; } }
    else {   // lit: hard-edged gold out of its source, dust drifting in it
      ctx.globalCompositeOperation = 'lighter'; shapePath(ctx, b); const land = b.land != null ? pulse(t, b.land, 0.25) : 0, full = b.poly && b.L.shape === 'full';
      if (b.poly) { const g = ctx.createRadialGradient(DOORPX.x1 - 30, FLOOR, 20, DOORPX.x1 - 30, FLOOR, full ? 1000 : 700); g.addColorStop(0, `rgba(${col},${0.62 + 0.3 * land})`); g.addColorStop(1, `rgba(${col},${(full ? 0.3 : 0.26) + 0.2 * land})`); ctx.fillStyle = g; }
      else ctx.fillStyle = `rgba(${col},${0.36 + 0.3 * land})`;
      ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(${col},0.9)`;
      if (b.poly && !full) { const Q = b.poly.map(([x, y]) => [sx(x), sy(y)]); ctx.beginPath(); ctx.moveTo(...Q[0]); ctx.lineTo(...Q[3]); ctx.moveTo(...Q[1]); ctx.lineTo(...Q[2]); ctx.stroke(); }
      else if (!b.poly) ctx.stroke();   // (the torch's circle and the camera's wedge: hard-edged all round)
      ctx.save(); shapePath(ctx, b); ctx.clip(); ctx.fillStyle = 'rgba(255,250,230,0.55)'; for (let i = 0; i < 40; i++) { const dx = (rnd(i, 1) * W + t * 12 * (rnd(i, 2) - 0.5) * 4) % W, dy = FLOOR + ((rnd(i, 3) * (H - FLOOR) - t * 6) % (H - FLOOR) + (H - FLOOR)) % (H - FLOOR); ctx.fillRect(dx, dy, 2, 2); } ctx.restore(); }
    ctx.restore();
    // its source: the door's glow, the camera's beam down from the dresser, the torch's beam through the crack
    if (b.kind === 'cam' && !b.next) { const a = b.th, h = G.CAM_HALF + 0.03, d = 4.2, ax = CAMPOS.x, ay = CAMPOS.y, L0 = [sx(ax + Math.cos(a - h) * G.CAM_BLIND), sy(ay + Math.sin(a - h) * G.CAM_BLIND)],
        L1 = [sx(ax + Math.cos(a - h) * d), sy(ay + Math.sin(a - h) * d)], R1 = [sx(ax + Math.cos(a + h) * d), sy(ay + Math.sin(a + h) * d)], R0 = [sx(ax + Math.cos(a + h) * G.CAM_BLIND), sy(ay + Math.sin(a + h) * G.CAM_BLIND)];
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(CAMPX.x, CAMPX.y, (L1[0] + R1[0]) / 2, (L1[1] + R1[1]) / 2), A = b.lit ? 0.3 : 0.1;   // the light in the air: lens → the rug
      g.addColorStop(0, `rgba(${col},${A})`); g.addColorStop(1, `rgba(${col},${A * 0.35})`); ctx.fillStyle = g; poly(ctx, [[CAMPX.x, CAMPX.y], L0, L1, R1, R0]); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CAMPX.x, CAMPX.y); ctx.lineTo(...L1); ctx.moveTo(CAMPX.x, CAMPX.y); ctx.lineTo(...R1); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(${col},${b.lit ? 0.55 : 0.2})`; ctx.stroke(); ctx.restore(); }
    if (b.kind === 'torch') { const cx = sx(b.c[0]), cy = sy(b.c[1]), dx = DOORPX.x1 - 8, dy = 170; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(dx, dy, cx, cy);
      g.addColorStop(0, `rgba(255,246,214,${b.lit ? 0.5 : 0.18})`); g.addColorStop(1, `rgba(255,246,214,${b.lit ? 0.18 : 0.04})`); ctx.fillStyle = g; poly(ctx, [[dx, dy - 4], [dx, dy + 4], [cx + b.c[2] * U, cy], [cx - b.c[2] * U, cy]]); ctx.fill(); ctx.restore(); }
  }
}
// (each shadow is painted once, blurred, then laid over the beams every frame: the light never gets in; the sunrise fades them)
const BOOKPAGE = [[-50, 0], [-6, -8], [6, -8], [50, 0], [48, -58], [4, -66], [-4, -66], [-48, -58]];
let poolCv = null;
function pools() {
  if (poolCv) return poolCv; const mk = (draw) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.filter = 'blur(7px)'; draw(x); return cv; };
  const bed = mk(x => {   // under the bed: black in the gap, spilling a little out past the post onto the rug
    const y1 = sy(DARK.bed[1]) + 4, xr = sx(DARK.bed[2]);
    x.fillStyle = 'rgba(3,2,7,0.97)'; x.fillRect(-20, HEM - 4, BEDX, y1 - HEM + 4);
    const g = x.createLinearGradient(BEDX - 20, 0, xr + 18, 0); g.addColorStop(0, 'rgba(3,2,7,0.92)'); g.addColorStop(1, 'rgba(3,2,7,0)'); x.fillStyle = g;
    poly(x, [[BEDX - 20, HEM], [xr + 4, HEM + 10], [xr + 18, y1 - 6], [BEDX - 20, y1]]); x.fill(); });
  const chest = mk(x => {   // behind the chest: its cast shadow, a slanted block off its back edge (the hall light is out front-left)
    const x0 = sx(DARK.chest[0]), yb = sy(0.55) - 4, yt = sy(DARK.chest[3]); x.filter = 'blur(3px)';
    const g = x.createLinearGradient(0, yb, 0, yt); g.addColorStop(0, 'rgba(3,2,7,0.96)'); g.addColorStop(1, 'rgba(3,2,7,0.8)'); x.fillStyle = g;
    poly(x, [[sx(7.45) - 4, yb], [W + 10, yb], [W + 10, yt], [x0 - 4, yt]]); x.fill(); });
  const bk = mk(x => {   // behind the standing book: its shadow on the rug, cut round the book itself
    const bx = sx(BOOK.x), by = sy(BOOK.y), x0 = sx(DARK.book[0]), x1 = sx(DARK.book[2]), yt = sy(DARK.book[3]);
    const g = x.createLinearGradient(0, by - 6, 0, yt); g.addColorStop(0, 'rgba(3,2,7,0.95)'); g.addColorStop(0.7, 'rgba(3,2,7,0.85)'); g.addColorStop(1, 'rgba(3,2,7,0)'); x.fillStyle = g;
    x.beginPath(); x.moveTo(bx - 52, by - 2); x.lineTo(x0, yt + 12); x.lineTo(x0 + 22, yt); x.lineTo(x1 - 18, yt + 2); x.lineTo(x1, yt + 14); x.lineTo(bx + 52, by - 2); x.closePath(); x.fill();   // (it reaches back to the skirting: you can see it round the book)
    x.filter = 'none'; x.globalCompositeOperation = 'destination-out'; x.save(); x.translate(bx, by); poly(x, BOOKPAGE); x.fillStyle = '#000'; x.fill(); x.lineWidth = 4; x.stroke(); x.restore(); });
  return (poolCv = { bed, chest, bk });
}
function darkPools(ctx, t, Lt) {   // under the bed, behind the chest, behind the book: dark, always (the light never gets in)
  const P = pools(), a = clamp(1 - 0.85 * Lt.sun); if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.drawImage(P.bed, 0, 0); ctx.drawImage(P.chest, 0, 0); if (t >= Pp.R.book + 0.35) ctx.drawImage(P.bk, 0, 0); ctx.restore();
}
function book(ctx, t) {   // "the BOOK stays open": it falls off the shelf and lands standing open on the rug
  if (t < Pp.R.book) return; const k = clamp((t - Pp.R.book) / 0.35), x = sx(BOOK.x), y = sy(BOOK.y), fy = 120 + (y - 120) * (k * k), rot = (1 - k) * 2.4;
  drawBookAt(ctx, x, fy, rot);
  if (k >= 1 && t < Pp.R.book + 0.5) { ctx.save(); ctx.globalAlpha = 1 - (t - Pp.R.book - 0.35) / 0.15; ctx.strokeStyle = CREAM; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 60, y - Math.sin(a) * 14); ctx.lineTo(x + Math.cos(a) * 80, y - Math.sin(a) * 22); ctx.stroke(); } ctx.restore(); }
}
function drawer(ctx, t) {   // CS2: the bottom drawer opens and the toys he didn't reach float in; the morning: out they come
  const R = Pp.R, open = Math.max(span(t, R.drawer[0] - 0.3, R.drawer[1]) ? Math.min(ease((t - R.drawer[0] + 0.3) / 0.3), ease((R.drawer[1] - t) / 0.3)) : 0,
    span(t, R.back - 0.3, R.back + 1.4) ? Math.min(ease((t - R.back + 0.3) / 0.3), ease((R.back + 1.4 - t) / 0.4)) : 0,
    ...Pp.tg.filter(q => q.toy && R.drawer[1] < q.t1 && q.t1 < R.back).map(q => span(t, q.t1 - 0.2, q.t1 + 1.3) ? Math.min(ease((t - q.t1 + 0.2) / 0.2), ease((q.t1 + 1.3 - t) / 0.3)) : 0));
  const y = DR.y0 + 84 + open * 24, h = 30 + open * 8; box(ctx, DR.x0 + 10 - open * 8, y, DR.x1 - DR.x0 - 20 + open * 16, h, '#c88a5a', 3, 3, 0); dot(ctx, (DR.x0 + DR.x1) / 2, y + h / 2, 4, '#e8c46a');
  if (open > 0.05) { ctx.fillStyle = '#1a0e08'; ctx.fillRect(DR.x0 + 16 - open * 8, y + 3, DR.x1 - DR.x0 - 32 + open * 16, 6 * open); }
}

// ---------------- the story layer (behind him) ----------------
export function story(ctx, e) {
  const { t, s } = e; if (!s || !s.inf || !Pp) return; M = e.music || null; const Lt = light(t);
  // 1 the sky in the window · 2 the room · 3 the door · 4 the toys + things (surfaces) · 5 the night · 6 the lights · 7 the beams · 8 the dark pools
  sky(ctx, t, Lt); ctx.drawImage(base(), 0, 0); door(ctx, t, Lt); drawer(ctx, t);
  const order = ORDER || (ORDER = Pp.tg.filter(q => AT[q.k]).sort((a, b) => AT[b.k][1] - AT[a.k][1]));
  for (const q of order) toy(ctx, q, s, t, Lt);
  book(ctx, t);
  // the night: the room's own colours pushed toward the hour (one multiply over everything)
  if (Lt.dark > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; const [r, g, b] = Lt.tint, k = Lt.dark;
    ctx.fillStyle = `rgb(${Math.round(255 - (255 - r * 0.6) * k)},${Math.round(255 - (255 - g * 0.6) * k)},${Math.round(255 - (255 - b * 0.6) * k)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (Lt.sun > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(WIN.x0, WIN.y1, WIN.x0 + 200, H); g.addColorStop(0, `rgba(255,170,130,${0.22 * Lt.sun})`); g.addColorStop(1, 'rgba(255,170,130,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // the lights (after the night: they ARE light): the lamp's pool, the night-light, the moon's window on the rug, the hall
  const li = i => Pp.tg[i], lampI = Pp.tg.findIndex(q => q.k === 'lamp');
  if (Lt.lamp > 0.01) glowAt(ctx, sx(0.55), sy(2.0), 330, s.inf[lampI] != null ? 'rgba(170,120,255,0.35)' : 'rgba(255,190,110,0.35)', Lt.lamp * (0.85 + 0.15 * (M ? M.bass(t) : 0)));
  if (Lt.moon > 0.05 && Lt.sun < 0.5) { const sw = t >= 101.6 && t < 105.3 ? Math.sin((t - 101.6) / 3.7 * Math.PI) * 240 : 0;   // the moon's soft pool (no edges: soft light never sees); the time-lapse swings it like a sundial
    ctx.save(); ctx.translate((WIN.x0 + WIN.x1) / 2 + 40 - sw, FLOOR + 90); ctx.scale(2.6, 0.55); glowAt(ctx, 0, 0, 120, 'rgba(160,185,255,0.5)', 0.5 * Lt.moon); ctx.restore(); }
  shelfLights(ctx, t, Lt);
  radioFace(ctx, t, s); cameraFace(ctx, t, s);
  // re-light what glows in the dark (the toys' lights stay readable at night): a second pass of each lit toy's light
  if (Lt.dark > 0.4) for (const q of order) { const p = toyPos(q, s, t); if (!p || p.gone) continue; const his = s.inf[q.i] != null && t >= s.inf[q.i], live = s.away[q.i] == null && t >= q.t0 && !his;
    if (his) glowAt(ctx, p.x, p.y - 20, 28, 'rgba(154,82,255,0.8)', 0.55 * Lt.dark * (1 - Lt.sun));
    else if (live) glowAt(ctx, p.x, p.y - 20, 26, q.k === 'vacuum' ? 'rgba(80,180,255,0.8)' : 'rgba(255,220,150,0.8)', 0.5 * Lt.dark * (0.8 + 0.2 * (M ? M.kick(t) : 0))); }
  // where to stand: a soft ring on the rug by each toy that's waiting for him (it twinkles on the kick)
  for (const q of Pp.tg) { if (s.inf[q.i] != null || s.away[q.i] != null || t < q.t0 || t >= q.t1 || cutAt(Pp, t)) continue; const k = 0.35 + 0.35 * (M ? M.kick(t) : 0.5);
    ctx.save(); ctx.beginPath(); ctx.ellipse(sx(q.x), sy(q.y), 30, 9, 0, 0, 7); ctx.strokeStyle = `rgba(255,236,190,${k})`; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.restore(); }
  beams(ctx, t, s); darkPools(ctx, t, Lt);
  // the black: nothing but him, the vacuum's dot (and his purple)
  if (Lt.black > 0.01) { ctx.save(); ctx.globalAlpha = 0.9 * Lt.black; ctx.fillStyle = '#020205'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const vi = Pp.tg.findIndex(q => q.k === 'vacuum'), his = s.inf[vi] != null; const p = toyPos(Pp.tg[vi], s, t); glowAt(ctx, p.x + 10, p.y - 17, 30, his ? 'rgba(154,82,255,0.9)' : 'rgba(80,180,255,0.9)', Lt.black); dot(ctx, p.x + 10, p.y - 17, 3.5, his ? PURP : '#4fb4ff');
    for (const q of Pp.tg) if (s.inf[q.i] != null && q.k !== 'vacuum') { const pp = toyPos(q, s, t); if (pp && !pp.gone) { dot(ctx, pp.x - 3, pp.y - 24, 2, PURP); dot(ctx, pp.x + 3, pp.y - 24, 2, PURP); } } }
  // CS1's very start: only the sub
  if (t < 3.35) { ctx.save(); ctx.globalAlpha = 0.86 * (t < 3.2 ? 1 : 1 - (t - 3.2) / 0.15); ctx.fillStyle = '#010104'; ctx.fillRect(0, 0, W, H); ctx.restore(); glowAt(ctx, 300, 82, 40, 'rgba(255,224,140,0.9)', 1); }
  // the dare's flood: gold across everything, the door banging wide (and holding a beat on a room of plain toys)
  if (t >= 162.14 && t < 163.3) { const k = t < 162.4 ? 1 : 1 - (t - 162.4) / 0.9; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,140,${0.35 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // the spotlight of a CUT (the room turns to the thing): a vignette round it
  const cut = cutAt(Pp, t); if (cut) { const f = { 'cs2-lamp': [sx(0.55), 150], 'cs3-nightlight': [sx(3.85), FLOOR - 20], 'cs6-dare': [W / 2, H / 2 + 20], 'cs7-tally': [(RADIO.x0 + RADIO.x1) / 2, 150] }[cut[2]];
    if (f) { const k = Math.min(ease((t - cut[0]) / 0.6), ease((cut[1] - t) / 0.4)), g = ctx.createRadialGradient(f[0], f[1], 60, f[0], f[1], cut[2] === 'cs6-dare' ? 620 : 420); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.55 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
}

// ---------------- in front of him ----------------
function overFX(ctx, f, C) {
  const { s, t } = f; if (!s || !s.inf) return; const P = Pp.P, R = Pp.R, A = f.project(s.x, s.y + 0.62 + (s.hopY || 0)), cut = cutAt(Pp, t);
  // the light on him: lit by a beam that sees, he's washed gold (frozen: a plain toy in the light)
  if (s.lit && !s.seenAnim) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = s.frozen ? 0.18 : 0.3 + 0.15 * Math.sin(t * 30); const g = ctx.createRadialGradient(A.x, A.y, 10, A.x, A.y, 70); g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.fillRect(A.x - 80, A.y - 80, 160, 160); ctx.restore();
    if (!s.frozen && s.exposed > 0) { ctx.save(); ctx.strokeStyle = '#fff4d0'; ctx.lineWidth = 4; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(A.x, A.y, 58 - 30 * s.exposed / G.GRACE, 0, 7); ctx.stroke(); ctx.restore(); } }
  // infect rings: purple filling round the toy he's standing by
  for (const q of Pp.tg) { const p = s.prog[q.i]; if (!(p > 0.01) || s.inf[q.i] != null) continue; const c = f.project(q.x, q.y + 0.1);
    ctx.save(); ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(18,10,5,0.75)'; ctx.beginPath(); ctx.arc(c.x, c.y - 6, 30, 0, 7); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = PURP; ctx.beginPath(); ctx.arc(c.x, c.y - 6, 30, -Math.PI / 2, -Math.PI / 2 + p * 6.283); ctx.stroke();
    for (let i = 0; i < 4 * p; i++) { ctx.fillStyle = i % 2 ? MAG : GREEN; ctx.fillRect(c.x - 30 + rnd(i, Math.floor(t * 20)) * 60, c.y - 40 + rnd(i + 5, Math.floor(t * 20)) * 50, 6, 2); } ctx.restore(); }
  // an infect lands: purple runs from him into it, and his ten dots flash on his chest
  for (const q of Pp.tg) { const it = s.inf[q.i]; if (it == null || t < it || t - it > 1.3) continue; const e = t - it, p = toyPos(q, s, t) || { x: f.project(q.x, q.y).x, y: f.project(q.x, q.y).y - 60 };
    if (e < 0.35) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const k = clamp(e / 0.35 - i * 0.05), x = A.x + (p.x - A.x) * k, y = A.y + (p.y - 20 - A.y) * k + Math.sin(k * Math.PI) * -30; ctx.fillStyle = i % 2 ? PURP : MAG; ctx.fillRect(x - 8, y + (rnd(i, 1) - 0.5) * 18, 16, 3); } ctx.restore(); }
    const n = s.inf.filter(v => v != null && v <= t).length, a = fade(t, it, it + 1.3, 0.1, 0.3); ctx.save(); ctx.globalAlpha = a; sticker(ctx, A.x, A.y + 8, 112, 18, '#1a2a3a', 0, 4);
    for (let i = 0; i < 10; i++) { const x = A.x - 47 + i * 10.5; dot(ctx, x, A.y + 8, 3.3, i < n ? (i === n - 1 ? '#ffffff' : PURP) : '#33465a'); } ctx.restore(); }
  // the cue: a purple ring closes on him in three ticks; Space on the fourth beat
  for (const c of Pp.cues) { const done = s.cue[c.i]; if (t < c.show || (done && t > done.t + 0.5) || (!done && t > c.end + 0.1)) continue;
    if (done) { const k = (t - done.t) / 0.5; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = done.q === 2 ? '#ffffff' : done.q ? LILAC : '#6a6a7a'; ctx.lineWidth = 6 * (1 - k) + 1; ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.arc(A.x, A.y, 60 + 110 * k * (done.q ? 1 : 0.4), 0, 7); ctx.stroke(); if (done.q === 2) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r0 = 70 + 120 * k; ctx.beginPath(); ctx.moveTo(A.x + Math.cos(a) * r0, A.y + Math.sin(a) * r0); ctx.lineTo(A.x + Math.cos(a) * (r0 + 30), A.y + Math.sin(a) * (r0 + 30)); ctx.stroke(); } ctx.restore(); continue; }
    const bl = (c.t - t) / P, ticks = Math.min(3, Math.max(0, 4 - Math.ceil(bl - 1e-6))), Rr = 58 + 26 * Math.max(0, bl);
    ctx.save(); ctx.lineWidth = 9; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(A.x, A.y, Rr, 0, 7); ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = PURP; ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = k < ticks ? '#e8d9ff' : '#3a2a5a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.x - 16 + k * 16, A.y - Rr - 14, 5, 0, 7); ctx.fill(); ctx.stroke(); } ctx.restore(); }
  // the space bar, once: on his chest's level while the first full look is coming, till he's frozen once (an icon, no words)
  const L22 = Pp.looks.find(L => L.shape === 'full'); if (L22 && !s.frozeOnce && t >= L22.t - L22.warn && t < R.teachEnd) { const k = 0.75 + 0.25 * Math.sin(t * 12); ctx.save(); ctx.globalAlpha = k; sticker(ctx, A.x, A.y + 78, 78, 22, '#efe6cf', -0.03, 5); ctx.fillStyle = INK; ctx.fillRect(A.x - 24, A.y + 81, 48, 3);
    ctx.strokeStyle = PURP; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(A.x, A.y + 78, 40 + 6 * Math.sin(t * 12), 0, 7); ctx.stroke(); ctx.restore(); }
  // seen: the room's light goes bright and cold on him; his key winds down (the view tips him)
  if (s.seenAnim) { const e = t - s.seenAnim.t0; ctx.save(); ctx.globalAlpha = Math.min(0.35, e) * (s.seenAnim.bump ? 0.5 : 1); ctx.fillStyle = '#fff8e0'; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha = clamp(1 - e / 0.9); ctx.font = `400 22px ${MONO}`; ctx.fillStyle = PURP; ctx.textAlign = 'center'; ctx.fillText(['krrzzt', 'zzk—tk', 'tzzk…'][Math.floor(e * 6) % 3], A.x + 50, A.y - 70 - e * 30); ctx.restore(); }
  // a key rattle (Space too early in a CUT): a little purple twitch at his back
  if (t - s.rattleAt < 0.18) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURP; for (let i = 0; i < 3; i++) ctx.fillRect(A.x - 46 + (rnd(i, Math.floor(t * 40)) - 0.5) * 20, A.y - 10 + i * 8, 22, 3); ctx.restore(); }
  // the letterbox: CUT = control taken (the opening fades in from black instead)
  const lb = cut && cut[2] !== 'cs1-tank' ? Math.min(ease((t - cut[0]) / 0.3), cut[2] === 'cs7-tally' ? 1 : ease((cut[1] - t) / 0.3)) : 0;
  if (lb > 0.01) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 34 * lb); ctx.fillRect(0, H - 34 * lb, W, 34 * lb); }
  // the asides (DRAFT, Potato's ★ lines): a small terminal box by his head, in calm stretches only
  const AS = R.asides.slice(); if (s.knock != null) AS.push([s.knock + 1.0, s.knock + 3.2, R.knock]);
  for (const [a, b, txt] of AS) if (span(t, a, b)) { const k = fade(t, a, b, 0.12, 0.2), n = Math.min(txt.length, Math.floor((t - a) * 34)), bx = Math.min(W - 250, A.x + 60), by = Math.max(120, A.y - 96);
    ctx.save(); ctx.globalAlpha = k; ctx.font = `700 14px ${JB}`; const w = ctx.measureText(txt).width + 22; sticker(ctx, bx + w / 2, by, w, 28, '#0b0a12', -0.02, 4);
    ctx.fillStyle = GREEN; ctx.textBaseline = 'middle'; ctx.fillText(txt.slice(0, n) + (Math.floor(t * 3) % 2 && n >= txt.length ? '_' : ''), bx + 11, by + 1); ctx.restore(); }
  // the score: a crooked sticker slapped on the toy chest's lid (out of the lyrics' way), hidden in CUTs
  if (!cut && t > 5.6) { const bx = W - 126, by = H - 34; ctx.save(); sticker(ctx, bx, by, 220, 36, '#14101e', -0.03, 6); ctx.translate(bx, by); ctx.rotate(-0.03);
    ctx.font = `400 15px ${MONO}`; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText(String(s.score).padStart(6, '0'), -100, 1); ctx.fillStyle = s.mult > 1 ? '#ffe14a' : '#8a8496'; ctx.fillText('x' + s.mult, -20, 1);
    const n = s.inf.filter(v => v != null && v <= t).length; for (let i = 0; i < 10; i++) dot(ctx, 18 + i * 8.5, 1, 3, i < n ? PURP : '#3a3450'); ctx.restore(); }
  for (const p of s.pop) { const k = (t - p.t) / 0.8; if (k < 0 || k > 1) continue; ctx.save(); ctx.globalAlpha = 1 - k; ctx.font = `400 ${p.inf != null || p.cue ? 18 : 13}px ${MONO}`; ctx.lineWidth = 4; ctx.strokeStyle = INK; const tx = '+' + p.pts, x = A.x + 44, y = A.y - 66 - 40 * k;
    ctx.strokeText(tx, x, y); ctx.fillStyle = p.inf != null ? LILAC : p.cue === 2 || p.frz === 2 ? '#ffffff' : p.nose ? '#ffe14a' : GOLD; ctx.fillText(tx, x, y); ctx.restore(); }
  // the card (CS7): the radio rolled the score; the sticker card lands on the music
  if (t >= R.tally + 0.9) card(ctx, t, s, C);
}
function card(ctx, t, s, C) {
  const S = s.final || finalScore(C, s), k = ease((t - Pp.R.tally - 0.9) / 0.35), sc = 0.4 + 0.6 * k, kick = M ? M.kick(t) : 0;
  ctx.save(); ctx.translate(W / 2, 168); ctx.scale(sc * (1 + 0.012 * kick), sc * (1 + 0.012 * kick)); ctx.rotate(-0.03 * k); ctx.globalAlpha = k;
  sticker(ctx, 0, 0, 440, 250, '#f2ead8', 0, 10);   // (over the window: he stands at the front, under it)
  ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.font = `400 15px ${MONO}`; ctx.fillText('turn me off', -196, -98);
  ctx.font = `400 60px ${MONO}`; ctx.fillStyle = DPURP; ctx.fillText(`${S.n}/${S.of}`, -196, -42); ctx.font = `400 14px ${MONO}`; ctx.fillStyle = INK; ctx.fillText('of the room is his', -196, -4);
  ctx.font = `400 15px ${MONO}`; ctx.fillText(`score ${S.total}`, -196, 36); ctx.fillText(`best combo x${S.bestMult}`, -196, 60); ctx.fillText(`perfect hits ${S.perfects}/5`, -196, 84);
  ctx.save(); ctx.translate(136, -10); ctx.rotate(-0.18); ctx.strokeStyle = S.grade === 'S' ? DPURP : '#c8322c'; ctx.lineWidth = 6; ctx.strokeRect(-48, -48, 96, 96); ctx.font = `400 72px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = ctx.strokeStyle; ctx.fillText(S.grade, 0, 4); ctx.restore();
  if (S.clean) { ctx.save(); ctx.translate(134, 82); ctx.rotate(0.12); sticker(ctx, 0, 0, 96, 30, GREEN, 0, 8); ctx.font = `400 15px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('clean', 0, 1); ctx.restore(); }
  ctx.restore();
}
// (wired by the mode's view when the level opens: the story needs the schedule)
TMO.over = (ctx, f, C) => { if (!Pp || Pp.C !== C) Pp = prep(C); overFX(ctx, f, C); };
TMO.storyPrep = C => { Pp = prep(C); ORDER = null; };
// the sounds (play/sfx.mjs, under the song): the rules stay pure, this only listens to what happened
let heard = {}, lastT = -1, camD = 0;
const once = (k, v) => { if (heard[k] === v) return false; heard[k] = v; return true; };
TMO.sound = (f, C) => { const { s, t } = f; if (!s || !s.inf || f.videoMode) return; if (!Pp || Pp.C !== C) Pp = prep(C); const R = Pp.R, fresh = (at, w = 0.15) => at != null && t >= at && t - at < w;
  if (t < lastT - 0.5) heard = {}; const dt0 = t - lastT; lastT = t; if (dt0 <= 0 || dt0 > 0.25) return;   // (a seek or a pause: no catch-up burst)
  try {
    if (s.frozen && fresh(s.frzAt) && once('frz', s.frzAt)) { SFX.tink(); SFX.glitch(true); }                                   // a plain tin toy: tink
    if (fresh(s.seenAt, 0.2) && once('seen', s.seenAt)) SFX.powerDown();                                                       // caught: his key winds down
    if (fresh(s.rattleAt) && once('rat', s.rattleAt)) SFX.rattle();
    for (const q of Pp.tg) { const it = s.inf[q.i]; if (fresh(it) && once('inf' + q.i, it)) { SFX.whoosh(true); if (q.toy) SFX.squeak(); else SFX.beep(); } }
    for (const c of Pp.cues) { const d = s.cue[c.i]; if (d && fresh(d.t, 0.2) && once('cue' + c.i, d.t)) { if (d.q) SFX.note(d.q === 2); else SFX.flub && SFX.flub(); } }
    for (const L of Pp.looks) { if (L.demo) continue; const d0 = L.pause != null ? Math.min(L.pause, L.t - L.warn) : L.t - L.warn;
      if (fresh(d0) && once('dw' + L.i, 1)) SFX.creak(); if (L.slam != null && fresh(L.slam) && once('sl' + L.i, 1)) SFX.thud(); }   // the door creaks as its shape shows; the slam
    for (const h of R.handles) if (fresh(h) && once('h' + h, 1)) SFX.click();
    for (const F of Pp.torches) if (fresh(F.t) && once('to' + F.i, 1)) SFX.flick();
    for (const st of R.camera.steps) if (fresh(st) && camState(Pp, s, st) && once('cs' + st, 1)) SFX.clunk();                  // the camera's jerk per word
    { const cs = camState(Pp, s, t); if (cs === 'live' || cs === 'dim') { const d = camAngle(Pp, t) - camAngle(Pp, t - 1 / 60); if (camD && d * camD < 0 && Math.abs(d) > 1e-5 && once('ct', Math.round(t * 4))) SFX.beat(); if (Math.abs(d) > 1e-5) camD = d; } else camD = 0; }   // a tick on each turnaround
    if (fresh(3.35) && once('lamp', 1)) SFX.lampOn();
    if (fresh(59.12) && once('lampoff', 1)) SFX.lampOff();
    if (fresh(88.58) && once('nl', 1)) SFX.snuff();
    if ((fresh(R.drawer[0]) && once('dr', 1)) || (fresh(R.back) && once('dr2', 1))) SFX.drawer();
    if (fresh(R.radioOn) && once('radio', 1)) SFX.radio();
    if (t >= R.morning && fresh(s.hopAt) && once('hop', s.hopAt)) SFX.jump(false);
  } catch (e) { /* (no audio: fine) */ } };

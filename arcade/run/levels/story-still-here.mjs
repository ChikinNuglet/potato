// The music video for Still Here — ONE place: the top of the castle's outer wall, the wall-walk, seen side on from his level.
// Behind him the keep (five towers, ~60 warm windows), a telephone wire from the keep down to the moat, the moon. The antivirus
// dragon circles; the castle burns in steps to find him ("the whole castle should be on fire, its potato getting through the
// firewalls"); quarantine shutters slam; the dragon crashes through the timber roof for the fight; sunrise on a scorched,
// standing castle, the banner on the keep stitched in gold, one stitch per token he ate. (Plan: game/stories/still-here.md.)
// Two painters: story() draws the castle + every course thing behind him (stones, grates, beams, cages, tokens, bats, the slabs,
// the dragon); modeView().over() draws in front (the firewalls, the sword, the claw, the cue ring, letterbox, world text,
// asides, the token gauge, the card). Purple = his glitch only (the sword is his glitch). The antivirus speaks in cold white +
// alert red, a clean sans; he speaks in `> ` asides (DRAFT).
import { W, H, clamp, ease, rnd, span, glow } from '../story.mjs';
import { prep, batPos, headAt, beamY, eyeBox, cutAt, killEnd, G as RG, vAt } from '../modes/still-here.mjs';
import { SFX } from '../../play/sfx.mjs';
import { BLANK_Q } from '../blank.mjs';
// SET STRIP (Chikin, Nov 5: "the assets are supposed to go away" / "It's a setting, they have to fill the space",
// D-20261105-12/28): in the movie set (?blank) the previous-story props, signs, cards, gags and characters are not drawn;
// only the look stays (the castle, its fires, the night to dawn). ?oldprops shows them again in a blank run, to compare.
const SET = BLANK_Q && !(() => { try { return new URLSearchParams(location.search).has('oldprops'); } catch (e) { return false; } })();
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare

// ---- the song's own beat (the tracker in songs/still-here.audio.json, every 24th quarter): [s, quarter] ----
const TRK = [[0.067, 0], [8.0, 24], [15.933, 48], [23.867, 72], [31.733, 96], [39.633, 120], [47.533, 144], [55.433, 168], [63.333, 192], [71.267, 216],
  [79.167, 240], [87.067, 264], [94.967, 288], [102.867, 312], [110.767, 336], [118.7, 360], [126.667, 384], [134.6, 408], [142.533, 432], [150.5, 456], [158.433, 480]];
const lerpT = (A, x, i0, i1) => { let i = 0; while (i + 2 < A.length && A[i + 1][i0] <= x) i++; const a = A[i], b = A[i + 1]; return a[i1] + (b[i1] - a[i1]) * (x - a[i0]) / (b[i0] - a[i0]); };
export const Q = t => lerpT(TRK, t, 0, 1), QT = q => lerpT(TRK, q, 1, 0);
export const live = { castle: null };
const look = { C: null, P: null };     // set by modeView (browser): the course + the real camera's projection

const INK = '#0b0a10', GOLD = '#ffcf4a', GOLD2 = '#fff1a8', WARM = '#ffcf8a', FIRE = '#ff8a2a', FIRE2 = '#ffd36a', HOT = '#fff4d6', RED = '#ff3344',
  STEEL = '#5d7ea6', STEEL2 = '#8fb0d6', STEELD = '#2c3f5c', BONE = '#efe6d2', PURPLE = '#9a52ff', MAG = '#e03ccf', LILAC = '#c9a7ff', CREAM = '#ffe6c2',
  STONE = '#3a3540', STONE2 = '#5a5260', STONED = '#211d27', AV = '#eaf2ff', MONO = '"Major Mono Display", ui-monospace, monospace', SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';
const T_ = { lift: 31.73, found: 39.63, chorus: 42.27, quiet: 63.33, meter: 65.0, heater: 70.94, flare: 71.10, verse2: 73.90, bridge: 88.38, small: 91.30,
  stop: 95.55, ch2: 104.18, drop2: 105.50, quar: 110.77, dark1: 114.40, smoke: 116.06, dive: 124.68, siege: 126.67, ctl: 127.99, hush: 137.24, cut: 142.50,
  rain: 143.86, stopT: 147.84, sun: 150.50, end: 155.79 };
const MIXC = new Map(), RGB = new Map(), rgb = h => { let v = RGB.get(h); if (!v) { v = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); RGB.set(h, v); } return v; };
function mix(a, b, k) { k = Math.round(clamp(k) * 64) / 64; const key = a + b + k; let o = MIXC.get(key); if (o) return o; const A = rgb(a), B = rgb(b);   // (cached: called ~20× a frame)
  o = '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); if (MIXC.size > 4000) MIXC.clear(); MIXC.set(key, o); return o; }
const P = (x, y) => look.P ? look.P(x, y) : { x: (x - 0) * 90, y: H * 0.8 - y * 90 };
const killT = s => (s && s.killAt != null ? s.killAt : T_.cut);

// ---------- how burnt the castle is (0 asleep … 1 the whole skyline) and the sky ----------
function fireLvl(t, s) {
  if (t < T_.chorus) return 0; if (t < 60.7) return 0.28; if (t < T_.quiet) return 0.42; if (t < T_.verse2) return 0.32 + 0.1 * clamp((t - T_.heater) / 3);
  if (t < T_.quar) return 1; if (t < T_.smoke) return 1 - 0.85 * clamp((t - T_.quar) / 1.0); if (t < T_.siege) return 0.45; const k = killT(s);
  if (t < k) return 0.8; return 0.8 * (1 - clamp((t - k) / 1.6)); }
function skyCols(t, s) {
  const night = ['#060818', '#151634'], glowC = ['#140a18', '#5a1e14'], smoke = ['#07060a', '#1c0f0c'], red = ['#1a0505', '#6a120c'], grey = ['#24252d', '#565a63'], dawn = ['#2c3d6a', '#ffb070'];
  const L = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k)];
  if (t < T_.chorus) return L(night, glowC, clamp((t - T_.lift) / 10) * 0.25);
  if (t < T_.verse2) return L(night, glowC, 0.3 + 0.35 * fireLvl(t, s));
  if (t < T_.quar) return L(glowC, red, 0.3);
  if (t < T_.smoke) return L(glowC, smoke, clamp((t - T_.quar) / 1.0));
  if (t < T_.siege) return L(smoke, red, clamp((t - T_.smoke) / 4));
  const k = killT(s); if (t < k + 1.4) return red;
  if (t < T_.sun) return L(red, grey, clamp((t - k - 1.4) / 3));
  return L(grey, dawn, clamp((t - T_.sun) / 2.5));
}
// ---------- the keep: five towers + the great keep, ~60 windows, laid out once (screen px, relative to the keep's centre) ----------
const TOWERS = [{ x: -330, w: 70, h: 124 }, { x: -200, w: 88, h: 158 }, { x: 0, w: 150, h: 205, keep: true }, { x: 190, w: 86, h: 148 }, { x: 320, w: 72, h: 120 }];
const KH = 205;   // the great keep's height (px above its foot)
const WINS = []; TOWERS.forEach((T, ti) => { const cols = T.keep ? 4 : 2, rows = Math.floor((T.h - 70) / 34);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) WINS.push({ ti, x: T.x - T.w / 2 + (T.w / (cols + 1)) * (c + 1), y: -T.h + 62 + r * 34, z: rnd(WINS.length, 9), k: WINS.length }); });
const BURN_AT = [73.9, 60.7, 73.9, 42.27, 73.9];        // when each tower catches (the chorus pass, the second tower, then every one)
function winState(w, t, s) {   // 'lit' | 'dark' | 'burn' | 'shut' | 'warm'
  const sh = live.castle ? live.castle.shutters : [110.77, 111.1, 111.43, 111.76], burnT = BURN_AT[w.ti];
  if (t >= T_.sun) { const open = T_.sun + 0.15 + w.z * 1.6; return t >= open ? (w.z < 0.7 ? 'warm' : 'dark') : 'shut'; }
  const step = Math.min(3, Math.floor(w.z * 4)); if (t >= sh[step]) return 'shut';
  if (t >= burnT) return w.z < 0.55 ? 'burn' : 'dark';
  if (t >= 47.53 && t < 50.2 && w.ti >= 2 && w.z < 0.3 + (t - 47.53) * 0.25) return 'dark';   // "the last light blinks"
  return w.z < 0.82 ? 'lit' : 'dark';
}
function keepX(t, A) { return 600 - (A || 0) * 0.55; }   // it drifts slowly left all song: always the same castle

// ---------- the dragon (steel-blue plates, a plain white shield crest, one red scanner eye ringed with ticks) ----------
// drawn facing LEFT at (x, y) = its chest, scale k (1 ≈ 300 px wide). o: { flap 0..1, neck (rad), jaw 0..1, eye 'scan'|'lock'|'spin',
// cracks 0..3, throat 0..1, plate (lost chest plate), shadow (a flat silhouette), head: {x, y} (absolute, the eye) }
function dragon(ctx, x, y, k, o = {}) {
  const sil = !!o.shadow, ink = sil ? (o.silCol || '#05040a') : INK, fill = c => sil ? (o.silCol || '#05040a') : c;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const flap = o.flap ?? 0.5, wy = -60 - 70 * Math.sin(flap * Math.PI * 2);
  const wing = (dx, back) => { ctx.beginPath(); ctx.moveTo(dx + 10, -30); ctx.lineTo(dx + 70, wy - 50); ctx.lineTo(dx + 170, wy - 10); ctx.quadraticCurveTo(dx + 150, -10, dx + 175, 10);
    ctx.quadraticCurveTo(dx + 120, -5, dx + 110, 15); ctx.quadraticCurveTo(dx + 70, -10, dx + 55, 12); ctx.closePath();
    ctx.fillStyle = fill(back ? STEELD : '#3e5a80'); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.stroke();
    if (!sil) { ctx.strokeStyle = STEEL2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx + 70, wy - 50); ctx.lineTo(dx + 110, 15); ctx.moveTo(dx + 70, wy - 50); ctx.lineTo(dx + 55, 12); ctx.moveTo(dx + 120, wy - 30); ctx.lineTo(dx + 150, 0); ctx.stroke(); } };
  wing(30, true);
  // tail
  ctx.beginPath(); ctx.moveTo(90, 20); ctx.quadraticCurveTo(190, 40, 230, -10); ctx.lineTo(250, -18); ctx.lineTo(236, 6); ctx.quadraticCurveTo(190, 70, 80, 45); ctx.closePath();
  ctx.fillStyle = fill(STEEL); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.stroke();
  // body
  ctx.beginPath(); ctx.ellipse(40, 10, 92, 54, -0.08, 0, 7); ctx.fillStyle = fill(STEEL); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = ink; ctx.stroke();
  if (!sil) { ctx.fillStyle = STEEL2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-10 + i * 26, -22 + Math.abs(i - 2) * 4, 13, Math.PI, 0); ctx.fill(); }
    ctx.strokeStyle = STEELD; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(10 + i * 30, 18, 20, 0.3, Math.PI - 0.3); ctx.stroke(); }
    if (!o.plate) { ctx.save(); ctx.translate(-22, 10); ctx.beginPath(); ctx.moveTo(-18, -20); ctx.lineTo(18, -20); ctx.lineTo(18, 2); ctx.quadraticCurveTo(0, 24, 0, 24); ctx.quadraticCurveTo(-18, 14, -18, 2); ctx.closePath();
      ctx.fillStyle = '#f4f7fb'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }   // the plain white shield crest
    else { ctx.fillStyle = '#ff6a2a'; ctx.globalAlpha = 0.6 + 0.3 * Math.sin((o.t || 0) * 9); ctx.beginPath(); ctx.ellipse(-22, 10, 16, 18, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
  // legs
  ctx.fillStyle = fill(STEELD); for (const lx of [0, 70]) { ctx.beginPath(); ctx.moveTo(lx - 14, 40); ctx.lineTo(lx + 16, 40); ctx.lineTo(lx + 10, 78); ctx.lineTo(lx - 18, 80); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = ink; ctx.stroke(); }
  // neck + head (head given in absolute screen px: convert to local)
  let hx = -120, hy = -70; if (o.head) { hx = (o.head.x - x) / k; hy = (o.head.y - y) / k; }
  const nx0 = -50, ny0 = -20; ctx.beginPath(); ctx.moveTo(nx0 + 10, ny0 - 22); ctx.quadraticCurveTo((nx0 + hx) / 2 + 10, Math.min(ny0, hy) - 30, hx + 34, hy - 6);
  ctx.lineTo(hx + 30, hy + 26); ctx.quadraticCurveTo((nx0 + hx) / 2 + 20, Math.max(ny0, hy) + 10, nx0 + 26, ny0 + 30); ctx.closePath();
  ctx.fillStyle = fill(STEEL); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = ink; ctx.stroke();
  if (!sil && (o.throat || 0) > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = o.throat; ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 14; ctx.beginPath();
    ctx.moveTo(nx0 + 18, ny0 + 18); ctx.quadraticCurveTo((nx0 + hx) / 2 + 18, Math.max(ny0, hy) + 2, hx + 26, hy + 16); ctx.stroke(); ctx.restore(); }
  wing(-10, false);
  // the head: a wedge with a jaw, two horns, the eye
  ctx.save(); ctx.translate(hx, hy); const jaw = o.jaw || 0;
  ctx.beginPath(); ctx.moveTo(40, -24); ctx.lineTo(-38, -14); ctx.lineTo(-52, 2); ctx.lineTo(-30, 8); ctx.lineTo(36, 14); ctx.closePath(); ctx.fillStyle = fill(STEEL); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.stroke();
  ctx.save(); ctx.translate(30, 12); ctx.rotate(jaw * 0.5); ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(-74, 2); ctx.lineTo(-60, 14); ctx.lineTo(8, 16); ctx.closePath(); ctx.fillStyle = fill(STEELD); ctx.fill(); ctx.stroke(); ctx.restore();
  if (!sil && jaw > 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = FIRE2; ctx.globalAlpha = jaw; ctx.beginPath(); ctx.ellipse(-40, 12, 18, 7 + 10 * jaw, 0, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = fill(STEELD); for (const [a, b] of [[22, -22], [6, -20]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 26, b - 30); ctx.lineTo(a + 12, b + 2); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.stroke(); }
  // the scanner eye
  const er = 13, ec = sil ? RED : RED; ctx.beginPath(); ctx.arc(-6, -6, er + 5, 0, 7); ctx.fillStyle = sil ? '#05040a' : '#1a0a10'; ctx.fill();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = ec; ctx.globalAlpha = sil ? 0.9 : 1; ctx.beginPath(); ctx.arc(-6, -6, er, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd0d0'; ctx.beginPath(); ctx.arc(-9, -9, er * 0.35, 0, 7); ctx.fill(); ctx.restore();
  if (!sil) { const spin = o.eye === 'spin' ? (o.t || 0) * 7 : o.eye === 'lock' ? 0 : (o.t || 0) * 1.5; ctx.strokeStyle = AV; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const a = spin + i * Math.PI / 6; ctx.globalAlpha = i < 12 - 3 * (o.cracks || 0) ? 1 : 0.15; ctx.beginPath(); ctx.moveTo(-6 + Math.cos(a) * (er + 3), -6 + Math.sin(a) * (er + 3)); ctx.lineTo(-6 + Math.cos(a) * (er + 8), -6 + Math.sin(a) * (er + 8)); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    for (let c = 0; c < (o.cracks || 0); c++) { const a = c * 2.1 + 0.4; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-6 + Math.cos(a) * er * 0.6, -6 + Math.sin(a) * er * 0.6); ctx.lineTo(-6 + Math.cos(a + 0.4) * er * 1.05, -6 + Math.sin(a + 0.4) * er * 1.05); ctx.stroke(); } }
  ctx.restore();
  ctx.restore();
}
// where the far dragon is (screen px) and how it's posed, all song outside the fight
function farDragon(t, s, kx, base) {
  const sky = (cx, cy, rx, ry, w, ph) => ({ x: cx + rx * Math.cos(t * w + ph), y: cy + ry * Math.sin(t * w + ph), k: 0.32, flap: (t * 1.6) % 1, eye: 'scan' });
  if (t < 28.4) { const u = ((t - 6) % 11) / 11; if (t < 6 || u > 0.5) return null; return { x: 1040 - u * 2 * 1200, y: 80 + 30 * Math.sin(u * 7), k: 0.16, flap: (t * 1.2) % 1, shadow: true }; }
  if (t < 31.0) { const u = (t - 28.4) / 2.6; return { x: 1300 - u * 1900, y: 210, k: 1.6, flap: (t * 0.8) % 1, shadow: true, silCol: 'rgba(3,2,8,0.72)' }; }   // the huge shadow over the wall-walk
  if (t < T_.found) return sky(kx, 92, 380, 40, 0.7, 0);
  if (t < T_.chorus) { const u = ease((t - T_.found) / 1.4); return { x: 690 - 30 * u, y: 200 - 30 * u, k: 0.5 + 0.16 * u, flap: 0.25 + 0.05 * Math.sin(t * 2), eye: 'lock' }; }   // CS2: wings out over the keep
  if (t < T_.quiet) { // circling, swooping low over the wall on each breath
    const sw = live.castle ? live.castle.sweeps.find(q => t > q.t - 1.0 && t < q.t + 0.7) : null;
    if (sw) { const u = (t - (sw.t - 1.0)) / 1.7; return { x: 1150 - u * 1400, y: 110 + 170 * Math.sin(u * Math.PI), k: 0.5, flap: (t * 2.2) % 1, jaw: span(t, sw.t - 0.15, sw.t + 0.3) ? 1 : 0.2, eye: 'lock' }; }
    if (t < T_.chorus + 1.4) { const u = (t - T_.chorus) / 1.4; return { x: kx + 200 - u * 500, y: 130 + 60 * Math.sin(u * 3), k: 0.48, flap: (t * 2) % 1, jaw: 0.6, eye: 'lock' }; }
    return sky(kx, 90, 420, 45, 0.55, 1.0); }
  if (t < T_.verse2) { const inh = clamp((t - T_.heater) / 2.6); return { x: kx + 30, y: base - KH - 28, k: 0.34, flap: 0.05, perch: true, jaw: t > T_.heater + 2.2 ? 1 : 0.5 * inh, throat: inh, eye: 'lock' }; }   // perched on the keep
  if (t < T_.verse2 + 1.3) { const u = (t - T_.verse2) / 1.3; return { x: kx + 380 - u * 760, y: 80, k: 0.46, flap: (t * 2) % 1, jaw: 1, throat: 1, eye: 'lock' }; }   // one breath across the skyline
  if (t < T_.stop) return sky(kx, 88, 460, 40, 0.5, 2.0);
  if (t < T_.ch2) { return { x: 700 + 60 * Math.sin(t * 0.9), y: 120 + 20 * Math.sin(t * 1.7), k: 0.62, flap: (t * 1.4) % 1, eye: 'scan' }; }   // stop-time: hovering in the smoke
  if (t < T_.smoke) { const sw = live.castle ? live.castle.sweeps.find(q => t > q.t - 1.0 && t < q.t + 0.7) : null;
    if (sw) { const u = (t - (sw.t - 1.0)) / 1.7; return { x: 1150 - u * 1400, y: 110 + 170 * Math.sin(u * Math.PI), k: 0.5, flap: (t * 2.2) % 1, jaw: 1, eye: 'lock' }; }
    return sky(kx, 90, 420, 40, 0.6, 3.0); }
  if (t < T_.dive) return sky(kx, 80, 360, 35, 0.5, 0.5);
  if (t < T_.siege) { const u = (t - T_.dive) / (T_.siege - T_.dive); return { x: 1100 - u * 600, y: 60 + 40 * u, k: 1.0 + 0.6 * u, flap: (t * 1.5) % 1, shadow: true, silCol: 'rgba(3,2,8,0.75)' }; }   // its shadow over the roof
  return null;
}

// ---------- the banner on the keep: STILL HERE in gold stitches, one per token he ate ----------
const OLD_BANNER = (() => { try { return new URLSearchParams(location.search).has('banner'); } catch (e) { return false; } })();
const FONT = { S: ['01110', '10001', '10000', '01110', '00001', '10001', '01110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'] };
const DOTS = (() => { const d = []; ['STILL', 'HERE'].forEach((wd, row) => { const step = 3.6, adv = 6 * step, x0 = -(wd.length * adv - step) / 2;
  [...wd].forEach((ch, i) => { const g = FONT[ch]; for (let c = 0; c < 5; c++) for (let r = 0; r < 7; r++) if (g[r][c] === '1') d.push({ x: x0 + i * adv + c * step, y: row * 30 + r * step }); }); });
  // (the stitch order is spread over every letter — a half-stitched banner reads STILL HERE in faint thread with gold through it, never "STILL HER")
  const o = d.map((p, i) => ({ p, k: rnd(i, 77) })).sort((a, b) => a.k - b.k).map(q => q.p); return o; })();
function banner(ctx, x, y, t, s, sunK) {
  const Pp = look.C ? prep(look.C) : null, got = s.gotN ?? (s.got ? s.got.reduce((a, v) => a + v, 0) : 0), n = Pp ? Pp.nTok : 1;
  const lit = Math.min(DOTS.length, Math.floor(got / Math.max(1, n) * DOTS.length + 1e-6)), sway = Math.sin(t * 0.8) * 2;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(58, 0); ctx.lineTo(58, 70 + sway); ctx.lineTo(0, 84 + sway); ctx.lineTo(-58, 70 + sway); ctx.closePath();
  ctx.fillStyle = mix('#3a0f12', '#8a2a1c', sunK); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#6a4a22'; ctx.fillRect(-62, -4, 124, 6);
  if (OLD_BANNER) for (let i = 0; i < DOTS.length; i++) { const d = DOTS[i]; ctx.fillStyle = i < lit ? (t > T_.end + 1.2 && i === lit - 1 ? PURPLE : GOLD) : 'rgba(232,196,120,0.30)';   // the footprint: his last stitch is purple · (unstitched: faint thread)
    ctx.fillRect(d.x - 1.3, 10 + d.y + sway * (d.y / 60), 2.6, 2.6); }
  ctx.restore();
}

// ---------- the course things (behind him) ----------
function coin(ctx, x, y, r, t, big, kind) {
  ctx.save(); ctx.translate(x, y); const sq = Math.abs(Math.cos(t * 3 + x * 0.05)) * 0.6 + 0.4; ctx.scale(sq, 1);
  if (OLD_WHITE) { ctx.beginPath(); ctx.arc(0, 0, r + 3, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r - 2.5, 0, 7); ctx.fillStyle = kind === 'gold' ? '#ffb32a' : GOLD; ctx.fill();
  ctx.fillStyle = GOLD2; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.32, 0, 7); ctx.fill();
  if (big || kind === 'gold') { ctx.strokeStyle = '#b07a10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, 7); ctx.stroke(); }
  if (kind === 'gold') { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, 7); ctx.fill(); }
  ctx.restore();
}
function bat(ctx, x, y, u, t, carry, big) {
  const fl = Math.sin(t * 22) ; ctx.save(); ctx.translate(x, y);
  glow(ctx, 0, 0, u * 0.9, '#ff9a4a', 0.35);
  ctx.lineJoin = 'round'; ctx.beginPath(); const wy = -u * 0.32 * fl;
  ctx.moveTo(0, -u * 0.05); ctx.lineTo(-u * 0.5, wy - u * 0.12); ctx.lineTo(-u * 0.38, wy * 0.4 + u * 0.06); ctx.lineTo(-u * 0.22, u * 0.04); ctx.lineTo(0, u * 0.12);
  ctx.lineTo(u * 0.22, u * 0.04); ctx.lineTo(u * 0.38, wy * 0.4 + u * 0.06); ctx.lineTo(u * 0.5, wy - u * 0.12); ctx.closePath();
  ctx.fillStyle = BONE; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, u * 0.12, u * 0.15, 0, 0, 7); ctx.fillStyle = '#d8ccb4'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff6a2a'; ctx.fillRect(-u * 0.06, -u * 0.05, u * 0.04, u * 0.04); ctx.fillRect(u * 0.02, -u * 0.05, u * 0.04, u * 0.04);
  ctx.restore(); if (carry) coin(ctx, x, y + u * 0.28, big ? u * 0.17 : u * 0.12, t, big);
}
function flames(ctx, x, y, w, h, t, seed, a = 1) {   // a row of cartoon flames (ink outline, orange, a hot core)
  if (a <= 0.02 || h < 2) return; ctx.save(); ctx.globalAlpha = a; const n = Math.max(2, Math.round(w / 22));
  for (let i = 0; i < n; i++) { const fx = x - w / 2 + (i + 0.5) * w / n, fh = h * (0.6 + 0.4 * rnd(i, seed)) * (0.85 + 0.15 * Math.sin(t * 9 + i * 2.1 + seed)), fw = w / n * 0.75;
    ctx.beginPath(); ctx.moveTo(fx - fw, y); ctx.quadraticCurveTo(fx - fw, y - fh * 0.6, fx + Math.sin(t * 7 + i) * fw * 0.4, y - fh); ctx.quadraticCurveTo(fx + fw, y - fh * 0.6, fx + fw, y); ctx.closePath();
    ctx.fillStyle = FIRE; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx - fw * 0.45, y); ctx.quadraticCurveTo(fx, y - fh * 0.75, fx + fw * 0.45, y); ctx.fillStyle = FIRE2; ctx.fill(); }
  ctx.restore();
}

// a slab of the roof come down: a crooked roof beam on top (the step), a jumble of broken stone and timber under it, thick ink.
// (the beam's top edge stays level: it's what he stands on.) hot = a jet is coming for this height (it glows red)
function rubble(ctx, a, b, u, seed, hot = 0) {
  const w = b.x - a.x, h = b.y - a.y, j = k => rnd(seed, k) - 0.5; ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const pts = [[a.x + 8 + j(1) * 10, a.y + 0.28 * u], [a.x - 6 + j(2) * 12, a.y + h * 0.5], [a.x - 14 + j(3) * 10, b.y + 2], [b.x + 14 + j(4) * 10, b.y + 2], [b.x + 6 + j(5) * 12, a.y + h * 0.45], [b.x - 8 + j(6) * 10, a.y + 0.28 * u]];
  const poly = q => { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); };
  poly(pts); if (OLD_WHITE) { ctx.lineWidth = 14; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.fillStyle = '#2e2630'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // broken stones in the pile
  for (let k = 0; k < 4; k++) { const cx = a.x + w * (0.18 + 0.22 * k) + j(10 + k) * 14, cy = a.y + 0.45 * u + (h - 0.5 * u) * (0.35 + 0.5 * rnd(seed, 20 + k)), r = Math.min(0.26 * u, 6 + 0.25 * h * (0.6 + 0.4 * rnd(seed, 30 + k)));
    ctx.beginPath(); for (let v = 0; v < 6; v++) { const an = v / 6 * 6.283 + j(40 + k), rr = r * (0.75 + 0.5 * rnd(seed, 50 + v + k * 6)); v ? ctx.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.75) : ctx.moveTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.75); }
    ctx.closePath(); ctx.fillStyle = k % 2 ? STONE2 : '#4a4250'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  // a cross timber jammed through it
  if (h > 0.5 * u) { ctx.save(); ctx.translate(a.x + w * 0.5, a.y + h * 0.62); ctx.rotate(0.5 + j(60) * 0.5); const L = Math.min(w * 0.75, h * 1.1);
    ctx.fillStyle = '#5a3420'; ctx.fillRect(-L / 2, -0.07 * u, L, 0.14 * u); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(-L / 2, -0.07 * u, L, 0.14 * u); ctx.restore(); }
  // the roof beam on top: thick, a little crooked at its broken ends, grain + nail heads
  const bt = a.y, bh = 0.32 * u, l = a.x - 10, r = b.x + 10; ctx.beginPath(); ctx.moveTo(l + 6, bt); ctx.lineTo(r - 2, bt); ctx.lineTo(r + 10, bt + bh * 0.3); ctx.lineTo(r - 4, bt + bh * 0.55); ctx.lineTo(r + 4, bt + bh);
  ctx.lineTo(l, bt + bh + 3 * j(70)); ctx.lineTo(l - 10, bt + bh * 0.6); ctx.lineTo(l + 2, bt + bh * 0.4); ctx.lineTo(l - 6, bt + bh * 0.15); ctx.closePath();
  if (OLD_WHITE) { ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.fillStyle = hot > 0 ? mix('#6a4026', '#c0301e', 0.35 + 0.35 * hot) : '#6a4026'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.strokeStyle = '#4a2a18'; ctx.lineWidth = 2.5; for (let g = 0; g < 2; g++) { ctx.beginPath(); ctx.moveTo(l + 12, bt + bh * (0.35 + 0.3 * g)); ctx.quadraticCurveTo((l + r) / 2, bt + bh * (0.3 + 0.3 * g) + j(80 + g) * 6, r - 12, bt + bh * (0.4 + 0.25 * g)); ctx.stroke(); }
  ctx.fillStyle = INK; for (const fx of [0.12, 0.88]) { ctx.beginPath(); ctx.arc(l + (r - l) * fx, bt + bh * 0.5, 3.2, 0, 7); ctx.fill(); }
  ctx.restore();
}
// the dragon's jet in the fight: a flat river of fire from its mouth across one height of the arena (the glitch can't pass it)
function jet(ctx, sp, t, s, Pp, project) {
  const k = (t - (sp.t - 0.15)) / 0.15, out = clamp((sp.t + 0.45 - t) / 0.2); if (k <= 0 || out <= 0) return;
  const lo = sp.jet === 'high' ? 1.95 : -0.05, hi = sp.jet === 'high' ? 3.9 : 1.15, y0 = project(0, hi).y, y1 = project(0, lo).y, mx = look.mouth ? look.mouth.x : W + 40, x0 = mx - (mx + 60) * ease(clamp(k));
  ctx.save(); ctx.globalAlpha = out; const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(255,120,30,0.0)'); g.addColorStop(0.18, FIRE); g.addColorStop(0.5, HOT); g.addColorStop(0.82, FIRE); g.addColorStop(1, 'rgba(255,120,30,0.0)');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, mx - x0, y1 - y0);
  for (let i = 0; i < 14; i++) { const fx = x0 + (mx - x0) * (i + 0.5) / 14; flames(ctx, fx, y0 + 18, 70, 46, t, i + sp.i * 5, 0.9); }
  ctx.strokeStyle = 'rgba(60,10,0,0.5)'; ctx.lineWidth = 3; for (let r = 1; r < 4; r++) { const yy = y0 + (y1 - y0) * r / 4 + Math.sin(t * 30 + r) * 4; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(mx, yy); ctx.stroke(); }
  ctx.restore();
}
export function story(ctx, e) {
  const { t, s } = e; if (!look.C) return; look.mouth = null;
  const C = look.C, Pp = prep(C), K = Pp.K, M = e.music, A = Pp.A(t);
  const z0 = P(0, 0), z1 = P(1, 0), u = Math.abs(z1.x - z0.x) || 90, floorY = P(A, 0).y;
  const kick = M ? M.kick(t) : 0, snare = M ? M.snare(t) : 0, bass = M ? M.bass(t) : 0;
  const F = fireLvl(t, s), [sk0, sk1] = skyCols(t, s), sunK = clamp((t - T_.sun) / 2.5);
  const zk = u / 90;
  // ---- sky ----
  { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sk0); g.addColorStop(0.75, sk1); g.addColorStop(1, sk1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  // stars + the moon (night) / the sun (dawn)
  const moonA = t < T_.quar ? 1 - 0.7 * F : t < T_.sun ? 0.15 : 0;
  if (moonA > 0.05) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 50; i++) { const sx = rnd(i, 11) * W, sy = rnd(i, 12) * 260; ctx.globalAlpha = moonA * (0.3 + 0.5 * rnd(i, 13)) * (0.7 + 0.3 * Math.sin(t * 2 + i)); ctx.fillRect(sx, sy, 2, 2); } ctx.globalAlpha = 1;
    ctx.save(); ctx.globalAlpha = moonA; glow(ctx, 790, 92, 140, '#cfe0ff', 0.25); ctx.beginPath(); ctx.arc(790, 92, 46, 0, 7); ctx.fillStyle = '#f4efe0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = '#d9d0bc'; for (const [a, b, r] of [[-14, -8, 9], [12, 10, 7], [6, -18, 5]]) { ctx.beginPath(); ctx.arc(790 + a, 92 + b, r, 0, 7); ctx.fill(); } ctx.restore(); }
  if (t >= T_.sun - 0.2) { const k = ease((t - T_.sun + 0.2) / 2.2), sy = floorY - 240 * zk - 90 * k + 120; glow(ctx, 170, sy, 380, '#ffd27a', 0.55 * k);
    ctx.save(); ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(170, sy, 58, 0, 7); ctx.fillStyle = '#ffe28a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    if (span(t, T_.sun, T_.sun + 0.5)) { ctx.fillStyle = '#fff6e0'; ctx.globalAlpha = 0.6 * (1 - (t - T_.sun) / 0.5); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } }
  // far hills
  { const hy = floorY - 1.55 * u; ctx.fillStyle = mix(mix('#0c0d1c', '#1c1014', F * 0.6), '#3a3048', sunK * 0.6); ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, hy - 40 - 26 * Math.sin(x * 0.006 + 1) - 14 * Math.sin(x * 0.017)); ctx.lineTo(W, H); ctx.fill(); }
  // ---- the keep ----
  const kx = keepX(t, A), kb = floorY - 1.25 * u;   // its foot hides behind the parapet
  const fd = look.C.def.blank ? null : farDragon(t, s, kx, kb);   // (?blank: no dragon — game/playthroughs/README.md)
  const sunT = (x) => t >= T_.sun;
  // the telephone wire: from the keep down into the moat (there all along; No Answer's hand-off)
  // (SET: out. Chikin: "the assets are supposed to go away": it was the hand-off to the old No Answer, that story is gone)
  if (!SET) { ctx.strokeStyle = '#08070c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kx + 360, kb - 150); ctx.quadraticCurveTo(kx + 520, kb - 40, kx + 700, kb + 30); ctx.stroke();
  ctx.fillStyle = '#08070c'; ctx.fillRect(kx + 356, kb - 158, 4, 160); }
  for (let ti = 0; ti < TOWERS.length; ti++) { const T = TOWERS[ti], x0 = kx + T.x - T.w / 2, top = kb - T.h;
    const scorch = t >= T_.sun ? 0.75 : clamp((t - BURN_AT[ti]) / 20) * 0.8;
    ctx.fillStyle = mix(mix('#2c2836', '#1a1416', scorch), '#4a4250', sunK * 0.4); ctx.fillRect(x0, top, T.w, T.h + 40);
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(x0, top, T.w, T.h + 40);
    // crenellations / a roof
    if (!T.keep) { const roofGone = t >= T_.sun && (ti === 1 || ti === 3); if (!roofGone) { ctx.beginPath(); ctx.moveTo(x0 - 8, top); ctx.lineTo(x0 + T.w / 2, top - T.w * 0.75); ctx.lineTo(x0 + T.w + 8, top); ctx.closePath();
      ctx.fillStyle = mix('#3a2a3a', '#120c10', scorch); ctx.fill(); ctx.stroke(); } }
    else { for (let i = 0; i < 5; i++) { ctx.fillStyle = mix('#2c2836', '#1a1416', scorch); ctx.fillRect(x0 + i * T.w / 4.5, top - 18, T.w / 9, 18); ctx.strokeRect(x0 + i * T.w / 4.5, top - 18, T.w / 9, 18); } }
  }
  // windows
  for (const w of WINS) { const st = winState(w, t, s), x = kx + w.x - 6, y = kb + w.y;
    if (st === 'shut') { const slam = (live.castle ? live.castle.shutters : [0, 0, 0, 0])[Math.min(3, Math.floor(w.z * 4))], k = clamp((t - slam) / 0.12);
      ctx.fillStyle = t > T_.smoke && t < T_.sun ? mix('#3c3a40', '#7a2a18', 0.4 + 0.2 * Math.sin(t * 3 + w.k)) : '#3c3a40'; ctx.fillRect(x, y, 12, 18 * k); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x, y, 12, 18 * k);
      ctx.fillStyle = '#8a8890'; ctx.fillRect(x + 2, y + 3, 2, 2); ctx.fillRect(x + 8, y + 3, 2, 2); continue; }
    if (st === 'dark') { ctx.fillStyle = '#0a0810'; ctx.fillRect(x, y, 12, 18); continue; }
    const c = st === 'burn' ? (Math.sin(t * 13 + w.k * 3) > 0 ? FIRE : FIRE2) : st === 'warm' ? '#ffd890' : WARM;
    ctx.fillStyle = c; ctx.fillRect(x, y, 12, 18); ctx.fillStyle = INK; ctx.fillRect(x + 5, y, 2, 18); }
  // the banner on the keep: the cloth stays, the STILL HERE stitched WORDS are OFF (Chikin, Nov 5: "That needs to go away" / "Just the
  // words, the castle is good", D-20261105-27; that space should tell the story). ?banner shows the old words for comparison.
  banner(ctx, kx, kb - KH + 40, t, s, sunK);   // (the cloth stays: "Just the words, the castle is good")
  // tower fires (they grow per stage; out in a ring from him on the kill)
  for (let ti = 0; ti < TOWERS.length; ti++) { const T = TOWERS[ti]; if (t < BURN_AT[ti]) continue; const tx = kx + T.x, top = kb - T.h - (T.keep ? 18 : T.w * 0.6);
    let a = F; const kt = killT(s); if (t >= kt) a *= 1 - clamp((t - kt - Math.abs(tx - P(s.x, 0).x) / 700) / 0.4);
    if (t >= T_.quar && t < T_.smoke) a *= 1 - clamp((t - T_.quar) / 1.0) * 0.9;
    flames(ctx, tx, top + 10, T.w + 20, (40 + 60 * F + 25 * bass) * a, t, ti * 7, Math.min(1, a * 1.4));
    if (a > 0.1) glow(ctx, tx, top - 20, 140, '#ff6a2a', 0.25 * a + 0.1 * kick); }
  // QUARANTINE stamps across the keep (SET: out, a big word card. Chikin: "the assets are supposed to go away")
  if (!SET && t >= T_.quar && t < T_.smoke + 2) { const k = clamp((t - T_.quar) * 2.5), a = t > T_.smoke ? 1 - (t - T_.smoke) / 2 : 1;
    ctx.save(); ctx.translate(kx, kb - 120); ctx.rotate(-0.06); ctx.scale(1 + 0.8 * (1 - ease(k)), 1 + 0.8 * (1 - ease(k))); ctx.globalAlpha = k * a;
    ctx.font = `800 54px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const tw = ctx.measureText('QUARANTINE').width + 34;
    ctx.fillStyle = 'rgba(20,4,6,0.75)'; ctx.fillRect(-tw / 2, -40, tw, 80); ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.strokeRect(-tw / 2, -40, tw, 80); ctx.fillStyle = RED; ctx.fillText('QUARANTINE', 0, 3); ctx.restore(); }
  // the far dragon
  if (fd) { const o = { ...fd, t, plate: s.flare === 'big' && t > T_.flare + 0.4 };
    if (fd.perch && t >= T_.heater && t < T_.verse2) { // CS3 (a BEAT): the inhale — embers and torch flames pulled toward its mouth
      const mx = fd.x - 120 * fd.k, my = fd.y - 70 * fd.k; for (let i = 0; i < 26; i++) { const ph = (rnd(i, 3) + (t - T_.heater) * 0.9) % 1, sx = rnd(i, 4) * W, sy = floorY - rnd(i, 5) * 200;
        ctx.fillStyle = i % 3 ? FIRE2 : FIRE; ctx.globalAlpha = 0.8 * clamp((t - T_.heater - 0.5) / 0.6); ctx.fillRect(sx + (mx - sx) * ease(ph), sy + (my - sy) * ease(ph), 4, 4); } ctx.globalAlpha = 1; }
    dragon(ctx, fd.x, fd.y, fd.k, o);
    if (fd.perch && s.flare && t > T_.flare && t < T_.flare + 1.6) { const k = (t - T_.flare) / 1.6;   // the flare's verdict, on it
      if (s.flare === 'big') { ctx.fillStyle = '#f4f7fb'; ctx.save(); ctx.translate(fd.x - 22 * fd.k - 120 * k, fd.y + 10 * fd.k + 160 * k * k); ctx.rotate(k * 4); ctx.fillRect(-7, -8, 14, 16); ctx.restore(); } } }
  // the verse-2 breath across the whole skyline (SET: out, the dragon's breath with no dragon. Chikin: "the assets are supposed to go away")
  if (!SET && span(t, T_.verse2, T_.verse2 + 1.3)) { const k = (t - T_.verse2) / 1.3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * (1 - k);
    const g = ctx.createLinearGradient(0, kb - 420, 0, kb - 100); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, FIRE); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(W * (1 - k * 1.2), kb - 420, W, 320); ctx.restore(); }
  // the scan beam: white = it's looking (harmless), red = found
  // (SET: out, it was aimed at where the demo Potato ran and staged the old THREAT FOUND beat. Chikin: "the assets are supposed to go away")
  if (!SET) { const beamOn = t < T_.lift ? (t < 5.03 || span(t, 13.2, 14.6) ? 1 : 0.35) : t < T_.found ? 1 : span(t, T_.meter - 0.2, 70.9) ? 1 : 0;
    if (beamOn > 0.05) { const red = t >= T_.lift && t < T_.found, me = P(s.x, 0.6), ex = kx + 10, ey = kb - KH + 30;
      let tx = me.x, ty = me.y; if (t < 5.03) { const k = ease(t / 4.2); tx = me.x + (1 - k) * 400 * Math.sin(t * 0.9); } else if (t < T_.lift && !span(t, 13.2, 14.6)) tx = me.x + 300 * Math.sin(t * 0.7) + 260;
      if (span(t, 13.2, 14.6)) tx = me.x + (1 - (t - 13.2) / 1.4) * 260 - 130;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 * beamOn; ctx.fillStyle = red ? RED : '#dfeaff';
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(tx - 70, ty + 50); ctx.lineTo(tx + 70, ty + 50); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 0.3 * beamOn; glow(ctx, tx, ty + 10, 90, red ? RED : '#eef4ff', 0.35 * beamOn); ctx.restore(); } }
  // ---- the smoke band behind the lane (once the skyline burns) ----
  if (t > T_.verse2 && t < T_.sun + 3) { const a = (t < T_.sun ? 0.7 : 0.7 * (1 - (t - T_.sun) / 3)) * (t < T_.verse2 + 2 ? (t - T_.verse2) / 2 : 1);
    const g = ctx.createLinearGradient(0, floorY - 3.4 * u, 0, floorY - 0.6 * u); g.addColorStop(0, 'rgba(8,5,6,0)'); g.addColorStop(1, `rgba(8,5,6,${a.toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(0, floorY - 3.4 * u, W, 2.8 * u); }
  // ---- the wall-walk: the back parapet (crenellations + torches), the floor, the wall's face ----
  const AX = x => P(x, 0).x, scrollPx = AX(0);
  { const py = floorY - 1.05 * u, mw = 0.9 * u, gap = 0.7 * u, per = mw + gap, off = ((scrollPx % per) + per) % per;
    const sc = t >= T_.sun ? 0.45 : clamp((t - T_.verse2) / 10) * 0.5;
    ctx.fillStyle = mix(STONE, '#221c22', sc); ctx.fillRect(0, py + 0.25 * u, W, floorY - py);
    for (let x = off - per; x < W + per; x += per) { ctx.fillStyle = mix(STONE2, '#2a2228', sc); ctx.fillRect(x, py - 0.45 * u, mw, 0.75 * u); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x, py - 0.45 * u, mw, 0.75 * u); }
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, py + 0.25 * u); ctx.lineTo(W, py + 0.25 * u); ctx.stroke();
    // torches on every third merlon
    const gut = span(t, 78.79, 80.44) ? 0.15 + 0.1 * Math.sin(t * 20) : 1, quarOut = t >= T_.quar + 0.6 && t < T_.dark1 ? 0 : t >= T_.siege ? 0.4 : 1;
    for (let i = -1; i < W / per + 2; i++) { const xi = off + i * per - per, idx = Math.round((xi - scrollPx) / per); if (((idx % 3) + 3) % 3) continue;
      const tx = xi + mw / 2, ty = py - 0.45 * u; ctx.fillStyle = '#4a3020'; ctx.fillRect(tx - 3, ty - 0.35 * u, 6, 0.35 * u); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(tx - 3, ty - 0.35 * u, 6, 0.35 * u);
      const a = gut * quarOut * (t >= T_.sun ? 0.3 : 1); if (a > 0.05) { flames(ctx, tx, ty - 0.33 * u, 0.32 * u, (0.38 + 0.12 * kick) * u, t, i * 3.3, a); glow(ctx, tx, ty - 0.5 * u, 1.3 * u, '#ff9a4a', 0.22 * a * (1 + kick)); } } }
  // the floor (the walkway) and the wall's face under it
  { ctx.fillStyle = mix('#4a4450', '#2a2328', t >= T_.sun ? 0.4 : clamp((t - T_.verse2) / 10) * 0.45); ctx.fillRect(0, floorY, W, 0.2 * u);
    ctx.fillStyle = mix('#2c2733', '#17121a', t >= T_.sun ? 0.5 : clamp((t - T_.verse2) / 10) * 0.5); ctx.fillRect(0, floorY + 0.2 * u, W, H);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, floorY + 0.2 * u); ctx.lineTo(W, floorY + 0.2 * u); ctx.stroke();
    const bw = 1.3 * u, off = ((scrollPx % bw) + bw) % bw; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) { const y = floorY + 0.2 * u + r * 0.42 * u; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = off - bw + (r % 2) * bw / 2; x < W; x += bw) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 0.42 * u); ctx.stroke(); } }
    // the red floor line: a firewall is coming (four beats; three in the fight)
    for (const sp of Pp.sweeps) { const w0 = sp.t - sp.warn; if (t < w0 || t > sp.t + 0.1) continue; if (cutAt(Pp, s, sp.t) && sp.kind !== 'boss') continue;
      const k = (t - w0) / sp.warn, bt = ((t - w0) / Pp.P) % 1, pulse = Math.max(0, 1 - bt * 2.5);
      if (sp.jet) { const yA = P(A, sp.jet === 'high' ? 3.9 : 1.15).y, yB = P(A, sp.jet === 'high' ? 1.95 : -0.05).y;   // a jet: its own band glows (up the stair, or along the floor)
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = RED; ctx.globalAlpha = 0.1 + 0.16 * k + 0.12 * pulse; ctx.fillRect(0, yA, W, yB - yA);
        ctx.globalAlpha = 0.5 + 0.4 * pulse; ctx.fillRect(0, yA - 3, W, 5); ctx.fillRect(0, yB - 3, W, 5); ctx.restore(); continue; }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = RED; ctx.globalAlpha = 0.35 + 0.4 * k + 0.25 * pulse; ctx.fillRect(0, floorY - 4, W, 8 + 6 * pulse); glow(ctx, P(s.x, 0).x, floorY, 260, '#ff2a2a', 0.15 + 0.2 * k); ctx.restore(); } }
  // ---- the timber roof over the walk (the breakdown), and its crash ----
  if (t >= T_.smoke && t < T_.siege + 0.5) { const ry = P(A, 4.35).y, shake = t > T_.dive ? (M ? M.kick(t) : 0) * 6 : 0, gone = t >= T_.siege ? clamp((t - T_.siege) / 0.5) : 0;
    ctx.save(); ctx.globalAlpha = (t < T_.smoke + 1 ? (t - T_.smoke) : 1) * (1 - gone); ctx.fillStyle = '#4a2e1c'; ctx.fillRect(0, ry - 0.35 * u + shake, W, 0.35 * u); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(-5, ry - 0.35 * u + shake, W + 10, 0.35 * u);
    const per = 3.2 * u, off = ((scrollPx % per) + per) % per; for (let x = off - per; x < W + per; x += per) { ctx.fillStyle = '#3a2416'; ctx.fillRect(x, ry + shake, 0.22 * u, floorY - 1.1 * u - ry); ctx.strokeRect(x, ry + shake, 0.22 * u, floorY - 1.1 * u - ry);
      ctx.beginPath(); ctx.moveTo(x + 0.11 * u, ry + 0.6 * u + shake); ctx.lineTo(x + 0.9 * u, ry + shake); ctx.lineTo(x - 0.7 * u, ry + shake); ctx.closePath(); ctx.fillStyle = '#3a2416'; ctx.fill(); ctx.stroke(); }
    if (t > T_.dive) for (let i = 0; i < 12; i++) { const ph = (rnd(i, 2) + t * 0.8) % 1; ctx.fillStyle = 'rgba(200,180,150,0.5)'; ctx.fillRect(rnd(i, 3) * W, ry + ph * 3 * u, 3, 3); }   // dust on the kicks
    ctx.restore(); }
  if (span(t, T_.siege, T_.siege + 1.4)) { const k = (t - T_.siege) / 1.4, ry = P(A, 4.35).y;   // the crash: the timbers burst, splinters and dust everywhere
    for (let i = 0; i < 26; i++) { const a = -Math.PI * (0.1 + 0.8 * rnd(i, 41)), v = 180 + 420 * rnd(i, 42), x = W * (0.45 + 0.5 * rnd(i, 43)) + Math.cos(a) * v * k, y = ry + Math.sin(a) * v * k * 0.6 + 900 * k * k;
      ctx.save(); ctx.translate(x, y); ctx.rotate(k * 9 * (rnd(i, 44) - 0.5)); ctx.fillStyle = i % 3 ? '#4a2e1c' : STONE2; ctx.fillRect(-14, -5, 28 + 20 * rnd(i, 45), 10); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-14, -5, 28 + 20 * rnd(i, 45), 10); ctx.restore(); }
    ctx.fillStyle = 'rgba(210,190,160,1)'; ctx.globalAlpha = 0.5 * (1 - k); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(W * (0.4 + 0.6 * rnd(i, 51)), ry + 40 + 120 * rnd(i, 52), 40 + 120 * k, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  // ---- embers + ash in the air (kept above the lane) ----
  if (F > 0.05 || t > T_.verse2) { const n = Math.round(10 + 30 * F); for (let i = 0; i < n; i++) { const ph = (rnd(i, 21) + t * (0.08 + 0.1 * rnd(i, 22))) % 1, x = ((rnd(i, 23) * W - ph * 160 + W * 4) % W), y = floorY - 1.8 * u - ph * 300 - rnd(i, 24) * 60;
    ctx.fillStyle = i % 4 === 0 ? '#bfb6aa' : (i % 2 ? FIRE2 : FIRE); ctx.globalAlpha = (0.4 + 0.5 * snare) * (1 - ph); ctx.fillRect(x, y, 3, 3); } ctx.globalAlpha = 1; }

  // ---------- the course (behind him) ----------
  const vis = x => { const p = P(x, 0).x; return p > -1.6 * u && p < W + 1.6 * u; };
  // grates: glowing bars in the floor, gold sparks rising (no flames)
  for (const g of Pp.grates) { if (!vis(g.x0) && !vis(g.x1)) continue; const a = P(g.x0, 0), b = P(g.x1, 0), used = s.grateUsed && s.grateUsed[g.i];
    ctx.fillStyle = INK; ctx.fillRect(a.x - 3, a.y - 5, b.x - a.x + 6, 10); for (let i = 0; i < 5; i++) { ctx.fillStyle = used ? '#a8782a' : '#ffd36a'; ctx.fillRect(a.x + i * (b.x - a.x) / 5 + 3, a.y - 3, (b.x - a.x) / 5 - 6, 6); }
    glow(ctx, (a.x + b.x) / 2, a.y - 10, 1.0 * u, GOLD, used ? 0.15 : 0.35 + 0.2 * kick);
    for (let i = 0; i < 6; i++) { const ph = (rnd(i, g.i) + t * 0.9) % 1; ctx.fillStyle = GOLD2; ctx.globalAlpha = 1 - ph; ctx.fillRect(a.x + rnd(i, g.i + 4) * (b.x - a.x), a.y - ph * 1.6 * u, 3, 3); } ctx.globalAlpha = 1; }
  // stones (fallen from the battlements)
  for (const q of Pp.stones) { if (!vis(q.x0)) continue; const a = P(q.x0, q.h), b = P(q.x1, 0);
    ctx.beginPath(); ctx.moveTo(a.x - 2, b.y); ctx.lineTo(a.x + 2, a.y + 6); ctx.lineTo(a.x + (b.x - a.x) * 0.4, a.y - 2); ctx.lineTo(b.x - 4, a.y + 8); ctx.lineTo(b.x + 2, b.y); ctx.closePath();
    if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.lineWidth = 11; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.fillStyle = STONE2; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#7a7080'; ctx.fillRect(a.x + 6, a.y + 10, (b.x - a.x) * 0.35, 4); }
  // beams + the chandelier (hanging on chains; burning)
  for (const bm of Pp.beams) { if (!vis(bm.x0)) continue; const cutT = s.beamCut ? s.beamCut[bm.i] : null, y = beamY(bm, t); let dy = 0, rot = 0;
    if (cutT != null) { const k = t - cutT; if (k > 1.2) continue; dy = -6 * k * k; rot = k * 2; }
    const a = P(bm.x0, y.y0 + dy), b = P(bm.x1, y.y0 + dy), cx = (a.x + b.x) / 2;
    ctx.strokeStyle = '#6a6070'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(cx - 10, 0); ctx.lineTo(cx - 10, a.y - 0.5 * u); ctx.moveTo(cx + 10, 0); ctx.lineTo(cx + 10, a.y - 0.5 * u); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(cx, a.y - 0.25 * u); ctx.rotate(rot);
    if (bm.kind === 'chandelier') { const w = (b.x - a.x); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 0, w / 2, 0.18 * u, 0, 0, 7); ctx.stroke(); ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = 4; ctx.stroke();
      for (let i = 0; i < 5; i++) { const px = -w / 2 + (i + 0.5) * w / 5; ctx.fillStyle = BONE; ctx.fillRect(px - 4, -0.32 * u, 8, 0.22 * u); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(px - 4, -0.32 * u, 8, 0.22 * u); flames(ctx, px, -0.32 * u, 14, 0.25 * u, t, i + bm.i, 1); } }
    else { const w = b.x - a.x, h = 0.5 * u; if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8); } ctx.fillStyle = '#5a3420'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = '#ff8a2a'; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 11 + bm.i); ctx.fillRect(-w / 2 + 4, h / 2 - 8, w - 8, 5); ctx.globalAlpha = 1; flames(ctx, 0, -h / 2, w, 0.4 * u, t, bm.i * 5, 1); }
    ctx.restore(); }
  // cages (each holds a small warm light; the sword breaks it and the light joins him)
  for (const cg of Pp.cages) { if (!vis(cg.x)) continue; const p = P(cg.x, cg.y), cutT = s.cageCut ? s.cageCut[cg.i] : null;
    ctx.strokeStyle = '#6a6070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, p.y - 0.35 * u); ctx.stroke();
    if (cutT == null) { glow(ctx, p.x, p.y + 0.3 * u, 0.8 * u, WARM, 0.45 + 0.15 * kick); ctx.beginPath(); ctx.arc(p.x, p.y + 0.32 * u, 0.13 * u, 0, 7); ctx.fillStyle = '#fff1c0'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(p.x - 0.3 * u, p.y - 0.35 * u, 0.6 * u, 0.85 * u); ctx.strokeStyle = '#8a8890'; ctx.lineWidth = 3; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(p.x - 0.3 * u + i * 0.15 * u, p.y - 0.35 * u); ctx.lineTo(p.x - 0.3 * u + i * 0.15 * u, p.y + 0.5 * u); ctx.stroke(); } }
    else { const k = t - cutT; if (k < 1) for (let i = 0; i < 5; i++) { ctx.strokeStyle = '#8a8890'; ctx.lineWidth = 3; const a = i * 1.3; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * k * 80, p.y + Math.sin(a) * k * 60 + 200 * k * k); ctx.lineTo(p.x + Math.cos(a) * k * 80 + 6, p.y + Math.sin(a) * k * 60 + 200 * k * k + 26); ctx.stroke(); } } }
  // ember piles on the sunrise lap (glowing, no flames); his light puts them out (a white puff)
  for (const em of Pp.embers) { if (!vis(em.x0) || t < em.from) continue; const a = P(em.x0, 0), b = P(em.x1, 0), out = s.emberOut ? s.emberOut[em.i] : null;
    ctx.beginPath(); ctx.ellipse((a.x + b.x) / 2, a.y, (b.x - a.x) / 2, 0.22 * u, 0, Math.PI, 0); ctx.fillStyle = out != null ? '#3a3438' : '#ff7a2a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    if (out == null) glow(ctx, (a.x + b.x) / 2, a.y - 6, 0.7 * u, '#ff7a2a', 0.4 + 0.2 * Math.sin(t * 5 + em.i));
    else if (t - out < 0.7) { const k = (t - out) / 0.7; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc((a.x + b.x) / 2, a.y - 10 - 40 * k, 14 + 40 * k, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
  // the fight: the slabs (the roof come down) and the dragon itself
  if (t >= T_.siege - 0.05) { for (const q of Pp.slabs) { const fall = clamp((t - (q.land - 0.4)) / 0.4); if (fall <= 0) continue; const dy = (1 - fall * fall) * 5;
      const a = P(q.x0, q.y1 + dy), b = P(q.x1, -0.05 + dy); rubble(ctx, a, b, u, q.i * 13 + 5, (sp => sp ? clamp((t - (sp.t - sp.warn)) / sp.warn) : 0)(Pp.sweeps.find(sp => sp.jet && t > sp.t - sp.warn && t < sp.t + 0.1 && (sp.jet === 'high' ? q.y1 > RG.JETH : q.y1 < RG.JETH))));
      if (span(t, q.land, q.land + 0.5)) for (let i = 0; i < 8; i++) { const k = (t - q.land) / 0.5; ctx.fillStyle = 'rgba(210,190,160,0.6)'; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(a.x + rnd(i, q.i) * (b.x - a.x), b.y - k * 30 * rnd(i, 3), 8 + 20 * k, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } }
    if (!C.def.blank) fightDragon(ctx, t, s, Pp, u, e); }
  // tokens (small coins on the beat path; big ones; arcs)
  const r0 = 0.13 * u, r1 = 0.21 * u;
  for (const k of Pp.tokens) { if ((s.got && s.got[k.i]) || t < k.from) continue; const p = P(k.x, k.y); if (p.x < -30) continue; if (p.x > W + 30) break; coin(ctx, p.x, p.y, k.big ? r1 : r0, t, k.big); }
  for (const d of (s.drops || [])) { if (d.got) { if (d.gotAt != null && t - d.gotAt < 0.3) { const p = P(d.x, d.y); glow(ctx, p.x, p.y, 40, GOLD, 0.6 * (1 - (t - d.gotAt) / 0.3)); } continue; }
    const p = P(d.x, d.y); if (p.x < -30 || p.x > W + 30) continue; if (d.kind === 'gold') glow(ctx, p.x, p.y, 34, '#ffb32a', 0.4); coin(ctx, p.x, p.y, d.kind === 'gold' ? r1 * 1.05 : d.big ? r1 : r0, t, d.big, d.kind); }
  // bats
  for (const b of Pp.bats) { if (s.batCut && s.batCut[b.i] != null) { const k = t - s.batCut[b.i]; if (k < 0.6) { const p = batPos(Pp, s, b, s.batCut[b.i]); if (p) { const q = P(p.x, p.y);   // cut: two wing halves tumble away in a puff of ash
        ctx.save(); ctx.globalAlpha = 1 - k / 0.6; ctx.fillStyle = '#d8d0c4'; ctx.beginPath(); ctx.arc(q.x, q.y, 14 + 60 * k, 0, 7); ctx.fill();
        for (const sd of [-1, 1]) { ctx.save(); ctx.translate(q.x + sd * 90 * k, q.y - 60 * k + 320 * k * k); ctx.rotate(sd * k * 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * 0.5 * u, -0.12 * u); ctx.lineTo(sd * 0.3 * u, 0.1 * u); ctx.closePath(); ctx.fillStyle = BONE; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
        ctx.restore(); } } continue; }
    const p = batPos(Pp, s, b, t); if (!p) continue; const q = P(p.x, p.y); bat(ctx, q.x, q.y, 1.0 * u, t + b.i, s.batHit && s.batHit[b.i] != null ? false : true, b.big); }
}
// the dragon in the arena (it crashed through the roof): body off to the right, the neck to its head
function fightDragon(ctx, t, s, Pp, u, e) {
  const F = Pp.F, AF = Pp.AF, kt = killT(s), dead = s.killAt != null && t >= s.killAt;
  if (dead && t - s.killAt > 1.2) return;
  const H = headAt(Pp, t), up = P(AF + 7.6, 4.75), down = P(AF + F.eye.ox, F.eye.y), rear = P(AF + 7.35, 4.45);
  // the head between its poses: slams down on a window, rises after; in the crash it comes down through the roof
  let hp = up, jaw = 0, throat = 0;
  if (t < T_.ctl) { const k = ease((t - T_.siege) / 0.6); hp = { x: up.x + 160 * (1 - k), y: up.y - 480 * (1 - k) }; jaw = 0.8; }
  else if (H.st === 'down') { const k = ease(H.k); hp = { x: up.x + (down.x - up.x) * k, y: up.y + (down.y - up.y) * k }; }
  else if (t >= F.hush) { const k = ease((t - F.hush) / 0.8); hp = { x: up.x + (rear.x - up.x) * k, y: up.y + (rear.y - up.y) * k }; jaw = 0.4 + 0.6 * clamp((t - F.hush - 0.8) / 3); }
  else { const w = F.windows.find(w => t >= w.b + 0.1 && t < w.b + 0.45); if (w) { const k = ease((t - w.b - 0.1) / 0.35); hp = { x: down.x + (up.x - down.x) * k, y: down.y + (up.y - down.y) * k }; } }
  const br = Pp.sweeps.find(q => q.kind === 'boss' && t > q.t - q.warn && t < q.t + 0.3); if (br) { throat = clamp((t - (br.t - br.warn)) / br.warn); jaw = t > br.t - 0.15 ? 1 : 0.3 * throat; }
  const drop = t < T_.siege + 0.5 ? (1 - ease((t - T_.siege + 0.05) / 0.55)) * 480 : 0, body0 = P(AF + 8.9, 2.7), body = { x: body0.x, y: body0.y - drop }, scale = u / 90 * 2.0, shake = s.camShake ? (rnd(t, 1) - 0.5) * 20 * s.camShake : 0;
  const cracks = s.cracks || 0, eye = t >= F.hush ? 'spin' : 'lock';
  ctx.save(); if (dead) { ctx.globalAlpha = 1 - clamp((t - s.killAt - 0.4) / 0.6); }
  look.mouth = dead ? null : { x: hp.x + 6 * scale - 40 * scale + shake, y: hp.y + 6 * scale + 14 * scale, open: jaw };   // (the hush's coin stream + the jets come out of here: over())
  dragon(ctx, body.x + shake, body.y, scale, { t, flap: t < T_.ctl ? (t * 2) % 1 : 0.15 + 0.05 * Math.sin(t * 2), head: { x: hp.x + 6 * scale + shake, y: hp.y + 6 * scale }, jaw, throat, eye, cracks, plate: s.flare === 'big' });
  if (t >= F.hush && !dead) { ctx.save(); ctx.font = `700 ${Math.round(13 * scale)}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillStyle = RED; ctx.translate(hp.x, hp.y - 40 * scale); ctx.rotate(Math.sin(t * 7) * 0.1);
    if (Math.floor(t * 6) % 2 === 0) ctx.fillText('QUARANTINE', 0, 0); ctx.restore(); }   // its cracked eye spins QUARANTINE
  ctx.restore();
  // the kill: the eye shatters, the dragon bursts into gold
  if (s.killAt != null && t >= s.killAt && t - s.killAt < 1.6) { const k = (t - s.killAt) / 1.6, c = P(AF + F.eye.ox, F.eye.y);
    for (let i = 0; i < 40; i++) { const a = rnd(i, 1) * 6.28, r = (80 + rnd(i, 2) * 420) * ease(k * 1.3); ctx.fillStyle = i % 3 ? GOLD : GOLD2; ctx.globalAlpha = 1 - k; ctx.fillRect(c.x + Math.cos(a) * r + 120, c.y + Math.sin(a) * r * 0.7 - 40, 7, 7); }
    ctx.globalAlpha = 1; glow(ctx, c.x + 120, c.y - 40, 500 * k + 100, '#ffd36a', 0.7 * (1 - k)); }
}

// ======================= in front of him: the level's modeView =======================
const ASIDE_LOW = 'low'; let ticks = -1;
export const modeView = ({ C, overlay }) => {
  look.C = C; look.P = (x, y) => overlay.project(x, y); live.castle = C.def.castle;
  const Pp = prep(C), K = Pp.K;
  let heard = {}, lastT = -1;
  const once = (k, v) => { if (heard[k] === v) return false; heard[k] = v; return true; };
  return {
    draw(f) { const { s, t } = f;
      if (C.theme) C.theme.camFix = s.camY ?? 2.0;   // (the mode's camera wish: up in the cold open, onto his face in the cuts)
      if (t < lastT - 0.5) heard = {}; lastT = t;
      if (f.videoMode) return;
      // the sounds (play/sfx.mjs, under the song)
      try {
        if (s.tokenAt != null && t - s.tokenAt < 0.1 && once('tok', s.tokenAt)) SFX.clink && SFX.clink();
        if (s.glitchAt != null && t - s.glitchAt < 0.1 && once('g', s.glitchAt)) { SFX.glitch(false); SFX.whoosh && SFX.whoosh(false); }
        if (s.hurtAt != null && t - s.hurtAt < 0.15 && once('hurt', s.hurtAt)) { if (s.hurtKind === 'fire' || s.hurtKind === 'cue') SFX.sizzle && SFX.sizzle(); else SFX.thud && SFX.thud(); }
        if (s.cutFx && t - s.cutFx.t < 0.1 && once('cut', s.cutFx.t)) { if (s.cutFx.k === 'cage') SFX.clang && SFX.clang(); else if (s.cutFx.k === 'crack') { SFX.bossChunk && SFX.bossChunk(); } else SFX.poof && SFX.poof(); }
        if (s.grateAt != null && t - s.grateAt < 0.1 && once('grate', s.grateAt)) SFX.pad();
        if (s.passAt != null && t - s.passAt < 0.15 && once('pass', s.passAt)) SFX.flare && SFX.flare();
        if (s.killAt != null && t - s.killAt < 0.15 && once('kill', s.killAt)) { SFX.bossBoom && SFX.bossBoom(false); SFX.fanfare && SFX.fanfare(); }
        if (s.restAt != null && t - s.restAt < 0.15 && once('rest', s.restAt)) SFX.powerDown && SFX.powerDown();
        if (s.wasteAt != null && t - s.wasteAt < 0.1 && once('waste', s.wasteAt)) SFX.pop && SFX.pop();
        if (s.restAt == null && (s.killAt == null || t < s.killAt) && s.meter < 0.25 && t > 5.2 && once('low', Math.floor(C.beatOf(t) / 2))) SFX.flub && SFX.flub();   // (low: the jar thumps every two beats)
        for (const sp of Pp.sweeps) if (t >= sp.t - 0.05 && t < sp.t + 0.2 && once('sw' + sp.i, 1) && !(cutAt(Pp, s, sp.t) && sp.kind !== 'boss')) SFX.hiss && SFX.hiss();
        for (const cl of Pp.claws) if (t >= cl.t && t < cl.t + 0.2 && once('cl' + cl.i, 1)) SFX.thunk && SFX.thunk();
        for (const q of Pp.slabs) if (t >= q.land && t < q.land + 0.2 && once('sl' + q.i, 1)) SFX.boom && SFX.boom();
        if (span(t, T_.siege, T_.siege + 0.2) && once('siege', 1)) { SFX.bossBoom && SFX.bossBoom(true); }
        for (const [i, q] of K.shutters.entries()) if (t >= q && t < q + 0.15 && once('sh' + i, 1)) SFX.clang && SFX.clang();
        for (const e of Pp.embers) if (s.emberOut && s.emberOut[e.i] != null && once('em' + e.i, 1)) SFX.snuff && SFX.snuff();
      } catch (er) { /* (no audio: fine) */ }
    },
    over(ctx, f) { if (!C.def.blank) over(ctx, f, C, Pp, K); },   // (?blank: nothing in front of him — no gauge, sword, curtains, rings, letterbox, asides, card)
  };
};

function over(ctx, f, C, Pp, K) {
  const { s, t } = f, project = f.project, me = project(s.x, s.y + 0.65), u = Math.abs(project(1, 0).x - project(0, 0).x) || 90;
  const cut = cutAt(Pp, s, t), b = C.beatOf(t);
  // ---- the saved lights circle him (warm gold, never purple) ----
  (s.saved || []).forEach((st, i) => { const a = t * 2.2 + i * 2.09, k = clamp((t - st) / 0.6), r = 0.75 * u * (0.4 + 0.6 * k), dark = t >= K.dark[0] && t < K.dark[1] ? 1.6 : 1;
    const x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r * 0.45 - 6; glow(ctx, x, y, 34 * dark, WARM, 0.55); ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = '#fff1c0'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); });
  // ---- quarantine: two bars of dark, only his visor + the lights he saved ----
  if (t >= K.dark[0] - 0.2 && t < K.dark[1] + 0.3) { const k = Math.min(clamp((t - K.dark[0] + 0.2) / 0.3), clamp((K.dark[1] + 0.3 - t) / 0.3));
    const g = ctx.createRadialGradient(me.x, me.y, 30, me.x, me.y, 260); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${(0.9 * k).toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    (s.saved || []).forEach((st, i) => { const a = t * 2.2 + i * 2.09, x = me.x + Math.cos(a) * 0.75 * u, y = me.y + Math.sin(a) * 0.75 * u * 0.45 - 6; glow(ctx, x, y, 50, WARM, 0.5 * k); });
    if (t > 112.4 && t < 113.0) glow(ctx, me.x + 6, me.y - 10, 30, PURPLE, 0.6); }   // "disappear": his visor flickers purple and holds
  // ---- the claw (stop-time): its shadow rises over him for four beats, then it rakes the stones ----
  for (const cl of Pp.claws) { const w0 = cl.t - 4 * Pp.P; if (t < w0 || t > cl.t + 0.35) continue; const fy = project(s.x, 0).y;
    if (t < cl.t) { const k = (t - w0) / (4 * Pp.P); ctx.save(); ctx.fillStyle = 'rgba(5,3,10,0.5)'; ctx.globalAlpha = 0.3 + 0.5 * k; ctx.beginPath(); for (let i = 0; i < 3; i++) { const cx = me.x - 40 + i * 40; ctx.moveTo(cx - 12, fy); ctx.lineTo(cx, fy - 40 - 120 * k); ctx.lineTo(cx + 12, fy); } ctx.fill(); ctx.restore(); }
    else { const k = (t - cl.t) / 0.35, rake = Math.min(1, 0.35 + k * 2.5); ctx.save(); ctx.globalAlpha = Math.min(1, 2.2 * (1 - k));   // three steel talons rake down through where he stood
      for (let i = 0; i < 3; i++) { const cx = me.x - 80 + i * 58 + 70 * k, top = fy - 330, tip = top + (fy + 6 - top) * rake;
        ctx.beginPath(); ctx.moveTo(cx - 26, top); ctx.quadraticCurveTo(cx - 22, (top + tip) / 2, cx + 4, tip); ctx.quadraticCurveTo(cx + 8, (top + tip) / 2, cx + 26, top); ctx.closePath();
        if (OLD_WHITE) { ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.fillStyle = STEEL; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = STEEL2; ctx.fillRect(cx - 14, top + 10, 6, (tip - top) * 0.6); }
      ctx.fillStyle = '#7a7080'; for (let i = 0; i < 10; i++) ctx.fillRect(me.x - 80 + rnd(i, cl.i) * 160, fy - k * 120 * rnd(i, 5) + 200 * k * k, 7, 7); ctx.restore(); } }
  // ---- the firewall curtain: it sweeps the whole wall on the beat ----
  for (const sp of Pp.sweeps) { if (t < sp.t - 0.2 || t > sp.t + 0.45) continue; if (cutAt(Pp, s, sp.t) && sp.kind !== 'boss') continue;
    if (sp.jet) { jet(ctx, sp, t, s, Pp, project); continue; }
    const k = (t - (sp.t - 0.2)) / 0.65, x = W + 200 - k * (W + 600), passed = !sp.jet && s.passAt != null && Math.abs(s.passAt - (sp.t + RG.FIRE_L)) < 0.05 + 1 / 60;
    ctx.save(); ctx.globalAlpha = 0.92; const w = 360;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(0.25, FIRE); g.addColorStop(0.5, HOT); g.addColorStop(0.75, FIRE); g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, 0, w, H);
    ctx.strokeStyle = 'rgba(60,10,0,0.55)'; ctx.lineWidth = 4; for (let r = 0; r < 12; r++) { const y = r * 46 + ((t * 300) % 46); ctx.beginPath(); ctx.moveTo(x - w / 3, y); ctx.lineTo(x + w / 3, y); ctx.stroke(); for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.moveTo(x + c * 60 + (r % 2) * 30, y); ctx.lineTo(x + c * 60 + (r % 2) * 30, y + 46); ctx.stroke(); } }   // the brick lines in it: a FIREwall
    for (let i = 0; i < 9; i++) flames(ctx, x - w / 2 + i * w / 8, H * (0.2 + 0.1 * (i % 3)), 50, 90, t, i + sp.i * 3, 0.9);
    ctx.restore(); if (passed && Math.abs(x - me.x) < 200) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, me.x, me.y, 90, PURPLE, 0.7); ctx.restore(); } }
  // ---- a scorch (warm, never purple) ----
  if (s.hurtAt != null && t - s.hurtAt >= 0 && t - s.hurtAt < 0.45) { const k = (t - s.hurtAt) / 0.45; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, me.x, me.y, 80 + 80 * k, s.hurtKind === 'fire' || s.hurtKind === 'cue' ? '#ff6a1a' : '#ffd0a0', 0.75 * (1 - k)); ctx.restore();
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#3a2a22'; ctx.globalAlpha = 1 - k; ctx.fillRect(me.x + Math.cos(i * 1.7) * 40 * k * 2, me.y - 30 * k - 30 * k * rnd(i, 1), 6, 6); } ctx.globalAlpha = 1; }
  // ---- THE SWORD: his glitch, a sword pops out of it (purple in), swings once, purple out. No arms, no hands. ----
  if (s.glitchAt != null && t - s.glitchAt >= 0 && t - s.glitchAt < RG.SWING + 0.05) sword(ctx, s, t, me, u, s.killAt != null && Math.abs(s.killAt - s.glitchAt) < 0.02);
  // ---- a crack / a cut: a slash of white on the thing ----
  if (s.cutFx && t - s.cutFx.t >= 0 && t - s.cutFx.t < 0.3) { const k = (t - s.cutFx.t) / 0.3, p = project(s.cutFx.x, s.cutFx.y); ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8 * (1 - k); ctx.beginPath(); ctx.moveTo(p.x - 50, p.y + 30); ctx.lineTo(p.x + 50, p.y - 30); ctx.stroke(); ctx.restore(); }
  // ---- world text (the antivirus speaks: clean sans, cold white + alert red) ----
  if (span(t, K.lift, K.lift + 2.4)) { const k = clamp((t - K.lift) / 0.2), R = 70 - 12 * ease(clamp((t - K.lift) / 0.4)); ctx.save(); ctx.globalAlpha = k * (t > K.lift + 2 ? (K.lift + 2.4 - t) / 0.4 : 1);
    ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(me.x, me.y, R, 0, 7); ctx.stroke(); avText(ctx, 'SCAN: 1 THREAT', me.x + R + 10, me.y - R, RED); ctx.restore(); }
  { const sp = Pp.sweeps.find(q => q.jet && t > q.t - q.warn && t < q.t); if (sp) { ctx.save(); ctx.globalAlpha = clamp((t - (sp.t - sp.warn)) / 0.2);   // (the jets: it learned his glitch)
      avText(ctx, sp.jet === 'high' ? 'SIGNATURE UPDATED · PURGE: UPPER' : 'PURGE: FLOOR', W * 0.62, H * 0.16, RED, 18, 'center'); ctx.restore(); } }
  if (t >= Pp.F.hush && (s.killAt == null || t < s.killAt) && look.mouth && s.restAt == null) { const m = look.mouth, jx = 51, jy = 58 + 160 * (1 - clamp(s.meter)), n = 14 + (3 - (s.cracks || 0)) * 5;   // the hush: his jar empties into its mouth
    for (let i = 0; i < n; i++) { const ph = (rnd(i, 7) + (t - Pp.F.hush) * 0.9) % 1, e2 = ease(ph), x = jx + (m.x - jx) * e2, y = jy + (m.y - jy) * ph - Math.sin(ph * Math.PI) * 60 + Math.sin(ph * 9 + i) * 8;   // (a low arc: under the letterbox)
      ctx.save(); ctx.globalAlpha = Math.min(1, ph * 6, (1 - ph) * 5); coinHud(ctx, x, y, 10 * (1 - 0.3 * ph)); ctx.restore(); } }
  if (cut && cut.name === 'found' && t > cut.a + 0.6) { ctx.save(); ctx.globalAlpha = clamp((t - cut.a - 0.6) / 0.2); avText(ctx, 'THREAT FOUND', W / 2, H * 0.3, RED, 34, 'center'); ctx.restore(); }
  if (t >= K.lineFrom && t < T_.heater) { const pct = Math.round(clamp(s.meter) * 100); ctx.save(); ctx.globalAlpha = clamp((t - K.lineFrom) / 0.3) * (t > T_.heater - 0.4 ? (T_.heater - t) / 0.4 : 1);
    avText(ctx, `BALANCE ${pct}%`, me.x + 0.7 * u, me.y - 0.55 * u, pct >= 60 ? AV : RED, 18); ctx.restore(); }
  // ---- CS3 (a BEAT): his flare on "heater" — big above the line, a gutter below ----
  if (s.flare && t >= K.flareT && t < K.flareT + 1.4) { const k = (t - K.flareT) / 1.4, big = s.flare === 'big'; ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, me.x, me.y - 10, (big ? 380 : 120) * ease(Math.min(1, k * 3)), WARM, (big ? 0.8 : 0.35) * (1 - k)); ctx.restore(); }
  // ---- the cue ring (the album's one move): his purple closes on him in three ticks; Space on the fourth beat ----
  if (s.killAt == null && !s.killFail) { const h = K.kill.hits[s.killTry]; if (h != null) { const a = h - 3 * Pp.P; if (t >= a - 0.05 && t <= h + K.kill.late) {
    const n = Math.min(3, Math.floor((t - a) / Pp.P) + 1), sub = ((t - a) / Pp.P) % 1, R = 150 - 33 * (n - 1) - 18 * ease(Math.min(1, sub * 3)) * (n < 3 ? 1 : 0.4), pop = Math.max(0, 1 - sub * 4);
    ctx.save(); ctx.lineWidth = 7 + 4 * pop; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(me.x, me.y, t > h ? 52 : Math.max(52, R), 0, 7); ctx.stroke();
    ctx.lineWidth = 4 + 3 * pop; ctx.strokeStyle = PURPLE; ctx.shadowColor = PURPLE; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;
    for (let i = 0; i < 3; i++) { const ang = -Math.PI / 2 + (i - 1) * 0.5; ctx.beginPath(); ctx.arc(me.x + Math.cos(ang) * (Math.max(52, R) + 14), me.y + Math.sin(ang) * (Math.max(52, R) + 14), 6, 0, 7); ctx.fillStyle = i < n ? MAG : INK; ctx.fill(); }
    ctx.restore(); if (n !== ticks && t < h) { ticks = n; try { SFX.dlTick && SFX.dlTick(); } catch (er) {} } } } }
  if (s.killAt != null && t - s.killAt >= 0 && t - s.killAt < 0.6) { const k = (t - s.killAt) / 0.6; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = s.killQ === 2 ? '#ffffff' : PURPLE; ctx.globalAlpha = 1 - k; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(me.x, me.y, 50 + 420 * k, 0, 7); ctx.stroke(); ctx.restore(); }
  // the big white hits (only on the album's hits)
  for (const hT of [K.chorus, K.verse2, 105.50, K.siege, s.killAt ?? 142.50, T_.sun]) if (span(t, hT, hT + 0.25)) { ctx.fillStyle = '#fff4e0'; ctx.globalAlpha = 0.35 * (1 - (t - hT) / 0.25); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // ---- low on tokens (under a quarter): his armour dulls, the jar thumps (the sound is in draw) ----
  if (s.restAt == null && (s.killAt == null || t < s.killAt) && clamp(s.meter) < 0.25 && t > 5.2) { const k = 1 - clamp(s.meter) / 0.25; ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.globalAlpha = 0.25 + 0.5 * k;
    ctx.beginPath(); ctx.ellipse(me.x, me.y - 4, 0.62 * u, 0.85 * u, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // ---- deep rest: he greys out, his visor goes out ----
  if (s.restAt != null) { const k = clamp((t - s.restAt) / RG.REST); ctx.save(); ctx.fillStyle = `rgba(10,10,16,${(0.55 * k).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(me.x, me.y, 90, 0, 7); ctx.fill(); ctx.restore(); }
  // ---- letterbox bars: a CUT (control taken) ----
  { const c = Pp.cuts.find(c => { const z = c.name === 'kill' ? killEnd(Pp, s) : c.b; return t >= c.a - 0.05 && t < z + 0.3 && c.bars && c.name !== 'cold'; });
    if (c) { const z = c.name === 'kill' ? killEnd(Pp, s) : c.b, k = Math.min(ease((t - c.a) / 0.3), ease((z + 0.3 - t) / 0.3)); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, 40 * k); ctx.fillRect(0, H - 40 * k, W, 40 * k); } }
  if (t < 0.8) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - t / 0.8; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  // ---- the aside (DRAFT, his voice): one small box beside his head, in calm stretches ----
  for (const [a, z, text, cond] of K.asides) { if (!span(t, a, z)) continue; if (cond === ASIDE_LOW && !(clamp(s.meter) < K.line)) continue; aside(ctx, text, t, a, me.x - 40, me.y - 0.95 * u - 24, a >= K.endT); }
  // ---- his sparkle on points (no numbers while you play) ----
  for (const p of (s.pop || [])) { const k = (t - p.t) / 0.35; if (k < 0 || k > 1 || p.k === 'tok') continue; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.k === 'kill' ? '#ffffff' : GOLD2; ctx.globalAlpha = 1 - k;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + k; ctx.fillRect(me.x + Math.cos(a) * (20 + 30 * k) - 2, me.y - 30 + Math.sin(a) * (20 + 30 * k) - 2, 4, 4); } ctx.restore(); }
  // ---- the token gauge (top left): a sticker coin-stack in a jar, the "enough" line at 60% ----
  gauge(ctx, s, t, K, b);
  // ---- the card (the album's sticker card), landing in the last frame on the music ----
  if (s.final && t > K.endT + 0.8) card(ctx, s.final, t - K.endT - 0.8);
}
function avText(ctx, text, x, y, col, size = 20, align = 'left') {
  ctx.save(); ctx.font = `700 ${size}px ${SANS}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; const w = ctx.measureText(text).width + 18, x0 = align === 'center' ? x - w / 2 : x;
  ctx.fillStyle = 'rgba(6,8,14,0.82)'; ctx.fillRect(x0, y - size * 0.75, w, size * 1.5); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x0, y - size * 0.75, w, size * 1.5);
  ctx.fillStyle = col; ctx.fillText(text, align === 'center' ? x : x + 9, y + 1); ctx.restore();
}
function aside(ctx, text, t, t0, x, y, leftOf = false) {
  ctx.save(); ctx.font = `400 19px ${MONO}`; const w = ctx.measureText(text).width + 26, h = 38, k = ease((t - t0) / 0.18); if (leftOf) { x -= w - 60; x = Math.max(104, Math.min(x, W - 340 - w - 16)); }   // (clear of the jar on the left too)   // (the last one sits to his left: the card lands on the right, never under it)
  x = Math.max(10, Math.min(x, W - w - 12)); y = Math.max(54, y); ctx.translate(x, y - h); ctx.rotate(-0.03); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); ctx.globalAlpha = k;
  if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-5, -5, w + 10, h + 10); } ctx.fillStyle = INK; ctx.fillRect(-2, -2, w + 4, h + 4); ctx.fillStyle = '#0a0612'; ctx.fillRect(2, 2, w - 4, h - 4);
  ctx.strokeStyle = WARM; ctx.lineWidth = 1.5; ctx.strokeRect(5, 5, w - 10, h - 10); ctx.fillStyle = CREAM; ctx.textBaseline = 'middle'; ctx.fillText(text, 13, h / 2 + 1); ctx.restore();
}
// the sword: it glitches in beside him in purple, swings one arc, and glitches out (about his height; no arm holds it)
function sword(ctx, s, t, me, u, kill) {
  const e = t - s.glitchAt, D = RG.SWING, d = s.swordDir || 1, k = clamp(e / D), big = kill ? 1.9 : 1;
  const inA = clamp(e / 0.06), outA = clamp((D + 0.05 - e) / 0.08), sw = ease(clamp((e - 0.03) / 0.2));
  const L = 1.25 * u * big, ang = d * (-2.1 + 2.9 * sw);       // from raised behind him, through an arc in front
  const px = me.x + d * 0.32 * u, py = me.y - 0.05 * u;
  ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
  const seed = Math.floor(t * 40), torn = inA < 1 || outA < 1;
  const blade = (ox, col, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(ox, 0);
    ctx.beginPath(); ctx.moveTo(-0.07 * u * big, -0.12 * u); ctx.lineTo(0.07 * u * big, -0.12 * u); ctx.lineTo(0.07 * u * big, -L); ctx.lineTo(0, -L - 0.12 * u * big); ctx.lineTo(-0.07 * u * big, -L); ctx.closePath();
    if (OLD_WHITE) { ctx.lineWidth = 9; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = col; ctx.fill();
    if (col === '#e8eef7') { ctx.fillStyle = '#9cc8ff'; ctx.fillRect(-0.012 * u * big, -L * 0.9, 0.024 * u * big, L * 0.75); }
    ctx.fillStyle = INK; ctx.fillRect(-0.24 * u * big, -0.16 * u, 0.48 * u * big, 0.1 * u); ctx.fillStyle = '#f2c230'; ctx.fillRect(-0.21 * u * big, -0.145 * u, 0.42 * u * big, 0.07 * u);   // the gold guard
    ctx.fillStyle = INK; ctx.fillRect(-0.04 * u, -0.08 * u, 0.08 * u, 0.2 * u); ctx.fillStyle = '#6a3a1a'; ctx.fillRect(-0.025 * u, -0.07 * u, 0.05 * u, 0.17 * u);
    ctx.restore(); };
  const a = Math.min(inA, outA);
  if (torn) { blade(-6, PURPLE, 0.7 * (1 - a)); blade(6, MAG, 0.6 * (1 - a)); }
  blade(0, '#e8eef7', a);
  if (torn) { ctx.fillStyle = PURPLE; for (let i = 0; i < 6; i++) { const y = -rnd(i, seed) * L; ctx.globalAlpha = 0.8 * (1 - a); ctx.fillRect(-18 + rnd(i, seed + 1) * 10, y, 22 + rnd(i, seed + 2) * 20, 4); }
    ctx.fillStyle = '#4dff9a'; for (let i = 0; i < 3; i++) ctx.fillRect(-10 + rnd(i, seed + 5) * 30, -rnd(i, seed + 6) * L, 4, 4); }   // his tears + green binary flecks
  ctx.restore();
  // the swing's arc of light
  if (e > 0.03 && e < 0.26) { const kk = (e - 0.03) / 0.23; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = kill ? '#ffffff' : LILAC; ctx.globalAlpha = 0.55 * (1 - kk); ctx.lineWidth = 10 * big;
    ctx.beginPath(); const a0 = -Math.PI / 2 + d * (-2.1 + 2.9 * ease(clamp(kk - 0.3))), a1 = -Math.PI / 2 + d * (-2.1 + 2.9 * ease(clamp(kk + 0.1)));
    ctx.arc(px, py, L * 0.85, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.restore(); }
  void k;
}
function coinHud(ctx, x, y, r, grey = false) { if (OLD_WHITE) { ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); } ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r - 2, 0, 7); ctx.fillStyle = grey ? '#8a8478' : GOLD; ctx.fill(); }
// the token gauge: a sticker jar of stacked coins (bigger than the old bar); the 60% "enough" line from "they check the meter"
function gauge(ctx, s, t, K, b) {
  const m = clamp(s.meter ?? 0), x = 18, y = 58, w = 66, h = 168, low = m < 0.25, lineOn = t >= K.lineFrom, blink = t >= 116.06 && t < 124.68 && Math.floor(b * 2) % 2 === 0;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.025);
  if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-6, -18, w + 12, h + 26, 14); ctx.fill(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-2, -14, w + 4, h + 18, 11); ctx.fill();
  ctx.fillStyle = '#16121c'; ctx.beginPath(); ctx.roundRect(3, 0, w - 6, h - 2, 8); ctx.fill();
  ctx.fillStyle = '#6a4a22'; ctx.fillRect(4, -10, w - 8, 9);   // the lid
  // the coins: stacked from the bottom
  const fillH = (h - 8) * m, n = Math.ceil(fillH / 9);
  ctx.save(); ctx.beginPath(); ctx.rect(5, 2, w - 10, h - 6); ctx.clip();
  for (let i = 0; i < n; i++) { const cy = h - 8 - i * 9, wob = (i % 2 ? 2 : -2) + Math.sin(i * 1.7) * 1.5; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(w / 2 + wob, cy, (w - 16) / 2 + 1, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = low ? (Math.floor(t * 4) % 2 ? '#ff7a4a' : GOLD) : GOLD; ctx.beginPath(); ctx.ellipse(w / 2 + wob, cy - 1, (w - 16) / 2 - 1, 4.5, 0, 0, 7); ctx.fill(); ctx.fillStyle = GOLD2; ctx.fillRect(w / 2 + wob - 10, cy - 3, 8, 2); }
  ctx.restore();
  if (s.tokenAt != null && t - s.tokenAt < 0.25) { glow(ctx, w / 2, h - 8 - fillH, 40, GOLD, 0.8 * (1 - (t - s.tokenAt) / 0.25)); }
  if (s.wasteAt != null && t - s.wasteAt >= 0 && t - s.wasteAt < 0.55) { const k = (t - s.wasteAt) / 0.55;   // an empty glitch: a coin pops out of the jar and is gone (his glitch eats tokens)
    ctx.save(); ctx.globalAlpha = 1 - k; coinHud(ctx, w / 2 + 70 * k, h - 8 - fillH - 60 * k + 120 * k * k, 8, k > 0.4); ctx.restore(); }
  if (lineOn && !blink) { const ly = h - 8 - (h - 8) * K.line; ctx.fillStyle = RED; ctx.fillRect(-8, ly - 2, w + 16, 4); ctx.fillStyle = INK; ctx.fillRect(-8, ly - 3, 6, 6); ctx.fillRect(w + 2, ly - 3, 6, 6); }
  if (low && s.restAt == null) { ctx.strokeStyle = RED; ctx.lineWidth = 3; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10); ctx.beginPath(); ctx.roundRect(-6, -18, w + 12, h + 26, 14); ctx.stroke(); ctx.globalAlpha = 1; }
  // a coin on top of the jar (no words: the coin says what it is)
  ctx.translate(w / 2, -26); if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fill(); } ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
  ctx.restore();
}
// the album's sticker card: score, the story number (banner %), best combo, the grade stamp, CLEAN
function card(ctx, F, k) {
  const a = ease(clamp(k / 0.35)), x = W - 330, y = 70 + (1 - a) * -260; ctx.save(); ctx.translate(x, y); ctx.rotate(0.03);
  if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -8, 296, 196); } ctx.fillStyle = INK; ctx.fillRect(-4, -4, 288, 188); ctx.fillStyle = '#1a1020'; ctx.fillRect(0, 0, 280, 180);
  ctx.fillStyle = CREAM; ctx.font = `400 16px ${MONO}`; ctx.textAlign = 'left'; ctx.fillText('still here', 16, 28);
  const tick = Math.min(1, k / 1.4), sc = Math.round(F.total * tick);
  ctx.font = `400 34px ${MONO}`; ctx.fillStyle = GOLD; ctx.fillText(String(sc), 16, 72);
  ctx.font = `400 15px ${MONO}`; ctx.fillStyle = CREAM; ctx.fillText(`${OLD_BANNER ? 'banner' : 'tokens'} ${Math.round(F.banner * 100)}%`, 16, 104); ctx.fillText(`best combo x${F.bestMult}`, 16, 128); ctx.fillText(`lights saved ${F.saved}/3`, 16, 152);
  if (F.clean) { ctx.fillStyle = '#4dff9a'; ctx.fillText('clean', 16, 174); }
  if (k > 1.2) { const g = clamp((k - 1.2) / 0.25); ctx.save(); ctx.translate(225, 110); ctx.rotate(-0.2); ctx.scale(1 + 1.4 * (1 - g), 1 + 1.4 * (1 - g)); ctx.globalAlpha = g;
    ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.strokeRect(-36, -40, 72, 80); ctx.fillStyle = RED; ctx.font = `400 58px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(F.grade.toLowerCase(), 0, 4); ctx.restore(); }
  ctx.restore();
}

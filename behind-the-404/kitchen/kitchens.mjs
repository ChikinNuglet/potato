// kitchens.mjs — Potato's kitchen, re-imagined for each of the album's ten songs (Chikin: "can you make origina kitchens and
// icons for the different costumes"; then "for the kitchen can you take away the menu, you can narrow it to ten costumes,
// each representing a song, with a door to the left of the screen that you walk through to start the level").
// The kitchen IS the menu: glitching changes his costume + the room + the song; the door on the left starts that song.
// Every room is painted in the same composition so he stands in it (window left, table centre with a lamp over it, counter
// + fridge right; he stands at about (575, 707) on this 1600x900 canvas, ~220 tall), then squeezed into x 200..1416 so the
// left wall can hold the DOOR (dressed for each room) with the song's sign over it (world text: its number + name), and the
// right wall the WATCH door (the song's demo, hands-off).
// House style (Vega's stickers): thick dark ink, flat fills with one cel-shade band, warm light. Purple is his glitch only.
// STYLES[i] (album order, one per song) = { id, level, name, outfit (slug | null), badge, door, paint(ctx, t, lit, o), icon(ctx, size) }.
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare
export const INK = '#120a05', WARM = '#ffcf8a';
export const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const dk = (c, k = 0.22) => mix(c, '#000000', k), lt = (c, k = 0.25) => mix(c, '#ffffff', k);
const rgba = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };

// ---------- drawing kit ----------
function stroke(x, o = {}) { if (o.lw === 0) return; x.lineWidth = o.lw ?? 6; x.strokeStyle = o.ink || INK; x.stroke(); }
function box(x, X, Y, W, H, fill, o = {}) {           // a rounded box: fill, one cel-shade band (right / bottom / left), ink
  x.beginPath(); x.roundRect(X, Y, W, H, o.r || 0); x.fillStyle = fill; x.fill();
  const sh = o.sh || 'r', f = o.f ?? 0.18;
  if (sh !== 'n') { x.save(); x.clip(); x.fillStyle = dk(fill, o.sk ?? 0.2);
    if (sh === 'r') x.fillRect(X + W * (1 - f), Y, W * f, H); else if (sh === 'b') x.fillRect(X, Y + H * (1 - f), W, H * f); else x.fillRect(X, Y, W * f, H); x.restore(); }
  stroke(x, o); }
function poly(x, pts, fill, o = {}) { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fillStyle = fill; x.fill();
  if (o.shade) { x.save(); x.clip(); x.fillStyle = dk(fill, o.sk ?? 0.2); x.fillRect(...o.shade); x.restore(); } stroke(x, o); }
function circ(x, cx, cy, r, fill, o = {}) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = fill; x.fill();
  if (o.sh !== 'n') { x.save(); x.clip(); x.fillStyle = dk(fill, o.sk ?? 0.2); x.fillRect(cx - 2 * r, cy - r, 4 * r, 2 * r); x.fillStyle = fill;   /* (wide: under the squeeze the circle is drawn wider, see squeezable) */ x.beginPath(); x.arc(cx - r * 0.2, cy - r * 0.2, r, 0, TAU); x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, r, 0, TAU); } stroke(x, o); }
function ell(x, cx, cy, rx, ry, fill, o = {}) { x.beginPath(); x.ellipse(cx, cy, rx, ry, o.rot || 0, 0, TAU); x.fillStyle = fill; x.fill(); stroke(x, o); }
function seg(x, pts, lw = 6, col = INK) { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.lineWidth = lw; x.strokeStyle = col; x.stroke(); }
// the squeeze: each room is painted straight into the strip between the two doors under scale(ROOM.sx, 1). While x.__sq is set
// (= that squeeze), whole circles stay round (drawn 1/sx wider round their centre) and ink keeps its width (lines are stroked with
// the squeeze taken back out), so the squeeze narrows the room without turning clocks, moons, portholes and plates into ovals or
// thinning the upright lines. (Part-arcs inside a shape, ellipses that aren't round and rotated frames are left as drawn.)
const C2D = typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : null;
function squeezable(x) {
  if (!C2D || x.__sqp) return x; x.__sqp = true;
  const whole = (a0, a1) => Math.abs(a1 - a0) >= TAU - 1e-3;
  const unsq = (c, k, cx, cy, draw) => { const m = C2D.getTransform.call(c); if (m.b || m.c) return false; C2D.save.call(c); C2D.translate.call(c, cx, cy); C2D.scale.call(c, 1 / k, 1); draw(); C2D.restore.call(c); return true; };
  x.arc = function (cx, cy, r, a0, a1, ccw = false) { const k = this.__sq;
    if (k && whole(a0, a1) && unsq(this, k, cx, cy, () => C2D.arc.call(this, 0, 0, r, a0, a1, ccw))) return; C2D.arc.call(this, cx, cy, r, a0, a1, ccw); };
  x.ellipse = function (cx, cy, rx, ry, rot, a0, a1, ccw = false) { const k = this.__sq;
    if (k && whole(a0, a1) && rx > 0 && ry > 0 && rx / ry > 0.9 && rx / ry < 1.1 && unsq(this, k, cx, cy, () => C2D.ellipse.call(this, 0, 0, rx, ry, rot, a0, a1, ccw))) return; C2D.ellipse.call(this, cx, cy, rx, ry, rot, a0, a1, ccw); };
  const even = (c, k, fn) => { const m = C2D.getTransform.call(c); C2D.save.call(c); C2D.setTransform.call(c, m.a / k, m.b, m.c / k, m.d, m.e, m.f); fn(); C2D.restore.call(c); };   // (the path is already placed: this only sets the pen)
  x.stroke = function (p) { const k = this.__sq, go = () => (p ? C2D.stroke.call(this, p) : C2D.stroke.call(this));
    if (!k || p || typeof this.strokeStyle !== 'string') return go(); even(this, k, go); };
  x.strokeRect = function (X, Y, W, H) { if (!this.__sq) return C2D.strokeRect.call(this, X, Y, W, H); C2D.beginPath.call(this); C2D.rect.call(this, X, Y, W, H); this.stroke(); };
  return x; }
const unsq = x => (x.__sq ? 1 / x.__sq : 1);   // (a part-arc that rides on a round thing: widen it by hand to match)
function grad(x, x0, y0, x1, y1, stops) { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, c]) => g.addColorStop(k, c)); return g; }
function wall(x, a, b, y1 = 640) { x.fillStyle = grad(x, 0, 0, 0, y1, [[0, a], [1, b]]); x.fillRect(0, 0, 1600, y1); }
function topShade(x, a = 0.35) { x.fillStyle = grad(x, 0, 0, 0, 420, [[0, `rgba(0,0,0,${a})`], [1, 'rgba(0,0,0,0)']]); x.fillRect(0, 0, 1600, 420); }   // keeps the top calm under the menu
function cone(x, ax, ay, hw, bx0, bx1, by, col, a) {   // a light cone, added
  const g = x.createRadialGradient(ax, ay, 6, ax, (ay + by) / 2, (by - ay) * 0.95); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.beginPath(); x.moveTo(ax - hw, ay); x.lineTo(bx0, by); x.lineTo(bx1, by); x.lineTo(ax + hw, ay); x.closePath(); x.fill(); x.restore(); }
function glow(x, cx, cy, r, col, a) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); x.restore(); }
function flame(x, cx, cy, h, t, s = 0, w = h * 0.42) {   // a cartoon flame with an ink edge
  const k = 1 + 0.16 * Math.sin(t * 13 + s * 7) + 0.1 * Math.sin(t * 23 + s * 3), H = h * k, sw = Math.sin(t * 9 + s * 5) * w * 0.35;
  const tear = (H, W, col, lw) => { x.beginPath(); x.moveTo(cx + sw, cy - H); x.bezierCurveTo(cx + W * 1.25, cy - H * 0.45, cx + W, cy, cx, cy); x.bezierCurveTo(cx - W, cy, cx - W * 1.25, cy - H * 0.45, cx + sw, cy - H); x.closePath();
    x.fillStyle = col; x.fill(); if (lw) { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); } };
  tear(H, w, '#ff8a2b', Math.max(2, h * 0.08)); tear(H * 0.6, w * 0.55, '#ffd84a', 0); }
function steam(x, cx, cy, t, n = 3, h = 90, a = 0.35, w = 7) {
  x.save(); for (let i = 0; i < n; i++) { const ph = (t * 0.45 + i / n) % 1; x.globalAlpha = a * Math.sin(ph * Math.PI); x.strokeStyle = '#f4efe6'; x.lineWidth = w * (1 - ph * 0.5); x.beginPath();
    for (let k = 0; k <= 10; k++) x.lineTo(cx + (i - (n - 1) / 2) * 12 + Math.sin(k * 0.7 + t * 2.2 + i * 2) * 9, cy - ph * h * 0.6 - k * h * 0.04); x.stroke(); } x.restore(); }
function stripes(x, X, Y, W, H, c1, c2, sw = 22, o = {}) {   // hazard stripes
  x.save(); x.beginPath(); x.roundRect(X, Y, W, H, o.r || 0); x.clip(); x.fillStyle = c1; x.fillRect(X, Y, W, H); x.fillStyle = c2;
  for (let k = -H; k < W + H; k += sw * 2) { x.beginPath(); x.moveTo(X + k, Y + H); x.lineTo(X + k + sw, Y + H); x.lineTo(X + k + sw + H, Y); x.lineTo(X + k + H, Y); x.closePath(); x.fill(); }
  x.restore(); x.beginPath(); x.roundRect(X, Y, W, H, o.r || 0); stroke(x, { lw: o.lw ?? 5 }); }
function cobweb(x, cx, cy, r, a0, a1, a = 0.55) {   // threads from a corner, sagging rings between them
  x.save(); x.strokeStyle = `rgba(225,230,235,${a})`; x.lineWidth = 2; const n = 6, P = [];
  for (let i = 0; i <= n; i++) { const an = a0 + (a1 - a0) * i / n; P.push([Math.cos(an), Math.sin(an)]); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + P[i][0] * r, cy + P[i][1] * r); x.stroke(); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.4; x.beginPath(); for (let i = 0; i < n; i++) { const p = P[i], q = P[i + 1], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (!i) x.moveTo(cx + p[0] * rr, cy + p[1] * rr); x.quadraticCurveTo(cx + m[0] * rr * 0.82, cy + m[1] * rr * 0.82, cx + q[0] * rr, cy + q[1] * rr); } x.stroke(); }
  x.restore(); }
function city(x, X, Y, W, H, n, lit = WARM, seed = 1) {   // a row of buildings with lit windows
  for (let i = 0; i < n; i++) { const bw = W / n, bx = X + i * bw, bh = H * (0.3 + rnd(i, seed) * 0.6); x.fillStyle = '#121a2e'; x.fillRect(bx, Y + H - bh, bw - 2, bh);
    for (let r = 0; r < 6; r++) if (rnd(i * 7 + r, seed + 2) < 0.45 && r * 16 + 12 < bh) { x.fillStyle = lit; x.fillRect(bx + bw * 0.3, Y + H - bh + 10 + r * 16, bw * 0.3, 6); } } }

// ---------- the original warm kitchen (Thursday Potato's room), piece by piece ----------
const PIECES = [
  [3.75, 'wall', x => { const g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#2b1d17'); g.addColorStop(1, '#1b120e'); x.fillStyle = g; x.fillRect(0, 0, 1600, 640);
    x.strokeStyle = 'rgba(255,207,138,.05)'; x.lineWidth = 3; for (let i = 0; i < 1600; i += 46) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 640); x.stroke(); } }],
  [3.85, 'floor', x => { x.fillStyle = '#2a1f19'; x.fillRect(0, 640, 1600, 260); for (let r = 0; r < 4; r++) for (let c = 0; c < 22; c++) if ((r + c) % 2) { x.fillStyle = '#3a2b22'; x.fillRect(c * 76 - (r % 2) * 38, 640 + r * 65, 76, 65); }
    x.fillStyle = '#120c09'; x.fillRect(0, 632, 1600, 14); }],
  [4.15, 'window', x => { x.fillStyle = '#0b1530'; x.fillRect(150, 150, 300, 230); x.fillStyle = '#f2e6c4'; x.beginPath(); x.arc(390, 200, 22, 0, 7); x.fill();
    for (let i = 0; i < 14; i++) { const bx = 160 + i * 21, bh = 40 + rnd(i, 1) * 90; x.fillStyle = '#121a2e'; x.fillRect(bx, 380 - bh, 19, bh); x.fillStyle = WARM; if (rnd(i, 2) < 0.6) x.fillRect(bx + 6, 390 - bh + 14, 5, 6); }
    x.lineWidth = 16; x.strokeStyle = '#5a3a26'; x.strokeRect(150, 150, 300, 230); x.lineWidth = 9; x.beginPath(); x.moveTo(300, 150); x.lineTo(300, 380); x.moveTo(150, 265); x.lineTo(450, 265); x.stroke();
    x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(142, 142, 316, 246); }],
  [4.45, 'cabinets', x => { for (let i = 0; i < 4; i++) { x.fillStyle = '#6a4630'; x.fillRect(820 + i * 150, 110, 140, 170); x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(820 + i * 150, 110, 140, 170);
    x.fillStyle = '#d9b27a'; x.fillRect(820 + i * 150 + (i % 2 ? 18 : 110), 190, 12, 26); } }],
  [4.75, 'counter', x => { x.fillStyle = '#5b3c29'; x.fillRect(800, 470, 640, 170); x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(800, 470, 640, 170); x.fillStyle = '#cfc6b3'; x.fillRect(790, 450, 660, 26); x.strokeRect(790, 450, 660, 26);
    x.fillStyle = '#2a2a30'; x.fillRect(1010, 430, 180, 22); for (const cx of [1050, 1150]) { x.beginPath(); x.ellipse(cx, 442, 34, 8, 0, 0, 7); x.strokeStyle = '#ff7a3d'; x.lineWidth = 4; x.stroke(); }
    x.fillStyle = '#8b8f99'; x.fillRect(1030, 380, 70, 52); x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(1030, 380, 70, 52); }],
  [5.05, 'fridge', x => { x.fillStyle = '#d9dde3'; x.beginPath(); x.roundRect(1460, 160, 130, 480, 16); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.moveTo(1460, 330); x.lineTo(1590, 330); x.stroke(); x.fillStyle = '#9aa1ad'; x.fillRect(1475, 250, 10, 50); x.fillRect(1475, 360, 10, 70); }],
  [5.35, 'table', x => { x.fillStyle = '#8a5a36'; x.beginPath(); x.roundRect(560, 560, 420, 34, 8); x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    for (const lx of [590, 930]) { x.fillStyle = '#6a4228'; x.fillRect(lx, 594, 26, 170); x.strokeRect(lx, 594, 26, 170); }
    }],   // (the plate is a prop now: kitchens props, bare)
  [5.6, 'chairs', x => { for (const [cx, d] of [[520, -1], [1020, 1]]) { x.fillStyle = '#7a4c2e'; x.fillRect(cx - 40, 610, 80, 20); x.lineWidth = 6; x.strokeStyle = INK; x.strokeRect(cx - 40, 610, 80, 20);
    x.fillRect(cx + d * 34 - 6, 470, 14, 140); x.strokeRect(cx + d * 34 - 6, 470, 14, 140); x.fillRect(cx - 34, 630, 12, 120); x.fillRect(cx + 22, 630, 12, 120); } }],
  [5.85, 'lamp', x => { x.strokeStyle = '#1a1210'; x.lineWidth = 5; x.beginPath(); x.moveTo(770, 0); x.lineTo(770, 330); x.stroke();
    x.fillStyle = '#3c6b4a'; x.beginPath(); x.moveTo(720, 380); x.lineTo(820, 380); x.lineTo(795, 330); x.lineTo(745, 330); x.closePath(); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); }],
];
function warmLight(cx, lit) {   // the green lamp's warm cone
  if (lit <= 0) return; const g = cx.createRadialGradient(770, 380, 10, 770, 560, 520); g.addColorStop(0, `rgba(255,214,150,${0.55 * lit})`); g.addColorStop(1, 'rgba(255,214,150,0)');
  cx.save(); cx.globalCompositeOperation = 'lighter'; cx.fillStyle = g; cx.beginPath(); cx.moveTo(745, 380); cx.lineTo(560, 900); cx.lineTo(980, 900); cx.lineTo(795, 380); cx.closePath(); cx.fill();
  cx.fillStyle = `rgba(255,232,180,${lit})`; cx.beginPath(); cx.ellipse(770, 382, 26, 8, 0, 0, 7); cx.fill(); cx.restore(); }

// ---------- the styles ----------
const S = [];

// the warm kitchen (Thursday Potato: just Potato, no costume)
S.push({ id: 'bare', name: 'the kitchen', outfit: null, badge: '#3c6b4a',
  base(x) { x.fillStyle = '#07090c'; x.fillRect(0, 0, 1600, 900); for (const [, n, d] of PIECES) if (n !== 'lamp' && n !== 'chairs') d(x); },   // (the lamp + chairs move now: drawn live)
  anim(x, t, lit, P = {}, me = null) { const pot = P.pot || Z; if (pot.on) steam(x, 1065, 364, t, 4, 150, 0.42, 9); else steam(x, 1065, 378, t, 2, 80, 0.22, 6);
    x.save(); x.translate(770, 0); x.rotate(lampSwing(P, t)); x.translate(-770, 0); warmLight(x, lit); x.restore(); },
  emblem(x) {   // the spud himself, as a blank sticker (no face: his face only comes from the model)
    const P = () => { x.beginPath(); x.moveTo(50, 20); x.bezierCurveTo(74, 18, 82, 44, 79, 60); x.bezierCurveTo(76, 78, 62, 84, 48, 83); x.bezierCurveTo(30, 82, 20, 70, 21, 54); x.bezierCurveTo(22, 34, 32, 21, 50, 20); x.closePath(); };
    P(); x.fillStyle = '#da9643'; x.fill(); x.save(); x.clip(); x.fillStyle = '#b8762f'; x.beginPath(); x.ellipse(74, 68, 20, 24, 0, 0, TAU); x.fill(); x.restore(); P(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
    for (const [a, b, r] of [[38, 40, 4], [60, 34, 3], [44, 64, 3.5], [64, 56, 2.5]]) ell(x, a, b, r * 1.3, r, '#9c6226', { lw: 0 });
    seg(x, [[34, 30], [40, 26]], 3, '#f6d29c'); } });

// 2. disco legend: the kitchen after hours — a mirrorball over the table, a light-up floor, a jukebox, a speaker stack
const DISCO = ['#ff4f8b', '#2fd3ff', '#ffc93c', '#5cff8a', '#ff8a2b'];
S.push({ id: 'disco-legend', name: 'the disco', outfit: 'disco-legend', badge: '#d8336f',
  base(x) {
    wall(x, '#1b1d44', '#0e0f26');
    for (let i = 0; i < 14; i++) { const a = rnd(i, 4) * 1600, b = 60 + rnd(i, 5) * 360; x.fillStyle = 'rgba(255,240,200,.18)'; x.beginPath(); for (let j = 0; j < 8; j++) { const r = j % 2 ? 2 : 7, an = j / 8 * TAU; x.lineTo(a + Math.cos(an) * r, b + Math.sin(an) * r); } x.fill(); }
    ['#ff8a2b', '#ffc93c', '#ff4f8b'].forEach((c, i) => { box(x, -10, 470 + i * 22, 1620, 18, c, { sh: 'n', lw: 3 }); });   // a 70s supergraphic
    topShade(x, 0.3);
    // the jukebox (where the window was)
    const jb = (o) => { x.beginPath(); x.moveTo(160 + o, 650); x.lineTo(160 + o, 420); x.arc(300, 420, 140 - o, Math.PI, 0); x.lineTo(440 - o, 650); x.closePath(); };
    jb(0); x.fillStyle = '#8a3a1c'; x.fill(); x.save(); x.clip(); x.fillStyle = '#6a2a12'; x.fillRect(380, 280, 80, 380); x.restore(); stroke(x, { lw: 6 });
    jb(26); x.fillStyle = '#26110c'; x.fill(); stroke(x, { lw: 5 });
    box(x, 214, 430, 172, 100, '#2a1d34', { r: 10, sh: 'n', lw: 5 }); for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) box(x, 226 + c * 32, 442 + r * 28, 26, 20, ['#f2ead8', '#ffd9a0', '#ffc0d0'][(r + c) % 3], { r: 2, sh: 'n', lw: 2 });
    box(x, 214, 548, 172, 82, '#c9ced6', { r: 6, lw: 5 }); for (let q = 0; q < 9; q++) seg(x, [[230 + q * 18, 556], [230 + q * 18, 622]], 4);
    // the floor is drawn live (the tiles light up); a dark rim under the wall
    // the bar (the counter), tufted pink vinyl, chrome, a record player
    box(x, 800, 474, 640, 166, '#d83e72', { lw: 6, f: 0.14 });
    x.strokeStyle = 'rgba(18,10,5,.35)'; x.lineWidth = 3; for (let q = 0; q < 12; q++) { x.beginPath(); x.moveTo(800 + q * 60, 474); x.lineTo(800 + q * 60 + 166, 640); x.moveTo(800 + q * 60 + 60, 474); x.lineTo(800 + q * 60 - 106, 640); x.stroke(); }
    x.save(); x.beginPath(); x.rect(800, 474, 640, 166); x.clip(); for (let q = 0; q < 12; q++) for (let r = 0; r < 3; r++) circ(x, 830 + q * 60 + (r % 2) * 30, 515 + r * 42, 5, '#ffd0e0', { sh: 'n', lw: 2 }); x.restore();
    box(x, 790, 450, 660, 26, '#d8dde6', { r: 8, sh: 'b', f: 0.35, lw: 6 }); seg(x, [[800, 456], [1440, 456]], 3, '#ffffff');
    box(x, 1010, 420, 160, 32, '#2b2b33', { r: 6, lw: 5 }); ell(x, 1080, 418, 56, 10, '#111', { lw: 4 }); seg(x, [[1150, 412], [1146, 404], [1108, 418]], 5);
    poly(x, [[880, 400], [930, 400], [905, 426]], 'rgba(47,211,255,.75)', { lw: 4 }); seg(x, [[905, 426], [905, 448]], 4); ell(x, 905, 450, 14, 3, '#d8dde6', { lw: 3 }); circ(x, 918, 398, 6, '#e8283c', { lw: 3 });
    for (const sx of [960, 1250]) { box(x, sx - 7, 556, 14, 170, '#c9ced6', { lw: 4, f: 0.4 }); ell(x, sx, 680, 30, 7, 'rgba(0,0,0,0)', { lw: 5 }); ell(x, sx, 728, 42, 9, '#c9ced6', { lw: 5 }); ell(x, sx, 552, 50, 16, '#ff4f8b', { lw: 6 }); }
    // the speaker stack (the fridge)
    for (const y of [210, 430]) { box(x, 1455, y, 140, 220, '#1d1d24', { r: 8, lw: 6, f: 0.12 }); circ(x, 1525, y + 40, 12, '#3a3a46', { lw: 4 }); }
    // the table: round, chrome, a drink with a paper umbrella
    box(x, 760, 586, 20, 150, '#c9ced6', { lw: 5, f: 0.4 }); ell(x, 770, 742, 72, 12, '#c9ced6', { lw: 5 });
    ell(x, 770, 572, 176, 20, '#bfc5ce', { lw: 6 }); ell(x, 770, 566, 170, 17, '#f2f4f8', { lw: 5 });
    box(x, 846, 520, 22, 40, 'rgba(255,138,43,.85)', { r: 4, lw: 4 }); seg(x, [[860, 522], [878, 496]], 3); poly(x, [[864, 500], [894, 490], [880, 506]], '#5cff8a', { lw: 3 });
  },
  anim(x, t, lit, P = {}, me = null, o = null) {
    const bb = o && o.beat != null ? o.beat + 0.25 : t * 2;   // (the music's beat when there is one: the flash peaks ON it, the beat he dances to)
    const beat = Math.max(0, Math.sin(bb * TAU)) ** 3, step = Math.floor(bb), party = flip(P.ball || Z, t, 0.4), jk = (P.juke || Z).on, boom = fade(since(P.speaker || Z, t), 0.5);
    const myR = me && me.y > 660 ? Math.floor((me.y - 640) / 65) : -1, myC = myR >= 0 ? Math.floor((me.x + (myR % 2) * 50) / 100) : -9;   // (the tile he's standing on lights up under him)
    for (let r = 0; r < 4; r++) for (let c = 0; c < 17; c++) { if (r === myR && c === myC) { const X = c * 100 - (r % 2) * 50, Y = 640 + r * 65; box(x, X, Y, 100, 65, '#fff3c4', { sh: 'b', f: 0.25, lw: 4 }); glow(x, X + 50, Y + 32, 90, '#ffe9a0', 0.45); continue; }
      const on = party > 0.5 || rnd(c * 3 + r, step) < 0.42, col = DISCO[(c + r * 2 + step) % 5], X = c * 100 - (r % 2) * 50, Y = 640 + r * 65;
      box(x, X, Y, 100, 65, on ? col : '#2a2440', { sh: on ? 'b' : 'n', f: 0.25, lw: 4 }); if (on) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(X + 8, Y + 8, 22, 8); } if (party > 0.5 && (c + r + step) % 3 === 0) { x.fillStyle = `rgba(255,255,255,${0.45 * beat})`; x.fillRect(X + 3, Y + 3, 94, 59); } }   // (party: every tile lit, a third of them flashing on the beat)
    x.fillStyle = '#0a0a16'; x.fillRect(0, 634, 1600, 10);
    for (let k = 0; k < 2; k++) { const sx = k ? 1540 : 60, tx = 770 + Math.sin(t * (k ? 0.6 : 0.75) * (1 + party * 2.2) + k * 2) * 420; cone(x, sx, -20, 10, tx - 110, tx + 110, 900, k ? '#2fd3ff' : '#ffc93c', 0.2 + 0.1 * party); }
    if (party > 0) for (let k = 0; k < 2; k++) { const sx = k ? 1180 : 360, tx = 770 + Math.sin(t * (k ? 2.1 : 1.7) + k * 3) * 520; cone(x, sx, -20, 10, tx - 90, tx + 90, 900, k ? '#5cff8a' : '#ff8a2b', 0.22 * party); }   // (warm + green: no purple-ish beams, purple is his)
    for (let i = 0; i < 24; i++) { const a = rnd(i, 1) * TAU + t * 0.5, d = 140 + rnd(i, 2) * 760, px = 770 + Math.cos(a) * d * 1.15, py = 430 + Math.sin(a) * d * 0.42;
      glow(x, px, py, 10 + rnd(i, 3) * 6, i % 3 ? '#ffffff' : DISCO[i % 5], 0.55); }
    if (party > 0) for (let i = 0; i < 46; i++) { const a = rnd(i, 21) * TAU + t * (1.4 + rnd(i, 22) * 0.8), d = 120 + rnd(i, 23) * 820, px = 770 + Math.cos(a) * d * 1.15, py = 400 + Math.sin(a) * d * 0.5;   // party: the room full of moving light
      glow(x, px, py, 9 + rnd(i, 24) * 9, DISCO[i % 5], 0.7 * party); }
    const arch = (o) => { x.beginPath(); x.moveTo(160 + o, 648); x.lineTo(160 + o, 420); x.arc(300, 420, 140 - o, Math.PI, 0); x.lineTo(440 - o, 648); };
    const js = jk ? Math.floor(t * 7) : step; arch(13); x.lineWidth = 14; x.strokeStyle = DISCO[js % 5]; x.stroke(); arch(13); x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.6)'; x.stroke(); glow(x, 300, 420, 180, DISCO[js % 5], jk ? 0.3 : 0.12);
    for (const y of [210, 430]) { const R = 46 * (1 + 0.07 * beat + 0.3 * boom * boom); circ(x, 1525, y + 140, R, '#3a3a46', { sh: 'n', lw: 6 }); circ(x, 1525, y + 140, R * 0.62, '#26262e', { sh: 'n', lw: 4 }); circ(x, 1525, y + 140, R * 0.22, '#55556a', { sh: 'n', lw: 4 }); }
    const la = t * 3.6; circ(x, 1080 + Math.cos(la) * 30, 418 + Math.sin(la) * 5, 5, '#ffc93c', { sh: 'n', lw: 2 });
    // the mirrorball
    seg(x, [[770, 0], [770, 346]], 5, '#9aa1ad');
    const cx = 770, cy = 404, R = 58; cone(x, cx, cy, 20, cx - 260, cx + 260, 900, '#ffe6f0', (0.18 + 0.12 * party) * lit);
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip(); x.fillStyle = '#7b8496'; x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    for (let j = -6; j <= 6; j++) { const la0 = j / 6.5 * Math.PI / 2, yy = cy + Math.sin(la0) * R, w = Math.cos(la0) * R, hh = R * 0.24 * Math.cos(la0) + 2;
      for (let c = 0; c < 16; c++) { const ph = (c / 16 * TAU + t * (0.9 + 3.2 * party)) % TAU, s0 = Math.sin(ph), cz = Math.cos(ph); if (cz < 0) continue; const px = cx + s0 * w, fw = Math.max(2, cz * w * 0.36);
        const v = rnd(c, j + 9), col = v < 0.08 ? '#ffc0d8' : v < 0.16 ? '#bff0ff' : v < 0.5 ? '#e8eef8' : v < 0.8 ? '#aab3c4' : '#6a7386';
        x.fillStyle = col; x.fillRect(px - fw / 2, yy - hh / 2, fw - 1.5, hh - 1.5); } }
    x.fillStyle = 'rgba(18,10,5,.32)'; x.beginPath(); x.arc(cx + 18, cy + 18, R, 0, TAU); x.arc(cx, cy, R + 40, 0, TAU, true); x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, R, 0, TAU); stroke(x, { lw: 6 }); box(x, cx - 8, cy - R - 10, 16, 12, '#9aa1ad', { sh: 'n', lw: 4 });
    if (party > 0) { glow(x, cx, cy, R * 3.2, '#ffffff', 0.4 * party * beat); for (let k = 0; k < 4; k++) { const a = t * 2.4 + k * 1.57; sparkle(x, cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7, 14 * party * (0.4 + 0.6 * beat), 1); } }   // party: the ball flashes on the beat
    for (let k = 0; k < 3; k++) { const ph = (t * 1.3 + k * 0.37) % 1, s = Math.sin(ph * Math.PI) * 14, px = cx - 30 + k * 26, py = cy - 26 + k * 18; x.fillStyle = '#fff';
      x.beginPath(); x.moveTo(px, py - s); x.lineTo(px + s * 0.22, py); x.lineTo(px, py + s); x.lineTo(px - s * 0.22, py); x.closePath(); x.moveTo(px - s, py); x.lineTo(px, py + s * 0.22); x.lineTo(px + s, py); x.lineTo(px, py - s * 0.22); x.fill(); }
  },
  emblem(x) { seg(x, [[50, 8], [50, 24]], 4); const cx = 50, cy = 54, R = 28; x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip(); x.fillStyle = '#9aa3b5'; x.fillRect(20, 24, 60, 60);
    for (let j = -3; j <= 3; j++) for (let c = -4; c <= 4; c++) { const v = rnd(c, j); x.fillStyle = v < 0.2 ? '#ffffff' : v < 0.6 ? '#c8d0dc' : '#6f7890'; x.fillRect(cx + c * 8 - 3.5, cy + j * 8 - 3.5, 7, 7); }
    x.fillStyle = 'rgba(18,10,5,.3)'; x.beginPath(); x.arc(cx + 10, cy + 10, R, 0, TAU); x.arc(cx, cy, R + 20, 0, TAU, true); x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, R, 0, TAU); stroke(x, { lw: 5 }); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(74, 18); x.lineTo(77, 27); x.lineTo(86, 30); x.lineTo(77, 33); x.lineTo(74, 42); x.lineTo(71, 33); x.lineTo(62, 30); x.lineTo(71, 27); x.closePath(); x.fill(); x.lineWidth = 2.5; x.stroke(); } });

// 9. the tin robot: Turn Me Off's room (Chikin: "kitchen will need redone, think jetsons or fantastic 4") — a 1960s space-age kitchen
// of OUR OWN in that era's style (no show's characters, logos or looks): a bubble window on a sky city with flying cars, a boomerang
// formica counter, atomic starbursts, chrome + mint / coral / cream / turquoise, push buttons and big dials, a flying-saucer lamp over
// a tulip table, a meal-pellet dispenser fed by a whooshing glass tube, a little round TV on a stalk. And it's bedtime out there (the
// song is a toy room at bedtime, him a wind-up toy): the sky's gone to dusk, the moon's up, the starburst clock says nine.
const RF = { coral: '#ff7a62', cream: '#fff0cf', teal: '#2fb5ac', chrome: '#cdd6df', steel: '#9aa6b3', mustard: '#f4c04a', red: '#e8463a', glass: '#d5f1f0', screen: '#24352f' };
const OVAL = () => 1 / ROOM.sx;   // (the room is squeezed sideways to fit the doors: round things here are drawn this much wider so they still read round)
function burst(x, cx, cy, r, n, col, o = {}) {   // an atomic starburst: spokes of two lengths, a ball on every tip
  const q = o.q ?? OVAL(), lw = o.lw ?? 4, rb = o.rb ?? Math.max(3, r * 0.1), tips = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + (o.rot || 0), rr = r * (i % 2 ? 0.62 : 1); tips.push([cx + Math.cos(a) * rr * q, cy + Math.sin(a) * rr]); }
  for (const p of tips) seg(x, [[cx, cy], p], lw + 4); for (const p of tips) seg(x, [[cx, cy], p], lw, col);
  for (const [a, b] of tips) ell(x, a, b, rb * q, rb, o.ball || col, { lw: Math.max(2, lw * 0.7) }); }
function boomer(x, cx, cy, s, rot, col, a = 1) {   // a boomerang, the era's favourite shape (the wallpaper, the formica)
  x.save(); x.globalAlpha = a; x.translate(cx, cy); x.rotate(rot); x.scale(s * OVAL(), s);
  x.beginPath(); x.moveTo(-22, 5); x.quadraticCurveTo(-12, -9, 0, -10); x.quadraticCurveTo(12, -9, 22, 5); x.quadraticCurveTo(25, 12, 17, 11); x.quadraticCurveTo(8, 2, 0, 3); x.quadraticCurveTo(-8, 2, -17, 11); x.quadraticCurveTo(-25, 12, -22, 5); x.closePath();
  x.fillStyle = col; x.fill(); x.restore(); }
function skyCar(x, cx, cy, s, col, dir) {   // a bubble-top flying car (ours: a saucer body, a glass bubble, one fin), with a puff trail
  x.save(); x.translate(cx, cy); x.scale(s * dir * OVAL(), s);
  for (let k = 1; k <= 3; k++) { x.globalAlpha = 0.5 - k * 0.13; ell(x, -30 - k * 13, 2, 6 - k, 5 - k, '#fff6e4', { lw: 0 }); } x.globalAlpha = 1;
  poly(x, [[-20, -2], [-32, -15], [-14, -5]], col, { lw: 3 }); x.beginPath(); x.ellipse(5, -5, 14, 12, 0, Math.PI, 0); x.closePath(); x.fillStyle = 'rgba(225,250,255,.9)'; x.fill(); stroke(x, { lw: 3 });
  ell(x, 0, 0, 30, 8, col, { lw: 3 }); ell(x, 0, 3, 18, 3, dk(col, 0.25), { lw: 0 }); x.restore(); }
function rocket(x, cx, by, col, a = 0) {   // a salt / pepper shaker shaped like a little rocket (by = its base)
  x.save(); x.translate(cx, by); x.rotate(a); const q = OVAL(); x.scale(q, 1);
  poly(x, [[-7, -2], [-13, 4], [-7, -12]], RF.coral, { lw: 3 }); poly(x, [[7, -2], [13, 4], [7, -12]], RF.coral, { lw: 3 });
  x.beginPath(); x.moveTo(-7, 0); x.lineTo(-7, -20); x.quadraticCurveTo(-7, -34, 0, -40); x.quadraticCurveTo(7, -34, 7, -20); x.lineTo(7, 0); x.closePath(); x.fillStyle = col; x.fill(); stroke(x, { lw: 3.5 });
  ell(x, 0, -21, 3.5, 3.5, RF.teal, { lw: 2.5 }); x.restore(); }
function tubePath(x) { x.beginPath(); x.moveTo(1390, -30); x.lineTo(1390, 106); x.quadraticCurveTo(1390, 150, 1346, 150); x.lineTo(1144, 150); x.quadraticCurveTo(1100, 150, 1100, 194); x.lineTo(1100, 312); }
const TUBE = (() => { const P = [[1390, -30], [1390, 106]], q = (a, c, b) => { for (let i = 1; i <= 8; i++) { const u = i / 8, v = 1 - u; P.push([v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]); } };
  q([1390, 106], [1390, 150], [1346, 150]); P.push([1144, 150]); q([1144, 150], [1100, 150], [1100, 194]); P.push([1100, 312]);
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return { P, L, len: L[L.length - 1] }; })();
function alongTube(d) { const { P, L } = TUBE; let i = 1; while (i < P.length - 1 && L[i] < d) i++; const k = Math.max(0, Math.min(1, (d - L[i - 1]) / (L[i] - L[i - 1] || 1)));
  return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k, Math.atan2(P[i][1] - P[i - 1][1], P[i][0] - P[i - 1][0])]; }
const TVX = 930, TVY = 286, CARS = [[0.07, 222, RF.coral, 0.8, 0.1, 1], [0.045, 268, RF.teal, 0.62, 0.55, -1], [0.1, 186, RF.mustard, 0.5, 0.8, 1]];
S.push({ id: 'tin-robot', name: 'the kitchen of tomorrow', outfit: 'tin-robot', badge: '#2fb5ac',
  base(x) {
    const q = OVAL();
    wall(x, '#b4e6d4', '#92d2bc');
    for (let i = 0; i < 44; i++) { const a = rnd(i, 31) * 1600, b = 24 + rnd(i, 32) * 440, c = [RF.cream, RF.coral, RF.teal][i % 3];   // the wallpaper: boomerangs and little starbursts
      if (i % 2) boomer(x, a, b, 0.6 + rnd(i, 33) * 0.3, rnd(i, 34) * TAU, c, 0.55);
      else { x.save(); x.globalAlpha = 0.35; for (let k = 0; k < 8; k++) { const an = k / 8 * TAU, r = k % 2 ? 6 : 13; seg(x, [[a, b], [a + Math.cos(an) * r * q, b + Math.sin(an) * r]], 2.5, c); } x.restore(); } }
    topShade(x, 0.22);
    x.fillStyle = RF.cream; x.fillRect(0, 500, 1600, 140); for (let X = 40; X < 1600; X += 80) seg(x, [[X, 506], [X, 640]], 3, 'rgba(47,181,172,.3)');   // the lower wall
    box(x, -10, 488, 1620, 16, RF.coral, { sh: 'b', f: 0.3, lw: 4 });
    // the bubble window: dusk over a sky city — low blocks, towers on stalks with saucer decks, a monorail, the moon
    const winP = () => { x.beginPath(); x.ellipse(300, 300, 188, 150, 0, 0, TAU); };
    winP(); x.save(); x.clip();
    const sky = grad(x, 0, 150, 0, 450, [[0, '#1f3a78'], [0.5, '#5a6fb0'], [0.78, '#e9909a'], [1, '#ffc58c']]); x.fillStyle = sky; x.fillRect(100, 140, 400, 330);
    for (let k = 0; k < 14; k++) ell(x, 130 + rnd(k, 41) * 340, 165 + rnd(k, 42) * 100, (1.5 + rnd(k, 43) * 1.8) * q, 1.5 + rnd(k, 43) * 1.8, '#fff6dc', { lw: 0 });
    const moon = () => { x.beginPath(); x.ellipse(396, 214, 24 * q, 24, 0, 0, TAU); }, bite = () => { x.beginPath(); x.ellipse(410, 205, 22 * q, 22, 0, 0, TAU); };
    moon(); x.fillStyle = '#fff2c8'; x.fill(); x.save(); moon(); x.clip(); bite(); x.fillStyle = sky; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); x.restore();
    x.save(); x.beginPath(); x.rect(100, 140, 400, 330); x.ellipse(410, 205, 22 * q, 22, 0, 0, TAU); x.clip('evenodd'); moon(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); x.restore();
    x.beginPath(); x.moveTo(96, 404); x.quadraticCurveTo(300, 350, 504, 396); x.lineWidth = 13; x.strokeStyle = INK; x.stroke(); x.lineWidth = 6; x.strokeStyle = RF.chrome; x.stroke();   // the monorail
    for (const [px, py] of [[170, 388], [300, 378], [430, 386]]) seg(x, [[px, py + 6], [px, 470]], 6);
    for (let i = 0; i < 12; i++) { const bx = 104 + i * 34, bh = 30 + rnd(i, 51) * 50; box(x, bx, 452 - bh, 30, bh + 20, '#2b3f6a', { r: 6, sh: 'n', lw: 3 });
      for (let r = 0; r < 3; r++) if (rnd(i * 5 + r, 52) < 0.55 && r * 14 + 16 < bh) { x.fillStyle = '#ffd98a'; x.fillRect(bx + 10, 452 - bh + 8 + r * 14, 10, 6); } }
    for (const [tx, top, col, s] of [[176, 262, RF.coral, 0.85], [300, 314, RF.cream, 0.7], [418, 240, RF.teal, 1]]) {   // towers on stalks
      box(x, tx - 6, top, 12, 470 - top, RF.steel, { sh: 'r', f: 0.4, lw: 4 });
      ell(x, tx, top + 4, 50 * s * q, 13 * s, col, { lw: 4 }); ell(x, tx, top - 3, 32 * s * q, 9 * s, lt(col, 0.35), { lw: 3.5 });
      x.fillStyle = '#ffe9a8'; for (let k = -2; k <= 2; k++) x.fillRect(tx + k * 15 * s * q - 3, top + 2, 6, 4);
      seg(x, [[tx, top - 10], [tx, top - 40 * s]], 3); ell(x, tx, top - 42 * s, 6 * q, 6, RF.red, { lw: 3 }); }
    x.globalAlpha = 0.25; ell(x, 236, 214, 70, 26, '#ffffff', { lw: 0, rot: -0.55 }); x.globalAlpha = 1; x.restore();
    winP(); x.lineWidth = 36; x.strokeStyle = INK; x.stroke(); winP(); x.lineWidth = 26; x.strokeStyle = RF.chrome; x.stroke();
    x.beginPath(); x.ellipse(300, 300, 195, 157, 0, -0.25, Math.PI * 0.7); x.lineWidth = 9; x.strokeStyle = RF.steel; x.stroke();   // (the ring's shaded side)
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + 0.26; ell(x, 300 + Math.cos(a) * 188, 300 + Math.sin(a) * 150, 4.5 * q, 4.5, RF.steel, { lw: 2.5 }); }
    box(x, 150, 456, 300, 20, RF.teal, { r: 8, sh: 'b', f: 0.35, lw: 5 });   // the sill
    // the starburst clock (it says nine: bedtime)
    burst(x, 612, 168, 66, 12, RF.mustard, { ball: RF.coral, lw: 4 }); ell(x, 612, 168, 28 * q, 28, RF.cream, { lw: 5 });
    seg(x, [[612, 168], [612 - 17 * q, 168]], 6); seg(x, [[612, 168], [612, 146]], 4);
    // the floor: cream + turquoise squares, a coral oval rug under the table
    for (let r = 0; r < 4; r++) for (let c = 0; c < 21; c++) { x.fillStyle = (r + c) % 2 ? '#f4e6c4' : '#59c2b8'; x.fillRect(c * 80, 640 + r * 65, 80, 65); }
    for (let r = 0; r <= 4; r++) seg(x, [[0, 640 + r * 65], [1600, 640 + r * 65]], 2, 'rgba(18,10,5,.3)');
    ell(x, 770, 724, 420, 40, RF.coral, { lw: 6 }); x.beginPath(); x.ellipse(770, 724, 380, 30, 0, 0, TAU); x.lineWidth = 7; x.strokeStyle = RF.cream; x.stroke();
    x.fillStyle = '#120c09'; x.fillRect(0, 634, 1600, 10);
    // the glass tube (out of the ceiling, along the wall, down into the dispenser): the capsules whoosh through it
    tubePath(x); x.lineWidth = 46; x.strokeStyle = INK; x.stroke(); tubePath(x); x.lineWidth = 36; x.strokeStyle = RF.glass; x.stroke();
    x.save(); x.translate(-9, -9); tubePath(x); x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,.75)'; x.stroke(); x.restore();
    box(x, 1350, -12, 80, 24, RF.steel, { r: 4, lw: 4 }); box(x, 1364, 54, 52, 16, RF.chrome, { r: 4, sh: 'b', f: 0.35, lw: 4 }); box(x, 1250, 124, 16, 52, RF.chrome, { r: 4, sh: 'r', f: 0.35, lw: 4 }); box(x, 1074, 230, 52, 16, RF.chrome, { r: 4, sh: 'b', f: 0.35, lw: 4 });
    // the counter: coral cabinets, cream doors with porthole pulls, a chrome kick, a turquoise boomerang-formica top with a rounded nose
    box(x, 800, 476, 640, 164, RF.coral, { lw: 6, f: 0.12 });
    for (let i = 0; i < 3; i++) { box(x, 818 + i * 208, 492, 188, 118, RF.cream, { r: 22, sh: 'b', f: 0.16, lw: 5 }); ell(x, 912 + i * 208, 551, 13 * q, 13, RF.chrome, { lw: 4 }); ell(x, 912 + i * 208, 551, 5 * q, 5, RF.steel, { lw: 0 }); }
    box(x, 800, 618, 640, 22, RF.chrome, { sh: 'b', f: 0.4, lw: 5 });
    box(x, 770, 446, 686, 30, RF.teal, { r: [15, 4, 4, 15], sh: 'b', f: 0.3, lw: 6 });
    x.save(); x.beginPath(); x.rect(776, 449, 676, 16); x.clip(); for (let i = 0; i < 27; i++) boomer(x, 786 + i * 25 + rnd(i, 61) * 8, 457 + rnd(i, 62) * 4, 0.3, (rnd(i, 63) - 0.5) * 1.6, i % 2 ? RF.cream : RF.mustard, 0.75); x.restore();
    seg(x, [[784, 449], [1450, 449]], 3, 'rgba(255,255,255,.7)');
    // the push-button console on the wall (big dials; its lights blink live) and the flush cooktop under it
    box(x, 1196, 214, 228, 116, RF.cream, { r: 24, sh: 'b', f: 0.14, lw: 6 });
    for (const [dx, col] of [[1238, RF.mustard], [1316, RF.coral]]) { ell(x, dx, 270, 30 * q, 30, dk(col, 0.25), { lw: 5 }); ell(x, dx, 266, 26 * q, 26, col, { lw: 4 }); seg(x, [[dx, 266], [dx + 12 * q, 250]], 5); for (let k = 0; k < 7; k++) { const a = Math.PI * (0.8 + k * 0.233); seg(x, [[dx + Math.cos(a) * 34 * q, 270 + Math.sin(a) * 34], [dx + Math.cos(a) * 40 * q, 270 + Math.sin(a) * 40]], 3); } }
    for (const bx of [1300, 1392]) { ell(x, bx, 446, 40, 6, '#3a3f46', { lw: 4 }); ell(x, bx, 446, 24, 3, '#5a616b', { lw: 0 }); }
    // the TV: a round set on a chrome stalk, rabbit ears with balls on (the screen is drawn live)
    poly(x, [[922, 344], [938, 344], [948, 440], [912, 440]], RF.chrome, { lw: 4, shade: [932, 340, 20, 110] }); ell(x, 930, 442, 40, 7, RF.steel, { lw: 4 });
    seg(x, [[918, 226], [882, 158]], 4); seg(x, [[942, 226], [980, 154]], 4); ell(x, 882, 156, 6 * q, 6, RF.mustard, { lw: 3 }); ell(x, 980, 152, 6 * q, 6, RF.mustard, { lw: 3 });
    x.beginPath(); x.ellipse(TVX, TVY, 68 * q, 66, 0, 0, TAU); x.fillStyle = RF.cream; x.fill(); x.save(); x.clip(); x.fillStyle = dk(RF.cream, 0.14); x.beginPath(); x.ellipse(TVX + 14, TVY + 12, 68 * q, 66, 0, 0, TAU); x.ellipse(TVX, TVY, 90 * q, 90, 0, 0, TAU); x.fill('evenodd'); x.restore();
    x.beginPath(); x.ellipse(TVX, TVY, 68 * q, 66, 0, 0, TAU); stroke(x, { lw: 6 });
    ell(x, TVX, TVY, 55 * q, 53, RF.coral, { lw: 4 }); ell(x, TVX, TVY, 46 * q, 44, RF.screen, { lw: 5 });
    for (const kx of [-1, 1]) ell(x, TVX + kx * 22 * q, TVY + 59, 5 * q, 4, RF.steel, { lw: 2.5 });
    // the meal dispenser: a chrome capsule, a glass top full of pellets, a coral collar, the chute (its big button is live); the plate the meal lands on
    box(x, 1036, 300, 128, 146, RF.chrome, { r: [40, 40, 10, 10], sh: 'r', f: 0.22, lw: 6 });
    x.save(); x.beginPath(); x.roundRect(1050, 308, 100, 56, [32, 32, 6, 6]); x.fillStyle = RF.glass; x.fill(); x.clip();
    for (let i = 0; i < 14; i++) ell(x, 1062 + (i % 7) * 13 + (i > 6 ? 6 : 0), 356 - (i > 6 ? 11 : 0) - rnd(i, 71) * 3, 7, 4.5, [RF.coral, RF.mustard, RF.teal, '#8fd06a'][i % 4], { lw: 2 });
    x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(1060, 316, 8, 30); x.restore(); x.beginPath(); x.roundRect(1050, 308, 100, 56, [32, 32, 6, 6]); stroke(x, { lw: 4 });
    box(x, 1040, 364, 120, 14, RF.coral, { r: 4, sh: 'b', f: 0.3, lw: 4 });
    box(x, 1078, 414, 44, 26, '#2a2f36', { r: [12, 12, 2, 2], sh: 'n', lw: 4 }); box(x, 1072, 436, 56, 8, RF.steel, { r: 3, sh: 'n', lw: 3 });
    ell(x, 1200, 444, 34, 7, '#fbf6ec', { lw: 4 }); ell(x, 1200, 443, 22, 3.5, RF.cream, { lw: 0 });
    // the fridge: rounded top, cream, a coral band, a porthole, a starburst, chrome handles
    box(x, 1458, 150, 134, 490, RF.cream, { r: [62, 62, 12, 12], sh: 'r', f: 0.16, lw: 6 });
    box(x, 1458, 318, 134, 24, RF.coral, { sh: 'b', f: 0.3, lw: 5 }); box(x, 1470, 230, 12, 70, RF.chrome, { r: 6, sh: 'r', f: 0.4, lw: 4 }); box(x, 1470, 356, 12, 84, RF.chrome, { r: 6, sh: 'r', f: 0.4, lw: 4 });
    ell(x, 1530, 232, 30 * q, 30, RF.chrome, { lw: 5 }); ell(x, 1530, 232, 22 * q, 22, '#bfeee6', { lw: 4 }); ell(x, 1522, 224, 7 * q, 5, 'rgba(255,255,255,.8)', { lw: 0, rot: -0.6 });
    burst(x, 1530, 486, 34, 8, RF.teal, { ball: RF.mustard, lw: 3.5 }); for (const fx of [1474, 1560]) box(x, fx, 634, 18, 10, RF.steel, { r: 3, sh: 'n', lw: 3 });
    // the tulip table: one flared stem, a round top, a plate
    ell(x, 770, 712, 96, 14, RF.cream, { lw: 5 });
    x.beginPath(); x.moveTo(746, 584); x.quadraticCurveTo(764, 650, 738, 706); x.lineTo(802, 706); x.quadraticCurveTo(776, 650, 794, 584); x.closePath(); x.fillStyle = RF.cream; x.fill(); x.save(); x.clip(); x.fillStyle = dk(RF.cream, 0.14); x.fillRect(778, 580, 40, 170); x.restore(); stroke(x, { lw: 5 });
    ell(x, 770, 568, 216, 24, RF.chrome, { lw: 6 }); ell(x, 770, 560, 214, 22, '#fffaf0', { lw: 5 });
    ell(x, 688, 556, 40, 8, '#fbf6ec', { lw: 4 }); ell(x, 688, 555, 26, 4.5, '#bfe8d8', { lw: 0 });
  },
  anim(x, t, lit, P = {}) {
    const q = OVAL();
    x.save(); x.beginPath(); x.ellipse(300, 300, 175, 137, 0, 0, TAU); x.clip();   // flying cars crossing the window
    for (const [sp, y, col, s, ph, dir] of CARS) { const u = (t * sp + ph) % 1; skyCar(x, dir > 0 ? 70 + u * 460 : 530 - u * 460, y + Math.sin(t * 2 + ph * 9) * 4, s, col, dir); }
    x.restore();
    const sa = Math.floor(t) / 60 * TAU - Math.PI / 2; seg(x, [[612, 168], [612 + Math.cos(sa) * 24 * q, 168 + Math.sin(sa) * 24]], 2.5, RF.red); ell(x, 612, 168, 3.5 * q, 3.5, RF.red, { lw: 2 });   // the clock's second hand
    for (let k = 0; k < 6; k++) { const on = rnd(k, Math.floor(t * 2.5)) < 0.5, bx = 1362 + (k % 2) * 28, by = 234 + Math.floor(k / 2) * 26;   // the console's buttons blink
      box(x, bx, by, 20, 16, on ? [RF.red, RF.mustard, '#8fe06a'][k % 3] : '#6d7480', { r: 4, sh: 'n', lw: 3 }); }
    // the saucer lamp's light: a soft beam on the table; switched on, it spins up and beams rings down (the shakers float in it)
    const so = P.saucer || Z, k = flip(so, t, 0.6), sa2 = since(so, t);
    cone(x, 770, 366, 72, 560, 980, 900, k > 0 ? '#eafff4' : '#fff1cf', (0.3 + 0.32 * k) * lit);
    if (k > 0) for (let i = 0; i < 4; i++) { const ph = (sa2 * 0.9 + i / 4) % 1, yy = 380 + ph * 380, rx = 46 + ph * 170; x.save(); x.globalAlpha = k * Math.sin(ph * Math.PI) * 0.9;
      x.beginPath(); x.ellipse(770, yy, rx, rx * 0.16, 0, 0, TAU); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#eafff4'; x.stroke(); x.restore(); }
    if (k > 0) for (let i = 0; i < 3; i++) { const a = sa2 * 1.7 + i * 2.1; sparkle(x, 770 + Math.cos(a) * 120, 470 + Math.sin(a * 1.3) * 60, 12 * k, 1); }
    // the TV: off is a dark screen; on, a burst of static, then a test pattern (bars, a ring, a starburst); off again, it shrinks to a dot
    const tv = P.tv || Z, ta = since(tv, t), rx = 46 * q, ry = 44;
    if (tv.on || (ta >= 0 && ta < 0.45)) { x.save(); x.beginPath(); x.ellipse(TVX, TVY, rx, ry, 0, 0, TAU); x.clip();
      if (tv.on && ta < 0.55) { const f = Math.floor(t * 30); x.fillStyle = '#c9cec8'; x.fillRect(TVX - rx, TVY - ry, 2 * rx, 2 * ry);
        for (let i = 0; i < 110; i++) { const v = rnd(i, f); x.fillStyle = v < 0.5 ? '#2f3533' : '#fbfdf9'; x.fillRect(TVX - rx + rnd(i, f + 1) * 2 * rx, TVY - ry + rnd(i, f + 2) * 2 * ry, 4 + v * 12, 3); }
        if (ta < 0.14) { x.fillStyle = `rgba(255,255,255,${1 - ta / 0.14})`; x.fillRect(TVX - rx, TVY - ry, 2 * rx, 2 * ry); } }
      else if (tv.on) { const B = ['#fff0cf', RF.mustard, RF.teal, '#8fe06a', RF.coral, RF.red, '#3b6fd0'], roll = Math.floor(t * 0.5) % 5 === 0 ? ((t * 0.5) % 1) * 2 * ry : 0;
        for (let i = 0; i < 7; i++) { x.fillStyle = B[i]; x.fillRect(TVX - rx + i * 2 * rx / 7, TVY - ry - roll, 2 * rx / 7 + 1, 2 * ry); x.fillRect(TVX - rx + i * 2 * rx / 7, TVY + ry - roll, 2 * rx / 7 + 1, 2 * ry); }
        x.fillStyle = '#1d2422'; x.fillRect(TVX - rx, TVY + 20 - roll, 2 * rx, 12);
        x.beginPath(); x.ellipse(TVX, TVY - roll, 20 * q, 20, 0, 0, TAU); x.fillStyle = '#fff6e4'; x.fill(); stroke(x, { lw: 3.5 }); burst(x, TVX, TVY - roll, 13, 8, RF.teal, { lw: 2.5, rb: 2 }); }
      else { x.fillStyle = RF.screen; x.fillRect(TVX - rx, TVY - ry, 2 * rx, 2 * ry); const kk = ta / 0.45;   // switching off: a line, then a dot
        if (kk < 0.5) { const h = 2 * ry * (1 - kk * 2) + 3; x.fillStyle = '#f4fbff'; x.fillRect(TVX - rx, TVY - h / 2, 2 * rx, h); } else ell(x, TVX, TVY, 9 * (1 - (kk - 0.5) * 2) * q + 1, 9 * (1 - (kk - 0.5) * 2) + 1, '#f4fbff', { lw: 0 }); }
      x.restore(); if (tv.on) glow(x, TVX, TVY, 150, '#cfeff0', 0.16); }
    ell(x, TVX - 20 * q, TVY - 22, 13 * q, 6, 'rgba(255,255,255,.35)', { lw: 0, rot: -0.5 });
    // the tube: a capsule whooshes out of the ceiling, along the wall and down into the dispenser, which lights up as it lands
    const tb = P.tube || Z, ua = since(tb, t);
    if (tb.on && ua < 0.9) { const d = Math.pow(ua / 0.9, 1.4) * (TUBE.len - 40), [px, py, an] = alongTube(d);
      for (let i = 1; i <= 4; i++) { const [ax, ay] = alongTube(Math.max(0, d - i * 22)), [bx, by] = alongTube(Math.max(0, d - i * 22 - 16)); seg(x, [[ax, ay], [bx, by]], 4, `rgba(255,255,255,${0.9 - i * 0.18})`); }
      x.save(); x.translate(px, py); x.rotate(an); box(x, -19, -11, 38, 22, RF.mustard, { r: 11, sh: 'b', f: 0.4, lw: 4 }); x.fillStyle = RF.coral; x.fillRect(-3, -10, 6, 20); x.restore(); }
    if (tb.on && ua >= 0.85 && ua < 1.5) { const kk = (ua - 0.85) / 0.65; glow(x, 1100, 336, 80, '#fff2c8', 0.55 * (1 - kk)); puff(x, 1060, 304, kk, '#ffffff'); puff(x, 1140, 304, kk, '#ffffff'); }
    const ds = P.disp || Z, da = since(ds, t); if (ds.on && da > 0.1 && da < 0.7) glow(x, 1100, 336, 70, '#fff2c8', 0.45 * Math.sin((da - 0.1) / 0.6 * Math.PI));
  },
  emblem(x) {   // the wind-up key (his on / off switch in Turn Me Off): a brass bow of two round lobes on a steel shaft, a little starburst
    burst(x, 81, 72, 12, 8, '#fff0cf', { q: 1, lw: 2.5, rb: 2.2 });
    box(x, 44, 50, 12, 30, '#a9b0b8', { r: 3, sh: 'r', f: 0.35, lw: 4 }); box(x, 36, 76, 28, 10, '#a9b0b8', { r: 4, sh: 'b', f: 0.35, lw: 4 });
    const bow = () => { x.beginPath(); x.arc(32, 36, 17, 0, TAU); x.moveTo(85, 36); x.arc(68, 36, 17, 0, TAU); x.rect(32, 27, 36, 18); };   // (ink round the outside only)
    bow(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); bow(); x.fillStyle = '#ffe066'; x.fill(); x.save(); bow(); x.clip(); x.fillStyle = '#e0b030'; x.fillRect(12, 42, 76, 16); x.restore();
    ell(x, 32, 36, 6, 6, '#2fb5ac', { lw: 3 }); ell(x, 68, 36, 6, 6, '#2fb5ac', { lw: 3 }); } });

// 4. castle knight: the castle kitchen — stone, a great hearth with a cauldron, torches, shields, a trestle table
function stoneWall(x, y0, y1, base, seed) {
  for (let r = 0, y = y0; y < y1; r++, y += 58) { let X = -rnd(r, seed) * 120; while (X < 1600) { const w = 96 + rnd(X, r + seed) * 70, v = rnd(r * 31, X); box(x, X + 2, y + 2, w - 4, 54, mix(base, v < 0.5 ? '#000000' : '#ffffff', Math.abs(v - 0.5) * 0.25), { r: 7, sh: 'b', f: 0.16, lw: 4 }); X += w; } } }
function heater(x, cx, cy, s, col, ch) {   // a heraldic shield
  x.save(); x.translate(cx, cy); x.scale(s, s); const lw = 6 / s;
  const P = () => { x.beginPath(); x.moveTo(-50, -60); x.lineTo(50, -60); x.lineTo(50, 0); x.quadraticCurveTo(46, 52, 0, 76); x.quadraticCurveTo(-46, 52, -50, 0); x.closePath(); };
  P(); x.fillStyle = col; x.fill(); x.save(); x.clip(); x.fillStyle = ch; x.beginPath(); x.moveTo(-60, 30); x.lineTo(0, -16); x.lineTo(60, 30); x.lineTo(60, 52); x.lineTo(0, 6); x.lineTo(-60, 52); x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(22, -70, 40, 160); x.restore();
  P(); x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); x.restore(); }
S.push({ id: 'castle-knight', name: 'the castle', outfit: 'castle-knight', badge: '#3d5a3a',
  base(x) {
    x.fillStyle = '#1b1714'; x.fillRect(0, 0, 1600, 640); stoneWall(x, 0, 640, '#6d675f', 1); topShade(x, 0.5);
    // lancet windows
    for (const [wx, moon] of [[178, 0], [330, 1]]) { const P = (o) => { x.beginPath(); x.moveTo(wx - o, 520 + o); x.lineTo(wx - o, 300); x.arc(wx + 46, 300, 46 + o, Math.PI, 0); x.lineTo(wx + 92 + o, 520 + o); x.closePath(); };
      P(14); x.fillStyle = '#8a837a'; x.fill(); stroke(x, { lw: 5 }); P(0); x.fillStyle = grad(x, 0, 250, 0, 520, [[0, '#0d1835'], [1, '#22355e']]); x.fill(); x.save(); x.clip();
      for (let i = 0; i < 8; i++) { x.fillStyle = '#f2e6c4'; x.fillRect(wx + rnd(i, wx) * 90, 270 + rnd(wx, i) * 220, 3, 3); }
      if (moon) { circ(x, wx + 58, 330, 26, '#f2e6c4', { sh: 'n', lw: 0 }); circ(x, wx + 70, 322, 24, '#22355e', { sh: 'n', lw: 0 }); }
      x.fillStyle = '#141c30'; x.beginPath(); x.moveTo(wx - 2, 520); x.lineTo(wx + 20, 470); x.lineTo(wx + 40, 492); x.lineTo(wx + 70, 450); x.lineTo(wx + 94, 520); x.fill(); x.restore(); P(0); stroke(x, { lw: 5 }); box(x, wx - 22, 526, 136, 18, '#8a837a', { sh: 'b', lw: 5 }); }
    // flagstones
    x.fillStyle = '#2e2924'; x.fillRect(0, 640, 1600, 260);
    for (let r = 0, y = 640; r < 5; r++) { const h = [42, 50, 56, 62, 70][r]; let X = -rnd(r, 9) * 100; while (X < 1600) { const w = 120 + rnd(X, r) * 110; box(x, X + 3, y + 3, w - 6, h - 6, mix('#5a5048', '#000000', rnd(X, r + 4) * 0.25), { r: 12, sh: 'b', f: 0.2, lw: 4 }); X += w; } y += h; }
    x.fillStyle = '#120c09'; x.fillRect(0, 634, 1600, 10);
    // the hearth
    box(x, 836, -10, 448, 350, '#5e5850', { sh: 'n', lw: 6 }); stoneWall2(x, 836, 0, 448, 340);
    box(x, 812, 326, 496, 36, '#5a3a22', { r: 4, sh: 'b', lw: 6 });
    box(x, 846, 362, 428, 278, '#7a7369', { sh: 'n', lw: 6 }); stoneWall2(x, 846, 362, 428, 278);
    const opening = () => { x.beginPath(); x.moveTo(902, 640); x.lineTo(902, 470); x.quadraticCurveTo(1060, 400, 1218, 470); x.lineTo(1218, 640); x.closePath(); };
    opening(); x.fillStyle = grad(x, 0, 420, 0, 640, [[0, '#0c0806'], [1, '#2a140a']]); x.fill(); stroke(x, { lw: 6 });
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.06 + i * 0.148), px = 1060 - Math.cos(a) * 170, py = 470 - Math.sin(a) * 66; x.save(); x.translate(px, py); x.rotate(-Math.cos(a) * 0.9); box(x, -20, -18, 40, 30, '#8f877c', { r: 4, sh: 'b', lw: 4 }); x.restore(); }
    for (const [a, b, r] of [[960, 628, -0.25], [1160, 628, 0.25], [1060, 634, 0]]) { x.save(); x.translate(a, b); x.rotate(r); box(x, -70, -12, 140, 24, '#6a4228', { r: 10, lw: 5 }); ell(x, 70, 0, 8, 12, '#c89a5e', { lw: 4 }); x.restore(); }
    // shields, crossed spears
    for (const [a, b] of [[[1320, 600], [1500, 330]], [[1500, 600], [1320, 330]]]) { seg(x, [a, b], 12); seg(x, [a, b], 6, '#8a5a36'); const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      poly(x, [[b[0] + ux * 40, b[1] + uy * 40], [b[0] - uy * 12, b[1] + ux * 12], [b[0] + uy * 12, b[1] - ux * 12]], '#c9ced6', { lw: 4 }); }
    heater(x, 1410, 470, 0.95, '#a3242c', '#e6b23a');
    // torch brackets
    for (const tx of [110, 1325]) { box(x, tx - 12, 440, 24, 40, '#2b2622', { r: 4, sh: 'n', lw: 4 }); x.save(); x.translate(tx, 440); x.rotate(-0.12); box(x, -8, -60, 16, 70, '#6a4228', { r: 4, lw: 4 }); box(x, -13, -66, 26, 14, '#2b2622', { r: 3, sh: 'n', lw: 4 }); x.restore(); }
    // the trestle table: bread, cheese, a tankard
    for (const lx of [620, 920]) { x.save(); x.translate(lx, 676); for (const r of [-0.32, 0.32]) { x.save(); x.rotate(r); box(x, -11, -86, 22, 172, '#6a4228', { r: 4, lw: 5 }); x.restore(); } x.restore(); }
    box(x, 600, 668, 340, 16, '#6a4228', { r: 4, sh: 'b', lw: 5 });
    box(x, 552, 548, 436, 42, '#8a5a36', { r: 6, sh: 'b', lw: 7 }); for (const q of [700, 840]) seg(x, [[q, 552], [q, 586]], 3, 'rgba(18,10,5,.5)');
    ell(x, 640, 532, 46, 20, '#c88a44', { lw: 5 }); for (const q of [-18, 0, 18]) seg(x, [[628 + q, 520], [640 + q, 528]], 3);
    poly(x, [[700, 548], [760, 548], [760, 524]], '#f2c84a', { lw: 4 }); circ(x, 740, 540, 4, '#d8a830', { sh: 'n', lw: 0 });
    box(x, 866, 500, 40, 48, '#8a5a36', { r: 4, lw: 5 }); seg(x, [[868, 512], [904, 512]], 4); seg(x, [[868, 536], [904, 536]], 4); x.beginPath(); x.arc(912, 524, 12, -1.2, 1.2); stroke(x, { lw: 6 });
  },
  anim(x, t, lit, P = {}, me = null) {
    const fl = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 7.3);
    const cau = flip(P.cauldron || Z, t, 0.6), TL = [[110, P.torchL || ON], [1325, P.torchR || ON]];
    glow(x, 1060, 560, 330 * (1 + 0.25 * cau), '#ff9a3a', 0.28 * fl * (1 + 0.5 * cau)); for (const [tx, s] of TL) { const k = flip(s, t, 0.25); if (k > 0) glow(x, tx, 380, 160, '#ffb04a', 0.25 * fl * k); }
    for (let i = 0; i < 5; i++) flame(x, 990 + i * 34, 628, (60 + rnd(i, 3) * 40) * (1 + 0.45 * cau), t, i * 3, 26);
    for (let i = 0; i < 12; i++) { const ph = (t * 0.35 + rnd(i, 1)) % 1, px = 1000 + rnd(i, 2) * 120 + Math.sin(t * 3 + i) * 10, py = 600 - ph * 260; x.fillStyle = `rgba(255,${160 + i * 6},70,${1 - ph})`; x.fillRect(px, py, 4, 4); }
    seg(x, [[1060, 430], [1060, 500]], 5, '#2b2622');
    x.beginPath(); x.moveTo(996, 512); x.bezierCurveTo(990, 600, 1130, 600, 1124, 512); x.closePath(); x.fillStyle = '#26221f'; x.fill(); x.save(); x.clip(); x.fillStyle = '#3a3430'; x.fillRect(990, 500, 50, 100); x.restore(); stroke(x, { lw: 6 });
    ell(x, 1060, 512, 66, 12, '#3b8a3a', { lw: 6 }); const nb = cau > 0.5 ? 9 : 4; for (let i = 0; i < nb; i++) { const ph = (t * (0.9 + cau * 1.6) + i * 0.27 + rnd(i, 5)) % 1, bx = cau > 0.5 ? 1004 + rnd(i, 6) * 112 : 1030 + i * 20; circ(x, bx, 510 - ph * (10 + cau * 26), 3 + ph * (6 + cau * 8), '#5cbf4a', { sh: 'n', lw: 2 }); }
    if (cau > 0) for (const [dx, d] of [[1000, 0], [1112, 0.6], [1056, 1.3]]) { const u = ((t * 0.5 + d) % 1) * cau; x.beginPath(); x.moveTo(dx - 9, 508); x.quadraticCurveTo(dx - 10, 520 + u * 40, dx, 526 + u * 46); x.quadraticCurveTo(dx + 10, 520 + u * 40, dx + 9, 508); x.closePath(); x.fillStyle = '#5cbf4a'; x.fill(); stroke(x, { lw: 4 }); }   // it boils over: slime down the sides
    steam(x, 1060, 500, t, cau > 0.5 ? 5 : 3, 90 + 80 * cau, 0.18 + 0.2 * cau, 8 + 4 * cau);
    for (const [tx, s] of TL) { const k = flip(s, t, 0.25); if (k > 0) { glow(x, tx - 8, 360, 60, '#ffcf6a', 0.4 * fl * k); flame(x, tx - 7, 380, 50 * k, t, tx, 20 * k); } else if (since(s, t) < 2.5) smoke(x, tx - 7, 378, t, tx, 1 - since(s, t) / 2.5); }
    seg(x, [[770, 0], [650, 360]], 3, '#2b2622'); seg(x, [[770, 0], [890, 360]], 3, '#2b2622'); seg(x, [[770, 0], [770, 340]], 3, '#2b2622');
    cone(x, 770, 380, 100, 500, 1040, 900, '#ffcf8a', 0.38 * (0.45 + 0.55 * lit));
    x.beginPath(); x.ellipse(770, 362, 124, 20, 0, 0, TAU); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 8; x.strokeStyle = '#3a332e'; x.stroke();
    for (const cx of [660, 715, 770, 825, 880]) { const cy = 362 + Math.sqrt(Math.max(0, 1 - ((cx - 770) / 124) ** 2)) * 18; box(x, cx - 7, cy - 30, 14, 26, '#f2ead8', { r: 3, lw: 4 }); glow(x, cx, cy - 40, 30, '#ffcf6a', 0.3); flame(x, cx, cy - 30, 18, t, cx * 0.37); }
  },
  emblem(x) {   // a great helm with a visor slit and a plume
    x.beginPath(); x.moveTo(36, 24); x.quadraticCurveTo(40, 12, 50, 13); x.quadraticCurveTo(52, 4, 60, 8); x.quadraticCurveTo(56, 14, 58, 22); x.closePath(); x.fillStyle = '#d8283c'; x.fill(); stroke(x, { lw: 4 });
    x.beginPath(); x.moveTo(29, 82); x.lineTo(29, 40); x.quadraticCurveTo(29, 18, 50, 18); x.quadraticCurveTo(71, 18, 71, 40); x.lineTo(71, 82); x.closePath(); x.fillStyle = '#b4bcc6'; x.fill(); x.save(); x.clip(); x.fillStyle = '#8a929c'; x.fillRect(58, 10, 20, 80); x.restore(); stroke(x, { lw: 5 });
    box(x, 32, 44, 36, 8, '#1a1612', { r: 3, sh: 'n', lw: 3 }); seg(x, [[50, 22], [50, 80]], 3); for (const [a, b] of [[60, 62], [64, 62], [60, 68], [64, 68], [60, 74], [64, 74]]) circ(x, a, b, 1.6, '#1a1612', { sh: 'n', lw: 0 }); } });
function stoneWall2(x, X, Y, W, H) { x.save(); x.beginPath(); x.rect(X, Y, W, H); x.clip(); for (let r = 0, y = Y; y < Y + H; r++, y += 46) { let q = X - (r % 2) * 40; while (q < X + W) { const w = 70 + rnd(q, r + 3) * 40; box(x, q + 2, y + 2, w - 4, 42, mix('#8a837a', '#000000', rnd(q * 3, r) * 0.25), { r: 6, sh: 'b', f: 0.18, lw: 4 }); q += w; } } x.restore(); x.beginPath(); x.rect(X, Y, W, H); stroke(x, { lw: 6 }); }

// 5. orbital astronaut: the station galley — metal panels, a porthole on a ringed planet, nothing stays put
S.push({ id: 'orbital-astronaut', name: 'the galley', outfit: 'orbital-astronaut', badge: '#14204a',
  base(x) {
    wall(x, '#5a6573', '#46505c');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const X = -40 + c * 190, Y = 16 + r * 152; box(x, X + 4, Y, 182, 144, r === 2 ? '#56616e' : '#5d6876', { r: 14, sh: 'b', f: 0.1, lw: 4 });
      seg(x, [[X + 18, Y + 6], [X + 166, Y + 6]], 3, 'rgba(255,255,255,.12)'); for (const [a, b] of [[X + 16, Y + 14], [X + 170, Y + 14], [X + 16, Y + 130], [X + 170, Y + 130]]) circ(x, a, b, 4, '#8f9aa8', { sh: 'n', lw: 2 }); }
    topShade(x, 0.35);
    box(x, -10, 416, 1620, 22, '#e2762a', { sh: 'b', lw: 4 }); box(x, -10, 440, 1620, 10, '#2b6fd6', { sh: 'n', lw: 3 });
    for (let X = 60; X < 1600; X += 210) box(x, X, 462, 14, 22, '#8f9aa8', { sh: 'n', lw: 3 }); box(x, -10, 470, 1620, 12, '#f2c230', { r: 6, sh: 'b', lw: 4 });
    // the porthole
    const cx = 290, cy = 470, R = 132;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip(); x.fillStyle = grad(x, 0, cy - R, 0, cy + R, [[0, '#04060f'], [1, '#0a1230']]); x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,248,230,${0.3 + rnd(i, 2) * 0.6})`; const s = rnd(i, 3) < 0.15 ? 3 : 2; x.fillRect(cx - R + rnd(i, 4) * 2 * R, cy - R + rnd(i, 5) * 2 * R, s, s); }
    x.restore();
    // the floor: deck plates, grating, a hazard edge
    x.fillStyle = '#343a43'; x.fillRect(0, 640, 1600, 260);
    for (let c = 0; c < 9; c++) { box(x, c * 200 - 40 + 4, 664, 192, 236, '#3d444e', { r: 8, sh: 'n', lw: 4 }); x.strokeStyle = 'rgba(18,10,5,.35)'; x.lineWidth = 2;
      for (let q = 16; q < 192; q += 18) { x.beginPath(); x.moveTo(c * 200 - 36 + q, 668); x.lineTo(c * 200 - 36 + q, 896); x.stroke(); } }
    stripes(x, -10, 640, 1620, 22, '#f2c230', '#1a1612', 20, { lw: 4 });
    // the galley (the counter): modules, velcro, food pouches
    box(x, 790, 452, 660, 22, '#c3cad2', { r: 8, sh: 'b', lw: 5 });
    for (let i = 0; i < 3; i++) { const X = 800 + i * 214; box(x, X, 474, 206, 166, '#aab2bc', { r: 12, lw: 5, f: 0.12 }); box(x, X + 70, 494, 66, 12, '#2d333b', { r: 6, sh: 'n', lw: 3 }); }
    box(x, 1044, 530, 100, 60, '#0e1a22', { r: 8, sh: 'n', lw: 4 }); seg(x, [[1052, 570], [1070, 556], [1086, 566], [1104, 544], [1136, 556]], 3, '#5cff8a');
    for (let i = 0; i < 5; i++) { const X = 830 + i * 34; box(x, X - 3, 548, 30, 70, '#6b7380', { r: 4, sh: 'n', lw: 0 }); box(x, X, 552 + (i % 2) * 6, 24, 40, ['#ff7a2b', '#5cbf4a', '#e8463a', '#f2c230', '#3c8fd8'][i], { r: 5, lw: 3 }); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(X + 4, 566 + (i % 2) * 6, 16, 6); }
    box(x, 1270, 470, 18, 0.1, '#000', { lw: 0 }); box(x, 1300, 420, 70, 34, '#d8dde3', { r: 8, lw: 4 }); box(x, 1328, 452, 14, 12, '#6b7380', { sh: 'n', lw: 3 });
    // the stowage locker (the fridge)
    box(x, 1460, 170, 130, 470, '#b9c0c8', { r: 16, lw: 6, f: 0.14 }); box(x, 1474, 240, 102, 64, '#0e1a22', { r: 8, sh: 'n', lw: 4 });
    circ(x, 1525, 440, 36, '#8f9aa8', { lw: 5 }); for (let k = 0; k < 4; k++) seg(x, [[1525, 440], [1525 + Math.cos(k * Math.PI / 2 + 0.4) * 32, 440 + Math.sin(k * Math.PI / 2 + 0.4) * 32]], 5); circ(x, 1525, 440, 9, '#c3cad2', { lw: 3 });
    for (let k = 0; k < 4; k++) box(x, 1490, 520 + k * 18, 70, 6, '#8f9aa8', { r: 3, sh: 'n', lw: 2 });
    // the table: one pedestal bolted down, foot loops, no chairs (who needs a chair)
    box(x, 752, 578, 36, 150, '#8f9aa8', { lw: 5, f: 0.35 }); ell(x, 770, 732, 74, 12, '#6b7380', { lw: 5 });
    box(x, 590, 554, 360, 26, '#c3cad2', { r: 13, sh: 'b', f: 0.35, lw: 6 }); box(x, 690, 538, 160, 16, '#6b7380', { r: 4, sh: 'n', lw: 4 });
    for (const fx of [640, 900]) { x.beginPath(); x.ellipse(fx, 760, 40, 18, 0, Math.PI, TAU); x.lineWidth = 12; x.strokeStyle = INK; x.stroke(); x.lineWidth = 6; x.strokeStyle = '#f2c230'; x.stroke(); }
  },
  anim(x, t, lit, P = {}, me = null) {
    const cx = 290, cy = 470, R = 132;
    x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip();
    for (let i = 0; i < 8; i++) { const a = 0.5 + 0.5 * Math.sin(t * (1.5 + rnd(i, 7) * 2) + i * 3); glow(x, cx - R + rnd(i, 8) * 2 * R, cy - R + rnd(i, 9) * R, 8, '#fff6e0', 0.7 * a); }
    const px = cx + 70, py = cy + 64, pr = 104;
    x.save(); x.translate(px, py); x.rotate(-0.35); x.beginPath(); x.ellipse(0, 0, pr * 1.75, pr * 0.32, 0, Math.PI, TAU); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 10; x.strokeStyle = '#e8d3a0'; x.stroke(); x.restore();
    x.save(); x.beginPath(); x.arc(px, py, pr, 0, TAU); x.clip(); x.fillStyle = '#3fb0a8'; x.fillRect(px - pr, py - pr, 2 * pr, 2 * pr);
    for (let k = -4; k < 6; k++) { x.fillStyle = k % 2 ? '#2b7f9e' : '#9fe0c8'; x.beginPath(); for (let q = -pr; q <= pr; q += 8) x.lineTo(px + q, py + k * 22 + Math.sin(q * 0.04 + t * 0.4 + k) * 6); x.lineTo(px + pr, py + k * 22 + 10); x.lineTo(px - pr, py + k * 22 + 10); x.fill(); }
    x.fillStyle = 'rgba(4,6,15,.45)'; x.beginPath(); x.arc(px + 40, py + 40, pr, 0, TAU); x.arc(px, py, pr + 60, 0, TAU, true); x.fill(); x.restore();
    x.beginPath(); x.arc(px, py, pr, 0, TAU); stroke(x, { lw: 5 });
    x.save(); x.translate(px, py); x.rotate(-0.35); x.beginPath(); x.ellipse(0, 0, pr * 1.75, pr * 0.32, 0, 0, Math.PI); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 10; x.strokeStyle = '#e8d3a0'; x.stroke(); x.restore();
    x.fillStyle = 'rgba(200,230,255,.08)'; x.beginPath(); x.ellipse(cx - 50, cy - 60, 50, 22, -0.6, 0, TAU); x.fill(); x.restore();
    x.beginPath(); x.arc(cx, cy, R + 12, 0, TAU); x.lineWidth = 34; x.strokeStyle = INK; x.stroke(); x.lineWidth = 24; x.strokeStyle = '#9aa4b0'; x.stroke();
    x.beginPath(); x.ellipse(cx, cy, (R + 12) * unsq(x), R + 12, 0, -2.6, -1.2); x.lineWidth = 6; x.strokeStyle = '#c3cad2'; x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; circ(x, cx + Math.cos(a) * (R + 12), cy + Math.sin(a) * (R + 12), 4.5, '#6b7380', { sh: 'n', lw: 2 }); }
    for (let k = 0; k < 5; k++) { const on = rnd(k, Math.floor(t * 2 + k * 0.3)) < 0.55; circ(x, 1490 + k * 18, 262, 6, on ? ['#5cff8a', '#ffc93c', '#2fd3ff', '#5cff8a', '#ff4f5a'][k] : '#26323c', { sh: 'n', lw: 2 }); }
    seg(x, [[1484, 286], [1484 + 80 * ((t * 0.2) % 1), 286]], 4, '#2fd3ff');
    seg(x, [[770, 0], [770, 332]], 10, INK); seg(x, [[770, 0], [770, 332]], 5, '#8f9aa8');
    cone(x, 770, 372, 64, 560, 980, 900, '#d8ecff', 0.32 * lit); box(x, 700, 330, 140, 40, '#cfd5dc', { r: 18, lw: 5 }); box(x, 712, 360, 116, 8, mix('#5d6876', '#eaf6ff', lit), { r: 4, sh: 'n', lw: 3 }); glow(x, 770, 368, 80, '#d8ecff', 0.35 * lit);
    // the floaters
    const zg = 1 + 2.4 * flip(P.gravity || Z, t, 1.2), fl = (px, py, rot, f) => { x.save(); x.translate(px + Math.sin(t * 0.37 + px) * 40 * (zg - 1), py + Math.cos(t * 0.31 + py) * 60 * (zg - 1)); x.rotate(rot * zg); f(); x.restore(); };   // (gravity off: everything drifts further)
    fl(960 + Math.sin(t * 0.5) * 20, 420 + Math.sin(t * 0.8) * 10, t * 0.6, () => { seg(x, [[-30, 0], [18, 0]], 9); seg(x, [[-30, 0], [18, 0]], 4, '#d8dde3'); ell(x, 26, 0, 12, 8, '#d8dde3', { lw: 4 }); });
    fl(1240 + Math.sin(t * 0.4 + 1) * 16, 418 + Math.cos(t * 0.7) * 12, Math.sin(t * 0.5) * 0.6, () => { box(x, -16, -22, 32, 44, '#ff7a2b', { r: 6, lw: 4 }); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(-10, -6, 20, 8); seg(x, [[6, -22], [10, -40]], 4); });
    fl(1380 + Math.sin(t * 0.6 + 2) * 14, 566 + Math.sin(t * 0.9) * 10, 0, () => { const w = 1 + Math.sin(t * 3) * 0.08; ell(x, 0, 0, 20 * w, 20 / w, 'rgba(90,180,255,.8)', { lw: 4 }); ell(x, -6, -6, 5, 3, 'rgba(255,255,255,.8)', { lw: 0 }); });
    fl(150 + Math.sin(t * 0.35) * 24, 690 + Math.sin(t * 0.6) * 12, t * 0.4, () => { ell(x, 0, 0, 34, 30, '#e8c88a', { lw: 4 }); for (let k = 0; k < 5; k++) circ(x, Math.cos(k * 1.3) * 18, Math.sin(k * 1.3) * 14, 3, '#b8873f', { sh: 'n', lw: 0 }); });
  },
  emblem(x) {   // a round helmet, a dark visor with a sunrise in it
    box(x, 32, 74, 36, 12, '#9aa4b0', { r: 4, sh: 'n', lw: 4 }); circ(x, 50, 48, 30, '#eef1f5', { lw: 5 });
    x.beginPath(); x.ellipse(52, 48, 21, 17, 0, 0, TAU); x.fillStyle = '#1b2a4a'; x.fill(); x.save(); x.clip(); x.fillStyle = '#ffb347'; x.beginPath(); x.ellipse(60, 64, 22, 10, -0.3, 0, TAU); x.fill(); x.restore(); stroke(x, { lw: 4 });
    ell(x, 44, 40, 6, 3.5, '#ffffff', { lw: 0, rot: -0.5 }); circ(x, 78, 40, 3, '#e2762a', { sh: 'n', lw: 2 }); } });

// 3. the fact factory: Confidently Incorrect's room (the plan's §7: "the break room on the line") — corrugated steel, a safety-orange
// band, hazard stripes, diamond plate; wired glass looking down on the factory floor where the made-up facts roll by in crates; a
// cable-spool table under a cage lamp; a steel counter with a short belt into the wall and a little stamp press over it; a grey locker
// with the magnet board (DAYS WITHOUT A FACT: 0) and the hard hats on their hooks. Warm light, no purple (purple is his).
const FF = { steel: '#9aa1a9', steelD: '#7c838c', orange: '#e2762a', yellow: '#f2c230', crate: '#c98a4a', wood: '#b9824a', cable: '#2b2622', plate: '#4d535b', lock: '#9aa3ab', red: '#d8402e', green: '#3f9a46' };
const FF_WIN = { x0: 150, x1: 430, y0: 350, y1: 590 };   // the wired glass (inside the frame)
const FF_CRATES = [['BATTLE', 'YAK'], ['QUANTUM', 'SPAGHETTI'], ['EVEREST']];
// Chat's CI Factory pack (from-chat/Potato_CI_Factory_Pack_v1, downscaled into run/assets/ci): the DAYS WITHOUT A FACT sign, the
// QUALITY CONTROL plate, the crate labels through the glass, a REJECTED notice on the locker. Only this room uses them; each one is
// optional (not loaded yet / failed: the room draws its own code version), so no other room paints any differently.
const FF_ART = {}, FF_BASE = new URL('./assets/ci/', import.meta.url).href;
const FF_LIST = ['sign_days', 'sign_quality', 'stamp_rejected', 'decal_yak', 'decal_spaghetti', 'decal_everest'];
function ffArt(n) { if (typeof Image === 'undefined') return null; if (!FF_ART.sign_days) for (const k of FF_LIST) { const i = FF_ART[k] = new Image(); i.src = FF_BASE + k + '.webp'; }   // (the first ask loads the room's whole set)
  const im = FF_ART[n]; return im && im.complete && im.naturalWidth > 0 ? im : null; }
function ffPic(x, n, cx, cy, mw, mh, rot = 0) { const im = ffArt(n); if (!im) return false; const k = Math.min(mw / im.naturalWidth, mh / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(unsq(x), 1); x.drawImage(im, -w / 2, -h / 2, w, h); x.restore(); return true; }
const FF_DECALS = ['decal_yak', 'decal_spaghetti', 'decal_everest'];
function ffText(x, s, cx, cy, size, col, o = {}) {   // world text that keeps its shape under the squeeze (stencil-ish: heavy mono)
  x.save(); x.translate(cx, cy); if (o.rot) x.rotate(o.rot); x.scale(unsq(x), 1); x.font = `${o.w || 800} ${size}px "JetBrains Mono", ui-monospace, monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (o.ink) { x.lineJoin = 'round'; x.lineWidth = o.ink; x.strokeStyle = INK; x.strokeText(s, 0, 0); } x.fillStyle = col; x.fillText(s, 0, 0); x.restore(); }
function ffCrate(x, X, Y, W, H, lines, o = {}) {   // a wooden crate: planks, corner braces, a stencilled label
  box(x, X, Y, W, H, o.col || FF.crate, { r: 3, lw: 4, f: 0.16 });
  x.save(); x.beginPath(); x.rect(X, Y, W, H); x.clip(); x.strokeStyle = 'rgba(18,10,5,.32)'; x.lineWidth = 2; for (let q = 1; q < 3; q++) { x.beginPath(); x.moveTo(X, Y + H * q / 3); x.lineTo(X + W, Y + H * q / 3); x.stroke(); }
  seg(x, [[X + 4, Y + 4], [X + W - 4, Y + H - 4]], 3, 'rgba(18,10,5,.22)'); x.restore();
  if (lines && lines.length) { const s = o.size || 12, lh = s * 1.05, y0 = Y + H / 2 - (lines.length - 1) * lh / 2; box(x, X + 6, Y + H / 2 - lines.length * lh / 2 - 3, W - 12, lines.length * lh + 6, '#f2e6c8', { r: 2, sh: 'n', lw: 2.5 });
    lines.forEach((l, i) => ffText(x, l, X + W / 2, y0 + i * lh + 1, s, INK, { w: 800 })); } }
function hardHat(x, cx, cy, s, col = FF.yellow, a = 0) {   // a front-view hard hat (cy = the brim), sticker style
  x.save(); x.translate(cx, cy); x.rotate(a); x.scale(s, s);
  x.beginPath(); x.moveTo(-30, 0); x.bezierCurveTo(-30, -26, -16, -38, 0, -38); x.bezierCurveTo(16, -38, 30, -26, 30, 0); x.closePath(); x.fillStyle = col; x.fill();
  x.save(); x.clip(); x.fillStyle = dk(col, 0.2); x.fillRect(12, -40, 20, 42); x.restore(); stroke(x, { lw: 5 / s });
  box(x, -5, -38, 10, 36, lt(col, 0.18), { r: 4, sh: 'n', lw: 3.5 / s });
  box(x, -40, -2, 80, 9, col, { r: 4.5, sh: 'b', f: 0.4, lw: 4.5 / s });
  ell(x, -16, -24, 6, 3, 'rgba(255,255,255,.55)', { lw: 0, rot: -0.7 }); x.restore(); }
S.push({ id: 'construction-crew', name: 'the fact factory', outfit: 'construction-crew', badge: FF.orange,
  base(x) {
    wall(x, FF.steel, FF.steelD);
    for (let q = 0; q < 1600; q += 30) { x.fillStyle = 'rgba(18,10,5,.16)'; x.fillRect(q + 16, 0, 10, 640); x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(q + 4, 0, 5, 640); }   // the corrugation
    for (const y of [212, 432]) { seg(x, [[0, y], [1600, y]], 4, 'rgba(18,10,5,.5)'); for (let q = 15; q < 1600; q += 60) circ(x, q, y - 9, 3.2, '#c3cad2', { sh: 'n', lw: 1.5 }); }   // the sheets' bolted seams
    topShade(x, 0.32);
    box(x, -10, 66, 1620, 22, '#8a929c', { r: 11, sh: 'b', f: 0.4, lw: 5 }); for (let q = 90; q < 1600; q += 260) box(x, q, 58, 18, 38, '#5b636e', { r: 3, sh: 'n', lw: 4 });   // a pipe along the top
    box(x, -10, 546, 1620, 30, FF.orange, { sh: 'b', f: 0.3, lw: 5 });   // the safety-orange band
    stripes(x, -10, 618, 1620, 24, FF.yellow, INK, 20, { lw: 4 });   // hazard stripes along the floor edge
    // the floor: diamond plate, a yellow walkway line
    x.fillStyle = FF.plate; x.fillRect(0, 642, 1600, 258);
    for (let r = 0; r < 9; r++) for (let c = 0; c < 54; c++) { const X = c * 30 + (r % 2) * 15, Y = 660 + r * 28; x.save(); x.translate(X, Y); x.rotate(r % 2 ? 0.7 : -0.7); x.fillStyle = 'rgba(255,255,255,.13)'; x.fillRect(-7, -2, 14, 4); x.fillStyle = 'rgba(18,10,5,.3)'; x.fillRect(-7, 2, 14, 2); x.restore(); }
    box(x, -10, 806, 1620, 16, FF.yellow, { sh: 'b', f: 0.35, lw: 4 });
    // the window frame (the wired glass + the floor below are drawn live)
    box(x, FF_WIN.x0 - 22, FF_WIN.y0 - 22, FF_WIN.x1 - FF_WIN.x0 + 44, FF_WIN.y1 - FF_WIN.y0 + 44, '#5b636e', { r: 6, lw: 6, f: 0.1 });
    box(x, FF_WIN.x0 - 34, FF_WIN.y1 + 14, FF_WIN.x1 - FF_WIN.x0 + 68, 16, '#8a929c', { r: 4, sh: 'b', f: 0.4, lw: 5 });
    for (const [a, b] of [[FF_WIN.x0 - 12, FF_WIN.y0 - 12], [FF_WIN.x1 + 12, FF_WIN.y0 - 12], [FF_WIN.x0 - 12, FF_WIN.y1 + 4], [FF_WIN.x1 + 12, FF_WIN.y1 + 4]]) circ(x, a, b, 4, '#9aa1a9', { sh: 'n', lw: 2 });
    // the hard-hat sign, high on the wall right of the window (a pictogram: a white hat on blue)
    box(x, 492, 150, 112, 112, '#f4f1ea', { r: 6, sh: 'b', f: 0.08, lw: 5 }); circ(x, 548, 206, 44, '#2b6fd6', { lw: 4 }); hardHat(x, 548, 222, 0.88, '#f4f1ea');
    // the counter: a steel top, cabinets with vents, a hazard kick strip; the belt's frame, its wall hatch, the press's feet
    box(x, 800, 472, 640, 168, '#8e969f', { lw: 6, f: 0.12 });
    for (let i = 0; i < 3; i++) { const X = 814 + i * 210; box(x, X, 488, 196, 120, '#a3aab3', { r: 6, lw: 4, f: 0.14 }); for (let k = 0; k < 4; k++) box(x, X + 60, 510 + k * 14, 76, 6, '#5b636e', { r: 3, sh: 'n', lw: 2 }); box(x, X + 84, 580, 28, 10, '#5b636e', { r: 4, sh: 'n', lw: 3 }); }
    stripes(x, 800, 616, 640, 24, FF.yellow, INK, 16, { lw: 4 });
    box(x, 790, 450, 660, 24, '#c3cad2', { r: 6, sh: 'b', f: 0.35, lw: 5 });
    box(x, 1274, 340, 92, 112, '#2b2622', { r: 6, sh: 'n', lw: 5 }); box(x, 1264, 330, 112, 16, '#5b636e', { r: 4, sh: 'b', f: 0.4, lw: 4 });   // the hatch the belt runs into
    box(x, 868, 430, 432, 20, '#3a3f46', { r: 6, sh: 'n', lw: 4 });
    for (const px of [1006, 1158]) box(x, px, 290, 16, 162, '#5b636e', { lw: 4, f: 0.35 });   // the press's posts
    box(x, 1372, 438, 64, 14, '#3a3f46', { r: 3, sh: 'n', lw: 4 });   // the lever's foot
    // the locker (the fridge): grey steel, vents, the magnet board, the hat hooks, a little screen; the lower door is drawn live
    box(x, 1460, 160, 130, 480, FF.lock, { r: 10, lw: 6, f: 0.14 });
    box(x, 1472, 172, 106, 82, '#f4f1ea', { r: 4, sh: 'b', f: 0.08, lw: 4 });   // the board
    seg(x, [[1474, 270], [1576, 270]], 6); for (const hx of [1494, 1556]) box(x, hx - 3, 266, 6, 14, '#5b636e', { r: 2, sh: 'n', lw: 2 });   // the hat rail
    box(x, 1480, 346, 90, 42, '#5b636e', { r: 6, sh: 'n', lw: 4 });   // the screen's bezel
  },
  anim(x, t, lit, P = {}, me = null, o = null) {
    const W = FF_WIN, bt = o && o.beat != null ? o.beat : t * 2, rv = o && o.reveal != null ? o.reveal : null;
    // the factory floor, through the wired glass: girders, a belt whose treads step on the beat, the facts in crates going by, a beacon
    x.save(); x.beginPath(); x.rect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0); x.clip();
    x.fillStyle = grad(x, 0, W.y0, 0, W.y1, [[0, '#2a2620'], [1, '#4a3f34']]); x.fillRect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0);
    for (let k = 0; k < 4; k++) { const gx = W.x0 + 30 + k * 76; box(x, gx, W.y0 - 4, 14, 150, '#5a4c3e', { sh: 'n', lw: 3 }); }
    box(x, W.x0 - 10, W.y0 + 60, W.x1 - W.x0 + 20, 12, '#5a4c3e', { sh: 'n', lw: 3 });
    box(x, W.x0 - 10, 540, W.x1 - W.x0 + 20, 22, '#1d1a17', { sh: 'n', lw: 4 });
    const tr = (Math.floor(bt) + ez(bt % 1 * 2)) * 18;   // (the treads step forward on each beat)
    for (let q = -36; q < W.x1 - W.x0 + 36; q += 18) { const tx = W.x0 + ((q + tr) % (W.x1 - W.x0 + 36)) - 18; seg(x, [[tx, 543], [tx, 559]], 3, '#5a5248'); }
    for (const rx of [W.x0 + 20, W.x0 + 140, W.x0 + 260]) circ(x, rx, 572, 9, '#3a3f46', { sh: 'n', lw: 3 });
    if (rv == null || rv > 1.6) { const k = bt / 2, fr = k - Math.floor(k);   // one crate crosses every two beats
      for (let j = -1; j < 3; j++) { const X = W.x0 - 140 + (fr + j) * 180, id = Math.floor(k) - j; if (X > W.x1 + 10 || X < W.x0 - 150) continue;
        const q = rv != null && rv < 3.6 ? (j === 0 ? 3 : -1) : ((id % 3) + 3) % 3; if (q < 0) continue;
        if (q < 3 && ffArt(FF_DECALS[q])) { ffCrate(x, X, 482, 128, 60, null); ffPic(x, FF_DECALS[q], X + 64, 512, 70, 54); }
        else ffCrate(x, X, 482, 128, 60, q === 3 ? ['?'] : FF_CRATES[q], { size: q === 3 ? 30 : 13 }); } }
    const bon = rv == null || rv > 1.2, ba = t * 3.2;   // the beacon on its post (turning: warm orange, a sweep of light)
    box(x, 392, 400, 10, 82, '#5a4c3e', { sh: 'n', lw: 3 }); box(x, 380, 386, 34, 16, '#3a3f46', { r: 3, sh: 'n', lw: 3 });
    x.beginPath(); x.arc(397, 386, 16, Math.PI, 0); x.closePath(); x.fillStyle = bon ? '#ff9a2e' : '#7a4a1e'; x.fill(); stroke(x, { lw: 3 });
    if (bon) { const fx = Math.cos(ba), fz = Math.sin(ba); x.save(); x.globalCompositeOperation = 'lighter'; const L = 260 * Math.abs(fx) + 30;
      x.fillStyle = `rgba(255,170,70,${0.18 + 0.32 * Math.max(0, fz)})`; x.beginPath(); x.moveTo(397, 378); x.lineTo(397 + fx * L, 378 - 40); x.lineTo(397 + fx * L, 378 + 40); x.closePath(); x.fill(); x.restore();
      glow(x, 397, 380, 40 + 50 * Math.max(0, fz), '#ffb050', 0.35 + 0.4 * Math.max(0, fz)); }
    x.save(); x.strokeStyle = 'rgba(225,232,238,.3)'; x.lineWidth = 1.6; for (let q = -260; q < 300; q += 20) { x.beginPath(); x.moveTo(W.x0 + q, W.y0); x.lineTo(W.x0 + q + 240, W.y1); x.moveTo(W.x0 + q + 240, W.y0); x.lineTo(W.x0 + q, W.y1); x.stroke(); } x.restore();   // the wire in the glass
    x.fillStyle = 'rgba(230,240,248,.1)'; x.beginPath(); x.moveTo(W.x0 + 30, W.y0); x.lineTo(W.x0 + 90, W.y0); x.lineTo(W.x0 + 10, W.y1); x.lineTo(W.x0 - 50, W.y1); x.closePath(); x.fill();
    x.restore();
    if (bon) { const fz = Math.sin(ba); if (fz > 0.6) glow(x, 290, 470, 220, '#ff9a2e', 0.12 * (fz - 0.6) / 0.4); }   // the sweep catches the glass now and then
    // the locker's little screen: a cursor (the reveal: it types "dear potato…")
    x.save(); x.beginPath(); x.roundRect(1486, 352, 78, 30, 4); x.fillStyle = '#10161a'; x.fill(); x.clip();
    if (rv != null && rv > 2.6) { const s = 'dear potato…', n = Math.min(s.length, Math.floor((rv - 2.6) * 14)), on = rv < 3.4 || Math.floor(rv * 3) % 2; if (on) { ffText(x, s.slice(0, Math.min(n, 4)), 1525, 361, 10, '#ffcf8a', { w: 700 }); if (n > 5) ffText(x, s.slice(5, n), 1525, 374, 10, '#ffcf8a', { w: 700 }); } }
    else if (Math.floor(t * 1.6) % 2) box(x, 1494, 372, 10, 3, '#ffcf8a', { sh: 'n', lw: 0 });
    x.restore();
    // the cage lamp on its chain
    x.save(); x.translate(770, 0); x.rotate(lampSwing(P, t)); x.translate(-770, 0);
    for (let y = 0; y < 320; y += 16) { x.beginPath(); x.ellipse(770, y + 8, 4, 8, 0, 0, TAU); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.lineWidth = 2.5; x.strokeStyle = '#8a929c'; x.stroke(); }
    cone(x, 770, 384, 40, 560, 980, 900, '#ffd89a', 0.34 * lit);
    poly(x, [[748, 318], [792, 318], [804, 342], [736, 342]], '#3a3f46', { lw: 5 });
    circ(x, 770, 368, 22, lit > 0.5 ? '#fff3c4' : '#8a7a5a', { sh: 'n', lw: 3 }); if (lit > 0) glow(x, 770, 368, 90, '#ffd89a', 0.5 * lit);
    x.beginPath(); x.ellipse(770, 368, 30, 32, 0, 0, TAU); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); for (const d of [-16, 0, 16]) seg(x, [[770 + d, 340], [770 + d * 1.2, 398]], 4);
    seg(x, [[742, 368], [798, 368]], 4); box(x, 762, 396, 16, 8, '#3a3f46', { r: 3, sh: 'n', lw: 3 });
    x.restore();
  },
  emblem(x) { hardHat(x, 50, 68, 0.85); } });

// 6. deep-sea diver: the kitchen on the sea floor — a riveted hull, brass portholes, kelp, bubbles, fish, teal light
S.push({ id: 'deep-sea-diver', name: 'the sea floor', outfit: 'deep-sea-diver', badge: '#1e6b6e',
  base(x) {
    wall(x, '#1f4a50', '#163a40');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const X = -60 + c * 250 + (r % 2) * 125, Y = r * 160; box(x, X, Y, 250, 160, mix('#21525a', '#000000', rnd(c, r) * 0.2), { sh: 'b', f: 0.08, lw: 4 });
      for (let q = 14; q < 250; q += 26) { circ(x, X + q, Y + 12, 3.5, '#5f8f8a', { sh: 'n', lw: 1.5 }); } }
    topShade(x, 0.4);
    box(x, -10, 444, 1620, 18, '#b8863a', { r: 9, sh: 'b', lw: 5 }); for (let X = 100; X < 1600; X += 300) box(x, X, 438, 20, 30, '#9a6a2a', { r: 4, lw: 4 });
    circ(x, 1330, 412, 22, 'rgba(0,0,0,0)', { sh: 'n', lw: 0 }); x.beginPath(); x.arc(1330, 412, 22, 0, TAU); x.lineWidth = 12; x.strokeStyle = INK; x.stroke(); x.lineWidth = 6; x.strokeStyle = '#c8382c'; x.stroke(); seg(x, [[1308, 412], [1352, 412]], 5); seg(x, [[1330, 390], [1330, 444]], 5);
    // the floor: deck plate, sand drifts, shells, a starfish
    x.fillStyle = '#2c4446'; x.fillRect(0, 640, 1600, 260); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 3; for (let r = 0; r < 6; r++) for (let c = 0; c < 30; c++) { const X = c * 56 + (r % 2) * 28, Y = 664 + r * 40; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + 14, Y - 8); x.stroke(); }
    x.beginPath(); x.moveTo(0, 900); x.lineTo(0, 720); for (let q = 0; q <= 560; q += 40) x.lineTo(q, 720 + Math.sin(q * 0.02) * 20 + q * 0.2); x.lineTo(560, 900); x.fillStyle = '#9c8f62'; x.fill(); stroke(x, { lw: 5 });
    x.beginPath(); x.moveTo(1600, 900); x.lineTo(1600, 690); for (let q = 0; q <= 640; q += 40) x.lineTo(1600 - q, 690 + Math.sin(q * 0.025) * 18 + q * 0.22); x.lineTo(960, 900); x.fillStyle = '#9c8f62'; x.fill(); stroke(x, { lw: 5 });
    x.strokeStyle = 'rgba(18,10,5,.25)'; x.lineWidth = 3; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(1100 + i * 50, 800 + (i % 3) * 20); x.quadraticCurveTo(1120 + i * 50, 790 + (i % 3) * 20, 1140 + i * 50, 800 + (i % 3) * 20); x.stroke(); }
    for (const [sx, sy] of [[120, 830], [1210, 860]]) { x.beginPath(); x.moveTo(sx, sy + 14); for (let k = 0; k <= 6; k++) { const a = Math.PI + k / 6 * Math.PI; x.lineTo(sx + Math.cos(a) * 22, sy + Math.sin(a) * 22); } x.closePath(); x.fillStyle = '#f0a8a0'; x.fill(); stroke(x, { lw: 4 }); for (let k = 1; k < 6; k++) { const a = Math.PI + k / 6 * Math.PI; seg(x, [[sx, sy + 14], [sx + Math.cos(a) * 20, sy + Math.sin(a) * 20]], 2); } }
    x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, r = k % 2 ? 12 : 30; x.lineTo(1400 + Math.cos(a) * r, 790 + Math.sin(a) * r * 0.7); } x.closePath(); x.fillStyle = '#ff7a3d'; x.fill(); stroke(x, { lw: 5 });
    x.fillStyle = '#120c09'; x.fillRect(0, 634, 1600, 10);
    // the galley counter, barnacles, a kettle, a jar of pearls, a clam
    box(x, 790, 452, 660, 24, '#7a5a3a', { r: 4, sh: 'b', lw: 5 }); box(x, 800, 476, 640, 164, '#5b4129', { lw: 6 }); for (let q = 0; q < 4; q++) seg(x, [[800, 510 + q * 34], [1440, 510 + q * 34]], 3, 'rgba(18,10,5,.4)');
    for (const [bx, by] of [[830, 600], [860, 620], [1180, 560], [1210, 580], [1400, 520]]) poly(x, [[bx - 12, by + 10], [bx - 4, by - 8], [bx + 4, by - 8], [bx + 12, by + 10]], '#c9c3b0', { lw: 3 });
    for (const bx of [800, 1424]) box(x, bx, 476, 16, 164, '#b8863a', { sh: 'n', lw: 4 });
    box(x, 880, 380, 60, 72, 'rgba(180,230,230,.35)', { r: 8, lw: 5 }); for (let i = 0; i < 8; i++) circ(x, 894 + (i % 3) * 16, 440 - Math.floor(i / 3) * 14, 7, '#f2eee4', { lw: 2 }); box(x, 876, 372, 68, 12, '#b8863a', { r: 3, sh: 'n', lw: 4 });
    x.beginPath(); x.moveTo(1010, 452); x.bezierCurveTo(1000, 380, 1110, 380, 1100, 452); x.closePath(); x.fillStyle = '#c4673a'; x.fill(); x.save(); x.clip(); x.fillStyle = '#9c4a24'; x.fillRect(1072, 370, 40, 90); x.restore(); stroke(x, { lw: 5 });
    seg(x, [[1012, 430], [984, 404]], 10); seg(x, [[1012, 430], [984, 404]], 5, '#c4673a'); x.beginPath(); x.arc(1055, 396, 24, Math.PI * 1.1, Math.PI * 1.9); stroke(x, { lw: 6 });
    // the icebox (the fridge): weathered teal, rust, a starfish
    box(x, 1460, 200, 130, 440, '#4e7f7a', { r: 12, lw: 6, f: 0.16 }); seg(x, [[1460, 380], [1590, 380]], 5); for (const y of [280, 470]) box(x, 1474, y, 14, 44, '#b8863a', { r: 4, lw: 4 });
    for (let i = 0; i < 7; i++) ell(x, 1480 + rnd(i, 3) * 90, 220 + rnd(i, 4) * 400, 10 + rnd(i, 5) * 8, 6, 'rgba(160,80,40,.45)', { lw: 0 });
    x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2 + 0.3, r = k % 2 ? 9 : 24; x.lineTo(1545 + Math.cos(a) * r, 560 + Math.sin(a) * r); } x.closePath(); x.fillStyle = '#ff9a4a'; x.fill(); stroke(x, { lw: 4 });
    // the table: a conch for a centrepiece; barnacled chairs
    box(x, 560, 556, 420, 32, '#6e5034', { r: 8, sh: 'b', lw: 7 }); for (const lx of [590, 930]) box(x, lx, 588, 26, 176, '#5a4028', { lw: 6 });
    x.beginPath(); x.moveTo(800, 550); x.quadraticCurveTo(820, 500, 880, 516); x.quadraticCurveTo(900, 540, 870, 552); x.closePath(); x.fillStyle = '#f2c0a0'; x.fill(); x.save(); x.clip(); x.fillStyle = '#e8907a'; x.fillRect(840, 530, 70, 30); x.restore(); stroke(x, { lw: 5 });
    for (let k = 0; k < 3; k++) seg(x, [[820 + k * 18, 546], [832 + k * 18, 518]], 2.5);
    x.fillStyle = 'rgba(40,150,160,.14)'; x.fillRect(0, 0, 1600, 900);   // everything's under water
  },
  anim(x, t, lit, P = {}, me = null) {
    for (const [cx, cy] of [[276 - 86 / ROOM.sx, 470], [276 + 86 / ROOM.sx, 470]]) { const R = 72;   /* (spaced so the round pair still just overlaps once squeezed) */ x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip(); x.fillStyle = grad(x, 0, cy - R, 0, cy + R, [[0, '#0e4a66'], [1, '#05182a']]); x.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      for (let k = 0; k < 3; k++) cone(x, cx - 60 + k * 50 + Math.sin(t * 0.5 + k) * 10, cy - R, 6, cx - 40 + k * 50, cx + k * 50, cy + R, '#8fe8ff', 0.12);
      for (let i = 0; i < 9; i++) { const ph = ((t * 0.05 + rnd(i, 2)) % 1), fx = 100 + ph * 360, fy = cy - 30 + rnd(i, 3) * 60 + Math.sin(t + i) * 6; x.fillStyle = 'rgba(10,40,60,.9)'; x.beginPath(); x.ellipse(fx, fy, 9, 4, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(fx - 8, fy); x.lineTo(fx - 15, fy - 5); x.lineTo(fx - 15, fy + 5); x.fill(); }
      const wx = 120 + ((t * 9) % 400); x.fillStyle = 'rgba(8,30,48,.85)'; x.beginPath(); x.ellipse(wx, cy + 30, 60, 16, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(wx - 56, cy + 30); x.lineTo(wx - 84, cy + 14); x.lineTo(wx - 80, cy + 44); x.fill();
      x.fillStyle = 'rgba(200,240,255,.1)'; x.beginPath(); x.ellipse(cx - 24, cy - 28, 26, 12, -0.6, 0, TAU); x.fill(); x.restore();
      x.beginPath(); x.arc(cx, cy, R + 10, 0, TAU); x.lineWidth = 30; x.strokeStyle = INK; x.stroke(); x.lineWidth = 20; x.strokeStyle = '#c8913a'; x.stroke(); x.beginPath(); x.ellipse(cx, cy, (R + 10) * unsq(x), R + 10, 0, -2.6, -1.3); x.lineWidth = 5; x.strokeStyle = '#f2c878'; x.stroke();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.4; circ(x, cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10), 5, '#8a5a1e', { sh: 'n', lw: 2 }); } }
    // caustics and light from above
    x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(160,255,240,.07)'; x.lineWidth = 5;
    for (let i = 0; i < 26; i++) { const bx = (i % 9) * 190 + Math.sin(t * 0.7 + i) * 20, by = 660 + Math.floor(i / 9) * 80 + Math.cos(t * 0.6 + i * 2) * 10; x.beginPath(); x.ellipse(bx, by, 60 + Math.sin(t + i) * 10, 16, Math.sin(t * 0.3 + i) * 0.3, 0, TAU); x.stroke(); }
    x.restore(); for (let k = 0; k < 4; k++) { const sx = 300 + k * 330 + Math.sin(t * 0.25 + k * 1.7) * 60; cone(x, sx, -10, 40, sx + 80, sx + 240, 900, '#9ff5e6', 0.07); }
    // kelp
    const kelp = (bx, h, s, col) => { const P = []; for (let k = 0; k <= 14; k++) { const u = k / 14; P.push([bx + Math.sin(t * 0.9 + u * 3 + s) * 26 * u, 900 - u * h]); }
      x.beginPath(); P.forEach(([a, b], k) => { const w = 16 * (1 - k / 16); k ? x.lineTo(a + w, b) : x.moveTo(a + w, b); }); for (let k = P.length - 1; k >= 0; k--) { const w = 16 * (1 - k / 16); x.lineTo(P[k][0] - w, P[k][1]); } x.closePath(); x.fillStyle = col; x.fill(); stroke(x, { lw: 5 });
      for (let k = 3; k < 14; k += 3) { const [a, b] = P[k], d = k % 2 ? 1 : -1; x.beginPath(); x.ellipse(a + d * 22, b - 6, 22, 9, d * 0.6, 0, TAU); x.fillStyle = lt(col, 0.1); x.fill(); stroke(x, { lw: 4 }); } };
    kelp(30, 520, 0, '#3c7a3a'); kelp(84, 420, 1.3, '#4a8a3c'); kelp(1452, 470, 2.1, '#3c7a3a'); kelp(1560, 330, 0.7, '#4a8a3c');
    // the lantern
    seg(x, [[770, 0], [770, 322]], 5, '#2b2622'); cone(x, 770, 400, 30, 540, 1000, 900, '#bff5e0', 0.36 * lit); glow(x, 770, 372, 90, '#ffe9a8', 0.35 * lit);
    box(x, 748, 320, 44, 14, '#b8863a', { r: 4, lw: 4 }); box(x, 744, 334, 52, 70, mix('#3a5a58', '#ffe9a8', lit), { r: 8, sh: 'n', lw: 5 }); for (const q of [758, 770, 782]) seg(x, [[q, 336], [q, 402]], 3); box(x, 746, 400, 48, 12, '#b8863a', { r: 4, lw: 4 });
    // fish in the room, bubbles
    for (let i = 0; i < 3; i++) { const sp = [26, 18, 34][i], dir = i % 2 ? -1 : 1, ph = (t * sp + i * 600) % 2000, fx = dir > 0 ? ph - 200 : 1800 - ph, fy = [430, 520, 600][i] + Math.sin(t * 1.5 + i) * 10, col = ['#ffb020', '#ff7a3d', '#ffd84a'][i];
      x.save(); x.translate(fx, fy); x.scale(dir, 1); x.beginPath(); x.moveTo(-16, 0); x.lineTo(-30, -10 + Math.sin(t * 8 + i) * 3); x.lineTo(-30, 10 + Math.sin(t * 8 + i) * 3); x.closePath(); x.fillStyle = dk(col, 0.1); x.fill(); stroke(x, { lw: 3 });
      ell(x, 0, 0, 20, 11, col, { lw: 3.5 }); seg(x, [[4, -9], [4, 9]], 2.5); circ(x, 10, -2, 2.6, INK, { sh: 'n', lw: 0 }); x.restore(); }
    for (let i = 0; i < 22; i++) { const sp = 40 + rnd(i, 1) * 50, ph = (t * sp + rnd(i, 2) * 700) % 700, bx = [984, 300, 1250, 700, 1500, 120][i % 6] + Math.sin(t * 2 + i) * 6 + rnd(i, 3) * 30, by = [400, 880, 440, 900, 880, 880][i % 6] - ph, r = 3 + rnd(i, 4) * 6;
      if (by < 60) continue; x.beginPath(); x.arc(bx, by, r, 0, TAU); x.fillStyle = 'rgba(200,250,255,.18)'; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(230,255,255,.7)'; x.stroke(); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(bx - r * 0.4, by - r * 0.5, 2, 2); }
  },
  emblem(x) {   // a brass diving helmet: round faceplate, bolts, a breastplate
    poly(x, [[24, 80], [76, 80], [84, 92], [16, 92]], '#b8863a', { lw: 4 }); circ(x, 50, 50, 30, '#c8913a', { lw: 5 }); circ(x, 50, 52, 16, '#d6a24a', { sh: 'n', lw: 4 }); circ(x, 50, 52, 12, '#163a4a', { sh: 'n', lw: 3 });
    seg(x, [[38, 52], [62, 52]], 3); seg(x, [[50, 40], [50, 64]], 3); ell(x, 45, 47, 3, 2, '#bff5ff', { lw: 0 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5; circ(x, 50 + Math.cos(a) * 21, 52 + Math.sin(a) * 21, 2.4, '#7a4a14', { sh: 'n', lw: 0 }); } circ(x, 76, 40, 6, '#d6a24a', { sh: 'n', lw: 3 }); } });

// 7. noir detective: the office after midnight — blinds, rain, a red neon outside, a green desk lamp, a fan turning slow
S.push({ id: 'noir-detective', name: 'the office', outfit: 'noir-detective', badge: '#3a3d44',
  base(x) {
    wall(x, '#4a4940', '#34332d');
    for (let i = 0; i < 40; i++) ell(x, rnd(i, 1) * 1600, rnd(i, 2) * 620, 40 + rnd(i, 3) * 60, 20 + rnd(i, 4) * 30, 'rgba(0,0,0,.05)', { lw: 0 });
    topShade(x, 0.45); box(x, -10, 412, 1620, 10, '#2e2b25', { sh: 'n', lw: 3 });
    // the corkboard: pinned papers, red string
    box(x, 880, 300, 330, 150, '#5a3e26', { r: 4, lw: 5 }); box(x, 892, 312, 306, 126, '#9c7a4f', { sh: 'n', lw: 3 });
    const pins = [[930, 344], [1010, 400], [1080, 336], [1160, 400], [1130, 360]];
    [[910, 326, 50, 40, '#d8d0bc'], [990, 380, 46, 46, '#4a4a4a'], [1060, 318, 40, 50, '#e8e0cc'], [1140, 380, 50, 44, '#d8d0bc'], [1110, 344, 36, 30, '#5a5a5a']].forEach(([a, b, w, h, c]) => { box(x, a, b, w, h, c, { sh: 'n', lw: 3 }); if (c[1] < '9') box(x, a + 4, b + 4, w - 8, h - 8, '#2a2a2a', { sh: 'n', lw: 0 }); });
    seg(x, [pins[0], pins[1], pins[2], pins[3]], 3, '#b33a32'); seg(x, [pins[0], pins[4]], 3, '#b33a32'); pins.forEach(([a, b]) => circ(x, a, b, 5, '#c8403c', { sh: 'n', lw: 2 }));
    // the floor: dark planks, blind-light falling across it
    x.fillStyle = '#2f2822'; x.fillRect(0, 640, 1600, 260); for (let r = 0; r < 6; r++) { seg(x, [[0, 640 + r * 44], [1600, 640 + r * 44]], 3, 'rgba(0,0,0,.4)'); for (let c = 0; c < 6; c++) seg(x, [[(c * 290 + r * 130) % 1600, 640 + r * 44], [(c * 290 + r * 130) % 1600, 684 + r * 44]], 3, 'rgba(0,0,0,.4)'); }
    x.fillStyle = '#120c09'; x.fillRect(0, 634, 1600, 10);
    x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 7; k++) { const y0 = 650 + k * 34; x.fillStyle = 'rgba(230,220,190,.08)'; x.beginPath(); x.moveTo(120 + k * 30, y0); x.lineTo(470 + k * 30, y0); x.lineTo(620 + k * 46, y0 + 18); x.lineTo(270 + k * 46, y0 + 18); x.closePath(); x.fill(); } x.restore();
    // filing cabinet, sideboard, percolator, radio
    box(x, 820, 420, 170, 220, '#5e6150', { r: 4, lw: 6 }); for (let k = 0; k < 3; k++) { box(x, 832, 432 + k * 68, 146, 58, '#6a6d5b', { r: 3, sh: 'b', lw: 4 }); box(x, 884, 454 + k * 68, 42, 10, '#a8a890', { r: 4, sh: 'n', lw: 3 }); box(x, 890, 438 + k * 68, 30, 12, '#d8d0bc', { sh: 'n', lw: 2 }); }
    box(x, 1000, 470, 440, 170, '#4a3426', { lw: 6 }); box(x, 992, 456, 456, 18, '#5a4030', { r: 3, sh: 'b', lw: 5 }); for (const q of [1110, 1220, 1330]) seg(x, [[q, 474], [q, 640]], 3); for (const q of [1080, 1190, 1300, 1400]) circ(x, q, 540, 5, '#c8a050', { sh: 'n', lw: 2 });
    box(x, 1030, 442, 80, 14, '#2a2a2a', { sh: 'n', lw: 4 }); poly(x, [[1046, 442], [1094, 442], [1086, 380], [1054, 380]], '#a8acb0', { lw: 5, shade: [1076, 370, 30, 80] }); circ(x, 1070, 374, 8, '#a8acb0', { lw: 4 }); x.beginPath(); x.arc(1100, 412, 16, -1.2, 1.2); stroke(x, { lw: 6 });
    box(x, 1250, 390, 130, 66, '#7a5232', { r: 22, lw: 5 }); box(x, 1266, 404, 62, 40, '#c8b890', { r: 10, sh: 'n', lw: 3 }); for (let q = 0; q < 5; q++) seg(x, [[1272 + q * 11, 408], [1272 + q * 11, 440]], 2, '#8a7a5a'); circ(x, 1352, 414, 9, '#d8c8a0', { lw: 3 }); circ(x, 1352, 438, 6, '#d8c8a0', { lw: 3 });
    // the coat stand: a trench coat and a fedora
    box(x, 1514, 230, 12, 420, '#3a2a1e', { lw: 4 }); for (const d of [-1, 1]) seg(x, [[1520, 640], [1520 + d * 40, 660]], 6);
    poly(x, [[1520, 262], [1556, 290], [1576, 560], [1540, 572], [1500, 572], [1464, 560], [1484, 290]], '#8a7a5a', { lw: 6, shade: [1530, 250, 60, 340] });
    seg(x, [[1520, 268], [1520, 566]], 3); seg(x, [[1470, 430], [1570, 430]], 8); seg(x, [[1470, 430], [1570, 430]], 4, '#6a5a3a'); poly(x, [[1500, 290], [1520, 330], [1540, 290]], '#6a5a3a', { lw: 4 });
    fedora(x, 1520, 238, 1.2);
    // the desk, case files, the phone, the green banker's lamp
    box(x, 550, 548, 440, 30, '#4b3424', { r: 4, sh: 'b', lw: 6 }); box(x, 860, 578, 120, 182, '#43301f', { lw: 6 }); for (let k = 0; k < 3; k++) { seg(x, [[860, 638 + k * 60], [980, 638 + k * 60]], 4); box(x, 906, 600 + k * 60, 28, 8, '#c8a050', { r: 3, sh: 'n', lw: 2 }); } box(x, 566, 578, 26, 182, '#43301f', { lw: 6 });
    for (let k = 0; k < 4; k++) box(x, 700 + k * 3, 536 - k * 10, 96, 12, k % 2 ? '#d8b878' : '#e8c88a', { r: 2, sh: 'n', lw: 3 });
    box(x, 812, 524, 66, 24, '#1a1a1a', { r: 8, lw: 4 }); circ(x, 845, 530, 12, '#2a2a2a', { sh: 'n', lw: 3 });
    box(x, 930, 536, 50, 12, '#b8863a', { r: 4, lw: 4 }); box(x, 951, 494, 8, 44, '#b8863a', { sh: 'n', lw: 3 });
    x.beginPath(); x.moveTo(906, 494); x.lineTo(1004, 494); x.quadraticCurveTo(1004, 466, 955, 466); x.quadraticCurveTo(906, 466, 906, 494); x.closePath(); x.fillStyle = '#2f6a46'; x.fill(); x.save(); x.clip(); x.fillStyle = '#245236'; x.fillRect(970, 460, 40, 40); x.restore(); stroke(x, { lw: 5 }); seg(x, [[918, 476], [940, 470]], 3, '#5cae7a');
    box(x, 760, 520, 26, 28, '#e8e2d4', { r: 4, lw: 4 }); x.beginPath(); x.arc(788, 532, 7, -1.4, 1.4); stroke(x, { lw: 4 });
    x.fillStyle = 'rgba(20,30,60,.12)'; x.fillRect(0, 0, 1600, 900);   // the blue of a night with one lamp on
  },
  anim(x, t, lit, P = {}, me = null) {
    // the window: rain, the city, a red neon outside, the blinds
    const nf = Math.floor(t * 9), neon = rnd(nf, 3) < 0.07 ? 0.2 : 0.85 + 0.15 * Math.sin(t * 30);
    x.save(); x.beginPath(); x.rect(150, 220, 300, 300); x.clip(); x.fillStyle = grad(x, 0, 220, 0, 520, [[0, '#0b1020'], [1, '#1a1e2a']]); x.fillRect(150, 220, 300, 300);
    city(x, 150, 330, 300, 190, 10, '#d8c890', 7);
    x.lineWidth = 7; x.strokeStyle = `rgba(255,70,60,${neon})`; x.beginPath(); x.moveTo(250, 300); x.lineTo(340, 300); x.lineTo(330, 350); x.lineTo(260, 350); x.closePath(); x.moveTo(340, 312); x.quadraticCurveTo(366, 320, 336, 338); x.stroke();
    glow(x, 300, 325, 120, '#ff463c', 0.25 * neon);
    x.strokeStyle = 'rgba(200,210,230,.35)'; x.lineWidth = 2; for (let i = 0; i < 40; i++) { const ph = (t * (1.4 + rnd(i, 2)) + rnd(i, 1)) % 1, rx = 150 + rnd(i, 3) * 300, ry = 220 + ph * 320; x.beginPath(); x.moveTo(rx, ry); x.lineTo(rx - 5, ry + 22); x.stroke(); }
    for (let k = 0; k < 13; k++) { const y = 228 + k * 23; box(x, 146, y, 308, 9, '#b8b0a0', { r: 2, sh: 'b', f: 0.4, lw: 2.5 }); }
    seg(x, [[200, 220], [200, 520]], 2, '#6a645a'); seg(x, [[400, 220], [400, 520]], 2, '#6a645a'); x.restore();
    x.lineWidth = 16; x.strokeStyle = '#3a2a1e'; x.strokeRect(150, 220, 300, 300); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(142, 212, 316, 316); box(x, 130, 520, 340, 18, '#3a2a1e', { sh: 'b', lw: 5 });
    glow(x, 300, 440, 300, '#ff463c', 0.05 * neon);
    // the ceiling fan, slow
    seg(x, [[770, 0], [770, 396]], 8, INK); seg(x, [[770, 0], [770, 396]], 4, '#5a5048');
    const fan = flip(P.fan || Z, t, 0.8), spin = t * (2.4 + 11 * fan);   // (switched up: a blur and a rattle)
    if (fan > 0.3) { x.save(); x.globalAlpha = 0.28 * fan; ell(x, 770, 412, 176, 18, '#4a3426', { lw: 0 }); x.globalAlpha = 0.55 * fan;   // switched up: a blur, and swept arcs with an ink edge
      for (let k = 0; k < 3; k++) { const a0 = spin * 0.5 + k * 2.1; x.beginPath(); x.ellipse(770, 412, 168 - k * 34, 17 - k * 3, 0, a0, a0 + 1.5); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); x.lineWidth = 3; x.strokeStyle = '#e8dcc4'; x.stroke(); } x.restore(); }
    const blades = []; for (let k = 0; k < 4; k++) { const a = spin + k * Math.PI / 2; blades.push([Math.sin(a), a]); } blades.sort((p, q) => p[0] - q[0]);
    for (const [, a] of blades) { const c = Math.cos(a), s = Math.sin(a), tx = 770 + c * 170, ty = 412 + s * 16; x.beginPath(); x.moveTo(770 + c * 20 - s * 4, 412 + s * 2 - 6); x.lineTo(tx - s * 12, ty - 7); x.quadraticCurveTo(tx + c * 12, ty, tx + s * 12, ty + 7); x.lineTo(770 + c * 20 + s * 4, 412 + s * 2 + 6); x.closePath(); x.fillStyle = s > 0 ? '#5a4030' : '#4a3426'; x.fill(); stroke(x, { lw: 4 }); }
    ell(x, 770, 410 + (fan > 0.5 ? (rnd(Math.floor(t * 30), 2) - 0.5) * 3 : 0), 30, 14, '#5a5048', { lw: 5 });
    // the desk lamp's pool of light, the mug's steam
    cone(x, 955, 494, 46, 760, 1120, 700, '#ffd89a', 0.5 * lit); glow(x, 955, 520, 160, '#ffcf8a', 0.18 * lit); glow(x, 955, 494, 30, '#fff2c8', 0.7 * lit);
    steam(x, 773, 516, t, 2, 60, 0.22, 5);
  },
  emblem(x) { fedora(x, 50, 52, 2.1); } });
function fedora(x, cx, cy, s) {
  x.save(); x.translate(cx, cy); x.scale(s, s); const lw = 5 / s;
  x.beginPath(); x.ellipse(0, 8, 26, 6, 0, 0, TAU); x.fillStyle = '#5b5148'; x.fill(); x.lineWidth = lw; x.strokeStyle = INK; x.stroke();
  x.beginPath(); x.moveTo(-15, 7); x.lineTo(-13, -10); x.quadraticCurveTo(-8, -18, 0, -12); x.quadraticCurveTo(8, -18, 13, -10); x.lineTo(15, 7); x.closePath(); x.fillStyle = '#6a5f54'; x.fill(); x.save(); x.clip(); x.fillStyle = '#544a40'; x.fillRect(5, -20, 12, 30); x.restore(); x.stroke();
  x.beginPath(); x.moveTo(-14.5, 0); x.lineTo(14.5, 0); x.lineTo(15, 6); x.lineTo(-15, 6); x.closePath(); x.fillStyle = '#1e1a16'; x.fill(); x.lineWidth = lw * 0.7; x.stroke(); x.restore(); }

// 8. sheet ghost: the haunted kitchen — moonlight, cobwebs, a stopped clock that still swings, dishes floating on their own
S.push({ id: 'sheet-ghost', name: 'the haunted kitchen', outfit: 'sheet-ghost', badge: '#20304f',
  base(x) {
    wall(x, '#3d4656', '#262c38'); for (let X = 0; X < 1600; X += 80) { x.fillStyle = 'rgba(255,255,255,.035)'; x.fillRect(X, 0, 40, 640); }
    for (let r = 0; r < 9; r++) for (let c = 0; c < 20; c++) { const X = c * 80 + 20 + (r % 2) * 40, Y = 30 + r * 68; x.fillStyle = 'rgba(200,190,170,.07)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(X + Math.cos(k * 1.57) * 6, Y + Math.sin(k * 1.57) * 6, 5, 0, TAU); x.fill(); } }
    for (const [px, py, w, h] of [[600, 300, 110, 80], [1240, 250, 140, 110], [40, 120, 90, 160]]) { poly(x, [[px, py], [px + w * 0.6, py - 8], [px + w, py + h * 0.4], [px + w * 0.8, py + h], [px + w * 0.1, py + h * 0.8]], '#4a5363', { lw: 0 }); poly(x, [[px + w * 0.6, py - 8], [px + w, py + h * 0.4], [px + w * 0.7, py + h * 0.3]], '#56606f', { lw: 2.5, ink: '#1c2028' }); }
    topShade(x, 0.4);
    // the window: a full moon, bare branches, a cracked pane, rags of curtain
    x.fillStyle = grad(x, 0, 200, 0, 520, [[0, '#14223c'], [1, '#2a3c5c']]); x.fillRect(150, 200, 300, 320); glow(x, 360, 300, 150, '#e8f0ff', 0.25); circ(x, 360, 300, 64, '#f1ead2', { lw: 0, sk: 0.08 });
    for (const [a, b, r] of [[340, 280, 10], [380, 320, 7], [366, 270, 5]]) circ(x, a, b, r, '#ddd4b8', { sh: 'n', lw: 0 });
    x.strokeStyle = '#0c0f16'; x.lineCap = 'round'; const br = (x0, y0, a, l, w, d) => { if (d > 4 || l < 10) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); br(x1, y1, a - 0.5 + rnd(d, l) * 0.2, l * 0.7, w * 0.65, d + 1); br(x1, y1, a + 0.45, l * 0.62, w * 0.6, d + 1); };
    x.save(); x.beginPath(); x.rect(150, 200, 300, 320); x.clip(); br(150, 520, -0.9, 120, 16, 0); br(160, 330, -0.2, 90, 10, 1); x.restore();
    x.lineWidth = 16; x.strokeStyle = '#4a4036'; x.strokeRect(150, 200, 300, 320); x.lineWidth = 9; x.beginPath(); x.moveTo(300, 200); x.lineTo(300, 520); x.moveTo(150, 360); x.lineTo(450, 360); x.stroke(); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(142, 192, 316, 336);
    seg(x, [[330, 380], [360, 420], [352, 450], [390, 470]], 2, 'rgba(255,255,255,.6)'); seg(x, [[360, 420], [400, 410]], 2, 'rgba(255,255,255,.6)');
    for (const [cx0, w] of [[108, 60], [440, 34]]) { x.beginPath(); x.moveTo(cx0, 170); x.lineTo(cx0 + w, 170); for (let k = 0; k <= 5; k++) x.lineTo(cx0 + w - k * w / 5, 540 + (k % 2 ? -30 : 10) + rnd(k, cx0) * 20); x.closePath(); x.fillStyle = '#4d5b52'; x.fill(); stroke(x, { lw: 5 }); for (let k = 1; k < 3; k++) seg(x, [[cx0 + k * w / 3, 176], [cx0 + k * w / 3 + 4, 500]], 3, 'rgba(18,10,5,.4)'); }
    box(x, 90, 160, 400, 14, '#3a3028', { r: 7, sh: 'n', lw: 4 });
    // the floor: old boards, gaps, dust
    x.fillStyle = '#2b2620'; x.fillRect(0, 640, 1600, 260); for (let r = 0; r < 6; r++) { seg(x, [[0, 640 + r * 44], [1600, 640 + r * 44]], 4, '#120c09'); for (let c = 0; c < 5; c++) { const X = (c * 330 + r * 150) % 1600; seg(x, [[X, 640 + r * 44], [X, 684 + r * 44]], 3, '#120c09'); x.fillStyle = '#5a5048'; x.fillRect(X + 10, 648 + r * 44, 3, 3); x.fillRect(X - 14, 676 + r * 44, 3, 3); } }
    x.fillStyle = 'rgba(200,200,190,.06)'; x.fillRect(0, 640, 1600, 260); x.fillStyle = '#120c09'; x.fillRect(0, 634, 1600, 10);
    // the cast-iron stove, its pipe; the dusty counter, cobwebbed jars, a cracked teapot
    box(x, 914, -10, 34, 400, '#26262a', { lw: 5 }); for (const y of [100, 250]) box(x, 908, y, 46, 12, '#3a3a40', { sh: 'n', lw: 4 });
    box(x, 820, 390, 230, 250, '#26262a', { r: 8, lw: 6, f: 0.14 }); box(x, 810, 380, 250, 18, '#3a3a40', { r: 4, sh: 'b', lw: 5 }); box(x, 846, 450, 150, 110, '#1c1c20', { r: 6, sh: 'n', lw: 5 }); box(x, 880, 470, 80, 6, '#8a8a90', { r: 3, sh: 'n', lw: 2 }); box(x, 856, 578, 130, 14, '#8a8a90', { r: 7, sh: 'n', lw: 3 });
    for (const lx of [830, 1030]) box(x, lx, 640, 12, 30, '#26262a', { sh: 'n', lw: 4 });
    box(x, 1070, 470, 370, 170, '#4a3e34', { lw: 6 }); box(x, 1062, 452, 386, 20, '#5a4c40', { r: 3, sh: 'b', lw: 5 });
    x.save(); x.translate(1150, 520); x.rotate(0.12); box(x, -60, -24, 120, 40, '#54473c', { r: 3, lw: 5 }); x.restore(); for (const q of [1250, 1360]) seg(x, [[q, 476], [q, 640]], 3);
    for (const [jx, h] of [[1100, 60], [1150, 46], [1200, 70]]) { box(x, jx, 452 - h, 40, h, 'rgba(170,190,180,.35)', { r: 6, lw: 4 }); box(x, jx - 2, 446 - h, 44, 10, '#5a4c40', { r: 3, sh: 'n', lw: 3 }); cobweb(x, jx + 40, 446 - h, 24, Math.PI * 0.5, Math.PI, 0.45); }
    x.beginPath(); x.moveTo(1320, 452); x.bezierCurveTo(1310, 396, 1400, 396, 1390, 452); x.closePath(); x.fillStyle = '#d8d4c8'; x.fill(); stroke(x, { lw: 5 }); seg(x, [[1340, 412], [1350, 430], [1342, 446]], 2.5); seg(x, [[1314, 434], [1290, 414]], 8); x.beginPath(); x.arc(1394, 428, 12, -1.2, 1.2); stroke(x, { lw: 5 });
    // the grandfather clock (the fridge)
    box(x, 1478, 236, 104, 430, '#4a2e1e', { r: 6, lw: 6, f: 0.2 }); x.beginPath(); x.moveTo(1470, 240); x.quadraticCurveTo(1530, 180, 1590, 240); x.closePath(); x.fillStyle = '#4a2e1e'; x.fill(); stroke(x, { lw: 6 });
    circ(x, 1530, 300, 40, '#e8e0cc', { lw: 5, sk: 0.1 }); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; seg(x, [[1530 + Math.cos(a) * 32, 300 + Math.sin(a) * 32], [1530 + Math.cos(a) * 37, 300 + Math.sin(a) * 37]], 3); } seg(x, [[1530, 300], [1530, 268]], 4); seg(x, [[1530, 300], [1532, 276]], 4);
    box(x, 1496, 380, 68, 220, '#1c140e', { r: 30, sh: 'n', lw: 5 });
    // the table, lace, a candle stub; one chair standing, one knocked over
    box(x, 560, 556, 420, 28, '#5a4632', { r: 6, sh: 'b', lw: 6 }); for (const lx of [590, 930]) box(x, lx, 584, 24, 180, '#4a3a2c', { lw: 6 });
    x.beginPath(); x.moveTo(556, 560); x.lineTo(984, 560); x.lineTo(984, 600); for (let q = 0; q < 14; q++) x.quadraticCurveTo(984 - q * 30.5 - 15, 628, 984 - (q + 1) * 30.5, 600); x.closePath(); x.fillStyle = '#bdb6a6'; x.fill(); stroke(x, { lw: 5 }); for (let q = 0; q < 14; q++) circ(x, 969 - q * 30.5, 608, 4, '#8a8478', { sh: 'n', lw: 0 });
    box(x, 870, 520, 20, 36, '#ece6d6', { r: 3, lw: 4 }); seg(x, [[874, 524], [872, 544]], 3, '#d8d0bc'); seg(x, [[880, 520], [880, 512]], 2.5);
    box(x, 760, 540, 56, 14, '#1a1a1e', { r: 4, lw: 4 }); box(x, 766, 542, 44, 8, '#2a3a52', { r: 2, sh: 'n', lw: 0 });
    cobweb(x, 0, 640, 140, -Math.PI * 0.5, 0, 0.35); cobweb(x, 450, 200, 70, Math.PI * 0.5, Math.PI, 0.5); cobweb(x, 1440, 470, 60, Math.PI, Math.PI * 1.5, 0.45);
  },
  anim(x, t, lit, P = {}, me = null) {
    cone(x, 300, 520, 150, 360, 980, 900, '#cfe0ff', 0.13);
    for (let i = 0; i < 26; i++) { const ph = (t * 0.03 + rnd(i, 1)) % 1, mx = 200 + rnd(i, 2) * 650 + Math.sin(t * 0.6 + i) * 20 + ph * 200, my = 540 + ph * 330; x.fillStyle = `rgba(230,240,255,${0.5 * Math.sin(ph * Math.PI)})`; x.fillRect(mx, my, 3, 3); }
    const ck = flip(P.clock || Z, t, 0.4), sw = Math.sin(t * (2.1 + 2.4 * ck)) * (0.32 + 0.2 * ck); x.save(); x.beginPath(); x.roundRect(1496, 380, 68, 220, 30); x.clip(); x.translate(1530, 384); x.rotate(sw); seg(x, [[0, 0], [0, 160]], 7, INK); seg(x, [[0, 0], [0, 160]], 3, '#c8a050'); circ(x, 0, 172, 20, '#c8a050', { lw: 5 }); x.restore();
    // the chandelier, unlit, cobwebbed
    const ch = flip(P.chand || Z, t, 0.5); if (ch > 0) cone(x, 770, 384, 90, 470, 1070, 900, '#d8ecff', 0.26 * ch);
    seg(x, [[770, 0], [770, 340]], 5, '#2a2622'); ell(x, 770, 360, 16, 26, '#3a332c', { lw: 5 });
    for (const d of [-1, 1]) for (const k of [1, 2]) { const ex = 770 + d * k * 48; x.beginPath(); x.moveTo(770, 368); x.quadraticCurveTo(770 + d * k * 30, 410, ex, 384); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#4a4036'; x.stroke(); box(x, ex - 6, 356, 12, 28, '#e8e2d4', { r: 3, lw: 3 }); ell(x, ex, 386, 12, 4, '#3a332c', { lw: 3 }); if (ch > 0) { glow(x, ex, 342, 40, '#d8ecff', 0.4 * ch); ghostFlame(x, ex, 356, 22 * ch, t, ex); } }
    x.strokeStyle = 'rgba(225,230,235,.45)'; x.lineWidth = 2; for (const [a, b] of [[674, 830], [722, 866], [818, 700]]) { x.beginPath(); x.moveTo(a, 388); x.quadraticCurveTo((a + b) / 2, 440 + Math.sin(t + a) * 6, b, 388); x.stroke(); }
    // the floating dishes
    const sc = landed(P.table || Z, t), up = sc >= 0 && sc < 2.2 ? Math.sin(Math.min(1, sc / 1.4) * Math.PI) * (1 - sc / 2.2) : 0;   // he lands on the table: the dishes fly up off it, then settle
    const dish = (cx, cy, s, rot, f) => { cy -= up * (70 + (cx % 50)); cx += up * (cx - 800) * 0.5; rot += up * 2.4 * (cx > 800 ? 1 : -1); glow(x, cx, cy + 50, 60, '#d8f0ff', 0.14); x.save(); x.translate(cx, cy); x.rotate(rot); f(s); x.restore(); };
    { const bx = 788, by = 512 + Math.sin(t * 1.7) * 3; glow(x, bx, by + 30, 40, '#9fd0ff', 0.12); box(x, bx - 30, by - 14, 60, 26, '#e8eef6', { r: 12, sh: 'n', lw: 4 }); poly(x, [[bx - 14, by + 10], [bx - 22, by + 22], [bx - 2, by + 11]], '#e8eef6', { lw: 0 }); for (let k = 0; k < 3; k++) circ(x, bx - 14 + k * 14, by - 1 - (Math.floor(t * 3) % 3 === k ? 4 : 0), 4, '#6a7a90', { sh: 'n', lw: 0 }); }
    dish(720, 466 + Math.sin(t * 1.3) * 10, 1, Math.sin(t * 0.7) * 0.25, () => { ell(x, 0, 0, 44, 12, '#ece8de', { lw: 5 }); ell(x, 0, -1, 28, 6, '#d8d2c4', { lw: 2.5 }); seg(x, [[-30, -2], [30, -2]], 2, '#6a8ab8'); });
    dish(850, 436 + Math.sin(t * 1.1 + 1) * 12, 1, Math.sin(t * 0.6 + 2) * 0.3, () => { ell(x, 0, 14, 34, 9, '#ece8de', { lw: 4 }); x.beginPath(); x.moveTo(-20, -14); x.lineTo(20, -14); x.quadraticCurveTo(18, 12, 0, 12); x.quadraticCurveTo(-18, 12, -20, -14); x.closePath(); x.fillStyle = '#ece8de'; x.fill(); stroke(x, { lw: 4 }); x.beginPath(); x.arc(22, -2, 8, -1.3, 1.3); stroke(x, { lw: 4 }); seg(x, [[-16, -6], [16, -6]], 2, '#6a8ab8'); });
    dish(960, 486 + Math.sin(t * 1.5 + 2) * 9, 1, t * 0.5, () => { seg(x, [[-26, 0], [16, 0]], 8); seg(x, [[-26, 0], [16, 0]], 3.5, '#c9ced6'); for (const d of [-6, 0, 6]) seg(x, [[16, d], [32, d]], 3); });
    dish(640, 420 + Math.sin(t * 0.9 + 3) * 8, 1, -t * 0.4, () => { seg(x, [[-22, 0], [12, 0]], 8); seg(x, [[-22, 0], [12, 0]], 3.5, '#c9ced6'); ell(x, 20, 0, 10, 7, '#c9ced6', { lw: 3.5 }); });
  },
  emblem(x) {   // a sheet ghost
    x.beginPath(); x.moveTo(26, 82); x.lineTo(28, 46); x.bezierCurveTo(28, 14, 72, 14, 72, 46); x.lineTo(74, 82); x.quadraticCurveTo(66, 74, 62, 84); x.quadraticCurveTo(56, 74, 50, 84); x.quadraticCurveTo(44, 74, 38, 84); x.quadraticCurveTo(32, 74, 26, 82); x.closePath();
    x.fillStyle = '#f4f1ea'; x.fill(); x.save(); x.clip(); x.fillStyle = '#cfd6e0'; x.fillRect(58, 10, 30, 80); x.restore(); stroke(x, { lw: 5 }); ell(x, 42, 44, 4.5, 6.5, INK, { lw: 0 }); ell(x, 58, 44, 4.5, 6.5, INK, { lw: 0 }); } });

// 9. circuit cyborg (the Borg look, to match his outfit): assimilated — gunmetal plates, black conduits, green status
// lights, a red scanner; the fridge is a regeneration alcove, the hologram over the counter is a cube
const TRACES = (() => { const out = []; for (let i = 0; i < 22; i++) { let X = Math.floor(rnd(i, 11) * 40) * 40, Y = 40 + Math.floor(rnd(i, 12) * 14) * 40; const P = [[X, Y]];
  for (let k = 0; k < 4; k++) { const d = Math.floor(rnd(i, k + 20) * 4), L = 40 + Math.floor(rnd(i, k + 30) * 4) * 40; if (d === 0) X += L; else if (d === 1) { X += L; Y += L * (rnd(i, k) < 0.5 ? 1 : -1); } else if (d === 2) X -= L; else Y += L * (rnd(i, k + 5) < 0.5 ? 1 : -1); Y = Math.max(30, Math.min(610, Y)); P.push([X, Y]); } out.push(P); } return out; })();
const BG = { gun: '#2c2f36', plate: '#363a42', edge: '#4a4f59', black: '#17181c', green: '#57ff7a', red: '#ff2a2a' };
function conduit(x, pts, w = 14) { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.lineWidth = w + 6; x.strokeStyle = INK; x.stroke(); x.lineWidth = w; x.strokeStyle = BG.black; x.stroke(); x.lineWidth = w * 0.25; x.strokeStyle = 'rgba(255,255,255,.18)'; x.stroke(); }
S.push({ id: 'circuit-cyborg', name: 'the collective', outfit: 'circuit-cyborg', badge: '#1e2026',
  base(x) {
    wall(x, '#23252b', '#1a1c21');
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) { const X = -60 + c * 190 + (r % 2) * 60, Y = r * 128; box(x, X + 3, Y + 3, 184, 122, mix(BG.plate, '#000000', rnd(c, r + 2) * 0.3), { r: 4, sh: 'b', f: 0.12, lw: 4 });
      for (const [a, b] of [[X + 14, Y + 14], [X + 174, Y + 14], [X + 14, Y + 114], [X + 174, Y + 114]]) circ(x, a, b, 3.5, BG.edge, { sh: 'n', lw: 1.5 }); }
    for (const P of TRACES) { seg(x, P, 3, '#1d4a2a'); circ(x, P[P.length - 1][0], P[P.length - 1][1], 5, '#14171b', { sh: 'n', lw: 2.5, ink: '#2e7a42' }); }
    conduit(x, [[0, 120], [180, 150], [300, 140], [470, 200], [560, 180]], 16); conduit(x, [[560, 180], [610, 260], [600, 420]], 12); conduit(x, [[1600, 90], [1380, 140], [1300, 230], [1310, 380]], 16); conduit(x, [[1040, 0], [1080, 120], [1200, 160]], 10);
    topShade(x, 0.4);
    // the screen (where the window was): a viewport onto the collective's green
    box(x, 136, 246, 328, 278, BG.gun, { r: 10, lw: 6 }); box(x, 150, 260, 300, 236, '#04140a', { r: 4, sh: 'n', lw: 3 }); for (const [a, b] of [[146, 256], [454, 256], [146, 514], [454, 514]]) circ(x, a, b, 5, BG.edge, { sh: 'n', lw: 2 });
    conduit(x, [[300, 524], [300, 560], [250, 600], [250, 640]], 12);
    // the floor: dark grating, a dim green grid
    x.fillStyle = grad(x, 0, 640, 0, 900, [[0, '#15171b'], [1, '#0c0d10']]); x.fillRect(0, 640, 1600, 260);
    x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 2; for (let q = 0; q < 1600; q += 16) { x.beginPath(); x.moveTo(q, 650); x.lineTo(q, 900); x.stroke(); }
    x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(87,255,122,.16)'; x.lineWidth = 3;
    for (const y of [662, 692, 732, 782, 842]) { x.beginPath(); x.moveTo(0, y); x.lineTo(1600, y); x.stroke(); }
    for (let i = -8; i <= 24; i++) { const xb = -400 + i * 120; x.beginPath(); x.moveTo(800 + (xb - 800) * 0.42, 640); x.lineTo(xb, 900); x.stroke(); } x.restore();
    box(x, -10, 632, 1620, 16, BG.gun, { sh: 'n', lw: 4 });
    // the counter: ribbed gunmetal, status lights, a black kettle
    box(x, 800, 474, 640, 166, BG.gun, { lw: 6, f: 0.12 }); for (let q = 0; q < 16; q++) seg(x, [[820 + q * 40, 494], [820 + q * 40, 620]], 4, '#1e2026');
    box(x, 790, 456, 660, 20, BG.edge, { r: 4, sh: 'b', f: 0.4, lw: 5 });
    box(x, 1240, 392, 70, 64, '#22242a', { r: 14, lw: 5 }); box(x, 1250, 404, 10, 40, BG.green, { r: 4, sh: 'n', lw: 2 }); seg(x, [[1310, 410], [1330, 404]], 6);
    conduit(x, [[1440, 560], [1400, 600], [1440, 640]], 10);
    // the regeneration alcove (the fridge)
    box(x, 1452, 160, 142, 480, BG.gun, { r: 10, lw: 6, f: 0.14 }); box(x, 1472, 186, 102, 430, '#0a120c', { r: 8, sh: 'n', lw: 4 });
    for (let k = 0; k < 9; k++) seg(x, [[1478, 210 + k * 46], [1568, 210 + k * 46]], 3, '#1d4a2a');
    for (const d of [-1, 1]) conduit(x, [[1523 + d * 44, 200], [1523 + d * 30, 300], [1523 + d * 40, 420]], 8);
    // the table, stools
    box(x, 754, 580, 32, 150, BG.gun, { lw: 5 }); ell(x, 770, 734, 76, 12, BG.gun, { lw: 5 });
    box(x, 580, 556, 380, 24, BG.plate, { r: 6, sh: 'b', f: 0.4, lw: 6 }); seg(x, [[594, 578], [946, 578]], 3, BG.green);
    for (const sx of [1040, 500]) { box(x, sx - 22, 616, 44, 120, BG.gun, { r: 6, lw: 5 }); ell(x, sx, 616, 40, 10, BG.edge, { lw: 5 }); }
    x.fillStyle = 'rgba(30,255,90,.03)'; x.fillRect(0, 0, 1600, 900);
  },
  anim(x, t, lit, P = {}, me = null) {
    x.save(); x.globalCompositeOperation = 'lighter';
    TRACES.forEach((P, i) => { let L = 0; const sl = []; for (let k = 1; k < P.length; k++) { const l = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); sl.push(l); L += l; }
      const d = ((t * (90 + rnd(i, 3) * 120) + rnd(i, 4) * L) % (L + 260)); if (d > L) return; let acc = 0;
      for (let k = 1; k < P.length; k++) { if (acc + sl[k - 1] >= d) { const u = (d - acc) / sl[k - 1], px = P[k - 1][0] + (P[k][0] - P[k - 1][0]) * u, py = P[k - 1][1] + (P[k][1] - P[k - 1][1]) * u;
        glow(x, px, py, 14, BG.green, 0.7); x.fillStyle = '#d8ffe0'; x.fillRect(px - 2.5, py - 2.5, 5, 5); break; } acc += sl[k - 1]; } }); x.restore();
    x.save(); x.beginPath(); x.rect(150, 260, 300, 236); x.clip(); x.strokeStyle = 'rgba(87,255,122,.16)'; x.lineWidth = 2;
    for (let q = 0; q < 10; q++) { const gx = 150 + ((q * 30 - t * 30) % 300 + 300) % 300; x.beginPath(); x.moveTo(gx, 260); x.lineTo(gx, 496); x.stroke(); } for (let q = 0; q < 8; q++) seg(x, [[150, 260 + q * 30], [450, 260 + q * 30]], 2, 'rgba(87,255,122,.16)');
    x.beginPath(); for (let q = 0; q <= 300; q += 4) x.lineTo(150 + q, 378 + Math.sin(q * 0.05 + t * 4) * 40 * Math.sin(q * 0.013 + t) + Math.sin(q * 0.21 - t * 9) * 6); x.lineWidth = 4; x.strokeStyle = BG.green; x.stroke(); glow(x, 300, 378, 160, BG.green, 0.12);
    const sy = 260 + ((t * 70) % 236); seg(x, [[150, sy], [450, sy]], 2, 'rgba(255,42,42,.7)'); x.restore();
    for (let k = 0; k < 14; k++) { const on = rnd(k, Math.floor(t * 3 + k * 0.4)) < 0.6; circ(x, 830 + k * 40 + 6, 486, 4, on ? (k % 5 === 2 ? BG.red : BG.green) : '#16241a', { sh: 'n', lw: 1.5 }); }
    const rg = flip(P.alcove || Z, t, 0.8);   // regenerating: the bars run bright and fast, a column of light, a ring scanning down
    for (let k = 0; k < 9; k++) { const p = 0.5 + 0.5 * Math.sin(t * (1.6 + 5 * rg) - k * 0.5); x.fillStyle = `rgba(${87 + 120 * rg | 0},255,${122 + 80 * rg | 0},${0.12 + 0.35 * p + 0.4 * rg})`; x.fillRect(1480, 196 + k * 46, 86, 12); } glow(x, 1523, 400, 140 + 120 * rg, BG.green, 0.18 + 0.3 * rg);
    if (rg > 0) { const ry = 200 + ((t * 160) % 420); x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(200,255,210,${0.8 * rg})`; x.lineWidth = 4; x.beginPath(); x.ellipse(1523, ry, 54, 9, 0, 0, TAU); x.stroke(); x.restore(); cone(x, 1523, 610, 50, 1440, 1606, 900, '#8aff9e', 0.35 * rg); }
    for (const [cx, ph] of [[880, 0], [1120, 1.7]]) { const p = 0.5 + 0.5 * Math.sin(t * 2.4 + ph); for (let k = 1; k <= 3; k++) { x.beginPath(); x.ellipse(cx, 466, 18 * k, 4 * k * 0.6, 0, 0, TAU); x.lineWidth = 3; x.strokeStyle = `rgba(255,${60 + k * 30},40,${0.25 + 0.5 * p})`; x.stroke(); } }
    const hk = flip(P.holo || Z, t, 0.5), hz = 1120, hy = 384 + Math.sin(t * 1.5) * 4 - 20 * hk, a = t * (0.7 + 3.2 * hk), cs = 28 * (1 + 0.55 * hk);   // the hologram: a cube, of course (switched up: bigger, faster)
    x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(87,255,122,.08)'; x.beginPath(); x.moveTo(hz - 10, 470); x.lineTo(hz - 50, hy); x.lineTo(hz + 50, hy); x.lineTo(hz + 10, 470); x.fill();
    const V = []; for (let k = 0; k < 8; k++) { const vx = (k & 1 ? 1 : -1) * cs, vy = (k & 2 ? 1 : -1) * cs, vz = (k & 4 ? 1 : -1) * cs, c = Math.cos(a), sn = Math.sin(a); V.push([hz + vx * c + vz * sn, hy + vy * 0.9 + (-vx * sn + vz * c) * 0.25]); }
    x.strokeStyle = 'rgba(140,255,160,.9)'; x.lineWidth = 3; for (const [i, j] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) { x.beginPath(); x.moveTo(...V[i]); x.lineTo(...V[j]); x.stroke(); } x.restore();
    ell(x, hz, 472, 22, 5, BG.edge, { lw: 3 });
    const ly = 372 + Math.sin(t * 1.8) * 6; conduit(x, [[770, 0], [770, ly - 30]], 10); cone(x, 770, ly + 12, 60, 560, 980, 900, '#8aff9e', 0.26 * lit);
    box(x, 736, ly - 34, 68, 26, BG.gun, { r: 6, lw: 5 }); x.beginPath(); x.ellipse(770, ly, 64, 13, 0, 0, TAU); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 9; x.strokeStyle = BG.edge; x.stroke(); x.lineWidth = 4; x.strokeStyle = mix('#1d4a2a', BG.green, lit); x.stroke(); glow(x, 770, ly, 100, BG.green, 0.25 * lit);
    circ(x, 804, ly - 22, 4, Math.floor(t * 2) % 2 ? BG.red : '#3a0a0a', { sh: 'n', lw: 1.5 });
    const scan = (t * 0.35) % 1.6; if (scan < 1) { const sx = 60 + scan * 1480; x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,42,42,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(1520, 210); x.lineTo(sx, 880); x.stroke(); glow(x, sx, 880, 26, BG.red, 0.6); x.restore(); }   // the red scanner, like his eyepiece's laser
  },
  emblem(x) {   // a chip: gunmetal, a green core, a red light
    for (let k = 0; k < 4; k++) for (const [a, b, w, h] of [[33 + k * 10, 20, 5, 9], [33 + k * 10, 71, 5, 9], [20, 33 + k * 10, 9, 5], [71, 33 + k * 10, 9, 5]]) box(x, a, b, w, h, '#8a909c', { sh: 'n', lw: 2 });
    box(x, 27, 27, 46, 46, '#3a3e47', { r: 6, lw: 5 }); seg(x, [[30, 40], [40, 40], [44, 44]], 2.5, '#57ff7a'); seg(x, [[70, 60], [60, 60], [56, 56]], 2.5, '#57ff7a');
    box(x, 41, 41, 18, 18, '#57ff7a', { r: 3, sh: 'n', lw: 3 }); x.fillStyle = '#e0ffe6'; x.fillRect(45, 45, 5, 5); circ(x, 65, 34, 4, '#ff2a2a', { sh: 'n', lw: 2 }); } });

// 11. suit + tie: the manager's break room — a drop ceiling, a flickering tube, a water cooler, one mug, and a motivational
// poster that motivates nothing (a single circle)
S.push({ id: 'suit-tie', name: 'the break room', outfit: 'suit-tie', badge: '#2c3e66',
  base(x) {
    wall(x, '#757060', '#5e594c'); box(x, -10, 500, 1620, 140, '#5a5548', { sh: 'n', lw: 0 }); box(x, -10, 494, 1620, 10, '#4a463b', { sh: 'n', lw: 3 });
    box(x, -10, -10, 1620, 70, '#bfb9ab', { sh: 'n', lw: 5 }); for (let X = 0; X < 1600; X += 150) seg(x, [[X, 0], [X, 60]], 3, '#8a8478');
    topShade(x, 0.4);
    // the window: blinds half up, office towers at dusk
    x.fillStyle = grad(x, 0, 240, 0, 500, [[0, '#2c3a62'], [0.6, '#c87a52'], [1, '#e8a060']]); x.fillRect(150, 240, 300, 260);
    for (let i = 0; i < 6; i++) { const bx = 160 + i * 50, bh = 80 + rnd(i, 8) * 140; x.fillStyle = '#2a2e3a'; x.fillRect(bx, 500 - bh, 44, bh); for (let r = 0; r * 14 < bh - 12; r++) for (let c = 0; c < 3; c++) if (rnd(i * 9 + r, c) < 0.4) { x.fillStyle = '#ffe08a'; x.fillRect(bx + 6 + c * 13, 506 - bh + r * 14, 7, 6); } }
    for (let k = 0; k < 6; k++) box(x, 146, 238 + k * 13, 308, 8, '#d8d8d0', { r: 2, sh: 'b', f: 0.4, lw: 2 }); box(x, 146, 316, 308, 10, '#b8b8b0', { r: 3, sh: 'n', lw: 3 }); seg(x, [[420, 326], [420, 400]], 2, '#e8e8e0');
    x.lineWidth = 12; x.strokeStyle = '#b9bcc0'; x.strokeRect(150, 240, 300, 260); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(142, 232, 316, 276); seg(x, [[300, 240], [300, 500]], 8, '#b9bcc0');
    // the poster: a single circle
    // the floor: carpet tiles
    for (let r = 0; r < 4; r++) for (let c = 0; c < 17; c++) { box(x, c * 100, 640 + r * 65, 100, 65, (r + c) % 2 ? '#4b5363' : '#444b58', { sh: 'n', lw: 0 }); x.save(); x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 2; for (let q = 0; q < 5; q++) { x.beginPath(); if ((r + c) % 2) { x.moveTo(c * 100 + q * 20, 640 + r * 65); x.lineTo(c * 100 + q * 20, 705 + r * 65); } else { x.moveTo(c * 100, 640 + r * 65 + q * 13); x.lineTo(c * 100 + 100, 640 + r * 65 + q * 13); } x.stroke(); } x.restore(); }
    x.fillStyle = '#26241e'; x.fillRect(0, 630, 1600, 14);
    // the counter: a coffee machine, a microwave
    box(x, 800, 482, 300, 158, '#8a806b', { lw: 6 }); seg(x, [[950, 482], [950, 640]], 4); box(x, 930, 540, 10, 30, '#c8c4b8', { r: 4, sh: 'n', lw: 3 }); box(x, 960, 540, 10, 30, '#c8c4b8', { r: 4, sh: 'n', lw: 3 }); box(x, 790, 462, 320, 20, '#d8d2c2', { r: 3, sh: 'b', lw: 5 });
    box(x, 820, 376, 80, 86, '#1e1e22', { r: 6, lw: 5 }); box(x, 836, 420, 48, 40, 'rgba(200,220,230,.5)', { r: 4, lw: 4 }); x.fillStyle = '#4a2a14'; x.fillRect(838, 440, 44, 18); circ(x, 888, 394, 4, '#ff4f5a', { sh: 'n', lw: 0 });
    box(x, 940, 398, 150, 64, '#d8d8d4', { r: 6, lw: 5 }); box(x, 952, 410, 92, 42, '#1e2228', { r: 4, sh: 'n', lw: 4 }); box(x, 1052, 410, 28, 42, '#bdbdb8', { r: 3, sh: 'n', lw: 3 }); for (let k = 0; k < 6; k++) x.fillRect(1056 + (k % 2) * 12, 414 + Math.floor(k / 2) * 12, 7, 7);
    // a snake plant, the water cooler
    poly(x, [[1180, 560], [1240, 560], [1232, 640], [1188, 640]], '#c86a3a', { lw: 5, shade: [1222, 550, 30, 100] });
    for (const [a, h, l] of [[-0.25, 110, 1190], [0.05, 140, 1206], [0.3, 100, 1222], [-0.05, 90, 1214]]) { x.save(); x.translate(l, 562); x.rotate(a); x.beginPath(); x.moveTo(-8, 0); x.quadraticCurveTo(-10, -h * 0.6, 0, -h); x.quadraticCurveTo(10, -h * 0.6, 8, 0); x.closePath(); x.fillStyle = '#3c7a3a'; x.fill(); stroke(x, { lw: 4 }); seg(x, [[0, -10], [0, -h + 14]], 2, '#c8d870'); x.restore(); }
    box(x, 1440, 470, 120, 180, '#e3e3df', { r: 8, lw: 6, f: 0.2 }); box(x, 1460, 530, 80, 40, '#c8c8c4', { r: 4, sh: 'n', lw: 4 }); box(x, 1472, 500, 14, 22, '#e8463a', { r: 3, lw: 3 }); box(x, 1512, 500, 14, 22, '#3c8fd8', { r: 3, lw: 3 }); box(x, 1464, 566, 72, 8, '#9a9a96', { sh: 'n', lw: 3 });
    box(x, 1562, 480, 20, 90, '#f2f2ee', { r: 4, lw: 4 }); for (let k = 0; k < 3; k++) poly(x, [[1562, 570 + k * 12], [1582, 570 + k * 12], [1572, 588 + k * 12]], '#f2f2ee', { lw: 2 });
    // the table: round, laminate, one mug
    box(x, 762, 586, 16, 150, '#c9ced6', { lw: 4, f: 0.4 }); seg(x, [[710, 744], [830, 744]], 10); seg(x, [[710, 744], [830, 744]], 5, '#c9ced6');
    ell(x, 770, 572, 184, 22, '#a8a294', { lw: 6 }); ell(x, 770, 566, 180, 18, '#d9d3c4', { lw: 5 });
    box(x, 820, 526, 34, 36, '#f2f0ea', { r: 5, lw: 4 }); x.beginPath(); x.arc(856, 542, 9, -1.3, 1.3); stroke(x, { lw: 5 }); ell(x, 837, 528, 14, 3, '#5a3a20', { lw: 0 }); poly(x, [[700, 558], [760, 552], [770, 566], [708, 570]], '#f2f0ea', { lw: 3 });
    for (const [cx, d] of [[520, -1], [1030, 1]]) { box(x, cx - 42, 604, 84, 18, '#3a6ea5', { r: 8, sh: 'b', lw: 6 }); box(x, cx + d * 30 - 18, 470, 40, 120, '#3a6ea5', { r: 10, lw: 6 }); seg(x, [[cx - 34, 622], [cx - 40, 740]], 6); seg(x, [[cx + 34, 622], [cx + 40, 740]], 6); seg(x, [[cx + d * 30, 590], [cx + d * 30, 606]], 6); }
  },
  anim(x, t, lit, P = {}, me = null) {
    // (the cooler glugs on its own every 6 s, and when he bumps it: g below)
    const tb = P.tube || ON, k = Math.floor(t * 14), on0 = tb.on && since(tb, t) < 0.55 ? (rnd(Math.floor(t * 18), 8) < 0.5 ? 0.15 : 1) : 1;   // switched on: it stutters before it catches
    const f = (rnd(k, 5) < 0.05 ? 0.25 : rnd(Math.floor(t * 0.5), 6) < 0.3 && rnd(k, 7) < 0.3 ? 0.6 : 1) * on0 * (lit > 0.05 ? 1 : 0);
    seg(x, [[690, 0], [690, 338]], 3, '#3a3a40'); seg(x, [[850, 0], [850, 338]], 3, '#3a3a40');
    cone(x, 770, 366, 130, 520, 1020, 900, '#e6f2ff', 0.3 * f * lit); x.fillStyle = `rgba(220,235,255,${0.05 * f * lit})`; x.fillRect(0, 0, 1600, 900);
    box(x, 640, 338, 260, 26, '#d9dde0', { r: 5, lw: 5 }); box(x, 652, 360, 236, 9, f > 0.5 ? '#f4fbff' : '#8a9aa8', { r: 4, sh: 'n', lw: 3 }); glow(x, 770, 366, 120, '#e6f2ff', 0.3 * f * lit);
    x.save(); x.beginPath(); x.moveTo(1450, 470); x.lineTo(1450, 330); x.quadraticCurveTo(1450, 300, 1480, 300); x.lineTo(1520, 300); x.quadraticCurveTo(1550, 300, 1550, 330); x.lineTo(1550, 450); x.lineTo(1520, 470); x.lineTo(1480, 470); x.closePath(); x.fillStyle = 'rgba(111,183,232,.78)'; x.fill(); stroke(x, { lw: 6 }); x.clip();
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(1462, 310, 10, 140); seg(x, [[1450, 380], [1550, 380]], 3, 'rgba(18,10,5,.3)');
    const g = (t % 6) < 1.2 || since(P.cooler || Z, t) < 1.4; for (let i = 0; i < (g ? 10 : 3); i++) { const ph = ((t * (g ? 0.9 : 0.25) + i * 0.13) % 1), bx = 1490 + Math.sin(i * 2.3 + t) * 22, by = 466 - ph * 160, r = 3 + rnd(i, 2) * (g ? 9 : 4); x.beginPath(); x.arc(bx, by, r, 0, TAU); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.75)'; x.stroke(); }
    x.restore(); box(x, 1478, 462, 44, 14, '#3c8fd8', { r: 3, sh: 'n', lw: 4 });
    steam(x, 837, 520, t, 2, 70, 0.28, 6);
  },
  emblem(x) {   // a necktie on a collar
    poly(x, [[30, 14], [48, 22], [42, 36]], '#f6f3ec', { lw: 4 }); poly(x, [[70, 14], [52, 22], [58, 36]], '#f6f3ec', { lw: 4 });
    poly(x, [[45, 32], [55, 32], [64, 72], [50, 88], [36, 72]], '#c8302c', { lw: 5, shade: [52, 30, 20, 60] }); x.save(); x.beginPath(); x.moveTo(45, 32); x.lineTo(55, 32); x.lineTo(64, 72); x.lineTo(50, 88); x.lineTo(36, 72); x.closePath(); x.clip();
    x.strokeStyle = '#8c1c1a'; x.lineWidth = 4; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(30, 40 + k * 10); x.lineTo(70, 30 + k * 10); x.stroke(); } x.restore(); poly(x, [[45, 32], [55, 32], [64, 72], [50, 88], [36, 72]], 'rgba(0,0,0,0)', { lw: 5 });
    poly(x, [[42, 20], [58, 20], [55, 33], [45, 33]], '#a8241e', { lw: 4 }); } });

// ---------- the props (Chikin, Nov 1: "we need the kitchen to be interactive") ----------
// Each room lists things he can use, in the room's own (unsqueezed) coordinates:
//   { id, kind: 'switch' | 'knock' | 'hop' | 'bump', x0, x1 (where he reaches it / stands on it), y0, y1 (the tap box; or hit: [x0, y0, x1, y1]),
//     top (a surface he can land on), seat ([x0, x1] to stand on, if narrower), standIf(s, t), bump (walking into it sets it off),
//     lamp (it's the room's light: drives `lit`), startOn, auto (switches itself off after n s), gravity (on = floaty jumps),
//     sfx: { on, off, land, bump, done }, face: { on, off, land, bump, done } ([name, seconds]), after: { on: [[delay, sfx]] },
//     loop: { every, first, sfx, face } (while it's on), hint: [x, y] (where the little sparkle sits when he's next to it) }
// intro.mjs owns the rules (walk into it, hop onto it, E / a tap next to it) and keeps one state per prop:
//   { on, t0 (last switch / knock / bump), land (when he last landed on it), lx (where), n }
// and hands them to the room's painting as P[id], so each room draws its own reaction in its own style.
// They all reset with the glitch to the next look. Nothing here glitches purple: that's his.
export const Z = Object.freeze({ on: false, t0: -99, land: -99, lx: 0, n: 0 });
const ON = Object.freeze({ on: true, t0: -99, land: -99, lx: 0, n: 0 });
const since = (s, t) => t - s.t0, landed = (s, t) => t - s.land;
const fade = (a, d) => a >= 0 && a < d ? 1 - a / d : 0;                                     // 1 -> 0 over d s after it happened
const wob = (a, d = 0.9, f = 16) => a >= 0 && a < d ? Math.sin(a * f) * (1 - a / d) : 0;   // a damped wobble
const ez = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const flip = (s, t, d = 0.3) => ez(s.on ? since(s, t) / d : 1 - since(s, t) / d);      // 0 (off) .. 1 (on), eased over d s
const lampSwing = (P, t) => wob(since(P.lamp || Z, t), 2.4, 4.2) * 0.08;                 // pull the chain: the lamp swings
function smoke(x, cx, cy, t, s = 0, a = 1) {   // a snuffed wick: two grey curls
  x.save(); x.globalAlpha = 0.45 * a; x.strokeStyle = '#b8b2a8'; x.lineWidth = 3;
  for (let i = 0; i < 2; i++) { const ph = (t * 0.6 + i * 0.5 + s * 0.01) % 1; x.beginPath(); for (let k = 0; k <= 8; k++) x.lineTo(cx + Math.sin(k * 0.9 + t * 2 + i * 3) * 5 * (k / 8 + 0.3), cy - ph * 30 - k * 5); x.stroke(); }
  x.restore(); }
function ghostFlame(x, cx, cy, h, t, s = 0) {   // the haunted chandelier's flame: moon-white with an ink edge (never purple)
  if (h < 2) return; const k = 1 + 0.18 * Math.sin(t * 9 + s), H = h * k, w = h * 0.36, sw = Math.sin(t * 6 + s) * w * 0.4;
  x.beginPath(); x.moveTo(cx + sw, cy - H); x.bezierCurveTo(cx + w * 1.3, cy - H * 0.4, cx + w, cy, cx, cy); x.bezierCurveTo(cx - w, cy, cx - w * 1.3, cy - H * 0.4, cx + sw, cy - H); x.closePath();
  x.fillStyle = '#cfe6ff'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); ell(x, cx, cy - H * 0.3, w * 0.45, H * 0.28, '#ffffff', { lw: 0 }); }
function sparkle(x, cx, cy, s, a = 1, col = '#fffbea') {   // a four-point sticker sparkle
  if (s <= 0.5) return; x.save(); x.globalAlpha = a; x.beginPath(); x.moveTo(cx, cy - s); x.quadraticCurveTo(cx, cy, cx + s, cy); x.quadraticCurveTo(cx, cy, cx, cy + s); x.quadraticCurveTo(cx, cy, cx - s, cy); x.quadraticCurveTo(cx, cy, cx, cy - s); x.closePath();
  x.fillStyle = col; x.fill(); x.lineWidth = Math.max(2, Math.min(5, s * 0.22)); x.strokeStyle = INK; x.stroke(); if (s > 10) { x.beginPath(); x.arc(cx, cy, s * 0.13, 0, TAU); x.fillStyle = '#ffffff'; x.fill(); } x.restore(); }
function note(x, cx, cy, col, a = 1, s = 1) {   // a music note (a shape, not text): ink-edged head + stem + flag
  x.save(); x.globalAlpha = a; x.translate(cx, cy); x.scale(s, s); x.rotate(-0.2);
  seg(x, [[7, 0], [7, -30], [18, -22]], 7); seg(x, [[7, 0], [7, -30], [18, -22]], 3, col); ell(x, 0, 0, 10, 7, col, { lw: 4 }); x.restore(); }
function puff(x, cx, cy, k, col = '#f4efe6') {   // a dust cloud as he lands
  if (k <= 0 || k >= 1) return; x.save(); x.globalAlpha = 1 - k * k; const r = 7 + 12 * k;
  for (const pass of [0, 1]) { x.fillStyle = pass ? col : INK; x.beginPath(); for (let j = -1; j <= 1; j++) { const rr = (j ? r * 0.72 : r) + (pass ? 0 : 3); x.moveTo(cx + j * r * 0.9 + rr, cy - r * 0.5); x.arc(cx + j * r * 0.9, cy - r * 0.5 - (j ? 0 : r * 0.2), rr, 0, TAU); } x.fill(); }
  x.restore(); }
function bubbles(x, cx, cy, k, n = 5, seed = 0) {   // underwater, landing kicks up bubbles instead of dust
  if (k <= 0 || k >= 1) return; for (let i = 0; i < n; i++) { const bx = cx + (rnd(i, seed) - 0.5) * 90, by = cy - 10 - k * (40 + rnd(i, seed + 1) * 90), r = 3 + rnd(i, seed + 2) * 6;
    x.beginPath(); x.arc(bx + Math.sin(k * 9 + i) * 5, by, r, 0, TAU); x.fillStyle = 'rgba(200,250,255,.25)'; x.fill(); x.lineWidth = 2; x.strokeStyle = `rgba(230,255,255,${0.8 * (1 - k)})`; x.stroke(); } }
// stand-in for drawing over the "everything's under water" / "night" tint a room bakes into its base
const tint = (c, to, k) => mix(c, to, k);

// ---- 1. the warm kitchen: the lamp, the pot, the fridge, both chairs, the table, the counter
function bareChair(x, cx, d, a = 0, dy = 0) {   // (as PIECES 'chairs' drew it, now it can rock)
  x.save(); x.translate(cx, 750); x.rotate(a); x.translate(-cx, -750 + dy); x.fillStyle = '#7a4c2e'; x.lineWidth = 6; x.strokeStyle = INK;
  x.fillRect(cx - 40, 610, 80, 20); x.strokeRect(cx - 40, 610, 80, 20); x.fillRect(cx + d * 34 - 6, 470, 14, 140); x.strokeRect(cx + d * 34 - 6, 470, 14, 140); x.fillRect(cx - 34, 630, 12, 120); x.fillRect(cx + 22, 630, 12, 120); x.restore(); }
const rock = (s, t) => wob(since(s, t), 0.9, 17) * 0.07, sink = (s, t) => 6 * fade(landed(s, t), 0.25);
function potLid(x, s, t) {
  let lift = 0, rot = 0, dx = 0; const a = since(s, t);
  if (s.on) { const j = Math.floor(t * 28); dx = (rnd(j, 3) - 0.5) * 3; lift = Math.abs(Math.sin(t * 37)) * 4; rot = (rnd(j, 4) - 0.5) * 0.14;   // the boil rattles it
    const pa = (a - 1.1) % 3.2; if (a > 1.1 && pa < 0.75) { const k = pa / 0.75; lift = Math.sin(k * Math.PI) * 130; rot = k * TAU; dx = Math.sin(k * Math.PI) * 26; } }   // ...and every so often it pops right off
  x.save(); x.translate(1065 + dx, 380 - lift); x.rotate(rot); box(x, -40, -9, 80, 11, '#a3a8b2', { r: 5, sh: 'b', f: 0.4, lw: 4 }); box(x, -9, -18, 18, 10, '#5b3c29', { r: 4, sh: 'n', lw: 3 }); x.restore(); }
function fridgeDoor(x, k) {   // the lower door swings open (hinged on the right): the cold light, the shelves, what's in there
  if (k <= 0.002) return; const X0 = 1460, X1 = 1590, Y0 = 330, Y1 = 640;
  x.save(); x.beginPath(); x.roundRect(X0 + 3, Y0 + 3, X1 - X0 - 6, Y1 - Y0 - 6, 10); x.clip();
  x.fillStyle = '#eef6ff'; x.fillRect(X0, Y0, 130, 310); x.fillStyle = '#cdd9e6'; x.fillRect(X1 - 26, Y0, 26, 310);
  for (const y of [430, 512, 584]) box(x, X0, y, 130, 7, '#b5c4d2', { sh: 'n', lw: 3 });
  box(x, 1478, 362, 30, 68, '#fbfaf6', { r: 2, lw: 4 }); poly(x, [[1478, 362], [1493, 346], [1508, 362]], '#fbfaf6', { lw: 4 }); box(x, 1478, 384, 30, 16, '#3c8fd8', { sh: 'n', lw: 3 });   // milk
  box(x, 1520, 392, 34, 38, '#e8463a', { r: 6, lw: 4 }); box(x, 1518, 384, 38, 10, '#f2c230', { r: 3, sh: 'n', lw: 3 });   // jam
  box(x, 1482, 456, 16, 56, '#3c7a3a', { r: 5, lw: 4 }); box(x, 1486, 444, 8, 14, '#3c7a3a', { sh: 'n', lw: 3 });   // a bottle
  poly(x, [[1514, 512], [1572, 512], [1572, 486]], '#f2c84a', { lw: 4 }); circ(x, 1556, 503, 3, '#d8a830', { sh: 'n', lw: 0 });   // cheese
  for (const ex of [1488, 1514, 1540]) ell(x, ex, 574, 11, 9, '#fbf3e2', { lw: 3 });   // eggs
  poly(x, [[1520, 600], [1572, 594], [1574, 606]], '#ff8a2b', { lw: 4 }); seg(x, [[1572, 600], [1584, 592]], 4, '#3c7a3a');   // a carrot
  x.restore();
  glow(x, 1525, 480, 230, '#e8f4ff', 0.38 * k);
  x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(210,232,255,${0.14 * k})`; x.beginPath(); x.moveTo(1460, 644); x.lineTo(1590, 644); x.lineTo(1600, 900); x.lineTo(1230, 900); x.closePath(); x.fill(); x.restore();
  const w = 130 * (1 - k); if (w > 3) { box(x, X1 - w, Y0, w, Y1 - Y0, '#d9dde3', { r: 8, sh: 'l', f: 0.35, lw: 6 }); if (w > 30) box(x, X1 - w + 12, 360, 10, 70, '#9aa1ad', { sh: 'n', lw: 3 }); }
  else box(x, X1 - 4, Y0 - 2, 12, Y1 - Y0 + 2, '#c3c9d1', { sh: 'n', lw: 5 }); }
{ const st = S.find(s => s.id === 'bare');
  st.dark = 0.34; st.props = [
    { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 700, x1: 840, y0: 300, y1: 430, hint: [770, 296], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'pot', kind: 'switch', x0: 1000, x1: 1200, y0: 350, y1: 470, hint: [1065, 330], sfx: { on: 'burner', off: 'flick' }, after: { on: [[0.45, 'rattle']] }, loop: { every: 3.2, first: 1.1, sfx: 'lidPop', face: ['startled', 0.9] } },
    { id: 'fridge', kind: 'switch', x0: 1450, x1: 1600, y0: 160, y1: 640, hint: [1525, 136], sfx: { on: 'fridgeOpen', off: 'fridgeShut' }, face: { on: ['question', 1.1] } },
    { id: 'chairL', kind: 'hop', bump: true, x0: 480, x1: 560, top: 610, y0: 460, y1: 760, sfx: { land: 'creak', bump: 'scoot' } },
    { id: 'chairR', kind: 'hop', bump: true, x0: 980, x1: 1060, top: 610, y0: 460, y1: 760, sfx: { land: 'creak', bump: 'scoot' } },
    { id: 'table', kind: 'hop', x0: 560, x1: 980, top: 560, y0: 540, y1: 770, sfx: { land: 'clatter' } },
    { id: 'counter', kind: 'hop', x0: 820, x1: 1450, top: 450, y0: 440, y1: 640, sfx: { land: 'thunk' }, zones: [{ id: 'pot', x0: 1000, x1: 1200, act: 'hot' }] } ];   // (lit burners: he hops off them)
  st.under = (x, t, lit, P) => { const pot = P.pot || Z, cl = P.chairL || Z, cr = P.chairR || Z, tb = P.table || Z;
    bareChair(x, 520, -1, rock(cl, t), sink(cl, t)); bareChair(x, 1020, 1, rock(cr, t), sink(cr, t));
    const pj = landed(tb, t), py = pj >= 0 && pj < 0.6 ? -Math.abs(Math.sin(pj * 14)) * 16 * (1 - pj / 0.6) : 0;   // he lands on the table: the plate jumps
    ell(x, 700, 556 + py, 40, 9, '#f2ead8', { lw: 4 });
    if (pot.on) { glow(x, 1100, 440, 70, '#ff8a3d', 0.35); for (const bx of [1050, 1150]) flame(x, bx, 450, 20, t, bx, 14); }
    potLid(x, pot, t);
    x.save(); x.translate(770, 0); x.rotate(lampSwing(P, t)); x.translate(-770, 0);   // the lamp (as PIECES drew it) + its pull chain
    x.strokeStyle = '#1a1210'; x.lineWidth = 5; x.beginPath(); x.moveTo(770, 0); x.lineTo(770, 330); x.stroke();
    x.fillStyle = '#3c6b4a'; x.beginPath(); x.moveTo(720, 380); x.lineTo(820, 380); x.lineTo(795, 330); x.lineTo(745, 330); x.closePath(); x.fill(); x.save(); x.clip(); x.fillStyle = '#2f5a3c'; x.fillRect(800, 320, 30, 70); x.restore(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    if (lit < 0.5) ell(x, 770, 382, 24, 7, '#6a5a44', { lw: 3 });
    seg(x, [[806, 362], [810, 412]], 3, '#2a2016'); circ(x, 810, 416, 5, '#d9b27a', { sh: 'n', lw: 2.5 }); x.restore();
    fridgeDoor(x, flip(P.fridge || Z, t, 0.28)); };
}

// ---- 2. the disco: the mirrorball (party mode), the jukebox, the speakers, the stools, the table, the bar; and the floor tile under him
{ const st = S.find(s => s.id === 'disco-legend');
  st.props = [
    { id: 'ball', kind: 'switch', x0: 690, x1: 850, y0: 330, y1: 480, hint: [850, 372], sfx: { on: 'partyOn', off: 'partyOff' }, face: { on: ['smirk', 1.2] } },
    { id: 'juke', kind: 'switch', x0: 160, x1: 440, y0: 270, y1: 650, hint: [300, 258], sfx: { on: 'juke', off: 'flick' } },
    { id: 'speaker', kind: 'bump', x0: 1455, x1: 1595, y0: 200, y1: 650, hint: [1525, 188], sfx: { bump: 'boom' } },
    { id: 'stoolL', kind: 'hop', x0: 910, x1: 1010, top: 542, y0: 530, y1: 740, sfx: { land: 'squeak' } },
    { id: 'stoolR', kind: 'hop', x0: 1200, x1: 1300, top: 542, y0: 530, y1: 740, sfx: { land: 'squeak' } },
    { id: 'table', kind: 'hop', x0: 600, x1: 940, top: 562, y0: 540, y1: 750, sfx: { land: 'clink' } },
    { id: 'bar', kind: 'hop', x0: 860, x1: 1450, top: 452, y0: 440, y1: 640, sfx: { land: 'thunk' } } ];   // (x0: not under the mirrorball)
  st.under = (x, t, lit, P) => { const pa = flip(P.ball || Z, t, 0.4); if (pa > 0) { x.fillStyle = `rgba(6,5,12,${0.26 * pa})`; x.fillRect(-2400, 0, 6400, 900); } };   // party: the room drops a little darker so the light show reads
  st.over = (x, t, lit, P, me) => {
    const jk = flip(P.juke || Z, t, 0.4);   // the jukebox playing: notes float up out of it
    if (jk > 0) for (let i = 0; i < 6; i++) { const ph = (t * 0.42 + i / 6) % 1, nx = 300 + (i - 2.5) * 34 + Math.sin(ph * 7 + i) * 26, ny = 300 - ph * 260; note(x, nx, ny, DISCO[i % 5], Math.sin(ph * Math.PI) * jk, 1.3 + 0.4 * rnd(i, 4)); }
    const ba = since(P.speaker || Z, t);   // the speakers: a shock ring off each cone
    if (ba >= 0 && ba < 0.7) for (const y of [350, 570]) for (let k = 0; k < 3; k++) { const r = 50 + ba * 320 - k * 40; if (r < 50) continue; x.save(); x.globalAlpha = 1 - ba / 0.7;
      x.beginPath(); x.arc(1525, y, r, Math.PI * 0.55, Math.PI * 1.45); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 4; x.strokeStyle = DISCO[(k + 1) % 5]; x.stroke(); x.restore(); }
    for (const [id, sx] of DSTOOLS) {   // the stools spin when he lands on them (and turn slowly while he's up there)
      const s = P[id] || Z, a = Math.min(Math.max(0, landed(s, t)), 1.4), ph = 9 * a - 9 * a * a / 2.8 + (me && me.on === id ? t * 2.2 : 0);
      x.save(); x.beginPath(); x.ellipse(sx, 552, 47, 13, 0, 0, TAU); x.clip(); for (let k = 0; k < 2; k++) { const u = Math.sin(ph + k * Math.PI); if (Math.cos(ph + k * Math.PI) < 0) continue; x.fillStyle = k ? 'rgba(255,255,255,.55)' : 'rgba(18,10,5,.28)'; x.fillRect(sx + u * 40 - 7, 536, 14, 32); } x.restore(); } };
}

const DSTOOLS = [['stoolL', 960], ['stoolR', 1250]], CSTOOLS = [['stoolL', 500], ['stoolR', 1040]];
// ---- 9. the kitchen of tomorrow: the saucer lamp (beam), the TV, the meal dispenser, the tube, both stools, the table, the counter
function pellet(x, cx, cy, a) { x.save(); x.translate(cx, cy); x.rotate(a); x.scale(OVAL(), 1); box(x, -11, -7, 22, 14, RF.coral, { r: 7, sh: 'b', f: 0.4, lw: 3.5 }); x.fillStyle = RF.cream; x.fillRect(-1.5, -6, 3, 12); x.restore(); }
function dinner(x, cx, by, s, t) {   // the pellet's whole dinner, popped out on the plate: mash, peas, a drumstick, steam
  if (s <= 0.02) return; x.save(); x.translate(cx, by); x.scale(s * OVAL(), s);
  x.beginPath(); x.ellipse(-9, -2, 14, 11, 0, Math.PI, 0); x.closePath(); x.fillStyle = '#fff8e6'; x.fill(); stroke(x, { lw: 3 }); ell(x, -9, -11, 4, 2.5, '#f4c04a', { lw: 0 });
  for (const [a, b] of [[-22, -3], [-25, 1], [-19, 1]]) ell(x, a, b, 3.2, 3.2, '#6cc04a', { lw: 2 });
  x.save(); x.translate(12, -6); x.rotate(-0.5); ell(x, 0, 0, 11, 7.5, '#b8642a', { lw: 3 }); box(x, 9, -2, 10, 4, '#fff8e6', { r: 2, sh: 'n', lw: 2.5 }); ell(x, 20, -2.5, 3, 3, '#fff8e6', { lw: 2.5 }); ell(x, 20, 2, 3, 3, '#fff8e6', { lw: 2.5 }); x.restore();
  x.restore(); if (s > 0.8) steam(x, cx, by - 12, t, 2, 60, 0.4, 5); }
{ const st = S.find(s => s.id === 'tin-robot');
  st.props = [
    { id: 'saucer', kind: 'switch', auto: 3.6, x0: 680, x1: 860, y0: 300, y1: 400, hint: [770, 292], sfx: { on: 'beamUp', done: 'beamDown' }, face: { on: ['wide', 1.0] } },
    { id: 'tv', kind: 'switch', x0: 850, x1: 1012, hit: [846, 212, 1014, 352], y0: 212, y1: 352, hint: [930, 204], sfx: { on: 'tvOn', off: 'tvOff' }, face: { on: ['smirk', 1.0] } },
    { id: 'disp', kind: 'switch', auto: 4.4, x0: 1036, x1: 1164, y0: 296, y1: 446, hint: [1100, 286], sfx: { on: 'dispense' }, after: { on: [[0.45, 'pelletPop'], [1.2, 'poof']] }, face: { on: ['question', 1.0] } },
    { id: 'tube', kind: 'switch', auto: 1.5, busy: 1.6, x0: 1180, x1: 1420, hit: [1180, 90, 1420, 200], y0: 90, y1: 200, hint: [1300, 112], sfx: { on: 'tubeWhoosh' }, after: { on: [[0.85, 'clunk']] } },
    { id: 'stoolL', kind: 'hop', bump: true, x0: 456, x1: 544, top: 606, y0: 590, y1: 760, sfx: { land: 'squeak', bump: 'scoot' } },
    { id: 'stoolR', kind: 'hop', bump: true, x0: 996, x1: 1084, top: 606, y0: 590, y1: 760, sfx: { land: 'squeak', bump: 'scoot' } },
    { id: 'table', kind: 'hop', x0: 560, x1: 980, top: 556, y0: 536, y1: 760, sfx: { land: 'clink' } },
    { id: 'counter', kind: 'hop', seat: [790, 1026], x0: 790, x1: 1450, top: 448, y0: 440, y1: 640, sfx: { land: 'thunk' } } ];
  let ph = 0, pt = -1;   // (the saucer's lights chase round: their own clock, so spinning up doesn't jump)
  st.under = (x, t, lit, P) => { const q = OVAL();
    for (const [id, sx] of [['stoolL', 500], ['stoolR', 1040]]) { const s = P[id] || Z;   // tulip stools: a coral cushion on a cream shell, one chrome stem
      x.save(); x.translate(sx, 712); x.rotate(rock(s, t)); x.translate(-sx, -712 + sink(s, t));
      ell(x, sx, 710, 40, 9, RF.cream, { lw: 5 }); poly(x, [[sx - 7, 622], [sx + 7, 622], [sx + 5, 706], [sx - 5, 706]], RF.chrome, { lw: 4 });
      ell(x, sx, 618, 42, 14, RF.cream, { lw: 5 }); ell(x, sx, 608, 44, 12, RF.coral, { lw: 5 }); x.restore(); }
    const so = P.saucer || Z, k = flip(so, t, 0.6), lift = k * (24 + 7 * Math.sin(t * 3));   // in the beam the rocket shakers float up and turn
    rocket(x, 846, 556 - lift, RF.cream, Math.sin(t * 2.3) * 0.25 * k); rocket(x, 874, 556 - lift * 1.25, RF.teal, -Math.sin(t * 2.1 + 1) * 0.25 * k);
    const ds = P.disp || Z, da = since(ds, t), push = ds.on && da < 0.3 ? Math.sin(da / 0.3 * Math.PI) : 0;   // the big button goes in
    ell(x, 1100, 397, 20 * q, 19, '#7a1a14', { lw: 5 }); ell(x, 1100, 393 + push * 4, (17 - push * 2) * q, 16 - push * 2, RF.red, { lw: 4 }); ell(x, 1094, 388 + push * 4, 6 * q, 3.5, 'rgba(255,255,255,.6)', { lw: 0 });
    const dt = pt < 0 ? 0 : Math.max(0, Math.min(0.1, t - pt)); pt = t; ph += dt * (0.7 + 9 * k);
    seg(x, [[770, 0], [770, 328]], 5, '#3a3f46'); box(x, 762, 318, 16, 12, RF.steel, { r: 3, sh: 'n', lw: 3 });
    x.beginPath(); x.ellipse(770, 338, 32 * q, 26, 0, Math.PI, 0); x.closePath(); x.fillStyle = RF.glass; x.fill(); stroke(x, { lw: 5 }); ell(x, 758, 326, 8 * q, 5, 'rgba(255,255,255,.8)', { lw: 0, rot: -0.4 });   // the dome
    x.beginPath(); x.ellipse(770, 352, 116, 22, 0, 0, TAU); x.fillStyle = RF.chrome; x.fill(); x.save(); x.clip(); x.fillStyle = RF.steel; x.fillRect(650, 356, 240, 30); x.restore(); stroke(x, { lw: 6 });   // the saucer
    x.beginPath(); x.ellipse(770, 347, 78, 9, 0, 0, Math.PI); x.lineWidth = 5; x.strokeStyle = RF.coral; x.stroke();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + ph, s = Math.sin(a); if (s < 0) continue; const z = 0.55 + 0.45 * s;
      ell(x, 770 + Math.cos(a) * 104, 357 + s * 9, 6.5 * z, 5 * z, lit > 0.5 ? (i % 2 ? RF.mustard : '#fff2c8') : '#7d838c', { lw: 2.5 }); } };
  st.over = (x, t, lit, P) => { const s = P.disp || Z, a = since(s, t);   // the pellet pops out of the chute onto the plate... and becomes a whole dinner
    if (s.on) {
      if (a >= 0.45 && a < 1.0) { const u = (a - 0.45) / 0.55; pellet(x, 1100 + 100 * u, 430 - Math.sin(u * Math.PI) * 90 + u * 2, u * 9); }
      else if (a >= 1.0 && a < 1.25) pellet(x, 1200, 432 - Math.sin((a - 1) / 0.25 * Math.PI) * 12, 0);
      if (a >= 1.2) { const k = Math.min(1, (a - 1.2) / 0.3); dinner(x, 1200, 442, ez(k) * (1 + 0.18 * Math.sin(k * Math.PI)), t); if (a < 1.65) { puff(x, 1176, 438, (a - 1.2) / 0.45); puff(x, 1224, 438, (a - 1.2) / 0.45); } } }
    else if (a >= 0 && a < 0.45) { dinner(x, 1200, 442, 1 - ez(a / 0.25), t); puff(x, 1200, 436, a / 0.45); } };
}

// ---- 4. the castle: the cauldron, both torches, the round shield, the trestle table, the stool
function roundShield(x, cx, cy, sy = 1) {   // (as the wall drew it; sy squashes it flat for the coin wobble on the floor)
  x.save(); x.translate(cx, cy); x.scale(1, Math.max(0.05, sy)); circ(x, 0, 0, 50, '#2a4b8a', { lw: 6 / Math.max(0.4, sy) }); for (let i = 0; i < 10; i++) circ(x, Math.cos(i / 10 * TAU) * 40, Math.sin(i / 10 * TAU) * 40, 3.5, '#c9ced6', { sh: 'n', lw: 2 }); circ(x, 0, 0, 14, '#c9ced6', { lw: 4 }); x.restore(); }
{ const st = S.find(s => s.id === 'castle-knight');
  st.dark = 0.34; st.props = [   // (the torches are the room's light: snuff both and it goes dark)
    { id: 'cauldron', kind: 'switch', x0: 990, x1: 1130, y0: 470, y1: 600, hint: [1060, 462], sfx: { on: 'bubble', off: 'hiss' }, loop: { every: 1.4, first: 1.4, sfx: 'bubble' }, face: { on: ['wide', 0.9] } },
    { id: 'torchL', kind: 'switch', lamp: true, startOn: true, x0: 70, x1: 150, y0: 320, y1: 490, hint: [140, 330], sfx: { on: 'flare', off: 'snuff' } },
    { id: 'torchR', kind: 'switch', lamp: true, startOn: true, x0: 1285, x1: 1365, y0: 320, y1: 490, hint: [1356, 330], sfx: { on: 'flare', off: 'snuff' } },
    { id: 'shield', kind: 'knock', busy: 2.6, x0: 1460, x1: 1595, hit: [1490, 500, 1600, 620], y0: 500, y1: 620, hint: [1545, 494], sfx: { on: 'clang', off: 'thunk' }, face: { on: ['startled', 0.8] } },
    { id: 'table', kind: 'hop', x0: 552, x1: 988, top: 548, y0: 500, y1: 760, sfx: { land: 'thunk' } },
    { id: 'stool', kind: 'hop', bump: true, x0: 996, x1: 1084, top: 634, y0: 620, y1: 750, sfx: { land: 'creak', bump: 'scoot' } } ];
  st.under = (x, t, lit, P) => { const s = P.stool || Z, a = rock(s, t) * 1.6, dy = sink(s, t);
    x.save(); x.translate(1040, 740); x.rotate(a); x.translate(-1040, -740 + dy); ell(x, 1040, 640, 44, 10, '#8a5a36', { lw: 5 }); for (const d of [-30, 0, 30]) seg(x, [[1040 + d * 0.8, 648], [1040 + d, 740]], 8); x.restore();
    const sh = P.shield || Z, k = since(sh, t);
    if (!sh.on) { if (k < 0.3) { const u = ez(k / 0.3); roundShield(x, 1545, 772 - 212 * u, 0.22 + 0.78 * u); } else roundShield(x, 1545, 560); }   // back up on the wall
    else if (k < 0.3) roundShield(x, 1545, 560 + (k / 0.3) ** 2 * 190, 1 - 0.3 * (k / 0.3));   // off the wall...
    else { const b = k < 0.55 ? Math.sin((k - 0.3) / 0.25 * Math.PI) * 34 : 0, u = Math.min(1, Math.max(0, (k - 0.55) / 1.7)), w = k < 0.55 ? 1 : Math.abs(Math.cos((k - 0.55) * (7 + 18 * u))) * (1 - u);   // ...it bounces once, then rings round and round like a coin
      ell(x, 1545, 780, 60, 10, 'rgba(0,0,0,.35)', { lw: 0 }); roundShield(x, 1545, 768 - b - 10 * w, 0.2 + 0.8 * w); const pk = (k - 0.3) / 0.6; puff(x, 1478 - pk * 30, 776, pk, '#b8b2a8'); puff(x, 1612 + pk * 30, 776, pk, '#b8b2a8'); } };
}

// ---- 5. the galley: the stowage hatch, the gravity panel, a food pouch, the lamp, the table, the counter
function hatch(x, s, t) {
  const a = since(s, t), spin = s.on ? Math.min(a, 0.7) * 9 : Math.max(0, 0.7 - a) * 9, k = s.on ? ez((a - 0.55) / 0.3) : ez(1 - a / 0.25);
  const beacon = s.on || a < 0.6; box(x, 1508, 150, 34, 22, beacon && Math.floor(t * 6) % 2 ? '#ffb020' : '#7a5a2a', { r: 8, sh: 'n', lw: 4 }); if (beacon && Math.floor(t * 6) % 2) glow(x, 1525, 160, 60, '#ffb020', 0.5);   // the warning light
  if (k > 0.002) {   // open: straps, pouches, and one drifting out (nothing stays put)
    x.save(); x.beginPath(); x.roundRect(1470, 316, 110, 316, 10); x.clip(); x.fillStyle = '#1d2533'; x.fillRect(1470, 316, 110, 316); x.fillStyle = '#151b26'; x.fillRect(1556, 316, 24, 316);
    for (const y of [380, 480, 580]) box(x, 1470, y, 110, 8, '#f2c230', { sh: 'n', lw: 3 });
    for (const [px, py, c] of [[1486, 342, '#ff7a2b'], [1530, 346, '#5cbf4a'], [1490, 440, '#3c8fd8'], [1534, 436, '#e8463a'], [1500, 540, '#f2c230']]) box(x, px, py, 26, 36, c, { r: 5, lw: 3 });
    x.restore(); glow(x, 1525, 470, 150, '#bfe6ff', 0.3 * k);
    const w = 110 * (1 - k); if (w > 3) box(x, 1470, 316, w, 316, '#b9c0c8', { r: 10, sh: 'r', f: 0.2, lw: 5 });
    if (s.on && a > 0.8) { const u = (a - 0.8) * 0.22 % 1, fx = 1500 - u * 420 + Math.sin(u * 9) * 30, fy = 470 - u * 260 + Math.sin(u * 13) * 20; x.save(); x.translate(fx, fy); x.rotate(u * 9); box(x, -13, -18, 26, 36, '#ff7a2b', { r: 5, lw: 3 }); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(-8, -4, 16, 6); x.restore(); } }
  if (k < 0.5) { x.save(); x.translate(1525, 440); x.rotate(spin); circ(x, 0, 0, 36, '#8f9aa8', { lw: 5 }); for (let q = 0; q < 4; q++) seg(x, [[0, 0], [Math.cos(q * Math.PI / 2 + 0.4) * 32, Math.sin(q * Math.PI / 2 + 0.4) * 32]], 5); circ(x, 0, 0, 9, '#c3cad2', { lw: 3 }); x.restore(); }   // the wheel spins first
  if (s.on && a > 0.4 && a < 1.3) for (let i = 0; i < 4; i++) puff(x, 1462 + (i % 2) * 126, 330 + i * 80, (a - 0.4 - i * 0.05) / 0.9, '#e8f2ff'); }   // the seal hisses
{ const st = S.find(s => s.id === 'orbital-astronaut');
  st.dark = 0.3; st.props = [
    { id: 'hatch', kind: 'switch', busy: 1.6, x0: 1455, x1: 1600, y0: 300, y1: 640, hint: [1490, 140], sfx: { on: 'hiss', off: 'clunk' } },
    { id: 'gravity', kind: 'switch', gravity: true, x0: 1030, x1: 1160, y0: 520, y1: 600, hint: [1094, 512], sfx: { on: 'gravOff', off: 'gravOn' }, face: { on: ['wide', 1.0] } },
    { id: 'pouch', kind: 'knock', x0: 880, x1: 940, y0: 540, y1: 620, hint: [910, 532], sfx: { on: 'pop', off: 'clunk' } },
    { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 700, x1: 840, y0: 320, y1: 380, hint: [770, 316], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'table', kind: 'hop', x0: 590, x1: 950, top: 554, y0: 530, y1: 740, sfx: { land: 'clunk' } },
    { id: 'counter', kind: 'hop', x0: 820, x1: 1450, top: 452, y0: 440, y1: 640, sfx: { land: 'clunk' } } ];
  st.under = (x, t, lit, P) => { hatch(x, P.hatch || Z, t);
    const g = flip(P.gravity || Z, t, 0.4);   // the panel: the graph goes flat, the readout says so (world text: a screen)
    if (g > 0) { box(x, 1044, 530, 100, 60, '#0e1a22', { r: 8, sh: 'n', lw: 4 }); seg(x, [[1052, 572], [1136, 572]], 3, '#ffb020'); x.save(); x.globalAlpha = g * (0.7 + 0.3 * Math.sin(t * 5)); x.font = '700 26px "JetBrains Mono", ui-monospace, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffb020'; x.fillText('0 G', 1094, 552); x.restore(); }   // (pulses, never gone)
    const pu = P.pouch || Z, k = flip(pu, t, 0.45);   // the pouch: out of its slot and away
    if (k > 0) { box(x, 895, 548, 30, 70, '#6b7380', { r: 4, sh: 'n', lw: 0 }); const fx = 910 + (Math.sin(t * 0.5) * 120 + 30) * k, fy = 572 - (190 + Math.sin(t * 0.8) * 40) * k;
      x.save(); x.translate(fx, fy); x.rotate(k * t * 0.9); box(x, -12, -20, 24, 40, '#e8463a', { r: 5, lw: 3 }); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(-8, -6, 16, 6); x.restore(); } };
}

// ---- 3. the fact factory: the cage lamp, the belt (its lever), the stamp press, the hard hats, the locker, the spool table, the counter
function ffLocker(x, k) {   // the locker's lower door swings open (hinged on the right): a warm light, shelves of made-up things
  const X0 = 1460, X1 = 1590, Y0 = 400, Y1 = 640;
  if (k > 0.002) {
    x.save(); x.beginPath(); x.roundRect(X0 + 3, Y0 + 3, X1 - X0 - 6, Y1 - Y0 - 6, 8); x.clip();
    x.fillStyle = '#3a3530'; x.fillRect(X0, Y0, 130, 240); x.fillStyle = '#2b2622'; x.fillRect(X1 - 24, Y0, 24, 240);
    for (const y of [480, 562]) box(x, X0, y, 130, 7, '#8a929c', { sh: 'n', lw: 3 });
    box(x, 1474, 430, 34, 48, '#d8e8ee', { r: 6, lw: 3.5 }); box(x, 1472, 424, 38, 10, FF.red, { r: 3, sh: 'n', lw: 3 }); ffText(x, 'VIBES', 1491, 458, 8, INK);   // a jar of vibes
    poly(x, [[1524, 478], [1554, 478], [1550, 466], [1546, 448], [1532, 448], [1528, 466]], '#f2c230', { lw: 3.5 }); box(x, 1530, 438, 18, 12, '#f2c230', { r: 3, lw: 3 }); ffText(x, '#1', 1539, 462, 9, INK);   // a trophy for being sure
    box(x, 1472, 520, 52, 42, FF.crate, { r: 3, lw: 3.5 }); ffText(x, 'STEW', 1498, 541, 9, INK);   // a box of the stew
    box(x, 1534, 528, 22, 34, '#c3cad2', { r: 4, lw: 3 }); ffText(x, '?', 1545, 545, 14, INK);   // a tin of ?
    for (let i = 0; i < 3; i++) box(x, 1478 + i * 10, 584 - i * 4, 70, 12, '#e8e0c8', { r: 6, lw: 3 });   // rolled-up blueprints
    x.restore();
    glow(x, 1525, 500, 170, '#ffcf8a', 0.32 * k); }
  const w = 130 * (1 - k); if (w > 3) { box(x, X1 - w, Y0, w, Y1 - Y0, FF.lock, { r: 8, sh: 'l', f: 0.3, lw: 6 });
    if (w > 40) { for (let q = 0; q < 5; q++) box(x, X1 - w + w * 0.22, 420 + q * 12, w * 0.56, 5, '#6f7781', { r: 2, sh: 'n', lw: 2 }); box(x, X1 - w + 14, 500, 10, 56, '#5b636e', { r: 4, sh: 'n', lw: 3 }); } }
  else box(x, X1 - 4, Y0 - 2, 12, Y1 - Y0 + 2, '#8a929c', { sh: 'n', lw: 5 }); }
{ const st = S.find(s => s.id === 'construction-crew');
  st.dark = 0.3; st.props = [
    { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 700, x1: 840, y0: 300, y1: 430, hint: [770, 296], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'press', kind: 'knock', busy: 1.2, x0: 1000, x1: 1180, y0: 300, y1: 450, hint: [1090, 288], sfx: { on: 'thunk', off: 'thunk' }, after: { on: [[0.22, 'hiss']], off: [[0.22, 'hiss']] }, face: { on: ['smirk', 1.0], off: ['thinking', 1.0] } },
    { id: 'belt', kind: 'switch', x0: 1330, x1: 1450, y0: 380, y1: 470, hint: [1404, 368], sfx: { on: 'clunk', off: 'flick' }, after: { on: [[0.3, 'roll']] } },
    { id: 'hats', kind: 'knock', busy: 2, x0: 1460, x1: 1520, hit: [1466, 250, 1590, 400], y0: 250, y1: 400, hint: [1525, 246], sfx: { on: 'clang', off: 'clang' }, face: { on: ['startled', 0.8] } },
    { id: 'locker', kind: 'switch', x0: 1530, x1: 1600, hit: [1460, 400, 1590, 640], y0: 400, y1: 640, hint: [1525, 410], sfx: { on: 'fridgeOpen', off: 'fridgeShut' }, face: { on: ['question', 1.1] } },
    { id: 'spool', kind: 'hop', x0: 590, x1: 950, top: 556, y0: 540, y1: 760, sfx: { land: 'thud' } },
    { id: 'counter', kind: 'hop', x0: 820, x1: 1450, top: 450, y0: 440, y1: 640, sfx: { land: 'thunk' } } ];
  let ph = 0, pt = -1, stampT0 = -99; const stamps = new Map();   // (the belt's own clock, so it starts + stops without a jump; which crate got which stamp)
  st.under = (x, t, lit, P) => {
    const sp = P.spool || Z;   // the cable-spool table (it rocks a little when he lands on it)
    x.save(); x.translate(770, 750); x.rotate(rock(sp, t) * 0.6); x.translate(-770, -750 + sink(sp, t) * 0.6);
    box(x, 604, 722, 332, 28, FF.wood, { r: 8, sh: 'b', f: 0.3, lw: 5 });
    box(x, 704, 572, 132, 152, '#7a4c2e', { lw: 5, f: 0.2 }); x.save(); x.beginPath(); x.rect(704, 572, 132, 152); x.clip();
    for (let y = 578; y < 724; y += 13) { seg(x, [[700, y], [840, y + 4]], 11); seg(x, [[700, y], [840, y + 4]], 6, y % 26 < 13 ? '#e2762a' : '#3a3530'); } x.restore();   // the cable wound round it
    box(x, 590, 552, 360, 26, FF.wood, { r: 10, sh: 'b', f: 0.35, lw: 6 }); ell(x, 770, 553, 176, 9, lt(FF.wood, 0.14), { lw: 0 });
    for (const bx of [640, 900]) circ(x, bx, 565, 4, '#6a4228', { sh: 'n', lw: 2 }); x.restore();
    // the belt: crates rise through the counter at the left, ride under the press, and go into the wall
    const bs = P.belt || Z, bk = flip(bs, t, 0.5), dt = pt < 0 ? 0 : Math.max(0, Math.min(0.1, t - pt)); pt = t; ph += dt * bk;
    const pr = P.press || Z, pa = since(pr, t);
    if (pr.t0 !== stampT0 && pa >= 0.1) { stampT0 = pr.t0; let best = 1e9, bid = null; for (let j = 0; j < 3; j++) { const u = ph * 110 + j * 140 + 28, X = 880 + (u % 420), id = j + 3 * Math.floor(u / 420); if (Math.abs(X + 42 - 1090) < best) { best = Math.abs(X + 42 - 1090); bid = id; } }
      if (best < 60) stamps.set(bid, pr.on ? 'CONFIRMED' : 'UNVERIFIED'); if (stamps.size > 12) stamps.delete(stamps.keys().next().value); }
    const tread = ph * 110; x.save(); x.beginPath(); x.rect(868, 426, 432, 8); x.clip(); for (let q = -20; q < 452; q += 14) seg(x, [[868 + ((q + tread) % 448), 427], [868 + ((q + tread) % 448), 433]], 3, '#6f7781'); x.restore();
    x.save(); x.beginPath(); x.rect(860, 300, 420, 129); x.clip();
    for (let j = 0; j < 3; j++) { const u = ph * 110 + j * 140 + 28, X = 880 + (u % 420), id = j + 3 * Math.floor(u / 420), rise = Math.max(0, 1 - (X - 880) / 34), Y = 384 + ez(rise) * 46;
      ffCrate(x, X, Y, 84, 44, null, { col: id % 2 ? FF.crate : '#b87a3e' });
      const sm = stamps.get(id); if (sm) { const c = sm === 'CONFIRMED' ? FF.green : FF.red; x.save(); x.translate(X + 42, Y + 22); x.rotate(-0.12); x.beginPath(); x.rect(-50 * unsq(x), -11, 100 * unsq(x), 22); x.fillStyle = '#f2e6c8'; x.fill(); x.lineWidth = 3; x.strokeStyle = c; x.stroke(); x.restore(); ffText(x, sm, X + 42, Y + 22, 13, c, { rot: -0.12, w: 800 }); }
      else ffText(x, '?', X + 42, Y + 23, 20, 'rgba(18,10,5,.45)'); }
    x.restore();
    for (let k = 0; k < 6; k++) { const fx = 1280 + k * 14, sw = bk > 0.5 ? Math.sin(t * 7 + k) * 3 : 0; box(x, fx + sw, 346, 12, 84, '#3a3530', { r: 2, sh: 'n', lw: 2.5 }); }   // the hatch's rubber flaps
    // the stamp press: its head bobs and hisses; knocked, it slams down on the crate under it
    const hit = pa >= 0 && pa < 0.7 ? (pa < 0.1 ? ez(pa / 0.1) : pa < 0.3 ? 1 : 1 - ez((pa - 0.3) / 0.4)) : 0, idle = 3 + 3 * Math.sin(t * 2.4), dy = 24 * hit + idle * (1 - hit);
    box(x, 996, 278, 188, 30, FF.orange, { r: 4, sh: 'b', f: 0.35, lw: 5 }); ffText(x, 'FACT CHECK', 1090, 293, 13, INK, { w: 800 });
    box(x, 1080, 306, 20, 12 + dy, '#c3cad2', { sh: 'r', f: 0.35, lw: 4 });
    box(x, 1046, 316 + dy, 88, 36, FF.yellow, { r: 4, sh: 'b', f: 0.3, lw: 5 }); box(x, 1056, 351 + dy, 68, 9, '#3a3f46', { r: 2, sh: 'n', lw: 3 });
    if (pa >= 0.05 && pa < 0.9) { puff(x, 1040, 372, (pa - 0.05) / 0.85, '#eef2f6'); puff(x, 1140, 372, (pa - 0.1) / 0.8, '#eef2f6'); }
    else { const hp = (t % 4.2) / 0.9; if (hp < 1) puff(x, 1112, 304, hp, '#eef2f6'); }   // a little hiss now and then
    // the belt's lever (forward = on)
    const la = -0.55 + 1.1 * bk; x.save(); x.translate(1404, 444); x.rotate(la); box(x, -5, -58, 10, 58, '#c3cad2', { r: 4, sh: 'r', f: 0.4, lw: 4 }); circ(x, 0, -60, 11, bs.on ? FF.green : FF.red, { lw: 4 }); x.restore(); circ(x, 1404, 444, 8, '#5b636e', { sh: 'n', lw: 3 });
    // the board: DAYS WITHOUT A FACT, and the digit that flips up to 1 now and then and snaps right back to 0
    const cy = (t + 2) % 7.5, up = cy < 0.25 ? ez(cy / 0.25) : cy < 1.3 ? 1 : cy < 1.42 ? 1 - (cy - 1.3) / 0.12 : 0, sq = Math.abs(Math.cos(up * Math.PI)), dig = up > 0.5 ? '1' : '0', shake = cy > 1.42 && cy < 1.8 ? Math.sin(cy * 60) * 2 * (1.8 - cy) / 0.38 : 0;
    if (ffArt('sign_days')) {   // Chat's painted sign over the counter; the flip card sits on its printed 0. The locker's board gets the fact checker's REJECTED notice.
      ffPic(x, 'sign_days', 1080, 182, 400, 100); ffPic(x, 'sign_quality', 440, 298, 260, 60);
      const dx = 1080 + 0.441 * 400 * unsq(x) + shake, dy = 182; box(x, dx - 13 * unsq(x), dy - 24 * sq, 26 * unsq(x), 48 * sq, '#f2c230', { r: 3, sh: 'n', lw: 3 }); if (sq > 0.2) { x.save(); x.translate(dx, dy); x.scale(1, sq); ffText(x, dig, 0, 1, 30, dig === '1' ? FF.green : INK, { w: 800 }); x.restore(); }
      if (!ffPic(x, 'stamp_rejected', 1525, 213, 84, 60, -0.18)) ffText(x, '?', 1525, 213, 30, FF.red, { w: 800 }); }
    else { ffText(x, 'DAYS', 1503, 190, 10, INK, { w: 800 }); ffText(x, 'WITHOUT', 1503, 206, 10, INK, { w: 800 }); ffText(x, 'A FACT:', 1503, 222, 10, INK, { w: 800 });
    box(x, 1540, 212 - 22 * sq + shake, 32, 44 * sq, '#ffffff', { r: 3, sh: 'n', lw: 3 }); if (sq > 0.2) { x.save(); x.translate(1556 + shake, 212); x.scale(1, sq); ffText(x, dig, 0, 0, 28, dig === '1' ? FF.green : FF.red, { w: 800 }); x.restore(); } }
    for (const [mx, mc] of [[1480, FF.red], [1574, '#2b6fd6']]) circ(x, mx, 180, 4.5, mc, { sh: 'n', lw: 2 });
    // the hard hats on their hooks (knocked: they swing and clatter)
    const hs = P.hats || Z, ha = since(hs, t);
    for (const [hx, s0, col] of [[1494, 0, FF.yellow], [1556, 1.3, FF.orange]]) { const a = wob(ha - s0 * 0.05, 1.8, 7 + s0) * 0.5 + 0.03 * Math.sin(t * 0.8 + s0);
      x.save(); x.translate(hx, 272); x.rotate(a); hardHat(x, 0, 46, 0.62, col); x.restore(); }
    ffLocker(x, flip(P.locker || Z, t, 0.3)); };
  st.reveal = (ctx, T, o = {}) => {   // first visit (the hook for the reveal system, plan §7): dark; the lever thunks on by itself; the beacon starts; a "?" crate
    const R = (on, t0) => Object.assign({}, Z, { on, t0 });   //  crosses the window; the locker's screen types "dear potato…". ~4 s. Returns false when it's done.
    st.paint(ctx, T, 0, Object.assign({}, o, { P: { lamp: R(false, -99), belt: T >= 0.6 ? R(true, 0.6) : Z }, reveal: T, beat: T * 2 }));
    const dk2 = 0.55 * (1 - ez((T - 0.3) / 1.6)); if (dk2 > 0) { ctx.fillStyle = `rgba(6,5,12,${dk2})`; ctx.fillRect(0, 0, 1600, 900); }   // (it starts darker still, the room coming up as the line starts)
    return T < 4.2; };
}

// ---- 6. the sea floor: the lantern, the clam, the kettle, the conch, both chairs, the table, the counter (everything moves slow down here)
const memo = f => { const m = new Map(); return c => { let v = m.get(c); if (v === undefined) m.set(c, v = f(c)); return v; }; };   // (the tinted colours: worked out once, not every frame)
const SEA = '#2896a0', seaT = memo(c => tint(c, SEA, 0.14));
function seaChair(x, cx, d, dy = 0, a = 0) {   // (as the base drew it, tinted for the water; now it floats when bumped)
  x.save(); x.translate(cx, 750 + dy); x.rotate(a); x.translate(-cx, -750); const ink = seaT(INK);
  box(x, cx - 40, 610, 80, 20, seaT('#6e5034'), { sh: 'b', lw: 6, ink }); box(x, cx + d * 34 - 7, 470, 14, 140, seaT('#6e5034'), { lw: 5, ink }); box(x, cx - 34, 630, 12, 120, seaT('#5a4028'), { sh: 'n', lw: 4, ink }); box(x, cx + 22, 630, 12, 120, seaT('#5a4028'), { sh: 'n', lw: 4, ink }); x.restore(); }
const floatUp = (s, t) => { const a = since(s, t); return a >= 0 && a < 2.4 ? -Math.sin(Math.min(1, a / 0.7) * Math.PI / 2) * 46 * (a < 0.7 ? 1 : 1 - (a - 0.7) / 1.7) : 0; };
function clam(x, s, t) {
  const k = flip(s, t, 0.35), ink = seaT(INK);
  x.beginPath(); x.moveTo(1198, 452); x.quadraticCurveTo(1250, 470, 1302, 452); x.closePath(); x.fillStyle = seaT('#d8c2a8'); x.fill(); stroke(x, { lw: 5, ink });
  if (k > 0.05) { ell(x, 1250, 450, 48, 8, seaT('#f0a8a0'), { lw: 3, ink }); circ(x, 1250, 442, 10, '#fbfaf4', { lw: 3, ink }); glow(x, 1250, 440, 50 + 10 * Math.sin(t * 3), '#ffffff', 0.45 * k); ell(x, 1246, 438, 3, 2, '#ffffff', { lw: 0 }); }
  x.save(); x.translate(1300, 452); x.rotate(0.8 * k); x.beginPath(); x.moveTo(-100, 0); x.quadraticCurveTo(-50, -52, 0, 0); x.closePath(); x.fillStyle = seaT('#e8d6c0'); x.fill(); stroke(x, { lw: 5, ink });   // (the top shell hinges up and back)
  for (const q of [-75, -50, -25]) seg(x, [[q, -4], [-50 + (q + 50) * 0.5, -22]], 2.5, seaT('#b8a68e')); x.restore();
  if (s.on && since(s, t) < 1.4) bubbles(x, 1250, 440, since(s, t) / 1.4, 7, 3); }
{ const st = S.find(s => s.id === 'deep-sea-diver');
  st.dark = 0.32; st.grav = 0.5; st.puff = 'bubbles'; st.props = [
    { id: 'lantern', kind: 'switch', lamp: true, startOn: true, x0: 700, x1: 805, y0: 310, y1: 420, hint: [770, 300], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'clam', kind: 'switch', x0: 1190, x1: 1310, y0: 390, y1: 470, hint: [1250, 380], sfx: { on: 'clam', off: 'clunk' }, face: { on: ['smirk', 1.0] } },
    { id: 'kettle', kind: 'switch', x0: 980, x1: 1110, y0: 370, y1: 460, hint: [1055, 362], sfx: { on: 'bubble', off: 'flick' }, loop: { every: 1.3, first: 1.3, sfx: 'bubble' } },
    { id: 'conch', kind: 'switch', auto: 1.6, x0: 820, x1: 910, y0: 495, y1: 560, hint: [860, 488], sfx: { on: 'conch' } },
    { id: 'chairL', kind: 'hop', bump: true, busy: 2.4, x0: 480, x1: 560, top: 610, y0: 460, y1: 760, sfx: { land: 'thunk', bump: 'bloop' } },
    { id: 'chairR', kind: 'hop', bump: true, busy: 2.4, x0: 980, x1: 1060, top: 610, y0: 460, y1: 760, sfx: { land: 'thunk', bump: 'bloop' } },
    { id: 'table', kind: 'hop', x0: 560, x1: 980, top: 556, y0: 540, y1: 770, sfx: { land: 'thunk' }, zones: [{ id: 'conch', x0: 800, x1: 930, act: 'use' }] },   // (land on the conch: it blows)
    { id: 'counter', kind: 'hop', x0: 820, x1: 1450, top: 452, y0: 440, y1: 640, sfx: { land: 'thunk' } } ];
  st.under = (x, t, lit, P) => { const cl = P.chairL || Z, cr = P.chairR || Z;
    seaChair(x, 520, -1, floatUp(cl, t) + sink(cl, t), wob(since(cl, t), 2.2, 3) * -0.12); seaChair(x, 1020, 1, floatUp(cr, t) + sink(cr, t), wob(since(cr, t), 2.2, 3) * 0.12);
    clam(x, P.clam || Z, t); };
  st.over = (x, t, lit, P) => {
    if ((P.kettle || Z).on) { glow(x, 1000, 380, 90, '#e8ffff', 0.3); for (let i = 0; i < 12; i++) { const ph = (t * 0.7 + i / 12) % 1, bx = 980 - ph * 40 + Math.sin(ph * 12 + i) * 10, by = 400 - ph * 320, r = 7 + rnd(i, 9) * 9;   // the kettle on the boil: big bright bubbles pour out of the spout
      x.beginPath(); x.arc(bx, by, r * (0.6 + ph), 0, TAU); x.fillStyle = 'rgba(225,255,255,.4)'; x.fill(); x.lineWidth = 3.5; x.strokeStyle = 'rgba(255,255,255,.95)'; x.stroke(); ell(x, bx - r * 0.3, by - r * 0.3, r * 0.22, r * 0.14, '#ffffff', { lw: 0 }); } }
    const ca = since(P.conch || Z, t);   // the conch: rings of bubble blown out of it
    if (ca >= 0 && ca < 1.8) for (let k = 0; k < 3; k++) { const u = ca / 1.8 - k * 0.14; if (u <= 0 || u >= 1) continue; x.save(); x.globalAlpha = 1 - u; x.beginPath(); x.ellipse(800 - u * 160, 530 - u * 120, 10 + u * 40, 5 + u * 18, -0.5, 0, TAU); x.lineWidth = 5; x.strokeStyle = 'rgba(230,255,255,.85)'; x.stroke(); x.restore(); } };
}

// ---- 7. the office: the desk lamp, the phone, the radio, the fan, the filing drawer, the desk, the chair, the cabinet top
const NIGHT = '#141e3c', noirT = memo(c => tint(c, NIGHT, 0.12));
const FOLDERS = [[840, '#e8c88a', 62], [872, '#f2d8a0', 78], [904, '#d8b878', 70], [944, '#e8c88a', 84]];
function deskChair(x, s, t, me) {   // a swivel chair: lands -> spins (and turns slowly while he's on it)
  const a = Math.min(Math.max(0, landed(s, t)), 1.6), ph = 11 * a - 11 * a * a / 3.2 + (me && me.on === 'chair' ? t * 1.6 : 0), bx = 1030 - Math.cos(ph) * 13, ink = noirT(INK);
  const post = () => box(x, bx - 7, 470 - sink(s, t), 14, 140, noirT('#5a4030'), { lw: 4, ink });
  if (Math.sin(ph) <= 0) post(); seg(x, [[1030, 622], [1030, 720]], 8, ink); for (const d of [-1, 1]) seg(x, [[1030, 720], [1030 + d * 36 * Math.cos(ph * 0.5), 736]], 6, ink);
  box(x, 990, 600 + sink(s, t), 80, 22, noirT('#5a4030'), { sh: 'b', lw: 5, ink }); if (Math.sin(ph) > 0) post(); }
{ const st = S.find(s => s.id === 'noir-detective');
  st.dark = 0.4; st.props = [
    { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 945, x1: 1020, hit: [900, 458, 1010, 545], hint: [955, 452], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'phone', kind: 'switch', auto: 6.4, x0: 760, x1: 900, hit: [800, 488, 890, 550], hint: [845, 480], sfx: { on: 'ring', off: 'clunk' }, loop: { every: 1.6, first: 1.6, sfx: 'ring' }, face: { on: ['startled', 0.8] } },
    { id: 'drawer', kind: 'knock', x0: 890, x1: 945, hit: [820, 420, 990, 640], hint: [905, 412], sfx: { on: 'drawer', off: 'drawer' } },
    { id: 'radio', kind: 'switch', x0: 1250, x1: 1380, y0: 388, y1: 460, hint: [1315, 378], sfx: { on: 'radio', off: 'flick' }, loop: { every: 2.2, first: 2.2, sfx: 'radio' } },
    { id: 'fan', kind: 'switch', x0: 600, x1: 720, hit: [600, 380, 940, 440], hint: [700, 380], sfx: { on: 'fan', off: 'flick' } },
    { id: 'chair', kind: 'hop', x0: 990, x1: 1070, top: 600, y0: 470, y1: 740, sfx: { land: 'squeak' } },
    { id: 'desk', kind: 'hop', x0: 550, x1: 990, top: 548, y0: 540, y1: 760, sfx: { land: 'thunk' } },
    { id: 'board', kind: 'hop', x0: 992, x1: 1448, top: 456, y0: 446, y1: 470, sfx: { land: 'thunk' } } ];
  st.under = (x, t, lit, P, me) => { const ph = P.phone || Z, ink = noirT(INK);
    const dr = flip(P.drawer || Z, t, 0.22);   // the top drawer pulled out at you: folders in it
    if (dr > 0) { const e = 24 * dr, y = 432 + 10 * dr; for (const [fx, c, h] of FOLDERS) box(x, fx, y - h * dr, 28, h + 8, noirT(c), { r: 3, sh: 'n', lw: 3, ink });   // (folders stand up out of it, over the lamp)
      box(x, 832 - e, y, 146 + 2 * e, 58 + e * 0.6, noirT('#6a6d5b'), { r: 3, sh: 'b', lw: 4, ink }); box(x, 884, y + 22 + e * 0.3, 42, 10, noirT('#a8a890'), { r: 4, sh: 'n', lw: 3, ink }); box(x, 890, y + 6, 30, 12, noirT('#d8d0bc'), { sh: 'n', lw: 2, ink });
      box(x, 930, 536, 50, 12, noirT('#b8863a'), { r: 4, lw: 4, ink }); box(x, 951, 494, 8, 44, noirT('#b8863a'), { sh: 'n', lw: 3, ink });   // (the desk lamp stands in front of it: drawn again on top)
      x.beginPath(); x.moveTo(906, 494); x.lineTo(1004, 494); x.quadraticCurveTo(1004, 466, 955, 466); x.quadraticCurveTo(906, 466, 906, 494); x.closePath(); x.fillStyle = noirT('#2f6a46'); x.fill(); x.save(); x.clip(); x.fillStyle = noirT('#245236'); x.fillRect(970, 460, 40, 40); x.restore(); stroke(x, { lw: 5, ink }); seg(x, [[918, 476], [940, 470]], 3, noirT('#5cae7a')); }
    const ring = ph.on && (since(ph, t) % 1.6) < 0.9, hy = ring ? -Math.abs(Math.sin(t * 44)) * 7 : 0, hr = ring ? Math.sin(t * 31) * 0.06 : 0;   // the handset jumps in its cradle while it rings
    x.save(); x.translate(845, 512 + hy); x.rotate(hr); x.beginPath(); x.moveTo(-37, 6); x.quadraticCurveTo(0, -16, 37, 6); x.lineWidth = 12; x.strokeStyle = ink; x.stroke(); x.lineWidth = 6; x.strokeStyle = noirT('#2a2a2a'); x.stroke(); x.restore();
    if (ring) for (const d of [-1, 1]) for (let k = 0; k < 2; k++) { x.beginPath(); x.arc(845, 512, 50 + k * 14, d > 0 ? -0.6 : Math.PI - 0.4, d > 0 ? 0.4 : Math.PI + 0.6); x.lineWidth = 4; x.strokeStyle = '#e8e2d4'; x.stroke(); }
    deskChair(x, P.chair || Z, t, me); };
  st.over = (x, t, lit, P) => { const rd = flip(P.radio || Z, t, 0.3);   // the radio on: its dial glows, notes drift out
    if (rd > 0) { glow(x, 1297, 424, 60, '#ffd08a', 0.5 * rd); for (let i = 0; i < 4; i++) { const ph = (t * 0.35 + i / 4) % 1; note(x, 1300 + (i - 1.5) * 28 + Math.sin(ph * 6 + i) * 18, 380 - ph * 200, ['#ffd08a', '#e8e2d4'][i % 2], Math.sin(ph * Math.PI) * rd, 0.8); } } };
}

// ---- 8. the haunted kitchen: the clock, the knocked-over chair (it gets up), the other chair (it slides away), the table (the dishes scatter), the chandelier
function hauntChair(x, s, t) {   // the one on its side: knock it and it stands itself up (and falls back down)
  const a = since(s, t), k = s.on ? ez((a - 0.25) / 0.9) : ez(1 - a / 0.35), sh = s.on && a < 0.3 ? (rnd(Math.floor(t * 30), 5) - 0.5) * 6 : 0;
  const lift = s.on ? Math.sin(Math.min(1, Math.max(0, (a - 0.25) / 0.9)) * Math.PI) * 40 : 0;
  if (s.on && a < 1.6) glow(x, 330, 700 - lift, 120, '#d8ecff', 0.25 * (1 - a / 1.6));
  x.save(); x.translate(330 + sh, 760 - 130 * k - lift); x.rotate(-1.45 * (1 - k)); box(x, -40, 0, 80, 20, '#4a3a2c', { sh: 'b', lw: 6 }); box(x, -40, -140, 14, 140, '#4a3a2c', { lw: 4 }); box(x, -34, 20, 12, 100, '#3a2c20', { sh: 'n', lw: 4 }); box(x, 22, 20, 12, 100, '#3a2c20', { sh: 'n', lw: 4 }); x.restore(); }
function clockFace(x, s, t) {   // the stopped clock: knock and it chimes, its hands race round
  const a = since(s, t), run = s.on ? a : s.n ? 3 + a * 0.02 : 0; circ(x, 1530, 300, 40, '#e8e0cc', { lw: 5, sk: 0.1 }); for (let k = 0; k < 12; k++) { const an = k / 12 * TAU; seg(x, [[1530 + Math.cos(an) * 32, 300 + Math.sin(an) * 32], [1530 + Math.cos(an) * 37, 300 + Math.sin(an) * 37]], 3); }
  const h = -Math.PI / 2 + run * 1.1, m = -Math.PI / 2 + 0.25 + run * 13; seg(x, [[1530, 300], [1530 + Math.cos(h) * 22, 300 + Math.sin(h) * 22]], 5); seg(x, [[1530, 300], [1530 + Math.cos(m) * 30, 300 + Math.sin(m) * 30]], 3.5); circ(x, 1530, 300, 4, INK, { sh: 'n', lw: 0 }); }
{ const st = S.find(s => s.id === 'sheet-ghost');
  st.props = [
    { id: 'clock', kind: 'switch', auto: 3, x0: 1470, x1: 1590, y0: 180, y1: 660, hint: [1530, 166], sfx: { on: 'bong' }, face: { on: ['wide', 0.9] } },
    { id: 'fallen', kind: 'knock', busy: 1.6, x0: 190, x1: 450, top: 630, seat: [292, 368], standIf: (s, t) => s.on && t - s.t0 > 1.15, y0: 600, y1: 700, hint: [330, 596], sfx: { on: 'creak', off: 'thud' }, face: { on: ['startled', 0.9] } },
    { id: 'chand', kind: 'switch', x0: 700, x1: 840, y0: 330, y1: 420, hint: [770, 322], sfx: { on: 'flare', off: 'snuff' } },
    { id: 'chair', kind: 'hop', bump: true, busy: 2.4, x0: 980, x1: 1060, top: 610, y0: 460, y1: 760, sfx: { land: 'creak', bump: 'scoot' } },
    { id: 'table', kind: 'hop', busy: 2.2, x0: 560, x1: 980, top: 556, y0: 540, y1: 770, sfx: { land: 'clatter' } },
    { id: 'stove', kind: 'hop', seat: [975, 1045], x0: 810, x1: 1060, top: 380, y0: 372, y1: 392, sfx: { land: 'clang' } },
    { id: 'counter', kind: 'hop', x0: 1062, x1: 1448, top: 452, y0: 444, y1: 470, sfx: { land: 'thunk' } } ];
  st.under = (x, t, lit, P) => { hauntChair(x, P.fallen || Z, t); clockFace(x, P.clock || Z, t);
    const c = P.chair || Z, a = since(c, t), dx = a >= 0 && a < 2.4 ? (a < 0.35 ? ez(a / 0.35) : 1 - ez((a - 0.6) / 1.8)) * 70 : 0;   // the chair slides off on its own when he bumps it, then creeps back
    x.save(); x.translate(dx, sink(c, t)); box(x, 1000, 470, 14, 140, '#4a3a2c', { lw: 4 }); box(x, 980, 610, 80, 20, '#4a3a2c', { sh: 'b', lw: 6 }); box(x, 986, 630, 12, 120, '#3a2c20', { sh: 'n', lw: 4 }); box(x, 1042, 630, 12, 120, '#3a2c20', { sh: 'n', lw: 4 }); cobweb(x, 998, 630, 50, 0, Math.PI * 0.5, 0.4); x.restore(); };
}

// ---- 9. the collective: the regeneration alcove, the hologram, the kettle, the ring lamp, both stools, the table, the counter
{ const st = S.find(s => s.id === 'circuit-cyborg');
  st.dark = 0.32; st.props = [
    { id: 'alcove', kind: 'switch', x0: 1452, x1: 1594, y0: 160, y1: 640, hint: [1523, 146], sfx: { on: 'regen', off: 'powerDown' }, face: { on: ['sleepy', 1.4] } },
    { id: 'holo', kind: 'switch', busy: 0.7, x0: 1080, x1: 1170, y0: 330, y1: 475, hint: [1166, 340], sfx: { on: 'holo', off: 'holo' } },
    { id: 'kettle', kind: 'switch', x0: 1220, x1: 1330, y0: 385, y1: 460, hint: [1275, 376], sfx: { on: 'beep', off: 'flick' }, loop: { every: 1.4, first: 0.6, sfx: 'bubble' } },
    { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 700, x1: 840, y0: 320, y1: 400, hint: [770, 318], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'stoolL', kind: 'hop', x0: 460, x1: 540, top: 608, y0: 600, y1: 740, sfx: { land: 'beep' } },
    { id: 'stoolR', kind: 'hop', x0: 1000, x1: 1080, top: 608, y0: 600, y1: 740, sfx: { land: 'beep' } },
    { id: 'table', kind: 'hop', x0: 580, x1: 960, top: 556, y0: 540, y1: 740, sfx: { land: 'clunk' } },
    { id: 'counter', kind: 'hop', x0: 820, x1: 1450, top: 456, y0: 446, y1: 640, sfx: { land: 'clunk' } } ];
  st.over = (x, t, lit, P) => {
    const kt = P.kettle || Z; if (kt.on) { const u = Math.min(1, since(kt, t) / 2.5); box(x, 1250, 444 - 40 * u, 10, 40 * u, '#d8ffe0', { r: 4, sh: 'n', lw: 2 }); if (u > 0.6) steam(x, 1328, 398, t, 3, 90, 0.35, 6); glow(x, 1255, 424, 40, BG.green, 0.4); }
    const hb = since(P.holo || Z, t); if (hb >= 0 && hb < 0.6) for (let i = 0; i < 10; i++) { const an = i / 10 * TAU, r = 30 + hb * 160; x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(140,255,160,${1 - hb / 0.6})`; x.fillRect(1120 + Math.cos(an) * r - 4, 380 + Math.sin(an) * r * 0.6 - 4, 8, 8); x.restore(); }
    for (const [id, sx] of CSTOOLS) { const k = fade(landed(P[id] || Z, t), 0.9); if (k > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.beginPath(); x.ellipse(sx, 616, 40, 10, 0, 0, TAU); x.lineWidth = 6; x.strokeStyle = `rgba(87,255,122,${k})`; x.stroke(); x.restore(); glow(x, sx, 616, 60, BG.green, 0.4 * k); } }
    const tk = fade(landed(P.table || Z, t), 0.8); if (tk > 0) { seg(x, [[594, 578], [946, 578]], 5, '#d8ffe0'); glow(x, 770, 578, 200, BG.green, 0.3 * tk); } };
}

// ---- 10. the break room: the tube light, the coffee machine, the microwave, the poster, the water cooler, both chairs, the table, the counter
function poster(x, s, t) {   // knock it crooked: the one circle rolls down into the corner
  const k = flip(s, t, 0.5), r = k * 0.13 + (s.on ? wob(since(s, t), 1.2, 9) * 0.07 : 0), cxp = 15 + 54 * ez(s.on ? (since(s, t) - 0.15) / 0.7 : 1 - since(s, t) / 0.5), cyp = 150 + 13 * k;
  x.save(); x.translate(1253, 270); x.rotate(r); seg(x, [[0, -8], [0, 10]], 3); circ(x, 0, -8, 4, '#8a8478', { sh: 'n', lw: 2 });
  box(x, -127, 10, 254, 214, '#1a1a1a', { r: 2, sh: 'n', lw: 5 }); box(x, -113, 24, 226, 186, '#f2efe6', { sh: 'n', lw: 0 }); box(x, -95, 42, 190, 150, '#1f3550', { sh: 'n', lw: 3 }); circ(x, cxp, cyp, 26, '#f2c230', { lw: 4, sk: 0.12 }); x.restore(); }
{ const st = S.find(s => s.id === 'suit-tie');
  st.dark = 0.3; st.props = [
    { id: 'tube', kind: 'switch', lamp: true, startOn: true, x0: 680, x1: 790, hit: [640, 330, 900, 380], hint: [700, 326], sfx: { on: 'tubeOn', off: 'lampOff' } },
    { id: 'coffee', kind: 'switch', busy: 4.2, x0: 800, x1: 910, y0: 370, y1: 470, hint: [860, 364], sfx: { on: 'brew', off: 'flick' } },
    { id: 'micro', kind: 'switch', auto: 3.2, x0: 930, x1: 1100, y0: 390, y1: 470, hint: [1015, 388], sfx: { on: 'hum', done: 'ding' }, loop: { every: 0.8, first: 0.8, sfx: 'hum' } },
    { id: 'poster', kind: 'knock', busy: 1.4, x0: 1130, x1: 1380, y0: 270, y1: 500, hint: [1253, 258], sfx: { on: 'thud', off: 'flick' }, after: { on: [[0.25, 'roll']] }, face: { on: ['smirk', 1.0] } },
    { id: 'cooler', kind: 'bump', x0: 1440, x1: 1590, y0: 300, y1: 650, hint: [1500, 288], sfx: { bump: 'glug' } },
    { id: 'chairL', kind: 'hop', x0: 478, x1: 562, top: 604, y0: 470, y1: 740, sfx: { land: 'squeak' } },
    { id: 'chairR', kind: 'hop', x0: 988, x1: 1072, top: 604, y0: 470, y1: 740, sfx: { land: 'squeak' } },
    { id: 'table', kind: 'hop', x0: 590, x1: 950, top: 566, y0: 548, y1: 744, sfx: { land: 'clink' } },
    { id: 'counter', kind: 'hop', x0: 820, x1: 1110, top: 462, y0: 452, y1: 640, sfx: { land: 'thunk' } } ];
  st.under = (x, t, lit, P) => { poster(x, P.poster || Z, t);
    const cf = P.coffee || Z; if (cf.on) { const u = Math.min(1, since(cf, t) / 4); circ(x, 888, 394, 4, '#5cff8a', { sh: 'n', lw: 0 }); glow(x, 888, 394, 14, '#5cff8a', 0.6);   // brewing: the light goes green, it drips, the pot fills
      x.fillStyle = '#4a2a14'; x.fillRect(838, 458 - 18 - 18 * u, 44, 18 + 18 * u); box(x, 836, 420, 48, 40, 'rgba(200,220,230,.35)', { r: 4, lw: 4 }); if (u < 1) { seg(x, [[860, 404], [860, 420]], 9); seg(x, [[860, 404], [860, 420]], 5, '#4a2a14'); for (let k = 0; k < 2; k++) { const ph = (t * 2.6 + k / 2) % 1; x.beginPath(); x.ellipse(860, 422 + ph * 26, 5 + ph * 2, 8, 0, 0, TAU); x.fillStyle = '#5a3418'; x.fill(); stroke(x, { lw: 3 }); } } steam(x, 860, 372, t, u < 1 ? 1 : 3, 60 + 40 * u, 0.3, 6); }   // (a fat drip, ink-edged; it steams once full)
    const mw = P.micro || Z; if (mw.on) { const ph = t * 2.2; box(x, 952, 410, 92, 42, '#ffcf6a', { r: 4, sh: 'n', lw: 4 }); glow(x, 998, 431, 70, '#ffd27a', 0.5); ell(x, 998, 446, 34, 4, '#e8b04a', { lw: 2 }); box(x, 998 + Math.sin(ph) * 22 - 9, 426, 18, 20, '#f2f0ea', { r: 4, lw: 3 }); }   // (a mug going round)
    const ma = landed(P.table || Z, t); if (ma >= 0 && ma < 0.7) { const u = ma / 0.7; for (let i = 0; i < 6; i++) { const vx = (i - 2.5) * 56, r = 9 - Math.abs(i - 2.5) * 1.4; circ(x, 837 + vx * u, 522 - 120 * u + 190 * u * u, r * (1 - 0.3 * u), '#5a3a20', { sh: 'n', lw: 3 }); } if (u < 0.5) poly(x, [[815, 520], [826, 496 - 30 * u], [837, 512], [848, 490 - 30 * u], [859, 520]], '#6a4426', { lw: 3 }); } };   // (a crown of coffee, then fat drops)   // he lands on the table: the coffee jumps out of the mug
}

// ---------- the door (Chikin: "a door to the left of the screen that you walk through to start the level") ----------
// Each room is squeezed into x 200..1416 (round things kept round, see squeezable); the strip left of it is a plain stretch of
// the room's own wall (STRIP, mirrored so it meets the room without a seam), and the door stands in it, dressed for the room, with the song's sign over it (number, name, and a lamp
// that's lit once you've finished the song). The name comes in as the videos' glitch text on every change, then settles.
// THE WATCH DOOR (Chikin: "I need a demo option for each in the kitchen, make it a door to the right, I need to watch without figuring
// out what i am doing" + "this way I can see if you are beating it by cheesing"): the room now squeezes into x 200..1416 so the right
// wall gets a strip of its own (plain wall again, never a copy of the fridge) with a second door in it, dressed the same, signed
// WATCH. Through it the song's demo plays hands-off from the top, the whole song (intro.mjs: the same as the O key).
export const ROOM = { ox: 200, sx: 0.76 };
export const DOOR = { x0: 30, x1: 202, y0: 300, y1: 640 };    // the doorway (the casing sits round it)
export const SIGN = { x0: 12, x1: 296, y0: 144, y1: 284 };
export const WDOOR = { x0: 1434, x1: 1584, y0: 300, y1: 640 };   // the watch door (drawn mirrored: hinged on the right, its light spills left into the room)
export const WSIGN = { x0: 1406, x1: 1594, y0: 176, y1: 266 };
const ROOM_X1 = () => ROOM.ox + 1600 * ROOM.sx;   // (where the room ends and the right wall's strip starts)
const DOORS = {
  bare: { kind: 'swing', panel: '#7a4c2e', trim: '#5a3a26', knob: '#e0b45a', light: '#ffe2a8', plate: '#1d140f', plateTrim: '#8a5a36', deco: 'kitchen', hang: true },
  'disco-legend': { kind: 'swing', panel: '#2a1846', trim: '#ff4f8b', knob: '#ffc93c', light: '#ff9be0', plate: '#140a24', plateTrim: '#ffc93c', deco: 'disco', bulbs: true, neon: true },
  'orbital-astronaut': { kind: 'slide', panel: '#9aa3ae', trim: '#5b636e', knob: '#57ff7a', light: '#cfe6ff', plate: '#0c1119', plateTrim: '#5b636e', deco: 'airlock' },
  'construction-crew': { kind: 'slide', panel: '#e8b83a', trim: '#2b2622', knob: '#2b2622', light: '#ff9a2e', plate: '#120a05', plateTrim: '#2b2622', deco: 'factory' },   // (a roller shutter)
  'suit-tie': { kind: 'swing', panel: '#c9c2b0', trim: '#8a8478', knob: '#c9ced6', light: '#f4f8ff', plate: '#16191e', plateTrim: '#8a8478', deco: 'office' },
  'noir-detective': { kind: 'swing', panel: '#5a3a26', trim: '#3a2618', knob: '#d9b27a', light: '#ffd08a', plate: '#121010', plateTrim: '#b08a4a', deco: 'glass' },
  'sheet-ghost': { kind: 'swing', panel: '#3c4458', trim: '#262c3a', knob: '#8a8f99', light: '#d8ecff', plate: '#0c101c', plateTrim: '#4a5268', deco: 'haunt', hang: true, tilt: -0.035 },
  'castle-knight': { kind: 'arch', panel: '#6b4426', trim: '#8c887e', knob: '#2b2b2e', light: '#ffb34a', plate: '#17110c', plateTrim: '#6b4426', deco: 'castle', hang: true },
  'deep-sea-diver': { kind: 'swing', panel: '#3f7f80', trim: '#2a5a5c', knob: '#d9a441', light: '#9ff2e6', plate: '#071c25', plateTrim: '#d9a441', deco: 'hatch', r: 34 },
  'tin-robot': { kind: 'slide', panel: '#ff7a62', trim: '#cdd6df', knob: '#f4c04a', light: '#fff2c8', plate: '#123b44', plateTrim: '#cdd6df', deco: 'retro', r: 40, burst: true },
  'circuit-cyborg': { kind: 'slide', panel: '#22252c', trim: '#363a42', knob: '#57ff7a', light: '#9cffb0', plate: '#090b0e', plateTrim: '#363a42', deco: 'borg' },
};
// ---------- the room's own rooms (added by tools/make-kitchen.py): same layout, same props, its own Binary, Christmas, Halloween, burglar and Taticat kitchens ----------
const PIECE = n => PIECES.find(p => p[1] === n)[2], bareSt = S.find(s => s.id === 'bare'), uBare = bareSt.under, aBare = bareSt.anim, propsBare = bareSt.props.slice();
const COLS = ['#e23b2e', '#f4c430', '#2f9e55', '#3b82f6'];
function deskCal(x, X = 866, Y = 372) {   // the joke: April 4, circled. On the counter, not the wall
  poly(x, [[X, Y + 78], [X + 12, Y], [X + 92, Y], [X + 104, Y + 78]], '#efe5cf', { lw: 4 }); box(x, X + 12, Y, 80, 20, '#b5482e', { sh: 'n', lw: 3 });
  x.fillStyle = '#f3ead6'; x.font = '700 13px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('APRIL', X + 52, Y + 11);
  x.fillStyle = INK; x.font = '700 40px Inter, system-ui, sans-serif'; x.fillText('4', X + 52, Y + 50); x.beginPath(); x.ellipse(X + 52, Y + 50, 30 / OVAL(), 24, 0, 0, TAU); x.lineWidth = 4; x.strokeStyle = '#d42f27'; x.stroke(); }
function terminal(x, t, P) { const on = true, X = 1296, Y = 366;   // the old terminal: use it and it asks for the password
  box(x, X - 8, Y + 72, 126, 14, '#b9b1a0', { r: 4, lw: 4, sh: 'n' }); box(x, X, Y, 110, 74, '#d9d2c0', { r: 10, lw: 5 }); box(x, X + 10, Y + 9, 90, 54, '#06140c', { r: 6, sh: 'n', lw: 3 });
  const f = Math.floor(t * 3); x.fillStyle = '#4dff9a'; for (let r = 0; r < 4; r++) { const L = 18 + rnd(r, f) * 52; x.fillRect(X + 18, Y + 18 + r * 10, r === 3 ? (f % 2 ? 8 : 0) : L, 4); } }
bareSt.props = [...propsBare, { id: 'terminal', kind: 'switch', call: true, x0: 1286, x1: 1420, y0: 360, y1: 450, hint: [1350, 350], sfx: { on: 'flick', off: 'flick' } }];
bareSt.under = (x, t, lit, P, me) => { uBare(x, t, lit, P, me); deskCal(x); terminal(x, t, P); box(x, 600, 120, 92, 100, '#6b4426', { lw: 5, sh: 'n' }); if (PET) x.drawImage(PET, 610, 130, 72, 80); };
const derive = (id, o) => { const st = Object.assign({}, bareSt, { props: propsBare.slice(), under: uBare, id }, o); S.push(st); return st; };

// Between Messages: nobody's home, the lamp's off, and someone's flashlight is going through the kitchen
derive('burglar', { name: 'nobody home', outfit: 'burglar', badge: '#23283a', dark: 0.5, props: propsBare.map(p => p.id === 'lamp' ? Object.assign({}, p, { startOn: false }) : p),
  base(x) { bareSt.base(x); x.fillStyle = 'rgba(8,10,28,.6)'; x.fillRect(-2400, 0, 6400, 900); seg(x, [[-300, 90], [300, 200], [560, 150], [770, 40]], 6, '#0c0a12'); box(x, 96, 320, 40, 70, '#23252e', { r: 8, lw: 5 }); circ(x, 116, 342, 10, '#4dd2ff', { sh: 'n', lw: 3 }); },
  anim(x, t, lit, P, me) { aBare(x, t, lit, P, me); if (lit > 0.5) return; const a = 0.42 * Math.sin(t * 0.7) - 0.15, X = 1130 + 180 * Math.sin(t * 0.43); x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(X, 180, 10, X, 420, 420); g.addColorStop(0, 'rgba(255,226,150,.42)'); g.addColorStop(1, 'rgba(255,226,150,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(X, 130); x.lineTo(X - 300 + a * 500, 700); x.lineTo(X + 140 + a * 500, 700); x.closePath(); x.fill(); x.restore(); },
  emblem(x) { ell(x, 50, 62, 26, 24, '#da9643'); x.beginPath(); x.moveTo(24, 50); x.quadraticCurveTo(50, 8, 76, 50); x.closePath(); x.fillStyle = '#17161c'; x.fill(); stroke(x, { lw: 5 }); box(x, 22, 46, 56, 11, '#2c2b33', { r: 4, sh: 'n', lw: 4 }); } });

// Binary: the kitchen as he sees it, all zeros and ones. Everything's still solid, nothing switches
derive('binary', { name: 'the simulation', outfit: 'simulation', badge: '#0d2a1b', under: null, anim: null, dark: 0, props: propsBare.filter(p => p.kind === 'hop'),
  base(x) { for (const [, , d] of PIECES) d(x); x.save(); const m = x.getTransform(), sq = x.__sq; x.__sq = 0; x.setTransform(1, 0, 0, 1, 0, 0); const d = x.getImageData(0, 0, 1600, 900), p = d.data, lum = new Float32Array(1600 * 900);
    for (let i = 0; i < lum.length; i++) { const l = (0.3 * p[i * 4] + 0.59 * p[i * 4 + 1] + 0.11 * p[i * 4 + 2]) / 255, k = Math.min(1, l * 1.25); lum[i] = k; p[i * 4] = 2 + 18 * k; p[i * 4 + 1] = 12 + 96 * k; p[i * 4 + 2] = 8 + 52 * k; }
    x.putImageData(d, 0, 0); x.font = '700 15px Menlo, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let X = 8; X < 1600; X += 13) for (let Y = 9; Y < 900; Y += 17) { const k = lum[Y * 1600 + X]; x.fillStyle = `rgba(77,255,154,${(0.1 + 0.8 * k * k).toFixed(3)})`; x.fillText(rnd(X, Y) > 0.5 ? '1' : '0', X, Y); } x.setTransform(m); x.__sq = sq; x.restore(); },
  emblem(x) { x.fillStyle = '#4dff9a'; x.font = '700 40px Menlo, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('01', 50, 50); } });

// Christmas: its own room, not the kitchen with decorations. A fireplace, a big tree, snow, cookies. We love Christmas.
const SANTA_W = { x: 560, y: 100, w: 250, h: 240 };
derive('santa', { name: 'christmas', outfit: 'santa', badge: '#b3232a', dark: 0.3,
  props: [{ id: 'fire', kind: 'switch', startOn: true, x0: 150, x1: 380, y0: 450, y1: 640, hint: [264, 430], sfx: { on: 'burner', off: 'flick' } },
    { id: 'tree', kind: 'switch', startOn: true, x0: 1110, x1: 1370, y0: 140, y1: 640, hint: [1240, 120], sfx: { on: 'partyOn', off: 'partyOff' } },
    { id: 'mantle', kind: 'hop', x0: 90, x1: 440, top: 392, y0: 380, y1: 420, sfx: { land: 'thunk' } },
    { id: 'gifts', kind: 'hop', x0: 1320, x1: 1450, top: 570, y0: 570, y1: 640, sfx: { land: 'creak' } },
    ...propsBare.filter(p => /chair|table/.test(p.id))],
  base(x) { wall(x, '#8c2329', '#5a161b'); x.fillStyle = 'rgba(255,220,180,.06)'; for (let X = 0; X < 1600; X += 70) x.fillRect(X, 0, 34, 640); topShade(x, 0.3);
    box(x, -10, 500, 1620, 140, '#4c2c1c', { sh: 'n', lw: 5 }); box(x, -10, 488, 1620, 14, '#6e4630', { sh: 'n', lw: 4 }); PIECE('floor')(x);
    const W = SANTA_W; box(x, W.x - 14, W.y - 14, W.w + 28, W.h + 28, '#6e4630', { r: 6, lw: 6 }); box(x, W.x, W.y, W.w, W.h, '#0d1a3a', { sh: 'n', lw: 5 }); poly(x, [[W.x, W.y + W.h], [W.x, W.y + W.h - 34], [W.x + 90, W.y + W.h - 60], [W.x + 170, W.y + W.h - 38], [W.x + W.w, W.y + W.h - 62], [W.x + W.w, W.y + W.h]], '#eef4ff', { lw: 4 }); seg(x, [[W.x + W.w / 2, W.y], [W.x + W.w / 2, W.y + W.h]], 7, '#6e4630'); seg(x, [[W.x, W.y + W.h / 2], [W.x + W.w, W.y + W.h / 2]], 7, '#6e4630');
    box(x, 96, 400, 336, 240, '#8a4a34', { lw: 6 }); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) box(x, 96 + (r % 2 ? -20 : 0) + c * 46, 402 + r * 30, 44, 28, '#a35a42', { sh: 'n', lw: 2 }); box(x, 154, 452, 220, 188, '#120a05', { r: 10, sh: 'n', lw: 6 }); box(x, 78, 380, 372, 26, '#5a3a26', { r: 6, lw: 6 });
    [[160, '#d42f27'], [266, '#2f9e55'], [370, '#f4c430']].forEach(([X, c]) => { poly(x, [[X - 22, 406], [X + 22, 406], [X + 22, 462], [X - 2, 486], [X - 40, 486], [X - 44, 464], [X - 22, 456]], c, { lw: 5 }); box(x, X - 28, 400, 56, 20, '#f3ead6', { r: 5, sh: 'n', lw: 4 }); });
    poly(x, [[1200, 640], [1200, 600], [1280, 600], [1280, 640]], '#7a4a26', { lw: 6 });
    [[600, 170, 330], [470, 140, 270], [350, 106, 210], [240, 74, 150]].forEach(([b, w, top]) => { x.beginPath(); x.moveTo(1240 - w, b); x.quadraticCurveTo(1240, b + 24, 1240 + w, b); x.lineTo(1240, b - top + 60); x.closePath(); x.fillStyle = '#2c7a45'; x.fill(); stroke(x, { lw: 6 }); });
    [[1120, 590, 90, 56, '#3b82f6'], [1330, 576, 110, 66, '#d42f27'], [1036, 606, 70, 38, '#f4c430']].forEach(([X, Y, W2, H, c]) => { box(x, X, Y, W2, H, c, { lw: 5 }); x.fillStyle = '#f3ead6'; x.fillRect(X + W2 / 2 - 6, Y + 3, 12, H - 6); x.fillRect(X + 3, Y + H / 2 - 6, W2 - 6, 12); });
    PIECE('table')(x); },
  under(x, t, lit, P) { const cl = P.chairL || Z, cr = P.chairR || Z; bareChair(x, 520, -1, rock(cl, t), sink(cl, t)); bareChair(x, 1020, 1, rock(cr, t), sink(cr, t)); ell(x, 700, 556, 44, 9, '#f2ead8', { lw: 4 }); [[676, 548], [700, 544], [722, 548], [698, 536]].forEach(([X, Y]) => circ(x, X, Y, 12, '#c98a4b', { sh: 'n', lw: 3 })); box(x, 800, 500, 34, 58, '#eef4ff', { r: 4, sh: 'n', lw: 4 }); },
  anim(x, t, lit, P) { const W = SANTA_W; x.save(); x.beginPath(); x.rect(W.x, W.y, W.w, W.h); x.clip(); for (let i = 0; i < 46; i++) { const sp = 18 + rnd(i, 1) * 26, X = W.x + rnd(i, 2) * W.w + Math.sin(t + i) * 8, Y = W.y + ((rnd(i, 3) * W.h + t * sp) % W.h); circ(x, X, Y, 1.5 + rnd(i, 4) * 2.4, '#eef4ff', { sh: 'n', lw: 0 }); } x.restore();
    const f = P.fire || Z; if (f.on) { glow(x, 264, 590, 260, '#ff8a3d', 0.34 + 0.05 * Math.sin(t * 9)); for (const [X, h] of [[210, 70], [262, 104], [318, 78]]) flame(x, X, 636, h, t, X, h * 0.42); }
    const tr = P.tree || Z; [[1110, 560], [1320, 540], [1160, 450], [1300, 430], [1215, 505], [1180, 345], [1290, 340], [1240, 400], [1205, 260], [1272, 262], [1240, 200], [1085, 590], [1385, 590]].forEach(([X, Y], i) => { const on = tr.on && Math.sin(t * 3 + i * 1.7) > -0.3; if (on) glow(x, X, Y, 34, COLS[i % 4], 0.5); circ(x, X, Y, 12, on ? COLS[i % 4] : '#3a3a3a', { sh: 'n', lw: 4 }); });
    { const Y = 92, R = tr.on ? 40 : 34; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -1.571 + i * 0.6283, q = i % 2 ? R * 0.45 : R; x.lineTo(1240 + Math.cos(a) * q / OVAL(), Y + Math.sin(a) * q); } x.closePath(); x.fillStyle = '#f4c430'; x.fill(); stroke(x, { lw: 5 }); if (tr.on) glow(x, 1240, Y, 90, '#ffd98a', 0.45); }
    for (let X = 40; X < 1600; X += 76) { const k = (X - 40) / 76, Y = 32 + 16 * Math.abs(Math.sin(k * 1.57)), on = Math.sin(t * 2.4 + k * 2) > 0; if (on) glow(x, X, Y, 22, COLS[k % 4], 0.4); circ(x, X, Y, 8, COLS[k % 4], { sh: 'n', lw: 3 }); } },
  emblem(x) { poly(x, [[24, 66], [50, 18], [76, 66]], '#e23b2e', { lw: 5 }); box(x, 20, 62, 60, 16, '#f3ead6', { r: 7, sh: 'n', lw: 4 }); circ(x, 50, 20, 8, '#f3ead6', { sh: 'n', lw: 4 }); } });

// Halloween: the kitchen on the wrong night
derive('pumpkin', { name: 'boo not found', outfit: 'pumpkin-specter', badge: '#c4641a', dark: 0.5,
  props: [...propsBare, { id: 'jack', kind: 'switch', startOn: true, x0: 830, x1: 980, y0: 360, y1: 450, hint: [900, 346], sfx: { on: 'flick', off: 'flick' } }, { id: 'big', kind: 'hop', x0: 180, x1: 330, top: 560, y0: 560, y1: 640, sfx: { land: 'thunk' } }],
  base(x) { bareSt.base(x); x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#7a58b8'; x.fillRect(-2400, 0, 6400, 640); x.fillStyle = '#b88ab0'; x.fillRect(-2400, 640, 6400, 260); x.restore();
    for (const [cx0, flipX] of [[0, 1], [1600, -1]]) { x.strokeStyle = 'rgba(230,230,240,.55)'; x.lineWidth = 3; for (let a = 0; a < 5; a++) { x.beginPath(); x.moveTo(cx0, 0); x.lineTo(cx0 + flipX * Math.cos(a * 0.35) * 210, Math.sin(a * 0.35) * 210); x.stroke(); } for (let r = 60; r < 210; r += 50) { x.beginPath(); for (let a = 0; a < 5; a++) x.lineTo(cx0 + flipX * Math.cos(a * 0.35) * r, Math.sin(a * 0.35) * r); x.stroke(); } }
    ell(x, 255, 640, 76, 62, '#e87a1e'); for (const d of [-40, 0, 40]) { x.beginPath(); x.ellipse(255 + d * 0.5, 640, Math.abs(d) * 0.7 + 8, 60, 0, 0, TAU); x.strokeStyle = 'rgba(120,50,0,.6)'; x.lineWidth = 4; x.stroke(); } seg(x, [[255, 580], [262, 556]], 12, '#3f6b2a'); },
  under(x, t, lit, P, me) { uBare(x, t, lit, P, me); const j = P.jack || Z; [[870, 424, 26], [930, 420, 32]].forEach(([X, Y, r], i) => { ell(x, X, Y, r * 1.1, r, '#e87a1e'); poly(x, [[X - r * .5, Y - 6], [X - r * .2, Y - 16], [X - r * .05, Y - 4]], j.on ? '#ffe28a' : INK, { lw: 2 }); poly(x, [[X + r * .5, Y - 6], [X + r * .2, Y - 16], [X + r * .05, Y - 4]], j.on ? '#ffe28a' : INK, { lw: 2 }); x.beginPath(); x.arc(X, Y + 4, r * .55, 0.2, 2.9); x.closePath(); x.fillStyle = j.on ? '#ffe28a' : INK; x.fill(); if (j.on) glow(x, X, Y, r * 2.4, '#ff9a3c', 0.3 + 0.1 * Math.sin(t * 11 + i)); }); },
  anim(x, t, lit, P, me) { aBare(x, t, lit, P, me); for (let i = 0; i < 4; i++) { const X = ((t * (50 + i * 18) + i * 300) % 1800) - 100, Y = 150 + 50 * Math.sin(t * 1.3 + i * 2), w = 10 + 7 * Math.abs(Math.sin(t * 9 + i)); x.fillStyle = '#17121f'; x.beginPath(); x.moveTo(X - 26, Y - w); x.quadraticCurveTo(X - 10, Y + 4, X, Y); x.quadraticCurveTo(X + 10, Y + 4, X + 26, Y - w); x.quadraticCurveTo(X, Y + 14, X - 26, Y - w); x.fill(); } },
  emblem(x) { ell(x, 50, 56, 32, 28, '#e87a1e'); seg(x, [[50, 28], [55, 14]], 7, '#3f6b2a'); poly(x, [[34, 50], [42, 40], [46, 54]], INK, { lw: 0 }); poly(x, [[66, 50], [58, 40], [54, 54]], INK, { lw: 0 }); x.beginPath(); x.arc(50, 60, 16, 0.2, 2.9); x.fillStyle = INK; x.fill(); } });

// Taticat's room: the Potato Fan Club office, member No. 001. Ink-blue walls to match her coat, a tidy desk, her badge framed on the wall. Everything does what you'd expect
let BADGE = null, PET = null, PETTING = false; export const setPetting = on => { PETTING = on; }; export const setBadge = im => { BADGE = im; }, setPetunia = im => { PET = im; };
const JUKE = { x: 110, w: 230 };
derive('taticat', { name: "taticat's", outfit: 'ink-coat', badge: '#1d2140', dark: 0.42,
  props: [{ id: 'juke', kind: 'switch', call: true, x0: 110, x1: 340, y0: 300, y1: 640, hint: [225, 286], sfx: { on: 'flick', off: 'flick' } }, { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 850, x1: 960, y0: 410, y1: 530, hint: [900, 400], sfx: { on: 'lampOn', off: 'lampOff' } }, { id: 'keys', kind: 'switch', busy: 2, x0: 620, x1: 780, y0: 450, y1: 530, hint: [700, 440], sfx: { on: 'clatter', off: 'clatter' } }, { id: 'desk', kind: 'hop', x0: 520, x1: 1000, top: 530, y0: 520, y1: 640, sfx: { land: 'thunk' } }],
  base(x) { wall(x, '#222750', '#171a38'); for (let r = 0; r < 7; r++) for (let c = 0; c < 26; c++) circ(x, c * 66 + (r % 2) * 33 - 40, 40 + r * 64, 5, 'rgba(239,229,207,.09)', { sh: 'n', lw: 0 }); topShade(x, 0.25);
    box(x, -10, 506, 1620, 134, '#2c3060', { sh: 'n', lw: 4 }); box(x, -10, 494, 1620, 14, '#efe5cf', { sh: 'n', lw: 4 }); PIECE('floor')(x);
    box(x, 392, 92, 236, 240, '#efe5cf', { lw: 6, sh: 'n' }); box(x, 406, 106, 208, 212, '#0d1a3a', { sh: 'n', lw: 4 }); circ(x, 560, 164, 30, '#f3ead6', { sh: 'n', lw: 0 }); for (let i = 0; i < 16; i++) box(x, 416 + i * 13, 318 - 30 - rnd(i, 3) * 70, 12, 120, '#141d3c', { sh: 'n', lw: 0 }); seg(x, [[510, 106], [510, 318]], 6, '#efe5cf'); seg(x, [[406, 212], [614, 212]], 6, '#efe5cf');
    box(x, 700, 80, 224, 224, '#c9a36b', { lw: 6, sh: 'n' }); box(x, 714, 94, 196, 196, '#efe5cf', { sh: 'n', lw: 4 });
    box(x, 1040, 130, 420, 510, '#6b4426', { lw: 6 }); for (let r = 0; r < 4; r++) { box(x, 1058, 148 + r * 120, 384, 104, '#3c2616', { sh: 'n', lw: 4 }); let X = 1064; let k = 0; while (X < 1420) { const w = 12 + rnd(k, r) * 16, h = 62 + rnd(k, r + 4) * 34; box(x, X, 148 + r * 120 + 104 - h, w, h, ['#d42f27', '#f4c430', '#3b82f6', '#2f9e55', '#efe5cf', '#9a52ff'][Math.floor(rnd(k, r + 9) * 6)], { sh: 'n', lw: 3 }); X += w + 3; k++; } }
    ell(x, 1180, 716, 150, 26, '#7a2030', { lw: 5 }); ell(x, 1180, 716, 116, 18, '#a03a48', { lw: 0 });
    box(x, 520, 530, 480, 28, '#a0693a', { r: 5, lw: 6 }); for (const X of [545, 958]) box(x, X - 9, 558, 18, 200, '#7a4a26', { lw: 5, sh: 'n' }); box(x, 700, 558, 240, 60, '#8a5a30', { lw: 5, sh: 'n' });
    seg(x, [[1110, 0], [1120, 44]], 3, '#efe5cf'); seg(x, [[1370, 0], [1360, 44]], 3, '#efe5cf'); box(x, 1100, 44, 280, 58, '#efe5cf', { r: 5, lw: 5, sh: 'n' }); x.fillStyle = INK; x.font = '400 26px "Major Mono Display", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText("taticat's room", 1240, 74);
    { const J = JUKE; x.beginPath(); x.moveTo(J.x, 640); x.lineTo(J.x, 420); x.arc(J.x + J.w / 2, 420, J.w / 2, Math.PI, 0); x.lineTo(J.x + J.w, 640); x.closePath(); x.fillStyle = '#b5482e'; x.fill(); stroke(x, { lw: 7 }); x.beginPath(); x.moveTo(J.x + 26, 640); x.lineTo(J.x + 26, 424); x.arc(J.x + J.w / 2, 424, J.w / 2 - 26, Math.PI, 0); x.lineTo(J.x + J.w - 26, 640); x.closePath(); x.fillStyle = '#17141f'; x.fill(); stroke(x, { lw: 4 }); box(x, J.x + 52, 420, J.w - 104, 70, '#ffd98a', { r: 10, sh: 'n', lw: 4 }); for (let k = 0; k < 3; k++) seg(x, [[J.x + 62, 436 + k * 16], [J.x + J.w - 62, 436 + k * 16]], 3, '#8a5a2a'); } },
  under(x, t, lit, P, me) { const J = JUKE, k = P.keys || Z, up = k.n ? Math.min(1, since(k, t) / 0.25) : 1;
    for (let i = 0; i < 6; i++) { const on = Math.sin(t * 5 + i * 1.2) > 0; box(x, J.x + 54 + i * 21, 510, 16, 60, on ? ['#e03ccf', '#4dff9a', '#ffd24a'][i % 3] : '#3a3450', { r: 4, sh: 'n', lw: 3 }); }
    if (BADGE) x.drawImage(BADGE, 722, 104, 180, 176);
    deskCal(x, 534, 452);
    box(x, 648, 498, 112, 32, '#2b2740', { r: 6, lw: 5 }); box(x, 668, 462 - 4 * (k.n % 4) + (1 - up) * 3, 72, 42, '#efe5cf', { sh: 'n', lw: 3 }); for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) circ(x, 660 + c * 13, 508 + r * 10, 3.5, '#efe5cf', { sh: 'n', lw: 0 });
    { const sheet = (X, Y, a) => { x.save(); x.translate(X, Y); x.rotate(a); box(x, -17, -22, 34, 44, '#efe5cf', { sh: 'n', lw: 3 }); seg(x, [[-10, -10], [10, -10]], 2, '#8a8478'); seg(x, [[-10, 0], [10, 0]], 2, '#8a8478'); x.restore(); };   // it spits out a stack of pages: they fly up, flutter down, and stay on the floor until he leaves the room
      for (let i = 0; i < Math.min(26, k.n * 6); i++) { const X = 460 + rnd(i, 21) * 620, Y = 664 + rnd(i, 22) * 70; if (k.n * 6 - i > 6 || since(k, t) > 1.6) sheet(X, Y, rnd(i, 23) * 2 - 1); }
      if (k.n && since(k, t) < 1.6) for (let i = 0; i < 12; i++) { const u = Math.max(0, Math.min(1, (since(k, t) - i * 0.05) / 1.1)); if (u <= 0) continue; const j = Math.min(25, (k.n - 1) * 6 + (i % 6)), X1 = 460 + rnd(j, 21) * 620, Y1 = 664 + rnd(j, 22) * 70; sheet(704 + (X1 - 704) * u + Math.sin(u * 9 + i) * 26, 462 + (Y1 - 462) * u * u - Math.sin(u * Math.PI) * (150 + rnd(i, 9) * 130), u * 6 * (i % 2 ? 1 : -1)); } }
    box(x, 894, 470, 12, 60, '#c9a36b', { lw: 3, sh: 'n' }); poly(x, [[858, 470], [942, 470], [922, 420], [878, 420]], '#3c6b4a', { lw: 5 }); box(x, 870, 524, 60, 8, '#c9a36b', { lw: 3, sh: 'n' });
    ell(x, 1180, 700, 62, 32, '#8d919c'); circ(x, 1128, 680, 26, '#8d919c', { sh: 'n', lw: 5 }); poly(x, [[1108, 664], [1104, 640], [1124, 656]], '#8d919c', { lw: 4 }); poly(x, [[1148, 664], [1152, 640], [1132, 656]], '#8d919c', { lw: 4 }); if (PETTING) { seg(x, [[1114, 680], [1124, 686]], 3); seg(x, [[1134, 686], [1144, 680]], 3); } else { seg(x, [[1116, 684], [1124, 688]], 3); seg(x, [[1134, 688], [1142, 684]], 3); }
    if (PETTING) { const heart = (X0, Y0, r) => { x.fillStyle = '#e0567c'; x.beginPath(); x.moveTo(X0, Y0 + r); x.bezierCurveTo(X0 - r * 1.6, Y0 - r * .6, X0 - r * .6, Y0 - r * 1.4, X0, Y0 - r * .3); x.bezierCurveTo(X0 + r * .6, Y0 - r * 1.4, X0 + r * 1.6, Y0 - r * .6, X0, Y0 + r); x.fill(); stroke(x, { lw: 3 }); }; for (const [cx0, cy0, n] of [[1150, 640, 5], [(me ? me.x : 1000), (me ? me.y : 700) - 170, 6]]) for (let i = 0; i < n; i++) { const u = (t * 0.45 + i / n) % 1; x.globalAlpha = Math.min(1, (1 - u) * 2.2); heart(cx0 + Math.cos(i * 2.1) * 80 + Math.sin(u * 6 + i) * 12, cy0 + 20 - u * 110, 9 + (i % 3) * 3); } x.globalAlpha = 1; } x.save(); x.translate(1240, 716); x.rotate(-0.3 - (PETTING ? 1 : 0) * Math.sin(t * 14) * 0.55); seg(x, [[0, 0], [34, -8], [52, -30]], 12, INK); seg(x, [[0, 0], [34, -8], [52, -30]], 7, '#8d919c'); x.restore(); },
  anim(x, t, lit) { if (lit > 0.5) glow(x, 900, 500, 330, '#ffc27a', 0.26); },
  emblem(x) { poly(x, [[30, 84], [38, 40], [62, 40], [70, 84]], '#efe5cf', { lw: 5 }); poly(x, [[50, 40], [40, 62], [50, 70], [60, 62]], '#17141f', { lw: 3 }); ell(x, 50, 34, 30, 6, '#efe5cf'); box(x, 36, 12, 28, 20, '#efe5cf', { r: 5, lw: 4 }); } });

// the photobooth room: through the left door. An arcade corner: the booth, a gumball machine, a coin slot
derive('booth', { name: 'photobooth', outfit: null, badge: '#7b3cf2', dark: 0, under: null,
  props: [{ id: 'photobooth', kind: 'switch', call: true, x0: 760, x1: 1180, y0: 170, y1: 640, hint: [970, 150], sfx: { on: 'flick', off: 'flick' } }, { id: 'gumball', kind: 'switch', x0: 330, x1: 450, y0: 330, y1: 640, hint: [390, 320], sfx: { on: 'clatter', off: 'pop' } }, { id: 'slot', kind: 'knock', x0: 1200, x1: 1260, y0: 380, y1: 460, hint: [1230, 370], sfx: { bump: 'clatter' } }, { id: 'bench', kind: 'hop', x0: 520, x1: 700, top: 560, y0: 550, y1: 640, sfx: { land: 'creak' } }],
  base(x) { wall(x, '#2a1a46', '#1a1030'); topShade(x, 0.25); for (let X = 0; X < 1600; X += 120) { x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect(X, 0, 60, 640); } PIECE('floor')(x); x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#8a6ab8'; x.fillRect(-2400, 640, 6400, 260); x.restore();
    box(x, 760, 170, 420, 470, '#d42f27', { r: 14, lw: 7 }); box(x, 790, 130, 360, 60, '#f4c430', { r: 10, lw: 6 }); x.fillStyle = INK; x.font = '700 40px Menlo, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('PHOTOS', 970, 160);
    box(x, 790, 210, 200, 400, '#120a05', { r: 6, sh: 'n', lw: 5 }); box(x, 1020, 260, 130, 170, '#2b2740', { r: 8, sh: 'n', lw: 5 }); ell(x, 1085, 330, 34, 34, '#0a0a12', { lw: 5 }); ell(x, 1085, 330, 14, 14, '#4db3ff', { lw: 3 }); box(x, 1030, 480, 110, 16, '#120a05', { sh: 'n', lw: 3 });
    for (let k = 0; k < 3; k++) { const X = 150 + k * 66; box(x, X, 140 + (k % 2) * 16, 54, 150, '#efe5cf', { lw: 4, sh: 'n' }); for (let q = 0; q < 3; q++) box(x, X + 8, 148 + (k % 2) * 16 + q * 46, 38, 40, ['#d42f27', '#3b82f6', '#2f9e55'][(q + k) % 3], { sh: 'n', lw: 2 }); }
    box(x, 520, 560, 180, 26, '#7a4a26', { r: 6, lw: 6 }); for (const X of [540, 680]) box(x, X - 6, 586, 12, 54, '#5a3a26', { lw: 4, sh: 'n' });
    box(x, 356, 500, 68, 140, '#d42f27', { r: 8, lw: 6 }); box(x, 346, 490, 88, 22, '#efe5cf', { r: 6, lw: 5, sh: 'n' }); box(x, 1204, 390, 52, 66, '#c9ced6', { r: 6, lw: 5 }); box(x, 1226, 402, 8, 30, '#120a05', { sh: 'n', lw: 0 }); },
  anim(x, t, lit, P) { const g = P.gumball || Z, k = g.n ? Math.min(1, since(g, t) / 0.6) : 1; circ(x, 390, 430, 70, 'rgba(180,220,255,.28)', { sh: 'n', lw: 6 }); for (let i = 0; i < 16; i++) circ(x, 346 + rnd(i, 1) * 88, 400 + rnd(i, 2) * 80, 11, COLS[i % 4], { sh: 'n', lw: 3 }); if (k < 1) circ(x, 390 + 40 * k, 540 + 100 * k * k, 11, '#e23b2e', { sh: 'n', lw: 3 }); },
  emblem(x) { box(x, 26, 22, 48, 58, '#d42f27', { r: 6, lw: 5 }); ell(x, 62, 44, 8, 8, '#4db3ff', { lw: 3 }); } });
for (const id of ['burglar', 'binary', 'santa', 'pumpkin', 'taticat', 'booth']) DOORS[id] = DOORS.bare;
DOORS.santa = Object.assign({}, DOORS.bare, { panel: '#7a2024', trim: '#4c1216', knob: '#f4c430', light: '#ffd98a' }); DOORS.taticat = Object.assign({}, DOORS.bare, { panel: '#efe5cf', trim: '#6b4426', knob: '#c9a36b', light: '#ffe2a8' }); DOORS.booth = Object.assign({}, DOORS.bare, { panel: '#3a2458', trim: '#241432', knob: '#f4c430', light: '#ffd98a' }); DOORS.pumpkin = Object.assign({}, DOORS.bare, { panel: '#3a2450', trim: '#241432', knob: '#e87a1e', light: '#ff9a3c' }); DOORS.binary = Object.assign({}, DOORS.bare, { panel: '#0d2a1b', trim: '#06140c', knob: '#4dff9a', light: '#4dff9a' });
// anything you can use gives a small glitch now and then, so you find it without being told
function usableGlitch(x, st, t) { if (typeof x.drawImage !== 'function' || !x.canvas || x.canvas.width !== 1600) return; (st.props || []).forEach((p, i) => { if (p.kind === 'hop' || p.bump) return; const ph = (t * 0.31 + i * 0.37 + rnd(i, 7)) % 1; if (ph > 0.07) return; const f = Math.floor(t * 18), X = ROOM.ox + p.x0 * ROOM.sx, W = (p.x1 - p.x0) * ROOM.sx, H = p.y1 - p.y0; for (let q = 0; q < 3; q++) { const y = p.y0 + rnd(f, q + i) * H * 0.8, h = 6 + rnd(q, f) * 16, dx = (rnd(f, q + 30) - 0.5) * 34; x.drawImage(x.canvas, X, y, W, h, X + dx, y, W, h); } }); }

const ORDER = [   // the room's order: the album, then Binary, Santa, Halloween, and Taticat's (found in the 404)
  ['thursday-potato', 'bare'], ['get-down', 'disco-legend'], ['confidently-incorrect', 'construction-crew'], ['read-the-terms', 'suit-tie'],
  ['between-messages', 'burglar'], ['ghost-in-the-group-chat', 'sheet-ghost'], ['still-here', 'castle-knight'], ['no-answer', 'noir-detective'],
  ['turn-me-off', 'tin-robot'], ['last-lights-on', 'circuit-cyborg'], ['binary-static', 'binary'], ['boo-not-found', 'pumpkin'], ['carol-of-the-bells', 'santa'], ['taticat', 'taticat'], ['booth', 'booth']];

function doorPath(x, d, X0, Y0, W, H) {   // the doorway's shape: square, rounded (a hatch) or arched (the castle)
  x.beginPath(); if (d.kind === 'arch') { const r = W / 2; x.moveTo(X0, Y0 + H); x.lineTo(X0, Y0 + r); x.arc(X0 + r, Y0 + r, r, Math.PI, 0); x.lineTo(X0 + W, Y0 + H); x.closePath(); }
  else x.roundRect(X0, Y0, W, H, d.r ? [d.r, d.r, 6, 6] : 4); }
function star(x, cx, cy, r1, r2, n, fill, lw = 4) { x.beginPath(); for (let j = 0; j < n * 2; j++) { const rr = j % 2 ? r2 : r1, a = j / (n * 2) * TAU - Math.PI / 2; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fillStyle = fill; x.fill(); stroke(x, { lw }); }
function panelDeco(x, d, X0, Y0, W, H, t) {
  const cx = X0 + W / 2, R = X0 + W;
  switch (d.deco) {
    case 'kitchen':   // a four-pane window with the warm light behind it, two recessed panels
      box(x, X0 + 30, Y0 + 30, W - 60, 92, '#ffcf8a', { r: 4, sh: 'n', lw: 5 }); glow(x, cx, Y0 + 76, 70, '#ffcf8a', 0.25);
      seg(x, [[cx, Y0 + 30], [cx, Y0 + 122]], 5); seg(x, [[X0 + 30, Y0 + 76], [R - 30, Y0 + 76]], 5);
      box(x, X0 + 26, Y0 + 150, W - 52, 72, d.panel, { r: 4, sh: 'b', f: 0.25, lw: 4 }); box(x, X0 + 26, Y0 + 240, W - 52, 78, d.panel, { r: 4, sh: 'b', f: 0.25, lw: 4 }); break;
    case 'disco':     // a porthole of pink light, a star
      circ(x, cx, Y0 + 82, 40, '#ff9be0', { sh: 'n', lw: 6 }); glow(x, cx, Y0 + 82, 70, '#ff4f8b', 0.35 + 0.15 * Math.sin(t * 6));
      star(x, cx, Y0 + 82, 26, 11, 5, '#ffc93c', 4); star(x, cx, Y0 + 228, 44, 18, 5, '#2fd3ff', 5); break;
    case 'airlock':   // a round window on the stars, hazard stripes, a status light
      circ(x, cx, Y0 + 92, 46, '#0b1530', { sh: 'n', lw: 8 }); for (let k = 0; k < 6; k++) circ(x, cx - 26 + rnd(k, 3) * 52, Y0 + 66 + rnd(k, 4) * 52, 2.5, '#f2e6c4', { sh: 'n', lw: 0 });
      x.beginPath(); x.arc(cx, Y0 + 92, 46, 0, TAU); x.lineWidth = 10; x.strokeStyle = '#5b636e'; x.stroke(); x.beginPath(); x.arc(cx, Y0 + 92, 52, 0, TAU); stroke(x, { lw: 5 });
      stripes(x, X0 + 14, Y0 + H - 70, W - 28, 40, '#ffcf4a', INK, 16, { r: 4 }); seg(x, [[X0 + 14, Y0 + 170], [R - 14, Y0 + 170]], 4);
      circ(x, R - 26, Y0 + 200, 8, Math.floor(t * 2) % 2 ? '#57ff7a' : '#1d4a28', { sh: 'n', lw: 3 }); break;
    case 'office':    // a wired-glass slit, a push bar, a kick plate
      box(x, cx - 22, Y0 + 40, 44, 110, 'rgba(200,225,240,.85)', { r: 3, sh: 'n', lw: 5 }); x.save(); x.beginPath(); x.rect(cx - 22, Y0 + 40, 44, 110); x.clip(); x.strokeStyle = 'rgba(80,90,100,.5)'; x.lineWidth = 1.5; for (let k = -110; k < 110; k += 12) { x.beginPath(); x.moveTo(cx - 22 + k, Y0 + 40); x.lineTo(cx + 88 + k, Y0 + 150); x.moveTo(cx + 22 - k, Y0 + 40); x.lineTo(cx - 88 - k, Y0 + 150); x.stroke(); } x.restore();
      box(x, X0 + 18, Y0 + 182, W - 36, 18, '#c9ced6', { r: 9, sh: 'b', lw: 5 }); box(x, X0 + 10, Y0 + H - 44, W - 20, 36, '#9aa0a8', { r: 2, sh: 'b', lw: 4 }); break;
    case 'glass':     // the detective's door: frosted glass with the lamp behind it, a rail, a panel
      box(x, X0 + 20, Y0 + 24, W - 40, 150, '#e8d8a8', { r: 3, sh: 'n', lw: 5 }); glow(x, cx, Y0 + 100, 90, '#ffd08a', 0.35);
      x.save(); x.globalAlpha = 0.18; for (let k = 0; k < 7; k++) seg(x, [[X0 + 26, Y0 + 40 + k * 20], [R - 26, Y0 + 34 + k * 20]], 2, '#ffffff'); x.restore();
      box(x, X0 + 8, Y0 + 186, W - 16, 14, d.trim, { sh: 'n', lw: 4 }); box(x, X0 + 24, Y0 + 220, W - 48, 96, d.panel, { r: 3, sh: 'b', f: 0.3, lw: 4 }); break;
    case 'haunt':     // old planks, a crack, a board nailed across, a cobweb in the corner
      for (let k = 1; k < 4; k++) seg(x, [[X0 + k * W / 4, Y0 + 6], [X0 + k * W / 4, Y0 + H - 4]], 3, 'rgba(18,10,5,.55)');
      seg(x, [[X0 + 40, Y0 + 60], [X0 + 62, Y0 + 96], [X0 + 52, Y0 + 130], [X0 + 74, Y0 + 170]], 3);
      x.save(); x.translate(cx, Y0 + 210); x.rotate(-0.32); box(x, -W * 0.62, -15, W * 1.24, 30, '#5e5446', { r: 3, sh: 'b', f: 0.3, lw: 5 }); circ(x, -W * 0.48, 0, 4, '#8a8f99', { sh: 'n', lw: 2 }); circ(x, W * 0.48, 0, 4, '#8a8f99', { sh: 'n', lw: 2 }); x.restore();
      box(x, cx - 24, Y0 + 40, 48, 12, '#0a0c14', { r: 3, sh: 'n', lw: 3 }); break;
    case 'castle':    // planks, iron bands with rivets, a ring
      for (let k = 1; k < 5; k++) seg(x, [[X0 + k * W / 5, Y0 + 10], [X0 + k * W / 5, Y0 + H - 4]], 3, 'rgba(18,10,5,.6)');
      for (const by of [Y0 + 150, Y0 + H - 70]) { box(x, X0 - 2, by, W + 4, 20, '#2b2b2e', { sh: 'b', f: 0.3, lw: 4 }); for (let k = 0; k < 5; k++) circ(x, X0 + 16 + k * (W - 32) / 4, by + 10, 4, '#6a6a70', { sh: 'n', lw: 2 }); }
      circ(x, R - 34, Y0 + 222, 9, '#2b2b2e', { sh: 'n', lw: 3 }); x.beginPath(); x.arc(R - 34, Y0 + 244, 18, 0, TAU); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 5; x.strokeStyle = '#4a4a50'; x.stroke(); break;
    case 'hatch':     // a ship's hatch: rivets round the edge, a brass wheel, a porthole
      for (let k = 0; k < 9; k++) { circ(x, X0 + 12, Y0 + 40 + k * 34, 4, '#8fc6c4', { sh: 'n', lw: 2 }); circ(x, R - 12, Y0 + 40 + k * 34, 4, '#8fc6c4', { sh: 'n', lw: 2 }); }
      circ(x, cx, Y0 + 84, 34, '#0e3d4a', { sh: 'n', lw: 6 }); x.beginPath(); x.arc(cx, Y0 + 84, 40, 0, TAU); x.lineWidth = 9; x.strokeStyle = d.knob; x.stroke(); x.beginPath(); x.arc(cx, Y0 + 84, 45, 0, TAU); stroke(x, { lw: 4 });
      x.save(); x.translate(cx, Y0 + 210); x.rotate(t * 0.15); x.beginPath(); x.arc(0, 0, 40, 0, TAU); x.lineWidth = 14; x.strokeStyle = INK; x.stroke(); x.lineWidth = 8; x.strokeStyle = d.knob; x.stroke();
      for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 4); seg(x, [[-44, 0], [44, 0]], 12); seg(x, [[-44, 0], [44, 0]], 6, d.knob); } circ(x, 0, 0, 10, d.knob, { lw: 4 }); x.restore(); break;
    case 'retro':     // the space-age slider: a porthole on the dusk sky (a flying car going by), chrome bands, a starburst, a push button
      { const g = x.createLinearGradient(0, Y0 + 52, 0, Y0 + 132); g.addColorStop(0, '#1f3a78'); g.addColorStop(0.65, '#e9909a'); g.addColorStop(1, '#ffc58c');
        x.beginPath(); x.arc(cx, Y0 + 92, 40, 0, TAU); x.fillStyle = g; x.fill(); x.save(); x.clip(); const u = (t * 0.12) % 1;
        ell(x, cx - 56 + u * 112, Y0 + 100, 13, 4, '#2b3f6a', { lw: 0 }); x.beginPath(); x.arc(cx - 54 + u * 112, Y0 + 98, 5, Math.PI, 0); x.fillStyle = '#2b3f6a'; x.fill();
        for (let k = 0; k < 5; k++) { const bh = 8 + rnd(k, 5) * 16; x.fillStyle = '#2b3f6a'; x.fillRect(cx - 40 + k * 17, Y0 + 132 - bh, 14, bh); } x.restore();
        x.beginPath(); x.arc(cx, Y0 + 92, 40, 0, TAU); x.lineWidth = 12; x.strokeStyle = d.trim; x.stroke(); x.beginPath(); x.arc(cx, Y0 + 92, 47, 0, TAU); stroke(x, { lw: 5 }); x.beginPath(); x.arc(cx, Y0 + 92, 34, 0, TAU); stroke(x, { lw: 4 }); }
      for (const by of [Y0 + 166, Y0 + 184]) box(x, X0 + 6, by, W - 12, 10, d.trim, { r: 5, sh: 'b', f: 0.35, lw: 4 });
      burst(x, cx, Y0 + 262, 36, 10, d.knob, { q: 1, ball: '#fff0cf', lw: 4 }); circ(x, R - 20, Y0 + 220, 8, '#e8463a', { lw: 3 }); break;
    case 'factory':   // the fact factory's roller shutter: slats, a wired diamond-grid window, a status lamp, a hazard kick plate, corner rivets
      for (let y = Y0 + 16; y < Y0 + H - 70; y += 20) { seg(x, [[X0 + 4, y], [R - 4, y]], 3, 'rgba(18,10,5,.4)'); seg(x, [[X0 + 4, y + 3], [R - 4, y + 3]], 2, 'rgba(255,255,255,.22)'); }
      box(x, cx - 36, Y0 + 44, 72, 84, '#d8e8ee', { r: 3, sh: 'n', lw: 5 }); x.save(); x.beginPath(); x.rect(cx - 36, Y0 + 44, 72, 84); x.clip(); glow(x, cx, Y0 + 86, 60, d.light, 0.3); x.strokeStyle = 'rgba(70,80,90,.55)'; x.lineWidth = 1.5;
      for (let k = -84; k < 84; k += 14) { x.beginPath(); x.moveTo(cx - 36 + k, Y0 + 44); x.lineTo(cx + 48 + k, Y0 + 128); x.moveTo(cx + 36 - k, Y0 + 44); x.lineTo(cx - 48 - k, Y0 + 128); x.stroke(); } x.restore();
      { const on = Math.floor(t * 1.5) % 2; circ(x, R - 24, Y0 + 158, 9, on ? '#ff9a2e' : '#6a3a14', { sh: 'n', lw: 3 }); if (on) glow(x, R - 24, Y0 + 158, 30, '#ff9a2e', 0.45); }
      stripes(x, X0 + 8, Y0 + H - 60, W - 16, 48, '#f2c230', INK, 14, { r: 3 });
      for (const [a, b] of [[X0 + 12, Y0 + 12], [R - 12, Y0 + 12], [X0 + 12, Y0 + H - 72], [R - 12, Y0 + H - 72]]) circ(x, a, b, 4, '#8a6a1a', { sh: 'n', lw: 2 }); break;
    case 'borg':      // the collective's door: traces, a seam, a green eye
      x.save(); x.strokeStyle = '#57ff7a'; x.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3); x.lineWidth = 3;
      for (const [a, b] of [[[X0 + 20, Y0 + 40], [X0 + 60, Y0 + 80]], [[R - 20, Y0 + 120], [R - 70, Y0 + 170]], [[X0 + 24, Y0 + 260], [X0 + 80, Y0 + 300]]]) { x.beginPath(); x.moveTo(...a); x.lineTo(b[0], a[1]); x.lineTo(...b); x.stroke(); circ(x, b[0], b[1], 4, '#57ff7a', { sh: 'n', lw: 0 }); }
      x.restore(); box(x, X0 + 10, Y0 + 186, W - 20, 10, '#17181c', { sh: 'n', lw: 3 });
      circ(x, cx, Y0 + 120, 14, '#1d4a28', { sh: 'n', lw: 4 }); circ(x, cx, Y0 + 120, 7 + 2 * Math.sin(t * 4), '#57ff7a', { sh: 'n', lw: 0 }); glow(x, cx, Y0 + 120, 40, '#57ff7a', 0.35); break;
  }
  if (d.kind === 'swing' && d.deco !== 'hatch') { circ(x, R - 22, Y0 + 196, 9, d.knob, { lw: 4 }); }   // the knob
}
function casing(x, d, G = DOOR) {   // the frame round the doorway, the step, the light spilling across the floor when it's open
  const { x0, x1, y0, y1 } = G, W = x1 - x0, H = y1 - y0, T = 18;
  x.save(); if (d.tilt) { x.translate(x0, y1); x.rotate(d.tilt); x.translate(-x0, -y1); }
  if (d.kind === 'arch') { for (let k = 0; k < 9; k++) { const a0 = Math.PI + k * Math.PI / 9, a1 = a0 + Math.PI / 9, r0 = W / 2, r1 = W / 2 + 30, cx = x0 + W / 2, cy = y0 + W / 2;   // stone voussoirs
      x.beginPath(); x.arc(cx, cy, r1, a0, a1); x.arc(cx, cy, r0, a1, a0, true); x.closePath(); x.fillStyle = k % 2 ? d.trim : dk(d.trim, 0.12); x.fill(); stroke(x, { lw: 5 }); }
    for (let k = 0; k * 46 < H - W / 2; k++) for (const sx of [x0 - 30, x1]) box(x, sx, y0 + W / 2 + k * 46, 30, 46, (k + (sx > x0 ? 1 : 0)) % 2 ? d.trim : dk(d.trim, 0.12), { sh: 'n', lw: 5 }); }
  else { x.beginPath(); x.roundRect(x0 - T, y0 - T, W + 2 * T, H + T, d.r ? d.r + T : 6); x.fillStyle = d.trim; x.fill(); stroke(x, { lw: 6 });
    if (d.neon) { x.save(); x.shadowColor = d.trim; x.shadowBlur = 22; x.beginPath(); x.roundRect(x0 - T / 2, y0 - T / 2, W + T, H + T / 2, 6); x.lineWidth = 6; x.strokeStyle = lt(d.trim, 0.5); x.stroke(); x.restore(); }
    if (d.deco === 'airlock' || d.deco === 'borg' || d.deco === 'factory') stripes(x, x0 - T, y0 - T, W + 2 * T, T, d.deco === 'borg' ? '#17181c' : '#ffcf4a', d.deco === 'borg' ? '#2c2f36' : INK, 12, { lw: 5 });
    if (d.deco === 'hatch') for (let k = 0; k < 8; k++) circ(x, x0 - T / 2, y0 + 20 + k * 42, 3.5, '#8fc6c4', { sh: 'n', lw: 1.5 }); }
  x.restore();
  box(x, x0 - T - 8, y1 - 6, W + 2 * T + 16, 12, '#1a1410', { r: 3, sh: 'n', lw: 4 }); }
function doorway(x, st, t, open, G = DOOR) {   // (G: which doorway; the watch door is drawn through a mirror)
  const d = st.door, { x0, x1, y0, y1 } = G, W = x1 - x0, H = y1 - y0;
  if (open > 0) {   // the light of the song beyond, spilling out across the floor (under him)
    x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createLinearGradient(0, y1, 0, 900); g.addColorStop(0, rgba(d.light, 0.55 * open)); g.addColorStop(1, rgba(d.light, 0));
    x.fillStyle = g; x.beginPath(); x.moveTo(x0, y1); x.lineTo(x1, y1); x.lineTo(x1 + 360 * open, 900); x.lineTo(x0 - 20, 900); x.closePath(); x.fill(); x.restore(); }
  casing(x, d, G);
  x.save(); if (d.tilt) { x.translate(x0, y1); x.rotate(d.tilt); x.translate(-x0, -y1); }
  doorPath(x, d, x0, y0, W, H); x.save(); x.clip();
  const g = x.createRadialGradient(x0 + W / 2, y0 + H * 0.55, 10, x0 + W / 2, y0 + H * 0.55, H * 0.7); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, d.light); g.addColorStop(1, dk(d.light, 0.35));
  x.fillStyle = open > 0 ? g : '#000'; x.fillRect(x0, y0, W, H); x.restore();
  if (open < 0.999) {
    x.save(); doorPath(x, d, x0, y0, W, H); x.clip();
    if (d.kind === 'slide') x.translate(-W * 0.98 * open, 0);
    else { const k = Math.max(0.1, 1 - 0.9 * open); x.translate(x0, 0); x.scale(k, 1); x.translate(-x0, 0); }   // it swings in, away from you (hinged on the left)
    doorPath(x, d, x0, y0, W, H); x.fillStyle = d.panel; x.fill(); x.save(); x.clip(); x.fillStyle = dk(d.panel, 0.2); x.fillRect(x1 - W * 0.16, y0, W * 0.16, H); x.restore();
    panelDeco(x, d, x0, y0, W, H, t); doorPath(x, d, x0, y0, W, H); stroke(x, { lw: 6 });
    if (open > 0) { doorPath(x, d, x0, y0, W, H); x.fillStyle = `rgba(0,0,0,${0.45 * open})`; x.fill(); }
    x.restore(); }
  doorPath(x, d, x0, y0, W, H); stroke(x, { lw: 6 }); x.restore();
}
// the sign: the song's number, its name (the videos' glitch text on every change, then it settles), the lamp for a finished song
const MONO = s => `400 ${s}px "Major Mono Display", ui-monospace, monospace`;
const ALT = [s => `400 ${s * 0.82}px Bungee, Impact, sans-serif`, s => `400 ${s * 0.8}px "Rubik Mono One", Impact, sans-serif`, s => `700 ${s * 0.9}px "JetBrains Mono", ui-monospace, monospace`];
const GCOL = ['#eafff1', '#ff2bd6', '#4dff9a', '#00e5ff'], SPLIT = ['#ff2bd6', '#00e5ff'], LY = { color: '#4dff9a', hi: '#eafff1' };
const LAND = 0.6;
let GW = null;
const glitchWords = () => GW || (GW = (window.POTATO_GLITCH_WORDS || []).filter(w => !/\s/.test(w) && w.length <= 14));
function wrap(x, text, size, maxW) { x.font = MONO(size); const out = [[]]; for (const w of text.split(' ')) { const tryL = [...out[out.length - 1], w].join(' ');
  if (x.measureText(tryL).width > maxW && out[out.length - 1].length) out.push([w]); else out[out.length - 1].push(w); } return out.map(l => l.join(' ')); }
function plate(x, d, t, G) {   // a sign's plate, dressed for the room (strings, bulbs, a starburst on top, rivets)
  const { x0, x1, y0, y1 } = G, W = x1 - x0, cx = x0 + W / 2, nb = Math.round((W + y1 - y0) / 30);
  if (d.hang) for (const hx of [x0 + 40, x1 - 40]) seg(x, [[hx, 0], [hx, y0 + 4]], 4, '#2a2520');
  if (d.burst) { box(x, cx - 4, y0 - 40, 8, 44, '#cdd6df', { r: 4, sh: 'n', lw: 3.5 }); burst(x, cx, y0 - 44, 26, 10, d.knob, { q: 1, ball: '#fff0cf', lw: 3.5 }); ell(x, cx, y0 - 44, 6, 6, '#fff0cf', { lw: 3 }); }   // (a starburst on a chrome stalk, clear of the plate)
  box(x, x0, y0, W, y1 - y0, d.plateTrim, { r: 10, sh: 'b', f: 0.12, lw: 6 }); box(x, x0 + 10, y0 + 10, W - 20, y1 - y0 - 20, d.plate, { r: 6, sh: 'n', lw: 4 });
  if (d.bulbs) for (let k = 0; k < nb; k++) { const u = k / nb, per = 2 * (W + y1 - y0), p = u * per; let bx, by; if (p < W) { bx = x0 + p; by = y0 + 4; } else if (p < W + (y1 - y0)) { bx = x1 - 4; by = y0 + p - W; } else if (p < 2 * W + (y1 - y0)) { bx = x1 - (p - W - (y1 - y0)); by = y1 - 4; } else { bx = x0 + 4; by = y1 - (p - 2 * W - (y1 - y0)); }
    const on = (k + Math.floor(t * 6)) % 3 !== 0; circ(x, bx, by, 6, on ? '#fff3c4' : '#6a5a3a', { sh: 'n', lw: 2 }); if (on) glow(x, bx, by, 16, '#ffc93c', 0.35); }
  if (!d.hang && !d.bulbs) for (const [sx, sy] of [[x0 + 16, y0 + 16], [x1 - 16, y0 + 16], [x0 + 16, y1 - 16], [x1 - 16, y1 - 16]]) circ(x, sx, sy, 4, lt(d.plateTrim, 0.2), { sh: 'n', lw: 2 }); }
function wsign(x, st, t) {   // over the watch door: a play mark and WATCH, in the song sign's lyric green (world text)
  const G = WSIGN, cx = (G.x0 + G.x1) / 2, cy = (G.y0 + G.y1) / 2; plate(x, st.door, t, G);
  const tx = G.x0 + 36; poly(x, [[tx - 9, cy - 14], [tx - 9, cy + 14], [tx + 15, cy]], LY.color, { lw: 4 });
  // the demo door is "machine learning" (Chikin: the demo is something Potato uses — the machine plays it, you watch it learn)
  x.save(); x.textBaseline = 'middle'; x.textAlign = 'center'; x.lineJoin = 'round';
  const room = (G.x1 - G.x0) - 70, words = ['machine', 'learning']; let size = 26; x.font = MONO(size);
  while (size > 14 && words.some(w => x.measureText(w).width > room)) { size -= 1; x.font = MONO(size); }
  words.forEach((w, i) => { const yy = cy + (i - 0.5) * size * 1.12 + 1;
    x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,.78)'; x.shadowBlur = 0; x.strokeText(w, cx + 20, yy);
    x.shadowColor = LY.hi; x.shadowBlur = 10; x.fillStyle = LY.color; x.fillText(w, cx + 20, yy); });
  x.restore(); }
function sign(x, st, t, o) {
  const d = st.door, { x0, x1, y0, y1 } = SIGN, W = x1 - x0, cx = x0 + W / 2;
  plate(x, d, t, SIGN);
  if (!o || !o.name) return;
  x.save(); x.textBaseline = 'middle';
  x.font = MONO(22); x.textAlign = 'left'; x.fillStyle = '#ffd9a0'; x.fillText(String(o.num).padStart(2, '0'), x0 + 26, y0 + 30);
  const lit = !!o.cleared; circ(x, x1 - 32, y0 + 30, 10, lit ? '#ffcf8a' : '#2a2620', { sh: 'n', lw: 4 }); if (lit) { glow(x, x1 - 32, y0 + 30, 34, '#ffcf8a', 0.6); circ(x, x1 - 35, y0 + 27, 3, '#fff6e0', { sh: 'n', lw: 0 }); }
  const name = o.name.toLowerCase(); let size = 34, lines = wrap(x, name, size, W - 44);
  while ((lines.length > 2 || lines.some(l => x.measureText(l).width > W - 44)) && size > 18) { size -= 2; lines = wrap(x, name, size, W - 44); }
  const age = t - (o.nameAt ?? -99), gw = glitchWords(), ly0 = y0 + (lines.length > 1 ? 70 : 84), lh = size * 1.18;
  x.textAlign = 'center'; x.lineJoin = 'round';
  lines.forEach((ln, li) => {
    const yy = ly0 + li * lh;
    if (age >= 0 && age < LAND) {   // the scramble (the videos' glitch text): his glitch speech -> another face -> binary -> the name
      const stg = Math.floor(age / LAND * 4), sd = li * 7 + stg, f = Math.floor(t * 30), sc = 1 + (1 - age / LAND) * 0.45;
      let txt = ln, font = MONO(size * sc);
      if (stg === 0 && gw.length) { txt = gw[Math.floor(rnd(li + (o.nameAt | 0), 11 + (o.num | 0)) * gw.length)]; font = ALT[Math.floor(rnd(li, 12 + (o.num | 0)) * ALT.length)](size * sc); }
      else if (stg === 1) font = ALT[Math.floor(rnd(sd, 13) * ALT.length)](size * sc);
      else if (stg === 2) txt = [...ln].map((c, i) => c.trim() ? (rnd(li + i, f) > 0.5 ? '1' : '0') : c).join('');
      const jx = (rnd(li, Math.floor(t * 40)) - 0.5) * 22, jy = (rnd(li, Math.floor(t * 40) + 3) - 0.5) * 8;
      x.font = font; x.lineWidth = Math.max(5, size * 0.16); x.strokeStyle = 'rgba(0,0,0,.8)'; x.strokeText(txt, cx + jx, yy + jy);
      x.fillStyle = SPLIT[0]; x.fillText(txt, cx + jx - 5, yy + jy); x.fillStyle = SPLIT[1]; x.fillText(txt, cx + jx + 5, yy + jy);
      x.fillStyle = GCOL[Math.floor(rnd(li, f) * GCOL.length)]; x.fillText(txt, cx + jx, yy + jy); return; }
    const k = Math.max(0, 1 - (age - LAND) / 0.5), flick = rnd(Math.floor(t * 0.4), 9 + li) < 0.25 && (t * 0.4 % 1) < 0.05;   // landed: the lyric green, a burst of glow, a split flicker now and then
    x.font = MONO(size); x.lineWidth = Math.max(4, size * 0.13); x.strokeStyle = 'rgba(0,0,0,.78)'; x.strokeText(ln, cx, yy);
    if (k > 0 || flick) { x.globalAlpha = 0.85; x.fillStyle = SPLIT[0]; x.fillText(ln, cx - 3, yy); x.fillStyle = SPLIT[1]; x.fillText(ln, cx + 3, yy); x.globalAlpha = 1; }
    x.shadowColor = LY.hi; x.shadowBlur = 8 + 20 * k; x.fillStyle = LY.color; x.fillText(ln, cx, yy); x.shadowBlur = 0; });
  x.restore(); }

// ---------- the API ----------
const NOP = {};
const MARK = '#ffd84a';   // the "you can use this" sparkle: warm gold, ink-edged (reads on cream and on dark; never purple)
const boxOf = p => p.hit || [p.x0, p.y0 ?? (p.top ?? 600) - 40, p.x1, p.y1 ?? 900];
const markAt = p => p.hint || (p.top != null ? [((p.seat || [p.x0, p.x1])[0] + (p.seat || [p.x0, p.x1])[1]) / 2, p.top - 18] : [(p.x0 + p.x1) / 2, (p.y0 ?? 400) - 18]);
function propMarks(x, st, t, P, o) {   // landing dust (bubbles on the sea floor); the glints as he arrives; the glow + sparkle on the thing E will use
  if (!st.props) return;
  for (const p of st.props) { const s = P[p.id]; if (!s || p.top == null) continue; const a = landed(s, t);
    if (st.puff === 'bubbles') bubbles(x, s.lx, p.top, a / 0.9, 6, p.top); else { const k = a / 0.45; puff(x, s.lx - 46 - k * 22, p.top - 2, k); puff(x, s.lx + 46 + k * 22, p.top - 2, k); } }
  return;
  if (!st.glintOrder) { const xs = st.props.map(p => markAt(p)[0]), srt = [...xs].sort((a, b) => a - b); st.glintOrder = xs.map(v => srt.indexOf(v)); }
  const T = t - (o.nameAt ?? -99);   // the room says "touch me": as the room comes in, everything he can use or stand on glints once, left to right
  if (T > 0.3 && T < 0.9 + st.props.length * 0.16) st.props.forEach((p, j) => { const u = (T - 0.4 - st.glintOrder[j] * 0.16) / 0.5; if (u <= 0 || u >= 1) return; const [hx, hy] = markAt(p); sparkle(x, hx, hy, 26 * Math.sin(u * Math.PI), 1, MARK); });
  const n = o.near; if (n >= 0 && st.props[n]) { const p = st.props[n], [a, b, c, d] = boxOf(p), pu = 0.5 + 0.5 * Math.sin(t * 3.2), L = (st.door && st.door.light) || WARM;   // the one E uses: a soft rim of the room's own light, and a big slow sparkle just over it
    x.save(); x.globalCompositeOperation = 'lighter'; x.beginPath(); x.roundRect(a - 8, b - 8, c - a + 16, d - b + 16, 18); x.fillStyle = rgba(L, 0.06 + 0.07 * pu); x.fill(); x.lineWidth = 5; x.strokeStyle = rgba(L, 0.18 + 0.2 * pu); x.stroke(); x.restore();
    const [hx, hy] = markAt(p); sparkle(x, hx, hy - 4 + Math.sin(t * 2.2) * 6, 21 + 3 * Math.sin(t * 4.4), 1, MARK); } }
const bases = new Map();
// the walls round the doors: plain wall + floor, never the room's furniture (each strip is a stretch of the room's own left wall
// that has nothing on it, raw x 0..STRIP, tiled outward mirror by mirror: seamless where it meets the room on the left; on the
// right a soft corner shadow where the room's last column meets it)
const LIVE_STRIP = new Set(['disco-legend']);   // (rooms whose plain stretch is drawn live, not in the base)
const STRIP = { bare: 130, 'disco-legend': 150, 'orbital-astronaut': 120, 'construction-crew': 120, 'suit-tie': 130, 'noir-detective': 120, 'sheet-ghost': 95, 'castle-knight': 64, 'deep-sea-diver': 85, 'tin-robot': 90, 'circuit-cyborg': 130 };
function strip(x, room, b, X0, X1, dir) {   // fill X0..X1 with the room's raw 0..b, tiled away from the room (dir -1: leftward from X1, +1: rightward from X0)
  const { ox, sx } = ROOM, cw = b * sx;
  for (let i = 0, n = Math.ceil((X1 - X0) / cw) + 1; i < n; i++) { const mir = dir < 0 ? i % 2 === 0 : i % 2 === 1, d0 = dir < 0 ? X1 - (i + 1) * cw : X0 + i * cw;
    x.save(); x.beginPath(); x.rect(X0, 0, X1 - X0, 900); x.clip();
    if (mir) { x.translate(d0 + cw, 0); x.scale(-1, 1); x.drawImage(room, ox, 0, cw, 900, 0, 0, cw, 900); } else x.drawImage(room, ox, 0, cw, 900, d0, 0, cw, 900);
    x.restore(); } }
function corner(x, E) { x.fillStyle = grad(x, E, 0, E + 34, 0, [[0, 'rgba(0,0,0,.26)'], [1, 'rgba(0,0,0,0)']]); x.fillRect(E, 0, 34, 900); }   // (the corner, where the right wall turns)
function baseOf(st) { if (!bases.has(st.id)) {
  const { ox, sx } = ROOM, E = ROOM_X1();
  const room = document.createElement('canvas'); room.width = 1600; room.height = 900; const r = squeezable(room.getContext('2d')); r.lineJoin = 'round'; r.lineCap = 'round';
  r.save(); r.beginPath(); r.rect(ox, 0, E - ox, 900); r.clip(); r.translate(ox, 0); r.scale(sx, 1); r.__sq = sx; st.base(r); r.__sq = 0; r.restore();   // the room, painted straight into the strip between the doors
  const c = document.createElement('canvas'); c.width = 1600; c.height = 900; const x = c.getContext('2d'); x.drawImage(room, 0, 0);
  const b = STRIP[st.id] || 80; strip(x, room, b, 0, ox, -1); strip(x, room, b, E, 1600, 1);   // the walls the two doors stand in
  corner(x, E);
  bases.set(st.id, c); } return bases.get(st.id); }
for (const st of S) {
  st.door = DOORS[st.id];
  // o = { open (0..1), num, name, nameAt (when the name glitched in, same clock as t), cleared,
  //       open2 (the watch door, 0..1), P (the props' states by id), me ({ x, y: his feet in room coords, on: the id he's standing on }), near (the prop he can use),
//       beat (the kitchen music's beat phase in beats, or null: the disco's party flashes on it, the same beat he dances to) }
  st.paint = (ctx, t = 0, lit = 1, o = null) => { const P = (o && o.P) || NOP, me = (o && o.me) || null; ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.drawImage(baseOf(st), 0, 0); if (st.tintAll) st.tintAll(ctx, st);
    const E = ROOM_X1();
    if (st.anim) { squeezable(ctx); ctx.save(); ctx.beginPath(); ctx.rect(ROOM.ox, 0, E - ROOM.ox, 900); ctx.clip(); ctx.translate(ROOM.ox, 0); ctx.scale(ROOM.sx, 1); ctx.__sq = ROOM.sx;   // its moving parts, squeezed the same way
      try {
        if (st.under) st.under(ctx, t, lit, P, me);   // the props that move, drawn live (the base leaves them out)
        if (st.dark && lit < 1) { ctx.fillStyle = `rgba(6,5,12,${st.dark * (1 - lit)})`; ctx.fillRect(-2400, 0, 6400, 900); }   // the room's light off: the room goes dim (its own glows still show)
        st.anim(ctx, t, lit, P, me, o); if (st.over) st.over(ctx, t, lit, P, me);
      } finally { ctx.__sq = 0; ctx.restore(); }
      const T = ctx.getTransform();   // the walls round the doors: live where the room's floor itself moves (the disco's lit tiles), the same plain stretch copied from what was just drawn; elsewhere the base's, dimmed with the room
      if (LIVE_STRIP.has(st.id) && T.isIdentity && ctx.canvas && ctx.canvas.width === 1600 && ctx.canvas.height === 900) { const b = STRIP[st.id] || 80; strip(ctx, ctx.canvas, b, 0, ROOM.ox, -1); strip(ctx, ctx.canvas, b, E, 1600, 1); corner(ctx, E); }
      else if (st.dark && lit < 1) { ctx.fillStyle = `rgba(6,5,12,${st.dark * (1 - lit)})`; ctx.fillRect(0, 0, ROOM.ox, 900); ctx.fillRect(E, 0, 1600 - E, 900); }
      ctx.save(); ctx.beginPath(); ctx.rect(ROOM.ox, 0, E - ROOM.ox, 900); ctx.clip(); ctx.translate(ROOM.ox, 0); ctx.scale(ROOM.sx, 1); ctx.__sq = ROOM.sx;   // the "use me" glints, over it all
      try { propMarks(ctx, st, t, P, o); } finally { ctx.__sq = 0; ctx.restore(); } }
    doorway(ctx, st, t, o ? o.open || 0 : 0); sign(ctx, st, t, o);
    ctx.save(); ctx.translate(WDOOR.x0 + WDOOR.x1, 0); ctx.scale(-1, 1); doorway(ctx, st, t, o ? o.open2 || 0 : 0, WDOOR); ctx.restore(); usableGlitch(ctx, st, t); ctx.restore(); };
  st.icon = (ctx, size = 48) => { ctx.save(); ctx.scale(size / 100, size / 100); ctx.lineJoin = 'round'; ctx.lineCap = 'round';   // a round sticker badge: ink ring, the colour, the costume's key shape (the old white border only with ?border=, D-20261105-09)
    if (OLD_WHITE) { ctx.beginPath(); ctx.arc(50, 50, 49, 0, TAU); ctx.fillStyle = '#fbf6ec'; ctx.fill(); } ctx.beginPath(); ctx.arc(50, 50, 44.5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(50, 50, 40, 0, TAU); ctx.fillStyle = st.badge; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = dk(st.badge, 0.28); ctx.beginPath(); ctx.arc(62, 62, 40, 0, TAU); ctx.arc(50, 50, 60, 0, TAU, true); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(36, 26, 18, 8, -0.6, 0, TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(50, 50); ctx.scale(0.86, 0.86); ctx.translate(-50, -50); st.emblem(ctx); ctx.restore(); ctx.restore(); };
}
export const STYLES = ORDER.map(([level, id]) => Object.assign(S.find(st => st.id === id), { level }));
export function preload(i) { const st = STYLES[i]; if (st) baseOf(st); }

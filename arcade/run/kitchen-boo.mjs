// kitchen-boo.mjs — THE HALLOWEEN KITCHEN (the secret 11th room, under the MONSTERS ONLY mansion). Plan: game/stories/boo-not-found.md §6 + G.
// It's his kitchen, rebuilt under the scariest house in town, full of the trophies of everyone who tried to scare him tonight:
// the ONE raisin in a glass case (one-star plaque), the demon's laptop (a spreadsheet glow), the three mugs (one tea, steaming),
// the cauldron bubbling orange on the stove, a pumpkin for an oven, jars on the shelf (orange, sick green, moon blue) with the
// pink bottle from the park, the witch's broom with her L plate, RENT DUE pinned up like a wanted poster, a coat rack where the
// fridge would be (his sheet hanging, finally just a sheet; the werewolf's vet cone on the top hook), candy-corn floor tiles.
// It's lit from BELOW, orange (the reverse of every other room). Purple nowhere: purple is only ever him.
//
// Same shape as a kitchens.mjs `S` entry (id, name, outfit, badge, dark, base, under, anim, emblem, props) + its door + its strip.
// It IMPORTS NOTHING (its own copy of the small drawing kit) so kitchens.mjs can import it without a cycle. NOT WIRED IN YET:
// the wiring is in game/stories/boo-not-found.md §I (index.mjs, main.mjs, kitchens.mjs, intro.mjs — the engine owners' files).
// paintRoom(ctx, t, lit, P, me, o) paints it alone on a 1600 x 900 canvas, unsqueezed (the level's ending + game/boo/kitchen.html).
const INK = '#120a05', TAU = Math.PI * 2;
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
const dk = (c, k = 0.22) => mix(c, '#000000', k), lt = (c, k = 0.25) => mix(c, '#ffffff', k);
const rgba = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };
const OV = x => (x.__sq ? 1 / x.__sq : 1);   // (kitchens.mjs squeezes rooms sideways: round things drawn this much wider stay round)
// ---------- the drawing kit (ink + one cel band) ----------
function stroke(x, o = {}) { if (o.lw === 0) return; x.lineWidth = o.lw ?? 6; x.strokeStyle = o.ink || INK; x.stroke(); }
function box(x, X, Y, W, H, fill, o = {}) { x.beginPath(); x.roundRect(X, Y, W, H, o.r || 0); x.fillStyle = fill; x.fill();
  const sh = o.sh || 'r', f = o.f ?? 0.18; if (sh !== 'n') { x.save(); x.clip(); x.fillStyle = dk(fill, o.sk ?? 0.2);
    if (sh === 'r') x.fillRect(X + W * (1 - f), Y, W * f, H); else if (sh === 'b') x.fillRect(X, Y + H * (1 - f), W, H * f); else if (sh === 't') x.fillRect(X, Y, W, H * f); else x.fillRect(X, Y, W * f, H); x.restore(); }
  stroke(x, o); }
function poly(x, pts, fill, o = {}) { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fillStyle = fill; x.fill(); stroke(x, o); }
function ell(x, cx, cy, rx, ry, fill, o = {}) { x.beginPath(); x.ellipse(cx, cy, rx * OV(x), ry, o.rot || 0, 0, TAU); x.fillStyle = fill; x.fill();
  if (o.band) { x.save(); x.clip(); x.fillStyle = dk(fill, 0.2); x.fillRect(cx - rx * 2, cy + ry * (1 - 2 * o.band), rx * 4, ry * 2); x.restore(); x.beginPath(); x.ellipse(cx, cy, rx * OV(x), ry, o.rot || 0, 0, TAU); } stroke(x, o); }
function circ(x, cx, cy, r, fill, o = {}) { ell(x, cx, cy, r, r, fill, o); }
function seg(x, pts, lw = 6, col = INK) { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.lineWidth = lw; x.strokeStyle = col; x.stroke(); }
function grad(x, x0, y0, x1, y1, stops) { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach(([k, c]) => g.addColorStop(k, c)); return g; }
function glow(x, cx, cy, r, col, a) { if (a <= 0) return; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); x.restore(); }
function cone(x, ax, ay, hw, bx0, bx1, by, col, a) {   // a light cone (works pointing up too: by < ay)
  const g = x.createRadialGradient(ax, ay, 6, ax, (ay + by) / 2, Math.abs(by - ay) * 0.95); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.beginPath(); x.moveTo(ax - hw, ay); x.lineTo(bx0, by); x.lineTo(bx1, by); x.lineTo(ax + hw, ay); x.closePath(); x.fill(); x.restore(); }
function flame(x, cx, cy, h, t, s = 0, w = h * 0.42) { const k = 1 + 0.16 * Math.sin(t * 13 + s * 7) + 0.1 * Math.sin(t * 23 + s * 3), H = h * k, sw = Math.sin(t * 9 + s * 5) * w * 0.35;
  const tear = (H, W, col, lw) => { x.beginPath(); x.moveTo(cx + sw, cy - H); x.bezierCurveTo(cx + W * 1.25, cy - H * 0.45, cx + W, cy, cx, cy); x.bezierCurveTo(cx - W, cy, cx - W * 1.25, cy - H * 0.45, cx + sw, cy - H); x.closePath(); x.fillStyle = col; x.fill(); if (lw) { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); } };
  tear(H, w, '#ff8a2b', Math.max(2, h * 0.08)); tear(H * 0.6, w * 0.55, '#ffd84a', 0); }
function steam(x, cx, cy, t, n = 3, h = 90, a = 0.35, w = 7) { x.save(); for (let i = 0; i < n; i++) { const ph = (t * 0.45 + i / n) % 1; x.globalAlpha = a * Math.sin(ph * Math.PI); x.strokeStyle = '#f4efe6'; x.lineWidth = w * (1 - ph * 0.5); x.beginPath();
  for (let k = 0; k <= 10; k++) x.lineTo(cx + (i - (n - 1) / 2) * 12 + Math.sin(k * 0.7 + t * 2.2 + i * 2) * 9, cy - ph * h * 0.6 - k * h * 0.04); x.stroke(); } x.restore(); }
function text(x, s, cx, cy, size, col, o = {}) { x.save(); x.translate(cx, cy); x.rotate(o.rot || 0); x.scale(OV(x), 1); x.font = `${o.weight || 900} ${size}px ${o.font || 'Rubik Mono One, "Major Mono Display", monospace'}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (o.lw) { x.lineWidth = o.lw; x.strokeStyle = o.ink || INK; x.lineJoin = 'round'; x.strokeText(s, 0, 0); } x.fillStyle = col; x.fillText(s, 0, 0); x.restore(); }
// prop state helpers (the same meaning as kitchens.mjs: P[id] = { on, t0, land, ... })
const Z = Object.freeze({ on: false, t0: -99, land: -99, lx: 0, n: 0 });
const since = (s, t) => t - s.t0, landed = (s, t) => t - s.land;
const ez = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const flip = (s, t, d = 0.3) => ez(s.on ? since(s, t) / d : 1 - since(s, t) / d);
const wob = (a, d = 0.9, f = 16) => a >= 0 && a < d ? Math.sin(a * f) * (1 - a / d) : 0;

// ---------- the pieces ----------
function candyCorn(x, cx, cy, s, rot = 0) { x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s);
  x.beginPath(); x.moveTo(0, -26); x.quadraticCurveTo(16, 6, 18, 20); x.quadraticCurveTo(0, 28, -18, 20); x.quadraticCurveTo(-16, 6, 0, -26); x.closePath(); x.fillStyle = '#ff8a2b'; x.fill();
  x.save(); x.clip(); x.fillStyle = '#ffd84a'; x.fillRect(-30, 6, 60, 30); x.fillStyle = '#fff6e0'; x.fillRect(-30, -40, 60, 26); x.restore(); stroke(x, { lw: 4 }); x.restore(); }
function jackFace(x, cx, cy, s, glowK) { const c = mix('#3a1606', '#ffd84a', glowK); x.fillStyle = c;
  poly(x, [[cx - 34 * s, cy - 14 * s], [cx - 14 * s, cy - 14 * s], [cx - 24 * s, cy - 32 * s]], c, { lw: 3 }); poly(x, [[cx + 14 * s, cy - 14 * s], [cx + 34 * s, cy - 14 * s], [cx + 24 * s, cy - 32 * s]], c, { lw: 3 });
  poly(x, [[cx - 44 * s, cy + 6 * s], [cx + 44 * s, cy + 6 * s], [cx + 30 * s, cy + 26 * s], [cx + 14 * s, cy + 16 * s], [cx, cy + 28 * s], [cx - 14 * s, cy + 16 * s], [cx - 30 * s, cy + 26 * s]], c, { lw: 3 }); }

export const BOO_DOOR = { kind: 'swing', panel: '#4a2a1a', trim: '#2a1810', knob: '#e0b45a', light: '#ffb04a', plate: '#1a0d06', plateTrim: '#c4521a', deco: 'haunt', hang: true, tilt: 0.02 };
export const BOO_STRIP = 100;   // a plain stretch of the left wall (raw x 0..100) with nothing on it
const SAVE_KEY = 'potato404.runner.v1';
export function booUnlocked() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); return !!(s.secrets && s.secrets.boo); } catch (e) { return false; } }

const WALL_TOP = '#140a06', WALL_LOW = '#5a2a10', BRICK = '#3a1c0e';
export const BOO_STYLE = {
  id: 'boo-kitchen', name: 'the basement kitchen', outfit: null, badge: '#c4521a', dark: 0.34, level: 'boo-not-found',
  locked: () => !booUnlocked(),
  base(x) {
    // the wall: brick, warm at the bottom where the light comes from (lit from BELOW), dark up top
    x.fillStyle = grad(x, 0, 0, 0, 640, [[0, WALL_TOP], [0.55, '#2a1309'], [1, WALL_LOW]]); x.fillRect(0, 0, 1600, 640);
    for (let r = 0; r < 16; r++) for (let c = 0; c < 18; c++) { const X = c * 96 + (r % 2) * 48 - 20, Y = r * 40 + 2; x.fillStyle = rgba(r > 9 ? '#8a3a12' : '#3a1c0e', 0.18 + rnd(r, c) * 0.12); x.fillRect(X + 3, Y + 3, 90, 34); }
    x.fillStyle = 'rgba(0,0,0,.35)'; for (let r = 0; r < 16; r++) x.fillRect(0, r * 40, 1600, 3);
    // the high basement slit (the street at pavement level, moonlit)
    x.fillStyle = grad(x, 0, 120, 0, 200, [[0, '#0b1426'], [1, '#22304a']]); x.fillRect(150, 120, 300, 80); x.fillStyle = '#2a2622'; x.fillRect(150, 180, 300, 20);
    x.lineWidth = 14; x.strokeStyle = '#3a2618'; x.strokeRect(150, 120, 300, 80); seg(x, [[250, 120], [250, 200]], 8, '#3a2618'); seg(x, [[350, 120], [350, 200]], 8, '#3a2618'); x.lineWidth = 5; x.strokeStyle = INK; x.strokeRect(142, 112, 316, 96);
    // the shelf (where cabinets would be): glowing jars, the pink bottle from the park, the witch's L plate
    box(x, 820, 262, 620, 18, '#4a2a16', { r: 3, sh: 'b', lw: 5 }); for (const bx of [850, 1400]) poly(x, [[bx, 280], [bx + 20, 280], [bx + 6, 320]], '#3a2010', { lw: 4 });
    box(x, 820, 150, 620, 14, '#4a2a16', { r: 3, sh: 'b', lw: 5 });
    for (const [jx, h, col] of [[860, 70, '#ff8a2b'], [930, 54, '#8fdc3a'], [1000, 80, '#9fe3ff'], [1180, 60, '#ff8a2b'], [1250, 72, '#8fdc3a']]) { box(x, jx, 262 - h, 50, h, rgba(col, 0.55), { r: 8, lw: 4 }); box(x, jx - 3, 254 - h, 56, 12, '#5a3a22', { r: 3, sh: 'n', lw: 3 });
      for (let k = 0; k < 3; k++) circ(x, jx + 12 + k * 12, 262 - h * (0.3 + 0.2 * k), 4, lt(col, 0.4), { lw: 0, sh: 'n' }); }
    // the pink bottle (the vampire's, from the bench)
    box(x, 1080, 206, 40, 56, '#f2a6c8', { r: 10, lw: 4 }); box(x, 1090, 186, 20, 22, '#f2a6c8', { r: 4, lw: 4 }); box(x, 1086, 178, 28, 10, '#ffffff', { r: 3, sh: 'n', lw: 3 }); box(x, 1086, 224, 28, 18, '#ffffff', { r: 2, sh: 'n', lw: 2 });
    // the L plate
    box(x, 1320, 196, 62, 62, '#ffffff', { r: 6, sh: 'n', lw: 4 }); text(x, 'L', 1351, 230, 44, '#e8463a', { font: 'Arial Black, Impact, sans-serif' });
    // jars + a tiny skull on the top shelf
    for (const [jx, h] of [[880, 46], [960, 38], [1290, 52]]) { box(x, jx, 150 - h, 40, h, 'rgba(255,170,80,.35)', { r: 6, lw: 4 }); }
    circ(x, 1120, 128, 20, '#f1ead2', { lw: 4, band: 0.25 }); circ(x, 1112, 126, 4, INK, { lw: 0 }); circ(x, 1128, 126, 4, INK, { lw: 0 }); box(x, 1110, 140, 20, 10, '#f1ead2', { sh: 'n', lw: 3 });
    // RENT DUE, pinned up like a wanted poster
    x.save(); x.translate(650, 240); x.rotate(-0.06); box(x, -50, -62, 100, 124, '#fbf6ec', { lw: 5, sh: 'b', f: 0.1 }); text(x, 'rent', 0, -26, 26, INK, { font: '"Major Mono Display", monospace', weight: 400 }); text(x, 'due', 0, 4, 30, '#e8463a', { font: '"Major Mono Display", monospace', weight: 400 });
    for (let k = 0; k < 4; k++) seg(x, [[-34, 26 + k * 8], [34 - rnd(k, 2) * 30, 26 + k * 8]], 2.5, '#9a9080'); circ(x, 0, -56, 6, '#e8463a', { lw: 3 }); x.restore();
    // the counter: the demon's laptop, the three mugs; the stove with the cauldron
    box(x, 800, 450, 650, 190, '#3a2416', { lw: 6, f: 0.12 }); box(x, 790, 438, 670, 20, '#6a4428', { r: 4, sh: 'b', lw: 5 });
    for (const dx of [820, 1220]) { box(x, dx, 480, 150, 130, '#2e1c10', { r: 4, sh: 'r', lw: 4 }); circ(x, dx + 130, 545, 6, '#c8a050', { lw: 3 }); }
    // the laptop (open, a spreadsheet glow)
    poly(x, [[860, 438], [960, 438], [972, 446], [848, 446]], '#5a5e66', { lw: 4 }); poly(x, [[870, 438], [950, 438], [956, 372], [864, 372]], '#3a3e44', { lw: 4 });
    x.fillStyle = '#c8f0d0'; x.fillRect(872, 380, 76, 50); for (let r = 0; r < 5; r++) seg(x, [[874, 388 + r * 9], [946, 388 + r * 9]], 1.5, '#5a8a6a'); for (let c = 1; c < 4; c++) seg(x, [[872 + c * 19, 380], [872 + c * 19, 430]], 1.5, '#5a8a6a');
    // three mugs (red, blue, the tea)
    for (const [mx, col] of [[1240, '#d8402e'], [1300, '#3a7ad8'], [1360, '#f4efe6']]) { box(x, mx, 400, 40, 38, col, { r: 6, lw: 4 }); x.beginPath(); x.arc(mx + 42, 418, 10, -1.3, 1.3); stroke(x, { lw: 5 }); }
    // the pumpkin oven under the counter (its mouth breathes in anim)
    ell(x, 1100, 560, 110, 80, '#e2701e', { lw: 6, band: 0.3 }); for (const dx of [-60, 0, 60]) { x.beginPath(); x.ellipse(1100 + dx, 560, 30, 78, 0, -1.4, 1.4); x.lineWidth = 3; x.strokeStyle = 'rgba(80,30,5,.45)'; x.stroke(); }
    box(x, 1088, 470, 22, 22, '#4a6a2a', { r: 4, lw: 4 });
    // the stove top + cauldron (the cauldron is drawn live in anim: it bubbles and squashes when he lands on it)
    box(x, 990, 430, 160, 14, '#2a2a2e', { r: 3, sh: 'n', lw: 4 });
    // the coat rack where the fridge would be: his sheet (just a sheet now), the werewolf's vet cone on the top hook
    box(x, 1516, 170, 18, 470, '#5a3a22', { r: 6, lw: 5 }); box(x, 1480, 620, 90, 20, '#5a3a22', { r: 6, lw: 5 });
    for (const [hy, d] of [[200, -1], [200, 1], [290, -1]]) seg(x, [[1525, hy], [1525 + d * 46, hy - 24]], 8);
    // the table: the ONE raisin in a glass case, a one-star plaque
    box(x, 560, 556, 420, 28, '#5a3a22', { r: 6, sh: 'b', lw: 6 }); for (const lx of [590, 930]) box(x, lx, 584, 24, 180, '#4a2e1c', { lw: 6 });
    box(x, 846, 544, 68, 12, '#3a2416', { r: 3, sh: 'n', lw: 4 });
    // the broom with its L plate, leaning by the table (drawn live: it can slide down)
    // the floor: candy-corn tiles, a dark lip
    x.fillStyle = '#2a1408'; x.fillRect(0, 640, 1600, 260);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 22; c++) { const X = c * 76 + (r % 2) * 38 - 20, Y = 660 + r * 62, up = (c + r) % 2 === 0;
      x.save(); x.beginPath(); if (up) { x.moveTo(X, Y + 56); x.lineTo(X + 38, Y); x.lineTo(X + 76, Y + 56); } else { x.moveTo(X, Y); x.lineTo(X + 76, Y); x.lineTo(X + 38, Y + 56); } x.closePath(); x.clip();
      x.fillStyle = '#ff8a2b'; x.fillRect(X, Y, 76, 56); x.fillStyle = up ? '#ffd84a' : '#fff6e0'; x.fillRect(X, up ? Y + 38 : Y, 76, 18); x.fillStyle = up ? '#fff6e0' : '#ffd84a'; x.fillRect(X, up ? Y : Y + 38, 76, 18);
      x.restore(); x.beginPath(); if (up) { x.moveTo(X, Y + 56); x.lineTo(X + 38, Y); x.lineTo(X + 76, Y + 56); } else { x.moveTo(X, Y); x.lineTo(X + 76, Y); x.lineTo(X + 38, Y + 56); } x.closePath(); stroke(x, { lw: 3 }); }
    x.fillStyle = 'rgba(30,10,0,.35)'; x.fillRect(0, 640, 1600, 260); x.fillStyle = INK; x.fillRect(0, 634, 1600, 10);
    // a calm top (the menu sits there)
    x.fillStyle = grad(x, 0, 0, 0, 380, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); x.fillRect(0, 0, 1600, 380);
  },
  under(x, t, lit, P = {}) {
    // the room's light is FROM BELOW: the pumpkin oven + the cauldron throw it up the wall
    const oven = flip(P.oven || Z, t, 0.4);
    cone(x, 1100, 600, 100, 860, 1340, 120, '#ff8a2b', 0.18 + 0.12 * lit + 0.1 * oven);
    cone(x, 1070, 420, 60, 900, 1260, 60, '#ffb04a', 0.12 + 0.1 * lit);
  },
  anim(x, t, lit, P = {}, me = null, o = null) {
    const beat = o && o.beat != null ? o.beat : t * 1.8, kick = Math.max(0, 1 - (beat % 1) * 3);
    // the slit: trick-or-treaters' feet pass right to left; once, a sheet's hem drifts by
    x.save(); x.beginPath(); x.rect(150, 120, 300, 80); x.clip();
    for (let i = 0; i < 3; i++) { const ph = ((t * 0.16 + i / 3) % 1), fx = 470 - ph * 360; for (const d of [0, 1]) { const st = Math.sin(t * 7 + i + d * 3) * 6; box(x, fx + d * 26 + st, 168, 18, 14, ['#ff8a2b', '#3a3a3a', '#8fdc3a'][i], { r: 5, lw: 3, sh: 'n' }); } }
    const hp = (t * 0.05) % 1; if (hp < 0.4) { const hxp = 470 - hp / 0.4 * 380; x.beginPath(); x.moveTo(hxp, 140); for (let k = 0; k <= 6; k++) x.lineTo(hxp + k * 16, 176 + (k % 2) * 8); x.lineTo(hxp + 96, 140); x.closePath(); x.fillStyle = '#f4f1ea'; x.fill(); stroke(x, { lw: 3 }); }
    x.restore();
    // the hanging jack-o-lantern lamp (the `lamp` prop drives `lit`)
    const lamp = P.lamp || Z, sw = wob(since(lamp, t), 2.4, 4.2) * 0.08; x.save(); x.translate(770, 0); x.rotate(sw); seg(x, [[0, 0], [0, 300]], 5, '#2a1a10');
    ell(x, 0, 350, 54, 46, mix('#6a3010', '#f07a1a', 0.4 + 0.6 * lit), { lw: 6, band: 0.3 }); box(x, -6, 296, 12, 14, '#4a6a2a', { r: 3, lw: 3 }); jackFace(x, 0, 350, 0.95, lit * (0.8 + 0.2 * kick));
    if (lit > 0) glow(x, 0, 350, 220, '#ffb04a', 0.3 * lit); x.restore();
    if (lit > 0) cone(x, 770, 390, 40, 560, 980, 640, '#ffb04a', 0.12 * lit);
    // the cauldron: bubbling orange; it squashes (jelly) when he lands on its rim, and splashes
    const cl = landed(P.cauldron || Z, t), sq = wob(cl, 0.8, 18) * 0.12, cx = 1070, cy = 400;
    x.save(); x.translate(cx, cy + 30); x.scale(1 + sq, 1 - sq); x.translate(-cx, -cy - 30);
    ell(x, cx, cy + 6, 74, 52, '#24221f', { lw: 6, band: 0.35 }); ell(x, cx, cy - 34, 78, 16, '#3a3632', { lw: 5 }); ell(x, cx, cy - 34, 66, 11, '#ff8a2b', { lw: 3 });
    for (let i = 0; i < 4; i++) { const ph = (t * 1.3 + i * 0.27) % 1, bx = cx - 40 + i * 26 + Math.sin(i * 5) * 6; circ(x, bx, cy - 36 - ph * 18, 5 + ph * 5, rgba('#ffd84a', 1 - ph), { lw: 2, sh: 'n' }); }
    for (const d of [-1, 1]) ell(x, cx + d * 62, cy + 50, 10, 10, '#24221f', { lw: 4, sh: 'n' });
    for (let k = 0; k < 3; k++) candyCorn(x, cx - 40 + k * 40, cy - 46, 0.55, (k - 1) * 0.3);
    x.restore(); glow(x, cx, cy - 34, 120, '#ff8a2b', 0.28 + 0.2 * kick);
    if (cl >= 0 && cl < 0.7) for (let i = 0; i < 8; i++) { const a = -Math.PI * (0.15 + 0.7 * rnd(i, 1)), r = cl * 180; circ(x, cx + Math.cos(a) * r, cy - 40 + Math.sin(a) * r + cl * cl * 300, 6, '#ff8a2b', { lw: 2, sh: 'n' }); }
    steam(x, cx, cy - 50, t, 3, 110, 0.3);
    // the pumpkin oven's mouth breathes on the beat; switched on, it opens and bats fly out
    const ov = flip(P.oven || Z, t, 0.35); jackFace(x, 1100, 562, 1.35, 0.55 + 0.35 * kick + 0.1 * ov); glow(x, 1100, 570, 150, '#ff8a2b', 0.18 + 0.16 * kick + 0.2 * ov);
    if (ov > 0) { const a = since(P.oven || Z, t); for (let i = 0; i < 4; i++) { const u = (a * 0.8 + i * 0.22) % 1.6; if (u > 1.2 || !(P.oven || Z).on) continue; const bx = 1100 + (rnd(i, 3) - 0.5) * 300 * u, by = 560 - u * 420; x.save(); x.translate(bx, by);
      const fl = Math.sin(t * 22 + i) * 10; poly(x, [[0, 0], [-34, -10 + fl], [-22, 4], [-10, 0], [0, 10], [10, 0], [22, 4], [34, -10 + fl]], '#140a10', { lw: 3 }); x.restore(); } }
    // the mug of tea steams
    steam(x, 1380, 396, t, 2, 70, 0.32, 5);
    // the laptop's spreadsheet glows
    glow(x, 910, 405, 90, '#c8f0d0', 0.12 + 0.04 * Math.sin(t * 2));
    // THE ONE RAISIN in its glass case (the case prop: a spotlight on it); a one-star plaque
    const cs = flip(P.case || Z, t, 0.3); if (cs > 0) cone(x, 880, 120, 10, 830, 930, 556, '#fff2c8', 0.35 * cs);
    x.save(); x.translate(0, 36); box(x, 852, 450, 56, 58, 'rgba(200,230,240,.22)', { r: 4, lw: 4, sh: 'n' }); seg(x, [[858, 458], [870, 470]], 2.5, 'rgba(255,255,255,.7)');
    ell(x, 880, 494, 12, 9, '#4a2416', { lw: 3, band: 0.4 }); for (let k = 0; k < 3; k++) seg(x, [[872 + k * 6, 488], [874 + k * 6, 500]], 1.5, '#2a1208'); x.restore();
    box(x, 920, 530, 40, 22, '#c8a050', { r: 3, lw: 3, sh: 'n' }); x.save(); x.translate(60, 3); poly(x, [[880, 527], [883, 534], [890, 534], [884, 538], [886, 545], [880, 541], [874, 545], [876, 538], [870, 534], [877, 534]], '#ffd84a', { lw: 1.5 }); x.restore();
    // the broom with the L plate (knock it: it slides down the wall, the plate swings)
    const br = P.broom || Z, ba = since(br, t), slide = br.on ? ez(ba / 0.6) : 1 - ez(ba / 0.6), bsw = wob(ba, 2.0, 7) * 0.4;
    x.save(); x.translate(490, 640); x.rotate(-0.18 - 0.9 * slide); seg(x, [[0, 0], [0, -250]], 12); seg(x, [[0, 0], [0, -250]], 7, '#8a5a2a');
    poly(x, [[-30, -250], [30, -250], [44, -330], [-44, -330]], '#c8a050', { lw: 5 }); for (let k = -3; k <= 3; k++) seg(x, [[k * 9, -256], [k * 13, -326]], 2, '#8a6a30');
    x.save(); x.translate(0, -120); x.rotate(bsw); seg(x, [[0, 0], [0, 18]], 3); box(x, -20, 18, 40, 40, '#ffffff', { r: 4, sh: 'n', lw: 3 }); text(x, 'L', 0, 39, 28, '#e8463a', { font: 'Arial Black, Impact, sans-serif' }); x.restore(); x.restore();
    // the coat rack: his sheet, finally just a sheet; the vet cone on the top hook (knock it: the sheet flaps, the cone spins)
    const rk = P.rack || Z, ra = since(rk, t), flap = wob(ra, 2.0, 9);
    x.save(); x.translate(1478, 210); x.rotate(0.05 + flap * 0.12); x.beginPath(); x.moveTo(-20, 0); x.quadraticCurveTo(-46, 160, -40, 330); for (let k = 0; k <= 5; k++) x.lineTo(-40 + k * 16, 330 + (k % 2 ? -14 : 6) + Math.sin(t * 2 + k) * 4); x.quadraticCurveTo(40, 160, 20, 0); x.closePath();
    x.fillStyle = '#f4f1ea'; x.fill(); x.save(); x.clip(); x.fillStyle = '#d8dce4'; x.fillRect(10, 0, 60, 360); x.restore(); stroke(x, { lw: 5 }); x.restore();
    x.save(); x.translate(1572, 176); x.rotate(Math.sin(ra * 12) * (ra < 1.5 ? 1 - ra / 1.5 : 0) * 1.2 + 0.2); poly(x, [[-30, -16], [30, -16], [44, 22], [-44, 22]], '#f4f6f8', { lw: 4 }); seg(x, [[-36, 4], [36, 4]], 2.5, '#b8c0c8'); x.restore();
    // the light from below, on everything: a warm floor bounce
    glow(x, 800, 900, 700, '#ff8a2b', 0.12 + 0.1 * lit);
  },
  emblem(x) {   // the cauldron, orange glow, three candy corns on the rim (never a Potato image)
    glow(x, 50, 48, 46, '#ff8a2b', 0.5); ell(x, 50, 58, 30, 22, '#24221f', { lw: 5 }); ell(x, 50, 40, 32, 8, '#ff8a2b', { lw: 4 });
    for (let k = 0; k < 3; k++) candyCorn(x, 34 + k * 16, 32, 0.32, (k - 1) * 0.3); },
  props: [
    { id: 'lamp', kind: 'switch', lamp: true, startOn: true, x0: 700, x1: 840, y0: 300, y1: 430, hint: [770, 296], sfx: { on: 'lampOn', off: 'lampOff' } },
    { id: 'cauldron', kind: 'hop', seat: [1010, 1130], x0: 990, x1: 1150, top: 404, y0: 396, y1: 470, sfx: { land: 'bubble' }, face: { land: ['wide', 0.9] } },
    { id: 'oven', kind: 'switch', busy: 1.6, x0: 1000, x1: 1200, y0: 470, y1: 640, hint: [1100, 462], sfx: { on: 'fridgeOpen', off: 'fridgeShut' }, after: { on: [[0.3, 'flare']] }, face: { on: ['startled', 0.9] } },
    { id: 'rack', kind: 'knock', busy: 2, x0: 1460, x1: 1595, y0: 180, y1: 640, hint: [1525, 170], sfx: { on: 'creak', off: 'thud' }, face: { on: ['smirk', 1.0] } },
    { id: 'case', kind: 'switch', x0: 840, x1: 920, y0: 500, y1: 556, hint: [880, 490], sfx: { on: 'clang', off: 'flick' }, face: { on: ['deadpan', 1.2] } },
    { id: 'broom', kind: 'knock', busy: 2.4, x0: 440, x1: 540, y0: 380, y1: 640, hint: [490, 370], sfx: { on: 'scoot', off: 'thud' } },
    { id: 'table', kind: 'hop', x0: 560, x1: 980, top: 556, y0: 540, y1: 770, sfx: { land: 'clatter' } },
    { id: 'counter', kind: 'hop', x0: 820, x1: 1450, top: 450, y0: 440, y1: 470, sfx: { land: 'thunk' } },
  ],
};
// paint the room alone, 1600 x 900, unsqueezed (the level's ending, game/boo/kitchen.html); the base is cached
let BASE = null;
BOO_STYLE.paintRoom = (ctx, t = 0, lit = 1, P = {}, me = null, o = null) => {
  if (!BASE) { BASE = document.createElement('canvas'); BASE.width = 1600; BASE.height = 900; const b = BASE.getContext('2d'); b.lineJoin = 'round'; b.lineCap = 'round'; BOO_STYLE.base(b); }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.drawImage(BASE, 0, 0);
  BOO_STYLE.under(ctx, t, lit, P, me); if (lit < 1) { ctx.fillStyle = `rgba(6,5,12,${BOO_STYLE.dark * (1 - lit)})`; ctx.fillRect(0, 0, 1600, 900); }
  BOO_STYLE.anim(ctx, t, lit, P, me, o); ctx.restore(); };

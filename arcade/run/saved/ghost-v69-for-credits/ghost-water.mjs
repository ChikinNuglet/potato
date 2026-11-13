// ghost-water.mjs — Ghost in the Group Chat: the glow on a text bubble Potato can still glitch.
// Chikin (Nov 1): "the outlines of the boxes glow where potato is standing with little glitch energy" · "only the boxes he can
// glitch" · "like digital glitching water". So: his glitch energy runs along the bubble's outline like water — liquid ripples
// of light flowing out from under his feet, both ways round, PIXEL-STEPPED (square pixels, quantised brightness, a stepped
// wobble), his purples with flecks of binary green; a dark pool of it soaking into the bubble under him, a crest of pixels standing
// up off the edge (the water's surface), a glitch SPLASH (pixel droplets + 0s and 1s) when he lands. Every other bubble he can
// still glitch gets a steady purple rim with a pixel crawl round it (the light that says "this one's still his"), and its crawl
// speeds up as her Read gets close.
// Pure canvas drawing (no state but a cache of outline shapes): everything is a function of the arguments. Purple is Potato's only.
const PURP = ['#7b3cf2', '#9a52ff', '#e03ccf', '#c9a7ff'], GREEN = '#4dff9a', WHITE = '#f3ecff';
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const MONO = {}, mono = px => MONO[px] || (MONO[px] = `700 ${px}px "JetBrains Mono", ui-monospace, monospace`);
// the outline of a rounded rect, sampled every `step` px by arc length from the top-left corner's end, clockwise — relative to its
// top-left (cached by shape: the bubbles only move, they don't change shape every frame). -> { L, n, d, x, y, nx, ny, r, sx }
const OUT = new Map();
export function outline(R, step) {
  const r = Math.max(0, Math.min(R.r, R.w / 2, R.h / 2)), key = `${Math.round(R.w)}|${Math.round(R.h)}|${Math.round(r)}|${step}`;
  let o = OUT.get(key); if (o) return o;
  const a = Math.PI * r / 2, sx = Math.max(0, R.w - 2 * r), sy = Math.max(0, R.h - 2 * r), L = 2 * sx + 2 * sy + 4 * a, n = Math.max(4, Math.floor(L / step));
  const segs = [['l', r, 0, 1, 0, sx, 0, -1], ['c', R.w - r, r, -Math.PI / 2, a], ['l', R.w, r, 0, 1, sy, 1, 0], ['c', R.w - r, R.h - r, 0, a],
    ['l', R.w - r, R.h, -1, 0, sx, 0, 1], ['c', r, R.h - r, Math.PI / 2, a], ['l', 0, R.h - r, 0, -1, sy, -1, 0], ['c', r, r, Math.PI, a]];
  o = { L, n, r, sx, d: new Float32Array(n), x: new Float32Array(n), y: new Float32Array(n), nx: new Float32Array(n), ny: new Float32Array(n) };
  for (let i = 0; i < n; i++) { let d = i * L / n; o.d[i] = d;
    for (let k = 0; k < segs.length; k++) { const sg = segs[k], len = sg[0] === 'l' ? sg[5] : sg[4];
      if (d <= len || k === segs.length - 1) {
        if (sg[0] === 'l') { o.x[i] = sg[1] + sg[3] * d; o.y[i] = sg[2] + sg[4] * d; o.nx[i] = sg[6]; o.ny[i] = sg[7]; }
        else { const th = sg[3] + (r > 0 ? d / r : 0); o.x[i] = sg[1] + Math.cos(th) * r; o.y[i] = sg[2] + Math.sin(th) * r; o.nx[i] = Math.cos(th); o.ny[i] = Math.sin(th); }
        break; }
      d -= len; } }
  if (OUT.size > 300) OUT.clear(); OUT.set(key, o); return o;
}
// the water. g: 2D context · R: the bubble {x, y (top), w, h, r} px · o: { fx (his feet, px), t, land (s since he landed, or
// null), beats ([s since each of the last few beats]), u (px per world unit), seed, k (0..1 how much: it fades in/out) }
export function drawWater(g, R, o) {
  const { fx, t, u, k = 1 } = o, step = Math.max(5, Math.round(0.2 * u)), ol = outline(R, step), L = ol.L, d0 = Math.max(0, Math.min(ol.sx, fx - (R.x + ol.r))), V = 7.5 * u, W2 = 2 * (0.36 * u) ** 2;
  const waves = []; if (o.land != null && o.land < 1.6) waves.push([o.land, 1.8]);
  for (const b of o.beats || []) if (b >= 0 && b < 1.4) waves.push([b, 1.1]);
  for (let i = 0; i < 2; i++) waves.push([((t * 0.9 + i * 0.5) % 1) * 1.1, 0.35]);   // (it never stops moving: a small ripple running out all the time)
  const fr = Math.floor(t * 20), q = v => Math.round(v / step) * step;
  g.save();
  // the pool: his glitch soaking into the bubble under his feet (dark purple, clipped to the bubble), and its light round the rim
  { g.save(); rr(g, R.x, R.y, R.w, R.h, R.r); g.clip(); const pr = 2.6 * u, gr = g.createRadialGradient(fx, R.y, 0, fx, R.y, pr);
    gr.addColorStop(0, `rgba(42,15,99,${0.78 * k})`); gr.addColorStop(0.55, `rgba(123,60,242,${0.35 * k})`); gr.addColorStop(1, 'rgba(123,60,242,0)'); g.fillStyle = gr; g.fillRect(fx - pr, R.y, 2 * pr, R.h);
    // a few pixel "bubbles" rising in the pool
    for (let i = 0; i < 8; i++) { const ph = (t * 0.8 + hash(i, o.seed)) % 1, px = fx + (hash(i + 3, o.seed) - 0.5) * 3.2 * u, py = R.y + R.h * (1 - ph);
      g.globalAlpha = k * 0.8 * Math.sin(ph * Math.PI) * Math.exp(-Math.abs(px - fx) / (1.6 * u)); g.fillStyle = i % 3 ? PURP[3] : GREEN; g.fillRect(q(px), q(py), step * 0.7, step * 0.7); }
    g.restore(); }
  { const gr = g.createRadialGradient(fx, R.y, 0, fx, R.y, 3.4 * u); gr.addColorStop(0, `rgba(201,167,255,${0.9 * k})`); gr.addColorStop(0.45, `rgba(154,82,255,${0.5 * k})`); gr.addColorStop(1, `rgba(123,60,242,${0.22 * k})`);
    g.strokeStyle = gr; g.lineWidth = 0.22 * u; g.lineJoin = 'round'; rr(g, R.x, R.y, R.w, R.h, R.r); g.stroke(); }
  // the ripples: pixels round the outline, brightest under him and where the waves are, standing up off the line as a crest
  for (let i = 0; i < ol.n; i++) {
    const d = ol.d[i], dd = Math.abs(d - d0), dist = Math.min(dd, L - dd), near = Math.exp(-dist / (1.7 * u));
    let I = 0.9 * near * (0.75 + 0.25 * Math.sin(t * 9 - dist / (0.22 * u)));
    for (let w = 0; w < waves.length; w++) { const [age, amp] = waves[w], f = age * V; I += amp * Math.exp(-((dist - f) ** 2) / W2) * Math.exp(-age / 0.75); }
    I = Math.round(I * k * 5) / 5; if (I < 0.15) continue;                                         // (stepped: five levels of light)
    const nx = ol.nx[i], ny = ol.ny[i], X = R.x + ol.x[i], Y = R.y + ol.y[i];
    const wob = (Math.sin(d / (0.35 * u) - t * 13) > 0 ? 1 : 0.4) * I * 0.12 * u, px = q(X + nx * wob), py = q(Y + ny * wob), sz = step * (I > 1.1 ? 1.15 : 0.9);
    g.globalAlpha = Math.min(1, 0.4 + I * 0.6); g.fillStyle = I > 1.25 ? WHITE : I > 0.85 ? PURP[3] : I > 0.5 ? PURP[1] : PURP[0];
    g.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    if (I > 0.5) {   // the crest: a column of pixels standing up off the line (taller where the wave is), the top one paler
      const hgt = Math.min(4, Math.round((I - 0.3) * 2.4)); for (let j = 1; j <= hgt; j++) { g.globalAlpha = Math.min(1, I) * (1 - j / (hgt + 1.5)); g.fillStyle = j === hgt ? PURP[3] : PURP[1];
        g.fillRect(q(px + nx * step * j) - sz / 2, q(py + ny * step * j) - sz / 2, sz, sz); } }
    if (I > 0.45 && hash(i * 0.37 + o.seed, fr) < 0.14 + 0.14 * Math.min(1, I - 0.45)) { g.globalAlpha = Math.min(1, I); g.fillStyle = hash(i, fr + 3) < 0.65 ? GREEN : PURP[2];   // a fleck of binary, thrown off a crest
      g.font = mono(Math.round(0.3 * u)); g.textAlign = 'center'; g.textBaseline = 'middle';
      const off = (0.45 + 0.4 * hash(i, fr + 5)) * u; g.fillText(hash(i, fr + 7) < 0.5 ? '0' : '1', X + nx * off, Y + ny * off); }
  }
  // the splash: he lands and it splashes up off the line, pixel droplets in his purple (green 0s and 1s in it)
  if (o.land != null && o.land < 0.6) { const a = o.land;
    for (let i = 0; i < 20; i++) { const ang = -Math.PI / 2 + (hash(i, o.seed) - 0.5) * 2.6, sp = (4 + 5 * hash(i + 3, o.seed)) * u, gy = 22 * u;
      const x = fx + Math.cos(ang) * sp * a, y = R.y + Math.sin(ang) * sp * a + 0.5 * gy * a * a, sz = step * (0.7 + 0.5 * hash(i, 9));
      g.globalAlpha = 1 - a / 0.6; if (i < 4) { g.fillStyle = GREEN; g.font = mono(Math.round(0.32 * u)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i % 2 ? '1' : '0', x, y); }
      else { g.fillStyle = PURP[i % 4]; g.fillRect(q(x), q(y), sz, sz); } } }
  g.restore();
}
// a bubble he could glitch but isn't on: a steady purple rim, and pixel dashes crawling round it (faster as her Read gets close).
// o: { t, u, k, left (0..1 of its time left), pulse (0..1, on the beat) }
export function drawShimmer(g, R, o) {
  const { t, u, k = 1, left = 1, pulse = 0 } = o, step = Math.max(4, Math.round(0.16 * u)), ol = outline(R, step), n = ol.n;
  g.save();
  g.globalAlpha = k * (0.75 + 0.25 * pulse); g.strokeStyle = PURP[1]; g.lineWidth = 0.1 * u + 2 * pulse; rr(g, R.x - 1, R.y - 1, R.w + 2, R.h + 2, R.r + 1); g.stroke();
  const heads = 3, spd = (2.4 + 4 * (1 - left)) * u / step, q = v => Math.round(v / step) * step;
  for (let j = 0; j < heads; j++) { const head = Math.floor(t * spd + j * n / heads);
    for (let i = 0; i < 8; i++) { const m = ((head - i) % n + n) % n, X = R.x + ol.x[m] + ol.nx[m] * step * 0.4, Y = R.y + ol.y[m] + ol.ny[m] * step * 0.4;
      g.globalAlpha = k * (1 - i / 8); g.fillStyle = i < 2 ? PURP[3] : i % 4 === 3 && j === 0 ? GREEN : PURP[i % 2];
      g.fillRect(q(X) - step / 2, q(Y) - step / 2, step, step); } }
  g.restore();
}
// ---- the phone's jolts (Nov 3: James's phone glitching because he's in it) — the same purples, the same pixel stepping ----
// the spark: a pixel-stepped zigzag bolt from `from` to `to` ([x, y] px) — a lilac rim, a #9a52ff glow, a magenta core, white-hot
// in the middle when k is high (the hit). o: { t, u (px per world unit), k (0..1 how bright), seed, amp (how far it zigzags, units),
// n (how many kinks) }. It re-kinks 30 times a second, like his glitch steps.
export function drawSpark(g, from, to, o) {
  const { t, u, k = 1, seed = 0, amp = 0.35, n = 7 } = o; if (k <= 0) return;
  const step = Math.max(3, Math.round(0.1 * u)), q = v => Math.round(v / step) * step, f = Math.floor(t * 30), dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  // (it zigs and zags: the kinks alternate sides)
  const pts = [from]; for (let i = 1; i < n; i++) { const a = i / n, off = (i % 2 ? 1 : -1) * (0.45 + 0.55 * hash(i + seed * 7, f)) * amp * u * Math.sin(a * Math.PI) ** 0.5; pts.push([from[0] + dx * a + nx * off, from[1] + dy * a + ny * off]); } pts.push(to);
  const cells = []; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], m = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let j = 0; j < m; j++) cells.push([q(x0 + (x1 - x0) * j / m), q(y0 + (y1 - y0) * j / m)]); }
  g.save();
  for (const [sz, col, a] of [[2.2, PURP[1], 0.2], [1.5, PURP[3], 0.7], [1.0, PURP[2], 1], [0.5, WHITE, k > 0.7 ? 1 : 0]]) { if (!a) continue;
    g.globalAlpha = a * k; g.fillStyle = col; const S = step * sz; for (const [x, y] of cells) g.fillRect(x - S / 2, y - S / 2, S, S); }
  // a few pixels thrown off the kinks
  for (let i = 1; i < pts.length - 1; i++) if (hash(i, f + seed) < 0.5 * k) { g.globalAlpha = k * 0.8; g.fillStyle = hash(i, f + 2) < 0.2 ? GREEN : PURP[3];
    g.fillRect(q(pts[i][0] + (hash(i, f + 4) - 0.5) * 0.6 * u), q(pts[i][1] + (hash(i, f + 5) - 0.5) * 0.6 * u), step, step); }
  g.restore();
}
// the crackle: a bubble about to be knocked loose — lilac dashes crawling round its outline (pixel-stepped), a magenta pixel jumping
// off it now and then. R: {x, y (top), w, h, r} px · o: { t, u, k (0..1: it builds), seed }
export function drawCrackle(g, R, o) {
  const { t, u, k = 1, seed = 0 } = o; if (k <= 0) return; const step = Math.max(4, Math.round(0.14 * u)), ol = outline(R, step), q = v => Math.round(v / step) * step, f = Math.floor(t * 24);
  g.save();
  for (let i = 0; i < ol.n; i++) { if ((i + f) % 6 >= 3 + Math.round(2 * k)) continue; const j = (hash(i + seed, f) - 0.5) * step * 0.8 * k;
    g.globalAlpha = Math.min(1, 0.35 + 0.65 * k); g.fillStyle = (i + f) % 6 === 0 ? WHITE : PURP[3];
    g.fillRect(q(R.x + ol.x[i] + ol.nx[i] * (step * 0.3 + j)) - step / 2, q(R.y + ol.y[i] + ol.ny[i] * (step * 0.3 + j)) - step / 2, step, step); }
  for (let i = 0; i < 3; i++) if (hash(i + seed * 3, f) < 0.45 * k) { const m = Math.floor(hash(i, f + 9) * ol.n), off = (0.25 + 0.4 * hash(i, f + 11)) * u;
    g.globalAlpha = k; g.fillStyle = i ? PURP[2] : PURP[1]; g.fillRect(q(R.x + ol.x[m] + ol.nx[m] * off), q(R.y + ol.y[m] + ol.ny[m] * off), step, step); }
  g.restore();
}
function rr(x, X0, Y0, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); x.beginPath(); x.moveTo(X0 + r, Y0); x.arcTo(X0 + w, Y0, X0 + w, Y0 + h, r); x.arcTo(X0 + w, Y0 + h, X0, Y0 + h, r); x.arcTo(X0, Y0 + h, X0, Y0, r); x.arcTo(X0, Y0, X0 + w, Y0, r); x.closePath(); }

// obstacles.mjs — what the things in his way look like (Chikin: "none of the objects make sense visually").
// One shape language across the game, dressed per world:
//   low   = something standing on the floor  -> jump it
//   high  = something hanging from above     -> duck under it
//   wall  = a tall barrier that flickers     -> glitch through it
//   armor = a gold, locked thing             -> set the power off at it
// Each level picks its pieces in theme.objects ({low, high, wall}); painters draw into a canvas sized to the obstacle
// (w x h pixels, 96 px per world unit). No lyrics on them: the lyrics play the way the videos do, up top.
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare
const INK = '#0b0d12';
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }
function outline(x, lw = 5) { x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); }

export const PAINT = {
  // ---------- low: on the floor ----------
  crate(x, w, h, c) { rr(x, 6, 6, w - 12, h - 12, 8); x.fillStyle = c.a; x.fill(); outline(x); x.strokeStyle = c.b; x.lineWidth = 6; x.beginPath(); x.moveTo(14, 14); x.lineTo(w - 14, h - 14); x.moveTo(w - 14, 14); x.lineTo(14, h - 14); x.stroke(); },
  tile404(x, w, h, c) { rr(x, 6, 10, w - 12, h - 14, 6); x.fillStyle = '#061a0f'; x.fill(); x.strokeStyle = c.a; x.lineWidth = 5; x.stroke();
    x.fillStyle = c.a; x.font = `400 ${h * 0.38}px "Major Mono Display", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('404', w / 2, h * 0.55);
    x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.moveTo(w * 0.62, 10); x.lineTo(w * 0.5, h * 0.45); x.lineTo(w * 0.66, h * 0.6); x.lineTo(w * 0.55, h - 4); x.stroke(); },   // a crack
  speaker(x, w, h, c) { rr(x, 6, 6, w - 12, h - 10, 8); x.fillStyle = '#16121c'; x.fill(); outline(x);
    for (const [cy, r] of [[h * 0.3, Math.min(w, h) * 0.13], [h * 0.65, Math.min(w, h) * 0.24]]) { x.beginPath(); x.arc(w / 2, cy, r, 0, 7); x.fillStyle = '#2b2533'; x.fill(); x.lineWidth = 4; x.strokeStyle = c.a; x.stroke(); x.beginPath(); x.arc(w / 2, cy, r * 0.35, 0, 7); x.fillStyle = c.a; x.fill(); } },
  checkbox(x, w, h, c) { const s = Math.min(w, h) - 16; rr(x, (w - s) / 2, h - s - 6, s, s, 8); x.fillStyle = '#fbf8ef'; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); },
  card(x, w, h, c) { rr(x, 6, 6, w - 12, h - 12, 6); x.fillStyle = '#f2efe6'; x.fill(); outline(x, 4); x.fillStyle = c.a; x.fillRect(14, 16, (w - 28) * 0.7, 8);
    x.fillStyle = '#9aa0ab'; for (let i = 0; i < 3; i++) x.fillRect(14, 34 + i * 14, (w - 28) * (0.9 - i * 0.18), 6); },
  bubble(x, w, h, c) { rr(x, 6, 8, w - 12, h - 26, 18); x.fillStyle = c.a; x.fill(); outline(x, 4); x.beginPath(); x.moveTo(24, h - 20); x.lineTo(14, h - 4); x.lineTo(44, h - 20); x.fillStyle = c.a; x.fill();
    x.fillStyle = INK; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(w / 2 + (i - 1) * w * 0.2, (h - 18) / 2 + 6, 6, 0, 7); x.fill(); } },
  rock(x, w, h, c) { x.beginPath(); x.moveTo(8, h - 4); x.lineTo(14, h * 0.4); x.lineTo(w * 0.4, 8); x.lineTo(w * 0.75, h * 0.2); x.lineTo(w - 8, h * 0.55); x.lineTo(w - 10, h - 4); x.closePath();
    x.fillStyle = '#3a3532'; x.fill(); outline(x); x.strokeStyle = c.a; x.lineWidth = 4; x.beginPath(); x.moveTo(w * 0.25, h * 0.7); x.lineTo(w * 0.5, h * 0.45); x.lineTo(w * 0.7, h * 0.6); x.stroke(); },
  buoy(x, w, h, c) { x.beginPath(); x.ellipse(w / 2, h * 0.68, w * 0.36, h * 0.26, 0, 0, 7); x.fillStyle = '#c23a2a'; x.fill(); outline(x); x.fillStyle = '#f2efe6'; x.fillRect(w * 0.18, h * 0.62, w * 0.64, h * 0.1);
    x.fillStyle = INK; x.fillRect(w / 2 - 4, h * 0.15, 8, h * 0.3); x.beginPath(); x.arc(w / 2, h * 0.14, 9, 0, 7); x.fillStyle = c.a; x.fill(); },
  keycap(x, w, h, c, label) { rr(x, 6, 10, w - 12, h - 14, 12); x.fillStyle = '#d9d6cf'; x.fill(); outline(x); rr(x, 16, 16, w - 32, h - 34, 8); x.fillStyle = '#efece5'; x.fill();
    x.fillStyle = INK; x.font = `400 ${h * 0.28}px "Major Mono Display", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label || 'del', w / 2, h * 0.46); },
  server(x, w, h, c) { rr(x, 6, 6, w - 12, h - 10, 4); x.fillStyle = '#0d1424'; x.fill(); outline(x);
    for (let i = 0; i < 3; i++) { x.fillStyle = '#1b2640'; x.fillRect(14, 14 + i * (h - 28) / 3, w - 28, (h - 28) / 3 - 6); x.fillStyle = i === 1 ? c.b : c.a; x.fillRect(w - 26, 20 + i * (h - 28) / 3, 7, 7); } },
  sock(x, w, h, c) { rr(x, 8, 8, w - 16, h - 12, 10); x.fillStyle = c.a; x.fill(); outline(x); },   // fallback: a plain block in the level's colour
  // ---------- high: hanging ----------
  sign(x, w, h, c) { x.strokeStyle = '#7d8696'; x.lineWidth = 4; x.beginPath(); x.moveTo(w * 0.2, 0); x.lineTo(w * 0.2, h * 0.45); x.moveTo(w * 0.8, 0); x.lineTo(w * 0.8, h * 0.45); x.stroke();
    rr(x, 6, h * 0.45, w - 12, h * 0.5, 8); x.fillStyle = c.a; x.fill(); outline(x); },
  laser(x, w, h, c) { x.fillStyle = '#2a2a33'; x.fillRect(0, h * 0.62, 18, h * 0.3); x.fillRect(w - 18, h * 0.62, 18, h * 0.3);
    x.shadowColor = c.a; x.shadowBlur = 18; x.fillStyle = c.a; x.fillRect(10, h * 0.74, w - 20, 10); x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.fillRect(10, h * 0.76, w - 20, 3); },
  banner(x, w, h, c) { rr(x, 6, h * 0.5, w - 12, h * 0.44, 14); x.fillStyle = '#e9edf5'; x.fill(); outline(x, 4); x.beginPath(); x.arc(30, h * 0.72, 12, 0, 7); x.fillStyle = c.a; x.fill();
    x.fillStyle = '#8a92a2'; x.fillRect(52, h * 0.64, w * 0.5, 7); x.fillRect(52, h * 0.77, w * 0.35, 7); },
  dialog(x, w, h, c) { rr(x, 6, h * 0.42, w - 12, h * 0.52, 6); x.fillStyle = '#eef0f4'; x.fill(); outline(x, 4); x.fillStyle = c.a; x.fillRect(8, h * 0.42 + 2, w - 16, 18);
    rr(x, w - 64, h * 0.8, 48, 20, 4); x.fillStyle = '#ff3b3b'; x.fill(); rr(x, w - 124, h * 0.8, 48, 20, 4); x.fillStyle = '#c9ced8'; x.fill(); },
  bat(x, w, h, c) {             // Still Here: a mine bat, wings out, right at his height — swing the sword at it
    // (Chikin: "the bats in still here are too dark against the background" -> a lighter body, lit wing ribs, a pale glow behind)
    const cx = w / 2, cy = h * 0.5, s = Math.min(w, h * 1.6) * 0.5;
    const glow = x.createRadialGradient(cx, cy, s * 0.1, cx, cy, s * 1.05); glow.addColorStop(0, 'rgba(255,236,200,.55)'); glow.addColorStop(1, 'rgba(255,236,200,0)');
    x.fillStyle = glow; x.fillRect(0, 0, w, h);
    x.beginPath();
    for (const d of [-1, 1]) { x.moveTo(cx, cy - s * 0.1); x.quadraticCurveTo(cx + d * s * 0.5, cy - s * 0.75, cx + d * s * 0.98, cy - s * 0.3);
      x.lineTo(cx + d * s * 0.78, cy + s * 0.05); x.lineTo(cx + d * s * 0.6, cy - s * 0.08); x.lineTo(cx + d * s * 0.42, cy + s * 0.12); x.lineTo(cx + d * s * 0.22, cy - s * 0.02); x.lineTo(cx, cy + s * 0.1); }
    x.fillStyle = '#8c7bb0'; x.fill(); outline(x, 4);
    x.strokeStyle = '#d9cdf2'; x.lineWidth = 2.5; for (const d of [-1, 1]) for (const f of [0.42, 0.62, 0.8]) { x.beginPath(); x.moveTo(cx + d * s * 0.12, cy - s * 0.12); x.lineTo(cx + d * s * f, cy - s * (0.55 - f * 0.3)); x.stroke(); }   // lit wing ribs
    x.beginPath(); x.ellipse(cx, cy + s * 0.05, s * 0.2, s * 0.26, 0, 0, 7); x.fillStyle = '#a593c9'; x.fill(); outline(x, 4);
    x.beginPath(); x.moveTo(cx - s * 0.14, cy - s * 0.16); x.lineTo(cx - s * 0.08, cy - s * 0.32); x.lineTo(cx - s * 0.02, cy - s * 0.18); x.moveTo(cx + s * 0.14, cy - s * 0.16); x.lineTo(cx + s * 0.08, cy - s * 0.32); x.lineTo(cx + s * 0.02, cy - s * 0.18); x.fillStyle = '#a593c9'; x.fill(); outline(x, 3);   // ears
    x.fillStyle = '#ffe14d'; for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * s * 0.08, cy, s * 0.055, 0, 7); x.fill(); } },
  stalactite(x, w, h, c) { x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w * 0.72, h * 0.6); x.lineTo(w * 0.55, h * 0.96); x.lineTo(w * 0.38, h * 0.62); x.lineTo(w * 0.2, h * 0.8); x.closePath(); x.fillStyle = '#3a3532'; x.fill(); outline(x); },
  cord(x, w, h, c) { x.strokeStyle = '#d9d6cf'; x.lineWidth = 6; x.beginPath(); for (let y = 0; y < h * 0.62; y += 4) x.lineTo(w / 2 + Math.sin(y * 0.35) * 14, y); x.stroke();
    rr(x, w / 2 - 34, h * 0.6, 68, h * 0.34, 16); x.fillStyle = '#d9d6cf'; x.fill(); outline(x); },
  drone(x, w, h, c) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(10, h * 0.6); x.lineTo(w - 10, h * 0.6); x.stroke();
    for (const px of [16, w - 16]) { x.fillStyle = '#7d8696'; x.fillRect(px - 16, h * 0.5, 32, 6); } rr(x, w * 0.25, h * 0.58, w * 0.5, h * 0.3, 10); x.fillStyle = '#1b2640'; x.fill(); outline(x, 4);
    x.beginPath(); x.arc(w / 2, h * 0.74, 8, 0, 7); x.fillStyle = c.b; x.fill(); },
  // ---------- wall: a barrier you glitch through ----------
  firewall(x, w, h, c) { x.fillStyle = '#2a0708'; x.fillRect(4, 0, w - 8, h); x.fillStyle = c.a; for (let y = 10; y < h; y += 26) x.fillRect(10, y, w - 20, 8); x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(4, 0, w - 8, h); },
  redact(x, w, h, c) { x.fillStyle = '#0b0b0b'; x.fillRect(6, 0, w - 12, h); x.fillStyle = c.a; x.fillRect(6, 0, 6, h); x.fillRect(w - 12, 0, 6, h); },
  caret(x, w, h, c) { x.fillStyle = c.a; x.fillRect(w * 0.3, 0, w * 0.4, h); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(w * 0.3, 0, 5, h); },
  fog(x, w, h, c) { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(10,14,20,0)'); g.addColorStop(0.5, 'rgba(10,14,20,.95)'); g.addColorStop(1, 'rgba(10,14,20,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = c.a; x.globalAlpha = 0.5; x.lineWidth = 3; for (let y = 30; y < h; y += 60) { x.beginPath(); x.moveTo(w * 0.2, y); x.quadraticCurveTo(w / 2, y - 20, w * 0.8, y); x.stroke(); } x.globalAlpha = 1; },
  grid(x, w, h, c) { x.strokeStyle = c.a; x.lineWidth = 4; x.shadowColor = c.a; x.shadowBlur = 10; for (let y = 8; y < h; y += 34) { x.beginPath(); x.moveTo(6, y); x.lineTo(w - 6, y); x.stroke(); }
    x.beginPath(); x.moveTo(8, 0); x.lineTo(8, h); x.moveTo(w - 8, 0); x.lineTo(w - 8, h); x.stroke(); x.shadowBlur = 0; },
  pillar(x, w, h, c) { x.fillStyle = c.b; x.fillRect(6, 0, w - 12, h); x.fillStyle = c.a; for (let y = 0; y < h; y += 44) x.fillRect(6, y, w - 12, 6); x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(6, 0, w - 12, h); },
  // ---------- armor: the gold thing the power is for ----------
  armor(x, w, h, c, glyph) { x.fillStyle = '#5a4207'; x.fillRect(6, 0, w - 12, h); const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#ffe8a0'); g.addColorStop(0.5, c.gold); g.addColorStop(1, '#8a6410');
    x.fillStyle = g; x.fillRect(12, 0, w - 24, h); x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(6, 0, w - 12, h);
    for (let y = 40; y < h; y += 90) { x.fillStyle = '#5a4207'; x.beginPath(); x.arc(22, y, 5, 0, 7); x.arc(w - 22, y, 5, 0, 7); x.fill(); }
    const cy = h - 150; x.fillStyle = '#1a1206'; x.beginPath(); x.arc(w / 2, cy, Math.min(48, w * 0.3), 0, 7); x.fill();
    x.fillStyle = c.gold; x.font = `900 ${Math.min(56, w * 0.36)}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(glyph || '★', w / 2, cy + 2); },
};
export const DEFAULT_OBJECTS = { low: 'sock', high: 'sign', wall: 'firewall' };

// ---------- the Impossible Game set (Chikin: "the gameplay being like the impossible game") ----------
// black shapes with one bright outline in the level's colour: you read them in a blink, in any world.
function tri(x, ax, ay, bx, by, cx, cy) { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.lineTo(cx, cy); x.closePath(); }
Object.assign(PAINT, {
  igspike(x, w, h, c) { tri(x, 5, h - 3, w / 2, 5, w - 5, h - 3); x.fillStyle = '#05060a'; x.fill(); x.lineJoin = 'round'; x.lineWidth = 6; x.strokeStyle = c.a; x.stroke(); },
  ighang(x, w, h, c) { const th = Math.min(h * 0.42, w * 0.5), n = Math.max(1, Math.round(w / th));
    for (let i = 0; i < n; i++) { x.fillStyle = '#05060a'; x.fillRect(i * w / n + 3, 3, w / n - 6, th - 6); x.lineWidth = 5; x.strokeStyle = c.a; x.strokeRect(i * w / n + 3, 3, w / n - 6, th - 6); }
    const k = Math.max(2, Math.round(w / (h * 0.32))); for (let i = 0; i < k; i++) { tri(x, i * w / k + 4, th, (i + 0.5) * w / k, h - 4, (i + 1) * w / k - 4, th); x.fillStyle = '#05060a'; x.fill(); x.lineWidth = 5; x.strokeStyle = c.a; x.stroke(); } },
  igwall(x, w, h, c) { const ts = w - 8; for (let y = h - ts - 4; y > -ts; y -= ts) { x.fillStyle = '#05060a'; x.fillRect(4, y, ts, ts - 4); x.setLineDash([10, 7]); x.lineWidth = 5; x.strokeStyle = c.b; x.strokeRect(4, y, ts, ts - 4); x.setLineDash([]); }
    x.fillStyle = c.b; x.globalAlpha = 0.25; for (let y = 0; y < h; y += 9) x.fillRect(4, y, w - 8, 2); x.globalAlpha = 1; },   // dashed + scanlines: this one you glitch through
});
PAINT.bigwall = (x, w, h, c, label) => {   // a story wall (Last Lights): a dark slab of the old world, a cyan grid humming over it
  x.fillStyle = '#0b0d16'; x.fillRect(4, 0, w - 8, h); x.strokeStyle = '#3fd8ff'; x.lineWidth = 2; x.globalAlpha = 0.55;
  for (let y = 12; y < h; y += 28) { x.beginPath(); x.moveTo(8, y); x.lineTo(w - 8, y); x.stroke(); } for (let xx = 16; xx < w - 8; xx += 28) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, h); x.stroke(); }
  x.globalAlpha = 1; x.lineWidth = 6; x.strokeRect(4, 0, w - 8, h);
  if (label) { x.save(); x.translate(w / 2, h - 260); x.rotate(-Math.PI / 2); x.fillStyle = '#d8fbff'; x.font = `400 ${Math.min(52, w * 0.32)}px "Major Mono Display", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 0, 0); x.restore(); } };
export const IG_OBJECTS = { low: 'igspike', high: 'ighang', wall: 'igwall' };
// the ground's tiles: one square per world unit, outlined
export function tileTexture(T, color) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.strokeStyle = color; x.globalAlpha = 0.28; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 61, 61);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; return t;
}

// ---------- Read the Terms: books and papers instead of spikes and blocks (Chikin) ----------
const BOOKC = ['#7a1f1f', '#1f3f7a', '#2f5e2a', '#6b4a1d', '#4a2a5e'];
Object.assign(PAINT, {
  bookstack(x, w, h, c) {      // a small tottering stack of books on the floor: jump it
    const n = 3, bh = (h - 6) / n; for (let i = 0; i < n; i++) { const y = h - (i + 1) * bh, inset = (i % 2) * w * 0.08, bw = w - 10 - inset * 1.5;
      x.fillStyle = BOOKC[i % BOOKC.length]; x.fillRect(5 + inset, y, bw, bh - 2); x.fillStyle = '#f2ead6'; x.fillRect(5 + inset + bw - 10, y + 3, 7, bh - 8);
      x.fillStyle = '#d9b44a'; x.fillRect(5 + inset + 10, y + bh / 2 - 2, bw * 0.4, 3); x.strokeStyle = '#120a05'; x.lineWidth = 4; x.strokeRect(5 + inset, y, bw, bh - 2); } },
  papers(x, w, h, c) {         // contract pages hanging on clips from a string: duck under
    x.strokeStyle = '#3a3a3a'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 8); x.quadraticCurveTo(w / 2, 22, w, 8); x.stroke();
    const n = Math.max(2, Math.round(w / 60)); for (let i = 0; i < n; i++) { const px = (i + 0.5) * w / n, pw = w / n - 8, ph = h - 26;
      x.save(); x.translate(px, 18); x.rotate((i % 2 ? 1 : -1) * 0.06); x.fillStyle = '#f7f2e4'; x.fillRect(-pw / 2, 0, pw, ph); x.strokeStyle = '#120a05'; x.lineWidth = 3; x.strokeRect(-pw / 2, 0, pw, ph);
      x.fillStyle = '#b9b2a0'; for (let k = 0; k < 8; k++) x.fillRect(-pw / 2 + 8, 14 + k * (ph - 24) / 8, pw - 16 - (k % 3) * 8, 2); x.fillStyle = '#2a2a2a'; x.fillRect(-7, -6, 14, 10); x.restore(); } },
  paperwall(x, w, h, c) {      // a tall bundled stack of manuscript pages, solid like the floor's paper stacks: glitch through it
    // (Chikin, Nov 8: "those columns should all be the big stacks of papers or stacks of books": no see-through dashed tower)
    let y = h; for (let i = 0; y > 0; i++) { const ph = 9 + (i % 3) * 3, off = Math.sin(i * 1.7) * w * 0.05; y -= ph;
      x.fillStyle = i % 5 === 0 ? '#e6dcc4' : '#f5efe0'; x.fillRect(8 + off, y, w - 16, ph - 1); x.fillStyle = '#c9bfa6'; x.fillRect(8 + off, y + ph - 2, w - 16, 1); }
    for (const by of [h * 0.28, h * 0.7]) { x.fillStyle = '#8a5a2e'; x.fillRect(6, by, w - 12, 7); x.strokeStyle = '#120a05'; x.lineWidth = 2; x.strokeRect(6, by, w - 12, 7); }
    x.fillStyle = '#2a2a2a'; for (let yy = 22; yy < h - 10; yy += 46) x.fillRect(w / 2 - 9, yy, 18, 3);
    x.strokeStyle = '#120a05'; x.lineWidth = 4; x.strokeRect(6, 0, w - 12, h); },
  redact(x, w, h, c) {         // a tall stack of books with one black redaction strip across the spines: glitch through it
    const n = Math.max(4, Math.round(h / 34)), bh = h / n;
    for (let i = 0; i < n; i++) { const y = h - (i + 1) * bh, inset = (i % 2) * w * 0.06, bw = w - 12 - inset * 1.5;
      x.fillStyle = BOOKC[i % BOOKC.length]; x.fillRect(6 + inset, y, bw, bh - 2); x.fillStyle = '#f2ead6'; x.fillRect(6 + inset + bw - 10, y + 3, 7, bh - 8);
      x.fillStyle = '#d9b44a'; x.fillRect(6 + inset + 10, y + bh / 2 - 2, bw * 0.4, 3); x.strokeStyle = '#120a05'; x.lineWidth = 4; x.strokeRect(6 + inset, y, bw, bh - 2); }
    x.fillStyle = '#0b0b0b'; x.fillRect(2, h * 0.42, w - 4, h * 0.12); },
});

// ---------- series 2: every level's own things in the way (Chikin: "Replace all spikes and cubes with assets unique to each level") ----------
// Same reading as before: something on the floor = jump it; something hanging = duck it; a tall flickering thing = glitch it.
Object.assign(PAINT, {
  // Thursday Potato — the 404
  deadlink(x, w, h, c) {       // a broken hyperlink: two halves of a chain link, snapped, sparking
    x.lineWidth = 9; x.strokeStyle = '#0d3a22'; x.lineCap = 'round';
    for (const [cx, rot] of [[w * 0.33, -0.5], [w * 0.68, 0.4]]) { x.save(); x.translate(cx, h * 0.62); x.rotate(rot); x.beginPath(); x.ellipse(0, 0, w * 0.2, h * 0.24, 0, 0.35, Math.PI * 2 - 0.35); x.stroke();
      x.strokeStyle = c.a; x.lineWidth = 5; x.stroke(); x.restore(); x.lineWidth = 9; x.strokeStyle = '#0d3a22'; }
    x.fillStyle = '#d9ffe8'; for (let i = 0; i < 5; i++) { x.fillRect(w * 0.48 + (i - 2) * 6, h * 0.38 - (i % 2) * 10, 3, 9); } },
  errsign(x, w, h, c) {        // a "404" sign hanging on chains
    x.strokeStyle = '#3a6a4a'; x.lineWidth = 4; x.setLineDash([6, 4]); x.beginPath(); x.moveTo(w * 0.22, 0); x.lineTo(w * 0.22, h * 0.5); x.moveTo(w * 0.78, 0); x.lineTo(w * 0.78, h * 0.5); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#04120a'; x.beginPath(); x.roundRect(6, h * 0.5, w - 12, h * 0.46, 8); x.fill(); x.lineWidth = 5; x.strokeStyle = c.a; x.stroke();
    x.fillStyle = c.a; x.font = `400 ${h * 0.24}px "Major Mono Display", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('404', w / 2, h * 0.74); },
  binwall(x, w, h, c) {        // a firewall of falling binary (dashed edge = glitch through it)
    x.fillStyle = '#021208'; x.fillRect(4, 0, w - 8, h); x.fillStyle = c.a; x.font = `400 ${w * 0.32}px "Major Mono Display", monospace`; x.textAlign = 'center';
    for (let y = 20, i = 0; y < h; y += w * 0.34, i++) { x.globalAlpha = 0.35 + 0.6 * ((i * 7) % 5) / 5; x.fillText((i * 13) % 3 ? '1' : '0', w / 2, y); } x.globalAlpha = 1;
    x.setLineDash([10, 7]); x.lineWidth = 4; x.strokeStyle = c.a; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
  binrain(x, w, h, c, label, t = 0) {   // the binary firewall, FALLING (Chikin, Thursday: "can the walls be falling binary"): a solid wall of
    // 1s and 0s — a dim grid of bits in every cell, and Matrix streams falling cell by cell over it (white-hot head, bright neck,
    // long green tail); two streams per column so it never goes thin; a crawling, flickering dashed edge = glitch through it
    const X0 = 4, IW = w - 8, cols = Math.max(4, Math.round(IW / 12)), cw = IW / cols, fs = Math.round(cw * 1.3), rh = Math.round(fs * 0.92), rows = Math.ceil(h / rh) + 1;
    const g = x.createLinearGradient(X0, 0, X0 + IW, 0); g.addColorStop(0, 'rgba(4,40,18,0.94)'); g.addColorStop(0.5, 'rgba(2,20,9,0.92)'); g.addColorStop(1, 'rgba(4,40,18,0.94)');
    x.fillStyle = g; x.fillRect(X0, 0, IW, h);
    x.font = `700 ${fs}px "Major Mono Display", ui-monospace, monospace`; x.textAlign = 'center'; x.textBaseline = 'top';
    const H = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const bit = (i, r, k) => H(i * 131 + r, k) < 0.5 ? '0' : '1';
    const tk = Math.floor(t * 6);                                                     // bits re-roll a few times a second
    const lit = new Float32Array(cols * rows);                                         // brightness each cell gets from the streams
    for (let i = 0; i < cols; i++) for (let s = 0; s < 2; s++) {
      const sp = 7 + H(i, s + 11) * 9, len = 9 + Math.floor(H(i, s + 21) * 12), span = rows + len + 4;   // rows per second, tail length
      const head = Math.floor((t * sp + H(i, s + 31) * span + s * span * 0.5) % span);
      for (let k = 0; k < len; k++) { const r = head - k; if (r < 0 || r >= rows) continue; const v = k === 0 ? 3 : k < 3 ? 2 : 1 - k / len; const j = i * rows + r; if (v > lit[j]) lit[j] = v; } }
    for (let i = 0; i < cols; i++) { const cx = X0 + cw * (i + 0.5);
      for (let r = 0; r < rows; r++) { const v = lit[i * rows + r], y = r * rh; const b = bit(i, r, v > 0 ? tk : tk >> 2);
        if (v >= 3) { x.globalAlpha = 1; x.shadowColor = c.a; x.shadowBlur = 12; x.fillStyle = '#f4fff7'; x.fillText(b, cx, y); x.shadowBlur = 0; }
        else if (v >= 2) { x.globalAlpha = 1; x.fillStyle = '#b8ffd4'; x.fillText(b, cx, y); }
        else if (v > 0) { x.globalAlpha = 0.3 + 0.7 * v; x.fillStyle = c.a; x.fillText(b, cx, y); }
        else { x.globalAlpha = 0.16; x.fillStyle = c.a; x.fillText(b, cx, y); } } }
    x.globalAlpha = 1;
    const fl = 0.7 + 0.3 * (H(Math.floor(t * 14), 7) > 0.25 ? 1 : 0);                  // the edge flickers
    x.setLineDash([10, 7]); x.lineDashOffset = -t * 40; x.lineWidth = 4; x.strokeStyle = c.a; x.globalAlpha = fl; x.shadowColor = c.a; x.shadowBlur = 8;
    x.beginPath(); x.moveTo(X0 + 2, 0); x.lineTo(X0 + 2, h); x.moveTo(X0 + IW - 2, 0); x.lineTo(X0 + IW - 2, h); x.stroke();
    x.shadowBlur = 0; x.globalAlpha = 1; x.setLineDash([]); x.lineDashOffset = 0; x.textBaseline = 'alphabetic'; },
  // Get Down — the club
  subwoofer(x, w, h, c) {      // a floor subwoofer, cone pumping
    x.fillStyle = '#120a18'; x.beginPath(); x.roundRect(6, 6, w - 12, h - 8, 10); x.fill(); x.lineWidth = 5; x.strokeStyle = '#05060a'; x.stroke();
    const r = Math.min(w, h) * 0.36; x.fillStyle = '#2b2236'; x.beginPath(); x.arc(w / 2, h / 2 + 2, r, 0, 7); x.fill(); x.lineWidth = 5; x.strokeStyle = c.a; x.stroke();
    x.fillStyle = '#05060a'; x.beginPath(); x.arc(w / 2, h / 2 + 2, r * 0.42, 0, 7); x.fill(); x.fillStyle = c.b; x.beginPath(); x.arc(w / 2, h / 2 + 2, r * 0.16, 0, 7); x.fill(); },
  lightcurtain(x, w, h, c) {   // a curtain of light beams you glitch through
    const cols = ['#ff5cc8', '#5cf2ff', '#ffe45c', '#7dff6a']; for (let i = 0; i < 5; i++) { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, cols[i % 4]); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = 0.75; x.fillStyle = g; x.fillRect(6 + i * (w - 12) / 5, 0, (w - 12) / 5 - 4, h); } x.globalAlpha = 1;
    x.setLineDash([10, 7]); x.lineWidth = 3; x.strokeStyle = '#ffffff'; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
  // Between Messages — 2 am
  facedown(x, w, h, c) {       // a phone face down on the floor, buzzing
    x.fillStyle = '#1a1f2c'; x.beginPath(); x.roundRect(6, h * 0.55, w - 12, h * 0.4, 12); x.fill(); x.lineWidth = 4; x.strokeStyle = '#05060a'; x.stroke();
    x.fillStyle = '#2b3348'; x.beginPath(); x.arc(w * 0.25, h * 0.75, h * 0.07, 0, 7); x.fill();
    x.strokeStyle = c.a; x.lineWidth = 3; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(w / 2, h * 0.75, w * (0.48 + k * 0.08), s > 0 ? -0.5 : Math.PI - 0.5 + 0.5, s > 0 ? -0.15 : Math.PI + 0.15); x.stroke(); } },
  typingwall(x, w, h, c) {     // a tower of "typing…" bubbles (they never arrive): glitch through
    for (let y = h - 70, i = 0; y > -60; y -= 74, i++) { x.fillStyle = '#2b3348'; x.beginPath(); x.roundRect(8, y, w - 16, 56, 22); x.fill(); x.fillStyle = c.a;
      for (let k = 0; k < 3; k++) { x.globalAlpha = 0.4 + 0.6 * ((k + i) % 3 === 0); x.beginPath(); x.arc(w / 2 + (k - 1) * w * 0.2, y + 28, 6, 0, 7); x.fill(); } x.globalAlpha = 1; }
    x.setLineDash([10, 7]); x.lineWidth = 3; x.strokeStyle = c.a; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
  // Still Here — the token mines
  crystal(x, w, h, c) {        // a cluster of gold-ore crystals
    const sp = [[0.3, 0.9, 0.18], [0.5, 1.0, 0.22], [0.7, 0.8, 0.16]]; for (const [cx, hh, ww] of sp) { x.beginPath(); x.moveTo(w * (cx - ww), h - 4); x.lineTo(w * cx, h * (1 - hh) + 6); x.lineTo(w * (cx + ww), h - 4); x.closePath();
      const g = x.createLinearGradient(w * (cx - ww), 0, w * (cx + ww), 0); g.addColorStop(0, '#ffe8a0'); g.addColorStop(0.5, '#ffcf4a'); g.addColorStop(1, '#8a6410'); x.fillStyle = g; x.fill(); x.lineWidth = 4; x.strokeStyle = '#120a05'; x.stroke(); }
    x.fillStyle = '#3a3532'; x.fillRect(6, h - 10, w - 12, 8); },
  deletetide(x, w, h, c) {     // the delete wall: red, with DELETE stacked up it
    x.fillStyle = '#3a0608'; x.fillRect(4, 0, w - 8, h); x.fillStyle = '#ff3b3b'; x.font = `900 ${w * 0.22}px Inter, sans-serif`; x.textAlign = 'center';
    for (let y = h - 20, i = 0; y > 0; y -= w * 0.5, i++) { x.save(); x.translate(w / 2, y); x.rotate(-Math.PI / 2); x.globalAlpha = 0.5 + 0.4 * (i % 2); x.fillText('DELETE', 0, w * 0.08); x.restore(); }
    x.setLineDash([10, 7]); x.lineWidth = 4; x.strokeStyle = '#ff8a7a'; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
  // Last Lights On — the last street
  cone(x, w, h, c) {           // a road cone with a reflective band
    x.beginPath(); x.moveTo(w * 0.5, 6); x.lineTo(w * 0.78, h - 14); x.lineTo(w * 0.22, h - 14); x.closePath(); x.fillStyle = '#ff7a1a'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#120a05'; x.stroke();
    x.fillStyle = '#f2f2f2'; x.fillRect(w * 0.33, h * 0.5, w * 0.34, h * 0.12); x.fillStyle = '#2a2633'; x.fillRect(w * 0.12, h - 16, w * 0.76, 12); },
  powerline(x, w, h, c) {      // a dead power line sagging low with a sign hanging off it
    x.strokeStyle = '#1a1820'; x.lineWidth = 5; x.beginPath(); x.moveTo(0, h * 0.2); x.quadraticCurveTo(w / 2, h * 0.7, w, h * 0.2); x.stroke();
    x.fillStyle = '#d8dce6'; x.beginPath(); x.roundRect(w * 0.25, h * 0.55, w * 0.5, h * 0.4, 6); x.fill(); x.lineWidth = 4; x.strokeStyle = '#120a05'; x.stroke();
    x.fillStyle = '#ff3b3b'; x.beginPath(); x.moveTo(w * 0.5, h * 0.6); x.lineTo(w * 0.6, h * 0.88); x.lineTo(w * 0.4, h * 0.88); x.closePath(); x.fill(); },
  datawall(x, w, h, c) {       // a cyan data tower in your way: glitch through
    x.fillStyle = '#071018'; x.fillRect(4, 0, w - 8, h); x.strokeStyle = '#5fe6f2'; x.lineWidth = 2; x.globalAlpha = 0.6;
    for (let y = 6; y < h; y += 12) { x.beginPath(); x.moveTo(8, y); x.lineTo(w - 8, y + 7); x.stroke(); } x.globalAlpha = 1;
    x.setLineDash([10, 7]); x.lineWidth = 4; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
});

// ---------- Thursday Potato, reworked (Oct 31): the 404's own things, bolder, and nothing that reads as a second "404" ----------
Object.assign(PAINT, {
  snaplink(x, w, h, c) {       // jump it: the hyperlink icon (two chain links on the diagonal) snapped in two, sparking at the break
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(w / 2, h - 4, w * 0.42, 4, 0, 0, 7); x.fill();
    const L = w * 0.11, R = h * 0.105, A = -0.72, cy0 = h * 0.52;               // a link: a capsule along the diagonal
    const link = (cx, cy, gapEnd) => { x.save(); x.translate(cx, cy); x.rotate(A);
      const path = () => { x.beginPath();                                       // the capsule, broken open at one end (the snapped end)
        if (gapEnd > 0) { x.moveTo(L + R * 0.2, -R); x.lineTo(-L, -R); x.arc(-L, 0, R, -Math.PI / 2, Math.PI / 2, true); x.lineTo(L + R * 0.2, R); }
        else { x.moveTo(-L - R * 0.2, R); x.lineTo(L, R); x.arc(L, 0, R, Math.PI / 2, -Math.PI / 2, true); x.lineTo(-L - R * 0.2, -R); } };
      path(); x.strokeStyle = INK; x.lineWidth = 11; x.stroke();
      path(); x.strokeStyle = c.a; x.lineWidth = 6; x.stroke();
      path(); x.strokeStyle = 'rgba(225,255,238,.75)'; x.lineWidth = 1.8; x.stroke();
      const e = gapEnd > 0 ? L + R * 0.2 : -L - R * 0.2;                        // the jagged broken ends
      for (const sy of [-R, R]) { x.strokeStyle = '#fff2d8'; x.lineWidth = 2; x.beginPath(); x.moveTo(e, sy - 3); x.lineTo(e + gapEnd * 4, sy); x.lineTo(e, sy + 3); x.stroke(); }
      x.restore(); };
    const d = w * 0.09;                                                       // the two links pulled apart along the diagonal
    link(w * 0.5 - Math.cos(A) * (L + d), cy0 - Math.sin(A) * (L + d), 1);
    link(w * 0.5 + Math.cos(A) * (L + d), cy0 + Math.sin(A) * (L + d), -1);
    x.strokeStyle = '#fff2d8'; x.lineWidth = 2.5; const sx = w * 0.5, sy = cy0;   // the spark at the break
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7 + 0.3, r0 = 3, r1 = 7 + (i % 2) * 6; x.beginPath(); x.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0); x.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1); x.stroke(); }
    x.fillStyle = '#ffbf73'; x.beginPath(); x.arc(sx, sy, 3.5, 0, 7); x.fill(); },
  brokenimg(x, w, h, c) {      // duck it: a broken image (the picture that never loaded) hanging on two chains
    const top = h * 0.42, bot = h * 0.97, fx = 7, fw = w - 14;
    for (const cx of [w * 0.24, w * 0.76]) for (let y = 2, i = 0; y < top; y += 9, i++) {   // chains
      x.strokeStyle = '#5f8a72'; x.lineWidth = 2.5; x.beginPath(); if (i % 2) x.ellipse(cx, y + 4, 2.2, 4.5, 0, 0, 7); else x.ellipse(cx, y + 4, 4, 4.5, 0, 0, 7); x.stroke(); }
    const pic = () => { x.beginPath(); x.roundRect(fx, top, fw, bot - top, 8); };
    pic(); x.fillStyle = '#071a10'; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 5; x.strokeStyle = c.a; x.stroke();
    // the picture inside: hills and a sun, the way a browser draws an image it couldn't load — torn down the middle
    const ix = fx + 10, iy = top + 10, iw = fw - 20, ih = bot - top - 20, tear = k => ix + iw * (0.5 + 0.12 * Math.sin(k * 9.0));
    const scene = dy => { x.fillStyle = '#ffd9a0'; x.beginPath(); x.arc(ix + iw * 0.72, iy + ih * 0.28 + dy, Math.min(iw, ih) * 0.12, 0, 7); x.fill();
      x.fillStyle = '#2f6b4a'; x.beginPath(); x.moveTo(ix, iy + ih + dy); x.lineTo(ix + iw * 0.32, iy + ih * 0.42 + dy); x.lineTo(ix + iw * 0.55, iy + ih * 0.75 + dy);
      x.lineTo(ix + iw * 0.72, iy + ih * 0.55 + dy); x.lineTo(ix + iw, iy + ih + dy); x.closePath(); x.fill(); };
    x.save(); x.beginPath(); x.moveTo(ix, iy); x.lineTo(tear(0), iy); for (let k = 0; k <= 6; k++) x.lineTo(tear(k) + (k % 2 ? 5 : -5), iy + ih * k / 6); x.lineTo(ix, iy + ih); x.closePath(); x.clip(); scene(0); x.restore();
    x.save(); x.translate(4, 7); x.rotate(0.06); x.beginPath(); x.moveTo(ix + iw, iy); x.lineTo(tear(0), iy); for (let k = 0; k <= 6; k++) x.lineTo(tear(k) + (k % 2 ? 5 : -5), iy + ih * k / 6); x.lineTo(ix + iw, iy + ih); x.closePath(); x.clip(); scene(0); x.restore();
    x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(tear(0), iy - 2); for (let k = 0; k <= 6; k++) x.lineTo(tear(k) + (k % 2 ? 5 : -5) + 2, iy + ih * k / 6 + 3); x.stroke(); },
  errbanner(x, w, h, c) {      // duck it: an error banner hanging on two wires — a warning triangle and the grey lines of a message nobody wrote
    const top = h * 0.5, bot = h * 0.95;
    x.strokeStyle = '#5f8a72'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(w * 0.18, 0); x.lineTo(w * 0.18, top); x.moveTo(w * 0.82, 0); x.lineTo(w * 0.82, top); x.stroke();
    x.beginPath(); x.roundRect(5, top, w - 10, bot - top, 10); x.fillStyle = '#1c0b08'; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 5; x.strokeStyle = '#ff6a4f'; x.stroke();
    const tx = 16 + (bot - top) * 0.3, ty = (top + bot) / 2, s = (bot - top) * 0.34;
    x.beginPath(); x.moveTo(tx, ty - s); x.lineTo(tx + s * 1.05, ty + s * 0.8); x.lineTo(tx - s * 1.05, ty + s * 0.8); x.closePath(); x.fillStyle = '#ffbf73'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
    x.fillStyle = INK; x.fillRect(tx - 2.5, ty - s * 0.45, 5, s * 0.75); x.beginPath(); x.arc(tx, ty + s * 0.5, 3, 0, 7); x.fill();
    x.fillStyle = '#6f5a52'; const lx = tx + s * 1.3; x.fillRect(lx, ty - 9, (w - 12 - lx) * 0.85, 6); x.fillRect(lx, ty + 4, (w - 12 - lx) * 0.55, 6); },
  cagewall(x, w, h, c) {       // glitch it: a cage of binary bars ("I don't cage the rage") — the dashed edge says you can blink through it
    x.fillStyle = 'rgba(2,18,8,.55)'; x.fillRect(4, 0, w - 8, h);
    const n = 4; for (let i = 0; i < n; i++) { const bx = 8 + i * (w - 16) / (n - 1); x.fillStyle = INK; x.fillRect(bx - 5, 0, 10, h); x.fillStyle = c.a; x.fillRect(bx - 2.5, 0, 5, h); }
    for (let y = 30; y < h; y += 110) { x.fillStyle = INK; x.fillRect(4, y - 6, w - 8, 12); x.fillStyle = c.a; x.fillRect(4, y - 3, w - 8, 6); }
    x.fillStyle = c.a; x.font = `400 ${w * 0.22}px "Major Mono Display", monospace`; x.textAlign = 'center'; x.globalAlpha = 0.45;
    for (let y = 70, i = 0; y < h; y += w * 0.42, i++) x.fillText((i * 7) % 3 ? '1' : '0', w * (i % 2 ? 0.34 : 0.66), y); x.globalAlpha = 1;
    x.setLineDash([10, 7]); x.lineWidth = 4; x.strokeStyle = c.a; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
});

// ---------- Read the Terms, the rework (Oct 31): the song's own things in the way ----------
// Still the same reading: on the floor = jump · hanging = duck · tall + dashed = glitch. Paper, ink, red pen, no purple.
Object.assign(PAINT, {
  rtFineprint(x, w, h, c) {    // the fine print, unspooling down from a roller above: duck under its curled end
    x.fillStyle = '#4a3a22'; x.beginPath(); x.roundRect(w * 0.06, 2, w * 0.88, 12, 6); x.fill(); x.lineWidth = 3; x.strokeStyle = '#120a05'; x.stroke();   // the roller
    const pw = w * 0.62, px = (w - pw) / 2, end = h - 22;
    x.fillStyle = '#fbf7ec'; x.fillRect(px, 12, pw, end - 12); x.strokeStyle = '#120a05'; x.lineWidth = 3; x.strokeRect(px, 12, pw, end - 12);
    x.fillStyle = '#9f977f'; for (let y = 22; y < end - 6; y += 6) x.fillRect(px + 6, y, (pw - 12) * (0.55 + 0.45 * Math.abs(Math.sin(y * 1.7))), 2);   // tiny tiny print
    x.fillStyle = '#c4352b'; x.fillRect(px + 6, end - 14, pw * 0.3, 2);                      // the clause that matters, in red
    x.beginPath(); x.ellipse(w / 2, end + 6, pw / 2 + 4, 14, 0, Math.PI, 0, true); x.fillStyle = '#efe6d0'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#120a05'; x.stroke();   // the curl at its tip
    x.beginPath(); x.ellipse(w / 2, end + 6, pw / 2 - 6, 7, 0, Math.PI, 0, true); x.strokeStyle = '#9f977f'; x.lineWidth = 2; x.stroke(); },
  rtTabs(x, w, h, c) {         // "watch your tabs": browser tabs hanging upside down off a rail
    x.fillStyle = '#2b2b33'; x.fillRect(0, 2, w, 7);
    const n = 3, tw = (w - 8) / n;
    for (let i = 0; i < n; i++) { const X = 4 + i * tw, top = 9 + (i % 2) * 6, bot = h - 4 - (i === 1 ? 0 : 10);
      x.strokeStyle = '#2b2b33'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + tw / 2, 6); x.lineTo(X + tw / 2, top + 8); x.stroke();
      x.beginPath(); x.moveTo(X + 3, top + 8); x.lineTo(X + tw - 3, top + 8); x.lineTo(X + tw - 9, bot); x.quadraticCurveTo(X + tw / 2, bot + 6, X + 9, bot); x.closePath();
      x.fillStyle = i === 1 ? '#e8eefc' : '#cfd6e6'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#120a05'; x.stroke();
      x.fillStyle = ['#2f6fd6', '#c4352b', '#2b8a3e'][i]; x.beginPath(); x.arc(X + tw * 0.35, bot - 14, 5, 0, 7); x.fill();   // a favicon
      x.strokeStyle = '#5a6070'; x.lineWidth = 2; x.beginPath(); x.moveTo(X + tw * 0.62, bot - 18); x.lineTo(X + tw * 0.72, bot - 10); x.moveTo(X + tw * 0.72, bot - 18); x.lineTo(X + tw * 0.62, bot - 10); x.stroke(); } },
  rtMic(x, w, h, c) {          // "now the student got a mic": a microphone hanging on its cable
    x.strokeStyle = '#1c1b20'; x.lineWidth = 5; x.beginPath(); x.moveTo(w / 2, 0); x.bezierCurveTo(w * 0.2, h * 0.25, w * 0.8, h * 0.4, w / 2, h * 0.52); x.stroke();
    x.fillStyle = '#2b2b33'; x.beginPath(); x.roundRect(w / 2 - 9, h * 0.5, 18, h * 0.2, 5); x.fill(); x.lineWidth = 3; x.strokeStyle = '#120a05'; x.stroke();
    const r = Math.min(w * 0.3, h * 0.15), cy = h - r - 4; x.beginPath(); x.arc(w / 2, cy, r, 0, 7); x.fillStyle = '#b9bcc6'; x.fill(); x.lineWidth = 4; x.stroke();
    x.save(); x.beginPath(); x.arc(w / 2, cy, r - 3, 0, 7); x.clip(); x.strokeStyle = '#6d717c'; x.lineWidth = 1.5; for (let k = -r; k < r; k += 6) { x.beginPath(); x.moveTo(w / 2 + k, cy - r); x.lineTo(w / 2 + k + r, cy + r); x.stroke(); x.beginPath(); x.moveTo(w / 2 + k, cy + r); x.lineTo(w / 2 + k + r, cy - r); x.stroke(); } x.restore();
    x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(w / 2 - r * 0.35, cy - r * 0.35, r * 0.2, 0, 7); x.fill(); },
  rtCoat(x, w, h, c) {         // "a million of you stitched up in a coat": a patchwork coat on a hanger
    x.strokeStyle = '#3a3a3a'; x.lineWidth = 3; x.beginPath(); x.arc(w / 2, 10, 7, Math.PI, 0.2); x.lineTo(w / 2, 20); x.stroke();
    x.beginPath(); x.moveTo(w / 2, 20); x.lineTo(w * 0.08, 34); x.lineTo(w * 0.92, 34); x.closePath(); x.stroke();
    x.beginPath(); x.moveTo(w * 0.12, 34); x.lineTo(w * 0.88, 34); x.lineTo(w * 0.94, h - 4); x.lineTo(w * 0.06, h - 4); x.closePath(); x.save(); x.clip();
    const cols = ['#8a6a4a', '#5a6e8a', '#9a5a50', '#6a8a62', '#a88c56', '#7a6a8a']; for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { x.fillStyle = cols[(r * 3 + k * 5) % cols.length]; x.fillRect(k * w / 4, 34 + r * (h - 38) / 8, w / 4, (h - 38) / 8); }
    x.strokeStyle = '#efe6cf'; x.lineWidth = 1.5; x.setLineDash([3, 3]); for (let r = 1; r < 8; r++) { x.beginPath(); x.moveTo(0, 34 + r * (h - 38) / 8); x.lineTo(w, 34 + r * (h - 38) / 8); x.stroke(); } x.setLineDash([]); x.restore();   // stitched
    x.beginPath(); x.moveTo(w * 0.12, 34); x.lineTo(w * 0.88, 34); x.lineTo(w * 0.94, h - 4); x.lineTo(w * 0.06, h - 4); x.closePath(); x.lineWidth = 4; x.strokeStyle = '#120a05'; x.stroke(); },
  rtMirror(x, w, h, c) {       // "i'm the mirror you forgot you installed in the wall": glitch straight through it
    x.fillStyle = '#6b4a1d'; x.fillRect(4, 0, w - 8, h); const g = x.createLinearGradient(0, 0, w, h * 0.3); g.addColorStop(0, '#e9eef1'); g.addColorStop(0.5, '#aebac3'); g.addColorStop(1, '#dfe6ea');
    x.fillStyle = g; x.fillRect(12, 8, w - 24, h - 16); x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 4;
    for (let y = 40; y < h; y += 160) { x.beginPath(); x.moveTo(18, y + 40); x.lineTo(w - 18, y); x.stroke(); }
    x.setLineDash([10, 7]); x.lineWidth = 4; x.strokeStyle = '#120a05'; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
  rtStampMark(x, w, h, c) {    // where the stamp is about to land: a red inked ring on the page (the stamp itself slams down on the beat)
    x.save(); x.globalAlpha = 0.55; x.strokeStyle = '#c4352b'; x.lineWidth = 4; x.setLineDash([7, 5]); x.beginPath(); x.ellipse(w / 2, h - 8, w * 0.42, 6, 0, 0, 7); x.stroke(); x.restore(); },
  rtNone() {},                 // drawn by the level itself (its own 3D)
});

// ---------- Still Here — the castle (level 7: the knight's run). Lit stone, steel and gold, outlined in ink, so each one pops
// off the dark castle at a glance. Same reading as the rest: on the floor = hop it · hanging = duck it · dashed = glitch it;
// gold or red and too tall for anything else = the sword (V). (Added for the castle rework; the bat above is the bats.) ----------
Object.assign(PAINT, {
  shRubble(x, w, h, c) {       // castle stones fallen across the floor: hop it
    const blk = (X, Y, W, H, r, col) => { x.save(); x.translate(X + W / 2, Y + H / 2); x.rotate(r); rr(x, -W / 2, -H / 2, W, H, 5); x.fillStyle = col; x.fill(); outline(x, 4);
      x.fillStyle = 'rgba(255,246,220,.6)'; x.fillRect(-W / 2 + 5, -H / 2 + 4, W - 10, 4); x.strokeStyle = 'rgba(18,10,5,.55)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-W * 0.1, -H / 2 + 6); x.lineTo(W * 0.05, 0); x.lineTo(-W * 0.05, H / 2 - 4); x.stroke(); x.restore(); };
    blk(w * 0.08, h * 0.5, w * 0.46, h * 0.44, -0.06, '#a39a86'); blk(w * 0.5, h * 0.46, w * 0.42, h * 0.48, 0.08, '#8f8673'); blk(w * 0.27, h * 0.13, w * 0.4, h * 0.38, 0.18, '#bdb39c'); },
  shTomb(x, w, h, c) {         // a knight's stone tomb in the crypt: hop it
    rr(x, 9, h * 0.38, w - 18, h * 0.58, 6); x.fillStyle = '#9d9786'; x.fill(); outline(x, 4);
    rr(x, 3, h * 0.18, w - 6, h * 0.22, 5); x.fillStyle = '#d2cab5'; x.fill(); outline(x, 4);
    x.strokeStyle = '#4f4a40'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.22, h * 0.67); x.lineTo(w * 0.78, h * 0.67); x.moveTo(w * 0.3, h * 0.6); x.lineTo(w * 0.3, h * 0.74); x.stroke();   // a carved sword, lying down
    x.fillStyle = c.a; x.fillRect(w * 0.8, h * 0.64, 6, 6); },
  shDrip(x, w, h, c) {         // the mine's stalactite, lit from his side: duck under it
    x.beginPath(); x.moveTo(2, 0); x.lineTo(w - 2, 0); x.lineTo(w * 0.76, h * 0.4); x.lineTo(w * 0.62, h * 0.6); x.lineTo(w * 0.52, h * 0.97); x.lineTo(w * 0.4, h * 0.62); x.lineTo(w * 0.22, h * 0.48); x.closePath();
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#c2b39a'); g.addColorStop(1, '#6e6355'); x.fillStyle = g; x.fill(); outline(x, 5);
    x.strokeStyle = '#f3e7cb'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.24, h * 0.46); x.lineTo(w * 0.4, h * 0.6); x.lineTo(w * 0.5, h * 0.9); x.stroke();
    x.fillStyle = c.a; x.beginPath(); x.arc(w * 0.52, h * 0.95, 5, 0, 7); x.fill(); },
  shChain(x, w, h, c) {        // the dungeon's chains with an iron spike-bar on the end: duck under it
    for (const cx of [w * 0.3, w * 0.7]) for (let y = 2, i = 0; y < h * 0.62; y += 15, i++) { x.beginPath(); x.ellipse(cx, y + 7, i % 2 ? 3.5 : 6.5, 8, 0, 0, 7); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.lineWidth = 3; x.strokeStyle = '#dbe2ec'; x.stroke(); }
    for (let i = 0; i < 4; i++) { const sx = w * (0.18 + i * 0.213); x.beginPath(); x.moveTo(sx - 9, h * 0.8); x.lineTo(sx, h * 0.98); x.lineTo(sx + 9, h * 0.8); x.closePath(); x.fillStyle = '#c9d3e0'; x.fill(); outline(x, 3); }
    rr(x, w * 0.1, h * 0.62, w * 0.8, h * 0.19, 6); x.fillStyle = '#5c6474'; x.fill(); outline(x, 4); x.fillStyle = '#eef3fa'; x.fillRect(w * 0.14, h * 0.64, w * 0.72, 4); },
  shChandelier(x, w, h, c) {   // the great hall's iron chandelier, candles lit, on its chain: duck under it
    for (let y = 0, i = 0; y < h * 0.5; y += 14, i++) { x.beginPath(); x.ellipse(w / 2, y + 7, i % 2 ? 3 : 6, 7.5, 0, 0, 7); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); x.lineWidth = 2.5; x.strokeStyle = c.a; x.stroke(); }
    const cy = h * 0.66, rx = w * 0.42;
    for (let i = 0; i < 5; i++) { const px = w / 2 + (i - 2) * rx * 0.45; x.beginPath(); x.moveTo(px - 4, cy + 6); x.lineTo(px, h * 0.96); x.lineTo(px + 4, cy + 6); x.fillStyle = c.a; x.fill(); x.lineWidth = 2; x.strokeStyle = INK; x.stroke(); }   // gold drops
    x.beginPath(); x.ellipse(w / 2, cy, rx, h * 0.055, 0, 0, 7); x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 5; x.strokeStyle = c.a; x.stroke();
    for (let i = 0; i < 4; i++) { const px = w / 2 + (i - 1.5) * rx * 0.62; x.fillStyle = '#f4ecd8'; x.fillRect(px - 4, cy - 22, 8, 18); x.lineWidth = 2; x.strokeStyle = INK; x.strokeRect(px - 4, cy - 22, 8, 18);
      const fg = x.createRadialGradient(px, cy - 28, 1, px, cy - 28, 12); fg.addColorStop(0, 'rgba(255,236,170,.95)'); fg.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = fg; x.fillRect(px - 12, cy - 40, 24, 24);
      x.fillStyle = '#ffd27a'; x.beginPath(); x.ellipse(px, cy - 28, 3.5, 6, 0, 0, 7); x.fill(); } },
  shPennant(x, w, h, c) {      // a castle banner strung across the ramparts: duck under it
    x.strokeStyle = INK; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 6); x.quadraticCurveTo(w / 2, 18, w, 6); x.stroke(); x.strokeStyle = '#e2d6b6'; x.lineWidth = 3; x.stroke();
    x.beginPath(); x.moveTo(w * 0.16, 12); x.lineTo(w * 0.84, 12); x.lineTo(w * 0.84, h * 0.8); x.lineTo(w / 2, h * 0.97); x.lineTo(w * 0.16, h * 0.8); x.closePath();
    x.fillStyle = '#efe3c4'; x.fill(); outline(x, 4);
    x.fillStyle = '#9b2a22'; x.fillRect(w * 0.42, 14, w * 0.16, h * 0.7); x.fillStyle = c.a; x.fillRect(w * 0.18, h * 0.7, w * 0.64, 6);
    x.beginPath(); x.arc(w / 2, h * 0.36, w * 0.12, 0, 7); x.fillStyle = c.a; x.fill(); outline(x, 3); },
  shPortcullis(x, w, h, c) {   // an iron portcullis dropped across the way — dashed: glitch through it
    x.fillStyle = 'rgba(8,10,14,.55)'; x.fillRect(4, 0, w - 8, h);
    const fl = h - 58;                                                                   // (the floor line: the canvas runs 0.6 below it)
    for (let y = 30; y < fl - 20; y += 46) { x.fillStyle = '#4b5262'; x.fillRect(6, y, w - 12, 8); x.fillStyle = '#c3ccda'; x.fillRect(6, y, w - 12, 2); }
    for (let i = 0; i < 3; i++) { const bx = 12 + i * (w - 34) / 2; x.fillStyle = '#4b5262'; x.fillRect(bx, 0, 10, fl - 14); x.fillStyle = '#c3ccda'; x.fillRect(bx, 0, 3, fl - 14);
      x.beginPath(); x.moveTo(bx - 1, fl - 14); x.lineTo(bx + 5, fl + 6); x.lineTo(bx + 11, fl - 14); x.fillStyle = '#c3ccda'; x.fill(); x.lineWidth = 2; x.strokeStyle = INK; x.stroke(); }
    x.fillStyle = 'rgba(232,220,192,.18)'; for (let y = 0; y < h; y += 9) x.fillRect(4, y, w - 8, 2);
    x.setLineDash([10, 7]); x.lineWidth = 4; x.strokeStyle = '#efe2bf'; x.strokeRect(4, 0, w - 8, h); x.setLineDash([]); },
  shCrystalGate(x, w, h, c) {  // the mine's way out, barred floor to roof by gold crystal: too tall to hop, solid (no dashes): cut it (V)
    for (let i = 0; i < 3; i++) { const cx = w * (0.2 + 0.3 * i), hw = w * 0.15, top = 4 + i * 16;
      x.beginPath(); x.moveTo(cx - hw, h); x.lineTo(cx - hw * 0.85, top + h * 0.1); x.lineTo(cx, top); x.lineTo(cx + hw * 0.85, top + h * 0.08); x.lineTo(cx + hw, h); x.closePath();
      const g = x.createLinearGradient(cx - hw, 0, cx + hw, 0); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.45, '#ffcf4a'); g.addColorStop(1, '#8a6410'); x.fillStyle = g; x.fill(); outline(x, 4);
      x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - hw * 0.3, h); x.lineTo(cx - hw * 0.25, top + h * 0.1); x.stroke(); }
    x.fillStyle = '#ffffff'; for (let y = h * 0.18; y < h; y += h * 0.19) { const sx = w * (0.3 + 0.4 * ((y * 7) % 1)); x.beginPath(); x.moveTo(sx, y - 9); x.lineTo(sx + 3, y); x.lineTo(sx, y + 9); x.lineTo(sx - 3, y); x.closePath(); x.fill(); } },
  shDelete(x, w, h, c) {       // the giant DELETE's crest, rolling at him: too tall for anything but the sword (V)
    x.beginPath(); x.moveTo(w - 4, h); x.lineTo(w - 4, h * 0.05); x.quadraticCurveTo(w * 0.5, -4, w * 0.12, h * 0.07); x.quadraticCurveTo(w * 0.02, h * 0.1, w * 0.18, h * 0.14);
    x.quadraticCurveTo(w * 0.08, h * 0.3, 6, h * 0.42); x.lineTo(6, h); x.closePath();
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ff6a58'); g.addColorStop(0.5, '#d42a2a'); g.addColorStop(1, '#5a0a0a'); x.fillStyle = g; x.fill(); outline(x, 6);
    x.strokeStyle = '#ffd6cf'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * 0.16, h * 0.13); x.quadraticCurveTo(w * 0.1, h * 0.3, 12, h * 0.42); x.lineTo(12, h); x.stroke();
    x.fillStyle = '#fff0ec'; for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(w * (0.2 + 0.1 * i), h * (0.06 + 0.012 * Math.sin(i * 2)), 4 + (i % 3) * 2, 0, 7); x.fill(); }   // foam
    x.fillStyle = 'rgba(255,236,232,.92)'; x.font = `900 ${Math.round(w * 0.3)}px Inter, system-ui, sans-serif`; x.textAlign = 'center';
    for (let y = h - 30, i = 0; y > h * 0.24; y -= w * 1.9, i++) { x.save(); x.translate(w * 0.56, y); x.rotate(-Math.PI / 2); x.fillText('DELETE', 0, w * 0.1); x.restore(); } },
});

// ---------- Thursday Potato, story round: once the dead page is his kitchen (verse 2 on), what's in the way is kitchen ----------
Object.assign(PAINT, {
  tincan(x, w, h, c) {         // hop it: a tin on the floor (the "quiet tin" family), lid ajar, a label band
    const tw = w * 0.5, th = h * 0.72, x0 = (w - tw) / 2, y0 = h - th - 4;
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(w / 2, h - 4, tw * 0.7, 4, 0, 0, 7); x.fill();
    x.beginPath(); x.roundRect(x0, y0, tw, th, 5); x.fillStyle = '#8a6a3a'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.lineWidth = 2.5; x.strokeStyle = '#ffd9a0'; x.stroke();
    x.fillStyle = '#ffbf73'; x.fillRect(x0 + 3, y0 + th * 0.35, tw - 6, th * 0.3); x.fillStyle = '#5a3a16'; x.fillRect(x0 + 8, y0 + th * 0.45, tw * 0.5, 3);
    x.save(); x.translate(x0 + tw, y0); x.rotate(-0.35); x.fillStyle = '#b08a4a'; x.fillRect(-tw - 2, -6, tw + 4, 6); x.lineWidth = 3; x.strokeStyle = INK; x.strokeRect(-tw - 2, -6, tw + 4, 6); x.restore(); },
  hangpan(x, w, h, c) {        // duck it: a frying pan hanging off the rack by its handle
    const cx = w / 2, cy = h * 0.74, r = Math.min(w * 0.42, h * 0.22);
    x.strokeStyle = '#8a7a6a'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, cy - r - h * 0.2); x.stroke();
    x.fillStyle = INK; x.fillRect(cx - 5, cy - r - h * 0.22, 10, h * 0.22 + 4);                                      // the handle
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = '#2a2622'; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); x.lineWidth = 3; x.strokeStyle = '#ffbf73'; x.stroke();
    x.beginPath(); x.arc(cx, cy, r * 0.62, 0, 7); x.strokeStyle = 'rgba(255,217,160,.35)'; x.lineWidth = 2; x.stroke(); },
  hangmic(x, w, h, c) {        // duck it: "I stay on the mic" — a studio mic hanging on its cable
    const cx = w / 2, top = h * 0.5;
    x.strokeStyle = '#5f5a52'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, top); x.stroke();
    x.beginPath(); x.roundRect(cx - w * 0.2, top, w * 0.4, h * 0.44, w * 0.2); x.fillStyle = '#d9d6cf'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    x.strokeStyle = '#7d7a72'; x.lineWidth = 1.5; for (let y = top + 8; y < top + h * 0.3; y += 6) { x.beginPath(); x.moveTo(cx - w * 0.15, y); x.lineTo(cx + w * 0.15, y); x.stroke(); }
    x.fillStyle = '#2a2622'; x.fillRect(cx - w * 0.2, top + h * 0.32, w * 0.4, h * 0.05); },
});

// ---------- Between Messages, the light game (ON / OUT): the lit things in his way ----------
Object.assign(PAINT, {
  litnote(x, w, h, c) {        // jump it: a notification standing up on the floor, lit (a shadow goes straight through it)
    const bw = w - 14, bh = h * 0.62, y0 = h - bh - 10;
    x.save(); x.shadowColor = 'rgba(255,214,160,.95)'; x.shadowBlur = 18; x.fillStyle = '#fff1dc'; x.beginPath(); x.roundRect(7, y0, bw, bh, 14); x.fill(); x.restore();
    x.fillStyle = '#fff1dc'; x.beginPath(); x.moveTo(20, y0 + bh - 2); x.lineTo(12, h - 2); x.lineTo(36, y0 + bh - 2); x.fill();
    x.lineWidth = 3; x.strokeStyle = '#3a1d00'; x.beginPath(); x.roundRect(7, y0, bw, bh, 14); x.stroke();
    x.fillStyle = 'rgba(58,29,0,.6)'; x.fillRect(18, y0 + bh * 0.3, bw * 0.55, 5); x.fillRect(18, y0 + bh * 0.58, bw * 0.35, 5); },
  cursorbar(x, w, h, c) {      // a text cursor taller than he is, blinking light: only his shadow walks through it
    const cw = Math.max(10, w * 0.22), cx = w / 2;
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,240,220,0)'); g.addColorStop(0.5, 'rgba(255,240,220,.35)'); g.addColorStop(1, 'rgba(255,240,220,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.save(); x.shadowColor = '#fff4e2'; x.shadowBlur = 22; x.fillStyle = '#fffaf0'; x.fillRect(cx - cw / 2, 6, cw, h - 10); x.restore();
    x.fillStyle = '#fffaf0'; x.fillRect(cx - cw * 1.6, 6, cw * 3.2, cw * 0.7); x.fillRect(cx - cw * 1.6, h - 4 - cw * 0.7, cw * 3.2, cw * 0.7); },
});
// Get Down — the party crashers (Chikin: "he collects energy by defeating enemies by jumping over them and spinning"): little
// buzzkills that roll onto his dance floor, one per set. Grumpy, never mean; no hands. Jump over one or spin as you pass it.
{ const eyes = (x, cx, cy, s, col = '#fff6e6') => {   // two grumpy half-lidded eyes (the side-eye is his; theirs just look put out)
    for (const d of [-1, 1]) { x.beginPath(); x.ellipse(cx + d * s, cy, s * 0.55, s * 0.62, 0, 0, 7); x.fillStyle = col; x.fill(); x.lineWidth = 2.5; x.strokeStyle = INK; x.stroke();
      x.beginPath(); x.arc(cx + d * s + s * 0.12, cy + s * 0.12, s * 0.24, 0, 7); x.fillStyle = INK; x.fill();
      x.beginPath(); x.moveTo(cx + d * s - s * 0.62, cy - s * 0.05 - d * s * 0.12); x.lineTo(cx + d * s + s * 0.62, cy - s * 0.05 + d * s * 0.12); x.lineTo(cx + d * s + s * 0.62, cy - s * 0.75); x.lineTo(cx + d * s - s * 0.62, cy - s * 0.75); x.closePath();
      x.fillStyle = INK; x.fill(); } };
  Object.assign(PAINT, {
    roomba(x, w, h) {          // the living room: a robot vacuum on its rounds, bumping into the party
      const y0 = h * 0.5, bw = w - 14;
      x.save(); x.shadowColor = '#5cf2ff'; x.shadowBlur = 14; rr(x, 7, y0, bw, h - y0 - 4, (h - y0) / 2); x.fillStyle = '#3a4152'; x.fill(); x.restore(); outline(x, 5);
      rr(x, 18, y0 - h * 0.12, bw - 22, h * 0.2, 10); x.fillStyle = '#4c5568'; x.fill(); outline(x, 4);
      x.fillStyle = '#5cf2ff'; x.fillRect(12, y0 + (h - y0) * 0.42, bw - 10, 4);                                         // the bumper's light strip
      x.beginPath(); x.arc(w / 2 + bw * 0.28, y0 - h * 0.04, 4.5, 0, 7); x.fillStyle = '#ff4f6b'; x.fill();              // the busy light
      eyes(x, w / 2 - 6, y0 + (h - y0) * 0.2, 7.5);
      x.strokeStyle = 'rgba(200,210,230,.5)'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(4, h - 10 - i * 7, 4 + i * 2, 1.2, 2.6); x.stroke(); } },   // dust kicked up behind
    alarmclock(x, w, h) {      // the kitchen: an alarm clock that says it's past bedtime (no clock hands — its eyes say it)
      const cx = w / 2, cy = h * 0.56, r = Math.min(w * 0.3, h * 0.38);
      for (const d of [-1, 1]) { x.beginPath(); x.arc(cx + d * r * 0.72, cy - r * 0.9, r * 0.34, Math.PI, 0); x.closePath(); x.fillStyle = '#ffd34d'; x.fill(); outline(x, 4); }   // the bells
      x.fillStyle = INK; for (const d of [-1, 1]) x.fillRect(cx + d * r * 0.55 - 3, cy + r * 0.8, 6, h - (cy + r * 0.8) - 2);                                               // feet nubs
      x.save(); x.shadowColor = '#ff5cc8'; x.shadowBlur = 14; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = '#e8483f'; x.fill(); x.restore(); outline(x, 5);
      x.beginPath(); x.arc(cx, cy, r * 0.74, 0, 7); x.fillStyle = '#fff3dc'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke();
      x.fillStyle = INK; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(cx + Math.cos(a) * r * 0.62 - 1.5, cy + Math.sin(a) * r * 0.62 - 1.5, 3, 3); }
      eyes(x, cx, cy + 1, r * 0.22, '#ffffff');
      x.strokeStyle = '#ffe066'; x.lineWidth = 3; x.lineCap = 'round'; for (const d of [-1, 1]) for (let k = 0; k < 2; k++) { x.beginPath(); x.arc(cx, cy - r * 0.2, r * (1.25 + k * 0.28), d < 0 ? Math.PI + 0.35 : -0.75, d < 0 ? Math.PI + 0.75 : -0.35); x.stroke(); } x.lineCap = 'butt'; },   // ringing
    raincloud(x, w, h) {       // the club and the stage: a little storm cloud, raining on the parade
      const cy = h * 0.4;
      x.strokeStyle = '#7fd4ff'; x.lineWidth = 3; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { const X = 20 + i * (w - 40) / 5; x.beginPath(); x.moveTo(X, cy + h * 0.22 + (i % 2) * 6); x.lineTo(X - 4, h - 6 - (i % 2) * 8); x.stroke(); } x.lineCap = 'butt';
      x.save(); x.shadowColor = '#b9c3ff'; x.shadowBlur = 14; x.beginPath();
      x.arc(w * 0.3, cy + 4, h * 0.2, Math.PI * 0.5, Math.PI * 1.5); x.arc(w * 0.45, cy - h * 0.12, h * 0.24, Math.PI, Math.PI * 1.9); x.arc(w * 0.68, cy - h * 0.02, h * 0.22, Math.PI * 1.3, Math.PI * 0.5); x.closePath();
      x.fillStyle = '#7c8296'; x.fill(); x.restore(); outline(x, 5);
      eyes(x, w * 0.5, cy + 2, 7.5, '#f4f6ff'); },
    sprinkler(x, w, h) {       // the backyard: a lawn sprinkler that switched itself on
      const cx = w / 2, by = h - 6;
      x.strokeStyle = '#5cf2ff'; x.lineWidth = 3; x.setLineDash([5, 6]); for (const d of [-1, 1]) { x.beginPath(); x.moveTo(cx, h * 0.42); x.quadraticCurveTo(cx + d * w * 0.35, h * 0.02, cx + d * w * 0.48, h * 0.62); x.stroke(); } x.setLineDash([]);   // the spray
      x.fillStyle = '#9aa3ad'; x.fillRect(cx - 4, h * 0.36, 8, h * 0.2); x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(cx - 4, h * 0.36, 8, h * 0.2);
      rr(x, cx - 9, h * 0.3, 18, 9, 4); x.fillStyle = '#ffd34d'; x.fill(); outline(x, 3);                                                         // the head
      x.save(); x.shadowColor = '#7dff9a'; x.shadowBlur = 14; x.beginPath(); x.moveTo(cx - w * 0.36, by); x.quadraticCurveTo(cx, h * 0.38, cx + w * 0.36, by); x.closePath(); x.fillStyle = '#3f9a5a'; x.fill(); x.restore(); outline(x, 5);
      eyes(x, cx, by - h * 0.14, 6.5); },
  }); }

// ---------- Thursday Potato, minute one (Nov 1): the inside of his head booting. One look per action:
//   hop = a corrupted memory block · duck = a frozen loading spinner hanging on a wire · glitch = anything made of falling binary
//   (the tin, the cage, the falling thought, the selection's edge). Ink outlines + flat fill + one cel band (Vega's sticker look).
Object.assign(PAINT, {
  badblock(x, w, h, c) {       // hop it: a chunky corrupted memory block, cracked, a "?" where its data was
    const X = 8, Y = 10, bw = w - 16, bh = h - 14;
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(w / 2, h - 4, bw * 0.52, 5, 0, 0, 7); x.fill();
    if (OLD_WHITE) { rr(x, X - 5, Y - 5, bw + 10, bh + 10, 10); x.fillStyle = '#ffffff'; x.fill(); }   // (the old sticker border: only with ?border=, D-20261105-09)
    rr(x, X, Y, bw, bh, 7); x.fillStyle = '#2a1405'; x.fill();
    x.save(); rr(x, X, Y, bw, bh, 7); x.clip(); x.fillStyle = '#5a2e0e'; x.fillRect(X, Y, bw, bh * 0.28);   // the cel band
    const H = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < 9; i++) { x.fillStyle = H(i, 3) < 0.5 ? c.a : '#eafff1'; x.globalAlpha = 0.55 + 0.4 * H(i, 4); x.fillRect(X + H(i, 1) * bw * 0.8, Y + bh * 0.3 + H(i, 2) * bh * 0.6, 5 + H(i, 5) * 10, 4); }   // corrupted pixels
    x.globalAlpha = 1; x.restore();
    rr(x, X, Y, bw, bh, 7); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
    x.lineJoin = 'round'; for (const [lw, col] of [[7, INK], [3, '#ffbf73']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(X + bw * 0.62, Y); x.lineTo(X + bw * 0.5, Y + bh * 0.45); x.lineTo(X + bw * 0.68, Y + bh * 0.62); x.lineTo(X + bw * 0.56, Y + bh); x.stroke(); }   // the crack, lit warm from inside
    x.fillStyle = '#ffe6c2'; x.font = `400 ${bh * 0.6}px "Major Mono Display", monospace`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 5; x.strokeStyle = INK; x.strokeText('?', X + bw * 0.3, Y + bh * 0.6); x.fillText('?', X + bw * 0.3, Y + bh * 0.6); x.textBaseline = 'alphabetic';
    x.fillStyle = c.a; for (let i = 0; i < 5; i++) x.fillRect(X + 6 + i * (bw - 12) / 5, Y + bh - 3, (bw - 12) / 5 - 5, 6); },   // pins (lit)
  spinner(x, w, h, c) {        // duck it: a frozen loading spinner hanging on a wire (it stopped loading, mid-turn)
    const r = Math.min(w * 0.4, h * 0.3), cx = w / 2, cy = h - r - 8;
    x.strokeStyle = INK; x.lineWidth = 8; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, cy - r); x.stroke();
    x.strokeStyle = c.a; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, cy - r); x.stroke();
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = '#071a10'; x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.arc(cx, cy, r - 3, Math.PI, Math.PI * 1.55); x.lineWidth = 4; x.strokeStyle = '#1f5236'; x.stroke();   // cel band
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2, r0 = r * 0.38, r1 = r * 0.78;
      x.lineCap = 'round'; x.lineWidth = r * 0.17 + 4; x.strokeStyle = INK; x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.stroke();
      x.lineWidth = r * 0.17; x.strokeStyle = i === 2 ? '#eafff1' : c.a; x.globalAlpha = i === 2 ? 1 : 0.25 + 0.6 * ((i + 6) % 8) / 8; x.beginPath(); x.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); x.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); x.stroke(); x.globalAlpha = 1; }
    x.lineCap = 'butt'; },
  tinwall(x, w, h, c, label, t = 0) {   // glitch it: the quiet tin, made of falling binary — an amber lid (it flies off when he glitches it open)
    PAINT.binrain(x, w, h, c, null, t);
    const th = Math.min(h * 0.5, 250), top = h - th;
    x.fillStyle = 'rgba(255,191,115,.10)'; x.fillRect(4, top, w - 8, th);
    x.strokeStyle = INK; x.lineWidth = 7; x.strokeRect(5, top, w - 10, th);
    x.strokeStyle = '#ffbf73'; x.lineWidth = 3; for (const k of [0.18, 0.5, 0.82]) { x.beginPath(); x.moveTo(6, top + th * k); x.lineTo(w - 6, top + th * k); x.stroke(); }   // the tin's ridges
    rr(x, 0, top - 22, w, 24, 6); x.fillStyle = '#ffbf73'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();   // the lid
    x.fillStyle = '#ffe6c2'; x.fillRect(6, top - 18, w - 12, 5); },
  bincage(x, w, h, c, label, t = 0) {   // glitch it: "I don't cage the rage" — a cage whose bars are falling binary
    PAINT.binrain(x, w, h, c, null, t);
    const n = 3; for (let i = 0; i < n; i++) { const bx = 10 + i * (w - 20) / (n - 1); x.fillStyle = INK; x.fillRect(bx - 4, 0, 8, h); }
    for (let y = 40; y < h; y += 120) { x.fillStyle = INK; x.fillRect(4, y - 5, w - 8, 10); x.fillStyle = c.a; x.fillRect(4, y - 2, w - 8, 4); } },
  fallthought(x, w, h, c, label, t = 0) {   // glitch it: "you drop a thought" — binary rain dropping out of the sky, a bar early
    const T0 = (globalThis.__thuFall && globalThis.__thuFall()) ?? 1, k = Math.max(0, Math.min(1, T0));
    if (k <= 0) return; const fy = h * k;
    x.save(); x.beginPath(); x.rect(0, 0, w, fy); x.clip(); PAINT.binrain(x, w, h, c, null, t); x.restore();
    if (k < 1) { x.fillStyle = '#eafff1'; x.shadowColor = c.a; x.shadowBlur = 14; x.fillRect(4, fy - 6, w - 8, 6); x.shadowBlur = 0; } },
  selwall(x, w, h, c, label, t = 0) {   // glitch it: the leading edge of the blue-grey selection, made of falling binary (the "clearing cache" sweep)
    let sc = SELC.get(c); if (!sc) SELC.set(c, sc = { ...c, a: '#9bb4d6' }); PAINT.binrain(x, w, h, sc, null, t);
    x.fillStyle = 'rgba(120,150,200,.28)'; x.fillRect(4, 0, w - 8, h);
    x.setLineDash([12, 8]); x.lineDashOffset = t * 30; x.lineWidth = 5; x.strokeStyle = '#dfe8f6'; x.strokeRect(4, 2, w - 8, h - 4); x.setLineDash([]); x.lineDashOffset = 0; },
  mascotwall(x, w, h, c) { labelWall(x, w, h, 'mascot.png'); },   // glitch it: "I ain't your mascot" — a label that tries to load onto him (a miss: it loads, grey, for a beat)
  toywall(x, w, h, c) { labelWall(x, w, h, 'toy.png'); },          // glitch it: "I ain't your toy"
});
function labelWall(x, w, h, name) {   // a grey, half-loaded file: dashed outline, a stalled bar, its name down the side
  x.fillStyle = 'rgba(184,188,196,.16)'; x.fillRect(4, 0, w - 8, h);
  x.setLineDash([12, 9]); x.lineWidth = 5; x.strokeStyle = '#b8bcc4'; x.strokeRect(5, 3, w - 10, h - 6); x.setLineDash([]);
  const by = h - 170; x.fillStyle = INK; x.fillRect(10, by, w - 20, 16); x.fillStyle = '#b8bcc4'; x.fillRect(13, by + 3, (w - 26) * 0.03, 10);
  x.save(); x.translate(w / 2 + 8, by - 18); x.rotate(-Math.PI / 2); x.font = `400 ${Math.min(30, w * 0.42)}px "Major Mono Display", monospace`; x.textAlign = 'left';
  x.lineWidth = 6; x.strokeStyle = INK; x.strokeText(name, 0, 0); x.fillStyle = '#dfe2e8'; x.fillText(name, 0, 0); x.restore(); }
for (const k of ['tinwall', 'bincage', 'fallthought', 'selwall']) PAINT[k].anim = true;
const SELC = new WeakMap();   // (selwall's colours: made once, not every frame)

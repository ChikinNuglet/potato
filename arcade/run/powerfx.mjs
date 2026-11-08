// powerfx.mjs — what each power LOOKS like when it goes off (Matt: "the glitch get activated, potato change costume, the
// power goes off, and potato changes back"). Drawn on the foreground overlay in screen pixels (960 x 540).
// A = Potato on screen, B = the thing it's for. k = 0..1 over the effect. Only Potato glitches purple; the powers have
// their own colours.
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export const FX_DUR = 0.9;

function burst(ctx, x, y, r, color, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
function shards(ctx, B, k, color, n = 14) {                    // the obstacle comes apart
  for (let i = 0; i < n; i++) { const a = rnd(i, 1) * 6.28, d = ease(k) * (60 + rnd(i, 2) * 120), s = 8 + rnd(i, 3) * 14;
    ctx.save(); ctx.translate(B.x + Math.cos(a) * d, B.y + Math.sin(a) * d + k * k * 80); ctx.rotate(a + k * 6 * (rnd(i, 4) - 0.5));
    ctx.globalAlpha = 1 - k; ctx.fillStyle = color; ctx.fillRect(-s / 2, -s / 3, s, s * 0.66); ctx.restore(); }
}
const FX = {
  disco(ctx, k, A, B, t) {                                     // a mirrorball drops over the gold word and the lights blow it apart
    const by = B.y - 120 + 60 * ease(k * 3), R = 26;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + t * 3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (1 - k);
      ctx.strokeStyle = ['#ff5cc8', '#5cf2ff', '#ffe45c', '#7dff6a'][i % 4]; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(B.x, by); ctx.lineTo(B.x + Math.cos(a) * 700, by + Math.sin(a) * 700); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#dfe6f0'; ctx.beginPath(); ctx.arc(B.x, by, R, 0, 7); ctx.fill(); ctx.fillStyle = '#9aa6b8';
    for (let i = 0; i < 16; i++) ctx.fillRect(B.x - R + (i % 4) * 13 + 2, by - R + Math.floor(i / 4) * 13 + 2, 9, 9);
    shards(ctx, B, k, ['#ff5cc8', '#5cf2ff', '#ffe45c'][Math.floor(t * 10) % 3]); },
  construction(ctx, k, A, B) {                                 // a girder slams down from above and flattens it
    const y = -60 + (B.y + 30 + 60) * ease(clamp(k * 2.5));
    ctx.fillStyle = '#ff9a1a'; ctx.fillRect(B.x - 110, y - 22, 220, 44); ctx.fillStyle = '#7a4200';
    for (let i = 0; i < 6; i++) ctx.fillRect(B.x - 100 + i * 38, y - 14, 22, 28);
    if (k > 0.4) { shards(ctx, B, (k - 0.4) / 0.6, '#c9b07a'); burst(ctx, B.x, B.y + 30, 140, '#ffb020', 1 - k); } },
  detective(ctx, k, A, B) {                                    // the lens sweeps over it: FAKE, and it dissolves
    const lx = A.x + (B.x - A.x) * ease(k * 2), ly = A.y - 20 + (B.y - A.y) * ease(k * 2);
    ctx.save(); ctx.strokeStyle = '#d8c39a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(lx, ly, 46, 0, 7); ctx.stroke();
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(lx + 32, ly + 32); ctx.lineTo(lx + 66, ly + 66); ctx.stroke(); ctx.restore();
    if (k > 0.45) { ctx.save(); ctx.translate(B.x, B.y); ctx.rotate(-0.2); ctx.globalAlpha = 1 - (k - 0.45) * 1.6; ctx.strokeStyle = ctx.fillStyle = '#ff3b3b'; ctx.lineWidth = 5;
      ctx.font = '400 40px "Major Mono Display", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeRect(-80, -30, 160, 60); ctx.fillText('fake', 0, 2); ctx.restore(); shards(ctx, B, (k - 0.45) / 0.55, '#d8c39a', 10); } },
  astronaut(ctx, k, A, B) {                                    // mag pulse: rings off him fling it away
    for (let i = 0; i < 4; i++) { const r = ease(k * 1.4 - i * 0.12) * 420; if (r <= 0) continue; ctx.save(); ctx.strokeStyle = '#8fd3ff'; ctx.globalAlpha = 1 - k; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(A.x, A.y, r, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
    if (k > 0.3) shards(ctx, { x: B.x + (k - 0.3) * 300, y: B.y - (k - 0.3) * 200 }, (k - 0.3) / 0.7, '#cfe9ff', 10); },
  ghost(ctx, k, A, B) {                                        // boo: it goes see-through and he floats through
    for (let i = 0; i < 6; i++) { const a = rnd(i, 7) * 6.28; ctx.save(); ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = '#e9e6ff';
      ctx.beginPath(); ctx.ellipse(A.x + Math.cos(a) * 80 * k, A.y + Math.sin(a) * 50 * k - 30 * k, 14, 20, 0, 0, 7); ctx.fill(); ctx.restore(); }
    },   // (the word "boo" is gone: Matt, "only text should be either part of the background or the lyrics")
  knight(ctx, k, A, B) {                                       // shield up: the thing breaks on it
    ctx.save(); ctx.translate(A.x + 50, A.y - 10); ctx.globalAlpha = 1 - Math.max(0, k - 0.7) * 3; ctx.fillStyle = '#c9d3e0'; ctx.strokeStyle = '#5a6578'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, -55); ctx.lineTo(36, -42); ctx.lineTo(30, 20); ctx.lineTo(0, 55); ctx.lineTo(-30, 20); ctx.lineTo(-36, -42); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (k > 0.25) { burst(ctx, B.x, B.y, 160, '#ffffff', 1 - k); shards(ctx, B, (k - 0.25) / 0.75, '#c9d3e0'); } },
  diver(ctx, k, A, B) {                                        // the lamp blazes: a cone of light that burns it away
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(A.x, A.y, B.x + 200, B.y); g.addColorStop(0, 'rgba(120,255,240,0.9)'); g.addColorStop(1, 'rgba(120,255,240,0)');
    ctx.globalAlpha = Math.sin(k * Math.PI); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(A.x + 20, A.y - 30); ctx.lineTo(B.x + 260, B.y - 160); ctx.lineTo(B.x + 260, B.y + 160); ctx.closePath(); ctx.fill(); ctx.restore();
    if (k > 0.35) shards(ctx, B, (k - 0.35) / 0.65, '#3fe0d0', 12); },
  cyborg(ctx, k, A, B) {                                       // override: circuit lines crawl over it, it powers down and drops
    ctx.save(); ctx.strokeStyle = '#6dffb0'; ctx.lineWidth = 3; ctx.shadowColor = '#6dffb0'; ctx.shadowBlur = 8; ctx.globalAlpha = 1 - Math.max(0, k - 0.7) * 3;
    for (let i = 0; i < 8; i++) { let x = A.x, y = A.y - 20 + (i - 4) * 8; ctx.beginPath(); ctx.moveTo(x, y); const end = A.x + (B.x - A.x) * ease(k * 1.6);
      while (x < end) { x += 20 + rnd(i, x) * 20; ctx.lineTo(Math.min(x, end), y); if (rnd(x, i) < 0.4) { y += (rnd(i, y) - 0.5) * 40; ctx.lineTo(Math.min(x, end), y); } } ctx.stroke(); } ctx.restore();
    if (k > 0.5) { ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#6dffb0'; ctx.font = '400 30px "Major Mono Display", monospace'; ctx.textAlign = 'center'; ctx.fillText('override', B.x, B.y - 90); ctx.restore(); shards(ctx, { x: B.x, y: B.y + (k - 0.5) * 120 }, (k - 0.5) * 2, '#556070', 10); } },
  king(ctx, k, A, B) {                                         // by royal decree: a scroll unrolls and it bows out of the way
    const w = 200 * ease(k * 2); ctx.save(); ctx.fillStyle = '#f2e3bc'; ctx.fillRect(A.x + 40, A.y - 120, w, 60); ctx.fillStyle = '#7a4a10'; ctx.font = '400 20px "Major Mono Display", monospace';
    if (k > 0.4) ctx.fillText('by decree', A.x + 54, A.y - 84); ctx.restore(); if (k > 0.4) shards(ctx, B, (k - 0.4) / 0.6, '#ffcf4a', 10); },
};
FX.singularity = (ctx, k, A, B, t) => { burst(ctx, A.x, A.y, 900 * ease(k), '#fff3c4', 1.4 * (1 - k)); for (const p of ['disco', 'astronaut', 'cyborg']) FX[p](ctx, k, A, B, t); };

// the moment he presses V: Potato glitches (purple — the one thing allowed to) and the power's colour gathers round him
export function drawActivate(ctx, A, age, color, t) {
  if (age > 0.6) { burst(ctx, A.x, A.y, 70 + 8 * Math.sin(t * 20), color, 0.35); return; }   // charged: a glow round him until it fires
  const k = age / 0.6;
  for (let i = 0; i < 10; i++) { const y = A.y - 70 + rnd(i, Math.floor(t * 30)) * 120, w = 40 + rnd(i, 5) * 140;
    ctx.save(); ctx.globalAlpha = (1 - k) * 0.85; ctx.fillStyle = i % 3 ? '#9a52ff' : '#e03ccf'; ctx.fillRect(A.x - w / 2 + (rnd(i, t) - 0.5) * 60, y, w, 6 + rnd(i, 9) * 8); ctx.restore(); }
  burst(ctx, A.x, A.y, 180 * k + 40, color, 1 - k * 0.6);
}
export function drawPower(ctx, power, k, A, B, t) { (FX[power] || FX.king)(ctx, clamp(k), A, B, t); }

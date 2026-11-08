// The music video for Confidently Incorrect — round 2 (Chikin: "clean, one story").
// LOGLINE: Potato free-falls down a shaft of confident nonsense, sure he's climbing; every word he glitches through
// becomes one of his "sources", the pile of them jams into one gold word, he blasts through it — and only gets surer.
// ONE SET: the shaft — two dark walls of endless wiki text scrolling up past him (he's falling; the course runs down
// the middle). One running gag: the altimeter in the corner swears he's going UP. Palette: sepia ink, cream paper,
// gold sources, a check-mark green — no other level looks like this.
// BEATS (set pieces sit in the side panels, below the lyric band)
//  1. boot (0–15)                 a big gauge: the needle runs past max on "astronomical" and snaps off; a little
//                                 gauge under it lies dead at zero ("accuracy: optional").
//  2. yappin' back (15–62.6)      every word he glitches through flies off him as a gold source card and lands on the
//                                 pile in the left panel. (crossover: e.caught)
//  3. wrong with authority (62.6–76.6)  chorus: every wall he lands on gets a big green ✓ stamped on it. (crossover: landings)
//                                 A polite blue bubble ("…") asks a question; he grabs the download instead.
//  4. seventeen citations (76.6–81.4)  every card on the pile spins like it's loading, then the whole pile is yanked
//                                 into the gold CITATIONS word coming up the shaft; the mag pulse blasts it. (crossover: the power)
//  5. weirdly applaudable (97.8–147.8)  a new pile starts; twelve papers flutter up the right wall.
//  6. in the data now (147.8–202)  a bar chart: one bar grows through the roof and catches fire; later, Mount Everest
//                                 stacks up as a sandwich.
//  7. for one second (202–206.2)   the walls go dark; one warm light under him. Quiet.
//  8. wrong with authority, again (206.2–241.5)  ✓ stamps again; three little bots nod along; a reactor glows below.
//  9. potato out (241.5–)          the altimeter stops; the button line (DRAFT for Chikin).
// No lyrics drawn here (the overlay owns the top band). No purple (only Potato glitches purple).
import { W, H, clamp, ease, rnd, span, fade, glitchText, glow, zap } from '../story.mjs';

const INK = '#d8c39a', CREAM = '#fff1d6', GREEN = '#7ef0a8', ORANGE = '#ff8a5c', CYAN = '#8fd3ff', GOLD = '#ffcf4a', RED = '#ff5a4a';
const L0 = 0, L1 = 340, R0 = 640, R1 = W, LC = (L0 + L1) / 2, RC = (R0 + R1) / 2;   // the two side panels (the course runs between)
const CITE = 77.85, JAM = 76.6;
const BUTTON = [242.2, 'sources: all of them me.'];                                  // DRAFT (Potato's voice) for Chikin
let ticks = [], lastLand = null;

export function story(ctx, e) {
  const { t, b, kick, bass, px, py, P, s } = e;
  if (t < 0.5 || e.dt > 2) { ticks = []; lastLand = null; }                          // a fresh run (or a jump in the demo)
  const chorus = span(t, 62.6, 97.8) || span(t, 206.2, 241.5), quiet = span(t, 202.1, 206.2), out = t > 241.5;
  const blastT = s.used && s.used.astronaut != null && t >= CITE ? CITE : null;               // the gold word breaks when he gets to it (V went off just before)

  // ---- the shaft: two walls of wiki text scrolling up past him ----
  const dim = quiet ? 0.15 : out ? clamp(1 - (t - 241.5) / 3) * 0.6 + 0.4 : 1;
  ctx.fillStyle = '#0d0b08'; ctx.globalAlpha = 0.92; ctx.fillRect(L0, 0, L1 - L0, H); ctx.fillRect(R0, 0, R1 - R0, H); ctx.globalAlpha = 1;
  ctx.save(); ctx.globalAlpha = 0.12 * dim; ctx.fillStyle = INK;
  for (const [x0, x1] of [[L0 + 16, L1 - 16], [R0 + 16, R1 - 16]]) for (let i = 0; i < 18; i++) {
    const y = ((i * 33 - t * 90) % 594 + 594) % 594 - 26, w = (x1 - x0) * (0.45 + 0.55 * rnd(i, x0)), head = i % 7 === 0; ctx.fillRect(x0, y, w, head ? 7 : 3); }
  ctx.restore();
  const sg = ctx.createLinearGradient(L1 - 40, 0, L1, 0); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = sg; ctx.fillRect(L1 - 40, 0, 40, H);
  const sg2 = ctx.createLinearGradient(R0 + 40, 0, R0, 0); sg2.addColorStop(0, 'rgba(0,0,0,0)'); sg2.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = sg2; ctx.fillRect(R0, 0, 40, H);

  // ---- the altimeter (the one counter): he's falling; it swears he's climbing ----
  if (!quiet && t < 247) { const tt = Math.min(t, 241.5), alt = Math.round(120 + tt * 61 + 4 * tt * tt), x = R1 - 132, y = H - 40;
    ctx.save(); ctx.globalAlpha = 0.85 * dim; ctx.fillStyle = '#16130e'; ctx.fillRect(x - 112, y - 18, 224, 36); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x - 112, y - 18, 224, 36); ctx.restore();
    glitchText(ctx, `↑ ${alt.toLocaleString('en-US')} ft`, x, y, 15, out ? GREEN : CREAM, t, 1.2, { alpha: 0.9 * dim }); }

  // ---- 1. boot: the confidence gauge snaps; accuracy lies dead ----
  if (t < 15.2) { const a = fade(t, 0.6, 15.2, 0.5, 0.6);
    const conf = t < 7.69 ? 0.05 : t < 8.97 ? ease((t - 7.69) / 1.2) : 1 + ease((t - 8.97) / 0.4) * 0.35, snap = t > 9.4 ? t - 9.4 : 0;
    gauge(ctx, RC, 300, 110, conf, snap, a, GREEN);
    if (t > 10.25) gauge(ctx, RC, 430, 52, 0.01 + 0.02 * Math.abs(Math.sin(t * 7)), 0, a * clamp((t - 10.25) / 0.4), RED); }

  // ---- 2./5. the pile of sources: every word he glitches through flies off him onto it ----
  const pile = e.caught.filter(c => c.t <= t && (t < CITE ? true : c.t > CITE)).slice(-9);
  const jam = span(t, JAM, CITE), yank = jam && t > CITE - 0.8 ? ease((t - (CITE - 0.8)) / 0.8) : 0;
  const armY = clamp(py + (CITE - t) * 430, py, H + 40);                               // the gold word coming up the shaft at him
  if (!quiet && t > 15 && t < 246) pile.forEach((c, i) => {
    const age = t - c.t, fly = clamp(age / 0.5), cx = LC + (rnd(c.t, 1) - 0.5) * 30, cy = H - 84 - i * 34, rot = (rnd(c.t, 2) - 0.5) * 0.12;
    let x = px + (cx - px) * ease(fly), y = py + (cy - py) * ease(fly) - Math.sin(fly * Math.PI) * 60;
    if (yank) { x += ((px + 30) - x) * yank; y += (armY - y) * yank; }
    card(ctx, x, y, fly < 1 ? 0.55 + 0.45 * fly : 1, rot + (jam ? Math.sin(t * 30 + i) * 0.05 : 0), dim * (1 - yank * 0.5), jam && !yank, t + i);
  });
  if (yank > 0 && pile.length) zap(ctx, LC, H - 60, px + 20, armY, GOLD, 0.8, t);

  // ---- 3. chorus: every wall he lands on gets a ✓ ----
  if (s.landedAt != null && s.landedAt !== lastLand) { lastLand = s.landedAt; if (chorus) ticks.push({ t: s.landedAt, x: px + ((s.gdir || -1) > 0 ? 70 : -70), y: py }); }
  ticks = ticks.filter(q => t - q.t < 1.2 && q.t <= t);
  for (const q of ticks) tick(ctx, q.x, q.y - (t - q.t) * 160, t - q.t);
  if (span(t, 72.1, 76.6)) { const k = fade(t, 72.1, 76.6, 0.3, 0.3), bx = RC, by = 300;    // the other voice: one polite question
    ctx.save(); ctx.globalAlpha = k * 0.85; ctx.fillStyle = '#2b3140'; ctx.beginPath(); ctx.roundRect(bx - 70, by - 34, 140, 68, 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx - 40, by + 30); ctx.lineTo(bx - 64, by + 56); ctx.lineTo(bx - 14, by + 32); ctx.fill();
    ctx.fillStyle = '#e8eefc'; for (let i = 0; i < 3; i++) { ctx.globalAlpha = k * (0.4 + 0.6 * (Math.floor(t * 4) % 3 === i ? 1 : 0)); ctx.beginPath(); ctx.arc(bx - 26 + i * 26, by, 7, 0, 7); ctx.fill(); }
    ctx.restore(); }

  // ---- 4. the mag pulse: the blast through CITATIONS ----
  if (blastT != null) { const age = t - blastT; if (age < 1.3) { for (let k = 0; k < 3; k++) { const r = age * 640 + k * 70;
      ctx.strokeStyle = CYAN; ctx.globalAlpha = clamp(1 - age / 1.3) * 0.85; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28, r = 30 + age * 420; ctx.fillStyle = i % 2 ? GOLD : CREAM; ctx.globalAlpha = clamp(1 - age / 1.1);   // the jammed sources, blown to confetti
      ctx.fillRect(px + Math.cos(a) * r - 6, py + 40 + Math.sin(a) * r * 0.7 - 3, 12, 6); } ctx.globalAlpha = 1; } }
  if (span(t, 88.43, 95.6)) for (let i = 0; i < 3; i++) { const r = ((t - 88.43) / P * 0.5 + i / 3) % 1;   // "I need a louder" — rings off him
    ctx.strokeStyle = CREAM; ctx.globalAlpha = (1 - r) * 0.25; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, 50 + r * 420, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }

  // ---- 5. twelve papers flutter up the right wall ----
  if (span(t, 117.1, 123.0)) { const a = fade(t, 117.1, 123.0, 0.3, 0.6);
    for (let i = 0; i < 12; i++) { const y = H + 30 - ((t - 117.1) * 150 + i * 46) % (H - 120), x = R0 + 50 + (i % 4) * 72 + Math.sin(t * 3 + i) * 10;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + i) * 0.4); ctx.globalAlpha = 0.7 * a; ctx.fillStyle = '#e9dfc8'; ctx.fillRect(-15, -19, 30, 38);
      ctx.fillStyle = '#8a7a5a'; for (let r = 0; r < 5; r++) ctx.fillRect(-11, -13 + r * 6, 22, 2); ctx.restore(); } }

  // ---- 6. in the data now: the bar chart that catches fire; Everest, a sandwich ----
  if (span(t, 152.38, 160.5)) { const a = fade(t, 152.38, 160.5, 0.4, 0.6), x0 = R0 + 50, base = 470, k = clamp((t - 152.6) / 3);
    ctx.save(); ctx.globalAlpha = 0.75 * a; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 10, 200); ctx.lineTo(x0 - 10, base); ctx.lineTo(x0 + 240, base); ctx.stroke();
    [0.3, 0.5, 0.4].forEach((v, i) => { ctx.fillStyle = INK; ctx.fillRect(x0 + i * 60, base - v * 120, 40, v * 120); });
    const tall = k * 290; ctx.fillStyle = ORANGE; ctx.fillRect(x0 + 180, base - tall, 40, tall); ctx.restore();
    if (t > 156.2) flame(ctx, x0 + 200, base - tall, t, a); }
  if (span(t, 192.98, 202.1)) { const k = fade(t, 192.98, 202.1, 0.5, 0.5), cx = RC, base = 470;
    ctx.save(); ctx.globalAlpha = 0.8 * k; const layer = (y0, y1, c) => { const w0 = (y0 - 250) * 0.5, w1 = (y1 - 250) * 0.5; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx - w0, y0); ctx.lineTo(cx + w0, y0); ctx.lineTo(cx + w1, y1); ctx.lineTo(cx - w1, y1); ctx.fill(); };
    layer(base, 440, '#c8935a'); if (t > 195.3) layer(440, 418, '#d86a6a'); if (t > 196.3) layer(418, 398, '#7fae5a'); if (t > 197.63) layer(398, 376, '#e8b0a0'); if (t > 198.6) layer(376, 254, '#c8935a');
    if (t > 199.8) { ctx.strokeStyle = '#e9dfc8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, 236); ctx.lineTo(cx, 330); ctx.stroke(); ctx.fillStyle = RED; ctx.fillRect(cx - 1, 230, 12, 8); }   // the toothpick (with a flag)
    ctx.restore(); }

  // ---- 7. for one second: one warm light under him ----
  if (quiet) glow(ctx, px, py + 150, 200, '#ffb36b', 0.35 * fade(t, 202.1, 206.2, 0.6, 0.8));

  // ---- 8. three little bots nod along; the reactor down the shaft ----
  if (span(t, 216.53, 220.5)) { const a = fade(t, 216.53, 220.5, 0.3, 0.5);
    for (let i = 0; i < 3; i++) { const x = LC - 100 + i * 100, nod = Math.abs(Math.sin((b + i * 0.3) * Math.PI)) * 8, y = 300 + nod;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = CYAN; ctx.lineWidth = 2; ctx.strokeRect(x - 26, y - 22, 52, 44); ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y - 34); ctx.stroke();
      ctx.fillStyle = CYAN; ctx.fillRect(x - 13, y - 8, 7, 7); ctx.fillRect(x + 6, y - 8, 7, 7); ctx.fillRect(x - 10, y + 8, 20, 3); ctx.restore(); } }
  if (span(t, 223.49, 226.4)) glow(ctx, W / 2, H + 60, 340 + 80 * (bass || 0), '#ff6a2a', 0.45 + 0.35 * kick);

  // ---- 9. potato out: the button ----
  if (t > BUTTON[0]) glitchText(ctx, BUTTON[1], RC, 300, 18, CREAM, t, BUTTON[0], { glow: ORANGE, alpha: clamp((t - BUTTON[0]) / 1.2) });
}

// ---------- pieces ----------
function gauge(ctx, x, y, r, k, snap, a, color) {                                   // a dial: 0 at the left, max at the right; past max it snaps
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a * 0.85; ctx.lineWidth = Math.max(3, r * 0.06); ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = RED; ctx.beginPath(); ctx.arc(x, y, r, -0.5, 0); ctx.stroke();
  for (let i = 0; i <= 8; i++) { const q = Math.PI + i / 8 * Math.PI; ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x + Math.cos(q) * r * 0.86, y + Math.sin(q) * r * 0.86); ctx.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r); ctx.stroke(); }
  const ang = Math.PI + Math.min(k, 1.35) * Math.PI, nx = snap ? x + snap * 60 : x, ny = snap ? y - snap * snap * 320 : y, rot = snap * 9;   // the snapped needle floats up the shaft (he's falling)
  ctx.save(); ctx.translate(nx, ny); ctx.rotate(ang + rot); ctx.strokeStyle = color; ctx.lineWidth = Math.max(3, r * 0.05); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.92, 0); ctx.stroke(); ctx.restore();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, Math.max(4, r * 0.07), 0, 7); ctx.fill();
  if (snap > 0 && snap < 0.3) glow(ctx, x + r * 0.7, y - r * 0.5, 50, '#ffffff', 1 - snap / 0.3);
  ctx.restore();
}
function card(ctx, x, y, s, rot, a, spin, tt) {                                     // a source card: cream, gold edge, no words
  if (a <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = a * 0.85;
  ctx.fillStyle = '#efe4c8'; ctx.fillRect(-120, -14, 240, 28); ctx.fillStyle = GOLD; ctx.fillRect(-120, -14, 10, 28);
  ctx.fillStyle = '#9a8a66'; ctx.fillRect(-100, -6, 130, 4); ctx.fillRect(-100, 3, 84, 4);
  if (spin) { ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(98, 0, 8, tt * 8, tt * 8 + 4.2); ctx.stroke(); }
  ctx.restore();
}
function tick(ctx, x, y, age) {                                                      // a big green ✓ stamped on the wall
  const k = clamp(age * 5), s = 1 + 1.2 * (1 - ease(k)); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 3) * clamp((1.2 - age) / 0.4) * 0.9;
  ctx.strokeStyle = GREEN; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-4, 13); ctx.lineTo(18, -16); ctx.stroke(); ctx.restore();
}
function flame(ctx, x, y, t, a) {
  ctx.save(); ctx.globalAlpha = a; for (let i = 0; i < 3; i++) { const h = 40 + 14 * Math.sin(t * 14 + i * 2); ctx.fillStyle = ['#ff7a1a', '#ffb020', '#ffe066'][i];
    ctx.beginPath(); ctx.moveTo(x - 22 + i * 7, y); ctx.quadraticCurveTo(x - 14 + i * 6, y - h * 0.6, x + i * 3 - 3, y - h + i * 8); ctx.quadraticCurveTo(x + 14 - i * 2, y - h * 0.5, x + 22 - i * 7, y); ctx.fill(); }
  ctx.restore(); glow(ctx, x, y - 20, 90, '#ff8a3d', 0.4 * a);
}

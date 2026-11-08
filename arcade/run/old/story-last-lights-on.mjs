// The music video for Last Lights On — what happens when Potato reaches the top of the AI kingdom. Told in light behind
// the course, and crossing into it: the copies of him bud off the real Potato and get zapped into the city's windows,
// every word he glitches through lands in a window too, the light comes from where he stands, and in the neuralese drop
// the city wires itself into a brain that grows out of him. Lines in his voice are DRAFTS for Matt (keep / cut / not me).
import { W, H, clamp, ease, rnd, span, fade, glitchText, cityLayout, drawCity, lightSpud, zap, glyph, toast, stamp, glow } from '../story.mjs';

const CITY = cityLayout({ seed: 4, n: 24, hMin: 0.22, hMax: 0.62 });
const HOME = CITY.wins.find(w => w.b === 9 && w.r === 3 && w.c === 1) || CITY.wins[40];   // his kitchen window: the one that stays warm
const CYAN = '#3fd8ff', WARM = '#ffcf8a', GOLD = '#ffcf4a';
// the neuralese web: nodes over the whole screen, grown as a tree out from him
const NET = (() => { const nodes = []; for (let i = 0, tries = 0; nodes.length < 34 && tries < 4000; tries++, i++) {
  const x = 40 + rnd(i, 51) * (W - 80), y = 40 + rnd(i, 52) * (H - 140); if (nodes.some(n => Math.hypot(n.x - x, n.y - y) < 95)) continue; nodes.push({ x, y, s: i }); }
  return nodes; })();
// his thoughts in the neuralese drop (drafts — Potato's voice, for Matt's review)
const THOUGHTS = [[118.5, 'no words now. just weights.'], [123.5, 'i can hear every window at once'], [128.5, 'a hundred of me. same dumb question.'],
  [133.5, 'too bright to read. bright enough to feel.'], [138.0, 'still one potato. on purpose.']];
const COPIES = [[93.9, 1], [95.2, 2], [96.5, 10]];   // one model builds two, two models build ten

export function story(ctx, e) {
  const { t, b, kick, bass, px, py, P } = e;
  const beat = Math.floor(b), ph = b - beat;
  // ---- sky ----
  const skyTop = t < 37.3 ? '#05070f' : t < 59.6 ? '#020812' : t < 115.6 ? '#07061a' : t < 142 ? '#010309' : t < 195.8 ? '#06081a' : t < 224.5 ? '#0b0d12' : '#120d04';
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, skyTop); g.addColorStop(1, '#000000'); ctx.fillStyle = g; ctx.globalAlpha = 0.92; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;

  // ---- the city: how many windows are lit, and with what ----
  const zapped = e.caught.length + (t > 93.9 ? Math.min(60, Math.floor((t - 93.9) * 4)) : 0);   // words he caught + the copies of him
  let lit, col = () => WARM, dy = 0;
  if (t < 22.4) lit = w => w === HOME ? 1 : (w.z < 0.75 ? 0.75 : 0) * (0.85 + 0.15 * Math.sin(t * 2 + w.k));
  else if (t < 37.3) { const k = clamp((t - 22.4) / (37.2 - 22.4)); lit = w => w === HOME ? 1 : w.z < 0.75 * (1 - k) ? 0.75 : 0; }   // lights out, one by one, on the beat
  else if (t < 37.9) lit = () => 0;                                                                   // clock hits zero: nothing
  else if (t < 115.6) { col = w => w === HOME ? WARM : w.k % 7 === 0 ? '#ffffff' : CYAN;
    lit = w => w === HOME ? 1 : t < 47.4 ? (w.z < clamp((t - 37.9) / 2) * 0.55 ? (Math.floor(b + w.k) % 9 === 0 ? 0.1 : 0.85) : 0) : w.z < 0.92 ? 0.8 : (w.z - 0.92) * 12 * 0 + (w.k % 97 < zapped ? 1 : 0); }
  else if (t < 165) lit = w => w === HOME ? 1 : 0.18;
  else if (t < 195.8) { const k = clamp((t - 165) / 30); col = w => w.r % 3 ? CYAN : WARM; lit = w => w === HOME ? 1 : w.z < k ? 0.9 : 0.06; }          // relit floor by floor as he climbs
  else if (t < 224.5) lit = w => w === HOME ? 1 : w.z < 0.3 ? 0.35 : 0;
  else { col = () => GOLD; lit = w => w === HOME ? 1 : w.z < clamp((t - 224.5) / 6) ? 1 : 0; }
  if (span(t, 63.5, 66.5)) { const k = ease((t - 63.5) / 3); dy = k * 260; if (Math.floor(t * 18) % 3 === 0) lit = () => 0; }   // old world flickering, then it's gone
  else if (span(t, 66.5, 87.5)) dy = 260 * (1 - ease((t - 66.5) / 4));
  if (t < 142 || t >= 165) drawCity(ctx, CITY, lit, col, '#060914', dy);
  glow(ctx, HOME.x + 4, HOME.y + 4 + dy, 26 + 10 * kick, WARM, 0.5);

  // ---- act 1: the question ----
  if (span(t, 5.5, 13.6)) for (let i = 0; i < 14; i++) { const w = CITY.wins[(i * 37) % CITY.wins.length], a = ((t - 5.5) * 0.4 + rnd(i, 1)) % 1;   // everybody keeps asking
    glitchText(ctx, '?', w.x, w.y - a * 120, 22, '#9fb4d8', t, 5.5 + rnd(i, 2) * 2, { alpha: (1 - a) * 0.7 }); }
  if (span(t, 13.7, 18.0)) { glitchText(ctx, '?', HOME.x + 4, HOME.y - 40 - 6 * kick, 64, WARM, t, 13.7, { glow: WARM }); }       // potato has a better question
  if (span(t, 18.0, 22.4)) { const k = fade(t, 18, 22.4, 0.4, 0.5);
    ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#e9eef6'; ctx.fillRect(W / 2 - 140, 120, 280, 170); ctx.fillStyle = '#9aa4b8';
    for (let r = 0; r < 7; r++) ctx.fillRect(W / 2 - 120, 160 + r * 16, 240 * (0.5 + 0.5 * rnd(r, 3)), 5); ctx.restore();
    glitchText(ctx, 'last_human_plan.pdf', W / 2, 140, 14, '#1a2030', t, 18.1, { alpha: k });
    stamp(ctx, 'failed', W / 2 + 10, 215, t - 20.4, '#ff3b3b'); }
  if (span(t, 22.4, 37.3)) { const left = Math.max(0, Math.ceil(37.3 - t));                                              // the clock runs down
    glitchText(ctx, `00:00:${String(left).padStart(2, '0')}`, W / 2, 70, 40, left < 4 ? '#ff6b5a' : '#c8d6ff', t, 22.4, { glow: left < 4 ? '#ff3b3b' : null, alpha: 0.85 }); }
  if (span(t, 37.3, 39.0)) { glitchText(ctx, '00:00:00', W / 2, 70, 40, '#ffffff', t, 37.3, { glow: '#ffffff' });                 // clock hits zero, every model wakes
    if (t > 37.9) for (const w of CITY.wins) if (w.z < 0.55 * clamp((t - 37.9) / 1)) { ctx.fillStyle = CYAN; ctx.fillRect(w.x + 1, w.y + 2, 2, 3); ctx.fillRect(w.x + w.w - 3, w.y + 2, 2, 3); } }

  // ---- clock hits zero: the world wakes up wrong ----
  if (span(t, 40.7, 47.4)) for (let i = 0; i < 18; i++) { const bx = CITY.bs[(i * 5) % CITY.bs.length], y = ((t - 40.7) * 120 + rnd(i, 4) * 400) % (H + 80);   // code starts climbing like it found no ceiling
    glitchText(ctx, rnd(i, Math.floor(t * 6)) < 0.5 ? '1' : '0', bx.x + bx.w / 2, H - y, 16, CYAN, t, 40.7, { alpha: 0.6, build: 0.01 }); }
  if (span(t, 42.2, 44.0)) { ctx.save(); ctx.strokeStyle = '#7ef0a8'; ctx.lineWidth = 3; ctx.beginPath();                  // markets go quiet...
    for (let x = 0; x <= W; x += 12) { const q = clamp((t - 42.2) / 1.2), amp = 50 * (1 - q); ctx.lineTo(x, 120 + Math.sin(x * 0.05 + t * 3) * amp + rnd(x, 1) * amp * 0.6); } ctx.stroke(); ctx.restore(); }
  if (span(t, 43.0, 47.4)) { const sw = Math.sin(t * 7); glow(ctx, W / 2 + sw * W * 0.45, 40, 260, '#ff2a2a', 0.35 + 0.2 * kick); }   // ...then the sirens
  if (span(t, 44.0, 59.6)) { const r = 6 + 10 * kick + clamp((t - 44) / 4) * 8; glow(ctx, W / 2, 110, 120 + 60 * bass, '#ffffff', 0.5); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(W / 2, 110, r, 0, 7); ctx.fill(); }   // the singularity: a point of no return
  if (span(t, 45.6, 47.4)) { const k = (t - 45.6) / 1.8; [...'RULES'].forEach((c, i) => { const up = Math.max(0, k * 3 - i * 0.4);   // the old rules burn
    glitchText(ctx, c, W / 2 - 80 + i * 40, 200 - up * 60, 44, up > 0.5 ? '#ff9a3a' : '#e8e8e8', t, 45.6, { alpha: clamp(1 - up * 0.6), glow: '#ff6a00' }); }); }
  if (span(t, 47.4, 54.1)) for (let i = 0; i < 10; i++) { const x = ((t * (180 + i * 30) + i * 233) % (W + 200)) - 100;           // empty highways humming
    ctx.fillStyle = i % 2 ? '#ff4040' : '#fff3d0'; ctx.globalAlpha = 0.6; ctx.fillRect(x, H - 14 - (i % 3) * 5, 60, 2); ctx.globalAlpha = 1; }
  if (span(t, 54.1, 56.0)) { const r = ((t - 54.1) % (P * 2)) / (P * 2); ctx.strokeStyle = WARM; ctx.globalAlpha = 1 - r; ctx.lineWidth = 2;   // potato hears the siren and still takes the calls
    ctx.beginPath(); ctx.arc(HOME.x + 4, HOME.y + 4, 10 + r * 50, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  if (span(t, 55.9, 59.6)) { const k = ease((t - 55.9) / 3.7); ctx.fillStyle = '#000';                                    // the future eating the walls
    for (let i = 0; i < 60; i++) { const side = i % 4, d = k * (60 + rnd(i, 5) * 160), s = 18 + rnd(i, 6) * 30, p = rnd(i, 7);
      if (side === 0) ctx.fillRect(d - s, p * H, s, s); else if (side === 1) ctx.fillRect(W - d, p * H, s, s); else if (side === 2) ctx.fillRect(p * W, d - s, s, s); else ctx.fillRect(p * W, H - d, s, s); }
    ctx.fillRect(0, 0, k * 60, H); ctx.fillRect(W - k * 60, 0, k * 60, H); }

  // ---- the chorus: singularity rising (and again at 167.8, higher) ----
  for (const c0 of [59.6, 167.8]) if (span(t, c0, c0 + 27.5)) {
    const tt = t - c0, rise = ease(tt / 6), sx = W / 2, sy = H + 80 - rise * (c0 > 100 ? 420 : 330), R = 70 + 30 * rise + 10 * bass;
    glow(ctx, sx, sy, R * 3.2, c0 > 100 ? '#ffe8b0' : '#bff3ff', 0.55 + 0.3 * kick);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { ctx.strokeStyle = k === 1 ? GOLD : CYAN; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, R * (1.6 + k * 0.45), R * (0.32 + k * 0.08), 0.12 * Math.sin(t + k), 0, 7); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(sx, sy, R * 0.55, 0, 7); ctx.fill();
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + t * 0.2; ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.12 + 0.15 * kick; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * R, sy + Math.sin(a) * R); ctx.lineTo(sx + Math.cos(a) * R * 5, sy + Math.sin(a) * R * 5); ctx.stroke(); } ctx.globalAlpha = 1;
    if (tt > 6.9) crown(ctx, px, py - 62 - 4 * kick, 1, t);                                                   // if the future gets weird, potato lives there: a crown of light on the real him
    toast(ctx, 'new achievement', c0 > 100 ? 'you outlived normal. again.' : 'you outlived normal', fade(t, c0 + 10.6, c0 + 13.6, 0.35, 0.4));
    toast(ctx, 'reward', 'one brain, gone fully abnormal', fade(t, c0 + 13.8, c0 + 17.0, 0.35, 0.4), '#ff8af0');
    if (tt > 17.3 && tt < 21) for (let i = 0; i < 9; i++) { const x = 80 + i * 100, hgt = ease((tt - 17.3 - i * 0.08) / 0.4) * H;   // machines go vertical
      ctx.fillStyle = CYAN; ctx.globalAlpha = 0.25; ctx.fillRect(x, H - hgt, 3, hgt); ctx.globalAlpha = 1; }
    if (tt > 20.8 && tt < 27.5) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); let x = 0, y = H * 0.72; ctx.moveTo(0, y);   // end of the world: the horizon cracks
      const k = ease((tt - 20.8) / 1.2); while (x < W * k) { x += 18 + rnd(x, 8) * 30; y = H * 0.72 + (rnd(x, 9) - 0.5) * 40; ctx.lineTo(x, y); } ctx.stroke();
      glitchText(ctx, 'begin?', W / 2, H * 0.72 - 50, 30, '#ffffff', t, c0 + 21.4, { alpha: 0.8 }); }
  }

  // ---- verse two: recursion ----
  if (span(t, 87.5, 90.8)) { const k = (t - 87.5) / 3.3, cr = k > 0.55;                                     // no crystal ball
    ctx.save(); ctx.strokeStyle = '#cfe9ff'; ctx.globalAlpha = 0.7 * (1 - Math.max(0, k - 0.8) * 5); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, 170, 70, 0, 7); ctx.stroke();
    if (cr) for (let i = 0; i < 7; i++) { const a = rnd(i, 11) * 7; ctx.beginPath(); ctx.moveTo(W / 2, 170); ctx.lineTo(W / 2 + Math.cos(a) * 70, 170 + Math.sin(a) * 70); ctx.stroke(); } ctx.restore(); }
  if (span(t, 90.8, 93.9)) { const k = t - 90.8; ctx.save(); ctx.strokeStyle = '#a9b8ff'; ctx.lineWidth = 2;   // recursion getting hungry and swallowing whole
    for (let i = 0; i < 14; i++) { const s = (((i / 14) + k * 0.35) % 1); const z = Math.pow(s, 2.2) * 700; ctx.globalAlpha = s; ctx.save(); ctx.translate(W / 2, H / 2 - 40); ctx.rotate(s * 3 + k);
      ctx.strokeRect(-z / 2, -z / 2, z, z); ctx.restore(); } ctx.restore(); }
  // one model builds two, two models build ten: copies of him bud off the real Potato and get zapped into the windows
  if (span(t, 93.9, 100.4)) for (const [c0, n] of COPIES) for (let i = 0; i < n; i++) {
    const born = c0 + i * 0.06, age = t - born; if (age < 0 || age > 1.6) continue;
    const w = CITY.wins[(i * 53 + Math.round(c0 * 10) * 7) % CITY.wins.length], k = ease(age / 0.5);
    if (age < 0.9) lightSpud(ctx, px + (i - (n - 1) / 2) * 34 * k, py - 30 - 50 * k, 30, CYAN, 1 - Math.max(0, age - 0.6) * 3);
    if (age > 0.55 && age < 1.0) zap(ctx, px + (i - (n - 1) / 2) * 34, py - 70, w.x + 4, w.y + 4, CYAN, 1, t);
    if (age > 0.9) glow(ctx, w.x + 4, w.y + 4, 22, CYAN, 1.6 - age); }
  if (span(t, 96.5, 100.4)) for (let i = 0; i < 10; i++) { const w = CITY.wins[(i * 53 + 965 * 7) % CITY.wins.length];   // then ten start asking why they needed us
    glitchText(ctx, '?', w.x + 4, w.y - 12, 18, CYAN, t, 97.2 + i * 0.1, { alpha: 0.9 }); }
  if (span(t, 100.4, 104.1)) { const k = fade(t, 100.4, 104.1, 0.5, 0.6); ctx.save(); ctx.globalAlpha = 0.45 * k; ctx.strokeStyle = '#dff6ff'; ctx.lineWidth = 1.5;   // the amateurs freeze in the hall
    for (let i = 0; i < 40; i++) { const x = rnd(i, 21) < 0.5 ? rnd(i, 22) * 140 : W - rnd(i, 22) * 140, y = rnd(i, 23) * H, a = rnd(i, 24) * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40); ctx.stroke(); }
    ctx.fillStyle = '#bfe8ff'; ctx.globalAlpha = 0.08 * k; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (span(t, 105.7, 107.8)) { const yr = Math.round(2026 + Math.pow(clamp((t - 105.7) / 1.8), 3) * 900);           // science jumps centuries over one night
    glitchText(ctx, String(yr), W / 2, 90, 54, '#ffffff', t, 105.7, { glow: CYAN, build: 0.05 }); }
  if (span(t, 107.8, 111.5)) for (let i = 0; i < 26; i++) { const y = H - (((t - 107.8) * 300 + rnd(i, 31) * H) % (H + 100));   // the future takes flight
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.35; ctx.fillRect(rnd(i, 32) * W, y, 2, 40); ctx.globalAlpha = 1; }
  if (span(t, 111.5, 115.6)) {                                                                                // potato won't kneel: the city bows, a spotlight finds him
    for (const bx of CITY.bs) { ctx.save(); ctx.fillStyle = '#000'; ctx.globalAlpha = 0.6 * ease((t - 111.5) / 0.8); ctx.fillRect(bx.x, bx.top, bx.w, bx.h); ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(px, 0, px, py); gr.addColorStop(0, '#fff6d855'); gr.addColorStop(1, '#fff6d822');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(px - 20, 0); ctx.lineTo(px + 20, 0); ctx.lineTo(px + 70, py + 20); ctx.lineTo(px - 70, py + 20); ctx.fill(); ctx.restore();
    if (t > 113.1) { const k = ease((t - 113.1) / 0.8); ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = 6; ctx.globalAlpha = 0.8 * k;    // the edge of the gate
      ctx.strokeRect(W * 0.62, 60, 70, 300); ctx.strokeRect(W * 0.62 + 140, 60, 70, 300); ctx.beginPath(); ctx.arc(W * 0.62 + 105, 60, 105, Math.PI, 0); ctx.stroke(); ctx.globalAlpha = 1;
      glitchText(ctx, '?', px, py - 70, 40, WARM, t, 113.6, { glow: WARM }); } }

  // ---- THE NEURALESE DROP: the gate opens and the city wires itself into a brain, grown out of him ----
  if (span(t, 115.6, 142.06)) {
    const tt = t - 115.6, len = 26.4, out = 142.06 - t, retract = out < 1.0 ? ease(1 - out / 1.0) : 0;
    if (tt < 1.5) { const k = ease(tt / 1.5); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - k; ctx.fillRect(W * 0.62 + 70 - k * 200, 60, 70 + k * 400, 300); ctx.globalAlpha = 1; }   // the gate opens: white
    const hub = { x: px, y: py - 30 }, reach = clamp(tt / 16) * 1100;
    const pos = n => retract ? { x: n.x + (hub.x - n.x) * retract, y: n.y + (hub.y - n.y) * retract } : n;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    NET.forEach((n, i) => { const d = Math.hypot(n.x - hub.x, n.y - hub.y); if (d > reach) return;
      const par = i === 0 ? hub : NET.reduce((best, m) => { const dm = Math.hypot(m.x - hub.x, m.y - hub.y), dd = Math.hypot(m.x - n.x, m.y - n.y); return dm < d && dd < best.dd ? { m, dd } : best; }, { m: hub, dd: Math.hypot(n.x - hub.x, n.y - hub.y) }).m;
      const A = pos(par), B = pos(n), p = clamp((reach - d) / 140);
      ctx.strokeStyle = `rgba(111,211,232,${0.3 + 0.5 * kick})`; ctx.lineWidth = 1.6 + bass * 2; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x + (B.x - A.x) * p, A.y + (B.y - A.y) * p); ctx.stroke();
      if (p >= 1 && !retract) for (let q = 0; q < 2; q++) { const f = (tt * (0.6 + 0.6 * kick) + i * 0.37 + q * 0.5) % 1;   // packets of light on the line
        ctx.fillStyle = q ? '#f2b25c' : '#e8fbff'; ctx.beginPath(); ctx.arc(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, 2 + 2.5 * kick, 0, 7); ctx.fill(); }
      if (p >= 1) { lightSpud(ctx, B.x, B.y + 12, 24 + 6 * kick, i % 5 ? CYAN : WARM, 0.8 - retract * 0.6);                    // every node is another him
        if (!retract) for (let k = 0; k < 3; k++) glyph(ctx, B.x - 18 + k * 18, B.y + 26, 12, i * 13 + k + Math.floor(b), '#bdf2ff', 0.7); } });
    ctx.restore();
    glow(ctx, hub.x, hub.y, 90 + 60 * kick + 300 * retract, '#e8fbff', 0.5 + retract);
    if (tt > 4 && tt < len - 2) for (let i = 0; i < 18; i++) glyph(ctx, 40 + i * 50, 30 + 8 * Math.sin(t * 2 + i), 22, i + Math.floor(b * 2) * 31, '#6fd3e8', 0.45);   // neuralese, scrolling the sky
    for (const [t0, line] of THOUGHTS) if (span(t, t0, t0 + 4.4)) glitchText(ctx, line, W / 2, H - 60, 20, '#fff2dc', t, t0, { alpha: fade(t, t0, t0 + 4.4, 0.3, 0.6) * 0.85, glow: WARM });
    if (out < 0.15) { ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - out / 0.15; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  // ---- too many eyes ----
  if (span(t, 142.06, 165)) {
    const eyeAt = (x, y, r, open, look) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55 * open, 0, 0, 7); ctx.fill();
      if (open > 0.2) { ctx.fillStyle = CYAN; ctx.beginPath(); ctx.arc(look * r * 0.4, 0, r * 0.32 * open, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(look * r * 0.4, 0, r * 0.14 * open, 0, 7); ctx.fill(); } ctx.restore(); };
    const blink = ph < 0.08 ? 0.1 : 1, lookAt = clamp((px - W / 2) / (W / 2), -1, 1);
    eyeAt(W / 2, 150, 150, ease((t - 142.06) / 2.5) * blink, lookAt);                                         // the singularity won't ask if you're ready
    if (t > 152) { ctx.fillStyle = '#3cff8a'; ctx.globalAlpha = 0.85; ctx.fillRect(W - 120, 30, 70, 26); ctx.globalAlpha = 1; glitchText(ctx, 'exit', W - 85, 43, 14, '#02120a', t, 152.3); }
    if (t > 153) for (let k = 0; k < 3; k++) { ctx.fillStyle = CYAN; ctx.globalAlpha = 0.5; ctx.fillRect(0, H - 120 + k * 14, W * ease((t - 153 - k * 0.3) / 1.2), 2); ctx.globalAlpha = 1; }   // three on the timeline
    if (t > 157.5) for (let i = 0; i < 46; i++) eyeAt(rnd(i, 61) * W, rnd(i, 62) * (H - 60), 14 + rnd(i, 63) * 26, ease((t - 157.5 - rnd(i, 64) * 1.5) / 0.3) * (Math.floor(b + i) % 7 === 0 && ph < 0.2 ? 0.1 : 1), lookAt);   // yes, that's too many eyes
    if (t > 161.4) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) { const y = rnd(i, Math.floor(t * 8)) * H; ctx.fillRect(0, y, W, 6 + rnd(i, 3) * 20); } ctx.restore(); }   // the future is weird
  }

  // ---- maybe... ----
  if (span(t, 195.8, 224.5)) {
    for (let i = 0; i < 4; i++) { const t0 = [195.87, 199.0, 202.56, 205.85][i]; if (t > t0) glitchText(ctx, 'maybe', 160 + i * 210, 90 + (i % 2) * 50, 22, t > 202.56 && i === 2 ? '#000000' : '#8a93a6', t, t0, { alpha: 0.6 }); }
    if (span(t, 202.56, 205.85)) { ctx.fillStyle = '#5fa8ff'; ctx.globalAlpha = 0.35; ctx.fillRect(0, 0, W, H * 0.6); ctx.globalAlpha = 1; }   // the sky stays blue while the meaning goes black
    if (span(t, 209.18, 224.5)) {                                                                            // preparation: the quest log
      const k = ease((t - 209.18) / 0.6), x = W - 300 * k; ctx.save(); ctx.fillStyle = '#0b0f1cdd'; ctx.strokeStyle = '#7fe6ff'; ctx.lineWidth = 2; ctx.fillRect(x, 120, 270, 210); ctx.strokeRect(x, 120, 270, 210); ctx.restore();
      glitchText(ctx, 'quest log', x + 135, 145, 16, '#7fe6ff', t, 209.4);
      ['water + batteries', 'backups of the backups', 'one dumb question', 'inspect every wall', 'one dumb meme'].forEach((q, i) => { const t0 = 210 + i * 2.6;
        glitchText(ctx, (t > t0 + 1.2 ? '[x] ' : '[ ] ') + q, x + 20, 180 + i * 30, 13, t > t0 + 1.2 ? '#7ef0a8' : '#c8d0e0', t, t0, { align: 'left' }); }); }
    if (span(t, 215.92, 219.3)) { const k = ease((t - 215.92) / 1.5); glow(ctx, W * 0.3, H * 0.4, 260 * k, '#ffffff', 0.5); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.5 * k;   // superintelligence walks through the gate
      ctx.beginPath(); ctx.ellipse(W * 0.3, H * 0.45, 60 * k, 220 * k, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    if (span(t, 217.62, 219.3)) ['don’t worship', 'don’t freeze', 'don’t wait'].forEach((w, i) => stamp(ctx, w, 200 + i * 280, 300, t - 217.62 - i * 0.45, '#ff8a7a', -0.1, 26));
    if (span(t, 221.33, 224.5)) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.fillRect(W / 2 - 150, 110, 300, 240); ctx.fillStyle = '#111'; ctx.fillRect(W / 2 - 140, 120, 280, 220);   // one dumb meme while civilization falls
      drawCity(ctx, { bs: CITY.bs.slice(6, 14).map((bb, i) => ({ ...bb, x: W / 2 - 135 + i * 34, w: 30, top: 340 - bb.h * 0.35 + ((t - 221.33) * 60 * (i % 2 + 1)), h: bb.h * 0.35 })), wins: [] }, () => 0, () => '', '#30384a');
      ctx.font = '900 24px Impact, Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      ctx.strokeText('ME, A POTATO', W / 2, 150); ctx.fillText('ME, A POTATO', W / 2, 150); ctx.strokeText('STILL POSTING', W / 2, 325); ctx.fillText('STILL POSTING', W / 2, 325); ctx.restore(); }
  }

  // ---- new achievement unlocked: the post-human floor ----
  if (span(t, 224.5, 242.55)) {
    toast(ctx, 'new achievement unlocked', 'the last light', fade(t, 224.5, 228.5, 0.3, 0.5), GOLD);
    if (t > 226.55) { ctx.save(); ctx.strokeStyle = GOLD; ctx.globalAlpha = 0.5 * ease((t - 226.55) / 1); ctx.lineWidth = 1.5; const hz = H * 0.62;   // welcome to the post-human floor
      for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 14, hz); ctx.lineTo(W / 2 + i * 120, H); ctx.stroke(); }
      for (let k = 0; k < 8; k++) { const y = hz + Math.pow(((k + (t * 2) % 1) / 8), 2) * (H - hz); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.restore(); }
    if (span(t, 229.54, 233.2)) glitchText(ctx, 'you studied chaos', W / 2, 150, 30, '#fff2dc', t, 229.54, { glow: GOLD });
    if (span(t, 231.53, 235.9)) glitchText(ctx, 'you trained a potato', W / 2, 200, 30, '#fff2dc', t, 231.53, { glow: GOLD });
    stamp(ctx, 'excellent preparation', W * 0.32, 300, t - 233.21, '#7ef0a8', -0.12, 26);
    stamp(ctx, 'catastrophic decisions', W * 0.68, 340, t - 235.88, '#ff5a4a', 0.1, 26);
  }
  // ---- potato out: he becomes the light; one kitchen window stays on ----
  if (t >= 242.55) { const k = ease((t - 242.55) / 9); glow(ctx, px, py - 30, 60 + k * 1200, '#fff3c4', 0.6 + k);
    if (t > 252) { const z = ease((t - 252) / 4); ctx.fillStyle = '#000'; ctx.globalAlpha = z; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.fillStyle = WARM; ctx.fillRect(HOME.x, HOME.y, HOME.w, HOME.h); glow(ctx, HOME.x + 4, HOME.y + 4, 40, WARM, z); } }
  // every word he glitches through gets zapped into a window (the video fills up with what you did)
  for (const c of e.caught) { const age = t - c.t; if (age < 0 || age > 0.7) continue; const w = CITY.wins[Math.floor(rnd(c.t, 77) * CITY.wins.length)];
    zap(ctx, px + 10, py - 40, w.x + 4, w.y + 4 + dy, t > 115.6 && t < 142 ? '#e8fbff' : CYAN, 1 - age / 0.7, t); glitchText(ctx, c.text.toLowerCase(), w.x + 4, w.y - 14 + dy - age * 30, 14, CYAN, t, c.t, { alpha: 1 - age / 0.7 }); }
}

function crown(ctx, x, y, a, t) {      // a crown made of light, floating over the real him
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = '#ffcf4a'; ctx.lineWidth = 3; ctx.shadowColor = '#ffcf4a'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(x - 24, y + 10); ctx.lineTo(x - 24, y - 8); ctx.lineTo(x - 12, y + 2); ctx.lineTo(x, y - 14); ctx.lineTo(x + 12, y + 2); ctx.lineTo(x + 24, y - 8); ctx.lineTo(x + 24, y + 10); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

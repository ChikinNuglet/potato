// story-no-answer.mjs — the black sea, its eleven scenes, and the dark over them (Level 8, the looking-for-something game).
// This is where the game is SEEN: the rules are run/modes/no-answer.mjs. Everything here is drawn in the world (projected
// through the real camera, so it moves with him and with the camera's beat pulse), in this order:
//   1. the sky and the sea (the deep: under it)          2. the scene's things and its phones, at night-time brightness
//   3. THE DARK: one sheet over all of it, with holes where there is light — his beam (and its cone from his head), the glow
//      round him, every phone he found (they stay lit), the scene's own lights (the lamp, the moon, a television of snow)
//   4. what shows through the dark: each ringing phone's faint shimmer on its beat (bright for a moment when he calls out),
//      the found ones' warm glow and their ring-out, the download's glint, the booth when it's lit, the trail on the horizon.
// The dark breathes with the song: it lifts a touch on the loud bars and opens for an instant on the three biggest hits;
// in the hush it doesn't move at all. Only Potato glitches purple; nothing here is purple.
// No text anywhere: the only words in this level would be the world's, and the world here doesn't say anything.
import * as T from '../../play/vendor/three.module.js';
import { W, H, clamp, ease, rnd, glow } from '../story.mjs';
import { look, GB, gbeat, prep, sceneAt, posOf, beamR, live, frameX, VW, G } from '../modes/no-answer.mjs';

const ICE = '#bff8ff', WARM = '#ffd6a0', RIM = '#4f8e94', BODY = '#13292e', DIMR = '#1b3a40';
const v3 = new T.Vector3();
let mk = null, mc = null;   // the dark (an offscreen sheet; browser only)

export function story(ctx, e) {
  const { t, s } = e, cam = look.cam, C = look.C;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (!cam || !C || !s || !s.got) return;
  const P = prep(C), k = sceneAt(P, t), S = P.S, b = gbeat(C, t), GBs = GB(C);
  cam.updateMatrixWorld();
  const pxU = H * cam.zoom / (cam.top - cam.bottom);
  const pr = (x, y) => { v3.set(x, y, 0).project(cam); return { x: (v3.x * 0.5 + 0.5) * W, y: (0.5 - v3.y * 0.5) * H }; };
  const bi = Math.floor(b), bf = b - bi, loud = (C.map.loud || [])[bi] || 0;
  const scene = P.scenes[k], kind = scene.kind;
  const dove = s.dive != null, diveK = dove ? ease((t - s.dive) / 1.4) : 0;
  const hush = kind === 'hush' && t >= scene.t0 + G.GLIDE * GBs;
  // ---- 1 · sky + sea, scene by scene (they tile: each owns 13 units of the world) ----
  const vis = [k - 1, k, k + 1].filter(i => i >= 0 && i < P.scenes.length);
  for (const i of vis) {
    const q = P.scenes[i], a = pr(q.X0 - (G.SW - VW) / 2, 0).x, z = pr(q.X0 + VW + (G.SW - VW) / 2, 0).x;
    if (z < 0 || a > W) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(a, 0, z - a + 1, H); ctx.clip();
    const deep = q.kind === 'deep', surf = deep ? 4.7 + (i === k && dove ? 2.4 * diveK : 0) : G.HZ, hy = pr(0, surf).y;
    const gs = ctx.createLinearGradient(0, 0, 0, H); gs.addColorStop(0, '#03080c'); gs.addColorStop(1, '#000'); ctx.fillStyle = gs; ctx.fillRect(a, 0, z - a, H);
    if (hy > 0) { ctx.fillStyle = '#010608'; ctx.fillRect(a, 0, z - a, hy); }
    const sea = ctx.createLinearGradient(0, Math.max(0, hy), 0, H); sea.addColorStop(0, deep ? '#06222a' : '#071a1e'); sea.addColorStop(0.4, deep ? '#031216' : '#020a0c'); sea.addColorStop(1, '#000');
    ctx.fillStyle = sea; ctx.fillRect(a, Math.max(0, hy), z - a, H - Math.max(0, hy));
    if (hy > -4 && hy < H) { ctx.strokeStyle = '#1f4a50'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(a, hy); ctx.lineTo(z, hy); ctx.stroke();
      for (let n = 1; n < 7; n++) { ctx.globalAlpha = 0.22 / n; ctx.beginPath(); for (let x = a; x <= z; x += 24) ctx.lineTo(x, hy + n * n * 6 + Math.sin(x * 0.02 + t * 0.5 + n) * 1.6); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (!(deep && i === k && dove)) { ctx.strokeStyle = '#2f6a70'; ctx.lineWidth = 1.3; for (let n = 0; n < 90; n++) { const yy = 0.15 + (surf - 0.25) * Math.pow(rnd(n, i + 31), 0.8), A = pr(q.X0 + (rnd(n, i + 32) * 1.2 - 0.1) * VW + Math.sin(t * 0.4 + n) * 0.06, yy), w = (10 + 30 * rnd(n, 33)) * (0.4 + 0.6 * (1 - yy / surf));   // the water's skin: only the light shows it
      ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(A.x - w, A.y); ctx.quadraticCurveTo(A.x, A.y - 2, A.x + w, A.y); ctx.stroke(); } ctx.globalAlpha = 1; }
    if (deep && i === k && dove) under(ctx, pr, pxU, q, t, a, z, diveK);
    props(ctx, pr, pxU, q, t, b, s, i === k);
    ctx.restore();
  }
  // ---- 2 · the phones (and the booth) under the dark ----
  for (const p of P.things) { if (!vis.includes(p.sc) || t < p.t || p.kind === 'pk') continue;
    const st = s.got[p.id] != null ? 'got' : s.lost[p.id] != null ? 'gone' : 'ring', o = posOf(C, P, p, t), A = pr(o.x, o.y), sc = pxU / 96 * phoneK(p);
    if (A.x < -80 || A.x > W + 80) continue;
    if (st === 'gone') { const g = t - s.lost[p.id]; if (g > 1.6) continue; ctx.save(); ctx.globalAlpha = 1 - g / 1.6; if (p.kind === 'booth') booth(ctx, A.x, A.y + 0.6 * pxU, pxU / 96 * 0.95, false, 1); else phone(ctx, A.x, A.y + g * 18, sc, 'ring', t, 0); ctx.restore(); continue; }
    if (p.under && !dove) { ctx.save(); ctx.globalAlpha = 0.55; phone(ctx, A.x + Math.sin(t * 2 + p.id) * 3, A.y, sc, 'ring', t, 0); ctx.restore(); continue; }   // down under the swollen sea
    const shake = st === 'ring' && ringOn(p, bi) && bf < 0.35 ? Math.sin(t * 70) * 0.08 : 0;
    if (p.kind === 'booth') booth(ctx, A.x, A.y + 0.6 * pxU, pxU / 96 * 0.95, st === 'got', 1, t, st === 'got' && t < S.stop ? Math.max(0, 1 - bf * 4) : 0);
    else { if (p.move === 'fall') cordUp(ctx, A, t, p); phone(ctx, A.x, A.y, sc, st, t, shake); }
  }
  // ---- 3 · THE DARK ----
  if (!mk && globalThis.document) { mk = document.createElement('canvas'); mk.width = W; mk.height = H; mc = mk.getContext('2d'); }
  if (!mk) return;
  const hitK = (S.hits || []).reduce((m, h) => Math.max(m, t >= h && t < h + 0.45 ? 1 - (t - h) / 0.45 : 0), 0);
  const barK = !hush && loud > 0.84 && bi % 4 === 0 ? Math.max(0, 1 - bf * 2.2) : 0;
  const callK = s.callAt != null && t >= s.callAt ? clamp(1 - (t - s.callAt) / 1.3) : 0;
  const born = clamp((t - (S.born ?? 1)) / 0.6);
  let A0 = hush ? 0.97 : kind === 'deep' && dove ? 0.96 : 0.91 - 0.03 * (e.bass || 0);
  A0 = A0 - 0.07 * barK - 0.4 * hitK - 0.1 * callK; if (t < S.born) A0 = 1;
  mc.globalCompositeOperation = 'source-over'; mc.clearRect(0, 0, W, H); mc.fillStyle = `rgba(0,0,0,${clamp(A0).toFixed(3)})`; mc.fillRect(0, 0, W, H);
  mc.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { if (r < 1 || a <= 0) return; const g = mc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a * 0.85})`); g.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = g; mc.fillRect(x - r, y - r, 2 * r, 2 * r); };
  // his light: the pool where the beam lands, the cone from his head, the glow round him
  const out = s.outAt != null ? clamp(1 - (t - s.outAt) / 0.6) : 1;
  const R = beamR(C, P, s, t) * pxU * out, fx = frameX(C, P, t), BP = pr(fx + s.bx, s.by), HD = pr(s.x, s.y + 1.45);
  const flick = t < S.born + 0.6 ? (rnd(Math.floor(t * 18), 2) < 0.45 ? 0.3 : 1) : 1;
  if (born > 0) {
    const dx = BP.x - HD.x, dy = BP.y - HD.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const cg = mc.createLinearGradient(HD.x, HD.y, BP.x, BP.y); cg.addColorStop(0, `rgba(0,0,0,${0.5 * born * out})`); cg.addColorStop(1, `rgba(0,0,0,${0.32 * born * out})`);
    mc.fillStyle = cg; mc.beginPath(); mc.moveTo(HD.x + nx * 7, HD.y + ny * 7); mc.lineTo(BP.x + nx * R * 0.8, BP.y + ny * R * 0.8); mc.lineTo(BP.x - nx * R * 0.8, BP.y - ny * R * 0.8); mc.lineTo(HD.x - nx * 7, HD.y - ny * 7); mc.fill();
    hole(BP.x, BP.y, R * 1.15, flick * born); hole(BP.x, BP.y, R * 0.7, flick * born);
  }
  const ME = pr(s.x, s.y + 0.8); hole(ME.x, ME.y, 1.05 * pxU, 0.75);
  for (const p of P.things) { if (s.got[p.id] == null || p.kind === 'pk' || !vis.includes(p.sc)) continue; const o = posOf(C, P, p, t), A = pr(o.x, o.y), f = clamp((t - s.got[p.id]) / 0.4);
    hole(A.x, A.y, (p.kind === 'booth' ? 1.7 : 0.6 + 0.25 * phoneK(p)) * pxU * (0.6 + 0.4 * f), 0.9); }
  sceneLights(hole, pr, pxU, P, vis, t, b, s);
  if (callK > 0) { const r = (1 - callK) * 11 * pxU, g = mc.createRadialGradient(ME.x, ME.y, Math.max(0, r - 60), ME.x, ME.y, r + 40); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, `rgba(0,0,0,${0.35 * callK})`); g.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = g; mc.fillRect(0, 0, W, H); }
  mc.globalCompositeOperation = 'source-over';
  // the dark reaches in when it takes the scene's last phones (fingers from the edges, more the more it took)
  const takeK = s.takeAt != null && t >= s.takeAt && s.takeN > 0 ? clamp(1 - (t - s.takeAt) / 1.4) : 0;
  if (takeK > 0) { mc.fillStyle = '#000'; const n = 6 + 4 * s.takeN; for (let i = 0; i < n; i++) { const side = i % 4, p = rnd(i, s.takeAt), len = Math.sin(takeK * Math.PI) * (90 + 260 * rnd(i, 42)) * Math.min(1, 0.4 + 0.2 * s.takeN), w = 30 + rnd(i, 43) * 50;
    mc.beginPath(); if (side === 0) { mc.moveTo(0, p * H - w); mc.lineTo(len, p * H); mc.lineTo(0, p * H + w); } else if (side === 1) { mc.moveTo(W, p * H - w); mc.lineTo(W - len, p * H); mc.lineTo(W, p * H + w); }
      else if (side === 2) { mc.moveTo(p * W - w, 0); mc.lineTo(p * W, len); mc.lineTo(p * W + w, 0); } else { mc.moveTo(p * W - w, H); mc.lineTo(p * W, H - len); mc.lineTo(p * W + w, H); } mc.fill(); } }
  ctx.drawImage(mk, 0, 0);
  // ---- 4 · what shows through the dark ----
  { const hy = pr(0, kind === 'deep' ? (dove ? 99 : 4.7) : G.HZ).y; if (hy > 0 && hy < H) { ctx.strokeStyle = '#3f7a80'; ctx.globalAlpha = hush ? 0.12 : 0.22; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke(); ctx.globalAlpha = 1; } }   // the horizon, just there
  if (born > 0) { const col = kind === 'deep' && dove ? '#e8fff4' : WARM, dx = BP.x - HD.x, dy = BP.y - HD.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createLinearGradient(HD.x, HD.y, BP.x, BP.y); cg.addColorStop(0, 'rgba(255,214,160,0.16)'); cg.addColorStop(1, 'rgba(255,214,160,0.05)');
    ctx.globalAlpha = born * out * flick; ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(HD.x + nx * 5, HD.y + ny * 5); ctx.lineTo(BP.x + nx * R * 0.75, BP.y + ny * R * 0.75); ctx.lineTo(BP.x - nx * R * 0.75, BP.y - ny * R * 0.75); ctx.lineTo(HD.x - nx * 5, HD.y - ny * 5); ctx.fill(); ctx.restore();   // the beam itself
    glow(ctx, BP.x, BP.y, R * 1.1, col, 0.26 * born * out * flick); glow(ctx, HD.x, HD.y, 30, col, 0.5 * born * out); }
  overLights(ctx, pr, pxU, P, vis, t, b, s);
  for (const p of P.things) { if (!vis.includes(p.sc) || t < p.t) continue; const o = posOf(C, P, p, t), A = pr(o.x, o.y); if (A.x < -60 || A.x > W + 60) continue;
    if (p.kind === 'pk') { if (!live(C, P, s, p, t) && !(s.pkAt != null && t - s.pkAt < 0.6)) continue; const g = s.pkAt != null ? t - s.pkAt : -1, pul = 0.6 + 0.4 * Math.max(0, 1 - bf * 3);   // the download: the diver's glint, sinking out of the dark
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, A.x, A.y, 46 * (g >= 0 ? 1 + g * 4 : 1), '#3fe0d0', (g >= 0 ? 1 - g / 0.6 : 0.55 * pul));
      ctx.strokeStyle = '#9ff7ee'; ctx.globalAlpha = g >= 0 ? 1 - g / 0.6 : 0.85; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(A.x, A.y, 13, 0, 7); ctx.stroke(); ctx.fillStyle = '#e6fffb'; ctx.beginPath(); ctx.arc(A.x, A.y, 5, 0, 7); ctx.fill(); ctx.restore(); continue; }
    if (s.got[p.id] != null) { const g = t - s.got[p.id], wk = p.kind === 'booth' ? 1.6 : 1;   // found: lit, warm; it rings out twice — no answer — and stays lit
      glow(ctx, A.x, A.y, (40 + 30 * phoneK(p)) * wk * pxU / 96, WARM, 0.55 + 0.45 * clamp(1 - g / 0.5));
      const stopAt = p.kind === 'booth' ? S.stop : s.got[p.id] + 4 * GBs;
      if (t < stopAt) for (let n = 0; n < 2; n++) { const q = ((g / (2 * GBs)) + n * 0.5) % 1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = ICE; ctx.globalAlpha = 0.5 * (1 - q) * (p.kind === 'booth' ? 1 : clamp((stopAt - t) / 0.6)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.x, A.y, (14 + q * 120) * wk * pxU / 96, 0, 7); ctx.stroke(); ctx.restore(); }
      if (p.kind === 'booth' && t >= S.stop && t < S.stop + 0.7) { const q = (t - S.stop) / 0.7; ctx.strokeStyle = ICE; ctx.globalAlpha = 0.7 * (1 - q); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(A.x, A.y, 30 + q * 260, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }   // the last ring, cut off
      continue; }
    if (s.lost[p.id] != null) { const g = t - s.lost[p.id]; if (g < 0.9) { const q = g / 0.9; ctx.strokeStyle = '#6f8f94'; ctx.globalAlpha = 0.6 * (1 - q); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.x, A.y, 60 * (1 - q) + 2, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } continue; }   // the dark closes over it
    if (p.under && !dove) { const pul = ringOn(p, bi) ? Math.max(0, 1 - bf * 2.5) : 0; glint(ctx, A.x + Math.sin(t * 2.3 + p.id) * 4, A.y, 0.12 * pul + 0.5 * callK, 0.7); continue; }   // glimmering down there
    if (!live(C, P, s, p, t)) continue;
    const pul = ringOn(p, bi) ? Math.max(0, 1 - bf * 2.8) : 0, near = clamp(1 - Math.hypot(A.x - BP.x, A.y - BP.y) / (R * 3 + 1));
    glint(ctx, A.x, A.y, (hush ? 0.12 : 0.2) * pul + 0.85 * callK + 0.15 * near * pul, phoneK(p) * (p.kind === 'booth' ? 1.8 : 1));
  }
  // the end: along the horizon, back the way he came, a light for every phone he found
  if (kind === 'booth') { const n = Object.keys(s.got).filter(id => P.things[id].kind === 'phone').length, q = P.scenes[k], u = ease((t - q.t0 - 1.5) / 3);
    for (let i = 0; i < n; i++) { const f = i / Math.max(1, n), x = q.X0 + VW * (0.64 - 0.66 * Math.pow(f, 0.8)), A = pr(x, G.HZ + 0.03 + 0.06 * rnd(i, 3)), a = u * (0.9 - 0.5 * f) * (0.8 + 0.2 * Math.sin(t * 2 + i));
      if (a <= 0.01) continue; glow(ctx, A.x, A.y, 9 - 4 * f, WARM, a * 0.7); ctx.fillStyle = '#fff3dc'; ctx.globalAlpha = a; ctx.fillRect(A.x - 1.2, A.y - 1.2, 2.4, 2.4); ctx.globalAlpha = 1; } }
}

// ---------- pieces ----------
const phoneK = p => p.kind === 'booth' ? 1 : clamp(1 - (p.y - 1.2) / (G.HZ - 1.2) * 0.55, 0.45, 1);
const ringOn = (p, bi) => ((bi + (p.ph || 0)) % (p.every || 2)) === 0;
function glint(ctx, x, y, a, sc = 1) {                       // a phone's shimmer: a little star of cold light and its ring marks
  if (a <= 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, a);
  glow(ctx, x, y, 30 * sc, ICE, Math.min(1, a) * 0.8); ctx.strokeStyle = ICE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 10 * sc, y); ctx.lineTo(x + 10 * sc, y); ctx.moveTo(x, y - 10 * sc); ctx.lineTo(x, y + 10 * sc); ctx.stroke();
  for (const d of [-1, 1]) for (const r of [16, 23]) { ctx.beginPath(); ctx.arc(x, y, r * sc, d < 0 ? Math.PI * 0.8 : -Math.PI * 0.2, d < 0 ? Math.PI * 1.2 : Math.PI * 0.2); ctx.stroke(); }
  ctx.restore(); }
function phone(ctx, x, y, sc, st, t, shake = 0) {             // an old desk phone, handset on its cradle
  ctx.save(); ctx.translate(x, y); ctx.rotate(shake); ctx.scale(sc, sc);
  const lit = st === 'got', body = lit ? '#e9cfa2' : '#0f2125', ink = lit ? '#5a3a14' : '#3b6a71';
  ctx.fillStyle = body; ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-17, 10); ctx.lineTo(-11, -4); ctx.lineTo(11, -4); ctx.lineTo(17, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 3, 5, 0, 7); ctx.stroke();
  ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = lit ? '#f6e3c0' : '#22393f'; ctx.beginPath(); ctx.moveTo(-15, -9); ctx.quadraticCurveTo(0, -14, 15, -9); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(-15, -12); ctx.quadraticCurveTo(0, -17, 15, -12); ctx.stroke();
  ctx.restore();
  if (!lit) { ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = '#4f7f86'; for (let n = 0; n < 3; n++) ctx.fillRect(x - (14 - n * 3) * sc + Math.sin(t * 2 + n) * 2, y + (13 + n * 4) * sc, (28 - n * 6) * sc, 1.2); ctx.restore(); }   // its reflection
}
function cordUp(ctx, A, t, p) {                               // the fall: each phone trails its cord up into the dark
  ctx.save(); ctx.strokeStyle = '#2f5258'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(A.x, A.y - 12);
  for (let n = 1; n <= 24; n++) ctx.lineTo(A.x + Math.sin(n * 1.3 + t * 2 + p.id) * (3 + n * 0.4), A.y - 12 - n * 18); ctx.stroke(); ctx.restore(); }
function booth(ctx, x, y, sc, on, a, t = 0, ring = 0) {      // a lit phone box standing in the sea (from round 8)
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha *= a; ctx.lineJoin = 'round';
  if (on) { ctx.fillStyle = ICE; for (let n = 0; n < 12; n++) { const f = n / 12, w = 10 + 26 * rnd(n, 51) * (1 - f * 0.5) + Math.sin(t * 3 + n * 1.7) * 6; ctx.globalAlpha = a * (0.55 - f * 0.45); ctx.fillRect(-w / 2 + (rnd(n, 52) - 0.5) * (14 + 40 * f), 3 + f * f * 90, w, 2); } ctx.globalAlpha = a; }
  ctx.fillStyle = '#071417'; ctx.beginPath(); ctx.roundRect(-23, -112, 46, 112, 3); ctx.fill();
  ctx.fillStyle = '#0d2125'; ctx.beginPath(); ctx.roundRect(-27, -124, 54, 13, [7, 7, 2, 2]); ctx.fill(); ctx.fillRect(-26, -3, 52, 4);
  ctx.fillStyle = on ? ICE : '#1a2c31'; ctx.fillRect(-19, -109, 38, 8);
  ctx.strokeStyle = '#071417'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, -103); ctx.quadraticCurveTo(0, -108, 6, -103); ctx.stroke();
  if (on) { const gi = ctx.createLinearGradient(0, -98, 0, -6); gi.addColorStop(0, 'rgba(233,253,255,0.66)'); gi.addColorStop(0.55, 'rgba(150,226,234,0.36)'); gi.addColorStop(1, 'rgba(90,184,192,0.2)'); ctx.fillStyle = gi; ctx.globalAlpha = a * (0.85 + 0.15 * ring); }
  else ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(-18, -98, 36, 92); ctx.globalAlpha = a;
  ctx.fillStyle = on ? '#16343a' : '#0c1a1d'; ctx.fillRect(-7, -70, 14, 18); ctx.lineWidth = 4; ctx.strokeStyle = on ? '#16343a' : '#0c1a1d'; ctx.beginPath(); ctx.moveTo(-9, -76); ctx.quadraticCurveTo(0, -82, 9, -76); ctx.stroke();
  ctx.strokeStyle = on ? '#0d2125' : '#1a2c31'; ctx.lineWidth = 3; ctx.beginPath(); for (const yy of [-75, -52, -29]) { ctx.moveTo(-18, yy); ctx.lineTo(18, yy); } ctx.moveTo(0, -98); ctx.lineTo(0, -6); ctx.stroke();
  ctx.strokeStyle = on ? ICE : '#2c4a50'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-23, -112, 46, 112, 3); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-27, -124, 54, 13, [7, 7, 2, 2]); ctx.stroke();
  ctx.restore();
  if (on) glow(ctx, x, y - 60 * sc, 110 * sc, '#5ab8c0', (0.34 + 0.12 * ring) * a);
}
// the scene's things (under the dark), in its own frame: u = 0..1 across the screen, y in world units
function props(ctx, pr, pxU, q, t, b, s, cur) {
  const X = u => q.X0 + u * VW, at = (u, y) => pr(X(u), y), K = pxU / 96;
  const line = (pts, w = 2, col = RIM) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([u, y], i) => { const A = at(u, y); i ? ctx.lineTo(A.x, A.y) : ctx.moveTo(A.x, A.y); }); ctx.stroke(); };
  const ph = q.phones || [];
  if (q.kind === 'lamp') { lampPost(ctx, at, K, 0.12, 0.25, 3.5, 1); }
  if (q.kind === 'doors') { const D = [...ph.map(p => [p.x, p.y - 0.22]), [0.36, 2.05], [0.63, 3.85], [0.06, 2.6]];
    for (const [u, y0] of D) { const sc = clamp(1 - (y0 - 1.2) / (G.HZ - 1.2) * 0.55, 0.45, 1), w = 0.62 * sc, h = 1.35 * sc, A = at(u - w / 2 / VW, y0), Z = at(u + w / 2 / VW, y0 + h);
      ctx.fillStyle = '#000'; ctx.fillRect(A.x, Z.y, Z.x - A.x, A.y - Z.y);                                   // the doorway: a deeper dark
      ctx.strokeStyle = '#3a6a70'; ctx.lineWidth = 3 * sc * K; ctx.strokeRect(A.x, Z.y, Z.x - A.x, A.y - Z.y);
      ctx.fillStyle = BODY; ctx.beginPath(); ctx.moveTo(Z.x, Z.y); ctx.lineTo(Z.x + (Z.x - A.x) * 0.55, Z.y + 10 * sc * K); ctx.lineTo(Z.x + (Z.x - A.x) * 0.55, A.y + 6 * sc * K); ctx.lineTo(Z.x, A.y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = RIM; ctx.lineWidth = 2; ctx.stroke();   // its door, standing open
      ctx.fillStyle = '#4f7f86'; ctx.beginPath(); ctx.arc(Z.x + (Z.x - A.x) * 0.45, (Z.y + A.y) / 2, 2.5 * sc * K, 0, 7); ctx.fill();
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#3a6a70'; ctx.fillRect(A.x, A.y + 2, Z.x - A.x, 1.5); ctx.fillRect(A.x + 4, A.y + 7, Z.x - A.x - 8, 1); ctx.globalAlpha = 1; } }
  if (q.kind === 'moon') { const L = [[0.15, 0.85, 2.85], [0.4, 2.2, 1.45], [0.85, 2.65, 1.3], [0.3, 3.35, 0.95], [0.58, 3.45, 0.8], [0.72, 3.55, 0.7]];
    for (const [u, y0, h] of L) lampPost(ctx, at, K, u, y0, y0 + h, clamp(1 - (y0 - 1.2) / (G.HZ - 1.2) * 0.55, 0.45, 1), true);
    for (const p of ph) { const top = p.y > 4.3 ? 4.95 : (L.find(l => Math.abs(l[0] - p.x) < 0.03) || [0, 0, 0])[1] + (L.find(l => Math.abs(l[0] - p.x) < 0.03) || [0, 0, p.y + 0.6])[2]; line([[p.x, top], [p.x, p.y + 0.12]], 1.3, '#2f5258'); } }
  if (q.kind === 'chairs') { const CH = [...ph.map(p => [p.x, p.y - 0.12, p.y > 4.3]), [0.3, 2.1], [0.67, 2.7], [0.06, 3.3], [0.48, 3.3], [0.25, 3.7], [0.72, 3.85], [0.95, 2.2]];
    for (const [u, y0, fly] of CH) chair(ctx, at(u, y0), clamp(1 - (y0 - 1.2) / (G.HZ - 1.2) * 0.55, 0.45, 1) * K, fly ? Math.sin(t * 0.7) * 0.15 : 0);
    const C0 = at(0.86, 4.75); ctx.strokeStyle = RIM; ctx.lineWidth = 3 * K; ctx.fillStyle = BODY; ctx.beginPath(); ctx.arc(C0.x, C0.y, 26 * K, 0, 7); ctx.fill(); ctx.stroke();   // a clock with no hands
    for (let n = 0; n < 12; n++) { const a = n / 12 * 6.283; ctx.fillStyle = '#4f7f86'; ctx.fillRect(C0.x + Math.cos(a) * 20 * K - 1, C0.y + Math.sin(a) * 20 * K - 1, 2, 2); } }
  if (q.kind === 'wires') { const poles = [[-0.04, 1.0, 4.9], [0.36, 2.3, 4.95], [0.66, 2.9, 4.95], [0.97, 3.3, 4.7]];
    for (const [u, y0, y1] of poles) { const A = at(u, y0), Z = at(u, y1), w = 8 * K * (1 - (y0 - 1) * 0.15); ctx.fillStyle = BODY; ctx.fillRect(A.x - w / 2, Z.y, w, A.y - Z.y); ctx.strokeStyle = RIM; ctx.lineWidth = 1.5; ctx.strokeRect(A.x - w / 2, Z.y, w, A.y - Z.y);
      ctx.fillRect(A.x - w * 4, Z.y + w, w * 8, w * 0.8); }
    const tops = ph.map(p => [p.x, p.y + 0.38]).sort((a, c) => a[1] - c[1]);
    line([[-0.04, 4.85], [0.12, tops.find(o => Math.abs(o[0] - 0.12) < 0.02)?.[1] ?? 4.5], [0.36, 4.9], [0.58, tops.find(o => Math.abs(o[0] - 0.58) < 0.02)?.[1] ?? 4.85], [0.66, 4.9], [0.97, 4.65]], 1.4);
    line([[-0.04, 4.4], [0.25, 3.48], [0.36, 4.35], [0.7, 3.88], [0.97, 4.3]], 1.4);
    line([[-0.04, 3.9], [0.2, 2.9], [0.45, 2.68], [0.66, 3.6], [0.88, 2.98], [0.97, 3.6], [1.05, 2.0]], 1.4);
    for (const p of ph) line([[p.x, p.y + 0.38], [p.x, p.y + 0.12]], 1.2, '#2f5258'); }
  if (q.kind === 'deep' && !(cur && s.dive != null)) { for (let n = 0; n < 40; n++) { const A = at(rnd(n, 7), 4.75 + rnd(n, 8) * 0.6); ctx.fillStyle = '#163238'; ctx.globalAlpha = 0.5; ctx.fillRect(A.x, A.y, 1.5, 1.5); } ctx.globalAlpha = 1; }   // the swell: flecks on the high water
  if (q.kind === 'others') for (const p of ph) { const A = pr(q.X0 + p.x * VW + (p.vx || 0) * Math.max(0, t - q.t0), p.y), sc = clamp(1 - (p.y - 1.2) / (G.HZ - 1.2) * 0.55, 0.45, 1) * K;   // paper boats
    ctx.fillStyle = '#c7d3cf'; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(A.x - 34 * sc, A.y + 8 * sc); ctx.lineTo(A.x + 34 * sc, A.y + 8 * sc); ctx.lineTo(A.x + 22 * sc, A.y + 20 * sc); ctx.lineTo(A.x - 22 * sc, A.y + 20 * sc); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(A.x - 4 * sc, A.y + 8 * sc); ctx.lineTo(A.x + 6 * sc, A.y - 26 * sc); ctx.lineTo(A.x + 18 * sc, A.y + 8 * sc); ctx.fill(); ctx.globalAlpha = 1; }
  if (q.kind === 'room') { const sofa = at(0.3, 1.55), tv = at(0.75, 1.95), lampA = at(0.12, 2.65), tab = at(0.9, 3.3), cof = at(0.42, 2.72), rug = at(0.55, 1.5);
    ctx.fillStyle = '#081417'; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(rug.x, rug.y, 220 * K, 26 * K, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = BODY; ctx.strokeStyle = RIM; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(sofa.x - 70 * K, sofa.y - 52 * K, 140 * K, 52 * K, 10 * K); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(sofa.x - 82 * K, sofa.y - 36 * K, 22 * K, 36 * K, 6 * K); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(sofa.x + 60 * K, sofa.y - 36 * K, 22 * K, 36 * K, 6 * K); ctx.fill(); ctx.stroke();
    const tk = 0.85, tw = 72 * K * tk, th = 50 * K * tk; ctx.fillStyle = BODY; ctx.fillRect(tv.x - tw / 2 - 5, tv.y - th - 10, tw + 10, th + 10); ctx.strokeRect(tv.x - tw / 2 - 5, tv.y - th - 10, tw + 10, th + 10);
    ctx.fillStyle = '#9fb8bc'; for (let n = 0; n < 70; n++) { ctx.globalAlpha = 0.25 + 0.5 * rnd(n, Math.floor(t * 24)); ctx.fillRect(tv.x - tw / 2 + rnd(n, Math.floor(t * 24) + 1) * tw, tv.y - th - 5 + rnd(n + 9, Math.floor(t * 24)) * th, 3, 2); } ctx.globalAlpha = 1;   // snow
    ctx.strokeStyle = RIM; ctx.beginPath(); ctx.moveTo(lampA.x, lampA.y); ctx.lineTo(lampA.x, lampA.y - 110 * K); ctx.stroke(); ctx.fillStyle = BODY; ctx.beginPath(); ctx.moveTo(lampA.x - 22 * K, lampA.y - 110 * K); ctx.lineTo(lampA.x + 22 * K, lampA.y - 110 * K); ctx.lineTo(lampA.x + 14 * K, lampA.y - 140 * K); ctx.lineTo(lampA.x - 14 * K, lampA.y - 140 * K); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BODY; ctx.fillRect(lampA.x - 30 * K, lampA.y - 64 * K, 60 * K, 8 * K); ctx.strokeRect(lampA.x - 30 * K, lampA.y - 64 * K, 60 * K, 8 * K);
    for (const [A, w] of [[tab, 40], [cof, 70]]) { const sc = K * (A === tab ? 0.62 : 0.8); ctx.fillStyle = BODY; ctx.fillRect(A.x - w * sc, A.y - 26 * sc, w * 2 * sc, 6 * sc); ctx.strokeRect(A.x - w * sc, A.y - 26 * sc, w * 2 * sc, 6 * sc); ctx.fillRect(A.x - w * sc + 4, A.y - 20 * sc, 4, 20 * sc); ctx.fillRect(A.x + w * sc - 8, A.y - 20 * sc, 4, 20 * sc); }
    for (const [u, y, w, h] of [[0.52, 4.42, 0.62, 0.5], [0.3, 4.6, 0.36, 0.3], [0.7, 4.75, 0.3, 0.38]]) { const A = at(u - w / 2 / VW, y - h / 2), Z = at(u + w / 2 / VW, y + h / 2); ctx.strokeStyle = '#3a6a70'; ctx.lineWidth = 4 * K; ctx.strokeRect(A.x, Z.y, Z.x - A.x, A.y - Z.y); } }   // frames on no wall
  if (q.kind === 'hush') { const T0 = q.t0 + 1.2, T1 = q.t1 - 2.6, up = ease((t - T0) / 1.2), dn = ease((t - T1) / 1.4), y = 2.4 + 1.0 * up - 1.4 * dn, A = at(0.6, y);   // someone typing… then not
    if (t > T0 && dn < 1) { ctx.save(); ctx.globalAlpha = up * (1 - dn) * 0.8; ctx.fillStyle = '#122a30'; ctx.strokeStyle = '#4f7f86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(A.x - 70 * K, A.y - 30 * K, 140 * K, 60 * K, 30 * K); ctx.fill(); ctx.stroke();
      for (let n = 0; n < 3; n++) { const hop = t < T1 ? Math.max(0, Math.sin(t * 7 - n * 0.9)) : 0; ctx.fillStyle = '#8fbfc4'; ctx.beginPath(); ctx.arc(A.x + (-32 + n * 32) * K, A.y - hop * 6, 8 * K, 0, 7); ctx.fill(); } ctx.restore(); } }
  if (q.kind === 'booth') { /* the booth is the thing itself (drawn with the phones) */ }
}
function lampPost(ctx, at, K, u, y0, y1, sc, dead = false) {   // a street lamp standing in the sea
  const A = at(u, y0), Z = at(u, y1), w = 7 * K * sc; ctx.fillStyle = BODY; ctx.strokeStyle = RIM; ctx.lineWidth = 1.5;
  ctx.fillRect(A.x - w / 2, Z.y, w, A.y - Z.y); ctx.strokeRect(A.x - w / 2, Z.y, w, A.y - Z.y);
  ctx.beginPath(); ctx.moveTo(Z.x, Z.y); ctx.quadraticCurveTo(Z.x + 4 * K * sc, Z.y - 22 * K * sc, Z.x + 30 * K * sc, Z.y - 18 * K * sc); ctx.lineWidth = 4 * K * sc; ctx.strokeStyle = BODY; ctx.stroke(); ctx.lineWidth = 1.2; ctx.strokeStyle = RIM; ctx.stroke();
  ctx.fillStyle = dead ? '#0e1d21' : '#2a2418'; ctx.beginPath(); ctx.moveTo(Z.x + 20 * K * sc, Z.y - 16 * K * sc); ctx.lineTo(Z.x + 40 * K * sc, Z.y - 16 * K * sc); ctx.lineTo(Z.x + 34 * K * sc, Z.y - 6 * K * sc); ctx.lineTo(Z.x + 26 * K * sc, Z.y - 6 * K * sc); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 0.3; ctx.fillStyle = RIM; for (let n = 0; n < 3; n++) ctx.fillRect(A.x - (12 - n * 3) * K * sc, A.y + (4 + n * 5) * K * sc, (24 - n * 6) * K * sc, 1.2); ctx.globalAlpha = 1;
}
function chair(ctx, A, sc, tilt) {                            // an empty waiting-room chair standing in the water
  ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(tilt); ctx.fillStyle = BODY; ctx.strokeStyle = RIM; ctx.lineWidth = 1.6;
  ctx.fillRect(-20 * sc, -4 * sc, 40 * sc, 6 * sc); ctx.strokeRect(-20 * sc, -4 * sc, 40 * sc, 6 * sc);
  ctx.fillRect(-20 * sc, -40 * sc, 6 * sc, 38 * sc); ctx.strokeRect(-20 * sc, -40 * sc, 6 * sc, 38 * sc); ctx.fillRect(-20 * sc, -40 * sc, 34 * sc, 8 * sc); ctx.strokeRect(-20 * sc, -40 * sc, 34 * sc, 8 * sc);
  for (const x of [-18, 14]) { ctx.fillRect(x * sc, 2 * sc, 4 * sc, 26 * sc); } ctx.restore(); }
// the deep, after he dives: the sea bed, cords rising off it like kelp, marine snow drifting, bubbles off him
function under(ctx, pr, pxU, q, t, a, z, k) {
  ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#020c0f'; ctx.fillRect(a, 0, z - a, H);
  const K = pxU / 96; ctx.fillStyle = '#071a1e'; ctx.beginPath(); let A = pr(q.X0 - 1.5, 0.15); ctx.moveTo(A.x, H);
  for (let u = -0.15; u <= 1.15; u += 0.05) { A = pr(q.X0 + u * VW, 0.55 + 0.35 * Math.sin(u * 7.1) + 0.15 * Math.sin(u * 17)); ctx.lineTo(A.x, A.y); } ctx.lineTo(A.x, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1d4046'; ctx.lineWidth = 1.5; for (const p of q.phones) { const B = pr(q.X0 + p.x * VW, p.y); ctx.beginPath(); ctx.moveTo(B.x, B.y - 10 * K);
    for (let n = 1; n < 14; n++) ctx.lineTo(B.x + Math.sin(n * 0.8 + t * 1.4 + p.x * 9) * n * 1.8 * K, B.y - 10 * K - n * 16 * K); ctx.stroke(); }
  ctx.fillStyle = '#6f9fa4'; for (let n = 0; n < 60; n++) { const u = (rnd(n, 21) + t * 0.004 * (1 + rnd(n, 22))) % 1, y = 5.6 - ((rnd(n, 23) * 6 + t * 0.12 * (0.5 + rnd(n, 24))) % 6); A = pr(q.X0 + u * VW, y); ctx.globalAlpha = k * 0.35; ctx.fillRect(A.x, A.y, 1.6, 1.6); }
  ctx.restore(); }
// scene lights cut into the dark (the `hole` brush draws destination-out on the dark sheet)
function sceneLights(hole, pr, pxU, P, vis, t, b, s) {
  for (const i of vis) { const q = P.scenes[i], X = u => q.X0 + u * VW;
    if (q.kind === 'lamp') { const on = lampOn(t); if (on > 0) { const A = pr(X(0.12) + 0.3, 3.35), B = pr(X(0.12) + 0.3, 0.6); hole(A.x, A.y, 0.7 * pxU, 0.8 * on); hole(B.x, B.y + 10, 1.25 * pxU, 0.55 * on); } }
    if (q.kind === 'moon') { const A = pr(X(0.62), 5.2); hole(A.x, A.y, 0.9 * pxU, 0.45); const R = pr(X(0.62), G.HZ - 0.3); hole(R.x, R.y, 0.6 * pxU, 0.25); }
    if (q.kind === 'room') { const A = pr(X(0.75), 2.2); hole(A.x, A.y, 0.95 * pxU, 0.32 + 0.12 * rnd(Math.floor(t * 12), 1)); }
    if (q.kind === 'others') { const A = pr(X(0.5), G.HZ + 0.1); void A; }
  } }
function overLights(ctx, pr, pxU, P, vis, t, b, s) {
  for (const i of vis) { const q = P.scenes[i], X = u => q.X0 + u * VW, K = pxU / 96;
    if (q.kind === 'lamp') { const on = lampOn(t); if (on > 0) { const A = pr(X(0.12) + 0.3, 3.38); glow(ctx, A.x, A.y, 70 * K, WARM, 0.75 * on); ctx.fillStyle = '#fff4dc'; ctx.globalAlpha = on; ctx.fillRect(A.x - 6 * K, A.y - 2 * K, 12 * K, 5 * K); ctx.globalAlpha = 1;
      const R = pr(X(0.12) + 0.3, G.HZ - 0.1); void R; } }
    if (q.kind === 'moon') moon(ctx, pr(X(0.62), 5.2), 0.38 * pxU, t - q.t0, pr(X(0.62), G.HZ));
    if (q.kind === 'others') for (let n = 0; n < 70; n++) { const d = rnd(n, 12), A = pr(X(rnd(n, 11) * 1.05 - 0.02), G.HZ - 0.02 - (1 - d) * 0.9 * 0.5), r = 1 + 2.4 * (1 - d), a = (0.35 + 0.35 * Math.sin(t * (0.6 + rnd(n, 14)) + n)) * clamp((t - q.t0 - 1.4) / 2);   // everyone else's lamps, far off
      if (a <= 0) continue; glow(ctx, A.x, A.y, r * 5, WARM, a * 0.6); ctx.fillStyle = '#ffeccc'; ctx.globalAlpha = a; ctx.fillRect(A.x - r / 2, A.y - r / 2, r, r); ctx.globalAlpha = 1; }
  } }
const lampOn = t => t < 1.0 ? 0 : t < 1.6 ? (Math.sin(t * 60) > 0 ? 1 : 0.2) : t < 22.33 ? 1 : t < 22.6 ? (Math.sin(t * 90) > 0 ? 0.6 : 0) : 0;   // his lamp: on with the hum, out on the first hit
function moon(ctx, M, R, a, RF) {                            // the moon is a loading spinner: it fills, stalls, snaps back; it never finishes
  const ph = 33 / 4, f = (Math.max(0, a) % ph) / ph, fill = 0.04 + 0.92 * Math.pow(Math.min(1, f / 0.85), 1.6), stall = f > 0.85 ? Math.sin(a * 40) * 0.012 : 0, snap = clamp(1 - f / 0.06), in0 = clamp((a - 1.4) / 2);
  glow(ctx, M.x, M.y, R * 3.2, '#5ab8c0', (0.16 + 0.12 * snap) * in0);
  ctx.save(); ctx.globalAlpha = 0.5 * in0; const g = ctx.createRadialGradient(M.x - R * 0.3, M.y - R * 0.3, R * 0.1, M.x, M.y, R); g.addColorStop(0, '#d9f6f4'); g.addColorStop(1, '#5f8d90');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(M.x, M.y, R * 0.86, 0, 7); ctx.fill();
  ctx.globalAlpha = 0.8 * in0; ctx.strokeStyle = '#1c3236'; ctx.lineWidth = R * 0.15; ctx.beginPath(); ctx.arc(M.x, M.y, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = ICE; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(M.x, M.y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (fill + stall)); ctx.stroke();
  ctx.globalAlpha = 0.22 * in0; ctx.fillStyle = ICE; for (let n = 0; n < 7; n++) { const w = R * (1.1 - n * 0.12) + Math.sin(a * 2 + n) * 8; ctx.fillRect(RF.x - w / 2, RF.y + 4 + n * 8, w, 2); }
  ctx.restore(); }

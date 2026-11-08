// story-no-answer-runner.mjs — the city and the dark behind him (No Answer, the runner; Night Shift Detectives, Nov 4).
// The movie chapter is the template (LIGHTING.md §0): a black plate, a thin cold-teal line-art city, ONE soft warm-white cone
// from the torch in his hatband, the moon (the box, drawn by the mode's overlay), and at the very end warm doors. Layer order
// (LIGHTING §7): 1 plate · 2 the world's line art + the finds at full brightness · 3 ONE dark sheet (half res) with holes cut
// for the beam, its ground pool, the moon's halo, his small glow, the lamps, the doors · 4 light on top (the beam's haze, the
// street line, rims, glints) · then the 3D hazards (ink + cold moon rim) and Potato (always fully lit) · then the overlay.
// Perf (LIGHTING §6): the facades and the cone are pre-rendered once; no gradients built per frame for the beam; no blur.
// Purple: none here (his only). Warm amber: none before 161.66 (the lamps are cold, the beam is a desaturated white).
import { W, H, clamp, ease, rnd } from '../story.mjs';
import { NA, FIND, lensOf, lightAt, inBlack, SHARED } from '../modes/no-answer-runner.mjs';
import { BLANK_Q } from '../blank.mjs';
// SET STRIP (Chikin, Nov 5: "the assets are supposed to go away" / "It's a setting, they have to fill the space",
// D-20261105-12/28): in the movie set (?blank) the previous-story props, signs, cards, gags and characters are not drawn;
// only the look stays (the dark, the line-art city, the flashlight, the lamps, the doors' light). ?oldprops shows them again
// in a blank run, to compare.
const SET = BLANK_Q && !(() => { try { return new URLSearchParams(location.search).has('oldprops'); } catch (e) { return false; } })();

const TEAL = '#4f8e94', TEAL2 = '#2f6a70', RIM = '#bff8ff', BEAM = '244,236,216', LAMP = '216,236,255';
const U0 = 96;                                   // px per world unit the tiles are drawn at (the stage is 9.96 u across 960 px)
let TILES = null, CONE = null, CONEW = null, POOLW = null, POOLA = null, DOORC = null, SPILL = null, SHEET = null, SX = null, POOL = null, ROOM = null;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
// ---- pre-rendered once ----
function prep() {
  TILES = [];
  for (let i = 0; i < 6; i++) {                  // six noir facades: windows, a doorway, a fire escape, an awning; cold line art
    const bw = Math.round((2.6 + rnd(i, 1) * 1.6) * U0), bh = Math.round((3.2 + rnd(i, 2) * 1.8) * U0), c = mk(bw + 8, bh + 8), x = c.getContext('2d');
    x.strokeStyle = TEAL; x.lineWidth = 1.6; x.strokeRect(4, 4, bw, bh);
    for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const wx = 18 + k * (bw - 30) / 4, wy = 22 + r * 48; if (wy > bh - 150 || wx + 26 > bw - 6) continue;
      x.strokeRect(wx, wy, 26, 30); if (rnd(i * 31 + r, k) < 0.25) { x.beginPath(); x.moveTo(wx + 13, wy); x.lineTo(wx + 13, wy + 30); x.stroke(); } }
    const dx = 20 + rnd(i, 3) * (bw - 90); x.strokeRect(dx, bh - 104, 52, 108); x.beginPath(); x.arc(dx + 42, bh - 50, 2.5, 0, 7); x.stroke();   // a doorway (shut)
    if (i % 2) { x.strokeStyle = TEAL2; x.beginPath(); for (let z = 0; z < 4; z++) { const y = 70 + z * 60; if (y > bh - 160) break; x.moveTo(bw * 0.55, y); x.lineTo(bw - 8, y); x.moveTo(bw * 0.58, y); x.lineTo(bw - 24, y + 60); } x.stroke(); x.strokeStyle = TEAL; }
    if (i % 3 === 0) { x.beginPath(); x.moveTo(dx - 14, bh - 112); x.lineTo(dx + 66, bh - 112); x.lineTo(dx + 58, bh - 96); x.lineTo(dx - 6, bh - 96); x.closePath(); x.stroke(); }
    TILES.push({ c, w: bw / U0, h: bh / U0 });
  }
  // the cone, once (L = 1 shape, pointing right from the origin at (0, CH/2)): angular falloff (full inside 60% of the half-angle),
  // radial (1.0 out to 35% of its length, then quadratic to 0). Drawn per frame with rotate + scale only.
  const CL = 512, CH = 512, HALF = 22 * Math.PI / 180; CONE = mk(CL, CH); const x = CONE.getContext('2d'), img = x.createImageData(CL, CH);
  for (let py = 0; py < CH; py++) for (let px = 0; px < CL; px++) { const dx = px, dy = py - CH / 2, d = Math.hypot(dx, dy) / CL, a = Math.abs(Math.atan2(dy, dx)) / HALF;
    if (a > 1 || d > 1) continue; const ang = a < 0.3 ? 1 : 1 - ease((a - 0.3) / 0.7), rad = d < 0.35 ? 1 : Math.pow(1 - (d - 0.35) / 0.65, 2), k = ang * rad;
    const o = (py * CL + px) * 4; img.data[o] = 255; img.data[o + 1] = 255; img.data[o + 2] = 255; img.data[o + 3] = Math.round(255 * k); }
  x.putImageData(img, 0, 0);
  CONEW = mk(CL, CH); const w = CONEW.getContext('2d'); w.drawImage(CONE, 0, 0); w.globalCompositeOperation = 'source-in'; w.fillStyle = `rgb(${BEAM})`; w.fillRect(0, 0, CL, CH);
  POOL = mk(128, 128); const p = POOL.getContext('2d'), g = p.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); p.fillStyle = g; p.fillRect(0, 0, 128, 128);
  POOLW = mk(128, 128); { const q = POOLW.getContext('2d'), g2 = q.createRadialGradient(64, 64, 0, 64, 64, 64); g2.addColorStop(0, `rgba(${BEAM},1)`); g2.addColorStop(1, `rgba(${BEAM},0)`); q.fillStyle = g2; q.fillRect(0, 0, 128, 128); }
  POOLA = mk(128, 128); { const q = POOLA.getContext('2d'), g3 = q.createRadialGradient(64, 64, 0, 64, 64, 64); g3.addColorStop(0, 'rgba(255,180,90,1)'); g3.addColorStop(0.45, 'rgba(255,160,70,0.35)'); g3.addColorStop(1, 'rgba(255,150,60,0)'); q.fillStyle = g3; q.fillRect(0, 0, 128, 128); }
  DOORC = mk(64, 160); { const q = DOORC.getContext('2d'), g4 = q.createLinearGradient(0, 0, 0, 160); g4.addColorStop(0, '#f7b866'); g4.addColorStop(0.55, '#ffd08c'); g4.addColorStop(1, '#ffe6b8'); q.fillStyle = g4; q.fillRect(0, 0, 64, 160);
    const g5 = q.createLinearGradient(0, 0, 64, 0); g5.addColorStop(0, 'rgba(120,60,10,0.35)'); g5.addColorStop(0.25, 'rgba(120,60,10,0)'); g5.addColorStop(0.8, 'rgba(120,60,10,0)'); g5.addColorStop(1, 'rgba(120,60,10,0.25)'); q.fillStyle = g5; q.fillRect(0, 0, 64, 160); }
  SPILL = mk(128, 64); { const q = SPILL.getContext('2d'), g6 = q.createLinearGradient(0, 0, 0, 64); g6.addColorStop(0, 'rgba(255,169,71,0.9)'); g6.addColorStop(0.35, 'rgba(255,150,60,0.35)'); g6.addColorStop(1, 'rgba(255,140,50,0)'); q.fillStyle = g6;
    q.beginPath(); q.moveTo(40, 0); q.lineTo(88, 0); q.lineTo(128, 64); q.lineTo(0, 64); q.closePath(); q.fill(); }
  SHEET = mk(W / 2, H / 2); SX = SHEET.getContext('2d');
  ROOM = mk(W, H); const r = ROOM.getContext('2d');   // the inside (172.85 →): an empty dark room lit only by its screens, each one his small purple side-eye
  r.strokeStyle = 'rgba(47,106,112,0.55)'; r.lineWidth = 1.5; r.strokeRect(60, 128, W - 120, 290);   // (below the box + its case board, above the street)
  for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const sx = 110 + k * 112, sy = 150 + row * 82;
    const gl = r.createRadialGradient(sx + 39, sy + 27, 6, sx + 39, sy + 27, 70); gl.addColorStop(0, 'rgba(190,175,255,0.16)'); gl.addColorStop(1, 'rgba(190,175,255,0)'); r.fillStyle = gl; r.fillRect(sx - 40, sy - 44, 158, 142);   // each screen's own glow (pre-rendered once)
  }
  for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) { const sx = 110 + k * 112, sy = 150 + row * 82;
    r.fillStyle = '#0b0f1c'; r.fillRect(sx, sy, 78, 54); r.strokeStyle = '#3d5a78'; r.lineWidth = 1.5; r.strokeRect(sx, sy, 78, 54);
    r.fillStyle = 'rgba(232,236,255,0.9)'; r.beginPath(); r.ellipse(sx + 39, sy + 28, 16, 7, 0, 0, 7); r.fill();
    r.fillStyle = '#7b3cf2'; r.beginPath(); r.arc(sx + 47, sy + 28, 4.5, 0, 7); r.fill();                                  // the pupil to the side: his side-eye
    r.fillStyle = '#0b0f1c'; r.fillRect(sx + 22, sy + 19, 34, 5); }                                                     // half-lidded
}
// where the biggest door stands (both times): the stop, and the door that opens at the end
const DOOR1 = C => C.X(NA.STOP[0]) + 1.6, DOOR2 = C => C.X(NA.UNLOCK) + 1.2;

export function story(ctx, e) {
  const { t, s } = e; if (!TILES) prep();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (!s || !s.na || !e.project) return;
  const pr = e.project, o0 = pr(s.x, 0), u = pr(s.x + 1, 0).x - o0.x, gy = o0.y;   // px per unit, the street line's y
  const wx = px => s.x + (px - o0.x) / u;                                          // screen px -> world x
  const x0w = wx(-40), x1w = wx(W + 40);
  const na = s.na, L = lightAt(t, na), black = inBlack(t), warm = t >= NA.UNLOCK;
  if (!SHARED.C) return;
  // ---- 2 · the world at full brightness (the sheet decides what survives) ----
  // far skyline (parallax 0.35), then the street's facades (parallax 1)
  ctx.save(); ctx.globalAlpha = 0.55;
  for (let n = Math.floor((s.x * 0.35 - 12) / 4.2); n < (s.x * 0.35 + 14) / 4.2; n++) { const T0 = TILES[(n % 6 + 6) % 6], X = (n * 4.2 - s.x * 0.35) * u * 0.6 + o0.x, sc = 0.6 * u / U0;
    ctx.drawImage(T0.c, X, gy - 1.2 * u - T0.h * U0 * sc, T0.c.width * sc, T0.c.height * sc); }
  ctx.restore();
  const step = 4.0;
  for (let n = Math.floor((x0w - 5) / step); n * step < x1w + 1; n++) { const T0 = TILES[(Math.floor(rnd(n, 9) * 6) + 6) % 6], X = pr(n * step + rnd(n, 4) * 0.3, 0).x, sc = u / U0;
    if (warm || t < 172.85) ctx.drawImage(T0.c, X, gy - T0.h * U0 * sc - 4, T0.c.width * sc, T0.c.height * sc); }
  // the street lamps (cold), dead from 22.33
  const lamps = [7.0, 14.0, 21.0];
  for (const lt of lamps) { const A = pr(Cx(e, lt), 0); if (A.x < -60 || A.x > W + 60) continue; ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A.x, gy); ctx.lineTo(A.x, gy - 3.6 * u); ctx.lineTo(A.x + 0.5 * u, gy - 3.6 * u); ctx.stroke(); }
  // the finds, in the world (pictures, no words but THU)
  // (SET: the finds and the biggest door are out, the old case's plot props. Chikin: "the assets are supposed to go away")
  if (!SET) drawFinds(ctx, e, pr, u, na, t);
  // the biggest door (twice: the stop, the end)
  if (!SET) bigDoor(ctx, e, pr, u, gy, t, na);
  // ---- 3 · the dark sheet ----
  const amb = black ? 1 : warm ? 0.95 - 0.10 * ease((t - NA.UNLOCK) / (172.85 - NA.UNLOCK)) : 0.95;
  const sx = SX; sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, W / 2, H / 2); sx.fillStyle = `rgba(0,0,0,${amb})`; sx.fillRect(0, 0, W / 2, H / 2);
  sx.globalCompositeOperation = 'destination-out';
  const LO = lensOf(s), A = pr(LO.x, LO.y), aim = -na.aim * Math.PI / 180, half = NA.HALF(L) * Math.PI / 180;
  const v = Math.max(0.01, SHARED.C ? SHARED.C.speedAt(t) : 5), reachPx = Math.max(NA.R(t, v) * u, (W - A.x) * (0.85 + 0.15 * L));
  if (!black && t >= 5.5) {
    // the beam's hole: 0.92 × (0.45 + 0.55·L)
    sx.save(); sx.beginPath(); sx.rect(0, 0, W / 2, gy / 2); sx.clip(); sx.globalAlpha = 0.80 * (0.40 + 0.60 * L); sx.translate(A.x / 2, A.y / 2);   // (light stops at the street: it doesn't go through the ground)
    sx.rotate(aim); sx.scale(reachPx / 2 / 512, Math.tan(half) / Math.tan(22 * Math.PI / 180) * reachPx / 2 / 512); sx.drawImage(CONE, 0, -256); sx.restore();
    // his small glow (r 0.9 u, 0.2)
    sx.globalAlpha = 0.2; const G0 = pr(s.x, s.y + 0.6); sx.drawImage(POOL, (G0.x - 0.9 * u) / 2, (G0.y - 0.9 * u) / 2, 0.9 * u, 0.9 * u);
    // the long throw to the nameplate (111.54, one game beat)
    if (!SET && t >= 111.54 && t < 112.26) { const D = farDoorAt(e, pr, u, gy, t, 1); if (D) { sx.globalAlpha = 0.6 * Math.sin(Math.PI * (t - 111.54) / 0.72); sx.save(); sx.translate(A.x / 2, A.y / 2); const dx = D.plateX - A.x, dy = D.plateY - A.y;
      sx.rotate(Math.atan2(dy, dx)); sx.scale(Math.hypot(dx, dy) / 2 / 512, 0.18 * Math.hypot(dx, dy) / 2 / 512); sx.drawImage(CONE, 0, -256); sx.restore(); } }
  }
  // the moon's halo (the box, top right, 0.35) — kept on the black beats too
  sx.globalAlpha = 0.35; sx.drawImage(POOL, (848 - 190) / 2, (46 - 130) / 2, 190, 130);
  // the lamps (cold pools) until 22.33 (they flicker out on the hit)
  if (!black) for (const lt of lamps) { const on = t < NA.LAMP_OUT ? 1 : t < NA.LAMP_OUT + 0.25 ? (Math.floor(t * 30) % 2) : 0; if (!on) continue; const P0 = pr(Cx(e, lt) + 0.5, 3.5); if (P0.x < -200 || P0.x > W + 200) continue;
    sx.globalAlpha = 0.55; sx.drawImage(POOL, (P0.x - 1.7 * u) / 2, (P0.y) / 2 - 0.4 * u, 1.7 * u, 2.2 * u); sx.globalAlpha = 0.6; sx.drawImage(POOL, (P0.x - 1.6 * u) / 2, (gy - 0.3 * u) / 2, 1.6 * u, 0.3 * u); }
  // the doors (161.66 →): each opening cuts the dark, warm spill on the street
  const doors = warm ? openDoors(e, t) : [];
  for (const d of doors) { const P0 = pr(d.x, 1.4); if (P0.x < -200 || P0.x > W + 200) continue; sx.globalAlpha = 0.8 * d.k; sx.drawImage(POOL, (P0.x - 1.5 * u) / 2, (P0.y - 1.5 * u) / 2, 1.5 * u, 1.5 * u); }
  sx.globalCompositeOperation = 'source-over'; sx.globalAlpha = 1;
  // (SET: the room of screens with his side-eye is out, the old ending + a drawn Potato face. Chikin: "the assets are supposed to go away")
  if (!SET && t >= 172.85) { const k = ease((t - 172.85) / 1.2); ctx.save(); ctx.globalAlpha = k; ctx.drawImage(ROOM, 0, 0); ctx.restore(); }   // the inside: lit only by its screens (drawn above the sheet below)
  ctx.drawImage(SHEET, 0, 0, W, H);
  if (!SET && t >= 172.85) { const k = ease((t - 172.85) / 1.2); ctx.save(); ctx.globalAlpha = 0.85 * k; ctx.drawImage(ROOM, 0, 0); ctx.restore(); }
  // ---- 4 · light on top ----
  if (!black && t >= 5.5) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, gy); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.06 + 0.14 * L) * (warm ? 0.6 : 1); ctx.translate(A.x, A.y); ctx.rotate(aim);
    ctx.scale(reachPx / 512, Math.tan(half) / Math.tan(22 * Math.PI / 180) * reachPx / 512); ctx.drawImage(CONEW, 0, -256); ctx.restore(); }
  // the ground pool where the cone's lower edge meets the street (rx 1.4 + 1.0·L u, ry 0.22 u); a drain is a black notch in it
  if (!black && t >= 5.5) { const lowA = aim + half; if (lowA > 0.02) { const dG = (gy - A.y) / Math.tan(lowA), cx = A.x + Math.min(reachPx * 0.75, Math.max(0.5 * u, dG)) + 0.6 * u, rx = (1.4 + 1.0 * L) * u;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pa = (0.45 + 0.55 * L) * (warm ? 0.5 : 1); ctx.globalAlpha = 0.5 * pa; ctx.drawImage(POOLW, cx - rx, gy - 0.22 * u, rx * 2, 0.44 * u);
    // the wet street: the pool's reflection breaks into a few streaks under the line (the movie's rain-dark street; the 61.5 puddle lives here)
    for (let i = 0; i < 4; i++) { const yy = gy + (0.12 + i * 0.11) * u, ww = rx * (1.25 - i * 0.24), jx = (rnd(i, Math.floor(t * 6)) - 0.5) * 0.12 * u; ctx.globalAlpha = (0.22 - i * 0.045) * pa; ctx.drawImage(POOLW, cx - ww + jx, yy - 0.035 * u, ww * 2, 0.07 * u); }
    ctx.restore(); } }
  // rain: only where there's light (MOVIE-PLAN rule), one path, one stroke, clipped to the cone; none on a weak or black beam
  if (!black && !warm && t >= 5.5 && L >= 0.2) rain(ctx, A, aim, half, reachPx, gy, t, L, u);
  // the street line: 35% teal full width (70% in the pool, 20% on a black beat); a drain is a break in it with a cold rim on both lips
  streetLine(ctx, pr, u, gy, black ? 0.2 : 0.35);
  // the roofs: ink boxes with the moon rim (fair: you see them outside the beam)
  for (const r of SHARED.roofs || []) { const a = pr(SHARED.C.X(r.t), 0.6), b = pr(SHARED.C.X(r.tEnd), 0); if (b.x < -20 || a.x > W + 20) continue;
    ctx.fillStyle = '#05080a'; ctx.fillRect(a.x, a.y, b.x - a.x, gy - a.y); ctx.strokeStyle = `rgba(191,248,255,${black ? 0.4 : 0.6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, gy); ctx.lineTo(a.x, a.y); ctx.lineTo(b.x, a.y); ctx.lineTo(b.x, gy); ctx.stroke(); }
  // glints: what's coming (leads warm, blanks cold + the box's cursor)
  if (!black && !SET) glints(ctx, e, pr, u, na, t);   // (SET: out, they only pointed at the finds)
  // the doors' warm openings (161.66 →): the first warm light in the level
  for (const d of doors) { const a = pr(d.x - 0.5, 2.3), b = pr(d.x + 0.5, 0); if (b.x < -120 || a.x > W + 120) continue; warmDoor(ctx, a.x, a.y, b.x - a.x, b.y - a.y, gy, u, d.k, d.bright ? 1.3 : 1); }
  if (t >= 167.42 && t < 167.78) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,169,71,${0.12 * (1 - (t - 167.42) / 0.36)})`; ctx.fillRect(0, gy - 3 * u, W, 3.6 * u); ctx.restore(); }   // "still": one beat of amber across the street
  if (!SET) bigDoorRim(ctx, e, pr, u, gy, t, na, black);
}
const Cx = (e, t) => SHARED.C.X(t);
function groundClip(c, pr, u, gy, sc) {   // solid street (minus the drains), in sheet px (sc 0.5)
  c.rect(0, (gy - 0.6 * u) * sc, W * sc, 2 * u * sc);
  for (const [a, b] of SHARED.holes || []) { /* cut handled by drawing the notch black after */ }
}
function streetLine(ctx, pr, u, gy, a) {
  const holes = (SHARED.holes || []).map(([t0, t1]) => [pr(SHARED.C.X(t0), 0).x, pr(SHARED.C.X(t1), 0).x]).filter(([p, q]) => q > -10 && p < W + 10);
  ctx.save(); ctx.fillStyle = '#000'; for (const [p, q] of holes) ctx.fillRect(p, gy - 2, q - p, 3 * u);   // the drain: a black notch (no floor, no pool)
  ctx.strokeStyle = `rgba(79,142,148,${a})`; ctx.lineWidth = 2; ctx.beginPath(); let x = -10;
  for (const [p, q] of holes.sort((m, n) => m[0] - n[0])) { ctx.moveTo(x, gy); ctx.lineTo(p, gy); x = q; } ctx.moveTo(x, gy); ctx.lineTo(W + 10, gy); ctx.stroke();
  ctx.strokeStyle = `rgba(191,248,255,${a * 1.6})`; for (const [p, q] of holes) { ctx.beginPath(); ctx.moveTo(p, gy); ctx.lineTo(p, gy + 0.5 * u); ctx.moveTo(q, gy); ctx.lineTo(q, gy + 0.5 * u); ctx.stroke(); }
  ctx.restore();
}
function drawFinds(ctx, e, pr, u, na, t) {
  const C = SHARED.C; ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = '#120a05';
  const at = id => { const f = FIND[id]; return pr(C.X(f.at), f.y); };
  { const A = at('coupon'); if (A.x > -80 && A.x < W + 80) { ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(-0.08); ctx.scale(u / 96, u / 96);   // the torn FREE-POTATO coupon (a picture of him; no words)
      ctx.fillStyle = 'rgba(232,220,190,0.95)'; ctx.beginPath(); ctx.moveTo(-36, -24); ctx.lineTo(36, -22); ctx.lineTo(33, -2); ctx.lineTo(38, 6); ctx.lineTo(34, 24); ctx.lineTo(-35, 23); ctx.closePath(); ctx.fill();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#6b5530'; ctx.strokeRect(-30, -18, 60, 36); ctx.setLineDash([]); ctx.fillStyle = '#da9643'; ctx.strokeStyle = '#120a05'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 12, 14, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); } }
  { const A = at('flag'); if (A.x > -80 && A.x < W + 80) { ctx.save(); ctx.translate(A.x, A.y); ctx.scale(u / 96, u / 96);   // the NIEPAL toothpick flag stuck in a kerb crack (played straight)
      ctx.strokeStyle = '#3a4a4c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, 12); ctx.lineTo(-6, 4); ctx.lineTo(4, 14); ctx.lineTo(30, 6); ctx.stroke();
      ctx.strokeStyle = '#d9c9a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(0, -36); ctx.stroke(); ctx.fillStyle = '#d33a3a'; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(30, -28); ctx.lineTo(0, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a64c8'; ctx.fillRect(1, -31, 9, 5); ctx.restore(); } }
  { const A = at('sticky'); if (A.x > -80 && A.x < W + 80) { ctx.save(); ctx.translate(A.x, A.y); ctx.scale(u / 96, u / 96);   // the dead monitor on the kerb + its sticky note
      ctx.fillStyle = '#0d1218'; ctx.strokeStyle = '#3d5a78'; ctx.lineWidth = 3; ctx.fillRect(-34, -30, 68, 50); ctx.strokeRect(-34, -30, 68, 50); ctx.fillRect(-8, 20, 16, 16);
      ctx.fillStyle = '#ffe36b'; ctx.save(); ctx.rotate(0.12); ctx.fillRect(4, -26, 26, 26); ctx.fillStyle = '#9a8a30'; ctx.fillRect(8, -18, 16, 2.5); ctx.fillRect(8, -11, 12, 2.5); ctx.restore(); ctx.restore(); } }
  { const A = at('thu'); if (A.x > -80 && A.x < W + 80) { ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(0.06); ctx.scale(u / 96, u / 96);   // the torn calendar page THU (+ the stopped clock 5:12 beside it, a nod)
      ctx.fillStyle = '#f2efe6'; ctx.fillRect(-22, -26, 44, 52); ctx.fillStyle = '#d33a3a'; ctx.fillRect(-22, -26, 44, 12); ctx.fillStyle = '#120a05'; ctx.font = '700 20px "Oswald", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('THU', 0, 16);
      ctx.strokeStyle = '#cfd6e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(52, -4, 16, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(52, -4); ctx.lineTo(52, -16); ctx.moveTo(52, -4); ctx.lineTo(48, 8); ctx.stroke(); ctx.restore(); } }
  // the page: the plant blows past out of reach (70.9–72.6); it comes back on chorus two (138.2 →): catch it at the top of a jump
  if (t >= 70.6 && t < 72.9) { const k = (t - 70.6) / 2.3, P = { x: W * (1.05 - 1.2 * k), y: H * 0.18 + Math.sin(k * 9) * 14 }; page(ctx, P.x, P.y, u, k * 9, 0.8); }
  if (t >= 138.0) { const g = na.got.page, f = FIND.page;
    if (!g) { const A = pr(C.X(f.at), f.y + 0.12 * Math.sin(t * 5)); if (A.x < W + 80) page(ctx, A.x, A.y, u, Math.sin(t * 3) * 0.3, 1); }
    else if (!g.lit) { const k = clamp((t - g.t) / 0.4), A = pr(C.X(f.at) + 1.5 * k, f.y * (1 - k) + 0.05); if (A.x > -80) page(ctx, A.x, A.y, u, k * 1.4, 0.9); }   // missed: it drops on the route, he runs over it
  }
  ctx.restore();
}
function page(ctx, x, y, u, rot, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot * 0.3); ctx.scale(u / 96, u / 96); ctx.globalAlpha = a;   // the RTT page: its own field MASTER PASSWORD ______ + a red 42.
  ctx.fillStyle = '#f2efe6'; ctx.fillRect(-22, -30, 44, 60); ctx.fillStyle = '#8a92a2'; for (let i = 0; i < 4; i++) ctx.fillRect(-16, -22 + i * 7, 32 - i * 5, 2.5);
  ctx.fillStyle = '#120a05'; ctx.font = '700 6px "Oswald", sans-serif'; ctx.fillText('MASTER PASSWORD:', -17, 12); ctx.fillRect(-17, 18, 30, 1.5); ctx.fillStyle = '#c03030'; ctx.font = '700 9px "Oswald", sans-serif'; ctx.fillText('42.', 8, 27); ctx.restore(); }
// the biggest door: far on the horizon from 103.71 (and again from 149.8), its frame with a cold moon rim, a brass nameplate (blank)
function farDoorAt(e, pr, u, gy, t, which) {
  const C = SHARED.C, X = which === 1 ? DOOR1(C) : DOOR2(C), t0 = which === 1 ? 103.71 : 149.8, t1 = which === 1 ? NA.STOP[0] : NA.UNLOCK;
  if (t < t0 || (which === 1 && t > NA.STOP[1] + 0.8) || (which === 2 && t > NA.UNLOCK + 3)) return null;
  const real = pr(X, 0), k = ease((t - t0) / (t1 - t0));
  let x = real.x, sc = 1; if (real.x > W * 0.86) { x = W * 0.86 + (real.x - W * 0.86) * 0.04; sc = 0.38 + 0.62 * Math.min(1, Math.max(0, k * 1.4 - 0.3)); x = Math.min(x, W * 0.95); }
  const hgt = 3.6 * u * sc, wd = 1.7 * u * sc, top = gy - hgt;
  return { x, sc, top, wd, hgt, plateX: x, plateY: top + hgt * 0.32, fade: which === 1 && t > NA.STOP[1] ? clamp(1 - (t - NA.STOP[1]) / 0.8) : 1, open: which === 2 && t >= NA.UNLOCK ? clamp((t - NA.UNLOCK) / 0.4) : 0 };
}
function bigDoor(ctx, e, pr, u, gy, t, na) {
  for (const which of [1, 2]) { const D = farDoorAt(e, pr, u, gy, t, which); if (!D) continue;
    const rattle = which === 1 && t >= NA.STOP[0] && t < NA.STOP[1] ? Math.sin((t - NA.STOP[0]) * 70) * 0.05 * u : 0;
    ctx.save(); ctx.globalAlpha = D.fade; ctx.translate(rattle, 0);
    ctx.fillStyle = '#0a0d10'; ctx.fillRect(D.x - D.wd / 2, D.top, D.wd, D.hgt);
    if (D.open > 0) { ctx.fillStyle = `rgba(255,207,138,${0.9 * D.open})`; ctx.fillRect(D.x - D.wd / 2, D.top, D.wd * D.open, D.hgt); }
    ctx.strokeStyle = TEAL; ctx.lineWidth = 2; ctx.strokeRect(D.x - D.wd / 2, D.top, D.wd, D.hgt); ctx.strokeRect(D.x - D.wd / 2 - 6 * D.sc, D.top - 8 * D.sc, D.wd + 12 * D.sc, D.hgt + 8 * D.sc);
    ctx.fillStyle = '#b58a3a'; ctx.fillRect(D.plateX - 0.32 * u * D.sc, D.plateY - 0.09 * u * D.sc, 0.64 * u * D.sc, 0.18 * u * D.sc);   // the brass nameplate: blank
    ctx.beginPath(); ctx.arc(D.x + D.wd * 0.32, D.top + D.hgt * 0.55, 3 * D.sc, 0, 7); ctx.fill(); ctx.restore(); }
}
function bigDoorRim(ctx, e, pr, u, gy, t, na, black) {   // above the sheet: the frame's cold moon rim (45%) so "far ahead" reads in the dark; the plate's cursor blinks with the box's
  for (const which of [1, 2]) { const D = farDoorAt(e, pr, u, gy, t, which); if (!D) continue;
    ctx.save(); ctx.globalAlpha = D.fade * (black ? 0.3 : 1); ctx.strokeStyle = 'rgba(191,248,255,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(D.x - D.wd / 2, gy); ctx.lineTo(D.x - D.wd / 2, D.top); ctx.lineTo(D.x + D.wd / 2, D.top); ctx.lineTo(D.x + D.wd / 2, gy); ctx.stroke();
    const blink = Math.floor((t - SHARED.C.OFF) / SHARED.C.P) % 2 === 0; if (t >= 111.54 && blink && D.open === 0) { ctx.fillStyle = 'rgba(232,244,255,0.9)'; ctx.fillRect(D.plateX - 0.12 * u * D.sc, D.plateY + 0.02 * u * D.sc, 0.24 * u * D.sc, 2); }
    if (D.open > 0) warmDoor(ctx, D.x - D.wd / 2, D.top, D.wd, D.hgt, gy, u, D.open, 1.2);
    ctx.restore(); }
}
function warmDoor(ctx, x, y, w, h, gy, u, k, br) {   // one opened door: halo (additive), the lit opening, the dark leaf swung in, the teal frame, the spill on the street
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.42 * k * br; ctx.drawImage(POOLA, x + w / 2 - w * 1.6, y - h * 0.25, w * 3.2, h * 1.5);
  ctx.globalAlpha = 0.75 * k * br; ctx.drawImage(SPILL, x - w * 1.0, gy, w * 3.0, 1.1 * u); ctx.restore();
  ctx.save(); ctx.globalAlpha = Math.min(1, 0.25 + 0.75 * k); ctx.drawImage(DOORC, x, y, w, h); ctx.globalAlpha = 1;
  const lw = w * 0.9 * (1 - k); if (lw > 1) { ctx.fillStyle = '#07090b'; ctx.fillRect(x + w - lw, y, lw, h); }                    // the leaf still swinging (closed = all dark)
  ctx.fillStyle = 'rgba(10,8,6,0.85)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.16 * k, y + h * 0.05); ctx.lineTo(x + w * 0.16 * k, y + h * 0.97); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();   // the open leaf, edge-on at the hinge
  ctx.strokeStyle = TEAL; ctx.lineWidth = 1.6; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function openDoors(e, t) {   // one per game beat from 161.66, ~5 u ahead of him, so he runs past ones that are already lit
  const out = [], GB = 0.7202;
  for (let k = 1; k < 16; k++) { const td = NA.UNLOCK + k * GB; if (t < td) break; const x = SHARED.C.X(td) + 5.2; out.push({ x, k: clamp((t - td) / 0.4), bright: Math.abs(td - 167.42) < 0.4 }); }
  return out;
}
function glints(ctx, e, pr, u, na, t) {
  const C = SHARED.C, blink = Math.floor((t - C.OFF) / C.P) % 2 === 0;
  for (const id of ['coupon', 'flag', 'sticky', 'thu', 'page']) { const f = FIND[id]; if (na.got[id]) { const g = na.got[id]; if (g.lit && t - g.t < 0.15) { const A = pr(C.X(f.at), f.y); flash(ctx, A.x, A.y, u, f.kind); } continue; }
    if (id === 'page' && t < 138.2) continue;
    const A = pr(C.X(f.at), f.y); if (A.x < -20 || A.x > W + 20) continue;
    const on = 0.5 + 0.5 * Math.cos(2 * Math.PI * ((C.beatOf(t) % 1 + 1) % 1));
    sparkle(ctx, A.x + 0.25 * u, A.y - 0.2 * u, 0.14 * u, 0.35 + 0.4 * on, f.kind === 'lead' ? '255,236,190' : '232,244,255');
    if (f.kind === 'blank' && blink) { ctx.fillStyle = 'rgba(232,244,255,0.85)'; ctx.fillRect(A.x - 0.12 * u, A.y + 0.35 * u, 0.24 * u, 2); }
  }
}
function sparkle(ctx, x, y, r, a, col) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  ctx.globalAlpha = 0.35 * a; ctx.drawImage(POOL, x - r * 1.4, y - r * 1.4, r * 2.8, r * 2.8); ctx.restore(); }
function flash(ctx, x, y, u, kind) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.drawImage(kind === 'lead' ? POOLW : POOL, x - 0.55 * u, y - 0.55 * u, 1.1 * u, 1.1 * u); ctx.restore(); }
function rain(ctx, A, aim, half, reach, gy, t, L, u) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x + Math.cos(aim - half) * reach, A.y + Math.sin(aim - half) * reach); ctx.lineTo(A.x + Math.cos(aim + half) * reach, A.y + Math.sin(aim + half) * reach); ctx.closePath(); ctx.clip();
  ctx.beginPath(); const x0 = A.x, x1 = Math.min(W, A.x + reach), y0 = Math.max(0, A.y - Math.tan(half - aim) * reach), y1 = gy, n = 90, len = 0.22 * u, fall = 9.5 * u;
  for (let i = 0; i < n; i++) { const fx = x0 + rnd(i, 1) * (x1 - x0), ph = rnd(i, 2), yy = y0 + (((t * fall / (y1 - y0 + len)) + ph) % 1) * (y1 - y0 + len) - len; ctx.moveTo(fx, yy); ctx.lineTo(fx - 0.04 * u, yy + len); }
  ctx.strokeStyle = `rgba(${BEAM},${0.10 + 0.14 * L})`; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
}

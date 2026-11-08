// 404 BOO NOT FOUND — the music video + the cast on the course (plan: game/stories/boo-not-found.md, BUILD PLAN F + B).
// Two parts, Thursday's pattern:
//   `story(ctx, e)`  paints the background (a 960x540 canvas behind the course): the town in three depths (bare trees, houses
//                    with porch lights, power poles + wires), the moon, the light ladder (warm → frozen white → flicker → the
//                    porches die left to right after HIS wipe → moonlit → candlelit mansion → one warm line under a door), the
//                    background cast reacting on their words, world text (HALLOWEEN.EXE, THREAT LEVEL, OCT 31, MONSTERS ONLY,
//                    the Ouija letters, 3 FT, RENT DUE), the sheet thread, the three-voices bubble, and both endings.
//   `booView(...)`   (the level's modeView) puts the CAST ON THE COURSE in 3D: every hazard is a playdough monster / prop
//                    (sprites baked from the GLBs in assets3d/boo, the level's own sticker drawings where no asset exists) —
//                    THE HITBOX IS THE LIMB: what's at head height is what you duck, what's on the floor is what you hop, what
//                    fills the lane is what you glitch. Plus the 3D bits: the TAKE ONE hoop (its O stands in his lane: back
//                    half behind him, front half in front), the bowl on his head (the secret's HUD), the blank anatomy figure
//                    (a real GLB) in his place for one beat, three jack-o-lantern GLBs that turn to watch him, the cue ring.
// Both read the sim: s.deleted (his DELETE wipe: the ghosts gone, the wires fried), s.bowl (the key), s.sc.cue (bigger tears).
// House style: ink #120a05, NO white borders (D-20261105-09; ?border= shows the old ones), flat colour + one cel band. PURPLE ONLY FOR HIS GLITCH.
// No Potato images anywhere: the only Potato is the one you play. No lines in Potato's voice here (lyrics are the engine's).
// Module scope never touches document/Image (node imports this file for solve / fair): everything is made lazily.
import { W, H, clamp, ease, rnd, span } from '../story.mjs';
import { BOO_STYLE } from '../kitchen-boo.mjs';
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare

const INK = '#120a05', ORANGE = '#ff8a2b', AMBER = '#ffb04a', GOLD = '#ffd84a', SICK = '#8fdc3a', MOON = '#cfe6ff', MOON2 = '#9fb8dc', BONE = '#f1ead2',
  PURPLE = '#9a52ff', MAG = '#e03ccf', MONO = '"Major Mono Display", ui-monospace, monospace', PXU = 96.4;
// ---- the song's moments (estimates, see the level file) ----
const CRASH = 20.22, GOOD = 26.12, SPARK = 59.64, LID0 = 80.0, LOSE = 84.02, PRE = 84.4, ANAT0 = 89.44, ANAT1 = 90.28, CHORUS = 93.66, DELETE = 99.32,
  FRIED0 = 102.46, FRIED1 = 103.78, V2 = 111.1, V3 = 164.4, INSIDE = 167.44, LIGHTNING = 179.54, POSSESS = 191.36, FLEE = 197.74, BUBBLE0 = 193.34, BUBBLE1 = 208.41,
  BREAK = 236.3, SCREAM = 241.14, LEAN = 245.0, DOOR = 251.92, OPEN = 253.6, KITCHEN = 257.0;   // (he stands in the open doorway 256.6 → 257.0, then the cut)
// ---- the song + the course (set by the level's build) ----
let BP = 0.55682, BO = 0.2567, KICKS = [], CO = null, XF = null;
export function setSong(words, P, O, music) { BP = P; BO = O; KICKS = music && music.kick ? music.kick.slice() : []; }
export function setCourse(info) { CO = info; }
const lastIdx = (A, t) => { let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= t) lo = m + 1; else hi = m; } return lo - 1; };
const kickEnv = t => { const i = lastIdx(KICKS, t); return i < 0 ? 0 : Math.exp(-(t - KICKS[i]) / 0.11); };
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => '#' + hx(a).map((v, i) => Math.round(v + (hx(b)[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join('');
const rgba = (c, a) => { const [r, g, b] = hx(c); return `rgba(${r},${g},${b},${a})`; };
const frozenK = t => t >= CRASH && t < GOOD ? 1 : t >= GOOD && t < GOOD + 0.35 ? 1 - (t - GOOD) / 0.35 : 0;
const deletedOf = s => s && s.deleted != null;
const bowlOf = s => !!(s && s.bowl);

// =========================== sprites (assets3d/boo/sprites: the playdough cast, baked with dark ink, no white border: D-20261105-09) ===========================
const SPR = new URL('../../assets3d/boo/sprites/', import.meta.url).href;
const IMG = new Map();
function img(n, a = '35') { const k = n + '-' + a; let i = IMG.get(k); if (!i) { if (typeof Image === 'undefined') return null; i = new Image(); i.src = SPR + k + '.webp'; IMG.set(k, i); } return i.complete && i.naturalWidth ? i : null; }
// draw a sprite standing on (x, y) h px tall
function spr(ctx, n, x, y, h, o = {}) { const im = img(n, o.a || '35'); if (!im) return; const w = h * im.naturalWidth / im.naturalHeight;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(o.flip ? -1 : 1, o.sy || 1); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore(); }   // (no ctx.filter: far too slow per sprite; the moonlight is one multiply pass over the frame)
const GLOWC = new Map();
function glowS(ctx, x, y, r, color, a = 1) { if (a <= 0.004 || r <= 0) return; let c = GLOWC.get(color);
  if (!c) { c = document.createElement('canvas'); c.width = c.height = 128; const x2 = c.getContext('2d'), g = x2.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x2.fillStyle = g; x2.fillRect(0, 0, 128, 128); GLOWC.set(color, c); }
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(c, x - r, y - r, r * 2, r * 2); ctx.restore(); }
function inkPath(ctx, lw = 4, col = INK) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
// world text: heavy mono on a sticker card (a sign, a screen) — never a caption
function card(ctx, text, x, y, size, fg, bg, rot = 0, o = {}) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = `400 ${size}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + size * 1.1, h = size * 1.7; ctx.globalAlpha *= o.alpha ?? 1;
  if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10); } ctx.fillStyle = INK; ctx.fillRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4); ctx.fillStyle = bg; ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-w / 2 + 2, h / 2 - h * 0.22, w - 4, h * 0.22 - 2);
  ctx.fillStyle = fg; ctx.fillText(text, 0, 2); ctx.restore(); }

// where a thing anchored at song time ta stands on screen, at parallax k (1 = the lane's own depth)
const sx = (e, ta, k) => XF ? e.px + (XF(ta) - e.s.x) * PXU * k : -999;

// =========================== the town (three depths, laid out once) ===========================
const HOUSE_W = 250, POLE_W = 330, TREE_W = 150;
const HCOL = ['#2c3a4a', '#3a2e26', '#28382f', '#3b3a3e', '#2d3346', '#40322a'];
function house(ctx, x, base, i, lit, frozen, moon) {
  const h = 150 + rnd(i, 3) * 70, w = 170 + rnd(i, 4) * 40, col = frozen ? '#f4f2ec' : mix(HCOL[((i % HCOL.length) + HCOL.length) % HCOL.length], '#05070d', moon * 0.35), ink = frozen ? '#9a968c' : INK;
  const L = x - w / 2, T = base - h, roofH = 60 + rnd(i, 5) * 30;
  ctx.beginPath(); ctx.moveTo(L - 12, T); ctx.lineTo(x + (rnd(i, 6) - 0.5) * 30, T - roofH); ctx.lineTo(L + w + 12, T); ctx.closePath(); ctx.fillStyle = frozen ? '#e4e1d8' : mix('#1a1416', '#05070d', moon * 0.3); ctx.fill(); inkPath(ctx, 4, ink);
  ctx.beginPath(); ctx.rect(L, T, w, h); ctx.fillStyle = col; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(L + w * 0.8, T, w * 0.2, h); ctx.restore(); inkPath(ctx, 4, ink);
  // two windows + a door; the porch light
  for (const wx of [L + w * 0.22, L + w * 0.62]) { ctx.beginPath(); ctx.rect(wx, T + 26, 34, 40); ctx.fillStyle = frozen ? '#ffffff' : lit > 0.5 ? '#ffb04a' : '#10151f'; ctx.fill(); inkPath(ctx, 3, ink);
    if (!frozen && lit > 0.5) glowS(ctx, wx + 17, T + 46, 46, '#ff9a3c', 0.35 * lit); ctx.beginPath(); ctx.moveTo(wx + 17, T + 26); ctx.lineTo(wx + 17, T + 66); ctx.moveTo(wx, T + 46); ctx.lineTo(wx + 34, T + 46); inkPath(ctx, 2.5, ink); }
  ctx.beginPath(); ctx.rect(x - 16, base - 58, 32, 58); ctx.fillStyle = frozen ? '#e8e5dc' : '#1c120c'; ctx.fill(); inkPath(ctx, 3, ink);
  if (!frozen && lit > 0.5) { glowS(ctx, x + 26, base - 66, 40, '#ffcf73', 0.5 * lit); ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.arc(x + 26, base - 66, 5, 0, 7); ctx.fill(); }
  // a jack-o-lantern on the step
  const px = x - 44, py = base - 12; ctx.beginPath(); ctx.ellipse(px, py, 15, 12, 0, 0, 7); ctx.fillStyle = frozen ? '#ffffff' : lit > 0.5 ? '#f07a1a' : '#5a3418'; ctx.fill(); inkPath(ctx, 3, ink);
  if (!frozen && lit > 0.5) { ctx.fillStyle = '#ffe066'; ctx.fillRect(px - 7, py - 4, 4, 4); ctx.fillRect(px + 3, py - 4, 4, 4); ctx.fillRect(px - 6, py + 3, 12, 3); glowS(ctx, px, py, 26, '#ff8a2b', 0.4 * lit); }
}
function houseLit(i, X, t, s) {
  if (t < FRIED0) { if (span(t, SPARK, SPARK + 0.9)) return rnd(i, Math.floor(t * 14)) < 0.45 ? 0 : 1; return 1; }
  const del = deletedOf(s), a = FRIED0 + (del ? 0 : 0.4), d = del ? FRIED1 - FRIED0 : 1.9;   // missed: smaller and later (the wipe didn't reach the wires)
  if (t < a) return 1; const p = (t - a) / d; if (p >= 1.05) return 0;
  return X / W < p ? 0 : (rnd(i, Math.floor(t * 20)) < 0.25 && X / W < p + 0.12 ? 0 : 1);
}
function town(ctx, e, fk, moonK) {
  const { t, s } = e, fy = e.floorY ?? 395, gone = t >= V3 ? ease((t - V3) / 2.4) : 0;
  if (gone >= 1) return;
  ctx.save(); ctx.globalAlpha = 1 - gone;
  // far: bare trees (parallax 0.12)
  { const off = (s.x * PXU * 0.12) % TREE_W; ctx.strokeStyle = fk ? '#c9c5bb' : mix('#0d1322', '#05070d', 0.2); ctx.lineCap = 'round';
    for (let i = -1; i < W / TREE_W + 2; i++) { const id = i + Math.floor(s.x * PXU * 0.12 / TREE_W), x = i * TREE_W - off + rnd(id, 1) * 60, b = fy - 70;
      const br = (x0, y0, a, l, w, d) => { if (d > 4 || l < 8) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        br(x1, y1, a - 0.45 + rnd(id + d, l) * 0.2, l * 0.68, w * 0.62, d + 1); br(x1, y1, a + 0.4 + rnd(d, id) * 0.25, l * 0.62, w * 0.6, d + 1); };
      br(x, b, -Math.PI / 2 + (rnd(id, 2) - 0.5) * 0.3, 60 + rnd(id, 3) * 40, 9, 0); } }
  // mid: the houses (parallax 0.34)
  { const k = 0.34, off = s.x * PXU * k, i0 = Math.floor(off / HOUSE_W) - 1;
    for (let i = i0; i < i0 + W / HOUSE_W + 3; i++) { const x = i * HOUSE_W - off + HOUSE_W / 2; house(ctx, x, fy - 28, i, houseLit(i, x, t, s), fk > 0.5, moonK); } }
  // near: power poles and wires (parallax 0.6); the wipe's sparks run along them to the transformers
  { const k = 0.6, off = s.x * PXU * k, i0 = Math.floor(off / POLE_W) - 1, top = 120, col = fk > 0.5 ? '#bdb8ae' : '#22180f';
    const pts = []; for (let i = i0; i < i0 + W / POLE_W + 3; i++) pts.push([i * POLE_W - off, i]);
    for (const [x] of pts) { ctx.beginPath(); ctx.rect(x - 6, top, 12, fy - 18 - top); ctx.fillStyle = col; ctx.fill(); inkPath(ctx, 3, fk > 0.5 ? '#9a968c' : INK); ctx.beginPath(); ctx.rect(x - 34, top + 14, 68, 8); ctx.fill(); inkPath(ctx, 3, fk > 0.5 ? '#9a968c' : INK);
      ctx.beginPath(); ctx.ellipse(x + 18, top + 40, 10, 15, 0, 0, 7); ctx.fillStyle = fk > 0.5 ? '#e4e1d8' : '#3a4048'; ctx.fill(); inkPath(ctx, 3, fk > 0.5 ? '#9a968c' : INK); }
    const del = deletedOf(s), sparkOn = t >= DELETE && t < FRIED1 + 0.6 && (del || t > FRIED0);
    for (let j = 0; j + 1 < pts.length; j++) for (const dy of [16, 22]) { const a = pts[j][0] - 30 + (dy - 16) * 10, b = pts[j + 1][0] - 30 + (dy - 16) * 10, y = top + dy;
      ctx.beginPath(); ctx.moveTo(a, y); ctx.quadraticCurveTo((a + b) / 2, y + 46, b, y); ctx.lineWidth = 2.5; ctx.strokeStyle = fk > 0.5 ? '#9a968c' : '#05070d'; ctx.stroke();
      if (sparkOn) { const u = ((t - DELETE) * 1.6 + rnd(j, dy)) % 1, xx = a + (b - a) * u, yy = y + 46 * 2 * u * (1 - u); glowS(ctx, xx, yy, 18, '#ffe9a0', 0.9); ctx.fillStyle = '#ffffff'; ctx.fillRect(xx - 2, yy - 2, 4, 4); } }
    // the transformers blow, left to right (SYSTEM FRIED)
    if (t >= FRIED0 - 0.1 && t < FRIED1 + 0.8) for (const [x, i] of pts) { const lit = houseLit(i, x, t - 0.05, s), was = houseLit(i, x, t - 0.25, s); if (was && !lit) glowS(ctx, x + 18, top + 40, 70, '#fff2c0', 0.9); } }
  ctx.restore();
}

// =========================== the mansion on the hill (84.4 →), the inside (167.4 →) ===========================
function mansion(ctx, e, k, a) { if (a <= 0) return; const { t } = e, fy = e.floorY ?? 395, cx = 740 - 140 * k, base = fy - 40 + 30 * k, sc = 0.55 + 1.6 * k;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, base); ctx.scale(sc, sc);
  ctx.beginPath(); ctx.moveTo(-260, 40); ctx.quadraticCurveTo(-60, -40, 0, -44); ctx.quadraticCurveTo(80, -40, 260, 40); ctx.closePath(); ctx.fillStyle = '#0b1210'; ctx.fill(); inkPath(ctx, 4 / sc);
  const body = (x, y, w, h, roof) => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fillStyle = '#18201c'; ctx.fill(); inkPath(ctx, 4 / sc); ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + w / 2, y - roof); ctx.lineTo(x + w + 8, y); ctx.closePath(); ctx.fillStyle = '#0e1412'; ctx.fill(); inkPath(ctx, 4 / sc); };
  body(-90, -150, 180, 110, 60); body(-130, -200, 50, 160, 70); body(80, -190, 50, 150, 60);
  for (const [wx, wy] of [[-60, -130], [-20, -130], [20, -130], [60, -130], [-118, -170], [92, -160], [-40, -95], [30, -95]]) { const fl = 0.7 + 0.3 * Math.sin(t * 9 + wx) * Math.sin(t * 5.3 + wy);
    ctx.fillStyle = mix('#5a3a12', '#ffcf73', fl); ctx.fillRect(wx - 7, wy - 9, 14, 18); ctx.lineWidth = 2 / sc; ctx.strokeStyle = INK; ctx.strokeRect(wx - 7, wy - 9, 14, 18); glowS(ctx, wx, wy, 22, '#ffb04a', 0.25 * fl); }
  ctx.restore(); }
function inside(ctx, e, a) { if (a <= 0) return; const { t, s } = e, fy = e.floorY ?? 395, off = s.x * PXU * 0.5;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#132219'; ctx.fillRect(0, 0, W, fy); const sw = 56, o2 = off % (sw * 2);
  for (let x = -o2; x < W + sw; x += sw * 2) { ctx.fillStyle = '#18291f'; ctx.fillRect(x, 0, sw, fy); }
  ctx.fillStyle = 'rgba(160,190,140,.06)'; for (let r = 0; r < 7; r++) for (let x = -o2 - sw; x < W + sw; x += sw) { const y = 30 + r * 52 + ((x + o2) / sw % 2 ? 26 : 0); ctx.beginPath(); ctx.ellipse(x + sw / 2, y, 7, 12, 0, 0, 7); ctx.fill(); }
  // the wainscot + the floor line
  ctx.fillStyle = '#2a1a12'; ctx.fillRect(0, fy - 74, W, 74); ctx.fillStyle = '#3a2618'; ctx.fillRect(0, fy - 80, W, 10); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, fy - 80); ctx.lineTo(W, fy - 80); ctx.stroke();
  for (let x = -(off % 120); x < W; x += 120) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.strokeRect(x + 10, fy - 64, 100, 54); }
  // portraits (blank faces: nobody here has a face to lose) and candle sconces on the kick
  const kk = kickEnv(t), pO = off % 440;
  for (let x = -pO + 220; x < W + 240; x += 440) { const id = Math.floor((x + off) / 440), y = 70;
    ctx.save(); ctx.translate(x, y); ctx.rotate((rnd(id, 2) - 0.5) * 0.06 + (t >= LEAN && t < DOOR ? 0.1 * Math.sin(t * 3) : 0));
    if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-58, -6, 116, 150); } ctx.fillStyle = INK; ctx.fillRect(-55, -3, 110, 144); ctx.fillStyle = '#9a7a2a'; ctx.fillRect(-50, 2, 100, 134); ctx.fillStyle = '#1d2a24'; ctx.fillRect(-38, 14, 76, 110);
    ctx.fillStyle = '#c9c2b0'; ctx.beginPath(); ctx.ellipse(0, 56, 20, 26, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-26, 84, 52, 40);
    if (rnd(id, 3) < 0.4) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-7, 52, 4, 0, 7); ctx.arc(7, 52, 4, 0, 7); ctx.fill(); }
    ctx.restore(); }
  for (let x = -(off % 220) + 110; x < W + 220; x += 220) { const y = 200; ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x - 12, y, 24, 8); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x - 12, y, 24, 8);
    ctx.fillStyle = BONE; ctx.fillRect(x - 5, y - 26, 10, 26); ctx.strokeRect(x - 5, y - 26, 10, 26);
    const fl = 1 + 0.18 * Math.sin(t * 13 + x) + 0.25 * kk; ctx.beginPath(); ctx.moveTo(x, y - 26 - 22 * fl); ctx.quadraticCurveTo(x + 9, y - 30, x, y - 26); ctx.quadraticCurveTo(x - 9, y - 30, x, y - 26 - 22 * fl); ctx.fillStyle = ORANGE; ctx.fill(); inkPath(ctx, 2.5);
    glowS(ctx, x, y - 36, 70 + 30 * kk, '#ffb04a', 0.35); }
  // the back hall (194 →): a staircase climbing out of the top right — where the sheet flees
  if (t >= 192.5) { const k = ease((t - 192.5) / 1.5) * (t < 236 ? 1 : 1); ctx.save(); ctx.globalAlpha *= k; const bx = 620 - (s.x - (XF ? XF(196) : s.x)) * PXU * 0.5;
    for (let i = 0; i < 9; i++) { const x = bx + i * 34, y = fy - 80 - i * 30; ctx.fillStyle = '#2a1a12'; ctx.fillRect(x, y, 300, 30); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x, y, 300, 30); }
    ctx.restore(); }
  // the ceiling bulges where the sheet went (the scream)
  if (t >= 238.6 && t < 249.5) { const u = clamp((t - 238.6) / 2.5), wob = Math.sin(t * 8) * 6 * (t > SCREAM ? 1 : 0.3); ctx.beginPath(); ctx.moveTo(380, 0); ctx.quadraticCurveTo(560, 40 + 70 * u + wob, 740, 0); ctx.closePath(); ctx.fillStyle = '#0d1a12'; ctx.fill(); inkPath(ctx, 4);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(500 + i * 30, 8); ctx.lineTo(510 + i * 30 + rnd(i, 3) * 20, 30 + 50 * u * rnd(i, 4)); inkPath(ctx, 2); } }
  ctx.restore(); }

// =========================== the background cast (sprites at a depth, anchored to song time) ===========================
// [name, anchor t (where along the street), from, to, height (world units), parallax k, opts]
const CAST = [
  ['bat-man', 6.4, 0, 20.4, 1.95, 0.92, { swap: [[14.9, 'bat-man--ear-droop']] }],
  ['kid-pumpkin', 31.0, 26.5, 40, 1.4, 0.7, {}], ['kid-sheet', 33.0, 26.5, 40, 1.45, 0.66, { flip: true }], ['kid-cat', 35.4, 26.5, 42, 1.35, 0.7, {}],
  ['vampire', 42.0, 38.5, 45.5, 1.85, 0.86, { glide: [39.58, 42.44] }], ['vampire', 49.0, 45.5, 52, 1.7, 0.7, { a: '0', sit: true }], ['pink-bottle', 49.4, 45.5, 52, 0.45, 0.7, {}],
  ['picket-fence', 55.0, 47, 54.3, 1.2, 0.82, {}], ['picket-fence-hole', 55.0, 54.3, 64, 1.2, 0.82, {}], ['werewolf--sit', 52.2, 48.6, 53.3, 1.55, 0.9, { swap: [[48.6, 'werewolf'], [50.5, 'werewolf--sit']] }],
  ['werewolf--cone', 57.4, 56.0, 64, 1.7, 0.72, {}],
  ['witch', 63.0, 61.0, 67, 2.1, 0.8, {}], ['mummy', 70.4, 66.0, 73, 1.8, 0.86, { swap: [[67.0, 'mummy--shamble'], [67.6, 'mummy'], [68.2, 'mummy--shamble']] }],
  ['zombie', 79.2, 75.6, 84.3, 1.8, 0.9, { rise: 75.8 }],
  ['crypt', 96.9, 93.5, 100.5, 2.2, 0.8, {}],
  ['raisin-lady', 115.4, 112.0, 118.5, 1.9, 0.9, {}], ['raisin-lady', 121.9, 118.6, 124.5, 1.9, 0.9, { swap: [[121.08, 'raisin-lady--give']] }], ['one-star', 127.6, 126.88, 131, 0.6, 0.86, { lift: 1.3 }],
  ['balloons', 157.3, 155.46, 160, 1.8, 0.85, { rise: 155.46 }],
  ['lonely-ghost', 169.0, 167.0, 176, 1.45, 0.62, { swap: [[167.5, 'lonely-ghost--sway-l'], [168.6, 'lonely-ghost--sway-r']], bob: true }], ['ghost-table', 169.4, 167.0, 176, 0.9, 0.62, {}],
  ['lonely-ghost', 172.6, 167.0, 178, 1.4, 0.55, { flip: true, bob: true }], ['ghost-table', 172.2, 167.0, 178, 0.85, 0.55, {}],
  ['skeleton-dj', 171.5, 168.0, 176.2, 1.85, 0.8, { swap: [[168.98, 'skeleton-dj--scratch'], [170.1, 'skeleton-dj'], [171.2, 'skeleton-dj--scratch'], [172.88, 'BONES'], [174.0, 'skeleton-dj']] }],
  ['dj-decks', 171.0, 168.0, 176.2, 0.9, 0.8, {}],
  ['frankenstein', 180.6, 175.5, 184.5, 1.9, 0.82, { swap: [[177.72, 'frankenstein--apart'], [181.6, 'frankenstein']] }], ['punch-bowl', 179.8, 175.5, 184.5, 1.0, 0.82, {}],
  ['demon', 211.6, 208.0, 221.0, 1.9, 0.8, { swap: [[216.0, 'demon--stamp'], [216.6, 'demon']] }], ['file-tower', 213.4, 208.0, 217.41, 2.0, 0.84, {}],
  ['measuring-stick', 233.0, 228.0, 236.0, 1.05, 0.9, {}], ['demon--stamp', 235.2, 232.0, 237.0, 2.0, 0.75, {}],
];
function cast(ctx, e, moonK, candle) { const { t } = e, fy = e.floorY ?? 395;
  for (const [n0, ta, a, b, hW, k, o] of CAST) { if (t < a - 0.6 || t > b + 0.6) continue; let x = sx(e, ta, k); if (x < -200 || x > W + 200) continue;
    let n = n0; if (o.swap) for (const [st, nn] of o.swap) if (t >= st) n = nn; if (n === 'BONES') continue;
    const al = Math.min(ease((t - a + 0.6) / 0.6), ease((b + 0.6 - t) / 0.6)), hpx = hW * PXU * k; let y = fy - 6 - (1 - k) * 60;
    if (o.glide) { const u = clamp((t - o.glide[0]) / (o.glide[1] - o.glide[0])); x += (1 - ease(u)) * 300; y -= Math.sin(u * Math.PI) * 40; }
    if (o.rise != null && t < o.rise + 0.8) { const u = clamp((t - o.rise) / 0.8); ctx.save(); ctx.beginPath(); ctx.rect(x - 200, 0, 400, y); ctx.clip(); spr(ctx, n, x, y + hpx * (1 - ease(u)), hpx, { a: o.a, flip: o.flip, alpha: al, dim: 1 - moonK * 0.3 }); ctx.restore(); continue; }
    if (o.lift) y -= o.lift * PXU * k; if (o.bob) y -= 6 + Math.sin(t * 2.2 + ta) * 6;
    spr(ctx, n, x, y, hpx, { a: o.a, flip: o.flip, alpha: al, dim: candle ? 1.05 : 1 - moonK * 0.3, sy: o.sit ? 0.82 : 1 }); }
  // the skeleton DJ falls apart on his own beat (BACK.), rebuilds on the next bar
  if (span(t, 172.88, 174.0)) { const x = sx(e, 171.5, 0.8), u = (t - 172.88) / 1.12; for (let i = 0; i < 7; i++) { const bx = x + (rnd(i, 1) - 0.5) * 120 * Math.min(1, u * 3), by = fy - 10 - (1 - Math.min(1, u * 3)) * 120 * rnd(i, 2);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(rnd(i, 3) * 6 + u * 4); ctx.fillStyle = BONE; ctx.fillRect(-18, -4, 36, 8); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(-18, -4, 36, 8); ctx.restore(); } }
  // the horseman charges past behind, nowhere to look (184.66 → 188.8)
  if (span(t, 184.2, 189.2)) { const u = (t - 184.2) / 5, x = W + 200 - u * (W + 500), y = fy - 30; spr(ctx, 'horse', x, y, 2.0 * PXU * 0.7, { flip: true }); spr(ctx, 'horseman--ride', x - 10, y - 1.15 * PXU * 0.7, 1.25 * PXU * 0.7, { flip: true }); }
  // LIGHTNING: one white flash on the window side
  if (span(t, LIGHTNING, LIGHTNING + 0.3)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * (1 - (t - LIGHTNING) / 0.3); ctx.fillStyle = '#eef6ff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// =========================== the frozen frame (HALLOWEEN.EXE), the threat dial, the street sign, the MONSTERS ONLY card ===========================
function dialog(ctx, t, s) {   // in front of the moon; on GOOD. his glitch tears it into candy wrappers
  if (t < CRASH || t > GOOD + 1.4) return; const x = 420, y = 150, w = 400, h = 150;
  if (t < GOOD) { const pop = ease((t - CRASH) / 0.12);
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.translate(-w / 2, -h / 2);
    if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -6, w + 12, h + 12); } ctx.fillStyle = INK; ctx.fillRect(-3, -3, w + 6, h + 6); ctx.fillStyle = '#f4f2ec'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c9c5bb'; ctx.fillRect(0, 0, w, 30); ctx.fillStyle = INK; ctx.font = `400 16px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('halloween.exe', 12, 16);
    ctx.fillText('x', w - 22, 15); ctx.font = `400 17px ${MONO}`; ctx.fillText('halloween.exe is not', 22, 62); ctx.fillText('responding.', 22, 86);
    const dots = '.'.repeat(1 + Math.floor((t - CRASH) * 2) % 3); ctx.fillText(dots, 160, 86);
    for (const [bx, lab] of [[w - 210, 'wait'], [w - 108, 'close']]) { ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, h - 42, 92, 30); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(bx, h - 42, 92, 30); ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(lab, bx + 46, h - 26); ctx.textAlign = 'left'; }
    ctx.restore(); return; }
  const u = (t - GOOD) / 1.4, big = s && s.sc && s.sc.cue && s.sc.cue[0] && s.sc.cue[0].g === 'PERFECT' ? 1.4 : 1;
  for (let i = 0; i < 16; i++) { const px = x + w / 2 + (rnd(i, 1) - 0.5) * w * (0.4 + u * 2.4 * big), py = y + h / 2 + (rnd(i, 2) - 0.5) * h + u * u * 420 * (0.5 + rnd(i, 3));
    spr(ctx, 'candy-wrapper', px, py, 38, { rot: u * 8 * (rnd(i, 4) - 0.5), alpha: 1 - u * 0.6 }); }
}
function threatDial(ctx, e) { const { t } = e; if (t < 9.6 || t > 16) return; const x = 600, y = (e.floorY ?? 395) - 215, a = Math.min(ease((t - 9.6) / 0.3), ease((16 - t) / 0.4));
  const v = t < 10.24 ? 0.5 : t < 11.96 ? 0.5 + 0.45 * ease((t - 10.24) / 0.6) : 0.95 - 0.95 * ease((t - 11.96) / 0.5);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 58, Math.PI, 0); ctx.lineTo(58, 14); ctx.lineTo(-58, 14); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 54, Math.PI, 0); ctx.lineTo(54, 10); ctx.lineTo(-54, 10); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, 46, Math.PI + i * Math.PI / 3, Math.PI + (i + 1) * Math.PI / 3); ctx.lineWidth = 12; ctx.strokeStyle = [SICK, AMBER, '#e8463a'][i]; ctx.stroke(); }
  const an = Math.PI + v * Math.PI; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * 42, Math.sin(an) * 42); inkPath(ctx, 5, '#ffffff');
  ctx.font = `400 11px ${MONO}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText('threat level', 0, 4); ctx.restore(); }
function scanner(ctx, e) { const { t } = e; if (!span(t, 7.56, 9.7)) return; const x0 = 560, u = (t - 7.56) / 2.0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(127,240,255,.10)'; ctx.beginPath(); ctx.moveTo(x0, 160); ctx.lineTo(e.px + 60, e.py - 60 + 140 * Math.sin(u * 6.28)); ctx.lineTo(e.px - 60, e.py - 60 + 140 * Math.sin(u * 6.28)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(127,240,255,.6)'; ctx.fillRect(e.px - 60, e.py - 60 + 140 * Math.sin(u * 6.28), 120, 3); ctx.restore(); }

// =========================== the sheet thread + the three voices ===========================
function sheetPos(t, e) { const corner = [905 + Math.sin(t * 0.9) * 14, 250 + Math.sin(t * 1.3) * 16], me = [e.px, e.py - 20];
  if (t < GOOD || t >= FLEE + 0.9) return null;
  if (t < GOOD + 1.2) { const u = ease((t - GOOD) / 1.2); return [me[0] + (corner[0] - me[0]) * u, me[1] + (corner[1] - me[1]) * u - Math.sin(u * 3.14) * 80, u * 0.6]; }
  if (t < POSSESS - 0.5) return [...corner, Math.sin(t * 1.7) * 0.15];
  if (t < POSSESS) { const u = ease((t - POSSESS + 0.5) / 0.5); return [corner[0] + (me[0] - corner[0]) * u, corner[1] + (me[1] - corner[1]) * u, -0.6 * u]; }
  if (t < FLEE) return null;   // inside him (he wears it for a beat: the level's look)
  const u = (t - FLEE) / 0.9; return [me[0] + u * 300, me[1] - u * 420, u * 2]; }
function sheet(ctx, e) { const p = sheetPos(e.t, e); if (!p) return; spr(ctx, 'loose-sheet', p[0], p[1] + 40, 80, { rot: p[2] }); }
function bubble(ctx, e) { const { t } = e; if (t < BUBBLE0 || t > BUBBLE1 + 0.3) return; const pop = t > BUBBLE1 ? 1 + (t - BUBBLE1) * 3 : ease((t - BUBBLE0) / 0.25), a = t > BUBBLE1 ? 1 - (t - BUBBLE1) / 0.3 : 1;
  const x = Math.min(W - 170, e.px + 150), y = Math.max(110, e.py - 150);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(pop, pop);
  for (const [bx, by, r] of [[-110, 80, 9], [-90, 60, 13]]) { ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); inkPath(ctx, 4); }
  ctx.beginPath(); ctx.ellipse(0, 0, 150, 74, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); inkPath(ctx, 5);
  // three voices: the tea, the deep one in charge, and the one screaming in his glitch
  ctx.save(); ctx.translate(-82, 8); ctx.beginPath(); ctx.moveTo(-26, -18); ctx.lineTo(22, -18); ctx.quadraticCurveTo(20, 18, 0, 20); ctx.quadraticCurveTo(-24, 18, -26, -18); ctx.fillStyle = '#f4efe6'; ctx.fill(); inkPath(ctx, 4);
  ctx.beginPath(); ctx.arc(26, -4, 9, -1.4, 1.4); inkPath(ctx, 4); ctx.fillStyle = '#b07a3a'; ctx.fillRect(-22, -16, 42, 6);
  for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1; ctx.globalAlpha = a * Math.sin(ph * 3.14); ctx.beginPath(); ctx.moveTo(-10 + i * 10, -24 - ph * 30); ctx.quadraticCurveTo(-4 + i * 10, -34 - ph * 30, -10 + i * 10, -44 - ph * 30); inkPath(ctx, 3, '#bbb'); } ctx.globalAlpha = a; ctx.restore();
  ctx.save(); ctx.translate(0, 4); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-30, -18); ctx.lineTo(-6, -10); ctx.lineTo(-30, -6); ctx.fill(); ctx.beginPath(); ctx.moveTo(30, -18); ctx.lineTo(6, -10); ctx.lineTo(30, -6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-28, 14); ctx.quadraticCurveTo(-14, 4, 0, 12); ctx.quadraticCurveTo(14, 4, 28, 14); ctx.quadraticCurveTo(14, 22, 0, 16); ctx.quadraticCurveTo(-14, 22, -28, 14); ctx.fill(); ctx.restore();
  const gw = (globalThis.POTATO_GLITCH_WORDS || ['krrzzt', 'wh@t?!', 's0r—t@', 'bzz']); ctx.save(); ctx.translate(86, 2); ctx.font = `400 17px ${MONO}`; ctx.textAlign = 'center';
  for (let i = 0; i < 3; i++) { const w = gw[(Math.floor(t * 6) + i * 7) % gw.length] || 'krrzzt', jx = (rnd(i, Math.floor(t * 12)) - 0.5) * 10; ctx.fillStyle = [PURPLE, MAG, '#2a0f63'][i]; ctx.fillText(String(w).slice(0, 8), jx, -18 + i * 20); }
  ctx.restore(); ctx.restore(); }

// =========================== the ending: the basement door; with the bowl, his kitchen ===========================
let KCV = null, KCVT = -1;
function kitchenFrame(t, s) { if (!KCV) { KCV = document.createElement('canvas'); KCV.width = 1600; KCV.height = 900; }
  if (Math.abs(t - KCVT) > 1 / 30) { KCVT = t; const x = KCV.getContext('2d'); x.clearRect(0, 0, 1600, 900); try { BOO_STYLE.paintRoom(x, t, 1, {}, { x: -999, y: 707 }, { beat: (t - BO) / BP }); } catch (err) { x.fillStyle = '#2a1408'; x.fillRect(0, 0, 1600, 900); } }
  return KCV; }
function door(ctx, e) { const { t, s } = e; if (t < 246.5) return; const fy = e.floorY ?? 395, bowl = bowlOf(s), x = sx(e, 256.6, 1) + 20, w = 120, h = 210;
  if (x < -200 || x > W + 200) return;
  const open = t < OPEN ? 0 : bowl ? ease((t - OPEN) / 0.6) : t < 256.8 ? ease((t - OPEN) / 0.6) : 1 - ease((t - 256.8) / 0.35), light = bowl ? '#ff9a2b' : '#ffd9a0';
  ctx.save();
  if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2 - 22, fy - h - 26, w + 44, h + 26); } ctx.fillStyle = INK; ctx.fillRect(x - w / 2 - 18, fy - h - 22, w + 36, h + 22); ctx.fillStyle = '#3a2618'; ctx.fillRect(x - w / 2 - 14, fy - h - 18, w + 28, h + 18);
  ctx.fillStyle = open > 0 ? (bowl ? '#2a1205' : '#0a0604') : '#000000'; ctx.fillRect(x - w / 2, fy - h, w, h);
  if (open > 0) { glowS(ctx, x, fy - h / 2, 160 * open, light, 0.6 * open); ctx.fillStyle = rgba(light, 0.35 * open); ctx.fillRect(x - w / 2, fy - h, w, h);
    for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba(light, 0.5 * open); ctx.fillRect(x - w / 2 + 10 + i * 6, fy - 40 - i * 34, w - 20 - i * 12, 5); } }   // the stairs going down, lit
  // the door itself, swinging in
  const dw = w * (1 - 0.82 * open); ctx.fillStyle = '#4a2a1a'; ctx.fillRect(x - w / 2, fy - h, dw, h); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(x - w / 2, fy - h, dw, h);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w / 2 + dw * 0.8, fy - h, dw * 0.2, h);
  if (dw > 30) { ctx.fillStyle = '#e0b45a'; ctx.beginPath(); ctx.arc(x - w / 2 + dw - 16, fy - h / 2, 6, 0, 7); ctx.fill(); inkPath(ctx, 2.5); }
  // the line of light under it (always: it's the last light on)
  const lk = 0.6 + 0.3 * Math.sin(t * 2) + 0.2 * kickEnv(t); ctx.fillStyle = light; ctx.fillRect(x - w / 2, fy - 6, w, 6); glowS(ctx, x, fy - 3, 90, light, 0.5 * lk);
  ctx.restore();
  // RENT DUE slides out under the door (247.4 →)
  if (t >= 247.4 && t < 254) { const u = ease((t - 247.4) / 1.2); spr(ctx, 'rent-due', x - 30 - 120 * u, fy + 2, 46, { rot: -1.45 + 0.2 * u }); }
}

// =========================== story(ctx, e): the background, every frame ===========================
export function story(ctx, e) {
  const { t, s } = e, fy = e.floorY ?? 395, fk = frozenK(t);
  const moonK = t < FRIED0 ? 0 : t < FRIED1 + 0.5 ? clamp((t - FRIED0) / 1.8) : 1, inK = t >= INSIDE - 0.4 ? ease((t - INSIDE + 0.4) / 0.5) : 0, bowl = bowlOf(s);
  // the ending: his kitchen, frame swap on the cut (only with the bowl)
  if (bowl && t >= KITCHEN) { const K = kitchenFrame(t, s), sc = 0.66, ky = fy - 640 * sc; ctx.fillStyle = '#120804'; ctx.fillRect(0, 0, W, H); ctx.drawImage(K, 0, 0, 1600, 900, (W - 1600 * sc) / 2, ky, 1600 * sc, 900 * sc);
    if (t < KITCHEN + 0.25) { ctx.fillStyle = `rgba(255,180,90,${0.7 * (1 - (t - KITCHEN) / 0.25)})`; ctx.fillRect(0, 0, W, H); } return; }
  // the sky
  const g = ctx.createLinearGradient(0, 0, 0, fy); if (fk > 0.5) { g.addColorStop(0, '#f2f0ea'); g.addColorStop(1, '#dedbd2'); }
  else { g.addColorStop(0, mix('#060914', '#04060c', moonK)); g.addColorStop(0.75, mix('#141b2e', '#101a30', moonK)); g.addColorStop(1, mix('#3a2418', '#1a2638', moonK)); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (t < INSIDE + 0.2) {
    // the moon (a sticker: ink ring, no white one)
    const mx = 196, my = 88, kk = kickEnv(t); if (fk < 0.5) glowS(ctx, mx, my, 130 + 20 * kk, '#cfe6ff', 0.22 + 0.15 * moonK);
    if (OLD_WHITE) { ctx.beginPath(); ctx.arc(mx, my, 54, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); } ctx.beginPath(); ctx.arc(mx, my, 50, 0, 7); ctx.fillStyle = fk > 0.5 ? '#c9c5bb' : INK; ctx.fill();   // (the old white sticker ring only with ?border=, D-20261105-09; the glow stays)
    ctx.beginPath(); ctx.arc(mx, my, 46, 0, 7); ctx.fillStyle = fk > 0.5 ? '#ffffff' : '#f1ead2'; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.arc(mx + 18, my + 10, 46, 0, 7); ctx.fill(); ctx.restore();
    for (const [a, b, r] of [[-14, -8, 8], [12, 14, 6], [6, -18, 4]]) { ctx.beginPath(); ctx.arc(mx + a, my + b, r, 0, 7); ctx.fillStyle = fk > 0.5 ? '#eeeeee' : '#ddd4b8'; ctx.fill(); }
    dialog(ctx, t, s);
    const mk = t >= PRE ? (t < V3 ? ease((t - PRE) / 3) * 0.4 + 0.6 * clamp((t - V2) / (V3 - V2)) : 1) : 0;
    mansion(ctx, e, t < V3 ? mk * 0.35 : 0.35 + 0.65 * ease((t - V3) / 3.0), t < PRE ? 0 : Math.min(ease((t - PRE) / 2), 1 - inK));
    town(ctx, e, fk, moonK);
    // the street's pavement (behind the lane) + the road below
    ctx.fillStyle = fk > 0.5 ? '#d8d4ca' : mix('#1f1914', '#141820', moonK); ctx.fillRect(0, fy - 30, W, 30); ctx.fillStyle = fk > 0.5 ? '#9a968c' : INK; ctx.fillRect(0, fy - 31, W, 3);
  }
  inside(ctx, e, inK);
  ctx.fillStyle = fk > 0.5 ? '#c9c5bb' : inK > 0.5 ? '#1c120c' : mix('#16110d', '#0d1118', moonK); ctx.fillRect(0, fy, W, H - fy);
  // the background cast + their moments
  cast(ctx, e, moonK, inK > 0.5);
  threatDial(ctx, e); scanner(ctx, e);
  // OCT 31 on a street sign (verse 1 opens) and MONSTERS ONLY (the invitation, flying past at 164.72)
  if (span(t, 28, 38)) { const x = sx(e, 33.4, 0.85), y = fy - 30; if (x > -100 && x < W + 100) { ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x - 4, y - 150, 8, 150); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x - 4, y - 150, 8, 150); card(ctx, 'oct 31', x, y - 160, 20, '#ffffff', '#1f6b3a', -0.04); } }
  if (span(t, 164.72, 166.6)) { const u = (t - 164.72) / 1.9; card(ctx, 'monsters only', W + 120 - u * (W + 300), 150 + Math.sin(u * 6) * 30, 26, '#ffd9a0', '#3a0e0e', Math.sin(u * 9) * 0.3); }
  // the Ouija letters (BEWARE → LOL → WHO → SATAN), on the board's own card, and 3 FT on the stick
  if (span(t, 216.5, 226.5)) { const word = t < 220.69 ? 'beware' : t < 222.5 ? 'lol' : t < 224.5 ? 'who' : 'satan', x = 600, lol = s && s.sc && s.sc.lol;
    if (true) card(ctx, word === 'lol' && !lol ? 'l-o-?' : word, x, fy - 210, 22, '#2a1408', '#e7c98a', -0.03); }
  if (span(t, 228.5, 235.5)) { const x = sx(e, 233.0, 0.9); if (x > -60 && x < W + 60) card(ctx, '3 ft', x + 40, fy - 120, 16, '#ffffff', '#3a2618', 0.05); }
  sheet(ctx, e); bubble(ctx, e); door(ctx, e);
  // the room leans toward one door (camera only: the floor under him stays flat)
  if (t >= LEAN && t < DOOR) { /* (lean is drawn by tilting the portraits + the bulge: the world under him is flat — engine rule) */ }
  // the dark after the door shuts (no bowl): only the warm line under it
  if (!bowl && t >= 257.15) { const k = ease((t - 257.15) / 0.6); ctx.fillStyle = `rgba(0,0,0,${0.85 * k})`; ctx.fillRect(0, 0, W, H); const x = sx(e, 256.6, 1) + 20; ctx.fillStyle = '#ffd9a0'; ctx.fillRect(x - 60, fy - 6, 120, 6); glowS(ctx, x, fy - 3, 110, '#ffd9a0', 0.7 * k); }
  // moonlight over everything after the street goes dark; candlelight inside
  if (moonK > 0 && inK < 1 && fk < 0.5) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba('#9fb8dc', 0.35 * moonK * (1 - inK)); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // the frozen frame: everything flat white (only he moves)
  if (fk > 0 && fk < 1) { ctx.fillStyle = `rgba(255,255,255,${0.6 * fk})`; ctx.fillRect(0, 0, W, H); }
}

// =========================== booView: the cast on the course (3D) + the overlay ===========================
// what stands at each hazard: s = sprite (assets3d/boo/sprites, angle a), d = the level's own sticker drawing, h = height (world),
// y = its bottom above the floor (head height things float at 0.85+), w = width for drawings, z, rot, extra pieces
const ART = {
  pumpkin: { s: 'pumpkin', h: 0.62 }, 'pumpkin-plain': { s: 'pumpkin-plain', h: 0.55 }, 'candy-bowl': { s: 'candy-bowl', h: 0.42 },
  bowlout: { s: 'candy-bowl', a: '0', h: 0.4, y: 0.98, extra: [{ d: 'stubarm', h: 0.16, w: 0.9, y: 0.95, dx: 0.45 }] },
  cape: { d: 'cape', h: 0.8, w: 1.25, y: 0.86 },
  scanner: { d: 'scanner', h: 4.6, w: 0.9, y: -0.4, add: true }, dialog: { d: 'dialogwall', h: 2.5, w: 1.7, y: 0 },
  wire: { d: 'wire', h: 1.2, w: 3.4, y: 0.84, extra: [{ s: 'power-pole', a: '0', h: 3.0, dx: 1.7, z: -0.25 }, { s: 'power-pole', a: '0', h: 3.0, dx: -1.7, z: -0.25 }] },
  vampcape: { d: 'capewide', h: 2.6, w: 2.0, y: 0.0, extra: [{ s: 'vampire', a: '0', h: 2.2, z: 0.05 }] },
  'werewolf--lunge': { s: 'werewolf--lunge', h: 1.05, y: 0.86, rot: 0.12 }, 'witch--broom': { s: 'witch--broom', h: 1.2, y: 0.86 },
  'witch-broom': { s: 'witch-broom', a: '90', h: 0.3, w: 1.0 }, hex: { d: 'hex', h: 0.75, w: 0.9, y: 0.92 },
  wrap: { d: 'wrap', h: 0.32, w: 1.5, extra: [{ s: 'mummy--shamble', h: 1.8, dx: 1.2, z: -0.4 }] }, meter300: { d: 'meter300', h: 0.55, w: 0.7 },
  grave: { s: 'grave', h: 0.62 }, 'zombie--reach': { d: 'zarm', h: 0.36, w: 1.1, y: 1.05, extra: [{ s: 'zombie--reach', h: 1.85, dx: 0.75, z: -0.3 }] },
  lid: { s: 'zombie', a: '0', h: 2.4, y: 0 },
  ghostlow: { s: 'lonely-ghost', h: 0.62, bob: true }, ghosthigh: { s: 'lonely-ghost--sway-l', h: 0.8, y: 0.92, bob: true },
  cryptdoor: { d: 'cryptdoor', h: 0.75, w: 0.55, y: 0.9, spin: true },
  wrappers: { s: 'candy-wrapper', h: 0.3, extra: [{ s: 'candy-wrapper', h: 0.26, dx: 0.25, rot: 0.6 }, { s: 'candy-wrapper', h: 0.24, dx: -0.22, rot: -0.4 }] },
  ghostwall: { d: 'mist', h: 4.4, w: 1.1, y: -0.4, extra: [{ s: 'lonely-ghost', h: 0.95, y: 0.0 }, { s: 'lonely-ghost--sway-r', h: 0.95, y: 0.95 }, { s: 'lonely-ghost--sway-l', h: 0.95, y: 1.9 }] },
  door: { d: 'door', h: 1.8, w: 0.42, y: 0.84 }, raisincrate: { d: 'crate', h: 0.3, w: 0.6, extra: [{ s: 'raisin', h: 0.2, y: 0.28 }] },
  bar: { d: 'bar', h: 0.3, w: 0.95 }, spider: { s: 'spider', a: '0', h: 0.62, y: 0.95, thread: true }, legpile: { d: 'legs', h: 0.34, w: 0.85 },
  'spider--legs-off': { s: 'spider--legs-off', a: '35', h: 0.7, y: 0.95, thread: true }, 'black-cat': { s: 'black-cat', h: 0.62 }, trashcan: { d: 'can', h: 0.5, w: 0.62 },
  ladder: { d: 'ladder', h: 3.4, w: 1.5, y: -0.1 }, 'clown--jump': { s: 'clown--jump', h: 1.25, y: 0.86 }, shoe: { d: 'shoe', h: 0.3, w: 0.8 }, horn: { d: 'horn', h: 0.34, w: 0.6 },
  speaker: { d: 'speaker', h: 0.55, w: 0.5 }, bones: { d: 'bones', h: 0.32, w: 0.75 }, frankarm: { d: 'frankarm', h: 0.3, w: 0.85 },
  'pumpkin-head': { s: 'pumpkin-head', h: 0.5, roll: true }, horsearm: { d: 'sleeve', h: 0.42, w: 1.3, y: 1.0 },
  pot: { d: 'pot', h: 0.45, w: 0.6 }, potcup: { d: 'pot', h: 0.45, w: 0.6, extra: [{ s: 'mug-tea', h: 0.22, y: 0.42 }] }, pan: { d: 'pan', h: 1.5, w: 0.7, y: 0.86 },
  laptop: { s: 'laptop', h: 0.34, y: 0.06 }, filebox: { d: 'filebox', h: 0.45, w: 0.6 }, fileboxes: { d: 'fileboxes', h: 0.5, w: 1.0 },
  'ouija-board': { s: 'ouija-board', h: 0.36 }, planchette: { s: 'planchette', h: 0.42, y: 1.0, spin: true },
  doll: { s: 'doll', h: 0.62 }, 'doll--lunge': { s: 'doll--lunge', h: 0.68 }, stampdown: { d: 'stampdown', h: 1.5, w: 0.9, y: 0.86 },
  candle: { s: 'candle', h: 0.5, rot: 1.45, y: 0.22, roll: true }, portrait: { d: 'portrait', h: 0.9, w: 0.75, y: 0.9, swing: true },
};
// the level's own sticker drawings (ink + flat colour + one band; the old white border only with ?border=, D-20261105-09), painted once into textures
function stk(x, path, fill, lw = 5) { path(); x.lineJoin = 'round'; x.lineCap = 'round'; if (OLD_WHITE) { x.lineWidth = lw + 7; x.strokeStyle = '#ffffff'; x.stroke(); } x.fillStyle = fill; x.fill(); x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); }
const DRAW = {
  cape(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.05, h * 0.2); x.quadraticCurveTo(w * 0.5, -h * 0.05, w * 0.95, h * 0.2); for (let i = 0; i <= 5; i++) x.lineTo(w * (0.95 - i * 0.18), h * (i % 2 ? 0.7 : 0.92)); x.closePath(); }, '#16121c'); x.fillStyle = '#7a1a22'; x.fillRect(w * 0.3, h * 0.28, w * 0.4, h * 0.12); },
  stubarm(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.95, h * 0.2); x.quadraticCurveTo(w * 0.3, h * 0.1, w * 0.06, h * 0.5); x.quadraticCurveTo(w * 0.3, h * 0.9, w * 0.95, h * 0.8); x.closePath(); }, '#16121c'); },
  scanner(x, w, h) { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(127,240,255,0)'); g.addColorStop(0.5, 'rgba(127,240,255,.55)'); g.addColorStop(1, 'rgba(127,240,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 10) { x.fillStyle = 'rgba(220,255,255,.35)'; x.fillRect(w * 0.2, y, w * 0.6, 2); } },
  dialogwall(x, w, h) { if (OLD_WHITE) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); } x.fillStyle = INK; x.fillRect(5, 5, w - 10, h - 10); x.fillStyle = '#f4f2ec'; x.fillRect(11, 11, w - 22, h - 22); x.fillStyle = '#c9c5bb'; x.fillRect(11, 11, w - 22, 26);
    x.fillStyle = INK; x.font = `400 15px ${MONO}`; x.textBaseline = 'middle'; x.fillText('halloween.exe', 20, 25); x.font = `400 13px ${MONO}`; x.fillText('not responding', 20, 70);
    x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(20, h - 54, w - 40, 30); x.fillText('wait', w / 2 - 18, h - 39); x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(20, 92, w - 40, h - 160); },
  wire(x, w, h) { x.beginPath(); x.moveTo(0, h * 0.06); x.quadraticCurveTo(w / 2, h * 0.9, w, h * 0.06); if (OLD_WHITE) { x.lineWidth = 12; x.strokeStyle = '#ffffff'; x.stroke(); } x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.moveTo(0, h * 0.02); x.quadraticCurveTo(w / 2, h * 0.7, w, h * 0.02); if (OLD_WHITE) { x.lineWidth = 9; x.strokeStyle = '#ffffff'; x.stroke(); } x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); },
  capewide(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.5, h * 0.12); x.quadraticCurveTo(w * 0.02, h * 0.05, w * 0.03, h * 0.35); for (let i = 0; i <= 6; i++) x.lineTo(w * (0.03 + i * 0.157), h * (i % 2 ? 0.88 : 0.98)); x.quadraticCurveTo(w * 0.98, h * 0.05, w * 0.5, h * 0.12); x.closePath(); }, '#141018', 6);
    x.save(); x.beginPath(); x.moveTo(w * 0.5, h * 0.14); x.quadraticCurveTo(w * 0.12, h * 0.12, w * 0.1, h * 0.36); x.lineTo(w * 0.5, h * 0.9); x.closePath(); x.fillStyle = '#7a1a22'; x.fill(); x.restore(); },
  hex(x, w, h) { const cx = w / 2, cy = h / 2; stk(x, () => { x.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r = (i % 2 ? 0.32 : 0.46) * Math.min(w, h); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); }, SICK);
    x.fillStyle = '#4f8a1a'; x.beginPath(); x.arc(cx + 8, cy + 8, Math.min(w, h) * 0.2, 0, 7); x.fill(); x.fillStyle = '#e8ffd0'; x.beginPath(); x.arc(cx - 10, cy - 10, 7, 0, 7); x.fill(); },
  wrap(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(4, h * 0.7); for (let i = 0; i <= 8; i++) x.lineTo(w * i / 8, h * (0.45 + (i % 2) * 0.12)); x.lineTo(w - 4, h * 0.95); x.lineTo(4, h * 0.95); x.closePath(); }, '#e8e0c8');
    for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(w * i / 6, h * 0.5); x.lineTo(w * i / 6 - 14, h * 0.92); x.lineWidth = 2.5; x.strokeStyle = '#a89c80'; x.stroke(); } },
  meter300(x, w, h) { stk(x, () => { x.beginPath(); x.rect(8, 8, w - 16, h - 16); }, '#1a2a1a'); x.fillStyle = '#7dff9a'; x.font = `400 ${Math.round(h * 0.38)}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('300', w / 2, h / 2 + 2); },
  zarm(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.98, h * 0.25); x.quadraticCurveTo(w * 0.4, h * 0.1, w * 0.04, h * 0.5); x.quadraticCurveTo(w * 0.4, h * 0.95, w * 0.98, h * 0.78); x.closePath(); }, '#7cbf4a'); x.fillStyle = '#5a9a36'; x.fillRect(w * 0.3, h * 0.6, w * 0.6, h * 0.14); x.fillStyle = '#3b5f8a'; x.fillRect(w * 0.82, h * 0.2, w * 0.16, h * 0.62); },
  cryptdoor(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(8, h - 8); x.lineTo(8, h * 0.25); x.quadraticCurveTo(w / 2, 4, w - 8, h * 0.25); x.lineTo(w - 8, h - 8); x.closePath(); }, '#8a8c90'); x.fillStyle = '#6a6c70'; x.fillRect(w * 0.75, h * 0.25, w * 0.2, h * 0.7); x.fillStyle = INK; x.fillRect(w * 0.2, h * 0.55, 8, 8); },
  mist(x, w, h) { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(180,220,190,0)'); g.addColorStop(0.5, 'rgba(180,220,190,.4)'); g.addColorStop(1, 'rgba(180,220,190,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); },
  door(x, w, h) { stk(x, () => { x.beginPath(); x.rect(6, 6, w - 12, h - 12); }, '#6a3a22'); x.fillStyle = '#4e2a18'; x.fillRect(w * 0.7, 10, w * 0.24, h - 20); x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(w * 0.2, h * 0.08, w * 0.6, h * 0.36); x.strokeRect(w * 0.2, h * 0.52, w * 0.6, h * 0.36);
    x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(w * 0.22, h * 0.5, 7, 0, 7); x.fill(); x.stroke(); },
  crate(x, w, h) { stk(x, () => { x.beginPath(); x.rect(6, 6, w - 12, h - 12); }, '#a87a44'); x.fillStyle = '#8a5f30'; x.fillRect(w * 0.78, 8, w * 0.18, h - 16); for (const y of [0.4, 0.7]) { x.fillStyle = INK; x.fillRect(8, h * y, w - 16, 3); } },
  bar(x, w, h) { stk(x, () => { x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 8); }, '#6a3a1e'); x.fillStyle = '#e8463a'; x.fillRect(w * 0.3, 8, w * 0.4, h - 16); x.fillStyle = '#ffffff'; x.font = `400 ${Math.round(h * 0.3)}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('full', w / 2, h / 2 + 1); },
  legs(x, w, h) { for (let i = 0; i < 8; i++) { const a = w * (0.1 + i * 0.1), b = h * (0.3 + rnd(i, 2) * 0.5); x.beginPath(); x.moveTo(a, h * 0.92); x.quadraticCurveTo(a + 18, b - 20, a + 30 - rnd(i, 4) * 50, b); x.lineCap = 'round'; if (OLD_WHITE) { x.lineWidth = 15; x.strokeStyle = '#ffffff'; x.stroke(); } x.lineWidth = 9; x.strokeStyle = INK; x.stroke(); x.lineWidth = 4; x.strokeStyle = '#2a2a2a'; x.stroke(); } },
  can(x, w, h) { stk(x, () => { x.beginPath(); x.ellipse(w * 0.5, h * 0.5, w * 0.42, h * 0.36, 0.25, 0, 7); }, '#7a8088'); for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(w * (0.15 + i * 0.18), h * 0.2); x.lineTo(w * (0.1 + i * 0.18), h * 0.82); x.lineWidth = 3; x.strokeStyle = '#4a5058'; x.stroke(); } x.fillStyle = '#1c1c1c'; x.beginPath(); x.ellipse(w * 0.86, h * 0.56, w * 0.07, h * 0.3, 0.25, 0, 7); x.fill(); },
  ladder(x, w, h) { x.save(); x.translate(w * 0.5, h * 0.5); x.rotate(-0.32); const L = h * 0.9, R = w * 0.16; for (const sxx of [-R, R]) { x.beginPath(); x.rect(sxx - 9, -L / 2, 18, L); if (OLD_WHITE) { x.lineWidth = 14; x.strokeStyle = '#ffffff'; x.stroke(); } x.fillStyle = '#b8823e'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
    for (let y = -L / 2 + 30; y < L / 2 - 10; y += 44) { x.beginPath(); x.rect(-R, y, 2 * R, 10); x.fillStyle = '#c8924a'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); } x.restore(); },
  shoe(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.08, h * 0.9); x.lineTo(w * 0.08, h * 0.35); x.quadraticCurveTo(w * 0.3, h * 0.12, w * 0.5, h * 0.4); x.quadraticCurveTo(w * 0.98, h * 0.3, w * 0.94, h * 0.9); x.closePath(); }, '#e8463a'); x.fillStyle = '#ffd84a'; x.fillRect(w * 0.15, h * 0.75, w * 0.75, h * 0.12); },
  horn(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.05, h * 0.55); x.lineTo(w * 0.6, h * 0.45); x.lineTo(w * 0.95, h * 0.12); x.lineTo(w * 0.95, h * 0.9); x.lineTo(w * 0.6, h * 0.62); x.closePath(); }, '#ffd84a');
    x.beginPath(); x.arc(w * 0.12, h * 0.55, h * 0.26, 0, 7); x.fillStyle = '#e8463a'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); },
  speaker(x, w, h) { stk(x, () => { x.beginPath(); x.rect(6, 6, w - 12, h - 12); }, '#24262a'); for (const [cy, r] of [[0.32, 0.18], [0.72, 0.26]]) { x.beginPath(); x.arc(w / 2, h * cy, w * r, 0, 7); x.fillStyle = '#3a3e44'; x.fill(); x.lineWidth = 3; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(w / 2, h * cy, w * r * 0.4, 0, 7); x.fillStyle = '#ff8a2b'; x.fill(); } },
  bones(x, w, h) { for (let i = 0; i < 4; i++) { x.save(); x.translate(w * (0.2 + i * 0.2), h * (0.6 + (i % 2) * 0.15)); x.rotate((rnd(i, 3) - 0.5) * 1.2); stk(x, () => { x.beginPath(); x.roundRect(-w * 0.12, -5, w * 0.24, 10, 5); }, BONE, 3); x.restore(); }
    stk(x, () => { x.beginPath(); x.arc(w * 0.82, h * 0.42, h * 0.3, 0, 7); }, BONE, 4); x.fillStyle = INK; x.beginPath(); x.arc(w * 0.78, h * 0.4, 4, 0, 7); x.arc(w * 0.87, h * 0.4, 4, 0, 7); x.fill(); },
  frankarm(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.05, h * 0.2); x.lineTo(w * 0.7, h * 0.25); x.quadraticCurveTo(w * 0.98, h * 0.55, w * 0.7, h * 0.85); x.lineTo(w * 0.05, h * 0.85); x.closePath(); }, '#7aa860'); x.fillStyle = '#2a2a2a'; x.fillRect(w * 0.05, h * 0.18, w * 0.22, h * 0.7);
    for (let i = 0; i < 3; i++) { x.fillStyle = '#c9ced6'; x.fillRect(w * (0.35 + i * 0.1), h * 0.48, 6, 10); } },
  sleeve(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.98, h * 0.1); x.lineTo(w * 0.25, h * 0.3); x.quadraticCurveTo(w * 0.03, h * 0.5, w * 0.25, h * 0.7); x.lineTo(w * 0.98, h * 0.9); x.closePath(); }, '#1a1418'); x.fillStyle = '#5a1a22'; x.fillRect(w * 0.6, h * 0.25, w * 0.12, h * 0.55); },
  pot(x, w, h) { stk(x, () => { x.beginPath(); x.moveTo(w * 0.12, h * 0.3); x.lineTo(w * 0.88, h * 0.3); x.quadraticCurveTo(w * 0.9, h * 0.92, w * 0.5, h * 0.92); x.quadraticCurveTo(w * 0.1, h * 0.92, w * 0.12, h * 0.3); x.closePath(); }, '#3a3e44');
    x.fillStyle = '#2a2d32'; x.fillRect(w * 0.66, h * 0.32, w * 0.2, h * 0.5); x.lineWidth = 6; x.strokeStyle = INK; x.beginPath(); x.moveTo(w * 0.06, h * 0.3); x.lineTo(w * 0.94, h * 0.3); x.stroke(); },
  pan(x, w, h) { x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h * 0.45); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
    stk(x, () => { x.beginPath(); x.ellipse(w / 2, h * 0.72, w * 0.42, h * 0.2, 0, 0, 7); }, '#2a2d32'); x.fillStyle = '#4a4e56'; x.beginPath(); x.ellipse(w / 2 - 6, h * 0.7, w * 0.26, h * 0.12, 0, 0, 7); x.fill();
    stk(x, () => { x.beginPath(); x.roundRect(w * 0.44, h * 0.38, w * 0.12, h * 0.16, 4); }, '#5a3a22', 3); },
  filebox(x, w, h) { stk(x, () => { x.beginPath(); x.rect(6, 6, w - 12, h - 12); }, '#e0cfa8'); x.fillStyle = '#c4b28a'; x.fillRect(w * 0.78, 8, w * 0.18, h - 16); x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(w * 0.3, h * 0.35, w * 0.4, h * 0.2); },
  fileboxes(x, w, h) { for (const [bx, by, r] of [[0.28, 0.6, -0.2], [0.68, 0.62, 0.3], [0.5, 0.25, 0.1]]) { x.save(); x.translate(w * bx, h * by); x.rotate(r); stk(x, () => { x.beginPath(); x.rect(-w * 0.2, -h * 0.22, w * 0.4, h * 0.42); }, '#e0cfa8', 4); x.restore(); } },
  stampdown(x, w, h) { x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h * 0.3); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
    stk(x, () => { x.beginPath(); x.roundRect(w * 0.38, h * 0.28, w * 0.24, h * 0.36, 10); }, '#6a3a1e'); stk(x, () => { x.beginPath(); x.rect(w * 0.1, h * 0.64, w * 0.8, h * 0.2); }, '#b8261a');
    x.fillStyle = '#ffffff'; x.font = `400 ${Math.round(h * 0.07)}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('deductible', w / 2, h * 0.745); },
  portrait(x, w, h) { stk(x, () => { x.beginPath(); x.rect(8, 8, w - 16, h - 16); }, '#9a7a2a'); x.fillStyle = '#1d2a24'; x.fillRect(w * 0.18, h * 0.14, w * 0.64, h * 0.72); x.fillStyle = '#c9c2b0'; x.beginPath(); x.ellipse(w / 2, h * 0.42, w * 0.14, h * 0.14, 0, 0, 7); x.fill(); x.fillStyle = '#2a2a2a'; x.fillRect(w * 0.3, h * 0.58, w * 0.4, h * 0.28); },
};
export function booView({ T, world, C }) {
  XF = C.X;
  const TL = new T.TextureLoader(), TEX = new Map(), DTEX = new Map();
  const sprTex = (n, a = '35') => { const k = n + '-' + a; let r = TEX.get(k); if (!r) { r = { tex: null, aspect: 1, ok: false, waiting: [] }; TEX.set(k, r);
    r.tex = TL.load(SPR + k + '.webp', tx => { r.aspect = tx.image.width / tx.image.height; r.ok = true; for (const f of r.waiting) f(); r.waiting.length = 0; }); r.tex.colorSpace = T.NoColorSpace; } return r; };
  const drawTex = (d, w, h) => { const k = d + w + 'x' + h; let tx = DTEX.get(k); if (!tx) { const cv = document.createElement('canvas'); cv.width = Math.max(16, Math.round(w * 110)); cv.height = Math.max(16, Math.round(h * 110));
    DRAW[d](cv.getContext('2d'), cv.width, cv.height); tx = new T.CanvasTexture(cv); tx.colorSpace = T.NoColorSpace; DTEX.set(k, tx); } return tx; };
  const plane = (map, w, h, add) => { const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, ...(add ? { blending: T.AdditiveBlending } : {}) })); m.scale.set(w, h, 1); return m; };
  // one piece (a sprite or a drawing) → a mesh whose bottom centre is at the group's origin
  function piece(p) { const g = new T.Group(); let m;
    if (p.d) { m = plane(drawTex(p.d, p.w || p.h, p.h), p.w || p.h, p.h, p.add); m.position.y = p.h / 2; }
    else { const r = sprTex(p.s, p.a || '35'); m = plane(r.tex, p.h, p.h); const fit = () => { m.scale.x = p.h * r.aspect * (p.flip ? -1 : 1); }; if (r.ok) fit(); else r.waiting.push(fit); m.position.y = p.h / 2; }
    m.renderOrder = 3; g.add(m); g.position.set(p.dx || 0, p.y || 0, p.z || 0); if (p.rot) g.rotation.z = p.rot; g.userData.m = m; return g; }
  // the lane: one group per hazard, built when it comes near, dropped when far behind
  const lane = (CO ? CO.lane : []).map(L => { const h = C.hazards.find(z => z.kind === 'word' && Math.abs(z.t - L.t) < 1e-6); return { L, h, x: h ? (h.x0 + h.x1) / 2 : C.X(L.t) + L.w / 2, g: null }; });
  function build(it) { const A = ART[it.L.art] || { s: 'pumpkin', h: 0.6 }, g = new T.Group(), main = piece(A); g.add(main); g.userData.main = main; g.userData.A = A;
    if (A.thread) { const th = new T.Mesh(new T.PlaneGeometry(0.03, 4), new T.MeshBasicMaterial({ color: '#d8dde6', transparent: true, opacity: 0.8, depthWrite: false })); th.position.set(0, (A.y || 0) + A.h * 0.8 + 2, -0.01); g.add(th); }
    for (const p of A.extra || []) g.add(piece(p));
    g.position.set(it.x, it.L.gy, it.L.k === 'wall' ? 0.15 : 0.1); world.add(g); it.g = g; }
  // THE HOOP: TAKE ONE's O in his lane (its ring turned toward us: back half behind him, front half in front), a placard + the bowl
  const hoopT = CO ? CO.HOOPT : 135, HX = C.X(hoopT), hoop = new T.Group(), RING = 0.78, HY = 1.95;
  { const halfGeo = (r, tube) => new T.TorusGeometry(r, tube, 10, 40, Math.PI);
    for (const [side, z] of [[1, -0.05], [-1, 0.05]]) { const hg = new T.Group(); hg.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      const ink = new T.Mesh(halfGeo(RING, 0.11), new T.MeshBasicMaterial({ color: INK, side: T.BackSide })); const col = new T.Mesh(halfGeo(RING, 0.075), new T.MeshBasicMaterial({ color: ORANGE }));
      const band = new T.Mesh(halfGeo(RING, 0.078), new T.MeshBasicMaterial({ color: '#c4521a', transparent: true, opacity: 0.0 })); hg.add(ink, col, band); hg.userData.z = z; hoop.add(hg); }
    hoop.rotation.y = 0.72; hoop.position.set(HX, HY, 0); world.add(hoop);
    const post = piece({ d: 'crate', h: HY - RING, w: 0.14 }); post.position.set(HX + 0.02, 0, -0.35); world.add(post);
    const plc = new T.Mesh(new T.PlaneGeometry(1.0, 0.36), new T.MeshBasicMaterial({ map: (() => { const cv = document.createElement('canvas'); cv.width = 220; cv.height = 80; const x = cv.getContext('2d');
      if (OLD_WHITE) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, 220, 80); } x.fillStyle = INK; x.fillRect(4, 4, 212, 72); x.fillStyle = '#f4efe6'; x.fillRect(9, 9, 202, 62); x.fillStyle = INK; x.font = `400 30px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('take one', 110, 42);
      const tx = new T.CanvasTexture(cv); tx.colorSpace = T.NoColorSpace; return tx; })(), transparent: true, depthWrite: false })); plc.position.set(HX + 0.75, HY + RING + 0.12, -0.3); plc.renderOrder = 3; world.add(plc);
    hoop.userData.plc = plc; hoop.userData.post = post; }
  const standBowl = piece({ s: 'candy-bowl', a: '0', h: 0.36 }); standBowl.position.set(HX, HY - 0.25, -0.02); world.add(standBowl);
  // the bowl on his head (taken through the O: upside down, a hat; the secret's HUD)
  const hat = piece({ s: 'candy-bowl', a: '0', h: 0.34 }); hat.userData.m.scale.y *= -1; hat.visible = false; world.add(hat);
  // the background jack-o-lanterns that turn to watch him (pre-chorus) + the blank figure: real GLBs, loaded lazily (sprites until then)
  const PUMPS = [86.6, 88.6, 90.8, 92.6].map((ta, i) => { const g = new T.Group(); g.add(piece({ s: 'pumpkin', a: '0', h: 0.7 })); g.position.set(C.X(ta), 0, -1.1 - (i % 2) * 0.4); g.visible = false; world.add(g); return { g, glb: null, ta }; });
  const anat = new T.Group(); anat.add(piece({ s: 'anatomy-figure', a: '0', h: 1.3 })); anat.visible = false; world.add(anat);
  let PD = null, glbAsked = false;
  const askGLB = () => { if (glbAsked) return; glbAsked = true;
    import(new URL('../../assets3d/playdough.mjs', import.meta.url).href).then(async m => { PD = m;
      const fit = (grp, h) => { const bb = new T.Box3().setFromObject(grp), sz = bb.getSize(new T.Vector3()); const k = h / Math.max(0.01, sz.y); grp.scale.setScalar(k); return grp; };
      try { const a = (await PD.loadGLB(new URL('../../assets3d/boo/anatomy-figure.glb', import.meta.url).href)).group; fit(a, 1.3); anat.clear(); anat.add(a); } catch (err) { console.warn('boo glb', err); }
      try { const p = (await PD.loadGLB(new URL('../../assets3d/boo/pumpkin.glb', import.meta.url).href)).group; fit(p, 0.7);
        for (const P of PUMPS) { const c = p.clone(true); P.g.clear(); P.g.add(c); P.glb = c; } } catch (err) { console.warn('boo glb', err); } }).catch(err => console.warn('playdough', err)); };
  let SFXo = null; import('../../play/sfx.mjs').then(m => { SFXo = m.SFX; }).catch(() => {});
  const tint = new T.Color(), WHITE = new T.Color('#ffffff'), MOONT = new T.Color('#b8c8ec'), CANDLE = new T.Color('#ffe2c0');
  let ticks = -1, lastT = -1;
  return {
    draw(f) { const { t, s } = f; const kk = kickEnv(t);
      if (t > 60 && !glbAsked) askGLB(); if (t < 60 && !glbAsked && t > 2) askGLB();
      // light on the cast: moonlit after SYSTEM FRIED, candlelit inside
      tint.copy(WHITE); if (t >= FRIED0 && t < INSIDE) tint.lerp(MOONT, clamp((t - FRIED0) / 1.5)); if (t >= INSIDE) tint.copy(CANDLE);
      for (const it of lane) {
        const near = it.x > s.x - 6 && it.x < s.x + f.span + 3;
        if (near && !it.g) build(it); if (!near && it.g) { world.remove(it.g); it.g = null; } if (!it.g) continue;
        const g = it.g, A = g.userData.A, h = it.h, gone = h && ((s.cuts && s.cuts[h.i] != null && t >= s.cuts[h.i]) || (h.soft && s.bumped && s.bumped[h.i] != null && t >= s.bumped[h.i]));
        // deleted / broken round him: it tumbles away and fades (purple only if HIS glitch did it)
        if (gone) { const t0 = s.cuts && s.cuts[h.i] != null ? s.cuts[h.i] : s.bumped[h.i], u = clamp((t - t0) / 0.5); g.scale.setScalar(1 - 0.6 * u); g.rotation.z = u * 2; g.position.y = it.L.gy + u * 1.5; g.traverse(o => { if (o.material) o.material.opacity = 1 - u; }); continue; }
        // squash on the kick (the beat is visible on the thing you're about to hop)
        g.userData.main.scale.set(1 + 0.04 * kk, 1 - 0.06 * kk, 1);
        if (A.bob) g.position.y = it.L.gy + Math.sin(t * 3 + it.x) * 0.06;
        if (A.spin) g.userData.main.rotation.z = Math.sin(t * 6 + it.x) * 0.5;
        if (A.roll) { const dx = it.x - s.x; g.userData.main.rotation.z = dx * 1.2; }
        if (A.swing) g.rotation.z = Math.sin(t * 4) * 0.15;
        g.traverse(o => { if (o.material && o.material.color && !o.material.blending) o.material.color.copy(tint); });
      }
      // the hoop: visible from 130 to 137 (its tell: the O is in his lane 2 s ahead); the bowl leaves the stand when he takes it
      const hv = t > 129 && t < 138; hoop.visible = hoop.userData.plc.visible = hoop.userData.post.visible = hv; standBowl.visible = hv && !(s.bowl && t >= s.bowl);
      for (const hg of hoop.children) hg.position.z = 0; hoop.scale.setScalar(1 + 0.03 * kk);
      // the bowl on his head (the secret's HUD), from the hoop to the end; gone with a death (a fresh run)
      hat.visible = !!(s.bowl && t >= s.bowl) && !(C.def.hideAt && C.def.hideAt(t, s));
      if (hat.visible) { const u = clamp((t - s.bowl) / 0.35); hat.position.set(s.x + (1 - u) * 0.4, s.y + (s.ducking ? 0.72 : 1.24) + (1 - u) * 0.6, 0.6); hat.rotation.z = (1 - u) * 2.5 + Math.sin(t * 5) * 0.04; }
      // the jack-o-lanterns turn to track him (84.4 → 93.7): attention you can read
      for (const P of PUMPS) { P.g.visible = t > 84.0 && t < 94.5; if (!P.g.visible) continue; const dx = s.x - P.g.position.x, want = t >= 88.02 ? Math.atan2(dx, 3) : 0.2; P.g.rotation.y += (want - P.g.rotation.y) * 0.15; P.g.scale.y = 1 - 0.05 * kk; }
      // ANATOMY NOT INSTALLED: the blank figure stands where he is, for a beat and a half (frame swap, no crossfade)
      anat.visible = t >= ANAT0 && t < ANAT1; if (anat.visible) anat.position.set(s.x, s.y, 0.2);
      if (SFXo && t > lastT && t - lastT < 0.2) { if (lastT < hoopT && t >= hoopT && s.bowl) SFXo.coin && SFXo.coin(); }
      lastT = t; },
    over(ctx, f) {
      const { t, s, project } = f, me = project(s.x, s.y + 0.62), top = project(s.x, s.y + 1.22);
      // the lid (80 → 84): the zombie lifts his top off — dark inside, far down one warm dot (the kitchen) — LOSE. slams it
      if (span(t, LID0, LOSE + 0.25)) { const up = t < LOSE ? ease((t - LID0) / 0.7) : 1 - ease((t - LOSE) / 0.12), r = Math.abs(top.x - me.x) + 34;
        ctx.save(); ctx.translate(top.x, top.y + 6); ctx.beginPath(); ctx.ellipse(0, 0, 34, 10, 0, 0, 7); ctx.fillStyle = '#05030a'; ctx.globalAlpha = up; ctx.fill();
        const dot = 0.6 + 0.4 * Math.sin(t * 3); ctx.fillStyle = '#ffcf73'; ctx.beginPath(); ctx.arc(4, 1, 2.2, 0, 7); ctx.fill(); glowS(ctx, 4, 1, 10, '#ffb04a', 0.6 * dot * up);
        ctx.globalAlpha = 1; ctx.translate(14 * up, -46 * up); ctx.rotate(0.5 * up); ctx.beginPath(); ctx.ellipse(0, 0, 38, 16, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#da9643'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
        ctx.fillStyle = 'rgba(120,70,20,.5)'; ctx.beginPath(); ctx.ellipse(-12, -6, 5, 3, 0, 0, 7); ctx.fill(); ctx.restore(); void r;
        if (t >= LOSE && t < LOSE + 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = PURPLE; ctx.globalAlpha = 1 - (t - LOSE) / 0.2; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(top.x, top.y, 30 + 200 * (t - LOSE), 0, 7); ctx.stroke(); ctx.restore(); } }
      // DELETE!: his wipe rolls out from him and takes the ghosts (purple: it's his)
      if (s.deleted != null && span(t, s.deleted, s.deleted + 0.9)) { const u = (t - s.deleted) / 0.9; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { const x = me.x + u * 620 - i * 24; ctx.fillStyle = [PURPLE, MAG, '#2a0f63'][i]; ctx.globalAlpha = (1 - u) * 0.55; ctx.fillRect(x, 40 + i * 6, 14, H - 120); }
        ctx.restore(); }
      // the cue ring (the album's one shared move): his purple closes on him in three ticks; the hit is the fourth beat
      for (const q of (CO ? CO.cues : [])) { const a = q.t - 3 * BP; if (t < a - 0.05 || t > q.t + 0.25) continue; const n = Math.min(3, Math.floor((t - a) / BP) + 1), sub = ((t - a) / BP) % 1;
        const R = 150 - 33 * (n - 1) - 18 * ease(Math.min(1, sub * 3)) * (n < 3 ? 1 : 0.4), pop = Math.max(0, 1 - sub * 4), got = s.sc && s.sc.cue && Object.values(s.sc.cue).find(c => c && c.g !== 'MISS' && c.t != null && c.t >= a && c.t <= q.t + 0.31);
        ctx.save(); ctx.globalAlpha = t > q.t ? Math.max(0, 1 - (t - q.t) / 0.25) : 1; ctx.lineWidth = 7 + 4 * pop; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(me.x, me.y, t > q.t ? 52 : Math.max(52, R), 0, 7); ctx.stroke();
        ctx.lineWidth = 4 + 3 * pop; ctx.strokeStyle = got ? '#ffffff' : PURPLE; ctx.shadowColor = PURPLE; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;
        for (let i = 0; i < 3; i++) { const ang = -Math.PI / 2 + (i - 1) * 0.5; ctx.beginPath(); ctx.arc(me.x + Math.cos(ang) * (Math.max(52, R) + 14), me.y + Math.sin(ang) * (Math.max(52, R) + 14), 6, 0, 7); ctx.fillStyle = i < n ? MAG : INK; ctx.fill(); }
        ctx.restore();
        if (SFXo && t >= a && n !== ticks && t < q.t && t - lastT < 0.2) { ticks = n; SFXo.dlTick && SFXo.dlTick(); } }
      // the cue's verdict, in his glitch: a burst
      if (s.sc && s.sc.cue) for (const k in s.sc.cue) { const c = s.sc.cue[k]; if (!c || c.t == null || t - c.t < 0 || t - c.t > 0.6 || c.g === 'MISS' || c.d == null) continue; const u = (t - c.t) / 0.6;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = c.g === 'PERFECT' ? '#ffffff' : PURPLE; ctx.globalAlpha = 1 - u; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(me.x, me.y, 50 + 300 * u, 0, 7); ctx.stroke(); ctx.restore(); }
      // ANATOMY NOT INSTALLED (the town's scan result: world text, on the scanner's own card)
      if (span(t, ANAT0 - 0.1, ANAT1 + 0.4)) { const a = Math.min(ease((t - ANAT0 + 0.1) / 0.1), ease((ANAT1 + 0.4 - t) / 0.2)); card(ctx, 'error: anatomy not installed', me.x + 40, me.y - 120, 15, '#7ff0ff', '#0a1418', -0.04, { alpha: a }); }
      // the crack at the chorus's end (108.9 → 110.6): his own tear across him, purple (the section turn is his)
      if (span(t, 108.9, 110.62)) { const u = (t - 108.9) / 1.72; ctx.save(); ctx.strokeStyle = PURPLE; ctx.lineWidth = 4; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(me.x - 60, me.y - 40);
        for (let i = 1; i <= 6; i++) ctx.lineTo(me.x - 60 + i * 20 * u * 3, me.y - 40 + (rnd(i, 4) - 0.5) * 60); ctx.stroke(); ctx.restore(); }
      if (span(t, 110.62, 110.9)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 3 ? PURPLE : MAG; ctx.globalAlpha = 0.5 * (1 - (t - 110.62) / 0.28); ctx.fillRect(me.x - 120 + rnd(i, 2) * 40, me.y - 80 + i * 18, 240 + rnd(i, 3) * 80, 6); } ctx.restore(); }
      // the frozen frame: a thin white veil on the course too (only he moves)
      const fk = frozenK(t); if (fk > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${0.18 * fk})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      if (CO && t > CO.END - 0.32) { ctx.fillStyle = s.bowl ? '#ffb04a' : '#000000'; ctx.globalAlpha = clamp((t - (CO.END - 0.32)) / 0.25); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (typeof window !== 'undefined') window.__booScore = s.sc;
    },
  };
}

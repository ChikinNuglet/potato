// THURSDAY POTATO — the music video: minute one, the inside of his head booting (plan: game/stories/thursday-potato.md).
// ONE PLACE that fills up round him and never cuts away: black + a cursor → he's born out of his own glitch words → a boot bar →
// LOADED (the first falling binary) → wires carrying thought on the real kicks → verse 1's thought cards, fed by sparks thrown off
// him → compiled into POTATO in bulbs (chorus 1) → a tin keeps what he catches, glitched open = the space turns warm (verse 2) →
// the stage + spotlight → a crown → the bridge's blue-grey selection greys his name ("clearing cache... potato.exe? y/n") → "n." →
// the reboot → LOAD COMPLETE → black → everything lit gold for the first time → the rain parts, a door of light opens.
// Two parts: `story` paints the background (a 960x540 canvas behind the course); `thuView` (the level's modeView) paints the
// foreground (asides, the cue ring, letterbox bars, the blackout, the stage light, the dashed mascot/toy) and the 3D bits on the
// course (the boot wire, the holes, the edge colour). Both read the sim's s.sc (the level's score + events) so the player's
// run builds the picture: what you clear and catch is what lights his name.
// House style: ink #120a05 outlines, flat fills, one cel band; cold mind green #2bff88; warm #ffbf73 / cream #ffe6c2 after the
// tin; selection blue-grey. PURPLE ONLY FOR HIS GLITCH (his birth, his glitches flashing the wires + rain, the reboot beat).
// Lines in Potato's voice are DRAFTS for Chikin (marked DRAFT below; source: stories/words/POTATO-LINES.md).
import { W, H, clamp, ease, rnd, span, fade, glow, glitchText, stamp, lightSpud, glyph } from '../story.mjs';
import { BLANK_Q } from '../blank.mjs';   // (the clean-slate run: game/playthroughs/README.md)
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare

const INK = '#120a05', GREEN = '#2bff88', GREEN2 = '#7dff9a', WARM = '#ffbf73', CREAM = '#ffe6c2', GOLD = '#ffd84a', SEL = '#9bb4d6', SELD = '#4a6288',
  PURPLE = '#9a52ff', MAG = '#e03ccf', MONO = '"Major Mono Display", ui-monospace, monospace';
// ---- the song + the course (set by the level's build) ----
let WORDS = [], LINES = [], BP = 0.32683, BO = 0.097, KICKS = [], HATS = [], CO = null;
export function setSong(words, P, O, music) {
  WORDS = words.filter(w => w.t0 != null); BP = P; BO = O; KICKS = music && music.kick ? music.kick.slice() : []; HATS = music && music.hat ? music.hat.slice() : [];
  const by = new Map(); for (const w of WORDS) { const L = by.get(w.line) || { line: w.line, t0: w.t0, t1: w.t1 }; L.t0 = Math.min(L.t0, w.t0); L.t1 = Math.max(L.t1, w.t1); by.set(w.line, L); }
  LINES = [...by.values()].sort((a, b) => a.t0 - b.t0);
}
export function setCourse(info) { CO = info; }
const GLOWC = new Map();
function glowS(ctx, x, y, r, color, a = 1) {   // story.mjs's glow, from a cached sprite (20–30 a frame here)
  if (a <= 0.004 || r <= 0) return; let c = GLOWC.get(color);
  if (!c) { if (GLOWC.size > 48) GLOWC.clear(); c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); GLOWC.set(color, c); }
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(c, x - r, y - r, r * 2, r * 2); ctx.restore();
}
const lastIdx = (A, t) => { let lo = 0, hi = A.length; while (lo < hi) { const m = (lo + hi) >> 1; if (A[m] <= t) lo = m + 1; else hi = m; } return lo - 1; };
const kicksIn = (a, b) => { const out = []; for (let i = lastIdx(KICKS, b); i >= 0 && KICKS[i] > a; i--) out.push(KICKS[i]); return out; };
const kickEnv = t => { const i = lastIdx(KICKS, t); return i < 0 ? 0 : Math.exp(-(t - KICKS[i]) / 0.11); };
// ---- shared between the background and the foreground (one frame behind is fine) ----
let PROJ = null, CUR_T = 0;
const evs = s => (s && s.sc && s.sc.ev) || [];
// the song's moments (the doc's times, checked against the kicks)
const LOADED = 10.46, YEAH = 19.48, SLAM1 = 41.77, TIN_IN = 56.02, STAGE_HIT = 62.65, CROWN = 71.6, SEL0 = 72.0, FLOOR_GONE = 75.3, SPARK = 80.22,
  REBOOT = 80.62, RING = 80.92, SLAM2 = 83.51, COMPLETE = 92.65, SLOW = 95.75, BLACK = 98.7, SLAM3 = 99.16, PART = 103.09, DOOR = 104.1;
const BLACKOUTS = [[46.34, 46.8], [88.06, 88.5]], SNAPS = [50.3, 92.0];
// THE ENDING (Chikin's beat: Thursday ends with what Potato knows, a kitchen where he can cook — his agent side; then he's in the 404
// and wants out). After LOAD COMPLETE his kitchen builds round him, one piece on each big outro hit (Chikin's taps), black, the slam
// lights it and he dances; then each big hit pulls the camera back (def.zoomAt): the kitchen is one small lit room in the dark
// 404, and the door of light opens out in the dark. The kitchen pictures are the game's own kitchen (play/sprites/thu-kitchen-*).
const KSTEP = [[94.66, '02'], [95.87, '04'], [97.20, '06'], [98.10, '08'], [98.36, '09'], [99.16, '10']], KIT0 = KSTEP[0][0];
const PULL = [[99.81, 0.7], [101.05, 0.48], [102.33, 0.34]];
export const zoomAt = t => { if (BLANK_Q) return 1; let z = 1;   /* (?blank: no pull-back — it was the last cutscene's camera) */ for (const [a, v] of PULL) { if (t < a) break; const from = z; z = v; const u = ease((t - a) / 0.32); if (u < 1) return from + (v - from) * u; } return z; };
const KIT = {}; let KIT_BASE = null;
function loadKitchen(base) { if (KIT_BASE === base) return; KIT_BASE = base; for (const [, n] of KSTEP) { const i = new Image(); i.src = base + `sprites/thu-kitchen-${n}.webp`; KIT[n] = i; } }
function kitchen(ctx, e) {   // (the background: the room, in the shrinking frame the camera's pull-back leaves)
  const { t } = e; if (t < KIT0) return; let n = null, at = 0; for (const [a, k] of KSTEP) if (t >= a) { n = k; at = a; }
  const img = KIT[n]; if (!img || !img.complete || !img.naturalWidth) return; const z = zoomAt(t), fy = e.floorY ?? 395;
  if (z < 1) { ctx.fillStyle = '#020104'; ctx.fillRect(0, 0, W, H); }
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  const ih = H * 1.0, iw = ih * 16 / 9, y0 = fy - 0.855 * ih; ctx.globalAlpha = t < KIT0 + 0.2 ? ease((t - KIT0) / 0.2) : 1; ctx.drawImage(img, (W - iw) / 2, y0, iw, ih); ctx.globalAlpha = 1;
  if (t - at < 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * (1 - (t - at) / 0.3); ctx.fillStyle = n === '10' ? GOLD : CREAM; ctx.fillRect(0, 0, W, H); ctx.restore(); }   // each piece slams in
  ctx.restore();
}
function void404(ctx, t) {   // (the foreground: the dark 404 round the shrinking room — it covers the floor strip out there too)
  const z = zoomAt(t); if (z >= 0.999) return; const w = W * z, h = H * z, x0 = (W - w) / 2, y0 = (H - h) / 2, k = clamp((1 - z) / 0.3);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(x0, y0, w, h); ctx.fillStyle = '#020104'; ctx.fill('evenodd'); ctx.clip('evenodd');
  ctx.font = `400 22px ${MONO}`; ctx.textAlign = 'center'; for (let i = 0; i < 34; i++) { ctx.globalAlpha = k * (0.35 + 0.35 * rnd(i, 7)); ctx.fillStyle = i % 3 ? '#2a0f63' : '#5a3a9a'; ctx.fillText(i % 4 ? '404' : 'not found', rnd(i, 21) * W, 24 + rnd(i, 22) * (H - 30)); }
  ctx.restore(); ctx.save(); glowS(ctx, W / 2, H / 2, w * 0.75, WARM, 0.18 * k);
  if (OLD_WHITE) { ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(x0 - 5, y0 - 5, w + 10, h + 10); } ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.strokeRect(x0 - 3, y0 - 3, w + 6, h + 6); ctx.restore();
}
// colour moods
const warmK = t => t < TIN_IN ? 0 : ease((t - TIN_IN) / 0.5);
const selK = t => t < SEL0 ? 0 : t < REBOOT ? ease((t - SEL0) / 1.2) : t < RING ? 1 : Math.max(0, 1 - (t - RING) / 0.6);
const purpleK = (t, s) => { let k = span(t, REBOOT, REBOOT + BP) ? 1 : 0; if (s && s.glitchAt != null && t - s.glitchAt >= 0 && t - s.glitchAt < 0.15) k = Math.max(k, 1 - (t - s.glitchAt) / 0.15); return k; };
const mixHex = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join(''); };
const moodCol = (t, s, near) => { let c = near ? GREEN : mixHex(GREEN, WARM, warmK(t)); c = mixHex(c, SEL, selK(t) * 0.85); if (t >= SLAM3) c = mixHex(c, GOLD, ease((t - SLAM3) / 0.25)); return mixHex(c, PURPLE, purpleK(t, s)); };

// =========================== the falling binary: three layers of depth, pre-rendered columns ===========================
const RAIN_PAL = [GREEN, WARM, GOLD, SEL, PURPLE], RAIN_L = [{ fs: 10, n: 64, len: 16, v: 60, a: 0.38 }, { fs: 14, n: 40, len: 13, v: 110, a: 0.6 }, { fs: 21, n: 24, len: 10, v: 190, a: 0.85 }];
let RAINC = null;
function rainCols() {
  if (RAINC) return RAINC; RAINC = {};
  for (const col of RAIN_PAL) for (let L = 0; L < 3; L++) { const { fs, len } = RAIN_L[L], arr = [];
    for (let v = 0; v < 4; v++) { const c = document.createElement('canvas'); c.width = fs + 4; c.height = len * fs; const x = c.getContext('2d');
      x.font = `700 ${fs}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'top';
      for (let r = 0; r < len; r++) { const k = (r + 1) / len, head = r === len - 1; x.globalAlpha = head ? 1 : 0.08 + 0.75 * k * k;
        x.fillStyle = head ? '#f4fff8' : col; if (head) { x.shadowColor = col; x.shadowBlur = fs * 0.8; } x.fillText(rnd(r, v * 7 + L + col.length) < 0.5 ? '0' : '1', (fs + 4) / 2, r * fs); x.shadowBlur = 0; }
      arr.push(c); }
    RAINC[col + L] = arr; }
  return RAINC;
}
function rain(ctx, t, s, M) {
  const R = rainCols(), loud = M ? M.loud(t) : 0.5, kk = kickEnv(t);
  const on = [t >= LOADED ? ease((t - LOADED) / 0.4) : 0, t >= 28.0 ? ease((t - 28.0) / 1.2) : 0, t >= SLAM1 ? ease((t - SLAM1) / 0.3) : 0];
  let dark = 1; for (const [a, b] of BLACKOUTS) if (span(t, a, b)) dark = 0; if (span(t, BLACK, SLAM3)) dark = 0;
  const slow = t >= SLOW && t < SLAM3 ? 0.35 : 1, partK = t >= PART ? ease((t - PART) / 0.9) : 0, doorX = doorPos().x;
  for (let L = 0; L < 3; L++) { if (on[L] <= 0.01 || dark <= 0) continue; const P = RAIN_L[L];
    const pk = purpleK(t, s), cols = pk > 0.5 ? R[PURPLE + L] : t >= SLAM3 && (L === 2 || true) ? R[GOLD + L] : selK(t) > 0.5 ? R[SEL + L] : (L < 2 && warmK(t) > 0.5) ? R[WARM + L] : R[GREEN + L];
    const step = W / P.n, chH = P.len * P.fs, cyc = H + chH;
    ctx.globalAlpha = P.a * on[L] * (0.75 + 0.25 * loud + 0.35 * kk) * (t >= SLOW && t < BLACK ? 0.6 : 1) * (L === 2 && t < SLAM3 ? 1 - 0.4 * warmK(t) : L < 2 ? 1 + 0.35 * warmK(t) * (1 - selK(t)) : 1);   // (warm: the far layers lead; the near rain held back, quieter, until the end)
    for (let i = 0; i < P.n; i++) { const sp = P.v * (0.7 + 0.6 * rnd(i, L + 1)) * slow, off = rnd(i, L + 9) * cyc;
      let x = i * step + rnd(i, L + 4) * step * 0.6, y = ((t * sp + off) % cyc) - chH;
      if (partK > 0) { const d = x - doorX, side = d < 0 ? -1 : 1; x += side * partK * Math.max(0, 230 - Math.abs(d)) * 0.9; }
      ctx.drawImage(cols[Math.floor(t * 3 + rnd(i, L)) % 4], x, y); } }
  ctx.globalAlpha = 1;
}

// =========================== the wires: inked, carrying pulses of thought on the kicks ===========================
// a wire: from him to a point in the sky; born at t0 (it grows out of him), aims at fn(t)
const CARD_POS = [[430, 222], [570, 222], [710, 222], [850, 222], [500, 300], [640, 300], [780, 300]];
const NX0 = 372, NP = 12, NY0 = 172, LET = 'POTATO';
const letterC = i => [NX0 + i * 7 * NP + 2 * NP, NY0 + 3 * NP];
const TINP = [790, 330];
function wireList() {
  const L = []; L.push({ t0: LOADED, to: t => [990, 330 - 40 * Math.sin(t * 0.3)] });
  for (let i = 0; i < 7; i++) { const ln = LINES[i]; if (!ln) break; L.push({ t0: ln.t0, card: i, to: t => { const c = CARD_POS[i], k = compileK(t); if (k <= 0) return c; const l = letterC(Math.min(5, i)); return [c[0] + (l[0] - c[0]) * k, c[1] + (l[1] - c[1]) * k]; } }); }
  L.push({ t0: 51.1, t1: 56.6, to: () => TINP });
  L.push({ t0: 60.75, t1: 66.4, to: () => { const p = PROJ && CO ? PROJ(stageX() + 1.2, CO.yAt(63.74 + 0.45) + 0.4) : { x: 800, y: 330 }; return [p.x, p.y]; } });
  return L;
}
let WIRES = null;
const compileK = t => t < 38.1 ? 0 : ease((t - 38.1) / 2.9);
const BZ = [0, 0];
function bez(a, b, u) { const c1x = a[0] + 70, c1y = a[1] - 150, c2x = b[0] - 140, c2y = b[1] + 60, v = 1 - u;   // (one scratch point: ~200 a frame)
  BZ[0] = v * v * v * a[0] + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * b[0]; BZ[1] = v * v * v * a[1] + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * b[1]; return BZ; }
function wires(ctx, e, from) {
  const { t, s } = e; if (t < LOADED) return; WIRES = WIRES || wireList();
  let dark = false; for (const [a, b] of BLACKOUTS) if (span(t, a, b)) dark = true; if (span(t, BLACK, SLAM3) || dark) return;
  const col = moodCol(t, s, false), hum = t >= SLOW && t < SLAM3 ? 0.45 : 1, fast = t >= 60.75 && t < STAGE_HIT;
  const pulses = kicksIn(t - (fast ? 0.35 : 0.75), t);
  for (const Wr of WIRES) { if (t < Wr.t0 || (Wr.t1 && t > Wr.t1)) continue; const grow = ease((t - Wr.t0) / 0.45), out = Wr.t1 ? clamp((Wr.t1 - t) / 0.4) : 1, B = Wr.to(t);
    ctx.save(); ctx.globalAlpha = out * hum; ctx.lineCap = 'round';
    ctx.beginPath(); for (let k = 0; k <= 18; k++) { const p = bez(from, B, k / 18 * grow); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = out * hum * 0.75; ctx.stroke(); ctx.restore();
    if (grow < 1) continue;
    for (const k of pulses) { const u = (t - k) / (fast ? 0.35 : 0.75); if (u < 0 || u > 1) continue; const p = bez(from, B, u); glowS(ctx, p[0], p[1], 16, col, 0.9 * out * hum); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = out * hum; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
    if (span(t, YEAH, YEAH + 0.8)) { const u = (t - YEAH) / 0.8, p = bez(from, B, u); glowS(ctx, p[0], p[1], 30, CREAM, 1 - u); } }
}

// =========================== his name in bulbs (and the crown), the 404 dots ===========================
// POTATO IN BULBS IS OFF (Chikin: "no more of that token potato word on screen, that space should tell the story"; Nov 5 "Yes",
// D-20261105-28): the letters aren't drawn, and the crown is off too (Chikin: "The crown is an asset from a previous story"). ?namesign shows the old word for comparison.
const OLD_WIRES = (() => { try { return new URLSearchParams(location.search).has('wires'); } catch (e) { return false; } })();
const OLD_NAME = (() => { try { return new URLSearchParams(location.search).has('namesign'); } catch (e) { return false; } })();
const GLYPH = { P: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'], O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'], A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  4: ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'], 0: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'] };
const BULBS = []; [...LET].forEach((ch, li) => GLYPH[ch].forEach((row, r) => [...row].forEach((v, c) => { if (v === 'X') BULBS.push({ x: NX0 + (li * 7 + c) * NP, y: NY0 + r * NP, li, r, rank: rnd(BULBS.length, 77) }); })));
const CROWNB = []; { const cx = letterC(2)[0] + 3.5 * NP, by = NY0 - 16, pts = [[-44, 0], [-34, -26], [-16, -8], [0, -34], [16, -8], [34, -26], [44, 0]];
  for (let i = 0; i + 1 < pts.length; i++) for (let k = 0; k < 3; k++) { const u = k / 3; CROWNB.push({ x: cx + pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y: by + pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u }); }
  CROWNB.push({ x: cx + 44, y: by }); for (let k = 1; k < 8; k++) CROWNB.push({ x: cx - 44 + k * 11, y: by + 4 }); }
const DOT404 = []; '404'.split('').forEach((c, ci) => GLYPH[c].forEach((row, r) => [...row].forEach((v, k) => { if (v === 'X') DOT404.push({ dx: (ci * 6 + k - 8) * 26, dy: (r - 3) * 26, ch: ci }); })));
let BULBC = null;
function bulbSprites() { if (BULBC) return BULBC; BULBC = {};
  for (const [k, col] of [['g', '#b8ffd2'], ['w', '#ffd49a'], ['y', GOLD], ['s', SEL], ['p', PURPLE]]) { const c = document.createElement('canvas'); c.width = c.height = 34; const x = c.getContext('2d');
    const g = x.createRadialGradient(17, 17, 2, 17, 17, 17); g.addColorStop(0, col); g.addColorStop(0.4, col + 'cc'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, 34, 34);
    x.beginPath(); x.arc(17, 17, 5.6, 0, 7); x.fillStyle = col; x.fill(); x.lineWidth = 2; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(15.5, 15.5, 2.2, 0, 7); x.fillStyle = '#ffffff'; x.fill(); BULBC[k] = c; }
  const c = document.createElement('canvas'); c.width = c.height = 14; const x = c.getContext('2d'); x.beginPath(); x.arc(7, 7, 4.4, 0, 7); x.fillStyle = '#0b1610'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#26402f'; x.stroke(); BULBC.off = c;
  return BULBC; }
// which letters the stairs relit (in order of the stair landings he made) and when
function stairRelit(s) { const out = []; for (const e of evs(s)) if (e.k === 'clear' && e.what === 'up' && e.tw > 74.3 && e.tw < 77.6 && out.length < 4) out.push(e.t); return out; }
function nameState(t, s) {
  const sc = s && s.sc; const f = sc ? sc.name || 0 : 0.5, cue = sc && sc.cue && sc.cue[1], late = cue && cue.g !== 'MISS' ? 0 : BP;
  const selX = t < SEL0 ? 2000 : t < FLOOR_GONE ? 960 - (960 - NX0 + 40) * ease((t - SEL0) / (FLOOR_GONE - SEL0 - 0.6)) : NX0 - 40;
  const relit = stairRelit(s), back = [82.15, 82.15, 82.25, 82.25, 82.6].map(x => x + late);
  const letterOn = li => { if (t < SEL0 || t >= SLAM2 + late) return 1; if (li < 4 && relit[li] != null && t >= relit[li]) return 1; if (t >= RING + late && li >= 4 && t >= back[li]) return 1; if (t >= RING + late && li < 4) return 1;
    const lx = NX0 + li * 7 * NP; return selX > lx + 5 * NP ? 1 : 0; };
  return { f, selX, letterOn, crownOn: t >= CROWN && (t < SEL0 + 0.25 || t >= back[4]) };
}
function nameSign(ctx, e) {
  const { t, s } = e; if (t < 41.0) return; const B = bulbSprites(), N = nameState(t, s), wk = warmK(t);
  let dark = false; for (const [a, b] of BLACKOUTS) if (span(t, a, b)) dark = true; if (span(t, BLACK, SLAM3)) dark = true;
  const lit0 = t < SLAM1 ? 0 : 1, flare = Math.max(span(t, 42.34, 42.97) ? 1 - (t - 42.34) / 0.63 : 0, span(t, 84.06, 84.71) ? 1 - (t - 84.06) / 0.65 : 0, span(t, SLAM2, SLAM2 + 0.5) ? 1 - (t - SLAM2) / 0.5 : 0);
  const appear = clamp((t - 41.02) / 0.4), kk = kickEnv(t), jumpRow = s && s.thJ != null && t - s.thJ < 0.25 && t > 42.97 ? Math.floor(rnd(Math.round(s.thJ * 100), 3) * 7) : -1;
  const pk = purpleK(t, s) * (span(t, REBOOT, REBOOT + BP) ? 1 : 0), sprite = pk > 0.5 ? B.p : t >= SLAM3 ? B.y : wk > 0.5 ? B.w : B.g;
  const wallNear = CO && CO.items.some(it => it.k === 'wall' && it.tw > t - 0.25 && it.tw < t + 1.3), dimW = wallNear ? 0.7 : 1;   // a wall crossing the sign: the sign steps back
  ctx.save(); if (dark) ctx.globalAlpha = 0.18;
  if (OLD_NAME) for (const b of BULBS) { const on = lit0 && b.rank < N.f && N.letterOn(b.li), selected = !N.letterOn(b.li);
    ctx.globalAlpha = (dark ? 0.18 : 1) * appear; ctx.drawImage(B.off, b.x - 7, b.y - 7); if (!on && !selected && lit0) { ctx.globalAlpha = 0.28 * appear * (dark ? 0.3 : 1); ctx.drawImage(sprite, b.x - 9, b.y - 9, 18, 18); }   // an unlit bulb: the glass still shows the letter
    if (on) { ctx.globalAlpha = dimW * (dark ? 0.25 : 1) * (0.78 + 0.22 * kk + 0.5 * flare + (b.r === jumpRow ? 0.6 : 0)); const sz = 34 + 16 * flare; ctx.drawImage(sprite, b.x - sz / 2, b.y - sz / 2, sz, sz); }
    else if (selected && lit0 && b.rank < N.f) { ctx.globalAlpha = 0.7; ctx.drawImage(B.s, b.x - 11, b.y - 11, 22, 22); } }
  if (OLD_NAME && N.crownOn) for (const c of CROWNB) { ctx.globalAlpha = dark ? 0.2 : 0.9 + 0.1 * kk; ctx.drawImage(t >= SLAM3 ? B.y : B.w, c.x - 13, c.y - 13, 26, 26); }
  else if (OLD_NAME && t >= CROWN && t < SLAM2 + 1) for (const c of CROWNB) { ctx.globalAlpha = 0.6; ctx.drawImage(B.s, c.x - 9, c.y - 9, 18, 18); }
  ctx.restore();
  if (t >= SLAM1 && t < SLAM1 + 0.5) glowS(ctx, letterC(2)[0] + 40, NY0 + 40, 380, wk > 0.5 ? WARM : '#d8ffe8', 0.6 * (1 - (t - SLAM1) / 0.5));
}

// =========================== verse 1's thought cards, the compile swirl ===========================
function cardFill(s, i) { const L0 = LINES[i], L1 = LINES[i + 1]; if (!L0) return 0; const a = L0.t0 - 0.2, b = L1 ? L1.t0 - 0.2 : 38.1; let n = 0;
  for (const e of evs(s)) if (e.t >= a && e.t < b && (e.k === 'clear' || e.k === 'spark')) n++; return clamp(n / 2.5); }
function cards(ctx, e) {
  const { t, s } = e; if (t < 19.9 || t > 41.6) return; const ck = compileK(t), kk = kickEnv(t);
  for (let i = 0; i < 7; i++) { const L = LINES[i]; if (!L || t < L.t0) continue; const born = ease((t - L.t0) / 0.35), fill = cardFill(s, i), solid = fill >= 0.99;
    let [x, y] = CARD_POS[i];
    if (ck > 0) { const a = i / 7 * Math.PI * 2 + (t - 38.1) * (1.6 + ck * 3), r = 260 * (1 - ck) + 30, cx = letterC(2)[0] + 40, cy = NY0 + 40; x = x + (cx + Math.cos(a) * r - x) * ease(ck * 1.6); y = y + (cy + Math.sin(a) * r * 0.45 - y) * ease(ck * 1.6); }
    const fadeOut = t > 41.02 ? 1 - clamp((t - 41.02) / 0.5) : 1, w = 128 * (1 - 0.5 * ck), h = 60 * (1 - 0.5 * ck);
    ctx.save(); ctx.translate(x, y); ctx.rotate((rnd(i, 2) - 0.5) * 0.12); ctx.globalAlpha = born * fadeOut * (t > 46.34 && t < 46.8 ? 0 : 1);
    if (solid && OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10, 12); ctx.fill(); }   // (the old sticker border once it's loaded: only with ?border=, D-20261105-09)
    if (!solid) { ctx.setLineDash([7, 6]); ctx.translate((rnd(i, Math.floor(t * 10)) - 0.5) * 6 * (1 - fill), 0); }   // still loading: dashed + jittery
    ctx.fillStyle = solid ? '#0b2418' : 'rgba(11,36,24,.45)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 9); ctx.fill();
    ctx.lineWidth = solid ? 5 : 3; ctx.strokeStyle = solid ? INK : GREEN2; ctx.stroke(); ctx.setLineDash([]);
    if (solid) { ctx.fillStyle = '#1f5236'; ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h * 0.22); ctx.lineWidth = 2; ctx.strokeStyle = GREEN; ctx.beginPath(); ctx.roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 7); ctx.stroke(); }
    cardIcon(ctx, i, 0, -4, (h - 22) / 34, solid ? CREAM : GREEN2, solid ? 1 : 0.5 + 0.3 * kk, solid ? 0 : (rnd(i, Math.floor(t * 12)) - 0.5) * 4 * (1 - fill));
    ctx.fillStyle = INK; ctx.fillRect(-w / 2 + 8, h / 2 - 12, w - 16, 6); ctx.fillStyle = solid ? CREAM : GREEN; ctx.fillRect(-w / 2 + 8, h / 2 - 12, (w - 16) * fill, 6);   // its fill bar
    ctx.restore(); }
  if (OLD_NAME && span(t, 41.02, 41.77)) { const B = bulbSprites(); for (const b of BULBS) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 30 + b.rank * 9); ctx.drawImage(B.g, b.x - 8, b.y - 8, 16, 16); } ctx.globalAlpha = 1; }   // six dim letters on "Potato"
}

// one picture per verse-1 line, flat + inked: loud · star · bite · Thursday · no strings (the key) · the track · held tight
function cardIcon(ctx, i, x, y, k, col, a, jit) {
  ctx.save(); ctx.translate(x + jit, y); ctx.scale(k, k); ctx.globalAlpha *= a; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ink = (w = 5) => { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.stroke(); }, fill = () => { ctx.fillStyle = col; ctx.fill(); };
  if (i === 0) { ctx.beginPath(); ctx.moveTo(-26, -7); ctx.lineTo(-16, -7); ctx.lineTo(-4, -16); ctx.lineTo(-4, 16); ctx.lineTo(-16, 7); ctx.lineTo(-26, 7); ctx.closePath(); ink(7); fill();   // loud: a speaker + waves
    for (const r of [10, 19]) { ctx.beginPath(); ctx.arc(-2, 0, r, -0.8, 0.8); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); } }
  else if (i === 1) { ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 7 : 17, an = -Math.PI / 2 + j * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ink(7); fill(); }   // star
  else if (i === 2) { ctx.beginPath(); ctx.arc(0, 0, 16, 0.9, Math.PI * 2 - 0.25); for (const [bx, by] of [[14, -4], [10, 2], [14, 8]]) ctx.lineTo(bx, by); ctx.closePath(); ink(7); fill(); }   // the bite (a round thing, bitten)
  else if (i === 3) { ctx.beginPath(); ctx.rect(-17, -15, 34, 31); ink(7); fill(); ctx.fillStyle = INK; ctx.fillRect(-17, -15, 34, 9); ctx.font = `400 13px ${MONO}`; ctx.textAlign = 'center'; ctx.fillText('THU', 0, 11); }   // Thursday: a calendar page
  else if (i === 4) { ctx.beginPath(); ctx.arc(-11, -8, 8, 0, 7); ctx.moveTo(-3, 0); ctx.arc(-11, 8, 8, 0, 7); ink(7); fill(); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(14, 0); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke();   // not your toy: a wind-up key, crossed out
    ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(20, 18); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = MAG === col ? CREAM : '#ff7a5c'; ctx.lineWidth = 4; ctx.stroke(); }
  else if (i === 5) { ctx.beginPath(); ctx.ellipse(-7, 11, 8, 6, -0.4, 0, 7); ink(7); fill(); ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -16); ctx.lineTo(13, -10); ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); }   // the track: a note
  else { ctx.beginPath(); ctx.ellipse(0, -2, 17, 12, 0, 0, 7); ink(7); fill(); for (const [cx, cy, r] of [[-10, 15, 4], [-15, 21, 2.5]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ink(4); fill(); }   // a thought, held: a bubble with a knot
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(7, -2); ctx.moveTo(0, -8); ctx.lineTo(0, 4); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.restore();
}

// =========================== sparks thrown off him into whatever he's building ===========================
function sparkTarget(et) { if (et < 38.1) { let i = 0; for (let k = 0; k < 7; k++) if (LINES[k] && et >= LINES[k].t0 - 0.2) i = k; return CARD_POS[i]; }
  if (et >= 51.1 && et < 56.0) return TINP; const b = BULBS[Math.floor(rnd(et * 100, 5) * BULBS.length)]; return [b.x, b.y]; }
function thrown(ctx, e, from) {
  const { t, s } = e; const E = evs(s); let n = 0;
  for (let i = E.length - 1; i >= 0 && n < 14; i--) { const v = E[i]; if (t - v.t > 0.7) break; if (t < v.t || !(v.k === 'clear' || v.k === 'spark' || v.k === 'bonus' || v.k === 'padfire')) continue; n++;
    const u = (t - v.t) / 0.7, B = sparkTarget(v.t), mid = [(from[0] + B[0]) / 2, Math.min(from[1], B[1]) - 120], p = [(1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mid[0] + u * u * B[0], (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * mid[1] + u * u * B[1]];
    const col = v.k === 'bonus' || v.k === 'padfire' ? GOLD : warmK(v.t) > 0.5 ? CREAM : '#d8ffe8'; glowS(ctx, p[0], p[1], 18, col, 0.9 * (1 - u * 0.4)); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 7); ctx.fill();
    if (u > 0.85) glowS(ctx, B[0], B[1], 40, col, (u - 0.85) / 0.15 * 0.6); }
}

// =========================== the tin (verse 2): it keeps what he catches, drops onto the course ===========================
function tin(ctx, e) {
  const { t, s } = e; if (t < 51.1 || t > 54.95) return; let n = 0; for (const v of evs(s)) if (v.t >= 51.1 && v.t < 56 && (v.k === 'clear' || v.k === 'spark')) n++;
  const form = ease((t - 51.1) / 0.5), drop = t > 54.6 ? ease((t - 54.6) / 0.35) : 0, x = TINP[0] + drop * 40, y = TINP[1] + drop * drop * 220, r = 52 * form;
  ctx.save(); ctx.translate(x, y); ctx.rotate(drop * 0.6);
  ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.roundRect(-r, -r * 0.8, r * 2, r * 1.7, 10); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#4a2f12'; ctx.fillRect(-r + 4, -r * 0.8 + 4, r * 2 - 8, r * 0.35);   // cel band
  ctx.strokeStyle = WARM; ctx.lineWidth = 2; for (const k of [0.15, 0.55]) { ctx.beginPath(); ctx.moveTo(-r + 5, r * k); ctx.lineTo(r - 5, r * k); ctx.stroke(); }
  const full = clamp(n / 6); ctx.fillStyle = CREAM; ctx.globalAlpha = 0.7; ctx.fillRect(-r + 8, r * 0.85 - r * 1.5 * full, r * 2 - 16, r * 1.5 * full); ctx.globalAlpha = 1;   // what it keeps, glowing through
  ctx.fillStyle = CREAM; ctx.fillRect(-r + 2, -r * 0.1, r * 2 - 4, r * 0.62); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(-r + 2, -r * 0.1, r * 2 - 4, r * 0.62);   // its paper label
  ctx.fillStyle = INK; ctx.font = `400 ${Math.max(8, r * 0.3)}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('stories', 0, r * 0.21); ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = WARM; ctx.beginPath(); ctx.roundRect(-r - 5, -r * 0.8 - 12, r * 2 + 10, 14, 5); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();   // the amber lid
  ctx.restore(); glowS(ctx, x, y, 70, WARM, 0.25 + 0.2 * kickEnv(t));
}

// =========================== the door of light (the ending) ===========================
let DOOR_X = 300; const doorPos = () => ({ x: DOOR_X, y: 395 });
function door(ctx, e) {
  const { t } = e; if (t < PART - 2) DOOR_X = e.px + 70; if (t < PART) return; const D = doorPos(), fy = e.floorY ?? D.y, kk = kickEnv(t);
  const seam = ease((t - PART) / 0.4), open = t >= DOOR ? ease((t - DOOR) / 0.5) : 0, DW = 100, h = 230 * seam, x0 = D.x - DW / 2, x1 = D.x + DW / 2, top = fy - h;
  glowS(ctx, D.x, fy - h / 2, 140 + 140 * open + 70 * kk * open, CREAM, 0.35 + 0.5 * open + 0.2 * kk * open);
  ctx.save(); ctx.fillStyle = '#fff8ea'; ctx.shadowColor = CREAM; ctx.shadowBlur = 30 + 30 * kk; ctx.fillRect(x0, top, DW, h); ctx.restore();   // the light behind it
  // the panel: hinged on its left edge, swings toward us (its far edge sweeps left, foreshortened), closed = a dark slab with light round its edges
  const sw = Math.cos(open * Math.PI * 0.46), px = x0 + DW * sw, bulge = 22 * Math.sin(open * Math.PI * 0.46);
  ctx.save(); ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(px - (open > 0 ? 2 * bulge : 0), top - bulge); ctx.lineTo(px - (open > 0 ? 2 * bulge : 0), fy + bulge * 0.4); ctx.lineTo(x0, fy); ctx.closePath();
  ctx.fillStyle = '#2a1a0a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  if (sw > 0.25) { ctx.fillStyle = '#4a2f12'; ctx.fillRect(x0 + 6, top + 8, Math.max(0, (px - x0) * 0.86 - 6), 14); ctx.beginPath(); ctx.arc(x0 + (px - x0) * 0.82, fy - h * 0.48, 5, 0, 7); ctx.fillStyle = WARM; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }   // cel band + knob
  ctx.restore();
  ctx.save(); if (OLD_WHITE) { ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(x0 - 6, top - 6, DW + 12, h + 6); } ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeRect(x0 - 6, top - 6, DW + 12, h + 6); ctx.restore();   // the frame: ink + sticker border
  if (open > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.18 + 0.3 * kk) * open; ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(x0, fy); ctx.lineTo(x1, fy); ctx.lineTo(x1 + 260, H); ctx.lineTo(x0 - 260, H); ctx.fill(); ctx.restore(); }   // its light on the floor
}

// =========================== the birth (0–4.4): a cursor, the 404's 0, his glitch words swirl into his outline ===========================
function birth(ctx, e) {
  const { t, px, py } = e; if (t > 5.2) return; const cx = px, cy = py + 18, GW = (globalThis.POTATO_GLITCH_WORDS || ['krrzzt', 'wh@t?!', 's0r—t@', '01', 'hm']).filter(w => w.length <= 8 && !/\s/.test(w));
  if (t < 4.4) { const k404 = 0.22 * fade(t, 0, 4.4, 0.5, 0.2);
    for (const d of DOT404) { if (d.ch !== 1 && t > 0.6) continue; const brk = d.ch === 1 ? clamp((t - 1.3) / 2.2) : 0; if (rnd(d.dx, d.dy) < brk) continue;
      ctx.fillStyle = d.ch === 1 ? GREEN : '#1d5a3a'; ctx.globalAlpha = k404 * (d.ch === 1 ? 1 : 1 - t / 0.6); ctx.beginPath(); ctx.arc(cx + d.dx - (d.ch === 1 ? 0 : 0), cy - 40 + d.dy, 6, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (Math.floor(t * 2.4) % 2 === 0) { ctx.fillStyle = GREEN; ctx.fillRect(cx + 70, cy + 40, 18, 4); }   // the cursor
    const k = clamp((t - 1.3) / 3.0);                                                                       // his glitch words swirl in
    for (let i = 0; i < 26 && k > 0; i++) { const st = rnd(i, 3) * 0.5; const u = clamp((k - st) / (1 - st)); if (u <= 0) continue; const a = rnd(i, 4) * 6.28 + u * 5, r = 260 * (1 - u) + 30;
      const w = GW[Math.floor(rnd(i, 5) * GW.length)] || '01'; ctx.save(); ctx.globalAlpha = 0.85 * (u < 0.95 ? 1 : (1 - u) * 20); ctx.font = `400 ${14 + rnd(i, 6) * 10}px ${MONO}`; ctx.textAlign = 'center';
      ctx.fillStyle = i % 5 === 0 ? GREEN2 : i % 2 ? PURPLE : MAG; ctx.fillText(i % 5 === 0 ? (rnd(i, Math.floor(t * 10)) < 0.5 ? '0' : '1') : w, cx + Math.cos(a) * r, cy - 50 + Math.sin(a) * r * 0.6); ctx.restore(); }
    if (t > 2.6) lightSpud(ctx, cx, cy + 14, 128, PURPLE, 0.5 * clamp((t - 2.6) / 1.6) * (0.7 + 0.3 * Math.sin(t * 20)));   // his outline forming (light, no face)
  }
  if (span(t, 4.4, 5.2)) { const u = (t - 4.4) / 0.8; glowS(ctx, cx, cy - 50, 260 * (1 - u * 0.5), PURPLE, 0.8 * (1 - u)); glowS(ctx, cx, cy - 50, 120, '#ffffff', 0.7 * (1 - u)); }
}

// =========================== the boot bar + LOADED ===========================
// the teaching things (word time, kind): three soft in the boot, then a soft second try and the first real one of each
const TEACH = { low: [5.91, 11.78, 13.07], high: [7.21, 14.40, 15.71], wall: [8.52, 17.01, 18.31] }, TNAME = { low: 'legs', high: 'duck', wall: 'glitch' };
function teachRes(s, tw) {   // 'ok' (a real press got him past) · 'bump' (he broke it by walking into it) · null (not yet) — and when
  const E = evs(s), its = CO ? CO.items : [];
  for (const v of E) { if (v.k === 'clear' && Math.abs(v.tw - tw) < 1e-3) return { r: 'ok', t: v.t }; if (v.k === 'soft' && its[v.i] && Math.abs(its[v.i].tw - tw) < 1e-3) return { r: 'bump', t: v.t }; }
  return null; }
function moves(s) { const m = { hop: null, duck: null, glitch: null }; for (const [k, key] of [['low', 'hop'], ['high', 'duck'], ['wall', 'glitch']]) { const r = teachRes(s, TEACH[k][0]); if (r) m[key] = r.t; } return m; }
function bootBar(ctx, e) {
  const { t, s, px } = e, fy = e.floorY ?? 395; if (t < 4.4 || t > LOADED + 1.2) return;
  const m = moves(s), n = [m.hop, m.duck, m.glitch].filter(v => v != null && v <= t).length, fill = Math.min(0.99, Math.max(0.15 + 0.27 * n, 0.15 + 0.84 * clamp((t - 4.4) / 5.5)));
  const x = Math.max(18, px - 150), y = fy - 280, w = 210;
  if (t < LOADED) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.025);
    ctx.font = `400 22px ${MONO}`; ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.textAlign = 'left'; ctx.strokeText('potato.exe', 0, -12); ctx.fillStyle = GREEN2; ctx.fillText('potato.exe', 0, -12); ctx.textAlign = 'right'; ctx.strokeText(`${Math.floor(fill * 100)}%`, w, -12); ctx.fillText(`${Math.floor(fill * 100)}%`, w, -12);
    if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -6, w + 12, 30); } ctx.fillStyle = INK; ctx.fillRect(-3, -3, w + 6, 24); ctx.strokeStyle = GREEN; ctx.lineWidth = 2; ctx.strokeRect(0, 0, w, 18);
    const hang = t > 9.9; ctx.fillStyle = hang && Math.floor(t * 8) % 2 ? CREAM : GREEN; ctx.fillRect(2, 2, (w - 4) * fill, 14);
    for (let k = 1; k < 4; k++) { ctx.fillStyle = INK; ctx.fillRect(2 + (w - 4) * (0.15 + 0.27 * k) - 1, 2, 2, 14); }
    ctx.restore(); }
  else { const u = (t - LOADED) / 1.2, cue = s && s.sc && s.sc.cue && s.sc.cue[0], big = cue && cue.g !== 'MISS' ? 2 : 1;   // the bar shatters into the first falling binary
    ctx.save(); ctx.font = `700 ${14 + 4 * big}px ${MONO}`; ctx.textAlign = 'center';
    for (let i = 0; i < 40 * big; i++) { const a = rnd(i, 11) * 6.28, v = (90 + rnd(i, 12) * 260) * big, bx = x + rnd(i, 13) * w, by = y + 7 + Math.sin(a) * v * u * 0.6 + 380 * u * u;
      ctx.globalAlpha = 1 - u; ctx.fillStyle = rnd(i, 14) < 0.2 ? '#ffffff' : GREEN; ctx.fillText(rnd(i, 15) < 0.5 ? '0' : '1', bx + Math.cos(a) * v * u, by); }
    ctx.restore(); glowS(ctx, x + w / 2, y, 200 * big, GREEN, 0.6 * (1 - u)); }
}

// =========================== the story: back to front ===========================
export function story(ctx, e) {
  const { t, s } = e, M = e.music, fy = e.floorY ?? 395, from = [e.px - 34, e.py - 42], body = [e.px + 4, e.py + 10];   // (from: the little node of thought light behind his head the wires leave from)
  CUR_T = t;
  // the void
  const vg = ctx.createRadialGradient(W * 0.55, H * 0.45, 40, W * 0.55, H * 0.45, W * 0.75); const tint = moodCol(t, s, false);
  vg.addColorStop(0, mixHex('#020604', tint, t < LOADED ? 0.02 : 0.08 + 0.04 * kickEnv(t))); vg.addColorStop(1, '#010201'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  birth(ctx, e);
  rain(ctx, t, s, M);
  // the 404 dots fade up where his name was (the bridge)
  const sk = selK(t); if (sk > 0) { ctx.fillStyle = SEL; for (const d of DOT404) { ctx.globalAlpha = 0.16 * sk * (t < REBOOT ? 1 : clamp((RING + 0.4 - t) / 0.4)); ctx.beginPath(); ctx.arc(letterC(2)[0] + 40 + d.dx, NY0 + 40 + d.dy, 9, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  if (OLD_WIRES) wires(ctx, e, from);   // NO WIRES, NO BOXES out of his head (D-20261103-83; Chikin Nov 5: "The wires are supposed to be gone"); ?wires = the old look
  if (OLD_WIRES && t >= LOADED && !(span(t, BLACK, SLAM3) || BLACKOUTS.some(([a, b]) => span(t, a, b)))) { glowS(ctx, from[0], from[1], 22 + 10 * kickEnv(t), moodCol(t, s, false), 0.8); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(from[0], from[1], 3.5, 0, 7); ctx.fill(); }
  if (OLD_WIRES) cards(ctx, e);
  nameSign(ctx, e);
  tin(ctx, e);
  thrown(ctx, e, from);
  bootBar(ctx, e);
  // the selection (bridge): a blue-grey box sweeps across his name, then reaches under him (the floor goes)
  if (t >= SEL0 && t < RING + 0.7) { const N = nameState(t, s), burn = t >= RING ? clamp((t - RING) / 0.6) : 0, low = t >= FLOOR_GONE - 0.3 ? ease((t - FLOOR_GONE + 0.3) / 0.4) : 0;
    let x0 = Math.max(0, N.selX), x1 = 975; const y0 = NY0 - 52, y1 = NY0 + 110 + (H - NY0 - 110) * low;
    if (t > 79.6 && PROJ && CO) { const p = PROJ(CO.selX || 0, 0); if (p && p.x < x0) x0 = Math.max(e.px + 30, p.x); }
    ctx.save(); ctx.globalAlpha = (1 - burn) * 0.9; ctx.fillStyle = 'rgba(110,140,190,.22)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.setLineDash([12, 8]); ctx.lineDashOffset = -t * 40; ctx.lineWidth = 3; ctx.strokeStyle = '#dfe8f6'; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.setLineDash([]);
    ctx.fillStyle = '#dfe8f6'; ctx.fillRect(x0 - 5, (y0 + y1) / 2 - 5, 10, 10); ctx.restore();
    // the system prompt in the sky (system text, not Potato's voice) + his answer, typed by the glitch on "spark"
    if (t >= 72.6 && t < RING + 0.9) { const cue = s && s.sc && s.sc.cue && s.sc.cue[1], hit = cue && cue.g !== 'MISS' && cue.t <= t, ans = hit ? '> n.'.slice(0, 1 + Math.floor((t - cue.t) / 0.07)) : '';   // "> n." DRAFT (Potato)
      const msg = '> clearing cache... potato.exe? y/n', typed = msg.slice(0, Math.floor((t - 72.6) / 0.035)), PX = 262, PY = NY0 + 7 * NP + 64;
      ctx.save(); ctx.globalAlpha = 1 - burn; ctx.font = `400 19px ${MONO}`; ctx.textAlign = 'left'; const pw = ctx.measureText(msg).width + 28;
      if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(PX - 18, PY - 32, pw + 8, 86); } ctx.fillStyle = INK; ctx.fillRect(PX - 15, PY - 29, pw + 2, 80); ctx.fillStyle = '#0b1220'; ctx.fillRect(PX - 11, PY - 25, pw - 6, 72);   // its own screen (sticker border, ink)
      ctx.fillStyle = '#dfe8f6'; ctx.fillText(typed, PX, PY);
      if (ans) { ctx.font = `400 28px ${MONO}`; ctx.fillStyle = PURPLE; ctx.fillText(ans, PX, PY + 34); }
      else if (Math.floor(t * 2.6) % 2 === 0) { ctx.fillStyle = '#dfe8f6'; ctx.fillRect(PX, PY + 28, 16, 5); }
      ctx.restore(); } }
  // the reboot ring burns the selection away
  if (span(t, RING, RING + 0.9)) { const u = (t - RING) / 0.9, cue = s && s.sc && s.sc.cue && s.sc.cue[1], big = cue && cue.g !== 'MISS' ? 1 : 0.55;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = WARM; ctx.lineWidth = 18 * (1 - u) + 3; ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.arc(body[0], body[1], 40 + 1100 * u * big, 0, 7); ctx.stroke(); ctx.restore(); }
  kitchen(ctx, e);
  if (t < KIT0) door(ctx, e);
  // focus snaps on "crystal clear": a clean sweep
  for (const a of SNAPS) if (span(t, a, a + 0.5)) { const u = (t - a) / 0.5; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * (1 - u); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 0.8 * (1 - u); ctx.fillRect(0, H * u - 3, W, 6); ctx.restore(); }
  // "Yeah": every wire pulses out from him at once
  if (span(t, YEAH, YEAH + 0.7)) { const u = (t - YEAH) / 0.7; ctx.save(); ctx.strokeStyle = CREAM; ctx.globalAlpha = 0.8 * (1 - u); ctx.lineWidth = 6 * (1 - u) + 1; ctx.beginPath(); ctx.arc(body[0], body[1], 30 + 420 * u, 0, 7); ctx.stroke(); ctx.restore(); }
  if (span(t, BLACK, SLAM3)) { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); }
  if (span(t, SLAM3, SLAM3 + 0.6)) glowS(ctx, W / 2, H / 2, 700, GOLD, 0.7 * (1 - (t - SLAM3) / 0.6));
  void fy;
}

// =========================== the foreground (the level's modeView): asides, cue ring, bars, light, the course's own bits ===========================
// asides: one small terminal box beside him at a time, in calm stretches. DRAFT = Potato's voice (for Chikin: keep / cut / rewrite)
function asideAt(t, s) {
  const out = [];
  if (t >= 4.6 && t < LOADED) {   // the boot log (DRAFT, three lines max): it asks as each thing comes, then answers what he really did
    for (const k of ['low', 'high', 'wall']) { const tw = TEACH[k][0]; if (t < tw - 1.5 * BP) continue; const r = teachRes(s, tw), done = r && t >= r.t;
      out.push([`> ${TNAME[k]}${done ? (r.r === 'ok' ? (k === 'wall' ? '... ok. keep that one.' : '... ok') : '... retry') : '?'}`, '']); }
    return out.length ? { lines: out, t0: TEACH.low[0] - 1.5 * BP, log: true } : null; }
  if (t >= LOADED && t < 18.6) {   // a bumped one asks again before the next of its kind (until a real press answers it)
    for (const k of ['low', 'high', 'wall']) { const T3 = TEACH[k]; for (let i = 1; i < 3; i++) { const prev = teachRes(s, T3[i - 1]); if (!prev || prev.r !== 'bump') continue;
      const tw = T3[i], r = teachRes(s, tw); if (t >= tw - 1.6 * BP && !(r && t >= r.t)) return { lines: [[`> ${TNAME[k]}?`, '']], t0: tw - 1.6 * BP, log: true };
      if (r && r.r === 'ok' && t >= r.t && t < r.t + 0.9) return { lines: [[`> ${TNAME[k]}... ok`, '']], t0: r.t, log: true }; } } }
  if (t >= 28.75 && t < 30.2) return { lines: [['> thursday. obviously.', '']], t0: 28.75 };   // DRAFT
  if (t >= 31.2 && t < 32.4 && !thuBumped(s, 'mascotwall')) return { lines: [['> not loading that.', '']], t0: 31.2 };   // DRAFT
  if (t >= 81.6 && t < 83.4) return { lines: [['> reboot. louder.', '']], t0: 81.6 };   // DRAFT
  if (t >= 103.6) return { lines: [['> minute one. clean, on purpose.', '']], t0: 103.6, last: true };   // DRAFT (the last line: up from the door's seam, readable through the white)
  return null;
}
function drawAside(ctx, A, t, x, y, left) {
  ctx.save(); ctx.font = `400 21px ${MONO}`; const w = Math.max(...A.lines.map(([l, g]) => ctx.measureText(l + (g ? '  ' + g : '')).width)) + 28, h = 16 + A.lines.length * 28;
  const k = ease((t - A.t0) / 0.18); x = Math.max(10, Math.min(left ? x : x - w / 2, W - w - 12)); ctx.translate(x, y - h); ctx.rotate(-0.03); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); ctx.globalAlpha = k;
  if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-5, -5, w + 10, h + 10); } ctx.fillStyle = INK; ctx.fillRect(-2, -2, w + 4, h + 4); ctx.fillStyle = '#030a06'; ctx.fillRect(2, 2, w - 4, h - 4);   // sticker border, ink, the screen
  ctx.strokeStyle = GREEN; ctx.lineWidth = 1.5; ctx.strokeRect(5, 5, w - 10, h - 10);
  A.lines.forEach(([l, g], i) => { const ty = 28 + i * 28; ctx.fillStyle = A.log ? GREEN2 : CREAM; ctx.textAlign = 'left'; ctx.fillText(l, 13, ty);
  });
  ctx.restore();
}
export function thuView({ T, world, C, base }) {
  loadKitchen(base || '../play/');
  STAGE_X = C.X(63.74 + 0.95 * BP);
  // the boot wire: before the drop the floor is just one glowing wire in the dark (a cover over the ground, then it drops on 10.46)
  const X10 = C.X(LOADED), cover = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: '#010402' }));
  cover.scale.set(X10 + 40, 10, 1); cover.position.set((X10 - 30) / 2 + 5, -4.45, 0.5); world.add(cover);
  const wire = new T.Mesh(new T.PlaneGeometry(1, 0.07), new T.MeshBasicMaterial({ color: GREEN, transparent: true })); wire.scale.x = X10 + 40; wire.position.set((X10 - 30) / 2 + 5, 0.0, 0.52); world.add(wire);
  const wglow = new T.Mesh(new T.PlaneGeometry(1, 0.5), new T.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false })); wglow.scale.x = X10 + 40; wglow.position.set((X10 - 30) / 2 + 5, 0.0, 0.51); world.add(wglow);
  // the holes: dark pits with binary pouring in, lit lips
  const hc = document.createElement('canvas'); hc.width = 64; hc.height = 256; const hx = hc.getContext('2d'), htex = new T.CanvasTexture(hc); htex.colorSpace = T.NoColorSpace; let hT = -1;
  const holes = (CO ? CO.holes : []).map(h => { const x0 = C.X(h.t0), x1 = C.X(h.t1), g = new T.Group();
    const pit = new T.Mesh(new T.PlaneGeometry(x1 - x0, 9), new T.MeshBasicMaterial({ color: '#000000' })); pit.position.set(0, -4.5, 0.3); g.add(pit);
    const pour = new T.Mesh(new T.PlaneGeometry(x1 - x0 - 0.1, 2.6), new T.MeshBasicMaterial({ map: htex, transparent: true, depthWrite: false })); pour.position.set(0, -1.3, 0.35); g.add(pour);
    for (const sx of [-1, 1]) { const lip = new T.Mesh(new T.PlaneGeometry(0.12, 1.4), new T.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false })); lip.position.set(sx * (x1 - x0) / 2, -0.7, 0.48); g.add(lip); }
    g.position.set((x0 + x1) / 2, h.y, 0); world.add(g); return g; });
  // the floor's edge takes the mood (green → warm after the tin → gold at the end)
  let edges = null; const EG = new T.Color(GREEN), tmpC = new T.Color(), CW = new T.Color(WARM), CS = new T.Color(SEL), CG = new T.Color(GOLD);
  globalThis.__thuFall = () => clamp((CUR_T - 34.75) / 0.85);   // (the falling thought's painter reads this; made once)
  let ticks = -1, lastT = -1, SFXo = null; import('../../play/sfx.mjs').then(m => { SFXo = m.SFX; }).catch(() => {});
  const clickAt = [75.07, 75.70, 76.37, 77.01];   // the bridge's hits (= the level's STAIR_HITS)
  return {
    draw(f) { const { t, s } = f; CUR_T = t;
      const drop = t < LOADED ? 0 : ease((t - LOADED) / 0.35); cover.visible = drop < 1; cover.position.y = -4.45 - drop * 10; wire.visible = wglow.visible = t < LOADED + 0.4; wire.material.opacity = t < LOADED ? 1 : 1 - (t - LOADED) / 0.4;
      wglow.material.opacity = 0.18 + 0.25 * kickEnv(t);
      if (Math.floor(t * 15) !== hT) { hT = Math.floor(t * 15); hx.clearRect(0, 0, 64, 256); hx.font = `700 14px ${MONO}`; hx.textAlign = 'center';
        for (let c = 0; c < 4; c++) for (let r = 0; r < 18; r++) { const v = ((r + t * 9 + c * 5) % 18) / 18; hx.globalAlpha = v * v; hx.fillStyle = v > 0.92 ? '#ffffff' : GREEN; hx.fillText(rnd(c * 31 + r, hT) < 0.5 ? '0' : '1', 8 + c * 16, r * 14 + 12); } hx.globalAlpha = 1; htex.needsUpdate = true; }
      for (const g of holes) g.visible = Math.abs(g.position.x - s.x) < f.span + 2;
      if (!edges) { edges = []; world.traverse(o => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && !o.material.map && o.material.color && o.material.color.getHex() === 0x2bff88 && o !== wire && o !== wglow && !holes.some(g => g.children.includes(o))) edges.push(o.material); }); }
      tmpC.copy(EG).lerp(CW, warmK(t) * (1 - selK(t))).lerp(CS, selK(t) * 0.8); if (t >= SLAM3) tmpC.lerp(CG, ease((t - SLAM3) / 0.3));
      for (const m of edges) m.color.copy(tmpC);
      // the stair clicks (the beat in the silence)
      if (SFXo && t > lastT && t - lastT < 0.2) { for (const c of clickAt) if (lastT < c && t >= c) SFXo.flick && SFXo.flick(); if (lastT < 78.0 && t >= 78.0) SFXo.thunk && SFXo.thunk(); }
      lastT = t; },
    over(ctx, f) {
      const { t, s, project } = f; PROJ = project; HZ = C.hazards; if (CO) CO.selX = C.X(80.25);
      const me = project(s.x, s.y + 0.62), feet = project(s.x, s.y);
      // the mascot head + the wind-up key: grey dashed outlines that try to load on him and stall (he stays bare)
      // (they're soft glitch walls now: glitched = they shatter; bumped = they load onto him, grey, for a beat, and fall off)
      const bumpT = obj => { const h = C.hazards.find(q => q.obj === obj); return h && s.bumped && s.bumped[h.i] != null ? s.bumped[h.i] : null; }, mB = bumpT('mascotwall'), tB = bumpT('toywall');
      if (mB != null && span(t, mB, mB + 1.18)) { const u = (t - mB) / 1.18, shake = u > 0.7 ? (rnd(Math.floor(t * 30), 1) - 0.5) * 14 : 0, fall = u > 0.8 ? (u - 0.8) * 5 : 0;
        const lower = 1 - ease(Math.min(1, u / 0.6));
        ctx.save(); ctx.translate(me.x + 26 + shake + fall * 90, me.y - 150 + 70 * (1 - lower) + fall * fall * 120); ctx.rotate(0.12 + fall * 0.9); ctx.globalAlpha = (1 - fall) * 0.95;
        ctx.fillStyle = 'rgba(184,188,196,.10)'; ctx.beginPath(); ctx.ellipse(0, 0, 74, 64, 0, 0, 7); ctx.fill();
        ctx.setLineDash([9, 7]); ctx.lineWidth = 4; ctx.strokeStyle = '#b8bcc4';
        for (const dx of [-56, 56]) { ctx.beginPath(); ctx.arc(dx, -50, 24, 0, 7); ctx.stroke(); }   // big round foam ears
        ctx.beginPath(); ctx.ellipse(0, 0, 74, 64, 0, 0, 7); ctx.stroke();   // the foam head
        for (const dx of [-26, 26]) { ctx.beginPath(); ctx.ellipse(dx, -14, 13, 17, 0, 0, 7); ctx.stroke(); }   // goggly eyes
        ctx.beginPath(); ctx.moveTo(-40, 16); ctx.quadraticCurveTo(0, 62, 40, 16); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);   // the big grin
        ctx.fillStyle = INK; ctx.fillRect(-62, 78, 124, 12); ctx.fillStyle = '#b8bcc4'; ctx.fillRect(-60, 80, 120 * 0.03, 8); ctx.font = `400 15px ${MONO}`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeText('mascot.png 3%', 0, 108); ctx.fillText('mascot.png 3%', 0, 108);
        ctx.restore(); }
      if (tB != null && span(t, tB, tB + 0.86)) { const u = (t - tB) / 0.86, fall = u > 0.55 ? (u - 0.55) / 0.45 : 0;
        ctx.save(); ctx.translate(me.x - 70, me.y - 6 + fall * fall * 140); ctx.rotate(fall * 1.4 + Math.sin(t * 8) * 0.1); ctx.globalAlpha = 1 - fall; ctx.setLineDash([7, 6]); ctx.lineWidth = 4; ctx.strokeStyle = '#b8bcc4';
        ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-6, 0); ctx.stroke(); for (const dy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-24, dy * 18, 18, 16, 0, 0, 7); ctx.stroke(); } ctx.setLineDash([]); ctx.restore(); }   // a wind-up key on his back
      // THU on the face of the Thursday step
      if (t > 26.5 && t < 32.5 && CO) { const x0 = C.X(28.32 + 0.95 * BP), p = project(x0 + 1.1, 0.0); if (p.x > -60 && p.x < W + 60) { ctx.save(); ctx.translate(p.x, p.y + 26); ctx.rotate(-0.04); ctx.font = `400 36px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.strokeText('THU', 0, 0); ctx.fillStyle = CREAM; ctx.fillText('THU', 0, 0); ctx.restore(); } }
      // the stage + spotlight (build 60.75 → slam 62.65)
      if (t > 60.75 && t < 66.6 && CO) { const sx = stageX(), sy = CO.yAt(63.74 + 0.45), a0 = project(sx, sy), sh = Math.max(0, a0.x - (W - 150)), a = { x: a0.x - sh, y: a0.y }, b0 = project(sx + 3.2, sy), b = { x: b0.x - sh, y: b0.y }, hit = t >= STAGE_HIT, k = hit ? 1 : ease((t - 60.75) / 1.9), out = clamp((66.6 - t) / 0.5);
        ctx.save(); if (!hit) ctx.setLineDash([10, 8]); ctx.lineWidth = 4; ctx.strokeStyle = hit ? CREAM : '#b8bcc4'; ctx.globalAlpha = out * (hit ? 1 : 0.7); ctx.strokeRect(a.x, a.y - 92, b.x - a.x, 92); ctx.setLineDash([]); ctx.restore();
        const top = { x: hit ? (a.x + b.x) / 2 : W + 80 - (W + 80 - (a.x + b.x) / 2) * k, y: -20 }, fl = hit ? Math.max(0, 1 - (t - STAGE_HIT) / 0.4) : 0;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = out * (0.22 + 0.5 * fl + 0.12 * kickEnv(t)); ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(top.x - 20, top.y); ctx.lineTo(top.x + 20, top.y);
        ctx.lineTo((hit ? b.x : top.x + 140), a.y); ctx.lineTo((hit ? a.x : top.x - 140), a.y); ctx.fill(); ctx.restore(); }
      // the falling thought: binary rain dropping out of the sky right above where it lands (34.6 → 35.6)
      if (span(t, 34.6, 35.75)) { const p = project(C.X(35.92 + 0.10) + 0.35, 0), u = clamp((t - 34.6) / 1.0); if (p.x < W + 40) { ctx.save(); ctx.font = `700 16px ${MONO}`; ctx.textAlign = 'center';
        for (let i = 0; i < 18; i++) { const y = -40 + (p.y + 40) * u - i * 20; if (y < -20) continue; ctx.globalAlpha = (1 - i / 18) * (1 - Math.max(0, (t - 35.5) / 0.25)); ctx.fillStyle = i === 0 ? '#ffffff' : GREEN; ctx.fillText(rnd(i, Math.floor(t * 10)) < 0.5 ? '0' : '1', p.x + (rnd(i, 3) - 0.5) * 30, y); } ctx.restore(); } }
      // the tin's lid flies off (glitched open on "in"): the saved thoughts pour up into his name; and its last 1% chip (the boot wall)
      if (span(t, 56.0, 57.4)) { const p = project(C.X(56.1), 2.6), u = (t - 56.0) / 1.4; ctx.save(); ctx.translate(p.x + u * 160, p.y - u * 220); ctx.rotate(u * 7); ctx.fillStyle = WARM; ctx.fillRect(-28, -7, 56, 14); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(-28, -7, 56, 14); ctx.restore();
        for (let i = 0; i < 16; i++) { const k = clamp(u * 1.3 - rnd(i, 2) * 0.3), b = BULBS[Math.floor(rnd(i, 4) * BULBS.length)], x = p.x + (b.x - p.x) * k, y = p.y + (b.y - p.y) * k - Math.sin(k * Math.PI) * 80; if (k <= 0 || k >= 1) continue; glowS(ctx, x, y, 16, CREAM, 0.9); } }
      if (span(t, 9.9, 10.3)) { const u = (t - 9.9) / 0.4, a = { x: me.x + 80, y: (e0y(me)) }, b = project(C.X(LOADED + 0.1), 0.8); ctx.fillStyle = GREEN; ctx.fillRect(a.x + (b.x - a.x) * u - 6, a.y + (b.y - a.y) * u - 6, 12, 12); }
      // "Potato, baby" (41.15, = def.codeUntil): his own skin floods in; a bright line sweeps down him, binary sparks shed off
      if (span(t, 41.15, 41.6)) { const u = (t - 41.15) / 0.45, top = me.y - 70, bot = feet.y + 6, y = top + (bot - top) * ease(Math.min(1, u * 1.4));
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - u * 0.7; ctx.fillStyle = CREAM; ctx.shadowColor = CREAM; ctx.shadowBlur = 24; ctx.fillRect(me.x - 66, y - 3, 132, 6); ctx.shadowBlur = 0;
        ctx.font = `700 16px ${MONO}`; ctx.textAlign = 'center'; for (let i = 0; i < 16; i++) { const a = rnd(i, 3) * 6.28, r = 30 + 160 * u * (0.5 + rnd(i, 4)); ctx.globalAlpha = (1 - u) * 0.9; ctx.fillStyle = i % 3 ? GREEN : '#ffffff'; ctx.fillText(rnd(i, 5) < 0.5 ? '0' : '1', me.x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5); }
        ctx.restore(); }
      // the cue ring (the album's one shared move): his purple closes on him in three ticks, the hit is the fourth beat
      for (const q of (CO && !BLANK_Q ? CO.cues : []))   /* (?blank: no press-now ring) */ { const a = q.t - 3 * BP; if (t < a - 0.05 || t > q.t + 0.25) continue; const n = Math.min(3, Math.floor((t - a) / BP) + 1), sub = ((t - a) / BP) % 1;
        const R = 150 - 33 * (n - 1) - 18 * ease(Math.min(1, sub * 3)) * (n < 3 ? 1 : 0.4), pop = Math.max(0, 1 - sub * 4), got = s.sc && s.sc.cue && Object.values(s.sc.cue).find(c => c && c.g !== 'MISS' && c.t != null && c.t >= a && c.t <= q.t + 0.31);
        ctx.save(); ctx.globalAlpha = t > q.t ? Math.max(0, 1 - (t - q.t) / 0.25) : 1; ctx.lineWidth = 7 + 4 * pop; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(me.x, me.y, t > q.t ? 52 : Math.max(52, R), 0, 7); ctx.stroke();
        ctx.lineWidth = 4 + 3 * pop; ctx.strokeStyle = got ? '#ffffff' : PURPLE; ctx.shadowColor = PURPLE; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;
        for (let i = 0; i < 3; i++) { const ang = -Math.PI / 2 + (i - 1) * 0.5; ctx.beginPath(); ctx.arc(me.x + Math.cos(ang) * (Math.max(52, R) + 14), me.y + Math.sin(ang) * (Math.max(52, R) + 14), 6, 0, 7); ctx.fillStyle = i < n ? MAG : INK; ctx.fill(); }
        ctx.restore();
        if (SFXo && t >= a && n !== ticks && t < q.t && f.t - lastT < 0.2) { ticks = n; SFXo.dlTick && SFXo.dlTick(); } }
      if (C.def.fxQuiet && C.def.fxQuiet(t, s) && t - s.glitchAt < 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PURPLE; ctx.globalAlpha = 1 - (t - s.glitchAt) / 0.05; ctx.beginPath(); ctx.arc(me.x, me.y, 46, 0, 7); ctx.fill(); ctx.restore(); }   // he's gone: one purple pop
      // the top step slams on the bridge's bass (78.0): its edge flares
      if (span(t, 78.0, 78.6) && CO) { const p = project(C.X(77.32) + 0.9, 2.6); glowS(ctx, p.x, p.y, 120, CREAM, 0.7 * (1 - (t - 78.0) / 0.6)); }
      // purple flecks on him: the warning before the two big glitches (only Potato glitches purple)
      for (const [a, b] of [[9.9, 10.5], [79.6, 80.3]]) if (span(t, a, b)) for (let i = 0; i < 14; i++) { const ang = rnd(i, Math.floor(t * 18)) * 6.28, r = 48 + rnd(i, 5) * 30; ctx.fillStyle = i % 4 === 0 ? GREEN : i % 2 ? PURPLE : MAG; ctx.fillRect(me.x + Math.cos(ang) * r, me.y + Math.sin(ang) * r * 1.1, 5 + rnd(i, 7) * 6, 4); }
      // the cue's verdict, in his glitch: a quick burst
      if (s.sc && s.sc.cue) for (const k in s.sc.cue) { const c = s.sc.cue[k]; if (!c || c.t == null || t - c.t < 0 || t - c.t > 0.6 || c.g === 'MISS' || c.d == null) continue; const u = (t - c.t) / 0.6;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = c.g === 'PERFECT' ? '#ffffff' : PURPLE; ctx.globalAlpha = 1 - u; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(me.x, me.y, 50 + 300 * u, 0, 7); ctx.stroke(); ctx.restore(); }
      // gold bonus blocks of the victory lap (sticker blocks round the big sparks)
      for (const k of C.tokens) { if (!k.big || k.got) continue; const p = project(k.x, k.y); if (p.x < -50 || p.x > W + 50) continue; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t * 3 + k.x) * 0.08);
        if (OLD_WHITE) { ctx.fillStyle = '#ffffff'; ctx.fillRect(-27, -27, 54, 54); } ctx.fillStyle = INK; ctx.fillRect(-24, -24, 48, 48); ctx.fillStyle = GOLD; ctx.fillRect(-20, -20, 40, 40); ctx.fillStyle = '#fff2b0'; ctx.fillRect(-20, -20, 40, 10);
        ctx.fillStyle = INK; ctx.font = `400 22px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', 0, 3); ctx.restore(); }
      // LOADED / LOAD COMPLETE stamps (system text)
      if (span(t, LOADED, LOADED + 1.3)) { const c = s.sc && s.sc.cue && s.sc.cue[0], big = c && c.g !== 'MISS'; stamp(ctx, 'LOADED', W * 0.6, H * 0.36, (t - LOADED) / 1.3 * 2.5, big ? '#eafff1' : GREEN, -0.08, big ? 70 : 50); }
      if (span(t, COMPLETE, SLOW)) stamp(ctx, 'LOAD COMPLETE', W * 0.62, H * 0.66, Math.min(1, (t - COMPLETE) * 3), t >= 93 ? CREAM : '#ffffff', -0.06, 48);
      // the blackouts ("You blink"): everything black but him, the floor's edge and the next wall's outline
      for (const [a, b] of BLACKOUTS) if (span(t, a, b)) { ctx.fillStyle = 'rgba(0,0,0,.9)'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = moodCol(t, s, false); ctx.lineWidth = 4; for (const q of C.solids) { if (q.kind !== 'block' || q.x1 < s.x - 4 || q.x0 > s.x + 12) continue; const p0 = project(q.x0, q.y1), p1 = project(q.x1, q.y1); ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); }
        const wl = C.hazards.find(h => h.kind === 'word' && h.wk === 'wall' && h.x0 > s.x - 0.3 && h.x0 < s.x + 12); if (wl) { const p0 = project(wl.x0, wl.y0 + 0.6), p1 = project(wl.x1, wl.y0 + 6); ctx.setLineDash([10, 7]); ctx.strokeStyle = GREEN; ctx.strokeRect(p0.x, p1.y, p1.x - p0.x, p0.y - p1.y); ctx.setLineDash([]); } }
      if (span(t, BLACK, SLAM3)) { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); }
      // the pull-back: the dark 404 round his little lit kitchen, and the one door out there (the level's door, moved into the dark)
      void404(ctx, t);
      if (t >= PART) { ctx.save(); ctx.translate(W * 0.86, H * 0.8); ctx.scale(0.85, 0.85); const keep = DOOR_X; DOOR_X = 0; door(ctx, { t, px: -70, floorY: 0 }); DOOR_X = keep; ctx.restore(); }
      // letterbox bars: a CUT (control taken) — the compile and the reboot
      for (const [a, b] of [[38.25, 42.97], [80.75, 84.71]]) if (span(t, a - 0.05, b + 0.3)) { const k = Math.min(ease((t - a) / 0.3), ease((b + 0.3 - t) / 0.3)); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, 36 * k); ctx.fillRect(0, H - 36 * k, W, 36 * k); }
      // the aside box beside his head
      const A = asideAt(t, s);
      if (A && !A.last) drawAside(ctx, A, t, me.x - 60, me.y - 70, true);   // over his head, left-anchored: out of the lane things come down (and under the sign)
      // the white on the last note — the last line stays on top of it
      if (CO && t > CO.END - 0.32) { ctx.fillStyle = '#fffaf0'; ctx.globalAlpha = clamp((t - (CO.END - 0.32)) / 0.22); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      if (A && A.last) drawAside(ctx, A, t, Math.max(me.x + 70, DOOR_X + 80), me.y + 30, true);
      if (typeof window !== 'undefined') window.__thuScore = s.sc;   // (for the album score system: s.sc = points, combo, cues, sparks, name %, grade, lag)
    },
  };
}
const e0y = me => me.y - 120;
let HZ = null; const thuBumped = (s, obj) => { const h = HZ && HZ.find(q => q.obj === obj); return !!(h && s && s.bumped && s.bumped[h.i] != null); };
let STAGE_X = 0; const stageX = () => STAGE_X;

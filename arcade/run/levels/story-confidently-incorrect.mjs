// The music video of Confidently Incorrect: THE FACT FACTORY (plan: game/stories/confidently-incorrect.factory-plan.md v2, §2 + §4 + §5).
// Two layers, both pure functions of song time t (plus the sim state s for where he is and the grab):
//   story(ctx, e)        behind the course (960×540): Kevin's room + the laptop, the factory's back wall in its zone's palette,
//                        the machines working on the music (kick: presses twitch · snare: stamps puff · hats: chase lights ·
//                        bass: furnace/reactor glow · breaks: everything freezes but the bass glow), the output conveyor, the
//                        LIES SHIPPED counter + the output stack, the hopper, the reactor far behind, the zone set pieces.
//   ciView → over(ctx,f) in front of the floors (Potato is drawn after everything, so nothing here covers him): the belt and
//                        the crates/presses/gates painted where the course puts them, the gantry monitor (Kevin's and Mom's
//                        messages), the thought bubble, the tether, Kevin's FRAGILE crate, the crown, the hats, the fold, the
//                        desk at dawn, the newspaper.
// Sticker style throughout: ink #120a05, NO white border (D-20261105-09; ?border= shows the old one), flat fill + one cel band, Major Mono for
// world text. Purple belongs to Potato only (his glitch, his tether, the router blink = him arriving / still out there). The
// laptop's tears are green/RGB. No brand art (the Caesar crate ships as SALAD, no real names; the granola bar has no logo; the hand-pie no brand;
// MIT is a generic arch). No hands on anyone (Kevin, the inspectors, the crane).
import { W, H, clamp, ease, rnd, span, fade, glow } from '../story.mjs';
import * as D from './ci-factory.mjs';
import { CI_STICKERS } from './ci-stickers.mjs';
import { BLANK_Q } from '../blank.mjs';   // (the clean-slate run: game/playthroughs/README.md)
// SET STRIP (Chikin, Nov 5: "the assets are supposed to go away" / "It's a setting, they have to fill the space",
// D-20261105-12/28): in the movie set (?blank) the previous-story props, signs, cards, gags and characters are not drawn;
// only the look stays (the factory, its zone palettes, the machines on the music, the belts, the roof). ?oldprops shows
// them again in a blank run, to compare. The playable game (no ?blank) draws exactly what it drew before.
const SET = BLANK_Q && !(() => { try { return new URLSearchParams(location.search).has('oldprops'); } catch (e) { return false; } })();
const OLD_WHITE = (() => { try { return +new URLSearchParams(location.search).get('border') > 0; } catch (e) { return false; } })();   // NO WHITE LINES (Nov 5, D-20261105-09): the white sticker borders are off; ?border=1 shows the old ones to compare
export const KEYTICKS = D.KEYTICKS;

const INK = '#120a05', PAPER = '#fff6e0', CARD = '#c9a26a', CARD2 = '#a77f4a', CARD_HOT = '#e6b36a', DECOR = '#6f6150', DECOR2 = '#5c5042', HAZ = '#ffcf4a', RED = '#e2412e', GREEN = '#4dff9a', PURPLE = '#9a52ff';
const MONO = '"Major Mono Display", ui-monospace, monospace';
let CC = null, CAM = null, V3 = null;                    // the course + the camera (handed over by ciView, the view makes it before drawing)
const proj = (x, y) => { V3.set(x, y, 0).project(CAM); return { x: (V3.x * 0.5 + 0.5) * W, y: (0.5 - V3.y * 0.5) * H }; };
const ppu = () => H * CAM.zoom / (CAM.top - CAM.bottom);
const X = t => CC.X(t);
// a background set piece anchored to a song moment: at `at` it stands at screen x frac·W and drifts with depth k (0 far .. 1 on the belt)
const bgx = (at, frac, t, k = 0.35) => W * frac + (X(at) - X(t)) * ppu() * k;

// ---------- small drawing kit ----------
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';   // (rework: a plain readable face where case matters — Kevin's question; Major Mono flattens capitals)
function txt(ctx, s, x, y, size, col, o = {}) { ctx.save(); ctx.font = o.font ? `${o.font} ${size}px ${SANS}` : `400 ${size}px ${MONO}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; } if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.sc || INK; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.globalAlpha *= o.a ?? 1; ctx.fillText(s, x, y); ctx.restore(); }
function box(ctx, x, y, w, h, fill, o = {}) {                     // a flat sticker box: fill · one cel band · ink (o.border = the old white edge, only with ?border=: D-20261105-09)
  ctx.save(); ctx.lineJoin = 'round';
  if (o.border && OLD_WHITE) { ctx.lineWidth = o.border; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(x, y, w, h); }
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (o.band) { ctx.fillStyle = o.band; ctx.fillRect(x + w * 0.72, y, w * 0.28, h); }
  ctx.lineWidth = o.ink ?? 3; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h); ctx.restore(); }
function poly(ctx, pts, fill, ink = 3, border = 0) { ctx.save(); ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath();
  if (border && OLD_WHITE) { ctx.lineWidth = border; ctx.strokeStyle = '#fff'; ctx.stroke(); } ctx.fillStyle = fill; ctx.fill(); if (ink) { ctx.lineWidth = ink; ctx.strokeStyle = INK; ctx.stroke(); } ctx.restore(); }
function circ(ctx, x, y, r, fill, ink = 3) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); if (ink) { ctx.lineWidth = ink; ctx.strokeStyle = INK; ctx.stroke(); } }
function stripes(ctx, x, y, w, h, a = HAZ, b = INK, step = 14) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = a; ctx.fillRect(x, y, w, h); ctx.fillStyle = b;
  for (let k = -h; k < w + h; k += step * 2) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + step, y + h); ctx.lineTo(x + k + step + h, y); ctx.lineTo(x + k + h, y); ctx.fill(); } ctx.restore(); }
// ---------- Chat's art pack (from-chat/Potato_CI_Factory_Pack_v1, downscaled into run/assets/ci by the art pass, Nov 2) ----------
// Every picture is optional: art(n) is null until it has loaded (or if it failed / in node), and every caller falls back to the
// code drawing, so the level never breaks. Never decal_bezos (a real person's likeness); no BEZOS label either (review fix: the Caesar crate says SALAD).
const ART_BASE = new URL('../assets/ci/', import.meta.url).href, ART = {}, PAT = {};
const ART_LIST = ['decal_yak', 'decal_drgary', 'decal_spaghetti', 'decal_goblin', 'decal_granola', 'decal_handpie', 'decal_everest', 'decal_cornelius_bust',
  'decal_restaurant', 'decal_zipcode', 'decal_franklin', 'sign_answer', 'sign_lies_shipped', 'sign_mit', 'sign_quality', 'sign_days', 'stamp_fact', 'stamp_rejected', 'stamp_source',
  'stamp_data', 'stamp_fragile', 'picto_cactus', 'picto_cloud', 'picto_eiffel', 'picto_hammer', 'picto_knot', 'picto_lightning', 'picto_loading', 'picto_podium', 'picto_question',
  'tile_metal', 'tile_corrugated', 'tile_furnace', 'tile_deli', 'tile_belt', 'tile_cardboard_front', 'tile_cardboard_back', 'turn_kevin_front', 'kevin_bust',
  'turn_inspector_front', 'turn_gremlin_qc_front', 'turn_raccoon_side', 'turn_survey_front', 'room_desk', 'room_laptop_screen', 'prop_crown_cardboard', 'prop_hardhat_small'];
function art(n) { if (typeof Image === 'undefined') return null; let im = ART[n]; if (!im) { im = ART[n] = new Image(); im.decoding = 'async'; im.src = ART_BASE + n + '.webp'; }
  return im.complete && im.naturalWidth > 0 ? im : null; }
const preloadArt = () => ART_LIST.forEach(art);
// draw picture n centred at (cx, cy), fitted inside mw × mh (aspect kept); false = not loaded (the caller draws its fallback)
function pic(ctx, n, cx, cy, mw, mh, o = {}) { const im = art(n); if (!im) return false; const k = Math.min(mw / im.naturalWidth, mh / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
  ctx.save(); if (o.a != null) ctx.globalAlpha *= o.a; ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1);
  ctx.drawImage(im, -w / 2, o.bottom ? -h : -h / 2, w, h); ctx.restore(); return true; }
// a tiled texture: fills the rect with tile n (`size` px per repeat, offset ox/oy), then washes it toward `tint` by `k` (keeps the zone palette)
function tile(ctx, n, x, y, w, h, size, ox = 0, oy = 0, tint = null, k = 0) { const im = art(n); if (!im) return false;
  let p = PAT[n]; if (!p) p = PAT[n] = ctx.createPattern(im, 'repeat'); const sc = size / im.naturalWidth;
  p.setTransform(new DOMMatrix([sc, 0, 0, sc, ox, oy])); ctx.save(); ctx.fillStyle = p; ctx.fillRect(x, y, w, h);
  if (tint && k > 0) { ctx.globalAlpha = k; ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); } ctx.restore(); return true; }
// a rubber-stamp impression (Chat's stamps) slammed on with the same pop as stamp(): k 0 → 1
function stampArt(ctx, n, x, y, w, k = 1, rot = -0.2) { if (k <= 0) return false; const im = art(n); if (!im) return false; const sc = 1 + 0.6 * (1 - Math.min(1, k * 3));
  return pic(ctx, n, x, y, w * sc, w * sc, { rot, a: Math.min(1, k * 3) * 0.95 }); }
const lerp = (a, b, k) => a + (b - a) * k;
const hx = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join(''); };
function beacon(ctx, x, y, t, on = 1) { ctx.save(); circ(ctx, x, y, 9, on ? RED : '#6a2a20', 2.5); if (on) { const a = t * 9; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 90, a, a + 0.5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 90, a + Math.PI, a + Math.PI + 0.5); ctx.closePath(); ctx.fill(); } ctx.restore(); }
function stamp(ctx, x, y, r, k = 1, col = RED, mark = '✓') { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.25); const sc = 1 + 0.6 * (1 - Math.min(1, k * 3)); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, k * 3) * 0.92;
  ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.strokeRect(-r, -r * 0.62, r * 2, r * 1.24); txt(ctx, mark, 0, 1, r * 1.05, col); ctx.restore(); }

// ---------- the zones' palettes (palette changes only on drops, §5) ----------
const PAL = {
  desk:    { wall: '#141a2a', wall2: '#0f1422', metal: '#2a3348', metal2: '#1f2638', light: '#ffd9a0' },
  intake:  { wall: '#2c4660', wall2: '#223850', metal: '#5f7a94', metal2: '#45607a', light: '#cfe6ff' },
  stamp:   { wall: '#2c4660', wall2: '#223850', metal: '#5f7a94', metal2: '#45607a', light: '#cfe6ff' },
  catwalk: { wall: '#4b3517', wall2: '#3a2810', metal: '#8a6a3a', metal2: '#6b5028', light: '#ffb347' },
  drop:    { wall: '#4b3517', wall2: '#3a2810', metal: '#8a6a3a', metal2: '#6b5028', light: '#ffb347' },
  wing:    { wall: '#36443c', wall2: '#2a352f', metal: '#6f8277', metal2: '#56685d', light: '#d8f0c0' },
  upper:   { wall: '#36443c', wall2: '#2a352f', metal: '#6f8277', metal2: '#56685d', light: '#d8f0c0' },
  furnace: { wall: '#4d2010', wall2: '#3a160a', metal: '#86513a', metal2: '#6a3d2a', light: '#ff8a3c' },
  deli:    { wall: '#e4ddcc', wall2: '#cfc6b2', metal: '#9aa6a8', metal2: '#7d898b', light: '#fff6e0' },
  roof:    { wall: '#1b2134', wall2: '#141a2a', metal: '#5a6278', metal2: '#454c60', light: '#fff2a8' },
  fold:    { wall: '#2a1a12', wall2: '#1f130c', metal: '#6a4a30', metal2: '#553a24', light: '#ff5a3a' },
  dawn:    { wall: '#141a2a', wall2: '#0f1422', metal: '#2a3348', metal2: '#1f2638', light: '#ffd9a0' },
};
function palAt(t) { if (SET) t = clamp(t, 13.5, 241.2);   // (set strip: no desk intro / fold / dawn palettes, the factory runs 0 -> end)
  let i = 0; for (let k = 0; k < D.ZONES.length; k++) if (t >= D.ZONES[k][0]) i = k;
  const cur = PAL[D.ZONES[i][1]], prev = i ? PAL[D.ZONES[i - 1][1]] : cur, k = clamp((t - D.ZONES[i][0]) / 0.25);
  if (k >= 1) return cur; const o = {}; for (const n in cur) o[n] = mix(prev[n], cur[n], k); return o; }

// ---------- the music: machines move on it, and freeze in its breaks ----------
let MUS = null, QUIET = null;
const STILLS = [[127.3, 129.05], [175.19, 178.33], [203.6, 206.2], [219.5, 220.05], [241.8, 242.3]];
const frozen = t => STILLS.some(([a, b]) => t >= a && t < b) || (MUS && MUS.inBreak(t));
function mtime(t) { if (!QUIET) return t; let lost = 0; for (const [a, b] of QUIET) { if (t <= a) break; lost += Math.min(t, b) - a; } return t - lost; }

// ---------- what the line has shipped (every cleared crate is stamped and shipped: LIES SHIPPED) ----------
const SHIPT = D.COURSE.filter(r => D.SHIPS.has(r[1])).map(r => r[0] + 0.5).sort((a, b) => a - b);
let SECRET = null;   // (rework: the summit secret — set from s.ciSecret each frame; +10 lies once he touches the ANSWER board)
const shipped = t => { let n = 0; for (const a of SHIPT) if (a <= t) n++; else break; return n + (SECRET != null && t >= SECRET ? 10 : 0); };
// the lies the shipped crates carry: [sung at, Chat's decal (or null: a name-only label), label]. A crate shows a lie only once it
// has been sung (the review's low finding: back-belt crates used to show lie names before they were sung). (No BEZOS: the Caesar lie ships as SALAD.)
const LIES = [[24.03, 'decal_yak', 'YAK'], [40.78, null, 'SALAD'], [49.15, 'decal_drgary', 'DR. GARY'], [55.10, 'decal_spaghetti', 'Q. SPAG'], [69.27, null, 'STEW'],
  [79.50, 'decal_restaurant', ''], [80.80, 'decal_zipcode', ''], [118.83, 'decal_goblin', 'S. GOB'], [130.19, 'decal_granola', ''], [176.60, 'decal_handpie', ''],
  [193.81, 'decal_everest', 'EVEREST'], [199.99, null, 'NEPAL'], [218.16, 'decal_franklin', ''], [236.46, 'decal_cornelius_bust', 'CORN.'], [239.12, null, 'MIT']];
const liesSung = t => LIES.filter(l => l[0] <= t);

// ---------- the course's set dressing: where each press's thing stands (the same leads the stage-2 course will use) ----------
const lead = (kind, v) => kind === 'high' ? 0.31 - 0.475 / v : kind === 'wall' || kind === 'dormant' ? 0.25 - 0.125 / v : 0.296 - 0.3 / v;
let ROWS = null;
function rows() { if (ROWS) return ROWS; ROWS = D.COURSE.map((r, i) => { const [tp, kind, label, what, hold] = r, v = Math.max(1, CC.speedAt(tp)), pl = D.PLACE[i];   // (stage 2: build() says where each hitbox is)
  const x = pl ? pl.x0 : X(tp + lead(kind, v)); return { tp, kind, label, what: what || '', hold, x, x1: pl ? pl.x1 : null, gy: pl ? pl.gy : floorTop(x, tp) }; }); return ROWS; }
function floorTop(x, t) { let best = null; for (const q of CC.solids) if (q.kind === 'block' && !q.step && !q.pump && x >= q.x0 - 0.05 && x <= q.x1 + 0.05) { if (best == null || q.y1 > best) best = q.y1; }
  if (best == null) { const f = [...D.FLOORS].reverse().find(([a]) => a <= t); best = f ? f[2] : 0; } return best; }
function floorUnder(x, yMax) { let best = null; for (const q of CC.solids) if (q.kind === 'block' && x >= q.x0 && x <= q.x1 && q.y1 <= yMax + 0.05) { if (best == null || q.y1 > best) best = q.y1; } return best; }

// =====================================================================================================================
// THE STORY LAYER (behind)
// =====================================================================================================================
export function story(ctx, e) {
  if (!CC || !CAM) { ctx.fillStyle = '#0c1118'; ctx.fillRect(0, 0, W, H); return; }
  const t = e.t, s = e.s, M = e.music || CC.music; MUS = M; SECRET = s && s.ciSecret != null ? s.ciSecret : null;
  if (M && !QUIET) QUIET = [...(M.breaks || []), ...STILLS].map(([a, b]) => [a, b]).sort((a, b) => a[0] - b[0]);
  const fz = frozen(t), kick = fz ? 0 : (M ? M.kick(t) : e.kick), snare = fz ? 0 : (M ? M.snare(t) : 0), hat = fz ? 0 : (M ? M.hat(t) : 0), bass = M ? M.bass(t) : 0.4, mt = mtime(t);
  const pal = palAt(t), U = ppu(), cx0 = proj(0, 0).x;
  if (t < 13.18 && !SET) { room(ctx, e, t, U); return; }   // (set strip: Kevin's room + the laptop are the old opener (Chikin: "the assets are supposed to go away"): the factory runs from 0)
  if (t >= 243.6 && !SET) { ctx.fillStyle = '#0a0d16'; ctx.fillRect(0, 0, W, H); return; }   // (the desk at dawn is painted in front)
  factoryBack(ctx, e, t, mt, pal, U, kick, snare, hat, bass);
}

// ---------- KEVIN'S ROOM + THE LAPTOP (−14 → 13.18) ----------
let SLIP = null;                                                 // where "thanks, -Kevin" lies on the desk (world)
function laptopRect(s) { const a = proj(s.x - 1.6, 4.7), b = proj(s.x + 9.8, 0); return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }; }
function room(ctx, e, t, U) {
  const s = e.s;
  // the room: night wall, a window with the street light, the shelf with the router
  ctx.fillStyle = '#141a2a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#0f1422'; ctx.fillRect(0, H * 0.62, W, H);
  const L = laptopRect(s);
  const win = proj(s.x - 2.9, 6.6), win2 = proj(s.x - 1.75, 5.2); box(ctx, win.x, win.y, win2.x - win.x, win2.y - win.y, '#1d2c4a', { ink: 3 });
  glow(ctx, win.x + 20, win.y + 18, 26, '#ffd27a', 0.35);
  // the shelf + the router (it blinks purple once at −13.5: him, arriving over the wifi)
  const sh = proj(s.x - 2.95, 3.0), sh2 = proj(s.x - 1.7, 2.85); box(ctx, sh.x, sh.y, sh2.x - sh.x, sh2.y - sh.y, '#6b4a2e', { ink: 2.5 });
  const r0 = proj(s.x - 2.65, 3.45), r1 = proj(s.x - 2.0, 3.0); box(ctx, r0.x, r0.y, r1.x - r0.x, r1.y - r0.y, '#2a2f38', { ink: 2.5, band: '#1d2128' });
  for (const k of [0.3, 0.7]) { ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(r0.x + (r1.x - r0.x) * k, r0.y); ctx.lineTo(r0.x + (r1.x - r0.x) * k + 4, r0.y - 22); ctx.stroke(); }
  const blink = Math.max(span(t, -14.05, -13.65) ? 1 : 0, 0)   /* (on Matt's tap −14.05) */, led = { x: r0.x + 10, y: (r0.y + r1.y) / 2 };
  circ(ctx, led.x, led.y, 4, blink ? PURPLE : '#3dff8a', 1.5); if (blink) glow(ctx, led.x, led.y, 60, PURPLE, 0.8);
  // the laptop: desktop wallpaper (flat, one band), the chat window, the taskbar he stands on
  ctx.save(); ctx.beginPath(); ctx.rect(L.x, L.y, L.w, L.h);
  for (const r of tearRects(t, L)) ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip('evenodd');
  const scr = art('room_laptop_screen');   // Chat's chat-app window is the laptop's screen (the same window is on the desk at dawn)
  if (scr) { ctx.fillStyle = '#121a2e'; ctx.fillRect(L.x, L.y, L.w, L.h); ctx.drawImage(scr, L.x - 6, L.y - 6, L.w + 12, L.h + 12); }
  else { ctx.fillStyle = '#1f4e79'; ctx.fillRect(L.x, L.y, L.w, L.h); ctx.fillStyle = '#1a4369'; ctx.fillRect(L.x + L.w * 0.62, L.y, L.w * 0.38, L.h);
  for (let i = 0; i < 4; i++) { const ix = L.x + 18, iy = L.y + 18 + i * 52; box(ctx, ix, iy, 30, 26, ['#ffd27a', '#e9e2cc', '#7dc3ff', '#ffb38a'][i], { ink: 2 }); } }   // desktop icons
  bootText(ctx, t, L);
  chatBar(ctx, t, L);
  const tb = proj(s.x - 1.6, 0.42).y; ctx.fillStyle = '#0d1a2b'; ctx.fillRect(L.x, tb, L.w, L.y + L.h - tb);   // the taskbar (his floor)
  box(ctx, L.x + 8, tb + 4, 26, L.y + L.h - tb - 8, '#2f6aa0', { ink: 2 });
  txt(ctx, '11:52', L.x + L.w - 40, (tb + L.y + L.h) / 2, 13, '#cfe6ff');
  ctx.restore();
  // the tears (10.79 → 13.18): green binary + RGB, and behind them the factory: belts and machines
  if (t >= 10.79) { for (const r of tearRects(t, L)) { ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); factoryPeek(ctx, t, r); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#00ff66'; ctx.globalAlpha = 0.5; ctx.fillRect(r.x, r.y, r.w, 2); ctx.fillStyle = '#ff2a2a'; ctx.globalAlpha = 0.4; ctx.fillRect(r.x + 3, r.y + r.h - 2, r.w, 2); ctx.fillStyle = '#2a7bff'; ctx.fillRect(r.x - 3, r.y + r.h, r.w, 2); ctx.restore();
    ctx.save(); ctx.font = `400 12px ${MONO}`; ctx.fillStyle = GREEN; for (let i = 0; i < r.w / 12; i++) if (rnd(i, Math.floor(t * 20) + r.y) < 0.5) ctx.fillText(rnd(i, r.y) < 0.5 ? '0' : '1', r.x + i * 12, r.y - 3); ctx.restore(); } }
  // the laptop's frame
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.strokeRect(L.x, L.y, L.w, L.h); ctx.lineWidth = 10; ctx.strokeStyle = '#2b2f36'; ctx.strokeRect(L.x - 8, L.y - 8, L.w + 16, L.h + 8); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(L.x - 13, L.y - 13, L.w + 26, L.h + 13);
  circ(ctx, L.x + L.w / 2, L.y - 6, 2.5, '#111', 0);
  // 13.0 → 13.18: the push-through flash
  if (t > 12.95) { ctx.fillStyle = '#eafff1'; ctx.globalAlpha = clamp((t - 12.95) / 0.23) ** 2; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
function tearRects(t, L) { if (t < 10.79) return []; const n = Math.min(14, 2 + Math.floor((t - 10.79) * 5)), out = [];
  for (let i = 0; i < n; i++) { const y = L.y + L.h * (0.05 + 0.85 * rnd(i, 7)), h = 6 + 26 * rnd(i, 8) * (1 + (t - 10.79) * 0.6), x0 = L.x + L.w * rnd(i, 9) * 0.5, w = L.w * (0.3 + 0.7 * rnd(i, 10));
    const j = (rnd(i, Math.floor(t * 12)) - 0.5) * 30; out.push({ x: x0 + j, y, w: Math.min(w, L.x + L.w - x0), h: Math.min(h, L.y + L.h - y) }); } return out; }
function factoryPeek(ctx, t, r) { ctx.fillStyle = '#2c4660'; ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let k = 0; k < r.w; k += 46) { const xx = r.x + ((k - t * 160) % (r.w + 46) + r.w + 46) % (r.w + 46); box(ctx, xx, r.y + r.h * 0.45, 32, r.h * 0.4, CARD, { ink: 2, band: CARD2 }); }
  stripes(ctx, r.x, r.y + r.h * 0.85, r.w, r.h * 0.15, HAZ, INK, 8); }
const BOOT = [['> answer.exe', '#7dff9a'], ['> load facts ...... FAIL', '#ff6a5a'], ['> load sources .... FAIL', '#ff6a5a'], ['> load answer ..... FAIL', '#ff6a5a'], ['> retry', '#7dff9a'], ['> retry', '#ffcf4a'], ['> ok. answering anyway', '#7dff9a']];
function bootText(ctx, t, L) { if (t < 5.63 || t > 10.79) return; const n = Math.min(BOOT.length, 1 + Math.floor((t - 5.63) / 0.62));
  const x = L.x + L.w * 0.5, y0 = L.y + L.h * 0.36; box(ctx, x - 8, y0 - 22, L.w * 0.47, 26 + BOOT.length * 22, '#06120b', { ink: 3 });
  for (let i = 0; i < n; i++) { const [s, c] = BOOT[i], jit = i === n - 1 && rnd(i, Math.floor(t * 20)) < 0.3 ? (rnd(i, Math.floor(t * 30)) - 0.5) * 10 : 0; txt(ctx, s, x + jit, y0 + i * 22, 14, c, { align: 'left' }); } }
// Kevin's chat bar on the laptop (top centre): sticker style, a plain ink send arrow. Rework: Matt's exact wording on two lines in a
// plain readable face ("Dear Potato, what is the capital of Neipal?" / "thanks, -Kevin"); after send every letter of the question
// lifts off in reading order and streams into his head (deskFront); "Neipal?" waits glowing and goes in last, on 1.134.
const CHAT_F = '600', CHAT_PX = 17, LIFT0 = -1.95, LIFT_STEP = 0.035, NEIPAL_PULL = 0.534, NEIPAL_LAND = 1.134;
function chatLayout(ctx, L) {
  const bw = Math.min(L.w * 0.86, 640), bh = 76, bx = L.x + (L.w - bw) / 2, by = L.y + 16, out = [];
  ctx.save(); ctx.font = `${CHAT_F} ${CHAT_PX}px ${SANS}`; const nq = D.MSG_Q.length, pre = nq - 'Neipal?'.length; let j = 0;
  [...D.MSG1].forEach((c, i) => { const two = i > nq, line = two ? D.MSG1.slice(nq + 1, i) : D.MSG1.slice(0, i), x = bx + 18 + ctx.measureText(line).width + ctx.measureText(c).width / 2, y = by + (two ? 53 : 28);
    let lift = null, land = null; if (!two && i < nq && c !== ' ') { lift = LIFT0 + j * LIFT_STEP; j++; land = i >= pre ? NEIPAL_LAND : lift + 1.2; }
    out.push({ c, x, y, i, two, lift, land, neipal: i >= pre && i < nq }); });
  ctx.restore(); return { bx, by, bw, bh, ch: out }; }
function chatBar(ctx, t, L) {
  const m = D.MESSAGES[0], [a, sent] = m; if (t < a - 0.5 || t > NEIPAL_LAND + 0.4) return;
  const pop = clamp((t - (a - 0.5)) / 0.35), gone = clamp((t - NEIPAL_LAND) / 0.4), CL = chatLayout(ctx, L), { bx, by, bw, bh } = CL;
  ctx.save(); ctx.globalAlpha = pop * (1 - gone); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(0.9 + 0.1 * pop, 0.9 + 0.1 * pop); ctx.translate(-bx - bw / 2, -by - bh / 2);
  box(ctx, bx, by, bw, bh, PAPER, { border: 10, ink: 4 });
  txt(ctx, 'kevin', bx + 14, by - 1, 11, '#fff', { align: 'left', stroke: 4 });
  const typed = D.typedAt(m, t); ctx.font = `${CHAT_F} ${CHAT_PX}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = INK;
  let last = null; for (const q of CL.ch) { if (q.i >= typed.length) break; last = q;
    if (t >= sent && (q.two || (q.lift != null && t >= q.lift))) continue;   // sent: the sign-off drops off as the slip; the question's letters lift off one by one
    ctx.fillText(q.c, q.x, q.y); }
  if (t < sent && Math.floor(t * 2.5) % 2) { ctx.save(); ctx.font = `${CHAT_F} ${CHAT_PX}px ${SANS}`; const cx = last ? last.x + ctx.measureText(last.c).width / 2 + 2 : bx + 18, cy = last ? last.y : by + 28; ctx.restore(); ctx.fillRect(cx, cy - 11, 2, 22); }
  const ax = bx + bw - 34, ay = by + bh / 2, hot = t > sent - 0.25; poly(ctx, [[ax - 10, ay - 12], [ax + 14, ay], [ax - 10, ay + 12], [ax - 5, ay]], hot ? HAZ : INK, 2.5);
  ctx.restore();
}

// ---------- THE FACTORY (13.18 → 243.6) ----------
function factoryBack(ctx, e, t, mt, pal, U, kick, snare, hat, bass) {
  const s = e.s, camx = proj(0, 0).x, par = k => camx * k;      // parallax: a layer at depth k moves k as fast as the course
  const dark = span(t, 175.19, 178.33) ? fade(t, 175.19, 178.33, 0.25, 0.4) : 0, still = span(t, 203.6, 206.2) ? fade(t, 203.6, 206.2, 0.4, 0.3) : 0;
  const roof = t >= 206.6, deli = D.zoneAt(t) === 'deli', cb = !SET && t > 233.56 ? clamp((t - 233.56) / 6) : 0;   // (set strip: no cardboard reveal, an old beat)   // cb: the cardboard showing (after the real FACT)
  // the back wall: panels + seams (or the deli's white tile, or the night sky over the roof)
  if (roof) { ctx.fillStyle = '#121828'; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { ctx.fillStyle = '#e8ecff'; ctx.globalAlpha = 0.4 + 0.4 * rnd(i, 3); ctx.fillRect((rnd(i, 1) * W * 1.4 + par(0.04)) % W, rnd(i, 2) * H * 0.5, 2, 2); } ctx.globalAlpha = 1; }
  else { ctx.fillStyle = pal.wall; ctx.fillRect(0, 0, W, H); const pw = 150, o = ((par(0.22) % pw) + pw) % pw;
    // Chat's wall textures, washed toward the zone's palette so the run line (the belt) stays the brightest, clearest thing
    const z = D.zoneAt(SET ? clamp(t, 13.5, 241.2) : t), WT = { intake: ['tile_metal', 300, 0.5], stamp: ['tile_metal', 300, 0.5], catwalk: ['tile_corrugated', 210, 0.62], drop: ['tile_corrugated', 210, 0.62],
      wing: ['tile_corrugated', 210, 0.42], upper: ['tile_corrugated', 210, 0.42], furnace: ['tile_furnace', 240, 0.88], deli: ['tile_deli', 228, 0.12], fold: ['tile_cardboard_back', 260, 0.45] }[z];
    if (WT && tile(ctx, WT[0], 0, 0, W, H, WT[1], par(0.22), 0, pal.wall, WT[2])) { /* the tile has its own panels / seams */ }
    else if (deli) { ctx.strokeStyle = '#b9b09c'; ctx.lineWidth = 2; for (let x = o - pw; x < W; x += 38) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
    else { for (let x = o - pw; x < W; x += pw) { ctx.fillStyle = pal.wall2; ctx.fillRect(x + pw * 0.7, 0, pw * 0.3, H); ctx.fillStyle = INK; ctx.globalAlpha = 0.5; ctx.fillRect(x, 0, 3, H); ctx.globalAlpha = 1;
      for (let y = 30; y < H; y += 90) circ(ctx, x + 10, y, 2.5, pal.metal, 0); } } }
  // the reactor far behind (his power): a glow through the high windows from 148.27, brighter on 159.53, through the roof from 206.93
  const rk = t < 148.27 ? 0 : clamp((t - 148.27) / 1.5) * (0.35 + 0.25 * (t > 159.53) + 0.4 * roof) * (1 - 0.8 * dark) + (span(t, 223.5, 225.6) ? 0.4 * Math.max(...[223.5, 224.06, 224.56, 225.03].map(a => t >= a ? Math.exp(-(t - a) / 0.2) : 0)) : 0) + (t >= 228.287 && t < 229.3 ? 0.6 * Math.exp(-(t - 228.287) / 0.3) : 0);
  if (roof) reactor(ctx, t, rk, bass, par);
  else { // the high windows
    const wy0 = H * 0.06, wy1 = H * 0.2, ww = 110, o = ((par(0.12) % 180) + 180) % 180;
    for (let x = o - 180; x < W; x += 180) { box(ctx, x + 20, wy0, ww, wy1 - wy0, rk > 0 ? mix('#1a1410', '#ff9a3c', rk * (0.6 + 0.4 * bass)) : '#0e1420', { ink: 3 });
      ctx.fillStyle = INK; ctx.fillRect(x + 20 + ww / 2 - 1.5, wy0, 3, wy1 - wy0); ctx.fillRect(x + 20, (wy0 + wy1) / 2 - 1.5, ww, 3); } }
  // the far machines: a row of big presses, heads twitching on the kick (frozen in the breaks)
  if (!roof) { const sp = 260, o = ((par(0.4) % sp) + sp) % sp, baseY = H * 0.58;
    for (let x = o - sp, i = Math.floor(-par(0.4) / sp); x < W + sp; x += sp, i++) { const bob = 14 * kick * (i % 2 ? 1 : 0.6) + 6 * Math.sin(mt * 3 + i);
      box(ctx, x + 30, H * 0.2, 26, baseY - H * 0.2, pal.metal2, { ink: 3 }); box(ctx, x + 110, H * 0.2, 26, baseY - H * 0.2, pal.metal2, { ink: 3 });
      box(ctx, x + 22, H * 0.2 - 10, 122, 34, pal.metal, { ink: 3, band: pal.metal2 });
      box(ctx, x + 60, H * 0.2 + 24, 46, 50 + bob, '#3b4250', { ink: 3 }); box(ctx, x + 44, H * 0.2 + 74 + bob, 78, 34, pal.metal, { ink: 3, band: pal.metal2 }); stripes(ctx, x + 46, H * 0.2 + 100 + bob, 74, 7, HAZ, INK, 7);
      if (snare > 0.6 && rnd(i, Math.floor(mt * 4)) < 0.5) { ctx.save(); ctx.globalAlpha = 0.5 * snare; circ(ctx, x + 83, H * 0.2 + 116 + bob, 16 * snare, '#f4efe4', 0); ctx.restore(); }
      if (cb > 0) { ctx.save(); ctx.globalAlpha = cb * 0.85; ctx.fillStyle = CARD2; ctx.fillRect(x + 22, H * 0.2 - 10, 6, 34); ctx.fillRect(x + 140, H * 0.2 - 10, 4, 34); ctx.restore(); } } }
  // the output conveyor (what he ships rides away up here) + the signs with chase lights on the hats
  if (!roof) { const by = H * 0.47, o = par(0.55); ctx.fillStyle = '#20252e'; ctx.fillRect(0, by, W, 16); stripes(ctx, 0, by + 16, W, 5, HAZ, INK, 10); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(-4, by, W + 8, 21);
    const n = SET ? 9 : shipped(t); for (let k = 0; k < 9; k++) {   // (set strip: plain boxes ride the belt all song, not the LIES SHIPPED count)
      const x = ((k * 140 - o - mt * 40) % (W + 140) + W + 140) % (W + 140) - 70; if (k >= n) continue;
      box(ctx, x - 4, by - 38, 48, 38, mix(DECOR, pal.wall, 0.2), { ink: 2.5, band: DECOR2 }); const sung = liesSung(t); if (SET || !sung.length) continue;   // (set strip: no lie decals / labels on them)   // (rework: décor cardboard washed out: only what he must jump is bright)
      const [, dec, lb] = sung[(k + Math.floor(n / 3)) % sung.length]; if (!(dec && pic(ctx, dec, x + 20, by - 19, 34, 32, { a: 0.55 }))) txt(ctx, lb.length > 5 ? lb.slice(0, 5) : lb, x + 20, by - 19, 8, INK, { a: 0.6 }); } }
  // the hopper on the back wall (Kevin's questions go in, become the next crate) — intake zone only
  if (!SET && t < 62.95) { const hp = {   // (set strip: Kevin's questions into the hopper are old story)
    x: bgx(13.4, 0.7, t, 0.4), y: proj(0, 3.7).y }; if (hp.x > -200 && hp.x < W + 200) hopper(ctx, hp.x, hp.y, t, pal); }
  // ---- the zone set pieces in the background ----
  backSet(ctx, e, t, mt, pal, U, kick, bass, par, rk);
  // the story stickers (Matt: "large so we can see, but a bit transparent"), behind the belt, the crates and him
  if (!SET) stickerLayer(ctx, e, t, U, kick, roof, deli, dark);   // (set strip: the story stickers + Kevin's sticker (Chikin: "the assets are supposed to go away"); the crew re-picks)
  // LIES SHIPPED: the counter on the wall + the output stack under it (left: what's behind him)
  if (!BLANK_Q) liesCounter(ctx, t, pal);   // (?blank: no counter — D-20261103-24)
  // the dark (175.19 → 178.33): lights out, only the bass glow
  if (dark > 0) { ctx.fillStyle = '#05060a'; ctx.globalAlpha = 0.86 * dark; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; glow(ctx, W * 0.6, H * 0.8, 220, '#ff6a2a', dark * 0.25 * (0.3 + bass)); }
  if (still > 0) { ctx.fillStyle = '#0b0d14'; ctx.globalAlpha = 0.35 * still; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}
// ---------- THE STORY STICKERS (rework §2): the song's own sticker set, each slapped on the wall on its sung word ----------
// Review fix (Nov 2 late): BIG (from just under the lyric band down into the belt, 240 px to half the screen tall, up to 42% of
// the width) and see-through (0.42), in front of the back-wall machines, behind the belt, the crates and Potato. ONE at a time:
// a sticker whose word comes < 0.9 s after the one on the wall is skipped, and each peels off before the next slaps on. Its top
// 14% fades out (the lyric band) and its bottom 24% melts into the belt. Never Bezos (a real person's likeness) and not Einstein
// (his estate enforces his likeness; Matt plans to sell the game): the fax sticker covers that moment. Kevin's own sticker comes in
// on "Kevin?" (145.52), gets worried on "Kevin?!" (146.71), SCARED on 147.09 (the same scared face as the kidnapped Kevin, shaking)
// and breaks up into the factory's green binary on "HE'S" (147.82): he's in the data now.
const STK_BASE = new URL('../../play/stickers-ci2/', import.meta.url).href, STK_IMG = {}, STK_FADE = {};
const KEVIN_STK = 145.52, KEVIN_WORRY = 146.71, KEVIN_SCARE = 147.09, KEVIN_SHRED = 147.82, STK_GAP = 0.9, STK_TOP = 104;
const STICKS = (() => { const out = [], seen = {};
  for (const [st, key] of [...CI_STICKERS, [KEVIN_STK, 'kevin']].sort((a, b) => a[0] - b[0])) {
    if (key === 'bezos' || key === 'einstein' || st < 13.18 || st > 241.0) continue;
    if (key !== 'kevin' && st > KEVIN_STK - 0.3 && st < KEVIN_SHRED + 0.6) continue;   // ("Kevin?" is his sticker's moment alone)
    if (seen[key] != null && st - seen[key] < 20) continue;
    const prev = out[out.length - 1]; if (prev && st - prev.t < STK_GAP && key !== 'kevin') continue;   // (STK_GAP 0.9: the newer word cuts the older sticker off)   // (one at a time)
    seen[key] = st; out.push({ t: st, key }); }
  out.forEach((o, i) => { const n1 = out[i + 1]; o.end = o.key === 'kevin' ? KEVIN_SHRED + 0.6 : Math.min(o.t + 3.5, n1 ? n1.t - 0.02 : 1e9); });
  return out; })();
function stkImg(key) { if (typeof Image === 'undefined') return null; let im = STK_IMG[key]; if (!im) { im = STK_IMG[key] = new Image(); im.decoding = 'async'; im.src = STK_BASE + key + '.webp'; }
  if (!(im.complete && im.naturalWidth > 0)) return null;
  // its top 14% and bottom 24% fade to nothing, baked once into a canvas (clear of the lyric band; melts into the belt)
  let c = STK_FADE[key]; if (!c && typeof document !== 'undefined') { c = STK_FADE[key] = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'destination-in'; const gr = g.createLinearGradient(0, 0, 0, c.height);
    gr.addColorStop(0, 'rgba(0,0,0,0.15)'); gr.addColorStop(0.14, '#000'); gr.addColorStop(0.76, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); }
  return c || im; }
// Kevin's sticker with the scared (or worried) face painted on, redrawn each frame (the eyes tremble, the sweat flies)
let STK_KEV = null;
function kevinStk(im, t) { if (typeof document === 'undefined') return im; const lv = t >= KEVIN_SCARE ? 'scared' : t >= KEVIN_WORRY ? 'worried' : null; if (!lv) return im;
  if (!STK_KEV) { STK_KEV = document.createElement('canvas'); STK_KEV.width = im.width; STK_KEV.height = im.height; }
  const g = STK_KEV.getContext('2d'); g.clearRect(0, 0, im.width, im.height); g.drawImage(im, 0, 0); scaredFace(g, 'stk', { x0: 0, y0: 0, k: im.width / 512 }, t, lv); return STK_KEV; }
let STK_SEEN = 0;
function stickerLayer(ctx, e, t, U, kick, roof, deli, dark) {
  if (t < 13.18 || t >= 241.3) return; if (!STK_SEEN) { STK_SEEN = 1; STICKS.forEach(o => stkImg(o.key)); }
  const s = e.s, fl = floorTop(s.x, t), beltTop = proj(s.x, fl).y, H0 = clamp(beltTop + 10 - STK_TOP, 240, H * 0.5), base = (deli ? 0.30 : roof ? 0.50 : 0.42) * (1 - 0.7 * dark);
  const me = proj(s.x, s.y + 0.6), meR = U * 0.9;
  for (const o of STICKS) { if (t < o.t - 0.02 || t > o.end) continue; let im = stkImg(o.key); if (!im) continue;
    const u = t - o.t, inK = clamp(u / 0.22), sc0 = inK < 0.6 ? lerp(0.6, 1.06, inK / 0.6) : lerp(1.06, 1.0, (inK - 0.6) / 0.4), out = o.key === 'kevin' ? 0 : clamp((t - (o.end - 0.3)) / 0.3);
    const sc = sc0 * (1 - 0.08 * out) * (1 + 0.02 * kick);
    let h = H0 * sc, w = h * im.width / im.height; if (w > W * 0.42 * sc) { w = W * 0.42 * sc; h = w * im.height / im.width; }
    const cx = W * 0.62 - out * 40, top = clamp(beltTop + 10 - H0, STK_TOP, 170) + (H0 - h) * 0.5, rot = (lerp(-6, -2, inK) + 8 * out + (o.key.length % 3 - 1) * 1.5) * Math.PI / 180;
    let a = base * (1 - out);
    // he's never hidden behind one: when his screen box (a launch apex) overlaps it, it eases off to 0.15
    if (me.x + meR > cx - w / 2 && me.x - meR < cx + w / 2 && me.y + meR > top && me.y - meR < top + h) a = Math.min(a, 0.15);
    if (o.key === 'kevin') { im = kevinStk(im, t); if (t >= KEVIN_SHRED) { kevinShred(ctx, im, cx, top, w, h, rot, t - KEVIN_SHRED, Math.max(base, 0.5)); continue; } a = Math.max(a, 0.5); }
    const shake = o.key === 'kevin' && t >= KEVIN_SCARE ? [Math.sin(t * 2 * Math.PI * 30) * 4, Math.cos(t * 2 * Math.PI * 23) * 2] : [0, 0];
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx + shake[0], top + h / 2 + shake[1]); ctx.rotate(rot); ctx.drawImage(im, -w / 2, -h / 2, w, h);
    if (u < 0.08) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (1 - u / 0.08); ctx.fillStyle = '#ffffff'; ctx.fillRect(-w / 2, -h / 2, w, h * 0.8); }
    ctx.restore(); }
}
// Kevin's sticker, taken into the data on "HE'S": it tears into strips that slide apart and turn into falling green 0s and 1s
function kevinShred(ctx, im, cx, top, w, h, rot, k, a0) {
  const n = 9, gone = clamp(k / 0.6); ctx.save(); ctx.translate(cx, top + h / 2); ctx.rotate(rot);
  for (let i = 0; i < n; i++) { const y0 = -h / 2 + i * h / n, dx = (rnd(i, 3) - 0.5) * 80 * gone + Math.sin(k * 40 + i) * 6 * gone; ctx.save(); ctx.globalAlpha = a0 * (1 - gone) * (0.7 + 0.3 * rnd(i, 4));
    ctx.drawImage(im, 0, i * im.height / n, im.width, im.height / n, -w / 2 + dx, y0, w, h / n + 0.5); ctx.restore(); }
  ctx.font = `400 14px ${MONO}`; ctx.fillStyle = GREEN; ctx.textAlign = 'center';
  for (let i = 0; i < 70; i++) { const x = -w / 2 + rnd(i, 1) * w, y = -h / 2 + rnd(i, 2) * h * 0.8 + k * (120 + 200 * rnd(i, 5)); ctx.globalAlpha = Math.min(1, k * 5) * (1 - clamp((k - 0.25) / 0.35)) * 0.8;
    ctx.fillText(rnd(i, Math.floor(k * 24)) < 0.5 ? '0' : '1', x, y); }
  ctx.restore(); }
function reactor(ctx, t, rk, bass, par) {
  const x = W * 0.72 + (X(206.93) - X(t)) * ppu() * 0.03, y = H * 0.36;                                  // far, through the open roof
  glow(ctx, x, y, 260 + 80 * bass, '#fff2a8', 0.25 + 0.4 * rk);
  box(ctx, x - 60, y - 40, 120, H * 0.6, '#3a4058', { ink: 4, band: '#2c3146' }); for (let i = 0; i < 5; i++) stripes(ctx, x - 60, y - 10 + i * 46, 120, 8, '#fff2a8', INK, 10);
  poly(ctx, [[x - 90, y - 40], [x + 90, y - 40], [x + 60, y - 90], [x - 60, y - 90]], '#4a5070', 4); circ(ctx, x, y - 110, 34, mix('#c8b860', '#fffbe0', rk), 4);
  glow(ctx, x, y - 110, 90 + 60 * rk, '#fff6c0', 0.5 + 0.5 * rk);
  pic(ctx, 'picto_lightning', x, y + 58, 74, 74);                                                     // the malfunctioning reactor's hazard plate
  ctx.fillStyle = '#0d1120'; ctx.fillRect(0, H * 0.74, W, H); }
function hopper(ctx, x, y, t, pal) {
  poly(ctx, [[x - 90, y - 70], [x + 90, y - 70], [x + 26, y + 10], [x - 26, y + 10]], pal.metal, 4, 7); box(ctx, x - 26, y + 10, 52, 60, pal.metal2, { ink: 3 });
  stripes(ctx, x - 90, y - 76, 180, 10, HAZ, INK, 9);
  // letters pouring in: the question (13.18 → 14.4) and every one of Kevin's later ones
  for (const [a, b, who, text] of D.MESSAGES) { if (who !== 'kevin' || text === '…') continue; const t0 = a < 0 ? 13.18 : b, k = (t - t0) / 1.1; if (k < 0 || k > 1) continue;
    const chars = [...(a < 0 ? D.MSG1.slice(0, 44) : text)]; chars.forEach((c, i) => { const u = clamp(k * 1.6 - i / chars.length * 0.6); if (u <= 0 || u >= 1) return;
      const sx = a < 0 ? x - 330 + i * 9 : 40 + i * 9, sy = a < 0 ? y + 150 : 90; txt(ctx, u > 0.5 ? (rnd(i, Math.floor(t * 20)) < 0.5 ? '0' : '1') : c, lerp(sx, x, u * u), lerp(sy, y - 60, u), 13, u > 0.5 ? GREEN : INK); }); } }
function liesCounter(ctx, t, pal, front = false) {
  if (!!front !== (t >= 148.52)) return;   // (once it hangs under the catwalk it's drawn in front of the deck: see over())
  if (front === true && span(t, 175.19, 178.33)) { ctx.save(); ctx.globalAlpha = 1 - 0.85 * fade(t, 175.19, 178.33, 0.25, 0.4); liesCounter(ctx, t, pal, 'dim'); ctx.restore(); return; }   // (the dark: only Mom's message is lit)
  if (front === 'dim') front = true;
  // (from the grab on, Kevin's crate + its monitor ride at the left: the counter and its stack slide over to the right wall on the drop)
  if (t < 14.0 || t > 241.3) return; const n = shipped(t), rolled = t >= 199.99 && t < 202.12, sign = art('sign_lies_shipped'), w = 196, h = sign ? Math.round(w * sign.naturalHeight / sign.naturalWidth) : 70,
    // (the painted sign keeps the old box's width and hangs higher, clear of his run spot: fix-pass review, it covered him at 280 wide)
    sl = ease((t - 148.27) / 0.5), x = lerp(14, W - w - 14, sl), y = lerp(sign ? 106 : 128, H - h - 22, sl);   // (on the upper floors: hung under the catwalk, bottom right)
  if (sign) {   // Chat's painted LIES SHIPPED sign; the counter's four flip digits sit in its empty right third
    if (OLD_WHITE) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8); ctx.restore(); } ctx.drawImage(sign, x, y, w, h);   // (the old white edge only with ?border=, D-20261105-09)
    const shown = rolled ? (Math.floor(t * 30) % 2 ? '0000' : '9999') : String(Math.min(9999, n)).padStart(4, '0'), dw = 13, dx = x + w * 0.665;
    for (let i = 0; i < 4; i++) { box(ctx, dx + i * (dw + 1.5), y + h * 0.2, dw, h * 0.6, '#0b0c0f', { ink: 1.5 }); txt(ctx, shown[i], dx + i * (dw + 1.5) + dw / 2, y + h * 0.5, 11, '#fff2dc'); } }
  else { box(ctx, x, y, w, h, '#1b1d22', { border: 8, ink: 4 }); stripes(ctx, x, y, w, 9, HAZ, INK, 8);
  txt(ctx, 'lies shipped', x + w / 2, y + 22, 13, HAZ);
  const shown = rolled ? (Math.floor(t * 30) % 2 ? '000000' : '999999') : String(n).padStart(6, '0');
  for (let i = 0; i < 6; i++) { box(ctx, x + 14 + i * 29, y + 34, 25, 28, '#0b0c0f', { ink: 2 }); txt(ctx, shown[i], x + 26 + i * 29, y + 49, 17, '#fff2dc'); } }
  // the output stack: a crate for every few lies, up from the floor behind him
  const rowsN = Math.min(9, Math.floor(n / 6)); for (let i = 0; i < rowsN; i++) for (let j = 0; j < (i % 2 ? 2 : 3); j++) { const bx = sl > 0.5 ? x - 150 + j * 44 + (i % 2) * 22 : x - 4 + j * 44 + (i % 2) * 22, byy = sl > 0.5 ? H - 52 - i * 30 : H * 0.64 - 34 - i * 30; if (sl > 0.5 ? byy < H * 0.7 || bx + 42 > x - 6 : byy < y + h + 6) continue;
    box(ctx, bx, byy, 42, 30, t > 241.0 ? CARD : mix(DECOR, pal.wall, 0.25), { ink: 2.5, band: DECOR2 }); }
}
// ---- the set pieces that live on the back wall (by zone, with their set-ups before the drops) ----
function backSet(ctx, e, t, mt, pal, U, kick, bass, par, rk) {
  const s = e.s;
  // (set strip (Chikin: "the assets are supposed to go away"): every set piece below is an old-story prop / sign / gag / character and is off in the set (!SET);
  //  only the chorus spotlights stay: they are the factory's lighting on the music)
  // 22.91 → 24.03: the stamp press rises on "fax", slams on "battle" (it drops the YAK crate) — in front (see over)
  // 31.75 → 32.14: a sign flickers, lights on the small drop; signs light one at a time through the intake
  if (!SET && t > 14.4 && t < 62.95) { const sx = proj(X(30.0), 3.6);   /* (review fix: was 5.4 — DAYS WITHOUT A FACT sat on the lyric) */ for (let i = 0; i < 4; i++) { const on = t > [18.42, 24.78, 32.14, 40.78][i] || (i === 2 && t > 31.75 && rnd(Math.floor(t * 18), 3) < 0.5);
      const x = sx.x + i * 230, y = sx.y; if (x < -200 || x > W + 50) continue; box(ctx, x, y, 170, 44, on ? '#2a1f12' : '#15171c', { ink: 3, border: 6 });
      for (let b = 0; b < 12; b++) circ(ctx, x + 8 + b * 14, y - 6, 3.2, on && (b + Math.floor(t * 10)) % 3 !== 0 ? HAZ : '#4a4636', 1);
      txt(ctx, ['SAFETY FIRST', 'QUALITY CHECKED', 'ANY ANSWER', 'NO DOUBTS'][i], x + 85, y + 22, 13, on ? '#ffd27a' : '#5a5648'); }
    const dx = sx.x + 4 * 230 + 20; if (dx > -260 && dx < W + 20) pic(ctx, 'sign_days', dx + 115, sx.y + 22, 240, 60); }   // Chat's DAYS WITHOUT A FACT: 0, on the intake wall
  // 45.2 → 50.2: DR. GARY assembles in 4 background slams (a cardboard standee: a scientist, no hands)
  if (!SET && t > 44.6 && t < 56) { const p = proj(X(50.0), 0), k = [45.8, 46.98, 48.17, 48.87].filter(a => t >= a).length; standee(ctx, p.x, p.y, U, k, t); }
  // 55.45 → 55.84: the spaghetti vat starts to bubble (background), boils over on the drop
  // 60.13 → 63.03: the giant presses lift (set-up), PO-TA-TO: three slams
  if (!SET && t > 59.5 && t < 66) for (let i = 0; i < 3; i++) { const a = [62.65, 62.82, 63.03][i], p = { x: W * 0.5 + i * 170 + (X(62.82) - X(t)) * U * 0.4, y: proj(0, 0).y }, lift = clamp((t - 60.13) / 2.2), slam = t >= a ? Math.exp(-(t - a) / 0.15) : 0;
    const hy = p.y - U * (7.5 - 4.5 * (t >= a ? 1 : 0) + 3 * (1 - lift)); box(ctx, p.x - 18, 0, 36, hy, pal.metal2, { ink: 3 }); box(ctx, p.x - 70, hy, 140, 64, pal.metal, { ink: 4, band: pal.metal2, border: 6 });
    stripes(ctx, p.x - 66, hy + 50, 132, 11, HAZ, INK, 10); circ(ctx, p.x, hy + 26, 9, t >= a ? '#ffd27a' : '#5a4a32', 3); if (slam) glow(ctx, p.x, hy + 70, 120, '#ffd27a', slam * 0.7); }
  // 71.2 → 74.77: the QC booth lowers on chains, lamp sweeping, the mascot glaring; CAPTAIN stamps a captain's hat on it
  if (!SET && t > 70.6 && t < 80) { const p = proj(X(74.3) + 3.2, F2top()), drop = ease((t - 71.2) / 1.2), y = p.y - U * (9.5 - 6.5 * drop); qcBooth(ctx, p.x, y, t, U, t >= 74.62); }
  // 78.6 → 79.54: restaurant awnings roll out (set-up), snap open on the drop
  if (!SET && t > 78.0 && t < 84) for (let i = 0; i < 3; i++) { const p = proj(X(79.6) + i * 4.2, F2top() + 3.2), k = t < 79.543 ? 0.35 * clamp((t - 78.6) / 0.9) : 1;
    ctx.save(); for (let j = 0; j < 5; j++) { ctx.fillStyle = j % 2 ? '#fff6e0' : ['#d9443a', '#2f7d4a', '#2a5fa8'][i]; ctx.fillRect(p.x + j * 22, p.y, 22, 46 * k); } ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(p.x, p.y, 110, 46 * k);
    for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.arc(p.x + 11 + j * 22, p.y + 46 * k, 11, 0, Math.PI); ctx.fillStyle = j % 2 ? '#fff6e0' : ['#d9443a', '#2f7d4a', '#2a5fa8'][i]; ctx.fill(); ctx.stroke(); } ctx.restore(); }
  // 86.2: chorus lights (spots sweep on the beat)
  if (t > 86.2 && t < 97.8 || t > 206.93 && t < 232) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const x0 = W * (0.15 + 0.24 * i), sx = x0 + Math.sin(mt * 1.2 + i * 1.7) * 180;
    const g = ctx.createLinearGradient(x0, 0, sx, H); g.addColorStop(0, `rgba(255,214,140,${0.16 + 0.15 * kick})`); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 8, 0); ctx.lineTo(x0 + 8, 0); ctx.lineTo(sx + 90, H); ctx.lineTo(sx - 90, H); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  // 97.83 → 107.39: the second wing switches on (more machines lit) — the windows already glow with the zone
  // 113.9 → 115.09: the inspector robot rolls in (in front), 118.9 Stephanie's papers (in front)
  // 127.3 → 129.31: the journal in silence — the background holds its breath (the freeze)
  // 140.0 → 144.9: the population counter (warms up 140.0, wakes 140.57, 7 → 17,000,000,000)
  // (rework stills: it used to hang on to 147.82 right over Kevin's sticker; now it fades as "Kevin?" lands, so his sticker has the wall)
  if (!SET && t > 139.5 && t < 145.62) { ctx.save(); ctx.globalAlpha = 1 - clamp((t - 145.32) / 0.3); popCounter(ctx, W * 0.64 + Math.sin(t * 0.3) * 8, H * 0.33, t); ctx.restore(); }
  // 148.27 → : furnace doors (cracked 158.50, blasted open 159.53)
  if (!SET && t > 154 && t < 175.2) { const p = proj(0, F3top()); furnace(ctx, W * 0.66 + (X(159.53) - X(t)) * U * 0.35, p.y, t, U, bass); }
  // 185.0 → 186.17: the robo-raccoon on the KNOWLEDGE shelf, kicks it on the drop (the falling crates are in front)
  if (!SET && t > 184 && t < 190) { const p = proj(0, F2top() + 3.2); knowledgeShelf(ctx, bgx(186.17, 0.62, t, 0.5), p.y, t, U); }
  // 192.55 → 195.63: the mountain crate moulds in the break, then EVEREST (the layers are the ledges, painted in front)
  // 204.0 → 206.93: the roof hatch opens above the summit
  if (!SET && t > 203.5 && t < 207.5) { const p = proj(X(205.0), SUMMIT() + 5.4), k = clamp((t - 204.0) / 2.6); box(ctx, p.x - 140, p.y - 20, 280, 40, '#0e1220', { ink: 3 });
    ctx.save(); ctx.fillStyle = '#121a30'; ctx.fillRect(p.x - 140, p.y - 20, 280 * k, 40); ctx.restore(); box(ctx, p.x - 140 + 280 * k, p.y - 24, 140, 48, pal.metal, { ink: 3, band: pal.metal2 }); box(ctx, p.x - 280 + 280 * (1 - k), p.y - 24, 140, 48, pal.metal, { ink: 3, band: pal.metal2 }); }
  // 231.30: browser shutters slam down all over the factory (the outside world hiding from him)
  if (!SET && t > 231.15 && t < 241.3) { const k = clamp((t - 231.15) / 0.15); for (let i = 0; i < 5; i++) { const x = 60 + i * 190, y0 = 40 + 30 * (i % 2), hh = 150 * k;
    box(ctx, x, y0, 150, hh, '#e9e9ee', { ink: 3 }); box(ctx, x, y0, 150, Math.min(hh, 20), '#c8c9d4', { ink: 2 }); for (let j = 0; j < 3; j++) circ(ctx, x + 12 + j * 14, y0 + 10, 4, ['#ff6a5a', '#ffcf4a', '#4dd07a'][j], 1.5);
    if (hh > 60) for (let r = 0; r < 4; r++) { ctx.fillStyle = '#b8b9c6'; ctx.fillRect(x + 14, y0 + 34 + r * 26, 122, 8); } } }
  // 232.13: spotlights on INVESTIGATE
  if (!SET && t > 232.13 && t < 233.6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * fade(t, 232.13, 233.6, 0.05, 0.5); for (const sx of [0.2, 0.5, 0.8]) { ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(W * sx - 10, 0); ctx.lineTo(W * sx + 10, 0); ctx.lineTo(e.px + 70, H * 0.7); ctx.lineTo(e.px - 70, H * 0.7); ctx.fill(); } ctx.restore(); }
  // 233.75 → 237.70: Cornelius moulds in 4 hits (DR / CORN / BEEF / III) — his hat brim is the ledge he runs along; painted back showing
  if (!SET && t > 233.6 && t < 241.3) { const p = { x: bgx(236.0, 0.55, t, 0.3), y: proj(0, ROOFY()).y }, k = [233.92, 235.17, 235.6, 236.46].filter(a => t >= a).length; cornelius(ctx, p.x, p.y, U, k, t); }
  // 237.7 → 240.97: the MIT arch (a generic columned arch) — snaps on UP
  if (!SET && t > 236.0 && t < 241.3) { const p = { x: bgx(239.6, 0.5, t, 0.45), y: proj(0, ROOFY()).y }; mitArch(ctx, p.x, p.y, U * 0.6, t); }
}
const F2top = () => D.F2, F3top = () => D.F3, SUMMIT = () => D.SUMMIT, ROOFY = () => D.ROOF;
function standee(ctx, x, y, U, k, t) { if (k <= 0) return; const sc = U / 60, top = y - 300 * sc; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  const jolt = [45.8, 46.98, 48.17, 48.87].some(a => t >= a && t < a + 0.12) ? (rnd(Math.floor(t * 40), 1) - 0.5) * 8 : 0; ctx.translate(jolt, 0);
  if (k >= 1) { box(ctx, -60, -150, 120, 150, '#f4f1ea', { ink: 4, band: '#d6d0c2', border: 8 }); for (let i = 0; i < 3; i++) circ(ctx, -20 + i * 20, -110 + i * 26, 4, INK, 0); }   // lab coat (no arms, no hands)
  if (k >= 2) { circ(ctx, 0, -200, 52, '#f2c79a', 4); ctx.fillStyle = '#e9e6dc'; ctx.beginPath(); ctx.arc(-40, -228, 26, 0, 7); ctx.arc(40, -228, 26, 0, 7); ctx.fill(); }
  if (k >= 3) { for (const dx of [-20, 20]) { circ(ctx, dx, -205, 14, '#fff', 3); circ(ctx, dx + 3, -205, 5, INK, 0); } ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-34, -205); ctx.lineTo(34, -205); ctx.stroke(); }
  if (k >= 4) { ctx.beginPath(); ctx.arc(0, -175, 16, 0.2, Math.PI - 0.2); ctx.lineWidth = 4; ctx.stroke(); txt(ctx, 'DR. GARY', 0, -40, 22, INK); }
  box(ctx, -80, -6, 160, 10, CARD2, { ink: 3 }); ctx.restore(); }
function qcBooth(ctx, x, y, t, U, captain) { const sc = U / 60; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(-60, -60); ctx.lineTo(-60, -900); ctx.moveTo(60, -60); ctx.lineTo(60, -900); ctx.stroke(); ctx.setLineDash([]);
  box(ctx, -90, -60, 180, 120, '#d8dde4', { ink: 4, band: '#b9c0ca', border: 8 }); box(ctx, -70, -40, 140, 70, '#9ec7e6', { ink: 3 });
  circ(ctx, 0, 6, 26, '#ffffff', 3); circ(ctx, -9, 0, 5, INK, 0); circ(ctx, 9, 0, 5, INK, 0); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(-2, -8); ctx.moveTo(14, -12); ctx.lineTo(2, -8); ctx.stroke();   // the glaring mascot
  ctx.beginPath(); ctx.moveTo(-8, 18); ctx.lineTo(8, 18); ctx.stroke(); txt(ctx, 'QC', 0, 46, 18, INK);
  pic(ctx, 'sign_quality', 0, 92, 220, 56);                                                                                    // Chat's QUALITY CONTROL plate, hung under the booth (clear of the lyrics)
  if (t >= 72.4 && t < 74.62) stampArt(ctx, 'stamp_rejected', 0, -6, 150, clamp((t - 72.4) / 0.2), -0.12);                      // "Actually, Potato, that doesn't seem true." — REJECTED (until CAPTAIN)
  if (captain) { const k = clamp((t - 74.62) / 0.15); ctx.save(); ctx.translate(0, -26 - 40 * (1 - k)); poly(ctx, [[-30, 0], [30, 0], [24, -18], [-24, -18]], '#1d2a4a', 3); box(ctx, -32, -4, 64, 8, INK, { ink: 0 }); circ(ctx, 0, -10, 5, HAZ, 1.5); ctx.restore(); }
  const a = Math.sin(t * 3) * 0.6; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3; ctx.fillStyle = t < 73.5 ? '#ffd27a' : t < 74.62 ? '#ff6a3a' : '#7dff9a';
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(-90 + a * 120, 360); ctx.lineTo(60 + a * 120, 360); ctx.fill(); ctx.restore(); ctx.restore(); }
function popCounter(ctx, x, y, t) { const k = t < 140.57 ? 0.3 + 0.2 * (rnd(Math.floor(t * 12), 2) < 0.5) : 1;
  const v = t < 142.54 ? 0 : t < 143.80 ? 7 : 17000000000, spin = t > 143.2 && t < 143.8; const shown = spin ? String(Math.floor(rnd(Math.floor(t * 30), 3) * 1e10)) : v.toLocaleString('en-US');
  ctx.save(); ctx.globalAlpha *= k; box(ctx, x - 190, y - 34, 380, 68, '#101318', { border: 8, ink: 4 }); txt(ctx, shown, x, y, shown.length > 12 ? 26 : 34, '#ffcf4a', {}); ctx.restore(); }
function furnace(ctx, x, y, t, U, bass) { const sc = U / 60, crack = t > 158.5 ? (t < 159.531 ? 0.12 : 1) : 0, open = t < 159.531 ? crack * 0.12 : ease((t - 159.531) / 0.2);
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); box(ctx, -170, -330, 340, 330, '#3b2418', { ink: 4, band: '#2c1a10' });
  glow(ctx, 0, -150, 160 + 60 * bass, '#ff7a2e', 0.2 + 0.6 * open); ctx.fillStyle = mix('#200a04', '#ffb347', open); ctx.fillRect(-120, -270, 240, 250);
  const dw = 120 * (1 - open); box(ctx, -120, -270, dw, 250, '#6a3d2a', { ink: 4, band: '#55301f' }); box(ctx, 120 - dw, -270, dw, 250, '#6a3d2a', { ink: 4, band: '#55301f' });
  stripes(ctx, -170, -340, 340, 14, HAZ, INK, 12); ctx.restore(); }
function knowledgeShelf(ctx, x, y, t, U) { const sc = U / 60, kicked = t >= 186.166; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  box(ctx, -110, -8, 220, 16, '#6b4a2e', { ink: 3 }); txt(ctx, 'KNOWLEDGE', 0, 22, 14, '#ffd27a', { stroke: 4 });
  if (!kicked) for (let i = 0; i < 4; i++) box(ctx, -100 + i * 52, -50, 46, 42, CARD, { ink: 2.5, band: CARD2 });
  // the robo-raccoon: a grey bot with a mask stripe (no hands), it kicks with its tail
  const rx = 90, ry = -40, kk = kicked ? clamp((t - 186.166) / 0.2) : 0;
  if (art('turn_raccoon_side')) { pic(ctx, 'turn_raccoon_side', rx + 6, -8, 84, 76, { bottom: true, rot: -0.35 * Math.sin(kk * Math.PI) }); ctx.restore(); return; }   // Chat's robo-raccoon: the tail swing on the drop
  box(ctx, rx - 26, ry - 10, 52, 40, '#8a8f99', { ink: 3, band: '#71767f' }); circ(ctx, rx, ry - 26, 22, '#8a8f99', 3);
  ctx.fillStyle = INK; ctx.fillRect(rx - 20, ry - 32, 40, 10); circ(ctx, rx - 9, ry - 27, 3.5, '#ffcf4a', 0); circ(ctx, rx + 9, ry - 27, 3.5, '#ffcf4a', 0);
  for (const sx of [-16, 16]) poly(ctx, [[rx + sx - 8, ry - 42], [rx + sx + 8, ry - 42], [rx + sx, ry - 56]], '#8a8f99', 3);
  ctx.save(); ctx.translate(rx - 26, ry + 16); ctx.rotate(-0.4 - 1.2 * kk); for (let i = 0; i < 4; i++) box(ctx, -14 * i - 14, -6, 14, 12, i % 2 ? INK : '#8a8f99', { ink: 2 }); ctx.restore(); ctx.restore(); }
function cornelius(ctx, x, y, U, k, t) { if (k <= 0) return; const sc = U / 60, back = clamp((t - 233.56) / 2); ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  // the biggest mould: a cardboard head-and-shoulders whose top-hat brim is the ledge (13.4 = 60 px above the roof), painted back showing at the edges
  const by = -330;
  if (art('decal_cornelius_bust')) {   // Chat's Cornelius (his bust only: no name banner, the lyric says it) moulds in from the top on the four hits,
    // kept low so it never reaches the lyric band; the painted back shows at its edge after the real FACT
    const top = -180, hh = 180; ctx.save(); ctx.beginPath(); ctx.rect(-200, top - 10, 470, (hh + 12) * [0, 0.3, 0.55, 0.8, 1][Math.min(4, k)]); ctx.clip();
    pic(ctx, 'decal_cornelius_bust', 34, 0, 290, hh, { bottom: true }); for (let i = 0; i < 5; i++) { ctx.fillStyle = CARD2; ctx.globalAlpha = back; ctx.fillRect(-82 + i * 3, top + 40 + i * 26, 6, 28); } ctx.restore();
    ctx.restore(); return; }
  ctx.translate(34 * 0.7, 0); ctx.scale(0.3, 0.3);   // (the code fallback, shrunk to the art's limit: its top stays at y ≥ −180, under the lyric band)
  if (k >= 1) { box(ctx, -40, by - 260, 150, 260, '#2e3036', { ink: 4, band: '#222428', border: 8 }); }   // the top hat (over the brim)
  if (k >= 2) { circ(ctx, 34, by + 120, 110, '#f2c79a', 5); for (let i = 0; i < 6; i++) { ctx.fillStyle = CARD2; ctx.globalAlpha = back; ctx.fillRect(-80 + i * 3, by + 40 + i * 20, 6, 30); } ctx.globalAlpha = 1; }
  if (k >= 3) { for (const dx of [-6, 74]) { circ(ctx, dx, by + 100, 16, '#fff', 3); circ(ctx, dx + 4, by + 100, 6, INK, 0); } poly(ctx, [[-40, by + 160], [34, by + 140], [108, by + 160], [34, by + 176]], '#5a3a22', 3); }   // the mustache
  if (k >= 4) { box(ctx, -100, by + 236, 270, 60, '#1d2a4a', { ink: 4 }); txt(ctx, 'III', 34, by + 266, 30, HAZ); }
  ctx.restore(); }
function mitArch(ctx, x, y, U, t) { const sc = U / 60, snap = t >= 240.97 ? (t - 240.97) : -1; ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  // (a low, wide arch: its name sits under the lyric band so both read)
  const half = side => { ctx.save(); if (snap >= 0) { ctx.translate(side * snap * 140, snap * snap * 900); ctx.rotate(side * snap * 1.4); }
    box(ctx, side < 0 ? -230 : 170, -200, 60, 200, '#e9e2cc', { ink: 4, band: '#cfc6b2', border: 8 }); for (let i = 0; i < 4; i++) { ctx.fillStyle = '#cfc6b2'; ctx.fillRect((side < 0 ? -222 : 178) + i * 13, -190, 4, 180); }
    poly(ctx, side < 0 ? [[-260, -200], [0, -200], [0, -290], [-260, -290]] : [[0, -200], [260, -200], [260, -290], [0, -290]], '#e9e2cc', 4); ctx.restore(); };
  half(-1); half(1); if (snap < 0) { ctx.fillStyle = INK; ctx.fillRect(-120, -200, 4, 30); ctx.fillRect(116, -200, 4, 30); if (!pic(ctx, 'sign_mit', 0, -128, 420, 100)) { box(ctx, -165, -172, 330, 88, '#e9e2cc', { ink: 4, band: '#cfc6b2', border: 8 });
    txt(ctx, 'M.I.T.', 0, -128, 40, INK); } }   // (only the initials: the lyric sings the rest, so it's never world text; sign_mit is blanked the same way)
  ctx.restore(); }

// =====================================================================================================================
// THE FRONT LAYER (modeView): the belt, the course's things, the monitor, the bubble, Kevin, the endings
// =====================================================================================================================
export function ciView({ T, world, C, cam }) {
  CC = C; CAM = cam; V3 = new T.Vector3(); ROWS = null; preloadArt();
  const crate = { y: null, t: -99 };
  return {
    draw() {},
    over(ctx, f) {
      const { t, s } = f; if (!CC) return;
      const M = CC.music, fz = frozen(t), kick = fz ? 0 : (M ? M.kick(t) : f.kick), U = ppu(), mt = mtime(t);
      // (set strip (Chikin: "the assets are supposed to go away"): the desk intro, the dawn desk + newspaper, Kevin, his crate, the monitor's messages, the bubble,
      //  the crown, the fold and the push-through flash are the old story: in the set the belts run from 0 to the end)
      if (t >= 243.6 && !SET) { dawn(ctx, t, s); return; }
      if (t < 13.18 && !SET) { deskFront(ctx, t, s, U); bubble(ctx, t, s, U); return; }
      belts(ctx, t, s, U, mt, kick);
      courseThings(ctx, t, s, U, mt, kick);
      if (!SET) frontSet(ctx, t, s, U, mt, kick);
      if (!SET) kevinCrate(ctx, t, s, U, crate);
      if (!SET) monitor(ctx, t, s, U, crate);
      if (!BLANK_Q) liesCounter(ctx, t, palAt(t), true);   // (?blank: the hung counter goes too, D-20261103-24)
      if (!SET) bubble(ctx, t, s, U);
      if (!SET) crown(ctx, t, s, U);   // (Chikin: "The crown is an asset from a previous story")
      if (!SET && t >= 241.3) fold(ctx, t, s, U, crate);
      if (!SET && t >= 13.18 && t < 13.6) { ctx.fillStyle = '#eafff1'; ctx.globalAlpha = 1 - (t - 13.18) / 0.42; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    },
  };
}

// ---------- the desk in front of the laptop (intro): the keyboard edge under the taskbar, the slip "thanks, kevin" ----------
function deskFront(ctx, t, s, U) {
  const top = proj(s.x, 0).y; ctx.fillStyle = '#3a4250'; ctx.fillRect(0, top, W, 22 * U / 60); ctx.fillStyle = '#5a3a24'; ctx.fillRect(0, top + 22 * U / 60, W, H);
  ctx.fillStyle = '#4a2f1d'; ctx.fillRect(0, top + 22 * U / 60, W, 10); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.moveTo(0, top + 22 * U / 60); ctx.lineTo(W, top + 22 * U / 60); ctx.stroke();
  const deck = top + 22 * U / 60; poly(ctx, [[-20, deck], [W + 20, deck], [W + 20, deck + U * 2.2], [-20, deck + U * 2.2]], '#4a525e', 4);   // the laptop's keyboard deck on the desk
  for (let r = 0; r < 3; r++) for (let i = 0; i < 15; i++) { const kx = 30 + i * 62 + r * 14, ky = deck + 10 + r * U * 0.48; if (kx > W - 60) continue; box(ctx, kx, ky, 52, U * 0.36, '#262b33', { ink: 2 }); }
  box(ctx, W * 0.42, deck + U * 1.55, W * 0.16, U * 0.5, '#3d444f', { ink: 2.5 });
  const mug = proj(s.x + 10.3, 0); box(ctx, mug.x, mug.y - U * 0.9, U * 0.6, U * 0.9, '#d9443a', { ink: 3.5, border: 5, band: '#b5352d' }); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(mug.x + U * 0.65, mug.y - U * 0.45, U * 0.18, -1.3, 1.3); ctx.stroke();
  // send (−2.2): the question is digitally absorbed into his head (Matt: "so we understand why he glitches"). Each letter lifts off
  // the screen in reading order, glows, holds, then streams in an arc into his head, flipping to 0/1 halfway; "Neipal?" hangs
  // glowing on the screen and goes in last, landing on 1.134. The sign-off "thanks, -Kevin" drops onto the desk as the slip.
  const [, sent] = D.MESSAGES[0], head = proj(s.x, s.y + 1.1);
  if (t >= sent && t < NEIPAL_LAND + 0.05) { const L = laptopRect(s), CL = chatLayout(ctx, L);
    ctx.save(); ctx.font = `${CHAT_F} ${CHAT_PX}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const q of CL.ch) { if (q.lift == null || t < q.lift || t >= q.land) continue;
      const pullAt = q.neipal ? NEIPAL_PULL : q.lift + 0.6, u = t - q.lift, rise = Math.min(1, u / 0.25) * 14 + (q.neipal ? Math.sin(t * 9) * 3 : 0);
      let x = q.x, y = q.y - rise, bin = false, k = 0;
      if (t >= pullAt) { k = clamp((t - pullAt) / (q.land - pullAt)); const e = k * k; x = lerp(q.x, head.x, e); y = lerp(q.y - rise, head.y, e) - Math.sin(k * Math.PI) * 18; bin = k > 0.5; }
      const big = q.neipal ? 1.18 + 0.05 * Math.sin(t * 12) : 1.08, ch = bin ? (((q.i * 7 + Math.floor(t * 24)) % 2) ? '1' : '0') : q.c;
      ctx.save(); ctx.translate(x, y); ctx.scale(big, big); ctx.globalAlpha = k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1;
      ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#06331c'; ctx.strokeText(ch, 0, 0);          // (dark rim: it reads on the white bar and on the dark room)
      ctx.shadowColor = GREEN; ctx.shadowBlur = q.neipal ? 18 : 12; ctx.fillStyle = bin ? GREEN : '#eafff1'; ctx.fillText(ch, 0, 0); ctx.restore(); }
    ctx.restore(); }
  if (t >= sent) { const k = clamp((t - sent) / 0.7), L = laptopRect(s), CL = chatLayout(ctx, L), sg = CL.ch.filter(q => q.two), sx0 = sg.length ? (sg[0].x + sg[sg.length - 1].x) / 2 : L.x + L.w * 0.3, sy0 = sg.length ? sg[0].y : L.y + 70, p = proj(s.x + 2.2, 0.02);
    slip(ctx, lerp(sx0, p.x, k), lerp(sy0, p.y - 8, ease(k)) - Math.sin(k * Math.PI) * 30, U, (1 - k) * 0.5 + 0.12, 0); }
}
function slip(ctx, x, y, U, rot, stampK) { const sc = U / 60; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); box(ctx, -58, -14, 116, 28, PAPER, { ink: 3, border: 6 }); txt(ctx, D.MSG_SIGN, 0, 1, 13, INK, { font: '600' });
  if (stampK > 0 && !stampArt(ctx, 'stamp_source', 8, 0, 92, stampK, -0.18)) stamp(ctx, 8, 0, 26, stampK, RED, 'SOURCE'); ctx.restore(); }

// ---------- the belt: the floors' faces + treads (they step on the kick), crate faces on the ledges ----------
let treadStep = 0, treadKickT = -1;
function belts(ctx, t, s, U, mt, kick) {
  const M = CC.music; if (M) { const lk = M.lastKick(t); if (lk !== treadKickT && !frozen(t)) { treadKickT = lk; treadStep = (treadStep + 1) % 4; } }
  const cardboard = !SET && t > 233.56 ? clamp((t - 233.56) / 6) : 0;   // (set strip: the steel stays)
  for (const q of CC.solids) { if (q.kind !== 'block') continue; const led = q.step || q.pump || !!q.text, a = proj(q.x0, q.y1), b = proj(q.x1, q.y1 - (led ? q.y1 - q.y0 : 30)); if (b.x < -20 || a.x > W + 20) continue;
    if (SET && !led && q.x0 <= 0.01) a.x -= W * 2;   // (set strip: Kevin's desk used to fill the screen left of his start; the belt runs on off the left edge instead)
    if (SET && !led && q.y1 === D.ROOF) b.x += W * 2;   // (set strip: the fold + the desk at dawn used to cover where the roof runs out; the deck runs on off the right edge to the end of the song)
    let dy = 0; if (q.pump) { const ph = ((CC.beatOf(t) / (q.pumpBeats || 1)) % 1 + 1) % 1; dy = q.pump * (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)) * U; }
    const x0 = Math.max(-10, a.x), x1 = Math.min(W + 10, b.x), y0 = a.y - dy; let y1 = Math.min(H + 10, b.y - dy);
    if (led) { ledgeFace(ctx, q, a.x, y0, b.x - a.x, y1 - y0, t, U); continue; }
    if (q.y1 >= 3.5) { const pal = palAt(t), ty = y0 + U * 0.95; ctx.fillStyle = mix(pal.wall2, '#000000', 0.45); ctx.fillRect(x0, ty, x1 - x0, y1 - ty);   // a catwalk: a deck on trusses, not a wall
      ctx.strokeStyle = mix(pal.metal2, '#000000', 0.25); ctx.lineWidth = 5; ctx.beginPath(); const tw2 = U * 1.4; for (let x = a.x; x < x1; x += tw2) { if (x + tw2 < x0) continue; if (SET && x + tw2 > b.x + 1) break;   /* (set strip: the last V stopped hiding behind the old props: it ran past the catwalk's end, a stray tick on the wall) */ ctx.moveTo(x, ty); ctx.lineTo(x + tw2 / 2, ty + U * 1.1); ctx.lineTo(x + tw2, ty); } ctx.stroke();
      ctx.fillStyle = mix(pal.metal2, '#000000', 0.2); for (let x = a.x; x < x1; x += U * 4.2) if (x > x0 - 20) ctx.fillRect(x + 4, ty, 14, y1 - ty); y1 = ty; }
    // the floor: steel side + hazard band + the belt's rubber top with treads
    ctx.fillStyle = mix('#3a4048', CARD, cardboard * 0.8); ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.fillStyle = mix('#2c3138', CARD2, cardboard * 0.8); ctx.fillRect(x0, y0 + U * 0.75, x1 - x0, y1 - y0);
    if (y1 - y0 > U * 0.8) { tile(ctx, 'tile_metal', x0, y0 + U * 0.75, x1 - x0, y1 - y0 - U * 0.75, U * 2.6, a.x, y0 + U * 0.75, '#262a30', 0.74);   // the floor's riveted steel face (dark: the background stays behind it)
      if (cardboard > 0) { ctx.save(); ctx.globalAlpha = cardboard * 0.8; tile(ctx, 'tile_cardboard_back', x0, y0, x1 - x0, y1 - y0, U * 3, a.x, y0); ctx.restore(); } }   // after the real FACT: plain cardboard
    stripes(ctx, x0, y0 + U * 0.32, x1 - x0, U * 0.2, HAZ, INK, 10);
    const tw = U * 0.5, off = ((proj(0, 0).x * 0) - (X(t) * U) * 0.35 - treadStep * tw * 0.25) % tw;
    if (!tile(ctx, 'tile_belt', x0, y0, x1 - x0, U * 0.32, U * 0.64, a.x + off, y0, '#16181c', 0.3)) { ctx.fillStyle = '#16181c'; ctx.fillRect(x0, y0, x1 - x0, U * 0.32); ctx.fillStyle = '#2e3238';
    for (let x = a.x + ((off % tw) + tw) % tw; x < x1; x += tw) if (x > x0 - tw) ctx.fillRect(x, y0 + 3, tw * 0.35, U * 0.32 - 6); }
    for (let x = a.x + U * 0.6; x < x1; x += U * 1.6) if (x > x0) circ(ctx, x, y0 + U * 0.62, 3, '#6a7280', 1.5);
    ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); if (a.x > -10) { ctx.moveTo(a.x, y0); ctx.lineTo(a.x, y1); } if (b.x < W + 10) { ctx.moveTo(b.x, y0); ctx.lineTo(b.x, y1); } ctx.stroke(); }
}
const STORY_LEDGE = new Set(['wheel', 'paper', 'fake', 'bot', 'professor', 'para', 'chart', 'bread', 'lettuce', 'mountain', 'meat', 'brim']);
function ledgeFace(ctx, q, x, y, w, h, t, U) {
  const what = q.text;
  // (set strip (Chikin: "the assets are supposed to go away"): the ¶ crates, citation wheels, Stephanie's papers, the fake belt, the bots, the professor, the bar chart,
  //  the sandwich + EVEREST and Cornelius' brim are painted as the plain factory ledge; the ledge itself is the course)
  if (SET && STORY_LEDGE.has(what)) { box(ctx, x, y, w, h, '#8a8f99', { ink: 4, band: '#71767f' }); return; }   // (plain steel, a steel cel band: a kraft band read as a crate on the long ones; the pad stays)
  // stage 2's floor pieces: chain tiles over the vats (they drop away a beat after he lands: crumble), the fake belt, the bots,
  // the professor he invents (dashed until his glitch wakes it)
  if (what === 'wheel' || what === 'paper' || what === 'fake' || what === 'bot' || what === 'professor') {
    let dy = 0, a = 1; if (q.crumble && q.landed >= 0) { const seen = t - (q.landed + q.crumble * D.P); if (seen > 0) { dy = seen * seen * 14 * U; a = Math.max(0, 1 - seen * 2); } }
    if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy); const hh = Math.min(h, U * 0.6);
    if (what === 'wheel') { box(ctx, x, y, w, hh, CARD, { ink: 3.5, border: 5, band: CARD2 }); const sp = t < 78.49 ? t * 8 : 78.49 * 8;   // a citation that never loads: the loading plate
      if (!pic(ctx, 'picto_loading', x + w / 2, y + hh / 2, hh * 0.8, hh * 0.8)) { ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x + w / 2, y + hh / 2, hh * 0.28, sp, sp + 4.6); ctx.stroke(); } }
    if (what === 'paper') { const gob = t >= 119.83; box(ctx, x, y, w, hh, '#f6f4ee', { ink: 3, border: 5, band: '#e2ded2' }); ctx.fillStyle = '#b8b2a2'; for (let k = 1; k < 4; k++) ctx.fillRect(x + 8, y + k * hh / 4, w - 16, 2);
      if (gob) { ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#3a8a4a'; ctx.beginPath(); ctx.arc(x + w / 2, y + hh * 0.5, hh * 0.28, 0, 7); ctx.moveTo(x + w / 2 - hh * 0.28, y + hh * 0.3); ctx.lineTo(x + w / 2 - hh * 0.42, y + hh * 0.05); ctx.moveTo(x + w / 2 + hh * 0.28, y + hh * 0.3); ctx.lineTo(x + w / 2 + hh * 0.42, y + hh * 0.05); ctx.stroke(); ctx.restore(); } }
    if (what === 'fake') { const wob = Math.sin(t * 9 + x * 0.05) * 3; box(ctx, x, y + wob, w, hh * 0.55, '#16181c', { ink: 3.5, border: 4 }); stripes(ctx, x + 3, y + wob + hh * 0.55, w - 6, hh * 0.18, HAZ, INK, 8);
      if (q.landed >= 0 && t >= q.landed) stamp(ctx, x + w / 2, y + wob + hh * 0.28, hh * 0.32, clamp((t - q.landed) / 0.3), '#4dd07a'); }
    if (what === 'bot') { const rise = clamp((t - 215.7) / 0.71), lift = (1 - rise) * U * 2.5, lock = t >= 216.411; box(ctx, x, y + lift, w, hh * 0.7, '#9aa6a8', { ink: 3.5, band: '#7d898b', border: 5 });
      circ(ctx, x + w - 12, y + lift + hh * 0.35, 4, lock ? '#7dff9a' : '#ff6a3a', 1.5); txt(ctx, '✓', x + w / 2, y + lift + hh * 0.35, 14, INK); }
    if (what === 'professor') { const awake = q.awake >= 0 && t >= q.awake, k = awake ? clamp((t - q.awake) / 0.35) : 0;
      if (!awake) { ctx.setLineDash([6, 5]); ctx.lineWidth = 2.5; ctx.strokeStyle = '#d8d0b8'; ctx.strokeRect(x + 4, y, w - 8, hh * 0.6); ctx.setLineDash([]); }
      else { ctx.save(); ctx.translate(x, y); ctx.scale(k, 1); const L = w; box(ctx, 0, 0, L * 0.8, hh * 0.55, '#f4f1ea', { ink: 4, band: '#d6d0c2', border: 6 }); ctx.fillStyle = CARD2; ctx.fillRect(0, hh * 0.45, L * 0.8, 3);
        circ(ctx, L * 0.88, hh * 0.22, hh * 0.32, '#f2c79a', 4); box(ctx, L * 0.95, -hh * 0.15, hh * 0.18, hh * 0.6, INK, { ink: 0 }); for (const dx of [0.85, 0.9]) circ(ctx, L * dx, hh * 0.12, 2.5, INK, 0); ctx.restore(); } }
    ctx.restore(); return; }
  const col = { para: CARD, ledge: '#8a8f99', pad: '#ffcf4a', chart: ['#4dd07a', '#ffcf4a', '#ff8a5a'][Math.round((q.y1 - 8.6) / 0.6)] || '#4dd07a', bread: '#e2b46b', lettuce: '#7cc45a', mountain: '#7d8aa0', meat: '#d9534f', brim: '#2e3036' }[what] || CARD;
  if (what === 'meat' || what === 'bread' || what === 'lettuce' || what === 'mountain') { const hh = Math.min(h, U * 1.1); poly(ctx, [[x, y + 4], [x + w * 0.25, y - 3], [x + w * 0.5, y + 3], [x + w * 0.75, y - 4], [x + w, y + 2], [x + w, y + hh], [x, y + hh]], col, 4, 6);
    if (what === 'mountain') poly(ctx, [[x + w * 0.2, y + 2], [x + w * 0.45, y - U * 0.9], [x + w * 0.7, y + 2]], '#7d8aa0', 3);
    if (what === 'bread') { ctx.fillStyle = '#f3d49a'; ctx.fillRect(x + 6, y + 6, w - 12, hh * 0.25); }
    if (h > hh) { const LAY = ['#f3d49a', '#7cc45a', '#d9534f', '#f2e6c8', '#e2b46b'], lh = U * 0.42; ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y + hh, w - 8, h - hh); ctx.clip();
      for (let k = 0, yy = y + hh; yy < y + h; k++, yy += lh) { ctx.fillStyle = LAY[k % LAY.length]; ctx.fillRect(x + 4, yy, w - 8, lh); ctx.fillStyle = 'rgba(18,10,5,0.25)'; ctx.fillRect(x + 4, yy + lh - 3, w - 8, 3); } ctx.restore();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x + 4, y + hh, w - 8, h - hh); }
    if (what === 'mountain' && h > U * 1.8 && t >= 193.81) pic(ctx, 'decal_everest', x + Math.min(w * 0.5, U * 12), y + hh + (h - hh) * 0.5, U * 2.0, Math.min(U * 2.0, (h - hh) * 0.9));   // Chat's EVEREST label on the sandwich's face
    return; }
  box(ctx, x, y, w, h, col, { ink: 4, band: what === 'chart' ? null : CARD2 });
  if (what === 'para') { for (let yy = y + U * 0.5; yy < y + h; yy += U * 0.5) { ctx.fillStyle = CARD2; ctx.fillRect(x, yy, w, 2); } txt(ctx, '¶', x + w / 2, y + Math.min(h, U * 0.5) / 2 + 2, Math.min(28, U * 0.45), INK); }
  if (what === 'pad') { stripes(ctx, x, y, w, U * 0.22, HAZ, INK, 9); const near = Math.abs(t - D.LAUNCHES[0][0]) < 2.5; if (near) glow(ctx, x + w / 2, y, 60, '#ffcf4a', 0.4); }
  if (what === 'brim') { ctx.fillStyle = '#222428'; ctx.fillRect(x, y + h * 0.5, w, h * 0.5); }
}

// ---------- the course's things, painted where the course puts them (stage 1: set dressing he hops / ducks / glitches on the word) ----------
function courseThings(ctx, t, s, U, mt, kick) {
  if (!D.VIDEO) for (const hl of D.HOLES) vatHole(ctx, hl, t, U);
  if (SET) return;   // (set strip (Chikin: "the assets are supposed to go away"): the eagles and the bot that agrees are old-story props on the course)
  for (const r of rows()) { if (r.kind === 'chute' || r.kind === 'dbl2' || r.kind === 'pad' || r.kind === 'step' || r.kind === 'dormant' && t > r.tp + 2) continue;
    if (BLANK_Q && (r.kind === 'low' || r.kind === 'stack' || r.kind === 'hurdle' || r.kind === 'high' || r.kind === 'wall')) continue;   // (?blank: no crates to jump, press heads to duck or gates to glitch — they're the course's obstacles, D-20261103-24)
    if (!D.VIDEO && (r.kind === 'hole' || r.kind === 'dbl' || r.kind === 'crumble' || r.kind === 'fake' || r.kind === 'pump' || r.kind === 'dormant')) { if (r.kind === 'pump' && r.tp === 218.58) bot(ctx, r, proj(X(219.17), r.gy), U, t); continue; }   // (stage 2: the vats, chain pieces and the professor are the floor itself)
    const p = proj(r.x, r.gy); if ((p.x < -180 || p.x > W + 180) && r.kind !== 'orb' && !(r.tp === 15.89 && t > 13.18)) continue;
    const after = t - r.tp;   // < 0: coming · > 0: he's past it
    if (r.kind === 'high') { pressHead(ctx, r, p, U, t, after, kick); continue; }
    if (r.kind === 'wall') { gate(ctx, r, p, U, t, after, s); continue; }
    if (r.kind === 'dormant') { professor(ctx, r, p, U, t); continue; }
    if (r.kind === 'hole' || (r.kind === 'dbl' && r.what === 'vat')) { vat(ctx, r, p, U, t, after); continue; }
    if (r.kind === 'orb') { eagles(ctx, r, t, s, U); continue; }
    if (r.kind === 'pump') { bot(ctx, r, p, U, t); continue; }
    lowCrate(ctx, r, p, U, t, after, kick);
  }
}
// a crate on the belt; once he's over it, it's stamped (✓) and drops off the back onto the output belt
// (rework: the thing you jump is drawn 1.0 x 0.85 U — bigger and brighter than any cardboard on the walls — with a hazard band and a
//  thick white sticker border; the hitbox didn't change. A STACK is two of them, 1.7 U: ↑ then ↑ again in the air)
function lowCrate(ctx, r, p, U, t, after, kick) {
  if (r.kind === 'stack') { const w = U * 1.0, h = U * 0.85, ship = after > 0.6 ? clamp((after - 0.6) / 0.6) : 0; if (ship >= 1) return;
    let x = r.x1 != null ? proj((r.x + r.x1) / 2, r.gy).x - w / 2 : p.x, y = p.y; const a = 1 - ship; x -= ship * U * 0.9; y += ship * ship * U * 1.2;
    ctx.save(); ctx.globalAlpha = a; for (let k = 0; k < 2; k++) { const yy = y - h * (k + 1), jig = k ? Math.sin(t * 7 + r.tp) * U * 0.03 : 0;
      ctx.save(); ctx.translate(x + w / 2 + jig, yy + h / 2); hazCrate(ctx, w, h, U, r, t, k === 1 && r.what === 'fire' ? 'fire' : '');
      if (after > 0.15 + k * 0.12) { const kk = clamp((after - 0.15 - k * 0.12) / 0.3); if (!stampArt(ctx, 'stamp_fact', 0, h * 0.05, w * 0.95, kk)) stamp(ctx, 0, 0, w * 0.32, kk); }
      ctx.restore(); }
    ctx.restore(); return; }
  const w = U * 1.0, h = U * 0.85, ship = after > 0.45 ? clamp((after - 0.45) / 0.6) : 0; if (ship >= 1) return;
  let x = r.x1 != null ? proj((r.x + r.x1) / 2, r.gy).x - w / 2 : p.x, y = p.y - h, a = 1, rot = 0;
  if (r.what === 'yak' && t < 23.79) { const k = clamp((t - 23.2) / 0.59); if (k <= 0) return; y = lerp(p.y - h - U * 3, y, k * k); }      // dropped by the press on "battle"
  if (r.what === 'hats' || r.what === 'crown') return;                                                                                      // (their own pictures)
  if (r.what === 'overflow' || r.what === 'hurricane' || r.what === 'bigscrew') { const k = clamp(1 + after / 1.0); rot = (1 - k) * (r.what === 'hurricane' ? 6 : 3); x += (1 - k) * U * 3; }   // drawn rolling / tumbling in
  // (review fix, Matt's belt note at 12.8: the belt's first crate is on screen from the push-through: it rides the conveyor in at the
  //  right edge and waits there until its real spot scrolls on — only extra warning, the hitbox never moves; drawn = real from ~14.9)
  if (r.tp === 15.89 && t > 13.18) { const edge = W - w - U * 0.5, x0 = x; x = Math.min(x, edge); if (x < x0) rot = Math.sin(t * 9) * 0.03; }
  if (r.kind === 'hurdle') { const k = clamp((t - 185.0) / 0.4); if (t < 185.0) return; y = lerp(p.y - h - U * 3.6, y, k * k); }   // the raccoon knocks the first crate off the shelf at 185.0 (seen ~1.2 s before he meets it); on the drop the rest follow behind him
  if (ship > 0) { x -= ship * U * 0.9; y += ship * ship * U * 1.2; a = 1 - ship; }
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
  const fact = r.what === 'fact';
  if (fact) { box(ctx, -w / 2, -h / 2, w, h, '#f6f4ee', { ink: 3.5, band: '#dcd8cc', border: 5 }); pict(ctx, r, w, h, t); }
  else hazCrate(ctx, w, h, U, r, t);
  if (after > 0.15 && !fact) { const k = clamp((after - 0.15) / 0.3); if (!stampArt(ctx, 'stamp_fact', 0, h * 0.05, w * 0.95, k)) stamp(ctx, 0, 0, w * 0.32, k); }   // every lie he clears is stamped FACT
  ctx.restore();
}
// a crate he has to jump, centred on (0,0): bright kraft, ink (the old thick white border only with ?border=, D-20261105-09), a hazard band along its foot, the label on top
function hazCrate(ctx, w, h, U, r, t, alt = '') {
  const col = r.what === 'walnut' ? '#b07a42' : CARD_HOT;
  if (OLD_WHITE) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(6, U * 0.13); ctx.strokeStyle = '#ffffff'; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.restore(); }
  box(ctx, -w / 2, -h / 2, w, h, col, { ink: 4, band: CARD2 });
  if (r.what !== 'walnut') cardFace(ctx, -w / 2, -h / 2, w, h, U, col);
  stripes(ctx, -w / 2 + 2, h / 2 - h * 0.17, w - 4, h * 0.15, HAZ, INK, 7); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(-w / 2, -h / 2, w, h);
  if (alt === 'fire') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -h * 0.1, h * 0.7, '#ff8a3c', 0.5 + 0.2 * Math.sin(t * 12)); ctx.restore(); }
  ctx.save(); ctx.translate(0, -h * 0.08); pict(ctx, r, w * 0.92, h * 0.8, t); ctx.restore(); }
// Chat's printed cardboard on a crate face (washed toward the crate colour so the label on it still reads), ink edge redrawn
function cardFace(ctx, x, y, w, h, U, col = CARD) { if (tile(ctx, 'tile_cardboard_front', x + 1.5, y + 1.5, w - 3, h - 3, U * 2.2, x, y, col, 0.42)) { ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h); } }
// Chat's crate labels (decals) by what the crate is, and the two plain crates that carry a lie sung just before them
const DECAL = { yak: 'decal_yak', gary: 'decal_drgary', awning: 'decal_restaurant', mailbox: 'decal_zipcode', gremlin: 'turn_gremlin_qc_front', gremlin2: 'turn_gremlin_qc_front' };
const DECAL_AT = { 123.04: 'decal_goblin', 220.64: 'decal_franklin' };   // (S. GOBLIN under the white-out tape on "Oops. Correction."; BEN FRANKLIN after the three bots)
const PICTO = { wheel: 'picto_loading' };
function pict(ctx, r, w, h, t) { const l = r.label, wt = r.what;
  const dec = DECAL[wt] || DECAL_AT[r.tp]; if (dec && pic(ctx, dec, 0, 0, w * 0.9, h * 0.9)) return;
  const pc = wt === 'roadsign' ? (t > 52.36 ? 'picto_cactus' : 'picto_eiffel') : PICTO[wt]; if (pc && pic(ctx, pc, 0, 0, h * 0.78, h * 0.78)) return;   // Paris → Texas: the Eiffel plate flips to a cactus
  if (l) { txt(ctx, l.length > 9 ? l.split(' ')[0] : l, 0, -h * 0.14, Math.min(14, w / Math.max(3, l.length * 0.62)), INK); if (l.length > 9) txt(ctx, l.split(' ').slice(1).join(' '), 0, h * 0.18, Math.min(12, w / (l.length * 0.45)), INK); return; }
  ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = INK;
  if (wt === 'toaster') { box(ctx, -w * 0.3, -h * 0.2, w * 0.6, h * 0.4, '#c8cdd4', { ink: 2 }); ctx.fillRect(-w * 0.18, -h * 0.2, w * 0.1, 3); ctx.fillRect(w * 0.06, -h * 0.2, w * 0.1, 3); }
  else if (wt === 'screw' || wt === 'bigscrew') { for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.3, i * h * 0.12); ctx.lineTo(w * 0.3, i * h * 0.12 + 4); ctx.stroke(); } }
  else if (wt === 'roadsign') { const flip = t > 52.36; if (!flip) { ctx.beginPath(); ctx.moveTo(0, -h * 0.35); ctx.lineTo(-w * 0.18, h * 0.3); ctx.moveTo(0, -h * 0.35); ctx.lineTo(w * 0.18, h * 0.3); ctx.moveTo(-w * 0.1, 0); ctx.lineTo(w * 0.1, 0); ctx.stroke(); }
    else { ctx.lineWidth = 5; ctx.strokeStyle = '#3a8a4a'; ctx.beginPath(); ctx.moveTo(0, h * 0.35); ctx.lineTo(0, -h * 0.3); ctx.moveTo(0, 0); ctx.lineTo(-w * 0.18, -h * 0.1); ctx.lineTo(-w * 0.18, -h * 0.25); ctx.moveTo(0, h * 0.06); ctx.lineTo(w * 0.16, -h * 0.04); ctx.lineTo(w * 0.16, -h * 0.2); ctx.stroke(); } }
  else if (wt === 'wheel') { const sp = t < 78.49 ? t * 8 : 78.49 * 8; ctx.beginPath(); ctx.arc(0, 0, h * 0.28, sp, sp + 4.6); ctx.stroke(); }
  else if (wt === 'mailbox') { box(ctx, -w * 0.25, -h * 0.2, w * 0.5, h * 0.3, '#2a5fa8', { ink: 2 }); ctx.fillRect(-1.5, h * 0.1, 3, h * 0.25); }
  else if (wt === 'awning') { for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#fff6e0' : '#d9443a'; ctx.fillRect(-w * 0.3 + i * w * 0.15, -h * 0.3, w * 0.15, h * 0.25); } }
  else if (wt === 'gremlin' || wt === 'gremlin2') { box(ctx, -w * 0.3, -h * 0.3, w * 0.6, h * 0.55, '#dff3dc', { ink: 2 }); for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.3 + i * h * 0.18); ctx.lineTo(w * 0.3, -h * 0.3 + i * h * 0.18); ctx.moveTo(-w * 0.3 + i * w * 0.2, -h * 0.3); ctx.lineTo(-w * 0.3 + i * w * 0.2, h * 0.25); ctx.stroke(); } }
  else if (wt === 'rockets') { for (const dx of [-0.15, 0.15]) poly(ctx, [[w * dx - 4, h * 0.3], [w * dx + 4, h * 0.3], [w * dx + 4, -h * 0.15], [w * dx, -h * 0.32], [w * dx - 4, -h * 0.15]], '#e2412e', 2); }
  else if (wt === 'chimichanga') { ctx.fillStyle = '#e2b46b'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.3, h * 0.18, 0.2, 0, 7); ctx.fill(); ctx.stroke(); }
  else if (wt === 'spat') { txt(ctx, 'STOP', 0, 0, 10, RED); }
  else if (wt === 'fanny') { ctx.beginPath(); ctx.ellipse(0, h * 0.02, w * 0.28, h * 0.16, 0, 0, 7); ctx.fillStyle = '#7a4ab0'.replace('7a4ab0', '3a6a9a'); ctx.fill(); ctx.stroke(); }
  else if (wt === 'hurricane') { ctx.beginPath(); for (let a = 0; a < 12; a += 0.3) { const rr = a * 1.3; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-6, h * 0.2); ctx.lineTo(-6, -h * 0.1); ctx.lineTo(-11, -h * 0.1); ctx.lineTo(0, -h * 0.28); ctx.lineTo(11, -h * 0.1); ctx.lineTo(6, -h * 0.1); ctx.lineTo(6, h * 0.2); ctx.closePath(); ctx.stroke(); }   // ↑ this way up
  ctx.restore(); }
// a press head / lamp / vent he ducks: it slams just behind him as he passes and stamps the crate behind
function pressHead(ctx, r, p, U, t, after, kick) {
  const w = U * 0.95, gy = p.y, hold = r.hold ? r.hold - r.tp : 0;
  const slam = after > 0.12 + hold ? Math.min(1, (after - 0.12 - hold) / 0.08) * Math.max(0, 1 - (after - 0.3 - hold) / 0.5) : 0, twitch = 4 * kick;
  const y0 = gy - U * 0.9 - twitch + slam * U * 0.6, top = Math.min(-10, y0 - U * 3);
  // (rework: ↓ always looks like this — steel + a red beacon that lights a beat early, and its shadow on the belt)
  const warn = after > -D.P - 0.9 && after < 0.25 + hold, lit = after > -D.P - 0.05 && after < 0.25 + hold, hw = r.what === 'triple' && r.x1 != null ? proj(r.x1, 0).x - p.x : w;
  if (warn) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(p.x + hw / 2, gy - 2, hw * 0.6, U * 0.1, 0, 0, 7); ctx.fill(); ctx.restore(); }
  { const bx = p.x + (r.what === 'piston' ? -U * 0.6 : hw / 2), by = (r.what === 'beam' ? y0 - U * 0.9 : y0 - U * (r.what === 'lamp' || r.what === 'vent' ? 1.15 : 0.8));
    if (r.what !== 'beam' || t > r.tp - 1.2) { circ(ctx, bx, by, U * 0.13, lit ? RED : '#6a2a20', 3); if (lit) { const pulse = 0.6 + 0.4 * Math.sin(t * 30); glow(ctx, bx, by, U * 0.9, '#ff3a2a', 0.55 * pulse); } } }
  if (r.what === 'lamp' || r.what === 'vent') { box(ctx, p.x, y0 - U * 0.9, w, U * 0.9, r.what === 'vent' ? '#5a5f70' : '#d8dde4', { ink: 3.5, border: 5, band: '#a8b0bc' });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + 0.2 * kick; ctx.fillStyle = r.what === 'vent' ? '#fff2a8' : '#ffd27a'; ctx.beginPath(); ctx.moveTo(p.x + w * 0.2, y0); ctx.lineTo(p.x - U * 0.6, gy); ctx.lineTo(p.x + w + U * 0.6, gy); ctx.lineTo(p.x + w * 0.8, y0); ctx.fill(); ctx.restore();
    ctx.fillStyle = INK; ctx.fillRect(p.x + w / 2 - 2, top, 4, y0 - U * 0.9 - top); return; }
  if (r.what === 'piston') { box(ctx, p.x - U * 2.5, y0 - U * 0.5, U * 2.5 + w, U * 0.5, '#8a8f99', { ink: 3.5 }); stripes(ctx, p.x, y0 - U * 0.5, w, U * 0.5, HAZ, INK, 8); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.strokeRect(p.x, y0 - U * 0.5, w, U * 0.5); return; }
  if (r.what === 'beam') { const k = clamp((t - (r.tp - 1.2)) / 0.5); ctx.save(); ctx.translate(p.x + w / 2, lerp(-40, y0 - U * 0.3, k * k)); ctx.rotate(0.15); box(ctx, -w * 0.8, -U * 0.25, w * 1.6, U * 0.5, '#7a8090', { ink: 3.5 }); stripes(ctx, -w * 0.8, U * 0.1, w * 1.6, U * 0.12, HAZ, INK, 7); ctx.restore(); return; }
  const n = r.what === 'triple' ? 3 : 1, ww = r.what === 'triple' ? (r.x1 != null ? (proj(r.x1, 0).x - p.x) : U * (0.55 * (r.hold - r.tp) * 11)) / 3 : w;
  for (let i = 0; i < n; i++) { const px = p.x + i * ww;
    box(ctx, px + ww * 0.32, top, ww * 0.36, y0 - U * 0.55 - top, '#5a606c', { ink: 3 }); box(ctx, px, y0 - U * 0.55, ww, U * 0.55, '#8a8f99', { ink: 3.5, band: '#71767f', border: 5 }); stripes(ctx, px + 2, y0 - U * 0.16, ww - 4, U * 0.14, HAZ, INK, 7);
    const icon = { cloud: '☁', knot: '∞', cabbage: '❀' }[r.what], pc = { cloud: 'picto_cloud', knot: 'picto_knot' }[r.what];
    if (icon && !(pc && pic(ctx, pc, px + ww / 2, y0 - U * 0.3, U * 0.46, U * 0.46))) txt(ctx, icon, px + ww / 2, y0 - U * 0.34, U * 0.3, INK); }
  if (slam > 0.3) { ctx.save(); ctx.globalAlpha = slam * 0.6; circ(ctx, p.x + w / 2, gy - 4, U * 0.4 * slam, '#f4efe4', 0); ctx.restore(); }
}
// a jam gate: a beacon spins while the belt crawls, an alarm lamp, the gate; his glitch goes through and the belt restarts
function gate(ctx, r, p, U, t, after, s) {
  if (!D.VIDEO) { if (r.openAt != null && t < r.openAt - 0.01) r.openAt = null;            // (a retry rewinds it)
    if (r.openAt == null && s && s.glitchAt != null && s.glitchAt > r.tp - 0.7 && s.glitchAt < r.tp + 0.5 && t >= s.glitchAt) r.openAt = s.glitchAt;
    after = r.openAt != null ? t - r.openAt : Math.min(after, -0.01); }
  const open = after > 0 ? clamp(after / 0.25) : 0, gy = p.y, w = U * 0.25, h = Math.max(U * 2.0, Math.min(U * 3, gy - 150 - U * 0.6)), x = p.x, side = gy - h - U * 0.6 < 128,   /* (rework stills: the pole + its lamp stop under the lyric band; still taller than any hop) */ col = { qc: '#ffb347', laurel: '#ff6a5a', kevin: RED, fact: '#f6f4ee', bubble: '#e9f4ff' }[r.what] || '#ff6a5a';
  const jam = D.BOOSTS.find(b => b.why === 'jam' && r.tp >= b.t0 - 0.1 && r.tp <= b.t1 + 0.4), crawling = jam && t >= jam.t0 && t < Math.max(jam.t1, r.tp);
  if (r.what === 'bubble' && D.VIDEO) return;                                                                                          // (his own bubble is the gate: see bubble(); in play it also stands on the belt)
  if (r.what === 'fact') { factCrate(ctx, x, gy, U, t, after); return; }
  ctx.save(); ctx.globalAlpha = 1 - open * 0.85;
  if (!side) box(ctx, x - U * 0.35, gy - h - U * 0.4, U * 0.95, U * 0.4, '#3a3f4a', { ink: 3 });   // (side: no room under the lyrics — the lamp + its sign hang off the pole instead)                                                  // the header
  if (open < 1 && after > -1.6) { const lx = x + U * (side ? 0.62 : 0.48), ly = side ? gy - h * 0.42 : gy - h - U * 0.2, on = Math.floor(t * 6) % 2 === 0; circ(ctx, lx, ly, U * 0.1, on ? '#ffb347' : '#6a4a20', 2.5); if (on) glow(ctx, lx, ly, U * 0.7, '#ffb347', 0.5); }   // (rework: Space always shows an amber lamp)
  box(ctx, x, gy - h * (1 - open), w, h * (1 - open) + 1, col, { ink: 3.5, border: 5 }); stripes(ctx, x, gy - h * (1 - open), w, Math.min(h * (1 - open), U * 0.2), HAZ, INK, 6);
  ctx.restore();
  if (crawling || (after < 0 && after > -1.2)) beacon(ctx, x + U * 0.12, side ? gy - h - U * 0.05 : gy - h - U * 0.55, t, crawling ? 1 : 0.5);
  // what each jam is about (the cause), on the gate's lamp
  const sym = { laurel: '?', kevin: '?', qc: '!', barcode: '|||', captain: '!', stop: 'STOP', inspector: '?', binder: '!', flag: '!', factcheck: '?', shutters: '', socket: '!' }[r.what];
  if (sym && open < 1) { const lx = side ? x + U * 0.62 : x + U * 0.12, ly = side ? gy - h * 0.42 - U * 0.45 : gy - h - U * 0.2; const qs = sym === '?' && !(r.what === 'inspector' && t >= 115.09);
    if (!(qs && pic(ctx, 'picto_question', lx, ly, U * 0.5, U * 0.5, { a: 1 - open }))) txt(ctx, r.what === 'inspector' ? (t >= 115.09 ? 'S. GOBLIN' : '?') : sym, lx, ly, r.what === 'stop' ? 11 : 16, r.what === 'inspector' && t >= 115.09 ? '#fff' : '#fff', { stroke: 4 }); }
  if (r.what === 'laurel' && t < 41.2) { const cx = x + U * 0.9, k = t >= 40.78 ? 1 : 0; box(ctx, cx, gy - U * 0.6, U * 0.7, U * 0.6, CARD, { ink: 3.5, border: 5, band: CARD2 });
    if (!k) { ctx.save(); ctx.strokeStyle = '#3a8a4a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx + U * 0.35, gy - U * 0.3, U * 0.2, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke(); ctx.restore(); txt(ctx, '?', cx + U * 0.35, gy - U * 0.3, 16, INK); }
    else txt(ctx, 'SALAD', cx + U * 0.35, gy - U * 0.3, 11, INK); }   // (review fix: no real person's name on a crate; Caesar → a salad)
  if (r.what === 'barcode' && t > 57.5 && t < 61) { const a = proj(r.x - 6, r.gy), bx = a.x, by = gy - U * 3.6; box(ctx, bx, by, U * 6.4, U * 0.5, '#d8dde4', { ink: 3 });
    for (let i = 0; i < 26; i++) { ctx.fillStyle = INK; ctx.fillRect(bx + 8 + i * U * 0.24, by + 6, (i % 3 ? 2 : 4), U * 0.5 - 12); }
    const beep = [58.37, 58.73, 58.93, 59.22, 59.52, 59.78].some(b => t >= b && t < b + 0.08); if (beep) glow(ctx, bx + U * 3.2, by + U * 0.5, 120, '#ff3a2a', 0.6);
    if (t >= 59.82) txt(ctx, '4 20', bx + U * 3.2, by + U * 0.25, 13, RED, { stroke: 3, sc: '#fff' }); }
  if (r.what === 'stop' && t < 109.5) { const flip = t >= 108.1 ? clamp((t - 108.1) / 0.2) : 0; ctx.save(); ctx.translate(x + U * 0.12, gy - h * 0.6); ctx.scale(Math.cos(flip * Math.PI), 1);
    poly(ctx, [...Array(8)].map((_, i) => [Math.cos(i * Math.PI / 4 + Math.PI / 8) * U * 0.55, Math.sin(i * Math.PI / 4 + Math.PI / 8) * U * 0.55]), flip > 0.5 ? '#9aa6a8' : RED, 4, 6); if (flip < 0.5) txt(ctx, 'STOP', 0, 0, 12, '#fff'); ctx.restore(); }
  if (r.what === 'inspector' && t > 113.4 && t < 117) inspector(ctx, x + U * 1.3 + Math.max(0, 114.4 - t) * U * 6, gy, U, t, false);
  if (r.what === 'gremlin2' && t > r.tp - 2.2 && t < r.tp + 0.8) inspector(ctx, x + U * 0.15, gy, U, t, false);   // "my mistake, you're a different gremlin": the 3rd QC bot is an inspector (Space, not ↑)
  if (r.what === 'binder' && t > 154.4 && t < 159) { inspector(ctx, x + U * 1.6 + Math.max(0, 155.4 - t) * U * 6, gy, U, t, true);
    const fly = t >= 157.2 ? clamp((t - 157.2) / 0.9) : 0; ctx.save(); ctx.translate(x - U * 0.5 + fly * U * 7, gy - U * 0.45 - Math.sin(fly * Math.PI) * U * 3); ctx.rotate(fly * 8); box(ctx, -U * 0.4, -U * 0.3, U * 0.8, U * 0.6, '#2a5fa8', { ink: 3 }); txt(ctx, '2018', 0, 0, 10, '#fff'); ctx.restore(); }
  if (r.what === 'flag' && t > 181 && t < 183) { const dn = t >= 181.85 ? clamp((t - 181.85) / 0.15) : 0; ctx.save(); ctx.translate(x - U * 0.6, gy); ctx.rotate(-dn * 1.4); ctx.fillStyle = INK; ctx.fillRect(-2, -U * 2.2, 4, U * 2.2); poly(ctx, [[2, -U * 2.2], [U * 0.9, -U * 1.95], [2, -U * 1.7]], '#ffcf4a', 3); ctx.restore(); }
  if (r.what === 'factcheck' && t > 187.5 && t < 192.6) for (let i = 0; i < 3; i++) { const lx = x - U * (2.5 - i * 1.6), ly = gy - U * (3.8 - (i === 1 ? 0.6 : 0)) + (t >= 191.04 && t < 191.3 && i === 2 ? U * 0.6 : 0), knocked = t >= 191.4 ? clamp((t - 191.4) / 0.3) : 0;
    ctx.save(); ctx.translate(lx + knocked * U * (i - 1) * 2, ly - knocked * U); ctx.rotate(knocked * (i - 1)); box(ctx, -U * 0.35, -U * 0.25, U * 0.7, U * 0.5, '#d8dde4', { ink: 3 }); if (!pic(ctx, 'picto_question', 0, 0, U * 0.42, U * 0.42)) txt(ctx, '?', 0, 0, 14, RED); ctx.restore(); }
  if (r.what === 'captain' || r.what === 'qc') { /* the QC booth / the QC lamp are on the back wall */ if (r.what === 'qc' && t < 26) { const lx = x + U * 0.12, ly = gy - h - U * 1.0; circ(ctx, lx, ly, U * 0.2, t < 24.38 ? '#6a6a6a' : t < 24.78 ? '#ffb347' : '#4dd07a', 3); if (t >= 24.38 && t < 24.78) glow(ctx, lx, ly, 70, '#ffb347', 0.6); } }
}
function inspector(ctx, x, gy, U, t, big) { const sc = (big ? 1.4 : 1) * U / 60;
  // Chat's QC inspector (clipboard built into its chest) and the survey robot (the 2018 binder in its chest cradle); after NO IT WASN'T
  // the binder is gone into the furnace, so the survey robot backs off and fades
  const gone = big && t > 157.2 ? clamp((t - 157.2) / 0.45) : 0;
  if (gone < 1 && art(big ? 'turn_survey_front' : 'turn_inspector_front')) { pic(ctx, big ? 'turn_survey_front' : 'turn_inspector_front', x + gone * U * 1.5, gy + 4 * sc, 130 * sc, (big ? 112 : 128) * sc, { bottom: true, a: 1 - gone });
    if (!big && t > 114.6 && t < 116) { ctx.save(); ctx.translate(x, gy); ctx.scale(sc, sc); if (t >= 115.09 && art('stamp_rejected')) stampArt(ctx, 'stamp_rejected', 0, -50, 84, clamp((t - 115.09) / 0.2)); else stamp(ctx, 0, -50, 20, clamp((t - 114.6) / 0.2), RED, '?'); ctx.restore(); }
    return; }
  if (gone >= 1) return;
  ctx.save(); ctx.translate(x, gy); ctx.scale(sc, sc);
  for (const wx of [-22, 22]) circ(ctx, wx, -10, 10, '#2a2f38', 3);
  box(ctx, -34, -96, 68, 80, '#cfd6de', { ink: 3.5, band: '#b0b8c2', border: 6 }); box(ctx, -22, -86, 44, 54, '#f6f4ee', { ink: 2.5 }); for (let i = 0; i < 4; i++) { ctx.fillStyle = '#9aa6a8'; ctx.fillRect(-16, -78 + i * 11, 32, 3); }   // the clipboard on its chest (no hands)
  box(ctx, -26, -130, 52, 34, '#cfd6de', { ink: 3.5 }); box(ctx, -18, -122, 36, 16, '#16202a', { ink: 2 }); circ(ctx, -7, -114, 3.5, big ? '#ff6a3a' : '#7dff9a', 0); circ(ctx, 7, -114, 3.5, big ? '#ff6a3a' : '#7dff9a', 0);
  ctx.fillStyle = INK; ctx.fillRect(-1.5, -146, 3, 16); circ(ctx, 0, -148, 4, RED, 2);
  if (!big && t > 114.6 && t < 116) stamp(ctx, 0, -60, 20, clamp((t - 114.6) / 0.2), RED, t >= 115.09 ? 'S.G' : '?');
  ctx.restore(); }
function factCrate(ctx, x, gy, U, t, after) { const w = U * 0.9, h = U * (D.VIDEO ? 0.9 : 2.9), through = after > 0 ? clamp(after / 0.3) : 0, shake = after < 0 && after > -1 ? (rnd(Math.floor(t * 30), 4) - 0.5) * 3 : 0;
  ctx.save(); ctx.translate(x + w / 2 + shake - through * U * 2.2, gy - h / 2); box(ctx, -w / 2, -h / 2, w, h, '#f6f4ee', { ink: 4, border: 7, band: '#e2ded2' });
  txt(ctx, 'FACT', 0, 0, 15, INK);
  if (after > 0) { ctx.lineWidth = 2; ctx.strokeStyle = CARD2; ctx.setLineDash([3, 3]); ctx.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6); ctx.setLineDash([]);   // the stamp can't print on it: it slides off, smudged
    ctx.save(); ctx.globalAlpha = 0.5 * (1 - through); stamp(ctx, w * 0.4, -h * 0.3, w * 0.28, 1, '#c0302a', '✓'); ctx.restore(); }
  ctx.restore();
  if (span(t, 232.69, 233.75)) beacon(ctx, x + w / 2, gy - h - U * 0.4, t, 1); }
function vat(ctx, r, p, U, t, after) { const w = r.kind === 'dbl' ? U * 0.75 * 11 * 0.75 : U * 1.3, x = p.x - U * 0.2, gy = p.y, boil = r.what === 'spaghetti' && t >= 55.843 ? clamp((t - 55.843) / 0.3) : 0;
  box(ctx, x, gy - U * 0.95, w, U * 0.95, '#5a606c', { ink: 3.5, band: '#454b56', border: 5 });
  ctx.save(); ctx.beginPath(); ctx.rect(x + 4, gy - U * 1.4, w - 8, U * 0.6); ctx.clip(); const col = r.what === 'spaghetti' ? '#f2c45a' : r.what === 'stew' ? '#9a4a2a' : '#7ad0c0';
  for (let i = 0; i < 6; i++) circ(ctx, x + w * (0.1 + 0.16 * i), gy - U * 0.9 + Math.sin(t * 6 + i) * 4 - boil * U * 0.3, U * (0.14 + 0.06 * (i % 2)), col, 2); ctx.restore();
  if (r.what === 'spaghetti') { ctx.save(); ctx.strokeStyle = '#f2c45a'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + w * (0.15 + 0.17 * i), gy - U * 0.95); ctx.bezierCurveTo(x + w * (0.2 + 0.17 * i), gy - U * (1.3 + boil), x + w * (0.1 + 0.17 * i), gy - U * (0.8 + boil * 0.8), x + w * (0.18 + 0.17 * i), gy - U * 0.2); ctx.stroke(); } ctx.restore(); }
  if (r.label) txt(ctx, r.label, x + w / 2, gy - U * 0.4, Math.min(12, w / (r.label.length * 0.62)), '#fff2dc', { stroke: 4 }); }
// a vat cut out of the belt (stage 2): the tub under the gap, its slurry boiling on the bass, the label on its rim (Matt's products only)
const VATCOL = { spaghetti: '#f2c45a', stew: '#9a4a2a', eagles: '#6fc2b4', professor: '#3a3f4a', paper: '#7ad0c0', wheel: '#7ad0c0', fake: '#6fc2b4', bot: '#6fc2b4', vat: '#6fc2b4', launch: '#6fc2b4' };
function vatHole(ctx, hl, t, U) { if (SET) hl = { ...hl, what: 'vat' };   // (set strip: a plain vat, no QUANTUM SPAGHETTI / STEW, no strands)
  const a = proj(hl.x0, hl.gy), b = proj(hl.x1, hl.gy); if (b.x < -40 || a.x > W + 40) return;
  const x = a.x, w = b.x - a.x, top = a.y + U * 0.55, bot = Math.min(H + 20, a.y + U * 3.2), col = VATCOL[hl.what] || '#6fc2b4', boil = hl.what === 'spaghetti' && t >= 55.843 ? clamp((t - 55.843) / 0.3) : 0;
  ctx.save(); ctx.fillStyle = '#1b1e24'; ctx.fillRect(x, top - U * 0.2, w, bot - top + U * 0.2);
  ctx.fillStyle = col; ctx.fillRect(x + 4, top, w - 8, U * 0.35); ctx.fillStyle = 'rgba(18,10,5,0.25)'; ctx.fillRect(x + 4, top + U * 0.22, w - 8, U * 0.13);
  for (let i = 0; i < Math.max(2, Math.floor(w / (U * 0.7))); i++) { const bx = x + 10 + ((i * 53 + rnd(i, 9) * 30) % Math.max(10, w - 20)), by = top + U * 0.08 - Math.abs(Math.sin(t * 5 + i * 1.7)) * U * (0.12 + boil * 0.5); circ(ctx, bx, by, U * (0.08 + 0.04 * (i % 2)), col, 2); }
  if (hl.what === 'spaghetti') { ctx.strokeStyle = '#f2c45a'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const sx = x + w * (0.15 + 0.22 * i); ctx.beginPath(); ctx.moveTo(sx, top); ctx.bezierCurveTo(sx + 10, top - U * (0.4 + boil), sx - 10, top - U * (0.2 + boil * 0.8), sx + 6, top - U * (0.1 + boil)); ctx.stroke(); } }
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x + 2, a.y); ctx.lineTo(x + 2, bot); ctx.moveTo(x + w - 2, a.y); ctx.lineTo(x + w - 2, bot); ctx.stroke();
  stripes(ctx, x, top - U * 0.2, w, U * 0.14, HAZ, INK, 9);
  const lab = { spaghetti: 'QUANTUM SPAGHETTI', stew: 'STEW' }[hl.what]; if (hl.what === 'spaghetti' && pic(ctx, 'decal_spaghetti', x + w / 2, top + U * 1.15, Math.min(w * 0.9, U * 1.5), U * 1.5)) { /* Chat's label on the vat */ }
  else if (lab && w > 30) txt(ctx, lab, x + w / 2, top + U * 0.85, Math.min(14, w / (lab.length * 0.7)), '#fff2dc', { stroke: 4 });
  ctx.restore(); }
function eagles(ctx, r, t, s, U) { if (t < r.tp - 1.4 || t > r.tp + 3.2) return; const throws = [105.48, 106.19, 106.9];
  throws.forEach((ot, i) => { const ox = X(ot), oy = D.F2 + 2.1 + (s && s.orbAt != null ? 0 : 0); let p = proj(ox, oy); const carried = t >= ot && t < ot + 0.71; if (carried) p = proj(s.x + 0.55, s.y + 1.35); else if (t > ot) return;
    const flap = Math.sin(t * 22 + i) * 0.5; ctx.save(); ctx.translate(p.x, p.y); const sc = U / 60;
    ctx.scale(sc, sc); for (const sd of [-1, 1]) { ctx.save(); ctx.scale(sd, 1); ctx.rotate(-0.3 + flap * 0.6); poly(ctx, [[6, 0], [60, -14], [52, 4], [30, 10]], '#c9a26a', 3); ctx.restore(); }
    circ(ctx, 0, 0, 13, '#8a5a2a', 3); circ(ctx, 0, -16, 9, '#fff6e0', 3); poly(ctx, [[6, -18], [16, -14], [6, -12]], HAZ, 2);
    if (!carried) { box(ctx, -8, 16, 16, 8, '#2a2f38', { ink: 2 }); ctx.fillStyle = '#7dff9a'; ctx.fillRect(-6, 18, 12 * clamp((t - ot + 1.4) / 1.4), 4); }   // charging (rechargeable eagles)
    ctx.restore(); }); }
function bot(ctx, r, p, U, t) { const rise = clamp((t - 215.7) / 0.71), lock = t >= 216.411; const w = U * 1.0, dy = (1 - rise) * U * 2.5;
  ctx.save(); box(ctx, p.x - w * 0.2, p.y + dy - U * 0.15, w, U * 0.5, '#9aa6a8', { ink: 3.5, band: '#7d898b', border: 5 }); circ(ctx, p.x + w * 0.3, p.y + dy + U * 0.1, 4, lock ? '#7dff9a' : '#ff6a3a', 1.5);
  txt(ctx, '✓', p.x + w * 0.05, p.y + dy + U * 0.1, 14, INK); ctx.restore();
  if (r.tp === 218.58) { const tap = t >= 218.58 && t < 218.9; ctx.save(); ctx.translate(p.x + w * 1.2, p.y - U * 1.2); ctx.rotate(tap ? 0.8 : 0.2); box(ctx, -3, -U * 1.2, 6, U * 1.2, '#d8dde4', { ink: 2.5 }); ctx.restore(); } }
function professor(ctx, r, p, U, t) { const k = t < 96.09 ? 0 : clamp((t - 96.09) / 0.4); if (k <= 0) { ctx.save(); ctx.setLineDash([6, 5]); ctx.lineWidth = 2.5; ctx.strokeStyle = '#d8d0b8'; ctx.strokeRect(p.x + U * 0.2, p.y - U * 0.5, U * 3.4, U * 0.5); ctx.restore(); return; }
  const sc = U / 60; ctx.save(); ctx.translate(p.x + U * 0.2, p.y); ctx.scale(sc * k, sc);   // the cardboard professor moulds into existence lying flat: he is the floor (no label)
  box(ctx, 0, -26, 150, 26, '#f4f1ea', { ink: 4, band: '#d6d0c2', border: 6 }); circ(ctx, 172, -16, 20, '#f2c79a', 4); box(ctx, 190, -30, 12, 30, INK, { ink: 0 }); for (const dx of [168, 176]) circ(ctx, dx, -20, 2.5, INK, 0);
  ctx.fillStyle = CARD2; ctx.fillRect(0, -4, 150, 4); ctx.restore(); }

// ---------- front set pieces (on his path, keyed to the song) ----------
function frontSet(ctx, t, s, U, mt, kick) {
  // 22.91 "fax": the stamp press rises; 23.79 "battle": it slams and drops the YAK crate
  if (t > 21.5 && t < 25) { const r = rows().find(q => q.what === 'yak'), p = proj(r.x, r.gy), up = clamp((t - 22.91) / 0.6), slam = t >= 23.79 ? Math.max(0, 1 - (t - 23.79) / 0.4) : 0;
    const y = p.y - U * (4.2 + 1.2 * up) + slam * U * 0.8 * (t < 23.95 ? 1 : 0); box(ctx, p.x + U * 0.12, -10, U * 0.4, y + 10, '#5a606c', { ink: 3 }); box(ctx, p.x - U * 0.3, y, U * 1.2, U * 0.6, '#8a8f99', { ink: 3.5, band: '#71767f', border: 5 }); stripes(ctx, p.x - U * 0.28, y + U * 0.45, U * 1.16, U * 0.13, HAZ, INK, 7); }
  // 85.07 FLIES: the catwalk belt snaps off its edge; belt pieces and crates tumble down alongside him (F2 → F1)
  if (t > 84.9 && t < 86.6) { const ex = X(85.07); for (let i = 0; i < 7; i++) { const t0 = 85.07 + i * 0.06, k = Math.max(0, t - t0), crate = i % 3 === 1;
      const wx = ex - 0.6 + i * 0.55 + k * (1.2 + i * 0.25), wy = D.F2 - 0.1 + (i % 2) * 0.3 - 0.5 * 26 * k * k + 2.2 * k; if (wy < -1.5) continue; const p = proj(wx, wy);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(k * (2.5 + i) * (i % 2 ? 1 : -1));
      if (crate) box(ctx, -U * 0.35, -U * 0.3, U * 0.7, U * 0.6, CARD, { ink: 3, band: CARD2, border: 4 });
      else { box(ctx, -U * 0.55, -U * 0.12, U * 1.1, U * 0.24, '#16181c', { ink: 3 }); stripes(ctx, -U * 0.55, U * 0.12, U * 1.1, U * 0.12, HAZ, INK, 8); }
      ctx.restore(); }
    if (t >= 85.07 && t < 85.5) { const p = proj(ex, D.F2); ctx.save(); ctx.globalAlpha = 1 - (t - 85.07) / 0.43; for (let j = 0; j < 8; j++) circ(ctx, p.x + (rnd(j, 7) - 0.5) * 60 * (1 + (t - 85.07) * 6), p.y + (rnd(j, 8) - 0.3) * 50 * (1 + (t - 85.07) * 4), 4, '#ffd27a', 0); ctx.restore(); } }
  // 121.0 → 122.2: white-out tape unspools and slaps over a crate's label on "Oops. Correction."
  if (t > 121.0 && t < 124.5) { const r = rows().find(q => Math.abs(q.tp - 123.04) < 0.01), p = proj(r.x, r.gy), k = clamp((t - 121.0) / 1.2);
    ctx.save(); ctx.fillStyle = '#f6f6f6'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; const tx = lerp(p.x + U * 4, p.x + U * 0.31, ease(k)), ty = lerp(p.y - U * 3, p.y - U * 0.3, ease(k)); ctx.fillRect(Math.min(tx, p.x) - 2, ty - 7, Math.abs(tx - p.x) + U * 0.4, 14); ctx.strokeRect(Math.min(tx, p.x) - 2, ty - 7, Math.abs(tx - p.x) + U * 0.4, 14); ctx.restore(); }
  // 127.3 → 129.31: the serif journal crate rides in silence → bursts into a generic granola bar (mountains, no logo); the bar is the launch
  if (t > 126.5 && t < 131) { const p = proj(X(129.313) - 0.6, D.F2); if (t < 129.313) { box(ctx, p.x - U * 1.2, p.y - U * 0.9, U * 1.0, U * 0.9, '#7a1f2a', { ink: 3.5, border: 5, band: '#5a1520' }); txt(ctx, 'Journal', p.x - U * 0.7, p.y - U * 0.55, 11, '#fff2dc'); ctx.fillStyle = '#fff2dc'; ctx.fillRect(p.x - U * 1.1, p.y - U * 0.3, U * 0.8, 2); }
    else if (t < 130.2) { const k = clamp((t - 129.313) / 0.3), me = proj(s.x, s.y); granola(ctx, me.x, me.y + U * 0.15, U, k); } }
  // 144.0 → 147.82: who is Kevin? the "thanks, kevin" slip rides the belt and the SOURCE stamp slams on it (144.97); machines stall; the red "?" gate
  if (t > 143.6 && t < 148.4) { const sx = s.x + 2.3, p = proj(sx + Math.max(0, 144.6 - t) * 6, D.F3 + 0.15); ctx.save(); ctx.globalAlpha = t > 147.7 ? clamp(1 - (t - 147.7) / 0.4) : 1; slip(ctx, p.x, p.y, U * 1.35, -0.05, t >= 144.97 ? clamp((t - 144.97) / 0.15) : 0); ctx.restore();
    if (t > 144.6 && t < 145.3) { const sl = t >= 144.97 ? Math.max(0, 1 - (t - 144.97) / 0.3) : 0, y = p.y - U * 3.2 + (t < 144.97 ? 0 : U * 2.6) * (sl > 0 ? 1 : 0); box(ctx, p.x - U * 0.6, y, U * 1.2, U * 0.5, '#8a8f99', { ink: 3.5, border: 5 }); box(ctx, p.x - U * 0.1, -10, U * 0.2, y + 10, '#5a606c', { ink: 2.5 }); } }
  // 150.23 → 151.77: four presses on the four words (cloud, hammer, knot, podium) in the background row, and the bar-chart printer
  if (t > 149.6 && t < 153) [[150.23, '☁'], [150.75, '⚒'], [151.13, '∞'], [151.77, '▬']].forEach(([a, ic], i) => { const p = proj(X(151.6) + i * 2.6 - 2, D.F3 + 3.4), sl = t >= a ? Math.max(0, 1 - (t - a) / 0.35) : 0;
    box(ctx, p.x - U * 0.6, p.y + sl * U * 0.9, U * 1.2, U * 0.7, '#86513a', { ink: 3.5, border: 5, band: '#6a3d2a' });
    if (!pic(ctx, ['picto_cloud', 'picto_hammer', 'picto_knot', 'picto_podium'][i], p.x, p.y + sl * U * 0.9 + U * 0.35, U * 0.6, U * 0.6)) txt(ctx, ic, p.x, p.y + sl * U * 0.9 + U * 0.35, U * 0.42, '#fff2dc'); });
  // 173.64: the wall socket he dives into (F3 → F2); 177.76: a generic hand-pie in a lab coat slides out (no brand)
  if (t > 172.5 && t < 176.5) { const p = proj(X(175.09) + 0.3, D.F3 - 0.1); box(ctx, p.x - U * 0.15, p.y, U * 1.1, U * 1.4, '#f4efe4', { ink: 4, border: 6 }); for (const dx of [0.2, 0.6]) box(ctx, p.x + U * dx, p.y + U * 0.35, U * 0.12, U * 0.45, INK, { ink: 0 }); }
  if (t > 177.5 && t < 180) { const k = clamp((t - 177.76) / 0.4), p = proj(X(178.6) + (1 - k) * 4, D.F2); ctx.save(); ctx.globalAlpha = Math.max(0.35, k);
    if (!pic(ctx, 'decal_handpie', p.x, p.y + U * 0.05, U * 1.3, U * 1.25, { bottom: true })) { box(ctx, p.x - U * 0.5, p.y - U * 0.9, U * 1.0, U * 0.6, '#d9a85a', { ink: 3.5, border: 5 });
    box(ctx, p.x - U * 0.4, p.y - U * 0.35, U * 0.8, U * 0.35, '#f4f1ea', { ink: 3 }); } ctx.restore(); }
  // 193.0 → 202: the toothpick stabs the top of EVEREST on "toothpick" (200.59); the board prints ANSWER ✓; Kevin stares at it
  if (t > 196 && t < 206.5) { const p = { x: W * 0.62, y: H * 0.36 }, k = clamp((t - 200.59) / 0.2);
    const tp0 = proj(X(200.59) + 1.6, D.SUMMIT + 3.5), dy = (1 - k) * -U * 3; ctx.save(); ctx.translate(tp0.x, tp0.y + dy); box(ctx, -3, 0, 6, U * 3.5, '#e2b46b', { ink: 2.5 }); poly(ctx, [[0, -14], [10, 0], [-10, 0]], '#e2b46b', 2.5); ctx.restore();
    if (t >= 199.99 && art('sign_answer')) { const pop = 1 + 0.25 * Math.max(0, 1 - (t - 199.99) / 0.2) + (SECRET != null ? 0.2 * Math.max(0, 1 - (t - SECRET) / 0.3) : 0); pic(ctx, 'sign_answer', p.x, p.y, U * 4.2 * pop, U * 1.3 * pop); } else
    box(ctx, p.x - U * 1.6, p.y - U * 0.6, U * 3.2, U * 1.2, '#1b1d22', { ink: 4, border: 8 }); if (t >= 199.99 && !art('sign_answer')) { txt(ctx, 'ANSWER ✓', p.x, p.y - U * 0.1, U * 0.42, '#7dff9a'); ctx.save(); ctx.strokeStyle = '#e2b46b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - U * 0.6, p.y + U * 0.4); ctx.lineTo(p.x + U * 0.6, p.y + U * 0.3); ctx.stroke(); ctx.restore(); } }
  // 202.12: one small red QC bulb on "incorrect"
  if (t > 202.12 && t < 206.3) { const p = proj(X(204.5), D.SUMMIT + 2.4); circ(ctx, p.x, p.y, 6, RED, 2); glow(ctx, p.x, p.y, 30, '#ff3a2a', 0.5); }
  // 209.53 → 209.83: an overhead crane lowers the cardboard crown (it lands on his hard hat: crown())
  if (t > 208.9 && t < 209.9) { const hp = proj(s.x + CROWN_DX, s.y + CROWN_DY), k = clamp((t - 209.0) / 0.83); const y = lerp(-40, hp.y, ease(k)); ctx.fillStyle = INK; ctx.fillRect(hp.x - 1.5, -10, 3, y + 10); crownShape(ctx, hp.x, y, U); }
  // 214.60 "SENT": a pneumatic tube fires the ANSWER crate out of the factory
  if (t > 213.6 && t < 216) { const p = { x: bgx(214.6, 0.5, t, 0.6), y: proj(0, D.ROOF).y }, k = clamp((t - 214.6) / 0.5); box(ctx, p.x - U * 0.4, p.y - U * 5.4, U * 0.8, U * 5.4, 'rgba(200,230,255,0.25)', { ink: 3.5 });
    ctx.save(); ctx.translate(p.x, p.y - U * 0.6 - k * k * U * 9); box(ctx, -U * 0.32, -U * 0.3, U * 0.64, U * 0.6, CARD, { ink: 3, band: CARD2 }); txt(ctx, 'ANSWER', 0, 0, 8, INK); ctx.restore(); }
  // 230.49 GRAB A HELMET: every hook drops its hard hat; hats bounce off his
  if (t > 230.3 && t < 232.4) for (let i = 0; i < 14; i++) { const t0 = 230.49 + i * 0.05, k = t - t0; if (k < 0) continue; const hx = proj(s.x - 4 + i * 0.9 + rnd(i, 3) * 0.4, 0).x, y = -40 + k * k * 1400 + k * 200, bounce = y > H * 0.6;
    ctx.save(); ctx.translate(hx + (bounce ? (k - 0.3) * 200 * (i % 2 ? 1 : -1) : 0), Math.min(y, H * 0.6 - (bounce ? Math.sin((k - 0.3) * 8) * 60 : 0))); ctx.rotate(k * 6 * (i % 2 ? 1 : -1)); hardHat(ctx, 0, 0, U * 0.8); ctx.restore(); }
}
function granola(ctx, x, y, U, k) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.2 + k * 0.2); if (pic(ctx, 'decal_granola', 0, 0, U * 2.3, U * 1.0)) { ctx.restore(); return; } box(ctx, -U * 1.0, -U * 0.25, U * 2.0, U * 0.5, '#4f8a3a', { ink: 3.5, border: 6, band: '#3c6e2c' });
  poly(ctx, [[-U * 0.8, U * 0.2], [-U * 0.5, -U * 0.15], [-U * 0.3, U * 0.05], [0, -U * 0.2], [U * 0.3, U * 0.2]], '#e9e2cc', 2); ctx.restore(); }
function hardHat(ctx, x, y, s) { if (pic(ctx, 'prop_hardhat_small', x, y + s * 0.12, s * 1.3, s * 1.0, { bottom: true })) return; ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.arc(0, 0, s * 0.42, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#ffcf4a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  box(ctx, -s * 0.55, -2, s * 1.1, 6, '#e8b83a', { ink: 2.5 }); ctx.fillStyle = '#e8b83a'; ctx.fillRect(-s * 0.06, -s * 0.42, s * 0.12, s * 0.4); ctx.restore(); }
function crownShape(ctx, x, y, U) { if (pic(ctx, 'prop_crown_cardboard', x, y + U * 0.06, U * 0.95, U * 0.6, { bottom: true })) return;   // Chat's hand-cut cardboard crown (same spot: CROWN_DX/DY)
  const w = U * 0.9, h = U * 0.42; poly(ctx, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y - h], [x + w * 0.25, y - h * 0.5], [x, y - h * 1.1], [x - w * 0.25, y - h * 0.5], [x - w / 2, y - h]], '#e9b93a', 3.5, 5);
  ctx.fillStyle = CARD2; ctx.fillRect(x - w / 2 + 3, y - 6, w - 6, 3); circ(ctx, x, y - h * 0.45, 4, '#e2412e', 2); }
const CROWN_DX = 0.04, CROWN_DY = 1.32;   // (where the 3D Potato's hard-hat top is drawn, measured off the stills)
function crown(ctx, t, s, U) { if (t < 209.83 || t > 242.47) return; const p = proj(s.x + CROWN_DX, s.y + CROWN_DY); crownShape(ctx, p.x, p.y + Math.sin(t * 8) * 1.5, U); }

// ---------- Kevin's FRAGILE crate (from DATA 148.55): it rides 1.4 behind him, swaying on the beat; never touches a hazard ----------
function kevinCrate(ctx, t, s, U, CR) {
  if (s.grabAt == null || t < s.grabAt + 0.38 || t >= 242.5) { CR.y = null; return; }
  const cx = s.x - 1.4, fl = floorUnder(cx, s.y + 0.4), want = fl != null ? fl : s.y; if (CR.y == null || Math.abs(t - CR.t) > 0.5) CR.y = want; CR.y += (want - CR.y) * Math.min(1, (t - CR.t > 0 ? t - CR.t : 0) * 9); CR.t = t;
  const g = s.grabAt, land = clamp((t - (g + 0.38)) / 0.35), p = proj(cx, CR.y), sway = Math.sin(CC.beatOf(t) * Math.PI) * 0.06, w = U * 1.05, h = U * 0.7;
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(sway);
  // Kevin: head and shoulders out of the crate, amazed; he looks up when Mom types. Rework: he lands scared (148.57), ducks down till
  // only his scared face (eyes + O-mouth) shows over the rim (review fix: it was hair + eyes only), then rises to the shoulders by "LEAVE HIM ALONE"'s end (150.23), still shaking
  const mom = D.MESSAGES.some(([a, b, who]) => who === 'mom' && t >= a - 0.2 && t < b + 1.6), kv = lerp(-U * 2.4, 0, ease(land));
  const peek = t < g + 0.75 ? 0 : t < 149.0 ? ease((t - g - 0.75) / 0.2) : 1 - ease((t - 149.0) / 1.23), bnc = t >= g + 0.75 ? Math.exp(-(t - g - 0.75) / 0.12) * Math.cos((t - g - 0.75) * 30) : 0;
  kevin(ctx, 0, -h + kv + peek * U * 0.22, U, kevinScared(t, g) ? 'scared' : mom ? 'up' : t > 229.83 && t < 232 ? 'joy' : 'amazed', t);
  ctx.save(); ctx.scale(1 + 0.15 * bnc, 1 - 0.15 * bnc);
  box(ctx, -w / 2, -h, w, h, CARD, { ink: 3.5, border: 6, band: CARD2 }); cardFace(ctx, -w / 2, -h, w, h, U); ctx.restore(); ctx.fillStyle = CARD2; ctx.fillRect(-w / 2, -h * 0.5, w, 2.5);
  if (!stampArt(ctx, 'stamp_fragile', 0, -h * 0.38, w * 0.92, 1, -0.08)) txt(ctx, 'FRAGILE', 0, -h * 0.3, Math.max(8, U * 0.17), RED); txt(ctx, '↑↑', 0, -h * 0.82, Math.max(7, U * 0.13), INK);
  if (t > 231.0 && !pic(ctx, 'prop_hardhat_small', 0, -h - U * 1.12 + kv, U * 0.62, U * 0.5)) hardHat(ctx, 0, -h - U * 0.83 + kv, U * 0.42);   // a small hat lands on Kevin
  ctx.restore();
  CR.x = cx; CR.px = p.x; CR.py = p.y;
}
function kevin(ctx, x, y, U, mood, t) { const sc = U / 60;
  // Chat's Kevin (the same kid everywhere: the full figure while he's pulled out of the monitor, head + hoodie out of the crate after);
  // he tips his head up to the screen when Mom types, bobs when the hats rain. Rework (Matt: "make kevin look scared when he gets
  // kidnapped"): 'worried' (brows) in the monitor, 'scared' / 'fullscared' when he's taken: a face drawn over the art, head shaking
  const full = mood === 'full' || mood === 'fullscared', fear = mood === 'scared' || mood === 'fullscared' ? 'scared' : mood === 'worried' ? 'worried' : null;
  if (full ? art('turn_kevin_front') : art('kevin_bust')) { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    if (fear === 'scared') ctx.translate(Math.sin(t * 2 * Math.PI * 30) * 2, Math.cos(t * 2 * Math.PI * 23) * 0.8);
    if (full) { pic(ctx, 'turn_kevin_front', 0, -40, 140, 130); if (fear) scaredFace(ctx, 'full', artBox('turn_kevin_front', 0, -40, 140, 130), t, fear); }
    else { const bob = mood === 'joy' ? -Math.abs(Math.sin(t * 9)) * 6 : 0; pic(ctx, 'kevin_bust', 0, 10 + bob, 90, 84, { bottom: true, rot: mood === 'up' ? -0.16 : 0 });
      if (fear) scaredFace(ctx, 'bust', artBox('kevin_bust', 0, 10 + bob, 90, 84, true), t, fear); }
    ctx.restore(); return; }
  if (full) mood = 'amazed';
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  box(ctx, -26, -18, 52, 26, '#3a7bd5', { ink: 3, band: '#2f66b3' }); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 2; i++) ctx.fillRect(-26, -12 + i * 10, 52, 3);   // a striped tee, shoulders only
  circ(ctx, 0, -38, 21, '#f2c79a', 3);
  ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(0, -52, 22, 11, 0, Math.PI, 0); ctx.fill(); for (let i = 0; i < 5; i++) poly(ctx, [[-18 + i * 9, -56], [-12 + i * 9, -66 - (i % 2) * 4], [-8 + i * 9, -55]], '#5a3a22', 0);
  const up = mood === 'up' ? -5 : 0; for (const dx of [-8, 8]) { circ(ctx, dx, -40 + up * 0.4, mood === 'amazed' || mood === 'joy' ? 6.5 : 5.5, '#fff', 2); circ(ctx, dx + (mood === 'up' ? 0 : 1.5), -40 + up, 2.6, INK, 0); }
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); if (mood === 'up') { ctx.moveTo(-5, -27); ctx.lineTo(5, -27); } else { ctx.ellipse(0, -27, 4, mood === 'joy' ? 5 : 3.5, 0, 0, 7); } ctx.stroke();
  ctx.restore(); }

// where pic() puts art n (fitted in mw × mh at cx, cy): its top-left and scale, so a face can be drawn in the art's own pixels
function artBox(n, cx, cy, mw, mh, bottom = false) { const im = art(n); if (!im) return null; const k = Math.min(mw / im.naturalWidth, mh / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
  return { x0: cx - w / 2, y0: bottom ? cy - h : cy - h / 2, k }; }
// the scared face, in art pixels (measured off kevin_bust 161×200 and turn_kevin_front 136×300): huge white eyes with pinprick pupils
// trembling at 20 Hz, brows up in the middle, the buck-tooth grin painted over with skin and an "O" mouth, sweat flying off his
// temples, shock lines either side. 'worried' = the brows only. No hands (his are in his pockets in the art).
const KFACE = { stk: { eL: [215, 194], eR: [290, 210], er: 22, m: [250, 276], skin: '#fcb987', patches: [[250, 273, 64, 21, 0.06], [193, 249, 20, 13, 0.5], [306, 265, 15, 10, -0.3]], tL: [150, 215], tR: [345, 228], hw: 105, hy: 215 },
  bust: { eL: [64, 87], eR: [95, 86], er: 13, m: [76, 117], patch: [76, 114, 25, 12], tL: [44, 84], tR: [116, 82], hw: 50, hy: 80 },
  full: { eL: [55, 72], eR: [78, 71], er: 10, m: [66, 100], patch: [66, 99, 19, 9], tL: [38, 70], tR: [95, 69], hw: 38, hy: 68 } };
function scaredFace(ctx, which, B, t, level) { if (!B) return; const F = KFACE[which], r = F.er; ctx.save(); ctx.translate(B.x0, B.y0); ctx.scale(B.k, B.k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const brow = (x0, y0, x1, y1) => { ctx.lineWidth = r * 0.42; ctx.strokeStyle = '#3a2412'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  if (level === 'scared') {
    ctx.fillStyle = F.skin || '#eeac72'; for (const [px, py, rx, ry, pr] of F.patches || [[...F.patch, 0]]) { ctx.beginPath(); ctx.ellipse(px, py, rx, ry, pr, 0, 0, 7); ctx.fill(); }   // the grin painted over
    const wob = Math.sin(t * 50) * 0.6; ctx.fillStyle = '#5a1a14'; ctx.beginPath(); ctx.ellipse(F.m[0], F.m[1], r * 0.45 + wob * 0.3, r * 0.62 - wob * 0.3, 0, 0, 7); ctx.fill();
    ctx.lineWidth = r * 0.22; ctx.strokeStyle = INK; ctx.stroke();
    for (const [ex, ey] of [F.eL, F.eR]) { ctx.beginPath(); ctx.ellipse(ex, ey, r * 1.12, r * 1.25, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = r * 0.24; ctx.strokeStyle = INK; ctx.stroke();
      const jx = (rnd(Math.floor(t * 20), ex) - 0.5) * 2.4, jy = (rnd(Math.floor(t * 20), ey + 3) - 0.5) * 2.4; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + jx, ey + jy, r * 0.2, 0, 7); ctx.fill(); }
    brow(F.eL[0] - r * 1.1, F.eL[1] - r * 1.45, F.eL[0] + r * 0.9, F.eL[1] - r * 2.1); brow(F.eR[0] - r * 0.9, F.eR[1] - r * 2.1, F.eR[0] + r * 1.1, F.eR[1] - r * 1.45);
    // sweat: a drop off each temple every 0.4 s
    for (const [sx, sy, dir] of [[...F.tL, -1], [...F.tR, 1]]) for (const off of [0, 0.5]) { const ph = ((t + off * 0.4) / 0.4) % 1, dx = sx + dir * ph * r * 2.2, dy = sy - r * 0.6 * ph + r * 2.4 * ph * ph;
      ctx.save(); ctx.globalAlpha *= 1 - ph * 0.6; ctx.translate(dx, dy); ctx.rotate(dir * 0.5); ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.quadraticCurveTo(r * 0.45, -r * 0.05, 0, r * 0.35); ctx.quadraticCurveTo(-r * 0.45, -r * 0.05, 0, -r * 0.7);
      ctx.fillStyle = '#8fd3ff'; ctx.fill(); ctx.lineWidth = r * 0.12; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.1, r * 0.09, 0, 7); ctx.fill(); ctx.restore(); }
    // shock lines either side of his head
    ctx.lineWidth = r * 0.22; ctx.strokeStyle = INK; const cx = (F.eL[0] + F.eR[0]) / 2; for (const dir of [-1, 1]) for (let i = 0; i < 3; i++) { const a = (-0.5 + i * 0.5) * 0.7, x0 = cx + dir * (F.hw + r * 0.4), y0 = F.hy + (i - 1) * r * 1.3;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + dir * Math.cos(a) * r * 1.2, y0 + Math.sin(a) * r * 1.2); ctx.stroke(); } }
  else { brow(F.eL[0] - r * 1.0, F.eL[1] - r * 1.15, F.eL[0] + r * 0.8, F.eL[1] - r * 1.6); brow(F.eR[0] - r * 0.8, F.eR[1] - r * 1.6, F.eR[0] + r * 1.0, F.eR[1] - r * 1.15); }
  ctx.restore(); }
// when Kevin is scared (the kidnapping, then the socket dive into the dark and just before the slam)
const kevinScared = (t, g) => (g != null && t >= g + 0.38 && t < 150.6) || span(t, 175.09, 175.89) || span(t, 241.67, 242.47);

// ---------- the gantry monitor: Kevin's and Mom's messages (a thing in the world: hanging over the belt, then bolted to Kevin's crate) ----------
function msgAt(t) { let m = null; for (const r of D.MESSAGES) if (t >= r[0] - 0.05) m = r; return m && (t < m[1] + 7 || m[2] === 'mom' || m[3] === 'its me kevin' || m[3] === 'potato?') ? m : null; }
function monitor(ctx, t, s, U, CR) {
  if (t < 13.18 || t >= 242.5) return;
  const g = s.grabAt, onCrate = g != null && t >= g + 1.23 && CR.px != null, falling = g != null && t >= g + 0.97 && t < g + 1.23;
  // idle (no message), the hanging screen is small and dim; a message coming in pulls it down to full size
  const act = [0, 0.1, 0.2, 0.3].reduce((a, d) => a + (msgAt(t - d) ? 0.25 : 0), 0), ak = ease(act);
  let x = 16, y = 28 + Math.sin(t * 1.3) * 2 - (1 - ak) * 14, w = lerp(150, 304, ak), h = lerp(50, 80, ak);
  // (review fix: no empty box: it shows only while a message is typed / read (and the chat bar's flight in), fades out after;
  //  for the Kevin moment it grows so his worried → scared face is the big read: 147.09 → the grab)
  const gk = g ?? D.GRAB, vis = onCrate || falling || (t >= 144.0 && t < gk + 1.3) ? 1 : Math.max(ak, t < 14.6 ? 1 - clamp((t - 14.3) / 0.3) : 0);
  if (vis <= 0.01) return;
  const big = !(onCrate || falling) && t >= KEVIN_SCARE - 0.2 && t < gk + 0.75 ? ease((t - KEVIN_SCARE + 0.2) / 0.25) * (1 - ease((t - gk - 0.45) / 0.3)) : 0;
  w = lerp(w, 330, big); h = lerp(h, 112, big);   // (bottom stays above his head on the upper floor; right edge clear of the lyric)
  if (t < 13.18 + 0.9) y -= (1 - ease((t - 13.18) / 0.9)) * 140;                                                                       // the screen drops in on its cables
  if (t >= 13.18 && t < 14.37) { const k = ease((t - 13.3) / 0.9), bx = lerp(W * 0.3, x + 7, k), by = lerp(H * 0.62, y + 7, k), bw = lerp(W * 0.5, w - 14, k);   // Kevin's chat bar flies up into it
    if (k < 1) { ctx.save(); ctx.globalAlpha = 1 - k * 0.6; box(ctx, bx, by, bw, lerp(40, h - 14, k), PAPER, { ink: 3, border: 6 }); ctx.restore(); } }
  if ((onCrate || falling) && CR.px != null) { const tx = CR.px - U * 2.6, ty = CR.py - U * 2.75, k = onCrate ? 1 : ease((t - g - 0.97) / 0.26); w = lerp(304, U * 3.3, k); h = lerp(80, U * 1.05, k); x = Math.max(12, lerp(x, tx, k)); y = Math.max(8, lerp(y, ty, k));
    if (onCrate) { ctx.fillStyle = INK; ctx.fillRect(CR.px - U * 0.3, ty + h, 4, CR.py - (ty + h) - U * 0.68); } }
  else { ctx.save(); ctx.globalAlpha = vis; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 40, -5); ctx.lineTo(x + 40, y); ctx.moveTo(x + w - 40, -5); ctx.lineTo(x + w - 40, y); ctx.stroke(); ctx.restore(); }   // hanging from the gantry
  const dark = span(t, 175.19, 178.33), flick = t > 243 ? 0 : 0;
  // (when he flies up past it — a launch apex — the hanging monitor goes see-through so he's never hidden behind the screen)
  const me = proj(s.x, s.y + 1.3), near = !(onCrate || falling) && me.x - U * 0.6 < x + w + 10 && me.y < y + h + 10 ? 1 : 0;
  CR.fadeK = (CR.fadeK || 0) + (near - (CR.fadeK || 0)) * 0.25; ctx.save(); ctx.globalAlpha = (1 - 0.72 * CR.fadeK) * vis;
  box(ctx, x, y, w, h, '#2b2f36', { ink: 4, border: 7 }); const sx = x + 7, sy = y + 7, sw = w - 14, sh = h - 14;
  const m = msgAt(t), stall = t > 144.97 && t < 147.82;
  ctx.fillStyle = m && m[2] === 'mom' ? '#fff0ea' : PAPER; ctx.fillRect(sx, sy, sw, sh);
  if (g != null && t >= g && t < g + 0.4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3; ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, sy, sw, sh); ctx.restore(); }   // (review fix: 0.6 washed his scared face out)
  if (m && m[0] > -1 && !(g != null && t >= g && t < g + 1.23)) { const [a, b, who, text, how] = m, typed = how === 'unsent' ? '' : D.typedAt(m, t), sz = Math.max(11, Math.min(15, sh * 0.3));
    txt(ctx, who, sx + 6, sy + sz * 0.7, sz * 0.75, who === 'mom' ? '#c0302a' : '#2f6aa0', { align: 'left' });
    ctx.save(); ctx.font = `400 ${sz}px ${MONO}`; let shown = typed; while (ctx.measureText(shown).width > sw - 14 && shown.length) shown = shown.slice(1); ctx.restore();
    if (how === 'unsent') { for (let i = 0; i < 3; i++) circ(ctx, sx + 14 + i * 14, sy + sh * 0.62, 3.5, Math.floor(t * 3) % 3 === i ? INK : '#9a9284', 0); }
    else { const col = who === 'mom' && text === 'GIVE HIM BACK' ? '#c0302a' : INK; ctx.save(); ctx.font = `400 ${sz}px ${MONO}`; const fits = ctx.measureText(typed).width <= sw - 14; ctx.restore();
      if (fits) txt(ctx, typed, sx + 6, sy + sh * 0.62, sz, col, { align: 'left' });
      else { const cut = typed.lastIndexOf(' ', Math.ceil(typed.length / 2) + 2), a1 = cut > 0 ? typed.slice(0, cut) : typed.slice(0, Math.ceil(typed.length / 2)), a2 = typed.slice(a1.length).trim(), z = sz * 0.82;
        txt(ctx, a1, sx + 6, sy + sh * 0.5, z, col, { align: 'left' }); txt(ctx, a2, sx + 6, sy + sh * 0.5 + z * 1.15, z, col, { align: 'left' }); } }
    if (t >= b && how !== 'unsent' && t - b < 30) txt(ctx, 'sent', sx + sw - 6, sy + sz * 0.7, sz * 0.6, '#8a8274', { align: 'right' }); }
  if (!m) { if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#b8b0a0'; ctx.fillRect(sx + 8, sy + sh * 0.45, 8, 2); } }
  if (stall) { ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 20); ctx.fillStyle = '#ffcf4a'; ctx.fillRect(sx, sy, sw, sh); ctx.restore(); }
  { const gg = g ?? D.GRAB; if (t >= 147.30 && t < gg + 0.38) {   // (rework) 147.30 "potato?": Kevin seen inside the monitor, worried (webcam style); HE'S: pressed scared against the glass
    const hit = t >= gg, k = hit ? ease((t - gg) / 0.15) : 0, ue = sh * 1.05 * 60 / 84 * lerp(1, 1.15, k), kx = lerp(sx + sw * 0.82, sx + sw * 0.5, k);
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.fillStyle = hit ? '#d8eef8' : '#cfe0ea'; ctx.fillRect(lerp(sx + sw * 0.64, sx, k), sy, lerp(sw * 0.36, sw, k), sh);
    ctx.translate(kx, sy + sh + 2); ctx.scale(1 + 0.08 * k, 1 - 0.08 * k); kevin(ctx, 0, 0, ue, hit ? 'scared' : 'worried', t);
    if (hit) { ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff'; ctx.fillRect(-sw, -sh * 1.3, sw * 2, sh * 0.25); }   // the glass glare he's squashed against
    ctx.restore(); } }
  if (dark) glow(ctx, x + w / 2, y + h / 2, 90, '#fff0ea', 0.35);
  ctx.restore();
  // 147.82 HE'S → 148.20 IN → 148.55 DATA: his tether (purple: his glitch, on him) hooks the monitor and Kevin is pulled out like taffy
  if (g != null && t >= g && t < g + 1.0) { const me = proj(s.x, s.y + 0.8), mx = x + w / 2, my = y + h / 2; tether(ctx, me.x, me.y, mx, my, t, Math.min(1, (t - g) / 0.12));
    // (rework: he's dragged out backwards, feet first toward the crate, kicking ±0.25 rad at 8 Hz, his head lagging the pull: scared)
    if (t >= g + 0.38 && t < g + 0.75) { const k = ease((t - g - 0.38) / 0.35), ex = proj(s.x - 1.4, s.y).x, ey = proj(s.x - 1.4, s.y + 0.9).y, tx = lerp(mx, ex, k), ty = lerp(my, ey, k), st = 1 + Math.sin(k * Math.PI) * 0.6;
      const th = Math.atan2(-(ex - mx), ey - my) + 0.25 * Math.sin(t * 2 * Math.PI * 8);
      const KS = lerp(2.4, 1.0, k * k);   // (review fix: the dragged, scared Kevin is the big read: 2.4× leaving the monitor, his size again in the crate)
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(th); ctx.scale(1 / st, st); ctx.translate(0, U * 0.7 * KS); kevin(ctx, 0, 0, U * KS, 'fullscared', t); ctx.restore(); } }
}
function tether(ctx, ax, ay, bx, by, t, k) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = PURPLE; ctx.lineWidth = 4; ctx.shadowColor = PURPLE; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(ax, ay);
  const n = 10, ex = lerp(ax, bx, k), ey = lerp(ay, by, k); for (let i = 1; i <= n; i++) { const f = i / n, j = (rnd(i, Math.floor(t * 24)) - 0.5) * 22 * Math.sin(f * Math.PI); ctx.lineTo(lerp(ax, ex, f) + j, lerp(ay, ey, f) - Math.sin(f * Math.PI) * 40 + j * 0.5); } ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#e8dcff'; ctx.stroke(); ctx.restore(); }

// ---------- his thought bubble: the dots, the glitch words, "?" "??", "answering???" (0 → 10.17); the double-check bubble (211.4 → 213.89) ----------
const GW = ['krrzzt', 'wh@t?!', 's0r—t@', '…um', '¿¿', 'n0pe'];
function bubble(ctx, t, s, U) {
  let txtS = null, k = 1, sw = 1;
  if (t >= -1.2 && t < 10.17) { if (t < 1.13) txtS = '...'.slice(0, 1 + Math.floor(((t + 9) * 2.5) % 3)); else if (t < 2.73) txtS = GW[Math.floor(t * 9) % GW.length]; else if (t < 4.2) txtS = '?'; else if (t < 7.26) txtS = '??';
    else { const q = [7.85, 8.44, 9.03].filter(a => t >= a).length; txtS = 'answering' + '?'.repeat(q); if (t >= 9.62) sw = 1 + 0.35 * ease((t - 9.62) / 0.5) + 0.05 * Math.sin(t * 40); }
    k = clamp((t + 1.2) / 0.3) * (t > 10.0 ? 1 - (t - 10.0) / 0.17 : 1); }
  if (t >= 211.4 && t < 214.1) { txtS = '?'.repeat(1 + [211.7, 212.9].filter(a => t >= a).length); sw = 1 + 0.18 * [211.7, 212.9].filter(a => t >= a).length + 0.06 * Math.sin(t * 9); k = t >= 213.89 ? 1 - (t - 213.89) / 0.2 : clamp((t - 211.4) / 0.2); }
  if (txtS == null || k <= 0) return;
  const p = proj(s.x + 0.9, s.y + (t > 200 ? 2.05 : 2.55)), small = txtS.length > 8, bw = (small ? 26 + txtS.length * 12 : 92) * sw, bh = 52 * sw, x = p.x + 10, y = p.y - bh;
  ctx.save(); ctx.globalAlpha = k; const sh = t > 1.13 && t < 7.26 ? (rnd(Math.floor(t * 20), 5) - 0.5) * 6 : 0; ctx.translate(sh, 0);
  for (const [dx, dy, r] of [[-18, bh + 18, 6], [-6, bh + 6, 9]]) { if (OLD_WHITE) circ(ctx, x + dx, y + dy, r + 4, '#fff', 0); circ(ctx, x + dx, y + dy, r, '#fff', 3); }
  if (OLD_WHITE) { ctx.beginPath(); ctx.ellipse(x + bw / 2, y + bh / 2, bw / 2 + 5, bh / 2 + 5, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(x + bw / 2, y + bh / 2, bw / 2, bh / 2, 0, 0, 7); ctx.fillStyle = PAPER; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
  txt(ctx, txtS, x + bw / 2, y + bh / 2 + 1, Math.min(20, (bw - 18) / Math.max(1.6, txtS.length * 0.66)), t > 1.13 && t < 2.73 ? '#7a3cf0' : INK);
  if (t >= 213.89 && t < 214.1) { ctx.globalAlpha = 1; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; circ(ctx, x + bw / 2 + Math.cos(a) * bw * 0.7 * (1 + (t - 213.89) * 6), y + bh / 2 + Math.sin(a) * bh * 0.7 * (1 + (t - 213.89) * 6), 4, PAPER, 2); } }
  ctx.restore(); }

// ---------- THE FOLD (241.3 → 243.6): blank cardboard backs, the freeze, slammed flat on 242.47, the binary drain ----------
function fold(ctx, t, s, U, CR) {
  const back = clamp((t - 241.3) / 0.5), slam = t >= 242.47 ? clamp((t - 242.47) / 0.12) : 0;
  // every shipped crate turns to show its blank cardboard back (a wash of kraft over the front layer)
  ctx.save(); ctx.globalAlpha = back * 0.55 * (1 - slam); ctx.fillStyle = CARD; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = back * 0.35 * (1 - slam); ctx.fillStyle = CARD2; for (let x = 0; x < W; x += 9) ctx.fillRect(x, 0, 3, H); ctx.restore();
  if (back > 0 && slam < 1) for (let i = 0; i < 18; i++) { const x = 30 + i * 52, y = H * (0.3 + 0.4 * rnd(i, 3)), hang = t >= 241.8 && t < 242.47 ? Math.sin(i) * 3 : 0; box(ctx, x, y + hang, 40, 30, CARD, { ink: 2.5, band: CARD2 }); }
  if (slam > 0) { ctx.fillStyle = '#05060a'; ctx.globalAlpha = slam; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; const fy = H * 0.62; ctx.fillStyle = CARD; ctx.fillRect(0, fy - 6 * (1 - slam) - 4, W, 8); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(-4, fy - 4, W + 8, 8);
    if (t < 242.55) { ctx.fillStyle = '#fff6e0'; ctx.globalAlpha = 1 - (t - 242.47) / 0.08; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } }
  // 242.5 → 243.5: the products drain away as green binary
  if (t > 242.5 && t < 243.6) { ctx.save(); ctx.font = `400 14px ${MONO}`; ctx.fillStyle = GREEN; const k = t - 242.5; for (let i = 0; i < 90; i++) { const x = rnd(i, 1) * W, y = H * 0.6 + (k * (300 + 400 * rnd(i, 2))) % 260; ctx.globalAlpha = (1 - k) * 0.85; ctx.fillText(rnd(i, Math.floor(t * 20)) < 0.5 ? '0' : '1', x, y); } ctx.restore(); }
  // Kevin's crate falls with the cardboard: the lid stamped DATA, empty
  if (t > 242.47 && t < 243.6 && CR.px != null) { const k = t - 242.47, x = CR.px, y = CR.py + k * k * 600; ctx.save(); ctx.translate(x, Math.min(y, H * 0.62)); ctx.rotate(k * 0.8); box(ctx, -U * 0.52, -U * 0.7, U * 1.05, U * 0.7, CARD, { ink: 3.5, band: CARD2 });
    box(ctx, -U * 0.55, -U * 0.82, U * 1.1, U * 0.14, CARD2, { ink: 3 }); if (!stampArt(ctx, 'stamp_data', 0, -U * 0.36, U * 0.95, 1, -0.15)) stamp(ctx, 0, -U * 0.35, U * 0.3, 1, RED, 'DATA'); ctx.restore(); }
}

// ---------- THE DESK AT DAWN (243.6 → 248.41): the empty chair, the ANSWER crate, "please", the newspaper, black, the router ----------
function dawn(ctx, t, s) {
  const d = clamp((t - 245.4) / 2.2), sky = mix('#141a2a', '#4e5664', d), sky2 = mix('#1d2c4a', '#f2a86a', d), rb = span(t, 248.1, 248.4);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  let led = { x: 358, y: 131 };
  if (art('room_desk')) led = dawnDesk(ctx, t, d, sky2, rb); else {
  box(ctx, 60, 50, 230, 170, sky2, { ink: 4 }); if (d > 0) { ctx.fillStyle = mix('#1d2c4a', '#ffd27a', d); ctx.fillRect(64, 160, 222, 56); } ctx.fillStyle = INK; ctx.fillRect(173, 50, 4, 170); ctx.fillRect(60, 133, 230, 4);
  // the shelf + the router (it blinks purple once at 248.1)
  box(ctx, 320, 150, 140, 12, '#6b4a2e', { ink: 3 }); box(ctx, 345, 112, 70, 38, '#2a2f38', { ink: 3, band: '#1d2128' }); circ(ctx, 358, 131, 4, rb ? PURPLE : '#3dff8a', 1.5); if (rb) glow(ctx, 358, 131, 70, PURPLE, 0.9);
  // the desk, the laptop (the reply on screen, unread), the empty chair, the ANSWER crate
  ctx.fillStyle = '#5a3a24'; ctx.fillRect(0, 380, W, H); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 380); ctx.lineTo(W, 380); ctx.stroke(); ctx.fillStyle = '#4a2f1d'; ctx.fillRect(0, 384, W, 12);
  const flick = (D.PLEASE_BEATS.some(b => t >= b && t < b + 0.07)) ? 0.85 : 1;
  box(ctx, 500, 170, 330, 205, '#2b2f36', { ink: 4 }); ctx.save(); ctx.globalAlpha = flick; ctx.fillStyle = '#1f4e79'; ctx.fillRect(512, 182, 306, 181); ctx.restore(); box(ctx, 470, 372, 390, 14, '#3a4250', { ink: 3 });
  box(ctx, 528, 196, 274, 40, PAPER, { ink: 3 }); txt(ctx, D.MSG1, 536, 216, 10, INK, { align: 'left', font: '600' }); txt(ctx, 'sent', 796, 228, 8, '#8a8274', { align: 'right' });
  box(ctx, 528, 300, 274, 48, '#fff0ea', { ink: 3 }); txt(ctx, 'mom', 536, 312, 9, '#c0302a', { align: 'left' }); const pl = D.typedAt(D.MESSAGES[D.MESSAGES.length - 1], t); txt(ctx, pl, 538, 332, 15, INK, { align: 'left' });
  if (Math.floor(t * 2.5) % 2) { ctx.fillStyle = INK; ctx.save(); ctx.font = `400 15px ${MONO}`; ctx.fillRect(540 + ctx.measureText(pl).width, 322, 2, 18); ctx.restore(); }
  box(ctx, 300, 300, 120, 80, CARD, { ink: 3.5, band: CARD2, border: 6 }); txt(ctx, 'ANSWER', 360, 340, 13, INK);
  // the chair, empty, turned a little
  box(ctx, 880, 250, 70, 130, '#3a3f4a', { ink: 4, band: '#2c3038' }); box(ctx, 860, 380, 100, 20, '#3a3f4a', { ink: 3 }); ctx.fillStyle = INK; ctx.fillRect(905, 400, 6, 120); }
  ctx.fillStyle = 'rgba(255,200,140,' + (0.12 * d) + ')'; ctx.fillRect(0, 0, W, H);
  // 246.63 → 247.30: the newspaper spins in on the beats and lands on Matt's last big tap
  if (t > 246.63) { const k = clamp((t - 246.63) / 0.67), a = (1 - ease(k)) * 9, sc = 0.2 + 0.8 * ease(k); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(a + (k >= 1 ? -0.04 : 0)); ctx.scale(sc, sc);
    box(ctx, -330, -200, 660, 400, '#f2eee2', { ink: 5, border: 10 }); txt(ctx, 'THE DAILY', 0, -168, 22, INK); ctx.fillStyle = INK; ctx.fillRect(-310, -150, 620, 4);
    txt(ctx, 'LOCAL BOY, KEVIN,', 0, -108, 40, INK); txt(ctx, 'MISSING.', 0, -60, 40, INK);
    txt(ctx, 'FAMILY SAYS A.I. AGENT', 0, -8, 24, INK); txt(ctx, 'IS RESPONSIBLE.', 0, 24, 24, INK);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#b8b2a4'; ctx.fillRect(-310, 60 + i * 20, 290, 8); ctx.fillRect(20, 60 + i * 20, 290, 8); } ctx.restore(); }
  // 247.85: black — and at 248.1 the router blinks purple once (him, still out there)
  if (t >= 247.85) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); if (rb) { circ(ctx, led.x, led.y, 5, PURPLE, 0); glow(ctx, led.x, led.y, 80, PURPLE, 0.9); } }
}
// the dawn room on Chat's desk (room_desk) with the same chat window as the intro (room_laptop_screen) on its laptop: Kevin's sent
// question, Mom's "please"; the empty chair pushed back behind it, the ANSWER crate on the floor. Returns the router's LED (the blink).
function dawnDesk(ctx, t, d, sky2, rb) {
  // (fix pass: the desk drawn smaller so the empty chair stands clear at its right and the ANSWER crate sits on the floor in view)
  const dw = 640, im = art('room_desk'), dh = dw * im.naturalHeight / im.naturalWidth, x0 = 110, y0 = H - dh + 8;
  box(ctx, 40, 40, 210, 160, sky2, { ink: 4 }); if (d > 0) { ctx.fillStyle = mix('#1d2c4a', '#ffd27a', d); ctx.fillRect(44, 140, 202, 56); } ctx.fillStyle = INK; ctx.fillRect(143, 40, 4, 160); ctx.fillRect(40, 118, 210, 4);
  ctx.fillStyle = '#5a3a24'; ctx.fillRect(0, 430, W, H); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(0, 430); ctx.lineTo(W, 430); ctx.stroke();   // the floor
  ctx.drawImage(im, x0, y0, dw, dh);
  const gl = { x: x0 + 0.7065 * dw, y: y0 + 0.5444 * dh }; circ(ctx, gl.x, gl.y, 0.0085 * dw, '#2b415b', 0); circ(ctx, gl.x, gl.y, 0.004 * dw, '#1a2230', 0);   // (the desk art's own green LED, painted out: only the purple blink shows)
  // the empty chair, pushed back clear of the desk, turned a little
  box(ctx, 812, 236, 74, 150, '#3a3f4a', { ink: 4, band: '#2c3038' }); box(ctx, 790, 382, 110, 20, '#3a3f4a', { ink: 3 }); ctx.fillStyle = INK; ctx.fillRect(842, 402, 6, 100);
  ctx.fillRect(812, 500, 66, 6); circ(ctx, 814, 506, 6, INK, 0); circ(ctx, 876, 506, 6, INK, 0);
  const sx = x0 + 0.356 * dw, sy = y0 + 0.187 * dh, sw = 0.279 * dw, sh = 0.289 * dh, flick = (D.PLEASE_BEATS.some(b => t >= b && t < b + 0.07)) ? 0.85 : 1;
  const scr = art('room_laptop_screen'); ctx.save(); ctx.globalAlpha = flick; if (scr) ctx.drawImage(scr, sx, sy, sw, sh); else { ctx.fillStyle = '#1f4e79'; ctx.fillRect(sx, sy, sw, sh); } ctx.restore();
  const mx = sx + sw * 0.215, mw = sw * 0.75;
  box(ctx, mx, sy + sh * 0.26, mw, 24, PAPER, { ink: 2.5 }); txt(ctx, D.MSG_Q, mx + 5, sy + sh * 0.26 + 8, 8, INK, { align: 'left', font: '600' }); txt(ctx, D.MSG_SIGN, mx + 5, sy + sh * 0.26 + 17, 8, INK, { align: 'left', font: '600' }); txt(ctx, 'sent', mx + mw - 4, sy + sh * 0.26 + 30, 7, '#c8c0b0', { align: 'right' });
  const my = sy + sh * 0.55; box(ctx, mx, my, mw, 34, '#fff0ea', { ink: 2.5 }); txt(ctx, 'mom', mx + 5, my + 8, 8, '#c0302a', { align: 'left' }); const pl = D.typedAt(D.MESSAGES[D.MESSAGES.length - 1], t); txt(ctx, pl, mx + 6, my + 22, 13, INK, { align: 'left' });
  if (Math.floor(t * 2.5) % 2) { ctx.save(); ctx.font = `400 13px ${MONO}`; ctx.fillStyle = INK; ctx.fillRect(mx + 8 + ctx.measureText(pl).width, my + 15, 2, 14); ctx.restore(); }
  box(ctx, 70, 410, 116, 76, CARD, { ink: 3.5, band: CARD2, border: 6 }); cardFace(ctx, 70, 410, 116, 76, 60); txt(ctx, 'ANSWER', 128, 448, 13, INK);   // the ANSWER crate, on the floor
  const led = gl; if (rb) glow(ctx, led.x, led.y, 70, PURPLE, 0.9), circ(ctx, led.x, led.y, 5, PURPLE, 0);
  return led; }

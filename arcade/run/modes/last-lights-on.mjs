// modes/last-lights-on.mjs — Level 10, Last Lights On, v4 (Nov 1): back on the street, the music video you play.
// Chikin: "has the right energy but I think it does need more interaction. I love the models in the windows, I think that
// should rack up a score. He should go back to waddling and jumping, but no pits to fall in … when you jump and spin in
// this one he glitches like crazy and occasionally, a big big glitch and a bunch of models fill windows" · "i want it more
// like the last lights you tube video version 2" · "no more v key, just space bar".
// The plan is game/stories/last-lights-on.md (its "Album pass" wins). The beat sheet and every time live in the level file
// (run/levels/last-lights-on.mjs, def.ll); this file is the RULES (pure, deterministic, 120 Hz: the bot and the replay run
// the same code) plus the browser-only pieces that need three.js (the real model baked into little copies, the eyes hook).
//
//   · He WADDLES right on his own down one long street. Solid ground, no pits. He can't die (the finale).
//   · ↑ JUMP (his forward flip): every jump throws ONE copy of him (in whatever he's wearing) into a free window on the
//     skyline. No double jump.
//   · ← / → IN THE AIR = SPIN (a sideways twirl in a purple storm), one per jump: 1 more copy off the beat, 3 on it.
//     THE SPIN LIFTS HIM INTO A GLITCH-FLIGHT (Chikin, Nov 1: "he walks and jumps and flies and stuff right, like when he spins
//     around"): he rises up along the buildings, wrapped in purple (nothing can hit him on the way up), throwing his copies into
//     the HIGHER windows as he goes, then floats back down to waddle. On the beat he goes higher (3.0 up, its top lands on the
//     next beat and throws one more copy up there, and he touches down ON the beat two beats later); off the beat it's a short
//     lift (2.1 up). Coming down he floats over bins / cars / barriers in his way (a drone can still clip him), and ↑ while he
//     floats down drops him quick to the street and hops him straight off again (so the hop-spin rhythm keeps going).
//   · SPACE = BREAK, on the ring: the album's cue (a purple ring closes on him in three ticks, press on the 4th beat).
//     It breaks his costume into the sky (the next one forms at once) or smashes the thing with the purple crack.
//     Space with no ring (or more than 0.05 s before a ring's good window): a small glitch and Space locks for 0.35 s; pressing
//     while it's locked keeps it locked, so mashing never lands a ring or a network bar (Nov 1 fix: the mash bot grades C).
//   · BIG GLITCH: on five hits he fizzes for two bars; in the air on the hit = a whole block fills with him.
//   · A BUMP (a bin, a car, a drone): he stumbles, angry, -200, the combo drops to x1, three of his windows on screen go dark.
//   · THE GRADE (finalScore): score share + breaks + staying on your feet, so mashing can't buy it (bots: perfect S · good A ·
//     casual-clean B · mash C).
//   · THE WINDOWS ARE THE SCORE AND THE STORY: amber (people) · dark · cyan (machines) · grey (his, doubted) · HIS (a copy
//     stands in it). Copies only go into windows on screen: dark first, then grey, then cyan; never amber; next to his own first
//     (a window, then its floor, then the block). Each big hit's block is kept out of his hops so the big glitch has one to fill.
// Purple is his: his glitch on the model, the copies' zap-in flash, the cracks on the things he breaks. Never a window.
// v5 (Nov 2, THE POTATO ARMY, D-20261102-31): he stays bare; the rings split off COPIES of him in the album's costumes (the
// squad: up to four live 3D copies behind him to the left, hopping where he hopped); GREEN DOORS on his street (a hop while
// passing = a copy dives in, the building flips), LIT HIGH WINDOWS from 142 (an on-beat spin's flight), RUNNERS (a person
// bursts out of a door and runs at him, a copy chasing: hop them early; bump = -200 + the rearmost copy leaves). The schedule
// is def.ll.{doors, runners, highWins, splits, ten, heat} in the level file; the look is the story file; Chat's art slots are
// run/levels/art-last-lights-on.mjs.

export const VH = 6.4, VW = VH * 16 / 9, LEFT = 0.24, CAMY = 1.9;   // theme.viewH, theme.camFix (the street sits low; the sky is the story)
// the glitch-flight (seconds; on: the rise / hover / fall in beats, so the top lands on the next beat)
export const FLY = { on: { top: 3.0, r: 1, h: 0.5, f: 1.5, beats: true, extra: 1 }, off: { top: 2.1, r: 0.3, h: 0.05, f: 0.45, extra: 0 }, BUF: 0.25,
  SINK: 7.5, DROP: 14 };   // (SINK: the fastest he ever floats down, so nothing snaps after he's floated over a thing; DROP: ↑ on the way down)
export function flyY(F, t) {   // his height through a flight (F: {t0, y0, top, r, h, f}); 0 when it's over
  const e = t - F.t0, top = Math.max(F.top, F.y0 + 0.3);
  if (e < F.r) { const k = e / F.r; return F.y0 + (top - F.y0) * (1 - (1 - k) * (1 - k)); }
  if (e < F.r + F.h) return top + 0.07 * Math.sin((e - F.r) / F.h * Math.PI);
  const k = Math.max(0, Math.min(1, (e - F.r - F.h) / F.f)); return top * (1 - k * k * (3 - 2 * k)); }
export const flyEnd = F => F.t0 + F.r + F.h + F.f;
export const PH_ = { V0: 8.6, G: 24, COOL: 0.17, LOCK: 0.35, KNOCK: 0.9, HW: 0.26 };   // (HW: his half-width for bumps; a 0.6 barrier gives ±0.15 s to hop)
export const HIT = [23.74, 37.30, 60.89, 86.26, 93.00, 101.46, 115.1, 121.75, 128.51, 158.94, 165.82, 196.10, 230.0, 243.44, 258.47];   // checked against loudness + kicks
export const BIG = [23.74, 60.89, 86.26, 165.82, 196.10];
export const CUTS = [[0, 4.5, 'opening'], [37.30, 39.9, 'zero'], [92.59, 96.5, 'recursion'], [114.72, 116.97, 'gate'], [128.51, 130.53, 'brain'], [225.43, 232.08, 'unlocked'], [243.44, 260.8, 'ending']];
export const NET = [116.97, 142.06], GLIDE = [106.16, 111.20], END = 243.44, UNLOCK = 225.43;
export const MAYBE = [195.87, 199.0, 202.56, 205.85];
const DT = 1 / 120;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export const cutAt = t => CUTS.find(([a, b]) => t >= a && t < b) || null;
// the costume names the cues use -> the outfit files (same map as main.mjs)
export const OUTFIT = { king: 'royal-king', disco: 'disco-legend', detective: 'noir-detective', construction: 'construction-crew', astronaut: 'orbital-astronaut',
  ghost: 'sheet-ghost', knight: 'castle-knight', diver: 'deep-sea-diver', cyborg: 'circuit-cyborg' };
// the looks baked into little copies (the album's ten up front for the ending's crowd, then this song's own). No sheet-ghost:
// it hides his face (D-31 review: every copy must read as Potato at a glance)
export const LOOKS = ['bare', 'circuit-cyborg', 'castle-knight', 'disco-legend', 'construction-crew', 'deep-sea-diver', 'orbital-astronaut',
  'noir-detective', 'royal-king', 'kitchen-chef', 'suit-tie', 'tin-robot', 'many-eyed', 'simulation'];   // (simulation: Binary Potato, the finish)
export const SH = { cam: null, C: null, T: null, v3: null, sprites: {}, ready: 0 };

// ---------- the skyline: blocks + windows, laid out once (story px: the screen is 960 x 540; the skyline creeps 16 px/s) ----------
export const SKV = 16, BASE = 300, WW = 24, WH = 30, WSX = 34, WSY = 40;
export const SK = t => SKV * (t - clamp(t - 114.72, 0, 142.06 - 114.72));   // how far the skyline has crept (story px; it holds still through the gate + the network, so nothing he could fill slides past unseen)
let SKY = null;
export function skyline() {
  if (SKY) return SKY;
  const blocks = [], wins = []; let x = -60, i = 0;
  while (x < 960 + SKV * 262 + 160) {
    const old = x > 640 && x < 2060 && i % 2 === 0, office = x > 1650 && x < 2700 && !old;
    const w = old ? 150 + rnd(i, 2) * 50 : 118 + rnd(i, 2) * 76, h = old ? 96 + rnd(i, 3) * 40 : 118 + rnd(i, 3) * 74;
    const cols = Math.max(2, Math.floor((w - 20) / WSX)), rows = Math.max(2, Math.floor((h - 18) / WSY));
    const B = { i, x, w, h, top: BASE - h, cols, rows, old, office, w0: wins.length, kind: old ? 'old' : office ? 'office' : 'tower' };
    const mx = (w - (cols * WSX - (WSX - WW))) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) wins.push({ k: wins.length, b: i, r, c, x: x + mx + c * WSX, y: B.top + 14 + r * WSY, old, office, h: rnd(wins.length, 7) });
    B.w1 = wins.length; blocks.push(B); x += w + 10 + rnd(i, 4) * 16; i++;
  }
  SKY = { blocks, wins, N: wins.length }; return SKY;
}
// window states
export const AMB = 0, DARK = 1, CYAN = 2, GREY = 3, HIS = 4;
const onScreen = (w, t, m = 24) => { const sx = w.x - SK(t); return sx > m && sx + WW < 960 - m; };

// ---------- the schedule, prepared once per course ----------
const PREP = new WeakMap();
export function prep(C) {
  if (PREP.has(C)) return PREP.get(C);
  const L = C.def.ll || {}, P = { L, rings: [], obs: [], drones: [] };
  const DX = 0;   // he walks at the camera's anchor
  P.obs = (L.obs || []).map(([t, kind, h, w], i) => ({ i, t, kind, h: h ?? 0.6, w: w ?? 0.7, x: C.X(t) + DX }));
  P.drones = (L.drones || []).map(([t, y], i) => ({ i, t, y: y ?? 1.75, v: 3.2 }));
  // the rings (Space): costume breaks, wall breaks, practice, the gate, the ending's two. Each: {t, kind, cue, wall, good:[a,b], perf}
  P.rings = (L.rings || []).map((r, i) => ({ i, good: [-0.25, 0.25], perf: 0.10, ...r })).sort((a, b) => a.t - b.t);
  P.rings.forEach((r, i) => { r.i = i; r.show = r.t - 3 * C.P; r.judge = r.queue ? Math.max(r.t + r.good[0] - 0.05, i ? P.rings[i - 1].t + 0.06 : -9) : r.t + r.good[0] - 0.05; });   // (a press before this is a small glitch and the ring waits: a first-timer pressing on the third tick doesn't lose it)
  P.bars = (L.netBars || []);
  // v5: the doors on his street, the runners, the lit high windows (all level data; see the level file)
  P.doors = (L.doors || []).map(([t, demo], i) => ({ i, t, x: C.X(t), demo: !!demo }));
  P.runners = (L.runners || []).map((tm, i) => runnerOf(C, tm, i));
  P.hw = (L.highWins || []).map((h, i) => ({ i, t: h.t, spin: h.spin, x: C.X(h.t), y: RUN.HWY }));
  return (PREP.set(C, P), P);
}
// a runner: a person bursts out of a shop door ahead (tBurst, a beat before they leave it: the door slams open + a yelp), runs
// left at him (vr), meets him at tm, and escapes behind him (phone box / revolving door / lamp post). The door sits where they'd
// still be on screen at the burst (8 u ahead at most), so the warning is a beat + however long they're in view.
export const RUN = { v: 2.5, JOG: 0.6, HW: 0.24, H: 0.92, HWY: 2.85, ESC: ['phone', 'revolve', 'lamp'] };
// (D-31 review fix 14: the FIRST runner is a jogger, RUN.JOG: it closes nearly at a bin's speed, so the first one teaches the
//  chase before a fast one can cost you -200)
function runnerOf(C, tm, i) { const v = C.speedAt(tm), vr = i === 0 ? RUN.JOG : RUN.v, lead = Math.min(i === 0 ? 1.6 : 0.75, (8.0 - v * C.P) / (vr + v)), xm = C.X(tm);
  return { i, tm, vr, xm, lead, doorX: xm + vr * lead, tLeave: tm - lead, tBurst: tm - lead - C.P, esc: RUN.ESC[i % 3], escX: xm - 0.5 }; }
export const runnerX = (r, t) => t < r.tLeave ? r.doorX : r.xm - r.vr * (t - r.tm);
// for tools/fair.mjs (def.fair.things): everything he can bump into, the moving ones with when they first show on screen
// (a runner: the door bursting a beat before they run, or when the door comes into view; a drone: its light at the edge)
export function fairThings(C, see) { const P = prep(C), out = [], step = 1 / 120;
  for (const o of P.obs) out.push({ x0: o.x, t: o.t, what: o.kind });
  for (const r of P.runners) { let ts = r.tBurst; while (r.doorX - C.X(ts) > see && ts < r.tm) ts += step; out.push({ x0: r.xm, t: r.tm, seenAt: ts, what: 'runner' }); }
  for (const d of P.drones) { let ts = d.t - 4; while (droneAt(C, d, ts).x - C.X(ts) > see && ts < d.t) ts += step; out.push({ x0: C.X(d.t), t: d.t, seenAt: Math.max(ts, d.t - 1.8), what: 'drone' }); }
  return out; }
export function droneAt(C, d, t) { return { x: C.X(d.t) + (d.t - t) * d.v, y: d.y + 0.08 * Math.sin((t - d.t) * 9) }; }

// ---------- what he's wearing at t (the same rule main.mjs dresses him by: a cue's costume from `on` to its break) ----------
export function costumeAt(C, t) {
  const Q = C.def.cues || []; let k = -1; for (let i = 0; i < Q.length; i++) if (Q[i].on <= t) k = i;
  if (k < 0) return C.def.startCostume || 'bare';
  const c = Q[k]; return t > c.t + 0.05 ? 'bare' : (OUTFIT[c.costume] || c.costume);
}
export const lookIndex = o => Math.max(0, LOOKS.indexOf(o));
// what his COPIES wear at t (v5: he stays bare; the copies wear the newest split's look; many-eyed while he wears it)
export function chainLook(C, t) { const c = costumeAt(C, t); if (c !== 'bare') return c; const sp = C.def.ll && C.def.ll.splits; if (!sp) return c;
  let l = 'bare'; for (const [a, look] of sp) if (a <= t) l = look; return l; }

// ---------- the windows: state, events ----------
function initWindows(s) {
  const { wins, N } = skyline();
  s.win = new Uint8Array(N); s.cnt = new Uint8Array(N); s.winL = new Uint8Array(N); s.winT = new Float32Array(N).fill(-99); s.seen = 0; s.his = 0;
  for (const w of wins) s.win[w.k] = w.old ? AMB : (rnd(w.k, 11) < 0.68 ? AMB : DARK);
}
function setWin(s, k, st, t, look) {
  const was = s.win[k]; if (was === st) return; if (was === HIS) s.his--; if (st === HIS) { s.his++; s.winL[k] = look || 0; } s.win[k] = st; s.winT[k] = t;
}
// the song changes the city, the same every run (the times are the plan's, section 4)
function scripted(C, s, t0, t1) {
  const { wins } = skyline(), P = C.P, cross = a => a > t0 && a <= t1;
  const CD = [23.80, 25.50, 27.19, 28.88, 30.58, 32.27, 33.97, 35.66];
  CD.forEach((a, k) => { if (cross(a)) for (const w of wins) { const sx = w.x - SK(a); if (!w.old && s.win[w.k] === AMB && sx > 960 - (k + 1) * 125 && sx <= 960 - k * 125 + (k ? 0 : 400)) setWin(s, w.k, DARK, a); } });
  if (cross(37.30)) for (const w of wins) if (!w.old && s.win[w.k] === AMB) setWin(s, w.k, DARK, 37.30);              // zero: only the old quarter keeps its people
  if (cross(39.0)) for (const w of wins) if (s.win[w.k] === DARK && (!w.old || w.x - SK(39) > 960)) setWin(s, w.k, CYAN, 39.0);   // the machines wake
  if (cross(65.89)) for (const w of wins) if (w.old && s.win[w.k] === AMB) setWin(s, w.k, DARK, 65.89);                 // "gone": the people's last lights
  if (cross(104.2)) for (const w of wins) if (w.office && s.win[w.k] === CYAN && w.h < 0.7) setWin(s, w.k, DARK, 104.2);  // office floors go dark
  MAYBE.forEach((a, q) => { if (cross(a)) for (const w of wins) if (s.win[w.k] === HIS && Math.floor(w.h * 4) === q) setWin(s, w.k, GREY, a); });   // doubt: a quarter of his, each
  if (cross(211.25 + 0.31)) { const good = s.prep === true;                                                             // "preparation": a good hit brings the greys back
    for (const w of wins) if (s.win[w.k] === GREY) good ? setWin(s, w.k, HIS, 211.56, s.winL[w.k]) : setWin(s, w.k, DARK, 211.56); }
  // the city % is out of every window that's been on screen (amber ones too: the people's light dies and the city frees up as the song goes)
  const sk = SK(t1); for (const w of wins) { const sx = w.x - sk; if (sx > 1300) break; if (sx > 960) continue; if (!s.cnt[w.k] && sx > -WW) { s.cnt[w.k] = 1; s.seen++; } }
}
// a copy goes into the best free window on screen: dark first, then grey, then cyan; never amber, never his
// THE BIG GLITCH'S BLOCK: for each big hit, one whole (not old-quarter) block that'll sit fully on screen on the hit is kept
// out of his hops from the start (it's the block the big glitch fills: otherwise his hops have eaten every free window by then)
let RESV = null;
export function bigBlocks() {
  if (RESV) return RESV; const { blocks } = skyline(); RESV = BIG.map(h => { const sk = SK(h); let best = null, bs = -1e9;
    for (const B of blocks) { const sx = B.x - sk; if (B.old || sx < 30 || sx + B.w > 930) continue; const sc = B.cols * B.rows * 10 - Math.abs(sx + B.w / 2 - 560) * 0.3; if (sc > bs) { bs = sc; best = B; } }
    return { h, b: best ? best.i : -1 }; }); return RESV;
}
const reservedAt = (b, t) => bigBlocks().some(r => r.b === b && t < r.h + 0.2);
const isHis = (s, B, r, c) => r >= 0 && c >= 0 && r < B.rows && c < B.cols && s.win[B.w0 + r * B.cols + c] === HIS;
function freeWin(s, t, avoid, high) {
  const { wins, blocks } = skyline(), sk = SK(t); let best = -1, bs = 1e9;
  for (let k = 0; k < wins.length; k++) { const w = wins[k], sx = w.x - sk; if (sx > 1200) break; if (sx < 24 || sx > 936 - WW) continue;
    const st = s.win[k]; if (st === AMB || st === HIS || (avoid && avoid.has(k)) || reservedAt(w.b, t)) continue;
    const B = blocks[w.b], nb = isHis(s, B, w.r, w.c - 1) + isHis(s, B, w.r, w.c + 1) + isHis(s, B, w.r - 1, w.c) + isHis(s, B, w.r + 1, w.c);   // (he spreads: next to his own first)
    const pr = st === DARK ? 0 : st === GREY ? 1 : 2, sc = pr * 1e4 - nb * 260 + Math.abs(sx - 520) * 0.9 + (high ? (w.y - 90) * 3 : Math.abs(w.y - 150) * 0.5) + w.h * 30;   // (high: the flight's copies go up top)
    if (sc < bs) { bs = sc; best = k; } }
  return best;
}
function throwCopies(C, s, t, n, why) {
  const look = lookIndex(chainLook(C, t)), got = [];
  if (t >= NET[0] && t < NET[1]) { const pts = n * 10 * s.mult * (onBeat(C, t) ? 2 : 1); if (onBeat(C, t)) beatAct(s); s.score += pts; s.netCopies = (s.netCopies || 0) + n; s.netUp = t; s.pop.push({ t, pts, n }); return n; }   // in the network the copies ride the threads up into the mind
  const high = why === 'spin' || why === 'fly';
  for (let i = 0; i < n; i++) { const k = freeWin(s, t, null, high); if (k < 0) break; setWin(s, k, HIS, t, look); got.push(k);
    s.fl.push({ t: t + i * 0.05, k, look, x: s.x, y: s.y + 0.7, why }); }
  if (s.fl.length > 80) s.fl.splice(0, s.fl.length - 80);
  const onB = onBeat(C, t), pts = got.length * 10 * s.mult * (onB ? 2 : 1); s.score += pts; s.copies += got.length;
  if (onB) beatAct(s);
  if (got.length) s.pop.push({ t, pts, n: got.length, onB }); if (s.pop.length > 12) s.pop.shift();
  return got.length;
}
function bestBlocks(s, t, two) {   // the most free windows on screen at t (one block, or the best neighbouring pair)
  const { blocks, wins } = skyline(), sk = SK(t), free = B => { let n = 0; for (let k = B.w0; k < B.w1; k++) { const sx = wins[k].x - sk; if (sx >= 24 && sx <= 936 - WW && s.win[k] !== AMB && s.win[k] !== HIS) n++; } return n; };
  let best = null, bn = 0; for (const B of blocks) { const sx = B.x - sk; if (sx + B.w < 0) continue; if (sx > 960) break; const n = free(B) + (two && blocks[B.i + 1] ? free(blocks[B.i + 1]) * 0.9 : 0); if (n > bn) { bn = n; best = B; } }
  return best;
}
function fillBlock(C, s, t, spin, B0) {   // the big glitch: a whole block fills with him (the one held back for it since the fizz began), on screen only
  const { blocks, wins } = skyline(), sk = SK(t), best = B0 || bestBlocks(s, t, false), look = lookIndex(chainLook(C, t)); let n = 0;
  const fill = B => { for (let k = B.w0; k < B.w1; k++) { const sx = wins[k].x - sk; if (sx < 24 || sx > 936 - WW) continue;
    if (s.win[k] !== AMB && s.win[k] !== HIS) { setWin(s, k, HIS, t + 0.02 * n, look); s.fl.push({ t: t + 0.02 * n, k, look, x: s.x, y: s.y + 0.7, why: 'big' }); n++; } } };
  if (best) fill(best);
  if (spin && best) { const nb = blocks[best.i + 1]; if (nb) fill(nb); }
  s.copies += n; return n;
}
const onBeat = (C, t) => { const b = C.beatOf(t); return Math.abs(b - Math.round(b)) * C.P <= 0.08; };
// (D-31 review fix 1: the hero is always the one you find) his own glitch on the model is capped at ~3 frames a press (it used
// to hold him purple for up to half a second: a smear among sharp copies); the storm round him is drawn at his edges (story)
export const ZAP = 0.05;
function zap(s, d) { s.phase = Math.max(s.phase, Math.min(d, ZAP)); }
function beatAct(s) { s.streak++; s.mult = s.streak >= 32 ? 4 : s.streak >= 16 ? 3 : s.streak >= 8 ? 2 : 1; s.bestMult = Math.max(s.bestMult, s.mult); }
function breakCombo(s) { s.streak = 0; s.mult = 1; }

// ---------- the squad (v5): copies of him that split off on the rings and walk behind him ----------
// newest first: s.squad[0] stands nearest him, the last one is the rearmost (it leaves first). Max 4 live.
export const SQUAD_MAX = 4;
function peel(s, t, m) { if (!m) return; s.peel.push({ t, look: m.look }); if (s.peel.length > 8) s.peel.shift(); }
function split(C, s, t, look, ok) {
  if (!ok) { s.dizzy.push({ t, look }); if (s.dizzy.length > 6) s.dizzy.shift(); return; }   // a missed ring: it still splits, dizzy, and wanders off
  const join = look === 'disco-legend' && t < 38 ? DEMO_JOIN : t;   // (the first one demonstrates the first dive before it falls in behind him)
  s.squad = [{ look, at: t, join }, ...s.squad.filter(m => m.look !== look)]; s.splits++;
  while (s.squad.length > SQUAD_MAX) peel(s, t, s.squad.pop());
}
// ---------- the doors, the high windows (v5): a copy dives in; the building flips to his side-eye ----------
function catchDoor(C, s, d, t) {
  const pts = Math.round((100 + 25 * s.squad.length) * s.mult); s.score += pts; s.doors++; beatAct(s);
  s.doorQ[d.i] = { t, look: chainLook(C, t), tl: diveLand(C, t) }; s.doorAt = t; s.pop.push({ t, pts, door: 1 }); if (s.pop.length > 12) s.pop.shift();
}
// a door's dive (D-31 review fix 2): the copy springs off on the catch and lands, full size, in the building AHEAD of him (the
// walk-up DOOR_AHEAD units past the green door: on screen, right, where the eye is) on the next beat; its floors flip from there
export const DOOR_AHEAD = 5.5;
export const diveLand = (C, t) => C.OFF + Math.ceil(C.beatOf(t) + 0.45) * C.P;
function catchHigh(C, s, h, t) {
  const pts = 300 * s.mult; s.score += pts; s.hws++; beatAct(s);
  s.hwQ[h.i] = { t, look: chainLook(C, t) }; s.doorAt = t; s.pop.push({ t, pts, door: 1 }); if (s.pop.length > 12) s.pop.shift();
}
// ---------- the rules ----------
function bump(C, s, t, why) {
  if (t < s.inv) return;
  s.inv = t + 0.9; s.knock = t; s.bumpAt = t; s.bumpWhy = why; s.bumps++; breakCombo(s); s.score = Math.max(0, s.score - 200); s.pop.push({ t, pts: -200, bump: 1 });   // (a bump costs: the copies he'd have thrown + the combo + three windows)
  s.react = { name: 'angry', dur: 0.9, at: t }; s.phase = 0;   // (fix 5: a solid angry face, no glitch: the bump reads)
  // three of his windows on screen go dark (you can win them back)
  const { wins } = skyline(); let n = 0; for (let k = wins.length - 1; k >= 0 && n < 3; k--) if (s.win[k] === HIS && onScreen(wins[k], t)) { setWin(s, k, DARK, t); n++; }
  if (s.squad && s.squad.length) peel(s, t, s.squad.pop());   // (v5: the rearmost copy runs off into the city)
}
function judge(C, s, P, r, t, pressed) {
  const d = t - r.t; let q = 0;
  if (pressed) { if (Math.abs(d) <= r.perf) q = 2; else if (d >= r.good[0] && d <= r.good[1]) q = 1; }
  if (r.free) q = Math.max(q, 1);                           // the ending's two presses can't fail
  s.ring[r.i] = { t, q, pressed: !!pressed };
  const pts = r.practice ? (q ? 100 : 0) : q === 2 ? 300 : q === 1 ? 150 : 0; s.score += pts; if (pts) s.pop.push({ t, pts, ring: q });
  if (q) { s.rings++; if (q === 2) s.perfects++; beatAct(s); } else if (!r.practice && !r.free) breakCombo(s);
  if (r.cue != null && q) s.cues = { ...(s.cues || {}), [r.cue]: { t, q: q === 2 ? 1 : 0.6 } };   // main breaks the costume on it
  if (r.prep) s.prep = q > 0;
  if (r.split) split(C, s, t, r.split, q > 0);
  if (r.ten) s.tenQ = { ...s.tenQ, [r.ten]: { t, q } };
  s.ringAt = t; s.ringQ = q; s.ringI = r.i; zap(s, q ? 0.32 : 0.12);
  if (q) s.react = { name: r.face || (q === 2 ? 'laugh' : 'smirk'), dur: 0.7, at: t };
  if (r.wall != null) s.smashed[r.wall] = { t, q };
  s.light += q === 2 ? 1 : q ? 0.6 : 0.2;                  // the light in the sky grows with every break
}
function seedPast(C, s, from) {   // a start in the middle of the song (practice): the city a good run has by then
  const P = prep(C), { wins } = skyline();
  scripted(C, s, -1, from);
  for (const w of wins) { const sx = w.x - SK(from); if (sx < 960 && !s.cnt[w.k]) { s.cnt[w.k] = 1; s.seen++; } if (sx < 960 && s.win[w.k] !== AMB && rnd(w.k, 31) < 0.72) setWin(s, w.k, HIS, from - 9, lookIndex(chainLook(C, Math.max(0, from - 20 + 20 * rnd(w.k, 3))))); }
  for (const r of P.rings) if (r.t + 0.31 < from) { s.ring[r.i] = { t: r.t, q: 1 }; if (r.cue != null) s.cues = { ...(s.cues || {}), [r.cue]: { t: r.t, q: 0.6 } }; if (r.wall != null) s.smashed[r.wall] = { t: r.t, q: 1 }; s.light += 0.6; }
  for (const c of C.def.cues || []) if (c.auto && c.t < from) s.cues = { ...(s.cues || {}), [C.def.cues.indexOf(c)]: { t: c.t, q: 1 } };
  for (const r of P.rings) if (r.split && r.t + 0.31 < from) split(C, s, r.t, r.split, true);
  if (from > 61.2) split(C, s, 60.89, 'deep-sea-diver', true);
  s.squad.sort((a, b) => b.at - a.at); while (s.squad.length > SQUAD_MAX) s.squad.pop(); s.peel = []; s.splits = 0;
  for (const d of P.doors) if (d.t < from - 1) s.doorQ[d.i] = { t: d.t, look: chainLook(C, d.t), seeded: 1 };
  s.evT = from;
}
export const mode = {
  init(s, api) {
    const C = api.C, t = s.t;
    Object.assign(s, { dxp: 0, vy: 0, ground: true, walking: true, ducking: false, facing: 0.42, inv: -9, knock: -9, bumps: 0, score: 0, mult: 1, streak: 0, bestMult: 1,
      fly: null, flyK: null, jBuf: null, flyN: 0, glY0: null, copies: 0, rings: 0, perfects: 0, bigs: 0, light: 0, ring: {}, smashed: {}, fl: [], pop: [], spun: false, spinAt: -9, lock: -9, gAt: -9, cues: {}, net: 0, evT: -1, cityAt: null,
      squad: [], peel: [], dizzy: [], hops: [], splits: 0, doorQ: {}, runQ: {}, hwQ: {}, doors: 0, runs: 0, hws: 0, tenQ: {}, doorAt: null });
    initWindows(s); if (t > 0.5) seedPast(C, s, t); else scripted(C, s, -1, t);
    place(C, s, t);
  },
  step(s, inp, t, api) {
    const C = api.C, P = prep(C), cut = cutAt(t), ctl = !cut || cut[2] === 'opening' && t > 4.4;
    scripted(C, s, s.evT, t); s.evT = t;
    // ---- auto cues (no ring): he glitches straight from one costume into the next ----
    (C.def.cues || []).forEach((c, i) => { if (c.auto && t >= c.t && !(s.cues && s.cues[i])) s.cues = { ...(s.cues || {}), [i]: { t, q: 1 } }; });
    // ---- "two models build ten" (96.25): the copies zap into windows: a good hit on "whole" fills the biggest building ----
    if (s.evRec == null && t >= 96.25) { const r = P.rings.find(q => Math.abs(q.t - 92.59) < 0.01), good = r && s.ring[r.i] && s.ring[r.i].q;
      s.evRec = good ? fillBlock(C, s, 96.25, false) : throwCopies(C, s, 96.25, 4, 'rec'); s.react = { name: 'smirk', dur: 1.0, at: t }; }
    // ---- the glide (106.16 → 111.20): a low arc over the shop roofs, wrapped in purple, can't be hit ----
    const gl = t >= GLIDE[0] && t < GLIDE[1];
    // ---- ↑ jump ----
    const hop = () => { s.vy = PH_.V0; s.ground = false; s.spun = false; s.jumpT = t; s.jBuf = null; s.hops.push(t); if (s.hops.length > 8) s.hops.shift();
      throwCopies(C, s, t, 1, 'jump'); zap(s, 0.06); };
    if (inp.J && s.ground && ctl && !gl) hop();
    else if (inp.J && s.fly && ctl) { s.jBuf = t; if (t - s.fly.t0 > s.fly.r + s.fly.h) s.fly.drop = true; }   // (↑ while he floats down: a quick drop, then a hop; just before the top it's buffered for the landing)
    // ---- ←/→ in the air: the spin (one per jump; a purple storm) ----
    if ((inp.L || inp.R) && (!s.ground || gl) && ctl && (!s.spun || gl && t - s.spinAt > 0.42)) {
      s.spun = true; s.spinAt = t; s.spinDir = inp.L ? -1 : 1; const ob = onBeat(C, t);
      const nFl = s.fl.length, got = throwCopies(C, s, t, ob ? 3 : 1, 'spin'); zap(s, ob ? 0.3 : 0.18);
      if (!gl) {   // the glitch-flight: up along the buildings, the copies streaming out of him into the high windows as he rises
        const Q = ob ? FLY.on : FLY.off, k = Q.beats ? C.P : 1;
        s.fly = { t0: t, y0: s.y, top: Q.top, r: Q.r * k, h: Q.h * k, f: Q.f * k, on: ob, dir: s.spinDir, extra: Q.extra, thrown: false }; s.flyK = 0; s.ground = false; s.vy = 0; s.jBuf = null;
        s.inv = Math.max(s.inv, t + s.fly.r + s.fly.h + 0.05); s.flyN = (s.flyN || 0) + 1;
        for (let i = nFl; i < s.fl.length; i++) { const f = s.fl[i], d = (i - nFl) * 0.12; f.t = t + d; f.x = C.X(t + d) + s.dxp; f.y = flyY(s.fly, t + d) + 0.7; } } }
    // ---- physics: flat street, gravity, the glide's arc ----
    if (gl && s.fly) { s.fly = null; s.flyK = null; }
    if (gl) { const k = (t - GLIDE[0]) / (GLIDE[1] - GLIDE[0]); if (s.glY0 == null) s.glY0 = s.y;   // (he joins the arc from wherever he was: a jump or a flight carries on into it, no drop)
      s.y = Math.max(2.35 * Math.sin(Math.PI * clamp(k)) ** 0.7, s.glY0 * Math.max(0, 1 - (t - GLIDE[0]) / 0.6)); s.ground = k >= 0.999; s.vy = 0; s.inv = Math.max(s.inv, t + 0.3); if (!s.glided) { s.glided = true; s.react = { name: 'laugh', dur: 1.2, at: t }; } }
    else if (s.fly) { const F = s.fly, e = t - F.t0, down = e > F.r + F.h; let y = flyY(F, t);
      if (!F.thrown && e >= F.r) { F.thrown = true; if (F.extra) throwCopies(C, s, t, F.extra, 'fly'); }   // the top of an on-beat flight (on the next beat): one more, up high
      if (F.drop) y = Math.max(0, s.y - FLY.DROP * DT);
      if (e > F.r) for (const o of P.obs) { if (Math.abs(o.t - t) > 0.5) continue; const dx = o.x - s.x;   // coming down he floats over what's in his way
        if (s.y > o.h + 0.02 && dx > -(o.w / 2 + PH_.HW) && dx < o.w / 2 + PH_.HW + 2.2) y = Math.max(y, Math.min(s.y, o.h + 0.08)); }   // (looks ~0.45 s ahead: he stops sinking above it)
      if (e > F.r) for (const r of P.runners) { if (t < r.tLeave - 0.3 || t > r.tm + 0.5 || s.runQ[r.i]) continue; const dx = runnerX(r, t) - s.x;   // (a runner closes faster: he looks further ahead for them)
        if (s.y > RUN.H + 0.02 && dx > -(RUN.HW + PH_.HW) && dx < RUN.HW + PH_.HW + 3.4) y = Math.max(y, Math.min(s.y, RUN.H + 0.08)); }
      if (down) y = Math.max(y, s.y - (F.drop ? FLY.DROP : FLY.SINK) * DT);   // (never faster than a float: once he's past the thing he sinks the rest of the way, no snap)
      s.vy = (y - s.y) / DT; s.y = y; s.flyK = e < F.r ? 0.35 * e / F.r : e < F.r + F.h ? 0.35 + 0.2 * (e - F.r) / F.h : Math.min(1, 0.55 + 0.45 * (e - F.r - F.h) / F.f);
      if (e < F.r && rnd(Math.floor(t * 20), 5) < 0.08) zap(s, 0.03);   // he crackles purple on the way up (the storm round him carries the rest; coming down he's readable)
      if (y <= 1e-4 && down) { s.vyIn = -6; s.y = 0; s.vy = 0; s.ground = true; s.landAt = t; s.fly = null; s.flyK = null;
        if ((F.drop || s.jBuf != null && t - s.jBuf <= FLY.BUF) && ctl) hop(); } }
    else if (!s.ground) { s.vy -= PH_.G * DT; s.y += s.vy * DT; if (s.y <= 0) { s.vyIn = s.vy; s.y = 0; s.vy = 0; s.ground = true; s.landAt = t; } }
    // ---- knockback: he stumbles back and catches up ----
    const kb = t - s.knock; s.dxp = kb >= 0 && kb < 1.2 ? -PH_.KNOCK * Math.sin(Math.min(1, kb / 0.15) * Math.PI / 2) * (1 - ease((kb - 0.15) / 1.05)) : 0;
    // ---- the ending: he walks to the middle of the screen and stops; the crowd splits out of him ----
    if (t >= END) s.dxp = VW * (0.5 - LEFT) * ease((t - END) / 1.2) + (1 - ease((t - END) / 1.2)) * s.dxp;
    else if (t >= 232.08 && t < 238.1) s.dxp = 1.6 * ease((t - 232.08) / 2.5);   // the victory lap: to the edge of the road, stop, side-eye
    else if (t >= 238.1 && t < END) s.dxp = 1.6;
    place(C, s, t);
    // ---- what he bumps into ----
    if (!cut && !gl) {
      for (const o of P.obs) { if (Math.abs(o.t - t) > 0.4 || s.hitObs === o.i) continue;
        if (Math.abs(s.x - o.x) < o.w / 2 + PH_.HW && s.y < o.h - 0.04) { s.hitObs = o.i; bump(C, s, t, o.kind); } }
      for (const d of P.drones) { if (t < d.t - 0.6 || t > d.t + 0.6) continue; const p = droneAt(C, d, t);
        if (Math.abs(p.x - s.x) < 0.5 && p.y > s.y - 0.1 && p.y < s.y + 1.3) bump(C, s, t, 'drone'); }
      // v5: a green door, caught in a HOP (not a flight) while he passes it, high in the hop
      for (const d of P.doors) { if (d.demo || s.doorQ[d.i] || Math.abs(d.t - t) > 0.6) continue;
        if (!s.ground && !s.fly && s.y > 0.5 && Math.abs(s.x - d.x) < 0.45) catchDoor(C, s, d, t); }
      // v5: a lit high window, reached only by a flight's top (an on-beat spin)
      for (const h of P.hw) { if (s.hwQ[h.i] || Math.abs(h.t - t) > 0.9) continue;
        if (s.fly && Math.abs(s.x - h.x) < 0.7 && Math.abs(s.y - h.y) < 0.45) catchHigh(C, s, h, t); }
      // v5: runners: over them = they run on past (+50); on the ground in their way = a bump (they spin once and keep running)
      for (const r of P.runners) { if (t < r.tLeave - 0.05 || t > r.tm + 0.8 || s.runQ[r.i]) continue; const rx = runnerX(r, t);
        if (Math.abs(rx - s.x) < RUN.HW + PH_.HW && s.y < RUN.H) { if (t >= s.inv) { s.runQ[r.i] = { t, bump: 1 }; bump(C, s, t, 'runner'); } else s.runQ[r.i] = { t, safe: 1 }; }
        else if (rx < s.x - 0.6) { const pts = 50 * s.mult; s.runQ[r.i] = { t, ok: 1 }; s.score += pts; s.runs++; beatAct(s); s.pop.push({ t, pts }); if (s.pop.length > 12) s.pop.shift(); } }
    }
    // ---- SPACE: the ring, the network bars, or a small glitch ----
    // (the lock: a press that isn't on a ring or a bar line is a small glitch and Space is dead for 0.35 s; pressing again while
    //  it's dead keeps it dead. Mashing never lands a ring: Chikin: "I can see if you are beating it by cheesing")
    if (inp.G) {
      if (t < s.lock) s.lock = t + PH_.LOCK;
      else {
        const r = P.rings.find(q => !s.ring[q.i] && t >= q.judge && t <= q.t + q.good[1] + 0.02);
        const bar = t >= NET[0] - 0.2 && t < NET[1] ? P.bars.find(b => Math.abs(t - b) <= 0.15 && !(s.barHit && s.barHit[b])) : null;
        if (r) judge(C, s, P, r, t, true);
        else if (bar != null) { s.barHit = { ...(s.barHit || {}), [bar]: t }; s.score += 50 * s.mult; s.net++; beatAct(s); s.fire = t; s.pop.push({ t, pts: 50 * s.mult, net: 1 }); }
        else { s.lock = t + PH_.LOCK; s.gAt = t; zap(s, 0.1); }
      }
    }
    for (const r of P.rings) if (!s.ring[r.i] && t > r.t + r.good[1] + 0.02) judge(C, s, P, r, t, false);   // no press: a miss (it still happens, smaller)
    // ---- the big glitch: fizz for two bars, in the air on the hit = a block of him ----
    s.fizz = 0;
    for (const h of BIG) { const a = h === 23.74 ? 22.5 : h - 8 * C.P; if (t >= a && t < h) s.fizz = Math.max(s.fizz, ease((t - a) / (h - a)));
      const w1 = h === 165.82 ? 166.15 : h + 0.15;
      if (t >= w1 && !(s.big && s.big[h])) { const air = s.bigAir && s.bigAir[h], spin = air && s.spinAt >= h - 0.4 && s.spinAt <= w1, rv = bigBlocks().find(q => q.h === h), rb = rv && rv.b >= 0 ? skyline().blocks[rv.b] : null;
        let n = 0; if (air) n = fillBlock(C, s, h, spin, rb);
        else for (let i = 0; i < 3; i++) { const k = freeWin(s, h); if (k < 0) break; setWin(s, k, HIS, h, lookIndex(chainLook(C, h))); s.fl.push({ t: h + i * 0.05, k, look: lookIndex(chainLook(C, h)), x: s.x, y: s.y + 0.7, why: 'big' }); n++; s.copies++; }
        const pts = air ? (spin ? 750 : 500) : 100; s.score += pts; s.pop.push({ t, pts, big: 1 }); if (air) { s.bigs++; s.react = { name: 'laugh', dur: 1.0, at: t }; }
        if (Math.abs(h - 60.89) < 0.01 && C.def.ll && C.def.ll.splits) split(C, s, h, 'deep-sea-diver', !!air);   // (v5: "Singularity rising": in the air on it, the diver joins the squad)
        s.big = { ...(s.big || {}), [h]: { t: h, air, spin, n } }; s.bigAt = h; zap(s, air ? 0.5 : 0.2); }
      if (t >= (h === 165.82 ? 165.80 : h - 0.15) && t < w1 && !s.ground) s.bigAir = { ...(s.bigAir || {}), [h]: true }; }
    // ---- the city %: his share of every window that's been on screen (snapshot on "unlocked") ----
    s.city = s.seen ? s.his / s.seen : 0; if (t >= UNLOCK && s.cityAt == null) s.cityAt = s.city;
    if (t >= 259.6 && s.final == null) s.final = finalScore(C, s);
    // ---- the camera: shakes on the hits and breaks, pulls back for the long looks ----
    let sh = 0, z = 1; const L = P.L;
    for (const h of HIT) { const e = t - h; if (e >= 0 && e < 0.8) sh = Math.max(sh, 0.12 * Math.exp(-e * 5)); }
    if (s.ringAt != null && t - s.ringAt < 0.6 && s.ringQ) sh = Math.max(sh, 0.2 * (1 - (t - s.ringAt) / 0.6));
    if (s.bumpAt != null && t - s.bumpAt < 0.4) sh = Math.max(sh, 0.16 * (1 - (t - s.bumpAt) / 0.4));
    if (s.bigAt != null && t - s.bigAt < 0.9 && s.big[s.bigAt].air) sh = Math.max(sh, 0.3 * (1 - (t - s.bigAt) / 0.9));
    for (const [a, b, k] of L.pull || []) if (t >= a && t < b) z *= 1 - k * Math.min(ease((t - a) / 0.8), ease((b - t) / 0.6));
    for (const [a, k] of L.quake || []) { const e = t - a; if (e >= 0 && e < 1.2) sh = Math.max(sh, k * Math.exp(-e * 3)); }
    s.camShake = sh; s.camZoom = z;
    s.phase = Math.max(0, s.phase - DT); if (s.fizz > 0.25 && rnd(Math.floor(t * 30), 3) < s.fizz * 0.06) zap(s, 0.03);
    s.walking = s.ground && !(t >= 238.1 && t < END + 0.2) && t >= 1.6 && !(t >= 111.57 && t < 112.7);
    s.gone = t < 1.62 || (t >= 92.59 && t < 93.0) || t >= 258.47;   // (from 259.0 Binary Potato stands in the code: story's codeFlood draws him)
    s.facing = t >= 236 && t < 238.8 ? 0.95 : t >= 111.57 && t < 112.7 ? 0.9 : 0.42;   // (side-eye at the camera: the victory lap, "won't kneel")
  },
};
function place(C, s, t) { s.x = C.X(t) + s.dxp; s.dx = s.dxp; s.ducking = false; }
// The grade is three things, not just the score (so mashing can't buy it): how much of the score a perfect run gets (45%),
// the breaks: rings landed, perfects count half again (35%), and staying on your feet (20%, gone at 8 bumps). Bands: S .88 (and at most one bump) · A .74 · B .5 · C.
export function finalScore(C, s) {
  const city = s.cityAt ?? s.city, clean = !s.bumps, base = s.score, total = Math.round(base * (clean ? 1.1 : 1)), perfect = (C.def.ll && C.def.ll.perfect) || 1;
  const NR = prep(C).rings.length || 1, share = Math.min(1, total / perfect), ringQ = Math.min(1, (s.rings + 0.5 * s.perfects) / (NR * 1.5)), feet = Math.max(0, 1 - s.bumps / 8);
  const G = 0.45 * share + 0.35 * ringQ + 0.20 * feet, grade = G >= 0.88 && s.bumps <= 1 ? 'S' : G >= 0.74 ? 'A' : G >= 0.5 ? 'B' : 'C';
  return { city, clean, total, grade, share, G, rings: s.rings, perfects: s.perfects, bigs: s.bigs, copies: s.copies, bestMult: s.bestMult, bumps: s.bumps, doors: s.doors || 0, highs: s.hws || 0, runs: s.runs || 0, squad: (s.squad || []).length };
}

// ---------- browser only: the real model baked into little copies ----------
// Chikin: "the one model builds two, two models build ten, that needs to be actual potato models … preset animations".
// One small offscreen copy of the 3D model is dressed in each look and played through four short moves (a waddle, a spin,
// a hop, a glance); every frame goes into a strip. Every copy in the level (windows, the network, the ending) is one of these.
export const CELL = { w: 120, h: 150, feet: 137, body: 95 };
export const ANIMS = { waddle: [0, 8], spin: [8, 8], hop: [16, 8], glance: [24, 6] };
const NF = 30;
async function bake(base) {
  if (typeof document === 'undefined') return;
  const abs = new URL(base, document.baseURI).href;
  let createSpud, loadOutfit;
  try { ({ createSpud } = await import(abs + 'spud3d.mjs')); ({ loadOutfit } = await import(abs + 'outfits3d.mjs')); } catch (e) { return; }
  const box = document.createElement('div'); box.style.cssText = `position:fixed;left:-4000px;top:0;width:${CELL.w}px;height:${CELL.h}px;pointer-events:none;`;
  document.body.appendChild(box);
  let api; try { api = await createSpud(box, { base: abs, still: true }); } catch (e) { box.remove(); return; }
  const cam = api.camera, S = api.state; cam.left = -0.68; cam.right = 0.68; cam.top = 1.05; cam.bottom = -0.65; cam.updateProjectionMatrix();
  api.renderer.setPixelRatio(1); api.renderer.setSize(CELL.w, CELL.h);
  const yieldF = () => new Promise(r => setTimeout(r, 4)), idle = () => new Promise(r => typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 400 }) : setTimeout(r, 30));
  // what's needed next: the look he's wearing now, then the song's next looks in order (the ending-only ones last)
  const order = () => { const C = SH.C, t = SH.t || 0, out = [];
    if (C) { out.push(chainLook(C, t)); for (const [a, l] of (C.def.ll && C.def.ll.splits) || []) if (a > t - 20) out.push(l); for (const c of C.def.cues || []) if (c.t > t) out.push(OUTFIT[c.costume] || c.costume); out.push('bare'); }
    for (const l of LOOKS) out.push(l); return out.filter((l, i) => LOOKS.includes(l) && out.indexOf(l) === i && !SH.sprites[l] && !failed.has(l)); }, failed = new Set();
  for (let look; (look = order()[0]);) {
    await idle();
    try { api.wear(look === 'bare' ? null : await loadOutfit(look)); } catch (e) { failed.add(look); continue; }
    const cv = document.createElement('canvas'); cv.width = CELL.w * NF; cv.height = CELL.h; const g = cv.getContext('2d');
    let time = 0, f = 0; const grab = async () => { g.drawImage(api.renderer.domElement, f * CELL.w, 0, CELL.w, CELL.h); f++; await yieldF(); };
    const settle = () => { S.airborne = false; S.y = 0; S.vy = 0; api.waddle(false); api.snap(0.35); S.squash.x = 1; S.squash.v = 0; S.wob.x = 0; S.wob.v = 0; S.leanX.x = 0; S.leanX.v = 0; api.step(time += 1 / 30, 1 / 30); };
    settle(); api.waddle(true); for (let i = 0; i < 3; i++) api.step(time += 1 / 30, 1 / 30);
    for (let i = 0; i < 8; i++) { api.step(time += 0.112, 0.112); await grab(); }
    settle(); for (let i = 0; i < 8; i++) { api.snap(0.35 + (i + 1) / 8 * Math.PI * 2); S.leanX.x = -0.06 * Math.sin(i / 8 * Math.PI); api.step(time += 0.004, 0.004); await grab(); }
    settle(); S.squash.kick(4); S.airborne = true; S.vy = 3.0; for (let i = 0; i < 8; i++) { api.step(time += 0.076, 0.076); await grab(); }
    settle(); for (const y of [-0.95, -0.95, -0.4, 0.4, 0.95, 0.95]) { api.snap(y); api.step(time += 0.004, 0.004); await grab(); }
    SH.sprites[look] = cv; SH.ready++;
    await yieldF();
  }
  try { api.renderer.dispose(); api.renderer.forceContextLoss(); } catch (e) {} box.remove();
}
// one baked frame of him: (x, y) = his feet in screen px, h = his body height in px; a look not baked yet falls back to bare,
// then to a plain lumpy silhouette (never a sticker)
export function drawSpud(ctx, look, anim, k, x, y, h, a = 1, flip = false) {
  const cv = SH.sprites[look] || SH.sprites.bare; if (a <= 0.01 || h < 2) return false;
  if (!cv) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#d9963f'; ctx.strokeStyle = '#120a05'; ctx.lineWidth = Math.max(1, h * 0.06); ctx.beginPath(); ctx.ellipse(x, y - h * 0.5, h * 0.42, h * 0.5, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore(); return true; }
  const [f0, n] = ANIMS[anim] || ANIMS.waddle, fr = f0 + (((Math.floor(k) % n) + n) % n), sc = h / CELL.body, w = CELL.w * sc, hh = CELL.h * sc;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  ctx.drawImage(cv, fr * CELL.w, 0, CELL.w, CELL.h, -w / 2, -CELL.feet * sc, w, hh); ctx.restore(); return true;
}
// many-eyed's eyes, driven by the song (the outfit reads globalThis.POTATO_EYES in performance seconds)
// The hook (many-eyed.mjs reads it): { open: how many eyes are awake (a count: Chat's ten first), snap: every eye on the camera,
// blink: all at once, stamp: when it was written (the skin ignores a stale one: a level quit mid-section can't leave him half-shut) }.
// All in song time, so a video render with its own clock gets the same eyes.
function eyes(t) {
  if (typeof globalThis === 'undefined') return;
  if (t < 148.5 || t > 159.2) { globalThis.POTATO_EYES = null; return; }
  const open = t < 149.89 ? 10 : t < 152.17 ? 16 : t < 153.77 ? 24 : 999;
  const snap = [[149.89, 0.9], [152.17, 0.5], [153.77, 0.6], [157.52, 1.45]].some(([a, d]) => t >= a && t < a + d);
  globalThis.POTATO_EYES = { open, snap, blink: t >= 155.0 && t < 155.16, stamp: typeof performance !== 'undefined' ? performance.now() : 0 };
}

// ---------- browser only (v5): THE LIVE COPIES — the real 3D model, dressed, standing in the level's scene ----------
// (army.mjs staging, made the game's own) One model per look, made in idle time from the level's start, in the order the
// song needs them; at most 4 on screen (the squad) except the ten (185.0 → 189.2). No arms on a copy (in costume: no arms),
// purple only as his own glitch (spud3d's tint). Positions are in world units from the hero's feet: behind him (z < 0), to his
// left, never in the lane ahead (except the cleared lane at 60.9 and 185).
export const LIVE = { pool: {}, ready: 0, want: 0, group: null, pos: {}, lastT: null, making: false };
export const COPY_LOOKS = ['disco-legend', 'orbital-astronaut', 'castle-knight', 'deep-sea-diver', 'construction-crew', 'noir-detective', 'suit-tie', 'circuit-cyborg', 'tin-robot', 'royal-king', 'kitchen-chef', 'many-eyed'];
// the copy chasing a runner wears a look the squad ISN'T wearing (D-31 review fix 10: no two of one look on screen): not one of
// the last four splits before that runner (a good run's squad), picked by the runner's number
export function chaseLook(C, r) { const sp = (C.def.ll && C.def.ll.splits) || [], last = sp.filter(([a]) => a <= r.tm).slice(-4).map(x => x[1]), pool = COPY_LOOKS.filter(l => !last.includes(l) && l !== 'many-eyed');
  return pool[(r.i * 5) % pool.length] || 'disco-legend'; }
async function makeLive(T, base) {
  if (typeof document === 'undefined' || LIVE.making) return; LIVE.making = true; const abs = new URL(base, document.baseURI).href;
  let createSpud, loadOutfit; try { ({ createSpud } = await import(abs + 'spud3d.mjs')); ({ loadOutfit } = await import(abs + 'outfits3d.mjs')); } catch (e) { LIVE.making = false; return; }
  LIVE.want = COPY_LOOKS.length;
  for (const look of COPY_LOOKS) { if (LIVE.pool[look]) continue;
    await new Promise(r => typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 400 }) : setTimeout(r, 30));
    try { const holder = new T.Group(), box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-999px;top:0;width:10px;height:10px;pointer-events:none';
      const api = await createSpud(box, { scene: holder, base: abs }); api.wear(await loadOutfit(look)); holder.visible = false; LIVE.group.add(holder);
      LIVE.pool[look] = { api, holder }; LIVE.ready++; } catch (e) { console.warn('last lights: live copy', look, e); } }
  LIVE.making = false;
}
const AIRT = 2 * PH_.V0 / PH_.G, hopY = e => e > 0 && e < AIRT ? PH_.V0 * e - PH_.G / 2 * e * e : 0;
// the squad's four places [dx, dy, scale, z] (two a step behind him, two further back and up), then the ten's other six (ahead,
// in the cleared lane: three in front, three behind them)
// (D-31 review fix 1 + 3: little potatoes, ≤0.6 of him, so the bare one in front is always the one you find; packed so the 4th
//  isn't cut off at the left edge (there are only ~2.7 u behind him on screen), and about a body width clear of him)
const SLOTS = [[-1.25, 0, 0.6, -0.5], [-1.95, 0, 0.6, -0.55], [-1.6, 0.2, 0.48, -1.0], [-2.25, 0.2, 0.48, -1.05],
  [1.45, 0, 0.55, -0.6], [2.45, 0, 0.55, -0.6], [3.45, 0, 0.55, -0.6], [1.95, 0.2, 0.45, -1.1], [2.95, 0.2, 0.45, -1.1], [3.95, 0.2, 0.45, -1.1]];
export const DEMO_JOIN = 42.75;   // (the disco copy, back out of the demo building, falls in behind him)
// the big moments (60.89's leap, the ten): the copies step back and shrink a touch more, so he's the biggest Potato on screen
const BIGM = [[60.45, 62.9], [184.9, 189.2]];
// a door's dive: is a squad copy the one diving (the newest: it IS the copy that leaps), and how far the rest drop back (0..1)
function diveNow(s, t) { const q = s.doorAt != null ? Object.values(s.doorQ).find(d => d.t === s.doorAt && !d.seeded) : null; if (!q || t < q.t) return null;
  const end = q.tl + 0.45; if (t > end + 0.35) return null; return { q, back: t < end ? clamp((t - q.t) / 0.15) : 1 - clamp((t - end) / 0.35), hide: t < end + 0.2 }; }
export function cast(C, s, t) {
  const out = []; if (!s || !s.squad || s.gone || t < 37.30 || (t >= 92.59 && t < 96.5) || (t >= 114.72 && t < 142.06) || t >= END) return out;
  const P = prep(C), v = C.speedAt(t), D = P.doors.find(d => d.demo), gl = t >= GLIDE[0] && t < GLIDE[1];
  // SET PIECE A (37.30 → DEMO_JOIN): the disco copy tears off his right side, looks at him, runs ahead, hops the green door the
  // way you will (40.31) and that leap carries it into the building ahead (the dive is drawn on top, story armyFront); it comes
  // back out of that building's door and waits there, side-eyeing, and falls in behind him once he's passed (if the ring landed)
  const demo = demoDive(C);
  if (t < DEMO_JOIN && D && demo) { const c = { look: 'disco-legend', dx: 1.35, dy: 0, sc: 0.6, z: -0.35, yaw: -0.8, y: 0, walk: false, g: 0 };
    if (t < 37.75) { const k = ease((t - 37.30) / 0.45); c.dx = 0.3 + 1.05 * k; c.y = 0.45 * Math.sin(k * Math.PI); c.sc = 0.45 + 0.15 * k; c.g = 0.75 * (1 - k); c.yaw = 0.6 - 1.4 * k; }
    else if (t < 39.9) { c.yaw = -0.8 + 2.0 * ease((t - 39.45) / 0.4); if (t > 38.6 && t < 38.9) c.y = hopY((t - 38.6) * 1.6) * 0.25; }   // (a little bounce: "it looks at him, he side-eyes back")
    else if (t < demo.hop) { const k = (t - 39.9) / (demo.hop - 39.9), x0 = C.X(39.9) + 1.35, xa = x0 + (D.x - 0.6 - x0) * ease(k); c.dx = xa - s.x; c.walk = true; c.yaw = 1.2; }
    else if (t < demo.out) c.hide = true;   // (in the air over the door and into the building: story's armyFront draws it on top)
    else { c.dx = demo.door - s.x; c.yaw = 0.42; c.g = t < demo.out + 0.3 ? 0.6 * (1 - (t - demo.out) / 0.3) : 0; }   // out of the door, waiting
    if (!c.hide) out.push(c); }
  // the squad (joined copies, newest nearest him); at 185 → 189 the ten (the squad + six more in the cleared lane)
  const sq = s.squad.filter(m => m.join <= t), ten = t >= 185.01 && t < 189.2 && C.def.ll && C.def.ll.ten, dv = diveNow(s, t);
  const mem = sq.map(m => ({ look: m.look, at: m.join, k: 0 }));
  if (ten) { const used = new Set(mem.map(m => m.look)), ex = COPY_LOOKS.filter(l => !used.has(l) && l !== 'deep-sea-diver' && l !== 'disco-legend' && l !== 'many-eyed').concat(['deep-sea-diver', 'disco-legend'].filter(l => !used.has(l)));
    const n = 10 - mem.length, first = n - 3; for (let i = 0; i < n; i++) mem.push({ look: ex[i], at: i < first ? 185.01 : 185.96, extra: 1 }); }
  const wide = t >= 60.45 && t < 62.9, bigm = BIGM.some(([a, b]) => t >= a && t < b);   // SET PIECE C: the lane is clear 60.6 → 63.5, so for the leap the squad spreads round him (two in front)
  mem.forEach((m, k) => { const [tx, ty, tsc0, tz] = (wide ? [SLOTS[0], SLOTS[4], SLOTS[2], SLOTS[7]][k] : SLOTS[k]) || SLOTS[3], tsc = tsc0 * (bigm ? 0.86 : 1), c = { look: m.look, dx: tx, dy: ty, sc: tsc, z: tz - (bigm ? 0.5 : 0), yaw: 0.45 + 0.08 * ((k % 3) - 1), y: 0, walk: true, g: 0 };
    const age = t - m.at;
    if (m.extra) { if (age < 0) return; if (age < 0.35) { const q = ease(age / 0.35); c.y = 2.6 * (1 - q); c.g = 0.8 * (1 - q); c.walk = false; }   // (they drop in from the cyan tower behind him)
      if (t > 188.6) { const q = clamp((t - 188.6) / 0.5); c.g = q; c.sc *= 1 - 0.5 * q; c.z -= q; if (q >= 1) return; } }
    else if (age < 0.6 && !(m.look === 'disco-legend' && m.at === DEMO_JOIN)) { c.g = 0.7 * (1 - age / 0.6); }   // (a fresh split still crackles)
    // a door's dive: the newest copy IS the one that leaps (hidden here: armyFront draws it on top); the rest step back and shrink
    if (dv && !m.extra) { if (k === 0 && dv.q.look === m.look && dv.hide) return; c.dx -= 0.4 * dv.back; c.sc *= 1 - 0.15 * dv.back; c.z -= 0.6 * dv.back; if (k === 0 && dv.q.look === m.look) c.g = 0.5; }
    // they hop where he hopped (each a moment later: when the same spot reaches it), the squad's canon
    let hy = 0; const delay = Math.max(0, -tx) / v; for (const h of s.hops) hy = Math.max(hy, hopY(t - h - delay)); c.y = Math.max(c.y, hy * (0.82 + 0.18 * tsc));
    if (t >= 60.6 && t < 61.7) c.y = Math.max(c.y, hopY(t - (60.89 - AIRT / 2) - 0.03 * k) * 0.95);   // SET PIECE C: the squad leaps with him on "Singularity rising"
    if (ten && t >= 187.2 && t < 188.6) { const q = s.tenQ && s.tenQ[3] && s.tenQ[3].q, off = q ? 0.02 * k : (rnd(k, 61) - 0.5) * 0.3; c.y = Math.max(c.y, hopY(t - (187.63 - AIRT / 2) - off) * 1.05); }   // THE TEN: all leap with him (ragged on a miss)
    if (gl) { c.y = Math.max(0, s.y * 0.82 - 0.15 * k) + 0.06 * Math.sin(t * 6 + k); c.walk = false; c.g = 0.12; }   // the glide: the squad flies with him in a wedge
    if (c.y > 0.02) c.walk = false;
    out.push(c); });
  return out;
}
// the demo dive's times (37.30's disco copy shows the move): it hops the green door (D.x) on the beat before he reaches it, the
// leap lands in the building ahead on the next beat, it comes back out of that building's door two beats later
export function demoDive(C) { const D = prep(C).doors.find(d => d.demo); if (!D) return null; const hop = C.OFF + Math.floor(C.beatOf(D.t) - 1.2) * C.P;
  return { hop, land: hop + C.P, out: hop + 3 * C.P, door: D.x + DOOR_AHEAD + 0.42, win: D.x + DOOR_AHEAD - 0.45, from: D.x - 0.6 }; }
function placeLive(C, s, t) {
  if (!LIVE.group) return; for (const k in LIVE.pool) LIVE.pool[k].holder.visible = false;
  const dt = LIVE.lastT == null ? 1 / 60 : t - LIVE.lastT, jump = LIVE.lastT == null || Math.abs(dt) > 0.3; LIVE.lastT = t; LIVE.shown = 0;
  for (const c of cast(C, s, t)) { const L = LIVE.pool[c.look]; if (!L || L.holder.visible) continue;
    let p = LIVE.pos[c.look]; const tgt = { dx: c.dx, dy: c.dy, sc: c.sc, z: c.z };
    if (!p || jump || p.t == null || t - p.t > 0.3) p = LIVE.pos[c.look] = { ...tgt, t };
    else { const k = 1 - Math.exp(-Math.max(0, dt) * 7); for (const q of ['dx', 'dy', 'sc', 'z']) p[q] += (tgt[q] - p[q]) * k; p.t = t; }
    const A = L.api, S = A.state; L.holder.visible = true; LIVE.shown++;
    L.holder.position.set(s.x - Math.min(0, s.dx || 0) + p.dx, p.dy, p.z); A.spud.scale.setScalar(1.18 * p.sc);   // (the squad holds its place in the street, not his stumble)
    S.airborne = false; S.y = c.y || 0; A.waddle(!!c.walk); A.snap(c.yaw); A.glitch(c.g || 0); A.step(t, Math.max(1 / 60, Math.min(0.05, Math.abs(dt) || 1 / 60))); }
}
// a new split / a runner / a door: start a copy's place where it really comes from (so the smoothing slides it from there)
export function seedPos(look, dx, dy, sc, z, t) { LIVE.pos[look] = { dx, dy, sc, z, t }; }
let SFXm = null, heard = {};
export const modeView = ({ C, cam, T, base, world }) => {
  SH.cam = cam; SH.C = C; SH.T = T; SH.v3 = new T.Vector3(); heard = { ring: null, big: null, bump: null, net: null, g: null, spin: null };   // (fresh each time the level opens: a retry hears its booms again)
  if (typeof globalThis !== 'undefined') globalThis.POTATO_EYES = null;
  if (!SH.baking) { SH.baking = true; bake(base || '../play/'); }
  if (world && T) { if (!LIVE.group) { LIVE.group = new T.Group(); LIVE.group.name = 'last-lights-copies'; } if (LIVE.group.parent !== world) world.add(LIVE.group); LIVE.lastT = null; makeLive(T, base || '../play/'); }
  if (typeof window !== 'undefined') window.__llLive = LIVE;
  if (!SFXm && typeof document !== 'undefined') import(new URL((base || '../play/') + 'sfx.mjs', document.baseURI).href).then(m => { SFXm = m.SFX; }).catch(() => {});
  return {
    draw(f) { const { s, t } = f; eyes(t); SH.t = t; placeLive(C, s, t); armySounds(C, s, t, f.videoMode); if (s.t != null && s.t < (SH.lastT ?? 0) - 0.5) heard = { ring: null, big: null, bump: null, net: null, g: null, spin: null }; SH.lastT = s.t; if (!SFXm || f.videoMode) return; const X = SFXm, play = (k, fn) => { if (heard[k] !== s[k + 'At'] && s[k + 'At'] != null && t - s[k + 'At'] < 0.2) { heard[k] = s[k + 'At']; try { fn(); } catch (e) {} } };
      play('ring', () => s.ringQ ? (X.hit(), s.ringQ === 2 && X.ding && X.ding()) : X.flub && X.flub());
      play('big', () => { X.boom && X.boom(); X.glitch(false); });
      play('bump', () => X.thud ? X.thud() : X.hit());
      play('spin', () => X.whoosh ? X.whoosh() : X.glitch(false));
      play('g', () => X.glitch(false));
      if (s.fire != null && heard.net !== s.fire && t - s.fire < 0.2) { heard.net = s.fire; try { X.bong ? X.bong() : X.beat(); } catch (e) {} } },
    over(ctx, f) { if (SH.over) SH.over(ctx, f); },
  };
};
// the army's sounds: a door ding when one's taken, the runner's door bursting + a yelp a beat before they run (the warning)
let armyT = null;
function armySounds(C, s, t, video) {
  const prev = armyT; armyT = t; if (!SFXm || video || prev == null || t < prev || t - prev > 0.3) return; const X = SFXm, P = prep(C), cross = a => prev < a && t >= a;
  try { if (s.doorAt != null && cross(s.doorAt + 0.001)) (X.ding || X.hit)();
    for (const r of P.runners) if (cross(r.tBurst)) { X.creak && X.creak(); X.squeak && X.squeak(); }
    for (const p of s.peel || []) if (cross(p.t + 0.001)) X.poof && X.poof(); } catch (e) {}
}
// world -> story px through the real camera (the story and the overlay are both 960 x 540 over the whole view)
export function project(x, y) { const v = SH.v3; v.set(x, y, 0).project(SH.cam); return { x: (v.x * 0.5 + 0.5) * 960, y: (0.5 - v.y * 0.5) * 540 }; }

// modes/turn-me-off.mjs — Level 9, the toy room at bedtime (Chikin, Nov 1: "redo this story to something else" → the toy room;
// "no kid, the toy idea is cool"; "there can be a door, it can be like toy story, potatos glitch can make him look like hes
// not moving" (our own take on toys-freeze-when-watched: no film's characters or look); "its reverse no answer"; "instead of
// getting deleted, he cant get seen"; "and he can infect devices"; "he has to stand next to toys without being seen and
// infect them"; "nothing gets deleted, it can be more of an open level"). The plan: game/stories/turn-me-off.md.
//
// THE RULES (pure, deterministic, 120 Hz — the bot and the replay run this same file):
//   · ONE room he roams freely (arrows; the stick on a phone). The song is the clock: bedtime → night → morning.
//   · LIGHT SEES, DARK HIDES. Only hard-edged beams with a source can see him: the DOOR (three fixed shapes: crack, half,
//     full), the CAMERA's cone on the dresser, the TORCH circle through the door crack. Every beam draws its shape dim on the
//     rug first (3 beats; 4 in the teach), then lands lit for its hold. Soft light (lamp, moon, glows, morning) never sees.
//     Under the bed, behind the toy chest and behind the standing book (from "the BOOK") are dark. The camera's own cone
//     can't reach right under it (CAM_BLIND), but the door's light can.
//   · SPACE = HIS GLITCH = FREEZE: a purple flicker, then he's a plain tin toy, stock-still (the 'toy' face, the key stopped
//     dead) for as long as Space is held (a tap still holds a moment; a tap with no hold — a phone's two-finger tap — latches it
//     till he walks or taps again). Caught in a lit beam NOT frozen, past a 0.25 s grace =
//     SEEN: the key winds down, he tips over stiff, the section restarts (score + infects as they were). Nothing deleted.
//     The first catch by each kind of light (and every door catch in the teach until he's frozen once) is only a bump: he
//     tips and pops back up, the combo breaks.
//   · INFECT: stand still by a toy or a gadget's cable (frozen counts, at half speed) for 1 beat (toys) or 2 (gadgets); it lands
//     on the next beat line: purple runs in, its
//     light goes out, it turns to look at him. Ten in the room; the goal is the room by morning. A toy he didn't reach by its
//     section's end is put away for the night (into the drawer), a gadget switches itself off — all back out in the morning.
//     The camera, infected, is static: its cone is gone for good.
//   · THE CUE (the album's one move): a purple ring closes on him in three ticks, Space on the 4th beat — the lamp (CUT), the
//     night-light (CUT), the door (BEAT), the torch (BEAT), the dare (CUT, the one that can see him). PERFECT ±0.10 s, GOOD
//     −0.20/+0.30 s, the first press after the third tick is the one judged (so mashing lands early). At the door + torch BEATs,
//     already frozen since before the third tick (the safe play) counts GOOD on the hit.
//   · A retry: 3 beats when no light can see him (he never respawns into a lit beam). The camera's cone shows dim 3 beats before
//     every live window and swings continuously (turnarounds on the drop 34.43); each word-jerk's wedge shows dim ahead.
//   · ARMS: none walking, standing or frozen; out on his morning hops (Space with the stabs) and in the outro's dance (room.dance).
//   · SCORE: infect 500 (camera 1000) × combo, +250 under their nose (a beam on him as it lands) · a beam landing on him
//     frozen: 200 if the freeze started within 0.15 s of it (on the beat), else 50 · cues 500/250 (the dare 3000/1500) ·
//     morning: 100 per toy he wakes, 50 per toy that hops with him on a stab · end: room infected/10 × 3000; CLEAN (no
//     retry, no bump) +10%. Combo ×1–×4 at 4/8/16 on-beat actions (freezes on the beat, infects, cues); a catch or a missed
//     cue breaks it.
// Everything WHEN and WHERE is in the level file (def.room); this file is the rules, and the in-front look's plumbing.
// The room itself (and the in-front painter: rings, letterbox, asides, score, card) is story-turn-me-off.mjs.

// ---------- the stage: a low stage-set view of the room, the camera holding still ----------
export const VH = 7.2, VW = VH * 16 / 9, LEFT = 0.24;
export const SCR = { x0: -VW * LEFT, x1: VW * (1 - LEFT), y0: -0.6, y1: 6.6 };   // (theme camFix 3.0, viewH 7.2: world units on screen)
export const SKIRT = 2.75;                                                          // the skirting board: the rug's back edge (a visible edge)
export const RUG = { x0: -2.45, x1: 9.05, y0: 0.05, y1: 2.5 };                    // where his feet can go (up = toward the back wall)
export const SOLID = [[-3.3, -1.0, -1.3, 0.42], [7.45, -1.0, 9.9, 0.55]];          // the bed's foot and the toy chest (he walks round them)
export const DARK = { bed: [-2.45, 0.42, -1.05, 1.2], chest: [7.2, 0.55, 9.05, 1.32], book: [1.7, 1.72, 3.5, 2.7] };   // (book: its shadow reaches back to the skirting, wider than the book, so it shows round it)
export const BOOK = { x: 2.6, y: 1.55 };
export const CAMPOS = { x: 8.45, y: 2.75 };                                        // the camera's foot on the rug (its cone's apex)
export const G = { SPEED: 4.6, REACH: 0.9, GRACE: 0.25, TAP: 0.3, TORCH_R: 0.78, CAM_LEN: 9.5, CAM_HALF: 0.2, CAM_BLIND: 1.45,
  CAM_A: Math.PI * 1.03, CAM_B: Math.PI * 1.62, SEEN: 0.95, BUMP: 1.15, ONBEAT: 0.15, FRZ_RATE: 0.5 };   // (FRZ_RATE: frozen, an infect runs at half speed — freezing is safe, not free)
// the door's three shapes (always the same, so players learn them): feet-space polygons on the rug, out of the door
export const SHAPE = {
  crack: [[-1.55, SKIRT], [-1.3, SKIRT], [4.6, -0.1], [3.6, -0.1]],
  half: [[-2.05, SKIRT], [-1.12, SKIRT], [5.7, -0.1], [0.35, -0.1]],
  full: [[-2.6, SKIRT], [9.3, SKIRT], [9.3, -0.1], [-1.45, -0.1]],
};
export const DOOR = { x0: -2.75, x1: -1.0 };                                       // the doorway on the back wall (its foot on the skirting)
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const DT = 1 / 120;
export const TMO = { over: null };   // the story file plugs its in-front painter in here (rings, letterbox, asides, score, card)

// ---------- geometry ----------
export function inPoly(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j];
  if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const inR = (R, x, y) => x > R[0] && x < R[2] && y > R[1] && y < R[3];
export function inDark(Pp, t, x, y) { return inR(DARK.bed, x, y) || inR(DARK.chest, x, y) || (t >= Pp.R.book + 0.35 && inR(DARK.book, x, y)); }
const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
export function inCone(th, x, y) { const dx = x - CAMPOS.x, dy = y - CAMPOS.y, d = Math.hypot(dx, dy);
  return d > G.CAM_BLIND && d < G.CAM_LEN && Math.abs(angD(Math.atan2(dy, dx), th)) < G.CAM_HALF + 0.12 / Math.max(1, d); }

// ---------- the schedule (from def.room), built once per course ----------
let PREP = null;
export function prep(C) {
  if (PREP && PREP.C === C) return PREP;
  const R = C.def.room, P = C.P;
  const looks = R.looks.map(([t, shape, o = {}], i) => ({ i, key: 'd' + i, kind: 'door', t, shape, warn: (o.warn ?? 3) * P, hold: (o.hold ?? 2) * P, demo: !!o.demo,
    free: !!o.free, cue: o.cue ?? null, pause: o.pause ?? null, slam: o.slam ?? null, poly: SHAPE[shape] }));
  const torches = R.torch.map(([t, at, o = {}], i) => ({ i, key: 'f' + i, kind: 'torch', t, at, warn: (o.warn ?? 3) * P, hold: 0.3, cue: o.cue ?? null }));
  const cues = R.hits.map(([t, k], i) => ({ i, t, k, tick: t - P, show: t - 3 * P - 0.3, end: t + 0.3, cut: k === 'lamp' || k === 'nightlight' || k === 'dare' }));
  const tg = R.targets.map((q, i) => ({ i, ...q, need: q.need || 1, pts: q.pts || 500 }));
  const cuts = (C.def.cutscenes || []).filter(c => c[2] !== 'dance');
  if (C.def.blank) { looks.length = 0; torches.length = 0; cuts.length = 0; }   // (?blank, run/blank.mjs: no door / torch beams, no cutscenes; the camera never wakes — camState)
  const secs = C.def.sections.map(q => q[1]);
  PREP = { C, P, R, looks, torches, cues, tg, cuts, secs, cam: R.camera, CAMI: tg.findIndex(q => q.k === 'camera'), dare: cues.find(c => c.k === 'dare') };
  return PREP;
}
export const cutAt = (Pp, t) => Pp.cuts.find(([a, b]) => t >= a && t < b) || null;
export const lethalAt = (Pp, t) => t >= Pp.R.firstT && t < Pp.R.morning && !cutAt(Pp, t);

// the camera: 'dim' (waking, its first sweep on the far side), 'live', 'doze' (red dot, no cone), or null (off / his)
export function camState(Pp, s, t) {
  const K = Pp.cam; if (t < K.wake || t >= K.off || Pp.C.def.blank) return null;
  if (s && s.inf && s.inf[Pp.CAMI] != null && t >= s.inf[Pp.CAMI]) return null;
  if (t < K.live0) return 'dim';
  if (K.live.some(([a, b]) => t >= a && t < b)) return 'live';
  return K.live.some(([a]) => t >= a - 3 * Pp.P && t < a) ? 'dim' : 'doze';   // waking: its cone shows dim for 3 beats before it can see
}
// the sweep (0 = CAM_A … 1 = CAM_B): a turnaround every 8 beats, one of them on the drop (K.turn, 34.43); its first sweep stays on
// the far side and widens over the 4 beats before it goes live (one continuous swing, never a jump)
function sweepU(Pp, t) {
  const K = Pp.cam, P = Pp.P, ph = (t - (K.turn - 8 * P)) / (8 * P), m = ((ph % 2) + 2) % 2, u = m < 1 ? m : 2 - m;
  const amp = t >= K.live0 ? 1 : 0.18 + 0.82 * ease((t - (K.live0 - 4 * P)) / (4 * P));
  return amp * ease(u);
}
function stepU(Pp, n) { const K = Pp.cam, u0 = sweepU(Pp, K.steps[0] - 0.1); return u0 + (1 - u0) * Math.min(n, K.steps.length) / K.steps.length; }
export function camAngle(Pp, t) {
  const K = Pp.cam, P = Pp.P, A = G.CAM_A, B = G.CAM_B;
  if (t >= K.steps[0] - 0.1 && t < K.steps[K.steps.length - 1] + 0.42) {   // "runs LOW · don't BEG · don't BLINK · just GO": one jerk per word, from where it is
    let n = 0; for (const st of K.steps) n += clamp((t - st) / 0.08); const a = stepU(Pp, Math.floor(n)), b = stepU(Pp, Math.ceil(n));
    return A + (B - A) * (a + (b - a) * (n - Math.floor(n))); }
  return A + (B - A) * sweepU(Pp, t);
}
// the next jerk's wedge, shown dim ahead of it (the words' steps are warned too)
export function camNext(Pp, t) {
  const K = Pp.cam, S = K.steps; if (t < S[0] - 3 * Pp.P || t >= S[S.length - 1]) return null;
  const n = S.filter(st => st <= t).length; return G.CAM_A + (G.CAM_B - G.CAM_A) * stepU(Pp, n + 1);
}

// every beam now: { kind, key, lit, dim, k (0..1 through its warning), poly | th | c:[x,y,r], lethal, cue, demo }
export function beamsAt(Pp, s, t) {
  const out = [], P = Pp.P;
  for (const L of Pp.looks) { const d0 = L.pause != null ? Math.min(L.pause, L.t - L.warn) : L.t - L.warn; if (t < d0 || t >= L.t + L.hold) continue;
    out.push({ kind: 'door', key: L.key, L, lit: t >= L.t, dim: t < L.t, k: clamp((t - d0) / Math.max(0.01, L.t - d0)), poly: L.poly, demo: L.demo, cue: L.cue, land: L.t, end: L.t + L.hold }); }
  const cs = camState(Pp, s, t); if (cs === 'live' || cs === 'dim') { out.push({ kind: 'cam', key: 'cam', lit: cs === 'live', dim: cs === 'dim', k: 1, th: camAngle(Pp, t) });
    const nx = cs === 'live' ? camNext(Pp, t) : null; if (nx != null) out.push({ kind: 'cam', key: 'camnext', lit: false, dim: true, next: true, k: 1, th: nx }); }
  for (const F of Pp.torches) { if (t < F.t - F.warn || t >= F.t + F.hold) continue; const a = s && s.aim && s.aim[F.i] ? s.aim[F.i] : torchHome(Pp, F, s);
    out.push({ kind: 'torch', key: F.key, F, lit: t >= F.t, dim: t < F.t, k: clamp((t - (F.t - F.warn)) / F.warn), c: [a.x, a.y, G.TORCH_R], locked: t >= F.t - P, cue: F.cue, land: F.t, end: F.t + F.hold, harmless: F.at !== 'him' }); }
  return out;
}
function torchHome(Pp, F, s) { if (F.at !== 'him') { const q = Pp.tg.find(q => q.k === F.at); return { x: q.x, y: q.y }; } return { x: s ? s.x : 3, y: s ? s.y : 1.2 }; }
export function inBeam(b, x, y) { return b.poly ? inPoly(b.poly, x, y) : b.th != null ? inCone(b.th, x, y) : Math.hypot(x - b.c[0], y - b.c[1]) < b.c[2]; }
// is (x, y) lit by something that can see him now? → the beam (lethal ones first), or null
export function litBy(Pp, s, t, x, y, onlyLethal = false) {
  if (inDark(Pp, t, x, y)) return null; let hit = null;
  for (const b of beamsAt(Pp, s, t)) { if (!b.lit || b.demo || b.harmless || !inBeam(b, x, y)) continue; const L = b.cue == null || b.cue === Pp.dare.i;
    if (L) return b; if (!onlyLethal) hit = hit || b; }
  return hit;
}

// ---------- the score ----------
export const multOf = n => n >= 16 ? 4 : n >= 8 ? 3 : n >= 4 ? 2 : 1;
function onBeatAct(s) { s.onb++; s.mult = multOf(s.onb); s.bestMult = Math.max(s.bestMult, s.mult); }
function breakCombo(s) { s.onb = 0; s.mult = 1; }
function pts(s, t, n, o = {}) { s.score += n; s.pop.push({ t, pts: n, ...o }); if (s.pop.length > 8) s.pop.shift(); }
export function finalScore(C, s) {
  const Pp = prep(C), n = s.inf ? s.inf.filter(v => v != null).length : 0, clean = !s.bumps && !RUN.retries, base = s.score + Math.round(n / Pp.tg.length * 3000);
  const total = Math.round(base * (clean ? 1.1 : 1)), perfect = Pp.R.perfect || total, share = total / perfect;
  const grade = share >= 0.9 && clean ? 'S' : share >= 0.75 ? 'A' : share >= 0.55 ? 'B' : 'C';
  return { n, of: Pp.tg.length, clean, total, base, share, grade, bestMult: s.bestMult, perfects: s.perfects || 0 };
}
// a run's bank: what the score + the room were at each section line (a retry rewinds to it); retries cost CLEAN
export const RUN = { bank: {}, retries: 0 };
const SNAP = ['score', 'onb', 'mult', 'bestMult', 'bumps', 'frozeOnce', 'perfects'];
function snap(s) { const o = {}; for (const k of SNAP) o[k] = s[k]; o.inf = s.inf.slice(); o.away = s.away.slice(); o.cue = { ...s.cue }; o.free = { ...s.free }; return o; }

// ---------- the mode ----------
export const mode = {
  init(s, api) {
    const C = api.C, Pp = prep(C), t = s.t;
    Object.assign(s, { x: Pp.R.start[0], y: Pp.R.start[1], dx: 0, side: 1, facing: 0.35, ground: true, vy: 0, vyIn: 3, walking: false, cutscene: false,
      frozen: false, frzAt: -9, tapUntil: -9, lgh: false, latch: false, air: false, hopY: 0, hopAt: -9, immune: 0, exposed: 0, seenAnim: null, tilt: 0, blink: 0, score: 0, onb: 0, mult: 1, bestMult: 1, bumps: 0,
      frozeOnce: false, perfects: 0, pop: [], inf: Pp.tg.map(() => null), away: Pp.tg.map(() => null), prog: Pp.tg.map(() => 0), cue: {}, free: {}, landed: {},
      aim: {}, woke: {}, hops: {}, lastSec: -1, keySpin: 0, keySpinAt: -9, rattleAt: -9, nose: null, close: null, final: null, nearT: null });
    s.dx = s.x;
    if (t <= 0.001) { RUN.bank = {}; RUN.retries = 0; }
    else { RUN.retries++;   // a retry (or a practice flag): the room + the score as they were at that line
      const k = Object.keys(RUN.bank).map(Number).filter(v => v <= t + 0.01).sort((a, b) => b - a)[0];
      if (k != null) Object.assign(s, JSON.parse(JSON.stringify(RUN.bank[k])));
      else Pp.tg.forEach((q, i) => { if (q.t1 <= t) s.inf[i] = q.t1 - 0.5; });    // (no bank: a flag mid-song assumes a good run so far)
      Pp.cues.forEach(c => { if (c.end < t && !s.cue[c.i]) s.cue[c.i] = { t: c.t, q: 1 }; });
      Pp.tg.forEach((q, i) => { if (s.inf[i] == null && q.t1 <= t) s.away[i] = q.t1; });
      if (t >= 14) s.frozeOnce = true;
      s.immune = t + 3 * Pp.P; }   // (respawn grace: a retry never lands him inside a lit beam that sees)
    for (let i = Pp.secs.length - 1; i >= 0; i--) if (Pp.secs[i] <= t + 0.01) { s.lastSec = i; break; }
  },
  step(s, inp, t, api) {
    const C = api.C, Pp = prep(C), P = Pp.P, R = Pp.R, b = C.beatOf(t);
    const react = (name, dur) => { s.react = { name, dur, at: t }; };
    s.cutscene = false; s.dx = s.x - C.X(t);
    // a section line: bank the run as it stands (a retry rewinds to it)
    for (let i = s.lastSec + 1; i < Pp.secs.length && Pp.secs[i] <= t; i++) { s.lastSec = i; RUN.bank[Pp.secs[i]] = snap(s); }
    const press = !!inp.G || (!!inp.Gh && !s.lgh); s.lgh = !!inp.Gh;
    if (s.blink > 0) s.blink = Math.max(0, s.blink - DT);
    const cut = cutAt(Pp, t), morning = t >= R.morning;
    // ---- the arrival (CS1): his glitch drops out of the fish tank's sub onto the rug ----
    if (t >= R.arrive && t - DT < R.arrive) { s.blink = 0.22; s.blinkFrom = { x: R.tank[0], y: R.tank[1] }; }
    // ---- seen: the key winds down, he tips over stiff (a bump pops back up) ----
    if (s.seenAnim) {
      const A = s.seenAnim, e = t - A.t0; s.walking = false; s.ground = false; s.frozen = false;
      const tip = ease(e / 0.45) * 1.38 * A.side;
      if (A.bump) { s.tilt = e < 0.7 ? tip : tip * (1 - ease((e - 0.7) / 0.35)); if (e >= G.BUMP) { s.seenAnim = null; s.tilt = 0; s.ground = true; s.exposed = 0; s.immune = t + 0.6; react('deadpan', 0.9); } return; }
      s.tilt = tip; if (e >= G.SEEN && !s.dead) { api.die('seen'); s.dead = true; s.why = 'seen'; } return;
    }
    // ---- the cues: the lamp, the night-light, the door, the torch, the dare ----
    if (!C.def.blank) for (const c of Pp.cues) { if (s.cue[c.i]) continue;   /* (?blank: no cues) */
      if (press && t >= c.tick && t <= c.end) { const d = t - c.t, q = Math.abs(d) <= 0.10 ? 2 : d >= -0.20 && d <= 0.30 ? 1 : 0; s.cue[c.i] = { t, q, d };
        if (q) { const big = c.k === 'dare'; pts(s, t, big ? (q === 2 ? 3000 : 1500) : (q === 2 ? 500 : 250) * s.mult, { cue: q }); onBeatAct(s); if (q === 2) s.perfects++; s.keySpin++; s.keySpinAt = t;
          react(c.k === 'dare' ? 'toy' : 'grin', c.k === 'dare' ? 1.0 : 0.6); }
        else breakCombo(s); }
      else if (!c.cut && t >= c.t && s.frozen && s.frzAt < c.tick) { s.cue[c.i] = { t, q: 1, d: 0, held: true }; pts(s, t, 250 * s.mult, { cue: 1 }); onBeatAct(s); s.keySpin++; s.keySpinAt = t; }   // (frozen since before the third tick: still a toy on the hit — GOOD)
      else if (t > c.end) { s.cue[c.i] = { t: c.end, q: 0, d: null }; breakCombo(s); } }
    // presses inside a CUT before the third tick only rattle his key
    if (press && cut && !Pp.cues.some(c => t >= c.tick && t <= c.end)) s.rattleAt = t;
    // ---- freeze ----
    if (press && !cut) s.tapUntil = t + G.TAP;
    if (cut || morning || inp.Uh || inp.Dh || inp.Lh || inp.Rh) s.latch = false;
    else if (press) s.latch = !inp.Gh ? !s.latch : false;
    const dareC = Pp.dare, dq = s.cue[dareC.i];
    let want = !cut && !morning ? (!!inp.Gh || t < s.tapUntil || s.latch) : false;
    if (cut && dq && dq.q > 0 && t >= dq.t && t < R.dareShut) want = true;   // the dare: the judged press holds him frozen till the door shuts
    if (want && !s.frozen) { s.frzAt = t; s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.fz = s.facing; }
    if (!want && s.frozen) { s.blink = 0.12; s.blinkFrom = { x: s.x, y: s.y }; }
    s.frozen = want;
    // ---- he walks ----
    let hx = 0, hy = 0; const x0 = s.x, y0 = s.y;
    if (t >= R.tally && R.bow && !C.def.blank) { const dx = R.bow[0] - s.x, dy = R.bow[1] - s.y, d = Math.hypot(dx, dy); if (d > 0.02) { const v = Math.min(d, G.SPEED * 0.55 * DT); s.x += dx / d * v; s.y += dy / d * v; if (Math.abs(dx) > 0.05) s.side = Math.sign(dx); } }   // CS7: he waddles to the front
    const canWalk = !cut && !s.frozen && (!R.lockAt || !(t >= R.lockAt[0] && t < R.lockAt[1]));
    if (canWalk) { hx = (inp.Rh ? 1 : 0) - (inp.Lh ? 1 : 0); hy = (inp.Uh ? 1 : 0) - (inp.Dh ? 1 : 0); const n = Math.hypot(hx, hy);
      if (n) { s.x += hx / n * G.SPEED * DT; s.y += hy / n * G.SPEED * DT; } }
    s.x = clamp(s.x, RUG.x0, RUG.x1); s.y = clamp(s.y, RUG.y0, RUG.y1);
    for (const Q of SOLID) if (s.x > Q[0] && s.x < Q[2] && s.y > Q[1] && s.y < Q[3]) {   // round the bed's foot and the chest: out the nearest side
      const o = [[s.x - Q[0], Q[0], null], [Q[2] - s.x, Q[2], null], [Q[3] - s.y, null, Q[3]]].filter(v => v[1] == null || (v[1] > RUG.x0 && v[1] < RUG.x1)).sort((a, c) => a[0] - c[0])[0];
      if (o[1] != null) s.x = o[1] + (o[1] === Q[0] ? -1e-3 : 1e-3); else s.y = o[2] + 1e-3; }
    const moving = Math.hypot(s.x - x0, s.y - y0) > 1e-5; s.walking = moving; s.ground = !s.frozen;
    if (moving && Math.abs(hx) > 0) s.side = Math.sign(hx);
    // ---- the torch: it aims for him (or a toy) through its warning, locks a beat before it lands ----
    for (const F of Pp.torches) { if (t < F.t - F.warn || t >= F.t + F.hold) continue; const home = torchHome(Pp, F, s), a = s.aim[F.i] || (s.aim[F.i] = { x: home.x, y: home.y });
      if (t < F.t - P) { const k = 1 - Math.exp(-DT * 7); a.x += (home.x - a.x) * k; a.y += (home.y - a.y) * k; } }
    // ---- the light: caught moving (not frozen) in a lit beam = seen (after a short grace) ----
    const lit = litBy(Pp, s, t, s.x, s.y), lethal = lethalAt(Pp, t) && !(s.immune && t < s.immune);
    s.lit = lit ? lit.kind : null;
    { const dk = inDark(Pp, t, s.x, s.y); if (dk && !s.hid && !s.frozen && !cut && t >= R.firstT && t < R.morning) react('sneaky', 0.8); s.hid = dk; }   // (into a hiding place: his sneaky face says it)
    if (lit && s.frozen) s.frozeOnce = true;
    // a beam LANDING on him frozen pays (more on the beat)
    if (lit && lit.land != null && t - DT < lit.land + 1e-6 && t >= lit.land && !s.landed[lit.key] && !cut) { s.landed[lit.key] = 1;
      if (s.frozen) { const onB = Math.abs(s.frzAt - lit.land) <= G.ONBEAT; pts(s, t, onB ? 200 * s.mult : 50, { frz: onB ? 2 : 1 }); if (onB) onBeatAct(s); } }
    if (lit && !s.frozen && lethal) {
      const nonLethal = lit.cue != null && lit.cue !== dareC.i;   // the door + torch cue hits: a close call, never a death
      if (nonLethal) { if (!s.close || t - s.close > 1) { s.close = t; react('shock', 0.6); } s.exposed = 0; }
      else { s.exposed += DT; if (s.exposed > G.GRACE) {
        const kind = lit.kind, teach = kind === 'door' && t < R.teachEnd && !s.frozeOnce, first = !s.free[kind];
        const bump = teach || first; if (!teach) s.free[kind] = 1; s.bumps++; breakCombo(s);
        s.seenAnim = { t0: t, side: s.side || 1, bump, kind }; s.seenAt = t; if (bump && t < R.teachEnd) s.knock = t; react('shock', 0.5); s.frozen = false; s.exposed = 0; return; } } }
    else s.exposed = 0;
    // the dare: no judged freeze by the end of its window → seen (it can see him: the one cue that can)
    if (!C.def.blank && t >= R.dareT && t < R.dareShut && !(dq && dq.q > 0) && (dq || t > dareC.end)) { s.seenAnim = { t0: t, side: s.side || 1, bump: false, kind: 'door' }; s.seenAt = t; s.bumps++; breakCombo(s); react('shock', 0.6); return; }
    // ---- infect: stand still by it (frozen counts) ----
    s.nearT = null;
    if (!C.def.blank) for (const q of Pp.tg) { const i = q.i; if (s.inf[i] != null) continue;   /* (?blank: the toys stay toys — no infects, nothing put away) */
      if (t >= q.t1) { if (s.away[i] == null) s.away[i] = q.t1; s.prog[i] = 0; continue; }
      if (t < q.t0) continue;
      const near = Math.hypot(s.x - q.x, s.y - q.y) < G.REACH, rate = DT / (q.need * P) * (s.frozen ? G.FRZ_RATE : 1);
      if (near && !moving && !cut) { s.prog[i] = Math.min(1, s.prog[i] + rate); s.nearT = i;
        if (s.prog[i] >= 1 && Math.floor(C.beatOf(t)) !== Math.floor(C.beatOf(t - DT))) {   // (full: it lands on the next beat line)
          s.inf[i] = t; s.prog[i] = 1; const nose = !!lit; pts(s, t, q.pts * s.mult + (nose ? 250 : 0), { inf: i, nose }); onBeatAct(s);
          s.keySpin++; s.keySpinAt = t; if (nose) s.nose = t; react(s.inf.filter(v => v != null).length === 1 ? 'proud' : nose ? 'sneaky' : 'grin', 0.9); } }
      else s.prog[i] = Math.max(0, s.prog[i] - rate * 0.6); }
    // ---- morning: wake the toys he made his; hop with them on the outro stabs ----
    if (morning && t >= R.sunrise) { for (const q of Pp.tg) { const i = q.i; if (s.inf[i] == null || s.woke[i] != null) continue;
        if (Math.hypot(s.x - q.x, s.y - q.y) < 1.4) { s.woke[i] = t; pts(s, t, 100, { wake: i }); react('joy', 0.6); } }
      if (press) { s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.hopAt = t; }   // (Space is always his glitch: a flicker, and a little hop)
      if (press) { const st = R.stabs.findIndex(v => Math.abs(t - v) <= 0.15); if (st >= 0 && s.hops[st] == null) {
        const n = Pp.tg.filter(q => s.inf[q.i] != null && Math.hypot(s.x - q.x, s.y - q.y) < 3.2).length; s.hops[st] = t; if (n) { pts(s, t, 50 * n, { hop: n }); react('joy', 0.5); } } } }
    { const e = t - s.hopAt; s.hopY = morning && e >= 0 && e < 0.34 ? 0.42 * Math.sin(e / 0.34 * Math.PI) : 0; s.air = s.hopY > 0.02; }   // (arms out while he's off the rug; none standing, frozen or caught)
    s.cutscene = R.dance && t >= R.dance[0] && t < R.dance[1] && !C.def.blank ? 'dance' : false;   // (the outro's last stabs: he dances with his toys, arms out)
    if (t >= R.tally && !s.final) s.final = finalScore(C, s);
    // ---- his face + where he looks ----
    if (s.frozen && Math.floor(t * 4) !== Math.floor((t - DT) * 4)) react('toy', 0.32);
    let tgtF = moving ? s.side * (Math.abs(hx) > 0 ? 1.0 : 0.7) : s.side * 0.45;
    if (cut || t >= R.tally) tgtF = 0.3;
    if (R.turnUs && t >= R.turnUs[0] && t < R.turnUs[1] && !moving) tgtF = 0.05;
    if (s.frozen) s.facing = (s.fz ?? s.facing) - 0.6 * Math.sin(b * Math.PI) * 0.036;   // stock-still: cancel the view's beat sway
    else s.facing += (tgtF - s.facing) * (1 - Math.exp(-12 * DT));
    s.tilt = 0;
  },
};

// ---------- the look: the room + everything in it is the story layer; in front of him, its overFX ----------
export const modeView = ({ T, world, C, cam, overlay }) => {
  if (TMO.storyPrep) TMO.storyPrep(C);
  return {
    draw(f) { const s = f.s;
      // the tin robot's key (play/outfits/tin-robot.mjs reads this): dead still while he's a plain toy, a fast spin on an infect
      if (typeof globalThis !== 'undefined') { const K = globalThis.TIN_KEY && globalThis.TIN_KEY.tmo ? globalThis.TIN_KEY : (globalThis.TIN_KEY = { tmo: true });
        K.stop = !!(s.frozen || s.seenAnim); K.spinN = s.keySpin || 0; K.at = typeof performance !== 'undefined' ? performance.now() : 0; }
      if (TMO.sound) TMO.sound(f, C); },
    over(ctx, f) { if (TMO.over && !C.def.blank) TMO.over(ctx, f, C); },   // (?blank: no rings, letterbox, asides, score, card)
  };
};

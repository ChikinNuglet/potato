// modes/still-here.mjs — Level 7, Still Here: the castle wall at night, a side-on PLATFORMER inside a moving screen.
// Chikin (Nov 1): "still here is a token collector level, you still have to jump with the timing, but if you dont collect tokens,
// you arent 'still here'" · "Still here should have more tokens, they can be smaller. The token meter should actually have a
// chance of running out … The token meter should be a little larger on the UI, and potato should be able to move back and forth
// to collect the tokens. It can be more of a platformer, with the bats flying around, and the dragon stopping for a fight, you
// can have it crash in, create a platform potato can jump on from the debris that falls in through the roof … if you dont have
// enough tokens by the time the cutscene starts, your token meter would run out and you would die, but after the dragon dies,
// you get the gold from the dragon and have a refreshed token bar" · "the dragon is antivirus software" · "the whole castle
// should be on fire, its potato getting through the firewalls" · "the sword can be the part of the glitch power, he does his
// normal glitch, but a sword pops out for the jump". The plan: game/stories/still-here.md (its "Album pass" wins).
//
// THE RULES (pure, deterministic, 120 Hz — the bot and the replay run this same file):
//   · The wall scrolls on the music (def.sections speeds; the anchor A(t) = C.X(t) is "his spot" on screen). He runs with it:
//     let go and he keeps pace (drifting gently back to his spot); → runs ahead, ← turns back along the wall (catch what fell
//     behind). In the fight the screen stops and the arena is his to roam.
//   · ↑ jumps (two beats in the air), ↓ ducks. Stones are solid (hop them; if the screen pushes him into one he scrambles over,
//     a small bump). The rubble slabs in the fight are platforms (land on them from above).
//   · TOKENS are his food. The meter drains all song (faster in the quiet, paused in the cutscenes except the crash and the
//     hush). Small +1.4%, big +7%, dragon gold +8%. Empty = deep rest: he greys out, "not still here", the section restarts.
//   · Getting hit costs tokens, never the whole song: fire 12%, a bat 8%, a beam 10%, the claw 12%, a stone bump 5%; a beat of
//     safety after. Only the meter running out ends a run.
//   · SPACE = his glitch (purple), and the SWORD pops out of it: glitches in beside him, swings once, glitches out (0.34 s). No
//     arms, no hands. The glitch passes him through fire (−0.35 s … +0.19 s round the beat the curtain lands on); the sword cuts
//     bats (their coin drops), cages (the light inside joins him), burning beams and the dragon's eye. It comes back in 0.5 s.
//     A glitch that passes nothing and cuts nothing burns a token (a coin pops out of the jar; free until the first firewall).
//   · FIREWALLS: the floor glows red for four beats, then a curtain of fire sweeps the whole wall on the beat (where he stands
//     never matters). GRATES: glowing bars in the floor that lift him through a column of tokens. THE CLAW (stop-time): its
//     shadow rises over him for four beats, then it rakes the stones where he stands: be in the air.
//   · THE FIGHT: the dragon crashes through the timber roof (CS4), three slabs land as a stair. Breath 1 (glitch) → its head slams
//     down beside the top slab, eye open for two beats (sword it from up the stair: a crack) → a jet over the stair (the glitch
//     can't pass it: get low) → climb, crack → a jet along the floor (stay up) → crack. No food from the dive on; every eye he
//     didn't crack makes the hush eat faster. The camera pulls back for the whole fight.
//   · THE KILL (CS5 → CS6): the hush drains him in front of it; the album's cue ring ticks three times; Space on the drop
//     (−0.22 … +0.30 s). A miss scorches him and it breathes again four beats later (three chances). The dragon bursts into
//     gold: 6 + 8 per crack pieces rain down — catch them, the meter refills. After the kill nothing drains and nothing hurts.
//   · SCORE (album section 6): token 10 · big 40 · gold 40 · firewall 50 · bat 25 · cage 150 · claw 100 · crack 200 · the cut
//     1000 (500 inside the window) + 10 per % of tokens left · heater flare 150 · ember 20; on the beat (±0.10 s) ×2; the combo
//     ×1–×4 at 8 / 16 / 32 timed actions, broken only by a hit or a missed cue. End: + banner % × 3000 + average meter × 2000,
//     CLEAN (no retry, no hit) +10%. Grade vs the bot's run (def.castle.perfect).
// Everything WHEN and WHERE is the level file (def.castle). The look is story-still-here.mjs (the castle behind, its modeView
// in front).

export const G = {
  PH: 1.25, PHD: 0.6, PW: 0.36,          // his box: height standing / ducking, half-width
  RUN: 3.4, BACK: 1.5, ACC: 40, AIR: 24, DRIFT: 0.9, IDLE: 0.45,   // → adds RUN to the scroll; ← runs back at BACK (world); let go = drift home after IDLE s
  OXMIN: -2.15, OXMAX: 6.5,              // how far he can get from his spot on screen (the screen's edges)
  HOPH: 1.7, HOPT: 0.66, LAUNCH: 3.5,    // a jump: 1.7 high, two beats in the air · a grate throws him 3.5 high
  COYOTE: 0.08, BUFFER: 0.1,
  GCOOL: 0.5, PHASE: 0.32, SWING: 0.34, SW0: 0.03, SW1: 0.27, REACH: 2.05, SBACK: 0.35, STOP: 2.5,   // the glitch + sword
  FIRE_E: 0.35, FIRE_L: 0.19, ONBEAT: 0.10,   // (late side 0.19: a phone / bluetooth delay still passes)
  MAG: 0.2,                               // tokens are pulled in only a little: the arcs up high need a real jump on the beat
  WASTE: 0.025,                           // a glitch that passes nothing and cuts nothing burns a token (his glitch runs on them)
  JETH: 0.9,                              // the dragon's jets in the fight: 'high' burns anything standing above this, 'low' below it
  CRACKY: 1.9,                            // the eye only cracks from up the stair (his feet this high: the top slab, or a jump from slab 1)
  IMMUNE: 0.6, REST: 1.05,
  HURT: { fire: 0.12, bat: 0.08, beam: 0.10, claw: 0.12, stone: 0.05, cue: 0.15 },
  GAIN: { small: 0.014, big: 0.07, gold: 0.08 },   // (more, smaller tokens: Chikin)
  FLOOR: 0,
};
G.GRAV = 8 * G.HOPH / (G.HOPT * G.HOPT); G.JUMP = 4 * G.HOPH / G.HOPT; G.VLAUNCH = Math.sqrt(2 * G.GRAV * G.LAUNCH);
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const DT = 1 / 120;
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- the schedule, prepared once per course ----------
const PREPS = new WeakMap();
export function prep(C) {
  if (PREPS.has(C)) return PREPS.get(C);
  const K = C.def.castle, P = C.P, A = t => C.X(t);
  const at = (t, ox = 0) => A(t) + ox;
  const stones = K.stones.map((o, i) => { const t = o.t ?? o, w = o.w ?? 0.7, h = o.h ?? 0.55, x = at(t, o.ox || 0); return { i, t, x0: x - w / 2, x1: x + w / 2, h }; });
  const grates = K.grates.map((t, i) => { const x = at(t); return { i, t, x0: x - 0.55, x1: x + 0.55 }; });
  const beams = K.beams.map((o, i) => { const w = o.w ?? 0.6, x = at(o.t); return { i, t: o.t, kind: o.kind || 'beam', x0: x - w / 2, x1: x + w / 2, y0: o.y0 ?? 0.78, y1: o.y1 ?? 3.4, fall: o.fall ?? null }; });
  const bats = K.bats.map((o, i) => ({ i, tb: o.t ?? o, hi: o.hi ?? 0.95, big: o.big ?? true, from: o.from ?? 1 }));
  const cages = K.cages.map((t, i) => { const x = at(t); return { i, t, x, y: 1.55 }; });
  const sweeps = K.sweeps.map((o, i) => ({ i, t: o.t ?? o, kind: o.kind || 'dragon', warn: (o.warn ?? 4) * P, jet: o.jet || null }));
  const claws = K.claws.map((t, i) => ({ i, t }));
  const tokens = K.tokens.map((o, i) => ({ i, t: o.t, x: at(o.t, o.ox || 0), y: o.y, big: !!o.big, cat: o.cat || 'floor', from: o.from ?? (o.t >= K.fight.t0 ? K.lapFrom : -1) })).sort((a, b) => a.x - b.x);   // (the sunrise lap's tokens lie where the arena was: they only appear at dawn)
  tokens.forEach((k, i) => { k.i = i; });
  const spawns = (K.spawns || []).map(o => ({ ...o })).sort((a, b) => a.t - b.t);
  const embers = (K.embers || []).map((t, i) => { const x = at(t); return { i, t, x0: x - 0.4, x1: x + 0.4, from: K.emberFrom ?? -1 }; });
  const F = K.fight, AF = A(F.t0);
  const slabs = F.slabs.map((q, i) => ({ i, land: q.land, x0: AF + q.ox0, x1: AF + q.ox1, y1: q.top }));
  const cuts = K.cuts.map(([a, b, name, o = {}]) => ({ a, b, name, drain: !!o.drain, bars: o.bars !== false, push: o.push ?? 0 }));
  const secs = K.retry.slice();
  if (C.def.blank) { for (const a of [stones, beams, bats, cages, sweeps, claws, tokens, spawns, embers, cuts]) a.length = 0; }   // (?blank, run/blank.mjs: no stones, bats, beams, cages, firewalls, claws, tokens, embers, cutscenes — the wall-walk, the grates and the fight's slab stair stay)
  const Pp = { C, K, P, A, stones, grates, beams, bats, cages, sweeps, claws, tokens, spawns, embers, F, AF, slabs, cuts, secs,
    nBig: tokens.filter(k => k.big).length, nTok: tokens.length };
  PREPS.set(C, Pp); return Pp;
}
export const vAt = (C, t) => C.secs[C.secAt(t)].v;
export function cutAt(Pp, s, t) {
  for (const c of Pp.cuts) { const b = c.name === 'kill' ? killEnd(Pp, s) : c.b; if (t >= c.a && t < b) return c; } return null;
}
export const killEnd = (Pp, s) => { const KL = Pp.K.kill;
  if (s && s.killAt != null) return s.killAt + KL.cs6; if (s && s.killFail) return KL.hits[KL.hits.length - 1] + 0.6;
  const h = KL.hits[(s && s.killTry) || 0]; return h != null ? Math.max(KL.end, h + KL.late + 0.05) : KL.end; };   // (the bars hold through every try: no gap between a miss and the next ring)
// the bat's flight (screen offsets from his spot): it circles in from the right, swoops at where he was a beat before, climbs away
export function batPos(Pp, s, b, t) {
  const tb = b.tb, P = Pp.P, L = s && s.batLock && s.batLock[b.i] != null ? s.batLock[b.i] : (s ? clamp(s.x - Pp.A(t), G.OXMIN, G.OXMAX) : 0);   // (the whole screen: no safe edge)
  const t0 = tb - 6 * P, t1 = tb, t2 = tb + 4 * P;
  if (t < t0 - 3 * P || t > t2) return null;
  let ox, y;
  if (t < t0) { const k = (t - (t0 - 3 * P)) / (3 * P); ox = 9.2 - 1.6 * k + 0.5 * Math.sin(k * 5); y = 3.5 + 0.35 * Math.sin(k * 7); }
  else if (t < t1) { const k = (t - t0) / (t1 - t0); ox = 7.6 + (L - 7.6) * k; y = 3.5 + (b.hi - 3.5) * ease(k); }
  else { const k = (t - t1) / (t2 - t1); ox = L - 5.2 * k; y = b.hi + 3.2 * k * k; }
  return { x: Pp.A(t) + ox, y, ox };
}
// the dragon's head in the fight: 'up' (throat glowing), 'down' (beside the top slab, eye open), 'rear' (CS5)
export function headAt(Pp, t) {
  const F = Pp.F; for (const w of F.windows) if (t >= w.a - 0.12 && t < w.b + 0.1) return { st: 'down', k: clamp((t - (w.a - 0.12)) / 0.12), w };
  if (t >= F.t0 && t < F.hush) return { st: 'up' }; return { st: t >= F.hush ? 'rear' : 'none' };
}
export const eyeBox = Pp => { const F = Pp.F; return { x0: Pp.AF + F.eye.ox - 0.55, x1: Pp.AF + F.eye.ox + 0.55, y0: F.eye.y - 0.6, y1: F.eye.y + 0.6 }; };

// ---------- the score ----------
export const multOf = n => n >= 32 ? 4 : n >= 16 ? 3 : n >= 8 ? 2 : 1;
function act(s) { s.onb++; s.mult = multOf(s.onb); s.bestMult = Math.max(s.bestMult, s.mult); }
function breakCombo(s) { s.onb = 0; s.mult = 1; }
function pts(s, t, n, k) { s.score += n; s.pop.push({ t, n, k }); if (s.pop.length > 10) s.pop.shift(); }
export function finalScore(C, s) {
  const Pp = prep(C), got = s.got.reduce((a, v) => a + v, 0), banner = got / Math.max(1, Pp.nTok);
  const avg = s.mN ? s.mSum / s.mN : 0, clean = !s.hits && !RUN.retries;
  const base = s.score + Math.round(banner * 3000 + avg * 2000), total = Math.round(base * (clean ? 1.1 : 1));
  const perfect = Pp.K.perfect || total, share = total / perfect;
  const grade = share >= 0.9 && clean ? 'S' : share >= 0.75 ? 'A' : share >= 0.55 ? 'B' : 'C';
  return { total, base, banner, got, of: Pp.nTok, clean, share, grade, bestMult: s.bestMult, saved: s.saved.length, cracks: s.cracks, cut: s.killQ || 0 };
}
// a run's bank: the meter, the score and what he's eaten at each retry line (a retry rewinds to it); a retry costs CLEAN
export const RUN = { bank: {}, retries: 0 };
const SNAP = ['meter', 'score', 'onb', 'mult', 'bestMult', 'hits', 'mSum', 'mN', 'flare', 'cracks'];
function snap(s) { const o = {}; for (const k of SNAP) o[k] = s[k]; o.got = s.got.slice(); o.saved = s.saved.slice(); return o; }

// ---------- the mode ----------
export const mode = {
  init(s, api) {
    const C = api.C, Pp = prep(C), t = s.t, A = Pp.A(t);
    Object.assign(s, { x: A, y: 0, vx: vAt(C, t), vy: 0, ground: true, onSlab: -1, ducking: false, duckUntil: -9, facing: 0.35, sdir: 1, walking: true,
      meter: Pp.K.meterStart, got: Pp.tokens.map(() => 0), drops: [], spawnI: 0, batLock: {}, batCut: {}, batHit: {}, cageCut: {}, beamCut: {}, beamHit: {},
      sweepDone: {}, clawDone: {}, grateUsed: {}, emberOut: {}, stoneHit: {}, saved: [], cracks: 0, crackAt: {}, killAt: null, killQ: 0, killTry: 0, killFail: false,
      killPress: null, goldN: 0, glitchAt: null, gReady: 0, blink: 0, phase: 0, immune: -9, hurtAt: null, hurtKind: null, hits: 0,
      score: 0, onb: 0, mult: 1, bestMult: 1, pop: [], mSum: 0, mN: 0, flare: null, restAt: null, final: null, lastIn: 0, jBuf: -9, lastGround: t,
      upWas: false, dnWas: false, lastSec: -1, cutscene: false, camZoom: 1, camY: 2.0, dx: 0, ox: 0, landedAt: null, jumpedAt: null, tokenAt: null });
    s.dx = 0;
    if (t <= 0.001) { RUN.bank = {}; RUN.retries = 0; RUN.tries = {}; }
    else { RUN.retries++;
      const k = Object.keys(RUN.bank).map(Number).filter(v => v <= t + 0.01).sort((a, b) => b - a)[0];
      if (k != null) { const B = JSON.parse(JSON.stringify(RUN.bank[k])); Object.assign(s, B); }
      // (a retry never starts you starving, and each retry of the same line tops you up a little more: punishing, never cruel)
      const key = (+t).toFixed(2), n = RUN.tries[key] = (RUN.tries[key] || 0) + 1;
      s.meter = Math.max(Math.min(0.85, (Pp.K.retryFloor ?? 0.4) + (Pp.K.retryStep ?? 0.1) * (n - 1)), s.meter);
      if (t >= Pp.F.t0) { s.x = Pp.AF; }
      // everything already behind the line is done: a fresh sim must not replay the old firewalls, claws, grates and bats on frame one
      for (const sp of Pp.sweeps) if (sp.t + G.FIRE_L <= t + 1e-6) s.sweepDone[sp.i] = 1;
      for (const cl of Pp.claws) if (cl.t <= t + 1e-6) s.clawDone[cl.i] = 1;
      for (const g of Pp.grates) if (g.t < t) s.grateUsed[g.i] = 1;
      for (const q of Pp.stones) if (q.t < t) s.stoneHit[q.i] = 1;
      for (const bm of Pp.beams) if (bm.t < t - 0.2) s.beamHit[bm.i] = -1;
      for (const bt of Pp.bats) if (bt.tb + 4 * Pp.P < t) s.batHit[bt.i] = -1;
    }
    s.gotN = s.got.reduce((a, v) => a + v, 0);
    for (let i = Pp.secs.length - 1; i >= 0; i--) if (Pp.secs[i] <= t + 0.01) { s.lastSec = i; break; }
    // the spawns already behind the start: skip them
    while (s.spawnI < Pp.spawns.length && Pp.spawns[s.spawnI].t < t) s.spawnI++;
  },
  step(s, inp, t, api) {
    const C = api.C, Pp = prep(C), K = Pp.K, P = Pp.P, b = C.beatOf(t);
    const react = (name, dur) => { s.react = { name, dur, at: t }; };
    const A = Pp.A(t), V = vAt(C, t);
    // a retry line: bank the run as it stands
    for (let i = s.lastSec + 1; i < Pp.secs.length && Pp.secs[i] <= t; i++) { s.lastSec = i; RUN.bank[Pp.secs[i]] = snap(s); }
    if (s.blink > 0) s.blink = Math.max(0, s.blink - DT);
    s.phase = s.glitchAt != null && t - s.glitchAt < G.PHASE ? 1 - (t - s.glitchAt) / G.PHASE : 0;
    const cut = cutAt(Pp, s, t); s.cutscene = cut ? cut.name : false;
    if (C.def.blank) { s.meter = 1; s.restAt = null; }   // (?blank: no meter, never deep rest)
    const killed = s.killAt != null && t >= s.killAt;
    // ---- deep rest: the tokens ran out ----
    if (s.restAt != null) { s.walking = false; s.vx = V; s.x += s.vx * DT; s.ducking = false; if (!s.ground) { s.vy -= G.GRAV * DT; s.y = Math.max(groundY(Pp, s, s.x), s.y + s.vy * DT); if (s.y <= groundY(Pp, s, s.x) + 1e-6) { s.ground = true; s.vy = 0; } }
      s.facing += (0.05 - s.facing) * 0.05; camera(Pp, s, t, cut);
      if (t - s.restAt >= G.REST && !s.dead) { api.die('deep rest'); s.dead = true; s.why = 'deep rest'; } return; }
    // ---- the meter: drains (paused in cutscenes unless the cut says drain), and the average for the end bonus ----
    const dr = killed ? 0 : (cut && !cut.drain ? 0 : drainAt(K, t) + (t >= Pp.F.hush ? (3 - s.cracks) * (K.hushMiss || 0) : 0)); s.meter -= dr * DT;   // (an eye he didn't crack eats more in the hush)
    if (!cut) { s.mSum += clamp(s.meter); s.mN++; }
    // ---- input (taken in a CUT, except the cue press) ----
    const ctl = !cut;
    const upEdge = !!inp.J || (!!inp.Uh && !s.upWas); s.upWas = !!inp.Uh;
    const dnEdge = !!inp.D || (!!inp.Dh && !s.dnWas); s.dnWas = !!inp.Dh;
    const gPress = !!inp.G;
    const L = ctl && !!inp.Lh, R = ctl && !!inp.Rh;
    if (L || R || upEdge || dnEdge) s.lastIn = t;
    if (R && !L) s.sdir = 1; else if (L && !R) s.sdir = -1; else if (ctl && Math.abs(s.x - A) < 0.3 && t - s.lastIn > 0.4) s.sdir = 1;
    // ---- the glitch (+ the sword) ----
    let cueJudged = false;
    if (gPress && s.killAt == null && !s.killFail && !C.def.blank) cueJudged = cue(Pp, s, t, react);   // the kill cue (inside CS5) takes the press first
    // a glitch that passed nothing and cut nothing burns a token (judged when its sword is done, or when the next one fires)
    if (s.gPend != null && (t - s.gPend >= G.SW1 + 0.03 || (gPress && t >= s.gReady && (ctl || cueJudged)))) waste(Pp, s, t, killed);
    if (gPress && t >= s.gReady && (ctl || cueJudged)) { s.glitchAt = t; s.gReady = t + G.GCOOL; s.blink = 0.22; s.blinkFrom = { x: s.x, y: s.y }; s.swordDir = s.sdir; s.glitches = (s.glitches || 0) + 1;
      s.gPend = t; s.gUsed = !!cueJudged;
      const Hd = headAt(Pp, t); if (Hd.st === 'down') s.swordDir = Pp.AF + Pp.F.eye.ox >= s.x ? 1 : -1; }   // (in the fight, with its head down, the sword swings at the eye whichever way he's facing)
    // ---- horizontal: run with the wall ----
    const ox = s.x - A, arena = V === 0;
    let want;
    if (!ctl) want = V + (cut && cut.name === 'crash' ? clamp((0.3 - ox) * 3, -3, 3) : V > 0 ? clamp(-ox * 0.8, -0.6, 0.6) : 0);
    else if (R && !L) want = V + G.RUN;
    else if (L && !R) want = arena ? -G.RUN : -G.BACK;
    else want = V + (!arena && s.ground && t - s.lastIn > G.IDLE ? clamp(-ox * 1.1, -G.DRIFT, G.DRIFT) : 0);
    if (s.ducking) want = V + (want - V) * 0.5;
    const acc = (s.ground ? G.ACC : G.AIR) * DT; s.vx += clamp(want - s.vx, -acc, acc);
    if (s.hurtAt != null && t - s.hurtAt < 0.18) s.vx = V - 2.4;   // knocked back
    const x0 = s.x; s.x += s.vx * DT;
    // solids from the side: stones (low, solid), slabs are one-way platforms (no sides)
    const top = s.y + (s.ducking ? G.PHD : G.PH);
    for (const q of Pp.stones) { if (q.x1 < s.x - 1.5 || q.x0 > s.x + 1.5) continue; if (s.y >= q.h - 0.02 || top <= 0) continue;
      if (x0 + G.PW <= q.x0 + 0.02 && s.x + G.PW > q.x0) { s.x = q.x0 - G.PW; s.vx = Math.min(s.vx, 0); }
      else if (x0 - G.PW >= q.x1 - 0.02 && s.x - G.PW < q.x1) { s.x = q.x1 + G.PW; s.vx = Math.max(s.vx, 0); } }
    // the screen's edges
    const lo = A + G.OXMIN, hi = A + (arena ? Pp.F.oxMax : G.OXMAX);
    if (s.x < lo) { s.x = lo; s.vx = Math.max(s.vx, V);
      // pushed into a stone by the screen: he scrambles over it (a small bump)
      for (const q of Pp.stones) if (s.ground && s.x + G.PW >= q.x0 - 0.03 && s.x - G.PW < q.x1 && s.y < q.h && !s.stoneHit[q.i]) { s.stoneHit[q.i] = 1; s.y = q.h; s.ground = true; hurt(Pp, s, t, 'stone', react); } }
    if (s.x > hi) { s.x = hi; s.vx = Math.min(s.vx, V); }
    s.ox = s.x - A;
    // ---- vertical ----
    if (upEdge && ctl) s.jBuf = t;
    if (s.ground) s.lastGround = t;
    if (dnEdge && ctl && s.ground) s.duckUntil = t + 0.42;
    if (ctl && inp.Dh && s.ground) s.duckUntil = Math.max(s.duckUntil, t + 0.06);
    if (ctl && t - s.jBuf <= G.BUFFER && (s.ground || t - s.lastGround <= G.COYOTE) && !(s.jumpedAt != null && t - s.jumpedAt < 0.15)) {
      s.vy = G.JUMP; s.ground = false; s.jumpedAt = t; s.jBuf = -9; s.duckUntil = -9; s.onSlab = -1; }
    const gy = groundY(Pp, s, s.x);
    if (s.ground && s.y > gy + 0.01) s.ground = false;                       // walked off a slab / a stone
    if (!s.ground) { const y0 = s.y; s.vy -= G.GRAV * DT; s.y += s.vy * DT;
      const land = landY(Pp, s, s.x, y0, s.y, t);
      if (s.vy <= 0 && land != null) { s.vyIn = s.vy; s.y = land.y; s.vy = 0; s.ground = true; s.onSlab = land.slab; s.landedAt = t; } }
    else s.y = gy;
    s.ducking = s.ground && t < s.duckUntil && ctl;
    // ---- grates: step on one and it throws him up through its column ----
    if (ctl) for (const g of Pp.grates) if (!s.grateUsed[g.i] && s.ground && s.y < 0.05 && s.x > g.x0 && s.x < g.x1) { s.grateUsed[g.i] = 1; s.vy = G.VLAUNCH; s.ground = false; s.grateAt = t; s.jumpedAt = t; react('wide', 0.6); }
    // ---- the sword: what it cuts while it swings ----
    const sw = s.glitchAt != null ? t - s.glitchAt : 9;
    if (sw >= G.SW0 && sw <= G.SW1) {
      const d = s.swordDir || 1, bx0 = d > 0 ? s.x - G.SBACK : s.x - G.REACH, bx1 = d > 0 ? s.x + G.REACH : s.x + G.SBACK, by0 = s.y - 0.4, by1 = s.y + G.STOP;
      const inBox = (x, y, r = 0.3) => x + r > bx0 && x - r < bx1 && y + r > by0 && y - r < by1;
      for (const bt of Pp.bats) { if (s.batCut[bt.i] != null || s.batHit[bt.i] != null) continue; const p = batPos(Pp, s, bt, t); if (!p || !inBox(p.x, p.y, 0.35)) continue;
        s.batCut[bt.i] = t; s.gUsed = true; s.drops.push({ x: p.x, y: p.y, vx: 1.4, vy: 5.2, big: bt.big, kind: 'coin', t0: t, got: 0, bounced: 0, rest: false }); pts(s, t, 25 * s.mult, 'bat'); act(s); react('smirk', 0.5); s.cutFx = { t, x: p.x, y: p.y, k: 'bat' }; }
      for (const cg of Pp.cages) { if (s.cageCut[cg.i] != null) continue; if (!inBox(cg.x, cg.y + 0.35, 0.35)) continue;
        s.cageCut[cg.i] = t; s.gUsed = true; s.saved = [...s.saved, t]; pts(s, t, 150 * s.mult, 'cage'); act(s); react('warm', 1.0); s.cutFx = { t, x: cg.x, y: cg.y + 0.35, k: 'cage' }; }
      for (const bm of Pp.beams) { if (s.beamCut[bm.i] != null || s.beamHit[bm.i] != null) continue; const y = beamY(bm, t); if (!(bm.x1 > bx0 && bm.x0 < bx1 && y.y0 < by1 && y.y0 + 0.5 > by0)) continue;
        s.beamCut[bm.i] = t; s.gUsed = true; pts(s, t, 25 * s.mult, 'beam'); s.cutFx = { t, x: (bm.x0 + bm.x1) / 2, y: y.y0 + 0.3, k: 'beam' }; }
      const H = headAt(Pp, t);
      if (H.st === 'down' && H.k >= 1 && s.crackAt[H.w.i] == null) { const E = eyeBox(Pp);
        if (E.x1 > bx0 && E.x0 < bx1 && E.y1 > by0 && E.y0 < by1 && s.y >= G.CRACKY) { s.crackAt[H.w.i] = t; s.cracks++; s.gUsed = true; const onB = Math.abs(s.glitchAt - H.w.best) <= G.ONBEAT;
          pts(s, t, (200 + (onB ? 100 : 0)) * s.mult * (onB ? 2 : 1), 'crack'); act(s); react('determined', 0.8); s.cutFx = { t, x: (E.x0 + E.x1) / 2, y: (E.y0 + E.y1) / 2, k: 'crack' }; s.camShake = 0.25; } }
    }
    if (s.camShake) s.camShake = Math.max(0, s.camShake - DT * 0.9);
    // ---- hazards ----
    const immune = t < s.immune || s.phase > 0;
    const bx0 = s.x - G.PW, bx1 = s.x + G.PW, byTop = s.y + (s.ducking ? G.PHD : G.PH);
    if (!killed) {
      // firewalls: the curtain lands on the beat; the glitch passes him through
      for (const sp of Pp.sweeps) { if (s.sweepDone[sp.i] || t < sp.t + (sp.jet ? 0.05 : G.FIRE_L)) continue; s.sweepDone[sp.i] = 1;
        if (cutAt(Pp, s, sp.t) && sp.kind !== 'boss') continue;
        if (sp.jet) { const up = s.y > G.JETH, burnt = sp.jet === 'high' ? up : !up;   // a jet: the glitch can't pass it (it learned his signature): be where it isn't
          if (burnt) hurt(Pp, s, sp.t, 'fire', react, true); else { pts(s, t, 50 * s.mult, 'fire'); act(s); s.passAt = t; react('smirk', 0.45); } continue; }
        const g = s.glitchAt; if (g != null && g >= sp.t - G.FIRE_E && g <= sp.t + G.FIRE_L) { const onB = Math.abs(g - sp.t) <= G.ONBEAT; pts(s, t, 50 * s.mult * (onB ? 2 : 1), 'fire'); act(s); s.passAt = t; if (!s.react || t - s.react.at > 0.6) react(onB ? 'grin' : 'smirk', 0.45); }
        else hurt(Pp, s, sp.t, 'fire', react, true); }
      // the claw: on the stab it rakes the stones where he stands — be in the air
      for (const cl of Pp.claws) { if (s.clawDone[cl.i] || t < cl.t) continue; s.clawDone[cl.i] = 1;
        if (s.ground) hurt(Pp, s, t, 'claw', react, true); else { pts(s, t, 100 * s.mult, 'claw'); act(s); react('smirk', 0.5); }
        for (const [dx, big] of [[-0.6, false], [0.9, true]]) s.drops.push({ x: s.x + dx, y: 0.6, vx: dx * 1.2, vy: 4.2, big, kind: 'coin', t0: t, got: 0, bounced: 0, rest: false }); }   // the raked stones spill a token or two
      if (!immune && !cut) {
        for (const bt of Pp.bats) { if (s.batCut[bt.i] != null || s.batHit[bt.i] != null) continue; const p = batPos(Pp, s, bt, t); if (!p) continue;
          if (p.x > bx0 - 0.25 && p.x < bx1 + 0.25 && p.y > s.y - 0.2 && p.y < byTop + 0.15) { s.batHit[bt.i] = t; hurt(Pp, s, t, 'bat', react); break; } }
        for (const bm of Pp.beams) { if (s.beamCut[bm.i] != null || s.beamHit[bm.i] != null) continue; if (bm.x1 < bx0 || bm.x0 > bx1) continue; const y = beamY(bm, t);
          if (byTop > y.y0 + 0.05 && s.y < y.y1) { s.beamHit[bm.i] = t; hurt(Pp, s, t, 'beam', react); break; } }
      }
    }
    // bats lock on a beat before they swoop
    for (const bt of Pp.bats) if (s.batLock[bt.i] == null && t >= bt.tb - 2 * P) s.batLock[bt.i] = clamp(s.ox, G.OXMIN, G.OXMAX);
    // ---- tokens + drops (his food) ----
    const gain = (big, kind) => { const g = kind === 'gold' ? G.GAIN.gold : big ? G.GAIN.big : G.GAIN.small; s.meter = Math.min(1, s.meter + g); s.tokenAt = t; s.tokenBig = big || kind === 'gold';
      pts(s, t, (kind === 'gold' || big ? 40 : 10) * s.mult, kind === 'gold' ? 'gold' : big ? 'big' : 'tok'); };
    const cy0 = s.y - 0.25 - G.MAG, cy1 = byTop + 0.25 + G.MAG, cx0 = bx0 - 0.2 - G.MAG, cx1 = bx1 + 0.2 + G.MAG;
    if (s.restAt == null) for (const k of Pp.tokens) { if (k.x < cx0 - 0.3) continue; if (k.x > cx1 + 0.3) break; if (s.got[k.i]) continue;
      if (k.x > cx0 && k.x < cx1 && k.y > cy0 && k.y < cy1 && t >= k.from) { s.got[k.i] = 1; s.gotN = (s.gotN || 0) + 1; gain(k.big, 'tok'); } }
    while (s.spawnI < Pp.spawns.length && Pp.spawns[s.spawnI].t <= t) { const q = Pp.spawns[s.spawnI++];
      s.drops.push({ x: A + q.ox, y: q.y, vx: q.vx || 0, vy: q.vy || 0, big: !!q.big, kind: 'coin', t0: t, got: 0, bounced: 0, rest: false }); }
    // the dragon's gold: 6 + 8 per crack, raining over the arena after the kill (CS6)
    if (s.killAt != null) { const GD = K.gold, n = Math.min(GD.length, 6 + 8 * s.cracks), g0 = s.killAt + K.kill.cs6 - 0.5;
      while ((s.goldI || 0) < n && t >= g0 + GD[s.goldI || 0].dt) { const q = GD[s.goldI || 0]; s.goldI = (s.goldI || 0) + 1;
        s.drops.push({ x: Pp.AF + q.ox, y: 5.6, vx: 0, vy: 0, big: true, kind: 'gold', t0: t, got: 0, bounced: 0, rest: false, slow: 0.4 }); } }
    for (const d of s.drops) { if (d.got) continue;
      if (!d.rest) { const y0 = d.y; d.vy -= G.GRAV * (d.slow ?? 0.8) * DT; d.y += d.vy * DT; d.x += d.vx * DT; d.vx *= Math.exp(-DT * 2);
        const fl = d.vy <= 0 ? landY(Pp, s, d.x, y0, d.y, t, true) : null;
        if (fl) { d.y = fl.y; if (!d.bounced && d.vy < -2.5) { d.vy = -d.vy * 0.32; d.bounced = 1; } else { d.vy = 0; d.rest = true; d.vx = 0; } } }
      if (d.x > cx0 && d.x < cx1 && d.y > cy0 && d.y < cy1 && s.restAt == null) { d.got = 1; d.gotAt = t; gain(d.big, d.kind); if (d.kind === 'gold') s.goldN++; } }
    if (s.drops.length > 40) s.drops = s.drops.filter(d => !d.got && d.x > A - 5);
    // ---- embers on the sunrise lap: his light puts them out ----
    for (const e of Pp.embers) if (!s.emberOut[e.i] && t >= e.from && s.x + G.PW > e.x0 && s.x - G.PW < e.x1 && s.y < 0.6) { s.emberOut[e.i] = t; pts(s, t, 20 * s.mult, 'ember'); }
    // ---- story moments that score ----
    if (s.flare == null && t >= K.flareT) { s.flare = s.meter >= K.line ? 'big' : 'small'; if (s.flare === 'big') { pts(s, t, 150, 'flare'); react('proud', 1.0); } else react('sad', 1.0); }
    // ---- the kill: no press in the window → the miss plays (scorch, it breathes again) ----
    if (s.killAt == null && !s.killFail && !C.def.blank) { const KL = K.kill, h = KL.hits[s.killTry];
      if (h != null && t > h + KL.late && !s.killPress) { s.killTry++; breakCombo(s); hurt(Pp, s, t, 'cue', react, true); s.killMissAt = t; if (s.killTry >= KL.hits.length) { s.killFail = true; s.meter = 0; } }
      if (s.killPress && t > s.killPress) s.killPress = null; }
    if (s.killAt != null && t >= s.killAt && !s.killedFx) { s.killedFx = 1; s.camShake = 0.6; }
    if (s.meter <= 0 && s.restAt == null && !killed && !C.def.blank) { s.meter = 0; s.restAt = t; react('rest', 3); breakCombo(s); }
    // ---- his face + where he looks ----
    const moving = Math.abs(s.vx - V) > 0.6 || (V > 0 && s.ground);
    s.walking = s.ground && !s.ducking && Math.abs(s.vx) > 0.4 && !cut;
    let tf = s.vx - V > 0.8 ? 0.95 : s.vx - V < -0.8 ? -0.95 : V > 0 ? 0.55 : (s.sdir > 0 ? 0.5 : -0.5);
    if (cut) tf = cut.name === 'crash' || cut.name === 'kill' ? 0.75 : 0.18;
    if (t >= K.endT) tf = 0.05;
    if (K.calm && K.calm.some(([a, z]) => t >= a && t < z) && !(L || R)) tf = 0.25;
    s.facing += (tf - s.facing) * (1 - Math.exp(-10 * DT)); void moving;
    if (t >= K.endT && !s.final) s.final = finalScore(C, s);
    camera(Pp, s, t, cut);
  },
};
// the cue (the album's ring): three ticks, Space on the hit. Returns true if this press was judged.
function cue(Pp, s, t, react) {
  const KL = Pp.K.kill, h = KL.hits[s.killTry]; if (h == null) return false;
  const tick3 = h - Pp.P; if (t < tick3) return false;                               // before the third tick: nothing (it doesn't use up the cue)
  const d = t - h; s.killPress = t;
  if (d >= -KL.early && d <= KL.late) { s.killAt = t; s.killQ = Math.abs(d) <= 0.10 ? 2 : 1;
    s.score += (s.killQ === 2 ? 1000 : 500) * s.mult + Math.round(clamp(s.meter) * 100) * 10; s.pop.push({ t, n: 1000, k: 'kill' }); act(s); react('angry', 0.5); return true; }
  s.killTry++; breakCombo(s); hurt(Pp, s, t, 'cue', react, true); s.killMissAt = t; if (s.killTry >= KL.hits.length) { s.killFail = true; s.meter = 0; }
  return true;
}
function waste(Pp, s, t, killed) {
  const g = s.gPend; s.gPend = null; if (s.gUsed || killed || s.restAt != null || g < (Pp.K.wasteFrom ?? 0)) return;   // (free until the first firewall's warning: trying Space is how you learn it)
  // (a press inside a firewall's window always counts: it's what the glitch is for)
  if (Pp.sweeps.some(sp => !sp.jet && g >= sp.t - G.FIRE_E && g <= sp.t + G.FIRE_L && !(cutAt(Pp, s, sp.t) && sp.kind !== 'boss'))) return;
  s.meter -= G.WASTE; s.wasteAt = t; s.wastes = (s.wastes || 0) + 1;
}
function hurt(Pp, s, t, kind, react, force = false) {
  if (Pp.C.def.blank) return;   // (?blank: nothing hurts him)
  if (!force && t < s.immune) return; if (s.killAt != null && t >= s.killAt) return;
  s.meter -= G.HURT[kind] ?? 0.1; s.hurtAt = t; s.hurtKind = kind; s.immune = t + G.IMMUNE; s.hits++; breakCombo(s);
  if (s.ground && kind !== 'claw') { s.vy = 3.2; s.ground = false; }
  react(kind === 'fire' || kind === 'cue' ? 'scream' : 'shock', 0.6);
}
export function drainAt(K, t) { let r = 0; for (const [a, v] of K.drain) if (t >= a) r = v; return r; }
export function beamY(bm, t) { if (bm.fall == null) return { y0: bm.y0, y1: bm.y1 }; const k = clamp((t - (bm.fall - 0.9)) / 0.9); const d = (1 - k * k) * 2.8; return { y0: bm.y0 + d, y1: bm.y1 + d }; }
// the floor under x (the wall-walk, a stone, a landed slab)
function groundY(Pp, s, x) { let y = G.FLOOR; const t = s.t;
  for (const q of Pp.stones) if (x + G.PW * 0.6 > q.x0 && x - G.PW * 0.6 < q.x1 && s.y >= q.h - 0.05) y = Math.max(y, q.h);
  for (const q of Pp.slabs) if (t >= q.land && x + G.PW * 0.5 > q.x0 && x - G.PW * 0.5 < q.x1 && s.y >= q.y1 - 0.05) y = Math.max(y, q.y1);
  return y; }
// where a fall from y0 to y1 at x lands (floor, stone tops, slab tops), or null
function landY(Pp, s, x, y0, y1, t, small = false) { const w = small ? 0.12 : G.PW * 0.6; let best = null;
  const tryTop = (top, slab) => { if (y0 >= top - 0.001 && y1 <= top && (best == null || top > best.y)) best = { y: top, slab }; };
  tryTop(G.FLOOR, -1);
  for (const q of Pp.stones) if (x + w > q.x0 && x - w < q.x1) tryTop(q.h, -1);
  for (const q of Pp.slabs) if (t >= q.land && x + w > q.x0 && x - w < q.x1) tryTop(q.y1, q.i);
  return best; }
// the camera's wishes (the view reads s.dx, s.camZoom, s.camY via theme.camFix): in a cut it pushes in on him
function camera(Pp, s, t, cut) {
  const K = Pp.K, span = 6.0 * 16 / 9; let push = 0, zoom = 1, y = 2.0;
  if (cut) { push = cut.push; }
  const cold = Pp.C.def.blank ? -1 : K.cold;   // (?blank: no CS1 camera — it opens on him)
  if (t < cold) { const k = ease((t - 0.4) / 4.0); push = 0.15 + 0.85 * k; }                    // CS1: from the castle down onto him
  if (cut && cut.name === 'end') push = ease((t - cut.a) / 1.5) * cut.push;
  const zp = 1 + 0.75 * push; zoom = t < cold ? 0.82 + (zp - 0.82) * ease((t - 0.4) / 4.0) : zp;
  y = 2.0 + (s.y + 0.8 - 2.0) * push; if (t < cold) y = 3.4 + (s.y + 0.8 - 3.4) * ease((t - 0.4) / 4.0);
  const k = 1 - Math.exp(-DT * 3.2);
  s.pushK = (s.pushK ?? push) + (push - (s.pushK ?? push)) * k;
  s.camZoom = (s.camZoomS ?? zoom) + (zoom - (s.camZoomS ?? zoom)) * k; s.camZoomS = s.camZoom;
  // the fight: the screen stops and pulls back so the whole beast is in frame (its head, neck and body, the stair, him)
  const F = Pp.F, fw = t >= F.t0 - 0.3 && t < K.lapFrom ? 1 : 0; s.fk = (s.fk ?? fw) + (fw - (s.fk ?? fw)) * (1 - Math.exp(-DT * 2.4));
  const fz = K.fightCam ? K.fightCam.zoom : 0.8, fy = K.fightCam ? K.fightCam.y : 2.7, fcx = K.fightCam ? K.fightCam.cx : 4.3;
  s.camZoom = s.camZoom + (fz * (1 + 0.25 * s.pushK) - s.camZoom) * s.fk; s.camY = y + (fy + (s.y + 0.8 - fy) * s.pushK * 0.5 - y) * s.fk;
  const ox = s.x - Pp.A(t), dxN = ox + (span * 0.26 - ox) * s.pushK, dxF = s.x - Pp.AF - fcx + span * 0.26;
  s.dx = dxN + (dxF - dxN) * s.fk;
}

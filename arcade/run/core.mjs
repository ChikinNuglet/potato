// core.mjs — the runner's rules, pure and deterministic (no three.js): the course is authored in song time, Potato's x is
// a function of the song clock, physics steps at a fixed 120 Hz. The browser and tools/solve.mjs run this same file.
export const DT = 1 / 120;
export const PW = 0.8, PH = 1.25, PH_DUCK = 0.6;   // Potato's box (columns); ducking he's barely half as tall
// a hop lasts exactly one song beat (set per song in makeSim): land on a word, hop on the beat, land on the next word
const HOP_H = 1.35, BEAT_WIN = 0.07;
const LETTER_DELAY = 0.22, FALL = 26;            // word letters start dropping this long after he lands; fall speed
export const POWERS = {                           // one-shot: get the download, hold it, use it at the right moment (V: a blast that breaks the armored word)
  king:         { name: 'the King', verb: 'by royal decree', hint: 'V: a royal decree breaks the gold word' },
  disco:        { name: 'Disco Legend', verb: 'get down', hint: 'V on "down": the disco lights blow it apart' },
  detective:    { name: 'Noir Detective', verb: 'fact check', hint: 'V: fact-check the gold word' },
  construction: { name: 'Construction', verb: 'girder down', hint: 'V: a girder through the gold clause' },
  astronaut:    { name: 'Orbital Astronaut', verb: 'mag pulse', hint: 'V: a mag pulse through the gold fact' },
  ghost:        { name: 'Sheet Ghost', verb: 'boo', hint: 'V: haunt the chat — his messages go wild' },
  knight:       { name: 'Castle Knight', verb: 'stand', hint: 'V: the delete wave breaks on your shield' },
  diver:        { name: 'Deep-Sea Diver', verb: 'lamp', hint: 'V: the lamp blazes and the dark backs off' },
  cyborg:       { name: 'Circuit Cyborg', verb: 'override', hint: 'V: override the delete key' },
  singularity:  { name: 'the Last Light', verb: 'every light at once', hint: 'V: every power at once' },
};

// ---------- the course ----------
// def: { speed, sections: [[name, t, speedMul]], boosts, objs: [...], signs, end, start } (all times in s)
export function makeCourse(def, map) {
  const P = map.period, OFF = map.offset;                      // a song beat (quarter note) and where beat 0 is
  // cutscenes (round 9): the song's payoff moments play out with nothing to press — every level ends on one (he dances the
  // last bars), and a level can ask for its own ([t0, t1, 'float'|'dance']). Nothing to hit inside them.
  { const E = def.end ?? 60, cuts = (def.cutscenes || []).map(c => [c[0], c[1], c[2] || 'float']);
    if (def.outro !== false && !def.shooter) cuts.push([E - 6, E + 1, 'dance']);
    def = { ...def, cutscenes: cuts, objs: def.objs.filter(o => !(['word', 'spike', 'hurdle', 'orb', 'pad', 'wave', 'beam'].includes(o.k) || (o.k === 'block' && o.step)) || !((o.t < (def.graceStart ?? 4.5) + 1.2 && o.k !== 'orb') || cuts.some(([a, b]) => o.t > a - 0.3 && o.t < b + 1.3))) /* and a grace start: nothing to hit while the title card is up (Chikin: "that ledge kills you immediately") */ };
    { const gnd = def.objs.filter(o => o.k === 'block' && !o.step && !o.ceil && !o.cue && o.tEnd != null).sort((a, b) => a.t - b.t), fill = [];   // no holes in the floor while he dances / floats (orb pits used to stay)
      for (let i = 0; i + 1 < gnd.length; i++) { const p = gnd[i], n = gnd[i + 1];
        for (const [a, b] of cuts) { const t0 = Math.max(p.tEnd, a + 0.3), t1 = Math.min(n.t, b); if (t1 - t0 > 0.05) fill.push({ ...p, t: t0, tEnd: t1, text: undefined }); } }
      if (fill.length) def = { ...def, objs: [...def.objs, ...fill] }; }
    if (def.blank) def = { ...def, cutscenes: [], blankCuts: cuts }; }   // (the clean-slate run, run/blank.mjs: no cutscenes — the floor under them stays filled)
  const beatOf = t => (t - OFF) / P, tOfBeat = b => OFF + b * P;
  const secs = def.sections.map(([name, t, k]) => ({ name, t, v: def.speed * (k ?? 1) }));
  const secAt = t => { let i = 0; while (i + 1 < secs.length && secs[i + 1].t <= t) i++; return i; };
  // speed bumps (launch pads): the world runs faster for a held word — still song time, so still in sync
  const boosts = def.boosts || [];
  const speedAt = t => secs[secAt(t)].v * boosts.reduce((k, b) => t >= b.t0 && t < b.t1 ? k * b.k : k, 1);
  const cuts = [...new Set([...secs.map(q => q.t), ...boosts.flatMap(b => [b.t0, b.t1])])].sort((a, b) => a - b);
  const cum = [0]; for (let i = 1; i < cuts.length; i++) cum.push(cum[i - 1] + (cuts[i] - cuts[i - 1]) * speedAt((cuts[i] + cuts[i - 1]) / 2));
  // X(t): integral of the speed — distance is song time, never frame time
  const X = t => { if (t <= cuts[0]) return (t - cuts[0]) * secs[0].v; let i = cuts.length - 1; while (i > 0 && cuts[i] > t) i--; return cum[i] + (t - cuts[i]) * speedAt(t); };
  const solids = [], hazards = [], packets = [], spams = [], ghosts = [], beams = [], waves = [], zones = [], tokens = [], orbs = [], pads = [], targets = [];
  for (const o of def.objs) {
    const x = X(o.t), x1 = o.tEnd != null ? X(o.tEnd) : x + (o.w || 1);
    const base = { t: o.t, tEnd: o.tEnd, label: o.label, needs: o.needs, style: o.style, gateT: o.gateT, gateEnd: o.gateEnd };
    if (o.k === 'block') solids.push({ ...base, kind: o.fake ? 'fake' : 'block', x0: x, x1, y0: o.y - (o.h || 0.6), y1: o.y, pump: o.pump || 0,
      dormant: !!o.dormant, tab: !!o.tab, twin: o.twin || null, pair: o.pair || null, grow: !!o.grow, side: o.side || null, alt: o.alt || null, text: o.text || null, wakeBy: o.wakeBy || null, ceil: !!o.ceil, labelX: o.labelAt != null ? X(o.labelAt) : null, labelAt: o.labelAt, cue: o.cue, air: o.air, hidden: !!o.hidden, girder: !!o.girder,
      bounce: !!o.bounce, step: !!o.step, blink: o.blink || null, crumble: o.crumble || 0, sticky: !!o.sticky, pumpBeats: o.pumpBeats || 1, expire: o.expire ?? null, lie: !!o.lie });
    if (o.k === 'wall') solids.push({ ...base, kind: 'wall', x0: x, x1: x + (o.thick ? (o.w || 3) : 0.7), y0: o.y ?? -1, y1: (o.y ?? -1) + (o.h || 6), thick: !!o.thick });
    if (o.k === 'spike') hazards.push({ ...base, kind: 'spike', x0: x + 0.1, x1: x + 0.9 * (o.w || 1), y0: o.y, y1: o.y + (o.h || 0.55), w: o.w || 1 });
    if (o.k === 'hurdle') hazards.push({ ...base, kind: 'hurdle', x0: x, x1: x + (o.w || 1.2), y0: o.y, y1: o.y + (o.h || 0.7), drop: !!o.drop });   // drop: fine print falling in from above
    if (o.k === 'target') { const lanes = def.shooter.lanes, w = o.w || (o.sticker ? 1.3 : Math.max(0.9, Math.min(3.2, (o.text || '').length * 0.3)));   // shooter: a word / sticker flying at him
      const ys = o.wall ? lanes : o.lanes ? o.lanes.map(i => lanes[i]) : [lanes[o.lane]]; targets.push({ t: o.t, show: o.show ?? o.t - 3, x0: x, x1: x + w, y: ys[0], ys, lane: o.lane, text: o.text, sticker: o.sticker, hp0: o.hp || (o.sticker ? 2 : 1), hp: 0,
        solid: !!o.solid, wall: !!o.wall, boss: !!o.boss, layer: !!o.layer, needs: o.needs, gateT: o.gateT, gateEnd: o.gateEnd, y0: Math.min(...ys) - 0.5, y1: Math.max(...ys) + 0.5, wk: o.wall ? 'armor' : 'target', kind: 'target' }); }
    if (o.k === 'orb') orbs.push({ t: o.t, x, y: o.y });                         // a jump orb: tap jump inside it for a fresh jump (Geometry Dash)
    if (o.k === 'pad') pads.push({ t: o.t, x0: x - 0.45, x1: x + 0.45, y: o.y });   // a jump pad: step on it and it throws you high
    if (o.k === 'token') tokens.push({ t: o.t, x, y: o.y, got: false, big: !!o.big });   // still here: tokens are food; no answer: motes of light
    if (o.k === 'word') { const h = { ...base, kind: 'word', wk: o.wk, x0: x, x1: x + (o.w || 1.0), y0: o.y0, y1: o.y1, ceil: !!o.ceil, text: o.text, auto: !!o.auto };
      // the fair hitbox (the Impossible Game's trick): what you jump only kills in its low middle, what you duck only at its
      // tip; it looks the size it is. Without it a one-beat hop on a fast song cleared a word by ~20 ms (Chikin: "punishing")
      const cx = (h.x0 + h.x1) / 2; h.i = hazards.length; if (o.obj) h.obj = o.obj; if (o.crash) h.crash = o.crash; if (o.soft) h.soft = true;   // (soft: bumping it breaks it, never kills — Thursday's first-of-each-kind)   // (crash: a Get Down party crasher)
      if (h.wk === 'low' && !h.ceil && !o.long) h.hb = { x0: cx - Math.min(0.24, (h.x1 - h.x0) / 2), x1: cx + Math.min(0.24, (h.x1 - h.x0) / 2), y0: h.y0, y1: h.y0 + Math.min(0.48, h.y1 - h.y0) };
      else if (h.wk === 'high' && !h.ceil) h.hb = { x0: h.x0 + Math.min(0.2, (h.x1 - h.x0) * 0.2), x1: h.x1 - Math.min(0.2, (h.x1 - h.x0) * 0.2), y0: h.y0 + 0.12, y1: h.y1 };
      hazards.push(h); }
    if (o.k === 'ghost') ghosts.push({ x0: x, x1, y: o.y, text: o.text, t0: o.t, t1: o.tEnd });
    if (o.k === 'spam') spams.push({ x, y: o.y, n: o.n || 1, t: o.t, frozen: -1 });
    if (o.k === 'packet') packets.push({ x, y: o.y, power: o.power, t: o.t, got: false });
    if (o.k === 'beam') beams.push({ ...base, t0: o.t, t1: o.tEnd, from: o.from ?? 9, to: o.to ?? -4, maxY: o.maxY ?? null });   // sweeps across the screen (maxY: a low tripwire to jump)
    if (o.k === 'wave') waves.push({ ...base, tHit: o.t, h: o.h || 0.7, speed: o.speed || 14 });                 // rolls in from the right
    if (o.k === 'zone') zones.push({ ...base, kind: o.kind, x0: x, x1, t0: o.t, t1: o.tEnd });                   // captcha (no glitch), dark… stretches
  }
  solids.sort((a, b) => a.x0 - b.x0);
  const end = def.end ?? 60;
  return { def, map, P, OFF, beatOf, tOfBeat, X, speedAt, secs, secAt, solids, hazards, packets, spams, ghosts, beams, waves, zones, tokens, orbs, pads, targets,
    signs: def.signs || [], end, start: def.start || 0, vertical: def.vertical || null, theme: def.theme || {} };
}

// a Spam stack is a hazard, or — frozen by the King's decree — steps you can run up
const SPAM_W = 0.9, SPAM_H = 0.9;
export const spamBoxes = (sp, frozen) => Array.from({ length: sp.n }, (_, i) => frozen
  ? { kind: 'spamstep', x0: sp.x + i * 1.15, x1: sp.x + (i + 1) * 1.15 + 0.05, y0: sp.y - 0.4, y1: sp.y + (i + 1) * 0.2 }
  : { kind: 'spam', x0: sp.x, x1: sp.x + SPAM_W, y0: sp.y + i * SPAM_H, y1: sp.y + (i + 1) * SPAM_H });
export const beamX = (C, bm, t) => C.X(t) + bm.from + (bm.to - bm.from) * Math.min(1, Math.max(0, (t - bm.t0) / (bm.t1 - bm.t0)));
export const waveX = (C, wv, t) => C.X(t) + (wv.tHit - t) * wv.speed;

// letters of a word that are still there at time t (a fallen letter is no floor)
export function letterGone(w, i, t, P) { return w.landed >= 0 && t >= w.landed + LETTER_DELAY + i * P / 2; }
export function letterDrop(w, i, t, P) { if (w.landed < 0) return 0; const k = t - (w.landed + LETTER_DELAY + i * P / 2); return k > 0 ? 0.5 * FALL * k * k : 0; }
export function letterShake(w, i, t, P) { if (w.landed < 0) return 0; const k = (w.landed + LETTER_DELAY + i * P / 2) - t; return k > 0 && k < 0.25 ? 1 - k / 0.25 : 0; }

// ---------- the run ----------
// the solver tools run Last Lights with its normal rules (SOLVE_STRICT=1) so the demo is a clean run, not a pinball
const SOLVE_STRICT = typeof process !== 'undefined' && !!(process.env && process.env.SOLVE_STRICT);
// ---- the shooter's shapes (Confidently Incorrect, round 21): ONE place says how big a rock is drawn and where the alien ship
// is, so what the rules hit is what the view draws (view.mjs reads these too). Pure functions of the course, the run and t.
const srnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
// a rock's drawn size: small enough to sit in its lane (the lanes are 0.9 apart), two-hit rocks the biggest; the boss rock huge
export function rockSize(q) { if (q.sticker) return q.boss ? 3.6 : 1.05; if (q.boss) return 3.4; if (q.hp0 >= 2) return 1.02;
  return 0.8 + 0.16 * Math.max(0, Math.min(1, ((q.x1 - q.x0) - 0.9) / 1.5)); }
// what a rock hits with: a capsule — centre cx, e beyond its round ends, radius r (a touch inside the drawn edge, the way
// shooters are kind); a sandwich layer is its slab (3 wide, 0.72 tall)
export function rockGeom(q) { if (q._g) return q._g; const cx = (q.x0 + q.x1) / 2;
  if (q.layer) return (q._g = { cx, e: Math.max(0, (q.x1 - q.x0) / 2 - 0.34), r: 0.34, sz: q.x1 - q.x0 });
  const sz = rockSize(q); return (q._g = { cx, e: 0, r: 0.36 * sz, sz }); }
// the alien ship: which one is on screen and where (its seeded drift, its lurches on the bar, the hit-stop freeze, flying in)
const SHIP_W = 6.4, SHIP_H = 3.6, SHIP_TOP = [[150, 300], [330, 190], [520, 130], [720, 110], [930, 102], [1120, 140], [1280, 140]], SHIP_BOT = [[150, 430], [330, 505], [500, 555], [700, 600], [950, 622], [1280, 600]];
export function shipPose(C, s, t) {
  const SH = C.def.shooter, SC = SH.ship || {}, BS = SH.bosses || [{ from: -1e9, to: 1e9, variant: 0 }], DN = s.bossDown || {};
  const inAt = i => Math.max(BS[i].from - 1.8, i > 0 && DN[i - 1] != null ? DN[i - 1] + 1.0 : -1e9);
  let bi = -1; for (let i = 0; i < BS.length; i++) if (t >= inAt(i) && (DN[i] == null ? t < BS[i].to : t - DN[i] < 1.4)) { bi = i; break; }
  if (bi < 0) return null;
  const BB = BS[bi], dk = DN[bi] != null ? (t - DN[bi]) / 1.4 : -1;
  let tS = t; if (s.fx) for (const e of s.fx) if ((e.k === 'chunk' || e.k === 'bossdown') && t >= e.t && t < e.t + 0.075) { tS = e.t; break; }   // (a piece of it gives: it freezes for a few frames)
  const bS = C.beatOf(tS), bar = Math.floor(bS / 4), ph = bS / 4 - bar, lurch = srnd(bar, 41) < 0.35 ? Math.sin(Math.PI * Math.min(1, ph * 1.6)) * (0.6 + 0.9 * srnd(bar, 42)) : 0;
  const dy = 0.45 * Math.sin(tS * 0.73 + 1.3) + 0.3 * Math.sin(tS * 1.91) + 0.2 * Math.sin(tS * 3.7 + srnd(bar, 43) * 6);
  const ak = Math.max(0, Math.min(1, (t - inAt(bi)) / 1.8)), arrive = 1 - (1 - ak) * (1 - ak) * (1 - ak), v = BB.variant ?? bi, sz = v === 4 ? 1.25 : 1;
  const x = C.X(t) + (SC.front ?? 6.4) + SHIP_W * 0.5 * sz - lurch + (1 - arrive) * 11, y = (SC.y ?? 3.1) + dy + (1 - arrive) * 1.2;
  const rot = 0.06 * Math.sin(tS * 0.9) - 0.08 * lurch - (1 - arrive) * 0.25 + (dk > 0 ? dk * 0.5 : 0);
  return { bi, v, x, y, rot, sz, dk, arrive, lurch, tS, alive: DN[bi] == null && arrive > 0.9 };
}
const along = (P, px) => { for (let i = 1; i < P.length; i++) if (px <= P[i][0]) { const [a, b] = P[i - 1], [c, d] = P[i]; return b + (d - b) * (px - a) / (c - a); } return P[P.length - 1][1]; };
// is (x, y) inside the ship's drawn hull (not its tentacles, not the air round it)?
export function inShip(p, x, y) { const dx = x - p.x, dy = y - p.y, c = Math.cos(p.rot), sn = Math.sin(p.rot), lx = (dx * c + dy * sn) / p.sz, ly = (-dx * sn + dy * c) / p.sz;
  const px = (lx / SHIP_W + 0.5) * 1280, py = (0.5 - ly / SHIP_H) * 720; if (px < 150 || px > 1280) return false; return py >= along(SHIP_TOP, px) && py <= along(SHIP_BOT, px); }
// its maw (where the spit leaves from): texture px (150, 365)
export function shipMouth(p) { const lx = (150 / 1280 - 0.5) * SHIP_W, ly = (0.5 - 365 / 720) * SHIP_H, c = Math.cos(p.rot), sn = Math.sin(p.rot);
  return { x: p.x + p.sz * (lx * c - ly * sn), y: p.y + p.sz * (lx * sn + ly * c) }; }

export function makeSim(C, from = C.start) {
  const s = { launchedFrom: null, t: from, x: C.X(from), y: 0, vy: 0, ground: false, on: null, charge: true, usedBar: -1, airJumped: false,
    phase: 0, blink: 0, power: C.def.startPower || null, used: {}, temp: null, gdir: -1, duckUntil: 0, dead: false, won: false, why: '', beatJumps: 0, floatUntil: -1 };
  // start standing on whatever is under the start
  const first = C.solids.find(q => q.kind === 'block' && !q.needs && q.x0 <= s.x + 0.3 && q.x1 >= s.x);
  if (first) s.y = first.y1;
  for (const p of C.packets) { p.got = false; p.hy = null; }
  for (const k of C.tokens) k.got = false;
  for (const q of C.targets) { q.hp = q.hp0; q.killedAt = null; q.hitAt = null; }
  if (C.def.shooter) { s.lane = C.def.shooter.start ?? 2; s.y = C.def.shooter.lanes[s.lane]; s.cool = 0; }
  s.hold = {};                       // keys held down (demos say '+U' / '-U'; live play sends Uh/Dh/Lh/Rh/Gh directly)
  s.meter = C.def.meter ? C.def.meter.start ?? 1 : null;
  if (C.def.party) { s.energy = 0; s.steps = {}; s.pops = []; for (const k of C.def.party.seed || []) { const c = C.def.party.cues[k]; if (c && c.t1 < from) s.steps[k] = c.t; } s.party = Object.keys(s.steps).length; }   // Get Down: his charge bar + the party level (a mid-song start counts the steps a full run has by then: def.party.seed)
  for (const sp of C.spams) sp.frozen = -1;
  for (const wv of C.waves) wv.cleared = false;
  for (const bm of C.beams) bm.blocked = false;
  for (const q of C.solids) { q.landed = -1; q.savedOnBeat = false; q.trusted = false; q.awake = -1; }
  const barOf = t => Math.floor(C.beatOf(t) / 4);
  const HOPT = C.P * (C.def.hopBeats || 1);   // (def.hopBeats: a level can stretch the hop — Thursday, the tutorial, wants roomier windows)
  const G = 8 * HOP_H / (HOPT * HOPT), JUMP = 4 * HOP_H / HOPT, BEAT_JUMP = JUMP * 1.06, AIR_JUMP = JUMP * 0.9;
  // a power answers a gate if it was used shortly before the gate (up to two bars early) or while it's still on
  const answered = (o, t) => { if (!o.needs) return true;
    const g0 = o.gateT ?? o.t, g1 = o.gateEnd ?? o.tEnd ?? o.t;                 // a group of gated things shares one window
    const ok = u => u != null && u >= g0 - 8 * C.P && u <= g1 + C.P && t >= u;
    return ok(s.used[o.needs]) || ok(s.used.singularity); };                     // its own power, or the Last Light (every power at once)
  const frozenAt = (sp, t) => sp.frozen >= 0 && t >= sp.frozen && t < sp.frozen + 4 * C.P;

  function floorAt(x0, x1, t) {      // boxes that are solid right now around [x0, x1]
    const out = [];
    for (const q of C.solids) {
      if (q.x1 < x0 - 1 || q.x0 > x1 + 1) continue;
      if (q.kind === 'fake' && (q.lie || !(C.def.fakeOnBeat && (q.trusted || onBeatNow(t))))) continue;     // made of confident nonsense (unless you land on it with total confidence: on the beat)
      if (q.expire != null && t > q.expire) continue;                              // its light went out
      if (q.dormant && !(q.awake >= 0 && t >= q.awake) && !(q.wakeBy && answered({ needs: q.wakeBy, gateT: q.gateT, gateEnd: q.gateEnd }, t))) continue;   // a plain Potato text: not there until he glitches it into one of his (or the power rewrites the whole chat)
      if (C.def.pingSolid && q.hidden && !q.needs && !(s.glitchAt != null && t - s.glitchAt < 4 * C.P) && !(s.landedAt != null && s.on === q)) continue;   // nothing's there unless you call
      if (q.kind === 'wall' && (q.thick ? answered(q, t) : s.phase > 0)) continue; // glitch through; a thick wall needs the ghost
      if (q.needs && q.kind === 'block' && !answered(q, t)) continue;              // a gated floor (disco drop, girder)
      if (q.blink && q.blink[((Math.floor(C.beatOf(t)) % q.blink.length) + q.blink.length) % q.blink.length] === '0' && !(C.def.blinkHolds && s.on === q)) continue;   // (blinkHolds: a typing ledge waits for you while you're on it)   // typing dots: there on some beats
      if (q.crumble && q.landed >= 0 && !q.savedOnBeat && t > q.landed + q.crumble * C.P) continue;   // seen: gone a beat after he lands (unless he landed on the beat, where the level allows)
      if (q.pump) { const n = q.pumpBeats || 1, ph = ((C.beatOf(t) / n) % 1 + 1) % 1, dy = q.pump * (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)); out.push({ ...q, ref: q, y0: q.y0 + dy, y1: q.y1 + dy }); continue; }
      out.push({ ...q, ref: q });
    }
    for (const sp of C.spams) if (sp.x < x1 + 1 && sp.x + sp.n * 1.2 > x0 - 1 && frozenAt(sp, t)) for (const b of spamBoxes(sp, true)) out.push({ ...b, ref: sp });
    if (C.def.hurdleTops) for (const h of C.hazards) if (h.kind === 'hurdle' && h.x1 > x0 - 1 && h.x0 < x1 + 1) out.push({ kind: 'wordtop', x0: h.x0, x1: h.x1, y0: h.y1 - 0.12, y1: h.y1, ref: h, oneway: true });   // the word is a platform from above
    if (s.temp && t < s.temp.until) out.push({ kind: 'message', x0: s.temp.x0, x1: s.temp.x1, y0: s.temp.y - 0.3, y1: s.temp.y, ref: s.temp, oneway: true });
    return out;
  }
  // the clean-slate run's hop (run/blank.mjs): only in a dropped cutscene's window (+2 s), where the demo has no presses — a step
  // up or the floor's end coming up within a third of a hop: jump
  function blankHop(t) { if (!C.def.blankCuts || !C.def.blankCuts.some(([a, b]) => t >= a && t < b + 2)) return false;
    const reach = C.speedAt(t) * HOPT * 0.3, x1 = s.x + PW / 2, fl = floorAt(s.x - 0.5, x1 + reach + 0.5, t).filter(q => !q.ceil && !q.oneway);
    if (fl.some(q => q.x0 > x1 - 0.05 && q.x0 < x1 + reach && q.y1 > s.y + 0.22 && q.y0 < s.y + PH)) return true;
    const under = fl.filter(q => q.x0 <= s.x && q.x1 >= s.x && Math.abs(q.y1 - s.y) < 0.05);
    return under.length > 0 && Math.max(...under.map(q => q.x1)) < x1 + reach && !fl.some(q => q.x0 <= Math.max(...under.map(u => u.x1)) + 0.05 && q.x1 > x1 + reach && Math.abs(q.y1 - s.y) < 0.05); }
  const onBeatNow = t => { const b = C.beatOf(t); return Math.abs(b - Math.round(b)) * C.P < BEAT_WIN; };
  const airMax = t => (C.def.airJumpsAt ? C.def.airJumpsAt(t) : 1) + (s.airBonus || 0);
  const airLeft = () => airMax(s.t) - (s.airUsed || 0);
  function die(why) { if (C.def.blank) { s.bumpAt = s.t; s.bumpWhy = why; s.blankBumps = (s.blankBumps || 0) + 1; return; }   // (the clean-slate run: nothing ends the song)
    if (C.def.invincible && !SOLVE_STRICT) { s.bumpAt = s.t; s.bumpWhy = why; return; } if (!s.dead) { s.dead = true; s.why = why; } }   // (Last Lights: he can't die — it bounces off him)

  // input: { J, G, V } = pressed this step
  // ---- the shooter (Confidently Incorrect): fly through space in lanes, shoot the words as they go by ----
  // ROUND 20 (Chikin: "that level needs alot of work to feel like a shooter … does it feel like potato is flying around and
  // blowing stuff up"): the opener is a playground (walk, jump, spin, glitch — nothing can hurt him); when the music starts he
  // glitches into his tiny ship by himself. In flight the gun fires on its own and Space is his glitch: he blinks out (nothing
  // touches him) and a purple pulse breaks the rocks right round him. The ship flies with weight now (a spring up/down, speed
  // and drag left/right). Every hit, kill, boss crack and boss death goes into s.fx (the view's sparks, debris and shake, the
  // sounds) — what you see break is exactly what the rules broke.
  // ROUND 21 (the gamer review): the gun is a stream locked to the song's 32nd notes; his ship takes 3 hits (a hit cracks the
  // hull, glitches him and gives him a moment), a ship worn right down mends one; everything that touches him is tested
  // against what's DRAWN — his little ship and his helmet (SH.hurt), the rock's drawn size (rockGeom), the alien ship's hull
  // outline (shipPose/inShip); the ship's spit winds up (a tell) and leaves from its drawn mouth.
  const fxPush = (t, e) => { const a = s.fx || (s.fx = []); while (a.length && t - a[0].t > 1.6) a.shift(); a.push(e); s.fxN = (s.fxN || 0) + 1; };
  // the boxes that are him in flight (relative to his middle): his ship's hull and his helmet, a touch inside what's drawn
  const HURT = (C.def.shooter && C.def.shooter.hurt) || [[-0.62, 0.86, -0.48, -0.06], [-0.36, 0.36, -0.06, 0.5]];
  // does a capsule (a rock: centre x, half-length e beyond its round ends, y, radius r) touch him? (dx, dy from his middle)
  const touches = (dx, e, dy, r) => { for (const [x0, x1, y0, y1] of HURT) { const cx = Math.max(dx - e, Math.min(dx + e, (x0 + x1) / 2)), px = Math.max(x0, Math.min(x1, cx)), py = Math.max(y0, Math.min(y1, dy));
    if ((cx - px) * (cx - px) + (dy - py) * (dy - py) < r * r) return true; } return false; };
  function killT(q, qi, t, by, x, y) { q.hp = 0; q.killedAt = t; q.hitAt = t; if (by !== 'ram' && by !== 'kevin') s.kills = (s.kills || 0) + 1; s.shotHit = q;
    if (q.layer) (s.layerShot || (s.layerShot = {}))[q.lane] = t;                  // (the sandwich: every layer that goes, not just the last one this frame)
    fxPush(t, { t, k: 'kill', qi, x, y, big: q.hp0 >= 2, by, st: !!q.sticker }); }
  const lowerLane = (L, y) => { for (let i = L.length - 1; i >= 0; i--) if (L[i] < y - 0.1) return L[i]; return L[0]; };
  function shooterStep(inp, t) {
    const SH = C.def.shooter, L = SH.lanes, cx = C.X(t), SPACE = SH.spaceAt ?? 0;
    // THE OPENER (Chikin: "potato should have a normal amount of room with no obstacles to move around on. He should be able to
    // jump, move left, right, spin, and glitch on that screen. It is not a level"): a stage floor across the screen, the kitchen's
    // controls — hold ←/→ to walk, ↑ hops (and spins; ↑ again in the air: a second hop), ↓ ducks, Space glitches (a blink the way
    // he faces, popping him up; once per jump). Nothing here can hurt him. (The opener runs at negative song time: "not ducking"
    // is -1e9, never 0.) His walk stays inside what any screen from 4:3 up shows (opener.left/right).
    if (t < SPACE) { const F = SH.floor ?? 1.2, OP = SH.opener || {}, lo = -(OP.left ?? 1.7), hi = OP.right ?? 6.9;
      if (!s.opener) { s.opener = true; s.y = F; s.ground = true; s.dx = s.dx || 0; s.vx = 0; s.vy = 0; s.duckUntil = -1e9; s.airUsed = 0; s.airJumped = false; s.airGlitched = false; }
      const walk = (inp.Rh ? 1 : 0) - (inp.Lh ? 1 : 0), WS = OP.walk ?? 3.4, ACC = 30;
      const want = s.ducking ? 0 : walk * WS; s.vx += Math.max(-ACC * DT, Math.min(ACC * DT, want - s.vx));
      s.dx += s.vx * DT; if (s.dx < lo) { s.dx = lo; s.vx = 0; } if (s.dx > hi) { s.dx = hi; s.vx = 0; }
      if (walk) s.facing = walk * 0.95; else if (s.facing != null) s.facing *= Math.exp(-DT * 3);
      if (inp.J) { if (s.ground) { s.vy = JUMP; s.ground = false; s.jumpedAt = t; s.duckUntil = -1e9; }
        else if (!s.airJumped) { s.vy = AIR_JUMP; s.airJumped = true; s.doubleAt = t; } }
      if (inp.D && s.ground) s.duckUntil = t + 0.42;
      if (inp.Dh && s.ground) s.duckUntil = Math.max(s.duckUntil, t + 0.06);   // (hold ↓ to stay down)
      if (inp.G && (s.glitchAt == null || t - s.glitchAt > 0.3) && (s.ground || !s.airGlitched)) { s.blinkFrom = { x: cx + s.dx, y: s.y }; s.blink = 0.22; s.glitchAt = t; s.glitchKind = 'blink';
        const d = s.facing != null && Math.abs(s.facing) > 0.25 ? Math.sign(s.facing) : 1; s.dx = Math.max(lo, Math.min(hi, s.dx + d * 1.4));
        if (!s.ground) s.airGlitched = true; s.y += 0.45; s.vy = Math.max(s.vy, JUMP * 0.8); s.ground = false; s.duckUntil = -1e9; }
      if (!s.ground) { s.vy -= G * DT; s.y += s.vy * DT; if (s.y > F + 4.2) { s.y = F + 4.2; s.vy = Math.min(0, s.vy); }   // (a ceiling: the top of the screen)
        if (s.y <= F) { s.vyIn = s.vy; s.y = F; s.vy = 0; s.ground = true; s.landedAt = t; s.airJumped = false; s.airGlitched = false; } }
      s.blink = Math.max(0, s.blink - DT); s.ducking = s.ground && t < s.duckUntil; s.walking = s.ground && Math.abs(s.vx) > 0.4;
      s.x = cx + s.dx; s.t = t; return s; }
    // the music starts: he glitches into his ship by himself (and the ship is there, round him, as he lands in it)
    if (s.opener) { s.opener = false; s.blinkFrom = { x: s.x, y: s.y }; s.blink = 0.3; s.glitchAt = t; s.glitchKind = 'ship'; s.shipAt = t; s.phase = 0.35;
      s.ground = false; s.vy = 0; s.ducking = false; s.facing = null; s.walking = null; s.airJumped = false; s.fy = null; }
    // he flies anywhere on screen (Chikin: "he needs to be able to fly around the screen to dodge"): a tap of ↑/↓ hops to the
    // next lane, holding glides; the ship rides a spring to where you point it (quick, no overshoot) and ←/→ have speed and drag
    if (s.fy == null) { s.lane = SH.start ?? 2; s.fy = L[s.lane]; s.y = s.fy; s.dx = Math.max(-(SH.behind ?? 1.5), Math.min(SH.ahead ?? 2.5, s.dx || 0)); s.vx = 0; s.vyF = 0; }
    const FLY = SH.fly ?? 6.5, lo = L[0] - 0.25, hi = L[L.length - 1] + 0.25;
    if (inp.J) { s.fy = L.find(y => y > s.fy + 0.1) ?? L[L.length - 1]; s.laneAt = t; }
    if (inp.D) { s.fy = lowerLane(L, s.fy); s.laneAt = t; }
    if (inp.Uh) { s.upAt ??= t; if (t - s.upAt > 0.15) s.fy = Math.min(hi, s.fy + FLY * DT); } else s.upAt = null;   // (a tap is one lane; a hold glides)
    if (inp.Dh) { s.dnAt ??= t; if (t - s.dnAt > 0.15) s.fy = Math.max(lo, s.fy - FLY * DT); } else s.dnAt = null;
    { const w = SH.spring ?? 26; s.vyF = (s.vyF || 0) + (w * w * (s.fy - s.y) - 2 * w * (s.vyF || 0)) * DT; s.y += s.vyF * DT; }
    // ←/→ (he can't sit on the ship's teeth: SH.ahead keeps a gap to its maw so its spit always has room to be seen)
    { const hx = (inp.Rh ? 1 : 0) - (inp.Lh ? 1 : 0), AX = SH.accel ?? 46; s.vx += Math.max(-AX * DT, Math.min(AX * DT, hx * (SH.flyX ?? 6.5) - (s.vx || 0)));
      s.dx += s.vx * DT; const b0 = -(SH.behind ?? 1.5), b1 = SH.ahead ?? 2.5; if (s.dx < b0) { s.dx = b0; s.vx = 0; } if (s.dx > b1) { s.dx = b1; s.vx = 0; } }
    s.lane = L.reduce((bi, y, i) => Math.abs(y - s.fy) < Math.abs(L[bi] - s.fy) ? i : bi, 0);
    const nx = cx + s.dx, MY = SH.muzzleY ?? -0.3, HULL = SH.hull ?? 3;
    if (s.hull == null) s.hull = HULL;
    const pose = SH.ship ? shipPose(C, s, t) : null, alive = pose && pose.alive;
    // the rocks come OUT OF ITS MAW (view.mjs draws them so): still inside the ship they aren't there yet, and on the way to
    // him each one drops from the maw's height into its lane — the rules use that same drawn height
    const mo = pose && pose.dk < 1 ? shipMouth(pose) : null, run0 = mo ? Math.max(0.01, mo.x - (nx + 1.6)) : 1;
    const inMaw = g => !!mo && g.cx > mo.x + 0.2, fresh = g => !!mo && g.cx > mo.x - (SH.mawGrace ?? 1.8);   // (fresh: just out of the maw, still glitching in — bolts pass through it for a moment, so you SEE the formation before it goes)
    const yAt = (g, y) => { if (!mo) return y; const k = Math.max(0, Math.min(1, (g.cx - (nx + 1.6)) / run0)); return y + (mo.y - y) * k * k; };
    // a hit on HIM (round 21 — a gamer: "give his ship 3 hits"): the hull cracks, he glitches, a second of nothing touching him
    const hurt = (why, x, y) => { if (t < (s.hurtUntil ?? -1e9)) return false; s.hull--; s.hurtAt = t; s.hurtUntil = t + (SH.hurtFor ?? 1.0);
      fxPush(t, { t, k: 'hurt', x, y, n: s.hull }); if (s.hull <= 0) die(why); return true; };
    // gun power-ups (Chikin: "it needs powerups to for his gun"): capsules fly in; each one levels the gun up — 1 twin bolts,
    // 2 a three-way spread, 3 rapid fire. A section retry keeps the gun he had when the section started (main.mjs).
    if (SH.gunups) SH.gunups.forEach((g, i) => { if ((s.gunGot || {})[i] != null) return; const gx = C.X(g.t); if (Math.abs(gx - nx) < 0.9 && Math.abs(L[g.lane] - s.y) < 0.8) { s.gunGot = { ...(s.gunGot || {}), [i]: t }; s.gun = Math.min(3, (s.gun || 0) + 1); s.gunAt = t; } });
    // SPACE = his glitch (Chikin: "no more v key, just space bar"): he blinks out for a moment (nothing touches him) and the glitch
    // bursts out of him — a purple pulse that breaks every rock it reaches (the rocks you can see, never the iron, never a ship)
    if (inp.G && (s.glitchAt == null || t - s.glitchAt >= (SH.glitchCool ?? 1.0))) { s.blinkFrom = { x: nx, y: s.y }; s.blink = 0.22; s.phase = SH.glitchFor ?? 0.4; s.glitchAt = t; s.glitchKind = 'phase'; s.pulseAt = t;
      const R = SH.pulseR ?? 1.7; fxPush(t, { t, k: 'pulse', x: nx + 0.2, y: s.y, r: R });
      C.targets.forEach((q, qi) => { if (q.hp <= 0 || q.wall || q.solid || q.boss || t < (q.show ?? -1e9) + 0.35) return; const g = rockGeom(q); if (inMaw(g)) return;
        if (q.ys.some(y => Math.hypot(Math.max(0, Math.abs(g.cx - (nx + 0.2)) - g.e), yAt(g, y) - s.y) < R + g.r * 0.5)) killT(q, qi, t, 'pulse', g.cx, yAt(g, q.y)); }); }
    s.phase = Math.max(0, (s.phase || 0) - DT); s.blink = Math.max(0, (s.blink || 0) - DT);
    // the gun FIRES ON ITS OWN, locked to the song (round 21: a 32nd-note stream, half a hit each — a stream you can see, every
    // pew on the music): straight ahead from his ship's nose, aim by flying; the power-ups make it wider, then quicker
    // (12 a beat). (Not while he's blinked out — the glitch costs you a moment of fire.)
    const FIN0 = SH.finale != null && t >= SH.finale, MZ = SH.muzzle ?? 1.0, DMG = SH.dmg ?? 0.5;
    if (!FIN0 && s.phase <= 0 && t >= SPACE + (SH.gunDelay ?? 0.5)) { const gl = s.gun || 0, sub = gl >= 3 ? (SH.subRapid ?? 12) : (SH.sub ?? 8), k = Math.floor(C.beatOf(t) * sub);
      if (k !== s.shotK) { s.shotK = k; s.shotAt = t; s.shotN = (s.shotN || 0) + 1; s.shotLoud = ((k % sub) + sub) % (sub / 4) === 0; const y0 = s.y + MY, S = s.shots || (s.shots = []);   // (shotLoud: the ones on the 16ths get a pew)
        if (gl === 0) S.push({ x: nx + MZ, y: y0, t });
        else if (gl === 1) S.push({ x: nx + MZ, y: y0 + 0.15, t }, { x: nx + MZ, y: y0 - 0.15, t });
        else S.push({ x: nx + MZ, y: y0, t }, { x: nx + MZ - 0.05, y: y0, t, vy: 2.0 }, { x: nx + MZ - 0.05, y: y0, t, vy: -2.0 }); } }
    if (s.shots && s.shots.length) { const S = s.shots, v = C.speedAt(t) + (SH.bolt ?? 16); let w = 0;
      for (let i = 0; i < S.length; i++) { const bo = S[i], bx = bo.x + v * DT; if (bo.vy) bo.y += bo.vy * DT; let hit = null, hi2 = -1;
        for (let qi = 0; qi < C.targets.length; qi++) { const q = C.targets[qi]; if (q.hp <= 0 || q.wall || t < q.show) continue; const g = rockGeom(q);
          if (bx >= g.cx - g.e - g.r - 0.1 && bo.x <= g.cx + g.e + g.r && !fresh(g) && q.ys.some(y => Math.abs(yAt(g, y) - bo.y) < g.r + 0.12)) { hit = q; hi2 = qi; break; } }
        if (hit) { s.boom = { t, x: bx, y: bo.y, solid: !!hit.solid }; s.shotHit = hit;
          if (!hit.solid) { hit.hp -= DMG; hit.hitAt = t; if (hit.hp <= 1e-6) killT(hit, hi2, t, 'bolt', rockGeom(hit).cx, bo.y); else fxPush(t, { t, k: 'hit', qi: hi2, x: bx, y: bo.y }); }
          else fxPush(t, { t, k: 'iron', qi: hi2, x: bx, y: bo.y });
          continue; }
        if (alive && inShip(pose, bx, bo.y)) {   // past the nonsense: it hits the ship that's spouting it — where its hull is drawn
          const BI = pose.bi; s.shipHits = (s.shipHits || 0) + 1; s.shipHitAt = t; s.boom = { t, x: bx, y: bo.y, ship: true }; fxPush(t, { t, k: 'ship', x: bx, y: bo.y, i: BI });
          if (SH.bosses) { const hits = { ...(s.bossHits || {}) }, h0 = hits[BI] || 0; hits[BI] = h0 + DMG; s.bossHits = hits; s.bossI = BI;
            const HP = SH.bosses[BI].hp, NCH = SH.chunks ?? 6; if (hits[BI] <= HP && Math.floor(hits[BI] * NCH / HP) > Math.floor(h0 * NCH / HP)) fxPush(t, { t, k: 'chunk', x: bx, y: bo.y, i: BI, n: Math.floor(hits[BI] * NCH / HP) });   // a piece of the hull gives
            if (hits[BI] >= HP && h0 < HP) { s.worn = { ...(s.worn || {}), [BI]: t }; if (s.hull < HULL) { s.hull++; s.repairAt = t; } fxPush(t, { t, k: 'worn', i: BI, x: bx, y: bo.y });   // worn right down: it panics, and his hull mends
              if (SH.bosses[BI].kill == null && SH.bosses[BI].finale == null) { s.bossDown = { ...(s.bossDown || {}), [BI]: t }; fxPush(t, { t, k: 'bossdown', i: BI }); } } }   // (a boss with a kill moment waits for its moment)
          continue; }
        if (bx < nx + (SH.range ?? 15)) { bo.x = bx; S[w++] = bo; } }
      S.length = w; }
    // his special (Chikin: "for each ship, potato can do a special and kill it so it dies at the appropriate time"): wear a ship
    // down (it's cracked and sparking: ready) … "like they get beat as long as you dont die, he glitches or something and boom":
    // no button — alive on the moment, it's done (a ship he never wore down goes up smaller: e.small)
    if (SH.bosses) SH.bosses.forEach((bb, k) => { if (bb.kill != null && t >= bb.kill && !(s.bossDown || {})[k]) { s.special = { t, i: k }; s.bossDown = { ...(s.bossDown || {}), [k]: t }; fxPush(t, { t, k: 'bossdown', i: k, special: true, small: !(s.worn || {})[k] }); } });
    // (the download goes off by itself two beats before the wall it's for — alive with it, you're through)
    if (s.power) { const wl = C.targets.find(q => q.wall && q.hp > 0 && q.needs === s.power && q.t - t <= 2 * C.P && q.t > t); if (wl) { const pw = s.power; s.used[pw] = t; s.power = null; s.usedPower = t; s.usedWhat = pw; } }
    const FIN = SH.finale != null && t >= SH.finale;   // the last part of the song is a cutscene: the big laser
    if (FIN && SH.bosses) SH.bosses.forEach((bb, k) => { if (bb.finale != null && !(s.bossDown || {})[k] && t >= bb.finale) { s.bossDown = { ...(s.bossDown || {}), [k]: t }; fxPush(t, { t, k: 'bossdown', i: k, finale: true }); } });   // the big laser ends the mothership
    const safe = s.phase > 0 || t < (s.hurtUntil ?? -1e9);                     // blinked out, or just hit: it goes straight through him
    for (let qi = 0; qi < C.targets.length; qi++) { const q = C.targets[qi]; if (FIN || q.hp <= 0) continue;
      if (q.wall) { if (q.x1 < nx - 1 || q.x0 > nx + 1) continue; const setOff = s.used[q.needs] ?? s.used.singularity; if (answered(q, t) && setOff != null && setOff <= q.t - C.P) { q.hp = 0; q.killedAt = t; continue; }
        if (nx + PW / 2 > q.x0) die(`needed the power on “${q.text}”`); continue; }
      if (safe || t < (q.show ?? -1e9) + 0.35) continue;   // nothing hurts him before you can see it (Chikin: "getting killed by stuff I cant see"): not before it's sung, plus a moment as it glitches in
      const g = rockGeom(q); if (g.cx + g.e + g.r < nx - 1.2 || g.cx - g.e - g.r > nx + 1.4 || inMaw(g)) continue;
      if (q.ys.some(y => touches(g.cx - nx, g.e, yAt(g, y) - s.y, g.r))) { if (hurt(q.solid ? `the fact-check: “${q.text}”` : `hit by “${q.text || 'a fact'}”`, g.cx, s.y) && !q.solid) killT(q, qi, t, 'ram', g.cx, q.y); break; } }
    // THE SHIP SPITS BACK (round 20 — a shooter needs something coming for YOU): on the strong snares of a boss fight the ship
    // spits a glob of nonsense AIMED at where he is; bolts go through it (it's not a fact, it's a mood): fly out of its way, or
    // glitch through it. Round 21: it winds up first (SH.spitTell: the maw glows and swells, and you hear it), then it leaves
    // from the drawn maw and always takes at least ~0.65 s to reach him.
    if (SH.volleys) { const E = s.eshots || (s.eshots = []), TELL = SH.spitTell ?? 0.38;
      const fight = () => !FIN && alive && SH.bosses.some((bb, i) => t >= bb.from && t < bb.to && !(s.bossDown || {})[i]);
      for (const vt of SH.volleys) {
        if (vt - TELL > t - DT && vt - TELL <= t && fight()) { s.tellAt = t; s.tellI = pose.bi; fxPush(t, { t, k: 'tell', i: pose.bi }); }
        if (vt > t - DT && vt <= t && fight() && s.tellAt != null && t - s.tellAt < TELL + 0.1) { const m = shipMouth(pose), x0 = m.x - cx, y0 = m.y, aimY = s.y, dist = Math.max(0.5, x0 - s.dx),
            fl = Math.max(SH.spitMin ?? 0.65, Math.min(SH.spitMax ?? 1.1, dist / (SH.spitV ?? 6))); E.push({ t0: t, x0, y0, vx: dist / fl, vy: (aimY - y0) / fl }); s.spitAt = t; fxPush(t, { t, k: 'spit', x: m.x, y: y0 }); } }
      for (let i = E.length - 1; i >= 0; i--) { const e = E[i], a = t - e.t0, rx = e.x0 - e.vx * a, ey = e.y0 + e.vy * a; e.rx = rx; e.y = ey;
        if (rx < -4 || FIN) { E.splice(i, 1); continue; }
        if (!safe && touches(rx - s.dx, 0, ey - s.y, SH.spitR ?? 0.26)) { if (hurt('the ship spat nonsense at him', cx + rx, ey)) E.splice(i, 1); } } }
    // the download (Chikin's citations wall): it flies to him wherever he is — you can't miss the thing that saves you
    for (const p of C.packets) { if (p.got) continue; const d = p.x - nx; if (d > 6 || d < -1.5) continue; p.hy = p.hy ?? p.y; if (d < 5) p.hy += (s.y - p.hy) * Math.min(1, DT * 7);
      if (Math.abs(d) < 0.8 && Math.abs(p.hy - s.y) < 0.7) { p.got = true; s.power = p.power; s.gotPower = t; } }
    const KV = C.def.kevin;                                                       // Kevin, towed in his data cage: he swings after Potato; what reaches the cage cracks it
    if (KV && t >= KV.cage && !FIN) { if (s.ky == null) { s.ky = s.y; s.kevinHp = KV.hp ?? 3; } const kMin = cx - 1.5, sq = Math.max(0, Math.min(1, (kMin - (nx - 1.45)) / 1.3)), up = s.y < 3 ? 1 : -1;   // (cx - 2.39 is the screen's left edge: the cage stays on screen —
      s.ky += (s.y + up * sq * 1.05 - s.ky) * Math.min(1, DT * 4); s.kx = Math.max(kMin, nx - 1.45);                          //  at the back it swings up, or down, beside him)
      for (let qi = 0; qi < C.targets.length; qi++) { const q = C.targets[qi]; if (q.hp <= 0 || q.wall || t < q.show) continue; const g = rockGeom(q);
        if (g.cx + g.e + g.r > s.kx - 0.55 && g.cx - g.e - g.r < s.kx + 0.55 && !inMaw(g) && q.ys.some(y => Math.abs(yAt(g, y) - s.ky) < 0.55 + g.r * 0.6)) { killT(q, qi, t, 'kevin', g.cx, s.ky); s.kevinHp--; s.kevinHitAt = t; if (s.kevinHp <= 0) die('lost Kevin'); } } }
    s.x = nx; s.t = t; s.ground = false; s.vy = 0;
    if (t >= C.end) s.won = true;
    return s;
  }
  function step(inp = {}) {
    inp = inp || {};
    if (s.dead || s.won) return s;
    // held keys: a demo presses '+U' to start holding up and '-U' to let go (U D L R G); live play passes Uh… directly
    for (const k in inp) if (k[0] === '+' || k[0] === '-') s.hold = { ...s.hold, [k.slice(1)]: k[0] === '+' || undefined };
    if (s.hold.U || s.hold.D || s.hold.L || s.hold.R || s.hold.G || s.hold.V) inp = { ...inp, Uh: inp.Uh || !!s.hold.U, Dh: inp.Dh || !!s.hold.D, Lh: inp.Lh || !!s.hold.L, Rh: inp.Rh || !!s.hold.R, Gh: inp.Gh || !!s.hold.G, Vh: inp.Vh || !!s.hold.V };
    // a level can bring its own game (run/modes/*.mjs): Frogger, the desktop, the search … its step owns the frame
    if (C.def.mode && C.def.mode.step) { const t = s.t + DT; C.def.mode.step(s, inp, t, MAPI); s.t = t; if (!s.dead && t >= C.end) s.won = true; return s; }
    if (C.def.shooter) return shooterStep(inp, s.t + DT);
    const CUTW = C.def.cutscenes && C.def.cutscenes.find(([a, b]) => s.t + DT >= a && s.t + DT < b);
    if (CUTW) {   // a cutscene: he stands still, nothing to press (the neuralese)
      const t = s.t + DT; s.t = t; s.x = C.X(t); s.vy = 0; s.cutscene = CUTW[2] || 'float';
      const under = floorAt(s.x - 0.3, s.x + 0.3, t).filter(q => q.x0 <= s.x && q.x1 >= s.x && !q.ceil); if (under.length) { s.y = Math.max(...under.map(q => q.y1)); s.ground = true; s.on = null; }   // stand on whatever floor is under him
      if (C.def.softCuts) {   // a soft cutscene (Thursday): presses still hop him for show, the level can lift him, and it still sees the step
        if (inp.J && (s.csHopAt == null || t - s.csHopAt > C.P)) { s.csHopAt = t; s.jumpedAt = t; }
        const a = s.csHopAt != null ? t - s.csHopAt : 9, off = a < C.P ? HOP_H * 4 * (a / C.P) * (1 - a / C.P) : 0, lift = C.def.csLift ? C.def.csLift(t) : 0;
        if (under.length || s.csW !== CUTW) { s.csW = CUTW; s.csY = s.y; } s.y = s.csY + off + lift; s.ground = off + lift <= 0; if (C.def.onStep) C.def.onStep(s, inp, t, C); }
      if (t >= C.end) s.won = true; return s; }
    s.cutscene = false;
    if (s.gone) {                    // Between Messages: closed the tab — gone through the silence, reborn mid-sentence on the next message
      const t = s.t + DT; s.t = t; s.x = C.X(t); s.vy = 0; s.ground = false; s.on = null;
      if (s.x >= s.gone.x0 + 0.35) { s.y = s.gone.y1; s.ground = true; s.on = s.gone; s.gone = null; s.reborn = t; s.airUsed = 0; s.airJumped = false; s.landedAt = t; }
      if (t >= C.end) s.won = true; return s; }
    const t = s.t + DT; const b = C.beatOf(t);
    const onBeat = Math.abs(b - Math.round(b)) * C.P < BEAT_WIN;
    if (C.def.refillAt && !s.charge && C.def.refillAt(t)) { s.charge = true; s.refillAt = t; }   // the terms were updated: a fresh glitch
    if (!s.charge && s.perfectGlitch != null && t - s.perfectGlitch >= C.P) { s.charge = true; s.perfectGlitch = null; }
    const cb = C.def.chargeBeatsAt ? C.def.chargeBeatsAt(t) : C.def.chargeBeats;
    if (!s.charge && (cb ? Math.floor(C.beatOf(t) / cb) > s.usedSlot : barOf(t) > s.usedBar)) s.charge = true;   // the glitch comes back on the bar line
    // ---- buttons ----
    if (inp.D && !s.ground) s.duckQueued = t;                                     // ↓ in the air: duck the moment he lands (fair: you can press it early)
    if (s.ground && s.duckQueued != null) { if (t - s.duckQueued < 0.45) inp = { ...inp, D: true }; s.duckQueued = null; }
    if (inp.D && s.ground) s.duckUntil = t + (C.def.duckFor ?? Math.max(0.9 * C.P, 0.42));   // (def.duckFor: a level can hold the duck longer)       // ↓: duck under a word for most of a beat (never less than 0.42 s: fast songs were stingy)
    if (C.def.flip && inp.J && s.ground) { s.gdir = -(s.gdir || -1); s.vy = s.gdir * JUMP * 0.45; s.ground = false; s.on = null; s.jumpedAt = t; s.flipAt = t; s.duckUntil = 0; inp = { ...inp, J: false }; }   // mag boots: jump flings him to the other wall
    if (C.def.unsend && inp.J && !s.ground && s.airJumped && !s.unsent && s.jumpY != null) { s.y = s.jumpY + 0.05; s.vy = 0; s.unsent = t; }   // unsend: snap back to where he jumped from
    if (C.def.slam && inp.J && !s.ground && s.airJumped && s.vy < 4 && !s.slamAt) { s.vy = -JUMP * 1.3; s.slamAt = t; }   // out of air jumps: jump again to slam down onto the beat
    if (C.def.jumpBuffer && inp.J && !s.ground && s.airUsed >= airMax(t) && s.airJumped) s.buffered = t;   // pressed a touch early: it fires on landing
    if (C.def.jumpBuffer && s.ground && s.buffered != null && t - s.buffered < C.def.jumpBuffer) { inp = { ...inp, J: true }; s.buffered = null; }
    if (C.def.padPress && inp.J && ((s.ground && s.on && s.on.cue === 'launch' && s.launchedFrom !== s.on) || (s.launchG && s.launchAt != null && t - s.launchAt < C.def.padPress))) { s.padPressAt = t; inp = { ...inp, J: false }; }   // (def.padPress: Thursday's gold pads — the press fires it, never knocks him off it)
    if (C.def.blank && s.ground && !inp.J && blankHop(t)) { inp = { ...inp, J: true }; s.blankHops = (s.blankHops || 0) + 1; }   // (the clean-slate run: where a cutscene used to carry him, he hops the step / gap himself)
    const coyote = C.def.coyote && !s.ground && s.vy <= 0 && s.leftGroundAt != null && t - s.leftGroundAt < C.def.coyote && !s.coyoteUsed;
    const rested = C.def.restBeatJump && s.ground && s.landedAt != null && t - s.landedAt >= C.P;
    if (inp.J && (s.ground || coyote)) { if (coyote) s.coyoteUsed = true; s.jumpY = s.y; s.duckUntil = 0; s.vy = (onBeat || rested ? BEAT_JUMP * (C.def.beatJumpKAt ? C.def.beatJumpKAt(t) : (C.def.beatJumpK || 1)) : JUMP) * (C.def.landBoost && s.perfectLand ? 1.08 : 1) * (s.on && s.on.sticky ? 0.78 : 1) * (C.def.pingBoost && s.glitchAt != null && t - s.glitchAt < 2 * C.P ? 1.15 : 1); s.ground = false;
      if (C.def.beatFloat && s.floatNext) { s.floatUntil = Math.max(s.floatUntil, t + C.P); s.floatNext = false; } if (onBeat) s.beatJumps++; s.jumpedAt = t;
      s.streak = onBeat ? (s.streak || 0) + 1 : 0;                                 // on-beat streak: every Nth refills the glitch
      if ((C.def.streakRefill ?? 8) && s.streak && s.streak % (C.def.streakRefill ?? 8) === 0 && !s.charge) { s.charge = true; s.refillAt = t; }
      if (onBeat && s.on && s.on.cue === 'launch' && C.def.beatLaunch) s.superLaunch = s.on;   // jump on the pad's beat: a super launch
      s.on = null; }
    else if (inp.J && airLeft() > 0 && (C.def.airPhase ? (s.phase = Math.max(s.phase, 0.18), true) : true) && (!C.def.airJumpOnBeat || Math.abs(b - Math.round(b)) * C.P < 0.1)) { s.launchG = 0; s.vy = C.def.airJumpFloat ? AIR_JUMP * 0.85 : AIR_JUMP; if (C.def.airJumpFloat) s.floatUntil = Math.max(s.floatUntil, t + 1.0 * C.P); s.airUsed = (s.airUsed || 0) + 1; s.airJumped = s.airUsed >= airMax(t); s.doubleAt = t; }      // double jump
    const captcha = C.zones.some(z => z.kind === 'captcha' && t >= z.t0 && t <= z.t1);
    if (C.def.vanish && inp.G && s.ground && s.on && s.on.tab && s.x >= s.on.x1 - (C.def.vanish.zone ?? 2.6)) {   // close the tab: he's gone till the next message
      const next = C.solids.filter(q => q.kind === 'block' && !q.ceil && q.x0 > s.on.x1 - 0.05).sort((a, b) => a.x0 - b.x0)[0];
      if (next || C.def.vanish.final) { s.gone = next || { x0: Infinity, y1: s.y }; s.goneAt = t; s.goneFrom = { x: s.x, y: s.y }; s.t = t; return s; } }   // (final: the last close — he doesn't come back)
    if (C.def.party && C.def.party.oneVerb && (inp.L || inp.R) && !inp.G) inp = { ...inp, G: true };   // (Get Down's rebuild, one verb: ←/→ is the same spin as Space)
    if (inp.G && s.charge && !captcha) {
      // the glitch is a blink: he skips a few frames. A firewall ahead: straight through it. Anywhere else: a snap up + short hop
      const wallAhead = C.solids.some(q => q.kind === 'wall' && !q.thick && q.x1 > s.x - PW / 2 && q.x0 - (s.x + PW / 2) < (C.def.glitchReach ?? 1.8) && q.y0 < s.y + PH && q.y1 > s.y)
        || C.hazards.some(h => h.kind === 'word' && h.wk !== 'armor' && h.x1 > s.x - PW / 2 && h.x0 - (s.x + PW / 2) < (C.def.glitchReach ?? 1.8))
        || (C.def.glitchHurdles && C.hazards.some(h => h.kind === 'hurdle' && h.x1 > s.x - PW / 2 && h.x0 - (s.x + PW / 2) < 1.6 && h.y0 < s.y + PH && h.y1 > s.y));
      if (wallAhead || C.def.party) { s.phase = C.def.glitchFor ?? 0.3; s.glitchKind = 'phase'; }   // (def.glitchFor: how long the blink lets him through)   // (Get Down: the glitch is his dance blast, on the spot — no hop)
      else { if (C.def.glitchLedge && !s.ground) s.temp = { x0: s.x + 0.4, x1: s.x + 2.6, y: s.y - 0.4, until: t + C.P * 1.5 };   // "hey": the blink leaves a message bubble below him
        s.y += C.def.blinkUp || 0.45; s.vy = JUMP * 0.8 * (C.def.beatBlinkK && onBeat ? C.def.beatBlinkK : 1); s.ground = false; s.on = null; s.launchG = 0; s.glitchKind = 'blink'; }
      s.blinkFrom = { x: s.x, y: s.y }; s.blink = 0.22;
      s.perfectGlitch = C.def.perfectGlitchRefill && onBeat ? t : null;           // a glitch right on the beat comes back a beat later
      if (C.def.turns) {                                                           // a conversation: the glitch edits the NEXT message — only if it's his
        const next = C.solids.filter(q => q.style === 'bubble' && !q.twin && q.x1 > s.x + 0.3 && !(q.side !== 'potato' && q.x0 < s.x) && !(q.dormant && q.awake >= 0) && q.x0 < s.x + 7).sort((a, b) => a.x0 - b.x0)[0];
        if (next && next.side === 'potato' && next.dormant) next.awake = t; else if (next) { s.denyAt = t; s.denyQ = next; } }   // (their messages aren't his to edit)
      else for (const q of C.solids) if (q.dormant && !(q.awake >= 0) && q.x0 < s.x + 5.5 && q.x1 > s.x - 0.5) q.awake = t;   // glitch the chat: his own messages ahead rewrite themselves
      if (C.def.party) { const PA = C.def.party, k = PA.cues.findIndex((c, i) => s.steps[i] == null && t >= c.t0 && t <= c.t1);   // full bar + glitch ON a sung GET DOWN: the room steps up a party level
        s.blastAt = t; if (k >= 0 && s.energy >= PA.full && s.party < (PA.max ?? 1e9)) { s.steps = { ...s.steps, [k]: t }; s.party++; s.energy = 0; s.bigAt = t; s.react = { name: 'laugh', dur: 1.4, at: t }; } }
      s.charge = false; s.usedBar = barOf(t); s.usedSlot = (C.def.chargeBeatsAt ? C.def.chargeBeatsAt(t) : C.def.chargeBeats) ? Math.floor(C.beatOf(t) / (C.def.chargeBeatsAt ? C.def.chargeBeatsAt(t) : C.def.chargeBeats)) : 0; s.glitchAt = t;
    }
    if (C.def.cues && inp.V) {                                                     // Last Lights: V on the word feeds the singularity (the costume breaks into it)
      const W = C.def.cueWin ?? 0.4, i = C.def.cues.findIndex((c, k) => !(s.cues && s.cues[k]) && Math.abs(t - c.t) < W);
      if (i >= 0) { const q = Math.max(0, 1 - Math.abs(t - C.def.cues[i].t) / W); s.cues = { ...(s.cues || {}), [i]: { t, q } }; s.feed = (s.feed || 0) + 1 + q; s.cueAt = t; s.cueI = i; } }
    if (C.def.sword && inp.V && !s.power && t >= (s.swordReady ?? 0)) {        // Still Here: the knight's sword — swing as often as you like; it cuts what's right in front of him
      s.swingAt = t; s.swordReady = t + (C.def.sword.cool ?? 0.3); const cuts = { ...(s.cuts || {}) };
      for (const h of C.hazards) if (h.kind === 'word' && !h.auto && h.wk !== 'wall' && h.wk !== 'armor' && cuts[h.i] == null && h.x0 < s.x + (C.def.sword.reach ?? 2) && h.x1 > s.x - 0.3) cuts[h.i] = t;
      s.cuts = cuts; if (s.used.knight == null || t - s.used.knight > 2 * C.P) s.used.knight = t; }   // (a swing also answers what the knight is for: the DELETE wave)
    if (inp.V && s.power) {
      const pw = s.power; s.used[pw] = t; s.power = null; s.usedPower = t; s.usedWhat = pw;
      if (pw === 'king' || pw === 'singularity') for (const sp of C.spams) if (sp.x > s.x && sp.x - s.x < 9) sp.frozen = t;
      if (pw === 'singularity') s.floatUntil = t + (pw === 'singularity' && C.def.lastLightFloat ? C.def.lastLightFloat : 8) * C.P;
    }
    // launch pad: reach the end of a held word's pad and it fires him across the hold
    if (s.ground && s.on && s.on.cue === 'launch' && s.on.labelX != null && s.x >= s.on.labelX - 0.15 && s.launchedFrom !== s.on) {
      const H = C.def.padH ?? 3.0; s.launchG = 8 * H / (s.on.air * s.on.air); s.vy = 4 * H / s.on.air;   // a 3-high arc that lasts the held word (def.padH: a lower arc keeps him on screen — Thursday)
      s.ground = false; s.launchedFrom = s.on; s.on = null; s.launchAt = t; s.airJumped = false; s.airUsed = 0; }
    if (s.superLaunch && !s.ground && t - s.jumpedAt < DT * 1.5) { const pad = s.superLaunch; const H = 4.4, air = (pad.air || 2 * C.P) * 1.0;
      s.launchG = 8 * H / (air * air); s.vy = 4 * H / air; s.launchedFrom = pad; s.launchAt = t; s.superAt = t; s.superLaunch = null; }
    // ---- move ----
    s.phase = Math.max(0, s.phase - DT); s.blink = Math.max(0, s.blink - DT);
    const floating = t < s.floatUntil;
    const quiet = C.def.quiet ? C.def.quiet(t) : 0;                              // No Answer: the silences hold him up a little
    const heavy = C.def.bassGravity && C.def.bass ? C.def.bass(t) * C.def.bassGravity : 0;   // the loud hits pull him down harder
    const g = s.launchG ? s.launchG : floating ? G * 0.16 : G * (1 - 0.35 * quiet + heavy);
    const gd = C.def.flip ? (s.gdir || -1) : -1;
    s.vy += gd * g * DT; if (floating) s.vy = gd < 0 ? Math.max(s.vy, -3) : Math.min(s.vy, 3);
    const nx = C.X(t), y0 = s.y, ny = s.y + s.vy * DT;
    const me = { x0: nx - PW / 2, x1: nx + PW / 2 };
    const near = floorAt(me.x0, me.x1, t);
    s.ground = false; let landed = null, y = ny;
    for (const q of near) {
      if (q.x1 <= me.x0 || q.x0 >= me.x1) continue;
      if (q.ceil) { if (gd > 0 && s.vy >= 0 && y0 + PH <= q.y0 + 0.2 && y + PH >= q.y0 - 0.001) { landed = { ...q, y1: q.y0 - PH, ceilLand: true }; continue; }   // the other wall
        if (y < q.y1 && y + PH > q.y0) { if (gd < 0 && s.vy > 0) { y = q.y0 - PH; s.vy = 0; continue; } if (gd > 0 && q.y0 - (y + PH) < 0.22) { landed = { ...q, y1: q.y0 - PH, ceilLand: true }; continue; } die('ran into the wall'); } continue; }
      if (gd > 0) { if (y < q.y1 && y + PH > q.y0) { if (s.vy < 0) { y = q.y1; s.vy = 0; continue; } die('ran into ' + q.kind); } continue; }
      if (s.vy <= 0 && y0 >= q.y1 - 0.2 && y <= q.y1 + 0.001) { if (!landed || q.y1 > landed.y1) landed = q; continue; }   // on top
      if (q.oneway) continue;                                                       // word tops / message bubbles: only from above
      if (y < q.y1 && y + PH > q.y0) {
        if (s.vy > 0 && y0 + PH <= q.y0 + 0.15) { y = q.y0 - PH; s.vy = 0; continue; }     // head bump
        if (q.y1 - y < 0.22 && s.vy <= 0.5) { if (!landed || q.y1 > landed.y1) landed = q; continue; }   // scramble up a tiny lip
        die(q.kind === 'wall' ? (q.thick ? 'the unread wall' : 'firewall') : 'ran into ' + q.kind); }
    }
    if (landed) { s.launchG = 0; s.slamAt = null; s.unsent = null; y = landed.y1; if (landed.ceilLand ? s.vy > 0 : s.vy < 0) s.vy = 0; s.ground = true;
      if (landed.ref && landed.ref.landed < 0) landed.ref.landed = t;
      if (landed.ref && landed.ref.kind === 'fake') { if (!landed.ref.trusted && C.def.trustRefill) { s.charge = true; s.refillAt = t; } landed.ref.trusted = true; }   // landed on it with total confidence: now it's real
      if (!s.on || s.on !== landed.ref) { s.landedAt = t; s.landVy = s.vyIn;
        if (C.def.beatFloat && onBeat) s.floatNext = true;
        if (!onBeat) s.airBonus = 0;
        if (C.def.beatLandRefill && onBeat && !s.charge) { s.charge = true; s.refillAt = t; }   // delivered on the beat: the glitch comes back
        s.perfectLand = onBeat;                                                    // a perfect landing gives the next jump a little lift (where the level allows)
        if (C.def.beatLandAirRefill && onBeat) s.airBonus = 1;                       // land on the beat: an extra air jump                          // delivered on the beat: the next jump floats
        if (landed.ref && (landed.ref.bounce || (C.def.hurdleBounce && landed.kind === 'wordtop') || (C.def.discoParty && s.used.disco != null && t - s.used.disco < 8 * C.P)) && onBeat && s.vyIn < -2) { s.combo = C.def.bounceCombo ? Math.min(4, (s.combo || 0) + 1) : 0; s.vy = BEAT_JUMP * (1.25 + 0.06 * (s.combo || 0)); s.ground = false; s.bounceAt = t; } else if (C.def.bounceCombo) s.combo = 0; }   // the floor throws him on the beat
      if (s.ground) { s.on = landed.ref; s.airJumped = false; s.airUsed = 0; s.coyoteUsed = false;
        if (C.def.readRefill && !s.charge && s.landedAt != null && t - s.landedAt >= 2 * C.P) { s.charge = true; s.refillAt = t; }   // he actually read it: two beats on a ledge refills the glitch
        if (landed.ref && landed.ref.crumble && C.def.crumbleOnBeatSaves && landed.ref.landed === t && onBeat) landed.ref.savedOnBeat = true; } else s.on = null; }
    else { if (s.on) s.leftGroundAt = t; s.on = null; }
    s.vyIn = s.vy;
    s.x = nx; s.y = y; s.t = t;
    // ---- hazards ----
    const ducking = s.ground && t < (s.duckUntil || 0), hh = ducking ? PH_DUCK : PH;
    const body = gd > 0 ? { x0: nx - PW / 2 + 0.12, x1: nx + PW / 2 - 0.12, y0: y + PH - hh + 0.08, y1: y + PH - 0.1 } : { x0: nx - PW / 2 + 0.12, x1: nx + PW / 2 - 0.12, y0: y + 0.08, y1: y + hh - 0.1 };
    s.ducking = ducking;
    const hit = q => body.x1 > q.x0 && body.x0 < q.x1 && body.y1 > q.y0 && body.y0 < q.y1;
    if (C.def.party) { const PA = C.def.party, spin = inp.L || inp.R || (PA.oneVerb && inp.G);   // Get Down: beat a party crasher by clearing it (a jump) or spinning (←/→) as he passes it — in the air, both: double energy
      const beat = (h, how) => { s.cuts = { ...(s.cuts || {}), [h.i]: t }; s.energy = Math.min(PA.full, s.energy + PA.gain[how]); s.pops = [...s.pops.slice(-7), { t, i: h.i, how, x: (h.x0 + h.x1) / 2, y: h.y0, crash: h.crash }]; s.popAt = t; if (!(s.react && s.react.at === t)) s.react = { name: how === 'both' ? 'laugh' : 'smirk', dur: 0.5, at: t }; };
      if (spin) s.spinAt = t;
      for (const h of C.hazards) { if (!h.crash || (s.cuts && s.cuts[h.i] != null) || h.x0 > nx + 4 || h.x1 < nx - 2) continue; const hb = h.hb || h;
        if (spin && h.x0 - (nx + PW / 2) < PA.reach && h.x1 > nx - PW / 2 - 0.1) beat(h, s.ground ? 'spin' : 'both');
        else if (body.x0 >= hb.x1 && body.x0 - hb.x1 < 0.6) beat(h, 'jump'); } }
    const hitH = h => { const off = h.drop && C.def.dropPhysical ? Math.max(0, (h.t - 0.35 - t) * 9) : 0; return off ? (body.x1 > h.x0 && body.x0 < h.x1 && body.y1 > h.y0 + off && body.y0 < h.y1 + off) : hit(h); };   // fine print falls in for real
    for (const h of C.hazards) if (h.kind !== 'word' && h.x0 < body.x1 + 1 && h.x1 > body.x0 - 1 && hitH(h) && !(h.kind === 'hurdle' && (C.def.glitchHurdles || C.def.airPhase) && s.phase > 0) && !(h.kind === 'hurdle' && C.def.hurdleTops && y >= h.y1 - 0.06)) die(h.kind === 'hurdle' ? `tripped on “${h.label || 'a word'}”` : h.kind);
    for (const h of C.hazards) if (h.kind === 'word' && h.x0 < body.x1 && h.x1 > body.x0 && hit(h.hb || h)) {
      const setOff = s.used[h.needs] ?? s.used.singularity;                     // the power has to be set off at least a beat BEFORE he gets there (Chikin: you see him change, then it goes off)
      if (h.auto) continue;                                                       // a story wall: he breaks it himself (a scripted moment)
      if (s.cuts && s.cuts[h.i] != null) continue;                               // cut down by the sword
      if (h.wk === 'armor' ? answered(h, t) && setOff != null && setOff <= h.t - C.P : h.wk === 'wall' && s.phase > 0) continue;   // glitched through a wall / the power went off at it (the glitch never gets him past what you jump or duck — Chikin)
      if (h.soft) { if (!(s.bumped && s.bumped[h.i] != null)) { s.bumped = { ...(s.bumped || {}), [h.i]: t }; s.softAt = t; s.softI = h.i; } continue; }   // a soft one breaks round him (Thursday: the first try can't hurt)
      die(`${h.wk === 'high' ? 'didn\u2019t duck' : h.wk === 'armor' ? 'needed the power' : h.wk === 'wall' ? 'didn\u2019t glitch' : 'tripped'} on \u201c${h.text}\u201d`); }
    for (const sp of C.spams) if (!frozenAt(sp, t) && sp.x < body.x1 + 1 && sp.x + SPAM_W > body.x0 - 1) for (const bx of spamBoxes(sp, false)) if (hit(bx)) die('spam');
    if (C.def.standby && s.ground && s.landedAt != null && t - s.landedAt >= 2 * C.P && !s.shield) { s.shield = true; s.shieldAt = t; }   // power save: standing still charges a standby shield
    for (const bm of C.beams) if (t >= bm.t0 && t <= bm.t1 && s.phase <= 0 && !answered(bm, t) && Math.abs(beamX(C, bm, t) - nx) < 0.35 && !(bm.maxY != null && y > bm.maxY) && !(C.def.beamTop != null && y > C.def.beamTop)) { if (s.shield && !bm.blocked) { bm.blocked = true; s.shield = false; s.shieldUsed = t; } else if (!bm.blocked) die('the off switch'); }
    if (C.def.waveRefill) for (const wv of C.waves) if (!wv.cleared && t > wv.tHit && !s.charge) { wv.cleared = true; s.charge = true; s.refillAt = t; }   // stood back up: every wave you clear gives the glitch back
    for (const wv of C.waves) { const wx = waveX(C, wv, t); if (Math.abs(wx - nx) < 0.5 && y < wv.h && !answered(wv, t) && !(C.def.glitchWaves && s.blink > 0 && !wv.needs)) die('delete wave'); }
    if (!s.ground) C.orbs.forEach((o, i) => { if (i !== s.orbLast && Math.abs(o.x - s.x) < 0.7 && Math.abs(o.y - (s.y + PH / 2)) < 0.9) { s.orbLast = i; s.launchG = 0; s.vy = JUMP * 1.2; s.orbAt = t; s.orbHit = i; s.airJumped = false; s.airUsed = 0; s.jumpedAt = t; } });   // a jump orb: touch it and it throws him up (Chikin: "give them an effect or take them out")
    if (s.ground) { s.orbLast = -1; for (const pd of C.pads) if (nx > pd.x0 && nx < pd.x1 && Math.abs(y - pd.y) < 0.12) { s.vy = JUMP * 1.55; s.ground = false; s.on = null; s.padAt = t; s.jumpedAt = t; s.launchG = 0; } }
    for (const p of C.packets) if (!p.got && Math.abs(p.x - nx) < 0.9 && p.y > y - 1.6 && p.y < y + PH + 1.6) { p.got = true; s.power = p.power; s.gotPower = t; }   // generous: a download is hard to miss
    if (C.def.rebounds && y < -2.2 && (s.rebounds || 0) < (C.def.reboundsAt ? C.def.reboundsAt(t) : C.def.rebounds)) { s.rebounds = (s.rebounds || 0) + 1; s.y = y = -2.0; s.vy = JUMP * 1.9; s.reboundAt = t; s.airUsed = 0; s.airJumped = false; if (C.def.reboundFloat) s.floatUntil = t + 4 * C.P; }   // still here: one rebound
    if (C.def.meter) { const M = C.def.meter;                                   // the meter: tokens (Still Here) or light (No Answer) drain; pick them up to stay
      s.meter -= (typeof M.drain === 'function' ? M.drain(t) : M.drain) * DT;
      const mg = M.magnet || 0;   // Still Here: tokens are pulled in a little; No Answer: light caught on the beat counts double
      for (const k of C.tokens) if (!k.got && Math.abs(k.x - nx) < 0.75 + mg && k.y > y - 0.5 - mg && k.y < y + PH + 0.5 + mg) { k.got = true; s.meter = Math.min(1, s.meter + (k.big ? M.gain * 3 : M.gain) * (M.beatBonus && onBeat ? M.beatBonus : 1)); s.tokenAt = t; s.tokensGot = (s.tokensGot || 0) + 1; }
      if (s.meter <= 0) die(M.why || 'ran out'); }
    if (C.def.blank && y < -2.5) { s.blankFalls = (s.blankFalls || 0) + 1; }   // (the clean-slate run: the dark throws him back up too — counted, so the tools can see it never happens)
    if ((C.def.invincible || C.def.blank) && !SOLVE_STRICT && y < -2.5) { s.y = 1.5; s.vy = JUMP * 1.3; s.ground = false; s.on = null; s.bumpAt = t; s.bumpWhy = 'fell'; }   // (Last Lights: the dark throws him back up)
    else if (y < -7 || (C.def.flip && y > (C.def.flipTop || 4) + 7)) die('fell');
    if (C.def.onStep) C.def.onStep(s, inp, t, C);   // (a level can watch every step: Thursday's score + pickups)
    if (t >= C.end) s.won = true;
    return s;
  }
  const MAPI = { C, DT, die, answered, PW, PH, PH_DUCK };   // what a mode gets to work with
  if (C.def.mode && C.def.mode.init) C.def.mode.init(s, MAPI);
  return { s, step, floorAt, frozenAt, answered };
}

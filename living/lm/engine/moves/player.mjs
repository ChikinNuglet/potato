// player.mjs — the animator's moves: plays data/moves.json on the engineer's engine. Character animator (seat 2), Build round.
// Carried from One Overshoot (the data, the rules) and from the engineer's moves-placeholder.mjs (the hang, the air, the down
// and the get-up are his code, kept, with a face put on them).
//
// Layers, bottom to top (moves.json "blend.layers"):
//   base      by who owns him: stand · hang · air · down · get_up            exactly one
//   clip      one keyed move from moves.json; replaces the channels it keys     at most one, queued
//   always-on breath, blink, eyes, weight shift, brow twitch, sigh              never stop (a clip may quiet them)
//   carry     a slow offset under all of it after a big hit                     flags.carry
//   brace     he leans a hair away from a hand that has thrown him              flags.brace   (BOLD CHOICE, this seat)
// It only ever sets TARGETS (channels.set) and asks for inertial blends (channels.blend). Nothing here writes a value.
//
// For the brain (BUILD-PLAN section 3):  play(id, move, opts) -> { done, phase, cancel() } · look(id, target, { hold_f }) ·
//   lookAfter(id, thing, { hold_f, then }) · walkTo(id, x, { gait }) · carriage(id, moods) · has(move) · list() · current(p)
// With no brain loaded the host inputs (zapped, fed, squished, exploded, poked) and the bench's { type: 'play', move } are answered here.
// ROUND 3 (this seat, carried from One Overshoot and His Own Pixels): the notes in NOTES-DIRECTOR / NOTES-COMEDY / NOTES-POTATO.
//   the look after is a CLIP now (lookThing / lookYou): it starts inside the gag and moves.busy() is true until it has held its count
//   PINK: glitch is 0 or 0.8 and up, never between · THE WINK: the late lid is never more than 2 frames late · HE KNOWS: upside down, he stares
//   every `round 3` comment below names the note it answers.
import { IDX } from '../channels.mjs';
import { MODE } from '../body.mjs';
import { makeTrack, evalTrack, capMap, EASE } from './tracks.mjs';
import { EXPRS } from './face.mjs';

const TAU = Math.PI * 2, io = EASE.io;
const BODY = ['sy', 'sx', 'roll', 'pitch', 'shear', 'dy', 'dx'], FACE = ['lidL', 'lidR', 'gx', 'gy', 'browL', 'browR', 'jaw'];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function createMoves(ctx) {
  const { data, clock, rng, channels: ch, body, room, rig, emit, TAG, senses } = ctx;
  const D = data.moves, MV = D.moves, AO = D.always_on, J = data.physics, FLAGS = D.flags || {}, CARRY = D.carry || {}, BRACE = D.brace || {};
  const A = body.A, cap = J.squash.cap, deep = !!J.squash.clips_may_exceed_cap, HG = J.hang || { stretch_base: 0.07, stretch_per_speed: 0.012, blend_f: 4 }, RT = J.root || {};
  const SPR = D.rig.springs, BF = D.blend.blend_f.by_channel, G = J.body.gravity;
  const springFor = n => { const k = n.startsWith('lid') ? 'lid' : n.startsWith('brow') ? 'brow' : n === 'gx' || n === 'gy' ? 'gaze' : n === 'sx' ? 'sy' : n; const s = SPR[k] || SPR.sy; return { omega: s.omega, zeta: s.zeta, slew: k === 'sy' ? s.slew_cap_per_f : 0 }; };
  const st = [];
  const V = {};                                       // this step's targets for one Potato (reused)

  // ------------------------------------------------------------------ small helpers
  const tagC = slot => ctx.tag(slot, TAG.contact);
  function blend(slot, names, scale = 1, fixed = null) { for (const n of names) ch.blend(slot, [IDX[n]], fixed != null ? fixed : Math.max(1, Math.round((BF[n] == null ? 12 : BF[n]) * scale))); }
  function unwind(slot) { const n = Math.round(body.th[slot] / TAU); if (n) { body.th[slot] -= n * TAU; ch.shift(slot, IDX.roll, -n * TAU); } }
  function gazeAt(s, slot, tx, ty) {                  // where his pupils go to look at a point in the room. He cannot look right of home: that is 0.
    const dx = tx - body.x[slot], dy = ty - (body.y[slot] + 0.12);
    return [clamp(-0.5 + dx * 0.3, -1, 0), clamp(-dy * 0.16, -0.3, 0.5)]; }
  function pointOf(s, slot, target) {
    if (target == null || target === 'home') return null;
    if (target === 'user' || target === 'cursor' || target === 'you') { const c = senses.cursor; return c.seen && !c.gone ? [c.x, c.y] : [body.x[slot] - 0.01, body.y[slot] + 0.12]; }
    if (typeof target === 'object') return [target.x, target.y == null ? body.y[slot] : target.y];
    const o = ctx.potatoes.find(q => q.id === target || q.slot === target); return o ? [body.x[o.slot], body.y[o.slot] + 0.1] : null; }
  function carryNow(s) { const c = s.carry; if (!c || !FLAGS.carry) return 0; const u = (clock.k - c.k0) / c.fadeF; if (u >= 1) { s.carry = null; return 0; } return c.amt * (u < 0.33 ? 1 : 1 - io((u - 0.33) / 0.67)); }
  function addCarry(s, amount, side, twitchy) { if (!FLAGS.carry) return; const fs = CARRY.fade_s || [20, 40];
    s.carry = { amt: Math.min(1, (carryNow(s) || 0) + amount), side: side || (s.carry && s.carry.side) || (s.rnd() < 0.5 ? -1 : 1), k0: clock.k, fadeF: Math.round(rng.range(s.rnd, fs[0], fs[1]) * 60), twitchy: !!twitchy }; }

  // ------------------------------------------------------------------ always-on: breath, blink, eyes, weight shift
  function newBreath(s) { const r = s.rnd; s.bLen = Math.round(rng.range(r, AO.breath.period_f[0], AO.breath.period_f[1])); s.bDepth = rng.range(r, AO.breath.depth[0], AO.breath.depth[1]); s.bRest = Math.round(s.bLen * rng.range(r, 0, 0.25)); s.bF = 0;
    let peak = clock.k + Math.round(0.42 * s.bLen); if (s.lastPeak != null && Math.abs((peak - s.lastPeak) - s.lastGap) < 5) { s.bLen += 14; peak = clock.k + Math.round(0.42 * s.bLen); }
    if (s.lastPeak != null) s.lastGap = peak - s.lastPeak; s.lastPeak = peak; }
  function breath(s) { if (s.bF >= s.bLen + s.bRest) newBreath(s); const f = s.bF++, a = 0.42 * s.bLen; return f < a ? io(f / a) : f < s.bLen ? 1 - io((f - a) / (s.bLen - a)) : 0; }

  // a layer = a few tracks played on top (blink, glance, wince, weight shift, sigh). Values are offsets from rest.
  function layer(s, id, tracks, opts = {}) { const L = { id, f: opts.from == null ? 0 : opts.from, len: opts.len, T: [], keep: opts.keep, rate: opts.rate || 1, on: opts.on };
    for (const n in tracks) L.T.push(makeTrack(n, tracks[n], opts.vars || s.vars, springFor(n)));
    if (L.len == null) { L.len = 0; for (const t of L.T) L.len = Math.max(L.len, t.K[t.K.length - 1].f + (t.K[t.K.length - 1].e === 'spring' ? 14 : 0)); }
    s.layers.push(L); return L; }
  function scheduleBlink(s, soon) { const e = AO.blink.every_s; let gap = Math.round(rng.range(s.rnd, e[0], e[1]) * 60); if (soon != null) gap = soon;
    if (s.lastBlinkGap != null && Math.abs(gap - s.lastBlinkGap) < 8) gap += 17;                // never the same gap twice (not a screensaver, as arithmetic)
    s.lastBlinkGap = gap; s.blinkAt = clock.k + gap; }
  function blinkNow(s, kind) {
    const B = AO.blink, lag = Math.min(2, B.normal.lid_lag_f + ((CARRY.at_amount_1 && CARRY.at_amount_1.lid_lag_f) || 0) * carryNow(s)); /* round 3 (THE WINK): a wince is both lids, one at most 2 f behind */                              // carry: the slow lid is slower still
    if (kind === 'slow') { const m = MV.slow_blink.tracks; layer(s, 'slow_blink', { lidR: m.lidR, lidL: m.lidL, sy: m.sy }); s.gazeHold = { gx: -0.5, gy: 0, until: clock.k + 47 + Math.round(rng.range(s.rnd, 30, 60)) }; return; }
    if (kind === 'half') { layer(s, 'blink', { lidR: [[0, 0], [3, B.half.to, 'in'], [9, 0, 'out']], lidL: [[lag, 0], [3 + lag, B.half.to, 'in'], [9 + lag, 0, 'out']] }); return; }
    const m = MV.blink.tracks; layer(s, 'blink', { lidR: m.lidR, lidL: [[lag, 0], [3 + lag, 1, 'in'], [4.5 + lag, 1, 'lin'], [9 + lag, 0, 'out']], browR: m.browR });
    if (kind === 'double') clock.after(10 + B.double.gap_f, () => { if (st.includes(s)) layer(s, 'blink', { lidR: m.lidR, lidL: m.lidL }); });
  }
  function alwaysOn(s, slot, quiet, eyesFree) {
    const k = clock.k, B = AO.blink;
    if (quiet < 0.5 && k >= s.blinkAt && !s.noBlinkUntil && s.mode !== MODE.free) { const r = s.rnd(); blinkNow(s, r < B.slow.chance && !s.clip ? 'slow' : r < B.slow.chance + B.half.chance ? 'half' : r < B.slow.chance + B.half.chance + B.double.chance ? 'double' : 'normal'); scheduleBlink(s); }
    if (s.noBlinkUntil && k >= s.noBlinkUntil) { s.noBlinkUntil = 0; scheduleBlink(s, 6); }
    // eyes: fixations and saccades. 70% home. Never a smooth pursuit: the target only moves in jumps.
    if (eyesFree) {
      const c = senses.cursor, near = c.seen && !c.gone ? Math.hypot(c.x - body.x[slot], c.y - body.y[slot]) : 99, carrying = carryNow(s) > 0.15;
      if (s.gazeHold && k >= s.gazeHold.until) { s.gazeHold = null; s.fixUntil = k; s.gazeBack = true; }
      if (s.gazeHold) { const gh = s.gazeHold; let p = gh.target ? pointOf(s, slot, gh.target) : null; if (p && (!gh.fixAt || k >= gh.fixAt)) { const g = gazeAt(s, slot, p[0], p[1]); if (Math.abs(g[0] - s.gT[0]) > 0.12 || Math.abs(g[1] - s.gT[1]) > 0.12 || !gh.fixAt) { s.gT = g; } gh.fixAt = k + rng.int(s.rnd, 18, 60); } else if (!gh.target) s.gT = [gh.gx, gh.gy || 0]; }
      else if (k >= s.fixUntil) { const g = AO.gaze, r = s.rnd(), watch = near < 1.75 && !carrying && s.mode === MODE.ground;   // inside 260 px his eyes are on it (eyes only)
        if (s.gazeBack) { s.gT = [0, 0]; s.gazeBack = false; s.fixUntil = k + rng.int(s.rnd, 40, g.fixation_f[1]); }
        else if (watch && r < 0.75) { s.gT = gazeAt(s, slot, c.x, c.y); s.fixUntil = k + rng.int(s.rnd, 18, 60); }
        else if (r < g.home_bias || carrying) { s.gT = [0, 0]; s.fixUntil = k + rng.int(s.rnd, g.fixation_f[0] + 20, g.fixation_f[1]); }
        else { s.gT = c.seen && !c.gone && r < 0.85 ? gazeAt(s, slot, c.x, c.y) : [-rng.range(s.rnd, 0.2, 0.7), rng.range(s.rnd, -0.1, 0.15)]; s.fixUntil = k + rng.int(s.rnd, g.glance_away_and_back_f[0], g.glance_away_and_back_f[1] + 30); s.gazeBack = true; } }
    }
    // weight shift: he stands off-centre on purpose and stays there until the next one
    if (s.mode === MODE.ground && !s.clip && quiet < 0.5 && k >= s.shiftAt) { const e = AO.weight_shift.every_s, to = rng.range(s.rnd, 0.012, 0.03) * (s.restRoll > 0 ? -1 : 1), from = s.restRoll;
      s.shift = { f: 0, from, to, fromSh: s.restShear, toSh: -0.4 * to }; s.shiftAt = k + Math.round(rng.range(s.rnd, e[0], e[1]) * 60); }
    if (s.shift) { const w = s.shift, f = ++w.f, u = f < 14 ? -0.25 * io(f / 14) : -0.25 + 1.33 * io(Math.min(1, (f - 14) / 20)) - 0.08 * io(clamp((f - 34) / 18, 0, 1));   // back a hair, across, one small give
      s.restRoll = w.from + (w.to - w.from) * u; s.restShear = w.fromSh + (w.toSh - w.fromSh) * io(Math.min(1, f / 50)); V.sy += -0.015 * Math.sin(Math.PI * Math.min(1, f / 30)); if (f >= 52) { s.restRoll = w.to; s.restShear = w.toSh; s.shift = null; } }
    if (s.mode === MODE.ground && !s.clip && quiet < 0.5 && k >= s.browAt) { const m = AO.micro.brow_twitch; layer(s, 'brow', { browR: [[0, 0], [m.up_f, m.browR, 'out'], [m.up_f + m.down_f, 0, 'io']] }); s.browAt = k + Math.round(rng.range(s.rnd, m.every_s[0], m.every_s[1]) * 60); }
    if (s.mode === MODE.ground && !s.clip && !s.queue.length && quiet < 0.5 && k >= s.sighAt) { sigh(s); }
  }
  function sigh(s) { const g = AO.breath.sigh, a = g.in_f, b = a + g.hold_f, c = b + g.out_f; s.sighAt = clock.k + Math.round(rng.range(s.rnd, g.every_s[0], g.every_s[1]) * 60); s.bF = 0; s.bHold = c + 30;
    return layer(s, 'sigh', { sy: [[0, 1], [a, 1 + g.depth, 'io'], [b, 1 + g.depth, 'lin'], [c, 0.985, 'out3'], [c + 30, 0.985, 'lin'], [c + 44, 1, 'io']], lidR: [[b, 0], [b + 20, 0.25, 'io'], [c, 0.25, 'lin'], [c + 16, 0, 'io']], lidL: [[b + 2, 0], [b + 22, 0.25, 'io'], [c + 2, 0.25, 'lin'], [c + 20, 0, 'io']] }); }

  // ------------------------------------------------------------------ clips
  function varsFor(s, slot, opts) {
    const c = senses.cursor, tp = pointOf(s, slot, opts.target || (opts.other != null ? opts.other : 'cursor')) || [body.x[slot] - 1, body.y[slot]];
    const toward = Math.sign(tp[0] - body.x[slot]) || 1, g = gazeAt(s, slot, tp[0], tp[1]), dir = opts.dir || toward;
    const from = s.yaw, to = opts.to != null ? opts.to : clamp(Math.atan2(tp[0] - body.x[slot], 2.2), -1.1, 1.1);
    return { rest: 0, from, to, dir: Math.sign(to - from) || dir, sign: Math.sign(body.th[slot]) || 1, side: opts.side || dir, from_side: opts.from_side || -toward, toward, away: -toward, tip: toward, power: opts.power == null ? 1 : opts.power,   // (tip, power: the Potato Does kit's own words; Nov 12)
      target: g[0], cursor: gazeAt(s, slot, c.seen ? c.x : body.x[slot], c.seen ? c.y : body.y[slot])[0], toward_target: (to - from), _gy: g[1], _c: c };
  }
  function startClip(s, slot, item) {
    const def = item.def, opts = item.opts || {}, vars = varsFor(s, slot, opts); s.vars = vars;
    const c = { id: item.move, def, f: 0, len: opts.len || def.len || 0, T: [], rate: opts.rate || 1, item, facing: opts.facing != null ? opts.facing : (vars.toward || 1), x0: s.x, quiet: item.quiet == null ? 0 : item.quiet,
      contacts: new Set(def.contacts || []), kicks: def.kicks || [], at: item.at || null, steps: item.steps || null, hideEyes: false, absRoll: false, absShear: false, last: {} };
    const tracks = item.tracks || def.tracks || {}; let fmin = 0;
    for (const n in tracks) { if (!Array.isArray(tracks[n]) || n === 'scale_all' || n === 'glitch' || n === 'pivot' || n === 'expr') continue;
      const v = { ...vars, current: n === 'roll' ? s.restRoll + 0 : IDX[n] != null ? ch.get(slot, IDX[n]) : 0, rest: n === 'roll' ? s.restRoll : n === 'sy' ? 1 : 0 };
      if (n === 'roll' && tracks[n].some(k => typeof k[1] === 'string' && /current|rest/.test(k[1]))) { c.absRoll = true; v.current = ch.get(slot, IDX.roll); }
      if (n === 'shear' && tracks[n].some(k => typeof k[1] === 'string' && /current/.test(k[1]))) c.absShear = true;
      if (n === 'gy' || n === 'gx') v.cursor = n === 'gy' ? vars._gy : vars.cursor;
      const t = makeTrack(n, tracks[n], v, springFor(n)); c.T.push(t); if (t.K[0].f < fmin) fmin = t.K[0].f; }
    c.f = fmin - 1; c.stepped = tracks.glitch || null; c.exprT = tracks.expr ? makeTrack('expr', tracks.expr, vars) : (item.expr ? makeTrack('expr', item.expr, vars) : null); c.scaleT = tracks.scale_all ? makeTrack('scale', tracks.scale_all, vars) : null;
    c.glitchT = tracks.glitch ? makeTrack('glitch', tracks.glitch, vars) : null;
    s.clip = c; s.shift = null;
    const react = item.blend != null ? item.blend : 0.5;                 // "a reaction that eases in for 12 frames is not a reaction": 6
    blend(slot, c.T.map(t => t.name).filter(n => BODY.includes(n)), react); blend(slot, c.T.map(t => t.name).filter(n => FACE.includes(n)), 1);
    { const gap = Math.abs(ch.get(slot, IDX.sy) - 1); if (gap > 0.03 && item.blend !== 0) ch.blend(slot, [IDX.sy], Math.max(5, Math.ceil(gap * 1.875 / 0.026))); }
    if (item.handle) item.handle.phase = 'playing'; emit('move', { slot, move: c.id });
    if (item.start) item.start(c);
    return c;
  }
  function endClip(s, slot, why) {
    const c = s.clip; if (!c) return; s.clip = null;
    if (c.dxNow) s.x += c.facing * c.dxNow;                                   // travel made in the clip is kept: no step back
    if (c.yawNow != null && !c.item.keepYawOff) s.yaw = c.yawNow;
    if (c.gxNow != null) { s.gX = c.gxNow; s.gT = [c.gxNow, c.gyNow || 0]; s.fixUntil = clock.k + (c.item.eyesHold || 0); s.gazeBack = true; }   // the eyes are handed back where the clip left them
    // the blend must be asked for on the step the targets really change: now for a cut (this step has not been written yet),
    // the NEXT step for a move that ran out (its last values are already in this step's targets)
    if (why === 'cut') endBlend(s, slot, true); else s.blendAt = clock.k + 1;
    if (c.scaled) setScale(slot, 1);
    if (c.strain) ch.blend(slot, [IDX.lxx, IDX.lxy, IDX.lyy, IDX.cx, IDX.cy], 8);
    const it = c.item; if (it.handle) { it.handle.done = true; it.handle.phase = why || 'done'; }
    if (why !== 'cut' && it.end) it.end(c);
    if (why === 'cut') { for (const q of s.queue) if (q.handle) { q.handle.done = true; q.handle.phase = 'cut'; } s.queue.length = 0; if (s.walking) stopFeet(s, slot); if (s.hidden) show(s, slot, true); s.exprNow = 0; }
  }
  function endBlend(s, slot, cut) { const gap = Math.abs(ch.get(slot, IDX.sy) - 1), need = Math.ceil(gap * 1.875 / 0.026);     // a deep squash may not snap back: at most ~2.6% a frame
    for (const n of BODY) ch.blend(slot, [IDX[n]], Math.max(n === 'sy' ? need : 0, Math.round((BF[n] == null ? 12 : BF[n]) * (cut && n !== 'shear' ? 0.5 : 1)))); blend(slot, ['lidL', 'lidR', 'browL', 'browR', 'jaw'], 1); ch.blend(slot, [IDX.pivot], 10); }
  function setScale(slot, k) { const r = rig.get(slot); if (r) r.root.scale.setScalar(k); }
  function show(s, slot, on) { const r = rig.get(slot); if (r) r.root.visible = on; s.hidden = !on; }
  function stopFeet(s, slot) { const api = rig.api(slot); if (api && s.walking) { api.waddle(false); s.walking = false; rig.wake(slot, 20); } }

  function stepClip(s, slot) {
    const c = s.clip; c.f += c.rate; const f = c.f, fi = Math.floor(f + 1e-6);
    for (const t of c.T) { let v = evalTrack(t, f); if (v === undefined) continue; const n = t.name;
      if (v === null) { if (n === 'sx') V.sxKeyed = false; continue; }
      if (n === 'sy') V.sy = v; else if (n === 'sx') { V.sx = v; V.sxKeyed = true; }
      else if (n === 'roll') V.roll = c.absRoll ? v : s.restRoll + v * (c.item.rollSide || 1);
      else if (n === 'shear') V.shear = c.absShear ? v : s.restShear + v * c.facing * (c.item.shearFlat ? 0 : 1) + (c.item.shearFlat ? v : 0);
      else if (n === 'dx') c.dxNow = v * (c.item.stride || 1); else if (n === 'dy') V.dy = v; else if (n === 'pitch') V.pitch = v;
      else if (n === 'yaw') { V.yaw = v; c.yawNow = v; }
      else if (n === 'gx') { V.gx = v; c.gxNow = v; V.eyesKeyed = true; } else if (n === 'gy') { V.gy = v; c.gyNow = v; }
      else if (n === 'lidL' || n === 'lidR' || n === 'browL' || n === 'browR' || n === 'jaw') V[n] = v; }
    if (c.dxNow) V.x = c.x0 + c.facing * c.dxNow;
    if (c.exprT) { const e = evalTrack(c.exprT, f); if (typeof e === 'string') s.exprNow = Math.max(0, EXPRS.indexOf(e)); }
    if (c.scaleT) { const k = evalTrack(c.scaleT, f); if (k != null) { setScale(slot, k); c.scaled = true; c.scaleNow = k; } }
    if (c.glitchT) { const g = evalTrack(c.glitchT, f); if (g != null && g !== c.gNow) { c.gNow = g; ctx.tag(slot, TAG.glitch_step); } if (c.gNow != null) V.glitch = c.gNow; }
    if (c.steps) c.steps(c, fi, V);
    if (c.contacts.has(fi) && fi !== c.lastC) { c.lastC = fi; tagC(slot); }
    for (const kk of c.kicks) if (kk.f === fi && !kk['done' + c.item.n]) { rig.kick(slot, kk.spring, (typeof kk.v === 'number' ? kk.v : 4.5 * (s.vars.dir || 1)) * (deep ? 1 : 0.6)); }
    if (c.at) for (const a of c.at) if (!a.done && f >= a.f) { a.done = true; a.fn(c); if (s.clip !== c) return; }
    if (f >= c.len) endClip(s, slot);
  }

  // ------------------------------------------------------------------ the queue: what he does next
  function push(s, move, item) { const def = MV[move] || {}; const it = { move, def, n: s.serial++, ...item }; s.queue.push(it); return it; }
  function hold(s, frames, opts = {}) { return push(s, opts.id || 'hold', { def: { len: frames, tracks: opts.tracks || {} }, quiet: opts.quiet, at: opts.at, start: opts.start, end: opts.end, steps: opts.steps, blend: 1, opts: opts.opts, expr: opts.expr }); }
  function walkItems(s, slot, x, o = {}) {
    const gait = o.gait || 'walk', cy = MV[gait], len = cy.len, half = len / 2, per = cy.tracks.dx[cy.tracks.dx.length - 1][1];
    const run = { x1: x };
    // (o.quick, Nov 12 night, Chikin: "he is moving like jello ... like he is moving through pudding": under a hand he skips the wind-up and goes)
    if (o.quick) { run.dir = Math.sign(run.x1 - s.x) || 1; s.gazeHold = { gx: run.dir > 0 ? 0 : -0.85, gy: 0, until: clock.k + 9999 }; s.yawWalk = o.noYaw ? 0 : 0.85 * run.dir; }
    else push(s, 'walk_start', { opts: { target: { x }, facing: 0 }, start: c => { c.facing = Math.sign(run.x1 - s.x) || 1; run.dir = c.facing; s.gazeHold = { gx: c.facing > 0 ? 0 : -0.85, gy: 0, until: clock.k + 9999 }; s.yawWalk = o.noYaw ? 0 : 0.85 * c.facing; }, blend: 1 });   // round 3 (A8): three-quarters toward where he is going (was 0.5)
    push(s, gait, { def: { len: 1e9, tracks: {} }, blend: 1, steps(c, fi, V_) {
      if (c.t == null) { c.t = 0; c.dir = run.dir; c.base = s.x; const stiff = 1 - 0.15 * Math.min(1, carryNow(s) * 2); c.stride = clamp(o.speed || (gait === 'walk' ? 1.25 : 1), 0.5, o.maxStride || 1.3) * stiff; c.tempo = o.tempo || 1; /* (tempo: frames of the cycle per tick; a driven walk is the same waddle, twice as brisk) */ c.rock = 1 - 0.4 * Math.min(1, carryNow(s) * 2);   // carry: a stiff walk, both sides the same (ruling 19)
        c.dxT = () => makeTrack('dx', cy.tracks.dx, s.vars); c.cyc = 0; c.tr = null; const api = rig.api(slot); api.waddle(true); s.walking = true; }
      const ph = c.t % len; if (ph === 0) { c.tr = { dx: c.dxT(), dy: makeTrack('dy', cy.tracks.dy, s.vars), roll: makeTrack('roll', cy.tracks.roll, s.vars), sy: cy.tracks.sy ? makeTrack('sy', cy.tracks.sy, s.vars) : null }; }
      const dxv = evalTrack(c.tr.dx, ph), trav = o.quick ? (c.t / len) * per * c.stride : (c.cyc * per + dxv) * c.stride;   /* (under a hand he covers ground at one even speed: the waddle's own lunge-and-wait, sped up, read as jerky. Chikin, Nov 13: "hes all jerky in the browser, he doesnt move smooth". His bob and rock still come from the cycle.) */
      V_.x = c.base + c.dir * trav; V_.dy = evalTrack(c.tr.dy, ph); V_.roll = s.restRoll + evalTrack(c.tr.roll, ph) * c.rock * c.dir; if (c.tr.sy) V_.sy = evalTrack(c.tr.sy, ph);
      rig.get(slot).S.walk = TAU * (ph / len) - 7 / 60; rig.wake(slot, 4);                       // OUR clock owns his feet (probe P3)
      if (ph === 0 || ph === half) tagC(slot);
      for (const kk of cy.kicks || []) if (kk.f === ph) rig.kick(slot, kk.spring, kk.v * 0.6 * c.dir);
      c.t += c.tempo; if (c.t % len === 0) c.cyc++;
      if (o.quick && (V_.x - run.x1) * c.dir >= 0) { V_.x = run.x1; s.x = V_.x; c.len = 0; return; }   // (under a hand he stops AT the wall, never past it and back)
      const left = Math.abs(run.x1 - V_.x), plant = c.t % half === 0;
      if (plant && (left < per * c.stride * 0.5 + 0.05 || (V_.x - run.x1) * c.dir > 0 || c.t > 60 * 40)) { s.x = V_.x; c.len = 0; }   // stop on a foot plant, never mid-step
    }, end() { stopFeet(s, slot); } });
    return push(s, 'walk_stop', { opts: { facing: 0 }, start: c => { c.facing = run.dir; }, end() { s.gazeHold = null; s.fixUntil = clock.k + 30; s.yawWalk = 0; if (o.then) o.then(); }, blend: 1 });
  }
  const STEP_F = 5;
  function steppedItem(s, slot, move, o = {}) {      // zap, late_twitch, wake_glitch: the whole pose held 5 frames a step, no eases inside
    const def = MV[move], raw = def.steps.slice(); let order = raw;
    if (move === 'zap') { const mid = raw.slice(1, -1); for (let i = mid.length - 1; i > 0; i--) { const j = Math.floor(s.rnd() * (i + 1)); [mid[i], mid[j]] = [mid[j], mid[i]]; } order = [raw[0], ...mid, raw[raw.length - 1]]; }
    const nSteps = order.length, stepEnd = nSteps * STEP_F, tracks = {}; for (const n in def.tracks_after || {}) tracks[n] = def.tracks_after[n];
    return push(s, move, { quiet: 1, blend: 0, tracks, opts: o, start(c) { c.cur0 = { roll: ch.get(slot, IDX.roll), pitch: ch.get(slot, IDX.pitch) }; tagC(slot); },
      steps(c, fi, V_) {
        if (fi < stepEnd) { const i = Math.floor(fi / STEP_F), sp = order[i], first = fi % STEP_F === 0;
          if (first) { ctx.tag(slot, TAG.glitch_step); ch.blend(slot, [IDX.sy, IDX.sx, IDX.roll, IDX.dy, IDX.pitch, IDX.shear], 0); emit('look', { slot, look: sp.look || 'ink' }); if (move === 'zap' && i === nSteps - 1) { emit('cue', { name: 'fx.smoke', slot }); if (ctx.fx && ctx.fx.spawn) ctx.fx.spawn('smoke', { at: [body.x[slot], body.y[slot] + A], slot }); } }
          V_.sy = sp.sy == null ? 1 : sp.sy; if (sp.sx != null) { V_.sx = sp.sx; V_.sxKeyed = true; }
          V_.roll = typeof sp.roll === 'string' ? (sp.roll === 'current' ? c.cur0.roll : c.cur0.roll * 0.5) : s.restRoll + (sp.roll || 0); V_.dy = sp.dy || 0; V_.glitch = sp.glitch || 0;
          if (move === 'zap') { s.exprNow = i < nSteps - 1 ? EXPRS.indexOf('shock') : 0; if (i === nSteps - 1) { V_.lidL = V_.lidR = -1; V_.browR = 1.4; V_.browL = 1.0; V_.gx = 0; V_.eyesKeyed = true; } }
          if (move === 'wake_glitch') { V_.pitch = 0.25; V_.lidL = V_.lidR = 1; }
          if (move === 'late_twitch') { V_.lidL = V_.lidR = -0.5; V_.browR = 0.3; if (sp.dy && first) tagC(slot); }
        } else if (fi === stepEnd) { ctx.tag(slot, TAG.glitch_step); ch.blend(slot, [IDX.sy, IDX.sx, IDX.roll, IDX.dy], 0); s.exprNow = 0; }
        if (move === 'zap' && fi >= stepEnd) {      // round 3 (A5 + comedian): the AFTER. rigid, 4% tall and stiff under the smoke, brows as high as they go, pupils still on their side; then the brows come down ONE AT A TIME
          const a = fi - stepEnd, Z = def.after || {}, stiff = Z.stiff_f || 90, bR = Z.brow_r_down_at || 54, bL = Z.brow_l_down_at || 72, dn = t0 => 1 - io(clamp((a - t0) / 6, 0, 1));
          c.quietNow = a < stiff ? 1 : 0; V_.browR = 1.4 * dn(bR); V_.browL = 1.0 * dn(bL); V_.lidR = -1 * dn(bR); V_.lidL = -1 * dn(bL); if (a < bL + 6) { V_.gx = 0; V_.eyesKeyed = true; } }
      }, end() { if (o.end) o.end(); } });
  }

  /** the brain's door. Returns a handle: { done, phase, cancel() } */
  function play(id, move, opts = {}) {
    const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id), handle = { done: false, phase: 'queued', move, cancel() { handle.cancelled = true; } };
    if (!p || !st[p.slot] || !MV[move]) { handle.done = true; handle.phase = 'unknown'; return handle; }
    const s = st[p.slot], slot = p.slot, def = MV[move], last = () => { const it = s.queue[s.queue.length - 1]; if (it) it.handle = handle; };
    if (opts.now && s.clip) endClip(s, slot, 'cut');
    const R = (a, b) => Math.round(rng.range(s.rnd, a, b));
    switch (move) {
      case 'blink': blinkNow(s, 'normal'); handle.done = true; break;
      case 'slow_blink': blinkNow(s, 'slow'); handle.done = true; break;
      case 'sigh': sigh(s); handle.done = true; break;
      case 'glance': { const pt = pointOf(s, slot, opts.target || 'cursor'), g = pt ? gazeAt(s, slot, pt[0], pt[1]) : [-0.6, 0], h = opts.hold_f || R(def.vary.hold_f[0], def.vary.hold_f[1]);
        s.gazeHold = { gx: g[0], gy: g[1], until: clock.k + h }; layer(s, 'glance', { browR: def.tracks.browR }); handle.done = true; break; }
      case 'eyes_track': case 'watch_go_by': look(p, opts.target || 'cursor', { hold_f: opts.hold_f || 600 }); handle.done = true; break;
      case 'grab': case 'hang': case 'drag_squish': case 'air': case 'bounce_floor': case 'bounce_wall': case 'skid': case 'down': case 'set_down':
        handle.done = true; handle.phase = 'physics'; break;                         // these play when physics does; nobody asks for them
      case 'get_up': handle.done = true; handle.phase = 'physics'; break;
      case 'walk': case 'waddle': walkItems(s, slot, opts.to != null ? opts.to : clamp(s.x + (opts.dir || 1) * (opts.dist || (move === 'walk' ? 1.2 : 0.4)), room.left + 0.6, room.right - 0.6), { gait: move, speed: opts.speed }); last(); break;
      case 'walk_start': case 'walk_stop': push(s, move, { opts, blend: 1 }); last(); break;
      case 'hop': push(s, 'hop', { tracks: { sy: def.tracks.sy.slice(0, 2) }, def: { len: 9 }, opts, end() { tagC(slot); rig.kick(slot, 'squash', 1.2); body.impulse(slot, 0, Math.sqrt(2 * G * (opts.height || 0.34)), 0); } }); last(); break;
      case 'windup_launch': { const sp = opts.speed || rng.range(s.rnd, def.release.speed[0], def.release.speed[1]), an = opts.angle || rng.range(s.rnd, def.release.angle_rad[0], def.release.angle_rad[1]);
        push(s, move, { opts, def: { ...def, len: def.release.f }, end(c) { tagC(slot); body.impulse(slot, c.facing * sp * Math.cos(an), sp * Math.sin(an), -c.facing * 2.5); } }); last(); break; }
      case 'zap': steppedItem(s, slot, 'zap', { end() { addCarry(s, 0.7, 0, true); s.browHold = { R: 0.1, L: 0.05, until: clock.k + R(240, 480) }; const d = MV.late_twitch.delay_after_zap_s;
          clock.after(R(d[0] * 60, d[1] * 60), () => { if (st[slot] === s && s.mode === MODE.ground && !s.clip) { steppedItem(s, slot, 'late_twitch', { end() { look(p, 'user', { hold_f: 20 }); } }); } }); } }); last(); scheduleBlink(s, 96); break;
      case 'late_twitch': case 'wake_glitch': steppedItem(s, slot, move, { end() { if (move === 'wake_glitch') play(p, 'caught_looking'); } }); last(); break;
      case 'explode': explode(s, slot, p, opts); last(); break;
      case 'squish_flat':   // round 3 (THE LEVEL FACE): no drawn deadpan. His own eyes as two slits, on you, one brow up. One blink from the pancake (comedian). The look after is inside the gag.
        push(s, move, { opts, quiet: 1, steps(c, fi, V_) { if (fi < 61) { V_.gx = -0.5; V_.eyesKeyed = true; V_.lidL = Math.max(V_.lidL, 0.5); V_.lidR = Math.max(V_.lidR, 0.5); V_.browR += 0.1; } },
          at: [{ f: 30, fn: () => layer(s, 'blink', { lidR: [[0, 0], [2, 1, 'in'], [4, 1, 'lin'], [6, 0, 'out']], lidL: [[1, 0], [3, 1, 'in'], [5, 1, 'lin'], [7, 0, 'out']] }) }], end() { addCarry(s, 0.8); } });
        lookYou(s, slot, 48); last(); break;
      case 'fries': { const n = opts.fries || 1; play(p, 'fries_check');      // round 3: ONE fry a feeding (comedian: the repeat was the loop)
        for (let i = 0; i < n; i++) { play(p, 'fries_bite');
          // the stare: up with the evidence in his mouth, on you, long enough to be rude (+43 f, first fry only, no blink)
          if (i === 0) hold(s, (MV.fries_bite.stare_f || 43), { id: 'fries_stare', quiet: 1, tracks: { gx: [[0, -0.5], [43, -0.5, 'lin']], browR: [[0, 0], [6, 0.1, 'out'], [43, 0.1, 'lin']] }, start() { s.noBlinkUntil = clock.k + 80; } });
          // a chew is small and quick: a burst of 4 to 6, cheeks side to side, the fry shorter three times, then one bigger dip to swallow (A4)
          const chews = opts.chews || R(4, 6); for (let j = 0; j < chews; j++) play(p, 'chew', { side: j % 2 ? 1 : -1, first: i < 2, shorter: Math.floor((j + 1) * 3 / chews) > Math.floor(j * 3 / chews) }); play(p, 'fries_swallow'); }
        hold(s, 1, { end() { s.gazeHold = null; s.noBlinkUntil = 0; emit('prop', { slot, do: 'carton_left' }); blinkNow(s, 'slow'); } }); last(); break; }
      case 'fries_check': push(s, move, { opts: { ...opts, to: s.yaw + 0.5 }, keepYawOff: true, start() { emit('prop', { slot, do: 'carton', at: [s.x + 0.5, room.floor] }); s.noBlinkUntil = clock.k + 400; }, end() { s.gazeHold = { gx: -0.5, gy: 0, until: clock.k + 3000 }; } }); last(); break;
      case 'fries_bite': push(s, move, { opts, shearFlat: true, at: [{ f: 26, fn: () => emit('prop', { slot, do: 'fry_in_mouth' }) }], end() { s.gazeHold = { gx: -0.5, gy: 0, until: clock.k + 3000 }; } }); last(); break;
      case 'chew': { const v = def.vary, len = opts.len || R(v.len[0], v.len[1]); push(s, move, { opts: { ...opts, rate: def.len / len, side: opts.side || 1 }, rollSide: 1, blend: 1, at: opts.shorter === false ? [] : [{ f: 5, fn: () => emit('prop', { slot, do: 'fry_shorter' }) }], start() { if (opts.first) s.noBlinkUntil = clock.k + 60; } });
        if (s.rnd() < v.pause_after.chance) hold(s, R(v.pause_after.f[0], v.pause_after.f[1]), { tracks: { jaw: [[0, 0.1], [4, 0.1, 'lin']] } }); last(); break; }
      case 'lean_look': push(s, move, { opts }); hold(s, opts.hold_f || R(40, 90), { tracks: { shear: [[0, 0.06]], roll: [[0, -0.04]], sy: [[0, 1.01]], browR: [[0, 0.15]] }, opts }); push(s, 'lean_look', { def: def.exit, opts, blend: 1 }); last(); break;
      case 'lean_on_edge': { const side = opts.side || (s.x > (room.left + room.right) / 2 ? 1 : -1), hs = def.hold_s, hf = opts.hold_f || R(hs[0] * 60, hs[1] * 60), edge = side > 0 ? room.right - 0.56 : room.left + 0.56;
        if (Math.abs(s.x - edge) > 0.12) walkItems(s, slot, edge, { gait: 'waddle' });
        push(s, move, { def: { ...def.enter }, opts: { side: -side }, rollSide: 1 }); hold(s, hf, { tracks: { roll: [[0, -0.18 * side]], sy: [[0, 0.97]] }, start() { addLean(s, -0.18 * side); } }); push(s, move, { def: { ...def.exit }, opts: { side: -side }, blend: 1, start() { s.leanRoll = 0; } }); last(); break; }
      case 'nod_off': push(s, move, { opts, quiet: 0.6 }); hold(s, opts.sleep_f || 600, { id: 'sleep_slide', quiet: 1, tracks: { pitch: [[0, 0.25]], lidL: [[0, 1]], lidR: [[0, 1]] }, steps(c, fi, V_) { const b = 0.5 - 0.5 * Math.cos(TAU * fi / 250); V_.sy = 0.94 + 0.03 * b; c.sl = Math.min(0.3, (c.sl || 0) + 0.002 / 60 * (opts.slide_x || 1)); V_.roll = s.restRoll + c.sl; V_.x = s.x = s.x + 0.02 / 60; if (c.sl >= 0.3) c.len = 0; const cu = senses.cursor; if (cu.seen && !cu.gone && clock.k - cu.lastMoveK < 3 && Math.hypot(cu.x - body.x[slot], cu.y - body.y[slot]) < 0.93) c.len = 0; } });
        steppedItem(s, slot, 'wake_glitch', { end() { play(p, 'caught_looking'); } }); last(); break;
      case 'sleep_slide': play(p, 'nod_off', opts); break;
      case 'back_turned': { const hs = def.hold_s, hf = opts.hold_f || R(hs[0] * 60, hs[1] * 60), y0 = s.yaw, dir = opts.dir || 1;
        push(s, 'about_face', { opts: { dir, to: y0 + Math.PI * dir } });
        hold(s, hf, { id: 'back_turned', tracks: { sy: [[0, 0.98]], yaw: [[0, y0 + Math.PI * dir], [Math.round(hf * 0.45), y0 + Math.PI * dir - 0.5 * dir, 'hold'], [Math.round(hf * 0.45) + 34, y0 + Math.PI * dir, 'hold']], gx: [[Math.round(hf * 0.45) + 8, 0], [Math.round(hf * 0.45) + 11, -1, 'out'], [Math.round(hf * 0.45) + 30, -1, 'lin'], [Math.round(hf * 0.45) + 32, 0, 'out']] } });
        push(s, 'about_face', { opts: { dir: -dir, to: y0 }, tracks: { sy: MV.about_face.tracks.sy, yaw: MV.about_face.tracks.yaw } }); last(); break; }
      case 'about_face': push(s, move, { opts: { ...opts, to: opts.to != null ? opts.to : s.yaw + Math.PI * (opts.dir || 1) }, rate: opts.rate }); last(); break;
      case 'turn_small': case 'turn_big': push(s, move, { opts, at: move === 'turn_big' ? [{ f: 17, fn: () => {} }] : null }); last(); break;
      case 'notice_other': {   // round 3 (A1 + comedian, m09): a double-take is two TURNS. Gather, eyes first, the body turns to him, holds, snaps home (both on the same frame), then the slow second look.
        const o = pointOf(s, slot, opts.other != null ? opts.other : opts.target), dir = o ? Math.sign(o[0] - s.x) || 1 : 1, d0 = opts.delay == null ? 20 : opts.delay, H = Math.max(24, (opts.home_at == null ? 86 : opts.home_at) - d0), tg = o ? { x: o[0], y: o[1] } : undefined;
        const F1 = 'from+' + ((dir < 0 ? 0.9 : 0.55) * dir), F2 = 'from+' + ((dir < 0 ? 0.6 : 0.36) * dir);   // a left turn goes further: his face is drawn to the right of his middle
        hold(s, d0, {});
        push(s, 'notice_turn', { def: { len: H + 12 }, quiet: 1, blend: 1, opts: { target: tg }, tracks: { sy: [[0, 1], [4, 0.94, 'out'], [14, 1, 'spring']], gx: [[0, 'current'], [3, 'target', 'out'], [H, 'target', 'lin'], [H + 3, 0, 'out']],
          yaw: [[4, 'from'], [18, F1, 'io'], [H, F1, 'lin'], [H + 10, 'from', 'io']], browR: [[2, 0], [7, 0.3, 'out'], [H, 0.3, 'lin'], [H + 8, 0, 'io']] } });
        hold(s, opts.second_after == null ? 34 : opts.second_after, {});
        push(s, 'notice_second', { def: { len: 84 }, quiet: 1, blend: 1, opts: { target: tg }, shearFlat: true, tracks: { gx: [[0, 'current'], [4, 'target', 'out'], [58, 'target', 'lin'], [62, 0, 'out']], yaw: [[8, 'from'], [32, F2, 'io'], [58, F2, 'lin'], [80, 'from', 'io']],
          shear: [[8, 0], [32, 0.05 * dir, 'io'], [58, 0.05 * dir, 'lin'], [80, 0, 'io']], lidL: [[6, 0], [14, 0.2, 'io'], [58, 0.2, 'lin'], [66, 0, 'io']], lidR: [[6, 0], [14, 0.2, 'io'], [58, 0.2, 'lin'], [66, 0, 'io']] } }); last(); break; }
      case 'zap_nosy': {      // round 3 (comedian): the zap he walked into. The spark alone, he leans at it, a hold, the lean reaches it, zap. 52 f. (the dropped-on-him zap keeps its timing)
        const side = opts.side || (s.x > (room.left + room.right) / 2 ? -1 : 1), px = s.x + 0.85 * side, py = room.floor + A * 1.1;
        push(s, 'zap_nosy', { def: { len: 52 }, blend: 1, opts: { target: { x: px, y: py }, facing: side }, shearFlat: true, start() { if (ctx.fx && ctx.fx.spawn) ctx.fx.spawn('spark', { x: px, y: py, slot, frames: 600 }); },
          tracks: { gx: [[4, 'current'], [7, 'target', 'out'], [52, 'target', 'lin']], shear: [[10, 0], [28, 0.06 * side, 'io'], [36, 0.06 * side, 'lin'], [48, 0.13 * side, 'in'], [52, 0.13 * side, 'lin']], sy: [[36, 1], [48, 1.03, 'io'], [52, 1.03, 'lin']], browR: [[6, 0], [12, 0.2, 'out'], [52, 0.2, 'lin']] } });
        play(p, 'zap'); last(); break; }
      case 'bump': case 'shove': { const o = opts.other != null ? ctx.potatoes.find(q => q.id === opts.other || q.slot === opts.other) : null, cf = move === 'bump' ? 14 : 14;
        push(s, move, { opts, at: [{ f: cf, fn: () => { if (o && ctx.crowd) { ctx.crowd.shove(slot, o.slot, move === 'bump' ? 'bump' : 'shove'); if (move === 'bump') play(o, 'bumped', { target: { x: s.x }, now: true }); } } }] }); last(); break; }
      case 'bumped': push(s, move, { opts, start() { rig.poke(slot, -0.4 * (s.vars.toward || 1), 0, 0.5); } }); last(); break;
      case 'poke_flinch': push(s, move, { opts, shearFlat: false, eyesHold: 30 }); last(); break;
      case 'through_404': through404(s, slot, 0, 0, true); last(); break;
      case 'crack_hit': case 'splat_wall': handle.done = true; handle.phase = 'physics'; break;
      case 'walk_back_in': walkBackIn(s, slot, opts.side || 1); last(); break;
      case 'startle_big': push(s, move, { opts, tracks: { sy: def.tracks.sy, dy: def.tracks.dy, roll: def.tracks.roll, lidL: [[1, 0], [3, -1, 'out'], [22, -1, 'lin'], [34, 0, 'io']], lidR: [[0, 0], [2, -1, 'out'], [20, -1, 'lin'], [32, 0, 'io']], browR: [[0, 0], [3, 0.7, 'out'], [34, 0, 'spring']], browL: [[1, 0], [4, 0.5, 'out'], [36, 0, 'spring']] } }); last(); break;   // no arms, no face swap (rulings 18): his own eyes, wide
      default:
        if (def.tracks && !Array.isArray(def.tracks) && Object.values(def.tracks).some(Array.isArray)) { push(s, move, { opts, rate: opts.rate, eyesHold: move === 'double_take' ? R(40, 90) : move === 'caught_looking' ? 20 : 0 }); last(); }
        else { handle.done = true; handle.phase = 'no keys'; }
    }
    return handle;
  }
  function addLean(s, v) { s.leanRoll = v; }
  function look(p, target, o = {}) { const s = st[p.slot]; if (!s) return; if (target === 'home' || target == null) { s.gazeHold = null; s.gazeBack = true; s.fixUntil = clock.k; return; }
    s.gazeHold = { target, until: clock.k + (o.hold_f || 48), fixAt: 0 }; if (target === 'you') { s.gazeHold.target = null; s.gazeHold.gx = -0.5; s.gazeHold.gy = 0; } }
  /** the one move every gag ends on: eyes to the thing, hold, then eyes to you (or away), then home */
  function lookAfter(p, thing, o = {}) { const s = st[p.slot]; if (!s) return; const h = o.hold_f == null ? 48 : o.hold_f; look(p, thing, { hold_f: h });
    clock.after(h + 1, () => { if (st[p.slot] !== s) return; if ((o.then || 'user') === 'user') look(p, 'user', { hold_f: Math.round(rng.range(s.rnd, 24, 72)) }); else { s.gazeHold = null; s.gT = [0, 0]; } }); }

  // ---- round 3: THE LOOK AFTER IS A CLIP. (comedian: it ran on the brain's clock and came 150 f late or never.) While one of these is queued
  // or playing moves.busy() is true, so no walk and no idle can start until it has held its count.
  function lookThing(s, slot, pt, holdF, o = {}) {       // eyes first, then the body goes with them (A1: a reaction is a silhouette)
    // his drawn face sits to screen-right of his middle, so a turn to the LEFT has to go further before it reads as a turn at all (0.95 against 0.6)
    const yv = 'from+toward_target*' + (pt.x < (o.x != null ? o.x : s.x) ? 0.95 : 0.6);
    const T = { sy: [[0, 1], [4, 0.955, 'out'], [16, 1, 'spring']], gx: [[0, 'current'], [3, 'target', 'out'], [holdF + 8, 'target', 'lin'], [holdF + 12, 0, 'out']], gy: [[0, 0], [3, 'cursor', 'out'], [holdF + 8, 'cursor', 'lin'], [holdF + 12, 0, 'out']],
      yaw: [[4, 'from'], [16, yv, 'io'], [holdF + 6, yv, 'lin'], [holdF + 20, 'from', 'io']] };
    if (o.up) { T.pitch = [[4, 0], [14, -0.16, 'io'], [holdF + 6, -0.16, 'lin'], [holdF + 18, 0, 'io']]; T.sy = [[0, 1], [4, 0.955, 'out'], [14, 1.06, 'io'], [holdF + 6, 1.06, 'lin'], [holdF + 18, 1, 'io']]; }   // he cranes: 6% taller, tipped back (the comedian's 0.10 rad did not read at 100 px)
    return push(s, 'look_thing', { def: { len: holdF + 22 }, quiet: 1, blend: 1, opts: { target: pt }, tracks: T }); }
  function lookYou(s, slot, holdF, o = {}) {              // the blame look. With the stance (director's bold choice) his body turns AWAY and the eyes stay on you.
    const SL = D.stance_look || { turn: 0.62, gx: -0.12 }, stn = FLAGS.stance_look !== false, g = stn ? SL.gx : -0.5, e = holdF + 10, yv = 'from-' + SL.turn;
    const T = { gx: [[0, 'current'], [3, g, 'out'], [e, g, 'lin'], [e + 3, 0, 'out']], browR: [[2, 0], [6, 0.12, 'out'], [e, 0.12, 'lin'], [e + 6, 0, 'io']], lidL: [[2, 0], [6, 0.12, 'out'], [e, 0.12, 'lin'], [e + 6, 0, 'io']], lidR: [[2, 0], [6, 0.12, 'out'], [e, 0.12, 'lin'], [e + 6, 0, 'io']] };
    if (stn) { T.yaw = [[3, 'from'], [15, yv, 'io'], [e, yv, 'lin'], [e + 14, 'from', 'io']]; T.roll = [[3, 0], [13, 0.035, 'io'], [e, 0.035, 'lin'], [e + 14, 0, 'io']]; T.sy = [[0, 1], [5, 0.97, 'out'], [16, 1, 'spring']]; }
    return push(s, 'look_you', { def: { len: holdF + 26 }, quiet: 1, blend: 1, opts: {}, at: o.at, tracks: T, end(c) { if (o.end) o.end(c); if (FLAGS.replant && !o.noReplant && body.mode[slot] === MODE.ground) replant(s, slot); } }); }
  // BOLD CHOICE (this seat, round 3): RE-PLANT. After the look he does not go back to where he was standing. He re-plants: a small shuffle, weight down on the other side.
  function replant(s, slot) { const S = D.replant || {}, r = S.shuffle_bh || [0.05, 0.11], d = rng.range(s.rnd, r[0], r[1]), dir = s.x > room.right - 1 ? -1 : s.x < room.left + 1 ? 1 : (s.rnd() < 0.5 ? -1 : 1), dip = S.sy_dip || 0.96;
    push(s, 'replant', { def: { len: S.f || 26, contacts: [6, 14] }, blend: 1, opts: { facing: dir }, tracks: { sy: [[0, 1], [6, dip, 'io'], [10, 1.02, 'io'], [14, 0.975, 'io'], [26, 1, 'spring']], dy: [[6, 0], [10, 0.022, 'out'], [14, 0, 'in']], dx: [[6, 0], [14, d, 'io']] },
      end() { s.shiftAt = clock.k; } }); s.queue.unshift(s.queue.pop()); }
  function afterBig(s, slot, p) { const b = s.big; s.big = null; if (!b) return false;
    if (b.kind === 'crack') {     // comedian: he looks UP at it (it is above him), tips back, holds 46; you, 58; then he leaves the scene, 0.8 of himself, eyes home
      hold(s, 50, {}); lookThing(s, slot, { x: b.x, y: b.y }, 46, { up: true }); lookYou(s, slot, 58, { noReplant: true });
      const away = s.x > (room.left + room.right) / 2 ? -1 : 1; walkItems(s, slot, clamp(s.x + 0.8 * away, room.left + 0.7, room.right - 0.7), { gait: 'walk', speed: 0.9 }); }
    else { hold(s, 18, {}); lookYou(s, slot, 48); }
    return true; }

  function explode(s, slot, p, opts = {}) {
    // round 3 (comedian + Potato seat): he rebuilds the RIGHT way up. One time in three the last thing is wrong: full size, upside down, torn the whole
    // time (never clean), 16 f + an 8 f shudder = 24 f upside down in all (it was 78), and HE KNOWS for every one of them. Then the fix. Then: who saw?
    const def = MV.explode, wrong = opts.wrong != null ? !!opts.wrong : s.rnd() < (def.wrong_chance == null ? 1 / 3 : def.wrong_chance), W0 = 114, W1 = W0 + (wrong ? 16 : 0), SH = W1 + (wrong ? 8 : 0), FX = SH + (wrong ? 5 : 0);
    push(s, 'explode', { quiet: 1, tracks: { sy: def.tracks.sy }, def: { len: FX + 18, contacts: [10] }, blend: 1, steps(c, fi, V_) {
      if (fi >= 10 && fi < 12) { V_.glitch = 1; if (fi === 10) ctx.tag(slot, TAG.glitch_step); }
      if (fi === 12) { show(s, slot, false); tagC(slot); emit('cue', { name: 'fx.burst', slot }); }
      if (fi >= 12 && fi < 54) { V_.sy = 1; V_.glitch = 0; }
      if (fi >= 54 && fi < W0) { const i = Math.floor((fi - 54) / STEP_F), first = (fi - 54) % STEP_F === 0;      // rebuilt on the 12 fps clock, small to full, torn at full strength every step
        if (fi === 54) { show(s, slot, true); ch.blend(slot, [IDX.sy, IDX.roll], 0); }
        if (first) { ctx.tag(slot, TAG.glitch_step); tagC(slot); setScale(slot, 0.34 + 0.06 * i); c.scaled = true; }
        V_.glitch = i % 2 ? 0.8 : 1; V_.sy = 1; }
      if (fi === W0) { setScale(slot, 1); tagC(slot); ctx.tag(slot, TAG.glitch_step); if (wrong) ch.blend(slot, [IDX.roll, IDX.sy, IDX.pivot], 0); }
      if (wrong && fi >= W0 && fi < W1) { V_.roll = Math.PI + 0.08; V_.pivotCentre = true; V_.sy = 0.97; V_.glitch = 0.8; V_.knows = true; if ((fi - W0) % STEP_F === 0) ctx.tag(slot, TAG.glitch_step); }
      if (wrong && fi >= W1 && fi < SH) { const j = Math.floor((fi - W1) / 2); V_.roll = Math.PI + 0.08; V_.pivotCentre = true; V_.sy = j % 2 ? 1.03 : 0.96; V_.glitch = 0.8; V_.knows = true; if ((fi - W1) % 2 === 0) { tagC(slot); ch.blend(slot, [IDX.sy], 0); } }   // the shudder that was written and not built
      if (wrong && fi >= SH && fi < FX) { if (fi === SH) { ctx.tag(slot, TAG.glitch_step); tagC(slot); ch.blend(slot, [IDX.roll, IDX.sy, IDX.pivot], 0); rig.kick(slot, 'wob', 1.6); } V_.glitch = 0.9; V_.roll = s.restRoll; V_.sy = 1.03; }
      if (wrong && fi === FX) ctx.tag(slot, TAG.glitch_step);
      if (fi >= FX) V_.sy = 1.03 - 0.03 * io(Math.min(1, (fi - FX) / 14));
    }, end() { addCarry(s, 1); scheduleBlink(s, 60); } });
    // "checks who saw" (A6): one look left, one look at you
    hold(s, 34, { id: 'look_left', quiet: 1, tracks: { gx: [[0, 'current'], [3, -0.8, 'out'], [24, -0.8, 'lin'], [27, 0, 'out']], yaw: [[2, 'from'], [11, 'from-0.4', 'io'], [24, 'from-0.4', 'lin'], [34, 'from', 'io']], sy: [[0, 1], [4, 0.965, 'out'], [14, 1, 'spring']] } });
    lookYou(s, slot, 40);
  }

  // ------------------------------------------------------------------ the first-contact ladder: splat, crack, the 404
  function splat(s, slot, e) {
    const def = MV.splat_wall, wall = Math.abs(e.nx) > 0.7, x0 = body.x[slot], y0 = body.y[slot], th = body.th[slot], sup = body.sup(slot, e.nx, e.ny), spin = clamp(e.spin || 0, -8, 8);
    body.claim(slot); if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0;
    const syT = makeTrack('sy', def.tracks.sy, {}, springFor('sy')), sxT = makeTrack('sx', def.tracks.sx.map(k => [k[0], k[1] == null ? 1 : k[1], k[2]]), {}), dyT = makeTrack('dy', def.tracks.dy, {});
    const it = push(s, 'splat_wall', { def: { len: def.len, contacts: def.contacts }, quiet: 1, blend: 0, claimed: true, steps(c, fi, V_) {
      const n = capMap(evalTrack(syT, c.f), cap, deep), t = deep ? evalTrack(sxT, c.f) : 1 + (evalTrack(sxT, c.f) - 1) * 0.1, ln = Math.log(n), lt = Math.log(Math.max(1, t)), tx = e.ny, ty = -e.nx;
      // flat ALONG THE WALL'S NORMAL, whatever way up he hit it: a strain in the room's axes (the engineer's physpose does the same for a bounce)
      c.strain = [ln * e.nx * e.nx + lt * tx * tx, ln * e.nx * e.ny + lt * tx * ty, ln * e.ny * e.ny + lt * ty * ty, e.nx * (n - 1) * sup, e.ny * (n - 1) * sup];
      const dy = wall ? (evalTrack(dyT, c.f) || 0) : 0; V_.x = x0; V_.y = Math.max(room.floor + A * 0.6, y0 + dy); V_.roll = th + spin * 0.11 * (1 - Math.exp(-c.f / 7)); body.th[slot] = V_.roll; V_.sy = 1; V_.pivotCentre = true; /* round 3 (E1/A3): the spin he came in with rolls him against the wall, it does not vanish */
      if (fi <= 1) tagC(slot);                                                                  // the impact is two frames of crush (phase impact 0..2)
      if (fi < 10) { const g = fi < 5 ? 0.5 : 0.2; V_.glitch = g; if (fi === 0 || fi === 5) ctx.tag(slot, TAG.glitch_step); } else if (fi === 10) ctx.tag(slot, TAG.glitch_step);
      if (fi === 104 || fi === 108 || fi === 112) rig.kick(slot, 'wob', 1.2 * (deep ? 1 : 0.6));
      if (fi < 12) { const k = fi < 8 ? 1 : 1 - (fi - 8) / 4; V_.lidL = V_.lidR = -0.7 * k; V_.browR = 0.5 * k; V_.browL = 0.35 * k; }      // round 3 (A3): the flat face BREAKS on contact, 8 f, then it is flat again
      if (fi >= 20 && fi < 100) { V_.gx = -0.5; V_.eyesKeyed = true; V_.browR += 0.1; }               // he looks at you from the wall, one brow up (THE LEVEL FACE)
    }, at: [{ f: 22, fn: () => blinkNow(s, 'normal') }, { f: 98, fn: () => blinkNow(s, 'normal') }],
      end(c) { ch.blend(slot, [IDX.lxx, IDX.lxy, IDX.lyy, IDX.cx, IDX.cy], 8); tagC(slot); body.give(slot, { vx: e.nx * 0.7, vy: e.ny > 0.5 ? 2.2 : 0, spin: 0 }); addCarry(s, 0.8, -Math.sign(e.nx) || 1); s.big = { kind: 'splat' }; } });
    it.handle = null; startClip(s, slot, s.queue.shift()); tagC(slot);
  }
  function crack(s, slot, e, p) {
    const def = MV.crack_hit, x0 = body.x[slot], y0 = body.y[slot], th = body.th[slot]; body.claim(slot); if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; unwind(slot);
    const scT = makeTrack('scale', [[0, 1], [6, 2.2, 'in'], [8, 2.45, 'out'], [70, 2.45, 'lin'], [110, 2.38, 'lin']], {}), rollTo = Math.round(th / TAU) * TAU;
    // he comes off the edge AT THE GLASS: bigger for 6 frames (toward you), flat on it, slides down the inside of your screen, then gravity has him
    const xin = clamp(x0, room.left + 1.55, room.right - 1.55), yin = clamp(y0, room.floor + 1.7, room.ceiling - 1.5);
    const it = push(s, 'crack_hit', { def: { len: 110, contacts: [6] }, quiet: 1, blend: 0, steps(c, fi, V_) {
      const k = evalTrack(scT, c.f); setScale(slot, k); c.scaled = true; c.scaleNow = k;
      if (fi <= 8) { ctx.tag(slot, TAG.approach | TAG.contact); }
      const u = EASE.in(Math.min(1, c.f / 6)); V_.x = x0 + (xin - x0) * u; V_.roll = th + (rollTo - th) * EASE.out(Math.min(1, c.f / 8)); V_.pivotCentre = true;
      const sl = c.f > 70 ? -0.55 * EASE.in(Math.min(1, (c.f - 70) / 40)) : 0; V_.y = y0 + (yin - y0) * u + sl;
      V_.sy = fi < 6 ? 1.08 : fi < 8 ? 1 : 0.93; V_.sx = fi < 8 ? 1 : 1.07; V_.sxKeyed = fi >= 8; V_.pitch = c.f < 6 ? 0 : 0.2 * EASE.out(Math.min(1, (c.f - 6) / 2));
      if (fi >= 6 && fi < 16) { V_.glitch = fi < 11 ? 0.6 : 0.25; if (fi === 6 || fi === 11) ctx.tag(slot, TAG.glitch_step); } else if (fi === 16) ctx.tag(slot, TAG.glitch_step);
      if (fi === 6) { emit('cracked', { slot, x: e.x, y: e.y, at: [V_.x, V_.y], speed: e.speedInto }); rig.kick(slot, 'wob', 2.2); }
      if (fi >= 6) { V_.gx = -0.5; V_.eyesKeyed = true; s.exprNow = 0; V_.lidL = V_.lidR = -0.35; }           // face flat on the glass, eyes on you, no expression
    }, end(c) { const k0 = c.scaleNow || 1; let f = 0; const shrink = () => { f++; const kk = 1 + (k0 - 1) * (1 - EASE.in(Math.min(1, f / 14))); setScale(slot, kk); if (f < 14 && st[slot] === s) clock.after(1, shrink); else setScale(slot, 1); }; c.scaled = false; shrink();
      tagC(slot); body.give(slot, { vx: 0, vy: 0, spin: 0 }); addCarry(s, 0.8); s.big = { kind: 'crack', x: e.x, y: e.y }; } });
    it.handle = null; startClip(s, slot, s.queue.shift()); ctx.tag(slot, TAG.approach | TAG.contact);
  }
  function through404(s, slot, nx, ny, asked) {
    const def = MV.through_404, x0 = body.x[slot], y0 = body.y[slot], th = body.th[slot]; if (asked) s.hole = { x: x0, y: y0 }; if (!asked) { body.claim(slot); if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; }
    const scT = makeTrack('scale', def.tracks.scale_all, {}), side = nx ? -Math.sign(nx) : (x0 > (room.left + room.right) / 2 ? 1 : -1);
    const it = push(s, 'through_404', { def: { len: 12, contacts: [0] }, quiet: 1, blend: 0, steps(c, fi, V_) {
      const k = evalTrack(scT, c.f); setScale(slot, k); c.scaled = true; if (!asked) { V_.x = x0; V_.y = y0; V_.roll = th; V_.pivotCentre = true; } V_.sy = 1.1;
      V_.glitch = fi < 5 ? 0.9 : fi < 10 ? 0.6 : 1; if (fi === 0 || fi === 5 || fi === 10) ctx.tag(slot, TAG.glitch_step); ctx.tag(slot, TAG.approach);
    }, end(c) { c.scaled = false; setScale(slot, 1); show(s, slot, false); body.vanish(slot); emit('went_through', { slot, x: x0, y: y0, side }); s.goneSide = side;
      const ps = def.then.pause_s, wait = Math.round(rng.range(s.rnd, ps[0], ps[1]) * 60); s.backAt = clock.k + (FLAGS.fast_404 ? 90 : wait); } });
    if (!asked) { it.handle = null; startClip(s, slot, s.queue.shift()); tagC(slot); }
  }
  function walkBackIn(s, slot, side) {            // he comes back from the EDGE of the screen, not from the hole. He has been somewhere. He is not going to discuss it.
    const xe = side > 0 ? room.right + 0.6 : room.left - 0.6, xin = side > 0 ? room.right - 1.0 : room.left + 1.0;
    if (body.mode[slot] === MODE.gone) { body.appear(slot, xe); unwind(slot); body.th[slot] = 0; }
    s.x = xe; ch.handoff(slot, IDX.x, xe, 0); ch.handoff(slot, IDX.y, room.floor + A, 0); ch.handoff(slot, IDX.roll, 0, 0); ch.blend(slot, null, 0); show(s, slot, true); addCarry(s, 0.5, -side);
    walkItems(s, slot, xin, { gait: 'walk', speed: 0.7 }); hold(s, 12, {});
    // round 3 (comedian, A9): on the stop he turns and looks back at where the hole is (40), then at you (50). The hole shuts 24 f into the look at you, behind him.
    if (s.hole) lookThing(s, slot, s.hole, 40, { x: xin });
    return lookYou(s, slot, 50, { at: [{ f: 24, fn: () => emit('hole_shut', { slot, by: 'moves' }) }] });
  }

  // ------------------------------------------------------------------ one step
  function step(p) {
    const slot = p.slot, s = st[slot], m = body.mode[slot]; if (!s) return; s.mode = m;
    if (m === MODE.gone) { if (s.backAt && clock.k >= s.backAt) { s.backAt = 0; walkBackIn(s, slot, -(s.goneSide || 1)); } /* round 3 (ruling): the OPPOSITE edge. He went through there; he comes back from somewhere you were not watching. */ else return; }
    const b = breath(s), cy = carryNow(s); s.f++;
    if (s.blendAt === clock.k) endBlend(s, slot, false);
    // rest targets
    V.x = s.x; V.y = room.floor + A; V.roll = s.restRoll + (s.leanRoll || 0) + 0.045 * cy * (s.carry ? s.carry.side : 0); V.pitch = 0; V.shear = s.restShear; V.sy = 1 - 0.025 * cy; V.sx = NaN; V.sxKeyed = false; V.pivot = 0; V.pivotCentre = false;
    s.yawW += clamp((s.yawWalk || 0) - s.yawW, -0.05, 0.05); V.dy = 0; V.yaw = s.yaw + s.yawW; V.knows = false; V.flat = 0; V.lidL = 0; V.lidR = 0; V.gx = 0; V.gy = 0; V.browL = 0; V.browR = 0; V.jaw = 0; V.glitch = 0; V.eyesKeyed = false; V.ownXY = true; V.breath = 1;
    const mm = body.mode[slot];
    if (mm === MODE.held) {                                                   // ---- hang (the engineer's, kept) + a face
      if (s.base !== 'hang') { if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; const gap = Math.abs(ch.get(slot, IDX.sy) - (1 + HG.stretch_base)); s.base = 'hang'; s.f = 0; s.sw = s.swV = 0; s.hvx = body.vx[slot]; s.hangBlinkAt = 90; s.hangSy = Math.min(1 + cap, Math.max(1 - cap, ch.get(slot, IDX.sy)));
        ch.blend(slot, [IDX.sy, IDX.pivot, IDX.shear, IDX.dy, IDX.pitch], Math.max(HG.blend_f, Math.ceil(gap * 1.875 / 0.024))); ch.blend(slot, [IDX.sx], 0); emit('move', { slot, move: 'hang' });
        const g = MV.grab.tracks; layer(s, 'grab', { lidR: [...g.lidR, [30, -0.6, 'lin'], [44, 0, 'io']], lidL: [...g.lidL, [32, -0.6, 'lin'], [48, 0, 'io']], browR: [...g.browR, [30, 0.4, 'lin'], [46, 0, 'spring']] }); s.gazeHold = { target: 'cursor', until: clock.k + 1e7, fixAt: 0 }; }
      const H = body.hold[slot]; V.ownXY = false;
      if (H.root > 0) { if (!s.rooted) s.rootSy = 1; s.rooted = true; s.rootSy += clamp(1 + (RT.stretch_at_full || 0.12) * body.strain[slot] - s.rootSy, -0.02, 0.02); V.pivot = 0; V.sy = s.rootSy; V.shear = -(RT.lean_at_full_bh || 0.06) * body.strainX[slot]; V.breath = 0; }
      else { if (s.rooted) { s.rooted = false; ch.blend(slot, [IDX.sy, IDX.pivot, IDX.shear], 10); }
        V.pivot = A + H.gy; V.shear = 0; const want = Math.min(1 + cap, 1 + HG.stretch_base + HG.stretch_per_speed * Math.hypot(body.vx[slot], body.vy[slot])); s.hangSy += clamp(want - s.hangSy, -0.012, 0.012); V.sy = s.hangSy; V.breath = 1;
        // round 3 (A7): his bottom swings on every change of the hand's speed and keeps swinging after the hand stops (two swings you can see). Breath on, one slow blink.
        const HS = D.hang_swing || { omega: 10, zeta: 0.13, gain: 0.2, max_acc: 60 }, ax = clamp((body.vx[slot] - s.hvx) * 60, -HS.max_acc, HS.max_acc); s.hvx = body.vx[slot];
        s.swV += (-HS.omega * HS.omega * s.sw - 2 * HS.zeta * HS.omega * s.swV + HS.gain * ax * HS.omega * HS.omega / 60) / 60; s.sw += s.swV / 60; V.shear = clamp(s.sw, -0.13, 0.13);
        if (s.f === s.hangBlinkAt) { const m = MV.slow_blink.tracks; layer(s, 'slow_blink', { lidR: m.lidR, lidL: m.lidL }); s.hangBlinkAt = s.f + Math.round(rng.range(s.rnd, 300, 540)); } }
      // pressed into an edge while held: he gives way along it (drag_squish), enduring it
      const pr = body.press[slot]; s.press += clamp((pr > 0.02 ? Math.min(1, pr / 0.6) : 0) - s.press, -0.03, 0.03); if (s.press > 0.01) { V.sy -= (deep ? 0.5 : 0.1) * s.press; V.lidL = V.lidR = 0.3 * s.press; V.browR = -0.2 * s.press; }
    } else if (mm === MODE.free) {                                             // ---- air: nothing keyed. The face is FLAT for the whole flight.
      if (s.base !== 'air') { if (s.clip && !s.clip.item.claimed) endClip(s, slot, 'cut'); s.base = 'air'; s.f = 0; ch.blend(slot, [IDX.sy, IDX.pivot, IDX.shear, IDX.dy, IDX.pitch], 12); ch.blend(slot, [IDX.sx], 0); emit('move', { slot, move: 'air' }); s.gazeHold = null; s.gT = [0, 0]; s.fast = 0; s.press = 0; }
      V.ownXY = false; V.pivot = A; V.breath = 0;
      s.fast = Math.hypot(body.vx[slot], body.vy[slot]) > 9 ? s.fast + 1 : 0; if (s.fast > 20) s.gT = [-0.5, 0];           // the one exception: he looks at you, mid-air, as he goes past
    } else if (mm === MODE.down) {                                             // ---- down: lying where he stopped, deciding whether that happened
      if (s.base !== 'down') { s.base = 'down'; s.f = 0; ch.blend(slot, [IDX.sy, IDX.pivot, IDX.shear, IDX.dy, IDX.pitch], 10); const h = MV.down.hold_f; s.hold = Math.round(rng.range(s.rnd, h[0], h[1])); s.x = body.x[slot]; s.roll0 = body.th[slot]; emit('move', { slot, move: 'down' }); s.gazeHold = null; s.gT = [0, 0]; clock.after(Math.round(s.hold * 0.55), () => { if (st[slot] === s && s.base === 'down') blinkNow(s, 'normal'); }); scheduleBlink(s, 400); }
      V.x = s.x; V.y = body.restY(slot); V.roll = s.roll0; V.sy = 0.92; V.pivot = A; V.breath = 1.5; if (Math.abs(Math.atan2(Math.sin(s.roll0), Math.cos(s.roll0))) > 2) V.knows = true; /* round 3 (HE KNOWS, Potato seat) */
      if (s.f > s.hold) { unwind(slot); s.roll0 = body.th[slot]; const r0 = s.roll0, sg = Math.sign(r0) || 1, act = Math.max(28, Math.ceil(Math.abs(r0) * 1.14 * 1.5 / 0.17)), e = 18 + act;
        s.keysRoll = [[0, r0], [18, r0 * 1.08], [e, -0.06 * sg], [e + 30, 0]]; s.keysSy = [[0, 0.92], [18, 0.88], [18 + act * 0.43, 1.04], [e, 0.96], [e + 30, 1]]; s.keysDy = [[18, 0], [18 + act * 0.43, 0.04, 'out'], [e, 0, 'in']]; s.len = e + 30; s.kickAt = e + 1;
        body.claim(slot); s.base = 'get_up'; s.f = 0; emit('move', { slot, move: 'get_up' });
        layer(s, 'get_up', { lidR: [[0, 0], [18, 0.3, 'io'], [e + 4, 0, 'io']], lidL: [[0, 0], [18, 0.35, 'io'], [e + 8, 0, 'io']] }); }
    } else if (mm === MODE.clip && s.base === 'get_up') {                      // ---- get_up: reluctant. Into the floor first, then up, one overshoot
      const f = s.f, K = (keys, ff) => { if (ff <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (ff <= keys[i][0]) { const a = keys[i - 1], c = keys[i], u = (ff - a[0]) / (c[0] - a[0]); return a[1] + (c[1] - a[1]) * (EASE[c[2]] || io)(u); } return keys[keys.length - 1][1]; };
      V.roll = K(s.keysRoll, f) + (s.restRoll + 0.045 * cy * (s.carry ? s.carry.side : 0)) * io(Math.min(1, f / s.len)); V.sy = K(s.keysSy, f); V.dy = K(s.keysDy, f); V.x = s.x; V.y = body.restY(slot); V.pivot = A * (1 - io(Math.min(1, f / s.len)));
      if (Math.abs(Math.atan2(Math.sin(V.roll), Math.cos(V.roll))) > 2) V.knows = true;
      if (f === s.kickAt) rig.kick(slot, 'wob', 1.4);
      if (f >= s.len) { body.setMode(slot, MODE.ground, 'got up'); s.base = 'stand'; s.f = 0; s.blendAt = clock.k + 1; /* round 3: the hand-over from the get-up to standing is blended (carry's 2% sat on one frame) */ emit('move', { slot, move: 'stand' }); emit('got_up', { slot }); scheduleBlink(s, 40);
        if (afterBig(s, slot, p)) { /* round 3: the look after, inside the gag */ }
        else if (s.afterLand) { const fn = s.afterLand; s.afterLand = null; fn(); }
        else if (!ctx.brain) { s.sawToggle = !s.sawToggle; if (s.sawToggle) look(p, 'user', { hold_f: Math.round(rng.range(s.rnd, 24, 72)) }); else push(s, 'turn_small', { opts: { to: s.yaw - 0.4 }, end() { clock.after(90, () => { if (st[slot] === s && !s.clip && s.mode === MODE.ground) push(s, 'turn_small', { opts: { to: 0 } }); }); } }); } }
    } else if (mm === MODE.clip) {                                             // ---- a claimed contact clip owns him (splat, crack, the 404)
      V.ownXY = true; V.breath = 0; s.base = 'clip';
    } else {                                                                   // ---- ground
      if (s.base !== 'stand') { const was = s.base; unwind(slot); s.x = body.x[slot]; s.base = 'stand'; s.f = 0; blend(slot, ['sy', 'pivot', 'shear', 'roll', 'dy', 'pitch'], 1); ch.blend(slot, [IDX.x, IDX.y], 12); ch.blend(slot, [IDX.sx], 0); emit('move', { slot, move: 'stand' }); V.x = s.x;
        if (was === 'hang') { s.gazeHold = null; clock.after(36, () => { if (st[slot] === s && s.mode === MODE.ground) look(p, 'user', { hold_f: 30 }); }); }      // set down: the last thing that moves is a look at your hand
        if (was === 'air' && s.big) afterBig(s, slot, p);
        else if (was === 'air' && s.afterLand) { const fn = s.afterLand; s.afterLand = null; clock.after(20, fn); } }
      if (s.floor !== room.floor) { if (s.floor != null) { ch.blend(slot, [IDX.y], Math.max(8, Math.ceil(Math.abs(room.floor - s.floor) * 1.875 / 0.034))); rig.kick(slot, 'squash', -1.2); } s.floor = room.floor; }
      if (!s.clip && s.queue.length) { const it = s.queue.shift(); if (it.handle && it.handle.cancelled) { it.handle.done = true; } else startClip(s, slot, it); }
    }
    if (s.clip && (body.mode[slot] === MODE.ground || body.mode[slot] === MODE.clip)) stepClip(s, slot);
    const quiet = s.clip ? Math.max(s.clip.quiet, s.clip.quietNow || 0) : 0;
    alwaysOn(s, slot, quiet, !V.eyesKeyed);
    // BRACE: a hand that has thrown him comes in fast. He leans a hair away before it lands. Nothing on his face.
    if (FLAGS.brace && body.mode[slot] === MODE.ground) { const c = senses.cursor, g = body.grudge[slot] || 0, heat = Math.min(1, (s.thrownN || 0) / (BRACE.full_after_throws || 3)); let want = 0;
      if (heat > 0 && c.seen && !c.gone && !c.down) { const dx = body.x[slot] - c.x, dy = body.y[slot] - c.y, d = Math.hypot(dx, dy), vx = (c.x - s.cpx) * 60, vy = (c.y - s.cpy) * 60, closing = d > 1e-3 ? (vx * dx + vy * dy) / d : 0;
        if (d < (BRACE.within_bh || 2.2) && closing > (BRACE.closing_bh_s || 3)) s.braceHold = BRACE.hold_f || 26; if (s.braceHold > 0) { s.braceHold--; want = heat * (Math.sign(dx) || 1); } }
      s.cpx = c.x; s.cpy = c.y; s.brace += clamp(want - s.brace, -0.06, 0.12); void g;
      if (Math.abs(s.brace) > 1e-3) { V.shear += (BRACE.shear || 0.03) * s.brace; V.roll += -(BRACE.roll || 0.025) * s.brace; V.sy -= (BRACE.sy || 0.02) * Math.abs(s.brace); const l = (BRACE.lids || 0.15) * Math.abs(s.brace); V.lidL += l; V.lidR += l; }
      if (s.thrownN > 0 && clock.k - s.thrownK > (BRACE.forget_s || 90) * 60) { s.thrownN--; s.thrownK = clock.k; } }
    // round 3 (A1, m02): the cursor stays near him: eyes (always-on), then a LEAN you can see from across the room, then (no brain) a turn. Three steps.
    { const c = senses.cursor, nearC = body.mode[slot] === MODE.ground && !s.clip && !s.queue.length && c.seen && !c.gone && !c.down && Math.hypot(c.x - body.x[slot], c.y - body.y[slot]) < 1.75 && cy < 0.15;
      s.watchF = nearC ? s.watchF + 1 : Math.max(0, Math.min(s.watchF, 300) - 5); if (nearC) s.watchDir = Math.sign(c.x - body.x[slot]) || 1;
      const NW = D.nosy_watch || { lean_after_f: 110, turn_after_f: 280, give_up_f: 620, shear: 0.085, turn: 0.5 }, on = nearC && s.watchF < NW.give_up_f;
      s.nosyL += clamp((on && s.watchF > NW.lean_after_f ? 1 : 0) - s.nosyL, -0.03, 0.04); s.nosyT += clamp((on && !ctx.brain && s.watchF > NW.turn_after_f ? 1 : 0) - s.nosyT, -0.04, 0.03);
      if (s.nosyL > 1e-3) { const u = io(s.nosyL) * s.watchDir; V.shear += NW.shear * u; V.roll += -0.03 * u; V.sy += 0.02 * io(s.nosyL); } if (s.nosyT > 1e-3) V.yaw += NW.turn * io(s.nosyT) * s.watchDir; }
    // layers on top (offsets from rest)
    for (let i = s.layers.length - 1; i >= 0; i--) { const L = s.layers[i]; L.f += L.rate; for (const t of L.T) { const v = evalTrack(t, L.f); if (v == null) continue; const n = t.name;
        if (n === 'sy') V.sy += v - 1; else if (n === 'lidL' || n === 'lidR') V[n] = v >= 0 ? V[n] + v * (1 - Math.max(0, V[n])) : Math.min(V[n], 0) + v * (1 - Math.max(0, V[n])); else if (n in V) V[n] += v; }
      if (L.f >= L.len) s.layers.splice(i, 1); }
    s.qS = quiet > (s.qS || 0) ? quiet : Math.max(quiet, (s.qS || 0) - 0.07);          // round 3: a quiet clip lets the breath back in over 14 f (it popped in on one frame: 1.6% of the range)
    if (s.bHold > 0) { s.bHold--; s.bF = 0; } else V.sy += b * s.bDepth * V.breath * (1 - s.qS);
    V.browR += 0.03 * b * (1 - s.qS); V.shear += 0.004 * b * (1 - s.qS);
    if (s.browHold) { if (clock.k > s.browHold.until) s.browHold = null; else if (!s.clip) { V.browR += s.browHold.R; V.browL += s.browHold.L; } }
    // eyes: the fastest thing on him (gaze spring), never smooth pursuit
    if (!V.eyesKeyed) { const sp = SPR.gaze, w = sp.omega, z = sp.zeta, dt = 1 / 60, dr = 0.02 * Math.sin(clock.k / (70 + s.driftP)) * (s.gT[0] < -0.06 ? 1 : 0);
      s.gV += (-w * w * (s.gX - (s.gT[0] + dr)) - 2 * z * w * s.gV) * dt; s.gX += s.gV * dt; s.gVy += (-w * w * (s.gY - s.gT[1]) - 2 * z * w * s.gVy) * dt; s.gY += s.gVy * dt; V.gx = clamp(s.gX, -1, 0.02); V.gy = s.gY; }
    else { s.gX = V.gx; s.gY = V.gy; s.gV = s.gVy = 0; }
    // round 3 (HE KNOWS): upside down and not flying, the lids drop, the arc over his eye goes flat (upside down it is a smile) and he looks at you until he is up
    s.kn += clamp((V.knows && FLAGS.knows !== false ? 1 : 0) - s.kn, -0.12, 0.34); if (s.kn > 0.01) { V.lidL = Math.max(V.lidL, 0.45 * s.kn); V.lidR = Math.max(V.lidR, 0.45 * s.kn); V.flat = s.kn; if (s.kn > 0.5) { V.gx = -0.5; s.gX = -0.5; s.gV = 0; } }
    // round 3 (PINK): his glitch is off, or it is 0.8 and up. Part strength is a salmon potato.
    if (V.glitch > 0) V.glitch = V.glitch < 0.3 ? 0 : Math.max(0.8, V.glitch);
    // his top arrives late (secondary.top_lag): on the ground, from his own travel
    if (V.ownXY && s.base === 'stand') { const vx = (V.x - s.px) * 60; s.lag += (clamp(-vx * D.secondary.top_lag.lag_s, -0.12, 0.12) - s.lag) * 0.16; V.shear += s.lag; } else s.lag *= 0.8;
    s.px = V.x;
    // ---- write the targets
    const claimed = s.clip && s.clip.strain;
    if (V.ownXY && (body.mode[slot] === MODE.ground || body.mode[slot] === MODE.clip || body.mode[slot] === MODE.down)) { ch.set(slot, IDX.x, V.x); ch.set(slot, IDX.y, V.y); ch.set(slot, IDX.roll, V.roll); }
    let sy = capMap(V.sy, cap, deep), sx = V.sxKeyed ? (deep ? V.sx : 1 + (V.sx - 1) * 0.35) : NaN;
    ch.set(slot, IDX.sy, sy); ch.set(slot, IDX.sx, sx); ch.set(slot, IDX.pivot, V.pivotCentre ? A : V.pivot); ch.set(slot, IDX.shear, clamp(V.shear, -0.14, 0.14)); ch.set(slot, IDX.dy, V.dy); ch.set(slot, IDX.pitch, V.pitch);
    ch.set(slot, IDX.yaw, body.mode[slot] === MODE.ground || s.clip ? V.yaw : 0); if (V.glitch !== 0 || s.glOn) { ch.set(slot, IDX.glitch, V.glitch); s.glOn = V.glitch !== 0; }
    if (s.closedUntil > clock.k || s.asleep) { V.lidL = V.lidR = 1; }
    { const hi = Math.max(V.lidL, V.lidR), lo = Math.min(V.lidL, V.lidR); s.wk = hi > 0.85 && lo < 0.3 ? s.wk + 1 : 0; if (s.wk > 2) { if (V.lidL < V.lidR) V.lidL = V.lidR - 0.3; else V.lidR = V.lidL - 0.3; } }   // round 3 (THE WINK): one lid shut and one open, 2 frames at most, whoever asked
    const fo = s.face; fo.lidL = clamp(V.lidL, -1, 1); fo.lidR = clamp(V.lidR, -1, 1); fo.gx = V.gx; fo.gy = V.gy; fo.browL = V.browL; fo.browR = V.browR; fo.jaw = V.jaw; fo.expr = s.exprNow || 0; fo.flat = V.flat;
    ch.set(slot, IDX.lidL, clamp(V.lidL, -1, 1)); ch.set(slot, IDX.lidR, clamp(V.lidR, -1, 1)); ch.set(slot, IDX.gx, V.gx); ch.set(slot, IDX.gy, V.gy); ch.set(slot, IDX.browL, V.browL); ch.set(slot, IDX.browR, V.browR); ch.set(slot, IDX.jaw, V.jaw); ch.set(slot, IDX.expr, s.exprNow || 0);
    if (claimed) { const q = s.clip.strain; ch.set(slot, IDX.lxx, q[0]); ch.set(slot, IDX.lxy, q[1]); ch.set(slot, IDX.lyy, q[2]); ch.set(slot, IDX.cx, q[3]); ch.set(slot, IDX.cy, q[4]); }
  }

  const moves = {
    name: 'moves.json v' + D.version + ' (animator)', play, look, lookAfter, has: m => !!MV[m], list: () => Object.keys(MV),
    walkTo(id, x, o) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); if (!p) return null; const h = { done: false, phase: 'queued' }; const it = walkItems(st[p.slot], p.slot, x, o); it.handle = h; return h; },
    /** YOU DRIVE (Claude, Nov 12 2026; Chikin: "you should be able to take control of potato"). dir = -1 left, +1 right, 0 let go.
     *  It is his own walk (the same clips, the same feet), started and stopped by a hand on the keys instead of by his brain: whatever he was
     *  doing is cut the way a grab cuts it, and he walks until told to stop or until the wall. Only on the ground; in the air it does nothing. */
    drive(id, dir) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); if (!p) return false; const slot = p.slot, s = st[slot];
      if (!s || body.mode[slot] !== MODE.ground) return false; dir = Math.sign(dir || 0); if (dir) s.ducking = false;
      const here = () => { s.x = body.x[slot]; };                                     // a cut walk keeps the ground it covered: he stops where he is, never back where the walk began
      if (!dir) { if (s.driveDir) { s.driveDir = 0; here(); if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; if (s.walking) stopFeet(s, slot); s.gazeHold = null; s.yawWalk = 0; } return true; }   /* (yawWalk: a cut walk never reaches walk_stop, which is what turns him back to the front) */
      if (s.driveDir === dir && (s.walking || s.queue.length)) return true;
      here(); if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; if (s.walking) stopFeet(s, slot);
      const edge = dir > 0 ? room.right - 0.6 : room.left + 0.6; if ((edge - s.x) * dir < 0.15) { s.driveDir = 0; return true; }   // (at or past the wall: nowhere to go)
      const D = (ctx.data.physics.drive || {});
      s.driveDir = dir; walkItems(s, slot, edge, { gait: 'walk', quick: true, tempo: D.tempo || 2, speed: D.stride || 3.2, maxStride: 4, then() { s.driveDir = 0; } }); return true; },
    /** PUT HIM SOMEWHERE on the floor, at once (a glitch away: the page glitches him, moves him, glitches him). Only while he stands. */
    place(id, x) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); if (!p) return false; const slot = p.slot, s = st[slot];
      if (!s || body.mode[slot] !== MODE.ground) return false; if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; if (s.walking) stopFeet(s, slot); s.driveDir = 0; s.ducking = false; s.yawWalk = 0; s.gazeHold = null;
      x = clamp(x, room.left + 0.6, room.right - 0.6); body.x[slot] = x; s.x = x; s.px = x; return true; },
    /** SPIN (Chikin, Nov 13: "or flip, or spin"): one whole turn on the spot, then facing the way he was. dir: +1 | -1 */
    spin(id, dir = 1) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); if (!p) return false; const slot = p.slot, s = st[slot];
      if (!s || body.mode[slot] !== MODE.ground || s.spinning) return false; const TAU2 = Math.PI * 2, y0 = s.yaw, d = dir < 0 ? -1 : 1;
      s.x = body.x[slot]; if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; if (s.walking) stopFeet(s, slot); s.driveDir = 0; s.ducking = false; s.yawWalk = 0; s.gazeHold = null; s.spinning = true;
      push(s, 'spin', { def: { len: 50, tracks: { yaw: [[0, y0], [48, y0 + d * TAU2, 'io']], sy: [[0, 1], [6, 0.92, 'out3'], [40, 1.04, 'io'], [50, 1, 'io']] } }, keepYawOff: true, blend: 1,
        end() { s.spinning = false; ch.shift(slot, IDX.yaw, -d * TAU2); const g = rig.get(slot); if (g) { if (g.yawCmd != null) g.yawCmd -= d * TAU2; if (g.S && g.S.yaw) { g.S.yaw.x -= d * TAU2; g.S.yaw.to -= d * TAU2; } } } }); return true; },
    /** DUCK (Chikin, Nov 13: "he doesnt duck either"): held low and wide for as long as the key is down; let go and he springs back up. */
    duck(id, on) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); if (!p) return false; const slot = p.slot, s = st[slot];
      if (!s || body.mode[slot] !== MODE.ground) return false;
      if (on) { if (s.ducking && s.clip) return true; s.x = body.x[slot]; if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; if (s.walking) stopFeet(s, slot); s.driveDir = 0; s.gazeHold = null; s.ducking = true;
        hold(s, 60 * 600, { id: 'duck', tracks: { sy: [[0, 1], [5, 0.56, 'out3']], sx: [[0, 1], [5, 1.24, 'out3']] } }); return true; }
      if (s.ducking) { s.ducking = false; if (s.clip) endClip(s, slot, 'cut'); s.queue.length = 0; } return true; },
    driving(id) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); return p && st[p.slot] ? (st[p.slot].driveDir || 0) : 0; },
    carriage(id, moods) { const p = typeof id === 'object' ? id : ctx.potatoes.find(q => q.id === id || q.slot === id); if (p && st[p.slot]) st[p.slot].moods = moods; },
    debug(slot) { const s = st[slot]; return s ? +s.brace.toFixed(3) : 0; },
    /** what the face plug-in draws: MY face values for this step (so nothing that writes the channels after me can blank a blink) */
    faceOut(slot) { const s = st[slot]; return s ? s.face : null; },
    // the brain's overlay stands down for these (engine/behaviour/perform.mjs). 'face' and 'glitch' are asked for on the board.
    claims: ['x', 'yaw', 'pose', 'face', 'glitch'],
    /** every beat of a behaviour, as the brain plays it (perform.mjs startBeat). Its verbs become my moves; nothing here is a stand-in. */
    beat(p, b, info = {}) {
      const s = st[p.slot]; if (!s || !b) return; const slot = p.slot, F = Math.max(8, info.frames || 30), side = info.side || 1, mid = v => (Array.isArray(v) ? (v[0] + v[1]) / 2 : v), c = senses.cursor;
      const dirOf = t => (t === 'sideA' ? side : t === 'sideB' ? -side : t === 'other' && info.other != null ? Math.sign(body.x[info.other] - s.x) || side : (t === 'cursor' || t === 'cursor_rest' || t === 'text' || t === 'thing' || t === 'prop') && c.seen ? Math.sign(c.x - s.x) || side : t === 'away_from_other' && info.other != null ? -Math.sign(body.x[info.other] - s.x) || side : t === 'edge' ? (s.x > (room.left + room.right) / 2 ? 1 : -1) : side);
      if (b.look != null) { const t = b.look; if (t === 'home') look(p, 'home'); else if ((t === 'cursor' || t === 'cursor_rest' || t === 'text' || t === 'thing' || t === 'prop') && c.seen) look(p, 'cursor', { hold_f: F + 12 }); else if (t === 'other' && info.other != null) look(p, info.other, { hold_f: F + 12 });
        else s.gazeHold = { gx: t === 'up' || t === 'down' || String(t).startsWith('self') ? -0.35 : dirOf(t) < 0 ? -0.9 : 0, gy: t === 'up' ? -0.3 : t === 'down' || String(t).startsWith('self') ? 0.45 : 0, until: clock.k + F + 12 }; }
      if (b.blink) { if (b.blink === 'hold_closed') s.closedUntil = clock.k + F; else blinkNow(s, b.blink === 'slow' ? 'slow' : b.blink === 'double' ? 'double' : 'normal'); }
      if (b.sleep != null) s.asleep = !!b.sleep;
      if (s.mode !== MODE.ground) return;
      if (b.turn) { const tn = b.turn, amt = tn.amount == null ? 1 : tn.amount; let to = tn.by != null ? s.yaw + mid(tn.by) * side : tn.to === 'home' || tn.to === 'front' ? 0 : tn.to === 'back' ? Math.PI * (Math.sign(s.yaw) || side) : tn.to === 'behind' ? -(Math.sign(s.yaw) || side) * 0.9 * amt : dirOf(tn.to) * 0.85 * amt;
        if (Math.abs(to - s.yaw) > 0.04) push(s, Math.abs(to - s.yaw) < 0.6 ? 'turn_small' : Math.abs(to - s.yaw) > 2.4 ? 'about_face' : 'turn_big', { opts: { to }, rate: tn.speed === 'slow' ? 0.7 : tn.speed === 'fast' ? 1.3 : 1 }); }
      if (b.walk) { const wk = b.walk, d = dirOf(wk.to || 'sideA'); let x = wk.to === 'home_spot' || wk.to === 'spot' ? s.home : wk.to === 'cursor' && c.seen ? c.x - d * 0.6 : wk.to === 'edge' ? (d < 0 ? room.left + 0.62 : room.right - 0.62) : wk.to === 'other' && info.other != null ? body.x[info.other] - d * 1.1 : s.x + d * mid(wk.body_widths == null ? 1 : wk.body_widths);
        x = clamp(x, room.left + 0.62, room.right - 0.62); if (Math.abs(x - s.x) > 0.1) walkItems(s, slot, x, { gait: wk.speed === 'slow' || Math.abs(x - s.x) < 0.5 ? 'waddle' : 'walk', speed: wk.speed === 'fast' ? 1.3 : 1 }); }
      if (b.slide) { const x = clamp(s.x + dirOf(b.slide.to || 'sideA') * mid(b.slide.body_widths || 0.2), room.left + 0.62, room.right - 0.62); if (Math.abs(x - s.x) > 0.1) walkItems(s, slot, x, { gait: 'waddle' }); }
      const a = Math.min(10, F * 0.3), z = Math.max(a + 1, F - 12);
      if (b.lean) { const l = b.lean, amt = l.amount === 'matches_cursor_advance' ? 0.08 : mid(l.amount == null ? 0 : l.amount); if (amt) { if (l.z) layer(s, 'lean', { pitch: [[0, 0], [a, (l.z === 'forward' ? 1 : -1) * amt * 1.2, 'io'], [z, (l.z === 'forward' ? 1 : -1) * amt * 1.2, 'lin'], [F + 6, 0, 'io']] }); else { const v = dirOf(l.toward || l.x || 'sideA') * Math.min(0.13, amt * 1.2); /* round 3 (A1): a lean has to read at 100 px */ layer(s, 'lean', { shear: [[0, 0], [3, -0.15 * v, 'io'], [a + 3, v, 'io'], [z, v * 0.9, 'lin'], [F + 8, 0, 'io']], roll: [[0, 0], [a + 3, -0.5 * v, 'io'], [z, -0.45 * v, 'lin'], [F + 8, 0, 'io']] }); } } }
      if (b.squash && b.squash.hold !== false && b.squash.to != null) { const v = clamp(mid(b.squash.to), 1 - cap, 1 + cap); layer(s, 'squash', { sy: [[0, 1], [a, v, 'io'], [z, v, 'lin'], [F + 10, 1, 'io']] }); }
      if (b.bob) { const arg = info.other != null, n = Math.max(1, Math.round(mid(b.bob.n))), amp = arg ? clamp(mid(b.bob.amount), 0.07, 0.09) : Math.min(0.09, mid(b.bob.amount)), K = [[0, 1]]; /* round 3 (comedian): 2 to 4.6% was 2 to 4 pixels. 7 to 9% in an argument, tipped at the other one */ for (let i = 0; i < n; i++) { const t0 = F * i / n, t1 = F * (i + 1) / n; K.push([t0 + (t1 - t0) * 0.4, 1 - amp, 'io'], [t1, 1 + (i === n - 1 ? 0 : amp * 0.3), 'io']); } const Lr = { sy: K }; if (arg) { const d = dirOf('other') * 0.06, S = [[0, 0]]; for (let i = 0; i < n; i++) { const t0 = F * i / n, t1 = F * (i + 1) / n; S.push([t0 + (t1 - t0) * 0.4, d, 'io'], [t1, 0, 'io']); } Lr.shear = S; } layer(s, 'bob', Lr); }
      if (b.hop) play(p, 'hop', { height: clamp(mid(b.hop.h), 0.05, 0.4) });
      if (b.lunge) { const amt = mid(b.lunge.amount == null ? (b.lunge.body_widths || 0) : b.lunge.amount); if (amt) play(p, 'bump', { target: b.lunge.toward === 'other' && info.other != null ? info.other : 'cursor' }); }
    },
    busy(p) { const s = st[p.slot]; return !!(s && (s.clip || s.queue.length || s.base !== 'stand')); },
    add(p) { const r = rng.stream(p.id, 'moves'); const s = st[p.slot] = { rnd: r, f: 0, base: 'stand', mode: MODE.ground, x: body.x[p.slot], px: body.x[p.slot], yaw: 0, restRoll: 0, restShear: 0, layers: [], queue: [], clip: null, serial: 0, vars: {}, gT: [0, 0], gX: 0, gY: 0, gV: 0, gVy: 0, fixUntil: 0, gazeHold: null,
        face: { lidL: 0, lidR: 0, gx: 0, gy: 0, browL: 0, browR: 0, jaw: 0, expr: 0, flat: 0 }, sw: 0, swV: 0, hvx: 0, hangBlinkAt: 0, kn: 0, wk: 0, yawW: 0, watchF: 0, watchDir: 1, nosyL: 0, nosyT: 0, big: null, closedUntil: 0, asleep: false, home: body.x[p.slot], lag: 0, brace: 0, braceHold: 0, cpx: 0, cpy: 0, thrownN: 0, thrownK: 0, press: 0, floor: null, lastPeak: null, lastGap: 0, bF: 0, bLen: 0, bRest: 0, bDepth: 0, bHold: 0, hangSy: 1, exprNow: 0, driftP: 0, carry: null };
      newBreath(s); s.bF = Math.floor(s.bLen * r()); s.driftP = Math.floor(r() * 130); scheduleBlink(s); s.blinkAt = clock.k + Math.round(rng.range(r, 40, 200)); s.fixUntil = clock.k + Math.round(rng.range(r, 60, 200));
      s.shiftAt = clock.k + Math.round(rng.range(r, 4, 14) * 60); s.browAt = clock.k + Math.round(rng.range(r, 10, 30) * 60); s.sighAt = clock.k + Math.round(rng.range(r, 40, 120) * 60); },
    remove(p) { const s = st[p.slot]; if (s) { if (s.walking) stopFeet(s, p.slot); setScale(p.slot, 1); } st[p.slot] = null; },
    current(p) { const s = st[p.slot]; return s ? { move: s.clip ? s.clip.id : s.base, f: s.clip ? Math.floor(s.clip.f) : s.f, queue: s.queue.length, carry: +carryNow(s).toFixed(3) } : null; },
    event(name, e) {
      const slot = e.slot, s = slot != null ? st[slot] : null, p = slot != null ? ctx.bySlot[slot] : null;
      if (name === 'cursor_returned') {
        // round 3 (comedian, m10): caught counting his spots. Every value freezes 12 f, then the 2-frame snap to canon and the cover.
        for (const q of ctx.potatoes) { const t = st[q.slot], c = t && t.clip; if (c && c.id === 'count_spots' && !c.frozen) { c.frozen = true; c.rate = 0; clock.after(12, () => { if (st[q.slot] === t && t.clip === c) { endClip(t, q.slot, 'cut'); play(q, 'caught_looking'); } }); } }
        if (!ctx.brain) for (const q of ctx.potatoes) { const t = st[q.slot]; if (t && t.mode === MODE.ground && !t.clip && !t.queue.length) { play(q, 'startle_small'); play(q, 'caught_looking'); } } return; }
      if (!s) return;
      if (name === 'uprooted') { rig.kick(slot, 'wob', RT.pop_wob_kick || 2); rig.kick(slot, 'squash', RT.pop_squash_kick || 1.5); }
      else if (name === 'poked') { rig.poke(slot, e.lx, e.ly, e.power); if (!ctx.brain && s.mode === MODE.ground) {
          // round 3 (comedian + A10): the ladder only climbs. 1 eyes · 2 the glare (brows down hard, leaning AT the cursor) · 3 his back · 4 his back, one step further off · 5 he leaves. The bite is cut.
          s.pokes = (clock.k - (s.pokeK || -999) < 300 ? (s.pokes || 0) : 0) + 1; s.pokeK = clock.k; const n = s.pokes, cu = senses.cursor, away = (cu.seen ? Math.sign(s.x - cu.x) : -Math.sign(e.lx)) || 1;
          const tail = (walk, holdF, turn) => { if (s.clip && s.clip.id !== 'about_face') endClip(s, slot, 'cut'); else s.queue.length = 0;
            if (turn) { s.backHome = s.yaw; push(s, 'about_face', { opts: { dir: away, to: s.yaw + Math.PI * away } }); }
            if (walk) walkItems(s, slot, clamp(s.x + walk * away, room.left + 0.7, room.right - 0.7), { gait: walk > 1 ? 'walk' : 'waddle', noYaw: true });
            hold(s, holdF, { id: 'back_turned', tracks: { sy: [[0, 0.98], [holdF, 0.98, 'lin']] } }); push(s, 'about_face', { opts: { to: s.backHome }, tracks: { sy: MV.about_face.tracks.sy, yaw: MV.about_face.tracks.yaw } }); };
          if (n <= 2) { if (s.clip && s.clip.id === 'poke_flinch') endClip(s, slot, 'cut'); play(p, 'poke_flinch', { from_side: Math.sign(e.lx) || 1, now: !!s.clip });
            if (n === 2) hold(s, 44, { id: 'glare', quiet: 1, opts: { target: 'cursor' }, shearFlat: true, tracks: { gx: [[0, 'current'], [3, 'target', 'out'], [44, 'target', 'lin']], browR: [[0, 0], [5, -0.55, 'out'], [36, -0.55, 'lin'], [44, 0, 'io']], browL: [[1, 0], [6, -0.4, 'out'], [36, -0.4, 'lin'], [44, 0, 'io']],
              lidL: [[0, 0], [5, 0.1, 'out'], [36, 0.1, 'lin'], [44, 0, 'io']], lidR: [[0, 0], [5, 0.1, 'out'], [36, 0.1, 'lin'], [44, 0, 'io']], shear: [[2, 0], [12, '0.1*toward', 'io'], [36, '0.1*toward', 'lin'], [44, 0, 'io']], sy: [[2, 1], [12, 1.035, 'io'], [36, 1.035, 'lin'], [44, 1, 'io']] } }); }
          else if (n === 3) tail(0, 600, true);
          else if (n === 4) tail(0.4, 600);
          else { s.pokes = 5; tail(2.2, 1200); } } }
      else if (name === 'thrown') { s.thrownN = Math.min(BRACE.full_after_throws || 3, (s.thrownN || 0) + 1); s.thrownK = clock.k; }
      else if (name === 'contact') {
        if (e.first && e.surface !== 'potato' && (e.kind === 'splat' || e.kind === 'crack' || e.kind === 'hole')) { s.hole = e.kind === 'hole' ? { x: e.x, y: e.y } : s.hole; if (e.kind === 'splat') splat(s, slot, e); else if (e.kind === 'crack') crack(s, slot, e, p); else through404(s, slot, e.nx, e.ny, false); return; }
        const v = e.speedInto; if (v > 1.2) { const a = Math.min(0.6, 0.11 * v); layer(s, 'wince', { lidR: [[0, 0], [1, a, 'out'], [4, a, 'lin'], [10, 0, 'io']], lidL: [[1, 0], [2, a, 'out'], [5, a, 'lin'], [12, 0, 'io']] }); }
        if (v > 3) scheduleBlink(s, 26); if (v > 6) addCarry(s, 0.5, Math.sign(e.vx) || 1);
      }
      else if (name === 'play') play(p, e.move, e.opts || {});
      else if (name === 'look') { if (e.after) lookAfter(p, e.target, e); else if (e.target !== undefined && e.look === undefined) look(p, e.target, e); }
      else if (name === 'walk_to') moves.walkTo(p, e.x, e);
      else if (!ctx.brain && name === 'zapped') play(p, 'zap', { now: true }); else if (!ctx.brain && name === 'fed') play(p, 'fries', e); else if (!ctx.brain && name === 'squished') play(p, 'squish_flat', { now: true }); else if (!ctx.brain && name === 'exploded') play(p, 'explode', { now: true });
    },
    step,
  };
  return moves;
}

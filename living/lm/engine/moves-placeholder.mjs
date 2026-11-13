// moves-placeholder.mjs — the ENGINEER'S stand-in for the animator's engine/moves.mjs. Enough that he idles, hangs, flies,
// lies where he lands and gets up, so the body can be judged. It is NOT the animation: no face, no blink, no gather, no look.
// The animator's moves.mjs replaces this whole file (createLiving({ plugins: { moves: createMoves } })); the interface it must
// keep is the object returned at the bottom: { add, remove, step, event }.
//
// What it plays, by who owns him (body.mode):
//   ground  'stand'   breath on the rig (never the same breath twice: depth and length drawn per breath), now and then a look
//   held    'hang'    stretch down from the grab point; while ROOTED his feet hold and he stretches up toward the hand
//   free    'air'     nothing keyed: physpose stretches him along the throw
//   down    'down'    lies where physics left him, 30 to 84 frames (drawn), breathing deeper
//   clip    'get_up'  the animator's keys from moves.json get_up, simplified: leans INTO the floor, rocks up, overshoots 0.06
// Game-feel and physics engineer (seat 3).
import { IDX } from './channels.mjs';
import { MODE } from './body.mjs';

const TAU = Math.PI * 2;
const io = u => u * u * (3 - 2 * u), out = u => 1 - (1 - u) * (1 - u), inn = u => u * u;
function key(keys, f) {   // keys: [[frame, value, ease]], value at frame f
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) { const a = keys[i - 1], b = keys[i], u = (f - a[0]) / (b[0] - a[0]), e = b[2] === 'out' ? out(u) : b[2] === 'in' ? inn(u) : b[2] === 'lin' ? u : io(u); return a[1] + (b[1] - a[1]) * e; }
  return keys[keys.length - 1][1];
}

export function createPlaceholderMoves(ctx) {
  const { data, clock, rng, channels: ch, body, room, rig, emit } = ctx;
  const J = data.physics, AO = (data.moves && data.moves.always_on && data.moves.always_on.breath) || { depth: [0.008, 0.02], period_f: [144, 252] };
  const HG = J.hang || { stretch_base: 0.07, stretch_per_speed: 0.012, blend_f: 4 }, RT = J.root || {}, A = body.A;
  const st = [];
  function newBreath(s) { const r = s.rnd; s.bLen = Math.round(rng.range(r, AO.period_f[0], AO.period_f[1])); s.bDepth = rng.range(r, AO.depth[0], AO.depth[1]); s.bRest = Math.round(s.bLen * rng.range(r, 0, 0.25)); s.bF = 0;
    // never two breaths the same length apart (the not-a-screensaver rule, as arithmetic): if this peak would land the same gap after the last, lengthen it
    let peak = clock.k + Math.round(0.42 * s.bLen); if (s.lastPeak != null && Math.abs((peak - s.lastPeak) - s.lastGap) < 5) { s.bLen += 14; peak = clock.k + Math.round(0.42 * s.bLen); }
    if (s.lastPeak != null) s.lastGap = peak - s.lastPeak; s.lastPeak = peak; }
  function breath(s) {      // in over 42%, out over 58%, then a rest at the bottom of 0 to 25% of the breath
    if (s.bF >= s.bLen + s.bRest) newBreath(s);
    const f = s.bF++, a = 0.42 * s.bLen; return f < a ? io(f / a) : f < s.bLen ? 1 - io((f - a) / (s.bLen - a)) : 0;
  }
  function enter(s, slot, move, blendF, chans) { s.move = move; s.f = 0; ch.blend(slot, chans || [IDX.sy, IDX.pivot, IDX.shear, IDX.roll, IDX.dy, IDX.x, IDX.y], blendF); emit('move', { slot, move }); }
  function unwind(slot) { const n = Math.round(body.th[slot] / TAU); if (n) { body.th[slot] -= n * TAU; ch.shift(slot, IDX.roll, -n * TAU); } }

  return {
    name: 'placeholder',
    add(p) { const s = st[p.slot] = { move: 'stand', f: 0, rnd: rng.stream(p.id, 'moves'), x: body.x[p.slot], roll0: 0, hold: 0, lookAt: 0, lookEnd: 0, yaw: 0, hangSy: 1, floor: null, rooted: false, lastPeak: null, lastGap: 0, bF: 0, bLen: 0, bRest: 0, bDepth: 0, keysRoll: null, len: 76 };
      newBreath(s); s.bF = Math.floor(s.bLen * s.rnd()); s.lookAt = clock.k + Math.round(rng.range(s.rnd, 20, 45) * 60); },
    remove(p) { st[p.slot] = null; },
    current(p) { const s = st[p.slot]; return s ? { move: s.move, f: s.f } : null; },
    event(name, e) {
      if (name === 'uprooted') { rig.kick(e.slot, 'wob', RT.pop_wob_kick || 2); rig.kick(e.slot, 'squash', RT.pop_squash_kick || 1.5); }
      else if (name === 'poked') rig.poke(e.slot, e.lx, e.ly, e.power);
    },
    step(p) {
      const slot = p.slot, s = st[slot], m = body.mode[slot], b = breath(s); s.f++;
      if (m === MODE.held) {
        if (s.move !== 'hang') { const gap = Math.abs(ch.get(slot, IDX.sy) - (1 + HG.stretch_base));      // 4 frames ("your hand is already there") unless the squash he is in is far from a hang
          enter(s, slot, 'hang', Math.max(HG.blend_f, Math.ceil(gap * 1.875 / 0.024)), [IDX.sy, IDX.pivot, IDX.shear, IDX.dy]); s.hangSy = 1 + HG.stretch_base; }
        const H = body.hold[slot];
        if (H.root > 0) {                                                     // ROOTED: feet stay, he stretches toward the hand
          if (!s.rooted) s.rootSy = 1; s.rooted = true; s.rootSy += Math.max(-0.02, Math.min(0.02, 1 + (RT.stretch_at_full || 0.12) * body.strain[slot] - s.rootSy));   // slew cap: a snatch cannot snap his stretch
          ch.set(slot, IDX.pivot, 0); ch.set(slot, IDX.sy, s.rootSy); ch.set(slot, IDX.shear, -(RT.lean_at_full_bh || 0.06) * body.strainX[slot]);
        } else {
          if (s.rooted) { s.rooted = false; ch.blend(slot, [IDX.sy, IDX.pivot, IDX.shear], 10); }
          ch.set(slot, IDX.pivot, A + H.gy); ch.set(slot, IDX.shear, 0);
          const want = Math.min(1 + (HG.stretch_cap ?? J.squash.cap), 1 + HG.stretch_base + HG.stretch_per_speed * Math.hypot(body.vx[slot], body.vy[slot]));   // clamped HERE, so the blend out of it has no kink
          s.hangSy += Math.max(-0.012, Math.min(0.012, want - s.hangSy));                    // a hand can jerk; his stretch may not (slew cap)
          ch.set(slot, IDX.sy, s.hangSy + b * s.bDepth * 0.5); }
        ch.set(slot, IDX.dy, 0);
      } else if (m === MODE.free) {
        if (s.move !== 'air') enter(s, slot, 'air', 12, [IDX.sy, IDX.pivot, IDX.shear, IDX.dy]);
        ch.set(slot, IDX.sy, 1); ch.set(slot, IDX.pivot, A); ch.set(slot, IDX.shear, 0); ch.set(slot, IDX.dy, 0);
      } else if (m === MODE.down) {
        if (s.move !== 'down') { enter(s, slot, 'down', 10, [IDX.sy, IDX.pivot, IDX.shear, IDX.dy]); s.hold = Math.round(rng.range(s.rnd, 30, 84)); s.x = body.x[slot]; s.roll0 = body.th[slot]; }
        ch.set(slot, IDX.x, s.x); ch.set(slot, IDX.y, body.restY(slot)); ch.set(slot, IDX.roll, s.roll0);
        ch.set(slot, IDX.sy, 0.92 + b * s.bDepth * 1.5); ch.set(slot, IDX.pivot, A); ch.set(slot, IDX.shear, 0); ch.set(slot, IDX.dy, 0);
        if (s.f > s.hold) {                                                    // he has decided that happened. get up.
          unwind(slot); s.roll0 = body.th[slot]; const r0 = s.roll0, sg = Math.sign(r0) || 1, act = Math.max(28, Math.ceil(Math.abs(r0) * 1.14 * 1.5 / 0.17)), e = 18 + act;
          s.keysRoll = [[0, r0], [18, r0 * 1.08], [e, -0.06 * sg], [e + 30, 0]];
          s.keysSy = [[0, 0.92], [18, 0.88], [18 + act * 0.43, 1.04], [e, 0.96], [e + 30, 1]];
          s.keysDy = [[18, 0], [18 + act * 0.43, 0.04, 'out'], [e, 0, 'in']]; s.len = e + 30; s.kickAt = e + 1;
          body.claim(slot); s.move = 'get_up'; s.f = 0; emit('move', { slot, move: 'get_up' });
        }
      } else if (m === MODE.clip && s.move === 'get_up') {
        const f = s.f;
        ch.set(slot, IDX.roll, key(s.keysRoll, f)); ch.set(slot, IDX.sy, key(s.keysSy, f) + b * s.bDepth); ch.set(slot, IDX.dy, key(s.keysDy, f));
        ch.set(slot, IDX.x, s.x); ch.set(slot, IDX.y, body.restY(slot)); ch.set(slot, IDX.pivot, A * (1 - io(Math.min(1, f / s.len)))); ch.set(slot, IDX.shear, 0);
        if (f === s.kickAt) rig.kick(slot, 'wob', 1.4);
        if (f >= s.len) { body.setMode(slot, MODE.ground, 'got up'); s.move = 'stand'; s.f = 0; emit('move', { slot, move: 'stand' }); emit('got_up', { slot }); }
      } else if (m === MODE.ground) {
        if (s.move !== 'stand') { unwind(slot); s.x = body.x[slot]; enter(s, slot, 'stand', 12); }
        if (s.floor !== room.floor) { if (s.floor != null && s.move === 'stand') { ch.blend(slot, [IDX.y], Math.max(8, Math.ceil(Math.abs(room.floor - s.floor) * 1.875 / 0.034))); rig.kick(slot, 'squash', -1.2); } s.floor = room.floor; }   // the floor rose under him (the Dock came back): he rides it up
        ch.set(slot, IDX.x, s.x); ch.set(slot, IDX.roll, 0); ch.set(slot, IDX.y, room.floor + A);
        ch.set(slot, IDX.sy, 1 + b * s.bDepth); ch.set(slot, IDX.pivot, 0); ch.set(slot, IDX.shear, 0.004 * b); ch.set(slot, IDX.dy, 0);
        // now and then he looks somewhere for a while (the model's own yaw spring does the easing). Placeholder for the brain.
        if (clock.k >= s.lookAt) { if (s.yaw === 0) { s.yaw = (s.rnd() < 0.5 ? -1 : 1) * rng.range(s.rnd, 0.22, 0.5); s.lookAt = clock.k + Math.round(rng.range(s.rnd, 2, 6) * 60); } else { s.yaw = 0; s.lookAt = clock.k + Math.round(rng.range(s.rnd, 20, 45) * 60); } }
      }
      ch.set(slot, IDX.yaw, m === MODE.ground ? s.yaw : 0);
    },
  };
}

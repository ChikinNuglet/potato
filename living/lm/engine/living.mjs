// living.mjs — the living model: data says what he wants to do, the engine makes sure it never snaps, physics takes over
// the moment he leaves the ground, and the read-only model only ever gets told a pose.
//
//   createLiving({ T, createSpud, phys, data, host, seed, plugins }) -> living
//     T           three.js (the host's copy)            createSpud   the model's factory (the host's copy, untouched)
//     phys        spudphys dmath: { stream, fnv1a, ... } data         { physics, moves, behaviour, direction, personalities, gags, sounds }
//     host        { scene, pxPerBh, yScale?, spudOpts?, now?() }      seed   a number
//     plugins     { moves, brain, face, fx, sound }: each a function (ctx) -> object. See engine/README.md.
//
// One tick, in this order (the same every step, so a strip replays exactly):
//   clock -> senses (pointer -> grab / release / poke) -> brain -> body (physics) -> events out -> physics pose into channels
//   -> moves (set targets) -> face -> channels (inertial blend) -> kinematic bodies follow -> rig (the model) -> fx -> trace
// No file in this folder imports anything outside it. No Math.random, no timers, no wall clock in a tick.
// Game-feel and physics engineer (seat 3), team Not A Screensaver.
import { createClock, HZ, DT } from './clock.mjs';
import { createRng } from './rng.mjs';
import { createChannels, IDX, NAMES } from './channels.mjs';
import { createRoom } from './room.mjs';
import { createBody, MODE, MODE_NAME } from './body.mjs';
import { createSenses } from './senses.mjs';
import { createPhysPose } from './physpose.mjs';
import { createRig } from './rig.mjs';
import { createTrace, TAG } from './trace.mjs';
import { judge as runJudge, judgeAlive } from './judge.mjs';
import { createCrowd } from './crowd.mjs';
import { createPlaceholderMoves } from './moves-placeholder.mjs';
import { createSlipstream } from './slipstream.mjs';

export const VERSION = '0.3.0-final';
export const MAX = 5;

export function createLiving({ T, createSpud, phys, data, host, seed = 1, plugins = {} }) {
  const clock = createClock(), rng = createRng(phys, seed), channels = createChannels(MAX), room = createRoom(), trace = createTrace();
  const listeners = new Map(), potatoes = [], bySlot = new Array(MAX).fill(null), tagNext = new Uint32Array(MAX), outbox = [];
  const now = host.now || null;
  function emit(name, e) { outbox.push([name, e || {}]); }
  const body = createBody({ physics: data.physics, room, clock, emit, max: MAX });
  const rig = createRig({ T, physics: data.physics, channels, clock, yScale: host.yScale || 1, lod: host.lod || 'auto', max: MAX }); rig.now = now;
  const physpose = createPhysPose({ physics: data.physics, body, channels, clock, rig, max: MAX });
  const senses = createSenses({ physics: data.physics, direction: data.direction, body, clock, emit, pxPerBh: () => host.pxPerBh || 150, slots: () => potatoes.map(p => p.slot) });
  const ctx = { T, data, clock, rng, channels, IDX, body, MODE, room, rig, physpose, senses, emit, potatoes, bySlot, on, seed, TAG, tag: (slot, t) => { tagNext[slot] |= t; } };
  const crowd = createCrowd(ctx);
  const moves = (plugins.moves || createPlaceholderMoves)(ctx);
  const brain = plugins.brain ? plugins.brain(ctx) : null, face = plugins.face ? plugins.face(ctx) : null;
  const fx = plugins.fx ? plugins.fx(ctx) : null, sound = plugins.sound ? plugins.sound(ctx) : null;
  const slip = createSlipstream(ctx);   // the engineer's bold choice (assembly round): physics.json slipstream.on = false switches it off
  const parts = [moves, brain, face, fx, sound, crowd, slip].filter(Boolean);
  ctx.moves = moves; ctx.brain = brain; ctx.face = face; ctx.fx = fx; ctx.sound = sound; ctx.crowd = crowd;
  const GUARD_FREE = TAG.contact | TAG.release | TAG.takeoff | TAG.grab | TAG.glitch_step, GUARD_SY = 0.0288, guardHold = new Uint8Array(MAX);
  // (final round, director E1) HIT-STOP: a first contact hard enough to stick (splat) holds the crush frame: for 2 to 4 frames nothing of his
  // advances (his moves, his face, the impact spring). The harder he hit, the longer the wall keeps him. physics.json contact.hitstop; on: false = off.
  const HS = (data.physics.contact && data.physics.contact.hitstop) || {}, hitstop = new Uint8Array(MAX), hitNext = new Uint8Array(MAX);
  const perf = { engine: new Float32Array(600), model: new Float32Array(600), n: 0 };
  const row = new Float64Array(trace.COLS.length), FACE_EXPR = { canon: 0, shock: 1, scream: 2, startled: 3, deadpan: 4, oh: 5 };

  function on(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); return living; }
  const TAGS = { contact: TAG.contact, thrown: TAG.release, dropped: TAG.release, grab: TAG.grab, uprooted: TAG.takeoff, landed: TAG.landed };
  function flush() {   // events out, in the order they happened; handlers may emit more (they go out in the same flush)
    for (let i = 0; i < outbox.length; i++) { const [name, e] = outbox[i];
      if (e.slot != null && bySlot[e.slot]) { e.id = bySlot[e.slot].id; if (TAGS[name]) tagNext[e.slot] |= TAGS[name];
        if (name === 'mode') { if (e.why === 'knocked' || e.why === 'shoved' || e.why === 'impulse' || e.why === 'give' || e.why === 'floor gone') tagNext[e.slot] |= TAG.takeoff; if (e.why === 'claim') tagNext[e.slot] |= TAG.clip_start; } }
      if (name === 'contact') { physpose.contact(e);
        if (HS.on !== false && e.first && e.surface !== 'potato' && (HS.kinds || ['splat']).includes(e.kind)) { const thr = body.thresholds(); hitNext[e.slot] = Math.min(HS.max_f || 4, (HS.base_f || 2) + Math.round(Math.max(0, e.speedInto - thr.splat) / (HS.speed_per_extra_f || 3))); emit('hitstop', { slot: e.slot, frames: hitNext[e.slot], speed: e.speedInto }); } }
      for (const p of parts) if (p.event) p.event(name, e);
      const L = listeners.get(name); if (L) for (const fn of L) fn(e);
      const any = listeners.get('*'); if (any) for (const fn of any) fn(name, e);
    }
    outbox.length = 0;
  }

  function tick() {
    const t0 = now ? now() : 0; rig.modelMs = 0;
    clock.k++; clock.run();
    senses.step(); slip.step(); flush();
    if (brain && brain.step) for (const p of potatoes) brain.step(p, clock.k);
    crowd.step();
    body.step(); flush();
    for (const p of potatoes) { const s = p.slot, m = body.mode[s];
      if (m === MODE.held || m === MODE.free) { channels.handoff(s, IDX.x, body.x[s], body.vx[s]); channels.handoff(s, IDX.y, body.y[s], body.vy[s]); channels.handoff(s, IDX.roll, body.th[s], body.w[s]); }
      if (hitstop[s] > 0) { hitstop[s]--; tagNext[s] |= TAG.contact; continue; }      // held on the crush frame: every channel keeps its value
      physpose.step(s); moves.step(p, clock.k); if (face && face.step) face.step(p, clock.k); }
    flush();
    for (let s = 0; s < MAX; s++) if (hitNext[s]) { hitstop[s] = hitNext[s]; hitNext[s] = 0; }   // the contact frame itself plays; the hold starts on the next
    for (const p of potatoes) { const s = p.slot, m = body.mode[s];
      // (assembly round) THE LAST GUARD against a snap between two seats: standing on the ground, away from any contact or glitch step, his height may
      // not jump more than the judge allows. If two seats' squashes meet on one frame with no blend asked, the engine asks for a short one.
      // Counted in living.guards so nobody can hide behind it: a big number means a seat should ask for its own blend.
      if (tagNext[s] & GUARD_FREE || body.touch[s]) guardHold[s] = 1; /* final round: was 2, one frame longer than the judge's own exemption; frame 8394 of final/life-five-3min slipped through that gap (0.038 a frame) */ else if (guardHold[s] > 0) guardHold[s]--;
      else if (m === MODE.ground && !channels.pending(s, IDX.sy) && Math.abs(channels.peek(s, IDX.sy) - channels.get(s, IDX.sy)) > GUARD_SY) { channels.blend(s, [IDX.sy], 8); tagNext[s] |= TAG.blend; living.guards.sy++; }
      channels.step(s);
      if (m === MODE.ground || m === MODE.clip || m === MODE.down) body.place(s, channels.get(s, IDX.x), channels.get(s, IDX.y), channels.get(s, IDX.roll), channels.speed(s, IDX.x), channels.speed(s, IDX.y), channels.speed(s, IDX.roll));
      rig.apply(s); }
    if (fx && fx.step) fx.step(clock.k); if (sound && sound.step) sound.step(clock.k);
    for (const p of potatoes) { const s = p.slot, r = rig.get(s), S = r.S, m = body.mode[s];
      row[0] = clock.k; row[1] = s; row[2] = m; row[3] = channels.get(s, IDX.x); row[4] = channels.get(s, IDX.y);
      row[5] = m === MODE.held || m === MODE.free ? body.vx[s] : channels.speed(s, IDX.x); row[6] = m === MODE.held || m === MODE.free ? body.vy[s] : channels.speed(s, IDX.y);
      row[7] = channels.get(s, IDX.roll); row[8] = channels.speed(s, IDX.roll); row[9] = channels.get(s, IDX.yaw); row[10] = r.sy; row[11] = r.s1; row[12] = r.s2; row[13] = r.axis;
      row[14] = channels.get(s, IDX.pitch); row[15] = channels.get(s, IDX.shear); row[16] = channels.get(s, IDX.dx); row[17] = channels.get(s, IDX.dy);
      row[18] = S.squash.x; row[19] = S.leanX.x; row[20] = S.wob.x; row[21] = S.yaw.x; row[22] = channels.get(s, IDX.glitch); row[23] = r.lodName === 'C' ? 2 : 0;
      if (body.touch[s]) { tagNext[s] |= TAG.contact; body.touch[s] = 0; }
      row[24] = tagNext[s] | (m === MODE.held ? TAG.held : 0) | (m === MODE.free ? TAG.free : 0); row[25] = body.strain[s]; row[26] = body.grudge[s];
      { const F = face && face.state ? face.state(s) : null; if (F) { row[27] = F.lidL; row[28] = F.lidR; row[29] = F.gx; row[30] = F.gy; row[31] = F.browL; row[32] = F.browR; row[33] = F.flat || 0; row[34] = FACE_EXPR[F.expr] == null ? 0 : FACE_EXPR[F.expr]; } else { row[27] = row[28] = row[29] = row[30] = row[31] = row[32] = row[33] = 0; row[34] = -1; } }
      tagNext[s] = 0; trace.push(row); }
    if (now) { const i = perf.n++ % 600, all = now() - t0; perf.model[i] = rig.modelMs; perf.engine[i] = all - rig.modelMs; }
  }

  const living = {
    guards: { sy: 0 }, VERSION, MAX, clock, rng, channels, room, body, rig, senses, physpose, trace, potatoes, moves, brain, face, fx, sound, crowd, ctx, MODE, IDX, TAG,
    /** add a Potato. personalityId = an id from first-batch.json, or null for him. Returns a promise of his id. */
    async add(personalityId = null, opts = {}) {
      let slot = -1; for (let i = 0; i < MAX; i++) if (!bySlot[i]) { slot = i; break; }
      if (slot < 0) throw new Error('five is the most');
      const p = { slot, id: opts.id || (personalityId || 'potato') + '#' + slot, personality: personalityId, brain: opts.brain || (personalityId ? 'script' : 'real') };
      bySlot[slot] = p;   // hold the slot while the model loads
      const api = await createSpud(null, { scene: host.scene, ...(host.spudOpts || {}), ...(opts.spud || {}) });
      p.api = api; rig.build(slot, api, host.scene); channels.reset(slot); physpose.reset(slot);
      const x = opts.x == null ? room.left + room.width * (0.5 + 0.16 * (slot % 2 ? -1 : 1) * Math.ceil(slot / 2)) : opts.x;
      body.add(slot, x, opts.y, opts.mass);
      channels.handoff(slot, IDX.x, body.x[slot], 0); channels.handoff(slot, IDX.y, body.y[slot], 0);
      potatoes.push(p); potatoes.sort((a, b) => a.slot - b.slot);
      for (const q of parts) if (q.add) q.add(p);
      channels.step(slot); rig.apply(slot); emit('added', { slot }); flush();
      return p.id;
    },
    remove(id) { const p = potatoes.find(q => q.id === id); if (!p) return false; for (const q of parts) if (q.remove) q.remove(p);
      rig.remove(p.slot, host.scene); body.remove(p.slot); bySlot[p.slot] = null; potatoes.splice(potatoes.indexOf(p), 1); return true; },
    find(id) { return potatoes.find(q => q.id === id || q.slot === id) || null; },
    /** play one of his moves now, by name (a key on a page, a level's cue). His brain stands down for the length of it. Returns the move's handle, or null. */
    play(id, move, opts = {}) { const p = living.find(id == null ? 0 : id) || potatoes[0]; if (!p || !moves.has || !moves.has(move) || body.mode[p.slot] !== MODE.ground) return null;
      if (moves.drive) moves.drive(p, 0); const len = (data.moves.moves[move] && data.moves.moves[move].len) || 60; if (brain && brain.hold) brain.hold(p, len + 40); return moves.play(p, move, { now: true, ...opts }); },
    /** YOU DRIVE (Claude, Nov 12 2026). The switch host-game.mjs said did not exist. { x: -1 | 0 | 1, jump?: true } for one Potato.
     *  While a hand is on him his brain stands down (brain.hold) and his own walk carries him; let go and, half a second later, he is his own again.
     *  jump is a real jump: an impulse into the same physics a throw uses, so the landing, the squash and the look after are all his.
     *  Call it every frame a key is held, or once on press and once (x: 0) on release. Returns false if he cannot take it (held, mid-air walk, gone). */
    drive(id, o = {}) { const p = living.find(id == null ? 0 : id) || potatoes[0]; if (!p) return false; const s = p.slot, x = Math.sign(o.x || 0);
      if (body.mode[s] === MODE.held || body.mode[s] === MODE.gone || body.mode[s] === MODE.clip) return false;
      if (brain && brain.hold) brain.hold(p, 36);
      if (o.duck != null && moves.duck) return moves.duck(p, !!o.duck);
      if (o.spin && moves.spin) return moves.spin(p, o.spin);                      // { spin: -1 | 1 }: one whole turn on the spot
      if (o.flip) return body.flip(s, o.flip);                                     // { flip: -1 | 1 }: only inside a jump of his own   // { duck: true } while the key is down, { duck: false } on release
      if (o.jump && body.mode[s] === MODE.ground) { if (moves.drive) moves.drive(p, 0); const J = (data.physics.drive || {}); body.hop(s, x * (J.jump_vx == null ? 3.0 : J.jump_vx), J.jump_vy == null ? 8.2 : J.jump_vy); tagNext[s] |= TAG.takeoff; return true; }   // (body.hop: he stays upright, so a jump lands on his feet; a throw is what tumbles him)
      return moves.drive ? moves.drive(p, x) : false; },

    /** move him along the floor at once (see moves.place). */
    place(id, x) { const p = living.find(id == null ? 0 : id) || potatoes[0]; return !!(p && moves.place && moves.place(p, x)); },
    /** dress him: build = an outfit builder (outfits3d.mjs loadOutfit), or null for bare. (Nov 12 night: the page's costume key.) */
    wear(id, build) { const p = living.find(id == null ? 0 : id) || potatoes[0]; if (!p) return false; rig.wear(p.slot, build || null); rig.wake(p.slot, 60); return true; },
    tick,
    /** real time in, 0 to 4 ticks out. Returns how many ran (0 = nothing changed, the host may skip the draw). */
    frame(realSeconds) { const n = clock.stepsFor(realSeconds); for (let i = 0; i < n; i++) tick(); return n; },
    /** { type: 'pointer', x, y, down, t? } in bh, y up. Anything else is handed to the brain as a behaviour.json input. */
    input(e) { if (e.type === 'pointer') senses.input(e); else { const p = e.id != null ? living.find(e.id) : null; emit(e.type, { ...e, slot: p ? p.slot : e.slot }); } },
    on, emit,
    hash() { return phys.fnv1a([...body.arrays(), ...channels.arrays(), ...physpose.arrays(), new Float64Array([clock.k]), hitstop]); },
    judge(kFrom) { return runJudge(trace.rows(kFrom), data.direction.judge); },
    /** (final round, E3) is he ALIVE: travel share, longest body-still stretch, places stood in. Marks: direction.json judge.round3_alive */
    alive(kFrom) { return judgeAlive(trace.rows(kFrom), data.direction.judge.round3_alive); },
    perf() { const n = Math.min(perf.n, 600), q = (a, p) => { if (!n) return 0; const b = Array.from(a.subarray(0, n)).sort((x, y) => x - y); return +b[Math.min(n - 1, Math.floor(p * n))].toFixed(3); };
      return { frames: n, engine_ms: { median: q(perf.engine, 0.5), p95: q(perf.engine, 0.95), worst: q(perf.engine, 1) }, model_ms: { median: q(perf.model, 0.5), p95: q(perf.model, 0.95), worst: q(perf.model, 1) },
        guards: { ...living.guards }, lod: potatoes.map(p => rig.get(p.slot).lodName), model_steps: rig.stepped, model_steps_skipped: rig.skipped }; },
    perfReset() { perf.n = 0; rig.stepped = rig.skipped = 0; },
    state(id) { const p = living.find(id); if (!p) return null; const s = p.slot; return { id: p.id, slot: s, k: clock.k, mode: MODE_NAME[body.mode[s]], move: moves.current ? moves.current(p) : undefined, x: body.x[s], y: body.y[s], vx: body.vx[s], vy: body.vy[s], roll: body.th[s], spin: body.w[s],
      sy: rig.get(s).sy, s1: rig.get(s).s1, s2: rig.get(s).s2, grudge: body.grudge[s], strain: body.strain[s], lod: rig.get(s).lodName, channels: Object.fromEntries(NAMES.map((n, i) => [n, channels.get(s, i)])) }; },
  };
  trace.header = { engine: VERSION, seed, hz: HZ, dt: DT, moves: moves.name || 'plugin' };
  return living;
}

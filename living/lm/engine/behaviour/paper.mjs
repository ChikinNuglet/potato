// paper.mjs — a PAPER WORLD for the brain: the real brain.mjs, the real clock, the real random streams, the real crowd.mjs,
// but no model, no rig, no renderer and a body that is only a position on a line. It is what "simulate(seconds, seed, events)"
// means on the board: ten minutes of his life in about a second, in Node, so twenty seeds can be counted.
// It proves the DECIDING, not the moving. The bench (tools/life_bench.py) runs the same brain on the real engine.
// Behaviour Designer (seat 4), Build round.
import { createClock } from '../clock.mjs';
import { createRng } from '../rng.mjs';
import { createCrowd } from '../crowd.mjs';
import { IDX, NAMES, CHANNELS } from '../channels.mjs';
import { MODE } from '../body.mjs';
import { createBrain } from './brain.mjs';

export function createPaper({ data, phys, seed = 7, room = { left: 0, right: 9.6, floor: 0.52 } }) {
  const clock = createClock(), rng = createRng(phys, seed), MAX = 5, NCH = NAMES.length, base = new Float64Array(MAX * NCH);
  const potatoes = [], bySlot = new Array(MAX).fill(null), outbox = [], B = data.physics.body || {}, SH = data.physics.shove;
  const body = { x: new Float64Array(MAX), y: new Float64Array(MAX), mode: new Uint8Array(MAX), W: B.half_width || 0.52, A: B.half_height || 0.5375 };
  const R = { left: room.left, right: room.right, floor: room.floor, get width() { return R.right - R.left; } };
  const emit = (name, e) => outbox.push([name, e || {}]);
  const channels = { set(s, c, v) { base[s * NCH + c] = v; }, get: (s, c) => base[s * NCH + c], target: (s, c) => base[s * NCH + c], blend() {}, speed: () => 0 };
  const cursor = { x: 0, y: 0, seen: false, gone: false, lastMoveK: 0, speed: 0, down: false };
  const rig = { kick() {}, wake() {}, arms() {}, poke() {} }, moves = { name: 'paper', step(p) { const s = p.slot; channels.set(s, IDX.sy, 1); channels.set(s, IDX.shear, 0); } };
  const ctx = { data, clock, rng, channels, IDX, body, MODE, room: R, rig, senses: { cursor }, emit, potatoes, bySlot, seed, TAG: { glitch_step: 8 }, tag() {}, moves };
  const crowd = ctx.crowd = createCrowd(ctx);
  const rnd = rng.stream('paper', 'physics');
  function fly(s, by, v, why) { body.mode[s] = MODE.free; emit('mode', { slot: s, from: 'ground', to: 'free', why });
    const dir = by != null && bySlot[by] ? Math.sign(body.x[s] - body.x[by]) || 1 : rnd() < 0.5 ? -1 : 1, down = v > 5 && rnd() < 0.6;
    clock.after(30 + Math.round(v * 4), () => { if (!bySlot[s]) return; body.x[s] = Math.max(R.left + 0.7, Math.min(R.right - 0.7, body.x[s] + dir * v * 0.14)); body.mode[s] = down ? MODE.down : MODE.ground;
      emit('mode', { slot: s, to: down ? 'down' : 'ground', why: 'settled' }); emit('landed', { slot: s, speed: v * 0.5, upright: !down });
      if (down) clock.after(110, () => { if (!bySlot[s]) return; body.mode[s] = MODE.ground; emit('mode', { slot: s, to: 'ground', why: 'got up' }); emit('got_up', { slot: s }); }); }); }
  crowd.shove = (a, b, level) => { const v = typeof level === 'string' ? SH[level] : level; emit('shoved', { slot: b, by: a, speed: v }); fly(b, a, v, 'shoved'); };
  const brain = ctx.brain = createBrain(ctx);
  function flush() { for (let i = 0; i < outbox.length; i++) { const [n, e] = outbox[i]; if (e.slot != null && bySlot[e.slot]) e.id = bySlot[e.slot].id; brain.event(n, e); } outbox.length = 0; }
  const paper = { ctx, brain, clock, body, cursor, potatoes,
    add(personality = null, o = {}) { let slot = potatoes.length; const p = { slot, id: (personality || 'potato') + '#' + slot, personality, brain: o.brain || (personality ? 'script' : 'real') };
      bySlot[slot] = p; potatoes.push(p); body.x[slot] = o.x != null ? o.x : R.left + R.width * (0.5 + 0.16 * (slot % 2 ? -1 : 1) * Math.ceil(slot / 2)); body.y[slot] = R.floor + body.A; body.mode[slot] = MODE.ground;
      for (let c = 0; c < NCH; c++) base[slot * NCH + c] = CHANNELS[NAMES[c]]; channels.set(slot, IDX.x, body.x[slot]); brain.add(p); return p; },
    tick() { clock.k++; clock.run(); flush(); for (const p of potatoes) brain.step(p, clock.k); crowd.step(); flush();
      for (const p of potatoes) { moves.step(p, clock.k); } flush();
      for (const p of potatoes) if (body.mode[p.slot] === MODE.ground) body.x[p.slot] = channels.get(p.slot, IDX.x); },
    run(seconds) { const n = Math.round(seconds * 60); for (let i = 0; i < n; i++) paper.tick(); },
    /** the hand */
    pointer(x, y) { cursor.seen = true; cursor.x = x; cursor.y = y; cursor.lastMoveK = clock.k; if (cursor.gone) { cursor.gone = false; emit('cursor_returned', {}); } },
    leave() { cursor.seen = true; if (!cursor.gone) { cursor.gone = true; emit('cursor_gone', {}); } },
    poke(s) { paper.pointer(body.x[s], body.y[s]); emit('poked', { slot: s, lx: 0, ly: 0, power: 1 }); },
    throw(s, v = 14) { paper.pointer(body.x[s], body.y[s]); emit('picked_up', { slot: s }); body.mode[s] = MODE.held; clock.after(40, () => { emit('thrown', { slot: s, by: 'user', speed: v }); if (v > 12) emit('contact', { slot: s, surface: 'wall', first: true, kind: v >= 28 ? 'hole' : v >= 18 ? 'crack' : 'splat', speedInto: v * 0.9 }); fly(s, null, v, 'release'); }); },
    input(type, s) { emit(type, { slot: s }); },
  };
  return paper;
}

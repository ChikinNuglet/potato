// crowd.mjs — up to five in one scene: who is near whom, who can see whom, and the physics side of a shove.
// Body-to-body contact itself is in body.mjs (the same contact code as a wall). WHO shoves, when, and never twice running
// is the behaviour designer's (brain.mjs); physics has no favourite.
// Emits (edge-triggered, per pair):  other_near { slot, other, dist }   other_left { slot, other }
// Game-feel and physics engineer (seat 3). Small on purpose: the crowd is the last thing switched on.
import { MODE } from './body.mjs';

export function createCrowd(ctx) {
  const { body, emit, potatoes, data } = ctx;
  const notice = ((data.direction && data.direction.crowd && data.direction.crowd.personal_space_body_widths) || 1.1) * 2 * body.W * 1.6;   // a bit past personal space
  const near = new Set();
  // (final round, director E4 + Potato seat) PERSONAL SPACE: two who are both simply standing never stay inside each other. After `after_f` frames
  // of overlap the one who can (not mid-move; the later arrival first) waddles out to `personal_space_body_widths` on the side he is already on.
  // It is a walk of the animator's, asked through moves.walkTo, so it blends like any other step. physics.json crowd_space.on = false switches it off.
  const SP = (data.physics && data.physics.crowd_space) || {}, space = ((data.direction && data.direction.crowd && data.direction.crowd.personal_space_body_widths) || 1.1) * 2 * body.W;
  const over = new Map(), spaceCool = new Int32Array(8), room = ctx.room, clock = ctx.clock;
  function makeRoom(a, b, force) {   // force: the overlap has lasted `force_after_f` (45): even one who is mid-something gets the step queued behind it
    const mv = ctx.moves; if (!mv || !mv.walkTo) return false;
    const can = s => { const p = ctx.bySlot[s]; return p && body.mode[s] === MODE.ground && clock.k >= spaceCool[s] && (force || !(mv.busy && mv.busy(p))); };
    const pick = can(b) ? b : can(a) ? a : -1; if (pick < 0) return false; const other = pick === a ? b : a;
    let dir = Math.sign(body.x[pick] - body.x[other]) || (pick % 2 ? 1 : -1), x = body.x[other] + dir * (space + 0.06);
    if (x < room.left + 0.62 || x > room.right - 0.62) { dir = -dir; x = body.x[other] + dir * (space + 0.06); }
    // not into a third one: if that spot is taken, go the other way round him
    for (const q of potatoes) if (q.slot !== pick && q.slot !== other && body.mode[q.slot] !== MODE.gone && Math.abs(body.x[q.slot] - x) < space * 0.8) { const x2 = body.x[other] - dir * (space + 0.06); if (x2 > room.left + 0.62 && x2 < room.right - 0.62) x = x2; break; }
    mv.walkTo(ctx.bySlot[pick], x, { gait: 'waddle' }); spaceCool[pick] = clock.k + (SP.cooldown_f || 90); emit('made_room', { slot: pick, other, to: +x.toFixed(3) }); return true;
  }
  const crowd = {
    notice,
    dist(a, b) { return Math.hypot(body.x[a] - body.x[b], body.y[a] - body.y[b]); },
    /** can a see b: b is not in the 404, and a is facing b's side of the room (yaw sign), or within arm's reach */
    canSee(a, b, yawA = 0) { if (body.mode[b] === MODE.gone) return false; const dx = body.x[b] - body.x[a]; return Math.abs(dx) < 1.2 || dx * (yawA || 1e-9) >= 0 || Math.abs(yawA) < 0.6; },
    nearest(a) { let best = -1, bd = Infinity; for (const p of potatoes) { if (p.slot === a || body.mode[p.slot] === MODE.gone) continue; const d = crowd.dist(a, p.slot); if (d < bd) { bd = d; best = p.slot; } } return best < 0 ? null : { slot: best, dist: bd }; },
    /** the contact frame of a shove move: a pushes b. level = 'bump' | 'shove' | 'big_shove' or a speed in bh/s. */
    shove(a, b, level = 'shove') { body.shove(a, b, level); },
    step() {
      if (potatoes.length < 2) return;
      for (let i = 0; i < potatoes.length; i++) for (let j = i + 1; j < potatoes.length; j++) {
        const a = potatoes[i].slot, b = potatoes[j].slot, key = a * 8 + b, d = crowd.dist(a, b), gone = body.mode[a] === MODE.gone || body.mode[b] === MODE.gone;
        if (!gone && d < notice && !near.has(key)) { near.add(key); emit('other_near', { slot: a, other: b, dist: d }); emit('other_near', { slot: b, other: a, dist: d }); }
        else if ((gone || d > notice * 1.25) && near.has(key)) { near.delete(key); emit('other_left', { slot: a, other: b }); emit('other_left', { slot: b, other: a }); }
        if (SP.on !== false) { const both = body.mode[a] === MODE.ground && body.mode[b] === MODE.ground && Math.abs(body.x[a] - body.x[b]) < space * (SP.inside || 0.82);
          if (!both) over.delete(key); else { const n = (over.get(key) || 0) + 1; over.set(key, n); if (n >= (SP.after_f || 12) && makeRoom(a, b, SP.force_after_f ? n >= SP.force_after_f : false)) over.set(key, 0); } }
      }
    },
  };
  return crowd;
}

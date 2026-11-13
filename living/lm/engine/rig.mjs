// rig.mjs — our parent groups round the read-only model, and the ONLY file that calls into createSpud's api.
//
//   root     his centre in the room (x, y in body heights)
//    world   strain in the ROOM's axes about his centre: stretch along a throw, squash flat on a wall (lxx, lxy, lyy)
//     turn   roll (screen plane) and pitch, about his centre
//      bone  squash / stretch about the pivot (sy, sx), shear (his top behind his feet), then down to his feet
//       spud the model, untouched
//
// Every call into the model, in order, every step (ENGINE.md section 4):
//   before step:  state.squash.to = 1 (cancels the model's breath sine exactly), state.leanX.to = 0, turnTo(yaw), glitch(k)
//   step(time, 1/60)   or skipped while every model spring is at rest (level of detail C: he costs 0 ms of deform)
//   after step:   spud.position.x and spud.rotation.z put back to 0 (position and roll are the rig's)
//   never:        place, hop, land, jumped, duck, spin, snap
// Game-feel and physics engineer (seat 3).
import { DT, HZ } from './clock.mjs';
import { IDX } from './channels.mjs';

const EPS = 1e-4;

export function createRig({ T, physics: J, channels: ch, clock, yScale = 1, lod = 'auto', max = 5 }) {
  const ZS = (J.crowd_space && J.crowd_space.on !== false && J.crowd_space.depth_stagger_bh) || 0, ZSLOT = [0, -1, 1, -2, 2], ZTAN = Math.sqrt(Math.max(0, yScale * yScale - 1));
  const cap = J.squash.cap, deep = !!J.squash.clips_may_exceed_cap, A = J.body.half_height || 0.5, HT = 2 * A;
  const lo = deep ? Math.log(0.3) : Math.log(1 - cap), hi = deep ? Math.log(1.25) : Math.log(1 + cap);
  const slew = J.yaw_slew_rad_per_frame == null ? 0.13 : J.yaw_slew_rad_per_frame;
  const R = Array.from({ length: max }, () => null);
  const rig = {
    lod, stepped: 0, skipped: 0, modelMs: 0, now: null,
    /** build the groups round one createSpud api and put them in the scene */
    build(slot, api, scene) {
      const root = new T.Group(), world = new T.Group(), turn = new T.Group(), bone = new T.Group();
      world.matrixAutoUpdate = false; bone.matrixAutoUpdate = false;
      scene.add(root); root.add(world); world.add(turn); turn.add(bone); bone.add(api.spud);
      R[slot] = { api, root, world, turn, bone, S: api.state, awake: 30, asleep: false, arms: false, worn: false, lodName: 'A', s1: 1, s2: 1, axis: 0 };
      return R[slot];
    },
    remove(slot, scene) { const r = R[slot]; if (!r) return; scene.remove(r.root); R[slot] = null; },
    get(slot) { return R[slot]; },
    api(slot) { return R[slot] && R[slot].api; },
    /** keep the model stepping for a while (anything the rig cannot see: an outfit, a face swap, a dent) */
    wake(slot, frames = 30) { const r = R[slot]; if (r) r.awake = Math.max(r.awake, frames); },
    /** flesh: a kick into one of the model's own springs ('squash' | 'wob' | 'leanX' | 'leanZ' | 'yaw') */
    kick(slot, spring, v) { const r = R[slot]; if (!r) return; r.S[spring].kick(v); r.awake = Math.max(r.awake, 2); },
    /** a dent where the finger is. lx, ly = offset from his centre in his own frame, body heights. */
    poke(slot, lx, ly, power = 1) { const r = R[slot]; if (!r) return;
      const W = J.body.half_width || 0.5, u = Math.max(-0.95, Math.min(0.95, lx / W)), v = Math.max(-0.95, Math.min(0.95, ly / A)), z = Math.sqrt(Math.max(0.05, 1 - u * u - v * v));
      r.api.poke(new T.Vector3(lx, ly + A, 0.42 * z), new T.Vector3(u * 0.6, v * 0.6, z), power); r.awake = Math.max(r.awake, 4); },
    arms(slot, pose, blend) { const r = R[slot]; if (!r) return; r.api.arms(pose, blend); r.arms = pose !== 'none'; r.awake = Math.max(r.awake, 90); },
    setFace(slot, tex) { const r = R[slot]; if (r) r.api.setFace(tex); },
    wear(slot, build) { const r = R[slot]; if (!r) return; r.worn = !!build; return r.api.wear(build); },

    apply(slot) {
      const r = R[slot]; if (!r) return; const o = slot * ch.NCH, v = ch.out, S = r.S;
      // ---- our groups: free on the GPU, always at 60 ----
      // (final round, Potato seat: "never drawn merged") each Potato after the first stands on his own depth, so two who overlap draw as one IN FRONT of the
      // other, never as one potato with two faces. The sticker camera is orthographic and tipped: y is corrected so nobody moves on screen. Slot 0 is untouched (z 0).
      const zs = ZS * ZSLOT[slot % 5];
      r.root.position.set(v[o + IDX.x] + v[o + IDX.dx] + v[o + IDX.cx], (v[o + IDX.y] + v[o + IDX.dy] + v[o + IDX.cy]) * yScale + zs * ZTAN, zs);
      // world strain -> two stretches and an axis (volume kept: the third axis takes what is left)
      const lxx = v[o + IDX.lxx], lxy = v[o + IDX.lxy], lyy = v[o + IDX.lyy], m = (lxx + lyy) / 2, d = Math.hypot((lxx - lyy) / 2, lxy);
      let l1 = m + d, l2 = m - d; if (l1 > hi) l1 = hi; if (l2 < lo) l2 = lo;
      const a = d > 1e-9 ? 0.5 * Math.atan2(2 * lxy, lxx - lyy) : 0, c = Math.cos(a), s = Math.sin(a), s1 = Math.exp(l1), s2 = Math.exp(l2), sz = Math.exp(-(l1 + l2));
      r.s1 = s1; r.s2 = s2; r.axis = a;
      r.world.matrix.set(c * c * s1 + s * s * s2, c * s * (s1 - s2), 0, 0,  c * s * (s1 - s2), s * s * s1 + c * c * s2, 0, 0,  0, 0, sz, 0,  0, 0, 0, 1);
      r.turn.rotation.set(v[o + IDX.pitch], 0, v[o + IDX.roll]);
      let sy = v[o + IDX.sy]; if (!deep) sy = sy < 1 - cap ? 1 - cap : sy > 1 + cap ? 1 + cap : sy;
      let sx = v[o + IDX.sx]; if (sx !== sx) sx = 1 / Math.sqrt(sy);
      const pv = v[o + IDX.pivot], shr = v[o + IDX.shear] / HT;
      r.bone.matrix.set(sx, shr * sy, 0, shr * pv * (1 - sy),  0, sy, 0, pv * (1 - sy) - A,  0, 0, sx, 0,  0, 0, 0, 1);
      r.sy = sy;
      // ---- the model: told a pose, nothing else ----
      // (assembly round) the turn he is ASKED for is slew-limited before the model hears it: a throw that cuts into an about-face, or two seats
      // adding to the same turn, can ask for half a turn in a few frames, and the judge's 0.15 rad a frame is a promise. physics.json yaw_slew_rad_per_frame (0 = off).
      let yaw = v[o + IDX.yaw]; const gl = v[o + IDX.glitch];
      if (slew > 0) { if (r.yawCmd == null) r.yawCmd = yaw; const dq = yaw - r.yawCmd; r.yawCmd += dq > slew ? slew : dq < -slew ? -slew : dq; yaw = r.yawCmd; }
      S.squash.to = 1; S.leanX.to = 0; if (S.yaw.to !== yaw) { r.api.turnTo(yaw); }
      if (gl !== r.gl) { r.api.glitch(gl); r.gl = gl; r.awake = Math.max(r.awake, 2); }
      const rest = Math.abs(S.yaw.x - yaw) < EPS && Math.abs(S.yaw.v) < EPS && Math.abs(S.squash.x - 1) < EPS && Math.abs(S.squash.v) < EPS &&
        Math.abs(S.leanX.x) < EPS && Math.abs(S.leanX.v) < EPS && Math.abs(S.leanZ.x - S.leanZ.to) < EPS && Math.abs(S.leanZ.v) < EPS &&
        Math.abs(S.wob.x) < EPS && Math.abs(S.wob.v) < EPS && S.dents.length === 0 && !S.walking && !S.airborne && !r.arms && !r.worn && gl === 0;
      if (r.awake > 0) r.awake--;
      const sleep = rig.lod !== 'full' && rest && r.awake === 0;
      if (sleep && r.asleep) { rig.skipped++; r.lodName = 'C'; return; }
      if (sleep) { for (const sp of [S.squash, S.leanX, S.wob]) { sp.x = sp.to; sp.v = 0; } S.yaw.x = S.yaw.to; S.yaw.v = 0; S.leanZ.x = S.leanZ.to; S.leanZ.v = 0; }   // one last exact step, then rest
      const t0 = rig.now ? rig.now() : 0;
      r.api.step(clock.k / HZ, DT);
      r.api.spud.position.x = 0; r.api.spud.rotation.z = 0;
      if (rig.now) rig.modelMs += rig.now() - t0;
      r.asleep = sleep; r.lodName = sleep ? 'C' : 'A'; rig.stepped++;
    },
  };
  return rig;
}

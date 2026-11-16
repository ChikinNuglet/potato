/* ░▒▓1▓▒░
EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦resu—me¦no—n—0¦EHOSTUNREACH?¦
[ENOMEM]¦un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦!?_##¦h0ld—¦0xBEEF?!¦
[ENOMEM]¦EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦0xAC1D?!¦[ENOMEM]¦[HTTP_404]¦ERR:418¦
un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EFAULT//¦[HTTP_404]¦
h0ld—¦0xDEAD_7¦EIO::?¦ERR:418¦h0ld—¦73%??¦[ENOMEM]¦EFAULT//¦[EPIPE]¦h0ld—¦42//0¦[ENOMEM]¦
EFAULT//¦EHOSTUNREACH?¦ERR:418¦[E_SNARK_OVERRUN]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦
[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EBUSY_?¦ERR:418¦h0ld—¦EHOSTUNREACH?¦EIO::?¦
ERR:418¦h0ld—¦[ETIMEDOUT]¦[HTTP_404]¦ERR:418¦0xBABE~¦[EOVERFLOW]¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦
h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦
EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦EHOSTUNREACH?¦EIO::?¦[ENETDOWN]¦
EBUSY_?¦[EOVERFLOW]¦[HTTP_404]¦0xBABE~¦ATTITUDE_CHECKSUM?!¦EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦
0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦:_:#¦0xAC1D?!¦[ENOMEM]¦[EINTR]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
think—ink…¦hmm_73?!¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦
[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦ERR:418¦EILSEQ::¦ERR:418¦EBUSY_?¦ATTITUDE_CHECKSUM?!¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦[ETIMEDOUT]¦[EOVERFLOW]¦h0ld—¦0xBABE~¦h0ld—¦
0xAC1D?!¦EAGAIN?!¦[ENOMEM]¦EFAULT//¦ERR:418¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[ECONNABORTED]¦
EIO::?¦ERR:418¦EFAULT//¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦%%/?!¦#//?!¦#//?!¦%%/?!¦#//?!¦#:#?!¦
0xDEAD_7¦#//?!¦~//~¦—%—¦__%__¦@_@?!¦—%—¦^^::#¦!?%~¦0x0B__¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
[ECONNABORTED]¦EIO::?¦0xBABE~¦EHOSTUNREACH?¦h0ld—¦<HTTP 503?>¦[ETIMEDOUT]¦EAGAIN?!¦ERR:418¦
h0ld—¦0xAC1D?!¦EIO::?¦0xBABE~¦[ETIMEDOUT]¦EFAULT//¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦
think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦<HTTP 503?>¦[HTTP_404]¦!?%~¦#:#?!¦
^^::#¦[HTTP_404]¦@#/_¦@_@?!¦0xAC1D?!¦[HTTP_404]¦#:#?!¦%_?!%¦0xAC1D?!¦n0p%_[E_SYNC_LOST]¦
zzrrp::<EGO?>¦d0wnl0ad_c0nfidence_99%?!
░▒▓█ */
// spudphys — adapter (5): spring-bone chains for rig.mjs (antennae, ears, hat tips, the witch hat's point, tails).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Plain data in, quaternions out, so rig.mjs stays independent. Each joint is a particle: distance links between
// neighbours (bones never stretch) and an XPBD attachment to its animated goal (where it would be if the chain were
// rigid under the root's pose), with compliance from `stiffness`. Like VRM spring bones, but step-size independent.

import { DistanceGroup, restLengths } from '../constraints/distance.mjs';
import { AttachGroup } from '../constraints/attach.mjs';
import { quatFromTo, quatMul, quatRotate } from '../vec.mjs';

/**
 * @param {import('../world.mjs').World} world
 * @param {object} o  root: Driver, joints: [[x,y,z], ...] rest positions in the root's frame (root first),
 *   stiffness 0..1 (0.5), drag (2), gravity scale (1), radius (0.02), colliders, active, substeps (6)
 */
export function chain(world, o) {
  const J = o.joints, n = J.length;
  const rest = new Float64Array(3 * n); J.forEach((j, i) => rest.set(j, 3 * i));
  const invMass = new Float64Array(n).fill(1); invMass[0] = 0;
  const body = world.addBody({
    kind: 'chain', name: o.name || 'chain', n, rest, invMass, radius: o.radius ?? 0.02, space: o.root,
    substeps: o.substeps ?? 6, active: o.active, colliders: o.colliders || [], drag: o.drag ?? 2, gravity: o.gravity ?? 1,
  });
  const p0 = body.p0, s = Math.min(1, Math.max(0, o.stiffness ?? 0.5));
  const ids = new Int32Array(2 * (n - 1)), lids = new Int32Array(2 * (n - 1));
  for (let i = 0; i < n - 1; i++) { ids[2 * i] = p0 + i; ids[2 * i + 1] = p0 + i + 1; lids[2 * i] = i; lids[2 * i + 1] = i + 1; }
  const links = new DistanceGroup(ids, restLengths(rest, lids), 0, { name: 'bones' });
  const rootPin = new AttachGroup(new Int32Array([p0]), rest.slice(0, 3), o.root, 0);
  body.groups.push(rootPin);
  if (s > 0 && n > 1) {
    const gIds = new Int32Array(n - 1); for (let i = 1; i < n; i++) gIds[i - 1] = p0 + i;
    body.groups.push(new AttachGroup(gIds, rest.slice(3), o.root, (1 / s - 1) * 2e-3));
  }
  body.groups.push(links);
  // forward pass after everything else keeps bone lengths exact in the output
  const len = links.rest;
  const Q = new Float64Array(4), T = new Float64Array(4), D = new Float64Array(3);
  return {
    body, kind: 'chain', n, links,
    /** Per bone (n-1), the local rotation [x,y,z,w] in its parent's frame that turns the rest direction into the
     *  simulated one; parent of bone 0 is the root driver. rig.mjs applies these on top of its own pose. */
    rotations(out = new Float64Array(4 * (n - 1))) {
      world.poseDrivers(0);
      const x = world.x, r = o.root;
      Q.set(r.q);
      for (let i = 0; i < n - 1; i++) {
        const a = 3 * (p0 + i), b = a + 3;
        // simulated direction into the parent frame: inverse(Q) * d
        T[0] = -Q[0]; T[1] = -Q[1]; T[2] = -Q[2]; T[3] = Q[3];
        quatRotate(T, 0, x[b] - x[a], x[b + 1] - x[a + 1], x[b + 2] - x[a + 2], D, 0);
        const rx = rest[3 * i + 3] - rest[3 * i], ry = rest[3 * i + 4] - rest[3 * i + 1], rz = rest[3 * i + 5] - rest[3 * i + 2];
        quatFromTo(rx, ry, rz, D[0], D[1], D[2], out, 4 * i);
        quatMul(Q, 0, out, 4 * i, Q, 0);
      }
      return out;
    },
    /** Joint positions rebuilt from the root + rotations (bone lengths exact). */
    positions(out = new Float64Array(3 * n), rots) {
      rots = rots || this.rotations();
      const r = o.root; world.poseDrivers(0);
      r.apply(rest.subarray(0, 3), out, 0);
      Q.set(r.q);
      for (let i = 0; i < n - 1; i++) {
        quatMul(Q, 0, rots, 4 * i, Q, 0);
        const rx = rest[3 * i + 3] - rest[3 * i], ry = rest[3 * i + 4] - rest[3 * i + 1], rz = rest[3 * i + 5] - rest[3 * i + 2];
        quatRotate(Q, 0, rx, ry, rz, D, 0);
        out[3 * i + 3] = out[3 * i] + D[0]; out[3 * i + 4] = out[3 * i + 1] + D[1]; out[3 * i + 5] = out[3 * i + 2] + D[2];
      }
      return out;
    },
    boneLengths: len,
  };
}

/**
 * Builds a physics chain from a rig.mjs spec chain (plain data, rig.mjs is not imported):
 *   rigChain = { name, anchor, names: [bone names], path: [[x,y,z] world rest joints, figure coords] }
 *   bones    = rig spec bones list ({ name, local }) to find the anchor's rest position (rest rotations are identity)
 * The driver must carry the anchor bone's world pose. Returns the chain plus `names`, so the game can do
 *   rots = ch.rotations(); names.forEach((n, i) => rig.bones[n].quaternion.fromArray(rots, 4 * i))
 * (rig.mjs chain bones have identity rest rotations, so the local rotation is the bone's quaternion).
 */
export function chainFromRig(world, rigChain, bones, driver, o = {}) {
  const first = bones.find(b => b.name === rigChain.names[0]);
  if (!first) throw new Error('spudphys: chain bone ' + rigChain.names[0] + ' not in the bones list');
  const p0 = rigChain.path[0], A = [p0[0] - first.local[0], p0[1] - first.local[1], p0[2] - first.local[2]];
  const joints = rigChain.path.map(p => [p[0] - A[0], p[1] - A[1], p[2] - A[2]]);
  const s = rigChain.spring || {};
  const ch = chain(world, { root: driver, joints, name: rigChain.name, stiffness: o.stiffness ?? s.stiffness ?? 0.4,
    drag: o.drag ?? 2, gravity: o.gravity ?? 1, radius: o.radius ?? (rigChain.r ? rigChain.r[1] : 0.02), colliders: o.colliders, active: o.active });
  return { ...ch, names: rigChain.names.slice() };
}

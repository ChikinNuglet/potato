// spudphys — adapter (4): tumbling props (crates, cans) as shape-matched particle clusters.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// A box = 8 corners + 6 face centres; a can = two rings of 6 + 2 caps. One rigid (or squishy) shape match each,
// particles collide with friction, so they tumble, roll and settle. `pile` puts several props in one body so they
// also knock into each other (each prop is an oriented box to the others' particles).
// Kicks (`kick: { t, v, spin }`) set velocities at an exact step. For most gags use toss.mjs (no simulation).

import { ShapeMatchGroup } from '../constraints/shapematch.mjs';
import { boxContact, contactResult as N } from '../colliders.mjs';
import { quatToMat3, composeMat4 } from '../vec.mjs';

const TMP3 = new Float64Array(3);

function shapePoints(shape, size, round) {
  const pts = [];
  if (shape === 'can') {
    const r = size[0] / 2 - round, h = size[1] / 2 - round;
    for (const y of [-h, h]) for (let i = 0; i < 6; i++) {
      const c = [1, 0.5, -0.5, -1, -0.5, 0.5][i], s = [0, 0.8660254037844386, 0.8660254037844386, 0, -0.8660254037844386, -0.8660254037844386][i];
      pts.push(r * c, y, r * s);
    }
    pts.push(0, -h, 0, 0, h, 0);
  } else {
    const hx = size[0] / 2 - round, hy = size[1] / 2 - round, hz = size[2] / 2 - round;
    for (let i = 0; i < 8; i++) pts.push(i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz);
    pts.push(hx, 0, 0, -hx, 0, 0, 0, hy, 0, 0, -hy, 0, 0, 0, hz, 0, 0, -hz);
  }
  return new Float64Array(pts);
}

function makeProp(world, body, spec, localStart, restOut, k0) {
  const shape = spec.shape || 'box', size = spec.size || [0.5, 0.5, 0.5];
  const sz = shape === 'can' ? [size[0], size[1], size[0]] : size;
  const round = spec.round ?? Math.min(sz[0], sz[1], sz[2]) * 0.1;
  const local = shapePoints(shape, sz, round), m = local.length / 3;
  const at = spec.at || [0, 0, 0], q0 = spec.quat || [0, 0, 0, 1];
  const R = new Float64Array(9); quatToMat3(q0, 0, R, 0);
  for (let i = 0; i < m; i++) {
    const lx = local[3 * i], ly = local[3 * i + 1], lz = local[3 * i + 2], o = 3 * (localStart + i);
    restOut[o] = at[0] + R[0] * lx + R[3] * ly + R[6] * lz;
    restOut[o + 1] = at[1] + R[1] * lx + R[4] * ly + R[7] * lz;
    restOut[o + 2] = at[2] + R[2] * lx + R[5] * ly + R[8] * lz;
  }
  const ids = new Int32Array(m); for (let i = 0; i < m; i++) ids[i] = body.p0 + localStart + i;
  const mass = new Float64Array(m).fill((spec.mass ?? 1) / m);
  const qOff = world.allocState([q0[0], q0[1], q0[2], q0[3], 0]);   // quaternion + last vertical speed (impacts)
  // shape match rest = local points (centred), so R(q) is the prop's orientation and the centroid its position
  const sm = new ShapeMatchGroup(ids, local, mass, qOff, { stiffness: spec.stiffness ?? 1, beta: spec.squish ?? 0 });
  const kicks = [].concat(spec.kick || []).map(kk => ({ k: world.stepAt(kk.t), v: kk.v || [0, 0, 0], spin: kk.spin || [0, 0, 0] }));
  if (spec.v || spec.spin) kicks.push({ k: k0, v: spec.v || [0, 0, 0], spin: spec.spin || [0, 0, 0] });
  const half = new Float64Array([sz[0] / 2 - round, sz[1] / 2 - round, sz[2] / 2 - round]);
  return { spec, sm, ids, m, qOff, q0, kicks, half, round, size: sz, localStart, rad: Math.sqrt(sz[0] * sz[0] + sz[1] * sz[1] + sz[2] * sz[2]) / 2 };
}

/**
 * One prop, or with `pile`, several props that collide with each other.
 * spec: { shape: 'box'|'can', size, at, quat, mass, stiffness (1 rigid), squish (0..1 bulge), round,
 *         kick: {t, v, spin} | [...], v, spin (initial), active, colliders, substeps (4), friction via colliders }
 */
export function prop(world, spec) { return pile(world, [spec], { ...spec, pile: false }).props[0]; }

export function pile(world, specs, o = {}) {
  const counts = specs.map(s => (s.shape === 'can' ? 14 : 14));
  const n = counts.reduce((a, b) => a + b, 0);
  const rest = new Float64Array(3 * n), radius = new Float64Array(n), invMass = new Float64Array(n);
  const body = world.addBody({
    kind: specs.length > 1 ? 'pile' : 'prop', name: o.name || 'prop', n, rest, invMass, radius, space: null,
    substeps: o.substeps ?? (specs.length > 1 ? 6 : 4), active: o.active || specs[0].active, colliders: o.colliders || specs[0].colliders || [],
    drag: o.drag ?? 0.05, vmax: o.vmax ?? 80,
  });
  const k0 = body.kStart;
  const props = [];
  let s = 0;
  for (const spec of specs) {
    const P = makeProp(world, body, spec, s, rest, k0);
    for (let i = 0; i < P.m; i++) { radius[s + i] = P.round; invMass[s + i] = P.m / (spec.mass ?? 1); }
    body.groups.push(P.sm);
    props.push(P); s += P.m;
  }
  // kicks at exact steps: v_i = v + spin x (x_i - c)
  body.pre = (w, b, k) => {
    for (const P of props) for (const kk of P.kicks) {
      if (kk.k !== k) continue;
      const c = P.sm.centroid(w.x), X = w.x, V = w.v;
      for (const id of P.ids) {
        const q = 3 * id, rx = X[q] - c[0], ry = X[q + 1] - c[1], rz = X[q + 2] - c[2];
        V[q] = kk.v[0] + kk.spin[1] * rz - kk.spin[2] * ry;
        V[q + 1] = kk.v[1] + kk.spin[2] * rx - kk.spin[0] * rz;
        V[q + 2] = kk.v[2] + kk.spin[0] * ry - kk.spin[1] * rx;
      }
    }
  };
  // landing impacts -> world.events (sound/FX only)
  body.post = (w, b, k) => {
    for (let pi = 0; pi < props.length; pi++) {
      const P = props[pi];
      let vy = 0; for (const id of P.ids) vy += w.v[3 * id + 1]; vy /= P.m;
      const last = w.state[P.qOff + 4];
      if (last < -2 && vy - last > 2) w.events.push({ type: 'impact', body: b.id, prop: pi, k, speed: -last });
      w.state[P.qOff + 4] = vy;
    }
  };
  body.onReset = (w) => { for (const P of props) { w.state.set(P.q0, P.qOff); w.state[P.qOff + 4] = 0; } };
  // prop vs prop: each prop's particles against the other props' oriented boxes (both directions, so every pair is
  // handled from both sides). Only the particle that is inside moves; its shape match turns that into a push + a
  // torque on its own prop. Share by the contact normal (shock propagation): pushed UP out of the prop below = 0.95,
  // pushed DOWN into what's beneath = 0.05, sideways = 0.5, so stacks rest instead of being driven into the floor.
  // Friction against the other prop's motion this substep (static below mu_s * depth, else kinetic), so crates on
  // crates stay put until something knocks them (Nov 2 look strips: frictionless stacks crept sideways and collapsed,
  // then crates were pushed into each other).
  if (props.length > 1) {
    const C = new Float64Array(3 * props.length), Cp = new Float64Array(3 * props.length), M = new Float64Array(9 * props.length);
    const muS = o.friction ?? 0.6, muK = o.kineticFriction ?? 0.45, iters = o.contactIters ?? 2;
    body.collide = (w) => {
      const X = w.x, Pp = w.p;
      for (let a = 0; a < props.length; a++) {
        props[a].sm.centroid(X, C.subarray(3 * a, 3 * a + 3)); props[a].sm.centroid(Pp, Cp.subarray(3 * a, 3 * a + 3));
        quatToMat3(w.state, props[a].qOff, M, 9 * a);
      }
      for (let it = 0; it < iters; it++) for (let a = 0; a < props.length; a++) for (let b2 = 0; b2 < props.length; b2++) {
        if (a === b2) continue;
        if (it > 0) { props[b2].sm.centroid(X, C.subarray(3 * b2, 3 * b2 + 3)); }
        const A = props[a], B = props[b2];
        const dx = C[3 * a] - C[3 * b2], dy = C[3 * a + 1] - C[3 * b2 + 1], dz = C[3 * a + 2] - C[3 * b2 + 2], rr = A.rad + B.rad;
        if (dx * dx + dy * dy + dz * dz > rr * rr) continue;
        const cB = C.subarray(3 * b2, 3 * b2 + 3), mB = M.subarray(9 * b2, 9 * b2 + 9);
        const mvx = cB[0] - Cp[3 * b2], mvy = cB[1] - Cp[3 * b2 + 1], mvz = cB[2] - Cp[3 * b2 + 2];
        for (const id of A.ids) {
          const q = 3 * id;
          if (!boxContact(cB, mB, B.half, B.round, X[q], X[q + 1], X[q + 2], w.r[id], Pp[q], Pp[q + 1], Pp[q + 2])) continue;
          const nx = N[0], ny = N[1], nz = N[2], share = 0.5 + 0.45 * ny, d = N[3] * share;
          X[q] += nx * d; X[q + 1] += ny * d; X[q + 2] += nz * d;
          // friction: tangential motion of this particle relative to B this substep
          let tx = X[q] - Pp[q] - mvx, ty = X[q + 1] - Pp[q + 1] - mvy, tz = X[q + 2] - Pp[q + 2] - mvz;
          const dn = tx * nx + ty * ny + tz * nz; tx -= dn * nx; ty -= dn * ny; tz -= dn * nz;
          const tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
          if (tl > 0) {
            const k = tl < muS * d ? 1 : Math.min(1, muK * d / tl);
            X[q] -= tx * k; X[q + 1] -= ty * k; X[q + 2] -= tz * k;
          }
        }
      }
    };
  }
  const out = props.map((P) => ({
    body, kind: 'prop', size: P.size, shape: P.spec.shape || 'box', group: P.sm,
    /** Column-major 4x4 (Object3D.matrix): orientation from the shape match, position = centroid. */
    matrix(out16 = new Float64Array(16)) {
      const c = P.sm.centroid(world.x, TMP3);
      return composeMat4(c[0], c[1], c[2], world.state, P.qOff, out16, 0);
    },
    position(out3 = new Float64Array(3)) { return P.sm.centroid(world.x, out3); },
    quaternion(out4 = new Float64Array(4)) { out4.set(world.state.subarray(P.qOff, P.qOff + 4)); return out4; },
    /** Kinetic energy (tests). */
    energy() { let e = 0; for (const id of P.ids) { const q = 3 * id, v = world.v; e += 0.5 * (v[q] * v[q] + v[q + 1] * v[q + 1] + v[q + 2] * v[q + 2]) / world.w[id]; } return e; },
    ids: P.ids,
  }));
  return { body, props: out };
}


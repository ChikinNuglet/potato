// spudphys — adapter (3): rope (Kevin's tow cable).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// segments+1 particles, distance links solved forward/backward on alternate substeps, the heavy end (`to`, Kevin's
// hitch) kinematic with a tether so the cable never stretches like a rubber band; the light end (`from`) is pinned,
// and turns soft when the drivers are further apart than the rope is long. rope.tension (0..1) is for sound/FX only.

import { DistanceGroup } from '../constraints/distance.mjs';
import { AttachGroup, TetherGroup } from '../constraints/attach.mjs';

/**
 * @param {import('../world.mjs').World} world
 * @param {object} o  from: Driver, to: Driver, fromPoint/toPoint: local points ([0,0,0]), length, segments (18),
 *   radius (0.03), colliders, active, substeps (12), drag (0.3), softness (attach compliance when taut, 2e-3),
 *   bend (bending compliance, skip-one links: 0.02 = a stiff-ish cable that sags in smooth curves; null = a limp string)
 */
export function rope(world, o) {
  const segs = o.segments ?? 18, n = segs + 1, L = o.length ?? 2, seg = L / segs;
  const from = o.from, to = o.to, fp = o.fromPoint || [0, 0, 0], tp = o.toPoint || [0, 0, 0];
  const invMass = new Float64Array(n).fill(1 / Math.max(1e-6, (o.mass ?? 0.2) / n));
  invMass[n - 1] = 0;                                     // Kevin's end: kinematic
  const stOff = world.allocState([0]);                  // tension (saved so readers after restore see it)
  const body = world.addBody({
    kind: 'rope', name: o.name || 'rope', n, invMass, radius: o.radius ?? 0.03, space: null,
    substeps: o.substeps ?? 12, active: o.active, colliders: o.colliders || [], drag: o.drag ?? 0.3,
    vmax: o.vmax ?? 60, follow: [from, to].filter(Boolean), gravity: o.gravity ?? 1,
  });
  const p0 = body.p0;
  const ids = new Int32Array(2 * segs), rest = new Float64Array(segs).fill(seg);
  for (let i = 0; i < segs; i++) { ids[2 * i] = p0 + i; ids[2 * i + 1] = p0 + i + 1; }
  const links = new DistanceGroup(ids, rest, 0, { alternate: true, name: 'links' });
  const pinFrom = new AttachGroup(new Int32Array([p0]), new Float64Array(fp), from, 0);
  const pinTo = new AttachGroup(new Int32Array([p0 + n - 1]), new Float64Array(tp), to, 0);
  const tIds = new Int32Array(n - 1), tAn = new Int32Array(n - 1).fill(p0 + n - 1), tLen = new Float64Array(n - 1);
  for (let i = 0; i < n - 1; i++) { tIds[i] = p0 + i; tLen[i] = (n - 1 - i) * seg; }
  const tether = new TetherGroup(tIds, tAn, tLen);
  // bending: links between every other particle (rest = 2 segments, i.e. straight), soft. Without it a slack cable
  // dragged along the ground folds into small zigzags that read as noise at game size (look strips, Nov 2).
  const bend = o.bend === undefined ? 0.02 : o.bend, groups = [pinTo, pinFrom, links];
  if (bend !== null && segs > 1) {
    const bIds = new Int32Array(2 * (segs - 1));
    for (let i = 0; i < segs - 1; i++) { bIds[2 * i] = p0 + i; bIds[2 * i + 1] = p0 + i + 2; }
    groups.push(new DistanceGroup(bIds, new Float64Array(segs - 1).fill(2 * seg), bend, { name: 'bend' }));
  }
  groups.push(tether);
  body.groups.push(...groups);

  const A = new Float64Array(3), B = new Float64Array(3);
  const softness = o.softness ?? 2e-3;
  // per step: how taut (from the drivers' new samples), which sets the far pin's compliance
  body.pre = (w) => {
    w.poseDrivers(1);
    from.apply(fp, A); to.apply(tp, B);
    const dx = A[0] - B[0], dy = A[1] - B[1], dz = A[2] - B[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    let t = (d - (L - 0.05)) / 0.1; t = t < 0 ? 0 : t > 1 ? 1 : t;
    w.state[stOff] = t;
    pinFrom.compliance = t * softness;
  };
  // parked / woken: laid straight between the two ends
  body.park = (w) => {
    from.apply(fp, A); to.apply(tp, B);
    const x = w.x;
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1), q = 3 * (p0 + i);
      x[q] = A[0] + (B[0] - A[0]) * s; x[q + 1] = A[1] + (B[1] - A[1]) * s; x[q + 2] = A[2] + (B[2] - A[2]) * s;
    }
    // a straight line longer than the rope gets pulled in by the tethers on the first substep
  };

  const tmp = new Float64Array(3);
  return {
    body, kind: 'rope', n, links,
    get tension() { return world.state[stOff]; },
    /** Particle positions (world). */
    points(out = new Float64Array(3 * n)) { out.set(world.x.subarray(3 * p0, 3 * (p0 + n))); return out; },
    /** Catmull–Rom resampled polyline with m points (world), for a tube or dough-tube renderer. */
    polyline(out, m = 32) {
      out = out || new Float64Array(3 * m);
      const x = world.x;
      const P = (i, k) => x[3 * (p0 + (i < 0 ? 0 : i > n - 1 ? n - 1 : i)) + k];
      for (let j = 0; j < m; j++) {
        const u = (j / (m - 1)) * (n - 1);
        let i = Math.floor(u); if (i > n - 2) i = n - 2;
        const t = u - i, t2 = t * t, t3 = t2 * t;
        for (let k = 0; k < 3; k++) {
          const a = P(i - 1, k), b = P(i, k), c = P(i + 1, k), d = P(i + 2, k);
          out[3 * j + k] = 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        }
      }
      return out;
    },
    /** Parallel-transport frames along a polyline: 9 per point (tangent, normal, binormal). No trig. */
    frames(pts, out) {
      const m = pts.length / 3; out = out || new Float64Array(9 * m);
      let nx = 0, ny = 0, nz = 0;
      for (let j = 0; j < m; j++) {
        const a = Math.max(0, j - 1), b = Math.min(m - 1, j + 1);
        let tx = pts[3 * b] - pts[3 * a], ty = pts[3 * b + 1] - pts[3 * a + 1], tz = pts[3 * b + 2] - pts[3 * a + 2];
        const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        if (j === 0) { // seed normal: world up projected, else world z
          nx = 0; ny = 1; nz = 0;
          if (Math.abs(ty) > 0.9) { nx = 0; ny = 0; nz = 1; }
        }
        const d = nx * tx + ny * ty + nz * tz;
        nx -= d * tx; ny -= d * ty; nz -= d * tz;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
        out.set([tx, ty, tz, nx, ny, nz, bx, by, bz], 9 * j);
      }
      return out;
    },
    /** Current length along the particles (tests). */
    length() {
      const x = world.x; let s = 0;
      for (let i = 0; i < n - 1; i++) { const a = 3 * (p0 + i), b = a + 3; tmp[0] = x[b] - x[a]; tmp[1] = x[b + 1] - x[a + 1]; tmp[2] = x[b + 2] - x[a + 2]; s += Math.sqrt(tmp[0] * tmp[0] + tmp[1] * tmp[1] + tmp[2] * tmp[2]); }
      return s;
    },
  };
}

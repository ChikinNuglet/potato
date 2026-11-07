// spudphys — rotation from a 3x3 matrix (the rotational part of a deformation).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Written from the paper: M. Müller, J. Bender, N. Chentanez, M. Macklin, "A Robust Method to Extract the
// Rotational Part of Deformations", MIG 2016. Quaternion iteration, warm-started, fixed maximum iteration count.

import { quatToMat3, quatMul, quatNormalize, quatAxisAngle } from './vec.mjs';

const R = new Float64Array(9), dq = new Float64Array(4);

/**
 * Updates quaternion q (at offset qo, warm start) so that R(q) is the rotation closest to A.
 * A: 9 numbers column-major. iters: fixed count (deterministic).
 */
export function extractRotation(A, q, qo = 0, iters = 4) {
  for (let it = 0; it < iters; it++) {
    quatToMat3(q, qo, R, 0);
    // omega = (r0 x a0 + r1 x a1 + r2 x a2) / (|r0.a0 + r1.a1 + r2.a2| + eps)
    let ox = 0, oy = 0, oz = 0, d = 0;
    for (let c = 0; c < 3; c++) {
      const rx = R[3 * c], ry = R[3 * c + 1], rz = R[3 * c + 2];
      const ax = A[3 * c], ay = A[3 * c + 1], az = A[3 * c + 2];
      ox += ry * az - rz * ay; oy += rz * ax - rx * az; oz += rx * ay - ry * ax;
      d += rx * ax + ry * ay + rz * az;
    }
    const s = 1 / ((d < 0 ? -d : d) + 1e-9);
    ox *= s; oy *= s; oz *= s;
    const w = Math.sqrt(ox * ox + oy * oy + oz * oz);
    if (w < 1e-9) break;
    quatAxisAngle(ox, oy, oz, w, dq, 0);
    quatMul(dq, 0, q, qo, q, qo);
    quatNormalize(q, qo);
  }
}

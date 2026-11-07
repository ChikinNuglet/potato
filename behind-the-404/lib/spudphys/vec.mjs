// spudphys — flat-array vector, quaternion and 3x3 helpers. No allocation in the hot paths.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Quaternions are [x, y, z, w]. 3x3 matrices are 9 numbers, column-major (m[0..2] = first column).

import { dsin, dcos } from './dmath.mjs';

export function quatToMat3(q, qo, m, mo = 0) {
  const x = q[qo], y = q[qo + 1], z = q[qo + 2], w = q[qo + 3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  m[mo] = 1 - (yy + zz); m[mo + 1] = xy + wz; m[mo + 2] = xz - wy;
  m[mo + 3] = xy - wz; m[mo + 4] = 1 - (xx + zz); m[mo + 5] = yz + wx;
  m[mo + 6] = xz + wy; m[mo + 7] = yz - wx; m[mo + 8] = 1 - (xx + yy);
}
/** out = a * b (Hamilton product). out may alias a or b. */
export function quatMul(a, ao, b, bo, out, oo) {
  const ax = a[ao], ay = a[ao + 1], az = a[ao + 2], aw = a[ao + 3];
  const bx = b[bo], by = b[bo + 1], bz = b[bo + 2], bw = b[bo + 3];
  out[oo] = aw * bx + ax * bw + ay * bz - az * by;
  out[oo + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[oo + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[oo + 3] = aw * bw - ax * bx - ay * by - az * bz;
}
export function quatNormalize(q, o = 0) {
  const l = Math.sqrt(q[o] * q[o] + q[o + 1] * q[o + 1] + q[o + 2] * q[o + 2] + q[o + 3] * q[o + 3]);
  if (l === 0) { q[o] = 0; q[o + 1] = 0; q[o + 2] = 0; q[o + 3] = 1; return; }
  const s = 1 / l; q[o] *= s; q[o + 1] *= s; q[o + 2] *= s; q[o + 3] *= s;
}
/** Normalised lerp along the short way. */
export function quatNlerp(a, ao, b, bo, s, out, oo) {
  const d = a[ao] * b[bo] + a[ao + 1] * b[bo + 1] + a[ao + 2] * b[bo + 2] + a[ao + 3] * b[bo + 3];
  const sb = d < 0 ? -s : s, sa = 1 - s;
  out[oo] = a[ao] * sa + b[bo] * sb; out[oo + 1] = a[ao + 1] * sa + b[bo + 1] * sb;
  out[oo + 2] = a[ao + 2] * sa + b[bo + 2] * sb; out[oo + 3] = a[ao + 3] * sa + b[bo + 3] * sb;
  quatNormalize(out, oo);
}
/** Quaternion from axis (need not be unit) and angle, using deterministic trig. */
export function quatAxisAngle(ax, ay, az, angle, out, oo = 0) {
  const l = Math.sqrt(ax * ax + ay * ay + az * az);
  if (l === 0 || angle === 0) { out[oo] = 0; out[oo + 1] = 0; out[oo + 2] = 0; out[oo + 3] = 1; return out; }
  const h = angle * 0.5, s = dsin(h) / l;
  out[oo] = ax * s; out[oo + 1] = ay * s; out[oo + 2] = az * s; out[oo + 3] = dcos(h);
  return out;
}
/** Quaternion from a rotation vector (axis * angle). */
export function quatFromRotVec(rx, ry, rz, out, oo = 0) {
  const a = Math.sqrt(rx * rx + ry * ry + rz * rz);
  return quatAxisAngle(rx, ry, rz, a, out, oo);
}
/** Shortest-arc rotation turning unit-ish vector a into b (no trig). */
export function quatFromTo(ax, ay, az, bx, by, bz, out, oo = 0) {
  const la = Math.sqrt(ax * ax + ay * ay + az * az), lb = Math.sqrt(bx * bx + by * by + bz * bz);
  if (la === 0 || lb === 0) { out[oo] = 0; out[oo + 1] = 0; out[oo + 2] = 0; out[oo + 3] = 1; return out; }
  ax /= la; ay /= la; az /= la; bx /= lb; by /= lb; bz /= lb;
  const d = ax * bx + ay * by + az * bz;
  if (d < -0.999999) {              // opposite: any perpendicular axis, picked deterministically
    let px = 0, py = -az, pz = ay;
    if (px * px + py * py + pz * pz < 1e-12) { px = az; py = 0; pz = -ax; }
    out[oo] = px; out[oo + 1] = py; out[oo + 2] = pz; out[oo + 3] = 0; quatNormalize(out, oo); return out;
  }
  out[oo] = ay * bz - az * by; out[oo + 1] = az * bx - ax * bz; out[oo + 2] = ax * by - ay * bx; out[oo + 3] = 1 + d;
  quatNormalize(out, oo);
  return out;
}
/** v' = q * v (vector rotate), written to out[oo..]. */
export function quatRotate(q, qo, vx, vy, vz, out, oo) {
  const x = q[qo], y = q[qo + 1], z = q[qo + 2], w = q[qo + 3];
  const tx = 2 * (y * vz - z * vy), ty = 2 * (z * vx - x * vz), tz = 2 * (x * vy - y * vx);
  out[oo] = vx + w * tx + (y * tz - z * ty);
  out[oo + 1] = vy + w * ty + (z * tx - x * tz);
  out[oo + 2] = vz + w * tz + (x * ty - y * tx);
}
/** Column-major 4x4 from position + quaternion (+ uniform or per-axis scale). */
export function composeMat4(px, py, pz, q, qo, out, oo = 0, sx = 1, sy = 1, sz = 1) {
  const x = q[qo], y = q[qo + 1], z = q[qo + 2], w = q[qo + 3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
  out[oo] = (1 - (yy + zz)) * sx; out[oo + 1] = (xy + wz) * sx; out[oo + 2] = (xz - wy) * sx; out[oo + 3] = 0;
  out[oo + 4] = (xy - wz) * sy; out[oo + 5] = (1 - (xx + zz)) * sy; out[oo + 6] = (yz + wx) * sy; out[oo + 7] = 0;
  out[oo + 8] = (xz + wy) * sz; out[oo + 9] = (yz - wx) * sz; out[oo + 10] = (1 - (xx + yy)) * sz; out[oo + 11] = 0;
  out[oo + 12] = px; out[oo + 13] = py; out[oo + 14] = pz; out[oo + 15] = 1;
  return out;
}
export function invert3(m, out) {
  const a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], g = m[6], h = m[7], i = m[8];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (det === 0) return false;
  const s = 1 / det;
  out[0] = A * s; out[1] = -(b * i - c * h) * s; out[2] = (b * f - c * e) * s;
  out[3] = B * s; out[4] = (a * i - c * g) * s; out[5] = -(a * f - c * d) * s;
  out[6] = C * s; out[7] = -(a * h - b * g) * s; out[8] = (a * e - b * d) * s;
  return true;
}

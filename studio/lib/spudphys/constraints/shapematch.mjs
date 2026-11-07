// spudphys — shape matching and closed-surface pressure.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Shape matching after Müller, Heidelberger, Teschner, Gross, "Meshless Deformations Based on Shape Matching"
// (SIGGRAPH 2005), with the rotation found by polar.mjs (Müller et al. 2016). Written from the papers.

import { extractRotation } from '../polar.mjs';
import { quatToMat3, invert3 } from '../vec.mjs';

const A = new Float64Array(9), R = new Float64Array(9), L = new Float64Array(9);

export class ShapeMatchGroup {
  /**
   * @param {Int32Array} ids particle indices
   * @param {Float64Array} restPos 3 per id: rest positions (any frame)
   * @param {Float64Array} mass per id (> 0)
   * @param {number} qOff offset of this group's quaternion in world.state (4 numbers)
   * @param {{ stiffness?: number, beta?: number, iters?: number }} o
   */
  constructor(ids, restPos, mass, qOff, o = {}) {
    this.type = 'shapeMatch'; this.name = o.name || 'shapeMatch';
    this.ids = ids; this.mass = mass; this.qOff = qOff;
    this.stiffness = o.stiffness ?? 1; this.beta = o.beta ?? 0; this.iters = o.iters ?? 4;
    let M = 0, cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < ids.length; i++) { const m = mass[i]; M += m; cx += m * restPos[3 * i]; cy += m * restPos[3 * i + 1]; cz += m * restPos[3 * i + 2]; }
    this.M = M; this.restCentroid = [cx / M, cy / M, cz / M];
    this.rel = new Float64Array(3 * ids.length);
    for (let i = 0; i < ids.length; i++) {
      this.rel[3 * i] = restPos[3 * i] - this.restCentroid[0];
      this.rel[3 * i + 1] = restPos[3 * i + 1] - this.restCentroid[1];
      this.rel[3 * i + 2] = restPos[3 * i + 2] - this.restCentroid[2];
    }
    // Aqq^-1 for the linear (cartoon bulge) blend
    this.Aqq = null;
    if (this.beta > 0) {
      const q = new Float64Array(9);
      for (let i = 0; i < ids.length; i++) {
        const m = mass[i], r = this.rel;
        for (let c = 0; c < 3; c++) for (let rr = 0; rr < 3; rr++) q[3 * c + rr] += m * r[3 * i + rr] * r[3 * i + c];
      }
      this.Aqq = new Float64Array(9);
      if (!invert3(q, this.Aqq)) this.beta = 0;
    }
    this.c = new Float64Array(3);  // centroid from the latest solve (derived, not state)
  }
  centroid(x, out = this.c) {
    const ids = this.ids, mass = this.mass;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < ids.length; i++) { const o = 3 * ids[i], m = mass[i]; cx += m * x[o]; cy += m * x[o + 1]; cz += m * x[o + 2]; }
    const s = 1 / this.M; out[0] = cx * s; out[1] = cy * s; out[2] = cz * s;
    return out;
  }
  solve(W) {
    const x = W.x, w = W.w, ids = this.ids, mass = this.mass, rel = this.rel, n = ids.length;
    const c = this.centroid(x);
    A.fill(0);
    for (let i = 0; i < n; i++) {
      const o = 3 * ids[i], m = mass[i];
      const px = (x[o] - c[0]) * m, py = (x[o + 1] - c[1]) * m, pz = (x[o + 2] - c[2]) * m;
      const rx = rel[3 * i], ry = rel[3 * i + 1], rz = rel[3 * i + 2];
      A[0] += px * rx; A[1] += py * rx; A[2] += pz * rx;
      A[3] += px * ry; A[4] += py * ry; A[5] += pz * ry;
      A[6] += px * rz; A[7] += py * rz; A[8] += pz * rz;
    }
    extractRotation(A, W.state, this.qOff, this.iters);
    quatToMat3(W.state, this.qOff, R, 0);
    let G = R;
    if (this.beta > 0) {                       // G = beta * (Apq Aqq^-1) + (1 - beta) * R
      const B = this.Aqq, b = this.beta;
      for (let col = 0; col < 3; col++) for (let row = 0; row < 3; row++) {
        let s = 0;
        for (let k = 0; k < 3; k++) s += A[3 * k + row] * B[3 * col + k];
        L[3 * col + row] = b * s + (1 - b) * R[3 * col + row];
      }
      G = L;
    }
    const k = this.stiffness;
    for (let i = 0; i < n; i++) {
      const id = ids[i];
      if (w[id] === 0) continue;
      const o = 3 * id, rx = rel[3 * i], ry = rel[3 * i + 1], rz = rel[3 * i + 2];
      const gx = c[0] + G[0] * rx + G[3] * ry + G[6] * rz;
      const gy = c[1] + G[1] * rx + G[4] * ry + G[7] * rz;
      const gz = c[2] + G[2] * rx + G[5] * ry + G[8] * rz;
      x[o] += (gx - x[o]) * k; x[o + 1] += (gy - x[o + 1]) * k; x[o + 2] += (gz - x[o + 2]) * k;
    }
  }
}

/** Whole closed surface keeps its volume times `pressure` (water-balloon look). */
export class PressureGroup {
  constructor(tris, p0, n, restVolume, o = {}) {
    this.type = 'pressure'; this.name = 'pressure';
    this.tris = tris; this.p0 = p0; this.n = n; this.rest = restVolume;
    this.pressure = o.pressure ?? 1; this.compliance = o.compliance ?? 0;
    this.g = new Float64Array(3 * n);
  }
  static volume(x, tris) {
    let v = 0;
    for (let t = 0; t < tris.length; t += 3) {
      const a = 3 * tris[t], b = 3 * tris[t + 1], c = 3 * tris[t + 2];
      v += x[a] * (x[b + 1] * x[c + 2] - x[b + 2] * x[c + 1]) + x[a + 1] * (x[b + 2] * x[c] - x[b] * x[c + 2]) + x[a + 2] * (x[b] * x[c + 1] - x[b + 1] * x[c]);
    }
    return v / 6;
  }
  solve(W) {
    const x = W.x, w = W.w, tris = this.tris, g = this.g, p0 = this.p0;
    g.fill(0);
    let V = 0;
    for (let t = 0; t < tris.length; t += 3) {
      const ia = tris[t], ib = tris[t + 1], ic = tris[t + 2], a = 3 * ia, b = 3 * ib, c = 3 * ic;
      const ax = x[a], ay = x[a + 1], az = x[a + 2], bx = x[b], by = x[b + 1], bz = x[b + 2], cx = x[c], cy = x[c + 1], cz = x[c + 2];
      const bcx = by * cz - bz * cy, bcy = bz * cx - bx * cz, bcz = bx * cy - by * cx;
      V += ax * bcx + ay * bcy + az * bcz;
      let o = 3 * (ia - p0); g[o] += bcx; g[o + 1] += bcy; g[o + 2] += bcz;
      o = 3 * (ib - p0); g[o] += cy * az - cz * ay; g[o + 1] += cz * ax - cx * az; g[o + 2] += cx * ay - cy * ax;
      o = 3 * (ic - p0); g[o] += ay * bz - az * by; g[o + 1] += az * bx - ax * bz; g[o + 2] += ax * by - ay * bx;
    }
    V /= 6;
    let ws = 0;
    for (let i = 0; i < this.n; i++) { const o = 3 * i; ws += w[p0 + i] * (g[o] * g[o] + g[o + 1] * g[o + 1] + g[o + 2] * g[o + 2]) / 36; }
    if (ws === 0) return;
    const s = -(V - this.rest * this.pressure) / (ws + this.compliance * W.invSdt2) / 6;
    for (let i = 0; i < this.n; i++) {
      const k = s * w[p0 + i], o = 3 * (p0 + i), q = 3 * i;
      x[o] += g[q] * k; x[o + 1] += g[q + 1] * k; x[o + 2] += g[q + 2] * k;
    }
  }
}

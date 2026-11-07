/*
Copyright 2021 Matthias Müller - Ten Minute Physics, https://www.youtube.com/channel/UCTG_vrRdKYfrpqCv_WV4eyA
Copyright 2022 Matthias Müller - Ten Minute Physics, https://www.youtube.com/channel/UCTG_vrRdKYfrpqCv_WV4eyA
www.matthiasMueller.info/tenMinutePhysics

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Adapted for spudphys (Potato) by Claude for ChikinNuglet, 2026, from Ten Minute Physics 10-softBodies.html
(SoftBody.solveEdges) and 14-cloth.html (Cloth.solveStretching, Cloth.solveBending): ES module, Float64 state, no
three.js, one group object per constraint set, optional one-sided limit (stretch only), optional alternating sweep
direction (ropes), rows always solved in build order.
*/

/**
 * XPBD distance constraints between particle pairs. Also used for Müller's cloth bending (distance between the far
 * corners of two edge-adjacent triangles), exactly as in 14-cloth.html.
 */
export class DistanceGroup {
  /**
   * @param {Int32Array} ids   2 particle indices per row
   * @param {Float64Array} rest rest length per row
   * @param {number} compliance inverse stiffness (0 = rigid)
   * @param {{ limit?: 'both'|'stretch', alternate?: boolean, name?: string }} [o]
   */
  constructor(ids, rest, compliance = 0, o = {}) {
    this.type = 'distance';
    this.name = o.name || 'distance';
    this.ids = ids; this.rest = rest; this.compliance = compliance;
    this.stretchOnly = o.limit === 'stretch';
    this.alternate = !!o.alternate;
  }
  solve(W, sub) {
    const x = W.x, w = W.w, ids = this.ids, rest = this.rest, n = rest.length;
    const alpha = this.compliance * W.invSdt2, stretchOnly = this.stretchOnly;
    const back = this.alternate && (sub & 1) === 1;
    for (let r = 0; r < n; r++) {
      const i = back ? n - 1 - r : r;
      const id0 = ids[2 * i], id1 = ids[2 * i + 1];
      const w0 = w[id0], w1 = w[id1], ws = w0 + w1;
      if (ws === 0) continue;
      const a = 3 * id0, b = 3 * id1;
      let gx = x[a] - x[b], gy = x[a + 1] - x[b + 1], gz = x[a + 2] - x[b + 2];
      const len = Math.sqrt(gx * gx + gy * gy + gz * gz);
      if (len === 0) continue;
      const C = len - rest[i];
      if (stretchOnly && C <= 0) continue;
      const inv = 1 / len; gx *= inv; gy *= inv; gz *= inv;
      const s = -C / (ws + alpha);
      const s0 = s * w0, s1 = -s * w1;
      x[a] += gx * s0; x[a + 1] += gy * s0; x[a + 2] += gz * s0;
      x[b] += gx * s1; x[b + 1] += gy * s1; x[b + 2] += gz * s1;
    }
  }
  /** Largest relative length error |len - rest| / rest (for tests). */
  maxError(x) {
    let m = 0;
    for (let i = 0; i < this.rest.length; i++) {
      const a = 3 * this.ids[2 * i], b = 3 * this.ids[2 * i + 1];
      const dx = x[a] - x[b], dy = x[a + 1] - x[b + 1], dz = x[a + 2] - x[b + 2];
      let e = (Math.sqrt(dx * dx + dy * dy + dz * dz) - this.rest[i]) / this.rest[i];
      if (this.stretchOnly && e < 0) e = 0;
      if (e < 0) e = -e;
      if (e > m) m = e;
    }
    return m;
  }
}

/** Builds rest lengths for a pair list from current positions (Müller's initPhysics loop). */
export function restLengths(x, ids) {
  const n = ids.length >> 1, rest = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = 3 * ids[2 * i], b = 3 * ids[2 * i + 1];
    const dx = x[a] - x[b], dy = x[a + 1] - x[b + 1], dz = x[a + 2] - x[b + 2];
    rest[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return rest;
}

/*
Copyright 2021 Matthias Müller - Ten Minute Physics, https://www.youtube.com/channel/UCTG_vrRdKYfrpqCv_WV4eyA

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
(SoftBody.getTetVolume, initPhysics mass distribution, solveVolumes, volIdOrder): ES module, Float64 state, no
three.js, scratch arrays at module level, a volume multiplier for cartoon squash.
*/

const VOL_ID_ORDER = [[1, 3, 2], [0, 2, 3], [0, 3, 1], [0, 1, 2]];
const grads = new Float64Array(12);

export function tetVolume(x, tetIds, nr) {
  const a = 3 * tetIds[4 * nr], b = 3 * tetIds[4 * nr + 1], c = 3 * tetIds[4 * nr + 2], d = 3 * tetIds[4 * nr + 3];
  const e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
  const e2x = x[c] - x[a], e2y = x[c + 1] - x[a + 1], e2z = x[c + 2] - x[a + 2];
  const e3x = x[d] - x[a], e3y = x[d + 1] - x[a + 1], e3z = x[d + 2] - x[a + 2];
  const cx = e1y * e2z - e1z * e2y, cy = e1z * e2x - e1x * e2z, cz = e1x * e2y - e1y * e2x;
  return (cx * e3x + cy * e3y + cz * e3z) / 6;
}

/** Per-particle inverse masses from tet volumes (density 1), as in Müller's initPhysics. */
export function tetInvMasses(x, tetIds, nParticles, density = 1, offset = 0) {
  const mass = new Float64Array(nParticles);
  for (let i = 0; i < tetIds.length / 4; i++) {
    const v = tetVolume(x, tetIds, i);
    const m = v > 0 ? density * v / 4 : 0;
    for (let j = 0; j < 4; j++) mass[tetIds[4 * i + j] - offset] += m;
  }
  const w = new Float64Array(nParticles);
  for (let i = 0; i < nParticles; i++) w[i] = mass[i] > 0 ? 1 / mass[i] : 0;
  return w;
}

export class TetVolumeGroup {
  constructor(tetIds, restVol, compliance = 0) {
    this.type = 'tetVolume'; this.name = 'tetVolume';
    this.ids = tetIds; this.rest = restVol; this.compliance = compliance; this.scale = 1;
  }
  solve(W) {
    const x = W.x, w = W.w, ids = this.ids, n = this.rest.length, alpha = this.compliance * W.invSdt2, sc = this.scale;
    for (let i = 0; i < n; i++) {
      let ws = 0;
      for (let j = 0; j < 4; j++) {
        const o = VOL_ID_ORDER[j];
        const a = 3 * ids[4 * i + o[0]], b = 3 * ids[4 * i + o[1]], c = 3 * ids[4 * i + o[2]];
        const t0x = x[b] - x[a], t0y = x[b + 1] - x[a + 1], t0z = x[b + 2] - x[a + 2];
        const t1x = x[c] - x[a], t1y = x[c + 1] - x[a + 1], t1z = x[c + 2] - x[a + 2];
        const gx = (t0y * t1z - t0z * t1y) / 6, gy = (t0z * t1x - t0x * t1z) / 6, gz = (t0x * t1y - t0y * t1x) / 6;
        grads[3 * j] = gx; grads[3 * j + 1] = gy; grads[3 * j + 2] = gz;
        ws += w[ids[4 * i + j]] * (gx * gx + gy * gy + gz * gz);
      }
      if (ws === 0) continue;
      const C = tetVolume(x, ids, i) - this.rest[i] * sc;
      const s = -C / (ws + alpha);
      for (let j = 0; j < 4; j++) {
        const id = ids[4 * i + j], k = s * w[id], o = 3 * id;
        x[o] += grads[3 * j] * k; x[o + 1] += grads[3 * j + 1] * k; x[o + 2] += grads[3 * j + 2] * k;
      }
    }
  }
  /** Largest relative volume error (tests). */
  maxError(x) {
    let m = 0;
    for (let i = 0; i < this.rest.length; i++) {
      const e = Math.abs(tetVolume(x, this.ids, i) - this.rest[i]) / Math.abs(this.rest[i]);
      if (e > m) m = e;
    }
    return m;
  }
}

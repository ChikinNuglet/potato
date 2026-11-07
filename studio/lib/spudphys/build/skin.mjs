/*
Copyright 2022 Matthias Müller - Ten Minute Physics, https://www.youtube.com/channel/UCTG_vrRdKYfrpqCv_WV4eyA

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

Adapted for spudphys (Potato) by Claude for ChikinNuglet, 2026, from Ten Minute Physics 12-softBodySkinning.html
(SoftBody.computeSkinningInfo and updateVisMesh): ES module, Float64 maths, no three.js, the hash from hash.mjs with
an explicit query count, a deterministic brute-force fallback so every render vertex gets a tet (the original leaves
far vertices unskinned), and a skin() that writes into any Float32Array/Float64Array.
*/

import { Hash } from './hash.mjs';
import { invert3 } from '../vec.mjs';

/**
 * For each visual vertex: the tet containing it (or the nearest one) and 3 barycentric coordinates.
 * @param {Float64Array|Float32Array} pos tet node positions (3 per node, local indices)
 * @param {Int32Array} tetIds 4 local node indices per tet
 * @param {Float32Array|Float64Array} visVerts 3 per visual vertex (same frame as pos)
 * @returns {Float64Array} 4 per vertex: tetNr, b0, b1, b2  (b3 = 1 - b0 - b1 - b2)
 */
export function computeSkinningInfo(pos, tetIds, visVerts, border = 0.05) {
  const numVis = visVerts.length / 3, numTets = tetIds.length / 4;
  const info = new Float64Array(4 * numVis).fill(-1);
  const minDist = new Float64Array(numVis).fill(Number.MAX_VALUE);
  const spacing = border > 0 ? border : 0.05;
  const hash = new Hash(spacing, numVis);
  hash.create(visVerts, numVis);
  const mat = new Float64Array(9), inv = new Float64Array(9);

  const tryTet = (i, id) => {
    const id3 = tetIds[4 * i + 3], o = 3 * id, p3 = 3 * id3;
    const dx = visVerts[o] - pos[p3], dy = visVerts[o + 1] - pos[p3 + 1], dz = visVerts[o + 2] - pos[p3 + 2];
    const b0 = inv[0] * dx + inv[3] * dy + inv[6] * dz, b1 = inv[1] * dx + inv[4] * dy + inv[7] * dz, b2 = inv[2] * dx + inv[5] * dy + inv[8] * dz;
    const b3 = 1 - b0 - b1 - b2;
    let dist = 0;
    if (-b0 > dist) dist = -b0; if (-b1 > dist) dist = -b1; if (-b2 > dist) dist = -b2; if (-b3 > dist) dist = -b3;
    if (dist < minDist[id]) { minDist[id] = dist; info[4 * id] = i; info[4 * id + 1] = b0; info[4 * id + 2] = b1; info[4 * id + 3] = b2; }
  };
  const setupTet = (i) => {
    const a = 3 * tetIds[4 * i], b = 3 * tetIds[4 * i + 1], c = 3 * tetIds[4 * i + 2], d = 3 * tetIds[4 * i + 3];
    for (let k = 0; k < 3; k++) { mat[k] = pos[a + k] - pos[d + k]; mat[3 + k] = pos[b + k] - pos[d + k]; mat[6 + k] = pos[c + k] - pos[d + k]; }
    return invert3(mat, inv);
  };

  for (let i = 0; i < numTets; i++) {
    let cx = 0, cy = 0, cz = 0;
    for (let j = 0; j < 4; j++) { const o = 3 * tetIds[4 * i + j]; cx += pos[o] * 0.25; cy += pos[o + 1] * 0.25; cz += pos[o + 2] * 0.25; }
    let rMax = 0;
    for (let j = 0; j < 4; j++) {
      const o = 3 * tetIds[4 * i + j], dx = pos[o] - cx, dy = pos[o + 1] - cy, dz = pos[o + 2] - cz;
      rMax = Math.max(rMax, Math.sqrt(dx * dx + dy * dy + dz * dz));
    }
    rMax += border;
    const qn = hash.query(cx, cy, cz, rMax);
    if (qn === 0 || !setupTet(i)) continue;
    for (let j = 0; j < qn; j++) {
      const id = hash.queryIds[j];
      if (minDist[id] <= 0) continue;
      const o = 3 * id, dx = visVerts[o] - cx, dy = visVerts[o + 1] - cy, dz = visVerts[o + 2] - cz;
      if (dx * dx + dy * dy + dz * dz > rMax * rMax) continue;
      tryTet(i, id);
    }
  }
  // fallback: vertices no tet's bounding sphere reached get the nearest tet by brute force (build time only)
  for (let id = 0; id < numVis; id++) {
    if (info[4 * id] >= 0) continue;
    for (let i = 0; i < numTets; i++) if (setupTet(i)) tryTet(i, id);
  }
  return info;
}

/** out[v] = sum_j b_j * x[tet_j]. x: particle array, p0: first particle of the cage, out: 3 per vertex. */
export function skin(info, tetIds, x, p0, out) {
  const n = info.length >> 2;
  for (let i = 0; i < n; i++) {
    let t = info[4 * i];
    if (t < 0) continue;
    t *= 4;
    const b0 = info[4 * i + 1], b1 = info[4 * i + 2], b2 = info[4 * i + 3], b3 = 1 - b0 - b1 - b2;
    const a = 3 * (p0 + tetIds[t]), b = 3 * (p0 + tetIds[t + 1]), c = 3 * (p0 + tetIds[t + 2]), d = 3 * (p0 + tetIds[t + 3]);
    const o = 3 * i;
    out[o] = b0 * x[a] + b1 * x[b] + b2 * x[c] + b3 * x[d];
    out[o + 1] = b0 * x[a + 1] + b1 * x[b + 1] + b2 * x[c + 1] + b3 * x[d + 1];
    out[o + 2] = b0 * x[a + 2] + b1 * x[b + 2] + b2 * x[c + 2] + b3 * x[d + 2];
  }
}

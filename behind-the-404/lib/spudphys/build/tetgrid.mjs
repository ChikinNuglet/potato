// spudphys — a coarse tetrahedral cage over a closed mesh, from a voxel grid (5 tets per cube).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Inside test: ray parity along a fixed skewed direction (Möller–Trumbore), arithmetic only, so the cage is the same
// in every engine. Cells are kept if their centre is inside the mesh or any mesh vertex lies in the cell (grown by
// `pad` cells), so thin parts are never dropped.

const DIR = [1, 0.000123456789, 0.0000987654321];   // skewed ray avoids hitting edges/vertices exactly

function rayHits(px, py, pz, pos, idx) {
  let hits = 0;
  const dx = DIR[0], dy = DIR[1], dz = DIR[2];
  for (let t = 0; t < idx.length; t += 3) {
    const a = 3 * idx[t], b = 3 * idx[t + 1], c = 3 * idx[t + 2];
    const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
    const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
    const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x;
    const det = e1x * hx + e1y * hy + e1z * hz;
    if (det > -1e-14 && det < 1e-14) continue;
    const f = 1 / det, sx = px - pos[a], sy = py - pos[a + 1], sz = pz - pos[a + 2];
    const u = f * (sx * hx + sy * hy + sz * hz);
    if (u < 0 || u > 1) continue;
    const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
    const v = f * (dx * qx + dy * qy + dz * qz);
    if (v < 0 || u + v > 1) continue;
    const tt = f * (e2x * qx + e2y * qy + e2z * qz);
    if (tt > 0) hits++;
  }
  return hits;
}
export function insideMesh(px, py, pz, pos, idx) { return (rayHits(px, py, pz, pos, idx) & 1) === 1; }

// corner index = dx + 2*dy + 4*dz
const TETS_EVEN = [[1, 2, 4, 7], [0, 1, 2, 4], [3, 2, 1, 7], [5, 1, 4, 7], [6, 2, 7, 4]];
const TETS_ODD = [[0, 3, 5, 6], [1, 0, 5, 3], [2, 3, 6, 0], [4, 0, 6, 5], [7, 3, 5, 6]];

/**
 * @param {Float32Array|Float64Array} pos mesh positions
 * @param {Uint32Array|Uint16Array|Int32Array|number[]} idx triangle indices (closed mesh)
 * @param {{ cells?: number[], pad?: number, margin?: number }} o cells = [nx, ny, nz]
 * @returns {{ nodes: Float64Array, tetIds: Int32Array, edgeIds: Int32Array, dims: number[], keep: Uint8Array }}
 */
export function tetGrid(pos, idx, o = {}) {
  const [nx, ny, nz] = o.cells || [4, 5, 4];
  const margin = o.margin ?? 0.02, pad = o.pad ?? 0;
  let mnx = Infinity, mny = Infinity, mnz = Infinity, mxx = -Infinity, mxy = -Infinity, mxz = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    if (pos[i] < mnx) mnx = pos[i]; if (pos[i] > mxx) mxx = pos[i];
    if (pos[i + 1] < mny) mny = pos[i + 1]; if (pos[i + 1] > mxy) mxy = pos[i + 1];
    if (pos[i + 2] < mnz) mnz = pos[i + 2]; if (pos[i + 2] > mxz) mxz = pos[i + 2];
  }
  mnx -= margin; mny -= margin; mnz -= margin; mxx += margin; mxy += margin; mxz += margin;
  const sx = (mxx - mnx) / nx, sy = (mxy - mny) / ny, sz = (mxz - mnz) / nz;
  const cell = (i, j, k) => i + nx * (j + ny * k);
  const keep = new Uint8Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (insideMesh(mnx + (i + 0.5) * sx, mny + (j + 0.5) * sy, mnz + (k + 0.5) * sz, pos, idx)) keep[cell(i, j, k)] = 1;
  }
  for (let v = 0; v < pos.length; v += 3) {
    const ci = Math.min(nx - 1, Math.floor((pos[v] - mnx) / sx)), cj = Math.min(ny - 1, Math.floor((pos[v + 1] - mny) / sy)), ck = Math.min(nz - 1, Math.floor((pos[v + 2] - mnz) / sz));
    for (let k = ck - pad; k <= ck + pad; k++) for (let j = cj - pad; j <= cj + pad; j++) for (let i = ci - pad; i <= ci + pad; i++) {
      if (i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz) keep[cell(i, j, k)] = 1;
    }
  }
  // nodes used by kept cells, numbered in grid order
  const NX = nx + 1, NY = ny + 1, NZ = nz + 1, nodeId = new Int32Array(NX * NY * NZ).fill(-1);
  const node = (i, j, k) => i + NX * (j + NY * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!keep[cell(i, j, k)]) continue;
    for (let c = 0; c < 8; c++) nodeId[node(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))] = 0;
  }
  const nodes = [];
  let count = 0;
  for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const n = node(i, j, k);
    if (nodeId[n] < 0) continue;
    nodeId[n] = count++;
    nodes.push(mnx + i * sx, mny + j * sy, mnz + k * sz);
  }
  const nodesF = new Float64Array(nodes);
  const tets = [];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!keep[cell(i, j, k)]) continue;
    const corner = [];
    for (let c = 0; c < 8; c++) corner.push(nodeId[node(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))]);
    const set = ((i + j + k) & 1) ? TETS_ODD : TETS_EVEN;
    for (const t of set) {
      let a = corner[t[0]], b = corner[t[1]], c = corner[t[2]], d = corner[t[3]];
      if (signedVol(nodesF, a, b, c, d) < 0) { const tmp = b; b = c; c = tmp; }
      tets.push(a, b, c, d);
    }
  }
  const tetIds = new Int32Array(tets);
  // unique edges, sorted
  const ek = [];
  for (let t = 0; t < tetIds.length; t += 4) {
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
      const u = tetIds[t + a], v = tetIds[t + b];
      ek.push(u < v ? u * 1048576 + v : v * 1048576 + u);
    }
  }
  ek.sort((p, q) => p - q);
  const edges = [];
  for (let i = 0; i < ek.length; i++) if (i === 0 || ek[i] !== ek[i - 1]) edges.push(Math.floor(ek[i] / 1048576), ek[i] % 1048576);
  return { nodes: nodesF, tetIds, edgeIds: new Int32Array(edges), dims: [nx, ny, nz], keep, origin: [mnx, mny, mnz], cell: [sx, sy, sz] };
}
function signedVol(x, a, b, c, d) {
  a *= 3; b *= 3; c *= 3; d *= 3;
  const e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
  const e2x = x[c] - x[a], e2y = x[c + 1] - x[a + 1], e2z = x[c + 2] - x[a + 2];
  const e3x = x[d] - x[a], e3y = x[d + 1] - x[a + 1], e3z = x[d + 2] - x[a + 2];
  return ((e1y * e2z - e1z * e2y) * e3x + (e1z * e2x - e1x * e2z) * e3y + (e1x * e2y - e1y * e2x) * e3z) / 6;
}

// spudphys — weld duplicate vertices (UV/colour seams) by quantised position, in a stable order.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.

/**
 * @param {Float32Array|Float64Array} pos
 * @param {ArrayLike<number>|null} index triangle indices (null = non-indexed)
 * @param {number} eps weld distance (quantisation step)
 * @returns {{ pos: Float64Array, map: Int32Array, tris: Int32Array, count: number }}
 *   map[v] = welded id of original vertex v (ids follow first appearance), tris = triangles in welded ids
 *   (degenerate ones dropped).
 */
export function weld(pos, index, eps = 1e-5) {
  const n = pos.length / 3, map = new Int32Array(n), keyToId = new Map(), out = [];
  const q = 1 / eps;
  for (let v = 0; v < n; v++) {
    const key = Math.round(pos[3 * v] * q) + ',' + Math.round(pos[3 * v + 1] * q) + ',' + Math.round(pos[3 * v + 2] * q);
    let id = keyToId.get(key);
    if (id === undefined) { id = out.length / 3; keyToId.set(key, id); out.push(pos[3 * v], pos[3 * v + 1], pos[3 * v + 2]); }
    map[v] = id;
  }
  const idx = index || Array.from({ length: n }, (_, i) => i), tris = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = map[idx[t]], b = map[idx[t + 1]], c = map[idx[t + 2]];
    if (a !== b && b !== c && a !== c) tris.push(a, b, c);
  }
  return { pos: new Float64Array(out), map, tris: new Int32Array(tris), count: out.length / 3 };
}

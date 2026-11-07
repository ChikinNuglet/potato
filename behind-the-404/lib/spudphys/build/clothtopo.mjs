/*
Copyright 2022 Matthias Müller - Ten Minute Physics,
https://www.youtube.com/channel/UCTG_vrRdKYfrpqCv_WV4eyA
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

Adapted for spudphys (Potato) by Claude for ChikinNuglet, 2026, from Ten Minute Physics 14-cloth.html
(findTriNeighbors and the stretching/bending id lists in the Cloth constructor): ES module, Int32Array output, a
total-order sort comparator (ties broken by edge number) so the topology is identical in every JS engine.
*/

/** For each triangle edge (3*tri + j), the matching edge number of the neighbouring triangle, or -1 if open. */
export function findTriNeighbors(triIds) {
  const numTris = triIds.length / 3, edges = [];
  for (let i = 0; i < numTris; i++) {
    for (let j = 0; j < 3; j++) {
      const id0 = triIds[3 * i + j], id1 = triIds[3 * i + (j + 1) % 3];
      edges.push({ id0: Math.min(id0, id1), id1: Math.max(id0, id1), edgeNr: 3 * i + j });
    }
  }
  edges.sort((a, b) => (a.id0 - b.id0) || (a.id1 - b.id1) || (a.edgeNr - b.edgeNr));
  const neighbors = new Int32Array(3 * numTris).fill(-1);
  let nr = 0;
  while (nr < edges.length) {
    const e0 = edges[nr]; nr++;
    if (nr < edges.length) {
      const e1 = edges[nr];
      if (e0.id0 === e1.id0 && e0.id1 === e1.id1) {
        neighbors[e0.edgeNr] = e1.edgeNr;
        neighbors[e1.edgeNr] = e0.edgeNr;
        nr++;
      }
    }
  }
  return neighbors;
}

/** Stretch edges (each once) and bending pairs (id0, id1, far corner 2, far corner 3) for a triangle mesh. */
export function clothTopology(triIds) {
  const neighbors = findTriNeighbors(triIds);
  const numTris = triIds.length / 3, edgeIds = [], triPairIds = [];
  for (let i = 0; i < numTris; i++) {
    for (let j = 0; j < 3; j++) {
      const id0 = triIds[3 * i + j], id1 = triIds[3 * i + (j + 1) % 3];
      const n = neighbors[3 * i + j];
      if (n < 0 || id0 < id1) edgeIds.push(id0, id1);
      if (n >= 0 && id0 < id1) {             // each pair once (Müller's loop adds both directions; once is enough)
        const ni = Math.floor(n / 3), nj = n % 3;
        const id2 = triIds[3 * i + (j + 2) % 3], id3 = triIds[3 * ni + (nj + 2) % 3];
        triPairIds.push(id0, id1, id2, id3);
      }
    }
  }
  const bendIds = new Int32Array(triPairIds.length / 2);
  for (let i = 0; i < triPairIds.length / 4; i++) { bendIds[2 * i] = triPairIds[4 * i + 2]; bendIds[2 * i + 1] = triPairIds[4 * i + 3]; }
  return { neighbors, edgeIds: new Int32Array(edgeIds), triPairIds: new Int32Array(triPairIds), bendIds };
}

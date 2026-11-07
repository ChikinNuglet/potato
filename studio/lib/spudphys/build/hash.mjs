/*
Copyright 2022 Matthias Müller - Ten Minute Physics

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

Adapted for spudphys (Potato) by Claude for ChikinNuglet, 2026, from Ten Minute Physics 11-hashing.html (class
Hash: dense hash table, counting sort into cellStart/cellEntries, query): ES module, Math.imul for the hash so the
32-bit wrap is exact and identical everywhere, query results kept in a typed array with a size counter, optional
offset/count so it can hash a sub-range of a big position array.
*/

export class Hash {
  constructor(spacing, maxNumObjects) {
    this.spacing = spacing;
    this.tableSize = 2 * maxNumObjects;
    this.cellStart = new Int32Array(this.tableSize + 1);
    this.cellEntries = new Int32Array(maxNumObjects);
    this.queryIds = new Int32Array(maxNumObjects);
    this.querySize = 0;
  }
  hashCoords(xi, yi, zi) {
    const h = Math.imul(xi, 92837111) ^ Math.imul(yi, 689287499) ^ Math.imul(zi, 283923481);   // fantasy function
    return (h < 0 ? -h : h) % this.tableSize;
  }
  intCoord(c) { return Math.floor(c / this.spacing); }
  hashPos(pos, nr) { return this.hashCoords(this.intCoord(pos[3 * nr]), this.intCoord(pos[3 * nr + 1]), this.intCoord(pos[3 * nr + 2])); }
  create(pos, count = Math.min(pos.length / 3, this.cellEntries.length)) {
    this.cellStart.fill(0); this.cellEntries.fill(0);
    for (let i = 0; i < count; i++) this.cellStart[this.hashPos(pos, i)]++;
    let start = 0;
    for (let i = 0; i < this.tableSize; i++) { start += this.cellStart[i]; this.cellStart[i] = start; }
    this.cellStart[this.tableSize] = start;
    for (let i = 0; i < count; i++) { const h = this.hashPos(pos, i); this.cellStart[h]--; this.cellEntries[this.cellStart[h]] = i; }
  }
  /** Ids of objects in cells overlapping the box around point (px,py,pz) +- maxDist (may include duplicates of cells that hash-collide). */
  query(px, py, pz, maxDist) {
    const x0 = this.intCoord(px - maxDist), y0 = this.intCoord(py - maxDist), z0 = this.intCoord(pz - maxDist);
    const x1 = this.intCoord(px + maxDist), y1 = this.intCoord(py + maxDist), z1 = this.intCoord(pz + maxDist);
    this.querySize = 0;
    for (let xi = x0; xi <= x1; xi++) for (let yi = y0; yi <= y1; yi++) for (let zi = z0; zi <= z1; zi++) {
      const h = this.hashCoords(xi, yi, zi), start = this.cellStart[h], end = this.cellStart[h + 1];
      for (let i = start; i < end && this.querySize < this.queryIds.length; i++) this.queryIds[this.querySize++] = this.cellEntries[i];
    }
    return this.querySize;
  }
}

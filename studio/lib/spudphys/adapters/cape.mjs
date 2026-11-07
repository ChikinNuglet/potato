// spudphys — adapter (2): a cape / cloth from a dough sheet.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
//
// The dense sheet (pressed out of the figure, carrying Vega's ink + white border shells) is driven by a coarse
// cloth grid: stretch + bending as in Müller's 14-cloth.html (via clothtopo.mjs and DistanceGroup), tethers to the
// pinned shoulder row, colliders (body capsule, head, keepOut in front of the face, ground), seeded wind.
// Each dense vertex keeps (grid triangle, 2 barycentrics, an offset in that triangle's frame), so the sheet keeps
// its thickness and the shells keep their width.

import { DistanceGroup, restLengths } from '../constraints/distance.mjs';
import { AttachGroup, TetherGroup } from '../constraints/attach.mjs';
import { clothTopology } from '../build/clothtopo.mjs';
import { weld } from '../build/weld.mjs';
import { computeNormals, target, toLocal } from './meshout.mjs';

/**
 * @param {import('../world.mjs').World} world
 * @param {object} o
 *   positions: Float32Array (dense sheet, in `space` driver's local frame at rest), index: triangle indices
 *   space: Driver the sheet hangs from (Potato's spine), pin: (x,y,z) => boolean rest test for pinned points
 *   coarse: [cols, rows] grid (default [8, 10]); null = simulate the welded sheet itself (small sheets)
 *   bend: bending compliance (0.5 stiff .. 5 floppy, default 1.5), stretch: stretch compliance (default 0)
 *   drag, wind (aero coefficient, default 3), colliders, keepOut (extra colliders), planar (compliance or null;
 *   pulls depth along planarAxis, default world z = the camera's view axis),
 *   substeps (8), active [t0, t1], density (1), radius (cloth thickness, 0.02), tether (1.05)
 */
export function cape(world, o) {
  const space = o.space || null, dense = o.positions, denseIdx = o.index || null;
  const nd = dense.length / 3;
  let grid, gridTris, cols = 0, rows = 0;
  let mode = 'grid';
  if (o.coarse === null) mode = 'direct';
  const [gc, gr] = o.coarse || [8, 10];

  let skin;                      // per dense vertex: tri, b0, b1, ox, oy, oz (offset in tri frame)
  let weldMap = null;
  if (mode === 'grid') {
    // bounding rectangle in the sheet's x/y (cape hangs down y, spreads in x, z = depth)
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (let i = 0; i < nd; i++) {
      const x = dense[3 * i], y = dense[3 * i + 1];
      if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y;
    }
    cols = gc; rows = gr;
    const nx = cols + 1, ny = rows + 1, dx = (mxx - mnx) / cols, dy = (mxy - mny) / rows;
    grid = new Float64Array(3 * nx * ny);
    // z of each grid node: inverse-distance average of the nearest dense verts (deterministic, build time)
    const rad2 = (dx * dx + dy * dy) * 1.0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const gx = mnx + i * dx, gy = mxy - j * dy, g = 3 * (i + nx * j);   // row 0 at the top
      let ws = 0, zs = 0, best = Infinity, bestZ = 0;
      for (let v = 0; v < nd; v++) {
        const ex = dense[3 * v] - gx, ey = dense[3 * v + 1] - gy, d2 = ex * ex + ey * ey;
        if (d2 < best) { best = d2; bestZ = dense[3 * v + 2]; }
        if (d2 < rad2) { const wv = 1 / (d2 + 1e-6); ws += wv; zs += wv * dense[3 * v + 2]; }
      }
      grid[g] = gx; grid[g + 1] = gy; grid[g + 2] = ws > 0 ? zs / ws : bestZ;
    }
    const t = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const a = i + nx * j, b = a + 1, c = a + nx, d = c + 1;
      if ((i + j) & 1) t.push(a, c, b, b, c, d); else t.push(a, c, d, a, d, b);
    }
    gridTris = new Int32Array(t);
    // skin: each dense vertex -> containing grid cell triangle in x/y
    skin = new Float64Array(6 * nd);
    for (let v = 0; v < nd; v++) {
      const px = dense[3 * v], py = dense[3 * v + 1];
      let ci = Math.floor((px - mnx) / dx), cj = Math.floor((mxy - py) / dy);
      ci = ci < 0 ? 0 : ci >= cols ? cols - 1 : ci; cj = cj < 0 ? 0 : cj >= rows ? rows - 1 : cj;
      const base = 2 * (ci + cols * cj);
      let tri = base, bb = bary2(grid, gridTris, base, px, py);
      if (Math.min(bb[0], bb[1], 1 - bb[0] - bb[1]) < -1e-9) {
        const b2 = bary2(grid, gridTris, base + 1, px, py);
        if (Math.min(b2[0], b2[1], 1 - b2[0] - b2[1]) > Math.min(bb[0], bb[1], 1 - bb[0] - bb[1])) { tri = base + 1; bb = b2; }
      }
      skin[6 * v] = tri; skin[6 * v + 1] = bb[0]; skin[6 * v + 2] = bb[1];
    }
  } else {
    const wd = weld(dense, denseIdx, o.weld ?? 1e-5);
    grid = wd.pos; gridTris = wd.tris; weldMap = wd.map;
  }
  const n = grid.length / 3;

  // pins
  const pinTest = o.pin || null, pinned = new Uint8Array(n);
  let anyPin = false;
  for (let i = 0; i < n; i++) if (pinTest && pinTest(grid[3 * i], grid[3 * i + 1], grid[3 * i + 2])) { pinned[i] = 1; anyPin = true; }
  if (!anyPin) {                                   // default: the top row
    let top = -Infinity; for (let i = 0; i < n; i++) top = Math.max(top, grid[3 * i + 1]);
    for (let i = 0; i < n; i++) if (grid[3 * i + 1] >= top - 1e-9) pinned[i] = 1;
  }
  // masses from triangle areas (Müller's cloth), pins kinematic
  const density = o.density ?? 1, mass = new Float64Array(n);
  for (let t = 0; t < gridTris.length; t += 3) {
    const a = 3 * gridTris[t], b = 3 * gridTris[t + 1], c = 3 * gridTris[t + 2];
    const e1x = grid[b] - grid[a], e1y = grid[b + 1] - grid[a + 1], e1z = grid[b + 2] - grid[a + 2];
    const e2x = grid[c] - grid[a], e2y = grid[c + 1] - grid[a + 1], e2z = grid[c + 2] - grid[a + 2];
    const cx = e1y * e2z - e1z * e2y, cy = e1z * e2x - e1x * e2z, cz = e1x * e2y - e1y * e2x;
    const A = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz) * density / 3;
    mass[gridTris[t]] += A; mass[gridTris[t + 1]] += A; mass[gridTris[t + 2]] += A;
  }
  const invMass = new Float64Array(n);
  for (let i = 0; i < n; i++) invMass[i] = pinned[i] || mass[i] === 0 ? 0 : 1 / mass[i];

  const body = world.addBody({
    kind: 'cape', name: o.name || 'cape', n, rest: grid, invMass, radius: o.radius ?? 0.02, space,
    substeps: o.substeps ?? 8, active: o.active, colliders: [...(o.colliders || []), ...(o.keepOut ? [].concat(o.keepOut) : [])],
    drag: o.drag ?? 1.4, gravity: o.gravity ?? 0.45, vmax: o.vmax ?? 40, planar: o.planar ?? null, planarAxis: o.planarAxis || null,
    aero: (o.wind ?? 3) > 0 ? { tris: gridTris, coef: o.wind ?? 3 } : null,
  });
  const p0 = body.p0;
  const G = (arr) => { const a = new Int32Array(arr.length); for (let i = 0; i < arr.length; i++) a[i] = arr[i] + p0; return a; };

  // 1. pins
  const pinIds = [], pinLocal = [];
  for (let i = 0; i < n; i++) if (pinned[i]) { pinIds.push(p0 + i); pinLocal.push(grid[3 * i], grid[3 * i + 1], grid[3 * i + 2]); }
  body.groups.push(new AttachGroup(new Int32Array(pinIds), new Float64Array(pinLocal), space, 0));
  // 2. tethers to the nearest pin (rest distance x tether)
  const tk = o.tether ?? 1.05, tIds = [], tAnch = [], tLen = [];
  if (tk > 0) for (let i = 0; i < n; i++) {
    if (pinned[i]) continue;
    let best = -1, bd = Infinity;
    for (let j = 0; j < n; j++) {
      if (!pinned[j]) continue;
      const dx = grid[3 * i] - grid[3 * j], dy = grid[3 * i + 1] - grid[3 * j + 1], dz = grid[3 * i + 2] - grid[3 * j + 2], d = dx * dx + dy * dy + dz * dz;
      if (d < bd) { bd = d; best = j; }
    }
    tIds.push(p0 + i); tAnch.push(p0 + best); tLen.push(Math.sqrt(bd) * tk);
  }
  const topo = clothTopology(gridTris);
  const stretch = new DistanceGroup(G(topo.edgeIds), restLengths(grid, topo.edgeIds), o.stretch ?? 0, { name: 'stretch' });
  const bending = new DistanceGroup(G(topo.bendIds), restLengths(grid, topo.bendIds), o.bend ?? 1.5, { name: 'bending' });
  body.groups.push(stretch, bending);
  if (tIds.length) body.groups.push(new TetherGroup(new Int32Array(tIds), new Int32Array(tAnch), new Float64Array(tLen)));

  // dense skin offsets (rest), computed in each triangle's frame
  if (mode === 'grid') {
    const fr = new Float64Array(9);
    for (let v = 0; v < nd; v++) {
      const tri = skin[6 * v], b0 = skin[6 * v + 1], b1 = skin[6 * v + 2], b2 = 1 - b0 - b1;
      const a = 3 * gridTris[3 * tri], b = 3 * gridTris[3 * tri + 1], c = 3 * gridTris[3 * tri + 2];
      triFrame(grid, a, b, c, fr);
      const bx = b0 * grid[a] + b1 * grid[b] + b2 * grid[c], by = b0 * grid[a + 1] + b1 * grid[b + 1] + b2 * grid[c + 1], bz = b0 * grid[a + 2] + b1 * grid[b + 2] + b2 * grid[c + 2];
      const ox = dense[3 * v] - bx, oy = dense[3 * v + 1] - by, oz = dense[3 * v + 2] - bz;
      skin[6 * v + 3] = fr[0] * ox + fr[1] * oy + fr[2] * oz;
      skin[6 * v + 4] = fr[3] * ox + fr[4] * oy + fr[5] * oz;
      skin[6 * v + 5] = fr[6] * ox + fr[7] * oy + fr[8] * oz;
    }
  }

  const worldPos = new Float64Array(3 * nd), fr = new Float64Array(9), local = new Float64Array(3 * nd);
  let normScratch = null;
  const api = {
    body, kind: 'cape', mode, n, cols, rows, gridTris, pinned, groups: { stretch, bending },
    /** Dense vertex positions in world space (Float64Array, 3 per vertex). */
    dense(out = worldPos) {
      const x = world.x;
      if (mode === 'direct') {
        for (let v = 0; v < nd; v++) { const o2 = 3 * (p0 + weldMap[v]); out[3 * v] = x[o2]; out[3 * v + 1] = x[o2 + 1]; out[3 * v + 2] = x[o2 + 2]; }
        return out;
      }
      for (let v = 0; v < nd; v++) {
        const tri = skin[6 * v], b0 = skin[6 * v + 1], b1 = skin[6 * v + 2], b2 = 1 - b0 - b1;
        const a = 3 * (p0 + gridTris[3 * tri]), b = 3 * (p0 + gridTris[3 * tri + 1]), c = 3 * (p0 + gridTris[3 * tri + 2]);
        triFrame(x, a, b, c, fr);
        const ox = skin[6 * v + 3], oy = skin[6 * v + 4], oz = skin[6 * v + 5];
        out[3 * v] = b0 * x[a] + b1 * x[b] + b2 * x[c] + fr[0] * ox + fr[3] * oy + fr[6] * oz;
        out[3 * v + 1] = b0 * x[a + 1] + b1 * x[b + 1] + b2 * x[c + 1] + fr[1] * ox + fr[4] * oy + fr[7] * oz;
        out[3 * v + 2] = b0 * x[a + 2] + b1 * x[b + 2] + b2 * x[c + 2] + fr[2] * ox + fr[5] * oy + fr[8] * oz;
      }
      return out;
    },
    /**
     * Render-only: writes positions (+ normals) into a three.js BufferGeometry or { position, normal, index }.
     * opts.space: 'local' (default when the cape has a space driver: the piece is a child of that bone) or 'world'.
     * opts.shade(geometry): callback to refresh playdough's shadeN (e.g. g => PD.smoothNormals(g, 2)).
     */
    write(geometry, opts = {}) {
      const tg = target(geometry);
      world.poseDrivers(0);
      api.dense(worldPos);
      const useLocal = (opts.space ?? (space ? 'local' : 'world')) === 'local' && space;
      toLocal(worldPos, local, useLocal ? space : null);
      const P = tg.pos;
      for (let i = 0; i < local.length; i++) P[i] = local[i];
      if (opts.normals !== false && tg.nor) computeNormals(P, tg.index, tg.nor);
      tg.done(opts.normals !== false);
      if (opts.shade) opts.shade(geometry);
      return geometry;
    },
    /** Coarse grid positions (debug / line rendering). */
    grid(out = new Float64Array(3 * n)) { out.set(world.x.subarray(3 * p0, 3 * (p0 + n))); return out; },
  };
  return api;
}

function bary2(grid, tris, t, px, py) {
  const a = 3 * tris[3 * t], b = 3 * tris[3 * t + 1], c = 3 * tris[3 * t + 2];
  const v0x = grid[b] - grid[a], v0y = grid[b + 1] - grid[a + 1], v1x = grid[c] - grid[a], v1y = grid[c + 1] - grid[a + 1];
  const v2x = px - grid[a], v2y = py - grid[a + 1];
  const den = v0x * v1y - v1x * v0y;
  const u = (v2x * v1y - v1x * v2y) / den, w = (v0x * v2y - v2x * v0y) / den;
  return [1 - u - w, u];   // weights of a, b (c = 1 - both)
}
/** Orthonormal frame of a triangle: rows t (edge ab), b, n stored as fr[0..2], fr[3..5], fr[6..8]. */
function triFrame(x, a, b, c, fr) {
  let tx = x[b] - x[a], ty = x[b + 1] - x[a + 1], tz = x[b + 2] - x[a + 2];
  const ux = x[c] - x[a], uy = x[c + 1] - x[a + 1], uz = x[c + 2] - x[a + 2];
  let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux;
  let l = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= l; ty /= l; tz /= l;
  l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
  fr[0] = tx; fr[1] = ty; fr[2] = tz;
  fr[3] = ny * tz - nz * ty; fr[4] = nz * tx - nx * tz; fr[5] = nx * ty - ny * tx;
  fr[6] = nx; fr[7] = ny; fr[8] = nz;
}

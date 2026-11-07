// spudphys — adapter (1): a playdough / clay mesh as a soft body.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
//
// Modes:
//   cage    (default) coarse tet cage from a voxel grid (tetgrid.mjs) with edge + tet-volume constraints (Müller's
//           10-softBodies.html) and one whole-body shape match; render vertices follow by barycentrics as in his
//           12-softBodySkinning.html (skin.mjs).
//   surface welded mesh vertices are the particles: edges + whole-surface pressure (water balloon). Small meshes.
//   cluster cage nodes held only by overlapping shape-match clusters (2x2x2 cells): cheapest wobble.
// Face lock (canon): vertices with lock > 0 follow the body's shape-match frame rigidly (blended by lock), so his
// face never warps; squish happens below and around it. Ink + white border shells are the same geometry, so they
// follow (D-45). write() calls opts.shade(geometry) so the game can refresh playdough's shadeN.

import { DistanceGroup, restLengths } from '../constraints/distance.mjs';
import { TetVolumeGroup, tetVolume, tetInvMasses } from '../constraints/tetvolume.mjs';
import { ShapeMatchGroup, PressureGroup } from '../constraints/shapematch.mjs';
import { tetGrid } from '../build/tetgrid.mjs';
import { computeSkinningInfo, skin } from '../build/skin.mjs';
import { weld } from '../build/weld.mjs';
import { computeNormals, target, toLocal, seamNormals } from './meshout.mjs';
import { quatToMat3 } from '../vec.mjs';

/**
 * @param {import('../world.mjs').World} world
 * @param {object} o positions (Float32Array, mesh in `space` local frame or world), index, space (Driver|null),
 *   mode ('cage'), cells ([4,5,4]), stiffness (shape-match 0..1; free 0.02 = cartoon jelly, pinned 0.25),
 *   edge (cage edge compliance; free 0.03, pinned 1e-4),
 *   volume (tet volume compliance 0), pressure (surface mode, 1), lock (Float32Array per vertex 0..1 or
 *   (x,y,z)=>weight), colliders, active, substeps (6), drag (0.4), radius (0.02), follow ('free'|'pinned'),
 *   at: [x,y,z] offset added to the rest pose when space is null, kick: {t, v, spin} | [...] (hops, bonks)
 */
export function dough(world, o) {
  const mesh = o.positions, idx = o.index, nv = mesh.length / 3, mode = o.mode || 'cage', space = o.space || null;
  const at = o.at || [0, 0, 0];
  let nodes, tetIds = null, edgeIds, skinInfo = null, weldMap = null, tris = null;
  if (mode === 'surface') {
    const wd = weld(mesh, idx, o.weld ?? 1e-5);
    nodes = wd.pos; weldMap = wd.map; tris = wd.tris;
    const seen = new Set(), e = [];
    for (let t = 0; t < tris.length; t += 3) for (let j = 0; j < 3; j++) {
      const a = tris[t + j], b = tris[t + (j + 1) % 3], key = a < b ? a * 1048576 + b : b * 1048576 + a;
      if (!seen.has(key)) { seen.add(key); e.push(key); }
    }
    e.sort((p, q) => p - q);
    edgeIds = new Int32Array(2 * e.length);
    e.forEach((key, i) => { edgeIds[2 * i] = Math.floor(key / 1048576); edgeIds[2 * i + 1] = key % 1048576; });
  } else {
    const tg = tetGrid(mesh, idx, { cells: o.cells || [4, 5, 4], pad: o.pad ?? 0 });
    nodes = tg.nodes; tetIds = tg.tetIds; edgeIds = tg.edgeIds;
    skinInfo = computeSkinningInfo(nodes, tetIds, mesh, Math.max(tg.cell[0], tg.cell[1], tg.cell[2]) * 0.5);
    o._grid = tg;
  }
  const n = nodes.length / 3;
  const rest = new Float64Array(nodes);
  if (!space) for (let i = 0; i < n; i++) { rest[3 * i] += at[0]; rest[3 * i + 1] += at[1]; rest[3 * i + 2] += at[2]; }
  let invMass;
  if (tetIds) invMass = tetInvMasses(nodes, tetIds, n, (o.density ?? 1) * 1);
  else invMass = new Float64Array(n).fill(n / (o.mass ?? 1));
  // keep masses sane for tiny cells: scale so total mass = o.mass (default 1)
  let M = 0; for (let i = 0; i < n; i++) M += invMass[i] > 0 ? 1 / invMass[i] : 0;
  const scale = (o.mass ?? 1) / M; for (let i = 0; i < n; i++) if (invMass[i] > 0) invMass[i] /= scale;
  const pinned = o.follow === 'pinned';

  const body = world.addBody({
    kind: 'dough', name: o.name || 'dough', n, rest, invMass, radius: o.radius ?? 0.02, space,
    substeps: o.substeps ?? 6, active: o.active, colliders: o.colliders || [], drag: o.drag ?? 0.4, vmax: o.vmax ?? 60,
    gravity: pinned ? 0 : (o.gravity ?? 1),
  });
  const p0 = body.p0, G = (a) => { const r = new Int32Array(a.length); for (let i = 0; i < a.length; i++) r[i] = a[i] + p0; return r; };
  const masses = new Float64Array(n); for (let i = 0; i < n; i++) masses[i] = 1 / invMass[i];
  const qOff = world.allocState([0, 0, 0, 1]);
  const allIds = new Int32Array(n); for (let i = 0; i < n; i++) allIds[i] = p0 + i;
  // Defaults (Nov 2 look strips): a FREE dough blob is cartoon jelly: soft cage edges + a weak shape match, so a landing
  // squashes it to ~0.75 h/w, it rebounds to ~1.14 and wobbles back round (rests ~2% low). The old stiff defaults
  // (edges 1e-4, match 0.25) squashed 4% for one frame: invisible at game size. A PINNED blob (riding a figure) keeps
  // the stiff defaults: a jiggle, never a change of shape (canon).
  const soft = !pinned;
  const whole = new ShapeMatchGroup(allIds, rest, masses, qOff, { stiffness: o.stiffness ?? (soft ? 0.02 : 0.25), beta: o.squish ?? 0 });
  const groups = { whole };
  if (mode === 'cage') {
    groups.edges = new DistanceGroup(G(edgeIds), restLengths(nodes, edgeIds), o.edge ?? (soft ? 0.03 : 1e-4), { name: 'cageEdges' });
    const gt = G(tetIds), rv = new Float64Array(tetIds.length / 4);
    for (let i = 0; i < rv.length; i++) rv[i] = tetVolume(nodes, tetIds, i);
    groups.volume = new TetVolumeGroup(gt, rv, o.volume ?? 0);
    body.groups.push(groups.edges, groups.volume, whole);
  } else if (mode === 'surface') {
    groups.edges = new DistanceGroup(G(edgeIds), restLengths(nodes, edgeIds), o.edge ?? 1e-4, { name: 'edges' });
    const gt = G(tris);
    const V0 = PressureGroup.volume(nodes, tris);
    groups.pressure = new PressureGroup(gt, p0, n, V0, { pressure: o.pressure ?? 1 });
    body.groups.push(groups.edges, groups.pressure, whole);
  } else { // cluster: overlapping 2x2x2-cell shape-match clusters over the cage nodes
    const tg = o._grid, [nx, ny, nz] = tg.dims, org = tg.origin, cs = tg.cell;
    const nodeAt = new Map();
    for (let i = 0; i < n; i++) {
      const gi = Math.round((nodes[3 * i] - org[0]) / cs[0]), gj = Math.round((nodes[3 * i + 1] - org[1]) / cs[1]), gk = Math.round((nodes[3 * i + 2] - org[2]) / cs[2]);
      nodeAt.set(gi + ',' + gj + ',' + gk, i);
    }
    groups.clusters = [];
    for (let k = 0; k < nz; k += 1) for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += 1) {
      const ids = [];
      for (let c = 0; c < 27; c++) { const id = nodeAt.get((i + (c % 3)) + ',' + (j + ((c / 3 | 0) % 3)) + ',' + (k + (c / 9 | 0))); if (id !== undefined) ids.push(id); }
      if (ids.length < 8) continue;
      const lr = new Float64Array(3 * ids.length), ms = new Float64Array(ids.length);
      ids.forEach((id, q) => { lr.set(rest.subarray(3 * id, 3 * id + 3), 3 * q); ms[q] = masses[id]; });
      const g = new ShapeMatchGroup(G(ids), lr, ms, world.allocState([0, 0, 0, 1]), { stiffness: o.clusterStiffness ?? 0.5 });
      groups.clusters.push(g); body.groups.push(g);
    }
    body.groups.push(whole);
  }
  // pinned: dough rides its driver (a jiggle on a moving figure) via a soft whole-body attachment to the rest pose
  if (pinned && space) {
    const goal = { type: 'follow', name: 'follow', solve(W) {
      const x = W.x, w = W.w, m = space.m, P = space.pos, alpha = (o.followCompliance ?? 2e-3) * W.invSdt2;
      for (let i = 0; i < n; i++) {
        const id = p0 + i, q = 3 * id, wi = w[id], lx = rest[3 * i], ly = rest[3 * i + 1], lz = rest[3 * i + 2];
        const k = wi / (wi + alpha);
        x[q] += (P[0] + m[0] * lx + m[3] * ly + m[6] * lz - x[q]) * k;
        x[q + 1] += (P[1] + m[1] * lx + m[4] * ly + m[7] * lz - x[q + 1]) * k;
        x[q + 2] += (P[2] + m[2] * lx + m[5] * ly + m[8] * lz - x[q + 2]) * k;
      }
    } };
    body.groups.unshift(goal);
  }
  // kicks at exact steps (a hop, a bonk): every particle gets velocity v (+ spin x r)
  const kicks = [].concat(o.kick || []).map(kk => ({ k: world.stepAt(kk.t), v: kk.v || [0, 0, 0], spin: kk.spin || [0, 0, 0] }));
  if (kicks.length) {
    const C0 = new Float64Array(3);
    body.pre = (w, b, k) => {
      for (const kk of kicks) {
        if (kk.k !== k) continue;
        whole.centroid(w.x, C0);
        for (let i = 0; i < n; i++) {
          const q = 3 * (p0 + i), rx = w.x[q] - C0[0], ry = w.x[q + 1] - C0[1], rz = w.x[q + 2] - C0[2];
          w.v[q] = kk.v[0] + kk.spin[1] * rz - kk.spin[2] * ry;
          w.v[q + 1] = kk.v[1] + kk.spin[2] * rx - kk.spin[0] * rz;
          w.v[q + 2] = kk.v[2] + kk.spin[0] * ry - kk.spin[1] * rx;
        }
      }
    };
  }
  body.onReset = (w) => { w.state[qOff] = 0; w.state[qOff + 1] = 0; w.state[qOff + 2] = 0; w.state[qOff + 3] = 1;
    if (groups.clusters) for (const g of groups.clusters) { w.state[g.qOff] = 0; w.state[g.qOff + 1] = 0; w.state[g.qOff + 2] = 0; w.state[g.qOff + 3] = 1; } };

  // face lock weights
  const lock = new Float32Array(nv);
  if (typeof o.lock === 'function') for (let v = 0; v < nv; v++) lock[v] = o.lock(mesh[3 * v], mesh[3 * v + 1], mesh[3 * v + 2]);
  else if (o.lock) lock.set(o.lock);
  let anyLock = false; for (let v = 0; v < nv; v++) if (lock[v] > 0) { anyLock = true; break; }
  // rest of each vertex relative to the shape-match rest centroid (in the same frame as `rest`)
  const rc = whole.restCentroid, vrel = new Float64Array(3 * nv);
  for (let v = 0; v < nv; v++) {
    const ox = space ? 0 : at[0], oy = space ? 0 : at[1], oz = space ? 0 : at[2];
    vrel[3 * v] = mesh[3 * v] + ox - rc[0]; vrel[3 * v + 1] = mesh[3 * v + 1] + oy - rc[1]; vrel[3 * v + 2] = mesh[3 * v + 2] + oz - rc[2];
  }
  const worldPos = new Float64Array(3 * nv), local = new Float64Array(3 * nv), R = new Float64Array(9), C = new Float64Array(3);
  let seamScratch = null;
  const api = {
    body, kind: 'dough', mode, n, groups, tetIds, lock,
    /** Render vertex positions in world space. */
    vertices(out = worldPos) {
      const x = world.x;
      if (mode === 'surface') { for (let v = 0; v < nv; v++) { const q = 3 * (p0 + weldMap[v]); out[3 * v] = x[q]; out[3 * v + 1] = x[q + 1]; out[3 * v + 2] = x[q + 2]; } }
      else skin(skinInfo, tetIds, x, p0, out);
      if (anyLock) {
        whole.centroid(x, C); quatToMat3(world.state, qOff, R, 0);
        for (let v = 0; v < nv; v++) {
          const l = lock[v]; if (l <= 0) continue;
          const rx = vrel[3 * v], ry = vrel[3 * v + 1], rz = vrel[3 * v + 2];
          const gx = C[0] + R[0] * rx + R[3] * ry + R[6] * rz, gy = C[1] + R[1] * rx + R[4] * ry + R[7] * rz, gz = C[2] + R[2] * rx + R[5] * ry + R[8] * rz;
          out[3 * v] += (gx - out[3 * v]) * l; out[3 * v + 1] += (gy - out[3 * v + 1]) * l; out[3 * v + 2] += (gz - out[3 * v + 2]) * l;
        }
      }
      return out;
    },
    /** Render-only: positions (+ normals) into a three.js geometry or { position, normal, index }; shade callback. */
    write(geometry, opts = {}) {
      const tg = target(geometry);
      world.poseDrivers(0);
      api.vertices(worldPos);
      const useLocal = (opts.space ?? (space ? 'local' : 'world')) === 'local' && space;
      toLocal(worldPos, local, useLocal ? space : null);
      const P = tg.pos; for (let i = 0; i < local.length; i++) P[i] = local[i];
      if (opts.normals !== false && tg.nor) {
        computeNormals(P, tg.index, tg.nor);
        if (opts.seams !== false) {
          if (!api._weld) api._weld = weld(mesh, null, 1e-5).map;
          seamScratch = seamScratch || new Float64Array(tg.nor.length);
          seamNormals(tg.nor, api._weld, seamScratch);
        }
      }
      tg.done(opts.normals !== false);
      if (opts.shade) opts.shade(geometry);
      return geometry;
    },
    /** The body's rigid frame (shape-match rotation + centroid) as a column-major 4x4. */
    frame(out16 = new Float64Array(16)) {
      whole.centroid(world.x, C); quatToMat3(world.state, qOff, R, 0);
      out16.set([R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, C[0] - (R[0] * rc[0] + R[3] * rc[1] + R[6] * rc[2]), C[1] - (R[1] * rc[0] + R[4] * rc[1] + R[7] * rc[2]), C[2] - (R[2] * rc[0] + R[5] * rc[1] + R[8] * rc[2]), 1]);
      return out16;
    },
  };
  return api;
}

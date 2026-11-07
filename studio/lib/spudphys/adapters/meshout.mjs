// spudphys — render-side helpers: normals and writing into plain arrays or three.js-like geometries (no three).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.

/** Area-weighted vertex normals from triangles. pos/out: 3 per vertex. index: triangles (null = non-indexed). */
export function computeNormals(pos, index, out) {
  out.fill(0);
  const n = index ? index.length : pos.length / 3;
  for (let t = 0; t < n; t += 3) {
    const ia = index ? index[t] : t, ib = index ? index[t + 1] : t + 1, ic = index ? index[t + 2] : t + 2;
    const a = 3 * ia, b = 3 * ib, c = 3 * ic;
    const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
    const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
    const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    out[a] += nx; out[a + 1] += ny; out[a + 2] += nz;
    out[b] += nx; out[b + 1] += ny; out[b + 2] += nz;
    out[c] += nx; out[c + 1] += ny; out[c + 2] += nz;
  }
  for (let i = 0; i < out.length; i += 3) {
    const l = Math.sqrt(out[i] * out[i] + out[i + 1] * out[i + 1] + out[i + 2] * out[i + 2]);
    if (l > 0) { out[i] /= l; out[i + 1] /= l; out[i + 2] /= l; }
  }
  return out;
}

/** Averages normals of vertices that share a position (seam duplicates) using a weld map. */
export function seamNormals(normals, weldMap, scratch) {
  scratch.fill(0);
  for (let v = 0; v < weldMap.length; v++) { const o = 3 * weldMap[v]; scratch[o] += normals[3 * v]; scratch[o + 1] += normals[3 * v + 1]; scratch[o + 2] += normals[3 * v + 2]; }
  for (let v = 0; v < weldMap.length; v++) {
    const o = 3 * weldMap[v], x = scratch[o], y = scratch[o + 1], z = scratch[o + 2], l = Math.sqrt(x * x + y * y + z * z);
    if (l > 0) { normals[3 * v] = x / l; normals[3 * v + 1] = y / l; normals[3 * v + 2] = z / l; }
  }
}

/**
 * Accepts either a three.js BufferGeometry or a plain { position, normal?, index? } of arrays and returns
 * { pos, nor, index, done() } where done() flags three.js attributes for upload.
 */
export function target(geometry) {
  if (geometry && geometry.attributes) {
    const P = geometry.attributes.position, Nn = geometry.attributes.normal, I = geometry.index;
    return {
      pos: P.array, nor: Nn ? Nn.array : null, index: I ? I.array : null,
      done(normals) {
        P.needsUpdate = true;
        if (normals && Nn) Nn.needsUpdate = true;
        if (geometry.boundingSphere) geometry.boundingSphere = null;
        if (geometry.boundingBox) geometry.boundingBox = null;
      },
    };
  }
  return { pos: geometry.position, nor: geometry.normal || null, index: geometry.index || null, done() {} };
}

/** Writes x (3 per vertex, world space) into out, optionally into a driver's local frame. */
export function toLocal(src, out, driver) {
  if (!driver) { for (let i = 0; i < out.length; i++) out[i] = src[i]; return out; }
  const m = driver.m, p = driver.pos;
  for (let i = 0; i < out.length; i += 3) {
    const dx = src[i] - p[0], dy = src[i + 1] - p[1], dz = src[i + 2] - p[2];
    out[i] = m[0] * dx + m[1] * dy + m[2] * dz; out[i + 1] = m[3] * dx + m[4] * dy + m[5] * dz; out[i + 2] = m[6] * dx + m[7] * dy + m[8] * dz;
  }
  return out;
}

// spudphys — colliders (plane, sphere, capsule, oriented box) and particle contact with position-based friction.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Friction follows Macklin, Müller, Chentanez, Kim, "Unified Particle Physics for Real-Time Applications" (2014):
// the tangential move over the substep is cancelled up to mu_s * depth, else reduced by mu_k * depth.

export const PLANE = 0, SPHERE = 1, CAPSULE = 2, BOX = 3;

export class Collider {
  constructor(type, o = {}) {
    this.type = type; this.driver = o.driver || null; this.name = o.name || '';
    this.muS = o.friction ?? o.muS ?? 0.4; this.muK = o.muK ?? (o.friction ?? 0.4) * 0.8;
    this.r = o.r ?? 0;
    // local params (in the driver's frame)
    this.la = new Float64Array(o.a || o.c || o.n || [0, 0, 0]);
    this.lb = new Float64Array(o.b || [0, 0, 0]);
    this.d = o.d ?? 0;
    this.half = new Float64Array(o.half || [0.5, 0.5, 0.5]);
    this.lq = new Float64Array(o.quat || [0, 0, 0, 1]);   // box orientation in the driver frame
    // world params (posed per substep)
    this.a = new Float64Array(3); this.b = new Float64Array(3); this.m = new Float64Array(9);
    if (type === PLANE) {                                   // normalise n
      const n = this.la, l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
      n[0] /= l; n[1] /= l; n[2] /= l;
    }
    this.lm = null;
    this.pose();
  }
  /** Places the collider using its driver's current (interpolated) pose. No allocation. */
  pose() {
    const d = this.driver;
    if (this.type === PLANE) {
      if (!d) { this.a.set(this.la); return; }
      rot(d.m, this.la, this.a); return;
    }
    xform(d, this.la, this.a);
    if (this.type === CAPSULE) xform(d, this.lb, this.b);
    if (this.type === BOX) {
      if (!this.lm) {
        const q = this.lq, x = q[0], y = q[1], z = q[2], w = q[3];
        const x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
        this.lm = new Float64Array([1 - (yy + zz), xy + wz, xz - wy, xy - wz, 1 - (xx + zz), yz + wx, xz + wy, yz - wx, 1 - (xx + yy)]);
      }
      const L = this.lm, out = this.m;
      if (!d) { out.set(L); return; }
      const M = d.m;
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) out[3 * c + r] = M[r] * L[3 * c] + M[3 + r] * L[3 * c + 1] + M[6 + r] * L[3 * c + 2];
    }
  }
}
function rot(m, l, out) {
  out[0] = m[0] * l[0] + m[3] * l[1] + m[6] * l[2];
  out[1] = m[1] * l[0] + m[4] * l[1] + m[7] * l[2];
  out[2] = m[2] * l[0] + m[5] * l[1] + m[8] * l[2];
}
function xform(d, l, out) {
  if (!d) { out[0] = l[0]; out[1] = l[1]; out[2] = l[2]; return; }
  const m = d.m, p = d.pos;
  out[0] = p[0] + m[0] * l[0] + m[3] * l[1] + m[6] * l[2];
  out[1] = p[1] + m[1] * l[0] + m[4] * l[1] + m[7] * l[2];
  out[2] = p[2] + m[2] * l[0] + m[5] * l[1] + m[8] * l[2];
}

// contact result scratch: normal + depth
const N = new Float64Array(4);

/** Computes the contact for point (px,py,pz) with radius r; prev position (qx,qy,qz) helps boxes pick the entry face. */
export function contact(c, px, py, pz, r, qx, qy, qz) {
  switch (c.type) {
    case PLANE: {
      const n = c.a, depth = c.d + r - (n[0] * px + n[1] * py + n[2] * pz);
      N[0] = n[0]; N[1] = n[1]; N[2] = n[2]; N[3] = depth; return depth > 0;
    }
    case SPHERE: return sphereContact(c.a[0], c.a[1], c.a[2], c.r + r, px, py, pz);
    case CAPSULE: {
      const a = c.a, b = c.b, abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
      const L2 = abx * abx + aby * aby + abz * abz;
      let t = L2 > 0 ? ((px - a[0]) * abx + (py - a[1]) * aby + (pz - a[2]) * abz) / L2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      return sphereContact(a[0] + abx * t, a[1] + aby * t, a[2] + abz * t, c.r + r, px, py, pz);
    }
    case BOX: return boxContact(c.a, c.m, c.half, c.r, px, py, pz, r, qx, qy, qz);
  }
  return false;
}
function sphereContact(cx, cy, cz, R, px, py, pz) {
  const dx = px - cx, dy = py - cy, dz = pz - cz, d2 = dx * dx + dy * dy + dz * dz;
  if (d2 >= R * R) return false;
  const d = Math.sqrt(d2);
  if (d === 0) { N[0] = 0; N[1] = 1; N[2] = 0; N[3] = R; return true; }
  N[0] = dx / d; N[1] = dy / d; N[2] = dz / d; N[3] = R - d; return true;
}
/** Oriented box (centre c, rotation m column-major, half extents h, rounding rb) vs sphere. */
export function boxContact(c, m, h, rb, px, py, pz, r, qx, qy, qz) {
  const dx = px - c[0], dy = py - c[1], dz = pz - c[2];
  const lx = m[0] * dx + m[1] * dy + m[2] * dz, ly = m[3] * dx + m[4] * dy + m[5] * dz, lz = m[6] * dx + m[7] * dy + m[8] * dz;
  const hx = h[0], hy = h[1], hz = h[2], R = r + rb;
  const cx = lx < -hx ? -hx : lx > hx ? hx : lx, cy = ly < -hy ? -hy : ly > hy ? hy : ly, cz = lz < -hz ? -hz : lz > hz ? hz : lz;
  if (cx !== lx || cy !== ly || cz !== lz) {               // centre outside the core box
    const ex = lx - cx, ey = ly - cy, ez = lz - cz, d2 = ex * ex + ey * ey + ez * ez;
    if (d2 >= R * R) return false;
    const d = Math.sqrt(d2), nx = ex / d, ny = ey / d, nz = ez / d;
    N[0] = m[0] * nx + m[3] * ny + m[6] * nz; N[1] = m[1] * nx + m[4] * ny + m[7] * nz; N[2] = m[2] * nx + m[5] * ny + m[8] * nz;
    N[3] = R - d; return true;
  }
  // inside: push out through the face the particle came in by (from its previous position), else the nearest face
  const ex = qx - c[0], ey = qy - c[1], ez = qz - c[2];
  const ox = m[0] * ex + m[1] * ey + m[2] * ez, oy = m[3] * ex + m[4] * ey + m[5] * ez, oz = m[6] * ex + m[7] * ey + m[8] * ez;
  const sx = (ox < 0 ? -ox : ox) - hx, sy = (oy < 0 ? -oy : oy) - hy, sz = (oz < 0 ? -oz : oz) - hz;
  let axis, sign;
  if (sx > 0 || sy > 0 || sz > 0) {
    // ratio of how far outside along each axis (largest wins), ties in x,y,z order
    const rx = sx / hx, ry = sy / hy, rz = sz / hz;
    if (rx >= ry && rx >= rz) { axis = 0; sign = ox < 0 ? -1 : 1; }
    else if (ry >= rz) { axis = 1; sign = oy < 0 ? -1 : 1; }
    else { axis = 2; sign = oz < 0 ? -1 : 1; }
  } else {
    const fx = hx - (lx < 0 ? -lx : lx), fy = hy - (ly < 0 ? -ly : ly), fz = hz - (lz < 0 ? -lz : lz);
    if (fx <= fy && fx <= fz) { axis = 0; sign = lx < 0 ? -1 : 1; }
    else if (fy <= fz) { axis = 1; sign = ly < 0 ? -1 : 1; }
    else { axis = 2; sign = lz < 0 ? -1 : 1; }
  }
  const lv = axis === 0 ? lx : axis === 1 ? ly : lz, hv = h[axis];
  N[0] = m[3 * axis] * sign; N[1] = m[3 * axis + 1] * sign; N[2] = m[3 * axis + 2] * sign;
  N[3] = hv - lv * sign + R;
  return true;
}
export const contactResult = N;

/**
 * Resolves particle i against collider c: pushes it out and applies friction.
 * Returns the depth resolved (0 if no contact).
 */
export function collideParticle(x, p, i, r, c) {
  const o = 3 * i;
  if (!contact(c, x[o], x[o + 1], x[o + 2], r, p[o], p[o + 1], p[o + 2])) {
    if (c.type !== BOX || !sweepBox(c, x, p, o, r)) return 0;   // thin boxes: swept test so fast things can't skip them
  }
  const nx = N[0], ny = N[1], nz = N[2], depth = N[3];
  x[o] += nx * depth; x[o + 1] += ny * depth; x[o + 2] += nz * depth;
  // friction: tangential part of the substep's displacement
  const dx = x[o] - p[o], dy = x[o + 1] - p[o + 1], dz = x[o + 2] - p[o + 2];
  const dn = dx * nx + dy * ny + dz * nz;
  const tx = dx - dn * nx, ty = dy - dn * ny, tz = dz - dn * nz;
  const tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
  if (tl > 0) {
    let k;
    if (tl < c.muS * depth) k = 1;
    else { k = c.muK * depth / tl; if (k > 1) k = 1; }
    x[o] -= tx * k; x[o + 1] -= ty * k; x[o + 2] -= tz * k;
  }
  return depth;
}

/**
 * Continuous test for boxes: if the particle's move this substep (p -> x) crossed the box (grown by the radius),
 * fills the contact result with the entry face and the depth needed to put x back on it.
 */
const SP = new Float64Array(3), SQ = new Float64Array(3);
function sweepBox(c, x, p, o, r) {
  const m = c.m, h = c.half, R = r + c.r;
  const ax = p[o] - c.a[0], ay = p[o + 1] - c.a[1], az = p[o + 2] - c.a[2];
  const bx = x[o] - c.a[0], by = x[o + 1] - c.a[1], bz = x[o + 2] - c.a[2];
  const P = SP, Q = SQ;
  P[0] = m[0] * ax + m[1] * ay + m[2] * az; P[1] = m[3] * ax + m[4] * ay + m[5] * az; P[2] = m[6] * ax + m[7] * ay + m[8] * az;
  Q[0] = m[0] * bx + m[1] * by + m[2] * bz; Q[1] = m[3] * bx + m[4] * by + m[5] * bz; Q[2] = m[6] * bx + m[7] * by + m[8] * bz;
  let t0 = 0, t1 = 1, axis = -1, sign = 0;
  for (let k = 0; k < 3; k++) {
    const H = h[k] + R, d = Q[k] - P[k];
    if (d > -1e-15 && d < 1e-15) { if (P[k] < -H || P[k] > H) return false; continue; }
    let ta = (-H - P[k]) / d, tb = (H - P[k]) / d, s = -1;
    if (ta > tb) { const tmp = ta; ta = tb; tb = tmp; s = 1; }
    if (ta > t0) { t0 = ta; axis = k; sign = s; }
    if (tb < t1) t1 = tb;
    if (t0 > t1) return false;
  }
  if (axis < 0 || t0 <= 0) return false;            // started inside or no entry: handled by the static test
  // entry face normal (world) and the depth of x behind that face
  const nx = m[3 * axis] * sign, ny = m[3 * axis + 1] * sign, nz = m[3 * axis + 2] * sign;
  const face = (h[axis] + R);
  N[0] = nx; N[1] = ny; N[2] = nz; N[3] = face - Q[axis] * sign;
  return N[3] > 0;
}

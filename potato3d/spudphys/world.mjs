// spudphys — the World: particles, bodies, drivers, colliders, the fixed step, checkpoints and simulateTo(t).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
//
// The loop per body and substep is Müller's XPBD loop (Ten Minute Physics 09/10/14):
//   predict -> solve constraint groups (build order) -> collide -> velocity update.
// Everything is a pure function of (seed, the driver samples the game feeds in, song time). See README "Rules".

import { stream, fnv1a, dsin } from './dmath.mjs';
import { quatToMat3, quatNlerp, quatNormalize } from './vec.mjs';
import { Collider, PLANE, SPHERE, CAPSULE, BOX, collideParticle } from './colliders.mjs';

const DEFAULT_RATE = 60;

/** A kinematic slot the game fills once per step with a pose (position + quaternion) from its own pure function. */
export class Driver {
  constructor(name, o = {}) {
    this.name = name; this.teleport = o.teleport ?? 1.0;
    this.prev = new Float64Array(8);   // pos3, quat4, inited flag  (saved in checkpoints)
    this.prev[6] = 1;
    this.next = new Float64Array(7); this.next[6] = 1;
    this.hasNext = false;
    this.pos = new Float64Array(3); this.q = new Float64Array([0, 0, 0, 1]); this.m = new Float64Array(9);
    this.m[0] = this.m[4] = this.m[8] = 1;
    this.jump = false;
  }
  /** Sets the pose for the step being taken (time (k+1)/rate). quat = [x,y,z,w]. */
  set(pos, quat) {
    const n = this.next;
    n[0] = pos[0]; n[1] = pos[1]; n[2] = pos[2];
    if (quat) { n[3] = quat[0]; n[4] = quat[1]; n[5] = quat[2]; n[6] = quat[3]; quatNormalize(n, 3); }
    else { n[3] = 0; n[4] = 0; n[5] = 0; n[6] = 1; }
    this.hasNext = true;
    return this;
  }
  /** Interpolated pose at substep fraction s in [0, 1] (between the previous and the current sample). */
  poseAt(s) {
    const a = this.prev, b = this.next, t = 1 - s;
    this.pos[0] = a[0] * t + b[0] * s; this.pos[1] = a[1] * t + b[1] * s; this.pos[2] = a[2] * t + b[2] * s;
    quatNlerp(a, 3, b, 3, s, this.q, 0);
    quatToMat3(this.q, 0, this.m, 0);
  }
  /** World point of a local point at the current pose. */
  apply(l, out, oo = 0) {
    const m = this.m, p = this.pos;
    out[oo] = p[0] + m[0] * l[0] + m[3] * l[1] + m[6] * l[2];
    out[oo + 1] = p[1] + m[1] * l[0] + m[4] * l[1] + m[7] * l[2];
    out[oo + 2] = p[2] + m[2] * l[0] + m[5] * l[1] + m[8] * l[2];
    return out;
  }
}

function copy7(a, b) { for (let i = 0; i < 7; i++) b[i] = a[i]; }
const Z_AXIS = new Float64Array([0, 0, 1]);
const M0 = new Float64Array(9), M1 = new Float64Array(9), WV = new Float64Array(3);

export class World {
  /**
   * @param {{ seed?: number, rate?: number, gravity?: number[], every?: number, keepNear?: number, farEvery?: number,
   *           capBytes?: number, wind?: object }} o
   */
  constructor(o = {}) {
    this.seed = (o.seed ?? 1) >>> 0;
    this.rate = o.rate ?? DEFAULT_RATE;
    this.gravity = new Float64Array(o.gravity || [0, -21.6, 0]);
    this.every = o.every ?? this.rate;                // checkpoint every N steps (1 s)
    this.keepNear = o.keepNear ?? 30 * this.rate;      // keep 1 s checkpoints within 30 s of the play head
    this.farEvery = o.farEvery ?? 5 * this.rate;       // and every 5 s beyond
    this.capBytes = o.capBytes ?? 24 * 1024 * 1024;
    this.drivers = []; this.colliders = []; this.bodies = [];
    this.nParticles = 0; this._pending = [];
    this._stateInit = []; this.state = null;
    this.finalized = false; this.begun = false;
    this.k = 0; this.checkpoints = []; this.events = [];
    this._invalidatePoses();
    this.sdt = 1 / (this.rate * 8); this.invSdt2 = 1 / (this.sdt * this.sdt);
    this.windOpts = null;
    this.setWind(o.wind || null);
  }

  // ---------------------------------------------------------------------------------------------- building
  /** Named seeded random stream (mulberry32). The same name gives the same numbers whatever else is built. */
  rng(name) { return stream(this.seed, name); }
  driver(name, o) { this._assertBuilding(); const d = new Driver(name, o); this.drivers.push(d); return d; }
  plane(o = {}) { return this._col(new Collider(PLANE, { n: o.n || [0, 1, 0], ...o })); }
  sphere(o) { return this._col(new Collider(SPHERE, o)); }
  capsule(o) { return this._col(new Collider(CAPSULE, o)); }
  box(o) { return this._col(new Collider(BOX, o)); }
  _col(c) { this._assertBuilding(); this.colliders.push(c); return c; }
  _assertBuilding() { if (this.finalized) throw new Error('spudphys: the world is frozen after finalize()'); }

  /**
   * Seeded wind: wind(t, x) = dir * strength * (base + sum of 4 sines with seeded phases) + gusts.
   * @param {{ dir?: number[], strength?: number, base?: number, gusts?: {t:number, dur:number, strength:number}[] }|null} o
   */
  setWind(o) {
    if (!o) { this.windOpts = null; return; }
    const r = this.rng('wind'), terms = [];
    for (let i = 0; i < 4; i++) terms.push({ a: 0.5 / (i + 1), om: 0.7 + 2.3 * i + r(), kx: 0.3 + 0.6 * r(), kz: 0.2 * r(), ph: 6.283185307179586 * r() });
    this.windOpts = { dir: o.dir || [-1, 0, 0], strength: o.strength ?? 1, base: o.base ?? 0.6, gusts: o.gusts || [], terms, swirl: o.swirl ?? 0.25 };
  }
  /** Wind velocity at song time t and point p, written into out. Pure function of (seed, t, p). */
  wind(t, px, py, pz, out = WV) {
    const W = this.windOpts;
    if (!W) { out[0] = 0; out[1] = 0; out[2] = 0; return out; }
    let s = W.base, sw = 0;
    for (let i = 0; i < 4; i++) { const T = W.terms[i]; s += T.a * dsin(T.om * t + T.kx * px + T.kz * pz + T.ph); }
    sw = W.swirl * dsin(1.7 * t + 0.9 * px + W.terms[0].ph);
    for (let i = 0; i < W.gusts.length; i++) {
      const g = W.gusts[i], u = (t - g.t) / g.dur;
      if (u > 0 && u < 1) s += g.strength * 4 * u * (1 - u);
    }
    s *= W.strength;
    out[0] = W.dir[0] * s; out[1] = W.dir[1] * s + sw * W.strength; out[2] = W.dir[2] * s;
    return out;
  }
  /** Reserves n numbers of saved state (quaternions, springs...). Returns the offset into world.state. */
  allocState(init) { this._assertBuilding(); const off = this._stateInit.length; for (const v of init) this._stateInit.push(v); return off; }

  /**
   * Adds a body: a contiguous particle range plus its constraint groups. Used by the adapters.
   * spec: { kind, n, rest: Float64Array(3n) in `space` local (or world when no space), invMass: number|Float64Array,
   *         radius: number|Float64Array, space: Driver|null, substeps, active: [t0, t1], colliders: Collider[],
   *         gravity: scale, drag, vmax, follow: Driver[], aero: { tris: Int32Array (local ids), coef }, planar: compliance }
   */
  addBody(spec) {
    this._assertBuilding();
    const n = spec.n | 0, p0 = this.nParticles;
    const rate = this.rate;
    const act = spec.active || [0, Infinity];
    const body = {
      id: this.bodies.length, kind: spec.kind || 'body', name: spec.name || '', p0, n,
      substeps: spec.substeps ?? 8, space: spec.space || null,
      kStart: act[0] <= 0 ? 0 : this.stepAt(act[0]), kEnd: act[1] === Infinity ? Infinity : this.stepAt(act[1]),
      rest: spec.rest || new Float64Array(3 * n), groups: [], colliders: spec.colliders || [],
      gravity: spec.gravity ?? 1, drag: spec.drag ?? 0, vmax: spec.vmax ?? 60, follow: spec.follow || [],
      aero: spec.aero || null, planar: spec.planar ?? null, planarAxis: spec.planarAxis || null,
      pre: null, post: null, onReset: null, park: null, collide: null, needsPark: false,
    };
    this._pending.push({ body, invMass: spec.invMass ?? 1, radius: spec.radius ?? 0 });
    this.nParticles += n;
    this.bodies.push(body);
    if (rate <= 0) throw new Error('bad rate');
    return body;
  }
  finalize() {
    if (this.finalized) return this;
    const N = this.nParticles;
    this.x = new Float64Array(3 * N); this.p = new Float64Array(3 * N); this.v = new Float64Array(3 * N);
    this.w = new Float64Array(N); this.r = new Float64Array(N); this.acc = new Float64Array(3 * N);
    for (const { body, invMass, radius } of this._pending) {
      for (let i = 0; i < body.n; i++) {
        this.w[body.p0 + i] = typeof invMass === 'number' ? invMass : invMass[i];
        this.r[body.p0 + i] = typeof radius === 'number' ? radius : radius[i];
      }
    }
    this._pending = null;
    for (const b of this.bodies) {
      const ds = [], cs = [];
      const addD = (d) => { if (d && !ds.includes(d)) ds.push(d); };
      addD(b.space); b.follow.forEach(addD);
      for (const g of b.groups) addD(g.driver);
      for (const c of b.colliders) { addD(c.driver); if (!cs.includes(c)) cs.push(c); }
      for (const d of b.extraDrivers || []) addD(d);
      b._drivers = ds.sort((p, q) => this.drivers.indexOf(p) - this.drivers.indexOf(q));
      b._cols = cs;
    }
    this.state = new Float64Array(this._stateInit);
    this.stateInit = new Float64Array(this._stateInit);
    this.finalized = true;
    return this;
  }

  // ---------------------------------------------------------------------------------------------- time
  /** Step index for song time t. The one function the game, video and tests share. */
  stepAt(t) { return Math.floor(t * this.rate + 1e-7); }
  get time() { return this.k / this.rate; }
  isActive(body, k = this.k) { return k >= body.kStart && k < body.kEnd; }

  /** Interpolates every driver and poses every collider at substep fraction s (cached). */
  poseDrivers(s) {
    for (let i = 0; i < this.drivers.length; i++) { const d = this.drivers[i]; if (d._s !== s) { d.poseAt(s); d._s = s; } }
    for (let i = 0; i < this.colliders.length; i++) { const c = this.colliders[i]; if (c._s !== s) { c.pose(); c._s = s; } }
  }
  /** Poses only what one body uses (its drivers, then its colliders), each cached per substep fraction. */
  _poseFor(body, s) {
    const ds = body._drivers, cs = body._cols;
    for (let i = 0; i < ds.length; i++) { const d = ds[i]; if (d._s !== s) { d.poseAt(s); d._s = s; } }
    for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (c._s !== s) { c.pose(); c._s = s; } }
  }
  _invalidatePoses() {
    for (let i = 0; i < this.drivers.length; i++) this.drivers[i]._s = -1;
    for (let i = 0; i < this.colliders.length; i++) this.colliders[i]._s = -1;
  }

  /** Puts a body on its rest pose at the drivers' pose for fraction s (default: the current sample). */
  parkBody(body, s = 0) {
    this.poseDrivers(s);
    if (body.park) { body.park(this, body); }
    else {
      const x = this.x, rest = body.rest, d = body.space;
      for (let i = 0; i < body.n; i++) {
        const o = 3 * (body.p0 + i), l = 3 * i;
        if (d) {
          const m = d.m, p = d.pos, lx = rest[l], ly = rest[l + 1], lz = rest[l + 2];
          x[o] = p[0] + m[0] * lx + m[3] * ly + m[6] * lz;
          x[o + 1] = p[1] + m[1] * lx + m[4] * ly + m[7] * lz;
          x[o + 2] = p[2] + m[2] * lx + m[5] * ly + m[8] * lz;
        } else { x[o] = rest[l]; x[o + 1] = rest[l + 1]; x[o + 2] = rest[l + 2]; }
      }
    }
    const a = 3 * body.p0, b = 3 * (body.p0 + body.n);
    this.p.set(this.x.subarray(a, b), a);
    this.v.fill(0, a, b);
    if (body.onReset) body.onReset(this, body);
  }
  /** Puts a body back on its rest pose now (costume change etc.). */
  resetBody(body) { this.parkBody(body, 0); }

  /**
   * Starts the world at k = 0. drive(-1) must set every driver to its pose at song time 0.
   */
  begin(drive) {
    this.finalize();
    for (const d of this.drivers) d.hasNext = false;
    if (drive) drive(-1, this);
    for (const d of this.drivers) {
      if (d.hasNext) { d.prev.set(d.next.subarray(0, 7)); d.prev[7] = 1; }
      else { d.next.set(d.prev.subarray(0, 7)); }
      d.hasNext = false;
    }
    this.state.set(this.stateInit);
    this.k = 0; this._invalidatePoses();
    for (const b of this.bodies) this.parkBody(b, 0);
    this.checkpoints = [];
    this.begun = true;
    this.saveCheckpoint();
    return this;
  }

  // ---------------------------------------------------------------------------------------------- the step
  /** Advances one fixed step: k -> k+1, song time (k+1)/rate. drive(k) sets the drivers for that time. */
  step(drive) {
    if (!this.begun) this.begin(drive);
    const k = this.k;
    this.events.length = 0;
    for (const d of this.drivers) d.hasNext = false;
    if (drive) drive(k, this);
    for (const d of this.drivers) {
      if (!d.hasNext) copy7(d.prev, d.next);   // not set: hold the last pose
      const a = d.prev, b = d.next, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      d.jump = dx * dx + dy * dy + dz * dz > d.teleport * d.teleport;
    }
    // teleports: bodies riding a jumping driver move rigidly with it; bodies only pinned to it re-park
    for (const body of this.bodies) {
      if (!this.isActive(body, k)) continue;
      if (body.space && body.space.jump) this._carry(body, body.space);
      else for (const f of body.follow) if (f.jump) { body.needsPark = true; break; }
    }
    for (const d of this.drivers) if (d.jump) copy7(d.next, d.prev);
    this._invalidatePoses();

    for (const body of this.bodies) {
      if (!this.isActive(body, k)) {
        if (body.n > 0) this.parkBody(body, 1);
        continue;
      }
      if (k === body.kStart || body.needsPark) { this.parkBody(body, 0); body.needsPark = false; }
      if (body.pre) body.pre(this, body, k);
      if (body.n > 0) this._simulate(body, k);
      if (body.post) body.post(this, body, k);
    }
    for (const d of this.drivers) { copy7(d.next, d.prev); d.prev[7] = 1; d.hasNext = false; }
    this.k = k + 1;
    this._invalidatePoses();
  }

  _simulate(body, k) {
    const n = body.substeps, x = this.x, p = this.p, v = this.v, w = this.w, r = this.r, acc = this.acc;
    const sdt = 1 / (this.rate * n);
    this.sdt = sdt; this.invSdt2 = 1 / (sdt * sdt);
    const g = this.gravity, gs = body.gravity, gx = g[0] * gs, gy = g[1] * gs, gz = g[2] * gs;
    const damp = 1 - body.drag * sdt, i0 = body.p0, i1 = body.p0 + body.n, vmax2 = body.vmax * body.vmax;
    const groups = body.groups, cols = body.colliders;
    for (let j = 0; j < n; j++) {
      const s = (j + 1) / n;
      this._poseFor(body, s);
      let ax = 0, ay = 0, az = 0;
      if (body.aero) { this._aero(body, (k + j / n) / this.rate); ax = WV[0]; ay = WV[1]; az = WV[2]; }
      // predict
      for (let i = i0; i < i1; i++) {
        const o = 3 * i;
        p[o] = x[o]; p[o + 1] = x[o + 1]; p[o + 2] = x[o + 2];
        if (w[i] === 0) continue;
        let vx = v[o] + sdt * gx, vy = v[o + 1] + sdt * gy, vz = v[o + 2] + sdt * gz;
        if (body.aero) {   // cloth: aero force, and drag relative to the moving air (so wind streams a cape, not only flaps it)
          vx += sdt * acc[o]; vy += sdt * acc[o + 1]; vz += sdt * acc[o + 2];
          vx = ax + (vx - ax) * damp; vy = ay + (vy - ay) * damp; vz = az + (vz - az) * damp;
        } else { vx *= damp; vy *= damp; vz *= damp; }
        v[o] = vx; v[o + 1] = vy; v[o + 2] = vz;
        x[o] += sdt * vx; x[o + 1] += sdt * vy; x[o + 2] += sdt * vz;
      }
      // constraints in build order
      for (let q = 0; q < groups.length; q++) groups[q].solve(this, j);
      // collisions: colliders in build order, then any body-specific contacts
      if (cols.length) {
        for (let i = i0; i < i1; i++) {
          if (w[i] === 0) continue;
          for (let c = 0; c < cols.length; c++) collideParticle(x, p, i, r[i], cols[c]);
        }
      }
      if (body.collide) body.collide(this, body, j);
      if (body.planar !== null && body.space) this._planar(body);
      // velocity update
      let sum = 0;
      const inv = 1 / sdt;
      for (let i = i0; i < i1; i++) {
        const o = 3 * i;
        if (w[i] === 0) { v[o] = 0; v[o + 1] = 0; v[o + 2] = 0; continue; }
        let vx = (x[o] - p[o]) * inv, vy = (x[o + 1] - p[o + 1]) * inv, vz = (x[o + 2] - p[o + 2]) * inv;
        const s2 = vx * vx + vy * vy + vz * vz;
        if (s2 > vmax2) { const f = body.vmax / Math.sqrt(s2); vx *= f; vy *= f; vz *= f; }
        v[o] = vx; v[o + 1] = vy; v[o + 2] = vz;
        sum += x[o] + x[o + 1] + x[o + 2];
      }
      if (sum !== sum) {                    // NaN guard: deterministic reset to the driven rest pose
        this.events.push({ type: 'nan', body: body.id, k });
        this.parkBody(body, s);
        return;
      }
    }
  }

  /**
   * Aerodynamic force per cloth triangle (drag/lift along the normal), as accelerations in this.acc.
   * The wind is sampled once per body and substep at the body's centre (a cape is small next to the wind's
   * wavelength), which keeps the trig count tiny; the per-triangle part is the relative velocity and the normal.
   */
  _aero(body, t) {
    const x = this.x, v = this.v, w = this.w, acc = this.acc, tris = body.aero.tris, coef = body.aero.coef, p0 = body.p0;
    const a0 = 3 * p0, a1 = 3 * (p0 + body.n);
    acc.fill(0, a0, a1);
    let mx = 0, my = 0, mz = 0;
    for (let o = a0; o < a1; o += 3) { mx += x[o]; my += x[o + 1]; mz += x[o + 2]; }
    const inv = 1 / body.n;
    this.wind(t, mx * inv, my * inv, mz * inv, WV);
    const wx = WV[0], wy = WV[1], wz = WV[2];
    for (let q = 0; q < tris.length; q += 3) {
      const ia = p0 + tris[q], ib = p0 + tris[q + 1], ic = p0 + tris[q + 2], a = 3 * ia, b = 3 * ib, c = 3 * ic;
      const e1x = x[b] - x[a], e1y = x[b + 1] - x[a + 1], e1z = x[b + 2] - x[a + 2];
      const e2x = x[c] - x[a], e2y = x[c + 1] - x[a + 1], e2z = x[c + 2] - x[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl === 0) continue;
      const rx = wx - (v[a] + v[b] + v[c]) / 3, ry = wy - (v[a + 1] + v[b + 1] + v[c + 1]) / 3, rz = wz - (v[a + 2] + v[b + 2] + v[c + 2]) / 3;
      const f = coef * (rx * nx + ry * ny + rz * nz) / (6 * nl);   // c * A * (vrel . n) n, a third per corner
      const fx = f * nx, fy = f * ny, fz = f * nz, wa = w[ia], wb = w[ib], wc = w[ic];
      acc[a] += fx * wa; acc[a + 1] += fy * wa; acc[a + 2] += fz * wa;
      acc[b] += fx * wb; acc[b + 1] += fy * wb; acc[b + 2] += fz * wb;
      acc[c] += fx * wc; acc[c + 1] += fy * wc; acc[c + 2] += fz * wc;
    }
  }

  /**
   * Soft pull of each particle's depth (a world axis, default z = the runner camera's view axis) toward the depth of
   * its rest point carried by the body's driver. Motion along the view axis is invisible, so this keeps capes swinging
   * in the silhouette people actually see.
   */
  _planar(body) {
    const d = body.space, m = d.m, P = d.pos, x = this.x, w = this.w, rest = body.rest, ax = body.planarAxis || Z_AXIS;
    const alpha = body.planar * this.invSdt2, zx = ax[0], zy = ax[1], zz = ax[2];
    for (let i = 0; i < body.n; i++) {
      const id = body.p0 + i, wi = w[id];
      if (wi === 0) continue;
      const o = 3 * id, l = 3 * i, lx = rest[l], ly = rest[l + 1], lz = rest[l + 2];
      const rx = P[0] + m[0] * lx + m[3] * ly + m[6] * lz, ry = P[1] + m[1] * lx + m[4] * ly + m[7] * lz, rz = P[2] + m[2] * lx + m[5] * ly + m[8] * lz;
      const c = ((rx - x[o]) * zx + (ry - x[o + 1]) * zy + (rz - x[o + 2]) * zz) * wi / (wi + alpha);
      x[o] += zx * c; x[o + 1] += zy * c; x[o + 2] += zz * c;
    }
  }

  /** Moves a body rigidly from its driver's previous pose to its new pose (teleports). */
  _carry(body, d) {
    quatToMat3(d.prev, 3, M0, 0); quatToMat3(d.next, 3, M1, 0);
    const a = d.prev, b = d.next, x = this.x, v = this.v;
    for (let i = body.p0; i < body.p0 + body.n; i++) {
      const o = 3 * i;
      const dx = x[o] - a[0], dy = x[o + 1] - a[1], dz = x[o + 2] - a[2];
      const lx = M0[0] * dx + M0[1] * dy + M0[2] * dz, ly = M0[3] * dx + M0[4] * dy + M0[5] * dz, lz = M0[6] * dx + M0[7] * dy + M0[8] * dz;
      x[o] = b[0] + M1[0] * lx + M1[3] * ly + M1[6] * lz;
      x[o + 1] = b[1] + M1[1] * lx + M1[4] * ly + M1[7] * lz;
      x[o + 2] = b[2] + M1[2] * lx + M1[5] * ly + M1[8] * lz;
      const ux = M0[0] * v[o] + M0[1] * v[o + 1] + M0[2] * v[o + 2], uy = M0[3] * v[o] + M0[4] * v[o + 1] + M0[5] * v[o + 2], uz = M0[6] * v[o] + M0[7] * v[o + 1] + M0[8] * v[o + 2];
      v[o] = M1[0] * ux + M1[3] * uy + M1[6] * uz; v[o + 1] = M1[1] * ux + M1[4] * uy + M1[7] * uz; v[o + 2] = M1[2] * ux + M1[5] * uy + M1[8] * uz;
    }
    this.events.push({ type: 'teleport', body: body.id, k: this.k });
  }

  // ---------------------------------------------------------------------------------------------- scrubbing
  /** Brings the world to song time t: restores the newest checkpoint at or before it, then steps forward. */
  simulateTo(t, drive) {
    if (!this.begun) this.begin(drive);
    let K = this.stepAt(t); if (K < 0) K = 0;
    if (K === this.k) return this;
    if (K < this.k || K - this.k > this.every) {
      let best = null;
      for (const c of this.checkpoints) if (c.k <= K && (!best || c.k > best.k)) best = c;
      if (best && (K < this.k || best.k > this.k)) this.restore(best);
    }
    while (this.k < K) {
      this.step(drive);
      if (this.k % this.every === 0) this.saveCheckpoint();
    }
    return this;
  }
  /** Live play: like simulateTo, but catches up at most maxSteps per call (never skips state). */
  play(t, drive, maxSteps = 4) {
    if (!this.begun) this.begin(drive);
    let K = this.stepAt(t); if (K < 0) K = 0;
    if (K < this.k || K - this.k > 4 * this.every) return this.simulateTo(t, drive);   // a scrub, not a hitch
    for (let i = 0; i < maxSteps && this.k < K; i++) {
      this.step(drive);
      if (this.k % this.every === 0) this.saveCheckpoint();
    }
    return this;
  }
  /** Precomputes checkpoints from t0 to t1 in one pass (offline, e.g. for the video renderer). */
  bake(t0, t1, drive) {
    this.simulateTo(t0, drive);
    this.simulateTo(t1, drive);
    return this.checkpoints.length;
  }

  stateArrays() {
    const out = [this.x, this.v, this.state];
    for (const d of this.drivers) out.push(d.prev);
    return out;
  }
  /** Size in numbers of one snapshot. */
  snapshotSize() { return 1 + 6 * this.nParticles + this.state.length + 8 * this.drivers.length; }
  snapshot() {
    const buf = new Float64Array(this.snapshotSize());
    buf[0] = this.k;
    let o = 1;
    for (const a of this.stateArrays()) { buf.set(a, o); o += a.length; }
    return { k: this.k, buf };
  }
  restore(snap) {
    const buf = snap.buf;
    if (buf.length !== this.snapshotSize()) throw new Error('spudphys: snapshot does not fit this world');
    this.k = buf[0];
    let o = 1;
    for (const a of this.stateArrays()) { a.set(buf.subarray(o, o + a.length)); o += a.length; }
    for (const d of this.drivers) { d.next.set(d.prev.subarray(0, 7)); d.hasNext = false; }
    this.p.set(this.x);
    for (const b of this.bodies) b.needsPark = false;
    this._invalidatePoses();
    this.begun = true;
    return this;
  }
  saveCheckpoint() {
    const snap = this.snapshot();
    const i = this.checkpoints.findIndex(c => c.k === snap.k);
    if (i >= 0) this.checkpoints[i] = snap; else { this.checkpoints.push(snap); this.checkpoints.sort((a, b) => a.k - b.k); }
    this._prune();
    return snap;
  }
  _prune() {
    const k = this.k, near = this.keepNear, far = this.farEvery;
    this.checkpoints = this.checkpoints.filter(c => c.k === 0 || Math.abs(c.k - k) <= near || c.k % far === 0);
    const bytes = () => this.checkpoints.reduce((s, c) => s + c.buf.byteLength, 0);
    while (this.checkpoints.length > 2 && bytes() > this.capBytes) {
      let worst = -1, wd = -1;
      for (let i = 0; i < this.checkpoints.length; i++) {
        const c = this.checkpoints[i]; if (c.k === 0 || c.k === k) continue;
        const d = Math.abs(c.k - k); if (d > wd) { wd = d; worst = i; }
      }
      if (worst < 0) break;
      this.checkpoints.splice(worst, 1);
    }
  }
  /** Forget checkpoints after step k (call when the input log changes, e.g. a new attempt at a level). */
  invalidateAfter(k) { this.checkpoints = this.checkpoints.filter(c => c.k <= k); }
  checkpointBytes() { return this.checkpoints.reduce((s, c) => s + c.buf.byteLength, 0); }

  /** Checkpoints -> bytes (e.g. saved next to a video render) and back. */
  serializeCheckpoints() {
    const size = this.snapshotSize(), n = this.checkpoints.length, out = new Float64Array(2 + n * size);
    out[0] = n; out[1] = size;
    this.checkpoints.forEach((c, i) => out.set(c.buf, 2 + i * size));
    return new Uint8Array(out.buffer);
  }
  loadCheckpoints(bytes) {
    const f = new Float64Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const n = f[0], size = f[1];
    if (size !== this.snapshotSize()) throw new Error('spudphys: checkpoints are from a different world');
    this.finalize();
    this.checkpoints = [];
    for (let i = 0; i < n; i++) { const buf = f.slice(2 + i * size, 2 + (i + 1) * size); this.checkpoints.push({ k: buf[0], buf }); }
    if (!this.begun && this.checkpoints.length) this.restore(this.checkpoints[0]);
  }

  /** FNV-1a over every saved state number: equal hashes = equal bits. */
  hash() { return fnv1a([new Float64Array([this.k]), ...this.stateArrays()]); }
}

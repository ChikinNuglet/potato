// motion3d.mjs — clothes that MOVE on the 3D Potato (wardrobe first; Nov 5, The Dressing Room Spuds).
// Shared by two designers, one fenced section each: CAPES (big cloth: capes, coat tails, back flaps) and SMALL PARTS
// (ropes, tassels, chains). Append inside your own fence; never rewrite the other's.
//
// Rules every piece here keeps (Chikin's costume rules + the clay lab's cloth notebook):
//   - cosmetic only, deterministic (spudphys: fixed 1/60 steps, no Math.random), cheap on the old Mac;
//   - it never goes through him: it collides with HIS shape (KIT.rx / KIT.rz profiles), not a stand-in ball;
//   - it hangs still when he stands still, swings when he walks, hops, spins, flips and ducks;
//   - pinned edges stay ON him (his own squash + lean are applied to the cloth after the solve, so a duck or a landing
//     squashes the cape with him instead of leaving it floating);
//   - stills (the 8-angle sheet: time never moves) always show the settled hang, whatever angle.
// How a costume uses it: make the piece in build(H), put piece.part in parts, call piece.update(H, dt, time) from the
// builder's update(KIT, dt, time).
import { World, adapters as A } from './spudphys/index.mjs';

// cost meter (ms per frame, smoothed) per piece, for the "1 vs 3 moving costumes" check: import and read STATS
export const STATS = { pieces: new Map(), total() { let s = 0; for (const v of this.pieces.values()) s += v.ms; return s; } };
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// his own squash + lean (a copy of spud3d.mjs deform(), so the cloth deforms exactly like his surface does)
export function bodyDeform(S, FOOT_H, p) {
  const s = S.squash.x, inv = 1 / Math.sqrt(Math.max(0.3, s)), hgt = p.y - FOOT_H, hc = Math.max(0, hgt);
  const f = 1 + (inv - 1) * Math.sin(Math.PI * Math.min(1, hc * 1.1)) * 1.4, hh = hgt * hgt;
  p.y = FOOT_H * 0.6 + (p.y - FOOT_H * 0.6) * s; p.x = p.x * f + S.leanX.x * hh; p.z = p.z * f + S.leanZ.x * hh;
  return p;
}

// ============================================================================================================
// ===== CAPES (designer CAPES) ===============================================================================
// A cape (or a coat tail, a hood drape, a back flap) is a real cloth sheet: a small spudphys grid (direct mode) pinned
// along a line on his back, colliding with his real outline (an ellipse per height from KIT.rx / KIT.rz, plus the
// cloth layer's own puff), the floor, and air drag (so walking trails it, hops flare it, spins fling it). The solve
// runs in world space from his group's matrixWorld (so the wardrobe's walk, jump, double-jump flip and spins all reach
// it); the result is brought back into his body space and given his squash + lean. Drawn as a closed thin sheet
// (outer colour + a lining colour inside, tapered to a shared rim) with his ink shell round it: one ink line, no cracks.
//
// capeCloth(H, o): o =
//   center   back-centre angle (default Math.PI = dead back; tails use Math.PI ± a)
//   half     (s) => half-width in radians round him at depth s (0 at the pin line .. 1 at the hem)
//   top      (th) => v of the pin line (body heights from his top), bottom (u) => v of the hem at u (-1..1 across)
//   off      how far the sheet's middle stands off his surface at the pin line (his cloth puff + half the thickness)
//   flare    extra stand-off at the hem at rest (default 0.02), thick (sheet thickness, default 0.022)
//   cols, rows  sim grid (default 9 x 7), R  render subdivisions per sim cell (default 2: cheap on the old Mac, still smooth)
//   color, lining, inkK (ink width x, default 0.9), bend (compliance, default 2.4), drag (0.9), gravity (0.36), wind (aero, 4.5): floaty on purpose, a cape that means it
//   half: 'bottom' | 'top' — which half of the costume it belongs to for the wardrobe's whole/top/bottom (default bottom)
//   name     for STATS
// returns { part, update(H, dt, time), cloth, world }
export function capeCloth(H, o) {
  const T = H.T, FOOT_H = H.FOOT_H;
  const nx = o.cols || 9, ny = o.rows || 7, R = o.R || 2, RX = (nx - 1) * R + 1, RY = (ny - 1) * R + 1;
  const C0 = o.center ?? Math.PI, thick = o.thick ?? 0.022, flare = o.flare ?? 0.02, off = o.off ?? 0.03;
  const bodyOff = o.bodyOff ?? 0.018;                     // his cloth layer's puff where the cape lies (collide past it)
  const vClamp = v => Math.min(0.985, Math.max(0.015, v));
  // the rest sheet (in his body space, undeformed): rows down from the pin line, across round his back.
  // Below his widest point the radius is held (the cape falls straight from the bulge instead of tucking under him).
  const rest = new Float32Array(nx * ny * 3), pinned = new Set();
  const radAt = (v, th, vTop) => { let rx = 0, rz = 0; for (let k = 0; k <= 8; k++) { const vv = vClamp(vTop + (v - vTop) * k / 8); rx = Math.max(rx, H.rx(vv)); rz = Math.max(rz, H.rz(vv)); } return [rx, rz]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const u = -1 + 2 * i / (nx - 1), s = j / (ny - 1), th0 = C0 + u * o.half(0), vTop = o.top(th0);
    const th = C0 + u * o.half(s), v = vTop + (o.bottom(u) - vTop) * s;
    const [rx, rz] = radAt(v, th, vTop), sx = Math.sin(th), cz = Math.cos(th);
    // outward = the ellipse's normal there; stand off by `off` (+ flare toward the hem)
    let nX = sx / rx, nZ = cz / rz; const L = Math.hypot(nX, nZ) || 1; nX /= L; nZ /= L;
    const d = off + flare * s * s, k = 3 * (j * nx + i);
    rest[k] = rx * sx + nX * d; rest[k + 1] = FOOT_H + 1 - v; rest[k + 2] = rz * cz + nZ * d;
    if (j === 0) pinned.add(k);
  }
  const idx = [];
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }

  // ---- the world: one driver (his body), the floor, the cloth
  const world = new World({ seed: 7, gravity: [0, -22, 0] });   // (the game's / the wardrobe's gravity)
  const spine = world.driver('potato.body', { teleport: 1.0 });
  const floor = world.plane({ n: [0, 1, 0], d: 0, friction: 0.5 });
  const cloth = A.cape(world, { positions: rest, index: new Uint32Array(idx), space: spine, coarse: null,
    pin: (x, y, z) => { for (const k of pinned) if (Math.abs(rest[k] - x) < 1e-6 && Math.abs(rest[k + 1] - y) < 1e-6 && Math.abs(rest[k + 2] - z) < 1e-6) return true; return false; },
    colliders: [floor], bend: o.bend ?? 2.4, drag: o.drag ?? 0.9, gravity: o.gravity ?? 0.36, wind: o.wind ?? 4.5,
    radius: thick * 0.5 + 0.004, substeps: o.substeps ?? 6, tether: 1.04, name: o.name || 'cape' });
  // his real outline as the collider: at each particle's height an ellipse (rx, rz from his profile) grown by his cloth
  // puff + the sheet's half thickness; pushed out along the ellipse (scaled to its edge), in his body frame
  // + a soft pull home (o.homeRate per second, default 3): a cartoon cape always finds its way back down his back, so a
  // whirl that wraps it round him unwinds instead of staying tangled (cloth alone has no reason to unwrap round a ball)
  const body = cloth.body, rr = thick * 0.5 + bodyOff + 0.006, restG = body.rest;
  const home = 1 - Math.exp(-(o.homeRate ?? 2) / (world.rate * (o.substeps ?? 6)));
  body.collide = (w) => {
    const x = w.x, m = spine.m, P = spine.pos, i0 = body.p0, i1 = body.p0 + body.n;
    for (let i = i0; i < i1; i++) {
      if (w.w[i] === 0) continue;
      const q = 3 * i, l = 3 * (i - i0);
      if (home > 0) { const ax0 = restG[l], ay0 = restG[l + 1], az0 = restG[l + 2];
        const tx = P[0] + m[0] * ax0 + m[3] * ay0 + m[6] * az0, ty = P[1] + m[1] * ax0 + m[4] * ay0 + m[7] * az0, tz = P[2] + m[2] * ax0 + m[5] * ay0 + m[8] * az0;
        x[q] += (tx - x[q]) * home; x[q + 1] += (ty - x[q + 1]) * home; x[q + 2] += (tz - x[q + 2]) * home; }
      const dx = x[q] - P[0], dy = x[q + 1] - P[1], dz = x[q + 2] - P[2];
      const lx = m[0] * dx + m[1] * dy + m[2] * dz, ly = m[3] * dx + m[4] * dy + m[5] * dz, lz = m[6] * dx + m[7] * dy + m[8] * dz;   // world -> body (R^T)
      const v = FOOT_H + 1 - ly; if (v < 0.01 || v > 1.0) continue;
      const ax = H.rx(vClamp(v)) + rr, az = H.rz(vClamp(v)) + rr, e = (lx * lx) / (ax * ax) + (lz * lz) / (az * az);
      if (e >= 1) continue;
      const f = 1 / Math.sqrt(Math.max(e, 1e-6)), nx2 = lx * f - lx, nz2 = lz * f - lz;   // push out to the ellipse's edge
      x[q] += m[0] * nx2 + m[6] * nz2; x[q + 1] += m[1] * nx2 + m[7] * nz2; x[q + 2] += m[2] * nx2 + m[8] * nz2;
    }
  };

  // ---- the drawn sheet: RX x RY points, outer + inner layers, tapered to a shared rim
  const NV = RX * RY, inner = new Int32Array(NV), half = new Float32Array(NV);
  let nv = NV;
  for (let j = 0; j < RY; j++) for (let i = 0; i < RX; i++) {
    const g = j * RX + i, e = Math.min(i, RX - 1 - i, RY - 1 - j, j);
    half[g] = thick * 0.5 * Math.sqrt(Math.min(1, e / (R * 0.9)));
    inner[g] = e === 0 ? g : nv++;
  }
  const pos = new Float32Array(nv * 3), geo = new T.BufferGeometry(), pa = new T.BufferAttribute(pos, 3);
  pa.setUsage(T.DynamicDrawUsage); geo.setAttribute('position', pa);
  const tri = [[], []];
  for (let j = 0; j < RY - 1; j++) for (let i = 0; i < RX - 1; i++) {
    const a = j * RX + i, b = a + 1, c = a + RX, d = c + 1;
    tri[0].push(a, c, b, b, c, d);                                           // outer (normal = (c-a) x (b-a) side, fixed below)
    tri[1].push(inner[a], inner[b], inner[c], inner[b], inner[d], inner[c]);
  }
  // which way is out: at rest the outer face must point away from him
  { const a = 0, b = 1, c = nx; const ux = rest[3 * b] - rest[3 * a], uy = rest[3 * b + 1] - rest[3 * a + 1], uz = rest[3 * b + 2] - rest[3 * a + 2];
    const vx = rest[3 * c] - rest[3 * a], vy = rest[3 * c + 1] - rest[3 * a + 1], vz = rest[3 * c + 2] - rest[3 * a + 2];
    const n = [vy * uz - vz * uy, vz * ux - vx * uz, vx * uy - vy * ux], m = 3 * Math.floor(nx / 2);
    if (n[0] * rest[m] + n[2] * rest[m + 2] < 0) for (const t of tri) for (let k = 0; k < t.length; k += 3) { const s = t[k + 1]; t[k + 1] = t[k + 2]; t[k + 2] = s; } }
  geo.setIndex([...tri[0], ...tri[1]]); geo.addGroup(0, tri[0].length, 0); geo.addGroup(tri[0].length, tri[1].length, 1);
  const outerMat = H.paint(o.color), liningMat = H.paint(o.lining || o.color);
  const part = new T.Group(), skin = new T.Mesh(geo, [outerMat, liningMat]);
  part.add(skin, new T.Mesh(geo, H.shell(H.INK * 0.75 * (o.inkK ?? 0.9), '#120a05')));
  part.userData.half = o.half === 'top' ? 'top' : 'bottom';
  part.traverse(c => { c.frustumCulled = false; });

  // ---- per frame
  const nG = nx * ny, simW = new Float64Array(nG * 3), loc = new Float64Array(nG * 3), mid = new Float64Array(NV * 3), tmp = new Float64Array(RX * ny * 3);
  const M = new T.Matrix4(), Pv = new T.Vector3(), Q = new T.Quaternion(), Sv = new T.Vector3(), pp = { x: 0, y: 0, z: 0 };
  const cur = { p: [0, 0, 0], q: [0, 0, 0, 1] };
  const drive = () => spine.set(cur.p, cur.q);
  let simT = 0, lastTime = -Infinity, started = false; const lastQ = [0, 0, 0, 1];
  const settle = n => { world.begin(drive); for (let k = 0; k < n; k++) world.step(drive); simT = world.k / world.rate; };
  const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
  const stat = { ms: 0 }; STATS.pieces.set(o.name || 'cape', stat);

  function update(K, dt, time) {
    const host = part.parent; if (!host) return;          // (not worn in this half: nothing to do)
    const t0 = now();
    host.updateWorldMatrix(true, false); M.copy(host.matrixWorld); M.decompose(Pv, Q, Sv);
    const sc = Sv.x || 1;
    cur.p[0] = Pv.x / sc; cur.p[1] = Pv.y / sc; cur.p[2] = Pv.z / sc; cur.q[0] = Q.x; cur.q[1] = Q.y; cur.q[2] = Q.z; cur.q[3] = Q.w;
    // first frame, a still (time stands still) or a snap (turned > 1 rad in one frame: the sheet tool, a costume swap): the settled hang
    const snapped = started && Math.abs(cur.q[0] * lastQ[0] + cur.q[1] * lastQ[1] + cur.q[2] * lastQ[2] + cur.q[3] * lastQ[3]) < Math.cos(0.5);
    if (!started || !(time > lastTime) || snapped) { settle(50); started = true; }
    else { simT = Math.min(simT + Math.min(dt, 1 / 20), world.k / world.rate + 4 / world.rate); world.play(simT, drive, 4); }
    lastTime = time; for (let k = 0; k < 4; k++) lastQ[k] = cur.q[k];
    cloth.dense(simW);
    // world -> his body space, with the pose the last step used (so the pinned row sits exactly on him)
    const nq = spine.next, px = nq[0], py = nq[1], pz = nq[2], qx = nq[3], qy = nq[4], qz = nq[5], qw = nq[6];
    const r00 = 1 - 2 * (qy * qy + qz * qz), r01 = 2 * (qx * qy - qz * qw), r02 = 2 * (qx * qz + qy * qw);
    const r10 = 2 * (qx * qy + qz * qw), r11 = 1 - 2 * (qx * qx + qz * qz), r12 = 2 * (qy * qz - qx * qw);
    const r20 = 2 * (qx * qz - qy * qw), r21 = 2 * (qy * qz + qx * qw), r22 = 1 - 2 * (qx * qx + qy * qy);
    for (let g = 0; g < nG; g++) { const dx = simW[3 * g] - px, dy = simW[3 * g + 1] - py, dz = simW[3 * g + 2] - pz;
      loc[3 * g] = r00 * dx + r10 * dy + r20 * dz; loc[3 * g + 1] = r01 * dx + r11 * dy + r21 * dz; loc[3 * g + 2] = r02 * dx + r12 * dy + r22 * dz; }
    // smooth it up: Catmull-Rom across each sim row, then down each drawn column
    for (let j = 0; j < ny; j++) for (let i = 0; i < RX; i++) {
      const f = i / R, c = Math.min(nx - 2, Math.floor(f)), t = f - c, i0 = Math.max(0, c - 1), i3 = Math.min(nx - 1, c + 2);
      for (let a = 0; a < 3; a++) tmp[3 * (j * RX + i) + a] = cr(loc[3 * (j * nx + i0) + a], loc[3 * (j * nx + c) + a], loc[3 * (j * nx + c + 1) + a], loc[3 * (j * nx + i3) + a], t);
    }
    for (let j = 0; j < RY; j++) { const f = j / R, c = Math.min(ny - 2, Math.floor(f)), t = f - c, j0 = Math.max(0, c - 1), j3 = Math.min(ny - 1, c + 2);
      for (let i = 0; i < RX; i++) for (let a = 0; a < 3; a++)
        mid[3 * (j * RX + i) + a] = cr(tmp[3 * (j0 * RX + i) + a], tmp[3 * (c * RX + i) + a], tmp[3 * ((c + 1) * RX + i) + a], tmp[3 * (j3 * RX + i) + a], t); }
    // his squash + lean on every drawn point
    const S = K.S;
    for (let g = 0; g < NV; g++) { pp.x = mid[3 * g]; pp.y = mid[3 * g + 1]; pp.z = mid[3 * g + 2]; bodyDeform(S, FOOT_H, pp); mid[3 * g] = pp.x; mid[3 * g + 1] = pp.y; mid[3 * g + 2] = pp.z; }
    // the two layers: mid -/+ the sheet's normal x its half thickness (normal from the drawn grid, pointing out)
    for (let j = 0; j < RY; j++) for (let i = 0; i < RX; i++) {
      const g = j * RX + i, a = 3 * (j * RX + Math.max(0, i - 1)), b = 3 * (j * RX + Math.min(RX - 1, i + 1)), c = 3 * (Math.max(0, j - 1) * RX + i), d = 3 * (Math.min(RY - 1, j + 1) * RX + i);
      const ux = mid[b] - mid[a], uy = mid[b + 1] - mid[a + 1], uz = mid[b + 2] - mid[a + 2], vx = mid[d] - mid[c], vy = mid[d + 1] - mid[c + 1], vz = mid[d + 2] - mid[c + 2];
      let nX = vy * uz - vz * uy, nY = vz * ux - vx * uz, nZ = vx * uy - vy * ux; const L = Math.hypot(nX, nY, nZ) || 1, h = half[g] * outSign / L;
      nX *= h; nY *= h; nZ *= h;
      pos[3 * g] = mid[3 * g] + nX; pos[3 * g + 1] = mid[3 * g + 1] + nY; pos[3 * g + 2] = mid[3 * g + 2] + nZ;
      const q = inner[g]; if (q !== g) { pos[3 * q] = mid[3 * g] - nX; pos[3 * q + 1] = mid[3 * g + 1] - nY; pos[3 * q + 2] = mid[3 * g + 2] - nZ; }
    }
    pa.needsUpdate = true; geo.computeVertexNormals();
    stat.ms = stat.ms * 0.9 + (now() - t0) * 0.1;
  }
  // the (v x u) normal's sign that points away from him at rest
  let outSign = 1;
  { const a = 3 * Math.floor(nx / 2), b = a + 3, c = a + 3 * nx;
    const ux = rest[b] - rest[a], uy = rest[b + 1] - rest[a + 1], uz = rest[b + 2] - rest[a + 2], vx = rest[c] - rest[a], vy = rest[c + 1] - rest[a + 1], vz = rest[c + 2] - rest[a + 2];
    const n0 = vy * uz - vz * uy, n2 = vx * uy - vy * ux; outSign = n0 * rest[a] + n2 * rest[a + 2] >= 0 ? 1 : -1; }
  return { part, update, cloth, world, stat };
}
// ===== end CAPES ============================================================================================

// ============================================================================================================
// ===== SMALL PARTS (designer SMALL PARTS) ===================================================================
// A strand is a spudphys spring-bone chain (A.chain: bones never stretch, each joint pulled toward where it would be if
// the strand were rigid, so a curled jester point keeps its curl and a feather keeps its sweep) drawn as a tapered,
// ink-outlined tube with an optional thing on its tip (a bell, a bobble, a pompom). The root rides a point on his
// DEFORMED surface (so it squashes, leans and breathes with him); the rest of it lags a beat behind: it swings when he
// waddles, flings out when he spins, lifts when he falls, slaps down when he lands, and settles when he stands still.
// It collides with HIS shape (KIT rx/rz profiles, squash + lean included, a pad for the clothes) and keeps off his face
// (a wedge in front of his face it is turned out of), and off the floor.
//
//   const S = strands(H, [ { at, path, r, color, stiff, drag, grav, tip, flat, ink, sides } ... ])
//   parts: [..., S.group]        update(K, dt, t) { ...; S.update(K, dt, t); }
//
//   at    : [t, th, out] a point on his surface (t = height from his top 0..1, th = round him, 0 = his front, out = how
//           far out from it) — or [x, y, z] in body space with `fixed: true` — or a function H => [x, y, z] (body space)
//   path  : the rest shape: joint offsets from the root in body space ([0,0,0] first), any number >= 2
//   shape : optional f => radius along it (f 0 root .. 1 tip), e.g. a leaf-shaped bandana tail; r[1] still sizes the tip dome
//   r     : [r0, r1] tube radius at root / tip         flat: 1 = round, 0.35 = a ribbon (bandana tails)
//   stiff : 0..1 how hard it holds its rest shape (0.9 a jester point, 0.4 a cord)    drag: air (2.5)   grav (1)
//   tip   : (T, H) => Object3D, hung on the last joint, turned along the last bone (its -y points down the strand)
//   swing : leash, how far a joint may stray from its rest place, x its distance along the strand (0.55)
//   from  : first joint that collides with him (2: the joint by the root may sit inside his hat / clothes)
//   tube  : false = no tube drawn, just the spring: api.turn(i, quat) rotates a rigid piece (a feather) the way it swung
//   half  : 'bottom' when it belongs to the bottom half (wardrobe/cut.mjs keeps it with the bottom), else top
//
// Cost (measured in the wardrobe, see BOARD.md): ~0.05-0.1 ms per strand per frame.

const SP_STEP = 1 / 60, SP_PAD = 0.032;   // his clothes stand proud of him by up to ~0.04 (puff): strands keep this far out

// a point on his deformed surface (raw arrays, no allocation): t from his top, th round him (0 = front), out = pushed out
function spSurfPoint(H, t, th, out, o) {
  const P = H.surf(), C = H.COLS + 1, row = Math.max(0, Math.min(H.ROWS, Math.round((t - 0.012) / 0.976 * H.ROWS)));
  let col = Math.round((th + Math.PI) / (2 * Math.PI) * H.COLS); col = ((col % H.COLS) + H.COLS) % H.COLS;
  const k = (row * C + col) * 3, a = (row * C) * 3, b = (row * C + (H.COLS >> 1)) * 3, c = (row * C + (H.COLS >> 2)) * 3, d = (row * C + (3 * H.COLS >> 2)) * 3;
  const cx = (P[a] + P[b] + P[c] + P[d]) / 4, cz = (P[a + 2] + P[b + 2] + P[c + 2] + P[d + 2]) / 4;
  let dx = P[k] - cx, dz = P[k + 2] - cz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  o[0] = P[k] + dx * out; o[1] = P[k + 1]; o[2] = P[k + 2] + dz * out; return o;
}

export function strands(H, list, opt = {}) {
  const T = H.T, group = new T.Group(), half = opt.half;
  if (half) group.userData.half = half;
  const world = new World({ seed: 7, gravity: [0, -(opt.gravity ?? 9.8), 0] });
  const M = new Float64Array(16), Q = new Float64Array(4), V3 = [0, 0, 0], tmpQ = new T.Quaternion(), tmpM = new T.Matrix4();
  const SS = list.map((s, si) => {
    const n = s.path.length, drv = world.driver('strand' + si, { teleport: 0.6 });
    const ch = A.chain(world, { root: drv, joints: s.path, stiffness: s.stiff ?? 0.6, drag: s.drag ?? 2.5, gravity: s.grav ?? 1,
      radius: s.r ? s.r[0] : 0.02, substeps: 4, name: 'strand' + si });
    // --- the tube: (n-1)*SUB+1 rings of `sides` points + a rounded tip (3 rings + the pole) ---
    const SUB = 4, R = s.sides || 8, NR = (n - 1) * SUB + 1, TIPR = 3, NV = (NR + TIPR) * R + 1, g = new T.BufferGeometry();
    const pos = new Float32Array(NV * 3), nor = new Float32Array(NV * 3), idx = [];
    for (let i = 0; i < NR + TIPR - 1; i++) for (let j = 0; j < R; j++) { const a = i * R + j, b = i * R + (j + 1) % R, c = a + R, d = b + R; idx.push(a, b, c, b, d, c); }
    const pole = NV - 1; for (let j = 0; j < R; j++) { const a = (NR + TIPR - 1) * R + j, b = (NR + TIPR - 1) * R + (j + 1) % R; idx.push(a, b, pole); }
    g.setIndex(idx); g.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('normal', new T.BufferAttribute(nor, 3).setUsage(T.DynamicDrawUsage));
    if (s.tube !== false) group.add(H.outlined(g, H.paint(s.color || '#c03030'), s.ink ?? 0.8));   // (tube: false = a spring only, see turn())
    const tip = s.tip ? s.tip(T, H) : null; if (tip) group.add(tip);
    const al = [0]; for (let i = 1; i < n; i++) { const a = s.path[i - 1], b = s.path[i]; al.push(al[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
    return { s, n, drv, ch, g, pos, nor, SUB, R, NR, TIPR, tip, along: al, J: new Float64Array(n * 3),
      C: new Float64Array(NR * 3), anchor: [0, 0, 0] };
  });
  world.finalize();
  // his outline, felt by every particle of every strand (body space, his squash + lean)
  const S = H.S, rxF = H.rx, rzF = H.rz, FH = H.FOOT_H;
  let face = opt.face !== false;
  const keepOff = (x, y, z, rad, o) => {   // -> o = pushed point (body space); returns o
    const s = S.squash.x, inv = 1 / Math.sqrt(Math.max(0.3, s)), y0 = FH * 0.6 + (y - FH * 0.6) / s, t = 1 + FH - y0, hgt = 1 - t;
    o[0] = x; o[1] = y; o[2] = z;
    if (t < 0.005 || t > 0.995) return o;
    const sw = 1 + (inv - 1) * Math.sin(Math.PI * Math.min(1, hgt * 1.1)) * 1.4, ox = S.leanX.x * hgt * hgt, oz = S.leanZ.x * hgt * hgt;
    const ax = rxF(t) * sw + SP_PAD + rad, az = rzF(t) * sw + SP_PAD + rad;
    let lx = x - ox, lz = z - oz;
    // his face: a wedge in front of it (t 0.2..0.74, within ~50 deg of his front) that strands are turned out of, round
    // the side they came from (so a tail never lies across his eyes or mouth)
    if (face && lz > 0 && t > 0.2 && t < 0.74) { const ang = Math.atan2(lx, lz), FA = 0.9;
      if (Math.abs(ang) < FA && (lx / (ax * 1.5)) ** 2 + (lz / (az * 1.5)) ** 2 < 1) { const r = Math.hypot(lx, lz), a2 = (ang < 0 ? -FA : FA);
        lx = r * Math.sin(a2); lz = r * Math.cos(a2); } }
    const e = (lx / ax) ** 2 + (lz / az) ** 2;
    if (e < 1) { const k = 1 / Math.sqrt(Math.max(1e-6, e)); lx *= k; lz *= k; }
    o[0] = lx + ox; o[2] = lz + oz; return o;
  };
  // world <-> body (spud) space: M = his world matrix (rotation + translation, no scale)
  const toBody = (X, i, o) => { const x = X[i] - M[12], y = X[i + 1] - M[13], z = X[i + 2] - M[14];
    o[0] = M[0] * x + M[1] * y + M[2] * z; o[1] = M[4] * x + M[5] * y + M[6] * z; o[2] = M[8] * x + M[9] * y + M[10] * z; return o; };
  const toWorld = (b, X, i) => { X[i] = M[0] * b[0] + M[4] * b[1] + M[8] * b[2] + M[12]; X[i + 1] = M[1] * b[0] + M[5] * b[1] + M[9] * b[2] + M[13];
    X[i + 2] = M[2] * b[0] + M[6] * b[1] + M[10] * b[2] + M[14]; };
  const B = [0, 0, 0], O = [0, 0, 0];
  for (const st of SS) st.ch.body.collide = (w) => {
    const X = w.x, p0 = st.ch.body.p0, rr = st.s.r ? st.s.r[0] : 0.02, m = st.drv.m, dp = st.drv.pos, sw = st.s.swing ?? 0.55;
    // a leash: no joint strays further from its rest place than `swing` x its distance along the strand (a spin or a
    // sharp turn flings it out, it never whips round into a tangle)
    for (let i = 1; i < st.n; i++) { const o = 3 * (p0 + i), l = st.s.path[i], lim = sw * st.along[i];
      const gx = dp[0] + m[0] * l[0] + m[3] * l[1] + m[6] * l[2], gy = dp[1] + m[1] * l[0] + m[4] * l[1] + m[7] * l[2], gz = dp[2] + m[2] * l[0] + m[5] * l[1] + m[8] * l[2];
      const dx = X[o] - gx, dy = X[o + 1] - gy, dz = X[o + 2] - gz, d = Math.hypot(dx, dy, dz);
      if (d > lim) { const k = lim / d; X[o] = gx + dx * k; X[o + 1] = gy + dy * k; X[o + 2] = gz + dz * k; } }
    for (let i = st.s.from ?? 2; i < st.n; i++) { const o = 3 * (p0 + i);
      toBody(X, o, B); keepOff(B[0], B[1], B[2], rr * 0.7, O);
      if (O[0] !== B[0] || O[2] !== B[2]) toWorld(O, X, o);
      if (X[o + 1] < 0.015) X[o + 1] = 0.015; }   // the floor
  };
  const anchorOf = (st, o) => { const a = st.s.at;
    if (typeof a === 'function') { const v = a(H); o[0] = v[0]; o[1] = v[1]; o[2] = v[2]; }
    else if (st.s.fixed) { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; }
    else spSurfPoint(H, a[0], a[1], a[2] || 0, o);
    return o; };
  const drive = () => { for (const st of SS) { toWorld(st.anchor, V3, 0); st.drv.set([V3[0], V3[1], V3[2]], Q); } };
  let acc = 0, lastT = null, begun = false;
  const api = { group, world, strands: SS, ms: 0,   // (ms: smoothed cost per frame; also listed in STATS under opt.name)
    update(K, dt, time) {
      const sp = group.parent; if (!sp) return;   // (the wardrobe's cut dropped this half)
      const t0 = performance.now();
      sp.updateMatrix(); if (sp.parent) { sp.parent.updateMatrixWorld(); tmpM.multiplyMatrices(sp.parent.matrixWorld, sp.matrix); } else tmpM.copy(sp.matrix);
      const e = tmpM.elements; for (let i = 0; i < 16; i++) M[i] = e[i];
      tmpQ.setFromRotationMatrix(tmpM); Q[0] = tmpQ.x; Q[1] = tmpQ.y; Q[2] = tmpQ.z; Q[3] = tmpQ.w;
      for (const st of SS) anchorOf(st, st.anchor);
      // a still (the sheet tool's frame(0): same time again) or the first frame: put every strand on its rest shape
      const still = !begun || time === lastT || !(dt > 0);
      if (!begun) { world.begin(() => drive()); begun = true; acc = 0; }
      if (still) { drive(); for (const d of world.drivers) { d.prev.set(d.next.subarray(0, 7)); d.prev[7] = 1; d.hasNext = false; }
        world._invalidatePoses(); for (const b of world.bodies) world.parkBody(b, 0); acc = 0; }
      else { acc += Math.min(dt, 0.1); let k = 0; while (acc >= SP_STEP && k < 3) { world.step(drive); acc -= SP_STEP; k++; } if (k === 3) acc = 0; }
      lastT = time;
      for (const st of SS) draw(st);
      api.ms = api.ms * 0.95 + (performance.now() - t0) * 0.05;
    } };
  // --- the tube along the joints (Catmull-Rom through them), parallel-transport rings, analytic normals ---
  const tg = [0, 0, 1], nm = [1, 0, 0], bn = [0, 1, 0];
  function draw(st) {
    const X = world.x, p0 = st.ch.body.p0, n = st.n, J = st.J, C = st.C, SUB = st.SUB, R = st.R, pos = st.pos, nor = st.nor;
    for (let i = 0; i < n; i++) { toBody(X, 3 * (p0 + i), B); J[3 * i] = B[0]; J[3 * i + 1] = B[1]; J[3 * i + 2] = B[2]; }
    if (st.s.tube === false) return;
    const P = (i, c) => J[3 * Math.max(0, Math.min(n - 1, i)) + c];
    for (let i = 0; i < n - 1; i++) for (let u = 0; u < SUB; u++) { const t = u / SUB, t2 = t * t, t3 = t2 * t, q = (i * SUB + u) * 3;
      for (let c = 0; c < 3; c++) { const a = P(i - 1, c), b = P(i, c), cc = P(i + 1, c), d = P(i + 2, c);
        C[q + c] = 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3); } }
    for (let c = 0; c < 3; c++) C[(st.NR - 1) * 3 + c] = J[(n - 1) * 3 + c];
    const r0 = st.s.r ? st.s.r[0] : 0.02, r1 = st.s.r ? st.s.r[1] : r0 * 0.5, fl = st.s.flat ?? 1;
    // first frame: a normal perpendicular to the first tangent, the flat side facing out from his body
    let first = true;
    for (let i = 0; i < st.NR; i++) {
      const a = Math.max(0, i - 1), b = Math.min(st.NR - 1, i + 1);
      let tx = C[b * 3] - C[a * 3], ty = C[b * 3 + 1] - C[a * 3 + 1], tz = C[b * 3 + 2] - C[a * 3 + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (first) { // flat ribbons lie on him: their wide side faces out from his axis
        let ox = C[0], oz = C[2]; const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
        // binormal = outward x tangent ... normal = tangent x binormal
        let bx = -oz * ty, by = oz * tx - ox * tz, bz = ox * ty;
        let bl = Math.hypot(bx, by, bz); if (bl < 1e-4) { bx = 0; by = 1; bz = 0; bl = 1; } bn[0] = bx / bl; bn[1] = by / bl; bn[2] = bz / bl;
        nm[0] = bn[1] * tz - bn[2] * ty; nm[1] = bn[2] * tx - bn[0] * tz; nm[2] = bn[0] * ty - bn[1] * tx; first = false;
      } else { // parallel transport: take the old normal off the new tangent
        const d = nm[0] * tx + nm[1] * ty + nm[2] * tz; nm[0] -= d * tx; nm[1] -= d * ty; nm[2] -= d * tz; const l = Math.hypot(nm[0], nm[1], nm[2]) || 1; nm[0] /= l; nm[1] /= l; nm[2] /= l;
        bn[0] = ty * nm[2] - tz * nm[1]; bn[1] = tz * nm[0] - tx * nm[2]; bn[2] = tx * nm[1] - ty * nm[0]; }
      tg[0] = tx; tg[1] = ty; tg[2] = tz;
      const f = i / (st.NR - 1), r = st.s.shape ? st.s.shape(f) : r0 + (r1 - r0) * Math.pow(f, 0.85);
      for (let j = 0; j < R; j++) { const an = j / R * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), k = (i * R + j) * 3;
        const ex = nm[0] * cs * fl + bn[0] * sn, ey = nm[1] * cs * fl + bn[1] * sn, ez = nm[2] * cs * fl + bn[2] * sn;   // (flat: thin out from him, wide along him)
        pos[k] = C[i * 3] + ex * r; pos[k + 1] = C[i * 3 + 1] + ey * r; pos[k + 2] = C[i * 3 + 2] + ez * r;
        const nx = nm[0] * cs + bn[0] * sn * fl, ny = nm[1] * cs + bn[1] * sn * fl, nz = nm[2] * cs + bn[2] * sn * fl, nl = Math.hypot(nx, ny, nz) || 1;
        nor[k] = nx / nl; nor[k + 1] = ny / nl; nor[k + 2] = nz / nl; }
    }
    // the rounded tip: a little dome past the last ring
    const L = (st.NR - 1) * 3;
    for (let h = 1; h <= st.TIPR; h++) { const a = h / (st.TIPR + 1) * Math.PI / 2, cr = Math.cos(a) * r1, ad = Math.sin(a) * r1, i = st.NR - 1 + h;
      for (let j = 0; j < R; j++) { const an = j / R * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an), k = (i * R + j) * 3;
        const ex = nm[0] * cs * fl + bn[0] * sn, ey = nm[1] * cs * fl + bn[1] * sn, ez = nm[2] * cs * fl + bn[2] * sn;
        pos[k] = C[L] + ex * cr + tg[0] * ad; pos[k + 1] = C[L + 1] + ey * cr + tg[1] * ad; pos[k + 2] = C[L + 2] + ez * cr + tg[2] * ad;
        const ca = Math.cos(a), sa = Math.sin(a); nor[k] = ex * ca + tg[0] * sa; nor[k + 1] = ey * ca + tg[1] * sa; nor[k + 2] = ez * ca + tg[2] * sa; } }
    { const k = (st.g.attributes.position.count - 1) * 3; pos[k] = C[L] + tg[0] * r1; pos[k + 1] = C[L + 1] + tg[1] * r1; pos[k + 2] = C[L + 2] + tg[2] * r1; nor[k] = tg[0]; nor[k + 1] = tg[1]; nor[k + 2] = tg[2]; }
    st.g.attributes.position.needsUpdate = true; st.g.attributes.normal.needsUpdate = true;
    if (st.tip) { const e = (n - 1) * 3, d = (n - 2) * 3; st.tip.position.set(J[e], J[e + 1], J[e + 2]);
      if (st.s.tipUp) st.tip.quaternion.identity();
      else { const vx = J[e] - J[d], vy = J[e + 1] - J[d + 1], vz = J[e + 2] - J[d + 2], vl = Math.hypot(vx, vy, vz) || 1;
        st.tip.quaternion.setFromUnitVectors(DOWN, TMPV.set(vx / vl, vy / vl, vz / vl)); } }
  }
  const DOWN = new T.Vector3(0, -1, 0), TMPV = new T.Vector3();
  // a strand with tube: false is just a spring: turn(i, q) gives the body-space rotation that takes its rest line (root to
  // last joint) onto where it swung to, to put on a rigid piece pivoting at its root (a feather, a plume, a pompom)
  const RV = new T.Vector3(), CV = new T.Vector3();
  api.turn = (i, q) => { const st = SS[i], p = st.s.path, n = st.n, J = st.J, e = 3 * (n - 1);
    RV.set(p[n - 1][0] - p[0][0], p[n - 1][1] - p[0][1], p[n - 1][2] - p[0][2]).normalize();
    CV.set(J[e] - J[0], J[e + 1] - J[1], J[e + 2] - J[2]); if (CV.lengthSq() < 1e-12) return q.identity();
    return q.setFromUnitVectors(RV, CV.normalize()); };
  STATS.pieces.set(opt.name || 'strands', api);
  return api;
}

// a rest path from a few design points: resampled along a smooth curve into n joints, as offsets from the first
export function along(T, pts, n = 6) {
  const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))), o = c.getPointAt(0), r = [];
  for (let i = 0; i < n; i++) { const q = c.getPointAt(i / (n - 1)); r.push([q.x - o.x, q.y - o.y, q.z - o.z]); }
  return r;
}

// tip makers (plain shapes, ink-outlined like everything else). Each hangs from its origin along -y.
export const tips = {
  // a brass jingle bell: a ball with its slot, sound hole and a glint
  bell: (s = 0.05, col = '#f2b928') => (T, H) => { const b = new T.Group(), k = new T.Group(); k.position.y = -s * 0.75; b.add(k);
    k.add(H.outlined(new T.SphereGeometry(s, 16, 12), H.paint(col), 0.6));
    const slot = new T.Mesh(new T.TorusGeometry(s, s * 0.07, 6, 28), new T.MeshBasicMaterial({ color: '#120a05' })); slot.rotation.x = Math.PI / 2; slot.position.y = -s * 0.15; k.add(slot);
    const hole = new T.Mesh(new T.SphereGeometry(s * 0.22, 10, 8), new T.MeshBasicMaterial({ color: '#120a05' })); hole.position.y = -s * 0.9; k.add(hole);
    const gl = new T.Mesh(new T.SphereGeometry(s * 0.22, 10, 8), new T.MeshBasicMaterial({ color: '#fffbe0' })); gl.position.set(-s * 0.45, s * 0.45, s * 0.6); gl.scale.z = 0.4; k.add(gl);
    return b; },
  // a round bobble (antenna ball, pompom) sitting ON the end, with a glint
  // (off: how far past the end its centre sits, in ball sizes: 0.7 hangs it on the end, 0 centres it there: use 0 with tipUp)
  ball: (s = 0.05, col = '#4cc35a', glint = '#ffffff', glow = false, off = 0.7) => (T, H) => { const b = new T.Group(), k = new T.Group(); k.position.y = -s * off; b.add(k);
    k.add(H.outlined(new T.SphereGeometry(s, 18, 12), glow ? new T.MeshBasicMaterial({ color: col }) : H.paint(col), 0.6));
    const gl = new T.Mesh(new T.SphereGeometry(s * 0.28, 10, 8), new T.MeshBasicMaterial({ color: glint })); gl.position.set(-s * 0.4, s * 0.4, s * 0.62); gl.scale.z = 0.4; k.add(gl);
    return b; },
};
// ===== end SMALL PARTS ======================================================================================

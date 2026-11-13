// body.mjs — his body in the world: one rigid body per Potato, six numbers each (x, y, roll and their speeds).
// A sack of wet sand: heavy fall, low bounce, does not roll far, and does NOT right himself. He lies where he stops (the
// flop); getting up is acting, not physics. Numbers: data/physics.json. Equations first run in tools/throw_numbers.mjs.
//
// modes   ground  moves own him (he is a still collider)        held   a holder owns him + the pendulum
//         free    physics owns him                              clip   one clip owns him (kinematic)
//         down    nobody: he lies where physics left him        gone   he is in the 404
//
// release(slot, v, spin, by) is ONE function: your hand calls it, a Potato throwing a Potato calls it.
// No allocation inside step() except when something actually happens (a contact event).
// Game-feel and physics engineer (seat 3), carried from Dead Weight's design.
import { DT, HZ } from './clock.mjs';

export const MODE = { ground: 0, held: 1, free: 2, clip: 3, down: 4, gone: 5 };
export const MODE_NAME = ['ground', 'held', 'free', 'clip', 'down', 'gone'];
const TAU = Math.PI * 2;
export const wrapPi = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

export function createBody({ physics: J, room, clock, emit, max = 5 }) {
  const B = J.body, C = J.contact, G = J.grab, E = J.exits, SH = J.shove, GR = J.grudge, RT = J.root || {};
  const R = B.radius, kI = B.inertia_factor, A = B.half_height || R, W = B.half_width || R, PR = B.potato_contact_radius || R;
  const SUB = J.units.substeps, h = DT / SUB, COM = (B.centre_of_mass_from_feet || 0.5) - A;   // centre of mass, below his middle
  const K2 = kI * R * R, PEND = G.pendulum_omega * G.pendulum_omega * 2 * Math.sqrt(K2) / B.gravity;   // scales real pendulum maths so its fastest swing is pendulum_omega
  const N = max;
  const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), th = new Float64Array(N), w = new Float64Array(N);
  const mass = new Float64Array(N).fill(B.mass), mode = new Uint32Array(N), alive = new Uint8Array(N);
  const still = new Uint16Array(N), grounded = new Uint8Array(N), airFrames = new Uint32Array(N);
  const heat = new Float64Array(N), heatAt = new Float64Array(N), grudge = new Float64Array(N);    // DEAD WEIGHT
  const press = new Float64Array(N), pressNx = new Float64Array(N), pressNy = new Float64Array(N); // held against an edge: how deep, which way
  const strain = new Float64Array(N), strainX = new Float64Array(N);                              // ROOTED: 0..1 pull while his feet hold on
  const freeze = new Uint8Array(N);   // contact hold: frames the surface keeps him before he comes off it
  const touch = new Uint8Array(N);    // pushed by another Potato this step (a contact for the judge, too soft to be an event)
  const lastHit = new Float64Array(N);                                                             // speed of the hardest contact since he left the ground
  const firstDone = new Uint8Array(N), thrownBy = new Array(N).fill(null);
  const flipL = new Float32Array(N);                                                               // FLIP (Nov 13): radians of a flip still to turn, inside a jump of his own
  const hop = new Uint8Array(N);                                                                   // YOU DRIVE (Nov 12): 1 while he is in a jump of his own; he holds himself upright, so he lands on his feet
  const hold = Array.from({ length: N }, () => ({ holder: null, gx: 0, gy: 0, hx: 0, hy: 0, hvx: 0, hvy: 0, om: 0, root: 0, px: 0, py: 0 }));
  const ev = [];   // contacts of this step, flushed after the solve
  let crackSpeed = E.crack_speed, holeSpeed = E.hole_speed; const throwLog = [];

  // how far his outline reaches from his centre along a world direction (taller than wide)
  function sup(i, nx, ny) { const c = Math.cos(th[i]), s = Math.sin(th[i]), lx = nx * c + ny * s, ly = -nx * s + ny * c; return Math.sqrt(W * W * lx * lx + A * A * ly * ly); }

  function plane(i, qx, qy, nx, ny, e, surface, sv) {
    const r = sup(i, nx, ny), pen = r - ((x[i] - qx) * nx + (y[i] - qy) * ny); if (pen <= 0) return;
    x[i] += nx * pen; y[i] += ny * pen;
    const vn = vx[i] * nx + vy[i] * ny - sv; if (ny > 0.7) grounded[i] = 1; if (vn >= 0) return;
    const tx = ny, ty = -nx, vt = vx[i] * tx + vy[i] * ty + w[i] * R;
    const ee = -vn < C.rest_speed ? 0 : e, jn = -(1 + ee) * vn; if (-vn > 0.15) touch[i] = 1;   // more than resting on it: a contact for the judge
    let jt = -vt / (1 + 1 / kI); const lim = C.friction * jn; if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
    if (-vn > C.impact_event_min_speed) ev.push({ slot: i, surface, nx, ny, speedInto: -vn, x: x[i] - nx * r, y: y[i] - ny * r, vx: vx[i], vy: vy[i], spin: w[i], other: -1 });
    if (-vn >= (C.hold_min_speed || 1e9)) freeze[i] = Math.max(freeze[i], Math.min(C.hold_frames_max, 1 + Math.round(-vn / C.hold_per_speed)));   // the faster he hits, the longer the surface keeps him
    vx[i] += jn * nx + jt * tx; vy[i] += jn * ny + jt * ty; w[i] += jt / (kI * R);
  }

  function pair(i, j) {
    const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy, rs = 2 * PR; if (d2 >= rs * rs || d2 < 1e-12) return;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, mi = mode[i], mj = mode[j];
    const vn = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny;
    // a standing or lying Potato is a wall until he is hit hard enough to be knocked loose (bowling is free)
    const loose = k => mode[k] === MODE.free, hard = -vn > SH.goes_free_above;
    let wi = loose(i) ? 1 / mass[i] : (hard && (mi === MODE.ground || mi === MODE.down)) ? 1 / mass[i] : 0;
    let wj = loose(j) ? 1 / mass[j] : (hard && (mj === MODE.ground || mj === MODE.down)) ? 1 / mass[j] : 0;
    if (wi + wj === 0) return;
    const pen = rs - d, s = pen / (wi + wj); void mi; void mj; x[i] -= nx * s * wi; y[i] -= ny * s * wi; x[j] += nx * s * wj; y[j] += ny * s * wj;
    if (ny > 0.7 && (!loose(i) || grounded[i])) grounded[j] = 1; else if (ny < -0.7 && (!loose(j) || grounded[j])) grounded[i] = 1;   // one resting on another
    if (vn >= 0) return;
    const e = -vn < C.rest_speed ? 0 : C.restitution_potato, jn = -(1 + e) * vn / (wi + wj); if (-vn > 0.15) { touch[i] = 1; touch[j] = 1; }
    const tx = ny, ty = -nx, vt = (vx[j] - vx[i]) * tx + (vy[j] - vy[i]) * ty - (w[i] + w[j]) * PR;
    let jt = -vt / ((wi + wj) * (1 + 1 / kI)); const lim = C.friction_potato * jn; if (jt > lim) jt = lim; else if (jt < -lim) jt = -lim;
    if (-vn > C.impact_event_min_speed) {
      ev.push({ slot: i, surface: 'potato', nx, ny, speedInto: -vn, x: x[i] + nx * PR, y: y[i] + ny * PR, vx: vx[i], vy: vy[i], spin: w[i], other: j });
      ev.push({ slot: j, surface: 'potato', nx: -nx, ny: -ny, speedInto: -vn, x: x[i] + nx * PR, y: y[i] + ny * PR, vx: vx[j], vy: vy[j], spin: w[j], other: i });
    }
    for (const k of [i, j]) if (!loose(k) && (k === i ? wi : wj) > 0) setMode(k, MODE.free, 'knocked');
    vx[i] -= (jn * nx + jt * tx) * wi; vy[i] -= (jn * ny + jt * ty) * wi; vx[j] += (jn * nx + jt * tx) * wj; vy[j] += (jn * ny + jt * ty) * wj;
    w[i] -= jt * wi / (kI * PR); w[j] -= jt * wj / (kI * PR);
  }

  function setMode(i, m, why) {
    if (mode[i] === m) return; const from = mode[i]; mode[i] = m;
    if (m === MODE.free) { still[i] = 0; airFrames[i] = 0; if (from !== MODE.held) { firstDone[i] = 1; lastHit[i] = 0; } }
    if (m !== MODE.free && m !== MODE.held) { vx[i] = vy[i] = w[i] = 0; }
    if (m !== MODE.free) { hop[i] = 0; if (flipL[i]) { flipL[i] = 0; th[i] = 0; } }                                                                // the jump is over the moment he lands or is caught
    emit('mode', { slot: i, from: MODE_NAME[from], to: MODE_NAME[m], why: why || '' });
  }

  function mfactor(i) { return 1 + (J.deadWeight ? GR.mass_per_point * grudge[i] : 0); }

  function stepHeld(i) {
    const H = hold[i], hp = H.holder.pos(), mf = mfactor(i), sag = J.deadWeight ? GR.sag_bh_per_point * grudge[i] : 0;
    const tx = hp[0], ty = hp[1] - sag, a = 1 - Math.pow(0.5, h / (G.follow_halflife_ms / 1000));
    if (H.root > 0) {                                   // ROOTED: his feet hold on; the pull shows as stretch, not travel
      H.hx += (tx - H.hx) * (1 - Math.pow(0.5, DT / (G.follow_halflife_ms / 1000))); H.hy += (ty - H.hy) * (1 - Math.pow(0.5, DT / (G.follow_halflife_ms / 1000)));
      const c = Math.cos(th[i]), s = Math.sin(th[i]), gwx = x[i] + H.gx * c - H.gy * s, gwy = y[i] + H.gx * s + H.gy * c;
      const pull = Math.hypot(H.hx - gwx, H.hy - gwy); strain[i] = Math.min(1, pull / RT.free_at_pull_bh); strainX[i] = Math.max(-1, Math.min(1, (H.hx - gwx) / RT.free_at_pull_bh));
      H.root--; vx[i] = vy[i] = w[i] = 0;
      if (strain[i] >= 1 || H.root <= 0) { H.root = 0; H.hx = gwx; H.hy = gwy; H.hvx = H.hvy = 0; H.px = x[i]; H.py = y[i]; emit('uprooted', { slot: i, strain: strain[i] }); }
      return;
    }
    strain[i] *= 0.6; if (strain[i] < 1e-3) strain[i] = 0;
    const L2 = (H.gx) * (H.gx) + (H.gy - COM) * (H.gy - COM), L = Math.sqrt(L2), gain = PEND / (K2 + L2) / mf, wn = Math.sqrt(Math.max(1e-6, gain * B.gravity * L));
    for (let s = 0; s < SUB; s++) {
      const nvx = (tx - H.hx) * a / h, nvy = (ty - H.hy) * a / h, ax = (nvx - H.hvx) / h, ay = (nvy - H.hvy) / h;
      H.hvx = nvx; H.hvy = nvy; H.hx += nvx * h; H.hy += nvy * h;
      // handle -> centre of mass, in the world; torque from gravity and from the handle's own acceleration
      const c = Math.cos(th[i]), sn = Math.sin(th[i]), lx = -H.gx, ly = COM - H.gy, cx = lx * c - ly * sn, cy = lx * sn + ly * c;
      const dr = G.pendulum_drive == null ? 1 : G.pendulum_drive, gxe = -dr * Math.max(-90, Math.min(90, ax)), gye = -B.gravity - dr * Math.max(-90, Math.min(90, ay));
      let al = gain * (cx * gye - cy * gxe) - 2 * G.pendulum_damping_ratio * wn * H.om;
      const over = Math.abs(th[i]) - G.pendulum_max_roll; if (over > 0) al += -Math.sign(th[i]) * (140 * over) - 9 * H.om * (Math.sign(H.om) === Math.sign(th[i]) ? 1 : 0);   // a soft stop: he never hangs upside down
      H.om += al * h; if (H.om > B.max_spin) H.om = B.max_spin; else if (H.om < -B.max_spin) H.om = -B.max_spin; th[i] += H.om * h;
    }
    const c = Math.cos(th[i]), sn = Math.sin(th[i]); let nx_ = H.hx - (H.gx * c - H.gy * sn), ny_ = H.hy - (H.gx * sn + H.gy * c);
    // pressed against an edge while held: the wall wins, and how far your hand is past it is the press
    let pd = 0, pnx = 0, pny = 0, d;
    d = room.left + sup(i, 1, 0) - nx_; if (d > 0) { nx_ += d; if (d > pd) { pd = d; pnx = 1; pny = 0; } }
    d = nx_ - (room.right - sup(i, -1, 0)); if (d > 0) { nx_ -= d; if (d > pd) { pd = d; pnx = -1; pny = 0; } }
    d = room.floor + sup(i, 0, 1) - ny_; if (d > 0) { ny_ += d; if (d > pd) { pd = d; pnx = 0; pny = 1; } }
    d = ny_ - (room.ceiling - sup(i, 0, -1)); if (d > 0) { ny_ -= d; if (d > pd) { pd = d; pnx = 0; pny = -1; } }
    press[i] = pd; pressNx[i] = pnx; pressNy[i] = pny;
    vx[i] = (nx_ - H.px) * HZ; vy[i] = (ny_ - H.py) * HZ; w[i] = H.om; x[i] = nx_; y[i] = ny_; H.px = nx_; H.py = ny_;
  }

  function stepFree() {
    for (let s = 0; s < SUB; s++) {
      for (let i = 0; i < N; i++) { if (!alive[i] || mode[i] !== MODE.free || freeze[i] > 0) continue;
        grounded[i] = 0; vy[i] -= B.gravity * h; const d = 1 - B.air_drag_per_s * h; vx[i] *= d; vy[i] *= d;
        const sp = Math.hypot(vx[i], vy[i]); if (sp > B.max_speed) { vx[i] *= B.max_speed / sp; vy[i] *= B.max_speed / sp; }
        if (w[i] > B.max_spin) w[i] = B.max_spin; else if (w[i] < -B.max_spin) w[i] = -B.max_spin;
        if (hop[i]) { w[i] = 0; if (flipL[i]) { const d = Math.sign(flipL[i]) * Math.min(Math.abs(flipL[i]), 15 * h); th[i] += d; flipL[i] -= d; if (!flipL[i]) th[i] -= Math.round(th[i] / (2 * Math.PI)) * 2 * Math.PI; } else th[i] *= 0.9; }                                                  // a jump is not a throw: no tumble, and any lean eases back to upright
        x[i] += vx[i] * h; y[i] += vy[i] * h; th[i] += w[i] * h;
        plane(i, 0, room.floor, 0, 1, C.restitution_floor, 'floor', room.floorV); plane(i, 0, room.ceiling, 0, -1, C.restitution_ceiling, 'ceiling', 0);
        plane(i, room.left, 0, 1, 0, C.restitution_wall, 'wall', 0); plane(i, room.right, 0, -1, 0, C.restitution_wall, 'wall', 0);
        for (const l of room.ledges) if (x[i] > l.x0 && x[i] < l.x1 && vy[i] <= 0 && y[i] - sup(i, 0, 1) > l.y - 0.2) plane(i, 0, l.y, 0, 1, C.restitution_floor, 'ledge', 0);
      }
      for (let i = 0; i < N; i++) { if (!alive[i] || mode[i] === MODE.gone || mode[i] === MODE.clip) continue;
        for (let j = i + 1; j < N; j++) { if (!alive[j] || mode[j] === MODE.gone || mode[j] === MODE.clip) continue;
          if (mode[i] !== MODE.free && mode[j] !== MODE.free) continue; pair(i, j); } }
      for (let i = 0; i < N; i++) if (alive[i] && mode[i] === MODE.free) { w[i] *= 1 - (grounded[i] ? C.roll_damping_per_s : B.spin_air_loss_per_s) * h; if (grounded[i]) vx[i] *= 1 - (C.ground_drag_per_s || 0) * h; }   // wet sand: the floor takes his travel too, not just his spin
    }
  }

  function ladder(v) { return v >= holeSpeed ? 'hole' : v >= crackSpeed ? 'crack' : v >= E.splat_speed ? 'splat' : 'bounce'; }

  const body = {
    x, y, vx, vy, th, w, mass, mode, alive, touch, press, pressNx, pressNy, strain, strainX, grudge, hold, sup, A, W, R, COM,
    add(slot, px, py, m) { alive[slot] = 1; x[slot] = px; y[slot] = py == null ? room.floor + A : py; vx[slot] = vy[slot] = th[slot] = w[slot] = 0; mass[slot] = m || B.mass; mode[slot] = MODE.ground; heat[slot] = grudge[slot] = 0; firstDone[slot] = 1; },
    remove(slot) { alive[slot] = 0; },
    modeName(slot) { return MODE_NAME[mode[slot]]; },
    setMode,
    /** holder = { pos() -> [x, y] in bh } (the cursor, or another Potato). point = where on him, in the room, bh. */
    grab(slot, holder, px, py) {
      if (!alive[slot] || mode[slot] === MODE.gone) return false;
      const H = hold[slot], c = Math.cos(th[slot]), s = Math.sin(th[slot]); let ox = px - x[slot], oy = py - y[slot];
      const far = Math.hypot(ox, oy); if (far > 0.45) { ox *= 0.45 / far; oy *= 0.45 / far; px = x[slot] + ox; py = y[slot] + oy; }   // caught on the move: the hand takes him by his nearest side and the handle eases to the cursor
      H.holder = holder; H.gx = ox * c + oy * s; H.gy = -ox * s + oy * c; H.hx = px; H.hy = py; H.hvx = H.hvy = 0; H.om = w[slot]; H.px = x[slot]; H.py = y[slot];
      H.root = (J.rooted && mode[slot] === MODE.ground) ? RT.max_frames : 0; strain[slot] = 0;
      // DEAD WEIGHT: the grudge he carries into this pick-up
      grudge[slot] = J.deadWeight ? Math.max(0, Math.min(GR.max, heat[slot] + 1 - GR.free_throws)) : 0;
      setMode(slot, MODE.held, 'grab'); emit('grab', { slot, x: px, y: py, grudge: grudge[slot] }); return true;
    },
    /** ONE function for your hand and for a Potato. v in bh/s. spin null = work it out from where he was held. */
    release(slot, v, spin, by = 'user') {
      if (mode[slot] !== MODE.held) return false;
      const H = hold[slot]; let rvx = v.vx || 0, rvy = v.vy || 0; const rooted = H.root > 0;
      const gainG = J.deadWeight ? Math.max(GR.min_throw_gain, 1 / Math.sqrt(mfactor(slot))) : 1;
      rvx *= G.throw_gain * gainG; rvy *= G.throw_gain * gainG;
      let sp = Math.hypot(rvx, rvy);
      if (by !== 'user' && sp > E.script_potato_throw_max_speed) { const k = E.script_potato_throw_max_speed / sp; rvx *= k; rvy *= k; sp *= k; }   // only YOUR hand cracks the glass
      const thrown = sp >= G.throw_min_speed && !rooted;
      if (rooted) { H.root = 0; strain[slot] = 0; setMode(slot, MODE.ground, 'let go'); emit('dropped', { slot, by, rooted: true }); return true; }
      if (spin == null) {
        const c = Math.cos(th[slot]), s = Math.sin(th[slot]), rx = H.gx * c - (H.gy - COM) * s, ry = H.gx * s + (H.gy - COM) * c;   // centre of mass -> handle
        spin = H.om + (thrown ? G.spin_from_offset * (rx * rvy - ry * rvx) - G.spin_from_horizontal_speed * rvx * Math.min(1, Math.hypot(rx, ry) / 0.1) : 0);
      }
      if (!thrown) { rvx = vx[slot] * 0.5; rvy = Math.min(0, vy[slot] * 0.5); }
      vx[slot] = rvx; vy[slot] = rvy; w[slot] = Math.max(-B.max_spin, Math.min(B.max_spin, spin));
      firstDone[slot] = 0; lastHit[slot] = 0; thrownBy[slot] = by; H.holder = null; press[slot] = 0;
      if (thrown && by === 'user') { heat[slot] = Math.min(GR.free_throws + GR.max, heat[slot] + 1); heatAt[slot] = clock.k; }
      setMode(slot, MODE.free, 'release');
      emit(thrown ? 'thrown' : 'dropped', { slot, by, vx: rvx, vy: rvy, speed: sp, spin: w[slot], grudge: grudge[slot] }); return true;
    },
    /** a shoves b along the line between them. speed in bh/s, or a name from physics.json shove. */
    shove(a, b, speed) {
      const v = typeof speed === 'string' ? SH[speed] : speed; let dx = x[b] - x[a], dy = y[b] - y[a]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      if (v > SH.goes_free_above) { setMode(b, MODE.free, 'shoved'); vx[b] += dx * v; vy[b] += dy * v + 1.2; w[b] -= dx * v * 0.5; firstDone[b] = 1; }
      emit('shoved', { slot: b, by: a, speed: v, recoil: v * SH.recoil_fraction, nx: dx, ny: dy });
    },
    /** an impulse from anywhere (a gag, the game): puts him in physics. */
    impulse(slot, ivx, ivy, spin = 0) { setMode(slot, MODE.free, 'impulse'); vx[slot] += ivx; vy[slot] += ivy; w[slot] += spin; firstDone[slot] = 1; },
    /** his own jump (living.drive): the same flight and the same landing as anything else in the air, but he stays upright through it. */
    /** a flip, only inside a jump of his own: one whole turn, then upright again. dir: +1 | -1 */
    flip(slot, dir) { if (!hop[slot] || mode[slot] !== MODE.free || flipL[slot]) return false; flipL[slot] = (dir < 0 ? 1 : -1) * 2 * Math.PI; return true; },
    hop(slot, ivx, ivy) { setMode(slot, MODE.free, 'hop'); hop[slot] = 1; vx[slot] = ivx; vy[slot] = ivy; if (!(th[slot] === th[slot])) th[slot] = 0;   /* (= not +=: a walk's leftover speed is not his to keep; a bad lean never goes into flight. Nov 12 night) */ w[slot] = 0; firstDone[slot] = 1; },
    /** a clip takes him (splat, crack_hit, get_up): kinematic until give(). */
    claim(slot) { setMode(slot, MODE.clip, 'claim'); },
    give(slot, v) { setMode(slot, MODE.free, 'give'); if (v) { vx[slot] = v.vx || 0; vy[slot] = v.vy || 0; w[slot] = v.spin || 0; } firstDone[slot] = 1; },
    vanish(slot) { setMode(slot, MODE.gone, '404'); },
    appear(slot, px, py) { x[slot] = px; y[slot] = py == null ? room.floor + A : py; th[slot] = 0; setMode(slot, MODE.ground, 'back'); },
    /** kinematic modes: the moves decide where he is; physics just needs to know (so others can bump into him). */
    place(slot, px, py, roll, pvx = 0, pvy = 0, pw = 0) { x[slot] = px; y[slot] = py; th[slot] = roll; vx[slot] = pvx; vy[slot] = pvy; w[slot] = pw; },
    restY(slot) { return room.floor + sup(slot, 0, 1); },
    thresholds() { return { crack: crackSpeed, hole: holeSpeed, splat: E.splat_speed }; },
    /** the host hands back the first-contact speeds it saved; the thresholds learn this hand (physics.json exits.calibrate) */
    calibrate(list) { if (Array.isArray(list)) { throwLog.length = 0; for (const v of list) throwLog.push(v); } if (!E.calibrate || throwLog.length < 20) return body.thresholds();
      const s = [...throwLog].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
      crackSpeed = Math.max(E.crack_speed_bounds[0], Math.min(E.crack_speed_bounds[1], q(0.65))); holeSpeed = Math.max(E.hole_speed_bounds[0], Math.min(E.hole_speed_bounds[1], q(0.93))); return body.thresholds(); },
    throwLog,

    step() {
      ev.length = 0;
      for (let i = 0; i < N; i++) { if (!alive[i]) continue;
        if (heat[i] > 0 && clock.k - heatAt[i] >= GR.drain_s * HZ) { heat[i] -= 1; heatAt[i] = clock.k; }
        if (freeze[i] > 0) freeze[i]--;
        if (mode[i] === MODE.held) stepHeld(i);
        else if (mode[i] === MODE.ground || mode[i] === MODE.down) {           // the floor moved: gone from under him, or it lifts him
          const gap = y[i] - sup(i, 0, 1) - room.floor;
          if (gap > 0.03) setMode(i, MODE.free, 'floor gone'); }
      }
      stepFree();
      // contacts: the hardest one per Potato this step; the FIRST after a release climbs the ladder
      for (let i = 0; i < N; i++) { if (!alive[i]) continue; let best = null;
        for (const e of ev) if (e.slot === i && (!best || e.speedInto > best.speedInto)) best = e;
        if (best) { if (best.speedInto > lastHit[i]) lastHit[i] = best.speedInto;
          best.first = !firstDone[i]; best.kind = 'bounce'; best.by = thrownBy[i];
          if (best.first && best.surface !== 'potato') { firstDone[i] = 1; best.kind = ladder(best.speedInto); if (best.by === 'user') { throwLog.push(+best.speedInto.toFixed(2)); if (throwLog.length > 200) throwLog.shift(); } }
          else if (best.first) firstDone[i] = 1;
          emit('contact', best); }
        if (mode[i] === MODE.free) { airFrames[i]++;
          const quiet = grounded[i] && Math.hypot(vx[i], vy[i]) < C.stick_speed && Math.abs(w[i]) < C.stick_spin;
          still[i] = quiet ? still[i] + 1 : 0;
          // (assembly round) he may only settle ON THE FLOOR. Come to rest on another Potato's head and he rolls off the side he is nearer:
          // before this he "settled" a body height up and the lying pose put him on the floor in one frame (a 1.03 bh jump, draft1/CHECKS.md).
          if (quiet && y[i] - sup(i, 0, 1) - room.floor > 0.03) { still[i] = 0; let j = -1, bd = 1e9; for (let q = 0; q < N; q++) { if (q === i || !alive[q] || mode[q] === MODE.gone || y[q] >= y[i]) continue; const d = Math.hypot(x[q] - x[i], y[q] - y[i]); if (d < bd) { bd = d; j = q; } }
            const dir = j >= 0 && Math.abs(x[i] - x[j]) > 1e-3 ? Math.sign(x[i] - x[j]) : (i % 2 ? 1 : -1); vx[i] += dir * 0.35; w[i] -= dir * 0.25; }
          if (still[i] > C.stick_frames) { const lean = wrapPi(th[i]), up = Math.abs(lean) < (B.upright_tolerance_rad || 0.35), sp = lastHit[i];
            setMode(i, up ? MODE.ground : MODE.down, 'settled'); emit('landed', { slot: i, speed: sp, roll: lean, upright: up, by: thrownBy[i] }); thrownBy[i] = null; } }
      }
    },
    arrays() { return [x, y, vx, vy, th, w, mode, heat]; },
  };
  return body;
}

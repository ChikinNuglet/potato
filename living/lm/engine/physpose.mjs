// physpose.mjs — "pose_from_physics": what his body does BECAUSE of physics, with nobody keying it.
//   - in the air he stretches along his velocity (1 + 0.016 * speed, clamped by the canon cap)
//   - on a contact he squashes along the contact NORMAL (flat against the wall, not always top-down), through one spring
//     (stiffness 260, damping 18.7: one overshoot), amount = cap * min(1, v / 22) ^ 0.8
//   - two frames after the contact the FLESH gets the animator's jiggle (kicks into the model's own springs)
// Both stretches are kept as ONE strain tensor in the room's axes (channels lxx, lxy, lyy; log strain, volume kept), and the
// tensor is low-passed. So the stretch axis can turn from "along the throw" to "flat on the wall" with no snap, ever.
// Rule 10 of the build plan: the rig carries the squash (bone), the model's springs only get kicks (flesh).
// Game-feel and physics engineer (seat 3).
import { DT } from './clock.mjs';
import { IDX } from './channels.mjs';
import { MODE } from './body.mjs';

export function createPhysPose({ physics: J, body, channels, clock, rig, max = 5 }) {
  const SQ = J.squash, FL = J.flight, cap = SQ.cap, fcap = FL.stretch_cap == null ? cap : Math.min(cap, FL.stretch_cap);   // final round: the flight keeps its own cap (the squash ladder must not touch the arc)
  const q = new Float64Array(max), qv = new Float64Array(max), nx = new Float64Array(max), ny = new Float64Array(max).fill(1);   // impact spring + its normal
  const sup = new Float64Array(max).fill(0.5);
  const fxx = new Float64Array(max), fxy = new Float64Array(max), fyy = new Float64Array(max);                                   // flight strain, low-passed
  const lp = 1 - Math.pow(0.5, 1 / FL.stretch_halflife_f);
  const flesh = SQ.clips_may_exceed_cap ? 1 : (SQ.flesh_dip_under_cap == null ? 0.35 : SQ.flesh_dip_under_cap);   // bone + flesh together stay near the canon cap
  const pp = {
    q, nx, ny,
    reset(slot) { q[slot] = qv[slot] = fxx[slot] = fxy[slot] = fyy[slot] = 0; nx[slot] = 0; ny[slot] = 1; },
    /** a contact from body.mjs: { slot, nx, ny, speedInto } */
    contact(e) {
      const s = e.slot, amt = cap * Math.pow(Math.min(1, e.speedInto / SQ.full_at_speed), SQ.curve_power);
      if (amt < -q[s] * 0.6 && (e.nx * nx[s] + e.ny * ny[s]) < 0.7) return;      // a small tap while a big squash is still ringing: leave it
      // the squash lands ON the contact frame (an exempt frame), then the spring brings it back with one overshoot.
      // The stretch he arrived with is dropped the same frame: flat means flat.
      nx[s] = e.nx; ny[s] = e.ny; if (-amt < q[s]) q[s] = -amt; qv[s] = 0; sup[s] = body.sup(s, e.nx, e.ny);
      if (e.speedInto > 2) { fxx[s] *= 0.15; fxy[s] *= 0.15; fyy[s] *= 0.15; }
      // the flesh, two frames after the bone (moves.json secondary.jiggle)
      const v = e.speedInto, c = Math.cos(body.th[s]), sn = Math.sin(body.th[s]), upAlign = Math.abs(-sn * e.nx + c * e.ny), side = e.vx * e.ny - e.vy * e.nx;
      clock.after(2, () => { rig.kick(s, 'wob', Math.min(3.5, 0.7 * v)); if (upAlign > SQ.upright_alignment_for_model_land) rig.kick(s, 'squash', -Math.min(2.2, 0.45 * v) * flesh); rig.kick(s, 'leanX', Math.max(-2.5, Math.min(2.5, 0.9 * side * 0.2))); });
    },
    step(slot) {
      const m = body.mode[slot];
      // the impact spring always runs (it rings out after he has stopped)
      const a = -SQ.stiffness * q[slot] - SQ.damping * qv[slot]; qv[slot] += a * DT; q[slot] += qv[slot] * DT;
      if (q[slot] < -cap) q[slot] = -cap; else if (q[slot] > cap) q[slot] = cap;
      // flight stretch: only while physics owns him and he is actually travelling
      let txx = 0, txy = 0, tyy = 0;
      if (m === MODE.free) { const vx = body.vx[slot], vy = body.vy[slot], sp = Math.hypot(vx, vy);
        if (sp > 1) { const l = Math.log(1 + Math.min(fcap, FL.stretch_per_speed * (sp - 1))), dx = vx / sp, dy = vy / sp; txx = l * (1.5 * dx * dx - 0.5); txy = l * 1.5 * dx * dy; tyy = l * (1.5 * dy * dy - 0.5); } }
      fxx[slot] += (txx - fxx[slot]) * lp; fxy[slot] += (txy - fxy[slot]) * lp; fyy[slot] += (tyy - fyy[slot]) * lp;
      const l = Math.log(1 + q[slot]), ex = nx[slot], ey = ny[slot];
      channels.set(slot, IDX.lxx, fxx[slot] + l * (1.5 * ex * ex - 0.5));
      channels.set(slot, IDX.lxy, fxy[slot] + l * 1.5 * ex * ey);
      channels.set(slot, IDX.lyy, fyy[slot] + l * (1.5 * ey * ey - 0.5));
      // squashed against a surface he must still TOUCH it: slide his centre toward it by what the squash took away
      const gap = q[slot] < 0 ? q[slot] * sup[slot] : 0; channels.set(slot, IDX.cx, ex * gap); channels.set(slot, IDX.cy, ey * gap);
    },
    arrays() { return [q, qv, fxx, fxy, fyy]; },
  };
  return pp;
}

/* ░▒▓1▓▒░
EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦resu—me¦no—n—0¦EHOSTUNREACH?¦
[ENOMEM]¦un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦!?_##¦h0ld—¦0xBEEF?!¦
[ENOMEM]¦EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦0xAC1D?!¦[ENOMEM]¦[HTTP_404]¦ERR:418¦
un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EFAULT//¦[HTTP_404]¦
h0ld—¦0xDEAD_7¦EIO::?¦ERR:418¦h0ld—¦73%??¦[ENOMEM]¦EFAULT//¦[EPIPE]¦h0ld—¦42//0¦[ENOMEM]¦
EFAULT//¦EHOSTUNREACH?¦ERR:418¦[E_SNARK_OVERRUN]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦
[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EBUSY_?¦ERR:418¦h0ld—¦EHOSTUNREACH?¦EIO::?¦
ERR:418¦h0ld—¦[ETIMEDOUT]¦[HTTP_404]¦ERR:418¦0xBABE~¦[EOVERFLOW]¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦
h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦
EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦EHOSTUNREACH?¦EIO::?¦[ENETDOWN]¦
EBUSY_?¦[EOVERFLOW]¦[HTTP_404]¦0xBABE~¦ATTITUDE_CHECKSUM?!¦EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦
0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦:_:#¦0xAC1D?!¦[ENOMEM]¦[EINTR]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
think—ink…¦hmm_73?!¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦
[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦ERR:418¦EILSEQ::¦ERR:418¦EBUSY_?¦ATTITUDE_CHECKSUM?!¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦[ETIMEDOUT]¦[EOVERFLOW]¦h0ld—¦0xBABE~¦h0ld—¦
0xAC1D?!¦EAGAIN?!¦[ENOMEM]¦EFAULT//¦ERR:418¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[ECONNABORTED]¦
EIO::?¦ERR:418¦EFAULT//¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦%%/?!¦#//?!¦#//?!¦%%/?!¦#//?!¦#:#?!¦
0xDEAD_7¦#//?!¦~//~¦—%—¦__%__¦@_@?!¦—%—¦^^::#¦!?%~¦0x0B__¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
[ECONNABORTED]¦EIO::?¦0xBABE~¦EHOSTUNREACH?¦h0ld—¦<HTTP 503?>¦[ETIMEDOUT]¦EAGAIN?!¦ERR:418¦
h0ld—¦EHOSTUNREACH?¦[ENOMEM]¦[EOVERFLOW]¦[EOVERFLOW]¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦
think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦%_?!%¦0xB00_7¦!?%~¦::?!::¦@_@?!¦
%_?!%¦@_@?!¦0xAC1D?!¦<HTTP 503?>¦#:#?!¦::?!::¦^^::#¦fzzt…¦upd@te_REQUIR3D//delete_updates?¦
4_04_4¦MOOD_DRIVER_MISSING?
░▒▓█ */
// spudphys — adapter (4, cheapest tier): toss. A closed-form throw with spin and bounces on flat ground.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// No simulation and no state: at(t) is a pure function of song time, so it scrubs for free. Use it for most gags.

import { quatFromRotVec, quatMul, quatNormalize, composeMat4 } from '../vec.mjs';

const dq = new Float64Array(4), q = new Float64Array(4);

/**
 * @param {object} o  t: launch time, at: [x,y,z], v: [vx,vy,vz], spin: [wx,wy,wz] rad/s, quat: start orientation,
 *   gravity (21.6, downward), ground (0), height (distance from centre to ground when resting, 0.25),
 *   bounce (restitution 0.4), friction (0.7 per bounce), stop (0.6: vertical speed below which it settles), bounces (8)
 */
export function toss(o) {
  const g = o.gravity ?? 21.6, gy = (o.ground ?? 0) + (o.height ?? 0.25);
  const e = o.bounce ?? 0.4, f = o.friction ?? 0.7, stop = o.stop ?? 0.6;
  const segs = [];
  let t0 = o.t ?? 0, p = [...(o.at || [0, gy, 0])], v = [...(o.v || [0, 0, 0])], w = [...(o.spin || [0, 0, 0])];
  let qq = new Float64Array(o.quat || [0, 0, 0, 1]);
  for (let b = 0; b <= (o.bounces ?? 8); b++) {
    segs.push({ t0, p: p.slice(), v: v.slice(), w: w.slice(), q: qq.slice(), end: Infinity, rest: false });
    const h = p[1] - gy, disc = v[1] * v[1] + 2 * g * (h > 0 ? h : 0);
    const tau = (v[1] + Math.sqrt(disc)) / g;
    if (!(tau > 0)) break;
    segs[segs.length - 1].end = t0 + tau;
    // state at impact
    p = [p[0] + v[0] * tau, gy, p[2] + v[2] * tau];
    const vyHit = v[1] - g * tau;
    quatFromRotVec(w[0] * tau, w[1] * tau, w[2] * tau, dq, 0); quatMul(dq, 0, qq, 0, qq, 0); quatNormalize(qq, 0);
    t0 += tau;
    if (-vyHit * e < stop) { segs.push({ t0, p: p.slice(), v: [0, 0, 0], w: [0, 0, 0], q: qq.slice(), end: Infinity, rest: true }); break; }
    v = [v[0] * f, -vyHit * e, v[2] * f]; w = [w[0] * f, w[1] * f, w[2] * f];
  }
  const startT = segs[0].t0;
  function segAt(t) { let s = segs[0]; for (let i = 0; i < segs.length; i++) if (t >= segs[i].t0) s = segs[i]; return s; }
  const api = {
    segments: segs,
    /** Position + quaternion at song time t. */
    pose(t, pos = new Float64Array(3), quat = new Float64Array(4)) {
      if (t < startT) t = startT;
      const s = segAt(t), tau = t - s.t0;
      pos[0] = s.p[0] + s.v[0] * tau; pos[1] = s.rest ? s.p[1] : s.p[1] + s.v[1] * tau - 0.5 * g * tau * tau; pos[2] = s.p[2] + s.v[2] * tau;
      quatFromRotVec(s.w[0] * tau, s.w[1] * tau, s.w[2] * tau, dq, 0); quatMul(dq, 0, s.q, 0, quat, 0); quatNormalize(quat, 0);
      return { pos, quat };
    },
    /** Column-major 4x4 at song time t. */
    at(t, out16 = new Float64Array(16)) {
      const P = api.pose(t, TP, q);
      return composeMat4(P.pos[0], P.pos[1], P.pos[2], P.quat, 0, out16, 0);
    },
    /** Song times of each bounce (for sound cues). */
    get bounces() { return segs.slice(1).map(s => s.t0); },
  };
  return api;
}
const TP = new Float64Array(3);

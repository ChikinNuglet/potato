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
h0ld—¦[EOVERFLOW]¦[ENOENT]¦[ENETDOWN]¦0xBABE~¦[EOVERFLOW]¦EIO::?¦:_:#¦[EINTR]¦ECONNRESET…¦
[EOVERFLOW]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦0xAC1D?!¦0xAC1D?!¦
0xBABE~¦0xAC1D?!¦%_?!%¦0xBABE~¦0xB00_7¦!?%~¦[HTTP_404]¦__%__¦ERR:418¦ERR:418¦wh@t—EIO::¦
m33t_em0tional_err0r_l0gs_t0night¦AA_09_FF¦!?%~
░▒▓█ */
// spudphys — cartoon squash and stretch: a damped spring per character, stepped inside world.step() and saved
// with the rest of the state, so it replays and scrubs exactly.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Canon guard: amplitude capped (default 0.12), scale about his feet, volume kept. Squash changes how he lands,
// never who he is (POTATO-CANON-RULES.md HARD RULE). New squash looks go to Chikin as stills first.

/**
 * @param {import('../src/world.mjs').World} world
 * @param {{ stiffness?: number, damping?: number, cap?: number, impacts?: {t:number, size:number}[] | ((k:number)=>number), active?: number[] }} o
 *   impacts: list of { t, size } (size > 0 squashes, < 0 stretches), or a function of the step index returning a size.
 */
export function squash(world, o = {}) {
  const off = world.allocState([0, 0]);
  const kS = o.stiffness ?? 260, cD = o.damping ?? 9, cap = o.cap ?? 0.12;
  const list = Array.isArray(o.impacts) ? o.impacts.map(i => ({ k: world.stepAt(i.t), size: i.size })) : null;
  const fn = typeof o.impacts === 'function' ? o.impacts : null;
  const body = world.addBody({ kind: 'squash', n: 0, active: o.active });
  body.pre = (w, b, k) => {
    const st = w.state, dt = 1 / w.rate, sub = 4, h = dt / sub;
    let imp = 0;
    if (list) for (const i of list) if (i.k === k) imp += i.size;
    if (fn) imp += fn(k) || 0;
    if (imp) st[off + 1] -= imp * 12;               // an impact kicks the spring's speed
    for (let j = 0; j < sub; j++) {                  // semi-implicit Euler, fixed sub-steps
      st[off + 1] += (-kS * st[off] - cD * st[off + 1]) * h;
      st[off] += st[off + 1] * h;
      if (st[off] > cap) { st[off] = cap; if (st[off + 1] > 0) st[off + 1] = 0; }
      if (st[off] < -cap) { st[off] = -cap; if (st[off + 1] < 0) st[off + 1] = 0; }
    }
  };
  body.onReset = (w) => { w.state[off] = 0; w.state[off + 1] = 0; };
  return {
    body,
    /** Spring value s in [-cap, cap]: > 0 stretched, < 0 squashed. */
    get value() { return world.state[off]; },
    /** Scale [sx, sy, sz] to apply about his feet (volume kept: sx = sz = 1/sqrt(sy)). */
    scale(out = [1, 1, 1]) { const sy = 1 + world.state[off], sx = 1 / Math.sqrt(sy); out[0] = sx; out[1] = sy; out[2] = sx; return out; },
  };
}

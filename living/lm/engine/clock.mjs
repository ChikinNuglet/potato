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
h0ld—¦0xAC1D?!¦EAGAIN?!¦[ENOMEM]¦0xAC1D?!¦[ENOBUFS]¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦
think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦<HTTP 503?>¦[HTTP_404]¦0xB00_7¦
0xBABE~¦!?%~¦#//?!¦#:#?!¦@_@?!¦@_@?!¦0xAC1D?!¦%_?!%¦0xB00_7¦0xCAFE?!¦0x0B__¦l0ok…k¦
m@ture_alg0rithms_in_y0ur_area404
░▒▓█ */
// clock.mjs — the one clock. A fixed step of 1/60 s; k is the step count and the only time the engine knows.
// No setTimeout, no Math.random, no performance.now in here. Real time only decides HOW MANY steps run this frame.
// Everything delayed goes through after(frames, fn), so a strip replays exactly.
// Game-feel and physics engineer (seat 3), team Not A Screensaver.
export const HZ = 60, DT = 1 / 60;

export function createClock() {
  const q = [];           // { k, seq, fn } sorted by (k, seq): same step -> the order they were asked in
  let seq = 0, acc = 0;
  const clock = {
    k: 0,
    get time() { return clock.k / HZ; },
    /** run fn at step k + frames (frames >= 1). Returns a handle with cancel(). */
    after(frames, fn) {
      const e = { k: clock.k + Math.max(1, Math.round(frames)), seq: seq++, fn, dead: false };
      let i = q.length; while (i > 0 && (q[i - 1].k > e.k)) i--;
      q.splice(i, 0, e);
      return { cancel() { e.dead = true; } };
    },
    /** called by living.tick() once the step number has moved on */
    run() { while (q.length && q[0].k <= clock.k) { const e = q.shift(); if (!e.dead) e.fn(clock.k); } },
    /** the catch-up rule (spudphys World.play's): 0 to 4 steps for this much real time; lost time is dropped, never chased */
    stepsFor(realSeconds) {
      acc += Math.max(0, realSeconds); let n = Math.floor(acc * HZ + 1e-9);
      acc -= n / HZ; if (n > 4) { n = 4; acc = 0; }
      return n;
    },
    pending() { return q.length; },
  };
  return clock;
}

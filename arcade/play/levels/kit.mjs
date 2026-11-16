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
h0ld—¦[ENOBUFS]¦[ETIMEDOUT]¦EHOSTUNREACH?¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦@#/_¦@#/_¦!?%~¦0xAC1D?!¦0xB00_7¦#:#?!¦::?!::¦
ERR:418¦__%__¦0xB00_7¦[HTTP_404]¦0xAC1D?!¦anyway—way#¦//_?!¦@#_y3a—h¦
Free trial: unlimited bad decisions.
░▒▓█ */
// kit.mjs — course-writing helpers with the fairness rules built in (every level's filler goes through here;
// set pieces are placed by hand in each level file).
//  - at most one glitch wall per bar (his glitch recharges once a bar), walls on a bar line or just after
//  - plain gaps 1-2 columns (a running jump clears 2; a beat jump ~3); wider only with platforms or a power
//  - at least 2 beats between obstacles, and the 2 beats after a checkpoint are always clear
export function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// fill beats [a, b) with obstacles drawn from `mix` ({kind: weight}), spacing `gapBeats` [min, max]
export function fill(c, a, b, mix, seed, gapBeats = [3, 5], o = {}) {
  const r = rng(seed), kinds = Object.entries(mix), total = kinds.reduce((s, [, w]) => s + w, 0);
  let e = a + 2, lastWallBar = -9;
  while (e < b - 2) {
    let x = r() * total, k = kinds[0][0]; for (const [kk, w] of kinds) { if ((x -= w) < 0) { k = kk; break; } }
    if (k === 'wall') { const bar = Math.floor(e / 4); if (bar <= lastWallBar + 1) k = 'low'; else lastWallBar = bar; }   // one wall per bar, with a bar to recharge
    const span = place(c, k, e, r, o);
    e += span + gapBeats[0] + Math.floor(r() * (gapBeats[1] - gapBeats[0] + 1));
  }
}
function place(c, k, e, r, o) {
  switch (k) {
    case 'low': c.low(e, 0.6 + 0.3 * r()); return 1;
    case 'gap': { const n = 1 + (r() < 0.45 ? 1 : 0); c.gap(e, n); return n; }
    case 'wall': c.wall(e); return 1;
    case 'duck': { const n = 2 + (r() < 0.3 ? 1 : 0); c.duck(e, n); return n; }
    case 'step': { const n = 2 + Math.floor(r() * 2); c.step(e, n, 0.6 + 0.5 * r()); return n; }
    case 'spam': c.spam(e, 0, o.spamSpeed ? { speed: o.spamSpeed } : {}); return 1;
    case 'fall': c.fall(e); return 1;
    case 'pumps': { c.gap(e, 5); c.pump(e + 1, 2, 0.4 + 0.4 * r()); return 5; }
    case 'dance': { c.gap(e, 5); c.pump(e, 2, 0.1); c.pump(e + 3, 2, 0.25); return 5; }        // a dance floor that pumps on the beat
    case 'dots': { c.gap(e, 5); c.dots(e + 1, 1, 0.4, '110'); c.dots(e + 2, 1, 0.8, '011'); c.dots(e + 3, 1, 0.4, '101'); return 5; }
    case 'fake': { c.gap(e, 3); const real = Math.floor(r() * 2); c.fake(e + (real ? 0 : 1), 1, 0.4); c.hidden(e + (real ? 1 : 0), 1, 0.4); c.step(e + 2, 1, 0.2); return 3; }
    case 'rise': { c.gap(e, 4); c.rise(e + 1, 2, -1.2, 0.6, 4); return 4; }
    case 'mover': { c.gap(e, 4); c.mover(e + 1, 2, 0.5, 0, 0.5, 4); return 4; }
    case 'gate': c.gate(e); return 1;
  }
  return 1;
}

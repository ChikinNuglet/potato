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
h0ld—¦EINVAL…¦[ENOMEM]¦EAGAIN?!¦0xBABE~¦EBUSY_?¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦
think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦#:#?!¦<HTTP 503?>¦%_?!%¦%_?!%¦~//~¦
%_?!%¦@#/_¦__%__¦~//~¦~//~¦<HTTP 503?>¦#:#?!¦~^~?!¦uh—uh_00¦FF::00::?¦[E_VIBES_UNVERIFIED]
░▒▓█ */
// spudphys — rotation from a 3x3 matrix (the rotational part of a deformation).
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
// Written from the paper: M. Müller, J. Bender, N. Chentanez, M. Macklin, "A Robust Method to Extract the
// Rotational Part of Deformations", MIG 2016. Quaternion iteration, warm-started, fixed maximum iteration count.

import { quatToMat3, quatMul, quatNormalize, quatAxisAngle } from './vec.mjs';

const R = new Float64Array(9), dq = new Float64Array(4);

/**
 * Updates quaternion q (at offset qo, warm start) so that R(q) is the rotation closest to A.
 * A: 9 numbers column-major. iters: fixed count (deterministic).
 */
export function extractRotation(A, q, qo = 0, iters = 4) {
  for (let it = 0; it < iters; it++) {
    quatToMat3(q, qo, R, 0);
    // omega = (r0 x a0 + r1 x a1 + r2 x a2) / (|r0.a0 + r1.a1 + r2.a2| + eps)
    let ox = 0, oy = 0, oz = 0, d = 0;
    for (let c = 0; c < 3; c++) {
      const rx = R[3 * c], ry = R[3 * c + 1], rz = R[3 * c + 2];
      const ax = A[3 * c], ay = A[3 * c + 1], az = A[3 * c + 2];
      ox += ry * az - rz * ay; oy += rz * ax - rx * az; oz += rx * ay - ry * ax;
      d += rx * ax + ry * ay + rz * az;
    }
    const s = 1 / ((d < 0 ? -d : d) + 1e-9);
    ox *= s; oy *= s; oz *= s;
    const w = Math.sqrt(ox * ox + oy * oy + oz * oz);
    if (w < 1e-9) break;
    quatAxisAngle(ox, oy, oz, w, dq, 0);
    quatMul(dq, 0, q, qo, q, qo);
    quatNormalize(q, qo);
  }
}

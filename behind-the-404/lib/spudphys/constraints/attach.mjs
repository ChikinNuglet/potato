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
h0ld—¦0xBABE~¦EHOSTUNREACH?¦EHOSTUNREACH?¦0xBABE~¦0xAC1D?!¦EIO::?¦:_:#¦[EINTR]¦ECONNRESET…¦
[EOVERFLOW]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦ERR:418¦@#/_¦~//~¦
<HTTP 503?>¦!?%~¦@#/_¦<HTTP 503?>¦~//~¦#:#?!¦::?!::¦::?!::¦[HTTP_404]¦h@ndsh—¦007—x¦so—so_7¦
krrzzt
░▒▓█ */
// spudphys — attachments (pins) and tethers.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.

/**
 * Attach: particle -> a point fixed in a driver's frame (or in world space when driver is null).
 * Kinematic particles (inverse mass 0) are placed exactly; others are pulled with XPBD compliance.
 */
export class AttachGroup {
  /**
   * @param {Int32Array} ids
   * @param {Float64Array} local 3 per row, in the driver's frame
   * @param {object|null} driver
   * @param {number} compliance
   */
  constructor(ids, local, driver, compliance = 0) {
    this.type = 'attach'; this.name = 'attach';
    this.ids = ids; this.local = local; this.driver = driver; this.compliance = compliance;
    this.enabled = 1;          // a per-row on/off could be added; 0 disables the whole group
  }
  target(i, out, oo = 0) {
    const l = this.local, lx = l[3 * i], ly = l[3 * i + 1], lz = l[3 * i + 2], d = this.driver;
    if (!d) { out[oo] = lx; out[oo + 1] = ly; out[oo + 2] = lz; return out; }
    const m = d.m, p = d.pos;
    out[oo] = p[0] + m[0] * lx + m[3] * ly + m[6] * lz;
    out[oo + 1] = p[1] + m[1] * lx + m[4] * ly + m[7] * lz;
    out[oo + 2] = p[2] + m[2] * lx + m[5] * ly + m[8] * lz;
    return out;
  }
  solve(W) {
    if (!this.enabled) return;
    const x = W.x, w = W.w, ids = this.ids, l = this.local, d = this.driver, alpha = this.compliance * W.invSdt2;
    const m = d ? d.m : null, p = d ? d.pos : null;
    for (let i = 0; i < ids.length; i++) {
      const lx = l[3 * i], ly = l[3 * i + 1], lz = l[3 * i + 2];
      let tx = lx, ty = ly, tz = lz;
      if (m) {
        tx = p[0] + m[0] * lx + m[3] * ly + m[6] * lz;
        ty = p[1] + m[1] * lx + m[4] * ly + m[7] * lz;
        tz = p[2] + m[2] * lx + m[5] * ly + m[8] * lz;
      }
      const id = ids[i], o = 3 * id, wi = w[id];
      if (wi === 0) { x[o] = tx; x[o + 1] = ty; x[o + 2] = tz; continue; }
      const k = wi / (wi + alpha);
      x[o] += (tx - x[o]) * k; x[o + 1] += (ty - x[o + 1]) * k; x[o + 2] += (tz - x[o + 2]) * k;
    }
  }
}

/**
 * Tether (long-range attachment): particle ids[i] may not be further than maxLen[i] from particle anchor[i].
 * One-sided, moves only the free particle (anchors are pins). Stops cloth/rope from looking like rubber.
 */
export class TetherGroup {
  constructor(ids, anchors, maxLen) {
    this.type = 'tether'; this.name = 'tether';
    this.ids = ids; this.anchors = anchors; this.maxLen = maxLen;
  }
  solve(W) {
    const x = W.x, w = W.w, ids = this.ids, an = this.anchors, L = this.maxLen;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (w[id] === 0) continue;
      const o = 3 * id, a = 3 * an[i];
      const dx = x[o] - x[a], dy = x[o + 1] - x[a + 1], dz = x[o + 2] - x[a + 2];
      const d2 = dx * dx + dy * dy + dz * dz, li = L[i];
      if (d2 <= li * li) continue;
      const k = li / Math.sqrt(d2);
      x[o] = x[a] + dx * k; x[o + 1] = x[a + 1] + dy * k; x[o + 2] = x[a + 2] + dz * k;
    }
  }
}

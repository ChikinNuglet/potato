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

// spudphys — deterministic maths.
// Copyright (c) 2026 ChikinNuglet. MIT licence, see LICENSE.
//
// Only exactly rounded operations live here (+ - * /, Math.sqrt, Math.floor, Math.abs, Math.imul), so the same
// inputs give the same bits in Node, Chromium, Safari and Firefox. The polynomial coefficients and the split
// constants for pi/2 and ln 2 are the fdlibm ones (Sun Microsystems, 1993), which are also what V8
// uses, so dsin/dcos/dexp agree with Math.sin/cos/exp to within an ulp or two. The fdlibm notice they carry:
//   Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
//   Developed at SunPro, a Sun Microsystems, Inc. business.
//   Permission to use, copy, modify, and distribute this software is freely granted, provided that this notice
//   is preserved.

// ---- sin / cos ------------------------------------------------------------------------------------------------
const INV_PIO2 = 6.36619772367581382433e-01;
const PIO2_1 = 1.57079632673412561417e+00;   // first 33 bits of pi/2
const PIO2_2 = 6.07710050630396597660e-11;   // next 33 bits
const PIO2_2T = 2.02226624879595063154e-21;  // pi/2 - (PIO2_1 + PIO2_2)
const S1 = -1.66666666666666324348e-01, S2 = 8.33333333332248946124e-03, S3 = -1.98412698298579493134e-04,
  S4 = 2.75573137070700676789e-06, S5 = -2.50507602534068634195e-08, S6 = 1.58969099521155010221e-10;
const C1 = 4.16666666666666019037e-02, C2 = -1.38888888888741095749e-03, C3 = 2.48015872894767294178e-05,
  C4 = -2.75573143513906633035e-07, C5 = 2.08757232129817482790e-09, C6 = -1.13596475577881948265e-11;

function ksin(x) {
  const z = x * x, v = z * x;
  const r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)));
  return x + v * (S1 + z * r);
}
function kcos(x) {
  const z = x * x;
  const r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
  const hz = 0.5 * z, w = 1 - hz;
  return w + (((1 - w) - hz) + z * r);
}
// Cody–Waite reduction: x = n*(pi/2) + r, |r| <= pi/4. Exact enough for |x| up to ~1e6 (song phases, angles).
function reduce(x) {
  const n = Math.floor(x * INV_PIO2 + 0.5);
  const r = ((x - n * PIO2_1) - n * PIO2_2) - n * PIO2_2T;
  return [n, r];
}
const _q = [0, 0];
function reduceInto(x) {
  const n = Math.floor(x * INV_PIO2 + 0.5);
  _q[0] = n; _q[1] = ((x - n * PIO2_1) - n * PIO2_2) - n * PIO2_2T;
}

/** Deterministic sine. */
export function dsin(x) {
  if (x !== x || x === Infinity || x === -Infinity) return NaN;
  if (x > -0.7853981633974483 && x < 0.7853981633974483) return ksin(x);
  reduceInto(x);
  const r = _q[1];
  switch (((_q[0] % 4) + 4) % 4) {
    case 0: return ksin(r);
    case 1: return kcos(r);
    case 2: return -ksin(r);
    default: return -kcos(r);
  }
}
/** Deterministic cosine. */
export function dcos(x) {
  if (x !== x || x === Infinity || x === -Infinity) return NaN;
  if (x > -0.7853981633974483 && x < 0.7853981633974483) return kcos(x);
  reduceInto(x);
  const r = _q[1];
  switch (((_q[0] % 4) + 4) % 4) {
    case 0: return kcos(r);
    case 1: return -ksin(r);
    case 2: return -kcos(r);
    default: return ksin(r);
  }
}
export { reduce as _reduce };

// ---- exp --------------------------------------------------------------------------------------------------------
const LN2_HI = 6.93147180369123816490e-01, LN2_LO = 1.90821492927058770002e-10, INV_LN2 = 1.44269504088896338700e+00;
const P1 = 1.66666666666666019037e-01, P2 = -2.77777777770155933842e-03, P3 = 6.61375632143793436117e-05,
  P4 = -1.65339022054652515390e-06, P5 = 4.13813679705723846039e-08;
const _f64 = new Float64Array(1), _u32 = new Uint32Array(_f64.buffer);
const LITTLE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
function pow2(n) {               // exact 2^n for -1022 <= n <= 1023 by writing the exponent bits
  _f64[0] = 0;
  _u32[LITTLE ? 1 : 0] = (n + 1023) << 20;
  return _f64[0];
}
/** Deterministic e^x. */
export function dexp(x) {
  if (x !== x) return NaN;
  if (x > 709.78) return Infinity;
  if (x < -745) return 0;
  const k = Math.floor(x * INV_LN2 + 0.5);
  const hi = x - k * LN2_HI, lo = k * LN2_LO, r = hi - lo;
  const t = r * r;
  const c = r - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))));
  const y = 1 - ((lo - (r * c) / (2 - c)) - hi);
  if (k < -1021) return y * pow2(k + 1000) * pow2(-1000);
  if (k > 1023) return y * pow2(k - 1) * 2;
  return y * pow2(k);
}

// ---- seeded randomness ----------------------------------------------------------------------------------------
/** 32-bit string hash (FNV-1a) used to name rng streams. */
export function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** mulberry32: returns a function giving floats in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** A named stream: the same (seed, name) always gives the same sequence, independent of other streams. */
export function stream(seed, name) {
  return mulberry32(Math.imul((seed >>> 0) ^ 0x9E3779B9, 0x85EBCA6B) ^ hashString(name));
}

// ---- state hashing ----------------------------------------------------------------------------------------------
/** FNV-1a over the raw bytes (as 32-bit words) of typed arrays. Returns 8 hex chars. */
export function fnv1a(arrays, h = 0x811c9dc5) {
  for (const a of arrays) {
    const u = new Uint32Array(a.buffer, a.byteOffset, a.byteLength >>> 2);
    for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619); }
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

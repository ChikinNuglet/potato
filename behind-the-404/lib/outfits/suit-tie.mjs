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
h0ld—¦[EOVERFLOW]¦[ENETDOWN]¦[ETIMEDOUT]¦EHOSTUNREACH?¦%%/?!¦EHOSTUNREACH?¦[ETIMEDOUT]¦ERR:418¦
:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦
h0ld—¦#:#?!¦#:#?!¦!?%~¦@#/_¦0xBABE~¦!?%~¦!?%~¦@#/_¦%_?!%¦<HTTP 503?>¦<HTTP 503?>¦0xB00_7¦13?37!¦
88::13¦sszzt¦MOOD_DRIVER_MISSING?
░▒▓█ */
// suit-tie (3D) — Thursday Potato's "Manager in the chair" look (Chikin: "glitch him to a suit and tie and then back").
// A charcoal suit jacket wrapped round him from the shoulders down, a deep V at his front showing a white shirt with collar
// points and a red tie, wide lapels, two buttons, a pocket square, a back seam. No hat: his face stays his.
import { painter, fu, W, INKU, INK, RM, ARC, clamp, lerp } from '../outfits3d.mjs';

export default function build(H) {
  const P = painter(), { x } = P;
  const SUIT = '#2e3240', LAPEL = '#232633', SHIRT = '#f4f1ea', TIE = '#c8323a', TIE_D = '#8f1f27', BTN = '#15161c';
  const COAT = 0.016, top = th => 0.63 + 0.035 * fu(th, 1.2);                       // shoulders: a touch lower at his front, clear of his face
  const TOP = 0.63, neck = th => top(th) + 0.24 * fu(th, 0.34);                     // the V at his front: narrow and deep
  const lap = th => { const tp = clamp((Math.abs(th) - 0.05) / 0.45); return neck(th) + 0.075 * tp + 0.012; };

  // the shirt in the V, and the tie down it (painted first: the jacket's edge inks over it)
  P.region(() => P.band(top, th => neck(th) + 0.01, -0.4, 0.4), SHIRT, () => {
    P.strip(0, 0.06, () => top(0) + 0.025, () => top(0) + 0.07); P.fill(TIE_D); P.ink(0.5);                // the knot
    x.beginPath(); x.moveTo(-0.045 * RM, top(0) + 0.07); x.lineTo(0.045 * RM, top(0) + 0.07); x.lineTo(0.07 * RM, neck(0) - 0.01);
    x.lineTo(0, neck(0) + 0.02); x.lineTo(-0.07 * RM, neck(0) - 0.01); x.closePath(); P.fill(TIE); P.ink(0.5);
    for (const d of [-1, 1]) { x.beginPath(); x.moveTo(d * 0.03 * RM, top(0)); x.lineTo(d * 0.17 * RM, top(0) + 0.004); x.lineTo(d * 0.06 * RM, top(0) + 0.065); x.closePath(); P.fill(SHIRT); P.ink(0.45); }   // collar points
  });
  P.shadow(top);
  P.region(() => P.below(neck), SUIT, () => {
    P.band(neck, lap); P.fill(LAPEL); P.ink(0.55);                                                   // lapels
    for (const v of [0.86, 0.93]) P.dot(0.04, v, 0.02, BTN, H.rx(v));                               // two buttons
    x.beginPath(); x.moveTo(0.68 * RM, 0.83); x.lineTo(0.9 * RM, 0.83); P.ink(0.5);                       // breast pocket
    x.beginPath(); x.moveTo(0.71 * RM, 0.83); x.lineTo(0.76 * RM, 0.795); x.lineTo(0.81 * RM, 0.83); x.closePath(); P.fill(SHIRT); P.ink(0.4);   // pocket square
    x.beginPath(); x.moveTo(Math.PI * RM - 0.002, 0.7); x.lineTo(Math.PI * RM - 0.002, 1.02); P.ink(0.5);   // back seam
    x.beginPath(); x.moveTo(-Math.PI * RM + 0.002, 0.7); x.lineTo(-Math.PI * RM + 0.002, 1.02); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  return { canvas: P.c, parts: [], puff: (t, th) => t >= top(th) ? COAT : 0, update() {} };
}

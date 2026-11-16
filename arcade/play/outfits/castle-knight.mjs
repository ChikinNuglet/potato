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
h0ld—¦0xAC1D?!¦0xBABE~¦[EOVERFLOW]¦EHOSTUNREACH?¦EAGAIN?!¦ERR:418¦%%/?!¦[ENOBUFS]¦EFAULT//¦
[ETIMEDOUT]¦[EPIPE]¦EIO::?¦EHOSTUNREACH?¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦%_?!%¦@_@?!¦0xB00_7¦#//?!¦0xB00_7¦0xB00_7¦#//?!¦
@_@?!¦@_@?!¦@#/_¦#:#?!¦~//~¦0xABAD//¦m33t_em0tional_err0r_l0gs_t0night¦0xABAD//¦p@cket…?
░▒▓█ */
// castle-knight (3D) — ported from draw/outfits/castle-knight.js (Chat's 021).
// A rounded steel helmet over his head and shoulders with ONE broad open face window (cut out: his own face shows),
// a blue crest of three lobes along the top front-to-back, over a short steel breastplate with blue trim.
import { painter, ringPts, fu, W, INKU, INK, RM, ARC, clamp, lerp } from '../outfits3d.mjs';

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const STEEL = '#cdd3dc', STEEL_D = '#9aa3b1', BLUE = '#1f56d6', BLUE_D = '#123a9c', LINING = '#2b2f3a';
  const HELM = 0.035 * W, PLATE = 0.016;
  // helmet bottom edge: low at his front (a gentle dip), higher round his back
  const bot = th => 0.67 + 0.025 * Math.cos(th) + 0.15 * fu(th, 0.8);
  // the face window: a squarish superellipse centred a little to his right (where Vega's side-eye sits)
  const WC = 0.12, AW = 1.02, VC = 0.5, HV = 0.31, SQ = 0.6;
  const se = v => Math.sign(v) * Math.pow(Math.abs(v), SQ);
  const inWin = (t, th) => { const a = Math.atan2(Math.sin(th - WC), Math.cos(th - WC)) / AW, b = (t - VC) / HV;
    return Math.pow(Math.abs(a), 2 / SQ) + Math.pow(Math.abs(b), 2 / SQ) < 1; };
  const winPath = () => { x.beginPath(); for (let i = 0; i <= 96; i++) { const ph = i / 96 * 2 * Math.PI;
    x[i ? 'lineTo' : 'moveTo']((WC + AW * se(Math.cos(ph))) * RM, VC + HV * se(Math.sin(ph))); } x.closePath(); };

  // ---- the breastplate (everything below the helmet; the helmet paints over its top) ----
  P.region(() => { x.beginPath(); x.rect(-ARC / 2, 0.55, ARC, 0.5); }, STEEL, () => {
    P.line(() => 0.785); P.ink(0.5);                                                   // plate seam
    P.band(() => 0.89, () => 0.935); P.fill(BLUE); P.ink(0.55);                         // blue trim
    P.band(() => 0.8, () => 0.815); P.fill('rgba(255,255,255,0.55)');                 // shine stripe
  });
  // a soft shadow the helmet's edge casts on the plate
  P.wrap(() => { x.save(); x.filter = `blur(${1024 * 0.008}px)`; P.line(th => bot(th) + 0.012); x.lineWidth = 0.024; x.strokeStyle = 'rgba(20,24,40,0.35)'; x.stroke(); x.restore(); });

  // ---- the helmet: his head down to bot(th), steel ----
  P.region(() => P.above(bot), STEEL, () => {
    P.band(th => bot(th) - 0.035, bot); P.fill(BLUE); P.ink(0.55);                    // blue trim round the bottom edge
    for (const [a, v1] of [[0, VC - HV - 0.03], [Math.PI, 0.6], [-Math.PI, 0.6]]) {    // raised ridge, front and back
      P.strip(a, 0.09, () => 0.0, () => v1); P.fill(STEEL_D); P.ink(0.55); }
    x.beginPath(); x.ellipse(-0.55 * RM, 0.13, 0.06, 0.03, -0.5, 0, 7); x.fillStyle = 'rgba(255,255,255,0.75)'; x.fill();   // shine on the dome
    for (const a of [WC - AW - 0.2, WC + AW + 0.2]) P.dot(a, 0.5, 0.03, STEEL_D, H.rx(0.5));                                  // rivets
  });
  P.wrap(() => { P.line(bot); P.ink(1); });
  // cut the window out (his face shows), then a dark lining just inside it and an ink rim round it
  x.save(); x.globalCompositeOperation = 'destination-out'; winPath(); x.fill(); x.restore();
  x.save(); winPath(); x.clip(); x.filter = `blur(${1024 * 0.01}px)`; winPath(); x.lineWidth = 0.07; x.strokeStyle = LINING; x.globalAlpha = 0.8; x.stroke(); x.restore();
  winPath(); P.ink(1.1);

  // ---- the crest: three blue lobes along the top, front to back (a fin face-on, a plume side-on) ----
  const sph = new T.SphereGeometry(1, 28, 18), group = new T.Group(), lobes = [];
  for (const [dz, col] of [[0.1, BLUE_D], [-0.1, BLUE_D], [0, BLUE]]) {
    const g = H.outlined(sph, H.paint(col), 0.8); g.userData.dz = dz; group.add(g); lobes.push(g); }

  return { canvas: P.c, parts: [group],
    puff: (t, th) => t < bot(th) ? (inWin(t, th) ? 0 : HELM) : PLATE,
    update() {
      const tp = H.top(), y0 = tp.y + HELM;
      for (const g of lobes) { const dz = g.userData.dz, s = Math.sign(dz);
        if (!dz) { g.position.set(tp.x, y0 + 0.11, tp.z); g.scale.set(0.05, 0.155, 0.095); g.rotation.set(0, 0, 0); }
        else { g.position.set(tp.x, y0 + 0.06, tp.z + dz); g.scale.set(0.045, 0.125, 0.085); g.rotation.set(0.5 * s, 0, 0); } } } };
}

// burglar (3D): Between Messages (D-20261103-78). A black beanie and a striped jumper.
// No arms, no hands.
import { painter, fu, W, RM, ARC } from '../outfits3d.mjs';
export default function build(H) {
  const P = painter(), { x } = P, T = H.T;
  const BLACK = '#17161c', STRIPE = '#e6dfd0';
  const neck = th => 0.62 + 0.09 * fu(th, 0.6), collar = th => neck(th) + 0.05;
  P.shadow(neck);
  P.region(() => P.below(neck), BLACK, () => { for (let v = 0.7; v < 1.05; v += 0.1) { x.fillStyle = STRIPE; x.fillRect(-ARC / 2, v, ARC, 0.05); }
    P.band(neck, collar); P.fill(BLACK); P.ink(0.5); });
  P.wrap(() => { P.line(neck); P.ink(1); });
  const vb = 0.2, fold = 0.135;
  P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, vb + 0.05); }, BLACK, () => { x.fillStyle = '#2c2b33'; x.fillRect(-ARC / 2, fold, ARC, vb - fold); });
  P.wrap(() => { P.line(() => fold); P.ink(0.6); P.line(() => vb); P.ink(1); });
  return { canvas: P.c, parts: [], puff: (t, th) => t < vb + 0.01 ? 0.04 * W : t >= neck(th) ? 0.018 : 0, update() {} };
}

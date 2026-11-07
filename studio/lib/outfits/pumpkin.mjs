// pumpkin (3D): Halloween. An orange ribbed pumpkin suit up to his neck and a green stem cap. No arms, no hands, his face stays his.
import { painter, fu, W, RM, ARC } from '../outfits3d.mjs';
export default function build(H) {
  const P = painter(), { x } = P, T = H.T, O = '#e87a1e', D = '#b8560f', G = '#3f6b2a';
  const neck = th => 0.6 + 0.09 * fu(th, 0.6);
  P.shadow(neck);
  P.region(() => P.below(neck), O, () => { for (let i = 0; i < 10; i++) { const a = -ARC / 2 + (i + .5) * ARC / 10; x.fillStyle = D; x.beginPath(); x.ellipse(a, .84, .022, .3, 0, 0, 7); x.fill(); } P.band(neck, th => neck(th) + .05); P.fill(G); P.ink(.5); });
  P.wrap(() => { P.line(neck); P.ink(1); });
  const vb = 0.14; P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, vb + 0.05); }, G, () => {}); P.wrap(() => { P.line(() => vb); P.ink(.9); });
  const stem = H.paint('#5c7f35'), leaf = H.paint(G), cyl = new T.CylinderGeometry(.6, 1, 2.2, 12), sph = new T.SphereGeometry(1, 16, 12), group = new T.Group(), s = H.outlined(cyl, stem), l = H.outlined(sph, leaf); group.add(s); group.add(l);
  return { canvas: P.c, parts: [group], puff: (t, th) => t < vb + .01 ? .03 * W : t >= neck(th) ? .03 : 0,
    update() { const { c } = H.ring(.03); s.position.set(c.x, c.y + .1, c.z); s.scale.set(.07, .07, .07); s.rotation.z = -.2; l.position.set(c.x + .16, c.y + .02, c.z); l.scale.set(.15, .05, .1); l.rotation.z = .3; } };
}

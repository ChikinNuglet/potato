// ink coat (3D): Taticat's look, in Potato's own words: "an ink coat over plain clothes, paper collar, her badge on the lapel", "trench coat is the
// right shape". Long, double-breasted, wide lapels, a belt, tails that swing (real cloth), and a wide ink hat with a paper band. No arms, no hands, his face stays his.
import { painter, fu, W, RM, ARC, loadOutfit } from '../outfits3d.mjs';
import { capeCloth } from '../motion3d.mjs';
export default function build(H) {
  const P = painter(), { x } = P, T = H.T, INKC = '#17141f', ED = '#2b2740', PAPER = '#efe5cf', PLAIN = '#b9b0a0', GRN = '#3bd97f', BTN = '#8a7fa8';
  const neck = th => 0.56 + 0.09 * fu(th, 0.6), coll = th => neck(th) + 0.07;
  P.shadow(neck);
  P.region(() => P.below(neck), INKC, () => {
    x.beginPath(); x.moveTo(-.07, neck(0)); x.lineTo(.07, neck(0)); x.lineTo(.018, .8); x.lineTo(-.018, .8); x.closePath(); P.fill(PLAIN); P.ink(.5);
    x.beginPath(); x.moveTo(-.27, neck(.5)); x.lineTo(-.07, neck(0)); x.lineTo(-.012, .8); x.lineTo(-.27, .68); x.closePath(); P.fill(ED); P.ink(.6);
    x.beginPath(); x.moveTo(.27, neck(.5)); x.lineTo(.07, neck(0)); x.lineTo(.012, .8); x.lineTo(.27, .68); x.closePath(); P.fill(ED); P.ink(.6);
    for (const [a, b] of [[-.11, .86], [.11, .86], [-.11, .98], [.11, .98]]) { x.beginPath(); x.arc(a, b, .017, 0, 7); P.fill(BTN); P.ink(.4); }
    P.band(() => .79, () => .84); P.fill(ED); P.ink(.5); x.beginPath(); x.rect(-.042, .778, .084, .074); P.fill(PAPER); P.ink(.5); x.beginPath(); x.rect(-.022, .796, .044, .038); P.fill(INKC);
    x.beginPath(); x.moveTo(0, .84); x.lineTo(0, 1.06); P.ink(.6);
    x.beginPath(); x.arc(-.17, .67, .038, 0, 7); P.fill(GRN); P.ink(.5); x.beginPath(); x.arc(-.17, .67, .02, 0, 7); P.fill('#da9643');
    P.band(neck, coll); P.fill(PAPER); P.ink(.6); });
  P.wrap(() => { P.line(neck); P.ink(1); });
  const vb = 0.13; P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, vb + 0.05); }, INKC, () => {}); P.wrap(() => { P.line(() => vb); P.ink(.9); });
  const tails = [-1, 1].map(s => capeCloth(H, { name: 'ink-coat-tail', color: INKC, lining: ED, center: Math.PI + s * 0.5, half: q => 0.55 + 0.15 * q, top: () => 0.8, bottom: u => 1.12 - 0.04 * (u * s + 1), off: 0.03, flare: 0.05, cols: 7, rows: 6, half_: 'bottom', gravity: 0.5, wind: 3.2 }));
  const ink = H.paint(INKC), band = H.paint(PAPER), cyl = new T.CylinderGeometry(1, 1, 1, 28), g = new T.Group(), brim = H.outlined(cyl, ink), crown = H.outlined(cyl, ink), bd = H.outlined(cyl, band); g.add(brim); g.add(crown); g.add(bd);
  return { canvas: P.c, parts: [g, ...tails.map(m => m.part)], partsBottom: tails.map(m => m.part), puff: (t, th) => t < vb + .01 ? .03 * W : t >= neck(th) ? .03 : 0,
    update(K, dt, time) { tails.forEach(m => m.update(K, dt, time)); const { c } = H.ring(.03); brim.position.set(c.x, c.y - .075, c.z); brim.scale.set(.6, .03, .48); crown.position.set(c.x, c.y + .02, c.z); crown.scale.set(.31, .17, .27); bd.position.set(c.x, c.y - .035, c.z); bd.scale.set(.325, .05, .285); } };
}

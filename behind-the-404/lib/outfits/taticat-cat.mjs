// cat potato (3D): Taticat's look, found in the 404. A grey tabby onesie with a white belly, a red collar and gold bell, ears on his
// head and a striped tail behind him. No arms, no hands, his face stays his.
import { painter, fu, W, RM, ARC } from '../outfits3d.mjs';
export default function build(H) {
  const P = painter(), { x } = P, T = H.T;
  const FUR = '#8d919c', DARK = '#565a66', BELLY = '#ece6da', RED = '#c8262b', GOLD = '#e5b83c', PINK = '#e9a3ad';
  const neck = th => 0.62 + 0.09 * fu(th, 0.6), collar = th => neck(th) + 0.04;
  P.shadow(neck);
  P.region(() => P.below(neck), FUR, () => {
    for (let i = 0; i < 14; i++) { const a = -ARC / 2 + (i + .5) * ARC / 14; if (Math.abs(a) < 0.2) continue; x.beginPath(); x.moveTo(a - .05, .66); x.lineTo(a + .02, .84); x.lineTo(a + .05, .66); x.closePath(); P.fill(DARK); }
    x.beginPath(); x.ellipse(0, 0.9, 0.17, 0.25, 0, 0, 7); P.fill(BELLY); P.ink(0.4);
    P.band(neck, collar); P.fill(RED); P.ink(0.55);
    x.beginPath(); x.arc(0, collar(0) + 0.025, 0.036, 0, 7); P.fill(GOLD); P.ink(0.55);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  const fur = H.paint(FUR), dark = H.paint(DARK), pink = H.paint(PINK), group = new T.Group();
  const cone = new T.ConeGeometry(1, 1.5, 24), sph = new T.SphereGeometry(1, 20, 14);
  const ears = [-1, 1].map(() => { const g = H.outlined(cone, fur), p = new T.Mesh(cone, pink); group.add(g); group.add(p); return { g, p }; });
  const tail = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const g = H.outlined(sph, (i >> 1) % 2 ? dark : fur); group.add(g); return g; });
  return { canvas: P.c, parts: [group], puff: (t, th) => t >= neck(th) ? 0.016 : 0,
    update(t = 0) { const { c } = H.ring(0.03), y = c.y;
      ears.forEach(({ g, p }, i) => { const s = i ? 1 : -1; g.position.set(c.x + s * 0.2, y + 0.07, c.z + 0.02); g.rotation.z = -s * 0.32; g.scale.set(0.15, 0.15, 0.08);
        p.position.set(c.x + s * 0.2, y + 0.055, c.z + 0.09); p.rotation.z = -s * 0.32; p.scale.set(0.085, 0.09, 0.02); });
      tail.forEach((g, i) => { const k = i / 9; g.position.set(0.4 + k * 0.17 - k * k * 0.07, 0.2 + k * 0.56, -0.2); g.scale.setScalar(0.075 - k * 0.02); }); } };
}

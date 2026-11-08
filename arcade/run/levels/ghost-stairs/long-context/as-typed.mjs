// as-typed (agent costume, The Long Context): a night postman. Navy jacket, brass buttons, a satchel strap across him and the satchel at his side with one coral letter sticking out, a peaked cap.
// No arms, no words, no brand. Builder (revise), team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/.
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const COAT = '#27304f', COAT2 = '#36426a', BRASS = '#d9b45a', STRAP = '#6b4a2c', BAG = '#7c5a36', LETTER = '#f0675a', CAP = '#1f2740';
  const neck = th => 0.68 + 0.08 * Math.exp(-(th * th) / 0.10) - 0.03 * (1 - Math.cos(th)) / 2;
  P.region(() => P.below(neck), COAT, () => {
    P.band(neck, th => neck(th) + 0.03); P.fill(COAT2);
    for (const v of [0.80, 0.87, 0.94]) P.dot(0.06, v, 0.016, BRASS);
    x.beginPath(); x.moveTo(0, neck(0)); x.lineTo(0, 1.02); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the strap, running across him to the satchel at his left
  P.wrap(() => { P.strip(-0.2, 1.05, th => 0.72 + (th + 1.25) * 0.09, th => 0.76 + (th + 1.25) * 0.09); P.fill(STRAP); P.ink(0.4); });
  // the satchel, and one letter that came back
  P.wrap(() => { P.strip(0.95, 0.09, th => 0.76, th => 0.81); P.fill(LETTER); P.ink(0.4); });
  P.wrap(() => { P.strip(0.95, 0.26, th => 0.8, th => 0.97); P.fill(BAG); P.ink(0.6); });
  // the cap band, high on his brow, clear of his eyes
  const s1 = th => 0.125 + 0.012 * (1 - Math.cos(th)), s2 = th => s1(th) + 0.04;
  P.wrap(() => { P.band(s1, s2); P.fill(CAP); P.ink(0.55); });
  const shade = new T.Group();
  const peak = H.outlined(new T.CylinderGeometry(0.30, 0.30, 0.018, 28, 1, false, -Math.PI * 0.5, Math.PI), H.paint('#141a2e'), 0.4);
  peak.rotation.x = 0.2; shade.add(peak);
  const crown = new T.Group(); const top = H.outlined(new T.CylinderGeometry(0.34, 0.27, 0.13, 28), H.paint(CAP), 0.45); crown.add(top);
  const dv = 0.145;
  return { canvas: P.c, parts: [shade, crown],
    puff: (t, th) => t > neck(th) ? 0.016 : (t > s1(th) && t < s2(th) ? 0.006 : 0),
    update() { const { c, pts: ring } = H.ring(dv), n = ring.length, b = ring[Math.floor(n / 2)];
      const r = Math.hypot(b.x - c.x, b.z - c.z); shade.position.set(c.x, b.y, c.z); shade.lookAt(2 * b.x - c.x, b.y, 2 * b.z - c.z); shade.scale.set(r * 1.04 / 0.30, 1, (r + 0.17) / 0.30);
      crown.position.set(c.x, b.y + 0.1, c.z); crown.scale.set(r * 1.08 / 0.27, 1, r * 1.08 / 0.27); },
  };
}

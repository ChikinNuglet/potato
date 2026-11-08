// edited (agent costume, The Long Context): a copy editor's green eyeshade and waistcoat, a red pencil behind the band, unused.
// No arms, no words. Comedian, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/.
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const VEST = '#4a4650', VEST2 = '#5c5764', BAND = '#1f6b4a', BTN = '#c9a7ff';
  const neck = th => 0.70 + 0.10 * Math.exp(-(th * th) / 0.10) - 0.03 * (1 - Math.cos(th)) / 2;
  P.region(() => P.below(neck), VEST, () => {
    P.band(neck, th => neck(th) + 0.03); P.fill(VEST2);
    for (const v of [0.84, 0.90, 0.96]) P.dot(0, v, 0.018, BTN);
    x.beginPath(); x.moveTo(0, neck(0)); x.lineTo(0, 1.02); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the eyeshade band, high on his brow, clear of his eyes
  const s1 = th => 0.125 + 0.012 * (1 - Math.cos(th)), s2 = th => s1(th) + 0.04;
  P.wrap(() => { P.band(s1, s2); P.fill(BAND); P.ink(0.55); });
  // the shade: a flat green peak off the front of the band
  const shade = new T.Group();
  const peak = H.outlined(new T.CylinderGeometry(0.30, 0.30, 0.018, 28, 1, false, -Math.PI * 0.5, Math.PI), H.paint('#2c9a68'), 0.4);
  peak.rotation.x = 0.2; shade.add(peak);
  // the pencil, tucked into the band at the side, sticking up and back
  const pencil = new T.Group();
  const stick = H.outlined(new T.CylinderGeometry(0.016, 0.016, 0.3, 8), H.paint('#d2452f'), 0.3); pencil.add(stick);
  const lead = H.outlined(new T.ConeGeometry(0.016, 0.04, 8), H.paint('#e8c896'), 0.25); lead.position.y = 0.17; pencil.add(lead);
  const dv = 0.145;
  return { canvas: P.c, parts: [shade, pencil],
    puff: (t, th) => t > neck(th) ? 0.016 : (t > s1(th) && t < s2(th) ? 0.006 : 0),
    update() { const { c, pts: ring } = H.ring(dv), n = ring.length, b = ring[Math.floor(n / 2)], s = ring[Math.floor(n * 0.72)];
      const r = Math.hypot(b.x - c.x, b.z - c.z); shade.position.set(c.x, b.y, c.z); shade.lookAt(2 * b.x - c.x, b.y, 2 * b.z - c.z); shade.scale.set(r * 1.04 / 0.30, 1, (r + 0.17) / 0.30);
      pencil.position.set(s.x, s.y + 0.03, s.z); pencil.rotation.set(-0.5, 0, 0.75); } };
}

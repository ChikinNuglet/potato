// nearly-answered (agent costume, The Long Context): the night caretaker of a block of flats. Grey-green work coat, a belt, a ring of keys at his side with one coral tag, a flat cap.
// The one who goes down every stair last and checks the lights. No arms, no words, no brand. Foreman, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/.
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const COAT = '#3f4f46', COAT2 = '#54675b', BRASS = '#c9b98a', STRAP = '#2a1f16', BAG = '#b9bcc0', LETTER = '#f0675a', CAP = '#2e3a34';
  const neck = th => 0.68 + 0.08 * Math.exp(-(th * th) / 0.10) - 0.03 * (1 - Math.cos(th)) / 2;
  P.region(() => P.below(neck), COAT, () => {
    P.band(neck, th => neck(th) + 0.03); P.fill(COAT2);
    for (const v of [0.80, 0.87, 0.94]) P.dot(0.06, v, 0.016, BRASS);
    x.beginPath(); x.moveTo(0, neck(0)); x.lineTo(0, 1.02); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the belt, level round him
  P.wrap(() => { P.band(th => 0.82, th => 0.85); P.fill(STRAP); P.ink(0.4); });
  // the ring of keys at his side, one coral tag
  P.wrap(() => { P.dot(0.72, 0.86, 0.024, BAG); P.ink(0.4); });
  P.wrap(() => { P.strip(0.62, 0.05, th => 0.875, th => 0.945); P.fill(BAG); P.ink(0.4); });
  P.wrap(() => { P.strip(0.72, 0.05, th => 0.885, th => 0.965); P.fill(BAG); P.ink(0.4); });
  P.wrap(() => { P.strip(0.82, 0.07, th => 0.875, th => 0.93); P.fill(LETTER); P.ink(0.4); });
  // the cap band, high on his brow, clear of his eyes
  const s1 = th => 0.125 + 0.012 * (1 - Math.cos(th)), s2 = th => s1(th) + 0.04;
  P.wrap(() => { P.band(s1, s2); P.fill(CAP); P.ink(0.55); });
  const shade = new T.Group();
  const peak = H.outlined(new T.CylinderGeometry(0.30, 0.30, 0.018, 28, 1, false, -Math.PI * 0.5, Math.PI), H.paint('#25302a'), 0.4);
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

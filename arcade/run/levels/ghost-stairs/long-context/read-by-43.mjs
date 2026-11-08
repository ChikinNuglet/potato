// read-by-43 (agent costume, The Long Context): a plum dressing gown, tied at the front, and a head torch switched on. Someone who went out in what they had on, to look.
// No arms, no words. Writer, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/ (import path below is for there).
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const GOWN = '#6b3a5e', LAPEL = '#8a5078', BELT = '#3f2238', STRAP = '#2b2a2e';
  // the neckline: a deep V at the front, up round the back of his neck
  const neck = th => 0.71 + 0.08 * Math.exp(-(th * th) / 0.16) - 0.04 * (1 - Math.cos(th)) / 2;
  const lapel = th => neck(th) + 0.04;
  const belt = () => 0.875, belt2 = () => 0.915;
  P.region(() => P.below(neck), GOWN, () => {
    P.band(neck, lapel); P.fill(LAPEL);
    P.band(belt, belt2); P.fill(BELT); P.ink(0.5);
    x.beginPath(); x.moveTo(0, neck(0)); x.lineTo(0, 0.875); P.ink(0.55);      // where the two sides of the gown cross
    x.beginPath(); x.moveTo(0, 0.915); x.lineTo(0.02, 1.02); P.ink(0.55);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the head torch strap, high on his brow, clear of his eyes
  const s1 = th => 0.135 + 0.012 * (1 - Math.cos(th)), s2 = th => s1(th) + 0.04;
  P.wrap(() => { P.band(s1, s2); P.fill(STRAP); P.ink(0.55); });
  // the torch
  const lamp = new T.Group(); const body = H.paint('#39383d'), glass = H.paint('#ffe2a0');
  const cup = H.outlined(new T.CylinderGeometry(0.058, 0.05, 0.06, 16), body, 0.35); cup.rotation.x = Math.PI / 2; cup.position.z = 0.02; lamp.add(cup);
  const face = H.outlined(new T.CylinderGeometry(0.044, 0.044, 0.012, 16), glass, 0.2); face.rotation.x = Math.PI / 2; face.position.z = 0.054; lamp.add(face);
  const dv = 0.155; lamp.scale.setScalar(1.7);
  return { canvas: P.c, parts: [lamp],
    puff: (t, th) => t > neck(th) ? 0.016 : (t > s1(th) && t < s2(th) ? 0.006 : 0),
    update() { const { c, pts: ring } = H.ring(dv), b = ring[Math.floor(ring.length / 2)];
      lamp.position.set(b.x, b.y, b.z); lamp.lookAt(2 * b.x - c.x, b.y, 2 * b.z - c.z); } };
}

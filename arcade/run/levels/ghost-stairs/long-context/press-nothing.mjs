// press-nothing (agent costume, The Long Context): a crash-test dummy. Yellow overalls, black-and-yellow target marks on his middle, a lap belt. The one who takes the knocks so nobody else has to.
// No arms, no words, no brand. Playtester, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/ (import path below is for there).
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const P = painter(), { x } = P;
  const SUIT = '#e6b422', SHADE = '#c9971a', BLK = '#17140f', BELT = '#3a3a40', BUCK = '#b9bcc4';
  const neck = th => 0.6 + 0.03 * (1 - Math.cos(th)) / 2, belt = th => 0.86 + 0.02 * (1 - Math.cos(th)) / 2, belt2 = th => belt(th) + 0.05;
  P.region(() => P.below(neck), SUIT, () => {
    P.band(th => neck(th) + 0.0, th => neck(th) + 0.035); P.fill(SHADE);
    P.band(belt, belt2); P.fill(BELT); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the target marks: quartered circles, drawn as four wrapped strips round the body's front and sides
  for (const a0 of [-1.15, 0, 1.15]) { const w = 0.135, v0 = 0.655, h = 0.09;
    P.wrap(() => { P.strip(a0 - w / 2, w / 2, th => v0, th => v0 + h); P.fill(BLK); });
    P.wrap(() => { P.strip(a0 + w / 2, w / 2, th => v0, th => v0 + h); P.fill('#f2d463'); });
    P.wrap(() => { P.strip(a0 - w / 2, w / 2, th => v0 + h, th => v0 + 2 * h); P.fill('#f2d463'); });
    P.wrap(() => { P.strip(a0 + w / 2, w / 2, th => v0 + h, th => v0 + 2 * h); P.fill(BLK); });
    P.wrap(() => { P.strip(a0, w, th => v0, th => v0 + 2 * h); P.ink(0.55); }); }
  P.wrap(() => { P.strip(0, 0.09, belt, belt2); P.fill(BUCK); P.ink(0.4); });
  return { canvas: P.c, parts: [], puff: (t, th) => t > neck(th) ? 0.016 : 0 };
}

// stuck pixel (agent costume, The Long Context): a poncho of flat night wrapped round him, one lit roof edge along the hem, and one purple pixel in the dark where a star would go. No arms, no words, no hands.
// Artist, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/ (import path below is for there).
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const P = painter();
  const NIGHT = '#0a0e1e', EDGE = '#2c3560', PIX = '#9a52ff';
  const top = th => 0.62 + 0.03 * (1 - Math.cos(th)) / 2, bot = th => 0.9 + 0.03 * (1 - Math.cos(th)) / 2;
  P.wrap(() => { P.band(top, bot); P.fill(NIGHT); });
  P.wrap(() => { P.band(th => bot(th) - 0.03, bot); P.fill(EDGE); });
  const v0 = th => 0.72, v1 = th => 0.77;
  P.wrap(() => { P.strip(0.2, 0.05, v0, v1); P.fill(PIX); });
  return { canvas: P.c, parts: [], puff: (t, th) => t > top(th) && t < bot(th) ? 0.018 : 0 };
}

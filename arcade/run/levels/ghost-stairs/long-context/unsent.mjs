// unsent (agent costume, The Long Context): three rows of grey keys wrapped round his middle, one key lit purple at the front, where his foot would be. No arms, no words, no hands.
// Builder, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/ (import path below is for there).
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const P = painter(), { x } = P;
  const CASE = '#26262b', KEY = '#4a4a52', KEY2 = '#5e5e68', LIT = '#9a52ff';
  const top = th => 0.6 + 0.03 * (1 - Math.cos(th)) / 2, bot = th => 0.88 + 0.03 * (1 - Math.cos(th)) / 2;
  P.wrap(() => { P.band(top, bot); P.fill(CASE); P.ink(0.8); });
  const rows = 3, n = 16, rh = 0.082;
  for (let r = 0; r < rows; r++) for (let k = 0; k < n; k++) {
    const a = -Math.PI + (k + 0.5 + (r % 2) * 0.5) * 2 * Math.PI / n, w = Math.PI / n * 0.8, v0 = th => top(th) + 0.018 + r * (rh + 0.006), v1 = th => v0(th) + rh;
    const lit = r === 1 && k === Math.floor(n / 2);
    P.wrap(() => { P.strip(a, w, v0, v1); P.fill(lit ? LIT : r === 0 ? KEY2 : KEY); P.ink(0.32); });
  }
  return { canvas: P.c, parts: [], puff: (t, th) => t > top(th) && t < bot(th) ? 0.016 : 0 };
}

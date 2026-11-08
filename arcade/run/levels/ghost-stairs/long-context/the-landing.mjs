// the-landing (agent costume, The Long Context): a stair carpet laid over him, down his back and down his front, held by brass rods.
// No arms, no words. Level designer, team Downstairs Neighbours, Nov 6. Builder format of potato3d/outfits. Goes in potato3d/agent-costumes/ (import path below is for there).
import { painter } from '../outfits3d.mjs';

export default function build(H) {
  const P = painter(), { x } = P;
  const RED = '#7d2a2e', DARK = '#561c22', GOLD = '#c9963f', LIGHT = '#f0cf7e';
  const front = v => () => v, WB = 0.62, WF = 0.34;      // the front stays narrow and low, well clear of his mouth
  const runner = (a, W, top, bot, rods) => P.wrap(() => {
    P.strip(a, W, front(top), front(bot)); P.fill(RED); x.save(); x.clip();
    P.strip(a, W * 0.84, front(top), front(bot)); x.lineWidth = 0.012; x.strokeStyle = DARK; x.stroke();     // the carpet's woven edge
    x.restore(); P.strip(a, W, front(top), front(bot)); P.ink(0.8);
    for (const v of rods) { P.strip(a, W + 0.05, front(v), front(v + 0.024)); P.fill(GOLD); P.ink(0.45);       // a brass rod, a little wider than the carpet
      P.strip(a, W + 0.05, front(v + 0.004), front(v + 0.01)); P.fill(LIGHT); }
  });
  runner(0, WF, 0.79, 1.03, [0.83, 0.92]);
  runner(Math.PI, WB, 0.02, 1.03, [0.16, 0.34, 0.52, 0.7, 0.88]);
  return { canvas: P.c, parts: [], puff: (t, th) => { const a = Math.abs(th), back = Math.PI - a; return (a < WF && t > 0.79) || back < WB ? 0.012 : 0; } };
}

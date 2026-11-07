// santa (3D): Potato's Santa look for his own room. Red coat with white trim, a black belt and gold buckle, and a floppy red hat
// with a white band and bobble. No arms, no hands; a hook-on beard, so his face stays his.
import { painter, fu, W, INKU, RM, ARC, clamp } from '../outfits3d.mjs';
export default function build(H) {
  const P = painter(), { x } = P, T = H.T;
  const RED = '#c8262b', DEEP = '#9a1a1f', WHITE = '#f7f2e8', BLACK = '#16121a', GOLD = '#e5b83c';
  const neck = th => 0.62 + 0.09 * fu(th, 0.6), collar = th => neck(th) + 0.035, belt0 = 0.84, belt1 = 0.895;
  P.shadow(neck);
  P.region(() => P.below(neck), RED, () => {
    P.band(neck, collar); P.fill(WHITE); P.ink(0.55);
    x.beginPath(); x.rect(-0.05, collar(0), 0.1, 0.4); P.fill(WHITE);                       // the white strip down his front
    x.beginPath(); x.moveTo(-0.05, collar(0)); x.lineTo(-0.05, 1.02); x.moveTo(0.05, collar(0)); x.lineTo(0.05, 1.02); P.ink(0.5);
    P.band(() => belt0, () => belt1); P.fill(BLACK); P.ink(0.5);
    x.beginPath(); x.rect(-0.055, belt0 - 0.008, 0.11, belt1 - belt0 + 0.016); P.fill(GOLD); P.ink(0.55);
    x.beginPath(); x.rect(-0.026, belt0 + 0.012, 0.052, belt1 - belt0 - 0.024); P.fill(BLACK);
    P.band(() => 0.965, () => 1.05); P.fill(WHITE); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // a shopping-mall Santa beard: it hooks over his ears on thin straps, runs round his jaw and hangs down off his chin, with his mouth left clear
  P.wrap(() => { const puffs = []; for (let i = 0; i <= 16; i++) { const a = -1.32 + i * 2.64 / 16, u = Math.sin(a) * .38; for (const k of [1, .72]) puffs.push([u * (k === 1 ? 1 : .86), .5 + Math.cos(a) * .34 * k + (k === 1 ? .1 : .12), k === 1 ? .062 : .055]); }
    const blob = o => { x.beginPath(); for (const [a, b, r] of puffs) { x.moveTo(a + r + o, b); x.arc(a, b, r + o, 0, 7); } }; x.beginPath(); x.moveTo(-.37, .5); x.lineTo(-.335, .2); x.moveTo(.37, .5); x.lineTo(.335, .2); x.lineWidth = .012; x.strokeStyle = '#efe8da'; x.stroke(); blob(.011); x.fillStyle = '#120a05'; x.fill(); blob(0); x.fillStyle = WHITE; x.fill(); x.beginPath(); for (let i = 0; i < 9; i++) { const q = -.26 + i * .065, y = .79 - Math.abs(q) * .36; x.moveTo(q - .018, y); x.quadraticCurveTo(q, y + .03, q + .018, y); } x.lineWidth = .008; x.strokeStyle = '#c9c0b0'; x.stroke(); });
  // the hat: his head painted red above a band, the band soft white
  const vb = 0.2, top = 0.135;
  P.region(() => { x.beginPath(); x.rect(-ARC / 2, -0.05, ARC, vb + 0.05); }, RED, () => {
    x.beginPath(); x.rect(-ARC / 2, top, ARC, vb - top); P.fill(WHITE); });
  P.wrap(() => { P.line(() => top); P.ink(0.6); P.line(() => vb); P.ink(1); });
  // the floppy tail + bobble ride his head
  const red = H.paint(RED), wh = H.paint(WHITE), sph = new T.SphereGeometry(1, 24, 16), group = new T.Group();
  const tail = [0, 1, 2, 3].map(() => { const g = H.outlined(sph, red); group.add(g); return g; });
  const ball = H.outlined(sph, wh); group.add(ball);
  return { canvas: P.c, parts: [group],
    puff: (t, th) => t < vb + 0.01 ? (t > top ? 0.05 : 0.03) * W : t >= neck(th) ? 0.016 : 0,
    update() { const { c } = H.ring(0.03), y = c.y;
      const pts = [[0, 0.07, 0.2], [0.13, 0.12, 0.15], [0.26, 0.08, 0.1], [0.34, -0.03, 0.07]];
      tail.forEach((g, i) => { const [dx, dy, r] = pts[i]; g.position.set(c.x + dx, y + dy, c.z); g.scale.set(r, r * 0.8, r); });
      ball.position.set(c.x + 0.38, y - 0.11, c.z); ball.scale.setScalar(0.075); } };
}

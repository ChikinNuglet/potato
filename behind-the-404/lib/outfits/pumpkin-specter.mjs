// PUMPKIN SPECTER (3D port of draw/outfits/pumpkin-specter.js, Chat's 006): a ribbed orange pumpkin cap over the top of
// his head — eight bulging segments with dark ribs between them, its rim hanging down in a soft lobe at each segment — a
// curly green stem and tendril on top (3D); and a short segmented pumpkin skirt-vest round his lower half (ten bulging
// segments) with a collar of green leaves standing up round the neckline. No carved face: his own face stays.
import { painter, W, INKU, INK, RM, ARC, clamp, lerp } from '../outfits3d.mjs';

const OR = '#f2801c', OR_HI = 'rgba(255,190,90,0.55)', RIB = 'rgba(165,60,0,0.55)', LEAF = '#5da83a', LEAF_D = '#3f7f25', STEM = '#4f9a2c';
const TAU = Math.PI * 2;

// (helpers, copied per file) taper: a tapered tube along a smooth curve with a rounded tip; mask: (t, th) -> painted?
export function taper(T, pts, r0, prof = k => Math.pow(1 - k, 0.85), S = 28, R = 14) {
  const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p))), pos = [], idx = [];
  const frames = curve.computeFrenetFrames(S, false);
  for (let k = 0; k <= S; k++) { const c = curve.getPointAt(k / S), n = frames.normals[k], b = frames.binormals[k], r = Math.max(0.004, r0 * prof(k / S));
    for (let j = 0; j < R; j++) { const a = j / R * Math.PI * 2; pos.push(c.x + r * (Math.cos(a) * n.x + Math.sin(a) * b.x), c.y + r * (Math.cos(a) * n.y + Math.sin(a) * b.y), c.z + r * (Math.cos(a) * n.z + Math.sin(a) * b.z)); } }
  const tip = curve.getPointAt(1), tan = curve.getTangentAt(1), base = curve.getPointAt(0), tan0 = curve.getTangentAt(0);
  pos.push(tip.x + tan.x * 0.006, tip.y + tan.y * 0.006, tip.z + tan.z * 0.006); const TIP = (S + 1) * R;
  pos.push(base.x - tan0.x * r0 * 0.6, base.y - tan0.y * r0 * 0.6, base.z - tan0.z * r0 * 0.6); const BASE = TIP + 1;
  for (let k = 0; k < S; k++) for (let j = 0; j < R; j++) { const a = k * R + j, b = k * R + (j + 1) % R, c = a + R, d = b + R; idx.push(a, b, c, b, d, c); }
  for (let j = 0; j < R; j++) { idx.push(S * R + j, S * R + (j + 1) % R, TIP); idx.push(BASE, (j + 1) % R, j); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
export function mask(draw) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  for (const o of [-ARC, 0, ARC]) { x.setTransform(512 / ARC, 0, 0, 256, 256 + o * 512 / ARC, 0); x.fillStyle = '#fff'; draw(x); }
  const d = x.getImageData(0, 0, 512, 256).data;
  return (t, th) => { const i = clamp(Math.floor((th * RM / ARC + 0.5) * 512), 0, 511), j = clamp(Math.floor(t * 256), 0, 255); return d[(j * 512 + i) * 4 + 3] > 100; };
}

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;
  const kr = v => RM / ((H.rx(clamp(v, 0.05, 0.97)) + H.rz(clamp(v, 0.05, 0.97))) / 2);
  const seg = (th, n) => Math.pow(Math.abs(Math.sin(th * n / 2)), 0.6);    // 1 mid-segment, 0 on a rib

  // ================= the skirt-vest =================
  const neck = th => 0.73 + 0.022 * Math.cos(th), NV = 10;
  P.shadow(neck);
  P.region(() => P.below(neck), OR, () => {
    for (let i = 0; i < NV; i++) { const a = -Math.PI + (i + 0.5) / NV * TAU; x.beginPath(); x.moveTo(a * RM, neck(a) + 0.02); x.lineTo(a * RM, 1.0); x.lineWidth = 0.05 * W; x.strokeStyle = OR_HI; x.stroke(); }
    for (let i = 0; i < NV; i++) { const a = -Math.PI + i / NV * TAU; x.beginPath(); x.moveTo(a * RM, neck(a)); x.lineTo(a * RM, 1.05); x.lineWidth = 0.03 * W; x.strokeStyle = RIB; x.stroke(); P.ink(0.45); }
    const g = x.createLinearGradient(0, 0.88, 0, 1.03); g.addColorStop(0, 'rgba(150,50,0,0)'); g.addColorStop(1, 'rgba(150,50,0,0.3)'); x.fillStyle = g; x.fillRect(-ARC, 0.85, 2 * ARC, 0.25);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });
  // the leaf collar: 12 leaves on the neckline, tilted alternately, standing up onto him
  const leaves = [];
  for (let i = 0; i < 12; i++) { const a = -Math.PI + i / 12 * TAU + 0.1; leaves.push({ X: a * RM, v: neck(a) + 0.006, tilt: i % 2 ? 0.25 : -0.25, k: kr(neck(a)) }); }
  const leafPath = (c, L) => { const lw = 0.11 * W * L.k * 0.9, lh = 0.07; c.save(); c.translate(L.X, L.v); c.rotate(L.tilt * 0.5);
    c.beginPath(); c.moveTo(-lw, 0); c.quadraticCurveTo(-lw * 0.3, -lh * 1.1, lw * 0.15, -lh * 0.15); c.quadraticCurveTo(lw * 0.5, -lh * 0.6, lw, 0); c.quadraticCurveTo(lw * 0.1, lh * 1.3, -lw, 0); c.closePath(); };
  P.wrap(() => { for (const L of leaves) { leafPath(x, L); P.fill(LEAF); P.ink(0.6);
    const lw = 0.11 * W * L.k * 0.9, lh = 0.07; x.beginPath(); x.moveTo(-lw * 0.7, 0.05 * lh); x.quadraticCurveTo(0, lh * 0.35, lw * 0.6, 0.1 * lh); x.lineWidth = INKU * 0.35; x.strokeStyle = LEAF_D; x.stroke(); x.restore(); } });
  const inLeaf = mask(c => { for (const L of leaves) { leafPath(c, L); c.fill(); c.restore(); } });

  // ================= the pumpkin cap =================
  const NC = 8, VB = 0.25, bot = th => VB + 0.03 * seg(th, NC);
  P.region(() => P.above(bot), OR, () => {
    for (let i = 0; i < NC; i++) { const a = -Math.PI + (i + 0.5) / NC * TAU; x.beginPath(); x.moveTo(a * RM, bot(a)); x.lineTo(a * RM, 0.0); x.lineWidth = 0.05 * W; x.strokeStyle = OR_HI; x.stroke(); }
    for (let i = 0; i < NC; i++) { const a = -Math.PI + i / NC * TAU; x.beginPath(); x.moveTo(a * RM, bot(a)); x.lineTo(a * RM, -0.02); x.lineWidth = 0.03 * W; x.strokeStyle = RIB; x.stroke(); P.ink(0.45); }
    const g = x.createLinearGradient(0, 0.12, 0, VB + 0.03); g.addColorStop(0, 'rgba(150,50,0,0)'); g.addColorStop(1, 'rgba(150,50,0,0.25)'); x.fillStyle = g; x.fillRect(-ARC, 0.1, 2 * ARC, 0.2);
  });
  P.wrap(() => { P.line(bot); P.ink(1); });

  // ================= the stem + tendril (3D, on top) =================
  const stem = new T.Group();
  stem.add(H.outlined(taper(T, [[0, -0.03, 0], [-0.005, 0.03, 0], [0.01, 0.07, 0], [0.045, 0.095, 0]], 0.038 * W, k => 1 - 0.35 * k, 16), H.paint(STEM), 0.8));
  stem.add(H.outlined(taper(T, [[0.04, 0.09, 0], [0.11, 0.13, 0.01], [0.17, 0.09, 0.02], [0.15, 0.04, 0.03], [0.11, 0.05, 0.03]], 0.016 * W, k => 1 - 0.6 * k), H.paint(STEM), 0.65));
  const CAP = th => 0.045 * W + 0.025 * W * seg(th, NC);

  return { canvas: P.c, parts: [stem],
    puff: (t, th) => {
      if (t < bot(th) + 0.004) { const e = clamp((bot(th) + 0.004 - t) / 0.03); return CAP(th) * (1 - 0.3 * clamp((0.06 - t) / 0.06)) * (0.35 + 0.65 * e * e * (3 - 2 * e)); }   // a short ramp at the lobed rim (a hard step staircased across his rows)
      if (inLeaf(t, th)) return 0.03;
      if (t < neck(th)) return 0;
      return 0.018 + 0.01 * seg(th, NV); },
    update() { const tp = H.top(); stem.position.set(tp.x, tp.y + 0.03, tp.z); } };
}

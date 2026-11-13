// mad-scientist (3D) — ported from draw/outfits/mad-scientist.js.
// A pale lab coat round his lower half: purple lapels, a front edge with two buttons, a chest pocket with a purple top
// and a little green vial (glass tube, purple cap) peeking out of it, a purple hem. Wild swept white hair: a wig shell
// (his head puffed out white, swept grey strands, down to his brow at the front and lower round the sides and back,
// with a ragged zigzag edge and a soft shadow under it; his face stays clear) plus a mop of flame-shaped white tufts:
// real 3D tapered tufts flaring out of the shell all round the sides, back and top, curling as they go.
import { painter, fu, W, INKU, INK, RM, ARC, clamp, lerp } from '../outfits3d.mjs';

const PALE = '#f3f3f7', PURPLE = '#7e45dc', GREEN = '#43d063', GLASS = '#dfe9ef', WHITE = '#f6f6f8', GREY = 'rgba(95,95,130,0.8)';
const hsh = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };

export default function build(H) {
  const P = painter(), { x } = P, T = H.T, A = th => th * RM;
  const kr = v => RM / ((H.rx(clamp(v, 0.05, 0.97)) + H.rz(clamp(v, 0.05, 0.97))) / 2);
  const sst = k => { k = clamp(k); return k * k * (3 - 2 * k); };

  // ---------------- the lab coat ----------------
  const neck = th => 0.6 + 0.17 * fu(th, 0.78);
  const lap = th => { const tp = clamp((Math.abs(th) - 0.12) / 0.4); return 0.6 + 0.17 * lerp(fu(th, 0.78), fu(th, 1.08), tp) + 0.035 * tp; };
  P.shadow(neck);
  P.region(() => P.below(neck), PALE, () => {
    P.band(neck, lap); P.fill(PURPLE); P.line(lap); P.ink(0.55);
    x.beginPath(); x.moveTo(0, lap(0.01)); x.lineTo(0, 1.05); P.ink(0.6);
    for (const v of [0.86, 0.95]) { const R = 0.018 * W; x.beginPath(); x.ellipse(A(0.09), v, R * kr(v), R, 0, 0, 7); P.fill('#e4e4ea'); P.ink(0.4); }
    P.strip(0.75, 0.21, () => 0.865, () => 1.0); P.fill('#ececf1'); P.ink(0.5);
    // the vial (drawn before the pocket's top so it sits IN the pocket)
    { const cx = A(0.75), v = 0.86, s = 0.07 * W, k = 0.9;
      x.beginPath(); x.rect(cx - s * 0.22 * k, v - s * 1.0, s * 0.44 * k, s * 0.8); P.fill(GLASS); P.ink(0.5);
      x.beginPath(); x.ellipse(cx, v - s * 0.1, s * 0.4 * k, s * 0.32, 0, Math.PI, 0); x.closePath(); P.fill(GREEN); P.ink(0.5);
      x.beginPath(); x.rect(cx - s * 0.3 * k, v - s * 1.15, s * 0.6 * k, s * 0.22); P.fill(PURPLE); P.ink(0.5); }
    P.strip(0.75, 0.21, () => 0.857, () => 0.877); P.fill(PURPLE); P.ink(0.45);
    P.band(() => 0.945, () => 1.2); P.fill(PURPLE); P.line(() => 0.945); P.ink(0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  // ---------------- the wig shell ----------------
  const low = th => { const s = sst((Math.abs(th) - 0.75) / 1.1); return 0.2 + 0.28 * s + 0.085 * (1 - Math.abs(((th * 7 / Math.PI) % 2 + 2) % 2 - 1)) * (0.4 + 0.6 * s); };
  P.wrap(() => { x.save(); x.filter = `blur(${1024 * 0.008}px)`; P.line(th => low(th) + 0.01); x.lineWidth = 0.02; x.strokeStyle = 'rgba(28,13,6,0.25)'; x.stroke(); x.restore(); });
  P.region(() => P.above(low), WHITE, () => {
    for (let i = 0; i < 14; i++) { const a = -Math.PI + i * 0.45, v0 = 0.02 + 0.05 * hsh(i, 3), v1 = low(a) - 0.03;
      x.beginPath(); x.moveTo(A(a), v0); x.quadraticCurveTo(A(a + 0.25), (v0 + v1) / 2, A(a + 0.1), v1); x.lineWidth = INKU * 0.45; x.strokeStyle = 'rgba(60,60,80,0.5)'; x.stroke(); }   // (soft fold lines like the monk's: the grey strokes read as stray scribbles, Nov 5)
    const g = x.createLinearGradient(0, 0.1, 0, 0.5); g.addColorStop(0, 'rgba(110,110,150,0)'); g.addColorStop(1, 'rgba(110,110,150,0.18)'); x.fillStyle = g; x.fillRect(-ARC, 0, 2 * ARC, 0.6);
  });
  P.wrap(() => { P.line(low); P.ink(0.75); });

  // ---------------- the tufts (3D), relative to the top of his head ----------------
  const SH = 0.045, mop = new T.Group(), whiteP = H.paint(WHITE);
  const tuft = (p0, dir, side, len, r0) => {
    const up = new T.Vector3(0, 1, 0), sw = new T.Vector3().crossVectors(up, dir).normalize().multiplyScalar(side);
    const p1 = p0.clone().addScaledVector(dir, len * 0.45), p2 = p1.clone().addScaledVector(dir, len * 0.4).addScaledVector(sw, len * 0.2), p3 = p2.clone().addScaledVector(dir, len * 0.2).addScaledVector(sw, len * 0.25).add(new T.Vector3(0, len * 0.08, 0));
    const curve = new T.CatmullRomCurve3([p0.clone().addScaledVector(dir, -0.1), p0.clone().addScaledVector(dir, 0.02), p1, p2, p3]), S = 20, R = 10, g = new T.TubeGeometry(curve, S, 1, R, false), pos = g.attributes.position;
    for (let i = 0; i <= S; i++) { const c = curve.getPointAt(i / S), u = i / S, r = r0 * (u < 0.3 ? 0.6 + 0.4 * u / 0.3 : 1.0) * Math.pow(1 - u, 0.9) + 0.003;
      for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * r, c.y + (pos.getY(k) - c.y) * r, c.z + (pos.getZ(k) - c.z) * r); } }
    g.computeVertexNormals(); return H.outlined(g, whiteP, 0.8); };
  let j = 0;
  for (const [t, n, elev] of [[0.03, 7, 0.75], [0.11, 9, 0.45], [0.21, 10, 0.2], [0.31, 10, 0.0], [0.41, 9, -0.2]]) {
    for (let i = 0; i < n; i++, j++) {
      const a = -Math.PI + (i + 0.5 * (j % 2) + 0.3 * hsh(j, 5)) / n * Math.PI * 2;
      if (Math.abs(a) < (t < 0.08 ? 0.0 : 1.0) || low(a) < t + 0.03) continue;          // keep his face clear; only where the wig is
      const rx = H.rx(t) + SH * 0.6, rz = H.rz(t) + SH * 0.6, p0 = new T.Vector3(rx * Math.sin(a), -t, rz * Math.cos(a));
      const e = elev + (t < 0.08 ? 0 : 0.15 * (hsh(j, 7) - 0.5)), dir = new T.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e) * (t < 0.08 ? 0.6 : 1));
      if (t < 0.08) dir.z -= 0.35;                                                         // the top tufts sweep back
      else { if (Math.abs(Math.cos(a)) > 0.8) continue;                                     // none straight out of his back (a stub end-on)
        dir.applyAxisAngle(new T.Vector3(0, 1, 0), (j % 2 ? 1 : -1) * (0.5 + 0.4 * hsh(j, 9))); }   // swept round him, so no tuft reads as a dot end-on
      dir.normalize();
      const len = (0.11 + 0.11 * hsh(j, 1)) * (t < 0.08 ? 0.75 : 1) * (0.55 + 0.45 * Math.abs(Math.sin(a)));
      mop.add(tuft(p0, dir, hsh(j, 2) > 0.5 ? 1 : -1, len, 0.05));
    }
  }

  return { canvas: P.c, parts: [mop], split: 0.595,   // (wardrobe: under the hair's lowest edge 0.565, over the coat's 0.6)
    puff: (t, th) => t < low(th) ? SH : t >= neck(th) ? 0.016 : 0,
    update() { const top = H.top(), r = H.ring(0.17); mop.position.copy(top);
      const d = top.clone().sub(r.c); mop.rotation.set(Math.atan2(d.z, d.y) * 0.8, 0, -Math.atan2(d.x, d.y) * 0.8); } };
}

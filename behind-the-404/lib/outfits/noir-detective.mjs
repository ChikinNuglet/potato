// noir-detective (3D) — ported from draw/outfits/noir-detective.js.
// A stone trench coat with wide lapels, double-breasted dark buttons and a back vent, plus a charcoal fedora:
// the crown is his head puffed out into a real fedora shape (a rounded oval crown with a crease down the top,
// a black band round its foot), the brim is a solid ring riding his head, snapped down at the front.
import { painter, ringPts, loftGeo, fu, W, INKU, INK, RM, ARC, clamp, lerp } from '../outfits3d.mjs';

export default function build(H) {
  const P = painter(), { x } = P;
  const BEIGE = '#cbbd9c', LAPEL = '#a99876', BTN = '#3b2416';
  const GREY = '#4d4c52', DEEP = '#2b2a2f', BAND = '#141316';
  const COAT = 0.016;

  // ---------------- the fedora's crown: a target shape, his head puffed out onto it ----------------
  // depth d = body heights down from the top of his head (negative = above it); x/z across/front-back of his axis
  const VB = 0.12, HAT = VB + 0.006, BANDH = 0.055, BW = 0.15 * W;
  const RX = d => lerp(0.252, 0.314, clamp((d + 0.1) / 0.215)), RZ = d => RX(d) * 0.94;
  const D0 = 0.02;                                                   // the crown's rounded shoulder starts here
  const dTop = (x, z) => -0.105 + 0.05 * Math.exp(-((x / 0.075) ** 2)) * clamp(0.6 + 0.4 * Math.abs(z) / 0.25) + 0.02 * clamp(z / 0.25, 0, 1);
  const inside = (x, d, z) => { if (d > VB + 0.03) return true;
    const q = Math.hypot(x / RX(d), z / RZ(d)), top = dTop(x, z), qv = d < D0 ? (D0 - d) / (D0 - top) : 0;
    return Math.pow(q, 4) + Math.pow(Math.max(0, qv), 4) < 1; };
  const surf = (t, th) => [H.rx(t) * Math.sin(th), t, H.rz(t) * Math.cos(th)];   // (x, depth, z) on his undeformed body
  const normal = (t, th) => { const e = 0.002, a = surf(Math.max(0.001, t - e), th), b = surf(t + e, th), c = surf(t, th - e), f = surf(t, th + e);
    const dt = [b[0] - a[0], -(b[1] - a[1]), b[2] - a[2]], dth = [f[0] - c[0], 0, f[2] - c[2]];   // y up = -depth
    let n = [dt[1] * dth[2] - dt[2] * dth[1], dt[2] * dth[0] - dt[0] * dth[2], dt[0] * dth[1] - dt[1] * dth[0]];
    const p = surf(t, th); if (n[0] * p[0] + n[2] * p[2] + n[1] * 0.3 < 0) n = n.map(v => -v);
    const L = Math.hypot(...n) || 1; return n.map(v => v / L); };          // [nx, ny(up), nz]
  // march out along his normal until we leave the crown: that's the puff, and where we came out
  const hit = (t, th) => { const p = surf(t, th), n = normal(t, th); let s = 0;
    while (s < 0.3 && inside(p[0] + n[0] * s, p[1] - n[1] * s, p[2] + n[2] * s)) s += 0.0015;
    return { s, x: p[0] + n[0] * s, d: p[1] - n[1] * s, z: p[2] + n[2] * s, ny: n[1] }; };
  const cache = new Map(), hitC = (t, th) => { const k = t.toFixed(4) + ',' + th.toFixed(4); let h = cache.get(k); if (!h) cache.set(k, h = hit(t, th)); return h; };

  // ---------------- the coat ----------------
  const neck = th => 0.6 + 0.17 * fu(th, 0.78);
  const lap = th => { const tp = clamp((Math.abs(th) - 0.12) / 0.4); return 0.6 + 0.17 * lerp(fu(th, 0.78), fu(th, 1.1), tp) + 0.045 * tp; };
  P.shadow(neck);
  P.region(() => P.below(neck), BEIGE, () => {
    P.band(neck, lap); P.fill(LAPEL); P.ink(0.6);                                                     // lapels / collar
    x.beginPath(); x.moveTo(0.2 * RM, lap(0.2) - 0.01); x.lineTo(0.2 * RM, 1.02); P.ink(0.6);          // double-breasted overlap
    for (const v of [0.84, 0.93]) for (const a of [-0.25, 0.42]) P.dot(a, v, 0.022, BTN, H.rx(v));    // buttons
    x.beginPath(); x.moveTo(Math.PI * RM - 0.002, 0.8); x.lineTo(Math.PI * RM - 0.002, 1.02); P.ink(0.6);   // back vent
    x.beginPath(); x.moveTo(-Math.PI * RM + 0.002, 0.8); x.lineTo(-Math.PI * RM + 0.002, 1.02); P.ink(0.6);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  // ---------------- the crown's paint: texel by texel from where each spot lands on the crown ----------------
  { const NC = 320, dt = 0.0015, cw = ARC / NC + 0.002;
    for (let i = 0; i < NC; i++) { const th = -Math.PI + (i + 0.5) / NC * 2 * Math.PI;
      let bandEdge = null;
      for (let t = 0; t < HAT + 0.012; t += dt) { const h = hitC(+t.toFixed(4), +th.toFixed(4));
        const crease = Math.exp(-((h.x / 0.06) ** 2)) * clamp((0.0 - h.d) / 0.06);
        let col = h.d > VB - BANDH ? BAND : GREY;
        if (bandEdge === null && h.d > VB - BANDH) bandEdge = t;
        x.fillStyle = col; x.fillRect(th * RM - cw / 2, t - 0.0005, cw, dt + 0.001);
        if (col === GREY && crease > 0.05) { x.fillStyle = `rgba(20,18,26,${(0.55 * crease).toFixed(3)})`; x.fillRect(th * RM - cw / 2, t - 0.0005, cw, dt + 0.001); } }
      i % 1 === 0 && bandEdge !== null && (x.fillStyle = INK, x.fillRect(th * RM - cw / 2, bandEdge - 0.005, cw, 0.01)); } }

  // ---------------- the brim: a solid ring at the foot of the crown ----------------
  const ringT = (() => { const j = Math.round((VB - 0.012) / 0.976 * H.ROWS); return 0.012 + 0.976 * j / H.ROWS; })();
  const C1 = H.COLS + 1, inner = [], lift = [];
  for (let i = 0; i < C1; i++) { const th = i / H.COLS * 2 * Math.PI - Math.PI, p = surf(ringT, th), r = Math.hypot(p[0], p[2]), ux = p[0] / r, uz = p[2] / r;
    // how far out (horizontally) to the crown's oval at the band, from his head
    let s = 0; while (s < 0.3 && Math.hypot((p[0] + ux * s) / RX(VB), (p[2] + uz * s) / RZ(VB)) < 1) s += 0.001;
    inner.push(s - 0.008); const h = hitC(+ringT.toFixed(4), +th.toFixed(4)); lift.push(Math.max(0, VB - h.d) * 0.0 + h.s * h.ny * 0.85); }
  const at = arr => th => arr[clamp(Math.round((th + Math.PI) / (2 * Math.PI) * H.COLS), 0, H.COLS)];
  const IN = at(inner), LIFT = at(lift);
  const up = th => { const c = Math.cos(th), s2 = Math.sin(th) ** 2; return -0.065 * Math.max(0, c) ** 2 + 0.035 * s2 + 0.03 * Math.max(0, -c) ** 2; };
  const brim = loftGeo(H, 4), part = H.outlined(brim, H.paint('#5a5960'), 0.65);

  return { canvas: P.c, parts: [part],
    puff: (t, th) => t < HAT ? hitC(+t.toFixed(4), +th.toFixed(4)).s : t >= neck(th) ? COAT : 0,
    update() { const d = 0.016;
      const a = ringPts(H, VB, IN, LIFT), b = ringPts(H, VB, th => IN(th) + BW, th => LIFT(th) + up(th)),
            c = ringPts(H, VB, th => IN(th) + BW, th => LIFT(th) + up(th) - d), e = ringPts(H, VB, IN, th => LIFT(th) - d);
      brim.set([a.r, b.r, c.r, e.r]); } };
}

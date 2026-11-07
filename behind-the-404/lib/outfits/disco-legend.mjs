// DISCO LEGEND (3D port of draw/outfits/disco-legend.js): a big round dark curly afro — a shell of 3D curls round his
// head, hanging past his ears at the sides and back, his face left clear — and a short purple sequin vest with a gold
// neck band, a gold hem, gold collar points standing up either side of his chin, and a few sparkles.
import { painter, fu, W, INKU, INK, RM, clamp } from '../outfits3d.mjs';

const PURPLE = '#7a2bbf', SEQ = '#a65ee6', GOLD = '#efb52f', HEM = '#ffbe0a';
const HAIR = '#4a2c1b', HAIRD = '#321d11', CURL = '#a46c3e';   // a touch lighter than 2D: the 3D light darkens them
const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const sstep = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };

export default function build(H) {
  const P = painter(), { x } = P, T = H.T;
  const A = th => th * RM, kr = v => { v = clamp(v, 0.05, 0.97); return RM / ((H.rx(v) + H.rz(v)) / 2); };   // keeps dots/stars round on him

  // ================= the vest =================
  const neckA = a => 0.63 + 0.11 * fu(a, 0.62), neck = neckA, gold = th => neck(th) + 0.03;
  P.shadow(neck);
  P.region(() => P.below(neck), PURPLE, () => {
    // sequins: a staggered grid of little discs all round him (a few gold ones)
    for (let r = 0; r < 12; r++) for (let i = 0; i < 36; i++) {
      const a = -Math.PI + (i + (r % 2) * 0.5) / 36 * Math.PI * 2, v = 0.66 + r * 0.032, R = 0.011 * W;
      x.beginPath(); x.ellipse(A(a), v, R * kr(v), R, 0, 0, 7); x.fillStyle = (i * 7 + r * 3) % 11 === 0 ? GOLD : SEQ; x.fill();
    }
    P.band(neck, gold); P.fill(GOLD);                                         // gold neck band
    P.band(() => 0.92, () => 1.3); P.fill(HEM);                               // gold hem
    P.band(() => 0.932, () => 0.94); P.fill('rgba(255,248,200,0.95)');
    P.line(gold); P.ink(0.55); P.line(() => 0.92); P.ink(0.55);
    // sparkles: four-point stars
    for (const [a, v, s] of [[-0.75, 0.8, 1], [0.95, 0.86, 0.8], [0.35, 0.9, 0.7], [Math.PI - 0.5, 0.78, 1], [Math.PI + 0.6, 0.88, 0.8], [-1.6, 0.86, 0.8], [1.7, 0.76, 0.7]]) {
      const R = 0.035 * W * s, k = kr(v);
      x.beginPath(); for (let j = 0; j < 8; j++) { const ang = j * Math.PI / 4, rr = j % 2 ? R * 0.25 : R; x[j ? 'lineTo' : 'moveTo'](A(a) + Math.sin(ang) * rr * k, v - Math.cos(ang) * rr); }
      x.closePath(); x.fillStyle = '#fffbea'; x.fill();
    }
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  // gold collar points standing up either side of his chin (puffed, so they stand proud with sticker edges)
  const collars = [-1, 1].map(s => [[s * 0.2, neckA(0.2) + 0.012], [s * 0.5, neckA(0.5)], [s * 0.95, neckA(0.95) + 0.01], [s * 0.78, neckA(0.78) - 0.075]]);
  for (const [s, pts] of [[-1, collars[0]], [1, collars[1]]]) {
    x.beginPath(); pts.forEach(([a, v], i) => x[i ? 'lineTo' : 'moveTo'](A(a), v)); x.closePath(); P.fill(GOLD); P.ink(0.8);
    x.beginPath(); x.moveTo(A(s * 0.62), neckA(0.62) - 0.02); x.lineTo(A(s * 0.8), neckA(0.8) - 0.055); x.lineWidth = INKU * 0.5; x.strokeStyle = 'rgba(255,240,190,0.9)'; x.stroke();
  }
  const inPoly = (pts, a, v) => { let o = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [ai, vi] = pts[i], [aj, vj] = pts[j];
    if ((vi > v) !== (vj > v) && a < (aj - ai) * (v - vi) / (vj - vi) + ai) o = !o; } return o; };

  // ================= the afro =================
  // his scalp under the curls is hair-dark: the hairline sits high at his front, drops past his ears at the sides/back
  const hl = th => 0.16 + 0.36 * sstep(0.95, 1.35, Math.abs(th));
  P.region(() => P.above(hl), HAIRD);

  // the curls: rows on a round shell from the crown down; below the middle the hair hangs straight down past his ears
  const VC = 0.22, RX = 0.56 * W, RY = 0.3;
  const dk = a => 0.85 - 0.25 * Math.pow(Math.max(0, Math.cos(a)), 2);      // depth / width: hugs his forehead at the front
  const rows = [[0, 1], [24, 7], [46, 11], [68, 13], [90, 14], [108, 14], [126, 13], [142, 12]];
  const curls = [];
  rows.forEach(([bd, n], ri) => {
    const b = bd * Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const a = wrapA((i + (ri % 2) * 0.5) / n * Math.PI * 2 + 0.2);
      let rho, v;
      if (b <= Math.PI / 2) { rho = RX * Math.sin(b); v = VC - RY * Math.cos(b); }
      else { rho = RX * (1 - 0.12 * (b - Math.PI / 2)); v = VC + (b - Math.PI / 2) / (52 * Math.PI / 180) * 0.33; }
      if (Math.abs(a) < 1.0 + 0.25 * clamp((v - 0.2) / 0.3) && v > 0.16) continue;      // leave his face clear
      const r = (0.105 - 0.015 * (ri === 0)) * W * (0.9 + 0.2 * ((i * 37 + ri * 11) % 7) / 6);
      const be = Math.min(b, Math.PI / 2), nrm = new T.Vector3(Math.sin(a) * Math.sin(be), Math.cos(be), Math.cos(a) * Math.sin(be)).normalize();
      curls.push({ a, rho, v, r, nrm, st: -2.4 + ((i * 13 + ri * 5) % 4) * 0.5 + a });
    }
  });

  // all curls in ONE geometry (cheap): per curl a dark backing ball (1.15 r, sunk in a little: fills the gaps, makes
  // the outer ink) and the curl itself (lighter, with a lighter crescent painted on its outward face)
  const tpl = new T.SphereGeometry(1, 18, 12), tp = tpl.attributes.position.array, tidx = tpl.index.array, nv = tp.length / 3;
  const balls = [];
  for (const c of curls) { balls.push({ c, k: 0, rs: 1.15, sink: 0.35 }); balls.push({ c, k: 1, rs: 1, sink: 0 }); }
  const NB = balls.length, pos = new Float32Array(NB * nv * 3), nor = new Float32Array(NB * nv * 3), loc = new Float32Array(NB * nv * 3),
    kind = new Float32Array(NB * nv), sta = new Float32Array(NB * nv), index = [];
  const up = new T.Vector3(0, 1, 0), e1 = new T.Vector3(), e2 = new T.Vector3(), u = new T.Vector3();
  balls.forEach((bl, j) => {
    const n = bl.c.nrm; e1.crossVectors(up, n); if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0); e1.normalize(); e2.crossVectors(n, e1);
    for (let i = 0; i < nv; i++) { const o = (j * nv + i) * 3; u.fromArray(tp, i * 3);
      nor[o] = u.x; nor[o + 1] = u.y; nor[o + 2] = u.z; loc[o] = u.dot(e1); loc[o + 1] = u.dot(e2); loc[o + 2] = u.dot(n);
      kind[j * nv + i] = bl.k; sta[j * nv + i] = bl.c.st; }
    for (const t of tidx) index.push(t + j * nv);
  });
  const g = new T.BufferGeometry(), posA = new T.BufferAttribute(pos, 3); posA.setUsage(T.DynamicDrawUsage);
  g.setAttribute('position', posA); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('loc', new T.BufferAttribute(loc, 3));
  g.setAttribute('kind', new T.BufferAttribute(kind, 1)); g.setAttribute('st', new T.BufferAttribute(sta, 1)); g.setIndex(index);
  const hairMat = new T.ShaderMaterial({
    uniforms: { cHair: { value: new T.Color(HAIR) }, cDark: { value: new T.Color(HAIRD) }, cCurl: { value: new T.Color(CURL) } },
    vertexShader: `attribute vec3 loc; attribute float kind, st; varying vec3 vN, vL; varying float vK, vS;
      void main(){ vN = normalize(normalMatrix * normal); vL = loc; vK = kind; vS = st; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 cHair, cDark, cCurl; varying vec3 vN, vL; varying float vK, vS;
      void main(){ vec3 col = vK < 0.5 ? cDark : cHair;
        if (vK > 0.5 && vL.z > 0.0) { float rr = length(vL.xy), d = mod(atan(vL.y, vL.x) - vS, 6.28318);
          if (abs(rr - 0.55) < 0.085 && d < 3.4) col = cCurl; }
        vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45, 0.6, 0.65)));
        vec3 c = col * mix(0.8, 1.0, smoothstep(-0.25, -0.05, lit)) * (1.0 - 0.14 * smoothstep(0.5, 0.05, n.z)) + 0.06 * smoothstep(0.82, 0.97, lit);
        gl_FragColor = vec4(c, 1.0); }` });
  const afro = H.outlined(g, hairMat, 1);
  afro.traverse(o => { o.frustumCulled = false; });

  const tr = 0.012 + 0.976 * Math.round((VC - 0.012) / 0.976 * H.ROWS) / H.ROWS;   // the row ring() actually returns for VC
  const ctr = new T.Vector3();
  return { canvas: P.c, parts: [afro],
    puff: (t, th) => {
      if (inPoly(collars[0], th, t) || inPoly(collars[1], th, t)) return 0.028;
      return t >= neck(th) ? 0.014 : 0; },
    update() {
      // ride his squishy head: centre, squash (vertical), swell (sideways) and the top's lean
      const R = H.ring(VC), c = R.c, top = H.top();
      const sy = (top.y - c.y) / tr, sx = (R.pts[Math.round(H.COLS * 0.75)].x - c.x) / H.rx(tr);
      const lx = top.x - c.x, lz = top.z - c.z;
      for (let j = 0; j < NB; j++) {
        const { c: q, rs, sink } = balls[j], r = q.r * rs, lean = clamp((tr - q.v) / tr, -0.5, 1.3);
        ctr.set(c.x + Math.sin(q.a) * q.rho * sx + lx * lean, c.y + (tr - q.v) * sy, c.z + Math.cos(q.a) * q.rho * dk(q.a) * sx + lz * lean)
          .addScaledVector(q.nrm, -sink * q.r);
        for (let i = 0; i < nv; i++) { const o = (j * nv + i) * 3, t3 = i * 3;
          pos[o] = ctr.x + tp[t3] * r; pos[o + 1] = ctr.y + tp[t3 + 1] * r; pos[o + 2] = ctr.z + tp[t3 + 2] * r; }
      }
      posA.needsUpdate = true;
    } };
}

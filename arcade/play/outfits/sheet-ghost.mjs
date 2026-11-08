// SHEET GHOST (3D port of draw/outfits/sheet-ghost.js): one opaque white bedsheet over all of him, NO fin on top
// (its top just follows his round head), two dark eye holes + a small mouth hole cut where his face is, soft folds
// falling from his shoulders, and a ragged zigzag hem that hangs straight down from his widest point (a real 3D skirt,
// so his feet peek out between the teeth). His face is covered: the holes are the ghost face.
import { painter, ringPts, loftGeo, W, ARC, RM, clamp, lerp } from '../outfits3d.mjs';

const WHITE = '#fbfbfd', SH = '105,110,150', FOLD = 'rgba(120,125,165,0.34)', HOLE = '#1a1214';
const PUFF = 0.036 * W;           // how far the sheet stands off his body
const TW = 0.74;                  // his widest row: the sheet hangs straight down from here
const TEETH = 16;                 // 128 columns / 16 -> every tip lands on a column (sharp points)
// fold lines: body angle at the shoulder; they drift a little as they fall and carry on down the hem
const FOLDS = [-1.25, 1.25, Math.PI - 0.6, -Math.PI + 0.6, Math.PI];
const foldAt = a => a;   // straight falls: the hem carries them on with no jog

export default function build(H) {
  const T = H.T, P = painter(), { x } = P;

  // ---- the sheet on his body ----
  P.region(() => { x.beginPath(); x.rect(-ARC / 2 - 0.1, -0.05, ARC + 0.2, 1.1); }, WHITE, () => {
    const g = x.createLinearGradient(0, 0.25, 0, 1.0); g.addColorStop(0, `rgba(${SH},0)`); g.addColorStop(1, `rgba(${SH},0.2)`);
    x.fillStyle = g; x.fillRect(-ARC / 2, -0.05, ARC, 1.1);
    for (const a of FOLDS) { const g2 = x.createLinearGradient(0, 0.42, 0, 0.6); g2.addColorStop(0, 'rgba(120,125,165,0)'); g2.addColorStop(1, FOLD);
      x.beginPath(); x.moveTo(foldAt(a) * RM, 0.42); x.lineTo(foldAt(a) * RM, 1.0); x.lineWidth = 0.022; x.strokeStyle = g2; x.stroke(); }
  });
  // the ghost face: two eye holes and a small mouth hole, soft-edged like the 2D ones
  x.save(); x.filter = 'blur(3px)'; x.fillStyle = HOLE;
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 0.36 * RM, 0.49, 0.066, 0.086, -s * 0.12, 0, 7); x.fill(); }
  x.beginPath(); x.ellipse(0.0, 0.645, 0.028, 0.026, 0, 0, 7); x.fill();
  x.restore();

  // ---- the hem: a short solid skirt from his widest row down to a ragged zigzag below his base ----
  const tex = document.createElement('canvas'); tex.width = 1024; tex.height = 128;
  { const c = tex.getContext('2d'), Wd = tex.width, Hd = tex.height; c.fillStyle = WHITE; c.fillRect(0, 0, Wd, Hd);
    const g = c.createLinearGradient(0, 0, 0, Hd); g.addColorStop(0, `rgba(${SH},0.11)`); g.addColorStop(1, `rgba(${SH},0.3)`); c.fillStyle = g; c.fillRect(0, 0, Wd, Hd);
    // the same folds, carried on down (2048 px across his canvas = ARC units; here 1024 px = one turn)
    for (const a of FOLDS) for (const o of [-2 * Math.PI, 0, 2 * Math.PI]) { const a0 = foldAt(a) + o, a1 = a0;
      c.beginPath(); c.moveTo((a0 + Math.PI) / (2 * Math.PI) * Wd, 0); c.lineTo((a1 + Math.PI) / (2 * Math.PI) * Wd, Hd);
      c.lineWidth = 0.022 * 2048 / ARC / 2; c.strokeStyle = FOLD; c.stroke(); } }
  const skinTex = new T.CanvasTexture(tex); skinTex.colorSpace = T.NoColorSpace; skinTex.wrapS = T.RepeatWrapping; skinTex.anisotropy = 4;
  // same light as his cloth layer so the hem meets the sheet without a seam
  const hemMat = new T.ShaderMaterial({ uniforms: { map: { value: skinTex } },
    vertexShader: `attribute float shade; varying vec2 vUv; varying vec3 vN; varying float vS;
      void main(){ vUv = uv; vS = shade; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec3 vN; varying float vS;
      void main(){ vec3 c = texture2D(map, vUv).rgb * vS; vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45, 0.6, 0.65)));
        c *= mix(0.86, 1.0, smoothstep(-0.25, -0.05, lit)) * (1.0 - 0.16 * smoothstep(0.5, 0.05, n.z));
        gl_FragColor = vec4(c, 1.0); }` });

  // paint geometry: separate faces (outer, bottom edge, inner) with their own vertices -> crisp shading, uvs on the outer
  const C1 = H.COLS + 1, FACES = 3, paintGeo = new T.BufferGeometry();
  const pPos = new T.BufferAttribute(new Float32Array(FACES * 2 * C1 * 3), 3); pPos.setUsage(T.DynamicDrawUsage);
  const pUv = new Float32Array(FACES * 2 * C1 * 2), pSh = new Float32Array(FACES * 2 * C1), pIdx = [];
  for (let f = 0; f < FACES; f++) for (let r = 0; r < 2; r++) for (let i = 0; i < C1; i++) { const k = (f * 2 + r) * C1 + i;
    pUv[k * 2] = i / H.COLS; pUv[k * 2 + 1] = 1 - r; pSh[k] = f === 0 ? 1 : 0.8; }
  for (let f = 0; f < FACES; f++) for (let i = 0; i < H.COLS; i++) { const a = f * 2 * C1 + i, b = a + 1, c = a + C1, d = c + 1; pIdx.push(a, c, b, b, c, d); }
  paintGeo.setAttribute('position', pPos); paintGeo.setAttribute('uv', new T.BufferAttribute(pUv, 2)); paintGeo.setAttribute('shade', new T.BufferAttribute(pSh, 1)); paintGeo.setIndex(pIdx);
  // outline geometry: the same rings as one closed smooth band, for the ink line + white sticker border
  const lineGeo = loftGeo(H, 4);
  const hem = new T.Group();
  hem.add(new T.Mesh(paintGeo, hemMat), new T.Mesh(lineGeo, H.shell(H.INK, '#120a05')), new T.Mesh(lineGeo, H.shell(H.INK + H.BORDER, '#ffffff')));
  hem.renderOrder = 1;

  const thOf = i => i / H.COLS * 2 * Math.PI - Math.PI;
  // a tooth: tip (1) every 2pi/TEETH, a little ragged in depth
  const tooth = th => { const f = (th + Math.PI) * TEETH / (2 * Math.PI), k = Math.round(f), d = Math.abs(f - k) * 2; return { tri: 1 - d, k }; };

  return { canvas: P.c, parts: [hem],
    puff: (t, th) => t < TW + 0.01 ? PUFF : PUFF * (1 - 0.7 * clamp((t - TW - 0.01) / 0.06)),   // tucks inside the hem below
    update() {
      const A = ringPts(H, TW, () => PUFF), c = A.c, cb = H.ring(0.95).c, yBot = H.ring(0.988).c.y - 0.01;
      const B = [], Cc = [], D = [];
      for (let i = 0; i < C1; i++) { const p = A.r[i], dx = p.x - c.x, dz = p.z - c.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, th = thOf(i);
        const { tri, k } = tooth(th), deep = 0.065 + 0.012 * Math.sin(k * 2.3), y = yBot - deep * tri + 0.02 * (1 - tri);
        const rb = L + 0.008;   // hangs straight, flaring a touch
        B.push(new T.Vector3(cb.x + ux * rb, y, cb.z + uz * rb));
        Cc.push(new T.Vector3(cb.x + ux * (rb - 0.012), y, cb.z + uz * (rb - 0.012)));
        D.push(new T.Vector3(c.x + ux * (L - 0.012), p.y, c.z + uz * (L - 0.012))); }
      lineGeo.set([Cc, D, A.r, B]);
      // paint faces: [inner C->D], [outer A->B], [bottom B->C]  (same winding as the outline band)
      const arr = pPos.array; let q = 0;
      for (const ring of [A.r, B, B, Cc, Cc, D]) for (const p of ring) { arr[q++] = p.x; arr[q++] = p.y; arr[q++] = p.z; }
      pPos.needsUpdate = true; paintGeo.computeVertexNormals(); paintGeo.computeBoundingSphere();
      // weld the normals across his back seam (first and last column are the same place) -> no bright seam line
      const nr = paintGeo.attributes.normal.array;
      for (let r = 0; r < FACES * 2; r++) { const i0 = r * C1 * 3, i1 = (r * C1 + H.COLS) * 3;
        for (let k = 0; k < 3; k++) { const m = (nr[i0 + k] + nr[i1 + k]) / 2; nr[i0 + k] = nr[i1 + k] = m; } }
    } };
}

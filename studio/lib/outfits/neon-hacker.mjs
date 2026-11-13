// neon-hacker (3D) — ported from draw/outfits/neon-hacker.js.
// A short black tech vest round his lower half: two chunky chest panels piped in neon (cyan on his right, magenta on
// his left) with a little three-dash vent low on each, neon piping round the back of the neck, and a dark strap round
// his middle with a grey buckle (a cyan slot). A black peaked cap sitting ON his head: a real 3D crown (a lathe: a
// dark band, then flaring out to a wide flat top) traced with circuit lines and nodes (cyan his right, magenta his
// left), a neon line round the band, a coloured stud each side, and a short glossy visor at his front with a cyan edge.
import { painter, fu, W, INKU, INK, RM, ARC, clamp, lerp } from '../outfits3d.mjs';

const BLACK = '#1b1c22', PANEL = '#26282f', TOP = '#2c2e36', CYAN = '#2fe6f0', MAG = '#ef3fd8', BANDC = '#121317';

export default function build(H) {
  const P = painter(), { x } = P, T = H.T, A = th => th * RM;

  // ---------------- the vest ----------------
  const neck = th => 0.6 + 0.15 * fu(th, 0.62);
  const neon = (col, k = 0.55) => { x.lineWidth = INKU * k; x.strokeStyle = col; x.stroke(); };
  P.shadow(neck);
  P.region(() => P.below(neck), BLACK, () => {
    for (const [a, col] of [[-0.85, CYAN], [0.85, MAG]]) {
      P.strip(a, 0.46, th => neck(th) + 0.005, () => 0.95); P.fill(PANEL); P.ink(0.6);
      P.strip(a, 0.36, th => neck(th) + 0.035, () => 0.92); neon(col);
      for (let i = 0; i < 3; i++) { const aa = a + Math.sign(a) * (-0.2 + i * 0.07); P.strip(aa, 0.022, () => 0.875, () => 0.895); P.fill(col); } }
    for (const [a, col] of [[Math.PI - 0.8, MAG], [-Math.PI + 0.8, CYAN]]) { P.line(th => neck(th) + 0.03, a - 0.8, a + 0.8); neon(col, 0.6); }
    P.band(() => 0.9, () => 0.935); P.fill('#101114'); P.line(() => 0.9); P.ink(0.5); P.line(() => 0.935); P.ink(0.5);
    const v = 0.917; x.beginPath(); x.rect(-0.045 * W, v - 0.028, 0.09 * W, 0.056); P.fill('#3a3d47'); P.ink(0.55);
    x.beginPath(); x.moveTo(-0.02 * W, v); x.lineTo(0.02 * W, v); neon(CYAN, 0.5);
  });
  P.wrap(() => { P.line(neck); P.ink(1); });

  // ---------------- the cap (3D) ----------------
  const VB = 0.22, R = H.rx(VB) + 0.03, RC = R + 0.1, BH = 0.08, HT = 0.235, ZK = H.rz(VB) / H.rx(VB);
  const prof = [[R - 0.012, -0.02], [R, 0], [R, BH], [R + 0.03, BH + 0.04], [RC - 0.012, HT - 0.016], [RC, HT - 0.006], [RC - 0.016, HT + 0.004], [0, HT + 0.006]];
  const NP = prof.length - 1, vOf = j => 1 - j / NP;                    // canvas y (0..1, top = 0) of profile point j
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  { const c = cv.getContext('2d'), X = th => ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * 1024, Y = j => vOf(j) * 512;
    c.fillStyle = BLACK; c.fillRect(0, 0, 1024, 512);
    c.fillStyle = BANDC; c.fillRect(0, Y(2), 1024, Y(1) - Y(2));
    c.fillStyle = TOP; c.fillRect(0, 0, 1024, Y(5));
    const colOf = th => Math.sin(th) < 0 ? CYAN : MAG;
    // the neon line round the band (cyan his right half, magenta his left), ink at the band's top and bottom
    for (const [a0, a1] of [[0, Math.PI], [Math.PI, 2 * Math.PI]]) { c.fillStyle = colOf((a0 + a1) / 2); c.fillRect(X(a0) + 6, (Y(1) + Y(2)) / 2 - 5, X(a1 - 0.0001) - X(a0) - 12, 10); }
    c.fillStyle = INK; c.fillRect(0, Y(2) - 4, 1024, 8);
    // circuit traces up the crown, each ending in a node near the top's edge
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3, col = colOf(a), s = Math.sin(a) < 0 ? -1 : 1, y0 = Y(2), y1 = Y(3), y2 = Y(4) + 6;
      for (const o of [-1024, 0, 1024]) { const x0 = X(a) + o, x1 = x0 + s * 0.22 / (2 * Math.PI) * 1024;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y2); c.lineWidth = 6; c.strokeStyle = col; c.stroke();
        c.beginPath(); c.ellipse(x1, y2, 9, 9, 0, 0, 7); c.fillStyle = BLACK; c.fill(); c.lineWidth = 4; c.stroke(); } } }
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace; tex.wrapS = T.RepeatWrapping; tex.anisotropy = 4;
  const capMat = new T.ShaderMaterial({ uniforms: { map: { value: tex } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec3 vN; void main(){ vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45,0.6,0.65)));
      vec3 c = texture2D(map, vUv).rgb * mix(0.8, 1.0, smoothstep(-0.25, -0.05, lit)) * (1.0 - 0.14*smoothstep(0.5,0.05,n.z)) + 0.1*smoothstep(0.82,0.97,lit);
      gl_FragColor = vec4(c,1.0); }` });
  const crownG = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 96); crownG.scale(1, 1, ZK);
  const hat = new T.Group(); hat.add(H.outlined(crownG, capMat, 0.9));
  const inkRing = (r, y, w) => { const g = new T.TorusGeometry(r, w, 6, 96); g.rotateX(Math.PI / 2); g.translate(0, y, 0); g.scale(1, 1, ZK); return new T.Mesh(g, new T.MeshBasicMaterial({ color: INK })); };
  hat.add(inkRing(RC - 0.012, HT - 0.0, 0.005));
  for (const a of [-1.35, 1.35]) { const st = H.outlined(new T.SphereGeometry(1, 14, 10).scale(0.026 * W, 0.026 * W, 0.012), H.paint(a < 0 ? CYAN : MAG), 0.5);
    st.position.set((R + 0.004) * Math.sin(a), BH / 2, (R + 0.004) * Math.cos(a) * ZK); st.lookAt(st.position.clone().multiplyScalar(2).setY(BH / 2)); hat.add(st); }
  // the visor: a closed swept strip in front, its width out(a), tipped down
  const out = a => 0.11 * W * Math.pow(Math.max(0, Math.cos(a)), 2);
  { const S = 40, Q = 12, pos = [], idx = [];
    for (let i = 0; i <= S; i++) { const a = lerp(-1.35, 1.35, i / S), w = out(a) / 2 + 0.008, cr = R - 0.004 + w, hh = 0.011 * Math.min(1, w / 0.02);
      for (let j = 0; j < Q; j++) { const q = j / Q * Math.PI * 2, rr = cr + Math.cos(q) * w, y = Math.sin(q) * hh - 0.6 * (rr - R) * 0.85 - 0.004;
        pos.push(rr * Math.sin(a), y, rr * Math.cos(a) * ZK); } }
    for (let i = 0; i < S; i++) for (let j = 0; j < Q; j++) { const a = i * Q + j, b = i * Q + (j + 1) % Q, c = a + Q, d = b + Q; idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    hat.add(H.outlined(g, H.paint('#24262d'), 0.8));
    const edge = []; for (let k = 0; k <= 30; k++) { const a = lerp(-1.0, 1.0, k / 30), rr = R + out(a) * 0.82; edge.push(new T.Vector3(rr * Math.sin(a), -0.6 * (rr - R) * 0.85 + 0.008, rr * Math.cos(a) * ZK)); }
    hat.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(edge), 30, 0.004, 5, false), new T.MeshBasicMaterial({ color: CYAN }))); }

  return { canvas: P.c, parts: [hat],
    puff: (t, th) => t >= neck(th) ? 0.016 : 0,
    update() { const r = H.ring(VB), top = H.top(); hat.position.copy(r.c);
      const d = top.clone().sub(r.c); hat.rotation.set(Math.atan2(d.z, d.y) * 0.8, 0, -Math.atan2(d.x, d.y) * 0.8); } };
}

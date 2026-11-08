// spud3d.mjs — Potato as a real 3D model, squishy, wearing Vega's own painted skin.
// Built from Chat's Character Studio (three.js r180, CC0 figure) taken apart: the stick figure is gone, the body is
// one soft potato shaped to Vega's turnaround (profile.json: half-width per height from her front view, half-depth
// from her side views), wrapped with skin.png (her 8 views unwrapped into one 360° map, see draw/skinwrap.py).
// Look: flat sticker camera (orthographic), cel-ish shading baked in her paint, a black ink shell and a white sticker
// shell behind him. Squish: everything is springs — squash on landing, top lags when he turns or waddles, pokes dent
// in and wobble back. No hands, ever. Arms only when he needs them (Nov 1): spud.arms(pose) / spud.dance(move, beat), off by default.
import * as T from './vendor/three.module.js';

const ROWS = 72, COLS = 128;
const INK = 0.032, BORDER = (() => { try { const b = +new URLSearchParams(location.search).get('border'); return b > 0 && b < 0.1 ? b : 0; } catch (e) { return 0; } })();   // NO WHITE BORDER (Chikin, Nov 5, D-20261105-09: "the white lines need to go away on every potato"); ?border=0.02 shows the old line for comparison
const NOWHITE = BORDER <= 0, hideWhite = (m, color) => { if (NOWHITE && String(color).toLowerCase() === '#ffffff') m.visible = false; return m; };   // (?border=0.02: a test switch for the white-line side-by-side, Nov 5; no flag = 0.03 as before)           // as a share of body height (Vega: ink 2.6%, white border 2.6%)
const FOOT_H = 0.075;                       // his feet lift the body this much off the ground (nubs show under him, like Vega's)
const NO_OPT = Object.freeze({});
export const ARM_POSES = ['none', 'folded', 'wave', 'point', 'shrug', 'up'], DANCE_MOVES = ['groove', 'disco', 'raise-the-roof', 'pump', 'wiggle'];   // (spud.arms / spud.dance)

// ---------- springs ----------
class Spring { constructor(x = 0, k = 120, c = 9) { this.x = x; this.v = 0; this.k = k; this.c = c; this.to = x; }
  step(dt) { const a = -this.k * (this.x - this.to) - this.c * this.v; this.v += a * dt; this.x += this.v * dt; return this.x; }
  kick(v) { this.v += v; } }

export async function createSpud(container, opts = {}) {
  // game mode: opts.scene given -> he lives in someone else's scene; they drive step() and render
  const game = !!opts.scene, base_ = opts.base || '';
  const W = () => container.clientWidth, H = () => container.clientHeight;
  let renderer = null, cam = null; const scene = opts.scene || new T.Scene();
  if (!game) {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W(), H());
    renderer.outputColorSpace = T.LinearSRGBColorSpace;      // pass Vega's colours straight through, unchanged
    container.appendChild(renderer.domElement);
    cam = new T.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    const fit = () => { const a = W() / H(), s = 0.82; cam.left = -s * a; cam.right = s * a; cam.top = s + 0.05; cam.bottom = -s;
      cam.updateProjectionMatrix(); renderer.setSize(W(), H()); };
    // a sticker camera, tipped down a few degrees: hat brims and crowns read as rings, not flat lines
    const TILT = 0.12; cam.position.set(0, 0.5 + Math.sin(TILT) * 3, Math.cos(TILT) * 3); cam.lookAt(0, 0.5, 0);
    fit(); window.addEventListener('resize', fit);
  }
  // his glitch: purple, only him. tint 0..1 tears him into sliding bands and floods him purple (shared by every layer)
  const GL = { tint: { value: 0 }, gtime: { value: 0 } };
  const TEAR = `uniform float tint, gtime; vec3 tear(vec3 p){ p.x += tint * 0.11 * sin(floor(p.y * 13.0) * 7.13 + gtime * 47.0); return p; }`;

  const load = src => new Promise((ok, bad) => new T.TextureLoader().load(src, t => { t.colorSpace = T.NoColorSpace; t.anisotropy = 4; ok(t); }, undefined, bad));
  const [skinTex, faceTex, profile] = await Promise.all([load(opts.skin || base_ + 'skin.png'), load(opts.face || base_ + 'face-canon.png'),
    fetch(opts.profile || base_ + 'profile.json').then(r => r.json())]);
  skinTex.wrapS = T.RepeatWrapping;

  // ---------- the body: rows top -> bottom, columns round (column 0.5 = his front, where the face is) ----------
  const prof = (arr, t) => { const f = t * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)), k = f - i; return arr[i] * (1 - k) + arr[i + 1] * k; };
  const n = (ROWS + 1) * (COLS + 1) + 2, base = new Float32Array(n * 3), uv = new Float32Array(n * 2), meta = new Float32Array(n * 2);
  let q = 0;
  for (let j = 0; j <= ROWS; j++) {
    const t = 0.012 + 0.976 * j / ROWS, rx = prof(profile.front, t), rz = prof(profile.side, t);
    for (let i = 0; i <= COLS; i++) {
      const th = (i / COLS) * Math.PI * 2 - Math.PI;
      base.set([rx * Math.sin(th), FOOT_H + (1 - t), rz * Math.cos(th)], q * 3); uv.set([i / COLS, 1 - t], q * 2); meta.set([t, th], q * 2); q++;
    }
  }
  const TOP = q; base.set([0, FOOT_H + 1, 0], q * 3); uv.set([0.5, 1], q * 2); meta.set([0, 0], q * 2); q++;
  const BOT = q; base.set([0, FOOT_H + 0.004, 0], q * 3); uv.set([0.5, 0], q * 2); meta.set([1, 0], q * 2); q++;
  const idx = [], at = (j, i) => j * (COLS + 1) + i;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const a = at(j, i), b = at(j, i + 1), c = at(j + 1, i), d = at(j + 1, i + 1); idx.push(a, c, b, b, c, d); }
  for (let i = 0; i < COLS; i++) { idx.push(TOP, at(0, i), at(0, i + 1)); idx.push(BOT, at(ROWS, i + 1), at(ROWS, i)); }
  const geo = new T.BufferGeometry();
  const pos = new T.BufferAttribute(base.slice(), 3); pos.setUsage(T.DynamicDrawUsage);
  geo.setAttribute('position', pos); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  // puff: how far the outfit he's wearing pushes his surface out at each vertex (cloth ~0.014, a hard-hat shell 0.04).
  // His ink + white shells ride on top of it, so clothes and hats get real sticker edges and squish with him.
  const puffAttr = new T.BufferAttribute(new Float32Array(q), 1); geo.setAttribute('puff', puffAttr);
  // fr: (sin of the angle round him, height t, cos): his front view, where the folded arms' decal is painted (spud.arms('folded'))
  { const fr = new Float32Array(q * 3); for (let k = 0; k < q; k++) { fr[k * 3] = Math.sin(meta[k * 2 + 1]); fr[k * 3 + 1] = meta[k * 2]; fr[k * 3 + 2] = Math.cos(meta[k * 2 + 1]); }
    geo.setAttribute('fr', new T.BufferAttribute(fr, 3)); }

  // skin: her paint + a light cel step and a darker rim like her stickers; the face layer on top
  const skinMat = new T.ShaderMaterial({
    uniforms: { map: { value: skinTex }, face: { value: faceTex }, faceOn: { value: opts.face === false ? 0 : 1 }, faceShift: { value: 0 }, fold: { value: faceTex }, foldOn: { value: 0 }, ...GL },
    vertexShader: TEAR + `attribute vec3 fr; varying vec2 vUv; varying vec3 vN, vFr;
      void main(){ vUv = uv; vFr = fr; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(tear(position),1.0); }`,
    fragmentShader: `uniform sampler2D map, face, fold; uniform float faceOn, faceShift, foldOn, tint; varying vec2 vUv; varying vec3 vN, vFr;
      void main(){ vec3 c = texture2D(map, vUv).rgb;
        vec4 ar = vec4(0.0); float hideF = 0.0;   // the folded arms (off unless spud.arms('folded')): line art on his belly, over his mouth
        if (foldOn > 0.0 && vFr.z > 0.0 && vFr.y > 0.5) { vec2 d = vec2(vFr.x * 0.5 + 0.5, (vFr.y - 0.5) * 2.0);
          ar = texture2D(fold, vec2(d.x, 1.0 - d.y * 0.5)); hideF = texture2D(fold, vec2(d.x, 0.5 - d.y * 0.5)).a * foldOn; }
        vec4 f = texture2D(face, vec2(vUv.x - faceShift, vUv.y)); c = mix(c, f.rgb, f.a * faceOn * (1.0 - hideF));
        c = mix(c, ar.rgb, ar.a * foldOn * smoothstep(0.12, 0.38, normalize(vN).z));   // (fading as they go round his side, never running into his outline)
        vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45, 0.6, 0.65)));
        c *= mix(0.9, 1.0, smoothstep(-0.25, -0.05, lit));            // one soft cel step on the shadow side
        c *= 1.0 - 0.14 * smoothstep(0.5, 0.05, n.z);                  // darker toward his edges, like Vega's paint
        c = mix(c, vec3(0.6, 0.32, 1.0) * (0.55 + 0.45 * c.r), tint * 0.75);   // glitch purple
        gl_FragColor = vec4(c, 1.0); }` });
  // the shells: same mesh pushed out along its normals, back faces only -> ink line, then the white sticker border
  // bias pushes a layer back in depth: white sticker borders sit behind EVERYTHING (they only show outside his whole
  // silhouette), feet sit behind his body's ink line (Chikin: the feet's outlines showed through when he turned)
  const shell = (w, color, ...r) => hideWhite(shell0(w, color, ...r), color);   // (every white sticker-border shell, his and his outfits', is hidden when there's no border)
  const shell0 = (w, color, usePuff = false, bias = String(color).toLowerCase() === '#ffffff' ? 0.12 : 0) => new T.ShaderMaterial({ side: T.BackSide,
    uniforms: { w: { value: w }, color: { value: new T.Color(color) }, bias: { value: bias }, ...GL },
    vertexShader: TEAR + (usePuff ? `attribute float puff;` : `float puff = 0.0;`) + `uniform float w, bias;
      void main(){ vec3 p = tear(position + normalize(normal) * (w + puff)); gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); gl_Position.z += bias * gl_Position.w; }`,
    fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }` });
  const inkMat = shell(INK, '#120a05', true), borderMat = shell(INK + BORDER, '#ffffff', true);

  const spud = new T.Group(); scene.add(spud);
  const body = new T.Mesh(geo, skinMat); spud.add(body, new T.Mesh(geo, inkMat), new T.Mesh(geo, borderMat));

  // the outfit layer: his own mesh again, pushed out by puff, painted with the outfit's texture (same layout as his skin)
  const clothTex = new T.CanvasTexture(document.createElement('canvas')); clothTex.colorSpace = T.NoColorSpace; clothTex.wrapS = T.RepeatWrapping; clothTex.anisotropy = 4;
  const clothMat = new T.ShaderMaterial({ transparent: true, uniforms: { map: { value: clothTex }, ...GL },
    vertexShader: TEAR + `attribute float puff; varying vec2 vUv; varying vec3 vN;
      void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec3 p = tear(position + normalize(normal) * max(puff, 0.004));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
    fragmentShader: `uniform sampler2D map; uniform float tint; varying vec2 vUv; varying vec3 vN;
      void main(){ vec4 c = texture2D(map, vUv); if (c.a < 0.03) discard;
        vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45, 0.6, 0.65)));
        vec3 k = c.rgb * mix(0.86, 1.0, smoothstep(-0.25, -0.05, lit)) * (1.0 - 0.16 * smoothstep(0.5, 0.05, n.z));
        k = mix(k, vec3(0.6, 0.32, 1.0) * (0.55 + 0.45 * k.r), tint * 0.75);
        gl_FragColor = vec4(k, c.a); }` });
  const cloth = new T.Mesh(geo, clothMat); cloth.visible = false; cloth.renderOrder = 1; spud.add(cloth);
  let outfit = null;

  // feet: two little dark nubs, outlined the same way
  const footGeo = new T.SphereGeometry(1, 24, 16); footGeo.scale(0.085, 0.05, 0.075);
  const FEET_BACK = 0.06;
  const footMat = new T.ShaderMaterial({ vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position.z += ${FEET_BACK} * gl_Position.w; }`,
    fragmentShader: `varying vec3 vN; void main(){ vec3 c = vec3(0.32,0.17,0.08); c *= 0.75 + 0.25*smoothstep(-0.2,0.6,vN.y); gl_FragColor = vec4(c,1.0);}` });
  const feet = [-1, 1].map(s => { const g = new T.Group(); g.position.set(s * 0.21, 0.04, 0.06);
    g.add(new T.Mesh(footGeo, footMat), new T.Mesh(footGeo, shell(INK * 0.8, '#120a05', false, FEET_BACK)), new T.Mesh(footGeo, shell(INK * 0.8 + BORDER, '#ffffff'))); spud.add(g); return g; });

  // ---------- squish state ----------
  const S = { yaw: new Spring(0, 60, 11), squash: new Spring(1, 260, 9), leanX: new Spring(0, 140, 7), leanZ: new Spring(0, 140, 7),
              hop: new Spring(0, 0, 0), wob: new Spring(0, 300, 6), dents: [], walk: 0, walking: false, airborne: false, vy: 0, y: 0 };
  let lastYaw = 0;

  function deform(time) {
    const p = pos.array, s = S.squash.x, inv = 1 / Math.sqrt(Math.max(0.3, s)), lx = S.leanX.x, lz = S.leanZ.x, wob = S.wob.x;
    for (let k = 0; k < q; k++) {
      let x = base[k * 3], y = base[k * 3 + 1], z = base[k * 3 + 2]; const t = meta[k * 2], th = meta[k * 2 + 1], hgt = 1 - t;
      // jelly ripple round him after a hit
      const rip = 1 + wob * 0.06 * Math.sin(3 * th + 7 * time) * Math.sin(Math.PI * hgt);
      x *= rip; z *= rip;
      // pokes: dents pushed in along the surface, springing back
      for (const d of S.dents) { const dx = x - d.p.x, dy = y - d.p.y, dz = z - d.p.z, g = Math.exp(-(dx * dx + dy * dy + dz * dz) / 0.03) * d.s.x;
        x -= d.n.x * g * 0.12; y -= d.n.y * g * 0.12; z -= d.n.z * g * 0.12; }
      // squash & stretch from the ground up (volume kept), and the top lagging behind (shear grows with height)
      y = FOOT_H * 0.6 + (y - FOOT_H * 0.6) * s; x *= 1 + (inv - 1) * Math.sin(Math.PI * Math.min(1, hgt * 1.1)) * 1.4; z *= 1 + (inv - 1) * Math.sin(Math.PI * Math.min(1, hgt * 1.1)) * 1.4;
      const hh = hgt * hgt; x += lx * hh; z += lz * hh;
      p[k * 3] = x; p[k * 3 + 1] = y; p[k * 3 + 2] = z;
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
    // the back seam (th = ±π) is two columns of vertices in the same place: give them one normal, or a big puff
    // (hats, helmets) opens a hairline crack down his back
    const N = geo.attributes.normal.array;
    for (let j = 0; j <= ROWS; j++) { const a = (j * (COLS + 1)) * 3, b = (j * (COLS + 1) + COLS) * 3;
      for (let c = 0; c < 3; c++) { const m = (N[a + c] + N[b + c]) / 2; N[a + c] = N[b + c] = m; } }
  }

  // ---------- arms (Chikin, Nov 1: "potato needs the arms, at least sometimes. It would help make him look like hes dancing") ----------
  // OFF until a caller asks (api.arms / api.dance): nothing is built and nothing runs per frame before that.
  // FREE ARMS (wave, point, dance...) are tapered tubes with a rounded tip: NO HANDS, ever. Like the drawn model's arms
  // (draw/potato-draw.js armsDraw) they always grow out of his outline on screen: each frame the shoulder slides round him to
  // stay on his silhouette whichever way he's turned, and the arm is posed in the picture plane (s / e swing it, f / ef tip it
  // toward us). The root is sunk inside him and the arm's ink is drawn BEHIND his body (2D: arm ink before the body), so it only
  // shows outside his silhouette, where it joins his own outline: no line across the joint. Where an arm swings clear in front
  // of his belly it gets a second ink line of its own, which grows in from nothing (no stubs). White sticker border behind
  // everything, like his. Skin = his paint's colour, one cel step, darker at the root (his edge tone). Every point rides his
  // deformed surface (squash, lean, glitch tear) and is pushed back out of him if it would sink in. In an outfit the root sits
  // under the cloth, so the arm comes out of it like a sleeve.
  // FOLDED ARMS are Vega's canon crossed arms, drawn the way the canon (and the drawn model) draws them: ink line art on his
  // belly — the lobe, the top arc, the long S, the lower curve — painted onto his own skin like his face, so at the canon angle
  // they are exactly the drawn model's lines. They cover his mouth (canon), turn with him and sink away past ~50° of turn
  // (the drawn model's ARM_HIDE: side-on they'd read as a snout).
  // Free arms: s = shoulder swing from hanging (0 down, π/2 out, π up; < 0 swings in across his front), e = elbow bend
  // (continues the same way), f / ef = upper arm / forearm tipped toward us, len (1 normal, 0 = inside him), v / th = where the
  // shoulder is (height from his top, angle in from his outline: A_TH = 0.15 rad in front of it), thick, or
  // target: [x, y, z] (body units from the shoulder, picture plane: the tip reaches for it, elbow bends down).
  const A_NS = 26, A_CAP = 4, A_RS = 12, A_NR = A_NS + 2 * A_CAP, A_NV = A_NR * A_RS + 2, A_K0 = 4;   // (rings: start cap, arm, tip cap; + the two pole points)
  const A_R0 = 0.062, A_L1 = 0.135, A_L2 = 0.1, A_V = 0.7, A_TH = 1.42, A_INK = INK * 0.75;   // (2D: arm width 8.5% of his height, upper arm 0.16; Chikin Nov 1: "should be shorter", "stubbier" -> short stubby nubs)
  const A_SKIN = new T.Vector3(223 / 255, 155 / 255, 70 / 255);   // his paint's own colour (skin.png's median), straight through like the paint
  const A_COS = new Float32Array(A_RS), A_SIN = new Float32Array(A_RS);
  for (let a = 0; a < A_RS; a++) { A_COS[a] = Math.cos(a / A_RS * Math.PI * 2); A_SIN[a] = Math.sin(a / A_RS * Math.PI * 2); }
  const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x, sstep = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const ez3 = x => 1 - Math.pow(1 - clamp01(x), 3);
  const onBeat = b => { const x = b - Math.round(b); return x < 0 ? sstep(-0.24, 0, x) : Math.max(0, 1 - x / 0.45); };   // 0..1, peaks ON each beat
  const FOLD_HIDE = [0.55, 0.75, 0.95, 1.1];   // turned this far (rad) the folded arms sink away (the drawn model: gone past ~60°): sooner when the lobe end swings to his edge (yaw > 0: it'd read as a snout)
  const SP = new Float32Array(3), SN = new Float32Array(3), EL = { d: 0, ux: 0, uz: 0, rE: 0, cx: 0, cz: 0 };
  let ARM = null;
  function surfAt(t, th) {   // a point on his deformed surface + its normal (bilinear, no allocation)
    const fj = Math.max(0, Math.min(ROWS - 1e-4, (t - 0.012) / 0.976 * ROWS)), j = Math.floor(fj), kj = fj - j;
    let fi = (th + Math.PI) / (2 * Math.PI) * COLS; fi = ((fi % COLS) + COLS) % COLS; const i = Math.floor(fi), ki = fi - i;
    const P = pos.array, N = geo.attributes.normal.array, R = COLS + 1;
    const a = (j * R + i) * 3, b = (j * R + i + 1) * 3, c = ((j + 1) * R + i) * 3, d = ((j + 1) * R + i + 1) * 3;
    const wa = (1 - kj) * (1 - ki), wb = (1 - kj) * ki, wc = kj * (1 - ki), wd = kj * ki;
    for (let m = 0; m < 3; m++) { SP[m] = P[a + m] * wa + P[b + m] * wb + P[c + m] * wc + P[d + m] * wd; SN[m] = N[a + m] * wa + N[b + m] * wb + N[c + m] * wc + N[d + m] * wd; }
    const L = Math.hypot(SN[0], SN[1], SN[2]) || 1; SN[0] /= L; SN[1] /= L; SN[2] /= L;
  }
  function ellAt(x, y, z) {   // how far (x,y,z) is outside him, sideways (his squashed + leaning cross-section at that height); false above / below him
    const s = S.squash.x, inv = 1 / Math.sqrt(Math.max(0.3, s)), y0 = FOOT_H * 0.6 + (y - FOOT_H * 0.6) / s, t = 1 + FOOT_H - y0;
    if (t < 0.02 || t > 0.985) return false;
    const hgt = 1 - t, sq = (1 + (inv - 1) * Math.sin(Math.PI * Math.min(1, hgt * 1.1)) * 1.4) * (1 + 0.06 * Math.abs(S.wob.x));
    const ax = prof(profile.front, t) * sq, az = prof(profile.side, t) * sq, hh = hgt * hgt;
    EL.cx = S.leanX.x * hh; EL.cz = S.leanZ.x * hh; const dx = x - EL.cx, dz = z - EL.cz, D = Math.hypot(dx, dz);
    if (D < 1e-6) { EL.ux = 0; EL.uz = 1; EL.rE = az; EL.d = -az; return true; }
    EL.ux = dx / D; EL.uz = dz / D; EL.rE = 1 / Math.hypot(EL.ux / ax, EL.uz / az); EL.d = D - EL.rE; return true;
  }
  // the shoulder's angle round him (body space) that keeps it on his outline on screen whichever way he's turned:
  // the silhouette point of his cross-section at that height, then th0's offset in toward the camera (A_TH: 0.15 rad)
  function shoulderTh(sg, v, th0) {
    const Y = S.yaw.x, rx = prof(profile.front, v), rz = prof(profile.side, v);
    let th = Math.atan2(rx * Math.cos(Y), rz * Math.sin(Y)); if (sg < 0) th += Math.PI;
    return th - sg * (Math.PI / 2 - th0); }
  const A_DEF = { s: 0, f: 0, e: 0, ef: 0, len: 1, v: A_V, th: A_TH, thick: 1, target: null };
  const aset = (o, s, f, e, ef = 0, len = 1) => { Object.assign(o, A_DEF); o.s = s; o.f = f; o.e = e; o.ef = ef; o.len = len; return 'free'; };
  const A_KEYS = ['s', 'f', 'e', 'ef', 'len', 'v', 'th', 'thick'], alerp = (o, a, b, k) => { for (let j = 0; j < A_KEYS.length; j++) { const key = A_KEYS[j]; o[key] = a[key] + (b[key] - a[key]) * k; } o.target = null; };
  // ARM MOTION (Nov 1, Chikin: "refine the arms", "make them look like natural movement in games"). Poses and dances only say
  // where the arms WANT to be; every number of a free arm (A_KEYS + out = how far grown out of him) is a damped spring chasing
  // that, so nothing ever arrives in one frame: the upper arm leads, the forearm (e, ef) follows a touch later and overshoots a
  // touch more (successive breaking), both settle with a little bounce. On top, his body drives them (secondary motion): yaw speed
  // flings them out and the tips trail the turn, falling lifts them (air drag), rising drags them, squash presses them down,
  // his lean sways them, a take-off / landing kicks them (spud.jumped / spud.land). Pop out = out springs past 1 a little; tuck
  // in = critically damped (no bounce, no pop). Dances: the springs are fed the move a spring-lag ahead (beats per second x
  // 2ζ/ω), so every hit still lands ON the beat, then follows through. Left arm a touch slower than the right: never mirror-perfect.
  const A_NP = 9, A_OUT = 8;
  const A_W = new Float32Array([24, 22, 17, 16, 26, 20, 20, 22, 20]);           // stiffness, rad/s: s f e ef len v th thick out
  const A_Z = new Float32Array([0.62, 0.6, 0.42, 0.45, 0.7, 1, 1, 0.8, 0.65]);  // damping ratio (< 1: overshoots a little, then settles;
  // shoulder ~8%, the forearm more (successive breaking), out ~6%: a pop never reads as longer arms)
  const A_TUCK_W = 30, A_LSLOW = 0.93;
  // limits on the sprung shoulder (pass 2, reviews): never swung under him (A_SMIN), never over his head / across his face
  // (A_SMAX, the tip no further than A_TIPMAX); the elbow always keeps a little bend (A_EMIN, a soft floor: no snap through 0).
  // Dances: brisker springs (A_DRESP) and a stiffer elbow (A_DEK) so the elbow hits land on the beat too, not a quarter-beat late.
  const A_SMIN = 0.3, A_SMAX = 2.75, A_TIPMAX = 2.95, A_EMIN = 0.2, A_DRESP = 1.15, A_DEK = 1.3;
  const eSoft = e => { const ae = e < 0 ? -e : e; return e + A_EMIN * (1 - sstep(0, 2 * A_EMIN, ae)); };   // (monotonic: 0 -> A_EMIN, |e| >= 0.4 unchanged)
  const A_HANG = { ...A_DEF, s: 0.6, f: 0.15, e: 0.5, ef: 0.05 };   // tucked arms rest (and pop out from) hanging at his sides
  const respOf = b => b > 0 ? Math.min(1.25, Math.max(0.8, 0.25 / b)) : 1;   // (a pose's blend time -> how brisk the springs are)
  const clampA = (x, m) => x < -m ? -m : x > m ? m : x;
  function armHang(a) { for (let k = 0; k < 8; k++) a.X[k] = A_HANG[A_KEYS[k]]; a.X[A_OUT] = 0; a.V.fill(0); }
  // poses: (side +1 = our right / -1 = our left, time s, out params) -> 'free' | 'fold' | 'none'
  const A_POSES = {
    none: () => 'none',
    folded: () => 'fold',
    wave: (sg, t, o) => sg > 0 ? aset(o, 2.3, 0.3, 0.5 + 0.45 * Math.sin(t * 10), 0) : 'none',
    point: (sg, t, o) => sg > 0 ? aset(o, 1.5, 0.35, 0.16) : 'none',   // (never dead straight: a little elbow always)
    shrug: (sg, t, o) => aset(o, 0.75, 0.4, 1.35, 0.1, 0.95),
    up: (sg, t, o) => aset(o, 2.72, 0.15, 0.2),
  };
  // dance moves: (side, beat phase in beats — beat k lands on the integer k —, out) -> 'free'; every hit lands ON the beat
  const swing = b => { const c = Math.cos(Math.PI * b); return Math.sign(c) * Math.pow(Math.abs(c), 0.55); };   // +1 / -1 on alternate beats, snappy
  const DANCES = {
    groove(sg, b, o) { const sw = swing(b) * sg, pu = onBeat(b);   // side to side with his sway: the leading arm high, the other low and out;
      // the elbow bends WITH the shoulder (the tip travels, it reads at game size) and both pump down a touch on each hit
      return aset(o, 1.1 + 0.72 * sw - 0.25 * pu, 0.3, 0.5 + 0.25 * sw, 0.1); },
    disco(sg, b, o) { if (sg < 0) return aset(o, 0.95, 0.12, -1.8, 0, 0.92);                                   // our left: on his hip
      const bb = b + 0.2, i = Math.floor(bb), k = ez3((bb - i) / 0.25), up = i % 2 === 0 ? k : 1 - k;        // our right: up to the sky / down to the floor
      return aset(o, 0.5 + 2.1 * up, 0.45 - 0.25 * up, 0.18, 0); },
    'raise-the-roof'(sg, b, o) { const g = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * b), 0.8);   // elbows out, tips up: pushed high ON the beat, dropped right down between
      return aset(o, 0.95 + 0.95 * g, 0.2, 2.05 - 0.75 * g, 0.05); },
    pump(sg, b, o) { const i = Math.round(b), act = (i & 1) ? -1 : 1, g = sg === act ? onBeat(b) : 0;     // fists... no fists: tips punched up, arms taking turns
      return aset(o, 1.1 + 1.75 * g, 0.38 - 0.25 * g, 1.65 - 1.6 * g, 0); },
    wiggle(sg, b, o) { const ph = Math.PI * b + (sg > 0 ? 0 : Math.PI);                                         // noodle arms out, see-sawing
      return aset(o, 1.45 + 0.35 * Math.sin(ph), 0.2, 0.8 * Math.sin(2 * ph + 1.2), 0.15 * Math.cos(2 * ph)); },
  };
  const DANCE_SWAY = { groove: swing,
    disco: b => { const bb = b + 0.2, i = Math.floor(bb), k = ez3((bb - i) / 0.25); return (i % 2 === 0 ? k : 1 - k) * 1.4 - 0.7; },
    'raise-the-roof': () => 0, pump: b => (Math.round(b) & 1 ? -0.6 : 0.6) * onBeat(b), wiggle: b => Math.sin(Math.PI * b) };

  // Vega's folded arms, as the drawn model has them (draw/potato-draw.js ARM_LOBE / ARM_TOP / ARM_S / ARM_LOW, in canon-hd pixels,
  // and its body outline R / L), painted once into a decal his skin shader reads: top half = the art, bottom half = where his face
  // is hidden (the arms cover his mouth, like canon). Decal space = his front view: x = sin(angle round him), y = height t 0.5..1,
  // so at the canon angle it's an exact front projection of the drawn lines. Canon -> 3D: fitted on the eyes (face-canon.png).
  function foldDecal() {
    const R2 = [[0.203, 0.03], [0.267, 0.082], [0.31, 0.134], [0.34, 0.186], [0.365, 0.238], [0.383, 0.29], [0.4, 0.341], [0.415, 0.393], [0.429, 0.445], [0.445, 0.497], [0.464, 0.549], [0.48, 0.601], [0.495, 0.653], [0.5, 0.704], [0.496, 0.756], [0.482, 0.808], [0.454, 0.86], [0.409, 0.912], [0.336, 0.957]];
    const L2 = [[-0.135, 0.03], [-0.222, 0.082], [-0.279, 0.134], [-0.324, 0.186], [-0.359, 0.238], [-0.388, 0.29], [-0.413, 0.341], [-0.434, 0.393], [-0.45, 0.445], [-0.466, 0.497], [-0.479, 0.549], [-0.489, 0.601], [-0.498, 0.653], [-0.502, 0.704], [-0.498, 0.756], [-0.486, 0.808], [-0.463, 0.86], [-0.418, 0.912], [-0.354, 0.957]];
    const side = (S2, v) => { for (let i = 0; i < S2.length - 1; i++) if (v >= S2[i][1] && v <= S2[i + 1][1]) return S2[i][0] + (S2[i + 1][0] - S2[i][0]) * (v - S2[i][1]) / (S2[i + 1][1] - S2[i][1]); return S2[v < S2[0][1] ? 0 : S2.length - 1][0]; };
    const FX = 1.0, TV = 0.435, TT = 0.4935, TS = 0.95, PX = 1024 * TS;   // (canon eyes -> the 3D face's eyes, canon proportions kept; PX: decal px per canon body height)
    const P0 = (x, y) => { const u = (x - 316.5) / 562, v = (y - 38.5) / 578.5, l = side(L2, v), r = side(R2, v); return [(u - (l + r) / 2) / ((r - l) / 2) * FX, TT + TS * (v - TV)]; };
    const MID = P0(330, 452), BIG = 1.1;   // (a touch bigger round their middle: his 3D body is a little wider than canon's, the arms keep canon's share of it)
    const P = pts => pts.map(([x, y]) => { const [X, t] = P0(x, y); return [(MID[0] + (X - MID[0]) * BIG + 1) * 512, (MID[1] + (t - MID[1]) * BIG - 0.5) * 1024]; });
    const LOBE = P([[338, 413], [300, 406], [255, 404], [220, 410], [208, 426], [222, 442], [255, 446], [300, 435], [336, 416]]);
    const TOP = P([[332, 412], [370, 397], [405, 392], [432, 399], [444, 414], [440, 430]]);
    const SS = P([[437, 429], [400, 441], [362, 458], [330, 476], [298, 492], [258, 505], [224, 506], [208, 491]]);
    const LOW = P([[341, 472], [357, 490], [392, 501], [430, 500], [456, 482]]);
    const EL_ = P([[214, 424], [198, 444], [196, 468], [208, 491]]), ER_ = P([[440, 428], [456, 446], [462, 466], [456, 482]]);
    const cr = (Q, per = 10) => { const o = [];   // Catmull-Rom through the points, like the drawn model's brushPts
      for (let i = 0; i < Q.length - 1; i++) { const p0 = Q[Math.max(0, i - 1)], p1 = Q[i], p2 = Q[i + 1], p3 = Q[Math.min(Q.length - 1, i + 2)];
        const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        for (let k = i ? 1 : 0; k <= per; k++) { const t = k / per, m = 1 - t;
          o.push([m * m * m * p1[0] + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * p2[0], m * m * m * p1[1] + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * p2[1]]); } }
      return o; };
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const x = cv.getContext('2d');
    const ink = (Q, wf, color, dy = 0) => { const pts = cr(Q), n = pts.length - 1, A = [], B = [];   // a centreline with widths (the drawn model's ink())
      for (let i = 0; i <= n; i++) { const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n, i + 1)], dx = q[0] - p[0], dyy = q[1] - p[1], d = Math.hypot(dx, dyy) || 1, w = Math.max(0, wf(i / n)) / 2;
        A.push([pts[i][0] - dyy / d * w, pts[i][1] + dx / d * w + dy]); B.push([pts[i][0] + dyy / d * w, pts[i][1] - dx / d * w + dy]); }
      x.fillStyle = color; x.beginPath(); x.moveTo(A[0][0], A[0][1]); for (const p of A) x.lineTo(p[0], p[1]); for (let i = n; i >= 0; i--) x.lineTo(B[i][0], B[i][1]); x.closePath(); x.fill();
      for (const i of [0, n]) { const w = wf(i / n) / 2; if (w > 0.3) { x.beginPath(); x.arc(pts[i][0], pts[i][1] + dy, w, 0, 7); x.fill(); } } };
    const lerp = (a, b, k) => a + (b - a) * k, even = (w, tip = 0.06, lo = 0.55) => t => w * lerp(lo, 1, Math.min(1, Math.min(t, 1 - t) / tip));
    const W = 0.025 * 1024, H = PX * 1.1;   // (ink: as heavy as canon's arm lines next to his 3D outline)
    // shade on the belly under the arms, a highlight along the top of the upper arm, the pocket inside the lobe
    x.globalAlpha = 0.28; ink(SS, t => 0.05 * H * Math.sin(Math.PI * t), '#a35d24', 0.014 * H); ink(LOW, t => 0.03 * H * Math.sin(Math.PI * t), '#a35d24', 0.014 * H);
    x.globalAlpha = 0.45; ink(TOP.slice(0, 4), t => 0.016 * H * Math.sin(Math.PI * t), '#e3a24f', 0.02 * H); x.globalAlpha = 1;
    { const lb = cr(LOBE.concat([LOBE[0]])), g = x.createLinearGradient(LOBE[3][0], 0, LOBE[0][0], 0);
      g.addColorStop(0, '#aa6229'); g.addColorStop(0.6, '#b9702f'); g.addColorStop(1, '#c98036');
      x.fillStyle = g; x.beginPath(); x.moveTo(lb[0][0], lb[0][1]); for (const p of lb) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); }
    ink(LOBE, () => W * 0.96, '#120a05'); ink(TOP, even(W * 1.01, 0.05, 0.8), '#120a05');
    ink(SS, t => W * lerp(1.0, 1.1, Math.sin(Math.PI * t)) * even(1, 0.06, 0.6)(t), '#120a05'); ink(LOW, even(W * 0.98, 0.07, 0.6), '#120a05');
    // bottom half: the band they cover (+ a margin), where his face (the mouth) is hidden
    x.save(); x.translate(0, 512); x.fillStyle = x.strokeStyle = '#fff'; x.lineWidth = W * 2.2; x.lineJoin = 'round';
    const band = cr([].concat(LOBE.slice(0, 5).reverse(), TOP, ER_, LOW.slice().reverse(), SS.slice(4), EL_.slice().reverse()), 6);
    x.beginPath(); x.moveTo(band[0][0], band[0][1]); for (const p of band) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.ellipse(635, 143, 160, 48, 0, 0, 7); x.fill();   // (and his mouth line just above them: canon's skeptical face has none)
    x.restore();
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace; tex.generateMipmaps = false; tex.minFilter = T.LinearFilter; return tex;
  }

  function buildArms() {
    const idx = [], last = (A_NR - 1) * A_RS;
    for (let r = 0; r < A_NR - 1; r++) for (let a = 0; a < A_RS; a++) { const a2 = (a + 1) % A_RS, p = r * A_RS + a, q = r * A_RS + a2, s = p + A_RS, t = q + A_RS; idx.push(p, q, s, q, t, s); }
    for (let a = 0; a < A_RS; a++) idx.push(last + a, last + (a + 1) % A_RS, A_NV - 1, a, A_NV - 2, (a + 1) % A_RS);
    const skin = new T.ShaderMaterial({ uniforms: { skin: { value: A_SKIN }, sleeve: { value: A_SLEEVE }, sleeveOn: { value: 0 }, ...GL },
      vertexShader: TEAR + `attribute float aw; varying vec3 vN; varying float vAw; void main(){ vN = normalize(normalMatrix * normal); vAw = aw; gl_Position = projectionMatrix * modelViewMatrix * vec4(tear(position),1.0); }`,
      fragmentShader: `uniform vec3 skin, sleeve; uniform float tint, sleeveOn; varying vec3 vN; varying float vAw;
        void main(){ vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45, 0.6, 0.65)));
          vec3 base = mix(skin, sleeve, sleeveOn * (1.0 - smoothstep(0.25, 0.6, vAw)));   // (in an outfit: the part by his body is the cloth's colour, a sleeve)
          vec3 c = base * mix(0.9, 1.0, smoothstep(-0.25, -0.05, lit)) * (1.0 - 0.14 * smoothstep(0.5, 0.05, n.z)) * mix(0.9, 1.0, vAw);   // (at the root: his edge tone, so the joint has no seam)
          c = mix(c, vec3(0.6, 0.32, 1.0) * (0.55 + 0.45 * c.r), tint * 0.75); gl_FragColor = vec4(c, 1.0); }` });
    // inverted shells. front = 0: full width, pushed behind his body (only shows outside his silhouette, joining his outline);
    // front = 1: width * aw (0 near him, full once the arm is clear in front of him): the arm's own line over his belly
    const shellA = (w, color, ...r) => hideWhite(shellA0(w, color, ...r), color);
    const shellA0 = (w, color, bias, front) => new T.ShaderMaterial({ side: T.BackSide,
      uniforms: { w: { value: w }, color: { value: new T.Color(color) }, bias: { value: bias }, front: { value: front }, ...GL },
      vertexShader: TEAR + `attribute float aw; uniform float w, bias, front;
        void main(){ vec3 p = tear(position + normalize(normal) * w * mix(1.0, aw, front)); gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
          gl_Position.z += bias * gl_Position.w; }`,
      fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color, 1.0); }` });
    const inkBack = shellA(A_INK, '#120a05', 0.06, 0), inkFront = shellA(A_INK, '#120a05', 0, 1), whiteM = shellA(A_INK + BORDER, '#ffffff', 0.12, 0);
    const group = new T.Group(); group.visible = false; spud.add(group);
    const arms = [-1, 1].map(sg => { const g = new T.BufferGeometry();
      const P = new T.BufferAttribute(new Float32Array(A_NV * 3), 3), N = new T.BufferAttribute(new Float32Array(A_NV * 3), 3), W = new T.BufferAttribute(new Float32Array(A_NV), 1);
      for (const at of [P, N, W]) at.setUsage(T.DynamicDrawUsage);
      g.setAttribute('position', P); g.setAttribute('normal', N); g.setAttribute('aw', W); g.setIndex(idx);
      const ms = [new T.Mesh(g, skin), new T.Mesh(g, inkBack), new T.Mesh(g, inkFront), new T.Mesh(g, whiteM)]; ms.forEach(m => { m.frustumCulled = false; group.add(m); });
      const F = () => new Float32Array(A_NS * 3), R = () => new Float32Array(A_NS);
      return { sg, g, P, N, W, kind: 'none', tgt: F(), tr: R(), tk: R(), tn: F(), tF: 0, from: F(), fr: R(), fk: R(), fn: F(), fF: 0, cur: F(), cr: R(), ck: R(), cn: F(), cF: 0, cw: R(), p: { ...A_DEF }, q: { ...A_DEF },
        p2: { ...A_DEF }, L: { ...A_DEF }, X: new Float32Array(A_NP), V: new Float32Array(A_NP), T: new Float32Array(A_NP), wk: sg < 0 ? A_LSLOW : 1 }; });
    ARM = { group, arms, skin, pose: 'none', mirror: false, k: 1, dur: 0.3, dance: null, prev: null, swB: 0, beat: 0, body: true, amt: 1,
      resp: 1, snap: false, bps: 2, lastB: 0, vn: 0, vnAt: -1e9, tNow: 0 };
    skinMat.uniforms.fold.value = foldDecal();
    for (const a of arms) { noneLine(a, A_V, A_TH); a.cur.set(a.tgt); a.cr.set(a.tr); a.ck.set(a.tk); a.cn.set(a.tn); armHang(a); }
  }
  function noneLine(a, v, th0) { const r0 = A_R0; surfAt(v, shoulderTh(a.sg, v, th0));   // tucked away inside him at the shoulder
    for (let i = 0; i < A_NS; i++) { a.tgt[i * 3] = SP[0] - SN[0] * r0 * 1.6; a.tgt[i * 3 + 1] = SP[1] - SN[1] * r0 * 1.6; a.tgt[i * 3 + 2] = SP[2] - SN[2] * r0 * 1.6; a.tr[i] = r0 * 0.8; a.tk[i] = 0; a.tn[i * 3] = SN[0]; a.tn[i * 3 + 1] = SN[1]; a.tn[i * 3 + 2] = SN[2]; } }
  function freeLine(a, p) {
    const sg = a.sg, len = Math.max(0, p.len), r0 = A_R0 * p.thick; surfAt(p.v, shoulderTh(sg, p.v, p.th));
    const sx = SP[0], sy = SP[1], sz = SP[2], rx = sx - SN[0] * r0 * 1.6, ry = sy - SN[1] * r0 * 1.6, rz = sz - SN[2] * r0 * 1.6;
    const L1 = A_L1 * len, L2 = A_L2 * len; let ex, ey, ez, hx, hy, hz;   // elbow + tip, from the shoulder, in the picture plane (x right, y up, z toward us)
    if (p.target) { let tx = p.target[0], ty = p.target[1], tz = p.target[2], d = Math.hypot(tx, ty, tz) || 1e-6; const reach = (L1 + L2) * 0.98;
      if (d > reach) { tx *= reach / d; ty *= reach / d; tz *= reach / d; d = reach; }
      const ux = tx / d, uy = ty / d, uz = tz / d, ca = Math.max(-1, Math.min(1, (d * d + L1 * L1 - L2 * L2) / (2 * d * Math.max(1e-6, L1)))), sa = Math.sqrt(1 - ca * ca);
      let px = sg * 0.3, py = -1, pz = 0.25; const pd = px * ux + py * uy + pz * uz; px -= pd * ux; py -= pd * uy; pz -= pd * uz; const pl = Math.hypot(px, py, pz) || 1;
      ex = L1 * (ca * ux + sa * px / pl); ey = L1 * (ca * uy + sa * py / pl); ez = L1 * (ca * uz + sa * pz / pl); hx = tx; hy = ty; hz = tz; }
    else { const a1 = p.s, f1 = p.f, a2 = p.s + p.e, f2 = p.f + p.ef;
      ex = L1 * sg * Math.sin(a1) * Math.cos(f1); ey = -L1 * Math.cos(a1) * Math.cos(f1); ez = L1 * Math.sin(f1);
      hx = ex + L2 * sg * Math.sin(a2) * Math.cos(f2); hy = ey - L2 * Math.cos(a2) * Math.cos(f2); hz = ez + L2 * Math.sin(f2); }
    { const c = Math.cos(S.yaw.x), s = Math.sin(S.yaw.x); let k;   // picture plane -> his body space (he's turned by yaw)
      k = ex * c - ez * s; ez = sz + ex * s + ez * c; ex = sx + k; ey += sy;
      k = hx * c - hz * s; hz = sz + hx * s + hz * c; hx = sx + k; hy += sy; }
    const rk = r0 * (0.55 + 0.45 * Math.min(1, len));
    for (let i = 0; i < A_NS; i++) { let x, y, z, r, k;
      if (i < A_K0) { const w = i / A_K0; x = rx + (sx - rx) * w; y = ry + (sy - ry) * w; z = rz + (sz - rz) * w; r = rk; k = 0; }   // the root, inside him
      else { const w = (i - A_K0 + 1) / (A_NS - A_K0), m = 1 - w; x = m * m * sx + 2 * m * w * ex + w * w * hx; y = m * m * sy + 2 * m * w * ey + w * w * hy; z = m * m * sz + 2 * m * w * ez + w * w * hz;
        r = rk * (1 - 0.42 * Math.pow(w, 1.8)); k = sstep(0, 0.3, w); }   // tapers to a rounded point, stubby (2D: 1 -> 0.3)
      a.tgt[i * 3] = x; a.tgt[i * 3 + 1] = y; a.tgt[i * 3 + 2] = z; a.tr[i] = r; a.tk[i] = k; a.tn[i * 3] = 0; a.tn[i * 3 + 1] = 0; a.tn[i * 3 + 2] = 1; } }
  const armResp = A => A.dance ? Math.max(A_DRESP, A.resp) : A.resp;   // (dances: never the soft springs, or the hits land late)
  function armTarget(a, time, still) {   // this frame's wanted line for one arm, from the pose or the dance
    const A = ARM, sg = A.mirror ? -a.sg : a.sg; let kind;
    if (A.dance) {   // fed a spring-lag ahead (2ζ/ω s x beats per second) so the sprung arm crosses each hit ON the beat
      // (a snapped / still frame shows exactly the asked-for beat: no lead)
      const wk = armResp(A) * a.wk, lead = A.snap || still ? 0 : A.bps * 2, lu = lead * A_Z[0] / (A_W[0] * wk), lf = lead * A_Z[2] / (A_W[2] * wk * A_DEK);
      kind = danceAt(a, sg, A.beat + lu, a.p); danceAt(a, sg, A.beat + lf, a.p2); a.p.e = a.p2.e; a.p.ef = a.p2.ef; }
    else { const fn = typeof A.pose === 'string' ? (A_POSES[A.pose] || A_POSES.none) : null;
      if (fn) kind = fn(sg, time, a.p);
      else { const o = A.pose[sg > 0 ? 'R' : 'L']; if (!o || o === 'none') kind = 'none'; else if (o === 'folded') kind = 'fold'; else { Object.assign(a.p, A_DEF, o); kind = 'free'; } } }
    a.kind = kind; a.tF = kind === 'fold' ? 1 : 0;
  }
  function danceAt(a, sg, b, o) { const A = ARM, kind = (DANCES[A.dance] || DANCES.groove)(sg, b, o);
    const kk = A.prev ? (b - A.swB) / 0.75 : 1;   // a new move eases in over 3/4 of a beat
    if (A.prev && kk < 1) { (DANCES[A.prev] || DANCES.groove)(sg, b, a.q); alerp(o, a.q, o, sstep(0, 1, kk)); }   // (o === b: each field reads its own new value first)
    if (A.amt < 1) { aset(a.q, 0.35, 0.2, 0.2, 0, 0); alerp(o, a.q, o, A.amt); }
    // dancing: fuller so the moves read at game size (stubby, not long: Chikin); in an outfit a touch longer, the root inside the shirt (a sleeve)
    if (outfit) { o.len *= 1.12; o.thick *= 1.2; o.v = 0.71; } else { o.thick *= 1.12; }
    return kind; }
  function armsTick(time, dt, still) {
    const A = ARM; if (A.k < 1) A.k = Math.min(1, A.k + dt / Math.max(1e-3, A.dur));
    if (A.prev && A.beat - A.swB >= 0.75) A.prev = null;
    if (A.dance && dt > 0 && !still) { const db = A.beat - A.lastB; if (db > 0 && db < 0.5) A.bps += (Math.min(5, db / dt) - A.bps) * Math.min(1, dt * 10); }   // (the music's tempo, measured; not from stills)
    A.lastB = A.beat;
    const vt = time - A.vnAt, vn = vt > -1e-6 && vt < 0.15 ? A.vn : S.airborne ? clampA(S.vy / 2.6, 1.5) : 0;   // his vertical speed, -1 falling .. 1 taking off (spud.armsMotion in the last 0.15 s, or his own hop)
    A.tNow = time;
    const e = sstep(0, 1, A.k), arms = A.arms; let fw = 0;
    for (let j = 0; j < 2; j++) { const a = arms[j]; armTarget(a, time, still); a.cF = a.fF + (a.tF - a.fF) * e; if (a.cF > fw) fw = a.cF; }
    const w0 = Math.atan2(Math.sin(S.yaw.x), Math.cos(S.yaw.x));
    skinMat.uniforms.foldOn.value = fw * (1 - (w0 > 0 ? sstep(FOLD_HIDE[0], FOLD_HIDE[1], w0) : sstep(FOLD_HIDE[2], FOLD_HIDE[3], -w0)));   // the folded arms: painted on him
    let quiet = !A.dance && A.k >= 1;   // nothing free, nothing still tucking in, nothing blending: no tubes
    for (let j = 0; j < 2; j++) { const a = arms[j]; if (a.kind === 'free' || a.X[A_OUT] > 0.003 || Math.abs(a.V[A_OUT]) > 0.05) quiet = false; }
    A.group.visible = !quiet && !(A.dance && A.noArms);   // (o.noArms: he dances + spins with his body only — Chikin, Nov 8: "no arms")
    if (quiet) { for (let j = 0; j < 2; j++) armHang(arms[j]); A.snap = false; return; }   // (put away hanging: the next pop starts from his sides)
    if (SLV.for !== outfit || (SLV.n < 4 && time - SLV.at > 1.5)) sleeveSample(time);   // (the sleeve colour: once per outfit, re-read a few times while its art loads)
    // his body, felt by the arms: yaw speed (centrifugal fling + trailing tips), lean speed (sway), squash (pressed / stretched)
    const yv = S.yaw.v, cfr = Math.min(1, yv * yv / 170), cfk = cfr * (A.dance ? 0.4 : 1), lv = S.leanX.v * (1 - 0.7 * cfr), sq = S.squash.x - 1;   // (a spin's own shear isn't a sway)
    const nsub = Math.max(1, Math.ceil(dt * 120 - 1e-6)), h = dt / nsub;   // (springs sub-stepped at <= 1/120 s: the same motion at any frame rate)
    for (let j = 0; j < 2; j++) { const a = arms[j], T = a.T, X = a.X, V = a.V, sg = a.sg, free = a.kind === 'free', p = free ? a.p : A_HANG;
      for (let k = 0; k < 8; k++) T[k] = p[A_KEYS[k]];
      T[A_OUT] = free ? 1 : 0;
      if (free) { let s = T[0]; const ss = Math.max(0.3, Math.sin(s)), dk = A.dance ? 0.4 : 1;
        s += (1.62 + sg * 0.07 - s) * 0.6 * cfk + 0.25 * cfk; T[2] *= 1 - 0.25 * cfk;     // spinning: flung out (rising a touch as the whirl peaks), elbow opens a little
        T[1] += sg * clampA(0.035 * yv, 0.6) * dk; T[3] += sg * clampA(0.03 * yv, 0.5) * dk;   // ... and the tips trail the turn (the forearm more)
        s += (vn < 0 ? -0.45 : -0.15) * vn * ss; T[2] -= (vn < 0 ? 0.25 : 0.08) * vn;      // falling: air drag lifts them; rising: dragged down a little
        s += clampA(1.0 * sq, 0.35) * ss;                                                  // squash presses them down (only so far), stretch lifts them
        const cs = Math.cos(s); s -= sg * 0.5 * lv * cs; T[2] -= sg * 0.6 * lv * cs;      // his lean swings them the other way
        if (sg < 0) { s += 0.06; T[2] += 0.06; }                                           // (our left a touch higher + more bent: never mirror-perfect)
        if (p.e >= 0 && T[2] < 0.15) T[2] = 0.15;                                          // (an elbow bent our way is never pushed straight / backwards)
        s = s < 0.5 ? 0.5 - 0.5 * (0.5 - s) : s; T[0] = s > A_SMAX - 0.03 ? A_SMAX - 0.03 : s; }   // (never jabbed into the floor under him, never over his head)
      if (A.snap) { X.set(T); V.fill(0); continue; }
      const wk = armResp(A) * a.wk, tuck = !free ? 0.45 : 1;   // (going back in: they mostly shrink where they are, dropping a little, not swinging all the way down)
      for (let k = 0; k < A_NP; k++) {
        let w = A_W[k] * wk * (k < 4 ? tuck : 1) * (A.dance && (k === 2 || k === 3) ? A_DEK : 1), z = A_Z[k];
        if (k === A_OUT && T[k] === 0) { w = A_TUCK_W * wk; z = 1; }   // tucking in: quick, no bounce
        const to = T[k], w2 = w * w, c = 2 * z * w; let x = X[k], v = V[k];
        for (let m = 0; m < nsub; m++) { v += (-w2 * (x - to) - c * v) * h; x += v * h;
          if (k === 0) { if (x > A_SMAX) { x = A_SMAX; if (v > 0) v *= -0.3; } else if (x < A_SMIN) { x = A_SMIN; if (v < 0) v *= -0.3; } } }   // (a kick / an overshoot meets a soft stop)
        if (k === A_OUT && x < 0) { x = 0; if (v < 0) v = 0; }
        X[k] = x; V[k] = v; } }
    A.snap = false;
    for (let j = 0; j < 2; j++) { const a = arms[j], X = a.X, L = a.L, out = X[A_OUT];
      if (a.kind === 'free' && a.p.target) Object.assign(L, a.p);   // (an IK reach: straight to it, only the growing out is sprung)
      else { for (let k = 0; k < 8; k++) L[A_KEYS[k]] = X[k]; L.target = null;
        let el = eSoft(X[2]); if (X[0] + el > A_TIPMAX) el = Math.max(A_EMIN, A_TIPMAX - X[0]); L.e = el; }   // (always a little elbow; the tip never over his head)
      L.len = Math.max(0, L.len) * out;   // (out > 1 for a moment as it pops: a tiny overshoot in length)
      freeLine(a, L);
      // nearly in: the whole line draws back into the root point inside him (nothing left poking out)
      const m = sstep(0, 0.35, out), r0 = A_R0 * 0.8, bx = a.tgt[0], by = a.tgt[1], bz = a.tgt[2];
      for (let i = 0; i < A_NS; i++) { a.cr[i] = r0 + (a.tr[i] - r0) * m; a.ck[i] = a.tk[i] * m;
        a.cur[i * 3] = bx + (a.tgt[i * 3] - bx) * m; a.cur[i * 3 + 1] = by + (a.tgt[i * 3 + 1] - by) * m; a.cur[i * 3 + 2] = bz + (a.tgt[i * 3 + 2] - bz) * m;
        a.cn[i * 3] = a.tn[i * 3]; a.cn[i * 3 + 1] = a.tn[i * 3 + 1]; a.cn[i * 3 + 2] = a.tn[i * 3 + 2]; } }
    for (let j = 0; j < 2; j++) { const a = arms[j];
      for (let i = 0; i < A_NS; i++) {
        // never into him: anything meant to be out of him that would sink in is pushed back out to stand half an arm proud
        const x = a.cur[i * 3], y = a.cur[i * 3 + 1], z = a.cur[i * 3 + 2], r = a.cr[i];
        if (!ellAt(x, y, z)) { a.cw[i] = a.ck[i] > 0 ? 1 : 0; continue; }
        const want = r * 0.6 + 0.004; let d = EL.d;
        if (d < want && a.ck[i] > 0) { const nd = d + (want - d) * a.ck[i], D = EL.rE + nd; a.cur[i * 3] = EL.cx + EL.ux * D; a.cur[i * 3 + 2] = EL.cz + EL.uz * D; d = nd; }
        a.cw[i] = a.ck[i] > 0 ? sstep(r * 1.05, r * 1.05 + 0.035, d) : 0; }   // (its own line only once the whole tube is clear of him)
      tube(a); }
  }
  function tube(a) {   // the mesh round the centreline, then a rounded cap at each end (no hands)
    const C = a.cur, R = a.cr, U = a.cn, P = a.P.array, N = a.N.array, W = a.W.array;
    let tx = 0, ty = -1, tz = 0, nx = 0, ny = 0, nz = 1, bx = 1, by = 0, bz = 0;
    const ring = (v0, cx, cy, cz, rr, cs, sn, w) => {   // one ring of A_RS vertices round (cx,cy,cz); cs/sn: the cap's bend (1/0 on the arm)
      for (let k = 0; k < A_RS; k++) { const v = v0 + k, ca = A_COS[k], sa = A_SIN[k];
        P[v * 3] = cx + (nx * ca + bx * sa) * rr; P[v * 3 + 1] = cy + (ny * ca + by * sa) * rr; P[v * 3 + 2] = cz + (nz * ca + bz * sa) * rr;
        let qx = (nx * ca + bx * sa) * cs + tx * sn, qy = (ny * ca + by * sa) * cs + ty * sn, qz = (nz * ca + bz * sa) * cs + tz * sn; const ql = Math.hypot(qx, qy, qz) || 1;
        N[v * 3] = qx / ql; N[v * 3 + 1] = qy / ql; N[v * 3 + 2] = qz / ql; W[v] = w; } };
    const cap = (C0, sgn, rr, cw, ring0, pole) => {   // a rounded end
      for (let c = 1; c <= A_CAP; c++) { const ph = c / (A_CAP + 1) * Math.PI / 2, cs = Math.cos(ph), sn = Math.sin(ph);
        ring(ring0(c) * A_RS, C[C0] + sgn * tx * rr * sn, C[C0 + 1] + sgn * ty * rr * sn, C[C0 + 2] + sgn * tz * rr * sn, rr * cs, cs, sgn * sn, cw); }
      P[pole * 3] = C[C0] + sgn * tx * rr; P[pole * 3 + 1] = C[C0 + 1] + sgn * ty * rr; P[pole * 3 + 2] = C[C0 + 2] + sgn * tz * rr;
      N[pole * 3] = sgn * tx; N[pole * 3 + 1] = sgn * ty; N[pole * 3 + 2] = sgn * tz; W[pole] = cw; };
    for (let i = 0; i < A_NS; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(A_NS - 1, i + 1);
      const dx = C[i1 * 3] - C[i0 * 3], dy = C[i1 * 3 + 1] - C[i0 * 3 + 1], dz = C[i1 * 3 + 2] - C[i0 * 3 + 2], L = Math.hypot(dx, dy, dz);
      if (L > 1e-7) { tx = dx / L; ty = dy / L; tz = dz / L; }
      // the frame: 'forward' (or his surface normal) made square to the arm; failing that, the last ring's
      let ux = U[i * 3], uy = U[i * 3 + 1], uz = U[i * 3 + 2], dd = ux * tx + uy * ty + uz * tz; ux -= dd * tx; uy -= dd * ty; uz -= dd * tz; let ul = Math.hypot(ux, uy, uz);
      if (ul < 0.2) { dd = nx * tx + ny * ty + nz * tz; ux = nx - dd * tx; uy = ny - dd * ty; uz = nz - dd * tz; ul = Math.hypot(ux, uy, uz);
        if (ul < 1e-4) { ux = ty; uy = -tx; uz = 0; ul = Math.hypot(ux, uy) || 1; } }
      nx = ux / ul; ny = uy / ul; nz = uz / ul; bx = ty * nz - tz * ny; by = tz * nx - tx * nz; bz = tx * ny - ty * nx;
      const sl = L > 1e-7 ? (R[i1] - R[i0]) / L : 0;
      ring((A_CAP + i) * A_RS, C[i * 3], C[i * 3 + 1], C[i * 3 + 2], R[i], 1, -sl, a.cw[i]);
      if (i === 0) cap(0, -1, R[0], a.cw[0], c => A_CAP - c, A_NV - 2);
    }
    cap((A_NS - 1) * 3, 1, R[A_NS - 1], a.cw[A_NS - 1], c => A_CAP + A_NS - 1 + c, A_NV - 1);
    a.P.needsUpdate = a.N.needsUpdate = a.W.needsUpdate = true;
  }
  // the sleeve: the outfit's cloth colour where the arms come out (his sides, at shoulder height); none if the cloth doesn't
  // cover him there (a hat, a bib): then the arms are just him. A few small reads per outfit, never per frame.
  const A_SLEEVE = new T.Vector3(1, 1, 1), SLV = { for: undefined, at: -9, n: 0 };
  function sleeveSample(time) {
    if (SLV.for !== outfit) { SLV.for = outfit; SLV.n = 0; } SLV.at = time; SLV.n++;
    let on = 0; const cv = outfit && outfit.canvas;
    try { if (cv && cv.width > 8 && cv.height > 8 && cv.getContext) { const x = cv.getContext('2d'), W = cv.width, H = cv.height; let r = 0, g = 0, b = 0, n = 0, tot = 0;
      for (const sg of [-1, 1]) { const u = (sg * A_TH + Math.PI) / (2 * Math.PI), x0 = Math.max(0, Math.floor((u - 0.03) * W)), y0 = Math.floor(0.62 * H), w = Math.max(1, Math.floor(0.06 * W)), h = Math.max(1, Math.floor(0.16 * H));
        const d = x.getImageData(x0, y0, Math.min(w, W - x0), h).data;
        for (let i = 0; i < d.length; i += 16) { tot++; if (d[i + 3] > 128) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } } }
      if (tot && n / tot > 0.35) { A_SLEEVE.set(r / n / 255, g / n / 255, b / n / 255); on = 1; } } } catch (e) { on = 0; }
    if (ARM) ARM.skin.uniforms.sleeveOn.value = on; }
  function armsSnap() { for (const a of ARM.arms) { a.from.set(a.cur); a.fr.set(a.cr); a.fk.set(a.ck); a.fn.set(a.cn); a.fF = a.cF; } }
  // body moves that go with a dance: a lean toward the beat's side, a dip on every beat (only while he's not walking)
  function danceBody() { const A = ARM, b = A.beat, sw = (DANCE_SWAY[A.dance] || DANCE_SWAY.groove)(b) * A.amt;
    if (S.walking || S.ducking || S.airborne) return;
    S.leanX.to = 0.06 * sw; spud.rotation.z = -0.07 * sw;
    const f = (b + 0.1) - Math.floor(b + 0.1); S.squash.to = 1 - 0.08 * A.amt * Math.exp(-7 * f) + (A.dance === 'raise-the-roof' ? 0.04 * onBeat(b) * A.amt : 0); }

  // ---------- moves ----------
  const api = {
    poke(point, normal, power = 1) {   // point/normal in the body's own space
      S.dents.push({ p: point.clone(), n: normal.clone().normalize(), s: Object.assign(new Spring(0, 90, 5), { }) });
      const d = S.dents[S.dents.length - 1]; d.s.kick(9 * power); d.s.to = 0;
      S.wob.kick(6 * power); S.squash.kick(-1.2 * power); if (S.dents.length > 6) S.dents.shift();
    },
    hop() { if (!S.airborne) { S.squash.kick(-3); setTimeout(() => { S.airborne = true; S.vy = 2.6; S.squash.kick(4); }, 90); } },
    waddle(on = !S.walking) { S.walking = on; return on; },
    spin() { S.yaw.to += Math.PI * 2; S.wob.kick(3); },
    turnTo(rad) { S.yaw.to = rad; },
    turnBy(rad) { S.yaw.to += rad; },
    face(on) { skinMat.uniforms.faceOn.value = on ? 1 : 0; },
    setFace(tex) { skinMat.uniforms.face.value = tex; },   // a live face (the game paints his mouth + blinks onto a canvas)
    snap(yaw) { S.yaw.x = S.yaw.to = yaw; S.yaw.v = 0; lastYaw = yaw; },   // for stills: no springs in flight
    frame(t) { tick(t, 1 / 60, true); return renderer.domElement.toDataURL('image/png'); },
    // ---- game hooks (the game owns position + physics; the model does the squish) ----
    step(time, dt) { tick(time, dt); },
    place(x, y) { spud.position.x = x; S.baseY = y; },
    duck(on) { S.ducking = on; },
    land(speed) { S.squash.kick(-Math.min(7, speed * 1.4)); S.wob.kick(Math.min(4, speed * 0.6));
      // arms out from the air (the driver's pose object) or dancing: they flop down a little with the landing (the forearm after),
      // while they go back in. Not the level's beat bounce on a gesture / arms already tucking (a pose by name or 'none').
      if (ARM && (ARM.dance || (ARM.pose && typeof ARM.pose === 'object'))) { const k = Math.min(7, speed) * (ARM.dance ? 0.15 : 1);
        for (const a of ARM.arms) { a.V[0] -= 0.45 * k * Math.max(0.4, Math.sin(a.X[0])); a.V[2] += 0.35 * k; } } },
    jumped() { S.squash.kick(4.5); if (ARM) for (const a of ARM.arms) { a.V[0] -= 2; a.V[2] += 1.5; } },   // (take-off: they're left behind for a moment)
    // the arms feel his vertical speed: vn = vy / take-off speed (1 leaving the ground, 0 at the top, -1 coming down); call per frame
    // while it matters (armsfx.mjs does). Without it they use his own hop.
    armsMotion(vn) { if (ARM) { ARM.vn = vn > 1.5 ? 1.5 : vn < -1.5 ? -1.5 : vn || 0; ARM.vnAt = ARM.tNow; } return api; },
    glitch(k) { GL.tint.value = k; },
    // ---- arms (off until asked; see the arms block above) ----
    // arms(pose, blend s): 'none' | 'folded' | 'wave' | 'point' | 'shrug' | 'up' (+ '-l' = the other arm: 'wave-l', 'point-l'),
    // or { L: {s, e, f, ef, len, v, th, thick, target} | 'folded' | 'none', R: ... }. Blends from wherever the arms are now.
    arms(pose = 'none', blend = 0.3) {
      if (!ARM) { if (!pose || pose === 'none') return api; buildArms(); }
      armsSnap(); ARM.dance = null; ARM.prev = null; let p = pose || 'none', mirror = false;
      if (typeof p === 'string' && p.endsWith('-l')) { p = p.slice(0, -2); mirror = true; }
      ARM.pose = p; ARM.mirror = mirror; ARM.dur = blend; ARM.k = blend > 0 ? 0 : 1; ARM.resp = respOf(blend); if (!(blend > 0)) ARM.snap = true; return api; },
    // dance(move, beat, o): call every frame with the music's beat phase in beats (beat k lands on the integer k); every move hits
    // ON the beat. move: 'groove' | 'disco' | 'raise-the-roof' | 'pump' | 'wiggle'; a new move eases in over 3/4 of a beat.
    // o.body (default true): he sways + dips with it; o.amount 0..1; o.mirror. dance(null, 0, {after}) stops (arms blend to 'none' / after).
    dance(move, beat = 0, o = NO_OPT) {
      if (!move) { if (ARM && ARM.dance) { armsSnap(); ARM.dance = null; ARM.prev = null; ARM.pose = o.after || 'none'; ARM.mirror = false; ARM.dur = o.blend ?? 0.35; ARM.k = 0;
        ARM.resp = respOf(ARM.dur); if (!(ARM.dur > 0)) { ARM.k = 1; ARM.snap = true; } } return api; }
      if (!ARM) buildArms();
      if (!ARM.dance) { armsSnap(); ARM.k = 0; ARM.dur = o.blend ?? 0.35; ARM.prev = null; ARM.resp = respOf(ARM.dur); if (!(ARM.dur > 0)) { ARM.k = 1; ARM.snap = true; } ARM.lastB = beat; }
      else if (move !== ARM.dance) { ARM.prev = ARM.dance; ARM.swB = beat; }
      ARM.dance = move; ARM.beat = beat; ARM.noArms = !!o.noArms; ARM.body = o.body !== false; ARM.amt = o.amount ?? 1; ARM.mirror = !!o.mirror; return api; },
    armsState: () => ARM ? { pose: ARM.pose, dance: ARM.dance, k: ARM.k, shown: ARM.group.visible,   // (+ the sprung shoulder / elbow / out, [L, R]: for tests)
      s: [ARM.arms[0].X[0], ARM.arms[1].X[0]], e: [ARM.arms[0].X[2], ARM.arms[1].X[2]], out: [ARM.arms[0].X[A_OUT], ARM.arms[1].X[A_OUT]] } : null,
    state: S, scene, camera: cam, renderer, body, spud,
    // put an outfit on (a builder from outfits3d.mjs), or null for just potato
    wear(build) {
      if (outfit) { outfit.parts.forEach(o => o.parent && o.parent.remove(o)); outfit = null; }
      const P = puffAttr.array; P.fill(0); cloth.visible = false;
      if (build) {
        outfit = build(KIT);
        for (let k = 0; k < q; k++) P[k] = outfit.puff ? outfit.puff(meta[k * 2], meta[k * 2 + 1]) : 0;
        const old = clothTex.image; if (old && (old.width !== outfit.canvas.width || old.height !== outfit.canvas.height)) clothTex.dispose();   // (a new size can't reuse the GPU texture: the simulation skin's 2x2 blank left every outfit after it bare, Nov 5)
        clothTex.image = outfit.canvas; clothTex.needsUpdate = true; cloth.visible = true;
        outfit.parts.forEach(o => { spud.add(o); o.traverse(c => { c.frustumCulled = false; }); });
      }
      puffAttr.needsUpdate = true; S.squash.kick(-2); S.wob.kick(3);   // a little bounce as it goes on
    }
  };
  // what an outfit builder gets: three.js, his measurements, the deformed surface, outline makers
  const KIT = { T, INK, BORDER, FOOT_H, ROWS, COLS, rx: t => prof(profile.front, t), rz: t => prof(profile.side, t), S, shell, GL,   // (GL: his glitch uniforms, so an outfit's own pieces tear + flood purple with him: many-eyed)
    // the deformed ring of his surface at height t (body heights from his top): COLS+1 points + its centre, in body space
    ring(t) { const j = Math.max(0, Math.min(ROWS, Math.round((t - 0.012) / 0.976 * ROWS))), p = pos.array, pts = [], c = new T.Vector3();
      for (let i = 0; i <= COLS; i++) { const k = (j * (COLS + 1) + i) * 3, v = new T.Vector3(p[k], p[k + 1], p[k + 2]); pts.push(v); if (i < COLS) c.add(v); }
      c.multiplyScalar(1 / COLS); return { pts, c }; },
    top() { const k = TOP * 3, p = pos.array; return new T.Vector3(p[k], p[k + 1], p[k + 2]); },
    surf: () => pos.array,   // (his deformed surface, raw: [x,y,z] per (row*(COLS+1)+col) — read it without allocating: many-eyed's 34 eyes every frame)
    // a mesh with its own ink line + white sticker border (inverted shells)
    outlined(geometry, material, inkK = 1) { const g = new T.Group();
      g.add(new T.Mesh(geometry, material), new T.Mesh(geometry, shell(INK * 0.75 * inkK, '#120a05')), new T.Mesh(geometry, shell(INK * 0.75 * inkK + BORDER, '#ffffff'))); return g; },
    // flat-ish painted material with the same light as his body
    paint(color) { return new T.ShaderMaterial({ uniforms: { color: { value: new T.Color(color) } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 color; varying vec3 vN; void main(){ vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45,0.6,0.65)));
        vec3 c = color * mix(0.8, 1.0, smoothstep(-0.25, -0.05, lit)) * (1.0 - 0.14*smoothstep(0.5,0.05,n.z)) + 0.18*smoothstep(0.82,0.97,lit);
        gl_FragColor = vec4(c,1.0); }` }); }
  };

  // like the 2D model's faceYaw: past 3/4 his face turns slower than his body, so side-on he keeps a sliver of eye
  // (Vega's turnaround), then lets go round the back
  function faceYaw(y) {
    const w = Math.atan2(Math.sin(y), Math.cos(y)), a = Math.abs(w), sg = Math.sign(w) || 1;
    let f = a < 0.8 ? a : 0.8 + 0.52 * (1 - Math.exp(-(a - 0.8) / 0.35));
    if (a > 1.9) { const k = Math.min(1, (a - 1.9) / 0.5), e = k * k * (3 - 2 * k); f = f + (a - f) * e; }
    return { shift: sg * f - w };
  }
  function tick(time, dt, still = false) {
    dt = Math.min(dt, 1 / 30);
    if (!still) {
      for (const sp of [S.yaw, S.squash, S.leanX, S.leanZ, S.wob]) sp.step(dt);
      S.dents = S.dents.filter(d => (d.s.step(dt), Math.abs(d.s.x) > 1e-3 || Math.abs(d.s.v) > 1e-3));
      // turning makes the top lag behind (sideways shear opposite the turn speed)
      const turnV = (S.yaw.x - lastYaw) / dt; lastYaw = S.yaw.x; S.leanX.kick(-turnV * 0.02 * dt * 60);
      // hop: simple gravity, squash on landing
      if (S.airborne) { S.vy -= 9.8 * dt; S.y += S.vy * dt; if (S.y <= 0) { S.y = 0; S.airborne = false; S.squash.kick(-5); S.wob.kick(4); } }
      // waddle: feet step in turn, body rocks side to side and bobs
      if (S.walking) { S.walk += dt * 7; const st = Math.sin(S.walk);
        feet[0].position.y = 0.04 + 0.05 * Math.max(0, st); feet[1].position.y = 0.04 + 0.05 * Math.max(0, -st);
        S.leanX.to = 0.05 * st; spud.rotation.z = -0.07 * st; S.squash.to = 1 - 0.04 * Math.abs(Math.cos(S.walk)); }
      else { feet[0].position.y = feet[1].position.y = 0.04; S.leanX.to = 0; spud.rotation.z *= 0.9; S.squash.to = 1; }
      // idle breathing
      if (!S.walking && !S.airborne) S.squash.to = 1 + 0.012 * Math.sin(time * 2.2);
      if (S.ducking) S.squash.to = 0.66;
      if (ARM && ARM.dance && ARM.body) danceBody();
    }
    spud.rotation.y = S.yaw.x; spud.position.y = S.y + (S.baseY || 0); GL.gtime.value = time;
    skinMat.uniforms.faceShift.value = faceYaw(S.yaw.x).shift / (Math.PI * 2);
    deform(time);
    if (ARM) armsTick(time, dt, still);
    if (outfit && outfit.update) outfit.update(KIT, dt, time);
    if (renderer) renderer.render(scene, cam);
  }

  // ---------- input: drag to turn him, tap to poke ----------
  // his geometry bends every frame: never frustum-cull any of him on a stale bounding box (hats included)
  spud.traverse(o => { o.frustumCulled = false; }); S.baseY = 0;
  if (game) return api;   // the game handles input and the loop
  const ray = new T.Raycaster(), ptr = new T.Vector2();
  let down = null;
  renderer.domElement.addEventListener('pointerdown', e => { down = { x: e.clientX, yaw: S.yaw.to, moved: false }; renderer.domElement.setPointerCapture(e.pointerId); });
  renderer.domElement.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 4) down.moved = true;
    if (down.moved) S.yaw.to = down.yaw + dx / W() * Math.PI * 2; });
  renderer.domElement.addEventListener('pointerup', e => {
    if (down && !down.moved) {
      const r = renderer.domElement.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      ray.setFromCamera(ptr, cam); const hit = ray.intersectObject(body)[0];
      if (hit) { const local = body.worldToLocal(hit.point.clone()); const nrm = hit.face.normal.clone(); api.poke(local, nrm); }
      else api.hop();
    }
    down = null; });

  if (!opts.still) { let last = performance.now(); const loop = now => { tick(now / 1000, (now - last) / 1000); last = now; requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  else tick(0, 1 / 60, true);
  return api;
}

// MANY-EYED (Chat's 051-many-eyed-potato, made 3D and alive). Chikin: "if you can make the multiple eyed sticker a skin" ·
// "i think he needs eyes all around though" · "and they should all move independently".
// His face is Chat's front design: two big eyes, eight small ones, one brow, a tiny closed mouth. Then more small eyes in
// the same style all the way round his sides and back (Chat's back views are empty: we draw those). EVERY eye is its own
// animated piece: its own pupil darting about on its own clock, its own blinks. Not painted: each eye is a real disc on
// his surface (ink ring, white, pupil), riding his squish every frame, tearing purple with his glitch.
//
// The skin: a copy of his own painted skin goes over him (it hides his canon face), then the brow + mouth are inked on it.
// The eyes: 3 instanced layers x 2 sizes = 6 draw calls for all 30 eyes (cheap on phones).
//
// The hook for a level (Last Lights): globalThis.POTATO_EYES = { open, snap, blink, stamp } (no clocks: the level says what's
// true NOW, in song time, so a video render with its own clock gets the same eyes).
//   open: how many eyes are awake, a count (Chat's front ten first, then the ones round him; a sleeping eye is a shut ink
//   line) · snap: every eye on the camera at once (a big beat) · blink: all shut together · stamp: performance.now() when
//   written: older than 3 s is ignored (a level quit mid-song can't leave him half-asleep anywhere else).
// export EYES: how many eyes the regular skin has (the level counts its wake-up stages out of this).
// export make(spec) builds a variant (one-eyed.mjs uses it with one big eye).
import { painter, W, RM, INK } from '../outfits3d.mjs';

const SKIN = new Image(); SKIN.src = new URL('../skin.png', import.meta.url).href;
try { await SKIN.decode(); } catch (e) {}
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// Chat's front design, measured off front-garment.png (u across the body box, v down it; white radius in body heights)
const FRONT = [
  [0.384, 0.395, 'big'], [0.684, 0.399, 'big'],
  [0.540, 0.167], [0.734, 0.236], [0.270, 0.246], [0.178, 0.484], [0.828, 0.509], [0.298, 0.622], [0.689, 0.632], [0.490, 0.657]];
// all round him: rows at t, angles (0 = his front, ±π his back), a size each; spread so no two crowd
const ROUND = [
  [0.20, [1.15, -1.2, 1.85, -1.9, 2.55, -2.5, Math.PI], 1.0],
  [0.40, [1.45, -1.5, 2.15, -2.2, 2.85, -2.8], 1.25],
  [0.58, [1.2, -1.25, 1.9, -1.85, 2.55, -2.6, Math.PI], 1.05],
  [0.74, [1.6, -1.55, 2.3, -2.3], 0.9]];
const R_BIG = 0.082, R_SMALL = 0.042;   // (small: Chat's front small eyes measured again, 1.3x the first pass)
const SIZES = [0.72, 1.0, 1.32];   // the eyes round him come in three sizes (one size all over read as polka dots)
export const EYES = FRONT.length + ROUND.reduce((n, r) => n + r[1].length, 0);

export function make(spec) {
  return function build(H) {
    const T = H.T, P = painter(), { x } = P;
    // ---- the skin: his own paint, so his canon face is gone, then Chat's brow + mouth ----
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); if (SKIN.naturalWidth) x.drawImage(SKIN, 0, 0, P.c.width, P.c.height); else { x.fillStyle = '#d9963f'; x.fillRect(0, 0, P.c.width, P.c.height); } x.restore();
    const tOf = v => 0.014 + v * 0.975, thOf = (u, t) => { const xx = (u - 0.5) * W * 0.976; return Math.asin(Math.max(-0.98, Math.min(0.98, xx / H.rx(t)))); };
    const pt = (u, v) => { const t = tOf(v); return [thOf(u, t) * RM, t]; };
    x.lineCap = 'round'; x.strokeStyle = INK;
    for (const [pts, w] of spec.ink || []) { x.beginPath(); pts.forEach(([u, v], i) => x[i ? 'lineTo' : 'moveTo'](...pt(u, v))); x.lineWidth = w; x.stroke(); }

    // ---- the eyes ----
    const eyes = [];
    for (const [u, v, k, sc] of spec.front) { const t = tOf(v); eyes.push({ t, th: thOf(u, t), big: k === 'big', s: sc || 1 }); }
    if (spec.round) for (const [t, ths, s] of spec.round) for (const th of ths) eyes.push({ t, th, big: false, round: true, s: s * 0.8 * SIZES[Math.floor(rnd(th * 3.1, t * 7) * 3)] });
    eyes.forEach((e, i) => { e.i = i; e.j = Math.max(0, Math.min(H.ROWS, Math.round((e.t - 0.012) / 0.976 * H.ROWS)));
      e.col = Math.round((e.th + Math.PI) / (2 * Math.PI) * H.COLS);
      // its own clock: when it next darts, where it looks, when it next blinks
      e.nextDart = rnd(i, 1) * 1.5; e.nextBlink = 1 + rnd(i, 2) * 5; e.px = 0; e.py = 0; e.tx = 0; e.ty = 0; e.blink = -9; e.seed = i * 7.3;
      e.k = (e.j * (H.COLS + 1) + Math.max(0, Math.min(H.COLS, e.col))) * 3; });   // (where it sits in his surface array: read straight, no allocations per frame)
    // the surface frame (from his base profile: the deformed position comes from the ring each frame)
    const V = (a, b, c) => new T.Vector3(a, b, c), d = 0.01;
    for (const e of eyes) { const rx = H.rx(e.t), rz = H.rz(e.t), rxp = (H.rx(e.t + d) - H.rx(e.t - d)) / (2 * d), rzp = (H.rz(e.t + d) - H.rz(e.t - d)) / (2 * d);
      const s = Math.sin(e.th), c = Math.cos(e.th), dT = V(rxp * s, -1, rzp * c), dTh = V(rx * c, 0, -rz * s);
      e.n = dT.clone().cross(dTh).normalize(); e.tu = dTh.normalize(); e.tv = e.n.clone().cross(e.tu).normalize(); }
    // the pieces: a disc bent a little to his curve (big eyes), three layers per size
    const disc = (r, bend) => { const g = new T.CircleGeometry(1, 28), p = g.attributes.position; if (bend) for (let k = 0; k < p.count; k++) { const a = p.getX(k), b = p.getY(k); p.setZ(k, -(a * a + b * b) * r * r / (2 * 0.48)); } return g; };
    const GLU = H.GL || { tint: { value: 0 }, gtime: { value: 0 } };
    const mat = col => new T.ShaderMaterial({ uniforms: { color: { value: new T.Color(col) }, tint: GLU.tint, gtime: GLU.gtime },
      vertexShader: `uniform float tint, gtime; void main(){ vec4 p = instanceMatrix * vec4(position, 1.0);
        p.x += tint * 0.11 * sin(floor(p.y * 13.0) * 7.13 + gtime * 47.0); gl_Position = projectionMatrix * modelViewMatrix * p; }`,
      fragmentShader: `uniform vec3 color; uniform float tint; void main(){ vec3 c = mix(color, vec3(0.6, 0.32, 1.0) * (0.55 + 0.45 * color.r), tint * 0.75); gl_FragColor = vec4(c, 1.0); }` });
    const group = new T.Group(), layers = {};
    for (const big of [true, false]) { const list = eyes.filter(e => e.big === big); if (!list.length) continue;
      const g = disc(big ? R_BIG : R_SMALL, false), L = {};
      for (const [k, col] of [['ink', INK], ['white', '#fbfaf3'], ['pupil', INK]]) { const m = new T.InstancedMesh(g, mat(col), list.length); m.instanceMatrix.setUsage(T.DynamicDrawUsage); m.frustumCulled = false; group.add(m); L[k] = m; }
      layers[big ? 'big' : 'small'] = { L, list }; }
    const M = new T.Matrix4(), Q = new T.Quaternion(), Sc = new T.Vector3(), Pv = new T.Vector3(), P0 = new T.Vector3(), basis = new T.Matrix4(), view = new T.Vector3(), wq = new T.Quaternion();
    for (const e of eyes) { basis.makeBasis(e.tu, e.tv, e.n); e.q = new T.Quaternion().setFromRotationMatrix(basis); }   // (its orientation on him: fixed, worked out once)
    let lastTime = null, cur = null, ck = 0;
    const put = (m, off, sx, sy, ox = 0, oy = 0) => { const e = cur; Pv.copy(P0).addScaledVector(e.n, off).addScaledVector(e.tu, ox).addScaledVector(e.tv, oy); Sc.set(sx, sy, 1); M.compose(Pv, e.q, Sc); m.setMatrixAt(ck, M); };
    const surfArr = H.surf ? H.surf : null, rows = {}, ringPt = e => { if (surfArr) { const p = surfArr(); return P0.set(p[e.k], p[e.k + 1], p[e.k + 2]); } const r = rows[e.j] || (rows[e.j] = H.ring(0.012 + e.j / H.ROWS * 0.976)); return P0.copy(r.pts[e.col]); };
    const NE = eyes.length, NF = spec.front.length;
    return { canvas: P.c, parts: [group], puff: () => 0,
      update(K, dt, time) {
        let E = globalThis.POTATO_EYES || {}; const now = time || 0; if (lastTime == null) lastTime = now;
        if (E.stamp != null && typeof performance !== 'undefined' && performance.now() - E.stamp > 3000) E = {};   // (stale: the level that wrote it is gone)
        for (const j in rows) delete rows[j];
        const step = Math.max(0, Math.min(0.1, now - lastTime)); lastTime = now;
        // where the camera is, in his own space (so "look at the camera" works for the eyes round his sides too)
        group.getWorldQuaternion(wq); view.set(0, 0.12, 1).normalize().applyQuaternion(wq.invert());
        const snap = !!E.snap, open = E.open == null ? NE : E.open, all = !!E.blink;
        // the side they all lean toward (his side-eye): flips now and then; each eye darts round it on its own clock
        const lean = (rnd(Math.floor(now / 3.7), 77) < 0.5 ? -1 : 1) * 0.32;
        for (const key in layers) { const { L, list } = layers[key];
          for (let k = 0; k < list.length; k++) { const e = list[k];
            // its own life: darts, blinks
            if (now >= e.nextDart || now < e.nextDart - 10) { const a = rnd(e.seed, Math.floor(now * 3)) * 6.283, r = 0.25 + 0.4 * rnd(e.seed + 1, Math.floor(now * 3));
              e.tx = lean + Math.cos(a) * r * 0.7; e.ty = Math.sin(a) * r * 0.6; e.nextDart = now + 0.35 + 2.2 * rnd(e.seed + 2, Math.floor(now * 5)); }
            if (now >= e.nextBlink || now < e.nextBlink - 20) { e.blink = now; e.nextBlink = now + 1.6 + 5 * rnd(e.seed + 3, Math.floor(now * 7)); }
            let tx = e.tx, ty = e.ty;
            if (snap) { tx = view.dot(e.tu) * 0.75; ty = view.dot(e.tv) * 0.75; const L2 = Math.hypot(tx, ty); if (L2 > 0.62) { tx *= 0.62 / L2; ty *= 0.62 / L2; } }
            const kk = Math.min(1, step * (snap ? 40 : 22)); e.px += (tx - e.px) * kk; e.py += (ty - e.py) * kk;
            const awake = e.i < Math.max(open, open > 0 ? NF : 0);
            const bt = now - e.blink, bl = bt >= 0 && bt < 0.15 ? Math.sin(bt / 0.15 * Math.PI) : 0;
            const squint = e.round ? 0.8 : 1;   // (the ones round him narrow a little: sceptical, like his own lids)
            let lid = awake ? squint * (1 - 0.95 * Math.max(bl, all ? 1 : 0)) : 0.05; if (snap && awake) lid = 1;
            // on his surface now
            ringPt(e); cur = e; ck = k; const R = (e.big ? R_BIG : R_SMALL) * e.s;
            const inkR = e.big ? R + 0.019 : R * 1.42, pupR = e.big ? R * 0.27 : R * 0.42;
            const o0 = e.big ? 0.016 : 0.006, pz = snap ? 1.22 : 1;   // (a big flat eye stands a little proud, or his face's curve swallows its rim)
            put(L.ink, o0, inkR, inkR * Math.max(0.13, lid));
            put(L.white, o0 + 0.002, R, R * lid);
            put(L.pupil, o0 + 0.004, pupR * pz, pupR * pz * Math.min(1, lid * 1.3), e.px * R * 0.62, e.py * R * 0.62 * lid);
          }
          L.ink.instanceMatrix.needsUpdate = true; L.white.instanceMatrix.needsUpdate = true; L.pupil.instanceMatrix.needsUpdate = true; }
      } };
  };
}
export default make({
  front: FRONT, round: ROUND,
  // Chat's brow (one, arched, over his left big eye toward the middle) and the tiny closed frown
  ink: [[[[0.355, 0.262], [0.40, 0.235], [0.455, 0.228], [0.5, 0.245]], 0.016], [[[0.5, 0.548], [0.53, 0.528], [0.565, 0.53], [0.59, 0.552]], 0.014]],
});

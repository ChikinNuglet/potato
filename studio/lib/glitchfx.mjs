// glitchfx.mjs — Potato's glitch, the real kind (Chikin: "needs to look like real glitching, not that weird wavy thing").
// Potato is rendered into his own layer, then composited over the world through a digital-corruption shader:
//   hard horizontal slices that jump sideways · purple / magenta channel split at his edges · blocks that pixelate ·
//   slices that drop out · all stepped at 12 fps with freeze-holds, like a corrupted video frame.
// Only Potato glitches; the world and the screen never do. His glitch words (draw/glitchwords.js) flicker in the cracks.
import * as T from './vendor/three.module.js';

export function createGlitchFX(renderer) {
  const rt = new T.WebGLRenderTarget(4, 4, { samples: 4 });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: { tex: { value: rt.texture }, amount: { value: 0 }, seed: { value: 0 }, box: { value: new T.Vector4(0, 0, 1, 1) },
                res: { value: new T.Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tex; uniform float amount, seed; uniform vec4 box; uniform vec2 res; varying vec2 vUv;
      float h(float n){ return fract(sin(n * 91.3458) * 47453.5453); }
      vec4 tap(vec2 p){ return (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) ? vec4(0.0) : texture2D(tex, p); }
      void main(){
        vec2 uv = vUv;
        if (amount <= 0.001) { gl_FragColor = texture2D(tex, uv); return; }
        // work in Potato-sized units: box = his screen rect (x0, y0, w, h in uv)
        float ly = (uv.y - box.y) / box.w;
        // (Chikin: "his glitch … needs to be tighter and glitchier": thinner slices that cling to him, smaller jumps, faster
        // and harder stepping, blocks jumping inside him, a bright tear line, posterized slices)
        // slices of uneven height: three layers of hashed cuts, thin
        float band = floor(ly * 22.0 + h(floor(ly * 5.0) + seed) * 3.0 + h(floor(ly * 2.0) + seed * 1.7) * 2.0);
        float r1 = h(band * 1.37 + seed * 3.17), r2 = h(band * 4.11 + seed * 1.93), r3 = h(band * 7.7 + seed), r4 = h(band * 2.9 + seed * 5.1);
        float hit = step(r1, amount * 0.95);
        vec2 p = uv;
        p.x += hit * (r2 - 0.5) * box.z * 0.22 * amount;                        // slice jumps sideways (tight: within a fifth of him)
        p.x += (h(seed * 7.1) - 0.5) * box.z * 0.03 * amount;                 // the whole of him jitters a hair on every step
        if (hit > 0.5 && r3 < 0.4) {                                           // blocky slice: pixelate
          vec2 cell = vec2(box.z, box.w) / mix(30.0, 12.0, r2);
          p = (floor(p / cell) + 0.5) * cell;
        }
        { vec2 bc = floor((uv - box.xy) / (box.zw / 7.0)); float br = h(bc.x * 13.1 + bc.y * 71.7 + seed * 3.3);   // small blocks jump inside him
          if (br < 0.18 * amount) p += (vec2(h(br * 97.0), h(br * 53.0)) - 0.5) * box.zw * 0.12; }
        float drop = hit * step(0.9, r3);                                      // slice drops out this frame
        float split = box.z * (0.02 + 0.04 * hit) * amount;
        vec4 c = tap(p), l = tap(p - vec2(split, 0.0)), r = tap(p + vec2(split, 0.0));
        // channel split: purple ghost to the left, magenta to the right, where his shape doesn't overlap itself
        vec3 col = c.rgb; float a = c.a;
        float lp = l.a * (1.0 - c.a), rm = r.a * (1.0 - c.a);
        col = mix(col, vec3(0.604, 0.322, 1.0), lp); a = max(a, lp * 0.9);
        col = mix(col, vec3(0.878, 0.235, 0.812), rm * (1.0 - lp)); a = max(a, rm * 0.9);
        // inside a hit slice the colour itself corrupts toward his purples (and some slices posterize hard)
        col = mix(col, vec3(0.482, 0.235, 0.949) * (0.6 + 0.6 * c.r), hit * 0.45 * amount);
        if (hit > 0.5 && r4 < 0.3) col = floor(col * 3.0 + 0.5) / 3.0;
        // a little binary green (Chikin: "his glitching should be purple with a little bit of binary green"): inside the hit
        // slices, a few small cells flicker a green 1 or 0
        { vec2 gc = (uv - box.xy) / (box.zw / vec2(16.0, 11.0)), gi = floor(gc), gf = fract(gc); float gr = h(gi.x * 17.3 + gi.y * 41.9 + seed * 2.7);
          if (hit > 0.5 && gr < 0.09 * amount && c.a > 0.1) {
            float one = step(abs(gf.x - 0.5), 0.09) * step(0.18, gf.y) * step(gf.y, 0.82);
            vec2 q = (gf - 0.5) * vec2(1.0, 0.72); float zero = step(abs(length(q) - 0.26), 0.07);
            float bit = h(gr * 91.0 + seed) < 0.5 ? one : zero;
            col = mix(col, vec3(0.302, 1.0, 0.604), bit * 0.95); } }
        float tear = step(0.985 - 0.02 * amount, h(floor(ly * 60.0) + seed * 9.0)) * c.a;               // a bright tear line now and then
        col = mix(col, vec3(0.92, 0.85, 1.0), tear * 0.8 * amount);
        // thin scan lines
        col *= 1.0 - 0.12 * amount * step(0.5, fract(uv.y * res.y / 3.0));
        a *= 1.0 - drop;
        gl_FragColor = vec4(col * a, a);    // premultiplied
      }` }));
  quad.material.blending = T.CustomBlending; quad.material.blendSrc = T.OneFactor; quad.material.blendDst = T.OneMinusSrcAlphaFactor;
  const quadScene = new T.Scene(); quadScene.add(quad);
  const quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // glitch words in the cracks (HTML, stepped like the shader)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const words = ((typeof window !== 'undefined' && window.POTATO_GLITCH_WORDS) || ['krrzzt', 'wh@t?!', 's0r—t@', 'err', '404', 'n0 sig', 'still h3re']).map(esc);
  let wordsEl = null;
  const fx = {
    amount: 0,
    setWordsLayer(el) { wordsEl = el; },
    // render: world first (already drawn by the caller), then Potato's layer through the shader
    render(potatoScene, cam, time, rect /* {x,y,w,h} in uv, his screen box */) {
      const size = renderer.getDrawingBufferSize(new T.Vector2());
      if (rt.width !== size.x || rt.height !== size.y) rt.setSize(size.x, size.y);
      const prevClear = renderer.getClearAlpha(), prevColor = renderer.getClearColor(new T.Color());
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(true, true, true);
      renderer.render(potatoScene, cam);
      renderer.setRenderTarget(null); renderer.setClearColor(prevColor, prevClear);
      // stepped seed at 12 fps, with freeze-holds (a stuck frame now and then)
      const step = Math.floor(time * 24), held = (Math.sin(step * 12.9898) * 43758.5453 % 1 + 1) % 1 < 0.35;   // (24 fps, harder holds: glitchier)
      if (!held) fx._seed = step;
      const U = quad.material.uniforms;
      U.amount.value = fx.amount; U.seed.value = (fx._seed || 0) % 997; U.res.value.set(size.x, size.y);
      if (rect) U.box.value.set(rect.x, rect.y, rect.w, rect.h);
      const auto = renderer.autoClear; renderer.autoClear = false; renderer.render(quadScene, quadCam); renderer.autoClear = auto;
      // words
      if (wordsEl) {
        if (fx.amount > 0.25 && rect && !fx.noWords) {   // (a level can switch the floating phrases off: theme.gwords false — Ghost's phone)
          const n = 1 + Math.floor(fx.amount * 2.5), r = k => ((Math.sin((fx._seed || 0) * 78.233 + k * 12.9898) * 43758.5453) % 1 + 1) % 1;
          let html = '';
          for (let k = 0; k < n; k++) {
            const x = (rect.x + rect.w * (r(k) * 1.4 - 0.2)) * 100, y = (1 - rect.y - rect.h * r(k + 7)) * 100;
            html += `<span style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%">${words[Math.floor(r(k + 3) * words.length)]}</span>`;
          }
          if (wordsEl.innerHTML !== html) wordsEl.innerHTML = html;
        } else if (wordsEl.innerHTML) wordsEl.innerHTML = '';
      }
    },
    dispose() { rt.dispose(); }
  };
  return fx;
}

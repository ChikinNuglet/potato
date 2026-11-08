// SIMULATION (Chikin, Nov 1: "if someone wants to watch the demo, they go to machine learning and its like potato running a
// simulation, we could even do a special model of potato made up of binary"). Not clothes: Potato AS the simulation.
// His shape is a dark teal hologram with HIS GLITCH WORDS raining down it (was 0s and 1s until Nov 2) (a few columns in his own purple), his outline a
// glowing green line, his sticker edge a pale green glow, a faint scanline + flicker, and his face (the live one: blinks,
// expressions) drawn in light on top, so he still reads as him.
//
// How (cheap): no new body. While he wears it, his own body / outline / sticker-edge / feet materials are swapped for the
// simulation ones (same mesh, same squish, same glitch tear + purple flood), and swapped back the moment it comes off
// (the part's 'removed' event: any wear() takes it off). The binary is one tiny glyph texture (a 0 and a 1); the shader
// works out every column's glyphs, speeds and falling bright heads from the time: nothing allocated or uploaded per frame.
// One extra draw: a thin green line shell inside his ink line (so the edge reads glow · dark gap · glow).
// No hands. No purple except the glitch-accent columns (and his glitch itself).

const GREEN = '#4dff9a', EDGE = '#c6ffdc', FEET_BACK = 0.06;   // green binary hologram; only his GLITCH is purple (Chikin, Nov 2)

// HIS GLITCH LANGUAGE, not 0s and 1s (Chikin, Nov 2: "can you make that binary actually his glitch language?"). Binary Potato
// is only ever him (D-20261102-41), so the code raining down him is his own words: each column spells one of his glitch
// words (glitchwords.js: "krrzzt", "wh@t?!", "s0r—t@"…) falling top to bottom, a gap, then another.
// The glyph sheet: every character his words use, white on clear, 16 x 8 cells; redrawn once Major Mono Display loads.
const WORDS_FALLBACK = ['krrzzt', 'wh@t?!', 's0r—t@', 'bzzrpt', 'm@yb_e', 'hmm_0x', 'w3ird?!', 'tk—zz—tk', 'f1n—e', 'g0t_it?'];
const GC = 16, GR = 8, NW = 64, WL = 16;   // glyph grid, how many words, letters per word slot (word + gap)
function wordList() {
  const all = (typeof window !== 'undefined' && window.POTATO_GLITCH_WORDS) || WORDS_FALLBACK;
  const ok = all.filter(w => w.length >= 3 && w.length <= WL - 2);
  const out = []; for (let i = 0; i < NW; i++) out.push(ok[(i * 37) % ok.length]);   // (a fixed spread through the list)
  return out;
}
function charset(words) { return [...new Set(words.join(''))].slice(0, GC * GR); }
function glyphSheet(chars, canvas) {
  const c = canvas || document.createElement('canvas'); c.width = GC * 64; c.height = GR * 64; const x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '400 46px "Major Mono Display", "JetBrains Mono", monospace';
  chars.forEach((ch, i) => x.fillText(ch, (i % GC) * 64 + 32, Math.floor(i / GC) * 64 + 34));
  return c;
}

const TEAR = `uniform float tint, gtime; vec3 tear(vec3 p){ p.x += tint * 0.11 * sin(floor(p.y * 13.0) * 7.13 + gtime * 47.0); return p; }`;
const PURPLE = `vec3 glitchP(vec3 c){ return mix(c, vec3(0.6, 0.32, 1.0) * (0.55 + 0.45 * c.r), tint * 0.75); }`;

export default function build(H) {
  const T = H.T;
  const GL = H.GL || { tint: { value: 0 }, gtime: { value: 0 } };
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 2;   // (his cloth layer stays empty: all clear, so it draws nothing)
  const group = new T.Group(), stime = { value: 0 };
  let swapped = null, owned = [], armWhites = null, armSkinMat = null, armSwap = null, host = null, armsDone = false, armTick = 0;
  // (the arm meshes are made the first time he uses his arms, maybe after the skin went on: armsOn() is re-tried from update)
  function armsOn() { if (!host || !armSwap || armsDone) return; let n = 0;
    host.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.aw || !o.material) return; n++;
      if (swapped.some(e => e[0] === o)) return; const u = o.material.uniforms;
      if (u && u.w && u.color) { const c = u.color.value; if (c.r > 0.9 && c.g > 0.9 && c.b > 0.9 && !armWhites.some(e => e[0] === u)) { armWhites.push([u, c.clone()]); c.set(EDGE); } }
      else if (o.material !== armSkinMat && !(u && u.w)) armSwap(o, armSkinMat); });
    if (n) armsDone = true; }

  function wearOn(spud) {
    if (swapped) return;
    const kids = spud.children;
    const body = kids.find(o => o.isMesh && o.material && o.material.uniforms && o.material.uniforms.faceShift);
    if (!body) return;   // (not a spud we know: stay invisible rather than guess)
    const isShell = (o, white) => o.isMesh && o.geometry === body.geometry && o.material.side === T.BackSide && o.material.uniforms && o.material.uniforms.color && (o.material.uniforms.color.value.r > 0.5) === white;
    const ink = kids.find(o => isShell(o, false)), border = kids.find(o => isShell(o, true));
    const feet = kids.filter(g => g.isGroup && g.children.length === 3 && g.children[0].isMesh && g.children[0].geometry.type === 'SphereGeometry' && Math.abs(Math.abs(g.position.x) - 0.21) < 1e-3);
    const U = body.material.uniforms;

    const words = wordList(), chars = charset(words.concat(['01']));   // (0 and 1 for the plain binary)
    const sheet = glyphSheet(chars);
    const glyphTex = new T.CanvasTexture(sheet); glyphTex.colorSpace = T.NoColorSpace; glyphTex.anisotropy = 4;
    if (typeof document !== 'undefined' && document.fonts && document.fonts.load)   // (redraw in his font once it's there)
      document.fonts.load('46px "Major Mono Display"').then(() => { glyphSheet(chars, sheet); glyphTex.needsUpdate = true; }).catch(() => {});
    // the words as data: row = word, texel = its glyph's cell in the sheet (255 = the gap between words)
    const wd = new Uint8Array(WL * NW * 4).fill(255);
    words.forEach((w, r) => [...w].forEach((ch, k) => { const i = chars.indexOf(ch); if (i >= 0) wd[(r * WL + k) * 4] = i; }));
    const wordTex = new T.DataTexture(wd, WL, NW, T.RGBAFormat); wordTex.magFilter = wordTex.minFilter = T.NearestFilter; wordTex.generateMipmaps = false; wordTex.needsUpdate = true;   // (exact lookups: no blending between letters)
    const simMat = new T.ShaderMaterial({
      uniforms: { face: U.face, faceOn: U.faceOn, faceShift: U.faceShift, tint: GL.tint, gtime: GL.gtime, stime, glyphs: { value: glyphTex }, wordsT: { value: wordTex }, g0: { value: chars.indexOf('0') }, g1: { value: chars.indexOf('1') } },   // (his live face uniforms, shared: blinks + expressions carry on)
      vertexShader: TEAR + `varying vec2 vUv; varying vec3 vN;
        void main(){ vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(tear(position), 1.0); }`,
      fragmentShader: TEAR + PURPLE + `uniform sampler2D face, glyphs, wordsT; uniform float faceOn, faceShift, stime, g0, g1; varying vec2 vUv; varying vec3 vN;
        float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        const float NC = 40.0, NR = 13.0;
        float drop(float col, float tc, float k){   // a bright head falling down the column, a fading trail above it
          float hd = fract(stime * (0.16 + 0.22 * h1(col + k)) + h1(col + k * 3.1)) * 1.7 - 0.35, d = hd - tc;
          return d > 0.0 ? exp(-d * 7.0) : 0.0; }
        void main(){
          float t = 1.0 - vUv.y;                                   // 0 his top .. 1 his base
          float cx = vUv.x * NC, col = mod(floor(cx), NC);
          float off = h1(col) * 40.0 - stime * (0.7 + 1.5 * h1(col + 3.0));   // the glyphs stream down, each column its own speed
          float v = t * NR + off, row = floor(v);
          vec2 lu = vec2(fract(cx), fract(v));
          // his words down the column: which word comes from the column + how many words have passed (each slot = word + gap)
          float slot = floor(row / ${WL}.0), k = row - slot * ${WL}.0;
          float wi = floor(h1(col * 1.37 + slot * 7.91) * ${NW}.0);
          float gw = floor(texture2D(wordsT, vec2((k + 0.5) / ${WL}.0, (wi + 0.5) / ${NW}.0)).r * 255.0 + 0.5);   // his word's letter here
          float tickB = floor(stime * (0.3 + 1.2 * h1(col + 9.0)) + h2(vec2(col, row)) * 7.0);
          float bit = step(0.5, h2(vec2(col * 1.37 + tickB * 3.1, row)));   // plain binary: 0 or 1, flipping now and then
          // WHERE IT GLITCHES (Chikin: "its all regular binary, and some of it glitches, and that lettering is his glitch in purple"):
          // a few columns break for a moment, plus stray cells; there the binary turns into his glitch letters, in purple
          float colG = step(0.86, h1(col * 2.31 + floor(stime * 0.9 + h1(col + 4.0) * 5.0)));
          float cellG = step(0.975, h2(vec2(col * 3.7 + floor(stime * 6.0), row)));
          // and whole PATCHES of him break (blocks a few columns wide), each for a beat, then snap back
          float bx = floor(col / 4.0), by = floor(t * 5.0), bt = floor(stime * 1.6);
          float blockG = step(0.80, h1(bx * 7.13 + by * 13.7 + bt * 3.31));
          float glit = max(max(colG, cellG), blockG) * step(gw, 250.0);
          float gi = glit > 0.5 ? gw : (bit > 0.5 ? g1 : g0);
          vec2 cell = vec2(mod(gi, ${GC}.0), floor(gi / ${GC}.0 + 0.001));
          vec2 cont = vec2(cx / ${GC}.0, -v / ${GR}.0);              // (smooth coords for the mip level: no seams at cell edges)
          float a = gi > 250.0 ? 0.0 : textureGrad(glyphs, vec2((cell.x + lu.x) / ${GC}.0, 1.0 - (cell.y + lu.y) / ${GR}.0), dFdx(cont), dFdy(cont)).a;
          float tc = (row + 0.5 - off) / NR;                         // this glyph's height on him
          float hd1 = drop(col, tc, 5.0), hd2 = drop(col, tc, 13.0);
          float b = 0.2 + 0.85 * hd1 + 0.55 * hd2;
          float head = smoothstep(0.80, 0.98, max(hd1, hd2));
          bool mag = h1(floor(stime * 9.0) + col * 3.3 + row) > 0.7;          // the glitch flickers purple / magenta
          vec3 gc = glit > 0.5 ? (mag ? vec3(0.88, 0.24, 0.81) : vec3(0.72, 0.46, 1.0)) : vec3(0.30, 1.0, 0.60);
          vec3 base = mix(vec3(0.020, 0.085, 0.095), vec3(0.010, 0.045, 0.055), t);
          vec3 n = normalize(vN); float lit = dot(n, normalize(vec3(-0.45, 0.6, 0.65)));
          base *= mix(0.75, 1.0, smoothstep(-0.25, -0.05, lit));
          // his face, in light: ink lines + pupils bright, the eye whites a soft glow; the rain quietens behind it
          vec4 f = texture2D(face, vec2(vUv.x - faceShift, vUv.y)); float fa = f.a * faceOn, L = dot(f.rgb, vec3(0.333));
          float ink = fa * smoothstep(0.55, 0.15, L), wh = fa * smoothstep(0.45, 0.85, L);
          vec3 c = base + gc * a * min(1.2, b) * (1.0 - 0.8 * fa);
          c = mix(c, glit > 0.5 ? vec3(0.95, 0.88, 1.0) : vec3(0.92, 1.0, 0.95), a * head * (1.0 - fa));
          // READABLE WORDS (Chikin: "make words readable"): two glitch captions written across his front, one on the forehead,
          // one on the belly. Each flickers in, holds, glitches out and swaps to another of his words; a dark strip behind it.
          for (int ci = 0; ci < 2; ci++) {
            float fi = float(ci), ty = fi < 0.5 ? 0.16 : 0.80, hb = 0.10, cw0 = 0.034;
            float sp = stime * 0.42 + fi * 0.5, slot = floor(sp), ph = fract(sp);
            float wi2 = floor(h1(slot * 3.17 + fi * 41.0) * ${NW}.0);
            float len = 0.0;
            for (int q = 0; q < ${WL}; q++) { float g2 = floor(texture2D(wordsT, vec2((float(q) + 0.5) / ${WL}.0, (wi2 + 0.5) / ${NW}.0)).r * 255.0 + 0.5); if (g2 > 250.0) break; len += 1.0; }
            float cw = min(cw0, 0.26 / max(len, 1.0));   // (long words shrink to fit his front)
            float jit = (h1(floor(stime * 14.0) + fi) - 0.5) * 0.012 * step(0.82, ph);   // a glitch shove as it goes
            float xs = 0.5 + faceShift - len * cw * 0.5 + jit;
            float on = smoothstep(0.0, 0.06, ph) * (1.0 - smoothstep(0.86, 0.95, ph)) * step(0.12, h1(floor(stime * 24.0) + fi * 9.0));
            float inBand = step(abs(t - ty), hb * 0.5);
            float kx = (vUv.x - xs) / cw;
            float inWord = step(0.0, kx) * step(kx, len) * inBand;
            float plate = step(-0.6, kx) * step(kx, len + 0.6) * step(abs(t - ty), hb * 0.62);
            c = mix(c, base * 0.45, plate * on * 0.85 * (1.0 - fa));
            if (inWord > 0.5) {
              float k2 = floor(kx), g3 = floor(texture2D(wordsT, vec2((k2 + 0.5) / ${WL}.0, (wi2 + 0.5) / ${NW}.0)).r * 255.0 + 0.5);
              vec2 cl = vec2(mod(g3, ${GC}.0), floor(g3 / ${GC}.0 + 0.001)), l2 = vec2(fract(kx), (t - (ty - hb * 0.5)) / hb);
              float a2 = g3 > 250.0 ? 0.0 : texture2D(glyphs, vec2((cl.x + l2.x) / ${GC}.0, 1.0 - (cl.y + l2.y) / ${GR}.0)).a;
              c = mix(c, h1(floor(stime * 11.0) + fi) > 0.6 ? vec3(0.88, 0.24, 0.81) : vec3(0.72, 0.46, 1.0), a2 * on * (1.0 - fa));
            }
          }
          // THE GLITCH, OBVIOUS (Chikin: "the glitches have to be obvious, like static and purple electric"): inside a broken patch,
          // crackling static (every pixel re-rolled each frame) and purple electric arcs zigzagging down through it
          float inG = max(blockG, colG) * (1.0 - fa);
          if (inG > 0.5) {
            float st = h2(floor(gl_FragCoord.xy * 0.5) + floor(stime * 30.0) * vec2(7.1, 3.3));
            c = mix(c, vec3(0.10, 0.03, 0.22), 0.35);                                     // the patch goes dark purple
            c += vec3(0.75, 0.45, 1.0) * step(0.78, st) * 0.55 + vec3(1.0) * step(0.965, st) * 0.6;   // static
            float seg = floor(t * 26.0), fr = floor(stime * 22.0);
            float ax = (h1(seg * 1.7 + fr + bx * 9.0) - 0.5) * 0.8, ax2 = (h1((seg + 1.0) * 1.7 + fr + bx * 9.0) - 0.5) * 0.8;
            float xa = mix(ax, ax2, fract(t * 26.0));                                     // a zigzag down the patch
            float px = fract(cx / 4.0) * 4.0 - 2.0;                                       // position across the 4-column block
            float arc = exp(-pow((px - xa * 2.0) * 9.0, 2.0)), glow = exp(-pow((px - xa * 2.0) * 2.5, 2.0));
            float live = step(0.35, h1(fr * 0.37 + bx));                                  // arcs crackle on and off
            c += live * (vec3(0.95, 0.85, 1.0) * arc * 1.2 + vec3(0.60, 0.25, 1.0) * glow * 0.6 + vec3(0.88, 0.24, 0.81) * glow * 0.25);
          }
          c += vec3(0.30, 1.0, 0.60) * 0.32 * pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0);   // the hologram's rim light
          c = mix(c, vec3(0.16, 0.50, 0.38), wh * 0.85);
          c = mix(c, vec3(0.86, 1.0, 0.93), ink);
          // hologram: scanlines, a slow bright band rolling down, a faint flicker
          c *= 0.84 + 0.16 * step(0.5, fract(gl_FragCoord.y * 0.34));
          c += vec3(0.30, 1.0, 0.60) * 0.10 * exp(-pow((t - (fract(stime * 0.21) * 1.6 - 0.3)) * 11.0, 2.0));
          c *= 0.93 + 0.07 * h1(floor(stime * 18.0));
          gl_FragColor = vec4(glitchP(c), 1.0); }` });
    // his feet: dark hologram nubs with the same rim light
    const footMat = new T.ShaderMaterial({ uniforms: { tint: GL.tint, gtime: GL.gtime },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z += ${FEET_BACK} * gl_Position.w; }`,
      fragmentShader: `uniform float tint, gtime; varying vec3 vN; ` + PURPLE + ` void main(){ vec3 n = normalize(vN);
        vec3 c = vec3(0.02, 0.08, 0.09) + vec3(0.30, 1.0, 0.60) * 0.35 * pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0); gl_FragColor = vec4(glitchP(c), 1.0); }` });
    const edgeMat = H.shell(H.INK + H.BORDER, EDGE, true, 0.12);                  // the sticker edge, as light (stays behind everything, like the white)
    const footEdge = H.shell(H.INK * 0.8 + H.BORDER, EDGE, false, 0.12), footInk = H.shell(H.INK * 0.8, GREEN, false, FEET_BACK);
    owned = [glyphTex, wordTex, simMat, footMat, edgeMat, footEdge, footInk];

    swapped = [];
    const swap = (mesh, m) => { if (mesh) { swapped.push([mesh, mesh.material]); mesh.material = m; } };
    swap(body, simMat); swap(border, edgeMat);
    for (const g of feet) { swap(g.children[0], footMat); swap(g.children[1], footInk); swap(g.children[2], footEdge); }
    // the glowing outline: a thin green shell inside his ink line (it wins the depth test there), his black ink shows outside it
    // HIS ARMS go binary too (Chikin: "the machine learning binary skin should override any costumes, right now its potato in
    // costume as binary"): the arm tubes (geometry with an 'aw' attribute, spud3d's arm system) get the hologram skin, and their
    // white sticker shell turns to the pale green edge; the ink stays. Restored with everything else when the skin comes off.
    const armSkin = new T.ShaderMaterial({ uniforms: { tint: GL.tint, gtime: GL.gtime },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float tint, gtime; varying vec3 vN; ` + PURPLE + ` void main(){ vec3 n = normalize(vN);
        vec3 c = vec3(0.02, 0.10, 0.10) + vec3(0.30, 1.0, 0.60) * (0.18 + 0.4 * pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0)); gl_FragColor = vec4(glitchP(c), 1.0); }` });
    owned.push(armSkin); armWhites = [];
    armSkinMat = armSkin; armSwap = swap; host = spud; armsOn();
    const lineMat = H.shell(H.INK * 0.58, GREEN, true, 0); owned.push(lineMat);
    const line = new T.Mesh(body.geometry, lineMat); line.frustumCulled = false; group.add(line);
  }
  function wearOff() {
    if (swapped) for (const [mesh, m] of swapped) mesh.material = m;
    if (armWhites) { for (const [u, c] of armWhites) u.color.value.copy(c); armWhites = null; }
    armSkinMat = null; armSwap = null; host = null; armsDone = false;
    swapped = null; group.clear(); for (const o of owned) o.dispose(); owned = [];
  }
  group.addEventListener('added', () => wearOn(group.parent));
  group.addEventListener('removed', wearOff);

  return { canvas, parts: [group], puff: () => 0,
    update(K, dt, time) { if (!swapped && group.parent) wearOn(group.parent); else if (swapped && !armsDone && ++armTick % 20 === 0) armsOn(); stime.value = time || 0; } };
}

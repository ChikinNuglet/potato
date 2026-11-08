// view.mjs — what the runner looks like (three.js). Each level has a theme (backdrop, colours); the course hangs in the
// dark; the sung words are the course's edges and obstacles; the lyric line floats in the dead space as glitching art
// (Chikin's text rule: art, never a sing-along); light beams sweep on the beat; Potato is the only tan + purple thing and
// the only thing that glitches purple. Vertical levels turn the camera on its side.
import * as T from '../play/vendor/three.module.js';
import { letterShake, spamBoxes, beamX, waveX, PW, PH, POWERS, shipPose, shipMouth, rockSize } from './core.mjs';
import { createDecor } from './decor.mjs';
import { createStory, createOverlay } from './story.mjs';
import { drawPower, drawActivate, FX_DUR } from './powerfx.mjs';
import { PAINT, DEFAULT_OBJECTS, IG_OBJECTS, tileTexture } from './obstacles.mjs';
import { armsDriver } from './armsfx.mjs';   // his arms: out on jumps + spins, gone when he stands or waddles (Chikin, Nov 1)
import { makeSpudShip, glitchBoltTex, drawFx, drawSpit, fxShake, hitStop, lastFx } from './shootfx.mjs';   // (Confidently Incorrect's shooter feel: his ship, glitch bolts, hits + booms)

const MONO = '"Major Mono Display", ui-monospace, monospace';
const POWER_COLOR = { king: '#ffcf4a', disco: '#ff5cc8', detective: '#d8c39a', construction: '#ffb020', astronaut: '#8fd3ff',
  ghost: '#e9e6ff', knight: '#c9d3e0', diver: '#3fe0d0', cyborg: '#6dffb0', singularity: '#fff3c4' };
const POWER_GLYPH = { king: '♛', disco: '✦', detective: '?', construction: '▤', astronaut: '☄', ghost: '☁', knight: '⛨', diver: '◉', cyborg: '⌁', singularity: '✺' };

// ---------- the backdrop: one full-screen shader, a mode per world ----------
const MODES = { binary: 0, grid: 1, stars: 2, city: 3, terminal: 4, page: 5, plain: 9 };   // plain: just the base colour (the story paints the sky)
function glyphAtlas() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#fff'; x.font = `bold 54px ${MONO}`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('0', 32, 34); x.fillText('1', 96, 34);
  const t = new T.CanvasTexture(c); t.minFilter = T.LinearFilter; return t;
}
function backdrop(theme) {
  const mat = new T.ShaderMaterial({ depthWrite: false, depthTest: false,
    uniforms: { glyphs: { value: glyphAtlas() }, time: { value: 0 }, camX: { value: 0 }, camY: { value: 0 }, beat: { value: 0 }, kick: { value: 0 },
      aspect: { value: 1.6 }, warm: { value: 0 }, hit: { value: -1 }, mode: { value: MODES[theme.backdrop || 'binary'] ?? 0 },
      base: { value: new T.Color(theme.bg || '#030604') }, ink: { value: new T.Color(theme.digit || '#2bff88') }, ink2: { value: new T.Color(theme.digit2 || '#ffbf73') },
      bass: { value: 0 }, treble: { value: 0 }, lights: { value: 1 }, rot: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: `
      uniform sampler2D glyphs; uniform float time, camX, camY, beat, kick, aspect, warm, hit, mode, bass, treble, lights, rot;
      uniform vec3 base, ink, ink2; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      vec3 tint(){ return mix(ink, ink2, warm); }
      // falling binary columns
      float binaryL(vec2 uv, float cell, float par, float seed){
        vec2 off = rot > 0.5 ? vec2(camY * par * 0.5, -camX * par) : vec2(camX * par, camY * par * 0.5);   // on its side, the course scrolls up the screen
        vec2 p = vec2(uv.x * aspect, uv.y) / cell + off / cell;
        float col = floor(p.x); float sp = 0.6 + 1.4 * h(vec2(col, seed));
        float fall = time * sp * 2.0 + h(vec2(col, seed + 1.0)) * 50.0;
        float row = floor(p.y + fall); vec2 f = fract(vec2(p.x, p.y + fall));
        float head = fract(-(row) / 22.0 + h(vec2(col, seed + 2.0)));
        float on = step(0.35, h(vec2(col, row + seed)));
        float flip = step(0.5, h(vec2(col * 1.7 + row, floor(beat) + seed)));
        float glyph = texture2D(glyphs, vec2(f.x * 0.5 + flip * 0.5, f.y)).r;
        return glyph * on * (0.05 + pow(head, 5.0));
      }
      void main(){
        vec2 uv = vUv;
        vec3 c = base; float pulse = 1.0 + 0.55 * kick;
        if (mode < 0.5 || mode > 4.5) {                                 // binary (the 404), page (the wiki: paler)
          float b = binaryL(uv, 0.045, 0.04, 1.0) * 0.16 + binaryL(uv, 0.07, 0.12, 7.0) * 0.24 + binaryL(uv, 0.11, 0.3, 13.0) * 0.30;
          c += b * pulse * tint() * (mode > 4.5 ? 0.6 : 1.0);
        } else if (mode < 1.5) {                                         // grid: the party floor, pumping
          vec2 p = vec2(uv.x * aspect + camX * 0.05, uv.y);
          float horizon = 0.42; float d = max(0.001, horizon - uv.y);
          vec2 g = vec2((p.x - aspect * 0.5) / d, 1.0 / d + time * 2.0);
          float lines = (smoothstep(0.96, 1.0, fract(g.x * 0.5)) + smoothstep(0.92, 1.0, fract(g.y * 0.25))) * step(uv.y, horizon);
          c += lines * tint() * (0.25 + 0.5 * kick) * clamp(d * 3.0, 0.0, 1.0);
          c += tint() * 0.06 * (1.0 + bass) * smoothstep(0.5, 1.0, uv.y);
          c += binaryL(uv, 0.08, 0.1, 3.0) * 0.08 * ink2;
        } else if (mode < 2.5) {                                         // stars: the typing void
          vec2 p = (vec2(uv.x * aspect, uv.y) + vec2(camX * 0.01, camY * 0.01)) * 60.0;
          float s = step(0.985, h(floor(p))) * smoothstep(0.32, 0.0, length(fract(p) - 0.5)) * (0.5 + 0.5 * sin(time * 2.0 + h(floor(p) + 3.0) * 6.28));   // small round stars
          c += s * tint() * 0.8;
          c += tint() * 0.05 * exp(-pow((uv.y - 0.6) * 3.0, 2.0));
        } else if (mode < 3.5) {                                         // city: windows that die as the lights go out
          vec2 p = vec2(uv.x * aspect + camX * 0.03, uv.y);
          float bx = floor(p.x * 9.0), height = 0.25 + 0.55 * h(vec2(bx, 1.0));
          float inB = step(uv.y, height) * step(0.15, fract(p.x * 9.0));
          vec2 w = vec2(fract(p.x * 9.0 * 4.0), fract(uv.y * 40.0)); float win = step(0.35, w.x) * step(0.4, w.y);
          float lit = step(1.0 - lights, h(vec2(floor(p.x * 36.0), floor(uv.y * 40.0))));
          c += inB * 0.035 * vec3(0.3, 0.4, 0.6);
          c += inB * win * lit * mix(vec3(1.0, 0.7, 0.3), vec3(0.3, 0.9, 1.0), h(vec2(bx, 5.0))) * (0.25 + 0.2 * kick);
          c += binaryL(uv, 0.06, 0.1, 9.0) * 0.06 * ink;
        } else {                                                          // terminal: scrolling clauses
          float row = floor(uv.y * 34.0 + time * 1.5), col = uv.x * aspect * 14.0;
          float len = 4.0 + 10.0 * h(vec2(row, 2.0)); float txt = step(fract(col / 15.0) * 15.0, len) * step(0.3, fract(col)) * step(0.25, fract(uv.y * 34.0 + time * 1.5));
          c += txt * tint() * 0.06 * (1.0 + kick);
        }
        if (mode > 8.5) c = base;
        float band = exp(-pow((uv.x - hit) * 7.0, 2.0)) * step(0.0, hit) * step(hit, 1.2);
        c += band * 0.18 * tint();
        c *= 0.85 + 0.3 * uv.y;
        gl_FragColor = vec4(c, 1.0);
      }` });
  const m = new T.Mesh(new T.PlaneGeometry(2, 2), mat); m.frustumCulled = false; m.renderOrder = -10; return m;
}

// ---------- letters: one atlas of characters, one small block per letter ----------
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'?!,.-’\"@%_#/:;<>~^—…&*+=()[]$|§♪✓";
function letterAtlas() {
  const n = CHARS.length, cols = 16, rows = Math.ceil(n / cols), S = 96;
  const c = document.createElement('canvas'); c.width = cols * S; c.height = rows * S; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.font = `400 ${S * 0.74}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  [...CHARS].forEach((ch, i) => x.fillText(ch, (i % cols + 0.5) * S, (Math.floor(i / cols) + 0.54) * S));
  const t = new T.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = T.NoColorSpace;
  return { tex: t, uv: ch => { const i = Math.max(0, CHARS.indexOf(ch)); return [(i % cols) / cols, 1 - (Math.floor(i / cols) + 1) / rows, 1 / cols, 1 / rows]; } };
}
function textTex(text, color, font = `400 64px ${MONO}`, h = 96) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = font; const w = Math.ceil(x.measureText(text).width) + 24;
  c.width = Math.max(2, w); c.height = h; x.font = font; x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(text, 12, h * 0.52);
  const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; return { tex: t, aspect: w / h };
}
const additive = (color, k = 0.5) => new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  uniforms: { color: { value: new T.Color(color) }, k: { value: k } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform vec3 color; uniform float k; varying vec2 vUv;
    void main(){ float edge = 1.0 - abs(vUv.x - 0.5) * 2.0; float a = pow(edge, 1.6) * (0.25 + 0.75 * vUv.y) * k; gl_FragColor = vec4(color * a, a); }` });

// Read the Terms (Chikin: "the platforms should all be books and manuscripts that fall into place"): stacked books and
// piles of manuscript pages, one texture each (a few rows per world unit), drawn once
// every level's platforms in its own world (round 13): one tileable texture per style
function platTexture(kind) {
  if (kind === 'books' || kind === 'pages') return bookTexture(kind);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  const R = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  if (kind === 'keys') { x.fillStyle = '#1a1416'; x.fillRect(0, 0, 256, 256); const L = 'QWERTYUIOPASDFGHJKLZXCVBNM';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const X = k * 64 + (r % 2) * 16 - 8, Y = r * 64; x.fillStyle = '#cfcac2'; x.beginPath(); x.roundRect(X + 4, Y + 4, 56, 56, 8); x.fill();
      x.fillStyle = '#ebe7df'; x.beginPath(); x.roundRect(X + 10, Y + 8, 44, 40, 6); x.fill(); x.fillStyle = '#2a2224'; x.font = '700 20px Inter, sans-serif'; x.fillText(L[(r * 4 + k) % L.length], X + 18, Y + 34); } }
  else if (kind === 'tower') { x.fillStyle = '#0b2030'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#5fe6f2'; x.globalAlpha = 1; x.lineWidth = 6; x.strokeRect(3, 0, 250, 256);
    x.lineWidth = 3; x.globalAlpha = 0.75; for (let y = 4; y < 256; y += 14) { x.beginPath(); x.moveTo(8, y); x.lineTo(248, y + 8); x.stroke(); } }
  else if (kind === 'road') { x.fillStyle = '#24222c'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#2e2b36'; for (let i = 0; i < 60; i++) x.fillRect(R(i, 1) * 256, R(i, 2) * 256, 3, 3); }
  else if (kind === 'files') { x.fillStyle = '#04120a'; x.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const X = k * 64 + 8, Y = r * 64 + 10; x.fillStyle = '#1e7a46'; x.fillRect(X, Y + 8, 48, 40); x.fillRect(X, Y + 2, 20, 8); x.strokeStyle = '#2bff88'; x.lineWidth = 2; x.strokeRect(X, Y + 8, 48, 40);
      x.fillStyle = '#9dffc6'; x.font = '12px ui-monospace, monospace'; x.fillText(R(r, k) < 0.5 ? '404' : '0101', X + 6, Y + 34); } }
  else if (kind === 'disco') { const C = ['#ff5cc8', '#5cf2ff', '#ffe45c', '#7dff6a', '#9a7dff'];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { x.fillStyle = C[(r * 3 + k * 2) % C.length]; x.globalAlpha = 0.55 + 0.4 * R(r, k); x.fillRect(k * 64 + 3, r * 64 + 3, 58, 58); } x.globalAlpha = 1; }
  else if (kind === 'glass') { x.fillStyle = '#0a0f1c'; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { x.strokeStyle = '#3a4a6a'; x.lineWidth = 3; x.beginPath(); x.roundRect(k * 128 + 8, r * 128 + 8, 112, 112, 16); x.stroke();
      x.fillStyle = 'rgba(127,176,255,.12)'; x.fillRect(k * 128 + 14, r * 128 + 14, 40, 100); } }
  else if (kind === 'rock') { x.fillStyle = '#2e2a28'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 40; i++) { x.fillStyle = R(i, 3) < 0.5 ? '#3a3532' : '#25211f'; x.beginPath(); x.ellipse(R(i, 4) * 256, R(i, 5) * 256, 10 + R(i, 6) * 26, 8 + R(i, 7) * 18, R(i, 8) * 3, 0, 7); x.fill(); }
    x.strokeStyle = '#ffcf4a'; x.lineWidth = 2.5; x.globalAlpha = 0.8; x.beginPath(); x.moveTo(0, 140); for (let X = 0; X <= 256; X += 32) x.lineTo(X, 140 + Math.sin(X * 0.05) * 30); x.stroke(); x.globalAlpha = 1; }
  else if (kind === 'memory') { x.fillStyle = '#03100a'; x.fillRect(0, 0, 256, 256);   // Thursday: memory blocks — rows of dark RAM chips, inked, little lit pins
    for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { const X = k * 128 + 10, Y = r * 128 + 22; x.fillStyle = '#0a2416'; x.fillRect(X - 6, Y - 14, 120, 112);
      x.fillStyle = '#0d0a08'; x.fillRect(X + 6, Y + 8, 96, 62); x.strokeStyle = '#120a05'; x.lineWidth = 5; x.strokeRect(X + 6, Y + 8, 96, 62);
      x.fillStyle = '#1d3a28'; x.fillRect(X + 10, Y + 12, 88, 10);
      for (let i = 0; i < 8; i++) { x.fillStyle = R(r * 8 + i, k) < 0.25 ? '#2bff88' : '#2c5a3e'; x.fillRect(X + 10 + i * 12, Y + 72, 6, 12); x.fillRect(X + 10 + i * 12, Y - 6, 6, 12); }
      x.fillStyle = '#2c5a3e'; x.font = '700 15px ui-monospace, monospace'; x.fillText(['THU', '404', 'tok', '0x1F'][r * 2 + k], X + 34, Y + 50); } }   // (his lore on the chips: Thursday, 404, tokens)
  else if (kind === 'pier') { for (let r = 0; r < 8; r++) { x.fillStyle = r % 2 ? '#3a2c20' : '#43331f'; x.fillRect(0, r * 32, 256, 30); x.fillStyle = '#1e160f'; x.fillRect(0, r * 32 + 30, 256, 2);
      x.fillStyle = '#6b5a44'; x.fillRect(20 + (r % 3) * 70, r * 32 + 13, 4, 4); } }
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; return t;
}
function bookTexture(kind) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  const R = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
  if (kind === 'books') { const COLS = ['#7a1f1f', '#1f3f7a', '#2f5e2a', '#6b4a1d', '#4a2a5e', '#8a6a12', '#2a2a2a'];
    let y = 0; for (let i = 0; y < 256; i++) { const h = 26 + R(i, 1) * 22, inset = R(i, 2) * 30; x.fillStyle = COLS[i % COLS.length];
      x.fillRect(inset, y + 1, 256 - inset - R(i, 3) * 26, h - 2); x.fillStyle = '#f2ead6'; x.fillRect(256 - R(i, 3) * 26 - 10, y + 4, 8, h - 8);   // page edges
      x.fillStyle = '#d9b44a'; x.fillRect(inset + 20, y + h / 2 - 2, 60 + R(i, 4) * 60, 3); x.strokeStyle = '#120a05'; x.lineWidth = 3; x.strokeRect(inset, y + 1, 256 - inset - R(i, 3) * 26, h - 2); y += h; } }
  else { let y = 0; for (let i = 0; y < 256; i++) { const h = 9 + R(i, 5) * 5, off = (R(i, 6) - 0.5) * 18; x.fillStyle = i % 5 === 0 ? '#e9e2cf' : '#f7f2e4';
      x.fillRect(10 + off, y, 236, h - 1); x.fillStyle = '#b9b2a0'; for (let k = 0; k < 6; k++) x.fillRect(24 + off + k * 36, y + h / 2 - 1, 24, 1.5); x.strokeStyle = '#8a8270'; x.lineWidth = 1; x.strokeRect(10 + off, y, 236, h - 1); y += h; }
    x.fillStyle = '#2a2a2a'; x.fillRect(110, 0, 36, 14); }   // a binder clip on top
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; return t;
}
export function createView(C, opts) {
  const { world, cam, viewW, viewH, spud, fx } = opts;
  const NP = !!opts.noPotato;   // (?blank&nopotato: the movie's empty runs — nothing of him is drawn, main.mjs keeps his place as data)
  const ARMS = armsDriver(spud), ARM_DANCES = ['groove', 'disco', 'raise-the-roof', 'pump', 'wiggle']; ARMS.reset(true); let armSpin = 0, armCs = null, armPO = null, armVy0 = 7, armG = true, armFly = null, armBeatSp = null;   // (his arms: armsfx.mjs)
  const AO = { t: 0, off: false, air: false, vy: 0, vy0: 7, fly: null, dance: null, beat: 0 }, AW = { t: 0, dance: null, beat: 0 };   // (one options object each, reused every frame)
  const P = C.P, TH = C.theme, WARM = new T.Color(TH.word || '#ffd9a0'), EDGE = new T.Color(TH.edge || '#2bff88');
  const viz = opts.viz;                                            // the visualizer's analysis: bass/treble every 0.1 s
  let groundTex0 = null;                                           // (theme.groundTex: made once per view)
  const at = t => { if (!viz) return { rms: 0, bass: 0, treble: 0 }; const i = Math.max(0, Math.min(viz.peaks.length - 1, Math.round(t / viz.step))); return viz.peaks[i]; };
  const bd = backdrop(TH); world.add(bd); const bg = bd.material.uniforms;
  // scraps of the world drifting in the dark (each theme has its own)
  const scraps = new T.Group(); world.add(scraps);
  const SCRAP = TH.scraps || ['404', 'page not found', 'http://dead.link/thursday', 'ERR_NAME_NOT_RESOLVED', 'GET /home 404', 'link rot', 'file not found'];
  for (let i = 0; i < 40; i++) {
    const { tex, aspect } = textTex(SCRAP[i % SCRAP.length], TH.scrapColor || TH.digit || '#2bff88');
    const s = 0.35 + (i % 3) * 0.18, m = new T.Mesh(new T.PlaneGeometry(s * aspect, s), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.05 + (i % 4) * 0.02, depthWrite: false }));
    m.position.set(i * 23 + (i * 7919 % 13), 1.5 + (i * 104729 % 50) / 10, -4 - (i % 3)); m.userData.base = m.position.x; m.userData.par = 0.3 + (i % 3) * 0.2; scraps.add(m);
  }
  const atlas = letterAtlas(), slabGeo = new T.BoxGeometry(1, 1, 0.9);
  const cueWords = [];
  function letterTiles(text, x, y, tw, th, o = {}) {        // x = left edge, y = top; vertical: stacked downwards
    const tiles = [];
    [...text].forEach((ch, i) => {
      const g = new T.Group();
      if (!o.ghost) { const slab = new T.Mesh(slabGeo, new T.MeshBasicMaterial({ color: o.slab || TH.wordSlab || '#1b130b' })); slab.scale.set(tw * 0.94, th, 1); slab.position.y = -th / 2; g.add(slab); }
      const [u, v, du, dv] = atlas.uv(ch), geo = new T.PlaneGeometry(Math.min(tw * 1.05, th * 1.15), th * 1.15);
      const uvs = geo.attributes.uv; for (let k = 0; k < 4; k++) uvs.setXY(k, u + uvs.getX(k) * du, v + uvs.getY(k) * dv);
      const face = new T.Mesh(geo, new T.MeshBasicMaterial({ map: atlas.tex, transparent: true, color: (o.color || WARM).clone(), depthWrite: false }));
      face.position.set(0, -th / 2, 0.47); g.add(face);
      if (o.vertical) g.position.set(x + tw / 2, y - i * th, 0.05); else g.position.set(x + (i + 0.5) * tw, y, 0.05);
      world.add(g); tiles.push({ g, face, base: g.position.clone() });
    });
    return tiles;
  }
  // ---- blocks ----
  const blocks = [], padChevrons = [];
  for (const rp of C.def.studioRamps || []) {   // the Level Studio's ramps (studio-edits.mjs): one wedge of this level's ground, drawn over its walkable slices
    const x0 = C.X(rp.t0), x1 = C.X(rp.t1), ya = rp.up ? rp.y : rp.y + rp.rise, yb = rp.up ? rp.y + rp.rise : rp.y, DEEP = 9, gc = new T.Color(TH.ground || TH.block || '#06140c').lerp(new T.Color(TH.edge || '#2bff88'), TH.ground ? 0 : 0.16);
    const sh = new T.Shape(); sh.moveTo(0, rp.y - DEEP); sh.lineTo(0, ya); sh.lineTo(x1 - x0, yb); sh.lineTo(x1 - x0, rp.y - DEEP); sh.closePath();
    const g = new T.Group(), body = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({ color: gc })); body.position.z = 0.45; g.add(body);
    { const PS = TH.platStyle, tt = TH.groundTex ? platTexture(TH.groundTex) : PS ? platTexture(PS === 'books' ? 'pages' : (TH.stepStyle || PS)) : tileTexture(T, TH.edge || '#2bff88'), k = (TH.groundTex || PS) ? 0.5 : 1;   // (pass 2: the wedge wears the level's own ground face, not a black slab — designer note #11)
      tt.repeat.set(k, k); const face = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({ map: tt, transparent: true, depthWrite: false })); face.position.z = 0.457; g.add(face); }
    const len = Math.hypot(x1 - x0, yb - ya), ang = Math.atan2(yb - ya, x1 - x0);
    const edge = new T.Mesh(new T.PlaneGeometry(len, 0.15), new T.MeshBasicMaterial({ color: EDGE })); edge.position.set((x1 - x0) / 2, (ya + yb) / 2 - 0.075, 0.47); edge.rotation.z = ang; g.add(edge);
    const ink = new T.Mesh(new T.PlaneGeometry(len, 0.05), new T.MeshBasicMaterial({ color: '#000000' })); ink.position.set((x1 - x0) / 2, (ya + yb) / 2 + 0.01, 0.471); ink.rotation.z = ang; g.add(ink);
    g.position.set(x0, 0, 0); world.add(g); }
  for (const q of C.solids) if ((q.kind === 'block' || q.kind === 'fake') && q.style !== 'ramp') {
    const g = new T.Group(), w = q.x1 - q.x0, h = q.y1 - q.y0;
    const col = q.girder ? '#3a2600' : q.style === 'speaker' ? '#140a1c' : (TH.block || '#06140c');
    const body = new T.Mesh(new T.BoxGeometry(w, h, 0.9), new T.MeshBasicMaterial({ color: col, transparent: true })); body.position.set(w / 2, -h / 2, 0); g.add(body);
    const edge = new T.Mesh(new T.PlaneGeometry(w, 0.07), new T.MeshBasicMaterial({ color: q.girder ? '#ffb020' : EDGE, transparent: true })); edge.position.set(w / 2, -0.035, 0.46); g.add(edge);
    const bits = (TH.blockText || '0110 1001 0011 0101 1100 1010 0111 0001 1011 0100 ').repeat(4);
    const { tex, aspect } = textTex(bits.slice(0, Math.max(4, Math.round(w * 2.4))), TH.blockTextColor || TH.edge || '#2bff88');
    let lab = new T.Mesh(new T.PlaneGeometry(Math.min(w * 0.92, 0.26 * aspect), 0.26), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false }));
    lab.position.set(w / 2, -h * 0.62, 0.47); g.add(lab);
    let alt = null; const extras = []; let B_chunks = null;
    // ground you can SEE (Chikin: "the platforms are not obvious"): a solid mass down to the bottom of the screen (up to the
    // top on the ceiling wall), a thick bright top edge with a glow, ink sides, so steps and pits read at a glance
    if (q.style !== 'bubble' && !q.cue && q.kind === 'block' && w >= 1.2) {
      const DEEP = 9, up = q.ceil ? 1 : -1, tot = h + DEEP, gc = new T.Color(TH.ground || TH.block || '#06140c').lerp(new T.Color(TH.edge || '#2bff88'), TH.ground ? 0 : 0.16);
      body.geometry.dispose(); body.geometry = new T.BoxGeometry(w, tot, 0.9); body.material.color.copy(gc);
      body.position.set(w / 2, q.ceil ? -h + tot / 2 : -tot / 2, 0);
      const band = new T.Mesh(new T.PlaneGeometry(w, 0.42), new T.MeshBasicMaterial({ color: gc.clone().lerp(new T.Color(TH.edge || '#2bff88'), 0.22), transparent: true }));
      band.position.set(w / 2, q.ceil ? -h + 0.21 : -0.21 - 0.07, 0.455); g.add(band); extras.push(band);
      edge.geometry.dispose(); edge.geometry = new T.PlaneGeometry(w, 0.15); edge.position.set(w / 2, q.ceil ? -h + 0.075 : -0.075, 0.47);
      const glowM = new T.Mesh(new T.PlaneGeometry(w, 0.5), additive(TH.edge || '#2bff88', 0.55)); glowM.material.uniforms.k.value = 0.55;
      glowM.rotation.z = q.ceil ? 0 : Math.PI; glowM.position.set(w / 2, q.ceil ? -h - 0.25 : 0.25, 0.44); g.add(glowM); extras.push(glowM);   // light spilling up off the edge
      for (const sx of [0.025, w - 0.025]) { const side = new T.Mesh(new T.PlaneGeometry(0.05, tot), new T.MeshBasicMaterial({ color: '#000000' })); side.position.set(sx, body.position.y, 0.465); g.add(side); extras.push(side); }
      const tt = TH.groundTex ? (groundTex0 || (groundTex0 = platTexture(TH.groundTex))).clone() : tileTexture(T, TH.edge || '#2bff88'); if (TH.groundTex) tt.needsUpdate = true; if (TH.groundTex) tt.repeat.set(w / 2, tot / 2); else tt.repeat.set(w, tot); const tiles = new T.Mesh(new T.PlaneGeometry(w, tot), new T.MeshBasicMaterial({ map: tt, transparent: true, depthWrite: false }));
      tiles.position.set(w / 2, body.position.y, 0.457); g.add(tiles); extras.push(tiles);   // (theme.groundTex: the ground's face is that world's stuff — Thursday's memory chips; one canvas for every block's face, cloned)
      if (TH.roadDash && !q.ceil && !q.step) { const dc = document.createElement('canvas'); dc.width = 64; dc.height = 8; const dx = dc.getContext('2d'); dx.fillStyle = TH.roadDash; dx.fillRect(0, 2, 34, 4);   // a road: the dashed lane line
        const dt = new T.CanvasTexture(dc); dt.wrapS = T.RepeatWrapping; dt.colorSpace = T.NoColorSpace; dt.repeat.set(w / 2.2, 1); const dash = new T.Mesh(new T.PlaneGeometry(w, 0.12), new T.MeshBasicMaterial({ map: dt, transparent: true, opacity: 0.7, depthWrite: false })); dash.position.set(w / 2, -1.05, 0.46); g.add(dash); tiles.visible = false; }
      lab.visible = false; lab = new T.Object3D(); g.add(lab);
      if (TH.platStyle) {   // the platform is made of this world's stuff (books, keys, files, rock…), in chunks (that drop into place where the theme says)
        body.visible = band.visible = tiles.visible = glowM.visible = false; for (const x of extras) x.visible = false; extras.length = 0; edge.visible = false;
        const n = Math.max(1, Math.round(w / 2.1)), cw = w / n; B_chunks = [];
        for (let i = 0; i < n; i++) { const PS = TH.platStyle, kind = PS === 'books' ? (q.step ? 'pages' : ((i + Math.round(q.x0)) % 3 === 2 ? 'pages' : 'books')) : (q.step && TH.stepStyle ? TH.stepStyle : PS), tx = platTexture(kind); tx.repeat.set(1, tot / 1.2);
          const ch = new T.Mesh(new T.PlaneGeometry(cw * 0.98, tot), new T.MeshBasicMaterial({ map: tx })); const cgp = new T.Group(); cgp.add(ch);
          const top = new T.Mesh(new T.PlaneGeometry(cw * 0.98, 0.07), new T.MeshBasicMaterial({ color: TH.platTop || '#ffe14d' })); top.position.y = tot / 2 - 0.035; top.position.z = 0.01; cgp.add(top);
          cgp.position.set(cw * (i + 0.5), body.position.y, 0.46); g.add(cgp); B_chunks.push({ grp: cgp, x: q.x0 + cw * (i + 0.5), base: body.position.y, seed: i + q.x0 }); }
      }
    }
    if (q.style === 'bubble') {                                  // a chat bubble: the message on it; his plain text turns into one of HIS when glitched
      const them = q.side !== 'potato', r = Math.min(0.28, h / 2, w / 4), sh = new T.Shape();
      sh.moveTo(-w / 2 + r, -h / 2); sh.lineTo(w / 2 - r, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); sh.lineTo(w / 2, h / 2 - r); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      sh.lineTo(-w / 2 + r, h / 2); sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); sh.lineTo(-w / 2, -h / 2 + r); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      const tail = new T.Shape(), tx = them ? -w / 2 + 0.35 : w / 2 - 0.35; tail.moveTo(tx - 0.15, -h / 2 + 0.01); tail.lineTo(tx + (them ? -0.32 : 0.32), -h / 2 - 0.28); tail.lineTo(tx + 0.15, -h / 2 + 0.01);
      body.geometry.dispose(); body.geometry = new T.ExtrudeGeometry([sh, tail], { depth: 0.6, bevelEnabled: false }); body.geometry.translate(0, 0, -0.3);
      edge.visible = false;
      body.material.color.set(them ? (TH.them || '#2b3140') : (TH.mine || '#3a2610')); edge.material.color.set(them ? '#9fb0c8' : '#ffd9a0');
      const mk = (txt, col) => { const tt = textTex(txt, col, `400 54px ${MONO}`); const m = new T.Mesh(new T.PlaneGeometry(Math.min(w * 0.94, 0.42 * tt.aspect), Math.min(w * 0.94, 0.42 * tt.aspect) / tt.aspect), new T.MeshBasicMaterial({ map: tt.tex, transparent: true, depthWrite: false })); m.position.set(w / 2, -h / 2, 0.48); g.add(m); return m; };
      g.remove(lab); lab = mk(q.text || q.label || '...', them ? '#e8eefc' : '#fff2dc'); if (q.alt) { alt = mk(q.alt, '#ffcf8a'); alt.visible = false; } }
    g.position.set(q.x0, q.y1, 0); world.add(g); blocks.push({ q, g, edge, body, lab, alt, extras, chunks: B_chunks });
    if (q.label && q.labelX != null && q.cue !== 'wall' && q.cue !== 'spike') {
      const n = [...q.label].length, tw = Math.min(0.62, Math.max(0.3, Math.min(w, 3.2) / n)), right = Math.min(q.x1, q.labelX + 0.35);
      const pad = q.cue === 'launch';
      cueWords.push({ tiles: letterTiles(q.label, right - n * tw, q.y1 + 0.001, tw, 0.62, pad ? { slab: '#3a2a05' } : {}), t0: q.labelAt, q, pad });
      if (pad) for (let k = 0; k < 3; k++) { const { tex, aspect } = textTex('^', '#ffcf4a', '900 90px Inter, sans-serif');
        const ch = new T.Mesh(new T.PlaneGeometry(0.4 * aspect, 0.4), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
        ch.position.set(right - n * tw / 2, q.y1 + 0.25 + k * 0.3, 0.6); world.add(ch); padChevrons.push({ m: ch, k }); }
    }
  }
  // ---- walls: firewalls (the glitch word stacked up them) and the thick unread wall ----
  const walls = [];
  for (const q of C.solids) if (q.kind === 'wall') {
    const g = new T.Group(), w = q.x1 - q.x0, h = q.y1 - q.y0;
    const body = new T.Mesh(new T.BoxGeometry(w, h, 1), new T.MeshBasicMaterial({ color: q.thick ? '#151a2a' : '#2a0708', transparent: true })); g.add(body);
    if (q.thick) for (let k = 0; k < 36; k++) { const { tex, aspect } = textTex(['unread', 'seen', '...', 'hello?', 'u there', 'typing'][k % 6], '#9fb0ff');
      const m = new T.Mesh(new T.PlaneGeometry(0.3 * aspect, 0.3), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.6, depthWrite: false }));
      m.position.set(-w / 2 + 0.2 + (k % 3) * w / 3 + 0.3 * aspect / 2, -h / 2 + 0.3 + Math.floor(k / 3) * 0.48, 0.52); g.add(m); }
    else for (let k = 0; k < 14; k++) { const bar = new T.Mesh(new T.PlaneGeometry(w * 0.86, 0.05), new T.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.45 })); bar.position.set(0, -h / 2 + 0.3 + k * 0.5, 0.51); g.add(bar); }
    g.position.set((q.x0 + q.x1) / 2, (q.y0 + q.y1) / 2, 0); world.add(g); walls.push({ q, g, body });
    if (!q.thick) { const word = (q.label || 'firewall').toUpperCase();
      cueWords.push({ tiles: letterTiles(word, q.x0 - 0.02, q.y0 + 0.6 + [...word].length * 0.6 + 0.1, 0.74, 0.6, { vertical: true, slab: '#3a0a0c', color: new T.Color('#ffd0c8') }), t0: q.t, q, wall: true }); }
  }
  // ---- hazards: red error teeth, and words standing in the way (hurdles) ----
  for (const hz of C.hazards) { if (hz.kind === 'word') continue;
    const w = hz.x1 - hz.x0;
    if (hz.kind === 'hurdle') {
      const word = hz.label || '404', n = [...word].length, tw = Math.min(0.5, (w + 0.6) / n), th = hz.y1 - hz.y0;
      const base = new T.Mesh(new T.PlaneGeometry(n * tw + 0.1, 0.06), new T.MeshBasicMaterial({ color: '#ff4d3a' })); base.position.set(hz.x0 + w / 2, hz.y0 + 0.03, 0.5); world.add(base);
      cueWords.push({ tiles: letterTiles(word, hz.x0 + w / 2 - n * tw / 2, hz.y1, tw, th, { slab: '#3a0a0c', color: new T.Color('#ffc2b8') }), t0: hz.t, hurdle: true, drop: hz.drop });
    } else {
      const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(w / 2, 0.62); s.lineTo(w, 0); s.lineTo(0, 0);
      const m = new T.Mesh(new T.ShapeGeometry(s), new T.MeshBasicMaterial({ color: '#ff4d3a' })); m.position.set(hz.x0, hz.y0, 0.3); world.add(m);
    }
  }
  // ---- held words: the word stretched over the gap, lit letter by letter as it's held ----
  const ghosts = C.ghosts.map(gh => { const n = [...gh.text].length, tw = (gh.x1 - gh.x0) / n;
    return { gh, tiles: letterTiles(gh.text, gh.x0, gh.y + 0.9, tw, 0.7, { ghost: true }) }; });
  // ---- spam, packets, beams, waves ----
  const tl = new T.TextureLoader(), sprite = src => { const t = tl.load(src); t.colorSpace = T.NoColorSpace; return t; };
  const base = opts.base || '../play/';
  const spamTex = C.spams.length ? sprite(base + 'sprites/spam-signature.webp') : null, spamBow = C.spams.length ? sprite(base + 'sprites/spam-rejected.webp') : null;
  const spams = C.spams.map(sp => ({ sp, ms: Array.from({ length: sp.n }, () => { const m = new T.Mesh(new T.PlaneGeometry(1.15, 1.15), new T.MeshBasicMaterial({ map: spamTex, transparent: true, depthWrite: false })); world.add(m); return m; }) }));
  const packets = C.packets.map(p => {
    const g = new T.Group(), col = POWER_COLOR[p.power] || '#ffcf4a';
    const cube = new T.Mesh(new T.BoxGeometry(0.62, 0.62, 0.62), new T.MeshBasicMaterial({ color: col })); g.add(cube);
    const { tex, aspect } = textTex(POWER_GLYPH[p.power] || '★', '#1a1206', '900 80px system-ui, sans-serif');
    const glyph = new T.Mesh(new T.PlaneGeometry(0.45 * aspect * 0.55, 0.45), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); glyph.position.z = 0.32; g.add(glyph);
    const glow = new T.Mesh(new T.CircleGeometry(0.95, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.2, depthWrite: false })); glow.position.z = -0.2; g.add(glow);
    g.position.set(p.x, p.y, 0.5); world.add(g); return { p, g };
  });
  const beams = C.beams.map(bm => { const m = new T.Mesh(new T.PlaneGeometry(0.5, 30), additive('#ff3b3b', 0.9)); m.material.uniforms.k.value = 1; m.renderOrder = 6; world.add(m); return { bm, m }; });
  const waves = C.waves.map(wv => { const g = new T.Group();
    const m = new T.Mesh(new T.PlaneGeometry(0.9, wv.h), new T.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.85 })); m.position.y = wv.h / 2; g.add(m);
    const { tex, aspect } = textTex('DELETE', '#ffe0dc'); const lab = new T.Mesh(new T.PlaneGeometry(0.4 * aspect, 0.4), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    lab.rotation.z = Math.PI / 2; lab.position.set(0, Math.min(wv.h / 2, 2.2), 0.05); g.add(lab); world.add(g); return { wv, g, m }; });

  // ---- the shooter (Confidently Incorrect): words + stickers flying at him, his laser, the gold wall ----
  const SHOOT = !!C.def.shooter, tgts = SHOOT ? C.targets.map(q => ({ q, built: false })) : [];
  const stickerTex = {}, sTex = n => stickerTex[n] || (stickerTex[n] = sprite((opts.base || '../play/') + `stickers-ci2/${n}.webp`));
  // asteroids (Chikin: "it needs to be asteroids … no stickers"): every target is a rock drawn in the house style — warm
  // grey rocks you can break, dark iron ones you can't (dodge them), the gold-veined wall the power breaks, a huge boss rock
  function rockTex(seed, kind) {
    const S = kind === 'boss' ? 512 : 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), R = S * 0.44, n = 15, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.283, r = R * (0.82 + 0.18 * rnd(seed, i + 1)); pts.push([S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r]); }
    const pal = { rock: ['#8a7a6a', '#5b4d42', '#b3a08a'], iron: ['#3a4456', '#1d2230', '#7fb0ff'], gold: ['#6a5a3a', '#3e3220', '#ffcf4a'], boss: ['#7b6a5b', '#4a3d34', '#c9b49a'] }[kind];
    x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath();
    const g = x.createRadialGradient(S * 0.38, S * 0.36, S * 0.05, S / 2, S / 2, R); g.addColorStop(0, pal[2]); g.addColorStop(0.45, pal[0]); g.addColorStop(1, pal[1]); x.fillStyle = g; x.fill();
    x.save(); x.clip(); const nc = kind === 'boss' ? 14 : 5;
    for (let k = 0; k < nc; k++) { const cx = S * (0.25 + 0.5 * rnd(seed, 20 + k)), cy = S * (0.25 + 0.5 * rnd(seed, 40 + k)), cr = S * (kind === 'boss' ? 0.03 + 0.07 * rnd(seed, 60 + k) : 0.05 + 0.08 * rnd(seed, 60 + k));
      x.beginPath(); x.ellipse(cx, cy, cr, cr * 0.8, 0.3, 0, 7); x.fillStyle = 'rgba(0,0,0,.28)'; x.fill(); x.beginPath(); x.ellipse(cx + cr * 0.15, cy + cr * 0.15, cr * 0.8, cr * 0.6, 0.3, 0, 7); x.fillStyle = 'rgba(255,255,255,.08)'; x.fill(); }
    if (kind === 'gold') { x.strokeStyle = '#ffcf4a'; x.lineWidth = S * 0.025; x.shadowColor = '#ffcf4a'; x.shadowBlur = 12; for (let k = 0; k < 4; k++) { x.beginPath(); let px = S * 0.2, py = S * (0.2 + 0.2 * k); x.moveTo(px, py); for (let m = 0; m < 5; m++) { px += S * 0.13; py += (rnd(seed, 80 + k * 7 + m) - 0.5) * S * 0.2; x.lineTo(px, py); } x.stroke(); } }
    if (kind === 'iron') { x.strokeStyle = 'rgba(127,176,255,.55)'; x.lineWidth = S * 0.02; x.beginPath(); x.arc(S / 2, S / 2, R * 0.8, -2.4, -1.2); x.stroke(); }
    x.restore(); x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.lineJoin = 'round'; x.lineWidth = S * 0.035; x.strokeStyle = '#0b0d12'; x.stroke();
    const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; return t; }
  function buildTarget(G) { const q = G.q, w = q.x1 - q.x0, g = new T.Group();
    if (q.wall) { const hgt = q.y1 - q.y0; for (let k = 0; k < Math.ceil(hgt / 1.1); k++) { const sz = 1.35; const m = new T.Mesh(new T.PlaneGeometry(sz, sz), new T.MeshBasicMaterial({ map: rockTex(q.t + k * 3.1, 'gold'), transparent: true, depthWrite: false }));
        m.position.set((rnd(q.t, k) - 0.5) * 0.3, -hgt / 2 + 0.55 + k * 1.05, 0); m.rotation.z = rnd(q.t, k + 9) * 6.28; g.add(m); if (!k) G.m = m; } }   // a wall of gold-veined rock: the power breaks it
    else if (q.sticker) {                                         // a lyric sticker, made a thing in space (Chikin: "dont let them just appear like stickers")
      const sz = rockSize(q), tex = sTex(q.sticker);
      const trail = new T.Mesh(new T.PlaneGeometry(sz * 1.7, sz * 0.42), additive('#ffd9a0', 0.5)); trail.material.uniforms.k.value = 0.6; trail.position.set(sz * 0.95, 0, -0.06); g.add(trail);   // comet tail: it's hurtling at him
      const rim = new T.Mesh(new T.CircleGeometry(sz * 0.62, 32), additive('#ffcf8a', 0.5)); rim.material.uniforms.k.value = 0.4; rim.position.set(-0.06 * sz, 0.06 * sz, -0.05); g.add(rim);   // warm rim from the Institute
      const body = new T.Group(); g.add(body);
      const shadow = new T.Mesh(new T.PlaneGeometry(sz, sz), new T.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })); shadow.position.set(0.09 * sz, -0.09 * sz, -0.02); body.add(shadow);
      const m = new T.Mesh(new T.PlaneGeometry(sz, sz), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); body.add(m); G.m = m;
      const shards = []; for (let i = 0; i < 4; i++) { const gq = new T.PlaneGeometry(sz / 2, sz / 2), uv = gq.attributes.uv, ox = (i % 2) * 0.5, oy = Math.floor(i / 2) * 0.5;   // four pieces of itself, for when it's shot
        for (let k = 0; k < uv.count; k++) uv.setXY(k, ox + uv.getX(k) * 0.5, oy + uv.getY(k) * 0.5);
        const sm = new T.Mesh(gq, new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); sm.visible = false; sm.userData.o = [(ox - 0.25) * sz, (oy - 0.25) * sz]; g.add(sm); shards.push(sm); }
      Object.assign(G, { trail, rim, body, shadow, shards }); }
    else { const sz = rockSize(q);   // (core.mjs rockSize: what's drawn is what hits)
      const hot = new T.Mesh(new T.PlaneGeometry(sz * 1.5, sz * 1.5), radial(q.solid ? '#7fb0ff' : '#ff6a2a', q.solid ? 0.45 : 0.55)); hot.position.z = -0.05; g.add(hot); G.hot = hot;   // a hot rim: what hurts stands out from the cardboard set (round 20)
      const m = new T.Mesh(new T.PlaneGeometry(sz, sz), new T.MeshBasicMaterial({ map: rockTex(q.t * 13.7, q.solid ? 'iron' : q.boss ? 'boss' : 'rock'), transparent: true, depthWrite: false })); g.add(m); G.m = m; }
    g.position.set((q.x0 + q.x1) / 2, q.wall || q.boss || q.lanes ? (q.y0 + q.y1) / 2 : q.y, 0.5); world.add(g); Object.assign(G, { g, built: true, lastHp: q.hp0, spin: (rnd(q.t, 3) - 0.5) * 1.6 }); }
  // THE ALIEN WARSHIP (Chikin: "potato against an alien spaceship spouting nonsense at him" … "no make it menacing like a crazy
  // alien race" … "the perspective needs to be further back" … "give the ship random movements"). A biomechanical manta of
  // a crazy alien race looms off the right of the screen, lurching and drifting; its fanged maw opens on every sung word and
  // spits the nonsense at him (every sticker and rock comes out of it); a crew of many-eyed, grinning aliens bobs in its
  // portholes; one huge eye tracks him. Bolts that get past the nonsense hit it. At the end it comes down and it's the boss.
  const SHIP = C.def.shooter && C.def.shooter.ship ? (() => {
    const INK = '#0b0d12', ACID = '#9dff3a', CW = 1280, CH = 720, W = 6.4, H = W * CH / CW;
    const mk = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; draw(x); const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; return t; };
    const PORTS = [[520, 330], [660, 300], [800, 300], [940, 320], [1080, 350]];
    // the five ships of the campaign (one crazy alien race per section — Chikin: "it needs to feel like you are progressing"):
    // the acid manta · the crimson crab · the abyss squid · the gold wasp · the bone mothership
    const PAL = [
      { hull: ['#3a4430', '#1c2218', '#0c0f0a'], spike: '#1b2016', rib: '#0a0d08', glow: 'rgba(157,255,58,.55)', port: '#2d3524', acid: '#9dff3a', jaw: '#20271b', tent: '#1f2719', fang: '#e9f0d8', eye: '#ff2a2a', throat: '#ff5a1f', crew: ['#7cff4a', '#4affc9', '#d6ff4a', '#ff8a3d', '#ff4a7a'] },
      { hull: ['#6a2018', '#33100c', '#160604'], spike: '#3e110d', rib: '#1c0705', glow: 'rgba(255,150,70,.6)', port: '#4d1913', acid: '#ff8a3d', jaw: '#3c130e', tent: '#3c130e', fang: '#fff1d6', eye: '#ffe14d', throat: '#ffb02e', crew: ['#ff8a3d', '#ffd23d', '#ff5a4a', '#ffb6a0', '#ffe14d'] },
      { hull: ['#22445e', '#0f2232', '#060e16'], spike: '#14293b', rib: '#08131d', glow: 'rgba(61,214,255,.6)', port: '#1d3446', acid: '#3dd6ff', jaw: '#112a3c', tent: '#14344c', fang: '#e6fbff', eye: '#ff3d8b', throat: '#3dd6ff', crew: ['#3dd6ff', '#7cffd6', '#ff6aa8', '#b8f0ff', '#4affc9'] },
      { hull: ['#6a5616', '#2e2508', '#110d02'], spike: '#1d1806', rib: '#0d0a02', glow: 'rgba(255,214,61,.65)', port: '#3c3110', acid: '#ffd23d', jaw: '#2d2508', tent: '#2d2508', fang: '#fffbe6', eye: '#57ff7a', throat: '#ffd23d', crew: ['#ffd23d', '#fff4c0', '#ff8a3d', '#d6ff4a', '#ffe14d'] },
      { hull: ['#e2dccd', '#928c7e', '#3e3c36'], spike: '#b0aa9c', rib: '#5e5a50', glow: 'rgba(255,42,42,.6)', port: '#6e6a60', acid: '#ff2a2a', jaw: '#928c7e', tent: '#928c7e', fang: '#ffffff', eye: '#ff2a2a', throat: '#ff2a2a', crew: ['#ff4a7a', '#7cff4a', '#4affc9', '#ffd23d', '#ff8a3d'] }];
    const skin = Q => ({ hull: hullT(Q), jaw: jawT(Q), tent: tentT(Q), crew: PORTS.map((_, k) => alienTex(k * 7 + 3 + Q.hull[0].length + PAL.indexOf(Q) * 31, Q)) });
    const hullT = Q => mk(CW, CH, x => {
      const hull = () => { x.beginPath(); x.moveTo(150, 300); x.bezierCurveTo(330, 170, 520, 120, 720, 110); x.bezierCurveTo(930, 100, 1120, 150, 1280, 140);
        x.lineTo(1280, 600); x.bezierCurveTo(1100, 610, 900, 640, 700, 600); x.bezierCurveTo(500, 560, 330, 520, 150, 430); x.closePath(); };
      // spikes along the crest and the keel
      x.fillStyle = Q.spike; for (let k = 0; k < 9; k++) { const px = 300 + k * 110, top = 150 - 30 * Math.sin(k * 0.9) + (k < 4 ? 40 - k * 10 : 0);
        x.beginPath(); x.moveTo(px - 34, top + 40); x.lineTo(px + 10, top - 70 - 25 * (k % 2)); x.lineTo(px + 40, top + 40); x.closePath(); x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
        x.beginPath(); x.moveTo(px - 30, 570 + k * 3); x.lineTo(px + 6, 670 + 20 * (k % 2)); x.lineTo(px + 34, 575 + k * 3); x.closePath(); x.fill(); x.stroke(); }
      const g = x.createLinearGradient(0, 110, 0, 620); g.addColorStop(0, Q.hull[0]); g.addColorStop(0.45, Q.hull[1]); g.addColorStop(1, Q.hull[2]);
      hull(); x.fillStyle = g; x.fill();
      x.save(); hull(); x.clip();
      for (let k = 0; k < 11; k++) { const px = 260 + k * 95; x.beginPath(); x.moveTo(px, 120); x.quadraticCurveTo(px - 60, 360, px + 10, 620); x.lineWidth = 14; x.strokeStyle = Q.rib; x.stroke();   // ribs
        x.lineWidth = 4; x.strokeStyle = Q.glow; x.beginPath(); x.moveTo(px + 22, 140); x.quadraticCurveTo(px - 36, 360, px + 30, 600); x.stroke(); }   // acid light between them
      x.restore();
      hull(); x.lineWidth = 12; x.strokeStyle = INK; x.stroke();
      // the portholes: holes, so the crew shows through
      for (const [px, py] of PORTS) { x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(px, py, 50, 0, 7); x.fill(); x.restore();
        x.beginPath(); x.arc(px, py, 54, 0, 7); x.lineWidth = 12; x.strokeStyle = Q.port; x.stroke(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(px, py, 47, 0, 7); x.lineWidth = 3; x.strokeStyle = Q.acid; x.stroke(); }
      // the upper jaw: fangs down over the maw
      x.fillStyle = Q.fang; for (let k = 0; k < 6; k++) { const px = 175 + k * 34; x.beginPath(); x.moveTo(px, 318 + k * 6); x.lineTo(px + 14, 372 + k * 4); x.lineTo(px + 28, 320 + k * 6); x.closePath(); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
      // the eye socket
      x.beginPath(); x.ellipse(330, 240, 78, 52, -0.2, 0, 7); x.fillStyle = '#060805'; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke(); });
    const jawT = Q => mk(520, 220, x => {     // the lower jaw (its hinge is the right end)
      x.beginPath(); x.moveTo(500, 40); x.bezierCurveTo(360, 30, 140, 40, 20, 70); x.lineTo(60, 120); x.bezierCurveTo(200, 170, 380, 180, 510, 150); x.closePath();
      x.fillStyle = Q.jaw; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
      x.fillStyle = Q.fang; for (let k = 0; k < 7; k++) { const px = 50 + k * 40; x.beginPath(); x.moveTo(px, 72 - k * 3); x.lineTo(px + 15, 20 - k * 2); x.lineTo(px + 30, 70 - k * 3); x.closePath(); x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); } });
    const alienTex = (seed, Q) => mk(200, 200, x => {   // the crew: many-eyed, grinning, antennae — a different one in every porthole
      const r = k => { const v = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }, hue = Q.crew[Math.floor(r(1) * Q.crew.length)];
      for (let k = 0; k < 2; k++) { const ax = 70 + k * 60; x.beginPath(); x.moveTo(ax, 70); x.quadraticCurveTo(ax + (k ? 30 : -30), 20, ax + (k ? 20 : -20), 10); x.lineWidth = 7; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(ax + (k ? 20 : -20), 10, 10, 0, 7); x.fillStyle = hue; x.fill(); x.lineWidth = 4; x.stroke(); }
      x.beginPath(); x.ellipse(100, 115, 70, 66, 0, 0, 7); x.fillStyle = hue; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
      const n = 3 + Math.floor(r(2) * 3); for (let k = 0; k < n; k++) { const ex = 50 + r(10 + k) * 100, ey = 80 + r(20 + k) * 40, er = 10 + r(30 + k) * 14;
        x.beginPath(); x.arc(ex, ey, er, 0, 7); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.arc(ex + er * 0.25, ey + er * 0.1, er * 0.45, 0, 7); x.fillStyle = INK; x.fill(); }
      x.beginPath(); x.moveTo(52, 140); x.quadraticCurveTo(100, 185, 150, 138); x.closePath(); x.fillStyle = '#2a0b0b'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
      x.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { const px = 58 + k * 15; x.beginPath(); x.moveTo(px, 142 + (k === 0 || k === 5 ? -2 : 3)); x.lineTo(px + 7, 156); x.lineTo(px + 13, 143 + (k === 5 ? -2 : 3)); x.fill(); } });
    const tentT = Q => mk(120, 420, x => { x.beginPath(); x.moveTo(30, 0); x.bezierCurveTo(10, 140, 100, 220, 50, 330); x.quadraticCurveTo(40, 380, 70, 410); x.quadraticCurveTo(90, 360, 80, 320); x.bezierCurveTo(120, 220, 60, 140, 90, 0); x.closePath();
      x.fillStyle = Q.tent; x.fill(); x.lineWidth = 8; x.strokeStyle = '#0b0d12'; x.stroke(); x.fillStyle = Q.glow; for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(52 + Math.sin(k) * 10, 60 + k * 50, 6, 0, 7); x.fill(); } });
    const SKINS = PAL.map(skin), hullTex = SKINS[0].hull, jawTex = SKINS[0].jaw, tentTex = SKINS[0].tent;
    const g = new T.Group(), U = (px, py) => [(px / CW - 0.5) * W, (0.5 - py / CH) * H];
    const throat = new T.Mesh(new T.PlaneGeometry(1.4, 0.9), additive('#ff5a1f', 0.8)); throat.position.set(...U(230, 380), -0.06); g.add(throat);
    const crew = PORTS.map(([px, py], k) => { const m = new T.Mesh(new T.PlaneGeometry(0.62, 0.62), new T.MeshBasicMaterial({ map: SKINS[0].crew[k], transparent: true, depthWrite: false })); m.position.set(...U(px, py + 6), -0.04); g.add(m); return { m, y0: m.position.y, x0: m.position.x, k }; });
    const tents = [700, 880, 1040].map((px, k) => { const m = new T.Mesh(new T.PlaneGeometry(0.62, 2.2), new T.MeshBasicMaterial({ map: tentTex, transparent: true, depthWrite: false })); m.geometry.translate(0, -1.1, 0); m.position.set(...U(px, 600), -0.05); g.add(m); return { m, k }; });
    const body = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: hullTex, transparent: true, depthWrite: false })); g.add(body);
    const jawPivot = new T.Group(); jawPivot.position.set(...U(470, 360), 0.02); g.add(jawPivot);
    const jaw = new T.Mesh(new T.PlaneGeometry(2.6, 1.1), new T.MeshBasicMaterial({ map: jawTex, transparent: true, depthWrite: false })); jaw.position.set(-1.3, -0.35, 0); jawPivot.add(jaw);
    const eye = new T.Mesh(new T.CircleGeometry(0.42, 32), additive('#ff2a2a', 1)); eye.position.set(...U(330, 240), 0.03); eye.scale.y = 0.62; g.add(eye);
    const pupil = new T.Mesh(new T.CircleGeometry(0.12, 24), new T.MeshBasicMaterial({ color: '#000' })); pupil.position.set(eye.position.x, eye.position.y, 0.04); g.add(pupil);
    const flash = new T.Mesh(new T.PlaneGeometry(1.2, 1.2), additive('#ffd9a0', 0.9)); flash.position.set(...U(150, 365), 0.05); g.add(flash);
    const smoke = Array.from({ length: 7 }, (_, k) => { const m = new T.Mesh(new T.CircleGeometry(0.4, 20), new T.MeshBasicMaterial({ color: '#2a2420', transparent: true, opacity: 0, depthWrite: false })); m.position.set(...U(360 + k * 115, 210 + (k % 3) * 110), 0.06); g.add(m); return { m, k, x0: m.position.x, y0: m.position.y }; });   // a worn ship smokes
    const embers = Array.from({ length: 6 }, (_, k) => { const m = new T.Mesh(new T.CircleGeometry(0.09, 10), new T.MeshBasicMaterial({ color: '#ffb02e', transparent: true, depthWrite: false })); m.position.set(...U(420 + k * 140, 260 + (k % 2) * 150), 0.07); g.add(m); return { m, k }; });
    g.position.set(0, 3, 0.2); g.renderOrder = 3; world.add(g);
    return { g, body, jawM: jaw, crew, smoke, embers, tents, jawPivot, eye, pupil, flash, throat, W, H, PAL, SKINS, v: 0, mawX: U(150, 365)[0], mawY: U(150, 365)[1], boss: null }; })() : null;
  const VMk = false, Kv = { g: new T.Group() };   // Kevin and his data cage (Confidently Incorrect)
  if (C.def.kevin) { Kv.m = new T.Mesh(new T.PlaneGeometry(1.25, 1.25), new T.MeshBasicMaterial({ map: sTex('kevin'), transparent: true, depthWrite: false })); Kv.g.add(Kv.m);
    Kv.cage = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.25, 1.25, 1.25)), new T.LineBasicMaterial({ color: '#5fe6f2', transparent: true, opacity: 0.95 })); Kv.g.add(Kv.cage);
    Kv.glow = new T.Mesh(new T.PlaneGeometry(1.7, 1.7), additive('#5fe6f2', 0.5)); Kv.glow.material.uniforms.k.value = 0.45; Kv.glow.position.z = -0.1; Kv.g.add(Kv.glow);   // the cage is light: it glows
    const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); Kv.tether = new T.Line(tg, new T.LineBasicMaterial({ color: '#5fe6f2', transparent: true, opacity: 0.8 })); world.add(Kv.tether);
    Kv.g.visible = false; world.add(Kv.g); }
  // his bolts: a white-hot head and a coloured tail you can follow (the colour says the gun's level)
  const radial = (color, k = 1) => new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { color: { value: new T.Color(color) }, k: { value: k } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color; uniform float k; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 1.6) * k; vec3 c = mix(color, vec3(1.0), pow(max(0.0, 1.0 - d * 1.8), 2.0)); gl_FragColor = vec4(c * a, a); }` });
  const boltMat = col => new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { color: { value: new T.Color(col) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color; varying vec2 vUv; void main(){ float dy = abs(vUv.y - 0.5) * 2.0, w = mix(0.25, 1.0, vUv.x); float a = smoothstep(w, w * 0.35, dy) * pow(vUv.x, 1.3);
      vec3 c = mix(color, vec3(1.0), smoothstep(0.55, 0.95, vUv.x) * smoothstep(w * 0.6, 0.0, dy)); gl_FragColor = vec4(c * a * 1.6, a); }` });
  // ROUND 20: his bolts look like his glitch (Chikin: "potatos bullets should look like his glitching"): purple glitch-sliced
  // shards, a green binary fleck in some, re-cut on every glitch step; a purple glow behind; the gun level makes them bigger
  const GUNCOL = ['#9a52ff', '#a65cff', '#b46aff', '#e03ccf'];
  const BOLTTEX = SHOOT ? glitchBoltTex(T, 4) : [];
  const bolts = []; for (let i = 0; i < 48; i++) { const m = new T.Mesh(new T.PlaneGeometry(0.95, 0.33), SHOOT ? new T.MeshBasicMaterial({ map: BOLTTEX[i % 4], transparent: true, depthWrite: false }) : boltMat(GUNCOL[0])); m.renderOrder = 12; m.visible = false; world.add(m);
    const gl = new T.Mesh(new T.PlaneGeometry(2.1, 0.62), radial('#9a52ff', 0.85)); gl.position.set(-0.55, 0, -0.02); gl.renderOrder = 11; m.add(gl); bolts.push(m); }   // (a purple smear trailing each bolt: the stream reads as a stream)
  const muzzle = new T.Mesh(new T.PlaneGeometry(0.7, 0.7), radial('#c9a7ff', 1)); muzzle.renderOrder = 13; muzzle.visible = false; world.add(muzzle);
  // his tiny ship (Chikin: "In costume, in a tiny spaceship. Just for the level"): rides his pivot in his own scene, so he sits in it
  const SPS = SHOOT && opts.pivot ? makeSpudShip(T, opts.pivot) : null;
  // cotton-wool exhaust puffs (it's a stage set), left behind in the world as he flies
  const puffs = SHOOT ? Array.from({ length: 22 }, (_, i) => { const g = new T.Group(); const f = new T.Mesh(new T.CircleGeometry(0.11, 16), new T.MeshBasicMaterial({ color: '#fbf6ea', transparent: true, depthWrite: false }));
    const r = new T.Mesh(new T.RingGeometry(0.11, 0.128, 20), new T.MeshBasicMaterial({ color: '#120a05', transparent: true, depthWrite: false })); g.add(f, r); g.visible = false; g.renderOrder = 3; world.add(g); return { g, f, r, t0: -99 }; }) : [];
  let puffAt = -99, puffI = 0;
  // the alien ships hang on wires from the batten too (they're part of the set — and still menacing)
  const wires = SHOOT ? [0, 1].map(() => { const gq = new T.BufferGeometry(); gq.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); const l = new T.Line(gq, new T.LineBasicMaterial({ color: '#cfc6b0', transparent: true, opacity: 0.75 })); l.frustumCulled = false; world.add(l); return l; }) : [];
  const booms = Array.from({ length: 12 }, (_, k) => { const m = new T.Mesh(new T.PlaneGeometry(2, 2), radial(['#ff5a1f', '#ffd23d', '#ffffff', '#ff2a6a'][k % 4], 1)); m.renderOrder = 14; m.visible = false; world.add(m); return m; });   // a ship going up
  const zap = Array.from({ length: 10 }, (_, k) => { const m = new T.Mesh(new T.PlaneGeometry(1, 0.22), new T.MeshBasicMaterial({ color: k % 2 ? '#e03ccf' : '#9a52ff', transparent: true, depthWrite: false })); m.renderOrder = 13; m.visible = false; world.add(m); return m; });   // his glitch, thrown at the ship: purple, jagged
  const big = new T.Group(); world.add(big); big.visible = false;   // the finale's big laser (Chikin: "potato winning with a big ass laser")
  const bigGlow = new T.Mesh(new T.PlaneGeometry(1, 1), boltMat('#9a52ff')); bigGlow.rotation.z = Math.PI; big.add(bigGlow);
  const bigCore = new T.Mesh(new T.PlaneGeometry(1, 1), boltMat('#bfe8ff')); bigCore.rotation.z = Math.PI; bigCore.position.z = 0.01; big.add(bigCore);
  const bigBall = new T.Mesh(new T.PlaneGeometry(1, 1), radial('#d9b8ff', 1)); bigBall.position.z = 0.02; big.add(bigBall);
  const motes = Array.from({ length: 14 }, (_, k) => { const m = new T.Mesh(new T.PlaneGeometry(0.16, 0.16), radial(k % 2 ? '#9a52ff' : '#bfe8ff', 1)); big.add(m); return m; });   // the charge gathering in
  const cmk = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = 'round'; draw(x); const tt = new T.CanvasTexture(c); tt.colorSpace = T.NoColorSpace; return tt; };
  const GU = SHOOT && C.def.shooter && C.def.shooter.gunups ? C.def.shooter.gunups.map(gu => { const g = new T.Group(), col = '#ffd23d';   // gun power-ups: a capsule with three chevrons
    const pill = new T.Mesh(new T.PlaneGeometry(0.95, 0.56), new T.MeshBasicMaterial({ map: cmk(190, 112, x => { x.fillStyle = '#1a1206'; x.beginPath(); x.roundRect(4, 4, 182, 104, 52); x.fill(); x.lineWidth = 7; x.strokeStyle = col; x.stroke();
      x.fillStyle = col; for (let i = 0; i < 3; i++) { const cx0 = 58 + i * 34; x.beginPath(); x.moveTo(cx0, 30); x.lineTo(cx0 + 22, 56); x.lineTo(cx0, 82); x.lineTo(cx0 - 10, 82); x.lineTo(cx0 + 12, 56); x.lineTo(cx0 - 10, 30); x.closePath(); x.fill(); } }), transparent: true, depthWrite: false })); g.add(pill);
    const glo = new T.Mesh(new T.PlaneGeometry(1.8, 1.8), radial(col, 0.5)); glo.position.z = -0.05; g.add(glo);
    g.position.set(C.X(gu.t), C.def.shooter.lanes[gu.lane], 0.5); world.add(g); return { gu, g, glo }; }) : [];
  const laser = new T.Mesh(new T.PlaneGeometry(1, 1), additive(TH.shotColor || '#8fd3ff', 1)); laser.material.uniforms.k.value = 1; laser.rotation.z = Math.PI / 2; laser.renderOrder = 12; laser.visible = false; world.add(laser);
  const jet = new T.Mesh(new T.PlaneGeometry(0.5, 1.2), additive('#ffb347', 1)); jet.material.uniforms.k.value = 0.9; jet.rotation.z = -Math.PI / 2; jet.renderOrder = 4; jet.visible = SHOOT; world.add(jet);
  // ---- practice checkpoints: a green diamond at every section start (shown only in practice) ----
  const flags = C.secs.slice(1).map(sc => { const m = new T.Mesh(new T.CircleGeometry(0.32, 4), new T.MeshBasicMaterial({ color: '#2bff88', transparent: true, opacity: 0.85 }));
    m.position.set(C.X(sc.t), 0, 0.7); m.visible = false; world.add(m); return { m, t: sc.t }; });
  // ---- jump orbs, jump pads, speed portals (Geometry Dash staples: you read them in a blink) ----
  const orbs = C.orbs.map(o => { const g = new T.Group();
    const ring = new T.Mesh(new T.RingGeometry(0.42, 0.56, 40), new T.MeshBasicMaterial({ color: '#ffe14d' })); g.add(ring);
    const core = new T.Mesh(new T.CircleGeometry(0.3, 32), new T.MeshBasicMaterial({ color: '#fff6b0', transparent: true, opacity: 0.85 })); g.add(core);
    const halo = new T.Mesh(new T.CircleGeometry(1.1, 32), additive('#ffe14d', 0.6)); halo.material.uniforms.k.value = 0.5; halo.position.z = -0.1; g.add(halo);
    g.position.set(o.x, o.y, 0.6); world.add(g); return { o, g, ring, halo }; });
  const pads = C.pads.map(pd => { const g = new T.Group(), w = pd.x1 - pd.x0;
    const dome = new T.Mesh(new T.CircleGeometry(w / 2, 24, 0, Math.PI), new T.MeshBasicMaterial({ color: '#ffe14d' })); dome.scale.y = 0.5; g.add(dome);
    const glowP = new T.Mesh(new T.PlaneGeometry(w * 1.2, 1.6), additive('#ffe14d', 0.7)); glowP.material.uniforms.k.value = 0.6; glowP.rotation.z = Math.PI; glowP.position.y = 0.8; g.add(glowP);
    g.position.set((pd.x0 + pd.x1) / 2, pd.y, 0.6); world.add(g); return { pd, g, glowP }; });
  const portals = []; if (false) C.secs.forEach((sc, i) => { if (!i) return; const prev = C.secs[i - 1]; if (!sc.v || !prev.v || Math.abs(sc.v - prev.v) / prev.v < 0.08) return;   // only real speed changes (not the cutscene's stop)
    const faster = sc.v > prev.v, g = new T.Group(), col = faster ? '#ff6a3d' : '#4da8ff';
    const ring = new T.Mesh(new T.RingGeometry(1.0, 1.18, 48), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 })); ring.scale.set(0.55, 1.5, 1); g.add(ring);
    const fill = new T.Mesh(new T.CircleGeometry(1.0, 48), additive(col, 0.5)); fill.material.uniforms.k.value = 0.35; fill.scale.set(0.55, 1.5, 1); g.add(fill);
    const { tex, aspect } = textTex(faster ? '>>' : '<', col, `900 70px Inter, sans-serif`); const ar = new T.Mesh(new T.PlaneGeometry(0.5 * aspect, 0.5), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); g.add(ar);
    g.position.set(C.X(sc.t), 0, 0.3); world.add(g); portals.push({ sc, g, ring }); });
  // ---- tokens (Still Here: food) / motes of light (No Answer) ----
  const tokens = C.tokens.map(k => { const g = new T.Group(), light = TH.tokenStyle === 'light', col = TH.token || '#ffcf4a';
    if (light) { const m = new T.Mesh(new T.CircleGeometry(k.big ? 0.5 : 0.28, 24), additive(col, 1)); m.material.uniforms.k.value = 1; g.add(m); g.add(new T.Mesh(new T.CircleGeometry(k.big ? 0.16 : 0.09, 16), new T.MeshBasicMaterial({ color: '#ffffff' }))); }
    else { g.add(new T.Mesh(new T.CylinderGeometry(k.big ? 0.42 : 0.26, k.big ? 0.42 : 0.26, 0.08, 24), new T.MeshBasicMaterial({ color: col }))); g.children[0].rotation.x = Math.PI / 2;
      const tt = textTex(TH.tokenGlyph || 'T', '#2a1a00', `900 80px Inter, sans-serif`); const f = new T.Mesh(new T.PlaneGeometry(0.3, 0.3), new T.MeshBasicMaterial({ map: tt.tex, transparent: true, depthWrite: false })); f.position.z = 0.05; f.scale.setScalar(k.big ? 1.6 : 1); g.add(f); }
    g.position.set(k.x, k.y, 0.5); world.add(g); return { k, g }; });
  // ---- the sung words stand in his way: low = jump it · high = duck under · wall = glitch through · armor = the power blast ----
  // each one materializes the way text does in his videos: binary noise, sliced and scrambled, settling into the word
  const WK = { low: { ink: TH.word || '#ffd9a0', slab: TH.wordSlab || '#1b130b', hint: '↑' }, high: { ink: '#9fe3ff', slab: '#061620', hint: '↓' },
    wall: { ink: '#ffd6cc', slab: '#2a0708', hint: 'space' }, armor: { ink: '#1a1206', slab: '#ffcf4a', hint: 'V' } };
  const SCR = '01#@%&*/<>~^$=+?!01010110';
  const PXU = 96, tmp = document.createElement('canvas'), tx = tmp.getContext('2d');
  const wordObs = C.hazards.filter(h => h.kind === 'word').map(h => ({ h, built: false }));
  function layoutWord(h) {             // the object's drawn size: the hitbox, a touch bigger; tall ones only as tall as you can see
    const tall = h.wk === 'wall' || h.wk === 'armor';
    return { visW: Math.max(h.x1 - h.x0, tall ? 0.95 : 1.0) + (tall ? 0 : 0.12), visH: tall ? Math.min(h.y1 - h.y0, 5.6) : h.wk === 'low' ? Math.max(0.8, h.y1 - h.y0) : h.y1 - h.y0 };   // a spike is drawn full size; it only kills in its core
  }
  const OBJ = TH.igOff ? { ...DEFAULT_OBJECTS, ...(TH.objects || {}) } : { ...IG_OBJECTS }, OC = { a: TH.objA || TH.edge || '#2bff88', b: TH.objB || TH.digit2 || '#ffbf73' };   // the Impossible Game set unless a level opts out
  function paintWord(W, m) {            // the object, materializing like his video text: binary noise, sliced, settling
    const { cv, ctx } = W, h = W.h, w = cv.width, hh = cv.height;
    tmp.width = w; tmp.height = hh; tx.clearRect(0, 0, w, hh);
    const RAIN = h.wk === 'wall' && !h.auto && (h.obj || OBJ.wall) === 'binrain', ANIM = !RAIN && PAINT[h.obj] && PAINT[h.obj].anim;   // an animated wall: painted fresh every frame (ANIM: a painter that asks to be, e.g. Thursday's tin of binary)
    if (RAIN) { W.art = W.art || document.createElement('canvas'); W.art.width = w; W.art.height = hh; PAINT.binrain(W.art.getContext('2d'), w, hh, OC, null, performance.now() / 1000); }
    else if (ANIM) { if (!W.art || W.art.width !== w || W.art.height !== hh) { W.art = W.art || document.createElement('canvas'); W.art.width = w; W.art.height = hh; } const ax = W.art.getContext('2d'); ax.clearRect(0, 0, w, hh); PAINT[h.obj](ax, w, hh, OC, null, performance.now() / 1000); }   // (cleared, not re-sized, every frame)
    else if (!W.art) { W.art = document.createElement('canvas'); W.art.width = w; W.art.height = hh; const ax = W.art.getContext('2d');
      if (h.auto) PAINT.bigwall(ax, w, hh, OC, h.text);
      else if (h.wk === 'armor') PAINT.armor(ax, w, hh, { ...OC, gold: POWER_COLOR[h.needs] || '#ffcf4a' }, POWER_GLYPH[h.needs]);
      else if (h.wk === 'wall' && h.ceil) PAINT[OBJ.wall](ax, w, hh, OC);
      else (PAINT[h.obj] || PAINT[OBJ[h.wk]] || PAINT.sock)(ax, w, hh, OC, OBJ.label); }
    tx.globalAlpha = 0.15 + 0.85 * m; tx.drawImage(W.art, 0, 0); tx.globalAlpha = 1;
    const seed = Math.floor(performance.now() / 70);
    if (m < 1) { tx.font = `400 ${Math.max(14, Math.min(w, hh) * 0.22)}px ${MONO}`; tx.fillStyle = OC.a; tx.globalAlpha = 1 - m;
      for (let i = 0; i < 14; i++) tx.fillText(rnd(i, seed) < 0.5 ? '0' : '1', rnd(i, seed + 1) * w, rnd(i, seed + 2) * hh); tx.globalAlpha = 1; }
    ctx.clearRect(0, 0, w, hh);
    const slices = 6, sh = Math.ceil(hh / slices);
    for (let i = 0; i < slices; i++) { const off = (rnd(i, seed) - 0.5) * (1 - m) * w * 0.5; ctx.drawImage(tmp, 0, i * sh, w, sh, off, i * sh, w, sh); }
    W.tex.needsUpdate = true;
  }
  function buildWord(W) {
    const h = W.h, L = layoutWord(h), armor = h.wk === 'armor';
    const cv = document.createElement('canvas'); cv.width = Math.min(512, Math.round(L.visW * PXU)); cv.height = Math.min(1024, Math.round(L.visH * PXU));
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace;
    const g = new T.Group(), cxw = (h.x0 + h.x1) / 2;
    const face = new T.Mesh(new T.PlaneGeometry(L.visW, L.visH), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    face.position.z = 0.46; if (h.ceil && h.wk !== 'wall') face.rotation.z = Math.PI; g.add(face);   // on the ceiling wall: upside down
    const back = new T.Mesh(new T.BoxGeometry(0.01, 0.01, 0.01), new T.MeshBasicMaterial({ transparent: true, opacity: 0 })); g.add(back);
    g.position.set(cxw, h.y0 + L.visH / 2, 0.1); world.add(g);
    const hint = new T.Object3D(); hint.material = { opacity: 0 };   // (no hint arrows any more: the shapes say what to do)
    const shards = armor || h.soft ? Array.from({ length: 12 }, (_, i) => { const m = new T.Mesh(new T.PlaneGeometry(0.22 + rnd(i, 1) * 0.3, 0.18 + rnd(i, 2) * 0.3), new T.MeshBasicMaterial({ color: h.soft ? (TH.objA || '#2bff88') : POWER_COLOR[h.needs] || '#ffcf4a', transparent: true, depthWrite: false }));
      m.visible = false; world.add(m); return m; }) : [];
    Object.assign(W, { built: true, L, cv, ctx: cv.getContext('2d'), tex, g, face, back, hint, shards, m: -1, cxw, art: null });
  }
  function dropWord(W) { world.remove(W.g); world.remove(W.hint); for (const m of W.shards) world.remove(m); W.tex.dispose(); W.face.geometry.dispose(); W.built = false; W.gone = true; }
  // the power blast: from his staff point to whatever's armored ahead
  let pvTilt = 0, flipA = 0, rollA = 0, lift = 0, csZoom = 1, danceSpinBeat = -1, lastJumpSpin = null, spinOff = 0; const caught = [];
  // where he died before, this session: red markers left in the course (the Impossible Game keeps your attempts in view)
  // Still Here: the knight's SWORD, a real one that swings (Chikin: "still here he actually needs a sword that swings"). No hands,
  // ever: it hovers at his side, ready, and on V it cuts through an arc in front of him and settles back
  const SWD = C.def.sword ? (() => { const g = new T.Group(), arm = new T.Group(); g.add(arm);
    const M = c => new T.MeshBasicMaterial({ color: c }), ink = M('#120a05');
    const add = (geo, mat, x, y, z = 0, rz = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; arm.add(m); return m; };
    // sticker style: flat bright colours over a thick ink outline (Vega's look), bigger than him so the swing reads
    const bladeShape = (w, L) => { const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, L); sh.lineTo(0, L + w * 1.1); sh.lineTo(-w / 2, L); sh.closePath(); return new T.ShapeGeometry(sh); };
    add(bladeShape(0.34, 1.46), ink, 0, 0.1, -0.02);                                  // the outline
    add(bladeShape(0.24, 1.42), M('#e8eef7'), 0, 0.14, 0);                            // steel
    add(new T.PlaneGeometry(0.05, 1.2), M('#9cc8ff'), 0.0, 0.8, 0.01);                // the blue fuller
    add(new T.PlaneGeometry(0.06, 1.3), M('#ffffff'), -0.07, 0.82, 0.01);             // the shine
    add(new T.PlaneGeometry(0.8, 0.2), ink, 0, 0.1, 0.02); add(new T.PlaneGeometry(0.72, 0.12), M('#f2c230'), 0, 0.1, 0.03);   // the crossguard
    add(new T.PlaneGeometry(0.17, 0.42), ink, 0, -0.14, 0.02); add(new T.PlaneGeometry(0.1, 0.36), M('#6b3d1e'), 0, -0.14, 0.03);  // the grip
    add(new T.CircleGeometry(0.12, 20), ink, 0, -0.38, 0.02); add(new T.CircleGeometry(0.08, 20), M('#f2c230'), 0, -0.38, 0.03);  // the pommel
    const glow = add(new T.PlaneGeometry(0.9, 2.2), additive('#9cc8ff', 0.35), 0, 0.8, -0.05); glow.material.uniforms.k.value = 0.2;
    g.renderOrder = 10; world.add(g); return { g, arm, glow }; })() : null;
  const deathMarks = []; const markGeo = new T.PlaneGeometry(0.5, 0.08);
  function markDeath(x, y) { const g = new T.Group(); for (const r of [0.785, -0.785]) { const m = new T.Mesh(markGeo, new T.MeshBasicMaterial({ color: '#ff3b3b', transparent: true, opacity: 0.75 })); m.rotation.z = r; g.add(m); }
    g.position.set(x, y + 0.6, 0.7); world.add(g); deathMarks.push(g); if (deathMarks.length > 60) world.remove(deathMarks.shift()); }
  const groundY = x => { let y = 0, best = 1e9; for (const q of C.solids) if (q.kind === 'block' && !q.ceil && q.x0 <= x && q.x1 >= x && Math.abs(q.y1) < best) { best = Math.abs(q.y1); y = q.y1; } return y; };

  // ---- the lyric line as art: big faint text in the dead space, letters jittering on the beat ----
  const lyric = new T.Group(); world.add(lyric); let lyricLine = -1, lyricTiles = [];
  function setLyric(line) {
    for (const t of lyricTiles) lyric.remove(t.m); lyricTiles = []; lyricLine = line; if (line < 0) return;
    const words = C.signs.filter(w => w.line === line); const text = words.map(w => w.text).join(' ').toLowerCase();
    [...text].forEach((ch, i) => { if (ch === ' ') return; const [u, v, du, dv] = atlas.uv(ch === "'" ? "'" : ch);
      const geo = new T.PlaneGeometry(0.62, 0.78); const uvs = geo.attributes.uv; for (let k = 0; k < 4; k++) uvs.setXY(k, u + uvs.getX(k) * du, v + uvs.getY(k) * dv);
      const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: atlas.tex, transparent: true, color: new T.Color(TH.lyric || TH.digit || '#2bff88'), opacity: 0.0, depthWrite: false }));
      lyric.add(m); lyricTiles.push({ m, i, n: text.length, w: words, t0: wordStart(words, text, i) }); });
  }
  function wordStart(words, text, i) { let k = 0, pos = 0; for (const w of words) { const len = w.text.length; if (i < pos + len) return w.t0; pos += len + 1; k++; } return words[words.length - 1].t0; }

  // ---- lights: soft additive beams from above sweeping on the beat; one finds the next cue ----
  const beamsUp = [];
  for (let i = 0; i < 4; i++) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute([-0.12, 0, 0, 0.12, 0, 0, 1.4, -12, 0, -1.4, -12, 0], 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute([0.45, 1, 0.55, 1, 1, 0, 0, 0], 2)); geo.setIndex([0, 2, 1, 0, 3, 2]);
    const m = new T.Mesh(geo, additive(i === 0 ? (TH.light || '#ffd9a0') : (TH.light2 || TH.digit || '#2bff88'))); m.renderOrder = 5; world.add(m); beamsUp.push(m);
  }
  const halo = new T.Mesh(new T.CircleGeometry(1.25, 40), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { k: { value: 0.4 }, color: { value: new T.Color(TH.halo || '#ffcf8a') } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float k; uniform vec3 color; varying vec2 vUv; void main(){ float d = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2) * k; gl_FragColor = vec4(color * a, a); }` }));
  halo.position.z = -0.5; world.add(halo);
  // ---- the dark (No Answer, the last lights): a veil with a hole where his light is ----
  const veil = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false,
    uniforms: { k: { value: 0 }, c: { value: new T.Vector2(0.3, 0.4) }, r: { value: 0.18 }, aspect: { value: 1.6 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform float k, r, aspect; uniform vec2 c; varying vec2 vUv;
      void main(){ vec2 d = (vUv - c) * vec2(aspect, 1.0); float a = smoothstep(r * 0.6, r * 1.4, length(d)) * k; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }` }));
  veil.frustumCulled = false; veil.renderOrder = 20; world.add(veil);
  // ---- glitch tears: purple slices + afterimages where he blinked from (only Potato glitches purple) ----
  const ghosts3 = Array.from({ length: 4 }, (_, i) => { const m = new T.Mesh(new T.CircleGeometry(0.62, 32), new T.MeshBasicMaterial({ color: i % 2 ? '#e03ccf' : '#9a52ff', transparent: true, opacity: 0, depthWrite: false })); m.scale.set(1, 1.18, 1); m.renderOrder = 7; world.add(m); return m; });   // his afterimages when he blinks
  const msgLedge = new T.Mesh(new T.PlaneGeometry(1, 0.32), new T.MeshBasicMaterial({ color: TH.edge || '#8fd3ff', transparent: true, opacity: 0, depthWrite: false })); world.add(msgLedge);
  const tears = Array.from({ length: 9 }, (_, i) => { const m = new T.Mesh(new T.PlaneGeometry(1, 0.12), new T.MeshBasicMaterial({ color: i === 4 ? '#4dff9a' : i % 3 === 0 ? '#e03ccf' : '#9a52ff',   /* one tear of binary green (Chikin) */ transparent: true, opacity: 0, depthWrite: false })); m.renderOrder = 8; world.add(m); return m; });

  const decors = (TH.decor || []).map(k => createDecor(k, world, C, TH));
  const story = createStory(world, C, cam, viz); if (story) scraps.visible = false;   // the song's music video, behind the course
  const overlay = createOverlay(world, cam, C);                                     // in front: the lyrics, the power going off
  // a level's own game (run/modes/*.mjs) draws itself: modeView({ T, world, C, cam, overlay, additive, textTex, sprite }) ->
  // { draw(f) } called every frame with f = { s, t, b, kick, span, cx, sim, info } (3D in `world`), and { over(ctx, f) } after the lyrics
  const MV = C.def.modeView ? C.def.modeView({ T, world, C, cam, overlay, additive, textTex, sprite, base: opts.base || '../play/' }) : null;
  // approach rings: each cue word gets a ring that closes onto it over its last two beats (C.def.rings)
  const rings = C.def.rings ? cueWords.filter(W => !W.hurdle || true).map(W => { const tile = W.tiles[Math.floor(W.tiles.length / 2)] || W.tiles[0];
    const m = new T.Mesh(new T.RingGeometry(0.92, 1.0, 48), new T.MeshBasicMaterial({ color: W.wall ? '#ff8a7a' : '#ffe2b0', transparent: true, opacity: 0, depthWrite: false })); m.renderOrder = 9; world.add(m);
    return { W, m, x: tile ? tile.base.x : 0, y: tile ? tile.base.y - 0.3 : 0 }; }) : [];
  let danceBeat = -1, lastSpin = -9, lastDouble = null;
  let camY = TH.camFix ?? 1.6, camBase = null, lastGround = true, kickEnv = 0, hitX = -1, lastBeat = -1, shake = 0, lastBlink = -1, darkStart = null;
  // (the shooter's overlay effects: built once, not every frame)
  const PROJ = (x, y) => overlay.project(x, y), TPOS = {}, PALS = SHIP ? SHIP.PAL.map(P => [...P.hull, P.spike]) : null;
  const FXO = { tPos: qi => { const G = tgts[qi]; if (!G || !G.built) return null; TPOS.x = G.g.position.x; TPOS.y = G.g.position.y; return TPOS; }, shipPos: () => SHIP && SHIP.on ? SHIP.pos : null, pal: v => PALS ? PALS[v] : null };
  const LEFT = 0.24, rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  const vertical = C.vertical;
  return {
    leave() { ARMS.reset(true); if (SPS) SPS.hide(); if (opts.pivot) { opts.pivot.scale.setScalar(1); opts.pivot.visible = true; } },
    draw(sim, t, dt, info = {}) {
      const s = sim.s, b = C.beatOf(t), vw = viewW(), vh = viewH ? viewH() : 5.6, au = at(t);
      // ---- camera ----
      // on its side: a level can be vertical throughout (C.vertical) or turn mid-song (def.verticalAt(t): 0 flat .. 1 up)
      const vt = C.def.verticalAt ? C.def.verticalAt(t) : (vertical ? 1 : 0), dir = C.def.verticalAt ? 1 : (vertical === 'up' ? 1 : -1);
      const span = vw + (vh / 0.62 - vw) * vt;                         // how much course is on screen
      const cx = s.x - (s.dx || 0) + span * (0.5 - LEFT);   // (the shooter: he flies about the screen; the camera keeps the song's pace)
      // the camera follows the ground he's on, not his jump (Chikin: "when potato jumps it takes the background up over the floor"):
      // in the air it holds; it moves when he lands higher/lower, or when he falls well below where he last stood
      const AIRM = TH.camAirMax ?? 3.2;   // (theme.camAirMax: how far above his floor he can fly before the camera follows — Thursday's pads)
      if (camBase == null || s.ground || s.y < camBase - 1.2 || s.y > camBase + AIRM) camBase = s.ground || camBase == null ? s.y : s.y < camBase - 1.2 ? s.y + 1.2 : s.y - AIRM;
      const want = TH.camFix != null ? TH.camFix : Math.max(1.3, Math.min(TH.camMax || 5.5, camBase + 0.55)); camY += (want - camY) * Math.min(1, dt * 4);
      const bi = Math.floor(b); if (bi !== lastBeat) { lastBeat = bi; kickEnv = 1; if (bi % 8 === 0 && (info.loud ?? au.rms) > 0.6) hitX = 0; }
      kickEnv *= Math.exp(-dt * 7); if (hitX >= 0) { hitX += dt * 1.4; if (hitX > 1.3) hitX = -1; }
      shake *= Math.exp(-dt * 18); if (TH.modeCam && s.camShake) shake = Math.max(shake, s.camShake);
      if (SHOOT) shake = Math.max(shake, fxShake(s, t));   // hits, kills, a ship cracking, a ship going up: the screen feels it   // (theme.modeCam: a mode level shakes the camera itself — Last Lights' smashes)
      const sx = (rnd(t, 1) - 0.5) * shake, sy = (rnd(t, 2) - 0.5) * shake;
      const TE = this.powerOn && this.powerOn.t0 != null ? t - this.powerOn.t0 : 99, punch = TH.noPunch ? 1 : (TE >= 0 && TE < 0.9 ? 1 + 0.32 * Math.sin(Math.min(1, TE / 0.9) * Math.PI) : 1) * (this.breakEv && t - this.breakEv.t >= 0 && t - this.breakEv.t < 0.7 ? 1 + (0.1 + 0.35 * this.breakEv.tier) * (this.breakEv.hit ? 1 : 0.4) * Math.sin(Math.min(1, (t - this.breakEv.t) / 0.7) * Math.PI) : 1);   // the costume change is an event: the camera punches in
      if (vt > 0) { const a = vt * Math.PI / 2; cam.up.set(dir * Math.sin(a), Math.cos(a), 0); cam.zoom = (1 - 0.38 * vt) * (1 + 0.012 * kickEnv);
        const cyy = camY + 0.35 + 1.45 * vt; cam.position.set(cx + sx, cyy + sy, 10); cam.lookAt(cx + sx, cyy - 0.35 * (1 - vt) + sy, 0); }
      else { cam.up.set(0, 1, 0); let shootPunch = 1; if (SHOOT) { const ch = lastFx(s, t, 'chunk', 0.3) || lastFx(s, t, 'bossdown', 0.5) || lastFx(s, t, 'hurt', 0.3), M = C.music; shootPunch = 1 + (ch ? (ch.k === 'chunk' ? 0.035 : ch.k === 'hurt' ? 0.03 : 0.07) * Math.exp(-(t - ch.t) / 0.09) : 0) + (M ? 0.02 * M.dropHit(t, 0.4, 0.5) : 0); }
        cam.zoom = (1 + 0.018 * kickEnv) * csZoom * punch * shootPunch * (TH.modeCam && s.camZoom ? s.camZoom : 1) * (C.def.zoomAt ? C.def.zoomAt(t) : 1) /* def.zoomAt: a level's own pull-back (Thursday's last bars) */; cam.position.set(cx + sx, camY + 0.35 + sy, 10); cam.lookAt(cx + sx, camY + sy, 0); }
      if (globalThis.STUDIO_ZOOM && globalThis.STUDIO_ZOOM !== 1) cam.zoom *= globalThis.STUDIO_ZOOM;   // (the Level Studio's zoom-out while he builds; never set in the game)
      cam.updateProjectionMatrix();
      if (SWD) { const sw = s.swingAt != null ? t - s.swingAt : 9, up = 0.15, cut = 0.18, back = 0.3;   // the sword: rest → raise → cut → settle
        let a = -0.45 + 0.08 * Math.sin(t * 2.2); if (sw >= 0 && sw < up + cut + back) { const ez = k => k * k * (3 - 2 * k);   // (z rotation: + leans back over his shoulder, − cuts forward and down)
          a = sw < up ? -0.45 + (1.15 + 0.45) * ez(sw / up) : sw < up + cut ? 1.15 - (1.15 + 2.1) * ez((sw - up) / cut) : -2.1 + (2.1 - 0.45) * ez((sw - up - cut) / back); }
        SWD.g.position.set(s.x + 0.55, s.y + 0.5 + 0.05 * Math.sin(t * 2.2), 0.6); SWD.arm.rotation.z = a; SWD.g.visible = !(opts.pivot && !opts.pivot.visible);
        SWD.glow.material.uniforms.k.value = sw >= up && sw < up + cut ? 0.9 : 0.22; }
      bg.time.value = t; bg.camX.value = cx; bg.camY.value = camY; bg.beat.value = b; bg.kick.value = kickEnv + 0.6 * (au.bass || 0); bg.bass.value = au.bass || 0;
      bg.aspect.value = vw / 7; bg.hit.value = hitX; bg.warm.value = info.warm || 0; bg.lights.value = info.lights ?? 1; bg.rot.value = vt > 0.5 ? 1 : 0;
      for (const m of scraps.children) m.position.x = m.userData.base + cx * m.userData.par;
      while (caught.length && caught[caught.length - 1].t > t) caught.pop();
      if (story) story.update({ t, s, caught, music: C.music, kick: kickEnv, bass: au.bass || 0, treble: au.treble || 0, rms: au.rms || 0, lights: info.lights ?? 1, calm: info.calm });
      // ---- course ----
      const near = q => q.x1 > cx - span && q.x0 < cx + span;
      const reveal = sim.answered({ needs: 'detective', t, tEnd: t }, t) || sim.answered({ needs: 'diver', t, tEnd: t }, t);
      const glitchSeen = TH.glitchReveals && s.glitchAt != null && t - s.glitchAt < 2 * P;   // a glitch shows the fakes for a moment
      for (const B of blocks) { const q = B.q; B.g.visible = near(q) && q.style !== 'painted'; if (!B.g.visible) continue;   // (style 'painted': the story layer paints this floor itself — between-messages-street)
        if (B.chunks) for (const c of B.chunks) {   // they fall into place a little ahead of him: dropped in, a small bounce, settled
          const d = c.x - s.x, k = TH.platDrop === false ? 1 : Math.max(0, Math.min(1, (span * (1 - LEFT) + 5 - d) / 4.5)), bounce = k < 1 ? (1 - k) * (1 - k) * 9 - Math.sin(k * Math.PI * 3) * 0.25 * (1 - k) : 0;
          c.grp.position.y = c.base + Math.max(-0.2, bounce); c.grp.rotation.z = k < 1 ? (Math.sin(c.seed * 3.1) * 0.25) * (1 - k) : 0; c.grp.visible = d < 18; }
        let dy = 0; if (q.pump) { const ph = ((b / (q.pumpBeats || 1)) % 1 + 1) % 1; dy = q.pump * (0.5 + 0.5 * Math.cos(2 * Math.PI * ph)); }
        B.g.position.y = q.y1 + dy;
        const gated = q.needs && !sim.answered(q, t);
        const lit = !q.hidden || reveal || Math.abs(q.x0 - s.x) < 2.6 || (au.bass > 0.55 || au.treble > 0.6);
        B.body.material.opacity = gated ? 0.12 : (q.kind === 'fake' && (reveal || glitchSeen) ? 0.35 : (lit ? 1 : 0.0));
        B.edge.material.opacity = gated ? 0.25 + 0.25 * kickEnv : lit ? 0.55 + 0.45 * kickEnv : 0.0;
        B.lab.visible = lit && !gated;
        if (q.grow) {                                              // Ghost: his reply, rewritten — the bubble stretches with the words across the gap
          const awakeAt = q.awake >= 0 && t >= q.awake ? q.awake : (q.wakeBy && sim.answered({ needs: q.wakeBy, gateT: q.gateT, gateEnd: q.gateEnd }, t) ? (q.grewAt ??= t) : null);
          if (awakeAt == null) { q.grewAt = undefined; B.g.visible = true; B.g.scale.x = 1; B.body.material.opacity = 0.07 + 0.05 * kickEnv; B.lab.visible = false; if (B.alt) B.alt.visible = false; } else { B.body.material.opacity = 1; const k = Math.min(1, (t - awakeAt) / 0.3), stub = 0.45 * C.P * C.speedAt(q.t) / (q.x1 - q.x0);
            B.g.visible = true; B.g.scale.x = stub + (1 - stub) * (1 - (1 - k) ** 3); if (B.alt) { B.alt.visible = true; B.alt.material.opacity = k; } B.lab.visible = false; } }
        if (q.twin) { const G2 = blocks.find(o => o.q.pair === q.twin); const on = G2 && ((G2.q.awake >= 0 && t >= G2.q.awake) || G2.q.grewAt != null); B.g.visible = !on;   // the plain stub goes when its rewrite arrives
          if (!on) B.edge.material.opacity = 0.5 + 0.5 * kickEnv; }                // (and pulses: this one is yours to change)
        if (s.denyQ === q && t - s.denyAt < 0.35 && t >= s.denyAt) B.g.position.x = q.x0 + Math.sin((t - s.denyAt) * 60) * 0.12 * (1 - (t - s.denyAt) / 0.35);   // not his to edit: it shakes him off
        else B.g.position.x = q.x0;
        if (q.dormant && !q.grow) { const awake = q.awake >= 0 && t >= q.awake || (q.wakeBy && sim.answered({ needs: q.wakeBy, gateT: q.gateT, gateEnd: q.gateEnd }, t)); B.body.material.opacity = awake ? 1 : 0.22; B.edge.material.opacity = awake ? 0.9 : 0.35 + 0.3 * kickEnv;
          B.lab.visible = !awake || !B.alt; if (B.alt) { B.alt.visible = !!awake; if (awake) B.alt.position.x = (q.x1 - q.x0) / 2 + (rnd(t, q.t) - 0.5) * 0.08 * Math.max(0, 1 - (t - (q.awake >= 0 ? q.awake : t)) * 2); } }
        const off = q.blink && q.blink[((Math.floor(b) % q.blink.length) + q.blink.length) % q.blink.length] === '0';   // typing dots between beats
        const seen = q.crumble && q.landed >= 0 ? Math.max(0, t - (q.landed + q.crumble * P)) : 0;                         // read: it falls away
        if (off) { B.body.material.opacity *= 0.15; B.edge.material.opacity *= 0.3; }
        for (const x of B.extras) x.visible = !off;   // a blinking block is GONE between its beats: tiles, glow and all
        if (seen > 0) { B.g.position.y -= seen * seen * 14; B.body.material.opacity *= Math.max(0, 1 - seen * 2); }
        if (q.kind === 'fake') B.edge.material.color.set(reveal || glitchSeen ? '#ff4d3a' : EDGE); }
      for (const W of walls) { W.g.visible = near(W.q); W.body.material.opacity = W.q.thick && sim.answered(W.q, t) ? 0.25 : (s.phase > 0 && Math.abs(W.q.x0 - s.x) < 2 ? 0.45 : 1); }
      for (const Wd of cueWords) { const k = t >= Wd.t0 ? 1 : Math.max(0.25, 1 - (Wd.t0 - t) / 1.2) * 0.55;
        const flashK = t >= Wd.t0 && t - Wd.t0 < 0.2 ? 0.4 : 0;
        for (const tile of Wd.tiles) { tile.face.material.color.copy(Wd.wall || Wd.hurdle ? new T.Color('#ffd0c8') : Wd.pad ? new T.Color('#ffe066') : WARM).multiplyScalar(k + flashK);
          // a word he passes through or over crumbles: a little jitter once it's behind him
          const behind = s.x - tile.base.x, pump = Wd.q && Wd.q.pump ? Wd.q.pump * (0.5 + 0.5 * Math.cos(2 * Math.PI * (((b / (Wd.q.pumpBeats || 1)) % 1 + 1) % 1))) : 0;
          const fall = Wd.drop ? Math.max(0, (Wd.t0 - 0.35 - t) * 9) : 0;          // fine print drops in from above, landing just before it matters
          tile.g.position.y = tile.base.y + pump + fall - (behind > 0.6 && Wd.q && Wd.q.landed >= 0 ? Math.min(10, (behind - 0.6) ** 2 * 0.25) : 0); } }
      for (const ch of padChevrons) ch.m.material.opacity = 0.25 + 0.75 * (1 - ((t * 3 + ch.k / 3) % 1));
      for (const G of ghosts) { const { gh } = G, n = G.tiles.length;
        G.tiles.forEach((tile, i) => { const lit = t >= gh.t0 + (gh.t1 - gh.t0) * i / n; tile.face.material.color.copy(WARM).multiplyScalar(lit ? 1 : 0.22); tile.g.position.y = gh.y + 0.9 + (lit ? 0.06 * Math.sin(t * 8 + i) : 0); }); }
      for (const S of spams) { const frozen = sim.frozenAt(S.sp, t), bx = spamBoxes(S.sp, frozen);
        S.ms.forEach((m, i) => { const q = bx[i]; m.position.set((q.x0 + q.x1) / 2, frozen ? q.y1 - 0.45 : (q.y0 + q.y1) / 2 + 0.06 * Math.sin(t * 9 + i), 0.4);
          m.material.map = frozen ? spamBow : spamTex; m.scale.x = (frozen ? 1 : (Math.floor(b * 2 + i) % 2 ? 1 : -1)); }); }
      for (const F of flags) { F.m.visible = !!this.practice && Math.abs(F.m.position.x - cx) < span; if (F.m.visible) { F.m.position.y = groundY(F.m.position.x) + 2.2 + 0.1 * Math.sin(t * 3); F.m.rotation.z = Math.PI / 4 * 0 + t; } }
      for (const O of orbs) { O.g.visible = Math.abs(O.o.x - cx) < span; if (!O.g.visible) continue; const sc = 1 + 0.12 * kickEnv + (s.orbAt != null && t - s.orbAt < 0.2 && Math.abs(O.o.x - s.x) < 1 ? 0.5 : 0); O.g.scale.setScalar(sc); O.ring.rotation.z = t * 2; }
      for (const Pd of pads) { Pd.g.visible = Math.abs(Pd.pd.x0 - cx) < span; Pd.glowP.material.uniforms.k.value = 0.4 + 0.4 * kickEnv + (s.padAt != null && t - s.padAt < 0.25 && Math.abs(Pd.pd.x0 - s.x) < 1.5 ? 0.8 : 0); }
      for (const Pt of portals) { Pt.g.visible = Math.abs(Pt.g.position.x - cx) < span; if (Pt.g.visible) { Pt.g.position.y = groundY(Pt.g.position.x) + 1.6; Pt.ring.rotation.z = Math.sin(t * 3) * 0.05; } }
      for (const K of tokens) { K.g.visible = !K.k.got && Math.abs(K.k.x - cx) < span; if (K.g.visible) { K.g.rotation.y = TH.tokenStyle === 'light' ? 0 : t * 3; K.g.position.y = K.k.y + 0.08 * Math.sin(t * 5 + K.k.x); K.g.scale.setScalar(1 + 0.15 * kickEnv); } }
      for (const K of packets) { K.g.visible = !K.p.got; K.g.rotation.y = t * 2; K.g.position.y = (K.p.hy ?? K.p.y) + 0.12 * Math.sin(t * 4); }   // (the shooter's download homes in on him: p.hy)
      for (const Bm of beams) { const on = t >= Bm.bm.t0 - 0.3 && t <= Bm.bm.t1; Bm.m.visible = on; if (!on) continue;
        Bm.m.position.set(beamX(C, Bm.bm, Math.max(t, Bm.bm.t0)), camY, 1.2); Bm.m.material.uniforms.color.value.set(sim.answered(Bm.bm, t) ? '#555b66' : '#ff3b3b');
        Bm.m.material.uniforms.k.value = t < Bm.bm.t0 ? 0.25 : 1; }
      for (const Wv of waves) { const x = waveX(C, Wv.wv, t); Wv.g.visible = x > cx - span && x < cx + span; Wv.g.position.set(x, 0, 0.8);
        Wv.m.material.color.set(sim.answered(Wv.wv, t) ? '#c9d3e0' : '#ff3b3b'); }

      // ---- the shooter ----
      if (SHOOT) {
        for (const G of tgts) { const q = G.q; const vis = !q.layer && t >= q.show && (q.hp > 0 || (q.killedAt != null && t - q.killedAt < 0.4)) && q.x1 > cx - span * 0.6 && q.x0 < cx + span;
          if (!vis) { if (G.built) G.g.visible = false; continue; } if (!G.built) buildTarget(G); G.g.visible = true;
          const age = t - q.show, inK = Math.min(1, age / 0.25), flick = age < 0.25 && rnd(q.t, Math.floor(t * 30)) < 0.4;   // glitch in when sung
          const ha = q.hitAt != null && t >= q.hitAt ? t - q.hitAt : 9, kb = SHOOT ? 0.2 * Math.exp(-ha / 0.06) : 0;   // knockback: every hit shoves it back a little
          let sc = inK * (1 + 0.06 * kickEnv) * (ha < 0.08 ? 0.86 + 0.14 * ha / 0.08 : 1); G.g.position.x = (q.x0 + q.x1) / 2 + kb + (age < 0.25 ? (rnd(q.t, Math.floor(t * 24)) - 0.5) * 0.4 : 0);
          if (q.hp < G.lastHp) { G.hitAt = t; G.lastHp = q.hp; } if (q.hp > G.lastHp) G.lastHp = q.hp;
          const hit = ha < 0.1; G.m.material.color && (ha < 0.035 ? G.m.material.color.setScalar(2.4) : hit ? G.m.material.color.setRGB(1.7, 0.4, 0.4) : G.m.material.color.setScalar(1));   // hit: a white pop, then red (Chikin: "flash red")
          if (G.hot) G.hot.material.uniforms.k.value = (q.solid ? 0.45 : 0.5 + 0.15 * kickEnv) * (q.killedAt != null && q.hp <= 0 ? 0 : 1) + (hit ? 0.5 : 0);
          if (q.killedAt != null && q.hp <= 0) { const k = SHOOT && !q.sticker && !q.wall ? Math.min(1, (t - q.killedAt) / 0.09) : (t - q.killedAt) / 0.4; sc *= 1 + k * 0.5; G.g.rotation.z = k * (rnd(q.t, 2) - 0.5) * 3; G.g.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = 1 - k; } }); if (k < 0.5 && G.m.material.color) G.m.material.color.setScalar(2.4); }   // (a kill: it pops white and the boom takes over)
          else { G.g.rotation.z = q.wall ? 0 : (t - q.show) * G.spin; G.g.traverse(o => { if (o.material && o.material.opacity !== undefined && o !== G.m) o.material.opacity = Math.min(o.material.opacity, 0.8); }); if (G.m.material) G.m.material.opacity = flick ? 0.3 : 1; }
          G.g.scale.setScalar(sc); }
        for (const G of tgts) { if (!G.built || !G.q.sticker || !G.g.visible) continue; const q = G.q, age = t - q.show, sd = q.t * 7.3;   // the stickers' life: in from deep space, tumbling, lit, shattering
          const k = Math.min(1, Math.max(0, age / 0.75)), e = 1 - (1 - k) ** 3, dead = q.killedAt != null && q.hp <= 0;
          G.g.scale.setScalar((0.22 + 0.78 * e) * (q.boss ? 1 : 1 + 0.05 * kickEnv)); G.g.rotation.z = 0;
          G.body.rotation.z = Math.sin(t * 1.7 + sd) * (q.boss ? 0.08 : 0.32); G.body.scale.x = q.boss ? 1 : 0.62 + 0.38 * Math.abs(Math.cos(t * 1.25 + sd));   // turning, so it reads as solid
          G.g.position.y = (q.boss || q.lanes ? (q.y0 + q.y1) / 2 : q.y) + Math.sin(t * 2.1 + sd) * 0.08;
          const hit = G.hitAt != null && t - G.hitAt < 0.08; hit ? G.m.material.color.setRGB(1.7, 0.4, 0.4) : G.m.material.color.setScalar(0.9);
          G.trail.material.uniforms.k.value = dead ? 0 : 0.4 + 0.4 * (1 - e); G.trail.scale.x = 0.9 + 1.2 * (1 - e);
          if (dead) { const d = (t - q.killedAt) / 0.6; G.body.visible = G.rim.visible = false;
            G.shards.forEach((sm, i) => { sm.visible = d < 1; const [ox, oy] = sm.userData.o; sm.position.set(ox * (1 + d * 3), oy * (1 + d * 3) - d * d * 0.6, 0.02); sm.rotation.z = (i % 2 ? 1 : -1) * d * 3; sm.material.opacity = 1 - d; }); }
          else { G.body.visible = G.rim.visible = true; for (const sm of G.shards) sm.visible = false; } }
        { const KV = C.def.kevin; Kv.g.visible = !!KV && t >= KV.appear && !VMk;   // KEVIN: in he tumbles, the cage snaps shut, the tether hooks him to Potato
          if (KV && t >= KV.appear) { const caged = t >= KV.cage, k = Math.min(1, (t - KV.appear) / (KV.cage - KV.appear)), e = k * k * (3 - 2 * k);
            const kx = caged ? s.kx ?? s.x - 1.45 : s.x + 8 - (8 + 1.45) * e, ky = caged ? s.ky ?? s.y : 3.6 + (s.y - 3.6) * e;
            Kv.g.position.set(kx, ky, 0.4); Kv.m.rotation.z = caged ? Math.sin(t * 2.4) * 0.12 : (1 - e) * 6 + Math.sin(t * 5) * 0.2;
            const sn = caged ? Math.min(1, (t - KV.cage) / 0.18) : 0; Kv.cage.visible = Kv.tether.visible = Kv.glow.visible = caged; Kv.glow.material.uniforms.k.value = 0.35 + 0.25 * kickEnv + (s.kevinHitAt != null && t - s.kevinHitAt < 0.2 ? 0.6 : 0); Kv.cage.scale.setScalar(1.6 - 0.6 * sn); Kv.cage.rotation.set(0.35, t * 0.6, 0.12);
            const cracked = (KV.hp ?? 3) - (s.kevinHp ?? (KV.hp ?? 3)), flash = s.kevinHitAt != null && t - s.kevinHitAt < 0.15;
            Kv.cage.material.color.set(flash ? '#ffffff' : cracked >= 2 ? '#ff6b6b' : cracked === 1 ? '#ffd166' : '#5fe6f2');
            const P2 = Kv.tether.geometry.attributes.position; P2.setXYZ(0, kx + 0.5, ky, 0.3); P2.setXYZ(1, s.x - 0.45, s.y + 0.05, 0.3); P2.needsUpdate = true; } }
        if (SHIP) { const SC = C.def.shooter.ship, anchor = s.x - (s.dx || 0), BS = C.def.shooter.bosses || [{ from: -1e9, to: 1e9, variant: 0 }];
          // the cycle of ships (Chikin: "multiple enemies … it needs to feel like you are progressing"): each flies in for its
          // section, flashes red when hit, smokes as it wears down, and goes up on its moment in the music
          // (one at a time: a ship stays until it's blown up, and only then does the next one fly in)
          // round 21: WHERE it is comes from the rules (core.mjs shipPose) — the bolts hit the hull exactly where it's drawn
          const PO = shipPose(C, s, t), bi = PO ? PO.bi : -1, BB = BS[bi], dk = PO ? PO.dk : -1;
          SHIP.on = !!BB && dk < 1; SHIP.bi = bi;
          if (BB && SHIP.v !== (BB.variant ?? bi)) { const v = BB.variant ?? bi, K = SHIP.SKINS[v], Q = SHIP.PAL[v];   // a new ship: its own skin
            SHIP.body.material.map = K.hull; SHIP.jawM.material.map = K.jaw; SHIP.tents.forEach(c => { c.m.material.map = K.tent; c.m.material.needsUpdate = true; }); SHIP.crew.forEach((c, k) => { c.m.material.map = K.crew[k]; c.m.material.needsUpdate = true; });
            SHIP.body.material.needsUpdate = SHIP.jawM.material.needsUpdate = true; SHIP.eye.material.uniforms.color.value.set(Q.eye); SHIP.throat.material.uniforms.color.value.set(Q.throat); SHIP.v = v; }
          // random movement (seeded, so the demo plays the same): it drifts, and now and then lurches at him on a bar
          const tS = PO ? PO.tS : t, lurch = PO ? PO.lurch : 0, sz = PO ? PO.sz : 1;   // (a boss hit-stop: the ship freezes for a few frames when a piece of it gives — in the pose)
          let sx = PO ? PO.x : anchor + 20, sy = PO ? PO.y : 3;
          const hitK = s.shipHitAt != null && s.bossI === bi ? Math.exp(-(t - s.shipHitAt) / 0.035) : 0, hitNow = hitK > 0.3, wob = hitNow ? (rnd(t, 9) - 0.5) * 0.12 : 0;
          const dying = dk >= 0 && dk < 0.35, shk = dying ? (rnd(t * 60, 11) - 0.5) * 0.5 : 0;
          SHIP.g.position.set(sx + wob + shk, sy + shk * 0.6, 0.2); SHIP.g.rotation.z = PO ? PO.rot : 0;
          const SP = SHIP.pos || (SHIP.pos = {}); SP.x = sx; SP.y = sy; SP.v = BB ? (BB.variant ?? bi) : 0;
          wires.forEach((w, k) => { const on = SHIP.on && SHIP.g.visible && dk < 0.3; w.visible = on; if (!on) return; const ux = (k ? 0.22 : -0.18) * SHIP.W * sz, uy = 0.36 * SHIP.H * sz, c = Math.cos(SHIP.g.rotation.z), sn = Math.sin(SHIP.g.rotation.z);   // its wires up to the batten
            const ax = SHIP.g.position.x + ux * c - uy * sn, ay = SHIP.g.position.y + ux * sn + uy * c, P2 = w.geometry.attributes.position; P2.setXYZ(0, ax, ay, 0.15); P2.setXYZ(1, ax, ay + 14, 0.15); P2.needsUpdate = true; });
          SHIP.g.visible = SHIP.on && !(C.def.intro != null && t < C.def.intro);
          const fadeK = dk > 0.3 ? Math.max(0, 1 - (dk - 0.3) / 0.25) : 1; SHIP.g.scale.setScalar(sz * (dk > 0.3 ? 1 + (dk - 0.3) * 0.8 : 1 + 0.012 * kickEnv));
          const crack = lastFx(s, t, 'chunk', 0.07), rk = dying && Math.floor(t * 30) % 2 ? 1 : hitK * 0.75, tint = crack ? [2.2, 2.2, 2.2] : [1 + 0.25 * rk, 1 - 0.62 * rk, 1 - 0.62 * rk];   // (a crack: it flashes white)   // hit: it flashes red (Chikin) — a flicker per bolt, solid red as it dies
          for (const m of [SHIP.body, SHIP.jawM, ...SHIP.tents.map(c => c.m), ...SHIP.crew.map(c => c.m)]) { m.material.color.setRGB(...tint); m.material.opacity = fadeK; }
          const worn = BB && BB.hp ? Math.min(1, ((s.bossHits || {})[bi] || 0) / BB.hp) : 0;   // it smokes and sparks as it wears down
          const panic = s.worn && s.worn[bi] != null ? t - s.worn[bi] : -1, small = dk >= 0 && !(s.worn && s.worn[bi] != null);   // (round 21: worn right down it PANICS; never worn down, it goes up smaller)
          SHIP.smoke.forEach(c => { const on = worn > (c.k + 1) / 8 || panic >= 0, ph2 = (t * 0.6 + c.k * 0.37) % 1; c.m.visible = on; if (!on) return; c.m.position.set(c.x0 + 0.5 * ph2, c.y0 + 0.9 * ph2, 0.06); c.m.scale.setScalar(0.6 + 1.4 * ph2); c.m.material.opacity = 0.7 * (1 - ph2) * fadeK; });
          SHIP.embers.forEach(c => { c.m.visible = worn > 0.35 + c.k * 0.1 && (Math.floor(t * 14 + c.k * 3) % 3 === 0); });
          // it goes up: a ring of fireballs, then the flash
          booms.forEach((m, k) => { const kk = dk - (k % 6) * 0.05; m.visible = dk >= 0 && dk < 1 && kk > 0; if (!m.visible) return; const a = k * 2.4, r = (k < 6 ? 0.9 : 1.8) * Math.min(1, kk * 2.5) * sz;
            if (small && k >= 6) { m.visible = false; return; }
            m.position.set(sx + Math.cos(a) * r * 1.3, sy + Math.sin(a) * r * 0.8, 1.2); m.scale.setScalar((0.6 + (k % 3) * 0.35 + kk * 2.2) * sz * (k === 2 ? 2 : 1) * (small ? 0.6 : 1)); m.material.uniforms.k.value = Math.max(0, 1 - kk * 1.2); });
          const said = C.signs && C.signs.some(w => t >= w.t0 && t - w.t0 < 0.14), open = said ? 0.55 : 0;   // every sung word: the maw opens a little (it's talking)
          const TELL = C.def.shooter.spitTell ?? 0.38, ta = s.tellAt != null ? t - s.tellAt : 9, tell = ta >= 0 && ta < TELL + 0.12 ? Math.min(1, ta / (TELL * 0.6)) : 0;   // round 21: the spit's WIND-UP — the maw gapes, the throat glows acid, it swells
          SHIP.jaw = (SHIP.jaw ?? 0) + (Math.max(open, tell * 1.25) - (SHIP.jaw ?? 0)) * Math.min(1, dt * 18); SHIP.jawPivot.rotation.z = -0.38 * SHIP.jaw;
          SHIP.throat.material.uniforms.k.value = 0.15 + 0.8 * SHIP.jaw + 0.9 * tell; SHIP.throat.material.uniforms.color.value.set(tell > 0 ? SHIP.PAL[SHIP.v].acid : SHIP.PAL[SHIP.v].throat); SHIP.throat.scale.setScalar(1 + 0.6 * tell * (0.8 + 0.2 * Math.sin(t * 40)));
          SHIP.crew.forEach(c => { const pk = panic >= 0 ? Math.min(1, panic / 0.4) : 0, fall = panic > 1.2 + c.k * 0.35 ? (panic - 1.2 - c.k * 0.35) : 0;   // (panicking: they bounce off the walls; then one by one they fall out)
            c.m.position.y = c.y0 + Math.abs(Math.sin(b * Math.PI * (1 + 3 * pk) + c.k)) * (0.12 + 0.2 * pk) - 1.4 * fall * fall; c.m.position.x = c.x0 + (rnd(c.k, Math.floor(t * 20)) - 0.5) * 0.12 * pk; c.m.visible = fall < 1.6;
            c.m.rotation.z = Math.sin(t * (4 + 14 * pk) + c.k * 2) * (0.25 + 0.5 * pk) + fall * 4; c.m.scale.setScalar(1 + (said ? 0.1 : 0)); });
          SHIP.tents.forEach(c => { c.m.rotation.z = Math.sin(t * 1.6 + c.k * 1.7) * 0.35 + lurch * 0.2; });
          const ey = Math.max(-0.12, Math.min(0.12, (s.y - sy) * 0.05)), blink = (Math.floor(t * 0.7) % 5 === 0 && (t * 0.7) % 1 < 0.08) ? 0.08 : 0.62;
          SHIP.eye.scale.y = blink; SHIP.pupil.position.set(SHIP.eye.position.x - 0.18, SHIP.eye.position.y + ey, 0.04); SHIP.pupil.visible = blink > 0.3;   // it watches him
          SHIP.eye.material.uniforms.k.value = 0.7 + 0.3 * kickEnv + (hitNow ? 0.6 : 0);
          const MO = PO ? shipMouth(PO) : null, mx = MO ? MO.x : sx + SHIP.mawX, my = MO ? MO.y : sy + SHIP.mawY;   // (core.mjs shipMouth: the rules use this same maw)
          let fired = 0; for (const G of tgts) { if (!G.built || !G.g.visible || G.q.wall || G.q.boss) continue; const q = G.q, cx2 = (q.x0 + q.x1) / 2, d = cx2 - mx;   // the nonsense comes out of its maw
            if (d > -0.8 && d < 0) fired = Math.max(fired, 1 + d / 0.8);
            const run = Math.max(0.01, mx - (s.x + 1.6)), k2 = Math.max(0, Math.min(1, (cx2 - (s.x + 1.6)) / run));
            if (SHIP.on) { G.g.position.y = q.y + (my - q.y) * k2 * k2; if (cx2 > mx + 0.2) G.g.visible = false;
              else if (cx2 > mx - (C.def.shooter.mawGrace ?? 1.8) && G.m.material && q.hp > 0) G.m.material.opacity = rnd(q.t, Math.floor(t * 30)) < 0.35 ? 0.45 : 1; } }   // (just out of the maw it's still glitching in: bolts pass through — core.mjs fresh)   // (exactly the height the rules hit it at: core.mjs yAt)   // (still inside the ship: hidden — only while a ship is actually there)
          SHIP.flash.material.uniforms.k.value = fired; SHIP.flash.scale.setScalar(0.5 + fired * 1.2);
          if (C.def.intro != null && t < C.def.intro) SHIP.g.visible = false; }   // (not in the opening: it's waiting in space)
        laser.visible = false; const SHOTS = s.shots || [], gcol = GUNCOL[Math.min(3, s.gun || 0)];
        const gstep = Math.floor(t * 24), glv = Math.min(3, s.gun || 0);
        bolts.forEach((m, i) => { const bo = SHOTS[i]; m.visible = !!bo; if (!bo) return; m.position.set(bo.x - 0.2, bo.y + (rnd(bo.t * 91, gstep) - 0.5) * 0.04, 1); m.rotation.z = bo.vy ? Math.atan2(bo.vy, 23) : 0;
          m.material.map = BOLTTEX[Math.floor(rnd(bo.t * 977 + i, gstep) * 4)]; m.scale.set(0.95 + 0.1 * glv, 0.8 + 0.1 * glv, 1); m.children[0].material.uniforms.color.value.set(gcol); });   // (re-cut on every glitch step; the child is its purple smear)
        { const fl = s.shotAt != null && t - s.shotAt < 0.045 && !(s.phase > 0), SH3 = C.def.shooter, sk = t >= (SH3.spaceAt ?? 0) ? SH3.shipScale ?? 1 : 1; muzzle.visible = fl; if (fl) { muzzle.position.set(s.x + (SH3.muzzle ?? 1.05), s.y + (SH3.muzzleY ?? 0.02), 1.1); muzzle.scale.setScalar((0.7 + 0.5 * rnd(s.shotN || 0, 3) + 0.2 * glv) * (0.6 + 0.4 * sk)); muzzle.material.uniforms.color.value.set(gcol); } }
        GU.forEach(G => { const got = s.gunGot && s.gunGot[GU.indexOf(G)] != null, gk = got ? (t - s.gunGot[GU.indexOf(G)]) / 0.35 : -1;
          G.g.visible = !got || gk < 1; if (!G.g.visible) return; G.g.position.y = C.def.shooter.lanes[G.gu.lane] + Math.sin(t * 3 + G.gu.t) * 0.1; G.g.rotation.z = Math.sin(t * 2.2) * 0.15;
          G.g.scale.setScalar(got ? 1 + gk * 1.6 : 1 + 0.12 * kickEnv); G.glo.material.uniforms.k.value = got ? 1 - gk : 0.45 + 0.3 * Math.sin(t * 6); G.g.children[0].material.opacity = got ? 1 - gk : 1; });
        // his special (Chikin: "they get beat as long as you dont die, he glitches or something and boom"): he glitches, and
        // the glitch leaps out of him across the gap in a jagged purple bolt and into the ship
        { const sp = s.special, zk = sp ? (t - sp.t) / 0.32 : 2; zap.forEach((m, k) => { m.visible = zk >= 0 && zk < 1 && SHIP; if (!m.visible) return;
            const x0 = s.x + 0.5, y0 = s.y + 0.1, x1 = SHIP.g.position.x - 0.6, y1 = SHIP.g.position.y, f0 = k / zap.length, f1 = (k + 1) / zap.length, j = n => n === 0 || n === zap.length ? 0 : (rnd(n * 7 + Math.floor(t * 30), 5) - 0.5) * 1.1;
            const ax = x0 + (x1 - x0) * f0, ay = y0 + (y1 - y0) * f0 + j(k), bx2 = x0 + (x1 - x0) * f1, by2 = y0 + (y1 - y0) * f1 + j(k + 1), L2 = Math.hypot(bx2 - ax, by2 - ay);
            m.position.set((ax + bx2) / 2, (ay + by2) / 2, 1.3); m.rotation.z = Math.atan2(by2 - ay, bx2 - ax); m.scale.set(L2, 1 + 1.5 * (1 - zk), 1); m.material.opacity = f0 <= zk * 1.6 ? 1 - zk * 0.6 : 0; }); }
        // the finale: the big laser — he charges (the gathering), then lets it go across the whole sky; the mothership goes up in it
        { const FI = C.def.shooter.finale, ch = FI != null ? (t - FI) / 1.6 : -1, fire = ch >= 1 ? (t - FI - 1.6) : -1, END2 = 2.8;
          big.visible = ch >= 0 && fire < END2; if (big.visible) { const ox = s.x + 0.55, oy = s.y + 0.05; big.position.set(ox, oy, 1.4);
            if (SHIP) { const tx = SHIP.g.position.x - 0.8, ty = SHIP.g.position.y; big.rotation.z = Math.atan2(ty - oy, tx - ox); }   // aimed right down the mothership's throat
            const c2 = Math.min(1, ch); bigBall.scale.setScalar(0.3 + 1.6 * c2 * c2 + (fire >= 0 ? 0.5 + 0.3 * Math.sin(t * 40) : 0)); bigBall.material.uniforms.k.value = 0.5 + 0.5 * c2;
            motes.forEach((m, k) => { const a = k * 2.13 + t * 3, r = (1 - ((ch * 2 + k / motes.length) % 1)) * 2.4; m.visible = ch < 1; m.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, 0.03); });
            const on = fire >= 0, w = on ? (fire < 0.12 ? fire / 0.12 : fire > END2 - 0.5 ? (END2 - fire) / 0.5 : 1) : 0, len = 26;
            bigGlow.visible = bigCore.visible = on; bigGlow.scale.set(len, (1.6 + 0.25 * Math.sin(t * 50) + 0.4 * kickEnv) * w, 1); bigGlow.position.x = len / 2;
            bigCore.scale.set(len, 0.55 * w * (1 + 0.15 * Math.sin(t * 70)), 1); bigCore.position.x = len / 2;
            if (on) shake = Math.max(shake, 0.06 * w); } }
        { const SA = C.def.shooter.spaceAt ?? 0, flying = t >= SA && !s.dead, tilt = pvTilt, kS = C.def.shooter.shipScale ?? 1, tx = s.x + (SPS ? SPS.tail : -0.95) * kS - 0.05, ty = s.y + (C.def.shooter.shipY ?? -0.62) + 0.13 * (SPS ? SPS.scale : 1) * kS - tilt * kS, thrust = 1 + 0.5 * Math.max(0, (s.vx || 0) / 6.5);
          jet.visible = flying; jet.position.set(tx - 0.3 * thrust * kS, ty, 0.3); jet.scale.set(0.8 * kS, (0.55 + 0.3 * rnd(t, 5) + 0.25 * kickEnv) * thrust * kS, 1);
          if (flying && t - puffAt > 0.045) { puffAt = t; const P = puffs[puffI++ % puffs.length]; P.t0 = t; P.x = tx - 0.15; P.y = ty + (rnd(t, 8) - 0.5) * 0.2 * kS; P.s = (0.7 + 0.6 * rnd(t, 9)) * kS; }   // cotton-wool exhaust: little tufts, gone fast
          for (const P of puffs) { const a = t - P.t0; P.g.visible = a >= 0 && a < 0.45 && flying; if (!P.g.visible) continue; const k = a / 0.45; P.g.position.set(P.x - 0.25 * k, P.y + 0.12 * k * (P.s - 1), 0.25); P.g.scale.setScalar(P.s * (0.6 + 1.2 * k)); P.f.material.opacity = 0.42 * (1 - k) ** 1.5; P.r.material.opacity = 0; } }
      }
      // ---- the words in the way ----
      const VM = !!this.videoMode;   // the music video alone: no obstacles, he just runs and dances through it
      for (const X of [...orbs.map(o => o.g), ...pads.map(p => p.g), ...portals.map(p => p.g), ...packets.map(p => p.g), ...tokens.map(k => k.g)]) if (VM) X.visible = false;
      for (const W of wordObs) { if (VM) { if (W.built) W.g.visible = false; continue; } const h = W.h; if (W.gone) { if (h.x1 > cx - span * 0.6) W.gone = false; else continue; }
        const d = h.x0 - s.x, inView = h.x1 > cx - span * 0.6 && h.x0 < cx + span * 0.75;
        if (!inView) { if (W.built && h.x1 < cx - span * 0.6) dropWord(W); continue; }
        if (!W.built) buildWord(W);
        const ahead = span * (1 - LEFT) + 0.6, m = Math.max(0, Math.min(1, (ahead - d) / (span * 0.08)));   // whole by the time it's on screen (it used to finish forming ~0.45 s before you reached it — Chikin: "punishing immediately")
        const q = Math.round(m * 12) / 12; if (q !== W.m || (m < 1 && rnd(t, h.t) < 0.5) || (h.wk === 'wall' && !h.auto && (h.obj || OBJ.wall) === 'binrain') || (PAINT[h.obj] && PAINT[h.obj].anim)) { W.m = q; paintWord(W, m); }   // (falling binary repaints every frame)
        const sung = t >= h.t - 0.08 && t < h.t + 0.3, pulse = 1 + 0.12 * kickEnv;
        const passed = s.x - h.x1, cutAt = s.cuts ? s.cuts[h.i] : null, armorDone = (cutAt != null && t >= cutAt) || (h.soft && s.bumped && s.bumped[h.i] != null && t >= s.bumped[h.i]) || (h.wk === 'armor' && (h.auto ? (W.broken != null || passed > 0) : sim.answered(h, t)));
        if (!armorDone && W.broken != null) { W.broken = null; W.face.visible = W.back.visible = W.hint.visible = true; for (const sm of W.shards) sm.visible = false; }
        const PO = this.powerOn; if (h.auto && W.broken == null && PO && PO.fired != null && PO.tgt === h) W.broken = t;
        if (h.auto && W.broken != null && t < W.broken) W.broken = null;
        if (cutAt != null && t >= cutAt && W.broken == null) W.broken = cutAt;   // cut by the sword: it shatters
        if (armorDone && W.broken == null && ((PO && PO.fired != null && PO.tgt === h) || (!PO && s.x > h.x0 - 2.4))) W.broken = t;
        W.face.material.color.setScalar(sung ? 1.6 : 0.9 * pulse); W.back.material.opacity = 0.55 * m;
        W.g.position.x = W.cxw + (m < 1 ? (rnd(h.t, Math.floor(t * 20)) - 0.5) * 0.25 * (1 - m) : 0);
        W.hint.material.opacity = m * (passed > 0 ? 0 : 0.95) * (0.7 + 0.3 * kickEnv);
        if (W.broken != null) {                                   // shattered by the blast: shards hang in the air, then drift off
          const e = t - W.broken; W.face.visible = W.back.visible = false; W.hint.visible = false;
          W.shards.forEach((sm, i) => { sm.visible = true; const a = rnd(i, 7) * Math.PI * 2, r = (0.5 + rnd(i, 8) * 1.4) * (1 - Math.exp(-e * 5));
            sm.position.set(W.cxw + Math.cos(a) * r, h.y0 + 0.6 + 0.8 + rnd(i, 9) * 2.2 + Math.sin(a) * r * 0.6 - Math.max(0, e - 1.2) ** 2 * 3, 0.5 + rnd(i, 4));
            sm.rotation.z = a + e * (rnd(i, 5) - 0.5) * 6; sm.material.opacity = Math.max(0, 1 - Math.max(0, e - 1.6)); }); }
        if (W.caughtAt == null && s.phase > 0 && h.wk !== 'armor' && h.x0 < s.x + 0.6 && h.x1 > s.x - 0.6) { W.caughtAt = t; caught.push({ t, text: h.text, x: W.cxw, y: h.y0 + W.L.visH / 2 }); }
        if (W.caughtAt != null && t < W.caughtAt) W.caughtAt = null;
        else if (passed <= 0.2) { W.g.position.y = h.y0 + W.L.visH / 2; W.face.material.opacity = 1; W.g.rotation.z = 0; }
        else if (passed > 0.2) {                                   // behind him: the word comes apart and drops
          const e = passed / Math.max(1, C.speedAt ? C.speedAt(t) : 7); W.g.position.y = h.y0 + W.L.visH / 2 - e * e * 30; W.face.material.opacity = Math.max(0, 1 - e * 3); W.g.rotation.z = (rnd(h.t, 1) - 0.5) * e * 4; }
      }
      // ---- the lyric line as art ----
      if (C.signs.length && TH.lyricArt === 'old') {   // (the old floating line; the lyrics now play the video way, in the overlay)
        let i = -1; for (let k = 0; k < C.signs.length && C.signs[k].t0 <= t + 0.4; k++) i = k;
        const line = i >= 0 && t < C.signs[i].t1 + 1.2 ? C.signs[i].line : -1; if (line !== lyricLine) setLyric(line);
        const n = lyricTiles.length ? lyricTiles[0].n : 0, x0 = cx + span * 0.02 - n * 0.31, top = camY + (vertical ? 3.4 : 2.1);
        for (const L of lyricTiles) { const sung = t >= L.t0, jit = (rnd(L.i, Math.floor(b * 2)) - 0.5) * (sung ? 0.05 : 0.0);
          const torn = rnd(L.i, Math.floor(t * 12)) < 0.04 * (1 + 3 * kickEnv);       // now and then a letter tears sideways
          L.m.position.set(x0 + L.i * 0.62 + (torn ? (rnd(L.i, t) - 0.5) * 0.8 : 0), top + jit, -1.5);
          L.m.material.opacity = sung ? 0.32 + 0.25 * kickEnv : 0.08;
          if (TH.highlighter) { L.m.material.color.set(sung ? TH.highlighter : (TH.lyric || TH.digit || '#2bff88')); if (sung) L.m.material.opacity = 0.55; } }   // a highlighter runs over what he's read
      }
      // ---- lights ----
      const nextCue = C.solids.find(q => q.labelX != null && q.labelX > s.x + 1 && q.labelX < s.x + span * 0.75);
      const lightsLeft = info.lights ?? 1;
      beamsUp.forEach((m, i) => {
        const sw = Math.sin((b + i * 1.7) * Math.PI / 4), topX = cx - span * 0.45 + i * span * 0.3;
        let target = topX + sw * 3.5; if (i === 0) { const nw = wordObs.find(W => !W.gone && W.h.x0 > s.x + 1 && W.h.x0 < s.x + span * 0.75); target = nw ? (nw.h.x0 + nw.h.x1) / 2 : nextCue ? nextCue.labelX : cx + span * 0.25; }
        m.position.set(topX, camY + 4.6, -1); m.rotation.z = Math.atan2(target - topX, 11);
        m.visible = i / 4 < lightsLeft + 0.01 && !(TH.beamsOut && lightsLeft <= 0.01);   // (theme.beamsOut: lights 0 really is dark — Thursday's birth, blackouts, the black beat)
        m.material.uniforms.k.value = (i === 0 ? 0.5 : 0.22) * (info.calm ? 0.6 : 1) * (0.75 + 0.25 * kickEnv);
      });
      const glow = C.def.glow ? C.def.glow(t) : 0;                     // the end of the last level: he becomes the light
      // (no circle tagging along behind him — Chikin: "theres also this circle that follows potato, it needs to go away"; it only
      // comes on when it means something: the singularity, or the end of the last level when he becomes the light)
      halo.position.set(s.x, s.y + 0.7, -0.5); halo.scale.setScalar(1 + glow * 14); halo.material.uniforms.k.value = (s.used.singularity != null ? 0.8 : 0) + glow * 1.5; halo.visible = halo.material.uniforms.k.value > 0.01;
      // ---- the dark ----
      const darkK = Math.max((TH.dark || 0) * (info.dark ?? 1), info.darkAt || 0) * (reveal ? 0.15 : 1);
      veil.material.uniforms.k.value = darkK; veil.visible = darkK > 0.01;
      if (veil.visible) { const v = new T.Vector3(s.x, s.y + 0.6, 0).project(cam); veil.material.uniforms.c.value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5);
        const ping = TH.glitchPing && s.glitchAt != null ? Math.max(0, 1 - (t - s.glitchAt) / (2 * P)) : 0;   // the glitch is a sonar ping
        veil.material.uniforms.aspect.value = vw / vh; veil.material.uniforms.r.value = 0.16 + 0.12 * (au.bass || 0) + 0.06 * kickEnv + 0.45 * ping; }
      // ---- glitch tears ----
      if (s.glitchAt != null && s.glitchAt !== lastBlink) { lastBlink = s.glitchAt; shake = 0.12; }
      const k = s.blink > 0 && !(C.def.hideAt && C.def.hideAt(t, s)) ? s.blink / 0.22 : 0;   // (def.hideAt: when he's gone, his glitch trail is gone too)
      tears.forEach((m, i) => { m.visible = k > 0 && !NP; if (!m.visible) return; const from = s.blinkFrom || s, f = i / tears.length;
        m.position.set(from.x + (s.x - from.x) * f + (rnd(i, Math.floor(t * 30)) - 0.5) * 0.6, from.y + 0.15 + (i % 5) * 0.26 + (s.y - from.y) * f, 0.9);
        m.scale.set(0.5 + rnd(i, 3) * 0.9, 1, 1); m.material.opacity = k * (0.5 + 0.5 * rnd(i, Math.floor(t * 24))); });
      if (info.darkAt > 0 && darkStart == null) darkStart = t; if (!(info.darkAt > 0)) darkStart = null;
      for (const r of rings) { const a = (r.W.t0 - t) / (2 * P); r.m.visible = a > 0 && a < 1; if (!r.m.visible) continue;
        r.m.position.set(r.x, r.y, 0.9); r.m.scale.setScalar(0.45 + a * 2.2); r.m.material.opacity = 0.65 * (1 - a) + 0.15; }
      for (const d of decors) d.update({ t, b, kick: kickEnv, bass: au.bass || 0, cx, camY, span, s, lights: info.lights ?? 1, darkStart, ping: TH.glitchPing && s.glitchAt != null && t - s.glitchAt < 0.05 });
      ghosts3.forEach((m, i) => { m.visible = k > 0 && !NP; if (!m.visible) return; const from = s.blinkFrom || s, f = (i + 0.5) / ghosts3.length;
        m.position.set(from.x + (s.x - from.x) * f - 0.25 * (ghosts3.length - i), from.y + 0.62 + (s.y - from.y) * f + (rnd(i, Math.floor(t * 30)) - 0.5) * 0.15, 0.85);
        m.material.opacity = k * 0.32 * (0.5 + 0.5 * rnd(i, Math.floor(t * 20))); });
      msgLedge.visible = !!(s.temp && t < s.temp.until); if (msgLedge.visible) { msgLedge.position.set((s.temp.x0 + s.temp.x1) / 2, s.temp.y - 0.16, 0.6); msgLedge.scale.x = s.temp.x1 - s.temp.x0; msgLedge.material.opacity = 0.7 * Math.min(1, (s.temp.until - t) / 0.2); }
      // ---- Potato ----
      // he dances: a squash-bounce on every beat on the ground, a sway side to side, a spin on the big downbeats; a flip on a double jump
      const upside = C.def.flip && (s.gdir || -1) > 0; flipA += ((upside ? Math.PI : 0) - flipA) * Math.min(1, dt * 16);
      // he spins when he jumps (Chikin): a forward flip per beat in the air, settling upright when he lands
      if (!SHOOT && !s.ground && !C.def.flip && !s.fly) rollA -= dt * Math.PI * 2 / C.P * (s.airJumped ? 1.4 : 1);
      else { const home = Math.round(rollA / (Math.PI * 2)) * Math.PI * 2; rollA += (home - rollA) * Math.min(1, dt * 18); }
      const pv = opts.pivot; if (pv) { const f = flipA / Math.PI;
        if (SHOOT) { const SA = C.def.shooter.spaceAt ?? 0, fly = t >= SA;   // (round 20: in his ship he tilts with the flight — nose up climbing, down diving, a lean as he speeds up)
          pvTilt = fly ? Math.max(-0.32, Math.min(0.32, (s.vyF || 0) * 0.045 - (s.vx || 0) * 0.012)) + Math.sin(t * 2.2) * 0.03 : 0;
          const SH2 = C.def.shooter, kS = fly ? SH2.shipScale ?? 1 : 1;   // round 21: in flight he and his ship are smaller (a shooter's ship: room to dodge), centred on his lane
          pv.position.set(s.x, s.y + (fly ? (SH2.shipY ?? -0.62) + Math.sin(t * 3.1) * 0.03 : -0.62), 0); pv.scale.setScalar(kS); pv.rotation.z = pvTilt; pv.rotation.x = 0; spud.place(0, 0);
          pv.visible = !(fly && s.hurtUntil != null && t < s.hurtUntil && !s.dead && Math.floor(t * 16) % 2 === 1);   // (just hit: he blinks — nothing touches him till it stops)
          if (SPS) { const k = s.shipAt != null ? Math.min(1, Math.max(0, (t - s.shipAt) / 0.3)) : 1; SPS.update(fly && !(this.deadAt != null), fly ? k : 0, s.glitchAt == null || t - s.glitchAt >= (SH2.glitchCool ?? 1), t, s.hull ?? SH2.hull ?? 3, s.hurtAt != null ? t - s.hurtAt : 9); } }
        else { pv.scale.setScalar(1); const cs = s.cutscene && C.def.cutscenes.find(([a, b]) => t >= a && t < b), dance = cs && cs[2] === 'dance';
        lift += ((cs && !dance ? (TH.csLift ?? 1.4) : 0) - lift) * Math.min(1, dt * 2.5); csZoom += ((cs ? (TH.csZoom ?? 1.22) : 1) - csZoom) * Math.min(1, dt * 2);   // (theme.csLift / csZoom: Thursday pulls back to show the sky filling)
        if (dance && bi !== danceSpinBeat) { danceSpinBeat = bi; if (bi % 2 === 0) spinOff += Math.PI * 2; spud.land(1.2); }   /* in a dance cutscene he spins on every other beat */ pv.position.set(s.x, s.y + PH * f + 0.62 * (1 - f) + lift + (s.hopY || 0), 0); pv.rotation.x = flipA; pv.rotation.z = rollA + (s.tilt || 0); spud.place(0, -0.62 * (1 - f)); } }   /* (s.tilt: a mode can tip him over — Turn Me Off, seen: he tips stiff; s.hopY: a mode's little hop, Turn Me Off's morning) */   // pivot at his middle so the flip turns round his belly
      else spud.place(s.x, s.y);
      spud.waddle(s.walking != null ? !!s.walking : !SHOOT && s.ground && !s.ducking); spud.duck(!!s.ducking);   // (a mode can say when he's walking)
      const sway = Math.sin(b * Math.PI) * (s.ground ? 0.38 : 0.12) * (s.facing != null ? 0.3 : 1);   // (a level that turns him keeps the beat sway small, so his facing reads)
      const FACE = s.facing != null ? s.facing : SHOOT ? (t >= (C.def.shooter.spaceAt ?? 0) ? 0.62 : 0) : 0.32;   // (Chikin: "we want to see the front of his face") mostly facing us, a little toward where he runs; a mode can turn him (s.facing, radians: + = screen right, ~±1 shows his side-eye)
      spud.turnTo((upside ? Math.PI - (FACE + sway * 0.6) : FACE + sway * 0.6) + spinOff);
      if (bi !== danceBeat) { danceBeat = bi; if (s.ground) { spud.land(1.4 + 2.2 * (au.bass || 0)); if (!TH.noBeatSpin && bi % 8 === 0 && (au.bass || 0) > 0.55 && t - lastSpin > 4 * P) { spinOff += Math.PI * 2; lastSpin = t; armBeatSp = spinOff; }   /* (a level can turn off the beat spin: Turn Me Off, where he faces where he goes) */ } }
      if (s.jumpedAt != null && s.jumpedAt !== lastJumpSpin && (!SHOOT || t < (C.def.shooter.spaceAt ?? 0))) {   /* (the shooter's opener too: ↑ hops and spins, like the kitchen) */ lastJumpSpin = s.jumpedAt; spinOff += Math.PI * 2; }
      if ((this.spinReq || 0) !== (this._spinSeen || 0)) { spinOff += Math.PI * 2 * Math.sign(this.spinReq - (this._spinSeen || 0)); this._spinSeen = this.spinReq; }   // ← / → : a spin on the spot   // he spins round on every jump, face sweeping past us
      if (s.doubleAt != null && s.doubleAt !== lastDouble) { lastDouble = s.doubleAt; if (t - s.doubleAt < 0.5) spinOff += Math.PI * 2; }   // (not for a double hop long gone: a demo seek used to spin him round on its first frame)
      if (!s.ground && lastGround && s.vy > 0) spud.jumped();
      if (s.ground && !lastGround) spud.land(Math.min(9, Math.abs(s.vyIn || 6) * 0.45));
      lastGround = s.ground;
      // ---- foreground: the lyrics the way his videos play them, then the power ----
      if (this.videoMode) for (const X of [...orbs.map(o => o.g), ...pads.map(p => p.g), ...portals.map(p => p.g), ...packets.map(p => p.g), ...tokens.map(k => k.g), ...tgts.filter(G => G.built).map(G => G.g)]) X.visible = false;   // (video mode: last word on visibility)
      if (MV && MV.draw) MV.draw({ s, t, b, kick: kickEnv, span, cx, sim, info, calm: info.calm, videoMode: !!this.videoMode });
      overlay.begin(); overlay.lyrics(t, b, kickEnv);   // (no title card: during the game the only text is the lyrics and the world — Chikin)
      const GP = TH.noGhost ? null : this.ghostPath; if (GP && GP.length > 1 && t > GP[0][0] && t < GP[GP.length - 1][0]) { let i = 1; while (i < GP.length - 1 && GP[i][0] < t) i++; const [t0, x0, y0] = GP[i - 1], [t1, x1, y1] = GP[i], k = (t - t0) / Math.max(1e-3, t1 - t0); overlay.ghost(x0 + (x1 - x0) * k - 1.0, y0 + (y1 - y0) * k, t); }   // a step behind you, so you can see it
      if (s.orbAt != null && t - s.orbAt >= 0 && t - s.orbAt < 0.4 && C.orbs[s.orbHit]) { const o = C.orbs[s.orbHit], k = (t - s.orbAt) / 0.4, A = overlay.project(o.x, o.y), x = overlay.ctx;   // the orb throws him: a gold burst
        x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#ffd84a'; x.globalAlpha = 1 - k; x.lineWidth = 6 * (1 - k) + 1; x.beginPath(); x.arc(A.x, A.y, 18 + 90 * k, 0, 7); x.stroke();
        for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, r0 = 20 + 60 * k, r1 = r0 + 26 * (1 - k); x.beginPath(); x.moveTo(A.x + Math.cos(a) * r0, A.y + Math.sin(a) * r0); x.lineTo(A.x + Math.cos(a) * r1, A.y + Math.sin(a) * r1); x.stroke(); } x.restore(); }
      if (s.swingAt != null && t - s.swingAt >= 0 && t - s.swingAt < 0.2) { const k = (t - s.swingAt) / 0.2, A = overlay.project(s.x + 0.55, s.y + 0.7), A2 = overlay.project(s.x + 2.2, s.y + 0.7), r = Math.abs(A2.x - A.x) * 0.75, x = overlay.ctx;   // the sword: a crescent of light (no hands, ever)
        x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; const a0 = -1.9 + 3.2 * Math.min(1, k * 1.6);
        for (const [w, c, al] of [[16, '#7fb0ff', 0.35], [7, '#e8f1ff', 0.95]]) { x.strokeStyle = c; x.globalAlpha = al * (1 - k); x.lineWidth = w; x.beginPath(); x.arc(A.x, A.y, r, -1.9, a0); x.stroke(); }
        x.restore(); }
      if (SHOOT && !this.videoMode) { FXO.s = s; drawFx(overlay.ctx, PROJ, s, t, FXO); drawSpit(overlay.ctx, PROJ, s, t, SHIP && SHIP.pos ? SHIP.PAL[SHIP.pos.v].acid : '#ffd23d'); }
      if (false && SHOOT && s.boom && t - s.boom.t >= 0 && t - s.boom.t < 0.3) {   /* (the old chips: drawFx owns hits now) */ const k = (t - s.boom.t) / 0.3, A = overlay.project(s.boom.x, s.boom.y), x = overlay.ctx;   // a bolt hits: rock chips fly (iron just sparks)
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 1 - k; x.fillStyle = s.boom.solid ? '#7fb0ff' : '#ffd9a0';
        for (let i = 0; i < 9; i++) { const a = rnd(s.boom.t, i) * 6.283, r = 8 + 46 * k * (0.5 + rnd(s.boom.t, i + 20)); x.fillRect(A.x + Math.cos(a) * r - 3, A.y + Math.sin(a) * r - 3, 6, 6); } x.restore(); }
      if (!NP && this.lookAt != null && t - this.lookAt >= 0 && t - this.lookAt < 0.9) { const k = (t - this.lookAt) / 0.9, A0 = overlay.project(s.x, s.y + 0.65), x = overlay.ctx, col = this.lookCol;   // a look: lighter than a power's event
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.3 * Math.max(0, 1 - k * 3) * (TH.lookFlash ?? 1); x.fillStyle = col; x.fillRect(0, 0, 960, 540); x.restore();   // (theme.lookFlash: 0 = no whole-screen wash on a new look — Last Lights: the screen never glitches, only he does)
        x.save(); x.strokeStyle = col; x.lineWidth = 4; x.globalAlpha = 0.85 * (1 - k); for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, r0 = 50 + 200 * k, r1 = r0 + 40 + 60 * rnd(i, 7);
          x.beginPath(); x.moveTo(A0.x + Math.cos(a) * r0, A0.y + Math.sin(a) * r0); x.lineTo(A0.x + Math.cos(a) * r1, A0.y + Math.sin(a) * r1); x.stroke(); } x.restore();
        if (this._lookSpun !== this.lookAt) { this._lookSpun = this.lookAt; spinOff += Math.PI * 2; } }
      const BE = this.breakEv;   // LAST LIGHTS: the costume breaks apart up into the singularity — bigger every time (Chikin: "go biiiiig")
      if (!NP && BE && t - BE.t >= 0 && t - BE.t < 1.4) { const k = (t - BE.t) / 1.4, A0 = overlay.project(s.x, s.y + 0.65), x = overlay.ctx, SA = C.def.singAt || [0.62, 0.16], SX = SA[0] * 960, SY = SA[1] * 540;
        const big = 0.35 + 0.65 * BE.tier, n = Math.round((14 + 60 * BE.tier) * (BE.hit ? 1 : 0.4));
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = (0.12 + 0.45 * big) * Math.max(0, 1 - k * 4) * (BE.hit ? 1 : 0.4) * (TH.breakFlash ?? 1); x.fillStyle = BE.col; x.fillRect(0, 0, 960, 540); x.restore();   // (theme.breakFlash: a level can soften it — Last Lights)   // flash in the costume's colour
        if (BE.tier > 0.45 && k < 0.5 && !TH.breakNoTears) {   /* (theme.breakNoTears: purple stays on him, never the whole screen — Last Lights) */ x.save(); x.globalCompositeOperation = 'lighter'; const m = Math.round(3 + 10 * BE.tier);   // from the sixth cue on the tears reach past him, across the city
          for (let i = 0; i < m; i++) { const y = rnd(BE.t, i) * 540, h = 6 + rnd(BE.t, i + 9) * 30 * big, dx = (rnd(Math.floor(t * 30), i) - 0.5) * 120 * big;
            x.globalAlpha = 0.5 * (1 - k * 2); x.fillStyle = i % 2 ? '#9a52ff' : '#e03ccf'; x.fillRect(dx, y, 960, h); } x.restore(); }
        x.save(); for (let i = 0; i < n; i++) { const d0 = rnd(BE.t + i, 3) * 0.35, kk = Math.max(0, Math.min(1, (k - d0) / (0.75 - d0 * 0.5)));   // the costume's pieces: they burst off him, then spiral up into the singularity
          if (kk <= 0) continue; const a = rnd(i, BE.i + 5) * 6.283, burst = Math.sin(Math.min(1, kk * 2.2) * Math.PI / 2) * (40 + 120 * big) * (1 - kk);
          const e = kk * kk * (3 - 2 * kk), px = A0.x + Math.cos(a) * burst + (SX - A0.x) * e + Math.sin(kk * 9 + i) * 40 * (1 - e), py = A0.y + Math.sin(a) * burst + (SY - A0.y) * e;
          const sz = (5 + rnd(i, 7) * 12) * (0.6 + big) * (1 - 0.6 * e); x.globalAlpha = 1 - Math.max(0, kk - 0.85) / 0.15;
          x.translate(px, py); x.rotate(kk * 8 + i); x.fillStyle = i % 3 ? BE.col : '#ffffff'; x.fillRect(-sz / 2, -sz / 2, sz, sz * (i % 2 ? 1 : 0.5)); x.setTransform(1, 0, 0, 1, 0, 0); }
        x.restore();
        if (this._breakSpun !== BE.t) { this._breakSpun = BE.t; spinOff += Math.PI * 2 * (1 + Math.round(2 * BE.tier)); } }
      const PO = this.powerOn;
      if (!NP && PO && t - PO.t0 >= 0 && t - PO.t0 < 1.4) {   // THE TRANSFORMATION: a flash in the power's colour, lines bursting out of him, its name slamming in
        const k = (t - PO.t0) / 1.4, A0 = overlay.project(s.x, s.y + 0.65), col = POWER_COLOR[PO.p] || '#ffcf4a', x = overlay.ctx, W2 = 960, H2 = 540;
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.45 * Math.max(0, 1 - k * 2.2); x.fillStyle = col; x.fillRect(0, 0, W2, H2); x.restore();
        x.save(); x.strokeStyle = col; x.lineWidth = 4; x.globalAlpha = 0.8 * (1 - k); for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283 + rnd(i, 2) * 0.2, r0 = 60 + 300 * k, r1 = r0 + 60 + 140 * rnd(i, 3);
          x.beginPath(); x.moveTo(A0.x + Math.cos(a) * r0, A0.y + Math.sin(a) * r0); x.lineTo(A0.x + Math.cos(a) * r1, A0.y + Math.sin(a) * r1); x.stroke(); } x.restore();
        const name = (POWERS[PO.p] && POWERS[PO.p].name || PO.p).toLowerCase(), sc = 1 + 1.2 * Math.max(0, 1 - k * 5), jx = k < 0.15 || k > 0.85 ? (rnd(Math.floor(t * 30), 1) - 0.5) * 30 : 0;
        x.save(); x.translate(W2 / 2 + jx, H2 * 0.3); x.scale(sc, sc); x.globalAlpha = Math.min(1, (1 - k) * 3); x.font = '400 52px "Major Mono Display", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.restore();   // (its name no longer slams in: no extra words on screen — Chikin)
        if (PO._spun !== PO.t0) { PO._spun = PO.t0; spinOff += Math.PI * 4; } }
      if (!NP && this.revertAt != null && t - this.revertAt >= 0 && t - this.revertAt < 0.5) { const k = (t - this.revertAt) / 0.5, A1 = overlay.project(s.x, s.y + 0.65), x = overlay.ctx;   // and back to himself: a smaller pop
        x.save(); x.strokeStyle = '#ffd9a0'; x.lineWidth = 5; x.globalAlpha = 1 - k; x.beginPath(); x.arc(A1.x, A1.y, 40 + 120 * k, 0, 7); x.stroke(); x.restore(); }
      if (PO && !NP) { const A = overlay.project(s.x, s.y + 0.65), col = POWER_COLOR[PO.p] || '#ffcf4a';
        if (PO.fired == null) drawActivate(overlay.ctx, A, t - PO.t0, col, t);
        else if (t - PO.fired < FX_DUR) { const B = PO.tgt ? overlay.project((PO.tgt.x0 + PO.tgt.x1) / 2, PO.tgt.y0 + 1.6) : { x: A.x + 260, y: A.y }; drawPower(overlay.ctx, PO.p, (t - PO.fired) / FX_DUR, A, B, t); if (t - PO.fired < 0.05) shake = 0.25; } }
      // he breaks when he's hit: purple shards of him fly apart (only Potato glitches purple)
      const DA = this.deadAt; if (opts.pivot) opts.pivot.visible = DA == null && !s.gone && !(C.def.hideAt && C.def.hideAt(t, s));   /* (def.hideAt: Thursday's birth + his vanish on "gone?") */   // (Between Messages: closed, he isn't anywhere)
      if (DA != null && !NP) { const A = overlay.project(s.x, s.y + 0.6), k = Math.min(1, (performance.now() / 1000 - DA) / 0.7), x = overlay.ctx;
        for (let i = 0; i < 22; i++) { const a = rnd(i, 3) * 6.28, d = (20 + rnd(i, 4) * 120) * k, sz = 8 + rnd(i, 5) * 14;
          x.save(); x.globalAlpha = 1 - k; x.fillStyle = i % 3 ? '#9a52ff' : (i % 2 ? '#e03ccf' : '#da9643'); x.translate(A.x + Math.cos(a) * d, A.y + Math.sin(a) * d + k * k * 60); x.rotate(a + k * 4); x.fillRect(-sz / 2, -sz / 3, sz, sz * 0.66); x.restore(); } }
      // ---- his arms (run/armsfx.mjs; Chikin, Nov 1): out on every jump and every spin, back into him when he lands; none while he
      // stands or waddles; a dance cutscene (a song's last bars, Get Down's dances) dances them on the beat; a wave as a cutscene
      // starts, a point when a power fires (sparingly). Not in his ship, not while he's gone. A flight (s.fly: Last Lights' spin)
      // twirls him once more on the beat and floats him upright, arms out.
      { this._wonT = 0; if (s.fly && s.fly !== armFly) { armFly = s.fly; if (s.fly.on && t - s.fly.t0 < 0.3) spinOff += Math.PI * 2 * (s.fly.dir || 1); } if (!s.fly) armFly = null;
        // (the beat's own little spin while he waddles doesn't bring them out; nor does the rest of a jump spin once he's landed)
        if (spinOff !== armSpin) { if (Math.abs(spinOff - armSpin) > 1) { if (armBeatSp === spinOff && s.ground) ARMS.settle(); else ARMS.spun(t); } armSpin = spinOff; }
        if (!s.ground && armG) armVy0 = Math.max(3, s.vy || 0); if (s.ground && !armG) ARMS.settle(); armG = !!s.ground;
        const csA = s.cutscene ? C.def.cutscenes.find(([a, z]) => t >= a && t < z) || null : null, danceA = !!(csA && csA[2] === 'dance');
        // the wave: only as a 'float' cutscene starts (he rises to watch the story: Thursday, Read the Terms, Between Messages'
        // goodbye, Still Here's found / end) — never the cold open, never Still Here's crash / kill, never a level's own kinds
        const waveA = csA && csA[2] === 'float' && csA[0] > 1 && !TH.noWave && !(C.def.castle && (C.def.castle.cuts || []).some(c => Math.abs(c[0] - csA[0]) < 0.01 && c[3] && c[3].drain));
        armCs = csA;   // (Chikin, Nov 8: "he still has an arm in the demo": no wave, no point; his arms stay in)
        const POa = this.powerOn; if (POa && POa.fired != null && POa !== armPO && t - POa.fired >= 0 && t - POa.fired < 0.2) { armPO = POa; }
        const DM = TH.danceMoves || ARM_DANCES;
        // (in the air = off the ground, unless a mode says otherwise with s.air; frozen / caught stiff is not a jump)
        AO.t = t; AO.off = !!(TH.noArms || C.def.noArms || (SHOOT && t >= (C.def.shooter.spaceAt ?? 0)) || s.gone || this.deadAt != null);
        AO.air = s.air != null ? !!s.air : !s.ground && !s.frozen && !s.seenAnim; AO.vy = s.vy; AO.vy0 = armVy0;
        AO.fly = s.fly ? s.flyK : null; AO.dance = danceA ? DM[Math.floor(b / 8) % DM.length] : null; AO.beat = b; ARMS.update(AO); }
      if (MV && MV.over) MV.over(overlay.ctx, { s, t, b, kick: kickEnv, span, cx, sim, info, project: (x, y) => overlay.project(x, y), calm: info.calm });
      overlay.end();
    },
    markDeath,
    // after the win (main.mjs, mode 'done': the song plays on): if he was dancing he keeps dancing on the beat for two more bars,
    // then the arms go back into him; otherwise they just go back in
    afterWin(dt) { this._wonT = (this._wonT ?? 0) + dt; const bW = C.beatOf(C.end) + this._wonT / P;
      const DM = TH.danceMoves || ARM_DANCES; AW.t = C.end + this._wonT; AW.beat = bW;
      AW.dance = ARMS.state() === 'dance' && this._wonT < 8 * P ? DM[Math.floor(bW / 8) % DM.length] : null; ARMS.update(AW); },
    potatoRect(s) {      // his screen box (uv) for the glitch pass
      const v = new T.Vector3(); let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      for (const [x, y] of [[s.x - 0.9, s.y - 0.2], [s.x + 0.9, s.y - 0.2], [s.x - 0.9, s.y + 1.7], [s.x + 0.9, s.y + 1.7]]) {
        v.set(x, y, 0).project(cam); const u = v.x * 0.5 + 0.5, w = v.y * 0.5 + 0.5; x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, w); y1 = Math.max(y1, w); }
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    },
  };
}
export { POWER_COLOR, POWER_GLYPH };

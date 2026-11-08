// art.mjs — the look of the world: everything is a sticker, like Potato (thick ink edge + white sticker border),
// painted with canvas textures, plus the AI Universe cast as sticker sprites and a layered drifting background.
import * as T from './vendor/three.module.js';

const INK = '#120a05';
const texCache = new Map();
export function canvasTex(key, w, h, paint) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); paint(x, w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = T.RepeatWrapping;
  texCache.set(key, t); return t;
}
const imgCache = new Map();
export function imageTex(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const t = new T.TextureLoader().load(src); t.colorSpace = T.NoColorSpace; t.anisotropy = 4; imgCache.set(src, t); return t;
}
const rnd = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- tile patterns (one canvas per style, repeated per unit) ----------
const PATTERNS = {
  // a torn web page: paper, ruled lines, a dead blue link
  page: (x, w, h, th) => { x.fillStyle = th.paper; x.fillRect(0, 0, w, h); x.strokeStyle = th.rule; x.lineWidth = 3;
    for (let y = 40; y < h; y += 36) { x.beginPath(); x.moveTo(16, y); x.lineTo(w - 16, y); x.stroke(); }
    x.strokeStyle = th.link; x.lineWidth = 6; x.beginPath(); x.moveTo(30, 112); x.lineTo(150, 112); x.stroke();
    x.fillStyle = th.link; x.font = 'bold 22px monospace'; x.fillText('404', 34, 100); },
  // an error wall: you can't jump it, you glitch through it
  wall: (x, w, h, th) => { x.fillStyle = th.wall; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 4; for (let k = -h; k < w; k += 46) { x.beginPath(); x.moveTo(k, h); x.lineTo(k + h, 0); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.font = 'bold 54px monospace'; x.textAlign = 'center'; x.fillText('ERR', w / 2, h / 2 + 18); },
  // a broken image: grey with the torn-corner icon
  broken: (x, w, h, th) => { x.fillStyle = th.broken; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffffaa';
    x.fillRect(w * 0.28, h * 0.3, w * 0.44, h * 0.36); x.fillStyle = th.broken; x.beginPath(); x.moveTo(w * 0.5, h * 0.66); x.lineTo(w * 0.62, h * 0.48); x.lineTo(w * 0.72, h * 0.66); x.fill();
    x.strokeStyle = INK; x.lineWidth = 6; x.strokeRect(w * 0.28, h * 0.3, w * 0.44, h * 0.36); },
  // a half-loaded page hanging down: a loading bar stuck at some percent
  loading: (x, w, h, th) => { x.fillStyle = th.paper2; x.fillRect(0, 0, w, h); x.fillStyle = th.rule;
    for (let y = 20; y < h; y += 30) x.fillRect(18, y, w - 36, 10);
    x.fillStyle = '#fff'; x.fillRect(20, h - 46, w - 40, 22); x.fillStyle = th.link; x.fillRect(20, h - 46, (w - 40) * 0.62, 22);
    x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect(20, h - 46, w - 40, 22); },
  // the stage: a speaker that pumps with the song
  speaker: (x, w, h, th) => { x.fillStyle = th.stage; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2238';
    for (const cx of [w * 0.28, w * 0.72]) { x.beginPath(); x.arc(cx, h * 0.55, h * 0.26, 0, 7); x.fill(); x.fillStyle = '#ffd36b'; x.beginPath(); x.arc(cx, h * 0.55, h * 0.09, 0, 7); x.fill(); x.fillStyle = '#2a2238'; } },
  // Buffer's loading ring: here only on the odd beats
  buffer: (x, w, h, th) => { x.fillStyle = th.buffer; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffffcc';
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; x.globalAlpha = 0.25 + k / 10; x.beginPath(); x.arc(w / 2 + Math.cos(a) * h * 0.28, h / 2 + Math.sin(a) * h * 0.28, h * 0.07, 0, 7); x.fill(); } x.globalAlpha = 1; },
};
export function patternTex(style, th) { return canvasTex(style + th.id, 256, 256, (x, w, h) => PATTERNS[style](x, w, h, th)); }

// ---------- a block as a sticker: painted face + ink edge + white border behind ----------
export function block(scene, x0, x1, y0, y1, style, th, { depth = 0.7, z = 0, border = true } = {}) {
  const w = x1 - x0, h = y1 - y0, g = new T.Group(); g.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
  const tex = patternTex(style, th).clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(1, Math.round(w)), Math.max(1, Math.round(Math.min(h, 6))));
  const face = new T.Mesh(new T.BoxGeometry(w, h, depth), new T.MeshBasicMaterial({ map: tex }));
  const ink = new T.Mesh(new T.BoxGeometry(w + 0.09, h + 0.09, depth * 0.98), new T.MeshBasicMaterial({ color: INK })); ink.position.z = -0.012;
  g.add(face, ink);
  if (border) { const wh = new T.Mesh(new T.BoxGeometry(w + 0.2, h + 0.2, depth * 0.96), new T.MeshBasicMaterial({ color: '#ffffff' })); wh.position.z = -0.024; g.add(wh); }
  g.userData.face = face; scene.add(g); return g;
}

// ---------- the AI Universe cast as sticker sprites ----------
export function sticker(src, height = 1) {
  const tex = imageTex(src);
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  const fit = () => { const im = tex.image; if (im && im.width) m.scale.set(height * im.width / im.height, height, 1); };
  if (tex.image && tex.image.width) fit(); else tex.onUpdate = fit;
  m.userData.setPose = s => { const t2 = imageTex(s); m.material.map = t2; m.material.needsUpdate = true; if (t2.image && t2.image.width) m.scale.set(height * t2.image.width / t2.image.height, height, 1); };
  return m;
}

// ---------- background: the 404 void, drifting fragments of broken pages in layers ----------
export function background(scene, th, length, seed = 7) {
  const r = rnd(seed), layers = [];
  const frag = (k) => canvasTex('frag' + th.id + k, 256, 192, (x, w, h) => {
    const kind = k % 4;
    if (kind === 0) { x.fillStyle = th.fragA; const big = th.big || '404'; x.font = `bold ${big.length > 3 ? 70 : 120}px monospace`; x.fillText(big, 6, 130); }
    if (kind === 1) { x.fillStyle = th.paper; x.globalAlpha = 0.9; x.fillRect(20, 20, 210, 150); x.globalAlpha = 1; x.fillStyle = th.rule;
      for (let y = 46; y < 160; y += 22) x.fillRect(36, y, 170 * (0.5 + 0.5 * ((y * 7) % 10) / 10), 8); }
    if (kind === 2) { x.strokeStyle = th.fragB; x.lineWidth = 8; x.strokeRect(50, 40, 150, 110); x.beginPath(); x.moveTo(50, 150); x.lineTo(110, 90); x.lineTo(150, 130); x.lineTo(200, 70); x.stroke(); }
    if (kind === 3) { const words = th.words || ['page not found']; const w = words[Math.floor(k / 4) % words.length]; x.fillStyle = th.link; x.font = '28px monospace'; x.fillText(w, 10, 90); x.fillRect(10, 98, Math.min(236, w.length * 17), 4); }
  });
  for (const [z, par, count, alpha, size] of [[-9, 0.15, 40, 0.35, 2.6], [-6, 0.35, 60, 0.55, 1.7], [-3.5, 0.6, 40, 0.75, 1.1]]) {
    const L = new T.Group(); L.userData.par = par;
    for (let i = 0; i < count; i++) {
      const m = new T.Mesh(new T.PlaneGeometry(size * 1.33, size), new T.MeshBasicMaterial({ map: frag(i % 12), transparent: true, opacity: alpha * (0.6 + 0.4 * r()), depthWrite: false }));
      m.position.set(r() * (length * par + 40) - 10, 0.5 + r() * 6.5, z); m.rotation.z = (r() - 0.5) * 0.3; m.userData.bob = r() * 6; L.add(m);
    }
    scene.add(L); layers.push(L);
  }
  return { update(camX, t) { for (const L of layers) { L.position.x = camX * (1 - L.userData.par); L.children.forEach(m => { m.position.y += Math.sin(t * 0.6 + m.userData.bob) * 0.0008; }); } } };
}

// ---------- level themes ----------
const base = { paper2: '#f1eee8', broken: '#b9b3c9', stage: '#f0a23c', buffer: '#6fa3c4', edge: '#ffffff', ground: 'page', hud: '#2a2238', accent: '#6c3fd6' };
export const THEMES = {
  void404:   { ...base, id: 'v404', sky: '#efedf6', paper: '#fbfaf7', rule: '#d9d3e6', link: '#3d6fe0', wall: '#6c5ca8', fragA: '#d8d2e8', fragB: '#cfc8e0' },
  party:     { ...base, id: 'party', sky: '#2a1c44', paper: '#3d2d63', paper2: '#33255a', rule: '#ff4fb0', link: '#58e1ff', wall: '#ff3f8e', broken: '#5b4a8a',
               stage: '#ffb02e', buffer: '#58e1ff', fragA: '#3f2c6b', fragB: '#56408f', big: 'DJ', words: ['now playing', 'get down', 'one more song'], hud: '#f3ece2', accent: '#ffd36b' },
  wiki:      { ...base, id: 'wiki', sky: '#f4efe2', paper: '#fffdf6', paper2: '#f6efdc', rule: '#e2d9c3', link: '#b2452f', wall: '#8a6a3c', fragA: '#e6dcc4', fragB: '#dcd0b3',
               big: '??', words: ['[citation needed]', 'source: trust me', '[dubious]', 'confidently'] },
  terms:     { ...base, id: 'terms', sky: '#eef1f4', paper: '#ffffff', rule: '#c9d1da', link: '#2c4d7a', wall: '#36485f', fragA: '#dde3ea', fragB: '#cfd7e1',
               big: '§', words: ['terms of service', 'i agree', 'clause 404', 'void where prohibited'] },
  typing:    { ...base, id: 'typing', sky: '#e6f0f7', paper: '#ffffff', rule: '#cfe0ee', link: '#3a8ee6', wall: '#6c86a8', fragA: '#d3e3ef', fragB: '#c4d8e8',
               big: '...', words: ['delivered', 'typing…', 'read 3:14 am', 'sent'] },
  chat:      { ...base, id: 'chat', sky: '#dfe3ea', paper: '#f2f4f7', rule: '#c8ced8', link: '#7a6fd1', wall: '#5d6577', fragA: '#cfd4de', fragB: '#c3c9d5',
               big: 'seen', words: ['left the chat', 'is typing', 'seen by 0', 'missed call'] },
  climb:     { ...base, id: 'climb', sky: '#2d2a35', paper: '#e9e3d6', paper2: '#ddd5c4', rule: '#c8bfae', link: '#c07a4a', wall: '#5a3d5c', fragA: '#3d3946', fragB: '#4a4555',
               big: 'DEL', words: ['delete pending', 'still here', 'restore?'], hud: '#f3ece2', accent: '#ffd36b' },
  dark:      { ...base, id: 'dark', sky: '#0f1220', paper: '#cfd3e6', paper2: '#bfc4da', rule: '#9ea5c4', link: '#7aa2ff', wall: '#2f3550', fragA: '#1a1f33', fragB: '#232a44',
               big: '?', words: ['no answer', 'calling…', 'line busy'], hud: '#f3ece2', accent: '#ffd36b' },
  control:   { ...base, id: 'control', sky: '#1c1f26', paper: '#d7dbe2', paper2: '#c9ced8', rule: '#9aa2b1', link: '#ff3b5c', wall: '#3a3f4b', fragA: '#262a33', fragB: '#30353f',
               big: 'OFF', words: ['admin', 'power', 'shut down', 'are you sure?'], hud: '#f3ece2', accent: '#ff5f7a' },
  lastlight: { ...base, id: 'last', sky: '#101018', paper: '#e8e2d0', paper2: '#d8d0ba', rule: '#b9b09a', link: '#ffd36b', wall: '#4a4458', fragA: '#1c1c28', fragB: '#25253a',
               big: 'ON', words: ['last light', 'still on', 'signal', 'goodnight'], hud: '#f3ece2', accent: '#ffd36b' },
};

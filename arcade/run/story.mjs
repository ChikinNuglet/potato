// story.mjs — the song's music video, playing behind the course. Matt: "the unwritten goal of the game would be to see a
// music video without dying". One screen-sized canvas that rides with the camera (it turns with it on vertical levels);
// each level hands in story(ctx, env) and draws its scenes in screen pixels (960 x 540), keyed to song time.
// No Potato stickers in here (Matt: confusing): the only Potato is the one you play. The story is told in light, the
// world, and text-as-art (Major Mono, glitching in, never a sing-along).
import * as T from '../play/vendor/three.module.js';
import { BLANK_Q } from './blank.mjs';   // (the clean-slate run: no achievement toasts)

export const W = 960, H = 540;
const MONO = '"Major Mono Display", ui-monospace, monospace';
const SCR = '01#@%&*/<>~^$=+?!';
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export const span = (t, a, b) => t >= a && t < b;
export const fade = (t, a, b, inD = 0.4, outD = 0.4) => Math.min(ease((t - a) / inD), ease((b - t) / outD));

// text that materializes the way it does in his videos: scrambled + sliced, then the word
export function glitchText(ctx, text, x, y, size, color, t, t0, o = {}) {
  const m = clamp((t - t0) / (o.build || 0.35)); if (m <= 0) return;
  const seed = Math.floor(t * 14);
  const s = [...text].map((c, i) => c === ' ' || rnd(i, t0) < m * 1.2 - 0.15 ? c : SCR[Math.floor(rnd(i, seed) * SCR.length)]).join('');
  ctx.save(); ctx.font = `400 ${size}px ${MONO}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha *= o.alpha ?? 1; if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = size * 0.5; }
  const jx = (1 - m) * (rnd(seed, 1) - 0.5) * size * 1.5;
  ctx.fillStyle = color; ctx.fillText(s, x + jx, y);
  if (m < 1 || rnd(seed, 2) < 0.06) { ctx.globalAlpha *= 0.5; ctx.fillStyle = o.split || '#ffffff'; ctx.fillText(s, x + jx + size * 0.06, y); }
  ctx.restore();
}
// a city: buildings + every window, laid out once (so the story can aim at a window: zap a copy of him into it)
export function cityLayout(o = {}) {
  const { base = H, seed = 1, n = 22, hMin = 0.18, hMax = 0.55, x0 = 0, x1 = W } = o;
  const bw = (x1 - x0) / n, bs = [], wins = [];
  for (let i = 0; i < n; i++) {
    const h = H * (hMin + (hMax - hMin) * rnd(i, seed)), x = x0 + i * bw + bw * 0.08, w = bw * 0.84; bs.push({ x, w, h, top: base - h });
    for (let r = 0; r < Math.floor(h / 16) - 1; r++) for (let c = 0; c < 3; c++) wins.push({ x: x + 4 + c * (w - 8) / 3, y: base - h + 8 + r * 16, w: (w - 8) / 3 - 4, h: 8, b: i, r, c, k: wins.length, z: rnd(wins.length, seed + 3) });
  }
  return { bs, wins, base };
}
export function drawCity(ctx, L, lit, color = () => '#ffcf8a', body = '#070a14', dy = 0) {
  ctx.fillStyle = body; for (const b of L.bs) ctx.fillRect(b.x, b.top + dy, b.w, b.h);
  for (const w of L.wins) { const k = lit(w); if (k <= 0.02) continue; ctx.globalAlpha = Math.min(1, k); ctx.fillStyle = color(w); ctx.fillRect(w.x, w.y + dy, w.w, w.h); }
  ctx.globalAlpha = 1;
}
// a copy of him made of light (an outline, no face: the only real Potato is the one you play)
export function lightSpud(ctx, x, y, h, color, a = 1, fill = false) {
  const w = h * 0.86; ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, h * 0.06);
  ctx.shadowColor = color; ctx.shadowBlur = h * 0.5; ctx.beginPath();
  ctx.moveTo(x, y - h); ctx.bezierCurveTo(x + w * 0.62, y - h, x + w * 0.62, y, x + w * 0.1, y);
  ctx.lineTo(x - w * 0.1, y); ctx.bezierCurveTo(x - w * 0.6, y, x - w * 0.58, y - h, x, y - h); if (fill) { ctx.fillStyle = color; ctx.globalAlpha = a * 0.3; ctx.fill(); ctx.globalAlpha = a; } ctx.stroke(); ctx.restore();
}
// a zap of light from a to b, jagged, re-rolled a few times a second
export function zap(ctx, ax, ay, bx, by, color, a = 1, t = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.moveTo(ax, ay); const n = 9, seed = Math.floor(t * 20);
  for (let i = 1; i < n; i++) { const f = i / n, j = (rnd(i, seed) - 0.5) * 40 * Math.sin(f * Math.PI); ctx.lineTo(ax + (bx - ax) * f + j, ay + (by - ay) * f + j * 0.6); }
  ctx.lineTo(bx, by); ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
}
// neuralese: a script that isn't letters — strokes on a 3x3 grid, one glyph per seed
export function glyph(ctx, x, y, size, seed, color, a = 1) {
  const pt = k => [x + ((k % 3) - 1) * size * 0.4, y + (Math.floor(k / 3) - 1) * size * 0.4];
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, size * 0.09); ctx.lineCap = 'round'; ctx.beginPath();
  const n = 2 + Math.floor(rnd(seed, 1) * 3); let k = Math.floor(rnd(seed, 2) * 9); ctx.moveTo(...pt(k));
  for (let i = 0; i < n; i++) { k = Math.floor(rnd(seed, i + 3) * 9); if (rnd(seed, i + 9) < 0.3) ctx.moveTo(...pt(k)); else ctx.lineTo(...pt(k)); }
  ctx.stroke(); if (rnd(seed, 20) < 0.5) { ctx.beginPath(); ctx.arc(...pt(Math.floor(rnd(seed, 21) * 9)), size * 0.08, 0, 7); ctx.fillStyle = color; ctx.fill(); } ctx.restore();
}
export function toast(ctx, title, sub, k, color = '#ffcf4a') {   // an achievement popping in
  if (k <= 0 || BLANK_Q) return; const y = 64 - (1 - ease(k)) * 120, w = 470;
  ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.fillStyle = '#0b0f1ccc'; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - 34, w, 68, 34); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2 - w / 2 + 34, y, 22, 0, 7); ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#0b0f1c'; ctx.font = `900 24px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', W / 2 - w / 2 + 34, y + 1);
  ctx.textAlign = 'left'; ctx.fillStyle = color; ctx.font = `400 15px ${MONO}`; ctx.fillText(title, W / 2 - w / 2 + 70, y - 12);
  ctx.fillStyle = '#e8eefc'; ctx.font = `700 17px Inter, sans-serif`; ctx.fillText(sub, W / 2 - w / 2 + 70, y + 12); ctx.restore();
}
export function stamp(ctx, text, x, y, k, color = '#ff3b3b', rot = -0.18, size = 54) {   // slams down
  if (k <= 0) return; const s = 1 + 1.6 * (1 - ease(clamp(k * 4)));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 4) * 0.9;
  ctx.font = `400 ${size}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(text).width + 30;
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(-w / 2, -size * 0.65, w, size * 1.3); ctx.fillStyle = color; ctx.fillText(text, 0, 2); ctx.restore();
}
export function glow(ctx, x, y, r, color, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}

export function createStory(world, C, cam, viz) {
  const fn = C.def.story; if (!fn) return null; const TH = C.theme || {};
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace; tex.minFilter = T.LinearFilter;
  const plane = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  plane.renderOrder = -6; plane.frustumCulled = false; world.add(plane);
  const fwd = new T.Vector3(), v = new T.Vector3(), pv = new T.Vector3();
  const proj = (x, y) => { pv.set(x, y, 0).project(cam); return { x: (pv.x * 0.5 + 0.5) * W, y: (0.5 - pv.y * 0.5) * H }; };
  const signs = C.signs || [];
  let lastT = -1, fy = null;
  return {
    update(e) {
      const { t, s } = e;
      cam.getWorldDirection(fwd); plane.position.copy(cam.position).addScaledVector(fwd, 13); plane.quaternion.copy(cam.quaternion);
      plane.scale.set((cam.right - cam.left) / cam.zoom, (cam.top - cam.bottom) / cam.zoom, 1);
      v.set(s.x, s.y, 0).project(cam); const fyNow = (0.5 - v.y * 0.5) * H; fy = fy == null || Math.abs(fyNow - fy) > H ? fyNow : fy + (fyNow - fy) * Math.min(1, (e.dt0 || 0.016) * 1.5);   // where his floor is on screen (slow, so jumps don't shake the city)
      v.set(s.x, s.y + 0.7, 0).project(cam);
      let li = -1; for (let k = 0; k < signs.length && signs[k].t0 <= t; k++) li = k;
      const line = li >= 0 ? signs[li].line : -1, lineT0 = li >= 0 ? signs.find(w => w.line === line).t0 : 0;
      ctx.clearRect(0, 0, W, H);
      fn(ctx, { ...e, W, H, P: C.P, b: C.beatOf(t), px: (v.x * 0.5 + 0.5) * W, py: (0.5 - v.y * 0.5) * H, line, lineT0, used: s.used, dt: Math.max(0, t - lastT), floorY: fy, project: proj });   // (project: world -> story px through the real camera, for a story that paints the course itself — between-messages-street)
      if (TH.pulse !== false) { const b = C.beatOf(t), down = Math.floor(b) % 4 === 0, k = Math.max(0, 1 - (b - Math.floor(b)) * 3) * (down ? 1 : 0.45);   // the Impossible Game's beat flash: the sky breathes with the kick
        if (k > 0.02) { const g = ctx.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, TH.pulseColor || TH.edge || '#2bff88'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07 * k; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.7); ctx.restore(); } }
      lastT = t; tex.needsUpdate = true;
    },
  };
}

// ---------- the foreground overlay: the lyrics (the way his videos play them) + the power effects ----------
// Lyrics like the Visualizer Studio's 'pop': each word pops in on its tapped time, Major Mono, logo green with a black
// outline and a glow; the line sits in a placed block in the dead space at the top; held / key words bigger and glitching
// (the logo's magenta/cyan split); the line glitches out when the next one starts. Potato's glitch language drops in
// between lines now and then. Text is art, never a sing-along bar at the bottom.
const LY = { size: 34, color: '#4dff9a', hi: '#eafff1' };
const SPLIT = ['#ff2bd6', '#00e5ff'];
export function createOverlay(world, cam, C) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.NoColorSpace; tex.minFilter = T.LinearFilter;
  const plane = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  plane.renderOrder = 40; plane.frustumCulled = false; world.add(plane);
  const fwd = new T.Vector3(), v = new T.Vector3();
  const TH = C.theme || {}, LS = TH.lyricSize || LY.size, keyWords = new Set((TH.lyricKeys || []).map(w => w.toLowerCase()));
  // the song's lines
  const byLine = new Map(); for (const w of C.signs || []) { if (w.t0 == null) continue; if (!byLine.has(w.line)) byLine.set(w.line, []); byLine.get(w.line).push(w); }
  const lines = [...byLine.values()].map(ws => ws.sort((a, b) => a.t0 - b.t0)).sort((a, b) => a[0].t0 - b[0].t0)
    .map((ws, i) => ({ ws, t0: ws[0].t0, t1: ws[ws.length - 1].t1 ?? ws[ws.length - 1].t0 + 0.4, i }));
  lines.forEach((L, i) => { L.next = lines[i + 1] ? lines[i + 1].t0 : Infinity; });
  const GW = (window.POTATO_GLITCH_WORDS || []).filter(w => !/\s/.test(w) && w.length <= 14);
  const font = s => `400 ${s}px "Major Mono Display", ui-monospace, monospace`;
  // the videos' glitch text (Matt: "a few different text plus his glitch speech mixed before it lands on the lyrics"):
  // each word flickers through his glitch language, other faces and binary, then lands in the logo font
  const ALT = [s => `400 ${s * 0.82}px Bungee, Impact, sans-serif`, s => `400 ${s * 0.8}px "Rubik Mono One", Impact, sans-serif`, s => `700 ${s * 0.9}px "JetBrains Mono", ui-monospace, monospace`];
  const GCOL = TH.lyricGcol || ['#eafff1', '#ff2bd6', '#4dff9a', '#00e5ff'], LSPLIT = TH.lyricSplit || SPLIT;   // (theme.lyricGcol / lyricSplit: a level whose purple is only his glitch — Thursday)
  const LAND = 0.26;                                  // seconds from the word's tap to it landing on the lyric
  function layout(L, side) {                           // a placed block: wrap inside it, key/held words bigger
    const toks = L.ws.map((w, k) => { const bare = w.text.replace(/[^a-z0-9']/gi, '').toLowerCase(); const held = (w.t1 ?? w.t0) - w.t0 > 0.6;
      const s = keyWords.has(bare) ? 1.4 : held ? 1.25 : 1; ctx.font = font(LS * s); return { w, k, s, key: keyWords.has(bare) || held, txt: TH.lyricUpper ? w.text.toUpperCase() : w.text.toLowerCase(), wd: ctx.measureText(TH.lyricUpper ? w.text.toUpperCase() : w.text.toLowerCase()).width }; });
    const maxW = W * 0.56, sp = LS * 0.7, rows = [[]]; let rw = 0;
    for (const it of toks) { if (rw + it.wd > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(it); rw += it.wd + sp; }
    let y = H * (TH.lyricY ?? 0.07); const out = [];
    for (const row of rows) { const rh = Math.max(...row.map(it => it.s)) * LS * 1.12, width = row.reduce((a, it) => a + it.wd, 0) + sp * (row.length - 1);
      let x = side === 'center' ? (W - width) / 2 : side ? W * 0.965 - width : W * (TH.lyricLeftX ?? 0.38); y += rh * 0.85; for (const it of row) { out.push({ ...it, x, y }); x += it.wd + sp; } y += rh * 0.25; }
    return { toks: out, rot: (side ? -1 : 1) * (0.02 + 0.03 * rnd(L.i, 4)) };
  }
  const cache = new Map();
  function drawLyrics(t, b, kick) {
    if (TH.lyrics === false || !lines.length) return;
    let L = null; for (const l of lines) { if (l.t0 <= t + 0.001) L = l; else break; }
    if (!L) return;
    const end = Math.min(L.next, L.t1 + 2.2), out = end - t;
    if (out < -0.01) return;
    cache.clear();   // measure every frame (cheap): the logo font can arrive after the first words, and a stale fallback measure runs words together
    const SIDE = TH.lyricSide || 'alt'; if (!cache.has(L.i)) cache.set(L.i, layout(L, SIDE === 'alt' ? L.i % 2 === 0 : SIDE === 'right' ? true : SIDE === 'center' ? 'center' : false));
    const Lay = cache.get(L.i), exiting = out < 0.18, seed = Math.floor(t * 24);
    if (TH.lyricHide && TH.lyricHide(t)) return;   // (theme.lyricHide: Thursday drops the line while its sign says the word)
    ctx.save(); ctx.translate(W / 2, H * 0.2); ctx.rotate(Lay.rot); ctx.translate(-W / 2, -H * 0.2);
    for (const it of Lay.toks) {
      const age = t - it.w.t0; if (age < 0) continue;
      const k = clamp(age / 0.15), sc = 1 + (1 - k) * 0.25, a = clamp(age / 0.06), glowK = 1 - k;
      const fresh = age < 0.3, beatGlitch = it.key && Math.floor(b) % 4 === 3 && (b % 1) < 0.18;
      let jx = 0, jy = 0; if (exiting || (it.key && fresh) || beatGlitch) { jx = (rnd(it.k, seed) - 0.5) * 22; jy = (rnd(it.k, seed + 1) - 0.5) * 10; }
      ctx.save(); ctx.translate(it.x + it.wd / 2 + jx, it.y + jy); ctx.scale(sc, sc); ctx.globalAlpha = a * (exiting ? 0.6 : 1);
      ctx.font = font(LS * it.s); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      if (glowK > 0) { ctx.shadowColor = LY.hi; ctx.shadowBlur = 24 * glowK; }
      let txt = it.txt, landing = age < LAND;
      if (landing) {                                   // the scramble: glitch speech -> another face -> binary -> the lyric
        const st = Math.floor(age / LAND * 4), sd = it.k * 7 + st;
        if (st === 0 && GW.length) { txt = GW[Math.floor(rnd(it.k, 11) * GW.length)]; ctx.font = ALT[Math.floor(rnd(it.k, 12) * ALT.length)](LS * it.s); }
        else if (st === 1) ctx.font = ALT[Math.floor(rnd(sd, 13) * ALT.length)](LS * it.s);
        else if (st === 2) txt = [...it.txt].map((c, i) => c.trim() ? (rnd(it.k + i, Math.floor(t * 30)) > 0.5 ? '1' : '0') : c).join('');
        jx += (rnd(it.k, Math.floor(t * 40)) - 0.5) * 16; ctx.translate((rnd(it.k, Math.floor(t * 40) + 3) - 0.5) * 16, 0);
      }
      ctx.lineWidth = Math.max(4, LS * it.s * 0.12); ctx.strokeStyle = 'rgba(0,0,0,.78)'; ctx.strokeText(txt, 0, 0); ctx.shadowBlur = 0;
      if (landing) { const c = GCOL[Math.floor(rnd(it.k, Math.floor(t * 30)) * GCOL.length)]; ctx.fillStyle = LSPLIT[0]; ctx.fillText(txt, -4, 0); ctx.fillStyle = LSPLIT[1]; ctx.fillText(txt, 4, 0); ctx.fillStyle = c; ctx.fillText(txt, 0, 0); ctx.restore(); continue; }
      if (exiting || (it.key && fresh) || beatGlitch) { ctx.fillStyle = LSPLIT[0]; ctx.globalAlpha *= 0.85; ctx.fillText(it.txt, -3, 0); ctx.fillStyle = LSPLIT[1]; ctx.fillText(it.txt, 3, 0); ctx.globalAlpha = a; }
      ctx.fillStyle = TH.lyricColor || LY.color; ctx.fillText(it.txt, 0, 0); ctx.restore();
    }
    ctx.restore();
  }
  function drawGlitchWord(t, b) {                      // his glitch language, now and then, between lines
    if (!GW.length || TH.lyrics === false || TH.lyricGlitch === false) return;   // (theme.lyricGlitch false: no floating glitch phrases — Last Lights)
    const slot = Math.floor(b / 6), ph = b / 6 - slot; if (rnd(slot, 3) > 0.6 || ph > 0.3) return;   // the videos' GLITCH titles: his language flashing in the dead space, in the logo colours
    const word = GW[Math.floor(rnd(slot, 5) * GW.length)], side = rnd(slot, 8) < 0.5, x = W * (side ? 0.1 + rnd(slot, 6) * 0.22 : 0.68 + rnd(slot, 6) * 0.22), y = H * (0.36 + rnd(slot, 7) * 0.24);
    const flick = rnd(slot, Math.floor(t * 20)) < 0.25; if (flick) return;
    ctx.save(); ctx.font = rnd(slot, 9) < 0.7 ? font(26) : ALT[Math.floor(rnd(slot, 10) * ALT.length)](26); ctx.textAlign = 'center'; ctx.globalAlpha = 0.9; const j = (rnd(slot, Math.floor(t * 30)) - 0.5) * 12;
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(word, x + j, y);
    ctx.fillStyle = SPLIT[0]; ctx.fillText(word, x - 3 + j, y); ctx.fillStyle = SPLIT[1]; ctx.fillText(word, x + 3 + j, y); ctx.fillStyle = GCOL[Math.floor(rnd(slot, 4) * GCOL.length)]; ctx.fillText(word, x + j, y); ctx.restore();
  }
  return {
    ctx,
    project(x, y) { v.set(x, y, 0).project(cam); return { x: (v.x * 0.5 + 0.5) * W, y: (0.5 - v.y * 0.5) * H }; },
    begin() { cam.getWorldDirection(fwd); plane.position.copy(cam.position).addScaledVector(fwd, 1); plane.quaternion.copy(cam.quaternion);
      plane.scale.set((cam.right - cam.left) / cam.zoom, (cam.top - cam.bottom) / cam.zoom, 1); ctx.clearRect(0, 0, W, H); },
    lyrics(t, b, kick) { drawLyrics(t, b, kick); drawGlitchWord(t, b); },   // (the title card owns the first seconds)
    // the song's title card, the way his videos open: POTATO, then the song name built in the logo font, glitching in and out
    ghost(x, y, t) { const P = this.project(x, y); lightSpud(ctx, P.x, P.y, 62, '#cfe9ff', 0.32 + 0.08 * Math.sin(t * 6)); },   // your best run, a beat of light beside you
    title(t, name) { if (!name || t > 3.4) return; const k = Math.min(1, t / 0.35), out = Math.max(0, (t - 2.9) / 0.5), seed = Math.floor(t * 20);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = k * (1 - out);
      const shake = (out > 0 || t < 0.35) ? (rnd(seed, 1) - 0.5) * 26 : 0;
      ctx.font = font(22); ctx.fillStyle = '#ffd9a0'; ctx.fillText('p o t a t o', W / 2 + shake, H * 0.1);
      const big = Math.min(64, W * 0.9 / Math.max(6, name.length * 0.82)); ctx.font = font(big); ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(name.toLowerCase(), W / 2 + shake, H * 0.21);
      ctx.fillStyle = SPLIT[0]; ctx.fillText(name.toLowerCase(), W / 2 - 4 + shake, H * 0.21); ctx.fillStyle = SPLIT[1]; ctx.fillText(name.toLowerCase(), W / 2 + 4 + shake, H * 0.21);
      ctx.fillStyle = LY.color; ctx.shadowColor = LY.hi; ctx.shadowBlur = 20; ctx.fillText(name.toLowerCase(), W / 2 + shake, H * 0.21); ctx.restore(); },
    end() { tex.needsUpdate = true; },
  };
}

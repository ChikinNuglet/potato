// shootfx.mjs — Confidently Incorrect's shooter feel (round 20, Matt: "Does it feel like potato is flying around and blowing
// stuff up. Is the sound right? Do things actually 'feel' like they are getting hit and exploding … potatos bullets should look
// like his glitching … can we put potato in a little spaceship for this one? In costume, in a tiny spaceship").
//   makeSpudShip(T, pivot)       his tiny ship, drawn in the house style (thick ink, flat fills, one cel band), riding his pivot
//                                in his own scene, so he sits IN it: the hull in front of him, the cockpit's back wall behind
//   glitchBoltTex(T)             his bolts: glitch-sliced purple shards with a green binary fleck (his glitch, thrown)
//   drawFx(ctx, project, s, t, o) every hit / kill / boss crack / boss death / glitch pulse the rules logged in s.fx: sparks,
//                                cartoon fireballs, inked debris, smoke puffs — all a pure function of the time since it happened
//   fxShake(s, t), hitStop(s, t) the screen shake and the boss hit-stop the same events ask for
const INK = '#120a05';
const R = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- his tiny ship ----------
// local units = his pivot's (feet at 0, he's ~1.3 tall, ~±0.5 wide); the hull covers him up to the waist
export function makeSpudShip(T, pivot, o = {}) {
  const SC = o.scale ?? 0.85, X0 = -1.15, X1 = 1.45, Y0 = -0.5, Y1 = 0.88, PX = 260, CW = Math.round((X1 - X0) * PX), CH = Math.round((Y1 - Y0) * PX);
  const X = u => (u - X0) * PX, Y = v => (Y1 - v) * PX;
  const mk = draw => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; draw(x); const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; t.anisotropy = 4; return t; };
  const CREAM = '#f2e4c4', BAND = '#d6bf93', RED = '#d9483b', RED2 = '#ad3529', LW = 10;
  const hull = x => { x.beginPath(); x.moveTo(X(-1.0), Y(0.34));
    x.bezierCurveTo(X(-0.86), Y(0.48), X(-0.72), Y(0.54), X(-0.6), Y(0.5));        // up to the cockpit's back rim
    x.bezierCurveTo(X(-0.4), Y(0.4), X(0.3), Y(0.38), X(0.5), Y(0.44));            // the front rim dips across the cockpit: he shows from the waist up
    x.bezierCurveTo(X(0.9), Y(0.5), X(1.3), Y(0.36), X(1.42), Y(0.14));            // the nose
    x.bezierCurveTo(X(1.46), Y(0.02), X(1.2), Y(-0.2), X(0.85), Y(-0.23));
    x.bezierCurveTo(X(0.3), Y(-0.27), X(-0.4), Y(-0.27), X(-0.7), Y(-0.2));
    x.bezierCurveTo(X(-0.88), Y(-0.16), X(-0.98), Y(-0.08), X(-1.0), Y(0.0)); x.closePath(); };
  const front = mk(x => {
    // fins (behind the hull): the tail fin up top, a keel fin below
    for (const f of [[[-0.98, 0.3], [-1.12, 0.78], [-0.92, 0.8], [-0.6, 0.46]], [[-0.84, -0.12], [-1.06, -0.42], [-0.88, -0.44], [-0.42, -0.22]]]) {
      x.beginPath(); f.forEach(([u, v], i) => i ? x.lineTo(X(u), Y(v)) : x.moveTo(X(u), Y(v))); x.closePath(); x.fillStyle = RED; x.fill();
      x.save(); x.clip(); x.fillStyle = RED2; x.fillRect(X(-1.2), Y(f[0][1] > 0 ? 0.56 : -0.3), PX, PX * 0.4); x.restore(); x.lineWidth = LW * 0.8; x.strokeStyle = INK; x.stroke(); }
    // the exhaust bell
    x.beginPath(); x.moveTo(X(-0.98), Y(0.28)); x.lineTo(X(-1.13), Y(0.33)); x.lineTo(X(-1.13), Y(-0.03)); x.lineTo(X(-0.98), Y(0.03)); x.closePath(); x.fillStyle = '#5d616e'; x.fill(); x.lineWidth = LW * 0.7; x.strokeStyle = INK; x.stroke();
    // the hull: cream, one cel band along the bottom, a red racing stripe, a red nose cap, rivets
    hull(x); x.fillStyle = CREAM; x.fill();
    x.save(); hull(x); x.clip();
    x.fillStyle = BAND; x.beginPath(); x.moveTo(X(-1.2), Y(0.02)); x.bezierCurveTo(X(-0.3), Y(-0.08), X(0.6), Y(-0.06), X(1.5), Y(0.04)); x.lineTo(X(1.5), Y(-0.5)); x.lineTo(X(-1.2), Y(-0.5)); x.closePath(); x.fill();
    x.fillStyle = RED; x.beginPath(); x.moveTo(X(-1.2), Y(0.22)); x.bezierCurveTo(X(-0.2), Y(0.16), X(0.6), Y(0.16), X(1.5), Y(0.24)); x.lineTo(X(1.5), Y(0.12)); x.bezierCurveTo(X(0.6), Y(0.05), X(-0.2), Y(0.05), X(-1.2), Y(0.11)); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(X(1.52), Y(0.07), 0.3 * PX, 0.4 * PX, 0, 0, 7); x.fill();    // the nose cap
    x.lineWidth = LW * 0.55; x.strokeStyle = INK; x.beginPath(); x.ellipse(X(1.52), Y(0.07), 0.3 * PX, 0.4 * PX, 0, 0, 7); x.stroke();
    x.fillStyle = '#9c8a64'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(X(-0.75 + i * 0.3), Y(-0.13 - 0.01 * Math.sin(i)), 5, 0, 7); x.fill(); }
    x.restore();
    hull(x); x.lineWidth = LW; x.strokeStyle = INK; x.stroke();
    // the windshield: a little curved pane just in front of him (see-through, a glint)
    x.beginPath(); x.moveTo(X(0.46), Y(0.44)); x.bezierCurveTo(X(0.5), Y(0.66), X(0.62), Y(0.8), X(0.72), Y(0.8)); x.bezierCurveTo(X(0.84), Y(0.72), X(0.9), Y(0.58), X(0.9), Y(0.48)); x.closePath();
    x.fillStyle = 'rgba(150,226,236,.42)'; x.fill(); x.lineWidth = LW * 0.6; x.strokeStyle = INK; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 6; x.beginPath(); x.moveTo(X(0.6), Y(0.52)); x.quadraticCurveTo(X(0.64), Y(0.68), X(0.72), Y(0.73)); x.stroke();
    // the glitch light's socket on the nose
    x.beginPath(); x.arc(X(1.02), Y(0.31), 13, 0, 7); x.fillStyle = '#2b2f36'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); });
  const back = mk(x => {   // the cockpit's back wall: the tub he sits in, seen over the front rim either side of him
    x.beginPath(); x.moveTo(X(-0.66), Y(0.46)); x.bezierCurveTo(X(-0.5), Y(0.66), X(0.4), Y(0.66), X(0.56), Y(0.48)); x.lineTo(X(0.56), Y(0.2)); x.lineTo(X(-0.66), Y(0.2)); x.closePath();
    x.fillStyle = '#e4d3ac'; x.fill(); x.lineWidth = LW; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.moveTo(X(-0.56), Y(0.44)); x.bezierCurveTo(X(-0.4), Y(0.58), X(0.32), Y(0.58), X(0.48), Y(0.45)); x.lineTo(X(0.48), Y(0.2)); x.lineTo(X(-0.56), Y(0.2)); x.closePath();
    x.fillStyle = '#4a2f24'; x.fill(); });
  // round 21: his hull takes 3 hits — each one an inked crack across the cream (two crack sheets: one hit, two hits)
  const crackT = n => mk(x => { x.save(); hull(x); x.clip(); x.lineJoin = 'miter';
    const runs = n === 1 ? [[[0.15, 0.4], [0.24, 0.22], [0.12, 0.1], [0.27, -0.06], [0.2, -0.2]]] : [[[-0.45, 0.42], [-0.36, 0.25], [-0.5, 0.12], [-0.34, -0.02], [-0.42, -0.18]], [[1.0, 0.4], [0.9, 0.24], [1.04, 0.12], [0.94, -0.04]]];
    for (const r of runs) { x.beginPath(); r.forEach(([u, v], i) => i ? x.lineTo(X(u), Y(v)) : x.moveTo(X(u), Y(v))); x.lineWidth = LW * 0.9; x.strokeStyle = INK; x.stroke();
      for (let i = 1; i < r.length - 1; i += 2) { const [u, v] = r[i]; x.beginPath(); x.moveTo(X(u), Y(v)); x.lineTo(X(u + 0.09), Y(v + 0.05)); x.lineWidth = LW * 0.5; x.stroke(); } }
    x.restore(); });
  const g = new T.Group(); g.name = 'ci-spud-ship'; g.scale.setScalar(SC);
  const plane = (tex, z) => { const m = new T.Mesh(new T.PlaneGeometry(X1 - X0, Y1 - Y0), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); m.position.set((X0 + X1) / 2, (Y0 + Y1) / 2, z); m.frustumCulled = false; g.add(m); return m; };
  const bk = plane(back, -0.95), fr = plane(front, 0.95); bk.renderOrder = -1; fr.renderOrder = 5;
  const cr = [crackT(1), crackT(2)].map(tex => { const m = plane(tex, 0.96); m.renderOrder = 5; m.visible = false; return m; });
  const light = new T.Mesh(new T.CircleGeometry(0.035, 16), new T.MeshBasicMaterial({ color: '#c9a7ff', transparent: true })); light.position.set(1.02, 0.31, 0.97); g.add(light); light.renderOrder = 6;   // (his glitch light: lilac — purple is his)
  for (const old of pivot.children.filter(c => c.name === 'ci-spud-ship')) pivot.remove(old);   // (one ship: a level reload replaces it)
  pivot.add(g); g.visible = false;
  let drawnAt = -1;
  // when this level isn't the one drawing (the kitchen, another level), the ship is gone — it lives on his pivot, so it checks
  for (const m of [bk, fr, light]) m.onBeforeRender = () => { if (performance.now() - drawnAt > 200) g.visible = false; };
  const mats = [bk.material, fr.material, light.material, ...cr.map(m => m.material)];
  return {
    g, scale: SC, nose: 1.42 * SC, tail: -1.13 * SC,
    hide() { g.visible = false; drawnAt = -1e9; },
    // k: 0..1 how materialized (it glitches in round him); ready: the glitch light; hull: hits left (3 = whole); ha: time since a hit
    update(on, k, ready, t, hull = 3, ha = 9) { drawnAt = performance.now(); g.visible = on && k > 0;
      if (!g.visible) return; const flick = k < 1 && R(Math.floor(t * 30), 7) < 0.45;
      for (const m of mats) m.opacity = flick ? 0.25 : 1; g.scale.set(SC * (k < 1 ? 0.6 + 0.4 * k : 1), SC * (k < 1 ? 1.4 - 0.4 * k : 1), SC);
      cr[0].visible = hull <= 2; cr[1].visible = hull <= 1;
      const hk = ha >= 0 && ha < 0.25 ? 1 - ha / 0.25 : 0; fr.material.color.setRGB(1 + 0.8 * hk, 1 + 0.8 * hk - (hull <= 1 ? 0.06 * (1 + Math.sin(t * 9)) : 0), 1 + 0.8 * hk);   // a hit: the hull flashes white; one hit left: it throbs
      light.material.color.set(ready ? '#c9a7ff' : '#3a2a55'); light.scale.setScalar(ready ? 1 + 0.25 * Math.sin(t * 10) : 0.8); },
  };
}

// ---------- his bolts: glitch-sliced purple shards (a green 1 or 0 in one), stepped like his glitch ----------
export function glitchBoltTex(T, n = 4) {
  const out = []; for (let v = 0; v < n; v++) { const c = document.createElement('canvas'); c.width = 160; c.height = 56; const x = c.getContext('2d');
    const rows = 5, hh = 56 / rows; for (let r = 0; r < rows; r++) { const off = (R(v, r) - 0.5) * 34, len = 70 + 70 * R(v, r + 9) * (1 - Math.abs(r - 2) / 3), x0 = 150 - len + off;
      x.fillStyle = '#2a0f63'; x.fillRect(x0 - 3, r * hh + 1, len + 6, hh - 1);   // a deep edge so it reads on any light backdrop
      x.fillStyle = r === 2 ? '#e7d8ff' : r % 2 ? '#9a52ff' : (R(v, r + 3) < 0.5 ? '#e03ccf' : '#7b3cf2'); x.fillRect(x0, r * hh + 3, len, hh - 5);
      if (r === 2) { x.fillStyle = '#c9a7ff'; x.fillRect(x0 - 14, r * hh + 4, 10, hh - 7); } }
    if (v % 2 === 0) { x.fillStyle = '#f4eaff'; x.font = '700 22px ui-monospace, monospace'; x.textBaseline = 'middle'; x.fillText(v % 4 ? '0' : '1', 40 + 30 * R(v, 30), 18 + 20 * R(v, 31)); }   // the binary fleck
    const t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; out.push(t); }
  return out;
}

// ---------- the events: sparks, fireballs, debris, smoke ----------
const ROCK = ['#8a7a6a', '#5b4d42', '#b3a08a', '#6e6052'], PAPER = ['#f4efe2', '#e6dcc4', '#ffd98a', '#9fd0e8'];
function star(ctx, x, y, r0, r1, n, rot, fill, ink) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r1 : r0; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (ink) { ctx.lineWidth = ink; ctx.strokeStyle = INK; ctx.stroke(); } }
function chunk(ctx, x, y, sz, rot, col, seed) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283, r = sz * (0.6 + 0.4 * R(seed, i)); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.8); } ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = Math.max(1.5, sz * 0.22); ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
function sparks(ctx, x, y, n, len, k, seed, col, dir = null) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = dir != null ? dir + (R(seed, i) - 0.5) * 2.2 : R(seed, i) * 6.283, d0 = len * (0.2 + 1.4 * k) * (0.6 + 0.6 * R(seed, i + 20)), d1 = d0 + len * 0.7 * (1 - k);
    ctx.globalAlpha = 1 - k; ctx.lineWidth = 3 * (1 - k) + 1; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d0, y + Math.sin(a) * d0); ctx.lineTo(x + Math.cos(a) * d1, y + Math.sin(a) * d1); ctx.stroke(); } ctx.restore(); }
function boom(ctx, x, y, a, size, seed, pal) {   // a cartoon explosion: white pop -> inked fireball star -> debris -> inked smoke puffs
  const S = size;
  if (a < 0.07) { ctx.save(); ctx.globalAlpha = 1 - a / 0.07; star(ctx, x, y, 58 * S, 30 * S, 8, R(seed, 1), '#ffffff'); ctx.restore(); }
  if (a < 0.34) { const k = a / 0.34, g = 0.55 + 0.75 * Math.sqrt(k); ctx.save(); ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    star(ctx, x, y, 52 * S * g, 30 * S * g, 9, R(seed, 2) + k * 0.6, '#ff8a2a', 3.5); star(ctx, x, y, 32 * S * g, 18 * S * g, 7, R(seed, 3) - k * 0.5, '#ffe14d'); ctx.restore(); }
  for (let i = 0; i < 5; i++) { const d0 = 0.12 + 0.05 * i; if (a < d0) continue; const k = Math.min(1, (a - d0) / 0.75); if (k >= 1) continue;   // smoke puffs: drift up, swell, fade
    const ang = R(seed, 40 + i) * 6.283, r = (14 + 10 * R(seed, 50 + i)) * S * (0.7 + 0.8 * k);
    ctx.save(); ctx.globalAlpha = 0.85 * (1 - k); ctx.fillStyle = i % 2 ? '#5a5048' : '#6e6359'; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * 30 * S * (0.4 + k), y + Math.sin(ang) * 18 * S - 40 * S * k, r, 0, 7); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
  const n = Math.round(10 * S + 2); for (let i = 0; i < n; i++) { if (a > 0.95) break; const ang = R(seed, 60 + i) * 6.283, v = (220 + 360 * R(seed, 80 + i)) * S, dx = Math.cos(ang) * v * a, dy = Math.sin(ang) * v * a * 0.8 + 700 * a * a;   // inked debris, thrown out and falling
    ctx.globalAlpha = Math.min(1, (0.95 - a) / 0.25); chunk(ctx, x + dx, y + dy, (5 + 8 * R(seed, 100 + i)) * Math.sqrt(S), a * (R(seed, 120 + i) - 0.5) * 20, pal[i % pal.length], seed + i); }
  ctx.globalAlpha = 1;
  if (a < 0.4) { const k = a / 0.4; ctx.save(); ctx.globalAlpha = 0.7 * (1 - k); ctx.strokeStyle = '#fff2d0'; ctx.lineWidth = 5 * (1 - k) + 1; ctx.beginPath(); ctx.arc(x, y, (30 + 110 * k) * S, 0, 7); ctx.stroke(); ctx.restore(); }   // the shock ring
}
const PULSE_COL = ['#9a52ff', '#e03ccf', '#c9a7ff', '#7b3cf2'], HULLBITS = ['#f2e4c4', '#d9483b', '#d6bf93'];
function pulse(ctx, x, y, rad, a, t) {   // HIS glitch pulse (purple + a little binary green — Potato's only)
  const k = a / 0.32; if (k >= 1) return; const r = rad * (0.25 + 0.75 * Math.sqrt(k)), st = Math.floor(t * 24);
  ctx.save(); ctx.globalAlpha = 1 - k * 0.7;
  for (let i = 0; i < 22; i++) { const ang = i / 22 * 6.283 + (R(st, i) - 0.5) * 0.12, rr = r * (0.9 + 0.2 * R(st, i + 30)), w = 18 + 26 * R(i, st + 3), h = 6 + 6 * R(i, st + 5);
    ctx.fillStyle = PULSE_COL[i % 4]; ctx.fillRect(x + Math.cos(ang) * rr - w / 2 + (R(st, i + 9) - 0.5) * 16, y + Math.sin(ang) * rr - h / 2, w, h); }
  ctx.fillStyle = '#f4eaff'; ctx.font = '700 15px ui-monospace, monospace'; for (let i = 0; i < 3; i++) { const ang = R(st, 60 + i) * 6.283; ctx.fillText(R(st, 70 + i) < 0.5 ? '1' : '0', x + Math.cos(ang) * r * 0.8, y + Math.sin(ang) * r * 0.8); }
  ctx.restore(); }
// o: { tPos(qi) -> {x, y} | null (where target qi was last drawn, world), shipPos() -> {x, y, v} | null, pal(v) -> hull colours }
export function drawFx(ctx, project, s, t, o = {}) {
  const F = s.fx; if (!F) return;
  for (const e of F) { const a = t - e.t; if (a < 0) continue;
    if (e.k === 'hit') { if (a > 0.24) continue; const P = project(e.x, e.y); sparks(ctx, P.x, P.y, 7, 26, a / 0.24, e.t * 97, '#ffe6a8', Math.PI * 0.85);
      if (a < 0.06) { ctx.save(); ctx.globalAlpha = 1 - a / 0.06; star(ctx, P.x, P.y, 20, 9, 6, e.t * 5, '#ffffff'); ctx.restore(); }
      for (let i = 0; i < 3; i++) { const k = a / 0.24, ang = Math.PI * (0.6 + 0.7 * R(e.t, i)); ctx.globalAlpha = 1 - k; chunk(ctx, P.x + Math.cos(ang) * 120 * k, P.y + Math.sin(ang) * 90 * k + 160 * k * k, 4 + 2 * R(e.t, i + 4), k * 8, ROCK[i], e.t + i); } ctx.globalAlpha = 1; }
    else if (e.k === 'iron') { if (a > 0.2) continue; const P = project(e.x, e.y); sparks(ctx, P.x, P.y, 6, 22, a / 0.2, e.t * 53, '#cfe6ff', Math.PI);
      if (a < 0.05) { ctx.save(); ctx.globalAlpha = 1 - a / 0.05; star(ctx, P.x, P.y, 16, 7, 5, 0.3, '#e8f2ff'); ctx.restore(); } }
    else if (e.k === 'ship') { if (a > 0.16) continue; const P = project(e.x, e.y); sparks(ctx, P.x, P.y, 4, 18, a / 0.16, e.t * 31, '#ffc86a', Math.PI); }
    else if (e.k === 'kill') { if (a > 1.0) continue; const tp = o.tPos && e.qi != null ? o.tPos(e.qi) : null, P = project(tp ? tp.x : e.x, tp ? tp.y : e.y);
      boom(ctx, P.x, P.y, a, (e.big ? 1.25 : 0.85) * (e.by === 'ram' ? 0.8 : 1), e.t * 13 + (e.qi || 0), e.st ? PAPER : ROCK); }
    else if (e.k === 'chunk') { if (a > 1.0) continue; const P = project(e.x, e.y), sp = o.shipPos ? o.shipPos() : null, pal = o.pal && sp ? o.pal(sp.v) : ROCK;
      boom(ctx, P.x, P.y, a, 1.6, e.t * 7, pal); }
    else if (e.k === 'bossdown') { if (a > 1.6) continue; const sp = o.shipPos ? o.shipPos() : null; if (!sp) continue; const pal = o.pal ? o.pal(sp.v) : ROCK, n = e.small ? 2 : 4;   // (never worn down: it goes up smaller)
      for (let j = 0; j < n; j++) { const d = j * 0.12; if (a >= d) { const P = project(sp.x + (R(e.t, j) - 0.5) * 3.2, sp.y + (R(e.t, j + 5) - 0.5) * 1.4); boom(ctx, P.x, P.y, a - d, (2.2 - 0.3 * j) * (e.small ? 0.7 : 1), e.t * 3 + j, pal); } }
      if (a < 0.14 && !e.small) { ctx.save(); ctx.globalAlpha = 0.5 * (1 - a / 0.14); ctx.fillStyle = '#fff6dc'; ctx.fillRect(0, 0, 960, 540); ctx.restore(); } }   // the stage lights pop
    else if (e.k === 'worn') { if (a > 0.9) continue; const sp = o.shipPos ? o.shipPos() : null; if (!sp) continue; const P = project(sp.x, sp.y), pal = o.pal ? o.pal(sp.v) : ROCK;   // worn right down: a big crack, it starts to panic
      boom(ctx, P.x - 60, P.y, a, 1.8, e.t * 5, pal); sparks(ctx, P.x, P.y, 14, 70, Math.min(1, a / 0.6), e.t * 17, '#ffe6a8');
      if (a < 0.12) { ctx.save(); ctx.globalAlpha = 0.35 * (1 - a / 0.12); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 960, 540); ctx.restore(); } }
    else if (e.k === 'hurt') { if (a > 0.6) continue; const P = project(e.x, e.y), k = a / 0.6;   // HE's hit: a white pop, his purple glitch tearing off him, bits of cream hull
      if (a < 0.07) { ctx.save(); ctx.globalAlpha = 1 - a / 0.07; star(ctx, P.x, P.y, 46, 20, 7, e.t * 3, '#ffffff', 3); ctx.restore(); }
      const st = Math.floor((e.t + a) * 24); ctx.save(); ctx.globalAlpha = 1 - k; for (let i = 0; i < 12; i++) { const w = 14 + 34 * R(st, i), h = 4 + 5 * R(i, st);
        ctx.fillStyle = PULSE_COL[i % 4]; ctx.fillRect(P.x + (R(st, i + 20) - 0.5) * 120 * (0.4 + k), P.y + (R(st, i + 40) - 0.5) * 80 * (0.4 + k), w, h); } ctx.restore();
      for (let i = 0; i < 5; i++) { const ang = Math.PI * (0.9 + 1.2 * R(e.t, i)), d = 160 * k; ctx.globalAlpha = 1 - k; chunk(ctx, P.x + Math.cos(ang) * d, P.y + Math.sin(ang) * d * 0.7 + 200 * k * k, 5 + 3 * R(e.t, i + 9), k * 9, HULLBITS[i % 3], e.t + i); } ctx.globalAlpha = 1; }
    else if (e.k === 'pulse') { const P = project(e.x, e.y), Q = project(e.x + (e.r || 1.7), e.y); pulse(ctx, P.x, P.y, Math.abs(Q.x - P.x), a, t); }
  }
}
const SHK = { kill: 0.07, chunk: 0.2, bossdown: 0.5, pulse: 0.05, ship: 0.008, hit: 0.012, hurt: 0.22, worn: 0.3 };
export function fxShake(s, t) { let m = 0; for (const e of s.fx || []) { const a = t - e.t; if (a < 0 || a > 0.6) continue; const amp = (SHK[e.k] || 0) * (e.k === 'kill' && e.big ? 1.5 : 1) * (e.k === 'bossdown' && e.small ? 0.5 : 1); m = Math.max(m, amp * Math.exp(-a / (e.k === 'bossdown' ? 0.25 : 0.09))); } return m; }
// the boss hit-stop: when a piece of a ship's hull gives, the ship (and only the ship: the song can't stop) freezes for a beat of frames
export function hitStop(s, t, len = 0.075) { for (const e of s.fx || []) if ((e.k === 'chunk' || e.k === 'bossdown') && t >= e.t && t < e.t + len) return e.t; return t; }
export function lastFx(s, t, k, within) { let r = null; for (const e of s.fx || []) if (e.k === k && t >= e.t && t - e.t < within) r = e; return r; }

// the ship's spit: a glob of nonsense in the ship's own colour (never purple), inked, wobbling, a few drips trailing behind
const GLOWS = {}; function spitGlow(col) { if (GLOWS[col]) return GLOWS[col]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 4, 32, 32, 32);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (GLOWS[col] = c); }
export function drawSpit(ctx, project, s, t, col = '#ffd23d') {
  for (const e of s.eshots || []) { if (e.rx == null) continue; const cx = s.x - (s.dx || 0) + e.rx, P = project(cx, e.y), Q = project(cx + 0.34, e.y), r = Math.abs(Q.x - P.x), a = t - e.t0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.drawImage(spitGlow(col), P.x - r * 2.2, P.y - r * 2.2, r * 4.4, r * 4.4); ctx.restore();
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(P.x + r * (1.1 + i * 0.75), P.y + Math.sin(a * 9 + i) * r * 0.25, r * (0.42 - i * 0.09), 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = i / 10 * 6.283, rr = r * (1 + 0.14 * Math.sin(an * 3 + a * 14)); ctx.lineTo(P.x + Math.cos(an) * rr * 1.12, P.y + Math.sin(an) * rr * 0.92); } ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(P.x - r * 2, P.y + r * 0.15, r * 4, r * 2); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(P.x - r * 0.35, P.y - r * 0.35, r * 0.22, 0, 7); ctx.fill(); ctx.restore();
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke(); }
}

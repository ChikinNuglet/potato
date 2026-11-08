// art-last-lights-on.mjs — THE SWAP POINT for Chat's art in Last Lights On (the Potato army, D-20261102-31).
// Chat is drawing the city's PEOPLE (turnarounds for the 3D figure, baked to sprite sheets) and PAINTED CITY BACKGROUNDS
// (due Nov 4). Until they land, everything here is drawn in code. ONE entry per layer; swapping in her art = changing
// `source` and dropping files into run/assets/ll/ — nothing else in the level changes (story-last-lights-on.mjs only calls
// ART.people.draw / ART.backdrop.* / ART.doors.draw).
//
//   ART.people    the city's people (runners in his lane, the far chases). draw(ctx, pose, t, x, y, h, dir, seed) -> feet at x, y
//                 poses: 'run' (arms up, comic panic) · 'spin' (bumped: one spin, keeps running) · 'duck' (escaping into the
//                 phone box / revolving door) · 'climb' (up the lamp post). Never hurt, never caught.
//                 chat: run/assets/ll/people.png + people.json { cell:[w,h], feet:y, poses:{ run:[row, frames], ... }, looks:n }
//   ART.backdrop  far (the dense far city), mid (the scoring skyline's block faces), near (the shop fronts' walls)
//                 each null (= the code layer) or a function (ctx, t, camX) that paints a plate and returns true.
//                 chat: run/assets/ll/far.png / mid.png / near.png — wide strips, tiled by camX (parallax 0.5 / 1 / course).
//   ART.doors     the green target doors + the runner doors. draw(ctx, x, y, w, h, state, k, t): state 'dark' | 'lit' | 'open'
//                 | 'his' | 'burst'; k = 0..1 progress of the state.
// Rule for every Chat file before it goes in: purple scan (0 purple pixels: purple is Potato's alone), no hands on Potato.
const INK = '#120a05', GREEN = '#4dff9a';
const rnd = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const img = src => { if (typeof Image === 'undefined') return null; const i = new Image(); i.src = new URL(src, import.meta.url).href; return i; };
const ready = i => i && i.complete && i.naturalWidth > 0;

// ---------------- people ----------------
function codePerson(c, pose, t, x, y, h, dir = -1, seed = 0) {   // a little person (feet at x, y): arms up, comic panic, never hurt
  const shirt = ['#e8d8b8', '#5a7ab0', '#c8584a', '#7aa86a', '#d8b04a', '#b07aa8'][Math.floor(rnd(seed, 1) * 6)], skin = ['#f0c8a0', '#c88a5a', '#8a5a3a', '#e0b080'][Math.floor(rnd(seed, 2) * 4)];
  const run = pose === 'run' || pose === 'spin', k = t * (pose === 'climb' ? 6 : 14), st = run ? Math.sin(k) : pose === 'climb' ? Math.sin(k) * 0.5 : 0, bob = run ? Math.abs(Math.cos(k)) * h * 0.05 : 0;
  c.save(); c.translate(x, y - bob); c.scale(dir, 1); if (pose === 'spin') c.scale(Math.cos(t * 14) || 0.01, 1); if (pose === 'duck') c.scale(1, 0.82);
  c.lineCap = 'round'; c.lineJoin = 'round'; const lw = Math.max(1.2, h * 0.06);
  c.strokeStyle = INK; c.lineWidth = lw * 2.2; c.beginPath(); c.moveTo(0, -h * 0.42); c.lineTo(h * 0.16 * st, 0); c.moveTo(0, -h * 0.42); c.lineTo(-h * 0.16 * st, 0); c.stroke();
  c.strokeStyle = '#2a2a3a'; c.lineWidth = lw * 1.1; c.stroke();
  const up = pose === 'duck' ? 0.3 : 1;
  c.strokeStyle = INK; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(0, -h * 0.68); c.lineTo(-h * 0.2, -h * (0.68 + (0.24 + 0.05 * st) * up)); c.moveTo(0, -h * 0.68); c.lineTo(h * 0.2, -h * (0.68 + (0.27 - 0.05 * st) * up)); c.stroke();
  c.strokeStyle = shirt; c.lineWidth = lw; c.stroke();
  c.fillStyle = shirt; c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.roundRect(-h * 0.13, -h * 0.74, h * 0.26, h * 0.36, h * 0.08); c.fill(); c.stroke();
  c.fillStyle = skin; c.beginPath(); c.arc(0, -h * 0.86, h * 0.13, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(-h * 0.05, -h * 0.88, h * 0.025, 0, 7); c.fill();   // the eye: looking back at what's chasing them
  c.beginPath(); c.ellipse(-h * 0.05, -h * 0.8, h * 0.03, h * 0.04, 0, 0, 7); c.fill();       // the "o" mouth
  c.restore();
  if (run && rnd(seed, Math.floor(t * 4)) < 0.6) { c.fillStyle = '#bfe8ff'; c.beginPath(); c.ellipse(x - dir * h * 0.2, y - h * 1.0, h * 0.035, h * 0.06, 0, 0, 7); c.fill(); }   // a sweat drop
}
const PEOPLE_IMG = { sheet: null, meta: null, tried: false };
function chatPerson(c, pose, t, x, y, h, dir, seed) {
  const S = PEOPLE_IMG; if (!S.tried) { S.tried = true; S.sheet = img('../assets/ll/people.png'); fetch(new URL('../assets/ll/people.json', import.meta.url)).then(r => r.json()).then(m => { S.meta = m; }).catch(() => {}); }
  if (!ready(S.sheet) || !S.meta) return codePerson(c, pose, t, x, y, h, dir, seed);
  const M = S.meta, [cw, ch] = M.cell, [row, n] = M.poses[pose] || M.poses.run, f = Math.floor(t * 12 + seed) % n, look = Math.floor(rnd(seed, 3) * (M.looks || 1)), sc = h / (M.body || ch);
  c.save(); c.translate(x, y); c.scale(dir * sc, sc); c.drawImage(S.sheet, (look * n + f) * cw, row * ch, cw, ch, -cw / 2, -(M.feet ?? ch), cw, ch); c.restore();
}
// ---------------- doors ----------------
// a shop door: 'lit' = his green frame + a small door-light blinking on the beat (a target: hop while passing it); 'his' = it
// flipped (green, open, a copy's side-eye in the glass); 'burst' = a runner's door slamming open (white light, never green)
function codeDoor(c, x, y, w, h, state, k, t) {
  c.save(); c.lineJoin = 'round';
  const glass = state === 'his' ? '#0d3a22' : state === 'burst' ? '#fff3d6' : '#0c0a10';
  c.fillStyle = '#1a1622'; c.fillRect(x - w / 2 - 4, y - h - 4, w + 8, h + 4);
  if (state === 'burst') { const o = Math.min(1, k * 3); c.fillStyle = glass; c.fillRect(x - w / 2, y - h, w, h); c.fillStyle = '#2a2232'; c.fillRect(x - w / 2, y - h, w * (1 - o) * 0.5, h); c.fillRect(x + w / 2 - w * (1 - o) * 0.5, y - h, w * (1 - o) * 0.5, h); }
  else { c.fillStyle = glass; c.fillRect(x - w / 2, y - h, w, h); }
  c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(x - w / 2, y - h, w, h);
  if (state === 'lit' || state === 'his') { c.strokeStyle = GREEN; c.lineWidth = 3; c.globalAlpha = state === 'lit' ? 0.75 + 0.25 * k : 1; c.strokeRect(x - w / 2 - 3, y - h - 3, w + 6, h + 3); c.globalAlpha = 1;
    c.fillStyle = state === 'his' || k > 0.5 ? GREEN : '#1f5a3a'; c.beginPath(); c.arc(x, y - h - 10, 4.5, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); }   // the door-light (blinks on the beat)
  if (state === 'dark') { c.fillStyle = '#2a2834'; c.beginPath(); c.arc(x, y - h - 10, 3.5, 0, 7); c.fill(); }
  c.restore();
}

export const ART = {
  people: { source: 'code', draw(c, pose, t, x, y, h, dir = -1, seed = 0) { return (this.source === 'chat' ? chatPerson : codePerson)(c, pose, t, x, y, h, dir, seed); } },
  backdrop: { far: null, mid: null, near: null },
  doors: { source: 'code', draw(c, x, y, w, h, state, k, t) { return codeDoor(c, x, y, w, h, state, k, t); } },
};

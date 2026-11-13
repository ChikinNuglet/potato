// tracks.mjs — plays moves.json keys: [frame, value, ease]. Character animator (seat 2), carried from One Overshoot's key format.
// A track is played FORWARD one step at a time and remembers its value and speed, so the "spring" ease can take over a
// channel with the speed it already had (one overshoot, never a keyed settle) and "hold" can step on a frame.
const io = u => u * u * (3 - 2 * u);
export const EASE = { lin: u => u, in: u => u * u, out: u => 1 - (1 - u) * (1 - u), io, in3: u => u * u * u, out3: u => 1 - (1 - u) * (1 - u) * (1 - u) };
const NAMES = new Set(['feet', 'centre', 'grab', 'contact', 'canon', 'shock', 'scream', 'startled', 'deadpan', 'oh', 'none']);
const cache = new Map();
/** a key's value: a number, null (unkeyed), a name (pivot / expr), or a small expression over the vars of this play */
export function resolve(v, vars) {
  if (typeof v === 'number') return v; if (v == null) return null; if (NAMES.has(v)) return v;
  let ast = cache.get(v);
  if (!ast) { ast = parse(v.replace(/toward target/g, 'toward_target')); cache.set(v, ast); }
  const r = run(ast, vars); return typeof r === 'number' && r === r ? r : 0;
}
// a four-function calculator over the play's vars. No eval, no Function: moves.json is data and stays data.
function parse(src) {
  const tok = src.match(/\s*([0-9]*\.?[0-9]+|[A-Za-z_][A-Za-z_0-9]*|[-+*/()])/g) || []; let i = 0;
  const peek = () => (tok[i] || '').trim(), next = () => (tok[i++] || '').trim();
  const atom = () => { const t = next(); if (t === '(') { const e = sum(); next(); return e; } if (t === '-') return ['neg', atom()]; if (t === '+') return atom();
    return /^[0-9.]/.test(t) ? ['num', parseFloat(t)] : ['var', t]; };
  const prod = () => { let a = atom(); while (peek() === '*' || peek() === '/') { const o = next(); a = [o, a, atom()]; } return a; };
  const sum = () => { let a = prod(); while (peek() === '+' || peek() === '-') { const o = next(); a = [o, a, prod()]; } return a; };
  return sum();
}
function run(n, V) {
  switch (n[0]) { case 'num': return n[1]; case 'var': return n[1] === 'pi' ? Math.PI : (typeof V[n[1]] === 'number' ? V[n[1]] : 0); case 'neg': return -run(n[1], V);
    case '+': return run(n[1], V) + run(n[2], V); case '-': return run(n[1], V) - run(n[2], V); case '*': return run(n[1], V) * run(n[2], V); case '/': return run(n[1], V) / run(n[2], V); }
  return 0;
}
/** keys resolved for this play. spring = { omega, zeta, slew } for the "spring" ease on this channel. */
export function makeTrack(name, keys, vars, spring) {
  const K = keys.map(k => ({ f: k[0], v: resolve(k[1], vars), e: k[2] || 'io' }));
  return { name, K, i: 0, x: null, v: 0, spr: false, sp: spring || { omega: 13, zeta: 0.6 }, named: typeof K[K.length - 1].v === 'string' || typeof K[0].v === 'string' };
}
/** the track's value at frame f (call with f rising). undefined before its first key: the channel is not this move's yet. */
export function evalTrack(t, f) {
  const K = t.K; if (f < K[0].f) return undefined;
  let i = t.i; while (i < K.length - 1 && f >= K[i + 1].f) i++; t.i = i;
  if (t.named) return K[i].v;                                   // pivot / expr: stepped, never eased
  let val, springTo = null;
  if (i >= K.length - 1) { if (K[i].e === 'spring' && t.spr) springTo = K[i].v; else val = K[i].v; }
  else { const a = K[i], b = K[i + 1];
    if (b.e === 'spring') springTo = b.v; else if (b.e === 'hold') val = a.v;
    else { const u = (f - a.f) / (b.f - a.f); val = a.v + (b.v - a.v) * (EASE[b.e] || io)(u); } }
  if (springTo != null) {
    if (t.x == null) t.x = K[i].v == null ? springTo : K[i].v;
    t.spr = true; const w = t.sp.omega, z = t.sp.zeta, dt = 1 / 60;
    t.v += (-w * w * (t.x - springTo) - 2 * z * w * t.v) * dt; let nx = t.x + t.v * dt;
    if (t.sp.slew && Math.abs(nx - t.x) > t.sp.slew) { nx = t.x + Math.sign(nx - t.x) * t.sp.slew; t.v = (nx - t.x) * 60; }
    t.x = nx; return nx;
  }
  if (val == null) return null;
  t.v = t.x == null ? 0 : (val - t.x) * 60; t.x = val; t.spr = false; return val;
}
/** canon squash cap, soft: identity for three quarters of the cap, then it leans on the cap and never crosses it. Smooth (no kink). */
export function capMap(v, cap, deep) {
  if (deep || v == null || v !== v) return v; const a = 0.75 * cap, d = Math.abs(v - 1); if (d <= a) return v;
  return 1 + Math.sign(v - 1) * (a + (cap - a) * (1 - Math.exp(-(d - a) / (cap - a))));
}

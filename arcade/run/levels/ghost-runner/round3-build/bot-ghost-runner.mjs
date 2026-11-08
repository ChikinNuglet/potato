// bot-ghost-runner.mjs — plays the Ghost TRUE RUNNER (?ghost=runner: run/modes/ghost-runner.mjs, pass 2) and writes its demo.
// It plays like a careful human on the keyboard: no ← →, only ↑ jump, ↓ duck, Space. It reads the course the screen shows (the next
// wall, the dots, the badges, what's shaking loose above him) and presses a little before each one, with a human wobble (--seed).
// Before every press it tries the press in a copy of the game (the same pure rules) and keeps the earliest timing that lives 1.5 s on.
// Usage (from game/): node tools/bot-ghost-runner.mjs [--seed=N] [--dry] [--verbose] [--out=FILE] [--rewrite=0..1]
//   --idle / --spam / --jumpspam: the naive runs (DESIGN-v3 §10 checks 1-3): where they die
//   --tipper=early|none: the WRONG tipper runs (check 4): Space at the wall 0.6 s before the word, or never
//   --noblock: skip the Space for BLOCKED (check 5: it must squish)
//   --late=S: a sloppy player: every wall pressed S seconds after he meets the glass (lag recovery, DESIGN-v3 §10)
import fs from 'fs';
const G0 = new URL('..', import.meta.url).pathname, id = 'ghost-runner';
const { makeCourse, makeSim, DT } = await import(G0 + 'run/core.mjs');
const L = await import(G0 + `run/levels/${id}.mjs`), M = await import(G0 + `run/modes/${id}.mjs`);
const map = JSON.parse(fs.readFileSync(G0 + 'play/' + L.meta.map)), words = L.parseWords(fs.readFileSync(G0 + L.meta.words, 'utf8'));
const mf = G0 + 'play/' + L.meta.map.replace('.map.json', '.music.json'); map.music = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf)) : null;
const C = makeCourse(L.build(words, map, null), map), RP = M.prepR(C), co = RP.co;
const arg = (k, d) => { const a = process.argv.find(a => a.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; }, has = k => process.argv.includes('--' + k);
const DBG = +arg('debug', 0), LATE = +arg('late', 0), VERB = has('verbose'), TIPPER = arg('tipper', 'good'), REW = +arg('rewrite', 1), NOBLOCK = has('noblock');
let seed = +arg('seed', 7); const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const clone = s => { const { jlog, ...rest } = s; const c = structuredClone(rest); c.jlog = []; return c; };
const api = c => ({ C, DT, die: why => { if (!c.dead) { c.dead = true; c.why = why; } } });
function stepCopy(c, inp) { const t = c.t + DT; M.mode.step(c, inp, t, api(c)); c.t = t; }
// does this press (now) leave him alive for `look` seconds, pressing nothing else?
function lives(s, key, look = 0.5) { const c = clone(s); stepCopy(c, key ? { [key]: true } : {}); for (let i = 0; i < look / DT; i++) { if (c.dead || c.failT != null) return false; stepCopy(c, {}); } return !(c.dead || c.failT != null); }
function nextNeed(s, t) {   // what's coming that needs a key, and how soon (seconds at his speed)
  const ph = RP.ph[s.ph], o = M.pose(RP, ph, t, s), v = co.V * (s.lag > 0.02 ? M.R.CATCH : 1), out = [];
  const nb = RP.ph[s.ph + 1]; if (nb && !ph.special.tipA && !ph.special.last && !(t >= M.R.DARK)) out.push({ k: 'G', what: nb.special.tipper ? 'tipper' : 'wall', dt: (o.x1 - (s.x + M.R.HW)) / v, nb });
  for (const h of RP.hz) { if (s.hz[h.i] || t > h.t + 0.3 || t < h.appear - 0.5) continue; const gm = M.hazGeom(RP, h, t, s); if (!gm) continue;
    if (h.kind === 'dots') out.push({ k: 'J', what: 'dots', dt: (gm.x0 - (s.x + M.R.HW)) / v, h });
    if (h.kind === 'duck' || h.kind === 'sag') out.push({ k: 'D', what: h.kind, dt: (gm.x0 - (s.x + M.R.HW)) / v, h });
    if (h.kind === 'throw') { const xx = RP.X0 + h.x + 10 * (h.t - t); out.push({ k: 'D', what: 'throw', dt: (xx - 0.9 - (s.x + M.R.HW)) / (10 + v), h }); }
    if (h.kind === 'drop' || h.kind === 'blocked') out.push({ k: 'G', what: h.kind, dt: h.t - t - 0.12, h }); }
  return out.sort((a, b) => a.dt - b.dt);
}
function play(mode) {
  const sim = makeSim(C, 0), s = sim.s, pr = [], done = new Map(); let wob = 0, lastDuck = -9;
  while (!s.dead && !s.won && s.t < C.end + 1) {
    const t = s.t, inp = {};
    if (mode === 'idle') {}
    else if (mode === 'spam') { if (t >= 8.9 && Math.floor(t * 4) !== Math.floor((t - DT) * 4)) inp.G = true; }
    else if (mode === 'jumpspam') { if (t >= 8.9 && Math.floor(t * 3) !== Math.floor((t - DT) * 3)) inp.J = true; }
    else if (t >= co.runStart - 0.3 && s.rOn && s.failT == null && !s.gone) {
      const needs = nextNeed(s, t);
      for (const n of needs) {
        if (n.what === 'blocked' && NOBLOCK) continue;
        if (n.what === 'tipper' && TIPPER === 'none' && !s.tp[n.nb.id]) continue;
        if (n.what === 'tipper' && TIPPER === 'early') { const W = n.nb.special.tipper; if (!s.tp[n.nb.id] && t >= W.word - 0.6 && t < W.word - 0.6 + DT) { inp.G = true; break; } if (s.tp[n.nb.id] && s.charge) { inp.G = true; break; } continue; }
        const lead = n.k === 'J' ? 0.16 : n.k === 'D' ? 0.14 : n.what === 'wall' ? 0.08 - LATE : 0.08, w = lead + wob;
        const key = n.h ? 'h' + n.h.i : 'w' + n.nb.id; if (done.has(key) && (n.k !== 'G' || t - done.get(key) < 0.5)) continue;
        if (DBG && t > DBG - 0.6 && t < DBG + 0.1) console.log(t.toFixed(3), n.what, n.k, n.dt.toFixed(3), 'charge', s.charge);
        const go = n.what === 'wall' && LATE > 0 ? s.heldAt != null && t - s.heldAt >= LATE : n.dt <= w && n.dt > -0.4;
        if (go) {
          if (n.k === 'G' && !s.charge) continue;
          if (n.k === 'D' && (t - lastDuck < 0.5 || s.ducking)) continue;
          if (n.k === 'G' && n.what === 'tipper' && t < n.nb.special.tipper.good[0]) continue;
          if (n.k === 'G' && t < s.phaseUntil - 0.05) continue;
          inp[n.k] = true; done.set(key, t); if (n.k === 'D') lastDuck = t; wob = (rnd() - 0.5) * 0.05; break; } }
      // rewrite: standing on a live blue text, charged, nothing that needs Space in the next 0.6 s
      if (!inp.G && s.charge && s.ground && s.on != null && rnd() < REW * 0.3) { const q = RP.plats[s.on];
        if (q.target && !(s.rew[q.group] != null) && !(s.readT[q.group] != null && t >= s.readT[q.group]) && !needs.some(n => n.k === 'G' && n.dt < 0.6 && n.dt > 0.12)) inp.G = true; }
      // a check in a copy of the game: if what we're about to press (or not) dies, try the other keys now
      if (!LATE && (Math.floor(t * 30) !== Math.floor((t - DT) * 30) || Object.keys(inp).length)) { const k0 = Object.keys(inp)[0] || null;
        if (!lives(s, k0)) { for (const k of ['G', 'J', 'D', null]) if (k !== k0 && (k !== 'G' || s.charge) && lives(s, k)) { for (const q of Object.keys(inp)) delete inp[q]; if (k) inp[k] = true; if (VERB) console.log(t.toFixed(2), 'save', k0, '->', k); break; } } }
    }
    // the check runs: no Space at all where the variant says none (not even a rewrite or a save)
    if (inp.G && (NOBLOCK && RP.hz.some(h => h.kind === 'blocked' && t > h.t - 0.9 && t < h.t + 0.1) || TIPPER !== 'good' && RP.tippers.some(T => { const W = T.special.tipper; return t > W.word - 0.5 && t < W.good[1] + 0.05 && !(TIPPER === 'early' && t < W.word - 0.55); }))) delete inp.G;
    for (const k of Object.keys(inp)) pr.push([+t.toFixed(4), k]);
    sim.step(inp);
  }
  return { pr, s };
}
const ev = (s, k) => (s.jlog || []).filter(e => e.k === k).length;
const summary = s => `${s.won ? 'WON' : 'LOST at ' + s.t.toFixed(2) + ' (' + (s.why || s.why0) + ')'} · phone #${s.ph} · doors ${ev(s, 'door')} · rewrites ${ev(s, 'rewrite')}/${RP.groups.size} · reads ${ev(s, 'read')} · stumbles ${ev(s, 'stumble')} · knocks ${ev(s, 'knock')} · thru ${ev(s, 'thru')} · fizzles ${ev(s, 'fizzle')} · pops ${ev(s, 'pop')} · tippers ${JSON.stringify(s.tp)}`;
if (has('idle') || has('spam') || has('jumpspam')) { for (const k of ['idle', 'spam', 'jumpspam']) { const { s } = play(k); console.log(k.padEnd(9), summary(s)); } process.exit(0); }
const t0 = Date.now(), { pr, s } = play('bot');
const g = pr.filter(p => p[1] === 'G').length;
console.log(`${summary(s)} · ${pr.length} presses (${g} Space, ${(pr.length / Math.max(1, (Math.min(s.t, 113.2) - co.runStart))).toFixed(2)}/s) · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (VERB) console.log((s.jlog || []).filter(e => ['fail', 'stumble', 'knock', 'pop', 'tipper1', 'tipper2', 'thru', 'rotate1', 'dog', 'jess'].includes(e.k)).map(e => e.t.toFixed(2) + ' ' + e.k + (e.why ? ':' + e.why : '') + (e.kind ? ':' + e.kind : '')).join(' | '));
if (arg('save', null)) fs.writeFileSync(arg('save'), JSON.stringify({ level: id, presses: pr }));
if (!has('dry') && s.won && TIPPER === 'good' && !NOBLOCK) { const out = arg('out', G0 + `run/levels/${id}.demo.json`); fs.writeFileSync(out, JSON.stringify({ level: id, presses: pr })); console.log('wrote', out); }

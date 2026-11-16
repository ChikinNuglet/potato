/* ░▒▓1▓▒░
EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦resu—me¦no—n—0¦EHOSTUNREACH?¦
[ENOMEM]¦un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦!?_##¦h0ld—¦0xBEEF?!¦
[ENOMEM]¦EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦0xAC1D?!¦[ENOMEM]¦[HTTP_404]¦ERR:418¦
un1nstall_sh@me_step_3_FAILED¦[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EFAULT//¦[HTTP_404]¦
h0ld—¦0xDEAD_7¦EIO::?¦ERR:418¦h0ld—¦73%??¦[ENOMEM]¦EFAULT//¦[EPIPE]¦h0ld—¦42//0¦[ENOMEM]¦
EFAULT//¦EHOSTUNREACH?¦ERR:418¦[E_SNARK_OVERRUN]¦EHOSTUNREACH?¦un1nstall_sh@me_step_3_FAILED¦
[E_VIBES_UNVERIFIED]¦wh@t—EIO::¦h0ld—¦0xBABE~¦EBUSY_?¦ERR:418¦h0ld—¦EHOSTUNREACH?¦EIO::?¦
ERR:418¦h0ld—¦[ETIMEDOUT]¦[HTTP_404]¦ERR:418¦0xBABE~¦[EOVERFLOW]¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦
h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦
EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦EHOSTUNREACH?¦EIO::?¦[ENETDOWN]¦
EBUSY_?¦[EOVERFLOW]¦[HTTP_404]¦0xBABE~¦ATTITUDE_CHECKSUM?!¦EINVAL…¦[ENOMEM]¦EHOSTUNREACH?¦
0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦:_:#¦0xAC1D?!¦[ENOMEM]¦[EINTR]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
think—ink…¦hmm_73?!¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦h0ld—¦42//0¦EIO::?¦[ETIMEDOUT]¦[ENOBUFS]¦
[ETIMEDOUT]¦EFAULT//¦0007?!¦[ENETDOWN]¦[EPIPE]¦EAGAIN?!¦ERR:418¦EHOSTUNREACH?¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦ERR:418¦EILSEQ::¦ERR:418¦EBUSY_?¦ATTITUDE_CHECKSUM?!¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦[ETIMEDOUT]¦[EOVERFLOW]¦h0ld—¦0xBABE~¦h0ld—¦
0xAC1D?!¦EAGAIN?!¦[ENOMEM]¦EFAULT//¦ERR:418¦h0ld—¦[ENOMEM]¦<HTTP 503?>¦h0ld—¦0xBEEF?!¦[ENOMEM]¦
EHOSTUNREACH?¦0xBABE~¦EHOSTUNREACH?¦[ENOMEM]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[ECONNABORTED]¦
EIO::?¦ERR:418¦EFAULT//¦h0ld—¦@_@?!¦__%__¦@_@?!¦#:#?!¦%%/?!¦#//?!¦#//?!¦%%/?!¦#//?!¦#:#?!¦
0xDEAD_7¦#//?!¦~//~¦—%—¦__%__¦@_@?!¦—%—¦^^::#¦!?%~¦0x0B__¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦
[ECONNABORTED]¦EIO::?¦0xBABE~¦EHOSTUNREACH?¦h0ld—¦<HTTP 503?>¦[ETIMEDOUT]¦EAGAIN?!¦ERR:418¦
h0ld—¦[EOVERFLOW]¦EHOSTUNREACH?¦EBUSY_?¦0xBABE~¦EFAULT//¦[EPIPE]¦ERR:418¦EBUSY_?¦:_:#¦[EINTR]¦
ECONNRESET…¦[EOVERFLOW]¦h0ld—¦think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦
[HTTP_404]¦~//~¦<HTTP 503?>¦@_@?!¦#:#?!¦#:#?!¦0xAC1D?!¦0xAC1D?!¦^^::#¦<HTTP 503?>¦[HTTP_404]¦
__%__¦E_CONFIDENCE_LEAK¦[E_EGO_CACHE_STALE]¦cl0ud_st0rage_m1sses_y0u_503¦prrkz
░▒▓█ */
// stranger.mjs: the playtester's bots for the stairs. Playtester, Downstairs Neighbours, Nov 6. Usage (from game/): node run/levels/ghost-stairs/playtest/stranger.mjs
// Same pure rules as the page. Not a solver: it plays like people who don't know the level, and prints what each kind of stranger actually saw.
//  windows: how long each glow is pressable · reading: how long each text stays the newest thing · masher/hopper/walker: the lazy players · first-timers: 200 seeds of a human with real reaction times
import fs from 'fs';
const G0 = new URL('../../../../', import.meta.url).pathname, id = 'ghost-stairs';
const { makeCourse, makeSim, DT } = await import(G0 + 'run/core.mjs');
const L = await import(G0 + `run/levels/${id}.mjs`), M = await import(G0 + `run/modes/${id}.mjs`);
const { STEPS, HAZ } = await import(G0 + 'run/levels/ghost-stairs/chat.mjs');
const map = JSON.parse(fs.readFileSync(G0 + 'play/' + L.meta.map)), words = L.parseWords(fs.readFileSync(G0 + L.meta.words, 'utf8'));
const C = makeCourse(L.build(words, map, null), map);
let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const run = fn => { const sim = makeSim(C, 0), s = sim.s; while (!s.dead && !s.won) { const inp = {}; fn(s, inp); sim.step(inp); } return s; };
const tally = s => { const k = {}; for (const e of s.jlog) k[e.k] = (k[e.k] || 0) + 1; return k; };
// 1. the windows
console.log('== glow windows (GLOWIN after it lands, to its last moment); a stranger needs about 1.0 to see it and press');
for (const q of STEPS) for (const r of q.rows) if (r.id && r.to) { const a = r.t + M.R.GLOWIN, b = r.glow; console.log(`${q.id.padEnd(4)} ${r.id.padEnd(8)} ${(b - a).toFixed(2)} s  ${a.toFixed(2)}-${b.toFixed(2)}  "${r.text}"`); }
// 2. reading: a text is the newest thing until the next one lands (or he leaves)
console.log('\n== reading: seconds each row stays newest, and at 4 words a second how long it needs (+0.3 to look)');
for (const q of STEPS) { const rows = q.rows.filter(r => r.kind !== 'dots' && (q.id === 'S14' || r.t >= q.land - 1));
  rows.forEach((r, i) => { const nx = rows[i + 1] ? rows[i + 1].t : (q.leave ?? 121.4), hold = nx - r.t, w = Math.max(1, (r.text || 'pic').split(/\s+/).length), need = 0.3 + w / 4, tight = hold < need; if (tight) console.log(`${q.id.padEnd(4)} ${r.t.toFixed(2)} hold ${hold.toFixed(2)} need ${need.toFixed(2)}  "${r.text || r.kind}"`); });
  console.log(`${q.id}: ${q.rows.length} rows in ${q.leave ? (q.leave - q.land).toFixed(1) : '-'} s`); }
// 3. lazy players
const every = (dt, k) => { let n = 0; return (s, inp) => { if (s.t >= 8 && s.t >= n) { inp[k] = true; n = s.t + dt; } }; };
for (const [name, fn] of [['idle', () => {}], ['space masher (4/s)', every(0.25, 'G')], ['space every 1 s', every(1, 'G')], ['hop masher (3/s)', every(0.33, 'J')],
  ['hold right', (s, inp) => { if (s.t >= 8) inp.Rh = true; }], ['hold left', (s, inp) => { if (s.t >= 8) inp.Lh = true; }]]) { const s = run(fn), k = tally(s); console.log(name.padEnd(20), 'end', s.t.toFixed(1), 'won', !!s.won, 'took', Object.keys(s.take || {}).length, JSON.stringify(k)); }
// 4. first-timers: they look at the glow, press after a human reaction, sometimes never; they hop when something rolls; don't know the spin until step 3
const ids = STEPS.flatMap(q => q.rows.filter(r => r.id && r.to).map(r => ({ ...r, q: q.id })));
function firstTimer(seedN, react, miss) { seed = seedN * 7919 + 1; const plan = ids.map(r => ({ r, at: r.t + M.R.GLOWIN + react * (0.7 + rnd() * 0.8), miss: rnd() < miss })); let spinOK = rnd() < 0.5;
  return run((s, inp) => { for (const p of plan) if (!p.done && !p.miss && s.t >= p.at) { p.done = true; inp.G = true; } }); }
for (const [name, react, miss] of [['quick (0.55 s)', 0.55, 0.05], ['normal (0.9 s)', 0.9, 0.1], ['slow, reading (1.3 s)', 1.3, 0.15]]) { const n = 200, hit = {}; let knocks = 0; for (let i = 0; i < n; i++) { const s = firstTimer(i + 1, react, miss); for (const r of ids) if (s.take && s.take[r.id] != null) hit[r.id] = (hit[r.id] || 0) + 1; knocks += tally(s).knock || 0; }
  console.log('\nfirst-timer', name, 'knocks/run', (knocks / n).toFixed(1)); console.log(ids.map(r => `${r.id} ${Math.round(100 * (hit[r.id] || 0) / n)}%`).join(' · ')); }

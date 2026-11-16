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
h0ld—¦0xB00_7¦[ENOMEM]¦EHOSTUNREACH?¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦think—ink…¦
hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦#:#?!¦#:#?!¦@_@?!¦^^::#¦0xBABE~¦@_@?!¦__%__¦
::?!::¦%_?!%¦0xB00_7¦#:#?!¦ERR:418¦0xAC1D?!¦PREM1UM_P0TAT0_upgrade_0xBAD¦
Congratulations, your account has won more accounts.¦r1gh—0x00
░▒▓█ */
// bot.mjs: plays the stairs like a careful human and writes ghost-stairs.demo.json. Builder, Downstairs Neighbours. Usage (from game/): node run/levels/ghost-stairs/bot.mjs [--dry] [--idle]
// --idle: press nothing (the designer's test: the story must still arrive, nothing ends the run). Each press is a plain list: this is the performance, not a solver.
import fs from 'fs';
const G0 = new URL('../../../', import.meta.url).pathname, id = 'ghost-stairs';
const { makeCourse, makeSim, DT } = await import(G0 + 'run/core.mjs');
const L = await import(G0 + `run/levels/${id}.mjs`), M = await import(G0 + `run/modes/${id}.mjs`);
const map = JSON.parse(fs.readFileSync(G0 + 'play/' + L.meta.map)), words = L.parseWords(fs.readFileSync(G0 + L.meta.words, 'utf8'));
const C = makeCourse(L.build(words, map, null), map);
const has = k => process.argv.includes('--' + k);
// a human's run: Space on each glow a beat after it lands, spins at the wheels, hops over what rolls, steps aside from what falls
const P = [];
const walk = (t, k, d) => P.push([t, '+' + k], [t + d, '-' + k]);
const spin = (t, k) => P.push([t, k], [t + 0.16, k]);
P.push([14.3, 'G']);                                        // S1: the first press
walk(15.6, 'R', 0.62); spin(16.5, 'R');                     // S1: to the door, the wheel
P.push([25.5, 'G']);                                        // S2: the dud
walk(27.9, 'R', 0.62); spin(28.8, 'R'); P.push([31.95, 'G']);  // S3: the wheel in a quiet gap, then the chorus
P.push([36.42, 'J'], [36.75, 'G']);                          // S4: hop the bell, the glow on the way up
P.push([47.1, 'G']);                                        // S5
P.push([55.2, 'G']); walk(58.1, 'R', 0.3);                  // S6, then step aside from the thrown line
P.push([63.3, 'J'], [63.92, 'J'], [64.54, 'J']);            // S7: the defines
P.push([66.2, 'G']); walk(67.0, 'R', 0.55); spin(67.8, 'R');  // S7: the poem, the wheel
P.push([86.9, 'G']);                                        // S9
P.push([95.3, 'G']);                                        // S11
walk(99.65, 'R', 0.5); walk(100.42, 'L', 0.4); P.push([103.2, 'G']);  // S12: two steps aside, the last rewrite
P.push([119.2, 'G']);                                       // S14: Read
P.sort((a, b) => a[0] - b[0]);
const run = presses => { const sim = makeSim(C, 0), s = sim.s; let pi = 0; const trace = []; while (!s.dead && !s.won) { const inp = {}; while (pi < presses.length && presses[pi][0] <= s.t + DT * 0.5) inp[presses[pi++][1]] = true; sim.step(inp); } return s; };
const s = run(has('idle') ? [] : P);
const k = {}; for (const e of s.jlog) k[e.k] = (k[e.k] || 0) + 1;
console.log('end t', s.t.toFixed(2), 'won', !!s.won, 'dead', !!s.dead, 'took', Object.keys(s.take || {}).join(','), JSON.stringify(k));
for (const e of s.jlog) if (e.k === 'land') process.stdout.write(`S${e.st + 1}@${e.t.toFixed(2)} `); console.log();
const K = s.jlog.filter(e => ['knock', 'jam', 'fizz', 'fizzle', 'flinch', 'slide', 'thru', 'wheel'].includes(e.k)); console.log(K.map(e => `${e.k}${e.h ? ':' + e.h : ''}@${e.t.toFixed(2)}`).join(' '));
if (!has('dry') && !has('idle')) { const out = G0 + `run/levels/${id}.demo.json`; fs.writeFileSync(out, JSON.stringify({ level: id, presses: P.map(([t, k]) => [+t.toFixed(4), k]), won: !!s.won })); console.log('wrote', out); }

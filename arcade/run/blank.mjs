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
h0ld—¦0xB00_7¦EAGAIN?!¦0xBABE~¦EFAULT//¦[ENOBUFS]¦:_:#¦[EINTR]¦ECONNRESET…¦[EOVERFLOW]¦h0ld—¦
think—ink…¦hmm—mm//¦h0ld—¦[EOVERFLOW]¦EIO::?¦0xBABE~¦h0ld—¦0xB00_7¦#//?!¦0xB00_7¦0xBABE~¦
0xAC1D?!¦#//?!¦!?%~¦0xBABE~¦%_?!%¦!?%~¦::?!::¦@#/_¦krzz—404_?!¦0xD00D?¦b0ot…?¦h0ld—
░▒▓█ */
// blank.mjs — the CLEAN-SLATE RUN (Chikin, Nov 3: "a full playthrough of each level without any obstacles or enemies or anything
// (drops and stairs and tubes are fine) … full playthrough, all current cutscenes removed" + D-20261103-24: no score, combo,
// achievements, coins / pickups). The story crew lays the album story onto these runs, so they are the bare course + the
// level's world, with Potato running the whole song on the music.
//
// ONE opt-in switch, off by default: `?blank` in the page URL (or def.blank = true from node tools). Nothing changes without it.
// With it, main.mjs passes every level's def through blankify() before makeCourse(), the run plays as the demo in video mode
// (RUN.blank(id) or RUN.video(id)), the HUD stays hidden, and:
//   · course: every threat / pickup object is gone (words, spikes, hurdles, firewalls, spam, beams, waves, zones, targets,
//     downloads, tokens); the floor stays (blocks, stairs, ceilings, pads and orbs — a pad is a spring in the ground);
//     floor that only exists in the game's terms (a power-gated floor, a dormant text, a fake ledge, a crumbling / blinking /
//     expiring / hidden one) is made plain, always-there floor, so the ground he travels is the ground you see.
//   · cutscenes: def.cutscenes and the outro dance are dropped (makeCourse still fills the floor under where they were),
//     the pre-song opener (def.preroll) is dropped, hints are dropped.
//   · Potato can't die (die() is a no-op) and a fall into the dark throws him back up (so the song always plays out).
//   · a mode level (run/modes/*.mjs) reads def.blank itself and switches off its own enemies / score / banners
//     (see each mode's `BLANK` notes), and its story layer reads it from the same switch.
// What each level keeps / loses: game/playthroughs/README.md.
export const BLANK_Q = typeof location !== 'undefined' && /[?&]blank(=|&|$)/.test(location.search || '');
export const isBlank = C => !!(BLANK_Q || (C && C.def && C.def.blank) || (C && C.blank));

const GONE = new Set(['word', 'spike', 'hurdle', 'wall', 'spam', 'packet', 'token', 'beam', 'wave', 'zone', 'target', 'ghost']);
export function blankify(D, id) {
  if (!D || D.blank === false) return D;
  const objs = (D.objs || []).filter(o => !GONE.has(o.k)).map(o => o.k !== 'block' ? o : { ...o,
    needs: undefined, wakeBy: undefined, dormant: false, fake: false, lie: false, crumble: 0, blink: null, expire: null, hidden: false });
  const out = { ...D, blank: true, objs, preroll: 0, hints: null, outro: D.outro === false ? false : 'blank' };
  // a runner level's glitch / power / duck presses only ever answered a threat (a firewall, a gate, a hanging word): the blank run
  // keeps only his jumps (a mode level says what it keeps itself, def.blankPresses)
  if (!D.mode && !D.blankPresses) out.blankPresses = (t, k) => k === 'J';
  // (the cutscenes: makeCourse keeps their floor fill, then drops them — see core.mjs; kept here so it can fill)
  if (D.blankDef) return D.blankDef(out, id) || out;   // a level's own extra blanking (rare: see the README)
  return out;
}
// the demo's presses for a blank run: the bot's jumps (and holds / steers for the mode levels) still carry him over the drops;
// a level can drop presses that only answered a threat (def.blankPresses: a filter on [t, key])
export function blankPresses(C, presses) {
  if (!presses) return presses;
  const f = C.def.blankPresses; return f ? presses.filter(p => f(p[0], p[1])) : presses;
}

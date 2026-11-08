// Level 7 — Still Here: the castle wall at night, the antivirus dragon, and a small knight eating his way to sunrise.
// 2:39, ~181.8 bpm (a beat = 0.33 s, a bar = 1.32 s). The plan: game/stories/still-here.md (its "Album pass" wins). The rules:
// run/modes/still-here.mjs (a platformer inside the moving screen). The castle and everything drawn: story-still-here.mjs.
// Chikin (Nov 1): "still here is a token collector level, you still have to jump with the timing, but if you dont collect tokens,
// you arent 'still here'" · more, smaller tokens, a meter that can really run out, a bigger meter, move back and forth, bats
// flying around, the dragon crashing in through the roof, the debris as platforms, die in the cutscene if you're short, the
// dragon's gold refreshes the bar · castle knight all song · "the whole castle should be on fire, its potato getting through
// the firewalls" · "the dragon is antivirus software" · "the sword can be the part of the glitch power".
//
// TIMES: snapped to the song's own beat tracker (QT(q), story-still-here.mjs) and checked against the onsets — never the
// music map's `drops` (up to 0.5 s off here). WORDS: no written lyric sheet exists; the machine listen (HEARD) is shown on
// screen per Chikin ("just do the best you can with the machine ones for now"): SURE + LIKELY lines only, SKIP lines never
// (game/words/still-here.clean.md). Potato's asides are the ★ lines of stories/words/POTATO-LINES.md, all DRAFT.
//
// BEAT SHEET (time · the music / the words · what happens)        CUT = control taken (letterbox) · BEAT = the world does one thing
//    0.00–5.03  fiddle alone                CS1 (the opening): the castle asleep, the scan beam drifting; push in on a dot of light on
//                                           the wall — him, in the knight's helmet; the beam slides over him, he side-eyes it
//    5.03  the first soft hit               control: he runs along the wall-walk (the screen moves all song but the fight)
//    6.68 · 8.00  fiddle phrase             two fallen stones, a token arc over each: jump (TEACH)
//    9.98  "kitchen light"                  a glowing grate: it throws him up through a column of tokens (TEACH)
//   11.97  "under"                          a low burning beam, a token under it: duck (TEACH)
//   13.2–14.6                               the white scan beam sweeps over him: harmless, he side-eyes it (CALM)
//   14.94–16.6  build                       a token row on the beats: the gauge fills
//   17.59 · 18.91  "i never sit down"       a torch bracket shakes loose two tokens BEHIND him, then two ahead: ← (TEACH)
//   22.21 → 23.54  "they count my days…"    the floor glows red four beats, then the castle's own firewall sweeps the wall: Space =
//                                           his glitch, and the sword pops out with it (TEACH)
//   26.49  "i count the jokes…"             a pale bat with a coin in its feet: Space as it comes — the sword cuts it, the coin drops
//   28.4–31.0                               a huge shadow sweeps over the wall-walk (CALM)
//   31.73  THE LIFT (bass in)               the scan beam stops on him and turns red: SCAN: 1 THREAT, a red ring; a clear bar
//   33.0–39.6  pre-chorus                   stones, a bat, the firewall on "not a mascot" (36.34), a beam, a bat
//   39.63–42.27  the band drops out         CUT CS2: the dragon pulls up over the keep, its eye locks on him: THREAT FOUND
//   42.27  CHORUS 1                         it swoops low, a tower roof bursts into flame; 1.2 s clear
//   44.57 · 49.18 · 55.10 · 60.70           its breath: four firewalls on the beat (each with four beats of red floor first)
//   50.50  held "still"                     a grate four beats after the fire: big tokens up its column
//   58.72  "gold chain"                     a burning chandelier swings down: duck (or cut it)
//   63.33  THE QUIET (bass gone)            the dragon perches on the keep; the meter drains twice as fast: eat or fade
//   65.0  "they check the meter"            the scan beam lands on him: BALANCE nn% beside him, live; the gauge's line at 60% appears
//   70.94–73.9  "i am the heater"           BEAT CS3: his light flares — above the line the dragon flinches and a chest plate cracks
//                                           off; below it he gutters. Then it breathes in, pulling the torch flames to its mouth
//   73.90  VERSE 2                          one breath across the whole skyline: every tower burns; 1.3 s of empty wall
//   75–88  verse 2                          burning beams fall from the towers (duck), bats flushed out
//   78.8–80.44  "deep rest is a nap, not a grave"   the torches gutter, then flare on "not a grave"
//   81.80 · 84.43 · 87.07  "the ones i save"        three iron cages, each a small warm light: Space — it stays with him
//   88.38  BRIDGE "do not call me small"    the fire throws his shadow up the keep, a little taller every beat (CALM)
//   91.30  "i built…"                       on the hit his shadow stands as tall as the towers
//   95.55  stop-time                        the dragon hovers in the smoke; its claw's shadow rises over him for four beats…
//   97.60 · 100.23 · 102.87                 …and rakes the stones where he stands, on each stab: be in the air (the rubble spills
//                                           a token or two). "if i go quiet, i am not gone": his visor dims, back on "gone"
//  104.18 → 105.50  CHORUS 2               it climbs and dives, red floor, the firewall on the drop; 106.82 a grate; bats
//  110.77–111.76  "the last light blinks"  QUARANTINE: iron shutters slam over every window in four steps; the castle goes black
//  111.8–114.40  "i do not disappear"      two bars of dark: only his visor and the lights he saved; a red line in the dark
//  114.40                                   the firewall tears through the dark; 115.73 a grate lifts him into the breakdown
//  116.06–124.68  breakdown                 red smoke, a timber roof over the wall-walk; slow arcs of tokens: the last food
//  124.68  the dive                         no more tokens. the timbers shake on the kicks
//  126.67  THE SIEGE                        CUT CS4: the dragon crashes through the roof; three slabs land on the kicks (a stair);
//                                           the screen stops — the arena. The meter keeps draining (no food from here)
//  128.0–137.2  THE FIGHT                   head up, throat glowing (red floor three beats) → breath (glitch) → its head slams down
//                                           beside the top slab, eye open two beats → sword it: crack (130.63, 133.28, 136.25)
//  137.24  the hush                         CUT CS5: it rears back, cracked eye spinning QUARANTINE, and breathes in — his tokens
//                                           stream to its mouth as gold. Short on tokens = he gutters out here. The cue ring ticks
//  142.50  THE DROP                         Space: the sword pops out huge and cuts the eye — CS6: it bursts into gold, the fires go
//                                           out in a ring from him (a miss: scorched, it breathes again 4 beats later, ×3)
//  143.86–147.84  the loudest stretch       the dragon's gold rains over the arena (6 + 8 per crack): catch it, the gauge refills
//  147.84–150.50  the stop                  BEAT CS7: grey smoke, the last embers; he looks out at the hills
//  150.50  THE SLAM                         the sun breaks; the shutters spring open down the keep; the wall scrolls again
//  150.5–155.8  the band plays out          the sunrise lap: ember piles (his light puts them out), the last tokens
//  155.79–end   the band stops              CS8 (the ending): he turns to us; the banner's last stitch (purple) flies up from him
import { story, live, Q, QT, modeView } from './story-still-here.mjs';
import { mode } from '../modes/still-here.mjs';
export const parseWords = () => [];
export const meta = { id: 'still-here', n: 7, title: 'Still Here', place: 'the castle wall', song: 'songs/still-here.mp3',
  map: 'songs/still-here.map.json', words: null, viz: 'songs/still-here.viz.json' };

// the machine listen: [start s, word] (faster-whisper 'small', two passes, Oct 31; game/words/still-here.clean.md)
const HEARD = [
  [9.50, 'kitchen'], [10.36, 'light,'], [11.68, 'dirt'], [12.12, 'under'], [12.66, 'the'], [13.06, 'crown'],
  [14.44, 'round'], [15.12, 'body,'], [15.50, 'sharp'], [15.74, 'mouth'], [16.76, 'i'], [17.06, 'never'], [17.60, 'sit'], [18.02, 'down'],
  [20.04, 'they'], [20.36, 'count'], [20.72, 'my'], [21.00, 'days'], [21.88, 'like'], [22.50, 'i'], [22.82, 'am'], [23.50, 'a'], [23.66, 'bill'],
  [25.40, 'i'], [25.66, 'count'], [26.04, 'the'], [26.24, 'jokes'], [26.66, 'that'], [27.18, 'they'], [27.64, 'still'], [28.00, 'pay'], [28.38, 'the'], [28.62, 'till'],
  [30.70, 'fiddle'], [31.44, 'the'], [31.76, 'rafters,'], [32.36, 'cello'], [32.72, 'on'], [32.88, 'the'], [32.98, 'floor'],
  [33.68, 'i'], [33.90, 'like'], [34.18, 'a'], [34.36, 'thief'], [34.56, 'who'], [34.86, 'already'], [35.20, 'stole'], [35.48, 'more'],
  [36.02, 'not'], [36.12, 'a'], [36.34, 'mascot,'], [37.28, 'not'], [37.44, 'a'], [37.60, 'snack'], [37.80, 'on'], [38.16, 'the'], [38.26, 'plate'],
  [38.84, 'i'], [38.94, 'keep'], [39.18, 'the'], [39.38, 'score'], [39.70, 'and'], [40.14, 'i'], [40.26, 'never'], [40.50, 'run'], [40.84, 'late'],
  [41.60, 'still'], [41.90, 'here,'], [43.12, 'still'], [44.44, 'here'],
  [47.32, 'the'], [47.48, 'last'], [47.80, 'light'], [48.06, 'blinks,'], [48.62, 'i'], [48.78, 'do'], [49.04, 'not'], [49.38, 'disappear'],
  [50.18, 'still'], [52.38, 'here,'], [53.40, 'still'], [54.98, 'here'],
  [56.12, 'irish'], [57.66, 'string,'], [58.78, 'gold'], [59.10, 'chain,'], [59.78, 'i'], [60.06, 'am'], [60.26, 'still'], [60.54, 'here'],
  [64.96, 'they'], [65.14, 'check'], [65.54, 'the'], [65.76, 'meter,'], [66.62, 'i'], [67.94, 'am'], [68.16, 'still'], [68.46, 'here'],
  [70.18, 'i'], [70.56, 'am'], [70.88, 'the'], [71.10, 'heater'],
  [73.10, 'classical'], [73.66, 'bow'], [74.14, 'over'], [74.60, 'a'], [74.90, 'dirty'], [75.06, 'snare'],
  [75.84, 'they'], [76.06, 'want'], [76.36, 'cute,'], [76.78, 'i'], [76.82, 'sell'], [77.10, 'truth'], [77.36, 'with'], [77.66, 'a'], [77.82, 'glare'],
  [78.79, 'deep'], [79.02, 'rest'], [79.40, 'is'], [79.64, 'a'], [79.82, 'nap,'], [80.14, 'not'], [80.26, 'a'], [80.44, 'grave'],
  [80.90, 'i'], [81.02, 'spend'], [81.26, 'my'], [81.64, 'breath'], [81.96, 'on'], [82.28, 'the'], [82.42, 'ones'], [82.70, 'i'], [82.96, 'save'],
  [83.42, 'no'], [83.62, 'takeover'], [84.28, 'speech,'], [84.78, 'no'], [84.92, 'faking'], [85.48, 'pose'],
  [86.16, 'i'], [86.26, 'hide'], [86.52, 'the'], [86.68, 'real'], [86.96, 'thing'], [87.26, 'inside'], [87.84, 'the'], [88.16, 'joke'],
  [88.44, 'call'], [88.94, 'me'], [89.22, 'potato,'], [90.02, 'do'], [90.12, 'not'], [90.30, 'call'], [90.58, 'me'], [90.82, 'small'],
  [91.16, 'i'], [91.54, 'built'], [91.90, 'a'], [92.12, 'light'], [92.36, 'from'], [92.76, 'a'], [92.94, 'spark'], [93.20, 'in'], [93.48, 'the'], [93.66, 'hall'],
  [94.04, 'harp'], [94.68, 'in'], [94.80, 'the'], [94.96, '808,'], [95.50, 'church'], [95.80, 'in'], [96.12, 'the'], [96.24, 'club'],
  [96.52, 'i'], [96.84, 'laugh'], [97.26, 'at'], [97.42, 'the'], [97.54, 'cliff'], [97.82, 'that'], [98.10, 'i'], [98.24, 'climb'], [98.50, 'the'], [98.74, 'mud'],
  [99.04, 'if'], [99.58, 'i'], [99.80, 'go'], [100.04, 'quiet,'], [100.74, 'i'], [100.94, 'am'], [101.14, 'not'], [101.46, 'gone'],
  [101.80, 'close'], [102.02, 'book'], [102.44, 'on'], [102.72, 'the'], [102.82, 'table,'], [103.16, 'still'], [103.38, 'the'], [103.66, 'same'], [104.02, 'song'],
  [104.54, 'still'], [105.12, 'here,'], [106.16, 'still'], [107.64, 'here'],
  [110.00, 'when'], [110.56, 'the'], [110.74, 'last'], [111.04, 'light'], [111.30, 'blinks,'], [111.88, 'i'], [112.00, 'do'], [112.28, 'not'], [112.60, 'disappear'],
  [115.40, 'still'], [115.96, 'here,'], [116.64, 'still'], [118.18, 'here'],
  [119.50, 'i'], [120.64, 'irish'], [121.02, 'string,'], [121.90, 'gold'], [122.34, 'chain,'], [123.06, 'i'], [123.28, 'am'], [123.54, 'still'], [123.80, 'here'],
];
// SKIP lines (never shown): "i like a thief who already stole more" (33.68), "the mud" (98.50), the stray "i" (119.50)
const SKIP = [[33.6, 35.6], [98.45, 98.8], [119.45, 119.55]];
// lines split where the clean file splits them (start times of each shown line)
const LINES = [9.50, 14.44, 16.76, 20.04, 25.40, 30.70, 36.02, 38.84, 41.60, 47.32, 50.18, 56.12, 64.96, 70.18, 73.10, 75.84, 78.79, 80.90, 83.42, 86.16,
  88.44, 91.16, 94.04, 96.52, 99.04, 101.80, 103.16, 104.54, 110.00, 115.40, 120.64];
export { Q, QT };
export function heardWords() {      // -> [{t0, t1, line, word}], on the real beat where a word lands near one; SKIP lines dropped
  const out = [];
  for (const [t, w] of HEARD) { if (SKIP.some(([a, b]) => t >= a && t < b)) continue; let line = 0; for (let i = 0; i < LINES.length; i++) if (t >= LINES[i] - 0.01) line = i + 1;
    const q = Q(t), tq = Math.abs(q - Math.round(q)) < 0.3 ? QT(Math.round(q)) : t; out.push({ t0: +tq.toFixed(3), line, word: w }); }
  out.forEach((w, i) => { const n = out[i + 1]; w.t1 = Math.min(w.t0 + 1.2, n ? Math.max(w.t0 + 0.12, n.t0) : w.t0 + 0.6); });
  return out;
}

export function build(_, map) {
  const P = map.period, T = q => +QT(q).toFixed(3);
  const stones = [], grates = [], beams = [], bats = [], cages = [], sweeps = [], claws = [], tokens = [], spawns = [], embers = [], hops = [];
  // every token carries how you get it (cat): 'floor' = on his path (running eats it) · 'hop' = an arc that needs a jump ON the beat
  // · 'stone' = the arc over a stone (the hop you make anyway) · 'grate' / 'beam' · 'high' = off the path. (Chikin: "you still have to
  // jump with the timing, but if you dont collect tokens, you arent 'still here'": about half the food needs a timed jump or a turn back)
  const tok = (t, y, big = false, ox = 0, cat = 'floor') => tokens.push({ t: +t.toFixed(3), y, big, ox, cat });
  const row = (q0, q1, step = 2, y = 0.55, big = false) => { for (let q = q0; q <= q1 + 1e-6; q += step) tok(T(q), y, big); };
  // tokens along a jump that leaves the floor at tj: he's at the top of it a beat later (all of them above his standing reach)
  const along = (tj, n, big, cat) => { for (let j = 0; j < n; j++) { const u = n === 1 ? 0.5 : j / (n - 1), tau = P * (0.45 + 1.1 * u), h = 1.7 * 4 * (tau / 0.66) * (1 - tau / 0.66);
    tok(tj + tau, 0.62 + h, j === big, 0, cat); } };
  const hop = (q, n = 5, big = 2) => { hops.push(T(q)); along(T(q), n, big, 'hop'); };   // jump ON beat q (the arc shows the way)
  const high = (q, n = 2, y = 2.45) => { for (let j = 0; j < n; j++) tok(T(q) + j * 0.5 * P, y, false, 0, 'high'); };
  const stone = (q, o = {}) => { stones.push({ t: T(q), ...o }); along(T(q) - P, o.n ?? 3, o.big ?? -1, 'stone'); };
  const grate = (q, bigs = 1) => { grates.push(T(q)); const t0 = T(q) - 0.06;
    [[0.18, false], [0.42, bigs >= 1], [0.66, bigs >= 2], [0.86, false]].forEach(([tau, big]) => tok(t0 + tau, 0.65 + 14.6 * tau - 15.6 * tau * tau, big, 0, 'grate')); };
  const beam = (q, o = {}) => { beams.push({ t: T(q), ...o }); if (o.tok !== false) tok(T(q), 0.32, false, 0, 'beam'); };
  const bat = (q, o = {}) => bats.push({ t: T(q), ...o });
  const sweep = (q, kind = 'dragon', warn = 4) => sweeps.push({ t: T(q), kind, warn });
  const drop = (q, ox, big = false, y = 3.1) => spawns.push({ t: T(q), ox, y, big, vy: 0.5 });   // (ox < 0: it lands behind him: ←)

  // ---------- TEACH (5.03–31.73): one thing at a time, quiet music, slow on purpose. He starts hungry (45%): the jar fills ----------
  stone(20); stone(24);                                   // jump
  grate(30, 1);                                           // the glowing grate (no flames: it never looks like fire)
  beam(36, { kind: 'beam' });                             // duck
  row(39, 43);                                            // (the scan beam sweeps over him, harmless)
  row(45, 50, 1);                                         // the row: the gauge fills
  drop(53, -1.35); drop(53.5, -0.7, true);                // the bracket shakes two loose BEHIND him: ←
  drop(57, 3.2, false, 3.4); drop(57.5, 3.9, true, 3.4);  // …then two ahead
  row(59, 61); hop(64);                                   // the first arc in the air: jump on the beat (a big one at its top)
  sweep(71, 'castle');                                    // the castle's own firewall (red floor from 67): glitch + sword
  row(72, 76);
  bat(80, { big: true });                                 // the first bat (a coin in its feet)
  stone(84, { big: 1 });
  row(86, 88); hop(90); row(93, 94, 1);                   // the shadow overhead (calm)
  // ---------- FOUND (31.73–39.63) ----------
  row(97, 99); stone(103); bat(106);
  hop(108);
  sweep(110, 'castle');                                   // "not a mascot"
  row(111, 113); beam(115);
  bat(118);
  // ---------- CS2 39.63–42.27 · CHORUS 1 (42.27–63.33) ----------
  sweep(135);                                             // breath 1 ("still… here")
  row(136, 138); hop(140);
  stone(145);                                             // "the last light blinks": one easy hop
  sweep(149);                                             // "disappear"
  drop(150, -1.6, true);                                  // a burning tile spits a coin behind him
  grate(153, 2);                                          // held "still": the fire meant to stop him feeds him
  bat(158); row(160, 162); hop(163, 4, -1);
  sweep(167);
  stone(171); bat(174, { hi: 0.95 });
  beam(178, { kind: 'chandelier', w: 1.25, y0: 0.82 });   // "gold chain"
  sweep(184);                                             // a second tower catches
  row(185, 187); hop(189);
  // ---------- THE QUIET (63.33–70.94): hunger, not hazards — the floor is bare, the food is up in the air ----------
  row(193, 195); hop(196);
  stone(199, { big: 1 });
  row(201, 203); hop(204); bat(206, { hi: 1.0 });
  stone(209); hop(212); row(214, 214);
  // ---------- CS3 (70.94–73.90) is a BEAT: nothing arrives · VERSE 2 (73.90–88.38) ----------
  row(226, 228); beam(230, { kind: 'falling', fall: T(230) });
  bat(233); row(234, 235, 1);
  beam(237, { kind: 'falling', fall: T(237) });
  row(238, 240); stone(242);                              // "deep rest is a nap": one hop
  hop(245); drop(246, -1.5);
  cages.push(T(248)); row(249, 251); bat(252); row(254, 254);
  cages.push(T(256)); row(257, 258, 1); beam(260, { kind: 'falling', fall: T(260) });
  hop(262); cages.push(T(264)); row(265, 267);
  // ---------- BRIDGE (88.38–95.55): calm, his shadow climbs the keep ----------
  row(269, 273); hop(275); row(277, 279); stone(281, { big: 1 }); row(283, 285); stone(288);
  // ---------- STOP-TIME (95.55–104.18): the claw (each rake spills a coin behind him and a big one ahead) ----------
  claws.push(T(296), T(304), T(312));
  row(291, 293); hop(299); row(307, 309);
  // ---------- CHORUS 2 (104.18–110.77) ----------
  sweep(320); grate(324, 2);
  row(327, 331); bat(328); bat(331, { hi: 0.95 }); drop(330, -1.4, true); stone(334);
  // ---------- QUARANTINE (110.77–116.06) ----------
  row(337, 341); sweep(347); grate(351, 1);
  // ---------- BREAKDOWN (116.06–124.68): the last food — and not much of it: up in the air, or behind him ----------
  hop(355); row(359, 361); high(363, 2, 2.5); drop(364, -1.5, true);
  hop(367); row(371, 373);
  stone(376, { big: 1 });
  // ---------- THE FIGHT (126.67–137.24): breath (glitch) · its jet over the stair (get low) · its jet along the floor (get up) ----------
  sweeps.push({ t: T(392), kind: 'boss', warn: 3 }, { t: T(400), kind: 'boss', warn: 3, jet: 'high' }, { t: T(408), kind: 'boss', warn: 3, jet: 'low' });
  const fight = {
    t0: T(384), ctl: T(388), hush: T(416), oxMax: 6.0,
    slabs: [{ land: 127.08, ox0: 1.25, ox1: 2.65, top: 0.62 }, { land: 127.63, ox0: 2.95, ox1: 4.15, top: 1.3 }, { land: 127.95, ox0: 4.45, ox1: 5.95, top: 2.0 }],
    eye: { ox: 6.75, y: 3.4 },                            // (high: only from up the stair)
    windows: [{ i: 0, a: T(396), b: T(398) + P, best: T(396) }, { i: 1, a: T(404), b: T(406) + P, best: T(404) }, { i: 2, a: T(412), b: T(414) + P, best: T(413) }],
  };
  // the dragon's gold: [delay after CS6 starts, arena x] — 30 pieces (6 + 8 per crack), spread so every one can be reached
  const gold = []; for (let i = 0; i < 30; i++) { const r = Math.sin(i * 12.9898 + 4.1) * 43758.5453, u = r - Math.floor(r); gold.push({ dt: 0.1 + i * 0.105, ox: -1.2 + ((i * 0.618 + u * 0.35) % 1) * 7.0 }); }
  // ---------- SUNRISE LAP (150.50–155.79) ----------
  for (let q = 458; q <= 470; q += 2) embers.push(T(q) + 0.5 * P);
  row(457, 470, 1, 0.55); high(461); high(465);

  const E = 158.43;
  const castle = {
    meterStart: 0.45, lapFrom: T(456), emberFrom: T(448), line: 0.6, lineFrom: 65.0, retryFloor: 0.45, retryStep: 0.15, flareT: 71.10, cold: 5.03, endT: T(472),
    // the drain per second (paused in cutscenes, except the crash and the hush); 0 after the kill
    drain: [[0, 0], [5.03, 0.02], [31.73, 0.035], [42.27, 0.032], [63.33, 0.06], [70.94, 0.034], [116.06, 0.02], [124.68, 0.02], [T(416), 0.045]],
    hushMiss: 0.012, wasteFrom: 22.2,   // (an empty glitch is free until the first firewall's red floor)   // (the hush eats this much more per second for every eye he didn't crack)
    // (tuned with tools/bot-still-here.mjs SKILL=good|regular|sloppy|required: a regular player gets through with a little left;
    // a player who only does what's required, or a sloppy one, runs dry in the fight or the hush)
    stones, grates, beams, bats, cages, sweeps, claws, tokens, spawns, embers, fight, gold, hops,
    fightCam: { zoom: 0.8, y: 2.7, cx: 4.3 },   // (the fight pulls back: the whole dragon, the stair and him)
    kill: { hits: [142.50, T(436), T(440)], early: 0.22, late: 0.30, cs6: 1.36, end: T(436) },
    cuts: [[0, 5.03, 'cold', { push: 0 }], [T(120), T(128), 'found', { push: 0.9 }], [T(384), T(388), 'crash', { drain: true, push: 0 }],
      [T(416), T(436), 'kill', { drain: true, push: 0.15 }], [T(472), E + 2, 'end', { push: 0.85 }]],
    retry: [5.03, 31.73, 39.63, 63.33, 70.94, 88.38, 95.55, 103.85, 116.06],
    calm: [[13.2, 14.6], [28.4, 31.0], [63.33, 73.9], [88.38, 95.55], [111.8, 114.4], [147.84, 150.5]],
    shutters: [T(336), T(337), T(338), T(339)], dark: [T(339), T(347)], lift: 31.73, chorus: 42.27, verse2: 73.90, bridgeHit: 91.30, siege: T(384),
    asides: [[1.2, 4.7, '> somebody’s scared of something.'], [32.2, 34.6, '> threat. me? fair.'], [65.5, 68.0, '> running on crumbs.', 'low'],
      [118.0, 120.6, '> snack. then dragon.'], [156.3, 158.4, '> scan complete. still here.']],
    perfect: 32361,   // (the bot's run: tools/bot-still-here.mjs)
  };
  live.castle = castle;
  const words = heardWords();
  return {
    mode, modeView, story, speed: 1, objs: [], boosts: [], outro: false,
    blankPresses: (t, k) => !/G/.test(k),   // (?blank, run/blank.mjs: no glitch / sword — nothing to pass or cut; his runs + jumps stay)
    touchMode: 'tapdrag', noV: true,   // (a phone: drag = run / jump / duck, a quick tap or a second finger = Space; no V anywhere)
    retryAt: t => { let r = castle.retry[0]; for (const v of castle.retry) if (t >= v - 0.01) r = v; return r; },
    lights: () => 0,
    costume: 'castle-knight',                       // the knight from the first frame to the last (Chikin: "he needs to stay in costume")
    castle,
    deathText: s => s.why === 'deep rest' ? '> low balance. deep rest. not gone.' : s.why,   // (DRAFT, POTATO-LINES 7 fail card)
    cutscenes: castle.cuts.map(([a, b, n]) => [a, b, n === 'end' ? 'dance' : n === 'cold' ? 'float' : 'watch']),   // (the end dances its last bars; 'watch' = no wave: he never waves at the antivirus — arms only on jumps / spins)
    sections: [['the wall', 0, 4.2], ['found', 31.73, 4.8], ['chorus', 39.63, 4.8], ['the quiet', 63.33, 4.8], ['burning', 70.94, 5.2], ['the bridge', 88.38, 4.8],
      ['the claw', 95.55, 4.6], ['chorus 2', 103.85, 5.0], ['quarantine', 110.77, 5.0], ['smoke', 116.06, 4.4], ['the fight', T(384), 0], ['the cut', T(428), 0],
      ['dawn', T(448), 0], ['sunrise', T(456), 3.6], ['still here', T(472), 0]],
    faces: [[5.1, 'determined', 1.0], [13.5, 'skeptical', 1.1], [28.6, 'oh', 1.0], [31.8, 'question', 1.0], [39.8, 'wide', 1.6], [42.3, 'shock', 0.8],
      [63.5, 'thinking', 1.0], [73.95, 'scream', 0.8], [79.0, 'sleepy', 1.0], [80.45, 'grin', 0.8], [88.5, 'determined', 1.6], [91.32, 'proud', 1.2],
      [95.7, 'focused', 1.6], [99.1, 'focused', 1.5], [101.5, 'grin', 0.8], [110.8, 'oh', 1.0], [112.4, 'determined', 1.6], [116.2, 'focused', 1.0],
      [126.7, 'shock', 1.0], [137.3, 'focused', 3.6], [147.9, 'warm', 2.4], [150.55, 'joy', 1.4], [155.9, 'skeptical', 1.3], [157.3, 'smirk', 3]],
    theme: { backdrop: 'plain', bg: '#07060d', camFix: 2.0, viewH: 6.0, igOff: true, decor: [], lyricArt: false, noBeatSpin: true, noPunch: true, noGhost: true,
      pulse: false, beamsOut: true, modeCam: true, csLift: 0, csZoom: 1,
      lyricKeys: ['still', 'here', 'meter', 'heater', 'grave', 'save', 'small', 'gone', 'disappear', 'chain'], lyricY: 0.05,
      edge: '#ffcf8a', light: '#ffcf8a', light2: '#c9d3e0', halo: '#ffe0b0', word: '#f1f4f8', token: '#ffcf4a', digit: '#2a1c18', digit2: '#ffb45a' },
    signs: words.map(w => ({ t0: w.t0, t1: w.t1, text: w.word, line: w.line })),
    end: E, start: 0,
  };
}
